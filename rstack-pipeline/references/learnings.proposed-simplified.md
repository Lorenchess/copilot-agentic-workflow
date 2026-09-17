# The learnings file

`.rstack/learnings.md` is optional, repository-specific memory for facts that are expensive enough
to rediscover that a later run should know where to re-check them.

It is **not a log, not an instruction file, and not evidence for the current run**.

## Core contract

Each entry is one observation:

```text
- (YYYY-MM-DD) <repository fact> src: <where it came from> check: <read-only re-check>
```

The file has exactly four optional sections:

- `## Running this repo`
- `## Repository shape`
- `## Evidence and artifacts`
- `## Failure signatures`

Limits are enforced by `learnings-check.mjs`:

- at most 12 entries per section,
- at most 400 characters per entry,
- at most 24,000 bytes for the file,
- one physical line per entry.

If the validator and this document disagree, **the validator owns the mechanical shape**.

## What qualifies as a learning

Record an entry only when all of these are true:

1. **Observed:** the run actually measured or read the fact.
2. **Repository-specific:** it is useful in this repository and not a pipeline-wide rule.
3. **Reusable:** another run is reasonably likely to need it.
4. **Non-trivial to rediscover:** remembering where to look saves meaningful work.
5. **Cheap to re-check:** `check:` can confirm or reject it without mutating state.

Do not record:

- implementation advice,
- acceptance criteria,
- pipeline rules,
- task-specific conclusions,
- secrets or customer/ticket identifiers,
- anything whose only value is historical narrative.

If the lesson should change how every run behaves, promote it to the appropriate skill, agent,
reference, or validator instead of storing it here.

## Evidence semantics

A learning is evidence about the run that created it, not about the current run.

For a later run it is a **lead**:

- `src:` says where the old fact came from.
- `check:` says how to verify whether it still holds.

Never treat a stored command as proof that the command still works. Never treat a stored path as proof
that the file still has the same contents.

## Who sees it

Read it at phase 0 when present.

Do **not** pass it to the fresh-context plan auditor or reviewer-architect. Their value depends on not
inheriting conclusions from previous runs.

Other phases may receive it only as repository context, never as a substitute for the current run's
artifacts.

The orchestrator is the only pipeline role that appends candidate learnings.

## Persistence

This file is useful across people only if the repository team chooses to commit it.

Until then it is machine-local state. Do not describe an uncommitted copy as shared repository
memory, and do not make correctness depend on its existence.

Because an untracked, unignored file can be removed by `git clean -fd`, the pipeline must tolerate
the file being absent at any time.

## Editing rules

- **Deduplicate:** tighten an existing observation instead of adding the same fact twice.
- **Supersede:** when current evidence contradicts an entry, replace or remove the old entry.
- **Consolidate before cap:** if a section is full, merge overlapping entries before adding another.
- **Promote durable rules:** if a learning becomes pipeline policy, move it to the authoritative
  policy/validator and remove it here.
- **Prefer deletion over archaeology:** stale facts that no longer help a current run should not be
  retained merely because they once happened.

No fixed six-month retention rule is part of the contract; staleness is determined by current
evidence and usefulness.

## Sensitive data

Entries must contain shapes, not sensitive values.

Good:

```text
- (2026-09-15) runner emits a 32-hex trace id in the failure footer src: target/test-report.txt check: inspect one current failed report
```

Bad:

```text
- (2026-09-15) customer ACME account 123456789 failed with token abc...
```

`learnings-check.mjs` catches only recognizable patterns. Human review still owns semantic redaction.

## Section guidance

### Running this repo

Commands the repository publishes, runner behavior that is easy to misread, scope-selection behavior,
or a verified recurring test-runner quirk.

### Repository shape

Where important generated/authored files really live, local naming meaning, or a non-obvious module
boundary.

### Evidence and artifacts

Encoding/path/report conventions that help a later run find or interpret evidence correctly.

### Failure signatures

A distinctive error/signature, its verified cause, and where the relevant mechanism lives.

## Validation

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/learnings-check.mjs
```

- exit 0: valid
- exit 1: invalid; fix the reported problems
- exit 2: file absent; normal

This validator checks **shape**, not truth.

It cannot prove that:

- the observation was actually verified,
- the entry is novel,
- a semantic identifier was fully redacted,
- the entry is still true,
- the `check:` step was run.

Those remain evidence responsibilities of the current run.

## Design rule

Use this file to make rediscovery cheaper, not to make reasoning disappear.

A healthy learning tells the next run **where to look and how to re-check**. It never tells the next
run what conclusion to reach.
