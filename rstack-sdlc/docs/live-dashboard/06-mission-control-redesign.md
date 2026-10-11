# RSTACK Live Dashboard — Mission Control redesign

**Document:** `06-mission-control-redesign.md`
**Date:** 2026-10-11. **Author:** Claude (Opus 5.5), from a design session with the owner.
**Baseline:** `main` at `52ac37a`, branch `feat/rstack-sdlc-dashboard-mission-control`.
**Status:** design agreed section by section in conversation with the owner; the owner then said "go ahead and implement it" (2026-10-11). Implemented per [07 — implementation plan](07-mission-control-implementation-plan.md) in commit `5436ac4`, pushed to `origin` on that branch (not merged to `main`). Section 11 lists where the build differs from the text as first written. Nothing here is host evidence.
**Visual reference:** [mockups/06-live-view-mockup.html](mockups/06-live-view-mockup.html) (fixed-width, SIMULATED, animations looped for preview only).
**Related documents:**
- [01 — Product and UX](01-product-and-ux.md) (section 3.5 is amended by section 3 below)
- [02 — Architecture and Read Model](02-architecture-and-read-model.md)
- [04 — Engine Findings, Reference Research, and Decisions](04-engine-findings-research-and-decisions.md)

---

## 1. Why

The owner found the shipped dashboard simpler than expected. The goal is a dashboard that stays useful to developers and pipeline users and also *feels* like a live system: work visibly flowing between agents, so people are motivated to keep it open while a run is under way.

Evaluation of the shipped UI (demo screenshots under `.rstack/dashboard-demo/shots/`, `dashboard/web/*`):

1. It reads like a form. Most of the screen is key/value lists and one long table; the pipeline, the most important visual, is a row of 30 px circles on a 2 px line.
2. Nothing moves except a 220 ms scale on a node whose state changed. There is no sense of hand-off and no "something just happened" moment.
3. `render()` (`dashboard/web/app.js`) rebuilds the whole page with `root.replaceChildren(...)` on every update. CSS transitions cannot run on elements that are destroyed and recreated, so smooth motion is impossible with the current renderer.
4. The read model already carries timing (`StageNode.entered_at` / `completed_at`, `AttemptView.dispatched_at` / `settled_at`, `ExecutionSummary.duration_ms`, `HumanAction.waiting_since`) but the UI shows only raw ISO timestamps.
5. Agents have no identity: Planner, Plan Auditor, Tester, Developer and Code Reviewer appear only as grey captions.
6. Smaller issues: the timeline is crowded with digest links and event names wrap mid-word ("result_accepte d"); every run in the sidebar looks the same; the Now card titles itself "Developer, Developer"; type is uniformly 13 px with weak hierarchy; demo fixtures give every event the same timestamp.

What the shipped UI does well and must keep: every value is tied to a journal version; each state carries glyph, label and colour; light/dark/system themes; keyboard access; the live plumbing (SSE `hello` / `heartbeat` / `run-changed` / `resync`, 30 s stale detection, polling fallback); read-only behaviour.

## 2. Decisions taken with the owner

| # | Decision | Choice |
|---|---|---|
| D1 | How animation relates to engine truth | **Honest motion**: rich animation, every animation tied to a real signal (section 3). Amends 01 §3.5. |
| D2 | Viewing context | **Two modes**: *Live* (glanceable, animated) and *Inspect* (detail). Every run opens in Live. |
| D3 | Visual direction | **Blueprint structure with Mission Control look**: stage cards with real durations and a per-role swimlane, styled as a dark glowing console with packet hand-offs. |
| D4 | Themes | **Dark-first plus light variant**; keep the Light / Dark / System switch. |
| D5 | Attention when the tab is in the background | **Tab title and generated tab icon only.** No desktop notifications, no sound. |
| D6 | Build approach | **Evolve in place**: plain ES modules, update the DOM in place, CSS plus the Web Animations API. No new dependencies, no canvas/WebGL. |
| D7 | Containment | **Hard requirement**: content never overflows its container at any supported width; enforced by an automated browser check. |
| D8 | Run-list mini strip | **Approved**: one additive read-model field, `RunSummary.stage_states`. |

## 3. Honest-motion rules (replaces 01 §3.5 motion bullets)

These rules are the acceptance test for every animation.

1. **Real trigger.** An animation may be triggered only by: a new journal version for the run shown, an SSE `heartbeat`, real elapsed time since a recorded timestamp, or the user's own action (hover, click, mode switch).
2. **Once per journal version.** One-shot cues play once per journal event. Re-renders, reconnects, `resync`, switching runs and opening a run never replay a cue. Opening a run shows its current state still.
3. **Loops only for ongoing engine states.** Exactly two continuous animations exist: a calm "breathing" glow on the current card and agent tile while a dispatch is `DISPATCHED_AWAITING_RESULT`, and an amber pulse while the run is `WAITING_HUMAN`. The hand-off wire animates during the hand-off cue only, then stays lit and still. The open swimlane bar has a static hatch whose width follows the real clock; it does not animate its pattern.
4. **Wording.** Agents are "dispatched", "awaiting result", "waiting on". Never "working", "thinking" or "running". The Live hero for a pending dispatch reads "Waiting on the <Role>".
5. **Stale or disconnected.** Continuous animation stops, the hero dims, and the Live pill turns amber with the last confirmed journal version and its age ("Stale · last confirmed v14, 45 s ago"). Clocks keep counting because elapsed time since the recorded dispatch is still true.
6. **Reduced motion.** Under `prefers-reduced-motion: reduce` nothing moves. Each cue becomes an instant state change plus a 1 s static outline. Clocks still update their text.
7. **Background tab or paused updates.** Cues are not queued. When the tab becomes visible again (or updates resume), only the latest cue plays and the journal feed shows "N events while you were away".
8. **Cost.** Animate only `transform` and `opacity` (and SVG stroke offsets during a cue). One 1 Hz timer for all clocks. No `requestAnimationFrame` loop while idle. A blocked or finished run has no running animation other than the one-shot heartbeat beat.
9. **Truth first.** The new state is in the DOM as soon as the new view is loaded. Animations are overlays of at most about 1.2 s; they never delay, hide or contradict the state.

Retained from 01 §3.5 unchanged: no animated fake reasoning, no token counters, no progress percentages or remaining-time estimates; status never by colour alone.

### 3.1 Cue table

| Real signal (derived from the new view) | Cue |
|---|---|
| `dispatch` timeline entry | Packet travels the wire from the previous stage card to the dispatched stage card; the card "arrives" (short scale pop); the hero agent tile cross-fades; a feed item slides in. |
| `result` entry, attempt accepted | The card's glow settles, a check mark draws in, the duration is stamped, the swimlane bar closes. |
| `failure` entry | One red ring flash on the card; the attempt and retry counters roll to their new values. |
| Stage enters `WAITING_HUMAN` | Amber ripple from the card; the hero switches to the needs-you state; tab title and icon update. |
| `human` entry, decision recorded | The card turns from amber to green; the packet leaves for the next stage. |
| `verification` entry | Test counts in the vitals roll to the new numbers. |
| A branch stage leaves `NOT_TAKEN` | Its spur lights up and its connector draws in. |
| Engine directive becomes `BLOCKED` | One red flash on the card, then still; tab icon turns red if the tab is hidden. |
| `final_outcome` becomes `LOCAL_PR_PROPOSAL_PREPARED` | One light sweep across the track; vitals settle. |
| SSE `heartbeat` | The Live dot beats once. |
| Time passing | Clocks tick; the open swimlane bar widens. |

When several new entries arrive in one update while the tab is visible, at most the last three cues play, staggered by 400 ms.

## 4. Screens

### 4.1 Live view

Layout, top to bottom (see the mockup):

- **Top bar.** Brand; run switcher (run id, request title, status dot, drop-down); fleet counts (active, need you, blocked, done) from the run list; the Live | Inspect toggle; the Live pill (heartbeat); theme switch; "Pause live updates" stays available.
- **Hero.** Agent identity tile (role badge in the role colour), headline, one line of grounded facts, and on the right the total run time and the next stage.
- **Pipeline panel.** One card per stage of the retained workflow definition (`view.stage_graph`), never a hard-coded list. Each card: role badge, stage label, role or engine/you, status glyph and word, and the stage duration (`completed_at − entered_at`) or a live clock for the current stage. Cards are joined by wires; the main path snakes left to right, row by row. Branch stages (`branch: true`) appear as spur chips attached to the stage they leave from, labelled "not taken" until entered; "entered from" is derived from the timeline as today.
- **Run vitals panel.** Stages completed (`n of N`); agent attempts and failed attempts; latest test execution (passed / failed, hidden when there is none); plan audit budget (`engine.audit_budget`); total time waiting on a human. Every number is a count or sum over the view.
- **Who held the work (swimlane).** One lane per role present in the run, plus "You" and "Engine", ordered by first appearance. Time axis from `started_at` to now (or to the terminal commit). Agent segments: `dispatched_at` to `settled_at`, or to now while pending; failed attempts drawn in the danger hatch; superseded attempts faded. Human segments: from the timeline entry that enters a human stage to the entry that leaves it (open while waiting). Engine steps: ticks at deterministic timeline entries. A "now" line marks the right edge while the run is not terminal.
- **Journal feed.** The newest six timeline entries with version, role badge, summary and age.

Hero states:

| Engine state | Hero |
|---|---|
| Dispatch pending | "Waiting on the <Role>", status chip "Dispatched · awaiting result", dispatch clock, attempt id, retries used of budget, configured model with "effective model not observed". Breathing loop (rule 3). |
| At a stage, no dispatch | "<Stage> is next", "the engine has not dispatched it yet". Neutral, no loop. |
| `WAITING_HUMAN` | Amber. Decision requested, wait clock, what to read ("Open the brief (round n)"), allowed actions, "Decide in the Coordinator chat" with the existing how-to text. No acting buttons. Amber pulse loop. |
| `BLOCKED` | Red, still. Blocker code, plain-language detail, "No recovery path is recorded; a fix needs a new run", links to findings and the run report. |
| `LOCAL_PR_PROPOSAL_PREPARED` | Green. "Local PR proposal ready · not published", total time, links to the proposal and the report. |
| `REJECTED` | Slate. Terminal code and reason, link to the report. |
| `UNREADABLE` / `CORRUPT` / `INCOMPLETE_TAIL` / `UNSUPPORTED_WORKFLOW` / `NOT_INITIALIZED` | Diagnostic card with source status, diagnostic code, message and record number. No animation. Pipeline drawn only if the stage graph was read. |

### 4.2 Inspect view

Everything the shipped dashboard shows — the Now card, run facts, and the seven tabs (timeline, agent attempts, test execution, plan audits, reviews, evidence, problems) — restyled in the new tokens. Fixes included: role badges on timeline rows; event type names never break mid-word; digest refs collapse into an expandable "refs" chip; the Now card title names the stage and the role once each, and only once when they are the same (today it reads "Developer, Developer"). Clicking a stage card in Live opens Inspect with that stage selected (today's stage selection behaviour). A run chosen from the run switcher or the landing page opens in Live; a run chosen from the Inspect sidebar stays in Inspect; reloading the page keeps the mode stored in the address. Inspect keeps the full re-render with its existing focus, scroll and disclosure restoration.

### 4.3 Run switching

- **Live:** drop-down in the top bar, grouped Needs you, Active, Blocked, Done, with counts.
- **Inspect:** the sidebar, restyled. Each run shows a status dot and a mini strip with one segment per stage, coloured by state, built from `RunSummary.stage_states`.

### 4.4 Themes and tokens

Dark is the flagship; light uses the same layout and motion with soft shadows instead of glows. The Light / Dark / System switch and the stored preference stay as today.

Status tokens:

| Token | Dark | Light |
|---|---|---|
| `--ok` | `#34d399` | `#19795c` |
| `--info` | `#5aa8ff` | `#2b5fd9` |
| `--human` | `#fbbf24` | `#9e6a1a` |
| `--danger` | `#f87171` | `#c42b4a` |

Role identity tokens (badges, card top stripe, swimlane bars; never used to signal status):

| Role | Dark | Light |
|---|---|---|
| Planner | `#a78bfa` | `#7352e8` (was `#7c5cf0`) |
| Plan Auditor | `#e879f9` | `#b42bc4` |
| You (human) | `#fbbf24` | `#b7791f` |
| Tester | `#2dd4bf` | `#0d7d71` (was `#0f8f81`) |
| Developer | `#60a5fa` | `#2f6fdf` |
| Code Reviewer | `#f472b6` | `#d02670` |
| PR Reviewer | `#818cf8` | `#4f5bd5` |
| Engine | `#94a3b8` | `#64748b` |

Before shipping, the implementation validates both palettes for WCAG AA text contrast and 3:1 non-text contrast against their surfaces and for colour-vision-deficiency separation; a failing value may be adjusted within its hue family and the adjusted value recorded in this table. Role badges carry two- or three-letter text (PL, AU, YOU, TE, DEV, CR, PR, EN) so identity is never colour alone. Fonts stay system stacks (`font-src 'self'`; no downloaded web fonts).

### 4.5 Containment and responsive layout

- No fixed pixel widths for panels; every grid or flex child that holds text has `min-width: 0`.
- Pipeline columns by the pipeline's own content width: 7 per row at 940 px and wider; 5 per row from 640 to 939 px; a single vertical list below 640 px. (At a 1440 px window this gives 7 columns, at 1024–1280 px 5 columns, and the list on narrow windows.) Rows = `ceil(stages / columns)`. The layout function takes any stage count.
- From 900 to 1199 px the vitals panel moves below the pipeline; below 900 px the swimlane and feed stack.
- Wires are SVG paths computed from measured card rectangles and recomputed by a `ResizeObserver`; the hand-off packet follows the same path.
- Text that does not fit is truncated with an ellipsis; the full text is in the element's accessible name and `title`. Badges size to their text.
- Only designated regions scroll (the Inspect tab panels and the run list); the page never scrolls horizontally.

### 4.6 Tab title and icon

- Title: `(<n>) Needs you · RSTACK Mission Control` when `n` runs need a human; otherwise `RSTACK Mission Control`.
- Icon: generated in the page as a `data:image/svg+xml` URL (allowed by `img-src 'self' data:`). Priority red > amber > green > default: red if a run became `BLOCKED` while the tab was hidden; amber while any run needs a human; green if a run reached `LOCAL_PR_PROPOSAL_PREPARED` while the tab was hidden. The red and green markers clear when the tab becomes visible.

## 5. Architecture

### 5.1 Modules (`dashboard/web/`)

| Module | Responsibility | Pure? |
|---|---|---|
| `app.js` | Shell: SSE connection (kept as is), hash state (`run`, `mode=live\|inspect`, `tab`, `stage`), theme, view dispatch. | no |
| `derive.js` | From a `RunView`: stage durations, swimlane segments, vitals, run time, human wait intervals. | yes |
| `motion.js` | `cues(previousView, nextView)` returns cues for timeline entries with `seq > previousView.journal_version` (same run only) plus stage-state transitions; `play(cues, elements)` runs them with `Element.animate`, honouring reduced motion, visibility and pause, and a per-run "highest played seq" registry initialised to the journal version at first load. | `cues` yes, `play` no |
| `flow.js` | `layout(stages, width)` returns rows and positions; the DOM part keeps cards keyed by `stage_id`, draws wires from measured rectangles, moves the packet (CSSOM `offsetPath` / `offsetDistance`). | `layout` yes |
| `live.js` | Builds the Live screen once per run, then patches text, attributes and keyed lists in place. | no |
| `lanes.js`, `feed.js` | Swimlane (keyed by role) and journal feed (keyed by `seq`). | no |
| `clock.js` | One 1 Hz timer updating every element with `data-since` / `data-until`; formats `m:ss` under an hour and `h:mm:ss` above; never shows less than `0:00`; stops at terminal states. | formatting yes |
| `alerts.js` | Title and icon state machine (section 4.6). | state machine yes |
| `views.js` | Inspect view, restyled, with the 4.2 fixes. | no |
| `app.css` | Tokens (status, role, glow/shadow per theme), components, motion keyframes, reduced-motion block. | n/a |

`graph.js` is replaced by `flow.js` and removed.

### 5.2 Update flow

SSE `run-changed` → `loadRun` (as today) → `motion.cues(previous, next)` → `live.update(next)` patches the DOM to the new state → `motion.play(cues)` overlays animation on the patched elements. `heartbeat` drives the Live-dot beat directly. Inspect mode keeps the existing full re-render path.

### 5.3 Contracts, server, package

- **Read model:** one additive field, `RunSummary.stage_states: { stage_id: string; state: StageState }[]`, filled in `summarize` (`core/read-model/project-run.ts`) from the projected stage graph, in stage-graph order. `DASHBOARD_SCHEMA_VERSION` stays 1 because the field is additive. No other read-model change.
- **Server:** no change; it already serves any plainly named `.js`, `.css` or `.svg` file in `dashboard/web/`.
- **Package:** update `RUNTIME_ASSETS` in `adapters/copilot-vscode/generate.ts` and the asset list in `tests/package.test.ts` for the new modules and the removal of `graph.js`.
- **CSP:** unchanged. No inline `style` attributes or `<style>` elements; dynamic values go through CSSOM (`element.style.setProperty`), which `style-src 'self'` permits. No `innerHTML`, no `eval`, no external URLs (already enforced by `tests/package.test.ts` for `app.js`; extend that check to every web module).
- **Line endings:** every new or edited file is written with LF line endings (the repo has `core.autocrlf=true` and byte-comparison tests).

## 6. Failure states

- Stale or disconnected connection: rule 5; the existing reconnect and polling fallback stay.
- "Pause live updates": nothing animates while paused; on resume the page shows the latest state and plays only the latest cue.
- Run removed while shown: existing behaviour.
- Unknown `StageState` value or an unknown timeline category: neutral card or row, no cue, no exception.
- Any exception inside `motion.play` is caught; state rendering never depends on animation success.

## 7. Acceptance criteria

1. **Honest motion.** Appending one journal event to a fixture run on a live server produces exactly one cue animation of the expected kind; a re-render, a `resync`, a reconnect or switching away and back produces none.
2. **Idle stillness.** For a `BLOCKED` run and a `LOCAL_PR_PROPOSAL_PREPARED` run with no new events, `document.getAnimations()` contains no running animation other than a finishing heartbeat beat.
3. **Loops only where allowed.** For a dispatched run the only infinite animation is the breathing glow; for a `WAITING_HUMAN` run only the amber pulse.
4. **Reduced motion.** With reduced motion emulated, no animation changes `transform`, `offset-distance` or position.
5. **Containment.** At 1024, 1280, 1440 and 1920 px wide, in dark and light, the page has no horizontal scroll and no element outside the designated scroll regions has `scrollWidth > clientWidth`.
6. **Truth first.** Immediately after an update is applied (before any animation finishes) the stage card states, hero and vitals match the new view.
7. **Durations.** Stage durations, swimlane segments, vitals and run time match values computed independently from the fixture's recorded timestamps; clocks stop at terminal states.
8. **Hero states.** Each row of the 4.1 hero table renders for its fixture with the specified wording; no agent copy says "working", "thinking" or "running".
9. **Inspect parity.** Every field and tab of the shipped dashboard is reachable in Inspect, with the 4.2 fixes.
10. **Alerts.** Title count and icon colour follow section 4.6 across visible and hidden tab transitions.
11. **Keyboard and accessibility.** Stage cards, the Live/Inspect toggle and the run switcher are reachable and operable by keyboard; every card's accessible name includes its state text.
12. **Package and security.** The package test passes with the updated asset list; no web module contains `innerHTML`, `eval(` or an external URL.
13. **Regression.** The full suite passes, including the protocol and rc9 byte-comparison tests.

## 8. Testing and demo

- **Unit (node --test, pure modules):** `derive` (durations; pending, failed and superseded attempts; human waits; branches entered; terminal clock stop), `motion.cues` (one cue per new event; none on same version, run switch, reconnect, resync; latest only after hidden or paused; at most three when several arrive), `flow.layout` (any stage count, each width band), `alerts` state machine, `clock` formatting, and the new `stage_states` field in the read-model tests.
- **Browser (existing CDP harness, `tests/support/browser.ts`, extending `tests/dashboard-browser.test.ts`):** acceptance criteria 1–6, 8, 10 and 11.
- **Demo:** `scripts/dashboard-demo.ts` gains realistically spaced timestamps and a paced replay mode that appends events to a live workspace every few seconds, so the motion can be watched and recorded; it writes a fresh screenshot set for both themes and every hero state. All demo output stays labelled SIMULATED.

## 9. Delivery and governance

- Work happens on `feat/rstack-sdlc-dashboard-mission-control`. The first implementation task amends `01-product-and-ux.md` §3.5 to point to section 3 of this document.
- Progress and decision records follow repo practice (`docs/progress.md`, `docs/decisions.md`).
- No source change starts before the owner's authorization line; no push, merge or tag without separate owner authorization.

## 10. Out of scope

Desktop notifications and sound; any dashboard action that changes a run; host telemetry (effective model, token use, durations measured by the host); canvas or WebGL rendering; new runtime dependencies; downloaded web fonts.

## 11. Changes during implementation (2026-10-11)

Where the build differs from the text above as first written, and why. Each is a builder choice open to the owner.

1. **Column thresholds** (4.5) are measured on the pipeline's own width, not the window's, so the vitals panel beside it cannot push cards out of their box. Values: 940 px and 640 px.
2. **Run selection** (4.2): a run chosen from the Inspect sidebar stays in Inspect; the switcher and the landing page open Live. Jumping to Live from a list meant for inspection was judged unhelpful.
3. **Landing page:** with no run selected, Live shows one tile per run (status, mini strip, last activity), runs that need a human first. The spec had no screen for this case.
4. **Light-theme tokens** (4.4): planner and tester darkened within their hue so white badge text reaches 4.5:1. The `--faint` text token is `#7383aa` (dark) and `#6b7486` (light), raised from the plan's `#55658c` and `#8a94a6`, which were near 3:1 against their surfaces.
5. **Loop keyframes** (rule 8): both loops animate opacity only; the amber pulse has no scale, so it cannot reach outside a card's box.
6. **Modules** (5.1): the cue effects live in `live.js` (`animate`), which owns the elements; `motion.js` stays pure apart from its diagnostic log. A small `dom.js` holds the in-place patch helpers and the SVG namespace constant. `derive.axis` returns milliseconds (`ms`), not seconds.
7. **Package check** (5.3): the forbidden-pattern check now covers every web module. The SVG namespace identifier `http://www.w3.org/2000/svg` is the one URL-shaped string allowed: it is a name that DOM SVG creation requires, not a resource, and nothing is fetched.
8. **Diagnostic log:** `motion.js` keeps the last 50 cues played on `globalThis.rstackMotionLog` (run, kind, journal number, reduced). The browser tests read it to prove each cue plays once; it holds no run content.
9. **Pause button** reads "Pause" / "Resume"; its accessible name is still "Pause live updates" / "Resume live updates".
10. **Test driver:** `tests/support/browser.ts` now sends the text of Enter and Space with the key, so a focused button is activated as with a real key press.
11. **Branch chips** (4.1) hang above the main-path stage they rejoin (`next` in the retained definition), because the stage a branch leaves from is not in the definition; once entered, the chip names its observed origin from the timeline.
12. **Wording and counts:** an in-progress run is labelled "In progress", not "Running", so no run-level label reads as an agent at work; the top bar's "active" count uses the same rule as the switcher's Active group (in progress and not waiting for a human).
13. **Paused updates** stop all Live motion, including the heartbeat beat (6).
14. **Update failures in Live:** when a background reload fails, Live shows "Update unavailable … Showing the last received state", as Inspect already did.
15. **Full screen** (owner request, 2026-10-11): a "Full screen" button in the top bar and the `F` key put the whole dashboard on the whole screen (browser full-screen mode; `Esc` or `F` exits). The Live view always fills the window's height: the lower row (swimlane and feed) takes the height left over.
16. **Review fixes** (builder-side review of the whole change): a review that rejects and blocks its stage plays only the block cue; each feed row slides in once per event; a ring's colour follows the card's state; the hero's "next" stage comes from the current stage's own `next`, so branch stages show the stage they rejoin; the "events while you were away" count belongs to one run.
