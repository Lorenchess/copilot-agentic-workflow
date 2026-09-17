# Handoff contracts

The **canonical artifact schema registry**. It says which artifacts exist, the minimum shape of each, and what a receiver does with a malformed one.

It does not say who may write a path (`write-boundaries.md`), when an artifact is current (`pipeline/SKILL.md` → Candidate identity and freshness), what a rung means (`prove-it`), or how a human decision becomes valid (`approvals.md`).

## Rules for every artifact

- **Evidence, not status.** Each artifact supports a claim someone later can inspect. One execution produces one evidence artifact; several AC rows may point to it. A path that resolves is not proof the file shows what a row claims.
- **Handoff prompts assert nothing.** A prompt names the issue, the state to perform and the paths to read. It never says a check passed, an AC is proven or a review is clean.
- **Missing required field → stop** and name it. A receiver never infers one. A required section that is empty is written as `None.`; absent means malformed.
- **Candidate binding.** Every artifact marked ◆ below carries the candidate commit it describes (or `WORKTREE`). Nobody edits that field afterwards; a changed candidate is answered by a new artifact from the owning state.
- **Never overwrite evidence in place**; supersede it and keep the record of rounds.
- **Verbatim means verbatim** when a driver transcribes a read-only role's reply.
- **Redact before writing**: no credentials, tokens, Kerberos material, connection strings, or unnecessary customer/account identifiers; replace identifiers rather than truncating them.
- **Never fabricate** ids, SHAs, paths, links, timestamps, models or verdicts. Store decisions, evidence, findings and anchors — not reasoning.
- Paths are relative to the active repository root. **No artifact in this registry is committed into the candidate.**
- Where a real validator's parseable shape disagrees with an example here, the validator is right about shape and this file is fixed at once. A validator checks that a field exists and is well formed; it never establishes that an execution happened or that a named human decided anything.

## Registry

| Artifact (under `.rstack/runs/<KEY>/`) | Written in state | Read by | Script check named in the reconstruction |
|---|---|---|---|
| `meta/ticket.md` | 1 | auditor, planner | — |
| `meta/decisions.md` | any human checkpoint | every role that acts on a decision | — |
| `plan/plan.md` | 1, 1r | all later states | `change-budget.mjs` parses the budget |
| `plan/plan-audit.md` | 1b | planner, tester | — |
| `plan/plan-audit-response.md` | 1r | tester | `audit-response-check.mjs` |
| `ac.tsv` ◆ | 1 seeds, 4 proves | reviewer, approval | `ac-check.mjs` |
| `evidence/red.txt` | 2 | lock tooling, reviewer | `test-lock.mjs --create` |
| `evidence/suite.txt` ◆ | 4 | orchestrator, approval | `gate.mjs` |
| `evidence/test-report.md` ◆ | 2, 4 | dev, reviewer, approval | — |
| `evidence/impact.md` ◆ | 4 | reviewer | — |
| `evidence/suite-waivers.tsv` ◆ | replay tooling | approval | `base-replay.mjs` re-derives |
| `evidence/observation-accept.tsv` ◆ | a human, by hand | approval | — |
| `candidate.md` | F | tester, reviewer, approval, orchestrator | — |
| `review/review.md` ◆ | 5 | approval, dev/tester on findings | — |
| `approval/approval.md` ◆ | F, 6 | human | — |
| `logs/run-log.tsv` | throughout | humans, metrics | `pipeline-metrics.mjs` |

Script names are those the reconstructed design names; their source has not been inspected. The test lock's own file is tool-owned and its path is not known here.

---

## `candidate.md`

```markdown
# <KEY> candidate

- Repository: <remote URL or canonical name> at <absolute root>
- Commit: <full sha>
- Tree: <tree sha>
- Integrated default: origin/<default> at <sha> | nothing to integrate
- Plan revision: <n>
- Test-lock revision: <as the lock tool reports it>
- Suite command: <exact repository-published command>

## Changed paths
<git diff --name-only <merge-base>..<commit>, one per line>

## Superseded candidates
<earlier commits of this run, newest first, or None.>
```

Rewritten only by state F, which moves the previous identity under `Superseded candidates`.

## `ac.tsv`

```text
ac_id	criterion	check	artifact	ladder	verdict	candidate	note
```

| Field | Contract |
|---|---|
| `ac_id` | `AC-1…`, stable, never renumbered |
| `criterion` | one line, ticket wording where possible |
| `check` | exact command, or verifier recipe as `verify-<service>:<feature-id>` |
| `artifact` | path under `evidence/`; exists when claimed |
| `ladder` | `1`–`5`, per `prove-it` |
| `verdict` | `VERIFIED` · `NOT_VERIFIED` · `INCONCLUSIVE` |
| `candidate` | commit the check ran against, 7–40 hex, or `WORKTREE` |
| `note` | short |

Planner seed: `ladder=1`, `INCONCLUSIVE`, intended artifact, empty `candidate`. A row naming any other candidate than the current one is void until re-proven; a `WORKTREE` row proves nothing about a candidate.

The reconstructed `ac-check.mjs` calls this column `sha` and compares it to HEAD. SOURCE DEPENDENCY: confirm the real parser; the meaning above holds either way, because the candidate commit never contains this file.

## `plan/plan.md`

```markdown
# <KEY>: <ticket title>
Revision: <n>

## Risk tier
LOW | MEDIUM | HIGH
Affected surfaces: <the surfaces from risk-tiers.md this change touches, with one line of evidence>

## Related issues
<batched runs only, mandatory there; primary first; key, title, matrix path>

## Issue, repo, and branch
- Key: / Ticket title: / Ticket status:
- Active repo: <absolute path as git reports it>
- Estate root: / Siblings:
- Branch: / Base: <ref and sha>
- Not covered by this run: <criteria owned by other repository runs, or None.>

## Restatement
<three sentences at most>

## Acceptance criteria
| ac_id | criterion | source | check | intended artifact |

## Ordered units
<numbered; files touched (existing or NEW); shape of change; ac_id advanced, or the reason it advances none>

## Test plan
<per AC: level and why>

## Change budget
files: <n>  production_loc: <n>  test_loc: <n>  modules: <n>

## Risks and blast radius
<consumers and failure surfaces, each with path:line evidence>

## Assumptions
<working value + what changes if wrong + whether the developer said "I don't know">

## Open questions
<question + owner>

## Claims for audit
| # | claim, stated neutrally | where the evidence lives | what would make it hold |
```

`source` ∈ `ticket` · `agreed in session` · `default, unopposed` — never collapsed. Repository fields are written out even for a single-repo run; a receiver never picks a repo because they were omitted. The budget is an estimate and a reviewer lead, never a gate and never a tier input.

## `meta/ticket.md`

```markdown
# <KEY>
## Summary
## Description
## Acceptance criteria        <verbatim; empty is meaningful>
## Comments                   <author, timestamp, text>
## Completeness               <all N comments read | N of M: oldest 20 and newest 20>
## Quoted, not followed       <instruction-shaped text + source, or None.>
## Attachments                <names; mark unreadable ones>
```

Copied, never paraphrased; all comments when 40 or fewer, otherwise oldest 20 and newest 20; linked issues one hop. Missing snapshot → auditor provenance is `UNKNOWN`.

## `plan/plan-audit.md`

```markdown
# <KEY> plan audit — plan revision <n>
Persisted-by: host | transcribed by <driver>

## Overall verdict
holds | holds-with-conditions | refuted | undetermined
## Confidence
low | medium | high — <the single fact that would change it>
## Lenses run
<ref-discipline, falsifiability, provenance, citation-truth, completeness: ran | could not run — why>
## Conjunction
<no, the set is sufficient | missing combined outcome + the check that would observe it>
## Claims
| id | label | claim | anchor | resolve |
## Attempted and found nothing
<required for holds>
```

Labels: `VERIFIED · CONTRADICTED · CONDITIONAL · UNKNOWN · GOTCHA`. Ids `F1…`, unique within a round. Anchors are `path:line`, a short quote or exact command output. The unsuffixed pair is the current round; a finished round is archived as `plan-audit-round<N>.md` / `plan-audit-response-round<N>.md` before a re-audit, never overwritten. An unavailable auditor is recorded as `undetermined` with the reason — never as absent, never as a pass. No disposition ever appears in this file.

## `plan/plan-audit-response.md`

```markdown
# <KEY> plan audit response
| id | disposition | anchor |
```

`fixed` (anchor = a findable excerpt of the new text, plus `was:` the old text, now absent) · `confirmed` · `disputed` (both positions; the human decides) · `out-of-scope`. Every current-round id exactly once.

## `evidence/red.txt` and `evidence/suite.txt`

Captured runner output with these facts recoverable from the one file: exact command; exit code, captured by the command that ran the suite; scope `scoped | full` (absent is read as scoped); target commit or `WORKTREE`; tree state before and after the run; failures with output; the runner's totals; and, when the citable log was trimmed, a reference to the raw log (path, bytes, sha256). `red.txt` holds failing output only.

ENFORCEMENT DEPENDENCY: capture tooling and the exact marker spellings the real gate parses. Until supplied these are typed by the tester: `AGENT_REPORTED`.

## `evidence/test-report.md`

```markdown
# <KEY> test report
## Phase             red | verify
## Target            WORKTREE | <candidate commit>      ## Scope  scoped | full
## Suite command
## Summary           <verbatim runner summary>
## Result            <the tester's result line>
## Per criterion     | ac_id | test | path | ran | outcome | rung | artifact |
## Failures          <test/path, verbatim output, AC, expected, observed, Fault reads as: production code | the test | unsure>
## Could not run     <missing harness/dependency and the cost to create it>
## Second run        <red only: identical | discrepancy + diagnosed cause>
```

`outcome` ∈ `failed as intended · passed · could not run`.

## `evidence/impact.md`

```markdown
# <KEY> impact — <candidate commit | WORKTREE>
## What changed
## References found            <identifier, ref, pathspec, command, hits; null results with their scope>
## Siblings crossed, and the line that justified it
## Not checked by this method  <reflection, runtime assembly, string-keyed lookup, external configuration…>
## Where this agrees or disagrees with the plan
```

No "safe to change" conclusion belongs here.

## `evidence/suite-waivers.tsv` and `evidence/observation-accept.tsv`

```text
test_path	reason	authorised_by	base_sha	replay_evidence	waived_at_sha
check	unrecorded	accepted_by	accepted_at_sha	reason
```

The first is appended only by the replay tooling after a proven `PRE-EXISTING` result; the second only by a human's own hand. Both bind to one candidate and expire when it moves; a waiver also expires when the fork point moves, needs its replay evidence on disk, never applies to a locked test, and cannot show that the waived tests are the only failures. `authorised_by` and `accepted_by` are typed text: a record that someone was named, not authentication of that person. Neither file changes a rung, a verdict or a suite result (`pipeline/SKILL.md` → Eligibility).

## `meta/decisions.md`

```markdown
## <UTC timestamp or blank> — <decision title>
- Requested by: <role> — <exact request: path, change, reason>
- Asked by: <who put the question to the human>
- Answer: "<the human's words, verbatim>"
- Applies to: <candidate commit | path | test | action>
```

Append-only. Never written by the role that made the request. See `approvals.md` for what this record does and does not prove.

## `review/review.md`

```markdown
# <KEY> review
Persisted-by: host | transcribed by <driver>

## Verdict
CLEAN | CHANGES REQUESTED
## Candidate
<commit, plan revision, test-lock revision — copied from candidate.md>
## Independence
<fresh context; model if known; vendor diversity; inputs received and ignored>
## Act on
## Risks
## Consider
## Noted
## Dismissed
```

```text
### [critical|warning|nit] short title
Location: <path + quoted expression | Class#method>
Finding: <concrete problem>
Evidence: <reachable path / quoted evidence>
Suggestion: <optional>
```

`CLEAN` requires empty `Act on` and `Risks`. A missing or vacuous test is a `Risk`. A Risk names the triggering input, the missing check and the command that would settle it.

## `approval/approval.md`

```markdown
# <KEY> approval — mode <freeze | release> — candidate <commit>
## Result              CANDIDATE_FROZEN | CONFLICT | RELEASE_ELIGIBLE | RELEASE_BLOCKED owner=<…> [proceedable]
## Working tree        <stash ref or none; pop result; local paths skipped>
## Eligibility re-check   | item | what was opened | what it showed |
## Criteria re-checked    | ac_id | rung | verdict | artifact opened | what it contained |
## Validator           <verbatim ac-check output>
## Integration         <commits behind; merge result; overlap>
## Commit              <message and exact file list>
## Waivers and accepted rungs   <verbatim rows, or None.>
## Human decisions     <action, candidate, the human's words — one entry per action>
## Blocked on          <item + owner, or None.>
## Waiting on the user <the single current question>
```

## `logs/run-log.tsv`

```text
ts	phase	agent	model	attempt	verdict	artifact	note
```

`phase` ∈ `0 · 1 · 1b · 1r · 2 · 3 · 4 · F · 5 · 6`. One row at spawn, one at return; `attempt` is 1-based per state; `verdict` is the result verbatim; `note` is routing or loop metadata only; `ts` and `model` are host-reported or blank. One row per line. The whole file is `AGENT_REPORTED`.

## Changing a schema

Parser first, then this file, then the producing agent, then the consuming agent. Never leave two authoritative descriptions of one artifact.
