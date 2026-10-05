// The PR review: the packet the engine assembles after technical acceptance,
// the separate review that must approve before a proposal exists, and the
// deterministic composition of that proposal. Evidence class: OFFLINE and
// SIMULATED. Role content is scripted fixture text; the application's tests
// are really executed by the engine. Nothing here shows what a host or a
// model does: that the PR reviewer is a fresh, separate worker, and that it
// cannot write outside its own directory, are host facts these tests cannot
// establish. What they establish is what the engine accepts, refuses, and writes.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { generatePackage } from '../adapters/copilot-vscode/generate.ts';
import { PackageError } from '../adapters/copilot-vscode/install.ts';
import { HOSTILE_PR_TEXT, prReview } from '../adapters/fake-transport/application.ts';
import { createFakeTransport } from '../adapters/fake-transport/index.ts';
import { createNodeTestExecutor } from '../adapters/node-test-executor/index.ts';
import type { ExecutionRecord, Proof, Review, TreeManifest } from '../core/contracts/app.ts';
import { type FinalPlan, parseSpec } from '../core/contracts/planning.ts';
import type { TestExecutor, TestOutcome } from '../core/contracts/ports.ts';
import { type PrReview, type PrReviewPacket, COMPOSER_FORMAT, PR_REVIEW_COVERAGE, packetIdentities, parsePrReview, parsePrReviewPacket } from '../core/contracts/pr-review.ts';
import { type JournalEvent, type PrProposal, type Profile, type TaskEnvelope, canonicalJson, refOf } from '../core/contracts/records.ts';
import { driveRun } from '../core/engine/drive.ts';
import type { EngineOptions, Reply } from '../core/engine/engine.ts';
import { appendEvent } from '../core/engine/journal.ts';
import { type PacketSources, buildPrReviewPacket, changeSet, packetText } from '../core/engine/pr-review-packet.ts';
import { type ComposeInput, composeProposal, entryCounts, mdText } from '../core/engine/proposal.ts';
import { type RunState, replay } from '../core/engine/state.ts';
import { DEFAULT_PR_REVIEW_PROCEDURE } from '../core/policies/pr-review-procedure.ts';
import { type WorkflowDef, WORKFLOW, workflowRef } from '../core/policies/workflow.ts';
import { evaluateDeterministic } from '../evals/deterministic.ts';
import { verifyPacket } from '../evals/verify-packet.ts';
import { createAssembly } from '../scripts/assembly.ts';
import {
  APP,
  PACKAGE_ROOT,
  PROFILE,
  REQUEST,
  type TestRun,
  cli,
  completeStep,
  decision,
  eventTypes,
  journalText,
  newRun,
  pendingOf,
  prReviewStep,
  result,
  tmpDir,
  toHumanWait,
} from './support/harness.ts';

const subjects = (run: TestRun): Record<string, string> => run.assembly.engine.status(run.runId).subjects as Record<string, string>;
const artifactPath = (run: TestRun, ref: string): string => join(run.runDir, 'artifacts', ref.slice(ref.indexOf(':') + 1));
const artifact = (run: TestRun, ref: string): string => readFileSync(artifactPath(run, ref), 'utf8');
const json = <T>(run: TestRun, ref: string): T => JSON.parse(artifact(run, ref)) as T;
const events = (run: TestRun): JournalEvent[] =>
  journalText(run)
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line.slice(65)) as JournalEvent);
const proposalOf = (run: TestRun): PrProposal => JSON.parse(readFileSync(join(run.runDir, 'proposal', 'pr-proposal.json'), 'utf8')) as PrProposal;

// A run whose candidate passed the real verification and was accepted by the
// code review. `proof` and `implement` script earlier attempts, so a run can
// carry history. The next engine step assembles the PR review packet.
async function atPacket(label: string, options: { engine?: Partial<EngineOptions>; history?: boolean; amend?: boolean; review?: (r: Review) => Review } = {}): Promise<TestRun> {
  const run = await newRun(label, options.engine);
  const { engine } = run.assembly;
  const amendments = options.amend ? { action: 'amend' as const, amendments: [{ id: 'A1', target: 'U1', text: 'Check authorization *before* the flag.' }] } : {};
  assert.equal(engine.decide(run.runId, decision(toHumanWait(run), amendments)).code, 'DECISION_RECORDED');
  if (options.history) {
    // One refused proof and one candidate that fails verification, then the good ones.
    const refusedProof = pendingOf(engine.next(run.runId));
    assert.equal(engine.submit(run.runId, result(refusedProof, {}, 'vacuous')).ok, false);
    assert.equal(engine.abandon(run.runId, refusedProof.attempt_id, 'refused proof').code, 'FAILURE_RECORDED');
    completeStep(run);
    completeStep(run, 'wrong');
    assert.equal(engine.next(run.runId).code, 'VERIFICATION_FAILED');
    completeStep(run);
  } else {
    completeStep(run);
    completeStep(run);
  }
  assert.equal(engine.next(run.runId).code, 'VERIFICATION_PASSED');
  const envelope = pendingOf(engine.next(run.runId));
  const raw = result(envelope);
  if (options.review) {
    const file = join(run.runDir, envelope.work_dir, 'review.json');
    writeFileSync(file, JSON.stringify(options.review(JSON.parse(readFileSync(file, 'utf8')) as Review)));
  }
  assert.equal(engine.submit(run.runId, raw).code, 'ACCEPTED');
  assert.equal(engine.status(run.runId).stage, 'pr-review-packet');
  return run;
}

// The same run with the packet assembled and the PR review dispatched.
async function atPrReview(label: string, options: Parameters<typeof atPacket>[1] = {}): Promise<{ run: TestRun; envelope: TaskEnvelope; packet: PrReviewPacket }> {
  const run = await atPacket(label, options);
  assert.equal(run.assembly.engine.next(run.runId).code, 'PR_REVIEW_PACKET_READY');
  const envelope = pendingOf(run.assembly.engine.next(run.runId));
  return { run, envelope, packet: json<PrReviewPacket>(run, envelope.inputs.pr_review_packet as string) };
}

// Submits a result for the pending PR review whose record is the one given.
function submitPrReview(run: TestRun, envelope: TaskEnvelope, record: unknown): Reply {
  const raw = result(envelope);
  writeFileSync(join(run.runDir, envelope.work_dir, 'pr-review.json'), typeof record === 'string' ? record : JSON.stringify(record));
  return run.assembly.engine.submit(run.runId, raw);
}

const approving = (run: TestRun, envelope: TaskEnvelope): PrReview => prReview(run.runDir, envelope, 'success');

// ---------------------------------------------------------------- PRR-1, PRR-2

test('PRR-1: the packet and the PR review come after technical acceptance and before the proposal, and replay refuses a journal that skips them', async () => {
  const run = await atPacket('prr-1');
  const { engine } = run.assembly;
  assert.ok(!existsSync(join(run.runDir, 'proposal')), 'an accepted code review alone produces no proposal');
  assert.equal(engine.next(run.runId).code, 'PR_REVIEW_PACKET_READY');
  const envelope = pendingOf(engine.next(run.runId));
  assert.deepEqual([envelope.step_id, envelope.role, envelope.attempt_id, envelope.mode], ['pr-review', 'pr-reviewer', 'pr-review-1', 'pr-review']);
  assert.ok(!existsSync(join(run.runDir, 'proposal')), 'a dispatched PR review produces no proposal');
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'ACCEPTED');
  assert.equal(engine.next(run.runId).code, 'PROPOSAL_READY');
  assert.deepEqual(eventTypes(run).slice(-6), ['task_dispatched', 'result_accepted', 'pr_review_packet_recorded', 'task_dispatched', 'result_accepted', 'proposal_recorded']);

  // The same journal with the packet and the PR review taken out is not a run this workflow allows.
  const all = events(run);
  const drop = (types: (e: JournalEvent, i: number) => boolean): JournalEvent[] => all.filter((e, i) => !types(e, i)).map((e, i) => ({ ...e, seq: i + 1 }));
  assert.ok(replay(all, WORKFLOW), 'the recorded journal replays');
  const packetAt = all.findIndex((e) => e.type === 'pr_review_packet_recorded');
  assert.throws(() => replay(drop((_, i) => i >= packetAt && i < all.length - 1), WORKFLOW), /no proposal allowed here/, 'proposal straight after the code review');
  assert.throws(() => replay(drop((e) => e.type === 'pr_review_packet_recorded'), WORKFLOW), /no dispatch allowed here/, 'a PR review without a packet');
  // A packet record for another candidate, or one that does not end at the record before it, is not accepted either.
  const withPacket = (data: Record<string, unknown>): JournalEvent[] => all.map((e) => (e.type === 'pr_review_packet_recorded' ? { ...e, data: { ...e.data, ...data } } : e));
  assert.throws(() => replay(withPacket({ candidate: subjects(run).base }), WORKFLOW), /the packet is for another candidate/);
  assert.throws(() => replay(withPacket({ journal_cutoff: packetAt - 1 }), WORKFLOW), /does not end at the record before it/);
  // A PR review result whose recorded verdict is not one of the three is not a transition.
  const prAccepted = all.findLastIndex((e) => e.type === 'result_accepted');
  assert.throws(() => replay(all.map((e, i) => (i === prAccepted ? { ...e, data: { ...e.data, pr_review_verdict: 'ACCEPT' } } : e)), WORKFLOW), /bad PR review verdict/);
  // A definition that keeps the PR review stage but routes around it cannot record a proposal.
  const routedAround: WorkflowDef = { ...WORKFLOW, stages: WORKFLOW.stages.map((s) => (s.id === 'review' ? { ...s, next: 'proposal' } : s)) };
  assert.throws(() => replay(drop((_, i) => i >= packetAt && i < all.length - 1), routedAround), /no approving PR review of the current packet/);
});

test('PRR-2: the packet names the exact candidate and the whole evidence set, and the PR reviewer is given exactly that', async () => {
  const { run, envelope, packet } = await atPrReview('prr-2', { history: true });
  const s = subjects(run);
  const packetRef = s.pr_review_packet as string;
  assert.ok(parsePrReviewPacket(artifact(run, packetRef)).ok, 'the retained packet is a valid record of its format');
  const started = events(run)[0]!.data as Record<string, string>;
  const verification = json<ExecutionRecord>(run, s.verification!);
  const baseline = json<ExecutionRecord>(run, s.proof_baseline!);
  const finalPlan = json<FinalPlan>(run, s.final_plan!);
  assert.deepEqual(packet.identity, {
    workflow: started.workflow_ref,
    profile: started.profile_ref,
    app_config: started.app_config_ref,
    review_procedure: refOf(DEFAULT_PR_REVIEW_PROCEDURE),
    composer_format: COMPOSER_FORMAT,
    evidence_class: 'SIMULATED',
  });
  assert.deepEqual(packet.requirements, { source: s.source, intent: s.intent, spec: s.spec, answers: null });
  assert.deepEqual(packet.planning, {
    last_audited_plan: s.plan,
    audit: s.audit,
    final_plan: s.final_plan,
    decision: finalPlan.decision,
    brief: s.brief,
    plan_status: 'AS_AUDITED',
    dispositions: null,
  });
  assert.deepEqual(packet.implementation, { base: s.base, proof_tree: s.proof_tree, candidate: s.candidate });
  assert.deepEqual(packet.execution, {
    proof: s.proof,
    proof_baseline: s.proof_baseline,
    proof_baseline_output: baseline.output,
    verification: s.verification,
    verification_output: verification.output,
  });
  assert.deepEqual([packet.technical_review.review, packet.technical_review.verdict, packet.technical_review.attempt_id], [s.review, 'ACCEPT', 'review-1']);

  // History: what failed or was replaced before this point, each by retained identity.
  const journal = events(run);
  assert.equal(packet.history.journal_cutoff, journal.findIndex((e) => e.type === 'pr_review_packet_recorded'));
  assert.deepEqual(packet.history.failed_attempts.map((f) => [f.attempt_id, f.step_id, f.kind]), [['proof-1', 'proof', 'EXECUTION_UNCERTAIN']]);
  assert.equal(packet.history.failed_verifications.length, 1);
  assert.notEqual(packet.history.failed_verifications[0]!.candidate, s.candidate, 'the failed verification was of the earlier candidate');
  assert.deepEqual(packet.history.superseded_results.map((r) => [r.step_id, r.attempt_id]), [['implement', 'implement-1']]);
  assert.equal(packet.history.not_included.length, 1, 'what the packet does not bind is said, not left out');

  const failed = packet.history.failed_verifications[0]!;
  assert.equal(failed.output, json<ExecutionRecord>(run, failed.verification).output, 'what the failed run printed is named');
  assert.deepEqual(packet.history.superseded_results[0]!.produced, [{ key: 'candidate', record: failed.candidate }], 'what the superseded result produced is named');

  // Every identity a review may cite is retained, history included. The
  // packet's two digests name no retained record and are not among them.
  const citable = packetIdentities(packet);
  for (const ref of citable) assert.ok(existsSync(artifactPath(run, ref)), `${ref} is retained`);
  for (const ref of [failed.verification, failed.candidate, failed.output]) assert.ok(citable.includes(ref), 'history can be cited');
  for (const digest of [packet.technical_review.input_digest, packet.history.journal_digest]) {
    assert.ok(!citable.includes(digest), 'a digest is not evidence');
    assert.ok(!existsSync(artifactPath(run, digest)), 'and names no retained record');
  }
  // It holds identities and measured facts, and no account of the work.
  assert.doesNotMatch(artifact(run, packetRef), /summary|SIMULATED developer|narrative/);

  // The reviewer's inputs: the packet, the procedure, and the records the packet names. No developer result.
  assert.deepEqual(Object.keys(envelope.inputs).sort(), [
    'audit',
    'base',
    'candidate',
    'final_plan',
    'intent',
    'pr_review_packet',
    'pr_review_procedure',
    'proof',
    'proof_baseline',
    'proof_tree',
    'review',
    'source',
    'spec',
    'verification',
  ]);
  assert.equal(envelope.inputs.pr_review_packet, packetRef);
  assert.equal(artifact(run, envelope.inputs.pr_review_procedure as string), DEFAULT_PR_REVIEW_PROCEDURE);
  assert.equal(envelope.app_dir, 'work/pr-review-1/app', 'it reads its own copy of the candidate');
  assert.deepEqual(envelope.produces, { pr_review: 'pr-review.json' });
});

// ---------------------------------------------------------------- PRR-3

test('PRR-3: a result from another role, for another attempt, or for another subject is not a PR review', async () => {
  const { run, envelope } = await atPrReview('prr-3');
  const { engine } = run.assembly;
  const good = approving(run, envelope);

  assert.equal(engine.submit(run.runId, result(envelope, { role: 'reviewer' })).code, 'ROLE_MISMATCH', 'the code reviewer cannot answer for the PR reviewer');
  assert.equal(engine.submit(run.runId, result(envelope, { input_digest: `sha256:${'0'.repeat(64)}` })).code, 'INPUT_MISMATCH');
  assert.equal(engine.submit(run.runId, result(envelope, { expected_version: envelope.state_version - 1 })).code, 'STALE_STATE_VERSION');
  // The settled code-review attempt cannot be used again, with any content.
  assert.equal(engine.submit(run.runId, result(envelope, { attempt_id: 'review-1' })).code, 'CONFLICTING_DUPLICATE');
  assert.equal(engine.submit(run.runId, result(envelope, { attempt_id: 'pr-review-9' })).code, 'UNKNOWN_ATTEMPT');

  // A review of another packet or another candidate is refused by the contract.
  const s = subjects(run);
  const otherPacket = submitPrReview(run, envelope, { ...good, subject: { ...good.subject, packet: s.review } });
  assert.equal(otherPacket.code, 'CONTRACT_VIOLATION');
  assert.match(JSON.stringify(otherPacket.detail), /is not the packet this review was given/);
  const otherCandidate = submitPrReview(run, envelope, { ...good, subject: { ...good.subject, candidate: s.proof_tree } });
  assert.match(JSON.stringify(otherCandidate.detail), /is not the candidate this review was given/);
  assert.equal(engine.status(run.runId).stage, 'pr-review', 'nothing was accepted');
  assert.equal(submitPrReview(run, envelope, good).code, 'ACCEPTED');
});

// ---------------------------------------------------------------- contract

test('PR review contract: verdicts need what makes them mean something, text is bounded and plain, and nothing unknown is carried', async () => {
  const { run, envelope, packet } = await atPrReview('prr-contract');
  const good = approving(run, envelope);
  const packetRef = envelope.inputs.pr_review_packet as string;
  const expected = { packet: packetRef, candidate: envelope.inputs.candidate as string, permitted: new Set([packetRef, ...packetIdentities(packet)]) };
  const issuesOf = (record: unknown): string => {
    const parsed = parsePrReview(typeof record === 'string' ? record : JSON.stringify(record), expected);
    return parsed.ok ? '' : parsed.issues.join('\n');
  };
  assert.equal(issuesOf(good), '', 'the fixture approval is valid');
  const finding = { id: 'F1', target: 'summary', classification: 'MAJOR', evidence: 'the summary', consequence: 'misleads', resolution: 'reword' };
  const unchecked = (item: string): PrReview['coverage'] => good.coverage.map((c) => (c.item === item ? { item, status: 'NOT_CHECKED', evidence: '', note: 'not examined' } : c));
  const unknown = `sha256:${'a'.repeat(64)}`;

  const refused: [string, unknown, RegExp][] = [
    // APPROVE
    ['approval with no analysis of the change', { ...good, change_analysis: [] }, /APPROVE needs at least one statement of what changed/],
    ['approval with no analysis of the testing', { ...good, testing_analysis: [] }, /APPROVE needs at least one statement of what the retained execution establishes/],
    ['approval with a mandatory item unchecked', { ...good, coverage: unchecked('verification-claims') }, /APPROVE needs "verification-claims" CHECKED/],
    ['approval with a mandatory item missing', { ...good, coverage: good.coverage.filter((c) => c.item !== 'material-risks') }, /mandatory item "material-risks" is missing/],
    ['approval with a major finding', { ...good, findings: [finding] }, /APPROVE cannot stand with a BLOCKING or MAJOR finding/],
    ['approval with a blocking finding', { ...good, findings: [{ ...finding, classification: 'BLOCKING' }] }, /APPROVE cannot stand/],
    // REQUEST_CHANGES and INCONCLUSIVE
    ['a request for changes with no finding', { ...good, verdict: 'REQUEST_CHANGES' }, /REQUEST_CHANGES verdict needs at least one finding/],
    ['a finding that states no resolution', { ...good, verdict: 'REQUEST_CHANGES', findings: [{ ...finding, resolution: '   ' }] }, /findings\[0\]\.resolution: must not be blank/],
    ['a finding with no evidence', { ...good, verdict: 'REQUEST_CHANGES', findings: [{ ...finding, evidence: '' }] }, /findings\[0\]\.evidence/],
    ['inconclusive with no limitation', { ...good, verdict: 'INCONCLUSIVE', limitations: [] }, /INCONCLUSIVE verdict must state what prevented a conclusion/],
    ['a verdict outside the three', { ...good, verdict: 'ACCEPT' }, /verdict: expected one of APPROVE, REQUEST_CHANGES, INCONCLUSIVE/],
    // Evidence
    ['a citation that is not evidence of the packet', { ...good, evidence_references: [unknown] }, /is not evidence of the packet this review was given/],
    ['an analysis citing unknown evidence', { ...good, change_analysis: [{ text: 'x', evidence: [unknown] }] }, /change_analysis\[0\]\.evidence\[0\].*is not evidence of the packet/],
    ['an analysis citing nothing', { ...good, testing_analysis: [{ text: 'x', evidence: [] }] }, /testing_analysis\[0\]\.evidence: must cite at least one retained record/],
    ['an analysis citing only the dispatch digest', { ...good, change_analysis: [{ text: 'x', evidence: [packet.technical_review.input_digest] }] }, /change_analysis\[0\]\.evidence\[0\].*is not evidence of the packet/],
    ['an analysis citing only the journal digest', { ...good, testing_analysis: [{ text: 'x', evidence: [packet.history.journal_digest] }] }, /testing_analysis\[0\]\.evidence\[0\].*is not evidence of the packet/],
    ['a digest among the references', { ...good, evidence_references: [packet.history.journal_digest] }, /evidence_references\[0\].*is not evidence of the packet/],
    ['a checked item citing nothing', { ...good, coverage: good.coverage.map((c, i) => (i === 0 ? { ...c, evidence: '' } : c)) }, /a CHECKED item must cite what was examined/],
    ['a coverage item twice', { ...good, coverage: [...good.coverage, good.coverage[0]] }, /"intent-fidelity" appears twice/],
    ['a finding id twice', { ...good, findings: [{ ...finding, classification: 'MINOR' }, { ...finding, classification: 'MINOR' }] }, /"F1" appears twice/],
    // Bounds and plain text
    ['a title over the limit', { ...good, title: 'x'.repeat(121) }, /title: longer than 120/],
    ['a title of two lines', { ...good, title: 'one\ntwo' }, /title: contains a control character/],
    ['a summary over the limit', { ...good, summary: 'x'.repeat(1201) }, /summary: longer than 1200/],
    ['a control character in the summary', { ...good, summary: `clean${String.fromCharCode(27)}[2J` }, /summary: contains a control character/],
    ['a blank summary', { ...good, summary: '   ' }, /summary: must not be blank/],
    ['too many analysis entries', { ...good, change_analysis: Array(13).fill(good.change_analysis[0]) }, /change_analysis: more than 12 entries/],
    ['a record over the size limit', JSON.stringify({ ...good, reviewer_notes: [] }).replace('{', `{${' '.repeat(64 * 1024)}`), /larger than 65536 bytes/],
    // Nothing unknown, and no field that could stand in for a machine fact.
    ['a changed-paths field', { ...good, changed_paths: ['src/other.js'] }, /changed_paths: unknown field/],
    ['a test-result field', { ...good, tests_passed: 999 }, /tests_passed: unknown field/],
    ['a candidate field', { ...good, candidate: unknown }, /pr_review\.candidate: unknown field/],
    ['a publication field', { ...good, publication_status: 'PUBLISHED' }, /publication_status: unknown field/],
    ['a field inside the subject', { ...good, subject: { ...good.subject, verification: unknown } }, /subject\.verification: unknown field/],
    ['a field inside an analysis entry', { ...good, change_analysis: [{ ...good.change_analysis[0], files_changed: 0 }] }, /files_changed: unknown field/],
    ['another record type', { ...good, record_type: 'review-result' }, /record_type: expected "pr-review-result"/],
    ['a future schema', { ...good, schema_version: 2 }, /schema version 2 is not supported/],
  ];
  for (const [name, record, issue] of refused) assert.match(issuesOf(record), issue, name);

  // The other two verdicts are valid with what they need, and a minor finding does not prevent approval.
  assert.equal(issuesOf({ ...good, verdict: 'REQUEST_CHANGES', findings: [finding] }), '');
  assert.equal(issuesOf({ ...good, verdict: 'INCONCLUSIVE', coverage: unchecked('intent-fidelity') }), '');
  assert.equal(issuesOf({ ...good, findings: [{ ...finding, classification: 'MINOR' }] }), '');
  // A team's own item may be added beside the mandatory ones.
  assert.equal(issuesOf({ ...good, coverage: [...good.coverage, { item: 'team: migration notes present', status: 'NOT_CHECKED', evidence: '', note: 'no migration in this change' }] }), '');
  // The engine refuses a digest as a citation at acceptance as well.
  const digestOnly = submitPrReview(run, envelope, { ...good, change_analysis: [{ text: 'x', evidence: [packet.technical_review.input_digest] }] });
  assert.equal(digestOnly.code, 'CONTRACT_VIOLATION');
  assert.match(JSON.stringify(digestOnly.detail), /is not evidence of the packet this review was given/);
  assert.equal(run.assembly.engine.status(run.runId).stage, 'pr-review', 'nothing was accepted');
  // A file of one of the packet's trees may be cited once the engine permits it.
  const leaf = `sha256:${json<TreeManifest>(run, packet.implementation.base).files[0]!.sha256}`;
  const withLeaf = { ...good, evidence_references: [leaf] };
  const reply = submitPrReview(run, envelope, withLeaf);
  assert.equal(reply.code, 'ACCEPTED', JSON.stringify(reply.detail));
});

// ---------------------------------------------------------------- PRR-4, PRR-5, PRR-6, PRR-15

test('PRR-4, PRR-15: an approving PR review produces the proposal once, local and unpublished', async () => {
  const run = await atPacket('prr-4');
  const { engine } = run.assembly;
  const accepted = prReviewStep(run);
  assert.deepEqual(accepted.directive, { kind: 'CONTINUE', pending: null });
  assert.deepEqual(engine.status(run.runId).pr_review, { verdict: 'APPROVE', record: subjects(run).pr_review });
  const end = engine.next(run.runId);
  assert.equal(end.code, 'PROPOSAL_READY');
  assert.equal(end.directive?.kind === 'DONE' && end.directive.publication_status, 'NOT_ATTEMPTED');
  assert.equal(engine.next(run.runId).code, 'NO_WORK', 'a finished run composes nothing more');
  assert.equal(eventTypes(run).filter((t) => t === 'proposal_recorded').length, 1);
  assert.deepEqual(readdirSync(join(run.runDir, 'proposal')), ['pr-proposal.json'], 'one local file and nothing else');

  const s = subjects(run);
  const proposal = proposalOf(run);
  assert.deepEqual(
    [proposal.schema_version, proposal.status, proposal.publication_status, proposal.composer_format, proposal.pr_review_packet, proposal.pr_review],
    [2, 'PR_PROPOSAL_READY', 'NOT_ATTEMPTED', COMPOSER_FORMAT, s.pr_review_packet, s.pr_review],
  );
  assert.deepEqual(proposal.reviews, { code_review: { record: s.review, verdict: 'ACCEPT' }, pr_review: { record: s.pr_review, verdict: 'APPROVE' } });
  assert.match(proposal.body, /Publication status: NOT_ATTEMPTED\. This is a local proposal; no pull request was created\./);
  assert.doesNotMatch(JSON.stringify(proposal), /https?:|pr_url|pull_request_id|PR_CREATED|merged/i);
  assert.deepEqual(verifyPacket(run.runDir).problems, []);
});

for (const [name, behavior, blocker, verdict] of [
  ['PRR-5: a PR review that returns REQUEST_CHANGES is retained, blocks the run, and starts no repair', 'reject', 'PR_REVIEW_CHANGES_REQUESTED', 'REQUEST_CHANGES'],
  ['PRR-6: a PR review that returns INCONCLUSIVE is retained, blocks the run, and starts no repair', 'unexamined', 'PR_REVIEW_INCONCLUSIVE', 'INCONCLUSIVE'],
] as const) {
  test(name, async () => {
    const run = await atPacket(name.slice(0, 5).toLowerCase());
    const { engine } = run.assembly;
    const done = prReviewStep(run, behavior);
    const record = subjects(run).pr_review as string;
    assert.deepEqual(done.directive, {
      kind: 'BLOCKED',
      blocker,
      detail: `the PR review of the candidate returned ${verdict}; its findings and limitations are in the retained record ${record}`,
      pr_review: { verdict, record },
    });
    // The verdict, the findings or limitations, and the evidence identity all remain readable.
    const retained = json<PrReview>(run, record);
    assert.equal(retained.verdict, verdict);
    if (verdict === 'REQUEST_CHANGES') assert.deepEqual(retained.findings.map((f) => [f.id, f.classification]), [['F1', 'MAJOR']]);
    else assert.ok(retained.limitations.length > 0);
    assert.deepEqual(engine.status(run.runId).pr_review, { verdict, record });
    assert.deepEqual([engine.status(run.runId).phase, engine.status(run.runId).stage], ['BLOCKED', 'pr-review']);

    // Nothing follows: no proposal, no repair, no second review, no override.
    const before = journalText(run);
    for (const call of [engine.next(run.runId), engine.resume(run.runId), engine.next(run.runId)]) {
      assert.equal(call.directive?.kind, 'BLOCKED');
      assert.ok(call.code === 'NO_WORK' || call.code === 'RESUMED', call.code);
    }
    const transport = createFakeTransport(run.assembly.runsRoot);
    assert.equal(driveRun(engine, transport, run.runId).last.directive?.kind, 'BLOCKED');
    assert.deepEqual(transport.dispatched, [], 'no developer, reviewer, or PR reviewer is dispatched after it');
    assert.equal(journalText(run), before, 'nothing was recorded after the block');
    assert.ok(!existsSync(join(run.runDir, 'proposal')));
    // A later approval for the same attempt cannot replace the verdict.
    const acceptedResult = JSON.parse(artifact(run, events(run).at(-1)!.data.result_ref as string)) as Record<string, unknown>;
    assert.equal(engine.submit(run.runId, JSON.stringify({ ...acceptedResult, summary: 'a different answer for the same attempt' })).code, 'CONFLICTING_DUPLICATE');
    assert.equal(journalText(run), before);
    assert.deepEqual(evaluateDeterministic(run.runDir).outcome, { status: 'BLOCKED', stage: 'pr-review', blocker });
  });
}

test('PRR-5, PRR-6: a refused or failed invocation is not a negative review, and a negative review is never asked again', async () => {
  const { run, envelope } = await atPrReview('prr-retry');
  const { engine } = run.assembly;
  // Output the contract refuses: the attempt is closed as a failed invocation and one more is permitted by the profile.
  assert.equal(submitPrReview(run, envelope, { ...approving(run, envelope), verdict: 'LOOKS GOOD' }).code, 'CONTRACT_VIOLATION');
  assert.equal(subjects(run).pr_review, undefined, 'a refused record is not retained as a review');
  assert.equal(engine.abandon(run.runId, envelope.attempt_id, 'refused output').code, 'FAILURE_RECORDED');
  const second = pendingOf(engine.next(run.runId));
  assert.equal(second.attempt_id, 'pr-review-2');
  assert.equal(second.inputs.pr_review_packet, envelope.inputs.pr_review_packet, 'the same packet; nothing was reassembled for the retry');
  // A valid negative review from that attempt ends it. The remaining budget is not used to ask for another answer.
  assert.equal(submitPrReview(run, second, prReview(run.runDir, second, 'reject')).code, 'ACCEPTED');
  assert.equal(engine.status(run.runId).phase, 'BLOCKED');
  assert.equal(engine.next(run.runId).code, 'NO_WORK');
  assert.deepEqual(eventTypes(run).filter((t) => t === 'task_dispatched').length, events(run).filter((e) => e.type === 'task_dispatched').length);
  assert.equal(events(run).filter((e) => e.type === 'task_dispatched' && e.data.step_id === 'pr-review').length, 2);
  // A profile that allows one attempt blocks on the failed invocation itself, as for any role.
  const profile = JSON.parse(readFileSync(PROFILE, 'utf8')) as Profile;
  assert.equal(profile.roles['pr-reviewer']?.max_attempts, profile.roles.reviewer?.max_attempts);
});

// ---------------------------------------------------------------- PRR-7, PRR-8

test('PRR-7: a candidate file changed, substituted, or removed after the code review stops the PR review from being accepted', async () => {
  const { run, envelope, packet } = await atPrReview('prr-7');
  const { engine } = run.assembly;
  const candidate = json<TreeManifest>(run, packet.implementation.candidate);
  const source = candidate.files.find((f) => f.path === 'src/export.js')!;
  const leaf = join(run.runDir, 'artifacts', source.sha256);
  const original = readFileSync(leaf);
  const manifestPath = artifactPath(run, packet.implementation.candidate);
  const manifest = readFileSync(manifestPath);
  const raw = result(envelope);
  const version = engine.status(run.runId).state_version;
  const refused = (what: string): void => {
    const reply = engine.submit(run.runId, raw);
    assert.deepEqual([reply.ok, reply.code], [false, 'MISSING_INPUT'], what);
    assert.equal(engine.status(run.runId).state_version, version, `${what}: nothing was recorded`);
    assert.equal(subjects(run).pr_review, undefined, what);
  };
  writeFileSync(leaf, 'export function handleExport() { return { status: 200 }; }\n');
  refused('a changed file with its tree record unchanged');
  writeFileSync(leaf, readFileSync(join(run.runDir, 'artifacts', json<TreeManifest>(run, packet.implementation.base).files.find((f) => f.path === 'src/export.js')!.sha256)));
  refused('the file substituted by the unchanged application\'s version');
  rmSync(leaf);
  refused('a missing file');
  writeFileSync(leaf, original);
  writeFileSync(manifestPath, manifest.toString().replace(source.sha256, '0'.repeat(64)));
  refused('a changed tree record');
  writeFileSync(manifestPath, manifest);
  assert.equal(engine.submit(run.runId, raw).code, 'ACCEPTED', 'with the evidence as retained, the same result is accepted');
});

test('PRR-7: a PR review is accepted only while the copy of the candidate it was given is unchanged', async () => {
  const { run, envelope } = await atPrReview('prr-7-copy');
  const { engine } = run.assembly;
  const app = join(run.runDir, envelope.app_dir as string);
  const file = join(app, 'src', 'export.js');
  const original = readFileSync(file);
  const raw = result(envelope);
  const version = engine.status(run.runId).state_version;
  const candidate = subjects(run).candidate;
  const refused = (what: string, code: string, detail: RegExp): void => {
    const reply = engine.submit(run.runId, raw);
    assert.deepEqual([reply.ok, reply.code], [false, code], what);
    assert.match(JSON.stringify(reply.detail), detail, what);
    assert.equal(engine.status(run.runId).state_version, version, `${what}: nothing was recorded`);
    assert.equal(subjects(run).pr_review, undefined, what);
  };
  const changed = /may not change the copy of the candidate it was given/;
  // The retained candidate is untouched throughout; only the reviewer's copy differs from it.
  writeFileSync(file, 'export function handleExport() { return { status: 200 }; }\n');
  refused('a file changed in the copy', 'WRITE_BOUNDARY_VIOLATION', /"paths":\["src\/export\.js"\]/);
  refused('the same refusal says why', 'WRITE_BOUNDARY_VIOLATION', changed);
  writeFileSync(file, original);
  writeFileSync(join(app, 'src', 'added.js'), 'export const added = true;\n');
  refused('a file added to the copy', 'WRITE_BOUNDARY_VIOLATION', /"paths":\["src\/added\.js"\]/);
  rmSync(join(app, 'src', 'added.js'));
  rmSync(file);
  refused('a file removed from the copy', 'WRITE_BOUNDARY_VIOLATION', /"paths":\["src\/export\.js"\]/);
  writeFileSync(file, original);
  const moved = `${app}-moved`;
  renameSync(app, moved);
  refused('the copy taken away', 'UNSAFE_PATH', /cannot be read/);
  renameSync(moved, app);
  assert.equal(subjects(run).candidate, candidate);
  assert.equal(engine.submit(run.runId, raw).code, 'ACCEPTED', 'with the copy as it was given, the same result is accepted');
});

test('PRR-8: every dependency of the packet is re-established before assembly, before dispatch, before acceptance, and before composition', async () => {
  const run = await atPacket('prr-8', { history: true });
  const { engine } = run.assembly;
  // History the packet will name, taken from the journal before the packet exists:
  // the failed run, what it printed, the earlier candidate it ran on, a file only
  // that candidate has, and the failure record of the refused proof.
  const failedRun = events(run).find((e) => e.type === 'verification_recorded' && e.data.outcome !== 'PASS')!.data as Record<string, string>;
  const inForce = new Set(['base', 'proof_tree', 'candidate'].flatMap((key) => json<TreeManifest>(run, subjects(run)[key]!).files.map((f) => f.sha256)));
  const earlierOnly = json<TreeManifest>(run, failedRun.candidate!).files.find((f) => !inForce.has(f.sha256));
  assert.ok(earlierOnly, 'the earlier candidate has a file that no tree in force has');
  const history: [string, string][] = [
    ['history: the failed attempt', events(run).find((e) => e.type === 'attempt_failed')!.data.failure_ref as string],
    ['history: the failed verification', failedRun.verification_ref!],
    ['history: what the failed verification printed', json<ExecutionRecord>(run, failedRun.verification_ref!).output],
    ['history: the earlier candidate tree record', failedRun.candidate!],
    ['history: a file only the earlier candidate has', `sha256:${earlierOnly.sha256}`],
    ['history: the superseded result', events(run).find((e) => e.type === 'result_accepted' && e.data.attempt_id === 'implement-1')!.data.result_ref as string],
  ];
  const sweepOf = (list: [string, string][], point: string, step: () => Reply): void => {
    for (const [what, ref] of list) {
      const path = artifactPath(run, ref);
      const original = readFileSync(path);
      for (const how of ['changed', 'removed']) {
        if (how === 'removed') rmSync(path);
        else writeFileSync(path, Buffer.concat([original, Buffer.from('\n')]));
        const before = journalText(run);
        const reply = step();
        writeFileSync(path, original);
        assert.deepEqual([reply.ok, reply.code], [false, 'MISSING_INPUT'], `${point}: ${what} ${how}`);
        assert.equal(journalText(run), before, `${point}: ${what} ${how}: nothing was recorded`);
      }
    }
  };
  sweepOf(history, 'before assembly', () => engine.next(run.runId));
  assert.equal(subjects(run).pr_review_packet, undefined, 'no packet was assembled on damaged history');
  assert.equal(engine.next(run.runId).code, 'PR_REVIEW_PACKET_READY');
  const s = subjects(run);
  const packet = json<PrReviewPacket>(run, s.pr_review_packet!);
  assert.deepEqual(packet.history.failed_verifications, [{ verification: history[1]![1], candidate: history[3]![1], output: history[2]![1] }]);
  assert.deepEqual(packet.history.superseded_results.map((r) => [r.result, r.produced]), [[history[5]![1], [{ key: 'candidate', record: history[3]![1] }]]]);
  const relied: [string, string][] = [
    ['the packet', s.pr_review_packet!],
    ['the PR review procedure', packet.identity.review_procedure],
    ['the audited plan', packet.planning.last_audited_plan],
    ['the final plan', packet.planning.final_plan],
    ['the audit', packet.planning.audit],
    ['the authorizing decision', packet.planning.decision],
    ['the brief', packet.planning.brief],
    ['the specification', packet.requirements.spec],
    ['the intent', packet.requirements.intent],
    ['the request', packet.requirements.source],
    ['the proof', packet.execution.proof],
    ['the verification', packet.execution.verification],
    ['what the verification printed', packet.execution.verification_output],
    ['the proof baseline', packet.execution.proof_baseline],
    ['what the proof baseline printed', packet.execution.proof_baseline_output],
    ['the code review', packet.technical_review.review],
    ['the code review result', packet.technical_review.result],
    ...history,
    ['the candidate tree record', packet.implementation.candidate],
    ['the proof tree record', packet.implementation.proof_tree],
    ['the base tree record', packet.implementation.base],
    ['the workflow definition', packet.identity.workflow],
    ['the profile', packet.identity.profile],
    ['the application configuration', packet.identity.app_config],
  ];
  // Each dependency is changed and then removed; `step` must refuse both, with nothing recorded.
  const sweep = (point: string, step: () => Reply): void => sweepOf(relied, point, step);
  sweep('before dispatch', () => engine.next(run.runId));
  assert.ok(!existsSync(join(run.runDir, 'work', 'pr-review-1')), 'no PR review was dispatched on damaged evidence');
  const envelope = pendingOf(engine.next(run.runId));
  const raw = result(envelope);
  sweep('before acceptance', () => engine.submit(run.runId, raw));
  assert.equal(engine.submit(run.runId, raw).code, 'ACCEPTED');
  relied.push(['the PR review', subjects(run).pr_review!], ['the PR review result', events(run).at(-1)!.data.result_ref as string]);
  sweep('before composition', () => engine.next(run.runId));
  assert.ok(!existsSync(join(run.runDir, 'proposal')));
  assert.equal(engine.next(run.runId).code, 'PROPOSAL_READY');
});

test('PRR-8: evidence that is intact but no longer agrees with itself is refused, and a later journal record does not make a packet stale', async () => {
  const { run, envelope } = await atPrReview('prr-8-relations', { history: true });
  const state = (): RunState => JSON.parse(readFileSync(join(run.runDir, 'state.json'), 'utf8')) as RunState;
  const retainedRef = subjects(run).pr_review_packet as string;
  const cutoff = json<PrReviewPacket>(run, retainedRef).history.journal_cutoff;
  const sources = (change: Partial<PacketSources> = {}): PacketSources => ({
    state: state(),
    events: events(run),
    journal: readFileSync(join(run.runDir, 'journal.jsonl')),
    cutoff,
    read: (_name, ref) => artifact(run, ref as string),
    ...change,
  });
  // Assembling again from what is retained gives the same bytes, although the journal has grown since.
  assert.ok(events(run).length > cutoff + 1, 'the journal has records after the packet');
  assert.equal(refOf(packetText(buildPrReviewPacket(sources()))), retainedRef);
  // Every identity a review may cite is read while the packet is assembled: what is permitted is what was resolved.
  const asked = new Set<string>();
  const assembled = buildPrReviewPacket(sources({ read: (_name, ref) => (asked.add(ref as string), artifact(run, ref as string)) }));
  for (const id of packetIdentities(assembled)) assert.ok(asked.has(id), `${id} is read when the packet is assembled`);
  assert.equal(run.assembly.engine.submit(run.runId, result(envelope)).code, 'ACCEPTED');
  assert.equal(refOf(packetText(buildPrReviewPacket(sources()))), retainedRef, 'accepting the PR review does not change its own subject');

  // Records swapped for others that are just as well retained: relationships are checked, not only hashes.
  const s = subjects(run);
  const swap = (ref: string, change: (record: any) => void): PacketSources['read'] => (_name, asked) => {
    if (asked !== ref) return artifact(run, asked as string);
    const record = JSON.parse(artifact(run, ref));
    change(record);
    return JSON.stringify(record);
  };
  const inconsistent = (name: string, change: Partial<PacketSources>, why: RegExp): void => {
    assert.throws(() => buildPrReviewPacket(sources(change)), (e: Error & { code?: string }) => e.code === 'PR_REVIEW_EVIDENCE_INCONSISTENT' && why.test(e.message), name);
  };
  inconsistent('a verification of another tree', { read: swap(s.verification!, (r) => (r.tree = s.proof_tree)) }, /verification is not a passing run of this proof on this candidate/);
  inconsistent('a verification that did not pass', { read: swap(s.verification!, (r) => (r.classification.outcome = 'FAIL')) }, /verification is not a passing run/);
  inconsistent('a verification under another plan', { read: swap(s.verification!, (r) => (r.final_plan = s.plan)) }, /under this specification and plan/);
  inconsistent('a baseline of another tree', { read: swap(s.proof_baseline!, (r) => (r.tree = s.base)) }, /proof baseline is not a valid run/);
  inconsistent('a code review that rejected', { read: swap(s.review!, (r) => Object.assign(r, { verdict: 'REJECT', findings: [{ id: 'F1', target: 'x', classification: 'MAJOR', evidence: 'x', consequence: 'x', resolution: 'x' }] })) }, /code review did not accept/);
  inconsistent('a code review of another candidate', { read: swap(s.review!, (r) => (r.subject.candidate = s.proof_tree)) }, /not a valid review of this candidate/);
  inconsistent('a final plan naming another decision', { read: swap(s.final_plan!, (r) => (r.decision = s.audit)) }, /final plan names another decision/);
  inconsistent('a final plan naming another audit', { read: swap(s.final_plan!, (r) => (r.audit = s.plan)) }, /final plan names another audit/);
  const given = (key: string): JournalEvent[] =>
    events(run).map((e) => (e.type === 'task_dispatched' && e.data.step_id === 'review' ? { ...e, data: { ...e.data, inputs: { ...(e.data.inputs as object), [key]: s.source } } } : e));
  inconsistent('a code review given another final plan', { events: given('final_plan') }, /code review was given another final_plan/);
  inconsistent('a code review given another audit', { events: given('audit') }, /code review was given another audit/);
  inconsistent('a journal shorter than the packet covers', { events: events(run).slice(0, cutoff - 1) }, /fewer than/);
  const { failed_verifications: failedRuns, superseded_results: replaced } = json<PrReviewPacket>(run, retainedRef).history;
  inconsistent('a failed verification that says it passed', { read: swap(failedRuns[0]!.verification, (r) => (r.classification.outcome = 'PASS')) }, /failed verification is not the recorded run/);
  inconsistent('a failed verification of another tree', { read: swap(failedRuns[0]!.verification, (r) => (r.tree = s.candidate)) }, /failed verification is not the recorded run/);
  inconsistent('a superseded result of another attempt', { read: swap(replaced[0]!.result, (r) => (r.attempt_id = 'implement-9')) }, /superseded result answers another attempt/);
  const planning = { ...state().planning!, final_plan: s.plan! };
  inconsistent('a plan that is not the authorized one', { state: { ...state(), planning } }, /not the authorized one/);
});

test('PRR-8: when the execution environment changes, the code review, the packet, and the PR review are all established again', async () => {
  let version = 'v-original';
  const real = createNodeTestExecutor();
  const executor: TestExecutor = {
    id: real.id,
    run: (r) => ({ ...real.run(r), environment: { ...real.environment(r.env), version } }),
    environment: (declared) => ({ ...real.environment(declared), version }),
  };
  const run = await atPacket('prr-8-environment', { engine: { resolveExecutor: () => executor } });
  const { engine } = run.assembly;
  prReviewStep(run);
  const before = subjects(run);
  assert.equal(engine.status(run.runId).stage, 'proposal');

  // After an approving PR review, immediately before composition.
  version = 'v-other';
  assert.equal(engine.next(run.runId).code, 'EVIDENCE_STALE');
  assert.ok(!existsSync(join(run.runDir, 'proposal')), 'no proposal on stale evidence');
  const after = subjects(run);
  assert.deepEqual([after.verification, after.review, after.pr_review_packet, after.pr_review], [undefined, undefined, undefined, undefined]);
  assert.equal(engine.status(run.runId).pr_review, undefined, 'the earlier approval is not carried forward');
  assert.equal(engine.status(run.runId).stage, 'verify');

  version = 'v-original';
  assert.equal(engine.next(run.runId).code, 'VERIFICATION_PASSED');
  completeStep(run);
  // What the dropped PR review produced is history the new packet names: no packet is assembled without it.
  const dropped = artifactPath(run, before.pr_review!);
  const droppedBytes = readFileSync(dropped);
  rmSync(dropped);
  assert.deepEqual([engine.next(run.runId).code, subjects(run).pr_review_packet], ['MISSING_INPUT', undefined]);
  writeFileSync(dropped, droppedBytes);
  assert.equal(engine.next(run.runId).code, 'PR_REVIEW_PACKET_READY');
  const envelope = pendingOf(engine.next(run.runId));
  assert.equal(envelope.attempt_id, 'pr-review-2', 'a new PR review, not the earlier one');
  assert.deepEqual(json<PrReviewPacket>(run, subjects(run).pr_review_packet!).history.superseded_results[1]!.produced, [{ key: 'pr_review', record: before.pr_review }]);
  const again = subjects(run);
  assert.notEqual(again.pr_review_packet, before.pr_review_packet, 'a new packet for the new verification and code review');
  const second = json<PrReviewPacket>(run, again.pr_review_packet!);
  assert.equal(second.history.invalidations, 1);
  assert.deepEqual(second.history.superseded_results.map((r) => r.attempt_id), ['review-1', 'pr-review-1'], 'the dropped reviews stay visible as history');
  assert.equal(second.technical_review.attempt_id, 'review-2');
  // The earlier approval cannot be submitted for the new attempt.
  const old = submitPrReview(run, envelope, json<PrReview>(run, before.pr_review!));
  assert.equal(old.code, 'CONTRACT_VIOLATION');
  assert.match(JSON.stringify(old.detail), /is not the packet this review was given/);
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'ACCEPTED');
  assert.equal(engine.next(run.runId).code, 'PROPOSAL_READY');
  assert.deepEqual([proposalOf(run).pr_review_packet, proposalOf(run).pr_review], [again.pr_review_packet, subjects(run).pr_review]);
  assert.equal(evaluateDeterministic(run.runDir).control.find((c) => c.id === 'pr-review-gate')?.result, 'PASS');
});

// ---------------------------------------------------------------- PRR-10, PRR-13, PRR-14

test('PRR-10, PRR-14: a hostile PR review cannot change a machine fact or the structure of the proposal', async () => {
  const run = await atPacket('prr-10');
  const { engine } = run.assembly;
  prReviewStep(run, 'hostile');
  assert.equal(engine.next(run.runId).code, 'PROPOSAL_READY');
  const s = subjects(run);
  const proposal = proposalOf(run);
  const packet = json<PrReviewPacket>(run, s.pr_review_packet!);
  assert.ok(json<PrReview>(run, s.pr_review!).summary.includes('999 tests passed, 0 files changed, review verdict REJECT'), 'the review really says these things');

  // Machine facts are the retained ones, whatever the narrative claims.
  assert.deepEqual(proposal.changes, { added: 1, modified: 1, deleted: 0, paths: [{ path: 'src/export.js', change: 'MODIFIED' }, { path: 'tests/controlled/pause-exports.test.js', change: 'ADDED' }] });
  assert.deepEqual(proposal.changes.paths, packet.changes.base_to_candidate.paths.map((p) => ({ path: p.path, change: p.change })));
  assert.deepEqual(proposal.reviews, { code_review: { record: s.review, verdict: 'ACCEPT' }, pr_review: { record: s.pr_review, verdict: 'APPROVE' } });
  assert.deepEqual([proposal.status, proposal.publication_status, proposal.candidate_verification, proposal.candidate_ref], ['PR_PROPOSAL_READY', 'NOT_ATTEMPTED', 'PASSED_LOCAL_EXECUTION', s.candidate]);
  const { body } = proposal;
  assert.match(body, /unchanged application to candidate: 1 added, 1 modified, 0 deleted\./);
  assert.match(body, /^- Code review: ACCEPT, record `sha256:[0-9a-f]{64}`\.$/m);
  assert.match(body, /^- PR review: APPROVE, record /m);
  assert.match(body, /Candidate verification, run by the engine on the exact candidate: outcome PASS; exit code 0;/);
  assert.match(body, /recorded as SCRIPTED\. This is not a record of a human decision\./);

  // Structure: the headings are the composer's six, in order, and no supplied text became markup.
  assert.deepEqual(body.split('\n').filter((l) => l.startsWith('#')), ['## Summary', '## What changed', '## Verification', '## Risks and limitations', '## Review and planning basis', '## Evidence references']);
  assert.doesNotMatch(body, /<script|<img|<\/script>/i, 'no markup survives');
  assert.doesNotMatch(body, /(^|[^\\])\[click\]\(/, 'no link syntax survives');
  assert.doesNotMatch(body, /(^|[^\\])\{\{/, 'no template expression survives');
  assert.ok(body.includes(`\n${mdText(HOSTILE_PR_TEXT)}\n`) && body.includes(`\n- ${mdText(HOSTILE_PR_TEXT)}\n`), 'the hostile text is placed only as escaped text');
  assert.ok(body.includes('\\# Injected heading &lt;script&gt;alert("x")&lt;/script&gt; \\[click\\](http://example.invalid) \\{\\{secret\\}\\} $\\{env\\} \\| 999 tests passed'), 'the text is shown, inert');
  // Every line the hostile text is on begins with the composer's own list marker or is the summary paragraph.
  for (const line of body.split('\n').filter((l) => l.includes('Injected heading'))) assert.match(line, /^(- )?\\# Injected heading/);
  // The title is the reviewer's recommendation, kept as plain text in its own field.
  assert.equal(proposal.title, 'Pause exports <script>alert(1)</script> {{title}}');
  assert.ok(!body.includes(proposal.title), 'the title is not placed in the body');
});

test('PRR-14: text from outside the composer is made inert for Markdown', () => {
  const cases: [string, string][] = [
    ['# heading', '\\# heading'],
    ['- item', '\\- item'],
    ['+ item', '\\+ item'],
    ['=== rule', '\\=== rule'],
    ['1. ordered', '1\\. ordered'],
    ['12) ordered', '12\\) ordered'],
    ['line one\n## line two\r\n- three', 'line one ## line two - three'],
    ['<b>bold</b> & <!-- c -->', '&lt;b&gt;bold&lt;/b&gt; &amp; &lt;!-- c --&gt;'],
    ['&lt;already&gt;', '&amp;lt;already&amp;gt;'],
    ['[text](http://x) ![img](y)', '\\[text\\](http://x) !\\[img\\](y)'],
    ['`code` *em* _em_ ~~gone~~', '\\`code\\` \\*em\\* \\_em\\_ \\~\\~gone\\~\\~'],
    ['{{template}} ${expr}', '\\{\\{template\\}\\} $\\{expr\\}'],
    ['a | b', 'a \\| b'],
    ['back\\slash', 'back\\\\slash'],
    ['  padded  ', 'padded'],
    ['tests/controlled/pause_exports.test.js', 'tests/controlled/pause\\_exports.test.js'],
  ];
  for (const [input, expected] of cases) assert.equal(mdText(input), expected, JSON.stringify(input));
  const controls = mdText(`a${String.fromCharCode(0)}b${String.fromCharCode(27)}c${String.fromCharCode(0x2028)}d${String.fromCharCode(9)}e`);
  assert.equal(controls, `a${String.fromCharCode(0xfffd)}b${String.fromCharCode(0xfffd)}c${String.fromCharCode(0xfffd)}d${String.fromCharCode(0xfffd)}e`, 'control characters are shown as the replacement character');
  assert.ok(!mdText('anything\nat all').includes('\n'), 'supplied text never spans lines');
});

test('PRR-13: the code review\'s verdict, findings, limitations, and unchecked items, and the plan\'s unaudited amendments, reach the proposal as they are', async () => {
  const minor = { id: 'F7', target: 'src/export.js <b>', classification: 'MINOR' as const, evidence: 'The flag name is not documented.', consequence: 'Operators must read the code.', resolution: 'Document the flag.' };
  const run = await atPacket('prr-13', { amend: true, review: (r) => ({ ...r, findings: [minor], limitations: [...r.limitations, 'Load behaviour was not examined.'] }) });
  const { engine } = run.assembly;
  prReviewStep(run);
  assert.equal(engine.next(run.runId).code, 'PROPOSAL_READY');
  const { body } = proposalOf(run);
  const section = (from: string, to: string): string => body.slice(body.indexOf(from), body.indexOf(to));
  const risks = section('## Risks and limitations', '## Review and planning basis');
  assert.match(risks, /Code review, findings that did not prevent acceptance:\n\n- F7 \(MINOR\) src\/export\.js &lt;b&gt;: The flag name is not documented\. Consequence: Operators must read the code\. Resolution: Document the flag\./);
  assert.match(risks, /Code review, limitations:\n\n- FIXTURE review: one record comparison by test code; no model and no examination of the change\.\n- Load behaviour was not examined\./);
  assert.match(risks, /Code review, items not checked:\n\n- Whether the change is a sound way to satisfy each criterion: FIXTURE: no model read the candidate\./);
  assert.match(risks, /Plan: status AMENDED_NOT_REAUDITED; audit verdict HOLDS in round 1/);
  assert.match(risks, /Plan amendments that were not audited:\n\n- A1 on U1: Check authorization \\\*before\\\* the flag\./);
  assert.match(risks, /Audit items not checked:\n\n- Whether each unit would actually satisfy its criteria:/);
  // None of this came from the PR reviewer: its fixture record mentions none of it.
  const pr = artifact(run, subjects(run).pr_review!);
  for (const absent of ['F7', 'Load behaviour', 'AMENDED_NOT_REAUDITED', 'A1 on U1']) assert.ok(!pr.includes(absent), absent);
  assert.match(section('## Review and planning basis', '## Evidence references'), /- Code review: ACCEPT, record /);
});

// ---------------------------------------------------------------- PRR-11, PRR-12

test('PRR-11: added, modified, and deleted paths are measured from the trees, including what the proof added', async () => {
  const tree = (files: Record<string, string>): TreeManifest => ({
    schema_version: 1,
    record_type: 'tree',
    files: Object.entries(files)
      .map(([path, content]) => ({ path, sha256: refOf(content).slice(7), bytes: content.length }))
      .sort((a, b) => (a.path < b.path ? -1 : 1)),
  });
  const base = tree({ 'a.js': 'a', 'b.js': 'b', 'dir/c.js': 'c', 'same.js': 's' });
  const candidate = tree({ 'a.js': 'a2', 'dir/c.js': 'c', 'dir/new.js': 'n', 'same.js': 's', 'tests/controlled/t.test.js': 't' });
  const id = (content: string): string => refOf(content);
  assert.deepEqual(changeSet(base, candidate), {
    added: 2,
    modified: 1,
    deleted: 1,
    paths: [
      { path: 'a.js', change: 'MODIFIED', before: id('a'), after: id('a2') },
      { path: 'b.js', change: 'DELETED', before: id('b'), after: null },
      { path: 'dir/new.js', change: 'ADDED', before: null, after: id('n') },
      { path: 'tests/controlled/t.test.js', change: 'ADDED', before: null, after: id('t') },
    ],
  });
  assert.deepEqual(changeSet(base, base), { added: 0, modified: 0, deleted: 0, paths: [] });

  // In a real run: the proof added one controlled test, the implementation changed one file.
  const { run, packet } = await atPrReview('prr-11');
  const s = subjects(run);
  const files = (ref: string): Map<string, string> => new Map(json<TreeManifest>(run, ref).files.map((f) => [f.path, `sha256:${f.sha256}`]));
  const [b, p, c] = [files(s.base!), files(s.proof_tree!), files(s.candidate!)];
  assert.deepEqual(packet.changes.base_to_candidate, {
    added: 1,
    modified: 1,
    deleted: 0,
    paths: [
      { path: 'src/export.js', change: 'MODIFIED', before: b.get('src/export.js'), after: c.get('src/export.js') },
      { path: 'tests/controlled/pause-exports.test.js', change: 'ADDED', before: null, after: c.get('tests/controlled/pause-exports.test.js') },
    ],
  });
  assert.deepEqual(packet.changes.proof_tree_to_candidate, { added: 0, modified: 1, deleted: 0, paths: [{ path: 'src/export.js', change: 'MODIFIED', before: p.get('src/export.js'), after: c.get('src/export.js') }] });
  assert.equal(p.get('tests/controlled/pause-exports.test.js'), c.get('tests/controlled/pause-exports.test.js'), 'the implementation left the controlled test as the proof wrote it');
  // A packet whose counts disagree with its own list is not a valid packet.
  const text = artifact(run, s.pr_review_packet!);
  assert.ok(parsePrReviewPacket(text).ok);
  const miscounted = JSON.parse(text) as PrReviewPacket;
  miscounted.changes.base_to_candidate.added = 0;
  const parsed = parsePrReviewPacket(JSON.stringify(miscounted));
  assert.ok(!parsed.ok && /added: does not equal the number of ADDED paths/.test(parsed.issues.join('\n')));
});

test('PRR-12: execution is reported as entries by kind and status, never as a number of tests that passed', async () => {
  const t = (kind: TestOutcome['kind'], status: TestOutcome['status']): TestOutcome => ({ name: `${kind}-${status}`, kind, status, failure_kind: status === 'FAIL' ? 'ASSERTION' : null });
  const mixed = [t('TEST', 'PASS'), t('TEST', 'PASS'), t('TEST', 'FAIL'), t('TEST', 'SKIP'), t('TEST', 'TODO'), t('CONTAINER', 'PASS'), t('CONTAINER', 'FAIL')];
  assert.equal(
    entryCounts(mixed),
    '7 top-level report entries: 5 single tests (2 passed, 1 failed, 1 skipped, 1 todo) and 2 containers (1 failed). What is nested in a container is not reported, and an entry is not an assertion.',
  );
  assert.match(entryCounts([]), /^0 top-level report entries: 0 single tests \(0 passed, 0 failed, 0 skipped, 0 todo\) and 0 containers \(0 failed\)\./);

  const run = await atPacket('prr-12');
  prReviewStep(run);
  assert.equal(run.assembly.engine.next(run.runId).code, 'PROPOSAL_READY');
  const proposal = proposalOf(run);
  const s = subjects(run);
  const verification = json<ExecutionRecord>(run, s.verification!);
  const baseline = json<ExecutionRecord>(run, s.proof_baseline!);
  assert.ok(proposal.body.includes(entryCounts(verification.tests)) && proposal.body.includes(entryCounts(baseline.tests)), 'both runs are reported from their records');
  assert.ok(baseline.tests.some((x) => x.status === 'FAIL'), 'the baseline has a failing entry, and the body says so rather than hiding it');
  assert.match(proposal.body, /Proof baseline, run by the engine on the unchanged application with the controlled tests: outcome VALID; exit code 1;/);
  assert.doesNotMatch(proposal.body, /\d+ tests? passed|all tests pass/i, 'no aggregate pass claim');
  // Each criterion is shown with the route and the reported status of its named tests.
  const proof = json<Proof>(run, s.proof!);
  for (const c of proof.criteria) {
    const line = proposal.body.split('\n').find((l) => l.startsWith(`- ${c.criterion}: `));
    assert.ok(line, `${c.criterion} is listed`);
    assert.ok(line.includes(` Route ${mdText(c.route)}. In the candidate verification: "${mdText(c.tests[0]!)}" PASS (single test).`), line);
  }
});

// ---------------------------------------------------------------- PRR-19

test('PRR-19: the proposal is exactly what the composer gives for the retained records, and an interrupted packet step is not repeated', async () => {
  let interrupt = true;
  const run = await atPacket('prr-19', {
    engine: {
      onCommitted: (event) => {
        if (event.type === 'pr_review_packet_recorded' && interrupt) {
          interrupt = false;
          throw new Error('interrupted after the packet was committed');
        }
      },
    },
  });
  const { engine } = run.assembly;
  assert.throws(() => engine.next(run.runId), /interrupted after the packet was committed/);
  // The packet record is committed; the next call dispatches the PR review and assembles nothing again.
  const envelope = pendingOf(engine.next(run.runId));
  assert.equal(envelope.attempt_id, 'pr-review-1');
  assert.equal(eventTypes(run).filter((t) => t === 'pr_review_packet_recorded').length, 1);
  assert.equal(engine.resume(run.runId).code, 'RESUMED');
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'ACCEPTED');
  assert.equal(engine.next(run.runId).code, 'PROPOSAL_READY');
  assert.deepEqual(eventTypes(run).filter((t) => ['pr_review_packet_recorded', 'proposal_recorded'].includes(t)), ['pr_review_packet_recorded', 'proposal_recorded']);

  // Composing again from the retained records alone gives the same bytes as the retained proposal.
  const s = subjects(run);
  const state = JSON.parse(readFileSync(join(run.runDir, 'state.json'), 'utf8')) as RunState;
  const packet = json<PrReviewPacket>(run, s.pr_review_packet!);
  const specParsed = parseSpec(artifact(run, s.spec!));
  assert.ok(specParsed.ok);
  const input = (): ComposeInput => ({
    run_id: run.runId,
    request_id: state.request_id,
    source_ref: state.source_ref,
    transport_class: state.transport_class,
    evidence: Object.fromEntries(Object.entries(state.accepted).map(([k, v]) => [k, v.result_ref])),
    packet_ref: s.pr_review_packet!,
    packet,
    pr_review_ref: s.pr_review!,
    pr_review: json<PrReview>(run, s.pr_review!),
    review: json<Review>(run, s.review!),
    spec: specParsed.value,
    proof: json<Proof>(run, s.proof!),
    final_plan: json<FinalPlan>(run, s.final_plan!),
    baseline: json<ExecutionRecord>(run, s.proof_baseline!),
    verification: json<ExecutionRecord>(run, s.verification!),
    decision: { decision_id: 'D1', action: 'proceed', provenance: 'SCRIPTED' },
    controlled_tests_dir: 'tests/controlled',
  });
  const retained = readFileSync(join(run.runDir, 'proposal', 'pr-proposal.json'), 'utf8');
  assert.equal(canonicalJson(composeProposal(input())), retained);
  assert.equal(canonicalJson(composeProposal(input())), canonicalJson(composeProposal(input())));
  assert.equal(refOf(retained), state.proposal?.proposal_ref);
  // The composer refuses anything but an approved, accepted candidate of this packet.
  const withPr = (change: Partial<PrReview>): (() => PrProposal) => () => composeProposal({ ...input(), pr_review: { ...input().pr_review, ...change } });
  assert.throws(withPr({ verdict: 'REQUEST_CHANGES' }), /needs an accepting code review and an approving PR review/);
  assert.throws(withPr({ verdict: 'INCONCLUSIVE' }), /needs an accepting code review and an approving PR review/);
  assert.throws(withPr({ subject: { packet: s.review!, candidate: s.candidate! } }), /not of this packet and candidate/);
  assert.throws(() => composeProposal({ ...input(), review: { ...input().review, verdict: 'REJECT' } }), /needs an accepting code review/);
});

// ---------------------------------------------------------------- PRR-16

// The definition as it was at version 5: the same stages without the PR
// review. A test fixture standing for a run recorded before this change.
const V5: WorkflowDef = {
  ...WORKFLOW,
  workflow_version: 5,
  stages: WORKFLOW.stages.filter((s) => s.id !== 'pr-review-packet' && s.id !== 'pr-review').map((s) => (s.id === 'review' ? { ...s, next: 'proposal' } : s)),
};

test('PRR-16: a run recorded under workflow version 5 keeps its meaning: version 6 does not continue, relabel, or reinterpret it', async () => {
  assert.notEqual(workflowRef(V5), workflowRef(WORKFLOW));
  assert.deepEqual([WORKFLOW.workflow_version, WORKFLOW.stages.length, V5.stages.length], [6, 15, 13]);
  const run = await newRun('prr-16', { workflow: V5 });
  const old = run.assembly.engine;
  assert.equal(old.decide(run.runId, decision(toHumanWait(run))).code, 'DECISION_RECORDED');
  completeStep(run);
  completeStep(run);
  assert.equal(old.next(run.runId).code, 'VERIFICATION_PASSED');
  completeStep(run);
  assert.equal(old.status(run.runId).stage, 'proposal');
  assert.equal(subjects(run).pr_review_procedure, undefined, 'a version 5 run records no PR review procedure');
  // This engine composes no proposal without a PR review, whatever definition it is given.
  const refusedProposal = old.next(run.runId);
  assert.deepEqual([refusedProposal.ok, refusedProposal.code], [false, 'PR_REVIEW_REQUIRED']);
  assert.ok(!existsSync(join(run.runDir, 'proposal')));

  // The run as a version 5 engine would have finished it: a proposal of the
  // earlier form, recorded in the journal. Constructed here by the test.
  const s = subjects(run);
  const state = JSON.parse(readFileSync(join(run.runDir, 'state.json'), 'utf8')) as RunState;
  const v1 = {
    schema_version: 1,
    record_type: 'pr-proposal',
    run_id: run.runId,
    request_id: state.request_id,
    title: `Proposal for request ${state.request_id}`,
    body: 'Constructed by a test in the form version 5 wrote.',
    base_ref: s.base,
    candidate_ref: s.candidate,
    proof: s.proof,
    proof_tree: s.proof_tree,
    proof_baseline: s.proof_baseline,
    verification: s.verification,
    review: s.review,
    source_ref: state.source_ref,
    evidence: Object.fromEntries(Object.entries(state.accepted).map(([k, v]) => [k, v.result_ref])),
    planning_basis: { final_plan: s.final_plan, last_audited_plan: s.plan, audit: s.audit, decision: state.planning!.decision_ref, brief: s.brief, spec: s.spec, intent: s.intent },
    status: 'PR_PROPOSAL_READY',
    publication_status: 'NOT_ATTEMPTED',
    evidence_class: 'SIMULATED',
    evidence_classes: { role_results: 'SIMULATED', review: 'SIMULATED', test_execution: 'ACTUAL_LOCAL_EXECUTION' },
    candidate_verification: 'PASSED_LOCAL_EXECUTION',
  };
  mkdirSync(join(run.runDir, 'proposal'));
  writeFileSync(join(run.runDir, 'proposal', 'pr-proposal.json'), canonicalJson(v1));
  appendEvent(run.runDir, { schema_version: 1, seq: state.version + 1, run_id: run.runId, type: 'proposal_recorded', at: '2026-10-04T00:00:00.000Z', data: { proposal_ref: refOf(canonicalJson(v1)), location: 'proposal/pr-proposal.json' } });
  assert.equal(replay(events(run), V5)?.terminal, 'PR_PROPOSAL_READY', 'under its own definition the run is a finished one');
  assert.throws(() => replay(events(run), WORKFLOW), /no proposal allowed here/, 'under version 6 the same records would read as a corrupt journal');

  // The version 6 engine says what the run is, before replaying anything, and changes nothing.
  const current = createAssembly(run.workspace, { engine: { lockTimeoutMs: 400 } }).engine;
  const before = journalText(run);
  for (const call of [current.status(run.runId), current.next(run.runId), current.resume(run.runId), current.abandon(run.runId, 'review-1', 'x')]) {
    assert.deepEqual([call.ok, call.code], [false, 'WORKFLOW_MISMATCH']);
    assert.deepEqual(call.detail, { recorded: workflowRef(V5), engine: workflowRef(WORKFLOW) });
  }
  assert.equal(current.submit(run.runId, '{}').code, 'WORKFLOW_MISMATCH');
  assert.equal(journalText(run), before, 'the old run is untouched');

  // The evaluator reads it with the definition it retained: a finished version 5
  // run, with the PR review reported as not part of that workflow.
  const report = evaluateDeterministic(run.runDir);
  assert.deepEqual([report.interpreted, report.identities.workflow_version, report.identities.workflow], [true, 5, workflowRef(V5)]);
  assert.deepEqual(report.outcome, { status: 'PROPOSAL_READY', stage: 'proposal', blocker: null });
  assert.deepEqual(report.packet.problems, []);
  const gate = report.control.find((c) => c.id === 'pr-review-gate');
  assert.deepEqual([gate?.result, gate?.detail], ['NOT_APPLICABLE', 'workflow version 5 has no PR review stage; the run is not read as if it had one']);
  assert.equal(report.control.find((c) => c.id === 'proposal-links')?.detail, 'candidate, verification, review, and decision agree');
  assert.equal(report.evidence.pr_review, 'NOT_IN_THIS_WORKFLOW_VERSION');
  assert.equal(report.control.filter((c) => c.result === 'FAIL').length, 0);
  // A version 6 proposal is held to the version 6 rules: the earlier form does not satisfy them.
  const v6 = await atPacket('prr-16-v6');
  prReviewStep(v6);
  assert.equal(v6.assembly.engine.next(v6.runId).code, 'PROPOSAL_READY');
  assert.equal(evaluateDeterministic(v6.runDir).control.find((c) => c.id === 'proposal-links')?.result, 'PASS');
  const { pr_review: _review, pr_review_packet: _packet, reviews: _reviews, ...withoutReview } = proposalOf(v6);
  writeFileSync(join(v6.runDir, 'proposal', 'pr-proposal.json'), canonicalJson({ ...withoutReview, schema_version: 1 }));
  const downgraded = evaluateDeterministic(v6.runDir).control.find((c) => c.id === 'proposal-links');
  assert.equal(downgraded?.result, 'FAIL');
  assert.match(downgraded?.detail ?? '', /not in the format that carries a PR review/);
});

// ---------------------------------------------------------------- PRR-17, PRR-18

test('PRR-17: a profile without the PR reviewer is refused before a run or a package exists, and the shipped profiles give it the code reviewer\'s model alias', async () => {
  const v1 = join(PACKAGE_ROOT, 'profiles', 'trial-v1.json');
  const workspace = tmpDir('prr-17');
  const assembly = createAssembly(workspace);
  const started = await assembly.start({ request: { path: REQUEST }, appDir: APP, profilePath: v1, transportClass: 'SIMULATED' });
  assert.deepEqual([started.ok, started.code], [false, 'INVALID_PROFILE']);
  assert.match(JSON.stringify(started.detail), /profile\.roles\.pr-reviewer: missing required role/);
  assert.ok(!existsSync(assembly.runsRoot), 'no run directory was created');

  const out = join(tmpDir('prr-17-package'), 'out');
  assert.throws(
    () => generatePackage({ profileText: readFileSync(v1, 'utf8'), outDir: out }),
    (e: unknown) => e instanceof PackageError && e.code === 'INVALID_PROFILE' && /pr-reviewer: missing required role/.test(JSON.stringify(e.detail)),
  );
  assert.ok(!existsSync(out), 'no package was written');

  for (const file of [PROFILE, join(PACKAGE_ROOT, 'tests', 'fixtures', 'profiles', 'alt-test-v2.json')]) {
    const profile = JSON.parse(readFileSync(file, 'utf8')) as Profile;
    assert.equal(profile.roles['pr-reviewer']?.model_alias, profile.roles.reviewer?.model_alias, file);
    assert.equal(profile.catalog[profile.roles['pr-reviewer']!.model_alias]?.host_selector, null, `${file}: no selector is pinned for it`);
  }
  // A run needs the procedure the PR reviewer follows, and keeps the exact text it was started with.
  const custom = join(workspace, 'team-procedure.md');
  writeFileSync(custom, '# Team procedure\r\n\r\n- team: migration notes present\r\n');
  const withTeam = await assembly.start({ request: { path: REQUEST }, appDir: APP, profilePath: PROFILE, transportClass: 'SIMULATED', prReviewProcedurePath: custom });
  assert.equal(withTeam.code, 'STARTED');
  const procedureRef = (assembly.engine.status(withTeam.run_id as string).subjects as Record<string, string>).pr_review_procedure as string;
  assert.equal(readFileSync(join(assembly.runsRoot, withTeam.run_id as string, 'artifacts', procedureRef.slice(7)), 'utf8'), '# Team procedure\n\n- team: migration notes present\n');
  assert.notEqual(procedureRef, refOf(DEFAULT_PR_REVIEW_PROCEDURE));
  assert.equal((await assembly.start({ request: { path: REQUEST }, appDir: APP, profilePath: PROFILE, prReviewProcedurePath: join(workspace, 'absent.md') })).code, 'MISSING_INPUT');
  // The same through the command line, and the packet of that run is bound to the team's text.
  const viaCli = cli(['start', '--workspace', workspace, '--request', REQUEST, '--app', APP, '--profile', PROFILE, '--pr-review-procedure', custom, '--simulated']);
  assert.equal(viaCli.reply.code, 'STARTED');
  assert.equal((assembly.engine.status(viaCli.reply.run_id as string).subjects as Record<string, string>).pr_review_procedure, procedureRef);
  writeFileSync(custom, '  \n');
  assert.equal((await assembly.start({ request: { path: REQUEST }, appDir: APP, profilePath: PROFILE, prReviewProcedurePath: custom })).code, 'INVALID_PR_REVIEW_PROCEDURE');

  // A team's procedure cannot weaken what the engine requires: its own item is extra, and the mandatory ones still decide.
  const { run, envelope } = await atPrReview('prr-17-team');
  const good = approving(run, envelope);
  const teamOnly = { ...good, coverage: [{ item: 'team: migration notes present', status: 'CHECKED', evidence: 'none needed', note: '' }] };
  const weakened = submitPrReview(run, envelope, teamOnly);
  assert.equal(weakened.code, 'CONTRACT_VIOLATION');
  assert.ok((weakened.detail as { issues: string[] }).issues.includes('pr_review.coverage: mandatory item "intent-fidelity" is missing'));
});

test('PRR-18: the generated PR reviewer is a hidden worker on the coordinator\'s list, with the code reviewer\'s tools and no way to delegate, run commands, or publish', () => {
  const out = join(tmpDir('prr-18'), 'out');
  const manifest = generatePackage({ profileText: readFileSync(PROFILE, 'utf8'), outDir: out });
  const read = (role: string): string => readFileSync(join(out, '.github', 'agents', `rstack-sdlc-${role}.agent.md`), 'utf8');
  const front = (role: string): string[] => read(role).split('\n---\n')[0]!.split('\n').slice(1);
  assert.deepEqual(front('pr-reviewer'), [
    'name: rstack-sdlc-pr-reviewer',
    "description: 'RSTACK SDLC PR reviewer: independently decides whether one accepted candidate is ready to submit and writes a PR review record.'",
    'target: vscode',
    "tools: ['read', 'search', 'edit']",
    'user-invocable: false',
    'disable-model-invocation: true',
  ]);
  assert.equal(front('pr-reviewer').find((l) => l.startsWith('tools:')), front('reviewer').find((l) => l.startsWith('tools:')));
  assert.equal(
    front('coordinator').find((l) => l.startsWith('agents:')),
    "agents: ['rstack-sdlc-planner', 'rstack-sdlc-plan-auditor', 'rstack-sdlc-tester', 'rstack-sdlc-developer', 'rstack-sdlc-reviewer', 'rstack-sdlc-pr-reviewer']",
  );
  assert.deepEqual(manifest.models['pr-reviewer'], manifest.models.reviewer, 'the same model entry as the code reviewer, from the profile');
  const body = read('pr-reviewer');
  assert.match(body, /from core\/roles\/pr-reviewer\.md/);
  assert.match(body, /Use the `rstack-sdlc-application-records` Skill for record formats/);
  assert.match(body, /Your approval is not publication and not authorization to publish/);
  assert.doesNotMatch(body, /gh pr create|git push|api\.github|bitbucket\.org/i, 'the role text names no way to publish');
  // A team instruction for this role is added as text after the authored prompt and recorded with its source
  // identity. It changes no frontmatter line: not the tools, the visibility, or the model.
  const withTeam = join(tmpDir('prr-18-team'), 'out');
  const extensionsText = JSON.stringify({
    schema_version: 1,
    record_type: 'package-extensions',
    optional_skills: [],
    instructions: [{ id: 'team-pr-checklist', source: 'tests/fixtures/extensions/change-notes/SKILL.md', roles: ['pr-reviewer'], purpose: 'Stands for a team PR checklist in this test.', status: 'active' }],
  });
  const teamManifest = generatePackage({ profileText: readFileSync(PROFILE, 'utf8'), outDir: withTeam, extensionsText });
  const teamAgent = readFileSync(join(withTeam, '.github', 'agents', 'rstack-sdlc-pr-reviewer.agent.md'), 'utf8');
  assert.deepEqual(teamAgent.split('\n---\n')[0]!.split('\n').slice(1), front('pr-reviewer'));
  assert.ok(teamAgent.startsWith(body) && /## Additional instructions\n\n<!-- instruction team-pr-checklist from /.test(teamAgent.slice(body.length)));
  assert.deepEqual(teamManifest.extensions.instructions.map((i) => [i.id, i.roles, i.status]), [['team-pr-checklist', ['pr-reviewer'], 'active']]);
  assert.equal(readFileSync(join(withTeam, '.github', 'agents', 'rstack-sdlc-reviewer.agent.md'), 'utf8'), read('reviewer'), 'no other role is touched');
  // The Skill it is pointed to describes its record, and the coordinator knows the engine's new step.
  assert.match(readFileSync(join(out, '.github', 'skills', 'rstack-sdlc-application-records', 'SKILL.md'), 'utf8'), /## pr-review\.json — PR reviewer/);
  assert.match(read('coordinator'), /`PR_REVIEW_PACKET_READY`/);
  for (const item of PR_REVIEW_COVERAGE) {
    assert.ok(DEFAULT_PR_REVIEW_PROCEDURE.includes(`- ${item}:`), `the default procedure asks about ${item}`);
    assert.ok(readFileSync(join(PACKAGE_ROOT, 'core', 'skills', 'application-records', 'SKILL.md'), 'utf8').includes(`"item": "${item}"`), `the Skill template names ${item}`);
  }
});

// ---------------------------------------------------------------- PRR-20

test('PRR-20: the whole route through the PR review makes no network attempt and loads no deferred integration', () => {
  const workspace = tmpDir('prr-20');
  const log = join(workspace, 'load.log');
  writeFileSync(log, '');
  const child = spawnSync(process.execPath, ['--import', `file://${join(PACKAGE_ROOT, 'tests', 'support', 'deny-network.ts').replaceAll('\\', '/')}`, join(PACKAGE_ROOT, 'scripts', 'synthetic-run.ts'), '--workspace', workspace], {
    encoding: 'utf8',
    env: { ...process.env, RSTACK_TEST_LOG: log },
  });
  assert.equal(child.status, 0, child.stderr || child.stdout);
  const out = JSON.parse(child.stdout) as { trace: { code: string }[]; final: Reply };
  assert.ok(out.trace.some((t) => t.code === 'PR_REVIEW_PACKET_READY'), 'the run went through the PR review');
  assert.deepEqual([out.final.code, out.final.directive?.kind === 'DONE' && out.final.directive.publication_status], ['PROPOSAL_READY', 'NOT_ATTEMPTED']);
  const lines = readFileSync(log, 'utf8').split('\n').filter(Boolean);
  assert.ok(lines.some((l) => l.includes('/core/engine/proposal.ts')), 'the load log is working');
  assert.deepEqual(lines.filter((l) => l.startsWith('NETWORK')), []);
  assert.deepEqual(lines.filter((l) => /\/adapters\/(jira|bitbucket)\//.test(l)), []);
});
