// The page's pure layout, clock, and alert logic (dashboard/web/flow.js,
// clock.js, alerts.js). Evidence class: unit tests (offline).

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadWeb } from './support/web-module.ts';

interface Rect { left: number; top: number; right: number; bottom: number }
interface Pos { index: number; row: number; col: number }
interface Flow {
  columnsFor(width: number): number;
  layout(count: number, columns: number): Pos[];
  route(a: Rect, b: Rect, pa: Pos, pb: Pos, columns: number): string;
}
interface Clock { elapsedText(since: string, until: string | null, now: number): string }
interface Summary { run_id: string; final_outcome: string; needs_human: boolean }
interface Alerts {
  BASE_TITLE: string;
  alertState(o: { runs: Summary[]; previous: Summary[] | null; hidden: boolean; markers: { red: boolean; green: boolean } | null }): { title: string; icon: string; markers: { red: boolean; green: boolean }; needs: number };
  iconHref(icon: string): string;
}

const flow = await loadWeb<Flow>('flow.js');
const clock = await loadWeb<Clock>('clock.js');
const alerts = await loadWeb<Alerts>('alerts.js');

test('the pipeline uses seven columns, five, or a single list by content width', () => {
  assert.deepEqual([1200, 940, 939, 640, 639, 0].map((w) => flow.columnsFor(w)), [7, 7, 5, 5, 1, 1]);
});

test('layout fills rows left to right for any stage count', () => {
  const rows = (count: number, cols: number) => {
    const out: number[] = [];
    for (const p of flow.layout(count, cols)) out[p.row] = (out[p.row] ?? 0) + 1;
    return out;
  };
  assert.deepEqual(rows(13, 7), [7, 6]);
  assert.deepEqual(rows(13, 5), [5, 5, 3]);
  assert.deepEqual(rows(4, 7), [4]);
  assert.deepEqual(rows(20, 5), [5, 5, 5, 5]);
  assert.deepEqual(rows(3, 1), [1, 1, 1]);
  assert.deepEqual(rows(0, 7), []);
  assert.deepEqual(flow.layout(8, 7)[7], { index: 7, row: 1, col: 0 });
  assert.equal(flow.layout(2, 0).length, 2, 'a zero column count is treated as one');
});

test('wires: straight between row neighbours, wrap-around to the next row, arcs for loops back', () => {
  const card = (left: number, top: number): Rect => ({ left, top, right: left + 100, bottom: top + 60 });
  const p = (index: number, row: number, col: number): Pos => ({ index, row, col });
  assert.equal(flow.route(card(0, 0), card(120, 0), p(0, 0, 0), p(1, 0, 1), 7), 'M 100 30 L 120 30');
  assert.equal(flow.route(card(120, 0), card(0, 0), p(1, 0, 1), p(0, 0, 0), 7), 'M 120 30 L 100 30', 'backwards between neighbours uses the facing edges');
  assert.equal(flow.route(card(720, 0), card(0, 100), p(6, 0, 6), p(7, 1, 0), 7), 'M 820 30 C 844 30, 844 80, 820 80 L 0 80 C -24 80, -24 130, 0 130');
  assert.equal(flow.route(card(240, 100), card(0, 100), p(9, 1, 2), p(7, 1, 0), 7), 'M 290 100 C 290 74, 50 74, 50 100');
  assert.equal(flow.route(card(0, 0), card(0, 80), p(0, 0, 0), p(1, 1, 0), 1), 'M 50 60 L 50 80');
  assert.equal(flow.route(card(0, 160), card(0, 0), p(2, 2, 0), p(0, 0, 0), 1), 'M 100 190 C 122 190, 122 30, 100 30');
  assert.equal(flow.route({ left: 0.26, top: 0, right: 100.26, bottom: 60 }, card(120, 0), p(0, 0, 0), p(1, 0, 1), 7), 'M 100.5 30 L 120 30', 'coordinates are rounded to half pixels');
});

test('clocks count from the recorded start and stop at the terminal commit', () => {
  const now = Date.parse('2026-10-11T10:05:30Z');
  assert.equal(clock.elapsedText('2026-10-11T10:00:00Z', null, now), '5:30');
  assert.equal(clock.elapsedText('2026-10-11T10:00:00Z', '2026-10-11T10:01:00Z', now), '1:00');
  assert.equal(clock.elapsedText('2026-10-11T10:10:00Z', null, now), '0:00', 'a start after now never shows a negative clock');
  assert.equal(clock.elapsedText('garbage', null, now), '0:00');
  assert.equal(clock.elapsedText('2026-10-11T08:00:00Z', null, now), '2:05:30');
});

test('the tab title counts runs that need a human; markers follow the hidden tab', () => {
  const run = (id: string, outcome: string, needs = false): Summary => ({ run_id: id, final_outcome: outcome, needs_human: needs });
  const first = alerts.alertState({ runs: [run('A', 'WAITING_HUMAN', true), run('B', 'IN_PROGRESS')], previous: null, hidden: false, markers: null });
  assert.equal(first.title, `(1) Needs you · ${alerts.BASE_TITLE}`);
  assert.equal(first.icon, 'amber');
  const quiet = alerts.alertState({ runs: [run('B', 'IN_PROGRESS')], previous: null, hidden: true, markers: null });
  assert.deepEqual([quiet.title, quiet.icon], [alerts.BASE_TITLE, 'none'], 'the first load never sets a marker');
  // B blocks while the tab is hidden: red wins over amber until the tab is seen.
  const blocked = alerts.alertState({ runs: [run('A', 'WAITING_HUMAN', true), run('B', 'BLOCKED')], previous: [run('A', 'WAITING_HUMAN', true), run('B', 'IN_PROGRESS')], hidden: true, markers: first.markers });
  assert.equal(blocked.icon, 'red');
  const still = alerts.alertState({ runs: [run('A', 'WAITING_HUMAN', true), run('B', 'BLOCKED')], previous: [run('A', 'WAITING_HUMAN', true), run('B', 'BLOCKED')], hidden: true, markers: blocked.markers });
  assert.equal(still.icon, 'red', 'the marker stays while hidden');
  const seen = alerts.alertState({ runs: [run('A', 'WAITING_HUMAN', true), run('B', 'BLOCKED')], previous: null, hidden: false, markers: still.markers });
  assert.equal(seen.icon, 'amber', 'looking at the tab clears the marker');
  const done = alerts.alertState({ runs: [run('C', 'LOCAL_PR_PROPOSAL_PREPARED')], previous: [run('C', 'IN_PROGRESS')], hidden: true, markers: null });
  assert.deepEqual([done.icon, done.title], ['green', alerts.BASE_TITLE]);
  const visibleChange = alerts.alertState({ runs: [run('C', 'BLOCKED')], previous: [run('C', 'IN_PROGRESS')], hidden: false, markers: null });
  assert.equal(visibleChange.icon, 'none', 'a change seen in the open tab needs no marker');
});

test('the tab icon is a self-contained SVG data URL with a status dot', () => {
  for (const icon of ['none', 'amber', 'red', 'green']) {
    const href = alerts.iconHref(icon);
    assert.ok(href.startsWith('data:image/svg+xml,'));
    assert.doesNotMatch(href.slice('data:image/svg+xml,'.length), /[#"<> ]/, 'the SVG is fully URI-encoded');
    const svg = decodeURIComponent(href.slice('data:image/svg+xml,'.length));
    assert.equal(svg.includes('<circle'), icon !== 'none');
  }
  assert.match(decodeURIComponent(alerts.iconHref('amber')), /#fbbf24/);
});
