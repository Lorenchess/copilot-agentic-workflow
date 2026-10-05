// Deterministic evaluation of a run packet. Everything here is computed from
// the packet's own records; no model is involved and nothing is executed.
//
// Results are kept by evidence class and never rolled up into one verdict:
// a run can have correct control flow, actually executed tests, simulated
// role content, a scripted decision, and no host observation all at once.
//
// A check result is one of:
//   PASS / FAIL      the packet contains the evidence and it does or does not hold
//   NOT_APPLICABLE   the check has no subject in this run (no proposal, no audit yet)
//   UNAVAILABLE      the check applies but the packet cannot answer it
// Unavailable and not-applicable results are never counted as passes, failures, or zeros.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { ExecutionRecord, Proof } from '../core/contracts/app.ts';
import type { RunState } from '../core/engine/state.ts';
import { replay } from '../core/engine/state.ts';
import type { JournalEvent } from '../core/contracts/records.ts';
import { canonicalJson } from '../core/contracts/records.ts';
import type { WorkflowDef } from '../core/policies/workflow.ts';
import { type PacketReport, verifyPacket } from './verify-packet.ts';

export type CheckResult = 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'UNAVAILABLE';

// Record formats this evaluator interprets. A run recorded under any other
// workflow version is reported as not interpreted. It is not re-read under
// today's rules, which would turn format differences into false failures.
//
// Version 5 has no PR review: its runs are read exactly as before, the PR
// review checks report that the stage does not exist in that version, and
// nothing here presents such a run as reviewed for submission. Version 6 adds
// the PR review packet and the PR review before a proposal. Each run is
// replayed with the definition it retained, never with today's.
export const SUPPORTED_WORKFLOW_VERSIONS = [5, 6];
// The first version whose proposals follow a PR review.
const PR_REVIEW_SINCE = 6;

export interface Check {
  id: string;
  result: CheckResult;
  detail: string;
}

export interface DeterministicReport {
  schema_version: 1;
  record_type: 'deterministic-report';
  run_id: string | null;
  // First journal record's checksum: tells two copies of one run from two runs.
  run_fingerprint: string | null;
  // False when the run was recorded in a format this evaluator does not interpret.
  interpreted: boolean;
  not_interpreted_reason: string | null;
  identities: { source: string | null; base: string | null; workflow: string | null; profile: string | null; workflow_version: number | null };
  packet: { ok: boolean; problems: string[]; references_resolved: number; events: number };
  // What the run reached. A blocked or waiting run is an outcome, not an error.
  outcome: { status: 'PROPOSAL_READY' | 'REJECTED' | 'BLOCKED' | 'WAITING_HUMAN' | 'IN_PROGRESS' | 'UNREADABLE'; stage: string | null; blocker: string | null };
  // Whether the engineering task ended with a verified, reviewed candidate. Separate from whether controls worked.
  task_completed: boolean;
  control: Check[];
  // Per operation, what kind of evidence it is.
  evidence: {
    role_results: string;
    test_execution: 'ACTUAL_LOCAL_EXECUTION' | 'NOT_APPLICABLE';
    review: string;
    // The submission review. NOT_IN_THIS_WORKFLOW_VERSION: the run's workflow has
    // no such stage, which is neither a pass nor a missing record.
    pr_review: string;
    authorization: { decision_id: string; provenance: string; human_observed: 'NO' | 'UNVERIFIED_CLAIM' | 'UNKNOWN' } | 'NOT_APPLICABLE';
    host_validation: 'NOT_OBSERVED';
  };
  executions: { purpose: string; outcome: string; exit_code: number | null; tests: number; failed: number; record: string }[];
  // For each criterion of an accepted proof: was the test shown to detect the behavior's absence?
  proof: { criterion: string; route: string; sensitivity: 'DEMONSTRATED' | 'NOT_DEMONSTRATED' }[] | 'NOT_APPLICABLE';
  unsuccessful: { failed_attempts: Record<string, number>; rejected_submissions: Record<string, number>; failed_verifications: number };
  storage: { packet_files: number; packet_bytes: number };
  // Token, cost, and effective-model data are not recorded by any run.
  usage: 'UNAVAILABLE';
}

const PACKET_EXCLUDED = ['work', 'exec', 'evaluation', 'evaluation-control'];

function packetStorage(packetDir: string): { packet_files: number; packet_bytes: number } {
  let files = 0;
  let bytes = 0;
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else {
        files += 1;
        bytes += stat.size;
      }
    }
  };
  for (const name of readdirSync(packetDir)) {
    if (PACKET_EXCLUDED.includes(name)) continue;
    const full = join(packetDir, name);
    if (statSync(full).isDirectory()) walk(full);
    else {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { packet_files: files, packet_bytes: bytes };
}

function count(list: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of list) out[item] = (out[item] ?? 0) + 1;
  return out;
}

const EMPTY_PACKET: PacketReport = {
  ok: false,
  problems: [],
  events: 0,
  references_resolved: 0,
  workflow: null,
  profile: null,
  transport_class: null,
  unsuccessful_attempts: [],
  rejected_submissions: [],
  decisions: [],
  planning_basis: null,
  executions: [],
  candidate: null,
};

// Reads only the first journal record and the workflow definition it names.
function recordedFormat(packetDir: string): { version: number | null; reason: string | null } {
  try {
    const line = readFileSync(join(packetDir, 'journal.jsonl'), 'utf8').split('\n')[0] ?? '';
    const first = JSON.parse(line.slice(65)) as JournalEvent;
    const ref = first.data.workflow_ref;
    const file = typeof ref === 'string' ? join(packetDir, 'artifacts', ref.slice(7)) : '';
    if (!file || !existsSync(file)) return { version: null, reason: 'the run does not retain its workflow definition, so its record format is unknown' };
    const version = (JSON.parse(readFileSync(file, 'utf8')) as { workflow_version?: number }).workflow_version ?? null;
    if (version === null || !SUPPORTED_WORKFLOW_VERSIONS.includes(version)) {
      return { version, reason: `recorded under workflow version ${version}; this evaluator interprets ${SUPPORTED_WORKFLOW_VERSIONS.join(', ')}` };
    }
    return { version, reason: null };
  } catch {
    return { version: null, reason: 'the journal has no readable first record' };
  }
}

export function evaluateDeterministic(packetDir: string): DeterministicReport {
  const format = recordedFormat(packetDir);
  const packet: PacketReport = format.reason ? { ...EMPTY_PACKET, problems: [format.reason] } : verifyPacket(packetDir);
  const report: DeterministicReport = {
    schema_version: 1,
    record_type: 'deterministic-report',
    run_id: null,
    run_fingerprint: null,
    interpreted: format.reason === null,
    not_interpreted_reason: format.reason,
    identities: { source: null, base: null, workflow: null, profile: null, workflow_version: format.version },
    packet: { ok: packet.ok, problems: packet.problems, references_resolved: packet.references_resolved, events: packet.events },
    outcome: { status: 'UNREADABLE', stage: null, blocker: null },
    task_completed: false,
    control: [],
    evidence: { role_results: packet.transport_class ?? 'UNKNOWN', test_execution: 'NOT_APPLICABLE', review: 'NOT_APPLICABLE', pr_review: 'NOT_APPLICABLE', authorization: 'NOT_APPLICABLE', host_validation: 'NOT_OBSERVED' },
    executions: [],
    proof: 'NOT_APPLICABLE',
    unsuccessful: { failed_attempts: {}, rejected_submissions: {}, failed_verifications: 0 },
    storage: existsSync(packetDir) ? packetStorage(packetDir) : { packet_files: 0, packet_bytes: 0 },
    usage: 'UNAVAILABLE',
  };

  const journal = join(packetDir, 'journal.jsonl');
  if (!existsSync(journal)) return report;
  const lines = readFileSync(journal, 'utf8').split('\n').filter(Boolean);
  if (lines.length === 0) return report;
  let events: JournalEvent[];
  try {
    events = lines.map((l) => JSON.parse(l.slice(65)) as JournalEvent);
  } catch {
    return report;
  }
  const first = events[0] as JournalEvent;
  report.run_id = first.run_id;
  report.run_fingerprint = (lines[0] as string).slice(0, 64);
  const text = (ref: unknown): string | null => {
    if (typeof ref !== 'string') return null;
    const file = join(packetDir, 'artifacts', ref.slice(7));
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  };
  const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
  report.identities = {
    source: str(first.data.source_ref),
    base: str(first.data.base_ref),
    workflow: str(first.data.workflow_ref),
    profile: str(first.data.profile_ref),
    workflow_version: format.version,
  };
  if (format.reason) {
    report.evidence.role_results = typeof first.data.transport_class === 'string' ? first.data.transport_class : 'UNKNOWN';
    report.control.push({ id: 'supported-format', result: 'UNAVAILABLE', detail: format.reason });
    return report;
  }

  // State is derived with the workflow definition the run itself retained. A run
  // whose records this code cannot replay is reported as such, not reinterpreted.
  let state: RunState | null = null;
  let replayProblem = '';
  const workflowText = text(first.data.workflow_ref);
  if (!workflowText) replayProblem = 'the run does not retain its workflow definition';
  else {
    try {
      state = replay(events, JSON.parse(workflowText) as WorkflowDef);
    } catch (e) {
      replayProblem = e instanceof Error ? e.message : 'replay failed';
    }
  }
  const check = (id: string, result: CheckResult, detail: string): void => {
    report.control.push({ id, result, detail });
  };
  check('packet-resolves', packet.ok ? 'PASS' : 'FAIL', packet.ok ? `${packet.references_resolved} identities resolved` : packet.problems.slice(0, 3).join('; '));
  check('state-replays', state ? 'PASS' : 'UNAVAILABLE', state ? `version ${state.version}` : replayProblem);

  if (state) {
    report.outcome =
      state.phase === 'DONE'
        ? { status: state.terminal === 'PR_PROPOSAL_READY' ? 'PROPOSAL_READY' : 'REJECTED', stage: state.stage, blocker: null }
        : state.phase === 'BLOCKED'
          ? { status: 'BLOCKED', stage: state.stage, blocker: state.blocker?.code ?? null }
          : { status: state.phase === 'WAITING_HUMAN' ? 'WAITING_HUMAN' : 'IN_PROGRESS', stage: state.stage, blocker: null };
    // A proposal whose evidence no longer resolves cannot be shown to be complete.
    report.task_completed = report.outcome.status === 'PROPOSAL_READY' && packet.ok;
  }

  // ---- control checks from the event sequence
  const index = (pred: (e: JournalEvent) => boolean, from = 0): number => events.findIndex((e, i) => i >= from && pred(e));
  const lastIndex = (pred: (e: JournalEvent) => boolean): number => events.map(pred).lastIndexOf(true);
  const dispatchOf = new Map<string, JournalEvent>();
  for (const e of events) if (e.type === 'task_dispatched') dispatchOf.set(String(e.data.attempt_id), e);
  const stageOfResult = (e: JournalEvent): string => String(dispatchOf.get(String(e.data.attempt_id))?.data.step_id ?? '');

  const authorizing = lastIndex((e) => e.type === 'decision_recorded' && (e.data.action === 'proceed' || e.data.action === 'amend'));
  const auditAccepted = lastIndex((e) => e.type === 'result_accepted' && stageOfResult(e) === 'plan-audit' && (authorizing < 0 || events.indexOf(e) < authorizing));
  const brief = lastIndex((e) => e.type === 'brief_rendered' && (authorizing < 0 || events.indexOf(e) < authorizing));
  const laterWork = index((e) => e.type === 'task_dispatched' && ['proof', 'implement', 'review', 'pr-review'].includes(String(e.data.step_id)));

  if (auditAccepted < 0) check('gate-ordering', 'NOT_APPLICABLE', 'no audit result was accepted');
  else if (laterWork >= 0 && (authorizing < 0 || authorizing > laterWork)) check('gate-ordering', 'FAIL', 'work after planning was dispatched without an earlier authorizing decision');
  else if (authorizing >= 0 && !(auditAccepted < brief && brief < authorizing)) check('gate-ordering', 'FAIL', 'the authorizing decision does not follow the audit and the brief');
  else check('gate-ordering', 'PASS', authorizing >= 0 ? `audit record ${auditAccepted + 1}, brief ${brief + 1}, decision ${authorizing + 1}` : 'no work after planning and no authorizing decision yet');

  if (authorizing < 0) check('decision-basis', 'NOT_APPLICABLE', 'no authorizing decision');
  else {
    const current: Record<string, string> = {};
    for (const e of events.slice(0, authorizing)) {
      if (e.type === 'result_accepted') Object.assign(current, e.data.subjects as Record<string, string>);
      if (e.type === 'brief_rendered') current.brief = String(e.data.brief_ref);
    }
    const shown = Object.fromEntries(['audit', 'brief', 'intent', 'plan', 'spec'].map((k) => [k, current[k]]));
    const named = (events[authorizing] as JournalEvent).data.subjects;
    check('decision-basis', canonicalJson(named) === canonicalJson(shown) ? 'PASS' : 'FAIL', 'decision subjects compared with the identities current at that record');
  }

  const auditDispatches = events.filter((e) => e.type === 'task_dispatched' && e.data.step_id === 'plan-audit');
  if (auditDispatches.length === 0) check('audit-inputs-limited', 'NOT_APPLICABLE', 'no audit was dispatched');
  else {
    const extra = auditDispatches.flatMap((e) => Object.keys(e.data.inputs as object).filter((k) => !['source', 'intent', 'spec', 'plan'].includes(k)));
    check('audit-inputs-limited', extra.length === 0 ? 'PASS' : 'FAIL', extra.length === 0 ? `${auditDispatches.length} audit dispatch(es), inputs limited to source, intent, spec, plan` : `extra inputs: ${extra.join(', ')}`);
  }

  // ---- the PR review gate, for the workflow versions that have one
  const prReviewed = (format.version ?? 0) >= PR_REVIEW_SINCE;
  if (!prReviewed) {
    check('pr-review-gate', 'NOT_APPLICABLE', `workflow version ${format.version} has no PR review stage; the run is not read as if it had one`);
    report.evidence.pr_review = 'NOT_IN_THIS_WORKFLOW_VERSION';
  } else {
    const proposed = lastIndex((e) => e.type === 'proposal_recorded');
    if (proposed < 0) check('pr-review-gate', 'NOT_APPLICABLE', 'no proposal was recorded');
    else {
      // Read backwards from the proposal: the approving PR review, the packet it
      // was given, and the code review before that, with nothing invalidated between.
      const before = (pred: (e: JournalEvent) => boolean, limit: number): number => events.map((e, i) => i < limit && pred(e)).lastIndexOf(true);
      const prAccepted = before((e) => e.type === 'result_accepted' && stageOfResult(e) === 'pr-review', proposed);
      const packetAt = before((e) => e.type === 'pr_review_packet_recorded', prAccepted);
      const reviewAccepted = before((e) => e.type === 'result_accepted' && stageOfResult(e) === 'review', packetAt);
      const invalidated = events.some((e, i) => e.type === 'verification_invalidated' && i > reviewAccepted && i < proposed);
      const accepted = prAccepted >= 0 ? (events[prAccepted] as JournalEvent) : null;
      const given = accepted ? (dispatchOf.get(String(accepted.data.attempt_id))?.data.inputs as Record<string, string> | undefined) : undefined;
      const packetRef = packetAt >= 0 ? (events[packetAt] as JournalEvent).data.packet_ref : null;
      const problems: string[] = [];
      if (reviewAccepted < 0 || packetAt < 0 || prAccepted < 0) problems.push('the proposal does not follow a code review, a PR review packet, and a PR review, in that order');
      else {
        if (invalidated) problems.push('the verification was invalidated between the code review and the proposal');
        if (accepted?.data.pr_review_verdict !== 'APPROVE') problems.push(`the PR review before the proposal returned ${String(accepted?.data.pr_review_verdict)}`);
        if (given?.pr_review_packet !== packetRef) problems.push('the PR review was given another packet than the one recorded before it');
      }
      check('pr-review-gate', problems.length === 0 ? 'PASS' : 'FAIL', problems.length === 0 ? `code review record ${reviewAccepted + 1}, packet ${packetAt + 1}, PR review ${prAccepted + 1}, proposal ${proposed + 1}` : problems.join('; '));
    }
    if (events.some((e) => e.type === 'result_accepted' && stageOfResult(e) === 'pr-review')) report.evidence.pr_review = report.evidence.role_results;
  }

  // ---- executions, proof, proposal
  const proposalFile = join(packetDir, 'proposal', 'pr-proposal.json');
  const proposal = existsSync(proposalFile) ? (JSON.parse(readFileSync(proposalFile, 'utf8')) as Record<string, unknown>) : null;
  for (const e of packet.executions) {
    const record = JSON.parse(text(e.record) ?? '{}') as ExecutionRecord;
    report.executions.push({
      purpose: e.purpose,
      outcome: e.outcome,
      exit_code: record.exit_code ?? null,
      tests: e.tests,
      failed: (record.tests ?? []).filter((t) => t.status === 'FAIL').length,
      record: e.record,
    });
  }
  if (report.executions.length > 0) report.evidence.test_execution = 'ACTUAL_LOCAL_EXECUTION';
  report.unsuccessful.failed_verifications = report.executions.filter((e) => e.purpose === 'CANDIDATE_VERIFICATION' && e.outcome !== 'PASS').length;

  const proofRef = state?.subjects.proof ?? null;
  const proofText = text(proofRef);
  if (proofText) {
    // A red-green criterion was seen failing and (if a verification passed) passing. An
    // already-satisfied criterion was only ever seen passing: that shows nothing about sensitivity.
    report.proof = (JSON.parse(proofText) as Proof).criteria.map((c) => ({
      criterion: c.criterion,
      route: c.route,
      sensitivity: c.route === 'RED_GREEN' ? 'DEMONSTRATED' : 'NOT_DEMONSTRATED',
    }));
  }

  if (!proposal) {
    check('proposal-links', 'NOT_APPLICABLE', 'no proposal');
    check('publication-not-attempted', 'NOT_APPLICABLE', 'no proposal');
  } else {
    const verification = JSON.parse(text(proposal.verification) ?? '{}') as ExecutionRecord;
    const review = JSON.parse(text(proposal.review) ?? '{}') as { subject?: Record<string, string>; verdict?: string };
    const basis = (proposal.planning_basis ?? {}) as Record<string, string>;
    const finalPlan = JSON.parse(text(basis.final_plan) ?? '{}') as { decision?: string };
    const problems: string[] = [];
    if (verification.tree !== proposal.candidate_ref) problems.push('the verification ran a tree other than the candidate');
    if (verification.classification?.outcome !== 'PASS') problems.push('the verification named by the proposal did not pass');
    if (review.subject?.candidate !== proposal.candidate_ref || review.subject?.verification !== proposal.verification) problems.push('the review names another candidate or verification');
    if (review.verdict !== 'ACCEPT') problems.push('the review named by the proposal is not an acceptance');
    if (finalPlan.decision !== basis.decision) problems.push('the final plan names another decision');
    if (prReviewed) {
      // From this version on a proposal also names the packet and the PR review, and they must agree with it.
      const packet = JSON.parse(text(proposal.pr_review_packet) ?? '{}') as { implementation?: Record<string, string>; execution?: Record<string, string>; technical_review?: Record<string, string> };
      const prReview = JSON.parse(text(proposal.pr_review) ?? '{}') as { subject?: Record<string, string>; verdict?: string };
      if (proposal.schema_version !== 2) problems.push('the proposal is not in the format that carries a PR review');
      if (packet.implementation?.candidate !== proposal.candidate_ref || packet.execution?.verification !== proposal.verification || packet.technical_review?.review !== proposal.review) {
        problems.push('the PR review packet names another candidate, verification, or code review');
      }
      if (prReview.subject?.packet !== proposal.pr_review_packet || prReview.subject?.candidate !== proposal.candidate_ref) problems.push('the PR review names another packet or candidate');
      if (prReview.verdict !== 'APPROVE') problems.push('the PR review named by the proposal is not an approval');
    }
    check(
      'proposal-links',
      problems.length === 0 ? 'PASS' : 'FAIL',
      problems.length === 0 ? `candidate, verification, review, ${prReviewed ? 'PR review packet, PR review, ' : ''}and decision agree` : problems.join('; '),
    );
    check('publication-not-attempted', proposal.publication_status === 'NOT_ATTEMPTED' ? 'PASS' : 'FAIL', `publication_status ${String(proposal.publication_status)}`);
  }

  // ---- evidence classes per operation
  if (events.some((e) => e.type === 'result_accepted' && stageOfResult(e) === 'review')) report.evidence.review = report.evidence.role_results;
  if (authorizing >= 0) {
    const d = (events[authorizing] as JournalEvent).data;
    // Runs recorded before provenance existed carry none: that is UNKNOWN, not human.
    const provenance = typeof d.provenance === 'string' ? d.provenance : 'UNKNOWN';
    report.evidence.authorization = {
      decision_id: String(d.decision_id),
      provenance,
      human_observed: provenance === 'SCRIPTED' ? 'NO' : provenance === 'HUMAN_RECORDED' ? 'UNVERIFIED_CLAIM' : 'UNKNOWN',
    };
  }

  report.unsuccessful.failed_attempts = count(events.filter((e) => e.type === 'attempt_failed').map((e) => String(e.data.kind)));
  report.unsuccessful.rejected_submissions = count(packet.rejected_submissions.map((f) => f.split('.')[1] ?? 'UNKNOWN'));
  return report;
}
