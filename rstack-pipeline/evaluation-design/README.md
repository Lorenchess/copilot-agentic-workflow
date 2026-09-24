# RSTACK Evaluation Design Pack

## Purpose

This folder contains input guidance for designing RSTACK's persistent evaluation system.

These files are **not active pipeline contracts** and should not be loaded into every runtime agent.

They exist to guide the repository-aware design pass requested in:

- [RSTACK Evaluation System Design Prompt](../RSTACK-EVALUATION-SYSTEM-DESIGN-PROMPT.md)

The current active V2 refactoring reference remains `../claude-v2.2/` as identified by the parent `README.md`.

## Recommended reading order for the design agent

1. [Evaluation Design Context](RSTACK-EVALUATION-DESIGN-CONTEXT.md)
2. [Failure Taxonomy](RSTACK-FAILURE-TAXONOMY.md)
3. [Evaluation Labeling Guide](RSTACK-EVALUATION-LABELING-GUIDE.md)
4. [Host Capability Matrix](RSTACK-HOST-CAPABILITY-MATRIX.md)
5. [Evaluation Data Dictionary](RSTACK-EVALUATION-DATA-DICTIONARY.md)
6. [Golden Evaluation Corpus](RSTACK-GOLDEN-EVAL-CORPUS.md)
7. [Evaluator Calibration](RSTACK-EVALUATOR-CALIBRATION.md)
8. [Evaluation Governance](RSTACK-EVALUATION-GOVERNANCE.md)
9. [Experiment Registry](RSTACK-EXPERIMENT-REGISTRY.md)

Then inspect the active RSTACK V2 source and execute the root evaluation-system design prompt.

## What each file contributes

| File | Role |
|---|---|
| Design Context | goals, constraints, architecture principles, authoritative-source discipline |
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
