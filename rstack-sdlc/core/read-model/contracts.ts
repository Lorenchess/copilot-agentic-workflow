// The dashboard read model: a versioned, read-only projection of one run,
// built from its committed journal and the records it retained. Nothing in
// this file is an engine authority; the engine's state replay is. A field
// that the evidence does not establish is null or carries an explicit
// "not observed" value, never a guess.

export const DASHBOARD_SCHEMA_VERSION = 1;

// How the run's records could be read. Only CURRENT and INCOMPLETE_TAIL carry
// a replayed state; the others carry a diagnostic and no engine state.
export const SOURCE_STATUSES = ['CURRENT', 'INCOMPLETE_TAIL', 'CORRUPT', 'UNSUPPORTED_WORKFLOW', 'NOT_INITIALIZED', 'UNREADABLE'] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

// What a stage of the retained definition looks like from the committed events.
export const STAGE_STATES = [
  'NOT_REACHED',
  'NOT_TAKEN',
  'CURRENT_IDLE',
  'DISPATCHED_AWAITING_RESULT',
  'WAITING_HUMAN',
  'COMPLETED',
  'FAILED_ATTEMPT',
  'INVALIDATED',
  'BLOCKED',
  'DONE_TERMINAL',
] as const;
export type StageState = (typeof STAGE_STATES)[number];

export const FINAL_OUTCOMES = ['IN_PROGRESS', 'WAITING_HUMAN', 'LOCAL_PR_PROPOSAL_PREPARED', 'REJECTED', 'BLOCKED', 'UNREADABLE'] as const;
export type FinalOutcome = (typeof FINAL_OUTCOMES)[number];

export const EXECUTION_PROFILE_LABELS = ['STANDARD', 'UNKNOWN'] as const;

export interface StageNode {
  stage_id: string;
  kind: 'role' | 'human' | 'deterministic';
  role: string | null;
  mode: string | null;
  // The human-readable label and the stage this one normally leads to.
  label: string;
  next: string | null;
  // True for a stage that the main path never enters by itself (a branch).
  branch: boolean;
  wait: 'PRODUCT_QUESTION' | 'PLAN_DECISION' | null;
  state: StageState;
  attempt_ids: string[];
  accepted_attempt: string | null;
  // Commit times of the first dispatch into the stage and of the accepted
  // result or deterministic record, where the journal holds them.
  entered_at: string | null;
  completed_at: string | null;
  // Identities of the records the stage produced and that are still current.
  produced: Record<string, string>;
}

export interface ConfiguredModel {
  alias: string;
  owner_label: string;
  family: string;
  selector_status: string;
  host_selector: string | null;
}

export interface AttemptView {
  attempt_id: string;
  stage_id: string;
  role: string;
  number: number;
  status: 'PENDING' | 'ACCEPTED' | 'FAILED';
  dispatched_version: number;
  dispatched_at: string;
  settled_version: number | null;
  settled_at: string | null;
  outcome: 'COMPLETED' | 'NEGATIVE' | null;
  failure_kind: string | null;
  failure_detail: string | null;
  result_ref: string | null;
  failure_ref: string | null;
  input_digest: string;
  inputs: Record<string, string>;
  produced: Record<string, string>;
  // A later accepted result for the same stage replaced this one.
  superseded: boolean;
  configured_model: ConfiguredModel | null;
  effective_model: 'NOT_OBSERVED';
}

export const TIMELINE_CATEGORIES = ['start', 'dispatch', 'result', 'failure', 'human', 'verification', 'review', 'proposal', 'deterministic'] as const;
export type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number];

export interface TimelineEntry {
  seq: number;
  at: string;
  type: string;
  category: TimelineCategory;
  stage_id: string | null;
  attempt_id: string | null;
  summary: string;
  refs: Record<string, string>;
  // Phase and stage after this event was applied.
  phase_after: string;
  stage_after: string;
}

export interface EvidenceEntry {
  key: string;
  ref: string;
  // Which stage or event produced it, and whether the run still relies on it.
  produced_by: string;
  seq: number;
  current: boolean;
  // Known record kind by key, for display and for choosing a safe viewer.
  kind: 'markdown' | 'json' | 'html' | 'tree' | 'text' | 'unknown';
  available: boolean;
}

export interface DecisionView {
  decision_id: string;
  action: string;
  recorded_version: number;
  at: string;
  recorded_by: string;
  provenance: string;
  plan_status: string | null;
  decision_ref: string;
  subjects: Record<string, string>;
}

export interface HumanAction {
  required: boolean;
  awaiting: 'PRODUCT_QUESTION' | 'PLAN_DECISION' | null;
  stage_id: string | null;
  round: number;
  paused: boolean;
  reason: string;
  allowed_actions: string[];
  expected_version: number | null;
  // The file the engine tells the human to read, relative to the run directory.
  read: string | null;
  subjects: Record<string, string>;
  // Summary of the retained audit of the round, when the record was readable.
  audit: { verdict: string; findings: number; unchecked: number; blocking: number } | null;
  // The intent's open decisions text, for a product question, when readable.
  open_decisions: string | null;
  waiting_since: string | null;
  last_decision: DecisionView | null;
  // The last decision the engine recorded, as its source identity claim.
  decision_state: 'AWAITING' | 'PAUSED' | 'RECORDED' | 'NONE';
}

export interface CurrentActivity {
  stage_id: string | null;
  kind: 'role' | 'human' | 'deterministic' | null;
  role: string | null;
  mode: string | null;
  attempt_id: string | null;
  // DISPATCHED_AWAITING_RESULT: an attempt is pending; nothing shows that a
  // model is executing. NONE: no attempt is open at this stage.
  dispatch_status: 'DISPATCHED_AWAITING_RESULT' | 'NONE';
  dispatched_at: string | null;
  retry: { used: number; budget: number | null };
  configured_model: ConfiguredModel | null;
  effective_model: 'NOT_OBSERVED';
  inputs: Record<string, string>;
  last_update_at: string | null;
  last_update_version: number;
}

export interface ExecutionSummary {
  ref: string;
  purpose: string;
  outcome: string;
  issues: string[];
  exit_code: number | null;
  timed_out: boolean;
  duration_ms: number;
  tests: { name: string; kind: string; status: string; failure_kind: string | null }[];
  seq: number;
  at: string;
  candidate: string | null;
}

export interface ReviewSummary {
  stage_id: string;
  attempt_id: string;
  record: string;
  verdict: string;
  findings: { id: string; classification: string; target: string; evidence: string | null; consequence: string | null; resolution: string | null }[];
  checked: number;
  unchecked: number;
  limitations: string[];
  round: number | null;
  at: string;
  current: boolean;
}

export interface RunView {
  schema_version: typeof DASHBOARD_SCHEMA_VERSION;
  record_type: 'dashboard-run-view';
  run_id: string;
  source_status: SourceStatus;
  diagnostic: { code: string | null; message: string | null; record: number | null; incomplete_tail_bytes: number };
  // Number of committed, validated events; equals the engine state version.
  journal_version: number;
  started_at: string | null;
  last_committed_at: string | null;
  request: { request_id: string | null; title: string | null; outcome: string | null; locator: string | null; adapter: string | null; captured_at: string | null; source_ref: string | null };
  application: { label: string | null; label_source: 'retained-package-json' | 'NONE'; base_ref: string | null; app_config_ref: string | null };
  workflow: { id: string | null; version: number | null; ref: string | null; execution_profile: (typeof EXECUTION_PROFILE_LABELS)[number]; stages: number };
  profile: { id: string | null; version: number | null; ref: string | null; host: string | null };
  transport_class: string | null;
  engine: {
    phase: string | null;
    stage: string | null;
    directive: 'CONTINUE' | 'WAIT' | 'DONE' | 'BLOCKED' | null;
    paused: boolean;
    round: number;
    question_rounds: number;
    audit_budget: { max: number; used: number } | null;
    terminal: string | null;
    blocker: { code: string; detail: string } | null;
    publication_status: 'NOT_ATTEMPTED' | null;
    failed_verifications: number;
  };
  final_outcome: FinalOutcome;
  stage_graph: StageNode[];
  current_activity: CurrentActivity;
  human_action: HumanAction;
  attempts: AttemptView[];
  decisions: DecisionView[];
  timeline: TimelineEntry[];
  evidence: EvidenceEntry[];
  executions: ExecutionSummary[];
  reviews: ReviewSummary[];
  proposal: { proposal_ref: string; location: string; status: 'LOCAL_PR_PROPOSAL_PREPARED'; publication_status: 'NOT_ATTEMPTED'; title: string | null } | null;
  // Problems a reader should see: blockers, failed attempts, failed
  // verifications, invalidations, unreadable records.
  problems: { kind: string; seq: number | null; at: string | null; summary: string }[];
  // Observations the run does not support, said plainly.
  not_observed: string[];
  lock: { held: boolean; pid: number | null; host: string | null; acquired_at: string | null; readable: boolean };
  // Identity of this view without `view_digest`, over canonical JSON.
  view_digest: string;
}

export interface RunSummary {
  run_id: string;
  request_id: string | null;
  request_title: string | null;
  application_label: string | null;
  workflow: { id: string | null; version: number | null; execution_profile: (typeof EXECUTION_PROFILE_LABELS)[number] };
  source_status: SourceStatus;
  phase: string | null;
  stage: string | null;
  final_outcome: FinalOutcome;
  needs_human: boolean;
  dispatch_status: CurrentActivity['dispatch_status'];
  started_at: string | null;
  last_committed_at: string | null;
  journal_version: number;
  view_digest: string;
}

// Stage labels for the known definition; an unknown stage id is shown as given.
export const STAGE_LABELS: Record<string, string> = {
  intent: 'Intake',
  'product-question': 'Product question',
  spec: 'Specification',
  plan: 'Planning',
  'plan-revision': 'Plan revision',
  'plan-audit': 'Plan audit',
  brief: 'Brief',
  'plan-decision': 'Human decision',
  proof: 'Tester proof',
  implement: 'Developer',
  verify: 'Verification',
  review: 'Technical review',
  'pr-review-packet': 'PR review packet',
  'pr-review': 'PR review',
  proposal: 'Proposal',
};

export const ROLE_LABELS: Record<string, string> = {
  planner: 'Planner',
  'plan-auditor': 'Plan Auditor',
  tester: 'Tester',
  developer: 'Developer',
  reviewer: 'Code Reviewer',
  'pr-reviewer': 'PR Reviewer',
};
