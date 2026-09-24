# Agent Markdown Refactor Guidance

## Purpose

This document guides an agent that is evaluating and refactoring RSTACK agent Markdown files.

The primary goal is **not to make the prompts more complete by continuously adding instructions**.

The goal is to make each agent file contain only the information that agent must know **at execution time**, while moving shared policy, procedures, schemas, examples, history, and deterministic enforcement to the right owners.

A good refactor should normally make an agent file:

- shorter,
- more role-specific,
- easier to scan,
- less repetitive,
- less dependent on prose for enforcement,
- less likely to contradict another file,
- and cheaper to load into the model's context.

A 300+ line agent file is not automatically wrong, but it is a strong signal to check whether several concerns have been collapsed into one prompt.

---

# 1. The core design rule

Use this hierarchy:

```text
ONE CANONICAL OWNER
        ↓
OPTIONAL MACHINE ENFORCEMENT
        ↓
SHORT LOCAL REMINDER
```

Avoid this:

```text
full rule in agent
+
full rule in pipeline skill
+
full rule in reference
+
full rule in global instructions
+
full rule in another agent
+
script that partially implements a different version
```

A rule may be mentioned in more than one place, but only one location should contain the full normative definition.

Other files should link to that owner and state only the consequence that matters to the current role.

---

# 2. What belongs in an agent file

An agent file should primarily answer six questions.

## 2.1 Why does this role exist?

State the unique responsibility in a few sentences.

Examples:

- Planner turns requirements and repository evidence into an implementation plan.
- Tester owns proof design and controlled tests.
- Developer changes production behavior but does not define or weaken the proof.
- Reviewer performs a fresh independent semantic review.
- Orchestrator routes work and owns workflow state but does not perform engineering judgment.

If the responsibility cannot be stated clearly, the role may be carrying too many concerns.

## 2.2 What inputs may the role receive?

List the minimum required inputs.

Prefer artifact references and exact paths over repeated narrative context.

Example:

```text
Inputs:
- plan.md
- ac.tsv
- candidate identity
- failing test evidence
```

Do not copy the entire schema or procedure into the agent if a reference owns it.

## 2.3 What may the role write?

State the role-local write boundary concisely.

Example:

```text
May write:
- production source
- its assigned run artifact

Must not write:
- controlled tests
- pipeline governance
- release authorization
```

The canonical write-lane table should live in one shared reference, not be fully repeated in every agent.

## 2.4 What tools/capabilities does it need?

Keep only role-relevant tool guidance.

Do not duplicate a global explanation of the host, sandbox, hooks, or permissions unless the role has a unique constraint.

## 2.5 What must the role return?

Define the required handoff/result.

Example:

```text
Return:
- verdict
- artifact path
- blockers
- next owner
```

The full artifact schema should live in a shared handoff/schema reference.

## 2.6 When must it stop or escalate?

This is one of the most useful things to keep directly in the agent.

Examples:

- material requirement ambiguity,
- unavailable evidence,
- out-of-lane write required,
- candidate changed,
- human decision needed,
- external effect result unknown.

Keep the local stop condition. Do not repeat the entire pipeline recovery algorithm if the pipeline skill owns it.

---

# 3. What usually does NOT belong in an agent file

Move these out unless they are uniquely required for that role.

## 3.1 Full pipeline orchestration

Phase order, transition routing, retries, loops, and recovery belong in the pipeline skill or deterministic controller.

An agent should know:

- what phase it owns,
- what it receives,
- what it returns,
- what blocks it.

It should not carry the complete operating manual for every other phase.

## 3.2 Full artifact schemas

Schemas belong in a shared reference such as:

```text
references/handoff-contracts.md
```

The agent should point to the schema and mention only the fields it uniquely owns.

## 3.3 Full write-boundary tables

Canonical owner:

```text
references/write-boundaries.md
```

Agent files should contain a short local reminder.

Bad:

```text
200 lines explaining every role's write permissions
```

Better:

```text
You may write production source and your implementation artifact.
You may not edit controlled tests.
See references/write-boundaries.md.
```

## 3.4 Global external-action policy

Canonical owner should be a shared approvals/process reference.

Agent files should say only what they need locally.

Example:

```text
Do not publish. Return the prepared action to the release stage.
```

Do not paste the complete push / PR / Jira / deploy policy into every role.

## 3.5 Evidence vocabulary and proof theory

The full evidence ladder, verdict definitions, and proof guidance should live in one proof skill/reference.

The agent may state the local floor:

```text
Do not claim VERIFIED without the required evidence.
INCONCLUSIVE is not a pass.
```

Then reference the canonical proof contract.

## 3.6 Host-specific setup details

Examples:

- which Copilot surface supports a hook,
- Bitbucket branch settings,
- VS Code preview behavior,
- installation layout,
- MCP availability.

These belong in team-adoption / host-profile documentation.

An agent file should not grow every time a host capability changes.

## 3.7 Historical incident narratives

Statements such as:

- "this used to say...",
- "observed on a real run...",
- "the previous version failed because...",
- dated migration stories,

are valuable design history but should normally live in:

- changelog,
- ADR/design decisions,
- regression tests,
- harness ledger,
- learnings for maintainers.

Do not make every future agent reread historical incidents on every execution.

## 3.8 Long examples

One compact good example and one compact bad example may help.

A catalog of examples should move to a reference or skill.

## 3.9 Detailed shell choreography

If a deterministic script owns the sequence, point to the script/skill.

Do not force an LLM to reproduce a fragile multi-command algorithm from prose when ordinary code can own it.

---

# 4. Recommended responsibility distribution

A healthy RSTACK content layout should resemble:

```text
agents/
    role-specific responsibilities only

pipeline/
    SKILL.md
        workflow states
        transitions
        loops
        freshness
        routing
        human checkpoints
        artifact path map

references/
    handoff-contracts.md
        artifact schemas

    write-boundaries.md
        canonical file ownership

    approvals.md
        external-action and authorization policy

    estate-layout.md
        repository topology

    instruction-precedence.md
        authority / host-loading semantics

    risk-tiers.md
        review / impact depth only

    plan-interview.md
        fact-vs-decision interview method

    discovery-cost.md
        provenance and measurement

    team-adoption.md
        host/team-specific setup and capabilities

skills/
    detailed procedures loaded only when needed
        planning
        proof/evidence
        AC mapping
        test design
        impact analysis
        review
        publication

global instructions/
    only universal invariants

scripts / hooks / host policy/
    deterministic enforcement and observability

docs / ADR / changelog/
    history, rationale, experiments, rejected alternatives
```

The exact names may differ. The separation of concerns matters more than the directory names.

---

# 5. Agent files should be hot-path optimized

Agent Markdown is execution context.

Every line loaded into the agent competes with:

- repository evidence,
- ticket content,
- tool results,
- tests,
- plans,
- runtime observations.

Therefore treat prompt space as an engineering resource.

For each paragraph ask:

> Does this role need this information to make a better decision right now?

If not, move it to an on-demand reference or remove it.

A shorter agent with a precise role plus good retrieval often performs better than a larger agent containing every lesson ever learned.

---

# 6. Suggested size heuristics

These are heuristics, not hard gates.

## Preferred ranges

- Narrow execution agent: roughly **40–120 lines**
- Complex reasoning agent: roughly **80–180 lines**
- Agent above **200 lines**: inspect carefully for mixed concerns
- Agent above **300 lines**: require an explicit justification for why the content cannot be distributed

Do not game the metric by compressing 300 lines into unreadable long paragraphs.

The real goal is fewer distinct instructions and less irrelevant context.

A file may legitimately exceed these ranges when the role truly owns a complex semantic procedure that cannot be cleanly moved elsewhere.

---

# 7. Refactoring process for an evaluator agent

When reviewing an existing agent file, do NOT begin by rewriting it.

First classify every section.

Use these categories:

```text
KEEP_LOCAL
MOVE_TO_REFERENCE
MOVE_TO_SKILL
MOVE_TO_PIPELINE
MOVE_TO_GLOBAL_RULE
MOVE_TO_SCRIPT_OR_HOOK
MOVE_TO_HISTORY
DELETE_DUPLICATE
UNCLEAR_OWNER
```

Then produce an ownership table.

Example:

| Current section | Classification | Canonical owner | Local reminder needed? |
|---|---|---|---|
| role purpose | KEEP_LOCAL | agent | yes |
| all phase routing | MOVE_TO_PIPELINE | pipeline/SKILL.md | no |
| test lock details | MOVE_TO_REFERENCE / SCRIPT | test-lock owner | short reminder |
| full approvals policy | MOVE_TO_REFERENCE | approvals.md | one sentence |
| historical incident | MOVE_TO_HISTORY | ADR/changelog | no |
| output schema | MOVE_TO_REFERENCE | handoff-contracts.md | path only |

Only after the ownership map is clear should the file be rewritten.

---

# 8. The default direction is reduction, not addition

When asked to "improve", "fine tune", or "harden" an agent Markdown file:

**Do not assume improvement means adding instructions.**

Before adding a new rule, ask:

1. Is this rule already stated elsewhere?
2. Is this actually this role's responsibility?
3. Can the host or a deterministic script enforce it?
4. Is this an example rather than a rule?
5. Is this historical rationale?
6. Can a shared reference own it?
7. Can a skill load it only when needed?
8. Does the rule prevent a demonstrated failure?
9. Would deleting or consolidating an existing rule solve the same problem?

A refactor that adds 40 lines and removes none should be treated as suspicious unless a real missing responsibility was discovered.

---

# 9. Require a line/complexity budget for refactors

For every proposed agent refactor, report:

```text
Before:
- lines
- characters
- headings
- unique normative rules

After:
- lines
- characters
- headings
- unique normative rules

Moved out:
- references
- skills
- scripts
- history

Added:
- genuinely new role-local rules
```

A good refactor should usually reduce:

- duplicated rules,
- hot-path tokens,
- number of canonical owners,
- role ambiguity.

It may create or expand a reference file while reducing agent size. That is acceptable because references can be loaded on demand.

Do not optimize only for raw line count.

---

# 10. Preserve behavior while moving text

Moving a rule is not the same as deleting its protection.

For every moved section, verify:

```text
OLD LOCATION
NEW CANONICAL OWNER
WHO READS IT
WHEN IT IS LOADED
WHAT ENFORCES IT
WHAT LOCAL REMINDER REMAINS
```

If moving content means the role will no longer receive an instruction it actually needs, the refactor is incomplete.

The objective is **progressive disclosure**, not hiding important rules.

---

# 11. One canonical owner per concern

The refactorer should explicitly identify ownership for at least:

| Concern | Preferred owner |
|---|---|
| workflow state/transitions | pipeline skill / controller |
| role purpose | agent |
| artifact schema | handoff contracts |
| file-write ownership | write-boundaries |
| external actions / human authorization | approvals |
| evidence semantics | prove-it / evidence reference |
| AC schema | AC contract |
| plan interview method | plan-interview |
| repository topology | estate-layout |
| host capability differences | team-adoption |
| risk/review depth | risk-tiers |
| metrics/provenance | discovery-cost |
| deterministic path checks | script/hook |
| historical rationale | ADR/changelog/ledger |

If two files both claim to be authoritative for the same rule, stop and resolve ownership before adding more text.

---

# 12. Reference files are not dumping grounds

Moving content out of agents does not justify creating one giant reference file.

Each reference should have a single coherent purpose.

Bad:

```text
references/everything-rstack-knows.md
```

Better:

```text
write-boundaries.md
handoff-contracts.md
approvals.md
estate-layout.md
risk-tiers.md
```

A reference should be loaded because the current task needs that concern.

If every agent must read every reference on every run, the context problem has merely moved directories.

---

# 13. Skills versus references

Use a **reference** for stable declarative contracts.

Examples:

- schemas,
- ownership tables,
- evidence vocabulary,
- repository topology,
- authorization policy.

Use a **skill** for a procedure an agent performs.

Examples:

- how to investigate a ticket,
- how to establish proof,
- how to write/validate tests,
- how to perform impact analysis,
- how to prepare publication.

A useful test:

> Is this describing what is true, or teaching a sequence of work?

"What is true" usually belongs in a reference.

"How to do the work" usually belongs in a skill.

---

# 14. Scripts and hooks versus prose

If a rule is:

- deterministic,
- objective,
- cheap to check,
- stable,

prefer executable enforcement.

Examples:

- candidate SHA matches,
- required artifact exists,
- schema parses,
- test lock hash changed,
- wrong repository path,
- protected path edit,
- required check missing.

Do not create scripts for semantic judgments such as:

- whether a test meaningfully proves the requirement,
- whether an architecture choice is appropriate,
- whether a Jira criterion captures human intent.

Those remain agent/human judgment.

Always label the real guarantee honestly:

```text
HOST-ENFORCED
DETERMINISTIC CHECK
PROSE CONTRACT
HUMAN DECISION
AGENT-REPORTED
```

Do not call a self-run post-hoc checker a sandbox.

---

# 15. Avoid defensive instruction accumulation

A common failure pattern is:

```text
incident occurs
→ add paragraph
→ another incident occurs
→ add another paragraph
→ contradictory edge case
→ add exception paragraph
→ agent file becomes 350 lines
```

Instead, when an incident occurs ask:

1. Was the existing rule unclear?
2. Was the rule in the wrong owner?
3. Could a deterministic check prevent it?
4. Is one representative example enough?
5. Is this really historical rationale?
6. Should an old rule be replaced instead of adding a new one?

Prefer replacing an obsolete rule over stacking another exception beneath it.

---

# 16. Examples should teach patterns, not become policy catalogs

Use examples sparingly.

A good example demonstrates a reasoning pattern.

Example:

```text
Bad:
"Existing tests cover the behavior."

Better:
"Test X reaches the method, but its assertions do not discriminate the failure described by AC-2."
```

Do not accumulate twenty examples of similar mistakes in the agent prompt.

Move broader example collections to a skill/reference or regression test suite.

---

# 17. Preserve fresh-context roles

For roles whose value comes from independent judgment, refactoring must preserve context isolation.

Examples:

- Plan Auditor
- Reviewer-Architect

Do not solve duplication by injecting all prior-agent explanations into the fresh role.

Fresh roles may receive:

- approved intent,
- primary evidence,
- candidate identity,
- required artifacts.

They should not receive:

- implementation persuasion,
- planner reasoning transcript,
- prior reviewer conclusions,
- optional memory that biases the independent read.

References may still be available where they define shared contracts.

---

# 18. Refactor the agent, not the architecture, unless asked

An agent-MD cleanup task should not silently:

- add new pipeline phases,
- add new agents,
- change model assignments,
- weaken required review,
- alter publication authority,
- change write ownership,
- invent new host capabilities.

If a cleanup reveals an architecture issue, record it separately as:

```text
ARCHITECTURE QUESTION
```

Do not solve it by adding another 50 lines to the agent.

---

# 19. Evaluation rubric for every agent

For each agent, answer:

## Responsibility
- Is its unique job clear in the first screenful?

## Scope
- Does it describe only its own role?

## Inputs
- Are inputs minimal and explicit?

## Outputs
- Is the handoff clear?

## Boundaries
- Are only local restrictions repeated?

## References
- Does it point to canonical owners instead of duplicating them?

## Context
- Is there historical or host-specific information that can move out?

## Enforcement
- Does it distinguish prose from actual machine enforcement?

## Duplication
- Which rules appear elsewhere?

## Size
- Can at least 20–30% of the file move out without reducing role correctness?

A "no" to the last question is acceptable only with an explanation.

---

# 20. Required output from an agent-file refactor review

Before editing, produce:

## A. Findings

```text
DUPLICATED
WRONG OWNER
HISTORICAL
PROCEDURAL
SCHEMA
HOST-SPECIFIC
ROLE-ESSENTIAL
ENFORCEMENT-OVERCLAIM
```

## B. Proposed distribution

List exactly where each moved concern should go.

## C. Size target

State expected reduction before rewriting.

## D. Invariants to preserve

List the role's protections that must remain true.

## E. Refactored file

Only after A–D are complete.

## F. Post-refactor consistency check

Search other pipeline files for stale copies and contradictions.

---

# 21. Refactoring acceptance criteria

A refactor is successful when:

1. The role's unique responsibility is easier to understand.
2. The agent receives less irrelevant context.
3. No necessary invariant disappears.
4. Shared rules have one canonical owner.
5. Procedures are loaded on demand where practical.
6. Objective rules are not represented as prose-only when a real deterministic owner already exists.
7. Historical explanations are off the execution hot path.
8. No new architecture is introduced accidentally.
9. Cross-file contradictions decrease.
10. The agent file becomes smaller unless a documented missing role responsibility genuinely required new local content.

---

# 22. Strong default for future reviews

When asked:

> "Evaluate and improve this agent.md"

the default interpretation should be:

> **Find what can be removed, consolidated, moved, or mechanically enforced before proposing any new instructions.**

Do not optimize for completeness of prose.

Optimize for:

- clear responsibility,
- correct separation of concerns,
- minimal hot-path context,
- independent evidence where needed,
- deterministic enforcement where possible,
- and one canonical source of truth per rule.

The best agent prompt is not the one that contains everything the organization knows.

It is the smallest prompt that gives that role exactly what it needs to do its job correctly.
