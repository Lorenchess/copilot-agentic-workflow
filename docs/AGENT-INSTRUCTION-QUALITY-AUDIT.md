# Agent Instruction Quality Audit

Use this document to audit every agent instruction file in the repository and evaluate whether the pipeline's agent contracts are clear, minimal, enforceable, and maintainable.

## Audit instructions

Review every `AGENTS.md`, `agents.md`, `*.agent.md`, agent instruction file, and any reference files those agents depend on.

**Do not modify anything during the audit.** This phase is analysis only.

Base every conclusion on evidence found in the repository. For every finding:

- cite the exact file;
- cite the relevant section or lines;
- distinguish confirmed evidence from inference;
- do not claim a problem simply because something could theoretically be improved;
- prefer concrete contradictions, ambiguity, duplication, ownership overlap, missing boundaries, or unnecessary context over stylistic preference.

The objective is **not** to make files shorter for its own sake. The objective is to reduce ambiguity, duplication, conflict, unnecessary context, and prompt-only enforcement while preserving all behaviorally important constraints.

A critical rule must never exist only inside an example. Examples may teach interpretation, but required behavior must remain in explicit instructions or be enforced programmatically.

---

## Audit questions

### 1. Primary responsibility

What is the single primary responsibility of each agent?

Can you express its job in one or two sentences from the existing instructions?

If not, identify exactly which instructions make its responsibility unclear.

### 2. Minimum mandatory contract

Which instructions are truly mandatory for the agent to perform its role correctly?

Identify the minimum set of rules that must remain in the agent's main instruction file.

### 3. Candidate reference material

Which instructions are not core behavioral rules and could instead be moved into reference documentation?

Specifically identify:

- explanations;
- background information;
- procedures;
- domain knowledge;
- edge-case discussions;
- lengthy rationale;
- schemas;
- other material that the agent could load only when needed.

### 4. Examples disguised as instructions

Which parts of the file are actually examples rather than instructions?

Could those be moved into separate `examples/`, `good-examples.md`, `bad-examples.md`, or similar files without weakening the agent's contract?

### 5. Exact or near duplication

Are there instructions that repeat the same rule using different wording?

Show every meaningful duplication and identify which version is the clearest canonical rule.

### 6. Partial overlap

Are there instructions that partially overlap but are not exactly equivalent?

Could an LLM interpret those overlapping rules differently?

Show the exact rules involved.

### 7. Contradictions

Are there any direct or indirect contradictions?

For example, does one instruction tell the agent to act autonomously while another requires human approval for the same class of action?

Do not claim a contradiction unless both sides can be demonstrated from repository evidence.

### 8. Precedence problems

Are there precedence problems?

If two instructions apply simultaneously, does the agent know which one wins?

Identify places where explicit priority or precedence would be necessary.

### 9. Cross-agent responsibility duplication

Are responsibilities duplicated between agents?

Identify cases where two or more agents appear authorized to own the same:

- decision;
- artifact;
- validation step;
- approval;
- state transition;
- external action.

### 10. Cross-role leakage

Are there rules in this agent file that actually belong to another agent?

Identify cross-role leakage such as:

- Planner implementation rules;
- Developer planning rules;
- Reviewer ownership rules;
- Orchestrator domain logic;
- Auditor implementation ownership;
- Approval behavior embedded in execution agents.

### 11. Negative boundaries

Does the agent have a clear definition of what it is **not** allowed to do?

Are those boundaries concise and unambiguous, or scattered throughout the file?

### 12. Start and finish conditions

Does the agent know exactly when its work starts and when it is finished?

Identify:

- inputs;
- prerequisites;
- required outputs;
- completion criteria;
- handoff destination;
- stop conditions.

### 13. Deterministic outputs

Are the output requirements deterministic enough?

Could two executions following the same instructions produce structurally incompatible handoffs?

Identify ambiguous output requirements.

### 14. Unverifiable instructions

Are there instructions that cannot actually be enforced or verified?

For example:

- "be thorough";
- "ensure quality";
- "think carefully";
- "make the best decision";
- "use good judgment".

Identify these and determine whether a concrete observable requirement already exists elsewhere.

### 15. Mechanically checkable rules

Which rules can be checked mechanically?

Identify instructions that could be enforced by:

- schemas;
- hooks;
- scripts;
- tests;
- state-machine guards;
- CI checks;
- validators;
- permissions;
- static checks.

### 16. Prose that should be architecture

Are we using prose instructions for something that should instead be architecture?

Identify constraints that would be stronger if enforced by:

- permissions;
- write boundaries;
- tool restrictions;
- routing logic;
- schemas;
- pipeline state;
- capability isolation.

### 17. Always-loaded context cost

How much of the agent's main file must the model keep in working context even when most of it is irrelevant to the current task?

Identify large sections that are conditionally relevant rather than universally relevant.

### 18. Buried critical rules

Are important instructions buried among low-priority information?

Identify critical rules that could easily be lost because they appear inside long explanations or large lists.

### 19. Normative vs non-normative examples

Are examples clearly marked as non-normative examples?

Could the model accidentally interpret an example as a universal rule?

Show any examples where this risk exists.

### 20. Missing examples for difficult decisions

Do the examples actually cover the difficult decisions the agent is expected to make?

Identify important decision boundaries for which there is currently no good example or counterexample.

### 21. Good-example / bad-example opportunities

Would adding a good-example/bad-example pair clarify any ambiguous rule better than adding more prose?

Identify the exact rule and describe what type of example would help.

Do not write the example yet.

### 22. Overuse of negative instructions

Are negative instructions overused?

Identify long collections of "do not" rules that could instead be represented by one:

- positive boundary;
- capability restriction;
- invariant;
- permission rule;
- architectural control.

### 23. Exception explosion

Are there too many exceptions to individual rules?

Identify rules whose exception lists are large enough that the underlying abstraction may be wrong.

### 24. Mixed concerns

Does the file mix policy, workflow, domain knowledge, examples, and implementation details together?

Classify the major sections into:

- **core agent contract**;
- **workflow/process**;
- **reference knowledge**;
- **examples**;
- **enforcement/validation**;
- **historical/rationale material**.

### 25. Global rules duplicated locally

Which instructions are global pipeline rules that should not be duplicated inside every agent?

Identify rules that appear across multiple agent files and should potentially have one canonical owner.

### 26. Change-amplification risk

If a global rule changes, how many agent files would currently need to be edited?

Identify duplicated policy that creates maintenance or drift risk.

### 27. Reference retrieval conditions

Are references from the main agent file explicit enough?

Does the agent know **when** it should consult each reference file, or are reference documents simply listed without retrieval conditions?

### 28. Extraction safety classification

Could moving content out of the main file accidentally hide a rule the agent needs on every execution?

For every proposed extraction, classify it as:

- **ALWAYS REQUIRED** — keep in agent contract;
- **CONDITIONAL** — move to reference and specify when to read it;
- **EXAMPLE** — move to examples;
- **ENFORCEMENT** — implement outside the prompt where possible.

### 29. Missing contract information

What information is currently missing from the agent's contract?

Look specifically for unclear:

- authority;
- unavailable actions;
- write boundaries;
- escalation conditions;
- approval requirements;
- failure handling;
- retry behavior;
- external side-effect handling;
- handoff guarantees;
- state-transition ownership.

### 30. 50% reduction test

If you were forced to reduce this agent's main instruction file by 50%, what could be removed without changing the intended behavior?

Do **not** rewrite the file.

Identify candidate sections and justify each removal using the existing architecture.

### 31. Non-removable invariants

Conversely, what information must absolutely **not** be removed or delegated to examples?

Identify the smallest set of invariants necessary to preserve:

- safety;
- routing;
- ownership;
- approval boundaries;
- write boundaries;
- handoff correctness;
- deterministic behavior.

### 32. Contract structure comparison

Would the resulting structure be easier for an LLM to follow if organized as:

`Role → Authority → Inputs → Required Process → Invariants → Outputs → Stop/Escalation Conditions → References`

Compare that structure with the current file using repository evidence.

### 33. Highest-risk instruction complexity

What are the top five places where instruction complexity is most likely to cause agent mistakes?

Rank these only by evidence such as:

- contradiction;
- ambiguity;
- duplication;
- scattered ownership;
- excessive conditional logic;
- unclear precedence;
- hidden critical rules.

Do not rank based on subjective stylistic preference.

### 34. Recommended disposition per agent

For each agent, recommend one or more of these outcomes:

- `KEEP AS-IS`
- `SIMPLIFY MAIN CONTRACT`
- `MOVE MATERIAL TO REFERENCES`
- `MOVE MATERIAL TO EXAMPLES`
- `ENFORCE OUTSIDE THE PROMPT`

Explain exactly why each recommendation is supported by repository evidence.

### 35. Smallest viable instruction architecture

Finally, propose the smallest viable instruction architecture for the repository **without rewriting the files yet**.

Show which material should live in:

- agent file;
- shared pipeline rules;
- reference files;
- examples;
- programmatic enforcement.

---

## Required final audit table

End the audit with a table containing:

| Agent | Current complexity problem | Evidence | Keep in main contract | Move to reference | Move to examples | Enforce programmatically | Missing rule | Priority |
|---|---|---|---|---|---|---|---|---|

Every row must be traceable to repository evidence.

---

## High-priority questions

If time or context is constrained, answer these first:

1. **Question 2** — Minimum mandatory contract
2. **Question 7** — Contradictions
3. **Question 8** — Precedence problems
4. **Question 15** — Mechanically checkable rules
5. **Question 24** — Mixed concerns
6. **Question 28** — Extraction safety classification
7. **Question 31** — Non-removable invariants

---

## Core principle

**Critical behavior belongs in explicit instructions or enforcement. Examples teach interpretation; they must never be the only place where a critical rule exists.**

For this pipeline, pay special attention to:

- ownership;
- approval gates;
- write boundaries;
- handoff contracts;
- routing;
- external side effects;
- unknown external effects;
- retry behavior;
- state transitions;
- stop conditions;
- escalation conditions;
- human checkpoints;
- evidence requirements.

These are contract-level or enforcement-level concerns and should not depend on an LLM inferring a rule from an example.
