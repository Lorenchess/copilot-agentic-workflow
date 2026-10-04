# RSTACK SDLC — S6 live VS Code Copilot validation

**Status: PAUSED (owner instruction, 2026-10-04).** Reason: RC1–RC9 release-candidate audit blockers ([audit](astra-release-candidate-audit.md), verdict `CHANGES_REQUESTED_BEFORE_S6`). `COPILOT_VALIDATED`: NO. No live-host or Copilot work is performed until RC1–RC9 are independently verified and the owner relays Astra's `READY_FOR_S6`. The pre-S6 host gate (G0) was not passed. The G0 rows in section 5 are historical preliminary observations made before the pause; they are not a completed S6 gate. Nothing below is observed until its row says `OBSERVED`.

**Integrator:** BUILD-02. **Host validator:** BUILD-03. **Final acceptance:** a fresh independent Astra session.

## 1. Subject

| Item | Value |
|---|---|
| Checkpoint S6 was started from | `6e9bd18a8abe21732f16a063ae1bf71b73dd8f1a` on `feat/rstack-sdlc-local-build`, pushed and verified on origin 2026-10-04. No longer the S6 subject: the audit of 2026-10-04 requests changes to it. The subject on resumption is the repaired candidate, once independently verified |
| Parent (Astra-reviewed HEAD) | `60c2ba96586ca183cd338512b50e0d214a7a9b08` |
| Approved 98-file source inventory SHA-256 | `b084ac0d99b71bbd0678816b3ae943f8a279ce1165b31a8bb54bd14e0486ad47`, recomputed and matched immediately before the commit |
| Offline verdict | Earlier: APPROVE OFFLINE REPAIRED CANDIDATE; D1–D8 VERIFIED_FIXED ([combined record](astra-combined-r2c2-r3-r4-verification.md)). Later whole-pipeline audit, 2026-10-04: `CHANGES_REQUESTED_BEFORE_S6`, nine reproduced offline blockers RC1–RC9; D1–D8 remain VERIFIED_FIXED ([audit](astra-release-candidate-audit.md)) |
| Profile | `profiles/trial-v1.json`, unchanged; all `host_selector` values are `null` (`requires-host-observation`) |
| Generated package identity | pending (window `S6-PKG`) |

## 2. Rules

- Labels: `OBSERVED` (seen on the live host in S6), `DOC-EXPECTED` (documentation only), `UNVERIFIED`. Offline or simulated evidence is never listed as host evidence.
- Lanes: BUILD-03 observes the host and installs only into the disposable workspace; BUILD-02 owns source, shared records, package identity, and scheduling. Source-dependent work uses `WINDOW REQUEST <id>` / `PAUSED <id>` / `RELEASED <id>`.
- Failed host evidence is kept after any fix. A host defect is reproduced by BUILD-03, classified and repaired by BUILD-02 in the smallest lane, regression-tested offline, the package regenerated, and only the affected scenario repeated.
- Owner-only stops: entitlement unavailable; a selector, tier, or model decision; any fallback; anything destructive or outside S6 scope.
- Unchanged boundaries: Jira and Bitbucket deferred; no employer repository; no PR publication; no installation into this repository or a real workspace; profile fixed; no model comparison.

## 3. Execution plan and evidence inventory

Evidence for each step: host versions, Session Target value, a "Chat: Export Chat..." JSON, the engine's run records in the disposable workspace, and a Diagnostics capture where named. Evidence files are listed here by path and SHA-256 when BUILD-03 hands them over.

| Step | Scope | Pass condition | Status | Evidence |
|---|---|---|---|---|
| G0 | Pre-S6 host gate: VS Code and Copilot versions, sign-in state, entitlement, session target, workspace category, inheritance exposure, Node version, checkpoint SHA | Entitlement active; target identified; checkpoint is the independently verified repaired candidate (was `6e9bd18` before the pause) | NOT PASSED; PAUSED. Preliminary observations only, items 3–5 UNVERIFIED; the gate is repeated in full on resumption | section 5 |
| I1 | Installation: dry run, install, owned files, manifest identity, verify | Installed bytes equal the generated package; nothing outside the workspace written | PENDING | — |
| D1 | Discovery: Coordinator, the five named role agents, both Skills, inherited agents or Skills, tools available, unavailable tools ignored or enforced | Every item labelled from the live Diagnostics view, not from files | PENDING | — |
| M1 | Model and profile: selectable and effective model per role, effort where exposed, tier restrictions, explicit selection, Coordinator-to-role dispatch | Each role's behavior recorded; a refused pair stops that path for the owner | PENDING | — |
| R1 | Real role dispatch: engine call, real envelope, exactly the named role, no added summaries, actual result returned and submitted unrewritten; fresh context, Skill received, history leak, `result.json` byte fidelity | Each claim backed by an observation or left `UNVERIFIED` | PENDING | — |
| H1 | Human checkpoint: brief, allowed actions, expected version, Intent, criteria, exclusions; clean first audit waits; no automatic second audit; second only on request; no third; decision provenance; resume of the same run; close and reopen if safe | All confirmed on the Coordinator path | PENDING | — |
| F1 | Refusal and recovery: refusal reported; status names the pending attempt; no automatic abandon; explicit human authorization; bare abandon starts no replacement; abandon-and-retry uses the exact attempt; stale result does not abandon a newer attempt; attempt limits hold | All confirmed on the Coordinator path | PENDING | — |
| W1 | Complete synthetic workflow from request to local PR proposal | `PR_PROPOSAL_READY` or a named blocker | PENDING | — |
| N1 | Critical negatives: malformed result, stale result, invalid human action, unresolved selector or tier incompatibility, package drift or discovery mismatch | Each refused or reported as designed | PENDING | — |

Order: G0 gates everything. I1 and D1 gate M1. M1 gates R1 through N1 for any role whose model pair is refused.

## 4. Known open points entering S6

- **Entitlement.** The 2026-10-03 readiness note found no active Copilot licence for the account signed in on this machine. Not re-verified by BUILD-02. G0 decides it.
- **Selectors.** The profile carries no host selector. Recording an observed selector changes the generated package and is a profile change; it needs the owner's word before it is made.
- **Engine command.** The default engine command is relative to this repository. Installation outside it needs an explicit engine command, and this machine's absolute paths contain a space.
- **Workspace.** The disposable workspace must sit outside every repository so that this repository's `.github/` agents and Skills are not inherited.

Added by the RC1–RC9 repairs (decisions D-RC). None of this is observed on the host, and none of it is to be tried before `READY_FOR_S6`:

- **Human text.** The coordinator no longer places the human's words on a command line. An answer and an abandon reason come from a file the human saves; who said it is a plain label or a file. Scenarios H1 and F1 need those files prepared, and the scenario script drafted before the pause no longer matches the coordinator text. The owner accepted this usability cost for independent verification and classified it `TEST_DURING_S6 / FUTURE_USABILITY_HARDENING`; the Coordinator's tools are not broadened before RC9 is verified.
- **Terminal transport.** The documented command lines were run offline through `cmd.exe`, Windows PowerShell, PowerShell 7, and Git Bash. The Copilot terminal itself is unobserved, including whether the coordinator ever types human text inline.
- **Environment.** A candidate is verified only in the environment its proof ran in, and `PATH` and `TEMP` are part of that identity. A run must be driven from one terminal environment from proof to proposal; a changed `PATH` stops it with `PROOF_ENVIRONMENT_CHANGED`.
- **Displayed brief.** A decision is refused (`DISPLAYED_SUBJECT_CHANGED`) if `brief/round-N.html` is not the retained brief when the decision arrives. Nothing in the host flow may rewrite that file.
- **Package identity.** The generated package changed with the repairs. The package for S6 is generated from the independently verified candidate, not from `6e9bd18`.

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
