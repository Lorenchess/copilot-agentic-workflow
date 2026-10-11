# Guidance for Implementing an RSTACK-Compatible Dashboard Server

**Document:** `05-dashboard-server-guidance.md`  
**Purpose:** Architecture, inspection checklist, and implementation guide for building an independent or compatible Live Run Dashboard server.  
**Audience:** Engineers, autonomous agents, and systems re-implementing or integrating a dashboard service for the RSTACK SDLC engine.  
**Related Documents:**
- [01 — Product and UX](01-product-and-ux.md)
- [02 — Architecture and Read Model](02-architecture-and-read-model.md)
- [03 — Builder Plan and Acceptance](03-builder-plan-and-acceptance.md)
- [04 — Engine Findings, Reference Research, and Decisions](04-engine-findings-research-and-decisions.md)

---

## 1. Executive Summary & Core Invariants

The RSTACK Live Dashboard is a **strictly read-only projection and visualization service**. It observes engine artifacts on disk, projects them into a structured human-facing timeline and stage graph, streams updates via Server-Sent Events (SSE), and produces self-contained static HTML reports.

When designing or implementing a server to replicate this capability, adhere to these fundamental invariants:

1. **Read-Only Non-Interference:**
   The dashboard server **never** acquires execution locks, writes to run directories, commits journal events, modifies `state.json`, or dispatches tasks.
2. **Authority Resides in `journal.jsonl`:**
   `state.json` is merely a derived snapshot written by the engine as an advisory cache. The sole authoritative source of truth for any run is `.rstack/runs/<run-id>/journal.jsonl`.
3. **No Fabrication of Non-Recorded Metadata:**
   The RSTACK engine records event commit timestamps and configured profile aliases. It does **not** record token counts, inference costs, or effective host models. The server must never infer or fabricate metrics that are not backed by cryptographic artifacts or journal events.
4. **Zero Third-Party Runtime Dependencies:**
   The server and its web frontend run entirely on standard Node.js primitives (`node:http`, `node:fs`, `node:crypto`) and standard vanilla ES modules. No heavy web frameworks, bundlers, or remote CDN dependencies are allowed.
5. **Strict Local Isolation:**
   The server binds exclusively to `127.0.0.1`, validates `Host` and `Origin` headers, enforces token-authenticated sessions, and implements a strict Content Security Policy (CSP).

---

## 2. Where to Look: Codebase and Filesystem Map

To understand how the system functions, analyze the following files and directories in order:

### 2.1 Engine Authority & Contracts (`rstack-sdlc/core/`)

| File Path | What to Analyze |
|---|---|
| [`core/engine/journal.ts`](../../core/engine/journal.ts) | **Journal framing and integrity:** Inspect line format (`<sha256> <payload>\n`), sequential validation (`seq == line`), and incomplete tail handling. |
| [`core/engine/state.ts`](../../core/engine/state.ts) | **Pure event replay:** See how `applyEvent` evolves state and validates transition invariants. |
| [`core/contracts/records.ts`](../../core/contracts/records.ts) | **Event schemas:** Review the 10 authoritative event types: `run_started`, `task_dispatched`, `result_accepted`, `attempt_failed`, `brief_rendered`, `decision_recorded`, `verification_recorded`, `verification_invalidated`, `pr_review_packet_recorded`, and `proposal_recorded`. |
| [`core/policies/workflow.ts`](../../core/policies/workflow.ts) | **Workflow definitions:** Study the stage graph, role transitions, human wait triggers (`WAITING_HUMAN`), and valid decision actions. |
| [`core/engine/lock.ts`](../../core/engine/lock.ts) | **Lock file format:** Understand how to read (never write) the lock metadata (`{token, pid, host, acquired_at}`). |

### 2.2 On-Disk Workspace Layout (`<workspace>/.rstack/`)

Any dashboard server must parse the following on-disk structure:

```text
<workspace>/
└── .rstack/
    ├── dashboard/
    │   └── instance.json          <-- Dashboard server metadata (pid, port, token)
    ├── reports/
    │   └── <run-id>/
    │       ├── report.html        <-- Standalone self-contained HTML report
    │       └── report.json        <-- Projected RunView JSON export
    └── runs/
        └── <run-id>/
            ├── journal.jsonl      <-- SOLE AUTHORITY: Checksummed event log
            ├── state.json         <-- Engine snapshot (advisory only)
            ├── lock               <-- Engine lock file (inspect only)
            ├── artifacts/         <-- Content-addressed immutable files
            │   └── <sha256>       <-- Workflows, profiles, diffs, specs
            ├── brief/
            │   └── round-<N>.html <-- Rendered human audit briefs
            ├── work/
            │   └── <attempt-id>/  <-- Attempt workspaces (inputs/outputs)
            └── proposal/
                └── pr-proposal.json
```

### 2.3 Dashboard Reference Implementation (`rstack-sdlc/`)

| Subsystem | Key Files | Purpose |
|---|---|---|
| **Read Model** | [`core/read-model/contracts.ts`](../../core/read-model/contracts.ts)<br>[`core/read-model/workflow-def.ts`](../../core/read-model/workflow-def.ts)<br>[`core/read-model/project-run.ts`](../../core/read-model/project-run.ts)<br>[`core/read-model/read-run.ts`](../../core/read-model/read-run.ts)<br>[`core/read-model/list-runs.ts`](../../core/read-model/list-runs.ts) | Types, schema validation, definition parser, pure projection logic, disk reading, and run listing. |
| **Static Report** | [`core/read-model/report-html.ts`](../../core/read-model/report-html.ts)<br>[`dashboard/report-writer.ts`](../../dashboard/report-writer.ts) | Standalone single-file HTML generation with embedded CSS/SVG and atomic disk write. |
| **Server & Watcher** | [`dashboard/server.ts`](../../dashboard/server.ts)<br>[`dashboard/watch.ts`](../../dashboard/watch.ts)<br>[`dashboard/lifecycle.ts`](../../dashboard/lifecycle.ts)<br>[`dashboard/main.ts`](../../dashboard/main.ts) | HTTP routes, SSE streaming, file-system change observation, process discovery/spawn, and daemon entry point. |
| **Frontend Web UI** (Mission Control, see [06](06-mission-control-redesign.md)) | [`dashboard/web/index.html`](../../dashboard/web/index.html)<br>[`dashboard/web/app.css`](../../dashboard/web/app.css)<br>[`dashboard/web/app.js`](../../dashboard/web/app.js)<br>[`dashboard/web/live.js`](../../dashboard/web/live.js)<br>[`dashboard/web/flow.js`](../../dashboard/web/flow.js)<br>[`dashboard/web/lanes.js`](../../dashboard/web/lanes.js)<br>[`dashboard/web/feed.js`](../../dashboard/web/feed.js)<br>[`dashboard/web/motion.js`](../../dashboard/web/motion.js)<br>[`dashboard/web/derive.js`](../../dashboard/web/derive.js)<br>[`dashboard/web/clock.js`](../../dashboard/web/clock.js)<br>[`dashboard/web/alerts.js`](../../dashboard/web/alerts.js)<br>[`dashboard/web/dom.js`](../../dashboard/web/dom.js)<br>[`dashboard/web/views.js`](../../dashboard/web/views.js) | HTML skeleton and design tokens (dark and light); `app.js`: SSE client, routing (Live / Inspect), header, full screen; `live.js`: the Live view, patched in place; `flow.js`: pipeline cards, wires and hand-off packet; `lanes.js`: who held the work; `feed.js`: journal feed; `motion.js`: honest-motion cues, each played once per committed event; `derive.js`: durations, vitals, swimlane segments; `clock.js`: elapsed clocks; `alerts.js`: tab title and icon; `dom.js`: in-place patch helpers; `views.js`: Inspect panels and tabs. |

---

## 3. What to Analyze: Key Architectural Concepts

### 3.1 Replay Projection vs. Snapshot Reading

Do **not** rely solely on `state.json`. `state.json` might be missing during initial run creation, stale if a crash occurred mid-transaction, or incomplete. 
A compliant server implementation must:
1. Read `.rstack/runs/<run-id>/journal.jsonl`.
2. Parse each line: verify `<sha256> <payload>`, check sequential monotonicity (`seq === line_number`).
3. Load the **retained workflow definition** from `artifacts/<workflow_ref>`.
   - *Why?* Older runs might have run under workflow `v5`, while current engine source is `v6`. Replaying against the engine's hardcoded workflow will fail on historical runs! Always project using the workflow definition stored in the run's own artifacts.
4. Execute a pure projection function (`projectRun`) that iterates through events in order and builds a `RunView`.

### 3.2 Status and Directives Taxonomy

The engine state machine emits specific directives that the dashboard must translate:

| Phase / Directive | Engine Semantics | Dashboard Representation |
|---|---|---|
| `ACTIVE` / `CONTINUE` | Worker task is in-flight or next stage pending | Active spinner on current stage; progress indicator; latest dispatched attempt details. |
| `WAITING_HUMAN` / `WAIT` | Engine paused waiting for human intervention | **High-contrast action banner** (`role="status"`). Displays round, allowed actions (`proceed`, `amend`, `pause`, `reject`), and iframe link to `brief/round-<N>.html`. |
| `DONE` | Run completed | Success/terminal badge. Displays final proposal link, publication status, and verification summary. |
| `BLOCKED` | Run halted due to policy or verification failure | **Absorbing terminal state** (cannot transition). Prominently displays blocker code (e.g. `NEGATIVE_RESULT`, `REVIEW_REJECTED`, `VERIFICATION_FAILED`). |

### 3.3 Security & Boundary Model

If implementing an HTTP server:
- **Loopback Only:** Bind strictly to `127.0.0.1` (never `0.0.0.0`).
- **Host Header Verification:** Reject requests unless `Host` matches `127.0.0.1:<port>` or `localhost:<port>`.
- **Origin Header Check:** For state-changing or API routes, reject any `Origin` header that does not match the server's own origin.
- **Authentication Handshake:**
  - Generate a cryptographic token (e.g., 32 hex chars) on server startup.
  - The CLI outputs `http://127.0.0.1:<port>/?t=<token>`.
  - When accessed, the server sets a `SameSite=Strict; HttpOnly; Path=/` cookie and redirects to `/`.
  - All subsequent `/api/*` routes require either this session cookie or `Authorization: Bearer <token>`.
- **Content Security Policy (CSP):**
  ```text
  default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'
  ```
- **Brief Sandboxing:** Audit briefs (`brief/round-N.html`) authored by agent workers must be rendered inside `<iframe sandbox>` to prevent script execution in the dashboard context.
- **Artifact Re-verification:** When serving artifacts (`/api/v1/runs/:id/artifacts/:sha`), hash the requested file and confirm `hash === sha256` before streaming.

---

## 4. Server Implementation Blueprint

A clean reimplementation of the dashboard server consists of five modular layers:

```
┌────────────────────────────────────────────────────────┐
│                   Web Browser UI                       │
│    (Vanilla JS, CSS Tokens, SVG Graph, SSE Client)     │
└───────────────▲────────────────────────▲───────────────┘
                │ GET /                  │ GET /api/v1/events
┌───────────────┴────────────────────────┴───────────────┐
│              HTTP & SSE Server Layer                   │
│        (Node http, Auth, Security Headers, CSP)        │
└───────────────▲────────────────────────▲───────────────┘
                │ Query                  │ Push invalidations
┌───────────────┴────────────────────────┴───────────────┐
│             File Watcher & Cache Layer                 │
│         (Debounced fs watcher on .rstack/runs/)        │
└───────────────▲────────────────────────────────────────┘
                │ Read
┌───────────────┴────────────────────────────────────────┐
│               Pure Projection Engine                   │
│     (Read journal.jsonl -> Replay -> Project RunView)  │
└────────────────────────────────────────────────────────┘
```

### Layer 1: The Read Model (`core/read-model/`)
- `listRuns(runsRoot)`: Scans `.rstack/runs/`, verifies IDs match `^RUN-[A-Za-z0-9_-]+$`, reads state/journal head to return lightweight summaries.
- `readRun(runsRoot, runId)`: Reads `journal.jsonl`, reads retained `workflow_ref` artifact, passes events to pure projector.
- `projectRun({ events, workflow, profile })`: Computes:
  - Stages status (`PENDING`, `IN_FLIGHT`, `ACCEPTED`, `FAILED`, `BLOCKED`, `SKIPPED`).
  - Active attempt and attempt history (duration, exit codes, test summaries).
  - Chronological timeline with human-friendly descriptions.
  - Human action requirements and open questions.

### Layer 2: Real-Time File Watching (`dashboard/watch.ts`)
- Use `fs.watch` on the runs directory.
- Debounce rapid file touches (e.g. 100ms) to avoid intermediate read locks.
- Broadcast SSE messages when journal files change:
  ```json
  event: run_updated
  data: {"run_id": "RUN-20261011...", "seq": 14, "phase": "ACTIVE", "stage": "implement"}
  ```

### Layer 3: Server HTTP API (`dashboard/server.ts`)
Implement these minimal REST endpoints:

- `GET /` — Serves static index HTML (or sets auth cookie if `?t=<token>` is present).
- `GET /api/v1/health` — Returns `{ status: "ok", workspace, pid }` (requires token).
- `GET /api/v1/runs` — Returns array of `RunSummary` (each with `stage_states`, one entry per stage in stage-graph order, for the run list's mini pipeline strip).
- `GET /api/v1/runs/:id` — Returns full `RunView` JSON.
- `GET /api/v1/runs/:id/brief/:round` — Serves round brief HTML under sandboxed headers.
- `GET /api/v1/runs/:id/artifacts/:sha` — Serves content-addressed artifact with verification.
- `GET /api/v1/events` — Server-Sent Events stream for real-time reactivity.
- `POST /api/v1/shutdown` — Graceful shutdown trigger (requires token).

### Layer 4: Lifecycle & Daemon Management (`dashboard/lifecycle.ts`)
- Store metadata at `.rstack/dashboard/instance.json`:
  ```json
  {
    "schema_version": 1,
    "pid": 12345,
    "host": "127.0.0.1",
    "port": 49152,
    "token": "a1b2c3d4...",
    "workspace": "/path/to/workspace",
    "started_at": "2026-10-11T12:00:00.000Z"
  }
  ```
- Before launching, inspect `instance.json`. If PID is active and responds to `GET /api/v1/health` with matching token and workspace, reuse the server.
- If dead or corrupted, overwrite cleanly.
- Support auto-termination after inactivity (e.g. 24 hours without connected clients).

### Layer 5: Static HTML Report Generator (`core/read-model/report-html.ts`)
- When a run reaches `DONE` or `BLOCKED`, automatically generate a standalone `.rstack/reports/<run-id>/report.html`.
- Must contain:
  - All styling embedded in a `<style>` tag (supporting `prefers-color-scheme: dark`).
  - Zero external resources (no external web fonts, CDNs, or scripts).
  - SVG stage progression graph.
  - Complete evidence tables (tests executed, reviews conducted, artifacts generated).
  - Strict escaping of all record strings to prevent stored XSS.

---

## 5. Verification & Testing Checklist

When validating your server implementation, verify against these scenarios:

1. **Host Header Poisoning & Rebinding:**
   `curl -H "Host: evil.com" http://127.0.0.1:<port>/` must return HTTP `400 Bad Request`.
2. **Missing Token Protection:**
   Direct curl to `/api/v1/runs` without cookie or Bearer token must return HTTP `401 Unauthorized`.
3. **Historical Workflow Replay:**
   Ensure runs generated with earlier workflow versions replay cleanly using their own retained workflow definition artifact.
4. **Concurrent Engine Writes (Windows File Locks):**
   When the engine commits an event and performs atomic renames (`state.json.tmp -> state.json`), your reader must handle transient file access errors gracefully using exponential backoff or retry loops.
5. **Hostile Payload Escaping:**
   Feed mock records containing `<script>alert(1)</script>` or malicious markdown into inputs, intents, or briefs. Verify that output in both the web UI and static reports is strictly escaped text.
6. **No Phantom Metrics:**
   Verify the UI explicitly marks token counts and effective models as unobserved rather than displaying placeholder estimates.

---

## 6. Summary Reference File Map

```text
rstack-sdlc/
├── core/
│   ├── contracts/
│   │   └── records.ts           # Authoritative event schemas
│   ├── engine/
│   │   ├── journal.ts           # Journal parser & checksum logic
│   │   └── state.ts             # Pure event replay reducer
│   └── read-model/
│       ├── contracts.ts         # RunView and projection types
│       ├── project-run.ts       # Pure projector function
│       ├── read-run.ts          # Run directory reader
│       ├── workflow-def.ts      # Retained definition parser
│       └── report-html.ts       # Self-contained HTML report renderer
└── dashboard/
    ├── lifecycle.ts             # Instance file & daemon lifecycle
    ├── server.ts                # HTTP & SSE endpoints
    ├── watch.ts                 # Real-time directory watcher
    └── web/                     # Static UI assets (HTML/CSS/JS)
```
