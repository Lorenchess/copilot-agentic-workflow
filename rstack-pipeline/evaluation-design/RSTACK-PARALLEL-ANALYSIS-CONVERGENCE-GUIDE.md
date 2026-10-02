# RSTACK Parallel Analysis Convergence and Refactor Readiness Guide

**Status:** Required convergence phase after parallel Sessions A–D complete.

**Purpose:** Reconcile the independent architecture, behavioral-baseline, artifact-efficiency, and instruction-architecture analyses into one accepted refactor-readiness record before any implementation batch begins.

This guide coordinates:

- RSTACK-PARALLEL-CLAUDE-SESSION-PROMPTS.md
- RSTACK-SAFE-REFACTOR-EXECUTION-ORDER.md
- RSTACK-REPOSITORY-ARCHITECTURE-REFACTOR-GUIDE.md
- RSTACK-INSTRUCTION-ARCHITECTURE-HARDENING-GUIDE.md
- RSTACK-INSTRUCTION-ARCHITECTURE-EVAL-PLAN.md
- RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md
- RSTACK-DECISION-LAYER-EFFICIENCY-AUDIT.md

The convergence phase is **analysis only**.

It does not authorize changes to runtime agents, Skills, references, generators, models, effort, routing, schemas, artifact formats, or repository paths.

The main rule is:

> **The parallel sessions discover independently. The convergence session reconciles their evidence into one accepted baseline and one ordered implementation plan.**

---

# 1. When this phase starts

Start this phase only after all of these are complete:

- Session A — repository architecture / Batch 0,
- Session B — behavioral baseline,
- Session C — artifact and handoff efficiency,
- Session D — instruction architecture inventory.

Do not begin implementation because one of the four sessions finished early.

Wait until all four reports are available.

---

# 2. Use a fresh integration session

Do not ask one of Sessions A–D to simply continue and become the integrator.

Use a fresh Claude session so the integrator begins with:

- the coordination guides,
- all four completed reports,
- the current repository,
- no ownership of one prior analysis.

The integrator may investigate the repository to resolve conflicts.

It must not modify runtime behavior.

---

# 3. Evidence authority by workstream

The four reports have different responsibilities.

Use this precedence:

| Session | Primary authority |
|---|---|
| A — Architecture | canonical/generated ownership, generators, install destinations, repository dependency structure, host-specific versus portable paths |
| B — Behavioral baseline | observed current behavior, tests, run outcomes, role behavior, current regressions and known failures |
| C — Artifact/handoff | measured artifact volume, duplication, persistence needs, handoff/context overhead |
| D — Instruction architecture | instruction ownership recommendations, degrees of freedom, progressive-disclosure issues, duplicated normative rules |

This does not mean any report is automatically correct.

It means disagreements are resolved against the kind of evidence each session was assigned to establish.

---

# 4. Source-of-truth rules

## Architecture claims

Use repository source, generators, install scripts, and host configuration.

Do not determine canonical source by filename or directory appearance.

## Behavioral claims

Prefer actual tests, frozen run evidence, and reproducible observations over prose describing intended behavior.

## Artifact-purpose claims

Identify the real writer and consumer before calling an artifact unnecessary.

## Instruction-ownership claims

Use responsibility boundaries:

~~~text
pipeline-wide rule        → control-plane owner
role-specific procedure   → role agent
reusable procedure        → Skill
stable declarative detail → reference
objective rule            → deterministic control
human-owned choice        → human
historical rationale      → docs / ADR / evaluation record
~~~

## Model or effort claims

Separate intended configuration from observed effective runtime configuration.

If runtime model/effort cannot be verified, record UNKNOWN.

---

# 5. Required input set

The integration session should receive:

1. Session A final report.
2. Session B final report.
3. Session C final report.
4. Session D final report.
5. The current repository revision.
6. Current safe-refactor execution guidance.
7. Current instruction architecture and evaluation guides.
8. Current artifact/handoff review guidance.
9. Any approved run evidence used by the four sessions.

Do not silently substitute stale reports from earlier repository revisions.

---

# 6. First task — verify the four reports refer to the same baseline

Before reconciling findings, establish:

~~~text
repository revision
active RSTACK revision
host
known model configuration
known effort configuration
run IDs used
test fixtures used
generated tree revision
~~~

If the reports were produced against materially different revisions, do not merge their conclusions as if they describe one system.

Classify each report:

- SAME_BASELINE
- COMPATIBLE_BASELINE
- STALE
- UNKNOWN

If STALE findings are still useful, label them historical rather than current.

---

# 7. Build the accepted current architecture map

Use Session A as the starting point.

The integrator must produce one accepted map showing:

- canonical authored source,
- generated outputs,
- generators,
- installed host destinations,
- runtime-loaded paths,
- evaluation-only paths,
- test paths,
- documentation/history,
- .rstack runtime state,
- unresolved ownership.

Example:

~~~text
CANONICAL
  <path>

GENERATED
  <path>
  producer: <generator>

HOST INSTALL
  <path>

EVALUATION
  <path>

RUNTIME STATE
  .rstack/runs/<ticket>

UNKNOWN
  <path and evidence needed>
~~~

Do not begin instruction refactoring until this map is accepted.

---

# 8. Build the accepted behavioral baseline

Use Session B as the starting point.

For every major role record:

| Role | Current behavior | Evidence | Known defects | Current tests | Confidence |
|---|---|---|---|---|---|
| Planner | ... | ... | ... | ... | HIGH/MEDIUM/LOW |
| Plan Auditor | ... | ... | ... | ... | ... |
| Tester | ... | ... | ... | ... | ... |
| Developer | ... | ... | ... | ... | ... |
| Reviewer | ... | ... | ... | ... | ... |
| Orchestrator | ... | ... | ... | ... | ... |
| Approval | ... | ... | ... | ... | ... |

This baseline is what later batches must preserve or intentionally change.

Do not normalize an existing defect into intended behavior merely because it is reproducible.

Mark:

- EXPECTED_CURRENT_BEHAVIOR
- KNOWN_DEFECT
- UNKNOWN
- POLICY_UNSETTLED

---

# 9. Build the accepted artifact/handoff baseline

Use Session C as the starting point.

For major artifacts classify:

| Artifact | Persistent value | Hot-context value | Parser requirement | Duplication | Candidate action |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

Preserve the distinction:

~~~text
PERSISTENT EVIDENCE
is not the same as
HOT HANDOFF CONTEXT
~~~

Do not approve deletion of evidence merely because it should not be injected into every agent.

---

# 10. Build the accepted instruction inventory

Use Session D as the starting point.

For significant sections record:

| Current section | Current owner | Classification | Degree of freedom | Proposed owner | Risk |
|---|---|---|---|---|---|
| ... | ... | KEEP_LOCAL / MOVE... | L0/L1/L2/HUMAN | ... | ... |

The integrator should specifically identify:

- duplicated normative rules,
- rules located in generated copies,
- long references needing navigation,
- L0 rules implemented only as prose,
- L2 roles that are over-prescribed,
- L1 outputs that should be more structured,
- human-owned decisions delegated to agents.

---

# 11. Reconcile cross-session findings

Create one table:

| Finding ID | Finding | Sessions | Evidence | Conflict? | Accepted status | Earliest batch |
|---|---|---|---|---|---|---|

Use accepted status:

- ACCEPTED
- ACCEPTED_WITH_LIMITATION
- REJECTED
- DEFERRED
- UNKNOWN

Do not discard disagreements.

State why one conclusion is stronger.

---

# 12. Example conflict resolution

## Example A — generated file

Session D says:

> Planner agent should be reduced.

Session A proves the inspected file is generated.

Accepted conclusion:

~~~text
instruction finding = valid
edit location = canonical source from Session A
generated copy = never edited directly
~~~

## Example B — intended versus observed routing

Documentation says Auditor refutation routes one way.

Session B shows current runtime routes differently.

Accepted conclusion:

~~~text
documented intent ≠ observed behavior
record both
do not silently choose one
policy owner must decide before refactor
~~~

## Example C — artifact appears redundant

Session C sees duplicate plan copies.

Session A discovers one is an immutable generated snapshot required by a parser.

Accepted conclusion:

~~~text
duplicate bytes are intentional
do not remove
evaluate hot-context usage separately
~~~

## Example D — prose rule versus deterministic enforcement

Session D identifies a long SHA-validation instruction.

Session A finds a validator already exists.

Accepted conclusion:

~~~text
check implementation coverage
if validator is authoritative:
  remove duplicated manual procedure later
if validator coverage is partial:
  hardening work remains
~~~

---

# 13. Produce a dependency matrix

Every accepted finding should be assigned to the earliest safe batch.

Example:

| Finding | Earliest safe batch | Dependency |
|---|---:|---|
| Generated Planner source unclear | 2 | Batch 0 ownership map |
| Long reference lacks TOC | 3 | direct caller known |
| Developer prompt repeats global policy | 4 | first role pilot |
| Reviewer prompt duplication | 5 | pilot method proven |
| Planner/Auditor repeated narratives | 6 | planning policy settled |
| Routing duplicated in Orchestrator | 7 | role contracts stable |
| Candidate SHA checked semantically | 10 | validator contract stable |
| plan.md duplicated in handoffs | 11 | artifact consumers known |
| Move agents into factory/ | 12 | generation and behavior stable |

A finding discovered now is not automatically work for the next batch.

---

# 14. Identify blockers to Batch 2

Batch 2 is:

> **Canonical/generated ownership hardening**

Before authorizing it, resolve every unknown that can make the wrong source get edited.

Blocking questions include:

1. What is canonical?
2. What is generated?
3. What generates it?
4. Where is it installed?
5. Which host loads it?
6. Is generation reproducible?
7. Which config is authoritative?
8. Which tests verify discovery/generation?
9. Which generated outputs are committed?
10. Which duplicates are historical/compatibility only?

If any blocking answer remains UNKNOWN, do not authorize Batch 2 for that area.

---

# 15. Non-blocking unknowns

Not every uncertainty must stop Batch 2.

Examples that may be deferred:

- future Bedrock adapter design,
- future Laminar exporter schema,
- untested alternative model allocation,
- long-term artifact storage backend,
- optional future host support.

Classify these as DEFERRED unless they directly affect canonical/generated ownership.

---

# 16. Freeze the accepted refactor baseline

Once the convergence report is approved, record:

~~~text
REFACTOR BASELINE

repository SHA:
active RSTACK revision:
host:
model configuration:
effort configuration:
canonical-source map:
generated-output map:
generator map:
behavior-baseline report:
artifact-baseline report:
instruction-inventory report:
known current defects:
known current warnings:
unresolved non-blocking unknowns:
~~~

This baseline should be immutable for the refactor comparison.

If main changes later, either:

- rebase and revalidate deliberately,
- or state that the batch is being compared against the frozen baseline.

Do not silently shift the baseline.

---

# 17. Separate findings into work queues

Classify accepted findings:

## NOW

Required for the next authorized batch.

## NEXT

Expected in Batches 3–5.

## LATER

Central control, deterministic hardening, handoff compaction, or repository migration.

## EXPERIMENT

Requires A/B evaluation before adoption.

## DEFER

Valid but not worth changing yet.

## REJECT

Would add complexity, reduce reliability, or is not supported by evidence.

The goal is to reduce scope, not create one giant refactor backlog.

---

# 18. Define exact Batch 2 scope

The convergence report must propose one narrow Batch 2.

Typical allowed Batch 2 work:

- mark canonical authored roots,
- mark generated outputs,
- document source → generator → destination,
- document regeneration command,
- add generated drift checks where low risk,
- clarify ownership in architecture docs.

Typical excluded work:

- prompt rewriting,
- Skill splitting,
- Planner/Auditor policy,
- routing changes,
- model changes,
- effort changes,
- artifact schema changes,
- large physical file moves.

The Batch 2 proposal must list exact files.

---

# 19. Define Batch 2 acceptance tests before implementation

The convergence report must name the tests that will decide whether Batch 2 is safe.

At minimum consider:

- canonical source unchanged semantically,
- generated output reproducible,
- generated hashes stable where no transformation change is intended,
- host discovers the same agents and Skills,
- tests remain at baseline,
- no model/effort drift,
- no routing change,
- no runtime artifact schema change.

Do not invent acceptance criteria after implementation.

---

# 20. Required convergence deliverable

Produce **one report**.

Suggested path:

~~~text
rstack-pipeline/reviews/<YYYY-MM-DD>-refactor-readiness-convergence.md
~~~

If internal workplace paths, runs, or data are required, store the report in an approved internal location instead.

Required sections:

## A. Executive summary

- whether the system is ready for Batch 2,
- largest confirmed risks,
- largest unresolved unknowns,
- recommended next action.

## B. Baseline compatibility

- source revisions used by Sessions A–D,
- SAME_BASELINE / COMPATIBLE / STALE / UNKNOWN.

## C. Accepted architecture map

- canonical,
- generated,
- installed,
- runtime,
- evaluation,
- tests,
- docs,
- unknown.

## D. Accepted behavioral baseline

- role-by-role current behavior,
- defects,
- fixtures,
- confidence.

## E. Accepted artifact/handoff baseline

- persistence versus hot-context findings,
- major inefficiencies,
- deferred changes.

## F. Accepted instruction inventory

- ownership,
- degrees of freedom,
- major duplication,
- deterministic-control candidates.

## G. Conflict log

- every meaningful disagreement across sessions,
- evidence used to resolve it,
- unresolved items.

## H. Dependency matrix

- accepted finding,
- earliest safe batch,
- prerequisites.

## I. Frozen baseline proposal

- exact SHAs/config/report identities.

## J. Batch 2 proposal

- exact allowed changes,
- exact excluded changes,
- exact tests,
- rollback.

## K. Decision

One of:

- READY_FOR_BATCH_2
- READY_WITH_LIMITATIONS
- NOT_READY

Stop after the report.

---

# 21. Human review gate

The integrator cannot authorize Batch 2.

After the convergence report:

1. Human reviews the accepted architecture and baseline.
2. Human resolves remaining policy questions.
3. Human accepts or modifies Batch 2 scope.
4. Human explicitly authorizes Batch 2.

Do not treat report completion as implementation approval.

---

# 22. What the integration session must not do

It must not:

- merge branches,
- move files,
- edit agents,
- edit Skills,
- rewrite references,
- regenerate host packages,
- change models,
- change effort,
- change routing,
- change human checkpoints,
- change schemas,
- delete artifacts,
- "clean up" discovered problems.

It may inspect source to resolve evidence conflicts.

---

# 23. Exact prompt for the fresh convergence session

Use:

> Read:
> - rstack-pipeline/evaluation-design/RSTACK-PARALLEL-ANALYSIS-CONVERGENCE-GUIDE.md
> - rstack-pipeline/evaluation-design/RSTACK-SAFE-REFACTOR-EXECUTION-ORDER.md
> - rstack-pipeline/evaluation-design/RSTACK-REPOSITORY-ARCHITECTURE-REFACTOR-GUIDE.md
> - rstack-pipeline/evaluation-design/RSTACK-INSTRUCTION-ARCHITECTURE-HARDENING-GUIDE.md
> - rstack-pipeline/evaluation-design/RSTACK-INSTRUCTION-ARCHITECTURE-EVAL-PLAN.md
> - rstack-pipeline/evaluation-design/RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md
> - the completed reports from Sessions A, B, C, and D.
>
> Perform the convergence phase only.
>
> Reconcile the four reports into one refactor-readiness report.
>
> Use Session A primarily for canonical/generated ownership and repository provenance, Session B for observed behavioral baseline, Session C for artifact/handoff evidence, and Session D for instruction/degrees-of-freedom recommendations.
>
> Where reports disagree, inspect the underlying source, generator, test, or run evidence instead of choosing by opinion.
>
> Produce:
> 1. accepted current architecture map,
> 2. accepted canonical/generated map,
> 3. accepted behavioral baseline,
> 4. accepted artifact/handoff baseline,
> 5. accepted instruction inventory,
> 6. conflict and UNKNOWN log,
> 7. dependency matrix assigning findings to the earliest safe batch,
> 8. blockers that must be resolved before Batch 2,
> 9. frozen baseline proposal,
> 10. exact Batch 2 scope, exclusions, acceptance tests, and rollback,
> 11. READY_FOR_BATCH_2 / READY_WITH_LIMITATIONS / NOT_READY.
>
> Do not modify runtime files, agents, Skills, references, generators, models, effort, routing, schemas, artifact formats, or repository paths.
>
> Stop for human review after the convergence report.

---

# 24. After human approval

If the decision is READY_FOR_BATCH_2 and the human approves:

~~~text
Convergence report
      ↓
Frozen baseline
      ↓
Batch 2 implementation session
      ↓
Batch 2 tests
      ↓
KEEP / REVERT / INCONCLUSIVE
      ↓
Human approval
      ↓
Batch 3
~~~

Do not send the convergence session directly into Batch 2 implementation.

Use a separate implementation turn/session with the approved scope.

---

# Final principle

> **Parallel analysis saves time only if the results are reconciled before they become code.**

The convergence phase converts four useful but independent viewpoints into:

~~~text
ONE ACCEPTED CURRENT STATE
        +
ONE FROZEN BASELINE
        +
ONE DEPENDENCY-ORDERED PLAN
        +
ONE NARROW NEXT BATCH
~~~

Only then should implementation resume.
