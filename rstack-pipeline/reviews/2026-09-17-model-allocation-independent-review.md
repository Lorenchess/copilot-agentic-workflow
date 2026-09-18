# Model allocation for the V2.2 roles — independent review

Date: 2026-09-17. Transcribed from the reviewer's message to the owner of the same date; tables that arrived as flattened rows were re-flowed into Markdown, wording unchanged. Companion architect analysis: `2026-09-17-model-allocation-analysis.md`.

Configurations compared (Orchestrator / Planner / Plan Auditor):

- **A** (current V2.2 frontmatter): Claude Opus 5 / Claude Sonnet 5 / Claude Opus 5
- **B** (proposed): Claude Sonnet 5 / Claude Opus 5 / GPT-5.6 Sol
- **C** (added by this review): Claude Sonnet 5 / Claude Opus 5 / Claude Opus 5

## 1. Executive assessment

**TEST THE ALTERNATIVE.**

Configuration B has a credible architectural rationale, but its three changes have different levels of support:

- Opus → Sonnet for Orchestrator: plausible, provided Sonnet preserves routing and state integrity.
- Sonnet → Opus for Planner: worth testing, particularly on ambiguous or cross-module tickets.
- Opus → Sol for Plan Auditor: a reasonable experiment, with insufficient evidence to predict better defect detection or fewer false positives.

The strongest hypothesis is moving reasoning capacity toward planning. The weakest is that changing the Auditor's model family automatically improves independence.

I verified that the V2.2 agent frontmatter matches Configuration A. I found no models.json. The separate .github implementation documents a manually selected Sonnet baseline and omits model pins; it should not be confused with the V2.2 candidate. These are configuration declarations, not observations of effective runtime dispatch. (Separate model-routing documentation: `.github/pipeline/MODEL-ROLES.md`, line 19.)

The evidence supports an experiment, not immediate adoption. Neither the inspected repository evidence nor the public sources reviewed establishes a winner for these exact assignments.

## 2. Orchestrator analysis

Capability sensitivity: MEDIUM overall. Deep engineering reasoning requirement: LOW.

The actual Orchestrator is a constrained dispatcher. It must preserve result envelopes, compare artifact identities, enforce routing prerequisites, obtain fresh audit contexts, relay human decisions, and stop on unknown execution outcomes. It is expressly prohibited from planning, interpreting findings, or judging implementation correctness. (Orchestrator contract, `claude-v2.2/agents/rstack-orchestrator.agent.md`, line 15.)

That makes Sonnet 5 a plausible fit. Most authorized decisions should follow explicit fields and conditions rather than require difficult architectural judgment.

However, this is still an LLM executing a prose contract, not an executable state machine. It must maintain distinctions such as:

- A completed audit versus a stopped invocation.
- Current evidence versus a previously valid artifact.
- Diagnostic eligibility versus release eligibility.
- Unknown publication outcome versus confirmed failure.
- An agent's declaration versus host-observed evidence.

Consequently, "mostly deterministic responsibilities" does not establish that a cheaper model will execute them equally reliably.

Potential regression from moving to Sonnet: more missed prerequisites, premature advancement, inaccurate artifact transport, mistaken retries, or loss of important state after a long interaction. These are risks to measure; I found no RSTACK evidence demonstrating that Sonnet actually makes them more often.

Potential gain: lower dispatch overhead and potentially faster repeated transitions. Anthropic describes Sonnet 5 as faster than Opus 5, but that is vendor guidance, not a measurement of this pipeline.

Opus is justified here only if it demonstrably prevents consequential procedural failures. Its capacity for deeper reasoning is less valuable when the contract correctly requires stopping rather than improvising. Conversely, Sonnet should not be assumed less prone to overthinking merely because it is cheaper.

Assessment: the best candidate for a controlled capability reduction, with strict routing-integrity checks.

## 3. Planner analysis

Capability sensitivity: HIGH.

The Planner has substantially more reasoning work. It must reconcile ticket intent with repository facts, identify affected surfaces, preserve scope boundaries, distinguish assumptions from authorized requirements, construct falsifiable acceptance criteria, select proof routes, and decompose implementation.

The contract also requires finding when the current behavior already satisfies the request and returning that decision to the human. That demands understanding the problem rather than merely generating a plausible change list. (Planner contract, `claude-v2.2/agents/rstack-planner.agent.md`, line 26.)

Opus could provide meaningful value on:

- Ambiguous requests with conflicting ticket and repository evidence.
- Changes spanning producers, consumers, persistence, or public interfaces.
- Concurrency, retries, partial failure, migration, or compatibility behavior.
- Requirements whose individual criteria can pass while the combined user outcome still fails.
- Tickets where the correct proof strategy is harder to discover than the implementation.

Its likely marginal value is smaller on:

- Narrow fixes with explicit acceptance criteria.
- Established local patterns and an obvious affected surface.
- Tasks with a known failing example and a straightforward proof route.
- Repetitive changes where exploration and decomposition are minimal.

This remains an inference from the role. Vendor coding and agentic benchmarks establish useful general capability, but not better RSTACK plans. For example, Sonnet 5's launch comparisons prominently involve Opus 4.8; they do not directly settle Sonnet 5 versus Opus 5 for this role.

A more capable Planner can also produce unnecessary abstractions, speculative scope, or elaborate proof obligations. Longer plans and fewer Auditor findings are not sufficient evidence of better planning.

The system-level opportunity is significant: a better initial plan may prevent expensive audit revisions and downstream rework. Conversely, if Sonnet already produces sound plans for the actual ticket mix, upgrading adds overhead without improving outcomes.

Assessment: Opus is a well-motivated challenger, especially for difficult tickets; a material improvement is not yet established.

## 4. Plan Auditor analysis

Capability sensitivity: HIGH.

The Auditor must independently reconstruct requirements, inspect primary evidence, challenge assumptions, assess falsifiability, and find omissions in scope and combined outcomes. Its central question is whether every stated criterion could pass while the implementation still fails to satisfy the ticket. (Plan Auditor contract, `claude-v2.2/agents/rstack-plan-auditor.agent.md`, line 50.)

This requires both finding counterexamples and rejecting invalid objections.

| Audit capability | What matters in RSTACK | Opus 5 versus Sol |
|---|---|---|
| Requirement re-derivation | Recover obligations omitted or distorted by the plan | No role-specific winner established |
| Unsupported assumptions | Distinguish repository facts, human decisions, and inventions | Must measure against source evidence |
| Falsifiability | Recognize criteria that cannot meaningfully fail | Both warrant evaluation |
| Missing scope | Trace consumers, failure paths, and combined behavior | Generic coding scores do not settle this |
| False-positive control | Avoid inventing requirements or blocking on preferences | Comparative tendency unknown |
| Repository reasoning | Use correct refs, paths, and evidence boundaries | Requires actual harness evaluation |
| Skepticism | Challenge the plan without treating disagreement as success | Primarily a role and evaluation requirement |

Sol's documented reasoning controls, function calling, and structured outputs make it a technically plausible candidate. They do not prove superior auditing or faithful execution in your particular host.

There is also no sound basis here for assigning personalities such as "Sol is more adversarial" or "Opus is more agreeable."

A useful Auditor must distinguish:

- A demonstrated defect.
- A conditional concern requiring clarification.
- Missing evidence.
- A stylistic preference.

An Auditor that reports more findings may simply create more human work.

Assessment: retain Opus as the comparison baseline and test Sol on identical plans. Public evidence reviewed does not justify selecting either as the better RSTACK Auditor.

## 5. Model-diversity analysis

For RSTACK, the three forms of independence have different functions:

| Form | What it contributes | Importance |
|---|---|---|
| Fresh context | Excludes Planner reasoning, persuasive summaries, and prior conclusions | Foundational |
| Different role and evidence lens | Makes the Auditor reconstruct obligations and seek counterexamples | Foundational |
| Different model family | May expose different blind spots | Additional, unproven benefit |

The V2.2 pipeline already requires fresh audit contexts and treats model diversity as optional. (Independence contract, `claude-v2.2/pipeline/SKILL.md`, Fresh dispatch section.)

Host-enforced context separation and evidence-first auditing matter most. Fresh context alone is insufficient: an Auditor can still anchor on the plan it receives. A different role alone is insufficient if it inherits the Planner's reasoning and conclusions.

Opus Planner → Sol Auditor could provide useful error diversity. Sol might challenge an assumption that Opus repeats consistently. But different families can also share the same mistaken interpretation, particularly when both anchor on an incomplete acceptance-criteria list.

Possible disadvantages include inconsistent interpretations of contract terminology, different tool behavior, different context handling, more speculative objections, and additional integration work.

The decisive measure is:

> When the Planner makes a material error, how often does the Auditor miss it, and how much unjustified blocking does the Auditor introduce?

Measure that conditional relationship rather than disagreement frequency.

A stronger Planner may leave fewer defects for either Auditor. That is potentially success, not evidence that mandatory auditing has become unnecessary.

## 6. Configuration comparison

I would include Configuration C: Sonnet Orchestrator / Opus Planner / Opus Auditor as a conservative trial configuration.

Its justification is specific: it tests reallocating reasoning toward planning while retaining the current Auditor. Comparing B with C then isolates the Auditor substitution. C is more defensible as an intermediate experiment, not established as the best permanent allocation.

The table contains architectural expectations, not observed performance.

| Dimension | A: Opus / Sonnet / Opus | B: Sonnet / Opus / Sol | C: Sonnet / Opus / Opus |
|---|---|---|---|
| Planning quality | Sonnet baseline; adequacy depends on ticket difficulty | Plausible improvement on difficult tickets | Same planning hypothesis as B |
| Audit independence | Fresh context and separate role; shared family | Same safeguards plus potential family diversity | Same safeguards; identical Planner/Auditor model adds possible shared bias |
| Routing reliability | Current declaration; reliability unmeasured | Sonnet procedural fidelity must be verified | Same requirement as B |
| Likely false positives | Unknown baseline | Could improve or worsen; diversity gives no directional answer | Retains Auditor model, but changed plans can alter behavior |
| Context/tool execution | Existing configuration still needs host evidence | Both routing change and Sol integration require checks | Fewer integration changes than B |
| Latency | More expensive dispatch reasoning; potentially quicker planning | Faster dispatch plausible; deeper planning and audit duration may offset it | Similar tradeoff; retains Opus audit |
| Cost | Depends heavily on dispatch frequency and audit rework | Potential savings, not guaranteed | Reallocation may raise or lower total cost |
| Architectural fit | Strong capacity in dispatcher and Auditor | Capacity concentrated in planning and challenge; credible hypothesis | Conservative way to test role reallocation |

For orientation, current published base API input/output prices per million tokens are Sonnet $2/$10, Opus $5/$25, and Sol $4/$20. These are not your GitHub/Codex billing rates; caching, long-context pricing, reasoning usage, and platform arrangements matter.

Swapping Opus and Sonnet between roles does not automatically save money. The Planner might consume substantially more tokens than the dispatcher.

Evaluate total cost and elapsed time through an accepted, independently verified result, including revisions, retries, downstream repair, and human intervention. Cheap planning followed by repeated expensive correction can lose; expensive planning with no measurable improvement can also lose.

## 7. Risks of changing

- Routing regressions: a cheaper dispatcher could mishandle rare but consequential recovery states.
- Unattributable results: changing all three assignments together conceals which change helped or harmed.
- More elaborate planning: additional reasoning may expand scope or proof obligations unnecessarily.
- Audit noise: cross-family disagreement may increase false positives rather than useful detection.
- Host confounding: a change in tools, context assembly, effort settings, or permissions may be mistaken for a model effect.
- False confidence: a stronger model may compensate inconsistently for an ambiguous contract. That does not resolve the ambiguity.

Reasoning-effort labels should also be recorded explicitly; similarly named settings across vendors are not equivalent computational budgets.

## 8. Risks of not changing

- Repeatedly paying for deep reasoning in a role that mainly needs faithful state handling.
- Keeping planning as a bottleneck and spending more later on correction.
- Leaving potentially useful Planner/Auditor error diversity unexplored.
- Treating existing frontmatter as evidence that the allocation was validated.
- Missing improvements on complex tickets because aggregate performance is dominated by simple ones.

These are opportunity costs and hypotheses, not findings that Configuration A is currently failing.

## 9. Recommended experiment

Minimum useful screening study: six representative tickets, separate routing replays, and a paired Planner/Auditor comparison. This can identify a promising allocation; it cannot establish production reliability or rare-failure rates.

First, freeze the comparison conditions. Use the same repository snapshots, ticket evidence, role contracts, tool permissions, and human-answer fixtures. Record effective model identity, host, effort, context handling, and actual usage. Preserve fresh contexts and randomize run order. Resolve or explicitly account for known contract ambiguities before scoring. If the host differs between models, report the result as a model-plus-host comparison.

1. **Compare Orchestrators separately.** Replay approximately eight representative states with both Opus and Sonnet, including: normal advancement and malformed results; stale plan/audit identities; a stopped latest audit alongside older valid evidence; unknown external execution outcomes; diagnostic versus release eligibility; human decisions and protected user work. Have expected transitions adjudicated beforehand. Repeat the tricky cases. Score exact artifact preservation, correct stopping, unauthorized advancement, and recovery behavior. Any consequential unauthorized advancement should block promotion pending investigation. Zero failures in this small sample is a screening result, not proof of safety.
2. **Cross both Planners with both Auditors.** Choose two narrow tickets with explicit requirements, two cross-module or interface tickets, two ambiguous or failure-sensitive tickets. Generate one Sonnet plan and one Opus plan per ticket: 12 plans. Have both Opus and Sol independently audit every identical plan: 24 audits. Neither Auditor sees the other's findings. This separates planning quality from audit quality and tests both same-family and cross-family pairings. Add a small set of human-validated defective plans and clean controls. Otherwise, an Auditor receiving excellent plans may appear indistinguishable from one that simply misses defects.
3. **Use human adjudication grounded in source evidence.**

   | Area | Measures |
   |---|---|
   | Planning | Contradicted assumptions, omitted requirements/surfaces, unsupported scope, unusable proof routes |
   | Auditing | Material true findings, severity, known defects missed, false positives |
   | Revision | Justified acceptance-criteria changes, audit rounds, human corrections |
   | Execution | Tool failures, contract violations, stale evidence, retries |
   | Efficiency | Tokens, elapsed time, actual billed usage/cost |
   | Downstream | Tester and Reviewer findings attributable to planning; implementation rework |

   Do not use the same candidate Auditor as the sole judge of its own findings. Keep missing measurements marked unavailable.
4. **Validate the promising allocation end to end.** Run A and the strongest challenger on three paired tickets, keeping downstream models and conditions fixed. This adds the evidence that isolated planning/auditing cannot supply: actual rework and defects discovered later.

Promotion should require preserved routing integrity and no observed consequential quality regression, followed by a repeatable benefit in defect prevention, justified findings, rework, or human effort. Cost and latency should decide when quality is comparable. If results are close, expand or repeat the difficult cases rather than proclaiming a winner from six tickets.

## 10. Final conclusion

The evidence supports testing B, not adopting it wholesale.

Sonnet is a plausible Orchestrator because the role principally demands procedural fidelity. Opus is a plausible Planner improvement because planning concentrates the requirement, repository, scope, and proof reasoning. Sol is a credible Auditor candidate, but its advantage over Opus, and the value of family diversity, remains unproven.

C provides a useful intermediate comparison: test the allocation change first, then require the Sol substitution to demonstrate additional value.

During this evaluation, the reviewer changed no files, ran no tests or pipeline experiments, and staged, committed, or pushed nothing.
