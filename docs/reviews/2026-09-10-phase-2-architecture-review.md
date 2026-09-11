# ASTRA — PHASE 2 ARCHITECTURE REVIEW

**Recommendation: PROCEED_WITH_CHANGES**

Phase 2 is the right next investment. Requirement-level coverage, explicit material decisions, repository grounding, interface expectations, and an evidence-led Adversary can improve the plans entering Tester. The proposal stays substantially within a reusable Copilot reference. It does not need another orchestration layer or a different model baseline.

Approve the direction, but revise the design before implementation authorization. The necessary changes concern G3 revision semantics, compatibility with existing downstream consumers and example evidence, and how independent challenge is demonstrated. Several proposed formatting requirements should also become lighter. None requires reopening the locked Phase 1 reference.

## Reviewed evidence and limits

- Local HEAD: `0f54a59790d86ddbdd655bddac85f903d62f44a1`, the administrative Phase 1 closure commit.
- Locked behavioral baseline: `03d4230e9398a80586a4b8be47ed522638bf77d8`. The local annotated `phase-1-reference` tag was verified to peel to this commit. The intervening tracked changes are administrative README/contract closure text.
- Reviewed the actual uncommitted [Phase 2 proposal](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-2-planning-quality-architecture-proposal.md>), 306 lines. SHA-256: `6C74C0CAD172107F11B7B52F606011413ACB58F866ED4AFF8EC561F82AFBF492`.
- Below, **P** means that proposal, with section and one-based line references. Baseline links are pinned to the locked commit.

This was a source and contract review, including failure-scenario tracing across the affected agents, artifact contracts, gates, and PAYMENTS example. It was not a new Phase 1 audit. No application tests, model benchmark, Copilot session, corporate tools, or publication were exercised. Remote main was not independently refreshed. Only this review artifact was created; the proposal and reference assets were not edited.

## What should be preserved

The strongest parts address concrete failures rather than document aesthetics:

| Proposal element | Why it earns its cost |
|---|---|
| Requirement items, including developer constraints | A Jira can be marked covered while one clause disappears. Item-level disposition makes that omission reviewable. Keep one compact table with stable source references. |
| Facts, assumptions, proposals, and decision routing | Prevents an implementation choice from quietly becoming an approved product requirement. Consequence-if-wrong is more useful than an assumption list alone. |
| Repository evidence and interface expectations | Lets a reviewer challenge whether the intended component, consumer, configuration, and compatibility assumptions actually exist. |
| Observable outcomes, preconditions, and preservation expectations | Gives Tester a clearer business contract without prescribing test implementation. Preservation becomes intentional rather than an incidental Tester discovery. |
| Risks tied to a treatment | Replaces generic warnings with coverage, a decision, an unresolved prerequisite, or a consciously accepted exposure. |
| Independent derivation and responses to findings | Creates a useful second reasoning path and makes unresolved disagreement available to the developer. |
| A compact G3 decision summary and SMALL example | Directly improves adoption, provided the summary conveys outcomes and the example demonstrates low ceremony. |

Evidence: P §§3.1–3.11, lines 85–186. The current [Planner contract](https://github.com/Lorenchess/copilot-agentic-workflow/blob/03d4230e9398a80586a4b8be47ed522638bf77d8/.github/agents/planner.agent.md#L42-L65) establishes provenance, key disposition, and bounded revision, but does not require this richer reasoning. These are worthwhile forward improvements, not grounds to invalidate Phase 1.

## Changes needed before implementation

### 1. Close the G3 answer-to-plan loop explicitly

P §3.11, lines 182–184 allows the developer to confirm, reject, or replace proposed decisions and records answers against a `CURRENT` G3 basis. It does not fully distinguish approval of the displayed plan from instructions that materially change that plan.

**Failure scenario:** Adversary approves a plan recommending a particular retry limit or interface shape. At G3 the developer replaces that recommendation. The answers are recorded, but Tester proceeds against the old plan, or Planner incorporates the answer without a new Adversary review. The developer's choice and the reviewed evidence now describe different behavior.

Specify the following minimal semantics:

- Accepting the recommendations as displayed can approve the current plan.
- An answer that changes the approach, acceptance behavior, scope, or material decision sends the plan back. Planner incorporates the answer, Adversary reviews the resulting plan, and G3 approves that actual revision before Tester starts.
- A send-back answer is authoritative developer input, not approval to advance. Recording it must not manufacture an approved `CURRENT` gate for the replacement plan.
- A human-directed fresh cycle may reset its automatic two-round allowance, but must not reuse artifact identities that make an old gate basis appear current. Existing RUN history can use a cycle plus round, or a distinct revision identifier; no new runtime is needed.
- Preserve prior findings and supersession. A revised plan invalidates dependent evidence and approvals through the existing rule. A newly discovered repository also requires repository authorization through G1; G3 does not enlarge G1's selection implicitly.

The existing [gate and resume rules](https://github.com/Lorenchess/copilot-agentic-workflow/blob/03d4230e9398a80586a4b8be47ed522638bf77d8/.github/agents/pipeline.agent.md#L77-L88) already establish the necessary principle. Phase 2 must carry it through the richer interaction.

G3 itself should show a short description of the intended business outcomes, the material choices, exclusions/unresolved scope, consequential assumptions, accepted risks, and Adversary residuals. IDs should link to detail, not substitute for outcomes. P line 182's “criteria titles (AC and P ids only)” needs clarification. A count of low-consequence assumptions is acceptable; a material assumption must be visible. A recommendation is not consent until the developer answers.

Do not require separate acknowledgements for every `PRESERVED` item merely because it is not `IMPLEMENTED`. Preservation normally satisfies a requirement. Group related decisions and satisfied coverage; foreground exceptions. “One screen” is a usability target, not permission to omit material information.

### 2. Resolve immediate compatibility rather than deferring it to later phases

**Completed example evidence.** P lines 222, 237, and 285 propose changing PAYMENTS planning artifacts and its G3 entry while keeping downstream evidence untouched, on the basis that AC IDs and affected paths remain identical. That is insufficient for semantic consistency.

The proposed refresh adds explicit shipped-default decisions and interface detail. Two plans can share every ID and path while requiring different behavior. The existing example records active downstream artifacts and current approvals in [RUN.md](https://github.com/Lorenchess/copilot-agentic-workflow/blob/03d4230e9398a80586a4b8be47ed522638bf77d8/docs/examples/PAYMENTS-12345/RUN.md#L56-L89), and claims no other plan departure in [VERIFICATION.md](https://github.com/Lorenchess/copilot-agentic-workflow/blob/03d4230e9398a80586a4b8be47ed522638bf77d8/docs/examples/PAYMENTS-12345/VERIFICATION.md#L118-L145). A rewritten G3 cannot honestly lend that evidence to materially changed decisions. The example is fictional, but the evidence relationship it teaches must remain valid.

**Smallest direction:** retain the completed Phase 1 example, and demonstrate the richer PAYMENTS planning stage as a clearly separate Phase 2 planning-only variant through G3. It can reuse the scenario without claiming the old tests and publications validate the new plan. Purely editorial enrichment is another valid option only if semantic equivalence is actually established; matching identifiers by grep does not establish it. Do not expand Phase 2 into rebuilding a fictional end-to-end delivery just to preserve the proposed file list.

**Affected-file semantics.** P §3.4 and C-1, lines 122–124 and 241, permit directory/component entries while deferring their matching rule to Phase 4. The unchanged [Verifier already classifies every changed path against Affected files](https://github.com/Lorenchess/copilot-agentic-workflow/blob/03d4230e9398a80586a4b8be47ed522638bf77d8/.github/agents/verifier.agent.md#L66-L74). A directory can become either an unintended blanket allowance or an unexplained plan departure. This is an interface decision needed now, not deeper verifier design.

Prefer keeping file paths as the operative Affected files entries, with uncertain locations recorded as investigation notes. If directory entries remain operative, define their bounded meaning for the current consumer now. Do not claim unchanged downstream compatibility while leaving this interpretation unspecified.

**Testability semantics.** P §3.6, lines 136–143, allows `Observed at: NEW`. The current [Tester requires an existing testable boundary without unilateral scaffolding](https://github.com/Lorenchess/copilot-agentic-workflow/blob/03d4230e9398a80586a4b8be47ed522638bf77d8/.github/agents/tester.agent.md#L82-L87). Naming a future boundary does not satisfy that precondition. A new behavior can still be reachable through an existing public entry or observable state; identify that route. Otherwise expose the prerequisite and use the existing human decision/STOP path. Identifying this gap belongs in Phase 2; choosing test doubles, scaffolding, and test implementation belongs later.

Planning preservation statements should describe intended unchanged business behavior, supported by evidence. They do not prove the baseline passes, predetermine every test's classification, or override the existing baseline-failure procedure.

### 3. Give Adversary an evidence path beyond Planner's citations

P §3.8, lines 155–162, improves independence through separate requirement derivation. However, checking Planner's evidence rows can validate a self-consistent but incomplete picture. The proposal does not explicitly require a material repository check selected independently of those rows.

**Failure scenario:** Planner cites a producer and its test accurately but overlooks an existing consumer that interprets the changed field differently. All cited rows are confirmed and all enumerated requirements have dispositions. The proposed evidence counters can still report a clean review while the compatibility failure survives.

Preserve the source-first derivation, and add a bounded adversarial question: **what relevant caller, consumer, configuration, invariant, or failure interaction would make this plan wrong even if its citations are true?** Inspect the material boundary selected by that reasoning, including evidence omitted by Planner when relevant. SMALL work may need only one obvious local check; do not impose a quota of extra files or findings.

Also challenge combinations of outcomes, not just isolated positive and negative cases: **could an implementation satisfy every listed criterion yet violate the requested business behavior?** Terminal success combined with reporting failure is an example of the class of gap that a checklist of separate paths can miss. Phase 2 should expose the missing outcome; Phase 3 should decide how to test it.

Remove the requirement that the refreshed example contain at least one finding grounded in uncited evidence (P line 286). A correct plan may yield no finding. Record independently selected checks and their results; count-based sentences do not establish that independent reasoning occurred. Similarly, “ignoring a finding ... impossible by construction” (P line 178) overstates what a Markdown response table enforces. The table makes omissions reviewable; it does not prevent them.

Allow concise counterexamples or bounded alternatives when explaining a flaw. The prohibition on any alternative approach (P line 159) is broader than necessary: “this existing operation appears to cover the requirement; why introduce another?” is useful complexity review. Adversary should not author a competing full plan or edit Planner's artifact.

This yields meaningful procedural independence with Sonnet-5 for both roles. It does not guarantee a blind review, faithful read order, or independent model errors. Model diversity remains a later benchmark. An uncited-evidence finding is a useful observation, not the sole quality metric or a required outcome.

### 4. Make structure proportional to uncertainty and consequence

P §§3.1–3.7 and §4 add useful structure, but some absolute rules encourage paperwork or false precision:

- Enumerate separable source obligations, not every sentence. Keep source anchors and stable IDs across revisions. Do not turn every technical developer constraint into another executable GWT scenario: coverage may be demonstrated by an acceptance/preservation criterion, interface restriction, or explicit implementation constraint. Preserve the distinction between sourced requirements and openly proposed additions. `IMPLEMENTED` in a plan means planned coverage, not delivered proof.
- Replace “every choice is a row” (line 108) with every consequential unresolved choice or material assumption. Routine implementation details do not all deserve a G3 record.
- Treat 12 evidence rows per repository and roughly 60 SMALL-plan lines as soft presentation targets. One row can support several claims. A hard row cap conflicts with citing every material repository claim and does not bound the amount of repository reading. Expand where the change's consequences justify it; do not hide evidence to pass a line-count check.
- `NOT_FOUND` means “not found by these searches in this scope,” not proof that behavior does not exist (lines 112–118). State the consequence of the uncertainty. If the plan depends on absence, investigate sufficiently or surface it as unresolved; this is not RED proof.
- Do not assume future RED/verification will expose a wrong assumption simply because a row says so (line 101). Record the concrete observable consequence or existing evidence. In particular, sync versus asynchronous behavior should not be preclassified as harmless merely because AC5 covers one ordering case (lines 106 and 285); latency, ordering, and failure semantics may make it a material choice.

The cross-repository table is sufficient in principle. Keep provider, consumer, changed contract, relevant failure behavior, compatibility, sequencing, and owner/prerequisite information. Distinguish implementation order from deployment compatibility: repositories can be developed in parallel while still having a rollout prerequisite. An owner outside this run is not authorized merely by selecting a G3 answer. Record the external dependency and the needed decision or constraint; do not build a dependency engine.

## Independent owner decisions

| Decision | Verdict | Reasoning and necessary qualification |
|---|---|---|
| **D1 — SMALL / MEDIUM / LARGE** | **ACCEPT_WITH_CHANGES** | Use the labels to select relevant review depth, not as a score or an authorization boundary. SMALL must meet all its limiting conditions; the current “any one” table heading is misleading. Escalate for consequence and uncertainty, not only file/repository count: a localized permission or data-integrity change can warrant deeper review. An unresolved minor detail need not automatically imply LARGE. Keep core coverage, assumption, failure-path, and summary checks for every class. A wrong label matters when it omits necessary review, not as a standalone HIGH formatting violation. |
| **D2 — Fresh human-directed two-round cycle** | **ACCEPT_WITH_CHANGES** | A deliberate send-back with answers should start another bounded planning cycle. Preserve distinct evidence identities, finding history, fresh approval, and downstream invalidation as described above. Never reset automatically or interpret answers as approval of an unwritten plan. Also account for developer clarification after BLOCK or exhausted rounds. The alternative is not literally only Approve-or-Abort: the locked Adversary already permits manual Planner redirection after the bound. Reconcile all current-main descriptions of the bound. |
| **D3 — Second planning-only SMALL example** | **ACCEPT** | A concrete short example demonstrates adoption cost better than prose. Stop at G3, state that boundary, and permit an honest zero-finding review. Do not require executable evidence or fabricated complexity to exercise every field. |
| **D4 — Unspecified shipped values** | **ACCEPT_WITH_CHANGES** | Require explicit G3 choice for a new or changed materially observable default/limit without an authoritative requirement or approved basis. Configuration is not a reason to hide a product decision. However, preserving an evidenced existing default or applying a supplied approved policy is not automatically a new decision merely because Jira omits the number. Distinguish that case from inventing a value. Present units, counting semantics, and consequences when they affect the choice. Internal inconsequential constants need not all become owner questions. |

D2 evidence: P lines 184, 242, 298; the existing [second-round stop options](https://github.com/Lorenchess/copilot-agentic-workflow/blob/03d4230e9398a80586a4b8be47ed522638bf77d8/.github/agents/adversary.agent.md#L62-L69). These are recommendations for owner authorization, not approvals to implement them.

## Skills, human usability, and missing failure modes

The two policy skills are architecturally justified if they have distinct responsibilities. **plan-grounding** should own the shared coverage, evidence, decision, and planning-quality rules. **challenge-plan** should own the independent review method, counterexample questions, finding treatment, and verdict interpretation. Agents should reference those rules and specify their role/input/output procedures; artifact contracts should specify the representation without copying all policy text.

Resolve one small inconsistency: P line 214 says Planner reads both skills; line 221 assigns challenge-plan to Adversary. Planner needs plan-grounding. Adversary needs the shared contract plus challenge-plan. Giving both roles the same construction-and-review script weakens the proposed separation and adds an unnecessary instruction layer.

The important planning-quality gaps to add or clarify are:

1. **Evidence-selection bias and combined failure conditions**, as described above. Verifying citations and listing negative paths alone does not close these gaps.
2. **Shared intake incompleteness.** Both roles derive from the same captured INTAKE/RUN. That improves fidelity to those inputs, not independent completeness against the original Jira. The existing [intake policy](https://github.com/Lorenchess/copilot-agentic-workflow/blob/03d4230e9398a80586a4b8be47ed522638bf77d8/.github/skills/gather-jira-context/SKILL.md#L26-L58) provides source fields and warnings. Carry material missing-field/unknown information into planning instead of claiming independent enumeration proves that no upstream requirement was lost. New Jira access is unnecessary for this phase.
3. **Human answers changing reviewed evidence.** The richer G3 needs the explicit return-and-reapprove path, not just answer storage.

G3 is improved only if it helps the developer judge these consequences. Asking them to acknowledge every preserved item, showing only criterion IDs, or counting consequential assumptions would exchange one reading burden for another. Keep the detailed plan available, summarize business outcomes and exceptions, and show Adversary's residual findings directly rather than filtering them through Planner's summary.

## Phase boundaries and compatibility classification

| Area | Classification and required treatment |
|---|---|
| Richer Planner/Adversary procedures, policy skills, plan/review sections, depth guidance, G3 summary | Normal forward Phase 2 evolution of current main. Keep the tag and historical Phase 1 contract unchanged. |
| Fresh planning cycles and gate basis identities | Explicit compatibility dependency. Update the current contracts and cross-references together. P's promise that GUARDRAILS stays byte-identical needs reconsideration: its [unqualified two-round statement](https://github.com/Lorenchess/copilot-agentic-workflow/blob/03d4230e9398a80586a4b8be47ed522638bf77d8/.github/pipeline/GUARDRAILS.md#L80-L82) must agree with the human-cycle rule. A small forward clarification is not reopening Phase 1. Check the pipeline skill's round descriptions as well. |
| Affected-file meaning, existing testable entry, G3 decision incorporation | Minimal producer/consumer interfaces that must be coherent now, even if Tester and Verifier remain unchanged. Not a reason to import deeper Phase 3/4 mechanics. |
| PAYMENTS planning refresh | Reference-integrity dependency. Separate materially revised planning from the completed example's old evidence, or establish actual semantic equivalence. |
| Test levels, doubles, executable tests, RED proof, detailed preservation execution | Phase 3. Phase 2 states business outcomes, preservation intent, and testability prerequisites only. |
| GREEN iterations, implementation strategy, deeper Verifier semantics | Phase 4. Do not redesign these to accommodate optional plan formatting. |
| Corporate delivery integration and actual rollout execution | Later integration work. Planning can identify ownership and compatibility prerequisites without implementing delivery infrastructure. |

No finding here requires moving or reopening `phase-1-reference`. Exact Jira/Bitbucket MCP names, the Sonnet-5 model-picker string, picker smoke checks, corporate approval-engine behavior, and broader model benchmarks remain deferred. A sound reference design is not validation in that environment.

## Smallest sufficient Phase 2 and its review evidence

Keep the three proposed checkpoints, with a smaller acceptance target:

1. **One shared planning policy and one independent challenge policy:** compact source coverage; consequential decisions; evidence supporting material claims; affected-file/interface meaning; observable acceptance and preservation intent; risks with treatment. Keep the existing roles, tools, artifacts, and gates.
2. **A usable G3 and bounded revision contract:** concise outcomes and exceptions, explicit decision incorporation, distinct active evidence across human cycles, and consistent current-main budget wording. Resolve the downstream compatibility choices before authoring the agents.
3. **Planning examples and comparison guidance:** the SMALL example plus a clearly separated richer PAYMENTS planning demonstration. Reuse the evidence model honestly, without retroactively validating changed decisions through the old completed run.

Do not make exact field counts, a mandatory novel finding, or running the same catalogue over its own happy-path examples the principal acceptance evidence (P lines 277–292). Use a few planning-only challenge cases with explicit expected behavior instead:

| Case | Expected outcome |
|---|---|
| One source clause or developer constraint disappears | Independent derivation detects the omission; the plan cannot silently proceed as complete. |
| Every cited row is true, but a relevant consumer or combined failure condition is missing | Adversary follows a material independent check and requires the missing outcome/compatibility decision. |
| Developer replaces a material G3 choice after round two | A new bounded human-directed cycle reviews the resulting plan; old evidence identities/approval do not authorize it. |
| A new observable boundary has no existing exercise route | The prerequisite is exposed; no claim that `NEW` satisfies the unchanged Tester contract. |
| A genuinely small, correct change has no unresolved material choice or novel finding | Short plan, proportionate review, legitimate approval without invented issues or unnecessary acknowledgements. |

These can be reviewed as document scenarios; they require no test harness, schema platform, or new execution machinery. Format/consistency checks remain useful supporting evidence.

## Final assessment

**PROCEED_WITH_CHANGES.** Phase 2 should proceed after Fable incorporates the necessary design corrections and the owner authorizes the qualified D1–D4 choices. Its core investment is sound and proportionate.

The minimum changes are: make changed G3 answers lead to review of the resulting plan; preserve evidence identity across fresh human cycles; separate materially revised example planning from old completed evidence; settle the plan's immediate Tester/Verifier interfaces; and require independent, consequence-driven challenge rather than evidence counters or finding quotas. Simplify the remaining structure around those outcomes.

This is forward evolution of a locked reference, not a reason to reopen Phase 1. No Phase 2 implementation is authorized by this review.
