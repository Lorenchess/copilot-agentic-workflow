// Records of the submission review that follows technical acceptance: the
// packet the engine assembles for it, and the result the PR reviewer returns.
//
// The packet is machine-owned. It holds identities and measured facts only,
// never an account of the work, so it cannot become a second source of truth.
// The result is the one place a model's reading of the change enters a
// proposal, and only through the fields named here. As elsewhere, these
// parsers check shape, bounds, and cross-references; they cannot show that a
// sentence is true.

import { type Coverage, type Finding, type PlanStatus, asArray, checkCoverage, checkFindings } from './planning.ts';
import { ID_PATTERN, REF_PATTERN } from './records.ts';
import { type Issues, type Parsed, asInt, asLiteral, asObject, asOneOf, asString, checkVersion, finish, newIssues, parseJson } from './validate.ts';

// ---------------------------------------------------------------- packet

// Format of the composed proposal body. It is bound into the packet, so a
// review counts only for the format the proposal is then composed in.
export const COMPOSER_FORMAT = 'rstack-pr-body/v1';

export const PATH_CHANGES = ['ADDED', 'MODIFIED', 'DELETED'] as const;

// One path whose bytes differ between two retained trees. `before` and
// `after` are the identities of the file's bytes on each side.
export interface PathChange {
  path: string;
  change: (typeof PATH_CHANGES)[number];
  before: string | null;
  after: string | null;
}

export interface ChangeSet {
  added: number;
  modified: number;
  deleted: number;
  paths: PathChange[];
}

export interface PrReviewPacket {
  schema_version: 1;
  record_type: 'pr-review-packet';
  run_id: string;
  request_id: string;
  identity: {
    workflow: string;
    profile: string;
    app_config: string;
    // The procedure the PR reviewer is given: the engine's default or a team's.
    review_procedure: string;
    composer_format: string;
    evidence_class: 'SIMULATED' | 'MANUAL_TRANSPORT';
  };
  requirements: { source: string; intent: string; spec: string; answers: string | null };
  planning: {
    last_audited_plan: string;
    audit: string;
    final_plan: string;
    decision: string;
    brief: string;
    plan_status: PlanStatus;
    dispositions: string | null;
  };
  implementation: { base: string; proof_tree: string; candidate: string };
  execution: { proof: string; proof_baseline: string; proof_baseline_output: string; verification: string; verification_output: string };
  // The code review this packet follows, and the dispatch that produced it.
  technical_review: { review: string; verdict: 'ACCEPT'; result: string; attempt_id: string; input_digest: string };
  // Measured by the engine from the retained trees. The complete proposed
  // change is unchanged application to candidate; the second comparison
  // separates the implementation from the controlled tests added for the proof.
  changes: { base_to_candidate: ChangeSet; proof_tree_to_candidate: ChangeSet };
  // What went wrong or was replaced on the way, selected from the journal up
  // to `journal_cutoff`. A later journal record does not change this packet.
  history: {
    journal_cutoff: number;
    journal_digest: string;
    failed_attempts: { attempt_id: string; step_id: string; kind: string; record: string }[];
    // A run that did not pass, the earlier candidate it ran on, and what it printed.
    failed_verifications: { verification: string; candidate: string; output: string }[];
    // A result that was accepted and later replaced, and each record it produced.
    superseded_results: { step_id: string; attempt_id: string; result: string; produced: { key: string; record: string }[] }[];
    invalidations: number;
    // History this packet does not bind, said plainly rather than left out.
    not_included: string[];
  };
}

const SAFE_PATH = /^[^\u0000-\u001f\u007f\\:]{1,1000}$/;

function ref(v: unknown, path: string, issues: Issues): string {
  return asString(v, path, issues, { pattern: REF_PATTERN });
}

function refOrNull(v: unknown, path: string, issues: Issues): void {
  if (v !== null) ref(v, path, issues);
}

function refs(o: Record<string, unknown> | null, path: string, keys: readonly string[], issues: Issues): void {
  if (o) for (const key of keys) ref(o[key], `${path}.${key}`, issues);
}

function checkChangeSet(v: unknown, path: string, issues: Issues): void {
  const o = asObject(v, path, ['added', 'modified', 'deleted', 'paths'], [], issues);
  if (!o) return;
  const counts = { ADDED: 0, MODIFIED: 0, DELETED: 0 };
  let last = '';
  asArray(o.paths, `${path}.paths`, issues, 4000).forEach((entry, i) => {
    const p = `${path}.paths[${i}]`;
    const e = asObject(entry, p, ['path', 'change', 'before', 'after'], [], issues);
    if (!e) return;
    const name = asString(e.path, `${p}.path`, issues, { pattern: SAFE_PATH });
    if (i > 0 && !(last < name)) issues.list.push(`${p}.path: paths must be unique and sorted`);
    last = name;
    const change = asOneOf(e.change, `${p}.change`, PATH_CHANGES, issues);
    counts[change] += 1;
    refOrNull(e.before, `${p}.before`, issues);
    refOrNull(e.after, `${p}.after`, issues);
    if ((e.before === null) !== (change === 'ADDED') || (e.after === null) !== (change === 'DELETED')) {
      issues.list.push(`${p}: before and after do not agree with ${change}`);
    }
    if (change === 'MODIFIED' && e.before === e.after) issues.list.push(`${p}: a modified path must have two different identities`);
  });
  // The counts are a restatement of the list and may never say anything else.
  for (const [key, change] of [['added', 'ADDED'], ['modified', 'MODIFIED'], ['deleted', 'DELETED']] as const) {
    if (o[key] !== counts[change]) issues.list.push(`${path}.${key}: does not equal the number of ${change} paths`);
  }
}

export function parsePrReviewPacket(text: string): Parsed<PrReviewPacket> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(
    raw,
    'packet',
    ['schema_version', 'record_type', 'run_id', 'request_id', 'identity', 'requirements', 'planning', 'implementation', 'execution', 'technical_review', 'changes', 'history'],
    [],
    issues,
  );
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'packet.schema_version', issues);
  asLiteral(o.record_type, 'packet.record_type', 'pr-review-packet', issues);
  asString(o.run_id, 'packet.run_id', issues, { pattern: ID_PATTERN });
  asString(o.request_id, 'packet.request_id', issues, { pattern: ID_PATTERN });

  const identity = asObject(o.identity, 'packet.identity', ['workflow', 'profile', 'app_config', 'review_procedure', 'composer_format', 'evidence_class'], [], issues);
  refs(identity, 'packet.identity', ['workflow', 'profile', 'app_config', 'review_procedure'], issues);
  if (identity) {
    asLiteral(identity.composer_format, 'packet.identity.composer_format', COMPOSER_FORMAT, issues);
    asOneOf(identity.evidence_class, 'packet.identity.evidence_class', ['SIMULATED', 'MANUAL_TRANSPORT'], issues);
  }
  const requirements = asObject(o.requirements, 'packet.requirements', ['source', 'intent', 'spec', 'answers'], [], issues);
  refs(requirements, 'packet.requirements', ['source', 'intent', 'spec'], issues);
  if (requirements) refOrNull(requirements.answers, 'packet.requirements.answers', issues);
  const planning = asObject(o.planning, 'packet.planning', ['last_audited_plan', 'audit', 'final_plan', 'decision', 'brief', 'plan_status', 'dispositions'], [], issues);
  refs(planning, 'packet.planning', ['last_audited_plan', 'audit', 'final_plan', 'decision', 'brief'], issues);
  if (planning) {
    asOneOf(planning.plan_status, 'packet.planning.plan_status', ['AS_AUDITED', 'AMENDED_NOT_REAUDITED'], issues);
    refOrNull(planning.dispositions, 'packet.planning.dispositions', issues);
  }
  refs(asObject(o.implementation, 'packet.implementation', ['base', 'proof_tree', 'candidate'], [], issues), 'packet.implementation', ['base', 'proof_tree', 'candidate'], issues);
  const execution = ['proof', 'proof_baseline', 'proof_baseline_output', 'verification', 'verification_output'];
  refs(asObject(o.execution, 'packet.execution', execution, [], issues), 'packet.execution', execution, issues);
  const technical = asObject(o.technical_review, 'packet.technical_review', ['review', 'verdict', 'result', 'attempt_id', 'input_digest'], [], issues);
  refs(technical, 'packet.technical_review', ['review', 'result', 'input_digest'], issues);
  if (technical) {
    asLiteral(technical.verdict, 'packet.technical_review.verdict', 'ACCEPT', issues);
    asString(technical.attempt_id, 'packet.technical_review.attempt_id', issues, { pattern: ID_PATTERN });
  }
  const changes = asObject(o.changes, 'packet.changes', ['base_to_candidate', 'proof_tree_to_candidate'], [], issues);
  if (changes) {
    checkChangeSet(changes.base_to_candidate, 'packet.changes.base_to_candidate', issues);
    checkChangeSet(changes.proof_tree_to_candidate, 'packet.changes.proof_tree_to_candidate', issues);
  }
  const history = asObject(
    o.history,
    'packet.history',
    ['journal_cutoff', 'journal_digest', 'failed_attempts', 'failed_verifications', 'superseded_results', 'invalidations', 'not_included'],
    [],
    issues,
  );
  if (history) {
    asInt(history.journal_cutoff, 'packet.history.journal_cutoff', 1, Number.MAX_SAFE_INTEGER, issues);
    ref(history.journal_digest, 'packet.history.journal_digest', issues);
    asInt(history.invalidations, 'packet.history.invalidations', 0, Number.MAX_SAFE_INTEGER, issues);
    asArray(history.failed_attempts, 'packet.history.failed_attempts', issues, 1000).forEach((entry, i) => {
      const p = `packet.history.failed_attempts[${i}]`;
      const e = asObject(entry, p, ['attempt_id', 'step_id', 'kind', 'record'], [], issues);
      if (!e) return;
      asString(e.attempt_id, `${p}.attempt_id`, issues, { pattern: ID_PATTERN });
      asString(e.step_id, `${p}.step_id`, issues, { max: 64 });
      asString(e.kind, `${p}.kind`, issues, { max: 64 });
      ref(e.record, `${p}.record`, issues);
    });
    asArray(history.failed_verifications, 'packet.history.failed_verifications', issues, 1000).forEach((entry, i) => {
      const p = `packet.history.failed_verifications[${i}]`;
      refs(asObject(entry, p, ['verification', 'candidate', 'output'], [], issues), p, ['verification', 'candidate', 'output'], issues);
    });
    asArray(history.superseded_results, 'packet.history.superseded_results', issues, 1000).forEach((entry, i) => {
      const p = `packet.history.superseded_results[${i}]`;
      const e = asObject(entry, p, ['step_id', 'attempt_id', 'result', 'produced'], [], issues);
      if (!e) return;
      asString(e.step_id, `${p}.step_id`, issues, { max: 64 });
      asString(e.attempt_id, `${p}.attempt_id`, issues, { pattern: ID_PATTERN });
      ref(e.result, `${p}.result`, issues);
      let last = '';
      asArray(e.produced, `${p}.produced`, issues, 20).forEach((made, j) => {
        const q = `${p}.produced[${j}]`;
        const m = asObject(made, q, ['key', 'record'], [], issues);
        if (!m) return;
        const key = asString(m.key, `${q}.key`, issues, { max: 64 });
        if (j > 0 && !(last < key)) issues.list.push(`${q}.key: keys must be unique and sorted`);
        last = key;
        ref(m.record, `${q}.record`, issues);
      });
    });
    asArray(history.not_included, 'packet.history.not_included', issues, 10).forEach((n, i) => asString(n, `packet.history.not_included[${i}]`, issues, { max: 300 }));
  }
  return finish(issues, () => raw as PrReviewPacket);
}

// Every retained record a packet names, field by field. Together with the
// packet's own identity and the files of its three trees, this is what a PR
// review may cite. The list is written out, not found by shape: the packet
// also holds two digests (`technical_review.input_digest` and
// `history.journal_digest`) that look like identities and name no retained
// record, and those are not evidence a statement can rest on.
export function packetIdentities(packet: PrReviewPacket): string[] {
  const { identity, requirements, planning, implementation, execution, technical_review, history } = packet;
  const named: (string | null)[] = [
    identity.workflow,
    identity.profile,
    identity.app_config,
    identity.review_procedure,
    requirements.source,
    requirements.intent,
    requirements.spec,
    requirements.answers,
    planning.last_audited_plan,
    planning.audit,
    planning.final_plan,
    planning.decision,
    planning.brief,
    planning.dispositions,
    implementation.base,
    implementation.proof_tree,
    implementation.candidate,
    execution.proof,
    execution.proof_baseline,
    execution.proof_baseline_output,
    execution.verification,
    execution.verification_output,
    technical_review.review,
    technical_review.result,
    ...history.failed_attempts.map((f) => f.record),
    ...history.failed_verifications.flatMap((f) => [f.verification, f.candidate, f.output]),
    ...history.superseded_results.flatMap((s) => [s.result, ...s.produced.map((p) => p.record)]),
  ];
  return [...new Set(named.filter((id): id is string => id !== null))].sort();
}

// ---------------------------------------------------------------- result

export const PR_REVIEW_VERDICTS = ['APPROVE', 'REQUEST_CHANGES', 'INCONCLUSIVE'] as const;
export type PrReviewVerdict = (typeof PR_REVIEW_VERDICTS)[number];

// What every PR review must report on, by these exact item names. A team's
// procedure may add items of its own; it cannot remove or rename these, and
// APPROVE needs each of them CHECKED.
export const PR_REVIEW_COVERAGE = [
  'intent-fidelity',
  'measured-change-fidelity',
  'verification-claims',
  'technical-review-disclosure',
  'material-risks',
  'title-and-scope',
  'submission-readiness',
] as const;

export const PR_REVIEW_LIMITS = {
  record_bytes: 64 * 1024,
  title: 120,
  summary: 1200,
  entry: 600,
  change_analysis: 12,
  list: 8,
  findings: 20,
  coverage: 30,
  evidence_per_entry: 10,
  evidence_references: 50,
} as const;

// A statement about the change and the retained records it rests on.
export interface Narrative {
  text: string;
  evidence: string[];
}

export interface PrReview {
  schema_version: 1;
  record_type: 'pr-review-result';
  subject: { packet: string; candidate: string };
  verdict: PrReviewVerdict;
  title: string;
  summary: string;
  change_analysis: Narrative[];
  testing_analysis: Narrative[];
  risks: Narrative[];
  limitations: string[];
  reviewer_notes: string[];
  findings: Finding[];
  coverage: Coverage[];
  evidence_references: string[];
}

// Characters that would let text act as layout wherever it is later shown.
// A line feed is allowed where a field may hold more than one line.
const SEPARATORS = String.fromCharCode(0x2028, 0x2029);
const CONTROL = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(9, 11) + '-' + String.fromCharCode(0x1f, 0x7f) + '-' + String.fromCharCode(0x9f) + SEPARATORS + ']');

function plain(v: unknown, path: string, issues: Issues, max: number, singleLine = false): string {
  const s = asString(v, path, issues, { max });
  if (typeof v !== 'string') return s;
  if (s.trim().length === 0 && s.length > 0) issues.list.push(`${path}: must not be blank`);
  if (CONTROL.test(s) || (singleLine && s.includes('\n'))) issues.list.push(`${path}: contains a control character`);
  return s;
}

export interface PrReviewExpected {
  // The packet and candidate the reviewer was given.
  packet: string;
  candidate: string;
  // Every identity the review may cite: what the packet names, the packet
  // itself, and the files of its trees.
  permitted: ReadonlySet<string>;
}

export function parsePrReview(text: string, expected: PrReviewExpected): Parsed<PrReview> {
  const issues = newIssues();
  if (Buffer.byteLength(text) > PR_REVIEW_LIMITS.record_bytes) {
    issues.list.push(`pr_review: larger than ${PR_REVIEW_LIMITS.record_bytes} bytes`);
    return finish(issues, () => undefined as never);
  }
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  // Exactly these fields. There is none for a candidate, a count, a command, a
  // test result, a verdict of another review, or an authorization, so a result
  // cannot carry a replacement for any of them.
  const o = asObject(
    raw,
    'pr_review',
    [
      'schema_version',
      'record_type',
      'subject',
      'verdict',
      'title',
      'summary',
      'change_analysis',
      'testing_analysis',
      'risks',
      'limitations',
      'reviewer_notes',
      'findings',
      'coverage',
      'evidence_references',
    ],
    [],
    issues,
  );
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'pr_review.schema_version', issues);
  asLiteral(o.record_type, 'pr_review.record_type', 'pr-review-result', issues);
  const s = asObject(o.subject, 'pr_review.subject', ['packet', 'candidate'], [], issues);
  if (s) {
    for (const key of ['packet', 'candidate'] as const) {
      if (asString(s[key], `pr_review.subject.${key}`, issues, { pattern: REF_PATTERN }) !== expected[key]) {
        issues.list.push(`pr_review.subject.${key}: is not the ${key} this review was given`);
      }
    }
  }
  const verdict = asOneOf(o.verdict, 'pr_review.verdict', PR_REVIEW_VERDICTS, issues);
  plain(o.title, 'pr_review.title', issues, PR_REVIEW_LIMITS.title, true);
  plain(o.summary, 'pr_review.summary', issues, PR_REVIEW_LIMITS.summary);

  const cited = (v: unknown, path: string, max: number): number => {
    const seen: string[] = [];
    asArray(v, path, issues, max).forEach((r, i) => {
      const id = asString(r, `${path}[${i}]`, issues, { pattern: REF_PATTERN });
      if (seen.includes(id)) issues.list.push(`${path}[${i}]: cited twice`);
      seen.push(id);
      if (typeof r === 'string' && REF_PATTERN.test(id) && !expected.permitted.has(id)) {
        issues.list.push(`${path}[${i}]: ${id} is not evidence of the packet this review was given`);
      }
    });
    return seen.length;
  };
  const narrative = (v: unknown, name: string, max: number, needsEvidence: boolean): number => {
    const list = asArray(v, `pr_review.${name}`, issues, max);
    list.forEach((entry, i) => {
      const p = `pr_review.${name}[${i}]`;
      const e = asObject(entry, p, ['text', 'evidence'], [], issues);
      if (!e) return;
      plain(e.text, `${p}.text`, issues, PR_REVIEW_LIMITS.entry);
      const count = cited(e.evidence, `${p}.evidence`, PR_REVIEW_LIMITS.evidence_per_entry);
      if (needsEvidence && count === 0) issues.list.push(`${p}.evidence: must cite at least one retained record`);
    });
    return list.length;
  };
  const changes = narrative(o.change_analysis, 'change_analysis', PR_REVIEW_LIMITS.change_analysis, true);
  const testing = narrative(o.testing_analysis, 'testing_analysis', PR_REVIEW_LIMITS.list, true);
  narrative(o.risks, 'risks', PR_REVIEW_LIMITS.list, false);
  const texts = (v: unknown, name: string): number => {
    const list = asArray(v, `pr_review.${name}`, issues, PR_REVIEW_LIMITS.list);
    list.forEach((t, i) => plain(t, `pr_review.${name}[${i}]`, issues, PR_REVIEW_LIMITS.entry));
    return list.length;
  };
  const limitations = texts(o.limitations, 'limitations');
  texts(o.reviewer_notes, 'reviewer_notes');
  cited(o.evidence_references, 'pr_review.evidence_references', PR_REVIEW_LIMITS.evidence_references);

  const findings = checkFindings(o.findings, 'pr_review', issues);
  if (findings > PR_REVIEW_LIMITS.findings) issues.list.push(`pr_review.findings: more than ${PR_REVIEW_LIMITS.findings} entries`);
  let serious = 0;
  if (Array.isArray(o.findings)) {
    o.findings.forEach((f, i) => {
      if (typeof f !== 'object' || f === null) return;
      const finding = f as Record<string, unknown>;
      if (finding.classification === 'BLOCKING' || finding.classification === 'MAJOR') serious += 1;
      // A finding someone can act on: what shows it, what follows, what resolves it.
      for (const key of ['target', 'evidence', 'consequence', 'resolution']) {
        const value = finding[key];
        if (typeof value !== 'string') continue;
        if (value.trim().length === 0 && value.length > 0) issues.list.push(`pr_review.findings[${i}].${key}: must not be blank`);
        if (CONTROL.test(value)) issues.list.push(`pr_review.findings[${i}].${key}: contains a control character`);
      }
    });
  }

  checkCoverage(o.coverage, 'pr_review', issues);
  const status = new Map<string, unknown>();
  if (Array.isArray(o.coverage)) {
    if (o.coverage.length > PR_REVIEW_LIMITS.coverage) issues.list.push(`pr_review.coverage: more than ${PR_REVIEW_LIMITS.coverage} entries`);
    o.coverage.forEach((c, i) => {
      if (typeof c !== 'object' || c === null) return;
      const item = (c as Record<string, unknown>).item;
      if (typeof item !== 'string') return;
      if (status.has(item)) issues.list.push(`pr_review.coverage[${i}].item: "${item}" appears twice`);
      status.set(item, (c as Record<string, unknown>).status);
      for (const key of ['item', 'evidence', 'note']) {
        const value = (c as Record<string, unknown>)[key];
        if (typeof value === 'string' && CONTROL.test(value)) issues.list.push(`pr_review.coverage[${i}].${key}: contains a control character`);
      }
    });
  }
  for (const item of PR_REVIEW_COVERAGE) {
    if (!status.has(item)) issues.list.push(`pr_review.coverage: mandatory item "${item}" is missing`);
  }

  // A verdict is accepted only with what makes it mean something.
  if (verdict === 'APPROVE') {
    for (const item of PR_REVIEW_COVERAGE) {
      if (status.has(item) && status.get(item) !== 'CHECKED') {
        issues.list.push(`pr_review.verdict: APPROVE needs "${item}" CHECKED; use INCONCLUSIVE when it was not examined`);
      }
    }
    if (changes === 0) issues.list.push('pr_review.change_analysis: APPROVE needs at least one statement of what changed');
    if (testing === 0) issues.list.push('pr_review.testing_analysis: APPROVE needs at least one statement of what the retained execution establishes');
    if (serious > 0) issues.list.push('pr_review.verdict: APPROVE cannot stand with a BLOCKING or MAJOR finding');
  }
  if (verdict === 'REQUEST_CHANGES' && findings === 0) issues.list.push('pr_review.findings: a REQUEST_CHANGES verdict needs at least one finding');
  if (verdict === 'INCONCLUSIVE' && limitations === 0) {
    issues.list.push('pr_review.limitations: an INCONCLUSIVE verdict must state what prevented a conclusion');
  }
  return finish(issues, () => raw as PrReview);
}
