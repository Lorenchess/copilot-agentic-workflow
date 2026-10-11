// The pure projector: committed events, the retained workflow definition,
// and the retained records a run names, in; one versioned RunView out. It
// replays with the engine's own state transitions and the definition the run
// was started under. It writes nothing, takes no lock, and never invents an
// observation: what the evidence does not establish is null or "not observed".

import { type JournalEvent, canonicalJson, sha256Hex } from '../contracts/records.ts';
import { parseIntent } from '../contracts/planning.ts';
import { EngineBlock } from '../engine/errors.ts';
import { type RunState, applyEvent } from '../engine/state.ts';
import { type StageDef, type WorkflowDef, allowedActions, decisionSubjectKeys, stageOf } from '../policies/workflow.ts';
import {
  type AttemptView,
  type ConfiguredModel,
  type CurrentActivity,
  type DecisionView,
  type EvidenceEntry,
  type ExecutionSummary,
  type FinalOutcome,
  type HumanAction,
  type ReviewSummary,
  type RunSummary,
  type RunView,
  type SourceStatus,
  type StageNode,
  type StageState,
  type TimelineCategory,
  type TimelineEntry,
  DASHBOARD_SCHEMA_VERSION,
  ROLE_LABELS,
  STAGE_LABELS,
} from './contracts.ts';
import { mainPath } from './workflow-def.ts';

export interface SourceFailure {
  status: Exclude<SourceStatus, 'CURRENT' | 'INCOMPLETE_TAIL'>;
  code: string | null;
  message: string | null;
  record: number | null;
}

export interface ProjectionInput {
  run_id: string;
  // Validated, complete journal records in order. Empty when the source failed.
  events: JournalEvent[];
  incomplete_tail_bytes: number;
  // Why no state can be shown, or null when the events can be replayed.
  failure: SourceFailure | null;
  // The definition the run was started under, as retained; null on failure.
  workflow: WorkflowDef | null;
  // Retained records by identity, each already checked against its identity.
  records: Map<string, string>;
  lock: RunView['lock'];
}

const NOT_OBSERVED = [
  'Effective host model of any attempt: the run records none.',
  'Model execution start and end: only engine commit times are recorded; a dispatched attempt is not evidence that a model is executing.',
  'Tokens, cost, and usage: the run records none.',
  'Whether a worker is still running a pending attempt.',
];

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const refMap = (v: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) if (typeof val === 'string') out[k] = val;
  }
  return out;
};
const clip = (text: string, max = 240): string => (text.length > max ? `${text.slice(0, max)}…` : text);

function json(records: Map<string, string>, ref: string | null | undefined): Record<string, unknown> | null {
  if (!ref) return null;
  const text = records.get(ref);
  if (text === undefined) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const EVIDENCE_KIND: Record<string, EvidenceEntry['kind']> = {
  source: 'text',
  intent: 'markdown',
  spec: 'markdown',
  plan: 'json',
  prior_plan: 'json',
  audit: 'json',
  prior_audit: 'json',
  dispositions: 'json',
  brief: 'html',
  answers: 'json',
  final_plan: 'json',
  proof: 'json',
  proof_baseline: 'json',
  verification: 'json',
  review: 'json',
  pr_review_packet: 'json',
  pr_review: 'json',
  pr_review_procedure: 'text',
  base: 'tree',
  proof_tree: 'tree',
  candidate: 'tree',
  app_config: 'json',
  profile: 'json',
  workflow: 'json',
  proposal: 'json',
};

function emptyActivity(): CurrentActivity {
  return {
    stage_id: null,
    kind: null,
    role: null,
    mode: null,
    attempt_id: null,
    dispatch_status: 'NONE',
    dispatched_at: null,
    retry: { used: 0, budget: null },
    configured_model: null,
    effective_model: 'NOT_OBSERVED',
    inputs: {},
    last_update_at: null,
    last_update_version: 0,
  };
}

function emptyHuman(): HumanAction {
  return {
    required: false,
    awaiting: null,
    stage_id: null,
    round: 0,
    paused: false,
    reason: '',
    allowed_actions: [],
    expected_version: null,
    read: null,
    subjects: {},
    audit: null,
    open_decisions: null,
    waiting_since: null,
    last_decision: null,
    decision_state: 'NONE',
  };
}

function withDigest(view: Omit<RunView, 'view_digest'>): RunView {
  const digest = `sha256:${sha256Hex(canonicalJson({ ...view, view_digest: null }))}`;
  return { ...view, view_digest: digest };
}

function failedView(input: ProjectionInput, failure: SourceFailure): RunView {
  const first = input.events[0];
  const data = first?.type === 'run_started' ? first.data : {};
  return withDigest({
    schema_version: DASHBOARD_SCHEMA_VERSION,
    record_type: 'dashboard-run-view',
    run_id: input.run_id,
    source_status: failure.status,
    diagnostic: { code: failure.code, message: failure.message, record: failure.record, incomplete_tail_bytes: input.incomplete_tail_bytes },
    journal_version: 0,
    started_at: first?.at ?? null,
    last_committed_at: null,
    request: { request_id: str(data.request_id), title: null, outcome: null, locator: null, adapter: null, captured_at: null, source_ref: str(data.source_ref) },
    application: { label: null, label_source: 'NONE', base_ref: str(data.base_ref), app_config_ref: str(data.app_config_ref) },
    workflow: { id: null, version: null, ref: str(data.workflow_ref), execution_profile: 'UNKNOWN', stages: 0 },
    profile: { id: str(data.profile_id), version: num(data.profile_version), ref: str(data.profile_ref), host: null },
    transport_class: str(data.transport_class),
    engine: { phase: null, stage: null, directive: null, paused: false, round: 0, question_rounds: 0, audit_budget: null, terminal: null, blocker: null, publication_status: null, failed_verifications: 0 },
    final_outcome: 'UNREADABLE',
    stage_graph: input.workflow ? input.workflow.stages.map((s) => emptyNode(s, mainPath(input.workflow as WorkflowDef))) : [],
    current_activity: emptyActivity(),
    human_action: emptyHuman(),
    attempts: [],
    decisions: [],
    timeline: [],
    evidence: [],
    executions: [],
    reviews: [],
    proposal: null,
    problems: [{ kind: failure.status, seq: failure.record, at: null, summary: failure.message ?? failure.status }],
    not_observed: NOT_OBSERVED,
    lock: input.lock,
  });
}

function emptyNode(s: StageDef, main: string[]): StageNode {
  return {
    stage_id: s.id,
    kind: s.kind,
    role: s.role ?? null,
    mode: s.mode ?? null,
    label: STAGE_LABELS[s.id] ?? s.id,
    next: s.next,
    branch: !main.includes(s.id),
    wait: s.wait ?? null,
    state: 'NOT_REACHED',
    attempt_ids: [],
    accepted_attempt: null,
    entered_at: null,
    completed_at: null,
    produced: {},
  };
}

interface Fold {
  states: RunState[];
  lastOutcome: Map<string, 'ACCEPTED' | 'FAILED' | 'INVALIDATED' | 'PASS' | 'FAIL' | 'PAUSED'>;
  enteredAt: Map<string, string>;
  completedAt: Map<string, string>;
  attemptSeq: Map<string, { dispatched: JournalEvent; round: number; settled: JournalEvent | null }>;
  evidence: EvidenceEntry[];
  error: EngineBlock | null;
}

function fold(events: JournalEvent[], workflow: WorkflowDef): Fold {
  const f: Fold = { states: [], lastOutcome: new Map(), enteredAt: new Map(), completedAt: new Map(), attemptSeq: new Map(), evidence: [], error: null };
  let state: RunState | null = null;
  const seen = new Set<string>();
  const addEvidence = (key: string, ref: string, producedBy: string, seq: number): void => {
    const id = `${key}:${ref}`;
    if (seen.has(id)) return;
    seen.add(id);
    f.evidence.push({ key, ref, produced_by: producedBy, seq, current: false, kind: EVIDENCE_KIND[key] ?? 'unknown', available: false });
  };
  for (const event of events) {
    const before = state;
    try {
      state = applyEvent(state, event, workflow);
    } catch (e) {
      if (e instanceof EngineBlock) {
        f.error = e;
        break;
      }
      throw e;
    }
    f.states.push(state);
    const d = event.data;
    if (!before || before.stage !== state.stage) {
      if (!f.enteredAt.has(state.stage) || (before && before.stage !== state.stage)) f.enteredAt.set(state.stage, event.at);
    }
    switch (event.type) {
      case 'run_started':
        for (const key of ['source_ref', 'profile_ref', 'workflow_ref', 'base_ref', 'app_config_ref', 'pr_review_procedure_ref']) {
          const ref = str(d[key]);
          if (ref) addEvidence(key.replace(/_ref$/, ''), ref, 'run_started', event.seq);
        }
        break;
      case 'task_dispatched': {
        const id = str(d.attempt_id) ?? '';
        f.attemptSeq.set(id, { dispatched: event, round: before?.round ?? 1, settled: null });
        break;
      }
      case 'result_accepted': {
        const id = str(d.attempt_id) ?? '';
        const entry = f.attemptSeq.get(id);
        if (entry) entry.settled = event;
        const stageId = before?.stage ?? state.stage;
        f.lastOutcome.set(stageId, 'ACCEPTED');
        f.completedAt.set(stageId, event.at);
        for (const [key, ref] of Object.entries(refMap(d.subjects))) addEvidence(key, ref, id, event.seq);
        const resultRef = str(d.result_ref);
        if (resultRef) addEvidence(`result:${id}`, resultRef, id, event.seq);
        break;
      }
      case 'attempt_failed': {
        const id = str(d.attempt_id) ?? '';
        const entry = f.attemptSeq.get(id);
        if (entry) entry.settled = event;
        f.lastOutcome.set(before?.stage ?? state.stage, 'FAILED');
        const ref = str(d.failure_ref);
        if (ref) addEvidence(`failure:${id}`, ref, id, event.seq);
        break;
      }
      case 'brief_rendered': {
        f.lastOutcome.set('brief', 'ACCEPTED');
        f.completedAt.set('brief', event.at);
        const ref = str(d.brief_ref);
        if (ref) addEvidence('brief', ref, 'brief', event.seq);
        break;
      }
      case 'decision_recorded': {
        const stageId = before?.stage ?? state.stage;
        const action = str(d.action);
        f.lastOutcome.set(stageId, action === 'pause' ? 'PAUSED' : 'ACCEPTED');
        if (action !== 'pause') f.completedAt.set(stageId, event.at);
        const ref = str(d.decision_ref);
        if (ref) addEvidence(`decision:${str(d.decision_id) ?? ''}`, ref, stageId, event.seq);
        const finalPlan = str(d.final_plan_ref);
        if (finalPlan) addEvidence('final_plan', finalPlan, stageId, event.seq);
        break;
      }
      case 'verification_recorded': {
        const outcome = d.outcome === 'PASS' ? 'PASS' : 'FAIL';
        f.lastOutcome.set('verify', outcome);
        if (outcome === 'PASS') f.completedAt.set('verify', event.at);
        const ref = str(d.verification_ref);
        if (ref) addEvidence('verification', ref, 'verify', event.seq);
        break;
      }
      case 'verification_invalidated':
        for (const id of ['verify', 'review', 'pr-review-packet', 'pr-review']) if (f.lastOutcome.has(id)) f.lastOutcome.set(id, 'INVALIDATED');
        break;
      case 'pr_review_packet_recorded': {
        f.lastOutcome.set('pr-review-packet', 'ACCEPTED');
        f.completedAt.set('pr-review-packet', event.at);
        const ref = str(d.packet_ref);
        if (ref) addEvidence('pr_review_packet', ref, 'pr-review-packet', event.seq);
        break;
      }
      case 'proposal_recorded': {
        f.lastOutcome.set('proposal', 'ACCEPTED');
        f.completedAt.set('proposal', event.at);
        const ref = str(d.proposal_ref);
        if (ref) addEvidence('proposal', ref, 'proposal', event.seq);
        break;
      }
      default:
        break;
    }
  }
  return f;
}

function timelineEntry(event: JournalEvent, after: RunState): TimelineEntry {
  const d = event.data;
  let category: TimelineCategory = 'deterministic';
  let summary: string = event.type;
  let stageId: string | null = null;
  let attemptId: string | null = null;
  const refs: Record<string, string> = {};
  for (const [k, v] of Object.entries(d)) if (typeof v === 'string' && /^sha256:[0-9a-f]{64}$/.test(v)) refs[k] = v;
  switch (event.type) {
    case 'run_started':
      category = 'start';
      summary = `Run started for request ${str(d.request_id) ?? '?'}; role results are ${str(d.transport_class) ?? 'of unknown class'}.`;
      stageId = after.stage;
      break;
    case 'task_dispatched':
      category = 'dispatch';
      stageId = str(d.step_id);
      attemptId = str(d.attempt_id);
      summary = `Dispatched ${ROLE_LABELS[str(d.role) ?? ''] ?? str(d.role) ?? 'role'} for ${STAGE_LABELS[stageId ?? ''] ?? stageId} (attempt ${attemptId}); awaiting its result.`;
      break;
    case 'result_accepted': {
      category = 'result';
      attemptId = str(d.attempt_id);
      stageId = attemptId ? attemptId.slice(0, attemptId.lastIndexOf('-')) : null;
      const verdict = str(d.review_verdict) ?? str(d.pr_review_verdict);
      summary = `Accepted ${attemptId}: ${str(d.outcome) ?? '?'}${verdict ? `, verdict ${verdict}` : ''}${d.open_decisions === true ? '; the intent leaves product decisions open' : ''}.`;
      if (stageId === 'review' || stageId === 'pr-review' || stageId === 'plan-audit') category = 'review';
      break;
    }
    case 'attempt_failed':
      category = 'failure';
      attemptId = str(d.attempt_id);
      stageId = attemptId ? attemptId.slice(0, attemptId.lastIndexOf('-')) : null;
      summary = `Attempt ${attemptId} failed: ${str(d.kind) ?? '?'}${str(d.detail) ? ` (${clip(str(d.detail) as string, 160)})` : ''}.`;
      break;
    case 'brief_rendered':
      stageId = 'brief';
      summary = `Brief for round ${num(d.round) ?? '?'} rendered at ${str(d.location) ?? '?'}; a human decision is now awaited.`;
      break;
    case 'decision_recorded':
      category = 'human';
      summary = `Decision ${str(d.decision_id) ?? '?'}: ${str(d.action) ?? '?'} (${str(d.provenance) ?? 'UNKNOWN'}, recorded by ${clip(str(d.recorded_by) ?? '?', 80)}).`;
      break;
    case 'verification_recorded':
      category = 'verification';
      stageId = 'verify';
      summary = `Candidate verification by the engine: ${str(d.outcome) ?? '?'}.`;
      break;
    case 'verification_invalidated':
      category = 'verification';
      stageId = 'verify';
      summary = `Verification invalidated: ${str(d.reason) ?? '?'}; verification and the reviews that relied on it are established again.`;
      break;
    case 'pr_review_packet_recorded':
      stageId = 'pr-review-packet';
      summary = `PR review packet assembled from the journal up to record ${num(d.journal_cutoff) ?? '?'}.`;
      break;
    case 'proposal_recorded':
      category = 'proposal';
      stageId = 'proposal';
      summary = `Local proposal recorded at ${str(d.location) ?? '?'}; publication NOT_ATTEMPTED.`;
      break;
    default:
      break;
  }
  return { seq: event.seq, at: event.at, type: event.type, category, stage_id: stageId, attempt_id: attemptId, summary, refs, phase_after: after.phase, stage_after: after.stage };
}

function configuredModel(profile: Record<string, unknown> | null, role: string | null): ConfiguredModel | null {
  if (!profile || !role) return null;
  const roles = profile.roles as Record<string, Record<string, unknown>> | undefined;
  const alias = str(roles?.[role]?.model_alias);
  if (!alias) return null;
  const catalog = profile.catalog as Record<string, Record<string, unknown>> | undefined;
  const entry = catalog?.[alias];
  return {
    alias,
    owner_label: str(entry?.owner_label) ?? alias,
    family: str(entry?.family) ?? 'unknown',
    selector_status: str(entry?.selector_status) ?? 'unknown',
    host_selector: str(entry?.host_selector),
  };
}

function reviewSummary(record: Record<string, unknown> | null, stageId: string, attemptId: string, ref: string, round: number | null, at: string, current: boolean, fallbackVerdict: string | null): ReviewSummary {
  const findings = Array.isArray(record?.findings) ? (record?.findings as Record<string, unknown>[]) : [];
  const coverage = Array.isArray(record?.coverage) ? (record?.coverage as Record<string, unknown>[]) : [];
  const limitations = Array.isArray(record?.limitations) ? (record?.limitations as unknown[]).filter((l): l is string => typeof l === 'string') : [];
  return {
    stage_id: stageId,
    attempt_id: attemptId,
    record: ref,
    verdict: str(record?.verdict) ?? fallbackVerdict ?? 'UNREADABLE',
    findings: findings.map((f) => ({ id: str(f.id) ?? '?', classification: str(f.classification) ?? '?', target: str(f.target) ?? '', evidence: str(f.evidence), consequence: str(f.consequence), resolution: str(f.resolution) })),
    checked: coverage.filter((c) => c.status === 'CHECKED').length,
    unchecked: coverage.filter((c) => c.status === 'NOT_CHECKED').length,
    limitations,
    round,
    at,
    current,
  };
}

function executionSummary(record: Record<string, unknown>, ref: string, seq: number, at: string, candidate: string | null): ExecutionSummary {
  const classification = (record.classification ?? {}) as Record<string, unknown>;
  const tests = Array.isArray(record.tests) ? (record.tests as Record<string, unknown>[]) : [];
  return {
    ref,
    purpose: str(record.purpose) ?? '?',
    outcome: str(classification.outcome) ?? '?',
    issues: Array.isArray(classification.issues) ? (classification.issues as unknown[]).filter((i): i is string => typeof i === 'string') : [],
    exit_code: num(record.exit_code),
    timed_out: record.timed_out === true,
    duration_ms: num(record.duration_ms) ?? 0,
    tests: tests.map((t) => ({ name: str(t.name) ?? '?', kind: str(t.kind) ?? '?', status: str(t.status) ?? '?', failure_kind: str(t.failure_kind) })),
    seq,
    at,
    candidate,
  };
}

export function projectRun(input: ProjectionInput): RunView {
  if (input.failure) return failedView(input, input.failure);
  const workflow = input.workflow;
  const first = input.events[0];
  if (!workflow || !first || first.type !== 'run_started') {
    return failedView(input, { status: 'NOT_INITIALIZED', code: 'RUN_NOT_INITIALIZED', message: 'the run has no committed start record', record: null });
  }
  const f = fold(input.events, workflow);
  if (f.error) {
    return failedView(input, { status: 'CORRUPT', code: f.error.code, message: f.error.message, record: num(f.error.detail.record) });
  }
  const state = f.states[f.states.length - 1] as RunState;
  const events = input.events;
  const last = events[events.length - 1] as JournalEvent;
  const started = first.data;
  const records = input.records;
  const main = mainPath(workflow);
  const profile = json(records, state.profile_ref);
  const currentStage = stageOf(workflow, state.stage);

  // Current subjects decide what is current evidence; everything else is history.
  const currentRefs = new Set(Object.values(state.subjects));
  if (state.proposal) currentRefs.add(state.proposal.proposal_ref);
  for (const e of f.evidence) e.current = currentRefs.has(e.ref) || e.key === 'source' || e.key === 'profile' || e.key === 'workflow' || e.key === 'app_config' || e.key === 'base' || e.key.startsWith('decision:');

  // Attempts.
  const attempts: AttemptView[] = [];
  for (const [attemptId, log] of Object.entries(state.attempt_log)) {
    const seq = f.attemptSeq.get(attemptId);
    if (!seq) continue;
    const d = seq.dispatched.data;
    const settled = seq.settled;
    const sd = settled?.data ?? {};
    const produced = settled?.type === 'result_accepted' ? refMap(sd.subjects) : {};
    const keys = Object.keys(produced);
    const superseded = log.status === 'ACCEPTED' && keys.length > 0 && keys.every((k) => state.subjects[k] !== produced[k]);
    const role = str(d.role) ?? log.step_id;
    attempts.push({
      attempt_id: attemptId,
      stage_id: log.step_id,
      role,
      number: Number(attemptId.slice(attemptId.lastIndexOf('-') + 1)) || 0,
      status: log.status,
      dispatched_version: seq.dispatched.seq,
      dispatched_at: seq.dispatched.at,
      settled_version: log.settled_version,
      settled_at: settled?.at ?? null,
      outcome: settled?.type === 'result_accepted' ? ((str(sd.outcome) as 'COMPLETED' | 'NEGATIVE' | null) ?? null) : null,
      failure_kind: log.failure,
      failure_detail: settled?.type === 'attempt_failed' ? str(sd.detail) : null,
      result_ref: settled?.type === 'result_accepted' ? str(sd.result_ref) : null,
      failure_ref: settled?.type === 'attempt_failed' ? str(sd.failure_ref) : null,
      input_digest: str(d.input_digest) ?? '',
      inputs: refMap(d.inputs),
      produced,
      superseded,
      configured_model: configuredModel(profile, role),
      effective_model: 'NOT_OBSERVED',
    });
  }
  attempts.sort((a, b) => a.dispatched_version - b.dispatched_version);

  // Stage graph.
  const nodes: StageNode[] = workflow.stages.map((s) => {
    const node = emptyNode(s, main);
    node.attempt_ids = attempts.filter((a) => a.stage_id === s.id).map((a) => a.attempt_id);
    node.accepted_attempt = state.accepted[s.id]?.attempt_id ?? null;
    node.entered_at = f.enteredAt.get(s.id) ?? (node.attempt_ids.length > 0 ? (attempts.find((a) => a.stage_id === s.id) as AttemptView).dispatched_at : null);
    node.completed_at = f.completedAt.get(s.id) ?? null;
    for (const key of [...(s.produces ?? []).map((p) => p.key), ...(s.derives ?? [])]) {
      const ref = state.subjects[key];
      if (ref) node.produced[key] = ref;
    }
    const outcome = f.lastOutcome.get(s.id);
    let st: StageState;
    if (s.id === state.stage) {
      switch (state.phase) {
        case 'BLOCKED':
          st = 'BLOCKED';
          break;
        case 'DONE':
          st = 'DONE_TERMINAL';
          break;
        case 'WAITING_HUMAN':
          st = 'WAITING_HUMAN';
          break;
        default:
          st = state.pending ? 'DISPATCHED_AWAITING_RESULT' : outcome === 'FAILED' && state.entry_failures > 0 ? 'FAILED_ATTEMPT' : 'CURRENT_IDLE';
      }
    } else if (outcome === undefined) {
      st = node.branch ? 'NOT_TAKEN' : 'NOT_REACHED';
    } else if (outcome === 'ACCEPTED' || outcome === 'PASS') {
      st = s.id === 'proposal' && state.proposal ? 'DONE_TERMINAL' : 'COMPLETED';
    } else if (outcome === 'INVALIDATED') {
      st = 'INVALIDATED';
    } else if (outcome === 'PAUSED') {
      st = 'COMPLETED';
    } else {
      st = 'FAILED_ATTEMPT';
    }
    node.state = st;
    return node;
  });

  // Current activity.
  const pending = state.pending;
  const activity: CurrentActivity = {
    stage_id: state.stage,
    kind: currentStage?.kind ?? null,
    role: currentStage?.role ?? null,
    mode: currentStage?.mode ?? null,
    attempt_id: pending?.attempt_id ?? null,
    dispatch_status: pending ? 'DISPATCHED_AWAITING_RESULT' : 'NONE',
    dispatched_at: pending ? (f.attemptSeq.get(pending.attempt_id)?.dispatched.at ?? null) : null,
    retry: { used: state.entry_failures, budget: currentStage?.role ? (state.max_attempts[currentStage.role] ?? null) : null },
    configured_model: configuredModel(profile, currentStage?.role ?? null),
    effective_model: 'NOT_OBSERVED',
    inputs: pending?.inputs ?? {},
    last_update_at: last.at,
    last_update_version: state.version,
  };

  // Decisions.
  const decisions: DecisionView[] = events
    .filter((e) => e.type === 'decision_recorded')
    .map((e) => ({
      decision_id: str(e.data.decision_id) ?? '?',
      action: str(e.data.action) ?? '?',
      recorded_version: e.seq,
      at: e.at,
      recorded_by: str(e.data.recorded_by) ?? '',
      provenance: str(e.data.provenance) ?? 'UNKNOWN',
      plan_status: str(e.data.plan_status),
      decision_ref: str(e.data.decision_ref) ?? '',
      subjects: refMap(e.data.subjects),
    }));
  const lastDecision = decisions[decisions.length - 1] ?? null;

  // Human action.
  const human = emptyHuman();
  human.last_decision = lastDecision;
  human.decision_state = lastDecision ? 'RECORDED' : 'NONE';
  if (state.phase === 'WAITING_HUMAN' && currentStage?.wait) {
    const wait = currentStage.wait;
    const audit = json(records, state.subjects.audit);
    const auditFindings = Array.isArray(audit?.findings) ? (audit?.findings as Record<string, unknown>[]) : [];
    const auditCoverage = Array.isArray(audit?.coverage) ? (audit?.coverage as Record<string, unknown>[]) : [];
    const intentText = state.subjects.intent ? records.get(state.subjects.intent) : undefined;
    const intent = intentText !== undefined ? parseIntent(intentText) : null;
    human.required = true;
    human.awaiting = wait;
    human.stage_id = state.stage;
    human.round = state.round;
    human.paused = state.paused;
    human.allowed_actions = allowedActions(workflow, wait, state.round, state.audit_budget.used);
    human.expected_version = state.version;
    human.read = wait === 'PRODUCT_QUESTION' ? `artifacts/${(state.subjects.intent ?? '').slice(7)}` : `brief/round-${state.round}.html`;
    for (const key of decisionSubjectKeys(wait)) {
      const ref = state.subjects[key];
      if (ref) human.subjects[key] = ref;
    }
    human.audit = wait === 'PLAN_DECISION' && audit ? { verdict: str(audit.verdict) ?? '?', findings: auditFindings.length, unchecked: auditCoverage.filter((c) => c.status === 'NOT_CHECKED').length, blocking: auditFindings.filter((x) => x.classification === 'BLOCKING').length } : null;
    human.open_decisions = wait === 'PRODUCT_QUESTION' && intent?.ok ? intent.value.fields['Open decisions'] : null;
    human.waiting_since = last.at;
    human.decision_state = state.paused ? 'PAUSED' : 'AWAITING';
    human.reason =
      wait === 'PRODUCT_QUESTION'
        ? `The intake record leaves product decisions open (question round ${state.question_rounds + 1} of ${workflow.max_question_rounds}). The engine will not write a specification until a human answers or rejects.`
        : `Audit round ${state.round} is complete${human.audit ? ` with verdict ${human.audit.verdict} and ${human.audit.findings} finding(s)` : ''}. The engine dispatches no further role until a human records a decision on the displayed brief${state.paused ? '; the last decision was a pause' : ''}.`;
  }

  // Executions and reviews.
  const executions: ExecutionSummary[] = [];
  const reviews: ReviewSummary[] = [];
  for (const e of events) {
    if (e.type === 'result_accepted') {
      const attemptId = str(e.data.attempt_id) ?? '';
      const stageId = attemptId.slice(0, attemptId.lastIndexOf('-'));
      const subjects = refMap(e.data.subjects);
      if (subjects.proof_baseline) {
        const record = json(records, subjects.proof_baseline);
        if (record) executions.push(executionSummary(record, subjects.proof_baseline, e.seq, e.at, subjects.proof_tree ?? null));
      }
      const reviewKey = stageId === 'plan-audit' ? 'audit' : stageId === 'review' ? 'review' : stageId === 'pr-review' ? 'pr_review' : null;
      if (reviewKey && subjects[reviewKey]) {
        const ref = subjects[reviewKey] as string;
        const fallback = str(e.data.review_verdict) ?? str(e.data.pr_review_verdict);
        reviews.push(reviewSummary(json(records, ref), stageId, attemptId, ref, stageId === 'plan-audit' ? (f.attemptSeq.get(attemptId)?.round ?? null) : null, e.at, state.subjects[reviewKey] === ref, fallback));
      }
    }
    if (e.type === 'verification_recorded') {
      const ref = str(e.data.verification_ref);
      const record = ref ? json(records, ref) : null;
      if (ref && record) executions.push(executionSummary(record, ref, e.seq, e.at, str(e.data.candidate)));
    }
  }

  // Problems.
  const problems: RunView['problems'] = [];
  if (state.phase === 'BLOCKED' && state.blocker) problems.push({ kind: 'BLOCKED', seq: state.version, at: last.at, summary: `${state.blocker.code}: ${state.blocker.detail}` });
  for (const e of events) {
    if (e.type === 'attempt_failed') problems.push({ kind: 'ATTEMPT_FAILED', seq: e.seq, at: e.at, summary: `${str(e.data.attempt_id)} failed: ${str(e.data.kind)}${str(e.data.detail) ? ` (${clip(str(e.data.detail) as string, 160)})` : ''}` });
    if (e.type === 'verification_recorded' && e.data.outcome === 'FAIL') problems.push({ kind: 'VERIFICATION_FAILED', seq: e.seq, at: e.at, summary: `candidate ${str(e.data.candidate) ?? '?'} failed verification` });
    if (e.type === 'verification_invalidated') problems.push({ kind: 'VERIFICATION_INVALIDATED', seq: e.seq, at: e.at, summary: `verification invalidated: ${str(e.data.reason) ?? '?'}` });
    if (e.type === 'result_accepted' && e.data.outcome === 'NEGATIVE') problems.push({ kind: 'NEGATIVE_RESULT', seq: e.seq, at: e.at, summary: `${str(e.data.attempt_id)} returned a negative result` });
  }
  if (input.incomplete_tail_bytes > 0) problems.push({ kind: 'INCOMPLETE_TAIL', seq: null, at: null, summary: `${input.incomplete_tail_bytes} byte(s) after the last committed record were never acknowledged and are not shown as an event` });
  for (const key of ['audit', 'review', 'pr_review', 'verification', 'proof_baseline'] as const) {
    const ref = state.subjects[key];
    if (ref && !records.has(ref)) problems.push({ kind: 'UNREADABLE_RECORD', seq: null, at: null, summary: `retained record "${key}" (${ref}) could not be read or does not match its identity` });
  }
  problems.sort((a, b) => (a.seq ?? Number.MAX_SAFE_INTEGER) - (b.seq ?? Number.MAX_SAFE_INTEGER));
  if (state.phase === 'BLOCKED') {
    const i = problems.findIndex((p) => p.kind === 'BLOCKED');
    if (i > 0) problems.unshift(...problems.splice(i, 1));
  }

  // Proposal and outcome.
  const proposalRecord = state.proposal ? json(records, state.proposal.proposal_ref) : null;
  const proposal: RunView['proposal'] = state.proposal
    ? { proposal_ref: state.proposal.proposal_ref, location: state.proposal.location, status: 'LOCAL_PR_PROPOSAL_PREPARED', publication_status: 'NOT_ATTEMPTED', title: str(proposalRecord?.title) }
    : null;
  const finalOutcome: FinalOutcome =
    state.phase === 'DONE' ? (state.terminal === 'PR_PROPOSAL_READY' ? 'LOCAL_PR_PROPOSAL_PREPARED' : 'REJECTED') : state.phase === 'BLOCKED' ? 'BLOCKED' : state.phase === 'WAITING_HUMAN' ? 'WAITING_HUMAN' : 'IN_PROGRESS';

  // Application label from the retained base tree's package.json, if any.
  let appLabel: string | null = null;
  const base = json(records, state.subjects.base);
  const files = Array.isArray(base?.files) ? (base?.files as Record<string, unknown>[]) : [];
  const pkg = files.find((x) => x.path === 'package.json');
  if (pkg && typeof pkg.sha256 === 'string') {
    const text = records.get(`sha256:${pkg.sha256}`);
    if (text !== undefined) {
      try {
        const name = (JSON.parse(text) as { name?: unknown }).name;
        if (typeof name === 'string' && name.length > 0 && name.length <= 214) appLabel = name;
      } catch {
        appLabel = null;
      }
    }
  }

  const provenance = (started.source_provenance ?? {}) as Record<string, unknown>;
  const timeline: TimelineEntry[] = events.map((e, i) => timelineEntry(e, f.states[i] as RunState));
  const intentText = state.subjects.intent ? records.get(state.subjects.intent) : undefined;
  const intent = intentText !== undefined ? parseIntent(intentText) : null;

  return withDigest({
    schema_version: DASHBOARD_SCHEMA_VERSION,
    record_type: 'dashboard-run-view',
    run_id: state.run_id,
    source_status: input.incomplete_tail_bytes > 0 ? 'INCOMPLETE_TAIL' : 'CURRENT',
    diagnostic: { code: null, message: null, record: null, incomplete_tail_bytes: input.incomplete_tail_bytes },
    journal_version: state.version,
    started_at: first.at,
    last_committed_at: last.at,
    request: { request_id: state.request_id, title: intent?.ok ? intent.value.title : null, outcome: intent?.ok ? intent.value.fields.Outcome : null, locator: str(provenance.locator), adapter: str(provenance.adapter), captured_at: str(provenance.captured_at), source_ref: state.source_ref },
    application: { label: appLabel, label_source: appLabel ? 'retained-package-json' : 'NONE', base_ref: state.subjects.base ?? null, app_config_ref: state.app_config_ref },
    workflow: {
      id: workflow.workflow_id,
      version: workflow.workflow_version,
      ref: state.workflow_ref,
      execution_profile: workflow.workflow_id === 'local-request-to-proposal' ? 'STANDARD' : 'UNKNOWN',
      stages: workflow.stages.length,
    },
    profile: { id: str(started.profile_id), version: num(started.profile_version), ref: state.profile_ref, host: str(profile?.host) },
    transport_class: state.transport_class,
    engine: {
      phase: state.phase,
      stage: state.stage,
      directive: state.phase === 'ACTIVE' ? 'CONTINUE' : state.phase === 'WAITING_HUMAN' ? 'WAIT' : state.phase === 'DONE' ? 'DONE' : 'BLOCKED',
      paused: state.paused,
      round: state.round,
      question_rounds: state.question_rounds,
      audit_budget: state.audit_budget,
      terminal: state.terminal,
      blocker: state.blocker,
      publication_status: state.publication_status,
      failed_verifications: state.failed_verifications,
    },
    final_outcome: finalOutcome,
    stage_graph: nodes,
    current_activity: activity,
    human_action: human,
    attempts,
    decisions,
    timeline,
    evidence: f.evidence.map((e) => ({ ...e, available: records.has(e.ref) })),
    executions,
    reviews,
    proposal,
    problems,
    not_observed: NOT_OBSERVED,
    lock: input.lock,
  });
}

export function summarize(view: RunView): RunSummary {
  return {
    run_id: view.run_id,
    request_id: view.request.request_id,
    request_title: view.request.title,
    application_label: view.application.label,
    workflow: { id: view.workflow.id, version: view.workflow.version, execution_profile: view.workflow.execution_profile },
    source_status: view.source_status,
    phase: view.engine.phase,
    stage: view.engine.stage,
    final_outcome: view.final_outcome,
    needs_human: view.human_action.required,
    dispatch_status: view.current_activity.dispatch_status,
    started_at: view.started_at,
    last_committed_at: view.last_committed_at,
    journal_version: view.journal_version,
    view_digest: view.view_digest,
  };
}
