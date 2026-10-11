# Mission Control Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the shipped read-only dashboard into the "Mission Control" design: a Live view with animated, honest hand-offs, stage cards with real durations, a swimlane, vitals and a journal feed, plus the restyled Inspect view, both themes, tab alerts, and guaranteed containment.

**Architecture:** Plain ES modules in `dashboard/web/`. Pure modules (`derive.js`, `motion.js` cue/player logic, `flow.js` layout, `clock.js` formatting, `alerts.js` state) are unit-tested in Node. The Live view is built once per run and patched in place so CSS loops and Web Animations survive updates. Inspect keeps the existing full re-render. One additive read-model field (`RunSummary.stage_states`).

**Tech Stack:** Node 24 (`node --test`, type stripping), TypeScript typecheck (`tsc --noEmit`), browser ES modules, CSS custom properties, Web Animations API, SVG, the repo's CDP browser driver (`tests/support/browser.ts`).

**Spec:** [06-mission-control-redesign.md](06-mission-control-redesign.md)

## Global Constraints

- No new runtime or dev dependency; `third_party_packages: 'none'` in the manifest stays true.
- CSP unchanged: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'`. No inline `style` attributes or `<style>` elements; dynamic values through CSSOM (`el.style.setProperty`, `el.style.offsetPath`).
- No `innerHTML`, no `eval(`, no `http://` or `https://` in any `dashboard/web/*.js` or `index.html`.
- Agent wording: "dispatched", "awaiting result", "waiting on". Never "working", "thinking", "running" for an agent.
- No progress percentage or remaining-time estimate anywhere.
- Status is never colour alone: every state shows glyph + word.
- Every new or edited file is written with LF line endings (repo has `core.autocrlf=true`; protocol and rc9 tests compare bytes).
- Honest-motion rules 1–9 of spec section 3 apply to every animation.
- Fonts: system stacks only.
- No commit, push, merge or tag without the owner's separate word; work stays uncommitted on `feat/rstack-sdlc-dashboard-mission-control`.

## Review Focus

1. A run whose timestamps are equal (simulated runs commit within one second) must show `0:00` durations, not negative or `NaN`, and the swimlane must not divide by zero → `derive` tests with equal timestamps.
2. A workflow with a different stage count, or an unknown stage state, must render without exceptions → `flow.layout` test with 4 and 20 stages; `derive.heroState` and card state words fall back to neutral.
3. Switching runs while a hand-off cue is playing must not animate the new run → `motion` player test: cues for run B after run A never replay; browser test switches runs and checks the cue log.
4. A server restart or `resync` that re-delivers the same journal version must not replay cues → `motion.cues` returns `[]` when versions are equal; player ignores `seq` already played.
5. Long request titles, long blocker details and long stage labels at 1024 px must not overflow → browser containment test uses the fixture runs at 1024 px in both themes.

---

### Task 0: Baseline

- [ ] Record `npm run typecheck` and `node --test "tests/*.test.ts"` results before any change (pass/fail counts, failing test names) in the session scratchpad; failures that exist before the change are listed in the final report as pre-existing.

### Task 1: `RunSummary.stage_states`

**Files:** Modify `core/read-model/contracts.ts` (RunSummary), `core/read-model/project-run.ts` (`summarize`), `tests/read-model.test.ts`, `docs/live-dashboard/02-architecture-and-read-model.md` (field list, if RunSummary is documented there).

**Interfaces:** Produces `RunSummary.stage_states: { stage_id: string; state: StageState }[]`, in `view.stage_graph` order.

- [ ] Write the failing test in `tests/read-model.test.ts`: list a `plan-decision` scenario run; assert `summary.stage_states` deep-equals `view.stage_graph.map((s) => ({ stage_id: s.stage_id, state: s.state }))` and contains a `WAITING_HUMAN` entry for `plan-decision`.
- [ ] Run `node --test tests/read-model.test.ts`; expect FAIL (`stage_states` undefined).
- [ ] Add the field to `RunSummary` and to `summarize`: `stage_states: view.stage_graph.map((s) => ({ stage_id: s.stage_id, state: s.state }))`.
- [ ] Run the read-model, dashboard-server and report tests; expect PASS. Fix any deepEqual on summaries by adding the field.

### Task 2: `derive.js` (pure)

**Files:** Create `dashboard/web/derive.js`, `tests/support/web-module.ts`, `tests/dashboard-web-derive.test.ts`.

**Interfaces (produces):**
- `seconds(fromIso, toIso) → number | null` — whole seconds, never negative, `null` if either is missing or invalid.
- `fmtDuration(totalSeconds) → string` — `m:ss` under an hour, `h:mm:ss` above; `null`/negative → `0:00`.
- `isTerminal(view) → boolean` — `final_outcome` in `LOCAL_PR_PROPOSAL_PREPARED`, `REJECTED`, `BLOCKED`.
- `runEnd(view) → string | null` — `last_committed_at` when terminal, else `null`.
- `mainPath(stages) → StageNode[]` — follows `next` from the first stage (moved from `graph.js`).
- `stageTiming(view, stageId) → { seconds: number | null, since: string | null, until: string | null }` — completed: `entered_at → completed_at`; current and not terminal: `since = entered_at`, `until = null` (live clock); otherwise nulls.
- `humanWaits(view) → { stage_id, start, end }[]` — from timeline entries entering a `kind: 'human'` stage to the next entry leaving it; `end` is `null` while still there.
- `vitals(view) → { completed, total, attempts, failed, tests: { passed, failed } | null, audit: { used, max } | null, waitSeconds, waitSince }` — `completed` counts main-path stages in `COMPLETED`/`DONE_TERMINAL`; `tests` from the newest execution's `kind === 'TEST'` entries; `waitSeconds` sums closed waits; `waitSince` is the open wait's start or `null`.
- `lanes(view, nowIso) → { key, label, segments: { start, end, kind }[] }[]` — keys are role ids, `'human'` (label `You`), `'engine'` (label `Engine`); ordered by first appearance; segment kinds `accepted | pending | failed | superseded | wait | tick`; `end` is `null` when open.
- `axis(view, nowIso) → { start, end, seconds }` — `start = started_at`, `end = runEnd(view) ?? nowIso`, `seconds >= 1`.
- `heroState(view) → 'unreadable' | 'human' | 'blocked' | 'done' | 'rejected' | 'dispatched' | 'idle'`.
- `roleBadge(role, kind) → string` — `PL`, `AU`, `TE`, `DEV`, `CR`, `PR`, `YOU` (human), `EN` (deterministic), else first two letters uppercased.

`tests/support/web-module.ts`:

```ts
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WEB = join(resolve(dirname(fileURLToPath(import.meta.url)), '..', '..'), 'dashboard', 'web');

// Loads a browser module of the dashboard page by a non-literal specifier so
// the typecheck does not try to resolve untyped JavaScript.
export async function loadWeb<T>(name: string): Promise<T> {
  return (await import(pathToFileURL(join(WEB, name)).href)) as T;
}
```

- [ ] Write failing tests covering: `fmtDuration(0) === '0:00'`, `fmtDuration(65) === '1:05'`, `fmtDuration(3725) === '1:02:05'`, `fmtDuration(-4) === '0:00'`; `seconds` with equal timestamps → `0`; `vitals` and `lanes` on the `plan-decision`, `implementing`, `review-rejected` and `completed` scenario views (built with `scenarioRun` and `readRun`/`projectRun` as `tests/read-model.test.ts` does); `heroState` for each scenario; `axis(...).seconds >= 1` when all timestamps are equal (Review Focus 1); `runEnd` null for in-progress runs; open `stageTiming` for the dispatched stage.
- [ ] Run `node --test tests/dashboard-web-derive.test.ts`; expect FAIL (module missing).
- [ ] Implement `derive.js` (no DOM access anywhere in the module).
- [ ] Run; expect PASS.

### Task 3: `motion.js` cues and player (pure core)

**Files:** Create `dashboard/web/motion.js`, `tests/dashboard-web-motion.test.ts`.

**Interfaces (produces):**
- `cues(prev, next) → Cue[]` where `Cue = { kind, seq, stage, from?, to? }`, `kind ∈ handoff | settle | fail | needs-you | decided | verified | branch | blocked | done`. Returns `[]` unless both views exist, share `run_id`, and `next.journal_version > prev.journal_version`. Timeline entries with `seq > prev.journal_version` map by category: `dispatch → handoff` (`from` = `stage_after` of the entry before it, `to` = entry `stage_id ?? stage_after`), `result → settle`, `failure → fail`, `human → decided`, `verification → verified`. Stage-graph transitions add `needs-you` (to `WAITING_HUMAN`), `branch` (branch stage leaving `NOT_TAKEN`), `blocked` (to `BLOCKED`); `final_outcome` becoming `LOCAL_PR_PROPOSAL_PREPARED` adds `done`. Transition cues use `seq = next.journal_version`. Sorted by `seq`; when more than three, only the last three.
- `createPlayer({ animate, reduced, hidden }) → { prime(runId, version), play(runId, cues, { catchUp }) , resume() , missed() }` — `prime` sets the run's played watermark (called on first load of a run); `play` drops cues with `seq <=` watermark, raises the watermark to the newest cue, and calls `animate(cue, { reduced: reduced(), stagger })` for each remaining cue (stagger 0/400/800 ms); with `catchUp` or `hidden()` true it keeps only the newest cue; when `hidden()` it defers that cue instead of animating and counts the events in `missed()`; `resume()` plays the deferred cue and resets `missed()` to 0.
- `log` — bounded array (50) of `{ run, kind, seq, reduced }` exported and mirrored on `globalThis.rstackMotionLog` for browser tests.

- [ ] Write failing tests: equal versions → `[]`; different runs → `[]`; `awaiting-auditor` view → `implementing`-like next (use two consecutive views from one scenario run: read the view, `completeStep`, read again) yields one `settle` then a `handoff`; transition to `WAITING_HUMAN` yields `needs-you`; five new events → three cues; player: prime at v8 then play cues of seq 8 → nothing animated; play cue seq 9 twice → animated once; run B cues after run A primed → only B's own watermark applies (Review Focus 3, 4); hidden → deferred, `missed()` counts, `resume()` animates once; `catchUp` → only newest.
- [ ] Run; expect FAIL. Implement. Run; expect PASS.

### Task 4: `flow.js` layout, `clock.js`, `alerts.js` (pure parts)

**Files:** Create `dashboard/web/flow.js` (pure exports first), `dashboard/web/clock.js`, `dashboard/web/alerts.js`, `tests/dashboard-web-layout.test.ts`.

**Interfaces (produces):**
- `flow.columnsFor(width) → 7 | 5 | 1` — `>= 940 → 7`, `>= 640 → 5`, else `1` (container content width).
- `flow.layout(count, columns) → { index, row, col }[]` — row-major, left to right on every row.
- `flow.wirePath(a, b, kind) → string` — `a`, `b` are `{ left, top, right, bottom }` in container coordinates; `kind` `'row'` (straight, right edge of `a` to left edge of `b` at `a`'s vertical centre), `'wrap'` (from `a`'s right centre out 24 px, down to the mid-line between the rows, back to 14 px left of `b`, into `b`'s left centre), `'column'` (bottom centre of `a` to top centre of `b`). Coordinates rounded to 0.5 px.
- `clock.fmtClock = derive.fmtDuration` re-export; `clock.startClock(tick, intervalMs = 1000) → stop()`.
- `alerts.alertState({ runs, previous, hidden, markers }) → { title, icon, markers }` — `n = runs.filter((r) => r.needs_human).length`; title `(${n}) Needs you · RSTACK Mission Control` or `RSTACK Mission Control`; while `hidden`, a run whose outcome changed to `BLOCKED` sets `markers.red`, to `LOCAL_PR_PROPOSAL_PREPARED` sets `markers.green`; when not hidden both markers clear; `icon` = `red` > `amber` (n > 0) > `green` > `none`.
- `alerts.iconHref(icon) → string` — `data:image/svg+xml,` + URI-encoded SVG of the brand mark with a status dot (`red #f87171`, `amber #fbbf24`, `green #34d399`, none = no dot).

- [ ] Write failing tests: `columnsFor` at 1200/940/939/640/639; `layout(13, 7)` rows 7+6; `layout(13, 5)` rows 5+5+3; `layout(4, 7)` and `layout(20, 5)` (Review Focus 2); `wirePath` exact strings for one row/wrap/column case; `alertState` transitions (needs-you count; hidden blocked → red; visible clears; green; priority); `iconHref` starts with `data:image/svg+xml,` and contains no `"`-breaking characters unencoded.
- [ ] Run; expect FAIL. Implement. Run; expect PASS.

### Task 5: Tokens and stylesheet

**Files:** Rewrite `dashboard/web/app.css`.

- [ ] Status and role tokens exactly as spec 4.4 for dark (`:root[data-theme="dark"]` and `prefers-color-scheme: dark` without `data-theme="light"`) and light (default). Surface tokens: dark `--bg #070b16`, `--surface #0c1324`, `--surface-2 #101a31`, `--line #1b2744`, `--line-strong #26355a`, `--text #e3ebff`, `--muted #8a9cc4`, `--faint #55658c`; light `--bg #f4f6fb`, `--surface #ffffff`, `--surface-2 #eef1f7`, `--line #d9dfea`, `--line-strong #b9c3d4`, `--text #141a26`, `--muted #556173`, `--faint #8a94a6`. Glow tokens: dark uses coloured `box-shadow` glows; light uses neutral soft shadows (`0 1px 2px #0f172a14, 0 4px 14px #0f172a0f`).
- [ ] Components keep every class `views.js` uses (`band`, `kv`, `tabs`, `table.data`, `details.item`, `pill`, `btn`, `segmented`, `callout`, `notice`, `ref-btn`, `technical`, `findings`, `viewer`) restyled to the tokens.
- [ ] New components: `.top` (top bar), `.switcher`, `.mode`, `.live`, `.hero[data-hero]`, `.avatar`, `.flow` grid with `--cols`, `.card[data-state]`, `.spur`, `.wires` SVG, `.packet`, `.vitals`, `.lanes`, `.lane`, `.seg[data-kind]`, `.now-line`, `.feed`, `.ev`, `.strip` (run-list mini strip).
- [ ] Motion: only two infinite CSS animations, `breathe` (on `.card[data-state="DISPATCHED_AWAITING_RESULT"]` and `.hero[data-hero="dispatched"] .avatar`) and `attn` (on `.card[data-state="WAITING_HUMAN"]` and `.hero[data-hero="human"] .avatar`), both paused when `.app[data-connection="stale"]` or `[data-connection="disconnected"]` (rule 5). A `@media (prefers-reduced-motion: reduce)` block sets `animation: none` everywhere and defines `.cue-outline` (1 s static outline).
- [ ] Containment: every grid/flex child holding text has `min-width: 0`; card labels `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`; `.flow` has inline padding ≥ 28 px so wrap wires stay inside; `html, body { overflow-x: hidden }` is NOT used (overflow must be prevented, not hidden).

### Task 6: DOM modules — `dom.js`, flow DOM, `lanes.js`, `feed.js`, `live.js`

**Files:** Create `dashboard/web/dom.js`, `dashboard/web/lanes.js`, `dashboard/web/feed.js`, `dashboard/web/live.js`; extend `dashboard/web/flow.js` with `createFlow`.

**Interfaces (produces):**
- `dom.setText(el, text)`, `dom.setAttr(el, name, value)` (no-op when unchanged; `null` removes), `dom.keyed(parent, items, keyOf, create, update)` (reuses children by `data-key`, inserts new ones in order, removes missing ones).
- `flow.createFlow({ compact, onSelect }) → { el, update(view, { selected }), cardOf(stageId), packet(fromId, toId) → Animation | null, ring(stageId, tone) , destroy() }` — `el` is `.flow-wrap` containing `.flow` (CSS grid of `.cell`; each cell holds an optional `.spur` and a `button.card` with `data-stage`, `data-state`, `aria-label` = `${label}: ${STATE_TEXT[state]}${current ? ' (current stage)' : ''}`), an `svg.wires` with one `path` per main-path edge (`data-edge="<from>><to>"`, class `done` when the target is completed, `hot` for the edge into the current stage), and a `.packet`. A `ResizeObserver` on `.flow` sets `--cols` (via `style.setProperty`) from `columnsFor` and redraws wires in the next animation frame. Durations: completed cards show `fmtDuration(stageTiming.seconds)`; the current card shows a clock span with `data-since`.
- `lanes.createLanes() → { el, update(view, nowIso), tick(nowIso) }` — rows keyed by lane key; segments positioned with `style.setProperty('--x', …)` / `('--w', …)` as percentages of `axis`; open segments carry `data-open` and are widened by `tick`.
- `feed.createFeed() → { el, update(view, { away }), itemOf(seq) }` — newest six timeline entries keyed by `seq`; an "N events while you were away" chip when `away > 0`.
- `live.createLive(ctx) → { el, update(view, { report, runs }), flow, feed, lanes, hero }` — `el` is `section.live[data-testid=live]` with `.hero[data-testid=hero][data-hero=<heroState>]`, the flow panel, `.vitals[data-testid=vitals]`, lanes and feed. Hero copy per spec 4.1 table; the human hero carries the "Open the brief (round n)" button (calls `ctx.openBrief`), the allowed actions list, and the how-to line; the blocked hero shows code + detail + "No recovery path is recorded; a fix needs a new run."; the done hero "Local PR proposal ready · not published"; clicking a card calls `ctx.inspectStage(stageId)`.

- [ ] Implement `dom.js`, then `createFlow`, `lanes.js`, `feed.js`, `live.js`.
- [ ] Check every copy string against the Global Constraints wording rule.

### Task 7: App integration, Inspect restyle, motion and alerts wiring

**Files:** Modify `dashboard/web/app.js`, `dashboard/web/views.js`, `dashboard/web/index.html`; delete `dashboard/web/graph.js`.

- [ ] `state.mode` (`'live' | 'inspect'`), hash `mode=inspect` (absent = live); `select(run)` sets `live`; card click → `inspect` + stage.
- [ ] Live mode: `root` children are the header and one persistent `live.el` per selected run (created on first load, `motion.prime(run, version)`); updates call `live.update` then `player.play(run, cues(prev, next), { catchUp })`; `catchUp` is true for the first update after resume or a `resync`. The header is replaced only when its content signature changes, preserving an open run switcher.
- [ ] Header: brand mark, `details.switcher` (summary = current run; body = runs grouped Needs you / Active / Blocked / Done, each a `button[data-run]` with status dot and title), fleet counts, `.mode` toggle (`button[data-mode=live|inspect]`, `aria-pressed`), connection pill (`data-testid=connection`, unchanged texts plus the stale "last confirmed vN" wording), pause button (`data-testid=pause`), theme control, `data-testid=synced` and `data-testid=run-status` kept.
- [ ] Inspect mode: today's layout (sidebar, task summary, bands, Now, stage strip via `createFlow({ compact: true })`, stage detail, tabs, run facts) restyled; sidebar items get `.strip` segments from `stage_states` (skip `NOT_TAKEN`).
- [ ] `views.js` fixes: timeline rows get a role badge and `white-space: nowrap` event names; non-digest refs collapse into a `details.refs` chip; `nowPanel` title names stage and role once when equal.
- [ ] `motion` animate implementation (in `motion.js`, DOM part): `handoff` → `flow.packet(from, to)` then card pop; `settle` → card glow settle + check draw; `fail` → `flow.ring(stage, 'danger')`; `needs-you` → amber ring; `decided` → packet out of the card; `verified` → number roll on vitals test counts; `branch` → spur light + draw; `blocked` → one red flash; `done` → sweep across `.flow`. Every `Element.animate` call sets `animation.id = 'cue:<kind>:<seq>'`; reduced motion → add `.cue-outline` for 1 s, no `animate`. All calls wrapped in `try/catch`.
- [ ] Heartbeat: on SSE `heartbeat`, animate the Live dot once with id `beat`.
- [ ] Clock: one `startClock` updating `[data-since]` text (respecting `data-until`) and `lanes.tick`.
- [ ] Alerts: after each run-list load and on `visibilitychange`, compute `alertState` and apply `document.title` and `link[rel=icon]` (`index.html` gains `<link rel="icon" href="data:,">`).
- [ ] Stale: `root.dataset.connection` mirrors `state.connection`; hero dims via CSS.
- [ ] Remove `graph.js` and its import.

### Task 8: Package

**Files:** Modify `adapters/copilot-vscode/generate.ts` (`RUNTIME_ASSETS`), `tests/package.test.ts` (runtime file list, asset loop, forbidden-pattern check over every web module).

- [ ] `RUNTIME_ASSETS` lists `index.html, app.css, app.js, views.js, dom.js, derive.js, motion.js, flow.js, lanes.js, feed.js, live.js, clock.js, alerts.js`; `graph.js` removed.
- [ ] Package test asset loop uses the same list; the `https?://|innerHTML|eval\(` check runs for every `.js` asset.
- [ ] Run `node --test tests/package.test.ts tests/architecture.test.ts`; expect PASS.

### Task 9: Browser tests

**Files:** Modify `tests/dashboard-browser.test.ts`.

- [ ] Update existing subtests to the new DOM (`.card` instead of `.node`, Live/Inspect toggle, human hero/band, `[data-stage]` on cards).
- [ ] Add: AC1 cue once (complete a step on `RUN-LIVE`; `rstackMotionLog` gains exactly one `settle` for that `seq`; a theme switch, a `resync`-equivalent `refreshAll` via pause/resume, and switching runs away and back add no entry for that `seq`); AC2 idle stillness on `RUN-BLOCKED` and `RUN-DONE` (`document.getAnimations()` has no running animation except id `beat`); AC3 loops (`RUN-LIVE` dispatched: running CSS animation names ⊆ {`breathe`}; `RUN-DECIDE`: ⊆ {`attn`}); AC4 reduced motion (emulate reduce, commit an event, no running animations, log entry has `reduced: true`); AC5 containment at 1024/1280/1440/1920 in dark and light for Live (`RUN-LIVE`, `RUN-DECIDE`, `RUN-BLOCKED`) and Inspect (`RUN-DECIDE`): `document.documentElement.scrollWidth <= innerWidth` and no HTML element outside `.run-list`, `[role=tabpanel]`, `dialog` with `scrollWidth > clientWidth + 1` unless its computed `text-overflow` is `ellipsis`; AC6 truth first (card state `COMPLETED` while a `cue:` animation is running); AC8 hero copy per state and no forbidden agent words in `document.body.innerText`; AC10 title `(1) Needs you · RSTACK Mission Control` and amber icon href; AC11 keyboard (Tab reaches `[data-mode=inspect]` and a card; Enter on a card opens Inspect with `stage=`).
- [ ] Run `node --test tests/dashboard-browser.test.ts`; expect PASS (or skip only when no Chrome).

### Task 10: Demo

**Files:** Modify `tests/support/scenarios.ts` (optional `engine` options parameter passed to `newRun`), `scripts/dashboard-demo.ts`.

- [ ] `scenarioRun(scenario, label, runId, workspaceDir, engine = {})`.
- [ ] Demo clock: `demoClock(startMinutesAgo, seed)` returns `now()` advancing by a seeded pseudo-random 20–140 s per call, capped at the real current time.
- [ ] Screenshots: every state in Live (both themes) plus Inspect for `RUN-04-DECISION`; live frames on `RUN-10-LIVE` in Live mode.
- [ ] `--replay`: keeps the server, drives `RUN-10-LIVE` one engine step every 6 s to completion, printing each step, so the motion can be watched.

### Task 11: Records and docs

**Files:** Modify `docs/live-dashboard/01-product-and-ux.md` (§3.5 motion bullets point to 06 §3), `docs/live-dashboard/06-mission-control-redesign.md` (container-width thresholds wording in 4.5 if it differs), `docs/progress.md`, `docs/decisions.md`.

- [ ] Amend 01 §3.5; record the implementation in progress and the D1–D8 decisions in decisions, stating evidence class (offline browser checks, SIMULATED demo; not host evidence).

### Task 12: Verification

- [ ] `npm run typecheck`; full `node --test "tests/*.test.ts"`; `npm run check:scope`; `node scripts/dashboard-demo.ts` and review the screenshots against the mockup; compare failures with Task 0 baseline.
- [ ] Delete this session's `tests/.tmp` scratch directories.
- [ ] One fresh reviewer (most capable model) reviews the whole branch diff against spec 06 and this plan; fix confirmed findings; report to the owner with exact evidence. No commit without the owner's word.
