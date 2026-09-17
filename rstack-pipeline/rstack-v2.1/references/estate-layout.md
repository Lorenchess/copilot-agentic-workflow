# Estate layout

Owns repository topology: which repository a run may write, what it may do in the others, and how movement in the others is noticed. Role lanes inside the active repo: `write-boundaries.md`.

## Terms

| Term | Meaning |
|---|---|
| **estate root** | a directory whose children are independent Git repositories; usually not itself a repository |
| **repository set** | the repositories a ticket is evidenced to touch; settled by the planner after reading the ticket |
| **active repo** | the one repository this run may write |
| **sibling** | every other repository in the estate; read-only to this run |

An estate is not a monorepo. A SHA means something only with its repository, so `.rstack/` state — and the candidate identity — lives inside the active repo, never at the estate root.

## One writable repository per run

A run writes exactly one active repo. This is kept deliberately: candidate identity, the test lock, evidence and publication all bind to one commit namespace, and a run with several writable repositories would need a candidate tuple, partial-publication recovery and a cross-repository freshness rule that nothing in rstack currently needs.

A ticket that touches several repositories is a **set of repository-scoped runs under one key**, each with its own active repo, `.rstack/` evidence, AC rows, candidate, review and PR. `plan.md` records the repository set, which repository this run owns, and **which criteria it does not cover**. Cross-repository interface evidence cited from a sibling is not live end-to-end evidence; say which one you have.

A sibling is never promoted to writable because implementation found work there. That is a repository-admission request to the human, or another run.

## Resolving the active repo

State 0 inspects the starting context; it does not settle the writable repository or pin its baseline. In state 1 the planner probes, reads the ticket, asks which repositories it touches, resolves names to paths with the repository locator (never from memory or a document), and only then settles the active repo. Two candidates for one name or one criterion is a question.

Estate root: explicit `--root`, then `$RSTACK_ESTATE_ROOT`, then the parent of the active repo for a flat estate; grouped estates need it stated. Once settled, repository-scoped commands run from inside the active repo:

```bash
cd <active-repo> && git rev-parse --show-toplevel
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/estate-guard.mjs --list
```

A clean guard result covers only the repositories the guard listed. At the estate root, `git rev-parse` failing is correct.

## Sibling boundary

Allowed: reading files, targeted search, read-only Git history and status.

Not allowed: edits; branch, commit, stash, checkout, fetch, merge; builds, tests or any run; anything that moves the working copy. A sibling may be another engineer's checkout with uncommitted work.

Cross only on evidence. Cite the dependency in the active repo first — import, client, endpoint, schema, topic, generated artifact, consumed fixture — then search the sibling for that identifier and record the scope with the result:

```bash
git -C <sibling> grep -n "<identifier>" <ref> -- <pathspec>
```

A null result means "not found in `<repo>` at `<ref>` under `<pathspec>`", never "absent". Sweep the estate (`estate-sweep`) only when the consumer set is itself the question; a sweep is L2.

## Noticing sibling movement

`estate-guard.mjs --pin` is run once by the planner, after the active repo is settled and before any role writes outside `.rstack/`. `--verify` is run by the auditor before reporting, by the tester at verification, and by approval at release. It fails on a sibling whose HEAD or branch moved or where a new dirty path appeared.

What this is: a **detector** (SCRIPT CHECK, self-run). It attributes nothing, sees only direct children it listed, cannot see a further edit to a sibling file that was already dirty, reports broken or unborn repositories as uncheckable, and stops no write. Isolation that makes sibling writes impossible is a workspace or container permission.

On a mismatch: stop, report what moved, do not guess who moved it. A human who confirms the movement was theirs gives a HUMAN DECISION, recorded in `meta/decisions.md` by the orchestrator, after which the estate is pinned again with the reason. An agent never re-pins to excuse its own write, and approval never clears a mismatch that way.

**Simplified from the reconstructed design.** This contract requires only pin, verify, and a recorded human decision before re-pinning. The separate `--repin` ledger (`.rstack/shared/estate-repins.tsv`), `--pin --writable`, and per-path dirty tracking of siblings are tool details it does not depend on: the ledger duplicates the decision record, and sibling dirty-path tracking buys no attribution. If the real tool keeps them, they stay inside the tool.

## Search and implementation limits

Use the estate-sweep skill's explicit extension set, recorded refs/checkouts and separate partial/no-detail truncation lists. The script is not supplied; its default JVM/config filters and direct-child topology are screenshot-supported documentation, not a tested inventory. A stale or excluded checkout cannot support a broad absence claim. Prove wire/runtime consumers using wire identifiers, not only type names.

Estate/role-guard pin and repin implementation claims above are UNVERIFIED until those sources and fixtures are inspected. A pin may help attribute writes but never proves committed-candidate execution. Keep tool-owned ledgers intact; do not remove them because prose has been simplified.
