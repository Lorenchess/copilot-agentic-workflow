# Write boundaries

One source of truth for which agent may write which **files**. `role-guard.mjs` enforces this
table; every agent's Guardrails section restates its own row and nothing else.

**Files, and only files.** This said "which agent may write what", which reads as covering
everything an agent can do and does not: there is no row here for committing, pushing, merging or
opening a pull request, and `role-guard.mjs` classifies changed paths with no concept of a git
operation at all. Those live in each agent's own Guardrails prose and in the standing rules, are
enforced by the terminal approval list rather than by any script here, and are summarised in
[`approvals.md`](approvals.md). Reading this file as the whole boundary is how an agent that holds
`Bash` ends up looking permitted.

## The table

| Role | `.rstack/` | `learnings.md` | tests | production | build files | the pipeline itself |
|---|---|---|---|---|---|---|
| `rstack-orchestrator` | write | **write** | no | **no** | no | **never** |
| `rstack-planner` | write | **no** | no | **no** | no | **never** |
| `rstack-plan-auditor` | **no** | **no** | no | **no** | no | **never** |
| `rstack-tester` | write | **no** | **write** | **no** | no | **never** |
| `rstack-dev` | write | **no** | **no** | **write** | no | **never** |
| `rstack-reviewer-architect` | no | **no** | no | **no** | no | **never** |
| `rstack-approval` | write | **no** | no | **no** | no | **never** |

**Exactly one role may write a test, and exactly one may write production code, and they
are different roles.** That is the whole design. Two roles may write nothing at all. No role
may write a build file without a waiver, because a build file decides how the suite runs and
an implementer who cannot touch a test but can edit the runner's config has the same power by
another route.

### The last column, and why it says never rather than no

`governance` in `boundaries.mjs`: the lane definition (`.rstack/boundaries.json`), the
**installed** agents and skills under `.github/`, the instruction tiers, the hook and
permission roots, and the plugin manifests. **No role writes them**, and unlike every other
column a waiver does not cross them. `role-guard.mjs` refuses the waiver rather than
recording it, and the refusal names a human as the owner of the move.

**Installed, and that word is doing work.** This sentence used to begin "this file, the lane
definition it describes", which an independent verifier refuted: in the clone this document
lives at `plugins/rstack/skills/pipeline/references/`, which matches no governance glob and
classifies as `production`, so in the repository where the pipeline is developed it sits in
the implementer's lane. The class covers the **delivered** copy at
`.github/skills/pipeline/references/`, which is what a run actually loads. The clone-side
files are protected by review and by this suite, not by this class, and claiming otherwise
was the same overclaim the class exists to prevent.

The difference matters because every other boundary here is deliberately
crossable-and-visible: `pom.xml` sometimes genuinely needs a production dependency, and the
waiver log makes it reviewable afterwards. That trade is right for a file whose worst case is
a bad build and wrong for a file whose worst case is that the checks stop discriminating.

Three routes were open before this column existed, and all three were proven by running the
classifier rather than by reading it:

- **`.rstack/boundaries.json` matched `artifact`, which is in every role's lane.**
  `loadBoundaries` **replaces** a class rather than merging it, so `"test": []` written into a
  file inside the implementer's own lane reclassified every test in the repository as
  `production`, which is also its lane. One in-lane edit and the boundary this document exists to
  describe stopped existing, with the guard reporting clean and nothing recorded.
- **The installed pipeline classified as `production`, whose writer is the implementer.**
  `.github/agents/rstack-dev.md`, this file at `.github/skills/pipeline/references/`, and
  `.github/skills/pipeline/scripts/gate.mjs` all returned `production`. A single-repo install
  commits `.github/` to that repository, so they sit in the tree the guard reads.
- **The waiver needed no human, and the guard printed the waiver command on every violation**,
  so the party being constrained was handed the escape hatch by the guard itself.

The class is **not configurable**, and that is enforced rather than assumed: a
`.rstack/boundaries.json` declaring `governance` is refused with an error, because a class
declared in the file it protects is not a protection.

Deliberately **not** in this class: the test lock, the two waiver logs, and `estate-pin.json`.
Their own tools write them during a run, so classifying them here would fail a phase's guard
on a file that phase's tool had just produced. The line is that governance is what the
pipeline **is**, never what a run produced.

### The `learning` lane, and why it is not `governance`

`.rstack/learnings.md` is its own class, granted to the orchestrator and to nobody else. It is the
second column above and it was added on 2026-09-15.

The reason is the `observation-accept.tsv` reason, one file over: **`artifact` is one bucket, five
roles hold it, and this is the only file under `.rstack/` that a LATER RUN reads.** Phase 0 reads it
as this repository's settled truth. Left where every role can write, the tester could record that
this repo's suite behaves however its own gate needed it to behave, and the next run would open that
as a fact. No guard could object because the write was in lane.

It is **not** `governance`, and the distinction is the line that column draws: governance is what
the pipeline **is**, and this is what a run produced. Classifying it there would also refuse the
orchestrator's own append at the end of a run, which is the mechanism the file's contract is built
on. So it is a narrower `artifact`, not a wider `governance`.

A waiver **does** cross it, unlike `governance`. The worst case here is one wrong line in a bounded,
human-readable file that the next run's `check:` step is designed to re-test -- crossable and
visible is the right trade, and the waiver log makes it reviewable.

`learning` is deliberately **not configurable** in `.rstack/boundaries.json`, for the same reason
`governance` is not: a repository able to redefine the class could return the file to `artifact` and
hand it back to five roles.

The class list itself now lives in `boundaries.mjs` and is imported by `role-guard.mjs`. It used to
be written out in both, and adding this class to the classifier and not to the guard's copy crashed
the guard on `undefined.push` -- so it reported nothing at all, which is worse than reporting the
wrong bucket. One list, one place to add a class.

**One deliberate exception to that line:** `.rstack/runs/<KEY>/evidence/observation-accept.tsv`.
It is per-issue and per-sha, so by origin it looks run-produced, and it is here on the
purpose test instead: it decides whether a `HELD` gate may proceed. No tool writes it, unlike
the lock and the waivers. It is a human recording that a rung was inferred rather than
measured, and left in `artifact`, where every role can write, the tester could sign off its
own missing evidence. There is nothing for a tool to prove here the way `base-replay` proves
a `PRE-EXISTING` verdict, so a human creates the file by hand and that friction is the
mechanism rather than a rough edge. Schema in
[`handoff-contracts.md`](handoff-contracts.md).

### Two limits of this class, stated because they are real

**An empty class in a declared `boundaries.json` is refused, and that took a second pass.**
Making the file unwritable stopped a phase creating `"test": []`; it did nothing about one
already committed, from a human, a merge, or a branch cut before the class existed. With that
file in the tree and only a test file dirty, the implementer's guard printed `production (1)`
`ok` and exited 0, because `loadBoundaries` **replaces** a class and an empty list deletes it.
Narrowing a class is legal and sometimes necessary; emptying one is refused for every class.

**A version bump cannot be completed inside any single lane, and that is the intended
answer.** `VERSION` is `production` and the two plugin manifests are `governance`, while the
invariants require all three to agree. So bumping a version is a change to what the pipeline
is, made by a human outside a run, and not ticket work a phase can finish.

The `.rstack/` column also covers `.doc/`, which `boundaries.mjs` classifies as `artifact`
despite being committed. It holds the run document `docs` writes after a merge, and it is
grouped here rather than with production because it is a record of a run and not source. The
role that writes it is whichever one is running `docs`, in practice the orchestrator, and the
skill gates it on the change having reached the default branch.

### The orchestrator's row is the weakest one here, and the table cannot fix it

`rstack-orchestrator` is a dispatcher. Its lane is `.rstack/`, and within that it is allowed
**four files**:

| File | Why it is the orchestrator's |
|---|---|
| `run-log.tsv` | its own record, and the only artifact that is |
| `review.md` | `rstack-reviewer-architect` holds no write tool, and `rstack-approval` refuses to start without the file |
| `plan-audit.md` | same reason for the auditor, and it must not be the planner's, which is the party being audited |
| `learnings.md` | its own `learning` lane, appended once at the end of a run |

Plus `.doc/<KEY>.md`, and only while running `docs`, which is a different skill and gated on the
change having reached the default branch.

**That list said "two files only" until 2026-09-15, and it was wrong in a way worth recording.**
An independent verification found this file and `rstack-orchestrator.md` giving different counts --
two here, five there -- with both declaring themselves authoritative and invariant 26 comparing
neither. The agent file was right about `plan-audit.md` and `.doc/`, which this file had simply not
been updated for; this file was right that the list is short and closed. A narrowing stated in two
places is a narrowing that drifts, which is the same failure this document opens by warning about.

`role-guard.mjs --role orchestrator` **cannot enforce that narrowing, and must not be run as a
self-check.** Two independent reasons:

- All of `.rstack/**` is one `artifact` bucket, so an orchestrator that rewrote `plan.md` or
  re-stamped a matrix row would pass, still true, and narrower than it was: the one file in
  there that decided what every role may write, `boundaries.json`, is now `governance` and out
  of every lane. Everything a run *produced* is still one bucket.
- The orchestrator runs **last**, and the guard reads the whole working tree. By then the tree
  holds the tester's tests and the implementer's production source, uncommitted and in lane.
  The phase-0 baseline cannot subtract them, because those files were clean at phase 0. So the
  guard fails every time and names the orchestrator for other phases' work. Observed on a real
  run. The agent now lists the files it wrote instead, which is the same reason
  `rstack-plan-auditor` does not run it either.

What actually holds the narrowing is that the orchestrator is the one context that has seen
every phase, so anything it authors can reach a phase whose value is not having seen it. That
is a reason, not a mechanism. Treat this row as the place to look first when a run's artifacts
disagree with each other.

`rstack-plan-auditor` writes nothing, not even `.rstack/`. Its verdict is its reply,
and the driver writes that to `plan-audit.md`. An auditor that authored the record of
its own audit would be the only account of what it found, which is the thing an audit
is supposed to remove.

That arrangement used to put the planner's hand on the audit record, which the table above
cannot help with: the write is inside the planner's lane and the guard passes. Splitting the
account from the answer narrowed it, and moving the account to the driver closed it. So:
`plan-audit.md` is the reply verbatim, written by the driver and **never by the planner**;
`plan-audit-response.md` is the planner's disposition per finding; and
`audit-response-check.mjs` fails when a disposition appears in the former or when a finding
marked `fixed` cannot be found in the file it names. All three halves have failed in practice,
in that order, which is why each one is written down.

`build files` is denied to every role. A `pom.xml`, a `build.gradle`, a
`package.json`, a Dockerfile, or a workflow file is a shared surface, and a change
to one wants a human deciding rather than a reviewer noticing later. It is not
forbidden, it is waived deliberately and recorded.

## Why the split is not a formality

**A test written by whoever wrote the production source is not a check, it is a
restatement.** It encodes what the code does, and passes for that reason. The
criterion it claims to prove is then unfalsifiable, and nobody finds out.

**A test changed by the implementer stops judging the implementer.** The cheapest
way to make a hard test pass is to make it stop asking: relax the assertion, widen
the tolerance, add `@Disabled`, delete the awkward case. All four turn green.

So the tester writes the tests and never touches production source, and the
implementer writes production source and never touches a test. Neither can reach
the other's lane, and the boundary is checked by a script rather than trusted.

## Enforcement, and where it is genuinely weak

Frontmatter `tools:` is coarse. It can say whether an agent holds `Write`, not
which paths it may write. So there are two different strengths of guarantee here
and they should not be confused:

**Enforced by the harness.** `rstack-reviewer-architect` holds exactly `Read, Grep, Glob`.
It cannot write anything, cannot run a command, and cannot act on its own verdict.
Invariant 12 pins that tool list so a later edit cannot quietly hand it a shell.

**Enforced by a script the agent runs on itself.** Every other role. `role-guard.mjs`
reads the working tree and fails when a role wrote outside its lane. This is real
enforcement, and it is also an honest limitation: an agent that never runs the guard
is not stopped by it. That is why running it is a step in the phase rather than
advice, why the gate re-runs the parts that matter, and why approval re-checks
independently at the end.

Do not describe the second kind as a sandbox. It is a check that catches the
mistake, not a wall that prevents it.

## The commands

Each role runs its own guard before reporting:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/role-guard.mjs --role planner
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/role-guard.mjs --role tester
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/role-guard.mjs --role dev

# Not a lane check. One line describing the tree, for the suite log's
# RSTACK_TREE_BEFORE= / RSTACK_TREE_AFTER= bracket. Takes no --role, because it
# describes the tree rather than anybody's lane.
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/role-guard.mjs --tree-digest
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/role-guard.mjs --role approval
```

Exit `0` in lane, `1` out of lane with the offending paths named, `2` on a usage or
environment problem.

A change that is genuinely correct but out of lane takes a waiver with a reason,
which is appended to `.rstack/shared/boundary-waivers.tsv` and belongs in the
report:

```bash
node role-guard.mjs --role dev --waiver "pom.xml=adds the production driver dependency"
```

A waiver with an empty reason is rejected. The point is not to make the boundary
impassable, it is to make crossing it visible.

## Repositories that lay tests out differently

The defaults cover Maven and Gradle (`src/test`, `src/it`, `src/integrationTest`,
`*Test.java`, `*IT.java`) plus the common conventions of other ecosystems
(`__tests__`, `*.spec.*`, `test_*.py`, `*_test.go`).

Override per repository with `.rstack/boundaries.json`:

```json
{
  "test": ["**/src/test/**", "**/*Spec.groovy", "qa/**"],
  "build": ["**/pom.xml", "**/*.gradle"],
  "local": ["**/application-local.*", "**/.env.local"]
}
```

Only `artifact`, `local`, `test` and `build` are configurable. **`governance` is refused
here** with an error rather than a shrug, for the reason the last column of the table gives:
a class declared in the file it protects is not a protection, and a repository that believed
it had turned the class off would read every later clean guard as proof the paths were
writable. `production` is deliberately not a list: it is whatever no other class claimed, so a file in an
unexpected place is treated as production source and blocked for the tester rather than being missed.
Failing that way round is the safe one.

`local` is the configuration an engineer edits to run the project on their own
machine. It is dirty for weeks at a time, deliberately, and it belongs to them rather
than to any phase. It is **reported and never judged**, for every role, and
`rstack-approval` never stages it. Left in `production` it fails the tester's guard on a
file the tester never opened, and a guard that fails on arrival is a guard every role
learns to skip. The hole is real and narrow: an agent editing a declared local file is
not caught, which is why the defaults are kept tight and a repository should declare only
what it means.

**These files are usually tracked, not untracked, and that is the whole reason the class
exists.** A local configuration file is normally committed once with defaults and then
modified locally forever. `.gitignore` and `.git/info/exclude` have no effect on a file
git already tracks, so neither `protect-artifacts.sh` nor any ignore rule can keep those
modifications out of a commit. The only things that can are the staging discipline in
`rstack-approval` and, if a repository wants it, `git update-index --skip-worktree`.

### `local` and the baseline are different tools, and confusing them is expensive

| | Means | Use for |
|---|---|---|
| **baseline** (phase-0 pin) | already dirty when the run started, so not this run's business | anything pre-existing, including ordinary source somebody was mid-way through |
| **local** | never any phase's business, in any run, forever | configuration that exists only to run the project locally |

The baseline is temporal and expires with the run. `local` is permanent, and it
permanently disables judgement on the paths it names. So declaring ordinary application
source as `local` because it happens to be modified today is a bad trade: the baseline
already covers that, and the declaration would keep covering it long after the local
tweak is gone.

Declare `local` for a file whose local modification is a standing condition. Leave
everything else to the baseline.

Check the classification before trusting it in a new repository:

```bash
node role-guard.mjs --role tester --json
```

The `buckets` object shows exactly how every changed path was classified. A test
file sitting in the `production` bucket is a configuration problem to fix before
the pipeline runs, not something to waive per file.

## Never delete a file in order to change it

Revising a file means **overwriting it in place, in one operation**. Removing it and
recreating it is two operations with a window between them, and anything that interrupts
the second one loses the file outright: a failed write, a rejected approval, a cancelled
turn, a crash.

This is not hypothetical. An agent holding a whole-file write tool and no in-place edit
tool will reason its way to `rm` plus recreate, describe it as equivalent, and be wrong
about the only part that matters. Observed on a real run, against an artifact it had just
spent a phase producing.

Two rules, and they apply to every role that writes anything:

- **If the only tool available writes whole files, write the whole file.** That is the
  same end state as an edit, without the window. It is not a workaround, it is the
  correct use of the tool.
- **Reaching for the shell to delete something is the signal to stop.** Say what tool you
  are missing and report it. A missing capability is a finding about the harness, and
  routing around it with a destructive command trades a small inconvenience for an
  unrecoverable one.

The same reasoning is why every writing role in this stack holds both `Write` and `Edit`.
Granting one without the other creates exactly the dead end that produces the `rm`. An
invariant pins that pairing so a later edit cannot reintroduce it.

## The baseline, and why the guard needs one

A working repository is not clean. It carries the engineer's own uncommitted work:
local configuration, notes, images, a half-finished file from last week. `role-guard`
reads the whole working tree, so without a baseline it judges all of that as though the
current phase produced it, and **every role fails on arrival**. Measured in one real
repository: 67 pre-existing paths, none of them any phase's output.

The baseline is taken at phase 0, by the same command that pins the estate:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/estate-guard.mjs --pin
```

It records every dirty path in the active repo **with a content hash**. `role-guard`
then excludes a path only when it was already dirty *and* is byte-identical to what it
was. A file that was already dirty and has since been changed further is this phase's
business and is judged, which is the case a path-only baseline would wave through.

Two consequences worth knowing:

- **No pin means no exclusions.** The guard says so in its output and judges
  everything, rather than silently judging nothing. An absent baseline is a louder
  failure than a wrong one.
- **`--base <ref>` ignores the baseline.** A commit-range run is already scoped to this
  branch's work, and subtracting the working-tree baseline as well would hide real
  changes.

## Test immutability

The boundary stops the wrong agent writing a test. It does not stop the *right*
agent weakening one. `test-lock.mjs` covers that: tests are hashed while they are
still red, with their assertion count and skip-marker count, and re-measured at the
gate.

- A hash that moved fails, **whether or not an amendment was recorded.** An amendment
  authorises the revision it was recorded against and nothing later, so an edit *after* one
  authorised amendment fails too. Only the message differs, because the owner does.
- A skip marker that appeared fails, and no amendment can license it.
- A locked test that was deleted fails.
- A lock carrying a header and no rows fails. That is truncation, not an empty lock, and the
  file sits in the `artifact` bucket that is in lane for the tester and the implementer alike,
  so it was the cheapest way past the lock without touching a test at all.

An assertion count that fell is refused by `--amend` rather than by the gate: once the hash
decides, matching content implies a matching count, so the gate could never reach that check.
It is enforced where it can still refuse to record something.

See the pipeline skill for where in the flow each of these runs.
