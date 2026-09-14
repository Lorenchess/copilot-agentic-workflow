# ASTRA — HARNESS TARGETED CORRECTION REVIEW

**Reviewed revision:** `f2b4868dd66acda8e9bc939994ffea5b8bd64ce2`

**Overall recommendation: READY_TO_PUBLISH_AS_REFERENCE**

**B1: CLOSED. B2: CLOSED. New material regressions: NONE found.** The correction resolves the two failure scenarios from the [implementation review](2026-09-14-harness-implementation-review.md). Batches A and C retain their earlier acceptance. No further implementation correction is required for this reviewed scope.

This is a technical recommendation, **not owner authorization to commit, push or tag**.

## Scope and repository state

Reviewed the six-file correction `3a8d186..f2b4868`, its interaction with the current Tester, Verifier and Pipeline procedures, and the preservation of the review inputs in `3a8d1867e53be7f41b1b7719dd6162430cdf7a59`. The broader architecture and deferred Batch C presentation notes were not reopened.

At inspection, local `main` was at the reviewed SHA with a clean index and working tree. Its cached tracking comparison was **0 behind / 5 ahead** of `origin/main`. I did not fetch or query the live remote. All five local reference tag objects and targets match the previous review; no tag was changed.

This review used source/diff inspection, manual scenario traces and read-only Git/file comparisons. No runner, build, lint, browser, implementation agent, corporate host or publication operation was used. The only file created by this review is this report.

## B1 — CLOSED: verification resumes the pending obligations after renewed eligibility checks

**Evidence:** [Verifier](../../.github/agents/verifier.agent.md), lines 56–57 and 78–91; [implementation-quality IQ13](../../.github/skills/implementation-quality/SKILL.md), line 302; [amendment revision 2](../specs/2026-09-14-harness-execution-observation-amendment.md), X6 stage 7 and cases 3/5/5b.

The new re-entry instruction schedules steps 3–7 before replacement. IQ13 explicitly requires the same candidate SHA, current review basis, active anchor/membership, exception coverage, clean checkout, and committed/working-tree controlled-path and envelope eligibility. A changed basis follows the existing invalidation/failure routes without launching the replacement. The preflight is therefore part of the actual continuation, rather than only a general invariant elsewhere.

The continuation now includes the authorized replacement **and all still-unstarted required work**: the other contract/full-suite execution, necessary relied-on fallbacks, and repositories not yet processed. Other repositories remain subject to their ordinary per-repository preflight. The final bracket and all-results requirement still precede a verified SHA or PASS. The former jump directly from one replacement to step 9 is gone.

Earlier observed results may be retained only on their applicable basis, are labelled as retained in the artifact, and do not erase confirmed failures. Observation loss alone consumes no Verifier FAIL round; a real eligibility or test failure still follows its normal route.

| Manual trace | Result under the assembled rules |
|---|---|
| Contract execution A loses observation before full suite B starts; basis unchanged | Repeat preflight, replace A, execute B and any necessary fallbacks, finish other pending repositories, then bracket and render the ordinary verdict in the same round. |
| Proof-relevant configuration changes during the hold | Renewed preflight detects the controlled-path change; no replacement runner executes in that repository; existing failure/restoration routing applies. |
| Candidate SHA, review basis, anchor or membership changes | Earlier eligibility is not reused; the existing invalidation/failure route applies before replacement. |
| A completed execution had already established a failure before another execution was lost | That failure remains evidence. A successful replacement cannot turn the round into PASS by discarding it. |
| Another required execution loses observation during continuation | Return to HELD and require its own reconciliation; the earlier decision is not a retry allowance. |

**Residual limitation:** these are agent-followed procedures and point-in-time checks, not a workspace lock or proof that an external actor cannot edit between checks. That accepted host boundary does not require another reference mechanism.

## B2 — CLOSED: an unobserved execution remains in the RED reproduction sequence

**Evidence:** [test-contract T6](../../.github/skills/test-contract/SKILL.md), lines 82–86; [Tester](../../.github/agents/tester.agent.md), lines 98 and 103; [amendment revision 2](../specs/2026-09-14-harness-execution-observation-amendment.md), X6 stage 5 and cases 5/5a.

The exception that treated a reconciled-ended execution as non-intervening has been removed from both the skill and the forward amendment. If the original terminal result is retrieved and attributable, it remains the original execution's result and the pair is evaluated normally. Otherwise, a broken pair is replaced by two named consecutive, fully observed contract runs at the current test/source basis. Earlier observations remain history and cannot be presented as that pair. Tester expressly carries out both runs when the decision names pair replacement.

The original counterexample now fails appropriately: run 1 RED, run 2 unobserved, run 3 RED cannot establish the required pair. The authorized pair is runs 3 and 4; an alternating result at run 4 triggers T6's existing discrepancy diagnosis. If run 2's original result is recovered instead, a PASS at run 2 exposes the discrepancy directly; an attributable matching RED can establish the original pair without manufacturing another execution.

This does not create a generic execution allowance or renew a WITNESS correction round. The pair-specific rule supplies the named work needed to restore that proof, after process/effect reconciliation.

**Residual limitation:** two observed consecutive runs remain a repeatability sample, not proof that all races or environmental dependencies are absent. The correction restores the promised sample without overstating it.

## Related corrections and regression check

[Pipeline](../../.github/agents/pipeline.agent.md), line 79, and amendment X6a now distinguish authorization from resolution: the answer permits named work; HELD clears only after reconciliation/completion returns an ordinary outcome, or abort. A subsequent lost observation needs its own decision. This closes the lifecycle precision note without adding a fourth verification verdict, a routine gate or process-control tools.

The amendment's pre-launch mapping now identifies a separate status/HEAD observation before launch. It no longer substitutes the later staged-set record or RED anchor. The named reads already appear in Tester's allowed command forms at line 86.

Independent comparisons confirmed:

- Exactly the six reported correction paths changed; no additional implementation surface was added.
- All nine agent tool blocks and their STOP literals, Pipeline's gate wording, and the entire IQ3 budget/accounting section are unchanged from the previous reviewed implementation.
- Settings, pipeline documents, Developer, the other unaffected agents, examples, and Batch A/C assets are unchanged by the correction. The FLOW STOP catalogue therefore remains unchanged as well.
- `git diff --check` passed for the correction.

**No new material regression found.** Normative duplication and Batch C's two presentation notes remain accepted, non-blocking debt; there is no need to delay this closure for them.

## Records and recommended publication scope

The four input files' current SHA-256 values exactly match the table in the prior review. That review itself still hashes to `73C0B19FC53FEEDE8B81885D76ED8871B7948E6940BF292C98C6F3009E3B1DDE`. All five files match their records-commit blobs under Git's content normalization. Their locations and historical contents were preserved. The references that previously depended on untracked inputs are now present in the committed tree.

**Recommend publishing all five existing commits as one reviewed sequence**, through `f2b4868dd66acda8e9bc939994ffea5b8bd64ce2`, rather than selecting a subset:

| Order | Commit | Purpose |
|---|---|---|
| 1 | `2634e718c09f0a7206d8971bbe9639a5730a22cd` | Batch A |
| 2 | `0c2468b379612614b48c59032c57093b1501ff40` | Batch B |
| 3 | `a0f8dad818d5287feeaf98b9cf69b0c7d7fb973f` | Batch C |
| 4 | `3a8d1867e53be7f41b1b7719dd6162430cdf7a59` | Historical review inputs and implementation review |
| 5 | `f2b4868dd66acda8e9bc939994ffea5b8bd64ce2` | B1/B2 correction and amendment revision 2 |

This includes the corrective commit with Batch B and keeps the accepted UX and review history intact. It requires no rebase, cherry-pick or movement of any reference tag. This new closure report is untracked; preserve it in a separate report-only commit if the owner authorizes that record before publication.

An eventual publication action must re-check the live remote, final outgoing commit list and unchanged tag targets. The cached tracking comparison here is not that pre-push check. Owner authorization should name the five-commit scope and explicitly state whether it also includes a report-only closure commit. **No publication authorization is issued by this review, and no push/tag command was run.**

## Final assessment

**B1 and B2 are closed at reference-procedure level. The assembled changes are ready for owner-authorized publication as a reference.** They have not been validated on real corporate Jira/Bitbucket tickets, a corporate Copilot host, or operational performance measurements. Those deferred checks remain unchanged. No further general review cycle or redesign is needed for this correction.
