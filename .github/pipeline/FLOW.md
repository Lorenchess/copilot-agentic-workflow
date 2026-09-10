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
| 2 | Workspace | workspace | INTAKE.md, RUN.md | WORKSPACE.md | Per repo: dirty / existing branch / diverged / unreachable / unknown default -> STOP |
| 3 | Plan | planner | INTAKE.md, RUN.md, code | PLAN.md | none |
| 4 | Adversary | adversary | PLAN.md, INTAKE.md, RUN.md, code | ADVERSARY-REVIEW.md | REVISE -> planner once more; 2nd REVISE or BLOCK -> developer decides; G3 plan approval |
| 5 | Test (RED) | tester | PLAN.md | test files (committed), TEST-CONTRACT.md, RED-REPORT.md | Tests not RED after bounded correction -> STOP |
| 6 | Develop (GREEN) | developer | PLAN.md, TEST-CONTRACT.md, RED-REPORT.md | code (committed), IMPLEMENTATION.md | Test-change request -> STOP for developer decision |
| 7 | Verify | verifier | everything above, repos | VERIFICATION.md | FAIL -> developer fixes, <=2 rounds, then STOP |
| 8 | PR draft | pr | PLAN.md, VERIFICATION.md, INTAKE.md | PR-DESCRIPTION.md | G4 publish + PR approval |
| 9 | Publish | workspace | RUN.md, VERIFICATION.md, WORKSPACE.md | WORKSPACE.md (Publish section) | G4_NOT_RECORDED, REVERIFICATION_REQUIRED, push failure, remote SHA mismatch |
| 10 | PR | pr | PR-DESCRIPTION.md, VERIFICATION.md, WORKSPACE.md | PR.md | Only after PASS + G4 = PUBLISH_AND_PR + SHA equality |

### Stage narratives

**0. Entry.** The `/pipeline` skill parses the comma-separated keys (whitespace-tolerant, first key primary, duplicates deduped keeping first occurrence) and the pipeline orchestrator checks whether `.pipeline/runs/<PRIMARY>/` already holds artifacts. It must not reorder keys or start any stage agent yet. It hands forward the validated key list and, on a fresh run, an empty RUN.md; on an existing run, a resume proposal.

**1. Intake.** The intake agent reads Jira (bounded, read-only) and the workspace listing, produces an evidence-backed repository recommendation and a proposed branch name, and asks G1 and G2 through the orchestrator. It must not touch a terminal, write code, or promote a discovered (linked/parent/child/testing) Jira into scope. It hands forward INTAKE.md: the requested Jiras, context-only Jiras, repository recommendation, and proposed branch name, all provenance-tagged. The confirmed repository list, confirmed branch name, and developer context are recorded by the orchestrator in RUN.md at G1/G2.

**2. Workspace.** The workspace agent fetches each confirmed repository, fast-forwards its default branch, and creates the feature branch with the exact name from RUN.md in every repository. It must not reset, clean, stash, rebase, pull, or force anything, and never reports success for a repository it has not actually prepared. It hands forward WORKSPACE.md with one status per repository (PREPARED / REUSED_EXISTING / EXCLUDED / BLOCKED / FAILED) and the base commit.

**3. Plan.** The planner reads INTAKE.md and RUN.md and the affected repositories' code (read-only) and produces a scope, an approach per repository, acceptance criteria as Given/When/Then, risks, and open questions. It must not touch a terminal or edit code. It hands forward PLAN.md for adversarial review.

**4. Adversary.** The adversary agent reads PLAN.md and challenges it: missing acceptance criteria, untested assumptions, scope creep. It must not edit the plan or touch code; it can only render a verdict. It hands forward ADVERSARY-REVIEW.md with a verdict (APPROVE / REVISE / BLOCK) and, on APPROVE, triggers G3 so the developer sees the approved plan before testing begins.

**5. Test (RED).** The tester writes acceptance tests for the plan's Given/When/Then criteria, proves they fail for the right reason (RED, not an error or a compile failure), and commits only the test files it created. A test that passes on its first run is first investigated and corrected by the tester (at most two correction attempts, RED re-proven each time) before `TESTS_NOT_RED` is raised. It must not write production code or push. It hands forward TEST-CONTRACT.md (test paths, RED commit SHA per repository) and RED-REPORT.md (failure evidence) as the immutable definition of "done" for the developer.

**6. Develop (GREEN).** The developer implements against PLAN.md until the tests in TEST-CONTRACT.md pass, committing production code only. It must not edit any path listed in TEST-CONTRACT.md, and must not alter TEST-CONTRACT.md or RED-REPORT.md itself; a needed test change goes through a TEST-CHANGE-REQUEST recorded in IMPLEMENTATION.md and a STOP for the developer to decide. It hands forward IMPLEMENTATION.md with the GREEN evidence.

**7. Verify.** The verifier independently reruns the full test suite, checks test-file immutability with `git diff --stat` against the RED commit, diffs the implementation against the plan, and records the exact verified commit SHA per repository from `git rev-parse HEAD`. It must not edit any repository, push, or publish. It hands forward VERIFICATION.md with a PASS/FAIL verdict; FAIL sends the developer back to stage 6, bounded to two rounds.

**8. PR draft.** The pr agent drafts PR-DESCRIPTION.md from PLAN.md, VERIFICATION.md, and INTAKE.md, quoting the verified SHAs. It must not touch code, tests, Jira, or branches, and must not create anything yet. It hands the draft to the developer at G4, the human gate that authorizes both publish and PR creation.

**9. Publish.** After G4 is recorded in RUN.md's gates log as `PUBLISH_AND_PR` or `PUBLISH_ONLY` (checked as step 0 of the sequence below), the workspace agent executes the §8.1 verified-commit-invariant sequence for every repository, in order, and records the outcome in WORKSPACE.md's Publish section. It must not push a repository whose local HEAD does not equal the SHA VERIFICATION.md recorded, and never force-pushes. It hands forward the pushed branch and its confirmed remote SHA.

**10. PR.** The pr agent creates the Bitbucket pull request only when VERIFICATION.md says PASS, G4 is recorded in RUN.md as `PUBLISH_AND_PR`, and WORKSPACE.md's remote SHA equals the verified SHA (re-checked with a Bitbucket read tool when available). It must not merge, approve, decline, or create a branch. It hands forward PR.md with the PR URL and the SHA it created the PR against.

## Gates

Gates are asked by the pipeline orchestrator (stage agents cannot ask questions); each answer is recorded in RUN.md's gates log.

**G1 — Repositories.** Asked after Intake produces a recommendation. Question: "Which repositories does this work affect? Recommended: `<repo>` (confidence, evidence) [, ...]. Select the repositories to include." Options: each inventoried repository (multi-select) plus free text for one not listed. Recorded: the recommendation as given, the developer's selection, and whether each selected repository was agent-recommended.

**G2 — Branch and context.** Asked immediately after G1. Question: "Proposed branch name: `<PRIMARY>-<slug>`. Accept or provide a replacement slug. Optionally add context (constraints, known files, things to avoid, discussion with another developer) — or continue without adding context." Options: accept / edit slug; free-text context or explicit skip. Recorded: final branch name, developer context verbatim (or `provided: false`).

**G3 — Plan approval.** Asked once the adversary returns APPROVE (or the developer decides after a second REVISE/BLOCK, see STOP catalogue). Question: "The plan for `<PRIMARY>` has been reviewed (`<verdict>`). Approve this plan to proceed to test authoring?" Options: Approve / Send back for another revision (only if round budget remains) / Abort run. Recorded: verdict, round number, developer answer.

**G4 — Publish and PR.** Asked after PR draft, showing the PR description, the diff summary, and the verified SHA per repository. Question: "Verification passed for `<repos>` at `<SHAs>`. Publish these branches and open the pull request(s)?" Options: Approve publish and PR / Approve publish only / Abort. RUN.md records the answer as one of `PUBLISH_AND_PR`, `PUBLISH_ONLY`, `ABORT`. Stage 9 (Publish) runs for either `PUBLISH_AND_PR` or `PUBLISH_ONLY`; stage 10 (PR) runs only for `PUBLISH_AND_PR`. Recorded: developer answer, the SHAs shown, timestamp only if a tool produced one.

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
| `WORKSPACE_REMOTE_UNREACHABLE` | `fetch` or `ls-remote` fails | developer (retry after manual fix, exclude repo, or abort) |
| `WORKSPACE_DEFAULT_UNKNOWN` | The default branch cannot be determined from the remote | developer (name the default branch, exclude repo, or abort) |
| `TESTS_NOT_RED` | After at most two correction attempts, `tester` cannot establish legitimate RED (failure caused by the missing acceptance behavior rather than compilation, setup, or infrastructure) for an acceptance test | developer (behavior already exists, criterion is wrong, or test needs redesign; `tester` never weakens a criterion to manufacture RED) |
| `TEST_CHANGE_REQUESTED` | The developer needs a contract test changed mid-implementation | developer (approve or reject the change request) |
| `ADVERSARY_BLOCK` | The adversary verdict is BLOCK | developer (decide how to proceed; plan cannot advance on BLOCK alone) |
| `ADVERSARY_REVISE_LIMIT` | A second REVISE verdict is reached (round budget exhausted) | developer (accept the plan as-is, redirect the planner manually, or abort) |
| `VERIFIER_FAIL_LIMIT` | VERIFICATION.md is FAIL after two developer fix rounds | developer (abort, or manually intervene outside the pipeline) |
| `G4_NOT_RECORDED` | Publish step 0 finds no G4 answer of `PUBLISH_AND_PR` or `PUBLISH_ONLY` in RUN.md's gates log | developer (ensure G4 is recorded, then resume publish) |
| `REVERIFICATION_REQUIRED` | Local HEAD at publish time does not equal the verified SHA in VERIFICATION.md | developer (re-run verification; nothing is pushed for any repository) |
| `PUSH_FAILED` | `git push -u origin <branch>` fails for a repository | developer (diagnose and decide whether to retry) |
| `REMOTE_SHA_MISMATCH` | `git ls-remote --heads origin <branch>` does not resolve to the verified SHA after push | developer (investigate before any PR is created) |

## Bounded loops

- Adversary <-> Planner: at most two rounds. A second REVISE, or any BLOCK, escalates to the developer (`ADVERSARY_REVISE_LIMIT` / `ADVERSARY_BLOCK`) rather than looping again.
- Verifier <-> Developer: at most two rounds. A second FAIL escalates to the developer (`VERIFIER_FAIL_LIMIT`).
- Test-change requests are never looped automatically: each one is a single STOP and a single human decision.
- Tester RED proof: at most two correction attempts per test before `TESTS_NOT_RED`.
- Every other stage is linear; there is no other retry.

## Publish sequence (verified commit invariant, contract §8.1)

Executed by the workspace agent, per repository, in this exact order:

0. Read RUN.md's gates log and require a G4 answer of `PUBLISH_AND_PR` or `PUBLISH_ONLY`. If absent, STOP `G4_NOT_RECORDED` and push nothing for any repository in the run.
1. Read the verified SHA for the repository from VERIFICATION.md.
2. Run `git -C <dir> rev-parse HEAD` on the feature branch and require it to equal the verified SHA. If they differ, STOP `REVERIFICATION_REQUIRED` for that repository, push nothing for any repository in the run, and report which repository drifted.
3. Only when equal: run `git -C <dir> push -u origin <branch>` (never force).
4. Run `git -C <dir> ls-remote --heads origin <branch>` and require the returned SHA to equal the verified SHA; otherwise STOP.
5. Record verified SHA, local HEAD, push result, and remote SHA in WORKSPACE.md's Publish section, each tagged `[TOOL]`.

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
