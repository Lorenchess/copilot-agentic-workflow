// Proof, implementation, candidate verification, review, and the local
// proposal on the synthetic application.
//
// Evidence classes in this file:
// - Test executions are ACTUAL: the engine runs the application's own test
//   command in a child process and judges the real report.
// - Role results (tester, developer, reviewer) come from the fake transport
//   and are SIMULATED. Decisions are SCRIPTED fixtures.
// Nothing here is a model's work or an observed human approval.

import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createFakeTransport } from '../adapters/fake-transport/index.ts';
import { createNodeTestExecutor, parseTap } from '../adapters/node-test-executor/index.ts';
import type { ExecutionRecord, TreeManifest } from '../core/contracts/app.ts';
import type { FinalPlan } from '../core/contracts/planning.ts';
import type { TestExecutor } from '../core/contracts/ports.ts';
import type { PrProposal } from '../core/contracts/records.ts';
import { driveRun } from '../core/engine/drive.ts';
import type { EngineOptions } from '../core/engine/engine.ts';
import { manifestOf, measureTree, treeRef } from '../core/engine/tree.ts';
import { verifyPacket } from '../evals/verify-packet.ts';
import { createAssembly } from '../scripts/assembly.ts';
import {
  APP,
  PROFILE,
  REQUEST,
  type TestRun,
  completeStep,
  decision,
  eventTypes,
  journalText,
  newRun,
  pendingOf,
  result,
  tmpDir,
  toHumanWait,
} from './support/harness.ts';

const subjects = (run: TestRun): Record<string, string> => run.assembly.engine.status(run.runId).subjects as Record<string, string>;
const artifact = (run: TestRun, ref: string): string => readFileSync(join(run.runDir, 'artifacts', ref.slice(7)), 'utf8');
const execution = (run: TestRun, ref: string): ExecutionRecord => JSON.parse(artifact(run, ref)) as ExecutionRecord;
const tree = (run: TestRun, ref: string): TreeManifest => JSON.parse(artifact(run, ref)) as TreeManifest;
const appIdentity = (): string => {
  const m = measureTree(APP);
  assert.ok(m.ok);
  return treeRef(manifestOf(m.files));
};

async function atProof(label: string, engine: Partial<EngineOptions> = {}, action: 'proceed' | 'amend' = 'proceed'): Promise<TestRun> {
  const run = await newRun(label, engine);
  const waiting = toHumanWait(run);
  const amendments = action === 'amend' ? { amendments: [{ id: 'A1', target: 'U1', text: 'Check authorization before the flag.' }] } : {};
  assert.equal(run.assembly.engine.decide(run.runId, decision(waiting, { action, ...amendments })).code, 'DECISION_RECORDED');
  assert.equal(run.assembly.engine.status(run.runId).stage, 'proof');
  return run;
}

async function atImplement(label: string, engine: Partial<EngineOptions> = {}): Promise<TestRun> {
  const run = await atProof(label, engine);
  completeStep(run);
  assert.equal(run.assembly.engine.status(run.runId).stage, 'implement');
  return run;
}

async function atReview(label: string, engine: Partial<EngineOptions> = {}): Promise<TestRun> {
  const run = await atImplement(label, engine);
  completeStep(run);
  assert.equal(run.assembly.engine.next(run.runId).code, 'VERIFICATION_PASSED');
  return run;
}

test('the test runner report is normalized: assertion failure, other error, and load failure are told apart', () => {
  const tap = [
    'TAP version 13',
    '# Subtest: a',
    'ok 1 - a',
    '  ---',
    '  duration_ms: 1',
    '  ...',
    'not ok 2 - b',
    '  ---',
    "  failureType: 'testCodeFailure'",
    "  code: 'ERR_ASSERTION'",
    '  ...',
    'not ok 3 - c',
    '  ---',
    "  error: 'boom'",
    "  code: 'ERR_TEST_FAILURE'",
    '  ...',
    'not ok 4 - tests\\\\controlled\\\\x.test.js',
    '  ---',
    '  exitCode: 1',
    "  code: 'ERR_TEST_FAILURE'",
    '  ...',
    '    not ok 1 - nested lines are not top-level results',
    '1..4',
  ].join('\n');
  assert.deepEqual(parseTap(tap), [
    { name: 'a', status: 'PASS', failure_kind: null },
    { name: 'b', status: 'FAIL', failure_kind: 'ASSERTION' },
    { name: 'c', status: 'FAIL', failure_kind: 'ERROR' },
    { name: 'tests\\\\controlled\\\\x.test.js', status: 'FAIL', failure_kind: 'LOAD' },
  ]);
  assert.deepEqual(parseTap(''), []);
});

test('actual execution: the proof fails by assertion against the unchanged application and passes on the candidate', async () => {
  const before = appIdentity();
  const run = await atProof('proof-real');
  const { engine } = run.assembly;
  assert.equal(subjects(run).base, before, 'the base identity is the measured fixture application');

  completeStep(run);
  const s1 = subjects(run);
  const baseline = execution(run, s1.proof_baseline!);
  assert.equal(baseline.purpose, 'PROOF_BASELINE');
  assert.deepEqual(baseline.command, ['node', '--test', '--test-reporter=tap', 'tests/**/*.test.js']);
  assert.equal(baseline.working_directory, 'exec/proof-1-baseline');
  assert.equal(baseline.tree, s1.proof_tree, 'it ran the retained unchanged application plus the controlled tests');
  assert.equal(baseline.proof, s1.proof);
  assert.equal(baseline.specification, s1.spec);
  assert.equal(baseline.final_plan, s1.final_plan);
  assert.equal(baseline.environment.version, process.version);
  assert.equal(baseline.exit_code, 1, 'the runner really failed');
  assert.deepEqual(baseline.classification, { outcome: 'VALID', issues: [] });
  assert.deepEqual(
    baseline.tests.map((t) => [t.name.slice(0, 4), t.status, t.failure_kind]),
    [
      ['AC-1', 'FAIL', 'ASSERTION'],
      ['AC-2', 'PASS', null],
      ['AC-3', 'PASS', null],
      ['exis', 'PASS', null],
      ['exis', 'PASS', null],
    ],
  );
  // AC-2 and AC-3 are verified as already satisfied; no red was manufactured for them.
  const output = artifact(run, baseline.output);
  assert.match(output, /not ok 1 - AC-1/);
  assert.match(output, /ERR_ASSERTION/);
  assert.match(output, /503/, 'the retained output shows the meaningful difference');
  assert.doesNotMatch(output, /Users|[A-Z]:\\\\/, 'the retained output holds no local path');
  // The proof tree is the base plus controlled tests only.
  const added = tree(run, s1.proof_tree!).files.map((f) => f.path).filter((p) => !tree(run, s1.base!).files.some((f) => f.path === p));
  assert.deepEqual(added, ['tests/controlled/pause-exports.test.js']);

  completeStep(run);
  const verified = engine.next(run.runId);
  assert.equal(verified.code, 'VERIFICATION_PASSED');
  const s2 = subjects(run);
  const verification = execution(run, s2.verification!);
  assert.equal(verification.purpose, 'CANDIDATE_VERIFICATION');
  assert.equal(verification.tree, s2.candidate, 'it ran the exact retained candidate');
  assert.equal(verification.exit_code, 0);
  assert.equal(verification.tests.length, 5);
  assert.ok(verification.tests.every((t) => t.status === 'PASS'));
  assert.deepEqual(verification.classification, { outcome: 'PASS', issues: [] });
  assert.notEqual(s2.candidate, s2.proof_tree);
  // The candidate differs from the proof tree only in application code.
  const candidate = new Map(tree(run, s2.candidate!).files.map((f) => [f.path, f.sha256]));
  const changed = tree(run, s2.proof_tree!).files.filter((f) => candidate.get(f.path) !== f.sha256).map((f) => f.path);
  assert.deepEqual(changed, ['src/export.js']);

  assert.equal(appIdentity(), before, 'the fixture application itself was never written');
});

test('inadequate proofs are refused on the evidence of the real run, without a transition', async () => {
  const run = await atProof('proof-bad');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  const proofFile = join(run.runDir, envelope.work_dir, 'proof.json');

  // A test that passes without the change does not show the behavior is missing.
  const vacuous = engine.submit(run.runId, result(envelope, {}, 'vacuous'));
  assert.equal(vacuous.code, 'PROOF_NOT_DISCRIMINATING');
  const detail = vacuous.detail as { execution: string; issues: string[] };
  assert.match(detail.issues.join('\n'), /AC-1: no named test fails by assertion against the unchanged application/);
  const record = execution(run, detail.execution);
  assert.equal(record.exit_code, 0, 'the real run passed, which is exactly the problem');
  assert.ok(existsSync(join(run.runDir, vacuous.evidence as string)), 'the refused result and its execution record are kept');

  // A red that is an exception, not a failed assertion, is not a behavioral red.
  const errorRed = engine.submit(run.runId, result(envelope, {}, 'error-red'));
  assert.equal(errorRed.code, 'PROOF_NOT_DISCRIMINATING');
  assert.match(JSON.stringify(errorRed.detail), /fails with an error, not a failed assertion/);

  // A test file that cannot be loaded is a setup failure, not a red.
  const broken = engine.submit(run.runId, result(envelope, {}, 'broken-setup'));
  assert.equal(broken.code, 'PROOF_SETUP_FAILURE');
  assert.match(JSON.stringify(broken.detail), /could not be loaded or crashed/);
  assert.notEqual(execution(run, (broken.detail as { execution: string }).execution).exit_code, 0);

  // A proof that leaves a criterion of the approved specification unproven.
  const unmapped = engine.submit(run.runId, result(envelope, {}, 'unmapped'));
  assert.equal(unmapped.code, 'CONTRACT_VIOLATION');
  assert.match(JSON.stringify(unmapped.detail), /AC-3 has no proof/);

  // A proof that names a test the run never reported.
  const good = result(envelope);
  const map = JSON.parse(readFileSync(proofFile, 'utf8')) as { criteria: { tests: string[]; route: string }[] };
  writeFileSync(proofFile, JSON.stringify({ ...map, criteria: map.criteria.map((c, i) => (i === 2 ? { ...c, tests: ['a test that does not exist'] } : c)) }));
  assert.equal(engine.submit(run.runId, good).code, 'PROOF_SETUP_FAILURE');
  // Claiming a failing behavior is already satisfied.
  writeFileSync(proofFile, JSON.stringify({ ...map, criteria: map.criteria.map((c, i) => (i === 0 ? { ...c, route: 'ALREADY_SATISFIED' } : c)) }));
  const claimed = engine.submit(run.runId, good);
  assert.equal(claimed.code, 'PROOF_NOT_DISCRIMINATING');
  assert.match(JSON.stringify(claimed.detail), /does not pass against the unchanged application/);

  assert.equal(engine.status(run.runId).stage, 'proof');
  assert.equal(subjects(run).proof, undefined);
  assert.equal(eventTypes(run).filter((t) => t === 'result_accepted').length, 4, 'only the four planning results');
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'ACCEPTED', 'the adequate proof is still accepted');
});

test('the tester may write controlled tests only', async () => {
  const run = await atProof('proof-boundary');
  const envelope = pendingOf(run.assembly.engine.next(run.runId));
  const r = run.assembly.engine.submit(run.runId, result(envelope, {}, 'touches-production'));
  assert.equal(r.code, 'WRITE_BOUNDARY_VIOLATION');
  assert.deepEqual((r.detail as { paths: string[] }).paths, ['src/export.js']);
  assert.equal(subjects(run).proof_tree, undefined);
});

test('the developer cannot weaken the controlled proof or change how it is run', async () => {
  for (const [behavior, path] of [
    ['weakens-proof', 'tests/controlled/pause-exports.test.js'],
    ['edits-config', 'rstack.app.json'],
  ] as const) {
    const run = await atImplement(`dev-${behavior}`);
    const { engine } = run.assembly;
    const envelope = pendingOf(engine.next(run.runId));
    const r = engine.submit(run.runId, result(envelope, {}, behavior));
    assert.equal(r.code, 'WRITE_BOUNDARY_VIOLATION', behavior);
    assert.deepEqual((r.detail as { paths: string[] }).paths, [path]);
    assert.equal(subjects(run).candidate, undefined, 'no candidate was retained');
    assert.equal(engine.status(run.runId).stage, 'implement');
  }
  // A link planted in the application copy is refused, not followed.
  const run = await atImplement('dev-link');
  const envelope = pendingOf(run.assembly.engine.next(run.runId));
  const raw = result(envelope);
  let linked = true;
  try {
    symlinkSync(APP, join(run.runDir, envelope.app_dir!, 'outside'), 'junction');
  } catch {
    linked = false;
  }
  if (linked) {
    const r = run.assembly.engine.submit(run.runId, raw);
    assert.equal(r.code, 'UNSAFE_PATH');
    assert.match(JSON.stringify(r.detail), /is a link/);
  }
});

test('a candidate that fails the real verification goes back with the record; rounds are bounded', async () => {
  const run = await atImplement('verify-fail');
  const { engine } = run.assembly;
  completeStep(run, 'wrong');
  const failed = engine.next(run.runId);
  assert.equal(failed.code, 'VERIFICATION_FAILED');
  assert.match(JSON.stringify(failed.issues), /AC-1.*fails \(ASSERTION\)/);
  const record = execution(run, failed.verification as string);
  assert.equal(record.classification.outcome, 'FAIL');
  assert.equal(record.exit_code, 1);
  assert.equal(subjects(run).candidate, undefined, 'a failed candidate is not a candidate');

  // The developer gets the failed record as evidence, and a fresh copy without the failed change.
  const retry = pendingOf(engine.next(run.runId));
  assert.equal(retry.attempt_id, 'implement-2');
  assert.equal(retry.inputs.verification, failed.verification);
  assert.doesNotMatch(readFileSync(join(run.runDir, retry.app_dir!, 'src', 'export.js'), 'utf8'), /503/);
  engine.submit(run.runId, result(retry));
  assert.equal(engine.next(run.runId).code, 'VERIFICATION_PASSED');

  // Two failed candidates end the run; nothing is proposed.
  const blocked = await atImplement('verify-blocked');
  const end = driveRun(blocked.assembly.engine, createFakeTransport(blocked.assembly.runsRoot, { implement: ['wrong', 'wrong'] }), blocked.runId).last;
  assert.equal(end.directive?.kind === 'BLOCKED' && end.directive.blocker, 'VERIFICATION_FAILED');
  assert.ok(!existsSync(join(blocked.runDir, 'proposal')));
  assert.equal(eventTypes(blocked).filter((t) => t === 'verification_recorded').length, 2);
});

test('delayed worker: an abandoned attempt that writes or returns later cannot contaminate the accepted candidate', async () => {
  const run = await atImplement('late-developer');
  const { engine } = run.assembly;
  const a = pendingOf(engine.next(run.runId));
  const aDir = join(run.runDir, a.app_dir!);
  // A starts working, then its dispatcher is lost.
  const lateResult = result(a, {}, 'wrong');
  const abandoned = engine.abandon(run.runId, a.attempt_id, 'dispatcher lost; worker state unknown');
  assert.equal(abandoned.code, 'FAILURE_RECORDED');
  assert.equal(abandoned.directive?.kind, 'CONTINUE', 'attempts do not share a directory, so a replacement is allowed');

  // B gets its own directory, re-created from retained bytes: nothing A wrote is in it.
  const b = pendingOf(engine.next(run.runId));
  assert.equal(b.attempt_id, 'implement-2');
  assert.notEqual(b.app_dir, a.app_dir);
  const bDir = join(run.runDir, b.app_dir!);
  assert.match(readFileSync(join(aDir, 'src', 'export.js'), 'utf8'), /status: 503 \};/);
  assert.doesNotMatch(readFileSync(join(bDir, 'src', 'export.js'), 'utf8'), /503/);
  assert.equal(engine.submit(run.runId, result(b)).code, 'ACCEPTED');
  const candidate = subjects(run).candidate!;
  const accepted = artifact(run, candidate);

  // A is still alive: it keeps writing in its own copy, writes into B's copy, and returns.
  writeFileSync(join(aDir, 'src', 'export.js'), 'export const late = "A";\n');
  writeFileSync(join(bDir, 'src', 'export.js'), 'export const late = "A wrote into B";\n');
  mkdirSync(join(bDir, 'tests', 'controlled'), { recursive: true });
  writeFileSync(join(bDir, 'tests', 'controlled', 'pause-exports.test.js'), '// emptied by A\n');
  assert.equal(engine.submit(run.runId, lateResult).code, 'STALE_ATTEMPT');

  // The accepted candidate is the retained bytes. Verification runs those, not either directory.
  assert.equal(subjects(run).candidate, candidate);
  assert.equal(artifact(run, candidate), accepted);
  const verified = engine.next(run.runId);
  assert.equal(verified.code, 'VERIFICATION_PASSED');
  const record = execution(run, verified.verification as string);
  assert.equal(record.tree, candidate);
  assert.equal(record.tests.length, 5, 'the controlled tests A emptied on disk were still run from their retained copy');
  const source = tree(run, candidate).files.find((f) => f.path === 'src/export.js')!;
  assert.match(artifact(run, `sha256:${source.sha256}`), /EXPORTS_DISABLED/);
  assert.doesNotMatch(artifact(run, `sha256:${source.sha256}`), /late/);

  // Through to the proposal: it names B's candidate and proof, untouched by A.
  const end = driveRun(engine, createFakeTransport(run.assembly.runsRoot), run.runId).last;
  assert.equal(end.directive?.kind, 'DONE');
  const proposal = JSON.parse(readFileSync(join(run.runDir, 'proposal', 'pr-proposal.json'), 'utf8')) as PrProposal;
  assert.equal(proposal.candidate_ref, candidate);
  assert.equal(proposal.verification, verified.verification);
});

test('delayed worker, the limit: a write into the live attempt before it submits is not prevented, and is not hidden either', async () => {
  const run = await atImplement('late-early');
  const { engine } = run.assembly;
  const a = pendingOf(engine.next(run.runId));
  engine.abandon(run.runId, a.attempt_id, 'dispatcher lost');
  const b = pendingOf(engine.next(run.runId));
  const raw = result(b);
  // A, still running and ignoring its own lane, breaks B's copy before B submits.
  writeFileSync(join(run.runDir, b.app_dir!, 'src', 'export.js'), 'export function handleExport() { return { status: 500 }; }\n');
  // The engine cannot tell who wrote it. What it accepts is measured, and what it measured is what it runs.
  assert.equal(engine.submit(run.runId, raw).code, 'ACCEPTED');
  const failed = engine.next(run.runId);
  assert.equal(failed.code, 'VERIFICATION_FAILED');
  assert.equal(subjects(run).candidate, undefined);
  assert.ok(!existsSync(join(run.runDir, 'proposal')));
});

test('delayed worker at the proof stage: the retained proof is not what a late tester can still edit', async () => {
  const run = await atProof('late-tester');
  const { engine } = run.assembly;
  const a = pendingOf(engine.next(run.runId));
  const lateResult = result(a, {}, 'vacuous');
  engine.abandon(run.runId, a.attempt_id, 'dispatcher lost');
  const b = pendingOf(engine.next(run.runId));
  assert.equal(engine.submit(run.runId, result(b)).code, 'ACCEPTED');
  const proofTree = subjects(run).proof_tree!;
  writeFileSync(join(run.runDir, b.app_dir!, 'tests', 'controlled', 'pause-exports.test.js'), '// weakened by a late worker\n');
  assert.equal(engine.submit(run.runId, lateResult).code, 'STALE_ATTEMPT');
  // The developer's copy is made from the retained proof, with the real tests.
  const dev = pendingOf(engine.next(run.runId));
  assert.equal(dev.inputs.proof_tree, proofTree);
  assert.match(readFileSync(join(run.runDir, dev.app_dir!, 'tests', 'controlled', 'pause-exports.test.js'), 'utf8'), /EXPORTS_DISABLED/);
});

test('the reviewer is handed records, not a narrative: specification, final plan with amendments, complete audit, proof, runs, candidate', async () => {
  const run = await atProof('review-inputs', {}, 'amend');
  const { engine } = run.assembly;
  completeStep(run);
  completeStep(run);
  engine.next(run.runId);
  const envelope = pendingOf(engine.next(run.runId));
  assert.equal(envelope.role, 'reviewer');
  assert.deepEqual(Object.keys(envelope.inputs).sort(), ['audit', 'base', 'candidate', 'final_plan', 'proof', 'proof_baseline', 'proof_tree', 'source', 'spec', 'verification']);
  const s = subjects(run);
  assert.equal(envelope.inputs.candidate, s.candidate);
  assert.equal(envelope.inputs.verification, s.verification);
  // The complete audit, including what it did not check.
  const audit = JSON.parse(artifact(run, envelope.inputs.audit!)) as { coverage: { status: string }[] };
  assert.equal(audit.coverage.filter((c) => c.status === 'NOT_CHECKED').length, 2);
  // The final plan says it was amended without re-audit and carries the unchecked coverage forward.
  const finalPlan = JSON.parse(artifact(run, envelope.inputs.final_plan!)) as FinalPlan;
  assert.equal(finalPlan.plan_status, 'AMENDED_NOT_REAUDITED');
  assert.equal(finalPlan.amendments.length, 1);
  assert.equal(finalPlan.audit_unchecked.length, 2);
  assert.equal(finalPlan.audit_checked_items, 1);
  assert.equal(finalPlan.specification, s.spec, 'acceptance criteria still come from the approved specification');
  // No role result or summary from the developer is among the inputs.
  const developer = run.assembly.engine.status(run.runId).attempts as Record<string, number>;
  assert.equal(developer.implement, 1);
  assert.ok(!Object.values(envelope.inputs).some((ref) => artifact(run, ref).includes('SIMULATED developer result')));
  // The reviewer also gets a copy of the candidate to read; it is not the evidence.
  assert.match(readFileSync(join(run.runDir, envelope.app_dir!, 'src', 'export.js'), 'utf8'), /EXPORTS_DISABLED/);
});

test('a review counts only for the exact candidate and verification it names, and only ACCEPT leads to a proposal', async () => {
  const run = await atReview('review-binding');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  const raw = result(envelope);
  const file = join(run.runDir, envelope.work_dir, 'review.json');
  const good = readFileSync(file, 'utf8');
  writeFileSync(file, good.replace(envelope.inputs.candidate!, envelope.inputs.proof_tree!));
  const wrong = engine.submit(run.runId, raw);
  assert.equal(wrong.code, 'CONTRACT_VIOLATION');
  assert.match(JSON.stringify(wrong.detail), /is not the candidate this review was given/);
  writeFileSync(file, good.replace('"ACCEPT"', '"REJECT"'));
  assert.equal(engine.submit(run.runId, raw).code, 'CONTRACT_VIOLATION', 'a rejection needs a finding');
  writeFileSync(file, JSON.stringify({ ...JSON.parse(good), coverage: JSON.parse(good).coverage.map((c: object) => ({ ...c, status: 'NOT_CHECKED', evidence: '', note: 'x' })) }));
  assert.equal(engine.submit(run.runId, raw).code, 'CONTRACT_VIOLATION', 'an acceptance needs something examined');

  for (const [behavior, blocker] of [
    ['reject', 'REVIEW_REJECTED'],
    ['unexamined', 'REVIEW_INCONCLUSIVE'],
  ] as const) {
    const other = await atReview(`review-${behavior}`);
    const done = completeStep(other, behavior);
    assert.equal(done.directive?.kind === 'BLOCKED' && done.directive.blocker, blocker);
    assert.equal(other.assembly.engine.next(other.runId).code, 'NO_WORK');
    assert.ok(!existsSync(join(other.runDir, 'proposal')));
  }
});

test('REVIEW-1: when what the verification relied on changes, the verification and the review are established again', async () => {
  const real = createNodeTestExecutor();
  let version = real.environment().version as string;
  const executor: TestExecutor = { id: real.id, run: (r) => real.run(r), environment: () => ({ ...real.environment(), version }) };
  const run = await atReview('invalidate', { resolveExecutor: () => executor });
  const { engine } = run.assembly;
  completeStep(run);
  const before = subjects(run);
  assert.equal(engine.status(run.runId).stage, 'proposal');

  // Same candidate, same files; the execution environment is no longer the one the verification ran under.
  version = 'v99.0.0-test';
  const stale = engine.next(run.runId);
  assert.equal(stale.code, 'EVIDENCE_STALE');
  assert.ok(!existsSync(join(run.runDir, 'proposal')), 'no proposal was assembled on stale evidence');
  assert.equal(engine.status(run.runId).stage, 'verify');
  assert.equal(subjects(run).verification, undefined);
  assert.equal(subjects(run).review, undefined);
  assert.equal(subjects(run).candidate, before.candidate, 'the candidate itself is unchanged');

  assert.equal(engine.next(run.runId).code, 'VERIFICATION_PASSED');
  const again = subjects(run);
  assert.notEqual(again.verification, before.verification);
  assert.equal(execution(run, again.verification!).environment.version, 'v99.0.0-test');
  const review = pendingOf(engine.next(run.runId));
  assert.equal(review.attempt_id, 'review-2');
  assert.equal(review.inputs.verification, again.verification, 'the new review is of the new verification');
  engine.submit(run.runId, result(review));
  assert.equal(engine.next(run.runId).code, 'PROPOSAL_READY');
  const proposal = JSON.parse(readFileSync(join(run.runDir, 'proposal', 'pr-proposal.json'), 'utf8')) as PrProposal;
  assert.equal(proposal.verification, again.verification);
  assert.equal(proposal.review, subjects(run).review);
  assert.deepEqual(eventTypes(run).slice(-5), ['verification_invalidated', 'verification_recorded', 'task_dispatched', 'result_accepted', 'proposal_recorded']);
});

test('retained candidate bytes that no longer match their identity stop verification and the proposal', async () => {
  const run = await atImplement('tamper');
  const { engine } = run.assembly;
  completeStep(run);
  const source = tree(run, subjects(run).candidate!).files.find((f) => f.path === 'src/export.js')!;
  const path = join(run.runDir, 'artifacts', source.sha256);
  const original = readFileSync(path);
  writeFileSync(path, 'export function handleExport() { return { status: 200 }; }\n');
  const refused = engine.next(run.runId);
  assert.equal(refused.code, 'MISSING_INPUT');
  assert.equal(eventTypes(run).filter((t) => t === 'verification_recorded').length, 0);
  writeFileSync(path, original);
  assert.equal(engine.next(run.runId).code, 'VERIFICATION_PASSED');
  completeStep(run);
  // Altered after verification and review, before the proposal.
  const manifestPath = join(run.runDir, 'artifacts', subjects(run).candidate!.slice(7));
  const manifest = readFileSync(manifestPath);
  writeFileSync(manifestPath, manifest.toString().replace(source.sha256, '0'.repeat(64)));
  assert.equal(engine.next(run.runId).code, 'MISSING_INPUT');
  assert.ok(!existsSync(join(run.runDir, 'proposal')));
  writeFileSync(manifestPath, manifest);
  assert.equal(engine.next(run.runId).code, 'PROPOSAL_READY');
});

test('the proposal traces to the candidate, both real runs, the review, and the planning basis, all resolvable from the packet alone', async () => {
  const run = await atProof('trace', {}, 'amend');
  const { engine } = run.assembly;
  const end = driveRun(engine, createFakeTransport(run.assembly.runsRoot, { proof: ['vacuous', 'success'], implement: ['wrong', 'success'] }), run.runId).last;
  assert.equal(end.code, 'PROPOSAL_READY');
  assert.deepEqual(end.directive, {
    kind: 'DONE',
    terminal: 'PR_PROPOSAL_READY',
    publication_status: 'NOT_ATTEMPTED',
    evidence_class: 'SIMULATED',
    candidate_verification: 'PASSED_LOCAL_EXECUTION',
    authorization: { decision_id: 'D1', provenance: 'SCRIPTED' },
    proposal: end.directive?.kind === 'DONE' ? end.directive.proposal : null,
  });
  const s = subjects(run);
  const text = readFileSync(join(run.runDir, 'proposal', 'pr-proposal.json'), 'utf8');
  const proposal = JSON.parse(text) as PrProposal;
  assert.equal(proposal.base_ref, s.base);
  assert.equal(proposal.candidate_ref, s.candidate);
  assert.equal(proposal.proof, s.proof);
  assert.equal(proposal.proof_tree, s.proof_tree);
  assert.equal(proposal.proof_baseline, s.proof_baseline);
  assert.equal(proposal.verification, s.verification);
  assert.equal(proposal.review, s.review);
  assert.equal(proposal.planning_basis.final_plan, s.final_plan);
  assert.equal(proposal.publication_status, 'NOT_ATTEMPTED');
  assert.deepEqual(proposal.evidence_classes, { role_results: 'SIMULATED', review: 'SIMULATED', test_execution: 'ACTUAL_LOCAL_EXECUTION' });
  assert.doesNotMatch(text, /https?:|Users|[A-Z]:\\\\|PR_CREATED|commit/i, 'no address, no local path, no commit claim');
  // Each link in the chain names the next one exactly.
  assert.equal(execution(run, proposal.verification).tree, proposal.candidate_ref);
  assert.equal(execution(run, proposal.verification).proof, proposal.proof);
  assert.equal(execution(run, proposal.proof_baseline).tree, proposal.proof_tree);
  const review = JSON.parse(artifact(run, proposal.review)) as { subject: Record<string, string> };
  assert.deepEqual(review.subject, { candidate: proposal.candidate_ref, verification: proposal.verification, spec: proposal.planning_basis.spec, proof: proposal.proof });
  assert.equal((JSON.parse(artifact(run, proposal.planning_basis.final_plan)) as FinalPlan).decision, proposal.planning_basis.decision);

  // The packet (the run without work/ and exec/) resolves everything by itself.
  const packet = join(tmpDir('trace-packet'), 'packet');
  mkdirSync(packet);
  for (const entry of readdirSync(run.runDir)) {
    if (entry !== 'work' && entry !== 'exec') cpSync(join(run.runDir, entry), join(packet, entry), { recursive: true });
  }
  const report = verifyPacket(packet);
  assert.deepEqual(report.problems, []);
  assert.deepEqual(report.candidate, { base: s.base, candidate: s.candidate, verification: s.verification, review: s.review });
  assert.deepEqual(
    report.executions.map((e) => [e.purpose, e.outcome]),
    [
      ['PROOF_BASELINE', 'VALID'],
      ['CANDIDATE_VERIFICATION', 'FAIL'],
      ['CANDIDATE_VERIFICATION', 'PASS'],
    ],
  );
  assert.deepEqual(report.unsuccessful_attempts.map((a) => [a.attempt_id, a.kind]), [['proof-1', 'RESULT_REJECTED']]);
  assert.equal(report.rejected_submissions.filter((f) => f.includes('PROOF_NOT_DISCRIMINATING')).length, 1);
  // The candidate can be rebuilt from the packet and is the tree the verification ran.
  const candidate = JSON.parse(readFileSync(join(packet, 'artifacts', s.candidate!.slice(7)), 'utf8')) as TreeManifest;
  for (const f of candidate.files) assert.ok(existsSync(join(packet, 'artifacts', f.sha256)), f.path);
  rmSync(join(packet, 'artifacts', candidate.files[0]!.sha256));
  assert.equal(verifyPacket(packet).ok, false);
});

test('an application that cannot be measured, configured, or executed is refused at start', async () => {
  const base = tmpDir('bad-app');
  const assembly = createAssembly(base);
  const start = (appDir: string) => assembly.start({ request: { path: REQUEST }, appDir, profilePath: PROFILE, transportClass: 'SIMULATED' });
  assert.equal((await start(join(base, 'absent'))).code, 'MISSING_INPUT');

  const noConfig = join(base, 'no-config');
  cpSync(APP, noConfig, { recursive: true });
  rmSync(join(noConfig, 'rstack.app.json'));
  assert.equal((await start(noConfig)).code, 'INVALID_APPLICATION');

  const badRunner = join(base, 'bad-runner');
  cpSync(APP, badRunner, { recursive: true });
  const config = join(badRunner, 'rstack.app.json');
  writeFileSync(config, readFileSync(config, 'utf8').replace('node-test', 'other-runner'));
  assert.equal((await start(badRunner)).code, 'EXECUTOR_UNAVAILABLE');
  writeFileSync(config, readFileSync(config, 'utf8').replace('tests/**/*.test.js', '--inspect'));
  assert.equal((await start(badRunner)).code, 'INVALID_APPLICATION', 'a pattern that looks like an option is refused');

  assert.ok(!existsSync(join(base, '.rstack', 'runs')) || readdirSync(join(base, '.rstack', 'runs')).length === 0, 'no run was created');
  assert.equal(journalText(await newRun('good-app')).split('\n').filter(Boolean).length, 1);
});
