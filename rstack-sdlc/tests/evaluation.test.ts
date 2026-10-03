// Evaluation system: deterministic packet evaluation, the judge output
// contract, versioned per-run evaluations, append-only adjudication, and the
// cross-run summary. Evidence class: deterministic tests of the evaluation
// tooling. Judge outputs in this file are scripted fixtures written by the
// test; they are not judgments by a model or a person, and adjudications
// marked HUMAN_RECORDED here are fixture claims, not human review.

import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
  writeFileSync(workflow, readFileSync(workflow, 'utf8').replace('"workflow_version":5', '"workflow_version":2'));
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
  assert.deepEqual(w.control.filter((c) => c.result === 'NOT_APPLICABLE').map((c) => c.id), ['decision-basis', 'proposal-links', 'publication-not-attempted']);
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
  assert.equal(request.identities.workflow_version, 5);
  assert.deepEqual(readdirSync(join(run.runDir, 'evaluation', 'EVAL-1')).sort(), ['deterministic.json', 'request.json']);

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
  const snapshot = (): string => readdirSync(join(run.runDir, 'evaluation', 'EVAL-1')).sort().map((f) => `${f}:${readFileSync(join(run.runDir, 'evaluation', 'EVAL-1', f), 'utf8')}`).join('\n');
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
