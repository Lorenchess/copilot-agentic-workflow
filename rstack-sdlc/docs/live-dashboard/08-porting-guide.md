# Porting guide: using the Mission Control dashboard as a reference

**Document:** `08-porting-guide.md`
**Date:** 2026-10-11.
**Purpose:** instructions for an agent that refactors another dashboard (the owner's working pipeline) using this one as its reference.
**Audience:** coding agents and developers working on the owner's dashboard. This repository is reference code only; nothing here is a product to install.
**Reference location:** https://github.com/Lorenchess/copilot-agentic-workflow, branch `main`, folder `rstack-sdlc/`.
**Related documents:**
- [06 — Mission Control redesign](06-mission-control-redesign.md) (the design and its rules)
- [01 — Product and UX](01-product-and-ux.md) (the product goals behind it)

---

## 1. Your task

You are refactoring **our** dashboard (the owner's working pipeline) so that it looks and behaves like the RSTACK Mission Control dashboard described here. This repository is the reference. Do not modify it. Copy ideas and pure logic from it, not its data model.

The owner tells you where our dashboard is, its stack (framework), and its data source (API, event stream, polling). If they did not, ask before you start.

## 2. Read the reference in this order

1. [06-mission-control-redesign.md](06-mission-control-redesign.md): the design. Read all of it.
   - **Section 3** (honest-motion rules) and **section 7** (acceptance criteria) are the requirements.
   - **Section 11** lists where the code differs from the text.
2. [mockups/06-live-view-mockup.html](mockups/06-live-view-mockup.html): the target look. Open it in a browser.
3. [`core/read-model/contracts.ts`](../../core/read-model/contracts.ts): the `RunView` and `RunSummary` shapes the page consumes.
4. The page code in [`dashboard/web/`](../../dashboard/web/), in two groups:
   - **Pure and framework-free; port these as they are:**
     - `derive.js`: durations, vitals, swimlane lanes, hero state
     - `motion.js`: which animation cue each new event triggers, and the player that plays each cue once
     - `flow.js`: the `columnsFor`, `layout` and `route` functions at the top of the file
     - `clock.js`: elapsed-time formatting
     - `alerts.js`: tab title and icon state
   - **Browser parts; these show the behaviour to reproduce:**
     - `live.js`: the Live view, the hero copy, and the cue effects in `animate`
     - `flow.js` `createFlow`: cards, wires, the travelling packet
     - `lanes.js`: the "who held the work" swimlane
     - `feed.js`: the journal feed
     - `app.js`: routing, the Live and Inspect modes, full screen, the server event stream
     - `app.css`: the design tokens and the only two looping animations
5. The unit tests are the expected behaviour of the pure modules, as executable examples:
   - [`tests/dashboard-web-derive.test.ts`](../../tests/dashboard-web-derive.test.ts)
   - [`tests/dashboard-web-motion.test.ts`](../../tests/dashboard-web-motion.test.ts)
   - [`tests/dashboard-web-layout.test.ts`](../../tests/dashboard-web-layout.test.ts)

To watch the reference run, from `rstack-sdlc/`: `node scripts/dashboard-demo.ts --no-screenshots --replay`. Open the printed URL, then `#run=RUN-11-REPLAY`. One engine step happens every 5 seconds.

## 3. What to do

1. **Inventory our dashboard:** its stack, its data source, how updates arrive, and its current screens. Then write a one-page mapping from our data to what the reference needs:
   - stages, each with its state, entered and completed times, and role
   - an ordered event timeline with sequence numbers
   - agent attempts with dispatched and settled times
   - human waits
   - test results

   Note anything we do not have.
2. **Propose a plan and wait for the owner's approval before changing code.** The plan should cover:
   - an adapter that turns our data into a view shaped like `RunView` (prefer an adapter to changing our backend)
   - which pure modules you port as they are
   - how you rebuild the Live view in our framework
3. **Implement:**
   - the Live view: hero, pipeline cards with wires, run vitals, swimlane, journal feed
   - the Inspect view
   - full screen, dark and light themes, the tab title and icon
4. **Keep a basic test safety net:** port the pure-module tests and add one smoke test of the page. Do not build a large test matrix, and do not take screenshots.

## 4. Non-negotiables (carry these over exactly)

- **Honest motion.**
  - Every animation must be started by a real signal: a newly committed event, a server heartbeat, real elapsed time since a recorded timestamp, or the user's own action.
  - Each event's animation plays once. Never replay it on re-render, reconnect, resync, run switch, or page open.
  - Only two animations may loop: a calm glow while an agent's result is awaited, and an amber pulse while a human is needed.
- **Wording.**
  - Agents are "dispatched", "awaiting result", "Waiting on the \<Role\>". Never "working", "thinking" or "running".
  - No progress percentages and no time estimates.
- **The truth shows first.** The new state appears immediately. Animation sits on top of it and never delays or hides it.
- **Read-only.** The page never acts on a run.
- **Accessibility and layout.**
  - Status is never colour alone: always a glyph and a word.
  - Support reduced motion.
  - Nothing overflows its container at any width from 1024 to 1920 px.
- **Stable keys.** If our framework re-renders, keep stable keys on stage cards and feed rows, so the looping CSS animations and running cues are not restarted. The reference keeps one Live view per run and updates it in place for the same reason.

## 5. Adapt, do not copy

- Our stage list, roles and states come from our system. Keep the reference's state vocabulary only where ours maps onto it, and write the mapping down.
- Port the pure modules unchanged where you can. Rewrite the DOM parts in our framework's idioms.
- Ask the owner before you add a dependency or change our backend's contracts.
