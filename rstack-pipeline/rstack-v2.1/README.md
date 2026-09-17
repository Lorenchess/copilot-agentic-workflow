# rstack 2.1 — workplace improvement candidate

This folder contains the revised rstack agent/skill contracts and the implementation plan needed to port them back to the original workplace rstack.

It reconciles the preserved Fable draft with all 44 supplied photographs. It is a candidate for review and porting, not an installed or runtime-validated release. No executable scripts have been reconstructed from clipped images.

## Start here

1. [Changes from Fable](CHANGES.md) — what changed and why.
2. [Pipeline contract](pipeline/SKILL.md) — states, candidate identity and review/release conditions.
3. [Runtime patch plan](RUNTIME-PATCH-PLAN.md) — exact source anchors and required behavior changes.
4. [Workplace port guide](WORKPLACE-PORT.md) — source mapping, application order and adoption dependencies.
5. [Photo evidence](SOURCE-EVIDENCE.md) — all 44 images and supported findings.
6. [Open decisions](OPEN-DECISIONS.md) and [validation plan](VALIDATION-PLAN.md) — what is still unresolved or unrun.

## What is implemented here

The text now preserves the real sha-based AC schema and PASS/BLOCKED/HELD gate interface. It distinguishes execution status, review readiness and release permission; requires fresh re-audit and review; binds review to immutable candidate evidence; and makes freeze, user-work restoration and unknown publication outcomes explicit.

The candidate also consolidates the standing evidence/trust rules and adds bounded estate-sweep and screened skill-evaluation contracts. Runtime enforcement changes are specified separately because their actual source/dependencies are unavailable.

There are 25 operational Markdown files and 7 maintainer documents. The operational set contains seven agents, the pipeline skill, thirteen references, a standing-rule file, a session-context payload and two maintenance skills. Maintainer documents are README, CHANGES, SOURCE-EVIDENCE, RUNTIME-PATCH-PLAN, WORKPLACE-PORT, OPEN-DECISIONS and VALIDATION-PLAN.

## Runtime entries

- [Orchestrator](agents/rstack-orchestrator.agent.md)
- [Planner](agents/rstack-planner.agent.md) and [plan auditor](agents/rstack-plan-auditor.agent.md)
- [Tester](agents/rstack-tester.agent.md) and [developer](agents/rstack-dev.agent.md)
- [Reviewer](agents/rstack-reviewer-architect.agent.md) and [approval](agents/rstack-approval.agent.md)
- [Handoff contracts](references/handoff-contracts.md), [write boundaries](references/write-boundaries.md), [approval rules](references/approvals.md)
- [Harness limits](references/harness-map.md), [standing rules](rules/standing-rules.instructions.md), [session reminder](hooks/session-start-context.md)
- [Estate sweep](skills/estate-sweep/SKILL.md) and [skill evaluation](skills/eval-skill/SKILL.md)

Runtime paths and frontmatter are candidate integration material. Validate actual authored/generated/installed locations and host capabilities before using them. The local folder layout is not an installer manifest.

## Validation and preservation

The original reconstruction, Astra review files and fable-v2 remain preserved. This task adds only rstack-v2.1 files. No build, lint, test, browser, behavioral evaluation, commit, push or workplace installation was run.

Static document checks cannot establish that the proposed controls execute or improve agent behavior. Complete the selected workplace checks and adoption decisions before promotion.
