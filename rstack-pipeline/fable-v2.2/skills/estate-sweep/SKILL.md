---
name: estate-sweep
description: Read-only discovery of sibling consumers with explicit checkout, extension and truncation limits.
menu-description: find sibling consumers without changing their checkouts
---

# Estate sweep

A consumer search is L2 evidence of references, not executed compatibility or absence beyond the actual search scope.

## Boundaries

Read-only in every sibling: no edits, branches, commits, stash, fetch, checkout, build or tests. Use only an established dependency or an explicit request to discover the consumer set. The active repository remains the only writable repository.

The pictured script is skills/estate-sweep/scripts/sweep.sh; its source is not supplied. Inspect its current --help at the workplace before relying on options. Resolve its actual installed path; a bare scripts/sweep.sh points into the working repository.

## Procedure

1. Identify the wire/API/topic/schema/file-format/config identifier and the dependency that justifies the search. A runtime consumer may share no class name.
2. Inventory the repositories and actual refs/checkouts using the supported --repos mode. Root precedence in the pictured contract is --root, then RSTACK_ESTATE_ROOT, then parent of current repository. Explicitly account for grouped/nested layouts; the documented sweep only visits direct children.
3. Choose extensions deliberately. The documented defaults are JVM/config oriented and omit JS/TS/Python/shell/C#/COBOL/Terraform. Use explicit --ext coverage where those consumers matter; do not call an excluded language absent.
4. Sweep once, preserve its result, then inspect relevant hits. A comment, changelog or unrelated name is not consumption. Quote the verified relationship.
5. Report searched repositories, refs/staleness, root, patterns and extension set. Report two truncation lists separately: repositories with partial detail and repositories with no detail. Unvisited/uncheckable is not zero hits.
6. For a null result, bound the claim to that checkout and scope. Do not fetch a sibling merely to improve evidence. Request its owner to provide a newer view if freshness matters.

Use counts for navigation; preserve enough exact detail to reproduce each material claim. Do not automatically spawn a subagent per repository: delegation is a host/user choice, not proof and not required by this contract.

Search strings for queue/topic, fixed-width or delimited file name/format, ISO/message elements, database fields, profile and feature flags. Text search cannot prove reflective/runtime/external wiring; name those gaps.

The screenshot's timed run is a single historical anecdote, not a benchmark or a cost promise. Preserve evidence rather than rerunning for a prettier summary.

Reply: bounded result, exact scope, meaningful hits, stale/unvisited/truncated repositories and what remains unproven. Never equate source references with live end-to-end evidence.
