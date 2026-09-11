# ASTRA — PHASE 3 ARCHITECTURE REVIEW

**Overall recommendation: PROCEED_WITH_CHANGES**

Phase 3 is the right next investment. The proposal addresses real ways that an executable contract can reward incorrect implementation. Its strongest additions are explicit proof boundaries, clause-level classification, independent inspection of actual test code, and controlled test amendments. They fit a reusable reference pipeline without new infrastructure.

Five material architectural corrections are needed before implementation is authorized. They concern evidence sufficiency, incomplete verification, amendment authority, review freshness, and reused test dependencies. These are bounded corrections to the proposed design, not reasons to reopen Phase 1 or Phase 2.

## Reviewed evidence and limits

- Repository: Lorenchess/copilot-agentic-workflow.
- Current local HEAD reviewed: **c3904cfe9fa266e23452d4300bdc146386530d7e**.
- Phase 1 tag verified locally: **phase-1-reference → 03d4230e9398a80586a4b8be47ed522638bf77d8**.
- Phase 2 tag verified locally: **phase-2-reference → 5a46eb7a6bb951308742975bd8f9f51f77a6aca9**.
- Reviewed the complete, 468-line, local untracked [Phase 3 proposal](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md), SHA-256 **C6487EBD62FF576C5089888EE4470C65AF45AB9930D1825CF784AD0A017D5A43**. This identifies the reviewed proposal independently of HEAD.
- Tracked working-tree and index changes were absent at entry. Existing untracked reviews and the proposal were preserved. Changes between the Phase 2 tag and HEAD concern only administrative closure text in README and the Phase 2 contract.
- Method: read the proposal, compare relevant current agent contracts and example evidence, and trace concrete failure scenarios through the proposed handoffs. No agents, tests, builds, corporate services, or Copilot sessions were run. This is an architecture assessment, not validation of host enforcement, runtime model identity, or actual test execution.

Only this review artifact is authorized for creation. Neither reference tag nor historical contract needs to change.

## Overall architecture assessment

The proposal should deepen the locked test model, not claim to invent its existing protections. Current [Tester procedure, lines 85–88](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/tester.agent.md:85) already requires business-outcome assertions and rejects compilation/setup failures as RED. Accordingly, proposal W2/W5 overstate what the existing rules permit. The genuine improvement is making those rules operational: showing which production path remains real, locating the assertion, checking discovery, and having another reader challenge the source.

The new policy skill is justified. Keep detailed test-selection, double, evidence, preservation, and amendment rules in **test-contract**. Tester should own procedure and evidence production; Adversary should own independent challenge; AGENT-CONTRACTS should specify inputs, outputs, capabilities, and short invariants; FLOW should specify routing and budgets. Cross-reference detailed policy rather than copying its tables into all four places. A shared challenge catalogue is appropriate: knowing the quality criteria does not undermine review independence.

No new test platform, scheduler, database, runtime, or enforcement engine is necessary.

## Material findings

### M1 — HIGH: the proposed proof boundary still permits false persistence and interface confidence

**Evidence:** [level guidance, lines 144–153](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:144), [double rules, lines 201–207](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:201), [interface conformance, lines 233–245](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:233), and the predetermined LARGE example boundaries at [line 430](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:430).

The persistence rules conflict. Section 5 requires real mapping for a persisted outcome; section 8 prohibits doubling persistence but then permits a FAKE with asserted state. An in-memory repository fake can prove a service's decision to save a value while concealing a broken ORM mapping, transaction, or actual stored column. “State-bearing” alone does not make it equivalent.

The interface table also checks agreement between independently constructed tests more strongly than it checks the actual interface. A recorder replacing LedgerClient can receive a correct domain object while the real client serializes the wrong field name. A provider test supplies correctly hand-shaped JSON and passes. Both tests reference identical planned fields and receive Match: YES, although the deployed exchange fails. Stubbing LedgerReportException similarly does not exercise the adapter that translates an actual HTTP failure into that exception.

**Recommended direction:** choose the boundary according to the required outcome, not repository membership or double vocabulary. A fake is sufficient for local decision/state-machine behavior when that is the criterion; actual persistence needs the relevant real mapping/storage behavior. For changed wire contracts, exercise the relevant consumer adapter/serialization and provider decoding separately, or cite already available executable coverage that does so. Capturing a real encoded request at the transport edge and exercising the provider with that representation can suffice without a running peer service. Shared field lists remain useful design checks; label them as such rather than treating them as compatibility proof.

A stub may legitimately supply a Given that influences the result. Narrow the prohibition on a canned return that “determines” the asserted outcome: forbid substituting for the behavior being proved or supplying the asserted result without the required transformation. Do not prohibit ordinary input stubs.

### M2 — HIGH: accepting a substitute has no coherent downstream verification meaning

**Evidence:** [substitution, lines 261–266](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:261), [unchanged G4, line 353](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:353), [limited Verifier change, line 383](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:383), and [risk mitigation, line 456](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:456). Current [Verifier, lines 68–74](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/verifier.agent.md:68), [G4 script, line 96](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/pipeline.agent.md:96), and [PR eligibility, line 74](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/pr.agent.md:74) depend on a PASS result.

The proposal alternates between an equivalent substitute and a substitute with a remaining coverage gap. Those require different conclusions. Suppose Kafka cannot run, the criterion requires delivery to a consumer, and a local unit test records a producer call. Accepting that test can authorize useful local work; it cannot establish delivery. If the unavailable test is omitted or excluded and the substitute plus available full suite pass, current Verifier conditions can produce PASS. Copying an Execution limitations paragraph does not resolve the unchanged G4 statement “Verification passed” or define whether publication eligibility includes incomplete criteria.

The same issue applies to the new revise-limit option to accept a contract with HIGH residual findings. A human can accept a risk or redirect scope; acceptance cannot make a proxy assertion prove the missing outcome.

**Recommended direction:** distinguish **equivalent evidence** from **partial evidence** explicitly. Tester explains equivalence against the approved criterion and observable boundary; Adversary challenges that explanation; the developer decides whether to proceed with a disclosed gap. The developer does not decide that non-equivalent evidence becomes equivalent.

An uncovered required clause remains **NOT VERIFIED**, independently of passing runnable tests. Define its effect on stage progression, Verifier's overall claim, G4, and publication eligibility now. The smallest conservative option is to permit useful local progress while withholding unqualified verification/publication approval until required coverage is established or the requirement is changed through planning. If the owner instead wants publication with accepted gaps, that needs an explicit qualified authorization/claim path through the relevant readers. A carried-forward paragraph alone is insufficient.

This is a necessary Phase 3 evidence interface, not a redesign of Phase 4 verification.

### M3 — HIGH: “NARROWS” still permits a test amendment to lower the approved requirement

**Evidence:** [amendment invariant and routes, lines 272–290](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:272), particularly [the challenge-case acceptance at line 436](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:436).

Section 12 correctly says that an amendment may never change what a criterion requires. Yet the challenge case explicitly routes a request that “lowers the required outcome” to NARROWS, human approval, and application. That is the same authority boundary the invariant forbids crossing.

For example, an approved criterion requires a persisted audit record. Developer requests replacing the persisted-state assertion with “client called.” Tester labels this NARROWS and the developer approves it. Recording the weakening and re-reviewing the amended test do not preserve the approved criterion.

**Recommended direction:** measure the effect against the approved PLAN clause, not just against the old assertion. Removing an accidental overconstraint from a defective test can be a legitimate amendment if the corrected test still proves the entire approved outcome. Removing part of that outcome, changing success semantics, or accepting a different requirement must return through Planner/G3. Human approval of a test-change request must not substitute for that route.

Tester should explain affected criteria, unchanged/changed required behavior, classification impact, and evidence that becomes stale. An amended test that passes on already implemented code must be recorded honestly; do not force RED. However, checking that its assertions still discriminate correct from incorrect behavior belongs to the Phase 3 test review. Deferring broader semantic Verifier design to Phase 4 does not justify deferring that check.

### M4 — HIGH: test-review acceptance and amendment anchors are insufficiently tied to the evidence they authorize

**Evidence:** [amendment execution, line 290](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:290), [stage 5b trigger/output/loop, lines 311–316](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:311), [resume compatibility, line 365](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:365). Compare existing [supersession rules, line 85](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/pipeline.agent.md:85) and [Verifier's latest-anchor diff, line 70](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/verifier.agent.md:70).

The new review has a Round, but no stated basis binding its acceptance to the current plan, test contract, RED anchor, or limitations. Selective re-review is triggered only for NARROWS or an amended PASS and covers only amended tests.

A SUPPORT_ONLY change to a shared fake can affect several tests while every WITNESS remains RED. The proposal does not require renewed review of those dependent tests. A lingering ACCEPT may therefore describe the old evidence. Existing generic supersession is helpful, but must be reconciled with the new selective amendment path; counting a present TEST-REVIEW.md is not sufficient.

Separately, line 290 claims that the Verifier's diff at the new anchor covers a change to another protected path. It does not cover a change already included in that anchor. An earlier unauthorized edit, or an extra change within an approved file, can become part of the new baseline. The existing index check constrains staged paths, not the semantic or textual delta within them.

**Recommended direction:** give review acceptance a lightweight basis using the existing revision/anchor and artifact-history conventions. Any change to proof-relevant tests, support, execution configuration, coverage, or limitations must invalidate the affected acceptance. Re-review the affected dependency set, rather than only the named test or two effect labels. Developer may proceed only with current, matching acceptance or an explicitly recorded exception whose evidentiary limits follow M2.

Before accepting a replacement anchor, account for the transition from the prior anchor against the approved delta and protected-path membership. Do not claim that a later diff from the replacement anchor validates its own history. This requires ordinary evidence and review, not a locking or cryptographic system.

Define stage 5b entry as a completed, valid test-evidence package, including authorized all-PRESERVATION cases; literal “returns RED” must not force false RED. Corrections must supersede old RED/review evidence, and interruption must resume the unmet prerequisite.

### M5 — MEDIUM: reused tests and pre-existing support can bypass the new integrity expectations

**Evidence:** [relied-on tests, line 173](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:173), [RED validity/discovery, lines 187–191](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:187), [support split, lines 251–255](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:251). Current [envelope verification, line 71](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/verifier.agent.md:71) rejects unjustified or test-excluding changes.

Protecting everything Tester creates is a useful default. File origin alone does not determine whether a dependency can change what a test proves.

Two concrete cases remain:

1. An existing preservation test is named COVERED BY but disabled or outside actual suite discovery. It does not run in the proposed contract command; the full suite may pass without executing it. The proposed per-identity check covers the contract run, and no corresponding observed-execution obligation is stated for relied-on identities. Thus coverage and the pre-implementation preservation baseline can be claimed without being observed.
2. Developer changes a pre-existing FakeClock's unit conversion or a reused fixture's initial business state, with an Envelope changes justification. All tests remain discovered and pass, but the asserted outcome becomes easier to satisfy. The proposal expressly retains the mechanical justified/not-excluded envelope rule; no independent check of the altered observation semantics is required.

**Recommended direction:** whenever an existing test supplies required coverage, record its actual baseline result and require observed execution at verification, even if it runs through a separate command or the full suite. Do not require duplicated tests or a particular command organization.

Retain the simple created-file protection default, but identify reused dependencies that materially define assertions, fixtures, doubles, or observation semantics. Changes to those dependencies need an assessed contract effect and renewed affected review where appropriate. Legitimate production/build configuration changes can remain developer-owned. Verifier can detect and route relevant changes without becoming a comprehensive semantic test reviewer.

## Owner decisions

| Decision | Disposition | Independent assessment |
|---|---|---|
| **D1 — Adversary test-contract review** | **ACCEPT_WITH_CHANGES** | Retain a bounded review for every class, actual-source inspection, separate review evidence, and no routine human gate. Complete the acceptance/freshness rules in M4 and prevent unresolved proof defects from being represented as verification under M2. Depth should follow the contract's actual risks. |
| **D2 — Pre-existing-test modification through an approved request** | **ACCEPT_WITH_CHANGES** | Useful for real repositories and safer than pushing obsolete-test repair outside the contract. Reuse unchanged tests directly. When an approved criterion makes a test obsolete, Tester may amend the specifically approved delta, including during initial stage 5, with its prior state recorded and the file adopted into protection. Distinguish that case from an already protected contract-test amendment. Specify a Tester-origin request route at stage 5; it cannot depend on a not-yet-created IMPLEMENTATION.md request entry. Preserve Developer's prohibition on editing these tests. |
| **D3 — Developer-accepted lower-level substitute** | **ACCEPT_WITH_CHANGES** | Accept equivalent lower-level evidence and useful partial progress. Reject treating developer acceptance as proof equivalence. Retain clause-level NOT VERIFIED and settle downstream claim/authorization semantics as M2 requires. |
| **D4 — Tester effect assessment before the human decision** | **ACCEPT_WITH_CHANGES** | The extra invocation is justified on this exceptional path. Require a concise assessment against PLAN, affected criteria/classification, evidence to re-establish, and downstream evidence made stale. Apply M3's authority boundary. Avoid a large form or implying that the same Tester defending its own test provides complete independence. |
| **D5 — Extend PAYMENTS-12410 in place** | **ACCEPT** | This avoids duplicating the planning setup and is legitimate forward evolution. Keep the planning milestone clear, link to the Phase 2 tagged version, and stop the current example at test review. It need not become an end-to-end delivery example. |

## Stage 5b: marginal value, independence, and cost

The useful new failure detector is a second reader comparing **actual executable assertions and doubles** with approved behavior before Developer starts optimizing against them. Tester self-check has author blind spots. Current Verifier independently executes and checks evidence integrity, but is not contracted to reconstruct assertion adequacy. Moving that burden entirely to later verification would also discover defects after implementation investment.

Adversary is an appropriate existing role. Keep its test mode read-only with respect to tests, plans, and production code; only its review artifact is writable. No terminal is necessary for this mode. It assesses source and execution evidence, not independently observed runtime success. If it must compare a committed file list with protected paths, supply the relevant tool-produced evidence; “git-log-visible” is not a substitute for access through its declared capabilities.

Procedural independence should be explicit: first derive the required observable outcomes and a few plausible incorrect behaviors from PLAN; then inspect test source, mapping, doubles, necessary reused support, and RED evidence. Ask whether those incorrect behaviors would pass. This prevents merely validating Tester's explanations against Tester's own table. The reviewer should identify defects and evidence needed, not author a competing test suite. Reading its own earlier plan approval must not become proof of test adequacy.

A separate TEST-REVIEW.md is justified here because the reviewer owns its verdict and its lifetime differs from Tester-owned evidence. Appending the verdict inside TEST-CONTRACT/RED-REPORT would blur that ownership. An adopting internal pipeline may use an existing review record instead of copying this exact file arrangement.

One initial review and one automatic correction are proportionate. Any subsequent human-directed round must be explicit and bounded, not an automatic budget reset. ACCEPT means the current evidence has no unresolved blocking test-quality defect. REVISE means a specific correction or existing STOP is needed. A separate BLOCK verdict is unnecessary if those routes are unambiguous. A required boundary clause cannot be silently left as a MEDIUM residual while completeness is claimed; severity must follow the effect, not the case label.

Reviewing SMALL work is reasonable: a field-validation test can still assert only status while missing the required error body. Uniform review avoids a class-based correctness exception. Nevertheless, “five-minute read,” “rare STOP,” and high benefit are hypotheses, not measured results. Keep one compact pass for a small contract and evaluate actual marginal value later; model diversity and benchmarking are not prerequisites for Phase 3.

## Test-quality assessments and proportionality

### WITNESS/PRESERVATION and acceptance mapping

Per-clause classification is a substantive improvement. Existing retry plus missing backoff should retain passing retry coverage and require RED only for missing backoff. Preserve the relationship between clauses: a passing delay-calculation unit test plus a passing retry test does not establish that actual retries use those delays. Required combined behavior still needs an appropriate observation.

Keep explicit bases for preservation and reuse existing evidence under M5. Treat “one or two per modified boundary” as a restraint on discretionary expansion, not an authority to omit additional material invariants. If investigation reveals more required behavior or scope uncertainty, surface it through planning rather than growing an unbounded suite or silently discarding it. A failing preservation test remains subject to diagnosis; do not weaken the locked distinction between test defect, actual baseline failure, and environment inability.

### RED evidence and determinism

The five-part shape is useful and can stay compact. Expected/observed outcome, causal explanation, assertion locus, and tool output together provide more evidence than an exit code. A test failing at its own assertion can still have an invalid fixture: passing unrelated preservation tests does not establish that this WITNESS's preconditions were arranged correctly. Review the causal setup as well as the locus.

A second consecutive contract run is a reasonable default reproducibility sample, especially for time/async tests. It is not proof of determinism, and should not require a second full-suite run or duplicated long logs. Record matching identities/results compactly, with output sufficient to inspect a discrepancy.

Change the categorical statement that inconsistent runs are a test defect ([line 227](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:227)). A race in production code or unstable external state can also cause them. Preserve the evidence and diagnose before deciding the route; do not “repair” a correct expectation into stability.

Prefer controlled clocks, seeded inputs, completion signals, isolated data, and deliberate ordering. Do not treat a fake clock as evidence about real broker timing or production scheduling. Distinguish an infrastructure timeout from failure to observe a required event within an approved interval. The absolute “timeout is never the assertion” wording is too broad for legitimate bounded-time behavior. Where concurrency is material, use the repository's existing synchronization tools to exercise the relevant interleaving rather than adding sleep-based flakiness or a custom framework.

### Levels, doubles, and cross-repository scope

Preserve the lowest-cost-*sufficient*-evidence rule. Endpoint serialization/status mapping needs the relevant framework route; a pure calculation need not pay for an HTTP server. Persistence and actual external delivery cannot be inferred merely from collaborator invocation. Apply M1's boundary corrections.

Separate local business evidence, actual interface-conformance evidence, and live cross-system evidence. The first two often avoid a complete integration environment; they do not establish transport delivery, deployment availability, or storage-engine-specific behavior that was never exercised. Required unavailable coverage follows M2.

### Human experience and examples

A SMALL happy path should add no decision prompt: brief contract, concise RED evidence, and a short reviewer decision. MEDIUM/LARGE should expand only where additional clauses, boundaries, decisions, and risks exist. Do not require every double/determinism fact to be repeated in each row when a shared declaration is sufficient. Retain source/test identities and proof explanations; reduce empty sections and repeated self-check prose.

The examples should show enough test and helper source to let a reader assess the new policy: especially SMALL's error-body assertion and LARGE's persistence, clock, and interface boundaries. Focused excerpts inside the example documents can suffice. Mapping rows, fictional logs, and an ACCEPT artifact alone cannot demonstrate that the source would deserve that verdict. Fictional evidence must remain clearly fictional.

The proposed new-dependency path also needs a simple prerequisite clarification: [line 259](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/specs/2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md:259) sends an approved missing library/scaffold to Developer, while Developer normally cannot start before RED and stage 5b. Name who performs the approved preparatory action and when Tester resumes. A human/repository preparation step using existing facilities is enough; do not create an early product-implementation loophole or another platform stage.

## Challenge-scenario conclusions

| Scenario | Architectural result after the necessary qualifications |
|---|---|
| Mock returns the desired result; test checks only invocation | The source-reading critic and proof-boundary rule add real protection. Supplying a Given is allowed; substituting the outcome-producing behavior is not. |
| API returns 200 while persistence is wrong | Must inspect the real relevant persistence path; fake state is not automatically equivalent. M1 is necessary. |
| Retry exists but backoff is absent | Per-clause P/W works, provided observed scheduling connects the clauses rather than testing unrelated helpers. |
| Real sleeps make retry tests flaky | Existing clock/synchronization facilities are the right answer; two runs are evidence of repeatability, not proof that all races are absent. |
| Kafka unavailable; unit substitute proves only local logic | Useful partial evidence, with required delivery NOT VERIFIED. M2 prevents later unqualified success. |
| Developer changes a created shared fixture | The expanded protected set is a strong improvement. Amendment lineage and dependent reviews still need M4. |
| Developer changes a reused shared fixture or relies on a skipped old test | M5 closes the corresponding reused-evidence gaps. |
| Pre-existing test encodes obsolete behavior | Approved Tester-owned delta is appropriate under D2; no automatic deletion, expectation weakening, or Developer ownership transfer. |
| Amendment lowers what success means | Planning/G3, not an approved NARROWS shortcut. M3 is necessary. |
| Tester and Adversary share a weak interpretation | Independent outcome/counterexample derivation reduces correlation; no claim of independent model errors is warranted. |
| Review correction invalidates RED or review is interrupted | Re-establish evidence and current review basis before proceeding; M4 defines that dependency. |
| SMALL review costs more than implementation | Keep the review bounded and silent; its value is catching wrong contracts, not matching coding time. Measure actual benefit before adding more routine stages. |

## Phase boundaries, reuse, and smallest sufficient scope

Adding a review artifact, broadening test support protection, allowing approved adoption of an existing test, and defining qualified evidence are **forward Phase 3 compatibility changes on current main**. None requires moving reference tags or rewriting old contracts/examples. Preserve the Phase 1 example as history and explain its differing helper policy in comparison guidance.

Phase 3 does need minimal downstream obligations for current review acceptance, approved amendment deltas, coverage gaps, relied-on test execution, and proof-relevant support changes. They are necessary to give the test contract meaning. Keep Developer implementation strategy, GREEN iteration redesign, broad semantic Verifier review, corporate delivery integration, new testing infrastructure, and model benchmarking deferred.

The smallest useful Phase 3 consists of:

1. One authoritative test-contract policy covering proof boundaries, clause mapping, sufficient levels/doubles, preservation bases, and concise reproducible evidence.
2. Tester applying it to source and execution, including actual discovery and honest coverage gaps.
3. One bounded, proportionate Adversary test review with its own current evidence basis.
4. A precise amendment/ownership rule: preserve approved meaning, assess effects, account for anchor transitions, and renew affected evidence.
5. Minimal pipeline/Developer/Verifier interfaces that preserve those meanings through progression and resume.
6. SMALL and LARGE teaching examples plus focused comparison guidance.

The most portable assets are the evidence questions, clause-level classification, amendment authority, and source-review method. Copilot role names, tool lists, stage numbering, and twelve Markdown artifacts are integration choices. Organizations with existing review/evidence facilities should adopt the policy through those facilities rather than reproduce the file choreography.

## Final recommendation

**PROCEED_WITH_CHANGES.**

Proceed toward an approved Phase 3 contract after resolving M1–M5. Preserve the proposal's scope and its strongest mechanisms; do not add infrastructure or routine human gates. The key condition is that tests, review acceptance, and later verification claims must continue to describe the same approved behavior and the evidence actually available.

This review does not authorize implementation, publication, or Phase 4 work.

