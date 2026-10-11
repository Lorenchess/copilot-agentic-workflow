# RSTACK Live Run Dashboard — Read-Only Architecture and Projection Contract

**Status:** proposed architecture, to be independently reviewed before implementation.
**Baseline inspected:** RSTACK SDLC main workflow v6 and current engine journal/state/status APIs.
**Related:** [01 — Product and UX](01-product-and-ux.md), [03 — Builder plan](03-builder-plan-and-acceptance.md).

## 1. Engineering decision

Build a **read-only projection** of authoritative RSTACK engine state for a local dashboard. Do not build another workflow engine, another agent, another event authority, or a write API.

    RSTACK engine commits journal events
                    │
                    ▼
    validated journal + workflow-specific state replay
                    │
                    ▼
       read-only projection service
            │               │
         initial GET     later updates
            │             SSE / polling
            └───────┬───────┘
                    ▼
              dashboard UI

The UI may format or highlight data but must never infer that an uncommitted action occurred.

## 2. Confirmed current data sources

### 2.1 Authoritative journal

- core/engine/journal.ts defines journal.jsonl as the single authority for run state.
- Framed entries have checksums and are parsed; corruption is a blocker.
- core/engine/state.ts replays events and validates transitions.
- The state snapshot is derived, not an independently writable authority.
- core/policies/workflow.ts defines the stage graph and records workflow identity.

### 2.2 Existing status API

The engine already exposes a read-only status(runId) operation. Its reply includes, where valid:

- run_id, state_version;
- phase and stage;
- current directive (CONTINUE, WAIT, DONE, BLOCKED);
- audit round and budget;
- attempts counts;
- retained subject identities;
- planning authorization;
- PR-review result, if present;
- journal event count and incomplete-tail bytes;
- snapshot status;
- lock observation.

The CLI has a status command. However, a single status reply is **not a complete human timeline**. The projection may read validated events through a dedicated read path to reconstruct a chronology.

### 2.3 Current state vocabulary

Engine phase values:

- ACTIVE
- WAITING_HUMAN
- DONE
- BLOCKED

Terminal values currently include:

- PR_PROPOSAL_READY
- REJECTED

Important directive details:

- CONTINUE can have a pending TaskEnvelope or no pending attempt.
- WAIT provides the wait kind, allowed actions, expected version, and a relative location of the displayed subject.
- BLOCKED provides exact code/detail; a PR Review blocker may include verdict and record.
- DONE includes terminal outcome and publication_status: NOT_ATTEMPTED.

Dashboard terminology must map to these facts instead of inventing a “running LLM” state.

### 2.4 Evidence records

Current run data includes accepted subject refs, content-addressed artifacts, attempts, reviews, decisions, proof, test results, proposal, and journal history. These are not all public UI content: metadata can be projected; raw content requires explicit safe allowlisting and access checks.

Use RSTACK's existing content identities; do not create a separate truth store.

## 3. One clear projection owner

Introduce a small read-only projection module, for example:

    core/read-model/
      project-run.ts
      project-events.ts
      contracts.ts

These paths are **proposed**, not already present.

It should depend on existing journal/state/contract code where safe. It must avoid invoking state-transition commands such as start, next, submit, decide, resume, or abandon.

Prefer a dedicated pure projector accepting validated state/events and a workflow definition. Keep filesystem access and HTTP transport outside the pure projector.

The projector should be:

- deterministic for the same validated events and workflow;
- version-aware;
- honest about unknown and missing observations;
- cheap enough for frequent local refresh;
- testable without VS Code, models, or a browser.

## 4. Proposed read-model contract

Use a versioned API schema separate from the workflow schema. A plausible version 1:

    {
      "schema_version": 1,
      "record_type": "dashboard-run-view",
      "run_id": "RUN-123",
      "workspace_label": "platform-repo",
      "application_label": "billing-service",
      "workflow": {
        "id": "local-request-to-proposal",
        "version": 6,
        "ref": "sha256:..."
      },
      "journal_version": 18,
      "source_status": "CURRENT",
      "engine": {
        "phase": "WAITING_HUMAN",
        "stage": "plan-decision",
        "directive": "WAIT",
        "terminal": null,
        "blocker": null
      },
      "stage_graph": [],
      "current_activity": {},
      "timeline": [],
      "attempts": [],
      "artifacts": [],
      "human_action": {},
      "model_observations": [],
      "last_committed_at": null
    }

This is an **example shape, not a claim that the API exists**. Final fields must be validated against actual persisted event contracts. A dashboard schema version must be bumped when its meaning changes.

Key principle: missing timestamps, model identity, application display names, or host observations must be null/unknown, never invented.

## 5. Stage graph projection

The stage graph must derive from core/policies/workflow.ts **for the run's recorded workflow version/identity**.

Per stage:

- stage_id;
- kind (role, human, deterministic);
- role, if any;
- display label and description;
- graph edges and branch eligibility;
- observed entered/completed/blocked status;
- attempts and accepted result reference.

Do not assume “next” is a simple sequential index. Some stages are branches (product-question and plan-revision); repeated audit rounds do not represent new fictional stage IDs.

A proposed per-stage structure:

    {
      "stage_id": "plan-audit",
      "kind": "role",
      "role": "plan-auditor",
      "display_state": "COMPLETED",
      "attempt_ids": ["plan-audit-1"],
      "accepted_result_ref": "sha256:...",
      "evidence_status": "RETAINED"
    }

**Old runs:** If the current engine cannot replay a run because WORKFLOW_MISMATCH is returned, the dashboard must not silently reinterpret it under workflow v6. Show a specific “unsupported workflow for this viewer” state, or implement version-specific read support using an independently reviewed historical contract.

The proposed repository reconnaissance stage is documented separately and **is not a v6 stage**.

## 6. Timeline projection

Create a chronological view from the validated journal.

Display:

- committed sequence number;
- event type;
- stage / attempt when recorded;
- evidence ref where available;
- an evidence-grounded human-readable sentence;
- whether the event is a transition, human decision, attempt, failure, proof, verification, review, or proposal.

Never make a timeline event from a partially written tail until it is validated as committed. Report incomplete tail as a **diagnostic observation**, not as a completed event.

Source bytes containing ticket text, paths, or agent-provided fields must be escaped and never treated as executable markup.

Consider pagination or bounded windows so long runs do not force the entire journal into every UI refresh.

## 7. Attempt and model projection

The engine knows:

- which role was dispatched;
- attempt ID and number;
- that a result is pending, accepted, failed, or stale;
- the configured profile ref and attempt budget.

The engine does not by itself prove that:

- a host model is still executing;
- a particular effective model actually ran;
- the visible reasoning trace represents internal private thought;
- tokens or tool calls happened at a specific rate.

Therefore distinguish:

| Field | Meaning | Source |
|---|---|---|
| intended_model | target role alias/label | retained profile, if safely resolved |
| configured_host_selector | emitted model pin, if configured | package/profile metadata |
| effective_host_model | model truly used by Copilot | separately verified host observation |
| active_attempt | outstanding engine dispatch | state pending |
| model_currently_running | only when trusted live host signal exists | optional future isolated telemetry |

A pending attempt must be shown as **dispatched / awaiting result**, not “actively thinking”.

Do not expose model internals or fabricate a live token counter.

## 8. Human waits, blocker and completion

Propose a normalized human action:

    {
      "kind": "PLAN_DECISION",
      "allowed_actions": ["proceed", "amend", "second-audit", "pause", "reject"],
      "expected_version": 18,
      "read": "brief/round-1.html"
    }

The actual actions are whatever the current engine WAIT directive returns; the example is non-authoritative.

The MVP UI must not write a decision itself. It can direct the user to the Coordinator, open a validated read-only artifact, and explain the consequences.

On BLOCKED, show exact code plus validated context (e.g., REVIEW_REJECTED, PR_REVIEW_CHANGES_REQUESTED, a stale attempt, or evidence mismatch). Do not silently convert blockers into resumable work.

On DONE with PR_PROPOSAL_READY, say **local proposal prepared; external publication NOT_ATTEMPTED**.

## 9. Artifact display safety

MVP should primarily show **artifact metadata**:

- logical key;
- content identity;
- status;
- producing stage/attempt if supported;
- whether the referenced bytes are still resolvable;
- safe open-in-viewer action for specifically allowed text formats.

Never expose arbitrary filesystem paths as URL routes. Validate the run ID and artifact ID, resolve beneath an approved data root, block symlink/junction traversal as applicable, and recheck content identity when reading.

Avoid rendering raw HTML inside a privileged browser page. Existing human brief files may be treated as downloads or displayed in a sandboxed viewer after validation. Render Markdown as escaped text or in a renderer with raw HTML disabled.

Do not offer an unrestricted directory browser or source download endpoint.

## 10. Refresh and real-time behavior

### MVP recommendation: bounded polling first

Every few seconds:

1. read engine status / validated journal version;
2. if unchanged, do not recompute the complete view;
3. if changed, fetch the new projection;
4. render the changed stages/timeline.

The exact frequency should be chosen by measured performance, not assumed.

A later SSE channel can announce a new committed **journal version**. The client then requests the corresponding projection. SSE is a transport, not a new event authority.

Do not require the execution engine to keep a WebSocket connection alive. The pipeline must work normally when the dashboard is closed.

### Failure semantics

- Cannot read run: show unavailable, no fake cached green state.
- Journal checksum/replay error: show CORRUPT/BLOCKED with the error code.
- Incomplete tail: show last committed version plus warning.
- Lock held: observe only; never reclaim a lock.
- Poll gap: show “last confirmed update” rather than pretending continuous visibility.
- Network/dashboard restart: reconnect and request current committed version.
- Unsupported workflow: refuse projected transitions rather than guess.

## 11. Data access and local security

This is a developer machine tool but should still be treated as a privileged local viewer.

Recommended MVP boundary:

- Bind HTTP only to loopback, never 0.0.0.0 by default.
- Use an unpredictable local session token or comparably robust access control; browser origin controls alone are not sufficient.
- Restrict allowed workspace/run roots at startup.
- Expose only GET and optionally read-only event streaming; no state-transition endpoint.
- Validate every path and identifier against traversal and symlink escapes.
- Redact or omit secrets and arbitrary environment values.
- Prevent raw artifact content from entering log lines or error pages.
- Avoid CDN assets, remote analytics, or automatic cloud upload.
- Document how the viewer is stopped and what local data it retains.

The HTTP layer should be optional. The pure projection module should also support deterministic local tests.

## 12. No agent-context contamination

**Non-negotiable:** the dashboard is an observer, not a participant.

- Do not place generated dashboard summaries or host traces inside agent attempt work directories.
- Do not add dashboard outputs as task-envelope inputs.
- Do not write learning/session transcripts into an agent-readable workspace during the run.
- Do not add dashboard-derived assertions to engine journal/state.
- Do not let the viewer mutate accepted artifacts or control files.
- If polling produces a cache, store it outside the agent-visible workspace and treat it as disposable derived data.

Use engine events to display live progress. Full host-visible session export and learning bundles remain the separate **post-run** observability proposal.

## 13. Packaging and deployment seam

Keep dashboard code optional and separable:

    authored core + read-model
               │
               ├── engine / Copilot package (existing)
               └── optional dashboard companion

Do not bundle a React dev server or large UI dependency graph into every installed worker package automatically.

Determine after analysis whether to ship:

- a local built static UI with a small Node HTTP companion;
- a VS Code view only if host integration and security advantages are proven.

**Default recommendation:** local web dashboard first, optional installation/launch, no mandatory VS Code extension. Avoid an application database or enterprise server for MVP.

This is a design direction, not an authorization to invent an unreviewed deployment scheme.

## 14. Compatibility and invariants

Dashboard changes must not:

- change run-state semantics or permitted transitions;
- bump the workflow version merely to display it;
- weaken existing identity/freshness checks;
- grant roles additional tools;
- add model-fallback or model-selection behavior;
- turn local PR proposal into external publication;
- depend on Jira, Bitbucket, or live Copilot for engine-history viewing;
- require dashboard availability for normal pipeline execution.

When source records evolve in the future, prefer extending the read-model adapter rather than forking stage semantics in the UI.

## 15. Architecture questions for independent review

Before implementation, the reviewer should resolve:

1. How to discover runs safely under a configured workspace root without broad traversal.
2. Whether to call engine.status or replay validated journal data in a read-only library for the primary projection, without introducing side effects.
3. How to display the historical stage graph when the recorded workflow does not match the current workflow.
4. How to correlate committed event sequences with stage attempts.
5. How to resolve accepted artifacts while preventing path traversal and content injection.
6. Which metadata fields genuinely exist now versus require optional host observation.
7. Whether bounded polling is sufficient for MVP.
8. How to keep the viewer outside agent write/read lanes.
9. What nonblocking dashboard failure semantics should look like.
10. How to package the dashboard so developer installation remains simple.

The builder must not silently fill unresolved architectural gaps with invented engine facts.
