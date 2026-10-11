// Tab title and tab icon, so a run that needs a human (or blocked, or
// finished while the tab was in the background) is visible from another
// window. The state machine is pure; `applyAlerts` writes it to the page.

import { SVG_NS } from './dom.js';

export const BASE_TITLE = 'RSTACK Mission Control';
const DOT = { red: '#f87171', amber: '#fbbf24', green: '#34d399' };

// runs: the current run summaries; previous: the summaries before this update
// (null on the first load); hidden: whether the tab is in the background;
// markers: the red/green markers carried from the last call.
export function alertState({ runs, previous, hidden, markers }) {
  const next = { red: Boolean(markers && markers.red), green: Boolean(markers && markers.green) };
  if (!hidden) {
    next.red = false;
    next.green = false;
  } else if (previous) {
    const before = new Map(previous.map((r) => [r.run_id, r.final_outcome]));
    for (const r of runs) {
      if (before.get(r.run_id) === r.final_outcome) continue;
      if (r.final_outcome === 'BLOCKED') next.red = true;
      if (r.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED') next.green = true;
    }
  }
  const needs = runs.filter((r) => r.needs_human).length;
  const icon = next.red ? 'red' : needs > 0 ? 'amber' : next.green ? 'green' : 'none';
  return { title: needs > 0 ? `(${needs}) Needs you · ${BASE_TITLE}` : BASE_TITLE, icon, markers: next, needs };
}

export function iconHref(icon) {
  const dot = DOT[icon] ? `<circle cx='24' cy='8' r='7' fill='${DOT[icon]}' stroke='#070b16' stroke-width='2'/>` : '';
  const mark = "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#a78bfa'/><stop offset='1' stop-color='#3b82f6'/></linearGradient></defs>"
    + "<rect x='2' y='4' width='25' height='25' rx='8' fill='url(#g)'/>"
    + "<path d='M9 21 L14.5 12 L20 21' fill='none' stroke='#fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/>";
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='${SVG_NS}' viewBox='0 0 32 32'>${mark}${dot}</svg>`)}`;
}

export function applyAlerts(doc, state) {
  if (doc.title !== state.title) doc.title = state.title;
  let link = doc.querySelector('link[rel="icon"]');
  if (!link) {
    link = doc.createElement('link');
    link.rel = 'icon';
    doc.head.append(link);
  }
  const href = iconHref(state.icon);
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  link.dataset.icon = state.icon;
}
