// RSTACK Mission Control: state, transport, routing, theme. The only truth
// shown is the read model the service returns for a committed journal
// version; this file never infers a transition from anything else.

import { renderRail } from './graph.js';
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
  filter: 'all',
  tab: 'timeline',
  stage: null,
  connection: 'connecting',
  lastEvent: null,
  paused: false,
  pendingWhilePaused: new Set(),
  pendingResync: false,
  changedStages: new Set(),
  error: null,
  loadingRun: false,
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
let lastRailStage = null;

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
}

function writeHash() {
  const params = new URLSearchParams();
  if (state.selected) params.set('run', state.selected);
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

async function loadRuns() {
  if (state.paused) return false;
  const epoch = viewEpoch;
  const request = ++listRequest;
  const data = await api('/api/v1/runs');
  if (epoch !== viewEpoch || request !== listRequest || state.paused) return false;
  state.runs = data.runs;
  state.workspace = data.workspace.label;
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
    state.changedStages = new Set();
    if (previous && previous.run_id === data.view.run_id && previous.journal_version !== data.view.journal_version) {
      for (const s of data.view.stage_graph) {
        const old = previous.stage_graph.find((x) => x.stage_id === s.stage_id);
        if (!old || old.state !== s.state) state.changedStages.add(s.stage_id);
      }
    }
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
    // A fresh connection reloads what may have been missed.
    refreshAll().catch(() => undefined);
  });
  source.addEventListener('heartbeat', () => {
    state.lastEvent = Date.now();
    setConnection('live');
    armStale();
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
};

function viewerDialog(title) {
  const dialog = h('dialog', { class: 'viewer', 'aria-label': title });
  const closeBtn = h('button', { type: 'button', class: 'btn', onclick: () => dialog.close() }, 'Close');
  dialog.append(h('div', { class: 'head' }, h('span', { class: 'title' }, title), closeBtn));
  dialog.addEventListener('close', () => dialog.remove());
  return dialog;
}

// ---------------------------------------------------------------- rendering

function connectionPill() {
  const map = {
    connecting: ['neutral', 'Connecting'],
    live: ['live', 'Live'],
    reconnecting: ['stale', 'Reconnecting'],
    disconnected: ['off', 'Disconnected; polling'],
    stale: ['stale', `Stale: no heartbeat for ${state.lastEvent ? ago(new Date(state.lastEvent).toISOString()) : 'a while'}`],
    paused: ['paused', `Paused${state.pendingResync ? ', updates pending' : state.pendingWhilePaused.size > 0 ? `, ${state.pendingWhilePaused.size} run(s) changed` : ''}`],
  };
  const [tone, text] = map[state.paused ? 'paused' : state.connection] || ['neutral', state.connection];
  return pill(tone, text, { role: 'status', 'aria-live': 'polite', 'data-testid': 'connection' });
}

function header() {
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
      if (!state.paused) {
        state.pendingWhilePaused.clear();
        state.pendingResync = false;
        refreshAll().catch(() => undefined);
      }
      renderHeaderOnly();
    },
  }, state.paused ? 'Resume live updates' : 'Pause live updates');
  return h('header', { class: 'top' },
    h('div', { class: 'brand' }, h('span', { class: 'name' }, 'RSTACK SDLC'), h('span', { class: 'workspace' }, state.workspace || '')),
    h('div', { class: 'run-strip', 'data-testid': 'run-strip' },
      v ? h('span', { class: 'run-title' }, v.request.title || v.request.request_id || v.run_id) : h('span', { class: 'hint' }, 'No run selected'),
      v && v.application.label ? h('span', {}, v.application.label) : null,
      v ? pill('neutral', v.workflow.execution_profile === 'STANDARD' ? 'Standard' : `Workflow ${v.workflow.id || 'unknown'}`) : null,
      v ? pill(OUTCOME_TONE[v.final_outcome], OUTCOME_TEXT[v.final_outcome], { 'data-testid': 'run-status' }) : null,
      v ? h('span', { class: 'hint', 'data-testid': 'synced' }, `Synced to journal v${v.journal_version}, ${fmtTime(v.last_committed_at) || '—'}`) : null,
    ),
    h('div', { class: 'controls' }, connectionPill(), pauseBtn, themeControl),
  );
}

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
    h('div', { class: 'side-head' }, h('h2', {}, `Runs (${state.runs.length})`), state.selected ? h('button', { type: 'button', class: 'btn quiet', 'data-focus': 'clear', onclick: () => select(null) }, 'Clear') : null),
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
        onclick: () => select(r.run_id),
      },
      h('span', { class: 'title' }, r.request_title || r.request_id || 'Request awaiting intake'),
      h('span', { class: 'id' }, r.run_id),
      h('span', { class: 'meta' }, h('span', {}, r.application_label || 'Unknown app'), h('span', {}, r.workflow.execution_profile === 'STANDARD' ? 'Standard' : r.workflow.id || '?')),
      h('span', { class: 'state' }, stateGlyph(r.needs_human ? 'WAITING_HUMAN' : r.final_outcome === 'BLOCKED' ? 'BLOCKED' : r.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED' ? 'COMPLETED' : r.dispatch_status === 'DISPATCHED_AWAITING_RESULT' ? 'DISPATCHED_AWAITING_RESULT' : r.final_outcome === 'UNREADABLE' ? 'BLOCKED' : 'CURRENT_IDLE'), r.source_status === 'CURRENT' || r.source_status === 'INCOMPLETE_TAIL' ? `${OUTCOME_TEXT[r.final_outcome]}; ${r.stage || '—'}` : `${r.source_status}`),
      h('span', { class: 'meta' }, h('span', {}, r.started_at ? `started ${fmtTime(r.started_at)}` : 'start unknown'), h('span', {}, r.last_committed_at ? ago(r.last_committed_at) : '')),
      )))),
  );
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
      h('h1', {}, v.request.title || v.request.request_id || v.run_id),
      h('p', {}, v.request.outcome || (readable ? 'The task summary will appear when an intent is accepted.' : 'Task summary unavailable.')),
      h('p', { class: 'hint' }, v.run_id, v.transport_class === 'SIMULATED' ? ' · Simulated role results' : ''),
    ),
    state.error ? h('p', { class: 'callout danger', role: 'status' }, `Update unavailable: ${state.error}. Showing the last received state.`) : null,
    bands,
    readable && !['WAITING_HUMAN', 'BLOCKED', 'LOCAL_PR_PROPOSAL_PREPARED', 'REJECTED'].includes(v.final_outcome) ? nowPanel(v) : null,
    readable ? renderRail(v, state.stage, state.changedStages, (id) => {
      state.stage = state.stage === id ? null : id;
      writeHash();
      render();
    }) : null,
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
      h('p', { class: 'hint' }, 'Select a stage on the rail to see its attempts and records.'),
    ),
  );
}

function select(runId) {
  viewEpoch += 1;
  state.selected = runId;
  state.stage = null;
  state.view = null;
  state.error = null;
  state.report = { available: false, path: null };
  lastRailStage = null;
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
  for (const key of ['focus', 'stage', 'tab', 'run', 'testid', 'theme-choice']) {
    const value = element.getAttribute(`data-${key}`);
    if (value !== null) return `${element.tagName.toLowerCase()}[data-${key}="${CSS.escape(value)}"]`;
  }
  return element.id ? `#${CSS.escape(element.id)}` : null;
}

function renderHeaderOnly() {
  const focus = focusSelector(document.activeElement);
  const old = root.querySelector('header.top');
  if (old) old.replaceWith(header());
  if (focus) root.querySelector(focus)?.focus({ preventScroll: true });
}

function render() {
  const focus = focusSelector(document.activeElement);
  const sameRun = root.dataset.run === (state.selected || '');
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
  root.replaceChildren(header(), h('div', { class: 'body' }, sidebar(), main()));
  root.dataset.run = state.selected || '';
  root.dataset.state = state.view ? state.view.final_outcome : state.selected ? 'loading' : 'idle';
  for (const el of root.querySelectorAll('details[data-view-key]')) {
    const open = disclosures.get(`${root.dataset.run}:${el.dataset.viewKey}`);
    if (open !== undefined) el.open = open;
  }
  for (const el of root.querySelectorAll('[data-scroll-key]')) {
    const saved = scrolls.get(el.dataset.scrollKey);
    if (saved && (sameRun || el.dataset.scrollKey === 'runs')) { el.scrollLeft = saved.left; el.scrollTop = saved.top; }
  }
  const railStage = state.view ? `${state.view.run_id}:${state.view.engine.stage}` : null;
  const rail = root.querySelector('.rail-scroll');
  const currentNode = rail?.querySelector('.is-current');
  if (rail && currentNode && railStage !== lastRailStage) {
    const box = currentNode.getBoundingClientRect();
    const viewport = rail.getBoundingClientRect();
    rail.scrollLeft += (box.left + box.right - viewport.left - viewport.right) / 2;
    if (rail.scrollHeight > rail.clientHeight) rail.scrollTop += (box.top + box.bottom - viewport.top - viewport.bottom) / 2;
  }
  lastRailStage = railStage;
  if (focus) root.querySelector(focus)?.focus({ preventScroll: true });
  const restoredAnchor = sameRun && anchorKey ? root.querySelector(`[data-reading-anchor="${CSS.escape(anchorKey)}"]`) : null;
  globalThis.scrollTo(0, sameRun ? scrollY + (restoredAnchor && anchorTop !== undefined ? restoredAnchor.getBoundingClientRect().top - anchorTop : 0) : 0);
}

// ---------------------------------------------------------------- start

applyTheme(currentTheme());
readHash();
window.addEventListener('hashchange', () => {
  const before = state.selected;
  readHash();
  if (state.selected !== before) select(state.selected);
  else render();
});
render();
refreshAll().catch((e) => {
  state.error = e.message;
  render();
});
connect();
clockTimer = setInterval(() => {
  if (state.connection === 'stale' || state.connection === 'live') renderHeaderOnly();
}, 10_000);
clockTimer.unref?.();
