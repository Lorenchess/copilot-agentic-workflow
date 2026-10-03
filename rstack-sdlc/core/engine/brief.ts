// The combined human brief: one derived HTML view of the plan, its audit,
// and the decision needed. Every value that came from a role, a request, or
// a file passes through `esc`. The page has no script, no remote asset, no
// link, and no form; a content policy forbids them even if one slipped in.
// The decision itself is made through the engine, never from this page.

import type { Audit, Dispositions, Intent, Plan, Spec } from '../contracts/planning.ts';

export interface BriefModel {
  run_id: string;
  request_id: string;
  round: number;
  // The version a decision on this brief must name.
  decision_version: number;
  evidence_class: string;
  allowed_actions: string[];
  refs: Record<string, string>;
  intent: Intent;
  spec: Spec;
  plan: Plan;
  audit: Audit;
  // Present in round two only.
  prior?: { audit: Audit; dispositions: Dispositions };
}

export function esc(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const row = (cells: unknown[], tag = 'td'): string => `<tr>${cells.map((c) => `<${tag}>${esc(c)}</${tag}>`).join('')}</tr>`;
const table = (head: string[], rows: unknown[][]): string =>
  rows.length === 0 ? '<p>None.</p>' : `<table>${row(head, 'th')}${rows.map((r) => row(r)).join('')}</table>`;

const ACTION_TEXT: Record<string, string> = {
  proceed: 'Authorize this plan unchanged.',
  amend: 'Authorize this plan with exact amendments. The amendments will not be audited, and the record will say so.',
  'second-audit': 'Ask the planner to revise and a fresh auditor to examine the revised plan. This is the only further round.',
  pause: 'Record that no decision is made yet.',
  reject: 'End this run.',
};

export function renderBrief(m: BriefModel): string {
  const findings = m.audit.findings.map((f) => [f.id, f.classification, f.target, f.evidence, f.consequence, f.resolution]);
  const unchecked = m.audit.coverage.filter((c) => c.status === 'NOT_CHECKED').length;
  const prior = m.prior
    ? `<h2>Earlier round</h2>
<p>Audit 1 verdict: <strong>${esc(m.prior.audit.verdict)}</strong>, ${esc(m.prior.audit.findings.length)} finding(s). The round-two auditor was not shown that audit or the dispositions below.</p>
${table(['Finding', 'Planner disposition', 'Note'], m.prior.dispositions.dispositions.map((d) => [d.finding_id, d.disposition, d.note]))}`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>Plan decision brief</title>
<style>
body{font-family:system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;line-height:1.45}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #999;padding:.3rem .5rem;text-align:left;vertical-align:top}
pre{white-space:pre-wrap;background:#f4f4f4;padding:.6rem}.note{border-left:4px solid #999;padding-left:.8rem}
</style>
</head>
<body>
<h1>Plan decision brief, round ${esc(m.round)}</h1>
<p class="note">Run ${esc(m.run_id)}, request ${esc(m.request_id)}, decision version ${esc(m.decision_version)}. Role results in this run: <strong>${esc(m.evidence_class)}</strong>. This page is a derived view; it records nothing. A decision is recorded only through the engine; it must name this decision version and applies to the identities listed at the end.</p>

<h2>Decision needed</h2>
<p>Audit verdict: <strong>${esc(m.audit.verdict)}</strong> with ${esc(m.audit.findings.length)} finding(s); ${esc(unchecked)} of ${esc(m.audit.coverage.length)} coverage item(s) were not checked. A verdict that the plan holds is not an authorization: a human decision is required either way.</p>
${table(['Action', 'Meaning'], m.allowed_actions.map((a) => [a, ACTION_TEXT[a] ?? '']))}

<h2>Intent: ${esc(m.intent.title)}</h2>
${table(['Field', 'Text'], Object.entries(m.intent.fields))}

<h2>Specification: ${esc(m.spec.title)}</h2>
${table(['Criterion', 'Required behavior'], m.spec.criteria.map((c) => [c.id, c.text]))}

<h2>Plan: ${esc(m.plan.title)}</h2>
<p>Source basis: ${esc(m.plan.source_basis)}</p>
${table(['Unit', 'Title', 'Criteria', 'Depends on', 'Work', 'Proof'], m.plan.units.map((u) => [u.id, u.title, u.acceptance_criteria.join(', '), u.depends_on.join(', '), u.work, u.proof]))}
<h3>Material claims</h3>
${table(['Claim', 'Text', 'Evidence'], m.plan.claims.map((c) => [c.id, c.text, c.evidence]))}

<h2>Audit</h2>
<h3>Findings</h3>
${table(['Finding', 'Class', 'Target', 'Evidence', 'Consequence', 'Resolution condition'], findings)}
<h3>Coverage</h3>
${table(['Item', 'Status', 'Evidence cited', 'Note'], m.audit.coverage.map((c) => [c.item, c.status, c.evidence, c.note]))}
<h3>Limitations</h3>
${m.audit.limitations.length === 0 ? '<p>None stated.</p>' : `<ul>${m.audit.limitations.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`}
${prior}
<h2>Identities shown</h2>
${table(['Record', 'Identity'], Object.entries(m.refs))}
</body>
</html>
`;
}
