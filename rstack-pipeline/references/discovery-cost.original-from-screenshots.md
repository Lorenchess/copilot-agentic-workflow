# discovery-cost.md — reconstructed from screenshots

> Reconstruction note: this is a careful consolidation of the visible text from the uploaded `pipeline/references/discovery-cost.md` screenshots (IMG_1279–IMG_1281). It is not a byte-for-byte export of the repository file. Overlapping regions were deduplicated and the visible wording was preserved as closely as possible.

# What a run costs to discover things

Before anyone argues that this repository's runs should remember more, measure what re-discovering
things costs now. This file says what to observe, where each measure comes from, and how honest each
one is. It exists because the alternative is an argument from anecdote, and an anecdote ages into a
number people quote.

**Reading this is optional.** It grants no permission, it adds no required input to any agent, and
no phase is required to open it. It adds no collector, no telemetry, no schedule and no artifact. It
authorizes nothing, and it is not a gate.

## The one rule that makes the table worth filling in

**A missing value is `UNAVAILABLE`. Never zero, and never an estimate.**

Zero and "about ten minutes" both read as data later, and neither is. This is the same rule the
`ts` column now enforces in `pipeline-metrics.mjs`: that column carried invented timestamps on both
real runs this stack has had, and every duration in the metrics report derived from it. Nobody set
out to fabricate anything -- a plausible number is just easier to write than an absent one.

Four labels, on every value:

| Label | Means |
|---|---|
| `OBSERVED` | a tool, a script, or a clock produced it, and the output is on disk |
| `AGENT_REPORTED` | an agent wrote it in an artifact. Real, and a self-report |
| `INFERRED` | a human judged it by comparing records. Name the records |
| `UNAVAILABLE` | nothing supplies it. This is a finding, not a gap to fill in |

## The measures

`field` names a key in `pipeline-metrics.mjs --json`. Where the column says "no field", nothing in
this stack computes it and a human reads the artifact.

| Measure | Where it comes from | Field | Honest label |
|---|---|---|---|
| Repository and ticket discovery at phase 1 | `plan.md`'s evidence, the interview's assumed values, and `plan-audit.md`'s re-derivations | no field | `AGENT_REPORTED`. The reads it took are `UNAVAILABLE`: no host here exposes a tool-call count |
| Loop cost between phases 3 and 5 | one row per spawn in `run-log.tsv` | `loopTurns` | `OBSERVED` for the rows. The turn count is the most useful single number in a run |
| Whether the plan and tests were right first time | phase 4's first verdict | `firstPassPhase4` | `OBSERVED` |
| What the audit caught before any code existed | every `plan-audit.md` round, summed | `audit.caught` | `AGENT_REPORTED`. It counts the auditor's own labels |
| What review caught after the code existed | `review.md` Act on and Risks | `review.actOn`, `review.risks` | `AGENT_REPORTED` |
| Escalations to a human | `verdict` or `note` naming a human | `escalations` | `AGENT_REPORTED` |
| Criteria actually backed by a locked test | the matrix against the lock | `acsMappedToTests` | `OBSERVED`. It has reported more locked than claimed, which is a real finding and not a rounding error |
| Elapsed time | the `ts` columns, judged before use | `wallMinutes`, `tsUnusable` | `OBSERVED` when the column is a measurement, `UNAVAILABLE` when `tsUnusable` is set. Never estimated |
| Human minutes | a person, writing it down | no field | `OBSERVED` only if actually measured; otherwise `UNAVAILABLE`. No script can see this |
| Tokens and cost | the host, where it exposes them | no field | `UNAVAILABLE` here. Nothing in this stack reads host usage |
| Repeated human context | interview answers and "I don't know" routings, compared by a human across runs | no field | `INFERRED`, and `UNAVAILABLE` when earlier runs were not retained |
| Repeated review finding | `review.md` findings with the same mechanism, compared by a human | no field | `INFERRED`. A text match is not a mechanism match |
| Whether a learnings entry helped | a reader judging whether an entry changed what a phase did | no field | `INFERRED`. **Not a citation count** |

## Two measures this stack cannot supply, and says so

**The counterfactual.** `pipeline-metrics.mjs` prints it itself: the comparison that decides whether
this pipeline pays for itself is what the audit caught before any code existed against what escaped
in the workflow it replaced. Nothing here can see the second number.

**Whether a learnings entry earned its read.** A citation count measures compliance with a read
rule, not benefit. The question is whether an entry changed or shortened a decision, and only a
reader holding both the entry and the plan can answer it. Count it as `INFERRED` and name the
reader.

## Running it

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/pipeline-metrics.mjs --issue <KEY> --json
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/pipeline-metrics.mjs --all
```

`--all` aggregates every run still on disk under `.rstack/runs/` in **one repository**. It
cannot reach across repositories or estates.

**Capture the summary before the artifacts go.** `docs` deletes `.rstack/runs/<KEY>` after the
merge, which holds the log every duration comes from, so the metrics are pasted into the run
document and `doc-check.mjs` refuses a document without them. Before that check existed the ordinary
outcome was a log written all the way through a run, nothing ever computing anything from it, and
the cleanup deleting it.

## What would make this file wrong

**Three runs, and a read.** Nothing above has been collected. `.rstack/learnings.md` has never been
written by any run in any repository, and until three representative tickets have been run and this
table filled in, every claim about what a memory of past runs would save is a hypothesis -- including
the one this stack's own documents make.

That is the honest state, and it is the reason this file measures rather than recommends.
