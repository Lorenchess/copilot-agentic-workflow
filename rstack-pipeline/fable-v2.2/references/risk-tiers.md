# Risk tiers

A tier sets **depth only**: how far the tester searches for impact and how wide the reviewer reads. It never decides whether a state runs. Every ticket gets every state in `pipeline/SKILL.md`; that is not negotiable by tier, budget or session instruction.

## What a tier changes

| Tier | Tester: impact-search depth | Reviewer: minimum breadth |
|---|---|---|
| LOW | the active repository, searched broadly | the change and its direct callers |
| MEDIUM | LOW + callers and dependents traced through the local graph | the module and its contracts |
| HIGH | MEDIUM + sibling consumers, by estate sweep where the consumer set is itself the question | contracts, external boundaries, and whichever of persistence, concurrency and security apply |

A minimum, never a ceiling. A reviewer who finds the change reaches farther follows the evidence and records the wider surface. There is no numeric score.

## Classification

The planner proposes one tier in `plan.md` and, next to it, the **affected surfaces** with one line of evidence each. The surfaces are the substance; the tier is their summary.

**HIGH** when the change touches any of: a repository or module boundary; a shared library consumed outside the changed unit; a public API or wire contract; an event or message contract; a database schema or migration; an authorization or security boundary; retry or transaction semantics; concurrency; a serialized or persisted representation; core or shared configuration.

**MEDIUM** for behavior changes contained in one repository: service logic, endpoint behavior, validation, internal contracts whose consumers are local.

**LOW** only when the change is demonstrably local to one unit and already well covered: text, isolated validation, local mapping, a small behavior-preserving refactor.

Any one signal is enough. In doubt between two tiers, take the higher; "not known to apply" is doubt, not evidence of absence.

## The tier only rises

Within a run it ratchets up and never down, and raising it needs nobody's agreement. It rises when evidence shows the planned depth was too shallow: `impact.md` finds a consumer outside the scope the plan assumed; a sibling is confirmed as a consumer; the plan auditor contradicts a scope or blast-radius claim; the change crosses a boundary the plan did not predict.

Whoever finds the evidence records the new tier and the evidence in their own artifact; the planner updates `plan.md` on its next revision. The fresh reviewer learns of it only from those artifacts, never from a dispatch note.

A diff larger than the plan's estimate is **not** a tier signal. `change-budget.mjs` reports `OVER` to the reviewer as a lead; the tier rises only if the extra change widens the dependency or contract surface. (The reconstructed design raised the tier on size alone; size is not semantic impact.)

## Tier or surfaces?

The scalar is a coarse summary of the surface list, and only the surface list tells a tester what to search or a reviewer where to look. The tier is kept because the depth table needs a row to select, and because "HIGH" is a cheap signal to a human. If pilot runs show the surface list alone drives the same depth decisions, the scalar can go — a human decision recorded in `../OPEN-DECISIONS.md`. Until then do not automate classification; record per run the initial tier, whether and why it rose, and any finding that only the wider depth produced.
