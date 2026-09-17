# What a run costs to discover things

This reference answers one question:

> **Before adding more cross-run memory or context, what does rediscovery actually cost today?**

It is optional and non-authoritative. It grants no permission, adds no phase input, creates no telemetry, and is not a gate.

## Measurement rule

**Missing means `UNAVAILABLE`. Never substitute zero or an estimate.**

Every reported value carries one provenance label:

| Label | Meaning |
|---|---|
| `OBSERVED` | Produced by a tool/script/clock and retained as evidence |
| `AGENT_REPORTED` | Written by an agent into an artifact; useful but self-reported |
| `INFERRED` | Judged by a human comparing named records |
| `UNAVAILABLE` | This stack cannot supply the value |

A plausible estimate is worse than `UNAVAILABLE` because it becomes indistinguishable from measured data later.

## Measures

`field` is the key emitted by `pipeline-metrics.mjs --json`. `no field` means the current stack does not compute it automatically.

| Measure | Source | Field | Provenance |
|---|---|---|---|
| Repository/ticket discovery cost | `plan.md`, interview assumptions, `plan-audit.md` re-derivations | no field | `AGENT_REPORTED`; tool-call count is `UNAVAILABLE` |
| Phase 3↔4↔5 loop turns | `run-log.tsv` spawns | `loopTurns` | `OBSERVED` |
| First-pass success at phase 4 | first phase-4 verdict | `firstPassPhase4` | `OBSERVED` |
| Plan-audit catches | all `plan-audit.md` rounds | `audit.caught` | `AGENT_REPORTED` |
| Reviewer catches | `review.md` Act on + Risks | `review.actOn`, `review.risks` | `AGENT_REPORTED` |
| Human escalations | run-log/verdict/note records that name a human | `escalations` | `AGENT_REPORTED` |
| ACs mapped to locked tests | AC matrix + test lock | `acsMappedToTests` | `OBSERVED` |
| Wall-clock duration | validated `ts` values | `wallMinutes`, `tsUnusable` | `OBSERVED` or `UNAVAILABLE` |
| Human minutes | explicit human measurement | no field | `OBSERVED` or `UNAVAILABLE` |
| Token/cost usage | host, if exposed | no field | `UNAVAILABLE` in this stack |
| Repeated human context | comparable interview decisions across retained runs | no field | `INFERRED` |
| Repeated review mechanism | reviewer findings compared by mechanism, not wording | no field | `INFERRED` |
| Whether a learnings entry changed a decision | human comparing the entry with the resulting plan/phase decision | no field | `INFERRED` |

## Measures we intentionally cannot claim

### Counterfactual savings

The important business comparison is:

> what this pipeline caught early **versus** what would have escaped in the previous workflow.

This stack observes only the first side. The second side is a counterfactual and is therefore `UNAVAILABLE` unless an external study supplies it.

Do not turn "audit caught N" into "pipeline saved N defects".

### Value of a learnings entry

A citation proves that an entry was read, not that it helped.

Count a learnings entry as beneficial only when a named human can compare:

1. the entry,
2. the decision/plan it affected,

and reasonably conclude that it changed or shortened that decision.

Label that `INFERRED`.

## Run metrics

Per issue:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/pipeline-metrics.mjs --issue <KEY> --json
```

All retained runs in the current repository:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/pipeline-metrics.mjs --all
```

`--all` is repository-local. It does not aggregate across sibling repositories or estates.

## Retention

Metrics derived from `.rstack/runs/<KEY>` must be summarized **before** ticket artifacts are deleted.

The durable run document should retain the metrics summary so cleanup does not erase the evidence needed for later comparisons.

The metrics script/output format should be the machine source of truth; this reference should explain interpretation, not duplicate implementation details.

## When to draw conclusions

Do not recommend more memory from one memorable run.

Collect at least **three representative runs** spanning meaningfully different ticket shapes, then review:

- discovery cost,
- loop turns,
- audit/review catches,
- human escalations,
- wall time,
- repeated-context observations,
- any learnings entries that demonstrably changed a decision.

Three runs are a minimum sample for deciding whether the hypothesis is worth further measurement, not statistical proof.

## Decision test for adding memory

Additional cross-run memory is justified only when the retained evidence shows a repeated, material discovery cost **and** the proposed memory mechanism can reduce that cost without contaminating the fresh-context auditor/reviewer.

If the evidence does not show that, keep rediscovery.

## What I would change from the current file

The current reference is already relatively lean and conceptually strong. I would make only four changes:

1. Separate **measurement** from **recommendation** more explicitly.
2. Remove historical incident detail from the runtime reference and keep it in architecture/incident notes.
3. State that "three runs" is a minimum observation threshold, not evidence of statistical significance.
4. Add an explicit decision test: memory must reduce a measured repeated cost without weakening fresh-context independence.
