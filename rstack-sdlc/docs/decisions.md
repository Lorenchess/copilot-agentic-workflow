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
- Per file: `CREATE`, `UPDATE` (installed earlier and unmodified), `UNCHANGED`, `ADOPT_IDENTICAL` (an existing file with exactly the bytes that would be written), `REMOVE` (dropped by the package and unmodified), `COLLISION` (a file the installer did not install), `USER_MODIFIED` (changed after installation). Any collision or user modification blocks the whole operation; nothing is written.
- A failure while applying undoes every change of that operation.
- `uninstall` removes files whose bytes are still what was installed, keeps and reports any that changed, removes directories it created only when empty, and never touches `.rstack/`.
- `verify` reports modified or missing installed files and a moved or changed package. It repairs nothing.

**Limits.**

- None of this is host evidence. Package inspection and installation into a disposable directory do not show that VS Code discovers, loads, or obeys any installed file, or that the Copilot terminal tool runs the commands as written. The shells exercised were `cmd.exe` and Git Bash on the build machine; PowerShell was not.
- The installer does not check the Node version; the requirement is declared, not enforced.
- Rollback is the undo of a failed operation, and `uninstall`. An update keeps no copy of the earlier version: going back means reinstalling the earlier package.
- `uninstall` is not transactional. It removes only regenerable, unmodified owned files.
- A process killed during installation can leave owned files without a manifest. The next installation adopts those that are byte-identical and reports the rest as collisions.
- The plan and its application are not atomic against another process changing the workspace in between.
- The install manifest contains absolute local paths and sits under `.github/`; a user who commits it publishes those paths.
- The package can be generated only into `dist/` or `tests/.tmp/`, by design.
