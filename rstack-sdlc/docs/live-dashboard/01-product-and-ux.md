# RSTACK Live Run Dashboard — Product Vision and UX

**Status:** implemented (first build: PR #3; Mission Control redesign: [06](06-mission-control-redesign.md), commit `5436ac4`); not host-validated.
**Audience:** RSTACK maintainers, independent architecture reviewers, frontend builders, and developers using VS Code Copilot.
**Reference baseline:** authored RSTACK SDLC workflow on main, workflow v6 (local-request-to-proposal).
**Companion documents:** [02 — Architecture and read model](02-architecture-and-read-model.md), [03 — Builder implementation plan](03-builder-plan-and-acceptance.md).

## 1. Product goal

Build a polished, useful, **live read-only control tower** for RSTACK SDLC. A developer should immediately understand which stage of an engineering run is active, which role has been dispatched, what action is required next, what evidence has been accepted, and why a run has stopped.

The dashboard accompanies the installed RSTACK package; it does **not** replace the Coordinator in VS Code Copilot and does **not** make the other agents user-selectable.

The primary outcome is operational clarity, not decorative animation:

- See all local RSTACK runs for a workspace and select one.
- Follow the actual workflow, including branches, retries, approvals, failure, and PR review.
- Highlight the current stage and show the **dispatched role**.
- Show the effective model **only when the host has actually observed it**; otherwise show intended/configured or unknown with honest labels.
- Show human waits, blockers, retry budget, and a factual next step.
- Inspect accepted artifact identities and sanitized summaries without exposing secrets.
- Review a chronological event timeline and attempt history.
- Keep the dashboard usable for monorepos with one root installation and multiple targeted applications.

## 2. Existing pipeline to visualize

The checked-in workflow definition is the authority. The current workflow is **v6**, with these main stages:

    request
      ↓
    intent (Planner / intake)
      ↓
    spec (Planner / specification)
      ↓
    plan (Planner / plan)
      ↓
    plan-audit (Plan Auditor)
      ↓
    brief (deterministic)
      ↓
    plan-decision (human)
      ↓
    proof (Tester)
      ↓
    implement (Developer)
      ↓
    verify (deterministic)
      ↓
    review (Code Reviewer)
      ↓
    pr-review-packet (deterministic)
      ↓
    pr-review (PR Reviewer)
      ↓
    proposal (deterministic)
      ↓
    PR_PROPOSAL_READY

There are **real workflow branches**, not just a linear progress bar:

- **product-question:** entered when Intent has unresolved product decisions; the owner answers or rejects.
- **plan-revision:** entered when a human requests the permitted second audit round.
- **human pause/reject:** plan decision can pause or reject.
- **failed or uncertain attempts:** remain visible; do not render abandoned or failed attempts as successful.
- **verification correction / blocked review:** displayed using the actual engine event transitions and blockers.

**Important:** PR_PROPOSAL_READY means a **local PR proposal exists**; it does not mean a remote pull request was created. GitHub/Bitbucket publication is outside the current baseline.

The proposed repository-reconnaissance stage from the separate planning design document is **not present in the current v6 workflow**. A dashboard must derive its stage graph from the versioned workflow, not hardcode proposed stages as if already implemented.

## 3. User experience

### 3.1 Run overview (first screen)

A developer sees:

- Workspace/repository identity and selected application.
- Recent runs, each with run ID, current stage, workflow version, status, last recorded activity, and next required action.
- Simple filters for **active / waiting / blocked / completed**.
- Clear distinction between **PR proposal ready**, **rejected**, and **actual PR created** (not currently supported).
- A friendly empty state explaining how to start a run from the RSTACK Coordinator.

Do not assume each run belongs to the same application merely because they share a workspace root.

### 3.2 Run detail (primary screen)

Illustrative layout, not a prescribed component framework:

    RSTACK SDLC                           Run RUN-123      WAITING FOR HUMAN
    Workspace: platform-repo              App: billing     Workflow v6
    ─────────────────────────────────────────────────────────────────────────
    [Intent ✓]──[Spec ✓]──[Plan ✓]──[Audit ✓]──[Decision ◉]──[Proof ○]...
                                    Current stage: PLAN DECISION
    ┌────────────────────────────┐ ┌───────────────────────────────────────┐
    │ Current activity           │ │ Action needed                         │
    │ Waiting for human decision │ │ Review exact retained brief           │
    │ Round 1 / audit budget ... │ │ Actions: proceed, amend, ...          │
    │ Role: none currently active│ │ Open brief (safe, read-only)          │
    └────────────────────────────┘ └───────────────────────────────────────┘
    Timeline | Artifacts | Attempts | Verification | Reviews | Proposal

The dashboard should guide without inventing additional permissions. Its first version **does not approve, resume, retry, abandon, or publish** anything. Those actions continue through the governed Coordinator and engine.

### 3.3 Phase states

Use labels grounded in the engine:

- **Not reached** — no authoritative transition into this stage.
- **Current / ready** — the engine is at the stage but no role attempt is pending.
- **Dispatched / awaiting result** — a role attempt is pending; execution itself may be unobservable.
- **Waiting for human** — engine WAIT directive, with exact wait kind and actions.
- **Accepted / completed** — stage output accepted or deterministic transition committed.
- **Failed attempt** — recorded attempt failure or abandonment; may still be retryable.
- **Blocked** — engine BLOCKED with exact code.
- **Done** — terminal result, with its actual terminal code.
- **Not taken / branch not entered** — optional branch that was never used; not a failed phase.

Never display a generic percentage that implies a known remaining duration. The workflow can branch and retry; stage counts are not reliable time estimates.

### 3.4 Current activity card

Show only grounded fields:

- Current stage, kind (role / deterministic / human).
- Dispatched role and attempt ID when there is a pending envelope.
- Attempt count and allowed budget when available.
- Last committed event and state version.
- Configured role model from profile **versus** actual effective host model, separately labeled.
- Human wait directive or blocker with its exact code and plain-language explanation.
- Link to the subject/evidence to inspect.

Use **"dispatched / awaiting response"** rather than **"model is thinking"** unless a live host signal proves actual activity. A stale pending attempt is not evidence the model is still running.

### 3.5 Visual design

Target a modern, calm developer tool:

- Flow visualization with strong active-stage focus and quiet completed nodes.
- Motion follows the honest-motion rules in [06 — Mission Control redesign, section 3](06-mission-control-redesign.md#3-honest-motion-rules-replaces-01-35-motion-bullets) (owner decision, 2026-10-11): every animation is started by a newly committed journal event, a service heartbeat, real elapsed time since a recorded timestamp, or the user's own action; the only loops are a calm glow while a dispatch awaits its result and an amber pulse while a human is needed. Never fabricated activity.
- Side-by-side role, attempt, model, and evidence identity.
- Distinct waiting / blocked / review rejected / completed semantics; never color alone.
- Crisp timeline with optional branch/attempt tree.
- Dark and light themes, responsive desktop/tablet layout, keyboard navigation, accessible contrast, reduced-motion support.
- **No animated fake reasoning, token counters, or progress estimators.**

An interactive graph is helpful only if it reveals a meaningful transition or branch; an ordinary compact stage list is an acceptable accessible fallback.

## 4. Developer guidance

When a run is WAITING_HUMAN, show:

- What artifact to read.
- Which decision is requested.
- Which actions the engine currently allows.
- A reminder to use the Coordinator / existing engine decision path.

When BLOCKED, show:

- Named blocker and relevant retained evidence.
- Whether any authorized recovery path is recorded.
- No automatic "fix" button and no inferred permission to abandon or retry.

When DONE, show:

- Terminal code: PR_PROPOSAL_READY or REJECTED.
- Whether publication was attempted (currently NOT_ATTEMPTED).
- Links to review, PR review, verification, and local proposal evidence as applicable.

## 5. Intended distribution

The dashboard should be an **optional package companion** to a root-installed RSTACK:

    monorepo-root/
      .github/agents/               RSTACK Coordinator + hidden workers
      .github/skills/               internal RSTACK Skills
      service-a/
      service-b/
      frontend/
      .rstack/runs/                 authoritative run records

The first release may be a localhost, developer-started viewer pointing at one RSTACK workspace. Do not require an always-running hosted backend, Jira, Bitbucket, GitHub login, a database, or cloud deployment.

Do not create another user-visible RSTACK agent. The only normal Copilot entry point remains the **Coordinator**.

## 6. Relationship to observability and learning

This dashboard is **not** the proposed post-run learning exporter.

During an active run, show engine state and metadata already recorded by authorized engine operations. Do not start exporting full chat transcripts, host-visible reasoning, private thought, or detailed learning bundles into the agent-visible workspace.

Future isolated host telemetry could enrich the display, but its collection and isolation need separate S6/S7 validation. No agent should be able to read a previous agent's live reasoning trace through this dashboard.

See [post-run observability and learning bundles](../post-run-observability-and-learning-bundles.md).

## 7. MVP versus later features

### MVP

- Workspace run list.
- Run detail with versioned phase map and current-stage focus.
- Timeline from authoritative events.
- Human wait/blocker panels.
- Role and attempt history.
- Read-only artifact metadata with safe links.
- Configured/unknown model labels with provenance.
- Safe local read-only delivery and refresh.
- Empty/error/corrupt/incomplete-run states.

### After MVP

- Rich attempt branch visualization.
- Host-observed effective models, durations, and token usage **only when a supported, isolated telemetry source exists**.
- Cross-run comparisons and evaluation overlays.
- Optional integration with post-terminal sanitized support bundles.
- Multi-workspace aggregation if genuinely needed.
- Visual refinements informed by actual developer use.

## 8. Success criteria

A developer unfamiliar with RSTACK should be able to answer within seconds:

1. What is this run trying to do?
2. Which stage is current?
3. Has an agent actually been dispatched, or is the run waiting on a human?
4. What exactly blocks progress?
5. Which evidence supports the status?
6. What happens next?
7. Is there a local PR proposal, or was a real PR created?

The answers must match the engine at a specific journal version. UI convenience must never become a second source of workflow authority.
