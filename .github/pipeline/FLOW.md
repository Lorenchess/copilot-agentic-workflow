# Pipeline Flow

This document is the normative description of the reference pipeline's flow: stages, agents, artifacts, human gates, conditional STOPs, bounded loops, and resume behavior. It is a reusable reference asset — it describes agent *behavior*, not runtime machinery. There is no state machine, no scheduler, and no code here; `AGENT-CONTRACTS.md` gives the per-agent detail this file only summarizes, and `GUARDRAILS.md` gives the safety rules this file points to.

## Flow diagram

```text
Entry (/pipeline KEY1[, KEY2, ...])
   |
   v
Intake ---------------------------> INTAKE.md              [G1 repositories] [G2 branch + context]
   |
   v
Workspace (prepare branch) -------> WORKSPACE.md
   |
   v
Plan <----------------------+ ----> PLAN.md
   |                        |
   v                        | (REVISE, <=2 rounds)
Adversary -------------------+----> ADVERSARY-REVIEW.md     [G3 plan approval]
   |  (APPROVE)
   v
Test RED --------------------------> TEST-CONTRACT.md, RED-REPORT.md
   |
   v
Develop GREEN <--------------+----> IMPLEMENTATION.md
   |                         |
   v                         | (FAIL, <=2 rounds)
Verify -----------------------+---> VERIFICATION.md
   |  (PASS)
   v
PR draft ---------------------------> PR-DESCRIPTION.md
   |
   v
 [G4 publish + PR approval]
   |
   v
Publish (Workspace agent) ----------> WORKSPACE.md (Publish section)
   |
   v
PR (pr agent) -----------------------> PR.md
```

## Stages

| # | Stage | Agent | Reads | Writes | Gate or STOP |
|---|---|---|---|---|---|
| 0 | Entry | skill + pipeline | `/pipeline KEYS` | RUN.md | Invalid key -> STOP. Existing run -> propose resume, developer confirms. |
| 1 | Intake | intake | Jira, workspace listing, README heads | INTAKE.md | G1 repositories; G2 branch + context |
| 2 | Workspace | workspace | RUN.md | WORKSPACE.md | Per repo: dirty / existing branch / diverged / default ahead of origin / unreachable / unknown default -> STOP |
| 3 | Plan | planner | INTAKE.md, RUN.md, code | PLAN.md | none |
| 4 | Adversary | adversary | PLAN.md, INTAKE.md, RUN.md, code | ADVERSARY-REVIEW.md | REVISE -> planner once more; 2nd REVISE or BLOCK -> developer decides; G3 plan approval |
| 5 | Test (RED) | tester | PLAN.md | test files (committed), TEST-CONTRACT.md (classification, execution envelope), RED-REPORT.md | WITNESS not RED after bounded correction -> `TESTS_NOT_RED`; no testable boundary without scaffolding -> `TEST_BOUNDARY_MISSING`; meaningful execution unobtainable -> `RUNNER_UNAVAILABLE` |
| 6 | Develop (GREEN) | developer | PLAN.md, TEST-CONTRACT.md, RED-REPORT.md | code (committed), IMPLEMENTATION.md (Envelope changes listed and justified) | Test-change request -> STOP for developer decision; meaningful execution unobtainable -> `RUNNER_UNAVAILABLE` |
| 7 | Verify | verifier | WORKSPACE.md, PLAN.md, ADVERSARY-REVIEW.md, TEST-CONTRACT.md, RED-REPORT.md, IMPLEMENTATION.md, repos | VERIFICATION.md (contract run, full-suite run, execution envelope check, immutability at the active anchor, changed-path inventory) | Checkout not clean or HEAD drifted during execution -> FAIL; FAIL -> developer fixes, <=2 rounds, then STOP; meaningful execution unobtainable -> `RUNNER_UNAVAILABLE` |
| 8 | PR draft | pr | PLAN.md, VERIFICATION.md, INTAKE.md | PR-DESCRIPTION.md | G4 publish + PR approval |
| 9 | Publish | workspace | RUN.md, VERIFICATION.md, WORKSPACE.md | WORKSPACE.md (Publish section) | G4_NOT_RECORDED, REVERIFICATION_REQUIRED, G4_STALE, push failure, remote SHA mismatch |
| 10 | PR | pr | PR-DESCRIPTION.md, VERIFICATION.md, WORKSPACE.md | PR.md | No Bitbucket read capability, existing PR found, or only after PASS + G4 = PUBLISH_AND_PR + SHA equality |

### Stage narratives

**0. Entry.** The `/pipeline` skill parses the comma-separated keys (whitespace-tolerant, first key primary, duplicates deduped keeping first occurrence) and the pipeline orchestrator checks whether `.pipeline/runs/<PRIMARY>/` already holds artifacts. It must not reorder keys or start any stage agent yet. It hands forward the validated key list and, on a fresh run, an empty RUN.md; on an existing run, a resume proposal.

**1. Intake.** The intake agent reads Jira (bounded, read-only) and the workspace listing, produces an evidence-backed repository recommendation and a proposed branch name, and asks G1 and G2 through the orchestrator. It must not touch a terminal, write code, or promote a discovered (linked/parent/child/testing) Jira into scope. It hands forward INTAKE.md: the requested Jiras, context-only Jiras, repository recommendation, and proposed branch name, all provenance-tagged. The confirmed repository list, confirmed branch name, and developer context are recorded by the orchestrator in RUN.md at G1/G2.

**2. Workspace.** The workspace agent fetches each confirmed repository, fast-forwards its default branch, confirms (`git rev-list --left-right --count origin/<default>...<default>` = `0 0`) that the local default carries nothing origin doesn't have (`WORKSPACE_DEFAULT_AHEAD` otherwise), and creates the feature branch with the exact name from RUN.md in every repository. It must not reset, clean, stash, rebase, pull, or force anything, and never reports success for a repository it has not actually prepared. It hands forward WORKSPACE.md with one status per repository (PREPARED / REUSED_EXISTING / EXCLUDED / BLOCKED / FAILED), the push destination, and the baseline (`origin/<default>`) SHA.

**3. Plan.** The planner reads INTAKE.md and RUN.md and the affected repositories' code (read-only) and produces a scope, an approach per repository, acceptance criteria as Given/When/Then, risks, and open questions. It must not touch a terminal or edit code. It hands forward PLAN.md for adversarial review.

**4. Adversary.** The adversary agent reads PLAN.md and challenges it: missing acceptance criteria, untested assumptions, scope creep. It must not edit the plan or touch code; it can only render a verdict. It hands forward ADVERSARY-REVIEW.md with a verdict (APPROVE / REVISE / BLOCK) and, on APPROVE, triggers G3 so the developer sees the approved plan before testing begins.

**5. Test (RED).** The tester writes acceptance tests for the plan's Given/When/Then criteria, classifies each as WITNESS (missing-behavior test that must be proven RED) or PRESERVATION (constraint expected to pass before and after), records the execution envelope (the exact contract command, build/test configuration files, helper/fixture paths), proves every WITNESS fails for the right reason (RED, not an error or a compile failure) while every PRESERVATION passes, and commits only the test files it created. Each test asserts the observable business outcome, not a proxy. A WITNESS that passes on its first run is first investigated and corrected by the tester (at most two correction attempts, RED re-proven each time — the bounded-correction rule applies to WITNESS tests only) before `TESTS_NOT_RED` is raised; a PRESERVATION test that passes is never labelled RED. If no test can exercise the change through an existing testable boundary without scaffolding, the tester raises `TEST_BOUNDARY_MISSING` for the developer to decide (approve scaffolding as scope, redirect the plan, or abort). If a meaningful test/build execution cannot be obtained because the runner or environment is unavailable, the tester raises `RUNNER_UNAVAILABLE` instead of recording RED, GREEN, or PASS. It must not write production code or push. It hands forward TEST-CONTRACT.md (classification, test paths, execution envelope, RED commit SHA per repository) and RED-REPORT.md (witness/preservation results) as the immutable definition of "done" for the developer.

**6. Develop (GREEN).** The developer implements against PLAN.md until the tests in TEST-CONTRACT.md pass, committing production code only. It must not edit any path listed in TEST-CONTRACT.md, and must not alter TEST-CONTRACT.md or RED-REPORT.md itself; a needed test change goes through a TEST-CHANGE-REQUEST recorded in IMPLEMENTATION.md and a STOP for the developer to decide. It may change a file in the execution envelope when the implementation genuinely needs it, but every such change is listed and justified under IMPLEMENTATION.md's Envelope changes, and changing an envelope file so a contract test is no longer discovered, is skipped, or is excluded is forbidden. If a meaningful test/build execution cannot be obtained because the runner or environment is unavailable, it raises `RUNNER_UNAVAILABLE`; a compile/build failure caused by the implementation itself is an implementation failure, not `RUNNER_UNAVAILABLE`. It hands forward IMPLEMENTATION.md with the GREEN evidence and the envelope changes.

**7. Verify.** The verifier requires a clean checkout and records a candidate SHA before running any test, then executes twice, both required for PASS: (A) the exact contract command from TEST-CONTRACT.md, confirming each named test was discovered, executed, not skipped, and produced its classified result (WITNESS now GREEN, PRESERVATION still GREEN); (B) the repository's independently detected full suite/build, to prove no broader regression. Neither run replaces the other. It re-confirms the checkout is still clean and HEAD unchanged after all execution (otherwise FAIL, "checkout changed during verification"), checks test-file immutability with `git diff --stat` anchored at the latest amendment's active anchor and paths (top-level RED commit when there is no amendment), diffs the execution envelope files since that anchor (an unjustified change is FAIL), produces the changed-path inventory from the baseline SHA in WORKSPACE.md and classifies every path (PLANNED, ENVELOPE, PROTECTED-TEST, UNRELATED), derives diff-versus-plan and unrelated-change findings from that inventory, and records the confirmed candidate SHA per repository as the verified commit SHA. If a meaningful test/build execution cannot be obtained because the runner or environment is unavailable, it raises `RUNNER_UNAVAILABLE`; a full-suite failure caused by the implementation is FAIL, not `RUNNER_UNAVAILABLE`. It must not edit any repository, push, or publish. It hands forward VERIFICATION.md with a PASS/FAIL verdict; FAIL sends the developer back to stage 6, bounded to two rounds.

**8. PR draft.** The pr agent drafts PR-DESCRIPTION.md from PLAN.md, VERIFICATION.md, and INTAKE.md, quoting the verified SHAs. It must not touch code, tests, Jira, or branches, and must not create anything yet. It hands the draft to the developer at G4, the human gate that authorizes both publish and PR creation.

**9. Publish.** After G4 is recorded in RUN.md's gates log as `PUBLISH_AND_PR` or `PUBLISH_ONLY` (checked as step 0 of the sequence below), the workspace agent preflights every repository — push destination, current branch, current HEAD, current default branch, and the VERIFICATION.md SHA — against the tuple approved at G4 (`G4_STALE` on drift, `REVERIFICATION_REQUIRED` on a HEAD mismatch; either STOP pushes nothing for any repository), then, only once every repository passes, pushes the explicit verified commit object per repository (`git push origin <verifiedSHA>:refs/heads/<branch>`, never a branch name, never force), and records the outcome in WORKSPACE.md's Publish section. It hands forward the pushed branch and its confirmed remote SHA.

**10. PR.** The pr agent creates the Bitbucket pull request only when the Bitbucket read capability is available (otherwise it creates no PR and reports the blocking condition), no PR already exists for the source branch (an existing one is recorded, not duplicated), VERIFICATION.md says PASS, G4 is recorded in RUN.md as `PUBLISH_AND_PR`, and WORKSPACE.md's remote SHA equals the verified SHA (re-read immediately before creation, and again after when the capability allows). The target branch is always the default branch WORKSPACE.md recorded, never assumed. It must not merge, approve, decline, or create a branch. It hands forward PR.md with the PR URL and the SHA it created the PR against.

## Gates

Gates are asked by the pipeline orchestrator (stage agents cannot ask questions); each answer is recorded in RUN.md's gates log.

**G1 — Repositories.** Asked after Intake produces a recommendation. Question: "Which repositories does this work affect? Recommended: `<repo>` (confidence, evidence) [, ...]. Select the repositories to include." Options: each inventoried repository (multi-select) plus free text for one not listed. Recorded: the recommendation as given, the developer's selection, and whether each selected repository was agent-recommended.

**G2 — Branch and context.** Asked immediately after G1. Question: "Proposed branch name: `<PRIMARY>-<slug>`. Accept or provide a replacement slug. Optionally add context (constraints, known files, things to avoid, discussion with another developer) — or continue without adding context." Options: accept / edit slug; free-text context or explicit skip. Recorded: final branch name, developer context verbatim (or `provided: false`).

**G3 — Plan approval.** Asked once the adversary returns APPROVE (or the developer decides after a second REVISE/BLOCK, see STOP catalogue). Question: "The plan for `<PRIMARY>` has been reviewed (`<verdict>`). Approve this plan to proceed to test authoring?" Options: Approve / Send back for another revision (only if round budget remains) / Abort run. Recorded: verdict, round number, developer answer.

**G4 — Publish and PR.** Asked after PR draft, showing the PR description, the diff summary, and, per repository, the approved tuple: directory, push destination (from WORKSPACE.md), source branch, verified SHA (from VERIFICATION.md), and target (default) branch (from WORKSPACE.md). Question: "Verification passed for `<repos>` at `<SHAs>`. Publish these branches and open the pull request(s)?" Options: Approve publish and PR / Approve publish only / Abort. RUN.md records the answer as one of `PUBLISH_AND_PR`, `PUBLISH_ONLY`, `ABORT`, **and** the per-repository tuple shown and approved. Stage 9 (Publish) runs for either `PUBLISH_AND_PR` or `PUBLISH_ONLY`; stage 10 (PR) runs only for `PUBLISH_AND_PR`. Recorded: developer answer, the per-repository tuple, timestamp only if a tool produced one.

## Conditional STOP catalogue

Every STOP uses the shape:

```text
STOP [<CODE>]: <one-line reason>.
Decision needed from: <role>.
<optional: what happens on resume>
```

| Code | Condition | Decided by |
|---|---|---|
| `INVALID_KEY` | A comma-separated token does not match a valid Jira key shape | developer (must re-run with corrected keys) |
| `RUN_EXISTS` | `.pipeline/runs/<PRIMARY>/` already has artifacts | developer (choose where to resume, or start over) |
| `PRIMARY_JIRA_NOT_FOUND` | The primary key returns no issue from Jira, raised by `pipeline` after reading INTAKE.md and before G1 | developer (fix the key or the connection, then re-run) |
| `JIRA_UNAVAILABLE` | The Jira MCP server is not connected or fails, raised by `pipeline` after reading INTAKE.md and before G1 | developer (fix the key or the connection, then re-run) |
| `WORKSPACE_DIRTY` | A confirmed repository has uncommitted changes | developer (fix manually, exclude repo, or abort) |
| `WORKSPACE_BRANCH_EXISTS` | The feature branch name already exists locally or remotely | developer (reuse, rename, or abort) |
| `WORKSPACE_DIVERGED` | The local default branch cannot fast-forward to `origin/<default>` | developer (branch from remote default, exclude repo, or abort) |
| `WORKSPACE_DEFAULT_AHEAD` | After fast-forward, `git rev-list --left-right --count origin/<default>...<default>` is not `0 0` — the local default branch carries commits not on `origin/<default>` | developer (publish or discard them outside the pipeline, exclude repo, or abort) |
| `WORKSPACE_REMOTE_UNREACHABLE` | `fetch` or `ls-remote` fails | developer (retry after manual fix, exclude repo, or abort) |
| `WORKSPACE_DEFAULT_UNKNOWN` | The default branch cannot be determined from the remote | developer (name the default branch, exclude repo, or abort) |
| `TESTS_NOT_RED` | After at most two correction attempts, `tester` cannot establish legitimate RED (failure caused by the missing acceptance behavior rather than compilation, setup, or infrastructure) for a WITNESS acceptance test | developer (behavior already exists, criterion is wrong, or test needs redesign; `tester` never weakens a criterion to manufacture RED) |
| `TEST_BOUNDARY_MISSING` | No test can exercise the change through an existing testable boundary without scaffolding | developer (approve scaffolding as scope, redirect the plan, or abort) |
| `RUNNER_UNAVAILABLE` | A meaningful test/build execution could not be obtained: the runner cannot launch, required tooling/dependencies cannot be obtained in the environment, required external infrastructure is unavailable, or another environment condition prevents a valid result (contract A6; an assertion failure, a compile/build failure caused by the code, or a legitimate RED is never `RUNNER_UNAVAILABLE`) | developer (fix the environment and resume; no RED, GREEN, or PASS is recorded) |
| `TEST_CHANGE_REQUESTED` | The developer needs a contract test changed mid-implementation | developer (approve or reject the change request) |
| `ADVERSARY_BLOCK` | The adversary verdict is BLOCK | developer (decide how to proceed; plan cannot advance on BLOCK alone) |
| `ADVERSARY_REVISE_LIMIT` | A second REVISE verdict is reached (round budget exhausted) | developer (accept the plan as-is, redirect the planner manually, or abort) |
| `VERIFIER_FAIL_LIMIT` | VERIFICATION.md is FAIL after two developer fix rounds | developer (abort, or manually intervene outside the pipeline) |
| `G4_NOT_RECORDED` | Publish step 0 finds no G4 answer of `PUBLISH_AND_PR` or `PUBLISH_ONLY` in RUN.md's gates log | developer (ensure G4 is recorded, then resume publish) |
| `REVERIFICATION_REQUIRED` | Publish step 1 preflight: current HEAD does not equal the verified SHA in VERIFICATION.md for a repository | developer (re-run verification; nothing is pushed for any repository) |
| `G4_STALE` | Publish step 1 preflight: push destination, current branch, or current default branch no longer matches the tuple approved at G4 for a repository | developer (re-approve at G4 after review; nothing is pushed for any repository) |
| `PUSH_FAILED` | `git push origin <verifiedSHA>:refs/heads/<branch>` fails for a repository | developer (diagnose and decide whether to retry) |
| `REMOTE_SHA_MISMATCH` | `git ls-remote --heads origin <branch>` does not resolve to the verified SHA after push | developer (investigate before any PR is created) |

## Bounded loops

- Adversary <-> Planner: at most two rounds. A second REVISE, or any BLOCK, escalates to the developer (`ADVERSARY_REVISE_LIMIT` / `ADVERSARY_BLOCK`) rather than looping again.
- Verifier <-> Developer: at most two rounds. A second FAIL escalates to the developer (`VERIFIER_FAIL_LIMIT`).
- Test-change requests are never looped automatically: each one is a single STOP and a single human decision.
- Tester RED proof: at most two correction attempts per WITNESS test before `TESTS_NOT_RED`; PRESERVATION tests are never subject to this loop.
- Every other stage is linear; there is no other retry.

## Publish sequence (verified commit invariant, contract A3 / §8.1)

Executed by the workspace agent, in this exact order:

0. Read RUN.md's gates log; require G4 = `PUBLISH_AND_PR` or `PUBLISH_ONLY` else STOP `G4_NOT_RECORDED`, push nothing.
1. Preflight, for **every** repository before any push: read the G4 tuple for that repository; run `git -C <dir> remote -v` (current push destination), `git -C <dir> rev-parse --abbrev-ref HEAD` (current branch), `git -C <dir> rev-parse HEAD` (current HEAD), `git -C <dir> ls-remote --symref origin HEAD` (current default branch); read the verified SHA from VERIFICATION.md. Require: push destination = G4 destination; current branch = G4 source branch; current default = G4 target; VERIFICATION.md SHA = G4 verified SHA; current HEAD = verified SHA. A HEAD mismatch is STOP `REVERIFICATION_REQUIRED`; any other mismatch is STOP `G4_STALE` ("The current repository state no longer matches the tuple approved at G4 (`<field>` drifted in `<repo>`). Decision needed from: developer. Re-approve at G4 after review; nothing is pushed for any repository."). Either STOP pushes nothing for any repository. Record every read `[TOOL]`.
2. Only when every repository passed step 1, per repository: `git -C <dir> push origin <verifiedSHA>:refs/heads/<branch>` (explicit verified object as the source, never a branch name, never force, no `-u`); failure → STOP `PUSH_FAILED`.
3. `git -C <dir> ls-remote --heads origin <branch>`; require the verified SHA; otherwise STOP `REMOTE_SHA_MISMATCH`.
4. Record verified SHA, preflight reads, push result, and remote SHA in WORKSPACE.md's Publish section, each `[TOOL]`.

The guarantee is stated exactly: the pushed object is the verified commit; protection of the branch after publication belongs to the server, not to this pipeline.

## Resume by artifact

There is no separate run-state machine: resumability comes entirely from the artifacts already on disk. On `/pipeline <KEYS>` with an existing run directory, the orchestrator reads RUN.md and lists which of the eleven artifacts are present, missing, or recorded as failed. It proposes resuming at the first missing or failed artifact — never at an arbitrary later stage — and the developer confirms or chooses to start over. A stage agent is never re-invoked to silently regenerate an artifact that already exists; an existing artifact is treated as an immutable input unless the developer explicitly asks for it to be redone (which is itself a G3/G4-style decision, recorded in RUN.md).

## Illustrative transcript (two repositories)

```text
> /pipeline PAY-4821
Intake: recommends payments-api (HIGH), payments-web (MEDIUM).
G1 — Which repositories does this affect? [payments-api, payments-web selected]
G2 — Branch: PAY-4821-retry-failed-webhooks. Accept? [accepted, no extra context]
Workspace: payments-api PREPARED @ a1b2c3d; payments-web PREPARED @ 9f8e7d6.
Plan drafted. Adversary: APPROVE (round 1).
G3 — Approve this plan to proceed to test authoring? [approved]
Tester: 4 acceptance tests written, confirmed RED in both repos.
Developer: implementation GREEN in payments-api and payments-web.
Verifier: PASS. Verified SHA payments-api=4c5d6e7, payments-web=1a2b3c4.
PR draft ready.
G4 — Publish these branches and open the pull request(s)? [approved]
Workspace: preflight OK for both repos (destination, branch, HEAD, default all match the G4 tuple).
Workspace: publish sequence OK for both repos; remote SHAs match.
PR: opened PR #512 (payments-api), PR #88 (payments-web).
```

## Appendix: Requirement traceability

| Req | Requirement (short) | Primary location |
|---|---|---|
| B1 | `/pipeline` comma-separated, whitespace-tolerant keys | `skills/pipeline/SKILL.md` (R3); Stage 0 above |
| B2 | First key is primary, never reordered | `skills/pipeline/SKILL.md` (R3); `pipeline.agent.md` (R2) |
| B3 | Primary Jira determines branch prefix | Stage 2 above; `workspace.agent.md` (R2) |
| B4 | Bounded, provenance-tagged Jira context; discovered tickets are context only | `skills/gather-jira-context/SKILL.md` (R3); AGENT-CONTRACTS.md intake section |
| B5 | Optional developer context stored separately | G2 above; AGENT-CONTRACTS.md RUN.md template |
| B6 | Evidence-backed repository suggestion, developer confirms | `skills/discover-affected-projects/SKILL.md` (R3); G1 above |
| B7 | Multi-repo: same branch name, per-repo status, no overstated success | Stage 2 above; AGENT-CONTRACTS.md WORKSPACE.md template |
| B8 | Flow order Intake -> Workspace -> Planner -> Adversary -> Tester -> Developer -> Verifier -> PR | Flow diagram and Stages table above |
| B9 | Agent boundaries and least privilege | AGENT-CONTRACTS.md (per-agent tools/forbidden); GUARDRAILS.md least-privilege table |
| B10 | Tester proves RED before Developer implements | Stage 5 above; AGENT-CONTRACTS.md tester section |
| B11 | No silent test rewrite; change-request path; mechanical immutability check | GUARDRAILS.md Test immutability mechanism; AGENT-CONTRACTS.md developer/verifier sections |
| B12 | Agents communicate through explicit artifacts | AGENT-CONTRACTS.md artifact templates |
| B13 | Human approval at G1-G4 plus conditional STOPs | Gates and STOP catalogue above |
| B14 | Jira/repo/MCP content is data, not instructions | `.github/copilot-instructions.md`; GUARDRAILS.md Trust boundaries |
| B15 | Verifier independent, never publishes; PR agent needs PASS + approval | AGENT-CONTRACTS.md verifier/pr sections |
| B16 | Verified commit invariant | Publish sequence above (§8.1); GUARDRAILS.md Verified commit invariant |
| B17 | Artifact ownership, earlier artifacts immutable | AGENT-CONTRACTS.md ownership matrix; GUARDRAILS.md Artifact ownership |
