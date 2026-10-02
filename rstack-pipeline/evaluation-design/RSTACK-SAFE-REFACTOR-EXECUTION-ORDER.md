# RSTACK Safe Refactor Execution Order

**Status:** Execution guidance for refactoring RSTACK safely in small, reviewable batches.

**Purpose:** Define the exact order in which Claude 5 should analyze and later refactor the RSTACK repository, instructions, generated outputs, Skills, agents, references, validators, and architecture without breaking the currently working system.

This document coordinates these existing guides:

- RSTACK-REPOSITORY-ARCHITECTURE-REFACTOR-GUIDE.md
- RSTACK-INSTRUCTION-ARCHITECTURE-HARDENING-GUIDE.md
- RSTACK-INSTRUCTION-ARCHITECTURE-EVAL-PLAN.md
- ../AGENT-MD-REFACTOR-GUIDANCE.md
- RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md
- RSTACK-DECISION-LAYER-EFFICIENCY-AUDIT.md

It does not replace any of them.

> **Map first. Measure second. Clarify ownership third. Refactor one concern at a time. Test after every batch. Move the repository physically only after behavior is stable and reproducible.**

Do not perform a big cleanup.

---

# 1. Why order matters

RSTACK currently has several kinds of change in flight:

- repository restructuring,
- agent-prompt reduction,
- Skill progressive disclosure,
- reference-file cleanup,
- generated Copilot and Claude packaging,
- Planner-Auditor workflow changes,
- model and effort experiments,
- evaluation-system implementation,
- artifact and handoff reduction,
- deterministic hardening.

Each can be valid independently.

Doing them together creates a diagnostic problem:

~~~text
regression
  ↓
Was it caused by:
- a file move?
- prompt reduction?
- the wrong generated copy?
- Skill discovery?
- model change?
- effort change?
- routing change?
- schema change?
- validator behavior?
- reference loading?
~~~

The refactor must be staged so each regression has a small search space.

---

# 2. Non-negotiable batching rules

## Rule 1 — one primary variable per batch

A batch should primarily change only one class of concern:

- structure,
- instruction wording,
- model,
- effort,
- routing,
- artifact format,
- deterministic enforcement.

If two changes are inseparable for correctness, document that coupling before implementation and repeat a later isolated evaluation where practical.

## Rule 2 — know the canonical owner before editing

Do not refactor a file until Claude can answer:

~~~text
CANONICAL SOURCE:
GENERATED COPIES:
GENERATOR:
INSTALL DESTINATIONS:
CONSUMERS:
TESTS:
~~~

If a required answer is UNKNOWN, stop and resolve it first.

## Rule 3 — never start from generated output

Do not begin by manually simplifying generated, .github, copilot-agents, or installed Claude output unless repository evidence proves that path is canonical.

Change canonical source first, then regenerate through the supported process.

## Rule 4 — every batch has a baseline

Before changing anything, record:

- current source SHA,
- relevant file sizes,
- current tests,
- model and effort,
- host,
- known warnings and failures,
- generated hashes where relevant.

## Rule 5 — every batch has rollback

Before implementation state:

~~~text
ROLLBACK:
- exact files
- exact source commit
- regeneration command
- state or data migration impact
~~~

## Rule 6 — no hidden cleanup

Do not opportunistically:

- rename unrelated files,
- reformat unrelated Markdown,
- change models,
- change effort,
- rewrite unrelated examples,
- fix unrelated warnings,
- regenerate unrelated packages.

Record those as follow-up work.

---

# 3. Changes that must not be combined casually

| Change A | Do not combine with | Reason |
|---|---|---|
| Prompt or agent refactor | Model change | Behavior difference cannot be attributed |
| Prompt or agent refactor | Effort change | Reasoning difference cannot be attributed |
| Repository path move | Workflow or routing change | Loading failures become ambiguous |
| Skill split | Model allocation change | Retrieval and model effects are confounded |
| Artifact schema change | Artifact-volume optimization | Parser failure and efficiency are confounded |
| Human-checkpoint policy | Prompt reduction | Workflow and reasoning change together |
| Generated-layout change | Agent behavior change | Packaging defect can look like prompt defect |
| Validator introduction | Immediate removal of all semantic fallback | Coverage may be incomplete |
| Evaluation-rubric change | Production treatment change | Judge drift can look like improvement |
| Host-adapter change | Cross-model experiment | Host and model effects are confounded |

---

# 4. Overall execution order

Use this order unless evidence proves a batch unnecessary.

~~~text
BATCH 0   Freeze and map current system
          ↓
BATCH 1   Capture behavioral and instruction baselines
          ↓
BATCH 2   Establish canonical versus generated ownership
          ↓
BATCH 3   Navigation-only reference hardening
          ↓
BATCH 4   Low-risk leaf-agent pilot
          ↓
BATCH 5   Additional role-by-role instruction refactors
          ↓
BATCH 6   Planner + Plan Auditor coordinated refactor
          ↓
BATCH 7   Pipeline + Orchestrator central-control refactor
          ↓
BATCH 8   Approval and release safety refactor
          ↓
BATCH 9   Main Skill progressive-disclosure restructuring
          ↓
BATCH 10  Deterministic hardening
          ↓
BATCH 11  Artifact and handoff compaction
          ↓
BATCH 12  Physical repository reorganization
          ↓
BATCH 13  Host adapter and distribution cleanup
          ↓
BATCH 14  Full regression and migration closeout
~~~

The key ordering principle is:

> **Do not physically reorganize the repository before canonical ownership, instruction behavior, reference loading, and generation are understood and tested.**

---

# 5. BATCH 0 — Freeze and map the current system

**Goal:** Understand what exists before changing it.

Primary guide:

RSTACK-REPOSITORY-ARCHITECTURE-REFACTOR-GUIDE.md

## Actions

1. Identify repository revision.
2. Record dirty and uncommitted state.
3. Inventory:
   - agents,
   - Skills,
   - references,
   - hooks,
   - scripts,
   - tests,
   - model configuration,
   - evaluation files,
   - generated trees,
   - installation and package trees.
4. Build the canonical/generated map.
5. Identify generator commands.
6. Identify installation destinations.
7. Identify known consumers.
8. Build dependency and reference graph.
9. Answer the ten one-minute architecture questions.
10. Produce the architecture-review deliverable.

## Do not

- move files,
- shorten prompts,
- add behavior-changing TOCs or splits,
- change model pins,
- change routing,
- regenerate packages merely for cleanup.

## Exit criteria

Proceed only when the review identifies:

~~~text
canonical authored root or roots
generated output roots
generators
host installation paths
state-machine owner
model-config owner
test locations
evaluation locations
unknowns and blockers
~~~

If canonical ownership remains ambiguous, stop.

---

# 6. BATCH 1 — Capture the baseline

**Goal:** Preserve evidence of current behavior before optimization.

Primary guide:

RSTACK-INSTRUCTION-ARCHITECTURE-EVAL-PLAN.md

## Static baseline

For each runtime-relevant file record:

- path,
- SHA,
- lines,
- bytes,
- headings,
- references,
- duplicated normative rules,
- approximate L0/L1/L2/HUMAN distribution where practical.

## Behavioral baseline

Capture representative fixtures for:

- Planner,
- Plan Auditor,
- Tester,
- Developer,
- Reviewer,
- Orchestrator,
- Approval.

Record where observable:

- model,
- effort,
- host,
- exact source revision,
- result,
- findings,
- human corrections,
- downstream rework,
- reference retrieval,
- token and credit use only when actually observable.

## Generated baseline

Record hashes of generated output.

## Do not

Change the tests to match the future refactor yet.

## Exit criteria

There is enough evidence to detect:

- role regression,
- missing instruction,
- reference-loading failure,
- routing drift,
- generated-output drift.

---

# 7. BATCH 2 — Canonical/generated ownership hardening

**Goal:** Make it obvious what humans edit.

No intended runtime behavior change.

## Actions

- document canonical authored roots,
- standardize GENERATED / DO NOT EDIT markers where accurate,
- add source, generator, and regeneration metadata,
- document generator commands,
- add generated-drift checks where practical,
- document host installation destinations.

## Pay close attention to

- duplicate agent files,
- duplicate Skills,
- .github output,
- plugin output,
- Copilot-agent output,
- Claude output,
- generated trees.

## Do not

- move the canonical tree yet,
- rewrite prompt bodies,
- change host-facing semantics,
- change models or effort.

## Tests

- regenerate from known source,
- compare generated output,
- verify no unexpected changes,
- verify host still discovers the same installed assets.

## Exit criteria

A developer can identify canonical versus generated without guessing.

---

# 8. BATCH 3 — Navigation-only reference hardening

**Goal:** Improve discoverability before moving instructions.

This is the safest place to apply TOC and direct-reference guidance.

## Actions

For runtime-relevant references over about 100 lines:

- add concise TOCs,
- improve descriptive headings,
- add direct links from calling Skills or agents,
- repair broken links,
- reduce deep chains where semantics do not move.

## Do not

- rewrite policy,
- change verdicts,
- change routing,
- change schemas,
- split a file merely to reduce line count.

## Tests

Use retrieval fixtures:

- late-section rule is found,
- direct reference resolves,
- wrong policy is not applied.

## Exit criteria

Important references are discoverable and retrieval behavior is understood.

---

# 9. BATCH 4 — First low-risk leaf-agent pilot

**Goal:** Prove the hardening method on one bounded role.

Do not start with Planner, Plan Auditor, Orchestrator, or Approval unless evidence makes one of them clearly safer than alternatives.

Preferred selection criteria:

- bounded write lane,
- strong deterministic checks,
- no ownership of global routing,
- good test fixtures,
- limited external authority.

A Developer-like role may be a good candidate, but choose from evidence.

## Process

1. Classify every section:
   - KEEP_LOCAL,
   - MOVE_TO_SKILL,
   - MOVE_TO_REFERENCE,
   - MOVE_TO_SCRIPT_OR_HOOK,
   - MOVE_TO_HISTORY,
   - DELETE_DUPLICATE.
2. Assign degree of freedom:
   - L0,
   - L1,
   - L2,
   - HUMAN.
3. Refactor only that role.
4. Preserve external result contract.
5. Regenerate host output.
6. Run role fixtures.
7. Compare baseline versus treatment.

## Hard guardrail

If a moved rule cannot be reliably retrieved, revert that move.

## Exit criteria

KEEP only when behavior is equal or better with no material guardrail regression.

---

# 10. BATCH 5 — Additional leaf-role refactors

**Goal:** Repeat the proven process one role at a time.

Use:

~~~text
ONE ROLE
→ TEST
→ KEEP / REVERT / INCONCLUSIVE
→ NEXT ROLE
~~~

Do not refactor all agents in one commit.

Possible order after a successful first pilot:

1. Developer
2. Reviewer
3. Tester

Adjust based on actual fixture coverage and risk.

## Why Planner and Auditor wait

Their workflow and human-checkpoint semantics are being actively redesigned. Stabilize that interface before optimizing their prompts.

---

# 11. BATCH 6 — Planner + Plan Auditor coordinated refactor

**Goal:** Simplify the main reasoning pair after their workflow is settled.

Use:

- Planner-Auditor-Human redesign,
- first-audit human-checkpoint analysis,
- instruction-hardening guide,
- artifact/handoff efficiency review.

Treat Planner and Auditor as a coordinated interface, but test them independently.

## Planner keep-local concerns

- planning objective,
- factual grounding,
- human-decision boundary,
- plan output contract,
- stop conditions.

## Planner move-out candidates

- reusable search procedure,
- repository topology detail,
- long examples,
- full shared schemas,
- historical incidents.

## Auditor keep-local concerns

- independence,
- evidence rule,
- audit objective,
- finding semantics,
- stop conditions.

## Auditor move-out candidates

- shared labels and schemas,
- generic reference-navigation procedure,
- historical examples.

## Handoff target

Compact plan identity plus structured claims and evidence.

No repeated Planner essay.

## Tests

At minimum:

- clean plan,
- factual contradiction,
- unsupported claim,
- omission,
- design disagreement,
- stale plan identity,
- human-owned decision.

## Exit criteria

No material increase in Planner misses or Auditor false positives.

---

# 12. BATCH 7 — Pipeline + Orchestrator central-control refactor

**Goal:** Simplify the central dispatcher after role contracts are stable.

This batch is high risk.

## Preconditions

- routing fixtures exist,
- canonical/generated ownership is known,
- result schemas are stable,
- Planner/Auditor policy is settled,
- human checkpoints are settled.

## Orchestrator target

The Orchestrator should primarily:

~~~text
read current state
validate deterministic prerequisites
dispatch the correct role
persist the exact result
route using the canonical state table
stop on malformed, unknown, or human-owned cases
~~~

It should not become an engineering judge.

## Pipeline Skill target

Keep:

- states,
- routing,
- freshness,
- human checkpoints,
- critical invariants,
- stop and recovery pointers.

Move detailed schemas and policies to direct references.

## Pay special attention to

- duplicate routing tables,
- STOPPED semantics,
- stale-audit handling,
- human checkpoints,
- unknown external effects,
- candidate invalidation,
- resume behavior.

## Tests

Cover every route in the state table, not only the happy path.

---

# 13. BATCH 8 — Approval and release safety refactor

**Goal:** Simplify the most authority-sensitive role only after central control is stable.

Treat this as a safety-critical batch.

## Keep explicit

- human authorization boundary,
- exact candidate/action binding,
- unknown-effect reconciliation,
- protected-work handling,
- publication separation,
- remote readback.

## Deterministic-control candidates

- candidate equality,
- required artifact presence,
- target and head comparison,
- existing-PR reconciliation,
- stale-review detection.

## Never weaken

External-side-effect stop and reconciliation rules.

## Tests

Use adverse fixtures:

- unknown push result,
- PR already exists,
- wrong target,
- stale candidate,
- unrelated staged work,
- protected user work,
- human denial.

---

# 14. BATCH 9 — Main Skill progressive disclosure

**Goal:** Reduce hot-path Skill context after direct references and role boundaries are proven.

## Preconditions

- TOCs and direct references are tested,
- moved-rule reachability passes,
- canonical references are stable,
- role agents no longer depend on duplicated Skill prose.

## Target main Skill

~~~text
core invariants
states
routing
human checkpoints
stop conditions
direct reference map
~~~

Move to direct references:

- detailed schemas,
- long examples,
- host-specific detail,
- historical rationale,
- specialized edge-case procedure.

## Important

Do not split simply to reduce line count.

Every new reference needs:

- clear purpose,
- direct caller,
- known consumer,
- retrieval test.

---

# 15. BATCH 10 — Deterministic hardening

**Goal:** Replace objective L0 prose with machine checks.

Candidate areas:

- candidate identity,
- plan/audit digest match,
- legal result tokens,
- required fields,
- state transition validity,
- test-lock identity,
- generated drift,
- protected-path checks.

## Process

1. Document current prose rule.
2. Implement validator.
3. Add direct tests.
4. Make the agent consume the validator result.
5. Keep a concise local consequence.
6. Remove duplicated manual procedure only after coverage is demonstrated.

## Do not

Remove semantic or human judgment merely because automation is desirable.

---

# 16. BATCH 11 — Artifact and handoff compaction

**Goal:** Reduce communication and persistence waste after owners are stable.

Use:

RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md

Optimize separately:

~~~text
PERSISTENT EVIDENCE
versus
HOT HANDOFF
~~~

Keep rich evidence where audit and reconstruction require it.

Reduce what downstream agents must reread.

Examples:

- reference plan by digest and path instead of restating it,
- keep raw logs cold,
- pass concise failure IDs and evidence refs,
- keep one canonical ticket and AC definition,
- remove repeated narrative summaries.

Do not conflate less storage with less context.

---

# 17. BATCH 12 — Physical repository reorganization

**Goal:** Make the repository reflect the factory model only after behavior is stable.

Use:

RSTACK-REPOSITORY-ARCHITECTURE-REFACTOR-GUIDE.md

Potential top-level planes:

~~~text
factory/
adapters/
evaluation/
tests/
distribution/
generated/
docs/
examples/
~~~

At this point the work should mostly be path and ownership migration, not semantic redesign.

## Move in small sub-batches

Suggested order:

1. docs, history, research
2. evaluation
3. tests
4. distribution and generators
5. host adapters
6. shared references and contracts
7. Skills
8. agents
9. central control-plane files

Central control moves last because it has the widest dependency surface.

## For every move

- update references,
- update generator paths,
- regenerate,
- run loading tests,
- run behavior fixtures,
- commit,
- stop and review.

Do not move the whole tree in one commit.

---

# 18. BATCH 13 — Host adapter and distribution cleanup

**Goal:** Ensure portable factory semantics produce correct host-specific packages.

Verify independently:

- Copilot VS Code,
- Copilot IntelliJ,
- Claude Code,
- Devspace,
- future Bedrock adapter when applicable.

Do not assume one host's discovery rules apply to another.

## Tests

- generated file paths,
- frontmatter syntax,
- model selectors,
- tool mappings,
- Skill discovery,
- hook registration,
- generated drift.

---

# 19. BATCH 14 — Full regression and closeout

Run:

- static architecture checks,
- reference-loading checks,
- role behavior fixtures,
- routing fixtures,
- safety fixtures,
- end-to-end synthetic runs,
- selected approved pilot runs,
- post-run evaluator.

Compare against the Batch 1 baseline.

Report:

~~~text
QUALITY
RELIABILITY
EFFICIENCY
HUMAN EFFORT
HOST COMPATIBILITY
GENERATED DRIFT
~~~

Decide:

- KEEP migration,
- rollback affected batch,
- or leave specific areas INCONCLUSIVE.

---

# 20. Commit discipline

Each batch should be independently understandable.

Prefer commits such as:

~~~text
docs: add TOC to handoff reference
refactor(planner): move grounding examples to direct reference
test(routing): cover stopped latest audit
build(copilot): derive generated planner from canonical source
refactor(skill): extract publication details to approvals reference
~~~

Avoid vague commits such as:

~~~text
refactor everything
cleanup
AI factory reorganization
misc fixes
~~~

---

# 21. Batch size guidance

For high-risk files:

~~~text
1 primary concern
1 to 3 canonical authored files
required generated outputs
required tests
~~~

For low-risk documentation/navigation:

~~~text
one coherent reference family
~~~

Do not use file count alone.

A single central Skill can be riskier than ten documentation files.

---

# 22. Stop conditions

Stop the active batch when any of these occurs:

- canonical source becomes uncertain,
- generator output differs unexpectedly,
- host no longer discovers an agent or Skill,
- moved rule cannot be retrieved,
- model or effort changes unexpectedly,
- baseline fixture changes for unrelated reasons,
- material role behavior regresses,
- human checkpoint is skipped,
- stale evidence is accepted,
- unknown external action becomes retried,
- test ownership weakens,
- rollback becomes unclear.

Do not fix forward across several batches.

Revert or isolate first.

---

# 23. Areas requiring special attention

## Generated files

Visibility in the IDE does not mean editability.

## Host discovery

Moving identical content can still change whether Copilot or Claude discovers it.

## Reference loading

Moving detail out of an agent is safe only when it remains retrievable.

## Central routing

Routing drift can make all downstream role tests appear broken.

## Human authority

No efficiency refactor may automate a human-owned decision silently.

## Fresh-context roles

Do not inject implementation persuasion into Auditor or Reviewer to save retrieval calls.

## Historical evidence

Do not delete audit/run history just to make the repository cleaner.

## Evaluation leakage

Execution must not consume its own post-run evaluation.

## Model experiments

Freeze model and effort during instruction-architecture tests.

## Artifact experiments

Optimize persistence and context separately.

---

# 24. Required report after every implementation batch

Claude should produce:

~~~markdown
## Batch
Name and scope

## Baseline
Source SHA:
Model and effort:
Relevant tests:
Relevant sizes:

## Changed
Canonical files:
Generated files:
Tests:

## Intended behavior change
None / exact change

## Validation
Static:
Loading:
Role behavior:
Routing:
Safety:
Generated drift:

## Metrics
Before:
After:

## Unexpected findings
...

## Decision
KEEP / REVERT / INCONCLUSIVE

## Next permitted batch
...
~~~

Do not begin the next batch until the current decision is recorded.

---

# 25. Exact starting instruction for Claude

Start with:

> Read RSTACK-SAFE-REFACTOR-EXECUTION-ORDER.md and RSTACK-REPOSITORY-ARCHITECTURE-REFACTOR-GUIDE.md.
>
> Execute **Batch 0 only**.
>
> Inspect the actual repository, generators, installed/generated trees, agents, Skills, hooks, scripts, tests, model configuration, and evaluation material.
>
> Produce the architecture review and canonical/generated ownership map required by the architecture guide.
>
> Do not move files, refactor prompts, change Skills, regenerate host output, change models, or alter runtime behavior.
>
> Stop for human review after Batch 0.

After Batch 0 is accepted:

> Execute Batch 1 only. Capture the instruction and behavioral baselines. Do not refactor yet.

Continue one explicitly authorized batch at a time.

---

# Final principle

> **We are not rebuilding RSTACK in one pass. We are reducing uncertainty one batch at a time.**

Safe sequence:

~~~text
UNDERSTAND
  ↓
MEASURE
  ↓
ESTABLISH OWNERSHIP
  ↓
IMPROVE NAVIGATION
  ↓
PILOT ONE ROLE
  ↓
EXPAND ROLE BY ROLE
  ↓
REFINE CENTRAL CONTROL
  ↓
HARDEN DETERMINISTIC RULES
  ↓
OPTIMIZE HANDOFFS
  ↓
MOVE THE TREE
  ↓
REGENERATE HOST PACKAGES
  ↓
FULL REGRESSION
~~~

If a batch cannot explain exactly what changed, why it changed, how it was tested, and how to undo it, the batch is too large.
