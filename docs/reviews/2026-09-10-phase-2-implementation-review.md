# ASTRA — PHASE 2 IMPLEMENTATION REVIEW

**Overall recommendation: TARGETED_CORRECTION_REQUIRED**

**Reviewed commit: `8b279c9c46e1731e4e57bf0419c6a442b0a92081`**

**Material findings: 3.** The implementation substantially achieves the approved architecture and is worth retaining. The remaining corrections concern one recovery path and the LARGE example's demonstration of grounded, internally consistent approval. They do not justify reopening Phase 1, redesigning Phase 2, or starting Phase 3.

## 1. Repository state and review limits

Reviewed the assembled local files and the changes from administrative Phase 1 closure commit `0f54a59790d86ddbdd655bddac85f903d62f44a1` through:

- `185a2e2995fe017c33d468d0d98322e9781d3ac8` — approved contract.
- `abf84686980e085f310d8f3366e5739ce690ba16` — policy skills, agents, orchestration contracts.
- `960ac5be503ca7d0ef97f42d46691f3961dfc9dc` — planning examples.
- `8b279c9c46e1731e4e57bf0419c6a442b0a92081` — guidance and closure material.

The tracked working tree and index were clean. Four existing Astra review files were untracked and were left untouched. The local `origin/main` reference remains at `0f54a59`, with these four commits ahead. A read-only remote query failed because the configured network/proxy endpoint was unreachable; therefore “nothing pushed” is consistent with local state and the handoff, but was not independently confirmed against live GitHub.

The local annotated `phase-1-reference` tag still peels to `03d4230e9398a80586a4b8be47ed522638bf77d8`. Compared with the administrative closure baseline, the Phase 1 contract, archive, completed PAYMENTS example, unrelated agents, two intake skills, Copilot instructions, and VS Code settings are unchanged. Planner and Adversary tool declarations are unchanged. The historical proposal retains the SHA-256 recorded in the architecture review: `6C74C0CAD172107F11B7B52F606011413ACB58F866ED4AFF8EC561F82AFBF492`.

This review used actual source inspection, cross-file comparison, and document-level counterexample traces. It did not execute Copilot, tests, builds, corporate tools, or implementation agents. The examples' repository descriptions are fictional evidence to evaluate for adequacy and consistency, not facts independently verified in real payment services. Fable's PASS statements and challenge-case table were treated as claims to check.

## 2. Architecture-to-implementation assessment

The major architecture-review changes were implemented:

| Area | Assessment |
|---|---|
| Planner and requirement completeness | Meaningfully improved. Source obligations and developer constraints receive dispositions and coverage references; technical constraints need not become artificial tests. Unknowns/warnings must be carried forward. |
| Source and decision integrity | The policy distinguishes source provenance from decision authority, preserves the evidenced-default exception, and makes material replacements trigger review. The LARGE example does not consistently apply its assumption rule; see F2. |
| Repository grounding | Evidence pointers, scoped `NOT_FOUND`, soft presentation targets, and consequence-selected checks are practical. They reduce unsupported certainty without requiring exhaustive archaeology. |
| Cross-repository planning | The interface record usefully separates failure behavior, deployment compatibility, development order, and ownership. External work is not authorized by a local G3 choice. |
| Acceptance criteria and preservation | Existing exercise routes and combined outcomes are appropriate planning interfaces. Preservation is intent, not baseline proof. The LARGE example's attempt-limit criterion remains inconsistent; see F3. |
| Adversary | The independent boundary and combined-outcome questions are substantive improvements over reversing Planner's checklist. No competing plan or finding quota is required. The example's approval still demonstrates a material miss; see F2. |
| G3 | Outcomes, choices, exceptions, risks, and direct Adversary residuals form a useful decision view. `APPROVE` and `SEND_BACK` are now semantically distinct. Critical assumptions hidden behind a count remain problematic in the LARGE example. |
| Planning cycles | Distinct `cycle.round` identities, human-only cycle resets, and `CURRENT APPROVE` address the reported send-back defect. Repository-adding recovery remains incomplete; see F1. |
| Phase boundary | No test-authoring machinery, delivery integration, new tools, or runtime infrastructure was added. Testability prerequisites are a legitimate forward contract, not Phase 3 implementation. |
| Reference integrity | Separate planning-only examples correctly avoid borrowing the completed Phase 1 run's verification and publication evidence. The historical reference is preserved. |

Principal evidence: [approved contract, R1–R12](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-2-planning-quality-contract.md:20>), [plan-grounding](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/plan-grounding/SKILL.md:14>), [challenge-plan](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/challenge-plan/SKILL.md:14>), and [Planner procedure](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/planner.agent.md:62>).

## 3. Material findings

### F1 — HIGH: repository-adding redirects lose their preparation prerequisite on resume

**Affected components:** Pipeline stage 4 and resume selection; corresponding FLOW/pipeline-skill recovery descriptions and contract trace.

**Evidence:** [pipeline.agent.md](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/pipeline.agent.md:69>), lines 69–85, especially 73 and 85; [FLOW.md](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/pipeline/FLOW.md:138>), lines 138 and 167; [pipeline skill](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/pipeline/SKILL.md:86>), lines 86–87. Workspace's existing preparation obligation is [per confirmed repository](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/workspace.agent.md:55>), lines 55–62.

The uninterrupted redirect is correctly ordered: ask G1 for the added repository, prepare it, then plan. However, the recovery calculation still operates on artifact presence/status and gate answers. It does not make the existing WORKSPACE artifact incomplete when the confirmed repository set expands.

**Concrete trace:**

1. Repository A is prepared. WORKSPACE.md exists and stage 2 is COMPLETE. Planning reaches a BLOCK requiring repository B.
2. The developer redirects Planner to include B. Pipeline supersedes the old planning artifacts, obtains G1 confirmation for B, and records the new `CURRENT` G1 entry.
3. Execution stops after that RUN update, before Workspace prepares B or records a failure.
4. On resume, WORKSPACE.md still exists with its successful A result. G1/G2 are current. PLAN.md is the first all-SUPERSEDED artifact, so the stated earliest-artifact/gate rule selects stage 3.
5. The new plan can therefore advance without the promised preparation of B. The old artifact's existence is mistaken for completion of the newly enlarged preparation scope.

The instruction to run stage 2 before the new cycle expresses the right intent, but it is not carried into the persisted recovery predicate. A developer confirming the proposed resume point is not deciding knowingly to waive preparation. The “never report COMPLETE” check is too late to establish the prerequisite before planning/testing begins. The unchanged Tester also does not consume WORKSPACE.md as its input, so it is not a substitute for this orchestration check.

**Why it matters:** preparation establishes the branch and baseline for every authorized repository. Skipping it can send later work toward an unprepared checkout, or cause avoidable downstream failure after approval. This is an avoidable reference-procedure gap, not a demand for host-enforced transactional execution.

**Recommended direction:** make repository authorization changes durably invalidate the completion of stage 2 for the added repository. Resume must reconcile prepared repository coverage against the current confirmed set and return to preparation before planning. An existing RUN status or explicit pending preparation record is sufficient; no scheduler, database, locking, or new artifact is needed. Exercise the interruption both before and after the added repository's preparation result is recorded.

### F2 — HIGH: the LARGE example approves material feasibility assumptions as deferred test concerns

**Affected components:** `PAYMENTS-12345-planning/PLAN.md`, its Adversary review and G3 evidence; example-based closure claims.

**Evidence:** [LARGE PLAN.md](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-planning/PLAN.md:137>), lines 137–142, 151, 163–167; [LARGE ADVERSARY-REVIEW.md](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-planning/ADVERSARY-REVIEW.md:33>), lines 33, 58–59, 68; [G3 record](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-planning/RUN.md:74>), lines 74–76. Compare [plan-grounding R6](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/plan-grounding/SKILL.md:81>), lines 81–92, and [Adversary's required checks](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/adversary.agent.md:64>), lines 64–68.

Two assumptions control whether the proposed business behavior is feasible:

- **Q4:** `LedgerClient` must expose report failure rather than return silent success. E2 and its verification establish that an interface exists and is used; they do not establish this failure contract. Q4 says the problem is observable only if Phase 3's test double fails loudly. Adversary accepts it as `ASSUMED`, describing the consequence as bounded to test-double design.
- **Q5:** `audit_log` is assumed to have the needed columns, while a schema change is explicitly outside scope. E9 establishes the table's existence and the instruction to reuse it, not its ability to represent an attempt number. Adversary nevertheless calls this reversible within the change, even though the plan itself says failure would require a new schema decision outside the current plan.

**Concrete failure scenario:** the real client wrapper suppresses a transport failure. A future test double throws as directed, so the retry logic passes the fictional failure case, but production never enters the re-report/UNREPORTED path. The test double has modeled the wished-for dependency behavior instead of validating the actual dependency. Alternatively, the existing table cannot store an attempt number: the approved “new write path only” approach cannot satisfy AC4 without reopening scope.

Both conditions could be represented honestly as uncertainty. The defect is treating them as adequately reviewed, low-consequence technical assumptions, while G3 sees only “2 (Q4, Q5)” and “no unresolved scope.” A concrete consequence sentence does not make a material failure assumption harmless or make an out-of-scope schema change reversible within the approved change.

**Why it matters:** this example teaches the precise behavior Phase 2 is meant to prevent: move a consequential repository fact into an assumption, defer it to future test design, and approve without inspecting or exposing it. It also weakens the Adversary demonstration: a correct policy exists, but the recorded challenge rationalizes the unsupported assumption.

**Recommended direction:** establish the specific client failure contract and schema capability in the fictional evidence, or route the remaining dependency/choice explicitly for a decision or BLOCK as appropriate. Do not solve a factual uncertainty merely by asking a human to approve that the fact is true. Where a change is needed, expose its scope and review the resulting plan. Reconcile the example's review, summary, and G3 record with that outcome. This requires no test-double policy or executable Phase 3 work.

The reported AC5 source-class correction **is closed**: AC5 is now `PROPOSED`, cites Q6, is challenged as a material policy choice, and Q6 is explicitly answered at G3. That success does not close Q4/Q5.

### F3 — MEDIUM: the approved attempt budget and AC2 describe different stopping points

**Affected components:** LARGE plan's acceptance behavior and its recorded approval/review.

**Evidence:** [LARGE PLAN.md](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-planning/PLAN.md:100>), lines 100–104 and 137; Approach line 67; [Adversary acceptance review](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-planning/ADVERSARY-REVIEW.md:64>); [G3 answer](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-planning/RUN.md:76>).

Q1 defines `maxAttempts = 5` as **total attempts including the first**, and the human approves that definition. AC2 instead says: given the delivery has **already failed the configured maximum number of attempts**, **when another failure occurs**, mark it permanently failed and schedule no further retry. The Approach likewise says “once the maximum is exceeded.”

**Concrete failure scenario:** five attempts fail. The approved budget requires termination at that point, but the scenario's Given is only now satisfied and its When asks for another failure. An implementation/test author following that scenario can model a sixth attempt or leave the fifth failure without the specified terminal transition. Following Q1 instead requires repairing or interpreting away the criterion before test authoring.

**Why it matters:** Phase 2 explicitly aims to give Tester a coherent, reviewable business contract. This is a boundary-condition contradiction in the new example after the shipped counting semantics have been explicitly approved. It is not a request to implement or test the retry algorithm in this phase.

**Recommended direction:** align the event that reaches the total maximum with the terminal transition and ensure the Approach, criterion, and Q1 use the same attempt-count convention. The review should demonstrate this boundary reasoning rather than report “no gaps.” Preserve the chosen budget unless the owner changes it; no new product choice is required merely to express it consistently.

## 4. Challenge cases and recovery assessment

These are source-level conclusions, not observations of an executed Copilot run.

| Challenge | Independent result |
|---|---|
| A source clause or developer constraint disappears | The policy supplies a real detection path: derive from captured inputs, compare dispositions, raise HIGH. It improves completeness beyond a key-level checklist. It cannot prove upstream Jira extraction was complete or that an LLM complied. The contract trace's “No path” wording is too absolute: an informed human can still accept a plan after escalation; the Adversary itself may not APPROVE the omission. |
| All citations are true, but a consumer or combined outcome is missing | The consequence-selected boundary check and combined-outcome question directly address this. The LARGE example's uncited status consumer is useful. Its Q4/Q5 approval nevertheless shows that a plausible plan can still be rubber-stamped at another critical dependency; F2 prevents treating the demonstration as fully adequate. |
| A material G3 answer changes after round two | The reported `CURRENT SEND_BACK` defect is corrected. `SEND_BACK` supersedes planning evidence; only `CURRENT APPROVE` authorizes stage 5; `cycle.round` distinguishes the replacement. Ordinary interruption before replacement planning resumes at stage 3. Repository-adding variants need F1. |
| A new observable boundary has no existing route | Closed at reference-contract level: `NO EXISTING ROUTE` must surface a G3 prerequisite; a future boundary does not satisfy Tester. Human approval of scope does not silently rewrite Tester's unchanged scaffolding constraint. |
| A correct SMALL change has no novel finding | The policy permits this and the example records specific local and combined-outcome checks. There is no finding quota. It is usable, although its template overhead can be reduced without weakening checks. |

Relevant rules: [challenge-plan, lines 16–24 and 51–63](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/challenge-plan/SKILL.md:16>); [plan-grounding, lines 70–77](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/plan-grounding/SKILL.md:70>); [pipeline, lines 71–85](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/pipeline.agent.md:71>). Fable's trace table is [contract §6](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-2-planning-quality-contract.md:138>).

Additional recovery states were considered:

- **Plan exists, no Adversary review yet:** the missing stage-4 artifact is earlier than G3; review remains required.
- **Replacement plan exists, old review is superseded:** stage 4 is missing and must run for the replacement plan. The general claim that every interrupted cycle “always resumes at stage 3” should be narrowed to interruption before the replacement plan exists.
- **An old APPROVE remains in history:** supersession makes it stale, and its basis cannot equal the new active `cycle.round`. It cannot authorize stage 5.
- **Old downstream artifacts exist when planning is redone:** the general rule that redoing an artifact supersedes every later-stage artifact, with dependent gates made stale, closes this when read with the cycle procedure. Do not weaken that transitive rule into superseding only PLAN and review.
- **New developer answers:** replacements are input to the new plan, must be accounted for in its response section, and receive another review and G3 approval. They are not approval of an unwritten plan.
- **Repository addition interrupted after G1:** this is the additional material case in F1. Artifact existence alone does not represent preparation coverage of an expanded repository set.

## 5. Planner, Adversary, and G3 in practice

**Planner:** the new items table earns its cost. It distinguishes omitted work, preserved behavior, exclusions, and unresolved items; implementation constraints avoid turning every developer instruction into a test. Operative file paths resolve the architecture proposal's deferred directory-matching ambiguity. The existing-route requirement appropriately anticipates Tester limitations. These should be preserved.

**Adversary:** meaningful procedural independence now exists. Deriving obligations before Planner's disposition reduces anchoring; selecting a boundary outside Planner's citations counters evidence-selection bias; checking combined outcomes probes whether individually satisfactory criteria compose into correct behavior. Bounded alternatives explain a flaw without making the critic a second Planner. Residual findings are now explicitly defined for every verdict, so a human override sees outstanding HIGH findings as well as minor concerns.

The remaining limitation is not solved by changing model names. The same model can share blind spots or produce a convincing check record without adequate inspection. [MODEL-ROLES R12](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/pipeline/MODEL-ROLES.md:40>) states that honestly. The example failure in F2 calls for applying the existing method correctly, not a model-diversity mandate.

**G3:** accepting displayed recommendations can approve the current plan; replacing a material choice triggers a new cycle. That is the correct distinction. Direct residuals and outcome prose let the developer focus on decisions rather than reconstruct the whole artifact. The LARGE gate is lengthy because it has several actual decisions, which is acceptable; presenting it as a single long paragraph is less readable than grouping those decisions. The problem that blocks closure is the hidden material uncertainty in F2, not its word count.

## 6. Depth, SMALL-example UX, and non-blocking improvements

SMALL/MEDIUM/LARGE is implemented as depth selection, with all core guarantees retained; it is not a score, separate pipeline, or permission to omit material work. A developer can challenge the rationale through the existing G3 send-back or redirection path without another gate. The class is present in the plan but absent from the exact G3 script; one short rationale line would improve visibility when classification affects review effort, though this is not a correctness blocker.

The [SMALL plan](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/PLAN.md:10>) contains two requirement items, four evidence rows, two ACs, one preservation statement, one risk, and one assumption. That substance is modest and understandable. The [G3 interaction](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/RUN.md:66>) needs only approval. I would consider it a reasonable reference demonstration, but would not copy all its fixed headings and empty sections into an internal workflow by default. Its 101 lines reflect template and spacing overhead, not an intrinsically large investigation. Compressing blank lines to report “58” is not a usability test.

Non-blocking improvements:

- Allow optional empty sections to collapse into one short statement for SMALL, while retaining their underlying checks. Avoid repeating every “none” at length in the gate.
- Clarify what counts as a “changed interface” for depth classification. The SMALL example changes accepted inputs at an existing endpoint while preserving response shape. Otherwise teams may read the rule as making almost every endpoint validation change LARGE despite the intended consequence-based classification.
- SMALL AC2 is labelled `JIRA`, but the [quoted Jira field](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/INTAKE.md:17>) explicitly states non-HTTPS rejection and preservation of existing registrations, not AC2's positive acceptance statement. Cite the appropriate derivation/preservation basis rather than implying that exact positive obligation was supplied. This does not change the intended behavior or require another human decision.
- Reduce normative repetition over time. Both skills call themselves normative but defer to the approved contract; agent bodies repeat substantial rules; the resume paragraph is repeated across several assets; the guide describes the skill as the single normative location. The precedence is understandable, but “exactly one normative place” is not literally achieved. Keep one authoritative policy and concise references where possible; do not turn this into a restructuring prerequisite for the narrow fixes.
- Align the later-round reading-order descriptions: `challenge-plan` line 71 says to read the response before re-deriving; the agent procedure performs derivation first and response review at step 8. This does not remove the independently selected checks, but the claimed exact order should be unambiguous.
- Qualify closure/guidance claims such as “No path lets the plan be approved” and “an interrupted cycle always resumes at stage 3.” State the actual human-override and partial-progress conditions.

## 7. Phase boundaries and internal-pipeline reuse value

The implementation remains predominantly planning work. No tests, mocks, runner policies, GREEN iteration mechanics, deep Verifier rules, delivery tools, scripts, or runtime services were added. Existing testability and file-path semantics were treated as producer/consumer interfaces. That is appropriate forward evolution of current main, not a reason to reopen Phase 1.

The LARGE example's appeal to a future test double in Q4 crosses the boundary in the wrong way: it substitutes a testing assumption for present repository grounding. F2 should be corrected at the planning/evidence level. Merely mentioning a future testability prerequisite is otherwise legitimate and should not force Phase 3 work into this review.

The highest-value reusable ideas are:

- Source-obligation disposition, including explicit developer constraints and honest exclusions.
- Separating evidence, reversible assumptions, material proposals, and genuinely blocking unknowns.
- Checking a consequence-selected boundary beyond Planner's citations and composing failure outcomes.
- Showing intended outcomes, material choices, and unfiltered review residuals at approval.
- Treating human-directed replanning as new evidence with new approval, not as an autonomous retry.

The two policy skills are worthwhile reusable assets. Their underlying rules can be adopted without copying this repository's full template. Copilot frontmatter, agent tool lists, explicit skill reads, artifact ownership, and `agent/runSubagent` conventions are host-specific adaptation material. The organization's existing orchestration should implement the approval and recovery relationships using its existing facilities rather than reproduce an eleven-artifact bookkeeping scheme unnecessarily.

Keep Sonnet-5 as the baseline. Exact corporate MCP names, picker strings, agent-picker behavior, approval-engine behavior, and model benchmarking remain deferred. The repository's source does not independently prove which model executed Fable's implementation sessions; that provenance claim is separate from this assessment of the delivered assets.

## 8. Final recommendation

**TARGETED_CORRECTION_REQUIRED.** Do not push and lock this revision as the Phase 2 reference yet.

Retain the architecture and the strong policy changes. Correct the repository-addition recovery prerequisite, make the LARGE example's critical dependency assumptions honestly evidenced or routed, and align its stopping criterion with the explicitly approved total-attempt budget. Update the directly dependent review/approval and closure claims to match those corrections.

Phase 1 remains locked. No implementation changes, commits, push, or Phase 3 work were performed by this review. Only this review artifact was created.
