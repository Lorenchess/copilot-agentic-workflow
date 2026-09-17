# estate-layout.md — reconstructed from screenshots

> Reconstruction note: this is a careful consolidation of the visible text from the uploaded `pipeline/references/estate-layout.md` screenshots (IMG_1286–IMG_1290). It is not a byte-for-byte export of the repository file. Overlapping regions were deduplicated. A small cropped span around lines 40–44 is reconstructed only from the visible fragment and nearby context.

# Estate layout

One source of truth for what an agent may touch when the workspace holds more than
one repository. `estate-guard.mjs` enforces the sibling half of this table;
`role-guard.mjs` enforces the within-repo half described in
[`write-boundaries.md`](write-boundaries.md).

## Two directories, and confusing them is the whole problem

| Term | What it is |
|---|---|
| **estate root** | A directory whose direct children are independent git repositories. It is usually **not** a repository itself. |
| **active repo** | The one repository this session may write to. Exactly one, for the whole run. A multi-repo ticket runs once per repository rather than once across several. |
| **writable set** | The repositories a ticket spans, declared at phase 0 and evidenced from the ticket. Only the active repo of a given run is written; the rest of the set is what tells a reader which runs the ticket still needs. |
| **sibling** | Every other repository under the estate root. Readable. Never writable. |

An estate root is not a monorepo. A monorepo has one `.git` at the top and modules
below it. An estate root has no `.git` of its own and a separate `.git` in each
child. Every script in this stack resolves its repository with
`git rev-parse --show-toplevel` from the process working directory, so a command
issued at an estate root is outside a repository and exits `2`.

That exit code is the first thing you will meet in a multi-repo workspace, and it
is correct behaviour rather than a bug to route around.

## The rule

**Establish the active repo before phase 1, and run every script with the working
directory inside it.**

```bash
cd <active-repo>
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/role-guard.mjs --role tester
```

Not `--repo` flags, not absolute matrix paths from the estate root. The working
directory is the mechanism, because it is the mechanism the scripts already use and
a second way to say the same thing is a second thing to keep in agreement.

`.rstack/` therefore lives inside the active repo, which is where it belongs: every
row in the matrix carries a commit sha, and a sha only means something next to the
repository it came from.

> The remainder of this paragraph was cropped in the screenshots before the next
> visible heading.

## Resolution order

Both values are resolved, never assumed:

| Value | Resolved from, first match wins |
|---|---|
| active repo | `git rev-parse --show-toplevel` from the working directory |
| estate root | `--root`, else `$RSTACK_ESTATE_ROOT`, else the parent directory of the active repo |

The default estate root is the parent directory, which is right for a flat layout
and wrong for a grouped one. A layout that nests repositories two levels down
(`<root>/<group>/<repo>`) needs `$RSTACK_ESTATE_ROOT` set, and `estate-guard.mjs
--list` is how you check what was found before trusting a clean result.

Set it once per estate:

```bash
export RSTACK_ESTATE_ROOT=/path/to/the/estate
```

## The sibling boundary

**Read a sibling when you have a reason. Write to one, never, unless it was declared writable
before the run started or admitted during it, and then only to that one.**

The unqualified version of that sentence held until tickets arrived whose criteria could not all
be met in one repository. The model that replaced it does not widen a run: **one writable
repository per run, and a ticket that needs three gets three runs under one key.** Each keeps its
own `.rstack/`, matrix, gate and pull request, so nothing downstream changes meaning. What is
declared is which repository *this* run owns, recorded by `estate-guard.mjs --pin --writable` and
exempt from the movement check for that reason. Every other sibling is judged exactly as below.

| Operation on a sibling | Allowed |
|---|---|
| Read a file, grep, list | yes |
| `git log`, `git show`, `git status` | yes |
| Edit, create, delete a file | **no** |
| Branch, commit, stash, checkout, fetch, merge | **no** |
| Build, test, run | **no** |

A sibling is somebody else's working copy, and it may hold their uncommitted work.
A change you make there is not recoverable by you and often not visible to them
until it has cost them an afternoon. `estate-sweep` has carried this rule since it
was written; this file extends it from one skill to every agent in the pipeline.

Reading across repositories is the point of the layout. A BFF proxying four
services, a shared library with consumers, a contract change that lands in a
schema one repository and a parser in another: the context that answers those
questions is in a sibling, and refusing to read it produces confident wrong
answers. Read, cite `<repo>/<path>:<line>`, and change nothing.

### Crossing needs a reason, and the reason lives in the active repo

What does not follow from the paragraph above is that a sibling is somewhere to go
looking. The work is in the active repo, the plan is about the active repo, and a
repository entered on a hunch returns facts nobody needed at a cost measured in minutes.
Two rules.

**1. Name the dependency before you cross, and evidence it from inside the active repo.**
The link is a line you can point at *here*: an import, a client, a URL, a topic name, a
schema reference, a fixture this repository consumes, a generated artifact it reads. Cite
that line. "This might be relevant elsewhere" is not a dependency, it is a hunch, and a
hunch that spends eight repository reads is the expensive kind.

**2. Search for an identifier.** Never enumerate a repository. **You crossed for a specific
fact, so ask for that fact at a ref, with a pathspec when you have one, and read the lines
around the hit:**

```bash
git -C <sibling> grep -n "<identifier>" <ref> -- <pathspec>
```

An enumeration costs time proportional to the sibling's size and returns a summary nobody
cites. A targeted search costs one command and returns a `<repo>/<path>:<line>` that goes
straight into the plan.

**Record the scope you searched.** A null result is worth exactly the scope that produced
it, so "absent in `<sibling>` at `<ref>` under `<pathspec>`" is a finding and "absent" is
not. That is the same rule the citation discipline applies inside one repository, and a
repository boundary does not relax it.

The exception is when the consumer list itself is the question, rather than one fact about
one consumer. That is what `estate-sweep` exists for, and it is a deliberate, reported,
whole-estate operation rather than the default way to answer a question.

## Why a script and not a paragraph

`role-guard.mjs` reads one working tree. It calls `changedPaths(root)`, which runs
`git status --porcelain --untracked-files=all` against the active repo, so a file
written into a sibling produces no entry, no violation, and a clean report. The
guard is not lying; the write is outside everything it was built to see.

So the sibling boundary needs its own check, on the same reasoning that produced
the first one: an agent that reports its own compliance is reporting an intention.

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/estate-guard.mjs --pin
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/estate-guard.mjs --verify
```

`--pin` records every sibling's dirty-path set, branch, and HEAD at phase 1, **and the
active repo's own dirty paths with content hashes**, which is the baseline
`role-guard.mjs` subtracts so a role is not failed by work it never touched. See
[`write-boundaries.md`](write-boundaries.md).

`--verify` re-measures and fails on a path that appeared, a HEAD that moved, or a
branch that changed. Pinning first is what makes the check usable: the engineer's
own half-finished work in three siblings is the baseline, not a violation.

The shape matches `test-lock.mjs` on purpose. Measure while the state is known,
re-measure at the gate, and treat a difference as something to explain rather than
something to notice later.

### When the difference is yours

You will edit a sibling mid-pipeline sometimes. That is your prerogative and not a
failure. Clear the pin with a reason:

```bash
node estate-guard.mjs --repin --reason "picked up the upstream contract change by hand"
```

The reason is appended to `.rstack/shared/estate-repins.tsv` and belongs in the
phase report. A `--repin` with an empty reason is rejected, for the same reason a
boundary waiver with an empty reason is.

## Where each role stands

| Role | Active repo | Siblings |
|---|---|---|
| `rstack-orchestrator` | `.rstack/` transcription and its own log, plus `.doc/<KEY>.md` while running `docs` | read, never write, and it runs neither `--pin` nor `--verify` |
| `rstack-planner` | `.rstack/` only | read, and `--pin` before phase 2 |
| `rstack-plan-auditor` | nothing | read, and `--verify` before reporting |
| `rstack-tester` | tests and `.rstack/` | read, and `--verify` at the gate |
| `rstack-dev` | production and `.rstack/` | read |
| `rstack-reviewer-architect` | nothing | read |
| `rstack-approval` | `.rstack/` plus git on the active repo | read, and `--verify` again, independently |

`--verify` runs twice on purpose. The gate catches a stray write one phase after it
happened, which is cheap; approval re-runs it for the same reason it re-runs the
matrix validator, which is that a phase reporting its own compliance is reporting an
intention. Only a human clears a failure with `--repin`.

The reviewer holds `Read, Grep, Glob` and no more, so its sibling posture is
enforced by the harness rather than by this table. Every other row is a check the
role runs on itself, which catches the mistake without preventing it. Do not
describe it as a sandbox.

## Honest limits

- **`--verify` cannot attribute a change.** It reports that a sibling moved, not who
  moved it. An engineer editing a sibling in another window produces the same
  signal as an agent writing there. `--repin --reason` is how the ambiguity gets
  resolved, and it resolves it by asking a human rather than by guessing.
- **Only direct children of the estate root are enumerated.** A grouped layout
  returns a partial estate, exactly as `estate-sweep` warns for its own sweep. Run
  `--list` and read the count before believing a clean verdict.
- **A sibling with no commits, a bare repository, or a broken checkout is skipped
  and named.** A skip is reported, never counted as clean.
- **Nothing here stops a write.** It records that one happened. The harness cannot
  express "may write to this directory and not that one", so this is a check by
  construction and not a wall.
