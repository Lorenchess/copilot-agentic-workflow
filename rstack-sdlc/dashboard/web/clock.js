// One timer for every elapsed clock on the page. A clock counts real time
// since a recorded engine timestamp (`data-since`), and stops at `data-until`
// when the run is terminal. Formatting is pure and loads in Node.

import { fmtDuration } from './derive.js';

// `offsetSeconds` is added time already closed (earlier waits before an open one).
export function elapsedText(sinceIso, untilIso, nowMs, offsetSeconds = 0) {
  const a = Date.parse(sinceIso);
  if (Number.isNaN(a)) return fmtDuration(offsetSeconds);
  const until = untilIso ? Date.parse(untilIso) : nowMs;
  const b = Number.isNaN(until) ? nowMs : until;
  return fmtDuration(Math.max(0, (b - a) / 1000) + offsetSeconds);
}

// Calls `tick(nowMs)` now and then every `intervalMs`; returns a stop function.
export function startClock(tick, intervalMs = 1000) {
  tick(Date.now());
  const id = setInterval(() => tick(Date.now()), intervalMs);
  return () => clearInterval(id);
}

// Updates every clock element under `root`.
export function tickClocks(root, nowMs) {
  for (const el of root.querySelectorAll('[data-since]')) {
    const text = elapsedText(el.dataset.since, el.dataset.until || null, nowMs, Number(el.dataset.offset) || 0);
    if (el.textContent !== text) el.textContent = text;
  }
}
