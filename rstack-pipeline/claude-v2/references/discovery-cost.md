# What a run costs to discover things

> Before adding cross-run memory or more context: what does rediscovery actually cost today?

Optional and non-authoritative. It grants no permission, adds no input to any state, creates no telemetry, and gates nothing.

## Provenance

Every reported value carries exactly one label.

| Label | Meaning |
|---|---|
| `OBSERVED` | measured by a source independent of the agents being measured: host spans or session records, a tool-written file the agent does not author, a human with a clock |
| `AGENT_REPORTED` | written by an agent into an artifact or log |
| `INFERRED` | judged by a named human comparing named records |
| `UNAVAILABLE` | this stack cannot supply it |

**Provenance is inherited.** A value computed from `AGENT_REPORTED` input is `AGENT_REPORTED`, however deterministic the script that computed it. Parsing, validating or counting a self-report checks its form, not its truth. A value becomes `OBSERVED` only when an independent source supplies or corroborates it, and then only for the fields that source actually recorded.

**Missing is `UNAVAILABLE`** — not zero, not inferred, not estimated. A plausible estimate is worse than a gap because later it is indistinguishable from a measurement. An observed zero stays zero.

## Measures

`field` is the key the reconstructed `pipeline-metrics.mjs --json` emits; `—` means nothing computes it.

| Measure | Source | Field | Provenance |
|---|---|---|---|
| Discovery effort for a ticket | `plan.md`, assumptions, audit re-derivations | — | `AGENT_REPORTED`; tool-call counts `UNAVAILABLE` |
| Loop turns (1b↔1r, 3↔4, review rounds) | `run-log.tsv`, written by the orchestrator | `loopTurns` | `AGENT_REPORTED`; `OBSERVED` only if host spans corroborate the dispatches |
| First-pass success at verification | first state-4 result in the run log | `firstPassPhase4` | `AGENT_REPORTED` |
| Plan-audit findings | every `plan-audit` round | `audit.caught` | `AGENT_REPORTED` |
| Review findings | `review.md` Act on + Risks | `review.actOn`, `review.risks` | `AGENT_REPORTED` |
| Vacuous or missing checks found at review | `review.md` Risks, by kind | — | `AGENT_REPORTED` — the input to the test-challenge decision |
| Human escalations | run log and `decisions.md` | `escalations` | `AGENT_REPORTED` |
| ACs mapped to locked tests | matrix (agent-written) + lock (tool-written) | `acsMappedToTests` | `AGENT_REPORTED`; the lock half alone is `OBSERVED` |
| Wall-clock duration | run-log `ts` | `wallMinutes`, `tsUnusable` | `AGENT_REPORTED` — agents have invented timestamps; `OBSERVED` only from host records |
| Model actually used | host session records (`chat-trail.mjs`) | — | `OBSERVED` when recovered, else `UNAVAILABLE`; never the configured alias |
| Human minutes | a human's own measurement | — | `OBSERVED` or `UNAVAILABLE` |
| Token and cost usage | host, if exposed | — | `UNAVAILABLE` in this stack |
| Repeated human context across runs | comparable interview decisions | — | `INFERRED` |
| Repeated review mechanism | findings compared by mechanism, not wording | — | `INFERRED` |
| A learnings entry changed a decision | human comparing the entry with the decision | — | `INFERRED` |

## What cannot be claimed

**Counterfactual savings.** The stack sees what the pipeline caught, never what would have escaped without it. "Audit caught N" is not "pipeline saved N defects".

**That a learnings entry helped.** A citation of an entry does not show it was read, and a read does not show it helped. Count one as beneficial only when a named human compares the entry with the decision it touched and concludes it changed or shortened that decision — `INFERRED`.

## Collecting

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/pipeline-metrics.mjs --issue <KEY> --json
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/pipeline-metrics.mjs --all      # this repository only
```

Summarise before run artifacts are deleted; the `docs` skill's run document keeps the summary, with the labels. Nothing here is a release condition.

## Deciding

Not from one memorable run. At least three representative runs across different ticket shapes — a threshold for whether the question deserves more measurement, not statistical evidence.

More memory is justified only when retained evidence shows a repeated, material discovery cost **and** the mechanism can reduce it without reaching the fresh auditor or reviewer. Otherwise keep rediscovery.
