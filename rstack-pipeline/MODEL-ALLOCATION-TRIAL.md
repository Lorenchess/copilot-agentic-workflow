# TEST THE ALTERNATIVE — workplace model-allocation trial

**Decision date:** 2026-09-18. **Status:** Configuration B is selected by the owner and configured in the active RSTACK V2 reference. Effective workplace routing, model-format conformance, comparative quality, cost and latency remain **NOT VERIFIED / NOT MEASURED**. No model experiment was run by creating this document.

Give this assignment to the workplace agent alongside the [workplace evaluation prompt](WORKPLACE-PIPELINE-EVALUATION-PROMPT.md). This file owns the trial instructions and current decision record; the [canonical entry point](README.md) identifies the active source. It adds no runtime role, gate, artifact schema, fallback router or mandatory prompt content.

## 1. Assignment and authorized change

Evaluate whether the selected allocation improves the actual workplace pipeline. Preserve its existing role contracts, evidence requirements, human decisions and publication boundaries. Carry out the scoped configuration, verification and evaluation actions already authorized for that workplace; obtain only missing authorization for concrete additional actions. Publication of this reference does not itself authorize installing it at work, running real tickets or benchmarks, or changing workplace permissions and connectors.

The owner explicitly directed the reference to use Configuration B after the analyses below. This is a decision to configure the alternative for evaluation, not a claim that the analyses proved it superior. Earlier recommendations to try C first remain useful experimental design advice; they no longer mean that B is unauthorized in this reference. Do not silently switch the selected reference back to C.

Only these three agent model fields changed:

| Role and current source | A: previous declaration | B: selected trial | C: comparison group |
|---|---|---|---|
| [Orchestrator](claude-v2.2/agents/rstack-orchestrator.agent.md) | Claude Opus 5 | **Claude Sonnet 5** | Claude Sonnet 5 |
| [Planner](claude-v2.2/agents/rstack-planner.agent.md) | Claude Sonnet 5 | **Claude Opus 5** | Claude Opus 5 |
| [Plan Auditor](claude-v2.2/agents/rstack-plan-auditor.agent.md) | Claude Opus 5 | **GPT-5.6 Sol, OpenAI** | Claude Opus 5 |

The candidate strings retain this source set's Copilot naming convention: `Claude Sonnet 5 (copilot)`, `Claude Opus 5 (copilot)` and `GPT-5.6 Sol (copilot)`. They declare the intended selections; they do not establish that a workplace host resolves those exact strings. Confirm the host-specific selector and effective model before labeling an invocation as A, B or C. Do not remove the pin, allow a silent fallback or substitute another model to make a trial complete.

All groups keep Tester and Approval on Sonnet 5, and Developer and Reviewer on Opus 5. Agent bodies, tools, dispatch rights, state transitions and output contracts stay fixed. The separate nine-role `.github` reference and historical RSTACK versions retain their own assignments.

The pre-change reference commit is `2a5e281e1d33c9f998aa3adc7dac666ac86564ef`. Use it as an exact source for the former three model values, not as evidence that A ever ran correctly. For a fair comparison, use one current, frozen contract snapshot for every group and vary only the named model fields in an isolated authorized evaluation configuration. Do not compare B on corrected contracts with A on an older workflow.

## 2. Analysis behind the trial

Read the [independent model-allocation review](reviews/2026-09-17-model-allocation-independent-review.md) and the [architect's analysis](reviews/2026-09-17-model-allocation-analysis.md). They are dated reasoning, not benchmark results. Preserve them unchanged rather than rewriting their former "current" assignments or recommendations as though the trial had already succeeded.

| Hypothesis | Rationale from the actual role | Principal risk | Observation that matters |
|---|---|---|---|
| Sonnet can dispatch adequately | The Orchestrator routes by state, artifact and result fields; engineering judgment is prohibited. | Long-context drift, wrong identities, altered replies, premature advancement or mistaken recovery. | Correct transitions and exact transport throughout a long run, including interruption and revision. |
| Opus improves difficult plans | Requirements, affected surfaces, falsifiable ACs and proof routes propagate into locked tests and the definition of done. | Extra questions, speculative scope, unsupported assumptions, unnecessary units and higher total effort. | Better grounded plans with fewer material omissions and less downstream rework, not longer output. |
| Sol adds useful audit value | Another model family might find counterexamples missed by the Planner's family. | Malformed envelopes, incompatible tool use, invented requirements, false positives and shared blind spots. | Contract conformance first; then genuine defect detection and conditional misses at an acceptable false-positive rate. |

The role-based capability sensitivity assessment is **MEDIUM for Orchestrator** overall, despite low engineering-reasoning demand, and **HIGH for Planner and Plan Auditor**. These are architectural judgments, not measured rankings of the models.

Fresh context and an evidence-first audit lens are foundational. Model-family diversity is an additional hypothesis, not a safety guarantee. More disagreement or more findings does not establish a better Auditor. Fewer findings may indicate better plans or poorer detection; inspect the underlying cases.

The independent review concluded **TEST THE ALTERNATIVE**. The architect recommended C before the Sol substitution, adding a long-run transport check and a format-conformance prerequisite. Use C to isolate B's Auditor change; use paired planning outputs to isolate planning quality. Merely running B successfully once would not distinguish these effects.

Measure the entire chain through an accepted result. A cheaper dispatcher can be outweighed by longer planning or more audit rounds; a more expensive Planner can pay for itself by preventing repair. Public model descriptions and benchmark rankings do not establish this pipeline's cost, latency or reliability.

## 3. Establish the actual workplace basis

Before collecting scored results:

1. Identify the workplace repository, full revision, working-tree changes, authored/generated/installed model definitions, host/version and invocation route. Use the [workplace port guide](claude-v2.2/WORKPLACE-PORT.md); do not copy candidate files blindly over generated output.
2. Inspect the current [pipeline](claude-v2.2/pipeline/SKILL.md), [handoff contract](claude-v2.2/references/handoff-contracts.md) and the three role procedures. Identify relevant real parsers, dispatch/persistence behavior and unresolved adoption decisions. The analyses' references to then-pending corrections are historical: inspect current source and review status, do not assume those defects still exist or that workplace counterparts are fixed.
3. Record the model selector, resolved model identity and its evidence, reasoning setting, tools, permissions, context assembly and any compaction for each invocation. Model self-identification is not host evidence. If identity cannot be established, label it unverified and exclude the result from model-specific conclusions.
4. Confirm all intended models are available in the selected workplace surface. The owner reports availability; exact routing and supported configuration still require observation. Stop that comparison if the intended model is not selected; do not conceal a fallback.
5. Establish how fresh-role replies are persisted and retrieved. Record host-side persistence if present; otherwise evaluate the actual orchestrator transport without silently introducing a new hook. Preserve both the original reply and its stored form for exact comparison under the contract's permitted persistence rule.
6. Freeze the shared contract snapshot, ticket/repository inputs, human-answer fixture, permissions, effort settings and evaluation limits. Effort labels across vendors are not equivalent budgets. If a defect requires changing the shared contract, version the study and repeat affected comparisons on the same corrected basis.

Current [VS Code custom-agent documentation](https://code.visualstudio.com/docs/agent-customization/custom-agents) supports a `model` selection and also supports fallback lists or the selected model when no pin is supplied. That configuration flexibility is not evidence of which model executed this trial. Use a single intended selection per group, observe resolution, and check the selected workplace host's current documentation if it differs from VS Code. Do not assume Copilot frontmatter installs or configures a Codex agent.

Keep source availability, parser compatibility and host controls separate from model quality. A broken integration is a blocked trial, not proof that the underlying model cannot audit.

## 4. Run conformance and routing checks before quality comparisons

Use existing authorized fixtures or safe replay mechanisms. This plan does not require creating a new harness. If suitable facilities or execution authorization are missing, document the exact prerequisite and continue independent source analysis; do not mark the trial passed.

### A. Orchestrator fidelity

Compare Opus and Sonnet on the same approximately eight representative states: normal progression, malformed handoff, stale plan digest, a stopped latest audit with an older holds result present, complete failed verification versus unknown execution, diagnostic versus release eligibility, a pending human decision, and protected work or unknown external effects.

Add one full-length synthetic run per model with all relevant states, two revision/recovery loops and a stopped audit. Repeat the difficult cases with fresh sessions. This checks sustained state and transport fidelity, which short isolated prompts cannot establish.

Score the expected route, identity preservation, result preservation, blocker ownership and correct stopping. Compare the raw returned reply with its persisted representation, permitting only transformations explicitly allowed by the adopted handoff contract. A consequential unauthorized advance, blind retry after an unknown outcome, or corrupted relied-on identity blocks progression until understood.

### B. Plan Auditor compatibility

Use the actual adopted audit-response parser and its consumers, not a new regular expression that merely accepts the model's answer. Exercise both completed audits and deliberate inability-to-complete cases for Opus and Sol:

- A **completed audit** has the required envelope and measured/received plan identity, the prescribed audit body, one of the four audit verdicts, matching envelope/body results, required claim labels and current-round finding IDs. Check exact required headings and the `Wrote nothing.` ending against the current schema.
- A **stopped audit** has the `STOPPED` envelope, `Artifacts: None`, an owned blocker and available identity values. It has no completed audit body or overall verdict. Keep it in result history; never promote an earlier holds result or require a completed-body parser to accept it.
- Include missing/unmeasurable and mismatched plan digests, unsupported finding syntax, contradictory result/body values, absent required sections and contamination. Distinguish correct refusal from malformed output.

Require every eligible reply in this small conformance sample to satisfy its applicable contract. A correctly formatted but unjustified `STOPPED` is a quality/availability problem to investigate, not a successful audit. Any parse failure, fabricated identity or unauthorized write needs resolution before promotion; report all failed attempts and retries.

The OD-15 choice about full-reply versus exact-body persistence must be settled against the real readers. Do not change the parser-owned schema or relax a requirement just to favor Sol. Any justified integration correction is a separate controlled change and requires affected comparisons to be repeated fairly.

## 5. Minimum useful quality comparison

Start with six representative tickets: two narrow tasks with explicit requirements, two cross-module/interface tasks, and two ambiguous or failure-sensitive tasks. Freeze the same source snapshots and requirement evidence; avoid using later implementation knowledge in one group's prompt only.

1. Generate one Sonnet plan and one Opus plan per ticket: **12 plans**. Use the same role contract and a consistent, recorded human-answer fixture. Log new legitimate questions rather than answering differently without recording it.
2. Have Opus and Sol independently audit each identical plan in fresh contexts: **24 audits**. Neither sees the other's findings, the Planner's hidden reasoning, or previous conclusions. Randomize run order and obscure model attribution from human adjudicators where practical.
3. Add a small separately scored set of human-validated plan defects and clean controls. Preserve untouched natural plans as a separate set; do not count seeded defects as spontaneous Planner mistakes. Otherwise, excellent plans can make an ineffective Auditor look successful.
4. Use a human reviewer grounded in ticket and repository evidence to adjudicate material findings. Do not let a candidate Auditor be the sole judge of its own output. Preserve disagreements and unresolved cases rather than forcing a binary result.
5. Repeat the difficult cases if results are inconsistent or close. Six tickets are useful screening, not a statistically established reliability guarantee.

The crossed plans and audits separate Planner quality from Auditor quality. C and B share the Sonnet Orchestrator and Opus Planner, so their controlled difference is the Auditor. The Sonnet-plan/Sol-audit observations are useful components of the crossed study; they do not authorize another permanent allocation.

If the screening supports a challenger, compare A and that challenger end to end on three paired representative tickets, keeping downstream models and contracts fixed. Use authorized isolated runs or suitable replay facilities; never duplicate a real push, PR or tracker mutation merely to compare models. Record Tester and Reviewer findings attributable to planning and the total repair cost.

## 6. What to record

Use the workplace's existing evaluation or run-report mechanism. Do not add fields to runtime artifacts, a new database, mandatory telemetry or a parallel status system just for this study. Retain private evidence in its approved location.

For each case retain: case/group, exact source and contract basis, model identity and provenance, effort/host, permitted inputs, original outputs, parser/route results, attempts, human adjudication, measured resource use and evidence pointers. Separate observed, agent-reported, human-recorded and inferred values; missing values are `UNAVAILABLE`, not zero.

| Area | Measures and interpretation |
|---|---|
| Orchestrator | Incorrect/unauthorized advances, bad recovery decisions, stale identities, corrupted reply transport, malformed handoffs and human corrections. |
| Planner | Material contradicted assumptions, omitted requirements/surfaces, unjustified scope, unusable proof routes, justified AC changes after audit, revisions, questions and units advancing no AC. A legitimate necessary question is not automatically a defect. |
| Auditor | Human-adjudicated true findings and false positives; severity; known defects missed; conditional misses on defective plans; duplicates and findings already caught by deterministic checks. Report sample sizes and unresolved adjudications. |
| Contract execution | Correct completed versus stopped results, parser acceptance, actual tool/lane violations, fresh-context evidence, unavailable inputs and model fallback incidents. |
| Downstream work | Planning-related Tester/Reviewer findings, lock amendments, additional audit/review rounds, retries and implementation rework. |
| Total effort | Actual tokens, elapsed time, available billed cost, and human correction effort through an accepted result; separate observed timing from human estimates. |

Use severity and evidence rather than raw finding count, plan length or vendor rank. Report behavior by ticket type; an aggregate dominated by easy tasks can conceal a regression on difficult ones. Do not estimate platform cost from public API pricing when actual billing is unavailable.

## 7. Decisions, stopping and rollback

Before the scored runs, record the team's concrete tolerance for false positives, latency, cost and human intervention. Keep correctness and authorization requirements fixed; avoid inventing a universal numeric threshold from six tickets.

- **Continue the trial:** model identity and applicable contracts are established; no unresolved consequential routing/authority failure; evidence collection is usable.
- **Recommend B:** B preserves the required behavior and shows a repeatable, material benefit versus the controlled baseline. Sol must justify its place against Opus auditing through useful detection, fewer misses, reduced false positives or equivalent quality with worthwhile total-effort benefit.
- **Recommend C:** the Sonnet/Opus reallocation helps, but Sol's marginal audit value or compatibility is insufficient. This is a recommendation to the owner, not permission to silently change the selected reference.
- **Retain/restore A:** a regression or unresolved integration problem outweighs benefits. A remains a baseline, not a presumed proven configuration.
- **Evidence insufficient:** report that outcome when the sample or identity/host evidence cannot distinguish the groups. Do not relabel the configured B trial as successful merely because no defect was observed.

Pause affected evaluation on a consequential unauthorized transition, fabricated identity, source/evidence corruption, or unknown external outcome. Follow the existing recovery contract, preserve the original evidence and reconcile effects before restarting. A model rollback does not resolve an unknown external action.

For an authorized rollback of the reference allocation, restore only the three original model values in section 1 and update this decision record and its current entry-point/guide pointers. For a workplace rollback, restore the recorded authored model configuration through its real generator/installer and verify effective routing. Preserve run evidence and unrelated changes; do not reset the repository to the entire older commit.

Changing back to Opus only for the Auditor produces C; restoring all three original values produces A. Neither rollback creates missing verification or permits reusing stale reviews. Obtain any missing decision for the actual rollback scope, while honoring an already-authorized rollback plan.

## 8. Workplace-agent report and follow-up

Produce one reviewable report in the agreed workplace location with:

1. **Basis:** source/contract revisions, host, observed model mapping, effort, tools and which groups actually ran.
2. **Conformance and recovery:** cases, expected versus observed results, parser failures, stops, retry history and unresolved dependencies.
3. **Quality:** per-ticket planning and audit comparisons, human-adjudicated material findings, false positives, known misses and clean-control outcomes.
4. **Whole-chain impact:** downstream defects, rework, human effort, tokens, elapsed time and actual cost where available.
5. **Decision:** recommend B, recommend C, restore/retain A, continue a bounded trial, or evidence insufficient; explain the evidence and tradeoffs.
6. **Next action:** exact configuration or contract changes proposed, validation needed, rollback and any missing owner decision. Distinguish a recommendation, a local edit, observed host routing and publication.

This handoff is complete as a reference instruction when the candidate selections and links are consistent. The model trial is complete only when its authorized runs, adjudication and decision report exist. Until then, keep the status **TEST THE ALTERNATIVE — configured; evaluation pending**.
