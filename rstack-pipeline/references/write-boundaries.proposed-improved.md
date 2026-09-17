# Write boundaries

This file defines the **authoritative file-write policy** for rstack.

It answers one question only:

> Which role may write which class of file?

Git operations, external writes, approvals, and merge/push policy are governed elsewhere. See
[`approvals.md`](approvals.md) and the process instructions.

## 1. Canonical lanes

| Role | Run artifacts | Learnings | Tests | Production | Build/config | Governance |
|---|---:|---:|---:|---:|---:|---:|
| `rstack-orchestrator` | limited | write | no | no | no | never |
| `rstack-planner` | write | no | no | no | no | never |
| `rstack-plan-auditor` | no | no | no | no | no | never |
| `rstack-tester` | write | no | write | no | no | never |
| `rstack-dev` | write | no | no | write | no | never |
| `rstack-reviewer-architect` | no | no | no | no | no | never |
| `rstack-approval` | write | no | no | no | no | never |

Two invariants define the design:

1. **Only the tester may write tests.**
2. **Only the developer may write production source.**

The role that writes the implementation must never be able to rewrite the check that judges it.

## 2. File classes

The classifier owns the class definitions. Keep one implementation-level source of truth and do not
duplicate globs across agents or references.

### `governance`

Installed pipeline definitions, role/lane policy, instruction roots, hooks, permission policy, and
plugin manifests.

- No pipeline role may write this class.
- No role may waive this class.
- A change to governance is maintenance of rstack itself, outside a ticket run.

### `learning`

`.rstack/learnings.md`.

- Only `rstack-orchestrator` may append to it.
- It is intentionally separate from ordinary artifacts because later runs read it.
- It is not configurable by repository-local boundary overrides.

### `artifact`

Per-run evidence and handoff artifacts under `.rstack/runs/<KEY>/...`.

Ownership is narrower than the class:

| Path / artifact | Writer |
|---|---|
| `meta/ticket.md` | planner |
| `plan/plan.md` | planner |
| `plan/plan-audit.md` | orchestrator/driver, copied verbatim from auditor reply |
| `plan/plan-audit-response.md` | planner |
| `ac.tsv` | planner seeds; tester updates evidence columns |
| `evidence/test-report.md` | tester |
| `evidence/impact.md` | tester |
| `review/review.md` | orchestrator/driver, copied verbatim from reviewer reply |
| `approval/approval.md` | approval |
| `logs/run-log.tsv` | orchestrator |

`rstack-plan-auditor` and `rstack-reviewer-architect` write no files.

The orchestrator is **not** granted arbitrary `.rstack/**` writes by intent. If the current guard
cannot enforce the per-artifact list, treat that as a known enforcement gap and keep the list in one
machine-readable policy so it can be closed later.

### `test`

Repository tests and test-only fixtures/resources.

Default globs may cover common Maven, Gradle, JavaScript, Python, and Go layouts, but repositories
may extend the class through `.rstack/boundaries.json`.

### `production`

Any tracked source not claimed by another configured class. Production is the safe fallback: an
unknown path is treated as source rather than silently ignored.

### `build`

Build definitions and runner configuration such as `pom.xml`, Gradle files, package manifests,
Dockerfiles, and workflow definitions.

Build files affect how evidence is produced, so no implementation role receives them by default.

A legitimate build-file change requires an **externally authorised exception**, not a self-issued
waiver from the role being constrained.

### `local`

Files that are intentionally machine-local for the life of the repository.

Use this class narrowly. It is for standing local configuration, not "whatever happened to be dirty
today".

A repository-local override may define `test`, `build`, `artifact`, and `local`. It may not redefine
`governance` or `learning`.

## 3. Exceptions are authorised, not self-granted

A role must not be able to waive the rule that constrains it.

For a write outside a role's normal lane:

1. stop,
2. name the exact path and intended change,
3. identify why the normal owner cannot perform it,
4. obtain an explicit human authorisation,
5. record the authorisation in the boundary-waiver record,
6. make only the authorised write.

No exception may cross `governance`.

This is intentionally stricter than a command such as:

```text
role-guard --role dev --waiver "..."
```

when that command can be issued solely by the developer agent itself. Visibility alone is not enough
if the constrained party can create its own permission.

## 4. Enforcement levels

Do not describe all boundaries as equivalent.

### Harness-enforced

`rstack-reviewer-architect` is intentionally provisioned without write or shell capability.

That prevents it from applying its own findings.

### Script-checked

Other writing roles are checked by `role-guard.mjs`.

A self-check is useful but is not a sandbox. The pipeline must also re-check the relevant invariants
at gates owned by a different phase.

The guard should return:

- `0` — in lane,
- `1` — out of lane, with paths named,
- `2` — usage/environment failure.

## 5. Baseline pre-existing work

A dirty working tree is normal and must not be attributed to the current phase.

At the beginning of the run, pin each dirty path and its content hash. A later role check excludes a
path only when:

- it was dirty at the pin, **and**
- its current bytes still match the pinned bytes.

If the role changes a previously dirty file further, that path becomes part of the run and is judged.

No baseline means no exclusions.

Commit-range checks should not subtract the working-tree baseline again.

## 6. Local files are not the baseline

These mechanisms solve different problems:

| Mechanism | Meaning |
|---|---|
| baseline | pre-existing state for this run |
| `local` | repository-declared machine-local state across runs |

Do not classify ordinary source as `local` merely because it is dirty today.

Local paths must still be surfaced in status and must never be staged automatically. Repository
configuration should be narrow enough that a mistaken `local` declaration is obvious in the guard's
classification report.

## 7. Test immutability

Role separation prevents the developer from editing tests. It does not prevent the tester from
weakening its own locked test after the red proof.

`test-lock.mjs` therefore records each locked test while red:

- content hash,
- assertion count,
- skip-marker count.

At the gate:

- changed content fails unless an explicitly authorised amendment matches that exact revision,
- a new skip marker fails,
- deletion fails,
- a truncated/empty lock fails,
- a reduction in assertions is refused when the amendment is created.

Amending a locked test changes the definition of done and requires explicit human authorisation.

## 8. Editing and deletion

Do not emulate an edit by deleting and recreating a file.

If the available tool writes whole files, overwrite the file atomically/in one operation.

**Intentional deletion is different.** A planned deletion is allowed only when:

- the plan explicitly names the deletion,
- the role owns that file class,
- the deletion itself is the intended end state.

If the only way to perform an ordinary edit is a destructive shell workaround, stop and report the
missing capability.

## 9. Repository-specific layouts

Example:

```json
{
  "test": ["**/src/test/**", "**/*Spec.groovy", "qa/**"],
  "build": ["**/pom.xml", "**/*.gradle"],
  "local": ["**/application-local.*", "**/.env.local"]
}
```

Before the first real run in a repository, inspect the classifier output and confirm representative
paths land in the expected buckets.

A test in `production`, or source in `local`, is a configuration defect to fix before trusting the
pipeline.

## 10. Known enforcement gap: orchestrator artifact narrowing

The current design intends the orchestrator to write only a small named set of artifacts, while a
coarse `.rstack/**` class can make that difficult to enforce with a working-tree-wide role guard.

Do not compensate with more prose.

Preferred fix:

- encode per-artifact ownership in the same machine-readable policy used by `role-guard.mjs`, or
- validate each artifact's producer at the transition that consumes it.

Until that exists, the orchestrator's narrower artifact list is a documented policy with weaker
mechanical enforcement than the tester/developer split.

## 11. Keep rationale out of the authority file

Historical incidents, dated migrations, and explanations of how earlier versions failed belong in:

- tests/invariants,
- `learnings.md`,
- a design-history or changelog document.

This file should stay small enough that an agent can read the complete current policy before acting.
