// Versioned records exchanged with the engine, and their runtime validators.
// Every record that crosses a process or file boundary is parsed here.

import { createHash } from 'node:crypto';
import {
  type Issues,
  type Parsed,
  asInt,
  asLiteral,
  asMap,
  asObject,
  asOneOf,
  asString,
  checkVersion,
  finish,
  newIssues,
  parseJson,
} from './validate.ts';
import { type Amendment, checkAmendments } from './planning.ts';

// Identifiers never contain dots or separators, so they cannot form a path
// that leaves the directory they are joined to.
export const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
export const REF_PATTERN = /^sha256:[0-9a-f]{64}$/;
const KEY_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const MAX_VERSION = Number.MAX_SAFE_INTEGER;

export function sha256Hex(bytes: string | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function refOf(bytes: string | Uint8Array): string {
  return `sha256:${sha256Hex(bytes)}`;
}

// Key-sorted JSON, used wherever two parties must compute the same identity.
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const body = Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
    return `{${body.join(',')}}`;
  }
  return JSON.stringify(value);
}

// ---------------------------------------------------------------- profile

export const EFFORT_POLICIES = ['host-default'] as const;
export const SELECTOR_STATUSES = ['requires-host-observation', 'observed'] as const;

export interface RoleProfile {
  model_alias: string;
  effort_policy: (typeof EFFORT_POLICIES)[number];
  max_attempts: number;
  timeout_seconds: number;
}

export interface CatalogEntry {
  owner_label: string;
  family: string;
  host_selector: string | null;
  selector_status: (typeof SELECTOR_STATUSES)[number];
}

export interface Profile {
  schema_version: 1;
  record_type: 'profile';
  profile_id: string;
  profile_version: number;
  host: string;
  roles: Record<string, RoleProfile>;
  catalog: Record<string, CatalogEntry>;
  fallbacks: never[];
}

// `dispatchRoles` are the roles the workflow will dispatch; each must have a
// profile entry. Aliases and labels are opaque strings to the core.
export function parseProfile(text: string, dispatchRoles: readonly string[]): Parsed<Profile> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(
    raw,
    'profile',
    ['schema_version', 'record_type', 'profile_id', 'profile_version', 'host', 'roles', 'catalog', 'fallbacks'],
    [],
    issues,
  );
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'profile.schema_version', issues);
  asLiteral(o.record_type, 'profile.record_type', 'profile', issues);
  asString(o.profile_id, 'profile.profile_id', issues, { pattern: ID_PATTERN });
  asInt(o.profile_version, 'profile.profile_version', 1, MAX_VERSION, issues);
  asString(o.host, 'profile.host', issues, { pattern: ID_PATTERN });

  const catalog = asMap(o.catalog, 'profile.catalog', KEY_PATTERN, issues) ?? {};
  for (const [alias, entryRaw] of Object.entries(catalog)) {
    const p = `profile.catalog.${alias}`;
    const e = asObject(entryRaw, p, ['owner_label', 'family', 'host_selector', 'selector_status'], [], issues);
    if (!e) continue;
    asString(e.owner_label, `${p}.owner_label`, issues, { max: 80 });
    asString(e.family, `${p}.family`, issues, { max: 80 });
    const status = asOneOf(e.selector_status, `${p}.selector_status`, SELECTOR_STATUSES, issues);
    if (e.host_selector === null) {
      if (status !== 'requires-host-observation') {
        issues.list.push(`${p}: a null host_selector cannot be reported as ${status}`);
      }
    } else {
      asString(e.host_selector, `${p}.host_selector`, issues, { max: 200 });
      if (status !== 'observed') {
        issues.list.push(`${p}: a host_selector requires selector_status "observed"`);
      }
    }
  }

  const roles = asMap(o.roles, 'profile.roles', KEY_PATTERN, issues) ?? {};
  for (const [role, entryRaw] of Object.entries(roles)) {
    const p = `profile.roles.${role}`;
    const e = asObject(entryRaw, p, ['model_alias', 'effort_policy', 'max_attempts', 'timeout_seconds'], [], issues);
    if (!e) continue;
    const alias = asString(e.model_alias, `${p}.model_alias`, issues, { pattern: KEY_PATTERN });
    if (alias && !Object.hasOwn(catalog, alias)) {
      issues.list.push(`${p}.model_alias: "${alias}" is not in the catalog`);
    }
    if (typeof e.effort_policy === 'string' && !(EFFORT_POLICIES as readonly string[]).includes(e.effort_policy)) {
      issues.list.push(`${p}.effort_policy: UNSUPPORTED_EFFORT "${e.effort_policy}"`);
    } else {
      asOneOf(e.effort_policy, `${p}.effort_policy`, EFFORT_POLICIES, issues);
    }
    asInt(e.max_attempts, `${p}.max_attempts`, 1, 5, issues);
    asInt(e.timeout_seconds, `${p}.timeout_seconds`, 1, 86400, issues);
  }
  for (const role of dispatchRoles) {
    if (!Object.hasOwn(roles, role)) issues.list.push(`profile.roles.${role}: missing required role`);
  }

  if (!Array.isArray(o.fallbacks) || o.fallbacks.length !== 0) {
    issues.list.push('profile.fallbacks: UNSUPPORTED_FALLBACK, version 1 permits only an empty list');
  }
  return finish(issues, () => raw as Profile);
}

// ---------------------------------------------------------------- task and results

export interface TaskEnvelope {
  schema_version: 1;
  record_type: 'task-envelope';
  run_id: string;
  attempt_id: string;
  step_id: string;
  role: string;
  state_version: number;
  inputs: Record<string, string>;
  input_digest: string;
  output_contract: 'role-result/v1';
  profile_ref: string;
  // Mode of the role for this stage, and the audit round it belongs to.
  mode: string | null;
  round: number;
  // The attempt's write lane, relative to the run directory, and the files the
  // stage must deliver there (record key to suggested file name).
  work_dir: string;
  produces: Record<string, string>;
  // The attempt's own copy of the application, relative to the run directory,
  // for stages that work on it. No other attempt uses this directory.
  app_dir: string | null;
}

export const OUTCOMES = ['COMPLETED', 'NEGATIVE'] as const;
export type Outcome = (typeof OUTCOMES)[number];

export interface RoleResult {
  schema_version: 1;
  record_type: 'role-result';
  run_id: string;
  attempt_id: string;
  role: string;
  expected_version: number;
  input_digest: string;
  outcome: Outcome;
  summary: string;
  outputs: Record<string, string>;
  // Record key to a file path relative to the attempt's work directory.
  files: Record<string, string>;
}

// EXECUTION_UNCERTAIN: the invocation may have started and nobody can say
// whether it finished. It is recorded only by an explicit abandon.
// RESULT_REJECTED: a result was delivered and the engine refused it.
export const FAILURE_KINDS = ['TIMEOUT', 'REFUSED', 'MALFORMED_REPLY', 'TRANSPORT_ERROR', 'EXECUTION_UNCERTAIN', 'RESULT_REJECTED'] as const;
export type FailureKind = (typeof FAILURE_KINDS)[number];

export interface TransportFailure {
  schema_version: 1;
  record_type: 'transport-failure';
  run_id: string;
  attempt_id: string;
  expected_version: number;
  kind: FailureKind;
  detail: string;
}

export type Submission = RoleResult | TransportFailure;

function stringMap(v: unknown, path: string, issues: Issues, valuePattern?: RegExp): void {
  const m = asMap(v, path, KEY_PATTERN, issues);
  if (!m) return;
  for (const [k, val] of Object.entries(m)) {
    asString(val, `${path}.${k}`, issues, { max: 500, pattern: valuePattern });
  }
}

export function parseSubmission(text: string): Parsed<Submission> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const type = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>).record_type : undefined;
  if (type === 'transport-failure') {
    const o = asObject(
      raw,
      'failure',
      ['schema_version', 'record_type', 'run_id', 'attempt_id', 'expected_version', 'kind', 'detail'],
      [],
      issues,
    );
    if (o) {
      checkVersion(o.schema_version, 'failure.schema_version', issues);
      asString(o.run_id, 'failure.run_id', issues, { pattern: ID_PATTERN });
      asString(o.attempt_id, 'failure.attempt_id', issues, { pattern: ID_PATTERN });
      asInt(o.expected_version, 'failure.expected_version', 1, MAX_VERSION, issues);
      asOneOf(o.kind, 'failure.kind', FAILURE_KINDS, issues);
      asString(o.detail, 'failure.detail', issues, { max: 2000, allowEmpty: true });
    }
    return finish(issues, () => raw as TransportFailure);
  }
  const o = asObject(
    raw,
    'result',
    [
      'schema_version',
      'record_type',
      'run_id',
      'attempt_id',
      'role',
      'expected_version',
      'input_digest',
      'outcome',
      'summary',
      'outputs',
      'files',
    ],
    [],
    issues,
  );
  if (o) {
    checkVersion(o.schema_version, 'result.schema_version', issues);
    asLiteral(o.record_type, 'result.record_type', 'role-result', issues);
    asString(o.run_id, 'result.run_id', issues, { pattern: ID_PATTERN });
    asString(o.attempt_id, 'result.attempt_id', issues, { pattern: ID_PATTERN });
    asString(o.role, 'result.role', issues, { pattern: KEY_PATTERN });
    asInt(o.expected_version, 'result.expected_version', 1, MAX_VERSION, issues);
    asString(o.input_digest, 'result.input_digest', issues, { pattern: REF_PATTERN });
    asOneOf(o.outcome, 'result.outcome', OUTCOMES, issues);
    asString(o.summary, 'result.summary', issues, { max: 2000 });
    stringMap(o.outputs, 'result.outputs', issues);
    stringMap(o.files, 'result.files', issues);
  }
  return finish(issues, () => raw as RoleResult);
}

// ---------------------------------------------------------------- human decision

// answer: reply to a product question. proceed: authorize the audited plan
// unchanged. amend: authorize it with exact amendments and no re-audit.
// second-audit: ask for one more round. pause: record that the human is not
// deciding yet. reject: end the run.
export const DECISION_ACTIONS = ['answer', 'proceed', 'amend', 'second-audit', 'pause', 'reject'] as const;
export type DecisionAction = (typeof DECISION_ACTIONS)[number];

// `recorded_by` is an unauthenticated label. It records what the caller said,
// not who the caller was.
// How a decision came to be recorded. SCRIPTED: produced by a script or test.
// HUMAN_RECORDED: someone recorded what a human said; this is a claim by the
// recorder, not authentication. A decision without the field is UNKNOWN.
export const DECISION_PROVENANCES = ['SCRIPTED', 'HUMAN_RECORDED'] as const;
export type DecisionProvenance = (typeof DECISION_PROVENANCES)[number] | 'UNKNOWN';

export interface HumanDecision {
  schema_version: 1;
  record_type: 'human-decision';
  run_id: string;
  decision_id: string;
  expected_version: number;
  action: DecisionAction;
  subjects: Record<string, string>;
  recorded_by: string;
  provenance?: (typeof DECISION_PROVENANCES)[number];
  answer?: string;
  amendments?: Amendment[];
}

export function parseDecision(text: string): Parsed<HumanDecision> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(
    raw,
    'decision',
    ['schema_version', 'record_type', 'run_id', 'decision_id', 'expected_version', 'action', 'subjects', 'recorded_by'],
    ['answer', 'amendments', 'provenance'],
    issues,
  );
  if (o) {
    // An action carries exactly the content it needs, so a decision cannot be
    // read as more than it says.
    if (o.provenance !== undefined) asOneOf(o.provenance, 'decision.provenance', DECISION_PROVENANCES, issues);
    if (o.action === 'answer') asString(o.answer, 'decision.answer', issues, { max: 4000 });
    else if (o.answer !== undefined) issues.list.push('decision.answer: only allowed with action "answer"');
    if (o.action === 'amend') checkAmendments(o.amendments, 'decision.amendments', issues);
    else if (o.amendments !== undefined) issues.list.push('decision.amendments: only allowed with action "amend"');
    checkVersion(o.schema_version, 'decision.schema_version', issues);
    asLiteral(o.record_type, 'decision.record_type', 'human-decision', issues);
    asString(o.run_id, 'decision.run_id', issues, { pattern: ID_PATTERN });
    asString(o.decision_id, 'decision.decision_id', issues, { pattern: ID_PATTERN });
    asInt(o.expected_version, 'decision.expected_version', 1, MAX_VERSION, issues);
    asOneOf(o.action, 'decision.action', DECISION_ACTIONS, issues);
    stringMap(o.subjects, 'decision.subjects', issues, REF_PATTERN);
    asString(o.recorded_by, 'decision.recorded_by', issues, { max: 200 });
  }
  return finish(issues, () => raw as HumanDecision);
}

// ---------------------------------------------------------------- journal event

export const EVENT_TYPES = [
  'run_started',
  'task_dispatched',
  'result_accepted',
  'attempt_failed',
  'brief_rendered',
  'decision_recorded',
  'verification_recorded',
  'verification_invalidated',
  'proposal_recorded',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface JournalEvent {
  schema_version: 1;
  seq: number;
  run_id: string;
  type: EventType;
  at: string;
  data: Record<string, unknown>;
}

export function parseEvent(text: string): Parsed<JournalEvent> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(raw, 'event', ['schema_version', 'seq', 'run_id', 'type', 'at', 'data'], [], issues);
  if (o) {
    checkVersion(o.schema_version, 'event.schema_version', issues);
    asInt(o.seq, 'event.seq', 1, MAX_VERSION, issues);
    asString(o.run_id, 'event.run_id', issues, { pattern: ID_PATTERN });
    asOneOf(o.type, 'event.type', EVENT_TYPES, issues);
    asString(o.at, 'event.at', issues, { max: 40 });
    asObject(o.data, 'event.data', [], Object.keys((o.data as object | null) ?? {}), issues);
  }
  return finish(issues, () => raw as JournalEvent);
}

// ---------------------------------------------------------------- local proposal

export interface PrProposal {
  schema_version: 1;
  record_type: 'pr-proposal';
  run_id: string;
  request_id: string;
  title: string;
  body: string;
  // Measured identities of the unchanged application and of the candidate
  // (hash of a file-tree record). They are not commit ids.
  base_ref: string;
  candidate_ref: string;
  // The controlled proof, its run against the unchanged application, the run
  // of the candidate, and the review of that exact candidate.
  proof: string;
  proof_tree: string;
  proof_baseline: string;
  verification: string;
  review: string;
  source_ref: string;
  evidence: Record<string, string>;
  // The planning records this proposal rests on, each by retained identity.
  // Who authorized the plan, and how, is resolved through `decision`.
  planning_basis: {
    final_plan: string;
    last_audited_plan: string;
    audit: string;
    decision: string;
    brief: string;
    spec: string;
    intent: string;
  };
  status: 'PR_PROPOSAL_READY';
  publication_status: 'NOT_ATTEMPTED';
  // What produced the role results behind this proposal, and whether the
  // candidate was verified. A simulated or unverified proposal says so itself.
  evidence_class: 'SIMULATED' | 'MANUAL_TRANSPORT';
  // Test execution is actual local execution whatever produced the role
  // results. Review and role results are only as real as the transport class.
  evidence_classes: {
    role_results: 'SIMULATED' | 'MANUAL_TRANSPORT';
    review: 'SIMULATED' | 'MANUAL_TRANSPORT';
    test_execution: 'ACTUAL_LOCAL_EXECUTION';
  };
  candidate_verification: 'PASSED_LOCAL_EXECUTION';
}
