# Independent verification — single-entry UX and model-pinning support

Date: 2026-10-04 (America/New_York; retained execution timestamps use UTC).

**Overall verdict: CHANGES_REQUESTED_BEFORE_S6_HOST_CONFIRMATION.**

The generator, profile contract, generated package, and authorized offline regression checks passed. Two bounded documentation findings remain in the S6 owner procedure: its first probe does not exercise the installed Coordinator/Planner pair requested by this review, and its post-probe continuation conflicts with the recorded D-SE gate. These findings require an owner-script correction, not a redesign or a production-code repair. No fixes were implemented.

The new candidate is **not approved** by this report as the S6 subject. The historical `READY_FOR_S6` verdict remains with the old candidate. No selector is validated by this review, and `COPILOT_VALIDATED` remains **NO**.

## 1. Findings requiring correction

### SE-S6-1 — P2: the first bounded probe substitutes a scratch worker for the installed Planner

Location: `docs/s6-owner-script.md:257-295`, especially line 295; real dispatch procedure at lines 380-417.

The review request, section 15(D), requires the first model/visibility probe to cover the hidden Planner being callable through the Coordinator allowlist. Stage P instead creates `probe-lead` and `probe-worker`, sends `Run the probe.`, and records a `PONG`. Line 295 explicitly defers `rstack-sdlc-planner` to stage 4. Stage 4 then runs the full intent/specification/plan/audit sequence before its normal checkpoint, rather than providing that bounded first check.

**Concrete counterexample:** the scratch agent files load and their dispatch succeeds, while the installed `rstack-sdlc-planner` is unavailable or not the agent actually resolved by the installed Coordinator. Stage P C–E can still succeed. The installed-pair requirement therefore remains untested at the end of the first probe. The script honestly describes this limitation, but it does not meet the requested coverage.

**Smallest correction:** keep the scratch pair for the Sonnet-to-Opus tier/model experiment, and add or extract a bounded installed-Coordinator-to-installed-Planner check before progressing into the full workflow. Reuse the existing engine-granted envelope and installed names; do not directly invoke the hidden worker outside the engine, pin the real profile, or alter source behavior. Make the single-dispatch stopping point and evidence to retain explicit. Change only `docs/s6-owner-script.md` for this finding.

**Acceptance check:** a walkthrough of the revised first probe identifies both actual installed agent names, the engine-granted Planner attempt, the unchanged envelope, invocation evidence, and the stopping point. A successful scratch `PONG` cannot complete the installed-worker item; absent/refused actual invocation blocks progression. The actual live result remains `HOST_CONFIRMATION_REQUIRED` until S6.

### SE-S6-2 — P2: the owner procedure and D-SE give conflicting post-probe orders

Locations: `docs/decisions.md:560`; `docs/s6-owner-script.md:353-357`, then stage 4 at lines 386-398.

D-SE says that, if the three selector lookups and tier pairing succeed, a separate bounded production-profile change, regeneration, and focused independent verification occur **before** the full S6 workflow. The owner script says its unpinned baseline rule continues regardless of stage P's findings, with model-specific routing deferred until **after** a successful baseline. It then tells the owner to start run W without the D-SE gate.

**Concrete counterexample:** all three lookups succeed and the scratch Opus worker's effective model is observed. Following the script proceeds into the unpinned planning/audit workflow; following D-SE stops for the separately authorized pinning change and review. Both instructions cannot govern that same successful-probe path. This is a preparation inconsistency, not evidence that any selector has already been activated.

**Smallest correction:** align the owner script's post-probe branch with the current D-SE decision, explicitly stopping and handing off before the full workflow where that decision requires it. Do not activate selectors as part of the correction. If the owner intends to retain the older unpinned-full-baseline order, that is an explicit decision change rather than a reviewer assumption. Under the current recorded decision, only `docs/s6-owner-script.md` needs correction.

**Acceptance check:** walk the success, unavailable-selector, tier-refusal, and unobservable-effective-model outcomes. Each has one clear next action; none silently authorizes a production pin or passes an unobserved effective model as confirmed. The successful-probe path and D-SE agree about the next independent-review gate.

## 2. Exact subject and preservation

Checkout: `C:\Users\Ramon Lorente\Documents\Claude\Projects\copilot-agentic-workflow`.

| Identity | Independently recorded value |
|---|---|
| Branch | `feat/rstack-sdlc-local-build` |
| HEAD | `07ffeebaeefab5f76c7e72e166eac52b2b789717` |
| Index | No staged changes, before or after verification |
| Candidate inventory | 114 files; SHA-256 `7bb0eb7325b59b0e682f0dfb0906b0b11ce56325c5523fc747fd387f6b3f0500` |
| Candidate package manifest | `d5ce0c0cfd6fcffec8a2196ae53a7c5fccc4aac014be6fc39f6b7abffff814f9` |
| Trial profile bytes | `3338b15a6c54fb81dfca943a01213950a6afe40153c483d6a75f555f6ff967a8` |
| Owner-script draft | `405703f73715486891c2d68cf27ec1da3985fb094a769f64f8995c403c1919ae` |
| Historical checkpoint | `07de93a49b4ec62ada46f0a55d2430ac208a4b53`, still available |
| Historical package in `C:\rstack-sdlc-smoke\package` | Manifest `1f5eaef83d2309b7daddaec978fe147128d06cbe5b35a4efb8e4f1513e6208fa` |
| Historical RC7 report | `ec18a4436db2d236678b8a9b3db8c3c0b41faea9cf85a35d0a495749cbfb56da`, unchanged |

Inventory method: every tracked or nonignored untracked file under `rstack-sdlc/`, sorted by ordinal repository-relative path; raw file SHA-256; digest of `<hash>  <path>` lines joined with LF, without a final LF. This new report is a reviewer output and is excluded from the 114-file candidate subject. The complete path/hash inventory is retained in `.rstack/astra-single-entry-20261004/source-before.txt` and `source-after.txt`.

Nine tracked files were modified against HEAD:

- `adapters/copilot-vscode/generate.ts`
- `core/contracts/records.ts`
- `docs/decisions.md`, `docs/progress.md`, `docs/s6-host-validation.md`, `docs/s6-owner-script.md`
- `tests/extension.test.ts`, `tests/package.test.ts`, `tests/sensitivity.ts`

The one candidate untracked file was `tests/single-entry.test.ts`. No unrelated source changes were found. HEAD's differences from the historical checkpoint are four preparation/decision documentation files, separate from the feature's working-tree delta. The engine, workflow, authored Coordinator, role prompts, Skills, installer, dependencies, and real profile are unchanged by the feature. The later PR Reviewer proposal is absent from this candidate and was not audited.

Read intent/evidence: D-SE, relevant D-S6 decisions, the current progress/handoff record, owner script, host-validation record, retained single-entry outputs, prior RC7 report identity, the R1 rename-failure record, and Fable's final handoff supplied during this review. Fable's reported candidate identities match the independent snapshot. No other chat was messaged and no builder work was requested.

## 3. Area verdicts

| Area | Result | Boundary |
|---|---|---|
| SINGLE_ENTRY_VISIBILITY | VERIFIED_OFFLINE | Correct generated metadata and exact allowlist; actual picker and hidden-worker invocation are HOST_CONFIRMATION_REQUIRED |
| PROFILE_PIN_SUPPORT | VERIFIED_OFFLINE | Three-state validation and scalar emission work; real selector resolution is HOST_CONFIRMATION_REQUIRED |
| COORDINATOR_MODEL_PRECEDENCE | VERIFIED_OFFLINE | Correct source/generated instructions and model-neutral envelope; live compliance is HOST_CONFIRMATION_REQUIRED |
| SKILL_VISIBILITY | VERIFIED_OFFLINE | Both Skills hidden in configuration and automatic loading enabled; menu/loading behavior is HOST_CONFIRMATION_REQUIRED |
| PACKAGE_DETERMINISM | VERIFIED_OFFLINE | Paired generations identical, current package reproduced exactly |
| EXISTING_PIPELINE_REGRESSION | VERIFIED_OFFLINE | Authorized suite passed with two explicit NOT_VERIFIED skips; historical rename failure remains unexplained |
| S6_PROBE_PREPARATION | STILL_FAILING | SE-S6-1 and SE-S6-2 above; remaining probe observations are expressly future host work |

## 4. Generated agents, allowlist, Skills, and target

Inspected both the retained generated package and fresh generated files. Parsed real frontmatter using PyYAML 6.0.3, in addition to inspecting authored output construction and builder tests. All six agents emit the syntactically valid scalar `target: vscode` and `disable-model-invocation: true`.

| Agent | `user-invocable` | Exact tools | Referenced Skill |
|---|---|---|---|
| coordinator | `true` | execute, read, agent | None |
| planner | `false` | read, search, edit | planning-records |
| plan-auditor | `false` | read, search, edit | planning-records |
| tester | `false` | read, search, edit, execute | application-records |
| developer | `false` | read, search, edit, execute | application-records |
| reviewer | `false` | read, search, edit | application-records |

The Coordinator's `agents:` list is exactly `rstack-sdlc-planner`, `rstack-sdlc-plan-auditor`, `rstack-sdlc-tester`, `rstack-sdlc-developer`, and `rstack-sdlc-reviewer`, once each. No wildcard, self-entry, omission, arbitrary user/workspace/org agent, or duplicate exists. Workers have neither the `agent` tool nor an `agents` property. Role tools match the previous package.

Both internal Skills emit `user-invocable: false`, retain substantive descriptions, and omit `disable-model-invocation`. Every generated worker still references its proper prefixed Skill. There are exactly six agent files and two Skill files; no additional user-facing surface or duplicate Coordinator was generated. Authored and generated content agree.

The current official documentation supports the emitted [agent keys and target](https://code.visualstudio.com/docs/agent-customization/custom-agents), the [named allowlist exception for otherwise disabled subagents](https://code.visualstudio.com/docs/agents/run/subagents), and [hidden but automatically loadable Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills). These are documentation checks, not observations of the owner's installed VS Code build.

## 5. Profile contract, baseline, fallback, and precedence

`SELECTOR_STATUSES` is exactly `requires-host-observation`, `owner-pinned`, `observed`. Null is accepted only with `requires-host-observation`; a non-null selector needs one of the other two states. Unknown statuses fail. The validator rejects nonstring selectors, empty strings, arrays/objects, list-like or comma-separated strings, quoted/padded/multiline values, YAML mappings/comments, and values beyond 200 characters. Both pinned states accept the tested 200-character boundary. Nonempty fallback tables are rejected.

The reviewer checked 140 selector/status combinations and independently generated both owner-pinned and observed fixtures. `Review Sentinel A (test only)` was emitted exactly for the two Opus roles with status `owner-pinned`; `Review Sentinel B (test only)` was emitted with status `observed`. Other roles remained unpinned. These are disposable fixtures, not real host-selector discoveries. The contract validates representation and declared provenance, not whether a service offers that name or whether an owner has supplied genuine observation evidence.

The sole production/trial JSON profile remains byte-identical. All five catalog entries are null/`requires-host-observation`; all six generated roles omit `model:` and carry an unpinned note. Manifest role entries honestly record `OMITTED` and the unresolved state. The active map remains sonnet for Coordinator/Tester/Developer, opus for Planner/Reviewer, sol for Plan Auditor. Luna and Terra are unused catalog entries, not fallbacks. `fallbacks` is empty, and extensions are empty.

No Auto selector, model list, alternate-role substitution, or fallback instruction is configured in the delivered candidate. Scalar grammar alone is not a semantic model-availability or Auto-policy validator; future configured selectors still require their separately authorized review. A host's own Auto setting or unresolved-name fallback remains a host risk. Current [VS Code subagent documentation](https://code.visualstudio.com/docs/agents/run/subagents) describes host-controlled selection precedence, optional Auto behavior, and tier checks; this review cannot guarantee fail-closed host execution from generated text.

The generated Coordinator explicitly leaves the subagent tool's model argument unset, dispatches exact worker names, and forbids choosing, substituting, overriding, retrying with another model/agent, omitting the name, or doing role work itself. A model/tier refusal is reported with `RSTACK MODEL REQUIREMENT NOT AVAILABLE`, and the attempt remains pending for the human. Required-model reporting reads the installed agent definition rather than duplicating a role map.

No vendor/model map is hardcoded into generator role tables, role prompts, Coordinator routing, or workflow stages. The unpinned Coordinator's own profile-derived intended-model note is not a duplicated worker map. Authored Coordinator instructions still exclude a model choice from the dispatch. Engine source and the exact envelope checks remain model-neutral; `profile_ref` is a record identity, not an LLM-selection field. The added precedence instruction is in the generated host section; authored Coordinator source is unchanged.

## 6. Independent executions and test mapping

Environment: Windows, Node `v24.21.0`, npm `11.19.1`. All logs below are under `.rstack/astra-single-entry-20261004/`.

| Check | Independent result | Retained output |
|---|---|---|
| `npm run typecheck` | exit 0 | `typecheck.txt`, exit file |
| Focused new + contracts/package/install/portable/extension/protocol/RC6 tests | exit 0; 62 tests, 61 pass, 1 skip; all 18 new tests pass | `focused-unsandboxed.tap`, exit file |
| Normal `node --test --test-reporter=tap "tests/*.test.ts"` | exit 0; 204 tests, 202 pass, 0 fail, 2 skip; 80.3 s | `full-suite.tap`, exit file |
| Scope against `07de93a` | exit 0, no violations | `scope.json`, exit file |
| Affected sensitivity cases 41 and 121–134 | exit 0; 15 DETECTED, 2 passing controls; source unchanged | `sensitivity/summary.json`, per-case logs, exit file |
| Independent generation/content probes | unpinned, owner-pinned, observed each generated twice; all pairs byte-identical | `probe.json`, three inventories |
| Actual YAML/role/Skill/status inspection | 24 generated frontmatters and 140 combinations checked | `generated-inspection.json` |

The first sandboxed focused launch failed with `spawn EPERM` before test bodies (`focused.tap`); it is launcher evidence, not a product-test failure. The approved normal-process rerun above completed. An initial disposable exploratory helper stopped on a trailing-newline selector that the implementation correctly refused; its output was retained, and the completed helper records/asserts that refusal. No candidate file was changed to make a test pass.

Explicit skips: (1) file-symlink refusal test, because Windows symlink creation was unavailable; (2) installed command lines under Git Bash, because the test could not find Git Bash. These paths are **NOT_VERIFIED** here. The extra Git Bash skip explains why the independently reproduced count is 202 passes, rather than Fable's 203. No full sensitivity catalog, live S6, browser automation, corporate integration, or cross-machine reproducibility run was performed.

| Requested coverage | Actual coverage examined and executed |
|---|---|
| VISIBILITY-1 through VISIBILITY-8 | Same labels in `single-entry.test.ts`; generated files independently inspected |
| TARGET-1 | Same label; every actual agent's parsed target checked |
| PROFILE-1 | Owner-pinned acceptance/emission/status; independent sentinel fixture |
| PROFILE-2 | Unresolved omission/note/manifest; independent current-profile generation |
| PROFILE-3 | Rejected list/fallback representations; independent invalid-type/status matrix |
| PRECEDENCE-1 | Same label; plus PRECEDENCE-2 map confinement and PRECEDENCE-3 model-free envelope |
| PACKAGE-1 | `PROFILE-4` paired generation, existing package determinism coverage, and independent byte comparisons |
| Additional | PROFILE-5 limits pin changes to affected roles; PROFILE-6 protects the shipped unpinned profile |

The new tests use a line-based frontmatter reader; they are not themselves a YAML parser. Independent parsed-output inspection supplements that limitation. TypeScript strictness and warning settings are unchanged; no warning suppression was added. No lint or Sonar result is claimed.

The retained builder failure in `.rstack/single-entry/7-final-full-suite.tap` is real executed-test evidence: `RC3: in a second round the decision is bound to the round-two display` failed on the `state.json` rename with `EPERM`. The earlier R1 report records the same rename failure class elsewhere. The independent suite did not reproduce it. Cause remains **UNCONFIRMED**; a clean rerun neither erases it nor establishes antivirus/locking as its explanation. It is not attributed to this feature, whose engine bytes are unchanged.

## 7. Determinism and monorepo implications

Each fresh package contains 33 files: 6 agents, 2 Skills, 23 runtime files, 1 profile, and 1 manifest. File sets, every file's bytes, and manifests were compared, not only aggregate hashes. The unpinned package exactly reproduces the retained candidate, including its manifest hash. Generator version is 3; manifest schema remains 2 and validation status is `UNVERIFIED_ON_HOST`.

Trial package tree inventory digest: `0f2c3769c8ddbeeb174aa8bf924fb949d4247f3b50af768bdde8180413953a35`. Controlled owner-pinned manifest: `db67a58fb5a471492897928a46ac996a2525e047cdd1d3ebd6e907aaf7c22445`; controlled observed manifest: `e46064bd50ff46141af2da8bad18ba2ea4cf86226717bcb547d2f9834e05e8ff`.

Against the historical package, the same 33 paths exist; precisely ten differ: six agents, two Skills, manifest, and `runtime/core/contracts/records.ts`. The other 23 are identical. Neither retained package was regenerated in place.

Root installation remains compatible at the configuration level. Generator paths are fixed under root `.github/agents` and `.github/skills`; the generator has no `--app` input. The unchanged installer renders workspace/package/profile paths; the application is selected per engine run. Changing the application's directory does not create another agent set or model definition. No new duplicate-discovery mechanism was introduced. Parent-repository discovery, user/org customization precedence, multiple installations, and actual menu behavior remain host observations. Stage L prepares a root/subfolder visibility check; its retained builder rehearsal is not relabeled as an independent installation. The reviewer installed nothing outside tests' disposable fixtures.

## 8. S6 evidence boundaries and closeout

The draft correctly leaves old stage-0/2 identities in place until independent approval and rebuild, labels new stages as pending, and keeps candidate strings out of the real profile. Stage P A covers actual picker/menu/diagnostic observations; B covers three prospective selector strings; C–E prepare one scratch Sonnet/Opus dispatch with refusal and effective-model recording. Missing effective-model evidence remains unverified, and a different model is not successful pinning. These useful preparations do not remove SE-S6-1 or SE-S6-2.

Actual picker visibility, Skill visibility/loading, selector resolution, effective worker model, tier behavior, host fallback, and installed Coordinator/worker invocation are all **HOST_CONFIRMATION_REQUIRED / TEST_DURING_S6**. Neither offline tests nor a future scratch-pair success establishes them for all installed roles. No exact production selector was endorsed by this review.

Final candidate recheck: all 114 hashes unchanged; same inventory digest, HEAD, branch, and empty index. All 142 inventoried retained builder/package files are unchanged, including both package manifests and retained builder evidence. Previous Astra reports are included in the unchanged candidate inventory. The final read-only process audit returned `[]` for matching review/test/generator processes after all reviewer sessions exited. Evidence: `final-identities.json`, `retained-before.txt`, and `process-after.json`.

Only this new report and disposable review outputs were written by the reviewer. No production source, tests, profile, generator, owner script, shared records, prior report, or retained builder evidence was edited. No staging, commit, push, real-workspace installation, Copilot session, Jira, Bitbucket, or live S6 occurred.

**Closing decision: CHANGES_REQUESTED_BEFORE_S6_HOST_CONFIRMATION.** Correct the two owner-script items and submit that bounded documentation delta for verification. The passing source/package evidence above remains specific to the recorded candidate; this report does not authorize source fixes or a general architecture audit. Reviewer work stopped.
