// RSTACK Mission Control: state, transport, routing, theme. The only truth
// shown is the read model the service returns for a committed journal
// version; this file never infers a transition from anything else. Motion is
// started only by a newer committed version (motion.js), a heartbeat, or the
// clock; the Live view is patched in place so loops and cues survive updates.

import { alertState, applyAlerts } from './alerts.js';
import { startClock, tickClocks } from './clock.js';
import { createFlow } from './flow.js';
import { createLive } from './live.js';
import { createPlayer, cues } from './motion.js';
import {
  OUTCOME_TEXT,
  OUTCOME_TONE,
  TABS,
  ago,
  attemptsTab,
  auditsTab,
  blockedBand,
  doneBand,
  evidenceTab,
  fmtTime,
  h,
  humanBand,
  kv,
  nowPanel,
  pill,
  problemsTab,
  reviewsTab,
  stageDetail,
  stateGlyph,
  tabCounts,
  testsTab,
  timelineTab,
  unreadableBand,
} from './views.js';

const THEME_KEY = 'rstack-dash-theme';
const STALE_MS = 30_000;
const POLL_FALLBACK_MS = 5_000;

const state = {
  runs: [],
  workspace: '',
  selected: null,
  view: null,
  report: { available: false, path: null },
  mode: 'live',
  filter: 'all',
  tab: 'timeline',
  stage: null,
  connection: 'connecting',
  lastEvent: null,
  paused: false,
  pendingWhilePaused: new Set(),
  pendingResync: false,
  error: null,
  loadingRun: false,
  catchUp: false,
  pendingCues: null,
  prevRuns: null,
  markers: null,
};

const root = document.getElementById('app');
let source = null;
let staleTimer = null;
let pollTimer = null;
let reconnects = 0;
let clockTimer = null;
let viewEpoch = 0;
let runRequest = 0;
let listRequest = 0;
const disclosures = new Map();
let live = null;
let inspectFlow = null;
const reducedMotion = globalThis.matchMedia ? globalThis.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

const player = createPlayer({
  animate: (cue, opts) => {
    if (live && live.runId === state.selected && state.mode === 'live') live.api.animate(cue, opts);
  },
  reduced: () => reducedMotion.matches,
  hidden: () => document.hidden,
});

// ---------------------------------------------------------------- theme

function applyTheme(choice) {
  document.documentElement.dataset.theme = choice;
  try {
    localStorage.setItem(THEME_KEY, choice);
  } catch {
    // storage may be unavailable; the choice still applies to this page
  }
}

function currentTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // fall through
  }
  return 'system';
}

// ---------------------------------------------------------------- routing

function readHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  state.selected = params.get('run');
  state.tab = TABS.some(([id]) => id === params.get('tab')) ? params.get('tab') : state.tab;
  state.stage = params.get('stage');
  state.mode = params.get('mode') === 'inspect' ? 'inspect' : 'live';
}

function writeHash() {
  const params = new URLSearchParams();
  if (state.selected) params.set('run', state.selected);
  if (state.mode === 'inspect') params.set('mode', 'inspect');
  if (state.tab !== 'timeline') params.set('tab', state.tab);
  if (state.stage) params.set('stage', state.stage);
  const next = `#${params.toString()}`;
  if (location.hash !== next) history.replaceState(null, '', next === '#' ? location.pathname : next);
}

// ---------------------------------------------------------------- transport

async function api(path) {
  const res = await fetch(path, { headers: { accept: 'application/json' }, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `${res.status} ${res.statusText}`);
    err.status = res.status;
    err.code = body.code;
    throw err;
  }
  return res.json();
}

function updateAlerts() {
  const a = alertState({ runs: state.runs, previous: state.prevRuns, hidden: document.hidden, markers: state.markers });
  state.markers = a.markers;
  state.prevRuns = state.runs;
  applyAlerts(document, a);
}

async function loadRuns() {
  if (state.paused) return false;
  const epoch = viewEpoch;
  const request = ++listRequest;
  const data = await api('/api/v1/runs');
  if (epoch !== viewEpoch || request !== listRequest || state.paused) return false;
  state.runs = data.runs;
  state.workspace = data.workspace.label;
  updateAlerts();
  return true;
}

async function loadRun(runId, background = false) {
  if (!runId || (background && state.paused)) return false;
  const epoch = viewEpoch;
  const request = ++runRequest;
  const current = () => epoch === viewEpoch && request === runRequest && state.selected === runId;
  state.loadingRun = true;
  try {
    const data = await api(`/api/v1/runs/${encodeURIComponent(runId)}`);
    if (!current() || (background && state.paused)) return false;
    const previous = state.view;
    state.view = data.view;
    state.report = data.report;
    if (previous && previous.run_id === data.view.run_id) {
      if (data.view.journal_version > previous.journal_version) {
        state.pendingCues = { runId, cues: cues(previous, data.view), events: data.view.journal_version - previous.journal_version, catchUp: state.catchUp };
      }
    } else {
      // First sight of this run: what is already committed never animates.
      player.prime(runId, data.view.journal_version);
      state.pendingCues = null;
    }
    state.catchUp = false;
    state.error = null;
    return true;
  } catch (e) {
    if (!current()) return false;
    state.error = e.message;
    return true;
  } finally {
    if (current()) state.loadingRun = false;
  }
}

function setConnection(c) {
  if (state.connection !== c) {
    state.connection = c;
    root.dataset.connection = state.paused ? 'paused' : c;
    renderHeaderOnly();
  }
}

function armStale() {
  if (staleTimer) clearTimeout(staleTimer);
  staleTimer = setTimeout(() => setConnection('stale'), STALE_MS);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    refreshAll().catch(() => undefined);
  }, POLL_FALLBACK_MS);
}

// One beat of the Live dot per real heartbeat from the service.
function beat() {
  if (reducedMotion.matches || state.paused) return;
  const dot = root.querySelector('[data-testid=connection] .dot');
  if (!dot || !dot.animate) return;
  const anim = dot.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.8)', opacity: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 700, easing: 'ease-out' });
  anim.id = 'beat';
}

function connect() {
  if (source) source.close();
  source = new EventSource('/api/v1/events');
  setConnection(reconnects > 0 ? 'reconnecting' : 'connecting');
  source.addEventListener('hello', () => {
    reconnects = 0;
    stopPolling();
    state.lastEvent = Date.now();
    setConnection('live');
    armStale();
    // A fresh connection reloads what may have been missed; only the newest cue may play.
    state.catchUp = true;
    refreshAll().catch(() => undefined);
  });
  source.addEventListener('heartbeat', () => {
    state.lastEvent = Date.now();
    setConnection('live');
    armStale();
    beat();
  });
  const onChange = (event) => {
    state.lastEvent = Date.now();
    armStale();
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    if (state.paused) {
      state.pendingWhilePaused.add(data.run_id);
      renderHeaderOnly();
      return;
    }
    applyChange(data).catch(() => undefined);
  };
  source.addEventListener('run-changed', onChange);
  source.addEventListener('run-removed', onChange);
  source.addEventListener('resync', () => {
    state.catchUp = true;
    refreshAll().catch(() => undefined);
  });
  source.onerror = () => {
    reconnects += 1;
    setConnection(reconnects > 3 ? 'disconnected' : 'reconnecting');
    if (reconnects > 3) startPolling();
  };
}

async function applyChange(data) {
  const epoch = viewEpoch;
  if (!await loadRuns() || epoch !== viewEpoch) return;
  if (state.selected && (data.run_id === state.selected || data.type === 'run-removed')) {
    if (data.type === 'run-removed' && data.run_id === state.selected) {
      state.selected = null;
      state.view = null;
    } else if (data.view_digest !== (state.view && state.view.view_digest)) {
      await loadRun(state.selected, true);
    }
  }
  if (epoch === viewEpoch && !state.paused) render();
}

async function refreshAll() {
  if (state.paused) {
    state.pendingResync = true;
    renderHeaderOnly();
    return;
  }
  const epoch = viewEpoch;
  if (!await loadRuns() || epoch !== viewEpoch) return;
  if (state.selected) await loadRun(state.selected, true);
  if (epoch === viewEpoch && !state.paused) render();
}

// ---------------------------------------------------------------- viewers

const ctx = {
  canOpen(ref) {
    return state.view?.evidence.some((e) => e.ref === ref && e.available) === true;
  },
  async openArtifact(ref, label) {
    if (!state.selected || !ref) return;
    const hex = ref.replace(/^sha256:/, '');
    const dialog = viewerDialog(label ? `${label} (${hex.slice(0, 12)}…)` : hex);
    const pre = h('pre', {}, 'Loading…');
    dialog.append(pre);
    document.body.append(dialog);
    dialog.showModal();
    try {
      const res = await fetch(`/api/v1/runs/${encodeURIComponent(state.selected)}/artifacts/${hex}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        pre.textContent = `Not shown: ${body.message || res.status}`;
        return;
      }
      const text = await res.text();
      let shown = text;
      try {
        const parsed = JSON.parse(text);
        shown = JSON.stringify(parsed, null, 2);
      } catch {
        // not JSON; shown as is
      }
      pre.textContent = shown;
    } catch (e) {
      pre.textContent = `Not shown: ${e.message}`;
    }
  },
  openBrief(round) {
    if (!state.selected) return;
    const dialog = viewerDialog(`Brief, round ${round} (sandboxed; a derived view that records nothing)`);
    dialog.append(h('iframe', { sandbox: '', src: `/api/v1/runs/${encodeURIComponent(state.selected)}/brief/${round}`, title: `Plan decision brief, round ${round}` }));
    document.body.append(dialog);
    dialog.showModal();
  },
  inspectStage(stageId) {
    state.mode = 'inspect';
    state.stage = stageId;
    writeHash();
    render();
    root.querySelector('[data-testid=stage-detail]')?.scrollIntoView({ block: 'nearest' });
  },
  inspectTab(tab) {
    state.mode = 'inspect';
    state.tab = tab;
    writeHash();
    render();
  },
};

function viewerDialog(title) {
  const dialog = h('dialog', { class: 'viewer', 'aria-label': title });
  const closeBtn = h('button', { type: 'button', class: 'btn', onclick: () => dialog.close() }, 'Close');
  dialog.append(h('div', { class: 'head' }, h('span', { class: 'title' }, title), closeBtn));
  dialog.addEventListener('close', () => dialog.remove());
  return dialog;
}

// ---------------------------------------------------------------- header

function connectionParts() {
  const map = {
    connecting: ['neutral', 'Connecting'],
    live: ['live', 'Live'],
    reconnecting: ['stale', 'Reconnecting'],
    disconnected: ['off', 'Disconnected; polling'],
    stale: ['stale', `Stale · last confirmed ${state.view ? `v${state.view.journal_version}` : 'state'}, ${state.lastEvent ? ago(new Date(state.lastEvent).toISOString()) : 'a while ago'}`],
    paused: ['paused', `Paused${state.pendingResync ? ', updates pending' : state.pendingWhilePaused.size > 0 ? `, ${state.pendingWhilePaused.size} run(s) changed` : ''}`],
  };
  return map[state.paused ? 'paused' : state.connection] || ['neutral', state.connection];
}

function connectionPill() {
  const [tone, text] = connectionParts();
  return pill(tone, text, { role: 'status', 'aria-live': 'polite', 'data-testid': 'connection' });
}

function runTone(r) {
  if (r.needs_human) return 'human';
  return OUTCOME_TONE[r.final_outcome] || 'neutral';
}

const GROUPS = [
  ['Needs you', (r) => r.needs_human],
  ['Active', (r) => r.final_outcome === 'IN_PROGRESS' && !r.needs_human],
  ['Blocked', (r) => r.final_outcome === 'BLOCKED' || r.final_outcome === 'UNREADABLE'],
  ['Done', (r) => r.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED' || r.final_outcome === 'REJECTED'],
];

function switcher(open) {
  const r = state.runs.find((x) => x.run_id === state.selected);
  const details = h('details', { class: 'switcher', 'data-view-key': 'switcher', open: open ? '' : null });
  const choose = (id) => {
    details.open = false;
    select(id, 'live');
  };
  const groups = GROUPS.map(([label, test]) => [label, state.runs.filter(test)]).filter(([, runs]) => runs.length > 0);
  details.append(
    h('summary', { 'data-focus': 'switcher', 'aria-label': r ? `Run ${r.run_id}: ${r.request_title || r.request_id || ''}. Switch run` : 'Choose a run' },
      h('span', { class: 'dot', 'data-tone': r ? runTone(r) : 'neutral', 'aria-hidden': 'true' }),
      h('span', { class: 'sw-id' }, r ? r.run_id : `Runs (${state.runs.length})`),
      h('span', { class: 'sw-title' }, r ? r.request_title || r.request_id || 'Request awaiting intake' : 'Choose a run'),
      h('span', { class: 'sw-caret', 'aria-hidden': 'true' }, '▾')),
    h('div', { class: 'switcher-menu' }, groups.length === 0 ? h('p', { class: 'hint' }, 'No runs yet.') : groups.map(([label, runs]) => h('div', { class: 'sw-group' },
      h('h3', {}, `${label} (${runs.length})`),
      runs.map((x) => h('button', { type: 'button', class: 'sw-item', 'data-switch': x.run_id, 'aria-current': x.run_id === state.selected ? 'true' : 'false', onclick: () => choose(x.run_id) },
        h('span', { class: 'dot', 'data-tone': runTone(x), 'aria-hidden': 'true' }),
        h('span', { class: 't' }, x.request_title || x.request_id || x.run_id),
        h('span', { class: 's' }, x.run_id)))))),
  );
  return details;
}

function counts() {
  const n = (test) => state.runs.filter(test).length;
  const needs = n((r) => r.needs_human);
  return h('div', { class: 'counts', 'aria-label': 'Runs in this workspace' },
    h('span', {}, h('span', { class: 'dot', 'data-tone': 'info', 'aria-hidden': 'true' }), `${n(GROUPS[1][1])} active`),
    needs > 0 ? h('span', { class: 'needs' }, h('span', { class: 'dot', 'data-tone': 'human', 'aria-hidden': 'true' }), `${needs} need you`) : null,
    h('span', {}, h('span', { class: 'dot', 'data-tone': 'danger', 'aria-hidden': 'true' }), `${n((r) => r.final_outcome === 'BLOCKED' || r.final_outcome === 'UNREADABLE')} blocked`),
    h('span', {}, h('span', { class: 'dot', 'data-tone': 'ok', 'aria-hidden': 'true' }), `${n((r) => r.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED' || r.final_outcome === 'REJECTED')} done`),
  );
}

function header(switcherOpen = false) {
  const v = state.view;
  const theme = currentTheme();
  const themeControl = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'Theme' },
    ['light', 'dark', 'system'].map((t) => h('button', {
      type: 'button',
      role: 'radio',
      'aria-checked': theme === t ? 'true' : 'false',
      'data-theme-choice': t,
      onclick: () => {
        applyTheme(t);
        renderHeaderOnly();
        live?.api.redraw();
      },
    }, t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'System')));
  const pauseBtn = h('button', {
    type: 'button',
    class: 'btn',
    'aria-pressed': state.paused ? 'true' : 'false',
    'data-testid': 'pause',
    onclick: () => {
      state.paused = !state.paused;
      // Invalidate responses already in flight, including a pause/resume cycle.
      viewEpoch += 1;
      root.dataset.connection = state.paused ? 'paused' : state.connection;
      if (!state.paused) {
        state.pendingWhilePaused.clear();
        state.pendingResync = false;
        state.catchUp = true;
        refreshAll().catch(() => undefined);
      }
      renderHeaderOnly();
    },
  }, state.paused ? 'Resume' : 'Pause');
  pauseBtn.setAttribute('aria-label', state.paused ? 'Resume live updates' : 'Pause live updates');
  pauseBtn.title = pauseBtn.getAttribute('aria-label');
  const modeBtn = (m, label) => h('button', {
    type: 'button',
    'data-mode': m,
    'aria-pressed': state.mode === m ? 'true' : 'false',
    onclick: () => {
      if (state.mode === m) return;
      state.mode = m;
      writeHash();
      render();
    },
  }, label);
  return h('header', { class: 'top' },
    h('div', { class: 'brand' }, h('span', { class: 'mark', 'aria-hidden': 'true' }), 'RSTACK', h('small', {}, 'Mission Control'), state.workspace ? h('span', { class: 'workspace', title: state.workspace }, state.workspace) : null),
    switcher(switcherOpen),
    counts(),
    h('div', { class: 'top-right' },
      h('div', { class: 'mode', role: 'group', 'aria-label': 'View' }, modeBtn('live', 'Live'), modeBtn('inspect', 'Inspect')),
      connectionPill(),
      v ? h('span', { class: 'synced', 'data-testid': 'synced', title: `Last committed ${fmtTime(v.last_committed_at) || '—'}` }, `journal v${v.journal_version}`) : null,
      pauseBtn,
      fullscreenButton(),
      themeControl,
    ),
  );
}

// Full screen: the whole dashboard on the whole screen, for a side monitor or a team screen.
function toggleFullscreen() {
  if (!document.fullscreenEnabled) return;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  else document.documentElement.requestFullscreen().catch(() => undefined);
}

function fullscreenButton() {
  if (!document.fullscreenEnabled) return null;
  const on = Boolean(document.fullscreenElement);
  return h('button', {
    type: 'button',
    class: 'btn',
    'data-testid': 'fullscreen',
    'aria-pressed': on ? 'true' : 'false',
    'aria-label': on ? 'Exit full screen (F or Esc)' : 'Full screen (F)',
    title: on ? 'Exit full screen (F or Esc)' : 'Full screen (F)',
    onclick: toggleFullscreen,
  }, on ? '⤡ Exit' : '⤢ Full screen');
}

// Everything the header shows, so it is rebuilt only when that changes.
function headerSignature(switcherOpen) {
  return JSON.stringify([
    switcherOpen, state.mode, state.selected, state.workspace, currentTheme(), state.paused, connectionParts(), Boolean(document.fullscreenElement),
    state.view ? [state.view.journal_version, state.view.last_committed_at] : null,
    state.runs.map((r) => [r.run_id, r.request_title, r.request_id, r.final_outcome, r.needs_human]),
  ]);
}

// Replaces the header only when what it shows changed, keeping an open run switcher open.
function renderHeaderOnly() {
  const old = root.querySelector('header.top');
  const wasOpen = Boolean(old && old.querySelector('details.switcher')?.open);
  const key = headerSignature(wasOpen);
  if (old && old.dataset.signature === key) return;
  const next = header(wasOpen);
  next.dataset.signature = key;
  const focus = focusSelector(document.activeElement);
  if (old) old.replaceWith(next);
  else root.prepend(next);
  if (focus) root.querySelector(focus)?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- Live

function strip(stages) {
  return h('span', { class: 'strip', 'aria-hidden': 'true' }, (stages || []).filter((s) => s.state !== 'NOT_TAKEN').map((s) => h('i', { 'data-state': s.state })));
}

function fleet() {
  if (state.runs.length === 0) {
    return h('section', { class: 'fleet', 'aria-label': 'Runs' }, h('div', { class: 'notice' }, h('h2', {}, 'No runs in this workspace yet'), h('p', {}, 'Start one from the RSTACK Coordinator in VS Code Copilot, or with rstack start. It appears here as soon as its first record is committed.')));
  }
  return h('section', { class: 'fleet', 'aria-label': 'Runs' },
    h('div', { class: 'notice' }, h('h2', {}, 'Pick a run to follow'), h('p', {}, 'Each run opens in Live: its pipeline, who holds the work, and what it is waiting on. Runs that need you are listed first.')),
    [...state.runs].sort((a, b) => Number(b.needs_human) - Number(a.needs_human)).map((r) => h('button', { type: 'button', class: 'tile', 'data-switch': r.run_id, onclick: () => select(r.run_id, 'live') },
      h('span', { class: 'm' }, h('span', { class: 'mono' }, r.run_id), h('span', { class: 'chip', 'data-tone': runTone(r) }, r.needs_human ? 'Waiting for you' : OUTCOME_TEXT[r.final_outcome] || r.final_outcome)),
      h('span', { class: 't' }, r.request_title || r.request_id || 'Request awaiting intake'),
      strip(r.stage_states),
      h('span', { class: 'm' }, h('span', {}, r.application_label || 'Unknown app'), h('span', {}, r.last_committed_at ? ago(r.last_committed_at) : '')),
    )),
  );
}

function liveContent() {
  if (!state.selected) return fleet();
  const v = state.view;
  if (!v) {
    return h('section', { class: 'live-view' }, h('div', { class: state.error ? 'notice danger' : 'notice' }, h('h2', {}, state.error ? 'Run unavailable' : 'Loading run'), h('p', {}, state.error ? state.error : `Reading ${state.selected}…`)));
  }
  if (!live || live.runId !== v.run_id) {
    live?.api.destroy();
    live = { runId: v.run_id, api: createLive(ctx) };
  }
  live.api.update(v, { report: state.report, away: player.missed(v.run_id), error: state.error });
  return live.api.el;
}

// ---------------------------------------------------------------- Inspect

function sidebar() {
  const filters = [
    ['all', 'All'],
    ['human', 'Needs you'],
    ['active', 'Active'],
    ['blocked', 'Blocked'],
    ['done', 'Done'],
  ];
  const match = (r) => {
    switch (state.filter) {
      case 'human':
        return r.needs_human;
      case 'active':
        return r.final_outcome === 'IN_PROGRESS';
      case 'blocked':
        return r.final_outcome === 'BLOCKED' || r.final_outcome === 'UNREADABLE';
      case 'done':
        return r.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED' || r.final_outcome === 'REJECTED';
      default:
        return true;
    }
  };
  const runs = state.runs.filter(match);
  return h('aside', { class: 'side', 'aria-label': 'Runs' },
    h('div', { class: 'side-head' }, h('h2', {}, `Runs (${state.runs.length})`), state.selected ? h('button', { type: 'button', class: 'btn quiet', 'data-focus': 'clear', onclick: () => select(null, 'inspect') }, 'Clear') : null),
    h('div', { class: 'filters', role: 'group', 'aria-label': 'Filter runs' }, filters.map(([id, label]) => h('button', {
      type: 'button',
      'data-focus': `filter-${id}`,
      'aria-pressed': state.filter === id ? 'true' : 'false',
      onclick: () => {
        state.filter = id;
        render();
      },
    }, label))),
    runs.length === 0
      ? h('p', { class: 'empty' }, state.runs.length === 0 ? 'No runs in this workspace yet. Start one from the Coordinator or with rstack start; it appears here as soon as its first record is committed.' : 'No run matches this filter.')
      : h('ul', { class: 'run-list', 'data-testid': 'run-list', 'data-scroll-key': 'runs' }, runs.map((r) => h('li', {}, h('button', {
        type: 'button',
        class: 'run-item',
        'aria-current': state.selected === r.run_id ? 'true' : 'false',
        'data-run': r.run_id,
        onclick: () => select(r.run_id, 'inspect'),
      },
      h('span', { class: 'title' }, r.request_title || r.request_id || 'Request awaiting intake'),
      h('span', { class: 'id' }, r.run_id),
      strip(r.stage_states),
      h('span', { class: 'state' }, stateGlyph(r.needs_human ? 'WAITING_HUMAN' : r.final_outcome === 'BLOCKED' ? 'BLOCKED' : r.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED' ? 'COMPLETED' : r.dispatch_status === 'DISPATCHED_AWAITING_RESULT' ? 'DISPATCHED_AWAITING_RESULT' : r.final_outcome === 'UNREADABLE' ? 'BLOCKED' : 'CURRENT_IDLE'), r.source_status === 'CURRENT' || r.source_status === 'INCOMPLETE_TAIL' ? `${OUTCOME_TEXT[r.final_outcome]}; ${r.stage || '—'}` : `${r.source_status}`),
      h('span', { class: 'meta' }, h('span', {}, r.application_label || 'Unknown app'), h('span', {}, r.last_committed_at ? ago(r.last_committed_at) : '')),
      )))),
  );
}

function stagesPanel(v) {
  inspectFlow?.destroy();
  inspectFlow = createFlow({
    compact: true,
    onSelect: (id) => {
      state.stage = state.stage === id ? null : id;
      writeHash();
      render();
    },
  });
  inspectFlow.update(v, { selected: state.stage });
  return h('section', { class: 'panel stages-panel', 'aria-label': 'Pipeline stages' },
    h('h2', {}, h('span', {}, `Stages · ${v.workflow.id ?? 'unknown'} v${v.workflow.version ?? '?'}`), h('span', {}, 'Select a stage for its records')),
    inspectFlow.el);
}

function main() {
  const v = state.view;
  if (!state.selected) {
    return h('main', { class: 'main' }, h('div', { class: 'notice' }, h('h2', {}, 'Select a run'), h('p', {}, 'Pick a run from the list to follow its stages, its agent attempts, and the evidence behind each step. Runs waiting for a decision are marked.')));
  }
  if (!v) {
    return h('main', { class: 'main' }, h('div', { class: state.error ? 'notice danger' : 'notice' }, h('h2', {}, state.error ? 'Run unavailable' : 'Loading run'), h('p', {}, state.error ? state.error : `Reading ${state.selected}…`)));
  }
  const readable = v.source_status === 'CURRENT' || v.source_status === 'INCOMPLETE_TAIL';
  const bands = [];
  if (!readable) bands.push(unreadableBand(v));
  else if (v.final_outcome === 'WAITING_HUMAN') bands.push(humanBand(v, ctx));
  else if (v.final_outcome === 'BLOCKED') bands.push(blockedBand(v, state.report));
  else if (v.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED' || v.final_outcome === 'REJECTED') bands.push(doneBand(v, state.report, ctx));
  if (v.source_status === 'INCOMPLETE_TAIL') bands.push(h('div', { class: 'callout human' }, `${v.diagnostic.incomplete_tail_bytes} byte(s) after the last committed record were never acknowledged; they are not shown as an event.`));
  const counts = tabCounts(v);
  const tablist = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Activity and evidence' }, TABS.map(([id, label]) => h('button', {
    type: 'button',
    role: 'tab',
    id: `tab-${id}`,
    'aria-selected': state.tab === id ? 'true' : 'false',
    'aria-controls': `panel-${id}`,
    tabindex: state.tab === id ? '0' : '-1',
    'data-tab': id,
    onclick: () => {
      state.tab = id;
      writeHash();
      render();
    },
    onkeydown: (e) => {
      const i = TABS.findIndex(([x]) => x === id);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const nextTab = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0];
        state.tab = nextTab;
        writeHash();
        render();
        document.getElementById(`tab-${nextTab}`)?.focus();
        e.preventDefault();
      }
    },
  }, label, h('span', { class: 'count' }, counts[id]))));
  const panel = h('div', { role: 'tabpanel', id: `panel-${state.tab}`, 'aria-labelledby': `tab-${state.tab}`, tabindex: '0' },
    state.tab === 'timeline' ? timelineTab(v, ctx)
      : state.tab === 'attempts' ? attemptsTab(v, ctx)
        : state.tab === 'tests' ? testsTab(v, ctx)
          : state.tab === 'audits' ? auditsTab(v, ctx)
            : state.tab === 'reviews' ? reviewsTab(v, ctx)
              : state.tab === 'evidence' ? evidenceTab(v, ctx)
                : problemsTab(v));
  return h('main', { class: 'main' },
    h('section', { class: 'task-summary', 'aria-label': 'Task summary' },
      h('h1', {}, v.request.title || v.request.request_id || v.run_id, h('span', { class: 'chip', 'data-tone': OUTCOME_TONE[v.final_outcome] || 'neutral', 'data-testid': 'run-status' }, OUTCOME_TEXT[v.final_outcome] || v.final_outcome)),
      h('p', {}, v.request.outcome || (readable ? 'The task summary will appear when an intent is accepted.' : 'Task summary unavailable.')),
      h('p', { class: 'hint' }, v.run_id, v.transport_class === 'SIMULATED' ? ' · Simulated role results' : ''),
    ),
    state.error ? h('p', { class: 'callout danger', role: 'status' }, `Update unavailable: ${state.error}. Showing the last received state.`) : null,
    bands,
    readable && !['WAITING_HUMAN', 'BLOCKED', 'LOCAL_PR_PROPOSAL_PREPARED', 'REJECTED'].includes(v.final_outcome) ? nowPanel(v) : null,
    readable && v.stage_graph.length > 0 ? stagesPanel(v) : null,
    readable && state.stage ? stageDetail(v, state.stage, ctx) : null,
    h('section', { class: 'panel', 'aria-label': 'Activity and evidence' }, tablist, panel),
    readable ? runFacts(v) : null,
  );
}

function runFacts(v) {
  return h('details', { class: 'panel run-facts', 'data-view-key': 'run-facts', 'aria-label': 'Run facts' },
    h('summary', {}, 'Run facts and technical details'),
    h('div', { class: 'content' },
      kv([
        ['Request', `${v.request.request_id || '—'}${v.request.locator ? ` (${v.request.locator})` : ''}`],
        ['Application', v.application.label ? `${v.application.label} (from the retained package.json)` : 'Unknown: no name retained'],
        ['Workflow', `${v.workflow.id || '—'} v${v.workflow.version ?? '?'}`],
        ['Execution profile', v.workflow.execution_profile === 'STANDARD' ? 'Standard' : 'Unknown'],
        ['Profile', `${v.profile.id || '—'} v${v.profile.version ?? '?'}`],
        ['Role results', v.transport_class === 'SIMULATED' ? 'SIMULATED: scripted fixture content, not the work of any model or person' : v.transport_class || '—'],
        ['Started', fmtTime(v.started_at) || '—'],
        ['Last committed', `${fmtTime(v.last_committed_at) || '—'} (journal v${v.journal_version})`],
        ['Audit budget', v.engine.audit_budget ? `${v.engine.audit_budget.used} of ${v.engine.audit_budget.max}` : '—'],
        ['Publication', v.engine.publication_status || '—'],
        ['Report', state.report.available ? h('a', { href: `/api/v1/runs/${encodeURIComponent(v.run_id)}/report`, target: '_blank', rel: 'noopener' }, state.report.path) : 'not generated (written at a terminal state)'],
      ]),
      h('p', { class: 'hint' }, 'Select a stage above to see its attempts and records.'),
    ),
  );
}

// ---------------------------------------------------------------- render

// `mode`: where the selection was made; a run chosen in Live or from the switcher opens in Live.
function select(runId, mode = state.mode) {
  viewEpoch += 1;
  state.selected = runId;
  state.mode = mode;
  state.stage = null;
  state.view = null;
  state.error = null;
  state.pendingCues = null;
  state.report = { available: false, path: null };
  writeHash();
  render();
  if (runId) {
    loadRun(runId)
      .then((changed) => { if (changed) render(); });
  }
}

function focusSelector(element) {
  if (!element || !root.contains(element)) return null;
  if (element.matches('summary') && element.parentElement.dataset.viewKey) return `[data-view-key="${CSS.escape(element.parentElement.dataset.viewKey)}"] > summary`;
  for (const key of ['focus', 'stage', 'tab', 'run', 'switch', 'mode', 'testid', 'theme-choice']) {
    const value = element.getAttribute(`data-${key}`);
    if (value !== null) return `${element.tagName.toLowerCase()}[data-${key}="${CSS.escape(value)}"]`;
  }
  return element.id ? `#${CSS.escape(element.id)}` : null;
}

function playPending() {
  const pending = state.pendingCues;
  state.pendingCues = null;
  if (!state.view || !state.selected) return;
  if (state.mode !== 'live') {
    // Inspect shows no motion, but what it showed must never replay later in Live.
    player.prime(state.selected, state.view.journal_version);
    return;
  }
  if (pending && pending.runId === state.selected) player.play(pending.runId, pending.cues, { catchUp: pending.catchUp, events: pending.events });
  if (live && live.runId === state.selected) live.api.setAway(player.missed(state.selected));
}

function render() {
  const focus = focusSelector(document.activeElement);
  const sameRun = root.dataset.run === (state.selected || '');
  const sameMode = root.dataset.mode === state.mode;
  const scrollY = globalThis.scrollY;
  const scrolls = new Map([...root.querySelectorAll('[data-scroll-key]')].map((el) => [el.dataset.scrollKey, { left: el.scrollLeft, top: el.scrollTop }]));
  for (const el of root.querySelectorAll('details[data-view-key]')) disclosures.set(`${root.dataset.run}:${el.dataset.viewKey}`, el.open);
  const headerBottom = root.querySelector('header.top')?.getBoundingClientRect().bottom || 0;
  const anchor = [...root.querySelectorAll('[data-reading-anchor]')].find((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top >= headerBottom && rect.top < globalThis.innerHeight;
  });
  const anchorTop = anchor?.getBoundingClientRect().top;
  const anchorKey = anchor?.dataset.readingAnchor;

  const content = state.mode === 'live' ? liveContent() : h('div', { class: 'body' }, sidebar(), main());
  if (!root.querySelector('header.top')) root.replaceChildren();
  renderHeaderOnly();
  const current = root.children[1];
  if (current !== content) {
    if (current) current.replaceWith(content);
    else root.append(content);
  }
  root.dataset.run = state.selected || '';
  root.dataset.mode = state.mode;
  root.dataset.connection = state.paused ? 'paused' : state.connection;
  root.dataset.state = state.view ? state.view.final_outcome : state.selected ? 'loading' : 'idle';

  if (state.mode === 'inspect') {
    for (const el of root.querySelectorAll('details[data-view-key]')) {
      const open = disclosures.get(`${root.dataset.run}:${el.dataset.viewKey}`);
      if (open !== undefined && el.dataset.viewKey !== 'switcher') el.open = open;
    }
    for (const el of root.querySelectorAll('[data-scroll-key]')) {
      const saved = scrolls.get(el.dataset.scrollKey);
      if (saved && (sameRun || el.dataset.scrollKey === 'runs')) { el.scrollLeft = saved.left; el.scrollTop = saved.top; }
    }
  }
  if (focus) root.querySelector(focus)?.focus({ preventScroll: true });
  if (state.mode === 'inspect' || !sameMode || !sameRun) {
    const restoredAnchor = sameRun && sameMode && anchorKey ? root.querySelector(`[data-reading-anchor="${CSS.escape(anchorKey)}"]`) : null;
    globalThis.scrollTo(0, sameRun && sameMode ? scrollY + (restoredAnchor && anchorTop !== undefined ? restoredAnchor.getBoundingClientRect().top - anchorTop : 0) : 0);
  }
  tickClocks(root, Date.now());
  playPending();
}

// ---------------------------------------------------------------- start

applyTheme(currentTheme());
readHash();
window.addEventListener('hashchange', () => {
  const before = state.selected;
  readHash();
  if (state.selected !== before) select(state.selected, state.mode);
  else render();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  updateAlerts();
  if (state.mode === 'live' && state.view && live && live.runId === state.selected) {
    live.api.update(state.view, { report: state.report, away: player.missed(state.selected), error: state.error });
    player.resume(state.selected);
  }
});
document.addEventListener('fullscreenchange', () => {
  root.toggleAttribute('data-fullscreen', Boolean(document.fullscreenElement));
  renderHeaderOnly();
  live?.api.redraw();
});
document.addEventListener('keydown', (e) => {
  // F toggles full screen, unless a modifier is held or a text field has focus.
  if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target.closest?.('input, textarea, select, [contenteditable]')) {
    toggleFullscreen();
  }
});
document.addEventListener('click', (e) => {
  // A click outside the open run switcher closes it.
  const open = root.querySelector('details.switcher[open]');
  if (open && !open.contains(e.target)) open.open = false;
});
render();
refreshAll().catch((e) => {
  state.error = e.message;
  render();
});
connect();
startClock((now) => {
  tickClocks(root, now);
  if (live && state.mode === 'live') live.api.tick(now);
});
clockTimer = setInterval(() => {
  if (state.connection === 'stale' || state.connection === 'live') renderHeaderOnly();
}, 10_000);
clockTimer.unref?.();
