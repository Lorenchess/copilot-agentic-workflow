# ASTRA — PHASE 4 CONTRACT REVIEW

**Recommendation:** `TARGETED_CORRECTION_REQUIRED` before approving the contract for implementation.  
**Reviewed:** Draft revision 1, 524 lines, 2026-09-11.  
**Material contract corrections:** 3. No architectural rethink required.

The revised design addresses the substance of the architecture review. D3(c) preserves the existing meaning of PASS; human restoration preserves Tester ownership; the DEFECT rule provides a bounded response to demonstrable defects outside explicit plan ids. Three narrow interactions still need to be made unambiguous before Sonnet implements the contract.

## Revision and scope

- [Reviewed contract](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-contract.md>): SHA-256 `CFC8B3F89A987BAB9EDE0E737F2EA6254ADBA60BD1394E12DF830C46519A7533`.
- The proposal remains byte-identical to the architecture-reviewed version: SHA-256 `8434171293D8060ACD2DC48E92A936BCC21A3C24C0FB2DCF4CF8D5FCC8BE4458`.
- Local main remains `9e29ca8ad119d647afcf7d6e29cd3da3cb42dae1`. The Phase 1/2/3 tags still target `03d4230e9398a80586a4b8be47ed522638bf77d8`, `5a46eb7a6bb951308742975bd8f9f51f77a6aca9`, and `20939cc9ff00a9091042f0e3fb3c74194c7e583b` respectively.
- The proposal, contract, and review directory are untracked. No implementation diff is present.

I read the entire draft and checked its resolution of M1–M5 and its internal transitions. This is a document/source review, not a Copilot execution or an implementation test. No remote operation or implementation agent was invoked. Only this review file was created.

## Architecture-finding disposition

| Finding | Assessment of the draft |
|---|---|
| M1 — unbounded work and resume | **Substantially resolved; C2 remains.** Logical rounds, diagnostic limits, and pending-decision handling are explicit. The counter/attempt semantics need the small correction below. Post-execution logging's interruption loss is disclosed, rather than hidden. |
| M2 — handoff repair blocked by suite cap | **Still open in one interaction: C1.** Two handoff attempts and the before/after bracket solve the original cap problem, but IQ14 currently routes every stage-6 suite failure to a baseline STOP. C2 also affects success on the last permitted attempt. |
| M3 — unsupported PASS exception | **Closed under D3(c).** Any failing suite identity blocks; baseline evidence is diagnostic, and uncertainty about cause does not become PASS. The qualified alternative is expressly inactive pending a separate owner choice. |
| M4 — restoration ownership and integrity routing | **Authority/routing corrections resolved; C3 remains in the check.** Human-only restoration, GAMING as an ordinary production fix, and reporting before cleanup are sound. The restoration check must cover the working tree as well as committed content. |
| M5 — concrete defects forced to NOTE | **Closed.** IQ12 requires a changed hunk, a mechanism/counterexample, and a sourced established invariant. A new product decision goes to planning; style and speculative alternatives remain advisory. |

## Required contract corrections

### C1 — MEDIUM: IQ14 bypasses the intended handoff-regression repair

**Evidence:** [IQ4](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-contract.md:139>) distinguishes REGRESSION (repair production code, then retry) from a matching observed BASELINE_FAILURE. However, [IQ14 line 317](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-contract.md:317>) groups a failing full-suite identity “whether or not it also failed at the baseline” and specifies `Stage 6: BASELINE_FAILURE STOP`. [Challenge case 12](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-contract.md:457>) requires a repair followed by the second handoff.

**Concrete failure:** Handoff H1 discovers a newly failing regression, with contract and diagnostic budget remaining. Following IQ4 repairs it; following IQ14 instead reports a baseline failure and asks for human intervention. Both are normative instructions. D3(c) requires the failed candidate to be blocked from handoff/publication, not every repairable regression to be escalated immediately.

**Minimum correction:** Make IQ14 refer to IQ4's classification: a repairable regression uses the remaining round allowance; a qualifying observed baseline failure follows its STOP route; exhaustion follows BUDGET_EXHAUSTED. Stage 7 remains FAIL for every failing suite identity. Matching a baseline symptom must not imply proven cause or, by itself, prove the repair is outside the approved scope. Keep the distinction between “cannot hand off this candidate” and “cannot continue this implementation round.”

### C2 — MEDIUM: counter exhaustion and handoff accounting need an explicit success rule

**Evidence:** [IQ3 lines 112–135](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-contract.md:112>) allow six contract iterations and two handoff attempts, require a log line after every runner execution, and say **any exhausted counter** raises BUDGET_EXHAUSTED. A handoff attempt itself comprises several executions, but counters are derived from that execution log.

**Concrete failures:**

- C6 is the first passing contract iteration. The literal exhausted-counter rule stops the round instead of permitting its still-available handoff.
- H2 succeeds completely, but its counter has reached two; the same rule can overwrite a legitimate GREEN outcome with BLOCKED.
- H1's contract run and full-suite run each produce an `H` log line. Counting those rows as attempts consumes both handoff slots before a repair, despite there having been only one bracketed attempt.

**Minimum correction:** Define the accounting unit explicitly. Each handoff has one attempt id shared by its component execution records; count attempts, not component rows. A successful last permitted attempt may complete the round. Check limits before an additional execution/attempt would exceed the allowance, and do not let a spent diagnostic or contract allowance prevent a handoff that is already available and justified. If the no-progress threshold deliberately stops a still-failing contract, retain that rule separately. Interrupted/failed attempts should have a stated treatment.

No new artifact or counter service is necessary. A few precise sentences governing the existing log and round ids suffice.

### C3 — MEDIUM: the restoration self-check does not yet cover uncommitted corruption

**Evidence:** [IQ2 lines 91–95](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-contract.md:91>) defines the self-checks as comparisons of `<anchor>..HEAD`. [Human restoration](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-contract.md:169>) starts the next round with an empty controlled-path self-check. [Challenge case 15](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-contract.md:460>) promises detection whether the changed file is committed or not.

**Concrete failure:** HEAD still contains the approved test, but an unstaged edit weakens its expectation. `<anchor>..HEAD` is empty. The same remains true if a reported human restoration leaves that working-tree edit in place. The first self-check can therefore appear to confirm restoration while implementation proceeds against altered tests. The later clean handoff bracket still prevents GREEN, so this is not a demonstrated publication bypass; it is an incorrect integrity check and can consume the round on invalid evidence.

**Minimum correction:** Check status for staged/unstaged/deleted/renamed controlled paths as well as the committed anchor comparison, covering the complete T9 set: Protected, proof-relevant envelope, and relied-on paths. Apply that check before runner execution resumes after restoration and when detecting the condition initially. A controlled working-tree difference takes the controlled-path route, not merely a later invalid-handoff/budget route. Existing status and diff capabilities suffice; Developer still restores nothing. Record the observed resulting HEAD; restoring an uncommitted edit may legitimately require no new commit.

## Non-blocking precision notes

- **Runner-cost formula:** “about 20” is not a general worst-case maximum. With `R` required scoped relied-on executions per handoff, the listed budgets allow `16 + 2R` executions per repository per round, plus the optional initial baseline. `R` comes from the contract; a repository with many relied-on identities can exceed twenty. State the formula or its assumption rather than implying a fixed maximum.
- **Interrupted execution:** IQ3 explicitly permits one unlogged execution to be lost per interruption. That is an honestly disclosed soft-bound limitation, not an autonomous allowance reset. A lightweight improvement is to reserve the attempt in the existing log before launching the command and then record its result; an interrupted result remains unknown and still consumes the reservation. If retaining post-run-only logging, describe limits as recorded-execution limits and qualify the worst-case cost accordingly. This point alone does not justify a runtime or another review cycle.
- **Frozen example scope:** §5/§6 say every earlier Phase 2/3 artifact inside the extended directories is byte-identical, while explicitly permitting RUN.md updates. Enumerate the frozen files or explicitly exempt RUN.md and README from that shorthand so the future hash check does not reject the authorized example extension.
- **In-progress repository status:** The overall header has IN_PROGRESS, but the per-repository template lists only GREEN/BLOCKED. Allow an honest in-progress/pending representation while another repository is being implemented; it need not add any new pipeline artifact or gate.

## D1–D4 recommendation

| Decision | Independent recommendation |
|---|---|
| D1 | **ACCEPT_WITH_CHANGES:** retain the logical-round budgets, one conditional STOP, and same-round resume; resolve C1/C2 before approving the text. |
| D2 | **ACCEPT_WITH_CHANGES:** human restoration is the correct minimal option; resolve C3's verification detail. No agent restoration mode or T9 exception is needed. |
| D3 | **ACCEPT — option (c).** The tradeoff is explicit: a broken full suite cannot complete the run until repaired within approved scope or outside it. Preserve the inactive status of the qualified-PASS alternative. |
| D4 | **ACCEPT.** Extend the examples in place and link the tagged earlier views; retain their prior planning/test evidence. |

These are reviewer recommendations, not owner answers. D1–D4 remain pending until the owner adopts them, and implementation authorization is separate.

## Final assessment

The corrected architecture is suitable. Resolve C1–C3 in the draft contract, incorporate the small precision notes where appropriate, and return the revised text for approval. Keep the proposal and all locked reference assets unchanged. No new architecture phase, additional agent, routine gate, or infrastructure is warranted.

**`TARGETED_CORRECTION_REQUIRED` — contract text is not yet ready for an unconditional implementation handoff.** This report authorizes no Sonnet dispatch, implementation edit, commit, publication, or Phase 5 work.
