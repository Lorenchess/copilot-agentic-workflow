# Risk tiers

Risk tiers control **verification depth only**.

They never decide whether a pipeline phase runs.

Every ticket still gets:

1. planning,
2. adversarial plan audit,
3. tests written before implementation,
4. implementation,
5. test/gate verification,
6. independent reviewer-architect review,
7. approval/human external-write decisions.

## Tier contract

| Tier | Impact-search depth | Reviewer depth |
|---|---|---|
| LOW | search the active repository broadly | diff + direct callers |
| MEDIUM | LOW + trace callers/dependents through the local graph | module + its contracts |
| HIGH | MEDIUM + search named/established sibling consumers | contracts + external boundaries + persistence/concurrency/security surfaces that apply |

A tier changes **how far to look**, not whether to look.

## Initial classification

The planner proposes one tier in `plan.md` and gives one evidence line.

Choose the highest tier whose condition is known to apply.

### HIGH

Use HIGH when the planned change is known to touch any of these:

- repository or module boundary,
- shared library consumed outside the changed unit,
- public API or wire contract,
- event/message contract,
- database schema or migration,
- authorization/security boundary,
- retry/transaction semantics,
- concurrency,
- serialization/persisted representation,
- core/shared configuration.

### MEDIUM

Use MEDIUM for behavior changes contained within one repository, including:

- service/business logic,
- endpoint behavior,
- validation behavior,
- internal contracts whose consumers remain local.

### LOW

Use LOW only when the change is demonstrably local to one unit and its behavior is already well
covered, for example:

- message/text changes,
- isolated validation,
- local mapping,
- small behavior-preserving refactor.

When uncertain between two tiers, use the higher one.

## Escalation during the run

The tier is monotonic within a run: it may rise, never fall.

Raise it when new evidence shows the original search depth was insufficient, including:

- impact analysis finds a consumer outside the scope assumed by the plan,
- a sibling repository is confirmed as a consumer,
- the plan auditor contradicts a scope/blast-radius claim,
- the implemented diff crosses a module/repository/contract boundary the plan did not predict.

Record the evidence for the raise in the run log.

A larger-than-estimated diff is **not by itself** a semantic-risk signal. `change-budget.mjs` should
still report the overrun to the reviewer, but the tier rises only when the extra change widens the
dependency or contract surface.

## Reviewer behavior

The reviewer always runs.

The tier sets the minimum breadth of inspection, not a checklist and not a ceiling. If the reviewer
finds evidence that the change reaches farther, it follows that evidence and records the broader
surface.

## Full-suite rule

Scoped tests make the implementation loop affordable.

They never close the ticket.

Before approval completes, the suite required by the pipeline's final gate must run at the commit/HEAD
that will ship.

## Do not automate classification yet

Keep classification explicit until real runs show stable signals.

Measure:

- initial tier,
- whether it escalated,
- what evidence caused escalation,
- review findings found only because of the wider depth,
- extra runtime attributable to the wider depth.

Automate only after those observations show a repeatable rule.
