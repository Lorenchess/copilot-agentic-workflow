---
name: pipeline
description: Deliver a ticket through planning, fresh audit, locked tests, implementation, candidate verification, fresh review and human-controlled publication. Owns routing, candidate freshness and eligibility; preserves the installed gate and AC formats.
menu-description: plan, prove, review and prepare a ticket for publication
---

# Pipeline — revision 2.1 candidate

This is a proposed replacement contract, not an installed or runtime-validated pipeline. Read the adoption prerequisites in `../WORKPLACE-PORT.md` before enabling it. Existing scripts retain their actual interfaces; this prose does not upgrade their guarantees.

**Evidence, review and permission must describe the same candidate.** A check result is not publication permission. No agent merges a pull request.

Read `principles`, `prove-it` and `ac-matrix` before driving a run. Investigation and behavior-preserving work use their own playbooks through `rstack-mode`; do not manufacture red tests for documentation. A ticket without a falsifiable criterion and a person who can settle it stops at planning.

## Ownership

| Concern | Owner |
|---|---|
| States, routing, candidate freshness, review/release predicates, fresh dispatch | this file |
| Artifact shape, result envelope, evidence rounds | ../references/handoff-contracts.md |
| Write lanes, locks, exceptions | ../references/write-boundaries.md |
| Authorization and external actions | ../references/approvals.md |
| Universal evidence/trust/safety rules | ../rules/standing-rules.instructions.md |
| Script limits and gate adapter | ../references/harness-map.md |
| Topology, depth, interview, optional memory | the corresponding reference |
| Role procedure | the role's agent file |

## States

| State | Owner | Required result/evidence |
|---|---|---|
| 0 preflight | orchestrator | READY or NEEDS_HUMAN; inspect starting context and adopted host profile |
| 1 plan | planner | PLAN_READY; ticket, revisioned plan, seeded AC matrices |
| 1b audit | fresh plan-auditor | holds / holds-with-conditions / refuted / undetermined |
| 1r revise | planner | PLAN_READY; revised plan and response to every finding |
| 2 red | tester | RED_LOCKED; discriminating red and lock, or named blocker |
| 3 implement | dev | UNITS_GREEN or STOPPED; production edits and structured result |
| 4 verify | tester | complete execution record; locked-test, suite and AC outcomes separately |
| F freeze | approval, freeze mode | CANDIDATE_FROZEN or a named blocker; candidate and source comparison |
| 5 review | fresh reviewer-architect | CLEAN / CHANGES REQUESTED / INPUT_BLOCKED |
| 6 release | approval, release mode | RELEASE_ELIGIBLE / RELEASE_EXCEPTION / RELEASE_BLOCKED |

Every ticketed behavior-change run gets audit and independent review. Risk tier never removes a state. Verification-only units perform state 3 as an explicit no-code result and still reach review; do not create an empty commit just to manufacture a candidate.

## Routing

The orchestrator dispatches all automated states. Roles return a structured result envelope; the driver saves it verbatim in logs/results/<N>.md and links it from the run log. An envelope records a report, not independent proof. Required evidence must exist before advancing.

| From/result | Next |
|---|---|
| 0 READY | 1 |
| 0 NEEDS_HUMAN | wait for the named decision, then repeat affected preflight |
| 1 PLAN_READY | new invocation of 1b |
| 1b holds | 2 |
| 1b holds-with-conditions or refuted | 1r, then a new 1b on the revised plan |
| 1b undetermined or unavailable | stop for resolution; no audit-bypass path in this candidate |
| 1r PLAN_READY | new 1b; a response checker does not independently approve a changed plan |
| 2 RED_LOCKED | 3 |
| 3 UNITS_GREEN | 4 at WORKTREE |
| 4 at WORKTREE, complete and locked tests passed | F; carry every other failure and gap forward visibly |
| F CANDIDATE_FROZEN | 4 at candidate, full by default |
| 4 at candidate, REVIEW_ELIGIBLE | 5, including observed nonlocked failures or unresolved AC evidence |
| 5 CLEAN | 6, or full candidate verification first under the scoped-review option |
| 5 CHANGES REQUESTED | Act on → dev; Risks → tester; code/test/plan change invalidates candidate and returns through affected states, F, 4 and a new 5 |
| 5 INPUT_BLOCKED | repair missing/inconsistent inputs; dispatch a new reviewer |
| 6 RELEASE_ELIGIBLE | distinct human decision for each external action |
| 6 RELEASE_EXCEPTION | explicit exception decision and then distinct publication decisions; never call it a clean pass |
| Any execution still running or outcome unknown | stop advancement; reconcile that execution before any replacement execution |
| Any malformed handoff, merge conflict or human-owned blocker | stop and name the missing fact/decision |

A candidate verification failure owned by production goes to dev, a test problem goes to tester, and a criterion/scope problem goes to planner. Review may diagnose complete known-failing evidence; it cannot authorize release. Never loop on a known pre-existing failure merely to turn it green.

**Scoped review option:** only when selected in the estate adoption record: candidate scoped verification → review → full verification at the same candidate → release evaluation. Full verification must include every locked executable check and the repository's full command. New or materially different evidence after review invalidates that review even if source commit stayed the same. Re-review the updated packet; never silently replace its artifacts.

## Candidate identity

Record in `candidate.md`:

- repository identity, canonical Git root and branch;
- exact full source commit and tree;
- resolved full comparison-base commit, and integrated default-branch commit;
- plan revision plus content digest;
- actual lock path(s) plus content digest(s), obtained from the real lock implementation;
- proof configuration: command, execution checkout, relevant profile/environment/dependency inputs;
- complete changed-path list and base-to-candidate patch, including deletions and renames.

A lock revision identifier is not presumed to exist. Use the real lock's identity if it provides one; otherwise record its actual files and independently computed byte digests. Unknown lock location/coverage is an adoption blocker, not an invented field.

Freeze after working-tree feedback. Commit only approved ticket content, integrate before final verification, and then verify the resulting candidate. If no source changes exist, reuse the exact existing commit after confirming it is the intended candidate. Do not claim an earlier dirty-tree run verified the new commit.

**Candidate execution requires committed candidate inputs.** HEAD equality and clean ticket paths are insufficient. All tracked execution inputs must match the commit; untracked source/configuration that can affect execution is excluded. Declare necessary ignored/generated dependencies and environment inputs, with their provenance and limits. An unchanged dirty-tree digest proves stability only.

Preserve unrelated work outside the execution tree until verification and review finish, or use a separately prepared clean checkout of the same active repository. No sibling repository becomes writable. Record where execution actually occurred. A host that cannot establish this basis must not report candidate verification.

Evidence lives outside the source commit. Keep the established AC column `sha`; use the full candidate commit as its value. Do not commit evidence to its own evaluated commit. Previously tracked run artifacts require a reviewed migration; ignore rules do not untrack them.

## Freshness

A source/plan/lock/proof-configuration change invalidates verification, review and publication decisions. Re-freeze, reverify and re-review; do not re-stamp an old result.

Review also binds the exact evidence packet by digest. Rerunning a check at unchanged source produces new evidence, not permission to overwrite the packet a reviewer assessed. Archive prior artifacts and earn a new review when the relied-on evidence changes.

Recheck actual Git/input state at execution start/end, before review, and before publication. Two samples do not prove no intermediate mutation, and agent-written markers are not host attestations.

If the remote default moves, record its exact ref. No path overlap allows a policy-approved publication of the reviewed branch, not a claim that integration was tested. Overlap requires a human decision; integrating creates a new candidate. Path disjointness is not semantic independence.

## Eligibility

`REVIEW_ELIGIBLE(C)` requires:

1. candidate identity and execution basis established;
2. current plan audit is holds;
3. lock verification succeeds and every locked executable check has attributable executed/passed evidence;
4. the verification execution completed with known outcomes (scoped only under the selected option);
5. complete tester-assembled review-packet.md, current impact facts, and every failure/missing AC proof disclosed.

A full suite's observed **nonlocked** failures or an INCONCLUSIVE AC need not prevent review. They prevent normal release. A waiver does not create review eligibility. A locked failure, missing execution result or missing comparison packet blocks review eligibility.

`RELEASE_ELIGIBLE(C)` additionally requires:

- full candidate suite passed; every AC is VERIFIED at L4+ at C;
- real AC checker succeeds for every ticket without disabling SHA checks;
- current independent review is CLEAN with empty Act on and Risks and names the exact packet;
- real gate JSON is PASS, with no accepted or unaccepted observation gaps;
- sibling/boundary checks have no outstanding violation;
- no unresolved human-owned decision, and the candidate still matches all relied-on evidence.

`RELEASE_EXCEPTION(C)` is a proposed, explicitly qualified release route, never normal eligibility:

- all review, candidate, lock, boundary and AC requirements above still hold;
- the estate has explicitly enabled the relevant exception policy;
- either complete full-suite evidence has only independently substantiated, individually enumerated pre-existing **nonlocked** failures, or a specifically permitted gate-observation gap has a valid human decision;
- all other obligations pass; no unknown execution, incomplete scope, stale/malformed identity, locked failure or below-L4 AC can be waived;
- human decisions, replay evidence and limitations are explicit in approval and publication records.

The current gate's `proceedable` bit alone is insufficient: screenshots show it does not establish full failure coverage and can coexist with unaccepted observations. See `../RUNTIME-PATCH-PLAN.md`. If the stronger conditions cannot be demonstrated, remain RELEASE_BLOCKED.

An accepted gate observation is about a missing capture fact, not an AC proof waiver. A note beginning `waiver:` in an AC row does not make the shown AC CLI accept a below-L4 row.

## Gate compatibility and recovery

Preserve the shown `PASS | BLOCKED | HELD` interface and exit codes; never redefine them as the predicates above.

- PASS: script checks passed and no unaccepted inferred rung remains. It may still contain accepted gaps or optional OTel NO_CLAIM.
- BLOCKED: one or more checks failed. Read all failed and inferred items, not just the top-level verdict.
- HELD: checks passed, but at least one inferred rung is unaccepted. It does **not** mean an execution is still running.
- Exit 2/invalid JSON/missing required fields: tool error or unusable result; no advance.

Record raw gate output. Do not override it with optimistic prose. Gate evaluation for review and release is separate: a BLOCKED AC or full-suite result can accompany a diagnostic review, never a clean release.

Pending/lost execution is recorded separately as execution status, not recast as the gate's HELD. Recover attributable original output when possible; otherwise obtain an authorized replacement run after accounting for the old process and side effects. No parallel duplicate test runs or publication retries after an unknown outcome.

## Fresh dispatch

Auditor and reviewer are new isolated invocations. Pass issue keys, state/mode, repository identity, exact artifact paths, and verification target/scope where relevant. Do not send implementation reasoning, confidence, earlier review conclusions or learnings.

Auditor receives ticket, plan and AC intent. Reviewer receives candidate, review packet, plan/AC intent, exact evidence, tests and source/base material. These are allowlisted facts, not a driver's engineering summary. If excluded reasoning or prior conclusions enter the invocation, report contamination and request a new invocation; ignoring text does not erase exposure.

Model diversity is optional. Host isolation and actual granted tools must be observed before claiming enforcement. Manual handoffs never enter fresh audit/review roles.

## Loops, batching and reporting

Track blocker identity and turn count. Three consecutive turns with unchanged blockers → ask the human with the three results. No budget turns an unproven criterion into a pass. When the human is unavailable, report and stop.

One active writable repository per run. Related tickets may share source candidate, lock, suite and review; keep a separate AC matrix for each ordered key and validate all. Resolve paths through the actual runtime; do not duplicate a parser in prose.

Human checkpoints include scope decisions, boundary exceptions, amendments, freeze commit, conflicts, re-integration, enabled exceptions, each external effect and convergence. Silence is not permission. No agent merges a PR.

Final report: unproven items first, then per-AC proof, review and candidate/packet identity, raw gate outcome including accepted gaps/NO_CLAIM, loop counts, user-work restoration status, and the single next human decision. Never equate fewer instructions with demonstrated behavioral improvement.
