# plan-interview.md — reconstructed from screenshots

> Reconstruction note: this is a careful consolidation of the visible text from the uploaded
> `pipeline/references/plan-interview.md` screenshots. It is not a byte-for-byte export of the
> repository file. Overlapping regions were deduplicated and visible wording was preserved as
> closely as possible.

# The plan interview

A plan built from a ticket alone is a plan built from the half of the problem somebody wrote down.
The developer holds the other half: what is out of scope, what must keep working, what was tried
before, and which of the ticket's words mean something specific here. None of it reaches the plan
unless somebody asks.

This is the contract for that interview. It runs in phase 1, after the ticket is read and before the
plan is written, so the auditor at phase 1b judges a plan the developer has already sharpened rather
than one assembled from a ticket and a guess.

Adapted from the public `grilling` skill. Two of its ideas do the work here: the design tree, and the
frontier.

## The design tree, and the frontier

Treat the plan as a tree of decisions. Every decision branches into the decisions that hang off it,
and most of them cannot be asked yet because their answer depends on one that is still open.

The **frontier** is every decision whose prerequisites are already settled: the questions answerable
now without guessing at an answer you have not heard. Ask the whole frontier in one round, then wait.
Each answer settles a decision, pushes the frontier outward, and unblocks the questions that were
waiting on it.

**A question whose answer depends on another question in the same round belongs to a later round.**
Asking both together forces the developer to answer the second one twice, once against each possible
answer to the first, and what comes back is a guess about a guess.

## What never enters the frontier

The frontier is pruned before it is asked, and these two rules do the pruning. They are what keep this
from becoming a questionnaire.

**A decision whose answer is forced is already settled.** One repository in the estate settles which
repository. A ticket that names its acceptance criteria settles them. This is the standing rule and it
outranks thoroughness: a question whose only sensible answer is the one you already have teaches the
reader to click through questions, and the next one will be the one that mattered.

**A fact is yours to find, never theirs to supply.** If a command, a search, or a file read would
answer it, that is a command and not a question. Dispatch a subagent for anything bulky, per
`principles` 8, and **do not block on it**: a running search is an unsettled prerequisite, so only the
questions downstream of it wait. Ask the rest of the frontier now.

The division is the whole design. **Facts are yours. Decisions are the developer's.** A planner that
asks where a class lives has outsourced its own job; a planner that decides what is out of scope has
taken the developer's.

## The round format

One message per round, questions numbered, and each one carrying a recommendation. No internal
identifiers unless you say what they are, per the planner's own rules on asking.

```text
1. <Short title>
   <The decision, in one or two sentences, in the ticket's language.>
   Recommended: <the answer you would take, and the one line of reasoning behind it.>

2. <Short title>
   ...
```

**Every question carries a recommendation, and the recommendation is not a vote.** It is what you
will do if nobody answers, which the planner already requires of every question it asks. Stating it
converts a question the developer has to research into one they can accept, correct, or overrule in a
word. A question with no recommendation is a request for homework.

Keep each one to about four lines. A question that runs longer is a paragraph wearing a question mark,
and it gets skimmed.

## Lenses worth reaching for

Not a checklist, and not every ticket needs every one. These are the branches that most often turn out
to have been assumed:

| Lens | The question behind it |
|---|---|
| Scope edge | What is explicitly **not** in this ticket, that a reader might expect to be |
| Regression | What currently works that must still work, and would nobody notice if it broke |
| Data shape | The real shape and volume, the empty case, the absent case, the duplicate case |
| Failure | When this fails in production, who sees it first and what do they see |
| History | Has this been attempted before, and what happened |
| Inversion | What would have to be true for this to be the wrong change |

Two of these are not judgement calls, and they are the two the planner can spot on its own before
asking anything. Raise either one the moment you see it:

**The ticket contradicts itself.** The description says one thing and the acceptance criteria say
another, or a comment revises a value the description still carries. **Quote both, verbatim, and ask
which is correct.** Do not reconcile them yourself and do not take the later one for being later. This
is distinct from a criterion that is merely unfalsifiable, which the planner already interviews for:
a vague criterion has one reading nobody can test, and a contradiction has two readings that can each
be tested and disagree. Only the second one will look like agreement in the plan.

**A linked page is older than the thing it describes.** A specification, a diagram, or a sibling
ticket that predates a change in the same area is a common source of a superseded value, and it reads
as authority. **Say when it was last updated and ask whether it still holds** rather than treating the
date as a detail. A stale page cited in a plan is worse than no citation, because the audit will
confirm the plan quotes it accurately.

## "I don't know" is a valid answer, and it is the most useful one

Say so in the first round, in those words. A developer who feels obliged to answer will supply a
plausible number, and a plausible number is worse than an admitted gap because nothing downstream can
tell it from a measured one.

An unknown does not stall the interview. It is recorded, and it is aimed at the audit:

1. **Take the recommendation as the working answer** and write it into `plan.md` under Assumptions,
   phrased so overturning it is one sentence: the assumed value, that the developer did not know it,
   and what changes in the plan if it is wrong.
2. **Where nobody can settle it and it decides a criterion**, it belongs in Open questions with the
   owner named instead. An assumption is something the plan proceeds on; an open question is something
   the plan waits on.
3. **Flag it in the sanitised brief.** The claim goes to the auditor with its evidence recorded as
   absent and the developer's unknown stated. That is the strongest lead the audit gets: a claim nobody
   could source is where the plan is guessing, and the auditor's job is to find exactly that.

An unknown that reaches `plan.md` and not the brief is an unknown the audit will probably confirm by
accident.

## When to stop

**When the frontier is empty.** Every branch visited, nothing left silently assumed.

That arrives sooner than it sounds, because the pruning rules above keep forced decisions and findable
facts out of the frontier entirely. Most tickets settle in one or two rounds.

**The tell that it should have stopped already** is a round whose answers change nothing in the plan.
That means the frontier was empty and the questions were asked to look thorough. Stop, and say what
the interview settled.

**Do not begin planning while a decision is open.** A plan written over an unanswered question has
answered it, silently, in whichever direction the writing went.

## Limits

**Nothing enforces any of this.** It is prose, like the phase-0 prompt count, and it can be skipped
without any script noticing. The tell is a `plan.md` whose Assumptions section is empty on a ticket
that was thin.

**The interview cannot rescue a ticket with no criteria.** That case is already mandatory and handled
elsewhere: the planner interviews for acceptance criteria whether or not this interview runs, and
neither substitutes for the other. This one sharpens a plan; that one establishes what done means.

**A confident answer is not a sourced one.** An answer that contradicts the code is a finding, not an
input. Where the developer's answer and the repository disagree, cite both and raise it rather than
picking the human because they are in the room.
