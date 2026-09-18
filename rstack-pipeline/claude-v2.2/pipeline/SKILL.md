---
name: pipeline
description: Deliver a ticket through planning, fresh audit, locked tests, implementation, candidate verification, fresh review and human-controlled publication. Owns routing, candidate freshness and eligibility; preserves the installed gate and AC formats.
menu-description: plan, prove, review and prepare a ticket for publication
---

# Pipeline — revision 2.2 candidate

This is a proposed replacement contract, not an installed or runtime-validated pipeline. Read the adoption prerequisites in `../WORKPLACE-PORT.md` before enabling it. Existing scripts retain their actual interfaces; this prose does not upgrade their guarantees.

**Evidence, review and permission must describe the same candidate.** A check result is not publication permission. No agent merges a pull request.

Read `principles`, `prove-it` and `ac-matrix` before driving a run. Investigation and behavior-preserving work use their own playbooks through `rstack-mode`; do not manufacture red tests for documentation. A ticket without a falsifiable criterion and a person who can settle it stops at planning.

## Ownership

| Concern | Owner |
|---|---|
| States, routing, candidate freshness, review/release predicates, fresh dispatch | this file |
| Recovery after an external action whose result is unknown | this file (Unknown external effects); the record shape is in handoff-contracts.md |
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
| 2 red | tester | RED_LOCKED, or STOPPED with a named blocker; discriminating red and lock |
| 3 implement | dev | UNITS_GREEN or STOPPED; production edits and structured result |
| 4 verify | tester | VERIFY_RECORDED when the execution completed with known outcomes, whatever they are; otherwise STOPPED. Execution, locked-check, suite and AC outcomes are separate envelope fields, never folded into the result |
| F freeze | approval, freeze mode | CANDIDATE_FROZEN, CONFLICT, or STOPPED with a named blocker; candidate and source comparison |
| 5 review | fresh reviewer-architect | CLEAN / CHANGES REQUESTED / INPUT_BLOCKED |
| 6 release | approval, release mode | RELEASE_ELIGIBLE / RELEASE_EXCEPTION / RELEASE_BLOCKED |

Every ticketed behavior-change run gets audit and independent review. Risk tier never removes a state. Verification-only units perform state 3 as an explicit no-code result and still reach review; do not create an empty commit just to manufacture a candidate.

## Routing

The orchestrator dispatches all automated states. Roles return a structured result envelope; the driver saves it verbatim in logs/results/<N>.md and links it from the run log. An envelope records a report, not independent proof. Required evidence must exist before advancing.

Where a state has no more specific token, a role that cannot complete returns `STOPPED` with at least one blocker naming its owner. `STOPPED` and `VERIFY_RECORDED` are role results; they are not gate verdicts and never stand in for PASS, BLOCKED or HELD.

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
| 4 at WORKTREE, VERIFY_RECORDED, and either Locked checks FAILED or UNPROVEN, or any failure whose named owner is a role in this run | that owner first (production → 3, test → tester, criterion/scope → 1r); a locked failure nobody owns stops the run |
| 4 at WORKTREE, VERIFY_RECORDED with Execution COMPLETE, Locked checks PASSED and no failure owned by a role in this run | F; carry every remaining failure (not owned by this run, or of UNKNOWN attribution) forward visibly |
| F CANDIDATE_FROZEN | 4 at candidate, full by default |
| 4 at candidate, a failure or missing proof whose named owner is a role in this run | that owner first (production → 3, test → tester, criterion/scope → 1r); do not send a known in-run defect to review instead of fixing it |
| 4 at candidate, REVIEW_ELIGIBLE, remaining failures/gaps not owned by this run or of UNKNOWN attribution | 5, with every such failure, its attribution status and every unresolved AC proof disclosed in the packet |
| 5 CLEAN on a full-verification packet | 6 |
| 5 CLEAN on a scoped packet (scoped-review option only) | 4 full at the same candidate, then a new 5 on the resulting packet, then 6 |
| 5 CHANGES REQUESTED | Act on → dev; Risks → tester; code/test/plan change invalidates candidate and returns through affected states, F, 4 and a new 5 |
| 5 INPUT_BLOCKED | repair missing/inconsistent inputs; dispatch a new reviewer |
| 6 RELEASE_ELIGIBLE | distinct human decision for each external action |
| 6 RELEASE_EXCEPTION | explicit exception decision and then distinct publication decisions; never call it a clean pass |
| 6 RELEASE_BLOCKED | the owner named for each blocker; a human-owned blocker stops the run. Nothing is published |
| Any STOPPED | the owner named in Blockers; a human-owned or unowned blocker stops the run |
| Run stops or ends while approval holds protected user work | report the recorded protection identity and its unrestored status; restoration follows the human's choice under Freshness below. A run never ends silently holding user work |
| Any execution still running, or an external action whose result is unknown | stop advancement; reconcile under **Unknown external effects** below before any replacement execution or any retry; still unknown after reconciliation → `STOPPED` with a human-owned blocker |
| Any malformed handoff, merge conflict or human-owned blocker | stop and name the missing fact/decision |

**Owner first, at both targets** (owner decision on OD-18, 2026-09-17). A verification failure owned by production goes to dev, a test problem goes to tester, and a criterion/scope problem goes to planner, at WORKTREE and at candidate alike, locked or not; the rows above say the same thing and neither target has a second route. Only failures this run does not own (replay-supported pre-existing, environment, human-owned) or whose attribution is UNKNOWN travel to review, and UNKNOWN is disclosed as UNKNOWN: the shown gate does not attribute failures, and a basename match is not attribution. Review may diagnose complete known-failing evidence; it cannot authorize release. Never loop on a known pre-existing failure merely to turn it green.

**Scoped review option:** only when selected in the estate adoption record: candidate scoped verification → diagnostic review → full verification at the same candidate → a new review of the full packet → release evaluation. Full verification must include every locked executable check and the repository's full command. The full run is a new attempt with a new packet, so its digest differs from the one the first reviewer recorded and that review cannot satisfy release, even though the source commit is unchanged. Staleness is decided by digest comparison, not by anyone's judgement of whether a difference is material. Never silently replace a reviewed packet's artifacts. This option therefore costs two reviews; it buys earlier diagnosis, not fewer steps.

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

SOURCE-BLOCKED — the separate-checkout route. The photographed gate resolves its own root and HEAD and shows no root option; the photographed AC checker resolves artifact paths from the repository root; run evidence lives under the active repository's `.rstack/`. How the actual gate, AC checker, lock and tree-digest tools behave when execution happens in a second checkout is not established. Until it is, only the in-place route (protected work held outside the active checkout) is specified by this contract; do not improvise path or root arguments.

Evidence lives outside the source commit. Keep the established AC column `sha`; use the full candidate commit as its value. Do not commit evidence to its own evaluated commit. Previously tracked run artifacts require a reviewed migration; ignore rules do not untrack them.

## Freshness

A source/plan/lock/proof-configuration change invalidates verification, review and publication decisions. Re-freeze, reverify and re-review; do not re-stamp an old result.

Review also binds the exact evidence packet by digest. Rerunning a check at unchanged source produces new evidence, not permission to overwrite the packet a reviewer assessed. Archive prior artifacts and earn a new review when the relied-on evidence changes.

Recheck actual Git/input state at execution start/end, before review, and before publication. Two samples do not prove no intermediate mutation, and agent-written markers are not host attestations.

Protected user work held by approval stays out of the execution checkout while any candidate-dependent activity may still happen. Restoring it contaminates that checkout: a run that resumes afterwards must have the work protected again and the execution basis re-established before further candidate verification, review or release evaluation. So when a run stops before release, restoring now or keeping the work held is the human's choice, asked once with the recorded identity; until answered the work stays held and the report says so. At the end of release evaluation and its external actions, restoration is approval's last act.

If the remote default moves, record its exact ref. No path overlap allows a policy-approved publication of the reviewed branch, not a claim that integration was tested. Overlap requires a human decision; integrating creates a new candidate. Path disjointness is not semantic independence.

## Eligibility

`REVIEW_ELIGIBLE(C)` requires:

1. candidate identity and execution basis established;
2. current plan audit is holds — current means the plan sha256 in the audit's result envelope equals the sha256 of `plan.md` now and the plan digest `candidate.md` records. Revision numbers are for people; they do not decide this. If any of the three digests cannot be obtained, the audit is not current: stop;
3. lock verification succeeds and every locked executable check has attributable executed/passed evidence;
4. the verification execution completed with known outcomes (scoped only under the selected option);
5. complete tester-assembled review-packet.md, current impact facts, and every failure/missing AC proof disclosed.

**Who evaluates.** The orchestrator evaluates `REVIEW_ELIGIBLE` by comparing recorded fields and the presence of required artifacts: the state-4 envelope and test report (Execution, Locked checks), `candidate.md`, the audit verdict and the plan sha256 in its envelope, the packet and its listed immutable inputs. That is comparison, not judgement; whenever deciding needs an opinion about whether evidence is good enough, the question belongs to the tester or the reviewer. The reviewer independently returns INPUT_BLOCKED when its inputs are missing or inconsistent. Approval alone evaluates the release predicates, re-deriving identities and digests itself. All three evaluations are PROSE CONTRACT performed by agents; none is a host attestation.

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

The current gate's `proceedable` bit alone is insufficient. The screenshots leave four gaps open on the exception path, listed in `../references/harness-map.md`: scope/provenance checks are not applied to a waived red suite (R1); `proceedable` is computed without consulting unaccepted observations (R2); `waived_at_sha` is parsed but not checked against the candidate (R3); and failure attribution is a basename occurrence, not a complete failure inventory (R3). See `../RUNTIME-PATCH-PLAN.md`. A waived red suite is still a failed suite. If the stronger conditions cannot be demonstrated, remain RELEASE_BLOCKED.

An accepted gate observation is about a missing capture fact, not an AC proof waiver. A note beginning `waiver:` in an AC row does not make the shown AC CLI accept a below-L4 row.

## Gate compatibility and recovery

Preserve the shown `PASS | BLOCKED | HELD` interface and exit codes; never redefine them as the predicates above.

- PASS: script checks passed and no unaccepted inferred rung remains. It may still contain accepted gaps or optional OTel NO_CLAIM.
- BLOCKED: one or more checks failed. Read all failed and inferred items, not just the top-level verdict.
- HELD: checks passed, but at least one inferred rung is unaccepted. It does **not** mean an execution is still running.
- Exit 2/invalid JSON/missing required fields: tool error or unusable result; no advance.

Record raw gate output. Do not override it with optimistic prose. Gate evaluation for review and release is separate: a BLOCKED AC or full-suite result can accompany a diagnostic review, never a clean release.

Pending/lost execution is recorded separately as execution status, not recast as the gate's HELD. Recover attributable original output when possible; otherwise obtain an authorized replacement run after accounting for the old process and side effects. No parallel duplicate test runs, and no publication retry, after an unknown outcome: the rule below owns that case.

### Unknown external effects

An external action is any externally visible mutation: a push, pull-request creation, a Jira write or transition, a Bitbucket write, a wiki write, or anything else another system can observe. Each action has one publication record in approval.md (`../references/handoff-contracts.md`): the intent written before the attempt, the immutable attempt result, and zero or more appended reconciliation lines, the latest supported one being the current known state. Push, PR creation and each tracker or wiki write are separate actions with separate records; a successful push followed by a failed PR creation is two outcomes, never one `PARTIAL`.

When an attempt's result is not known — a timeout, a lost response, an interrupted session, a tool error after the request may have left the machine, a human-performed action reported but not yet read back — the pipeline never retries it blindly:

1. **Record the attempt** against its intent: action, exact candidate, exact target, the retained command or payload. An intent with no result is an unresolved attempt, not a known failure.
2. **Mark the attempt result `UNKNOWN`.** `UNKNOWN` is not a failure and not a success, and it is never permission to try again.
3. **Reconcile through the target's read interface** and append the conclusion as a reconciliation line with its evidence and provenance and an intent comparison (does the remote object match the authorized candidate, target and content: match, mismatch, or unavailable). Which reads and comparisons apply to each action is the approval role's procedure. An absent object or empty listing establishes failure only when the interface establishes that the earlier request is terminal and had no effect; otherwise the state stays `UNKNOWN`.
4. **If the effect still cannot be established**, stop: during state 6 that is the existing `STOPPED` result with a human-owned blocker naming the action, candidate, target and what was read (state 0's `NEEDS_HUMAN` is the same stop at preflight). The human decides the recovery action and may supply independently checkable evidence; a decision alone does not establish an external fact, and the evidence rules are not relaxed for it.
5. **Preserve the possibility that the first attempt succeeded** throughout: an established matching success is reused, never repeated; an established terminal failure with no successful or unknown remainder may be retried only within still-current authorization; `UNKNOWN` stops advancement and retry; `PARTIAL` resumes only the individually reconciled, unfinished components. A remote object that differs from the authorized intent is a human decision, never an in-place repair or a duplicate creation.

The current known state is the latest supported observation for that action and intent, as of that observation; a newer unsupported statement does not replace it, and it is not an assertion about future remote state — recheck before any dependent action. Every unresolved intent is recovered before any new publication attempt, including after an interruption. Publication outcome, eligibility and gate PASS/BLOCKED/HELD stay separate.

Approval is the sole **agent** publisher and owns publication preparation and reconciliation for either performer, human or agent; other roles cite this rule and do not restate it.

## Fresh dispatch

Auditor and reviewer are new isolated invocations. Pass issue keys, state/mode, repository identity, exact artifact paths, and verification target/scope where relevant. Do not send implementation reasoning, confidence, earlier review conclusions or learnings.

Auditor receives ticket, plan and AC intent, and the plan's path, revision and sha256 as the dispatcher measured them at dispatch. The auditor measures the digest of the file it actually read and returns it in its envelope; a disagreement between the two is a malformed handoff, not something to explain away. Both digests are computed by agents: they bind the audit to bytes, they do not attest who computed them. Reviewer receives candidate, review packet, plan/AC intent, exact evidence, tests and source/base material. These are allowlisted facts, not a driver's engineering summary. If excluded reasoning or prior conclusions enter the invocation, report contamination and request a new invocation; ignoring text does not erase exposure.

Model diversity is optional. Host isolation and actual granted tools must be observed before claiming enforcement. Manual handoffs never enter fresh audit/review roles.

## Loops, batching and reporting

Track blocker identity and turn count. Three consecutive turns with unchanged blockers → ask the human with the three results. No budget turns an unproven criterion into a pass. When the human is unavailable, report and stop.

One active writable repository per run. Related tickets may share source candidate, lock, suite and review; keep a separate AC matrix for each ordered key and validate all. Resolve paths through the actual runtime; do not duplicate a parser in prose.

Human checkpoints include scope decisions, boundary exceptions, amendments, freeze commit, conflicts, re-integration, enabled exceptions, each external effect, an external action whose result stays unknown after reconciliation, restoring protected work when a run stops early, and convergence. Silence is not permission. No agent merges a PR.

Final report: unproven items first, then per-AC proof, review and candidate/packet identity, raw gate outcome including accepted gaps/NO_CLAIM, loop counts, user-work restoration status, and the single next human decision. Never equate fewer instructions with demonstrated behavioral improvement.
