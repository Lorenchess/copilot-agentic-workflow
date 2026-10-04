# Astra whole-pipeline release-candidate audit

**Date:** 2026-10-04. **Verdict: CHANGES_REQUESTED_BEFORE_S6.**

**Subject:** `6e9bd18a8abe21732f16a063ae1bf71b73dd8f1a`, branch `feat/rstack-sdlc-local-build`.

The normal suite, typecheck, and deterministic generation pass. Nine additional offline counterexamples nevertheless prevent a readiness verdict: unexecuted tests can count as proof; test patterns can execute outside the measured tree; the displayed approval brief can disagree with its retained subject; damaged candidate bytes can reach a proposal; interrupted lock reclamation can hang; package verification misses runtime drift; inherited environment changes escape invalidation; a judgment of an earlier run state is aggregated against its later state; and the documented PowerShell command changes literal decision text.

These are additional findings, RC1–RC9 below. **D1–D8 remain VERIFIED_FIXED.** In particular, RC3 concerns modification of the displayed file after rendering, not D5's repaired omission during rendering; RC8 concerns a changed run subject, not D6's repaired accepted-output/control validation. No repairs were made.

## 1. Candidate identity, scope, and method

The requested branch and full commit matched at the beginning and during verification. There were no staged changes. Two pre-existing working changes were excluded from the release candidate and preserved:

- Modified `docs/progress.md`.
- Untracked `docs/s6-host-validation.md`.

The audit read the committed progress record where historical context was needed; it did not treat the uncommitted S6 notes as approved implementation or host evidence.

The retained 98-file inventory in `.rstack/integration-r2c2-r3-r4/source-identities-final.txt` independently reproduces the owner's canonical digest **`b084ac0d99b71bbd0678816b3ae943f8a279ce1165b31a8bb54bd14e0486ad47`**. Of those files, 97 match the current raw bytes; the only differing path is the already modified progress record. Git reports no production, configuration, or test difference from the requested commit. The commit has 99 tracked package files, including the subsequent combined verification report. The precommit inventory and committed candidate are identified separately; this report does not claim the dirty working tree has the precommit digest.

All 99 tracked package files were hashed before execution. The final preservation check compares those original bytes, including the pre-existing dirty progress file. New probe material is confined to ignored `tests/.tmp/astra-release-20261004/`; the only new authored deliverable is this report. Earlier reports, retained runs, baselines, integration evidence, and `dist/copilot-vscode/` were not edited or regenerated in place.

**Final check:** 99/99 pre-existing tracked files unchanged; 33/33 retained generated files unchanged, with no extra generated file; clean `generated-1` unchanged; pre-existing S6 note unchanged across the recorded pre-report/final hashes; staging empty. Git status contains only the original two paths and this new report.

### Complete read surface

The review read all 52 files under the authored runtime, adapter, evaluator, profile, and script directories, rather than sampling the repair diff:

| Area | Files read |
|---|---|
| `core/contracts/` | `app.ts`, `planning.ts`, `ports.ts`, `records.ts`, `validate.ts` |
| `core/engine/` | `brief.ts`, `containment.ts`, `drive.ts`, `engine.ts`, `errors.ts`, `execution.ts`, `journal.ts`, `lock.ts`, `state.ts`, `tree.ts` |
| Policy, roles, Skills | `core/policies/workflow.ts`; all five role prompts; both record Skills |
| Profile | `profiles/trial-v1.json` |
| Copilot adapter | `coordinator.md`, `extensions.json`, `generate.ts`, `install.ts` |
| Other adapters | Local request/proposal, Node executor, both fake transports including `application.ts`, Jira and Bitbucket placeholders |
| Evaluator | `deterministic.ts`, `evaluation.ts`, `rubrics.ts`, `summary.ts`, `verify-packet.ts`, all three rubric documents |
| Scripts | `assembly.ts`, `check-scope.ts`, `eval-cases.ts`, `evaluate.ts`, `generate-package.ts`, `install-package.ts`, `rstack.ts`, `synthetic-run.ts` |

Also inspected package configuration and dependency metadata, README and 01–03, applicable decisions, prior offline/repair reports and host-readiness material. All **18 normal test files**, the complete sensitivity runner/catalog, four support files, and eight fixture files were read. Historical host documentation is context only; no current host capabilities were inferred from it.

## 2. Validation actually performed

Environment: **Node v24.21.0, npm 11.19.1, Windows**. No live model or Copilot session was used. Role content and decisions in lifecycle probes are **SIMULATED/SCRIPTED**; child application test executions are actual local executions.

| Check | Independent result |
|---|---|
| `npm run typecheck` | PASS, exit 0 |
| `node --test "tests/*.test.ts"` | PASS, exit 0: **144 tests, 142 pass, 0 fail, 2 skip**, about 67 seconds |
| Fresh generation twice through `generatePackage` | PASS: 33 files, identical complete path/hash inventories, identical to retained `dist/copilot-vscode/` |
| Manifest/source verification | Every output hash and source hash checked; runtime source copies match authored content under the generator's normalization rules |
| Unmodified lifecycle control | `PROPOSAL_READY`, packet resolves |
| Focused failure probes | Counterexamples in RC1–RC9 reproduced; additional legacy-test deletion probe reproduced and classified separately |
| Full or selected sensitivity execution | **Not run**; no new mutation coverage claimed |

The first sandboxed suite launch failed with `spawn EPERM` before test bodies. An initial automatic escalation review missed the attachment's explicit test authorization and rejected the retry. After quoting section 9 of that request, the same command was approved and completed outside the sandbox. That launcher/approval history is retained separately and is not counted as a product test failure or pass. No test isolation change, warning suppression, or candidate edit was used.

The two skips were:

1. `a symbolic link to a file is refused`: file symlink creation needs elevation or Windows Developer Mode in this environment. Directory junction cases did run.
2. `the installed command lines keep their arguments whole under Git Bash`: the existing availability probe reported Git Bash unavailable. This establishes a skipped probe, not proof that Git Bash is absent from the machine.

The generated manifest SHA-256 is **`f0324e6c8a1c5b8e5499986770f4af469bc2272b7e52e3ba05d572d823b8b2d8`**. The package contains six agents, two Skills, 24 runtime/profile/package files, and its manifest. Its static import closure excludes test adapters, evaluator, generator, tests, evidence, maintainer guidance, and deferred integration implementations. The passing portable test executes a relocated package from an unrelated directory through `cmd.exe`, including its own installer, and checks module origins. This is offline portability evidence, not host discovery or enforcement.

Both fresh packages were identical **before** the drift probe. That probe deliberately changes one runtime file in `generated-2`; it is no longer an unchanged generation specimen. `generated-1`, the saved original inventory, and retained `dist/` remain the clean comparison subjects.

### Reproduction records

All paths in this table are below `tests/.tmp/astra-release-20261004/`.

| Evidence | Content |
|---|---|
| `source-before.json`, `identity-check.json`, `preservation-final.json` | Source identities, approved inventory reconciliation, final preservation |
| `typecheck.txt`, `typecheck-exit.txt` | Compiler result |
| `normal-suite.txt`, `normal-suite-exit.txt` | Initial sandbox launcher failure |
| `normal-suite-unrestricted.txt`, `normal-suite-unrestricted-exit.txt` | Completed normal suite and exit status |
| `probes.mjs`, `probe-results.json`, `probes-output.txt`, `probes-exit.txt` | Generation/control, skipped suites, changed brief, candidate damage, pattern, drift, and bounded lock probe |
| `followup-probes.mjs`, `followup-results.json`, `followup-output.txt`, `followup-exit.txt` | Corrected standalone skip/traversal fixtures, legacy-test deletion, environment change, stale evaluation |
| `shell-probe.mjs`, `shell-results.json`, `shell-output.txt`, `shell-exit.txt` | Actual PowerShell argument-preservation probe |
| `generated-inventory.json` | Original complete generated package inventory |

Two first standalone fixtures mistakenly used CommonJS `require` under the package's ESM setting. Their load failures remain in the first probe log. The corrected ESM fixtures in the follow-up log establish RC1's direct-skip case and RC2's successful outside test. The complete skipped-suite lifecycle already succeeded in the first probe. Reviewer fixture errors are not candidate defects. Probe directories are retained and scripts expect fresh destinations; rerunning them requires a new scratch root.

## 3. Complete workflow trace

### Shared authority and failure rules

The checksummed, sequential, fsynced `journal.jsonl` is authoritative. `state.ts` replays events; `state.json` is derived and is never a second state authority. `engine.ts` validates a transition before appending it under the per-run lock. The frozen workflow/profile identities prevent silently continuing under another policy. `assembly.ts` supplies source, sink, and executor implementations; core does not import them.

For every role stage, the envelope binds run, attempt, role, state version, inputs/input digest, profile, mode, round, output names, and attempt directory. Submission checks these identities, validates the produced records, checks file containment, and retains accepted bytes by SHA-256. An identical delivery returns its original outcome; a conflicting duplicate or stale delivery is refused. A rejected submission is retained and does not itself grant a new attempt.

The trial profile allows two attempts per worker stage. `next` grants dispatch only to the caller that commits it; observers see `IN_FLIGHT`. Explicit failure or human-directed abandon can permit a new attempt within the budget. Abandon does not stop a worker. Every application-writing attempt receives its own copy; a shared-write-target stage would block on uncertain abandonment, but none of this workflow's stages uses that flag. Review rejection is terminal, not an automatic developer repair loop.

Status writes nothing and dispatches nothing. Resume rebuilds derived state and preserves pending identity. A complete corrupt journal record blocks; an incomplete final tail is preserved before a writer truncates it. Live or uncertain lock owners are not normally taken over. RC5 is the uncovered interrupted-takeover branch.

### Stage-by-stage inputs, outputs, and authority

All subject references below identify retained bytes. Application tree manifests additionally name every file's hash and size. The journal/state rules above own every transition, including transitions resulting from human decisions.

| Stage / actor and write lane | Accepted inputs and validation | Outputs, next transition, and failure behavior |
|---|---|---|
| Request / local source, engine | Authorized file bytes and provenance; validated profile; measured application and config; available source/sink/executor. Links and unsafe identities refused. Deferred adapters refuse before creating a run. | Retained `source`, `base`, `app_config`, workflow/profile; committed start → `intent`. Original application is read-only. |
| Intent / Planner, `work/intent-N` | `source`, optional retained owner `answers`; intent syntax and explicit open-decision marker. | `intent.md` → `spec` if closed; otherwise `product-question`. Generic attempt bound applies. |
| Product question / human, engine records answer | Current version and exact intent subject; action `answer` or `reject`; provenance checks. | Answer is retained and supplied to a new intake attempt; at most three question rounds. Reject terminates. No spec dispatch while waiting. RC9 concerns transport of the answer text. |
| Specification / Planner, its attempt directory | `source`, `intent`; closed spec grammar, unique AC ids, exactly one Intent, complete continuations/exclusions. | Retained `spec.md` → `plan`; malformed/omitted grammar does not advance. |
| Plan / Planner, its attempt directory | `source`, `intent`, `spec`; every AC covered, known criteria, units/claims/proof structure checked. | Retained `plan.json` → `plan-audit`. Planner has no audit-result slot. |
| Audit / Plan Auditor, its attempt directory | Only source, intent, spec, complete current plan; exact plan/spec subjects; coverage/evidence/verdict consistency. | Retained `audit.json` → deterministic `brief`, regardless of HOLDS/REFUTED/INCONCLUSIVE. Audit budget consumed. No automatic implementation authority. |
| Brief / engine only | Accepted intent/spec/plan/audit and prior-round context where applicable. All dynamic HTML escaped, restrictive CSP, no executable approval action. | Retained HTML identity plus `brief/round-N.html` → unconditional `plan-decision` WAIT. RC3 is the mutable displayed-copy gap. |
| Plan decision / human, engine records decision | Current version; exact intent/spec/plan/audit/brief refs; allowed action; retained subjects resolve; amendment targets valid. | Proceed/amend creates final plan and authorizing decision → proof. Amend retains audit verdict, residual findings and unchecked coverage, labels `AMENDED_NOT_REAUDITED`. Pause remains waiting; reject terminates. Second audit only on explicit round-one request. |
| Revision / Planner, new attempt directory | Source, intent, spec, prior plan/audit; one disposition per finding; revised plan still covers approved ACs. | Retained dispositions and new plan → fresh auditor. Auditor receives no prior audit/dispositions. Second brief waits again; no third audit. |
| Proof / Tester, own base copy plus controlled-test lane | Source, spec, final plan, base; complete criterion-to-test map; only controlled-directory changes. Engine materializes retained proof tree and executes baseline. | Retained proof/tree/baseline+raw output → implementation only if VALID. Setup/load failures, nondiscriminating red, unmapped tests, unhealthy baseline, and write violations refuse. RC1/RC2 undermine what that execution proves. |
| Implementation / Developer, own proof-tree copy | Spec, final plan, proof, proof tree, optional prior failed verification. Controlled tests and protected config files must remain identical. | Engine measures/retains candidate tree → verify. Write-boundary violation refuses. Failed verification supplies evidence to a fresh implementation attempt, bounded by developer budget. Legacy-test deletion is not protected by this rule. |
| Verification / engine/executor, fresh `exec/` copy | Retained candidate leaves are hash-checked while materializing; same frozen test config/proof. Exit 0, all reported tests pass, all proof names present. | Retained execution and raw output → review on PASS; otherwise developer retry or `VERIFICATION_FAILED` block. RC1/RC2 affect report fidelity; RC7 affects environment freshness. |
| Review / Reviewer, separate candidate copy and own result file | Source, spec, final plan, complete audit, proof/tree, baseline, base, candidate, verification. Exact candidate/verification/spec/proof subjects and coverage consistency required. | Retained `review.json`; only ACCEPT → proposal. REJECT/INCONCLUSIVE blocks. Reviewer cannot repair the candidate through this submission interface. |
| Proposal / engine and local sink | Current recorded environment compared with verification; selected retained record hashes checked; required accepted review/state. | `proposal/pr-proposal.json` and committed proposal reference; terminal `PR_PROPOSAL_READY`, publication `NOT_ATTEMPTED`. RC4 exposes missing transitive integrity checks; RC7 exposes untracked environment changes. No commit, remote PR, merge, or deployment. |
| Retained packet / verifier, read-only | Journal, frozen workflow/profile, records, tree leaves, execution logs, decisions, failures and proposals, without reliance on work/exec copies. | Resolution problems are reported; damaged evidence does not become successful deterministic completion. RC4's bad proposal is correctly detected here after the proposal gate already accepted it. |
| Evaluation / evaluator then fresh judge | Prepare records rubric hash, identities, evidence digest and deterministic report. Judge has only its designated output file; accept checks shape, vocabulary, area changes, unchanged evidence and packet resolution. | Append-only evaluation identities; ACCEPTED/REJECTED verdict in separate control area. No execution, candidate repair, or engine transition. Original rejected output remains. RC8 concerns later reuse after normal run advancement. |
| Adjudication and summary / human recorder, evaluator | Valid request/acceptance pair and exact accepted output; valid provenance/question/label. Summary chooses rubric/time/id and reconciles duplicate copies without merging conflicts. | Appended adjudication lines; judge answers remain separate from qualified owner answers. No accuracy score, no unknown counted as pass. Current tests cover altered output/controls and ordering; RC8 remains. |
| Generation / generator | Valid host profile, bounded extension definition, authored roles/Skills, static runtime closure; source/output hashes. | Deterministic templates/runtime/manifest only under allowed output roots. Invalid input leaves prior output. Unobserved selectors omitted; no invented effort setting. No runtime transition. |
| Install/update / installer, owned paths only | Package bytes vs manifest; valid prior ownership manifest; safe roots/paths; collisions and user changes checked before apply. | Dry plan by default; apply writes prefixed agents/Skills and manifest, expands three roots explicitly. Update removes dropped unmodified owned files. In-process failure undoes changes; incomplete undo reports details. D1/D2/D8 protections pass. |
| Verify/remove / installer | Verify checks installed hashes and package-manifest identity; remove checks ownership and current bytes. | Verify is read-only (RC6). Uninstall preserves modified files and run evidence, removes empty created directories; repeated removal is predictable. Nontransactional removal and crash recovery remain disclosed limits. |

The additional valid control run (`control/.rstack/runs/RC-control`) reached the local proposal through actual baseline/verification executions and a resolving packet. It establishes connected control flow, not the quality or independence of simulated role reasoning.

## 4. Blocking findings

Every finding below is classified **BLOCKER_BEFORE_S6**. Suggested changes are repair scopes, not authorization to implement. None requires replacing the architecture, adding a service, or adding an agent.

### RC1 — Skipped tests and suite containers can satisfy controlled proof (High)

**Code:** `adapters/node-test-executor/index.ts:8–32`, `core/contracts/ports.ts:74–78`, `core/engine/execution.ts:47–90`.

The TAP parser recognizes only top-level `ok`/`not ok` lines, treats every `ok` as PASS, and does not distinguish a suite from an executed test or handle SKIP/TODO status. The proof classifier then trusts that PASS.

**Counterexample:** the tester supplies three `describe('criterion N', ...)` suites, each containing only `it.skip(...)`, and maps the suite names to AC1–3 as ALREADY_SATISFIED. The actual baseline reports all three containers as PASS and classification VALID. The unchanged application still lacks the requested disabled-export behavior; nevertheless verification passes and the run reaches `PROPOSAL_READY`. A corrected standalone fixture also produces `# pass 0`, `# skipped 1`, but `never # SKIP` is normalized as PASS and both classifiers accept it. Evidence: `probe-results.json` / `skipped-nested-proof`, `followup-results.json` / `direct-skip-corrected-fixture`; run `skipped-proof/.rstack/runs/RC-skipped-proof`.

**Smallest correction:** distinguish executed proof-eligible test outcomes from skipped/TODO/container outcomes. It is acceptable to explicitly refuse unsupported nested TAP for this adapter; silently assigning container PASS is not acceptable. Align the Skill's supported test shape with the adapter. This does not require a general-purpose TAP framework.

**Acceptance:** actual child-process fixtures for direct skip, TODO, and all-skipped nested suites cannot satisfy a criterion or green verification; executed top-level assertions still work; supported nested leaf tests, if implemented, bind unambiguously. Run the unchanged-app end-to-end counterexample and require refusal before implementation/proposal. **Architecture impact:** none; bounded executor/outcome/validation repair.

### RC2 — Accepted test patterns can execute files outside the measured tree (High)

**Code:** `core/contracts/app.ts:48–51`, `adapters/node-test-executor/index.ts:42–50`.

The pattern validator permits `..` segments despite the adjacent containment requirement. The executor forwards patterns directly to Node under the execution cwd.

**Counterexample:** config pattern `x/../../outside.test.js` parses successfully. With `inside/x/` and a sibling `outside.test.js` in a disposable fixture, the real executor run from `inside/` reports **outside witness PASS**, exit 0. The executed file is not inside that cwd's measured application tree. Evidence: `followup-results.json` / `traversal-corrected-fixture` and `pattern-case/`.

Reachability is limited to the application's frozen owner-supplied config; the developer cannot change that protected config. This is still an exact-execution-input defect, not a claimed role-driven privilege escalation.

**Smallest correction:** reject traversal/path escape segments and ensure accepted pattern expansion remains inside the measured application. Keep ordinary supported relative globs. **Acceptance:** direct and glob-containing parent traversal refuse before execution; an outside sentinel never runs; valid nested test globs still run. Add this to app-config/executor coverage, not just role-output containment. **Architecture impact:** none.

### RC3 — The human can approve a displayed brief different from the retained subject (High)

**Code:** `core/engine/engine.ts:310`, `:468`, `:947–950`.

WAIT points to `brief/round-N.html`; decision validation checks the retained content-addressed HTML, not the bytes at that displayed path.

**Counterexample:** after the first WAIT, replace only the displayed AC1 wording from 503/zero exporter calls to 200/continue exporting. Submit the original WAIT version and subjects. The engine replies `DECISION_RECORDED` and advances to proof, while the retained specification/brief still approve the original requirement. Evidence: `displayed-brief-mismatch`, run `changed-brief/.rstack/runs/RC-changed-brief`.

**Smallest correction:** before accepting the decision, check that the exact displayed file exists and hashes to the bound brief reference, or make the displayed artifact itself the verified subject. A mismatch must require explicit recovery/review rather than silently accepting or replacing what the human saw. **Acceptance:** editing or deleting the displayed copy refuses the decision and preserves the wait; unchanged display accepts; existing stale-version/retained-artifact tests remain. **Architecture impact:** none. D5's initial complete rendering remains fixed.

### RC4 — Candidate file corruption after review does not stop proposal creation (High)

**Code:** `core/engine/engine.ts:786–802`, especially the record-only loop at `:795`.

The proposal gate rechecks selected top-level record hashes but does not resolve the candidate's file leaves or all relied-on transitive evidence again.

**Counterexample:** finish a valid candidate verification and accepting review; overwrite the retained `src/export.js` leaf, leaving its tree manifest unchanged. `next` returns `PROPOSAL_READY`. An immediate `verifyPacket` returns `ok: false`, identifying the leaf mismatch at `sha256:1858cf39f40eb3840d2e9a81501ba5048be1eb40e5f235a5113d3469332a0666`. Evidence: `candidate-leaf-changed-after-review`, run `damaged-evidence/.rstack/runs/RC-damaged-evidence`.

The existing test titled “retained candidate bytes ... stop verification and the proposal” changes a leaf before verification, then changes the manifest before proposal. It does not exercise this timing/leaf combination.

**Smallest correction:** revalidate the transitive records and bytes the final proposal depends on before committing it. Use core integrity helpers; do not reverse dependency direction by importing the evaluator into core. **Acceptance:** changed/missing candidate leaves, proof leaves, execution output and planning-basis artifacts after review refuse without writing a proposal event; restored valid evidence permits the normal path. **Architecture impact:** none. This is detectable pre-gate damage, not a demand for tamper-proof local storage.

### RC5 — Dead lock plus an unfinished reclaim guard bypasses the timeout (Medium)

**Code:** `core/engine/lock.ts:117–158`.

When a dead holder exists, failed `reclaim` returns to the top of the loop before either the deadline check or polling delay. An existing reclaim guard makes `reclaim` fail repeatedly.

**Counterexample:** a same-host lock naming a known exited child PID, together with `lock.reclaim` left by that exited process. `acquireLock(..., 100 ms)` never returns a named refusal; the independent 2,000 ms outer timeout kills the probe with ETIMEDOUT. Evidence: `dead-lock-reclaim-timeout`, `dead-lock-with-guard/`. This is the state possible when a reclaimer dies before moving the old lock.

**Smallest correction:** apply the bounded deadline/backoff on failed reclamation, preserving the lock/guard and returning LOCK_UNCERTAIN for unfinished takeover. **Acceptance:** dead primary lock plus stale guard returns within a bounded interval without deleting evidence; a concurrent live reclaimer is respected; successful dead-lock recovery remains. Existing tests cover a guard without this dead-primary combination. **Architecture impact:** none.

### RC6 — `verify` reports CLEAN when the referenced runtime has drifted (Medium)

**Code:** `adapters/copilot-vscode/install.ts:489–501`.

Installation validates package file hashes. Later verification only compares the package manifest's hash, while installed commands execute the runtime in that package directory.

**Counterexample:** install into the disposable `installed-fixture`, observe CLEAN, append a comment to `generated-2/runtime/core/engine/engine.ts` without changing the manifest, and verify again. Result: `ok: true`, `code: CLEAN`, `package: PRESENT`, all installed files OK. Evidence: `installed-runtime-drift`. The probe uses harmless byte drift; the missed hash check is the same for behavioral edits.

**Smallest correction:** verify referenced package files against their manifest as well as the manifest against the installed identity, reusing the existing package-validation mechanism and returning a named drift result. **Acceptance:** modified/missing runtime and profile files with an unchanged manifest report drift; clean packages stay CLEAN; verification writes nothing. **Architecture impact:** none. This does not reopen D8's install-manifest shape repair.

### RC7 — Inherited environment changes do not invalidate dependent proof (Medium)

**Code:** `adapters/node-test-executor/index.ts:40–50`, `core/engine/engine.ts:590–613`, `:789–793`; factory contract §5.

The child inherits the parent's environment except NODE_OPTIONS and NODE_TEST_CONTEXT, but environment identity contains only runtime/version/platform/architecture.

**Counterexample:** a synthetic application's existing test asserts `RSTACK_AUDIT_RC_ENVIRONMENT === 'good'`. Baseline, verification, and review complete with `good`. Change that one non-secret variable to `bad` before proposal. The recorded environment compares equal, proposal is READY, and an actual rerun of the same candidate exits 1 on that assertion. The probe restores the parent variable. Evidence: `environment-changed-after-review`, run `environment-change/.rstack/runs/RC-environment-change`.

**Tradeoff and classification:** D-S3 explicitly discloses the four-field limitation; this is not a newly discovered implementation of that limit. The governing factory contract nevertheless says changed proof environment invalidates dependent results conservatively. The reproduced stale success demonstrates that the broader claim is unsatisfied. I classify the contradiction as a blocker rather than silently treating all environment-dependent verification as current. An explicit owner decision to narrow the product guarantee would be a contract decision, not a fix.

**Smallest correction:** define the child environment that execution actually uses and include its effective identity in freshness checks, without retaining raw secret values. Conservatively refuse or require fresh proof when the baseline's environment changes; refresh verification/review only where their prerequisite proof remains valid. A controlled environment or an appropriate fingerprint can use the existing executor interface. **Acceptance:** the one-variable counterexample cannot reach a current proposal on stale evidence; unchanged environment still works; unsupported dependencies are declared, not represented as tracked. **Architecture impact:** bounded execution-policy/identity correction, no new subsystem.

### RC8 — A judgment of a waiting run is reused after that run completes (Medium)

**Code:** `evals/evaluation.ts:516–606`, `evals/summary.ts:248–257`.

Acceptance checks the run digest at acceptance time. Later listing/aggregation checks the accepted judgment and control records against each other, but not their evidence subject against the run being summarized now.

**Counterexample:** prepare and accept EVAL-1 at the first human WAIT, with `candidate-within-scope: NOT_APPLICABLE`. Resume that same run normally through decision, proof, implementation, verification, review and proposal. The evidence digest changes and the packet still resolves. Summary reports PROPOSAL_READY/task_completed true, selects EVAL-1 as ACCEPTED with `not_aggregated: null`, and counts the old NOT_APPLICABLE answer. No control file or accepted output was modified. Evidence: `stale-evaluation-after-valid-resume`, run `stale-evaluation/.rstack/runs/RC-stale-evaluation`.

**Smallest correction:** bind aggregation to the evidence subject that was judged. Keep the old evaluation as historical, but flag/exclude it for the current run state when the digest differs; do not silently fall back to another stale judgment. Alternatively, present only a clearly identified immutable snapshot, not a mixed current-run row. **Acceptance:** normal advancement after accepted evaluation yields explicit stale-subject handling; unchanged frozen runs still aggregate; new evaluation restores current aggregation; earlier bytes/adjudications remain untouched. **Architecture impact:** none. D6/D7 output, pair, ordering and copy protections remain fixed.

### RC9 — Documented shell quoting changes the human's literal answer (Medium)

**Code:** `adapters/copilot-vscode/coordinator.md:18`, `:52`; `scripts/rstack.ts` flag-based decision path.

The generated coordinator says to run commands exactly as written with double quotes and to add `--answer "<their text>"`. Double quotes do not preserve literal PowerShell input.

**Counterexample:** the installed decision command is run in actual `powershell.exe -NoProfile` with the harmless scripted answer `Return the literal text $true when disabled.`. The engine returns DECISION_RECORDED, but the retained answer is `Return the literal text True when disabled.`. The probe uses SCRIPTED provenance and a synthetic question; no real owner decision is fabricated. Evidence: `shell-results.json`, run `shell-answer/.rstack/runs/RC-shell-answer`.

**Smallest correction:** define a literal transport for human text, preferably the existing JSON decision-file interface for decisions, or correct quoting for an explicitly supported shell with refusal outside that support. Cover recorded-by, answer and abandon-reason text consistently. The coordinator currently has no general escaping procedure. **Acceptance:** exact retained bytes for dollar signs, quotes, backticks and multiline text through supported command paths, with no unintended expansion; use harmless sentinels. This can be tested offline. **Architecture impact:** none; prompt/CLI transport contract and tests. Copilot's actual terminal behavior remains a separate S6 test.

## 5. Coverage as a control system

The suite supplies substantial negative evidence. Passing tests do not close the additional branches above.

| Guarantee | Concrete checked coverage | Remaining distinction |
|---|---|---|
| Dependency direction and no runtime vendor dependency | `architecture.test.ts`: core import/name restrictions, adapter/runtime dependency check, scope check | Static import scanning is bounded; current closure also checked by package/portable tests |
| Untrusted record shape/version and identity | `contracts.test.ts`; engine CORE-1, malformed/stale/conflicting duplicate cases | Semantic truth of evidence text is a role/human judgment |
| Single writer and one dispatch | `concurrency.test.ts` CORE-3 races; `dispatch.test.ts` two drivers and both dispatcher-death windows | Cooperative grant, not revocation of external tools; RC5 timeout branch absent |
| Crash acknowledgment, journal tail, corrupt complete records, derived snapshots | `persistence.test.ts` CORE-2, tail preservation, bad checksum/schema/replay, missing/edited snapshots | Power-loss/directory durability and hostile full rewrite are outside the tested guarantee |
| Output path/link containment | `containment.test.ts` traversal, junction and wrong-attempt cases; install SECURITY-2 | File symlink case skipped; application test-pattern route not covered (RC2) |
| Human authority and bounded audit loop | `planning.test.ts` PLAN-1–5, pause/reject, second audit/no third, CLI stale version; `evidence.test.ts` provenance and replay | No autonomous engine approval found; recorder authentication and live coordinator behavior unproven; RC3/RC9 harm approval fidelity |
| Complete escaped brief | `spec-brief.test.ts` D5 grammar/rendering; planning hostile HTML test | Initial rendering is covered; post-render displayed-copy binding is absent (RC3) |
| Discriminating red and setup/error separation | `proof.test.ts` actual baseline/candidate test, vacuous/error/load/unmapped refusals | Parser silently accepts unexecuted container/skip evidence (RC1); ordinary nested leaf support not established |
| Controlled proof and configuration protected | `proof.test.ts` tester lane/developer proof/config refusals | Pre-existing tests outside protected paths may be changed/deleted; measured, not automatically refused |
| Delayed worker isolation | Proof/evidence tests for abandoned planner/tester/developer and late writes before/after acceptance; shared-target block fixture | Before-submit cross-lane writes are measured but not prevented; host confinement remains unobserved |
| Exact candidate verification and independent review subjects | Proof reviewer-input, wrong-subject, REJECT/INCONCLUSIVE, failed-verification retry tests | Model judgment is simulated; environment freshness only checks four fields (RC7) |
| Retained evidence freshness at proposal | Proof REVIEW-1 environment-version test, leaf-before-verify/manifest-before-proposal test, packet-only reconstruction | Post-review leaf corruption not gated (RC4); referenced runtime/host evidence is not a model guarantee |
| Evaluation isolation, immutable accepted output and control pairs | `evaluation.test.ts` malformed/changed output, separate/colocated layouts, area changes, D6-R2-A pair/refusal tests | Authorship not authenticated; current run digest is not rebound at summary (RC8) |
| Stable evaluation ordering/copy reconciliation | D7 tests for numeric ids, canonical times/expanded years, copies/control conflicts in both argument orders | No current-subject freshness check; no proof of semantic judge accuracy |
| Honest denominators and provenance | Evaluation summary fixtures: unknown/not-applicable excluded, qualified owner tallies separate, scripted calibration excluded | Existing metric wording suggestions remain; evidence class never upgrades simulated roles |
| Generated contract/recovery agreement | `protocol.test.ts`: D3 complete shared template; D4 real CLI abandon/retry/refusal sequence | These prove format agreement, not that a model follows instructions |
| Package provenance, determinism, role tools/selectors | `package.test.ts`; alternate profile/transport/Skill/retirement in `extension.test.ts` | Discovery, fresh context, tool enforcement and actual model selection need S6 |
| Ownership, update, rollback, malformed manifests | All 11 `install.test.ts` tests, including D1/D2/D8, partial writes and existing manifest-temp collision | Runtime-byte drift missing in verify (RC6); crash/transaction limits disclosed |
| Relocation and shell arguments | `portable.test.ts` whole relocated lifecycle through cmd.exe; source-load audit; Git Bash skipped | Spaces/comma passing is not arbitrary literal-text preservation (RC9); host invocation unobserved |
| Disabled external integrations | `adapters.test.ts` STUB-1/2, network-denying preload and deferred module-load checks | Jira/Bitbucket implementations intentionally absent; no external publication |

Critical offline gaps are therefore specific branches, not a request for mutation coverage of every line. The RC acceptance cases should become ordinary regressions. Source-based instructions to obey grants, seek a human decision, keep independent reasoning sessions, perform semantic investigation and refrain from unauthorized tools remain **host/behavioral claims**; fake results cannot establish them.

The sensitivity source was inspected in full but not run. The prior combined report audits a retained **4/99 subset** on the repaired candidate; this audit does not add it to a new total or claim a full pass. There is still no independent end-to-end coverage here of interruption during a child, killed/no-report child outcomes, failed unmodified control completion, or descendant cleanup after timeout. The interrupted-control branch adds a summary row without appending it to `cases.jsonl`, and `liveDigest` descends into scratch before filtering it. These are retained runner limitations, not evidence that a product guard passed or failed.

## 6. Risk disposition and remaining limits

Each item has exactly one classification. BLOCKER rows refer to the demonstrated findings above; they are not deferred to S6. The rest of the table is the remaining known-limitations register. Historical resolved items are explicitly distinguished.

| Risk / limitation | Classification | Basis and remaining consequence |
|---|---|---|
| Top-level TAP, skips, TODO and suite containers | BLOCKER_BEFORE_S6 | RC1; execution eligibility must be repaired |
| Application test-pattern traversal | BLOCKER_BEFORE_S6 | RC2; frozen owner config does not make outside bytes part of the measured tree |
| Mutable displayed brief | BLOCKER_BEFORE_S6 | RC3; initial D5 completeness does not bind later displayed bytes |
| Retained candidate/evidence changes after review | BLOCKER_BEFORE_S6 | RC4; proposal gate must resolve its dependencies |
| Interrupted reclaim with dead primary lock | BLOCKER_BEFORE_S6 | RC5; documented bounded refusal is not delivered |
| Referenced package runtime drift | BLOCKER_BEFORE_S6 | RC6; CLEAN currently overstates checked bytes |
| Inherited environment variables | BLOCKER_BEFORE_S6 | RC7; disclosed four-field identity conflicts with broader required invalidation, now demonstrated |
| Evaluation retained while run advances | BLOCKER_BEFORE_S6 | RC8; unchanged judgment is still about a different evidence subject |
| Literal shell transport of human text | BLOCKER_BEFORE_S6 | RC9; PowerShell alteration reproduced offline |
| Deleting/changing pre-existing application tests outside protected paths | FUTURE_HARDENING | Reproduced: introduce a default-flag regression, observe the existing test fail, delete `tests/existing.test.js`, then get verification PASS/proposal READY. `legacy-test-deletion` retains evidence. The current deterministic contract protects controlled tests and configured protected files; reviewer prompt explicitly asks about removed checks. Automatically freezing all legacy tests would change that policy and can forbid legitimate test maintenance. Do not claim all regression coverage is immutable. |
| Partial install writes without undo registered | NO_LONGER_APPLIES | R1 repair registers undo first; normal suite exercises partial new/update/temp writes and existing-temp collision. Not reopened. |
| Node range declared, not enforced; other 24.x/OS combinations untested | ACCEPTED_LIMITATION | Direct TypeScript runtime and one tested Node/Windows environment; unsupported Node may fail at load. No wider portability claim. |
| Regex-derived static runtime closure | ACCEPTED_LIMITATION | Current explicit inventory, import-resolution and relocated-load tests pass. No dynamic dependency discovery promise. |
| Absolute local paths in installed files/manifest; package relocation requires reinstall | ACCEPTED_LIMITATION | Deliberate three-root resolution; publishing install metadata can disclose paths. Current relocation check passes. |
| Installer in-process undo is not crash/power-loss durability | ACCEPTED_LIMITATION | Killed install may leave unmanaged collisions; explicit operator recovery. No prior-version backup; rollback to old release needs retained old package. |
| Nontransactional uninstall | ACCEPTED_LIMITATION | Only unmodified, regenerable, manifest-owned files removed; interrupted removal can need reconciliation. |
| Installer plan/apply races and local ownership-manifest forgery | ACCEPTED_LIMITATION | No atomic transaction against another writer and no authenticated ownership store. Existing collision/user-edit protections are real within the declared model. |
| Remaining package-manifest shape diagnostics | FUTURE_HARDENING | Package loading does not use the same exhaustive whole-shape validation as repaired install-manifest loading. Malformed package data can still produce generic exceptions; no unsafe write demonstrated. Do not conflate with D8. |
| Filesystem lanes are detection at submission, not prevention | ACCEPTED_LIMITATION | Per-attempt copies protect retained accepted content from later work-copy edits; they do not revoke another process's access before submission. |
| Run directory/control files mutable by local processes | ACCEPTED_LIMITATION | Checksums are not signatures; full valid journal/control forgery or truncation is outside this local model. RC3/RC4/RC8 concern ordinary detectable mismatches and remain separate blockers. |
| Arbitrary application tests execute as this user, without a sandbox | ACCEPTED_LIMITATION | Synthetic fixtures only. No network/process confinement, hermetic imported tools or filesystem dependencies claimed. RC2 addresses a narrower preventable pattern escape. |
| Journal file fsync but not directory fsync; network/shared filesystem, PID reuse | ACCEPTED_LIMITATION | Local single-host scope; power loss untested; PID reuse can safely strand a lock as busy. RC5 is not excused by these limits. |
| ALREADY_SATISFIED tests can be vacuous despite actually running | ACCEPTED_LIMITATION | Mechanical pass is not semantic sensitivity; deterministic evaluation already says NOT_DEMONSTRATED. RC1 is stronger: mapped assertions never ran at all. |
| Decision/adjudication provenance is a recorder claim | ACCEPTED_LIMITATION | HUMAN_RECORDED is not authentication; names and flags do not prove a person acted. Engine has no autonomous approval transition, but a file-capable actor can forge a claim. |
| One judge per run, same model family, unavailable effective model/usage/cost, limited calibration | ACCEPTED_LIMITATION | Earlier calibration and qualified owner answers remain historical evidence; no independent-party/variance/accuracy claim or fresh semantic judging here. |
| Scope checker ignores ignored paths outside package | FUTURE_HARDENING | Helper is a Git-visible path check, not a filesystem sandbox |
| Finding targets that resemble ids are not resolved | FUTURE_HARDENING | Semantic evidence/target quality remains role/human work; tighter referential validation could be added within that contract |
| Extra profile role names accepted; role timeout_seconds unused | FUTURE_HARDENING | Attempt limits work; transport latency/worker cancellation is not enforced by this setting. No claim of timed-out role revocation. |
| Unreadable-journal and refusals_visible metric descriptions | FUTURE_HARDENING | Wording can imply more than implementation: uninterpreted runs excluded; visibility counter is not semantic proof that a human saw each refusal |
| Growing tests/.tmp and liveDigest scratch traversal | FUTURE_HARDENING | Retained fixtures accumulate; no broad cleanup performed. Hashing should exclude scratch before descent. |
| Sensitivity interrupted-control row and child-cleanup/report branches | FUTURE_HARDENING | Limits in §5 remain; no full sweep required to repair the release candidate |
| Missing historical S4 copies for five S5-edited files | ACCEPTED_LIMITATION | Historical restoration gap remains; current committed RC is recoverable in Git, but that does not recreate missing old S4 bytes |
| Old generated command depended on source checkout | NO_LONGER_APPLIES | S5 replaced it with install-time absolute roots; current portable lifecycle/module-origin tests pass |
| Exact model selectors, cost-tier pairings, effective model and effort | TEST_DURING_S6 | All trial selectors still unobserved; generated model keys omitted; no fallback or profile change authorized |
| Licensed environment, current VS Code/Copilot versions and session target (U1) | TEST_DURING_S6 | Owner reports required environment unavailable now; historical licence/version observations not refreshed or presented as current facts |
| Agent/Skill discovery, tool-set names, instruction retrieval, linked resources (U6/U8) | TEST_DURING_S6 | Generated files/schema tests cannot prove what host loads |
| Fresh context and Planner/Auditor, Tester/Developer, Developer/Reviewer independence | TEST_DURING_S6 | Distinct roles/envelopes and limited auditor/reviewer inputs enforced offline; actual independent sessions/models not observed |
| Planner/auditor access to primary application evidence | TEST_DURING_S6 | Planning envelopes supply requirements/plan refs, not an application copy/base ref. The installed workflow must demonstrate how those roles obtain correct primary repository evidence, especially when app and workspace roots differ; no successful host investigation inferred. |
| Inherited parent/user instructions, actual tool confinement, terminal approval (U8/U9/U11) | TEST_DURING_S6 | Must observe without weakening trust/permissions; declared tool lists are not a tested sandbox |
| Coordinator obeys grants/refusals, does not fabricate human choices, keeps file transport exact (U7/U12) | TEST_DURING_S6 | CLI agreement proven; live behavior, human wait/restart/resume and retrieval not proven |
| Corrected shell transport through the actual Copilot terminal | TEST_DURING_S6 | Follows RC9 offline correction; Git Bash skipped here, and no Copilot terminal observed |
| File symlink refusal on a platform permitting creation | TEST_DURING_S6 | Explicit skipped environment path; existing junction results do not stand in for this check |
| Hooks and external integrations | ACCEPTED_LIMITATION | Hooks deferred; Jira/Bitbucket intentionally unavailable; local proposal is the endpoint. No host or external action claimed. |

## 7. Human authority and role independence conclusion

The deterministic route never infers a proceed/amend decision from a clean audit, a pause, a rejected plan, an absent response, or a declined second audit. First audit always reaches the checkpoint; second audit requires the human action; counters survive resume; no third audit exists. Amended-plan authorization preserves the actual auditor verdict and does not waive proof, verification or final review. RC3 and RC9 still prevent a blanket approval-fidelity claim.

Planner and auditor use distinct roles; the second auditor receives only the revised plan and original requirements. Tester and developer receive separate copies with enforced controlled-proof/config boundaries. Reviewer receives the exact candidate and evidence, without developer narrative, and cannot submit developer edits as its result. Generated worker agents cannot delegate; reviewer/planner/auditor lack a terminal tool in the generated declarations. The coordinator alone declares delegation. Actual host enforcement and independent reasoning sessions remain TEST_DURING_S6.

## 8. Release decision and handoff

**CHANGES_REQUESTED_BEFORE_S6.** Repair RC1–RC9 with the bounded acceptance cases above, then independently verify the changed candidate. The current passing suite is a baseline, not evidence that these counterexamples are fixed. An owner-approved narrowing of a stated guarantee must remain an explicit contract decision and must not be described as a repair.

No architecture replacement is requested. No production/test/profile implementation changed; no warnings were suppressed. No staging, commit, push, merge, live Copilot, external integration, employer repository, or installation into a real workspace occurred. S6 remains paused and unvalidated. The audit ends with this report; builders are not instructed to resume.
