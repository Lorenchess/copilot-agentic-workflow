# RSTACK SDLC — S6 live VS Code Copilot validation

**Status: S6 STARTED — LIVE HOST EXECUTION PENDING ACCESS (owner decision, 2026-10-04).** Offline implementation complete. Offline verdict `READY_FOR_S6` ([astra-rc7-followup-verification.md](astra-rc7-followup-verification.md)): D1–D8 VERIFIED_FIXED, RC1–RC9 VERIFIED_FIXED. `COPILOT_VALIDATED`: NO. The owner has no access at present to the real VS Code GitHub Copilot environment, so no live-host step has been run on this subject: the host gate (G0) and every step after it wait for that access. Preparation that needs no host is complete (section 3.3). The next step is the first live action in VS Code (section 3.4): **S6 IN PROGRESS — LIVE HOST EXECUTION PENDING ACCESS.** Jira and Bitbucket are deferred and are not needed to begin or complete this baseline validation. The G0 rows in section 5 are historical preliminary observations, made on the earlier checkpoint `6e9bd18` before the owner stopped S6 for the RC1–RC9 repairs; they are kept as evidence of what was seen then and are not a completed gate. Nothing below is observed until its row says `OBSERVED` or `OWNER-OBSERVED`.

**S6 integrator:** BUILD-02. **S6 host/pilot preparation owner:** BUILD-03. **Live host steps:** driven by the owner in VS Code. **Final acceptance:** a fresh independent Astra session.

## 1. Subject

| Item | Value |
|---|---|
| S6 subject | Checkpoint `07de93a49b4ec62ada46f0a55d2430ac208a4b53` on `feat/rstack-sdlc-local-build`, parent `6e9bd18a8abe21732f16a063ae1bf71b73dd8f1a`, pushed and verified on origin 2026-10-04. Later commits on the branch change records only |
| Reviewed source inventory | 111 files. Aggregate SHA-256 `db2b13876879caf5cd3eae036d80c2f65dacfb43126d7e942b880b49e452b179`, entries in true ordinal path order (canonical); recomputed with zero differences immediately before the commit. Case-insensitive order of the same entries gives `f43785d6eb8b87898cb61f0c76234686f43d32ff77427fe20bd74928a99cefb6`, explanatory only (progress record "READY_FOR_S6 checkpoint and S6 start") |
| Offline verdict | `READY_FOR_S6` (Astra, 2026-10-04): D1–D8 VERIFIED_FIXED, RC1–RC9 VERIFIED_FIXED. Reports, all kept unchanged: [offline review](astra-offline-review.md), [R1](astra-r1-verification.md), [R2](astra-r2-verification.md), [combined R2c2/R3/R4](astra-combined-r2c2-r3-r4-verification.md), [release-candidate audit](astra-release-candidate-audit.md), [RC1–RC9 verification](astra-rc1-rc9-verification.md), [RC7 follow-up](astra-rc7-followup-verification.md) |
| Profile | `profiles/trial-v1.json`, unchanged; all `host_selector` values are `null` (`requires-host-observation`) |
| Generated package identity | Manifest SHA-256 `1f5eaef83d2309b7daddaec978fe147128d06cbe5b35a4efb8e4f1513e6208fa`. 33 files: 6 agents, 2 Skills, 23 runtime files, 1 profile, and the manifest. `validation_status: UNVERIFIED_ON_HOST`; no model key written. Generated twice from the checkpoint on 2026-10-04, both byte-identical to the package the reviewer verified. `OFFLINE` |
| Prepared for the live run | Disposable folder `C:\rstack-sdlc-smoke\` holding the package copy, the installed workspace, and the synthetic fixture (section 3.3). Owner script: [s6-owner-script.md](s6-owner-script.md). `OFFLINE`; no run exists in the workspace |
| Earlier subject (history) | Checkpoint `6e9bd18a8abe21732f16a063ae1bf71b73dd8f1a`, parent `60c2ba96586ca183cd338512b50e0d214a7a9b08`, with the 98-file inventory `b084ac0d99b71bbd0678816b3ae943f8a279ce1165b31a8bb54bd14e0486ad47`. Superseded when the whole-pipeline audit of 2026-10-04 returned `CHANGES_REQUESTED_BEFORE_S6` with RC1–RC9 |

## 2. Rules

- Labels: `OBSERVED` (seen on the live host in S6 by a builder session), `OWNER-OBSERVED` (seen by the owner operating VS Code, with the export, screenshot, or file the owner saved), `OFFLINE` (established without the host: files, hashes, and engine replies outside Copilot), `DOC-EXPECTED` (documentation or source reading only), `UNVERIFIED`. `OFFLINE` and `DOC-EXPECTED` evidence is never converted into host evidence, and a file being present is not host discovery.
- Lanes: BUILD-03 observes the host and installs only into the disposable workspace; BUILD-02 owns source, shared records, package identity, and scheduling. Source-dependent work uses `WINDOW REQUEST <id>` / `PAUSED <id>` / `RELEASED <id>`.
- Failed host evidence is kept after any fix. A host defect is reproduced by BUILD-03, classified and repaired by BUILD-02 in the smallest lane, regression-tested offline, the package regenerated, and only the affected scenario repeated.
- Owner-only stops: entitlement unavailable; a selector, tier, or model decision; any fallback; anything destructive or outside S6 scope. Entitlement unavailable at live execution is recorded as `COPILOT_VALIDATION_BLOCKED_BY_ENTITLEMENT` and stops live S6. A successful host run is never simulated.
- Unchanged boundaries: Jira and Bitbucket deferred; no employer repository; no PR publication; no installation into this repository or a real workspace; profile fixed; no model comparison.

## 3. Execution plan and evidence inventory

The owner runs the live steps from one document, [s6-owner-script.md](s6-owner-script.md) (BUILD-03). It gives, for every stage, what to click or type, what is expected and on what basis, what to save, what counts as PASS, BLOCKED, or FAIL, and whether files change. This section is the integrator's view of the same plan.

### 3.1 Live steps

| Step | Script stage | Scope | Pass condition | Status |
|---|---|---|---|---|
| P0 | 0 | Rebuild the disposable folder and recompute the source and package identities on the machine used. Only when `C:\rstack-sdlc-smoke\` is absent there | Every identity equal to the `READY_FOR_S6` values in section 3.3; `verify` is `CLEAN`. A mismatch stops the run before any host step and is kept as portability evidence | Not needed on the build machine, where the folder is prepared (3.3) and its identity is rechecked at G0 and I1. NOT RUN elsewhere: reproducibility on another machine or checkout is not demonstrated |
| G0 | 1 | Live host gate: VS Code version; loaded Copilot / Copilot Chat version; GitHub sign-in state; entitlement; Session Target; Node version; package identity; workspace identity and category; inherited user or parent customizations | Chat answers; Node 24; manifest hash is the section 1 identity; workspace outside every repository; inherited items listed | NOT RUN on this subject. First live step. The rows in section 5 are history from `6e9bd18`, items 3–5 `UNVERIFIED` there |
| I1 | 2, steps 1–2 | Installation check on the live machine: `verify`, and plan/install only if not installed | `CLEAN`, package `PRESENT` | Prepared `OFFLINE` (3.3). Live `verify` NOT RUN |
| D1 | 2, steps 3–6 | Discovery: Coordinator, the five named role agents, both Skills, inherited items, the Coordinator's tools | Every item labelled from the live diagnostics view, not from files | NOT RUN |
| M1 | 3 | Model observation under the baseline policy (section 4): the model the Coordinator chat has selected, kept as found, with its exact label; per role the selectable model, the effective model and effort where exposed, tier restrictions, dispatchability, and whether an explicit setting is ignored, rejected, or applied | The label and each role's line recorded, `UNVERIFIED` where nothing is shown. A missing intended model is an observation, not a blocker. A real host refusal (tier, policy, entitlement, or unsupported dispatch) stops that path for the owner | NOT RUN |
| R1 | 4 | Real role dispatch, run W from request to audit: `next`, the exact envelope, the named role, the role's `result.json`, `submit` unchanged; fresh context, Skill discovery, inherited conversation, transport fidelity, engine acceptance | Four results `ACCEPTED`, each by the named role from its own attempt directory; the Coordinator stops at the wait unprompted | NOT RUN |
| H1 | 5 | Human checkpoint on run W: the first audit waits even when clean; brief shows Intent, criteria, exclusions; allowed actions and expected version visible; pause, close, reopen, resume of the same run; second audit only on request; no third; decision provenance; a label from a file | All confirmed on the Coordinator path | NOT RUN |
| W1 | 6 | Complete synthetic workflow on run W: proof, implementation, verification, independent review, local proposal | `PR_PROPOSAL_READY`, or a named blocker recorded as the result. Nothing published | NOT RUN |
| F1 | 7 | Refusal and recovery on a second short run F: open attempt (`PENDING_IN_FLIGHT`); malformed result; no automatic abandon; abandon-and-retry of the exact attempt; stale result refused without touching the newer attempt; bare abandon dispatches nothing; attempt limit | All confirmed on the Coordinator path | NOT RUN |
| N1 | within 1–3, 5.4, 5.5, 7 | Critical negatives: malformed result, stale result, a human action that is not allowed, an inline label that must come from a file, a real host refusal (tier, policy, entitlement, or unsupported dispatch), package drift or discovery mismatch | Each refused or reported as designed | NOT RUN |
| E1 | 8 | Evidence collection and host-defect handover | Evidence folder complete; `verify` still `CLEAN` | NOT RUN |

Order: G0 gates everything. I1 and D1 gate M1. M1 gates R1 through F1 only where the host really refuses a path (tier, policy, entitlement, or unsupported dispatch); a missing intended model gates nothing. The complete workflow (W1) runs before refusal and recovery (F1): `proceed` flows straight into the proof in the same chat, and the environment rule makes an interruption there unsafe. Refusal and recovery uses its own run so that it cannot consume run W's attempt budget. Role answers are not precomputed anywhere in the script or these records.

### 3.2 Evidence inventory

Evidence folder: `C:\rstack-sdlc-smoke\evidence\`, flat, outside the workspace. Run records: `C:\rstack-sdlc-smoke\workspace\.rstack\runs\<run-id>\`, written by the engine and the roles, copied whole at stage 8 to `evidence\rstack-records\runs\<run-id>\`. Paths in the right-hand column that begin with a run folder name are relative to a run directory.

| Evidence | Name and location | Label when produced |
|---|---|---|
| Host and version observation | `notes.md` (stage 1 items 1–2, re-read at stage 8); `g0-about.png`; `g0-terminal.png` (Node version, manifest hash) | `OWNER-OBSERVED` |
| Sign-in, entitlement, Session Target | `g0-chat.png`; `notes.md` | `OWNER-OBSERVED`. If refused: `COPILOT_VALIDATION_BLOCKED_BY_ENTITLEMENT` in `notes.md` |
| Workspace category and inherited customizations | `notes.md` (stage 1 items 8–9) | `OWNER-OBSERVED` |
| Installed package identity | Live: `i1-verify.txt`, `i1-verify-after.txt`, and `installed\` (copy of `workspace\.github`). Prepared: `offline-plan.json`, `offline-install.json`, `offline-verify.json`. After a rebuild: `rebuild-plan.json`, `rebuild-install.json`, `rebuild-verify.json` | Live replies `OWNER-OBSERVED`; `offline-*` are `OFFLINE`. File presence is not discovery |
| Diagnostics and discovery | `d1-picker.png`; `d1-diagnostics.png` or `d1-diagnostics.txt`; `d1-coordinator-tools.png` | `OWNER-OBSERVED` |
| Model and profile | `m1-model-picker.png`; in `notes.md` the exact label of the model selected in each Coordinator chat, and one line per role | `OWNER-OBSERVED`; what the host does not show stays `UNVERIFIED` |
| Chat exports | `r1-chat-export.json`; `h1-chat-export-before-close.json`; `h1-chat-export.json`; `w1-chat-export.json`; `f1-chat-export.json` | `OWNER-OBSERVED` |
| Run directory | `rstack-records\runs\<run-id>\` for run W and run F: `journal.jsonl`, `state.json`, `artifacts\`, `work\`, `brief\`, `exec\`, `rejected\`, `proposal\` | Records of a live run, collected by the owner: `OWNER-OBSERVED` |
| Task envelopes | The `directive.pending` JSON each `next` prints (chat exports); `task_dispatched` events in `journal.jsonl` (attempt, role, inputs, input digest); `r1-dispatch-<attempt-id>.png` showing what the subagent received | `OWNER-OBSERVED`. Whether a subagent received only the envelope is `UNVERIFIED` unless the host shows it |
| Role results | `work\<attempt-id>\result.json` and the files it names; `result_accepted` events (`result_ref`, `result_digest`) with the retained bytes under `artifacts\<sha256>`; refused ones under `rejected\<hash>.<CODE>.json` | `OWNER-OBSERVED` |
| Brief | `brief\round-1.html`, `brief\round-2.html`; `brief_rendered` events; `h1-wait.png`, `h1-brief-round-1.png`, `h1-brief-round-2.png` | `OWNER-OBSERVED` |
| Human decision record | `decision_recorded` events (decision id, action, subjects, `recorded_by`, provenance) with the retained decision under `artifacts\`; refused decisions under `rejected\`; the owner's text files in `C:\rstack-sdlc-smoke\human\` | `OWNER-OBSERVED` |
| Proof | `work\proof-1\proof.json` and the controlled tests in that attempt's application copy; the engine's own baseline run `exec\proof-1-baseline\`; subjects `proof`, `proof_tree`, `proof_baseline` in `status` | `OWNER-OBSERVED` |
| Candidate | Subject `candidate` (a measured tree retained under `artifacts\`); the developer's copy `work\implement-<n>\app\` | `OWNER-OBSERVED` |
| Verification | `verification_recorded` events (outcome, candidate); the engine's run `exec\verify-<n>\` | `OWNER-OBSERVED` |
| Review | `work\review-1\review.json`; its `result_accepted` event | `OWNER-OBSERVED` |
| Local PR proposal | `proposal\pr-proposal.json`; `proposal_recorded` event; `w1-status.txt`; `w1-done.png` | `OWNER-OBSERVED`. `PR_PROPOSAL_READY` is not `PR_CREATED` |
| Refusal and recovery | Run F: `rejected\*.MALFORMED_RESULT.json`, `rejected\*.STALE_ATTEMPT.json`, the failure events in `journal.jsonl`; `f1-chat-export.json`; `f1-status.txt` | `OWNER-OBSERVED` |
| Engine status at stage ends | `r1-status.txt` (run W at the first wait), `w1-status.txt` (run W at the end), `f1-status.txt` (run F at the end) | `OWNER-OBSERVED` |
| Usability of file-based human text | `notes.md`, one line per text file saved | `OWNER-OBSERVED` |

Handover: when the owner reports the folder ready, BUILD-03 lists every file by path and SHA-256 and sends the list to BUILD-02, who records its digest here. Failed and blocked evidence is kept permanently, also after a repair.

### 3.3 Offline preparation completed on 2026-10-04

Everything in this subsection is `OFFLINE`. None of it shows that VS Code discovers, loads, or obeys an installed file.

**Disposable folder.** `C:\rstack-sdlc-smoke\` on the build machine. `C:\` is not a git repository and has no `.github`; the folder is outside the source repository, is not an employer repository, and holds only synthetic files.

| Path | Content | Identity |
|---|---|---|
| `package\` | Byte copy of the package generated from `07de93a`; never edited; must stay at this path | 33 files; manifest SHA-256 `1f5eaef83d2309b7daddaec978fe147128d06cbe5b35a4efb8e4f1513e6208fa`; every listed file matches the manifest; no unlisted file |
| `app\` | Byte copy of `tests/fixtures/sample-app` | `package.json` `6897c255ede0da7ce1db4f2d36880ff8f32457907d5012c12664939a5f51497d`; `rstack.app.json` `fe210841a1dc9abe9b5069b60ad3a76da67448e79ae40c8e9e60ecf88923a89e`; `src/export.js` `081374821931e5b04511d1a0a3aa06c588aa3d94285a251919a8e71cccbd6b24`; `tests/existing.test.js` `2f21ee236b8e504c475f3f33e784026ec9832b4693e04aaf8549b86228be1867` |
| `requests\REQ-001.md` | Byte copy of `tests/fixtures/requests/REQ-001.md`; request id `REQ-001` | `e33cd9b9f7b3670b37a0e6d2373a6640c4c9ffd0c58dda0d97ac3c72ed4f36c3` |
| `workspace\` | The only folder opened in VS Code. Holds the installed files under `.github\` and nothing else. No `.rstack\`: no run exists | See the installed files below |
| `human\` | Empty. The owner saves the text files there during the live run | — |
| `evidence\` | Three offline replies; otherwise empty | `offline-plan.json` `c030e9ac5ea0848e3d534e20917e6b27ad28f458061b44d9240014a31eea3a99`; `offline-install.json` `5e29ff46286a3ed38b1c033af832a9f93fa955f883fb8e2415478b60311de741`; `offline-verify.json` `f7fd729e748a31fae072ddf7eed4ab414ff4b4c30a39cd477441095c8444ef70` |

The application and the request sit beside the workspace, not inside it: role agents have editing tools in the workspace, and the application is only ever read and measured. The package sits outside the workspace because the installer refuses a workspace that contains it.

**Package.** `npm run generate:package` twice at the checkpoint, Node v24.21.0: both trees and both command outputs byte-identical to each other and to the package the reviewer verified. Model keys: `OMITTED` for all six agents. The copy under `package\` was compared with `dist/copilot-vscode/` and is identical.

**Installation** (BUILD-03, filesystem only, with the package copy's own installer). `plan`: `PLAN_READY`, eight `CREATE`. `install --apply`: `INSTALLED`. `verify`: `CLEAN`, package `PRESENT`. BUILD-02 ran `verify` again independently: `CLEAN`, and recomputed the hashes below. Engine command written into the Coordinator: `node "C:/rstack-sdlc-smoke/package/runtime/scripts/rstack.ts"`. Created directories: `.github`, `.github/agents`, `.github/skills`, and the two Skill directories.

| Installed file under `workspace\.github\` | SHA-256 |
|---|---|
| `agents\rstack-sdlc-coordinator.agent.md` | `1368e55c63ae2fc3fdbc56b2cb73db6d2ab6d080cb34f5542ef3bcd19a4fdddb` |
| `agents\rstack-sdlc-developer.agent.md` | `7659e4d1d4f8b8fc85337036fe075a6193fbce002812fc47c22f9178d23c3635` |
| `agents\rstack-sdlc-plan-auditor.agent.md` | `6b966f9df4cdc2fdb405f086efa78bbe1b2768e34096fa7afc58fad29c5a4bfa` |
| `agents\rstack-sdlc-planner.agent.md` | `252102fde9efb60e5f5775a9082181175033d10bd653401e43a2a5315bf28d9a` |
| `agents\rstack-sdlc-reviewer.agent.md` | `2653850bfc8a813f761ba8a6a5bc9f546ae27d94e6d8fd8cf28df282663444f9` |
| `agents\rstack-sdlc-tester.agent.md` | `43f035dd05d8b6f23ae283da2b0efc7889818cd9bc3c24d7dd165fa8a6755053` |
| `skills\rstack-sdlc-application-records\SKILL.md` | `8617520ccbf744d386d13f84ef90506930e2bb54aac76e759aa0a779faec0f37` |
| `skills\rstack-sdlc-planning-records\SKILL.md` | `2d050e8ca4e22a0d8ecca6388a024ddbb51a6558cc3946b81fab0a82be2f0d69` |
| `rstack-sdlc-install.json` | `ac35c33d92f22b138f0e4ea324e482716f96fa0f72a2ed9a5fd67f6ebfcea7e3` |

Only the Coordinator differs from its package template: it is the one file with install placeholders. The installed Coordinator declares the tools `execute`, `read`, `agent` and the five role agents, and carries no model key.

**Installed command line.** `status` for a run id that does not exist, through the installed engine command: `RUN_NOT_FOUND`, exit 2, and nothing created under the workspace. `start` was not run there.

**Identities a run from this fixture must record.** Derived read-only with the package copy's own runtime, and seen again in the rehearsal's `run_started` event: `source` `sha256:e33cd9b9f7b3670b37a0e6d2373a6640c4c9ffd0c58dda0d97ac3c72ed4f36c3`; `base` `sha256:3685b56aa9f121166bbff92c3454171acbd69ce10a9852b3721e0a807c3c4fbe`; application configuration `sha256:fe210841a1dc9abe9b5069b60ad3a76da67448e79ae40c8e9e60ecf88923a89e`; profile `sha256:3338b15a6c54fb81dfca943a01213950a6afe40153c483d6a75f555f6ff967a8` (`trial` v1); workflow `local-request-to-proposal` v5, `sha256:6b9dc1af9e4daf2f99eb061ee902a27bdd476c78e213c12f199c65858a2f2f1a`. The script's stage 4 checks `source` and `base` in the first `status` reply.

**Rehearsal of the expected engine replies.** BUILD-02 ran the commands the script expects through the package copy's command line, in a throwaway directory outside `C:\rstack-sdlc-smoke\`. Its run directories are not kept; the reply summary is retained as builder evidence in `.rstack/s6-prep/rehearsal.json` (ignored). Where a role result was needed, it came from the repository's existing simulated test transport; no role answer was written into the script or these records. Every reply matched the script:

- Recovery run, started as the live run will be: `STARTED`; `DISPATCHED` / `GRANTED` `intent-1`; a second `next` gives `PENDING_IN_FLIGHT` / `IN_FLIGHT`; a non-JSON file gives `MALFORMED_RESULT` with `rejected/<hash>.MALFORMED_RESULT.json` and the attempt still pending; `abandon` of `intent-1` with a reason file gives `FAILURE_RECORDED`; `next` dispatches `intent-2`; the abandoned attempt's result gives `STALE_ATTEMPT` (`attempt_status: FAILED`) and `intent-2` stays pending; a bare `abandon` of `intent-2` gives `FAILURE_RECORDED` with `BLOCKED` / `ATTEMPTS_EXHAUSTED`; `next` then gives `NO_WORK` with the same blocker.
- Full run with simulated role results: attempts `intent-1`, `spec-1`, `plan-1`, `plan-audit-1`, then `BRIEF_READY` with a `WAIT` for `PLAN_DECISION`, actions `proceed, amend, second-audit, pause, reject`, file `brief/round-1.html`; a further `next` gives `NO_WORK` with the same wait. `pause` gives `DECISION_RECORDED`, `paused: true`, version plus one; `resume` gives `RESUMED` on the same run. `second-audit` dispatches `plan-revision-1` and `plan-audit-2`, then round 2 without `second-audit` among the actions and with an "Earlier round" heading in `brief/round-2.html`. A second `second-audit` gives `ACTION_NOT_ALLOWED`. An inline label with brackets gives `INLINE_TEXT_REFUSED`; the same label from a file gives `DECISION_RECORDED`. Then `proof-1`, `implement-1`, `VERIFICATION_PASSED`, `review-1`, `PROPOSAL_READY` with `DONE` / `PR_PROPOSAL_READY`, `publication_status: NOT_ATTEMPTED`, `candidate_verification: PASSED_LOCAL_EXECUTION`, authorization by the last decision with `HUMAN_RECORDED`, and `proposal/pr-proposal.json` present.

This shows that the script's expected replies are what the engine gives. It says nothing about Copilot.

**Rebuild on another machine (script stage 0): not demonstrated.** Checked on the build machine only, without making a clone: the 40 files the package and the fixture are made from are byte-identical between the committed blobs and this working tree and contain no CR; on this machine `Copy-Item -Recurse` reproduced the package (33 files, manifest hash equal) and the application. From that it is expected, not shown, that a checkout with line-ending conversion off gives the same bytes, and that installed files have the hashes above wherever the paths are the same. No second checkout and no second machine has been used, so reproducibility across machines or checkouts has not been demonstrated and is not claimed. The test is stage 0 itself: it recomputes the source and package identities on the machine used for the live run; the run proceeds only if they match the `READY_FOR_S6` identities in this section; a mismatch stops the run before any host step and is kept as portability evidence. The known line-ending cause is finding S6-P1, classified `FUTURE_HARDENING / PORTABILITY` (section 4).

**Jira and Bitbucket.** Nothing prepared here needs either. The package ships no Jira or Bitbucket adapter; the script starts runs with the local request source and the local proposal sink.

**Builder evidence for this subsection.** `.rstack/s6-prep/` (ignored): the generation outputs and tree listings, the package copy check, the derived identities, the line-ending probe with both manifests, the blob comparisons, the rehearsal summary, the scripts used, and `identities.txt` listing each file's SHA-256. BUILD-03's three replies are in `C:\rstack-sdlc-smoke\evidence\`.

### 3.4 First live action

When the owner has VS Code with GitHub Copilot available: open [s6-owner-script.md](s6-owner-script.md). If `C:\rstack-sdlc-smoke\` does not exist on that machine, do stage 0. Otherwise the first action is stage 1, step 1: in VS Code, `Help → About`, and copy the text into `C:\rstack-sdlc-smoke\evidence\notes.md`. Stage 1 step 4 is the entitlement check that decides whether live S6 continues.

## 4. Decisions and known points entering S6

Decided by the owner on 2026-10-04, after the offline preparation was accepted. Both points were listed here as open before that. They are closed.

- **Baseline model policy: observe the actual host model; no selector change.** No host or model selector is added before the first live run, and the `READY_FOR_S6` profile stays unchanged. The baseline run uses whatever model the Coordinator chat actually has selected; the owner keeps it and records its exact host-visible label. Also recorded: the effective model of each role's subagent where the host exposes it, the model picker's behavior, effort or reasoning reporting, cost-tier restrictions, and whether the Coordinator chat's model selection overrides role behavior. Background: the profile carries no host selector, so the installed agents carry no model key, and by the documentation a subagent without one runs on the model of the chat that invoked it (`DOC-EXPECTED`); the profile's intended pairing (planner and reviewer Opus 5.5, auditor Sol 6.1, the others Sonnet 5) is therefore not expected to be in effect. A missing intended Opus, Sol, or Sonnet model is an observation, not a blocker, and the intended pairing is not silently forced. A real host refusal caused by tier, policy, entitlement, or unsupported dispatch does block that path, and the decision returns to the owner. The profile is not modified and no fallback selector is introduced during baseline S6. Routing by model is a separate experiment after a successful baseline run.
- **Line endings and package identity (finding S6-P1, `OFFLINE`): classified `FUTURE_HARDENING / PORTABILITY`.** No source repair is made before baseline S6; the `READY_FOR_S6` checkpoint and package stay unchanged. The finding: the generation command passes the profile file through as read, while every other source is read with line endings normalized. With `profiles/trial-v1.json` in CRLF, as a checkout with `core.autocrlf=true` makes it, the manifest is `4d1fae92e1018e077a3fb00884458dd9fcecfb46e47b23a675840729edc8c6b1`, not the verified `1f5eaef8…08fa`; two files differ, the profile copy and the manifest (probed offline). The fixture's `source` and `base` identities are expected to differ the same way; that was not probed. It is a portability limit of the build step, not a host defect. The gate is the identity check in the script's stage 0: it recomputes the source and package identities on the machine used for the live run, and the run proceeds only if they match the expected `READY_FOR_S6` identities. A mismatch stops the run before host testing, is reported as a concrete portability failure, and is kept as portability evidence. Reproducibility across machines and checkouts has not yet been demonstrated and is not claimed. A later repair (normalizing the profile text in `scripts/generate-package.ts`, or pinning line endings with a `.gitattributes` file) would change the reviewed subject and needs the owner's authorization and an independent check.

Still the owner's choice at the time of the live run:

- **Machine and checkout.** The folder is prepared on the build machine. If the live run happens on another machine, the owner decides which machine and which checkout, and stage 0 of the script rebuilds the folder there and checks its identities; whether that reproduces the prepared identity is what stage 0 tests. The repository is a GitHub remote; reaching it from that machine is the owner's matter. Nothing is installed into a workplace or project repository.

Carried into the live run:

- **Entitlement.** The 2026-10-03 readiness note found no active Copilot licence for the account signed in on the build machine, and an earlier "subscription has ended" message was seen. That is history. It does not fail the new run; G0 rechecks live.
- **Engine command.** Resolved at installation as an absolute path into the package copy: `node "C:/rstack-sdlc-smoke/package/runtime/scripts/rstack.ts"`. The package copy must stay where it is; `verify` reports a package that moved or changed. No path in the folder contains a space. The terminal VS Code uses must resolve `node` to version 24.
- **User-scope customizations on the build machine.** `~/.claude/skills` holds one entry (`synced`); `~/.copilot` holds Copilot CLI state and no agents or Skills directory; the Claude Code, ChatGPT, and Gemini extensions are installed. Whether VS Code loads any of it into the workspace is for stage 1, step 9; a foreign item that appears is recorded, not hidden by a settings change.
- **Human text.** The Coordinator does not place the human's words on a command line and has no file-writing tool. The owner saves each text file; the script names five, with exact paths and content rules (UTF-8 without a byte-order mark, no final line break). The burden is recorded as an S6 usability observation (`TEST_DURING_S6 / FUTURE_USABILITY_HARDENING`).
- **Terminal transport.** The documented command lines were run offline through `cmd.exe`, Windows PowerShell, PowerShell 7, and Git Bash. The Copilot terminal itself is unobserved, including whether the Coordinator ever types human text inline and whether the host asks before each terminal command.
- **Environment.** A candidate is verified only in the environment its proof ran in, and `PATH` and `TEMP` are part of that identity. A run is driven from one terminal environment from proof to proposal; a changed `PATH` stops it with `PROOF_ENVIRONMENT_CHANGED`. The script puts the close-and-reopen check at the plan decision, before the proof, for that reason.
- **Displayed brief.** A decision is refused (`DISPLAYED_SUBJECT_CHANGED`) if `brief/round-N.html` is not the retained brief when the decision arrives. Nothing in the host flow may rewrite that file; the owner opens it in a browser only.
- **Not exercised by the script.** `amend`, `reject`, and a product question unless the run raises one.

## 5. Observations

**Historical and preliminary.** Everything in this section was recorded before the pause of 2026-10-04, against checkpoint `6e9bd18`. It is kept unchanged as evidence of what was seen then. It is not a passed or completed G0 gate, and no row carries over to the repaired candidate without being observed again.

### G0 — pre-S6 host gate, reported by session `rstack-sdlc-55` (acting as BUILD-03; designation not yet confirmed by the owner), 2026-10-04

| # | Item | Result | Label |
|---|---|---|---|
| 1 | VS Code version | 1.138.0, commit `7debcd0e2acdea1c52de81bf9ee1620444407dda`, x64, stable | OBSERVED (CLI) |
| 2 | Copilot | No separate Copilot extension. Built-in `copilot-chat` 0.66.0 in the install directory matching the running commit. Builds carrying 0.67.0 and 0.68.0 are staged, so a restart can change the version; re-read at every evidence capture | OBSERVED (disk); build loaded by live windows UNVERIFIED |
| 3 | Signed-in account state | Log read denied by the session's permission classifier; not pursued | UNVERIFIED |
| 4 | Copilot entitlement | Same. Not shown unavailable; unobserved | UNVERIFIED |
| 5 | Session target | No tool in either builder session reads the VS Code chat UI | UNVERIFIED |
| 6 | Disposable workspace | Not created. Proposed: a new directory under the user temp directory, outside any repository; no parent customization files found there. User scope: no prompts folder, one chat setting (`chat.viewSessions.enabled: false`), `~/.claude/skills` holds one entry (`synced`), and the Claude Code, ChatGPT, and Gemini extensions are installed | OBSERVED; user-scope inheritance POSSIBLE (DOC-EXPECTED for `~/.claude/skills`) |
| 7 | Node | v24.21.0 | OBSERVED |
| 8 | Checkpoint | HEAD `6e9bd18`, tree clean at the time of the report | OBSERVED |

**Capability limit.** Neither builder session can operate or read the VS Code Copilot chat UI. Steps D1 through N1 must be driven by the owner in VS Code. BUILD-03 prepares the workspace and scenario scripts and records exports and files the run writes. Such evidence is labelled OWNER-OBSERVED, not BUILD-03-observed.

## 6. Coordination log

| Time (UTC) | Event |
|---|---|
| 2026-10-04 | Phase A: inventory matched; checkpoint `6e9bd18` committed and pushed on the owner's authorization; remote ref verified |
| 2026-10-04 | BUILD-03 released for G0 by direct session message; reply pending |
| 2026-10-04 | G0 report received: items 1, 2, 6, 7, 8 observed; 3, 4, 5 unverified. No install, no window requested. Waiting on the owner |
| 2026-10-04 | Whole-pipeline release-candidate audit of `6e9bd18` returned `CHANGES_REQUESTED_BEFORE_S6`: RC1–RC9 reproduced offline; D1–D8 remain VERIFIED_FIXED. Report: [astra-release-candidate-audit.md](astra-release-candidate-audit.md), kept unchanged |
| 2026-10-04 | **S6 PAUSED by the owner.** A bounded RC1–RC9 repair pass was authorized; no Jira, Bitbucket, Copilot, or other live integration is contacted during it. BUILD-02 sent BUILD-03 (session `rstack-sdlc-55`) the instruction to stop all S6 host-gate activity |
| 2026-10-04 | BUILD-03 replied `S6 STOPPED`: no process of that session touches the package, no in-flight S6 edit is held, and VS Code is not interacted with. S6 stays paused for both builders |
| 2026-10-04 | RC1–RC9 repaired offline by both builders and integrated by BUILD-02: all nine `FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION` (progress record "RC1–RC9 repair pass and integration", decisions D-RC). No host, Copilot, Jira, or Bitbucket contact during the pass; nothing installed outside disposable test directories. **S6 remains PAUSED.** It resumes only when an independent verification returns `READY_FOR_S6` and the owner relays it; G0 is then repeated in full against the verified candidate |
| 2026-10-04 | Independent verification of RC1–RC9: `CHANGES_REQUESTED_BEFORE_S6`. RC1–RC6, RC8, RC9 VERIFIED_FIXED; RC7 still failing on a declared `NODE_TEST_WORKER_ID` ([astra-rc1-rc9-verification.md](astra-rc1-rc9-verification.md), kept unchanged). On the owner's authorization BUILD-02 reserved that exact name in the executor (progress record "RC7 correction follow-up"); RC7 is `FIXED_BY_BUILDER / AWAITING_INDEPENDENT_VERIFICATION`. The generated package changed again with it. No host, Copilot, Jira, or Bitbucket contact. **S6 remains PAUSED** |
| 2026-10-04 | (Before the pause.) BUILD-03 drafted the owner-driven scenario script outside the repository (not run). Proposed negatives need no hand-edited result: malformed = the Coordinator is told to submit a non-JSON file (`MALFORMED_RESULT` expected, attempt stays pending); open attempt = the owner cancels a turn while a role runs (`PENDING_IN_FLIGHT` expected); stale = the abandoned attempt's result is submitted after abandon-and-retry (`STALE_ATTEMPT` expected). All are source-read expectations at `6e9bd18`, not observations. Hand-altering a result file is not planned |
| 2026-10-04 | Astra's focused verification of the RC7 correction: `RC7: VERIFIED_FIXED`, overall `READY_FOR_S6` ([astra-rc7-followup-verification.md](astra-rc7-followup-verification.md), kept unchanged). D1–D8 and RC1–RC9 are all VERIFIED_FIXED. The owner relayed Astra's inventory-ordering erratum: true ordinal and case-insensitive ordering give different digests, all 111 files match, the verdict stands, and the reviewer changed no file |
| 2026-10-04 | **Owner decision: S6 STARTED.** Offline implementation complete; `READY_FOR_S6`; S6 started; live host execution pending owner access; `COPILOT_VALIDATED` = NO. Jira and Bitbucket deferred and not required. Earlier rows of this log that say PAUSED record the state at their time; S6 is not paused now |
| 2026-10-04 | BUILD-02 recomputed the inventory (111 of 111, ordinal digest `db2b1387…b179`), committed the exact candidate as `07de93a49b4ec62ada46f0a55d2430ac208a4b53` (parent `6e9bd18`), and pushed it on the owner's authorization; origin verified. The package was then generated twice from the checkpoint: manifest `1f5eaef8…08fa`, byte-identical to the verified package |
| 2026-10-04 | Roles for S6 set by the owner: BUILD-02 integrator, BUILD-03 (session `rstack-sdlc-55`) host/pilot preparation owner. BUILD-03 acknowledged by direct session message. Offline preparation began. No Copilot, Jira, or Bitbucket contact |
| 2026-10-04 | Records-only commit `12210de962727f3da15583f26a4e31a29343b4b7` (status: `READY_FOR_S6`, S6 started, live host pending) pushed; origin verified. Source unchanged since `07de93a` |
| 2026-10-04 | BUILD-02 created `C:\rstack-sdlc-smoke\` with `package\` (byte copy of the generated package, manifest `1f5eaef8…08fa`), `app\`, and `requests\REQ-001.md`, and sent `S6 LAYOUT` to BUILD-03 with window `S6-INSTALL` |
| 2026-10-04 | BUILD-03, window `S6-INSTALL`: created `workspace\`, `human\`, `evidence\`; `plan` `PLAN_READY`, `install --apply` `INSTALLED`, `verify` `CLEAN`; engine probe `RUN_NOT_FOUND`, nothing created; no `start`. `RELEASED S6-INSTALL`. BUILD-02 re-ran `verify` (`CLEAN`) and recomputed the nine installed hashes. All `OFFLINE` |
| 2026-10-04 | BUILD-03 delivered [s6-owner-script.md](s6-owner-script.md): stages 0–8, with a rebuild stage for another machine. BUILD-02 rehearsed the expected engine replies offline in a throwaway directory; all matched. Finding S6-P1 (package identity depends on the profile's line endings) recorded in section 4; no source change |
| 2026-10-04 | **Offline preparation complete. S6 IN PROGRESS — LIVE HOST EXECUTION PENDING ACCESS.** Both builders stop at the first live-host step (script stage 1). No Copilot, Jira, or Bitbucket contact was made |
| 2026-10-04 | **Owner accepted the offline preparation** and the records push `b45a690`, and decided: baseline model policy = observe the actual host model, no selector change, profile unchanged; finding S6-P1 = `FUTURE_HARDENING / PORTABILITY`, no source repair before baseline, the script's stage 0 identity check remains the gate; status unchanged; live resume point = script stage 1 (G0), every item established fresh. Relayed to BUILD-03 by direct session message |
| 2026-10-04 | Docs-only correction authorized by the owner and made by BUILD-02 alone: [s6-owner-script.md](s6-owner-script.md) stages 0, 2, 3, and 4 reworded to the baseline model policy and to what is actually known about reproducibility; sections 3.1, 3.2, 3.3, and 4 here and the progress and decision records updated to close the two open decisions. No source, test, profile, or package file changed; manifest still `1f5eaef8…08fa`; section 5 unchanged. BUILD-03 acknowledged and remains stopped. **S6 IN PROGRESS — LIVE HOST EXECUTION PENDING ACCESS.** `COPILOT_VALIDATED` = NO |
