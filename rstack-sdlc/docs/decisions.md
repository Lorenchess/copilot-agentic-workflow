# RSTACK SDLC — decisions

One entry per accepted batch decision set. Newest last. Scope and semantics stay owned by [README](../README.md) and 01–03; this file records only what was chosen and why.

## D-S0 — 2026-10-03 — stack, package, interfaces, reference, profile, transport

**Status:** PROPOSED, awaiting owner acceptance. Nothing here is implemented.

**Update 2026-10-03:** accepted by the owner as the completed discovery batch, with the refinements recorded in D-S0a below. The text of this entry is kept as written.

**Evidence labels:** `LOCAL` = observed on the build machine in this session. `DOC` = official documentation read on 2026-10-03 through a page-extraction tool (wording relayed, not checked against raw HTML). `REF` = awslabs/aidlc-workflows at `30fe4b251eadd3d24d7f08ef4ed9cc9a43b91757` (the preparation revision; no newer revision mixed in), read through the GitHub API, nothing cloned, installed, or run. None of these is VS Code Copilot validation.

### 1. Implementation runtime

**Node.js ≥ 24 running TypeScript directly, `node:test`, zero runtime dependencies, no build step.**

- `LOCAL`: Node v24.21.0 and npm 11.19.1 are installed. A typed `.test.ts` file ran and passed under `node --test` with no `tsconfig`, compiler, or package install.
- Consequence: source must use erasable TypeScript only (no `enum`, `namespace`, or parameter properties) and explicit `.ts` import extensions. Record validation is hand-written; no schema library is added until a second consumer needs one.
- Rejected: Bun (the reference's runtime; not installed here and not needed), Python (3.10.2 is present, but one runtime is enough), any server, database, or model-provider SDK.

### 2. Canonical package

- The package is `rstack-sdlc/` with the layout in 01 §1. Folders are created when they receive code. One private `package.json` at `rstack-sdlc/` holds the `test` and engine entry scripts.
- Authored runtime content lives in `core/`; `adapters/copilot-vscode/` generates `dist/copilot-vscode/`. The repository's root `.gitignore` already ignores `dist/`.
- Runtime evidence goes to the sample application's `.rstack/runs/<run-id>/`, never into `core/`.
- **State (to confirm in S1):** an append-only journal `events.jsonl` is the single authority; `state.json` is a derived snapshot that can be rebuilt. Every accepted event carries an integer state version; a submit must name the expected version. Writers take an exclusive lock, and a torn final journal line is discarded on recovery.

### 3. Initial interfaces

Names are provisional until S1 tests exist.

| Kind | Initial set | First consumer |
|---|---|---|
| Engine commands (JSON in, JSON out, package-local) | `start`, `status`, `next`, `submit`, `decide`, `resume` | S1 fake transport; later the Copilot coordinator through the terminal tool |
| Records (`schema_version` integer each) | run, task envelope, role result, human decision, profile | S1 |
| Ports | request source, proposal sink, role transport | S1 (local request, local proposal, fake transport; Jira and Bitbucket stubs return `INTEGRATION_NOT_CONFIGURED`) |
| Deferred ports | proof executor (S3), evaluator (S4) | Added with their first consumer |

`status` is read-only and never dispatches. Engine replies are `CONTINUE`, `WAIT`, or a named blocker. Core imports no adapter, model label, or IDE tool name; a dependency-direction test enforces this.

### 4. AWS AI-DLC reference decisions

License: MIT-0 (`LICENSE`, `package.json`); no NOTICE or third-party file in the tree. No code is copied in S0; any later adaptation records path and revision.

| Pattern | Source at `30fe4b2` | Decision | Reason | Proving test (batch) |
|---|---|---|---|---|
| Authored core, thin per-harness input, ignored generated output | `core/`, `harness/copilot/{manifest,emit}.ts`, `scripts/package.ts`, `.gitignore` | ADAPT | Matches 01 §1; keeps one authored copy | Generated package contains only derived files; core has no host imports (S1, S5) |
| Determinism check: build twice, byte-compare | `scripts/package.ts` `checkPackageDeterminism` | ADAPT | Cheap, offline; proves stability, not correctness | Two generations from identical inputs are identical (S5) |
| Name-prefix ownership of files in shared `.github/` | `harness/copilot/emit.ts`; `tests/unit/t248-copilot-packaging.test.ts` | ADAPT | `rstack-sdlc-` prefix plus an owned-path list supports collision checks and uninstall | PACKAGE-1 (S5) |
| Provenance sidecar stamp | `scripts/package.ts` (`aidlc-stamp.json`) | ADAPT, stronger | Upstream stamp has no source hash and emitted agents carry no marker; ours records source hashes, generator, and profile per file | Drift detection test (S5) |
| No `model` key written when the host cannot honour it; record what the host actually applies | `harness/copilot/emit.ts`; `core/tools/aidlc-model-policy.ts` (`HARNESS_HONESTY.copilot`) | ADAPT | Same rule as 02 §3: a null selector is never advertised as pinned | MODEL-1 (S2, S5) |
| Compact engine output budget for terminal transport | `harness/copilot/manifest.ts` (`directiveMaxBytes: 19000`); `tests/unit/t-copilot-directive-budget.test.ts` | ADAPT | Engine replies return references, not bodies. The upstream 20,000-character terminal limit is its claim, unverified here | Envelope size test (S1); host probe (S2) |
| Engine as the only lifecycle writer, with lock and atomic write | `core/tools/aidlc-state.ts`, `core/tools/aidlc-lib.ts`; `tests/integration/t145-state-lock-concurrency.test.ts` | ADAPT the idea only | Upstream state is editable Markdown with a schema version, not an expected-version revision; direct edits of the state file are not blocked by the hooks read | CORE-1, CORE-2, CORE-3 (S1) |
| PreToolUse hook as a block-before guard | `core/hooks/aidlc-state-transition-guard.ts`; `harness/copilot/hooks/aidlc-copilot-adapter.ts`; `tests/unit/t249`, `t250` | DEFER | Matches shell command text only, fails open on errors, and the upstream guide says IDE enforcement "has not yet been verified live" (`docs/guide/harnesses/copilot.md` lines 162–166). Hooks are Preview in VS Code | Classified per control after a host probe (S2 or S6) |
| Stop hook that continues the workflow | `core/hooks/aidlc-continue-workflow.ts` | REJECT | Conflicts with CORE-4 and 02 §6: a human wait or status lookup must not become new work | CORE-4 (S1) |
| Markdown as the state format | `core/knowledge/aidlc-shared/state-template.md` | REJECT | Structured records with versions are required by 01 §5 | CORE-1 (S1) |
| Agent and stage roster, scopes, learned rules, memory layers, tier recommendation, installer, approval scheme | `core/agents/` (14), `core/aidlc-common/stages/` (33), `core/scopes/`, `core/memory/`, `scripts/install.sh` | REJECT | Out of scope per README and 03 §2 | None needed |
| Bun runtime and compiled binary | `package.json`, `bun.lock` | REJECT | See decision 1 | None needed |

Limits of this reading: upstream tests were not executed; the largest files (the Copilot adapter, `aidlc-lib.ts`, the install/merge code) were read in part. The upstream architecture reference itself states that "immutable" framework files are a convention: "Nothing in git or the file system enforces this" (`docs/reference/01-architecture.md` line 96). Upstream has no automated VS Code test; its one live Copilot test drives the Copilot CLI.

Supplementary references: the capture-intent page supports a short, human-reviewed `intent.md` (problem, outcome, affected parties, constraints, open questions). The Skill authoring page advises a SKILL.md body under 500 lines, references one level deep, and a table of contents for reference files over 100 lines; it states no truncation cutoff. Both are consistent with 01 §2 and §7 and change nothing in them.

### 5. First profile

Profile version 1 for host `copilot-vscode`, as an internal record (not Copilot frontmatter):

| Role | Alias | Owner label |
|---|---|---|
| Coordinator | `sonnet` | Sonnet 5 |
| Planner (intake, spec, plan modes) | `opus` | Opus 5.5 |
| Plan Auditor | `sol` | Sol 6.1 |
| Tester | `sonnet` | Sonnet 5 |
| Developer | `sonnet` | Sonnet 5 |
| Reviewer | `opus` | Opus 5.5 |
| Local PR proposal | none | deterministic |

`luna` (Luna) and `terra` (Terra) are registered as unassigned candidates. Every `host_selector` is `null` with `selector_status: requires-host-observation`; `effort_policy` is `host-default` for every role. No fallback is defined.

**Open conflict for the owner (see unknown U3):** `DOC` says a Local subagent's explicit or agent-configured model is "checked against the main model's cost tier. If a selection exceeds that tier, the subagent doesn't run". If Opus 5.5 or Sol 6.1 sits in a higher tier than Sonnet 5 on this host, a `sonnet` Coordinator cannot dispatch the `opus` Planner/Reviewer or the `sol` Auditor. The profile is not changed here; the tiers must be observed first.

### 6. Proposed Copilot transport — UNVERIFIED

Target surface: VS Code with the **Local** harness selected in the Session Target control. `LOCAL`: VS Code 1.138.0 (commit `7debcd0e`), Windows 11, with bundled `copilot-chat` 0.66.0; newer bundled builds (0.67.0, 0.68.0) are staged on disk, so the version must be re-read at smoke time. No Copilot session was started in S0.

Proposed arrangement, all from `DOC` and none observed:

1. Generated agents are `.agent.md` files under the sample workspace's `.github/agents/`; generated Skills are `.github/skills/<name>/SKILL.md` (name equals directory name).
2. The Coordinator agent lists the `execute`, `read`, and `agent` tool sets and an `agents:` list naming only the `rstack-sdlc-` roles. Role agents set `user-invocable: false`.
3. The Coordinator runs the engine's `next` command in the terminal, receives one bounded task envelope, and calls `runSubagent` with the named role. `DOC`: a Local subagent "doesn't inherit the main conversation history" and each invocation is stateless, which is the basis for fresh audit and review.
4. The role's result returns to the Coordinator, which passes it to `submit`. The engine validates and replies `CONTINUE`, `WAIT`, or a blocker.
5. A human wait is the Coordinator ending its turn. Subagents cannot ask the human (`DOC`: the question tool is unavailable to Local subagents), so every human decision is captured in the Coordinator chat and recorded through `decide`.
6. No nested subagents, no handoff buttons for independence (handoffs carry conversation context), no hooks in the baseline, no reasoning-effort key (none is documented).

If native dispatch cannot be shown, the fallback is `MANUAL_TRANSPORT`: the human opens a fresh chat per role and pastes the envelope and result.

Known limits of the design itself: the engine can refuse a transition, but nothing in this arrangement prevents an agent with file or terminal access from editing run files directly. That control is detect-after at best until a host mechanism is demonstrated.

### 7. Host capability unknowns

All are `UNVERIFIED`. Each needs an observed test in the named VS Code session before `COPILOT_VALIDATED`.

| ID | Unknown | Why it matters |
|---|---|---|
| U1 | Copilot sign-in, entitlement, and whether the Local harness is the selected session target | Nothing else can be probed without it |
| U2 | Exact picker and frontmatter selectors for Opus 5.5, Sonnet 5, Sol 6.1, Luna, Terra | Selectors stay `null` until observed |
| U3 | Cost tier of each model relative to the Coordinator's model | May block the trial profile's dispatch (decision 5) |
| U4 | Whether the Coordinator passes its own `model` argument to `runSubagent`, overriding the role agent's `model` | `DOC` gives the explicit argument highest precedence |
| U5 | Effective model and effort reporting per invocation | Without it, model-specific conclusions are limited |
| U6 | Discovery of generated agents and Skills, and loading of linked Skill resources | Required capability |
| U7 | Result fidelity: whether the role's result reaches `submit` exact, paraphrased, or truncated, and the usable terminal output size | Decides whether results travel as text or as a file reference the engine hashes |
| U8 | Whether `tools:` and `agents:` lists are enforced or advisory; `DOC` says an unavailable tool "is ignored" and states neither | Sets block-before versus detect-after for write boundaries |
| U9 | Terminal command approval behaviour for engine commands under current settings | No auto-approval will be broadened to make this work |
| U10 | Hooks (Preview, `chat.useHooks`): availability and whether `PreToolUse` deny is honoured in this session | Optional; only affects control strength |
| U11 | Inherited customizations: the parent repository has 9 agents and 7 Skills in `.github/`, and `DOC` names a `chat.useCustomizationsInParentRepositories` setting | A sample workspace inside this repository could load the existing pipeline's agents; the workspace location needs owner approval |
| U12 | Human wait and resume across a closed chat or restarted editor | Required for S2 paths |

## D-S0a — 2026-10-03 — owner acceptance of S0 and refinements

**Status:** ACCEPTED (owner instruction). These refine D-S0; where they differ, this entry governs.

- **Source visibility.** The owner authorized one edit outside the package: `!/rstack-sdlc/` added to the root `.gitignore` after the `/*/` rule. New package files now appear as untracked. Package-local ignores live in `rstack-sdlc/.gitignore`.
- **Runtime (refines D-S0 §1).** Node runs the erasable TypeScript directly and `node:test` runs the tests; there are no runtime dependencies and no transpile step. Type-checking is a package-local command, `npm run typecheck` (`tsc --noEmit`), using development-only `typescript` 7.0.2 and `@types/node` 24.19.1, both pinned exactly with `package-lock.json` retained; install with `npm ci`. No global compiler is used.
- **Node range.** Declared `>=24.0.0 <25`. Tested only on v24.21.0, Windows 11 x64. Other 24.x versions and other operating systems are untested.
- **Module convention.** ES modules (`"type": "module"`), explicit `.ts` import extensions, `import type` for types, erasable syntax only (`erasableSyntaxOnly` and `verbatimModuleSyntax` make the type-check reject anything else).
- **Input validation.** Every record that crosses a file or process boundary is parsed by a handwritten validator in `core/contracts/` that rejects malformed input, unknown fields, unsupported schema versions, and inconsistent values. TypeScript types are not treated as validation.
- **Host questions stay open.** The trial profile is unchanged, selectors stay unresolved, effort stays host-default, and no live model or tier probe is run. U1–U12 remain open; the cost-tier restriction (U3) and inherited instructions (U11) need host tests, not a workaround. The live smoke workspace still needs separate approval.

## D-S1 — 2026-10-03 — persistence, retry, and locking

**Status:** PROPOSED with S1, awaiting owner review. Implemented in `core/engine/` and tested; the limits below are part of the decision.

**Authority.** `journal.jsonl` in the run directory is the only authority. Run state is the result of replaying it. `state.json` is a derived snapshot for readers; the engine never reads state from it. A missing, stale, or edited snapshot changes nothing and is rewritten by the next writer or by `resume`.

**Record framing.** One record per line: `<sha256 hex of payload> <payload JSON>\n`. A record is complete only when its newline is present. The state version is the sequence number of the last record, starting at 1 with no gaps.

**Commit and acknowledgment.** An event is committed when its full line has been appended and `fsync` on the journal file has returned. Before appending, the event is applied to the current state in memory, so an event that replay would refuse is never written. The reply is produced only after the commit. A caller that receives no reply must retry; the retry is answered from the journal.

**Reading rules.** Nothing is skipped.

| Condition | Effect |
|---|---|
| Complete record with a bad frame, bad checksum, invalid event, wrong sequence number, another run's id, or an event that contradicts the replayed state | `JOURNAL_CORRUPT`: every operation, including `status`, is refused and the file is left exactly as found. An operator must decide. |
| Complete record with a newer schema version | `UNSUPPORTED_SCHEMA_VERSION`, same refusal |
| Bytes after the last newline (incomplete tail) | Never applied. `status` reports the byte count and changes nothing. A writer holding the lock, and only after every complete record has validated, copies the bytes to `journal-tail/<offset>-<sha256>.bin`, syncs that file, shortens the journal, and reports `recovered_tail` in its reply. |

An incomplete tail was never acknowledged, which is why removing it is safe. A newline-terminated record is treated as acknowledged, so it is never removed.

**Locking.** One writer per run, through a lock file created exclusively and holding a token, process id, host name, and time. Waiting is bounded (default 5 s) and ends with a named refusal. A lock is taken over only when its holder is on this host and no process has that id; the old lock file is moved to `abandoned-locks/` as evidence, under a second exclusive guard file so two processes cannot both take over. Lock age is never used. A lock whose holder is running, is on another host, or cannot be read is not taken over: the reply is `LOCK_BUSY` or `LOCK_UNCERTAIN` and an operator must inspect it.

**Retry and identity.**

- `next` creates at most one pending attempt per step slot. Called again while the attempt is pending, it returns the same envelope and attempt id and writes nothing. A new attempt id is created only after a recorded failure of the previous attempt, within the profile's attempt limit.
- `resume` repairs derived files and returns the current directive, including any pending envelope. It never creates an attempt.
- `status` takes no lock, writes nothing, and never dispatches.
- `submit` and `decide` are idempotent by attempt id or decision id and canonical content: an identical retry returns the original acceptance and its version with `duplicate: true`; different content under the same id is `CONFLICTING_DUPLICATE`. Results for a superseded attempt, an unknown attempt, another run, another role, other inputs, or an older state version are rejected with distinct codes, and the rejected bytes are kept under `rejected/`.

**Limits of the tested guarantee.**

- Interruption was tested by killing a process at the commit point, and by damaging journal files directly. Power loss and operating-system crashes were not tested.
- `fsync` is called on files, not on directories; a newly created run directory or file name surviving power loss is not claimed.
- Local filesystem, single host, Windows 11 only. Network and shared filesystems are out of scope; a lock from another host is always treated as uncertain.
- Process-id liveness cannot detect id reuse. A reused id makes a dead holder look alive, which produces `LOCK_BUSY` (safe, needs an operator), never a wrongful takeover.
- An interruption while an abandoned lock is being taken over leaves the guard file, which blocks writers with `LOCK_UNCERTAIN` until an operator removes it.
- The checksum detects accidental damage. It is not tamper-proofing: any process that can write the run directory can rewrite the journal with valid checksums. The host does not prevent this (see U8).
- The proposal file is written before its event is committed; a repeat writes identical bytes.

## D-S1a — 2026-10-03 — dispatch ownership (correction to S1)

**Status:** PROPOSED with S2, awaiting owner review. S1 was retained by the owner as the offline core baseline; this corrects one gap found in the check the owner asked for.

**Gap found.** In S1, `next` returned the same pending envelope to every caller, and the driver invoked the transport whenever it received an envelope. Measured on the S1 baseline with real processes: two concurrent drivers each invoked the fake transport for `plan-1` and for `plan-audit-1` (2 invocations each), and a driver started after another was killed mid-invocation invoked the same attempt again. Result deduplication hid the second result; it did not prevent the second execution.

**Correction.** No scheduler, broker, or lease was added.

- `next` grants dispatch to one caller: the call that commits `task_dispatched` replies `DISPATCHED` with `dispatch: GRANTED`. Every other call while the attempt is pending replies `PENDING_IN_FLIGHT` with `dispatch: IN_FLIGHT`. `resume` also reports `IN_FLIGHT`.
- The driver invokes the transport only on `GRANTED`; otherwise it stops with `IN_FLIGHT`. A holder of the result can still `submit` it.
- An attempt whose dispatcher went away stays in flight. The engine never re-runs it by itself. It is closed only by an explicit `abandon`, which records `attempt_failed` with kind `EXECUTION_UNCERTAIN`, counts against the retry budget, and makes any later result for it `STALE_ATTEMPT`. The replacement attempt has a new identity.

**Limits.** The grant is delivered once, in a reply; it is not a lock on the outside world. A caller that ignores `IN_FLIGHT` and invokes anyway is not prevented, so on a real host this depends on the coordinator following the reply (U8). If the granted caller dies after the commit and before reading the reply, nobody holds the grant and an operator must `abandon`; that is deliberate, because whether work started cannot be known. After an `abandon`, work from the abandoned invocation may still be running outside the engine's view; its result is refused, but its side effects are not undone.

## D-S2 — 2026-10-03 — planning slice and the human-controlled audit loop

**Status:** PROPOSED with S2, awaiting owner review.

**Route.** One machine-owned stage table in `core/policies/workflow.ts` (workflow version 2): `intent` → `spec` → `plan` → `plan-audit` → `brief` → `plan-decision`, with `product-question` and `plan-revision` entered only by the conditions below. Three planner modes share one role; no agent was added per record.

**Records.** One canonical format each: `intent.md` and `spec.md` (Markdown), `plan.json`, `audit.json`, `dispositions.json`, and the engine-built `plan-final` record (JSON). HTML is derived only. Roles deliver files inside their own attempt directory, `work/<attempt-id>/`, and name them in the result; the engine checks containment and the record's contract, then retains the bytes by content identity. Later edits to a work file change nothing.

**Deterministic checks (what the engine enforces, not judgments of quality).**

- Intent must close `Open decisions:` with `None.`; otherwise the run waits for an owner answer before any specification is dispatched, for at most three question rounds.
- Every acceptance criterion must be carried by a plan unit, and no unknown criterion may appear.
- An audit must name exactly the plan and specification it was given, state its coverage, and have a finding if it refutes.
- A revision must give one disposition per finding of the audit it answers.
- A second auditor's inputs are the source, intent, specification, and the complete revised plan only.

**Human decision.** The brief is rendered only after an accepted audit, and the run then waits whatever the verdict. Actions: `proceed`, `amend`, `second-audit`, `pause`, `reject` in round one; the same without `second-audit` in round two. A decision must name the displayed identities (intent, specification, plan, audit, brief) and the current version, and the retained bytes must still match those identities. `pause` records a non-decision. Only `proceed` and `amend` authorize planning.

**Amendments.** `amend` carries exact amendments with a target (`plan` or a unit id). The engine writes a `plan-final` record that keeps the last audited plan identity, the audit identity and its unchanged verdict, the amendments, `amendments_audited: false`, the residual findings, and the required proof. Its status is `AMENDED_NOT_REAUDITED`; `AS_AUDITED` is used only when there are no amendments. The engine cannot tell whether an amendment changes requirements or scope; that judgment stays with the human.

**Simulation kept apart from verification.** A run records its transport class at start (`SIMULATED` or `MANUAL_TRANSPORT`). The driver refuses to feed a transport of another class into a run. The stages after planning (`proof`, `implement`, `review`, `proposal`) are a simulated skeleton: a run that is not `SIMULATED` stops after planning is authorized with blocker `STAGE_NOT_AVAILABLE`, so an unverified candidate string can never become a proposal in a real run. Every proposal and terminal reply carries `evidence_class` and `candidate_verification: NOT_PERFORMED`; publication stays `NOT_ATTEMPTED`.

**Generated package.** `adapters/copilot-vscode/generate.ts` writes three agents, one Skill, and a manifest with source and output hashes into the ignored `dist/copilot-vscode/`. No `model` key is written while a selector is unobserved, and no effort key exists. Results travel by file reference (`result.json` in the attempt directory), so the coordinator does not restate role output; this is the proposed answer to U7 and is unverified. Frontmatter keys and tool-set names come from documentation, not observation. Nothing is installed.

**Not decided here.** U1–U12 stay open. The trial profile is unchanged.

## D-S2a — 2026-10-03 — evidence integrity and the S3 execution prerequisite

**Status:** PROPOSED with S2a, awaiting owner review. Workflow version 4.

**Decision provenance.** A decision record may carry `provenance`: `SCRIPTED` or `HUMAN_RECORDED`. A record without it is `UNKNOWN`; nothing defaults to human. The journal event records the resolved value, and state derives from it. The final plan and the proposal carry only the decision's identity, so the fact has one home and is resolved through a reference. In a run that is not `SIMULATED`, every decision (answer, proceed, amend, second-audit, pause, reject) must be `HUMAN_RECORDED`; a scripted one is refused as `SCRIPTED_DECISION_NOT_ACCEPTED`, an unstated one as `DECISION_PROVENANCE_REQUIRED`, and replay refuses a journal that says otherwise. `HUMAN_RECORDED` is the recorder's claim. It is not authentication, and neither is a name in `recorded_by` or a command-line flag; the host does not give the engine a way to authenticate a person.

**Audit coverage.** Each coverage item now has `evidence`. Objective rules only: a `CHECKED` item must cite what was examined; a `NOT_CHECKED` item must cite nothing and say why; `HOLDS` needs at least one `CHECKED` item; a third verdict, `INCONCLUSIVE`, is the explicit unknown and needs a stated limitation. These rules catch a record that contradicts itself. They do not establish that an examination was sound, and no model judges inside the engine.

**Run evidence.** The workflow definition is retained in the run under the identity the journal names. A failed, timed-out, refused, or abandoned attempt's failure record is retained and referenced by `failure_ref`; rejected submissions were already kept under `rejected/`. The review packet is the run directory without `work/`. `evals/verify-packet.ts` resolves every identity in a packet using only the packet.

**Planning basis.** The final plan names the decision, the brief, the specification, and the intent, alongside the audited plan and audit it already named, and states `criteria_basis: SPECIFICATION`. The proposal carries `planning_basis` with the final plan, last audited plan, audit, decision, brief, specification, and intent. Amendments target the plan or a unit; they cannot add, remove, or reword an acceptance criterion, and proof and review stages are handed the specification itself. Whether an amendment's wording conflicts with a criterion is still a human judgment.

**What `abandon` does and does not do.**

- Does: records `attempt_failed` with `EXECUTION_UNCERTAIN`, retains that record, counts it against the retry budget, makes any later result for the attempt `STALE_ATTEMPT`, and lets the next attempt take a new identity and a new directory.
- Does not: stop, signal, or locate the worker; revoke its file or terminal access; undo anything it wrote; or learn whether it ever started. The engine has no handle on a worker. An abandoned worker can keep writing after the abandon.

For planning stages this is safe, and tested: a role's output counts only when the engine copies it from the attempt's own directory at submit, and the retained copy is content-addressed, so a late worker changes nothing that was accepted.

**S3 execution prerequisite.** Stages that write to the application under change (`proof`, `implement`) do not have that property: two attempts would share the same files. Until one of the following exists, an `abandon` on such a stage blocks the run with `WORKER_QUIESCENCE_UNPROVEN` and no replacement is dispatched (enforced now in the state machine, on the simulated skeleton):

1. **Per-attempt isolation (preferred, smallest).** Each attempt works in its own copy of the application; the engine computes the candidate identity from that directory at submit and ingests nothing else. A late worker can then only touch a directory nobody reads, exactly as in planning. No scheduler or lease is needed.
2. **Quiescence evidence.** Only if a shared directory is unavoidable: host-observed evidence that the worker ended, followed by reconciliation of the application against its recorded identity before a replacement starts. An operator's statement alone is not such evidence.

Required S3 regression (delayed worker): dispatch `implement-1`; abandon it; with isolation in place, dispatch and accept `implement-2`; then let the first worker write to the application and submit. Expected: its result is `STALE_ATTEMPT`, and the accepted candidate's identity, its verification, and the files they refer to are unchanged. Without isolation, the expected result is the blocker above.

## D-S3 — 2026-10-03 — proof, candidate, verification, review, local proposal

**Status:** PROPOSED with S3, awaiting owner review. Workflow version 5. Restoration point: the S2a snapshot.

**Application under change.** A run is started with an application directory. The engine measures it (every file, links refused), retains every file under its content identity, and records the tree as `base`. It never writes to that directory. The application declares, in `rstack.app.json`, its test runner and patterns, its controlled-tests directory, and its protected files. The fixture is `tests/fixtures/sample-app/`, a small JavaScript module with two existing tests; JavaScript is the fixture's language, not a core dependency.

**Identity.** A tree identity is the hash of a record listing every path with its hash and size. It identifies exact content, including uncommitted work. No commit id is used or claimed anywhere.

**Per-attempt isolation.** Every attempt of `proof`, `implement`, and `review` gets its own copy at `work/<attempt>/app`, re-created from retained bytes (the base, the base plus controlled tests, or the candidate). The engine reads an attempt's copy once, at submit, and retains what it measured. Everything later (execution, the next stage's copy, the proposal) is rebuilt from the retained bytes, never from a directory a role can still write to. No scheduler, lease, container, or host permission change was added.

**Real execution.** A test-executor port has one adapter, which runs the Node test runner in a child process and normalizes its report into pass, assertion failure, other error, or load failure. The engine runs it twice per candidate path, in directories it creates itself under `exec/`:

- *Proof baseline*, when the tester submits: the retained base plus controlled tests. The proof is accepted only if this run is `VALID`.
- *Candidate verification*, as its own stage: the retained candidate. `PASS` requires exit 0, every reported test passing, and every proof test reported.

Each run is retained as an execution record: purpose, command, working directory (relative), the tree it ran, application configuration, proof, specification and final plan identities, environment (runtime, version, platform, architecture), exit code, timeout flag, duration, per-test results, classification, and the raw output (with the local directory path replaced, so records are portable).

**Proof rules.** The proof record maps every acceptance criterion of the approved specification to named tests and a route. `RED_GREEN`: at least one named test must fail by a failed assertion against the unchanged application; a failure by exception does not count. `ALREADY_SATISFIED`: the named tests must pass against the unchanged application, so existing behavior is verified without a manufactured red. A file that cannot be loaded, a timeout, no reported tests, or a named test that was not reported is `SETUP_FAILURE`. An existing test failing before any change is `BASELINE_UNHEALTHY`. Anything else that does not show what it claims is `NOT_DISCRIMINATING`. Refusals keep the execution record.

**Write boundaries, checked by measurement.** Tester: only files under the controlled-tests directory may differ from the base. Developer: nothing under the controlled-tests directory and no protected file may differ from the proof tree. A violation refuses the result and retains nothing. This is detect-at-submit, not prevention: the host is not known to confine a role's tools (U8).

**Verification failure and review.** A failed verification is recorded and sent back to the developer as an input, in a fresh copy, for at most the developer's attempt limit; then the run blocks. The reviewer is handed records only: source, specification, final plan, the complete audit, the proof, the proof tree, both execution records, the base, and the candidate. A review must name the exact candidate, verification, specification, and proof it was given, and follows the same coverage rules as an audit. Only `ACCEPT` leads to a proposal; `REJECT` and `INCONCLUSIVE` block. There is no repair loop after review in this batch.

**Invalidation.** Before assembling a proposal the engine compares the current execution environment with the one the verification recorded. If they differ, it records `verification_invalidated`, drops the verification and the review, and goes back to `verify`; a new review of the new verification is then required. Retained bytes that no longer match their identity stop verification and the proposal. A change of candidate always goes through a new verification because the old one names another tree.

**Proposal.** Local only. It names `base_ref`, `candidate_ref`, `proof`, `proof_tree`, `proof_baseline`, `verification`, `review`, the `planning_basis` from S2a, and `evidence_classes`: `role_results` and `review` are the run's transport class; `test_execution` is `ACTUAL_LOCAL_EXECUTION`. `candidate_verification` is `PASSED_LOCAL_EXECUTION`. Decision provenance is resolved through the decision identity. Publication stays `NOT_ATTEMPTED`.

**Abandon and quiescence, revisited.** With per-attempt copies, abandoning a `proof` or `implement` attempt no longer blocks: the replacement works elsewhere, and a late worker writing in its own copy, or anywhere after acceptance, cannot change what was retained. This is demonstrated by test. Two limits remain and are stated, not solved:

- A new directory does not stop the old worker or revoke its access. A worker that ignores its lane and writes into the live attempt's copy before that attempt submits is not prevented. The write is not hidden: it becomes part of the measured candidate, which is then verified and reviewed as measured.
- `WORKER_QUIESCENCE_UNPROVEN` remains in the state machine for any stage marked as having a shared write target. No stage of this workflow is so marked; the rule is exercised by a test that marks one.

**Final plan.** It now carries the audit's unchecked coverage items and the number of checked ones, so its `HOLDS` is not read as unqualified. Acceptance criteria still come only from the specification.

**Journal chaining: assessed, not added.** The concrete failure is that complete trailing records can be removed (or the whole file rewritten with valid checksums) by anything able to write the run directory, and the journal alone would not show it. That is a tampering threat. Chaining lines to each other would detect an edit in the middle but not truncation at the end or a full rewrite, unless the latest hash is also kept somewhere the writer cannot reach, which this local design does not have. It is not a correctness problem for the engine's own crash and concurrency model (D-S1), so nothing was added. It is retained for the integrity assessment and Astra's review, together with the wider point that the run directory is writable by any local process.

**Limits.**

- The executor runs role-written tests and code as this user, with no sandbox. Use synthetic fixtures only.
- The executor understands one runner. Classification depends on that runner's report format as observed on Node v24.21.0.
- An `ALREADY_SATISFIED` test is shown to pass, not shown to be sensitive: a vacuous test for existing behavior is not detected.
- The environment identity is runtime, version, platform, and architecture. Other influences (environment variables, installed tools) are not captured.
- All roles in tests are simulated; no independent model review was performed in this batch.

## D-S4 — 2026-10-03 — independent evaluation

**Status:** PROPOSED with S4, awaiting owner review. No engine redesign; the workflow definition is unchanged (version 5).

**Two kinds of evaluation, kept in separate files and never merged into one score.**

- *Deterministic* (`evals/deterministic.ts`, building on the packet verifier): computed from a run's own records, no model, nothing executed. It reports the packet's integrity, the run's outcome, seven control checks, every real test execution, proof sensitivity per criterion, unsuccessful work, storage, and the evidence class of each kind of operation.
- *Semantic* (a fresh judge session): reads one rubric version and one packet, writes one file. Its answers are one judge's claims.

**Evidence classes per operation.** The deterministic report states them separately and from the authoritative records: role results (the run's transport class, now also recorded on every accepted result), test execution (`ACTUAL_LOCAL_EXECUTION`, now also on every execution record), review (the transport class), authorization (the decision's provenance, with `human_observed` `NO` for scripted, `UNVERIFIED_CLAIM` for a recorded claim, `UNKNOWN` for none), and host validation (`NOT_OBSERVED`; no run has host records). Nothing upgrades a run as a whole. `task_completed` is true only for a proposal whose evidence resolves, and is reported apart from whether the controls held: a correctly blocked run is a working control and an uncompleted task.

**Result vocabulary.** Deterministic checks: `PASS`, `FAIL`, `NOT_APPLICABLE` (the check has no subject in this run), `UNAVAILABLE` (it applies but the packet cannot answer). Judge answers under rubric version 3: `YES`, `NO`, `UNKNOWN` (applies, evidence absent), `NOT_APPLICABLE` (no subject). Not-applicable and unavailable results are shown and are outside every denominator; they are never passes, failures, or zeros. Token use, cost, and effective model are `UNAVAILABLE`: no run records them. Stored bytes are reported as storage only.

**Formats.** The evaluator interprets runs recorded under workflow version 5. Any other run is reported as not interpreted, with the reason, and enters no metric; it is not re-read under today's rules. Earlier runs and their evaluations are untouched.

**Rubrics.** Versions 1 and 2 stay byte-identical. Version 3 (`evals/rubrics/run-v3.md`) covers the whole run and takes up the deferred wording points: one thing per question, where brief and proposal identities resolve, how to read a `human-decision` record (its type names the kind of record; provenance says how it was recorded), and `NOT_APPLICABLE`. A registry (`evals/rubrics.ts`) fixes each version's question ids and answer vocabulary. Evaluations are validated against, and aggregated within, exactly one version.

**Evaluation lifecycle** (`evals/evaluation.ts`, `scripts/evaluate.ts`), all inside `<run>/evaluation/<id>/`:

1. `prepare` records the request (run, rubric id and hash, source, base, workflow and profile identities, evidence digest) and the deterministic report. An id is used once; an existing id is refused.
2. A fresh judge session writes `evaluation.json`. It is given the rubric and the packet only: no expected answers, no earlier evaluation, no deterministic report, no implementation narrative.
3. `accept` validates the output against the rubric version, checks that the area holds only permitted files, and compares the evidence digest with the one taken at preparation. The verdict is `ACCEPTED` or `REJECTED`; a rejected output is kept and marked, never repaired. The judge's self-description is recorded; its effective model is `UNAVAILABLE`.
4. `adjudicate` appends one line per human judgment (`CONFIRM`, `REJECT`, `MODIFY`, `UNRESOLVED`) with a required provenance. It never edits the judge's file, and it stops if that file changed after acceptance. Only `HUMAN_RECORDED` entries count as human calibration; `SCRIPTED` entries are fixtures and are excluded.

**Summary** (`evals/summary.ts`). One rubric is named by the caller; per run, the latest evaluation accepted under it is used, and that rule is stated in the output. Other evaluations are listed per run and not aggregated. A run reached twice (copy or repeated import) is one run. Each metric states what it measures, who is eligible, its denominator, its source, and how missing data is treated. Fixture expectations, where a case has them, are compared with judge answers and labeled as the builder's expectation, not a human label.

**Limits.**

- The judge is a subagent of the same model family as the builder. It starts without this session's context, but it is not an independent party, and its effective model is not observable.
- The preparation files sit in the same directory the judge writes to. The judge is told not to read them and reported seeing a file name only; nothing enforces it.
- The write boundary of a judge session is checked afterwards (digest and file list), not prevented.
- Every case is simulated role content with a scripted decision. The summary says nothing about any model's planning, implementation, or review quality, and nothing about the host.
- Four judged runs and one judge per run: no repeat trials, no measure of judge variance.
- Human calibration has not happened.

**Recorded for S5 (not implemented now): packaging acceptance case.** The generated engine invocation must work outside the development repository. Today the generated coordinator uses `node rstack-sdlc/scripts/rstack.ts`, which resolves only inside this repository, and passes `--workspace .`. S5 must select an installation and root-resolution design and prove it from an unrelated working directory, including a path containing spaces, keeping three roots distinct: the package root (engine code and authored content), the application root (the application under change, read-only to the engine), and the run root (where run directories are written). No personal checkout path may be hard-coded, the project is not copied wholesale, and no worktree is created. Shell quoting of engine arguments is checked in the same test. Live confirmation belongs to S6 and is blocked until the owner names a licensed account or machine and approves the workspace and probe scope.


**Addendum 2026-10-03: summary reading of judge answers and owner decisions** (`evals/summary.ts`, summary schema version 2). Made after owner adjudication of C1–C6; no judge was rerun, and no rubric, evaluation, adjudication, or status definition was changed.

- For judge answers, only `YES` and `NO` are applicable and form the denominator. `NOT_APPLICABLE` and unavailable answers (`UNKNOWN`, or no answer) are counted separately and outside it. No rate, percentage, or accuracy figure is computed anywhere. A question with no applicable case reads `NO_APPLICABLE_CASES` rather than implying a success. This applies the C6 decision; it is the convention the control checks already used.
- Owner decisions are read one per case (run, evaluation, question): the latest human-recorded entry. Earlier entries stay in the adjudication file and are listed under the decision, not counted again (C3 has an `UNRESOLVED` entry followed by the owner's `MODIFY`).
- The judge's answers are always reported as judged. Where a case has a resolved owner decision, the question also carries an owner-adjusted tally, and every owner answer that differs from the judge's is carried with its full note. A differing answer is not classified as a judge error and no judge-accuracy figure is derived, so C4 cannot be read without its interpretation limit.
- The summary written at S4 (`.rstack/s4/summary-run-v3.json`, schema version 1) is kept as it was. The recalculated one is a separate file, `.rstack/s4/summary-run-v3-calibrated.json`.

**R2 correction — 2026-10-03 (review findings D6, D7; awaiting independent verification).** Where this differs from the lifecycle, summary, and limits paragraphs above, this paragraph governs. No rubric, judge, evaluation, adjudication, or stored summary was changed or rerun.

- *Two areas (D6).* A new evaluation's judge output stays in `<run>/evaluation/<id>/evaluation.json`, and that directory holds nothing else. The request, the deterministic report, the verdict, and the adjudications are in `<run>/evaluation-control/<id>/`, which the judge is not told to read or write and which is outside the evidence digest and the packet, like `evaluation/`. Control information is never read from the judge's area. Acceptance is rejected by any other file in the judge's area, by anything in the control area beyond what preparation wrote, by an evaluation directory that preparation did not create, and by a packet that no longer resolves; that last check is recomputed from the run and does not rest on the stored request.
- *Accepted content (D6).* When evaluations are read, an accepted output whose bytes are no longer the accepted hash, an adjudication line that does not name the accepted content, an adjudication on an evaluation that was not accepted, and a control file in the judge's area are each recorded as an issue. An evaluation with an issue is listed with it and not aggregated, and no earlier evaluation is aggregated in its place.
- *Earlier evaluations are kept as they are.* The six evaluations prepared at S4, with their adjudications, hold all five files in `evaluation/<id>/`. They are read from there (`COLOCATED`), are never moved or rewritten, and later adjudications are appended in the same place. An evaluation in that layout that was never checked cannot be accepted now. Once a run has a separated evaluation, a colocated one that was not present when it was prepared is not aggregated.
- *Selection (D7).* Evaluations are ordered by preparation time, then by id with its number read as a number (`EVAL-2` before `EVAL-10`); evaluations without a request come last. Runs reached through several directories are grouped by run id and first journal checksum, and the copy that holds every other copy's evaluation records (the same evaluations, and adjudication files that begin with the others') is the one read; a copy without evaluations is the simplest such case. Copies that disagree, in their evaluations or in the run's own records, are reported under `duplicate_runs` without their locations; the run is counted once (the copy with the longest journal) and its evaluations are not aggregated. Runs are listed by id. The summary does not depend on the order of its arguments (summary schema version 3).
- *Limits.* The separation is by location and instruction, not prevention: a judge process with file access can still write the control area, including the evidence baseline in `request.json`. A judge that adds a file to the evidence and rewrites that baseline to match is not detected; altering an identified record is, by the packet check. The verdict and adjudication records are not signed, and their times and `recorded_by` are claims. A forged colocated evaluation in a run that has no separated evaluation cannot be told from an S4 one. An evaluation with an issue blocks aggregation for its run until a person resolves it; that is deliberate and can be used to deny a result, not to forge one. Keeping the control records where the judge process cannot write would need a store outside the run directory, which was not built.

**R2 corrections 1 and 2 — 2026-10-04 (review findings D6-R2-A, D7-R2-A, D7-R2-B; awaiting independent verification).** Where this differs from the paragraph above, this paragraph governs. A request or verdict on file that is not a valid record of this tool (its exact fields, types, and vocabulary), a verdict without a request, or a verdict whose evidence digest is not the request's makes the evaluation `INVALID`: its output and adjudications are not read, and nothing older is used in its place. The commands apply the same rules as the reader. Accepting again returns the recorded verdict only when the request and the verdict on file are valid and belong together, the request being checked first, and it returns the record as stored and writes nothing; adjudication requires the same; otherwise the command refuses and writes nothing. A first acceptance needs only a valid request. A preparation time must be exactly the form `toISOString` writes. Anything else is `INVALID`, has no place in the order, and is listed last. Valid times are ordered as instants, by their parsed value and not as text, so years written with a sign and six digits order correctly; equal instants are ordered by numbered id. The supported range is what `toISOString` can write; it is not restricted to four-digit years. The earlier statement that any issue blocks aggregation is qualified to what the summary does: an evaluation with an issue blocks its run when it is the latest candidate for the rubric, and an `INVALID` evaluation of this rubric or of an unknown one is a candidate, one without a valid request always standing last and so blocking. An older evaluation with an issue is listed with it while a newer accepted one is aggregated. Copies of a run are also compared on the bytes of `request.json` and `acceptance.json` (sha256, shown as `request_sha256` and `acceptance_sha256` in the `duplicate_runs` variants; the summary schema version is still 3). Copies that differ are shown and not aggregated, nothing is merged, and a re-serialized copy counts as differing. Recovery stays explicit: there is no command to set an evaluation aside or to repair a record, a person resolves it in the files, and the tool never edits or deletes history to make aggregation succeed. The limits are unchanged: validation checks form and consistency, not authorship, and the control area is not protected against a process with file access.

## D-S5 — 2026-10-03 — extension boundaries, package, installation contract

**Replaced adapter.** `adapters/fake-file-drop-transport/` is a second implementation of the `RoleTransport` port. It hands the engine the bytes of the `result.json` a worker leaves in the attempt directory, which is the delivery path intended for the host. Its role content is the same scripted fixture content as the first fake transport, so it shows that the port is sufficient, not that two independent role implementations agree. No file under `core/` was changed in S5.

**Alternate profile.** `tests/fixtures/profiles/alt-test-v1.json` is a test profile with other alias assignments and attempt limits; every selector stays `requires-host-observation`. `profiles/trial-v1.json` is unchanged and remains the default. The generator now validates the profile with the core contract itself (before, only its command-line wrapper did) and refuses a profile for another host (`UNSUPPORTED_HOST`).

**Optional content.** `adapters/copilot-vscode/extensions.json` (schema version 1, validated, unknown fields refused) is the one place optional content is declared; the authored file declares none. It can add an optional Skill for named worker roles and extra instruction text for named roles, each from a source file inside the package. An instruction has a status: `active` is written into the named agents with its source identity; `retired` stays in the definition with its reason, is recorded in the manifest, and is not written. Generation fails if retired text is still present in any emitted file. The definition has no field for tools, models, effort, or removal, and the agent table, the required Skills, and the authored role text stay in generator code and core sources, so nothing mandatory can be configured away. This is not a plugin mechanism: nothing is discovered, and a new stage still needs a route change in the core.

**Package** (`dist/copilot-vscode/`, manifest schema version 2, generator version 2). Three kinds of file:

- `.github/agents/` and `.github/skills/`: templates, all prefixed `rstack-sdlc-`.
- `runtime/`: the engine and installer sources the two commands need, found by following static imports from `scripts/rstack.ts` and `scripts/install-package.ts`, copied unchanged at the same relative paths, plus a generated `runtime/package.json` and the profile as `runtime/profiles/<id>-v<version>.json`. Dynamic imports are not followed, so the deferred Jira and Bitbucket placeholders are not shipped; neither are the fake transports, the evaluator, the generator, tests, guidance, or evidence.
- `rstack-sdlc-manifest.json`: generator, profile, and extensions identities, and source and output hashes for every file.

The package is not self-contained: it needs Node in the range `package.json` declares (currently `>=24.0.0 <25`), which is not bundled, and the manifest says so. It has no third-party dependency. Sources are read with line endings normalized, there are no timestamps, and nothing in the package names a local path.

**Installation contract (root resolution).** Three locations are kept apart:

| Root | What it is | How a command finds it |
|---|---|---|
| Package | The generated package directory, wherever it was put. The engine runs from here | Absolute path written into the installed coordinator at install time |
| Workspace | Where the customization files are installed and where `.rstack/runs/<run-id>/` is written | Absolute path written at install time (`--workspace`) |
| Application | The application a request is about | Given per run with `--app`; the installer never sees it |

The package's agent files carry placeholders (`{{ENGINE}}`, `{{WORKSPACE}}`, `{{PROFILE}}`, `{{RUN_ROOT}}`). The installer fills them with absolute, double-quoted, forward-slash paths, so an installed command depends on no working directory and on no checkout. The engine is not copied into the workspace: that keeps the files owned in someone's workspace to eight plus one manifest. The cost is that moving or regenerating the package after installation needs a reinstall; `verify` reports a package that moved or changed. Rejected: a path relative to the workspace (depends on the terminal's directory), and letting the coordinator work the path out (a model would be resolving a path).

Refused outright: a package or workspace path containing a character that cannot be double-quoted safely in a shell (`"`, `` ` ``, `$`, `%`, line breaks), a package under a `node_modules` directory (Node does not run TypeScript there), and a workspace that contains the package. The last rule is what keeps this repository's root, and its `.github/`, out of the installer's reach from this checkout.

An installed runtime asked for a deferred integration answers `INTEGRATION_NOT_CONFIGURED` (`scripts/assembly.ts`), the same answer the placeholder gives in the source checkout.

**Installer** (`adapters/copilot-vscode/install.ts`, `scripts/install-package.ts`). It owns exactly `.github/agents/rstack-sdlc-*.agent.md`, `.github/skills/rstack-sdlc-*/SKILL.md`, and `.github/rstack-sdlc-install.json`. Both manifests are treated as untrusted data: a package manifest or an install manifest that names any other path is refused before anything is written or removed, and each target is also checked to resolve inside the workspace and not to be a link.

- Without `--apply`, `install` and `uninstall` only report. The plan is complete before the first write.
- Per file: `CREATE`, `UPDATE` (installed earlier and unmodified), `UNCHANGED`, `REMOVE` (dropped by the package and unmodified), `COLLISION` (a file no install manifest lists, even one with exactly the bytes that would be written; changed in R1, see below), `USER_MODIFIED` (changed after installation). Any collision or user modification blocks the whole operation; nothing is written.
- A failure while applying undoes every change of that operation (`INSTALL_FAILED_ROLLED_BACK`). If an undo step itself fails, the reply is `INSTALL_FAILED_ROLLBACK_INCOMPLETE` with each path not undone and a recovery note (R1).
- `uninstall` removes files whose bytes are still what was installed, keeps and reports any that changed, removes directories it created only when empty, and never touches `.rstack/`.
- `verify` reports modified or missing installed files and a moved or changed package. It repairs nothing.

**Limits.**

- None of this is host evidence. Package inspection and installation into a disposable directory do not show that VS Code discovers, loads, or obeys any installed file, or that the Copilot terminal tool runs the commands as written. The shells exercised were `cmd.exe` and Git Bash on the build machine; PowerShell was not.
- The installer does not check the Node version; the requirement is declared, not enforced.
- Rollback is the undo of a failed operation, and `uninstall`. An update keeps no copy of the earlier version: going back means reinstalling the earlier package.
- `uninstall` is not transactional. It removes only regenerable, unmodified owned files.
- A process killed during installation can leave owned files without a manifest. The next installation reports them all as collisions, identical or not; the user removes the leftovers and installs again (R1).
- The plan and its application are not atomic against another process changing the workspace in between.
- The install manifest contains absolute local paths and sits under `.github/`; a user who commits it publishes those paths.
- The package can be generated only into `dist/` or `tests/.tmp/`, by design.

**R1 correction — 2026-10-03 (review findings D1, D2, D8; awaiting independent verification).** `ADOPT_IDENTICAL` is withdrawn: ownership comes only from a valid install manifest, never from matching bytes, because an adopted file was later deleted by `uninstall`. The cost is that an interrupted installation is no longer resumable in place. The undo of a file change is registered before the change and a removed Skill directory is recreated before its file is restored; undo failures are reported, not swallowed. The install manifest's whole shape is validated in `readInstallManifest` before any use (`INSTALL_MANIFEST_MALFORMED`). No transaction framework was added; `uninstall` is unchanged and still not transactional. After the R1 verification: a file already present at `.github/rstack-sdlc-install.json.tmp`, the temporary path the manifest is written through, is a `COLLISION` in the plan, so it is never overwritten or removed; a leftover from a killed installation has to be removed by the user.

**R3/R4 note (2026-10-04).** The `result.json` contract lives in the two record Skills as one identical section; role prompts refer to it and do not restate it. Roles in this package do not use `NEGATIVE`. On the coordinator path, a refused result is recovered only by a human-requested `abandon` of the exact pending attempt; "abandon" alone does not authorize a replacement, and a stale result never leads to abandoning a newer attempt. A specification has a closed syntax (title, one `Intent:`, `AC-n:`, `Exclusion:`, continuations); anything else is refused so that the brief can show everything the decision approves by hash. Retained specifications are not rewritten.

## D-RC — 2026-10-04 — release-candidate audit repairs (RC1–RC9)

**Status:** all nine findings are FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION. None is closed by this record. Source: [astra-release-candidate-audit.md](astra-release-candidate-audit.md) (`CHANGES_REQUESTED_BEFORE_S6`), kept unchanged. Owner-authorized bounded pass on base `6e9bd18`. RC1, RC2, RC5, RC7, and RC9 were repaired by BUILD-03; RC3, RC4, RC6, RC8, and the integration by BUILD-02. D1–D8 were not reopened. No layer, service, agent, or dependency was added. The workflow definition is unchanged (version 5, no new stage or journal event type), and every record keeps `schema_version` 1. S6 stayed paused throughout.

**Owner decision (RC7).** The factory contract's guarantee ("changed proof environment invalidates dependent results") is repaired, not narrowed. Where the audit's suggestion and this decision differ, the decision governs.

**RC1 — only an executed top-level test can prove a criterion** (`adapters/node-test-executor/index.ts`, `core/contracts/ports.ts`, `core/engine/execution.ts`, the tester prompt, the application-records Skill). The report parser used to read every top-level `ok` line as a pass, so a skipped test or a suite holding only skipped tests satisfied a criterion. A reported entry now carries a `kind` and one of four statuses. `TEST` is an entry the runner itself marks as one test with nothing nested in it; everything else (a suite, a test holding other tests, an entry with no such mark) is `CONTAINER`. The status is `PASS`, `FAIL`, `SKIP`, or `TODO`. A proof may name only a `TEST` that ran: a container, a skipped test, a TODO test, or a nested test (which is not reported at the top level) is a setup problem at the proof baseline (`PROOF_SETUP_FAILURE`, no transition) and a failed verification. Nested results are deliberately not supported as proof, and the Skill and the tester prompt now state the supported shape. Skips and suites outside the proof are tolerated as before. The runner and the test framework are unchanged.

Limits. A `#` in a test name is still reported escaped (as before). An existing test outside the proof that is turned into a skip is not refused; that is the audit's legacy-test row, classified there as future hardening. A test that runs can still be vacuous (unchanged limit of `ALREADY_SATISFIED`).

**RC2 — a test pattern cannot name anything outside the application tree** (`core/contracts/app.ts`, the executor). A pattern is refused when any segment is empty, `.`, `..`, or begins with a dot; backslashes, drive letters, absolute and option-like forms were already refused by the character rule and still are. The application configuration is refused at start (`INVALID_APPLICATION`, no run created). The executor applies the same rule again before spawning and runs nothing for a pattern it refuses. Nothing is rewritten into another target. Ordinary nested globs are accepted as before.

Limits. The rule is lexical; it relies on the measured tree holding no links, which measurement already refuses. A directory whose name begins with a dot can no longer be named in a pattern.

**RC3 — the decision is bound to the file the human reads** (`core/engine/engine.ts`). A plan-decision wait names `brief/round-N.html`, a copy of the brief that a browser can open; the retained brief is the same bytes under its identity. `decide` now reads the named file and compares its hash with the `brief` subject the decision carries, after the existing checks of the retained subjects. If the file is missing or differs, the reply is `DISPLAYED_SUBJECT_CHANGED` (`ok: false`; detail: the path, the subject, the expected identity, the identity found or `null`), the refused decision is kept under `rejected/`, nothing is committed, and the wait stands at the same version. This holds for every action at that wait, `reject` and `pause` included: no decision is taken on a display the engine cannot vouch for. The engine never puts the retained bytes back, at `decide`, at `resume`, or anywhere else, because a restored file would hide that the human may have read something else. Recovery is an explicit act by a person: compare the named file with `artifacts/<brief identity>`, put those bytes back at the named path, read the brief, and decide again. A product question is read from the retained record itself (`artifacts/<intent identity>`), so the existing identity check already covered it; a test now pins that. Rejected: pointing the wait at the retained artifact, which has no extension and is not rendered by a browser; and restoring the copy in `resume`, which is a silent replacement and would also remove the mismatch before a pending decision could meet it.

Limits. The check is made when the decision arrives. A file changed and changed back between the reading and the decision is not detected. A process that can write the run directory can change both copies and the journal; a local, unsigned store cannot show that (unchanged accepted limitation). Whether a person read the file is not observed. The coordinator text has no special rule for this refusal; its general rule (report the code and stop) applies.

**RC4 — the evidence is re-established before a proposal** (`core/engine/engine.ts`). The proposal step used to re-read five top-level records. It now builds the proposal record first, without writing it, and reads again by identity everything that record names and everything the run currently relies on: the frozen source, application configuration, profile, and workflow; every current subject; every accepted role result; every recorded decision; the planning basis; the base, proof, and candidate trees down to each file; and the raw output of the proof baseline and of the verification. Bytes that are missing or no longer match stop the step with `MISSING_INPUT`, naming the record, or the file and its tree. Nothing is written and no event is recorded, so restoring the bytes lets the same step proceed. The tree check is the reader that materializes a tree for execution, used without writing (`readTreeFile`, `verifyTree`); no second identity scheme was added and nothing from `evals/` is imported into the core.

Limits. The gate covers what the proposal names and what the current state relies on. Records of superseded attempts (a failed verification, an earlier candidate, a rejected or abandoned attempt) and the display copies of briefs are not dependencies of the proposal and are not read by the gate; `evals/verify-packet.ts` still reports on the whole packet, so damage there is reported after the proposal, not prevented before it. `work/` and `exec/` are not retained evidence and are not read. The gate and the write of the proposal are not atomic against another process changing the run directory.

**RC5 — a lock takeover that fails is bounded** (`core/engine/lock.ts`). A takeover of a dead holder's lock that does not succeed no longer restarts the loop at once. It falls through to the deadline check and the polling delay like any other wait. At the deadline an unfinished takeover guard still gives `LOCK_UNCERTAIN` naming `lock.reclaim`; a dead holder's lock that could not be taken over now gives `LOCK_UNCERTAIN` with the holder. The lock and the guard are left as found. A live reclaimer is waited for and not interfered with; recovery of a dead lock without a guard, and `LOCK_BUSY` for a live holder, are unchanged.

Limit. A guard left by a reclaimer that died still needs an operator; the engine reports it within the timeout and does not remove it.

**RC6 — `verify` checks the package files, not only the manifest** (`adapters/copilot-vscode/install.ts`). Installed commands execute the runtime in the package directory. `verify` now compares every file the package manifest lists (templates, runtime, profile) with that manifest, when the manifest is the one recorded at installation. A listed file that is missing or differs gives `package: FILES_CHANGED` and names each one in the new `package_files` list (`MODIFIED` or `MISSING`); the reply is `DRIFT` and the command exits 2. `PRESENT` now means that the manifest and every listed file match. `MISSING` and `CHANGED` keep their meaning; under `CHANGED` the files are not judged against the installed identity. The per-file comparison is the one `install` already used to refuse a modified package (`packageFileStatus`), so the two cannot disagree. `verify` still only reads; it repairs and installs nothing.

Limit. A file added to the package directory that the manifest does not list is not reported.

**RC7 — the tests run in a controlled environment, and that environment is part of the evidence identity** (`core/contracts/app.ts`, `core/contracts/ports.ts`, the executor, `core/engine/engine.ts`, the application-records Skill). The executor builds the child's environment from nothing: a fixed runtime set, plus the names the application declares in the new optional `test.env` list of `rstack.app.json` (up to 20 names; a value is never part of the configuration), each with the parent's current value. No other variable of the parent reaches a test. `NODE_OPTIONS` and `NODE_TEST_CONTEXT` are never passed and cannot be declared. The runtime set is explicit: on Windows the eleven names the platform copies into every child process in any case (`HOMEDRIVE`, `HOMEPATH`, `LOGONSERVER`, `PATH`, `SYSTEMDRIVE`, `SYSTEMROOT`, `TEMP`, `USERDOMAIN`, `USERNAME`, `USERPROFILE`, `WINDIR`), elsewhere `HOME`, `PATH`, `TMPDIR`. There is no fallback to the whole parent environment. The identity in every execution record is now runtime, version, platform, architecture, the sorted variable names, and one SHA-256 digest over all name and value pairs, taken from the environment the child was actually given. The engine stores no value.

Freshness. Before a candidate is verified, the engine compares the current identity with the proof baseline's; if they differ it replies `PROOF_ENVIRONMENT_CHANGED` (`ok: false`), runs nothing, and records nothing. Before a proposal it compares the current identity with the verification's, as before, and on a difference invalidates the verification and the review (`EVIDENCE_STALE`). The audit's counterexample therefore cannot reach a proposal on stale evidence: an undeclared variable never reaches the tests, and a changed declared variable invalidates the verification, after which re-verification is refused until the environment is the proof's again. Existing applications need no declaration; the sample application is unchanged.

Limits. (a) A run whose environment legitimately changes after the proof cannot establish a new proof: it stays refused until the environment is the proof's again, or a new run is started. (b) `PATH`, `TEMP`, and the other runtime names are part of the identity, so a terminal with another `PATH` stops a run the same way. (c) The digest is unsalted: a value that can be guessed can be confirmed offline by anyone holding the record. (d) The application's own test output is retained as printed, so a test that prints a variable puts it into evidence. (e) Only variables are controlled; installed tools, files outside the tree, and the network are still not tracked. (f) Execution records written before this change carry the four-field identity, so a run started before it is refused at verification or invalidated at the proposal; none is expected to continue.

**RC8 — a judgment counts only for the evidence it judged** (`evals/evaluation.ts`, `evals/summary.ts`). An accepted evaluation records the digest of the run evidence it was prepared and accepted on. `listEvaluations` now compares that digest with the run's evidence as it is when the evaluation is read. If they differ, the evaluation keeps its recorded status and stays readable, with its adjudications, and carries the issue `the run evidence is no longer what this evaluation judged (judged <digest>, now <digest>)`. An evaluation with an issue was already listed and not aggregated, and the summary already refuses to use an earlier evaluation in place of the latest candidate; both rules now apply to a stale subject too. So a judgment made while a run waited is not counted for the same run after it completed, its `NOT_APPLICABLE` answers enter no tally, and adjudications of it are not counted as calibration of the current run. A new evaluation of the current evidence is aggregated; the earlier one stays on file as history. A copy of the run frozen at the judged state is still that evidence and still aggregates there. No record is rewritten and no schema changed; the summary's `selection` text names the rule.

Limits. The evidence digest is the existing one: every file in the run directory except the two evaluation areas and `lock`. It includes `work/` and `exec/`, so a late write there, or a packet copied without them, is a different subject and its evaluations are listed, not aggregated. This is conservative and is the rule acceptance has always applied. A summary regenerated over earlier runs applies the same check to them. Who wrote an evaluation is still not authenticated.

**RC9 — a human's words reach the engine through a file, not through shell quoting** (`scripts/rstack.ts`, `adapters/copilot-vscode/coordinator.md`). A shell rewrites double-quoted arguments before the program sees them, and the program cannot tell. The command line therefore takes human text from a file whose bytes are the text: `--answer-file`, `--recorded-by-file`, `--reason-file` (strict UTF-8, nothing trimmed or added). An inline `--answer` is always refused. An inline `--recorded-by` or `--reason` is accepted only when it consists of letters, digits, spaces, and `. , _ @ + -`, which no supported shell rewrites inside double quotes; anything else is refused with `INLINE_TEXT_REFUSED`. A missing file is `MISSING_INPUT`, a file that is not UTF-8 is `INPUT_NOT_UTF8`; each is a JSON reply with exit 2, and nothing is recorded. Giving both forms of one text is a usage error. The decision record, its provenance, the binding to decision id and version, and the abandon semantics are unchanged. The coordinator text never places the human's words on a command line: an answer and an abandon reason always come from a file the human saves; who said it goes inline only as a plain label, otherwise from a file. The coordinator is told never to create, edit, or reword such a file.

Who writes the file. The coordinator agent has no file-writing tool; its tool sets (`execute`, `read`, `agent`) are a recorded decision (D-S0 section 6) and are unchanged. So the human saves the file, as the amendments file already worked. The alternative is to add the `edit` tool set to the coordinator and let it write the human's words with that tool; that is one line in `generate.ts`, the wording of one coordinator section, and one test. BUILD-02 did not take it, because it changes the coordinator's declared tools, and because with the human's own file the exactness is shown offline end to end, while a file written by the coordinator would make chat-to-file fidelity a host behavior.

Owner decision, 2026-10-04: no edit or file-writing tool is added to the Coordinator in this repair pass, and its tool permissions are not broadened before RC9 is independently verified. The file-based transport stays. That the human may need to save a file for an answer or an abandon reason is accepted for independent verification and classified **TEST_DURING_S6 / FUTURE_USABILITY_HARDENING**.

Limits. (1) Text typed inline for `--recorded-by` that a shell expands into plain characters (`"$true"` becomes `True`) cannot be told apart by the program; only the instruction prevents it, which is a host behavior for S6. (2) A path the human gives still passes through the shell in double quotes, as `--file` and `--amendments-file` always did; the coordinator asks for plain paths. (3) A trailing line break in the human's file is part of the text; no test pins that whitespace at either end of the file is kept (the fixture texts have none there), so that rests on the code. (4) The human has to save a file for every answer and every abandon reason (owner decision above). The documented decide and abandon lines were run through `cmd.exe`, Windows PowerShell, PowerShell 7, and Git Bash on the build machine with shell-active text; that is offline shell evidence and replaces the D-S5 statement that PowerShell was not exercised. It is not evidence of the Copilot terminal.

**Contract and schema changes, in one place.**

| Surface | Change |
|---|---|
| `rstack.app.json` | Optional `test.env`: names of variables the tests need. Patterns with a segment that is empty, `.`, `..`, or dot-leading are refused |
| Test executor port | `TestOutcome` gains `kind` (`TEST`, `CONTAINER`) and the statuses `SKIP` and `TODO`; `ExecutionRequest.env`; `ExecutionOutcome.environment`; `environment(declared)` |
| Execution record | `tests` entries carry `kind`; `environment` gains `variables` and `variables_digest`. `schema_version` stays 1 |
| Engine replies | New refusals `DISPLAYED_SUBJECT_CHANGED` (decide) and `PROOF_ENVIRONMENT_CHANGED` (verify). The proposal step answers `MISSING_INPUT` for any record or tree file it relies on. Lock: `LOCK_UNCERTAIN` for a dead holder that could not be taken over |
| Command line | `--answer-file`, `--recorded-by-file`, `--reason-file`; inline `--answer` refused; `INLINE_TEXT_REFUSED`, `INPUT_NOT_UTF8` |
| Installer | Verify report: `package: FILES_CHANGED` and `package_files` |
| Evaluation summary | An accepted evaluation of other evidence is listed with its reason and not aggregated; `selection` text extended. Summary schema version unchanged |
| Generated package | Coordinator and tester agents, the application-records Skill, eight runtime files, and the manifest changed. Package manifest schema 2 and generator version 2 unchanged. Coordinator tool sets unchanged. No model key written |
| Unchanged | Workflow version 5, journal event types, record schema versions, profile `trial-v1`, role tool sets, the Jira and Bitbucket placeholders |

**Earlier text this section supersedes.** D-S3: "PASS requires … every reported test passing" (now: no reported test fails, and every proof test ran and passed); the environment identity of four fields, and the limit that environment variables are not captured (RC7). D-S5: `verify` "reports … a moved or changed package" (now also changed or missing package files, RC6); "PowerShell was not" exercised (RC9). Those sections are left as written; this one governs.

**RC7 follow-up — 2026-10-04 (after the independent verification; awaiting independent verification).** The verification found RC1–RC6, RC8, and RC9 fixed and one defect left in RC7: `NODE_TEST_WORKER_ID` could be declared in `test.env`, the parent's value was hashed into the environment identity, and the Node test runner then assigned its own value to that name in the test process, so the record named a value the test never saw. Owner decision: the exact name is reserved with the other runner-owned names (`NODE_OPTIONS`, `NODE_TEST_CONTEXT`, `NODE_TEST_WORKER_ID`); the whole `NODE_TEST_` prefix is not, because that would narrow the application configuration beyond what was demonstrated; a further runner-owned name is added when it is observed on a later Node version. The executor refuses a declaration of any of the three before it spawns anything, in any spelling (the comparison upper-cases the declared name on every platform); nothing else in RC7 changed. Limit: the list is exact and reflects Node v24.21.0, where the runner sets those two `NODE_TEST_` names in a test process. The refusal is the executor's, at the first execution, not at the start of a run: the configuration contract knows no runner, so such a run starts and its proof is refused.

## D-S6 — 2026-10-04 — S6 start: status, roles, gates, and limits

**Status.** Owner decisions relayed on 2026-10-04 with Astra's `READY_FOR_S6`. They govern S6. Nothing in this section is host evidence, and nothing here changes source, the profile, role tools, or the architecture.

**S6 is started.** The subject is the `READY_FOR_S6` candidate, checkpoint `07de93a49b4ec62ada46f0a55d2430ac208a4b53`. The owner has no access at home to the real VS Code GitHub Copilot environment, so the project status is: offline implementation complete; `READY_FOR_S6`; S6 started; live host execution pending owner access; `COPILOT_VALIDATED` = NO. A stop for lack of host access is "S6 IN PROGRESS — LIVE HOST EXECUTION PENDING ACCESS". It is not a pause. Jira and Bitbucket remain deferred and are not required to begin or complete the baseline S6 Copilot validation.

**Canonical inventory ordering.** A source inventory digest is taken over entries in true ordinal path order (paths compared byte by byte): `<sha256>`, two spaces, repository-relative path, joined by LF, no trailing LF. For the 111-file candidate that is `db2b13876879caf5cd3eae036d80c2f65dacfb43126d7e942b880b49e452b179`. A digest in any other ordering, such as the case-insensitive `f43785d6eb8b87898cb61f0c76234686f43d32ff77427fe20bd74928a99cefb6`, is explanatory evidence only (Astra's erratum, relayed by the owner).

**Roles.** BUILD-02 is the S6 integrator and owns checkpoint and branch state, the S6 plan, the evidence inventory, shared records, the generated package identity, synthetic fixture preparation, test scheduling, integration of any later S6 repair, and the final handoff to Astra. BUILD-03 is the S6 host/pilot preparation owner and owns the owner-driven scenario script, disposable workspace preparation, the installation procedure, the discovery checklist, the model/tool/session observation checklist, the Coordinator and role workflow instructions, the human checkpoint scenario, the refusal/recovery scenario, the complete synthetic workflow scenario, and the evidence collection instructions. Direct session messages; `WINDOW REQUEST <id>` / `PAUSED <id>` / `RELEASED <id>` for source-dependent work and test windows; no other clone, worktree, or duplicate project.

**Evidence labels.** `OBSERVED`, `OWNER-OBSERVED`, `OFFLINE`, `DOC-EXPECTED`, `UNVERIFIED`. `OFFLINE` and `DOC-EXPECTED` evidence is never converted into host evidence. Installed files on disk are not host discovery.

**Disposable workspace.** Preferred path `C:\rstack-sdlc-smoke\`: outside the source repository, not an employer repository, no sensitive data, no parent-repository RSTACK customizations, disposable. The already-approved package may be installed there offline when that is purely a local filesystem operation. Nothing is installed into a real workplace or project repository.

**Live gate G0, at execution time.** The owner establishes: VS Code version; loaded Copilot / Copilot Chat version; GitHub signed-in state; Copilot entitlement active; the actual Session Target (harness); Node version; the `READY_FOR_S6` checkpoint and package identity; workspace identity and category; exposure to inherited user or parent customizations. The earlier "subscription has ended" message is history and does not fail the new run; entitlement is rechecked live. If it is unavailable then, the result is `COPILOT_VALIDATION_BLOCKED_BY_ENTITLEMENT` and live S6 stops. A successful host run is never simulated.

**Models and profile.** The profile selectors remain unobserved. At runtime, for each role, the owner records the selectable model, the actual or effective model if the host exposes it, the effort or reasoning level if exposed, any cost-tier restriction, whether the Coordinator can dispatch the role, and whether the host ignores, rejects, or applies an explicit setting. Selectors are not altered to make the run succeed. If the intended Coordinator and role pairing is blocked by the host's tier or model rules, that path stops and the decision returns to the owner. There is no hidden fallback.

**Human text.** RC9's file-based transport stays. The Coordinator gets no edit tool. The owner's instructions for S6 say exactly which text files to create, and the burden is recorded as an S6 usability observation.

**Refusal and recovery.** The live scenarios are bounded: a malformed result, an interrupted open attempt, no automatic abandonment, a bare abandon that dispatches nothing, abandon-and-retry of the exact pending attempt, a stale result that is refused and does not abandon a newer attempt, and the profile's attempt limit. A valid role result is not hand-edited to manufacture a failure when the prepared safer methods suffice.

**Complete workflow.** One bounded end-to-end run on the synthetic request, expected to end at `PR_PROPOSAL_READY`. No external PR publication, no Jira, no Bitbucket. Role answers are not precomputed; that would contaminate the independence of the live run.

**Host-specific defects.** BUILD-03 preserves the exact host reproduction and sends it to BUILD-02, and does not patch shared source. BUILD-02 classifies it, assigns the smallest repair, uses the window protocol, writes a focused offline regression, regenerates the package, and has only the affected host scenario repeated. Failed host evidence is kept permanently. The whole offline review is not redone for each host defect.

**Not allowed before live access, and not as a result of it without the owner:** claiming `COPILOT_VALIDATED`; fabricating host observations; running Copilot chat steps without the owner; contacting Jira or Bitbucket; changing model selectors, role tools, or the architecture; another general offline redesign.

**Preparation decisions (BUILD-02 with BUILD-03, 2026-10-04; within the owner's limits above).**

- *Layout.* One disposable folder, `C:\rstack-sdlc-smoke\`, with siblings `package\`, `workspace\`, `app\`, `requests\`, `human\`, `evidence\`. The package is a byte copy of the generated package, not the repository's `dist/`: the installed commands then depend on no checkout, no path contains a space, and the folder is meant to be rebuilt at the same paths elsewhere. That such a rebuild gives the same bytes has not been demonstrated on a second machine or checkout. The package cannot sit inside the workspace (the installer refuses that). The application and the request sit beside the workspace, not inside it, because role agents have editing tools in the workspace and the application is only read. Human text files and evidence are kept outside the workspace so that no agent tool is expected to touch them.
- *Operative identity.* For the host run the identity that counts is the package manifest hash. The commit is where the package came from; later commits on the branch change records only, so the check is that `07de93a` is an ancestor of the checkout and that nothing the package is generated from differs from it.
- *Order of live scenarios.* The complete workflow runs before refusal and recovery, and refusal and recovery uses its own short run. `proceed` continues into the proof in the same chat, where an interruption would change the proof environment; a separate run keeps the recovery scenario from consuming the first run's attempts.
- *Rehearsal.* Expected engine replies are confirmed offline through the package copy's command line in a throwaway directory. Simulated role results are used only there. The S6 workspace holds no run before the owner's first live `start`.

**Finding S6-P1 (offline; classified by the owner, see the decisions below).** The generated package's identity depends on the line endings of the profile file, because the generation command does not normalize that one input. It is classified as a portability limit of the build step, not a host defect and not a regression of a verified repair: on the reviewed working tree the identity is the verified one. Handled for S6 by procedure (clone with line-ending conversion off; block on a hash mismatch). No source change is made without the owner's authorization; a change would alter the reviewed subject and would need an independent check.

**Owner decisions after preparation (2026-10-04).** The offline preparation and the records push `b45a69051e84c7b11691fc8062446d0bf6de14d9` are accepted. The two points left open for the owner are closed.

- *Baseline model policy: observe the actual host model; no selector change.* No host or model selector is added before the first live S6 run, and the `READY_FOR_S6` profile stays unchanged. The baseline uses the model actually selected in the Coordinator chat. Recorded: that model's exact host-visible label, the effective model per role or subagent where exposed, model picker behavior, effort or reasoning reporting, cost-tier restrictions, and whether the Coordinator chat's model selection overrides role behavior. Missing intended Opus, Sol, or Sonnet models are observations, not blockers, and the intended pairing is not silently forced. A real host refusal caused by tier, policy, entitlement, or unsupported dispatch blocks that path. The profile is not modified and no fallback selector is introduced during baseline S6. Model-specific routing is a separate experiment after a successful baseline.
- *Finding S6-P1: `FUTURE_HARDENING / PORTABILITY`.* No source repair before baseline S6; the `READY_FOR_S6` checkpoint and package stay unchanged. The identity check in the owner script's stage 0 remains the gate: it recomputes the source and package identities on the live machine, and the run proceeds only if they match the expected `READY_FOR_S6` identities. A mismatch stops the run before host testing and is reported and kept as portability evidence. Byte reproducibility across checkouts and machines has not been demonstrated and is not claimed.
- *Commits.* No further source or documentation commit or push is made unless live S6 produces evidence that belongs in the project record, a real host defect requires a repair, or the owner authorizes one. The owner authorized one bounded docs-only correction on 2026-10-04 to make the committed S6 instructions and records match these decisions. It changed no production source, test, profile, generated package, model selector, or package identity.
- *Status and resume point.* Unchanged: S6 IN PROGRESS — LIVE HOST EXECUTION PENDING ACCESS; `COPILOT_VALIDATED` = NO; Jira and Bitbucket deferred. Live execution resumes at the owner script's stage 1 (G0 host gate), with every G0 item established fresh and nothing inferred from earlier observations. If entitlement is unavailable, the result is `COPILOT_VALIDATION_BLOCKED_BY_ENTITLEMENT` and live S6 stops.

## D-SE — 2026-10-04 — single entry point, selector states, and a new unreviewed candidate

**Status of this section:** owner decisions as given, and the builder's implementation of them, `FIXED_BY_BUILDER / AWAITING INDEPENDENT VERIFICATION`. Nothing here is host evidence. `COPILOT_VALIDATED` = NO.

**Owner decisions** (2026-10-04, after BUILD-02's investigation of model pinning and entry-point visibility). The owner's authorization replaced the earlier "investigate, do not implement" instruction for this bounded change.

1. RSTACK has one human entry point in VS Code: the Coordinator. Planner, Plan Auditor, Tester, Developer, and Reviewer are not offered as selectable chat entry points.
2. The five role agents remain internal subagents.
3. The internal record Skills are not user slash commands.
4. The package targets VS Code.
5. The intended model map is unchanged: Coordinator, Tester, and Developer on Sonnet 5; Planner and Reviewer on Opus 5.5; Plan Auditor on Sol 6.1. The trial profile's aliases already say this (section 5).
6. No silent fallback is acceptable. If a required model cannot be used, the problem is surfaced; RSTACK does not knowingly proceed on another model.
7. No selector string is activated until a live host confirms it. `profiles/trial-v1.json` is unchanged, and no pinned profile is added by this change.
8. Candidate identity. The `READY_FOR_S6` verdict covers checkpoint `07de93a` and manifest `1f5eaef8…08fa`, and remains valid history for that candidate. The source after this change is an **unreviewed single-entry UX candidate awaiting independent verification**. Its identity does not replace the old one in the owner script's stage 0 and stage 2 because builder tests pass. Order: implement, validate, compute the new identity, hand it to Astra, obtain focused approval; only then does the new identity become the subject of the live run.
9. Lanes are kept. BUILD-02: generator, profile contract, Coordinator source, package, profile, visibility, and model-support tests, sensitivity integration, final source and package integration. BUILD-03: `docs/s6-owner-script.md`, the probe wording, `C:\rstack-sdlc-smoke\`, and the owner-facing live procedure. The smoke folder is not updated to the new package before it is approved.
10. Status: **S6 IN PROGRESS — NEW SINGLE-ENTRY CANDIDATE AWAITING OFFLINE VERIFICATION.** This is not a return to "not started": preparation continues, and live execution cannot use the new candidate until it is independently verified. No Copilot, Jira, or Bitbucket contact.

For this change these decisions replace two points of D-S6 ("Owner decisions after preparation"): that the `READY_FOR_S6` package stays unchanged before the baseline run, and that the first live run uses that package. The rest of D-S6 stands, including: no selector before a host confirms it, no fallback, and a real host refusal blocks the path and returns the decision to the owner.

**What the generated files declare** (`OFFLINE`: read from the generated package. What a host does with a key is `DOC` at most, and is listed again under "Host confirmation required").

| File | Frontmatter after the change | Documented meaning relied on |
|---|---|---|
| Coordinator | `target: vscode`; `tools` unchanged (`execute`, `read`, `agent`); `agents`: exactly the five role agents; `user-invocable: true`; `disable-model-invocation: true` | A user-invocable agent is listed in the agents dropdown. `disable-model-invocation: true` keeps other agents from invoking it as a subagent. A named `agents` list permits only the named agents |
| Each role agent | `target: vscode`; `tools` unchanged, none has `agent`; `user-invocable: false`; `disable-model-invocation: true` | Hidden from the dropdown, still available as a subagent. "Explicitly listing an agent in `agents` overrides that agent's `disable-model-invocation: true`", which is how the Coordinator still reaches a role agent |
| Each Skill, required or optional | `name`, `description`, `user-invocable: false`; no `disable-model-invocation` key | Not in the `/` menu, still loaded by the agent automatically. Both keys set would disable the Skill, so the second is never written |
| `model`, any agent | Written only when the catalog entry's state is `owner-pinned` or `observed`. With the trial profile no file has it | See "Selector states" |

`DOC` here is the VS Code documentation dated 2026-09-30 (subagents, custom agents, agent skills, customization overview) and GitHub's custom agents reference, read on 2026-10-04. On that day the VS Code pages were served from `/docs/agents/run/subagents` and `/docs/agent-customization/`; the `/docs/copilot/...` addresses redirected there. This table extends items 1 and 2 of the host syntax list in D-S0, section 6.

The role agents carry `disable-model-invocation: true`, not `false`, on the owner's acceptance of the investigation: with `false`, any agent that has no `agents` list could be asked to run a role agent directly, outside the engine.

**Selector states** (`core/contracts/records.ts`). A catalog entry's `selector_status` now has three values.

| State | `host_selector` | Written as `model:` | Meaning |
|---|---|---|---|
| `requires-host-observation` | must be `null` | no | No selector is known |
| `owner-pinned` | one name | yes | The owner configured it. It says nothing about a host having seen it |
| `observed` | one name | yes | It was confirmed on the host |

Owner configuration is never recorded as `observed`. A selector is one name: at most 200 characters, beginning with a letter or digit, made of letters, digits, spaces, and `. _ + / ( ) -`, and not ending in a space. A JSON list, bracketed or comma-separated text, a quoted name, a second line, a comment, a mapping, or a padded name is refused with `UNSUPPORTED_SELECTOR` before anything is generated. `fallbacks` must still be empty (`UNSUPPORTED_FALLBACK`). The profile's catalog is the only authored place where a role's model is stated: the generator's tables, the role prompts, the Coordinator's text, the workflow table, and the task envelope name no model, and tests check each.

**Coordinator instruction.** The generated Coordinator file gains a section "On this host", placed after its authored text the way each role agent gets its host section. It says: a role agent's model is set by its installed agent file and never by the Coordinator; invoke each role by its exact name and leave the subagent tool's model argument unset; never choose, pass, substitute, or override a role's model. If the host does not run the named role agent, the Coordinator does not retry, does not name another model or agent, does not omit the agent name, and does not do the role's work itself. For a host message about a model or a cost tier it reports a fixed block, `RSTACK MODEL REQUIREMENT NOT AVAILABLE`, with the role, the required model, and the host's message unchanged; for any other refusal it reports the host's message unchanged. In both cases it says that the attempt stays pending, gives the attempt id, and stops; only the human settles it, under the existing abandon rule.

- No model is named in that text. "Required model" is read at that moment from the `model:` line of the installed role agent's own file, so the role-to-model mapping is not repeated in the Coordinator's prose.
- The authored `adapters/copilot-vscode/coordinator.md` is unchanged, byte for byte. It stands at 997 words against a review budget of under 1000, and its verified protocol text is left as verified. Putting the rule in the authored file instead would need reviewed text shortened or the budget raised; that choice is open to the reviewer and the owner.
- It is an instruction. It enforces nothing on the host, and no host enforcement is claimed.

**Generator version 3** (was 2). The same inputs now give different agent and Skill files, so the stamp in every generated file changes. The manifest schema stays 2 and the installer needs no change.

**Not done, by decision.** No pinned profile and no selector for any model in any file. No change to the engine, installer, workflow, role prompts, Skill texts, or task envelope. No model-discovery mechanism. No change by BUILD-02 to the owner script or the smoke folder.

**Host confirmation required.** Unknown until seen on the host, in the bounded probe BUILD-03 is adding to the owner script as the first live Copilot-specific experiment:

1. That each selector string resolves exactly. Candidates to test, written to no profile: `Claude Sonnet 5 (copilot)`, `Claude Opus 5.5 (copilot)`, `GPT-6.1 Sol (copilot)`. The names are those in GitHub's supported-models reference; the `Name (vendor)` form is the documented qualified form. GitHub's per-client table does not list the third for VS Code.
2. Cost tier (unknown U3). `DOC`: a subagent model above the main model's cost tier does not run. Whether a Sonnet 5 Coordinator may dispatch an Opus 5.5 or a Sol 6.1 role is not known. If the host refuses, the routing decision returns to the owner and the map is not changed automatically.
3. That a hidden role agent with `disable-model-invocation: true` is reached through the Coordinator's list.
4. That the agents dropdown and the `/` menu hide what the keys say.
5. That the Coordinator leaves the model argument unset (unknown U4).
6. Whether the host shows the model a role actually ran on (unknown U5).
7. What the host does with a role pin it cannot resolve. Read in the public VS Code source on 2026-10-04 (`runSubagentTool.ts` on `main`; this is not documentation and not evidence about the installed build): an agent-configured model name that does not resolve is skipped without an error and the subagent runs on the main model, while an explicit model argument that does not resolve raises an error. If the host behaves that way, an unavailable role pin is a silent fallback that frontmatter cannot prevent. It would be recorded as a host limitation and never as successful pinning.
8. What `target: vscode` changes outside Local sessions.
9. For one installation at the root of a repository with several projects: one visible Coordinator, hidden role agents, the same behaviour whichever project is the run's `--app`; a subfolder opened alone follows the parent-repository customization setting (`DOC`: off by default); only a second installation is expected to show a second Coordinator.

**After the probe (not executed).** If all three strings resolve and the tier pairing is usable, a separate bounded change adds a production profile with the confirmed selectors at `selector_status: observed`, the package is regenerated, and a focused independent verification covers the exact pins, visibility, determinism, and the absence of any fallback, before the full S6 workflow runs.

### D-SE addendum — 2026-10-04 — order after the probe, and the installed-pair check (review findings SE-S6-1, SE-S6-2)

**Status:** owner decision as given; the corrections it authorizes are `FIXED_BY_BUILDER / AWAITING INDEPENDENT VERIFICATION`. Nothing here is host evidence. `COPILOT_VALIDATED` = NO.

**Review.** Astra's focused verification of the single-entry candidate ([astra-single-entry-verification.md](astra-single-entry-verification.md), kept unchanged) gave `CHANGES_REQUESTED_BEFORE_S6_HOST_CONFIRMATION`. Generated visibility, the selector states, Coordinator model precedence, Skill visibility, package determinism, and regression are `VERIFIED_OFFLINE` in that report, each with its host boundary. Two findings, both in the owner script and neither in source: SE-S6-1, the first probe exercises scratch agents and defers the installed Coordinator-to-Planner dispatch to the full workflow; SE-S6-2, the script continues into the unpinned full workflow after the probe while D-SE puts the pinning change and its verification first. The report does not approve the candidate as the S6 subject.

**Owner decision.** "I AUTHORIZE the SE-S6-1 and SE-S6-2 correction, following D-SE order." The correction is documentation only: the owner script (BUILD-03) and these records (BUILD-02). No source, test, profile, or package file changes.

**Order after the probe, for the new candidate.** D-SE's "After the probe" paragraph governs. The sentence above that "the rest of D-S6 stands" does not keep D-S6's statement that model-specific routing is a separate experiment after a successful baseline run: for the new candidate that statement is replaced by this order. It remains the record of what was decided for the old candidate.

1. The bounded probe runs first, after the host gate and the installation check. It includes one engine-granted dispatch of the installed Coordinator to the installed Planner, and it stops there.
2. The full workflow does not start after the probe.
3. If the probe succeeded: the owner authorizes a separate bounded change that adds a production profile with the confirmed selectors at `selector_status: observed`; the package is regenerated; a focused independent verification covers it; BUILD-03 rebuilds the disposable folder from the verified package; then the full workflow runs.
4. Otherwise the decision returns to the owner, as below.

| Probe outcome | Next action | What it does not allow |
|---|---|---|
| All three strings resolve, the scratch dispatch ran with its worker shown on its declared model, and the installed pair was reached | Stop. Hand the evidence back. Step 3 above, on the owner's authorization | Starting the full workflow on the unpinned package; writing a selector without that authorization |
| A string does not resolve, or the editor shows nothing either way | Stop. The owner decides. No pin for that role | A substitute model, an Auto setting, or a "nearest" string written anywhere but a scratch probe file |
| The host refuses the scratch dispatch for a tier, model, or policy reason | Stop. The routing decision returns to the owner | Changing the role-to-model map, a retry with another model |
| A worker ran but the host shows another model, or shows no model | Stop. Recorded as a host limitation or as unverified. The owner decides | Recording the pin as confirmed |
| The installed Planner is not reached by the installed Coordinator, or the Coordinator does the work itself, names another agent, or omits the agent name | Stop. Host defect path: BUILD-03 keeps the reproduction, BUILD-02 classifies it | Counting a scratch success as the installed-pair result |

**Not covered by the probe as specified.** The owner specified one scratch dispatch, a Sonnet 5 lead to an Opus 5.5 worker. A Sonnet 5 Coordinator dispatching a Sol 6.1 role is looked up as a string but is not dispatched, so its tier behaviour stays unverified after a successful probe. It would first be seen when the pinned package runs, unless the owner adds a second scratch dispatch to the probe. This is recorded as an open point for the owner, not decided here.

**The installed-pair check** (SE-S6-1). One dispatch, granted by the engine, with the unpinned candidate: the installed Coordinator invokes the installed Planner by name with the unchanged envelope, the result is submitted, and the run is not continued. It shows whether a hidden role agent with `disable-model-invocation: true` is reached through the Coordinator's list. It shows nothing about a pin, because the installed files carry no `model:` line. The scratch pair stays for the tier and model experiment and cannot stand in for this check. The engine replies for that single dispatch were rehearsed offline by BUILD-02 with the candidate package's own command line and simulated role content: `STARTED`; `DISPATCHED` / `GRANTED` for `intent-1`, role `planner`; `ACCEPTED`; then `status` twice with no attempt pending and nothing moving (`.rstack/single-entry/se-s6/`).

## D-PRR — 2026-10-04 — a PR review before every proposal (workflow version 6)

**Status of this section:** owner decisions as given, and the builder's implementation of them: **PR REVIEWER INTEGRATION, `FIXED_BY_BUILDER / AWAITING INDEPENDENT VERIFICATION`.** Nothing here is host evidence. `COPILOT_VALIDATED` = NO. **S6 IN PROGRESS — NEW CANDIDATE AWAITING OFFLINE VERIFICATION.** The new source is not `READY_FOR_S6` because builder tests pass.

**Authority.** The owner sent BUILD-02 an implementation brief on 2026-10-04 together with the text of Astra's independent analysis of the PR Reviewer integration. That analysis reached BUILD-02 as text in the owner's message; no report file for it is in `docs/`. Its recommendation was `IMPLEMENT_WITH_CHANGES`, option A, a distinct PR reviewer. BUILD-02 did not start at once: two other sessions were then changing files this work needs. It reported that, stated the defaults listed under "Builder defaults" below, and asked for the owner's word. The owner answered "you can continue now". That sentence is the authorization this change rests on; the owner did not use the words "I AUTHORIZE".

**Owner decisions** (from the brief).

1. Every proposal is preceded by a separate agent review. Only its approval lets RSTACK produce `PR_PROPOSAL_READY`.
2. The role is `pr-reviewer`: a fresh, independent worker, hidden from users. It may not publish, may not edit source or evidence, and may not start a Developer repair.
3. Verdicts: `APPROVE`, `REQUEST_CHANGES`, `INCONCLUSIVE`. `REQUEST_CHANGES` and `INCONCLUSIVE` block the proposal. No automatic repair, no retry with another model, no Coordinator override.
4. The existing Code Reviewer stays as it is.
5. It uses the Code Reviewer's model alias for now. No separate model-routing mechanism.
6. The Coordinator stays the only user-facing agent.
7. Creating an external pull request stays deterministic and outside this change. Nothing here contacts GitHub or Bitbucket.
8. The earlier checkpoint and Astra's evidence are kept. The new candidate is verified separately before it becomes the S6 subject. The live smoke folder is not rebuilt yet.

**What Astra's analysis fixed in the design.** Where the brief's sketch and the analysis differed on an implementation detail, the analysis was followed.

- The PR reviewer's job is narrow: is this change ready to submit, and is what will be said about it supported by retained evidence. Technical acceptance stays with the Code Reviewer. The PR reviewer cannot override a rejection; it can only stop a submission after an acceptance.
- Its input is one retained, content-addressed record of references, not a loose set of inputs and not a narrative.
- Its output is a separate contract. The Code Reviewer's contract is unchanged.
- A verdict other than `APPROVE` uses the existing `BLOCKED` phase. No new human wait and no reopening.
- A new workflow version and a new proposal format, so that an earlier run or proposal can never look compliant.
- The workflow identity is checked before a run is replayed.
- A new profile version; the approved profile's bytes are kept.

**Workflow.** `core/policies/workflow.ts`, version 6 (was 5), 15 stages (was 13). Everything up to the code review is unchanged.

```text
verify ─► review (reviewer)
            ACCEPT ─► pr-review-packet (engine)
                        ─► pr-review (pr-reviewer)
                             APPROVE          ─► proposal (engine) ─► PR_PROPOSAL_READY, publication NOT_ATTEMPTED
                             REQUEST_CHANGES  ─► BLOCKED  PR_REVIEW_CHANGES_REQUESTED
                             INCONCLUSIVE     ─► BLOCKED  PR_REVIEW_INCONCLUSIVE
            REJECT / INCONCLUSIVE ─► BLOCKED (as before)
```

**PR review packet** (`pr-review-packet`, schema 1; `core/contracts/pr-review.ts`, assembled by `core/engine/pr-review-packet.ts`). One record, retained under its hash as the subject `pr_review_packet`. It holds identities and measured facts and no account of the work.

| Part | Content |
|---|---|
| `identity` | workflow, profile, application configuration, PR review procedure (all by identity), the body format `rstack-pr-body/v1`, the evidence class of the run |
| `requirements` | request, intent, specification, the answers record or `null` |
| `planning` | audited plan, audit, final plan, decision, brief, plan status, dispositions or `null` |
| `implementation` | unchanged application, proof tree, candidate (tree identities) |
| `execution` | proof, proof baseline and what it printed, verification and what it printed |
| `technical_review` | the code review record, its verdict `ACCEPT`, the accepted result, its attempt, and the digest of the inputs it was dispatched with |
| `changes` | two measured comparisons, each with `added`, `modified`, `deleted` and the list of paths with the identity of the file's bytes on both sides: unchanged application to candidate (the whole proposed change), and proof tree to candidate (the implementation without the controlled tests) |
| `history` | the journal record the packet ends at and the digest of the journal up to it; failed attempts; failed verifications; superseded results; the number of invalidated verifications; and `not_included`, which says that refused submissions are not journal records and are not bound |

- It is deterministic: no time, no path, nothing from a role. History is selected from the journal up to the cutoff only, so a later journal record does not change the packet, and accepting the PR review does not invalidate its own subject.
- The engine validates the record against its format before retaining it.
- It is re-established at four points: when assembled, before the PR review is dispatched, before a PR review is accepted, and before a proposal is composed. Re-establishing means: the retained bytes are read again by identity; the packet is assembled again from what the run retains now and must be the same record; every record it names, every file of its three trees, and both execution outputs are read on the way; and the relationships between the records are checked, not only their hashes. Missing or altered bytes give `MISSING_INPUT`; records that are intact but do not agree give `PR_REVIEW_EVIDENCE_INCONSISTENT`; a packet that can no longer be reproduced gives `PR_REVIEW_PACKET_STALE`. In each case nothing is recorded and nothing is repaired.
- Relationships checked: the final plan and audit are the authorized ones and the final plan names the recorded decision, audit, audited plan, brief, specification, and intent; the baseline is a valid run of this proof on this proof tree; the verification is a passing run of this proof on this candidate under this specification and final plan; the code review is a valid `ACCEPT` of this candidate, verification, specification, and proof, is the last one accepted before the packet, and was dispatched with the source, specification, final plan, audit, proof, trees, and verification in force.
- The leaf and output re-reads that RC4 added to the proposal step now happen in this re-establishment, which the proposal step runs first. Sensitivity cases 105 and 107 were re-pointed to it and are detected by the same RC4 tests.

**PR review result** (`pr-review-result`, schema 1; file `pr-review.json`, subject `pr_review`).

```text
schema_version, record_type
subject { packet, candidate }
verdict            APPROVE | REQUEST_CHANGES | INCONCLUSIVE
title              one line, at most 120 characters
summary            at most 1200 characters
change_analysis[]  { text, evidence[] }   at most 12
testing_analysis[] { text, evidence[] }   at most 8
risks[]            { text, evidence[] }   at most 8
limitations[]      text                   at most 8
reviewer_notes[]   text                   at most 8
findings[]         the existing Finding shape
coverage[]         the existing Coverage shape
evidence_references[]
```

Enforced by the parser, and by the engine with the packet as re-established:

- `subject` is exactly the packet and candidate the attempt was given. The pending run, role, attempt, input digest, and state version are checked as for every role result.
- No unknown field at any level. There is no field for a path, a count, a command, a test result, another review's verdict, an authorization, or a publication status.
- Seven coverage items are mandatory, by exact name: `intent-fidelity`, `measured-change-fidelity`, `verification-claims`, `technical-review-disclosure`, `material-risks`, `title-and-scope`, `submission-readiness`. None may be missing, none may appear twice. Further items are allowed.
- `APPROVE`: all seven `CHECKED`, at least one `change_analysis` entry and one `testing_analysis` entry, no `BLOCKING` or `MAJOR` finding. `REQUEST_CHANGES`: at least one finding, with non-blank evidence, consequence, and resolution. `INCONCLUSIVE`: at least one limitation.
- Every identity cited must be one the packet names, the packet itself, or a file of its three trees. Each `change_analysis` and `testing_analysis` entry cites at least one.
- Text is bounded, not blank, and free of control characters; the title is one line. The whole record is at most 64 KiB.
- What a parser cannot do: show that a sentence is true. That remains the reviewer's obligation and a question for the post-run judge.

**A verdict other than APPROVE.** The record is retained first. The run then goes to `BLOCKED` with `PR_REVIEW_CHANGES_REQUESTED` or `PR_REVIEW_INCONCLUSIVE`. The blocker text names the verdict and the identity of the retained record; the `BLOCKED` directive and `status` carry `pr_review { verdict, record }`; the findings and limitations are in that record. No proposal is written, nothing is dispatched afterwards, and `next` and `resume` do not reopen it. A changed candidate needs a new run: that cost is accepted for version 1. A refused or failed invocation is a different thing from a negative review: it closes that attempt under the role's attempt limit, as for any role, and the same packet is used for the next attempt. A valid negative review is never asked again.

**Deterministic composer** (`core/engine/proposal.ts`; proposal `schema_version` 2). The proposal is built field by field from an explicit list. A PR review is never merged into it as an object.

| Machine-owned: read from retained records, never from a model | Narrative: from the PR review, only in the places named |
|---|---|
| Request, run, and candidate identities | `title` (its own field, plain text, not placed in the body) |
| Measured paths and added, modified, deleted counts, for both comparisons | Summary |
| Acceptance criteria from the specification, each with its proof route and the reported status of its named tests | "PR reviewer's analysis of the change" |
| For both executions: outcome, exit code, executor, command, and report entries counted by kind and status | "PR reviewer's reading of the testing" |
| Code review: verdict, limitations, findings, unchecked items. PR review: verdict, findings, unchecked items | PR reviewer's risks and limitations |
| Plan status, audit verdict and round, unaudited amendments, unchecked audit items, open audit findings | PR reviewer's notes |
| The authorizing decision, its action, and its provenance, with the statement that `HUMAN_RECORDED` is a recorder's claim and not authentication | |
| Evidence classes, unsuccessful work counted from the packet, evidence identities, publication status `NOT_ATTEMPTED` | |

- Body sections, in this order: Summary; What changed; Verification; Risks and limitations; Review and planning basis; Evidence references. The headings and list structure come only from the composer.
- Report entries are never called tests that passed. The line states entries, single tests by status, and containers, and says that what is nested in a container is not reported.
- The code review's limitations, findings, and unchecked items, and the plan's unaudited amendments, are rendered whether or not the PR review mentions them.
- All text that did not originate in the composer is escaped before it is placed: narrative, and also evidence-derived text such as paths, test names, and criteria. Line breaks become spaces, so supplied text cannot start a block; other control characters are shown as U+FFFD; `&`, `<`, `>` become entities; backslash, backtick, `*`, `_`, braces, brackets, `|`, and `~` are escaped; a leading `-`, `+`, `=`, `#`, or list number is escaped.
- The composer refuses anything but an approving PR review of this packet and an accepting code review. The same retained records always give the same bytes.

**Team adaptation seam.** Three places, none of which is engine semantics.

1. The procedure. `core/policies/pr-review-procedure.ts` holds the default text. A run is started with a procedure text (`--pr-review-procedure <file>` on `start`, or the default); the engine retains its exact bytes, binds its identity into the packet, and hands it to the PR reviewer as an input. A team's mandatory checklist goes here, because this is what a retained run can be shown to have used.
2. Coverage. A procedure may add items; the reviewer reports them under `coverage` beside the mandatory seven.
3. Role instructions. The existing package extensions can add instruction text for the role `pr-reviewer`, recorded in the package manifest with its source identity. This is style and guidance: a package manifest does not show which instructions a given run relied on.

A procedure or an instruction cannot grant publishing, add a tool or a model, remove or rename a mandatory item, change what a verdict means, or lift a block: there is no field or path for any of it. The team's actual checklist was not supplied and is not in the inspected scope; nothing here claims compatibility with it.

**Versions.**

| Thing | Before | After | Earlier form |
|---|---|---|---|
| Workflow | 5 | 6 | A run started under 5 is refused with `WORKFLOW_MISMATCH` by the version 6 engine, before any replay; it is not continued, relabelled, or read as corrupt |
| Proposal record | `schema_version` 1 | 2 | Type `PrProposalV1` is kept so a retained proposal can be named; nothing writes it |
| Journal events | 9 types | 10: adds `pr_review_packet_recorded` | Earlier runs contain none |
| `run_started` | | adds `pr_review_procedure_ref` when the workflow has a PR review | |
| Run state | | optional `pr_review { verdict, record }` | Absent in runs without the stage |
| Profile | `trial-v1.json` | `trial-v2.json` adds the role `pr-reviewer`, alias `opus`, the Code Reviewer's | `trial-v1.json` is byte-identical (`3338b15a…67a8`); with version 6 it is refused as incomplete before a run or a package exists |
| Generator | 3 | 4 | |
| Evaluator | interprets workflow 5 | interprets 5 and 6, each replayed with the definition the run retained | For 5: check `pr-review-gate` is `NOT_APPLICABLE` and evidence `pr_review` is `NOT_IN_THIS_WORKFLOW_VERSION` |
| Rubric | `run-v3` | adds `run-v4`: the same twelve questions and four about the PR review and the composed proposal | `run-v3` is unchanged and still selectable; answers under the two are never combined |

The alias is equal in both shipped profiles and a test checks it. The engine does not enforce it, because the owner's decision is "for now".

**Copilot package.** Seven agents (was six). `rstack-sdlc-pr-reviewer`: `target: vscode`, tools `read`, `search`, `edit`, `user-invocable: false`, `disable-model-invocation: true`, no `agent` tool, no `execute`, no `model` line with the shipped profile. The Coordinator's `agents` list names six role agents. `coordinator.md` gained one engine reply code, `PR_REVIEW_PACKET_READY`, and "both reviewers" in the sentence about never passing on the developer's account; it stands at 998 words against the budget of under 1000. The application-records Skill gained the `pr-review.json` section.

**Builder defaults.** Stated to the owner before starting and applied. The owner's reply did not address them one by one, so they are open to the owner and the reviewer.

1. Tools. The PR reviewer has the Code Reviewer's tool sets. The editing tool is there to write its own record, and the host is not known to confine it. So the owner's "may not edit source or evidence" is met by instruction, by the role having no terminal and no delegation, and by detection: everything a proposal relies on is read again by identity and altered bytes are refused. It is **not** prevention. Prevention needs read-only evidence access and a confined writer or a transport that captures the result, which is a host mechanism and an architecture change this change does not make.
2. No step in which a human previews the rendered text before the proposal is written.
3. The team seam is built and documented; no team content is added.
4. After a non-approving verdict, remediation is a new run.
5. A fresh invocation on the same model alias is treated as the separate agent the owner asked for.

**Not established by this change.**

- That the PR reviewer runs as a fresh worker separate from the session that implemented or reviewed. The envelope binds role and attempt; it does not identify the process or session that produced a result. `HOST_CONFIRMATION_REQUIRED`.
- That the host hides the agent, reaches it through the Coordinator's list, or applies any model to it.
- That any sentence of a PR review is true. Structure, bounds, subject, and citations are checked; meaning is not.
- That a bare address written in narrative or evidence text is not turned into a link by a renderer. No link text can be disguised and no structure can be changed, but automatic linking is the renderer's behaviour.
- A mapping from tree identities to commits, file modes, or a remote pull request's diff. A future publisher has to establish that mapping and check freshness against the real base and head. An approving PR review is not authorization to publish.
- Token or cost figures for the added invocation. Runs record none.

### D-PRR addendum — 2026-10-05 — repairs after Astra's static review (findings 1 to 3)

**Status:** `FIXED_BY_BUILDER / AWAITING INDEPENDENT VERIFICATION`. Authority: the owner's "I AUTHORIZE BUILD-02 to repair Astra findings 1–3 on the workflow-v6 candidate, with focused tests and targeted sensitivity; no commit", and later the owner's instruction to commit and push everything without waiting for the sensitivity run. The account of the work is in [progress.md](progress.md), "PR Reviewer integration: independent static review and repairs".

Builder choices made inside that authorization, each open to the owner:

1. **The packet names the history it relies on.** `failed_verifications[].output` and `superseded_results[].produced` were added under packet schema version 1, without a new version, because workflow version 6 and this packet have never been approved or used outside tests.
2. **Citable identities are a written-out list of record fields.** The two digests are not on it. Files of an earlier candidate are read but are not citable.
3. **A changed reviewer copy is refused with the existing code `WRITE_BOUNDARY_VIOLATION`** (or `UNSAFE_PATH` when the copy cannot be read). No new reply code, and no change to the Coordinator's text.
4. **Only the PR review stage measures its copy.** The technical `review` stage receives a copy of the candidate in the same way and is not measured. Astra's finding and the authorization name the PR review, and decision 4 of D-PRR keeps the Code Reviewer as it is. **Open owner decision.**
5. **Measurement, not prevention.** The check is made at acceptance. It does not show what the copy held earlier, and the PR reviewer keeps the `edit` tool. The owner decision listed under "Builder defaults" is unchanged.
