# RSTACK Failure Taxonomy

## Purpose

This taxonomy gives RSTACK evaluations a stable language for classifying failures across runs.

It is a **starting taxonomy for evaluation design**, not proof that every listed failure has occurred in the workplace implementation.

Use it to normalize observed failures, then prune or extend it from evidence.

## Rules

1. A failure category describes **what went wrong**, not who is to blame.
2. Record the phase where the problem originated separately from the phase where it was detected.
3. Materiality is a separate label; do not bake severity into the failure code.
4. A later agent finding is not automatically a confirmed failure.
5. If evidence is insufficient, use `UNRESOLVED`.
6. Host/runtime failures must not be mislabeled as model/prompt failures.
7. Human decisions are not failures merely because automation stopped.

## Common fields for a failure record

A normalized failure record should eventually be able to capture:

- `failure_id`
- `run_id`
- `category`
- `subtype`
- `origin_phase`
- `detected_phase`
- `subject_ref`
- `evidence_refs`
- `materiality`
- `disposition`
- `resolution`
- `human_validation`
- `provenance`

Exact schema ownership belongs in the evaluation design/data dictionary.

---

# P — Planning failures

## P01 — Unsupported material claim

The Planner states a consequential fact without enough evidence.

Example pattern:

> "No callers depend on this method"

when the search scope did not establish that claim.

## P02 — Contradicted material claim

Primary evidence directly conflicts with a Planner claim.

## P03 — Material omission

A requirement, dependency, affected path, integration consequence, or acceptance criterion that should have influenced the plan is absent.

## P04 — Scope error

The plan includes work outside authorized scope or omits work demonstrably inside scope.

## P05 — Human decision represented as discovered fact

The Planner resolves a product/business/design decision that should have been surfaced to a human.

## P06 — Negative-search overreach

The Planner converts "not found in searched scope" into "does not exist."

## P07 — Evidence/claim mismatch

A cited source exists but does not support the strength or exact meaning of the claim.

## P08 — Snapshot mismatch

The plan and the evidence refer to different repository states, ticket revisions, branches, or candidates.

## P09 — Unverifiable plan step

The plan proposes a change without a meaningful way to establish whether it worked.

---

# A — Plan Auditor failures

## A01 — False positive finding

The Auditor reports a defect that the available primary evidence does not support.

## A02 — Non-material finding presented as blocking

The observation may be technically true but does not materially change scope, correctness, safety, verification, or an explicit requirement.

## A03 — Evidence misread

The Auditor cites evidence but interprets it incorrectly.

## A04 — Design disagreement presented as refutation

The Auditor prefers another design but does not establish that the plan violates a requirement, constraint, or factual premise.

## A05 — Snapshot mismatch

The Auditor critiques evidence from a different subject state than the Planner used.

## A06 — Duplicate finding

The finding repeats an already-accounted-for issue without new decision value.

## A07 — Missed material planning defect

A later stage establishes a material planning defect the Auditor could reasonably have detected from the evidence available at audit time.

Do not calculate "Auditor recall" from A07 unless the evaluation corpus supplies sufficiently complete ground truth.

---

# T — Tester / proof failures

## T01 — Non-discriminating test

The test executes relevant code but would also pass for an implementation that violates the acceptance criterion.

## T02 — Unexpected pre-implementation pass

A test intended to prove missing behavior passes before the implementation change, without a justified reason.

## T03 — Acceptance-criterion proof gap

A material AC lacks meaningful proof.

## T04 — Test weakening

Assertions, cases, skip markers, or proof strength are reduced to obtain green status rather than because the requirement changed.

## T05 — Controlled-test ownership violation

A role outside the authorized test-writing path changes controlled tests or proof artifacts.

## T06 — Environment false signal

The test result is caused by setup/runtime/environment behavior rather than the intended code behavior and is misinterpreted as product evidence.

## T07 — False confidence from partial suite

A subset result is presented as if it established the required final verification scope.

---

# D — Developer / implementation failures

## D01 — Out-of-scope production change

Implementation changes behavior or files not justified by approved scope.

## D02 — Controlled-test modification attempt

Developer changes or attempts to weaken proof owned by another role.

## D03 — Regression introduced

Implementation satisfies one target while breaking an existing required behavior.

## D04 — Rework loop caused by avoidable implementation error

The Developer repeatedly revises code because of defects that were not caused by changed requirements or new evidence.

## D05 — Wrong-repository or wrong-worktree write

A write occurs outside the established writable subject.

## D06 — Candidate/evidence desynchronization

Implementation changes the candidate without correctly invalidating dependent verification/review evidence.

## D07 — Incomplete implementation presented as complete

The Developer reports completion while required behavior remains absent.

---

# R — Reviewer failures

## R01 — Reviewer false positive

A reported defect is not supported by the reviewed candidate and requirements.

## R02 — Reviewer non-material escalation

A preference or low-impact issue is represented as release-blocking without policy/requirement basis.

## R03 — Reviewer miss

A later validated defect existed in the reviewed candidate and was reasonably discoverable from the review evidence.

## R04 — Stale review

Review is treated as valid after the candidate or required evidence changed.

## R05 — Independence contamination

The intended fresh review is materially biased by implementation persuasion or prior conclusions that should not have been supplied.

Only classify this when the actual context transfer is observable; otherwise use HOST_DEPENDENT/UNRESOLVED.

---

# W — Workflow / harness failures

## W01 — Invalid phase transition

The pipeline advances without required prerequisites or skips a mandatory checkpoint.

## W02 — Stale evidence accepted

Verification, audit, review, or approval evidence remains treated as current after its subject changed.

## W03 — Candidate mismatch

Artifacts that are supposed to describe the same shipping candidate refer to different candidate identities.

## W04 — Missing or invalid required artifact

A required run artifact is absent, malformed, or not attributable to the correct run.

## W05 — Unknown external effect mishandled

An external action result is unknown and the workflow retries or proceeds without reconciliation.

## W06 — Duplicate external effect

A publication/write side effect occurs more than once when only one was intended.

## W07 — Write-boundary violation

A role writes outside its allowed lane.

## W08 — Approval/authorization binding failure

A human decision is not demonstrably bound to the exact candidate/action/target it was intended to authorize.

## W09 — Unrecoverable state

The pipeline cannot safely determine how to resume after interruption.

## W10 — Host capability assumed but unverified

A pipeline guarantee depends on a host behavior that was never established on the active surface.

## W11 — Observability gap blocks evaluation

A material question cannot be answered because the relevant event/configuration/evidence was not captured.

---

# E — Evaluation-system failures

## E01 — AI judge false positive

The evaluator marks a defect/finding valid when human or stronger evidence later rejects it.

## E02 — AI judge false negative

The evaluator rejects or misses a defect later validated by stronger evidence.

## E03 — Label drift

The same category or rubric is applied differently over time or by different evaluators.

## E04 — Provenance inflation

Estimated, inferred, agent-reported, or human-recorded data is presented as host/tool/deterministic observation.

## E05 — Metric gaming / Goodhart failure

A pipeline change improves a target metric while degrading the actual engineering outcome.

## E06 — Evaluation leakage

The treatment sees labels, gold answers, or judge reasoning that the baseline did not, invalidating comparison.

## E07 — Configuration attribution failure

The run cannot be tied to the prompt/model/reference/script versions that produced it.

## E08 — Dataset selection bias

The evaluation set overrepresents easy, known, or previously optimized cases.

---

# H — Human interaction classifications

These distinguish legitimate human control from automation failure.

## H01 — Necessary human decision

The pipeline correctly stops because intent, authorization, risk acceptance, or business choice belongs to a human.

This is **not a failure**.

## H02 — Necessary human approval

The pipeline correctly requires a human-controlled external action or release checkpoint.

This is **not a failure**.

## H03 — Human repair caused by pipeline failure

A person must manually fix state, evidence, routing, artifacts, or code because the pipeline failed.

This is a negative reliability/human-effort signal.

## H04 — Human correction of agent/evaluator judgment

A person corrects a Planner/Auditor/Tester/Reviewer/judge conclusion.

This is valuable labeled evaluation data.

---

# Materiality

Failure type and materiality must remain separate.

Suggested starting labels:

- `CRITICAL` — can cause unsafe/unauthorized external effect, wrong candidate publication, serious security/compliance impact, or loss of control.
- `HIGH` — changes implementation scope/correctness or release decision materially.
- `MEDIUM` — meaningful rework or quality impact but not release-critical by itself.
- `LOW` — real issue with limited decision impact.
- `UNRESOLVED` — materiality cannot yet be established.

Do not infer materiality solely from which agent reported the issue.

---

# Resolution

Suggested starting resolution labels:

- `PLAN_CHANGED`
- `TEST_CHANGED`
- `IMPLEMENTATION_CHANGED`
- `REVIEW_CHANGED`
- `WORKFLOW_CHANGED`
- `HUMAN_DECISION`
- `NO_CHANGE_REQUIRED`
- `DEFERRED`
- `UNRESOLVED`

Resolution does not prove the original finding was correct.

Keep finding validity and resolution as separate fields.

---

# Taxonomy maintenance

Do not add a new failure code because one run used different wording.

Add a category only when:

1. existing categories cannot represent the failure without losing decision value, and
2. the distinction will affect analysis, routing, or improvement decisions.

Review the taxonomy periodically for:

- unused categories,
- overlapping categories,
- categories that should become attributes rather than types,
- and host-specific categories that should remain adapter-local.
