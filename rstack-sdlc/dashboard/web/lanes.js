// Who held the work: one lane per role present in the run, plus You and the
// Engine, on a time axis from the run's start to now (or to its terminal
// commit). Segments come from recorded dispatch, settle, wait and engine
// times; an open segment widens with the real clock and nothing else moves.

import { axis, isTerminal, lanes as deriveLanes, roleToken } from './derive.js';
import { keyed, setAttr, setText, setVar } from './dom.js';
import { h } from './views.js';

const KIND_TEXT = { accepted: 'accepted', pending: 'dispatched, awaiting result', failed: 'failed', superseded: 'accepted, later superseded', wait: 'waiting for you', tick: 'engine step' };

function tokenOf(key) {
  if (key === 'human') return 'you';
  if (key === 'engine') return 'engine';
  return roleToken(key, 'role');
}

function hhmm(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(11, 16);
}

function span(ms) {
  const m = Math.round(ms / 60000);
  if (m < 1) return `+${Math.max(0, Math.round(ms / 1000))}s`;
  return m < 60 ? `+${m}m` : `+${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
}

export function createLanes() {
  const empty = h('p', { class: 'hint lanes-empty' }, 'No one has held the work yet: nothing has been dispatched.');
  const axisRow = h('div', { class: 'lane-axis', 'aria-hidden': 'true' });
  const el = h('div', { class: 'lanes', role: 'group', 'aria-label': 'Who held the work, by role, on the run time axis' }, h('span', { 'aria-hidden': 'true' }), axisRow);
  const wrap = h('div', {}, el, empty);
  let view = null;

  function place(nowIso) {
    if (!view) return;
    const ax = axis(view, nowIso);
    const start = Date.parse(ax.start);
    const end = Date.parse(ax.end);
    for (const seg of el.querySelectorAll('.seg')) {
      const s = Date.parse(seg.dataset.start);
      const e = seg.dataset.end ? Date.parse(seg.dataset.end) : end;
      const x = Number.isNaN(s) || Number.isNaN(start) ? 0 : Math.min(100, Math.max(0, ((s - start) / ax.ms) * 100));
      const w = Number.isNaN(e) || Number.isNaN(s) ? 0 : Math.min(100 - x, Math.max(0, ((e - s) / ax.ms) * 100));
      setVar(seg, '--x', `${x.toFixed(3)}%`);
      setVar(seg, '--w', `${w.toFixed(3)}%`);
    }
    const labels = Number.isNaN(start) ? ['', '', '', '', ''] : [hhmm(ax.start), span(ax.ms / 4), span(ax.ms / 2), span((ax.ms * 3) / 4), isTerminal(view) ? 'ended' : 'now'];
    keyed(axisRow, labels.map((text, i) => ({ i, text })), (l) => l.i, () => h('span', {}), (node, l) => setText(node, l.text));
  }

  function update(v, nowIso) {
    view = v;
    const lanes = deriveLanes(v);
    empty.hidden = lanes.length > 0;
    el.hidden = lanes.length === 0;
    setAttr(el, 'data-open', isTerminal(v) ? null : '');
    keyed(el, lanes, (l) => l.key, () => h('div', { class: 'lane-row' }, h('span', { class: 'lane-label' }), h('div', { class: 'lane-track', role: 'img' })), (row, lane) => {
      setAttr(row, 'data-token', tokenOf(lane.key));
      setText(row.querySelector('.lane-label'), lane.label);
      const track = row.querySelector('.lane-track');
      const counts = lane.segments.reduce((m, s) => m.set(s.kind, (m.get(s.kind) || 0) + 1), new Map());
      setAttr(track, 'aria-label', `${lane.label}: ${[...counts].map(([k, n]) => `${n} ${KIND_TEXT[k] || k}`).join(', ')}`);
      keyed(track, lane.segments, (s) => s.id, () => h('span', { class: 'seg' }), (seg, s) => {
        setAttr(seg, 'data-kind', s.kind);
        setAttr(seg, 'data-start', s.start);
        setAttr(seg, 'data-end', s.end);
        setAttr(seg, 'data-open', s.end === null ? '' : null);
      });
    });
    place(nowIso);
  }

  return {
    el: wrap,
    update,
    tick(nowIso) {
      if (view && !isTerminal(view)) place(nowIso);
    },
  };
}
