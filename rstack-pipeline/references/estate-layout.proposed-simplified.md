# Estate layout

This reference defines repository boundaries for a workspace that contains multiple
independent Git repositories.

The machine sources of truth are:

- `estate-guard.mjs` for cross-repository movement,
- `role-guard.mjs` plus `write-boundaries.md` for within-repository write lanes.

Do not duplicate role permissions here beyond what is necessary to explain the
estate model.

## Terms

| Term | Meaning |
|---|---|
| **estate root** | A directory containing independent repositories. It is usually not itself a Git repository. |
| **repository set** | Repositories the ticket is evidenced to touch. Discovered by the planner after reading the ticket. |
| **active repo** | The single repository writable by the current run. |
| **sibling** | Every other repository in the estate. Read-only to the current run. |

An estate is not a monorepo. Each repository has its own `.git` and its own commit
namespace.

A SHA is meaningful only with its repository, so `.rstack/` state belongs inside the
active repo, not at the estate root.

## When the active repo is established

Do **not** establish the active repo before phase 1.

The planner:

1. probes the workspace,
2. reads the ticket,
3. asks/evidences which repositories the ticket touches,
4. resolves the active repo,
5. pins the estate from inside that repo.

This ordering avoids choosing repository scope with less information than the ticket
provides.

After the active repo is settled, every repository-scoped script runs with its working
directory inside that repository.

```bash
cd <active-repo>
git rev-parse --show-toplevel
```

## Estate-root resolution

Resolve, never assume:

1. explicit `--root`,
2. `$RSTACK_ESTATE_ROOT`,
3. parent of the active repo for a flat estate.

Grouped estates require an explicit estate root.

Before trusting estate checks, inspect what the guard sees:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/estate-guard.mjs --list
```

A clean result is meaningful only for the repositories the guard actually enumerated.

## One writable repository per run

The current run writes to exactly one active repo.

A ticket may touch several repositories, but that does not make all of them writable in
one run. `plan.md` records:

- the repository set,
- which repository this run owns,
- which criteria remain for other repository runs.

A sibling is never silently promoted to writable because an implementation discovers
work there. That becomes a planning/repository request.

## Sibling boundary

Allowed on a sibling:

- read files,
- targeted grep/search,
- read-only Git history/status.

Not allowed:

- file edits,
- branch/commit/stash/checkout/fetch/merge,
- builds/tests/runs,
- any operation that moves or mutates the sibling working copy.

The reason is practical: a sibling may be another engineer's working copy with
uncommitted work.

## Cross-repository reads need evidence

Do not browse siblings on a hunch.

Before crossing, identify a dependency from the active repo, such as:

- import/package reference,
- client or endpoint,
- schema,
- topic,
- generated artifact,
- fixture/contract consumed by the active repo.

Cite the active-repo evidence first.

Then search the sibling for the specific identifier:

```bash
git -C <sibling> grep -n "<identifier>" <ref> -- <pathspec>
```

Record the search scope with the result.

A null result means only:

```text
not found in <repo> at <ref> under <pathspec>
```

It never means globally absent.

Use an estate-wide sweep only when the **consumer set itself** is the question.

## Pin and verify

`role-guard.mjs` sees only the active repo. Therefore sibling movement needs a separate
guard.

After the planner has settled the active repo:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/estate-guard.mjs --pin
```

At the normal gate and again at approval:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/estate-guard.mjs --verify
```

The pin should capture enough state to detect meaningful sibling movement, including
branch/HEAD and relevant dirty-path state.

The exact pin schema belongs to `estate-guard.mjs`; this reference should not duplicate
implementation details that can drift.

If `--verify` reports movement, stop and identify whether:

- the agent crossed the boundary,
- a human/other process changed the sibling.

Do not guess attribution.

A human-authorized baseline change uses the explicit repin mechanism with a reason:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/estate-guard.mjs \
  --repin --reason "<human-confirmed reason>"
```

`--repin` is not a way for an agent to excuse its own sibling write.

## Role interaction

Role-specific write lanes are canonical in:

```text
references/write-boundaries.md
```

Estate-specific summary only:

- planner pins after active-repo resolution,
- auditor/reviewer remain read-only,
- tester verifies estate state at the gate,
- dev writes only the active repo,
- approval verifies estate state again before release actions,
- orchestrator routes and records; it does not mutate siblings.

Avoid a duplicated full role matrix here; it will drift from `write-boundaries.md`.

## Multi-repository tickets

A multi-repo ticket is a set of repository-scoped runs sharing the ticket relationship,
not one run with several writable repositories.

Each repository-scoped run has its own:

- active repo,
- `.rstack` evidence,
- AC rows for the criteria it owns,
- gate/review/approval state.

The ticket-level coordinator can report which repository runs remain.

## Honest limits

`estate-guard` is a detector, not a sandbox.

- It cannot reliably attribute who moved a sibling.
- It can only judge repositories it discovered.
- Broken/bare/unborn repositories may be uncheckable and must be reported explicitly.
- A check run by an agent on itself is weaker than an external filesystem sandbox.

For stronger isolation, use workspace/container permissions that make sibling writes
physically impossible.

## Key corrections from the current file

1. **Active repo timing:** resolve inside phase 1 after the ticket is read, not before phase 1.
2. **Terminology:** use `repository set` for all repos the ticket touches; reserve
   `active repo` for the one writable repo.
3. **Repin authority:** a mid-run sibling edit is not automatically "your prerogative";
   repinning should reflect a human-confirmed external/baseline change, not normalize an
   agent crossing its write boundary.
4. **Single source of truth:** keep the detailed role matrix in `write-boundaries.md` and
   the pin schema in `estate-guard.mjs` rather than duplicating both here.
