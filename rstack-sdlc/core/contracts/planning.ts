// Planning records: intent (why), specification (what), plan (how), audit,
// finding dispositions, and the finalized plan. One canonical format each:
// Markdown for intent and specification, JSON for the rest. These parsers are
// deterministic checks on shape and cross-references. They do not judge
// whether the content is right; that is the audit's and the human's job.

import {
  type Issues,
  type Parsed,
  asObject,
  asOneOf,
  asString,
  checkVersion,
  finish,
  newIssues,
  parseJson,
} from './validate.ts';
import { REF_PATTERN } from './records.ts';

const MAX_TEXT = 4000;
const UNIT_ID = /^U[0-9]{1,3}$/;
const CLAIM_ID = /^C[0-9]{1,3}$/;
const FINDING_ID = /^F[0-9]{1,3}$/;
const AMENDMENT_ID = /^A[0-9]{1,3}$/;
const AC_ID = /^AC-[0-9]{1,3}$/;

// ---------------------------------------------------------------- intent

export const INTENT_FIELDS = ['Problem', 'Outcome', 'Scope', 'Source', 'Open decisions'] as const;

export interface Intent {
  title: string;
  fields: Record<(typeof INTENT_FIELDS)[number], string>;
  open_decisions: boolean;
}

// "# Intent: <title>" followed by one labelled paragraph per field. A field
// runs until the next label. "Open decisions: None." is the only closed form.
export function parseIntent(text: string): Parsed<Intent> {
  const issues = newIssues();
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  const title = /^# Intent: (.+)$/.exec(lines[0] ?? '')?.[1]?.trim() ?? '';
  if (!title) issues.list.push('intent: first line must be "# Intent: <title>"');
  const fields: Record<string, string> = {};
  let current: string | null = null;
  for (const line of lines.slice(1)) {
    const label = INTENT_FIELDS.find((f) => line.startsWith(`${f}:`));
    if (label) {
      if (label in fields) issues.list.push(`intent: field "${label}" appears twice`);
      current = label;
      fields[label] = line.slice(label.length + 1).trim();
    } else if (current) {
      fields[current] = `${fields[current]}\n${line}`.trim();
    } else if (line.trim()) {
      issues.list.push('intent: text before the first labelled field');
    }
  }
  for (const f of INTENT_FIELDS) {
    if (!fields[f]) issues.list.push(`intent: field "${f}" is missing or empty`);
    else if (fields[f].length > MAX_TEXT) issues.list.push(`intent: field "${f}" is too long`);
  }
  const open = !/^none\.?$/i.test(fields['Open decisions'] ?? '');
  return finish(issues, () => ({ title, fields: fields as Intent['fields'], open_decisions: open }));
}

// ---------------------------------------------------------------- specification

export interface Spec {
  title: string;
  intent: string;
  criteria: { id: string; text: string }[];
}

// "# Specification: <title>", an "Intent:" line, and criteria "AC-n: text".
export function parseSpec(text: string): Parsed<Spec> {
  const issues = newIssues();
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  const title = /^# Specification: (.+)$/.exec(lines[0] ?? '')?.[1]?.trim() ?? '';
  if (!title) issues.list.push('spec: first line must be "# Specification: <title>"');
  let intent = '';
  const criteria: Spec['criteria'] = [];
  let last: { id: string; text: string } | null = null;
  for (const line of lines.slice(1)) {
    const ac = /^(AC-[0-9]{1,3}): (.+)$/.exec(line);
    if (ac) {
      last = { id: ac[1] as string, text: (ac[2] as string).trim() };
      if (criteria.some((c) => c.id === last?.id)) issues.list.push(`spec: ${last.id} appears twice`);
      criteria.push(last);
    } else if (line.startsWith('Intent:')) {
      intent = line.slice('Intent:'.length).trim();
      last = null;
    } else if (/^[A-Z][A-Za-z ]{0,30}:/.test(line) || !line.trim()) {
      last = null;
    } else if (last) {
      last.text = `${last.text} ${line.trim()}`;
    }
  }
  if (!intent) issues.list.push('spec: an "Intent:" line is required');
  if (criteria.length === 0) issues.list.push('spec: at least one acceptance criterion "AC-n: ..." is required');
  for (const c of criteria) if (c.text.length > MAX_TEXT) issues.list.push(`spec: ${c.id} is too long`);
  return finish(issues, () => ({ title, intent, criteria }));
}

// ---------------------------------------------------------------- plan

export interface PlanUnit {
  id: string;
  title: string;
  acceptance_criteria: string[];
  depends_on: string[];
  work: string;
  proof: string;
}

export interface PlanClaim {
  id: string;
  text: string;
  evidence: string;
}

export interface Plan {
  schema_version: 1;
  record_type: 'plan';
  title: string;
  source_basis: string;
  units: PlanUnit[];
  claims: PlanClaim[];
}

export function asArray(v: unknown, path: string, issues: Issues, max = 50): unknown[] {
  if (!Array.isArray(v)) {
    issues.list.push(`${path}: expected a list`);
    return [];
  }
  if (v.length > max) issues.list.push(`${path}: more than ${max} entries`);
  return v;
}

function idList(v: unknown, path: string, pattern: RegExp, issues: Issues): string[] {
  return asArray(v, path, issues).map((x, i) => asString(x, `${path}[${i}]`, issues, { pattern }));
}

// `criteria` are the acceptance-criterion ids of the specification this plan
// answers: every one must be carried by a unit, and no other id may appear.
export function parsePlan(text: string, criteria: readonly string[]): Parsed<Plan> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(raw, 'plan', ['schema_version', 'record_type', 'title', 'source_basis', 'units', 'claims'], [], issues);
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'plan.schema_version', issues);
  if (o.record_type !== 'plan') issues.list.push('plan.record_type: expected "plan"');
  asString(o.title, 'plan.title', issues, { max: 200 });
  asString(o.source_basis, 'plan.source_basis', issues, { max: MAX_TEXT });

  const seen: string[] = [];
  const covered = new Set<string>();
  const units = asArray(o.units, 'plan.units', issues);
  if (units.length === 0) issues.list.push('plan.units: at least one unit is required');
  units.forEach((u, i) => {
    const p = `plan.units[${i}]`;
    const unit = asObject(u, p, ['id', 'title', 'acceptance_criteria', 'depends_on', 'work', 'proof'], [], issues);
    if (!unit) return;
    const id = asString(unit.id, `${p}.id`, issues, { pattern: UNIT_ID });
    if (seen.includes(id)) issues.list.push(`${p}.id: "${id}" appears twice`);
    asString(unit.title, `${p}.title`, issues, { max: 200 });
    asString(unit.work, `${p}.work`, issues, { max: MAX_TEXT });
    asString(unit.proof, `${p}.proof`, issues, { max: MAX_TEXT });
    for (const ac of idList(unit.acceptance_criteria, `${p}.acceptance_criteria`, AC_ID, issues)) {
      if (!criteria.includes(ac)) issues.list.push(`${p}.acceptance_criteria: "${ac}" is not in the specification`);
      covered.add(ac);
    }
    // A unit may depend only on units listed before it, which also rules out cycles.
    for (const dep of idList(unit.depends_on, `${p}.depends_on`, UNIT_ID, issues)) {
      if (!seen.includes(dep)) issues.list.push(`${p}.depends_on: "${dep}" is not an earlier unit`);
    }
    seen.push(id);
  });
  for (const ac of criteria) {
    if (!covered.has(ac)) issues.list.push(`plan.units: no unit carries ${ac}`);
  }

  const claimIds: string[] = [];
  asArray(o.claims, 'plan.claims', issues).forEach((c, i) => {
    const p = `plan.claims[${i}]`;
    const claim = asObject(c, p, ['id', 'text', 'evidence'], [], issues);
    if (!claim) return;
    const id = asString(claim.id, `${p}.id`, issues, { pattern: CLAIM_ID });
    if (claimIds.includes(id)) issues.list.push(`${p}.id: "${id}" appears twice`);
    claimIds.push(id);
    asString(claim.text, `${p}.text`, issues, { max: MAX_TEXT });
    asString(claim.evidence, `${p}.evidence`, issues, { max: MAX_TEXT });
  });
  return finish(issues, () => raw as Plan);
}

// ---------------------------------------------------------------- audit

// INCONCLUSIVE is the explicit unknown: the auditor could not establish either way.
export const VERDICTS = ['HOLDS', 'REFUTED', 'INCONCLUSIVE'] as const;
export const CLASSIFICATIONS = ['BLOCKING', 'MAJOR', 'MINOR'] as const;
export const COVERAGE_STATUSES = ['CHECKED', 'NOT_CHECKED'] as const;

export interface Finding {
  id: string;
  target: string;
  classification: (typeof CLASSIFICATIONS)[number];
  evidence: string;
  consequence: string;
  resolution: string;
}

export interface Audit {
  schema_version: 1;
  record_type: 'audit-result';
  subject: { plan: string; spec: string };
  verdict: (typeof VERDICTS)[number];
  coverage: Coverage[];
  findings: Finding[];
  limitations: string[];
}

export type Coverage = { item: string; status: (typeof COVERAGE_STATUSES)[number]; evidence: string; note: string };

// Coverage is how a reader tells an examination from an assumption. A checked
// item must say what was looked at; an unchecked item must cite nothing and
// say why not. Returns the number of checked items. Shared by audits and reviews.
export function checkCoverage(v: unknown, what: string, issues: Issues): number {
  let checked = 0;
  const coverage = asArray(v, `${what}.coverage`, issues);
  if (coverage.length === 0) issues.list.push(`${what}.coverage: the record must state what was examined`);
  coverage.forEach((c, i) => {
    const p = `${what}.coverage[${i}]`;
    const item = asObject(c, p, ['item', 'status', 'evidence', 'note'], [], issues);
    if (!item) return;
    asString(item.item, `${p}.item`, issues, { max: 300 });
    const status = asOneOf(item.status, `${p}.status`, COVERAGE_STATUSES, issues);
    const evidence = asString(item.evidence, `${p}.evidence`, issues, { max: MAX_TEXT, allowEmpty: true });
    const note = asString(item.note, `${p}.note`, issues, { max: MAX_TEXT, allowEmpty: true });
    if (status === 'CHECKED') {
      checked += 1;
      if (!evidence.trim()) issues.list.push(`${p}.evidence: a CHECKED item must cite what was examined`);
    } else {
      if (evidence.trim()) issues.list.push(`${p}.evidence: a NOT_CHECKED item cannot cite examination evidence`);
      if (!note.trim()) issues.list.push(`${p}.note: a NOT_CHECKED item must say why it was not checked`);
    }
  });
  return checked;
}

// Returns the number of findings.
export function checkFindings(v: unknown, what: string, issues: Issues): number {
  const ids: string[] = [];
  const findings = asArray(v, `${what}.findings`, issues);
  findings.forEach((f, i) => {
    const p = `${what}.findings[${i}]`;
    const finding = asObject(f, p, ['id', 'target', 'classification', 'evidence', 'consequence', 'resolution'], [], issues);
    if (!finding) return;
    const id = asString(finding.id, `${p}.id`, issues, { pattern: FINDING_ID });
    if (ids.includes(id)) issues.list.push(`${p}.id: "${id}" appears twice`);
    ids.push(id);
    asString(finding.target, `${p}.target`, issues, { max: 300 });
    asOneOf(finding.classification, `${p}.classification`, CLASSIFICATIONS, issues);
    asString(finding.evidence, `${p}.evidence`, issues, { max: MAX_TEXT });
    asString(finding.consequence, `${p}.consequence`, issues, { max: MAX_TEXT });
    asString(finding.resolution, `${p}.resolution`, issues, { max: MAX_TEXT });
  });
  return findings.length;
}

// `subject` is what the auditor was actually given. An audit that names any
// other plan or specification is rejected, so a verdict cannot be carried
// over to a subject it did not examine.
export function parseAudit(text: string, subject: { plan: string; spec: string }): Parsed<Audit> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(
    raw,
    'audit',
    ['schema_version', 'record_type', 'subject', 'verdict', 'coverage', 'findings', 'limitations'],
    [],
    issues,
  );
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'audit.schema_version', issues);
  if (o.record_type !== 'audit-result') issues.list.push('audit.record_type: expected "audit-result"');
  const s = asObject(o.subject, 'audit.subject', ['plan', 'spec'], [], issues);
  if (s) {
    if (asString(s.plan, 'audit.subject.plan', issues, { pattern: REF_PATTERN }) !== subject.plan) {
      issues.list.push('audit.subject.plan: is not the plan this audit was given');
    }
    if (asString(s.spec, 'audit.subject.spec', issues, { pattern: REF_PATTERN }) !== subject.spec) {
      issues.list.push('audit.subject.spec: is not the specification this audit was given');
    }
  }
  const verdict = asOneOf(o.verdict, 'audit.verdict', VERDICTS, issues);

  const checked = checkCoverage(o.coverage, 'audit', issues);
  const findings = checkFindings(o.findings, 'audit', issues);
  if (verdict === 'REFUTED' && findings === 0) {
    issues.list.push('audit.findings: a REFUTED verdict needs at least one finding');
  }
  // Objective consistency only: a verdict that the plan holds needs at least one
  // examined item behind it. Whether the examination was sound is not decided here.
  if (verdict === 'HOLDS' && checked === 0) {
    issues.list.push('audit.verdict: HOLDS needs at least one CHECKED coverage item; use INCONCLUSIVE when nothing was examined');
  }
  const limitations = asArray(o.limitations, 'audit.limitations', issues);
  limitations.forEach((l, i) => asString(l, `audit.limitations[${i}]`, issues, { max: MAX_TEXT }));
  if (verdict === 'INCONCLUSIVE' && limitations.length === 0) {
    issues.list.push('audit.limitations: an INCONCLUSIVE verdict must state what prevented a conclusion');
  }
  return finish(issues, () => raw as Audit);
}

// ---------------------------------------------------------------- dispositions

export const DISPOSITIONS = ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED'] as const;

export interface Dispositions {
  schema_version: 1;
  record_type: 'finding-dispositions';
  audit: string;
  dispositions: { finding_id: string; disposition: (typeof DISPOSITIONS)[number]; note: string }[];
}

// One concise disposition per finding of the audit being answered: no more,
// no fewer.
export function parseDispositions(text: string, auditRef: string, findingIds: readonly string[]): Parsed<Dispositions> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(raw, 'dispositions', ['schema_version', 'record_type', 'audit', 'dispositions'], [], issues);
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'dispositions.schema_version', issues);
  if (o.record_type !== 'finding-dispositions') issues.list.push('dispositions.record_type: expected "finding-dispositions"');
  if (o.audit !== auditRef) issues.list.push('dispositions.audit: is not the audit being answered');
  const seen: string[] = [];
  asArray(o.dispositions, 'dispositions.dispositions', issues).forEach((d, i) => {
    const p = `dispositions.dispositions[${i}]`;
    const item = asObject(d, p, ['finding_id', 'disposition', 'note'], [], issues);
    if (!item) return;
    const id = asString(item.finding_id, `${p}.finding_id`, issues, { pattern: FINDING_ID });
    if (!findingIds.includes(id)) issues.list.push(`${p}.finding_id: "${id}" is not a finding of that audit`);
    if (seen.includes(id)) issues.list.push(`${p}.finding_id: "${id}" appears twice`);
    seen.push(id);
    asOneOf(item.disposition, `${p}.disposition`, DISPOSITIONS, issues);
    asString(item.note, `${p}.note`, issues, { max: 600 });
  });
  for (const id of findingIds) {
    if (!seen.includes(id)) issues.list.push(`dispositions.dispositions: finding ${id} has no disposition`);
  }
  return finish(issues, () => raw as Dispositions);
}

// ---------------------------------------------------------------- amendments and the final plan

export interface Amendment {
  id: string;
  target: string;
  text: string;
}

export function checkAmendments(v: unknown, path: string, issues: Issues): void {
  const list = asArray(v, path, issues, 20);
  if (list.length === 0) issues.list.push(`${path}: at least one amendment is required`);
  const ids: string[] = [];
  list.forEach((a, i) => {
    const p = `${path}[${i}]`;
    const item = asObject(a, p, ['id', 'target', 'text'], [], issues);
    if (!item) return;
    const id = asString(item.id, `${p}.id`, issues, { pattern: AMENDMENT_ID });
    if (ids.includes(id)) issues.list.push(`${p}.id: "${id}" appears twice`);
    ids.push(id);
    asString(item.target, `${p}.target`, issues, { pattern: /^(plan|U[0-9]{1,3})$/ });
    asString(item.text, `${p}.text`, issues, { max: MAX_TEXT });
  });
}

export type PlanStatus = 'AS_AUDITED' | 'AMENDED_NOT_REAUDITED';

// The plan the human authorized. It keeps the audited identity and the audit
// apart from the amendments, so an amended plan is never presented as audited.
export interface FinalPlan {
  schema_version: 1;
  record_type: 'plan-final';
  run_id: string;
  decision_id: string;
  plan_status: PlanStatus;
  last_audited_plan: string;
  audit: string;
  audit_round: number;
  audit_verdict: Audit['verdict'];
  // The decision that authorized this plan and the brief it was shown with.
  // Provenance of the authorization is read from the decision record.
  decision: string;
  brief: string;
  // Acceptance criteria come from this specification and nowhere else.
  // Amendments change the plan; they do not add, remove, or reword criteria.
  specification: string;
  intent: string;
  criteria_basis: 'SPECIFICATION';
  amendments: Amendment[];
  amendments_audited: false;
  residual_findings: { id: string; classification: Finding['classification']; target: string }[];
  // What the audit did not examine, carried forward so a reader of this record
  // alone does not take the verdict as unqualified.
  audit_unchecked: { item: string; note: string }[];
  audit_checked_items: number;
  required_proof: { unit: string; acceptance_criteria: string[]; proof: string }[];
}

export function buildFinalPlan(input: {
  run_id: string;
  decision_id: string;
  plan_ref: string;
  plan: Plan;
  audit_ref: string;
  audit: Audit;
  round: number;
  amendments: Amendment[];
  decision_ref: string;
  brief_ref: string;
  spec_ref: string;
  intent_ref: string;
}): FinalPlan {
  return {
    schema_version: 1,
    record_type: 'plan-final',
    run_id: input.run_id,
    decision_id: input.decision_id,
    plan_status: input.amendments.length > 0 ? 'AMENDED_NOT_REAUDITED' : 'AS_AUDITED',
    last_audited_plan: input.plan_ref,
    audit: input.audit_ref,
    audit_round: input.round,
    audit_verdict: input.audit.verdict,
    decision: input.decision_ref,
    brief: input.brief_ref,
    specification: input.spec_ref,
    intent: input.intent_ref,
    criteria_basis: 'SPECIFICATION',
    amendments: input.amendments,
    amendments_audited: false,
    audit_unchecked: input.audit.coverage.filter((c) => c.status === 'NOT_CHECKED').map((c) => ({ item: c.item, note: c.note })),
    audit_checked_items: input.audit.coverage.filter((c) => c.status === 'CHECKED').length,
    residual_findings: input.audit.findings.map((f) => ({ id: f.id, classification: f.classification, target: f.target })),
    required_proof: input.plan.units.map((u) => ({ unit: u.id, acceptance_criteria: u.acceptance_criteria, proof: u.proof })),
  };
}
