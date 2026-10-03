// Journal commit, recovery, and corruption handling. Evidence class: engine
// tests (offline). Interruption is a killed process, not a power failure.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { frameEvent } from '../core/engine/journal.ts';
import {
  PACKAGE_ROOT,
  type TestRun,
  completeStep,
  eventTypes,
  journalText,
  newRun,
  pendingOf,
  result,
  writeTemp,
} from './support/harness.ts';

const journalPath = (run: TestRun): string => join(run.runDir, 'journal.jsonl');

test('CORE-2: a result committed just before the process is killed is not lost, repeated, or redispatched', async () => {
  const run = await newRun('crash');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  const raw = result(envelope);
  const file = writeTemp(run, 'result.json', raw);

  const child = spawnSync(process.execPath, [join(PACKAGE_ROOT, 'tests', 'support', 'crash-child.ts'), run.workspace, run.runId, file], {
    encoding: 'utf8',
  });
  assert.notEqual(child.status, 0, 'the child was killed');
  assert.ok(!child.stdout.includes('REPLIED'), 'no reply was produced');

  // The event is committed; the snapshot was never rewritten; the dead writer's lock remains.
  const status = engine.status(run.runId);
  assert.equal(status.state_version, 3);
  assert.equal(status.snapshot, 'STALE');
  assert.ok(status.lock, 'the killed writer left its lock');
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched', 'result_accepted']);

  // The caller never saw a reply, so it retries: same outcome, no second transition.
  const retry = engine.submit(run.runId, raw);
  assert.equal(retry.code, 'ACCEPTED');
  assert.equal(retry.duplicate, true);
  assert.equal(retry.settled_version, 3);
  assert.ok(retry.reclaimed_lock, 'the dead holder was identified and its lock reclaimed');
  assert.equal(readdirSync(join(run.runDir, 'abandoned-locks')).length, 1, 'the abandoned lock is kept as evidence');
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched', 'result_accepted']);

  const resumed = engine.resume(run.runId);
  assert.equal(resumed.snapshot_before, 'STALE');
  assert.equal(engine.status(run.runId).snapshot, 'CURRENT');
  // The next request for work moves to the following step; the accepted one is not handed out again.
  assert.equal(pendingOf(engine.next(run.runId)).attempt_id, 'spec-1');
});

test('incomplete trailing bytes are reported, preserved, then removed; they are never applied', async () => {
  const run = await newRun('tail');
  const { engine } = run.assembly;
  completeStep(run);
  const intact = journalText(run);
  const torn = frameEvent({ schema_version: 1, seq: 4, run_id: run.runId, type: 'task_dispatched', at: 'x', data: {} }).slice(0, 90);
  appendFileSync(journalPath(run), torn);

  // Read-only status reports the tail and leaves the file alone.
  const status = engine.status(run.runId);
  assert.equal(status.ok, true);
  assert.equal(status.state_version, 3);
  assert.deepEqual(status.journal, { events: 3, incomplete_tail_bytes: 90 });
  assert.equal(journalText(run), intact + torn);

  // A writer preserves the exact bytes before shortening the journal, and says so.
  const next = engine.next(run.runId);
  assert.equal(next.code, 'DISPATCHED');
  const recovered = next.recovered_tail as { bytes: number; preserved_at: string };
  assert.equal(recovered.bytes, 90);
  assert.equal(readFileSync(join(run.runDir, recovered.preserved_at), 'utf8'), torn);
  assert.ok(journalText(run).startsWith(intact));
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched', 'result_accepted', 'task_dispatched']);
  assert.equal(engine.status(run.runId).state_version, 4);
});

test('a corrupt complete record blocks every operation and is never skipped or repaired', async () => {
  const cases: [string, (lines: string[], run: TestRun) => string[]][] = [
    ['interior checksum failure', (l) => [l[0]!, l[1]!.replace('task_dispatched', 'task_dispatchex'), l[2]!]],
    // Still a valid, consistent event: only the checksum can show it was altered.
    ['record altered after it was written', (l) => [l[0]!, l[1]!.replace(/"at":"\d{4}/, '"at":"1999'), l[2]!]],
    ['corrupt final complete record', (l) => [l[0]!, l[1]!, `${l[2]!.slice(0, 80)}`]],
    ['unframed line', (l) => [l[0]!, 'not a record', l[1]!, l[2]!]],
    ['empty line', (l) => [l[0]!, '', l[1]!, l[2]!]],
    ['missing interior record (version gap)', (l) => [l[0]!, l[2]!]],
    ['duplicated record', (l) => [l[0]!, l[1]!, l[1]!, l[2]!]],
    [
      'record from another run with a valid checksum',
      (l) => [l[0]!, frameEvent({ schema_version: 1, seq: 2, run_id: 'RUN-other', type: 'task_dispatched', at: 'x', data: {} }).trimEnd(), l[2]!],
    ],
    [
      'well-formed event that contradicts the state',
      (l, run) => [
        l[0]!,
        l[1]!,
        frameEvent({
          schema_version: 1,
          seq: 3,
          run_id: run.runId,
          type: 'proposal_recorded',
          at: 'x',
          data: { proposal_ref: `sha256:${'a'.repeat(64)}`, location: 'proposal/pr-proposal.json' },
        }).trimEnd(),
      ],
    ],
  ];
  for (const [name, mutate] of cases) {
    const run = await newRun('corrupt');
    const { engine } = run.assembly;
    const envelope = pendingOf(engine.next(run.runId));
    engine.submit(run.runId, result(envelope));
    const lines = journalText(run).split('\n').filter(Boolean);
    const damaged = `${mutate(lines, run).join('\n')}\n`;
    writeFileSync(journalPath(run), damaged);

    for (const op of [
      () => engine.status(run.runId),
      () => engine.next(run.runId),
      () => engine.resume(run.runId),
      () => engine.submit(run.runId, result(envelope)),
    ]) {
      const r = op();
      assert.equal(r.ok, false, name);
      assert.equal(r.code, 'JOURNAL_CORRUPT', name);
    }
    assert.equal(journalText(run), damaged, `${name}: journal left exactly as found`);
    assert.ok(!existsSync(join(run.runDir, 'journal-tail')), `${name}: nothing was quarantined`);
  }
});

test('a journal record with an unsupported schema version blocks with a named code', async () => {
  const run = await newRun('future');
  const { engine } = run.assembly;
  const future = { schema_version: 2, seq: 2, run_id: run.runId, type: 'task_dispatched', at: 'x', data: {} };
  appendFileSync(journalPath(run), frameEvent(future as never));
  assert.equal(engine.status(run.runId).code, 'UNSUPPORTED_SCHEMA_VERSION');
  assert.equal(engine.next(run.runId).code, 'UNSUPPORTED_SCHEMA_VERSION');
});

test('the snapshot is derived: missing, stale, or edited snapshots never change the state', async () => {
  const run = await newRun('snapshot');
  const { engine } = run.assembly;
  completeStep(run);
  const snapshot = join(run.runDir, 'state.json');
  const good = readFileSync(snapshot, 'utf8');
  assert.equal(engine.status(run.runId).snapshot, 'CURRENT');

  rmSync(snapshot);
  const missing = engine.status(run.runId);
  assert.equal(missing.snapshot, 'MISSING');
  assert.equal(missing.state_version, 3);
  assert.ok(!existsSync(snapshot), 'status did not recreate it');

  // An edited snapshot that claims the run is finished is ignored.
  const forged = JSON.parse(good) as Record<string, unknown>;
  forged.phase = 'DONE';
  forged.terminal = 'PR_PROPOSAL_READY';
  writeFileSync(snapshot, JSON.stringify(forged));
  const edited = engine.status(run.runId);
  assert.equal(edited.snapshot, 'INVALID');
  assert.deepEqual(edited.directive, { kind: 'CONTINUE', pending: null });

  writeFileSync(snapshot, 'not json');
  assert.equal(engine.status(run.runId).snapshot, 'INVALID');

  const resumed = engine.resume(run.runId);
  assert.equal(resumed.snapshot_before, 'INVALID');
  assert.equal(readFileSync(snapshot, 'utf8'), good, 'rebuilt from the journal');
  assert.equal(pendingOf(engine.next(run.runId)).attempt_id, 'spec-1');
});

test('a run directory without a committed start record is reported, not guessed', async () => {
  const run = await newRun('uninitialised');
  writeFileSync(journalPath(run), '');
  assert.equal(run.assembly.engine.status(run.runId).code, 'RUN_NOT_INITIALIZED');
  assert.equal(run.assembly.engine.next(run.runId).code, 'RUN_NOT_INITIALIZED');
});
