# Astra combined R2 correction 2 / R3 / R4 independent verification

**Date:** 2026-10-04. **Verdict: APPROVE OFFLINE REPAIRED CANDIDATE.**

All original defects D1–D8 are **VERIFIED_FIXED** within the offline scope below. No blocking product defect or missing evidence required for this combined verification remains. This is an independent review of the uncommitted candidate, with fresh execution of the requested checks, not an approval to checkpoint, publish, install, or begin S6. Host behavior remains **UNVERIFIED_ON_HOST**.

## 1. Subject, identities, and preservation

Used the existing checkout at `C:\Users\Ramon Lorente\Documents\Claude\Projects\copilot-agentic-workflow`, branch `feat/rstack-sdlc-local-build`, HEAD **`60c2ba96586ca183cd338512b50e0d214a7a9b08`**. No worktree or branch was created. The owner's confirmation that both builders were stopped defines the review window.

Read the original offline review, R1 verification, R2 verification including correction 1, final correction-2 record, R3/R4 records, integration record, and applicable decisions. Inspected the current source, changed contracts/prompts, tests, generated package, and retained evidence. Earlier findings and builder records were not edited or relabelled.

**98/98 files match** `.rstack/integration-r2c2-r3-r4/source-identities-final.txt`, including the final progress and decisions records. All 98 remained byte-identical through this review. The canonical reviewed inventory SHA-256 is:

`b084ac0d99b71bbd0678816b3ae943f8a279ce1165b31a8bb54bd14e0486ad47`

Definition: the 98 pre-existing tracked/nonignored untracked files under `rstack-sdlc/`, sorted by repository-relative forward-slash path using ordinal string comparison; each entry is `sha256 + two spaces + path`, joined with LF and no trailing LF. This new report, ignored/generated directories, and disposable fixtures are excluded. Full ordered paths/hashes are in `tests/.tmp/astra-combined-20261004/source-after.json`; the initial inventory is `source-before.json` in that directory.

The independently recomputed **runner-compatible digest**, over 85 source/test/fixture/profile/configuration inputs, is:

`8e78e82164f994ce9d514e88adb13b0e302036ff9806f7a7280de1af5dbf5b38`

It matches both recorded ends of the retained four-case sensitivity run. The reviewer computed it while skipping `tests/.tmp/` before descent. These are different inventory definitions, not competing candidate identities.

Selected full raw-byte identities, package-relative:

| Input | SHA-256 |
|---|---|
| `adapters/copilot-vscode/install.ts` | `c45b51f09ced28617c9fb3389ac06edc291c12212363703fef237dbaf56f3364` |
| `tests/install.test.ts` | `72024333003d4c30b82a056ed624efd419dab0800b3889731e883c809d773f21` |
| `evals/evaluation.ts` | `125af3001f32d96e3f113ba8eecc76c54633453fe8d43e746c5d034d72b9d317` |
| `evals/summary.ts` | `8541a169c7ae464db227b4bc001a5d60f32ca32ef5badabf94279e7112a22861` |
| `tests/evaluation.test.ts` | `37c512d0fc03fb29c890211e736129c7c3fb2a54b11af9513169a9b84cd2f055` |
| `core/contracts/planning.ts` | `32dee024c9004d23ddce5528eebd278213aef727b402a7bcd35951040196ff30` |
| `core/engine/brief.ts` | `46b312c2bf4ba0dbcaa69f09cff2ea94ad1da8019c29dae71667db527cce30e3` |
| `core/skills/application-records/SKILL.md` | `0832fd2787c3d725b03ff6952d24cb89bf0bf18432b9a45c853badd8416d7c1e` |
| `core/skills/planning-records/SKILL.md` | `df4abe1e02335df469ba8915725b9215eda87640cf5f25b79dd85c82d934a6e3` |
| `adapters/copilot-vscode/coordinator.md` | `beb0d8505b9de05f775ed52aeb751870bc35eb964ae38c0c1fec03235ae39cc0` |
| `tests/protocol.test.ts` | `3960d93236c8e01e3f72efc9251944ff3425784397bb17f770e3eca044966298` |
| `tests/spec-brief.test.ts` | `9e587ecde78e8e0b46dcce08c587fc92ad4dc96aa19de5530b48368693d0d1af` |
| `tests/sensitivity.ts` | `7f88c2387dde6df6867e087814e7e98447f9e4f1ffee56c0f09edc8b055954da` |
| `docs/progress.md` | `d9bdee74f1e715ca5c17a04e77c31f896b3e22f6cbadd919e2c095e2bc339a54` |
| `docs/decisions.md` | `b6a44964821b93f4a2d7e5649280738d38f3658253fc159b5b843bcd7ee7e307` |

## 2. Checks actually executed by this reviewer

Node **v24.21.0**, Windows. Commands ran sequentially, from `rstack-sdlc/`; no two test commands overlapped. The full-suite command retains its own normal internal test concurrency.

| Requested command | Independent result |
|---|---|
| `npm run typecheck` | **PASS**, exit 0, `tsc --noEmit -p tsconfig.json`. |
| `node --test tests/evaluation.test.ts` | First sandboxed launch: exit 1, `spawn EPERM` before test bodies. Same command outside the sandbox: **PASS**, exit 0, **19 pass / 0 fail / 0 skip**. |
| `node --test tests/protocol.test.ts` | **PASS**, exit 0, **7 pass / 0 fail / 0 skip**. |
| `node --test tests/spec-brief.test.ts` | **PASS**, exit 0, **7 pass / 0 fail / 0 skip**. |
| `node --test tests/planning.test.ts tests/package.test.ts tests/contracts.test.ts` | **PASS**, exit 0, **24 pass / 0 fail / 0 skip**. |
| `npm test` | **PASS**, exit 0, **144 tests: 142 pass / 0 fail / 2 skip**, approximately 69 seconds. |

After the sandbox startup refusal, the evaluator retry and remaining test commands ran with tool-approved execution outside the sandbox. No test isolation flag, warning suppression, source change, or environment setting was used to turn a failure into a pass. The initial launcher failure is retained separately.

The full-suite skips were:

- `a symbolic link to a file is refused`: test reports that file symlink creation needs elevation or Windows Developer Mode.
- `the installed command lines keep their arguments whole under Git Bash`: the existing availability probe reports Git Bash unavailable in this execution environment.

These paths are **not independently verified by this run**. The builder's earlier **143 pass / 1 skip** is separate evidence and is not substituted for this reviewer's **142 / 2**. Neither skipped path is a repair-specific D1–D8 regression. All eleven installer tests and the existing shared-write-target abandonment test passed in the full suite. The earlier historical `state.json` rename failures and old sensitivity nondetections keep their recorded, unconfirmed causes.

Reviewer logs and JSON audit results are under `tests/.tmp/astra-combined-20261004/`: numbered command logs, `test-results.json`, `recorded-identity-check.json`, `package-check.json`, `history-and-specs-check.json`, `continuation-probes.json`, `retained-sensitivity-check.json`, and `process-check.json`. These are disposable reviewer evidence, not edits to authored tests or retained builder evidence.

Several read-only reviewer helper attempts needed correction: checksum records use the `*path` form; the retained exit text is `sensitivity exit 0`; and the manifest's profile source is a descriptive input label rather than a filesystem path. An exploratory manifest filename lookup also failed. Corrected audits completed with explicit assertions. None of these helper failures was a product-test failure, and none justified changing the candidate or retained records.

## 3. Defect verdicts

| Original defect | Verdict | Evidence on this candidate |
|---|---|---|
| **D1** — ownership inferred from identical bytes | **VERIFIED_FIXED** | Installer and installer tests have the exact R1-verified hashes above. `install.ts:299–343` treats an existing unmanaged file, even identical, as a collision before writes. Full-suite ownership, drift, reinstall, and uninstall regressions passed. |
| **D2** — removed Skill lost on rollback; undo failure hidden | **VERIFIED_FIXED** | Registration precedes writes; removed Skill directory restoration precedes file restoration; incomplete undo is reported with its cause and outstanding steps. Full-suite rollback, partial-write, and pre-existing manifest-temp collision regressions passed. This verifies in-process exceptions, not crash durability or transactional uninstall. |
| **D3** — incomplete role result contract | **VERIFIED_FIXED** | Both source Skills and generated Skills have the identical complete eleven-field contract; direct role-to-Skill linkage and parser/stage agreement passed the seven-test protocol file. Details below. |
| **D4** — refused submit has no documented recovery | **VERIFIED_FIXED** | Generated Coordinator commands exercised through the CLI, with pending-attempt identity, explicit abandon, separate retry, stale-result refusal, and attempt exhaustion. Details below. |
| **D5** — approved specification content absent from brief | **VERIFIED_FIXED** | Closed parser, complete escaped display, refusal/continuation fixtures, engine submission, and twelve retained specifications verified. Details below. |
| **D6** — evaluator trusts judge-area controls / changed accepted content | **VERIFIED_FIXED** | All original D6 regressions and stored-record validation passed. **D6-R2-A is VERIFIED_FIXED**, including the two correction-1 command findings. |
| **D7** — incorrect latest ordering / copy reconciliation | **VERIFIED_FIXED** | **D7-R2-A is VERIFIED_FIXED** for parsed-instant ordering, expanded years, numeric ties, and invalid timestamps. **D7-R2-B remains VERIFIED_FIXED** for actual request/acceptance byte comparisons and argument-order-independent reconciliation. |
| **D8** — malformed install manifest dereferenced | **VERIFIED_FIXED** | Whole-shape validation remains before caller dereferences. Full-suite malformed-manifest and unsafe-path regressions passed; installer source/test hashes match the R1-verified versions. |

### R2 correction 2 and retained history

`evaluation.ts:252–280` centralizes the pair rule. `checkedPair` validates the request first, then the acceptance, then their evidence-digest agreement. Repeat acceptance at line 334 returns the stored verdict only through this helper; adjudication at line 450 uses it before its eventual append. The reader uses the same pair rule. No refusal branch repairs records or writes a new verdict/adjudication.

The correction test at `tests/evaluation.test.ts:928` independently passed in the focused and full runs. In both SEPARATE and COLOCATED fixtures, `{`, `null`, and `{}` requests make repeat acceptance refuse; contradictory request/acceptance evidence digests make both commands refuse. Snapshots include every file and directory in both evaluation areas and establish no writes. Valid repeat acceptance preserves `checked_at` despite a later supplied clock. Valid adjudication appends sequences 1 and 2 and changes no other file. Existing malformed-record/adjudication and original judge-area/changed-content tests also passed.

`evaluation.ts:611–620` compares `Date.parse` results of already-validated canonical timestamps, then numeric evaluation-id suffixes. The focused tests exercise 9999 to `+010000` with identities in both senses, years −2 to −1, negative to ordinary years, ordinary dates with opposing numeric ids, and equal expanded-year instants. Malformed, missing, numeric, and noncanonical timestamps remain INVALID with no selected fallback. No timestamp range was narrowed.

D7-R2-B remains covered by source inspection of `control_sha256` and `summary.ts:183–223`, plus fresh tests for request-only and acceptance-only conflicts, both individually valid and invalid variants, both argument orders, identical copies, and compatible supersets. Source `summary.ts` is unchanged from the accepted correction-1 identity.

Read-only history audit: all **31** retained evaluation/control/adjudication/summary/expectation files named in the preceding review's inventory still match their historical hashes. Eight historical evaluations read without INVALID status or issues; the import has no evaluations. Summarizing the retained runs/imports in both orders yields identical results, preserves the **four selected evaluations**, and matches the stored metrics, judge answers, fixture agreement, and human calibration: **7 entries / 6 cases / 4 CONFIRM / 2 MODIFY**. No control directory was created and nothing historical was rewritten.

### R3 / D3: role contract

The result sections of `planning-records` and `application-records` are byte-identical in source and generated output. Both contain numeric `schema_version: 1`, `record_type: "role-result"`, the envelope identities, numeric `expected_version`, `input_digest`, `outcome`, `summary`, `outputs`, and `files`. All eleven are required by `parseSubmission`; deleting each field separately and giving the version as text is refused.

Planner and plan-auditor directly name the planning-records Skill; tester, developer, and reviewer directly name application-records. The generated agents carry the applicable Skill name and the source role's reference to its `result.json` section. No role depends on the planner prompt for the contract. Filled templates for every role stage parse; file keys match `WORKFLOW.stages[].produces`, including the developer's empty object and the planner's revision outputs. A template filled from a real dispatched envelope is accepted by the engine. No duplicated inline role schemas are required. The Skills explicitly say these roles do not use NEGATIVE and must stop if they cannot produce a valid result.

### R3 / D4: recovery protocol

The generated Coordinator documents `status`, `next`, `submit`, and the exact `abandon --attempt ... --reason ...` command. On refusal, it instructs one status read, comparison with the submitted attempt, reporting the refusal/id, and stopping for human authorization. A human must name the exact pending attempt. Bare abandon stops; abandon-and-retry performs a separate `next`; a stale result never authorizes abandoning the newer attempt.

The CLI-level test extracts those generated command lines and exercises:

`MALFORMED_RESULT → status(same pending) → PENDING_IN_FLIGHT → wrong-id NOT_PENDING → FAILURE_RECORDED(no dispatch) → next(new id) → STALE_ATTEMPT(old result, new attempt preserved) → second refusal/abandon → ATTEMPTS_EXHAUSTED`.

The actual engine `abandon` rechecks the pending identity and records EXECUTION_UNCERTAIN. Profile budgets remain effective. The full suite also passed `tests/evidence.test.ts`'s existing shared-write-target case, which exercises WORKER_QUIESCENCE_UNPROVEN using a modified test workflow. No current production workflow stage has that flag; the new Coordinator-specific test only checks that blocker's instructions.

**Offline tests establish agreement between the documented commands and the CLI/engine. They do not establish that a Copilot model will follow the instructions, solicit the right authorization, or respect its write boundary.**

### R4 / D5: approval completeness

`parseSpec` requires a title, exactly one nonempty Intent, at least one unique `AC-n` criterion, and optional nonempty Exclusion items. Continuations attach only to an immediately preceding item; a blank or refused line ends that attachment. Unknown capitalized labels, headings/list/table/fence syntax, orphan text, duplicate Intent, duplicate criterion ids, and the tested malformed criteria are refused, with line diagnostics where applicable.

The brief renders the parsed title, intent, all criteria and exclusions. Every dynamic value passes through escaping, with the existing restrictive content policy. The new seven-test file exercises parsing, engine refusal, exact submitted specification hash binding, full display, and hostile text. Additional reviewer probes demonstrate the expressly documented limits:

- Continuation line breaks become spaces. The accepted grammar treats these as plain-sentence continuations; the complete text remains visible.
- A capitalized `Note:` continuation is refused. This is a conservative authoring restriction, not approval of hidden text.
- A lowercase `note: AC-1 does not apply to admins` continuation is accepted and displayed inside that criterion. A lowercase continuation containing a script payload is displayed escaped, with no executable script element.

**These are acceptable documented consequences of this closed syntax. No concrete approval-integrity defect was found:** accepted content reaches the human, and conservative refusals require rewording rather than silently approving omitted content. This is not a claim of raw-byte or original-layout reproduction in HTML, or semantic judgment of whether a criterion is correct. All **12 retained `spec.md` files** parse under the new contract and stayed byte-identical; no historical specification needed migration.

## 4. Package verification

Inspected the integrator's two identical 33-file inventories and generation evidence. Independently generated twice into two fresh, resolved reviewer-owned subdirectories under `tests/.tmp/astra-combined-20261004/`. Their entire relative-path/hash inventories equal each other and the retained `dist/copilot-vscode/` package. The retained `dist/` was not regenerated or edited by this reviewer.

Every generated file's output hash matches the manifest; every source hash matches its current source, treating the profile as the generator's explicit profile input. The manifest hash is **`f0324e6c8a1c5b8e5499986770f4af469bc2272b7e52e3ba05d572d823b8b2d8`**, as recorded by integration.

Verified the role/Skill result contracts, Coordinator recovery instructions, and runtime `core/contracts/planning.ts` and `core/engine/brief.ts`; the latter two are byte-identical to source. Evaluator code is intentionally outside the installed runtime's static import closure. No real workspace installation occurred. Model selectors and host confinement remain unobserved; package equality is not Copilot validation.

## 5. Sensitivity: evidence and limits kept separate

No sensitivity run was launched by this reviewer. A rerun was unnecessary: the retained source/runner hashes match this exact candidate, and all **seven** `cases.jsonl` rows reconcile with `summary.json`, named stdout/stderr files, test counts, failing test names, completed states, signals, and exit codes. The recorded overall exit is 0. Three controls pass (19, 7, and 7 tests); all four cases are DETECTED with exit 1 and the designated test failing, no signal or launch error, and empty stderr. The summary explicitly says SUBSET / `full_sensitivity_pass: false`, with no leftover copies. The 57 integration-evidence files remained hash-identical during the audit.

| Case | Guard demonstrated on this exact source by independently audited retained builder execution |
|---|---|
| **93** | Time ordering precedes id ordering; target is now `return ta < tb ? -1 : 1;`. Replacing it with id ordering fails the named D7 test and the expanded-year test. |
| **97** | Unknown specification labels are refused. Only the SPEC_LABEL branch is disabled, leaving markup refusal active. |
| **98** | Specification exclusions reach the human brief. Replacing their display with “None stated” fails the named completeness test. |
| **99** | The planning-records result template includes `record_type`. Removing that line fails the named required-fields test and the generated contract checks. |

This is **4/99** mutation coverage on this candidate, from retained builder execution audited by the reviewer. It is neither a fresh reviewer mutation run nor a full sensitivity pass. Earlier subsets used different source digests and are not added to this total.

**Guards without specific mutation coverage:** request validation before returning a stored verdict; command-side request/acceptance pair agreement; parsed-instant comparison versus lexical timestamp comparison (case 93 breaks time ordering altogether); and the D4 Coordinator instructions. These have focused regression/source evidence described above. Lack of a mutation case is not a product defect or a blocker under this verification request.

**Existing runner limitations remain:** no independent end-to-end evidence here for interruption during a child, a killed child, normal completion without a usable report, a completed failing unmodified control, or descendant cleanup after timeout. The interrupted-control branch still pushes a summary row without calling `completed(row)`, so that row may be absent from `cases.jsonl`. The earlier real timeout demonstration is evidence on its recorded earlier source, not a new experiment on this candidate. The runner also still traverses `tests/.tmp/` before filtering it in `liveDigest`; the reviewer avoided that traversal when independently hashing. These limitations were not repaired or promoted into claims of coverage.

## 6. Closure

The only authored file added by this reviewer is this combined record. Production code, test sources, builder progress/decisions, historical reviews, evaluations, and retained integration evidence are unchanged. Existing staged state remains empty. No warnings were hidden or suppressed; no lint/build/browser checks beyond the explicitly requested typecheck/tests were claimed.

The initial ordinary-permission process query was denied. A subsequent tool-approved read-only process inspection at **2026-10-04T12:39:33.985Z** found **zero package/test Node processes and zero unreadable Node command lines**. Both asynchronous reviewer test sessions returned exit 0, and every reviewer helper command returned. No unrelated process was stopped. All reviewer processes have exited at handoff.

**APPROVE OFFLINE REPAIRED CANDIDATE**, with the exact source identity in section 1, two explicit test skips, scoped sensitivity evidence, and existing runner/host limitations above. No blocking changes or additional independent evidence are requested for this offline repair gate. Builders may remain stopped pending the owner's checkpoint/S6 decision. No staging, commit, push, installation, live Copilot work, Jira/Bitbucket work, or S6 was performed. Stop.
