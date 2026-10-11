// Pure derivations from one run view: durations, swimlane segments, vitals,
// and the hero state. Every number here is computed from timestamps and
// records the engine committed; nothing is estimated. No DOM access, so the
// module also loads in Node for its tests.

const TERMINAL = new Set(['LOCAL_PR_PROPOSAL_PREPARED', 'REJECTED', 'BLOCKED']);
const OPEN_STATES = new Set(['CURRENT_IDLE', 'DISPATCHED_AWAITING_RESULT', 'WAITING_HUMAN']);
const ENGINE_CATEGORIES = new Set(['deterministic', 'verification', 'proposal']);
const BADGES = { planner: 'PL', 'plan-auditor': 'AU', tester: 'TE', developer: 'DEV', reviewer: 'CR', 'pr-reviewer': 'PR' };
const ROLE_LABELS = { planner: 'Planner', 'plan-auditor': 'Plan Auditor', tester: 'Tester', developer: 'Developer', reviewer: 'Code Reviewer', 'pr-reviewer': 'PR Reviewer' };

function ms(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

// Whole seconds from one timestamp to another; never negative.
export function seconds(fromIso, toIso) {
  const a = ms(fromIso);
  const b = ms(toIso);
  if (a === null || b === null) return null;
  return Math.max(0, Math.floor((b - a) / 1000));
}

export function fmtDuration(totalSeconds) {
  const s = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${m}:${pad(r)}`;
}

export function isTerminal(view) {
  return TERMINAL.has(view.final_outcome);
}

// When the run stopped moving: its last commit if terminal, otherwise null (still open).
export function runEnd(view) {
  return isTerminal(view) ? view.last_committed_at : null;
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || '';
}

export function roleBadge(role, kind) {
  if (kind === 'human') return 'YOU';
  if (kind === 'deterministic') return 'EN';
  if (BADGES[role]) return BADGES[role];
  return (role || '?').slice(0, 2).toUpperCase();
}

// The stage's identity colour token, used for badges, stripes and lanes only.
export function roleToken(role, kind) {
  if (kind === 'human') return 'you';
  if (kind === 'deterministic') return 'engine';
  return { planner: 'planner', 'plan-auditor': 'auditor', tester: 'tester', developer: 'developer', reviewer: 'reviewer', 'pr-reviewer': 'prreviewer' }[role] || 'engine';
}

// The main path of the retained workflow definition, following `next`.
export function mainPath(stages) {
  const byId = new Map(stages.map((s) => [s.stage_id, s]));
  const path = [];
  const seen = new Set();
  let current = stages[0];
  while (current && !seen.has(current.stage_id)) {
    seen.add(current.stage_id);
    path.push(current);
    current = current.next ? byId.get(current.next) : undefined;
  }
  return path;
}

// A stage's recorded duration, or the start of its live clock while it is open.
export function stageTiming(view, stageId) {
  const none = { seconds: null, since: null, until: null };
  const s = view.stage_graph.find((x) => x.stage_id === stageId);
  if (!s || !s.entered_at) return none;
  const open = view.engine.stage === s.stage_id && OPEN_STATES.has(s.state);
  if (open && !isTerminal(view)) return { seconds: null, since: s.entered_at, until: null };
  const entered = ms(s.entered_at);
  const completed = ms(s.completed_at);
  if (completed !== null && entered !== null && completed >= entered) return { seconds: seconds(s.entered_at, s.completed_at), since: null, until: null };
  return none;
}

// Intervals the run spent at a human stage, from the timeline: entering a
// human stage starts one, the next entry that leaves it ends it.
export function humanWaits(view) {
  const human = new Set(view.stage_graph.filter((s) => s.kind === 'human').map((s) => s.stage_id));
  const waits = [];
  let open = null;
  for (const e of view.timeline) {
    if (open && e.stage_after !== open.stage_id) {
      open.end = e.at;
      open.end_seq = e.seq;
      waits.push(open);
      open = null;
    }
    if (!open && human.has(e.stage_after)) open = { stage_id: e.stage_after, start: e.at, seq: e.seq, end: null, end_seq: null };
  }
  if (open) waits.push(open);
  return waits;
}

export function vitals(view) {
  const path = mainPath(view.stage_graph);
  const completed = path.filter((s) => s.state === 'COMPLETED' || s.state === 'DONE_TERMINAL').length;
  const newest = view.executions.reduce((best, e) => (!best || e.seq > best.seq ? e : best), null);
  const single = newest ? newest.tests.filter((t) => t.kind === 'TEST') : [];
  const waits = humanWaits(view);
  const closed = waits.filter((w) => w.end !== null);
  const openWait = waits.find((w) => w.end === null);
  return {
    completed,
    total: path.length,
    attempts: view.attempts.length,
    failed: view.attempts.filter((a) => a.status === 'FAILED').length,
    tests: newest ? { passed: single.filter((t) => t.status === 'PASS').length, failed: single.filter((t) => t.status === 'FAIL').length, purpose: newest.purpose } : null,
    audit: view.engine.audit_budget ? { used: view.engine.audit_budget.used, max: view.engine.audit_budget.max } : null,
    waitSeconds: closed.reduce((sum, w) => sum + (seconds(w.start, w.end) ?? 0), 0),
    waitSince: openWait && !isTerminal(view) ? openWait.start : null,
  };
}

// The time axis of the swimlane: run start to the terminal commit, or to now.
export function axis(view, nowIso) {
  const start = view.started_at;
  const end = runEnd(view) ?? nowIso;
  const a = ms(start);
  const b = ms(end);
  return { start, end, ms: a === null || b === null ? 1000 : Math.max(1000, b - a) };
}

// Who held the work: one lane per role present, plus You and Engine, in order of first appearance.
export function lanes(view) {
  const byKey = new Map();
  const lane = (key, label, seq) => {
    if (!byKey.has(key)) byKey.set(key, { key, label, first: seq, segments: [] });
    const l = byKey.get(key);
    l.first = Math.min(l.first, seq);
    return l;
  };
  for (const a of view.attempts) {
    const kind = a.status === 'PENDING' ? 'pending' : a.status === 'FAILED' ? 'failed' : a.superseded ? 'superseded' : 'accepted';
    lane(a.role, roleLabel(a.role), a.dispatched_version).segments.push({ start: a.dispatched_at, end: a.status === 'PENDING' ? null : a.settled_at, kind, id: a.attempt_id });
  }
  // Engine ticks before waits: when an engine step opens a wait, the engine lane comes first.
  for (const e of view.timeline) {
    if (ENGINE_CATEGORIES.has(e.category)) lane('engine', 'Engine', e.seq).segments.push({ start: e.at, end: e.at, kind: 'tick', id: `tick-${e.seq}` });
  }
  for (const w of humanWaits(view)) {
    lane('human', 'You', w.seq).segments.push({ start: w.start, end: w.end, kind: 'wait', id: `wait-${w.seq}` });
  }
  return [...byKey.values()].sort((x, y) => x.first - y.first).map(({ key, label, segments }) => ({ key, label, segments }));
}

export function heroState(view) {
  if (view.source_status !== 'CURRENT' && view.source_status !== 'INCOMPLETE_TAIL') return 'unreadable';
  switch (view.final_outcome) {
    case 'WAITING_HUMAN':
      return 'human';
    case 'BLOCKED':
      return 'blocked';
    case 'LOCAL_PR_PROPOSAL_PREPARED':
      return 'done';
    case 'REJECTED':
      return 'rejected';
    case 'UNREADABLE':
      return 'unreadable';
    default:
      return view.current_activity.dispatch_status === 'DISPATCHED_AWAITING_RESULT' ? 'dispatched' : 'idle';
  }
}
