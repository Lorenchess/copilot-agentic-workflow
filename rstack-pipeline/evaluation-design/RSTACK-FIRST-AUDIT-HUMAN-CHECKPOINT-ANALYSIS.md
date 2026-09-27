# RSTACK First-Audit Human Checkpoint: Analysis and Claude Review Assignment

**Prepared:** 2026-09-27.  
**Status:** Analysis and recommendation, not an installed workflow change or permission to bypass a gate.  
**Purpose:** Continue the owner’s discussion with Claude Code about whether to ask a human after the first Planner–Auditor round or automatically perform a second round.

## Recommendation

**For the current pilot, place the human checkpoint after the first completed audit, on every verdict. Do not automatically start a second round because the Auditor disagrees.** Present the plan and independent findings together, then let the human decide what additional work is worthwhile.

Treat this as the initial controlled policy, not proof that every future factual correction must interrupt a developer. Once evaluated runs demonstrate value and reliable routing, the owner may explicitly approve one bounded automatic correction-and-re-audit for a narrow category of findings. That later policy is a hypothesis to test, not authorized behavior now.

The deciding principle is:

> Ask humans to resolve decisions, not to repeat repository investigations that agents should perform. Authorize another round for a specific information gain, not merely to obtain agreement.

## 1. Relationship to the existing redesign

Read [RSTACK-PLANNER-AUDITOR-HUMAN-LOOP-REDESIGN.md](RSTACK-PLANNER-AUDITOR-HUMAN-LOOP-REDESIGN.md) first. That document owns the requested target sequence, compact communication proposal, and proposed finalization paths. This follow-up explains the policy tradeoffs, a safe implementation order, and what evidence Claude should use to challenge the recommendation. It is not a second runtime routing authority.

At reference commit `8ab26aa92f143ee97089f8902472f52677c81b7f`, the redesign already requests:

- A combined HTML plan-and-audit brief after each completed audit, not before the first audit.
- A human checkpoint even when the audit agrees.
- A second round only when the human requests it; no automatic third round.
- A final human decision before Tester, with accurate disclosure of any amendments not independently audited.

See the revision-pinned [redesign source][R1]. Its description of installed behavior must still be verified against the workplace implementation. The reference repository is not evidence that the workplace scripts implement this policy.

## 2. What prompted this analysis

In a screenshot supplied by the owner, Claude Code reported that the installed pipeline behaves differently from the requested design:

| Report shown in the screenshot | Evidence status here | What Claude must verify locally |
|---|---|---|
| A refuted audit automatically routes back to Planner work without a human decision about another round. | Screenshot of Claude’s analysis; not independently verified implementation behavior. | Actual dispatch rules, script behavior, and run events. |
| One run reached four rounds and twelve attempts without asking whether further rounds were worthwhile. | Claude-reported observation, not a measured finding in this document. | Distinguish completed audits, Planner revisions, retries, resumes, and recorded human decisions. |
| `audit-response-check.mjs` and `gate.mjs` reject a latest audit that remains refuted. | Reported script behavior. | Inspect exact conditions, exit/results, downstream consumers, and fixtures. |
| Routing is repeated across several instructions/scripts, and agent definitions exist in two trees. | Reported implementation structure. | Find canonical sources, generated outputs, installer behavior, and every affected consumer. |
| An invariant recently encoded a rule against offering another round on the clean path. | Reported test of the previous policy. | Read its asserted behavior and distinguish policy choice from safety invariant. |

Do not turn these reports into verified claims merely by copying them into another document. Do not infer token usage, credits, actual hidden context, or a precise documentation-to-code ratio from screenshots.

**Confidentiality:** Do not upload the screenshot, workplace ticket identifiers, internal paths, employee identifiers, original runs, or internal repository details to this reference repository. Examples below are synthetic. Real evidence and reports containing it belong in an approved internal environment.

## 3. What is right in Claude’s caution—and what should be separated

Claude’s caution about a new “proceed without re-audit” option is reasonable: a UI choice is misleading if downstream validators inevitably reject its result. The decision must have a supported route through Tester entry, later eligibility checks, and final candidate review without falsifying the audit verdict.

However, there are two different changes:

| Change | Meaning | Can be introduced separately? |
|---|---|---|
| Pause after audit round 1. | Do not authorize another substantive round automatically; show the findings and ask. | Yes, provided dispatch and conflicting routing instructions are updated coherently. |
| Proceed to Tester without another audit. | Accept a specifically authorized final planning basis despite residual disagreement or post-audit amendments. | Requires a separate, supported authorization/finalization path and downstream compatibility. |

**The first change does not require the second to be implemented immediately.** A safe initial slice can introduce the checkpoint while leaving current Tester and release prerequisites intact.

During that transitional slice, make unavailable choices explicit. Do not display “Proceed without re-audit” as an executable action when the installed gate has no route for it. A refuted run can pause, receive a human-directed second round, or stop. Even a clean audit can still offer another round when the human identifies a concrete concern; it should not recommend redundant review by default.

This is an interim delivery sequence, not abandonment of the owner’s requested finalization path.

## 4. Why checkpoint-first is the recommended initial policy

The current concern is not disagreement itself. It is the lack of established evidence that extra rounds produce sufficient benefit for their processing cost, artifact generation, delay, and human effort.

Before allowing another automatic round, ask:

1. Is the Planner correcting a demonstrated factual error?
2. Is the Auditor adding a new material finding or stronger evidence?
3. Are the agents repeatedly discussing a decision only the owner can settle?
4. Has the input or proposed plan changed enough that another independent read can answer a new question?

A checkpoint makes these distinctions visible and supplies useful labeled cases for evaluation. It also lets the owner see the proposed plan together with its challenge, rather than consume a persuasive Planner presentation first.

There is a real cost: human waiting time may outweigh model time on some tasks. The recommendation does not claim checkpoint-first is universally faster or cheaper. Measure active processing, human review effort, and waiting separately.

Anthropic describes evaluator–optimizer loops as a good fit when evaluation criteria are clear and refinement has measurable value; it also discusses human checkpoints and iteration limits. This is vendor workflow guidance, not a measured comparison of RSTACK policies. [S1]

## 5. Classify the disagreement before deciding what another round can do

Use the existing labeling guide and failure taxonomy rather than create a competing label system. The categories here describe routing decisions for analysis.

| First-audit outcome | Initial-policy response | What a useful second round would establish |
|---|---|---|
| No material findings. | Show the combined brief and request normal human plan approval. Do not promote additional audit as equally necessary. | Only a concrete concern the human identifies. |
| Clear factual error with a bounded correction. | Show the correction opportunity and let the human authorize revision-and-re-audit. | The corrected plan is coherent with the requirements and the verified facts. |
| Product, scope, risk-acceptance, or required-behavior decision. | Ask the human to settle intent before another round. | Whether a plan revised against the now-settled decision is sound. |
| Missing evidence, inaccessible source, or inconsistent snapshot. | Obtain approved evidence or correct the input problem; otherwise pause. | An answer that could not be established from the previous inputs. |
| Contested interpretation or design preference. | Show evidence, consequence, uncertainty, and the exact decision needed. | A specific unresolved question, not agreement for its own sake. |

These are proposed routing categories, not claims about current implementation.

### Example A: another round has a clear purpose

The plan says a feature property defaults to `true`. The Auditor finds its declaration and a relevant test establishing `false`. The desired behavior is already specified.

The human can authorize: “Correct the description and proof strategy, then independently review the revised plan.” The factual error is not itself a new business decision.

### Example B: another round lacks a necessary input

The Planner proposes one disabled-feature response; the Auditor prefers another. The ticket does not decide the response, and neither proposal follows uniquely from a standing contract.

Ask the owner which behavior is required. Repeating the same model exchange does not supply the missing authority or intent.

### Example C: the Auditor may be wrong

The Auditor cites a caller as evidence that the change breaks a dependency. The Planner believes that caller is outside the affected execution path. Neither assertion alone settles it.

Present the original claim, evidence, and impact question. Authorize bounded investigation when it can settle the path. Do not require a human to inspect an entire codebase merely because two agents disagree; equally, do not treat the Planner’s acceptance or rejection as adjudicated truth.

The question for every proposed extra round is:

> What could this round establish that the current evidence does not already establish?

## 6. The human brief should support a decision, not recreate the audit

Generate the round-1 HTML from the selected plan and completed audit. Do not launch another Planner rebuttal just to prepare that checkpoint. Expose source references and enough context to make findings understandable; keep extensive evidence expandable or available on demand.

The brief should identify the current plan/audit snapshots and show:

| Item | Human-facing content |
|---|---|
| Plan | Goal, scope, proposed units, and proof strategy in brief. |
| Audit | Verdict, material findings, what was checked, and what remains unknown. |
| Each finding | Affected plan item, evidence, consequence, and resolution condition. |
| Required decisions | The intent or authority that the agents cannot supply. |
| Additional-round proposal | Exact findings/questions the round would address and known costs, or “unavailable.” |
| Actions | Only choices the installed workflow can actually execute. |

Synthetic example:

> **Plan:** Add a feature check while retaining existing authentication.  
> **Audit:** One factual contradiction and one unresolved behavior decision.  
> **Factual issue:** The plan’s default value conflicts with the source declaration. Evidence is linked.  
> **Decision required:** What response should the disabled feature return?  
> **Recommended next action:** Resolve that behavior, then authorize one revision-and-audit round addressing both items.

Ask “Another round would verify these specific changes; do you authorize it?” rather than an unexplained “Another iteration?”

Separate presentation from permission. Rendering a button does not create an authenticated approval channel. Record the actual decision through the adopted host mechanism, bound to the displayed subject. Do not invent a new approval service for this change.

On a clean audit, recommend proceeding to the agreed human approval. Keep the human’s option to request further examination without implying it is necessary or automatically starting it.

## 7. Preserve three truths on the no-re-audit path

Keep these distinct:

1. What the Auditor concluded about the plan it actually read.
2. What the human authorized, including exact amendments and residual disagreements.
3. What Tester and later verification actually established.

Illustrative history:

```text
A1 refutes P1.
The human authorizes a specific amendment without another plan audit.
Planner applies the approved amendment, producing Pf.
Pf is identified as human-amended without re-audit.
Tester independently checks the required behavior.
```

Do not change A1 into `holds`, claim it covered Pf, or treat later green tests as proof that the initial audit approved the final plan.

Reuse existing decision and subject records to bind the human’s action to the run/cycle, selected plan and audit, amendment set, resulting final plan, and unresolved obligations. Compute identities with tools where available; an agent-typed digest is not independent proof. Relevant uncommitted inputs need snapshot identity too, not just a commit SHA.

Human authorization can settle intent or accept uncertainty where adopted policy permits. It does not make a false claim true, supply missing evidence, authorize a prohibited action, or make a required criterion testable. If the approved amendments remain ambiguous, introduce unapproved material changes, or leave the plan non-actionable, pause rather than infer permission.

Declining round 2 is not automatically approval to start Tester. A reply must identify what should proceed and on what basis. Do not request another approval of identical intent when an exact approved amendment was applied faithfully, but escalate genuinely additional or ambiguous changes.

Planning authorization must not waive test locks, required behavioral checks, independent final code review, candidate freshness, or publication authorization.

## 8. Define round budgets so resuming cannot restart the loop

Keep separate identities/counters for:

| Concept | Meaning |
|---|---|
| Planning cycle | This linked sequence from the first plan through the final human decision. |
| Audit round | One completed substantive independent audit of an exact plan snapshot. |
| Planner revision | An edit or amendment to a plan; not automatically another audit. |
| Invocation attempt | A dispatch, including failures, stopped results, or incomplete transport. |
| Human decision | A recorded authorization for a specified action and subject. |

For the requested policy: one completed audit by default, a second only with the human’s authorization, and no automatic third audit or automatic Tester dispatch after round 2.

Separating attempts from rounds is not permission for unlimited retries. Propose a bounded recovery rule using existing mechanisms. A resume must retain the cycle, authorization, counters, and result identities. Check whether a previous invocation completed before replaying it; do not silently transform an interrupted dispatch into a fresh authorized round.

An incomplete audit is not a clean audit. Show its status and missing evidence; any permitted retry must remain visible and bounded. Do not fabricate findings to make a checkpoint look complete.

A later explicitly authorized new cycle must link to the previous one and explain why it restarted. Renaming the run or opening a new session must not be a way to evade the agreed limit. After the second round, unresolved essential questions can legitimately leave the run paused.

## 9. Implementation order: control first, supported finalization second

### Slice A: human control of additional rounds

After explicit implementation approval, coordinate dispatch, result handling, HTML timing, and contradictory instructions/tests so every completed first audit stops at the human checkpoint. Keep existing downstream requirements intact until their replacement is supported.

Verify refuted and clean outcomes. No automatic second round on refutation; no silent bypass of human approval on agreement. Clearly report unavailable no-re-audit actions instead of presenting unreachable options.

### Slice B: legitimate finalization without re-audit

Add the owner-approved planning-authorization path, exact subject binding, amendment verification, and compatible Tester/eligibility consumers together. It must preserve original audit results and disclose final-plan audit coverage.

Trace this path past Tester entry into candidate verification and final review so the change does not merely move a deadlock later in the run. Define rollback before activating the new path.

### Slice C: optional selective automation, only after evidence and approval

Later, test whether one bounded automatic correction-and-re-audit is useful when requirements are settled, primary evidence supports a bounded factual correction, no human-owned decision is missing, and neither scope nor authority changes.

Uncertain cases return to the human. This policy requires explicit adoption and evidence that the routing category itself is reliable. It is not permission for an agent to decide that a task “looks easy.” Do not implement it during the initial review or silently substitute it for the requested checkpoint-first behavior.

An existing test of the opposite policy does not decide the architecture. Change policy tests when the owner changes policy; preserve genuine safety properties. Fix canonical sources and regenerate derived trees through their supported process, rather than independently editing duplicate agent definitions.

## 10. Compact exchanges remain part of this policy

Reuse the communication design in [the redesign brief](RSTACK-PLANNER-AUDITOR-HUMAN-LOOP-REDESIGN.md) and [the artifact-efficiency review](RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md). Do not copy their complete schemas into another instruction layer.

Keep one compact current plan, the exact audited snapshots/results, concise finding dispositions, and the human decision. Generate the HTML from these records. Historical debates and raw logs remain available without being repeatedly rewritten into the current plan.

For an authorized second round, the Planner may evaluate the first findings and make bounded changes. Preserve its concise dispositions for the human and post-run evaluator. Give the fresh Auditor the complete revised compact plan and primary requirements/evidence, not an incomplete patch or a persuasive replay of the prior argument.

Use lean existing Markdown first when it avoids a parser migration. JSON is a candidate for predictable fields, not a demonstrated token-saving mechanism. A path-only dispatch still incurs the cost of files the receiver reads. Measure total relevant input/output and retrieval, not just dispatch length.

Do not add an efficiency agent, a second state machine, a new metadata file for every event, or a new documentation package. Reuse canonical owners.

## 11. What to measure before deciding whether automation is better

Cost matters, but cost without outcome quality is insufficient. Reuse the existing rubric and record evaluation separately from execution. Claude Code is the initial post-run evaluator, not a participant whose later judgments should rewrite the original run.

| Measure | Decision supported | Limitation / guardrail |
|---|---|---|
| Validated material findings resolved in an additional round. | Was the extra work useful? | Planner saying “fixed” is not independent validation. |
| New validated evidence or material findings from that round. | Did the round add information? | Count duplicates separately; a new issue may reflect new scope rather than better review. |
| Rounds waiting on human-owned intent. | Should escalation have happened earlier? | Do not label all human intervention as failure. |
| Model processing and tool execution time. | How much active work was spent? | Separate overlapping work and missing timestamps. |
| Human review effort and human waiting time. | Did a cheaper AI path make delivery slower or harder? | Waiting is not review effort. Record measured values or unavailable. |
| Input/output usage, retries, and host-reported cost. | Was the successful outcome less expensive? | File bytes are not token counts; estimates are not observed billing. |
| Repeated handoff content and generated artifact bytes. | Where is information duplicated? | Diagnostic proxies, not proof of cost or poor quality. |
| Downstream proof gaps, validated defects, and rework. | Was the final actionable plan better? | Include later findings; do not reward agreement alone. |
| Paused, failed, abandoned, and completed outcomes. | Is apparent efficiency hiding work that never completed? | Include all assigned cases, not only successes. |
| Stale approvals, counter resets, unauthorized rounds, and malformed results. | Did the policy preserve control? | Deterministic fixtures are preferable where applicable. |

For cost per accepted outcome, include the cost of unsuccessful attempts in the numerator and report the completion/acceptance rate beside it. Do not compress quality, dollars, human time, and latency into a fabricated single score.

Anthropic distinguishes a run’s transcript from the actual resulting state and discusses code-based, model-based, and human graders. This supports checking outcomes rather than accepting self-reports; it does not establish which RSTACK checkpoint policy wins. [S2]

### A small defensible comparison

First inspect historical first/second/later rounds to classify what changed and what was unresolved. This can identify candidate categories but cannot prove what would have happened under a policy that was not used.

Then propose a controlled internal comparison on safe representative tasks. Keep models, effort, tools, plan requirements, source snapshots, and artifact format constant while changing checkpoint policy. Do not simultaneously test new model allocation and JSON migration.

Include clean plans, factual corrections, owner decisions, evidence gaps, and disputed findings. Use independent post-run judgments with selective human adjudication; blind evaluators to the policy arm where practical. Record human intervention as part of the treatment. Small or incomplete samples support screening conclusions, not a universal winner.

Do not expose live work to a weaker control for experiment convenience. A simulated human decision in an offline fixture must be labeled simulated, not an authenticated workplace approval.

## 12. Acceptance scenarios for any eventual implementation

Use these as test requirements to adapt to actual tooling, not a claim that tests already exist:

| Scenario | Required behavior |
|---|---|
| First audit refutes the plan. | Show the combined brief and wait; no automatic Planner revision or second audit. |
| First audit holds. | Show the combined brief and wait for plan approval; an owner-requested extra round remains possible. |
| Human says only “no second round.” | Do not infer approval of an unspecified final plan. |
| Human authorizes round 2 for specific findings. | Revise within scope, dispatch a fresh audit, then require the final human decision. |
| Second audit still disagrees. | No automatic third round; use an implemented allowed finalization path or pause. |
| Human authorizes exact amendments without audit. | Preserve the prior verdict; verify amendment scope and disclose unaudited changes. |
| No-re-audit finalization is not yet supported. | Do not expose an executable option that the gate will necessarily reject. |
| Approved plan/source changes before dispatch. | Detect stale subject binding; clarify or re-authorize as required. |
| Required evidence is missing or a criterion is untestable. | Do not fabricate evidence or route it as a clean approval. |
| Session restarts or a result is delivered twice. | Retain cycle/budget state; do not duplicate substantive dispatch. |
| An audit stops before returning a usable result. | Preserve incomplete status and apply bounded recovery; do not count it as a successful audit. |
| Current runtime and generated agents disagree. | Resolve canonical ownership and regenerate consistently; do not ship conflicting routes. |
| A later gate consumes the final planning basis. | It recognizes the adopted authorization path without rewriting the original audit result or relaxing unrelated controls. |

## 13. Focused assignment for Claude Code

Read this analysis and the existing redesign. Inspect the installed implementation and approved run evidence available in your environment. Do not assume the public reference has the current workplace scripts. If source or evidence is absent, name the gap rather than invent behavior or require the owner to publish confidential material.

Evaluate the recommendation, not merely whether its wording is consistent. Specifically:

1. Verify or refute the screenshot-reported behavior: routing, script refusals, duplicated definitions, iteration history, and the old invariant.
2. Map the first-audit checkpoint separately from no-re-audit finalization. Identify which can safely ship first and all consumers affected later.
3. Classify actual extra rounds by factual correction, human decision, evidence gap, or unresolved dispute using existing labels. Identify which added validated value and which repeated content.
4. Explain the present-policy recommendation and the evidence needed for any future selective-automation policy. Do not silently substitute the latter for the owner’s requested workflow.
5. Specify compact human decision presentation, subject binding, amendment handling, round/attempt accounting, and recovery without introducing a competing runtime authority.
6. Propose the smallest coordinated implementation, tests, rollout, and rollback. Keep model/effort changes and serialization experiments separate.

**Output:** Update an existing targeted change-review report if one already covers this redesign. Otherwise create one concise report in an approved review location. Its sections should be: verified current behavior; findings and evidence gaps; policy recommendation; minimum implementation slices and affected consumers; acceptance scenarios; measurements/experiment; open human decisions; and KEEP / EXPERIMENT / DEFER / REJECT.

No new six-document package. No runtime, gate, model, effort, permission, test-lock, or submitted-evidence changes during this review. Do not execute a live pipeline, publish workplace evidence, or claim static inspection proves runtime enforcement. Stop for explicit implementation approval.

## 14. Sources, attribution, and limits

**[R1] Repository design basis, inspected 2026-09-27:** [Planner–Auditor–Human Loop Redesign at the inspected revision][R1]. This is a proposed design and assignment, not workplace execution evidence. Related canonical context: [evaluation-design README](README.md), [post-run evaluation workflow](RSTACK-POST-RUN-EVALUATION-WORKFLOW.md), and [artifact/handoff review](RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md).

**[S1] Vendor guidance, accessed 2026-09-27:** Anthropic, [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), especially “Workflow: Evaluator-optimizer” and “Agents.” Published 2024-12-19; the page itself notes that parts of its tooling landscape have changed. Used only for the general refinement/checkpoint tradeoff, not current host capabilities or a guaranteed optimal round count.

**[S2] Vendor evaluation guidance, accessed 2026-09-27:** Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), especially evaluation structure, grader types, and coding-agent outcomes. Published 2026-01-09. Used for evaluation methodology, not proof that checkpoint-first beats automatic re-audit in RSTACK.

**Owner/screenshot evidence:** The owner’s stated experience and a screenshot of Claude’s local analysis prompted this review. The underlying run artifacts, effective runtime configuration, script source, costs, and authority records were not independently verified in preparing this document.

## Bottom line

“Neither as a blanket rule” is a reasonable long-term position, but it needs an actionable current policy. **Use the first-round human checkpoint now. Earn any later automatic second-round exception through measured outcomes and explicit human adoption.**

The goal is neither maximum agreement between agents nor minimum human involvement. It is an actionable, evidence-grounded plan reached with the least unnecessary work, with human decisions made by the person who owns them.

[R1]: https://github.com/Lorenchess/copilot-agentic-workflow/blob/8ab26aa92f143ee97089f8902472f52677c81b7f/rstack-pipeline/evaluation-design/RSTACK-PLANNER-AUDITOR-HUMAN-LOOP-REDESIGN.md
