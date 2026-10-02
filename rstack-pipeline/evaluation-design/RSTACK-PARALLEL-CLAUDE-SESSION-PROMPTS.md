# RSTACK Parallel Claude Session Prompts

**Status:** Coordination guide for parallel analysis sessions.

**Purpose:** Allow multiple Claude sessions to gather evidence in parallel without creating conflicting implementations or corrupting the causal baseline for the RSTACK refactor.

This document assumes:

- Session A is already executing Batch 0 from RSTACK-SAFE-REFACTOR-EXECUTION-ORDER.md.
- Session A owns repository-architecture analysis, canonical/generated ownership, generator mapping, and target-architecture review.
- Sessions B, C, and D are analysis-only.
- Sessions B, C, and D may read the whole repository but must not modify runtime behavior or refactor files.
- If Sessions B, C, or D are unsure which copy is canonical, they record UNKNOWN and defer to Session A.

> **Parallelize evidence gathering. Serialize implementation of shared contracts.**

---

# Session A — Repository architecture / Batch 0

This session is already in progress.

Primary guidance:

- RSTACK-SAFE-REFACTOR-EXECUTION-ORDER.md
- RSTACK-REPOSITORY-ARCHITECTURE-REFACTOR-GUIDE.md

Session A owns:

- canonical authored source identification,
- generated-output identification,
- generator discovery,
- host-installation path mapping,
- dependency/reference graph,
- current-versus-target repository architecture,
- the ten one-minute architecture questions.

Sessions B–D must not independently override Session A's ownership findings.

---

# Session B — Behavioral baseline

Use this prompt in a separate fresh Claude session:

> Read rstack-pipeline/evaluation-design/RSTACK-SAFE-REFACTOR-EXECUTION-ORDER.md and rstack-pipeline/evaluation-design/RSTACK-INSTRUCTION-ARCHITECTURE-EVAL-PLAN.md.
>
> Work only on the behavioral-baseline portion of Batch 1.
>
> Inspect the current RSTACK implementation, existing tests and fixtures, and approved run evidence to document how the pipeline behaves before any refactor.
>
> Capture current behavior for Planner, Plan Auditor, Tester, Developer, Reviewer, Orchestrator, and Approval.
>
> Record where evidence exists:
> - model,
> - effort or reasoning setting,
> - host,
> - source revision,
> - outcomes,
> - findings,
> - corrections,
> - retries,
> - human interventions,
> - downstream rework,
> - routing behavior,
> - failure and stop behavior,
> - token, cost, or latency only when actually observable.
>
> Do not change agents, Skills, references, scripts, hooks, tests, models, effort, routing, generated output, or runtime behavior. Do not fix anything you discover.
>
> Do not infer missing telemetry. Mark unavailable measurements explicitly.
>
> Produce one concise behavioral-baseline report containing:
> 1. what was inspected,
> 2. what was actually observed,
> 3. what could not be measured,
> 4. representative fixtures/runs available for future A/B testing,
> 5. current known behavior by role,
> 6. current known failure cases,
> 7. missing baseline coverage,
> 8. which later experiments this baseline can support.
>
> If canonical/generated ownership is uncertain, record UNKNOWN and defer to Session A.
>
> Stop when the baseline report is complete. Do not implement any change.

## Session B output goal

This becomes the BEFORE side of later comparisons.

Example:

~~~text
BASELINE
current Planner prompt
current Skill structure
current model/effort
current run behavior

versus

TREATMENT
refactored Planner prompt
same model/effort
same ticket/snapshot
same evaluator
~~~

---

# Session C — Artifact and handoff efficiency

Use this prompt in a separate fresh Claude session:

> Read rstack-pipeline/evaluation-design/RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md.
>
> Analyze the actual approved .rstack/runs/<ticket>/ directories available in this workspace as evidence.
>
> The objective is to determine whether RSTACK is producing or rereading more Markdown/TXT artifacts, summaries, metadata, and handoff content than the engineering task requires.
>
> Measure and classify:
> - total artifact count,
> - Markdown/TXT artifact count,
> - total bytes,
> - bytes by artifact class,
> - large files,
> - exact duplicates,
> - repeated narrative,
> - repeated AC/ticket/plan content,
> - compatibility copies,
> - immutable evidence snapshots,
> - raw logs,
> - handoff payloads where observable,
> - completed audit/revision loops,
> - context/retrieval behavior where observable.
>
> Determine for each important artifact:
> - who writes it,
> - who reads it,
> - why it exists,
> - whether it must remain persistent,
> - whether the next agent needs the full content,
> - whether it could remain cold/on-demand,
> - whether it should be referenced instead of copied,
> - whether it is parser-required,
> - whether duplication is intentional for auditability,
> - whether it appears redundant.
>
> Keep this distinction explicit:
>
> PERSISTENT AUDIT EVIDENCE is not the same thing as HOT AGENT CONTEXT.
>
> Do not modify the pipeline, run artifacts, agents, Skills, schemas, tests, evidence, or artifact formats.
>
> Use real measurements where possible.
>
> Do not estimate unavailable token/credit usage and present it as observed.
>
> Produce the analysis deliverables required by RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md, grounded in the available real runs.
>
> Classify important artifacts using:
> - KEEP_HOT
> - KEEP_PERSISTENT
> - REFERENCE_ONLY
> - COMPRESS
> - CONTENT_ADDRESS
> - GENERATE_ON_DEMAND
> - MERGE_WITH_CANONICAL_OWNER
> - REMOVE
> - DEFER
> - UNKNOWN
>
> If canonical/generated ownership is uncertain, record UNKNOWN and defer to Session A.
>
> Stop before implementation.

## Session C output goal

Identify where the current artifact overhead comes from and distinguish:

~~~text
necessary durable evidence
from
unnecessary repeated generation
from
unnecessary repeated context loading
~~~

---

# Session D — Instruction architecture inventory

Use this prompt in a separate fresh Claude session:

> Read:
> - rstack-pipeline/evaluation-design/RSTACK-INSTRUCTION-ARCHITECTURE-HARDENING-GUIDE.md
> - rstack-pipeline/AGENT-MD-REFACTOR-GUIDANCE.md
>
> Perform an analysis-only inventory of the current RSTACK custom agents, Skills, reference files, global rules/instructions, hooks, scripts, and model configuration where relevant.
>
> For every significant instruction section, classify it as:
> - KEEP_LOCAL
> - MOVE_TO_SKILL
> - MOVE_TO_REFERENCE
> - MOVE_TO_SCRIPT_OR_HOOK
> - MOVE_TO_GLOBAL_RULE
> - MOVE_TO_HISTORY
> - DELETE_DUPLICATE
> - UNKNOWN
>
> Also classify each important decision or instruction as:
> - L0 deterministic
> - L1 constrained semantic
> - L2 full reasoning
> - HUMAN
>
> Identify:
> - oversized agent files,
> - oversized Skills,
> - references over about 100 lines without useful TOCs,
> - deep reference chains,
> - duplicated normative rules,
> - historical prose on the runtime path,
> - shared policy repeated across agents,
> - agent files carrying responsibilities owned by other roles,
> - objective rules that should probably become deterministic validators/hooks/scripts,
> - L2 reasoning roles that appear over-prescribed,
> - L1 outputs that could become more structured,
> - human-owned decisions that agents appear to be deciding.
>
> For every proposed move, identify:
> - current location,
> - proposed owner,
> - why it belongs there,
> - expected runtime loading behavior,
> - retrieval risk,
> - behavior risk,
> - test needed before moving it.
>
> Do not edit anything.
>
> Session A is establishing canonical/generated ownership. If you are unsure whether a file is canonical, generated, installed, or historical, classify authority as UNKNOWN.
>
> Do not refactor generated copies.
>
> Do not change model allocation or effort.
>
> Produce one concise instruction-architecture inventory containing:
> 1. file/section inventory,
> 2. degrees-of-freedom map,
> 3. progressive-disclosure problems,
> 4. TOC/navigation gaps,
> 5. deep-reference problems,
> 6. duplicated-rule map,
> 7. deterministic-control candidates,
> 8. role-locality violations,
> 9. recommended refactor candidates ordered by risk,
> 10. unresolved ownership questions for Session A.
>
> Stop after the analysis. Do not implement any refactor.

## Session D output goal

Answer:

~~~text
What belongs in an agent?
What belongs in a Skill?
What belongs in a reference?
What should become code?
What should become history/documentation?
What must remain a human decision?
~~~

---

# What Sessions B–D must not modify

Sessions B, C, and D must not independently modify:

- pipeline/SKILL.md,
- agent definitions,
- shared handoff contracts,
- write-boundary policy,
- approval policy,
- model configuration,
- generated outputs,
- hooks,
- validators,
- artifact schemas,
- routing rules,
- human-checkpoint behavior.

They are evidence-gathering sessions.

If they discover a needed shared change, record:

~~~text
SHARED CHANGE REQUEST
Concern:
Evidence:
Likely owner:
Risk:
Suggested future batch:
~~~

Do not implement it.

---

# Integration order after the parallel sessions finish

Converge the work in this order:

~~~text
Session A
canonical/generated ownership
        ↓
Session B
behavioral baseline
        ↓
Session C
artifact/handoff baseline
        ↓
Session D
instruction architecture inventory
        ↓
Human / architecture review
        ↓
Finish Batch 1
        ↓
Authorize Batch 2 only
~~~

Session A provides evidence for **where** future edits belong.

Sessions B–D provide evidence for **what** should later be improved.

---

# Conflict handling

If sessions disagree:

## Architecture disagreement

Session A investigates canonical source, generator, installation, and consumer evidence.

## Behavioral disagreement

Prefer observed run/test evidence over prose description.

## Artifact-purpose disagreement

Identify the actual producer and consumer before calling the artifact redundant.

## Instruction-ownership disagreement

Use this ownership rule:

~~~text
pipeline-wide rule → control-plane owner
role-specific procedure → role agent
reusable procedure → Skill
stable declarative contract → reference
objective rule → deterministic control
human-owned choice → human
history/rationale → docs or ADR
~~~

Do not resolve uncertainty by adding another duplicate rule.

---

# Final coordination principle

> **Parallel sessions may discover independently. They must not redesign shared runtime contracts independently.**

Safe parallel work:

~~~text
A — architecture ownership map
B — behavioral baseline
C — artifact/handoff analysis
D — instruction architecture inventory
~~~

Converge the evidence before any implementation batch begins.
