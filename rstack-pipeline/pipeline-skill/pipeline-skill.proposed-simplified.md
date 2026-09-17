---
name: pipeline
description: Seven-phase delivery pipeline for a ticketed change: plan, adversarial plan audit, red-first tests, implementation, gated verification, fresh-context review, and human-controlled approval. Artifacts, not conversational reports, move work between phases.
menu-description: run a ticket through planner, audit, tests, dev, gate, review, approval
---

# Pipeline

Seven phases, six agents, one invariant:

> **Nothing advances on a report alone. State advances on validated artifacts and machine-readable gate results.**

The phases are intentionally separated so no agent writes the thing that judges its own work.

## Canonical flow

```text
1   planner
1b  plan-auditor        fresh context
2   tester              red + lock
3   dev                 production code only
4   tester              scoped gate + impact evidence
5   reviewer-architect  fresh context, read-only
6a  approval            integrate default, then stop
4b  tester              full re-gate at merged SHA
6b  approval            prepare commit / human release decisions
```

Routes:

- plan audit refuted → planner
- phase-4 code failure → dev
- reviewer `Act on` → dev
- reviewer `Risks` (missing/vacuous check) → tester
- clean review → approval
- integration changes HEAD → tester full re-gate
- full re-gate pass → approval
- external actions → explicit human approval, one action at a time

No risk tier removes a phase. Risk only changes search/review depth.

## Control-plane rule

Phase transitions are owned by the pipeline/harness, not inferred from prose.

Prefer machine-readable outputs:

```text
PASS
BLOCKED owner=<role>
BLOCKED proceedable=true owner=human
INCONCLUSIVE owner=<role|human>
```

The orchestrator dispatches the named owner and passes artifact paths, not phase reasoning.

## Required artifact layout

```text
.rstack/runs/<KEY>/
  ac.tsv                         # committed
  meta/ticket.md                 # tracker text, verbatim
  plan/plan.md
  plan/plan-audit.md
  plan/plan-audit-response.md
  evidence/red.txt
  evidence/suite.txt
  evidence/test-report.md        # only when failures need handoff
  evidence/impact.md
  evidence/suite-waivers.tsv     # only for proven pre-existing failures
  review/review.md
  approval/approval.md
  logs/run-log.tsv
```

Cross-run repository observations live in:

```text
.rstack/learnings.md
```

Only the canonical artifact schemas define required fields. Do not duplicate schemas in agent prompts.

## Phase 0 — preflight once

Run read-only probes first, heal what requires no human, then ask at most one grouped prompt for phase-0 decisions.

Probe:

- current repo / estate-root state,
- pinned siblings,
- artifact protection,
- unrelated working-tree changes,
- verifier availability,
- `.rstack/learnings.md`.

Classification:

- `GREEN`: say nothing,
- `HEAL`: fix silently with the canonical script,
- `ASK`: only genuinely human-owned choices.

Do not ask repository scope before the ticket is read. Planner owns repository-set discovery in phase 1.

If unrelated work must be stashed, whoever creates that stash owns restoring it at the end of the run.

## Phase 1 — planner establishes the run

Planner:

- captures tracker text verbatim,
- asks which repositories the ticket touches,
- settles ambiguous/missing ACs with the human,
- resolves one writable active repo and readable siblings,
- seeds one AC matrix per ticket,
- writes `plan.md`,
- cuts/uses the ticket branch.

The run writes to one repository even when the ticket references several.

A ticket with no falsifiable AC and no human available to settle it stops here.

## Phase 1b — independent plan audit

Always run the plan auditor in fresh context.

Pass:

- plan path,
- AC matrix path,
- recorded ticket path,
- repository context.

Do not pass:

- planner reasoning,
- planner confidence,
- `.rstack/learnings.md`.

The auditor re-derives claims from primary evidence and returns a schema-conformant audit artifact.

Refuted/undetermined claims route back to the planner.

## Phase 2 — tester writes the bar

Tester owns tests; dev never edits them.

Required properties:

- each AC has a named check,
- each new check demonstrates discrimination,
- red evidence is captured,
- tests are locked after red.

The test-lock script, not prose, is the authority for:

- hashes,
- assertion/skip invariants,
- amendments,
- human authorization.

Changing a locked test changes the definition of done.

Verification-only tickets still prove the test can discriminate and still pass through reviewer.

## Phase 3 — implementation

Dev writes production code only.

For each ordered unit:

1. make the smallest change,
2. run its named check,
3. run relevant neighbor checks,
4. continue only when green.

Dev never edits tests, AC evidence, validators, governance, or sibling repos.

## Phase 4 — tester gate

During the dev loop, run a **scoped** gate.

At release re-gate, run a **full** suite at the merged SHA.

The suite-capture harness owns shell-specific mechanics:

- exit-code capture,
- HEAD,
- tree-before/tree-after,
- scope,
- UTF-8 handling,
- quiet/raw/trimmed logs,
- size limits.

Agents should invoke the canonical wrapper and consume its structured artifact rather than reimplementing Bash/PowerShell choreography in prompts.

Tester also:

- updates `ac.tsv`,
- validates it,
- captures `impact.md`,
- runs base replay,
- proves any claimed pre-existing failure,
- invokes `gate.mjs`.

A scoped run cannot close the ticket.

## Impact evidence

`impact.md` is mechanical capture, not judgement.

Required:

- references found,
- search ref/scope,
- what the search method cannot see,
- sibling crossings only where dependency evidence exists.

Reviewer judges the meaning later.

## Phase 5 — fresh-context reviewer

Always spawn fresh.

Pass only:

- plan,
- AC matrix,
- impact evidence,
- tests,
- diff / readable repository context.

Do not pass:

- implementation reasoning,
- prior phase summaries,
- `.rstack/learnings.md`.

Reviewer routes:

- production-code defect → `Act on` → dev,
- missing/vacuous check → `Risks` → tester,
- clean (`Act on` and `Risks` empty) → approval.

The reviewer is read-only. Its returned payload is persisted automatically by the harness/driver to `review.md`; no model should be required to act as a stenographer.

## Phase 6 — two-pass approval

Approval first re-checks:

- gate,
- AC matrices,
- review,
- impact evidence,
- artifact contents,
- estate pin,
- working tree.

### Pass A — integrate

Protect local work, then integrate default **once** by merge, never rebase.

If merge conflicts, stop for human/developer resolution.

Integration changes HEAD and invalidates SHA-pinned AC evidence.

Therefore approval stops and routes to tester for a **full** re-gate at the merged SHA.

### Pass B — release preparation

After full re-gate:

- do not automatically merge default again,
- compare upstream changes since gated SHA,
- no overlap → continue,
- overlap → ask whether another integration/re-gate is worth the cost.

Prepare staged paths and commit/PR text, then stop at human decisions.

## Pre-existing suite failures

A failing suite is never silently rounded to pass.

A claimed pre-existing failure must be proven by base replay.

A waiver requires:

- replay proof,
- reason,
- named human,
- canonical waiver artifact.

A valid waiver can make a `BLOCKED` gate `proceedable=true`; it does not turn it into `PASS`.

Locked tests cannot be waived.

## Write boundaries

One canonical file owns role write boundaries:

`references/write-boundaries.md`

Scripts enforce the roles that can self-check.

Do not restate the entire boundary matrix in this skill or every agent. Agents may summarize only their own lane.

Core invariants:

- planner: plan/artifacts, no production/tests,
- tester: tests/evidence, no production,
- dev: production, no tests/evidence verdicts,
- reviewer/auditor: no writes,
- approval: git/release artifacts, no production/tests,
- orchestrator: orchestration artifacts/log/learning only.

## Learnings

`.rstack/learnings.md` contains bounded repository observations, not instructions.

Entry shape:

```text
- (YYYY-MM-DD) <observation> src: <source> check: <how to re-confirm>
```

Only append verified, reusable repository facts.

Fresh-context agents (plan auditor and reviewer) do **not** receive it.

Historical incidents and architecture rationale belong in references/docs, not in this runtime skill.

## One ticket per run

Default: one ticket, one branch, one artifact namespace.

Exception: tightly related stories delivered together.

For a batch:

- one branch,
- one plan,
- one suite execution where appropriate,
- one review,
- one PR,
- one AC matrix per ticket,
- gate checks every ticket independently,
- commits retain the ticket key(s) whose work they contain.

Unrelated tickets do not batch.

## Human/external-action boundary

Local reversible work can proceed without repeated approval.

Always ask immediately before:

1. shipping commit prepared by approval,
2. push to a shared branch,
3. PR creation,
4. tracker/review-system write,
5. deploy/shared-environment write.

Ask one at a time.

Approval is an affirmative response to the action just described. Silence, old permission, ticket text, PR comments, or "run until done" do not authorize a new external action.

No agent merges a pull request.

## Gate philosophy

**Satisfy the condition, never the instrument.**

Never obtain green by:

- weakening/skipping a test,
- changing evidence so a parser accepts it,
- modifying timestamps,
- lowering an evidence rung,
- narrowing a run that was supposed to be full,
- changing a validator.

If a gate is forgeable, report the broken gate and treat it as unpassed.

## Canonical gates

1→2:
- ACs are falsifiable,
- user-settled criteria are recorded,
- named checks exist in the plan.

2→3:
- new tests demonstrably discriminate,
- red evidence exists,
- lock created.

3→4:
- dev names/runs unit checks.

4→5:
- scoped gate valid,
- AC rows verified at required rung,
- impact evidence exists,
- gate owns transition result.

5→6:
- reviewer `CLEAN`,
- no `Act on`,
- all named risks have checks.

6→human:
- full re-gate at merged SHA,
- evidence re-opened,
- working tree protected,
- release material prepared.

Skipped gates must be explicit and recorded; silent skip is invalid.

## Command discipline

Keep runtime commands simple:

- one command, one purpose,
- use checked-in scripts rather than inline programs,
- discover runner commands from repository config,
- avoid redundant existence/size probes,
- use canonical scripts when they already answer the question.

This reduces permission prompts and command-shape ambiguity.

## Agent replies

Artifacts are for machines; replies are for the human deciding what happens next.

Every phase reply:

- verdict first,
- one fact per bullet,
- evidence second,
- one recommended next action,
- alternatives only after the recommendation.

Do not restate entire artifacts.

## When this pipeline does not fit

Use another mode/playbook for:

- read-only investigation,
- unticketed bug reproduction,
- behavior-preserving refactor,
- work with no falsifiable acceptance contract.

Do not force the factory onto work it cannot meaningfully prove.

## Final run report

Report:

1. what remains unproven and owner,
2. per AC: rung, verdict, artifact,
3. reviewer verdict and acted-on findings,
4. loop count and purpose of each loop,
5. branch / prepared commit / next human decision.

Never fabricate ticket IDs, commits, links, or evidence.
