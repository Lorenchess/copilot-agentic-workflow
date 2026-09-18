# rstack 2.2 — workplace improvement candidate (Claude round on rstack-v2.1)

This folder contains the revised rstack agent/skill contracts and the implementation plan needed to port them back to the original workplace rstack. It started as a byte-identical copy of `../rstack-v2.1` and carries one further round of contract corrections (2026-09-17). This folder is the single active V2 source named by the canonical entry point `../README.md`; it is corrected in place, and no sibling V2.x folder is created.

**Status (2026-09-17): independent review returned CHANGES REQUESTED with five findings (`../reviews/2026-09-17-v2.2-review.md`). All five have been corrected in place and answered in [the dated response](CLAUDE-RESPONSE-2026-09-17-R22.md). The corrections have not been re-reviewed, so the status in the canonical entry point stays CHANGES REQUESTED until a reviewer changes it. Not an accepted baseline, not workplace-ready, nothing executed.**

It reconciles the preserved Claude draft with all 44 supplied photographs. It is a candidate for review and porting, not an installed or runtime-validated release. No executable scripts have been reconstructed from clipped images.

## Start here

0. [Response to the independent review](CLAUDE-RESPONSE-2026-09-17-R22.md) — each review finding mapped to its exact change, with current file hashes. Then the dated records it builds on: [round 2.2 implementation report](CLAUDE-IMPLEMENTATION-REPORT.md) and [change manifest](CLAUDE-CHANGE-MANIFEST.md). Those two are kept as reviewed; their hashes and line numbers describe the folder as it was when the review read it, not as it is now.
1. [Changes](CHANGES.md) — the v2.1 record of changes from claude-v2, then the round 2.2 changes from v2.1.
2. [Pipeline contract](pipeline/SKILL.md) — states, candidate identity and review/release conditions.
3. [Runtime patch plan](RUNTIME-PATCH-PLAN.md) — exact source anchors and required behavior changes.
4. [Workplace port guide](WORKPLACE-PORT.md) — source mapping, application order and adoption dependencies.
5. [Photo evidence](SOURCE-EVIDENCE.md) — all 44 images and supported findings.
6. [Open decisions](OPEN-DECISIONS.md) and [validation plan](VALIDATION-PLAN.md) — what is still unresolved or unrun.

## What is implemented here

The text now preserves the real sha-based AC schema and PASS/BLOCKED/HELD gate interface. It distinguishes execution status, review readiness and release permission; requires fresh re-audit and review; binds review to immutable candidate evidence; and makes freeze, user-work restoration and unknown publication outcomes explicit.

Round 2.2 adds no state, agent, script or setting. It closes contract gaps found by tracing one run end to end: a result token for every state outcome and a route for every result; how a fresh role's reply is both envelope and persisted artifact; who evaluates review eligibility; digest-decided review freshness under the scoped-review option; owner-first routing of in-run failures; append-only approval records, round archives and an immutable per-attempt review packet; a file-based comparison packet the no-shell reviewer can read; untracked-input and `.rstack/` protection at freeze; an owner and timing for restoring user work; intent-before-action publication records; and the removal of a plugin-variable assumption from four files. Items that need unavailable runtime source are marked SOURCE-BLOCKED rather than specified by guesswork.

The candidate also consolidates the standing evidence/trust rules and adds bounded estate-sweep and screened skill-evaluation contracts. Runtime enforcement changes are specified separately because their actual source/dependencies are unavailable.

There are 25 operational Markdown files and 10 maintainer documents. The operational set contains seven agents, the pipeline skill, thirteen references, a standing-rule file, a session-context payload and two maintenance skills. Maintainer documents are README, CHANGES, SOURCE-EVIDENCE, RUNTIME-PATCH-PLAN, WORKPLACE-PORT, OPEN-DECISIONS, VALIDATION-PLAN, CLAUDE-IMPLEMENTATION-REPORT, CLAUDE-CHANGE-MANIFEST and CLAUDE-RESPONSE-2026-09-17-R22.

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

The original reconstruction, ChatGPT review files, claude-v2 and rstack-v2.1 remain preserved and byte-identical to their recorded hashes. The v2.1 task added only rstack-v2.1 files; round 2.2 and the correction round after its review added and changed only files inside this folder. In neither round was a build, lint, test, browser check, behavioral evaluation, commit, push or workplace installation run.

Static document checks cannot establish that the proposed controls execute or improve agent behavior. Complete the selected workplace checks and adoption decisions before promotion.
