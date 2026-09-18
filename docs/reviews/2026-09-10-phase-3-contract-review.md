# CHATGPT — PHASE 3 DRAFT CONTRACT REVIEW

**Recommendation: PROCEED_WITH_CHANGES.**  
**Contract approval: targeted text corrections required before authorizing P3-C1.**  
**D6: recommend option (a), INCOMPLETE never reaches G4.**

The draft substantially incorporates the architecture review. The proof-boundary and requirement-authority contradictions are resolved. Three narrow issues remain in the actual contract: amendment evidence is insufficient for the comparison it requires, incomplete-evidence recovery has conflicting routes, and the proof-relevance rule exempts configuration categorically.

This is a targeted contract review, not a new architecture audit or implementation authorization.

## Evidence and repository state

- Reviewed local HEAD: **c3904cfe9fa266e23452d4300bdc146386530d7e**.
- Reviewed the complete, untracked 214-line [draft contract](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md), SHA-256 **F076E51040CCAF71560EF6F04085B0D9D7866A3BC7FF538633D2819DC2447F9A**.
- Phase 1 tag remains **03d4230e9398a80586a4b8be47ed522638bf77d8**; Phase 2 tag remains **5a46eb7a6bb951308742975bd8f9f51f77a6aca9**.
- The proposal hash remains **C6487EBD62FF576C5089888EE4470C65AF45AB9930D1825CF784AD0A017D5A43**, matching the previously reviewed version.
- No tracked or staged changes were present. Existing files were preserved; only this new review artifact was created.
- Checks were source inspection and scenario reasoning against the current Tester, Developer, and Verifier handoffs. No test execution, Copilot validation, implementation agents, commits, or pushes occurred.

## D6 — adopt the conservative publication rule

**Recommend (a).** A developer can authorize useful implementation progress while a required clause remains NOT_VERIFIED. That decision cannot establish evidence equivalence or authorize an unqualified verification claim.

The proposed INCOMPLETE verdict distinguishes unavailable required evidence from failing implementation and passing verification. Withholding G4 keeps the existing publication eligibility model intact. This is the smallest coherent reference rule and does not require a second publication path or PR-agent change.

Option (b) could be designed honestly as publication of an incompletely verified change; it need not be called a second class of “verified.” However, it adds authorization and reporting semantics that are unnecessary for Phase 3's present objective. Defer it. Actual corporate policy and facilities can be compared separately.

This is the reviewer's recommendation for the owner decision, not a record that the owner has already approved D6 or delegated implementation.

## Disposition of the original findings

| Original finding | Draft assessment | Evidence |
|---|---|---|
| **M1 — proof boundary** | **Addressed at architecture level.** Fake repositories prove local decisions, not stored columns. Real adapter/serialization and provider decoding evidence replace field-list agreement as the conformance basis. | [T3–T4, lines 45–65](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:45); [T8, lines 89–91](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:89). |
| **M2 — substitution claims** | **Core meaning addressed; recovery and exception handling still need correction C2.** NOT_VERIFIED remains explicit and INCOMPLETE blocks G4 under D6(a). | [T10, lines 103–105](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:103). |
| **M3 — amendment authority** | **Addressed at architecture level.** Effect is measured against the approved clause. REQUIREMENT_CHANGE returns to planning; OVERCONSTRAINT_REMOVED must retain the entire required outcome. | [T12, lines 123–129](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:123). |
| **M4 — review freshness and anchor transitions** | **Substantially improved, but C1 and C2 remain.** Basis, supersession, dependency-set review, and review of every amendment are appropriate. The recorded transition does not yet establish its contents. | [T11–T12, lines 117–133](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:117). |
| **M5 — reused evidence and support** | **Relied-on execution addressed; proof-relevant support needs C3.** Observed baseline and verification identity checks close the skipped-existing-test scenario. | [T5, line 73](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:73); [T9, lines 95–99](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:95). |

These are architecture dispositions, not evidence that future implementation or corporate execution has passed.

## Required corrections

### C1 — HIGH: a diff-stat cannot establish the approved amendment delta

**Affected text:** [T12 execution, line 133](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:133), also T11's re-review method and the amendment/correction records.

The new command is:

`git -C <dir> diff --stat <prior anchor>..HEAD -- <protected paths>`

It reports changed paths and line counts, not the before/after contents. The reviewer is then required to compare this record with the approved delta. The staged-set record also establishes paths, not the contents changed within them.

**Failure scenario:** approval permits correcting one fixture literal. An amendment changes that literal and weakens another assertion in the same file. Its path and line counts do not establish whether the change equals the approval. The reviewer sees current source but lacks the recorded prior contents needed to identify the extra delta. Once the new anchor is accepted, a later diff from that anchor excludes both changes.

The scope also needs to cover proof-relevant envelope files. They follow the same amendment path under T12 but are outside the command's protected-path selection.

**Minimum direction:** record a reviewable content patch between identified pre-change and candidate anchors, covering the relevant controlled paths, including proof-relevant support and adopted/removed protected-path membership. The reviewer must be able to compare the actual transition with the approval. Make clear that the candidate anchor includes the amended content before this comparison is accepted.

One read-only Git form can still provide that evidence; a new tool, runtime, or enforcement system is unnecessary. A diff-stat may accompany it but cannot replace it. This closes the original anchor-transition scenario rather than adding a new requirement.

### C2 — MEDIUM: the gap and amended-PASS paths have conflicting prerequisites

**Affected text:** [T10, line 105](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:105), [T11, lines 109–119](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:109), [T12, line 133](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:133), [Verifier/FLOW representations, lines 163–167](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:163).

Three related inconsistencies prevent a single reliable interpretation:

1. **Environment recovery:** T10 explicitly returns to stage 5 to author the deferred test and renew evidence. The FLOW representation says to resume at stage 7 on INCOMPLETE after the environment decision. If the deferred test was never committed, merely running Verifier again cannot close its recorded gap.
2. **Authorized proof-defect exception:** T10/T11 allow useful progress with a recorded NOT_VERIFIED exception after the review limit. The Verifier template unconditionally requires a CURRENT ACCEPT. An authorized exception with a REVISE review could therefore fail the basis check rather than receive the intended INCOMPLETE result.
3. **Honest amended PASS:** T12 requires every amendment to be re-reviewed and correctly allows PASS on implemented code. T11's entry definition requires every WITNESS to be RED and expressly relaxes only all-PRESERVATION cases. It does not state how an amended, still-WITNESS test with honest PASS enters re-review.

**Failure scenario:** a database clause is deferred, Developer implements, Verifier returns INCOMPLETE, and the environment becomes available. One instruction resumes Verifier without the missing test; another returns to Tester. If the newly authored or amended test now passes, the literal RED-only entry rule can block the required re-review. Separately, an explicitly accepted proof gap can be sent into the normal FAIL/Developer loop despite being an authorized incomplete-evidence state.

**Minimum direction:** make the prerequisite rules agree across T10, T11, the artifact representations, and checkpoint acceptance. Recovery must return to the earliest missing evidence, obtain the required test and review, and then reverify. Distinguish initial WITNESS RED obligations from honest post-implementation amendment/deferred-test results; no fabricated RED and no automatic reclassification to evade review.

Choose one consistent treatment of authorized exceptions: a fresh qualified review of the package or an explicitly recognized current exception in the basis check. Either must retain NOT_VERIFIED, protect unaffected evidence, and forbid G4 under D6(a). Real test or implementation failures must still be FAIL. No state-machine infrastructure is needed.

### C3 — MEDIUM: proof relevance must follow semantics even for configuration

**Affected text:** [T9, lines 96–99](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:96), [T12, line 135](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:135), and the example's mandatory pom.xml classification at [line 183](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:183).

T9 defines proof relevance by the file's effect, then says “no for build and dependency configuration.” That categorical exception can recreate the original envelope problem.

**Failure scenario:** a build/test-runner property selects an existing fake storage adapter instead of the real mapping used when the contract was reviewed. Every test remains discovered and passes against the fake. Developer records a configuration justification. Because the file is classified proof-relevant: no by type, the semantic change does not require the independent amendment review designed to protect this boundary.

Ordinary dependency maintenance can remain outside the amendment path. Configuration that controls provider selection, fixture behavior, clock units, or other observation semantics cannot be exempt merely because it lives in a build file.

There is also an actor mismatch to resolve: T9 says Tester cannot edit a pre-existing file except an adopted test, while T12 permits Tester to apply a proof-relevant envelope amendment. A pre-existing helper need not be an obsolete test eligible for ADOPTION.

**Minimum direction:** replace the file-type exemption with an effect-based qualification. Let the actual example determine its configuration classification. Name the authorized writer for pre-existing proof-relevant support amendments and align that specific permission with Tester's existing-file restriction; distinguish the human developer from the Developer agent if the human is intended.

Keep the simple protection model and the requirement for an approved delta plus dependency review. Do not make every ordinary build change a human test decision.

## Minor handoff consistency

The file list and P3-C1 explicitly modify pipeline/SKILL.md, but the exclusion list and acceptance also require “the three Phase 1 skills” to remain unchanged ([lines 171–180](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md:171)). The current three include pipeline. State the intended exception explicitly. This is a small handoff edit, not another material architecture finding.

Preserve the improvements already made: outcome-first reviewer reasoning, independent inspection of actual source, complete preservation baselines, honest partial evidence, rejection of requirement-changing amendments, controlled amendment lineage, and concise examples with source excerpts. None should be weakened to resolve these wording conflicts.

## Approval and next action

**Do not authorize P3-C1 against this exact draft yet.** Recommend D6(a), resolve C1–C3 and the small file-scope contradiction, and then approve the reconciled contract before delegation. No new architecture cycle or broader Phase 3 redesign is needed.

Suggested message for Claude:

> Use D6(a) as the proposed conservative rule: INCOMPLETE never reaches G4. Read docs/reviews/2026-09-10-phase-3-contract-review.md and correct C1–C3 in the draft contract, plus the pipeline-skill exclusion wording. Keep the proposal, locked baselines, and existing review artifacts unchanged. Do not invoke Sonnet or implement P3-C1 yet. Return the revised contract for approval; implementation delegation remains pending.

