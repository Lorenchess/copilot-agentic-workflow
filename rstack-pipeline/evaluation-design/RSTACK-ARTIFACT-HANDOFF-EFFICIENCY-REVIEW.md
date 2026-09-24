# RSTACK Artifact, Metadata, and Handoff Efficiency Review

## Purpose

Use this document with Claude Code to evaluate the **current RSTACK run-artifact, metadata, evidence-retention, and agent-to-agent handoff design**.

The goal is not to make artifacts shorter for their own sake.

The goal is to make RSTACK:

- cost-effective,
- token-efficient,
- fast enough for practical developer use,
- easy for each role to understand,
- auditable after the run,
- reproducible where required,
- and sufficiently evidence-rich for independent post-run evaluation.

The target principle is:

> **Rich persistent evidence, thin execution context.**

Persist what is needed for audit and reconstruction. Inject into the next agent only what that agent needs to do its job correctly.

This is an **analysis and redesign task first**. Do not modify active RSTACK contracts, agents, scripts, or artifact formats during this pass.

---

# 1. Why this review is necessary

Observed pipeline runs can generate many Markdown and evidence artifacts even when the actual production/test change is small.

The current V2.2 reference also intentionally preserves substantial evidence:

- complete role replies in \`logs/results/<N>.md\`,
- run-log entries,
- current compatibility artifacts,
- immutable attempt directories,
- immutable copies of mutable inputs used by a review packet,
- candidate/comparison packets,
- plan/audit/review round archives,
- test reports and suite captures.

Some duplication may be **necessary for auditability, parser compatibility, candidate binding, and historical reconstruction**.

Some may be unnecessary hot-path duplication that:

- consumes Copilot context,
- increases model calls,
- increases latency,
- increases credit/token use,
- makes handoffs harder to understand,
- and encourages agents to restate rather than reference prior work.

Do not assume either conclusion.

Measure and classify the current design.

---

# 2. Primary design question

For every artifact, field, copy, and handoff ask:

> Does this information need to be persisted, does the next role need to read it now, or both?

These are different requirements.

The review must separate:

~~~text
PERSISTENT EVIDENCE
    what must survive for audit/reconstruction

HOT HANDOFF CONTEXT
    what the next role must receive/read now

RUNTIME STATE
    what the pipeline/controller needs to continue

COMPATIBILITY DATA
    what existing parsers/tools require

POST-RUN EVALUATION DATA
    what the independent evaluator writes after execution
~~~

Do not solve one concern by making every agent load all five.

---

# 3. Required target model

Use this as a design hypothesis to test, not as a pre-decided implementation:

~~~text
                    RSTACK RUN
                       │
        ┌──────────────┼───────────────┐
        │              │               │
        ▼              ▼               ▼
   RUNTIME STATE   PERSISTENT       HANDOFF PACKET
   small/typed      EVIDENCE         small/typed
        │              │               │
        │              │               ▼
        │              │           NEXT AGENT
        │              │               │
        │              └──────┐        │
        │                     │        │
        │             retrieve evidence
        │              only if needed
        │                     │
        └─────────────────────┴────────┘

After run completion:

PERSISTENT RUN EVIDENCE
        ↓
fresh Claude evaluator
        ↓
evaluation/
        ↓
cross-run dataset
~~~

A large piece of evidence may be necessary to preserve while still being unnecessary to inject into the next agent.

---

# 4. Current V2.2 sources Claude must inspect

Do not answer from this document alone.

Inspect the active V2.2 reference and, when available, real submitted run directories.

At minimum inspect:

- \`rstack-pipeline/README.md\`
- \`rstack-pipeline/claude-v2.2/pipeline/SKILL.md\`
- all seven files under \`rstack-pipeline/claude-v2.2/agents/\`
- \`rstack-pipeline/claude-v2.2/references/handoff-contracts.md\`
- \`rstack-pipeline/claude-v2.2/references/discovery-cost.md\`
- \`rstack-pipeline/claude-v2.2/references/write-boundaries.md\`
- \`rstack-pipeline/claude-v2.2/references/harness-map.md\`
- \`rstack-pipeline/claude-v2.2/references/approvals.md\`
- \`rstack-pipeline/claude-v2.2/references/risk-tiers.md\`
- relevant scripts/hooks when source is present
- \`rstack-pipeline/evaluation-design/\`
- especially \`RSTACK-POST-RUN-EVALUATION-WORKFLOW.md\`

If actual workplace run directories are supplied, inspect them as the primary evidence of real artifact volume and usage.

Do not treat the V2.2 reference as proof of what an installed workplace runtime actually produced.

---

# 5. Inventory every current run artifact

Create an inventory such as:

| Artifact / field | Writer | Primary consumer | Other consumers | Purpose | Mutable? | Parser-required? | Candidate-bound? | Needed next phase? | Needed post-run? | Typical size | Duplication candidate? |
|---|---|---|---|---|---|---|---|---|---|---:|---|

Classify each artifact into one or more of these roles:

- \`RUNTIME_STATE\`
- \`HANDOFF\`
- \`PRIMARY_EVIDENCE\`
- \`IMMUTABLE_ARCHIVE\`
- \`COMPATIBILITY_COPY\`
- \`HUMAN_DECISION\`
- \`POST_RUN_EVAL_INPUT\`
- \`OPTIONAL_DIAGNOSTIC\`
- \`UNKNOWN_PURPOSE\`

Every artifact should have a defensible consumer.

If no consumer or decision can be identified, flag it for removal or deferral rather than preserving it by habit.

---

# 6. Map actual information flow between roles

For each transition, determine exactly what the receiving role needs.

Map at least:

~~~text
Orchestrator → Planner
Planner → Plan Auditor
Plan Auditor → Planner revision
Planner → Tester
Tester → Developer
Developer → Tester verification
Tester → Approval/freeze
Approval/freeze → Tester candidate verification
Tester → Reviewer
Reviewer → Developer/Tester
Reviewer → Approval/release
~~~

For every transition answer:

1. What decisions must the receiver make?
2. What minimum facts are required?
3. Which facts can be referenced by path/ID instead of copied?
4. Which evidence must be opened only on demand?
5. Which upstream prose is irrelevant to the receiver?
6. Which information must remain hidden from fresh-context roles?
7. Which fields are needed for deterministic routing?
8. Which fields are present only because a parser expects them?
9. Which fields are repeated across multiple artifacts?
10. Which fields are required only for post-run audit, not execution?

---

# 7. Measure current artifact cost before redesign

Do not use intuition alone.

For every sample run available, calculate deterministic quantities where possible.

## A. Artifact volume

- total artifact count,
- Markdown artifact count,
- total persisted bytes,
- bytes by artifact class,
- lines by artifact class,
- number of archived rounds/attempts,
- number of compatibility copies.

## B. Exact duplication

Use hashes where possible.

Measure:

- byte-identical files,
- byte-identical sections if practical,
- repeated full role replies,
- current copy + immutable copy relationships,
- repeated ticket/AC/plan text.

Do not classify required immutable snapshots as waste merely because bytes repeat.

First identify the reason for the copy.

## C. Near duplication

Where useful, estimate repeated prose or repeated structured fields across:

- ticket,
- plan,
- audit,
- audit response,
- test report,
- review packet,
- reviewer output,
- approval.

Keep this analysis diagnostic.

Do not build a complex semantic deduplication system in the first pass.

## D. Artifact-to-change relationship

Record diagnostic ratios such as:

~~~text
artifact_bytes / changed_source_bytes
artifact_lines / changed_source_lines
artifact_count / changed_files
~~~

These ratios are **not KPIs**.

A security-sensitive one-line change may legitimately require substantial evidence.

Use them only to identify runs worth inspecting.

## E. Handoff size

Where the actual dispatch payload can be observed, record:

- bytes/characters passed to each role,
- number of referenced artifacts,
- number of full artifacts injected,
- number of repeated fields.

If exact prompt/token usage is unavailable, do not estimate tokens and present them as observed.

Characters/bytes may be reported as a local deterministic proxy with that limitation explicit.

## F. Time and model cost

Use:

- elapsed time,
- model usage,
- tool calls,
- credits/cost,

only when actually observable from the host or approved telemetry.

Unavailable means unavailable.

---

# 8. Required distinction: storage cost versus context cost

Do not optimize the wrong thing.

A 500 KB raw test log stored on disk may be cheap and necessary.

Injecting that same 500 KB into three agents may be expensive and harmful.

For each artifact evaluate separately:

| Dimension | Question |
|---|---|
| Persistence value | Must these bytes survive for audit/reconstruction? |
| Handoff value | Does the next role need the full content now? |
| Retrieval value | Can the role open only the relevant section/path when needed? |
| Parser value | Does a current deterministic consumer require the exact format/path? |
| Evaluation value | Will the post-run evaluator need it? |
| Replacement risk | What audit/proof property is lost if compressed/referenced? |

The review must not recommend deleting persistent evidence merely because it should not be in hot context.

---

# 9. Canonical-owner rule

A fact should have one canonical owner wherever practical.

Other artifacts should reference it rather than restate it.

Examples of facts that often become duplicated:

- ticket acceptance criteria,
- candidate SHA,
- plan revision,
- plan hash,
- test command,
- suite result,
- artifact paths,
- finding text,
- human decision,
- model identity,
- repository/base identity.

For each repeated fact determine:

~~~text
CANONICAL OWNER
        ↓
reference by ID/path/hash
        ↓
short local consequence only where necessary
~~~

Do not create conflicting copies whose synchronization becomes another pipeline responsibility.

---

# 10. Role-delta rule

Evaluate whether each role can follow this principle:

> **Do not restate upstream work. Add only the new information owned by your role plus the references needed to bind it to prior evidence.**

This is a design target, not an instruction to delete required context blindly.

Examples:

- Auditor should primarily add findings about Planner claims rather than rewrite the plan.
- Tester should add proof definitions/results rather than narrate the full plan again.
- Developer should identify implementation/candidate changes rather than reproduce test evidence.
- Reviewer should add independent findings bound to candidate/evidence rather than restate implementation history.
- Approval should record candidate/publication decisions rather than duplicate all prior semantic analysis.

---

# 11. Illustrative examples

These examples explain the desired direction. They are not final schemas.

## Example 1 — Planner → Auditor

### Verbose handoff

~~~markdown
The Jira ticket says...
[full ticket restatement]

The repository contains...
[full discovery narrative]

The plan is...
[full 200-line plan]

Here are the acceptance criteria again...
[repeated criteria]

Please audit the plan.
~~~

### Preferred direction

~~~yaml
state: PLAN_AUDIT
ticket_ref: meta/ticket.md
plan:
  path: plan/plan.md
  revision: 3
  sha256: <digest>
claims_for_audit:
  - PC-1
  - PC-2
  - PC-3
required_output: plan-audit
~~~

The Auditor opens the exact plan and supporting evidence itself.

The handoff binds the subject; it does not restate it.

---

## Example 2 — Auditor result

### Verbose result

~~~markdown
Here is the entire plan again...
[repeated plan]

I reviewed each section...
[large narrative]

One issue is that no callers were found...
...
~~~

### Preferred direction

~~~yaml
result: REFUTED
plan_ref:
  revision: 3
  sha256: <digest>
findings:
  - id: AF-1
    claim_ref: PC-2
    type: UNSUPPORTED_CLAIM
    evidence_ref: evidence/discovery/callers.txt
    materiality: HIGH
    action: revise
attempted_no_finding:
  - PC-1
~~~

Detailed evidence remains available by reference.

Do not require the receiving Planner to reread a full copy of its own plan.

---

## Example 3 — Raw test evidence

### Wasteful hot-path behavior

~~~text
suite.txt = 800 KB
Tester sends all 800 KB to Developer
Reviewer receives same 800 KB
Approval receives same 800 KB
~~~

### Preferred direction

~~~text
Persist:
evidence/attempt-2/raw-suite.log       800 KB

Handoff:
suite = FAILED
failure_ids = [T-14, T-19]
citable_summary = evidence/attempt-2/test-report.md
raw_log = evidence/attempt-2/raw-suite.log
raw_sha256 = ...
~~~

Developer opens the relevant failure evidence.

Reviewer opens raw evidence only when needed.

Auditability remains intact.

---

## Example 4 — Immutable evidence versus duplicate storage

Current contracts may intentionally copy mutable inputs into an immutable attempt directory so that a future reviewer/evaluator can reconstruct the exact bytes used.

Do **not** simply replace those copies with references to mutable current files.

Instead compare alternatives such as:

~~~text
A. current byte-copy snapshot
B. content-addressed immutable object + multiple references
C. repository/Git object when content and access are guaranteed
D. keep current copy because it is simplest and safest
~~~

Recommend a change only if the alternative preserves:

- byte identity,
- retention,
- accessibility,
- candidate binding,
- parser compatibility,
- and evaluator reconstruction.

Sometimes duplicate bytes are cheaper than a fragile optimization.

---

## Example 5 — Small ticket depth

Suppose a ticket changes:

- one production file,
- one test,
- no cross-repository dependency,
- no external publication exception,
- and no unresolved human decision.

Do not assume it needs the same narrative depth as a high-risk multi-service change.

A compact run might still preserve:

~~~text
ticket/AC source
plan identity
claims or explicit none
test proof
candidate identity
verification result
review result
human/publication decision where required
~~~

but avoid unnecessary repeated narrative.

Risk/complexity may scale **depth**, not silently remove mandatory control points.

---

## Example 6 — Post-run evaluation

Execution artifacts should remain evidence.

Claude's later evaluator can read:

~~~text
ticket
plan
audit
AC matrix
test proof
candidate
review
logs
~~~

without requiring all of those documents to have been injected into every execution agent.

This is why:

> persistence != prompt injection

must remain a core architectural rule.

---

# 12. Evaluate the current structured result envelope

Current V2.2 defines a structured result envelope and stores complete role replies.

Review whether:

- every field is used for routing/audit,
- fields are duplicated in artifact bodies,
- role replies need to be persisted verbatim,
- a compact machine-readable envelope could coexist with human-readable artifacts,
- result envelopes should become the primary handoff while full bodies remain cold evidence,
- parsers require current shapes,
- and fresh Auditor/Reviewer outputs require different handling.

Do not change parser-owned formats without inspecting the actual parsers and consumers.

---

# 13. Evaluate plan.md specifically

Current V2.2 requires plan sections covering items such as:

- risk tier,
- affected surfaces,
- related issues,
- repository/branch/base identity,
- restatement,
- acceptance criteria,
- ordered units,
- test plan,
- change budget,
- risks/blast radius,
- assumptions,
- open questions,
- claims for audit.

For real sample runs determine:

- which sections are consistently useful,
- which sections merely restate ticket metadata,
- which sections should reference canonical ticket/AC data,
- whether small tickets produce disproportionate narrative,
- whether claims-for-audit can carry more of the auditor-facing contract,
- and whether risk tier should affect detail level.

Do not remove fields required for falsifiability, audit subject binding, or downstream verification.

---

# 14. Evaluate immutable attempt snapshots specifically

Current V2.2 retains immutable attempt evidence and may copy mutable inputs into the attempt directory.

This is potentially storage-heavy but provides strong historical reconstruction.

Analyze:

- how many bytes are duplicated per attempt,
- how often repeated copies are byte-identical,
- which copies are required because source files later mutate,
- whether content-addressing could safely reduce duplicates,
- whether Git object identity already provides some immutable source material,
- whether private run artifacts cannot rely on Git,
- whether compatibility copies can be generated/pointer-based,
- and whether optimization would create more complexity than it saves.

Storage efficiency is secondary to audit correctness unless measured costs justify a change.

---

# 15. Evaluate logs/results/<N>.md specifically

Current V2.2 preserves each complete role reply.

Determine:

- what audit/recovery questions this solves,
- whether the same content is also persisted elsewhere,
- whether complete replies are needed indefinitely,
- whether structured envelopes plus role-owned artifact bodies can replace some duplication,
- whether replies include large upstream restatements that should never have been generated,
- and whether retention can be tiered after a run is closed.

Do not delete historical evidence before retention/governance requirements are established.

---

# 16. Context-loading strategy

Propose an explicit loading policy.

Possible classes:

## ALWAYS

Small state required by every invocation.

Examples:

- run ID,
- role,
- ticket IDs,
- current candidate/target,
- current phase,
- blockers relevant to the role.

## ROLE_REQUIRED

Loaded for a specific role.

Examples:

- Planner: ticket + repository evidence needed for planning.
- Auditor: exact plan + claims/evidence.
- Tester: approved ACs + proof requirements.
- Developer: failing proof + approved implementation scope.
- Reviewer: candidate + ACs + immutable review packet.

## ON_DEMAND

Evidence that exists but should be opened only when a question requires it.

Examples:

- raw suite logs,
- earlier audit rounds,
- archived candidates,
- complete role transcripts,
- unrelated discovery evidence.

## POST_RUN_ONLY

Needed for evaluation/history, not normal execution.

Examples may include:

- full invocation transcripts,
- evaluator metadata,
- aggregate metrics.

Derive the actual policy from current role responsibilities.

---

# 17. Artifact-depth policy

Evaluate whether RSTACK needs explicit artifact-depth profiles.

Do not equate low risk with no documentation.

Potential concept:

~~~text
COMPACT
  narrow/local/simple work

STANDARD
  ordinary application change

DEEP
  broad/high-risk/cross-service or uncertain work
~~~

For each profile, define:

- what remains mandatory,
- what becomes a reference rather than narrative,
- what evidence depth changes,
- and what must never be removed.

Do not introduce this mechanism unless sample runs demonstrate meaningful savings and no correctness loss.

Existing risk tiers may already be the correct owner; prefer extending an existing concept over creating a parallel complexity system.

---

# 18. Efficiency metrics to propose

Do not create one "efficiency score."

Use interpretable metrics.

Potential deterministic metrics:

### Artifact volume
- \`artifact_count\`
- \`artifact_bytes_total\`
- \`artifact_bytes_by_class\`
- \`artifact_lines_total\`

### Duplication
- \`exact_duplicate_bytes\`
- \`exact_duplicate_file_count\`
- \`compatibility_copy_bytes\`
- \`immutable_snapshot_bytes\`

### Handoff
- \`handoff_bytes_by_transition\`
- \`handoff_artifact_count\`
- \`full_artifacts_injected\`
- \`references_in_handoff\`

### Change diagnostics
- \`source_changed_lines\`
- \`test_changed_lines\`
- \`changed_files\`
- \`artifact_to_change_ratio\` as diagnostic only

Potential semantic metrics:

- unnecessary restatement present,
- missing necessary handoff information,
- evidence retrieval burden,
- handoff clarity,
- audit sufficiency after compression,
- whether the receiver could complete its role without irrelevant upstream prose.

Potential host metrics, only if observed:

- input tokens by role,
- output tokens by role,
- elapsed time,
- credits/cost,
- tool calls.

Every metric must state provenance and limitations.

---

# 19. Guardrail metrics

Any artifact-reduction experiment must guard against degradation.

Track at least:

- missing required fields,
- malformed handoffs,
- additional clarification loops,
- downstream false assumptions,
- Auditor false negatives,
- Tester proof gaps,
- Reviewer misses,
- stale evidence,
- inability to reconstruct the judged candidate/run,
- evaluator inability to find supporting evidence,
- human repair effort.

If artifact size falls while these worsen materially, the change is not an efficiency improvement.

---

# 20. Required analysis classifications

For every current artifact/section/field, assign one action:

- \`KEEP_HOT\` — keep in routine handoff/context.
- \`KEEP_PERSISTENT\` — preserve but do not inject routinely.
- \`REFERENCE_ONLY\` — replace copied prose with stable reference/path/ID.
- \`COMPRESS\` — retain meaning with a smaller structured representation.
- \`CONTENT_ADDRESS\` — candidate for immutable deduplicated storage if safe.
- \`GENERATE_ON_DEMAND\` — derive when needed rather than persist repeatedly.
- \`MERGE_WITH_CANONICAL_OWNER\` — duplicated fact/schema should have one owner.
- \`REMOVE\` — no demonstrated consumer/value.
- \`DEFER\` — possible optimization but insufficient evidence.
- \`UNKNOWN\` — purpose/consumer must be established before change.

Do not classify anything REMOVE merely because it is large.

---

# 21. Required deliverables

Create design/review documents only.

Do not modify active RSTACK behavior during this task.

Produce:

## 1. RSTACK-ARTIFACT-EFFICIENCY-BASELINE.md

Include:

- artifact inventory,
- writer/consumer map,
- sizes,
- exact duplication,
- current handoff flow,
- observed sample-run ratios,
- unavailable measurements,
- and current parser/compatibility constraints.

## 2. RSTACK-HANDOFF-DATAFLOW-MAP.md

For every role transition document:

- decisions receiver makes,
- minimum required fields,
- required evidence references,
- what should remain cold/on-demand,
- what must be hidden for independence,
- and current unnecessary restatement if observed.

## 3. RSTACK-ARTIFACT-OPTIMIZATION-PROPOSAL.md

Classify every artifact/section using:

- KEEP_HOT,
- KEEP_PERSISTENT,
- REFERENCE_ONLY,
- COMPRESS,
- CONTENT_ADDRESS,
- GENERATE_ON_DEMAND,
- MERGE_WITH_CANONICAL_OWNER,
- REMOVE,
- DEFER,
- UNKNOWN.

Include before/after conceptual layouts.

## 4. RSTACK-COMPACT-HANDOFF-EXAMPLES.md

Provide concrete examples for:

- Planner → Auditor,
- Auditor → Planner,
- Planner → Tester,
- Tester → Developer,
- Developer → Tester,
- Tester → Reviewer,
- Reviewer → correction owner,
- Reviewer → Approval.

Examples must preserve current invariants and clearly identify anything that requires a contract/parser change.

## 5. RSTACK-ARTIFACT-EFFICIENCY-METRICS.md

Define:

- metrics,
- formulas,
- provenance,
- decision supported,
- Goodhart risks,
- guardrails.

## 6. RSTACK-ARTIFACT-EFFICIENCY-IMPLEMENTATION-PLAN.md

Propose a staged implementation.

For every change identify:

- expected savings,
- correctness/auditability risk,
- parser changes,
- producer changes,
- consumer changes,
- migration/backward-compatibility needs,
- host dependency,
- experiment required.

---

# 22. First experiment recommendation

Unless sample evidence suggests otherwise, identify one high-volume low-risk transition for the first controlled experiment.

A reasonable candidate may be a handoff where:

- the upstream artifact already exists on disk,
- the receiver can read it directly,
- the current handoff repeats the artifact,
- and no independence constraint is harmed.

Compare:

~~~text
BASELINE
current handoff

vs

TREATMENT
compact structured handoff + evidence references
~~~

Measure:

- handoff bytes,
- observed tokens if available,
- elapsed time,
- clarification/retry rate,
- malformed handoffs,
- downstream correctness,
- post-run audit sufficiency.

Do not roll out globally from one successful example.

---

# 23. Anti-goals

Do not:

- optimize artifact count at the expense of auditability,
- optimize line count at the expense of clarity,
- replace durable evidence with ephemeral chat context,
- force every artifact into JSON,
- introduce a database because files look verbose,
- estimate unavailable token/cost data and call it measured,
- remove immutable evidence without proving equivalent reconstruction,
- make fresh Auditor/Reviewer roles read implementation persuasion to save retrieval calls,
- create another huge handoff framework,
- or add an "efficiency agent" by default.

---

# 24. Required final self-review

Before finishing, challenge the proposed optimization.

Answer:

1. Which duplicated bytes are intentional and necessary?
2. Which duplicated information is merely restatement?
3. Which large files should stay on disk but leave hot context?
4. Which current fields have no demonstrated consumer?
5. Which proposed references would break if the source later mutates?
6. Which parser-owned formats prevent immediate simplification?
7. Which optimization adds more operational complexity than it saves?
8. Can Claude's post-run evaluator still reconstruct why each material decision happened?
9. Can a new agent resume from persisted state without relying on lost chat context?
10. Can a future Devspace/Bedrock host use the same artifact semantics?

Then classify proposed changes:

## KEEP NOW

Low-risk improvements with demonstrated value.

## EXPERIMENT

Promising changes requiring controlled comparison.

## DEFER

Potentially useful but not justified yet.

## REJECT

Changes that reduce evidence quality, independence, recoverability, or control.

---

# Success condition

The desired result is not "fewer files."

The desired result is:

> **Every persisted byte has a reason to survive, every handoff byte has a reason to be read now, and the pipeline remains independently auditable after the run.**

The target architecture should preserve enough evidence for Claude's post-run rubric evaluation while substantially reducing repeated narrative and unnecessary context passed between execution agents where evidence supports doing so.
