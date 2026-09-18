# Forward patch — compact run summary in Resume notes and optional lesson note (H3 / H1)

**Status: APPROVED FOR IMPLEMENTATION by owner instruction on 2026-09-14 ("continue with the other batches; ChatGPT will review everything done at the end"). ChatGPT's independent review is pending and happens at the end of the batch sequence.** This is the "Optional UX patch — H1/H3 only if useful" of ChatGPT's plan (`docs/reviews/2026-09-14-harness-alignment-analysis-and-implementation-plan.md` §7, §6D). ChatGPT asked that a human first see a normal SMALL run and an interrupted run with the block before keeping it; §4 renders both as **labelled scenarios** so the owner and ChatGPT can judge usability at the end-of-sequence review, and the patch is committed separately so it can be reverted alone.

- **Base:** the Batch B commit (which follows `2634e71`). Locked references `phase-1-reference` … `phase-5-reference` remain immutable. No historical example run record is edited; the scenarios below are new and fictional.
- **Author / role:** Claude 5.1 as architect; Sonnet 5 implements; ChatGPT reviews at the end.

## 1. What this patch is, and is not

It adds two **optional, derived, non-authoritative** conveniences for the human reading RUN.md:

- **A compact summary block inside the existing Resume notes section** (H3), so a returning developer can answer "where are we, what remains, what happens next" without reading twelve artifacts.
- **An optional lesson note on an existing Decision-log entry** (H1), so an incident that reveals a reusable weakness can be flagged for the ledger without an extra question at every STOP.

It changes **no** recovery decision, resume authority, gate, STOP, verdict, budget, tool, artifact set, or role/mode input. The summary never wins against the resume-by-artifact rule or any source check. The lesson note never grants permission, never renews an allowance, never converts a disputed finding into a confirmed false block, and never alters the current run's policy.

## 2. Rules (normative once approved)

**S1 — Placement and shape.** RUN.md's existing **Resume notes** section may begin with a block headed `Summary (derived; not authority)` containing, one line each: `Stage / round` · `Next action` (one sentence, derived from the resume rules) · `Pending decision` (STOP code, `HELD` reconciliation, gate to re-ask, or `none`) · `Open items` (short id + plain-language phrase, grouped: accepted plan risks, verifier disclosures, current `NOT_VERIFIED` clauses, pending delivery effects; ids alone are not enough) · `Basis` (the Artifact-history revision ids and the gate/Decision-log entry ids this summary was derived from). It is labelled for its scope: "open items known to the orchestrator at this basis", never "all open risks".

**S2 — When it is refreshed.** `pipeline` rewrites the block at meaningful boundaries only: a stage handoff, a gate answer, a Decision-log entry, a hold, or a resume. Not at every low-level event. Rewriting several Markdown sections is not atomic persistence; a partially updated summary is one more reason S3 applies.

**S3 — Authority.** On resume `pipeline` still runs the resume-by-artifact rule and the current-basis checks. If the block disagrees, the rule wins and the disagreement is recorded under Resume notes. A run without the block is valid and resumes unchanged. The block is never passed to, or read by, any mode that may not read RUN.md (Tester non-activation modes, Adversary test-review mode, Developer); the invocation header rules are unchanged.

**S4 — Optional lesson note.** A Decision-log entry (STOP decision, `TEST_CHANGE_REQUESTED`, `IMPLEMENTATION_BLOCKED`, delivery continuation, execution reconciliation, or a developer-declared false block) **may** carry two extra fields: `lesson: <one line, or UNASSESSED>` and `lesson class: MISSING_CONTEXT · TOOL_CONTRACT · MISSING_GUARDRAIL · WEAK_VERIFICATION · OTHER (<named>) · NONE_IDENTIFIED · UNASSESSED`, with the evidence source (`[TOOL]`/`[DEV]`/`[INFERENCE]`) and, where inferred, its uncertainty. Default is `UNASSESSED` and requires no question; `pipeline` may propose a class tagged `[INFERENCE]`; only a human confirms it (`[DEV]`), at the STOP or between runs. `NONE_IDENTIFIED` means no reusable weakness was seen so far; it never asserts nothing should change. The note has no control-flow effect. Entry STOPs raised before RUN.md exists get no note. Candidate lessons reach `docs/HARNESS-LEDGER.md` only through the human, disclosure-reviewed path in RUN-AUDIT's "From incident to reviewed lesson".

## 3. File scope

| File | Change |
|---|---|
| `.github/agents/pipeline.agent.md` | Resume notes bullet (S1–S3, concise); Decision log bullet (S4 fields, optional); one sentence in the Procedure's resume paragraph (S3 precedence); nothing in Gates or STOP conditions. |
| `.github/pipeline/AGENT-CONTRACTS.md` | RUN.md template: the same two bullets. |
| `.github/pipeline/FLOW.md`, `.github/skills/pipeline/SKILL.md` | One sentence each in Resume by artifact: a summary block, when present, is derived and yields to the rule. |
| `docs/RUN-AUDIT-AND-IMPROVEMENT.md` | "From incident to reviewed lesson": two sentences — a Decision-log lesson note is the optional in-run origin of a candidate lesson; it stays private until the human generalizes it for the ledger. |

**Unchanged surfaces:** every STOP code and message; G1–G4; all budgets; every `tools:` block; artifact set; role/mode inputs; all Batch A and Batch B text except the four insertion points above; `.vscode/**`; examples; historical specs and reviews.

## 4. Labelled scenarios for the usability judgement (fictional; not run records)

**Scenario U1 — normal SMALL run at stage 7, PASS, awaiting G4.** RUN.md Resume notes would begin:

```text
Summary (derived; not authority)
Stage / round: 7 Verify — verifier run 1 complete; stage 8 PR draft not started
Next action: invoke pr for stage 8, then voice G4 on the draft and the per-repository tuple
Pending decision: none
Open items (known to the orchestrator at this basis):
  - ROLLOUT none; NOTE none (VERIFICATION.md round 1 Disclosures: none)
  - NOT_VERIFIED: none
  - Delivery: not started
Basis: INTAKE.md r1 · PLAN.md 1.1 · ADVERSARY-REVIEW.md 1.1 · TEST-CONTRACT.md anchor a1a1a1a · TEST-REVIEW.md round 1 ACCEPT · IMPLEMENTATION.md round 1 GREEN · VERIFICATION.md run 1 PASS · G1 CURRENT · G2 CURRENT · G3 CURRENT APPROVE
```

**Scenario U2 — interrupted run, held at stage 6 after a lost observation.** RUN.md Resume notes would begin:

```text
Summary (derived; not authority)
Stage / round: 6 Develop — round 1, HELD — unresolved execution H1.2 (payments-api full suite, OBSERVATION_LOST)
Next action: voice the execution reconciliation decision; do not invoke developer until it is recorded
Pending decision: execution reconciliation (Decision log entry D-004, unanswered)
Open items (known to the orchestrator at this basis):
  - RK2 accepted risk: retry backoff configured, not hard-coded (PLAN.md Risks)
  - NOT_VERIFIED: none
  - Allowance reserved (IMPLEMENTATION.md): C 3/6 · D 1/6 · H 1/2 — H1 consumed as failed attempt
  - Delivery: not started
Basis: PLAN.md 1.2 · ADVERSARY-REVIEW.md 1.2 · TEST-CONTRACT.md anchor b2b2b2b · TEST-REVIEW.md round 2 ACCEPT · IMPLEMENTATION.md round 1 IN_PROGRESS · G3 CURRENT APPROVE · Decision log D-004 pending
```

Judgement questions for the reviewer: does each block let a returning developer find the state and next step faster than the Stage status table alone? Does either hide a material item? Does maintaining it add review burden out of proportion? If the answer to the last two is yes, revert this patch alone.

## 5. Acceptance cases (document scenarios)

| # | Case | Required behaviour under S1–S4 |
|---|---|---|
| 1 | Older run with no summary block | Resumes exactly as today; nothing is required. |
| 2 | Block says stage 6, but TEST-REVIEW.md is SUPERSEDED | Resume lands at 5b; the disagreement is recorded under Resume notes; the block is rewritten at that boundary. |
| 3 | G3 `SEND_BACK` | Block shows stage 3 new cycle as next action and the `SEND_BACK` entry in Basis; stale gates appear as pending decisions to re-ask. |
| 4 | Partial delivery: repository A `CONFIRMED`, B `FAILED` | Open items list the per-repository delivery states; pending decision = delivery continuation; nothing in the block authorizes a push. |
| 5 | Terminal `PUBLISH_ONLY` with every publication confirmed and no PR.md | Next action `none — terminal`; the run is not reopened. |
| 6 | Lesson note `UNASSESSED` on an `IMPLEMENTATION_BLOCKED` entry | The STOP's options and routing are unchanged; no question was added; the note is ignored by every stage agent. |
| 7 | `pipeline` proposes `WEAK_VERIFICATION [INFERENCE]` on a false `CONTROLLED_PATH` block | The human restoration and the route are unchanged; the class becomes `[DEV]` only if the human confirms; the ledger row, if any, is written later by a human. |
