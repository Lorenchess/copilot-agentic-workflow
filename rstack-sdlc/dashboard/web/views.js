// Panels and tabs of the Inspect view. Everything is built with `h`, which
// sets text through textContent: no record text ever becomes markup. Each
// state carries a glyph, a label, and a colour. Nothing here animates; the
// Live view's motion is started only by committed events (motion.js).

import { roleBadge as badgeFor, roleToken } from './derive.js';

export const STATE_TEXT = {
  NOT_REACHED: 'Not reached',
  NOT_TAKEN: 'Branch not taken',
  CURRENT_IDLE: 'Current, nothing dispatched',
  DISPATCHED_AWAITING_RESULT: 'Dispatched, awaiting result',
  WAITING_HUMAN: 'Waiting for a human',
  COMPLETED: 'Completed',
  FAILED_ATTEMPT: 'Failed pass',
  INVALIDATED: 'Invalidated',
  BLOCKED: 'Blocked',
  DONE_TERMINAL: 'Terminal',
};

export const STATE_GLYPH = {
  NOT_REACHED: '○',
  NOT_TAKEN: '◌',
  CURRENT_IDLE: '◎',
  DISPATCHED_AWAITING_RESULT: '◇',
  WAITING_HUMAN: '!',
  COMPLETED: '✓',
  FAILED_ATTEMPT: '×',
  INVALIDATED: '↺',
  BLOCKED: '■',
  DONE_TERMINAL: '✓',
};

export const OUTCOME_TEXT = {
  IN_PROGRESS: 'In progress',
  WAITING_HUMAN: 'Waiting for you',
  LOCAL_PR_PROPOSAL_PREPARED: 'Completed: local proposal',
  REJECTED: 'Rejected',
  BLOCKED: 'Blocked',
  UNREADABLE: 'Unreadable',
};

export const OUTCOME_TONE = {
  IN_PROGRESS: 'info',
  WAITING_HUMAN: 'human',
  LOCAL_PR_PROPOSAL_PREPARED: 'ok',
  REJECTED: 'neutral',
  BLOCKED: 'danger',
  UNREADABLE: 'danger',
};

const ROLE_LABELS = { planner: 'Planner', 'plan-auditor': 'Plan Auditor', tester: 'Tester', developer: 'Developer', reviewer: 'Code Reviewer', 'pr-reviewer': 'PR Reviewer' };
const ACTION_TEXT = {
  proceed: 'authorize the audited plan unchanged',
  amend: 'authorize with exact amendments, not re-audited',
  'second-audit': 'ask for one more planning round and a fresh audit',
  pause: 'record that no decision is made yet',
  reject: 'end this run',
  answer: 'answer the open product decisions',
};
const ACTION_LABEL = { proceed: 'Proceed', amend: 'Amend', 'second-audit': 'Request a second audit', pause: 'Pause', reject: 'Reject', answer: 'Answer' };

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}

export function fmtTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
}

export function ago(iso, now = Date.now()) {
  if (!iso) return 'never';
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function shortRef(ref) {
  return ref ? `${ref.slice(7, 15)}…${ref.slice(-4)}` : '—';
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || '—';
}

export function na(text = 'Not observed') {
  return h('span', { class: 'na' }, text);
}

export function kv(pairs) {
  const dl = h('dl', { class: 'kv' });
  for (const pair of pairs) {
    if (!pair) continue;
    const [k, v] = pair;
    if (v === undefined) continue;
    dl.append(h('dt', {}, k), h('dd', {}, v === null ? na() : v));
  }
  return dl;
}

export function pill(tone, text, extra = {}) {
  return h('span', { class: `pill ${tone}`, ...extra }, h('span', { class: 'dot', 'aria-hidden': 'true' }), text);
}

export function stateGlyph(state) {
  const tone = state === 'COMPLETED' || state === 'DONE_TERMINAL' ? 'ok' : state === 'WAITING_HUMAN' || state === 'INVALIDATED' ? 'human' : state === 'BLOCKED' || state === 'FAILED_ATTEMPT' ? 'danger' : state === 'DISPATCHED_AWAITING_RESULT' || state === 'CURRENT_IDLE' ? 'info' : 'neutral';
  return h('span', { class: `glyph state-${tone}`, 'aria-hidden': 'true' }, STATE_GLYPH[state] || '○');
}

export function refButton(ref, ctx, label) {
  if (!ref) return na('—');
  if (!ctx.canOpen(ref)) return refMetadata(ref, label, 'Record unavailable');
  return h('button', { type: 'button', class: 'ref-btn', 'data-focus': `ref-${label || ''}-${ref}`, title: ref, onclick: () => ctx.openArtifact(ref, label) }, label ? `${label} ${shortRef(ref)}` : shortRef(ref));
}

function refMetadata(ref, label, description) {
  const feedback = h('span', { class: 'visually-hidden', role: 'status' });
  const copy = h('button', {
    type: 'button', class: 'btn quiet', 'data-focus': `copy-${label}-${ref}`, 'aria-label': `Copy ${label || 'identity'}`,
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(ref);
        copy.textContent = 'Copied';
        feedback.textContent = 'Identity copied';
      } catch {
        feedback.className = 'hint';
        feedback.textContent = `Copy manually: ${ref}`;
      }
    },
  }, 'Copy');
  return h('span', { class: 'ref-metadata' }, h('span', { class: 'ref', title: ref }, `${label || 'Identity'} ${shortRef(ref)}`), h('span', { class: 'hint' }, description), copy, feedback);
}

export function technicalDetails(key, ...content) {
  return h('details', { class: 'technical', 'data-view-key': key }, h('summary', {}, 'Technical details'), ...content);
}

function findingList(findings) {
  return h('ul', { class: 'findings' }, findings.map((f) => h('li', {},
    h('strong', {}, `${f.id} · ${f.classification} · ${f.target}`),
    kv([
      ['Evidence', f.evidence || 'Not recorded'],
      ['Consequence', f.consequence || 'Not recorded'],
      ['Recorded resolution', f.resolution || 'Not recorded'],
    ]),
  )));
}

// ---------------------------------------------------------------- bands

export function humanBand(view, ctx) {
  const ha = view.human_action;
  const audit = ha.audit;
  const planActions = ha.allowed_actions.map((a) => h('li', {}, h('code', { class: 'action' }, a), ` ${ACTION_LABEL[a] || a}: ${ACTION_TEXT[a] || a}.`));
  const read = ha.read
    ? ha.awaiting === 'PLAN_DECISION'
      ? h('button', { type: 'button', class: 'btn primary', 'data-focus': 'read-brief', onclick: () => ctx.openBrief(ha.round) }, `Review decision brief (round ${ha.round})`)
      : h('button', { type: 'button', class: 'btn primary', 'data-focus': 'read-intent', onclick: () => ctx.openArtifact(ha.subjects.intent, 'intent.md') }, 'Review open product decisions')
    : null;
  const last = ha.last_decision;
  return h('section', { class: 'band human', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', 'data-testid': 'human-band' },
    h('h2', {}, ha.paused ? 'Paused: a decision from you is still needed' : 'A decision from you is needed'),
    h('p', { class: 'howto' }, audit ? `Audit round ${ha.round}: ${audit.verdict}. ${audit.blocking} blocking finding(s); ${audit.unchecked} item(s) not checked.` : ha.open_decisions || ha.reason),
    h('div', { class: 'cols' },
      h('div', { class: 'decision-next' },
        read,
        h('p', { class: 'howto' }, 'Read the brief or intent, then state your decision in the Coordinator chat. Decisions are recorded there; this dashboard is read-only.'),
        ha.open_decisions ? h('p', { class: 'howto' }, ha.open_decisions) : null,
      ),
      h('div', {}, h('p', { class: 'howto' }, 'Available decisions in the Coordinator'), h('ul', { class: 'decision-options' }, planActions)),
    ),
    technicalDetails('human', kv([
        ['Phase', `${view.engine.phase} at ${stageLabel(view, ha.stage_id)}`],
        ['Awaiting', ha.awaiting === 'PLAN_DECISION' ? `plan decision, round ${ha.round}` : `product question, round ${view.engine.question_rounds + 1}`],
        ['Expected version', String(ha.expected_version)],
        ['Waiting since', fmtTime(ha.waiting_since)],
        audit ? ['Audit', `${audit.verdict}; ${audit.findings} finding(s), ${audit.blocking} blocking; ${audit.unchecked} item(s) not checked`] : undefined,
        ha.open_decisions ? ['Open decisions', ha.open_decisions] : undefined,
        ['Read', ha.read],
        ['Decision state', ha.decision_state === 'PAUSED' ? 'paused by the last decision' : 'awaiting a decision; none recorded for this round'],
        ['Last recorded decision', last ? `${last.decision_id}: ${last.action}, ${last.provenance}, recorded by "${last.recorded_by}" at ${fmtTime(last.at)}` : 'none'],
      ]), h('p', { class: 'hint' }, 'The Coordinator records the decision through ', h('code', {}, `decide --action <action> --expected-version ${ha.expected_version}`), ' with your name as recorder.')),
  );
}

export function blockedBand(view, report) {
  const b = view.engine.blocker;
  const review = view.reviews.find((r) => (r.stage_id === 'pr-review' || r.stage_id === 'review') && r.current && r.findings.length > 0);
  return h('section', { class: 'band danger', role: 'alert', 'data-testid': 'blocked-band' },
    h('h2', {}, `Blocked: ${b ? b.code : 'unknown blocker'}`),
    h('p', { class: 'howto' }, b ? b.detail : ''),
    h('p', { class: 'howto' }, 'No recovery path is recorded for a blocked run: the engine accepts no further event. A repaired change needs a new run.'),
    review ? findingList(review.findings) : null,
    report && report.available
      ? h('div', {}, h('a', { class: 'btn', href: `/api/v1/runs/${encodeURIComponent(view.run_id)}/report`, target: '_blank', rel: 'noopener', 'data-testid': 'report-link' }, 'Open the HTML report'), technicalDetails('blocked-report', h('p', { class: 'hint mono' }, report.path)))
      : null,
  );
}

export function doneBand(view, report, ctx) {
  const done = view.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED';
  return h('section', { class: `band ${done ? 'ok' : ''}`, role: 'status', 'data-testid': 'done-band' },
    h('h2', {}, done ? 'Completed: a local PR proposal is prepared' : 'Ended: rejected by the human'),
    h('p', { class: 'howto' }, done
      ? 'The local proposal is ready to review. No pull request has been published.'
      : 'A human recorded reject; the run ended without implementation.'),
    h('div', { class: 'actions' },
      report.available
        ? h('a', { class: 'btn', href: `/api/v1/runs/${encodeURIComponent(view.run_id)}/report`, target: '_blank', rel: 'noopener', 'data-testid': 'report-link' }, 'Open the HTML report')
        : h('span', { class: 'hint' }, 'The HTML report has not been generated yet; it appears here once written.'),
      view.proposal ? refButton(view.proposal.proposal_ref, ctx, 'proposal') : null,
    ),
    technicalDetails('completed', kv([
      ['Proposal location', view.proposal?.location || '—'],
      ['Publication', view.engine.publication_status || '—'],
      ['Report location', report.path || '—'],
    ])),
  );
}

export function unreadableBand(view) {
  return h('section', { class: 'band danger', role: 'alert' },
    h('h2', {}, `Run records are ${view.source_status.toLowerCase().replaceAll('_', ' ')}`),
    h('p', { class: 'howto' }, `${view.diagnostic.code || ''}: ${view.diagnostic.message || 'the run cannot be read by this viewer'}${view.diagnostic.record ? ` (journal record ${view.diagnostic.record})` : ''}.`),
    h('p', { class: 'howto' }, 'Nothing below is a replayed state. The viewer does not reinterpret or repair run records.'),
  );
}

export function stageLabel(view, id) {
  const s = view.stage_graph.find((x) => x.stage_id === id);
  return s ? s.label : id || '—';
}

// ---------------------------------------------------------------- now panel

// The stage, and who holds it when that adds something ("Developer", not "Developer, Developer").
function nowTitle(view, a) {
  const stage = stageLabel(view, a.stage_id);
  if (a.kind === 'role') return roleLabel(a.role) === stage ? stage : `${stage}, ${roleLabel(a.role)}`;
  if (a.kind === 'human') return `${stage}, you`;
  if (a.kind === 'deterministic') return `${stage}, engine step`;
  return stage;
}

export function nowPanel(view) {
  const a = view.current_activity;
  const model = a.configured_model;
  const pending = a.dispatch_status === 'DISPATCHED_AWAITING_RESULT';
  const attempt = a.attempt_id ? view.attempts.find((x) => x.attempt_id === a.attempt_id) : null;
  return h('section', { class: 'panel', 'aria-label': 'Current activity', 'data-testid': 'now-panel' },
    h('h2', {}, 'Now'),
    h('div', { class: 'content' },
      h('div', { class: 'big' }, nowTitle(view, a)),
      kv([
        ['Status', pending ? 'Dispatched, awaiting result' : view.engine.phase === 'WAITING_HUMAN' ? 'Waiting for a human decision' : view.engine.phase === 'BLOCKED' ? 'Blocked' : view.engine.phase === 'DONE' ? 'Ended' : 'Nothing dispatched'],
        ['Configured model', model ? model.owner_label : undefined],
        ['Next', pending ? 'Await the dispatched result.' : view.engine.phase === 'WAITING_HUMAN' ? 'Review the decision above and reply in the Coordinator.' : view.engine.phase === 'BLOCKED' ? 'Review the blocker above; a repaired change needs a new run.' : view.engine.phase === 'DONE' ? 'Review the recorded outcome and report.' : 'Continue this run in the Coordinator.'],
      ]),
      technicalDetails('activity', kv([
        ['Attempt', a.attempt_id || '—'],
        ['Dispatched at', pending ? fmtTime(a.dispatched_at) : undefined],
        ['Accepted / failed', attempt ? (attempt.settled_at ? `${attempt.status} at ${fmtTime(attempt.settled_at)}` : 'not yet') : undefined],
        ['Retry', a.retry.budget === null ? '—' : `${a.retry.used} failed since entry, budget ${a.retry.budget}`],
        ['Configured model', model ? `${model.owner_label} (alias ${model.alias}; selector ${model.selector_status})` : a.kind === 'role' ? 'none in profile' : '—'],
        ['Effective model', null],
        ['Inputs', Object.keys(a.inputs).length > 0 ? Object.keys(a.inputs).join(', ') : '—'],
        ['Last authoritative update', `journal v${a.last_update_version} at ${fmtTime(a.last_update_at)}`],
      ])),
      pending ? h('p', { class: 'hint' }, 'An outstanding dispatch is not proof that a model is executing. The engine records only commit times.') : null,
    ),
  );
}

// ---------------------------------------------------------------- stage detail

export function stageDetail(view, stageId, ctx) {
  const s = view.stage_graph.find((x) => x.stage_id === stageId);
  if (!s) return h('section', { class: 'panel' }, h('h2', {}, 'Stage'), h('div', { class: 'content' }, h('p', { class: 'hint' }, 'Select a stage on the rail to see its records.')));
  const attempts = view.attempts.filter((a) => a.stage_id === stageId);
  const reviews = view.reviews.filter((r) => r.stage_id === stageId);
  return h('section', { class: 'panel', 'aria-label': `Stage ${s.label}`, 'data-testid': 'stage-detail' },
    h('div', { class: 'panel-head' }, h('span', {}, `Stage: ${s.label}`), h('span', {}, stateGlyph(s.state), ' ', STATE_TEXT[s.state])),
    h('div', { class: 'content' },
      kv([
        ['Kind', s.kind === 'role' ? `role (${roleLabel(s.role)}${s.mode ? `, mode ${s.mode}` : ''})` : s.kind],
        ['Position', s.branch ? `branch; rejoins at ${stageLabel(view, s.next)}` : s.next ? `then ${stageLabel(view, s.next)}` : 'final stage'],
        ['Entered', fmtTime(s.entered_at) || '—'],
        ['Completed', fmtTime(s.completed_at) || '—'],
        ['Attempts', s.attempt_ids.length > 0 ? s.attempt_ids.join(', ') : 'none'],
        ['Accepted attempt', s.accepted_attempt || '—'],
      ]),
      Object.keys(s.produced).length > 0
        ? h('div', {}, h('p', { class: 'hint' }, 'Records this stage produced, current in the run'), h('ul', { class: 'plain' }, Object.entries(s.produced).map(([k, ref]) => h('li', {}, `${k}: `, refButton(ref, ctx, k)))))
        : null,
      attempts.length > 0 ? h('div', {}, attempts.map((a) => attemptItem(a, ctx, view))) : null,
      reviews.length > 0 ? h('div', {}, reviews.map((r) => reviewItem(r, ctx))) : null,
    ),
  );
}

export function attemptItem(a, ctx, view) {
  const tone = a.status === 'ACCEPTED' ? 'ok' : a.status === 'FAILED' ? 'danger' : 'info';
  return h('details', { class: 'item', 'data-view-key': `attempt-${a.attempt_id}`, 'data-reading-anchor': `attempt-${a.attempt_id}`, 'data-testid': `attempt-${a.attempt_id}` },
    h('summary', {},
      h('span', { class: `glyph state-${tone}`, 'aria-hidden': 'true' }, a.status === 'ACCEPTED' ? '✓' : a.status === 'FAILED' ? '×' : '◇'),
      h('span', { class: 'title' }, a.attempt_id),
      h('span', {}, roleLabel(a.role)),
      h('span', {}, a.status === 'PENDING' ? 'dispatched, awaiting result' : a.status === 'ACCEPTED' ? `accepted (${a.outcome})${a.superseded ? ', superseded' : ''}` : `failed: ${a.failure_kind}`),
      h('span', { class: 't' }, fmtTime(a.dispatched_at)),
    ),
    h('div', { class: 'content' },
      kv([
        ['Dispatched', `v${a.dispatched_version} at ${fmtTime(a.dispatched_at)}`],
        ['Settled', a.settled_at ? `v${a.settled_version} at ${fmtTime(a.settled_at)}` : 'not yet'],
        ['Failure detail', a.failure_detail || undefined],
        ['Configured model', a.configured_model ? `${a.configured_model.owner_label} (alias ${a.configured_model.alias}; ${a.configured_model.selector_status})` : '—'],
        ['Effective model', null],
        ['Input digest', h('span', { class: 'ref' }, a.input_digest)],
        ['Inputs', Object.keys(a.inputs).length > 0 ? h('span', {}, Object.entries(a.inputs).map(([k, ref], i) => h('span', {}, i > 0 ? ', ' : '', `${k} `, refButton(ref, ctx, '')))) : '—'],
        ['Produced', Object.keys(a.produced).length > 0 ? h('span', {}, Object.entries(a.produced).map(([k, ref], i) => h('span', {}, i > 0 ? ', ' : '', `${k} `, refButton(ref, ctx, '')))) : '—'],
        ['Result record', a.result_ref ? refButton(a.result_ref, ctx, 'result') : a.failure_ref ? refButton(a.failure_ref, ctx, 'failure') : '—'],
      ]),
      view && a.stage_id ? null : null,
    ),
  );
}

export function reviewItem(r, ctx) {
  const tone = r.verdict === 'HOLDS' || r.verdict === 'ACCEPT' || r.verdict === 'APPROVE' ? 'ok' : r.verdict === 'INCONCLUSIVE' ? 'human' : 'danger';
  const name = r.stage_id === 'plan-audit' ? `Audit round ${r.round ?? '?'}` : r.stage_id === 'review' ? 'Technical review' : 'PR review';
  return h('details', { class: 'item', open: r.current ? '' : null, 'data-view-key': `review-${r.attempt_id}`, 'data-reading-anchor': `review-${r.attempt_id}`, 'data-testid': `review-${r.attempt_id}` },
    h('summary', {},
      h('span', { class: `glyph state-${tone}`, 'aria-hidden': 'true' }, tone === 'ok' ? '✓' : tone === 'human' ? '?' : '×'),
      h('span', { class: 'title' }, name),
      h('span', {}, r.verdict),
      h('span', {}, `${r.findings.length} finding(s), ${r.checked} checked, ${r.unchecked} not checked`),
      r.current ? null : h('span', { class: 'hint' }, 'superseded'),
      h('span', { class: 't' }, fmtTime(r.at)),
    ),
    h('div', { class: 'content' },
      r.findings.length > 0 ? findingList(r.findings) : h('p', { class: 'hint' }, 'No findings.'),
      r.limitations.length > 0 ? h('div', { class: 'callout' }, h('strong', {}, 'Limitations: '), r.limitations.join(' ')) : null,
      h('p', { class: 'hint' }, 'Record ', refButton(r.record, ctx, '')),
    ),
  );
}

// ---------------------------------------------------------------- tabs

export const TABS = [
  ['timeline', 'Timeline'],
  ['attempts', 'Agent attempts'],
  ['tests', 'Test execution'],
  ['audits', 'Plan audits'],
  ['reviews', 'Reviews'],
  ['evidence', 'Evidence'],
  ['problems', 'Problems'],
];

export function tabCounts(view) {
  return {
    timeline: view.timeline.length,
    attempts: view.attempts.length,
    tests: view.executions.length,
    audits: view.reviews.filter((r) => r.stage_id === 'plan-audit').length,
    reviews: view.reviews.filter((r) => r.stage_id !== 'plan-audit').length,
    evidence: view.evidence.length,
    problems: view.problems.length,
  };
}

const CATEGORY_GLYPH = { start: '▶', dispatch: '◇', result: '✓', failure: '×', human: '!', verification: '⚙', review: '◆', proposal: '✓', deterministic: '·' };
const CATEGORY_TONE = { start: 'neutral', dispatch: 'info', result: 'ok', failure: 'danger', human: 'human', verification: 'info', review: 'ok', proposal: 'ok', deterministic: 'neutral' };

// Who an event belongs to, as a role badge: the stage's role, you for decisions, the engine otherwise.
function eventWho(view, t) {
  if (t.category === 'human') return { badge: 'YOU', token: 'you' };
  if (['start', 'deterministic', 'verification', 'proposal'].includes(t.category)) return { badge: 'EN', token: 'engine' };
  const s = view.stage_graph.find((x) => x.stage_id === t.stage_id);
  return s ? { badge: badgeFor(s.role, s.kind), token: roleToken(s.role, s.kind) } : { badge: 'EN', token: 'engine' };
}

export function timelineTab(view, ctx) {
  const rows = view.timeline.slice().reverse();
  return h('div', {},
    h('p', { class: 'hint' }, `${view.timeline.length} committed journal records, newest first. Times are engine commit times.`),
    h('table', { class: 'data', 'data-testid': 'timeline' },
      h('thead', {}, h('tr', {}, h('th', { class: 'num' }, '#'), h('th', {}, 'At'), h('th', {}, 'Event'), h('th', {}, 'What happened'))),
      h('tbody', {}, rows.map((t) => {
        const refs = Object.entries(t.refs).filter(([k]) => !k.endsWith('_digest'));
        const who = eventWho(view, t);
        return h('tr', { 'data-seq': t.seq, 'data-reading-anchor': `event-${t.seq}` },
          h('td', { class: 'num' }, t.seq),
          h('td', { class: 't' }, fmtTime(t.at)),
          h('td', { class: 'ev-cell' }, h('span', { class: 'badge', 'data-token': who.token, 'aria-hidden': 'true' }, who.badge), h('span', { class: `glyph state-${CATEGORY_TONE[t.category] || 'neutral'}`, 'aria-hidden': 'true' }, CATEGORY_GLYPH[t.category] || '·'), ' ', t.type),
          h('td', {}, t.summary,
            refs.length > 0 ? h('details', { class: 'refs', 'data-view-key': `refs-${t.seq}` }, h('summary', {}, `${refs.length} record${refs.length === 1 ? '' : 's'}`), h('div', { class: 'ref-list' }, refs.map(([k, ref]) => refButton(ref, ctx, k)))) : null,
            Object.keys(t.refs).some((k) => k.endsWith('_digest')) ? technicalDetails(`event-${t.seq}`, Object.entries(t.refs).filter(([k]) => k.endsWith('_digest')).map(([k, ref]) => refMetadata(ref, k, 'Verification digest; not an artifact'))) : null,
          ),
        );
      })),
    ),
  );
}

export function attemptsTab(view, ctx) {
  if (view.attempts.length === 0) return h('p', { class: 'hint' }, 'No role has been dispatched yet.');
  return h('div', {}, view.attempts.slice().reverse().map((a) => attemptItem(a, ctx, view)));
}

export function testsTab(view, ctx) {
  if (view.executions.length === 0) return h('p', { class: 'hint' }, 'The engine has not run the application\'s tests yet.');
  return h('div', {}, view.executions.map((e) => {
    const ok = e.outcome === 'VALID' || e.outcome === 'PASS';
    const single = e.tests.filter((t) => t.kind === 'TEST');
    return h('details', { class: 'item', open: '', 'data-view-key': `execution-${e.ref}`, 'data-reading-anchor': `execution-${e.ref}` },
      h('summary', {},
        h('span', { class: `glyph state-${ok ? 'ok' : 'danger'}`, 'aria-hidden': 'true' }, ok ? '✓' : '×'),
        h('span', { class: 'title' }, e.purpose === 'PROOF_BASELINE' ? 'Proof baseline' : 'Candidate verification'),
        h('span', {}, e.outcome),
        h('span', {}, `${single.filter((t) => t.status === 'PASS').length} passed, ${single.filter((t) => t.status === 'FAIL').length} failed of ${single.length} single tests`),
        h('span', { class: 't' }, fmtTime(e.at)),
      ),
      h('div', { class: 'content' },
        kv([
          ['Exit code', e.exit_code === null ? 'none' : String(e.exit_code)],
          ['Timed out', e.timed_out ? 'yes' : 'no'],
          ['Test command duration', `${e.duration_ms} ms (executor measurement)`],
          ['Candidate / tree', e.candidate ? refButton(e.candidate, ctx, 'tree') : '—'],
          ['Record', refButton(e.ref, ctx, 'execution')],
        ]),
        e.issues.length > 0 ? h('div', { class: 'callout danger' }, h('ul', { class: 'plain' }, e.issues.map((i) => h('li', {}, i)))) : null,
        h('table', { class: 'data' },
          h('thead', {}, h('tr', {}, h('th', {}, 'Test'), h('th', {}, 'Kind'), h('th', {}, 'Status'), h('th', {}, 'Failure'))),
          h('tbody', {}, e.tests.map((t) => h('tr', {}, h('td', {}, t.name), h('td', {}, t.kind), h('td', { class: t.status === 'PASS' ? 'state-ok' : t.status === 'FAIL' ? 'state-danger' : '' }, t.status), h('td', {}, t.failure_kind || '')))),
        ),
      ),
    );
  }));
}

export function auditsTab(view, ctx) {
  const audits = view.reviews.filter((r) => r.stage_id === 'plan-audit');
  if (audits.length === 0) return h('p', { class: 'hint' }, 'No audit has been accepted yet.');
  return h('div', {},
    h('p', { class: 'hint' }, `Audit budget: ${view.engine.audit_budget ? `${view.engine.audit_budget.used} of ${view.engine.audit_budget.max} used` : '—'}; round ${view.engine.round}.`),
    audits.map((r) => reviewItem(r, ctx)),
    view.decisions.length > 0 ? h('div', {}, h('p', { class: 'hint' }, 'Human decisions'), h('table', { class: 'data' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Decision'), h('th', {}, 'Action'), h('th', {}, 'At'), h('th', {}, 'Recorded by'), h('th', {}, 'Provenance'), h('th', {}, 'Plan status'))),
      h('tbody', {}, view.decisions.map((d) => h('tr', {}, h('td', {}, d.decision_id), h('td', {}, d.action), h('td', { class: 't' }, fmtTime(d.at)), h('td', {}, d.recorded_by), h('td', {}, d.provenance), h('td', {}, d.plan_status || '—')))),
    )) : null,
  );
}

export function reviewsTab(view, ctx) {
  const reviews = view.reviews.filter((r) => r.stage_id !== 'plan-audit');
  if (reviews.length === 0) return h('p', { class: 'hint' }, 'No technical or PR review has been accepted yet.');
  return h('div', {}, reviews.map((r) => reviewItem(r, ctx)));
}

export function evidenceTab(view, ctx) {
  return h('div', {},
    h('p', { class: 'hint' }, 'Records retained by the run, by content identity. Opening one re-reads it under its identity; altered bytes are refused.'),
    h('table', { class: 'data', 'data-testid': 'evidence' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Record'), h('th', {}, 'Identity'), h('th', {}, 'Produced by'), h('th', { class: 'num' }, 'Journal #'), h('th', {}, 'Current'))),
      h('tbody', {}, view.evidence.map((e) => h('tr', {},
        h('td', {}, e.key),
        h('td', {}, refButton(e.ref, ctx, '')),
        h('td', {}, e.produced_by),
        h('td', { class: 'num' }, e.seq),
        h('td', {}, e.current ? 'yes' : 'superseded'),
      ))),
    ),
  );
}

export function problemsTab(view) {
  return h('div', {},
    view.problems.length === 0 ? h('p', { class: 'hint' }, 'No failure, blocker, or diagnostic is recorded for this run.') : h('ul', { class: 'plain' }, view.problems.map((p) => h('li', {}, h('strong', {}, p.kind), p.seq ? ` (journal #${p.seq}, ${fmtTime(p.at)})` : '', `: ${p.summary}`))),
    h('div', { class: 'not-observed' }, h('p', { class: 'hint' }, 'Not observed by this run'), h('ul', { class: 'plain' }, view.not_observed.map((n) => h('li', {}, n)))),
    view.lock.held ? h('p', { class: 'hint' }, `Run lock observed: held by process ${view.lock.pid ?? '?'} on ${view.lock.host ?? '?'} since ${fmtTime(view.lock.acquired_at)}. The viewer never takes or reclaims a lock.`) : null,
  );
}
