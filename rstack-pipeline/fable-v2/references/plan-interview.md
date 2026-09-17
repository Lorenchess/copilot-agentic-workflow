# The plan interview

Captures the **developer-owned decisions the ticket cannot settle**, before the planner writes `plan.md`. It is not discovery and not a questionnaire. Nothing enforces any of it; the evidence that it happened is the plan itself, and the fresh plan audit is the only independent reader of that plan.

## Fact or decision

- **Fact** — determinable from code, config, history or tools. Find it. Never ask the developer to do repository discovery.
- **Decision** — a choice the developer owns. Ask it. Never make a scope or product decision for them.

A developer's answer is input to a decision, not proof of repository state. If it conflicts with code, config or history: cite the evidence, cite the answer, surface the conflict, choose neither.

## Ask the current frontier

Ask only decisions whose prerequisites are settled, all of them in one numbered message, then wait. A decision that depends on another belongs to the next round. Do not hold the round for a search still running; ask what is askable now.

Skip a question the ticket or the repository already settles, or whose answer is forced. Stop when no unresolved developer-owned decision could change scope, a criterion, a unit, the test plan, a blast-radius claim, an assumption or an open question. Do not keep asking to look thorough.

```text
1. <decision title>
   <the decision, in the ticket's language — no internal identifiers unless explained>
   Recommended: <default> — <one-line reason>
```

The recommendation is what the planner will record if nobody answers — as `default, unopposed`, never as agreement. The developer may accept, amend, reject, or say "I don't know". An amended proposal is a new proposal to confirm.

Lenses, only when relevant: **scope** (what is deliberately out), **regression** (what must not change), **data shape** (empty, absent, duplicate, scale), **failure** (what the caller or operator must see), **history** (prior or rejected work), **inversion** (what fact would make this the wrong change).

## Contradictions come first

Two incompatible readings in the ticket: quote both and ask which governs. Do not prefer the newer one, reconcile them silently, or turn both into assumptions. A linked specification that looks stale against the code or ticket: show the evidence, give its last-updated date, ask whether it still governs.

## "I don't know"

Say in the first round, in those words, that "I don't know" is a valid answer. Then, by consequence:

- a safe default lets the plan proceed → **Assumptions**, with what changes if it is wrong and the fact that the developer did not know;
- the decision controls an acceptance criterion or otherwise blocks a correct plan → **Open questions** with its owner, and planning stops;
- either way the claim enters `## Claims for audit` with its evidence marked absent.

An unknown never becomes an apparently sourced fact. Silence is never consent.

## Relation to acceptance criteria

This interview assumes a meaningful definition of done. Absent or unfalsifiable criteria are settled first, through the planner's criteria step: that establishes what done means; this establishes which decisions shape the plan.

A thin ticket with an empty Assumptions section is the tell that the interview was skipped.
