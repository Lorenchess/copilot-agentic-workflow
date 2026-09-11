# ASTRA — PHASE 4 ARCHITECTURE REVIEW

**Recommendation:** `PROCEED_WITH_CHANGES`  
**Status:** Independent review; proposal and owner decisions are not approved for implementation by this report.  
**Material findings:** 5  
**Decider:** Owner, after Fable/architect evaluates this review.  
**Date:** 2026-09-11

Phase 4 is the right next investment. Strengthening Developer's handoff and Verifier's independent examination of the approved plan is more valuable than adding another reviewer stage. The proposal has a sound core, but its iteration/recovery rules, pre-existing-failure allowance, and integrity-restoration path need corrections before becoming an implementation contract. The semantic-review boundary also needs a narrow way to block demonstrable defects that lack a plan-item identifier.

No redesign or infrastructure expansion is needed. The five findings below concern proposed behavior, not newly discovered defects requiring the locked phases to be reopened.

## Reviewed state and limits

I read the full 581-line [proposal](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md>), SHA-256 `8434171293D8060ACD2DC48E92A936BCC21A3C24C0FB2DCF4CF8D5FCC8BE4458`, and compared its claims with the current Developer, Verifier, Pipeline, publishing procedures, relevant policy contracts, settings, and example evidence.

- Local main: `9e29ca8ad119d647afcf7d6e29cd3da3cb42dae1`.
- Locked Phase 1 target: `03d4230e9398a80586a4b8be47ed522638bf77d8`.
- Locked Phase 2 target: `5a46eb7a6bb951308742975bd8f9f51f77a6aca9`.
- Locked Phase 3 target: `20939cc9ff00a9091042f0e3fb3c74194c7e583b`.
- The proposal is untracked; the other untracked content is the existing review directory. There is no Phase 4 implementation in the inspected tree.

This was local source inspection and reasoning through concrete failure scenarios. No application tests, build, Copilot execution, remote operation, or implementation agent ran. The scenarios below are counterexamples to proposed rules, not claims that these events occurred. Only this review artifact was created.

## What is worth preserving

1. **Committed-state GREEN with independent verification.** Exact contract execution, observed identities, relied-on tests, and a full-suite handoff reduce avoidable Verifier failures. Developer's checks remain a preparation step; Verifier independently reruns and checks the candidate state.
2. **Obligations before Developer's narrative.** Reading approved constraints, decisions, interfaces, and scope first gives Verifier a useful independent reasoning path. Findings tied to required outcomes and actual changes are better than generic quality opinions.
3. **Content-level scope and PLAN-TRACED paths.** A necessary adapter change should not become unrelated merely because Planner omitted a filename. Conversely, a planned filename should not excuse unrelated content within it. Necessity and a specific approved behavior must support the trace; a repository evidence row alone does not authorize work.
4. **Material deviations return to planning.** Keeping implementation details flexible while routing changes to behavior, public contracts, configuration policy, or repositories through planning preserves G3's authority.
5. **Specific fix feedback and complete re-verification.** Required outcome, expected fix scope, response by finding id, and explicit closure of prior findings improve the existing bounded fix loop without adding an artifact.
6. **One shared policy skill and no additional review stage.** Developer and Verifier need the same vocabulary. Distinct procedures and evidence order provide independence; hidden criteria do not. Another reviewer could inspect recorded evidence without a terminal, so lack of a terminal is not an absolute architectural disqualification. Its marginal value is simply not demonstrated here, while the existing Verifier is already the appropriate role.

The LARGE example's proposed C1 defect is well chosen. The [plan requires configurable backoff](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/PLAN.md:71>), while the [test configuration fixes the base delay to 1s](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:90>). An implementation can reproduce the observed sequence while ignoring configuration. Showing Verifier reject that contradiction teaches a real distinction between passing the available tests and satisfying the approved plan, without reopening the Phase 3 test contract.

Some current-state claims need qualification. The [existing Verifier already reads the full patch and compares it with Approach and Affected files](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/verifier.agent.md:74>); it is not restricted to filenames alone. The weakness is insufficiently explicit obligations and disqualifying criteria. Likewise, constraints can already be covered by tests—C2's existing-table behavior overlaps AC4—even though a `C` id does not guarantee executable coverage. Phase 4 should sharpen these checks rather than claim they were wholly absent. The existing clean-checkout/SHA bracket already protects verification; stricter Developer GREEN primarily improves handoff integrity and efficiency.

## Material findings

### M1 — HIGH: the proposed budget does not bound execution or survive resume clearly

**Affected:** IQ3, Developer iteration log, Pipeline round/STOP handling. [Proposal lines 150–189](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:150>), [resume mapping](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:371>), [runner-cost claim](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:395>).

**Failure scenario:** Developer repeatedly runs a compile goal or one failing test as a “diagnostic,” never runs the contract command, and never spends an iteration. The six-run ceiling and two-no-progress rule never fire. Separately, an interruption causes another stage-6 invocation: the proposal gives each invocation a fresh allowance but also says the old iteration log continues. A BLOCKED artifact is routed back to stage 6 without explicitly preserving its pending STOP decision. Generic resume can therefore be mistaken for a new authorized round.

**Why it matters:** W1 is a central reason for Phase 4. Unlimited diagnostic work still permits an unlimited loop and prompts; a process invocation is not an authorization boundary.

**Recommended direction:** Bound diagnostic executions as well as contract iterations, without counting every cheap read as an iteration. Bind the allowance to the existing logical implementation/fix/directed round, persist enough progress in the existing artifact to resume that round, and preserve the remaining allowance after interruption. A pending IMPLEMENTATION_BLOCKED decision must be resolved before restarting work; generic resume must not renew its budget. Only an explicitly authorized new round gets a reset. The starting values six/two can remain tunable; no scheduler or new state store is needed.

### M2 — MEDIUM: the full-suite cap prevents a legitimate handoff repair

**Affected:** Developer handoff procedure and IQ2–IQ4. [Proposal lines 109–123](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:109>), [full-suite cap and regression route](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:154>).

**Failure scenario:** Developer takes the optional baseline, reaches contract GREEN in two iterations, commits, and discovers an unrelated full-suite regression at handoff. The classification table correctly says to fix production code. After that fix, a new full-suite run is necessary to establish GREEN, but it would be the third run in the invocation, forbidden by the “twice at most” rule. Verifier cannot resolve this because the proposal prohibits handing it a non-GREEN repository.

**Why it matters:** A cheap, ordinary repair either becomes an unnecessary human escalation or forces an exception to the handoff guarantee. The ceiling conflicts with the declared regression route.

**Recommended direction:** Permit bounded handoff retries after a repair; keep the full suite out of the routine inner loop, but do not prohibit the evidence required for the next handoff. Account for those retries within the round's finite work budget. Also explicitly bracket Developer's final execution with HEAD/status before and after, as Verifier already does: the listed pre-run clean-status check alone does not show the checkout remained unchanged. These changes preserve a clean, committed GREEN claim without making Verifier inherit an avoidable failure.

### M3 — HIGH: D3's matching-failure rule is insufficient for a PASS exception

**Affected:** IQ14, full-suite classification, verdict/G4 disclosures, Phase 3 compatibility. [D3](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:529>), [classification and verdict](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:277>), [compatibility exclusions](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:449>).

**Failure scenario:** An unchanged test already fails at its first persistence assertion. A change to a shared repository/helper introduces another defect on that same path. The identity and failure locus remain identical, and the test file itself is untouched. D3's exclusions therefore allow PRE-EXISTING and PASS even though the changed production dependency can affect the failing behavior. An earlier failure can also prevent later assertions from observing the new defect.

**Why it matters:** Matching output proves an observed pre-existing symptom, not absence of a new regression. The table also lacks an explicit disposition for a real failure whose cause cannot be established. Human acceptance of risk cannot turn a failed observation into a passing test.

**Recommended direction:** If retaining this allowance, require comparable baseline/candidate commands and execution conditions, actual matching identity/assertion/result evidence, and independent assessment of affected production/support/dependency paths—not only whether the test file changed. A changed or uncertain observation path cannot automatically qualify. Contract, relied-on, required-clause, environment, and nondeterministic failures remain excluded. Unattributed failures remain blocking, without claiming their cause is proven.

Record any eligible result as a **still-failing, observed baseline condition**; never say the full suite passed. The owner must explicitly adopt the resulting narrower meaning of PASS, with the exact failed identities and limitation carried into VERIFICATION, the PR's testing account, and G4. The current [T10 meaning](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/test-contract/SKILL.md:122>) and [Verifier verdict](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/verifier.agent.md:76>) do not already grant this exception. Calling all Phase 3 semantics unchanged while introducing it is inaccurate; reconcile the minimal forward interface explicitly. Option (b)'s extra approval alone does not repair weak evidence. If that qualification costs more than its value now, use D3(c) for Phase 4 and retain baseline evidence for diagnosis only.

### M4 — HIGH: integrity routing and restoration authority are inconsistent

**Affected:** D2, IQ4/IQ13, Developer ownership and evidence forms, Pipeline STOP routing. [Proposal failure routing](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:162>), [integrity findings](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:268>), [fix exclusion](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:350>), [restoration exception](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:459>).

**Failure scenarios:**

- A committed controlled-file edit needs exact restoration. The proposal permits Developer to restore it but leaves the canonical [T9 sole-writer prohibition](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/test-contract/SKILL.md:108>) unchanged. No permitted form is specified for obtaining the original file content at the active anchor; the four new diff forms are not a defined restoration procedure.
- Production code branches around behavior under a test profile. It is classified INTEGRITY, yet §12 excludes all integrity findings from fix rounds while the new STOP's restoration reason is CONTROLLED_PATH_CHANGED. No controlled path changed, so restoring tests neither describes nor repairs this defect.
- With a dirty controlled path, committing production WIP cannot make the checkout clean. The general BLOCKED procedure must not require that cleanliness before reporting the condition.

**Recommended direction:** Separate controlled-path corruption from production contract gaming. The latter can be a scoped production fix with full re-verification; if escalated, its reason and requested action must describe the actual problem. For corruption, the smallest consistent D2 option is **human restoration**, with exact active-anchor/path basis recorded, followed by independent integrity checks and fresh verification. Developer retains its no-controlled-edits rule. If an agent restoration mode is preferred, explicitly define its reader/writer authority and exact-content evidence and reconcile the current policy; do not infer it from a human-directed round. Report a blocked state before any unsafe or impossible cleanup/commit requirement. No reset, force, or history rewriting is necessary.

### M5 — MEDIUM: “everything else is NOTE” can force approval of a concrete defect

**Affected:** IQ11–IQ12 semantic boundary. [Proposal lines 309–338](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md:309>).

**Failure scenario:** A planned diagnostic change logs an entire request object containing an authentication token. The hunk legitimately traces to the requested diagnostics, tests pass, and the plan never enumerated a logging-exposure constraint. Verifier identifies the concrete disclosure from the diff, but the approved-element-only rule requires every other concern to remain advisory and never fail. A similar restriction applies to a demonstrable regression in an affected behavior that Planner omitted from its preservation list.

**Why it matters:** Preventing preference-based scope expansion is useful; making the absence of a plan id override concrete defect evidence is not. It makes the claim of deeper implementation correctness too strong.

**Recommended direction:** Keep plan ids as the normal anchor and keep style, speculative performance, and alternative designs advisory. Add a narrow blocking route for a demonstrable diff-introduced functional, data-integrity, or security defect, supported by a specific mechanism or counterexample and the violated established behavior/invariant. This is not a mandate for a comprehensive security audit. If resolution requires a new product decision rather than restoring an established invariant, surface it to planning instead of inventing that decision. Describe the result as independent conformance and defect evidence, not proof of general correctness.

## Independent owner-decision assessment

| Decision | Disposition | Engineering tradeoff |
|---|---|---|
| **D1 — bounded iteration and IMPLEMENTATION_BLOCKED** | **ACCEPT_WITH_CHANGES** | A useful conditional STOP, not another routine gate. Apply M1/M2 so diagnostics, handoff repair, interruptions, and pending decisions have coherent bounds. Six/two are pilot defaults, not validated optimal values. |
| **D2 — controlled-file repair requires a human decision** | **ACCEPT_WITH_CHANGES** | Preserve explicit approval of the exact restoration basis. Prefer the already offered human-restoration option to keep T9 intact; otherwise specify a real, narrowly authorized mode. Distinguish production gaming from controlled-file corruption (M4). |
| **D3 — allow observed pre-existing full-suite failures** | **ACCEPT_WITH_CHANGES** | Useful for adaptation to an existing imperfect suite, but reject automatic eligibility from identity/locus and unchanged test-file alone. Apply M3 and obtain explicit owner acceptance of qualified PASS semantics. The smallest fallback is (c), with baseline observations retained for diagnosis. No additional routine gate is necessary. |
| **D4 — extend both examples in place** | **ACCEPT** | Avoid duplicating roughly 1,400 lines. Keep earlier artifacts unchanged and link the Phase 3 tagged views. Stop at verification; a new focused diff-excerpt document is teaching material, not a thirteenth run artifact. |

## Proportionality, reuse, and simplification

The shared `implementation-quality` skill is justified: construction and verification need consistent definitions of GREEN, deviations, scope, evidence, and findings. Keep detailed policy there, procedure in agents, sequencing and gates in FLOW/Pipeline, and comparisons in the guide. A second skill would not inherently hide criteria—both agents could read it—but one coherent policy is the simpler choice here. Avoid reproducing all sixteen rules in each document.

The all-repository handoff and complete re-verification are proportionate for this reference and avoid designing a dependency cache. They should be retained with two corrections to their claims:

- The [actual I1 row](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/PLAN.md:83>) allows either implementation order. Provider-first is a legitimate Developer choice, not an order mandated by that plan. Show the choice and rationale accurately; distinguish implementation order from rollout prerequisites.
- Proposal §8 says G4 publishes the set “atomically.” The [existing publisher](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/workspace.agent.md:64>) preflights the set and then pushes repositories sequentially; a later push can fail after an earlier success. Say “all repositories verified and preflighted before publication,” preserving the accepted partial-publication limitation. Do not add transaction infrastructure or change the locked publisher to satisfy that word.

The SMALL example should collapse empty sections, avoid duplicating the same obligation in multiple long tables, and show one compact clean handoff. Treat 30–35 lines as a measurement, not a correctness gate. One-line iteration records are useful, but an unlimited diagnostic trail would defeat that proportionality. Post-commit contract and full-suite runs have a real cost; the corrected budget should disclose that cost instead of claiming six iterations bound every prompt.

Enabling refactoring may remain allowed, with necessity and unchanged outcomes evidenced. An unchanged RED pattern plus passing preservation checks is bounded regression evidence, not proof that all behavior is preserved. “Directly adjacent” alone should not justify an unrelated cleanup. The non-normative guide and example claims should use these narrower descriptions.

## Locked-phase compatibility and contract hygiene

Normal forward changes include the new policy skill, richer Developer/Verifier artifacts, WORKSPACE's baseline input, explicit planning traces, and the new implementation STOP. They fit Phase 4 and do not require moving any reference tag or editing historical contracts.

D2 and D3 are the actual compatibility decisions: D2's agent-edit exception contradicts the current sole-writer rule unless the human route is chosen; D3 changes the meaning of a successful verification with a failing suite. Name and reconcile any minimal current-asset interface changes in the new contract. The historical Phase 3 contract and tag remain records of the earlier guarantees. Neither an unverified required clause nor unavailable full-suite infrastructure may gain a publication path through D3.

Correct P4-C1 acceptance (f)'s comparison base. It requires an empty `git diff 20939cc` for all §18 files, but the Phase 3 contract already legitimately differs by administrative §11 at starting main `9e29ca8`. Use the captured pre-Phase-4 starting revision for unchanged-file guards; retain `20939cc` comparisons only where comparison with that tagged asset is intentional. This is an acceptance-check correction, not another architecture finding.

The three checkpoints remain reasonable. N1 guide cleanup is now related to the Phase 4 lines being changed; include it in the authorized documentation scope. N2 need not trigger a separate cleanup. Keep model diversity and marginal-quality benchmarks as later measurements, and keep delivery integration and rollout execution outside Phase 4.

## Smallest recommended Phase 4 scope

- Keep one policy skill, the three proposed agent changes, existing artifacts, and one implementation STOP.
- Specify a resumable logical-round budget that includes bounded diagnostics and necessary handoff retries; bracket committed GREEN evidence.
- Add plan-obligation and hunk-level verification, PLAN-TRACED necessity, concrete fix outcomes, and prior-finding closure; retain a narrow route for proven defects outside explicit plan ids.
- Resolve restoration ownership and D3's evidence/verdict semantics before drafting implementation instructions. Use human restoration and conservative full-suite failure handling if the more permissive alternatives add disproportionate interface cost.
- Extend the LARGE and SMALL examples as proposed, with focused traces for diagnostic exhaustion/resume, a handoff regression repaired before verification, a same-locus failure in an affected dependency, and restoration routing. These can be short document scenarios, not new end-to-end examples or runtime machinery.

**Final recommendation: `PROCEED_WITH_CHANGES`.** Fable should evaluate M1–M5, obtain the owner's qualified D1–D4 decisions, and prepare the corrected contract for approval. This review authorizes no contract implementation, Sonnet dispatch, commit, push, tag movement, or Phase 5 work. The reviewed proposal and all locked assets remain unchanged.
