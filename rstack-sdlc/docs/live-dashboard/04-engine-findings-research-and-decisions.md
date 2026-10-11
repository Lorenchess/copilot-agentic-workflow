# RSTACK Live Dashboard — engine findings, reference research, and design decisions

**Date:** 2026-10-11. **Author:** Fable (BUILD-02), building directly per the project decision record.
**Baseline:** `main` at `c97506d992f5635d10b43876d4d4e938635ffda0` (origin/main, fast-forwarded 2026-10-11), branch `feat/rstack-sdlc-live-dashboard`.
**Status:** implementation record for the owner's 2026-10-11 brief ("Build the Live Pipeline Dashboard"). It extends [01](01-product-and-ux.md), [02](02-architecture-and-read-model.md) and [03](03-builder-plan-and-acceptance.md) with the two newly authorized requirements: automatic dashboard start on `start`, and automatic terminal HTML report generation. Nothing here is host evidence; `COPILOT_VALIDATED` stays NO.

This document has three parts: what the engine actually does (section 1, labelled CONFIRMED / INFERRED / UNVERIFIED), what the reference dashboards do (section 2, with links and fetch dates), and the decisions taken for this implementation (section 3) with the file plan (section 4).

---

## 1. Engine findings

Labels: **CONFIRMED** = read in the source at the baseline revision, with the file named. **INFERRED** = follows from the source but was not exercised by a test written for this document. **UNVERIFIED** = not establishable offline.

### 1.1 What happens when a run starts

- CONFIRMED (`scripts/rstack.ts`, `scripts/assembly.ts`, `core/engine/engine.ts` `start`): `rstack.ts start` resolves the workspace, wires the local request source, local proposal sink and the Node test executor, then `engine.start` measures the application tree, parses the profile, retains source/profile/workflow definition/base tree/app config (and the PR review procedure for workflow v6) as content-addressed artifacts under `.rstack/runs/<run-id>/artifacts/<sha256>`, and commits one `run_started` event. The run id is `RUN-<UTC stamp>-<8 hex>` unless given.
- CONFIRMED: `start` prints exactly one JSON reply on stdout and exits 0 or 2. Usage errors go to stderr with exit 1. Each command is a separate short-lived process; there is no long-running engine process.
- CONFIRMED (`engine.ts` lines 873-875): the workflow definition is retained as `canonicalJson(workflow)` under `workflow_ref`. A reader can therefore load the exact definition a run was started under without the engine version that started it.
- CONFIRMED: the application directory path is **not** recorded. `run_started` carries `base_ref` (a tree manifest), `app_config_ref`, and `source_provenance.locator` which is `file:<basename>` or `manual-text`. The only application label available from evidence is the `name` field of a `package.json` inside the retained base tree, if present.

### 1.2 How transitions are recorded

- CONFIRMED (`core/engine/journal.ts`): `journal.jsonl` is the single authority. Each line is `<sha256 of payload> <payload>\n`. A record is committed when its newline is written and fsync returned. Reading validates framing, checksum, schema, sequence (`seq` must equal the line number) and run id, and throws `JOURNAL_CORRUPT` (or `UNSUPPORTED_SCHEMA_VERSION`) on the first bad record; bytes after the last newline are an incomplete tail, reported separately and only removed by a locked writer (`quarantineTail`).
- CONFIRMED (`core/engine/state.ts`): state is pure replay: `applyEvent(prev, event, workflow)` clones and validates; `replay(events, workflow)` returns the state after the last event. `state.version` equals the last `seq`. `state.json` is a derived snapshot (`writeSnapshot`), checked by `status` as CURRENT / STALE / INVALID / MISSING; it is never read as authority.
- CONFIRMED (`core/contracts/records.ts` EVENT_TYPES): ten event types: `run_started`, `task_dispatched`, `result_accepted`, `attempt_failed`, `brief_rendered`, `decision_recorded`, `verification_recorded`, `verification_invalidated`, `pr_review_packet_recorded`, `proposal_recorded`. Every event has `at` (ISO 8601 from the engine's clock) and `data`.
- CONFIRMED (`engine.ts` `commit`): an event is validated by `applyEvent` against the current state before it is appended, so a committed journal replays without error under the same definition.

### 1.3 How a role is dispatched and its result accepted

- CONFIRMED (`engine.ts` `next`): at a role stage with no pending attempt, `next` reads every input by identity, creates the attempt lane `work/<attempt-id>/` (and the application copy for stages with `app_copy`), commits `task_dispatched` (`attempt_id = <stage>-<n>`, `step_id`, `role`, `inputs`, `input_digest`) and replies `DISPATCHED` with `dispatch: GRANTED`. Any later `next` while the attempt is pending replies `PENDING_IN_FLIGHT` / `IN_FLIGHT`.
- CONFIRMED (`engine.ts` `submit`): a result is accepted only for the pending attempt, at the dispatched version, with the dispatched role and input digest; its files are read with containment checks and validated against their contracts; stages `proof`, `implement`, `pr-review` additionally measure the attempt's application copy. Acceptance commits `result_accepted` with `result_ref`, `outcome`, `subjects` (the produced record identities), `evidence_class`, `open_decisions`, and `review_verdict` or `pr_review_verdict` where applicable. Refusals are retained under `rejected/` and are **not** journal events.
- CONFIRMED: a transport failure or an explicit `abandon` commits `attempt_failed` with `kind` in `TIMEOUT | REFUSED | MALFORMED_REPLY | TRANSPORT_ERROR | EXECUTION_UNCERTAIN | RESULT_REJECTED`. Retry budget: `entry_failures` since the stage was entered against `max_attempts[role]` from the profile; exhaustion blocks with `ATTEMPTS_EXHAUSTED`.
- CONFIRMED: the journal does not record who or what executed an attempt, when execution began or ended, which model ran, or any token or cost figure. `dispatched_at` and `settled_at` are the commit times of `task_dispatched` and the settling event; the interval includes Coordinator and human latency.

### 1.4 Where authoritative events live, and the run directory

- CONFIRMED (`engine.ts`, `install.ts`): runs live under `<workspace>/.rstack/runs/<run-id>/` with `journal.jsonl`, `state.json`, `lock` (JSON holder: token, pid, host, acquired_at), `artifacts/<sha256>`, `work/<attempt>/`, `brief/round-N.html`, `exec/<label>/`, `rejected/`, `proposal/pr-proposal.json`, `journal-tail/`, `abandoned-locks/`. Evaluations write `evaluation/<id>/` beside them.
- CONFIRMED (`core/engine/tree.ts`): `.rstack` is never part of a measured application tree, and `install.ts` never touches it. A derived-report area under `.rstack/reports/` and an instance file under `.rstack/dashboard/` therefore conflict with no package or evidence contract.

### 1.5 Human decisions and blocking conditions

- CONFIRMED (`engine.ts` `directiveOf`): the directive is one of `CONTINUE {pending}`, `WAIT {awaiting, paused, round, subjects, allowed_actions, expected_version, read}`, `DONE {terminal, publication_status: NOT_ATTEMPTED, evidence_class, candidate_verification, authorization, proposal}`, `BLOCKED {blocker, detail, pr_review?}`. `WAIT.read` is `brief/round-N.html` for a plan decision and `artifacts/<intent>` for a product question.
- CONFIRMED (`core/policies/workflow.ts` `allowedActions`): a product question allows `answer | reject`; a plan decision allows `proceed, amend, [second-audit], pause, reject`, with `second-audit` only in round 1 while the audit budget allows.
- CONFIRMED (`state.ts`): `decision_recorded` carries `decision_id, action, subjects, recorded_by, provenance (SCRIPTED | HUMAN_RECORDED | UNKNOWN)` and, for `proceed`/`amend`, `final_plan_ref` and `plan_status`. `pause` leaves the run waiting with `paused: true`; `reject` ends it `DONE / REJECTED`.
- CONFIRMED: blockers are `NEGATIVE_RESULT`, `UNRESOLVED_PRODUCT_DECISIONS`, `REVIEW_REJECTED`, `REVIEW_INCONCLUSIVE`, `PR_REVIEW_CHANGES_REQUESTED`, `PR_REVIEW_INCONCLUSIVE`, `VERIFICATION_FAILED`, `WORKER_QUIESCENCE_UNPROVEN`, `ATTEMPTS_EXHAUSTED`. **`BLOCKED` is absorbing**: no event type is accepted in phase `BLOCKED` (`task_dispatched` needs `ACTIVE`, `decision_recorded` needs `WAITING_HUMAN`, every deterministic event needs `ACTIVE`). A blocked run is therefore final evidence, like `DONE`.

### 1.6 Runtime metadata and timestamps actually available

| Fact | Available? | Source |
|---|---|---|
| Event commit time | yes | `event.at` |
| Run start, last committed time | yes | first and last `event.at` |
| Attempt dispatched / settled time | yes | `task_dispatched.at`, `result_accepted.at` or `attempt_failed.at` |
| Configured model per role | yes | retained profile (`profile_ref`): `roles[role].model_alias` → `catalog[alias].owner_label`, `selector_status` |
| Effective host model | **no** | nowhere in the run records; `selector_status` is `requires-host-observation` in `trial-v2.json` |
| Tokens, cost, model duration | **no** | nowhere |
| Test execution duration, exit code, per-test outcomes | yes | retained `execution` records (`duration_ms`, `exit_code`, `tests[]`, `classification`) |
| Who recorded a decision | a label only | `recorded_by` (unauthenticated), `provenance` |
| Lock holder | yes, observe only | `lock` file |

### 1.7 Completion and failure

- CONFIRMED: `PR_PROPOSAL_READY` is set by `proposal_recorded` after an approving PR review of the packet in force; the proposal file is `proposal/pr-proposal.json`, `publication_status` is always `NOT_ATTEMPTED`. `REJECTED` is set by a human `reject`. Neither means a remote pull request exists.
- CONFIRMED: there is no "run failed" event; a run that cannot proceed is `BLOCKED` with a code.

### 1.8 Mechanisms that can start a companion process

- CONFIRMED: every engine command is a separate `node scripts/rstack.ts <command>` invocation (the installed Coordinator runs it in the terminal with absolute paths filled at install time). A companion server cannot live inside that process; it has to be a detached child that outlives it.
- CONFIRMED (Node 24, `child_process.spawn` with `detached: true`, `stdio: 'ignore'`, `windowsHide: true`, then `unref()`): standard, documented, works on Windows and POSIX. No other launcher exists in the engine.
- CONFIRMED (`tests/support/deny-network.ts`): the network-denial test preload patches `net.Socket.prototype.connect`, `dns.lookup` and `fetch`; importing `node:http` is not denied. A dashboard launcher must never let a failed connect reach the engine reply.

### 1.9 How the installed Coordinator interacts with the engine

- CONFIRMED (`adapters/copilot-vscode/coordinator.md`): the Coordinator runs `start`, `next`, `submit`, `decide`, `resume`, `abandon`, `status` in the terminal and acts only on the JSON reply. It keeps `run_id` from the `start` reply. Its text is 998 words against a budget of under 1000 (`tests/package.test.ts`), so it is **not** changed by this work; the dashboard URL travels in the `start` reply's new `dashboard` field and is printed as one line on stderr. Whether the Coordinator relays that field to the human is a host behaviour: UNVERIFIED.
- CONFIRMED (`adapters/copilot-vscode/generate.ts` `runtimeSources`): the package ships the `.ts` files reachable by static import from `scripts/rstack.ts` and `scripts/install-package.ts`, plus `package.json` and the profile. Anything the dashboard needs in an installed workspace must be reachable that way or added to the generator explicitly.

### 1.10 Extending without a second workflow authority

- CONFIRMED: `applyEvent`/`replay` are pure and take the workflow definition as a parameter; `readJournal` is a pure read. A read model can replay the retained definition and never calls `start/next/submit/decide/resume/abandon`.
- INFERRED: replaying a workflow-version-5 journal (the twelve runs in this checkout's `.rstack/runs/` are v5) with its retained definition through the current `applyEvent` succeeds, because every v6-only check is conditional on the stage existing in the definition. This is exercised by the read-model tests on those local runs; a replay that throws is shown as unsupported, never reinterpreted.
- UNVERIFIED: anything about how VS Code or Copilot shows, hides, or runs the installed agents; whether a subagent received only its envelope; which model ran. The dashboard shows `Not observed` for all of it.

---

## 2. Reference research (fetched 2026-10-11)

Full notes with per-page observations are condensed here; every claim below is from the named page unless marked "not covered", which means the page did not say it.

| Reference | URL(s) | Patterns adopted / adapted | Rejected |
|---|---|---|---|
| GitHub Actions | docs.github.com/en/actions/how-tos/monitor-workflows/use-the-visualization-graph; …/use-workflow-run-logs; …/deploy/configure-and-manage-deployments/review-deployments | Job node with status icon and dependency lines; clicking a node opens its detail; failed step auto-expanded; per-step durations; permalink to a line; review-deployments approval shown as a card with approver and comment. Icon vocabulary and theming: not covered | Icon-only status; approve/reject buttons |
| Temporal | docs.temporal.io/workflow-execution/event; /web-ui; /workflow-execution; /encyclopedia/retry-policies | Append-only Event History as the only truth; History tab with Timeline / All / Compact / JSON views and a download; header strip (start, close, duration, id, type); explicit Open vs Closed status split; "attempt count is not in history, ask Describe" → say what the log cannot say | Signal / reset / terminate actions |
| Argo Workflows | argo-workflows.readthedocs.io/en/latest/argo-server/; /workflow-concepts/; /walk-through/suspending/; /intermediate-inputs/; /retries/; /widgets/ | Human wait as a first-class node that halts scheduling (`suspend`); localhost-only exposure (port-forward), rate limits, frame-denying headers. Node colours are documented only by third parties and are not relied on | Colour as the only encoding; UI resume forms |
| LangSmith | docs.langchain.com/langsmith/observability; /observability-concepts; /view-traces | Run → trace → thread hierarchy; layered views (narrative / per-turn cards / details); verbose blocks collapsed by default; repeated calls grouped; single-key view shortcuts; display choices persisted locally | Any "thinking" or token-stream metaphor |
| OpenTelemetry | opentelemetry.io/docs/concepts/signals/traces/ | Attempt = span-like (start event, end event, outcome); three-valued outcome Unset / Error / Ok, so a missing end is never success; links for branches; durations only when both endpoints exist | OTel as a dependency or exporter |
| Grafana | grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/ | One question per screen; drill-down hierarchy; restrained refresh with a "last updated" time; URL parameters for view state | Colour thresholds as the only signal; stacked graphs |
| WCAG 2.2 and MDN | w3.org/WAI/standards-guidelines/wcag/new-in-22/; WCAG22/Understanding/status-messages, use-of-color, pause-stop-hide; developer.mozilla.org …/@media/prefers-color-scheme, …/prefers-reduced-motion | 2.4.11 focus not obscured by sticky headers; 2.5.8 targets ≥ 24 px; 4.1.3 `role=status` / `role=alert` with `aria-atomic`; 1.4.1 colour never alone; 2.2.2 a visible "Pause live updates" control; dark overrides under `prefers-color-scheme` with an explicit user override; reduced motion replaces motion with an opacity change | Drag-only interactions; animated activity indicators |
| Local-server security | modelcontextprotocol.io/specification/2025-06-18/basic/transports (Security Warning); nodejs.org/docs/latest/api/http.html | Bind 127.0.0.1 only; validate `Host` and `Origin` on every route including the event stream; explicit `requestTimeout`, `headersTimeout`, `keepAliveTimeout`, `maxHeadersCount`; GET-only. The OWASP DNS-rebinding page returned 404; Host-allowlist practice comes from secondary sources | — |

Two things the references did **not** supply and which are therefore this design's own: a prominent visual treatment for a human wait (no fetched page documents one), and a legend for in-flight retries (Temporal states the history under-reports them). The research assistant suggested omitting an access token for v1; that suggestion is **not** followed, because [02 §11](02-architecture-and-read-model.md) and the brief require protection against unauthorized local clients beyond origin checks.

---

## 3. Decisions

### D-DASH-1 Source of truth and projector

One pure projector, `core/read-model/project-run.ts`, maps `{events, tail bytes, retained workflow definition, retained records}` to a versioned `RunView` (`schema_version: 1`, `record_type: 'dashboard-run-view'`). It calls `replay` from `core/engine/state.ts` with the **retained** definition parsed by `core/read-model/workflow-def.ts`, never the engine's compiled `WORKFLOW`. It is deterministic: the same inputs give byte-identical `canonicalJson` output and the same `view_digest`. The same projector feeds the live API, historical inspection, and the HTML report (`core/read-model/report-html.ts` renders a `RunView`). Filesystem access is confined to `core/read-model/read-run.ts` (read-only: `readJournal`, artifact reads with identity re-check, lock observation) and `list-runs.ts`.

Source statuses: `CURRENT`, `INCOMPLETE_TAIL` (validated events plus a diagnostic; the tail is never shown as an event), `CORRUPT` (code and record number; last valid state is not shown as current), `UNSUPPORTED_WORKFLOW` (definition missing or unparseable, or replay refused), `NOT_INITIALIZED`, `UNREADABLE`. Execution profile label: `STANDARD` when the retained workflow id is `local-request-to-proposal`; any other id is shown by its raw id and version, never as Express.

### D-DASH-2 Stage states

`NOT_REACHED`, `CURRENT_IDLE` (engine at the stage, no pending attempt), `DISPATCHED_AWAITING_RESULT`, `WAITING_HUMAN`, `COMPLETED`, `FAILED_ATTEMPT` (a failure since entry, stage still current), `BLOCKED`, `DONE_TERMINAL`, `NOT_TAKEN` (optional branch never entered), `INVALIDATED` (a deterministic stage whose record was dropped by `verification_invalidated`). Repeated audit rounds and retries are attempts on the same stage id. A pending attempt is always labelled "dispatched, awaiting result"; the UI never shows a running indicator.

### D-DASH-3 Transport: SSE with heartbeat, polling as fallback

Evaluated: bounded polling (simple, but every client re-fetches the run list on a timer and the "last updated" signal is the poll itself) versus Server-Sent Events (one open GET, automatic reconnection with `Last-Event-ID`, native in every browser, no extra dependency, server-to-browser only). Chosen: SSE on `GET /api/v1/events`. The server polls the runs root (file size and mtime of each journal, every 1 s, plus `fs.watch` as a wake-up hint where available) and emits `run-changed {run_id, journal_version, view_digest}` with a monotonically increasing event id; a comment heartbeat every 10 s. The client fetches the changed run's view, deduplicates by `journal_version` and `view_digest`, shows **Live**, **Reconnecting**, **Disconnected** and **Stale** (no heartbeat for 30 s) states, and falls back to polling `GET /api/v1/runs` every 5 s after three failed reconnects. A bounded ring buffer of 500 events supports catch-up; an older `Last-Event-ID` gets a `resync` event. SSE is a transport; the journal version is the authority.

### D-DASH-4 Lifecycle: detached server, instance file, reuse

- `rstack.ts start`, after `STARTED`, calls `ensureDashboard(workspace)` unless `RSTACK_DASHBOARD=off` or `--no-dashboard` is given. `status`, `next`, `submit`, `decide`, `resume`, `abandon` never start it.
- Instance metadata: `<workspace>/.rstack/dashboard/instance.json` `{schema_version: 1, pid, host: '127.0.0.1', port, token, workspace, runs_root, started_at, node, package_root}`; written atomically by the server after it listens. Reuse: the file exists, the pid is alive on this host, and `GET /api/v1/health` with the token answers with the same workspace and token. Otherwise the file is stale and is replaced. Two different workspaces have two files and two servers; the health check compares the workspace path, so a server for another workspace is never adopted.
- Start: `spawn(process.execPath, [<package>/dashboard/main.ts, '--workspace', ws], {detached: true, stdio: 'ignore', windowsHide: true})`; the launcher waits up to 4 s for a live instance file. Port: `--dashboard-port` or `RSTACK_DASHBOARD_PORT`, otherwise 0 (the OS picks a free loopback port). A configured port in use gives `UNAVAILABLE / EADDRINUSE`; no process is ever killed or taken over.
- The `start` reply gains `dashboard: {status: STARTED | REUSED | DISABLED | UNAVAILABLE, url, run_url, instance_file, detail}`; the reply's `ok` and the exit code remain the engine's. One stderr line shows the URL.
- Stop: `rstack.ts dashboard stop --workspace <dir>` sends the server `POST /api/v1/shutdown` with the token (the only non-GET route, it only stops the server), or the human closes it; `dashboard status` reports liveness. The server exits on its own after 24 h idle with no client and no run change. Crashes leave a stale instance file that the next `start` replaces.
- Headless mode: `RSTACK_DASHBOARD=off`; the test harness sets it by default so the suite never spawns servers.

### D-DASH-5 Security of the local interface

Loopback bind only (`127.0.0.1`); `Host` must be `127.0.0.1[:port]` or `localhost[:port]`, else 400; a present `Origin` must be the server's own origin, else 403; the browser gets an `HttpOnly; SameSite=Strict; Path=/` cookie by opening the printed `/?t=<token>` once (the server redirects to a clean URL), every `/api/` route requires that cookie or `Authorization: Bearer`; GET only (405 otherwise, except the token-protected shutdown); CSP `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'self'` with `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`; run ids checked against `ID_PATTERN` and artifact identities against `^[0-9a-f]{64}$`; every served file is re-hashed and refused when it does not match its name or its retained identity; the brief is served under a sandboxing CSP in an `<iframe sandbox>`; artifacts above 256 KiB are refused; no directory listing, no path parameter, no environment disclosure; explicit `requestTimeout 30 s`, `headersTimeout 10 s`, `keepAliveTimeout 5 s`, `maxHeadersCount 100`, at most 16 concurrent event streams.

### D-DASH-6 Terminal report

`core/read-model/report-html.ts` renders one standalone page from a `RunView` (and the records already loaded for it): inline CSS with light and dark themes (system preference and a no-script `data-theme` toggle via a small inline script allowed only by the report's own CSP `script-src 'unsafe-inline'`-free design: the toggle is a CSS-only `:has()` checkbox), no remote asset, every value escaped, bounded (timeline capped at 2,000 entries, paths at 200, with the omission stated), provenance block naming journal version, workflow and profile identities, evidence classes, and what was **not** observed. Output is deterministic: no generation timestamp in the page; `.rstack/reports/<run-id>/report.html` plus `report.json` (the `RunView`) written atomically (temp file and rename). Generated when `next` or `decide` returns `DONE` or `BLOCKED`, by the dashboard server when it observes a terminal run, and on demand by `rstack.ts report --workspace <dir> --run <id>`. Generation never touches the run directory and never changes the engine reply or exit code. The final outcome is one of `LOCAL_PR_PROPOSAL_PREPARED`, `REJECTED`, `BLOCKED`; `PR_CREATED` cannot be produced by this code.

### D-DASH-7 Frontend stack and visual architecture

Plain HTML, CSS and ES modules served by the Node server, no framework, no build step, no runtime dependency (the architecture test forbids third-party runtime packages). Design tokens on `:root` (`--bg`, `--surface`, `--line`, `--text`, status tokens `--ok`, `--warn`, `--danger`, `--info`, `--human`), dark overrides under `prefers-color-scheme: dark` and under `[data-theme=dark]`; theme choice persisted in `localStorage` only. Layout: persistent header; left run navigation (filters: all / needs human / active / blocked / completed); main stage graph as a horizontal node chain with branch nodes below their origin, drawn in SVG from the retained definition; on viewports under 900 px the graph becomes an ordered list with the same states; below the graph the human-action panel (full-width, highest contrast, `role=status`) when the engine waits; then the activity panel and the evidence tabs (Timeline, Attempts, Tests, Audits, Reviews, Evidence, Problems). Status is always icon + text + colour. Motion: only a 200 ms fade on a newly confirmed state; none under `prefers-reduced-motion`.

### D-DASH-8 Package integration

`dashboard/main.ts` is added to the generator's runtime entries, and the static assets under `dashboard/web/` are shipped verbatim as runtime files, so an installed package can start the viewer. The Coordinator text, role agents, Skills, profile and workflow are unchanged. A workspace without the dashboard files (older package) gets `dashboard.status: UNAVAILABLE` and an unchanged engine.

### D-DASH-9 Browser verification

No Playwright dependency: Node 24 ships a WebSocket client and the build machine has Chrome 153. `tests/support/browser.ts` drives headless Chrome over the DevTools protocol (navigate, evaluate, screenshot, device metrics, emulated media) with no third-party package. Screenshots of the seven required states in both themes are written under `.rstack/dashboard-demo/` (ignored) by `scripts/dashboard-demo.ts`.

### Open owner decisions

1. Whether the Coordinator's text should tell the human the dashboard URL (would need a word-budget change to `coordinator.md`).
2. Whether a terminal report should also be generated for `REJECTED` runs that never left planning (implemented: yes, with a short page).
3. The 24 h idle exit of the server.

---

## 4. File plan

| Path | Responsibility |
|---|---|
| `core/read-model/contracts.ts` | `RunView`, `RunSummary`, stage/attempt/timeline/evidence types, status vocabularies, `DASHBOARD_SCHEMA_VERSION` |
| `core/read-model/workflow-def.ts` | `parseWorkflowDef(text)`: strict parser for a retained definition |
| `core/read-model/project-run.ts` | `projectRun(input)`: pure projector |
| `core/read-model/read-run.ts` | `readRun(runsRoot, runId)`: read-only loader → `projectRun` |
| `core/read-model/list-runs.ts` | `listRuns(runsRoot)`: bounded discovery, one summary per run |
| `core/read-model/report-html.ts` | `renderReport(view, records)`: standalone HTML |
| `dashboard/server.ts` | HTTP routes, SSE, static files, security headers |
| `dashboard/watch.ts` | runs-root watcher and view cache with versions |
| `dashboard/lifecycle.ts` | `ensureDashboard`, instance file, liveness, spawn |
| `dashboard/report-writer.ts` | `writeReport(workspace, runId)`: atomic derived output |
| `dashboard/main.ts` | server process entry |
| `dashboard/web/{index.html,app.css,app.js,graph.js,views.js}` | the UI |
| `scripts/rstack.ts` | `start` integration; `dashboard` and `report` commands |
| `scripts/dashboard-demo.ts` | seven synthetic states, screenshots |
| `adapters/copilot-vscode/generate.ts` | ship `dashboard/` |
| `tests/read-model.test.ts`, `tests/dashboard-server.test.ts`, `tests/dashboard-lifecycle.test.ts`, `tests/report.test.ts`, `tests/dashboard-browser.test.ts`, `tests/support/browser.ts`, `tests/support/scenarios.ts` | tests |
| `tests/sensitivity.ts` | cases for the host check, the token check, the artifact identity re-check, the read-only guard, and the no-fabricated-model guard |

Order of work: contracts and projector with fixture tests (DASH-1); read-only loader and report renderer; server and watcher with security tests (DASH-2); UI and browser tests (DASH-3); lifecycle and CLI integration, package generator (DASH-4); demo, screenshots, full validation and records (DASH-5).
