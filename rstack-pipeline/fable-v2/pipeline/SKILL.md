---
name: pipeline
description: Orchestration contract for delivering one ticketed change - plan, fresh plan audit, red-first locked tests, implementation, verification, candidate freeze, fresh review, human-controlled release. Owns states, transitions, loops, candidate identity, review/release eligibility, fresh-role inputs, human checkpoints, and the artifact path map. Everything else lives in one named reference.
menu-description: run a ticket through plan, audit, tests, dev, verify, freeze, review, release
---

# Pipeline — orchestration contract

One invariant:

> **State advances on artifacts bound to a known candidate, never on a report.** No agent writes the thing that judges its own work, and no agent decides the work is finished.

Read `principles`, `prove-it` and `ac-matrix` before driving a run. Route investigation, unticketed bug reproduction and behavior-preserving refactors through `rstack-mode` to their own playbooks; a ticket with no falsifiable criterion and nobody to settle one stops in state 1.

## What this file owns, and what it does not

| Owned here | Owned elsewhere — do not restate |
|---|---|
| states, transitions, loops | artifact schemas → `references/handoff-contracts.md` |
| candidate identity and freshness | who may write which file, test lock → `references/write-boundaries.md` |
| `REVIEW_ELIGIBLE` / `RELEASE_ELIGIBLE` | authorization model, external actions, host approval settings → `references/approvals.md` |
| inputs a fresh role may receive | repository topology → `references/estate-layout.md` |
| when the run stops for a human | evidence rungs and AC verdicts → `prove-it` |
| artifact path map | depth → `references/risk-tiers.md`; memory → `references/learnings.md` |
| | each role's method → that role's agent file |

Guarantee vocabulary (`PROSE CONTRACT`, `SCRIPT CHECK`, `HOST-ENFORCED CAPABILITY`, `HUMAN DECISION`) is defined in `references/harness-map.md`. Unless a line here says otherwise, it is a PROSE CONTRACT.

## States

| # | State | Role | Context | Produces | Result |
|---|---|---|---|---|---|
| 0 | preflight | orchestrator | — | first `run-log.tsv` rows | `READY` · `ASK` |
| 1 | plan | planner | run | `ticket.md`, `plan.md` (revision n), seeded `ac.tsv`, ticket branch | `PLAN_READY` · `NEEDS_HUMAN` |
| 1b | plan audit | plan-auditor | **fresh** | `plan-audit.md` | `holds` · `holds-with-conditions` · `refuted` · `undetermined` |
| 1r | plan revision | planner | run | revised `plan.md`, `plan-audit-response.md` | `PLAN_READY` · `NEEDS_HUMAN` |
| 2 | red | tester | run | tests, `red.txt`, test lock, `test-report.md` | `RED_LOCKED` · `BLOCKED owner=<role\|human>` |
| 3 | implement | dev | run | uncommitted production change | `UNITS_GREEN` · `STOPPED owner=<role\|human>` |
| 4 | verify | tester | run | `suite.txt`, `ac.tsv` rows, `impact.md`, `test-report.md` | `VERIFY_OK scope=<scoped\|full> at=<WORKTREE\|candidate>` · `VERIFY_FAILED owner=<role\|human>` · `INCONCLUSIVE owner=<role\|human>` |
| F | freeze | approval, mode `freeze` | run | candidate commit, `candidate.md` | `CANDIDATE_FROZEN` · `CONFLICT` · `NEEDS_HUMAN` |
| 5 | review | reviewer-architect | **fresh** | `review.md` | `CLEAN` · `CHANGES REQUESTED` |
| 6 | release | approval, mode `release` | run | `approval.md`, human-authorized actions | `RELEASE_ELIGIBLE` · `RELEASE_BLOCKED owner=<role\|human> [proceedable]` |

No risk tier, budget, waiver, verdict or session instruction ("run until done") removes a state. State 5 always runs, including for verification-only tickets.

## Transitions

The orchestrator is the only dispatcher. It selects the next state from this table and the result recorded in the named artifact; it never selects from a role's prose.

| From | Result | Next |
|---|---|---|
| 0 | `READY` | 1 |
| 0 | `ASK` | human, one grouped message, then 1 |
| 1, 1r | `PLAN_READY` | 1b (always a new fresh invocation) |
| 1b | `holds` | 2 |
| 1b | `holds-with-conditions` | 1r, then 2 once `plan-audit-response.md` is complete |
| 1b | `refuted` | 1r, then 1b again |
| 1b | `undetermined`, or auditor unavailable | human. A missing audit is not an inconclusive one; neither is a pass |
| 2 | `RED_LOCKED` | 3 |
| 3 | `UNITS_GREEN` | 4, scoped, at `WORKTREE` |
| 4 at `WORKTREE` | `VERIFY_OK` | F |
| F | `CANDIDATE_FROZEN` | 4, full, at the candidate |
| 4 at candidate | `VERIFY_OK` | 5 when `REVIEW_ELIGIBLE` holds |
| 4 (any) | `VERIFY_FAILED` / `INCONCLUSIVE` | the named owner: dev → 3, tester → 4, planner → 1r, human → stop and ask |
| 5 | `CLEAN` | 6 |
| 5 | `CHANGES REQUESTED` | `Act on` → 3, `Risks` → tester (state 2 rules for the new or amended check), then 4 → F → 4 → 5 on the **new** candidate |
| 6 | `RELEASE_ELIGIBLE` | human checkpoints, one action at a time |
| 6 | `RELEASE_BLOCKED owner=<role>` | that role's state |
| 6 | `RELEASE_BLOCKED proceedable` | HUMAN DECISION; never reported as eligible or as a pass |
| any | `CONFLICT`, `NEEDS_HUMAN`, malformed handoff | stop and ask; name the missing field or the conflicted paths |

**Scoped review option.** Where the full suite is expensive, the human (or the estate's adoption record) may choose `4 scoped at candidate → 5 → 4 full at the same candidate → 6`. Review on scoped evidence is useful; it is never release evidence. Because both results bind to the same candidate, their order does not matter; their identity does.

## Candidate identity and freshness

A **candidate** is the one object that gets verified, reviewed and published:

```text
candidate = repository identity
          + exact source commit (and its tree)
          + approved plan revision
          + test-lock revision
          + proof configuration (suite command; runner/build config is inside the commit)
```

- State F creates it: the approval role commits the ticket's paths as a local commit (a HUMAN DECISION — it is the commit that will ship), integrates the default branch by merge, and records the resulting identity in `candidate.md`. A merge that changes nothing is a no-op; inspect identity, do not assume it moved.
- Evidence **describes** the candidate and lives outside it. No evidence file is committed into the candidate, so recording a SHA never changes the SHA. `ac.tsv` is run evidence, not a committed file.
- Work at `WORKTREE` (the 3↔4 loop) is feedback for dev. It is never cited for eligibility.

**One freshness rule.** An artifact is current only if the candidate it names equals `candidate.md`, and `candidate.md` equals the ticket branch's HEAD with no uncommitted change on ticket paths. When the candidate changes — a fix, a test amendment, a plan revision, an integration that alters content —

- verification evidence is stale,
- semantic review is stale,
- every human publication authorization is stale.

Stale artifacts are re-earned by the state that produces them. Nobody re-stamps a SHA, and re-running tests never revives a review.

At release, if the default branch moved after the candidate was verified and reviewed: no overlap with ticket paths → continue at the candidate and report how far behind it is; overlap → HUMAN DECISION whether to integrate again, which creates a new candidate and returns through 4 and 5.

## Eligibility

Two questions, never one overloaded `PASS`.

**`REVIEW_ELIGIBLE(C)`** — may candidate C receive review?

1. `candidate.md` names C and the freshness rule holds.
2. The plan revision in C is one the audit returned `holds` for, or the revision whose complete `plan-audit-response.md` answers a `holds-with-conditions` audit.
3. The test lock verifies at C.
4. Verification at C returned `VERIFY_OK`: every locked test ran and passed. Scope `full` by default; `scoped` only under the scoped review option.
5. `impact.md` was captured at C.

An AC whose check could not run does not block review; it is carried forward by name and blocks release.

**`RELEASE_ELIGIBLE(C)`** — may exactly C be published?

1. `REVIEW_ELIGIBLE(C)` still holds.
2. `VERIFY_OK scope=full` at C.
3. Every AC row is `VERIFIED` at L4 or better (per `prove-it`) at C.
4. `review.md` is `CLEAN`, names C, and has empty `Act on` and `Risks`.
5. Sibling pin verifies; no out-of-lane write is outstanding.
6. No open question owned by a human remains.

A red suite whose every failure carries a valid pre-existing-failure waiver, or an AC rung a human accepted as unrecorded, yields `RELEASE_BLOCKED proceedable` — never `RELEASE_ELIGIBLE`. Waivers and acceptances are release concerns only: they cannot make a candidate review-eligible, cannot skip state 5, and cannot raise a rung. A locked test cannot be waived.

Each external action additionally needs its own HUMAN DECISION naming C (`references/approvals.md`).

**Who evaluates.** The orchestrator compares recorded fields (PROSE CONTRACT); state 6 re-evaluates `RELEASE_ELIGIBLE` independently before asking the human anything.

ENFORCEMENT DEPENDENCY: a gate that evaluates the two predicates separately against one candidate. The reconstructed `gate.mjs` emits `GATE: PASS | BLOCKED` with an owner and `proceedable`, refuses `PASS` on a scoped run, and takes an agent-typed `--suite-exit`; until its source is inspected, do not map its `PASS` onto either predicate, and treat its output as a SCRIPT CHECK the judged agent ran on itself.

## Loops

- There is no iteration budget that makes an unproven criterion acceptable, and none on tests.
- Track every loop (1b↔1r, 3↔4, 4→F→4→5) by **blocker identity**. Three consecutive turns with no change in what is blocking → stop and put the three results in front of the human. New evidence that does not change the blocker does not reset the count.
- Count turns and report the count. A high count is a metric, not something to hide.
- If you believe a result is wrong, say so in the reply and leave it blocked.
- The human being unavailable ends the run: report and stop.

## Fresh roles

`rstack-plan-auditor` and `rstack-reviewer-architect` are always new invocations. They are never reached by a chat handoff, which would carry context.

| May receive | Must not receive |
|---|---|
| issue key, repository paths | any role's reasoning, confidence or reply text |
| auditor: `plan.md`, `ac.tsv`, `ticket.md` | orchestrator summaries or routing notes |
| reviewer: `candidate.md`, `plan.md`, `ac.tsv`, `impact.md`, test sources, the changed files `candidate.md` lists | `.rstack/learnings.md`, previous rounds' conclusions |
| | a tier raise, a budget result or any other "finding" as prose — if it matters it is in an artifact they already read |

ENFORCEMENT DEPENDENCY: host-created isolated invocations with an input allowlist. Today isolation is the dispatcher's discipline.

## Human checkpoints

The run stops for a human at: phase-0 `ASK` (one message, at most two questions; a forced answer is not a question); planner interview rounds; `undetermined` audit; repository admission; a boundary exception request; a test-lock amendment; a pre-existing-failure waiver; sibling movement the estate check reports; the candidate commit; a merge conflict; re-integration on overlap; `RELEASE_BLOCKED proceedable`; each external action; the convergence stop.

Roles own their questions; the orchestrator relays them verbatim and never answers for the human. What counts as an answer, and how it is recorded, is owned by `references/approvals.md`.

## Artifact path map

Paths are relative to the active repository. Schemas: `references/handoff-contracts.md`. Writers: `references/write-boundaries.md`.

```text
.rstack/runs/<KEY>/
  meta/ticket.md                  meta/decisions.md
  plan/plan.md                    plan/plan-audit.md
  plan/plan-audit-response.md     plan/plan-audit-round<N>.md, plan-audit-response-round<N>.md
  ac.tsv                          candidate.md
  evidence/red.txt                evidence/suite.txt
  evidence/test-report.md         evidence/impact.md
  evidence/suite-waivers.tsv      evidence/observation-accept.tsv
  review/review.md                approval/approval.md
  logs/run-log.tsv
.rstack/learnings.md              experimental, off by default
```

## Preflight (state 0)

Read-only probes first: repository or estate root, working-tree state, artifact protection (`protect-artifacts.sh` writes `.git/info/exclude`, never `.gitignore`), verifier availability. Classify each `GREEN` (say nothing), `HEAL` (fix without asking when no human choice is involved) or `ASK`. At an estate root, repository-scoped probes wait until state 1 resolves the active repo; never probe an arbitrary child. Do not ask the repository question — the planner asks it after reading the ticket.

If the human chooses to stash unrelated work, the stash message names the ticket, its ref goes in `run-log.tsv`, restoring it is the last act of the run, and the reply says whether the pop was clean. Never `stash drop` or `stash clear`.

## Batching

One ticket, one branch, one artifact namespace. Related stories deliberately delivered together may share one branch (named for the first key), plan, candidate, review and PR, with one `ac.tsv` per ticket under its own key; eligibility must hold for every ticket. State 1 and every eligibility evaluation receive the full ordered key list; other states receive the primary key and find the rest in `plan.md` → `Related issues`. Refuse unrelated tickets.

## Replies and the final report

Artifacts are for the next state; replies are for the human deciding what happens next. Verdict first, one fact per bullet, one recommended next action. Read `plainly` first.

The final report leads with what is **not** proven — even when that is "nothing" — then per AC (rung, verdict, artifact), the review verdict, loop counts, the candidate, any waiver or accepted-unrecorded rung in the human's words, and the single next human decision. A skipped check is recorded as `skip: <reason>` and leads the report. Never fabricate a key, commit, link, timestamp, model or verdict.

Satisfy the condition, never the instrument: a check that can be made green by weakening, narrowing, re-labelling or editing its validator is reported as a broken check and treated as unpassed.
