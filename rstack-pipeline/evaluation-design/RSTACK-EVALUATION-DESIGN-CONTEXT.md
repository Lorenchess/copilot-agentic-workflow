# RSTACK Evaluation Design Context

## Status

This document is **evaluation-design context**, not an active RSTACK operating contract.

The active V2 refactoring reference is currently `rstack-pipeline/claude-v2.2/`. The repository README states that this reference has passed static contract review, while workplace implementation and validation remain pending. Evaluation design must therefore distinguish:

1. what the V2 reference says should happen,
2. what the workplace implementation actually does,
3. what the current host can observe or enforce,
4. and what an evaluator merely infers.

Do not collapse those into one truth source.

## Why this exists

RSTACK is moving from prompt-centric improvement toward evidence-centric improvement.

The evaluation system should make it possible to decide whether a change to:

- an agent prompt,
- a model assignment,
- a skill or reference,
- a deterministic guard,
- a workflow transition,
- a host adapter,
- or an approval mechanism

actually improved the system.

The system should not be optimized by repeatedly expanding Markdown files because a run exposed another edge case.

## Primary design question

Continuously ask:

> What information would we wish we had six months from now when deciding whether a specific RSTACK change actually improved the pipeline?

The evaluation architecture should be designed around that question.

## Decisions the evaluation system must support

The system should eventually provide evidence for questions such as:

- Which Planner failure modes recur most often?
- Which Plan Auditor findings are valid, invalid, or non-material?
- Does a stronger Planner reduce downstream rework?
- Does cross-model auditing improve useful findings or only disagreement?
- Does an independent Tester improve proof quality?
- Does fresh-context review find defects that inherited-context review misses?
- Which deterministic controls prevent real failures?
- Which agent stages add measurable marginal value?
- Which stages create cost or latency without enough quality benefit?
- Which failures are host limitations rather than prompt failures?
- Which changes should be KEPT, REVERTED, or remain INCONCLUSIVE?

## Non-goals

The first evaluation-system design pass must not:

- rewrite operational agent Markdown,
- add a new evaluation agent by default,
- create a dashboard before metrics are justified,
- collect every observable event merely because it is available,
- invent telemetry the host does not expose,
- treat AI-judge output as ground truth,
- encode employer-specific policy that has not been supplied,
- or redesign RSTACK architecture without evidence.

## Architecture principles

### 1. Runs become evidence

Each run should leave behind enough structured information to reconstruct:

- what configuration ran,
- what phases occurred,
- what artifacts were produced,
- what claims/findings mattered,
- what changed after critique,
- what human decisions occurred,
- and how the run ended.

### 2. Keep four layers separate

#### Operational state
Information needed to execute the current run.

#### Execution trace
Observable events describing what happened.

#### Evaluation evidence
Artifacts and labels used to assess quality.

#### Aggregate dataset
Normalized records used across many runs.

Do not create one giant file that mixes all four.

### 3. Deterministic facts outrank narrative self-report

When the same fact can be established by a host event, tool result, deterministic script, or repository read, do not rely on an agent summary as the primary evidence.

### 4. Semantic evaluation remains evidence, not truth

AI-as-judge can help classify planning quality, finding validity, test adequacy, and review quality. Those judgments must remain attributable to:

- evaluator model,
- evaluator configuration,
- rubric version,
- evidence inspected,
- and later human validation when present.

### 5. Preserve unknowns

Missing telemetry is not permission to infer a value.

Use explicit unknown/host-dependent states.

### 6. Optimize for decision value

Every metric should answer a concrete engineering decision.

Every artifact should have:

- a writer,
- a reader,
- a lifecycle,
- a consumer,
- and a reason to persist.

### 7. Host portability

GitHub Copilot is the current host implementation, not the canonical evaluation architecture.

The design should survive migration to Devspace, Bedrock, or another enterprise runtime by changing host adapters rather than changing evaluation semantics.

### 8. Minimize hot-path context

Evaluation metadata should not automatically become agent prompt content.

The evaluation system is primarily for measurement and analysis, not another source of runtime instructions.

## First semantic vertical

Prioritize Planner → Plan Auditor unless repository evidence demonstrates a higher-value first target.

The first vertical should make it possible to persist and later analyze:

```text
Planner claim
→ Planner evidence
→ Auditor finding
→ Auditor evidence
→ finding type
→ materiality
→ resolution
→ downstream outcome
→ human validation when available
```

This vertical is useful because it can distinguish:

- a Planner that makes unsupported assumptions,
- an Auditor that discovers real problems,
- an Auditor that merely disagrees,
- a snapshot mismatch,
- and a plan that changed for unrelated reasons.

## Evidence sources Claude should inspect before designing

At minimum inspect:

- `rstack-pipeline/README.md`
- `rstack-pipeline/claude-v2.2/README.md`
- `rstack-pipeline/claude-v2.2/OPEN-DECISIONS.md`
- `rstack-pipeline/claude-v2.2/SOURCE-EVIDENCE.md`
- `rstack-pipeline/claude-v2.2/pipeline/`
- `rstack-pipeline/claude-v2.2/agents/`
- `rstack-pipeline/claude-v2.2/skills/`
- `rstack-pipeline/claude-v2.2/hooks/`
- `rstack-pipeline/claude-v2.2/references/discovery-cost.md`
- `rstack-pipeline/claude-v2.2/references/handoff-contracts.md`
- `rstack-pipeline/claude-v2.2/references/harness-map.md`
- `rstack-pipeline/claude-v2.2/references/approvals.md`
- `rstack-pipeline/claude-v2.2/references/team-adoption.md`
- `rstack-pipeline/claude-v2.2/references/write-boundaries.md`
- `rstack-pipeline/RSTACK-EVALUATION-SYSTEM-DESIGN-PROMPT.md`

Do not assume every historical root-level design file is still authoritative. The repository README identifies the current V2 source.

## Evidence-strength discipline

Use the existing RSTACK provenance vocabulary where possible.

Do not silently upgrade:

- AGENT_REPORTED → HOST_OBSERVED,
- HUMAN_RECORDED → authenticated authorization,
- reference contract → observed runtime behavior,
- static source path → executed behavior,
- AI judgment → ground truth.

If mixed evidence supports a conclusion, preserve the contributing provenance rather than pretending one simple label fully captures it.

## Security and data-handling constraint

This GitHub repository is public.

Do not place employer source code, Jira content, internal repository names, credentials, proprietary screenshots, internal URLs, production traces, or other confidential workplace data into this evaluation-design folder.

The public repository should contain:

- schemas,
- templates,
- synthetic examples,
- sanitized examples,
- and design guidance.

Real workplace evaluation data should remain in an approved internal storage location unless explicitly cleared for public release.

## Desired result

The evaluation system should allow RSTACK improvement to move from:

> "the revised prompt looks more robust"

to statements such as:

> "the treatment reduced confirmed material planning corrections without increasing Auditor false positives, while downstream rework and human repair effort also decreased."

That requires persistent data, calibrated labels, controlled comparisons, and explicit uncertainty.
