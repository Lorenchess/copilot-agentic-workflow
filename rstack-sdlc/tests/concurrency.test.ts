// Competing writers and lock handling. Evidence class: engine tests
// (offline). Competing writers are separate operating-system processes.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  type TestRun,
  cliAsync,
  deadPid,
  decision,
  eventTypes,
  journalText,
  newRun,
  pendingOf,
  result,
  toHumanWait,
  writeTemp,
} from './support/harness.ts';

const lockPath = (run: TestRun): string => join(run.runDir, 'lock');
const args = (run: TestRun, command: string, file: string): string[] => [command, '--workspace', run.workspace, '--run', run.runId, '--file', file];

test('CORE-3: two processes submit different results for one attempt; exactly one is accepted', async () => {
  for (let round = 0; round < 3; round++) {
    const run = await newRun('race-submit');
    const envelope = pendingOf(run.assembly.engine.next(run.runId));
    const a = writeTemp(run, 'a.json', result(envelope, { summary: 'answer A' }));
    const b = writeTemp(run, 'b.json', result(envelope, { summary: 'answer B' }));
    const replies = await Promise.all([cliAsync(args(run, 'submit', a)), cliAsync(args(run, 'submit', b))]);
    const codes = replies.map((r) => r.reply.code).sort();
    assert.deepEqual(codes, ['ACCEPTED', 'CONFLICTING_DUPLICATE']);
    assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched', 'result_accepted'], 'one transition, no merge');
    assert.equal(run.assembly.engine.status(run.runId).state_version, 3);
  }
});

test('CORE-3: two processes record different decisions against one expected version; exactly one is accepted', async () => {
  for (let round = 0; round < 3; round++) {
    const run = await newRun('race-decide');
    const waiting = toHumanWait(run);
    const a = writeTemp(run, 'a.json', decision(waiting, { decision_id: 'DA', action: 'proceed' }));
    const b = writeTemp(run, 'b.json', decision(waiting, { decision_id: 'DB', action: 'reject' }));
    const replies = await Promise.all([cliAsync(args(run, 'decide', a)), cliAsync(args(run, 'decide', b))]);
    const codes = replies.map((r) => r.reply.code).sort();
    assert.deepEqual(codes, ['DECISION_RECORDED', 'STALE_STATE_VERSION']);
    assert.equal(eventTypes(run).filter((t) => t === 'decision_recorded').length, 1);
  }
});

test('two processes request work at once; one attempt is created and both receive it', async () => {
  const run = await newRun('race-next');
  const base = ['next', '--workspace', run.workspace, '--run', run.runId];
  const replies = await Promise.all([cliAsync(base), cliAsync(base)]);
  assert.deepEqual(replies.map((r) => r.reply.code).sort(), ['DISPATCHED', 'PENDING_IN_FLIGHT']);
  assert.deepEqual(pendingOf(replies[0]!.reply), pendingOf(replies[1]!.reply));
  assert.deepEqual(replies.map((r) => r.reply.dispatch).sort(), ['GRANTED', 'IN_FLIGHT'], 'exactly one caller may dispatch');
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched']);
});

test('a lock held by a running process is respected however old it is; waiting is bounded', async () => {
  const run = await newRun('lock-busy');
  const { engine } = run.assembly;
  const holder = { token: 'held', pid: process.pid, host: hostname(), acquired_at: '2001-01-01T00:00:00.000Z' };
  writeFileSync(lockPath(run), JSON.stringify(holder));
  const before = journalText(run);

  const started = Date.now();
  const r = engine.next(run.runId);
  const waited = Date.now() - started;
  assert.equal(r.code, 'LOCK_BUSY');
  assert.deepEqual((r.detail as { holder: unknown }).holder, holder);
  assert.ok(waited >= 350 && waited < 5000, `bounded wait, was ${waited} ms`);
  assert.equal(readFileSync(lockPath(run), 'utf8'), JSON.stringify(holder), 'lock untouched despite its age');
  assert.equal(journalText(run), before);

  // status needs no lock and reports the holder
  const status = engine.status(run.runId);
  assert.equal(status.ok, true);
  assert.deepEqual(status.lock, holder);
});

test('a lock whose holder process no longer exists is reclaimed and kept as evidence', async () => {
  const run = await newRun('lock-abandoned');
  const { engine } = run.assembly;
  // a fresh timestamp: reclaim is decided by the holder being gone, not by age
  const holder = { token: 'gone', pid: deadPid(), host: hostname(), acquired_at: new Date().toISOString() };
  writeFileSync(lockPath(run), JSON.stringify(holder));

  const r = engine.next(run.runId);
  assert.equal(r.code, 'DISPATCHED');
  assert.deepEqual(r.reclaimed_lock, holder);
  assert.deepEqual(readdirSync(join(run.runDir, 'abandoned-locks')), ['gone.json']);
  assert.ok(!existsSync(lockPath(run)), 'the lock is released after the operation');
});

test('an uncertain lock is never reclaimed: unreadable content, another host, unfinished takeover', async () => {
  const cases: [string, (run: TestRun) => void][] = [
    ['unreadable content', (run) => writeFileSync(lockPath(run), 'garbage')],
    ['empty file', (run) => writeFileSync(lockPath(run), '')],
    [
      'holder on another host, very old',
      (run) =>
        writeFileSync(
          lockPath(run),
          JSON.stringify({ token: 'remote', pid: deadPid(), host: 'some-other-host', acquired_at: '2001-01-01T00:00:00.000Z' }),
        ),
    ],
    ['takeover guard left behind', (run) => writeFileSync(join(run.runDir, 'lock.reclaim'), '{}')],
  ];
  for (const [name, arrange] of cases) {
    const run = await newRun('lock-uncertain');
    const { engine } = run.assembly;
    arrange(run);
    const lockBefore = existsSync(lockPath(run)) ? readFileSync(lockPath(run), 'utf8') : null;
    const before = journalText(run);

    const r = engine.next(run.runId);
    assert.equal(r.code, 'LOCK_UNCERTAIN', name);
    assert.equal(r.ok, false, name);
    assert.equal(existsSync(lockPath(run)) ? readFileSync(lockPath(run), 'utf8') : null, lockBefore, `${name}: lock untouched`);
    assert.ok(!existsSync(join(run.runDir, 'abandoned-locks')), `${name}: nothing reclaimed`);
    assert.equal(journalText(run), before, `${name}: no transition`);
  }
});
