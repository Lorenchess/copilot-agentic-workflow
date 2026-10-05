# R2 independent verification

**Verdict: R2 CHANGES REQUESTED. D6: STILL_FAILING. D7: STILL_FAILING.** The original counterexamples are substantially addressed, but malformed controls and conflicting-copy cases remain reproducible. Runner verification is partial and reported separately; its missing process evidence is not the reason for the D6/D7 verdicts.

## Review window and candidate

Owner-relayed acknowledgments: BUILD-02 paused at **2026-10-04T00:47Z** (source/documentation writes, generation, tests); BUILD-03 paused at **2026-10-04T00:54:15Z** (no edit in progress, further writes/searches/tests paused). Both remain paused pending an owner-relayed release. No additional acknowledgment was requested. R3/R4 were neither reconstructed nor implemented.

Process preflight used ordinary permissions. CIM inspection returned **Access denied**, so its empty result was not treated as evidence of exit. Independent `Get-Process -Id` checks found **48816, 62084, 86920, 122580, and 130004 absent**. Their current start times, parents, executable paths, and command lines were therefore unavailable; no historical attribution is claimed. For remaining Node processes, process metadata and read-only, limited-access native command-line/parent queries identified another project's Next development server, Sonar, MCP/Codex tooling, and Adobe tooling. No competing RSTACK test, generator, or writer was identified. This verifier had no existing test to collect. No process was killed or elevated.

Existing checkout: `C:\Users\Ramon Lorente\Documents\Claude\Projects\copilot-agentic-workflow`.

- Branch: `feat/rstack-sdlc-local-build`.
- HEAD throughout: `60c2ba96586ca183cd338512b50e0d214a7a9b08`.
- Reviewed the uncommitted working candidate, not just HEAD.
- Start inventory: **2026-10-04T01:15:49.1072258Z**. End inventory: **2026-10-04T01:24:58.8405593Z**.
- **84/84 tracked source, test, fixture, profile, and package/configuration files match byte-for-byte; no missing files.** Full SHA-256 inventory is below. The wider inventory establishes dependencies/stability for typecheck; it is not a wider code review.
- Runner-compatible inventory (83 files, excluding package-lock.json): **`bb3bf966320077e5a8c1f110924e1550b99652e329c78b1483e44d1d20a9e532`**, matching all three retained R2 subset diagnostics. The calculation skipped `tests/.tmp/` before descent.
- Runtime: Node **v24.21.0**, Windows; installed TypeScript **7.0.2**, Node types **24.19.1**.
- Existing modifications remain: installer, decisions, three evaluator files, evaluation tests, installer tests, sensitivity runner. Previously untracked reviews/progress/readiness documents remain intentional and untouched. Modification alone was not used to attribute ownership.

No source snapshot, project duplicate, clone, or worktree was created. Synthetic *run evidence* was copied only into fresh package-local disposable fixtures for copy reconciliation. This is the only authored durable document; temporary fixtures and observations use the specific paths below.

## D6 — STILL_FAILING

The original review and new control-area contract were read alongside implementation, tests, and legacy reader.

| Fresh reproduction | Observed result |
|---|---|
| Valid prepared evaluation and scripted output | ACCEPTED and selected; packet resolves |
| Judge supplies acceptance.json, request.json, or adjudication.jsonl in its output directory, separately | Each REJECTED with an unexpected-file issue; none aggregated |
| Unprepared evaluation directory | Explicit “was not prepared” refusal |
| Relied-on source evidence changed or removed before acceptance | REJECTED for unresolved packet and changed evidence |
| Identified source evidence changed and request evidence digest rewritten to match | Still REJECTED by recomputed packet validation |
| Newest accepted output changed or removed | Explicit accepted-content issue; no earlier answer substituted |
| Adjudication names another content hash | Explicit issue; evaluation excluded |
| Malformed adjudication JSON | Explicit issue; evaluation excluded |
| Legacy colocated accepted evaluation | Read without rewriting; altered output excluded by the same hash check |
| Legacy colocated unchecked evaluation | Explicit refusal to accept; new preparation required |

**D6-R2-A — malformed controls can still be accepted, crash the library reader, or trigger fallback.** `evals/evaluation.ts:391` catches JSON syntax errors but does not validate record shape; lines 413–445 use the resulting values directly. `evals/summary.ts:236` filters for ACCEPTED before choosing the latest candidate.

Fresh reproductions:

1. Prepare and accept EVAL-2 and EVAL-11 at equal times. Replace EVAL-11's control acceptance with `{`. Summary selects **EVAL-2**, with `not_aggregated: null`, while listing unreadable EVAL-11 as PREPARED with an issue. Replace it with JSON `null` or `{}` and the older answer is again selected, **without a malformed-record issue** (the empty object's status is omitted). The no-fallback guarantee does not survive damage to the acceptance record itself.
2. Replace an accepted evaluation's request with JSON `null`: it remains selected with no issue. Replace it with `{}`: `listEvaluations`/`summarize` throws `TypeError: Cannot read properties of undefined (reading 'id')`. An empty request before acceptance also throws at `evaluation.ts:240`. The CLI has a general exception-to-error wrapper; that does not supply per-record validation or prevent the demonstrated silent acceptance/fallback.
3. Supply an adjudication with the correct evaluation ID and accepted hash, but `schema_version: 999`, `record_type: "wrong-type"`, an unknown question, label **BANANA**, and no sequence/note/recorder/time. The reader reports **no issues**; summary counts **one HUMAN_RECORDED entry and one BANANA case**. At `evaluation.ts:435`–`437`, checking ID/hash alone is insufficient shape validation. The supported `adjudicate` writer rejects invalid labels; the stored-record reader does not enforce that contract.

These are validation defects, not a claim that a judge writes through an OS-protected boundary. The direct reproductions do not require the unavailable application test subprocesses.

### Boundary and recovery

- **Supported interface/validation:** preparation creates separate areas; acceptance checks output shape, placement, evidence digest, and recomputed packet integrity. Summary checks accepted output hashes and adjudication content references. The malformed-control exceptions above remain.
- **Designated ownership:** judge output belongs in `evaluation/<id>/evaluation.json`; evaluator-owned controls belong in `evaluation-control/<id>/`. Historical records retain the colocated layout.
- **Filesystem prevention:** none demonstrated. Directory separation supplies no ACL, sandbox, signature, or authentication. An unrestricted writer can alter controls. The documented added-evidence/rebaselining limitation and inability to distinguish a forged pre-separation colocated evaluation remain limits; no stronger prevention is claimed.

The legacy reader applies accepted-output/adjudication hash checks, but shares the malformed-control gaps. Compatibility is not an exemption from validation.

The progress record says a person must “resolve it in the files”; decisions disclose that an issue can block aggregation. This report accepts a disclosed blocker. **Do not edit or delete accepted evaluations, adjudications, or controls to obtain a passing summary.** No new recovery interface is required by this review. Any future recovery action needs an explicit owner decision preserving provenance and original evidence.

## D7 — STILL_FAILING

| Fresh reproduction | Observed result |
|---|---|
| EVAL-2 versus EVAL-11, equal preparation time | EVAL-11 selected; numeric suffix ordering works |
| EVAL-2 prepared later than EVAL-11 | EVAL-2 selected; preparation time precedes ID |
| Compatible evaluation superset, both argument orders | Same summary; MOST_COMPLETE_COPY selects superset |
| Compatible additional adjudication, both orders | Same summary; MOST_COMPLETE_COPY |
| Same evaluation identity, changed output | EVALUATIONS_DIFFER; no evaluation selected |
| Same adjudication identity, conflicting note | EVALUATIONS_DIFFER; no evaluation selected |
| Newest accepted output invalidated | Explicit blocker, no fallback |
| Newest acceptance control malformed | Older answer substituted, as D6-R2-A describes |

**D7-R2-A — invalid/missing ordering information silently selects an answer.** At `evaluation.ts:445` and `463`, preparation time is not validated. In fresh accepted EVAL-2 (11:00Z) and EVAL-11 (12:00Z), changing EVAL-2's preparation time to **not-a-time**, or deleting the required field from its still-present request, makes **EVAL-2 selected**, with empty issues and `not_aggregated: null`. This silently extends the no-request legacy ordering rule to a malformed prepared record. Valid canonical times and numeric ties work; malformed inputs do not receive the required explicit result.

**D7-R2-B — relevant conflicting control contents are omitted from reconciliation.** `summary.ts:179`–`214` compares `StoredEvaluation` projections. It compares more than filenames: output hashes/content and adjudication entries are compared. However, relevant request and acceptance contents are omitted.

Two otherwise identical synthetic copies were tested in both orders:

- Change only one copy's `request.evidence.digest` to 64 zeroes.
- Separately, change one copy's acceptance to `evidence_unchanged: false`, a different `evidence_after`, and `issues: ["conflicting acceptance record"]`, keeping the same accepted output identity.

Both pairs report **IDENTICAL** and aggregate EVAL-1. Argument order is stable, but content reconciliation is wrong. Conflicting/invalid records need disclosure; neither heuristic merging nor rewriting retained copies is justified.

### Historical evidence preservation

Read only retained run paths named in the calibrated S4 summary and its specific clean-run import. Summaries with the import first and last were identical. Compared with the retained calibrated summary:

- Same four selected accepted evaluations, deterministic metrics, judge answers, and human calibration.
- **7 human-recorded entries, 6 cases, 4 CONFIRM, 2 MODIFY**, with C3's earlier UNRESOLVED entry preserved.
- Clean-run duplicate `RUN-20261003T161609-dc9f7527`: MOST_COMPLETE_COPY.
- All **31** specifically inventoried historical evaluation/control/adjudication/summary/expectation files have identical before/after hashes.
- No evaluation-control directory was created in a historical run. Nothing historical was repaired, deleted, migrated, or regenerated.

Full historical hashes are in the disposable `history-check.json` linked below.

## Sensitivity runner — demonstrated versus untested

### Direct observations

The supported CLI is `--cases`, `--out`, `--timeout-ms`, and `--list`; no invented runner flags were used.

- `node tests/sensitivity.ts --list`: exit 0, 96 numbered cases, including the reported 80/81 mappings.
- Ten invalid invocations each returned exit **2** before running tests: missing/empty selection, 0, 97, duplicate 81, nonnumeric selection, empty comma member, unknown option, timeout 0, and populated output directory.
- Executed the **unchanged child-handling/classification source block in memory**, stripping only TypeScript syntax and supplying its existing dependencies. No source/test file was edited or project copied. A tiny disposable test child failed to launch under ordinary permissions with **EPERM**. The implementation returned **NOT_LAUNCHED / CONTROL_NOT_RUN / INCONCLUSIVE_NOT_RUN**, retaining null exit status/signal, launch error, 2 ms duration, null test count, and saved stdout/stderr paths. It did not classify that failure NOT_DETECTED.
- Node's experimental `stripTypeScriptTypes` warning was emitted and not suppressed. No repository warning rule changed.

### Injected results — not actual process events

The same source block was evaluated with small injected `spawnSync` results. This checks parsing/classification/diagnostic logic, **not actual timeout delivery, OS killing, or signal handling**.

| Injected outcome | Classification |
|---|---|
| ETIMEDOUT, SIGKILL, partial stdout/stderr | TIMED_OUT / INCONCLUSIVE_TIMED_OUT |
| Killed child, SIGTERM | KILLED / INCONCLUSIVE_NOT_RUN |
| Normal exit without TAP summary | COMPLETED / INCONCLUSIVE_NO_TEST_REPORT |
| Named assertion failure with test count | CONTROL_FAILED as control; DETECTED as mutation |
| Valid passing report | PASSES as control; NOT_DETECTED as mutation |

The unchanged dependent-case guard was evaluated separately: **CONTROL_FAILED and CONTROL_NOT_RUN each produced INCONCLUSIVE_CONTROL without reaching the child path**. An existing SIGTERM interruption state produced INCONCLUSIVE_INTERRUPTED without reaching that path. Classifying a failing control as if it were a mutation is not an end-to-end assessment; the dependency guard makes that mutation inconclusive.

### Retained positive detection evidence

Inspected the specific `.rstack/r2/` run.json, cases.jsonl, summary.json records and 80/81 stdout reports. All three identify the same runner SHA-256 and source digest as this candidate. They explicitly say SUBSET and `full_sensitivity_pass: false`.

| Retained subset | Evidence |
|---|---|
| sensitivity-cases-80-81 | 2 passing controls, 2 DETECTED; mutation exit 1, null signals, named failures, test counts, durations and output files retained |
| sensitivity-evaluation-cases | Cases 1–10, 60, 61, 82–96: 27 DETECTED, 2 passing controls |
| sensitivity-cases-57-58 | 2 DETECTED, 1 passing control |

For 80/81, control durations are **78,801 ms / 279 ms**; mutation durations **8,287 ms / 655 ms**; test counts **2 / 4**. Raw TAP names match intended failures. This is retained builder evidence on matching source, **not a new independent mutation execution**.

The earlier `Documents/r1-owner-verification/fable-sensitivity-20261003/` attempt remains separate and unchanged: exit 1, last two rows NOT_DETECTED with no failing names or child status/signal. Missing diagnostics cannot establish its cause. New evidence does not relabel it. **31/96 cases have matching-source retained subset detection evidence; no full sensitivity pass is claimed or assembled from different-source runs.**

### Still untested / exact gaps

- Actual OS timeout, killed child, runner interruption during a child, and a normally launched child returning no usable report.
- Real failing unmodified control through the complete runner, with dependent cases skipped and persisted end-to-end.
- New independent valid detected mutation with passing control.
- Child descendants after timeout/termination and diagnostic completeness if the runner itself is forcibly terminated.

The private functions are not exported as a small public test seam; importing the full runner starts its top-level copy/run workflow. Actual Node child launch fails with EPERM here. No source edits, elevation, settings changes, long wait, full mutation run, or memory-pressure simulation was used to overcome that limit. Injected results do not close these gaps.

Narrow static observation: an interrupted **control** row is pushed into the final summary but the branch at `tests/sensitivity.ts:1017` skips `completed(row)`; it is not appended to cases.jsonl there. Final-summary inclusion is visible in code; live interruption/persistence remains untested. Timeout descendant handling remains a disclosed limitation.

## Actual checks and limitations

All checks were sequential; no helper agents.

| Command/action actually performed | Result |
|---|---|
| Git status/branch/HEAD, focused reads/diffs, SHA-256 inventories | Expected branch/base; working candidate inspected |
| Ordinary process inspection | CIM denied; alternative reads succeeded; named PIDs absent; no conflicting job found |
| `npm run typecheck` | Exit 0 |
| `node --test tests/evaluation.test.ts` | Exit 1 before loading file: spawn EPERM; **not a test pass** |
| `node --help` (test-isolation entry), `node --version` | Confirmed supported option and v24.21.0 |
| `node --test --test-isolation=none tests/evaluation.test.ts` | Exit 1; **15 tests: 9 passed, 6 failed**, about 10.1 s |
| Inline `node --input-type=module -` integrity/selection fixtures | 31 recorded cases plus one malformed-adjudication-shape case; results above |
| Inline fresh workflow execution diagnostic | Proof attempts: PROOF_SETUP_FAILURE, abnormal exit/no reported tests; eventually ATTEMPTS_EXHAUSTED |
| Inline retained-history summary in both orders | Metrics/judge answers/calibration equal; 31 historical hashes unchanged |
| Runner list and ten invalid CLI invocations | List exit 0; invalid requests exit 2 |
| In-memory unchanged runner source blocks | Real EPERM launch handling and qualified injected observations |
| End identities/process checks | Stable candidate; own commands completed; no remaining verification process |

The no-isolation diagnostic is not equivalent to the requested command passing. Six failures involve missing candidate/proposal evidence or an earlier proof-stage block. A separate fresh diagnostic confirms application child-execution failure here; the child adapter does not retain its launch error, so no claim is made to have individually diagnosed every failed assertion. Successful direct D6/D7 reproductions use a fresh valid run stopped at human wait, avoiding application child execution; its packet resolves before controlled corruption.

Temporary evidence, relative to `rstack-sdlc/`:

- [Integrity/selection observations](../tests/.tmp/astra-r2-repros-BUMrZJ/observations.json).
- [Malformed adjudication observation](../tests/.tmp/astra-r2-repros-BUMrZJ/malformed-adjudication-shape.json).
- [Historical before/after identities](../tests/.tmp/astra-r2-repros-BUMrZJ/history-check.json).
- [Actual runner launch observation](../tests/.tmp/astra-r2-runner-ZJB0zo/observations.json).
- [CLI refusals/selection](../tests/.tmp/astra-r2-runner-ZJB0zo/selection.json).
- [Injected outcomes/dependency guard](../tests/.tmp/astra-r2-runner-ZJB0zo/injected-paths.json).
- [Application subprocess diagnostic](../tests/.tmp/astra-r2-execution-diagnostic-3oYcuS/diagnostic.json).

Fixture base: `tests/.tmp/astra-r2-base-f1Mz91/`. Corruption/copy fixtures: `tests/.tmp/astra-r2-repros-BUMrZJ/`. These are synthetic, not original S4 runs. Unsaved command output remains in the verifier transcript. No broad search of ignored evidence, baselines, build, or dependency trees was performed.

At **2026-10-04T01:29:47Z**, process checks confirmed recorded verifier PIDs **20364, 109008, 91436, 38604** absent and no remaining package test/generation process. The no-isolation execution session had already returned exit 1; typecheck and every other invocation had returned. No verifier test remains running.

## Next required decision

Owner decision: authorize a bounded R2 follow-up for **stored control/adjudication validation, explicit handling of invalid ordering/newest records, and comparison of relevant control contents**, with focused regression cases; then reverify. An ordinary execution environment capable of launching the required children is also needed to close the evaluation-suite and real runner-failure evidence gaps.

This report does not authorize or implement repairs, release builders, perform R3/R4/S6, or stage/commit/push/merge/install anything. Original history remains intact even when aggregation must stay blocked.

## Full source/dependency identity comparison

Every SHA-256 below was observed before and after verification. **All 84 comparisons match.** Paths are relative to `rstack-sdlc/`.

| Path | SHA-256, identical before and after |
|---|---|
| `adapters/bitbucket/index.ts` | `92513bac9fb32c16840f25dd9402cd0164de32b2d816444e198ae97822716d5c` |
| `adapters/copilot-vscode/coordinator.md` | `33b27c9c9b0d1706be6e1191a48825c86526374fe058445f57f22e0519822c4c` |
| `adapters/copilot-vscode/extensions.json` | `37e8ced759eea65b179fffb976ab8b0cc2e5a36415d0c91f02e7290a24cb1c12` |
| `adapters/copilot-vscode/generate.ts` | `d97c012692bb92c4fe32f7f3652008848192549bba5c8273a58cb0e9e566ed4d` |
| `adapters/copilot-vscode/install.ts` | `c45b51f09ced28617c9fb3389ac06edc291c12212363703fef237dbaf56f3364` |
| `adapters/fake-file-drop-transport/index.ts` | `263ed39fb2a56ddd4257906760ca0b86f6d240b95242ac30b35544765e6ef59e` |
| `adapters/fake-transport/application.ts` | `251865b4879708ead0cf1eb53c36420cfe0df9ddc0e476266cc80613a8a883c3` |
| `adapters/fake-transport/index.ts` | `c640783dfef8e210edc4e0ff4e9ef5689771f8e7fc293540725cac0b6eae7da5` |
| `adapters/jira/index.ts` | `da4304e8b6a021080e21b5389d175cb43ef689ff41a0a280567b5fcd544aa339` |
| `adapters/local-pr-proposal/index.ts` | `17a154effb3dbeab7ab239b7fbb673823050e97d63859000f11a69b9ccae1c18` |
| `adapters/local-request/index.ts` | `8c38c2e967ceb031b4130929e60eef26f7b83ea293f52f205dfd664080712bd4` |
| `adapters/node-test-executor/index.ts` | `31165aa8b2ff18fd0fa545d3f49a6f9a175e5895b0baac7c8eda6879f1809518` |
| `core/contracts/app.ts` | `25ddbe3242f4669810b5afba64463ac40eb35f1b023188c5e69eec371c80c8dc` |
| `core/contracts/planning.ts` | `fda2b9336486bbbacc16de8d898fadf480c9f2d668ee9acf49d537470f130f2e` |
| `core/contracts/ports.ts` | `606463415f7b391e0905f4efbee3da83f933cc69204cb8c52bd0e83e479a77a6` |
| `core/contracts/records.ts` | `38432ada04d8426f3abd9961e52bc249e6fddde8c7f0c6b6acc2620791148f88` |
| `core/contracts/validate.ts` | `6dca5976127fbd5f2f78a31b97ee471a2146800b889c1b7fb1e3b68f0e76e3f6` |
| `core/engine/brief.ts` | `08a53e9bc8c407f743bf28bc6adb2ab86f02aef0ddcdb405a4895a097674589a` |
| `core/engine/containment.ts` | `95de2c70b388a065c66717a8c31342fa6c7f1bd7f3aa09bbd12cf0469baabaa4` |
| `core/engine/drive.ts` | `e0b5aef6ca20378fd4169759ff65039a032005f1030ec3dcf8a505a6b290a733` |
| `core/engine/engine.ts` | `9ccc913f0407b4ffa3dc4dc0ca828997636114d76d90a4069d9ed118b03241fa` |
| `core/engine/errors.ts` | `c7db14906df2066708d96286f4acb0e42c08a2188f1f4b949efc2cab724591d1` |
| `core/engine/execution.ts` | `9cdd0edc133cce4b092c61a2e1be7d6bcf729d12898131605f51de29b1a5c937` |
| `core/engine/journal.ts` | `2dfee59f50321637625679d667020fe78baa0ab1e85d0194ae8519a091d07e58` |
| `core/engine/lock.ts` | `bc22f8d0b03337d567a222b73811e061d9c2f6c12eb98c5ba404e9acacc5e51f` |
| `core/engine/state.ts` | `25b5aaee01919194a74f50091e3f04ad534cff8499754e41c4563131bd2f672d` |
| `core/engine/tree.ts` | `70ceb53209c69133c240cc5d6ce7898c2a67dcfa6bba4ca323b8d6bf63ae672e` |
| `core/policies/workflow.ts` | `bb580da18e552ce4b55abbb242a9cdba21bbd45f4a8933e3fe64fe4c47ed7414` |
| `core/roles/developer.md` | `0b7507c94c9959beb07af3d17068f8a4cd4c4e4e1c5ce17e73f4878e17fa4484` |
| `core/roles/plan-auditor.md` | `02ab0446b042c6288dedc7e5541f56e27fc08fb84ecc8f5f5ebdf5008785e288` |
| `core/roles/planner.md` | `09bd268a5f78d93b9aeb0c0dca5298a4f81b05eae789c08b4a9a30e4cac4f40b` |
| `core/roles/reviewer.md` | `e63d0def9195a106f7317f1967a5ed2b2327f485775c3853db935a490cc4fb06` |
| `core/roles/tester.md` | `8c00538470998a3458055dc7ed2e9a465001fd028b9eceb75179880f55552d4a` |
| `core/skills/application-records/SKILL.md` | `fa03d3586f33d0ad256e72e5264312da1183f4ab7216ecff504d599a3cb24b61` |
| `core/skills/planning-records/SKILL.md` | `7c11d6887e7d6b95732e7522b375729c3dcd06633295e109b02a7a3e8783dbe9` |
| `evals/deterministic.ts` | `13ba705704d9e39331e06c3a7e99f3097d93a44e1b1eac4dca8a310e6515c081` |
| `evals/evaluation.ts` | `2a5561a2117221e213c676af89cabb269a40387447b1483104d275f03b745397` |
| `evals/rubrics.ts` | `e931b0f59277fa9cce7201e704ea8760672361d8de94e7de07fda5a644410a53` |
| `evals/rubrics/planning-run-v1.md` | `4744222752ee61b7486a52eb73f1557a9a7fe9be446b067b923cc0e15f1560d2` |
| `evals/rubrics/planning-run-v2.md` | `680acc2e2504faadc17085a196a34bc8d712725c63ad6a92f89132f3529bb37e` |
| `evals/rubrics/run-v3.md` | `a4bc9bf99abec70ee2c8f75224e754e22df8644edc6fc6922dd40742e4bf917c` |
| `evals/summary.ts` | `f4ba83be47dc17f731631e7d09d06661187184c1aa5406e9d787447223e477d8` |
| `evals/verify-packet.ts` | `80150991cc591ff8c9a771a1d639d1ab9c52019825d3b432b1a81d56e4c2dbe2` |
| `package-lock.json` | `e9f13783f251457497a9e120f47f227d3eef2aafe9ad5069ff1d4d724e50aa20` |
| `package.json` | `e580e15d752eb8630865470de5cd33d1eee898bf46eb7938821254667f32c38b` |
| `profiles/trial-v1.json` | `3338b15a6c54fb81dfca943a01213950a6afe40153c483d6a75f555f6ff967a8` |
| `scripts/assembly.ts` | `be588a04f3f6e69017a797c592a397bad57de0575131018b4ba6627cf7b62404` |
| `scripts/check-scope.ts` | `f06744efe37938bc0e5910756cc9198c69db712d5b88df85698782f6c82147cf` |
| `scripts/eval-cases.ts` | `3cec11821e46de969dc28a369aa14976870f1ebf4a98b446cb752f6aa56afb15` |
| `scripts/evaluate.ts` | `4261055ae2635311a046de18ad314c86e3d8e761d4cce3d4d9670b54d6e70cd0` |
| `scripts/generate-package.ts` | `8a7a5408d15e40e7bd6c87ff0f99147a84b7047dd4564e25962da93ad60997d8` |
| `scripts/install-package.ts` | `3d4afc3a3aae11b669ec3ae7c6762cf303878922205a2993804896d06ed8aec6` |
| `scripts/rstack.ts` | `8ab2bf654504bc86c64eae7f5c7e91823cdfb87563f60701a176eed2ae51b9f5` |
| `scripts/synthetic-run.ts` | `52404f6ffbe5eabb660ab338c724451e003a5e0c5cddf11e420a33a387a69421` |
| `tests/adapters.test.ts` | `3b0cc683d545953632820edde876f8c7fecb6e4d76a013002b325bec855c9283` |
| `tests/architecture.test.ts` | `e3e2aa9c3fd867be9b26ae2fb6959898357602fc02906da029943cc27b29d5cd` |
| `tests/concurrency.test.ts` | `c3ed1eccec856d4bfc96dc87bdd94e3a4a44e8aa8028c872bb2bb217d707cc2d` |
| `tests/containment.test.ts` | `233fc2c0d8003a51528de44166b677d87cfcf2ff744941854c3d632aa47f5a59` |
| `tests/contracts.test.ts` | `8a036e138513c433d69e346c41e7a168978b78b3e3de2797b93cc898baa4cb2f` |
| `tests/dispatch.test.ts` | `ee4253fe3a2fee6e3f2f9f8ecb67dae190df5b7bbfa0e67b7ad9314846c11057` |
| `tests/engine.test.ts` | `36bf40ce364841a4c106749225a0e15b2537d460e385589392e48ae3d9c187ae` |
| `tests/evaluation.test.ts` | `2aa0255e8ec0049639d10bc2f5f12bb6709b7b23eff521672c3f95366b3254d1` |
| `tests/evidence.test.ts` | `20bc8fcb701678d08e580333e52b3d953380a5a23660c20c5c224765fa003808` |
| `tests/extension.test.ts` | `001248ffd3589ed5cb0c0511d3e23ccd6452dd2212dcc78c8cf0c73aa3f8eeb0` |
| `tests/fixtures/extensions/change-notes/SKILL.md` | `c892fe45c4a181ef3a1d8987dd45cdb2bca93776d3209d5bdf2d9d86fbb3a527` |
| `tests/fixtures/extensions/obsolete-banner.md` | `9b5e943a09165cb823ac04bfbdb165a2bd9ce197bca1def6f44493d26054b5f7` |
| `tests/fixtures/profiles/alt-test-v1.json` | `7a9e4eb82790b449968175f1cfcbfc6a18666f0dd97f452ede6e7362cbfe9d91` |
| `tests/fixtures/requests/REQ-001.md` | `e33cd9b9f7b3670b37a0e6d2373a6640c4c9ffd0c58dda0d97ac3c72ed4f36c3` |
| `tests/fixtures/sample-app/package.json` | `6897c255ede0da7ce1db4f2d36880ff8f32457907d5012c12664939a5f51497d` |
| `tests/fixtures/sample-app/rstack.app.json` | `fe210841a1dc9abe9b5069b60ad3a76da67448e79ae40c8e9e60ecf88923a89e` |
| `tests/fixtures/sample-app/src/export.js` | `081374821931e5b04511d1a0a3aa06c588aa3d94285a251919a8e71cccbd6b24` |
| `tests/fixtures/sample-app/tests/existing.test.js` | `2f21ee236b8e504c475f3f33e784026ec9832b4693e04aaf8549b86228be1867` |
| `tests/install.test.ts` | `72024333003d4c30b82a056ed624efd419dab0800b3889731e883c809d773f21` |
| `tests/package.test.ts` | `f90e080b05ea2694a939bce128a084fa9e80ba85b3182bb5783dc9e82bb7613d` |
| `tests/persistence.test.ts` | `dda45c6572cbde8de603e9bdacf473acb62464b4faae77409097e26d87140471` |
| `tests/planning.test.ts` | `f1d787164a45a759ee13fdbab7937b426c3629857bbef86c54b7fa4a40ad8509` |
| `tests/portable.test.ts` | `abf3bb178acc3ac3d7acbd348863fe43aaa89276395f8993e29a23eec9ee9f91` |
| `tests/proof.test.ts` | `dc9f60ad51d82328a9b30004a5ee0cae183c63c3a143fbb8b1f9284365ad8af0` |
| `tests/sensitivity.ts` | `e366e223822aea791e09092fde55227079813d8412fb813a52cec2052546a6d3` |
| `tests/support/crash-child.ts` | `480d018f2881082506660968675dd66eefc97b5ef8cea756a545287abca337ae` |
| `tests/support/deny-network.ts` | `b7a98756808f6a69e87f4b0ea4222d5be4eb9893381dd3caa4c7047c85b2689e` |
| `tests/support/driver-child.ts` | `97658d0873d9fb189aa6d85958c63681fcd66376695a0a56887727e1a5fe74ed` |
| `tests/support/harness.ts` | `84eaa45681b14416675be66495896a6b157ab9edec4efa1021286cef630e2dc8` |
| `tsconfig.json` | `7cf9a79b9aae721eddcd8fd34cf6665154b9e267312ad43a735698940fef991e` |

R2 VERIFICATION WINDOW CLOSED — R2 CHANGES REQUESTED.


---

## Correction 1 delta verification — 2026-10-04

**Verdict: R2 EVALUATOR CORRECTION NOT READY TO CLOSE — CHANGES REQUESTED.** This appendix preserves and supersedes the earlier conclusions only where the corrected candidate was rechecked. It does not repeat the whole-project audit.

| Finding | Correction verdict | Evidence and remaining scope |
|---|---|---|
| **D6-R2-A** | **STILL_FAILING** | The original malformed-record reader cases are fixed. Repeat acceptance still returns a clean accepted verdict with a damaged request; adjudication still appends against controls whose evidence digests disagree. |
| **D7-R2-A** | **STILL_FAILING** | Missing, malformed, and noncanonical times are explicitly invalid; normal canonical times and numeric ties work. A canonical timestamp form accepted by the declared `toISOString` contract still orders incorrectly at the expanded-year boundary. This is a new, narrow counterexample, not persistence of the original malformed-time cases. |
| **D7-R2-B** | **VERIFIED_FIXED** | Actual request/acceptance bytes affect reconciliation. Request-only and acceptance-only conflicts refuse aggregation in both input orders; identical copies and a compatible superset still work. |

The D6 command-path failures independently prevent closure. The D7 boundary case is synthetic and low practical urgency for present-day runs; it does not invalidate the demonstrated rejection of malformed timestamps. Missing runner experiments are separate from both evaluator verdicts.

### Corrected subject and stable window

Used the existing checkout, branch `feat/rstack-sdlc-local-build`, and HEAD `60c2ba96586ca183cd338512b50e0d214a7a9b08`. Read the correction-1 entry in `docs/progress.md` and its full hashes. The source is uncommitted; HEAD alone is not its identity.

Used the owner's latest acknowledgment that BUILD-02 stopped writes/tests and BUILD-03 remains paused, together with the existing pause acknowledgments. Ordinary-permission process checks at **2026-10-04T11:34:45.1077800Z** and **2026-10-04T11:42:34.7840485Z** found no conflicting package job or unreadable plausibly conflicting Node process. Existing Node processes were identifiable as the other project's development processes or MCP/Codex/Sonar/Adobe tooling. No unrelated process was stopped, and no elevation was used.

Start source inventory: **2026-10-04T11:35:03.4650120Z**. End inventory: **2026-10-04T11:42:34.3136059Z**. **86/86 inputs unchanged**, with no missing paths: the same 84 source/test/fixture/profile/package/configuration files listed in the original full inventory, plus progress and decisions. Of the original 84, exactly these three corrected files differ from the earlier review; the other 81 full hashes remain exactly those printed above. This establishes dependencies for the requested typecheck, not a new audit of those files.

| Corrected source / reviewed record | Full SHA-256, identical before and after |
|---|---|
| `docs/decisions.md` | `3904ea138a449706c8014feb324f188bc63039474758fb817ffee0588142ff13` |
| `docs/progress.md` | `63fad2e4372003e6fdaf5a4ca1b6da8f59d35f727a53374a8f0e2556f7f3f800` |
| `evals/evaluation.ts` | `900017769371d917d1af041daf19e1664c0e957b028a4a5ea1a6216769229392` |
| `evals/summary.ts` | `8541a169c7ae464db227b4bc001a5d60f32ca32ef5badabf94279e7112a22861` |
| `tests/evaluation.test.ts` | `1c29f8965549b1702676335a26ba0df89f40f2fb512d354b3947e89a32cff9ab` |

Key unchanged inputs:

- `tests/sensitivity.ts`: `e366e223822aea791e09092fde55227079813d8412fb813a52cec2052546a6d3`.
- `evals/deterministic.ts`: `13ba705704d9e39331e06c3a7e99f3097d93a44e1b1eac4dca8a310e6515c081`.
- `core/contracts/validate.ts`: `6dca5976127fbd5f2f78a31b97ee471a2146800b889c1b7fb1e3b68f0e76e3f6`.
- `evals/rubrics.ts`: `e931b0f59277fa9cce7201e704ea8760672361d8de94e7de07fda5a644410a53`.
- `evals/verify-packet.ts`: `80150991cc591ff8c9a771a1d639d1ab9c52019825d3b432b1a81d56e4c2dbe2`.
- `scripts/evaluate.ts`: `4261055ae2635311a046de18ad314c86e3d8e761d4cce3d4d9670b54d6e70cd0`.

The independently recomputed runner-compatible digest is **`072b010a02a523ad593521df16ff19802eaa138b28228646f719c0abd9906e5d`**, over 83 files, matching both correction-1 retained runs. Calculation skipped `tests/.tmp/` before descent. It did not traverse disposable projects. Full before/after identities are retained in the disposable `source-identity.json` named below.

### Checks actually performed

All execution was sequential, under ordinary permissions, with Node v24.21.0. Package cwd was `rstack-sdlc`.

| Command/check | Result |
|---|---|
| `npm run typecheck` | Exit **0**. Runs the declared `tsc --noEmit -p tsconfig.json`. |
| `node --test tests/evaluation.test.ts` | Exit **1**, **spawn EPERM before the test file loaded**. One failed wrapper, zero evaluator tests executed. This is not a demonstrated evaluator test failure or a local 17-test pass. No elevation or full-suite retry. |
| Inline `node --input-type=module -` reviewer fixture program | Exit **0**; **48 recorded scenarios**, with assertions on expected successful repairs and explicit observations of the remaining counterexamples. |
| Inline `node --input-type=module -` retained-history/source/diagnostics audit | Exit **0**; 31 historical hashes preserved, exact current digest matched, both retained run records reconciled with their summary and outputs. Its first read-only attempt stopped at an absent evaluation directory in the import; bounded inspection confirmed that this import has no evaluations, and the corrected audit used the existing 31-file inventory. |

The reviewer fixture program created one fresh scripted `newRun`, advanced only to `toHumanWait`, then copied that synthetic **run evidence** into disposable cases. It did not run a judge, create new calibration evidence for S4, copy the project, or change implementation/tests. Historical-layout cases were constructed only in these fresh fixtures.

Disposable evidence directory: `tests/.tmp/astra-r2-correction-verifier-20261004T113522/`:

- `typecheck.txt`, `evaluation-requested.txt`.
- `reviewer-reproductions.json`: all 48 scenario descriptions, exact fixture paths, statuses, issues, selections, API responses and write/no-write observations.
- `history-check.json`: exact before/after retained paths/hashes and summary comparison.
- `retained-evidence-check.json`: recomputed source digest, builder artifact/output hashes, exact selections and result rows.
- `source-identity.json`: full 86-file before/after identities.

No sensitivity run, generation, installation, full application suite, helper agent, network integration, or S6 was started.

### D6-R2-A: reader repaired; API refusal remains incomplete

**Demonstrated repairs, in both SEPARATE and COLOCATED layouts:**

- Newest `EVAL-11` acceptance contents `{`, `null`, or `{}` now give `INVALID`, explicit issues and no selected evaluation. Older `EVAL-2` is not substituted.
- Newest request contents `{`, `null`, `{}`, or a missing request give explicit invalid results without a TypeError or fallback.
- A matching-content adjudication with label `BANANA`, a malformed matching-id/hash record, and invalid JSON are excluded, with issues and **zero** human-calibration entries.
- A malformed pending request is refused by first acceptance without writing; a malformed acceptance is refused by both commands without writing. A damaged request is refused by `adjudicate`.
- Valid synthetic accepted/adjudicated records still aggregate in both layouts. Read/summary operations leave their bytes unchanged.

**Remaining D6 counterexample 1 — repeat acceptance bypasses the request validator.** At `evals/evaluation.ts:316`, the existing-verdict return precedes request validation at line 322. Prepare and accept a valid evaluation, then damage its request to `{`, `null`, or `{}`. The corrected reader says `INVALID`, but `acceptEvaluation` returns the old **`ACCEPTED`, `issues: []`** verdict. No bytes are written; the failure is absence of the required refusal. Reproduced for all three contents in both layouts. Valid historical idempotent acceptance is supported, but it does not justify bypassing the new malformed-control refusal requirement. Fixtures include `037-repeat-invalid-request` through `039-repeat-invalid-request` and `042-colocated`, `044-colocated`, `046-colocated`.

**Remaining D6 counterexample 2 — adjudication writes against contradictory controls.** Change only an accepted request's `evidence.digest` to 64 zeroes, leaving both records individually well-shaped. The reader correctly reports `acceptance.json does not carry the evidence digest of request.json` and refuses aggregation. However, `adjudicate` validates the two records independently at `evaluation.ts:430` and `:432` and appends a new `CONFIRM` record at line 456. It does not perform the pair-consistency check used by the reader at line 533. The resulting entry is subsequently excluded because the evaluation is invalid. Repeat acceptance also returns `ACCEPTED`. Reproduced with actual file changes in both `040-control-pair-mismatch` and `048-colocated`. Thus the correction's “refuse invalid controls without writing” promise is not yet met; this is not silent aggregation of the new entry.

The new source test covers damaged requests before first acceptance and damaged acceptance records on repeat calls, but does not repeat acceptance after request corruption. Its writer checks also omit the request/acceptance digest disagreement. These are narrow regression gaps in the correction.

**Planted verdict remains a meaningful trust-boundary test.** Inspected the completed fixture at `tests/evaluation.test.ts:496` and `:531`. Independently planted a complete request and complete acceptance with matching output hash/evidence digest in a new judge-area `EVAL-90`. The reader reports **ACCEPTED / COLOCATED with exactly one issue**, “control files in the judge area appeared after this run's control area was separated”; summary selects nothing. It does not pass by exploiting malformed JSON or missing fields.

The separation still describes the supported interface and designated ownership. It is **not filesystem isolation** against unrestricted local writes. Record validation and accepted hashes establish shape/consistency, not authorship. No history was edited, deleted, or silently repaired to make aggregation succeed. An explicit unresolved blocker remains acceptable; this review requests no recovery interface.

### D7-R2-A: invalid forms fixed; one supported-form ordering defect

Directly verified missing, null, numeric, `not-a-time`, no-millisecond UTC, explicit `+00:00` offset, and normalized invalid-calendar forms. Each becomes `INVALID`, has `prepared_at: null`, reports the reason and blocks aggregation; it does not win a latest selection or allow a convenient older fallback.

The implemented contract at `evaluation.ts:190` is a parseable string exactly equal to `new Date(value).toISOString()`, as documented in progress. Valid contemporary canonical timestamps work: later preparation wins even for `EVAL-2` over `EVAL-11`; equal times select `EVAL-11` through numeric suffix ordering.

**New directly related, low-urgency counterexample:** `toISOString` also writes expanded years. Using the supported preparation API and its existing clock seam, with no request corruption:

1. Prepare/accept `EVAL-2` at `9999-12-31T23:59:59.999Z`.
2. Prepare/accept `EVAL-11` at `+010000-01-01T00:00:00.000Z`.
3. Both read as ACCEPTED, with valid requests and no issues.
4. The text comparison at `evaluation.ts:595` orders the plus-prefixed year first; summary selects **EVAL-2**, although EVAL-11 is later.

Fixture: `059-expanded-year-order`. No historical or contemporary run was found affected. This limits the full timestamp-contract verdict; it does not undo the original invalid-input repair. The next decision is the intended supported timestamp range/order, with a bounded correction or explicit exclusion. This review neither broadened timestamp support nor changed selection policy.

### D7-R2-B: VERIFIED_FIXED

Two fresh run copies differing **only** in request content (`judge_writes`), and another pair differing **only** in acceptance content (`checked_at`), each produce **EVALUATIONS_DIFFER**, explicit `not_aggregated`, and no selected evaluation. Both records in each pair remain individually valid. Forward and reverse input orders produce deeply equal complete summaries.

Identical copies report IDENTICAL; a copy containing the original evaluation/adjudication prefix plus an additional compatible evaluation reports MOST_COMPLETE_COPY in both orders. The smaller copy remains byte-identical. No reconciliation operation rewrites either copy.

The reader hashes actual request/acceptance file bytes into `control_sha256` (`evaluation.ts:530`); `holdsAll` includes these in its content comparison (`summary.ts:185`), and variant diagnostics expose both hashes. Comparisons are not filename-only. Whitespace-only changes conservatively count as conflicts. The new tests additionally cover the original corrupt request-digest and contradictory-acceptance copy cases. The retained before-fix output demonstrates failures before correction; source restoration to recreate it was not attempted.

### History and schema compatibility

The 31 exact original evidence files from the prior verifier inventory remain byte-identical both to that inventory and across this verification. They include the six S4 evaluation histories, C1–C6 adjudication files, earlier legacy outputs, expectations and stored summaries. Read only the named runs from the calibrated summary and the known import of `RUN-20261003T161609-dc9f7527`; no broad retained-directory search.

Corrected summary, in both input orders, preserves **four selected evaluations**, metrics, judge answers, fixture agreement and human calibration: **7 entries / 6 cases / 4 CONFIRM / 2 MODIFY**, including C3's earlier unresolved entry. Eight retained evaluation records read without INVALID status or issues. No new control directory was created in retained runs. The import has no evaluation directory and remains the compatible smaller copy.

For schema 3, the added request/acceptance hashes are fields within `duplicate_runs[].variants[].evaluations[]`; existing fields/types remain. The current CLI consumer serializes `summarize` directly, and repository consumers found in the relevant source/test directories do not perform a strict old-field-set parse. Typecheck passes. **No concrete schema-3 consumer conflict found; no version change is required solely for these additions.** This does not certify unknown external consumers.

Nonblocking documentation update: the R2 paragraph in `docs/decisions.md` should describe INVALID controls, exact timestamp validity, the unknown-order blocker, request/acceptance byte comparisons and their added diagnostic hashes, and qualify the “all issues block” wording to the actual latest-candidate policy. Leave recovery explicit; do not prescribe silent history edits/deletions. The paragraph was not edited and is not the reason for the code verdict.

### Retained builder evidence and separate runner limits

Reviewed `.rstack/r2/correction-1/before-fix.tap`: the two added tests fail before correction on malformed acceptance and invalid preparation time. Reviewed `evaluation-after-fix.tap`: **17 pass / 0 fail**, recorded exit 0. This is BUILD-02's evidence, distinct from the verifier's blocked test-file launch.

For `sensitivity-evals-cases/`, independently reconciled **28 cases.jsonl rows** with summary results (excluding the ledger's added `recorded_at`) and inspected each named stdout/stderr path. There is one passing 17-test control and **27 detected cases: 1–10, 57, 58, 82–96**. Every mutation has COMPLETED / exit 1 and its named failing test in TAP. Both recorded source digests match the current independently computed digest. This is **27/96, not a full sensitivity pass**; it adds no specific regression mutation for the command bypasses or expanded-year case found here.

For `runner-real-timeout/`, retained source and selection match: `--cases 81 --timeout-ms 50`. The real unmodified control records **TIMED_OUT, SIGKILL, exit status null, duration 60 ms, no usable test report**, yielding CONTROL_NOT_RUN. Case 81 is **INCONCLUSIVE_CONTROL and not executed**. Both rows appear in cases.jsonl; the two named control output files exist; summary reports no unremoved copies and `full_sensitivity_pass: false`. This demonstrates the control-timeout path and its dependent-case handling on this source, from builder evidence. It is not a detection result for case 81.

Still untested here: runner interruption while a child runs, independent child-kill handling, normal child completion with no usable report, a completed failing unmodified control end to end, and descendant cleanup after timeout. The unchanged interrupted-control branch still pushes a summary row without calling `completed(row)`, so that interrupted-control row can be absent from cases.jsonl; this prior static reporting observation is not repaired by the timeout result. Prior 80/81 detection evidence and the earlier failed attempt remain separate; different-source subsets were not combined into a full pass.

Selected builder artifact SHA-256 identities:

| Artifact under `.rstack/r2/correction-1/` | SHA-256 |
|---|---|
| `before-fix.tap` | `87e879c6ed4469f82485679f63e0ca2785247eeaea537538443fbf9ef409c509` |
| `evaluation-after-fix.tap` | `2aa86350c862102a4ab65e96a6e3ae3d653c40abc393b0e6ccd26a69a2e1bb9f` |
| `sensitivity-evals-cases/run.json` | `60544ac2648a7e233672e289ec3a56f7d4e792de2cbfbbe14f8425ba710abb88` |
| `sensitivity-evals-cases/cases.jsonl` | `79811dba46d61175027bb95aab2a7ea26530ab9861481854ff663a8714935874` |
| `sensitivity-evals-cases/summary.json` | `b1ed7772bed19d0d68ac5a63a59098b7e840f9351c479479b5d973a2f5c13863` |
| `runner-real-timeout/run.json` | `1ec5081890a7d93df54b6ebf435de75cbe7af34285510b5462278288886d6d6f` |
| `runner-real-timeout/cases.jsonl` | `49ef5d6114cebf263c43355ca4a7720bdc9c7fa1566dff73f4ec49d56c2f4815` |
| `runner-real-timeout/summary.json` | `3c8eb0ab5d6da1acc23776fdad85597de6009da81f1f76ddd82aabf98e66eb60` |

### Closure

The next required decision belongs to the owner: a bounded follow-up for D6 command validation, and disposition of the supported timestamp-range/order counterexample. D7-R2-B can close. Runner follow-ups and the decisions wording remain separate; no repair batch or release was started by this verifier.

All commands started by this verifier have returned; the final process check found no remaining package test/helper process. No source, test, builder record, original review, frozen run, evaluation, adjudication or rubric was changed. Existing staged state was empty and remains untouched. The original **28,548 report bytes** (SHA-256 `8f865f811fd5cf7619c8121e5fb3235404666b7ddba08893e8cee1613b0c20b6`) are preserved as the exact prefix; only this correction appendix was added.

Builders remain paused pending the owner's relay.

**R2 CORRECTION VERIFICATION WINDOW CLOSED — CHANGES REQUESTED.**
