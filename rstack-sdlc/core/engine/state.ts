// Run state is derived: it is the result of replaying the journal. Nothing
// else may be edited to change it. Replay re-validates every event against
// the state it applies to, so an inconsistent journal blocks instead of
// producing a plausible state.

import type { TransportClass } from '../contracts/ports.ts';
import type { PlanStatus } from '../contracts/planning.ts';
import {
  type DecisionAction,
  type DecisionProvenance,
  type FailureKind,
  type JournalEvent,
  type Outcome,
  DECISION_ACTIONS,
  FAILURE_KINDS,
  ID_PATTERN,
  OUTCOMES,
  REF_PATTERN,
} from '../contracts/records.ts';
import { type StageDef, type WorkflowDef, allowedActions, stageOf } from '../policies/workflow.ts';
import { EngineBlock } from './errors.ts';

export interface PendingAttempt {
  attempt_id: string;
  step_id: string;
  role: string;
  dispatched_version: number;
  inputs: Record<string, string>;
  input_digest: string;
}

export interface AttemptLog {
  step_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'FAILED';
  digest: string | null;
  settled_version: number | null;
  failure: FailureKind | null;
}

export interface AcceptedResult {
  attempt_id: string;
  result_ref: string;
  outcome: Outcome;
  outputs: Record<string, string>;
  accepted_version: number;
}

export interface DecisionLog {
  digest: string;
  action: DecisionAction;
  recorded_version: number;
  // Identity of the retained decision record, and how it came to be recorded.
  decision_ref: string;
  provenance: DecisionProvenance;
}

// Planning authorization. The audit verdict, the human's authorization, and
// whether the authorized plan is the audited one are kept as separate facts.
export interface PlanningAuthorization {
  status: 'AUTHORIZED';
  plan_status: PlanStatus;
  final_plan: string;
  last_audited_plan: string;
  audit: string;
  audit_round: number;
  brief: string;
  decision_id: string;
  decision_ref: string;
  // Derived from the authorizing decision; not a separate fact.
  decision_provenance: DecisionProvenance;
}

export type Phase = 'ACTIVE' | 'WAITING_HUMAN' | 'DONE' | 'BLOCKED';

export interface RunState {
  schema_version: 1;
  run_id: string;
  version: number;
  request_id: string;
  source_ref: string;
  profile_ref: string;
  workflow_ref: string;
  sink: string;
  transport_class: TransportClass;
  max_attempts: Record<string, number>;
  stage: string;
  phase: Phase;
  paused: boolean;
  round: number;
  question_rounds: number;
  terminal: 'PR_PROPOSAL_READY' | 'REJECTED' | null;
  blocker: { code: string; detail: string } | null;
  pending: PendingAttempt | null;
  // Dispatches per stage over the whole run (attempt identities), and failed
  // invocations since the current stage was entered (the retry budget).
  attempts: Record<string, number>;
  entry_failures: number;
  attempt_log: Record<string, AttemptLog>;
  accepted: Record<string, AcceptedResult>;
  // Current identity of each retained record: source, intent, spec, plan, ...
  subjects: Record<string, string>;
  planning: PlanningAuthorization | null;
  decisions: Record<string, DecisionLog>;
  audit_budget: { max: number; used: number };
  // Identity of the application's configuration, and how many candidates have failed verification.
  app_config_ref: string;
  failed_verifications: number;
  proposal: { proposal_ref: string; location: string } | null;
  publication_status: 'NOT_ATTEMPTED';
  // The accepted PR review of the current candidate: its verdict and the
  // identity of the retained record, which holds the findings and limitations.
  // Absent until a PR review is accepted, and in runs of a workflow without one.
  pr_review?: { verdict: 'APPROVE' | 'REQUEST_CHANGES' | 'INCONCLUSIVE'; record: string };
}

function corrupt(event: JournalEvent, why: string): never {
  throw new EngineBlock('JOURNAL_CORRUPT', `journal record ${event.seq} (${event.type}) is inconsistent: ${why}`, {
    record: event.seq,
  });
}

function str(event: JournalEvent, key: string, pattern?: RegExp): string {
  const v = event.data[key];
  if (typeof v !== 'string' || v.length === 0 || (pattern && !pattern.test(v))) corrupt(event, `bad ${key}`);
  return v as string;
}

function strMap(event: JournalEvent, key: string, pattern?: RegExp): Record<string, string> {
  const v = event.data[key];
  if (typeof v !== 'object' || v === null || Array.isArray(v)) corrupt(event, `bad ${key}`);
  for (const val of Object.values(v as object)) {
    if (typeof val !== 'string' || (pattern && !pattern.test(val))) corrupt(event, `bad ${key}`);
  }
  return v as Record<string, string>;
}

function intMap(event: JournalEvent, key: string): Record<string, number> {
  const v = event.data[key];
  if (typeof v !== 'object' || v === null || Array.isArray(v)) corrupt(event, `bad ${key}`);
  for (const val of Object.values(v as object)) if (!Number.isInteger(val) || (val as number) < 1) corrupt(event, `bad ${key}`);
  return v as Record<string, number>;
}

export function currentStage(state: RunState, workflow: WorkflowDef): StageDef | null {
  return stageOf(workflow, state.stage);
}

function enter(state: RunState, workflow: WorkflowDef, event: JournalEvent, id: string | null): void {
  const stage = id ? stageOf(workflow, id) : null;
  if (!stage) corrupt(event, `no stage "${id}"`);
  state.stage = stage.id;
  state.entry_failures = 0;
  state.paused = false;
  state.phase = stage.kind === 'human' ? 'WAITING_HUMAN' : 'ACTIVE';
}

export function applyEvent(prev: RunState | null, event: JournalEvent, workflow: WorkflowDef): RunState {
  if (event.type === 'run_started') {
    if (prev) corrupt(event, 'run already started');
    const budget = event.data.audit_budget_max;
    if (!Number.isInteger(budget) || (budget as number) < 1) corrupt(event, 'bad audit_budget_max');
    const transport = event.data.transport_class;
    if (transport !== 'SIMULATED' && transport !== 'MANUAL_TRANSPORT') corrupt(event, 'bad transport_class');
    const first = workflow.stages[0];
    if (!first) corrupt(event, 'workflow has no stages');
    const sourceRef = str(event, 'source_ref', REF_PATTERN);
    // The PR-review procedure the run was started with, when its workflow has that review.
    const procedure: Record<string, string> =
      event.data.pr_review_procedure_ref === undefined ? {} : { pr_review_procedure: str(event, 'pr_review_procedure_ref', REF_PATTERN) };
    return {
      schema_version: 1,
      run_id: event.run_id,
      version: event.seq,
      request_id: str(event, 'request_id', ID_PATTERN),
      source_ref: sourceRef,
      profile_ref: str(event, 'profile_ref', REF_PATTERN),
      workflow_ref: str(event, 'workflow_ref', REF_PATTERN),
      sink: str(event, 'sink', ID_PATTERN),
      transport_class: transport,
      max_attempts: intMap(event, 'max_attempts'),
      stage: first.id,
      phase: 'ACTIVE',
      paused: false,
      round: 1,
      question_rounds: 0,
      terminal: null,
      blocker: null,
      pending: null,
      attempts: {},
      entry_failures: 0,
      attempt_log: {},
      accepted: {},
      subjects: { source: sourceRef, base: str(event, 'base_ref', REF_PATTERN), ...procedure },
      app_config_ref: str(event, 'app_config_ref', REF_PATTERN),
      failed_verifications: 0,
      planning: null,
      decisions: {},
      audit_budget: { max: budget as number, used: 0 },
      proposal: null,
      publication_status: 'NOT_ATTEMPTED',
    };
  }
  if (!prev) corrupt(event, 'first record is not run_started');
  const state = structuredClone(prev);
  state.version = event.seq;
  const stage = currentStage(state, workflow);
  if (!stage) corrupt(event, 'run is at an unknown stage');

  switch (event.type) {
    case 'task_dispatched': {
      if (state.phase !== 'ACTIVE' || state.pending || stage.kind !== 'role') corrupt(event, 'no dispatch allowed here');
      const attemptId = str(event, 'attempt_id', ID_PATTERN);
      if (str(event, 'step_id') !== stage.id || str(event, 'role') !== stage.role) corrupt(event, 'wrong stage or role');
      if (state.attempt_log[attemptId]) corrupt(event, 'attempt id reused');
      state.attempts[stage.id] = (state.attempts[stage.id] ?? 0) + 1;
      state.attempt_log[attemptId] = { step_id: stage.id, status: 'PENDING', digest: null, settled_version: null, failure: null };
      state.pending = {
        attempt_id: attemptId,
        step_id: stage.id,
        role: stage.role as string,
        dispatched_version: event.seq,
        inputs: strMap(event, 'inputs', REF_PATTERN),
        input_digest: str(event, 'input_digest', REF_PATTERN),
      };
      return state;
    }
    case 'result_accepted': {
      const attemptId = str(event, 'attempt_id', ID_PATTERN);
      const log = state.attempt_log[attemptId];
      if (!state.pending || state.pending.attempt_id !== attemptId || !log) corrupt(event, 'attempt is not pending');
      const outcome = event.data.outcome as Outcome;
      if (!OUTCOMES.includes(outcome)) corrupt(event, 'bad outcome');
      const resultRef = str(event, 'result_ref', REF_PATTERN);
      log.status = 'ACCEPTED';
      log.digest = str(event, 'result_digest', REF_PATTERN);
      log.settled_version = event.seq;
      state.accepted[stage.id] = {
        attempt_id: attemptId,
        result_ref: resultRef,
        outcome,
        outputs: strMap(event, 'outputs'),
        accepted_version: event.seq,
      };
      state.pending = null;

      const produced = strMap(event, 'subjects', REF_PATTERN);
      const expected = [...(stage.produces ?? []).map((p) => p.key), ...(stage.derives ?? [])].sort();
      if (Object.keys(produced).sort().join() !== expected.join()) corrupt(event, 'produced records do not match the stage');
      if (expected.length === 0) state.subjects[stage.id] = resultRef;
      Object.assign(state.subjects, produced);

      if (stage.consumes_audit) {
        if (state.audit_budget.used >= state.audit_budget.max) corrupt(event, 'audit budget exceeded');
        state.audit_budget.used += 1;
      }
      if (outcome === 'NEGATIVE') {
        state.phase = 'BLOCKED';
        state.blocker = { code: 'NEGATIVE_RESULT', detail: `stage ${stage.id} completed with a negative result` };
        return state;
      }
      // An intent that still has open product decisions goes to the human, not to the specification.
      if (stage.id === 'intent' && event.data.open_decisions === true) {
        if (state.question_rounds >= workflow.max_question_rounds) {
          state.phase = 'BLOCKED';
          state.blocker = { code: 'UNRESOLVED_PRODUCT_DECISIONS', detail: 'the intent still has open decisions after every permitted question round' };
          return state;
        }
        enter(state, workflow, event, 'product-question');
        return state;
      }
      // A review that does not accept the candidate stops the run; it is not overridden.
      if (stage.id === 'review') {
        const verdict = event.data.review_verdict;
        if (verdict !== 'ACCEPT' && verdict !== 'REJECT' && verdict !== 'INCONCLUSIVE') corrupt(event, 'bad review verdict');
        if (verdict !== 'ACCEPT') {
          state.phase = 'BLOCKED';
          state.blocker = { code: verdict === 'REJECT' ? 'REVIEW_REJECTED' : 'REVIEW_INCONCLUSIVE', detail: `the review of the candidate returned ${verdict}` };
          return state;
        }
      }
      // Only an approving PR review lets a proposal be composed. Any other verdict
      // stops the run with the review retained: nothing repairs, retries, or
      // overrides it, and a changed candidate needs a new run.
      if (stage.id === 'pr-review') {
        const verdict = event.data.pr_review_verdict;
        if (verdict !== 'APPROVE' && verdict !== 'REQUEST_CHANGES' && verdict !== 'INCONCLUSIVE') corrupt(event, 'bad PR review verdict');
        const record = produced.pr_review;
        if (!record) corrupt(event, 'no PR review record');
        state.pr_review = { verdict, record };
        if (verdict !== 'APPROVE') {
          state.phase = 'BLOCKED';
          state.blocker = {
            code: verdict === 'REQUEST_CHANGES' ? 'PR_REVIEW_CHANGES_REQUESTED' : 'PR_REVIEW_INCONCLUSIVE',
            detail: `the PR review of the candidate returned ${verdict}; its findings and limitations are in the retained record ${record}`,
          };
          return state;
        }
      }
      enter(state, workflow, event, stage.next);
      return state;
    }
    case 'pr_review_packet_recorded': {
      // The packet is assembled only at its own stage, which follows an accepting
      // code review, for the candidate in force, from the journal up to this record.
      if (state.phase !== 'ACTIVE' || stage.id !== 'pr-review-packet') corrupt(event, 'no PR review packet allowed here');
      if (str(event, 'candidate', REF_PATTERN) !== state.subjects.candidate) corrupt(event, 'the packet is for another candidate');
      if (event.data.journal_cutoff !== state.version - 1) corrupt(event, 'the packet does not end at the record before it');
      state.subjects.pr_review_packet = str(event, 'packet_ref', REF_PATTERN);
      enter(state, workflow, event, stage.next);
      return state;
    }
    case 'verification_recorded': {
      if (state.phase !== 'ACTIVE' || stage.id !== 'verify') corrupt(event, 'no verification allowed here');
      if (str(event, 'candidate', REF_PATTERN) !== state.subjects.candidate) corrupt(event, 'verification is for another candidate');
      state.subjects.verification = str(event, 'verification_ref', REF_PATTERN);
      if (event.data.outcome === 'PASS') {
        enter(state, workflow, event, stage.next);
        return state;
      }
      if (event.data.outcome !== 'FAIL') corrupt(event, 'bad outcome');
      // The failed record goes back to the developer as evidence. Rounds are bounded.
      state.failed_verifications += 1;
      delete state.subjects.candidate;
      if (state.failed_verifications >= (state.max_attempts.developer ?? 1)) {
        state.phase = 'BLOCKED';
        state.blocker = { code: 'VERIFICATION_FAILED', detail: 'every permitted candidate failed verification' };
        return state;
      }
      enter(state, workflow, event, 'implement');
      return state;
    }
    case 'verification_invalidated': {
      // What the verification relied on has changed. It and every review that
      // relied on it are dropped and must be established again: the code
      // review, the PR review packet, and the PR review. None is carried forward.
      if (state.phase !== 'ACTIVE' || (stage.id !== 'proposal' && stage.id !== 'pr-review-packet')) corrupt(event, 'no invalidation allowed here');
      delete state.subjects.verification;
      delete state.subjects.review;
      delete state.subjects.pr_review_packet;
      delete state.subjects.pr_review;
      delete state.pr_review;
      enter(state, workflow, event, 'verify');
      return state;
    }
    case 'attempt_failed': {
      const attemptId = str(event, 'attempt_id', ID_PATTERN);
      const log = state.attempt_log[attemptId];
      if (!state.pending || state.pending.attempt_id !== attemptId || !log) corrupt(event, 'attempt is not pending');
      const kind = event.data.kind as FailureKind;
      if (!FAILURE_KINDS.includes(kind)) corrupt(event, 'bad kind');
      log.status = 'FAILED';
      log.digest = str(event, 'failure_digest', REF_PATTERN);
      str(event, 'failure_ref', REF_PATTERN);
      log.settled_version = event.seq;
      log.failure = kind;
      const role = state.pending.role;
      state.pending = null;
      state.entry_failures += 1;
      // An abandoned attempt may still have a live worker. Where attempts share a
      // writable target, a replacement must not start beside it: the run blocks.
      if (kind === 'EXECUTION_UNCERTAIN' && stage.shared_write_target) {
        state.phase = 'BLOCKED';
        state.blocker = {
          code: 'WORKER_QUIESCENCE_UNPROVEN',
          detail: `attempt ${attemptId} was abandoned while it may still be writing to a shared target; no replacement is dispatched`,
        };
        return state;
      }
      if (state.entry_failures >= (state.max_attempts[role] ?? 1)) {
        state.phase = 'BLOCKED';
        state.blocker = { code: 'ATTEMPTS_EXHAUSTED', detail: `stage ${stage.id} used every permitted attempt` };
      }
      return state;
    }
    case 'brief_rendered': {
      if (state.phase !== 'ACTIVE' || stage.id !== 'brief') corrupt(event, 'no brief allowed here');
      if (event.data.round !== state.round) corrupt(event, 'brief is for another round');
      state.subjects.brief = str(event, 'brief_ref', REF_PATTERN);
      enter(state, workflow, event, stage.next);
      return state;
    }
    case 'decision_recorded': {
      if (state.phase !== 'WAITING_HUMAN' || !stage.wait) corrupt(event, 'no human decision was awaited');
      const id = str(event, 'decision_id', ID_PATTERN);
      const action = event.data.action as DecisionAction;
      if (!DECISION_ACTIONS.includes(action)) corrupt(event, 'bad action');
      if (!allowedActions(workflow, stage.wait, state.round, state.audit_budget.used).includes(action)) {
        corrupt(event, `action "${action}" is not allowed here`);
      }
      if (state.decisions[id]) corrupt(event, 'decision id reused');
      const provenance = event.data.provenance as DecisionProvenance;
      if (provenance !== 'SCRIPTED' && provenance !== 'HUMAN_RECORDED' && provenance !== 'UNKNOWN') corrupt(event, 'bad provenance');
      // Outside a simulated run only a decision recorded as a human's counts.
      if (state.transport_class !== 'SIMULATED' && provenance !== 'HUMAN_RECORDED') {
        corrupt(event, `a ${provenance} decision cannot stand in a run that is not simulated`);
      }
      const decisionRef = str(event, 'decision_ref', REF_PATTERN);
      state.decisions[id] = { digest: str(event, 'decision_digest', REF_PATTERN), action, recorded_version: event.seq, decision_ref: decisionRef, provenance };
      switch (action) {
        case 'answer':
          state.subjects.answers = decisionRef;
          state.question_rounds += 1;
          enter(state, workflow, event, stage.next);
          return state;
        case 'proceed':
        case 'amend': {
          const plan = state.subjects.plan;
          const audit = state.subjects.audit;
          const brief = state.subjects.brief;
          if (!plan || !audit || !brief) corrupt(event, 'no audited plan to authorize');
          const status: PlanStatus = action === 'amend' ? 'AMENDED_NOT_REAUDITED' : 'AS_AUDITED';
          if (event.data.plan_status !== status) corrupt(event, 'plan status does not match the action');
          const finalPlan = str(event, 'final_plan_ref', REF_PATTERN);
          state.planning = {
            status: 'AUTHORIZED',
            plan_status: status,
            final_plan: finalPlan,
            last_audited_plan: plan,
            audit,
            audit_round: state.round,
            brief,
            decision_id: id,
            decision_ref: decisionRef,
            decision_provenance: provenance,
          };
          state.subjects.final_plan = finalPlan;
          enter(state, workflow, event, stage.next);
          return state;
        }
        case 'second-audit': {
          const plan = state.subjects.plan;
          const audit = state.subjects.audit;
          if (!plan || !audit) corrupt(event, 'no audited plan to revise');
          state.round += 1;
          state.subjects.prior_plan = plan;
          state.subjects.prior_audit = audit;
          delete state.subjects.plan;
          delete state.subjects.audit;
          delete state.subjects.brief;
          enter(state, workflow, event, 'plan-revision');
          return state;
        }
        case 'pause':
          state.paused = true;
          return state;
        case 'reject':
          state.phase = 'DONE';
          state.terminal = 'REJECTED';
          state.paused = false;
          return state;
      }
      return corrupt(event, 'unhandled action');
    }
    case 'proposal_recorded': {
      if (state.phase !== 'ACTIVE' || stage.id !== 'proposal') corrupt(event, 'no proposal allowed here');
      // Where the workflow has a PR review, a proposal follows its approval of the
      // packet in force, and nothing else.
      if (stage.id === 'proposal' && stageOf(workflow, 'pr-review') && (state.pr_review?.verdict !== 'APPROVE' || !state.subjects.pr_review_packet || state.pr_review.record !== state.subjects.pr_review)) {
        corrupt(event, 'no approving PR review of the current packet');
      }
      state.proposal = { proposal_ref: str(event, 'proposal_ref', REF_PATTERN), location: str(event, 'location') };
      state.phase = 'DONE';
      state.terminal = 'PR_PROPOSAL_READY';
      return state;
    }
    default:
      return corrupt(event, 'unknown event type');
  }
}

export function replay(events: JournalEvent[], workflow: WorkflowDef): RunState | null {
  let state: RunState | null = null;
  for (const event of events) state = applyEvent(state, event, workflow);
  return state;
}
