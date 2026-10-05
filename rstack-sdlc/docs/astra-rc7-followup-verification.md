# Independent RC7 correction verification — 2026-10-04

**RC7: VERIFIED_FIXED. Overall verdict: READY_FOR_S6.**

The sole blocker in `astra-rc1-rc9-verification.md` is closed for the candidate identified below. RC1–RC6, RC8 and RC9 remain VERIFIED_FIXED from that report; they were not reopened. No known offline implementation defect remains that should be repaired before live VS Code Copilot validation.

This is a focused correction verification. It is **not COPILOT_VALIDATED**, does not authorize publication, and does not resume S6. S6 remains PAUSED pending the owner's next instruction. The original reports remain unchanged as historical evidence.

## Exact subject and identity gate

| Item | Confirmed identity |
|---|---|
| HEAD / local upstream ref | `6e9bd18a8abe21732f16a063ae1bf71b73dd8f1a` |
| Branch | `feat/rstack-sdlc-local-build` |
| Subject | 111 files; unstaged working-tree candidate |
| Supplied inventory digest | `db2b13876879caf5cd3eae036d80c2f65dacfb43126d7e942b880b49e452b179` |
| Package manifest SHA-256 | `1f5eaef83d2309b7daddaec978fe147128d06cbe5b35a4efb8e4f1513e6208fa` |
| Original release-candidate audit | `d48dfe6936ae52d37dfb538f271a544a55595fd361aa507d737b94f87a6c3a2d` |
| Original RC1–RC9 verification report | `5b8ab3818653fbf02f1de430662affd6bf0dc9b44cd9502be57f80af308cdc3e` |

Before execution, every current path and raw file hash matched `.rstack/integration-rc7-followup/source-identities-final.txt`; no candidate path was missing or extra. The index was empty. The 111st file is the prior Astra verification report. HEAD equals the locally stored upstream ref; no new live remote/publication check was performed.

**Digest serialization detail:** the supplied digest uses the inventory's listed path order, LF separators and no trailing LF. Recomputing current file hashes in that order reproduces `db2b1387…b179` exactly. The earlier review's ordinal-sort convention instead gives `f43785d6eb8b87898cb61f0c76234686f43d32ff77427fe20bd74928a99cefb6` for these same 111 entries. The initial ordinal comparison therefore differed, but this was an ordering difference, not source drift. Both forms are retained in `identity-gate.json`; the supplied manifest order identifies this review subject.

New reviewer outputs are confined to `tests/.tmp/astra-rc7-followup-20261004/` and this report. All evidence paths below are relative to that output directory unless stated otherwise.

## Delta inspected

Exactly six pre-existing candidate files changed since the prior review:

- `adapters/node-test-executor/index.ts`: adds the exact name `NODE_TEST_WORKER_ID` to `RUNNER_VARIABLES`, plus an explanatory comment. Comparison with the prior generated runtime confirms no other executor change.
- `tests/rc7-test-environment.test.ts`: three regression tests appended. The original 15,403 bytes retain their previous SHA-256; the existing tests were not rewritten.
- `tests/sensitivity.ts`: case 120 added. Removing that new case in memory reproduces the prior catalog's exact SHA-256 `068a069e6a44b0f0979c15988ee99b126ff99f5a16cbac3c8d143896ef842e79`; existing cases and runner behavior are unchanged.
- `docs/progress.md`, `docs/decisions.md`, `docs/s6-host-validation.md`: the reported follow-up records.

The generated package contains 33 files. Against the previous independently generated package, exactly two differ: `rstack-sdlc-manifest.json` and `runtime/adapters/node-test-executor/index.ts`. The other 31 are byte-identical. Workflow, record schema, profile, role tools and the Coordinator's permissions are unchanged. No additional schema compatibility finding arises from refusing one more runner-owned declaration.

## Closure of the RC7 counterexample

The executor's existing unconditional upper-casing comparison now rejects the new name before `spawnSync`. The refusal applies whether the parent value is present or absent, and to uppercase, lowercase and mixed-case declarations. This comparison is not inside a Windows-only branch; actual executions in this verification were Windows/Node v24.21.0 only.

Independent source and generated-runtime probes each checked four combinations of spelling and present/absent parent value. Each returned `exit_code: null`, no test outcomes, and the runner-variable refusal text. A sentinel that the test would write was absent in every refusal case.

The probes also exercised the decision to reserve exact names only. `NODE_TEST_WORKER_ID_APP` was accepted and its declared synthetic value reached the test. An undeclared parent `NODE_TEST_WORKER_ID=999` did not become application environment authority: Node assigned its own worker value, the parent's value was excluded from the identity, and an unrelated ambient variable was absent.

For a non-vacuous old-guard control, the reviewer imported the unchanged executor from the prior disposable generated package, using a **new** fixture. It accepted the declaration, ran the sentinel and exposed a worker value different from the declared `999`, reproducing the old defect. The new source and package refuse the same declaration. No original counterexample file or run was edited or rerun in place.

The engine regression tests confirm the integration boundary: configuration parsing may accept the well-formed name and start the run, but the first proof baseline execution is refused. `submit` returns `PROOF_SETUP_FAILURE`; no test executes, no journal event is appended, neither `proof` nor `proof_baseline` is accepted into current subjects, the stage remains `proof`, the attempt remains pending, and no proposal exists. Thus the earlier path to `PROPOSAL_READY` with the false effective-value identity is closed.

**Recording distinction:** refusal execution/output artifacts and rejected-submission evidence are still retained. The builder's phrase “nothing recorded” is accurate for the journal transition/accepted proof, not a claim that no filesystem evidence is written. Retaining that refusal evidence is expected behavior.

## Independent results

| Check | Independently observed result | Output |
|---|---|---|
| `npm run typecheck` | Exit 0 | `typecheck.txt`, `typecheck-exit.txt` |
| RC7 regression file and proof integration file | 22/22 pass: seven RC7 tests and fifteen proof tests; zero failures/skips; exit 0 | `focused.tap`, `focused-exit.txt` |
| Old-guard counterexample control | Old executor runs the test and overwrites the declared value | `probes.mjs`, `probe-results.json`, `probes.log` |
| New source and generated executor probes | Eight refusal combinations total; no sentinels; both exact-prefix controls pass | Same probe outputs |
| Package generation into two new directories | Both 33-file trees identical to each other and retained dist; all listed hashes validate | Same probe outputs; `package-1/`, `package-2/` |
| New sensitivity case 120 | One passing RC7 control; mutation DETECTED; exit 0; no launch failure, timeout, interruption or leftover copy | `sensitivity/summary.json`, `cases.jsonl`, transcripts, `sensitivity-exit.txt` |
| Scope and index inspection | No path outside the package changed; nothing staged | `scope.json`, final status output |

The existing proof suite exercises stale verification, restored environment, candidate integrity and proposal integration. Its environment checks and all seven RC7 tests passed. This focused follow-up did not repeat the other eight RC files, full normal suite, or full package-installation suite; the earlier independent results remain historical and the builder's new broad totals are not represented as independently rerun here. No live workspace was installed.

Case 120 removes only the new reserved name in a disposable copy. The control reports seven passing tests. With that omission restored, both the before-spawn test and the engine proof-refusal test fail for the expected reasons. The current guard is therefore observed to prevent the reproduced defect. This was **one selected case out of 120**, not a full sensitivity pass. Live mutation-source digest was unchanged before/after: `23974de1cbd1ca64b4d4d67f479921952f9fe317b8774ca28b6d7e4badbeb301`.

## Builder evidence kept separate

Inspected the retained regression-first failure log: seven tests, five passing and two expected failures against the unfixed executor. This is builder evidence; the independent old-guard control and case-120 mutation provide separate reproduction.

The retained follow-up sensitivity run selects exactly 17, 110, 111, 118 and 120. Its seven process records and corresponding TAP transcripts agree with two passing controls and five detected mutations, completed processes, no launch error/signal and the reported unchanged source digest. That run remains **builder-executed targeted evidence**, not five independently rerun cases.

Builder-reported 42/42 RC tests, 185 passed plus one skip in the 186-test normal suite, and 32/32 package tests remain attributed to the builder. They were not combined with this follow-up's counts. The earlier full-catalog run remains **PARTIAL / INTERRUPTED**, with no completed cases 110–113 in that historical run; no targeted results are used to turn it into a full pass.

## Limits and inherited verdicts

| Item | Classification | Assessment |
|---|---|---|
| Prior RC7 worker-ID identity mismatch | NO_LONGER_APPLIES | Closed by the exact-name refusal in source and generated runtime. |
| Exact reserved-name list for Node v24.21.0 | ACCEPTED_LIMITATION | Implements the explicit scope decision. The whole `NODE_TEST_` prefix is not reserved. Newly observed runner-owned names require a future bounded update. |
| Refusal at first execution rather than run start | ACCEPTED_LIMITATION | Same boundary as the existing two reserved names. No proof can be accepted and no application test is spawned. |
| RC7 PATH/runtime-value sensitivity; no re-proof after legitimate environment change | ACCEPTED_LIMITATION | Freshness policy unchanged; existing refusal/recovery tests passed. |
| RC7 unsalted digest and raw test-output redaction | FUTURE_HARDENING | Unchanged limits from the prior report; metadata contains digests, not values. |
| RC7 non-Windows behavior | TEST_DURING_S6 | Case-folding is visible in platform-independent code; no non-Windows execution was claimed. |
| Prior file-symlink and reviewer Git Bash skips | TEST_DURING_S6 | Not reclassified as passes by this focused review. |
| Actual VS Code Copilot behavior, human file creation and host model/tool behavior | TEST_DURING_S6 | Repeat the paused host gate on this exact package only after owner authorization; no host observation performed here. |

All other remaining-limit classifications in `astra-rc1-rc9-verification.md` stand, including the decision-time display check, superseded-attempt scope, manifest ownership boundary, evaluation subject definition and file-transport limitations. The independently closed whitespace uncertainty stays closed. D1–D8 are not reopened; no concrete regression from this correction was found.

| Repair | Current verdict |
|---|---|
| RC1 | VERIFIED_FIXED |
| RC2 | VERIFIED_FIXED |
| RC3 | VERIFIED_FIXED |
| RC4 | VERIFIED_FIXED |
| RC5 | VERIFIED_FIXED |
| RC6 | VERIFIED_FIXED |
| RC7 | VERIFIED_FIXED |
| RC8 | VERIFIED_FIXED |
| RC9 | VERIFIED_FIXED |

## Preservation and stop

Final checks reproduced the 111-file supplied-order digest `db2b1387…b179` and package manifest `1f5eaef8…8fa`, with zero source differences. All 1,022 files snapshotted across the old integration evidence, new integration evidence and prior reviewer-output directory were unchanged. This includes the 475 earlier builder-evidence files and the original counterexample files. All six earlier Astra reports retain their identities. See `preservation-final.json`.

This report is the only newly added non-ignored file and is excluded from the reviewed 111-file subject. No production source, tests, decisions, progress, prior reports or retained evidence was edited. Nothing is staged, committed or pushed.

All reviewer test/probe/sensitivity processes exited. The final read-only process check found zero reviewer/package Node matches; 43 unrelated Node processes were left untouched (`processes-final.json`). No Copilot, Jira, Bitbucket or S6 action was taken.

**READY_FOR_S6 for this identified offline candidate. S6 remains PAUSED; stop here.**
