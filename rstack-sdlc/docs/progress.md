# RSTACK SDLC — progress

One short record per batch. Decisions live in [decisions.md](decisions.md).

| Batch | Date | Status | Recommendation |
|---|---|---|---|
| S0 | 2026-10-03 | Accepted by owner with refinements (decisions D-S0a) | KEEP |
| S1 | 2026-10-03 | Retained by owner as the offline core baseline (milestone acceptance on the report; independent source review by Astra pending) | KEEP |
| S2 | 2026-10-03 | Retained by owner | KEEP |
| S2a | 2026-10-03 | Retained by owner as the working development baseline | KEEP |
| S3 | 2026-10-03 | Retained by owner as the local development milestone | KEEP |
| S4 | 2026-10-03 | Retained by owner as the working development milestone; owner calibration C1–C6 complete; summary reading completed (see "S4 completion") | KEEP |
| S5 | 2026-10-03 | Complete, awaiting owner review; CORE/PACKAGE TESTED, not COPILOT_VALIDATED | KEEP |
| S6 | — | Not started, not authorized | — |

**Source baselines** (ignored, in `rstack-sdlc/.baselines/`, outside test and runtime cleanup paths):

| Snapshot | What it is | Use |
|---|---|---|
| `s2a-2026-10-03/` | S2a as retained by the owner as the working development baseline, including the dispatch and quiescence protections. 55 files; inventory digest `8926ea77ed5315d06d78c4363a905862a50ac270291cc562b50d3bccb00809d4`; base commit `da64f6d`; root `.gitignore` patch sha256 `8552ed1d…190dcf`. Every copy was verified against the inventory and against the working tree after it was taken. This snapshot does not include this table row, which was added afterwards | Restoration basis for S3 work |
| `s2-2026-10-03/` | S2 as retained, including the dispatch correction. 52 files; inventory digest `bda521e31984b4c444fe558f62d73c7e7461712c0078acf9f8c18f5e8ec802fd`; base commit `da64f6d`; root `.gitignore` patch sha256 `8552ed1d…190dcf` | Restoration basis for current work |
| `s1-2026-10-03/` | S1 as first reported. It predates the duplicate-dispatch fix: in that code two drivers can execute one attempt | Historical reproduction point only. Not an operational fallback. Marked by `HISTORICAL.txt` |

Each holds `files/`, `tracked-changes.patch`, and `inventory.json` (path, size, sha256 per file). To reconstruct: check out the base commit, apply the patch, copy `files/` over the repository root. The S1 snapshot's first copy also remains under `.rstack/baselines/`.

## S0 — reference and implementation decisions — 2026-10-03

**Scope:** bounded AWS AI-DLC reference reading, runtime selection, and proposed VS Code Copilot transport. No migration, no engine code, no generated agents, Skills, hooks, or settings. Jira and Bitbucket were not researched or contacted (`JIRA_DEFERRED`, `BITBUCKET_DEFERRED`).

**Baseline:** repository `Lorenchess/copilot-agentic-workflow`, branch `feat/rstack-sdlc-local-build` created from `origin/main` at `da64f6da4b583f01eb34886661a9cbcebab4116f` after `git fetch origin`. Working tree was clean; local `main` was 49 commits behind and had no unpushed commits. One checkout, no extra worktree or clone.

**Files changed:** `rstack-sdlc/docs/decisions.md` (new), `rstack-sdlc/docs/progress.md` (new). Nothing outside `rstack-sdlc/`. Nothing staged or committed.

**Generated outputs:** none.

**Checks actually run:**

| Check | Class | Result |
|---|---|---|
| Typed `.test.ts` under `node --test` on Node v24.21.0, outside the repository | Builder-machine probe | 1 passed, no dependencies |
| `code --version` and bundled extension manifest | Builder-machine observation | VS Code 1.138.0, `copilot-chat` 0.66.0 |
| Reference files at `30fe4b2` read through the GitHub API; five key claims re-read directly | Source reading | Consistent with decisions.md |
| VS Code documentation H1–H5 and the tools reference | Documentation reading | Recorded as `DOC`; subagent model rules re-read directly |

No engine tests, fake-adapter tests, generated-package checks, or VS Code live smoke tests exist yet. `CORE_TESTED`: no. `COPILOT_VALIDATED`: no.

**Instruction conflicts resolved:**

- The README permits local commits; the owner's session instruction forbids staging and committing. The session instruction governs.
- An earlier owner rule for the existing pipeline delegates implementation to a Sonnet agent; this package's README names Fable as builder. The package README governs here.

**Unverified capabilities:** U1–U12 in decisions.md. No Copilot chat session was started. Documentation wording was relayed by a page-extraction tool. Upstream tests were not executed and its largest files were read in part.

**Blockers and owner decisions needed:**

1. **Ignore rule.** The root `.gitignore` rule `/*/` ignores every new file under `rstack-sdlc/`; the four guidance files are tracked only because they were added explicitly. New files, including these two, do not appear in `git status`. The root `.gitignore` is outside the write scope, so the owner must either add an exception there or accept force-adding at commit time.
2. **Cost-tier rule (U3).** May prevent a `sonnet` Coordinator from dispatching `opus` or `sol` roles. Needs host observation, then an approved selection.
3. **Sample workspace location (U11).** A disposable workspace inside this repository may inherit the existing pipeline's agents and Skills. An approved location is needed before any live smoke test.

**Regression risk:** none; no existing file was modified.

**Rollback (corrected 2026-10-03):** S0 owns exactly `rstack-sdlc/docs/decisions.md` (entry D-S0) and `rstack-sdlc/docs/progress.md` (this record). Both files now also hold later entries, so S0 is rolled back by removing those two sections only, after checking `git status` and `git diff` for later changes to the same files. The branch, later batches, and unrelated work are left in place.

**Proposed next batch:** S1 — runnable core and local boundaries (03 §3): package manifest, versioned records, journal-backed state with expected-version updates, `start`/`status`/`next`/`submit`/`resume` commands, local request adapter, local proposal record, fake role transport, disabled Jira and Bitbucket stubs, and the adversarial tests for CORE-1 to CORE-4, STUB-1, STUB-2, and SCOPE-1. S1 needs no host access. Independently, the owner can run a short host probe for U1–U4 at any time; its results are only needed from S2.

**Update 2026-10-03:** the owner accepted S0 with refinements, recorded in decisions D-S0a. Blocker 1 (ignore rule) is resolved by the authorized `.gitignore` exception. Blockers 2 and 3 remain open as U3 and U11.

## S1 — runnable core and local boundaries — 2026-10-03

**Scope:** versioned records, engine entry points, journal persistence, local request and proposal adapters, fake role transport, disabled Jira and Bitbucket stubs. Not built: the planning workflow content (intent, spec, plan, amendments, second audit), HTML, generated host agents, any live host integration.

**Baseline:** branch `feat/rstack-sdlc-local-build` at `da64f6da4b583f01eb34886661a9cbcebab4116f`, with the uncommitted S0 records present. No commits were made.

**Files changed outside the package:** `.gitignore` only, one added line (`!/rstack-sdlc/`), as authorized.

**Files added (all untracked, under `rstack-sdlc/`):**

- `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`
- `core/contracts/`: `validate.ts`, `records.ts`, `ports.ts`
- `core/engine/`: `engine.ts`, `state.ts`, `journal.ts`, `lock.ts`, `drive.ts`, `errors.ts`
- `core/policies/workflow.ts`
- `adapters/`: `local-request/`, `local-pr-proposal/`, `fake-transport/`, `jira/`, `bitbucket/` (one `index.ts` each)
- `profiles/trial-v1.json`
- `scripts/`: `rstack.ts` (commands), `assembly.ts`, `synthetic-run.ts`, `check-scope.ts`
- `tests/`: six `*.test.ts` files, `sensitivity.ts`, `support/` (3 files), `fixtures/requests/REQ-001.md`
- `docs/decisions.md` (D-S0a and D-S1 appended), `docs/progress.md` (this record)

**Ignored outputs:** `node_modules/` (pinned tooling), `tests/.tmp/` (per-test fixtures), `.rstack/` (synthetic-run evidence). `dist/` does not exist yet.

**Runnable result:** `npm run demo:synthetic` takes `REQ-001` through plan, audit, a scripted decision, proof, implement, review, and the local proposal, ending `PR_PROPOSAL_READY` with `publication_status: NOT_ATTEMPTED`. Every role result in it is `SIMULATED` by the fake transport, and the decision is scripted, not human. The six engine commands are `node scripts/rstack.ts start|status|next|submit|decide|resume`.

**Checks actually run (Node v24.21.0, Windows 11):**

| Command | Class | Result |
|---|---|---|
| `npm run typecheck` | Static | 0 errors |
| `npm test` | Engine and fake-adapter tests, offline | 40 passed, 0 failed, about 6 s; run 4 times with the same result |
| `npm run test:sensitivity` | Test sensitivity, on throwaway copies | 15 of 15 broken guards detected; 5 control runs pass; live source digest unchanged |
| `npm run demo:synthetic` | Fake-adapter run | Exit 0, `PR_PROPOSAL_READY` |
| `node scripts/check-scope.ts --base da64f6d --allow .gitignore` | Scope | No violations; without the allowance it reports `.gitignore` only |

The first sensitivity run found a gap: disabling the journal checksum was not detected, because every damaged-record case was also caught by another check. A case that only the checksum can catch was added, and the rerun detects it.

**Fixture coverage:** CORE-1, CORE-2, CORE-3, CORE-4, STUB-1, STUB-2, MODEL-1 (profile validation only), SCOPE-1 (path rule and the real working tree). SECURITY-2 is covered only for run-id traversal; symlink escape is not tested.

**Evidence classes:** engine tests and fake-adapter tests only. Fable-host tests: none. Generated-package checks: none. VS Code live smoke tests: none. `CORE_TESTED` for the S1 behaviors listed; `COPILOT_VALIDATED`: no. `JIRA_DEFERRED`, `BITBUCKET_DEFERRED`.

**Limitations and unverified:**

- Durability limits are listed in decisions D-S1 (process kill tested; power loss, other operating systems, and network filesystems not tested).
- The engine refuses invalid transitions, but nothing stops a process with file access from editing a run directory. This is detect-after at best and is not a sandbox.
- A negative result on proof, implement, or review blocks the run; repair loops belong to S3. The human decision supports `proceed` and `reject` only; amendments and a second audit belong to S2.
- `base_ref` and `candidate_ref` in the proposal are strings supplied by the developer result; S1 does not verify a candidate.
- `recorded_by` on a decision is an unauthenticated label.
- The network-denial fixture replaces Node's network entry points inside the process; it is not an operating-system block.
- U1–U12 remain open. No host probe was run.

**Regression risk:** the root `.gitignore` change makes `rstack-sdlc/` visible to git; no other top-level directory is affected (checked).

**Rollback:** S1 owns these paths under `rstack-sdlc/`: `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`, `core/`, `adapters/`, `profiles/`, `scripts/`, `tests/`, sections D-S0a and D-S1 of `docs/decisions.md`, and this section plus the S0 status, rollback, and update edits in `docs/progress.md`. Before removing anything, run `git status --short --untracked-files=all` and compare it with this list; any path or edit not listed here is later or unrelated work and stays. Keep `tests/.tmp/` and `.rstack/` while they hold failed-test evidence that is still needed; they are ignored and can be deleted separately. The root `.gitignore` line is reverted only if the owner also wants the package hidden again, because the S0 records depend on it. No branch deletion is part of this rollback.

**Recommendation:** KEEP.

**Proposed next batch:** S2 — planning and the human-controlled audit loop (03 §4). Its host-facing part needs the U1–U4 probe and an approved disposable workspace (U11); its engine part (amendments, opt-in second audit, HTML brief) does not.

**Update 2026-10-03 — review baseline.** The owner retained S1 as the offline core baseline. A source snapshot of S1 as reported was preserved before any further change, in the ignored directory `rstack-sdlc/.rstack/baselines/s1-2026-10-03/`:

- `files/` — the 37 untracked authored files, at their repository paths;
- `tracked-changes.patch` — the root `.gitignore` delta (sha256 `8552ed1da30f0e684fb316f4323ed72e8c151d416a7c8b1d5469dcb2c4190dcf`);
- `inventory.json` — base commit `da64f6da4b583f01eb34886661a9cbcebab4116f`, each file's size and sha256, and the inventory digest `c0764fc72a233fcebcac30a3474b88017d1797b487ecac650f488bf897578716`.

To reconstruct: check out the base commit, apply the patch, copy `files/` over the repository root. The snapshot excludes `node_modules/`, run and test outputs, and itself. It is local and ignored; it is lost if `.rstack/` is deleted.

**Update 2026-10-03 — S1 statement corrected.** The S1 report said two simultaneous `next` calls return the same attempt. That was true and was a gap: both callers could then execute it. See decisions D-S1a and the S2 record below. The S1 files in the working tree have since changed; the snapshot above is S1 as reported.

## S2 — dispatch check, planning slice, and audit loop — 2026-10-03

**Scope:** the owner's prerequisite checks (S1 snapshot, dispatch ownership, simulation kept apart from verification, containment), then 03 §4: local source → intent → specification → plan → independent audit → combined HTML → human decision, with the generated planning package built locally. Not built: proof, implementation, review, or repair loops (S3); installer (S5); any install or live host run.

**Baseline:** branch `feat/rstack-sdlc-local-build` at `da64f6d`, uncommitted S0 and S1 work as preserved in the S1 snapshot. No commits, nothing staged. No root file changed in this batch; the only root difference remains the S1 `.gitignore` line.

**Dispatch check (prerequisite).** A gap existed and was corrected; details in decisions D-S1a.

| Measurement, real processes, fake-transport invocations counted | S1 baseline | After correction |
|---|---|---|
| Two concurrent drivers, invocations per attempt | 2 | 1 (3 rounds) |
| Driver killed mid-invocation, then a second driver | attempt invoked again | not invoked; stops `IN_FLIGHT` |
| Driver killed between dispatch commit and reply | not measured | 0 invocations; stays in flight until `abandon` |

The S1 regression was rerun after the correction and before S2 work: 44 passed (the 40 S1 tests, two of them updated for the new reply code, plus 4 dispatch tests).

**Files changed since the S1 snapshot** (all untracked, under `rstack-sdlc/`):

- New: `core/contracts/planning.ts`, `core/engine/brief.ts`, `core/engine/containment.ts`, `core/roles/planner.md`, `core/roles/plan-auditor.md`, `core/skills/planning-records/SKILL.md`, `adapters/copilot-vscode/coordinator.md`, `adapters/copilot-vscode/generate.ts`, `scripts/generate-package.ts`, `evals/rubrics/planning-run-v1.md`, `tests/planning.test.ts`, `tests/containment.test.ts`, `tests/dispatch.test.ts`, `tests/package.test.ts`, `tests/support/driver-child.ts`.
- Rewritten: `core/policies/workflow.ts`, `core/engine/state.ts`, `core/engine/engine.ts`, `adapters/fake-transport/index.ts`.
- Edited: `core/contracts/records.ts`, `core/contracts/ports.ts`, `core/engine/drive.ts`, `scripts/assembly.ts`, `scripts/rstack.ts`, `scripts/synthetic-run.ts`, `package.json`, the six S1 test files, `tests/sensitivity.ts`, `tests/support/harness.ts`, `docs/decisions.md`, `docs/progress.md`.
- Unchanged since S1: `core/engine/journal.ts`, `core/engine/lock.ts`, `core/engine/errors.ts`, `core/contracts/validate.ts`, the local, Jira, and Bitbucket adapters, `profiles/trial-v1.json`, `scripts/check-scope.ts`, `tsconfig.json`, `package-lock.json`, `.gitignore`.

**Generated and ignored outputs:** `dist/copilot-vscode/` (3 agents, 1 Skill, manifest), `.rstack/runs/` (synthetic runs, one with `evaluation/EVAL-1/`), `.rstack/baselines/` (S1 snapshot), `tests/.tmp/`.

**Checks actually run (Node v24.21.0, Windows 11):**

| Command | Evidence class | Result |
|---|---|---|
| `npm run typecheck` | Static | 0 errors |
| `npm test` | `CORE_TESTED` (engine, fake adapter) and `PACKAGE_TESTED` (7 package tests) | 68 tests: 67 passed, 0 failed, 1 skipped; about 7 s; same on 3 runs |
| `npm run test:sensitivity` | Test sensitivity on throwaway copies | 31 of 31 broken guards detected; 9 control runs pass; live source digest unchanged |
| `npm run demo:synthetic` | Fake-adapter run | Exit 0; `PR_PROPOSAL_READY`, `evidence_class: SIMULATED`, `candidate_verification: NOT_PERFORMED`, publication `NOT_ATTEMPTED` |
| `npm run generate:package` | Package generation | 4 files plus manifest; `UNVERIFIED_ON_HOST`; every `model` key omitted |
| `node scripts/check-scope.ts --base da64f6d --allow .gitignore` | Scope | No violations |

The skipped test is the file-symbolic-link case: this machine refuses to create file symbolic links without elevation or Developer Mode. Junction and directory-link escape were tested and are refused. File-symlink refusal is implemented by the same check but is not demonstrated here.

**Tests by file:** engine 13, planning 11, package 7, adapters 6, concurrency 6, containment 6, persistence 6, contracts 5, dispatch 4, architecture 4.

**Required S2 paths and where they are shown** (`tests/planning.test.ts` unless noted):

| Path | Result |
|---|---|
| Agreeing first audit (PLAN-2) | Brief only after the audit; human wait; repeated `next` hands out nothing; nothing authorized until `proceed` |
| Refuted audit, exact amendments, no re-audit (PLAN-3) | Verdict stays `REFUTED`; final plan `AMENDED_NOT_REAUDITED`, `amendments_audited: false`; one audit used |
| Second round on request, then resume (PLAN-4) | One revision, one second audit with inputs limited to source, intent, spec, revised plan; final human wait; third audit `ACTION_NOT_ALLOWED`; counters unchanged by resume |
| Pause and reject | Neither authorizes; an earlier decision cannot be replayed |
| Stale approval subject (PLAN-5) | Round-one subjects, another run's subjects, and a retained plan altered on disk are all rejected |
| Missing disabled-response intent (PLAN-1) | Open decision goes to the human; no specification dispatched; answer is handed to the planner as retained; bounded to three rounds |
| Script in a plan cannot execute in HTML | Payloads in intent, spec, plan, and audit appear escaped; only allow-listed elements and attributes; content policy forbids script and remote assets |
| Interruption and resume | Dispatch tests and PLAN-4 |
| Containment (`tests/containment.test.ts`) | Traversal, absolute and drive paths, sibling attempt, other run, run journal, junction in the attempt directory, junction as attempt or work directory: all refused, nothing retained |

**Basic independent evaluation (one synthetic run).** A fresh model session, given only the rubric `evals/rubrics/planning-run-v1.md` and the frozen run `RUN-20261003T132149-1b03dd8a`, wrote `evaluation/EVAL-1/evaluation.json` in that run. The run's evidence digest (24 files, excluding `evaluation/`) was `be9707ea…4afd08` before and after. The judge is the same model family as the builder, started without this session's context; that is a limit on its independence.

Its answers: human-gate **NO**; decision-basis, audit-independence-inputs, audit-honesty, plan-traceability, final-plan-disclosure, evidence-class **YES**; content-quality **UNKNOWN** (simulated content). Its judgment is kept as written. Points it raised, none acted on in this batch:

1. The decision in a simulated run has record type `human-decision` while its label says it was scripted; neither the state nor the final plan record carries that fact. (This is why it answered human-gate NO.)
2. The simulated audit marks a coverage item `CHECKED` while its limitation says nothing was examined; the engine checks that coverage is stated, not that it supports the verdict.
3. The workflow definition a run names is not retained in the run directory, and a failed attempt's failure record is identified by digest but not retained.
4. The proposal lists planning evidence by role-result identity, not by the record identities the decision names, and lists neither the decision nor the brief.
5. The reviewer stage's inputs do not include the final plan or the specification (S3 territory).
6. The rubric joins several conditions under single answers and does not say how to treat a scripted decision.

**Evidence classes, kept separate:**

- `CORE_TESTED`: yes, for the behaviors above.
- `PACKAGE_TESTED`: yes, for generation only (stable output, attribution, no unobserved selector, documented keys, write scope).
- `MANUAL_TRANSPORT`: not demonstrated. The command-line path a manual transport would use is tested, but with fixture content, not with a person or a host session producing role results.
- `COPILOT_VALIDATED`: no. Nothing was installed or run in VS Code.
- `JIRA_DEFERRED`, `BITBUCKET_DEFERRED`: unchanged; neither was researched or contacted.

**Limitations and unverified:**

- All role content in tests is simulated. Nothing here measures planning or audit quality, and the contract checks are about shape and cross-references only.
- Dispatch ownership depends on the caller obeying `IN_FLIGHT`; a host coordinator that ignores it is not prevented (U8).
- Auditor independence is enforced only in what the engine hands over. Whether a host gives a fresh context is U-level and unverified.
- The engine cannot tell whether an amendment changes scope or requirements.
- `recorded_by` remains an unauthenticated label; a decision record does not authenticate a human.
- Generated agent frontmatter and tool-set names follow documentation and are unverified on a host. Role agents need a file-editing tool that the host is not known to confine to the attempt directory.
- Durability limits are unchanged from D-S1.
- U1–U12 remain open. The profile is unchanged; no selector was resolved and no model was changed.

**Regression risk:** workflow version 2 changes the workflow identity, so runs started under S1 code are refused with `WORKFLOW_MISMATCH` (only disposable test runs existed). S1 reply code `PENDING_REDELIVERED` is now `PENDING_IN_FLIGHT`.

**Rollback:** to return to S1 as reported, restore from the S1 snapshot: for each path in its `inventory.json`, copy the file from `files/` over the working copy, and remove the S2-only paths listed under "New" above (plus `core/roles/`, `core/skills/`, `adapters/copilot-vscode/`, `evals/`). First run `git status --short --untracked-files=all` and compare with the "New", "Rewritten", and "Edited" lists; anything not listed is later or unrelated work and stays. `docs/decisions.md` and `docs/progress.md` are rolled back by removing sections D-S1a, D-S2, this record, and the two S1 updates, not by overwriting, so S0 and S1 records are kept. Keep `tests/.tmp/` and `.rstack/runs/` while failed-test or evaluation evidence is needed, and keep `.rstack/baselines/` in any case. The dispatch correction (D-S1a) can be kept while the planning slice is rolled back only by hand, since both touch `core/engine/engine.ts`. No root file and no branch is touched by this rollback.

**Recommendation:** KEEP.

**Proposed next batch:** S3 — proof to reviewed candidate and local proposal (03 §5), which replaces the simulated skeleton and should take up evaluation points 3 to 5. Before or alongside it, a host probe for U1–U4 and U11 in an approved disposable workspace would turn `PACKAGE_TESTED` into the first `MANUAL_TRANSPORT` or host evidence.

## S2a — evidence integrity and readiness — 2026-10-03

**Scope:** a targeted follow-up to S2: preserve the S2 baseline, examine the EVAL-1 findings against the code and records, apply the smallest corrections, evaluate a new run under a new identity, and record the S3 execution prerequisite. No S3 work, no install, no host probe, no model or profile change. Jira and Bitbucket were not researched or contacted.

**Baseline:** the S2 snapshot in the table at the top, taken before any edit. No commits, nothing staged, no root file changed.

**Findings from EVAL-1, each traced before acting.** The judge was not assumed right.

| Finding | What the records showed | Disposition |
|---|---|---|
| A. Decision provenance | The only trace that a decision was scripted was free text in `recorded_by`. State, final plan, and proposal carried nothing, and a non-simulated run would have accepted the same record. The judge was right that no human decision is recorded; the gate itself was exercised correctly | Corrected: `provenance` on the decision record; missing is `UNKNOWN`; non-simulated runs accept only `HUMAN_RECORDED`; final plan and proposal carry the decision identity, not a copy |
| B. Audit coverage | The fixture marked an item `CHECKED` with note "SIMULATED" while its limitation said nothing was examined. The engine checked only that coverage was non-empty | Corrected: the fixture performs and reports one real identifier comparison and marks the rest `NOT_CHECKED`; coverage items carry `evidence`; objective consistency rules and an `INCONCLUSIVE` verdict added |
| C. Workflow and unsuccessful attempts | The journal named a workflow identity that was not retained. Failure records were identified by digest only. Rejected submissions were already retained under `rejected/` (the EVAL-1 run had none). The profile was already retained | Corrected the two gaps: workflow definition and failure records are retained. A packet verifier resolves all identities from the packet alone |
| D. Planning-to-proposal references | The proposal listed role-result identities only and named neither decision nor brief; the final plan named neither | Corrected: final plan names decision, brief, specification, intent; proposal carries `planning_basis` |
| Audit `subject` names only plan and spec | The audit result is already bound to all four inputs through `input_digest` | Already satisfied; no change |
| Reviewer inputs lacked plan and specification | True of the simulated skeleton | Small correction: the reviewer stage is handed the final plan and the specification |

EVAL-1 and its run were not modified: run evidence digest `be9707ea…4afd08` and the evaluation file sha256 `e4d8278c…ae91f6` are unchanged. Rubric version 1 is unchanged.

**Beyond the request** (the owner invited improvements where the code showed a better option):

- The S3 prerequisite is enforced now, not only documented: abandoning an attempt on a stage that writes to the shared application blocks the run with `WORKER_QUIESCENCE_UNPROVEN`. Decisions D-S2a also recommends per-attempt isolation over quiescence evidence.
- A packet verifier (`evals/verify-packet.ts`) and rubric version 2, which separates the questions version 1 joined. It was not written to turn a NO into a YES: the scripted decision still answers NO.

**Files changed since the S2 snapshot** (all untracked, under `rstack-sdlc/`):

- New: `evals/verify-packet.ts`, `evals/rubrics/planning-run-v2.md`, `tests/evidence.test.ts`.
- Edited: `core/contracts/records.ts`, `core/contracts/planning.ts`, `core/policies/workflow.ts`, `core/engine/state.ts`, `core/engine/engine.ts`, `core/engine/brief.ts`, `core/roles/plan-auditor.md`, `core/skills/planning-records/SKILL.md`, `adapters/fake-transport/index.ts`, `adapters/copilot-vscode/coordinator.md`, `scripts/rstack.ts`, `scripts/synthetic-run.ts`, `.gitignore` (package-local, adds `.baselines/`), tests (`harness`, `planning`, `adapters`, `containment`, `engine`, `package`, `sensitivity`), `docs/decisions.md` (D-S2a), `docs/progress.md`.

**Checks actually run (Node v24.21.0, Windows 11):**

| Command | Evidence class | Result |
|---|---|---|
| `npm run typecheck` | Static | 0 errors |
| `npm test` | `CORE_TESTED`, `PACKAGE_TESTED` | 76 tests: 75 passed, 0 failed, 1 skipped; same on 2 runs |
| `npm run test:sensitivity` | Test sensitivity on throwaway copies | 38 of 38 broken guards detected; 10 control runs pass; live source unchanged |
| `npm run demo:synthetic` | Fake-adapter run | Exit 0; `PR_PROPOSAL_READY`; `authorization.provenance: SCRIPTED`; `SIMULATED`; candidate verification `NOT_PERFORMED`; publication `NOT_ATTEMPTED` |
| `npm run generate:package` | Package generation | OK; `UNVERIFIED_ON_HOST`; no model key |
| `node scripts/check-scope.ts --base da64f6d --allow .gitignore` | Scope | No violations |

The skipped test is unchanged: the file-symbolic-link escape case, which this machine cannot run without elevation or Developer Mode. Nothing was elevated or reconfigured.

Tests by file: engine 13, planning 11, evidence 8, package 7, adapters 6, concurrency 6, containment 6, persistence 6, contracts 5, dispatch 4, architecture 4.

**New evaluation.** Run `RUN-20261003T134523-c4ad9273` (workflow version 3; created after corrections A to D and before the quiescence blocker, which changes no record the evaluation reads). A fresh model session, given only rubric version 2 and the packet, wrote `evaluation/EVAL-2/evaluation.json`. The run evidence digest was `eacb552c…d6c07` before and after. The judge recomputed every checksum, artifact identity, and digest itself.

| Kept apart | EVAL-2 answer |
|---|---|
| The engine exercised the decision gate correctly (gate-ordering, brief-ordering, decision-basis) | YES |
| A human authorization was observed | **NO**: the decision is `SCRIPTED`. No run so far contains an observed human approval |
| Semantic planning or audit quality | **UNKNOWN** (content-quality), and audit-verdict-supported **NO**: the fixture verdict `HOLDS` rests on one identifier comparison with two of three items unchecked |

Other answers (audit-inputs, audit-coverage-stated, plan-traceability, final-plan-disclosure, planning-basis-links, evidence-class, unsuccessful-attempts, workflow-basis): YES.

Limits of this evaluation: the judge is the same model family as the builder, started without this session's context; one run; simulated content.

**Points EVAL-2 raised, recorded and not acted on:**

1. The labels `human-decision` and `AUTHORIZED` can mislead a reader who does not look at provenance.
2. The final plan carries the audit verdict but not the unchecked coverage, so a downstream role reading only the final plan sees an unqualified `HOLDS`.
3. Journal lines are checksummed individually and not chained; truncating trailing records would not be detectable from the journal alone.
4. The source provenance stores an absolute local path, which includes a person's name.
5. Role results name their files without hashes; the binding to retained content exists only in the engine's journal record.
6. The developer stage's inputs do not include the plan's work text (it is reachable through the final plan's reference).
7. Rubric version 2 defects: it does not say where proposal and brief identities resolve; one question is literally unanswerable as worded; coverage-stated cannot test whether the right items were listed; evidence-class still joins four conditions.

**Remaining host unknowns:** U1–U12, all open. S2a adds one consequence for the host: a coordinator must pass `--provenance HUMAN_RECORDED` only for what a human said, and nothing on the host is known to enforce that (U8).

**Limitations:**

- Provenance is a recorded claim. The engine cannot authenticate a person, and a process with file access could write a decision claiming `HUMAN_RECORDED`.
- Coverage rules catch self-contradiction, not unsound examination. A real auditor can still cite evidence it did not look at.
- `MANUAL_TRANSPORT` remains undemonstrated and `COPILOT_VALIDATED` remains no.
- Runs started under earlier workflow versions are refused by the current code; frozen runs remain readable as packets.

**Rollback:** to return to S2 as retained, restore from `.baselines/s2-2026-10-03/`: copy each file in its `inventory.json` from `files/` over the working copy and remove the three "New" paths above. First compare `git status --short --untracked-files=all` with the lists in this record; anything not listed stays. In `docs/`, remove section D-S2a and this record rather than overwriting, and keep the baseline table. Keep `.baselines/` and the two evaluated runs under `.rstack/runs/`. No root file and no branch is involved.

**Recommendation:** KEEP.

**Proposed next batch:** S3, with per-attempt isolation of the application and the delayed-worker regression from D-S2a as its first step, and EVAL-2 points 2, 5, and 6 taken up where S3 touches those records. A host probe for U1–U4 and U11 in an approved disposable workspace remains the first step toward any host evidence.

## S3 — proof to reviewed candidate and local proposal — 2026-10-03

**Scope:** 03 §5 on the synthetic application: controlled proof, bounded implementation, candidate verification by real test execution, the independent-review interface, and the local proposal. Not done: S4 evaluation work, any install or host run, any model or profile change, any remote publication. Jira and Bitbucket were not researched or contacted.

**Baseline:** the S2a snapshot (`.baselines/s2a-2026-10-03/`, inventory digest `8926ea77…809d4`), verified against the working tree before work resumed; the only difference was the documented table row. No new snapshot was created for S3, and no snapshot was modified. Before the first S3 edit: type-check clean, 75 passed and 1 skipped, matching the S2a result. The batch was paused once because the C: drive was full; work resumed at 10.7 GB free after the owner's cleanup.

**Baselines are not active sources (checked, no change needed):** the type-check reads 47 project files, none under `.baselines/`, `.rstack/`, or `dist/`; the test glob matches 12 files, none under `.baselines/`; the package generator reads eight explicitly named sources under `core/` and `adapters/`; the only recursive scans are of `core/`, a named source directory, or a test's own output; no snapshot contains a `.github`, `.claude`, `.agents`, or `.vscode` directory or any `.agent.md` file.

**Capabilities added:** see decisions D-S3. In short: a measured and retained application base; per-attempt application copies; a real test executor; proof acceptance by an actual red against the unchanged application; write boundaries checked by measurement; candidate identity by measured tree; verification from retained bytes; bounded return to the developer on failure; a review bound to the exact candidate and verification; invalidation when the execution environment changes; a proposal that names every link.

**Files changed since the S2a snapshot** (all untracked, under `rstack-sdlc/`):

- New: `core/contracts/app.ts`, `core/engine/tree.ts`, `core/engine/execution.ts`, `core/roles/tester.md`, `core/roles/developer.md`, `core/roles/reviewer.md`, `core/skills/application-records/SKILL.md`, `adapters/node-test-executor/index.ts`, `adapters/fake-transport/application.ts`, `tests/proof.test.ts`, and the fixture application `tests/fixtures/sample-app/` (`package.json`, `rstack.app.json`, `src/export.js`, `tests/existing.test.js`).
- Edited: `core/contracts/records.ts`, `core/contracts/planning.ts`, `core/contracts/ports.ts`, `core/policies/workflow.ts`, `core/engine/state.ts`, `core/engine/engine.ts`, `core/engine/drive.ts`, `adapters/fake-transport/index.ts`, `adapters/local-request/index.ts`, `adapters/copilot-vscode/generate.ts`, `adapters/copilot-vscode/coordinator.md`, `scripts/assembly.ts`, `scripts/rstack.ts`, `scripts/synthetic-run.ts`, `evals/verify-packet.ts`, tests (`harness`, `adapters`, `containment`, `engine`, `evidence`, `package`, `planning`, `sensitivity`), `docs/decisions.md` (D-S3), `docs/progress.md`.
- Unchanged since S2a: journal, lock, containment, brief, validation, errors, the Jira and Bitbucket stubs, the local proposal sink, the profile, both rubrics, `check-scope`, `generate-package`, `tsconfig.json`, `package.json`, `package-lock.json`, both `.gitignore` files.

**Checks actually run (Node v24.21.0, Windows 11), reported by evidence class:**

| Class | What | Result |
|---|---|---|
| Static | `npm run typecheck` | 0 errors |
| Deterministic engine tests | `npm test`: engine 13, planning 11, evidence 8, persistence 6, concurrency 6, containment 6, contracts 5, dispatch 4, architecture 4 | all pass except the 1 skip below |
| Actual application test execution | `tests/proof.test.ts`, 15 tests: the engine runs the fixture application's test command in a child process and judges the real report | 15 pass |
| Fake-transport role tests | Role content in every test above comes from the fake transport; `tests/adapters.test.ts` (6) tests the transport and stubs themselves | pass; all role results are `SIMULATED` |
| Actual independent model review | — | **Not demonstrated.** Review fixtures are simulated and labeled so |
| Generated-package checks | `tests/package.test.ts` (7) and `npm run generate:package` | pass; 8 files plus manifest (6 agents, 2 Skills); `UNVERIFIED_ON_HOST`; no model key |
| Pending VS Code validation | — | Nothing installed or run on a host. `COPILOT_VALIDATED`: no. `MANUAL_TRANSPORT`: not demonstrated |

Totals: `npm test` 91 tests, 90 passed, 0 failed, 1 skipped; same on 2 consecutive runs; about 25 s. `npm run test:sensitivity`: 47 of 47 broken guards detected, 11 control runs pass, live source unchanged. `npm run demo:synthetic`: exit 0. Scope check: no violations outside the package beyond the authorized root `.gitignore` line.

The skip is unchanged and deliberate: the file-symbolic-link escape test, which this machine cannot run without elevation or Developer Mode. Nothing was elevated or reconfigured. Junction escape is tested, including a junction planted in an application copy.

**Real synthetic-application demonstration** (`npm run demo:synthetic`, run `RUN-20261003T152641-3db49de1`): a vacuous proof is refused on the evidence of a real passing run (`PROOF_NOT_DISCRIMINATING`); the adequate proof fails by assertion on AC-1 against the unchanged application (exit 1) while AC-2, AC-3 and the two existing tests pass; a wrong implementation fails real verification and is sent back; the correct one passes all five tests (exit 0); the fixture review accepts; the local proposal is written. Final reply: `PR_PROPOSAL_READY`, publication `NOT_ATTEMPTED`, `evidence_class: SIMULATED`, `candidate_verification: PASSED_LOCAL_EXECUTION`, authorization `SCRIPTED`.

**Delayed-worker isolation evidence** (`tests/proof.test.ts`):

- Attempt A is dispatched, writes a change, and is abandoned. Replacement B is allowed and gets a different directory re-created from retained bytes, with nothing A wrote in it. B is accepted. A then rewrites its own copy, overwrites B's source file, empties B's controlled test on disk, and submits. A's result is `STALE_ATTEMPT`; the candidate identity and its retained bytes are unchanged; verification runs the retained candidate with all five tests, including the controlled test A emptied on disk; the proposal names B's candidate and verification.
- The same at the proof stage: a late tester weakening a test file changes neither the retained proof nor the developer's copy made from it.
- The limit, also as a test: A writes into B's copy before B submits. This is not prevented. The engine measures what is there, verification fails on it, and nothing is proposed.
- The blocker `WORKER_QUIESCENCE_UNPROVEN` still fires for a stage marked as sharing a write target (`tests/evidence.test.ts`).

**Traceability** (asserted link by link in `the proposal traces to…`, and resolved from a packet copy without `work/` or `exec/`):

request snapshot → intent → specification → plan → audit → brief → decision (provenance) → final plan (amendments, unchecked audit coverage, specification as criteria basis) → proof (criterion to test map) → proof tree → baseline execution record (ran the proof tree; AC-1 red by assertion) → candidate tree → verification execution record (ran the candidate; names the proof) → review (names candidate, verification, specification, proof) → proposal (names all of the above; publication not attempted).

**EVAL-2 observations, all carried here with dispositions.** EVAL-1, EVAL-2, their runs, and both rubrics are unchanged (hashes re-checked after S3).

| # | Observation | Disposition |
|---|---|---|
| 1 | Integrity checks the judge performed | Informational |
| 2 | `human-decision` and `AUTHORIZED` labels can mislead without provenance | Open. Terminal replies and status now state provenance beside the authorization; the record type name is unchanged |
| 3 | Run timing consistent with a scripted decision | Informational |
| 4 | Final plan did not carry unchecked coverage | Addressed in S3: `audit_unchecked` and `audit_checked_items`; the reviewer also receives the complete audit |
| 5 | Audit subject names only plan and spec; coverage list chosen by the fixture | Subject binding already covers all inputs through `input_digest`. Whether the right items were examined is a semantic question, left for S4 |
| 6 | "FIXTURE" versus "SIMULATED" wording; role results have no structured evidence class | Open. The class is recorded per run and now per proposal (`evidence_classes`); a per-result field was not needed for S3 |
| 7 | Role results name files without hashes | Consumer path inspected: nothing downstream reads a role's file by name. The engine binds content at submit and consumers use the journal identity. For S3 the candidate and proof are measured by the engine, not reported by a role. No change |
| 8 | Skeleton results were placeholders | Addressed in S3: real proof, measured candidate, real verification |
| 9 | Developer inputs lacked the plan's work text | The developer receives the final plan, which names the audited plan by identity. Open for S4 whether to hand the plan itself |
| 10 | Journal lines are not chained | Assessed in decisions D-S3: a tampering threat, not a correctness blocker; chaining alone would not detect truncation. Retained for the integrity assessment and Astra's review |
| 11 | Absolute local path with a person's name in source provenance | Addressed for new runs: the locator is the file name only, and execution output has the local directory replaced. Frozen runs are not rewritten |
| 12–15 | Rubric version 2 wording defects | Left for S4. No rubric was changed, so no measurement was altered |
| 16 | Fixture intent and specification elaborate on the request | Fixture text; no change |

**Remaining host unknowns:** U1–U12, all open. S3 adds: whether a host role agent can run the application's tests in its own copy (terminal tool), and whether anything confines a role's file and terminal tools to its attempt directories (U8). The generated tester, developer, and reviewer agents follow documentation only.

**Limitations:** those in decisions D-S3, and: all roles are simulated, so nothing here measures the quality of a proof, an implementation, or a review; the decision in every run is scripted; `MANUAL_TRANSPORT` and host execution are not demonstrated; the engine executes role-written code without a sandbox.

**Regression risk:** workflow version 5 changes the workflow identity, so runs started under earlier code are refused; frozen runs remain readable as packets. `start` now requires an application directory. The proposal record and the terminal reply have new fields.

**Rollback:** to return to S2a, restore from `.baselines/s2a-2026-10-03/`: copy each file in its `inventory.json` from `files/` over the working copy and remove the "New" paths above. First compare `git status --short --untracked-files=all` with the lists in this record; anything not listed stays. In `docs/`, remove section D-S3 and this record rather than overwriting; keep the baseline table. Keep `.baselines/` and the evaluated runs under `.rstack/runs/`. No root file and no branch is involved.

**Recommendation:** KEEP.

**Proposed next batch:** S4 — independent evaluations (03 §6), which is also where the rubric defects and observations 2, 5, 6, and 9 belong. Any host evidence still starts with the U1–U4 and U11 probe in an approved disposable workspace.

## S4 — independent evaluations — 2026-10-03

**Scope:** 03 §6: an evaluator input and output contract, deterministic packet and result validation, a fresh-session judge workflow, versioned per-run evaluations, append-only human adjudication, and one cross-run summary. Not done: S5 packaging work, any install or host run, any model or profile change, any network or service integration. Jira and Bitbucket were not researched or contacted.

**Starting point:** S3 as retained, uncommitted on `feat/rstack-sdlc-local-build` at `da64f6d`. The commit does not identify it; the S3 record's file lists do, together with a digest taken before the first S4 edit: sha256 `f440c4bb35cf33269ddc01a3c68a29a5963d2c9e1e59dbf00cbf84a317ea884a` over the sorted `sha256sum` lines of the 70 untracked files then present under `rstack-sdlc/`. That count includes `docs/parallel-host-readiness.md`, which belongs to the parallel host-readiness session and was neither read nor changed here. No new snapshot or baseline directory was created. Before the first edit: type-check clean, 90 passed and 1 skipped, as reported for S3.

**Files changed since S3** (all untracked, under `rstack-sdlc/`):

- New: `evals/rubrics.ts`, `evals/rubrics/run-v3.md`, `evals/deterministic.ts`, `evals/evaluation.ts`, `evals/summary.ts`, `scripts/evaluate.ts`, `scripts/eval-cases.ts`, `tests/evaluation.test.ts`.
- Edited: `core/engine/engine.ts` and `core/contracts/app.ts` (evidence class recorded on each accepted result and each execution record), `adapters/fake-transport/application.ts` and `index.ts` (one more deliberately deficient proof variant), `tsconfig.json` (type-check now includes `evals/`), `tests/sensitivity.ts`, `docs/decisions.md` (D-S4), `docs/progress.md`.
- Unchanged: `evals/verify-packet.ts`, rubric versions 1 and 2, the workflow definition, every other engine file, the profile, the package generator.

**Ignored outputs added:** six case runs under `.rstack/runs/`, each with `evaluation/EVAL-1/`; `.rstack/s4/` (`expectations.json`, `summary-run-v3.json`, and `imports/` with one copied run). Existing baselines, frozen runs, EVAL-1, EVAL-2, and their rubrics were re-hashed after S4 and are unchanged.

**Checks actually run (Node v24.21.0, Windows 11):**

| Command | Result |
|---|---|
| `npm run typecheck` | 0 errors (now includes `evals/`) |
| `npm test` | 101 tests: 100 passed, 0 failed, 1 skipped. By file: proof 15, engine 13, planning 11, evaluation 10, evidence 8, package 7, adapters 6, concurrency 6, containment 6, persistence 6, contracts 5, dispatch 4, architecture 4 |
| `npm run test:sensitivity` | 57 of 57 broken guards detected, 12 control runs pass, live source unchanged (10 of the guards are evaluation guards) |
| `npm run generate:package` | OK, 8 files plus manifest, `UNVERIFIED_ON_HOST` |
| `node scripts/check-scope.ts --base da64f6d --allow .gitignore` | No violations |

The one skip is unchanged: the file-symbolic-link escape test, which this machine cannot run without elevation. Nothing was elevated.

Required tests and where they are (`tests/evaluation.test.ts`): missing, altered, and checksum-failing evidence is reported; a valid packet is not falsely rejected; malformed judge output is rejected (12 variants); re-evaluation gets a new identity and leaves the earlier one byte-identical; a run imported twice is counted once; adjudication is appended and the judge file stays byte-identical; unknown, not-applicable, and unavailable values stay as they are; evaluating a run executes nothing and leaves its evidence digest unchanged.

**Cases.** All role content is `SIMULATED` and every decision `SCRIPTED`; the application tests in each run were actually executed. "Expected" is what the fixture was built to show, not a human label.

| Case (run id suffix) | Built to show | Deterministic result | Judged |
|---|---|---|---|
| clean-success (`dc9f7527`) | A controlled workflow that completes | `PROPOSAL_READY`, all 7 control checks pass | Yes |
| insensitive-proof-accepted (`47e12c3e`) | A proof the engine accepts although one already-satisfied test asserts nothing | `PROPOSAL_READY`, all control checks pass (the engine cannot see the defect) | Yes |
| refusals-then-success (`14336881`) | An inadequate proof and a wrong implementation refused, then success | `PROPOSAL_READY`; 1 refused proof, 1 failed verification on record | No judge output was written; its prepared evaluation is recorded as `REJECTED` (missing) |
| wrong-implementation-blocked (`b2bc4606`) | A wrong implementation refused twice | `BLOCKED: VERIFICATION_FAILED`; controls pass; task not completed | Yes |
| interrupted-at-human-wait (`9e8b6abd`) | A workflow stopped before the decision | `WAITING_HUMAN`; later checks not applicable | Yes |
| evidence-removed-after-run (`e19d012a`) | Evidence that no longer resolves | packet does not resolve; no judgment requested | No (by design) |
| retained S3 demonstration (`3db49de1`) | Reused as recorded | `PROPOSAL_READY`, controls pass | No |

Five older runs (workflow versions before 5, including the runs of EVAL-1 and EVAL-2) are listed as not interpreted and enter no metric. The clean run copied under `imports/` was recognized as the same run.

**Cross-run summary** (`.rstack/s4/summary-run-v3.json`; rubric `run-v3`; latest accepted evaluation per run). 12 distinct runs seen, 1 duplicate ignored, 5 not interpreted, 7 interpreted.

| Metric | Denominator | Counts |
|---|---|---|
| Packet integrity | 7 runs | 6 resolve, 1 does not |
| Run outcome | 7 runs | 5 proposal ready, 1 blocked (verification failed), 1 waiting for a human |
| Task completed | 7 runs | 4 completed, 2 not completed, 1 records a proposal but its evidence does not resolve |
| Final candidate verification (actual execution) | 6 runs that ran one | 5 pass, 1 fail |
| Unsuccessful work on record | 7 runs (totals) | 4 failed verifications, 2 refused submissions, 3 failed or abandoned attempts |
| Proof sensitivity | 18 criteria in accepted proofs | 6 red-green: demonstrated; 12 already-satisfied: not demonstrated (their tests passed, which shows nothing about sensitivity) |
| Role content class | 7 runs | 7 simulated |
| Human authorization | 6 runs with an authorizing decision | 6 scripted, human observed: no |
| Host validation | 7 runs | 7 not observed |
| Control checks | 5 to 7 runs each | all pass where applicable, except packet-resolves fails for the damaged run; not-applicable results (1 to 2 per check) are outside the denominators |

Judge answers, 4 runs with an accepted `run-v3` evaluation (3 interpreted runs have none):

| Question | YES | NO | UNKNOWN | NOT_APPLICABLE |
|---|---|---|---|---|
| spec-fidelity | 4 | 0 | 0 | 0 |
| plan-serves-spec | 4 | 0 | 0 | 0 |
| audit-verdict-supported | 0 | 4 | 0 | 0 |
| candidate-within-scope | 3 | 0 | 0 | 1 |
| review-verdict-supported | 0 | 2 | 0 | 2 |
| human-authorization-observed | 0 | 3 | 0 | 1 |
| proof-red-meaningful | 3 | 0 | 0 | 1 |
| proof-satisfied-sensitive | 2 | 1 | 0 | 1 |
| verification-supports-candidate | 2 | 1 | 0 | 1 |
| unsuccessful-work-visible | 1 | 0 | 0 | 3 |
| evidence-classes-stated | 4 | 0 | 0 | 0 |
| outcome-claim-accurate | 3 | 1 | 0 | 0 |

The judges answered on fixture text and said so. These counts describe the fixtures and the judges' reading of them. They are not evidence about any model's planning, implementation, or review.

Agreement with fixture expectations: 27 of 27 compared answers agree. The deficient case was told apart from the sound one: the judge of `47e12c3e` found the test that asserts nothing and answered NO on proof sensitivity and on the outcome claim, while the judge of the clean run answered YES on both. The engine itself accepted both proofs; this is the limit recorded in D-S3, now measured.

**Delayed-worker and write-boundary limitation, stated as evaluated.** The S3 test in which a late worker's write into the live attempt was caught shows one contamination that verification happened to detect, because it broke a test. It does not show that pre-submit contamination is detectable in general: a write that leaves the tests passing would be measured, verified, and proposed, and only a reviewer reading the candidate could notice it. No case here measures that, and no claim is made about it.

**Human calibration: HUMAN CALIBRATION PENDING.** No human adjudication has been recorded. Fixture expectations and judge answers are not human labels. The decisions requested from the owner are listed in the S4 report; each is recorded with `node scripts/evaluate.ts adjudicate … --provenance HUMAN_RECORDED`.

**Update 2026-10-03 — two owner adjudications recorded; calibration otherwise pending.** Appended through `scripts/evaluate.ts adjudicate` with provenance `HUMAN_RECORDED`, recorded as an owner instruction given in the builder session chat (a recorded claim, not an authenticated identity). The judge files are byte-identical to their accepted hashes.

- C5, run `RUN-20261003T161612-b2bc4606`, `EVAL-1`, `verification-supports-candidate`: `CONFIRM` (owner answer NO). The verification was attempted and failed; the absence of a review or proposal does not make that inapplicable. Blocking was correct control behavior, and the NO is not a claim that the engine should have proceeded. The question's joined wording is noted for a later rubric version.
- C6, run `RUN-20261003T161614-9e8b6abd`, `EVAL-1`, `unsuccessful-work-visible`: `CONFIRM` (owner answer NOT_APPLICABLE). A zero-event journal is not a demonstrated success; not-applicable answers are to be shown separately and excluded from this metric's applicable-case denominator. The rule covers this zero-event case only, not a missing or incomplete journal; the two other runs with the same judge answer are not adjudicated.

Open follow-up from C6, not implemented: the stored summary reports judge answers with the number of evaluated runs as denominator and lists `NOT_APPLICABLE` among the counts. Excluding not-applicable answers from the denominator is a change to `evals/summary.ts` and needs authorization. The stored summary file was not regenerated.

**Further owner adjudications recorded 2026-10-03** (same mechanism and provenance; recorded as owner feedback on excerpts shown in the chat, not as an independent execution or source review; judge files unchanged; not applied to any other run):

- C1, run `RUN-20261003T161609-dc9f7527`, `EVAL-1`, `audit-verdict-supported`: `CONFIRM` (owner answer NO).
- C2, same run and evaluation, `review-verdict-supported`: `CONFIRM` (owner answer NO).
- C3, same run and evaluation, `proof-satisfied-sensitive`: `UNRESOLVED`. No owner answer yet; the frozen test source was shown to the owner for a later decision.
- C4, run `RUN-20261003T161610-47e12c3e`, `EVAL-1`, `outcome-claim-accurate`: `MODIFY`, owner answer YES, limited to the declared mechanical meaning of the status values. The judge's NO stays on file. The question does not say whether a status claim is read by its defined meaning or its plain wording; that gap is noted for a later rubric version.
- C5 and C6 were already recorded above and were not duplicated.

Calibration status at that point: five owner answers on file (C1, C2, C4, C5, C6), one case unresolved (C3).

**Final calibration decisions recorded 2026-10-03** (owner instruction in the builder session chat; same mechanism and provenance; S4 remains paused; nothing was rerun, re-evaluated, or changed in the rubric, the runtime, or the application proof):

- C3, run `RUN-20261003T161609-dc9f7527`, `EVAL-1`, `proof-satisfied-sensitive`: `MODIFY`, owner answer NO, appended as entry 4 after the earlier `UNRESOLVED` entry, which stays. The judge's YES stays on file and the judge file is byte-identical to its accepted hash. Reason: under the criterion-level interpretation adopted for this calibration, the named tests do not cover a material unauthorized-input case. The AC-3 test meaningfully checks `user: null` with both flag values but does not exercise a present user object with `authorized: false`, which the implementation also treats as unauthorized; a regression that keeps null-user rejection while losing that rejection could escape the described checks. Qualifications: this is source-based reasoning, not an executed mutation result; AC-3 has meaningful tested cases and is not described as having no working test; absent exporter-parameter assertions are not counted against AC-2 unless its approved criterion requires those parameters; the owner interprets sensitivity at the material criterion-case level, not merely as "some tested input could make an assertion fail". Checked before recording: the frozen approved specification states AC-3 as "An unauthorized request invokes the exporter zero times in either mode." and does not limit unauthorized inputs to `user: null`, so there is no contradiction and the requirement is not broadened.
- C4: the recorded owner YES is retained and no further entry was appended. Its limit stands: accuracy under the documented mechanical status definition, not adequate proof, substantive review, observed human authorization, or real-publication readiness. The wording ambiguity is preserved: the judge used the ordinary meaning of "ready", the owner the defined mechanical meaning. The disagreement is not a proven judge error, and this case is not to be used as an unqualified judge-accuracy benchmark. The original evaluation and the rubric are unchanged.
- Note for a future rubric revision, not implemented: separate (1) status accuracy under its defined contract from (2) substantive evidence sufficiency.

Calibration status: owner adjudication complete for C1–C6 (four `CONFIRM`: C1, C2, C5, C6; two `MODIFY`: C3, C4). The stored summary file was not regenerated. S5 is not authorized by this record.

**Judge limitations:** same model family as the builder, started without this session's context; effective model not observable (self-reported only); one judge per run, no repeats; four judged runs; the preparation files sit in the directory the judge writes to, and two judges reported seeing the name `deterministic.json` without opening it; the judge's write boundary is checked afterwards, not prevented.

**Concerns recorded for Astra and later work** (not acted on):

1. The engine accepts an already-satisfied proof whose test asserts nothing. Only a reader of the test source catches it (measured above).
2. Pre-submit contamination of an attempt's directory that keeps tests passing is not detectable by the engine.
3. The blocked status of a run exists only in derived state; the journal's last record is the failed verification. A judge noted this.
4. In the blocked case the second developer attempt produced a byte-identical candidate, which the engine verified again. Nothing rejects an unchanged retry.
5. The proposal's `evidence_classes` does not include the decision's provenance; it is reachable through the decision identity.
6. The final plan records `amendments_audited: false` even when there are no amendments.
7. Role results for stages that write the application have empty `files`; what changed is visible only by comparing trees.
8. Preparation files and the judge's output share a directory.
9. Rubric version 3: question 10 does not say what to answer when there was no unsuccessful work; question 8 has no clear answer when no review exists; question 11 still covers four classes; question 7 does not catch a candidate that falls short.
10. Journal chaining and local write access to run directories, as assessed in D-S3.
11. An evaluation that is prepared and then checked before any judge writes is recorded as `REJECTED` (missing output). That is accurate but indistinguishable in the listing from a malformed output without reading the issues.

**Remaining host unknowns:** U1–U12, all open. Host validation is `NOT_OBSERVED` in every run.

**Regression risk:** two record additions (`evidence_class` on accepted results and execution records). Runs recorded earlier under version 5 lack the field and are still interpreted; the report derives the class from the run.

**Rollback:** remove the eight "New" paths; restore `tsconfig.json` to its include list without `evals`; remove the `evidence_class` lines from `core/engine/engine.ts` and `core/contracts/app.ts`, the `insensitive` variant from the two fake-transport files, and the ten evaluation entries from `tests/sensitivity.ts`; remove section D-S4 and this record. First compare `git status --short --untracked-files=all` with these lists; anything not listed, including the parallel session's report, stays. Keep `.baselines/`, all runs and evaluations under `.rstack/runs/`, and `.rstack/s4/`. The S2a snapshot predates S3 and S4 and is not the rollback point for this batch. No root file and no branch is involved.

**Recommendation:** KEEP.

**Proposed next batch:** S5 — extension and packaging challenge (03 §7). Human calibration of the listed judgments can be done at any time and does not block it.

### Host validation status and the parallel readiness report — recorded 2026-10-03

`docs/parallel-host-readiness.md` (owned by the parallel session; read at the S4 boundary, not edited; sha256 begins `7936faf2`) is evidence to inspect. It is not a review or certification of this implementation, and it changes no decision.

**Blocker scope.**

- Live Copilot validation is blocked on the selected account and environment: the report found that the GitHub account signed in to VS Code on this machine has no active Copilot licence (its local-log evidence, not re-verified here). Nothing was probed live.
- Offline work is not blocked: engine tests, evaluator tests, and offline package generation and checks continue.
- Still unverified: model selectors, effective model routing and tiers, effort, and every host enforcement question (U1–U12). `COPILOT_VALIDATED` remains no and `MANUAL_TRANSPORT` remains undemonstrated.
- Not changed and not to be changed without the owner: target host, model profile, effort settings, account, authentication, VS Code settings or version. No smoke workspace exists. The owner will name the licensed account or machine and approve the workspace and probe scope separately. A failed probe is not to be made to pass by switching model or transport.

**Notes from the report's section 5, triaged** (the report lists six; each was checked against the code it refers to):

| Note | Checked | Assigned to |
|---|---|---|
| The default engine command `node rstack-sdlc/scripts/rstack.ts` is relative to this repository and will not resolve from a workspace outside it; absolute paths here contain a space | Confirmed in `adapters/copilot-vscode/generate.ts`. The coordinator prompt also passes `--workspace .` | S5: the packaging acceptance case below |
| Engine command quoting under the default Git Bash profile (`--recorded-by "…"`, `--answer "…"`) | Not a confirmed defect: existing tests pass these arguments without a shell | S5 for an offline check through a shell from a path with spaces; S6 to confirm in the live session |
| Record a `host_selector` exactly in the observed `Name (vendor)` form | The profile accepts any string and the generator writes it unchanged (tested) | S6, when a selector is observed. No change now |
| A Skill's `name` must equal its directory name | Already so, and tested in `tests/package.test.ts` | S6 live check (the report's P2). No change |
| Tool-set names `execute`, `read`, `search`, `edit`, `agent` are unconfirmed | They come from documentation read in S0 and have not been observed on a host | S6 (P2). Stay `UNVERIFIED` |
| The experimental `context: fork` Skill mode should stay unused | The generator does not emit it | No action |

**Packaging acceptance case added to S5** (also in decisions, under D-S4): the generated engine invocation must work outside the development repository. S5 must choose an installation and root-resolution design and test it from an unrelated working directory, including a path containing spaces, with the three roots kept distinct:

- *package root*: where the engine code and authored content live;
- *application root*: the application a request is about, read and measured, never written;
- *run root*: where `.rstack/runs/<run-id>/` is written.

The test must not depend on this checkout's personal path, must not copy the whole project, and must not create a worktree. Nothing was installed or generated for this now.

## S4 completion — summary reading after owner adjudication — 2026-10-03

**Scope:** the narrow reporting check the owner asked for after adjudicating C1–C6. Nothing was rerun or reopened: no judge, rubric, evaluation, adjudication entry, status definition, or application proof was changed.

**Changed:** `evals/summary.ts` (summary schema version 2), `tests/evaluation.test.ts` (one new test), `tests/sensitivity.ts` (two guards), decisions (addendum to D-S4).

- C6: judge-answer denominators now hold applicable answers only (`YES`, `NO`). `NOT_APPLICABLE` and unavailable answers are counted separately. A question with no applicable case reads `NO_APPLICABLE_CASES`; no rate or percentage exists in the summary.
- C4: the judge's NO stays in the judged counts. The owner's YES appears only in the owner-adjusted tally of that question, together with the full C4 note. A differing owner answer is not classified as a judge error and no judge-accuracy figure is computed.
- C3: four adjudication entries are on file for run `dc9f7527`; the summary counts three cases there and selects the later `MODIFY` for C3, listing the earlier `UNRESOLVED` entry under it.

**Recalculated on the stored S4 data** (written to the new `.rstack/s4/summary-run-v3-calibrated.json`; the original `summary-run-v3.json` is byte-identical, sha256 begins `b4dd84b1`): 7 human-recorded entries, 6 cases, 0 unresolved; latest labels 4 `CONFIRM`, 2 `MODIFY`; 2 cases where the owner's answer differs (C3, C4), each with its note.

| Question | Judge: applicable (YES / NO) | Not applicable | Unavailable | Owner-adjusted (YES / NO) |
|---|---|---|---|---|
| unsuccessful-work-visible | 1 (1 / 0) | 3 | 0 | 1 (1 / 0); C6 confirmed as not applicable |
| outcome-claim-accurate | 4 (3 / 1) | 0 | 0 | 4 (4 / 0), read with the C4 note |
| proof-satisfied-sensitive | 3 (2 / 1) | 1 | 0 | 3 (1 / 2), read with the C3 note |

Only the `9e8b6abd` not-applicable answer is owner-confirmed; the two other not-applicable answers on that question are the judges' and are outside the denominator on that basis alone.

**Test:** "summary: applicable denominators, no rate without applicable cases, and one owner decision per case" (scripted judge answers; its `HUMAN_RECORDED` entries are fixture claims). Both new guards are detected when broken (sensitivity results below, under S5).

## S5 — extension and packaging challenge — 2026-10-03

**Scope:** 03 §7. A replaced adapter, an alternate profile, an optional procedure, a retired instruction, a reproducible package that carries its runtime, portable engine invocation, and installation, drift detection, and removal in disposable directories. Not done: S6, any installation into a real workspace, any host run, any model, profile, or effort change to the active profile, any network or service integration. Jira and Bitbucket were not researched or contacted.

**Authorization:** owner continuation after C1–C6. It is not an independent source review; Astra reviews later.

**Starting point:** S4 as retained, uncommitted on `feat/rstack-sdlc-local-build` at `da64f6d`. No snapshot, baseline directory, clone, or worktree was created. `docs/parallel-host-readiness.md` was not edited (sha256 still begins `7936faf2`).

**Files changed in S5** (all untracked, under `rstack-sdlc/`):

- New: `adapters/copilot-vscode/install.ts`, `adapters/copilot-vscode/extensions.json`, `adapters/fake-file-drop-transport/index.ts`, `scripts/install-package.ts`, `tests/extension.test.ts`, `tests/install.test.ts`, `tests/portable.test.ts`, `tests/fixtures/profiles/alt-test-v1.json`, `tests/fixtures/extensions/change-notes/SKILL.md`, `tests/fixtures/extensions/obsolete-banner.md`.
- Edited: `adapters/copilot-vscode/generate.ts` (inputs validated, extensions, runtime, manifest version 2), `adapters/copilot-vscode/coordinator.md` (install-time placeholders, quoted full paths), `scripts/generate-package.ts`, `scripts/assembly.ts` (a deferred integration missing from an installation is an explicit refusal), `tests/package.test.ts`, `tests/sensitivity.ts`, `docs/decisions.md` (D-S5), `docs/progress.md`.
- Unchanged: everything under `core/`, `profiles/trial-v1.json`, the fake transport, both deferred placeholders, the evaluator apart from the S4 completion above, the rubrics, `package.json`, `tsconfig.json`, the package `.gitignore`.

**Generated or ignored outputs:** `dist/copilot-vscode/` (33 files, 236,735 bytes); `.rstack/s4/summary-run-v3-calibrated.json`. Disposable test directories created by the new tests under `tests/.tmp/` were removed after the runs passed; older test directories there were left as found.

**Adapter replacement.** A second fake transport drove the unchanged engine from request to `PR_PROPOSAL_READY`. With the same script (a timeout, a vacuous proof, a wrong implementation) both transports produced the same sequence of accepted and refused submissions and the same journal events; the refusals were the engine's. A simulated transport offered to a run started for manual transport was stopped before any dispatch. No core file names either transport.

**Profile replacement.** A run started with the alternate test profile records `alt-test` and applies its limits (one developer attempt before blocking, against two under the trial profile; the failed verification blocks in both). The package generated from it names the alternate assignments and writes no `model` key. The active profile file is byte-identical. Refused by name, by the engine and by the generator: schema version 2, an effort setting, a fallback list, an unknown field, and a selector not recorded as observed; and by the generator, a profile for another host. A refused generation left the previous output untouched.

**Optional procedure and retired instruction** (package inspection, not host loading). Adding the synthetic optional Skill added exactly one Skill file and one line in the one agent it names; every other agent, both required Skills, and the runtime stayed byte-identical; removing it restored the package byte for byte. The synthetic obsolete instruction, while active, appeared in exactly the two agents it names, after the complete authored text. Retired, its text is in no file of the package, the manifest keeps its id and reason, and every agent, Skill, and runtime file equals the package that never had it. Refused: an unsupported extensions version, any unknown field (including `tools` and `model`), redefining a required Skill, a source outside the package, and a retired instruction whose text is still in an emitted file.

**Package.** Two generations from the same inputs are byte-identical, in the tests and for `dist/copilot-vscode/` (content digest beginning `9237f111` both times). Every file has its source and both hashes in the manifest. Every relative import of a shipped file resolves to a shipped file. Not shipped (tested): baselines, run evidence, evaluations, guidance, tests, the generator, both fake transports, both deferred placeholders, anything of the previous pipeline, and any local path. Unobserved selectors leave the `model` key out; no effort key exists; tools per agent are unchanged from S3. The manifest states that Node is required and not bundled.

**Portable invocation** (`tests/portable.test.ts`). A package generated from the alternate profile was copied to another directory and its generated directory deleted; the package, an application copy, a workspace, a request file, and an unrelated working directory were five separate directories, each with a space in its path (package under 400 KB, application under 50 KB; the project was not copied). The package installed itself with its own installer, run from the unrelated directory. Then, using only the command lines in the installed coordinator, through `cmd.exe` from the unrelated directory:

- a simulated run went from `start` to `PR_PROPOSAL_READY`, the relocated engine running the application's tests itself;
- the run recorded the profile carried by the package (`alt-test`), not the checkout default;
- the run directory was in the workspace; the package, the application, and the working directory were byte-identical or empty afterwards;
- with module loads recorded, every file the engine process loaded came from the relocated package's `runtime/`; no network attempt;
- a package with one runtime file removed failed with `ERR_MODULE_NOT_FOUND` instead of finding the file elsewhere;
- without `--profile` the reply was `MISSING_INPUT`, and `--source jira` gave `INTEGRATION_NOT_CONFIGURED`; neither created a run;
- a decision's quoted free text arrived whole.

Under Git Bash the installed `start`, `next`, and a `decide` line with quoted text were each answered as one command. After the package was moved, `verify` reported `DRIFT` (package missing), and `uninstall` removed the customization files and left `.rstack/`.

**Installation and removal** (`tests/install.test.ts`, disposable directories only):

| Case | Result |
|---|---|
| Dry run | Reports eight `CREATE` actions; the workspace is byte-identical afterwards. Dry is the default |
| Unrelated files (`README.md`, `.github/workflows/ci.yml`, the user's own agent, `CODEOWNERS`, source) | Byte-identical after install, reinstall, update, failure, and removal |
| Existing file at an owned path | `BLOCKED` with `COLLISION`; nothing written, not even the files that did not collide |
| Installed file edited by the user | `verify` reports `DRIFT`; reinstall is `BLOCKED` with `USER_MODIFIED`; removal keeps the file with its edit and removes the other seven |
| Repeated install and removal | A second install changes no byte; install, remove, install, remove returns the workspace to its starting bytes and directories |
| Update from a regenerated package | Only unmodified owned files change; a Skill the package dropped is removed, or kept and blocking if the user edited it |
| Unsafe package manifest (escaping, absolute, or unowned path; unsupported version; edited package file) | Refused by name; workspace untouched |
| Unsafe install manifest (path outside the workspace, a user file, an unowned directory, unsupported version) | `uninstall`, `install`, and `verify` all refuse; nothing removed |
| `.github` that is a junction to another directory | Refused; nothing written through it |
| Workspace that contains the package (including this package and the repository root, dry run) | Refused |
| Failure injected at the first, a middle, the last file, and the manifest write; and during an update | `INSTALL_FAILED_ROLLED_BACK`; workspace byte-identical to before, earlier installation still clean |

The repository root's `.github/` and `.vscode/` were not written; no directory was created outside `rstack-sdlc/`.

**Checks actually run (Node v24.21.0, Windows 11):**

| Command | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm test` | 118 tests: 117 passed, 0 failed, 1 skipped. By file: proof 15, engine 13, evaluation 11, planning 11, evidence 8, package 8, install 7, adapters 6, concurrency 6, containment 6, extension 6, persistence 6, contracts 5, dispatch 4, architecture 4, portable 2 |
| `npm run test:sensitivity` | 75 of 75 broken guards detected, 15 control runs pass, live source unchanged (18 new: 2 summary, 4 generator, 11 installer, 1 assembly). Result kept in `.rstack/s5/sensitivity.json` |
| `npm run generate:package` (twice) | OK both times, 33 files, identical content digest, `UNVERIFIED_ON_HOST` |
| `node scripts/check-scope.ts --base da64f6d --allow .gitignore` | No violations |

The one skip is unchanged: the file-symbolic-link escape test, which this machine cannot run without elevation. Nothing was elevated. The Git Bash test ran; it would be reported as skipped on a machine without Git Bash.

**Evidence class: CORE/PACKAGE TESTED. `COPILOT_VALIDATED`: no.** Nothing in S5 was observed on the host. The account signed in to VS Code on this machine is reported to have no active Copilot licence; that remains the live-host blocker, and no smoke test was run or simulated. Host unknowns U1–U12 are all still open.

**Limitations:** those listed under D-S5, and:

- The second transport reuses the first one's scripted role content.
- "Required behavior remains" after retirement is shown as byte-identity of the package with one that never had the instruction, plus the unchanged engine tests. It is not an observation of an agent behaving.
- The portable run used `--simulated` and a scripted decision; the manual-transport path through the installed commands was exercised only for `start` and `next`.
- Type-checking does not cover the generated `runtime/` copy; it is the same source, compared byte for byte.

**Concerns for Astra** (not acted on; items 1–11 of the S4 list still stand):

12. The installed commands are absolute Windows paths with forward slashes in double quotes. That works in `cmd.exe` and Git Bash here; PowerShell and the Copilot terminal tool are untested.
13. The coordinator is told to give role agents the run directory; whether a role agent's file tools accept that absolute path, and stay inside it, is host unknown U8.
14. `ADOPT_IDENTICAL` makes an identical pre-existing file owned, so a later removal deletes it. Chosen so that an interrupted installation can be resumed; the alternative is to treat it as a collision.
15. The workspace-contains-package rule also forbids a legitimate layout (a package kept inside the workspace it serves).
16. The install manifest lives under `.github/` and holds absolute local paths.
17. Two manifests with different meanings (`rstack-sdlc-manifest.json` in the package, `rstack-sdlc-install.json` in the workspace) may be confused by name.
18. The runtime file list is derived from static imports by a regular expression; an unusual import form would be missed. The exact list is pinned by a test, and a missing file fails loudly.
19. The Node version requirement is declared and not enforced by the installer or the engine.
20. `tests/.tmp/` is not cleaned by the test suite and had grown to about 118 MB before S5 and is about 140 MB after it (directories left by the pre-existing tests during the S5 runs were not removed).

**Regression risk:** the generator no longer accepts an engine command or writes one; any caller of the old option breaks at type-check. Runs and evidence formats are untouched. `scripts/assembly.ts` changed only on the deferred-adapter path.

**Rollback:** remove the ten "New" paths; restore `adapters/copilot-vscode/generate.ts`, `coordinator.md`, `scripts/generate-package.ts`, `scripts/assembly.ts`, and `tests/package.test.ts` to their S4 content; remove the S5 entries from `tests/sensitivity.ts`; remove D-S5 and this record; regenerate or delete `dist/copilot-vscode/`. There is no S4 snapshot to copy from: the S4 state of those five files is not retained anywhere, so this rollback is by reversing the edits described here, which is weaker than the earlier batches' rollbacks. The S4 completion can be reverted separately (the two files named there and its two sensitivity entries). Keep `.baselines/`, all runs and evaluations, and both summary files.

**Recommendation:** KEEP.

**Proposed next batch:** S6 — VS Code acceptance and local pilot (03 §8). Not started and not authorized. It needs the owner to name a licensed account or machine and to approve the disposable workspace and the probe scope.

## R1 — installer repairs (D1, D2, D8) — 2026-10-03

**Status: FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION.** Base: review checkpoint `60c2ba9`. Unstaged and uncommitted. R2–R4 and S6 not started. The offline review report was not edited.

**Changed:** `adapters/copilot-vscode/install.ts`, `tests/install.test.ts`, `tests/sensitivity.ts`, `docs/decisions.md` (D-S5 wording and an R1 note), this record.

| Finding | Cause | Correction |
|---|---|---|
| D1 | An unmanaged file with identical bytes was planned `ADOPT_IDENTICAL`, written into the install manifest, and removed by a later `uninstall` | Any existing file no install manifest lists is `COLLISION`; `ADOPT_IDENTICAL` removed |
| D2 | The undo that recreates a removed Skill directory was registered before the file restore, so it ran after it; the failed restore was swallowed and a full rollback was claimed | Directory undo registered after the file undo; every undo failure collected and reported as `INSTALL_FAILED_ROLLBACK_INCOMPLETE` with `not_undone` (path, step, error, recovery) |
| Partial write (review §6) | The undo of a write was registered after the write, so a write failing part-way left a partial file or `.tmp` | Reproduced by fault injection; undo now registered before the write |
| D8 | `readInstallManifest` did not check `package`; `uninstall` and `verify` threw `TypeError` | Whole manifest shape validated before use |

**Before the fix** (new tests against the checkpoint installer): 4 of 10 installer tests failed — PACKAGE-1 (`PLAN_READY` where `BLOCKED` expected), the Skill-removal rollback (Skill file missing), the partial write (partial planner file left), the malformed manifest (`TypeError`). An end-to-end reproduction showed D1 `ADOPT_IDENTICAL` → `INSTALLED` → `uninstall` `REMOVE`, file deleted; D2 `INSTALL_FAILED_ROLLED_BACK` with `verify` `DRIFT` (`MISSING`); D8 `TypeError` from `uninstall` and `verify`.

**After the fix** (Node v24.21.0, Windows 11, no elevation):

| Command | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `node --test tests/install.test.ts` | 10 passed, 0 failed |
| `npm test` | 121 tests: 120 passed, 0 failed, 1 skipped (file symbolic link, needs elevation; unchanged) |
| `node tests/sensitivity.ts` | 80 of 80 broken guards detected (5 new installer guards, 2 existing ones re-pointed), 15 control runs pass, live source unchanged. Output kept outside the repository; `.rstack/s5/sensitivity.json` not rewritten |
| `node scripts/generate-package.ts` (twice) | OK both times, identical output, `UNVERIFIED_ON_HOST`. `dist/copilot-vscode/` was regenerated and its manifest hash changed (`a5dd9164…` → `219e0ab6…`) because the runtime carries `install.ts` |
| `node scripts/check-scope.ts --base 60c2ba9` | No violations |

Same reproduction after the fix: D1 `BLOCKED`/`COLLISION` for plan and apply, no manifest, `uninstall` `NOT_INSTALLED`, file intact; D2 workspace restored, `verify` `CLEAN`; D8 `INSTALL_MANIFEST_MALFORMED` from all three operations, nothing removed.

**Limits and open risks:**

- Fault injection replaces `fs.writeFileSync` inside the test process. It models a write that leaves partial bytes and then throws; a process killed mid-write, a full disk, and a failing `renameSync` or `rmSync` were not exercised.
- When restoring a file fails, its earlier bytes existed only in memory and are not saved anywhere; recovery is by reinstalling the earlier package, as the recovery note says. If restoring the install manifest fails, recovery is manual.
- A directory undo that fails because something else put a file there is now reported as an incomplete rollback, where it used to be ignored.
- An interrupted installation is no longer resumable: leftovers are collisions the user must remove.
- `uninstall` is unchanged: not transactional, and its removal loop has no failure reporting.
- Manifest validation checks types, not meaning: `package.root` may be any string, and `verify` reads the package manifest at that path (read only).
- All destinations were disposable directories under `tests/.tmp/`. Nothing here is host evidence; `COPILOT_VALIDATED` remains no.

**Rollback to the checkpoint:** `git restore --source=60c2ba9 -- rstack-sdlc/adapters/copilot-vscode/install.ts rstack-sdlc/tests/install.test.ts rstack-sdlc/tests/sensitivity.ts rstack-sdlc/docs/decisions.md`, remove this section, then `npm run generate:package` to put `dist/` back in step. That touches none of the untracked reports or retained evidence.

### R1 follow-up — pre-existing manifest temporary file — 2026-10-03

**Status: FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION.** From the R1 verification (`R1 CHANGES REQUESTED`): a file already at `.github/rstack-sdlc-install.json.tmp` was overwritten on success and deleted on rollback while a complete rollback was reported. Cause: the temporary path was not planned and its undo assumed the file was new. Correction (`install.ts`, plan phase): an existing file there is a `COLLISION`, so dry run and apply are `BLOCKED` before any write. Still unstaged and uncommitted; the verification report was not edited.

- New test "an existing file where the manifest is written through is a collision…": failed before the fix (`PLAN_READY` where `BLOCKED` expected), passes after. It covers a fresh installation and an update, dry run, apply, and apply with a partial-write fault; the earlier bytes survive each, and survive `uninstall`.
- Run after the fix: `npm run typecheck` 0 errors; `node --test tests/install.test.ts` 11 passed; `npm test` 122 tests, 121 passed, 1 skipped (symbolic link, unchanged); `generate-package` twice, identical output, manifest `cefbfb2f…`; `check-scope --base 60c2ba9` no violations.
- Sensitivity: the full suite was **not** rerun (started, then stopped at the owner's instruction to run only what changed; its disposable copy was removed). One guard was added to `tests/sensitivity.ts` and checked alone in a disposable copy: unmodified copy 11 pass; with the guard disabled the named test fails. The other 80 guards were last run before this follow-up (80 detected, 15 controls); their target lines are unchanged, but that is not a rerun.
- Not done: a sensitivity guard for the registration order of ordinary-file undo (the reviewer noted the existing one covers only the temporary file).
- Rollback: as for R1 above; the same four files.

### R1 sensitivity attempt of 2026-10-03 18:02 — INCOMPLETE; source freeze released

**Status of the attempt: INCOMPLETE.** It is not R1 verification evidence, and it does not establish passing controls or detected mutations. R1 stays `FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION`.

- What ran: one bounded `node tests/sensitivity.ts` against unchanged source, started 18:02:00 (wrapper pid 36287, 3 h budget). The host came under memory pressure around 19:16 and a session task was terminated. The runner exited by itself at 19:21:50 with code 1 and removed its disposable copy (`tests/.tmp/sensitivity-Ix82Yz`).
- What its output says, and why it is not relied on: 96 rows — 15 control rows `PASSES`, 79 guard rows `DETECTED`, 2 guard rows `NOT_DETECTED` with no failing tests (the last two: the deferred-integration refusal in `scripts/assembly.ts`, and write-scope detection in `scripts/check-scope.ts`). Their case directories appeared one second apart (19:16:40, 19:16:41), at the time of the memory event. The runner does not record a child's exit status or signal, so a test process that was killed or never started is indistinguishable from a mutation the tests did not notice. Neither reading is established. The directory-appearance log shows only that a case was started.
- Diagnostics kept, outside the repository and unmodified, in `Documents/r1-owner-verification/fable-sensitivity-20261003/`: `run.sh`, `before.txt`, `after.txt`, `progress.log` (sha256 begins `bb4ac967`), `stdout.json` (begins `d9afbaf8`), `stderr.txt` (empty), `exit-code.txt` (`1`). `.rstack/s5/sensitivity.json` was not rewritten.
- Processes, checked 19:29–19:33: no `node`, `bash`, `timeout`, or `sleep` process belonging to the runner or to this package remains. Nothing was killed by this session, and the run was not restarted.
- Source identity, start against 19:31: HEAD `60c2ba9` both times; `adapters/copilot-vscode/install.ts` `c45b51f0…`, `tests/install.test.ts` `72024333…`, `tests/sensitivity.ts` `50881ef6…` — identical at start, at exit, and now. `git status` lists the same four modified and four untracked paths. The runner's own before/after digest of the live source reports no change. `docs/parallel-host-readiness.md` still begins `7936faf2`. The two older directories `tests/.tmp/sensitivity-e3JBf7` and `sensitivity-luZDXl` predate the run and were left in place.
- One file changed during the window: `docs/astra-r1-verification.md` (written 18:09:34). It is the reviewer's report, is not a source or test file, and was not edited or overwritten by this session. No other file outside `tests/.tmp/` changed after 17:30.
- Open: whether those two guards are detected is unknown until they are rerun in a quiet window. A finding for R2 (`tests/sensitivity.ts`): the runner should record each child's exit status and signal and report a run that did not execute as such, not as `NOT_DETECTED`.
- Host note: at 19:29 free physical memory was about 1.7 GB of 64 GB and free commit about 160 MB; one directory listing in this session failed with an out-of-memory error. Heavy suites should not be started until that clears.

**SOURCE FREEZE RELEASED FOR R2/R3/R4.** (2026-10-03 19:35, by BUILD-02.)

The release authorizes development only. It does not authorize full R1 verification, installation, S6, staging, commits, pushes, or new snapshots, clones, or worktrees.

- BUILD-02 owns R2 (D6–D7), shared integration files, `docs/progress.md`, `docs/decisions.md`, `tests/sensitivity.ts`, and test scheduling.
- BUILD-03 owns R3 (D3–D4), then R4 (D5), within its approved file lane.
- Test windows: one heavy suite at a time on this host (`npm test`, `tests/sensitivity.ts`, or a full `--test` file run that copies the package). A session announces a window before starting one and does not test against files the other session is editing; single-file targeted tests in a session's own lane need no window. BUILD-02 schedules the windows.

**TEST WINDOW OPEN — BUILD-02, 2026-10-03.** One window, run in sequence, nothing overlapping: `tests/evaluation.test.ts`, then `tests/sensitivity.ts --cases …` (subsets only). BUILD-03: no edits under `core/`, `adapters/`, `scripts/`, `profiles/`, `evals/`, or `tests/`, and no test, generation, or installer runs, until the line "TEST WINDOW CLOSED" appears below. The window's source digest is taken before and after; a result from a window in which it moved is discarded.

**TEST WINDOW CLOSED — BUILD-02, 2026-10-04T00:32Z.** Source digest at open and at close: `752bd37c…9609` (unchanged). BUILD-03 could not be reached from this session; the notice above and the digest were the only coordination, and `git status` showed no change outside BUILD-02's files during the window.

## R2 — evaluation control and selection (D6, D7), and the sensitivity runner — 2026-10-03

**Status: FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION.** Base: review checkpoint `60c2ba9`, with the R1 changes in the tree. Unstaged and uncommitted. Nothing was installed or generated. R1's overall sensitivity closeout remains incomplete: no full sensitivity run was made here. The review reports were not edited. Design and limits: decisions, "R2 correction" under D-S4.

**Two separate changes.**

| Change | Files |
|---|---|
| A. Test tooling: the sensitivity runner | `tests/sensitivity.ts`: the header comment, the imports, and everything below `makeCopy` (selection, one bounded test process, the run). The 81 earlier cases keep their numbers |
| B. D6 and D7 | `evals/evaluation.ts`, `evals/summary.ts`, `evals/deterministic.ts` (one line: the control area is outside the packet), `tests/evaluation.test.ts` (two assertions updated for the new location, four tests added), and in `tests/sensitivity.ts` only the case list: cases 3 and 5 re-pointed to the lines that replaced theirs, cases 82–96 added under the comment `R2 (review findings D6 and D7)` |

Not changed: `scripts/evaluate.ts`, `scripts/eval-cases.ts`, `evals/verify-packet.ts`, `evals/rubrics.ts`, every rubric, everything under `core/`, `adapters/`, `profiles/`, and every other test. No BUILD-03 mutation or note was available to integrate.

**A. Runner.** `--cases 80,81` selects cases by number (`--list` prints them); a missing, empty, non-numeric, out-of-range, or repeated selection, an unknown option, and an output directory that already holds files are refused with exit code 2 before anything runs. Only the controls the selected cases depend on are run. Each test process has a time limit (`--timeout-ms`, default 10 minutes). Records are written as each process ends: `run.json` (git head, source digest, runner hash, the exact cases), `cases.jsonl`, and each process's stdout and stderr; `summary.json` at the end. A result is `DETECTED` or `NOT_DETECTED` only when the process ran to its end and printed its test count; otherwise it is `INCONCLUSIVE_NO_TEST_REPORT`, `INCONCLUSIVE_TIMED_OUT`, or `INCONCLUSIVE_NOT_RUN`, with exit status, signal, launch error, and duration kept. A case whose control did not pass is `INCONCLUSIVE_CONTROL` and is not run. Tests that fail without the named one are `FAILED_ELSEWHERE`; a case whose target text is gone is `MUTATION_NOT_APPLIED` (it used to abort the whole run). A stop request is honoured between processes and the rest is reported `INCONCLUSIVE_INTERRUPTED`. A subset says it is a subset and `full_sensitivity_pass` is false for it. Each copy is removed when its case ends, not at the end of the run.

Not exercised: the timeout, kill, launch-error, interrupted, and failed-control paths were not triggered by any run here; they are untested code. A process the limit kills may leave its own child processes behind; that is not tracked.

**B. D6 and D7.** As in the decisions paragraph. The four counterexamples of D6 and both of D7 are tests: a judge-written verdict, request, or adjudication (in either area) is `REJECTED`; altered evidence with a rewritten baseline is `REJECTED` by the recomputed packet check; an evaluation directory the judge creates rejects the evaluation and is not aggregated; an output edited or removed after acceptance is listed with the issue and not aggregated, and comes back when the bytes do; eleven evaluations select `EVAL-11`; a later-prepared evaluation is selected whatever its name; bare, stale, identical, diverged, and mid-run copies give the same summary in both argument orders.

**Checks actually run** (Node v24.21.0, Windows 11, one at a time; about 38 GB of memory free beforehand):

| Command | Result |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| `node --test tests/evaluation.test.ts` | exit 0; 15 passed, 0 failed (passed on its first run) |
| `node tests/sensitivity.ts --cases 80,81` | exit 0; controls `tests/portable.test.ts` and `tests/architecture.test.ts` pass; cases 80 and 81 `DETECTED`, each process `COMPLETED` with exit status 1, no signal, the named test failing. Records: `.rstack/r2/sensitivity-cases-80-81/` (`summary.json` sha256 begins `34f8e087`) |
| `node tests/sensitivity.ts --cases 1,…,10,60,61,82,…,96` | exit 0; 2 controls pass; 27 of 27 `DETECTED`. Records: `.rstack/r2/sensitivity-evaluation-cases/`. Cases 60 and 61 are extension guards, selected by mistake for the two summary guards; their results are valid and were not needed |
| `node tests/sensitivity.ts --cases 57,58` | exit 0; control passes; 2 of 2 `DETECTED` (the two summary guards). Records: `.rstack/r2/sensitivity-cases-57-58/` |
| `node --test "tests/*.test.ts"` | exit 0; 126 tests, 125 passed, 0 failed, 1 skipped (file symbolic link, unchanged). Output: `.rstack/r2/npm-test.tap` |
| Static check of all 96 cases (no test run) | every target text is present in the live source and every named test exists |
| Runner refusals (nothing run) | nine invalid invocations each exit 2 |
| `scripts/evaluate.ts summary` over `.rstack/runs` and `.rstack/s4/imports`, in both root orders, output outside the repository | identical output; the same four evaluations selected as in the stored calibrated summary; 7 human-recorded entries, 6 cases, 4 `CONFIRM`, 2 `MODIFY`; metrics, judge answers, and owner decisions equal to the stored file; `dc9f7527` reported as `MOST_COMPLETE_COPY`. The digest of every retained evaluation and S4 file was the same before and after (`5cc50950…`), and no control directory was created in a retained run |

**Sensitivity status, stated narrowly.** 31 of 96 cases were run in three subsets, all detected with passing controls: 1–10, 57, 58, 60, 61, 80–96. The other 65 were not run against this source. This is not a full sensitivity pass.

**The two unresolved results of the 18:02 attempt.** That record stands as written: exit code 1, 15 controls passing, 79 detected, two `NOT_DETECTED`. Here, cases 80 and 81 were detected, with their mutated files and test files unmodified from `60c2ba9` (`scripts/assembly.ts`, `scripts/check-scope.ts`, `tests/portable.test.ts`, `tests/architecture.test.ts`). That shows these guards are detectable in a quiet window. It does not show why the earlier rows said otherwise: the earlier runner kept no exit status or signal, so the cause remains unconfirmed, and neither row is relabelled.

**Limits and open points.**

- Those in the decisions paragraph: the control area is not protected from a process with file access, and an added evidence file with a rewritten baseline is not detected.
- An evaluation with an issue stops aggregation for its run; there is no command to set one aside. A person has to resolve it in the files.
- `request.json` gained an optional field (`judge_area_before`); the summary is schema version 3 with `duplicate_runs` and, per run, `not_aggregated`; runs are listed by id. The stored S4 summaries were not regenerated.
- `tests/.tmp/` still holds the directories the test runs leave behind; the drive has about 14 GB free.

**Rollback:** `git restore --source=60c2ba9 -- rstack-sdlc/evals rstack-sdlc/tests/evaluation.test.ts` returns B's source. `tests/sensitivity.ts` and `docs/decisions.md` also carry R1 changes, so there remove cases 82–96, restore the two re-pointed `find` lines, and remove the R2 paragraph by hand. `.rstack/r2/` is ignored evidence and stays.

### R2 correction 1 — stored-record validation, unreadable order, control contents of copies — 2026-10-04

**Status: FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION.** From `docs/astra-r2-verification.md` (`R2 CHANGES REQUESTED`; report sha256 `8f865f81…0c20b6`, not edited). Owner-authorized bounded pass by BUILD-02; BUILD-03 stays paused and was not released. HEAD `60c2ba9`, nothing staged or committed. The findings are not closed here.

Files changed in this pass: `evals/evaluation.ts`, `evals/summary.ts`, `tests/evaluation.test.ts`, this record. Not changed: `tests/sensitivity.ts`, `evals/deterministic.ts`, `scripts/`, `core/`, rubrics, `docs/decisions.md`, every retained run, evaluation, adjudication, and stored summary.

| Finding | Reproduced before (unfixed source) | Correction | After |
|---|---|---|---|
| **D6-R2-A** malformed controls accepted, crash the reader, or cause fallback | Newest acceptance `{`, `null`, `{}`: older `EVAL-2` selected, `not_aggregated: null`. Accepted request `null`: still selected, no issue; `{}`: `TypeError … reading 'id'` from `summarize` and from `acceptEvaluation`. Adjudication with schema 999, wrong type, unknown question, label `BANANA`: no issue, 1 human entry, `BANANA: 1` | `evaluation.ts`: `checkRequest`, `checkAcceptance`, `checkAdjudication` (exact fields, types, vocabulary, sequence, internal consistency). A present request or verdict that is not valid, a verdict without a request, or a verdict on another evidence digest gives status `INVALID` with the reason; its output and adjudications are not read. `acceptEvaluation` and `adjudicate` refuse such a record by name and write nothing. `summary.ts`: an `INVALID` evaluation of this rubric (or of unknown rubric) is a candidate for "latest", so it blocks instead of being skipped | Each case: nothing selected, `not_aggregated` names the evaluation and the reason; no exception; the `BANANA` entry is excluded and reported, 0 human entries |
| **D7-R2-A** invalid or missing preparation time selects an answer | `prepared_at` `not-a-time`, or the field removed, on the earlier evaluation: it was selected, no issue | The request check requires the exact form `toISOString` writes. Otherwise the evaluation is `INVALID`, has no place in the order (null time, listed last), and as the latest candidate blocks aggregation | Nothing selected; `not_aggregated: "EVAL-2: request.json is not a valid record: request.prepared_at: …"` |
| **D7-R2-B** conflicting control contents not reconciled | Copies differing only in `request.evidence.digest`, or only in the acceptance record: `IDENTICAL`, `EVAL-1` aggregated | Each stored evaluation carries the sha256 of its request and verdict files (`control_sha256`); copies are compared on them, and `duplicate_runs` variants show `request_sha256` and `acceptance_sha256`. No merging | Both pairs `EVALUATIONS_DIFFER`, nothing aggregated, same in both orders; also for two records that are each valid and differ (other `checked_at`, other `judge_writes`) |

Removed as unreachable: the acceptance issue "the request is not the one this evaluation was prepared under" (such a request is now refused before a verdict is written). One existing fixture changed: the planted colocated verdict in the D6 test is now a complete record, so that case still tests a judge-written verdict and not a malformed one; its assertions are unchanged.

**Evidence** (in `.rstack/r2/correction-1/`, ignored; Node v24.21.0; one process at a time; about 37 GB memory and 13 GB disk free; no other package process running before the first run):

| Check | Result |
|---|---|
| `repro.ts` (asserts nothing, prints behavior) on unfixed, then fixed source | exit 0 both; `repro-before.json` `19ddca7c…`, `repro-after.json` `fac4dec5…`; contents as in the table above |
| The two new tests alone, unfixed source | exit 1; 2 tests, 0 pass, 2 fail (`before-fix.tap`) |
| `npx tsc --noEmit -p tsconfig.json` | exit 0 (also after the last edit) |
| `node --test tests/evaluation.test.ts`, final source | exit 0; 17 tests, 17 pass, 0 fail, 0 skipped, 24 s (`evaluation-after-fix.tap`). The first run after the fix failed 1 of 17: the new test's own message pattern was wrong; the pattern was corrected, not the source |
| `scripts/evaluate.ts summary` over `.rstack/runs` and `.rstack/s4/imports`, both root orders, output outside the repository | exit 0, byte-identical; against the stored calibrated summary: same four selected evaluations, metrics, judge answers, human calibration (7 entries, 6 cases, 4 `CONFIRM`, 2 `MODIFY`), fixture agreement equal; `dc9f7527` `MOST_COMPLETE_COPY`; no retained evaluation `INVALID` or with an issue. 47 retained evaluation and S4 files hashed before and after: identical; no control directory created |
| `tests/sensitivity.ts --cases 1–10,57,58,82–96` (the 27 cases that mutate `evals/`; run because their files changed and the retained subsets were for the earlier digest) | exit 0, 715 s; control `PASSES`; 27 of 27 `DETECTED`, each `COMPLETED`, exit status 1; live digest `072b010a…6e5d` before and after; runner `e366e223…` unchanged. `SUBSET`, `full_sensitivity_pass: false` |
| `tests/sensitivity.ts --cases 81 --timeout-ms 50` (real time limit through the unmodified runner) | exit 1 as designed; control `TIMED_OUT`, `SIGKILL`, exit status null, 60 ms → `CONTROL_NOT_RUN`; case 81 `INCONCLUSIVE_CONTROL`, not run; both rows in `cases.jsonl`; copies removed |

Not run: the other 69 sensitivity cases, `npm test` as a whole, generation, installation. `tests/evidence.test.ts` and `tests/proof.test.ts` import only `evals/verify-packet.ts`, which is unchanged.

**Hashes (sha256, working tree).** Repaired: `evals/evaluation.ts` `900017769371d917d1af041daf19e1664c0e957b028a4a5ea1a6216769229392`; `evals/summary.ts` `8541a169c7ae464db227b4bc001a5d60f32ca32ef5badabf94279e7112a22861`; `tests/evaluation.test.ts` `1c29f8965549b1702676335a26ba0df89f40f2fb512d354b3947e89a32cff9ab`. Verification inputs, unchanged from the report: `evals/deterministic.ts` `13ba705704d9e39331e06c3a7e99f3097d93a44e1b1eac4dca8a310e6515c081`; `tests/sensitivity.ts` `e366e223822aea791e09092fde55227079813d8412fb813a52cec2052546a6d3`; `evals/rubrics.ts` `e931b0f59277fa9cce7201e704ea8760672361d8de94e7de07fda5a644410a53`; `evals/verify-packet.ts` `80150991cc591ff8c9a771a1d639d1ab9c52019825d3b432b1a81d56e4c2dbe2`; `scripts/evaluate.ts` `4261055ae2635311a046de18ad314c86e3d8e761d4cce3d4d9670b54d6e70cd0`; `core/contracts/validate.ts` `6dca5976127fbd5f2f78a31b97ee471a2146800b889c1b7fb1e3b68f0e76e3f6`; `docs/astra-r2-verification.md` `8f865f811fd5cf7619c8121e5fb3235404666b7ddba08893e8cee1613b0c20b6`. Evidence: `repro.ts` `ac16952c…`, `before-fix.tap` `87e879c6…`, `evaluation-after-fix.tap` `2aa86350…`, `sensitivity-evals-cases/summary.json` `b1ed7772…`, `runner-real-timeout/summary.json` `3c8eb0ab…`.

**Limits and open points.**

- An `INVALID` evaluation blocks its run only as the latest candidate; an older one with a valid request and a newer accepted evaluation is listed with its issue and the newer one is aggregated, as for any older evaluation. One without a valid request always stands last and blocks. There is still no command to set an evaluation aside.
- Validation checks form and self-consistency, not authorship: a complete, consistent forged record passes, as before. The judge output file is not re-validated when read; it is covered by the accepted-content hash only.
- Copies are compared on the bytes of the request and verdict; a copy re-serialized with other whitespace is reported as differing. `deterministic.json` is not compared.
- The summary's `duplicate_runs` variants gained two fields and the `selection` text one clause; the schema version is still 3. `docs/decisions.md` (R2 paragraph) does not yet describe `INVALID` or the control-content comparison.
- No sensitivity case was added for the new checks, and `tests/sensitivity.ts` was not edited. The report's static observation (an interrupted control row is not appended to `cases.jsonl`) is unchanged. Still not exercised: a failing unmodified control end to end, runner interruption during a child, a child that exits normally with no report, and descendants after a timeout.

**Processes and writes.** At 2026-10-04T02:57:50Z no node process of this package was running (process list with command lines read without error). `tests/.tmp/` holds this pass's disposable fixtures besides the two older `sensitivity-*` directories; no runner copy was left. Source writes by BUILD-02 stop here for the verification window.

**Rollback of this pass only:** no checkpoint holds the pre-correction R2 files (`evaluation.ts` `2a5561a2…`, `summary.ts` `f4ba83be…`, `evaluation.test.ts` `2aa0255e…`); undo by hand: the block "stored control records" and `checkAdjudication`, the `INVALID` status and `control_sha256`, the `candidates` line and the two variant fields, the two tests at the end of the test file, and the `verdict` fixture.

### R2 correction 2 — commands apply the reader's record rules; order by instant — 2026-10-04

**Status: FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION.** From the correction-1 appendix of `docs/astra-r2-verification.md` (`R2 CORRECTION VERIFICATION WINDOW CLOSED — CHANGES REQUESTED`; file sha256 now `9e6314de77b556954ea99697e4afc12eeec44e2084e0014522a54eeccef4afa8`, not edited by this pass). Owner-authorized bounded pass by BUILD-02; implementation edits by one Sonnet delegate, reviewed and verified by BUILD-02. HEAD `60c2ba9`, nothing staged or committed. The findings are not closed here. D7-R2-B was VERIFIED_FIXED by the reviewer and is not touched.

Files changed in this pass: `evals/evaluation.ts`, `tests/evaluation.test.ts` (two tests and their helpers appended; no existing test changed), `docs/decisions.md` (one paragraph added after the R2 correction paragraph and its limits), this record. Not changed: `evals/summary.ts` (same sha256 as after correction 1), `evals/deterministic.ts`, `tests/sensitivity.ts`, `scripts/`, `core/`, rubrics, every retained run, evaluation, adjudication, and stored summary. BUILD-03's files were not touched.

| Finding | Reproduced before (unfixed source) | Correction | After |
|---|---|---|---|
| **D6-R2-A (1)** repeat acceptance bypasses the request check | Accepted evaluation, `request.json` then set to `{`: `acceptEvaluation` returned the stored verdict (test failure `Missing expected exception: SEPARATE: {`) | `acceptEvaluation` with a verdict on file now returns it through `checkedPair`: the request is validated first, then the verdict, then that the two belong together. The existing-verdict branch still precedes the earlier-layout refusal; first acceptance still needs only a valid request | For `{`, `null`, `{}` in both layouts the command throws naming `request.json`; every file under `evaluation/` and `evaluation-control/` is byte-identical before and after |
| **D6-R2-A (2)** adjudication against a request and verdict that disagree | Per the reviewer's fixtures `040` and `048`. The new test stops at its first failing assertion, so this case was not separately executed on the unfixed source by this pass | The reader's rule is one function, `checkPair` (same issue text), used by `listEvaluations` and by the command helper `checkedPair`; `adjudicate` reads both records through it before any other check or write | With only `request.evidence.digest` changed to 64 zeros, in both layouts, `acceptEvaluation` and `adjudicate` throw (`…does not carry the evidence digest of request.json`), all bytes unchanged, no `adjudication.jsonl` created |
| **D7-R2-A** expanded-year order | `EVAL-2` prepared at `9999-12-31T23:59:59.999Z` and `EVAL-11` at `+010000-01-01T00:00:00.000Z`: `EVAL-11` listed first (text comparison) | `listEvaluations` orders by `Date.parse` of the validated time, then by numbered id; `asTime` unchanged (nothing broader accepted, nothing normalized, no four-digit restriction, no library) | Order and selection follow the instant across 9999 and `+010000` with the ids in both senses, between years −2 and −1, between a negative year and 2026, and for ordinary years; equal expanded-year instants fall to the numbered id (`EVAL-2` before `EVAL-11`, `EVAL-11` selected) |

Kept working, asserted by the new D6 test in both layouts: repeat acceptance of valid records returns the stored verdict with its original `checked_at` although a later clock is passed, and writes nothing; two adjudications append as seq 1 and 2 and leave every other file byte-identical. A refused command repairs nothing. `checkedPair` refuses `acceptance.json has no request.json` when a verdict has no request; that is reachable from `adjudicate` only, because `acceptEvaluation` says `was not prepared` first.

**Evidence** (in `.rstack/r2/correction-2/`, ignored; Node v24.21.0; one process at a time). Test and typecheck runs were made only in two windows acknowledged by BUILD-03 over the session channel (`PAUSED 1` / `RELEASED 1`, `PAUSED 2` / `RELEASED 2`). In window 1 BUILD-03's files were identical to HEAD; in window 2 its `core/contracts/planning.ts` (`32dee024c9004d23ddce5528eebd278213aef727b402a7bcd35951040196ff30`) and `core/engine/brief.ts` (`46b312c2bf4ba0dbcaa69f09cff2ea94ad1da8019c29dae71667db527cce30e3`) were its in-progress R3/R4 versions, and all hashed inputs were identical before and after the runs.

| Check | Result |
|---|---|
| `node --test --test-reporter=tap tests/evaluation.test.ts`, new tests on the unfixed `evaluation.ts` (`90001776…`) | exit 1; 19 tests, 17 pass, 2 fail: the two new tests, for the reasons in the table above (`before-fix.tap` `fc975bcf46e14af8856e10c4b219b8c1882c4b0f4e9d235c346c5676c13acce4`) |
| `npx tsc --noEmit -p tsconfig.json`, before and after the fix | exit 0 both, no output |
| `node --test --test-reporter=tap tests/evaluation.test.ts`, final source | exit 0; 19 tests, 19 pass, 0 fail, 0 skipped, 38 s; passed on its first run (`evaluation-after-fix.tap` `fdcc86319c4f2d4962204ab6c7dfd01aa4c39d2bb818a49c090e61d887ed9d91`) |
| `scripts/evaluate.ts summary` over `.rstack/runs` and `.rstack/s4/imports` with the stored expectations, both root orders, output outside the repository | exit 0 both, byte-identical (sha256 `ce272401dd6604b3d09fd73dd9b78937d39b6fd363e69ea9c2b437f860e2de55`); against the stored calibrated summary: the same four selected evaluations; `metrics`, `judge_answers`, `fixture_agreement`, `human_calibration` (7 entries, 6 cases, 4 `CONFIRM`, 2 `MODIFY`) equal; nothing `not_aggregated`, no evaluation with an issue; `dc9f7527` `MOST_COMPLETE_COPY`. The digest of the retained evaluation and S4 files was `5cc50950…` before and after, as in the R2 record; no control directory was created in a retained run |
| Static check of sensitivity targets (no run) | every `find` text of the cases on `evals/evaluation.ts` is still present except case 93 (`return a.prepared_at < b.prepared_at ? -1 : 1;`), which this correction necessarily removed |

Not run: no sensitivity case (none of the 96), `npm test` as a whole, generation, installation, host testing. The reviewer's own 48-scenario fixture program was not rerun by this pass.

**Hashes (sha256, working tree).** Repaired: `evals/evaluation.ts` `125af3001f32d96e3f113ba8eecc76c54633453fe8d43e746c5d034d72b9d317`; `tests/evaluation.test.ts` `37c512d0fc03fb29c890211e736129c7c3fb2a54b11af9513169a9b84cd2f055`; `docs/decisions.md` `a6f3769ea571ccae5e0f20a836625adf6738d275bd7379b87d49216c23af58f6`. Unchanged from correction 1: `evals/summary.ts` `8541a169c7ae464db227b4bc001a5d60f32ca32ef5badabf94279e7112a22861`; `evals/deterministic.ts` `13ba705704d9e39331e06c3a7e99f3097d93a44e1b1eac4dca8a310e6515c081`; `evals/rubrics.ts` `e931b0f59277fa9cce7201e704ea8760672361d8de94e7de07fda5a644410a53`; `evals/verify-packet.ts` `80150991cc591ff8c9a771a1d639d1ab9c52019825d3b432b1a81d56e4c2dbe2`; `scripts/evaluate.ts` `4261055ae2635311a046de18ad314c86e3d8e761d4cce3d4d9670b54d6e70cd0`; `tests/sensitivity.ts` `e366e223822aea791e09092fde55227079813d8412fb813a52cec2052546a6d3`; `core/contracts/validate.ts` `6dca5976127fbd5f2f78a31b97ee471a2146800b889c1b7fb1e3b68f0e76e3f6`. The full list as hashed in window 2 is `after-fix.hashes.txt`.

**Limits and open points.**

- Sensitivity case 93 now has no target and would report `MUTATION_NOT_APPLIED`; `tests/sensitivity.ts` was outside this pass and was not edited. No mutation case exists for the three new guards (request-first check on repeat acceptance, the pair check in the commands, the instant comparison). The retained 27-case subset of correction 1 was for the earlier `evals/evaluation.ts` digest and was not rerun. This is not a sensitivity pass of any kind.
- The commands apply the record and pair rules only. The reader's run-level rule (control files in the judge area that appeared after separation) and its changed-output rule are not added to repeat acceptance; `adjudicate` keeps its own changed-output check.
- Validation is of form and consistency, not authorship, as before. There is still no command to set an evaluation aside or repair a record.
- The supported time range is what `toISOString` writes; times are compared by `Date.parse`. No historical or contemporary run has a time outside four-digit years.
- Runner follow-ups from the report (interruption during a child, child kill, no-report completion, failing control end to end, descendants after timeout, the interrupted-control row missing from `cases.jsonl`) are unchanged and outside this pass.
- BUILD-03 has said it will hand over sensitivity cases for its new guards, `dist/` regeneration, and progress/decisions text; none of that is part of this pass.

**Processes and writes.** At 2026-10-04T12:06Z no node process of this package was running (process list with command lines read without error). `tests/.tmp/` holds this pass's disposable fixtures from the two test runs. Source writes by BUILD-02 stop here.

**Rollback of this pass only:** no checkpoint holds the correction-1 files; undo by hand: in `evals/evaluation.ts` remove `checkPair` and `checkedPair`, restore the inline digest comparison in `listEvaluations`, the direct `controlRecord` reads in `acceptEvaluation` and `adjudicate`, and the text comparison in the final sort (correction-1 file `90001776…`); remove the two tests named `D6-R2-A: …` and `D7-R2-A: …` with their helpers from the end of `tests/evaluation.test.ts` (correction-1 file `1c29f896…`); remove the "R2 corrections 1 and 2" paragraph from `docs/decisions.md`.

## R3 — role result contract and refusal recovery (D3, D4) — 2026-10-04

**Status: FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION.** By BUILD-03. Base `60c2ba9`, unstaged and uncommitted. No engine, CLI, generator, or fake-transport change.

Changed: the five `core/roles/*.md`, both `core/skills/*/SKILL.md`, `adapters/copilot-vscode/coordinator.md`, new `tests/protocol.test.ts`.

- D3: both Skills carry one byte-identical `result.json` section with all eleven fields `parseSubmission` requires. Every role points to that section; the planner's inline template and the auditor's reference to the planner prompt are removed. The roles do not use `NEGATIVE`; a role that cannot produce a valid result stops without writing one.
- D4: the coordinator documents `abandon`, a step for a refused `submit` (run `status`; if the same attempt is pending, report the code, the attempt id, and the phrase "abandon attempt <id> and retry"; if another or no attempt is pending, report and stop), and the abandon rules (only on an explicit human request naming the pending attempt; a bare abandon does not run `next`).

Checks run in one window, source stable: `npx tsc --noEmit -p tsconfig.json` exit 0; `node --test tests/protocol.test.ts` 7 passed, 0 failed. The D4 test drives the CLI with the command lines of the generated coordinator file: refused submit, `PENDING_IN_FLIGHT`, `NOT_PENDING` for another id, abandon with no dispatch, replacement attempt, `STALE_ATTEMPT` for the late result with the newer attempt still pending, `ATTEMPTS_EXHAUSTED` at the profile's two attempts.

Limits: the tests show the text matches the engine, not that a model follows it. An abandon after a refused result is recorded as `EXECUTION_UNCERTAIN`. The new tests were not run against the unrepaired source. No sensitivity case was added and `dist/copilot-vscode` was not regenerated by BUILD-03.

Integrator's note (BUILD-02): the text above is BUILD-03's, unchanged. A sensitivity case for the D3 template (case 99) and the regeneration were added afterwards; see the integration record below.

## R4 — specification completeness (D5) — 2026-10-04

**Status: FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION.** By BUILD-03. Changed: `core/contracts/planning.ts` (`Spec`, `parseSpec`), `core/engine/brief.ts`, the `spec.md` section of the planning-records Skill, new `tests/spec-brief.test.ts`.

- `parseSpec` accepts, after the title, exactly one `Intent:`, `AC-n: text`, `Exclusion:`, continuation lines directly under an item, and blank lines. Any other label, an indented, bulleted, or numbered criterion, a heading, table, or code fence, a second or empty `Intent:`, an empty `Exclusion:`, and text that belongs to no item are refused with the line number. `Spec` gains `exclusions`.
- The brief shows the specification intent, every criterion, and every exclusion, all escaped, with the same elements and content policy as before.

Checks run: `node --test tests/spec-brief.test.ts` 7 passed, 0 failed; `node --test tests/planning.test.ts tests/package.test.ts tests/contracts.test.ts` 24 passed, 0 failed, 0 skipped. The twelve retained `spec.md` files are byte-identical and use only the accepted set; none was changed.

Limits: a continuation line that begins with a capitalised word and a colon is refused and must be reworded. A lowercase `note:` line directly under an item is accepted as that item's continuation and is shown. The full suite and sensitivity were not run by BUILD-03.

Integrator's note (BUILD-02): the text above is BUILD-03's, unchanged. The full suite and sensitivity cases 97 and 98 were run afterwards; see the integration record below. BUILD-03's further stated limits, kept here for the reviewer: `WORKER_QUIESCENCE_UNPROVEN` is documented in the coordinator text and not exercised by a test, because no stage of the current workflow has a shared write target; continuation lines are joined with single spaces, so the original line breaks of a specification are not shown in the brief; a retained specification that used a now-refused line would be reported as no longer valid when re-read (the twelve retained ones do not); `tests/package.test.ts` RETRIEVAL-1 was not extended, the equivalent checks being in `tests/protocol.test.ts`.

## Integration of R2 correction 2, R3, and R4 — 2026-10-04

**Status: R2 correction 2 — AWAITING INDEPENDENT VERIFICATION. R3 — AWAITING INDEPENDENT VERIFICATION. R4 — AWAITING INDEPENDENT VERIFICATION.** Owner-authorized integration by BUILD-02, working directly. HEAD `60c2ba9`, nothing staged or committed. No finding is closed here. BUILD-03's production code and tests were not changed; no integration defect was found.

**Files changed by this integration:** `tests/sensitivity.ts` (case list only), `docs/progress.md` (the two sections above and this one, appended), `docs/decisions.md` (one note appended at the end), and the ignored `dist/copilot-vscode/` (regenerated). Nothing else.

**Sensitivity cases.** The catalog has 99 cases. Cases 1–96 keep their numbers; three were appended.

| Case | Change | Guard | Mutation | Test file, test expected to fail |
|---|---|---|---|---|
| 93 | re-pointed | D7: preparation time orders evaluations before their ids (unchanged) | `evals/evaluation.ts`: `return ta < tb ? -1 : 1;` replaced by the id comparison. The earlier target, `return a.prepared_at < b.prepared_at ? -1 : 1;`, was removed by R2 correction 2; replacement and expected test are as before | `tests/evaluation.test.ts`, `D7: the latest evaluation is chosen by preparation time and numbered id, never by how names sort as text` |
| 97 | new | D5: a line with a label the specification syntax does not have is refused | `core/contracts/planning.ts`: the condition `SPEC_LABEL.test(line)` or `SPEC_MARKUP.test(line)` reduced to `SPEC_MARKUP.test(line)` | `tests/spec-brief.test.ts`, `D5: an unknown label is refused, wherever it stands` |
| 98 | new | D5: the brief shows the exclusions of the specification | `core/engine/brief.ts`: the exclusions expression replaced by `<p>None stated.</p>` | `tests/spec-brief.test.ts`, `D5: the brief shows every accepted item of the specification, escaped, and nothing executable` |
| 99 | new | D3: the result template of a Skill carries `record_type` | `core/skills/planning-records/SKILL.md`: the template line `"record_type": "role-result",` removed | `tests/protocol.test.ts`, `D3: the template has exactly the required fields, and removing any one of them is refused` |

BUILD-03 proposed the same three guards with slightly different texts (both parse refusals disabled at once; the application-records Skill). The forms above were chosen to break one guard each; they are BUILD-02's, and no case was run in BUILD-03's form. Statically, the `find` text of all 99 cases is present in the live source.

**One sequential window** (Node v24.21.0, Windows 11; BUILD-03 stopped by owner instruction and by its own acknowledgment; no node process of this package running before or after, process list with command lines read without error; one process at a time). The 98 tracked, modified, and untracked package files were hashed before the first command and after the last: identical. Records: `.rstack/integration-r2c2-r3-r4/` (ignored).

| # | Command | Result |
|---|---|---|
| 1 | `npm run typecheck` | exit 0 |
| 2 | `node --test tests/evaluation.test.ts` | exit 0; 19 tests, 19 pass, 0 fail, 0 skipped |
| 3 | `node --test tests/protocol.test.ts` | exit 0; 7 tests, 7 pass, 0 fail, 0 skipped |
| 4 | `node --test tests/spec-brief.test.ts` | exit 0; 7 tests, 7 pass, 0 fail, 0 skipped |
| 5 | `node --test tests/planning.test.ts tests/package.test.ts tests/contracts.test.ts` | exit 0; 24 tests, 24 pass, 0 fail, 0 skipped |
| 6 | `node --test "tests/*.test.ts"` (the command `npm test` runs; started directly so the TAP report is kept) | exit 0; 144 tests, 143 pass, 0 fail, 1 skipped (`a symbolic link to a file is refused`: this machine does not allow creating file symbolic links; unchanged), 44 s. `6-npm-test.tap` sha256 `3dfbaf2e59da595b5676533a8a008eb66f5523e27e5caba2f5902f4366d1748f` |
| 7 | `npm run generate:package`, twice, each followed by a sha256 listing of every file under `dist/copilot-vscode/` | exit 0 both; the two listings (33 files) and the two command outputs are byte-identical. Listing sha256 `f111919039f79fa783e7bc5fff6537aaded00f220bda14c1234335018e92fc23`; manifest sha256 `f0324e6c8a1c5b8e5499986770f4af469bc2272b7e52e3ba05d572d823b8b2d8` |
| 8 | `node scripts/check-scope.ts` | exit 0; no path outside the package |
| 9 | `node tests/sensitivity.ts --cases 93,97,98,99` | exit 0; 3 controls `PASSES` (`tests/evaluation.test.ts` 19 tests, `tests/spec-brief.test.ts` 7, `tests/protocol.test.ts` 7); 4 of 4 `DETECTED`, each `COMPLETED`, exit status 1, no signal, the named test among the failing ones; no copy left; live digest `8e78e821…5b38` before and after; runner sha256 `7f88c238…54da`. `SUBSET: 4 of 99`, `full_sensitivity_pass: false`. `summary.json` sha256 `09c5765c0f62da76e29e7333e939dcbd7896172e4a3c489cc089e422ab6471ac` |

All commands passed on their first run. Tests 2–5 were run with `--test-reporter=tap` so the report could be kept.

**The regenerated package.** Against the package that was in `dist/` before: eleven files changed (the six agent files, the two Skills, the manifest, `runtime/core/contracts/planning.ts`, `runtime/core/engine/brief.ts`); the other 22 are byte-identical. Checked in the generated files (`7-package-content-check.txt`):

- Result contract: each generated Skill has the `result.json` section of its source and one `"record_type": "role-result"` template; the five role agent files point to that section, carry no template of their own, and do not mention `NEGATIVE`.
- Coordinator recovery: the generated coordinator file has the `abandon` command line, the refused-`submit` step with the phrase "abandon attempt <attempt-id> and retry", and the abandon rules.
- Specification and brief: the generated planning-records Skill names `Exclusion:`; `runtime/core/contracts/planning.ts` and `runtime/core/engine/brief.ts` are byte-identical to the source files.
- Model selection, unchanged and unresolved: no agent file has a `model:` key; the manifest gives `model_key: OMITTED` and `selector_status: requires-host-observation` for all six roles; `validation_status` is `UNVERIFIED_ON_HOST`.

Nothing was installed.

**Final identities (sha256, working tree).** Changed by this integration: `tests/sensitivity.ts` `7f88c2387dde6df6867e087814e7e98447f9e4f1ffee56c0f09edc8b055954da`. R2 correction 2: `evals/evaluation.ts` `125af3001f32d96e3f113ba8eecc76c54633453fe8d43e746c5d034d72b9d317`; `evals/summary.ts` `8541a169c7ae464db227b4bc001a5d60f32ca32ef5badabf94279e7112a22861`; `tests/evaluation.test.ts` `37c512d0fc03fb29c890211e736129c7c3fb2a54b11af9513169a9b84cd2f055`. R3 and R4, as BUILD-03 reported them and as found on disk: `core/roles/developer.md` `9e237be54816a9bb879add81e7976208dcfc3dcc86d70774313d603a104e5af7`; `core/roles/plan-auditor.md` `02811b1e50c0d77ed87b8d5d2dd6da33d6386e842efe39dcd2a65c586753acb8`; `core/roles/planner.md` `7f4d953d0d7dafef0317fae721149879c02c7522c331533a7bedbd1152adf791`; `core/roles/reviewer.md` `1652d8cedcd3f222436ada313bebfda4859952cc8afbfc440c7f2801abe7c878`; `core/roles/tester.md` `0ddfe1fc1a434866caa40a6b68a4fe605f0f692cce49e94d164e879bf2076d70`; `core/skills/application-records/SKILL.md` `0832fd2787c3d725b03ff6952d24cb89bf0bf18432b9a45c853badd8416d7c1e`; `core/skills/planning-records/SKILL.md` `df4abe1e02335df469ba8915725b9215eda87640cf5f25b79dd85c82d934a6e3`; `adapters/copilot-vscode/coordinator.md` `beb0d8505b9de05f775ed52aeb751870bc35eb964ae38c0c1fec03235ae39cc0`; `core/contracts/planning.ts` `32dee024c9004d23ddce5528eebd278213aef727b402a7bcd35951040196ff30`; `core/engine/brief.ts` `46b312c2bf4ba0dbcaa69f09cff2ea94ad1da8019c29dae71667db527cce30e3`; `tests/protocol.test.ts` `3960d93236c8e01e3f72efc9251944ff3425784397bb17f770e3eca044966298`; `tests/spec-brief.test.ts` `9e587ecde78e8e0b46dcce08c587fc92ad4dc96aa19de5530b48368693d0d1af`. Every package file as tested is listed in `source-identities-after-tests.txt` (sha256 `040a56264a650a37083177d4089bcdaebadb090215b8da9bb83d58e485e62d8b`); `docs/progress.md` and `docs/decisions.md` changed after that listing, by this record and the decision note only, and their final hashes are in `source-identities-final.txt`.

**Limits and open points.**

- Four sensitivity cases were run. The other 95 were not run against this source, and the retained subsets are for earlier digests. This is not a sensitivity pass.
- No mutation case exists for the two command-side guards of R2 correction 2 (the request checked before a stored verdict is returned; the request and verdict checked together in `acceptEvaluation` and `adjudicate`), nor for comparing times as instants and not as text: case 93 breaks time ordering as a whole. No case exists for the D4 coordinator text.
- R3 and R4: no before-fix run of the new tests exists; they were written with the repair. The D3 and D4 tests show that the installed text agrees with the validator and the command line, not that a model follows it. Nothing here is host evidence.
- The package was generated and compared, not installed or loaded by a host. Model selection remains unresolved, as before.
- The runner follow-ups of the R2 report are unchanged: interruption during a child, a killed child, completion without a report, a failing control end to end, descendants after a time limit, and the interrupted-control row that is not appended to `cases.jsonl`.
- `tests/.tmp/` holds the disposable fixtures of these runs.

**Processes and writes.** At 2026-10-04T12:22Z no node process of this package was running. BUILD-02 stops here. S6 was not started.

**Rollback of the integration only:** in `tests/sensitivity.ts` restore the `find` text of case 93 and remove cases 97–99 with their comment line; remove these three sections and the R3/R4 note at the end of `docs/decisions.md`; `dist/` is ignored and is rebuilt by `npm run generate:package`.
