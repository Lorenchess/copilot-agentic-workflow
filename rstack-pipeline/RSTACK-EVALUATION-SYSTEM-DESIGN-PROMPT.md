# RSTACK Evaluation System Design Prompt

## Purpose

Use this prompt with Claude Code (or another capable repository-aware coding agent) to analyze the current RSTACK pipeline and design a rigorous, persistent evaluation system.

The goal is to stop treating agent Markdown files as the primary object of optimization and instead make every pipeline run produce structured evidence that can be used to measure, compare, and improve the system over time.

**This is a design task first. Do not implement the evaluation system during the first pass.**

The intended outcome is an evaluation architecture that supports:

- longitudinal pipeline improvement,
- regression detection,
- model comparisons,
- prompt comparisons,
- role/agent ablation,
- workflow comparisons,
- AI-as-judge evaluation,
- deterministic evaluation,
- human validation,
- cost and performance analysis where observable,
- and host portability across Copilot, Devspace, Bedrock, or future platforms.

---

# Execution instructions for Claude Code

Before doing any work:

1. Read this file completely.
2. Inspect the current RSTACK implementation in the repository. Do not answer from memory.
3. Treat existing RSTACK artifacts, references, scripts, hooks, and run-state files as the starting point.
4. Produce the requested evaluation-design documents only.
5. Do **not** modify operational agents, pipeline behavior, scripts, hooks, or runtime code during this pass.
6. Do **not** "fine tune" agent Markdown as a side effect of evaluation design.
7. Do **not** add a new evaluation agent unless later evidence proves one is necessary.
8. Stop after the design artifacts are complete and return them for human review.
9. Wait for explicit approval before implementing the evaluation system.

The required working sequence is:

```text
INSPECT CURRENT SYSTEM
        ↓
INVENTORY EXISTING DATA
        ↓
DEFINE DECISIONS THE EVALUATION MUST SUPPORT
        ↓
DEFINE METRICS
        ↓
DEFINE MINIMAL ARTIFACTS
        ↓
DEFINE EVALUATION RUBRICS
        ↓
DEFINE EXPERIMENTS
        ↓
CHALLENGE THE DESIGN
        ↓
STOP FOR REVIEW
```

Do not start with dashboards, telemetry code, schemas, graders, or prompt rewrites.

## Additional guardrails

- **Reuse before adding.** Before proposing a new artifact, field, event, or schema, identify whether the information already exists and who currently owns it.
- **Every metric must support a decision.** If a metric does not help choose between pipeline alternatives or detect a meaningful regression, reject it.
- **Every artifact must have a consumer.** Define who writes it, who reads it, what decision it supports, and whether it is mutable.
- **Separate evidence types.** Keep deterministic observations, AI-judge judgments, human labels, and unknowns distinct.
- **AI judge output is not ground truth.** Preserve the original judgment even when a later human label disagrees.
- **Do not optimize for passing.** Fewer findings, faster runs, shorter prompts, fewer agents, or higher judge scores are not automatically improvements.
- **Preserve host portability.** GitHub Copilot is the current host, not the canonical evaluation architecture.
- **No hidden reasoning telemetry.** Persist observable events, artifacts, classifications, and evidence—not private chain-of-thought.

# Prompt for Claude Code

You are acting as a senior AI systems architect, evaluation engineer, and software-delivery observability engineer.

Your task is **NOT** to optimize, rewrite, expand, or "fine tune" the current RSTACK agent Markdown files.

Your task is to inspect the current RSTACK pipeline and design a rigorous, persistent evaluation system that allows us to measure whether future changes to agents, prompts, models, routing, tools, workflow rules, and host implementations actually improve the system.

This work is **architecture and evaluation design first**.

Do not modify production RSTACK behavior yet.

Do not add new agents merely to perform evaluation.

Do not assume that more instructions improve agent quality.

The goal is to turn every RSTACK execution into structured evidence that can later be aggregated into an evaluation dataset.

---

# Context

RSTACK is intended to support an AI software factory from Jira issue to pull request.

The current conceptual pipeline includes roles such as:

- Orchestrator
- Planner
- Plan Auditor
- Tester
- Developer
- Reviewer-Architect
- Approval / publication stage

The system currently runs primarily through GitHub Copilot custom agents, skills, scripts, references, hooks, and host capabilities.

Other environments may eventually host the same pipeline, including:

- an internally managed Claude Code / Devspace environment,
- AWS Bedrock,
- or future enterprise AI platforms.

Therefore the evaluation model must be as host-independent as practical.

RSTACK already contains concepts such as:

- acceptance criteria,
- run artifacts,
- candidate identity,
- evidence,
- verification,
- independent review,
- human approval,
- freshness and invalidation,
- role-specific write boundaries,
- run logs,
- provenance,
- risk tiers,
- test locks,
- and workflow state.

Do **not** replace or duplicate these concepts blindly.

First determine what already exists, where it is owned, how it is persisted, and whether it is reliable enough to reuse.

---

# Primary objective

Design a system where every completed, blocked, failed, or partially completed RSTACK run provides sufficient persistent evidence to answer:

1. Did the pipeline accomplish the requested engineering task?
2. Which phase introduced mistakes?
3. Which later phase detected them?
4. Were those detections correct?
5. How much rework occurred?
6. Which agents, models, prompts, skills, references, scripts, and host configuration were involved?
7. How much time and AI activity did the task require?
8. How much human intervention was required?
9. Which pipeline rules actually contributed measurable value?
10. Did a change to RSTACK measurably improve quality, efficiency, reliability, cost, or human effort?
11. Which failures recur across runs?
12. Which failures are specific to a model, role, prompt, host, or pipeline version?
13. Which stages provide little marginal value and may be candidates for simplification?
14. Which controls are prompt-only versus deterministically enforced?

The resulting system must support:

- regression evaluation,
- A/B comparisons,
- model comparisons,
- prompt comparisons,
- role ablation,
- workflow comparisons,
- longitudinal improvement analysis,
- and evidence-backed decisions about whether to keep, revert, or modify pipeline changes.

---

# Critical design principle

Separate four different things.

## 1. Operational state

What RSTACK needs in order to execute the current run.

Examples:

- current phase,
- active repository,
- current candidate,
- acceptance criteria,
- current test state,
- approval state,
- current owner,
- current blocker.

## 2. Execution trace

What actually happened.

Examples:

- phase started,
- agent invoked,
- tool called,
- artifact created,
- gate executed,
- handoff occurred,
- human intervention occurred,
- phase repeated,
- candidate changed,
- evidence invalidated,
- external action attempted,
- run blocked.

## 3. Evaluation evidence

Information used later to judge quality.

Examples:

- planner claims,
- auditor findings,
- test proof,
- reviewer findings,
- human corrections,
- final run outcome,
- escaped defects,
- evaluator judgments.

## 4. Aggregate evaluation dataset

Normalized information collected across many runs.

This dataset should allow cross-run analysis and experimentation.

Do not collapse all four into one giant run file.

---

# Required working method

Follow this order:

```text
INSPECT
   ↓
INVENTORY CURRENT DATA
   ↓
DEFINE QUESTIONS
   ↓
DEFINE METRICS
   ↓
DEFINE MINIMAL ARTIFACTS
   ↓
DEFINE EVALUATION RUBRICS
   ↓
DESIGN EXPERIMENTS
   ↓
CHALLENGE THE DESIGN
   ↓
ONLY THEN PROPOSE IMPLEMENTATION
```

Do **not** begin by creating telemetry code, dashboards, schemas, evaluators, or new agent files.

Do **not** modify operational agent prompts in this task.

---

# Task 1 — Inventory the existing system

Inspect the actual repository.

Identify:

- current agents,
- pipeline skill,
- references,
- scripts,
- hooks,
- `.rstack` artifact formats,
- existing metrics,
- existing run logs,
- existing candidate tracking,
- existing AC tracking,
- existing review artifacts,
- existing evaluation/evidence mechanisms,
- existing provenance labels,
- existing host-observed information,
- existing test-lock or gate artifacts,
- existing human-decision artifacts,
- existing publication records.

Create an inventory table:

| Concern | Existing artifact/mechanism | Canonical owner | Persisted? | Machine-readable? | Provenance | Missing information |
|---|---|---|---|---|---|---|

Do not create a duplicate artifact for information that already has a reliable canonical owner.

Explicitly identify:

- duplicated information,
- conflicting ownership,
- prose-only claims presented as stronger guarantees,
- host-dependent assumptions,
- information that exists but is not machine-readable,
- information that is machine-readable but not durable,
- information that cannot currently be observed.

---

# Task 2 — Design the minimum persistent run identity

Every run should have an immutable identifier.

Design a minimal run manifest containing only information required to:

- reproduce the evaluation subject,
- compare runs,
- bind evidence to a specific execution,
- and identify configuration differences.

Consider fields such as:

- run ID,
- work-item / Jira identifier,
- repository,
- branch,
- starting revision,
- final candidate revision,
- host,
- pipeline version,
- agent configuration version,
- model assigned to each role,
- start/end timestamps,
- final run outcome,
- evaluator configuration version.

Do not invent values the host cannot actually provide.

Every field must have provenance.

Prefer the current RSTACK provenance vocabulary if it already exists.

Potential provenance classes may include:

- HOST_OBSERVED
- TOOL_OBSERVED
- DETERMINISTIC
- AGENT_REPORTED
- HUMAN_RECORDED
- UNKNOWN

Do not introduce a new vocabulary unless the existing one is insufficient.

---

# Task 3 — Design an append-only event / trace model

Determine whether RSTACK should persist a structured append-only event trace per run.

Potential event categories may include:

- RUN_STARTED
- RUN_COMPLETED
- RUN_FAILED
- RUN_BLOCKED
- PHASE_STARTED
- PHASE_COMPLETED
- AGENT_STARTED
- AGENT_COMPLETED
- TOOL_REQUESTED
- TOOL_COMPLETED
- ARTIFACT_CREATED
- GATE_EXECUTED
- HANDOFF
- HUMAN_QUESTION
- HUMAN_DECISION
- LOOP_STARTED
- LOOP_COMPLETED
- CANDIDATE_CHANGED
- EVIDENCE_INVALIDATED
- EXTERNAL_ACTION_ATTEMPTED
- EXTERNAL_ACTION_RECONCILED
- REVIEW_INVALIDATED
- APPROVAL_REQUESTED
- APPROVAL_RESOLVED

Do not blindly adopt these names.

Determine what is actually useful for RSTACK.

Prefer an append-friendly and machine-readable representation such as JSONL if appropriate.

The trace must describe **observable facts**.

Do not persist hidden reasoning or chain-of-thought as telemetry.

Do not use narrative agent summaries as a substitute for events that can be deterministically observed.

---

# Task 4 — Establish evaluation dimensions

Design metrics around at least the following dimensions.

## A. Task correctness

Possible signals:

- AC satisfied,
- final human acceptance,
- CI success,
- final review outcome,
- PR acceptance/rejection,
- escaped defect,
- post-merge regression,
- rollback/revert if available.

Be precise about what can actually be measured.

Do not call something "correct" merely because tests are green.

---

## B. Planning quality

Determine whether the Planner:

- identified the relevant scope,
- grounded material claims,
- distinguished fact from assumption,
- captured all acceptance criteria,
- identified missing decisions,
- proposed verifiable work,
- avoided unsupported negative claims,
- traced behavior far enough to justify consequential conclusions.

Potential measurements:

- material planner claims,
- claims later contradicted,
- claims later marked unsupported,
- material omissions found by Auditor,
- scope errors,
- plan revisions required,
- downstream defects attributable to planning,
- unresolved assumptions at handoff.

Design a structured relationship between:

```text
Planner claim
→ Planner evidence
→ Auditor finding
→ Resolution
→ Human validation when available
```

---

## C. Plan Auditor quality

The Auditor must not be rewarded simply for disagreeing.

Findings should eventually be classifiable as:

- TRUE_POSITIVE
- FALSE_POSITIVE
- DUPLICATE
- NON_MATERIAL
- UNRESOLVED

Also distinguish finding type:

- CONTRADICTION
- UNSUPPORTED_CLAIM
- MATERIAL_OMISSION
- SCOPE_ERROR
- REQUIREMENT_ERROR
- DESIGN_DISAGREEMENT
- SNAPSHOT_MISMATCH
- EVIDENCE_SCOPE_ERROR

Do not claim recall unless sufficient ground truth exists to calculate it.

Potential valid statistics:

- confirmed material findings per run,
- false-positive rate,
- percentage of material planner claims requiring correction,
- audit-induced plan changes,
- downstream planning defects missed by Auditor,
- time/cost added by audit,
- rework prevented after audit.

---

## D. Tester quality

Evaluate whether tests actually discriminate correct and incorrect behavior.

Potential signals:

- tests created,
- initially failing tests,
- tests that unexpectedly passed before implementation,
- tests modified after implementation,
- tests weakened,
- assertions added/removed,
- skip markers changed,
- AC-to-test mapping,
- later Reviewer defects not caught by tests,
- production bugs escaping tests,
- test-lock violations.

Do not equate number of tests with test quality.

---

## E. Developer quality

Potential signals:

- implementation loops,
- red-to-green iterations,
- files changed,
- out-of-scope changes,
- unnecessary changes,
- forbidden test modifications attempted,
- reviewer changes requested,
- regressions introduced,
- successful first implementation,
- candidate invalidations.

Avoid rewarding small diffs blindly if a larger change was required.

---

## F. Reviewer quality

Reviewer findings should be tracked similarly to Auditor findings.

Possible classifications:

- TRUE_POSITIVE
- FALSE_POSITIVE
- DUPLICATE
- NON_MATERIAL
- UNRESOLVED

Possible types:

- requirement defect,
- logic defect,
- test gap,
- regression,
- maintainability risk,
- architecture risk,
- security issue,
- evidence deficiency,
- stale-candidate issue,
- scope violation.

Track whether a Reviewer finding causes:

- Developer correction,
- Tester correction,
- Planner correction,
- Human decision,
- No change.

Track whether later defects indicate Reviewer misses.

---

## G. Workflow efficiency

Potential measurements:

- total elapsed time,
- phase elapsed time,
- number of loops,
- number of agent invocations,
- number of tool calls,
- number of retries,
- number of human interruptions,
- blocked time,
- number of phase transitions,
- number of context restarts,
- number of candidate invalidations.

Only measure token counts or monetary cost when the host provides them reliably.

Never estimate cost and label it observed.

---

## H. Reliability

Potential signals:

- stale evidence incident,
- candidate mismatch,
- artifact schema failure,
- unknown external action,
- failed resume,
- duplicated external effect,
- wrong-repository write,
- missing required artifact,
- invalid phase transition,
- stale review,
- stale verification,
- incorrect authorization binding,
- unresolved publication outcome.

Prefer deterministic measurement where possible.

---

## I. Human effort

Potential metrics:

- clarification questions,
- approvals,
- corrections,
- overrides,
- manual repairs,
- human review minutes where measurable,
- human rejection of AI findings,
- human reclassification of findings.

Human intervention is not automatically bad.

Separate:

```text
NECESSARY HUMAN DECISION
```

from:

```text
PIPELINE FAILURE REQUIRING HUMAN REPAIR
```

---

# Task 5 — Design the minimal run-level artifact set

Propose the smallest practical artifact set.

A conceptual shape might resemble:

```text
.rstack/runs/<RUN_ID>/
    manifest.json
    events.jsonl
    metrics.json
    evaluation/
    artifacts/
```

Do not adopt this blindly.

Reuse current artifacts where appropriate.

For every proposed artifact document:

- purpose,
- writer,
- reader,
- mutability,
- schema,
- canonical owner,
- retention need,
- required/optional status,
- provenance,
- host portability.

Avoid artifact proliferation.

Prefer one normalized record over five overlapping files.

---

# Task 6 — Design evaluator layers

The evaluation system must distinguish three layers.

## Layer 1 — deterministic evaluation

Examples:

- required artifact present,
- candidate matches,
- schema valid,
- required test executed,
- illegal path changed,
- phase transition legal,
- review freshness valid,
- evidence bound to current candidate,
- test lock unchanged,
- release gate complete.

These should not require an LLM judge.

---

## Layer 2 — AI-as-judge semantic evaluation

Examples:

- did the plan cover the requirement?
- was a Planner claim actually supported?
- was an Auditor finding actually supported?
- did the test meaningfully prove an AC?
- did the Reviewer identify a real issue?
- was a finding material?

Design structured rubrics.

Avoid vague scoring such as:

```text
quality = 8/10
```

Prefer evidence-backed categorical judgments.

Every AI-judge result should include:

- subject being judged,
- rubric,
- evidence inspected,
- classification,
- confidence if useful,
- explanation,
- evaluator model/version,
- evaluator configuration/version,
- timestamp,
- provenance.

AI judge output is evidence, **not ground truth**.

Preserve original judge outputs even when later overridden.

---

## Layer 3 — human validation

Design a sampling strategy.

Humans should not need to inspect every run.

Potential triggers:

- AI judges disagree,
- high-risk task,
- new failure category,
- evaluator uncertainty,
- model/config experiment,
- randomly sampled normal run,
- suspected regression,
- high-materiality finding,
- repeated false-positive pattern.

Human labels should be able to validate or override AI-judge classifications.

Do not overwrite the original AI judgment.

Persist both.

---

# Task 7 — Design a persistent evaluation dataset

Determine how run artifacts become normalized evaluation records.

The dataset should support future questions such as:

- Does Opus outperform Sonnet as Planner?
- Does a cross-model Auditor improve finding quality?
- Does independent Tester improve escaped-defect rate?
- Does fresh-context Reviewer find more real defects?
- Does removing Plan Auditor increase downstream rework?
- Did prompt version X improve planning accuracy?
- Which failures happen most frequently?
- Which role causes the most rework?
- Which host produces the most missing telemetry?
- Which pipeline versions introduce regressions?

Potential record types may include:

- PLANNER_CLAIM
- AUDITOR_FINDING
- TEST_PROOF
- DEVELOPER_ITERATION
- REVIEWER_FINDING
- HUMAN_DECISION
- RUN_OUTCOME

Do not create these record types unless analysis shows they provide real value.

Prefer stable normalized records that can survive host changes.

---

# Task 8 — Version everything needed for comparison

An evaluation is meaningless if we cannot identify what produced the output.

Determine how to persist:

- pipeline version,
- agent file hash/version,
- relevant reference/skill versions,
- script/gate versions,
- model name,
- model provider,
- host,
- host version if available,
- evaluator version,
- rubric version,
- repository candidate,
- ticket revision if applicable,
- experiment ID if applicable.

Avoid copying complete Markdown prompts into every run when reproducible hashes/version identifiers are sufficient.

If a referenced configuration is not durably recoverable later, explain whether a snapshot is required.

---

# Task 9 — Design experiment support

The evaluation system must support controlled experiments.

Examples:

## Planner
Sonnet vs Opus

## Auditor
same-model-family vs cross-model-family

## Workflow
with Plan Auditor vs without Plan Auditor

## Tester
independent Tester vs Developer-written tests

## Reviewer
fresh context vs inherited context

## Prompt
current agent prompt vs refactored prompt

For each experiment define:

- hypothesis,
- independent variable,
- controlled variables,
- population/tasks,
- inclusion/exclusion rules,
- success metrics,
- failure metrics,
- stopping criteria,
- sample-size guidance,
- human review strategy,
- interpretation risks.

Do not use pass rate alone as the optimization target.

A pipeline can game pass rate by becoming less critical.

---

# Task 10 — Identify anti-metrics and Goodhart risks

Explicitly document metrics that can mislead us.

Examples:

- fewer Auditor findings,
- more Auditor findings,
- fewer Reviewer findings,
- shorter prompt,
- fewer agent calls,
- smaller diff,
- faster run,
- higher AI-judge score,
- fewer human interventions,
- more automated actions.

None of these is inherently good.

For each metric identify:

- how it could be gamed,
- what paired metric is needed,
- whether it should be diagnostic rather than a KPI.

---

# Task 11 — Design dashboards only after metrics

Do not start by designing a dashboard.

First establish:

- what is measurable,
- what is trustworthy,
- what decisions the metric supports.

Afterward propose a minimal dashboard.

Possible top-level categories:

- QUALITY
- RELIABILITY
- EFFICIENCY
- HUMAN EFFORT
- COST

Possible trends:

- material defects caught before implementation,
- material defects caught after implementation,
- false-positive rate by evaluator,
- average rework loops,
- human repair interventions,
- stale-evidence incidents,
- cost per completed ticket where observable,
- elapsed time per completed ticket,
- escaped defects,
- audit/review marginal value.

Do not display a metric merely because it is easy to collect.

---

# Task 12 — Evaluate current host limitations

Because RSTACK currently runs in GitHub Copilot and may later run in Devspace or Bedrock, determine which telemetry is:

- OBSERVABLE
- PARTIALLY_OBSERVABLE
- NOT_OBSERVABLE
- HOST_DEPENDENT

Examples:

- exact token counts,
- model invocation timing,
- subagent identity,
- fresh-context guarantee,
- tool calls,
- filesystem changes,
- human approvals,
- model name,
- cost,
- prompt text,
- host authorization result.

Do not fabricate telemetry the host does not expose.

Design the canonical evaluation model so future host adapters can provide richer telemetry without changing the core record structure.

---

# Task 13 — Propose a staged implementation

Do not instrument everything immediately.

Propose an evidence-driven staged rollout.

A likely shape may be:

## Phase 1
- run identity,
- configuration fingerprint,
- phase timings,
- transition trace,
- existing artifact indexing.

## Phase 2
- Planner claim / Auditor finding linkage,
- Reviewer finding classification,
- human validation.

## Phase 3
- test proof metrics,
- Developer iteration metrics,
- reliability metrics.

## Phase 4
- cross-run dataset,
- experiment tooling,
- minimal dashboard.

But inspect the current repository and propose the actual sequence.

Prioritize information that will help us decide whether pipeline changes improve quality.

---

# First deep evaluation vertical

Unless repository evidence suggests otherwise, prioritize the Planner → Plan Auditor relationship as the first semantic evaluation vertical.

We have observed an important recurring pattern:

- Planner creates a plausible plan,
- Auditor independently checks it,
- Auditor often finds unsupported assumptions, contradictions, omissions, or scope errors,
- the current process lacks a durable normalized dataset describing these disagreements and their eventual resolution.

Design a structure that can persist:

```text
Planner claim
→ evidence cited by Planner
→ Auditor classification
→ Auditor evidence
→ materiality
→ plan changed or not
→ later outcome
→ human validation when available
```

A conceptual record might contain fields such as:

```json
{
  "claim_id": "PC-07",
  "planner_claim": "No existing callers depend on method X",
  "planner_evidence": ["..."],
  "audit_result": "CONTRADICTED",
  "auditor_evidence": ["..."],
  "materiality": "HIGH",
  "resolution": "PLAN_CHANGED",
  "human_validation": "AUDITOR_CORRECT"
}
```

Do not copy this schema blindly.

Derive the actual schema from the current artifacts and workflow.

The objective is to eventually support questions such as:

- Which Planner failure modes occur most often?
- Which claims are most likely to be wrong?
- Which Auditor finding types are most valuable?
- What is the Auditor false-positive rate?
- Does a different Planner model reduce material corrections?
- Does a different Auditor model improve true-positive findings?
- How much rework does audit prevent?

---

# Required deliverables

Create **analysis/design documents only**.

Do not modify operational agent prompts or pipeline behavior during this task.

Produce:

## 1. `RSTACK-EVALUATION-SYSTEM-DESIGN.md`

Include:

- current-state inventory,
- proposed architecture,
- data flow,
- evaluation layers,
- canonical ownership,
- host portability,
- staged roadmap.

## 2. `RSTACK-RUN-ARTIFACT-MODEL.md`

Define:

- minimal persistent artifacts,
- schemas,
- ownership,
- lifecycle,
- mutability,
- provenance,
- retention guidance.

## 3. `RSTACK-METRICS-CATALOG.md`

For every metric include:

- metric name,
- question it answers,
- formula,
- source,
- provenance,
- unit,
- aggregation,
- interpretation,
- known limitations,
- Goodhart risk.

## 4. `RSTACK-EVALUATION-RUBRICS.md`

Define structured rubrics for:

- Planner,
- Plan Auditor,
- Tester,
- Developer,
- Reviewer,
- overall run.

Avoid generic numeric scoring where categorical evidence-backed judgment is more meaningful.

## 5. `RSTACK-EXPERIMENT-PLAYBOOK.md`

Define how we conduct:

- model comparisons,
- prompt comparisons,
- agent ablations,
- workflow experiments.

Include how results become accepted evidence for changing RSTACK.

## 6. `RSTACK-EVALUATION-IMPLEMENTATION-PLAN.md`

Provide a minimal staged implementation plan.

For every proposed code/artifact change state:

- why it is needed,
- what decision it enables,
- complexity,
- risk,
- dependency,
- portability across Copilot / Devspace / Bedrock.

---

# Constraints

1. Do not optimize for more telemetry. Optimize for information that supports decisions.
2. Do not create dozens of new artifacts. Prefer compact normalized records.
3. Do not use LLM judges for deterministic questions.
4. Do not treat LLM judge output as ground truth.
5. Do not require humans to inspect every run.
6. Do not assume current Copilot telemetry exists unless verified.
7. Do not estimate unavailable data and present it as observed.
8. Do not rewrite agent Markdown in this task.
9. Do not introduce a new agent merely for evaluation.
10. Do not design around Claude Code specifically.
11. Preserve host portability.
12. Reuse existing RSTACK artifacts and concepts wherever they already provide the necessary information.
13. Every proposed metric must answer a concrete engineering decision.
14. Every proposed artifact must have a defined reader and purpose.
15. Every new persistent field must have provenance.
16. Do not persist hidden chain-of-thought.
17. Do not treat narrative self-report as stronger than host/tool/deterministic evidence.
18. Do not silently change canonical ownership.
19. Do not expand prompts merely because evaluation discovered a failure.
20. A discovered failure should first be classified by root cause: prompt, context, tool, state, deterministic control, host limitation, model capability, evaluator weakness, or human decision.

---

# Required final self-review

Before completing the design, challenge your own proposal.

Identify:

- telemetry that is expensive but low value,
- duplicated artifacts,
- metrics that can be gamed,
- evaluator bias,
- missing ground truth,
- host-specific assumptions,
- privacy/security concerns,
- retention concerns,
- information that cannot actually be observed,
- complexity that should be deferred,
- anything that would create another oversized specification without improving measurement.

Then provide three explicit sections:

## KEEP NOW

Capabilities justified for the first implementation.

## DEFER

Capabilities that may become useful later but do not yet have enough evidence.

## REJECT

Capabilities that add complexity without enough decision value.

---

# Key architectural question

Continuously ask:

> What information would we wish we had six months from now when deciding whether a specific RSTACK change actually improved the pipeline?

Design for that question.

---

# Success condition

The desired result is **not** a large observability framework.

The desired result is a small, rigorous evaluation foundation that lets us move from:

```text
"this prompt looks better"
```

to:

```text
"this pipeline change reduced confirmed planning defects,
did not increase Auditor false positives,
reduced downstream rework,
and did so at an acceptable cost and latency."
```

Only after the design has been reviewed and accepted should implementation begin.


---

# Mandatory stop condition

Once the six required design documents are complete, **STOP**.

Do not:

- implement the proposed schemas,
- add instrumentation,
- modify RSTACK agents,
- modify the pipeline skill,
- change hooks or scripts,
- alter runtime behavior,
- add dashboards,
- or begin prompt refactoring.

Return a concise completion report containing:

1. files created,
2. major architectural recommendations,
3. the proposed first implementation slice,
4. unresolved design questions,
5. assumptions that require host validation,
6. items classified as KEEP NOW / DEFER / REJECT.

Wait for explicit human approval before any implementation work begins.
