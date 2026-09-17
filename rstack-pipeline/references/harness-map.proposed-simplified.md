# The harness map

This file is an **optional index of authority**.

It does not define policy. It answers only:

> Where is the authoritative rule, who owns it, and is it mechanically enforced?

If this map disagrees with a source it points to, **the source wins** and this map must be fixed.

## Rule strength

| Status | Meaning |
|---|---|
| **Specified** | Written in an authoritative source |
| **Enforced** | A validator/guard refuses violations |
| **Demonstrated** | Verified on a real run and recorded in maintainer evidence |
| **Prose-only** | Required behavior with no mechanical enforcement |

`HARNESS-LIMITS.md` records demonstrated/undemonstrated behavior. This file does not.

## Authority map

| Responsibility | Canonical authority | Owner | Enforcement |
|---|---|---|---|
| Ticket contract and acceptance criteria | `SKILL.md`, `handoff-contracts.md`, `plan-interview.md`, `risk-tiers.md` | planner defines; tester proves | `ac-check.mjs`, `gate.mjs`, `audit-response-check.mjs` |
| Instruction/context precedence | `instruction-precedence.md`, `rstack-process.instructions.md` | installer + host | install/drift checks only; precedence itself is host behavior |
| Tool/write boundaries | `write-boundaries.md` | per-role definitions | `role-guard.mjs`, `estate-guard.mjs`, `boundaries.mjs` |
| Artifact schemas and ownership | `handoff-contracts.md` | producing phase | artifact validators + `protect-artifacts.sh` |
| Evidence/gate semantics | `SKILL.md`, `gate.mjs` | tester/gate; reviewer judges review risks | `gate.mjs`, `test-lock.mjs`, `base-replay.mjs` |
| Cross-run learning | `learnings.md` | orchestrator learning lane | `learnings-check.mjs`, write-boundary guard |

The detailed role lane table belongs only in `write-boundaries.md`.  
The detailed artifact schemas belong only in `handoff-contracts.md`.  
The detailed gate behavior belongs in `gate.mjs`.

This map should never become a second copy of any of them.

## Gate check index

The **runtime source of truth is `gate.mjs --json` / gate output**.

| Check | Purpose |
|---|---|
| `suite` | Confirms a real suite run and usable log/exit evidence |
| `ac-matrix` | Confirms each ticket matrix is proven at the current SHA |
| `test-lock` | Detects changed, weakened, skipped, or missing locked tests |
| `impact` | Requires phase-4 impact evidence for reviewer phase |
| `test-execution` | Confirms locked tests actually appeared in runner output |
| `tree-bracket` | Detects working-tree movement during the measured run |
| `otel` | Cross-checks run claims against host spans when available |

Do not duplicate the full refusal logic here. The script's output owns the current details.

### Non-blocking measurement

- `change-budget.mjs` measures plan-vs-diff growth and may raise review depth.
- `pipeline-metrics.mjs` measures run cost/behavior and must label unavailable measurements honestly.

Neither is a release gate by itself.

## Quick lookup

| Need | Read / run |
|---|---|
| Who may write a path? | `write-boundaries.md` + role's own forbidden section |
| Why did the gate block? | run `gate.mjs` and read its owner/reason |
| What does risk tier change? | `risk-tiers.md` |
| What requires human approval? | `approvals.md` |
| How is a new team/stack adopted? | `team-adoption.md` |
| What does rediscovery cost? | `discovery-cost.md` |
| What has actually been validated on real runs? | repository-root `HARNESS-LIMITS.md` |
| Where are known harness weaknesses tracked? | repository-root `HARNESS-LEDGER.md` |

## Maintenance rule

This file should stay short enough to scan in under a minute.

When a rule changes:

1. change the authoritative source,
2. change the enforcing script if applicable,
3. update this map only if the pointer/owner/enforcement relationship changed.

Do **not** copy incident history, full validator behavior, role matrices, artifact schemas, or long
rationale into this file.

Where possible, generate/check the map from a small machine-readable registry or invariants so stale
pointers fail CI rather than relying on a human noticing drift.

## What this map is not

- not an agent, phase, skill, or artifact,
- not required input,
- not a permission grant,
- not a second policy source,
- not proof that a control works in practice.
