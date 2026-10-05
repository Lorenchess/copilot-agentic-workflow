// Evaluation system: deterministic packet evaluation, the judge output
// contract, versioned per-run evaluations, append-only adjudication, and the
// cross-run summary. Evidence class: deterministic tests of the evaluation
// tooling. Judge outputs in this file are scripted fixtures written by the
// test; they are not judgments by a model or a person, and adjudications
// marked HUMAN_RECORDED here are fixture claims, not human review.

import assert from 'node:assert/strict';
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createFakeTransport, type FakeScript } from '../adapters/fake-transport/index.ts';
import type { TreeManifest } from '../core/contracts/app.ts';
import { driveRun } from '../core/engine/drive.ts';
import { evaluateDeterministic } from '../evals/deterministic.ts';
import {
  type Evaluation,
  acceptEvaluation,
  adjudicate,
  evidenceDigest,
  listEvaluations,
  parseEvaluation,
  prepareEvaluation,
  readAdjudications,
} from '../evals/evaluation.ts';
import { RUBRICS } from '../evals/rubrics.ts';
import { summarize } from '../evals/summary.ts';
import { PACKAGE_ROOT, type TestRun, decision, newRun, tmpDir, toHumanWait } from './support/harness.ts';

const V3 = RUBRICS['run-v3']!;

// A run driven to its end by the fake transport and a scripted decision.
async function finishedRun(label: string, script: FakeScript = {}, decide = true): Promise<TestRun> {
  const run = await newRun(label);
  const waiting = toHumanWait(run);
  if (decide) {
    run.assembly.engine.decide(run.runId, decision(waiting));
    driveRun(run.assembly.engine, createFakeTransport(run.assembly.runsRoot, script), run.runId);
  }
  return run;
}

// A scripted stand-in for a judge's output file.
function judgeOutput(run: TestRun, id: string, overrides: Partial<Evaluation> = {}, answers: Record<string, string> = {}): string {
  const evaluation: Evaluation = {
    schema_version: 1,
    record_type: 'run-evaluation',
    evaluation_id: id,
    rubric: 'run-v3',
    run_id: run.runId,
    judge: 'SCRIPTED test fixture, not a judge',
    answers: V3.questions.map((q) => ({ question: q.id, answer: answers[q.id] ?? 'UNKNOWN', evidence: 'fixture', note: 'fixture' })),
    observations: [],
    not_evaluated: [],
    ...overrides,
  };
  return JSON.stringify(evaluation, null, 2);
}

function writeJudge(run: TestRun, id: string, text: string): void {
  writeFileSync(join(run.runDir, 'evaluation', id, 'evaluation.json'), text);
}

// The evaluator's own area for one evaluation, apart from the judge's.
const controlDir = (run: TestRun, id: string): string => join(run.runDir, 'evaluation-control', id);
const judgeDir = (run: TestRun, id: string): string => join(run.runDir, 'evaluation', id);

// Prepares, writes a scripted judge output, and checks it.
function evaluated(run: TestRun, answers: Record<string, string> = {}, now?: () => Date): string {
  const id = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3', { now }).evaluation_id;
  writeJudge(run, id, judgeOutput(run, id, {}, answers));
  assert.equal(acceptEvaluation(run.runDir, id).status, 'ACCEPTED');
  return id;
}

// Puts a separated evaluation into the layout used before the areas were
// separated: every file in the judge's directory, no control directory.
function toColocated(run: TestRun, id: string): void {
  for (const name of readdirSync(controlDir(run, id))) renameSync(join(controlDir(run, id), name), join(judgeDir(run, id), name));
  rmSync(controlDir(run, id), { recursive: true });
}

function candidateSource(run: TestRun): string {
  const state = JSON.parse(readFileSync(join(run.runDir, 'state.json'), 'utf8')) as { subjects: Record<string, string> };
  const tree = JSON.parse(readFileSync(join(run.runDir, 'artifacts', state.subjects.candidate!.slice(7)), 'utf8')) as TreeManifest;
  return join(run.runDir, 'artifacts', tree.files.find((f) => f.path === 'src/export.js')!.sha256);
}

test('a valid packet is not falsely rejected, and its evidence classes stay separate', async () => {
  const run = await finishedRun('eval-valid');
  const r = evaluateDeterministic(run.runDir);
  assert.equal(r.interpreted, true);
  assert.deepEqual(r.packet.problems, []);
  assert.deepEqual(r.control.map((c) => [c.id, c.result]), [
    ['packet-resolves', 'PASS'],
    ['state-replays', 'PASS'],
    ['gate-ordering', 'PASS'],
    ['decision-basis', 'PASS'],
    ['audit-inputs-limited', 'PASS'],
    ['pr-review-gate', 'PASS'],
    ['proposal-links', 'PASS'],
    ['publication-not-attempted', 'PASS'],
  ]);
  assert.deepEqual(r.outcome, { status: 'PROPOSAL_READY', stage: 'proposal', blocker: null });
  assert.equal(r.task_completed, true);
  // Real test execution does not make the role content or the approval real.
  assert.deepEqual(r.evidence, {
    role_results: 'SIMULATED',
    test_execution: 'ACTUAL_LOCAL_EXECUTION',
    review: 'SIMULATED',
    pr_review: 'SIMULATED',
    authorization: { decision_id: 'D1', provenance: 'SCRIPTED', human_observed: 'NO' },
    host_validation: 'NOT_OBSERVED',
  });
  assert.deepEqual(r.executions.map((e) => [e.purpose, e.outcome, e.failed]), [
    ['PROOF_BASELINE', 'VALID', 1],
    ['CANDIDATE_VERIFICATION', 'PASS', 0],
  ]);
  // Tests that passed for existing behavior are not thereby shown to be sensitive.
  assert.deepEqual(r.proof, [
    { criterion: 'AC-1', route: 'RED_GREEN', sensitivity: 'DEMONSTRATED' },
    { criterion: 'AC-2', route: 'ALREADY_SATISFIED', sensitivity: 'NOT_DEMONSTRATED' },
    { criterion: 'AC-3', route: 'ALREADY_SATISFIED', sensitivity: 'NOT_DEMONSTRATED' },
  ]);
  assert.equal(r.usage, 'UNAVAILABLE');
  assert.ok(r.storage.packet_bytes > 0);
  // Per-result class is on the records themselves.
  const journal = readFileSync(join(run.runDir, 'journal.jsonl'), 'utf8');
  assert.ok(journal.split('\n').filter((l) => l.includes('"result_accepted"')).every((l) => l.includes('"evidence_class":"SIMULATED"')));
  assert.match(readFileSync(join(run.runDir, 'artifacts', r.executions[0]!.record.slice(7)), 'utf8'), /"evidence_class": "ACTUAL_LOCAL_EXECUTION"/);
});

test('missing, altered, and unresolvable evidence is reported, and no semantic judgment is requested for it', async () => {
  const run = await finishedRun('eval-damaged');
  const source = candidateSource(run);
  const original = readFileSync(source);

  writeFileSync(source, 'altered');
  const altered = evaluateDeterministic(run.runDir);
  assert.equal(altered.control.find((c) => c.id === 'packet-resolves')?.result, 'FAIL');
  assert.match(altered.packet.problems.join('\n'), /do not match/);

  rmSync(source);
  const missing = evaluateDeterministic(run.runDir);
  assert.match(missing.packet.problems.join('\n'), /is not in the packet/);
  const request = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3');
  assert.equal(request.judgeable, false);
  writeJudge(run, request.evaluation_id, judgeOutput(run, request.evaluation_id));
  const acceptance = acceptEvaluation(run.runDir, request.evaluation_id);
  assert.equal(acceptance.status, 'REJECTED');
  assert.match(acceptance.issues.join('\n'), /packet did not resolve/);
  writeFileSync(source, original);

  // A journal record that fails its checksum.
  const other = await finishedRun('eval-journal');
  const journal = join(other.runDir, 'journal.jsonl');
  writeFileSync(journal, readFileSync(journal, 'utf8').replace(/"at":"\d{4}/, '"at":"1999'));
  assert.match(evaluateDeterministic(other.runDir).packet.problems.join('\n'), /checksum mismatch/);
});

test('a run in a record format the evaluator does not interpret is reported as such, not failed', async () => {
  const run = await finishedRun('eval-format');
  const first = JSON.parse(readFileSync(join(run.runDir, 'journal.jsonl'), 'utf8').split('\n')[0]!.slice(65)) as { data: { workflow_ref: string } };
  const workflow = join(run.runDir, 'artifacts', first.data.workflow_ref.slice(7));
  writeFileSync(workflow, readFileSync(workflow, 'utf8').replace('"workflow_version":6', '"workflow_version":2'));
  const r = evaluateDeterministic(run.runDir);
  assert.equal(r.interpreted, false);
  assert.match(r.not_interpreted_reason!, /workflow version 2/);
  assert.deepEqual(r.control, [{ id: 'supported-format', result: 'UNAVAILABLE', detail: r.not_interpreted_reason }]);
  assert.equal(r.outcome.status, 'UNREADABLE');
  assert.equal(r.task_completed, false);
});

test('incomplete and blocked runs are outcomes with their own classes, not failures of the evaluator or completed tasks', async () => {
  const waiting = await finishedRun('eval-waiting', {}, false);
  const w = evaluateDeterministic(waiting.runDir);
  assert.deepEqual(w.outcome, { status: 'WAITING_HUMAN', stage: 'plan-decision', blocker: null });
  assert.equal(w.task_completed, false);
  assert.equal(w.evidence.authorization, 'NOT_APPLICABLE');
  assert.equal(w.evidence.test_execution, 'NOT_APPLICABLE');
  assert.equal(w.proof, 'NOT_APPLICABLE');
  assert.deepEqual(w.control.filter((c) => c.result === 'NOT_APPLICABLE').map((c) => c.id), ['decision-basis', 'pr-review-gate', 'proposal-links', 'publication-not-attempted']);
  assert.equal(w.control.find((c) => c.id === 'gate-ordering')?.result, 'PASS');

  const blocked = await finishedRun('eval-blocked', { implement: ['wrong', 'wrong'] });
  const b = evaluateDeterministic(blocked.runDir);
  assert.deepEqual(b.outcome, { status: 'BLOCKED', stage: 'verify', blocker: 'VERIFICATION_FAILED' });
  assert.equal(b.task_completed, false, 'a correctly blocked run is a working control, not a completed task');
  assert.equal(b.unsuccessful.failed_verifications, 2);
  assert.ok(b.control.filter((c) => c.result === 'FAIL').length === 0, 'the controls themselves held');
  assert.equal(b.evidence.test_execution, 'ACTUAL_LOCAL_EXECUTION');
});

test('judge output: malformed, incomplete, or mismatched evaluations are rejected by the contract', async () => {
  const run = await finishedRun('eval-contract');
  const expected = { evaluation_id: 'EVAL-1', run_id: run.runId };
  assert.ok(parseEvaluation(judgeOutput(run, 'EVAL-1'), V3, expected).ok);
  const base = JSON.parse(judgeOutput(run, 'EVAL-1')) as Evaluation;
  const bad: [string, string][] = [
    ['not JSON', '{"record_type":'],
    ['missing answer', JSON.stringify({ ...base, answers: base.answers.slice(1) })],
    ['unknown question', JSON.stringify({ ...base, answers: [...base.answers.slice(1), { question: 'overall-score', answer: 'YES', evidence: 'x', note: 'x' }] })],
    ['duplicate question', JSON.stringify({ ...base, answers: [...base.answers, base.answers[0]] })],
    ['answer outside the vocabulary', JSON.stringify({ ...base, answers: base.answers.map((a, i) => (i === 0 ? { ...a, answer: 'PASS' } : a)) })],
    ['numeric score', JSON.stringify({ ...base, answers: base.answers.map((a, i) => (i === 0 ? { ...a, answer: 0 } : a)) })],
    ['empty evidence', JSON.stringify({ ...base, answers: base.answers.map((a, i) => (i === 0 ? { ...a, evidence: '' } : a)) })],
    ['another run', JSON.stringify({ ...base, run_id: 'RUN-other' })],
    ['another evaluation id', JSON.stringify({ ...base, evaluation_id: 'EVAL-9' })],
    ['another rubric', JSON.stringify({ ...base, rubric: 'planning-run-v2' })],
    ['extra field', JSON.stringify({ ...base, total_score: 11 })],
    ['future schema', JSON.stringify({ ...base, schema_version: 2 })],
  ];
  for (const [name, text] of bad) assert.equal(parseEvaluation(text, V3, expected).ok, false, name);
  // Versions with a smaller vocabulary refuse the newer answer.
  const v2 = RUBRICS['planning-run-v2']!;
  const v2Output = { ...base, rubric: 'planning-run-v2', answers: v2.questions.map((q) => ({ question: q.id, answer: 'NOT_APPLICABLE', evidence: 'x', note: 'x' })) };
  assert.equal(parseEvaluation(JSON.stringify(v2Output), v2, expected).ok, false);
  assert.throws(() => prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v9'), /unsupported rubric/);
});

test('an evaluation writes only in its own area and leaves the evidence unchanged; otherwise it is rejected', async () => {
  const run = await finishedRun('eval-area');
  const before = evidenceDigest(run.runDir);
  const request = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3');
  assert.equal(request.evaluation_id, 'EVAL-1');
  assert.equal(request.judgeable, true);
  assert.deepEqual(request.evidence, before);
  assert.match(request.rubric.sha256, /^[0-9a-f]{64}$/);
  assert.equal(request.identities.workflow_version, 6);
  assert.deepEqual(readdirSync(judgeDir(run, 'EVAL-1')), [], 'the judge area starts empty');
  assert.deepEqual(readdirSync(controlDir(run, 'EVAL-1')).sort(), ['deterministic.json', 'request.json']);

  writeJudge(run, 'EVAL-1', judgeOutput(run, 'EVAL-1'));
  const accepted = acceptEvaluation(run.runDir, 'EVAL-1');
  assert.equal(accepted.status, 'ACCEPTED');
  assert.equal(accepted.evidence_unchanged, true);
  assert.deepEqual(accepted.judge, { self_reported: 'SCRIPTED test fixture, not a judge', effective_model: 'UNAVAILABLE' });
  assert.deepEqual(evidenceDigest(run.runDir), before, 'preparing, judging, and accepting changed no evidence');

  // A judge that touches the run it judges, or leaves extra files, is rejected.
  const second = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3');
  writeJudge(run, second.evaluation_id, judgeOutput(run, second.evaluation_id));
  writeFileSync(join(run.runDir, 'evaluation', second.evaluation_id, 'notes.md'), 'scratch');
  writeFileSync(join(run.runDir, 'artifacts', 'planted-by-judge'), 'x');
  const rejected = acceptEvaluation(run.runDir, second.evaluation_id);
  assert.equal(rejected.status, 'REJECTED');
  assert.equal(rejected.evidence_unchanged, false);
  assert.match(rejected.issues.join('\n'), /unexpected file in the evaluation area: notes\.md/);
  assert.match(rejected.issues.join('\n'), /run evidence changed/);
  rmSync(join(run.runDir, 'artifacts', 'planted-by-judge'));

  // A malformed output is rejected and kept, marked as rejected.
  const third = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3');
  writeJudge(run, third.evaluation_id, '{"answers": "all good"}');
  assert.equal(acceptEvaluation(run.runDir, third.evaluation_id).status, 'REJECTED');
  assert.ok(existsSync(join(run.runDir, 'evaluation', third.evaluation_id, 'evaluation.json')));
  assert.deepEqual(listEvaluations(run.runDir).map((e) => [e.evaluation_id, e.status]), [['EVAL-1', 'ACCEPTED'], ['EVAL-2', 'REJECTED'], ['EVAL-3', 'REJECTED']]);
});

test('re-evaluation gets a new identity and leaves earlier evaluations byte-identical', async () => {
  const run = await finishedRun('eval-again');
  prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3');
  writeJudge(run, 'EVAL-1', judgeOutput(run, 'EVAL-1', {}, { 'spec-fidelity': 'YES' }));
  acceptEvaluation(run.runDir, 'EVAL-1');
  const snapshot = (): string =>
    [judgeDir(run, 'EVAL-1'), controlDir(run, 'EVAL-1')].flatMap((dir) => readdirSync(dir).sort().map((f) => `${f}:${readFileSync(join(dir, f), 'utf8')}`)).join('\n');
  assert.deepEqual(readdirSync(controlDir(run, 'EVAL-1')).sort(), ['acceptance.json', 'deterministic.json', 'request.json']);
  const first = snapshot();

  assert.throws(() => prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3', { evaluationId: 'EVAL-1' }), /already exists/);
  const again = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3');
  assert.equal(again.evaluation_id, 'EVAL-2');
  writeJudge(run, 'EVAL-2', judgeOutput(run, 'EVAL-2', {}, { 'spec-fidelity': 'NO' }));
  assert.equal(acceptEvaluation(run.runDir, 'EVAL-2').status, 'ACCEPTED');
  assert.equal(snapshot(), first, 'the earlier evaluation is untouched');
  // Checking an already checked evaluation again changes nothing.
  assert.equal(acceptEvaluation(run.runDir, 'EVAL-1').status, 'ACCEPTED');
  assert.equal(snapshot(), first);
  assert.deepEqual(listEvaluations(run.runDir).map((e) => e.evaluation?.answers[0]?.answer), ['YES', 'NO'], 'both judgments remain readable');
});

test('human adjudication is appended beside the judgment and never overwrites it', async () => {
  const run = await finishedRun('eval-adjudicate');
  prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3');
  writeJudge(run, 'EVAL-1', judgeOutput(run, 'EVAL-1', {}, { 'audit-verdict-supported': 'YES' }));
  const file = join(run.runDir, 'evaluation', 'EVAL-1', 'evaluation.json');
  assert.throws(() => adjudicate(run.runDir, 'EVAL-1', { question: 'spec-fidelity', label: 'CONFIRM', note: 'x', recorded_by: 'x', provenance: 'SCRIPTED' }), /has been checked/);
  acceptEvaluation(run.runDir, 'EVAL-1');
  const judged = readFileSync(file, 'utf8');
  const base = { note: 'fixture note', recorded_by: 'test fixture' };

  adjudicate(run.runDir, 'EVAL-1', { ...base, question: 'audit-verdict-supported', label: 'REJECT', answer: 'NO', provenance: 'SCRIPTED' });
  adjudicate(run.runDir, 'EVAL-1', { ...base, question: 'spec-fidelity', label: 'CONFIRM', provenance: 'SCRIPTED' });
  adjudicate(run.runDir, 'EVAL-1', { ...base, question: 'plan-serves-spec', label: 'UNRESOLVED', provenance: 'SCRIPTED' });
  // A later entry on the same question is added; the earlier one stays.
  adjudicate(run.runDir, 'EVAL-1', { ...base, question: 'audit-verdict-supported', label: 'MODIFY', answer: 'UNKNOWN', provenance: 'SCRIPTED' });

  assert.equal(readFileSync(file, 'utf8'), judged, 'the judge output is byte-identical');
  const entries = readAdjudications(run.runDir, 'EVAL-1');
  assert.deepEqual(entries.map((e) => [e.seq, e.question, e.label, e.answer]), [
    [1, 'audit-verdict-supported', 'REJECT', 'NO'],
    [2, 'spec-fidelity', 'CONFIRM', null],
    [3, 'plan-serves-spec', 'UNRESOLVED', null],
    [4, 'audit-verdict-supported', 'MODIFY', 'UNKNOWN'],
  ]);
  assert.ok(entries.every((e) => e.evaluation_sha256 === entries[0]!.evaluation_sha256));
  assert.equal((JSON.parse(judged) as Evaluation).answers.find((a) => a.question === 'audit-verdict-supported')?.answer, 'YES', 'the AI label is still the AI label');

  const refuse = (entry: Record<string, string | undefined>, why: RegExp): void =>
    assert.throws(() => adjudicate(run.runDir, 'EVAL-1', { ...base, question: 'spec-fidelity', label: 'CONFIRM', provenance: 'SCRIPTED', ...entry } as never), why);
  refuse({ label: 'REJECT' }, /needs the human's answer/);
  refuse({ label: 'CONFIRM', answer: 'NO' }, /takes no answer/);
  refuse({ label: 'APPROVE' }, /label must be/);
  refuse({ question: 'overall' }, /is not a question/);
  refuse({ provenance: 'VERIFIED_HUMAN' }, /provenance must be/);
  refuse({ note: ' ' }, /note and recorded_by/);
  assert.equal(readAdjudications(run.runDir, 'EVAL-1').length, 4, 'refused entries were not written');

  // If the judge output is changed after acceptance, adjudication stops.
  writeFileSync(file, judged.replace('fixture', 'edited'));
  refuse({}, /changed after it was accepted/);
  writeFileSync(file, judged);
});

test('cross-run summary: denominators, explicit rubric selection, no double counting, and nothing unknown counted as pass or zero', async () => {
  const complete = await finishedRun('sum-complete');
  const blocked = await finishedRun('sum-blocked', { implement: ['wrong', 'wrong'] });
  const waiting = await finishedRun('sum-waiting', {}, false);
  const damaged = await finishedRun('sum-damaged');
  rmSync(candidateSource(damaged));
  const legacy = await finishedRun('sum-legacy');
  const first = JSON.parse(readFileSync(join(legacy.runDir, 'journal.jsonl'), 'utf8').split('\n')[0]!.slice(65)) as { data: { workflow_ref: string } };
  rmSync(join(legacy.runDir, 'artifacts', first.data.workflow_ref.slice(7)));

  // Two accepted evaluations under v3 on one run, one under another rubric, one rejected.
  for (const [id, answer] of [['EVAL-1', 'YES'], ['EVAL-2', 'NO']] as const) {
    prepareEvaluation(PACKAGE_ROOT, complete.runDir, 'run-v3');
    writeJudge(complete, id, judgeOutput(complete, id, {}, { 'spec-fidelity': answer, 'proof-satisfied-sensitive': 'YES', 'plan-serves-spec': 'NOT_APPLICABLE' }));
    assert.equal(acceptEvaluation(complete.runDir, id).status, 'ACCEPTED');
  }
  const old = join(complete.runDir, 'evaluation', 'OLD-1');
  mkdirSync(old);
  writeFileSync(join(old, 'evaluation.json'), JSON.stringify({ rubric: 'planning-run-v2', answers: [{ question: 'gate-ordering', answer: 'YES' }] }));
  prepareEvaluation(PACKAGE_ROOT, blocked.runDir, 'run-v3');
  writeJudge(blocked, 'EVAL-1', '{}');
  assert.equal(acceptEvaluation(blocked.runDir, 'EVAL-1').status, 'REJECTED');

  // The complete run imported a second time through a copy.
  const imports = join(tmpDir('sum-imports'), complete.runId);
  cpSync(complete.runDir, imports, { recursive: true });
  const dirs = [complete.runDir, blocked.runDir, waiting.runDir, damaged.runDir, legacy.runDir, imports];
  const expectations = { [complete.runId]: { label: 'complete', answers: { 'spec-fidelity': 'YES', 'proof-satisfied-sensitive': 'YES' } } };
  const s = summarize(dirs, 'run-v3', expectations);

  assert.equal(s.duplicates_ignored, 1, 'the imported copy is the same run');
  assert.equal(s.runs.length, 5);
  assert.deepEqual(s.not_interpreted.map((r) => r.run_id), [legacy.runId]);
  // Four interpreted runs; the one in an unknown format is in no denominator.
  assert.equal(s.metrics.run_outcome!.denominator, 4);
  assert.deepEqual(s.metrics.run_outcome!.counts, { PROPOSAL_READY: 2, 'BLOCKED:VERIFICATION_FAILED': 1, WAITING_HUMAN: 1 });
  assert.deepEqual(s.metrics.packet_integrity!.counts, { RESOLVES: 3, DOES_NOT_RESOLVE: 1 });
  assert.deepEqual(s.metrics.task_completed!.counts, { COMPLETED: 1, NOT_COMPLETED: 2, EVIDENCE_DOES_NOT_RESOLVE: 1 }, 'a proposal whose evidence does not resolve is not a completed task');
  // Only runs that ran a verification are eligible; the waiting run is not counted as a failure.
  assert.equal(s.metrics.final_verification!.denominator, 3);
  assert.deepEqual(s.metrics.final_verification!.counts, { PASS: 2, FAIL: 1 });
  assert.equal(s.metrics.human_authorization!.denominator, 3, 'the waiting run has no authorizing decision');
  assert.deepEqual(s.metrics.human_authorization!.counts, { 'SCRIPTED:human_observed=NO': 3 });
  assert.deepEqual(s.metrics.host_validation!.counts, { NOT_OBSERVED: 4 });
  assert.deepEqual(s.metrics.role_content_class!.counts, { SIMULATED: 4 });
  assert.deepEqual(s.metrics.proof_sensitivity!.counts, { 'RED_GREEN:DEMONSTRATED': 3, 'ALREADY_SATISFIED:NOT_DEMONSTRATED': 6 });
  assert.equal(s.metrics['control:proposal-links']!.denominator, 2, 'not-applicable results are outside the denominator');
  assert.equal(s.metrics['control:proposal-links']!.counts.NOT_APPLICABLE, 2);
  for (const m of Object.values(s.metrics)) assert.ok(m.measures && m.eligible && m.source && m.missing, 'every metric says what it is');

  // Judge answers: one run has an accepted v3 evaluation; the latest one is used, once.
  assert.match(s.selection, /latest evaluation ACCEPTED under run-v3/);
  assert.equal(s.judge_answers['spec-fidelity']!.denominator, 1);
  assert.deepEqual(s.judge_answers['spec-fidelity']!.counts, { NO: 1 }, 'the later evaluation, not both and not the copy');
  assert.deepEqual(s.judge_answers['plan-serves-spec']!.counts, { NOT_APPLICABLE: 1 });
  assert.deepEqual(s.judge_answers['audit-verdict-supported']!.counts, { UNKNOWN: 1 }, 'unknown stays unknown');
  const row = s.runs.find((r) => r.run_id === complete.runId)!;
  assert.deepEqual(row.evaluation, { id: 'EVAL-2', status: 'ACCEPTED' });
  assert.deepEqual(row.other_evaluations, [
    { id: 'EVAL-1', rubric: 'run-v3', status: 'ACCEPTED' },
    { id: 'OLD-1', rubric: 'planning-run-v2', status: 'LEGACY' },
  ]);
  assert.equal(s.runs.find((r) => r.run_id === blocked.runId)!.evaluation, null, 'a rejected evaluation is not aggregated');
  // The other rubric aggregates only its own evaluations: none are accepted under it.
  assert.equal(summarize(dirs, 'planning-run-v2').judge_answers['gate-ordering']!.denominator, 0);

  // Fixture expectations are compared, and are not human labels.
  assert.deepEqual([s.fixture_agreement.compared, s.fixture_agreement.agree], [2, 1]);
  assert.deepEqual(s.fixture_agreement.disagree, [{ run_id: complete.runId, question: 'spec-fidelity', expected: 'YES', judged: 'NO' }]);

  // Calibration: scripted entries do not count as human; a recorded human entry does, beside the AI answer.
  assert.equal(s.human_calibration.status, 'HUMAN CALIBRATION PENDING');
  const entry = { question: 'spec-fidelity', label: 'REJECT', answer: 'YES', note: 'fixture', recorded_by: 'test fixture' };
  adjudicate(complete.runDir, 'EVAL-2', { ...entry, provenance: 'SCRIPTED' });
  const scripted = summarize(dirs, 'run-v3').human_calibration;
  assert.deepEqual([scripted.status, scripted.human_recorded_entries, scripted.scripted_entries_excluded], ['HUMAN CALIBRATION PENDING', 0, 1]);
  adjudicate(complete.runDir, 'EVAL-2', { ...entry, provenance: 'HUMAN_RECORDED' });
  const after = summarize(dirs, 'run-v3');
  assert.deepEqual([after.human_calibration.status, after.human_calibration.human_recorded_entries], ['HUMAN ADJUDICATION RECORDED', 1]);
  assert.deepEqual(after.human_calibration.by_label, { REJECT: 1 });
  assert.deepEqual(after.judge_answers['spec-fidelity']!.counts, { NO: 1 }, 'the judge answer is still reported as judged');
  assert.ok(after.not_measured.some((x) => /token use, cost/.test(x)));
});

test('summary: applicable denominators, no rate without applicable cases, and one owner decision per case', async () => {
  // Three runs with scripted judge answers. Adjudications marked HUMAN_RECORDED here are fixture claims.
  const runs = [await finishedRun('cal-a', {}, false), await finishedRun('cal-b', {}, false), await finishedRun('cal-c', {}, false)];
  const answers: Record<string, string>[] = [
    { 'unsuccessful-work-visible': 'NOT_APPLICABLE', 'outcome-claim-accurate': 'NO', 'proof-satisfied-sensitive': 'YES' },
    { 'unsuccessful-work-visible': 'NOT_APPLICABLE', 'outcome-claim-accurate': 'YES', 'proof-satisfied-sensitive': 'NOT_APPLICABLE' },
    { 'outcome-claim-accurate': 'YES' },
  ];
  runs.forEach((run, i) => {
    prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3');
    writeJudge(run, 'EVAL-1', judgeOutput(run, 'EVAL-1', {}, answers[i]));
    assert.equal(acceptEvaluation(run.runDir, 'EVAL-1').status, 'ACCEPTED');
  });
  const dirs = runs.map((r) => r.runDir);
  const [a] = runs as [TestRun, TestRun, TestRun];
  const human = { recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' };

  // No applicable case: the not-applicable and unavailable answers are shown, and nothing reads as a success.
  const before = summarize(dirs, 'run-v3');
  const visible = before.judge_answers['unsuccessful-work-visible']!;
  assert.deepEqual([visible.evaluated_runs, visible.denominator, visible.not_applicable, visible.unavailable], [3, 0, 2, 1]);
  assert.deepEqual(visible.counts, { NOT_APPLICABLE: 2, UNKNOWN: 1 });
  assert.match(visible.reading, /^NO_APPLICABLE_CASES/);
  assert.equal(visible.owner_adjusted, undefined, 'nothing is owner-adjusted before an owner decision exists');
  assert.deepEqual([before.judge_answers['outcome-claim-accurate']!.denominator, before.judge_answers['proof-satisfied-sensitive']!.denominator], [3, 1]);

  adjudicate(a.runDir, 'EVAL-1', { ...human, question: 'unsuccessful-work-visible', label: 'CONFIRM', note: 'zero-event case' });
  adjudicate(a.runDir, 'EVAL-1', { ...human, question: 'outcome-claim-accurate', label: 'MODIFY', answer: 'YES', note: 'limited to the defined mechanical meaning' });
  adjudicate(a.runDir, 'EVAL-1', { ...human, question: 'proof-satisfied-sensitive', label: 'UNRESOLVED', note: 'left open' });
  const open = summarize(dirs, 'run-v3');
  assert.deepEqual([open.human_calibration.cases, open.human_calibration.unresolved], [3, 1]);
  assert.equal(open.judge_answers['proof-satisfied-sensitive']!.owner_adjusted, undefined, 'an unresolved case adjusts nothing');

  adjudicate(a.runDir, 'EVAL-1', { ...human, question: 'proof-satisfied-sensitive', label: 'MODIFY', answer: 'NO', note: 'criterion-level reading' });
  const s = summarize(dirs, 'run-v3');
  const cal = s.human_calibration;
  // Four entries on file, three cases: the later decision is selected, the earlier one is listed and not counted again.
  assert.equal(readAdjudications(a.runDir, 'EVAL-1').length, 4);
  assert.deepEqual([cal.human_recorded_entries, cal.cases, cal.unresolved, cal.owner_differs], [4, 3, 0, 2]);
  assert.deepEqual(cal.by_label, { CONFIRM: 1, MODIFY: 2 });
  const sensitive = cal.decisions.find((d) => d.question === 'proof-satisfied-sensitive')!;
  assert.deepEqual([sensitive.ai_answer, sensitive.label, sensitive.owner_answer, sensitive.earlier_entries], ['YES', 'MODIFY', 'NO', [{ seq: 3, label: 'UNRESOLVED' }]]);
  assert.equal(cal.decisions.find((d) => d.question === 'unsuccessful-work-visible')!.owner_answer, 'NOT_APPLICABLE', 'a confirmation carries the judged answer');

  // The confirmed not-applicable case stays outside the denominator in both views.
  const adjusted = s.judge_answers['unsuccessful-work-visible']!.owner_adjusted!;
  assert.deepEqual([adjusted.denominator, adjusted.not_applicable, adjusted.unavailable, adjusted.decided_cases, adjusted.caveats], [0, 2, 1, 1, []]);
  assert.match(adjusted.reading, /^NO_APPLICABLE_CASES/);

  // The judge's answers stay as judged; the owner's differing answer appears only with its note.
  const claim = s.judge_answers['outcome-claim-accurate']!;
  assert.deepEqual(claim.counts, { NO: 1, YES: 2 });
  assert.deepEqual(claim.owner_adjusted!.counts, { YES: 3 });
  assert.equal(claim.owner_adjusted!.caveats.length, 1);
  assert.match(claim.owner_adjusted!.caveats[0]!, /limited to the defined mechanical meaning/);
  assert.match(cal.reading, /not a proven judge error and no judge-accuracy rate is computed/);
  assert.doesNotMatch(JSON.stringify(s), /"[a-z_]*(rate|percent|accuracy)[a-z_]*":/, 'no rate, percentage, or accuracy figure is reported');
});

test('evaluating a run executes nothing and changes none of its evidence', async () => {
  const run = await finishedRun('eval-frozen');
  const before = evidenceDigest(run.runDir);
  const execBefore = readdirSync(join(run.runDir, 'exec')).sort();
  evaluateDeterministic(run.runDir);
  prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3');
  writeJudge(run, 'EVAL-1', judgeOutput(run, 'EVAL-1'));
  acceptEvaluation(run.runDir, 'EVAL-1');
  adjudicate(run.runDir, 'EVAL-1', { question: 'spec-fidelity', label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'SCRIPTED' });
  summarize([run.runDir], 'run-v3');
  assert.deepEqual(evidenceDigest(run.runDir), before);
  assert.deepEqual(readdirSync(join(run.runDir, 'exec')).sort(), execBefore, 'no test command was run again');
  assert.equal(run.assembly.engine.status(run.runId).state_version, evaluateDeterministic(run.runDir).packet.events, 'the journal has no new record');
});

test('D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated', async () => {
  const run = await finishedRun('eval-control');
  const first = evaluated(run, { 'spec-fidelity': 'YES' });
  assert.deepEqual(readdirSync(judgeDir(run, first)), ['evaluation.json'], 'the verdict is not written into the judge area');
  const rejectedFor = (id: string, why: RegExp): void => {
    const acceptance = acceptEvaluation(run.runDir, id);
    assert.equal(acceptance.status, 'REJECTED', String(why));
    assert.match(acceptance.issues.join('\n'), why);
    assert.equal(listEvaluations(run.runDir).find((e) => e.evaluation_id === id)!.status, 'REJECTED');
  };
  const prepared = (): string => {
    const id = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3').evaluation_id;
    writeJudge(run, id, judgeOutput(run, id, {}, { 'spec-fidelity': 'NO' }));
    return id;
  };
  // A complete, well-formed verdict, as a judge with file access could write one.
  const verdict = (id: string, text: string, evidence = '0'.repeat(64)): string =>
    JSON.stringify({ schema_version: 1, record_type: 'evaluation-acceptance', evaluation_id: id, status: 'ACCEPTED', issues: [], evaluation_sha256: text, evidence_before: evidence, evidence_after: evidence, evidence_unchanged: true, judge: { self_reported: null, effective_model: 'UNAVAILABLE' }, checked_at: '2999-01-01T00:00:00.000Z' });
  const humanLine = (id: string, sha: string): string =>
    `${JSON.stringify({ schema_version: 1, record_type: 'adjudication', seq: 1, evaluation_id: id, evaluation_sha256: sha, question: 'spec-fidelity', label: 'CONFIRM', answer: null, note: 'written by the judge', recorded_by: 'judge', provenance: 'HUMAN_RECORDED', at: '2026-01-01T00:00:00.000Z' })}\n`;

  // 1. A judge that writes its own verdict, or its own request, is rejected; its files are never read as control.
  const own = prepared();
  writeFileSync(join(judgeDir(run, own), 'acceptance.json'), verdict(own, 'x'));
  writeFileSync(join(judgeDir(run, own), 'request.json'), readFileSync(join(controlDir(run, own), 'request.json')));
  rejectedFor(own, /unexpected file in the evaluation area: acceptance\.json/);
  assert.match(acceptEvaluation(run.runDir, own).issues.join('\n'), /unexpected file in the evaluation area: request\.json/);

  // 2. A judge that writes an adjudication, in its own area or in the control area before the verdict, is rejected,
  //    and the entry never counts as human calibration.
  const inArea = prepared();
  writeFileSync(join(judgeDir(run, inArea), 'adjudication.jsonl'), humanLine(inArea, 'x'));
  rejectedFor(inArea, /unexpected file in the evaluation area: adjudication\.jsonl/);
  const inControl = prepared();
  writeFileSync(join(controlDir(run, inControl), 'adjudication.jsonl'), humanLine(inControl, 'x'));
  rejectedFor(inControl, /unexpected file in the control area before acceptance: adjudication\.jsonl/);
  assert.match(listEvaluations(run.runDir).find((e) => e.evaluation_id === inControl)!.issues.join('\n'), /on an evaluation that was not accepted/);

  // 3. A judge that alters retained evidence and rewrites the stored baseline to match is rejected by the
  //    packet check, which is recomputed from the run and does not read the request.
  const source = candidateSource(run);
  const original = readFileSync(source);
  const forged = prepared();
  writeFileSync(source, 'altered by the judge');
  const requestFile = join(controlDir(run, forged), 'request.json');
  writeFileSync(requestFile, JSON.stringify({ ...(JSON.parse(readFileSync(requestFile, 'utf8')) as object), evidence: evidenceDigest(run.runDir) }));
  rejectedFor(forged, /the packet does not resolve at acceptance/);
  assert.doesNotMatch(acceptEvaluation(run.runDir, forged).issues.join('\n'), /run evidence changed/, 'the forged baseline alone would have passed');
  writeFileSync(source, original);

  // 4. A judge that creates another evaluation in the earlier layout, verdict and human entry included.
  const maker = prepared();
  const fake = judgeDir(run, 'EVAL-90');
  mkdirSync(fake);
  const fakeText = judgeOutput(run, 'EVAL-90', {}, { 'spec-fidelity': 'NO' });
  writeFileSync(join(fake, 'evaluation.json'), fakeText);
  writeFileSync(join(fake, 'request.json'), JSON.stringify({ ...(JSON.parse(readFileSync(join(controlDir(run, maker), 'request.json'), 'utf8')) as object), evaluation_id: 'EVAL-90', prepared_at: '2999-01-01T00:00:00.000Z' }));
  rejectedFor(maker, /the judge area gained "EVAL-90" during this evaluation/);
  // Give the planted evaluation a verdict that matches its content, as a judge could.
  const planted = (): ReturnType<typeof listEvaluations>[number] => listEvaluations(run.runDir).find((e) => e.evaluation_id === 'EVAL-90')!;
  writeFileSync(join(fake, 'acceptance.json'), verdict('EVAL-90', planted().evaluation_sha256!, (JSON.parse(readFileSync(join(fake, 'request.json'), 'utf8')) as { evidence: { digest: string } }).evidence.digest));
  writeFileSync(join(fake, 'adjudication.jsonl'), humanLine('EVAL-90', planted().evaluation_sha256!));
  assert.deepEqual([planted().status, planted().layout], ['ACCEPTED', 'COLOCATED']);
  assert.match(planted().issues.join('\n'), /appeared after this run's control area was separated/);
  const withPlanted = summarize([run.runDir], 'run-v3');
  assert.equal(withPlanted.runs[0]!.evaluation, null, 'the planted evaluation is not aggregated, and nothing is silently used in its place');
  assert.match(withPlanted.runs[0]!.not_aggregated!, /^EVAL-90: /);
  assert.equal(withPlanted.human_calibration.human_recorded_entries, 0);
  assert.equal(withPlanted.judge_answers['spec-fidelity']!.evaluated_runs, 0);
  rmSync(fake, { recursive: true });

  // With the planted directory gone, the one accepted evaluation is aggregated; the rejected ones never are.
  const clean = summarize([run.runDir], 'run-v3');
  assert.deepEqual(clean.runs[0]!.evaluation, { id: first, status: 'ACCEPTED' });
  assert.equal(clean.runs[0]!.not_aggregated, null);
  assert.deepEqual(clean.judge_answers['spec-fidelity']!.counts, { YES: 1 });
  assert.deepEqual(clean.runs[0]!.other_evaluations.map((e) => e.status), ['REJECTED', 'REJECTED', 'REJECTED', 'REJECTED', 'REJECTED']);

  // 5. An accepted output edited afterwards is listed with the issue and not aggregated. The earlier accepted
  //    evaluation is not used in its place. The original bytes, once back, are aggregated again.
  const later = evaluated(run, { 'spec-fidelity': 'NO' });
  adjudicate(run.runDir, later, { question: 'spec-fidelity', label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' });
  const file = join(judgeDir(run, later), 'evaluation.json');
  const accepted = readFileSync(file, 'utf8');
  const intact = summarize([run.runDir], 'run-v3');
  assert.deepEqual([intact.runs[0]!.evaluation, intact.human_calibration.human_recorded_entries], [{ id: later, status: 'ACCEPTED' }, 1]);
  assert.deepEqual(intact.judge_answers['spec-fidelity']!.counts, { NO: 1 });

  writeFileSync(file, accepted.replace('"NO"', '"YES"'));
  const edited = listEvaluations(run.runDir).find((e) => e.evaluation_id === later)!;
  assert.deepEqual([edited.status, edited.evaluation, edited.issues], ['ACCEPTED', null, ['evaluation.json is not the content that was accepted']]);
  const changed = summarize([run.runDir], 'run-v3');
  assert.equal(changed.runs[0]!.evaluation, null);
  assert.match(changed.runs[0]!.not_aggregated!, new RegExp(`^${later}: evaluation\\.json is not the content that was accepted`));
  assert.deepEqual(changed.runs[0]!.other_evaluations.find((e) => e.id === later)!.issues, ['evaluation.json is not the content that was accepted']);
  assert.deepEqual([changed.judge_answers['spec-fidelity']!.evaluated_runs, changed.human_calibration.human_recorded_entries], [0, 0]);
  rmSync(file);
  assert.equal(summarize([run.runDir], 'run-v3').runs[0]!.evaluation, null, 'a removed output is not the accepted content either');
  writeFileSync(file, accepted);
  assert.deepEqual(summarize([run.runDir], 'run-v3').runs[0]!.evaluation, { id: later, status: 'ACCEPTED' });

  // 6. After the verdict: a control file dropped into the judge area is reported and never read, and an
  //    adjudication line that does not name the accepted content is left out and reported.
  writeFileSync(join(judgeDir(run, later), 'adjudication.jsonl'), humanLine(later, edited.accepted_sha256!));
  const dropped = summarize([run.runDir], 'run-v3');
  assert.equal(dropped.runs[0]!.evaluation, null);
  assert.match(dropped.runs[0]!.not_aggregated!, /unexpected file in the evaluation area: adjudication\.jsonl/);
  assert.equal(readAdjudications(run.runDir, later).length, 1, 'only the control area is read');
  rmSync(join(judgeDir(run, later), 'adjudication.jsonl'));
  const controlAdjudications = join(controlDir(run, later), 'adjudication.jsonl');
  const kept = readFileSync(controlAdjudications);
  appendFileSync(controlAdjudications, humanLine(later, 'another-content'));
  const stray = listEvaluations(run.runDir).find((e) => e.evaluation_id === later)!;
  assert.deepEqual([stray.adjudications.length, stray.issues], [1, ['adjudication entry 2 does not name the accepted content of this evaluation']]);
  assert.equal(summarize([run.runDir], 'run-v3').human_calibration.human_recorded_entries, 0);
  writeFileSync(controlAdjudications, kept);
  assert.equal(summarize([run.runDir], 'run-v3').human_calibration.human_recorded_entries, 1);
});

test('evaluations in the earlier colocated layout are read as recorded and never rewritten; an unchecked one cannot be accepted', async () => {
  const run = await finishedRun('eval-colocated');
  const id = evaluated(run, { 'spec-fidelity': 'YES' });
  adjudicate(run.runDir, id, { question: 'spec-fidelity', label: 'MODIFY', answer: 'NO', note: 'fixture', recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' });
  toColocated(run, id);
  assert.equal(existsSync(join(run.runDir, 'evaluation-control')), true);
  rmSync(join(run.runDir, 'evaluation-control'), { recursive: true });
  const bytes = (): string => readdirSync(judgeDir(run, id)).sort().map((f) => `${f}:${readFileSync(join(judgeDir(run, id), f), 'utf8')}`).join('\n');
  const recorded = bytes();
  assert.deepEqual(readdirSync(judgeDir(run, id)).sort(), ['acceptance.json', 'adjudication.jsonl', 'deterministic.json', 'evaluation.json', 'request.json']);

  const [stored] = listEvaluations(run.runDir);
  assert.deepEqual([stored!.layout, stored!.status, stored!.issues, stored!.adjudications.length], ['COLOCATED', 'ACCEPTED', [], 1]);
  const s = summarize([run.runDir], 'run-v3');
  assert.deepEqual(s.runs[0]!.evaluation, { id, status: 'ACCEPTED' });
  assert.deepEqual([s.human_calibration.human_recorded_entries, s.human_calibration.decisions[0]!.owner_answer], [1, 'NO']);
  assert.equal(acceptEvaluation(run.runDir, id).status, 'ACCEPTED', 'the recorded verdict is returned');
  assert.equal(bytes(), recorded, 'reading, summarizing, and re-checking rewrote nothing');

  // A later adjudication is appended where the earlier ones are; nothing else changes and nothing is moved.
  const lines = join(judgeDir(run, id), 'adjudication.jsonl');
  const earlier = readFileSync(lines, 'utf8');
  const others = (): string => bytes().replace(readFileSync(lines, 'utf8'), '');
  const othersBefore = others();
  adjudicate(run.runDir, id, { question: 'plan-serves-spec', label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' });
  assert.equal(readAdjudications(run.runDir, id).length, 2);
  assert.ok(readFileSync(lines, 'utf8').startsWith(earlier), 'earlier lines are untouched');
  assert.equal(others(), othersBefore);
  assert.equal(existsSync(controlDir(run, id)), false);

  // The accepted-content check covers this layout too.
  const file = join(judgeDir(run, id), 'evaluation.json');
  const accepted = readFileSync(file, 'utf8');
  writeFileSync(file, accepted.replace('"YES"', '"NO"'));
  assert.equal(summarize([run.runDir], 'run-v3').runs[0]!.evaluation, null);
  writeFileSync(file, accepted);

  // Prepared in the earlier layout and never checked: a verdict cannot be given now.
  const unchecked = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3').evaluation_id;
  writeJudge(run, unchecked, judgeOutput(run, unchecked));
  toColocated(run, unchecked);
  assert.throws(() => acceptEvaluation(run.runDir, unchecked), /prepared in the earlier layout/);
  assert.equal(existsSync(join(judgeDir(run, unchecked), 'acceptance.json')), false);
  assert.deepEqual(listEvaluations(run.runDir).map((e) => [e.evaluation_id, e.status, e.layout]), [[id, 'ACCEPTED', 'COLOCATED'], [unchecked, 'PREPARED', 'COLOCATED']]);

  // A new evaluation of the same run uses the separate areas and leaves the earlier ones as they are.
  const next = evaluated(run, { 'spec-fidelity': 'NO' });
  assert.deepEqual([next, listEvaluations(run.runDir).at(-1)!.layout], ['EVAL-3', 'SEPARATE']);
  assert.deepEqual(listEvaluations(run.runDir).map((e) => e.issues), [[], [], []]);
  assert.deepEqual(summarize([run.runDir], 'run-v3').runs[0]!.evaluation, { id: next, status: 'ACCEPTED' });
});

test('D7: the latest evaluation is chosen by preparation time and numbered id, never by how names sort as text', async () => {
  const run = await finishedRun('eval-eleven');
  // Eleven evaluations prepared at one instant: only the id can order them.
  const instant = (): Date => new Date('2026-10-03T12:00:00.000Z');
  for (let n = 1; n <= 11; n++) evaluated(run, { 'spec-fidelity': n === 11 ? 'NO' : 'YES' }, instant);
  assert.deepEqual(listEvaluations(run.runDir).map((e) => e.evaluation_id), ['EVAL-1', 'EVAL-2', 'EVAL-3', 'EVAL-4', 'EVAL-5', 'EVAL-6', 'EVAL-7', 'EVAL-8', 'EVAL-9', 'EVAL-10', 'EVAL-11']);
  adjudicate(run.runDir, 'EVAL-11', { question: 'spec-fidelity', label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' });
  const s = summarize([run.runDir], 'run-v3');
  assert.deepEqual(s.runs[0]!.evaluation, { id: 'EVAL-11', status: 'ACCEPTED' });
  assert.deepEqual(s.judge_answers['spec-fidelity']!.counts, { NO: 1 });
  assert.equal(s.human_calibration.human_recorded_entries, 1, 'the adjudication on the selected evaluation is not dropped');
  assert.equal(s.runs[0]!.other_evaluations.length, 10);

  // Preparation time comes before the id: the later one is selected although its name sorts first.
  const other = await finishedRun('eval-timed');
  const at = (iso: string) => (): Date => new Date(iso);
  for (const [id, time, answer] of [['Z-1', '2026-10-03T10:00:00.000Z', 'YES'], ['A-1', '2026-10-03T11:00:00.000Z', 'NO']] as const) {
    prepareEvaluation(PACKAGE_ROOT, other.runDir, 'run-v3', { evaluationId: id, now: at(time) });
    writeJudge(other, id, judgeOutput(other, id, {}, { 'spec-fidelity': answer }));
    assert.equal(acceptEvaluation(other.runDir, id).status, 'ACCEPTED');
  }
  assert.deepEqual(listEvaluations(other.runDir).map((e) => e.evaluation_id), ['Z-1', 'A-1']);
  assert.deepEqual(summarize([other.runDir], 'run-v3').runs[0]!.evaluation, { id: 'A-1', status: 'ACCEPTED' });
});

test('D7: copies of one run give the same summary in either order, and copies that disagree are shown, not chosen between', async () => {
  const run = await finishedRun('copies-main');
  const second = await finishedRun('copies-second');
  evaluated(second, { 'spec-fidelity': 'YES' });
  const copyOf = (label: string): string => {
    const dir = join(tmpDir(label), run.runId);
    cpSync(run.runDir, dir, { recursive: true });
    return dir;
  };
  const bare = copyOf('copies-bare');
  const id = evaluated(run, { 'spec-fidelity': 'NO' });
  const stale = copyOf('copies-stale');
  adjudicate(run.runDir, id, { question: 'spec-fidelity', label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' });
  const same = copyOf('copies-same');
  const both = (dirs: string[]): ReturnType<typeof summarize> => {
    const forward = summarize(dirs, 'run-v3');
    assert.deepEqual(summarize([...dirs].reverse(), 'run-v3'), forward, 'the order of the directories changes nothing');
    return forward;
  };
  const rowOf = (s: ReturnType<typeof summarize>): ReturnType<typeof summarize>['runs'][number] => s.runs.find((r) => r.run_id === run.runId)!;

  // A copy without evaluations, listed first or last: the copy that has them is read, and that is reported.
  const withBare = both([bare, run.runDir, second.runDir]);
  assert.deepEqual(rowOf(withBare).evaluation, { id, status: 'ACCEPTED' });
  assert.deepEqual([withBare.duplicates_ignored, withBare.runs.length, withBare.human_calibration.human_recorded_entries], [1, 2, 1]);
  assert.deepEqual(withBare.duplicate_runs.map((d) => [d.run_id, d.copies, d.resolution, d.variants.length]), [[run.runId, 2, 'MOST_COMPLETE_COPY', 2]]);
  assert.deepEqual(withBare.runs.map((r) => r.run_id), [run.runId, second.runId].sort(), 'runs are listed by id');

  // An identical copy, and a copy taken before the adjudication was added.
  assert.deepEqual(both([same, run.runDir]).duplicate_runs.map((d) => [d.resolution, d.variants.length]), [['IDENTICAL', 1]]);
  const withStale = both([stale, bare, run.runDir, same]);
  assert.deepEqual([withStale.duplicates_ignored, withStale.duplicate_runs[0]!.resolution, withStale.human_calibration.human_recorded_entries], [3, 'MOST_COMPLETE_COPY', 1]);
  assert.deepEqual(withStale.duplicate_runs[0]!.variants.map((v) => v.copies).sort(), [1, 1, 2]);
  assert.equal(JSON.stringify(withStale).includes('copies-'), false, 'no copy location is written into the summary');

  // Two copies evaluated separately hold different records under one id: neither is chosen.
  const diverged = copyOf('copies-diverged');
  rmSync(join(diverged, 'evaluation'), { recursive: true });
  rmSync(join(diverged, 'evaluation-control'), { recursive: true });
  const divergedRun = { ...run, runDir: diverged };
  assert.equal(evaluated(divergedRun, { 'spec-fidelity': 'YES' }), id);
  const conflict = both([run.runDir, diverged, second.runDir]);
  assert.equal(rowOf(conflict).evaluation, null);
  assert.deepEqual(rowOf(conflict).other_evaluations, []);
  assert.match(rowOf(conflict).not_aggregated!, /copies of this run disagree \(EVALUATIONS_DIFFER\)/);
  assert.deepEqual(conflict.duplicate_runs.map((d) => [d.resolution, d.variants.length, d.variants.map((v) => v.evaluations.map((e) => e.id))]), [['EVALUATIONS_DIFFER', 2, [[id], [id]]]]);
  assert.equal(conflict.metrics.run_outcome!.denominator, 2, 'the run is still counted once');
  assert.deepEqual([conflict.judge_answers['spec-fidelity']!.evaluated_runs, conflict.judge_answers['spec-fidelity']!.counts, conflict.human_calibration.human_recorded_entries], [1, { YES: 1 }, 0]);

  // A copy taken while the run was waiting, beside the run as it ended: the run's own records differ.
  const moving = await newRun('copies-moving');
  const waiting = toHumanWait(moving);
  const early = join(tmpDir('copies-early'), moving.runId);
  cpSync(moving.runDir, early, { recursive: true });
  moving.assembly.engine.decide(moving.runId, decision(waiting));
  driveRun(moving.assembly.engine, createFakeTransport(moving.assembly.runsRoot, {}), moving.runId);
  const differ = both([early, moving.runDir]);
  assert.deepEqual([differ.runs.length, differ.duplicates_ignored, differ.runs[0]!.outcome], [1, 1, 'PROPOSAL_READY'], 'counted once, as the copy with the longer journal');
  assert.deepEqual(differ.duplicate_runs.map((d) => [d.resolution, d.variants.map((v) => v.outcome).sort()]), [['RUN_RECORDS_DIFFER', ['PROPOSAL_READY', 'WAITING_HUMAN']]]);
  assert.match(differ.runs[0]!.not_aggregated!, /RUN_RECORDS_DIFFER/);
});

test('D6: a stored control record or adjudication entry that is not a valid record is reported, never read, and nothing older is used in its place', async () => {
  const run = await finishedRun('eval-malformed');
  const instant = (): Date => new Date('2026-10-03T12:00:00.000Z');
  const older = evaluated(run, { 'spec-fidelity': 'YES' }, instant);
  const newer = evaluated(run, { 'spec-fidelity': 'NO' }, instant);
  const stored = (id: string): ReturnType<typeof listEvaluations>[number] => listEvaluations(run.runDir).find((e) => e.evaluation_id === id)!;
  const row = (): ReturnType<typeof summarize>['runs'][number] => summarize([run.runDir], 'run-v3').runs[0]!;
  assert.deepEqual([older, row().evaluation], ['EVAL-1', { id: newer, status: 'ACCEPTED' }]);

  // 1. The newest evaluation's verdict or request damaged in turn: the evaluation is INVALID with the reason, and
  //    the older accepted answer is not aggregated instead.
  const damaged = (name: string, text: string | null, why: RegExp): void => {
    const file = join(controlDir(run, newer), name);
    const kept = readFileSync(file);
    if (text === null) rmSync(file);
    else writeFileSync(file, text);
    const e = stored(newer);
    assert.deepEqual([e.status, e.evaluation, e.adjudications], ['INVALID', null, []], `${name}: ${text}`);
    assert.match(e.issues.join('\n'), why, `${name}: ${text}`);
    const r = row();
    assert.equal(r.evaluation, null, `${name}: ${text}: the older answer is not used in its place`);
    assert.match(r.not_aggregated!, new RegExp(`^${newer}: `));
    assert.match(r.other_evaluations.find((o) => o.id === newer)!.issues!.join('\n'), why);
    writeFileSync(file, kept);
  };
  const acceptance = JSON.parse(readFileSync(join(controlDir(run, newer), 'acceptance.json'), 'utf8')) as Record<string, unknown>;
  const request = JSON.parse(readFileSync(join(controlDir(run, newer), 'request.json'), 'utf8')) as Record<string, unknown>;
  damaged('acceptance.json', '{', /acceptance\.json is not readable/);
  damaged('acceptance.json', 'null', /acceptance\.json is not a valid record: acceptance: expected an object/);
  damaged('acceptance.json', '{}', /acceptance\.json is not a valid record: acceptance\.schema_version: missing/);
  damaged('acceptance.json', JSON.stringify({ ...acceptance, status: 'MAYBE' }), /acceptance\.status: expected one of ACCEPTED, REJECTED/);
  damaged('acceptance.json', JSON.stringify({ ...acceptance, evaluation_id: older }), /acceptance\.evaluation_id: is not the id of this evaluation/);
  damaged('acceptance.json', JSON.stringify({ ...acceptance, issues: ['a recorded issue'] }), /acceptance\.issues: an accepted evaluation records no issue/);
  damaged('acceptance.json', JSON.stringify({ ...acceptance, evidence_before: '0'.repeat(64), evidence_after: '0'.repeat(64) }), /acceptance\.json does not carry the evidence digest of request\.json/);
  damaged('request.json', '{', /request\.json is not readable/);
  damaged('request.json', 'null', /request\.json is not a valid record: request: expected an object/);
  damaged('request.json', '{}', /request\.json is not a valid record: request\.schema_version: missing/);
  damaged('request.json', JSON.stringify({ ...request, rubric: { id: 'no-such-rubric', sha256: 'x' } }), /request\.rubric\.id: is not a supported rubric/);
  damaged('request.json', null, /acceptance\.json has no request\.json/);
  assert.deepEqual([stored(newer).status, stored(newer).issues, row().evaluation], ['ACCEPTED', [], { id: newer, status: 'ACCEPTED' }], 'the records, once back, are read again');

  // 2. An adjudication entry on the accepted content that is not what `adjudicate` writes is left out and reported.
  adjudicate(run.runDir, newer, { question: 'spec-fidelity', label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' });
  const lines = join(controlDir(run, newer), 'adjudication.jsonl');
  const keptLines = readFileSync(lines, 'utf8');
  const good = JSON.parse(keptLines) as Record<string, unknown>;
  const badEntry = (entry: Record<string, unknown>, why: RegExp): void => {
    writeFileSync(lines, `${JSON.stringify(entry)}\n`);
    const e = stored(newer);
    assert.deepEqual([e.status, e.adjudications.length], ['ACCEPTED', 0], String(why));
    assert.match(e.issues.join('\n'), /adjudication entry 1 is not a valid adjudication record: /);
    assert.match(e.issues.join('\n'), why);
    const s = summarize([run.runDir], 'run-v3');
    assert.deepEqual([s.runs[0]!.evaluation, s.human_calibration.human_recorded_entries, s.human_calibration.by_label], [null, 0, {}], String(why));
  };
  badEntry(
    { schema_version: 999, record_type: 'wrong-type', evaluation_id: newer, evaluation_sha256: good.evaluation_sha256, question: 'no-such-question', label: 'BANANA', provenance: 'HUMAN_RECORDED' },
    /adjudication\.seq: missing/,
  );
  badEntry({ ...good, schema_version: 999 }, /schema version 999 is not supported/);
  badEntry({ ...good, record_type: 'wrong-type' }, /adjudication\.record_type: expected "adjudication"/);
  badEntry({ ...good, question: 'no-such-question' }, /adjudication\.question: "no-such-question" is not a question of run-v3/);
  badEntry({ ...good, label: 'BANANA' }, /adjudication\.label: expected one of CONFIRM, REJECT, MODIFY, UNRESOLVED/);
  badEntry({ ...good, label: 'MODIFY' }, /adjudication\.answer: MODIFY needs an answer of run-v3/);
  badEntry({ ...good, answer: 'YES' }, /adjudication\.answer: CONFIRM takes no answer/);
  badEntry({ ...good, seq: 7 }, /adjudication\.seq: expected 1/);
  badEntry({ ...good, note: '' }, /adjudication\.note: must not be empty/);
  badEntry({ ...good, provenance: 'A_HUMAN' }, /adjudication\.provenance: expected one of HUMAN_RECORDED, SCRIPTED/);
  badEntry({ ...good, at: 'not-a-time' }, /adjudication\.at: expected a recorded time/);
  writeFileSync(lines, keptLines);
  assert.equal(summarize([run.runDir], 'run-v3').human_calibration.human_recorded_entries, 1);

  // 3. The commands refuse a damaged record by name: no verdict and no adjudication is written on top of one.
  const pending = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3').evaluation_id;
  writeJudge(run, pending, judgeOutput(run, pending));
  const pendingRequest = join(controlDir(run, pending), 'request.json');
  const keptRequest = readFileSync(pendingRequest);
  for (const text of ['{', 'null', '{}']) {
    writeFileSync(pendingRequest, text);
    assert.throws(() => acceptEvaluation(run.runDir, pending), /evaluation "EVAL-3": request\.json is not (valid JSON|a valid record)/, text);
    assert.equal(existsSync(join(controlDir(run, pending), 'acceptance.json')), false);
  }
  writeFileSync(pendingRequest, keptRequest);
  assert.equal(acceptEvaluation(run.runDir, pending).status, 'ACCEPTED');
  const pendingAcceptance = join(controlDir(run, pending), 'acceptance.json');
  const keptAcceptance = readFileSync(pendingAcceptance);
  const entry = { question: 'spec-fidelity', label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'SCRIPTED' };
  for (const text of ['{', 'null', '{}']) {
    writeFileSync(pendingAcceptance, text);
    assert.throws(() => acceptEvaluation(run.runDir, pending), /evaluation "EVAL-3": acceptance\.json is not (valid JSON|a valid record)/, text);
    assert.throws(() => adjudicate(run.runDir, pending, entry), /evaluation "EVAL-3": acceptance\.json is not (valid JSON|a valid record)/, text);
    assert.equal(readFileSync(pendingAcceptance, 'utf8'), text, 'the damaged record is left as found');
  }
  writeFileSync(pendingAcceptance, keptAcceptance);
  writeFileSync(pendingRequest, '{}');
  assert.throws(() => adjudicate(run.runDir, pending, entry), /evaluation "EVAL-3": request\.json is not a valid record/);
  assert.equal(existsSync(join(controlDir(run, pending), 'adjudication.jsonl')), false);
});

test('D7: a preparation time that cannot be read is reported and orders nothing, and copies whose control records differ are shown, not merged', async () => {
  const run = await finishedRun('eval-order');
  const at = (iso: string) => (): Date => new Date(iso);
  const early = evaluated(run, { 'spec-fidelity': 'YES' }, at('2026-10-03T11:00:00.000Z'));
  const late = evaluated(run, { 'spec-fidelity': 'NO' }, at('2026-10-03T12:00:00.000Z'));
  const selected = (): ReturnType<typeof summarize>['runs'][number] => summarize([run.runDir], 'run-v3').runs[0]!;
  assert.deepEqual(selected().evaluation, { id: late, status: 'ACCEPTED' });

  // The earlier evaluation loses its readable preparation time. It is not moved to the end and selected as the latest.
  const requestFile = join(controlDir(run, early), 'request.json');
  const kept = readFileSync(requestFile, 'utf8');
  const request = JSON.parse(kept) as Record<string, unknown>;
  const unreadable: [unknown, RegExp][] = [
    ['not-a-time', /request\.prepared_at: expected a recorded time/],
    [undefined, /request\.prepared_at: missing/],
    ['2026-10-03T11:00:00Z', /request\.prepared_at: expected a recorded time/],
    [1764759600000, /request\.prepared_at: expected a recorded time/],
  ];
  for (const [prepared_at, why] of unreadable) {
    writeFileSync(requestFile, JSON.stringify({ ...request, prepared_at }));
    const e = listEvaluations(run.runDir).find((x) => x.evaluation_id === early)!;
    assert.deepEqual([e.status, e.prepared_at, e.evaluation], ['INVALID', null, null], String(prepared_at));
    assert.match(e.issues.join('\n'), why);
    const r = selected();
    assert.equal(r.evaluation, null, `${String(prepared_at)}: no evaluation is selected while the order is unknown`);
    assert.match(r.not_aggregated!, new RegExp(`^${early}: request\\.json is not a valid record`));
  }
  writeFileSync(requestFile, kept);
  assert.deepEqual([selected().evaluation, selected().not_aggregated], [{ id: late, status: 'ACCEPTED' }, null]);

  // Two copies of the run that differ only in a control record of one evaluation.
  const twin = join(tmpDir('order-twin'), run.runId);
  cpSync(run.runDir, twin, { recursive: true });
  const both = (): ReturnType<typeof summarize> => {
    const forward = summarize([run.runDir, twin], 'run-v3');
    assert.deepEqual(summarize([twin, run.runDir], 'run-v3'), forward, 'the order of the directories changes nothing');
    return forward;
  };
  assert.deepEqual(both().duplicate_runs.map((d) => [d.resolution, d.variants.length]), [['IDENTICAL', 1]]);
  const differs = (name: string, change: Record<string, unknown>): void => {
    const file = join(twin, 'evaluation-control', late, name);
    const original = readFileSync(file, 'utf8');
    writeFileSync(file, `${JSON.stringify({ ...(JSON.parse(original) as object), ...change }, null, 2)}\n`);
    const s = both();
    assert.deepEqual(s.duplicate_runs.map((d) => [d.resolution, d.variants.length]), [['EVALUATIONS_DIFFER', 2]], `${name}: ${JSON.stringify(change)}`);
    assert.equal(s.runs[0]!.evaluation, null);
    assert.match(s.runs[0]!.not_aggregated!, /copies of this run disagree \(EVALUATIONS_DIFFER\)/);
    assert.equal(s.judge_answers['spec-fidelity']!.evaluated_runs, 0);
    const shown = s.duplicate_runs[0]!.variants.map((v) => v.evaluations.find((e) => e.id === late)!);
    assert.notDeepEqual(shown[0], shown[1], 'the difference is visible in the variants');
    writeFileSync(file, original);
  };
  differs('request.json', { evidence: { files: (request.evidence as { files: number }).files, digest: '0'.repeat(64) } });
  differs('acceptance.json', { evidence_unchanged: false, evidence_after: '1'.repeat(64), issues: ['conflicting acceptance record'] });
  // Each record valid by itself, and still not the same record.
  differs('acceptance.json', { checked_at: '2026-10-04T00:00:00.000Z' });
  differs('request.json', { judge_writes: 'evaluation/elsewhere.json' });
  assert.deepEqual(both().duplicate_runs.map((d) => [d.resolution, d.variants.length]), [['IDENTICAL', 1]]);
});

// R2 correction 2. Every file under the two evaluation areas of a run, as base64 bytes, with each directory marked.
function areaBytes(run: TestRun): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string, rel: string): void => {
    if (!existsSync(dir)) return;
    out[`${rel}/`] = 'directory';
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name), `${rel}/${entry.name}`);
      else out[`${rel}/${entry.name}`] = readFileSync(join(dir, entry.name)).toString('base64');
    }
  };
  walk(join(run.runDir, 'evaluation'), 'evaluation');
  walk(join(run.runDir, 'evaluation-control'), 'evaluation-control');
  return out;
}

const R2_LAYOUTS = ['SEPARATE', 'COLOCATED'] as const;
type R2Layout = (typeof R2_LAYOUTS)[number];

// Where an evaluation's control files are: the evaluator's area, or the judge's in the earlier layout.
const holderOf = (run: TestRun, id: string, layout: R2Layout): string => (layout === 'SEPARATE' ? controlDir(run, id) : judgeDir(run, id));

// A fresh run with one accepted evaluation, in the given layout.
async function acceptedIn(label: string, layout: R2Layout): Promise<{ run: TestRun; id: string }> {
  const run = await finishedRun(label);
  const id = evaluated(run, { 'spec-fidelity': 'YES' });
  if (layout === 'COLOCATED') toColocated(run, id);
  return { run, id };
}

test('D6-R2-A: an accepted evaluation whose request is damaged or contradicts its verdict is refused by accept and adjudicate and nothing is written; a valid one is still returned and appended to', async () => {
  const entry = { question: 'spec-fidelity', label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' };
  for (const layout of R2_LAYOUTS) {
    const name = layout.toLowerCase();
    const stored = (run: TestRun, id: string): ReturnType<typeof listEvaluations>[number] => listEvaluations(run.runDir).find((e) => e.evaluation_id === id)!;

    // a. A request that is no longer a valid record: the stored verdict is not returned on top of it.
    {
      const { run, id } = await acceptedIn(`r2c2-damaged-${name}`, layout);
      const requestFile = join(holderOf(run, id, layout), 'request.json');
      const original = readFileSync(requestFile);
      const intact = areaBytes(run);
      assert.equal(stored(run, id).status, 'ACCEPTED', layout);
      for (const text of ['{', 'null', '{}']) {
        writeFileSync(requestFile, text);
        assert.equal(stored(run, id).status, 'INVALID', `${layout}: ${text}`);
        const damaged = areaBytes(run);
        assert.throws(() => acceptEvaluation(run.runDir, id), /request\.json/, `${layout}: ${text}`);
        assert.deepEqual(areaBytes(run), damaged, `${layout}: ${text}: nothing was written`);
        writeFileSync(requestFile, original);
        assert.deepEqual(areaBytes(run), intact, `${layout}: ${text}: restored`);
        assert.equal(stored(run, id).status, 'ACCEPTED', `${layout}: ${text}: the restored evaluation reads as accepted`);
      }
    }

    // b. A request and a verdict that disagree on the evidence digest: the reader says INVALID, so neither command goes on.
    {
      const { run, id } = await acceptedIn(`r2c2-pair-${name}`, layout);
      const hold = holderOf(run, id, layout);
      const requestFile = join(hold, 'request.json');
      const request = JSON.parse(readFileSync(requestFile, 'utf8')) as { evidence: { files: number; digest: string } };
      request.evidence.digest = '0'.repeat(64);
      writeFileSync(requestFile, `${JSON.stringify(request, null, 2)}\n`);
      const e = stored(run, id);
      assert.equal(e.status, 'INVALID', layout);
      assert.match(e.issues.join('\n'), /acceptance\.json does not carry the evidence digest of request\.json/, layout);
      const contradictory = areaBytes(run);
      assert.throws(() => acceptEvaluation(run.runDir, id), /evidence digest/, `${layout}: accept`);
      assert.deepEqual(areaBytes(run), contradictory, `${layout}: accept wrote nothing`);
      assert.throws(() => adjudicate(run.runDir, id, entry), /evidence digest/, `${layout}: adjudicate`);
      assert.deepEqual(areaBytes(run), contradictory, `${layout}: adjudicate wrote nothing`);
      assert.equal(existsSync(join(hold, 'adjudication.jsonl')), false, `${layout}: no adjudication file was created`);
    }

    // c. Checking an accepted evaluation again returns the recorded verdict, not a new one.
    // d. Adjudication on a valid accepted evaluation is still appended, in order, and changes no other record.
    {
      const { run, id } = await acceptedIn(`r2c2-valid-${name}`, layout);
      const hold = holderOf(run, id, layout);
      const recorded = JSON.parse(readFileSync(join(hold, 'acceptance.json'), 'utf8')) as { status: string; checked_at: string };
      assert.equal(recorded.status, 'ACCEPTED', layout);
      const before = areaBytes(run);
      const later = '2030-01-01T00:00:00.000Z';
      const again = acceptEvaluation(run.runDir, id, () => new Date(later));
      assert.deepEqual([again.status, again.issues], ['ACCEPTED', []], layout);
      assert.equal(again.checked_at, recorded.checked_at, `${layout}: the recorded verdict, not the later clock`);
      assert.notEqual(again.checked_at, later, layout);
      assert.deepEqual(areaBytes(run), before, `${layout}: nothing was rewritten or added`);

      assert.equal(existsSync(join(hold, 'adjudication.jsonl')), false, layout);
      assert.equal(adjudicate(run.runDir, id, entry).seq, 1, layout);
      assert.equal(adjudicate(run.runDir, id, entry).seq, 2, layout);
      const written = readFileSync(join(hold, 'adjudication.jsonl'), 'utf8').split('\n').filter(Boolean);
      assert.equal(written.length, 2, `${layout}: exactly two lines`);
      const after = areaBytes(run);
      const added = `${layout === 'SEPARATE' ? 'evaluation-control' : 'evaluation'}/${id}/adjudication.jsonl`;
      assert.ok(added in after, layout);
      delete after[added];
      assert.deepEqual(after, before, `${layout}: request, verdict, evaluation and the rest are byte-identical`);
      const e = stored(run, id);
      assert.deepEqual([e.status, e.issues, e.adjudications.map((a) => a.seq)], ['ACCEPTED', [], [1, 2]], layout);
    }
  }
});

// Prepares at an explicit id and time, writes a scripted judge output, and checks it.
function evaluatedAs(run: TestRun, id: string, at: Date, answer: string): void {
  prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3', { evaluationId: id, now: () => at });
  writeJudge(run, id, judgeOutput(run, id, {}, { 'spec-fidelity': answer }));
  assert.equal(acceptEvaluation(run.runDir, id).status, 'ACCEPTED');
}

test('D7-R2-A: evaluations are ordered by the instant they were prepared, including years outside 1000 to 9999, then by numbered id', async () => {
  // Id, status, recorded time, and issues, in listed order.
  const listed = (run: TestRun): unknown[][] => listEvaluations(run.runDir).map((e) => [e.evaluation_id, e.status, e.prepared_at, e.issues]);
  const chosen = (run: TestRun): [unknown, unknown] => {
    const s = summarize([run.runDir], 'run-v3');
    return [s.runs[0]!.evaluation, s.judge_answers['spec-fidelity']!.counts];
  };
  const year9999 = new Date('9999-12-31T23:59:59.999Z');
  const year10000 = new Date(Date.UTC(10000, 0, 1));
  assert.equal(year10000.toISOString(), '+010000-01-01T00:00:00.000Z');

  // 1. Across 9999 and an expanded year: as text, '+010000' sorts before '9999'.
  const across = await finishedRun('r2c2-across');
  evaluatedAs(across, 'EVAL-2', year9999, 'YES');
  evaluatedAs(across, 'EVAL-11', year10000, 'NO');
  assert.deepEqual(listed(across), [
    ['EVAL-2', 'ACCEPTED', '9999-12-31T23:59:59.999Z', []],
    ['EVAL-11', 'ACCEPTED', '+010000-01-01T00:00:00.000Z', []],
  ]);
  assert.deepEqual(chosen(across), [{ id: 'EVAL-11', status: 'ACCEPTED' }, { NO: 1 }]);
  // The same instants with the ids the other way round, so that neither the text of the times nor the ids alone give the order.
  const across2 = await finishedRun('r2c2-across-swapped');
  evaluatedAs(across2, 'Z-1', year9999, 'YES');
  evaluatedAs(across2, 'A-1', year10000, 'NO');
  assert.deepEqual(listed(across2), [
    ['Z-1', 'ACCEPTED', '9999-12-31T23:59:59.999Z', []],
    ['A-1', 'ACCEPTED', '+010000-01-01T00:00:00.000Z', []],
  ]);
  assert.deepEqual(chosen(across2), [{ id: 'A-1', status: 'ACCEPTED' }, { NO: 1 }]);

  // 2. Between negative years: as text, '-000001' sorts before '-000002'. The later one has the id that sorts first.
  const negative = await finishedRun('r2c2-negative');
  evaluatedAs(negative, 'Z-1', new Date(Date.UTC(-2, 0, 1)), 'YES');
  evaluatedAs(negative, 'A-1', new Date(Date.UTC(-1, 0, 1)), 'NO');
  assert.deepEqual(listed(negative), [
    ['Z-1', 'ACCEPTED', '-000002-01-01T00:00:00.000Z', []],
    ['A-1', 'ACCEPTED', '-000001-01-01T00:00:00.000Z', []],
  ]);
  assert.deepEqual(chosen(negative), [{ id: 'A-1', status: 'ACCEPTED' }, { NO: 1 }]);
  // A negative year is before an ordinary one.
  const beforeOrdinary = await finishedRun('r2c2-negative-ordinary');
  evaluatedAs(beforeOrdinary, 'A-1', new Date('2026-10-03T10:00:00.000Z'), 'YES');
  evaluatedAs(beforeOrdinary, 'Z-1', new Date(Date.UTC(-1, 0, 1)), 'NO');
  assert.deepEqual(listed(beforeOrdinary).map((row) => row[0]), ['Z-1', 'A-1']);
  assert.deepEqual(chosen(beforeOrdinary), [{ id: 'A-1', status: 'ACCEPTED' }, { YES: 1 }]);

  // 3. Ordinary years: the later time wins over the numbered id.
  const ordinary = await finishedRun('r2c2-ordinary');
  evaluatedAs(ordinary, 'EVAL-11', new Date('2026-10-03T10:00:00.000Z'), 'YES');
  evaluatedAs(ordinary, 'EVAL-2', new Date('2026-10-03T11:00:00.000Z'), 'NO');
  assert.deepEqual(listed(ordinary).map((row) => row[0]), ['EVAL-11', 'EVAL-2']);
  assert.deepEqual(chosen(ordinary), [{ id: 'EVAL-2', status: 'ACCEPTED' }, { NO: 1 }]);

  // 4. One expanded-year instant for both: the numbered id orders them.
  const equal = await finishedRun('r2c2-equal');
  evaluatedAs(equal, 'EVAL-11', year10000, 'NO');
  evaluatedAs(equal, 'EVAL-2', year10000, 'YES');
  assert.deepEqual(listed(equal).map((row) => [row[0], row[2]]), [['EVAL-2', '+010000-01-01T00:00:00.000Z'], ['EVAL-11', '+010000-01-01T00:00:00.000Z']]);
  assert.deepEqual(chosen(equal), [{ id: 'EVAL-11', status: 'ACCEPTED' }, { NO: 1 }]);
});
