# RSTACK Live Run Dashboard — Builder Plan, Agent Lanes, and Acceptance

**Status:** implementation plan only; no dashboard source has been implemented by this documentation change.
**Read first:** [01 — Product and UX](01-product-and-ux.md), [02 — Read-only architecture](02-architecture-and-read-model.md).
**Target:** RSTACK SDLC current authored workflow v6 (including independent Code Review, PR Review, and local PR proposal).
**Scope:** optional local developer dashboard; no new reasoning role, no external publication, no Jira or Bitbucket.

## 1. Assignment for the build agents

Create a reliable and attractive **live view of a RSTACK run** that reflects validated engine records rather than inventing state. It must work with current offline/synthetic runs before any live VS Code Copilot telemetry is available.

The work is divided by responsibility, not by copying the repository or running competing builders in the same files.

### Independent analyst / architect — Astra

- Review the two preceding documents against the current code.
- Validate the actual workflow, journal, state, artifact, and packaging contracts.
- Identify gaps between user goals and the current data available.
- Make a bounded decision on projection contract, run discovery, browser security, and package companion.
- Produce a concrete implementation design and tests.
- **Do not implement.**

### Integrator / builder — Fable / BUILD-02

- Own the approved projection contract and integration.
- Assign distinct edit lanes for any frontend helper/builder.
- Implement the pure read-model and optional local server.
- Coordinate tests, package changes, and integration.
- Preserve the original source/evidence identities.
- Perform focused regression, full normal suite where reasonable, and targeted sensitivity only.
- Hand off an exact candidate for independent verification.
- **Do not self-approve.**

### Frontend lane — BUILD-03 (if available and authorized)

- Own UI components, layout, accessibility, responsive design, and visual regression tests.
- Consume a fixture/contract provided by BUILD-02; do not reinterpret engine state in frontend code.
- Do not edit core workflow/state/journal or shared package files without a window/ownership transfer.
- Return build, tests, screenshots, and known limitations to BUILD-02.

### Independent verifier — Astra

After implementation, verify:

- the read model against authoritative journal/state behavior;
- correctness of visible stages and status;
- security of local read-only interfaces;
- no influence on execution;
- package reproducibility;
- UI behavior and accessibility;
- exact candidate identity and regressions.

Use the existing coordination protocol for shared source/testing windows. Independent reviewer must not implement its own fixes.

## 2. Preconditions and source baseline

Before writing production code:

1. Record branch, HEAD, current working-tree status, and scope.
2. Read the current implementation, not just earlier reports:
   - core/policies/workflow.ts
   - core/engine/journal.ts
   - core/engine/state.ts
   - core/engine/engine.ts, especially status() and directives
   - core/contracts/records.ts
   - scripts/rstack.ts
   - adapters/copilot-vscode/generate.ts and installer
   - profiles/trial-v2.json, as applicable
   - current tests and S6 host-validation notes.
3. Confirm actual stage and status vocabulary. Do not assume the proposed reconnaissance stage has shipped.
4. Record whether host model/session telemetry exists in the runtime; if not, mark it unobserved.
5. Confirm the current S6 baseline and do not reinterpret the previous independent review as approval of new dashboard source.

If a later repository change alters workflow version or state schema, update the design inputs before implementation.

## 3. Release stages

### DASH-0 — Analysis and decision gate

**Owner: Astra; integrator reviews feasibility.**

Deliver:

- authoritative source inventory and relevant contracts;
- stage-graph mapping for v6, including product question, plan revision, and PR review;
- normalized status vocabulary and unknown states;
- plan for old/mismatched workflow versions;
- local security design;
- API/read-model contract;
- package companion decision;
- read-only/no-context-pollution evidence;
- risk table, implementation estimate, and acceptance matrix.

**Stop for owner decision** if a major product change is required, including new write authority, hosted service, cross-user access, exposing protected source by default, changing engine transitions, or live transcript collection.

Do not create additional AI agents merely to build the dashboard.

### DASH-1 — Pure projector and fixture tests

**Owner: BUILD-02.**

Implement a pure function or small module that maps validated journal/state/workflow facts to a dashboard view.

Support:

- active with no pending attempt;
- active with a pending role attempt;
- waiting for product clarification;
- waiting for plan decision;
- accepted results and deterministic stages;
- failed attempts and retry history;
- plan revision / second audit;
- verification failure and blocker;
- Code Reviewer rejection;
- PR Reviewer REQUEST_CHANGES or INCONCLUSIVE;
- DONE / PR_PROPOSAL_READY with publication NOT_ATTEMPTED;
- incomplete journal tail and corrupt/mismatched workflow.

Do not assume an outstanding attempt means the model is still thinking.

Generate fixtures from **real engine APIs and retained synthetic runs** where possible. Hand-authored fixtures should be separately labeled and cross-checked against the contract.

Pass gate: deterministic projection for the same committed event sequence with no state mutation.

### DASH-2 — Local read-only service

**Owner: BUILD-02.**

Propose read endpoints similar to:

    GET /api/v1/runs
    GET /api/v1/runs/:runId
    GET /api/v1/runs/:runId/timeline?cursor=...
    GET /api/v1/runs/:runId/artifacts

Optional later:

    GET /api/v1/runs/:runId/events   (SSE)

The precise endpoints are design choices; not existing commands.

Requirements:

- fixed authorized workspace/run root;
- loopback-only by default;
- robust local access control;
- GET-only/read-only; no start/decide/next/abandon/submit/retry;
- no filesystem writes to run/journal/state/evidence;
- safe error status for corruption, incomplete tail, unknown run, mismatched workflow;
- bounded pagination and refresh;
- no arbitrary path or raw environment disclosure;
- HTML/Markdown escaping;
- source/symlink traversal resistance;
- server can stop/restart without affecting the engine.

Pass gate: engine runs identically whether the dashboard is running, stopped, or crashed.

### DASH-3 — Frontend and UX

**Owner: BUILD-03 under a disjoint lane, or BUILD-02 if no parallel lane available.**

Build:

- Run list and status filters.
- Main pipeline stage map, with active stage highlighted.
- Current activity panel and accurate pending/idle terminology.
- Human wait or blocker panel showing facts from the engine.
- Timeline with attempts, retries, and branch history.
- Artifact/evidence index with hashes and safe supported views.
- Configured role model labels; effective host model **unknown until observed**.
- Clear PR_PROPOSAL_READY / NOT_ATTEMPTED status.
- Last-confirmed-version / last-updated indicator.
- Honest empty, loading, stale, inaccessible, corrupt, and unsupported workflow states.

Keep layout responsive. Keyboard navigation, screen-reader labels, reduced motion, and non-color status distinctions are required.

A default aesthetic direction is a refined “mission control” interface: high-contrast typography, crisp stage cards, restrained glow for the confirmed current stage, and subtle transition movement. Animation may not imply actual model activity.

Pass gate: representative screenshots and browser interaction checks agree with fixture-backed engine states.

### DASH-4 — Optional package integration

**Owner: BUILD-02.**

Keep the viewer an optional companion to the package, not a mandatory change to every worker/Coordinator installation.

Determine how a developer launches it for a root workspace, how it discovers multiple application runs, and how it is updated or removed safely. Reuse existing package provenance and ownership principles where sensible.

Do not presume a new global CLI command is available until it is implemented, documented, and tested.

Pass gate: a normal RSTACK run and the Coordinator experience work unchanged without the dashboard installed or launched.

### DASH-5 — Integrated validation and independent review

**Owner: BUILD-02 integrates; Astra reviews.**

Validate stable source sequentially:

- typecheck;
- projector unit/contract tests;
- read-only service and security tests;
- UI interaction/visual tests;
- full normal suite as scheduled;
- deterministic dashboard/package builds;
- existing package tests if affected;
- targeted meaningful sensitivity mutations;
- no scope contamination;
- exact source inventory and package identities.

Do not run the entire sensitivity catalog merely because the dashboard exists.

Astra issues:

- APPROVED_FOR_OPTIONAL_DASHBOARD_PILOT; or
- CHANGES_REQUESTED.

Approval of the local dashboard does **not** constitute Copilot-host S6 validation.

## 4. Minimum acceptance scenarios

For each scenario, check the normalized API projection **and** displayed UI. Use reproducible engine fixtures.

| ID | Scenario | Expected |
|---|---|---|
| DASH-01 | No runs | Useful empty state, no fake activity |
| DASH-02 | Run started, Planner not dispatched | Intent is current; no executing-model claim |
| DASH-03 | Planner dispatched, no result | Pending attempt and intended role displayed; actual model UNKNOWN unless observed |
| DASH-04 | Intent has open product decisions | PRODUCT_QUESTION wait with exact engine actions |
| DASH-05 | First audit accepted but human not yet decided | Human wait shown; no automatic proof dispatch |
| DASH-06 | Second audit requested | Plan revision/audit attempt branch accurately shown |
| DASH-07 | Attempt failed then retried | Both attempts retained with correct outcomes |
| DASH-08 | Abandoned attempt, later stale result | No false completion or stale attempt promotion |
| DASH-09 | Verification fails | Show correct stage/blocker/evidence, no successful checkmark |
| DASH-10 | Code Reviewer rejects | BLOCKED with accurate verdict, no PR proposal |
| DASH-11 | PR Reviewer requests changes | BLOCKED; PR proposal not ready |
| DASH-12 | Approved run reaches proposal | PR_PROPOSAL_READY, external publication NOT_ATTEMPTED |
| DASH-13 | Incomplete tail | Last committed state plus diagnostic warning |
| DASH-14 | Corrupt journal | Visible error; no fabricated green pipeline |
| DASH-15 | Unsupported workflow identity | Explicit unsupported state; no reinterpretation as v6 |
| DASH-16 | Two runs in different subprojects | Correct workspace/app identification, no evidence mixing |
| DASH-17 | Dashboard stopped/started during run | Engine progress unaffected; viewer catches up |
| DASH-18 | Missing effective model observation | Configured/intended vs observed clearly distinguished |
| DASH-19 | Malicious HTML / path values | No script execution, traversal, or unauthorized file read |
| DASH-20 | Unauthorized remote client | Cannot read local run data |
| DASH-21 | Viewer read-only audit | No mutation of journal, snapshot, accepted artifacts, or run directory |
| DASH-22 | Large run history | Bounded memory, responsive pagination, stable versioning |
| DASH-23 | Dashboard browser crash/reload | Projection recovers without any workflow transition |
| DASH-24 | Runtime model/trace data unavailable | Graceful UNKNOWN/NOT AVAILABLE, not invented telemetry |
| DASH-25 | Reduced-motion/keyboard navigation | Accessible complete workflow without animated-only cues |

## 5. Hard correctness guarantees

### Single truth

Only committed validated engine evidence can advance a displayed phase. A browser animation or filesystem watcher cannot advance a run.

### No workflow-control authority

Dashboard MVP has no mutation API. No buttons or gestures may implicitly authorize a human decision, rerun, abandonment, publication, or repair.

### Replay identity

Read model displays the run's workflow version/ref. A mismatched version must be visible as unsupported rather than silently mapped to a later definition.

### Evidence integrity

Artifact links must resolve only allowed retained content under verified identities. Rendering must not execute user-controlled text.

### Honest live status

A dispatched role is not the same as a verified host invocation in progress. Configured model is not the same as effective model. Model thinking/tokens/tool traces remain unavailable unless provided by a separately verified host source.

### No context pollution

Viewer refresh/caching may not write session traces, dashboards, or analytic summaries into active agent contexts. Learning bundle creation stays post-run and separate.

### Fault isolation

Dashboard crashes, refreshes, or unavailable telemetry must not influence execution, state transitions, or terminal outcome.

## 6. Test and evidence expectations

Retain:

- input synthetic run identity;
- exact source workflow/ref;
- projector input and output fixture hash;
- tests and results;
- UI screenshots for key states;
- local security probe results;
- provenance for any displayed actual effective model;
- package/dashboard build identity;
- limitations and skips.

Do not cite a screenshot as proof of state correctness without the matching engine event/state evidence.

Avoid running tests while another builder changes shared source. Use BUILD-02's existing window protocol for test scheduling.

## 7. Explicit non-goals for this build

- No PR publication.
- No Jira/Bitbucket API integration.
- No new Approver or Dashboard Agent.
- No modification to Planner/Auditor/Tester/Developer/Reviewer/PR Reviewer authority.
- No role model pin changes.
- No full host-visible reasoning capture.
- No learning exporter or cross-run analytics engine.
- No hosted multi-tenant dashboard.
- No new database required for MVP.
- No automated owner decisions through UI.
- No self-modifying pipeline.
- No broad unrelated refactor of engine storage/write containment.

Existing source-tree scaling limitations are a separate engineering investigation; do not mask them by copying more repository content into dashboard caches.

## 8. Suggested ownership boundaries

| Lane | Owned source (proposed) | Must not edit without coordination |
|---|---|---|
| BUILD-02 | pure projector, contracts, local service, dashboard package integration, shared tests | UI files while BUILD-03 owns them |
| BUILD-03 | UI view/components/styles, UI tests, visual evidence | core/engine, core/policies, contracts, installer, generator |
| Astra | analysis report, independent verification report | production source or tests |

One Fable-integrated candidate is the only handoff to Astra. Do not have both builders generate their own alternate packages/branches/worktrees or duplicate full repositories merely to parallelize.

## 9. Build handoff template

After Astra finishes DASH-0 and the owner authorizes the implementation, send BUILD-02 the following contract.

    RECIPIENT: FABLE / BUILD-02 — RSTACK LIVE DASHBOARD INTEGRATOR
    COORDINATING WITH: BUILD-03

    Implement the RSTACK live dashboard from:
      docs/live-dashboard/01-product-and-ux.md
      docs/live-dashboard/02-architecture-and-read-model.md
      docs/live-dashboard/03-builder-plan-and-acceptance.md

    First read Astra's independent DASH-0 architecture analysis.

    Preserve current workflow and role authority. The dashboard is
    observational and read-only; its visible facts must come from
    validated journal/state evidence, not browser inference.

    Execute DASH-1 through DASH-5 in small batches. Keep edit lanes
    disjoint, coordinate test windows, and retain exact evidence.
    Prefer a local optional dashboard companion. Do not add Jira,
    Bitbucket, Copilot-host dependencies, a database, or a new agent.

    Run focused tests, UI/browser checks, and targeted sensitivity;
    avoid unnecessary full mutation catalogs.

    Do not commit/push unless the owner separately authorizes it.
    Hand back an exact candidate for independent Astra verification.
    Stop if implementation needs a major new product authority.

This template intentionally does **not** claim Astra has already approved a design or that implementation has been authorized by creating these docs.

## 10. Delivery definition

The dashboard MVP is complete only when:

1. It can display a real synthetic run through current RSTACK workflow v6.
2. It highlights the correct current stage based on committed state.
3. It displays human waits and blockers without granting extra authority.
4. It distinguishes pending dispatch from confirmed live model execution.
5. It shows truthful PR Review and local proposal results.
6. It offers a safe, usable event/artifact history.
7. It works for multiple runs/subprojects under one workspace root.
8. It runs without changing the engine's results or evidence.
9. The UI is usable, accessible, and visually polished.
10. Astra independently verifies the feature, and host-only claims remain marked unverified until live Copilot observation.

**Guiding principle:** an attractive visual control tower backed entirely by trustworthy engine state, with no extra agent context, no silent authority, and no fabricated progress.
