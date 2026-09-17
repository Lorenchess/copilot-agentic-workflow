# Estate instructions

<!--
GENERATED ONCE by scripts/install-estate.mjs from
skills/pipeline/references/estate-instructions.template.md
when no estate-level copilot instructions existed.

This file is intentionally estate-specific and may be edited locally.
Canonical process rules live in the user-level rstack process instructions;
do not duplicate them here.
-->

This workspace root is an **estate root**: its direct children are independent Git
repositories. The estate root itself is not a repository.

## Estate-specific invariant

A run may **write to exactly one active repository**.

Sibling repositories may be read for callers, schemas, contracts, topics, and other
cross-repo dependencies, but must not be modified by that run.

The planner resolves the repository set **after reading the ticket**. Do not infer the
active repo from the current file, branch name, ticket key, or busiest checkout.

Once phase 1 settles the active repo, run repository-scoped commands from inside it.

## Script paths

The estate installs pipeline skills under:

```text
{{ESTATE_ROOT}}/.github/skills/
```

From a direct child repository, prefer the fixed relative path:

```bash
node "../.github/skills/pipeline/scripts/estate-guard.mjs" --list
bash "../.github/skills/pipeline/scripts/protect-artifacts.sh"
```

Use the file extension to choose the runtime:

- `.mjs` → `node`
- `.sh` → `bash`

Do not rely on `CLAUDE_PLUGIN_ROOT` or another environment variable surviving across
separate terminal calls. If a variable form is required, set it in the **same command**
that invokes the script.

If a generated path unexpectedly begins with `/skills/` or `/.github/`, treat an empty
variable expansion as the first hypothesis.

## Repository discovery

At the estate root:

```bash
git rev-parse --show-toplevel
```

is expected to fail because the estate root is not a repository.

After the planner settles the active repo:

```bash
cd <active-repo>
git rev-parse --show-toplevel
```

must resolve that repository.

To inspect the estate, use the pipeline script rather than a hard-coded repository list:

```bash
node "../.github/skills/pipeline/scripts/estate-guard.mjs" --list
```

Canonical multi-repository rules:

```text
.github/skills/pipeline/references/estate-layout.md
```

## Cross-repository reads

Read sibling repositories only when the ticket or active repository establishes a
reason to do so.

Cite cross-repository evidence as:

```text
<repo>/<path>:<line>
```

A sibling change is a planning/ticket finding, not an edit to make from the current run.

## Repository-local instructions

Before writing code, read the active repository's own conventions, for example:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`

Repository instructions govern **how code is written in that repository**.

Canonical rstack process rules govern **verification, evidence, role boundaries,
committing, pushing, pull requests, external writes, and ticket workflow**.

The authoritative precedence table is:

```text
.github/skills/pipeline/references/instruction-precedence.md
```

The canonical always-loaded process instructions are:

```text
.github/skills/pipeline/references/rstack-process.instructions.md
```

Do not restate those rules here. This file is generated once and is not drift-checked,
so duplicated process policy here would eventually become stale.

## Evidence

Use the canonical evidence contract:

```text
.github/skills/prove-it/SKILL.md
```

Minimum estate-specific reminder:

- acceptance criteria require the configured proof bar,
- `INCONCLUSIVE` is never a pass,
- a green suite proves only what its executed checks actually assert,
- discover build/test commands from the active repository; never reuse a sibling's
  runner command by assumption.

## Why this template is intentionally short

This file is estate-level, generated once, and may outlive multiple versions of the
pipeline. It should contain only facts that are specific to this estate:

- where shared skills live,
- how repository context is resolved,
- the one-writable-repo rule,
- cross-repository read behavior,
- where canonical process/precedence rules live.

Historical incidents, detailed evidence ladders, external-write policy, MCP trust
rules, and release controls belong in their canonical references/instructions so they
can evolve without leaving stale copies on already-installed estates.
