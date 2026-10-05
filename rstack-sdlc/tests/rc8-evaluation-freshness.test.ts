// RC8: an accepted judgment is aggregated only while the run's evidence is
// still the evidence that was judged.
//
// Acceptance checks the run's evidence digest at acceptance time. Before RC8
// nothing compared it again, so a judgment made while a run was waiting for
// the human was still selected, as ACCEPTED, after the same run had gone on
// to a proposal, and its answers about the earlier state were counted for
// the finished run.
//
// Evidence class: deterministic tests of the evaluation tooling. Judge
// outputs are scripted fixtures written by the test, not judgments by a model
// or a person; adjudications marked HUMAN_RECORDED are fixture claims.

import assert from 'node:assert/strict';
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createFakeTransport } from '../adapters/fake-transport/index.ts';
import { driveRun } from '../core/engine/drive.ts';
import type { Reply } from '../core/engine/engine.ts';
import { type Evaluation, acceptEvaluation, adjudicate, evidenceDigest, listEvaluations, prepareEvaluation } from '../evals/evaluation.ts';
import { RUBRICS } from '../evals/rubrics.ts';
import { summarize } from '../evals/summary.ts';
import { PACKAGE_ROOT, type TestRun, decision, newRun, tmpDir, toHumanWait } from './support/harness.ts';

const V3 = RUBRICS['run-v3']!;
const SCOPE = 'candidate-within-scope';

// A scripted stand-in for a judge's output, prepared and accepted.
function evaluated(run: TestRun, answers: Record<string, string>): string {
  const id = prepareEvaluation(PACKAGE_ROOT, run.runDir, 'run-v3').evaluation_id;
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
  };
  writeFileSync(join(run.runDir, 'evaluation', id, 'evaluation.json'), JSON.stringify(evaluation, null, 2));
  assert.equal(acceptEvaluation(run.runDir, id).status, 'ACCEPTED');
  return id;
}

// A run stopped at the plan decision, and the same run driven to its proposal.
async function waitingRun(label: string): Promise<{ run: TestRun; waiting: Reply }> {
  const run = await newRun(label);
  return { run, waiting: toHumanWait(run) };
}
function finish(run: TestRun, waiting: Reply): void {
  assert.equal(run.assembly.engine.decide(run.runId, decision(waiting)).code, 'DECISION_RECORDED');
  assert.equal(driveRun(run.assembly.engine, createFakeTransport(run.assembly.runsRoot, {}), run.runId).last.code, 'PROPOSAL_READY');
}

// Every file of one evaluation, in both areas, byte for byte.
function evaluationFiles(run: TestRun, id: string): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [area, names] of [['evaluation', ['evaluation.json']], ['evaluation-control', ['request.json', 'deterministic.json', 'acceptance.json', 'adjudication.jsonl']]] as const) {
    for (const name of names) files[`${area}/${name}`] = readFileSync(join(run.runDir, area, id, name), 'utf8');
  }
  return files;
}

const rowOf = (s: ReturnType<typeof summarize>, run: TestRun): ReturnType<typeof summarize>['runs'][number] => s.runs.find((r) => r.run_id === run.runId)!;
const stale = (judged: string, now: string): string => `the run evidence is no longer what this evaluation judged (judged ${judged}, now ${now})`;

test('RC8 control: a judgment of a run whose evidence has not changed since is aggregated', async () => {
  const { run, waiting } = await waitingRun('rc8-control');
  finish(run, waiting);
  const id = evaluated(run, { [SCOPE]: 'YES' });
  const s = summarize([run.runDir], 'run-v3');
  assert.deepEqual(rowOf(s, run).evaluation, { id, status: 'ACCEPTED' });
  assert.equal(rowOf(s, run).not_aggregated, null);
  assert.deepEqual(listEvaluations(run.runDir).map((e) => e.issues), [[]]);
  assert.deepEqual([s.judge_answers[SCOPE]!.evaluated_runs, s.judge_answers[SCOPE]!.counts], [1, { YES: 1 }]);
});

test('RC8: a judgment accepted while the run waited is not aggregated after the run goes on to a proposal', async () => {
  const { run, waiting } = await waitingRun('rc8-advanced');
  // No candidate exists yet, so the question about it has no subject.
  const id = evaluated(run, { [SCOPE]: 'NOT_APPLICABLE', 'spec-fidelity': 'YES' });
  adjudicate(run.runDir, id, { question: 'spec-fidelity', label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' });
  const judged = evidenceDigest(run.runDir).digest;
  const filesBefore = evaluationFiles(run, id);
  const frozen = join(tmpDir('rc8-frozen'), run.runId);
  cpSync(run.runDir, frozen, { recursive: true });

  // While the run still is what was judged, the judgment counts.
  const atWait = summarize([run.runDir], 'run-v3');
  assert.deepEqual([rowOf(atWait, run).outcome, rowOf(atWait, run).evaluation, rowOf(atWait, run).not_aggregated], ['WAITING_HUMAN', { id, status: 'ACCEPTED' }, null]);
  assert.equal(atWait.judge_answers[SCOPE]!.not_applicable, 1);

  // The same run is resumed normally and completes. Nothing in either evaluation area is touched.
  finish(run, waiting);
  const now = evidenceDigest(run.runDir).digest;
  assert.notEqual(now, judged);
  const s = summarize([run.runDir], 'run-v3');
  const row = rowOf(s, run);
  assert.deepEqual([row.outcome, row.task_completed, row.packet_ok], ['PROPOSAL_READY', true, true]);
  assert.equal(row.evaluation, null, 'the judgment of the waiting run is not presented as a judgment of the finished run');
  assert.equal(row.not_aggregated, `${id}: ${stale(judged, now)}`);
  assert.deepEqual(row.other_evaluations, [{ id, rubric: 'run-v3', status: 'ACCEPTED', issues: [stale(judged, now)] }]);
  // Its answers about the earlier state are in no count for the finished run.
  assert.deepEqual([s.judge_answers[SCOPE]!.evaluated_runs, s.judge_answers[SCOPE]!.not_applicable, s.judge_answers[SCOPE]!.counts], [0, 0, {}]);
  assert.equal(s.human_calibration.human_recorded_entries, 0);

  // The earlier judgment stays on file, readable and unchanged, as a judgment of the earlier evidence.
  const [stored] = listEvaluations(run.runDir);
  assert.deepEqual([stored!.status, stored!.issues, stored!.adjudications.length], ['ACCEPTED', [stale(judged, now)], 1]);
  assert.equal(stored!.evaluation?.answers.find((a) => a.question === SCOPE)?.answer, 'NOT_APPLICABLE');
  assert.deepEqual(evaluationFiles(run, id), filesBefore);

  // A copy frozen at the moment that was judged is still that evidence, and still aggregates there.
  const snapshot = summarize([frozen], 'run-v3');
  assert.deepEqual([snapshot.runs[0]!.outcome, snapshot.runs[0]!.evaluation, snapshot.runs[0]!.not_aggregated], ['WAITING_HUMAN', { id, status: 'ACCEPTED' }, null]);
  assert.equal(snapshot.human_calibration.human_recorded_entries, 1);
});

test('RC8: a new evaluation of the current evidence restores aggregation, and the earlier one stays on file unused', async () => {
  const { run, waiting } = await waitingRun('rc8-renewed');
  const earlier = evaluated(run, { [SCOPE]: 'NOT_APPLICABLE' });
  adjudicate(run.runDir, earlier, { question: SCOPE, label: 'CONFIRM', note: 'fixture', recorded_by: 'test fixture', provenance: 'HUMAN_RECORDED' });
  const filesBefore = evaluationFiles(run, earlier);
  finish(run, waiting);

  const current = evaluated(run, { [SCOPE]: 'YES' });
  assert.notEqual(current, earlier);
  const s = summarize([run.runDir], 'run-v3');
  const row = rowOf(s, run);
  assert.deepEqual(row.evaluation, { id: current, status: 'ACCEPTED' });
  assert.equal(row.not_aggregated, null);
  assert.deepEqual(row.other_evaluations.map((e) => [e.id, e.status, e.issues?.length]), [[earlier, 'ACCEPTED', 1]]);
  assert.match(row.other_evaluations[0]!.issues![0]!, /^the run evidence is no longer what this evaluation judged/);
  assert.deepEqual([s.judge_answers[SCOPE]!.evaluated_runs, s.judge_answers[SCOPE]!.counts], [1, { YES: 1 }]);
  assert.equal(s.human_calibration.human_recorded_entries, 0, 'an adjudication of the earlier judgment is not counted for the current one');
  assert.deepEqual(evaluationFiles(run, earlier), filesBefore);
});

test('RC8: when the latest accepted judgment is stale, no earlier judgment is used in its place', async () => {
  const { run, waiting } = await waitingRun('rc8-no-fallback');
  const first = evaluated(run, { [SCOPE]: 'NOT_APPLICABLE' });
  finish(run, waiting);
  const second = evaluated(run, { [SCOPE]: 'YES' });
  assert.deepEqual(rowOf(summarize([run.runDir], 'run-v3'), run).evaluation, { id: second, status: 'ACCEPTED' });

  // The run directory changes again after the second judgment: here, a late write into a work directory.
  const late = join(run.runDir, 'work', 'late-writer.txt');
  writeFileSync(late, 'written after the evaluation\n');
  const s = summarize([run.runDir], 'run-v3');
  const row = rowOf(s, run);
  assert.equal(row.evaluation, null);
  assert.match(row.not_aggregated!, new RegExp(`^${second}: the run evidence is no longer what this evaluation judged`));
  assert.deepEqual(row.other_evaluations.map((e) => [e.id, e.status, e.issues?.length]), [[first, 'ACCEPTED', 1], [second, 'ACCEPTED', 1]]);
  assert.deepEqual([s.judge_answers[SCOPE]!.evaluated_runs, s.judge_answers[SCOPE]!.counts], [0, {}]);

  // The identity is of content: with the evidence back as it was judged, the second judgment is current again.
  rmSync(late);
  const back = rowOf(summarize([run.runDir], 'run-v3'), run);
  assert.deepEqual([back.evaluation, back.not_aggregated], [{ id: second, status: 'ACCEPTED' }, null]);
});
