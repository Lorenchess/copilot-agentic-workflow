# RSTACK Instruction Architecture Hardening Guide

**Status:** Design and refactoring guidance for RSTACK Skills, custom-agent Markdown, references, model configuration, scripts/hooks, and supporting documentation.

**Purpose:** Help Claude 5 analyze the current instruction architecture, reduce unnecessary runtime prose, strengthen control boundaries, and apply the right **degree of freedom** to each responsibility.

This file is **not** an active runtime contract and should not be loaded into every RSTACK invocation.

The core objective is:

> **Give each model the minimum instructions it must always know, expose specialized guidance only when needed, and move objective rules into deterministic enforcement whenever practical.**

A second principle is equally important:

> **More instructions are not automatically more control. Control comes from clear ownership, appropriate degrees of freedom, deterministic enforcement, constrained interfaces, and measured behavior.**

This guide complements:

- ../AGENT-MD-REFACTOR-GUIDANCE.md
- RSTACK-DECISION-LAYER-EFFICIENCY-AUDIT.md
- RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md
- RSTACK-INSTRUCTION-ARCHITECTURE-EVAL-PLAN.md

Do not create competing owners for rules already defined elsewhere.

---

# 1. Why this review is necessary

RSTACK has accumulated detailed instructions because real failure modes were discovered over time. That history is valuable, but there is a predictable failure mode:

~~~text
incident
  ↓
add instruction
  ↓
new edge case
  ↓
add another instruction
  ↓
exception to previous instruction
  ↓
agent / skill / reference grows
  ↓
model receives more irrelevant context
  ↓
important instructions compete with everything else
~~~

The correct response is not to delete detail blindly.

The correct response is to distribute it according to:

- who owns the concern,
- when the information is needed,
- whether the decision requires semantic judgment,
- whether a machine can enforce it,
- whether the content is runtime guidance or historical rationale.

---

# 2. Important correction: there is no universal 100-line truncation rule

A public video by Simon Scrapes, **Everything You Know About Skills IS OUTDATED**, highlights a useful current Anthropic recommendation: long reference files should be easy for Claude to navigate, and Anthropic recommends a table of contents for reference files longer than about 100 lines.

The useful conclusion is **not**:

> Claude never reads anything after line 100.

That is too strong.

The more accurate model from current Anthropic guidance is:

1. Skill metadata is used for discovery.
2. The main Skill body is loaded when the Skill is relevant.
3. Additional files are read on demand.
4. Long or nested references may be inspected selectively rather than exhaustively.
5. A TOC on long references makes relevant sections discoverable.
6. The primary Skill should remain focused, with detailed material split into additional files as needed.

For RSTACK:

- Do not assume line 101 is invisible.
- Do not use a TOC as an excuse to keep an unnecessarily huge hot-path Skill.
- Use TOCs and descriptive headings in long reference material.
- Use progressive disclosure so the model does not need the whole manual for every phase.
- Verify actual loading and behavior on the Copilot host rather than assuming Claude Code behavior is identical.

---

# 3. Distinguish file types before refactoring

The same guidance does not apply identically to every Markdown file.

## 3.1 Custom agent Markdown

Examples:

- rstack-planner.agent.md
- rstack-plan-auditor.agent.md
- rstack-tester.agent.md
- rstack-dev.agent.md
- rstack-reviewer-architect.agent.md
- rstack-approval.agent.md
- rstack-orchestrator.agent.md

These files define the role's persistent behavior.

They should contain primarily:

- role purpose,
- unique responsibility,
- required inputs,
- allowed tools/capabilities,
- write boundary,
- hard invariants,
- stop/escalation conditions,
- short role procedure,
- return/handoff contract,
- links to canonical owners.

They should **not** become copies of the entire pipeline manual.

A TOC can help humans on a large agent file, but it does not reduce the amount of role instruction loaded into the role.

The preferred fix for an oversized agent is usually **distribution of concerns**, not merely adding navigation.

---

## 3.2 Agent Skill / pipeline Skill

A Skill should own a reusable workflow or procedure.

The main SKILL.md should act as:

- workflow entry point,
- compact operating contract,
- navigation hub,
- state/routing definition when that is its canonical responsibility.

Move optional, role-specific, host-specific, historical, or edge-case material to directly linked references.

A useful shape:

~~~text
SKILL.md
  ├── core invariants
  ├── states
  ├── routing
  ├── human checkpoints
  ├── critical stop conditions
  └── direct links to one-level references
~~~

Do not make the primary Skill an encyclopedia.

At the inspected RSTACK V2.2 reference, pipeline/SKILL.md is about 201 lines / 23 KB. That is not evidence of the installed workplace version or of actual runtime context. Inspect the workplace source separately.

---

## 3.3 Reference files

References are where detailed declarative contracts belong.

Examples:

- schemas,
- write-boundary matrices,
- approval policy,
- candidate identity fields,
- host capability notes,
- risk definitions,
- worked examples.

For a reference longer than about 100 lines:

- add a compact TOC near the top,
- make headings highly descriptive,
- keep the relevant section reachable directly from the main Skill,
- avoid chains where one reference requires another reference which requires another.

Prefer:

~~~text
SKILL.md
  ├── references/handoff-contracts.md
  ├── references/write-boundaries.md
  ├── references/approvals.md
  └── references/recovery.md
~~~

Avoid:

~~~text
SKILL.md
  ↓
reference-a.md
  ↓
reference-b.md
  ↓
reference-c.md
~~~

The purpose of a reference is **progressive disclosure**, not moving one giant instruction bundle into another directory.

---

## 3.4 Model configuration

Model-routing files should be declarative.

They should contain things such as:

- role → intended model,
- optional effort/reasoning setting,
- host selector,
- fallback policy if explicitly approved.

They should not contain long prose explaining why the model was chosen.

Put rationale and experiment evidence in evaluation/design documentation.

Example:

~~~yaml
planner:
  model: Claude Opus 5
  effort: high

plan_auditor:
  model: GPT-5.6 Sol
  effort: high
~~~

This configuration says what is intended.

It does **not** prove what the host actually executed. Effective model/effort still needs host evidence where an evaluation depends on it.

---

## 3.5 Scripts, hooks, validators, and host controls

Objective rules should move here when practical.

Examples:

- candidate SHA comparison,
- required artifact existence,
- schema validation,
- allowed result token,
- plan digest equality,
- test-lock integrity,
- path classification,
- legal state transition,
- required fields,
- stale-evidence detection.

Do not use 25 lines of prose to instruct a model to perform a comparison that a deterministic function can perform exactly.

Keep semantic responsibility with an agent only when judgment is genuinely required.

---

## 3.6 History, rationale, incidents, and research

These belong in:

- ADRs,
- changelogs,
- review reports,
- evaluation results,
- experiment records,
- design documents.

They should normally be absent from runtime role context.

A rule may exist because of a painful historical incident.

The runtime role generally needs the **rule and consequence**, not the entire incident narrative.

---

# 4. Degrees of freedom: the main hardening principle

Instruction strength should match decision type.

Use three practical levels plus human authority.

---

## Level 0 — LOW FREEDOM: deterministic behavior

Use when there is one objectively correct operation or a finite exact rule.

Examples:

~~~text
- Does the candidate SHA equal the expected SHA?
- Does this artifact exist?
- Is the result token in the allowed set?
- Does the plan digest match the audited digest?
- Is a protected test hash unchanged?
- Is the transition legal from this state?
~~~

Preferred mechanism:

~~~text
script / validator / hook / host policy
~~~

The agent may receive the result.

The agent should not be asked to creatively interpret the rule.

### Bad

~~~markdown
Before continuing, carefully make sure the candidate appears to be the same
candidate that was verified. Consider the SHA and other evidence...
~~~

### Better

~~~text
candidate-match validator → PASS | BLOCKED
~~~

Agent instruction:

~~~markdown
A BLOCKED candidate match stops advancement. Do not override it.
~~~

That is stronger control with less prose.

---

## Level 1 — MEDIUM FREEDOM: constrained semantic decision

Use when interpretation is needed but the output space is intentionally narrow.

Examples:

- classify a finding,
- determine failure ownership from evidence,
- map a requirement to a proof obligation,
- produce a structured handoff,
- identify which plan claim a finding challenges.

Use:

- explicit input contract,
- small label set,
- structured output,
- evidence reference,
- stop/unknown option.

Example:

~~~json
{
  "finding_id": "AF-3",
  "claim_ref": "PC-7",
  "classification": "UNSUPPORTED_CLAIM",
  "evidence_refs": ["E-12"],
  "materiality": "HIGH",
  "resolution_condition": "Establish callers across the declared scope or narrow the claim."
}
~~~

Do not force the model to write a long essay when a structured semantic result is sufficient.

---

## Level 2 — HIGH FREEDOM: genuine reasoning

Use when multiple valid approaches exist and expert judgment is the value of the role.

Examples:

- Planner determining implementation strategy from requirements and repository evidence,
- Auditor looking for omitted assumptions and counterexamples,
- Reviewer tracing reachable defects and architectural risk,
- Tester designing a discriminating proof for a complex behavioral requirement.

Do not over-specify these roles until they become deterministic scripts disguised as LLM prompts.

Provide:

- objective,
- boundaries,
- evidence requirements,
- output contract,
- critical stop conditions.

Leave room for the model to reason.

### Bad

~~~markdown
Run these 23 searches in this exact order, then inspect exactly these five
categories, then always create these six subsections...
~~~

when the task is genuinely exploratory.

### Better

~~~markdown
Establish every consequential claim from primary evidence. Search wide enough
to support the claim's declared scope. Preserve uncertainty where evidence is
incomplete. Return only material plan findings with exact evidence.
~~~

The evaluator should measure whether the model actually performs this well.

---

## Human-owned decisions

Keep decisions with humans when they concern:

- product intent not established by evidence,
- scope authorization,
- policy exceptions,
- irreversible/high-impact external actions,
- acceptance of material residual risk,
- ambiguous authority.

A stronger model is not a substitute for human ownership.

---

# 5. Escalation architecture

Prefer this decision stack:

~~~text
INPUT / STATE
      │
      ▼
LEVEL 0
deterministic checks
      │ unresolved semantic question
      ▼
LEVEL 1
constrained semantic decision
      │ uncertainty / complex reasoning
      ▼
LEVEL 2
deep reasoning agent
      │ human-owned decision / material unresolved risk
      ▼
HUMAN
~~~

Do not start every decision at Level 2.

Do not force every decision into Level 0.

Use the least-complex mechanism that can make the decision reliably.

---

# 6. Progressive disclosure architecture for RSTACK

Recommended runtime hierarchy:

~~~text
GLOBAL FLOOR
small universal invariants
       │
       ▼
ROLE AGENT
role-specific permanent contract
       │
       ▼
SKILL
procedure relevant to current work
       │
       ▼
DIRECT REFERENCE
schema / policy / specialized detail
       │
       ▼
SCRIPT / TOOL
deterministic execution or verification
~~~

Historical and design material remains outside the hot path.

## Example — Developer

### Always local

~~~markdown
Purpose: implement approved behavior.
May write: production source.
Must not write: controlled tests, proof, governance.
Stop when: plan/test conflict, missing dependency authority, same approach fails twice.
Return: UNITS_GREEN or STOPPED with owner.
~~~

### Read only when needed

~~~text
write-boundaries.md
exception policy
repository instructions
specific plan
specific failing proof
~~~

### Deterministic

~~~text
role-guard
test-lock verify
candidate identity
~~~

The Developer does not need the complete release procedure, Reviewer rubric, Planner interview method, and every historical incident.

---

# 7. TOC and navigation rules

Use a TOC where navigation value is real.

## Long references

For references above about 100 lines, start with something like:

~~~markdown
# Handoff Contracts

## Contents

- Universal result envelope
- Planner → Auditor
- Auditor → Planner
- Tester verification result
- Candidate record
- Review packet
- Approval/publication record
- Retention and history
~~~

Use descriptive headings so a model can retrieve the right section.

## Main Skill

A TOC can still help, but the primary optimization should be **moving optional content out of the main Skill**.

Do not keep a 700-line Skill merely because line 1 contains a good index.

## Agent files

A TOC is optional for maintainability.

Do not treat it as a context optimization.

If an agent requires a large TOC, first ask whether unrelated concerns belong elsewhere.

---

# 8. One-level references and direct links

Every important optional reference should be linked directly from the runtime file that may need it.

Prefer:

~~~markdown
External publication → approvals.md
Candidate freshness → candidate-freshness.md
Unknown side effects → recovery.md
~~~

Avoid:

~~~markdown
See the references folder for details.
~~~

Also avoid deep discovery chains.

A reference should not be a treasure hunt.

---

# 9. Canonical ownership: one full rule, many short reminders

For each concern establish one normative owner.

Example:

~~~text
write-boundaries.md
    = complete write-lane contract

developer.agent.md
    = Production only; never tests. See write-boundaries.

tester.agent.md
    = Tests/evidence only; never production. See write-boundaries.

pipeline/SKILL.md
    = routes on boundary result; does not duplicate lane matrix
~~~

This reduces contradiction risk.

If multiple files contain the same full rule, classify that as architectural debt.

---

# 10. Convert prose into real controls carefully

For each instruction ask:

> Can this be enforced or validated objectively?

If yes, consider code.

| Current prose concern | Better owner |
|---|---|
| Plan digest matches audited plan | deterministic validator |
| Role wrote forbidden file | host permission or boundary checker |
| Missing required artifact | deterministic state predicate |
| Result token legal | schema/validator |
| Candidate changed after review | freshness check |
| PR target/head matches approved intent | remote readback |
| Plan is grounded and complete | Planner/Auditor semantic judgment |
| Test genuinely proves requirement | Tester/Reviewer semantic judgment |
| Product behavior choice | human decision |

The goal is not to eliminate LLMs.

The goal is to reserve LLM reasoning for questions that require it.

---

# 11. Checklist guidance

Use checklists for ordered operations where missing a step is dangerous.

Example:

~~~markdown
Before publication:
- [ ] Candidate identity re-derived.
- [ ] Review packet digest current.
- [ ] Release predicate satisfied.
- [ ] Exact external action shown to human.
- [ ] Human decision bound to action and candidate.
- [ ] Remote result read back after action.
~~~

When an item is machine-verifiable, the checklist should reference the machine result rather than ask the model to re-derive it from prose.

Avoid giant universal checklists that every agent reads.

Keep checklists near the procedure they govern.

---

# 12. Validation and self-correction loops must be bounded

Feedback loops are useful.

Unbounded semantic debate is not.

Safe deterministic loop:

~~~text
generate structured record
  ↓
schema validator
  ↓ invalid
correct format
  ↓
validate once more
~~~

Potentially expensive semantic loop:

~~~text
Planner ↔ Auditor ↔ Planner ↔ Auditor...
~~~

For semantic disagreement:

- define maximum meaningful rounds,
- distinguish transport retry from substantive review,
- stop when no new evidence is being added,
- send human-owned decisions to the human,
- preserve unresolved disagreement honestly.

Do not optimize for consensus.

Optimize for a correct, actionable decision basis.

---

# 13. Model-specific instruction design

Do not assume one instruction set works equally well for all models.

For every role/model combination intended for deployment, evaluate:

- instruction adherence,
- unnecessary elaboration,
- omitted constraints,
- correct reference retrieval,
- tool use,
- uncertainty handling,
- structured-output conformance,
- downstream rework.

A stronger model may need less procedural scaffolding.

A smaller model may need more explicit structure.

Do not change model and prompt architecture simultaneously when you need to attribute the result.

Relevant current RSTACK model work is owned by:

- RSTACK-MODEL-EFFORT-ALLOCATION-REVIEW.md
- ../MODEL-ALLOCATION-TRIAL.md

This guide does not select models.

---

# 14. Example refactor — verbose Planner guidance

## Before

~~~markdown
When planning, remember that repository claims need evidence. You should always
check references carefully. You should make sure searches are broad. You should
not assume absence. You should think about callers. You should also look at the
README but remember README is not source evidence. If there are siblings...
[several paragraphs]
~~~

## After — local Planner contract

~~~markdown
## Grounding

Every material statement about existing behavior must have primary evidence.
Negative claims state repository/ref/search scope; an incomplete search remains
UNKNOWN. Cross-repository claims require an established dependency.

For the investigation procedure, use plan-grounding.
For repository topology, use references/estate-layout.md.
~~~

The Skill/reference owns examples and search procedure.

---

# 15. Example refactor — long pipeline Skill

## Before

~~~text
SKILL.md
  - states
  - routing
  - test lock internals
  - write-boundary matrix
  - publication recovery
  - host-specific caveats
  - historical incidents
  - detailed examples
  - every artifact schema
~~~

## After

~~~text
pipeline/SKILL.md
  - invariants
  - states
  - routing
  - freshness
  - human checkpoints
  - stop conditions
  - direct reference map

references/
  - handoff-contracts.md
  - write-boundaries.md
  - approvals.md
  - recovery.md
  - host-profile.md

scripts/
  - gate
  - role guard
  - lock validator
  - schema validators
~~~

The main Skill becomes the control map.

References carry detail.

Scripts own objective checks.

---

# 16. Example refactor — long reference

## Before

A 350-line reference with descriptive prose and no navigation.

## After

~~~markdown
# Evidence Contracts

## Contents
- Result envelope
- AC evidence
- Test execution evidence
- Candidate evidence
- Review evidence
- Publication evidence

## Result envelope
...

## AC evidence
...
~~~

The calling Skill links directly to the relevant section or file.

Where sections become independently useful and large, split them into one-level sibling references.

---

# 17. Example refactor — model configuration

## Bad

~~~markdown
The Planner should use Opus because it is very strong and in our prior analysis
we felt that planning was important...
~~~

inside runtime configuration.

## Better

~~~yaml
planner:
  model: Claude Opus 5
  effort: high
~~~

Rationale lives in experiment documentation.

Observed effective routing lives in run metadata/evaluation evidence.

---

# 18. What Claude 5 should analyze before changing anything

Before refactoring runtime instructions:

1. Inspect the **actual workplace source** and generated/installed copies.
2. Identify canonical source versus generated duplicate.
3. Inventory every agent, Skill, reference, script, hook, and global instruction.
4. Measure lines, characters, headings, references, and duplicated normative rules.
5. For every section classify:
   - KEEP_LOCAL,
   - MOVE_TO_SKILL,
   - MOVE_TO_REFERENCE,
   - MOVE_TO_SCRIPT_OR_HOOK,
   - MOVE_TO_GLOBAL_RULE,
   - MOVE_TO_HISTORY,
   - DELETE_DUPLICATE,
   - UNKNOWN.
6. Assign degree of freedom:
   - L0 deterministic,
   - L1 constrained semantic,
   - L2 full reasoning,
   - HUMAN.
7. Identify every reference chain deeper than one level.
8. Identify references over about 100 lines that lack a usable TOC.
9. Identify main Skills that have become broad manuals instead of focused workflow contracts.
10. Identify agent prompts carrying responsibilities owned by other roles.
11. Identify rules repeated because runtime enforcement is weak.
12. Produce a before/after ownership map before editing.

Do not refactor based only on line count.

---

# 19. Application order

After explicit approval to implement:

## Phase A — no-behavior-change structure cleanup

- add navigation to long references,
- repair direct links,
- remove historical prose from runtime files,
- deduplicate exact shared rules,
- preserve semantics.

## Phase B — progressive disclosure

- shrink main Skills to core flow,
- move optional detail to one-level references,
- shrink agent files to role-local contracts,
- ensure every moved rule remains discoverable when needed.

## Phase C — deterministic hardening

- move objective checks into scripts/validators/host boundaries,
- leave concise local consequences in agent instructions,
- test failure/recovery behavior.

## Phase D — degrees-of-freedom tuning

- reduce over-prescription in L2 reasoning roles,
- constrain L1 classifications,
- remove LLM judgment from L0 rules,
- retain human authority for human-owned decisions.

Do not combine every phase into one unreviewable rewrite.

---

# 20. Success criteria

A successful refactor should produce:

- fewer duplicated normative rules,
- smaller hot-path instruction context,
- clearer canonical ownership,
- shallower reference graph,
- TOCs/navigation on long references,
- more deterministic enforcement for objective rules,
- clearer semantic freedom where reasoning is valuable,
- no loss of required safety/authority boundaries,
- equal or better behavioral evaluation results,
- lower or equal total effort after downstream rework is counted.

Do not claim improvement from smaller files alone.

The paired evaluation plan is:

RSTACK-INSTRUCTION-ARCHITECTURE-EVAL-PLAN.md

---

# 21. Claude 5 execution assignment

When this guide is given to Claude 5:

## Analysis pass

Produce one review containing:

1. current instruction architecture,
2. canonical-owner map,
3. degree-of-freedom classification,
4. progressive-disclosure problems,
5. deep-reference problems,
6. long-reference TOC gaps,
7. deterministic-control candidates,
8. proposed file moves/deletions,
9. behavioral risks,
10. smallest refactor batches.

Do not edit runtime files during this analysis unless the user explicitly authorizes implementation.

## Implementation pass

After explicit authorization:

- change canonical authored sources,
- update generated copies only through the real supported process,
- preserve unrelated work,
- keep each batch small,
- run the paired tests,
- report before/after size and behavioral evidence,
- stop if a moved rule becomes unreachable or a test reveals degraded behavior.

Do not create a new version directory merely to avoid updating the canonical source.

---

# 22. Primary references

These public references motivate the architecture principles but do not prove RSTACK runtime behavior:

- Anthropic Agent Skills best practices:
  https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Anthropic engineering — Agent Skills / progressive disclosure:
  https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- VS Code Agent Skills:
  https://code.visualstudio.com/docs/agent-customization/agent-skills
- VS Code Custom Agents:
  https://code.visualstudio.com/docs/agent-customization/custom-agents
- VS Code Chat Debug View / agent troubleshooting:
  https://code.visualstudio.com/docs/agents/agent-troubleshooting/chat-debug-view
- Simon Scrapes video, Everything You Know About Skills IS OUTDATED:
  https://youtu.be/e7TY56-yIvM

Treat vendor guidance as design evidence, not proof that the current workplace host loads or enforces instructions exactly the same way.

---

# Decision principle

> **Runtime instruction architecture should maximize control by minimizing ambiguity—not by maximizing prose.**

Give reasoning agents freedom where judgment creates value. Constrain classification where a finite semantic answer is needed. Use deterministic code where the answer is objective. Keep human-owned decisions with humans. Load detailed guidance only when the current task actually needs it.
