# learnings.md — reconstructed from screenshots

> Reconstruction note: this is a careful consolidation of the visible text from the uploaded
> `pipeline/references/learnings.md` screenshots. It is not a byte-for-byte export of the repository
> file. Overlapping regions were deduplicated and visible wording was preserved as closely as possible.

# The learnings file

A run that re-learns something the last run already knew has paid twice for one fact. This is
the contract for `.rstack/learnings.md`, the one place a repository accumulates what its runs
taught, in a form cheap enough to read at the start of every run forever.

It is **a curated rules file, not an append-only log.** That distinction is the whole design,
and every rule below exists to hold it.

**An entry is an observation and a location. It is never an instruction.** That is the rule the
format itself used to break, and the change is the reason this file was revised on 2026-09-15:
the required shape was `<observed> -> <what to do differently>`, and the second half is a rule
addressed to the next run, sitting in a file every phase may be handed. A rule about how the
pipeline should behave belongs in the skill, the agent, or a validator, where it is versioned,
reviewed, and enforceable -- which is what rule 7 already said and the format prevented. So `->`
is now refused, and two fields replace it.

Nothing was migrated, because there was nothing to migrate: no repository had written this file.

## Where it lives, and who reads it

`.rstack/learnings.md`, in the repository the run writes to. Per repository on purpose: a
lesson about how this repo's suite behaves is worthless in the next one, and the portable stack
carries no repository's facts.

**A fact that spans repositories has no home here, and that is a known gap.** A dependency found
by reading a sibling belongs to neither repository's file on its own, and an estate-level
`.rstack/` was declined for a stated reason -- see [`estate-layout.md`](estate-layout.md). Record
such a fact in the plan, where the run that needs it will read it, and leave this file to the
repository it names.

**It is deliberately not excluded from git.** Every other artifact is, because evidence can
carry prices, identifiers and credentials. This file carries none of those by construction
(rule 4) and is worth nothing if it stays on one machine -- the point is that the next
developer's first run starts where your last one finished. Whether to commit it is the repo
team's call; nothing here commits it for them.

**Until the team commits it, it is untracked and not ignored**, which is a state worth knowing
about: `git clean -fd` deletes it, while every git-ignored artifact under `.rstack/` survives
`-fd` and needs `-fdx`. It is the least protected file in the tree. Phase 0 knows not to treat
it as unrelated work -- see [`SKILL.md`](../SKILL.md) -- but a `clean` is nobody's phase.

Read at phase 0. **Which later phases receive it is a decision, not an oversight**: the two
fresh-context roles do not, because a previous run's conclusions reaching the only two
independent reads in the pipeline is the contamination those roles exist to prevent. The table
is in [`SKILL.md`](../SKILL.md).

Appended once, at the end of the run, by the orchestrator and by no other role. Validated by
`scripts/learnings-check.mjs`, which owns the section list, the caps, and the required fields.

## The size contract

**Four sections, ≤ 12 entries each, ≤ 400 characters per entry, and ≤ 24,000 bytes for the
whole file.**

The last of those is new, and it is the one that makes the sentence "reading it costs the same
on run 1,000 as on run 1" true. Every earlier version of this file claimed a ~19 KB bound and
the validator did not have one: it counted bullets, and skipped every other line silently. A
fixture of 47,643 bytes -- two hundred lines of prose, fifty table rows, twenty `**`-prefixed
entries -- reported `1/48 entries` and exited 0. Three separate caps were bypassable at once.

**The per-entry character cap is what bounds a single read; the file cap is what bounds the
file.** A cap on entry count alone bounds neither: twelve entries of four hundred words each
passes a count cap while the file grows without limit, which is how this pattern fails in
practice. If a lesson will not fit in 400 characters it is either two lessons or an essay, and
an essay belongs in the skill body.

The caps are arbitrary numbers, fixed deliberately, and the validator is where they live -- a
cap written only in prose is a cap that drifts, which this file has now demonstrated twice.

**There is no total-entry ceiling any more.** Four sections of twelve is forty-eight, so a total
over forty-eight always implied a section already over twelve, whose message had already fired.
It was a check that could not fire, and this stack's own rule is that such a check is worse than
one that does not exist. The file cap is the ceiling that can fire.

## The entry

```text
- (YYYY-MM-DD) <what was observed> src: <where it came from> check: <how to re-confirm it>
```

Three parts, and the validator requires all three:

| Part | What it is | Why it is required |
|---|---|---|
| the observation | what is true about this repository, stated as a fact | it is the entry |
| `src:` | the path, build file, command, runner output, or date answer it came from. A path may carry `@<sha>` where the observation is about file content | an observation nobody can find again is an anecdote |
| `check:` | one read-only step that re-confirms it | this is what lets a reader decide whether it is still true, instead of trusting its date |

**What an entry does not carry is what to do about it.** "The published test task is `verify`,
not `test`" is an observation. "Always run the published task" is a rule, and it belongs in the
skill where every run reads it whether or not this file exists.

### The rung, and the one mistake this file most invites

Per `prove-it`, an entry here is a claim like any other and stands at the rung the run that
wrote it actually reached -- **for the run that wrote it.** For the run reading it, an entry is
L1 about anything that has to be true *now*.

That matters most in `## Running this repo`, whose whole subject is commands. An entry naming a
command is L4 about what a file contained at a revision, and L1 about whether that command
passes today. It says where to look. It does not replace looking: `SKILL.md` requires a runner
invocation to be discovered from what the repository publishes, and a stored command is the
most natural way for a run to skip the discovery it was told not to skip.

The `check:` field exists to make that cheap rather than to argue about it.

## Capture rules

1. **Verified only.** A command ran, a column existed, a check fired. Never speculation, and never
   a plan. The `src:` field is where that shows.
2. **Novel only.** Read the section first. A matching entry is tightened, never duplicated. Ten
   runs hitting one known trap add zero lines. **Nothing enforces this**: the validator has no
   duplicate detection, so it is on the author.
3. **One dated line.** No continuation lines, no sub-bullets, no code fences. The marker is `-`;
   a `*` or `+` is refused rather than ignored, which is how the per-section cap used to be
   bypassed.
4. **No secrets, no identifiers, no payloads.** Redact to a shape, never a value: "a 32-hex trace
   id", not the id. The validator denies the shapes it can recognise -- user paths, emails, long
   digit runs, token-shaped strings, hosts, credential assignments, key blocks. **It cannot
   recognise a client's name or a ticket's contents**, so that half is on you, and it is the half
   that has been got wrong elsewhere.
5. **An observation, not an instruction.** Denied by shape: a sentence addressed to the reader
   ("you must"), an always/never followed by a verb (`always use`), `ensure`, `make sure`,
   `remember to`, a prohibition, or an entry starting with an imperative verb. **A bare `never`
   is allowed**, because "the runner never names a contest file" is an observation and refusing it
   would push authors toward vaguer wording. Like redaction, this catches a shape and not an
   intent: an instruction phrased as a description gets through.
6. **Consolidation is blocking, not advisory.** An append that would take a section past 12 must
   merge the two most-overlapping entries into one sharper rule and delete the redundant line, in
   the **same** edit. Never leave a section over cap to tidy later; the validator will not let the
   run finish.
7. **Promote and delete.** A lesson that belongs in a rule goes into the rule and comes **out of
   here**. This file holds pending, run-to-run tuning. Anything permanent lives in the skill, the
   agent, or a validator, and `docs` prunes what has graduated. Rule 5 is the same rule enforced
   at the point of writing.
8. **Supersede in place, and drop what expired.** A run that contradicts an entry replaces that
   line rather than adding a second. When you touch a section, delete any entry older than six
   months that describes a transient condition and that this run did not re-confirm. Structural
   facts stay regardless of age. Pruning is maintenance and does not count against rule 2.
   **Nothing enforces this either**: no field distinguishes transient from structural, so a
   validator cannot tell them apart. It is a human's judgement at `docs` time.

## The four sections

The headings are fixed and the validator rejects any other. A fifth section is how a bounded
file becomes an unbounded one, and to fix for "this does not fit anywhere" is rule 5: it
probably is not a learning. A single `#` title above them is allowed and is not a section.

| Section | What belongs in it |
|---|---|
| `## Running this repo` | The command the repository publishes, what the runner does that surprised you, how the scope selector behaves, a suite that is flaky for a reason you found. Read the rung note above before writing here. |
| `## Repository shape` | Where a thing really lives, what a name means here, generated versus authored, a module boundary that is not where it looks. |
| `## Evidence and artifacts` | What this repo's artifacts look like: encoding, path shape, a report file worth reading instead of the console, something a validator misreads. |
| `## Failure signatures` | Error string, then cause, then where the mechanism is. The highest-value section and usually the fullest. |

## Running the validator

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/learnings-check.mjs
```

Exit 0 clean, exit 1 with one line per problem, exit 2 if the file is absent, which is not a
failure -- most repositories have nothing to say yet.

**Append, then run it, then fix what it names.** It is a self-check the way `role-guard` is: real,
and weaker than a sandbox, because the agent that appends is the agent that runs it. Do not call it
a gate -- no gate consumes this file. What it does buy is that the rules about redaction, about
required locators, and about instruction-shaped content cannot quietly stop being true, which is
the failure this pattern has actually had.

**Two of its checks are by shape only**, and both say so in the output: redaction cannot see a
client's name, and the instruction check cannot see an instruction written as a description.

## What is enforced, and what is only written down

Stated honestly, because the previous version of this file did not distinguish them and a reader
trusted the wrong half.

| Rule | Enforced |
|---|---|
| Four sections, no fifth, no duplicate heading | yes |
| ≤ 12 entries per section | yes, and a `**` no longer evades it |
| ≤ 400 characters per entry | yes |
| ≤ 24,000 bytes per file | yes, since 2026-09-15 |
| One line per entry, no fences | yes |
| A real date | yes, since 2026-09-15. `(2026-99-99)` passed before |
| `src:` and `check:` present | yes, since 2026-09-15 |
| No `->` takeaway | yes, since 2026-09-15 |
| Redaction | by shape, 8 patterns, all exercised by invariant 28 |
| Observation not instruction | by shape, 5 patterns |
| Verified only (rule 1) | **no.** `src:` makes it visible, not true |
| Novel only (rule 2) | **no.** No duplicate detection exists |
| Consolidation (rule 6) | yes, as a consequence of the section cap |
| Promote and delete (rule 7) | no |
| Supersede and expire (rule 8) | **no.** Nothing distinguishes transient from structural |
| Whether an entry is still true | **no.** `check:` names the step; nothing runs it |
