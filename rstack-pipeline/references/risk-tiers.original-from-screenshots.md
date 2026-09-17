# risk-tiers.md — reconstructed from screenshots

> Reconstruction note: this is a careful consolidation of the visible text from the uploaded
> `pipeline/references/risk-tiers.md` screenshots. It is not a byte-for-byte export of the repository
> file. Overlapping regions were deduplicated and visible wording was preserved as closely as possible.

# Risk tiers

One pipeline for every ticket is the wrong shape. The first real run cost roughly eleven agent turns
to deliver a five-line, one-point ticket, and a workflow that expensive on trivial work is one a team
quietly stops using.

But the answer is not a cheap path that drops a check, because then the cheap path is the one
everybody picks and the pipeline is decorative. So the tier varies **how much work a phase does**, and
never **which phases run.**

## Every phase runs at every tier

Not negotiable by tier, by budget, by session instruction, or by how obvious the ticket looks.

- **The check is written before the code, by an agent that does not write the code.** Phases 2 and 3
  stay separate. A test written by whoever wrote the production code is a restatement rather than a
  check.
- **Phase 1b, the adversarial plan audit.** The phase most tempting to cut and the one with the best
  evidence behind it: on a one-point ticket any classification here calls LOW, it raised eight
  findings, five of them refuted plan claims.
- **Phase 5, the architect review.** See below. This one used to be skippable and is not.
- **`gate.mjs` decides when the work is done**, and no agent decides for itself.
- **One full-suite run before the ticket can close.** Scoped runs carry the loop; they cannot close it.
- **No agent merges, and external writes are asked for one at a time.**

## Phase 5 is unconditional, and that is a deliberate reversal

Phase 5 was optional at LOW for one release of this stack. It is not any more.

The argument for skipping it was cost: a review is the most expensive phase, and a one-line message
change does not obviously need one. The argument against it is stronger, and it is about what the
reviewer is actually for. **It is the only phase that reads the change from a different question:**
not "does this meet the criterion," which the gate already answered, but "is this how the change should
have been made, and what else does it touch." Those are not answerable by the phases that wrote the
code and the tests, at any size of change.

Two things follow that were not obvious until phase 5 was skipped on a real ticket:

- **A small diff is not a low-risk diff.** Fourteen lines added to a shared JSON fixture is the kind of
  change whose blast radius is entirely invisible in its size.
- **The tier was predicting risk before the code existed.** The planner assigned LOW at phase 1 from
  the ticket. Whether the change is risky is a property of the diff, which arrives at phase 3. A
  prediction is a poor thing to hang the only independent read on.

So the promotion mechanism is gone with it. There is nothing left to promote *to*: phase 5 was the
only thing a tier could remove, so the budget, the impact search and the auditor no longer need to vote
on whether it runs. Each of those still produces a finding the architect reads, which is a better use
for all three than a routing decision.

## What the tier still does

**Depth, not presence.** How wide phase 4's impact search has to be before a null result means anything,
and how hard the architect is expected to look.

| | LOW | MEDIUM | HIGH |
|---|---|---|---|
| impact search | active repo, wide | plus callers traced through the graph | plus a cross-repo sweep |
| architect's expected depth | the diff and its direct callers | the module and its contracts | contracts, wire formats, persisted shapes, concurrency |

That is the whole table now. A tier is a hint about how much looking is proportionate, not a gate
anybody can pass by being classified generously.

## Classifying

The planner proposes the tier in `plan.md` with one line of evidence. Any one signal is enough to raise
it:

**HIGH** if the change touches a shared library, a database schema or migration, an event or message
contract, retry or transaction semantics, authorization, a public API contract, concurrency,
serialization, or core configuration. Also HIGH when it crosses a module or a repository boundary.

**MEDIUM** for service logic, a new validation rule, new endpoint behaviour, or a change to existing
behaviour whose consumers are all inside this repository.

**LOW** for a change with no consumers outside its own unit: a message string, an isolated validation,
a mapping with existing coverage, a small internal refactor whose behaviour is already pinned by
tests.

**When two tiers both fit, take the higher one.** The cost of being wrong is asymmetric now in a
smaller way than it used to be: it buys a wider search rather than a whole extra phase.

## Tiers still ratchet up, never down

A tier may be raised during a run and never lowered. What raises it, and none of these needs anyone's
agreement:

- **`change-budget.mjs` reported `OVER`.** Production lines or modules came in at more than double the
  plan's estimate, so the change is bigger than the tier was assigned for.
- **`impact.md` found a consumer outside the changed unit**, or any hit in a sibling repository.
- **The auditor issued `CONTRADICTED`** on a scope or blast-radius claim.

The consequence is now narrower and more honest: a raised tier means the architect is expected to look
wider, and the run log records why. It does not decide whether the review happens.

## Automate the classification later, not now

Route by hand. The tier goes in `plan.md`, any raise goes in the run log, and `pipeline-metrics.mjs`
accumulates what each tier cost and caught.

**Automate only when the metrics can tune it**, which needs runs rather than reasoning. The question to
answer first: how often was a tier raised, and by which of the three signals? A tier raised on most
tickets was mis-specified, and that is worth knowing before it is encoded in a script nobody rereads.
