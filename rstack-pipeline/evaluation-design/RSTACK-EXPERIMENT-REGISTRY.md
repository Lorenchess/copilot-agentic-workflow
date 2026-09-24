# RSTACK Experiment Registry

## Purpose

This file defines how RSTACK evaluation experiments are registered and provides an initial backlog of candidate experiments.

It does **not** claim that any experiment has been executed.

The registry prevents pipeline changes from being justified only by subjective impressions such as:

> "the new prompt seems better."

## Experiment lifecycle

Suggested states:

- `PROPOSED`
- `READY`
- `RUNNING`
- `ANALYSIS_PENDING`
- `KEEP`
- `REVERT`
- `INCONCLUSIVE`
- `CANCELLED`

No experiment should move to KEEP solely because an AI judge prefers the treatment.

## Required experiment record

Each experiment should define:

- experiment ID,
- title,
- state,
- hypothesis,
- decision the experiment supports,
- independent variable,
- controlled variables,
- population/task set,
- inclusion/exclusion rules,
- baseline,
- treatment,
- primary metrics,
- guardrail metrics,
- human validation strategy,
- evaluator/rubric versions,
- stopping criteria,
- known threats to validity,
- result,
- final human decision.

## Design rules

1. Change one major variable at a time where practical.
2. Bind both baseline and treatment to the same task/snapshot when possible.
3. Do not use pass rate alone.
4. Preserve failed/inconclusive trials.
5. Do not tune the treatment repeatedly on the same held-out evaluation cases.
6. Keep a subset of cases unseen during prompt/model optimization.
7. Record cost/latency only when observed reliably.
8. If host behavior differs between arms, treat host as a confounder.

---

# Candidate experiment backlog

## EXP-001 — Planner model allocation

**State:** PROPOSED

**Question:** Does a stronger/different Planner model reduce material planning corrections?

**Independent variable:** Planner model.

**Keep constant where possible:**

- task set,
- Planner prompt/version,
- repository snapshot,
- Auditor model/configuration,
- Auditor rubric,
- evidence/tool access.

**Primary outcomes:**

- confirmed material Planner claim corrections,
- material omissions,
- downstream defects attributable to planning.

**Guardrails:**

- planning latency,
- human clarification burden,
- plan verbosity/context cost,
- Auditor false-positive rate.

Do not interpret fewer Auditor findings as improvement unless human/grounded evaluation confirms fewer real defects.

---

## EXP-002 — Auditor model-family diversity

**State:** PROPOSED

**Question:** Does using a different model family for Plan Auditor increase useful independent findings?

**Independent variable:** Auditor model/model family.

**Primary outcomes:**

- confirmed TRUE_POSITIVE material findings,
- FALSE_POSITIVE rate,
- unique validated findings not found by baseline Auditor.

**Guardrails:**

- audit time,
- downstream rework,
- non-material disagreement rate.

Fresh context and distinct role instructions must remain constant; cross-vendor diversity is not itself proof of independence.

---

## EXP-003 — Plan Auditor ablation

**State:** PROPOSED

**Question:** Does the Plan Auditor prevent enough downstream rework/defects to justify its cost and latency?

**Arms:**

- normal Planner → Auditor path,
- Planner path without Auditor for controlled evaluation cases.

**Primary outcomes:**

- downstream planning-caused defects,
- Tester/Developer/Reviewer rework attributable to plan problems,
- human repair effort.

**Guardrails:**

- cycle time,
- model usage/cost where observable,
- escaped planning defects.

Use only on safe/synthetic or appropriately controlled tasks. Do not remove required workplace controls merely to run an experiment.

---

## EXP-004 — Independent Tester separation

**State:** PROPOSED

**Question:** Does independent test/proof authorship improve defect detection versus Developer-authored proof?

**Independent variable:** proof author role.

**Primary outcomes:**

- discriminating proof quality,
- defects caught before review,
- Reviewer-discovered test gaps,
- escaped defects.

**Guardrails:**

- rework,
- elapsed time,
- test maintenance burden.

---

## EXP-005 — Fresh-context Reviewer

**State:** PROPOSED

**Question:** Does a fresh Reviewer context improve independent defect detection compared with inherited implementation context?

**Independent variable:** review context construction.

**Primary outcomes:**

- unique validated Reviewer findings,
- FALSE_POSITIVE rate,
- missed defects later discovered.

**Critical requirement:** host must establish what context each arm actually received. Otherwise the experiment is not attributable.

---

## EXP-006 — Agent Markdown refactor

**State:** PROPOSED

**Question:** Does reducing/redistributing an oversized agent Markdown file improve or preserve outcomes while reducing irrelevant hot-path context?

**Independent variable:** agent definition/reference distribution.

**Primary outcomes:**

- role-specific defect metrics,
- downstream rework,
- instruction-violation rate.

**Guardrails:**

- missing required behavior,
- host reference-loading failures,
- context size/tokens only if observable.

Do not use line count alone as the success metric.

---

# Result template

```markdown
## EXP-XXX — <title>

State: ANALYSIS_PENDING

### Hypothesis

...

### Baseline

...

### Treatment

...

### Population

...

### Configuration fingerprints

Baseline:
Treatment:

### Primary results

| Metric | Baseline | Treatment | Difference | Provenance |
|---|---:|---:|---:|---|

### Guardrail results

...

### Human validation

Sample:
Agreement/disagreement:
Material examples:

### Threats to validity

...

### Decision

KEEP | REVERT | INCONCLUSIVE

### Decision rationale

...
```

## No-result policy

If the sample is too small, telemetry is incomplete, evaluator calibration is weak, or results conflict materially, choose `INCONCLUSIVE`.

An inconclusive experiment is useful information. Do not force a winner.
