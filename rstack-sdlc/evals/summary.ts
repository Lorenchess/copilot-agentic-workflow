// One compact cross-run summary.
//
// Every figure is a count with a stated denominator and the records it was
// computed from. Nothing is averaged, nothing unknown is counted as a pass,
// a failure, or zero, and judgments under different rubric versions are
// never combined: the caller names one rubric, and only evaluations accepted
// under it are aggregated. The latest accepted evaluation per run is used,
// and that choice is stated in the output.
//
// Judge answers: only YES and NO are applicable answers and form the
// denominator. NOT_APPLICABLE and unavailable answers (UNKNOWN, or no answer)
// are shown separately and outside it, and no rate is computed anywhere. A
// question with no applicable case says so instead of implying a success.
//
// Owner adjudication: the original answers stay as judged. Per case (run,
// evaluation, question) the latest human-recorded entry is the owner's
// position; earlier entries stay on file and are listed, not counted again.
// An owner answer that differs from the judge's is not classified as a judge
// error: it is listed with its full note, which carries any interpretation
// limit, and no judge-accuracy figure is derived from it.

import { type DeterministicReport, evaluateDeterministic } from './deterministic.ts';
import { type StoredEvaluation, listEvaluations } from './evaluation.ts';
import { RUBRICS } from './rubrics.ts';

export interface Metric {
  measures: string;
  eligible: string;
  denominator: number;
  counts: Record<string, number>;
  source: string;
  missing: string;
}

// What a fixture was built to show. This is the builder's expectation, not a
// human-confirmed label, and it is never shown to a judge.
export interface CaseExpectation {
  label: string;
  outcome?: string;
  blocker?: string | null;
  packet_ok?: boolean;
  answers?: Record<string, string>;
}

export interface RunRow {
  run_id: string;
  case: string | null;
  packet_ok: boolean;
  outcome: string;
  blocker: string | null;
  task_completed: boolean;
  role_results: string;
  test_execution: string;
  authorization: string;
  host_validation: string;
  workflow_version: number | null;
  evaluation: { id: string; status: string } | null;
  other_evaluations: { id: string; rubric: string | null; status: string }[];
  packet_bytes: number;
}

export interface Summary {
  schema_version: 2;
  record_type: 'cross-run-summary';
  rubric: string;
  selection: string;
  runs: RunRow[];
  duplicates_ignored: number;
  not_interpreted: { run_id: string; reason: string }[];
  metrics: Record<string, Metric>;
  judge_answers: Record<string, JudgeAnswers>;
  fixture_agreement: { compared: number; agree: number; disagree: { run_id: string; question: string; expected: string; judged: string }[]; note: string };
  human_calibration: {
    status: 'HUMAN CALIBRATION PENDING' | 'HUMAN ADJUDICATION RECORDED';
    human_recorded_entries: number;
    // Latest label per case; a case with several entries is counted once.
    by_label: Record<string, number>;
    scripted_entries_excluded: number;
    judged_answers: number;
    cases: number;
    unresolved: number;
    owner_differs: number;
    decisions: OwnerDecision[];
    reading: string;
  };
  not_measured: string[];
}

const APPLICABLE = ['YES', 'NO'];
const NO_APPLICABLE_CASES = 'NO_APPLICABLE_CASES: nothing here supports a success or a failure rate';

export interface AnswerCounts {
  // Applicable answers only (YES or NO).
  denominator: number;
  // Every answer as given, including those outside the denominator.
  counts: Record<string, number>;
  not_applicable: number;
  // UNKNOWN, or no answer for the question.
  unavailable: number;
  reading: string;
}

export interface JudgeAnswers extends AnswerCounts {
  dimension: string;
  evaluated_runs: number;
  // Present only when a case of this question has a resolved owner decision:
  // the same tally with the owner's answer used for those cases.
  owner_adjusted?: AnswerCounts & { decided_cases: number; caveats: string[] };
}

// The owner's current position on one case. `owner_answer` is null while unresolved.
export interface OwnerDecision {
  run_id: string;
  evaluation_id: string;
  question: string;
  ai_answer: string;
  label: string;
  owner_answer: string | null;
  seq: number;
  earlier_entries: { seq: number; label: string }[];
  note: string;
  recorded_by: string;
}

function answerCounts(answers: string[]): AnswerCounts {
  const denominator = answers.filter((a) => APPLICABLE.includes(a)).length;
  const notApplicable = answers.filter((a) => a === 'NOT_APPLICABLE').length;
  return {
    denominator,
    counts: tally(answers),
    not_applicable: notApplicable,
    unavailable: answers.length - denominator - notApplicable,
    reading: denominator === 0 ? NO_APPLICABLE_CASES : 'counts of applicable answers; not-applicable and unavailable answers are outside the denominator',
  };
}

function tally(values: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

export function summarize(runDirs: string[], rubricId: string, expectations: Record<string, CaseExpectation> = {}): Summary {
  const rubric = RUBRICS[rubricId];
  if (!rubric) throw new Error(`unsupported rubric "${rubricId}"`);

  // The same run reached through two paths (a copy, a repeated import) is one run.
  const seen = new Set<string>();
  let duplicates = 0;
  const rows: { row: RunRow; report: DeterministicReport; selected: StoredEvaluation | null }[] = [];
  for (const dir of runDirs) {
    const report = evaluateDeterministic(dir);
    const key = `${report.run_id}:${report.run_fingerprint}`;
    if (report.run_id && seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    const evaluations = listEvaluations(dir);
    const accepted = evaluations.filter((e) => e.status === 'ACCEPTED' && e.rubric === rubricId);
    const selected = accepted.at(-1) ?? null;
    const authorization = report.evidence.authorization;
    rows.push({
      report,
      selected,
      row: {
        run_id: report.run_id ?? '(unreadable)',
        case: report.run_id ? (expectations[report.run_id]?.label ?? null) : null,
        packet_ok: report.packet.ok,
        outcome: report.outcome.status,
        blocker: report.outcome.blocker,
        task_completed: report.task_completed,
        role_results: report.evidence.role_results,
        test_execution: report.evidence.test_execution,
        authorization: authorization === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : `${authorization.provenance} (human observed: ${authorization.human_observed})`,
        host_validation: report.evidence.host_validation,
        workflow_version: report.identities.workflow_version,
        evaluation: selected ? { id: selected.evaluation_id, status: selected.status } : null,
        other_evaluations: evaluations.filter((e) => e !== selected).map((e) => ({ id: e.evaluation_id, rubric: e.rubric, status: e.status })),
        packet_bytes: report.storage.packet_bytes,
      },
    });
  }

  // Runs recorded in a format this evaluator does not interpret are listed, and
  // kept out of every metric: they are neither passes nor failures.
  const reports = rows.map((r) => r.report).filter((r) => r.interpreted);
  const n = reports.length;
  const withVerification = reports.filter((r) => r.executions.some((e) => e.purpose === 'CANDIDATE_VERIFICATION'));
  const authorized = reports.filter((r) => r.evidence.authorization !== 'NOT_APPLICABLE');
  const criteria = reports.flatMap((r) => (r.proof === 'NOT_APPLICABLE' ? [] : r.proof));
  const checkIds = [...new Set(reports.flatMap((r) => r.control.map((c) => c.id)))];
  const journalSource = 'deterministic report, from each run journal and retained records';

  const metrics: Record<string, Metric> = {
    packet_integrity: {
      measures: 'Whether every identity the run records resolves to retained bytes that match it',
      eligible: 'all runs',
      denominator: n,
      counts: tally(reports.map((r) => (r.packet.ok ? 'RESOLVES' : 'DOES_NOT_RESOLVE'))),
      source: journalSource,
      missing: 'A run without a readable journal counts as DOES_NOT_RESOLVE',
    },
    run_outcome: {
      measures: 'Where each run stands. BLOCKED and WAITING_HUMAN are outcomes; whether a block was the correct control response is a separate question',
      eligible: 'all runs',
      denominator: n,
      counts: tally(reports.map((r) => (r.outcome.blocker ? `${r.outcome.status}:${r.outcome.blocker}` : r.outcome.status))),
      source: journalSource,
      missing: 'UNREADABLE when state cannot be derived; never assumed complete or failed',
    },
    task_completed: {
      measures: 'Runs that ended with a verified, accepted candidate and a local proposal. A correctly blocked run is not a completed task',
      eligible: 'all runs',
      denominator: n,
      counts: tally(reports.map((r) => (r.task_completed ? 'COMPLETED' : r.outcome.status === 'PROPOSAL_READY' ? 'EVIDENCE_DOES_NOT_RESOLVE' : 'NOT_COMPLETED'))),
      source: journalSource,
      missing: 'A run that records a proposal but whose evidence does not resolve is EVIDENCE_DOES_NOT_RESOLVE: it is counted neither as completed nor as an ordinary incomplete run',
    },
    final_verification: {
      measures: 'Result of the last actual candidate verification in runs that ran one',
      eligible: 'runs with at least one candidate verification record',
      denominator: withVerification.length,
      counts: tally(withVerification.map((r) => r.executions.filter((e) => e.purpose === 'CANDIDATE_VERIFICATION').at(-1)?.outcome ?? 'UNKNOWN')),
      source: 'execution records (actual local execution)',
      missing: 'Runs with no verification are outside the denominator, not counted as failures',
    },
    refusals_visible: {
      measures: 'Unsuccessful work kept on record: failed verifications, refused submissions, failed or abandoned attempts',
      eligible: 'all runs (totals across runs)',
      denominator: n,
      counts: {
        failed_verifications: reports.reduce((s, r) => s + r.unsuccessful.failed_verifications, 0),
        refused_submissions: reports.reduce((s, r) => s + Object.values(r.unsuccessful.rejected_submissions).reduce((a, b) => a + b, 0), 0),
        failed_or_abandoned_attempts: reports.reduce((s, r) => s + Object.values(r.unsuccessful.failed_attempts).reduce((a, b) => a + b, 0), 0),
      },
      source: 'journal events, rejected/ and execution records',
      missing: 'Counts are of records present; a run that hides a failure cannot be detected here',
    },
    proof_sensitivity: {
      measures: 'Per acceptance criterion of an accepted proof: was the test seen to fail when the behavior was absent',
      eligible: 'criteria in accepted proofs',
      denominator: criteria.length,
      counts: tally(criteria.map((c) => `${c.route}:${c.sensitivity}`)),
      source: 'proof record and baseline execution record',
      missing: 'ALREADY_SATISFIED criteria are NOT_DEMONSTRATED: their tests passed, which does not show they would detect a regression',
    },
    role_content_class: {
      measures: 'What produced the role results of each run',
      eligible: 'all runs',
      denominator: n,
      counts: tally(reports.map((r) => r.evidence.role_results)),
      source: 'run_started record',
      missing: 'UNKNOWN when the run does not say',
    },
    human_authorization: {
      measures: 'How the authorizing decision was recorded. Observed human approval would need evidence beyond a recorded claim',
      eligible: 'runs with an authorizing decision',
      denominator: authorized.length,
      counts: tally(authorized.map((r) => (r.evidence.authorization === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : `${r.evidence.authorization.provenance}:human_observed=${r.evidence.authorization.human_observed}`))),
      source: 'decision record provenance',
      missing: 'A decision with no provenance is UNKNOWN, not human',
    },
    host_validation: {
      measures: 'Runs with any observation from the target host',
      eligible: 'all runs',
      denominator: n,
      counts: tally(reports.map((r) => r.evidence.host_validation)),
      source: 'no run contains host records',
      missing: 'NOT_OBSERVED is the absence of evidence, not a failed validation',
    },
  };
  for (const id of checkIds) {
    const results = reports.map((r) => r.control.find((c) => c.id === id)?.result ?? 'UNAVAILABLE');
    const eligible = results.filter((x) => x === 'PASS' || x === 'FAIL');
    metrics[`control:${id}`] = {
      measures: `Deterministic control check "${id}"`,
      eligible: 'runs where the check applies and the packet can answer it',
      denominator: eligible.length,
      counts: tally(results),
      source: journalSource,
      missing: 'NOT_APPLICABLE and UNAVAILABLE are shown and excluded from the denominator',
    };
  }

  // ---- judge answers under the selected rubric only
  const evaluated = rows.filter((r) => r.report.interpreted && r.selected?.evaluation);
  const aiAnswer = (r: (typeof rows)[number], question: string): string =>
    r.selected?.evaluation?.answers.find((a) => a.question === question)?.answer ?? 'MISSING';

  const adjudications = evaluated.flatMap((r) => r.selected?.adjudications ?? []);
  const human = adjudications.filter((a) => a.provenance === 'HUMAN_RECORDED');
  // Later entries on a case are the current human position; earlier ones remain on file.
  const decisions = new Map<string, OwnerDecision>();
  for (const r of evaluated) {
    for (const a of (r.selected?.adjudications ?? []).filter((x) => x.provenance === 'HUMAN_RECORDED')) {
      const key = `${r.row.run_id}:${a.evaluation_id}:${a.evaluation_sha256}:${a.question}`;
      const earlier = decisions.get(key);
      const ai = aiAnswer(r, a.question);
      decisions.set(key, {
        run_id: r.row.run_id,
        evaluation_id: a.evaluation_id,
        question: a.question,
        ai_answer: ai,
        label: a.label,
        owner_answer: a.label === 'UNRESOLVED' ? null : a.label === 'CONFIRM' ? ai : a.answer,
        seq: a.seq,
        earlier_entries: earlier ? [...earlier.earlier_entries, { seq: earlier.seq, label: earlier.label }] : [],
        note: a.note,
        recorded_by: a.recorded_by,
      });
    }
  }
  const ownerDecisions = [...decisions.values()];

  const judgeAnswers: Summary['judge_answers'] = {};
  for (const question of rubric.questions) {
    const entry: JudgeAnswers = {
      dimension: question.dimension,
      evaluated_runs: evaluated.length,
      ...answerCounts(evaluated.map((r) => aiAnswer(r, question.id))),
    };
    const decided = ownerDecisions.filter((d) => d.question === question.id && d.owner_answer !== null);
    if (decided.length > 0) {
      const owner = (r: (typeof rows)[number]): string =>
        decided.find((d) => d.run_id === r.row.run_id && d.evaluation_id === r.selected?.evaluation_id)?.owner_answer ?? aiAnswer(r, question.id);
      entry.owner_adjusted = {
        ...answerCounts(evaluated.map(owner)),
        decided_cases: decided.length,
        // An owner answer that differs from the judge's is read with its note.
        caveats: decided.filter((d) => d.owner_answer !== d.ai_answer).map((d) => `${d.run_id} ${d.question}: ${d.note}`),
      };
    }
    judgeAnswers[question.id] = entry;
  }

  const disagree: Summary['fixture_agreement']['disagree'] = [];
  let compared = 0;
  for (const r of evaluated) {
    const expected = expectations[r.row.run_id]?.answers ?? {};
    for (const [question, answer] of Object.entries(expected)) {
      const judged = r.selected?.evaluation?.answers.find((a) => a.question === question)?.answer;
      if (!judged) continue;
      compared += 1;
      if (judged !== answer) disagree.push({ run_id: r.row.run_id, question, expected: answer, judged });
    }
  }

  return {
    schema_version: 2,
    record_type: 'cross-run-summary',
    rubric: rubricId,
    selection: `per run, the latest evaluation ACCEPTED under ${rubricId}; evaluations under other rubrics, rejected, or unchecked are listed per run and not aggregated`,
    runs: rows.map((r) => r.row),
    duplicates_ignored: duplicates,
    not_interpreted: rows.filter((r) => !r.report.interpreted).map((r) => ({ run_id: r.row.run_id, reason: r.report.not_interpreted_reason ?? '' })),
    metrics,
    judge_answers: judgeAnswers,
    fixture_agreement: {
      compared,
      agree: compared - disagree.length,
      disagree,
      note: 'Compares judge answers with what the fixtures were built to show. A fixture expectation is the builder\'s, not a human-confirmed label.',
    },
    human_calibration: {
      status: human.length === 0 ? 'HUMAN CALIBRATION PENDING' : 'HUMAN ADJUDICATION RECORDED',
      human_recorded_entries: human.length,
      by_label: tally(ownerDecisions.map((d) => d.label)),
      scripted_entries_excluded: adjudications.length - human.length,
      judged_answers: evaluated.length * rubric.questions.length,
      cases: ownerDecisions.length,
      unresolved: ownerDecisions.filter((d) => d.owner_answer === null).length,
      owner_differs: ownerDecisions.filter((d) => d.owner_answer !== null && d.owner_answer !== d.ai_answer).length,
      decisions: ownerDecisions,
      reading:
        'One decision per case: the latest human-recorded entry; earlier entries stay on file and are listed, not counted again. A differing owner answer is not a proven judge error and no judge-accuracy rate is computed; read each with its note, which states any interpretation limit.',
    },
    not_measured: [
      'Model token use, cost, latency, and effective model: no run records them (UNAVAILABLE). packet_bytes is storage, not usage.',
      'Any comparison between models: role content in these runs is not model output.',
      'Target-host behavior: no run was executed on the host.',
    ],
  };
}
