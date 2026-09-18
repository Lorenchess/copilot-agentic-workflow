# What a run costs to discover things

> Before adding cross-run memory or more context: what does rediscovery actually cost today?

Optional and non-authoritative. It grants no permission, adds no input to any state, creates no telemetry, and gates nothing.

## Provenance

Every source carries exactly one label. A value derived from several sources carries the label of each source it depends on (its lineage), never a single label chosen for it.

| Label | Meaning |
|---|---|
| `OBSERVED_HOST` | captured independently by the execution host or runtime: host spans, session records, hook payloads the host wrote. Independent of the agents being measured. A host can also record an unverified assertion; the label covers only fields the host itself measured |
| `OBSERVED_TOOL` | returned directly by the invoked tool or process and retained as evidence for that particular field, with the capture itself inspected (tool authorship alone is insufficient; a tool result an agent retyped is `AGENT_REPORTED`) |
| `AGENT_REPORTED` | claimed or transcribed by an agent into an artifact or log without independent capture |
| `HUMAN_RECORDED` | a human supplied the decision or the value in the host interaction; the durable artifact is an agent's or the host's recording of it, not independently authenticated unless the host provides identity evidence (`approvals.md`). The label states the asserted source, not proof of authorship |
| `INFERRED` | judged by a named human comparing named records |
| `UNAVAILABLE` | this stack cannot supply it |

The two `OBSERVED_*` labels replace the former generic `OBSERVED`; a value that cannot be assigned to one of them specifically is not observed. A genuinely authenticated host or platform event (a signed receipt, a platform approval record) is reported under its own name with `OBSERVED_HOST` provenance; it is never relabelled `HUMAN_RECORDED`, and `HUMAN_RECORDED` is never promoted to it by transcription.

**Provenance is inherited, as lineage.** A value computed from `AGENT_REPORTED` input is `AGENT_REPORTED`, however deterministic the script that computed it. Parsing, validating or counting a self-report checks its form, not its truth; parsing `AGENT_REPORTED` data never upgrades it. A value becomes `OBSERVED_HOST` or `OBSERVED_TOOL` only when that source supplies or corroborates it, and then only for the fields that source actually recorded. The labels have no total order and none is "weaker" than another: an observed remote SHA and a human-recorded decision are different sources supporting different claims, and neither becomes the other by derivation. A mixed derivation therefore keeps every input's label and states what each source supports (a publication conclusion may cite an `OBSERVED_TOOL` remote comparison and a `HUMAN_RECORDED` decision, without the decision becoming an observed fact). If a display needs one summary label, it must not discard the per-source limits.

**Missing is `UNAVAILABLE`** — not zero, not inferred, not estimated. A plausible estimate is worse than a gap because later it is indistinguishable from a measurement. An observed zero stays zero.

## Measures

The metrics parser is UNVERIFIED. `field` is the key the reconstructed `pipeline-metrics.mjs --json` reportedly emits; `—` means nothing computes it.

| Measure | Source | Field | Provenance |
|---|---|---|---|
| Discovery effort for a ticket | `plan.md`, assumptions, audit re-derivations | — | `AGENT_REPORTED`; tool-call counts `UNAVAILABLE` |
| Loop turns (1b↔1r, 3↔4, review rounds) | `run-log.tsv`, written by the orchestrator | `loopTurns` | `AGENT_REPORTED`; `OBSERVED_HOST` only if host spans corroborate the dispatches |
| First-pass success at verification | first state-4 result in the run log | `firstPassPhase4` | `AGENT_REPORTED` |
| Plan-audit findings | every `plan-audit` round | `audit.caught` | `AGENT_REPORTED` |
| Review findings | `review.md` Act on + Risks | `review.actOn`, `review.risks` | `AGENT_REPORTED` |
| Vacuous or missing checks found at review | `review.md` Risks, by kind | — | `AGENT_REPORTED` — the input to the test-challenge decision |
| Human escalations | run log and `decisions.md` | `escalations` | `AGENT_REPORTED`; the decisions themselves are `HUMAN_RECORDED` |
| ACs mapped to locked tests | matrix (agent-written) + lock (tool-written) | `acsMappedToTests` | `AGENT_REPORTED` for an agent-supplied AC mapping; the lock half is `OBSERVED_TOOL` only if its capture is established, and a file hash is a byte measurement, not evidence the mapping is correct |
| Wall-clock duration | run-log `ts` | `wallMinutes`, `tsUnusable` | `AGENT_REPORTED` — agents have invented timestamps; `OBSERVED_HOST` only from host records |
| Model actually used | host session records (`chat-trail.mjs`) | — | `OBSERVED_HOST` when recovered, else `UNAVAILABLE`; never the configured alias |
| Human minutes | a human's own measurement | — | `HUMAN_RECORDED` (the human's measurement, as recorded) or `UNAVAILABLE`; never relabelled as host telemetry |
| Publication attempts whose original result was `UNKNOWN` | approval.md publication records, `PUBLICATION_RESULT` | — | `OBSERVED_TOOL` for a returned result the tool itself wrote into evidence; `AGENT_REPORTED` when retyped. Counts the original attempt result, which never changes |
| Publication actions currently unresolved after reconciliation | approval.md publication records, latest `CURRENT_KNOWN_STATE` | — | same lineage as the read that produced it. Counted separately from the row above: a later reconciled success leaves the first row's count intact and removes the action from this one |
| Token and cost usage | host, if exposed | — | UNVERIFIED availability; use actual measured fields or UNAVAILABLE |
| Repeated human context across runs | comparable interview decisions | — | `INFERRED` |
| Repeated review mechanism | findings compared by mechanism, not wording | — | `INFERRED` |
| A learnings entry changed a decision | human comparing the entry with the decision | — | `INFERRED` |

## Finding quality — post-resolution labels

Measurement labels only. They are applied after a finding is resolved, by a named human, to findings from the plan auditor, the reviewer and any future optional review phase. They never affect `REVIEW_ELIGIBLE`, `RELEASE_ELIGIBLE` or any gate outcome, and nothing reads them during a run. Their purpose is to measure whether each reviewing role earns its cost.

| Label | Meaning |
|---|---|
| `TRUE_POSITIVE` | the finding described a real defect, gap or contradiction |
| `FALSE_POSITIVE` | the finding did not hold on inspection |
| `DUPLICATE` | the same defect was already reported by another finding, role or check |
| `CHANGED_PLAN` | resolving it changed the plan, a criterion, a scope line or an assumption |
| `CHANGED_CODE` | resolving it changed production code or a test |
| `ALREADY_CAUGHT_BY_TEST` | a locked or existing test already failed on the same defect |
| `ALREADY_CAUGHT_BY_DETERMINISTIC_CHECK` | a script check, lock verification, AC checker or gate already reported it |
| `HUMAN_ONLY_DECISION` | it needed a product or policy decision; no role could have resolved it |

Adjudication convention, settled before any metric is collected: `TRUE_POSITIVE` and `FALSE_POSITIVE` are mutually exclusive for one resolved claim — a finding that mixes a real defect with an invalid objection is split into two claims, and a revised adjudication is preserved beside the first, not written over it. The other labels are dimensions that may coexist with either: `DUPLICATE` and `ALREADY_CAUGHT_BY_*` describe overlap, `CHANGED_PLAN` and `CHANGED_CODE` describe effect, `HUMAN_ONLY_DECISION` describes resolution and may sit beside a real policy gap. So one finding may carry several labels (a `TRUE_POSITIVE` that `CHANGED_CODE`). Provenance of the labelling is `INFERRED`; it never substitutes for a missing measurement. Aggregate per role and per run; a role whose findings over at least three representative runs are almost all `DUPLICATE`, `FALSE_POSITIVE` or `ALREADY_CAUGHT_BY_*` is the signal that a decision in `../OPEN-DECISIONS.md` needs the owner, never a reason for a run to skip that role.

## What cannot be claimed

**Counterfactual savings.** The stack sees what the pipeline caught, never what would have escaped without it. "Audit caught N" is not "pipeline saved N defects".

**That a learnings entry helped.** A citation of an entry does not show it was read, and a read does not show it helped. Count one as beneficial only when a named human compares the entry with the decision it touched and concludes it changed or shortened that decision — `INFERRED`.

## Collecting

```bash
node "<pipeline-scripts>/pipeline-metrics.mjs" --issue <KEY> --json
node "<pipeline-scripts>/pipeline-metrics.mjs" --all      # this repository only
```

`<pipeline-scripts>` is the adopted installation's actual script directory, resolved once and written out in full in the same command; keep the double quotes around the whole script path, because a real directory may contain spaces. Do not rely on a plugin environment variable surviving between terminal calls.

Summarise before run artifacts are deleted; the `docs` skill's run document keeps the summary, with the labels. Nothing here is a release condition.

## Deciding

Not from one memorable run. At least three representative runs across different ticket shapes — a threshold for whether the question deserves more measurement, not statistical evidence.

More memory is justified only when retained evidence shows a repeated, material discovery cost **and** the mechanism can reduce it without reaching the fresh auditor or reviewer. Otherwise keep rediscovery.
