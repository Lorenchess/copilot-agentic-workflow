// The stage rail: the retained workflow definition as a row of stages on
// the main path, with explicit branch routes below. Every
// node is a button; its state is a glyph, a label, and a colour together.
// Under 900px the same markup reads as a vertical list.

import { h, STATE_GLYPH, STATE_TEXT, roleLabel, stageLabel } from './views.js';

function mainPath(stages) {
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

function node(stage, selected, current, justChanged, onSelect) {
  const text = STATE_TEXT[stage.state] || stage.state;
  const button = h('button', {
    class: 'node',
    type: 'button',
    'aria-pressed': selected ? 'true' : 'false',
    'aria-label': `${stage.label}: ${text}${current ? ' (current stage)' : ''}`,
    'data-stage': stage.stage_id,
    onclick: () => onSelect(stage.stage_id),
  }, STATE_GLYPH[stage.state] || '○');
  const sub = stage.kind === 'role' ? roleLabel(stage.role) : stage.kind === 'human' ? 'Human' : 'Engine';
  return h('li', {
    class: `stage${current ? ' is-current' : ''}${stage.branch ? ' branch' : ''}${justChanged ? ' just-changed' : ''}`,
    'data-state': stage.state,
    'data-stage': stage.stage_id,
  }, button, h('span', { class: 'lab' }, stage.label), h('span', { class: 'sub' }, current ? 'Current stage' : sub));
}

export function renderRail(view, selectedStage, changedStages, onSelect) {
  const stages = view.stage_graph;
  const path = mainPath(stages);
  const pathIds = new Set(path.map((s) => s.stage_id));
  const branches = stages.filter((s) => !pathIds.has(s.stage_id));
  const current = view.engine.stage;
  const legend = h('div', { class: 'rail-legend', 'aria-hidden': 'true' },
    ['COMPLETED', 'DISPATCHED_AWAITING_RESULT', 'WAITING_HUMAN', 'BLOCKED', 'NOT_REACHED'].map((s) => h('span', {}, h('span', { class: `glyph state-${tone(s)}` }, STATE_GLYPH[s]), STATE_TEXT[s])),
  );
  const list = h('ol', { class: 'rail', 'aria-label': 'Pipeline stages on the main path' },
    path.map((s) => node(s, s.stage_id === selectedStage, s.stage_id === current, changedStages.has(s.stage_id), onSelect)));
  const branchList = branches.length > 0 ? h('ul', { class: 'branch-routes', 'aria-label': 'Branch routes' }, branches.map((b) => {
    // Show only observed entry routes; the retained definition supplies the
    // return stage even when an optional branch has never been entered.
    const entries = view.timeline.filter((event, i, all) => event.stage_after === b.stage_id && i > 0 && all[i - 1].stage_after !== b.stage_id);
    const origins = [...new Set(entries.map((event) => view.timeline.find((previous) => previous.seq === event.seq - 1)?.stage_after).filter(Boolean))];
    return h('li', {},
      h('span', { class: 'hint' }, origins.length ? `From ${origins.map((id) => stageLabel(view, id)).join(', ')} → ` : 'Optional: '),
      h('button', { type: 'button', class: 'btn branch-link', 'data-stage': b.stage_id, 'aria-pressed': selectedStage === b.stage_id ? 'true' : 'false', onclick: () => onSelect(b.stage_id) }, STATE_GLYPH[b.state], ' ', b.label),
      h('span', { class: 'hint' }, ` → ${stageLabel(view, b.next)} · ${STATE_TEXT[b.state]}`),
    );
  })) : null;
  return h('section', { class: 'rail-wrap', 'aria-label': 'Pipeline' },
    h('div', { class: 'rail-head' }, h('h2', {}, `Workflow ${view.workflow.id ?? 'unknown'} v${view.workflow.version ?? '?'}`), legend),
    h('div', { class: 'rail-scroll', 'data-scroll-key': 'pipeline', tabindex: '0', role: 'region', 'aria-label': 'Scrollable workflow stages' }, list),
    branchList,
  );
}

export function tone(state) {
  switch (state) {
    case 'COMPLETED':
    case 'DONE_TERMINAL':
      return 'ok';
    case 'WAITING_HUMAN':
    case 'INVALIDATED':
      return 'human';
    case 'BLOCKED':
    case 'FAILED_ATTEMPT':
      return 'danger';
    case 'DISPATCHED_AWAITING_RESULT':
    case 'CURRENT_IDLE':
      return 'info';
    default:
      return 'neutral';
  }
}
