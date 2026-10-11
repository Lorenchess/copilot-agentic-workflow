// The terminal report: one standalone HTML page rendered from a RunView and
// the retained records the view names. Like the brief, every value that
// came from a record passes through `esc`; the page has no script, no
// remote asset, and only in-page navigation links. It is
// deterministic: the same view gives the same bytes, so a report can be
// regenerated and compared. Nothing in it is an engine authority.

import { parseIntent, parseSpec } from '../contracts/planning.ts';
import { esc } from '../engine/brief.ts';
import type { AttemptView, ExecutionSummary, RunView, StageNode } from './contracts.ts';
import { ROLE_LABELS } from './contracts.ts';

export const REPORT_FORMAT = 'rstack-run-report/v1';
export const MAX_TIMELINE_ENTRIES = 2000;
const MAX_PATHS = 200;
const MAX_TESTS = 300;

const OUTCOME_TEXT: Record<RunView['final_outcome'], string> = {
  LOCAL_PR_PROPOSAL_PREPARED: 'Local PR proposal prepared',
  REJECTED: 'Rejected by the human',
  BLOCKED: 'Blocked',
  WAITING_HUMAN: 'Waiting for a human decision',
  IN_PROGRESS: 'In progress',
  UNREADABLE: 'Unreadable',
};

const STATE_TEXT: Record<StageNode['state'], string> = {
  NOT_REACHED: 'not reached',
  NOT_TAKEN: 'branch not taken',
  CURRENT_IDLE: 'current, nothing dispatched',
  DISPATCHED_AWAITING_RESULT: 'dispatched, awaiting result',
  WAITING_HUMAN: 'waiting for human',
  COMPLETED: 'completed',
  FAILED_ATTEMPT: 'failed pass',
  INVALIDATED: 'invalidated',
  BLOCKED: 'blocked',
  DONE_TERMINAL: 'terminal',
};

const row = (cells: unknown[], tag = 'td'): string => `<tr>${cells.map((c) => `<${tag}>${esc(c)}</${tag}>`).join('')}</tr>`;
const table = (head: string[], rows: unknown[][], none = 'None.'): string =>
  rows.length === 0 ? `<p class="muted">${esc(none)}</p>` : `<table>${row(head, 'th')}${rows.map((r) => row(r)).join('')}</table>`;
const list = (items: string[], none = 'None.'): string => (items.length === 0 ? `<p class="muted">${esc(none)}</p>` : `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
const short = (ref: string | null | undefined): string => (ref ? `${ref.slice(0, 19)}…${ref.slice(-6)}` : '—');
const when = (iso: string | null | undefined): string => iso ?? '—';

function durationText(start: string | null, end: string | null): string {
  if (!start || !end) return 'not available';
  const ms = Date.parse(end) - Date.parse(start);
  if (!Number.isFinite(ms) || ms < 0) return 'not available';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s (journal wall time, first to last committed event)`;
}

function json(records: Map<string, string>, ref: string | null | undefined): Record<string, unknown> | null {
  if (!ref) return null;
  const text = records.get(ref);
  if (text === undefined) return null;
  try {
    const v = JSON.parse(text) as unknown;
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function criteriaRows(view: RunView, records: Map<string, string>): unknown[][] {
  const specRef = view.evidence.find((e) => e.key === 'spec' && e.current)?.ref;
  const specText = specRef ? records.get(specRef) : undefined;
  const spec = specText !== undefined ? parseSpec(specText) : null;
  if (!spec || !spec.ok) return [];
  const proof = json(records, view.evidence.find((e) => e.key === 'proof' && e.current)?.ref);
  const criteria = Array.isArray(proof?.criteria) ? (proof?.criteria as Record<string, unknown>[]) : [];
  const verification = view.executions.filter((e) => e.purpose === 'CANDIDATE_VERIFICATION').at(-1);
  const reported = new Map((verification?.tests ?? []).map((t) => [t.name, t]));
  return spec.value.criteria.map((c) => {
    const p = criteria.find((x) => x.criterion === c.id);
    const tests = Array.isArray(p?.tests) ? (p?.tests as unknown[]).filter((t): t is string => typeof t === 'string') : [];
    const outcomes = tests.map((name) => {
      const t = reported.get(name);
      return t ? `${name}: ${t.status} (${t.kind === 'TEST' ? 'single test' : 'container'})` : `${name}: not reported`;
    });
    return [c.id, c.text, p ? String(p.route) : 'no proof', outcomes.join('; ') || (verification ? 'no test named' : 'no candidate verification')];
  });
}

function intentBlock(view: RunView, records: Map<string, string>): string {
  const ref = view.evidence.find((e) => e.key === 'intent' && e.current)?.ref;
  const text = ref ? records.get(ref) : undefined;
  const intent = text !== undefined ? parseIntent(text) : null;
  if (!intent || !intent.ok) return '<p class="muted">No accepted intent record is readable for this run.</p>';
  return `<p><strong>${esc(intent.value.title)}</strong></p>${table(['Field', 'Text'], Object.entries(intent.value.fields))}`;
}

function executionBlock(e: ExecutionSummary): string {
  const tests = e.tests.slice(0, MAX_TESTS);
  const rest = e.tests.length - tests.length;
  return `<h4>${esc(e.purpose === 'PROOF_BASELINE' ? 'Proof baseline (unchanged application with the controlled tests)' : 'Candidate verification')} — ${esc(e.outcome)}</h4>
<p>Record ${esc(e.ref)}; recorded at ${esc(e.at)} (journal record ${esc(e.seq)}); exit code ${esc(e.exit_code ?? 'none')}${e.timed_out ? '; timed out' : ''}; test command duration ${esc(e.duration_ms)} ms (measured by the engine's executor).</p>
${e.issues.length > 0 ? list(e.issues) : ''}
${table(['Test', 'Kind', 'Status', 'Failure'], tests.map((t) => [t.name, t.kind, t.status, t.failure_kind ?? '']), 'No test reported.')}
${rest > 0 ? `<p class="muted">${esc(rest)} more reported entries are not listed.</p>` : ''}`;
}

function attemptRows(attempts: AttemptView[]): unknown[][] {
  return attempts.map((a) => [
    a.attempt_id,
    ROLE_LABELS[a.role] ?? a.role,
    a.status + (a.superseded ? ' (superseded)' : ''),
    a.dispatched_at,
    a.settled_at ?? '—',
    a.outcome ?? a.failure_kind ?? 'pending',
    a.configured_model ? `${a.configured_model.owner_label} (alias ${a.configured_model.alias}, ${a.configured_model.selector_status})` : 'none',
    'Not observed',
  ]);
}

export function renderReport(view: RunView, records: Map<string, string>): string {
  const outcome = OUTCOME_TEXT[view.final_outcome];
  const tone =
    view.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED' ? 'ok' : view.final_outcome === 'BLOCKED' || view.final_outcome === 'UNREADABLE' ? 'danger' : view.final_outcome === 'WAITING_HUMAN' ? 'human' : 'neutral';
  const terminal = view.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED' || view.final_outcome === 'REJECTED' || view.final_outcome === 'BLOCKED';
  const timeline = view.timeline.slice(-MAX_TIMELINE_ENTRIES);
  const omitted = view.timeline.length - timeline.length;
  const proposal = json(records, view.proposal?.proposal_ref);
  const changes = (proposal?.changes ?? null) as { added?: number; modified?: number; deleted?: number; paths?: { path: string; change: string }[] } | null;
  const paths = Array.isArray(changes?.paths) ? (changes?.paths as { path: string; change: string }[]).slice(0, MAX_PATHS) : [];
  const models = new Map<string, AttemptView['configured_model']>();
  for (const a of view.attempts) if (!models.has(a.role)) models.set(a.role, a.configured_model);
  const roundOf = (a: AttemptView): string => (a.stage_id === 'plan-audit' ? ` (round ${view.reviews.find((r) => r.attempt_id === a.attempt_id)?.round ?? '?'})` : '');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<meta name="color-scheme" content="light dark">
<title>RSTACK run report ${esc(view.run_id)}</title>
<style>
:root{--bg:#f6f7f9;--surface:#ffffff;--line:#d7dbe2;--text:#1b1f27;--muted:#5b6472;--ok:#1b7f4b;--danger:#b3261e;--human:#8a4b00;--info:#2457a8;--neutral:#4b5563;--accent:#2457a8}
@media (prefers-color-scheme: dark){:root:not(:has(#t-light:checked)){--bg:#0f1218;--surface:#171b23;--line:#2a3140;--text:#e6e9ef;--muted:#9aa4b2;--ok:#4cc38a;--danger:#ff6b61;--human:#f0b454;--info:#7eaaff;--neutral:#aab2bf;--accent:#7eaaff}}
:root:has(#t-dark:checked){--bg:#0f1218;--surface:#171b23;--line:#2a3140;--text:#e6e9ef;--muted:#9aa4b2;--ok:#4cc38a;--danger:#ff6b61;--human:#f0b454;--info:#7eaaff;--neutral:#aab2bf;--accent:#7eaaff}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:72rem;margin:0 auto;padding:1.5rem 1rem 4rem}
header.top{display:flex;flex-wrap:wrap;gap:1rem;align-items:baseline;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:1rem;margin-bottom:1.5rem}
h1{font-size:1.45rem;margin:0;letter-spacing:-.01em}h2{font-size:1.15rem;margin:2rem 0 .75rem;border-bottom:1px solid var(--line);padding-bottom:.35rem}h3{font-size:1rem;margin:1.25rem 0 .5rem}h4{font-size:.95rem;margin:1rem 0 .4rem}
.banner{border:1px solid var(--line);border-left:6px solid var(--neutral);background:var(--surface);padding:1rem 1.25rem;border-radius:8px;margin:0 0 1.5rem}
.banner.ok{border-left-color:var(--ok)}.banner.danger{border-left-color:var(--danger)}.banner.human{border-left-color:var(--human)}
.banner strong{font-size:1.2rem}
table{border-collapse:collapse;width:100%;background:var(--surface);font-size:.9rem;margin:.5rem 0}td,th{border:1px solid var(--line);padding:.35rem .55rem;text-align:left;vertical-align:top;word-break:break-word}th{background:color-mix(in srgb,var(--surface) 85%,var(--line))}
code,.ref{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.85em}
.muted{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:.75rem}.card{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:.75rem 1rem}.card .k{color:var(--muted);font-size:.8rem;text-transform:uppercase;letter-spacing:.04em}.card .v{font-weight:600;overflow-wrap:anywhere}
.theme{display:flex;gap:.5rem;align-items:center;font-size:.85rem}.theme label{border:1px solid var(--line);border-radius:999px;padding:.15rem .6rem;cursor:pointer}.theme input{position:absolute;opacity:0;width:1px;height:1px}.theme input:focus-visible+label{outline:2px solid var(--accent);outline-offset:2px}
:root:has(#t-system:checked) label[for=t-system],:root:has(#t-light:checked) label[for=t-light],:root:has(#t-dark:checked) label[for=t-dark]{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.state{display:inline-block;padding:.05rem .5rem;border-radius:999px;border:1px solid var(--line);font-size:.8rem}
footer{margin-top:3rem;color:var(--muted);font-size:.85rem;border-top:1px solid var(--line);padding-top:1rem}
nav{display:flex;flex-wrap:wrap;gap:.5rem 1rem;margin:1rem 0}a{color:var(--accent)}summary{cursor:pointer;font-weight:600;padding:.5rem 0}:target{scroll-margin-top:1rem}details .grid{margin-top:.75rem}
</style>
</head>
<body>
<main>
<header class="top">
<div><h1>RSTACK SDLC run report</h1><div class="muted">Run <code>${esc(view.run_id)}</code> · request ${esc(view.request.request_id ?? '—')} · ${esc(view.workflow.id ?? 'unknown workflow')} v${esc(view.workflow.version ?? '?')} · ${esc(view.workflow.execution_profile === 'STANDARD' ? 'Standard profile' : 'unrecognized execution profile')}</div></div>
<form class="theme" aria-label="Theme"><span class="muted">Theme</span>
<input type="radio" name="theme" id="t-system" checked><label for="t-system">System</label>
<input type="radio" name="theme" id="t-light"><label for="t-light">Light</label>
<input type="radio" name="theme" id="t-dark"><label for="t-dark">Dark</label></form>
</header>

<section class="banner ${tone}" aria-label="Final outcome">
<h2 style="margin-top:0">${esc(view.request.title ?? view.request.request_id ?? view.run_id)}</h2>
${view.request.outcome ? `<p>${esc(view.request.outcome)}</p>` : ''}
<strong>${esc(outcome)}</strong>
<div>${esc(
    view.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED'
      ? `A local proposal file exists at ${view.proposal?.location ?? 'proposal/pr-proposal.json'}. Publication status NOT_ATTEMPTED: no pull request was created by this run.`
      : view.final_outcome === 'BLOCKED'
        ? `${view.engine.blocker?.code ?? 'BLOCKED'}: ${view.engine.blocker?.detail ?? ''}. Nothing further can be recorded for this run; a repaired change needs a new run.`
        : view.final_outcome === 'REJECTED'
          ? 'A human recorded reject at the decision stage; the run ended without implementation.'
          : terminal
            ? ''
            : 'This run is not terminal; the report was generated on request and describes the run as of its last committed record.',
  )}</div>
<div class="muted">Journal version ${esc(view.journal_version)} · source status ${esc(view.source_status)}${view.source_status !== 'CURRENT' ? ` (${esc(view.diagnostic.message ?? view.diagnostic.code ?? '')})` : ''}</div>
${changes ? `<p>Changes: ${esc(changes.added ?? 0)} added, ${esc(changes.modified ?? 0)} modified, ${esc(changes.deleted ?? 0)} deleted.</p>` : ''}
<p class="muted">${esc(view.transport_class === 'SIMULATED' ? 'Simulated role results and reviews. Test execution was recorded by the engine.' : 'Effective host models and model execution times were not observed.')}</p>
</section>

<nav aria-label="Report sections"><a href="#summary">Run summary</a><a href="#intent">Intent</a><a href="#history">Execution history</a><a href="#quality">Quality and verification</a><a href="#operations">Operational summary</a><a href="#evidence">Evidence</a><a href="#timeline">Timeline</a></nav>

<h2 id="summary">Run summary</h2>
<details><summary>Run metadata and identities</summary>
<div class="grid">
<div class="card"><div class="k">Run</div><div class="v"><code>${esc(view.run_id)}</code></div></div>
<div class="card"><div class="k">Application</div><div class="v">${esc(view.application.label ?? 'Unknown')}</div><div class="muted">${esc(view.application.label ? 'from the retained package.json' : 'no name retained')}</div></div>
<div class="card"><div class="k">Request</div><div class="v">${esc(view.request.request_id ?? '—')}</div><div class="muted">${esc(view.request.locator ?? '')} via ${esc(view.request.adapter ?? '—')}</div></div>
<div class="card"><div class="k">Workflow</div><div class="v">${esc(view.workflow.id ?? '—')} v${esc(view.workflow.version ?? '?')}</div><div class="muted ref">${esc(short(view.workflow.ref))}</div></div>
<div class="card"><div class="k">Execution profile</div><div class="v">${esc(view.workflow.execution_profile === 'STANDARD' ? 'Standard' : 'Unknown')}</div></div>
<div class="card"><div class="k">Profile</div><div class="v">${esc(view.profile.id ?? '—')} v${esc(view.profile.version ?? '?')}</div><div class="muted ref">${esc(short(view.profile.ref))}</div></div>
<div class="card"><div class="k">Source identity</div><div class="v ref">${esc(short(view.request.source_ref))}</div></div>
<div class="card"><div class="k">Base tree</div><div class="v ref">${esc(short(view.application.base_ref))}</div></div>
<div class="card"><div class="k">Candidate</div><div class="v ref">${esc(short(view.evidence.find((e) => e.key === 'candidate' && e.current)?.ref))}</div></div>
<div class="card"><div class="k">Started</div><div class="v">${esc(when(view.started_at))}</div></div>
<div class="card"><div class="k">Last committed</div><div class="v">${esc(when(view.last_committed_at))}</div></div>
<div class="card"><div class="k">Duration</div><div class="v">${esc(durationText(view.started_at, view.last_committed_at))}</div></div>
<div class="card"><div class="k">Terminal status</div><div class="v">${esc(view.engine.terminal ?? view.engine.blocker?.code ?? view.engine.phase ?? '—')}</div></div>
<div class="card"><div class="k">Publication</div><div class="v">${esc(view.engine.publication_status ?? '—')}</div></div>
<div class="card"><div class="k">Role results</div><div class="v">${esc(view.transport_class ?? '—')}</div><div class="muted">${esc(view.transport_class === 'SIMULATED' ? 'scripted fixture content, not the work of any model or person' : 'delivered through a manual transport')}</div></div>
</div>

</details>
<h2 id="intent">Intent</h2>
${intentBlock(view, records)}

<h2 id="history">Execution history</h2>
<h3>Stages</h3>
${table(
    ['Stage', 'Kind', 'Role', 'State', 'Attempts', 'Entered', 'Completed'],
    view.stage_graph.map((s) => [s.label, s.kind, s.role ? (ROLE_LABELS[s.role] ?? s.role) : '—', STATE_TEXT[s.state], s.attempt_ids.join(', ') || '—', when(s.entered_at), when(s.completed_at)]),
  )}
<h3>Attempts and retries</h3>
${table(['Attempt', 'Role', 'Status', 'Dispatched', 'Settled', 'Outcome', 'Configured model', 'Effective model'], attemptRows(view.attempts).map((r, i) => [`${String(r[0])}${roundOf(view.attempts[i] as AttemptView)}`, ...r.slice(1)]), 'No attempt was dispatched.')}
<h3>Human decisions</h3>
${table(['Decision', 'Action', 'Recorded at', 'Version', 'Recorded by', 'Provenance', 'Plan status'], view.decisions.map((d) => [d.decision_id, d.action, d.at, d.recorded_version, d.recorded_by, d.provenance, d.plan_status ?? '—']), 'No decision was recorded.')}
<p class="muted">HUMAN_RECORDED is the recorder's claim that a human decided; SCRIPTED decisions come from a script or test. Neither is authentication.</p>
<h3>Audit rounds</h3>
${table(['Round', 'Attempt', 'Verdict', 'Findings', 'Checked', 'Not checked', 'Current'], view.reviews.filter((r) => r.stage_id === 'plan-audit').map((r) => [r.round ?? '?', r.attempt_id, r.verdict, r.findings.map((f) => `${f.id} ${f.classification} ${f.target}`).join('; ') || 'none', r.checked, r.unchecked, r.current ? 'yes' : 'superseded']), 'No audit was accepted.')}
<h3>Warnings and blockers</h3>
${table(['Kind', 'Record', 'At', 'Summary'], view.problems.map((p) => [p.kind, p.seq ?? '—', p.at ?? '—', p.summary]), 'None recorded.')}

<h2 id="quality">Quality and verification</h2>
<h3>Acceptance criteria</h3>
${table(['Criterion', 'Required behavior', 'Proof route', 'In the candidate verification'], criteriaRows(view, records), 'The specification or the proof is not readable from the retained records.')}
<h3>Test executions by the engine</h3>
${view.executions.length === 0 ? '<p class="muted">No execution was recorded.</p>' : view.executions.map(executionBlock).join('\n')}
<h3>Review verdicts</h3>
${table(
    ['Review', 'Attempt', 'Verdict', 'Findings', 'Checked', 'Not checked', 'Limitations', 'Current'],
    view.reviews
      .filter((r) => r.stage_id !== 'plan-audit')
      .map((r) => [r.stage_id === 'review' ? 'Technical review' : 'PR review', r.attempt_id, r.verdict, r.findings.map((f) => `${f.id} ${f.classification} ${f.target}`).join('; ') || 'none', r.checked, r.unchecked, r.limitations.join(' ') || 'none stated', r.current ? 'yes' : 'superseded']),
    'No review was accepted.',
  )}
<h3>Proposal eligibility</h3>
${view.reviews.some((r) => r.current && r.findings.length > 0) ? `<h3>Current findings</h3>${table(['Finding', 'Target', 'Evidence', 'Consequence', 'Recorded resolution'], view.reviews.filter((r) => r.current).flatMap((r) => r.findings.map((f) => [`${f.id} (${f.classification})`, f.target, f.evidence ?? 'Not recorded', f.consequence ?? 'Not recorded', f.resolution ?? 'Not recorded'])))}` : ''}
<p>${esc(
    view.proposal
      ? `Eligible: an accepting technical review and an approving PR review of the packet in force preceded the proposal. Proposal record ${view.proposal.proposal_ref}; title "${view.proposal.title ?? ''}".`
      : view.final_outcome === 'BLOCKED'
        ? `Not eligible: ${view.engine.blocker?.code ?? 'blocked'}.`
        : 'Not eligible: the run did not reach the proposal stage.',
  )}</p>
${changes ? `<p>Measured change, unchanged application to candidate: ${esc(changes.added ?? 0)} added, ${esc(changes.modified ?? 0)} modified, ${esc(changes.deleted ?? 0)} deleted.</p>${table(['Change', 'Path'], paths.map((p) => [p.change, p.path]), 'No path differs.')}${(changes.paths?.length ?? 0) > paths.length ? `<p class="muted">${esc((changes.paths?.length ?? 0) - paths.length)} more paths are in the proposal record.</p>` : ''}` : ''}

<h2 id="operations">Operational summary</h2>
<h3>Model allocation</h3>
${table(['Role', 'Configured (owner label)', 'Alias', 'Selector status', 'Effective model'], [...models.entries()].map(([role, m]) => [ROLE_LABELS[role] ?? role, m?.owner_label ?? 'none', m?.alias ?? '—', m?.selector_status ?? '—', 'Not observed']), 'No role was dispatched.')}
<h3>Timing</h3>
<p>Times are engine commit times of journal records. Model execution time, tokens, and cost are not recorded by the run and are not estimated here.</p>
${table(['Attempt', 'Dispatched', 'Settled', 'Interval'], view.attempts.map((a) => [a.attempt_id, a.dispatched_at, a.settled_at ?? '—', a.settled_at ? durationText(a.dispatched_at, a.settled_at).replace(/ \(.*\)$/, ' (dispatch to settlement; includes coordination and human latency)') : 'pending']), 'No attempt.')}
<h3>Recorded failures and recovery paths</h3>
${list(view.problems.filter((p) => p.kind !== 'BLOCKED').map((p) => `${p.kind}: ${p.summary}`), 'None recorded.')}
<h3>Not observed</h3>
${list(view.not_observed)}

<h2 id="evidence">Evidence references</h2>
${table(['Record', 'Identity', 'Produced by', 'Journal record', 'Current'], view.evidence.map((e) => [e.key, e.ref, e.produced_by, e.seq, e.current ? 'yes' : 'superseded']))}
<p class="muted">Identities are SHA-256 hashes of retained records and file trees under the run directory; they do not name a revision in any repository.</p>

<h2 id="timeline">Timeline</h2>
${omitted > 0 ? `<p class="muted">${esc(omitted)} earlier entries are not listed; the journal holds them.</p>` : ''}
${table(['#', 'At', 'Event', 'Stage', 'Attempt', 'Summary'], timeline.map((t) => [t.seq, t.at, t.type, t.stage_id ?? '', t.attempt_id ?? '', t.summary]))}

<footer>
<p>Provenance: rendered by the RSTACK read model (${esc(REPORT_FORMAT)}, view schema ${esc(view.schema_version)}) from the committed journal of run ${esc(view.run_id)} at journal version ${esc(view.journal_version)} and the records it retained; view digest <span class="ref">${esc(view.view_digest)}</span>. This page is derived evidence: it records nothing and grants no authority. Role results and reviews are ${esc(view.transport_class ?? 'of unknown class')} evidence; test execution is actual local execution by the engine. No host, model, token, or cost observation is included because the run holds none. Publication status: ${esc(view.engine.publication_status ?? 'unknown')}.</p>
</footer>
</main>
</body>
</html>
`;
}
