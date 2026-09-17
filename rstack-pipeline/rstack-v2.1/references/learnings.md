# The learnings file

**Status: EXPERIMENTAL, off by default.** `.rstack/learnings.md` is optional repository-specific memory. No supplied evidence establishes that it saves more than it costs, so nothing in the pipeline requires it, reads it by default, or behaves differently when it is absent. A team turns it on by deciding to, in its adoption record; `discovery-cost.md` holds the test for whether it earned its place.

It is not a log, not an instruction file, and **not evidence for any run**.

## What an entry is

A lead: where a past run found something, and how to re-check it cheaply.

```text
- (YYYY-MM-DD) <repository fact> src: <where it came from> check: <read-only re-check>
```

For the run that reads it, an entry proves nothing. `src:` says where an old fact came from; `check:` says how to find out whether it still holds. A stored command is not proof the command works; a stored path is not proof of the file's contents. **A role that uses an entry runs its `check:` first and cites what the check showed — never the entry.** An entry that fails its check is removed.

A healthy entry tells the next run where to look. It never tells it what to conclude.

## Who writes it

A human. A run may *propose* an entry — the orchestrator lists candidates in its final reply — and a person decides whether to add it. No role has a learnings write lane, and there is no automatic append.

Record an entry only when it was actually observed, is specific to this repository, is likely to be needed again, is not trivial to rediscover, and has a cheap read-only re-check. Not: implementation advice, acceptance criteria, pipeline rules, ticket-specific conclusions, the conclusions of any auditor or reviewer, secrets, customer or ticket identifiers, history. Shapes, not values: "runner emits a 32-hex trace id in the failure footer", never the id. A cross-repository fact belongs in a plan, not here. A lesson that should change every run belongs in the owning skill, reference or script.

## Who reads it

When enabled: the planner, the tester and the developer may be given the path, as repository context only.

**Never** the plan auditor or the reviewer-architect. Their value is that they inherit no earlier conclusion. The orchestrator does not send it to them, and they ignore it if sent.

## Size and shape

Four optional sections — `## Running this repo`, `## Repository shape`, `## Evidence and artifacts`, `## Failure signatures` — with at most 12 entries each, 400 characters per entry, one line per entry, `-` bullets, 24,000 bytes in all. When a section is full, merge before adding. Replace an entry that current evidence contradicts. Delete what no longer helps; this is not an archive.

`learnings-check.mjs` (reconstructed design) checks that shape and some recognisable secret and instruction patterns: a SCRIPT CHECK of form. It cannot show that an entry was observed, is new, is fully redacted, is still true, or that anyone ran its `check:`. Nothing consumes its result; it is not a gate.

## Persistence

The file is shared memory only if the team commits it; until then it is one machine's state and `git clean` can remove it. The pipeline tolerates its absence at any moment.
