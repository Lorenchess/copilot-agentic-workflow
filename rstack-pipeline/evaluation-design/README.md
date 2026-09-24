# RSTACK Evaluation Design Pack

## Purpose

This folder contains input guidance for designing RSTACK's persistent evaluation system.

These files are **not active pipeline contracts** and should not be loaded into every runtime agent.

They exist to guide the repository-aware design pass requested in:

- [RSTACK Evaluation System Design Prompt](../RSTACK-EVALUATION-SYSTEM-DESIGN-PROMPT.md)

The current active V2 refactoring reference remains `../claude-v2.2/` as identified by the parent `README.md`.

## Recommended reading order for the design agent

1. [Evaluation Design Context](RSTACK-EVALUATION-DESIGN-CONTEXT.md)
2. [Post-Run Evaluation Workflow](RSTACK-POST-RUN-EVALUATION-WORKFLOW.md)
3. [Artifact, Metadata, and Handoff Efficiency Review](RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md)
4. [Decision-Layer Efficiency Audit](RSTACK-DECISION-LAYER-EFFICIENCY-AUDIT.md)
5. [Failure Taxonomy](RSTACK-FAILURE-TAXONOMY.md)
6. [Evaluation Labeling Guide](RSTACK-EVALUATION-LABELING-GUIDE.md)
7. [Host Capability Matrix](RSTACK-HOST-CAPABILITY-MATRIX.md)
8. [Evaluation Data Dictionary](RSTACK-EVALUATION-DATA-DICTIONARY.md)
9. [Golden Evaluation Corpus](RSTACK-GOLDEN-EVAL-CORPUS.md)
10. [Evaluator Calibration](RSTACK-EVALUATOR-CALIBRATION.md)
11. [Evaluation Governance](RSTACK-EVALUATION-GOVERNANCE.md)
12. [Experiment Registry](RSTACK-EXPERIMENT-REGISTRY.md)

Then inspect the active RSTACK V2 source and execute the root evaluation-system design prompt.

## What each file contributes

| File | Role |
|---|---|
| Design Context | goals, constraints, architecture principles, authoritative-source discipline |
| Post-Run Evaluation Workflow | separates Copilot execution from fresh-context Claude evaluation and defines run collection/immutability |
| Artifact, Metadata, and Handoff Efficiency Review | evaluates artifact volume, duplication, hot context, handoff payloads, persistence, and cost-efficiency without sacrificing auditability |
| Decision-Layer Efficiency Audit | audits every important pipeline decision as L0 deterministic, L1 constrained semantic, or L2 full reasoning; identifies overuse of expensive agents, routing duplication, context waste, and escalation requirements |
| Failure Taxonomy | stable language for observed failure modes |
| Labeling Guide | consistent claim/finding/materiality/human labels |
| Host Capability Matrix | prevents assuming unavailable host telemetry/control |
| Data Dictionary | provisional semantics for persistent fields |
| Golden Corpus | how to build representative human-reviewed evaluation cases |
| Evaluator Calibration | how to validate AI-as-judge behavior |
| Governance | public/internal data boundary and unresolved policy questions |
| Experiment Registry | controlled model/prompt/workflow comparisons |

## Core rule

Do not let this pack become another large runtime instruction bundle.

The design agent should use it to create a **small measurement architecture**.

Runtime agents should receive only the evaluation-related information necessary for their own role.

The intended operating model is: Copilot/RSTACK produces the run evidence; a separate fresh-context evaluator, initially Claude Code, evaluates the completed run afterward. The evaluator treats original run artifacts as read-only and writes only to the run's approved evaluation area.

Artifact design should follow the additional principle: **rich persistent evidence, thin execution context**. Persist what is needed for audit/reconstruction, but load or hand off only the minimum role-specific information required for the next decision.

The decision-layer audit adds a complementary principle: **use the least complex mechanism that can make a decision reliably**. Prefer deterministic rules for machine-verifiable facts, constrained semantic decisions where interpretation is needed, and full reasoning agents only where genuine reasoning complexity justifies them.

## First implementation target

Unless repository inspection shows a better target, instrument Planner → Plan Auditor first:

```text
Planner claim
→ evidence
→ Auditor finding
→ evidence
→ disposition
→ materiality
→ resolution
→ later outcome
→ human validation
```

This creates useful training/evaluation data without attempting to instrument every possible pipeline behavior at once.

## Public repository

This repository is public. The design pack must remain free of confidential workplace data.

Use `corpus/` only for synthetic or explicitly approved sanitized examples. Real workplace evaluation data should be stored in an approved internal system.
