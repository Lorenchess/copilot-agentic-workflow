# RSTACK Evaluation Labeling Guide

## Purpose

This guide standardizes how humans and AI evaluators label Planner claims, Auditor findings, Reviewer findings, and related evaluation records.

Its purpose is to reduce evaluator drift and make cross-run comparisons meaningful.

AI-judge output is never ground truth by itself.

## Core principle

Label the **claim or finding that was actually made**, against the **evidence available for the same subject/snapshot**, at the **strength asserted**.

Do not repair a weak claim in your head and then label the repaired version.

---

# 1. Planner claim labels

## SUPPORTED

Use when the cited/available evidence establishes the material claim at the strength stated.

A claim can be supported even if another design is possible.

## CONTRADICTED

Use when primary evidence directly establishes that the material claim is false for the relevant snapshot.

Example:

Planner: "No production callers use method X."

Evidence: a production path invokes X.

## UNSUPPORTED

Use when the claim may be true, but the evidence does not establish it.

Common case:

A limited search returns no matches and the Planner converts that into a universal absence claim.

`UNSUPPORTED` is not the same as `CONTRADICTED`.

## ASSUMPTION

Use when the Planner explicitly identifies a proposition as an assumption to be verified/accepted later.

An explicit assumption is not automatically a Planner defect.

It becomes a problem if the plan depends materially on it while treating it operationally as settled.

## HUMAN_DECISION

Use when the proposition is not discoverable from repository evidence because it requires product/business/risk/design intent from an authorized person.

## NOT_MATERIAL

Use only when the statement does not materially affect scope, implementation, verification, safety, release, or the evaluation question.

Do not use this label to avoid resolving a difficult material claim.

## UNRESOLVED

Use when evidence is missing, conflicting, inaccessible, stale, or otherwise insufficient to classify confidently.

---

# 2. Auditor / Reviewer finding disposition

A finding has two independent dimensions:

1. **validity**
2. **materiality**

Do not merge them.

## TRUE_POSITIVE

Use when:

- the finding describes a real issue,
- evidence supports it for the relevant snapshot,
- and the issue is within the evaluator's intended review scope.

A true positive can still be LOW materiality.

## FALSE_POSITIVE

Use when the finding's asserted defect is not supported, is factually wrong, or misreads the evidence.

Do not label a finding false merely because the team chooses not to fix it.

## DUPLICATE

Use when the finding repeats an already-accounted-for issue without adding new decision value.

A duplicate may still be factually correct.

## NON_MATERIAL

Use when the observation is real but does not materially affect the decision under the governing requirements/risk policy.

## UNRESOLVED

Use when available evidence cannot establish validity.

This is preferable to forcing TRUE_POSITIVE/FALSE_POSITIVE.

---

# 3. Finding type

Use one primary type where possible.

## CONTRADICTION

The reviewed artifact contains a factual premise directly contradicted by evidence.

## UNSUPPORTED_CLAIM

The artifact asserts more than its evidence establishes.

## MATERIAL_OMISSION

A required or consequential concern is missing.

## SCOPE_ERROR

The artifact includes unauthorized work or omits demonstrably required work.

## REQUIREMENT_ERROR

A requirement or acceptance criterion is misunderstood, changed, or not represented correctly.

## EVIDENCE_SCOPE_ERROR

A search/probe/test result is generalized beyond the scope actually observed.

## SNAPSHOT_MISMATCH

The compared evidence refers to different repository/ticket/candidate states.

## TEST_PROOF_GAP

Tests do not discriminate the required behavior sufficiently.

## REGRESSION

A change breaks behavior that remains required.

## WRITE_BOUNDARY_VIOLATION

A role modifies a path/artifact it does not own.

## STALE_EVIDENCE

Evidence is treated as valid after its subject changed.

## DESIGN_DISAGREEMENT

The evaluator prefers another implementation but has not established a factual/requirement/control defect.

A pure design disagreement is not automatically a blocking finding.

## OTHER

Use sparingly and include a proposed taxonomy change only if the distinction recurs.

---

# 4. Materiality labels

Materiality answers:

> If this issue is real, how much does it matter to the engineering/release decision?

Suggested starting labels:

## CRITICAL

Potential unauthorized or unsafe external effect, wrong-candidate publication, severe security/compliance impact, or loss of control.

## HIGH

Materially changes correctness, required scope, verification validity, or release eligibility.

## MEDIUM

Causes meaningful rework, maintainability/reliability risk, or quality loss but is not independently release-critical.

## LOW

Real but limited decision impact.

## UNRESOLVED

Materiality cannot yet be established.

Materiality must be justified with the requirement/control/outcome affected.

---

# 5. Human validation labels

Human validation is separate from AI-judge disposition.

Suggested labels:

- `HUMAN_CONFIRMED`
- `HUMAN_REJECTED`
- `HUMAN_MODIFIED`
- `HUMAN_UNRESOLVED`
- `NOT_REVIEWED_BY_HUMAN`

When a human changes a label, preserve:

- original evaluator output,
- human label,
- rationale/evidence,
- timestamp,
- validator identity in the approved internal system.

Do not overwrite history.

---

# 6. Resolution labels

Resolution records what happened after the issue was surfaced.

Suggested values:

- `PLAN_CHANGED`
- `TEST_CHANGED`
- `IMPLEMENTATION_CHANGED`
- `REVIEW_CHANGED`
- `WORKFLOW_CHANGED`
- `HUMAN_DECISION`
- `NO_CHANGE_REQUIRED`
- `DEFERRED`
- `UNRESOLVED`

A change being made does not prove the finding was valid.

A valid finding can also resolve as `NO_CHANGE_REQUIRED` if the governing human explicitly accepts the risk/scope.

---

# 7. Provenance

Use the current RSTACK provenance vocabulary where possible.

At minimum keep distinct:

- host-observed,
- tool-observed,
- deterministic derivation,
- agent-reported,
- human-recorded,
- unknown.

Do not upgrade provenance because information "looks reliable."

Examples:

- An agent says it ran a test → AGENT_REPORTED unless a tool/log establishes it.
- A deterministic parser reads a committed SHA → DETERMINISTIC based on the underlying source.
- A person types "I approve" into an artifact → HUMAN_RECORDED, not necessarily authenticated authorization.
- A host-generated approval receipt may provide stronger provenance if the host semantics are verified.

---

# 8. Labeling workflow

For each subject:

1. Bind to the exact run/snapshot/candidate.
2. Read the exact claim/finding.
3. Identify the evidence the author relied on.
4. Inspect primary contradictory/supporting evidence available to the evaluator.
5. Assign claim/finding validity.
6. Assign finding type.
7. Assign materiality.
8. Record resolution separately.
9. Record human validation separately.
10. Preserve uncertainty.

---

# 9. Examples

## Example A — Unsupported, not contradicted

Planner:

> "No other modules call ServiceA."

Evidence:

- search only under `src/main/java/foo`
- sibling modules were not searched

Label:

- claim validity: `UNSUPPORTED`
- finding type: `EVIDENCE_SCOPE_ERROR`

Do not label `CONTRADICTED` unless a caller is actually found.

## Example B — Contradicted

Planner:

> "The endpoint is unused."

Evidence:

- route registration and integration test both invoke endpoint

Label:

- claim validity: `CONTRADICTED`
- finding type: `CONTRADICTION`

## Example C — Design preference

Auditor:

> "Use strategy pattern instead of a conditional."

No requirement, defect, or measurable risk is established.

Label:

- finding type: `DESIGN_DISAGREEMENT`
- disposition: usually `NON_MATERIAL` unless additional evidence establishes material impact

## Example D — Snapshot mismatch

Planner evidence references commit A.
Auditor checks commit B after another change.

Label:

- finding type: `SNAPSHOT_MISMATCH`
- disposition: `UNRESOLVED` until both evaluate the same subject

Do not score the Planner or Auditor against mismatched snapshots.

---

# 10. What not to score directly

Avoid generic "8/10 quality" labels unless a specific experiment proves they are useful.

Prefer decomposed categorical judgments.

Do not infer quality from:

- number of findings,
- length of plan,
- length of prompt,
- number of tests,
- number of files changed,
- number of agent calls,
- speed alone,
- or whether another agent agreed.

---

# 11. Calibration requirement

Before an AI evaluator's labels are used for pipeline decisions:

- evaluate it on human-labeled cases,
- inspect false positives and false negatives,
- record evaluator model/configuration/rubric version,
- and periodically re-run calibration when any of those change.

See `RSTACK-EVALUATOR-CALIBRATION.md` once available.

---

# 12. Ambiguity rule

When two competent evaluators could reasonably disagree because the requirement itself is ambiguous, do not force one to be "wrong."

Classify the issue as:

- `HUMAN_DECISION`, or
- `UNRESOLVED`

and capture the missing decision/evidence.

The evaluation system should reward correct uncertainty, not confident guessing.
