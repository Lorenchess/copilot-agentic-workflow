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
Test RED <-------------------+ ----> TEST-CONTRACT.md, RED-REPORT.md
   |                         |
   v                         | (REVISE, <=1 automatic correction round)
Test review ------------------+----> TEST-REVIEW.md            (2nd REVISE -> TEST_REVIEW_REVISE_LIMIT)
   |  (ACCEPT)
   v
Develop GREEN <--------------+----> IMPLEMENTATION.md
   |                         |
   v                         | (FAIL, <=2 rounds)
Verify -----------------------+---> VERIFICATION.md
   |  (PASS)                          (INCOMPLETE -> recovery via Test RED -> Test review -> (Develop) -> Verify, never Verify alone)
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
| 0 | Entry | skill + pipeline | `/pipeline KEYS` | RUN.md | Invalid key -> STOP. Existing run -> requested keys must equal RUN.md's Keys or STOP `RUN_KEYS_MISMATCH`; otherwise propose resume at the earlier of the first missing, failed, or incomplete artifact and the first gate in G1-G4 with no `CURRENT` answer (none recorded, or `STALE`), developer confirms. |
| 1 | Intake | intake | Jira, workspace listing, README heads | INTAKE.md | G1 repositories; G2 branch + context |
| 2 | Workspace | workspace | RUN.md | WORKSPACE.md | Per repo: dirty / existing branch / diverged / default ahead of origin / unreachable / unknown default -> STOP |
| 3 | Plan | planner | `plan-grounding` skill, INTAKE.md, RUN.md, code; on a new cycle also RUN.md's G3 entry and the superseded prior PLAN.md/ADVERSARY-REVIEW.md | PLAN.md (`cycle.round`) | none |
| 4 | Adversary | adversary | `plan-grounding` and `challenge-plan` skills, PLAN.md, INTAKE.md, RUN.md, code | ADVERSARY-REVIEW.md (`cycle.round`) | REVISE -> planner once more within the same cycle; 2nd REVISE or BLOCK -> developer decides (accept as-is, redirect the planner (new cycle), or abort); G3 plan approval |
| 5 | Test (RED) | tester | `test-contract` skill, PLAN.md | test files (committed), TEST-CONTRACT.md (Contract map, doubles, classification, protected/envelope/proof-relevant/relied-on paths), RED-REPORT.md | WITNESS not RED after bounded correction -> `TESTS_NOT_RED`; no testable boundary without scaffolding -> `TEST_BOUNDARY_MISSING`; PRESERVATION baseline failure -> `PRESERVATION_BASELINE_FAILED`; meaningful execution or a required level unobtainable -> `RUNNER_UNAVAILABLE` (per-clause coverage-gap options, T10) |
| 5b | Test review | adversary (test-review mode) | `test-contract` skill (Challenge section), PLAN.md, TEST-CONTRACT.md, RED-REPORT.md, controlled paths, staged-set/transition-patch records | TEST-REVIEW.md (Verdict, Basis, required outcomes and incorrect behaviors, Checks performed, Findings) | REVISE -> `tester` once (one correction round) then `adversary` again; 2nd REVISE -> `TEST_REVIEW_REVISE_LIMIT`; ACCEPT is silent |
| 6 | Develop (GREEN) | developer | PLAN.md, TEST-CONTRACT.md, RED-REPORT.md | code (committed), IMPLEMENTATION.md (Envelope changes listed and justified) | Test-change request -> `tester` assessment, then STOP for developer decision (a `REQUIREMENT_CHANGE` effect is voiced as the existing send-back decision); meaningful execution unobtainable -> `RUNNER_UNAVAILABLE`; never starts without a current test review |
| 7 | Verify | verifier | WORKSPACE.md, PLAN.md, ADVERSARY-REVIEW.md, TEST-CONTRACT.md, RED-REPORT.md, TEST-REVIEW.md, IMPLEMENTATION.md, repos | VERIFICATION.md (contract run incl. relied-on execution and `NOT_VERIFIED` set, full-suite run, execution envelope check, test review basis check, immutability at the active anchor, changed-path inventory) | Checkout not clean or HEAD drifted during execution -> FAIL; Verifier/developer: one initial verification plus at most two fix rounds; `VERIFIER_FAIL_LIMIT` is raised on the third FAIL; meaningful execution unobtainable -> `RUNNER_UNAVAILABLE`; non-empty `NOT_VERIFIED` set with all other checks passing -> `INCOMPLETE` -> `VERIFICATION_INCOMPLETE` (recovery via stage 5, never stage 7 alone; no G4) |
| 8 | PR draft | pr | PLAN.md, VERIFICATION.md, INTAKE.md | PR-DESCRIPTION.md | G4 publish + PR approval |
| 9 | Publish | workspace | RUN.md, VERIFICATION.md, WORKSPACE.md | WORKSPACE.md (Publish section) | G4_NOT_RECORDED, REVERIFICATION_REQUIRED, G4_STALE, push failure, remote SHA mismatch |
| 10 | PR | pr | PR-DESCRIPTION.md, VERIFICATION.md, WORKSPACE.md, RUN.md | PR.md | No Bitbucket read capability, eligibility not met (PASS + G4 = `CURRENT`/`PUBLISH_AND_PR` + SHA equality), SHA mismatch on the re-read, or a mismatching existing PR (`EXISTING_PR_MISMATCH`) |

### Stage narratives

**0. Entry.** The `/pipeline` skill parses the comma-separated keys (whitespace-tolerant, first key primary, duplicates deduped keeping first occurrence) and the pipeline orchestrator checks whether `.pipeline/runs/<PRIMARY>/` already holds artifacts. It must not reorder keys or start any stage agent yet. On an existing run, the requested key list must equal RUN.md's Keys, otherwise STOP `RUN_KEYS_MISMATCH`; otherwise it proposes resuming at the earlier of (a) the first missing, failed, or incomplete artifact and (b) the first gate in G1-G4 with no `CURRENT` answer (none recorded, or `STALE`) — never at an arbitrary later stage. It hands forward the validated key list and, on a fresh run, an empty RUN.md; on an existing run, a resume proposal.

**1. Intake.** The intake agent reads Jira (bounded, read-only) and the workspace listing, produces an evidence-backed repository recommendation and a proposed branch name, and asks G1 and G2 through the orchestrator. It must not touch a terminal, write code, or promote a discovered (linked/parent/child/testing) Jira into scope. It hands forward INTAKE.md: the requested Jiras, context-only Jiras, repository recommendation, and proposed branch name, all provenance-tagged. The confirmed repository list, confirmed branch name, and developer context are recorded by the orchestrator in RUN.md at G1/G2.

**2. Workspace.** The workspace agent fetches each confirmed repository, fast-forwards its default branch, confirms (`git rev-list --left-right --count origin/<default>...<default>` = `0 0`) that the local default carries nothing origin doesn't have (`WORKSPACE_DEFAULT_AHEAD` otherwise), and creates the feature branch with the exact name from RUN.md in every repository. It must not reset, clean, stash, rebase, pull, or force anything, and never reports success for a repository it has not actually prepared. It hands forward WORKSPACE.md with one status per repository (PREPARED / REUSED_EXISTING / EXCLUDED / BLOCKED / FAILED), the push destination, and the baseline (`origin/<default>`) SHA.

**3. Plan.** The planner reads `.github/skills/plan-grounding/SKILL.md` (the construction rules), INTAKE.md, RUN.md, and the affected repositories' code (read-only) and produces PLAN.md: requirement items and their disposition, change class, repository evidence, an approach per repository, dependencies and interfaces, affected files, acceptance criteria as Given/When/Then with testability and preservation fields, risks, decisions and open questions, and a decision summary. It must not touch a terminal or edit code, and it does not read `challenge-plan` (the adversary's own method). On a revise round or a new planning cycle it also reads its own prior PLAN.md and ADVERSARY-REVIEW.md, and, on a new cycle, RUN.md's G3 entry as a `[DEV]` input. It hands forward PLAN.md, identified by `cycle.round`, for adversarial review.

**4. Adversary.** The adversary agent reads `.github/skills/plan-grounding/SKILL.md` and `.github/skills/challenge-plan/SKILL.md` (its independent review method), then PLAN.md, INTAKE.md, RUN.md, and code, and challenges the plan: an independent requirement derivation from INTAKE.md/RUN.md read before PLAN.md's disposition, change-class confirmation, independent checks (evidence verification, a consequence-driven boundary check, and a combined-outcome check), and the challenge catalogue. It must not edit the plan or touch code, and it never proposes a competing full plan (a concise counterexample or bounded alternative to explain a finding is allowed) — it can only render a verdict. It hands forward ADVERSARY-REVIEW.md, identified by `cycle.round`, with a verdict (APPROVE / REVISE / BLOCK) and, on APPROVE, triggers G3 — voiced directly from PLAN.md's Decision summary and ADVERSARY-REVIEW.md's verdict and Residual findings — so the developer sees the reviewed plan before testing begins.

**5. Test (RED).** The tester reads `.github/skills/test-contract/SKILL.md` first, then writes acceptance tests for the plan's Given/When/Then criteria, chooses the proof boundary and level (T3), doubles only at the edge (T4), classifies each per clause as WITNESS or PRESERVATION on the four ordered bases (T5), records the execution envelope with each entry marked proof-relevant by effect (T9), proves every WITNESS fails for the right reason on **two consecutive runs** with identical results (T6) while every PRESERVATION passes, and commits only the test files it created (plus, on an approved amendment, the single named delta). Each test asserts the observable business outcome, not a proxy. A WITNESS that passes on its first run is first investigated and corrected by the tester (at most two correction attempts, RED re-proven each time — the bounded-correction rule applies to WITNESS tests only) before `TESTS_NOT_RED` is raised; a PRESERVATION test that passes is never labelled RED. A PRESERVATION test that fails before implementation is diagnosed, never categorically treated as a test defect: a test defect is corrected within the same two-attempt budget and re-run to PASS; a genuine baseline failure is retained unchanged (never weakened) and recorded `PRESERVATION_BASELINE_FAILED` for the developer to reclassify the test WITNESS, exclude it from the contract, or abort. If no test can exercise the change through an existing testable boundary without scaffolding, the tester raises `TEST_BOUNDARY_MISSING` for the developer to decide (approve scaffolding as scope — a human, on the feature branch, T13 — redirect the plan, or abort). Where only a level that cannot execute here would prove a clause (T10), the tester seeks equivalent evidence first, else records the clause `NOT_VERIFIED` under Coverage gaps and raises `RUNNER_UNAVAILABLE` per-clause; the developer's options there are fix-and-resume, proceed with the gap (an authorized exception), change the requirement through planning, or abort — a wider "meaningful test/build execution cannot be obtained" condition raises the same STOP without a per-clause gap. It must not write production code or push. It hands forward TEST-CONTRACT.md and RED-REPORT.md for stage 5b's challenge before Developer starts.

**5b. Test review.** The adversary, in test-review mode, reads `.github/skills/test-contract/SKILL.md`'s Challenge section (after its construction rules), then independently derives per clause the required outcome and plausible incorrect behaviors from PLAN.md **before** inspecting test source, then inspects the Contract map, doubles, proof-relevant support, RED evidence, and the staged-set record against those incorrect behaviors, works the skill's catalogue, and renders `ACCEPT` or `REVISE` (never `BLOCK`). It holds no terminal and does not read `plan-grounding`, `challenge-plan`, or ADVERSARY-REVIEW.md — a prior plan approval is never evidence of test adequacy. On `ACCEPT`, stage 5b is silent and Developer proceeds. On `REVISE`, `pipeline` re-invokes `tester` for one bounded correction round (a new anchor with its own transition patch from the superseded anchor) and then `adversary` again; a second `REVISE` raises `STOP [TEST_REVIEW_REVISE_LIMIT]`. Any correction, amendment, proof-relevant change, coverage/limitation change, or PLAN.md supersession marks the prior TEST-REVIEW.md `SUPERSEDED` in the same RUN.md edit that records the change, and `adversary` is re-invoked — on an amendment, over the affected dependency set rather than every test. It hands forward TEST-REVIEW.md; Developer proceeds, or resumes after an amendment or recovery, only on a **current review** (T11).

**6. Develop (GREEN).** The developer implements against PLAN.md until the tests in TEST-CONTRACT.md pass, committing production code only, and never starts or resumes without a current test review (stage 5b). On a fix round (after a verifier FAIL) the developer also reads VERIFICATION.md's Findings for developer and starts from those findings. It must not edit any controlled path (a Protected path, a proof-relevant envelope file, or a Relied-on existing test), and must not alter TEST-CONTRACT.md or RED-REPORT.md itself; a needed test or proof-relevant change goes through a TEST-CHANGE-REQUEST recorded in IMPLEMENTATION.md, `tester`'s assessment, and a STOP for the developer to decide — an assessed `REQUIREMENT_CHANGE` is never amendable and is instead routed to a new planning cycle. It may change an ordinary (non-proof-relevant) file in the execution envelope when the implementation genuinely needs it, but every such change is listed and justified under IMPLEMENTATION.md's Envelope changes, and changing an envelope file so a contract test is no longer discovered, is skipped, or is excluded is forbidden. Where a clause is recorded `NOT_VERIFIED`, the developer implements against PLAN.md's whole approved behavior for it, not only against the runnable tests. If a meaningful test/build execution cannot be obtained because the runner or environment is unavailable, it raises `RUNNER_UNAVAILABLE`; a compile/build failure caused by the implementation itself is an implementation failure, not `RUNNER_UNAVAILABLE`. It hands forward IMPLEMENTATION.md with the GREEN evidence and the envelope changes.

**7. Verify.** The verifier requires a clean checkout and records a candidate SHA before running any test, then executes twice, both required for PASS: (A) the exact contract command from TEST-CONTRACT.md, confirming each named test was discovered, executed, not skipped, and produced its classified result (WITNESS now GREEN, PRESERVATION still GREEN), and that every Relied-on existing test identity was observed executed (missing/skipped/failing is FAIL); (B) the repository's independently detected full suite/build, to prove no broader regression. Neither run replaces the other. It re-confirms the checkout is still clean and HEAD unchanged after all execution (otherwise FAIL, "checkout changed during verification"), checks test-file immutability with `git diff --stat` anchored at the latest amendment's active anchor and Protected paths (top-level RED commit when there is no amendment — command form unchanged), diffs the envelope files (including Relied-on existing tests) since that anchor (an unjustified change is FAIL; a proof-relevant change with no approved amendment is FAIL regardless of justification), checks that a **current test review** exists (a `CURRENT ACCEPT` with matching basis, or a `CURRENT REVISE` fully covered by authorized exceptions — the latter caps the verdict at `INCOMPLETE`), produces the changed-path inventory from the baseline SHA in WORKSPACE.md and classifies every path (PLANNED, ENVELOPE, PROTECTED-TEST, UNRELATED), derives diff-versus-plan and unrelated-change findings from that inventory, and records the confirmed candidate SHA per repository as the verified commit SHA. It derives the current `NOT_VERIFIED` clause set from TEST-CONTRACT.md's Coverage gaps plus RUN.md's authorized exceptions that are still current (a closed, re-reviewed gap's exception is history, not current). If a meaningful test/build execution cannot be obtained because the runner or environment is unavailable, it raises `RUNNER_UNAVAILABLE`; a full-suite failure caused by the implementation is FAIL, not `RUNNER_UNAVAILABLE`. It must not edit any repository, push, or publish. It hands forward VERIFICATION.md with a verdict of `PASS` (all checks hold, `NOT_VERIFIED` set empty), `INCOMPLETE` (every runnable check passes, review-basis check holds, `NOT_VERIFIED` set non-empty), or `FAIL` (any real failure, whatever exceptions exist); `FAIL` sends the developer back to stage 6, bounded to two rounds; `INCOMPLETE` raises `VERIFICATION_INCOMPLETE`, recovers through stage 5 (never stage 7 alone), and never reaches G4.

**8. PR draft.** The pr agent drafts PR-DESCRIPTION.md from PLAN.md, VERIFICATION.md, and INTAKE.md, quoting the verified SHAs. It must not touch code, tests, Jira, or branches, and must not create anything yet. It hands the draft to the developer at G4, the human gate that authorizes both publish and PR creation.

**9. Publish.** After G4 is recorded in RUN.md's gates log as `PUBLISH_AND_PR` or `PUBLISH_ONLY` (checked as step 0 of the sequence below), the workspace agent preflights every repository — push destination, current branch, current HEAD, current default branch, and the VERIFICATION.md SHA — against the tuple approved at G4 (`G4_STALE` on drift, `REVERIFICATION_REQUIRED` on a HEAD mismatch; either STOP pushes nothing for any repository), then, only once every repository passes, pushes the explicit verified commit object per repository (`git push origin <verifiedSHA>:refs/heads/<branch>`, never a branch name, never force), and records the outcome in WORKSPACE.md's Publish section. It hands forward the pushed branch and its confirmed remote SHA.

**10. PR.** The pr agent requires the Bitbucket read capability (otherwise it creates no PR and reports the blocking condition), then, per repository, before any Bitbucket read or write for that repository, checks eligibility: VERIFICATION.md says PASS, G4 is recorded in RUN.md as `CURRENT` and `PUBLISH_AND_PR`, WORKSPACE.md's remote SHA equals the verified SHA, and the target branch is the default branch WORKSPACE.md recorded. An ineligible repository is recorded `BLOCKED (<condition>)` and receives no Bitbucket read or write. For an eligible repository, it reads existing PRs for the source branch and re-reads the current remote source-branch SHA (required immediately before creating and immediately before recording an existing PR as reused). The re-read SHA must equal the verified SHA and the G4 verified SHA before either outcome; a mismatch is recorded `BLOCKED (SHA mismatch)` and nothing is created or reused. An existing PR is recorded `REUSED_EXISTING` only when repository, source branch, target branch, and state OPEN all match the G4 tuple; otherwise it is recorded `EXISTING_PR_MISMATCH`, naming every mismatching field (target, state), and nothing is created or modified for that repository. Only when no existing PR is found does it create one. The target branch is always the default branch WORKSPACE.md recorded, never assumed. It must not merge, approve, decline, or create a branch. It hands forward PR.md with, per repository, the outcome (`CREATED`/`REUSED_EXISTING`/`BLOCKED`), the PR URL where applicable, and the SHA it created or reused the PR against.

## Gates

Gates are asked by the pipeline orchestrator (stage agents cannot ask questions); each answer is recorded in RUN.md's gates log.

**G1 — Repositories.** Asked after Intake produces a recommendation. Question: "Which repositories does this work affect? Recommended: `<repo>` (confidence, evidence) [, ...]. Select the repositories to include." Options: each inventoried repository (multi-select) plus free text for one not listed. Recorded: the recommendation as given, the developer's selection, whether each selected repository was agent-recommended, the **basis** (the INTAKE.md round reviewed), and **status** `CURRENT` (or `STALE` once that basis is superseded).

**G2 — Branch and context.** Asked immediately after G1. Question: "Proposed branch name: `<PRIMARY>-<slug>`. Accept or provide a replacement slug. Optionally add context (constraints, known files, things to avoid, discussion with another developer) — or continue without adding context." Options: accept / edit slug; free-text context or explicit skip. Recorded: final branch name, developer context verbatim (or `provided: false`), the **basis** (the INTAKE.md round reviewed), and **status** `CURRENT` (or `STALE` once that basis is superseded).

**G3 — Plan approval.** Asked once the adversary returns APPROVE (or the developer decides after a second REVISE/BLOCK, see STOP catalogue), voiced directly from PLAN.md's Decision summary and ADVERSARY-REVIEW.md's verdict, `cycle.round`, and Residual findings — not filtered through the Planner. Exact wording:

> "The plan for `<PRIMARY>` (cycle `<c>`, round `<r>`; change class `<SMALL|MEDIUM|LARGE>` — `<one-sentence rationale from PLAN.md's Scope>`) has been reviewed (`<verdict>`). Intended outcomes: `<summary text>`. Material choices needing your answer: `<Q-id: statement — recommended: <recommendation>; if wrong: <consequence>>` [, …] or none. Exclusions and unresolved scope: `<item: disposition — reason>` [, …] or none. Consequential assumptions: `<n>` (`<ids>`). Accepted risks: `<list>` or none. Cross-repository prerequisites: `<line>` or none. Adversary residual findings: `<id, severity: one line>` [, …] or none. For each material choice, accept the recommendation or give a replacement. Then: Approve this plan as displayed to proceed to test authoring / Send back with answers / Abort."

Options: Approve as displayed (valid only when every material choice accepts the recommendation) / Send back with answers (starts a new planning cycle) / Abort run. Recorded: the answer as exactly one of `APPROVE` / `SEND_BACK` / `ABORT`, each material choice's answer, exclusions acknowledged, the **basis** (the PLAN.md `cycle.round` and the ADVERSARY-REVIEW.md `cycle.round` reviewed), and **status** `CURRENT` (or `STALE` once that basis is superseded). Only an `APPROVE` answer with status `CURRENT` authorizes stage 5. A `SEND_BACK` answer starts a new planning cycle (see Bounded loops, below): the prior PLAN.md and ADVERSARY-REVIEW.md are marked SUPERSEDED and dependent gate answers `STALE` in the same RUN.md edit, `planner` is invoked with the G3 entry named as a `[DEV]` input, then `adversary`, then G3 is re-asked on the resulting plan.

**G4 — Publish and PR.** Asked after PR draft, showing the PR description, the diff summary, and, per repository, the approved tuple: directory, push destination (from WORKSPACE.md), source branch, verified SHA (from VERIFICATION.md), and target (default) branch (from WORKSPACE.md). Question: "Verification passed for `<repos>` at `<SHAs>`. Publish these branches and open the pull request(s)?" Options: Approve publish and PR / Approve publish only / Abort. RUN.md records the answer as one of `PUBLISH_AND_PR`, `PUBLISH_ONLY`, `ABORT`, **and** the per-repository tuple shown and approved. Stage 9 (Publish) runs for either `PUBLISH_AND_PR` or `PUBLISH_ONLY`; stage 10 (PR) runs only for `PUBLISH_AND_PR`. Recorded: developer answer, the per-repository tuple, timestamp only if a tool produced one, the **basis** (the VERIFICATION.md round, the PR-DESCRIPTION.md round, and the per-repository tuple reviewed), and **status** `CURRENT` (or `STALE` once that basis is superseded).

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
| `RUN_KEYS_MISMATCH` | On resume, the requested Jira keys differ from the keys recorded in RUN.md for this run | developer (re-run with the recorded keys, or start a new run with a different primary) |
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
| `PRESERVATION_BASELINE_FAILED` | A PRESERVATION test fails against the current code and the failure is not a test defect | developer (reclassify the test WITNESS, exclude it from the contract, or abort) |
| `RUNNER_UNAVAILABLE` | A meaningful test/build execution could not be obtained: the runner cannot launch, required tooling/dependencies cannot be obtained in the environment, required external infrastructure is unavailable, or another environment condition prevents a valid result (contract A6; an assertion failure, a compile/build failure caused by the code, or a legitimate RED is never `RUNNER_UNAVAILABLE`) | developer (fix the environment and resume; no RED, GREEN, or PASS is recorded) |
| `TEST_CHANGE_REQUESTED` | The developer needs a contract test changed mid-implementation | developer (approve or reject the change request) |
| `ADVERSARY_BLOCK` | The adversary verdict is BLOCK | developer (decide how to proceed; plan cannot advance on BLOCK alone; redirecting the planner starts a new planning cycle) |
| `ADVERSARY_REVISE_LIMIT` | A second REVISE verdict is reached (round budget exhausted for the current planning cycle) | developer (accept the plan as-is, redirect the planner manually — starts a new planning cycle — or abort) |
| `VERIFIER_FAIL_LIMIT` | Verifier/developer: one initial verification plus at most two fix rounds; `VERIFIER_FAIL_LIMIT` is raised on the third FAIL | developer (abort, or manually intervene outside the pipeline) |
| `TEST_REVIEW_REVISE_LIMIT` | The test contract still has a HIGH finding after one automatic Tester correction round (round budget exhausted for stage 5b) | developer (redirect the tester — one explicit, bounded human-directed round — proceed with the affected clause(s) recorded `NOT_VERIFIED` as a proof-defect authorized exception, or abort) |
| `VERIFICATION_INCOMPLETE` | Verification is `INCOMPLETE`: every runnable check passed and the review-basis check held, but one or more required clauses are `NOT_VERIFIED` (environment or proof defect) | developer (close the gap and resume at stage 5 for those clauses, change the requirement through planning, or abort; recovery is always via stage 5 → 5b → (6) → 7, never stage 7 alone; G4 is never asked on `INCOMPLETE`) |
| `G4_NOT_RECORDED` | Publish step 0 finds no G4 answer of `PUBLISH_AND_PR` or `PUBLISH_ONLY` in RUN.md's gates log | developer (ensure G4 is recorded, then resume publish) |
| `REVERIFICATION_REQUIRED` | Publish step 1 preflight: current HEAD does not equal the verified SHA in VERIFICATION.md for a repository | developer (re-run verification; nothing is pushed for any repository) |
| `G4_STALE` | Publish step 1 preflight: push destination, current branch, or current default branch no longer matches the tuple approved at G4 for a repository | developer (re-approve at G4 after review; nothing is pushed for any repository) |
| `PUSH_FAILED` | `git push origin <verifiedSHA>:refs/heads/<branch>` fails for a repository | developer (diagnose and decide whether to retry) |
| `REMOTE_SHA_MISMATCH` | `git ls-remote --heads origin <branch>` does not resolve to the verified SHA after push | developer (investigate before any PR is created) |

## Bounded loops

- Adversary/Planner: at most two rounds per planning cycle; a new cycle starts only on an explicit developer decision and is never automatic. A second REVISE, or any BLOCK, escalates to the developer (`ADVERSARY_REVISE_LIMIT` / `ADVERSARY_BLOCK`) rather than looping again within that cycle. A new planning cycle starts only on a G3 `SEND_BACK` or a developer's "redirect the planner" choice at `ADVERSARY_REVISE_LIMIT`/`ADVERSARY_BLOCK`; each cycle has its own two-round allowance, and starting one marks the prior PLAN.md/ADVERSARY-REVIEW.md SUPERSEDED and their dependent gate answers `STALE` (R8). When a redirection adds a repository, `pipeline` re-asks G1 for that repository; in the same RUN.md edit it records stage 2 as `INCOMPLETE — <repo> pending preparation` in the Stage status table (stage 2 is COMPLETE only once WORKSPACE.md records `PREPARED` or `REUSED_EXISTING` for every repository in the CURRENT G1 selection), then runs stage 2 for the added repository before the new planning cycle — `planner` is never invoked while that repository remains incomplete, and a plan never adds a repository.
- Verifier/developer: one initial verification plus at most two fix rounds; `VERIFIER_FAIL_LIMIT` is raised on the third FAIL.
- Test-change requests are never looped automatically: each one is a single STOP and a single human decision.
- Tester RED proof: at most two correction attempts per WITNESS test before `TESTS_NOT_RED`; a failing PRESERVATION test is diagnosed (test-defect corrections share the same two-attempt budget) and a baseline failure is one STOP and one decision, never a loop.
- Adversary/Tester (test review): one initial review plus at most one automatic correction round; `TEST_REVIEW_REVISE_LIMIT` on the second REVISE; a human-directed round is explicit and bounded, never an automatic reset.
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

There is no separate run-state machine: resumability comes entirely from the artifacts already on disk, tracked in RUN.md's Artifact history. On `/pipeline <KEYS>` with an existing run directory, the orchestrator reads RUN.md and lists which of the **twelve** artifacts (INTAKE.md, WORKSPACE.md, PLAN.md, ADVERSARY-REVIEW.md, TEST-CONTRACT.md, RED-REPORT.md, TEST-REVIEW.md, IMPLEMENTATION.md, VERIFICATION.md, PR-DESCRIPTION.md, PR.md, plus RUN.md itself) are present, missing, incomplete, or recorded as failed. The requested key list must equal RUN.md's Keys, otherwise:

```text
STOP [RUN_KEYS_MISMATCH]: The requested Jira keys differ from the keys recorded in RUN.md for this run.
Decision needed from: developer.
Re-run with the recorded keys, or start a new run with a different primary.
```

Otherwise, it proposes resuming at the earlier of (a) the first missing, failed, or incomplete artifact and (b) the first gate in G1–G4 with no `CURRENT` answer (none recorded, or `STALE`) — never at an arbitrary later stage — and the developer confirms or chooses to start over. WORKSPACE.md is incomplete whenever it lacks a `PREPARED` or `REUSED_EXISTING` status for a repository in the CURRENT G1 selection, whatever the Stage status table says, so a repository added at G1 returns the run to stage 2 before any planning; a repository whose preparation recorded `FAILED` or `BLOCKED` is a failed artifact under (a) as before. **TEST-REVIEW.md missing or SUPERSEDED resumes at stage 5b; TEST-CONTRACT.md superseded by a correction or by a recovery decision resumes at stage 5.** **Stage 6 cannot start, and G4 cannot be asked, without a current test review or on a verification `INCOMPLETE`; recovery from `INCOMPLETE` returns to stage 5 and never to stage 7 alone.** A stage agent is never re-invoked to silently regenerate an artifact that already exists — except the authorized regenerations under contract A6 (planner round 2, developer fix rounds, tester amendments and RED re-proofs, verifier re-runs, tester correction rounds and test re-reviews, and a developer-directed planning cycle), each recorded in RUN.md's Artifact history with the prior version marked SUPERSEDED; an existing artifact is treated as an immutable input unless the developer explicitly asks for it to be redone (which is itself a G3/G4-style decision, recorded in RUN.md). Redoing an artifact marks every later-stage artifact SUPERSEDED in RUN.md's Artifact history, and, in the same RUN.md edit, marks every gate answer whose basis names a superseded artifact `STALE`; a `STALE` answer is never treated as an approval and the gate is re-asked before any later stage runs, producing a new `CURRENT` entry. Those later stages run again; a SUPERSEDED artifact is never used as an input by any agent — except `planner`, which reads the immediately prior PLAN.md/ADVERSARY-REVIEW.md revision as the prior plan on a revise round or a new cycle. For G3 specifically, a `CURRENT` answer means a `CURRENT` `APPROVE`: a `SEND_BACK` or `ABORT` entry, even if recorded `CURRENT`, never counts as an answered gate for rule (b) above. An artifact whose every recorded version is SUPERSEDED counts as missing for rule (a) above. An interrupted planning cycle resumes at stage 2 when a newly added repository is not yet prepared, at stage 3 when the replacement plan does not yet exist, and at stage 4 when the replacement plan exists but its review does not — never at stage 5 or later against a superseded plan.

## Illustrative transcript (two repositories)

```text
> /pipeline PAY-4821
Intake: recommends payments-api (HIGH), payments-web (MEDIUM).
G1 — Which repositories does this affect? [payments-api, payments-web selected]
G2 — Branch: PAY-4821-retry-failed-webhooks. Accept? [accepted, no extra context]
Workspace: payments-api PREPARED @ a1b2c3d; payments-web PREPARED @ 9f8e7d6.
Plan drafted (cycle 1.1). Adversary: APPROVE (1.1).
G3 — Plan reviewed (cycle 1.1; change class MEDIUM — two repositories change, with no interface between them added or altered) (APPROVE). Intended outcomes: ... Material choices: none. [Approve this plan as displayed]
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
