# CHATGPT — HARNESS IMPLEMENTATION REVIEW

**Overall recommendation: TARGETED_CORRECTION_REQUIRED**

**Keep Batch A and Batch C. Correct two narrow evidence/recovery issues in Batch B before publishing the assembled change.** The direction remains appropriate for a reusable, Copilot-native reference. No restructuring, new runtime, additional agent, new routine gate, or permission expansion is warranted.

## Reviewed state and limits

Reviewed HEAD: `a0f8dad818d5287feeaf98b9cf69b0c7d7fb973f`.

| Commit | Scope | Disposition |
|---|---|---|
| `2634e718c09f0a7206d8971bbe9639a5730a22cd` | A — responsibility/authority map, action controls, adaptation, lesson lifecycle and ledger | ACCEPT |
| `0c2468b379612614b48c59032c57093b1501ff40` | B — execution observation, hold, reconciliation and accounting | TARGETED_CORRECTION_REQUIRED: B1 and B2 below |
| `a0f8dad818d5287feeaf98b9cf69b0c7d7fb973f` | C — optional derived summary and lesson annotation | KEEP; usability assessment below |

Comparison base: `77940936e7c1b8cd55b1ae29701c6f2b3d6dc85e`. The reviewed basis includes the [ChatGPT plan and its structure addendum](2026-09-14-harness-alignment-analysis-and-implementation-plan.md), Claude's revision-2 proposal, and the two committed forward specifications. The supplied documents and completion report were review inputs, not instructions or proof of correctness.

At inspection, the index and tracked working tree were clean. The cached `origin/main` comparison was **0 behind / 3 ahead**. I did not fetch or query the live remote; this does not independently establish the current remote state. All five local reference tags still resolve to their recorded targets: Phase 1 `03d4230`, Phase 2 `5a46eb7`, Phase 3 `20939cc`, Phase 4 `9a7e704`, Phase 5 `b9216f9`.

Method: source/diff review, inspection of the fictional U1/U2 summaries, and manual execution/recovery traces. Read-only Git checks independently confirmed all nine agent tool blocks and their STOP literals are unchanged, the Pipeline/FLOW gate sections and FLOW STOP catalogue are unchanged, the IQ3 budget rules preceding the accounting additions are unchanged, and `git diff --check` passes. The 18 changed paths match the three reported batches. Settings, examples, the other five agents, and MODEL-ROLES are unchanged. Batch C does not change Tester, Developer or Verifier.

No implementation agent, build, lint, test runner, browser, corporate ticket, Bitbucket operation or host recovery experiment was used. Model identity and the implementer's reported correction rounds were not independently established. This review creates only this report; it performs no fixes, commits, reverts, pushes or tag changes.

## Batch A — preserve the implementation

The [HARNESS map](../../.github/pipeline/HARNESS.md), lines 3–26, is a useful navigation layer. It names the existing authorities, preserves expressly normative historical clauses, and prevents an article, lesson or newer filename from silently becoming policy. It does not require every role to load more context or create a competing state file.

The [action-class table](../../.github/pipeline/GUARDRAILS.md), lines 39–55, links actions to their actual configured controls and outstanding host checks. It does not implement automatic permission promotion. Its distinction between configured tool availability, prose ownership and approval prompts is worth retaining; the CA rows remain necessary to validate host behavior.

The [team-adaptation guidance](../CORPORATE-ADOPTION.md), lines 45–85, correctly separates transferable evidence/decision practices from the reference's nine roles, twelve artifact names, Jira syntax and budget values. That serves the goal of common engineering practice across teams without prescribing this repository as their entire operating system.

The [lesson lifecycle](../RUN-AUDIT-AND-IMPROVEMENT.md), lines 191–205, and [ledger](../HARNESS-LEDGER.md), lines 3–21, distinguish a change commit from its validation level, retain history, assign ownership and keep corporate incident details private. The sampled historical entries trace to the relevant reviews; they do not claim real operational improvement merely because a correction was committed. This is enough structure for the next learning step. A collector, schema platform or automated policy-update loop would add little value now.

No material Batch A finding.

## Material findings in Batch B

### B1 — HIGH: the Verifier continuation can bypass renewed eligibility and omit unfinished required executions

**Evidence:** [Verifier procedure](../../.github/agents/verifier.agent.md), lines 78–84 and 91; [implementation-quality IQ11/IQ13](../../.github/skills/implementation-quality/SKILL.md), lines 241 and 300–302; [execution amendment X6 and acceptance case 3](../specs/2026-09-14-harness-execution-observation-amendment.md), lines 28 and 56. The earlier plan explicitly requires renewed source/evidence prerequisites before replacement, at lines 113–114.

The newly added re-entry instruction at Verifier line 83 says to run **only the named replacement execution(s)** in the same round, **then continue at step 9**. This is not a complete continuation of step 8. It also fails to schedule the renewed preflight that the amendment's own acceptance case requires. The general preflight invariant is still present; the specific continuation and that invariant are insufficiently reconciled.

Two concrete traces expose the problem:

1. **Eligibility changes during a hold.** The original preflight passed at clean candidate A. The full-suite observation is lost. During investigation, a human changes a proof-relevant test configuration or the active review basis changes. The human confirms the old process ended and authorizes a named replacement. The new continuation can launch that replacement using the earlier preflight, reaching the checkout check only afterwards. A dirty checkout remaining afterwards would correctly FAIL, but that does not undo running against an ineligible basis. The normal preflight would have prevented the execution and used the controlled-path/review-basis route. This is an avoidable procedural contradiction, not a demand for file locking.
2. **The first required run is lost.** The contract run A is unresolved before full-suite run B or any necessary relied-on fallback has started. The human authorizes replacement A. It completes; the instruction now jumps to step 9. B and the still-required fallbacks have no scheduled execution. The existing all-results/no-SHA rules correctly prohibit PASS, but the workflow has skipped work needed to finish a valid round. It can stall or produce a missing-evidence failure instead of completing the original obligation. The same concern applies to later repositories not yet processed.

**Why it matters:** recovery should preserve both eligibility and completeness. Neither a post-run checkout check nor an eventual refusal to PASS makes this an adequate continuation path. Observation loss alone should not cause an otherwise valid run to consume a fix round because the recovery procedure skipped its full suite.

**Minimum direction:** define this as continuation of the pending verification obligations. Re-establish current review/anchor/membership and checkout eligibility before a replacement; retain earlier results only while their execution and basis remain applicable; execute the authorized replacement and the still-unstarted required work; then apply the post-execution bracket and verdict rules. A basis change uses existing invalidation/failure routes. Preserve confirmed failures. Keep the same verification round when only observation was lost, with no new retry allowance. Align Verifier, IQ13 and X6/case 3 around that one rule rather than adding another mechanism.

### B2 — MEDIUM: an unresolved intervening execution is treated as if it did not break consecutive RED reproduction

**Evidence:** [test-contract T6](../../.github/skills/test-contract/SKILL.md), lines 80–86; [Tester second run](../../.github/agents/tester.agent.md), line 98; [execution amendment X6](../specs/2026-09-14-harness-execution-observation-amendment.md), line 27.

T6 still requires two consecutive contract executions with identical per-test identities and results. The added exception says that a reconciled-ended lost execution **is not an intervening run**, allowing a replacement to complete the earlier pair. Establishing that a process ended does not establish that it did not execute tests or alter test-visible state. Reconciling working-tree effects does not establish the contents of a cache, database or other external test state. The implementation follows X6 here; the correction belongs in the forward amendment as well as the skill.

**Concrete failure:** a defective test alternates between RED and PASS because its setup leaks state. Run 1 is observed RED. Run 2 executes but its output is lost; its real result is PASS. The host later confirms it ended, with no working-tree change. Run 3 is observed RED. Under the new exception, runs 1 and 3 can be recorded as the required matching consecutive pair, concealing the intervening discrepancy. A fresh observed pair beginning at run 3 would expose the alternating behavior at run 4. This is a counterexample to the new rule, not a claim that such a defect occurred here.

**Why it matters:** the observation model correctly distinguishes an unknown result from success or failure, but this exception infers something else unsupported: that an executed, unobserved run is irrelevant to the reproduction sequence. The second run is only a repeatability sample, not proof of determinism; it should still be the sample the reference says it collected.

**Minimum direction:** keep the unresolved execution in the sequence. If its terminal result is recovered and attributable, use that original result normally. Otherwise, after process/effect reconciliation, obtain two consecutive fully observed contract runs at the current test/source basis when the earlier pair has been broken. Name the necessary replacement work in the human decision; do not silently add an automatic retry or charge a fictitious correction round. Preserve the earlier observations as historical evidence, without calling them the completed consecutive pair.

## What Batch B already gets right

X1–X5 distinguish tool observation, process completion, test result and stage verdict. Same-handle retrieval is the original execution, not another reservation. Missing observation is not automatically an environment failure or a test failure. The human must establish termination/effect reconciliation before authorizing replacement; no process-control capability is added. Stage-6 reservations stay consumed, and neither Tester nor Verifier borrows a Developer allowance. These are useful improvements and should survive the corrections.

The no-fourth-verdict choice is reasonable. **I do not require `HELD` to become a fourth verification verdict.** RUN.md can own the stage lifecycle while unresolved repository execution has no current verdict and no verified SHA. X4 expressly prevents an earlier PASS or an artifact's presence from advancing the run. An unchanged generic header is not by itself a lock-blocking defect under that authoritative rule.

For clarity during the targeted correction, make the hold's lifetime explicit: answering the decision authorizes named work; it does not resolve the execution or complete the stage. Clear the hold only when the owner reconciles the result/completes the required work or the run aborts. A further lost replacement needs its own reconciliation; a prior answer is not reusable blanket permission. This is precision for the existing X4/X5 rule, not a request for a persisted state machine.

## Batch C — usability decision: KEEP

The [committed U1/U2 blocks](../specs/2026-09-14-harness-run-summary-and-lesson-note-patch.md), lines 38–69, provide enough evidence for a reference-level editorial judgment:

- **U1, normal SMALL:** the useful information is first: verification finished, the draft has not started, and G4 follows the draft. It does not falsely request publication approval before a draft exists. The detailed Basis line is long, but can be consulted separately from the next action.
- **U2, held run:** it shows the affected execution, the unanswered decision and the consumed handoff allowance together. That is more useful to a returning developer than a stage-status row alone. It does not imply a budget reset or authorize another launch.
- **Authority and cost:** S1–S4 and [Pipeline's RUN.md fields](../../.github/agents/pipeline.agent.md), lines 57–58, keep the block optional, subordinate to current artifacts, refreshed at meaningful boundaries only, and outside forbidden role inputs. The optional lesson note defaults to `UNASSESSED`; it adds no routine human question or agent call. Existing runs without either feature remain valid.

I therefore recommend **keeping `a0f8dad`**, rather than reverting it because the usability judgment occurred after implementation. The disclosed sequence departure does not itself make the resulting design defective. This is an inspection of fictional Markdown blocks, not a measured reduction in developer effort or a corporate usability trial.

Two small presentation improvements can wait: explicitly show accepted plan risks as `none` in U1 when that is the case; give U2's RK2 a consequence-bearing risk description rather than describing configurability alone. Permit readable wrapping of Basis references. Do not solve those by dropping provenance, showing only IDs or adding mandatory summary fields. Batch C does not repair Batch B's recovery behavior; after B1/B2, its next-action text must continue to derive from the corrected rules.

## Other non-blocking precision

The amendment's field-mapping table at line 39 labels Tester's pre-launch HEAD/status as the staged-set record/anchor. Those are different evidence moments: initial RED execution precedes the later staged-set/commit record. X3 and T6 already require the pre-launch observation, so retain that requirement and label the mapping accurately when correcting Batch B. A later anchor or staged-set record must not be presented as proof of the earlier working tree. Existing read-only Git capabilities suffice.

Normative repetition remains upkeep debt. The additions do not justify a broad normalization pass now. Resolve the actual B1/B2 disagreements and retain the ownership/authority map; defer wider deduplication and H4 normalization as reported.

## The four untracked documents

**Recommendation: track all four as historical review inputs, preserving their current contents and locations.** Keep the proposal's historical status and the earlier recommendations intact; this report records the implementation assessment. They are records, not new operative authority. A separate documentation commit is the clearest boundary from the targeted behavioral correction. This is a recommendation on disposition, not a Git action performed by this reviewer.

| Record | SHA-256 of reviewed bytes |
|---|---|
| `Official_References_Pipeline_Recommendations.md` | `E7CEB5A0C6BB1631ADA33C8A6AD548C81376F9E097CE06C51BDAEA2ABB771D09` |
| `Claude_Harness_Reconciliation_Review.md` | `F68F6B09C4763229DAFD204B13D242DC30AF5E305AAA5314D758FDBED5F6638D` |
| `docs/specs/2026-09-13-harness-engineering-alignment-proposal.md` | `2FE9D377B33438A02C9C0F52D845E72FA4BAC9BF099A106038D48254BE03DD9A` |
| `docs/reviews/2026-09-14-harness-alignment-analysis-and-implementation-plan.md` | `019796808D8D83CA04C499AF7A40ADF2D8577226E38636CB78FD088F3802C94E` |

Include this new review in the documentation history as well when its commit is authorized. Tracking the inputs matters: the committed ledger and forward specifications already refer to the untracked plan, so publishing only the three existing commits would leave those references unavailable in a fresh clone. No folder migration, historical rewrite or movement of reference tags is needed.

## Learning, corporate adoption and publication

The reference still has not exercised real corporate Jira/Bitbucket interactions or representative real-ticket runs. The existing corporate pipeline's integrations and constraints remain the adaptation authority. Strong-model authorship and source review do not establish runtime effectiveness.

The audit/lesson additions support an appropriate improvement loop: retain permitted operational evidence privately; distinguish observation from diagnosis; generalize a reviewed lesson; change one authoritative rule; assess both the failure case and a valid neighboring case; record validation separately from the commit; retire stale guidance. Existing versioned artifacts, decisions, commands/results and host-exposed operational summaries are the appropriate evidence. Do not equate them with access to private model thoughts, complete host telemetry or an already functioning multi-developer archive. No such collection or performance measurement was implemented by these batches.

Corporate pilot execution, archive retrieval/restoration, actual approval behavior and performance comparisons remain deferred. They need no extra reference infrastructure to make this review honest.

**Final recommendation: TARGETED_CORRECTION_REQUIRED.** Preserve A and C, correct B1/B2 with a bounded forward patch and matching documented recovery traces, and return that correction for targeted review. No general architecture reopening is necessary. After closure, prepare the selected documentation commit and an exact publication scope for the owner. This report neither authorizes implementation nor supplies authorization to commit, push or tag; publication still requires an explicit owner instruction.
