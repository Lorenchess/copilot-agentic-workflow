// One compact cross-run summary.
//
// Every figure is a count with a stated denominator and the records it was
// computed from. Nothing is averaged, nothing unknown is counted as a pass,
// a failure, or zero, and judgments under different rubric versions are
// never combined: the caller names one rubric, and only evaluations accepted
// under it are aggregated. The latest accepted evaluation per run is used,
// and that choice is stated in the output.
//
// Selection is deterministic. "Latest" is by preparation time, then by id
// with its number read as a number. An accepted evaluation that no longer
// agrees with its control record is listed and not aggregated, and no earlier
// evaluation is used in its place; the same holds when the latest evaluation's
// request or verdict is not a valid record, and when the run's evidence is no
// longer the evidence that evaluation judged (the run went on, or its files
// changed): a judgment of an earlier state is never shown as a judgment of
// the run as it is now. A run reached through several directories
// is one run: the copy whose evaluation records contain those of every other
// copy is read, whatever order the directories were given in, and copies
// that disagree are shown and their evaluations are not aggregated. Runs are
// listed by run id.
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
  // `issues` is present only when the evaluation disagrees with its control record.
  other_evaluations: { id: string; rubric: string | null; status: string; issues?: string[] }[];
  // Why this run has evaluations on file and none aggregated; null otherwise.
  not_aggregated: string | null;
  packet_bytes: number;
}

// One run that was reached through more than one directory.
export interface DuplicateRun {
  run_id: string;
  copies: number;
  // IDENTICAL: every copy holds the same records. MOST_COMPLETE_COPY: one copy holds everything the others
  // hold, and more; it is the one read. EVALUATIONS_DIFFER and RUN_RECORDS_DIFFER: the copies disagree; the run
  // is counted once and its evaluations are not aggregated.
  resolution: 'IDENTICAL' | 'MOST_COMPLETE_COPY' | 'EVALUATIONS_DIFFER' | 'RUN_RECORDS_DIFFER';
  // Each distinct content among the copies, without its location.
  variants: {
    copies: number;
    journal_events: number;
    outcome: string;
    evaluations: { id: string; rubric: string | null; status: string; evaluation_sha256: string | null; request_sha256: string | null; acceptance_sha256: string | null; adjudications: number; issues: string[] }[];
  }[];
}

export interface Summary {
  schema_version: 3;
  record_type: 'cross-run-summary';
  rubric: string;
  selection: string;
  runs: RunRow[];
  duplicates_ignored: number;
  duplicate_runs: DuplicateRun[];
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

interface Copy {
  report: DeterministicReport;
  evaluations: StoredEvaluation[];
}

const order = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

// True when `a` holds everything `b` holds: each evaluation of `b` as it is in
// `b`, its request and verdict files byte for byte (`control_sha256`), and
// each adjudication file of `b` as the beginning of the one in `a`.
function holdsAll(a: StoredEvaluation[], b: StoredEvaluation[]): boolean {
  const core = (e: StoredEvaluation): string => JSON.stringify({ ...e, adjudications: [] });
  return b.every((eb) => {
    const ea = a.find((e) => e.evaluation_id === eb.evaluation_id);
    return ea !== undefined && core(ea) === core(eb) && eb.adjudications.every((x, i) => JSON.stringify(x) === JSON.stringify(ea.adjudications[i]));
  });
}

// Reads the copies of one run as one run. Nothing here depends on the order
// of the copies. `evaluations` is null when the copies disagree.
function resolveCopies(copies: Copy[]): { report: DeterministicReport; evaluations: StoredEvaluation[] | null; resolution: DuplicateRun['resolution']; variants: DuplicateRun['variants'] } {
  const content = (c: Copy): string => JSON.stringify([c.report, c.evaluations]);
  const distinct = [...new Set(copies.map(content))].sort();
  const variants = distinct.map((text) => {
    const c = copies.find((x) => content(x) === text) as Copy;
    return {
      copies: copies.filter((x) => content(x) === text).length,
      journal_events: c.report.packet.events,
      outcome: c.report.outcome.status,
      evaluations: c.evaluations.map((e) => ({
        id: e.evaluation_id,
        rubric: e.rubric,
        status: e.status,
        evaluation_sha256: e.evaluation_sha256,
        request_sha256: e.control_sha256.request,
        acceptance_sha256: e.control_sha256.acceptance,
        adjudications: e.adjudications.length,
        issues: e.issues,
      })),
    };
  });
  // The run's own records first. If they differ, the copy with the longest journal is counted, once.
  const byRecords = [...copies].sort((a, b) => b.report.packet.events - a.report.packet.events || order(content(a), content(b)));
  const first = byRecords[0] as Copy;
  if (copies.some((c) => JSON.stringify(c.report) !== JSON.stringify(first.report))) {
    return { report: first.report, evaluations: null, resolution: 'RUN_RECORDS_DIFFER', variants };
  }
  if (distinct.length === 1) return { report: first.report, evaluations: first.evaluations, resolution: 'IDENTICAL', variants };
  const complete = copies.find((c) => copies.every((o) => holdsAll(c.evaluations, o.evaluations)));
  if (!complete) return { report: first.report, evaluations: null, resolution: 'EVALUATIONS_DIFFER', variants };
  return { report: first.report, evaluations: complete.evaluations, resolution: 'MOST_COMPLETE_COPY', variants };
}

export function summarize(runDirs: string[], rubricId: string, expectations: Record<string, CaseExpectation> = {}): Summary {
  const rubric = RUBRICS[rubricId];
  if (!rubric) throw new Error(`unsupported rubric "${rubricId}"`);

  // The same run reached through two paths (a copy, a repeated import) is one run.
  const groups = new Map<string, Copy[]>();
  runDirs.forEach((dir, index) => {
    const report = evaluateDeterministic(dir);
    const key = report.run_id ? `${report.run_id}:${report.run_fingerprint}` : `unreadable:${index}`;
    groups.set(key, [...(groups.get(key) ?? []), { report, evaluations: listEvaluations(dir) }]);
  });
  let duplicates = 0;
  const duplicateRuns: DuplicateRun[] = [];
  const rows: { row: RunRow; report: DeterministicReport; selected: StoredEvaluation | null }[] = [];
  for (const copies of groups.values()) {
    const resolved = resolveCopies(copies);
    const { report } = resolved;
    if (copies.length > 1) {
      duplicates += copies.length - 1;
      duplicateRuns.push({ run_id: report.run_id ?? '(unreadable)', copies: copies.length, resolution: resolved.resolution, variants: resolved.variants });
    }
    const evaluations = resolved.evaluations ?? [];
    const accepted = evaluations.filter((e) => e.status === 'ACCEPTED' && e.rubric === rubricId);
    // An evaluation whose control records are not valid may be the newest one accepted under this rubric, so it
    // stands in the same line; one without a valid request has no preparation time and stands last.
    const candidates = evaluations.filter((e) => accepted.includes(e) || (e.status === 'INVALID' && (e.rubric === null || e.rubric === rubricId)));
    // The latest of these is the only candidate. If it has an issue it is shown with it, and no earlier
    // evaluation is aggregated in its place.
    const latest = candidates.at(-1) ?? null;
    const selected = latest && latest.issues.length === 0 ? latest : null;
    const notAggregated =
      resolved.evaluations === null
        ? `copies of this run disagree (${resolved.resolution}); see duplicate_runs`
        : latest && !selected
          ? `${latest.evaluation_id}: ${latest.issues.join('; ')}`
          : null;
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
        other_evaluations: evaluations
          .filter((e) => e !== selected)
          .map((e) => ({ id: e.evaluation_id, rubric: e.rubric, status: e.status, ...(e.issues.length > 0 ? { issues: e.issues } : {}) })),
        not_aggregated: notAggregated,
        packet_bytes: report.storage.packet_bytes,
      },
    });
  }
  // Listed by run id, so the summary is the same whatever order the directories were given in.
  rows.sort((a, b) => order(a.row.run_id, b.row.run_id) || order(JSON.stringify(a.row), JSON.stringify(b.row)));
  duplicateRuns.sort((a, b) => order(a.run_id, b.run_id) || order(JSON.stringify(a), JSON.stringify(b)));

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
    schema_version: 3,
    record_type: 'cross-run-summary',
    rubric: rubricId,
    selection: `per run, the latest evaluation ACCEPTED under ${rubricId}, by preparation time and then by id; evaluations under other rubrics, rejected, or unchecked are listed per run and not aggregated; an accepted evaluation that no longer agrees with its control record, one that judged evidence the run no longer has, an evaluation whose control records are not valid when it is the latest candidate, and the evaluations of a run whose copies disagree, are listed and not aggregated`,
    runs: rows.map((r) => r.row),
    duplicates_ignored: duplicates,
    duplicate_runs: duplicateRuns,
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
