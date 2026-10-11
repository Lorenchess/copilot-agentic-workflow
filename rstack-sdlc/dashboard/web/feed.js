// The journal feed: the newest committed events, newest first, keyed by their
// journal number so a new event is one new row (which the hand-off cue
// slides in) and nothing else is rebuilt.

import { roleBadge, roleToken } from './derive.js';
import { keyed, setAttr, setText } from './dom.js';
import { ago, h } from './views.js';

const ENGINE = new Set(['start', 'deterministic', 'verification', 'proposal']);
const SHOWN = 6;

function who(view, entry, index) {
  if (entry.category === 'human') return { badge: 'YOU', token: 'you' };
  if (ENGINE.has(entry.category)) return { badge: 'EN', token: 'engine' };
  const id = entry.stage_id ?? (index > 0 ? view.timeline[index - 1].stage_after : null);
  const s = view.stage_graph.find((x) => x.stage_id === id);
  return s ? { badge: roleBadge(s.role, s.kind), token: roleToken(s.role, s.kind) } : { badge: 'EN', token: 'engine' };
}

function relative(iso, nowMs) {
  const s = Math.round((nowMs - Date.parse(iso)) / 1000);
  return Number.isNaN(s) ? '' : s < 5 ? 'just now' : ago(iso, nowMs);
}

export function createFeed() {
  const away = h('p', { class: 'away', role: 'status' });
  away.hidden = true;
  const list = h('ol', { class: 'feed', 'aria-label': 'Newest committed journal events' });
  const el = h('div', {}, away, list);

  function setAway(missed) {
    away.hidden = missed <= 0;
    setText(away, missed === 1 ? '1 event while you were away' : `${missed} events while you were away`);
  }

  function update(view, { away: missed = 0 } = {}) {
    const items = view.timeline.map((e, i) => ({ e, i })).slice(-SHOWN).reverse();
    keyed(list, items, (x) => x.e.seq, () => h('li', { class: 'ev' },
      h('span', { class: 'ev-v' }),
      h('span', { class: 'ev-text' }, h('span', { class: 'badge', 'aria-hidden': 'true' }), h('span', {})),
      h('span', { class: 'ev-ago' }),
    ), (li, { e, i }) => {
      const w = who(view, e, i);
      setAttr(li, 'data-seq', e.seq);
      setText(li.querySelector('.ev-v'), `v${e.seq}`);
      const badge = li.querySelector('.badge');
      setText(badge, w.badge);
      setAttr(badge, 'data-token', w.token);
      const text = li.querySelector('.ev-text span:last-child');
      setText(text, e.summary);
      setAttr(text, 'title', e.summary);
      const when = li.querySelector('.ev-ago');
      setAttr(when, 'data-at', e.at);
      setText(when, relative(e.at, Date.now()));
    });
    setAway(missed);
  }

  return {
    el,
    update,
    setAway,
    itemOf: (seq) => list.querySelector(`[data-seq="${seq}"]`),
    tick(nowMs) {
      for (const node of list.querySelectorAll('[data-at]')) setText(node, relative(node.dataset.at, nowMs));
    },
  };
}
