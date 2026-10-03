// Dispatch ownership: an attempt is executed by one dispatcher, and uncertain
// work is never re-run silently. Evidence class: engine tests (offline). The
// counts below are real fake-transport invocations recorded by separate
// processes, not journal events.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { PACKAGE_ROOT, type TestRun, eventTypes, newRun, pendingOf, result } from './support/harness.ts';

const CHILD = join(PACKAGE_ROOT, 'tests', 'support', 'driver-child.ts');

interface ChildOut {
  status: number | null;
  stopped: string | null;
  code: string | null;
}

function childArgs(run: TestRun, log: string, mode: string, delay: number): string[] {
  return [CHILD, run.workspace, run.runId, log, mode, String(delay)];
}

function parse(status: number | null, stdout: string): ChildOut {
  try {
    const out = JSON.parse(stdout) as { stopped: string; code: string };
    return { status, stopped: out.stopped, code: out.code };
  } catch {
    return { status, stopped: null, code: null };
  }
}

function driverAsync(run: TestRun, log: string, delay: number): Promise<ChildOut> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, childArgs(run, log, 'drive', delay), { stdio: ['ignore', 'pipe', 'inherit'] });
    let stdout = '';
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.on('error', reject);
    child.on('close', (status) => resolvePromise(parse(status, stdout)));
  });
}

function driverSync(run: TestRun, log: string, mode: string): ChildOut {
  const r = spawnSync(process.execPath, childArgs(run, log, mode, 0), { encoding: 'utf8' });
  return parse(r.status, r.stdout);
}

function invocations(log: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const line of readFileSync(log, 'utf8').split('\n').filter(Boolean)) {
    const attempt = line.split(' ')[1] as string;
    counts[attempt] = (counts[attempt] ?? 0) + 1;
  }
  return counts;
}

function newLog(run: TestRun): string {
  const log = join(run.workspace, 'invocations.log');
  writeFileSync(log, '');
  return log;
}

test('two cooperating driver processes never both invoke the transport for one attempt', async () => {
  for (let round = 0; round < 3; round++) {
    const run = await newRun('two-drivers');
    const log = newLog(run);
    // Each invocation takes 300 ms, so the second driver asks for work while the first is still executing.
    const outs = await Promise.all([driverAsync(run, log, 300), driverAsync(run, log, 300)]);
    const counts = invocations(log);
    assert.ok(Object.keys(counts).length >= 1, 'at least one invocation happened');
    for (const [attempt, n] of Object.entries(counts)) assert.equal(n, 1, `${attempt} was invoked ${n} times`);
    assert.ok(outs.some((o) => o.stopped === 'IN_FLIGHT'), 'one driver was told the attempt is in flight and stopped');
    for (const o of outs) assert.equal(o.status, 0);
    const dispatched = eventTypes(run).filter((t) => t === 'task_dispatched').length;
    assert.equal(dispatched, Object.keys(counts).length, 'every dispatched attempt was invoked exactly once');
  }
});

test('a dispatcher killed after the invocation started leaves the attempt in flight; nothing re-runs it silently', async () => {
  const run = await newRun('died-in-transport');
  const { engine } = run.assembly;
  const log = newLog(run);

  assert.notEqual(driverSync(run, log, 'die-in-transport').status, 0, 'the first driver was killed');
  const first = Object.keys(invocations(log));
  assert.equal(first.length, 1);
  const attempt = first[0] as string;
  assert.equal(invocations(log)[attempt], 1);

  // A second driver, resume, and repeated requests for work must not invoke it again.
  const second = driverSync(run, log, 'drive');
  assert.equal(second.stopped, 'IN_FLIGHT');
  assert.equal(engine.resume(run.runId).code, 'RESUMED');
  const again = engine.next(run.runId);
  assert.equal(again.code, 'PENDING_IN_FLIGHT');
  assert.equal(again.dispatch, 'IN_FLIGHT');
  assert.equal(invocations(log)[attempt], 1, 'still exactly one invocation');
  assert.equal(eventTypes(run).filter((t) => t === 'task_dispatched').length, 1);

  // The uncertainty is resolved only by an explicit, recorded act.
  assert.equal(engine.abandon(run.runId, 'not-the-attempt', 'x').code, 'NOT_PENDING');
  const envelope = pendingOf(again);
  const abandoned = engine.abandon(run.runId, attempt, 'dispatcher process was killed');
  assert.equal(abandoned.code, 'FAILURE_RECORDED');
  const failed = JSON.parse(readFileSync(join(run.runDir, 'journal.jsonl'), 'utf8').trim().split('\n').at(-1)!.slice(65)) as {
    type: string;
    data: { kind: string };
  };
  assert.equal(failed.type, 'attempt_failed');
  assert.equal(failed.data.kind, 'EXECUTION_UNCERTAIN');

  // The replacement has a new identity; a late result from the abandoned attempt is stale.
  const replacement = engine.next(run.runId);
  assert.equal(replacement.dispatch, 'GRANTED');
  assert.notEqual(pendingOf(replacement).attempt_id, attempt);
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'STALE_ATTEMPT');
});

test('a dispatcher killed between committing the dispatch and receiving the grant does not cause an invocation', async () => {
  const run = await newRun('died-after-dispatch');
  const log = newLog(run);
  assert.notEqual(driverSync(run, log, 'die-after-dispatch').status, 0);
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched'], 'the dispatch was committed');
  assert.deepEqual(invocations(log), {}, 'nobody invoked the transport');

  const second = driverSync(run, log, 'drive');
  assert.equal(second.stopped, 'IN_FLIGHT', 'the grant is not handed out a second time');
  assert.deepEqual(invocations(log), {});
});

test('a result held by the original dispatcher is still accepted while the attempt is in flight', async () => {
  const run = await newRun('in-flight-submit');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  assert.equal(engine.next(run.runId).dispatch, 'IN_FLIGHT');
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'ACCEPTED');
});
