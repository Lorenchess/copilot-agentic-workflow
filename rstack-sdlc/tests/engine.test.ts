// Engine transitions and identity checks. Evidence class: engine tests
// (offline, no model, fake results only).

import assert from 'node:assert/strict';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createFakeTransport } from '../adapters/fake-transport/index.ts';
import { driveRun } from '../core/engine/drive.ts';
import {
  APP,
  PROFILE,
  REQUEST,
  completeStep,
  decision,
  eventTypes,
  failure,
  journalText,
  newRun,
  pendingOf,
  result,
  toHumanWait,
} from './support/harness.ts';

test('synthetic sequence reaches PR_PROPOSAL_READY with publication NOT_ATTEMPTED', async () => {
  const run = await newRun('sequence');
  const { engine } = run.assembly;
  const transport = createFakeTransport(run.assembly.runsRoot);
  const first = driveRun(engine, transport, run.runId);
  assert.equal(first.last.directive?.kind, 'WAIT', 'stops at the human checkpoint');
  assert.deepEqual(transport.dispatched, ['intent-1', 'spec-1', 'plan-1', 'plan-audit-1']);

  assert.equal(engine.decide(run.runId, decision(first.last)).code, 'DECISION_RECORDED');
  const second = driveRun(engine, transport, run.runId);
  assert.deepEqual(second.last.directive, {
    kind: 'DONE',
    terminal: 'PR_PROPOSAL_READY',
    publication_status: 'NOT_ATTEMPTED',
    evidence_class: 'SIMULATED',
    candidate_verification: 'PASSED_LOCAL_EXECUTION',
    authorization: { decision_id: 'D1', provenance: 'SCRIPTED' },
    proposal: second.last.directive?.kind === 'DONE' ? second.last.directive.proposal : null,
  });
  assert.ok(existsSync(join(run.runDir, 'proposal', 'pr-proposal.json')));
  assert.deepEqual(eventTypes(run), [
    'run_started',
    'task_dispatched', 'result_accepted',
    'task_dispatched', 'result_accepted',
    'task_dispatched', 'result_accepted',
    'task_dispatched', 'result_accepted',
    'brief_rendered',
    'decision_recorded',
    'task_dispatched', 'result_accepted',
    'task_dispatched', 'result_accepted',
    'verification_recorded',
    'task_dispatched', 'result_accepted',
    'proposal_recorded',
  ]);
  assert.equal(engine.next(run.runId).code, 'NO_WORK', 'a finished run hands out no work');
});

test('CORE-4: status never dispatches, takes no lock, and writes nothing', async () => {
  const run = await newRun('status');
  const { engine } = run.assembly;
  const before = journalText(run);
  const files = readdirSync(run.runDir).sort();
  for (let i = 0; i < 3; i++) {
    const s = engine.status(run.runId);
    assert.equal(s.code, 'STATUS');
    assert.deepEqual(s.directive, { kind: 'CONTINUE', pending: null });
  }
  assert.equal(journalText(run), before);
  assert.deepEqual(readdirSync(run.runDir).sort(), files);
});

test('next and resume preserve the pending attempt instead of creating another', async () => {
  const run = await newRun('pending');
  const { engine } = run.assembly;
  const first = engine.next(run.runId);
  assert.equal(first.code, 'DISPATCHED');
  const envelope = pendingOf(first);

  const again = engine.next(run.runId);
  assert.equal(again.code, 'PENDING_IN_FLIGHT');
  assert.equal(first.dispatch, 'GRANTED');
  assert.equal(again.dispatch, 'IN_FLIGHT', 'a repeated request is not a second permission to dispatch');
  assert.deepEqual(pendingOf(again), envelope);
  const resumed = engine.resume(run.runId);
  assert.equal(resumed.code, 'RESUMED');
  assert.deepEqual(pendingOf(resumed), envelope);
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched'], 'one dispatch only');

  // resume on a run with no pending work reports the directive and creates nothing
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'ACCEPTED');
  const idle = engine.resume(run.runId);
  assert.deepEqual(idle.directive, { kind: 'CONTINUE', pending: null });
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched', 'result_accepted']);
});

test('invalid schema does not advance and the rejected bytes are retained', async () => {
  const run = await newRun('schema');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  const version = engine.status(run.runId).state_version;

  const malformed = engine.submit(run.runId, '{"record_type":"role-result"');
  assert.equal(malformed.code, 'MALFORMED_RESULT');
  const unknownField = engine.submit(run.runId, result(envelope, { approved: true } as never));
  assert.equal(unknownField.code, 'MALFORMED_RESULT');
  const future = engine.submit(run.runId, result(envelope, { schema_version: 2 } as never));
  assert.equal(future.code, 'UNSUPPORTED_SCHEMA_VERSION');

  for (const r of [malformed, unknownField, future]) {
    assert.equal(r.ok, false);
    assert.ok(existsSync(join(run.runDir, r.evidence as string)), 'evidence retained');
  }
  assert.equal(engine.status(run.runId).state_version, version);
  assert.deepEqual(pendingOf(engine.status(run.runId)), envelope, 'attempt still pending');
});

test('CORE-1: a result for another run, role, or input version is rejected without a transition', async () => {
  const run = await newRun('identity');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  const cases: [string, string][] = [
    ['RUN_MISMATCH', result(envelope, { run_id: 'RUN-other' })],
    ['ROLE_MISMATCH', result(envelope, { role: 'reviewer' })],
    ['INPUT_MISMATCH', result(envelope, { input_digest: `sha256:${'0'.repeat(64)}` })],
    ['STALE_STATE_VERSION', result(envelope, { expected_version: envelope.state_version - 1 })],
    ['UNKNOWN_ATTEMPT', result(envelope, { attempt_id: 'review-1' })],
  ];
  for (const [code, raw] of cases) {
    const r = engine.submit(run.runId, raw);
    assert.equal(r.code, code);
    assert.equal(r.ok, false);
    assert.ok(existsSync(join(run.runDir, r.evidence as string)));
  }
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched']);
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'ACCEPTED', 'the correct result is still accepted');
});

test('identical retry returns the original outcome; a conflicting duplicate is rejected', async () => {
  const run = await newRun('duplicates');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  const raw = result(envelope);
  const first = engine.submit(run.runId, raw);
  assert.equal(first.code, 'ACCEPTED');
  assert.equal(first.duplicate, false);

  // same record, different serialization: identity is the canonical content
  const reordered = JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(raw)).reverse()), null, 2);
  for (const retry of [raw, reordered]) {
    const r = engine.submit(run.runId, retry);
    assert.equal(r.code, 'ACCEPTED');
    assert.equal(r.duplicate, true);
    assert.equal(r.settled_version, first.settled_version);
  }
  const conflict = engine.submit(run.runId, result(envelope, { summary: 'a different answer' }));
  assert.equal(conflict.code, 'CONFLICTING_DUPLICATE');
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched', 'result_accepted'], 'exactly one transition');
});

test('stale and out-of-order submissions are distinguished', async () => {
  const run = await newRun('stale');
  const { engine } = run.assembly;
  const first = pendingOf(engine.next(run.runId));
  assert.equal(engine.submit(run.runId, failure(first)).code, 'FAILURE_RECORDED');
  const second = pendingOf(engine.next(run.runId));
  assert.equal(second.attempt_id, 'intent-2', 'a failed invocation gets a new attempt identity');

  // late result for the failed attempt
  assert.equal(engine.submit(run.runId, result(first)).code, 'STALE_ATTEMPT');
  // identical failure retry is idempotent; a different failure for it conflicts
  assert.equal(engine.submit(run.runId, failure(first)).duplicate, true);
  assert.equal(engine.submit(run.runId, failure(first, 'REFUSED')).code, 'CONFLICTING_DUPLICATE');
  // result for a step that has not been dispatched
  assert.equal(engine.submit(run.runId, result(second, { attempt_id: 'proof-1' })).code, 'UNKNOWN_ATTEMPT');
  // decision while no human decision is awaited
  const early = JSON.stringify({
    schema_version: 1,
    record_type: 'human-decision',
    run_id: run.runId,
    decision_id: 'D0',
    expected_version: engine.status(run.runId).state_version,
    action: 'proceed',
    subjects: {},
    recorded_by: 'SIMULATED',
  });
  assert.equal(engine.decide(run.runId, early).code, 'NOT_WAITING_FOR_DECISION');

  assert.equal(engine.submit(run.runId, result(second)).code, 'ACCEPTED');
  // late failure for an attempt that was accepted
  assert.equal(engine.submit(run.runId, failure(second)).code, 'STALE_ATTEMPT');
});

test('attempts are bounded: exhausting them blocks the run', async () => {
  const run = await newRun('attempts');
  const { engine } = run.assembly;
  const out = driveRun(engine, createFakeTransport(run.assembly.runsRoot, { intent: ['timeout', 'refusal'] }), run.runId);
  assert.deepEqual(out.last.directive, {
    kind: 'BLOCKED',
    blocker: 'ATTEMPTS_EXHAUSTED',
    detail: 'stage intent used every permitted attempt',
  });
  assert.equal(engine.next(run.runId).code, 'NO_WORK');
  assert.deepEqual(engine.status(run.runId).attempts, { intent: 2 });
});

test('a refuted audit still reaches the human; a negative review blocks', async () => {
  const audit = await newRun('negative-audit');
  const a = driveRun(audit.assembly.engine, createFakeTransport(audit.assembly.runsRoot, { 'plan-audit': ['refuted'] }), audit.runId);
  assert.equal(a.last.directive?.kind, 'WAIT');

  const review = await newRun('negative-review');
  const { engine } = review.assembly;
  const transport = createFakeTransport(review.assembly.runsRoot, { review: ['negative'] });
  const waiting = driveRun(engine, transport, review.runId).last;
  engine.decide(review.runId, decision(waiting));
  const end = driveRun(engine, transport, review.runId).last;
  assert.equal(end.directive?.kind, 'BLOCKED');
  assert.equal(end.directive?.kind === 'BLOCKED' && end.directive.blocker, 'NEGATIVE_RESULT');
  assert.ok(!existsSync(join(review.runDir, 'proposal')), 'no proposal after a negative review');
});

test('human decision: stale subject and stale version are rejected; reject ends the run', async () => {
  const run = await newRun('decision');
  const { engine } = run.assembly;
  const waiting = toHumanWait(run);
  assert.equal(engine.next(run.runId).code, 'NO_WORK', 'no work is dispatched while waiting for the human');

  const wrongSubject = decision(waiting, { subjects: { plan: `sha256:${'f'.repeat(64)}` } });
  assert.equal(engine.decide(run.runId, wrongSubject).code, 'STALE_DECISION_SUBJECT');
  const wrongVersion = decision(waiting, { expected_version: 1 });
  assert.equal(engine.decide(run.runId, wrongVersion).code, 'STALE_STATE_VERSION');
  assert.equal(engine.status(run.runId).directive?.kind, 'WAIT');

  const rejected = engine.decide(run.runId, decision(waiting, { action: 'reject' }));
  assert.equal(rejected.code, 'DECISION_RECORDED');
  assert.equal(rejected.directive?.kind === 'DONE' && rejected.directive.terminal, 'REJECTED');
  // identical retry is idempotent; a different decision under the same id conflicts
  assert.equal(engine.decide(run.runId, decision(waiting, { action: 'reject' })).duplicate, true);
  assert.equal(engine.decide(run.runId, decision(waiting, { action: 'proceed' })).code, 'CONFLICTING_DUPLICATE');
  assert.equal(engine.next(run.runId).code, 'NO_WORK');
});

test('audit budget and accepted work survive a restart of the engine', async () => {
  const run = await newRun('restart');
  toHumanWait(run);
  // a new engine instance over the same directory sees the same state
  const again = (await import('../scripts/assembly.ts')).createAssembly(run.workspace).engine;
  const s = again.status(run.runId);
  assert.deepEqual(s.audit_budget, { max: 2, used: 1 });
  assert.deepEqual(s.attempts, { intent: 1, spec: 1, plan: 1, 'plan-audit': 1 });
  assert.equal(s.directive?.kind, 'WAIT');
  assert.equal(again.resume(run.runId).directive?.kind, 'WAIT');
  assert.equal(eventTypes(run).filter((t) => t === 'task_dispatched').length, 4, 'nothing was redispatched');
});

test('missing input: absent files and a retained input that changed are refused', async () => {
  const run = await newRun('missing');
  const { engine, start } = run.assembly;
  assert.equal((await start({ request: { path: join(run.workspace, 'absent.md') }, appDir: APP, profilePath: PROFILE })).code, 'MISSING_INPUT');
  assert.equal((await start({ request: { path: REQUEST }, appDir: APP, profilePath: join(run.workspace, 'absent.json') })).code, 'MISSING_INPUT');
  assert.equal((await start({ request: {}, appDir: APP, profilePath: PROFILE })).code, 'MISSING_INPUT');

  completeStep(run);
  // remove the retained intent that the specification stage needs
  const intentRef = (JSON.parse(journalText(run).split('\n')[2]!.slice(65)) as { data: { subjects: { intent: string } } }).data.subjects.intent;
  rmSync(join(run.runDir, 'artifacts', intentRef.slice(7)));
  const refused = engine.next(run.runId);
  assert.equal(refused.code, 'MISSING_INPUT');
  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched', 'result_accepted'], 'nothing dispatched');
});

test('run identity: unsafe ids, unknown runs, and reused ids are refused', async () => {
  const run = await newRun('ids');
  const { engine, start } = run.assembly;
  for (const id of ['../escape', '..', 'a/b', 'a\\b', '', 'x'.repeat(65)]) {
    assert.equal(engine.status(id).code, 'INVALID_RUN_ID');
    assert.equal(engine.next(id).code, 'INVALID_RUN_ID');
  }
  assert.equal(engine.status('RUN-unknown').code, 'RUN_NOT_FOUND');
  const reused = await start({ request: { path: REQUEST }, appDir: APP, profilePath: PROFILE, runId: run.runId });
  assert.equal(reused.code, 'RUN_EXISTS');
  assert.notEqual(run.runId, 'REQ-001', 'run id is distinct from the request id');
});
