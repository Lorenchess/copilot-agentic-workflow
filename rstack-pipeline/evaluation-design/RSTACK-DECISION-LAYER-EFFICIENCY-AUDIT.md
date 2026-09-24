# RSTACK Decision-Layer Efficiency Audit

## Purpose

You are auditing the current RSTACK agentic software-engineering pipeline.

This is an **analysis-only task**. Do not modify production pipeline files, agents, skills, hooks, references, or orchestration logic unless explicitly instructed later.

The purpose of this audit is to identify where RSTACK currently uses expensive agent reasoning, large context windows, verbose handoffs, or unnecessary artifacts for decisions that could instead be handled by:

- deterministic code or rules,
- lightweight structured AI classification,
- or the existing full reasoning agents only when genuinely necessary.

The goal is **not** to reduce quality or remove important reasoning.

The goal is to make the pipeline:

- cheaper,
- faster,
- more token-efficient,
- easier to audit,
- easier to reason about,
- more deterministic where possible,
- while preserving strong reasoning and human checkpoints where they provide real value.

---

# Core Model

Evaluate pipeline decisions using three levels.

## LEVEL 0 — Deterministic Decision

No LLM should be required.

Examples:

- tests passed or failed,
- required file exists,
- forbidden file was modified,
- known risk threshold exceeded,
- state transition is explicitly defined,
- previous review status is known,
- required evidence is missing,
- external side effect status is UNKNOWN,
- implementation exceeded allowed write boundaries.

These should normally be implemented through:

- code,
- schemas,
- state machines,
- validation,
- hooks,
- assertions,
- policy tables,
- explicit transition rules.

Preferred characteristics:

- deterministic,
- cheap,
- fast,
- reproducible,
- directly auditable.

---

## LEVEL 1 — Semantic Decision

A model may be useful, but deep open-ended reasoning is unnecessary.

The model should receive a small and focused context and produce constrained structured output.

Examples:

- classify the type of change,
- determine which agent should receive a handoff,
- determine whether an artifact appears relevant,
- classify an implementation as low/medium/high semantic risk,
- determine whether a developer response appears to address a requirement,
- classify whether human escalation may be required,
- select among a small set of known pipeline paths.

Preferred response format:

~~~json
{
  "decision": "PASS_TO_REVIEWER",
  "confidence": 0.93,
  "reason_codes": [
    "TESTS_PASS",
    "REQUIREMENTS_APPEAR_SATISFIED"
  ]
}
~~~

Avoid:

- essays,
- chain-of-thought requirements,
- large generated documents,
- unnecessary explanations,
- repeatedly sending the entire ticket history.

LEVEL 1 should normally use an already-approved lightweight or constrained model available in the corporate environment.

Do not assume that Jev, TypeSafe AI, or any new external service is available.

The important concept is the architecture, not a specific vendor.

---

## LEVEL 2 — Full Reasoning

Use a capable reasoning agent when the work genuinely requires it.

Examples:

- ambiguous requirements,
- architecture decisions,
- implementation strategy,
- non-trivial code generation,
- adversarial review,
- security reasoning,
- complex root-cause investigation,
- conflicting evidence,
- tradeoff analysis,
- unclear human intent,
- difficult reviewer judgment.

Examples of existing agents that may belong primarily here include:

- Planner,
- Developer,
- Auditor,
- Reviewer / Architect.

LEVEL 2 should be treated as the most expensive decision class.

---

# Audit Objective 1 — Map Every Important Pipeline Decision

Inspect the current:

- agent instruction files,
- pipeline skill,
- orchestration instructions,
- handoff contracts,
- state files,
- risk rules,
- write boundaries,
- hooks,
- approval rules,
- reviewer behavior,
- artifact/evidence requirements,
- routing rules,
- escalation logic,
- retry behavior,
- human checkpoints.

Identify every meaningful decision the pipeline makes.

For each decision document:

| Field | Meaning |
|---|---|
| Decision | What is being decided |
| Current owner | Agent/code/human currently making it |
| Current input | Information consumed |
| Current output | Result produced |
| Current level | L0 / L1 / L2 |
| Recommended level | L0 / L1 / L2 |
| Reason | Why |
| Cost concern | Context/tokens/artifacts/model calls |
| Risk of simplification | What could go wrong |
| Required safeguards | Controls needed if changed |

Do not assume every decision needs optimization.

Explicitly identify decisions already implemented at the appropriate level.

---

# Audit Objective 2 — Find Level-2 Overuse

Look specifically for places where a full agent/model is being invoked for something that could reliably be:

## L2 → L0

Example:

Current:

> Reviewer analyzes whether all tests passed.

Better:

~~~text
test_exit_code == 0
required_tests_completed == true
~~~

The model should reason about the significance of the tests if necessary, but should not determine basic machine-verifiable facts.

## L2 → L1

Example:

Current:

> Orchestrator reads several long artifacts and writes a long explanation of which agent should run next.

Potential improvement:

~~~text
Input:
state
risk tier
test status
review state
ticket category

Output:
NEXT_AGENT = AUDITOR
confidence = .96
~~~

Identify all realistic opportunities of this form.

---

# Audit Objective 3 — Find Level-1 Tasks That Should Be Level 0

Do not stop at optimizing full agents.

Semantic classification itself may be unnecessary when an explicit rule exists.

Example:

Bad:

~~~text
Ask AI:
"Should this go back to Developer?"
~~~

When the actual condition is:

~~~text
review_status == REJECTED
~~~

then routing should be deterministic.

Identify any such cases.

---

# Audit Objective 4 — Analyze Agent Routing

Study how RSTACK currently decides among:

- Planner
- Developer
- Tester
- Auditor
- Reviewer
- Approval / Human
- retry
- stop
- completion

Determine:

1. Which routing decisions can be deterministic?
2. Which require semantic classification?
3. Which genuinely require reasoning?
4. Whether an expensive Orchestrator model is performing decisions that could move downward.
5. Whether stale state or incomplete state can cause incorrect routing.
6. Whether routing rules are duplicated between agents or references.
7. Whether multiple agents independently make the same routing decision.
8. Whether routing could be represented as a state-transition table.

Produce a proposed conceptual state transition model.

Do not implement it.

---

# Audit Objective 5 — Analyze Handoffs and Artifact Cost

RSTACK has observed situations where relatively small implementation work can generate disproportionately large amounts of:

- metadata,
- evidence,
- Markdown artifacts,
- summaries,
- handoff documents,
- duplicated explanations.

Investigate whether artifact generation itself can use the L0/L1/L2 model.

For example:

## Low-complexity change

Potential handoff:

~~~text
ticket
changed files
test result
commit/diff reference
decision state
~~~

## Medium-risk change

Add:

~~~text
requirement coverage
important implementation decisions
known limitations
~~~

## High-risk change

Add:

~~~text
expanded evidence
risk analysis
adversarial findings
human approval evidence
~~~

Evaluate whether current RSTACK artifacts scale appropriately with:

- implementation size,
- uncertainty,
- risk,
- external side effects,
- number of agents involved.

Identify artifacts that appear:

- duplicated,
- reconstructable,
- unnecessary,
- excessively verbose,
- required only because another agent lacks structured state.

---

# Audit Objective 6 — Separate State From Prose

Investigate whether RSTACK relies too heavily on Markdown prose to communicate facts that should instead exist as structured state.

Examples:

Instead of:

~~~text
The developer successfully ran all tests and no security problems were found.
~~~

prefer state such as:

~~~json
{
  "tests": {
    "status": "PASS"
  },
  "security": {
    "critical_findings": 0
  }
}
~~~

Models can still receive a human-readable view when needed.

Identify candidate information that should become canonical structured state.

For each candidate explain:

- current representation,
- proposed structured representation,
- owner,
- source of truth,
- consumers,
- whether prose artifact can then be removed or shortened.

---

# Audit Objective 7 — Context Minimization

For every agent, evaluate whether it receives information that it does not need.

Specifically inspect:

- entire ticket histories,
- previous agent narratives,
- duplicated requirements,
- full evidence bundles,
- unrelated files,
- redundant summaries,
- full previous reasoning.

Identify opportunities to pass:

~~~text
STATE + REFERENCES
~~~

instead of:

~~~text
STATE + EVERY PREVIOUS ARTIFACT + EVERY PREVIOUS EXPLANATION
~~~

Classify context as:

- REQUIRED
- USEFUL
- OPTIONAL
- REDUNDANT

Estimate relative token impact where feasible.

Do not invent exact token numbers if they cannot be measured.

---

# Audit Objective 8 — Escalation

Define when the pipeline should move upward:

~~~text
L0 → L1
L1 → L2
L2 → HUMAN
~~~

Look for conditions such as:

- missing state,
- conflicting evidence,
- confidence below threshold,
- ambiguous requirement,
- irreversible external action,
- security impact,
- policy uncertainty,
- unknown side effects,
- repeated failure,
- reviewer disagreement.

Determine whether escalation rules are currently explicit or implicit.

Recommend where they should be canonicalized.

---

# Audit Objective 9 — Human-in-the-Loop Preservation

Efficiency must not bypass RSTACK's intended human checkpoints.

Verify that any proposed optimization preserves human involvement for appropriate situations such as:

- plan approval,
- high-risk modifications,
- uncertain external actions,
- unresolved ambiguity,
- irreversible actions,
- policy exceptions.

Flag any optimization that could accidentally weaken human control.

---

# Audit Objective 10 — Decision Duplication

Search for cases where multiple agents independently:

- determine risk,
- classify task type,
- determine next agent,
- determine completion,
- decide whether testing is sufficient,
- evaluate artifact completeness,
- decide whether human approval is needed.

For every duplication determine:

~~~text
Should there be ONE canonical owner?
~~~

Prefer one source of truth where possible.

Other agents should consume the decision rather than recompute it unless independent verification is intentionally required.

Distinguish:

~~~text
ACCIDENTAL DUPLICATION
~~~

from:

~~~text
INTENTIONAL INDEPENDENT VERIFICATION
~~~

---

# Audit Objective 11 — Failure Modes

For every proposed L2 → L1 or L1 → L0 optimization analyze potential failure modes.

Examples:

- deterministic rule is too rigid,
- classifier confidence is misleading,
- bad state causes automatic wrong routing,
- semantic ambiguity is hidden,
- human checkpoint is skipped,
- stale evidence produces incorrect decision,
- adversarial behavior exploits structured routing,
- models learn to satisfy metadata instead of actual requirements.

Do not recommend optimization merely because it is cheaper.

Reliability remains the primary constraint.

---

# Audit Objective 12 — Measure Potential Value

For every major opportunity estimate qualitatively:

### Cost impact
LOW / MEDIUM / HIGH

### Token reduction
LOW / MEDIUM / HIGH

### Latency reduction
LOW / MEDIUM / HIGH

### Reliability impact
IMPROVES / NEUTRAL / POTENTIAL RISK

### Implementation complexity
LOW / MEDIUM / HIGH

Do not fabricate monetary savings.

If real measurements exist in .rstack runs or previous execution evidence, use them.

---

# Required Final Deliverables

Produce the following documents or sections.

## 1. Executive Summary

Explain:

- how much of the pipeline appears to be L0/L1/L2 today,
- where the largest inefficiencies appear,
- whether RSTACK overuses reasoning agents,
- whether RSTACK overproduces prose artifacts,
- the most important architectural opportunities.

## 2. Decision Inventory

Complete table of significant pipeline decisions.

## 3. L2 → L1 Candidates

List every credible candidate.

Include evidence from the repository.

## 4. L2/L1 → L0 Candidates

List every credible deterministic candidate.

Include evidence.

## 5. Keep at L2

Explicitly identify decisions that should remain full reasoning tasks.

This section is important.

Optimization must not become indiscriminate simplification.

## 6. Artifact Efficiency Analysis

Identify:

- duplicated artifacts,
- oversized handoffs,
- prose that could become structured state,
- artifacts that should scale with risk,
- evidence that should remain immutable/auditable.

## 7. Proposed RSTACK Decision Architecture

Create a conceptual architecture such as:

~~~text
                         INPUT
                           │
                           ▼
                 ┌──────────────────┐
                 │ Canonical State  │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ LEVEL 0 RULES    │
                 │ deterministic    │
                 └────────┬─────────┘
                          │ unresolved
                          ▼
                 ┌──────────────────┐
                 │ LEVEL 1 DECISION │
                 │ constrained AI   │
                 └────────┬─────────┘
                          │ uncertain/
                          │ complex
                          ▼
                 ┌──────────────────┐
                 │ LEVEL 2 AGENT    │
                 │ deep reasoning   │
                 └────────┬─────────┘
                          │
                          │ high risk/
                          │ unresolved
                          ▼
                 ┌──────────────────┐
                 │ HUMAN CHECKPOINT │
                 └──────────────────┘
~~~

Adapt the model based on what actually exists in RSTACK rather than forcing this exact structure.

## 8. Prioritized Opportunities

Do **not** simply rank ideas based on cost savings.

Group findings into:

### Strong candidates
High confidence that simplification improves the pipeline.

### Needs experimentation
Promising but requires measurement.

### Keep current design
Current reasoning complexity appears justified.

### Do not simplify
Simplification would materially reduce reliability or human control.

## 9. Measurement Plan

Recommend how future .rstack runs could capture enough information to measure:

- model calls,
- agent calls,
- input context size,
- output size,
- number of artifacts,
- artifact bytes,
- decision latency,
- retries,
- escalations,
- human interventions,
- failed classifications,
- routing corrections.

Keep measurement proportional.

Do not create large telemetry artifacts that defeat the purpose of this optimization.

---

# Important Constraints

1. Do not assume Jev or any new external AI provider is available.
2. Prefer technologies already available in the corporate environment.
3. Do not weaken security controls.
4. Do not remove human checkpoints purely to save tokens.
5. Do not replace meaningful independent review with deterministic rules.
6. Do not optimize based solely on cost.
7. Preserve auditable evidence where required.
8. Distinguish canonical machine state from explanatory prose.
9. Cite exact repository files/sections for every major finding.
10. Clearly label assumptions.
11. If evidence is insufficient, say so.
12. Do not implement any recommendation during this audit.

The primary question is:

> **For every decision in RSTACK, are we using the least expensive and least complex mechanism that can make that decision reliably without sacrificing quality, safety, auditability, or human control?**

And the secondary question is:

> **Are we passing the minimum sufficient state and evidence between agents, or are agents compensating for weak structured state by generating and rereading excessive prose?**
