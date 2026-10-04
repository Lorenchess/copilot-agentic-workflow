# RSTACK SDLC — Astra offline review of S0–S5

**Date:** 2026-10-03. **Reviewer:** Astra-review (independent, read-only). **Verdict:** CHANGES REQUESTED (scope and limits in §8).

This is an offline source, contract, test, and packaging review. No fix was implemented, nothing was staged or committed, and nothing here is host evidence: no VS Code or Copilot interaction took place.

## 1. Review subject and source stability

- Checkout: `C:\Users\Ramon Lorente\Documents\Claude\Projects\copilot-agentic-workflow`, branch `feat/rstack-sdlc-local-build`, HEAD `da64f6d`. Path and branch matched the assignment. One worktree; none was created.
- Working tree at start and end: `M .gitignore` (one added line, `!/rstack-sdlc/`) and the untracked `rstack-sdlc/` implementation. The four guidance files (`README.md`, `01`–`03`) are tracked and unmodified.
- Identity: a manifest of sha256 hashes over 93 files — the root `.gitignore`, the 4 tracked guidance files, and the 88 untracked authored files under `rstack-sdlc/` (core, adapters, profiles, evals, scripts, tests and fixtures, docs, `package.json`, `package-lock.json`, `tsconfig.json`, package `.gitignore`). The manifest's own sha256 is `9dda5a875c7dbdf033382741d32809e5bb326d781499e9e4a9370131049be7a9`. It identifies the reviewed bytes; it is not a backup, and it lives in the reviewer's session scratch area, not in the repository.
- Not part of the subject, and not hashed: `node_modules/`, `dist/` (generated), `.rstack/` (retained runs, evaluations, summaries), `.baselines/` (retained source baselines), `tests/.tmp/` (disposable).
- End check: the same 93 files were re-hashed after all checks; the manifest is byte-identical. `git status` is unchanged. The only new file is this report.

Selected identities for cross-checking: `adapters/copilot-vscode/install.ts` `6b5fd8a2…`, `adapters/copilot-vscode/generate.ts` `d97c0126…`, `core/engine/engine.ts` `9ccc913f…`, `core/engine/state.ts` `25b5aaee…`, `evals/evaluation.ts` `95c0469a…`, `evals/summary.ts` `e274d9b8…`, `docs/parallel-host-readiness.md` `7936faf2…` (unchanged).

## 2. What was examined

Read in full by the reviewer: the four guidance files; `adapters/copilot-vscode/install.ts`, `generate.ts`, `coordinator.md`; `scripts/install-package.ts`, `generate-package.ts`, `rstack.ts`, `assembly.ts`; `core/engine/engine.ts`, `state.ts`, `lock.ts`, `journal.ts`, `drive.ts`; `core/policies/workflow.ts`; `tests/install.test.ts`; `docs/parallel-host-readiness.md`; the S5 and S4-completion parts of `docs/progress.md`; D-S5 in `docs/decisions.md`.

Read by two read-only assistants, with their main claims then checked by the reviewer against the cited code: `core/contracts/*`, `core/engine/execution.ts`, `tree.ts`, `containment.ts`, `brief.ts`, the non-installer adapters, role prompts and Skills, `evals/*`, `scripts/evaluate.ts`, `eval-cases.ts`, the retained S4 evaluation and adjudication records, and the corresponding tests.

Not examined, or only partly:

- `docs/progress.md` S0–S3 records and most of `docs/decisions.md` before D-S5 (searched, not read end to end).
- `tests/portable.test.ts`, `extension.test.ts`, `adapters.test.ts` beyond titles and selected sections; `tests/sensitivity.ts` mutation list beyond its mechanism.
- Rubrics `planning-run-v1.md` and `planning-run-v2.md`; the full text of retained judge outputs beyond the C3 and C4 answers; `.rstack/s5`; `.baselines/`.
- Behaviour on any Node version other than v24.21.0, any shell other than those the existing tests use, and anything on a host.

## 3. Checks run

All on Windows 11, Node v24.21.0, existing dependencies, ordinary permissions. Writes went only to `tests/.tmp/` and `dist/copilot-vscode/`.

| Check | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `node --test "tests/*.test.ts"` | 118 tests: 117 pass, 0 fail, 1 skipped |
| `node tests/sensitivity.ts` | 75 of 75 broken guards detected, 15 control runs pass, live source reported unchanged |
| `node scripts/generate-package.ts`, twice | OK both times, 33 files, identical content digest, and identical to the `dist/` found at the start; `UNVERIFIED_ON_HOST` |
| `node scripts/check-scope.ts --base da64f6d --allow .gitignore` | no violations |
| Reviewer reproduction of installer behaviour (three cases, §4) | all three reproduced, in a fresh directory under `tests/.tmp/` that was removed afterwards |

The one skip is visible and unchanged: "a symbolic link to a file is refused" needs elevation or Developer Mode, and neither was used. These figures match the builder's S5 record.

Limits of these checks: they are engine, fake-transport, and generated-package checks. Every lifecycle test uses simulated role content and scripted decisions. The evaluation findings in §5 were confirmed by reading code and records, not by execution.

## 4. Confirmed defects

### D1. The installer deletes a file it never created (High; blocks real installation)

- **Requirement:** 02 §6 ("explicit owned paths, collision checks … uninstall/rollback plan that preserves user changes"); 03 §9 PACKAGE-1.
- **Where:** `adapters/copilot-vscode/install.ts:280-283` plans `ADOPT_IDENTICAL` for an existing unmanaged file whose bytes equal what would be written; `:358` writes every wanted path, adopted ones included, into the install manifest; `uninstall` `:398-405` then removes any listed file whose hash still matches.
- **Reproduced:** in a workspace with no install manifest, a hand-placed `.github/agents/rstack-sdlc-planner.agent.md` with identical bytes was planned as `ADOPT_IDENTICAL` (`PLAN_READY`), installed (`INSTALLED`), and on `uninstall --apply` reported `REMOVE` and deleted.
- **Reach:** a file restored from version control, copied from another checkout of the same workspace path, or left by an interrupted install. The prefix makes an accidental match unlikely, but the installer cannot tell which case it is, and the plan output does not say that adoption transfers ownership.
- **Test coverage:** `tests/install.test.ts:133-141` asserts adoption and that the file is not rewritten. It never uninstalls afterwards, so the deletion is untested. The builder disclosed the behaviour (progress concern 14) and the reason (resuming an interrupted install).
- **Smallest correction:** when no prior manifest lists the path, treat an existing file as `COLLISION` regardless of content. Reinstalling a path the manifest already lists stays `UNCHANGED`/`UPDATE` as now. An interrupted install then reports collisions and the user removes the leftover files; that is safe and rare. If resumability is wanted, the alternative is to keep the file as explicitly unowned (not in `files`, never removed), not to adopt it.
- **Acceptance test:** unmanaged identical file present → plan and apply are `BLOCKED` with `COLLISION`, workspace unchanged, and a following `uninstall` is `NOT_INSTALLED` with the file intact. A second test: a normal install followed by reinstall still reports `UNCHANGED` for all eight files.

### D2. A failed update reports "rolled back" but loses a removed Skill file (Medium)

- **Requirement:** 02 §6 rollback; D-S5 "A failure while applying undoes every change of that operation".
- **Where:** `install.ts:327-339`. For a removal that empties an owned Skill directory, the undo that recreates the directory is pushed before the undo that restores the file. Undo runs in reverse, so the file restore runs first, fails because the directory is gone, and the error is swallowed at `:373`.
- **Reproduced:** install a package with an optional Skill; regenerate without it; apply the update with a failure injected at the manifest write. Result: `INSTALL_FAILED_ROLLED_BACK … its changes were undone`, the Skill directory exists and is empty, the Skill file is gone, and `verify` reports `DRIFT` (`MISSING`).
- **Impact:** the lost file is an unmodified installer-owned file and a reinstall recovers, so no user content is lost. The defect is the false statement that the workspace is as it was.
- **Test coverage:** the failure-injection test (`install.test.ts:325-359`) fails updates that add a Skill, never one that removes one.
- **Smallest correction:** push the file-restore undo before removing the directory (or have the restore create its parent). Report a distinct code if any undo step fails instead of swallowing it.
- **Acceptance test:** the reproduction above, expecting a byte-identical workspace and `verify` `CLEAN` after the failure.

### D3. Four role prompts describe a `result.json` the engine rejects (Medium; blocks a useful S6 pilot, not offline tests)

- **Requirement:** 01 §7 (critical rules local, details through direct links); 03 §9 RETRIEVAL-1.
- **Where:** `core/contracts/records.ts:239-260` requires `schema_version` and `record_type: "role-result"`. `core/roles/tester.md:24`, `developer.md:22`, `reviewer.md:25`, and `plan-auditor.md:26` list the fields to write and omit both. Only `planner.md:23-39` shows the full shape; the auditor is told "The planner contract shows the full shape", but a generated agent file carries only its own role text and a Skill pointer, and neither Skill documents `result.json`.
- **Counterexample (from code, not executed on a host):** a Tester following its prompt literally produces a result the engine refuses as `MALFORMED_RESULT`.
- **Test coverage:** none. Both fake transports build results in code; no test compares prompt text with the validator. The RETRIEVAL-1 test checks planning-record strings only.
- **Smallest correction:** put the complete `result.json` template in both Skills (or each role file) and drop the cross-role reference.
- **Acceptance test:** extend the RETRIEVAL-1 test so that each role's generated agent file, together with the Skill it names, contains `"record_type": "role-result"` and `"schema_version"`.

### D4. On the real coordinator path a refused result strands the run (Medium; same scope as D3)

- **Requirement:** 03 §3 (failed invocation distinct from pending; bounded attempts) as it applies to the target transport; 02 §2.
- **Where:** `engine.submit` rejects without settling the attempt (`engine.ts:839-840`). The offline driver then closes it as `RESULT_REJECTED` and retries within budget (`drive.ts:62-70`). The generated coordinator does not: `coordinator.md:28` says report and stop, its command list (`:10-14`) has no `abandon`, and after that every `next` returns `PENDING_IN_FLIGHT`.
- **Consequence (inferred from code and prompt text):** on a host, one contract violation or one non-discriminating proof halts the run until a human runs a command that no installed file mentions. The tested retry behaviour belongs to the driver, which the host path does not use. Related: `outcome: NEGATIVE` is supported by the engine but no prompt mentions it, and a result must still deliver every contract-valid file, so a role that should stop has no accepted way to say so.
- **Smallest correction:** give the coordinator one explicit step for a refusal while the attempt is still pending: tell the human the attempt id and the exact `abandon` command, and run it only when the human asks. Document `NEGATIVE` in the role prompts or state that it is unused.
- **Acceptance test:** a CLI-level test using only the command lines in the installed coordinator: refused submit → documented abandon → `next` grants a new attempt, bounded by the profile's attempts.

### D5. The brief omits specification text that the decision approves (Medium)

- **Requirement:** 01 §2 ("Decision: … exact displayed subjects"); 01 §4.
- **Where:** `core/contracts/planning.ts:83-97` accepts and silently drops any `Label:` line other than `AC-n:` and `Intent:`; `core/engine/brief.ts:79-80` renders only the parsed criteria. The decision binds the specification by hash, and Tester, Developer, and Reviewer receive the full bytes.
- **Counterexample (from code):** a spec with `AC-1: …` followed by `Note: AC-1 does not apply to admin users` passes the contract; the `Note:` line is not in the brief but is in what the human authorizes and what downstream roles read. `Exclusion:` lines, which the Skill tells the Planner to write, are also never shown. A mis-formatted criterion (`- AC-2: …`) is dropped or merged without an error.
- **Test coverage:** the brief test checks escaping and absence of executable content, not completeness.
- **Smallest correction:** reject unrecognized non-empty lines in `parseSpec` (allow a closed set such as `Exclusion:`) and render the allowed ones; or render the raw specification escaped.
- **Acceptance test:** a spec with an unknown label is refused; a spec with `Exclusion:` shows that line in the brief.

### D6. The evaluation acceptance check trusts files in the judge's own write area (Medium)

- **Requirement:** 01 §8 and 03 §6 (evidence unchanged; original judgment retained; human adjudication appended).
- **Where:** `evals/evaluation.ts:189` returns an existing `acceptance.json` without checking anything; `:190,207` take the evidence baseline and `judgeable` from `request.json`; `:22` allows `acceptance.json` and `adjudication.jsonl` in the area; all sit in `evaluation/<id>/`, where the judge is told to write. `listEvaluations` (`:310-336`) takes status from `acceptance.json` but content from the current `evaluation.json` and never compares it with `evaluation_sha256`.
- **Counterexamples (from code, not executed):** a judge that writes its own `acceptance.json` is aggregated as accepted; a judge that alters evidence and the digest in `request.json` passes the unchanged-evidence check; a judge-written `adjudication.jsonl` line with `HUMAN_RECORDED` counts as human calibration; an `evaluation.json` edited after acceptance is summarized as the accepted answer.
- **Not claimed:** nothing indicates this happened. In the retained records, the four accepted `evaluation.json` hashes equal both the acceptance hash and the hash in every adjudication line.
- **Test coverage:** the tests plant an extra file and an evidence change; none has the judge write the three control files, and only `adjudicate` checks the accepted hash.
- **Smallest correction:** at first acceptance refuse a pre-existing `acceptance.json` or `adjudication.jsonl`; in `listEvaluations` do not aggregate an accepted evaluation whose file no longer matches its accepted hash. The `request.json` baseline remains judge-writable unless it is kept elsewhere; if it is not moved, state that limit in D-S4.
- **Acceptance test:** each of the four counterexamples ends `REJECTED` or excluded from the summary.

### D7. "Latest" evaluation and duplicate-run selection depend on name and argument order (Low–Medium)

- **Where:** `evals/evaluation.ts:313-314` sorts evaluation directories by name and `evals/summary.ts:161` takes the last; `summary.ts:151-159` keeps whichever copy of a run is listed first.
- **Counterexamples (from code and records):** `EVAL-10` sorts before `EVAL-2`, so the tenth evaluation is not selected; adjudications held on a non-selected evaluation drop out of the calibration silently. Listing `.rstack/s4/imports` before `.rstack/runs` would select the imported copy of run `dc9f7527`, which has no evaluation, and C1–C3 would disappear from the summary.
- **Smallest correction:** order by `prepared_at` or `checked_at`; when duplicates differ in evaluations, prefer the one that has them and report it.
- **Acceptance test:** eleven evaluations select `EVAL-11`; both root orders give the same summary.

### D8. Install manifest shape is not fully validated (Low)

- **Reproduced:** an install manifest without its `package` object makes `uninstall` and `verify` throw a raw `TypeError` instead of `INSTALL_MANIFEST_MALFORMED` (`install.ts:393,442`; `readInstallManifest` `:209` does not check `package`). Nothing is removed. Correction: validate `package.root` and `package.manifest_sha256` as strings in `readInstallManifest`.

## 5. Areas reviewed with no defect found

- **State ownership and transitions.** The journal is the single authority; every event is validated against current state before it is appended; the snapshot is derived. Status takes no lock and writes nothing.
- **Duplicate acceptance versus duplicate dispatch.** Identical resubmission returns the original outcome, a conflicting one is refused, and only the call that created an attempt receives the grant.
- **Interruption, abandonment, delayed workers.** An in-flight attempt is never re-run silently; `abandon` is explicit and counted; attempts work in separate copies and accepted bytes are retained by content hash, so a late worker cannot change what was accepted. The lock is never reclaimed by age.
- **Audit rounds and decisions.** Both audit rounds end at a human wait; a second audit is offered only in round one within budget; there is no third. `pause` and `reject` do not authorize. A decision is bound to the displayed version and subject hashes, and retained subjects are re-verified. Amendments are allowed only with `amend`, and the final plan is recorded as `AMENDED_NOT_REAUDITED` with the last audited identity kept.
- **Proof and candidate.** Red and green are established by the engine's own test execution on retained trees, not by a role's claim. Candidate identity is a manifest of raw bytes. Controlled tests and protected files are checked at submit. The review is bound to candidate, verification, specification, and proof.
- **Simulation versus claims.** Transport class is fixed at start; a simulated driver is refused by a non-simulated run; outside simulated runs only `HUMAN_RECORDED` decisions are accepted, and that is recorded as a claim.
- **Brief safety.** Every dynamic value is escaped; no scripts, links, forms, or remote assets.
- **Stubs and boundaries.** Jira and Bitbucket return `INTEGRATION_NOT_CONFIGURED` with no network or credential access and are loaded only on explicit selection. Core imports no adapter and names no model or IDE tool. Role prompts are 384–492 words, Skills 444–500, coordinator 559; the coordinator holds no routing table.
- **Package.** Paths in both manifests are validated before any write or removal; a junctioned `.github` is refused; a workspace containing the package is refused; relocated invocation from paths with spaces passes its tests; baselines, evidence, guidance, tests, fake transports, deferred adapters, and local paths are not shipped.
- **C1–C6 calibration.** The records and summary stay within their stated limits. C4: the judge's NO remains in the judged counts, the owner's qualified YES appears only in the owner-adjusted tally with its note, and nothing in code, documents, or the stored summary treats it as a judge error or computes a judge-accuracy figure. One reading risk: the owner-adjusted `YES: 4` for that question combines one qualified owner answer with three unadjudicated judge answers; the caveat is in an adjacent field.

## 6. Unverified risks, documented limits, and suggestions

**Unverified risks (inferred; not reproduced):**

- Only top-level TAP test lines count (`adapters/node-test-executor/index.ts`). A proof written with `describe`/`it` would be refused with a misleading reason, and a `# SKIP` line may count as a pass. The prompts do not say "top-level tests only".
- `rstack.app.json` test patterns may contain `..` (`core/contracts/app.ts:50-51`). Reachable only from the application's own frozen configuration, not from a role.
- The developer can delete pre-existing tests outside the controlled directory; verification does not compare the reported test set with the baseline.
- The human is pointed at `brief/round-N.html`, a mutable copy; `decide` re-verifies only the retained artifact.
- The execution environment compared for REVIEW-1 is runtime, version, platform, and architecture; environment variables are inherited and unrecorded.
- A partial `writeFileSync` during install has no undo registered for that file.
- The coordinator passes human free text as quoted shell arguments; PowerShell and the Copilot terminal tool are untested.

**Intentional, documented limitations (accepted as stated):** Node range declared but not enforced, and the runtime is TypeScript, so an unsupported Node fails at load with an opaque error; runtime file list derived by regular expression, pinned by a test, missing file fails loudly; install manifest and installed files contain absolute local paths; `uninstall` is not transactional; write boundaries are detect-at-submit, not prevention; the run directory is writable by any local process; one judge per run, same model family as the builder, effective model unavailable.

**Nonblocking suggestions:** `check-scope` does not see ignored paths outside the package; finding targets that look like ids are not resolved; unknown extra profile roles are accepted and role `timeout_seconds` is unused; `summary.ts` descriptions for unreadable journals and `refusals_visible` do not match behaviour; `tests/.tmp/` grows without cleanup; the S5 rollback has no retained S4 copy of the five edited files.

## 7. Readiness

- **Offline candidate:** the engine, contracts, and package generation are coherent and their tests are real and sensitive. The candidate is not ready to advance as it stands because of D1–D5.
- **Blockers before any real installation:** D1. D2 should be fixed in the same change, since both are in the apply and undo path.
- **Blockers before an S6 pilot is worth running:** D3 and D4 (the first non-planner role would likely be refused, and the run would then stall), and D5 (the human checkpoint would not show everything it approves). D6 and D7 should be fixed before further evaluation results are relied on; they do not block installation.
- **Still required in S6, and not shown by anything here:** a licensed account and an approved disposable workspace; VS Code and Copilot versions and session target; discovery of the installed agents and Skills; tool-set names; model selectors and effective model and effort reporting; named-role dispatch with fresh context; which instructions reach a worker; whether `tools:` lists are enforced; result transport by file; human wait and resume; engine refusals being respected by the coordinator; command quoting in the host terminal; no inherited customizations from the parent repository or user folders. U1–U12 remain open and `COPILOT_VALIDATED` remains no.

## 8. Verdict

**CHANGES REQUESTED.**

This verdict covers the offline source, contracts, tests, and packaging of the bytes identified in §1, on one machine and one Node version. It rests on defects D1–D5; D1 was reproduced and is the reason not to install into a real workspace yet. It is not a judgment of host behaviour, of model quality, or of the areas listed as not examined in §2.
