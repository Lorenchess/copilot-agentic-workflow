# The plan interview

The plan interview exists to capture **developer-owned decisions that the ticket cannot settle** before
the planner writes `plan.md`.

It is not discovery, not acceptance-criteria repair, and not a questionnaire.

## Core rule

Separate every unknown into one of two classes:

- **Fact** — the planner can determine it from code, config, history, or tools. Find it.
- **Decision** — the developer owns the choice. Ask it.

Do not ask the developer to do repository discovery for the planner. Do not make a product/scope
decision on the developer's behalf.

## Ask only the current frontier

Some decisions depend on others.

Ask only decisions whose prerequisites are already settled. Ask all currently answerable decisions in
one round, then wait.

If question B depends on question A, B belongs to the next round.

This prevents "guess about a guess" answers and usually keeps the interview to one or two rounds.

## Do not ask when

Skip a question when:

- the ticket already settles it,
- repository evidence already settles it,
- the answer is forced,
- the answer would not change the plan.

The interview is complete when no unresolved developer-owned decision can change `plan.md`.

## Question format

Use one short numbered message per round.

```text
1. <decision title>
   <the decision, in the ticket's language>
   Recommended: <default> — <one-line reason>
```

Keep each question short enough to scan.

The recommendation is a **default**, not agreement. The developer may accept, amend, reject, or say
"I don't know."

## Useful decision lenses

Use only when relevant:

| Lens | Decision to surface |
|---|---|
| Scope | What is intentionally out of scope? |
| Regression | Which existing behavior must remain unchanged? |
| Data shape | Which real cases materially affect the design: empty, absent, duplicate, scale? |
| Failure | What failure behavior matters to the caller/operator? |
| History | Is there prior work or a rejected approach that constrains this change? |
| Inversion | What fact would make the proposed direction the wrong change? |

These lenses generate candidate decisions; they are not a checklist.

## Raise contradictions before planning

If the ticket contains two incompatible readings, quote both and ask which governs.

Do not:

- pick the newer statement just because it is newer,
- silently reconcile them,
- turn both into assumptions.

If a linked specification appears stale relative to the code or ticket, show the evidence and ask
whether it still governs.

## "I don't know"

Tell the developer that `"I don't know"` is valid.

Handle it by consequence:

- If a safe default allows the plan to proceed, record the default in `plan.md` under **Assumptions**,
  including what changes if it is wrong.
- If the decision controls an acceptance criterion or otherwise blocks a correct plan, record it under
  **Open questions** with the owner and stop planning.
- In either case, include the unresolved claim in the auditor's sanitised brief with evidence marked
  absent.

Never turn an unknown into an apparently sourced fact.

## Stop condition

Stop interviewing when another answer would not change:

- scope,
- an acceptance criterion,
- an ordered unit,
- the test plan,
- a risk/blast-radius claim,
- an assumption,
- or an open question.

Then write the plan.

Do not continue asking questions merely to demonstrate thoroughness.

## Relationship to acceptance-criteria clarification

This interview assumes there is already a meaningful definition of done.

If acceptance criteria are absent or not falsifiable, use the planner's acceptance-criteria
clarification path first. That establishes **what done means**.

This interview establishes **which decisions shape the implementation plan**.

## Evidence rule

A developer answer is input to a decision, not proof of repository state.

If the answer conflicts with code/config/history:

1. cite the repository evidence,
2. cite the developer's answer,
3. surface the conflict,
4. do not silently choose either one.

## Enforcement

This reference is intentionally procedural. Do not add another gate merely to count interview rounds.

The durable evidence is the resulting `plan.md`:

- assumptions are explicit,
- open questions are explicit,
- contradictions are surfaced,
- acceptance criteria are not invented.

The plan audit is the independent check on whether the planner converted uncertainty into unsupported
claims.
