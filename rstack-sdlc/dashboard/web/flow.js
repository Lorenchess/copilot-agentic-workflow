// The pipeline: one card per stage of the run's retained workflow definition,
// laid out row by row for the space available, joined by wires drawn from the
// cards' measured positions. The pure layout and routing functions come
// first; they also load in Node for their tests. The DOM part keeps cards
// keyed by stage so a running loop or cue survives an update.

import { fmtDuration, isTerminal, mainPath, roleBadge, roleLabel, roleToken, stageTiming } from './derive.js';
import { keyed, setAttr, setText, setVar, svg } from './dom.js';
import { STATE_GLYPH, STATE_TEXT, h, stageLabel } from './views.js';

// Columns for the pipeline's content width: wide rows, medium rows, or a list.
export function columnsFor(width) {
  if (width >= 940) return 7;
  if (width >= 640) return 5;
  return 1;
}

// Row-major positions, left to right on every row.
export function layout(count, columns) {
  const cols = Math.max(1, columns);
  return Array.from({ length: count }, (_, index) => ({ index, row: Math.floor(index / cols), col: index % cols }));
}

const half = (n) => Math.round(n * 2) / 2;
const midX = (r) => half((r.left + r.right) / 2);
const midY = (r) => half((r.top + r.bottom) / 2);

// An SVG path from card `a` to card `b` (rectangles in the pipeline's own
// coordinates). `pa`/`pb` are their layout positions; `columns` the current
// column count. Neighbours on a row get a straight wire between facing
// edges; the next stage on the following row gets a wrap-around wire through
// the gap between the rows (at `gapMid` when given); anything else (a loop
// back, a skip) an arc that clears the cards.
export function route(a, b, pa, pb, columns, gapMid) {
  if (columns === 1) {
    if (Math.abs(pa.index - pb.index) === 1) {
      return pa.index < pb.index ? `M ${midX(a)} ${half(a.bottom)} L ${midX(b)} ${half(b.top)}` : `M ${midX(a)} ${half(a.top)} L ${midX(b)} ${half(b.bottom)}`;
    }
    const x = half(Math.max(a.right, b.right) + 22);
    return `M ${half(a.right)} ${midY(a)} C ${x} ${midY(a)}, ${x} ${midY(b)}, ${half(b.right)} ${midY(b)}`;
  }
  if (pa.row === pb.row && Math.abs(pa.col - pb.col) === 1) {
    const y = midY(a);
    return pa.col < pb.col ? `M ${half(a.right)} ${y} L ${half(b.left)} ${y}` : `M ${half(a.left)} ${y} L ${half(b.right)} ${y}`;
  }
  if (pb.index === pa.index + 1 && pb.row === pa.row + 1) {
    const x1 = half(a.right);
    const y1 = midY(a);
    const x2 = half(b.left);
    const y2 = midY(b);
    const ym = half(gapMid ?? (a.bottom + b.top) / 2);
    return `M ${x1} ${y1} C ${x1 + 24} ${y1}, ${x1 + 24} ${ym}, ${x1} ${ym} L ${x2} ${ym} C ${x2 - 24} ${ym}, ${x2 - 24} ${y2}, ${x2} ${y2}`;
  }
  const y = half(Math.min(a.top, b.top) - 26);
  return `M ${midX(a)} ${half(a.top)} C ${midX(a)} ${y}, ${midX(b)} ${y}, ${midX(b)} ${half(b.top)}`;
}

// The short state word on a card; the full STATE_TEXT is in its accessible name.
export function stateWord(stage) {
  switch (stage.state) {
    case 'COMPLETED':
      return stage.kind === 'human' ? 'decided' : stage.kind === 'deterministic' ? 'done' : 'accepted';
    case 'DONE_TERMINAL':
      return 'done';
    case 'DISPATCHED_AWAITING_RESULT':
      return 'awaiting result';
    case 'CURRENT_IDLE':
      return 'next';
    case 'WAITING_HUMAN':
      return 'needs you';
    case 'FAILED_ATTEMPT':
      return 'attempt failed';
    case 'INVALIDATED':
      return 'invalidated';
    case 'BLOCKED':
      return 'blocked';
    case 'NOT_TAKEN':
      return 'not taken';
    case 'NOT_REACHED':
      return 'not reached';
    default:
      return String(stage.state || 'unknown').toLowerCase().replaceAll('_', ' ');
  }
}

// ---------------------------------------------------------------- DOM

const DONE = new Set(['COMPLETED', 'DONE_TERMINAL']);
const OPEN = new Set(['CURRENT_IDLE', 'DISPATCHED_AWAITING_RESULT', 'WAITING_HUMAN']);

function subText(stage) {
  if (stage.kind === 'human') return 'You';
  if (stage.kind === 'deterministic') return 'Engine';
  return roleLabel(stage.role) || 'Role';
}

// `onSelect(stageId)` is called when a card or branch chip is chosen.
export function createFlow({ compact = false, onSelect } = {}) {
  const flow = h('div', { class: compact ? 'flow compact' : 'flow' });
  const wires = svg('svg', { class: 'wires', 'aria-hidden': 'true', focusable: 'false' });
  const temp = svg('path', { class: 'wire temp' });
  const packetEl = h('div', { class: 'packet', 'aria-hidden': 'true' });
  const stage = h('div', { class: 'flow-stage' }, flow, packetEl);
  stage.prepend(wires);
  const el = h('div', { class: 'flow-wrap' }, stage);
  let view = null;
  let path = [];
  let cols = 0;
  let frame = 0;
  let selected = null;

  const rectOf = (node, base) => {
    const r = node.getBoundingClientRect();
    return { left: r.left - base.left, top: r.top - base.top, right: r.right - base.left, bottom: r.bottom - base.top };
  };
  const cardOf = (id) => (id ? flow.querySelector(`[data-stage="${CSS.escape(id)}"]`) : null);

  function edgePath(i) {
    const base = stage.getBoundingClientRect();
    const a = cardOf(path[i].stage_id);
    const b = cardOf(path[i + 1].stage_id);
    if (!a || !b) return null;
    const pos = layout(path.length, cols);
    const cellA = rectOf(a.parentElement, base);
    const cellB = rectOf(b.parentElement, base);
    return route(rectOf(a, base), rectOf(b, base), pos[i], pos[i + 1], cols, (cellA.bottom + cellB.top) / 2);
  }

  function drawWires() {
    if (!view || !flow.isConnected || cols === 0) return;
    const terminal = isTerminal(view);
    const edges = path.slice(0, -1).map((s, i) => ({ i, key: `${s.stage_id}>${path[i + 1].stage_id}`, from: s, to: path[i + 1] }));
    keyed(wires, edges, (e) => e.key, () => svg('path', { class: 'wire' }), (node, e) => {
      setAttr(node, 'd', edgePath(e.i) || '');
      const done = DONE.has(e.to.state) || (DONE.has(e.from.state) && e.to.state !== 'NOT_REACHED' && e.to.state !== 'NOT_TAKEN');
      const hot = !terminal && view.engine.stage === e.to.stage_id && OPEN.has(e.to.state);
      setAttr(node, 'class', `wire${hot ? ' hot' : done ? ' done' : ''}`);
      setAttr(node, 'data-edge', e.key);
    });
    if (temp.parentNode !== wires) wires.append(temp);
  }

  const relayout = () => {
    const c = columnsFor(flow.clientWidth);
    if (c !== cols) {
      cols = c;
      setVar(flow, '--cols', c);
      flow.classList.toggle('list', c === 1);
    }
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        drawWires();
      });
    }
  };
  const observer = new ResizeObserver(relayout);
  observer.observe(flow);

  function updateSpur(spur, b, v) {
    const entries = v.timeline.filter((e, i, all) => e.stage_after === b.stage_id && i > 0 && all[i - 1].stage_after !== b.stage_id);
    const origins = [...new Set(entries.map((e) => v.timeline.find((p) => p.seq === e.seq - 1)?.stage_after).filter(Boolean))];
    const text = b.state === 'NOT_TAKEN'
      ? `↺ ${b.label} · not taken`
      : `↺ ${b.label} · ${origins.length ? `from ${origins.map((o) => stageLabel(v, o)).join(', ')}` : stateWord(b)}`;
    setText(spur, text);
    setAttr(spur, 'data-stage', b.stage_id);
    setAttr(spur, 'data-state', b.state);
    setAttr(spur, 'data-focus', `spur-${b.stage_id}`);
    setAttr(spur, 'aria-label', `Branch ${b.label}: ${STATE_TEXT[b.state] || b.state}`);
    setAttr(spur, 'title', text);
  }

  function updateCell(cell, s, v, spurs) {
    const card = cell.querySelector('.card');
    const isCurrent = s.stage_id === v.engine.stage;
    const label = s.label || stageLabel(v, s.stage_id);
    setAttr(card, 'data-stage', s.stage_id);
    setAttr(card, 'data-state', s.state);
    setAttr(card, 'data-token', roleToken(s.role, s.kind));
    setAttr(card, 'data-focus', `card-${s.stage_id}`);
    setAttr(card, 'aria-label', `${label}: ${STATE_TEXT[s.state] || s.state}${isCurrent ? ' (current stage)' : ''}`);
    setAttr(card, 'aria-pressed', compact ? (selected === s.stage_id ? 'true' : 'false') : null);
    setAttr(card, 'title', label);
    card.classList.toggle('is-current', isCurrent);
    setText(card.querySelector('.badge'), roleBadge(s.role, s.kind));
    setText(card.querySelector('.card-label'), label);
    setText(card.querySelector('.card-sub'), subText(s));
    setText(card.querySelector('.card-status'), `${STATE_GLYPH[s.state] || '○'} ${stateWord(s)}`);
    const time = card.querySelector('.card-time');
    const t = stageTiming(v, s.stage_id);
    if (t.since) {
      setAttr(time, 'data-since', t.since);
    } else {
      setAttr(time, 'data-since', null);
      setText(time, t.seconds !== null ? fmtDuration(t.seconds) : '');
    }
    keyed(cell.querySelector('.spur-slot'), spurs.get(s.stage_id) || [], (b) => b.stage_id,
      () => h('button', { type: 'button', class: 'spur', onclick: (e) => onSelect && onSelect(e.currentTarget.dataset.stage) }),
      (spur, b) => updateSpur(spur, b, v));
  }

  function update(v, opts = {}) {
    view = v;
    selected = opts.selected ?? null;
    path = mainPath(v.stage_graph);
    const pathIds = new Set(path.map((s) => s.stage_id));
    const spurs = new Map();
    let branchCount = 0;
    for (const b of v.stage_graph) {
      if (pathIds.has(b.stage_id)) continue;
      branchCount += 1;
      // A branch hangs above the main-path stage it rejoins.
      const target = b.next && pathIds.has(b.next) ? b.next : path[0]?.stage_id;
      if (!spurs.has(target)) spurs.set(target, []);
      spurs.get(target).push(b);
    }
    flow.classList.toggle('has-spurs', branchCount > 0);
    keyed(flow, path, (s) => s.stage_id, () => h('div', { class: 'cell' },
      h('div', { class: 'spur-slot' }),
      h('button', { type: 'button', class: 'card', onclick: (e) => onSelect && onSelect(e.currentTarget.dataset.stage) },
        h('span', { class: 'card-head' }, h('span', { class: 'badge', 'aria-hidden': 'true' }), h('span', { class: 'card-label' })),
        h('span', { class: 'card-sub' }),
        h('span', { class: 'card-foot' }, h('span', { class: 'card-status' }), h('span', { class: 'card-time' })),
      ),
    ), (cell, s) => updateCell(cell, s, v, spurs));
    relayout();
  }

  const tag = (anim, id) => {
    if (anim && id) anim.id = id;
    return anim;
  };

  // Moves the packet from one stage to another along the wire between them.
  function packet(fromId, toId, { id, delay = 0 } = {}) {
    const a = cardOf(fromId);
    const b = cardOf(toId);
    if (!a || !b || cols === 0) return null;
    const i = path.findIndex((s) => s.stage_id === fromId);
    const wire = i >= 0 && path[i + 1]?.stage_id === toId ? wires.querySelector(`[data-edge="${CSS.escape(`${fromId}>${toId}`)}"]`) : null;
    let d = wire ? wire.getAttribute('d') : null;
    if (d) {
      tag(wire.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -39 }], { duration: 950, delay, easing: 'linear' }), id);
    } else {
      const base = stage.getBoundingClientRect();
      const pos = layout(path.length, cols);
      const ia = path.findIndex((s) => s.stage_id === fromId);
      const ib = path.findIndex((s) => s.stage_id === toId);
      d = route(rectOf(a, base), rectOf(b, base), ia >= 0 ? pos[ia] : { index: -10, row: -1, col: -1 }, ib >= 0 ? pos[ib] : { index: -20, row: -2, col: -2 }, cols);
      setAttr(temp, 'd', d);
      tag(temp.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.15 }, { opacity: 0.85, offset: 0.85 }, { opacity: 0 }], { duration: 1000, delay }), id);
    }
    packetEl.style.offsetPath = `path("${d}")`;
    return tag(packetEl.animate([
      { offsetDistance: '0%', opacity: 0 },
      { offsetDistance: '6%', opacity: 1, offset: 0.08 },
      { offsetDistance: '100%', opacity: 1, offset: 0.92 },
      { offsetDistance: '100%', opacity: 0 },
    ], { duration: 950, delay, easing: 'cubic-bezier(.55,0,.3,1)' }), id);
  }

  // A one-shot ring around a card or branch chip.
  function ring(stageId, tone, { id, delay = 0 } = {}) {
    const card = cardOf(stageId);
    if (!card) return null;
    const r = h('span', { class: 'ring', 'data-tone': tone, 'aria-hidden': 'true' });
    card.append(r);
    const anim = tag(r.animate([{ opacity: 0.95, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.14)' }], { duration: 900, delay, easing: 'ease-out' }), id);
    anim.finished.catch(() => undefined).finally(() => r.remove());
    return anim;
  }

  function pop(stageId, { id, delay = 0 } = {}) {
    const card = cardOf(stageId);
    if (!card) return null;
    return tag(card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 420, delay, easing: 'ease-out' }), id);
  }

  // One light sweep across the pipeline.
  function sweep({ id, delay = 0 } = {}) {
    const s = h('div', { class: 'sweep', 'aria-hidden': 'true' });
    stage.append(s);
    const width = stage.clientWidth;
    const anim = tag(s.animate([
      { opacity: 0, transform: 'translateX(-90px)' },
      { opacity: 1, offset: 0.1 },
      { opacity: 1, offset: 0.9 },
      { opacity: 0, transform: `translateX(${width}px)` },
    ], { duration: 1200, delay, easing: 'ease-in-out' }), id);
    anim.finished.catch(() => undefined).finally(() => s.remove());
    return anim;
  }

  return {
    el,
    update,
    cardOf,
    packet,
    ring,
    pop,
    sweep,
    redraw: relayout,
    destroy() {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    },
  };
}
