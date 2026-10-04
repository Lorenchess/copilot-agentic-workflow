# Independent RC1–RC9 verification — 2026-10-04

**Verdict: CHANGES_REQUESTED_BEFORE_S6.** RC7 has one reproduced environment-identity defect. RC1–RC6, RC8, and RC9 are independently verified fixed. S6 remains PAUSED. This is an offline repair verification, not COPILOT_VALIDATED and not another architecture audit.

## Review subject and preservation gate

Reviewed the uncommitted candidate on branch `feat/rstack-sdlc-local-build`, above HEAD `6e9bd18a8abe21732f16a063ae1bf71b73dd8f1a`. The local upstream ref resolves to that same SHA; no live remote/publication claim is made by this verification.

Before testing, the actual tracked-plus-untracked, non-ignored package inventory was compared with `.rstack/integration-rc1-rc9/source-identities-final.txt`. All **110 paths and byte hashes matched**, with no missing or extra candidate file. The canonical inventory is ordinal path order, lowercase SHA-256, two spaces, repository-relative path, LF between entries and no terminal LF.

| Identity | Independently confirmed SHA-256 |
|---|---|
| 110-file aggregate | `1af5e03abc4eadd70dde93687a40d4368980cfd606a6868577fa6d7b6f4b16b4` |
| Original release-candidate audit | `d48dfe6936ae52d37dfb538f271a544a55595fd361aa507d737b94f87a6c3a2d` |
| Generated package manifest | `2c3b16cab356f692b003731a3738759c9d911d23512de633829cbe3200e62f27` |

The four earlier Astra reports matched the previous audit's retained source snapshot. The index was empty. The candidate comprised 18 modified tracked files and 11 untracked files: the original audit, S6 notes, and nine RC regression files. Its exact identities and initial status are copied to the new review-output directory below. No previous report, production source, test, progress record, decision, or retained builder evidence was edited.

**Reviewer output directory:** `tests/.tmp/astra-rc1-rc9-20261004/`, relative to `rstack-sdlc/`. This report is the only added non-ignored file; it is outside the original 110-file review subject. Tests also created their own disposable fixture directories under `tests/.tmp/`. Package installation APIs ran only inside the explicitly requested tests' disposable workspaces; nothing was installed into a real workspace.

## Repair verdicts

| Repair | Verdict | Independent basis |
|---|---|---|
| RC1 | VERIFIED_FIXED | Parser and proof classifiers distinguish executed leaves, failures, SKIP, TODO, suites, nested tests, untyped entries, and mixed reports; real runner and end-to-end proof checks passed. |
| RC2 | VERIFIED_FIXED | Segment validation rejects escaping/ambiguous forms before run creation and again before spawn; valid nested patterns execute and outside sentinels remain untouched. |
| RC3 | VERIFIED_FIXED | Changed or missing displayed briefs produce `DISPLAYED_SUBJECT_CHANGED`; wait/version/authority remain unchanged and no silent restoration occurs. |
| RC4 | VERIFIED_FIXED | Proposal gating re-reads current relied-on records, all three trees and their leaves, and execution outputs. Modified/missing candidate bytes block; unchanged evidence succeeds. |
| RC5 | VERIFIED_FIXED | Failed reclaim observes the deadline and 25 ms polling delay; named refusal, normal contention, and successful recovery were reproduced. |
| RC6 | VERIFIED_FIXED | Listed runtime/profile/template drift is named as `FILES_CHANGED`; clean, missing, changed-manifest, and installed-file states remain distinct; verification changes no bytes. |
| RC7 | STILL_FAILING | Ordinary declared variables and freshness checks work, but the allowed `NODE_TEST_WORKER_ID` declaration is overwritten by Node inside workers while evidence hashes the supplied value. The engine still reaches a proposal. |
| RC8 | VERIFIED_FIXED | Stale judged evidence is listed and excluded, without older fallback or rewriting judgments/adjudications. Duplicate-copy integration remains conservative and order-independent. |
| RC9 | VERIFIED_FIXED | File transport preserves shell-sensitive text and whitespace. Inline answers and unsafe inline labels are refused; supported plain labels retain the documented quoting contract. |

## Blocking finding: RC7 runner-owned variable accepted as application environment

**Severity: P2. Classification: BLOCKER_BEFORE_S6.** Affects `adapters/node-test-executor/index.ts:68` and its declaration/refusal path at lines 74–109. The reserved list contains `NODE_OPTIONS` and `NODE_TEST_CONTEXT`, but omits `NODE_TEST_WORKER_ID`.

**Affected contract:** application-declared values reach the test, and the recorded environment digest represents the relevant effective names and values. The problem is not arbitrary parent-environment inheritance and does not require hashing the whole parent environment.

**Exact counterexample, reproduced on Node v24.21.0 / win32:**

1. A valid application configuration declares `test.env: ["NODE_TEST_WORKER_ID"]`.
2. The executor's parent supplies the synthetic value `NODE_TEST_WORKER_ID=999`.
3. Configuration parsing accepts it; executor validation accepts it. `childEnvironment()` includes the name and hashes `999`.
4. Node's test runner assigns its own worker ID before executing the application test. A direct one-file probe receives `1`; the engine integration fixture receives `3` during both baseline and candidate verification.
5. The end-to-end fixture records baseline `VALID`, verification `PASS`, and reaches `PROPOSAL_READY`. Its execution records identify a value that the observed worker never received.

In that integration run, the recorded digest was `sha256:efd3ea8a6b12de54a12d694bf0c5cf02c62799f99a6878a3d7ce05ad2315ef46`. A digest computed inside the test over **the identical recorded name list** and actual values was `sha256:64672414c2a0996ea084d1df27d0dd3dbc37970545046fcb78e197b847aa5dc3`. No secret parent values were printed or saved; `999` is a synthetic fixture value. The executing Node binary's embedded `internal/test_runner/runner` source confirms the assignment `env.NODE_TEST_WORKER_ID = String(workerId)`.

Evidence: `worker-id-counterexample.mjs`, `.json`, `.log`, and `worker-id-engine.mjs`, `.json`, `.log` in the reviewer output directory. Both reproductions exited 0 because their assertions successfully reproduced the defect. The engine fixture uses simulated roles and a scripted decision; it is not host or human-observation evidence.

**Smallest correction:** add `NODE_TEST_WORKER_ID` to the existing runner-owned variable refusal list. Keep the current case-insensitive reserved-name check. Do not add the variable to the platform inheritance list or pretend its parent value is the worker's effective value. Exact proposed edit files are `adapters/node-test-executor/index.ts` and `tests/rc7-test-environment.test.ts`; regenerate the package and identify the corrected candidate afterward. No repair was made during this verification.

**Acceptance test:** with a declared `NODE_TEST_WORKER_ID` and synthetic parent value `999`, executor invocation must refuse before spawning (`exit_code: null`, no test outcomes, named runner-variable explanation); a sentinel must show no application test executed. Include absent-parent and Windows mixed-case declarations, matching the existing reserved-variable policy. At engine level, this configuration must not establish an accepted proof or reach proposal readiness. Retain the ordinary declared-variable control and the existing changed-environment refusal tests. An undeclared parent worker-ID variable must remain excluded; Node's own derived worker ID is not an application-declared value.

## Detailed bounded verification

### RC1 and RC2

Inspected `parseTap` in `adapters/node-test-executor/index.ts`, `resolve` and both classifiers in `core/engine/execution.ts`, and their engine call sites. Only a runner-marked `type: 'test'` without nested results becomes `kind: TEST`. SKIP/TODO are explicit statuses. A missing, container, skipped, or TODO proof entry becomes a setup/verification issue before proof acceptance. A failing leaf cannot satisfy verification; assertion failures remain valid RED_GREEN baseline evidence. Unmapped skipped tests remain distinguishable and do not substitute for required proof tests. Escaped `#` and text inside diagnostic blocks are covered.

`testPatternProblem` rejects empty, `.`, `..`, and dot-leading segments, including those after a valid prefix. Backslashes, drive-relative/absolute, UNC, leading slash and option-like forms are rejected. Embedded dots in a valid segment and supported nested globs still work. `engine.start` parses the measured configuration before creating a run; `executor.run` checks again before spawn. The duplicate validation protects direct executor callers and is safe. Lexical containment depends on the existing measured-tree link/junction refusal; its Windows file-symlink coverage limitation is recorded below.

### RC3 and RC4

`displayedAt` supplies both the WAIT location and the decision-time comparison. Retained identity checks remain authoritative. Tests cover every permitted action, missing/edited display, repeated decision after `resume`, explicit restoration, second-round display, CLI decisions, and retained product-question content. Refused decisions are retained separately; no authorization event is added and the human wait remains.

`assertProposalEvidence` runs before proposal persistence. It verifies source/config/profile/workflow, current subjects, selected role-result evidence, decisions/planning basis, base/proof/candidate manifests and each leaf, and both execution output artifacts. Tests change/remove each relied-on item, including substitutions, and confirm no proposal event or file. Unrelated mutable `work/` and `exec/` changes do not falsely block. Superseded attempts are not current proposal authority; the separate packet checker still traverses historical records. This distinction is consistent with the stated proposal contract, not a new blocker.

### RC5 and RC6

The failed-reclaim path now falls through to deadline checking and `sleep(POLL_MS)`. Disposable dead-holder/guard and occupied-destination fixtures produce `LOCK_UNCERTAIN`; a live holder still produces `LOCK_BUSY`. A concurrent legitimate reclaimer is left alone and successful dead-holder recovery retains its evidence. An additional reviewer probe intercepted only its own process's `Atomics.wait`: four actual 25 ms sleeps were observed before `LOCK_UNCERTAIN` at 133 ms for a 125 ms acquisition limit. No machine-wide failure injection was used.

RC6 exercises both direct verification and the generated installer command. An unchanged manifest with a modified or missing listed file produces `DRIFT`/`FILES_CHANGED`, includes the path and MODIFIED/MISSING state, and exits 2 through the CLI. Snapshot assertions establish that verification does not repair anything. The manifest-based ownership boundary explains why unlisted files are excluded.

### RC7 beyond the blocker

The explicit Windows runtime list and declared application variables are built into a new environment object; the whole parent environment is not spread into the child. Tests confirm undeclared ambient values and parent runner options do not reach the test. Names are normalized/sorted; unset and changed relevant values change the digest. Execution records use the identity returned with the actual execution outcome. Changed values before verification yield `PROOF_ENVIRONMENT_CHANGED`; change before proposal yields `EVIDENCE_STALE` followed by that refusal, with no proposal. Restoring the proof environment allows verification and review again.

A separate reviewer child enumerated its actual environment names and computed the effective-values digest internally. Ordinary declared values matched the stored digest, undeclared values were absent, and a PATH change changed identity. Node additionally generates `NODE_TEST_CONTEXT` and `NODE_TEST_WORKER_ID`; neither was inherited ambiently. The first reviewer assertion expected only the former and failed; its original log is preserved. Inspection of the local Node runtime explained the second and led to the concrete declared-variable counterexample above, not to suppressing a product failure.

Environment metadata stores names and a digest, not plaintext values. The RC7 end-to-end fixture scans retained files for its synthetic declared values and passed. Raw application test output is still retained verbatim: this is not a general secret-output redaction mechanism. That disclosed boundary is classified separately below.

### RC8 and RC9

`listEvaluations` compares each accepted request's evidence digest with current evidence and records the mismatch without changing acceptance history. `summarize` first selects the latest candidate, then excludes it if it has issues; it cannot fall back to an older accepted judgment. Preserved adjudications do not enter current calibration when their judgment is stale.

The existing D6/D7 tests ran in the full suite. An additional reviewer probe copied an evaluated run, confirmed IDENTICAL duplicate resolution, then changed only one copy's work evidence. One judgment became stale; the two-copy summary reported `EVALUATIONS_DIFFER`, selected no evaluation, counted the run once, and was identical in reversed input order. No convenient fresh copy was silently substituted. The digest's inclusion of work/exec is unchanged from evaluation acceptance.

RC9's strict UTF-8 decoder reads file content without trimming. Real cmd.exe, Windows PowerShell, and PowerShell 7 commands delivered literal `$env:NAME`-style strings, quotes, backticks, semicolon/pipe and other metacharacters, Unicode, tabs, LF and CRLF. Fixture text executed nothing. Inline answers are always refused; plain inline labels/reasons have the documented restricted character set and double-quote contract. Missing/invalid UTF-8/conflicting input forms record no decision. JSON decision/amendment files remain data paths.

The additional reviewer probe covered leading/trailing spaces, tabs, CRLF/LF and multiline content for all three file flags. Retained answer, recorded-by, abandon event and planner answer input matched exactly. The current-candidate whitespace uncertainty is therefore closed by independent evidence, even though a permanent regression test is still absent.

## Contract and persisted-record compatibility

Workflow version remains 5, profile version 1, execution/decision/journal record schema 1, package manifest schema 2 and generator version 2. Profile and role tool sets are unchanged, including Coordinator `execute`, `read`, `agent`. No edit tool was added.

- Optional `test.env` leaves existing configurations without it valid. Newly refused traversal/dot-leading patterns are an intentional validation restriction; no path is normalized silently into another target.
- `kind`, SKIP and TODO describe new execution outcomes. Retained historical results are read as recorded; they are not reparsed from old TAP into a new passing-leaf claim.
- The six-field environment identity does not silently accept old four-field proof environments. To verify this, the reviewer archived HEAD into a disposable directory and used that **old implementation** to create genuine pre-repair runs. The candidate refused an old run at verification with `PROOF_ENVIRONMENT_CHANGED`; at proposal it returned `EVIDENCE_STALE`, then that refusal. A completed old run produced an identical deterministic report under the old and new readers, with no file writes. Restarting unfinished old runs is an explicit limitation, not an invisible migration.
- New reply codes, text-file flags and verify-report fields do not rewrite persisted decisions or installation manifests. Old MISSING/CHANGED package states retain their interpretation. `PRESENT` now requires the originally intended listed-file integrity check.
- Evaluation freshness uses an already recorded digest. Historical judgments remain ACCEPTED history but carry explicit stale issues and are excluded from current aggregation. No evaluation schema migration or adjudication rewrite occurs.

No separate concrete versioning defect was found. The RC7 blocker is the accepted reserved variable's effective-value mismatch, not a demand for a schema bump.

## Independent validation results

All paths below are in the reviewer output directory. Counts are not added across overlapping runs.

| Check | Result | Evidence |
|---|---|---|
| `npm run typecheck` | Exit 0 | `typecheck.txt`, `typecheck-exit.txt` |
| Nine focused RC files | 39 pass, 0 fail, 0 skip; exit 0 | `focused-authorized.tap`, corresponding exit file |
| Normal full suite (`node --test --test-reporter=tap "tests/*.test.ts"`) | 183 total: 181 pass, 0 fail, 2 skip; exit 0 | `full.tap`, `full-exit.txt` |
| Package/install/RC6/portable/extension tests | 32 total: 31 pass, 0 fail, 1 skip; exit 0 | `package.tap`, `package-exit.txt` |
| Two independent package generations | 33 files each; byte-identical to each other and retained dist; manifest matches supplied hash | `generated-identities.txt`, `reviewer-probes.json` |
| Scope check | Exit 0, no violations | `scope.json`, `scope-exit.txt` |
| Additional whitespace/backoff/legacy/duplicate-copy probes | All assertions passed; exit 0 | `reviewer-probes.mjs`, `.json`, `.log` |
| Ordinary child-environment control | Passed after accounting for both Node-generated worker names | `environment-probe-final.log`, `environment-probe.json`; first assertion log retained |
| RC7 counterexamples | Defect reproduced directly and through proposal readiness | `worker-id-counterexample.json`, `worker-id-engine.json` |
| Independent sensitivity subset | 9/9 controls passed; 12/12 DETECTED; exit 0; no interruption/launch failure/inconclusive result or leftover copies | `sensitivity/summary.json`, `cases.jsonl`, transcripts, `sensitivity-exit.txt` |

The first sandboxed focused-suite attempt failed to launch child processes (`spawn EPERM`); its `focused.tap` is retained and receives no test credit. The authorized rerun used normal isolation. Full-suite skips were file symlink creation and unavailable Git Bash. The package group's only skip was Git Bash. RC9 itself ran three Windows shells; Git Bash was not independently exercised here. Builder totals of 182/1 and 32/0 are not substituted for these reviewer results.

Selected independent sensitivity cases: **100, 101, 103, 104, 105, 108, 109, 110, 111, 112, 113, 118**. They cover leaf acceptance versus parser status, executor containment, display freshness, candidate leaves, failed reclaim, package files, proof-environment freshness, inheritance, evaluation freshness, inline-text refusal and environment values. The per-process outer bound was 60 seconds. Each control passed and each mutation failed its named guard test. The live mutation-source digest stayed `c20dd3142931ce009c9a68d300eb5fec3695cd25d51e17a841ce3fc75d439688`. These mutations do not cover the newly reproduced worker-ID omission; a passing sensitivity selection is not proof that RC7 has no remaining defect.

**Builder evidence, inspected rather than claimed as independent execution:** the retained targeted run selects exactly 17, 20, 77, 100–119. All 34 process records and their TAP transcripts agree with 11 passing controls and 23 detected mutations, completed processes and the stated source/runner digests. The historical full 113-case run has 26 passing controls and 109 completed detected cases, no summary, and no completed records for 110–113. It remains **PARTIAL / INTERRUPTED**. Neither targeted run is combined with it or called a full-catalog pass. Inspection output: `retained-evidence-inspection.json`.

## Remaining-limit classifications

| Limit | Classification | Reason / remaining work |
|---|---|---|
| RC7 declared worker ID differs from effective value | BLOCKER_BEFORE_S6 | Concrete counterexample and minimal correction above. |
| RC3 decision-time display check | ACCEPTED_LIMITATION | Enforces the requested invariant when recording the decision. Continuous observation and changes restored between reading and decision are outside this check. |
| RC4 superseded attempts and old display copies | ACCEPTED_LIMITATION | They do not authorize the current proposal; the full packet verifier still reports their damage. |
| RC4 external writes between checking and persistence | ACCEPTED_LIMITATION | Current local unsigned store is not atomic against another writer bypassing engine ownership. No broader threat-model redesign requested. |
| RC6 unlisted package files | ACCEPTED_LIMITATION | Verification covers manifest-owned files, not arbitrary directory contents. |
| RC7 PATH/TEMP/runtime-variable sensitivity | ACCEPTED_LIMITATION | These values deliberately participate in freshness. The independent PATH probe confirms this. |
| RC7 legitimately changed environment cannot re-prove in same run | ACCEPTED_LIMITATION | Restore the original environment or begin a new run; no silent reuse. |
| RC7 unsalted environment digest | FUTURE_HARDENING | Values are not stored, but guessable values can be tested offline against the digest. |
| RC7 non-Windows environment set | TEST_DURING_S6 | Not executed here; verify on a non-Windows host before claiming that host's behavior. |
| RC7 test-generated plaintext secret output | FUTURE_HARDENING | Environment metadata is digested; test output is not redacted. Do not interpret this report as a guarantee against a test printing secrets. |
| RC8 work/exec changes or stripped packet copies | ACCEPTED_LIMITATION | Existing evidence-subject definition includes these files; conservative stale refusal is consistent with acceptance. |
| RC9 text expanded before engine entry | ACCEPTED_LIMITATION | The engine cannot reconstruct prior shell input. File-only answers and the Coordinator's plain-label/path instructions avoid it under the supported contract. |
| RC9 leading/trailing whitespace uncertainty | NO_LONGER_APPLIES | Independently exercised exactly for all three file flags and planner input. A durable regression test remains future hardening. |
| RC9 human file creation and plain-path handling | TEST_DURING_S6 | Observe the human/Coordinator interaction; owner explicitly retained the current tool set. Future usability changes are outside this verification. |
| File-symlink test skip | TEST_DURING_S6 | Run that negative case where the host permits file symlinks; do not count it as passed here. Existing junction coverage ran. |
| Git Bash unavailable in reviewer environment | TEST_DURING_S6 | Recheck if used as the selected host shell; three Windows shells were independently exercised. |
| Actual VS Code Copilot behavior | TEST_DURING_S6 | Repeat G0 for the corrected candidate; observe package discovery, model/tool behavior, delegation isolation, WAIT ending the turn, decision/file fidelity, and pending/refusal/recovery behavior. None was observed here. |

D1–D8 remain previously VERIFIED_FIXED. No new regression of those findings was demonstrated; their existing relevant regression cases ran in the normal suite. No new architecture audit was opened.

## Closeout

The closing preservation check passed: all original 110 source identities and their aggregate digest are unchanged; all 475 retained integration-evidence files are byte-identical with no additions or losses; all five previous Astra reports and the package manifest identity are unchanged. Its result is recorded in `preservation-final.json`. The only additional non-ignored path is this report. Nothing is staged, committed or pushed.

Every launched reviewer command returned an exit result. The final read-only process check found zero reviewer/package Node matches (43 unrelated Node processes were left untouched); see `processes-final.json`. No Copilot, Jira, Bitbucket, live installation or S6 work was performed.

**The candidate is not READY_FOR_S6. Correct the RC7 reserved-worker-variable omission, identify the new candidate, and independently verify that bounded correction before resuming S6. Stop here.**
