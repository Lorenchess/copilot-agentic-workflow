# ASTRA — PHASE 3 P3-C2 IMPLEMENTATION REVIEW

**Recommendation: TARGETED_CORRECTION_REQUIRED.**  
**Material findings: 4 — two HIGH, two MEDIUM.**

The examples substantially implement the intended teaching structure, but their current ACCEPT records overstate the protection their tests provide. Correct the example evidence and assertions before committing P3-C2. This does not reopen the approved Phase 3 architecture, P3-C1, or either locked reference baseline.

## Reviewed state and method

- Base/HEAD: **9b78efbd55abef4ae0578ca2d23559d3d22bd8b4**.
- Reviewed the **uncommitted working tree**: seven new LARGE files, four new SMALL files, and SMALL README.md/RUN.md modifications. Index empty.
- Phase 1 reference tag peels to **03d4230e9398a80586a4b8be47ed522638bf77d8**; Phase 2 to **5a46eb7a6bb951308742975bd8f9f51f77a6aca9**.
- No working-tree change to .github, settings, specs, either existing PAYMENTS-12345 baseline directory, root README, or comparison guide.
- The LARGE PLAN copy is byte-identical to the Phase 2 planning example: SHA-256 **CF84F0A6839FE592594FD6FCC15DB5C32EBFDC57C652DEC3688EEF30B15155A1**. All thirteen delivered files use LF.
- Read the delivered files against contract §6 P3-C2, current test-contract policy, and corrected P3-C1 handoffs. Traced plausible incorrect implementations against the actual excerpts and recorded assertions. Checked embedded diff hunk counts in memory.
- No builds, tests, browser checks, implementation agents, commits, pushes, or corporate Copilot checks. The examples are fictional: this review evaluates whether their evidence would be adequate and internally possible, not whether their commands ran.
- Created only this report; existing review artifacts remain untouched.

## What should be preserved

The scope is appropriate: the LARGE example stops at test review and the SMALL example extends its existing planning story. Fiction and non-validation caveats are explicit. The LARGE adoption stages the adopted path alongside created files; round-2 correction leaves the API anchor unchanged; artifact history supersedes the prior test package and review.

The corrected AC4 test now reads through the real audit repository and asserts row presence and fields, exposing the difference between an invocation recorder and persistence evidence. Relied-on P2 has a scoped baseline command. Protected helpers and effect-based configuration classification are useful reusable illustrations. These choices should remain.

The issues below concern what the example's final test contract actually proves. A table containing each AC identifier, or a fictional reviewer saying “No finding,” cannot close them.

## Material findings

### C2-I1 — HIGH: AC5(i)'s re-report evidence contradicts the baseline and does not identify the re-reported attempt

**Affected:** LARGE RED-REPORT, TEST-CONTRACT, TEST-REVIEW, and the focused recorder/test excerpts needed to substantiate them.

**Evidence:** [RED-REPORT lines 78–90](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/RED-REPORT.md:78>) expects two calls for the delivery and reports one initial call at RED. However, [PLAN E2](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/PLAN.md:43>) says no current caller reports an attempt; the same [RED-REPORT lines 117 and 131](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/RED-REPORT.md:117>) correctly uses that absence to explain the other failures. [Contract row AC5(i)](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:24>) promises recorder arguments, while the recorded failing assertion is only `callCountFor("del-9002") == 2`. [Adversary's derived wrong-attempt case](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-REVIEW.md:34>) is then declared covered without showing its discrimination.

**Failure scenario:** after the feature exists, report attempt 1 once (failure) and report attempt 2 once (success), but never re-report attempt 1. A delivery-wide count of two satisfies the shown assertion while AC5(i) is violated. Conversely, the fully described flow has the failed initial report, its re-report, and the report for attempt 2: three calls for that delivery. If the recorder intentionally filters one attempt, that filtering and its business arguments need to be explicit; they are not currently shown.

Before implementation, a stub configured to fail does not by itself cause production code to call it. The observed one-call RED narrative therefore cannot follow from the stated baseline without undisclosed setup that supplies part of the missing behavior.

**Why it matters:** this teaches both impossible evidence and an invocation-count proxy for a business requirement—the exact failure classes T4 and T6 are meant to prevent.

**Recommended direction:** make the baseline result match the actual fictional source, and demonstrate the per-attempt report contents/history, including the old failed attempt and the current attempt. Show enough of the focused test/recorder to distinguish “reported twice” from “the correct earlier attempt was re-reported.” Reconcile RED, map, and review claims from that evidence. Do not amend the approved requirement.

### C2-I2 — HIGH: terminal-state assertions do not establish the combined stop behavior claimed

**Affected:** LARGE terminal test excerpts and their contract/review evidence.

**Evidence:** [AC2 source](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:83>) drives at most five attempts, then asserts `PERMANENTLY_FAILED` and a request count of five. [AC5(iii) source](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:173>) asserts `DELIVERED` and `UNREPORTED`, then ends. Neither shows the no-further-work assertion claimed by [Contract rows 22 and 26](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:22>). For AC5(ii), [row 25](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:25>) explicitly delegates the delivery's terminal status to the separate AC2 test, where the ledger stub succeeds.

**Failure scenarios:**

- An implementation persists `PERMANENTLY_FAILED` after attempt five but leaves a sixth attempt scheduled. The shown AC2 test stops before exercising that scheduled work, so count five does not reject the defect.
- A successful delivery persists both asserted values but also schedules another ledger report. The shown AC5(iii) test passes.
- With repeated ledger failures, an implementation writes `UNREPORTED` but never transitions the delivery itself to `PERMANENTLY_FAILED`. The separate AC2 case can pass because it uses a successful ledger stub; the AC5(ii) marker assertion also passes. The required combined outcome remains unproved.

**Why it matters:** PLAN AC2/AC3/AC5 explicitly require stopping work, and AC5 requires the terminal state and reporting marker together. An assertion about current state or a test harness's own iteration limit is not evidence that production stopped scheduling. T2 also prohibits using unrelated cases to establish a combination.

**Recommended direction:** show the relevant terminal case's persisted state and absence of pending work or further calls through a controlled subsequent check, using existing test facilities rather than sleeps. Keep both statuses in the same ledger-failure scenario. Reconcile AC3's analogous stop claim as part of the same bounded check. Focused excerpts suffice; a complete application is unnecessary.

### C2-I3 — MEDIUM: I1's negative evidence exercises the wrong operation

**Affected:** LARGE I1 evidence row, source, and review.

**Evidence:** [Source lines 223–241](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:223>) deliberately calls the pre-existing `recordSettlementEvent(...)`, not the new retry-report path. [Interface evidence row](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:152>) nevertheless uses it as I1's deployment/failure evidence, and [review line 53](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-REVIEW.md:53>) accepts the assembled conformance claim. [Policy T8](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/test-contract/SKILL.md:99>) requires negative evidence through the adapter handling the changed interface.

**Failure scenario:** existing settlement reporting translates 503 into `LedgerReportException`, but the newly implemented retry-report branch swallows a non-2xx response. The preservation test still passes; the positive retry-report encoding test can pass; AC5's service-level tests can pass because their stub supplies the expected exception. The real I1 failure path remains untested.

**Why it matters:** the shared class name and existing error-handling convention are useful grounding, but do not establish that a new operation actually uses that behavior.

**Recommended direction:** retain the existing test as bounded preservation if useful, but add or adapt evidence that drives retry reporting through the real consumer adapter and a failing transport response, using an existing callable entry point so RED does not depend on a nonexistent method. Alternatively state the missing coverage honestly. The objection is not that stage-5 tests are RED, or that a live two-service environment is absent; it is that the negative evidence belongs to another operation.

### C2-I4 — MEDIUM: SMALL claims complete register/update coverage while only demonstrating creation

**Affected:** SMALL TEST-CONTRACT, SOURCE-EXCERPTS, RED-REPORT, and TEST-REVIEW.

**Evidence:** [PLAN AC1/AC2](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/PLAN.md:55>) covers both registration and update. [PLAN Q1](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/PLAN.md:73>) specifically identifies the risk of an unvalidated update path. The complete [AC1 method shown](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/SOURCE-EXCERPTS.md:8>) creates a new registration through one POST; it does not arrange or update an existing registration. [Contract rows](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/TEST-CONTRACT.md:14>) and RED evidence describe creation/read-back, and [review's completeness claim](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/TEST-REVIEW.md:30>) leaves no gap.

**Failure scenario:** the new validation runs on creation, while updating an existing registration still accepts an HTTP URL. The three described tests can all pass: HTTP creation is rejected, HTTPS creation succeeds, and an existing registration remains readable when no update is submitted.

**Why it matters:** one API-level row is not automatically coverage of both operations. The Phase 2 assumption that they share validation is not an executable check of that assumption, and this is an explicit approved behavior rather than optional boundary expansion.

**Recommended direction:** exercise creation and update (or new/existing contexts if the API shares a route) within the existing compact AC rows. Demonstrate the update rejection and continued HTTPS acceptance without adding a new gate, separate contract, or lengthy test taxonomy. Keep the Phase 2 PLAN unchanged.

## Non-blocking evidence and wording corrections

These do not independently require a new architecture review, but should be cleaned up with the example correction:

- **Embedded patches:** the adoption hunk at [TEST-CONTRACT line 176](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:176>) declares 12/10 old/new lines but contains 15/13. The three correction hunks at lines 227, 235, and 242 declare 6/8, 7/7, and 11/13; their shown bodies contain 5/7, 5/5, and 10/13. [TEST-REVIEW line 57](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-REVIEW.md:57>) calls this “exactly one hunk,” although three are shown. The stat picture also disagrees with the text totals. The substantive edit is inspectable, so I have not counted formatting as another material finding; nevertheless a block labelled verbatim Git output must have a possible shape and the review must account for every shown hunk.
- **Adoption rationale:** an immediate `getRequestCount() == 1` after the first call does not prove that no delayed second attempt will ever occur. [Source explanation](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:293>) overstates that assertion's meaning. The obsolete terminal-status expectation already supplies a legitimate reason for adoption; justify any additional deletion accurately.
- **SMALL wording:** its review says “wrongly accepts HTTPS://” where acceptance is required. Its map/Expected prose mentions a scheme-rejection message that its source expressly does not assert. Its README says amendment/activation/gap cases are demonstrated in LARGE, which they are not. Align these short statements with the actual examples.
- **Setup evidence:** LARGE RED-REPORT line 32 and TEST-REVIEW line 48 rely on passing preservation cases to validate a WITNESS setup. T6 expressly says they do not establish that WITNESS's own Given. Describe its arrangement directly; AC1's excerpt also enqueues four responses while the report says five.
- **Toy output fidelity:** LARGE staged added files use an all-zero index object ID. Use plausible fictional nonzero index IDs, as SMALL already does. This is distinct from the valid all-zero absent-HEAD ID for a new path.

## Disposition of the reported deviations

| Item | Assessment |
|---|---|
| No completed activation transition | **Accepted for this run.** It ends at initial test review after an automatic correction; direct anchoring is correct. Do not add a post-implementation scenario merely to exercise activation. Narrow the README claim that amendments cannot occur before stage 6: the live Tester scope permits amendments after an accepted stage-5b review; this run simply has none. |
| SMALL contract is 69 lines rather than approximately 50 | **Accepted.** The target is soft. Three rows, one level, no doubles, a four-line self-check and ordinary spacing are proportionate. Do not compress it to satisfy a line count. |
| Criterion shape for discretionary preservation / I-only tests | **Accept the representation.** A dash with an explicit modified-boundary basis, or an I1 reference, is understandable. No schema extension is needed. |
| SERVICE for adapter evidence | **Accept the level label.** Sufficiency depends on the real path and assertions; no dedicated interface enum is needed. C2-I3 concerns coverage, not that label. |
| Self-check line items not prescribed | **Accept the chosen shape.** The point is useful checks, not inventing another mandatory template. |
| Locked contract's Manual-mode claim and two P3-C1 clarifications | Carry the existing closure notes forward. Do not alter historical contracts or settings in C2. |

## Smallest necessary scope and decision

Preserve the approved architecture and both example directories. Correct the four evidence/coverage problems inside the C2 test-stage files and reconcile their RED, review and explanatory claims. The fixes need neither real application implementation nor new policy assets, infrastructure, agents, gates or routine human approvals.

**Hold the P3-C2 commit and P3-C3.** Fable should evaluate these findings and return the corrected example diff for targeted closure review. This report does not authorize implementation by this reviewer or any agent delegation.

## Reviewed working-tree identity

SHA-256 values bind this assessment to the uncommitted files:

| File | SHA-256 |
|---|---|
| `docs/examples/PAYMENTS-12345-testing/PLAN.md` | `CF84F0A6839FE592594FD6FCC15DB5C32EBFDC57C652DEC3688EEF30B15155A1` |
| `docs/examples/PAYMENTS-12345-testing/README.md` | `897B59D80B79819FF40809544F13D29AB3F5B5E5C1D234FF79417DB920CD2CDB` |
| `docs/examples/PAYMENTS-12345-testing/RED-REPORT.md` | `B246758C743862354C7A045097443AA445BED94809D5FA94925F887C4E236601` |
| `docs/examples/PAYMENTS-12345-testing/RUN.md` | `511A9280AEFA575256200D2D8B57E90FB82A0F8893F83D0EC759D9ADF9DA90C1` |
| `docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md` | `7425B03CC35EFDA1E2160B203040F41259ABD750ABFC377086DD65D692EA5D6D` |
| `docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md` | `1D8902E152BB191A9B5EF4775ACBF63F3917593A3552777668D69947BB5E5796` |
| `docs/examples/PAYMENTS-12345-testing/TEST-REVIEW.md` | `C217F6D08E1D6B4EBAB8EDD4E1EFC63FC3CDB1E4FE1AC3E52EA20723D3C4B1FB` |
| `docs/examples/PAYMENTS-12410/README.md` | `BF51821B9A01F69EDD0C7057C009C3A74888F217E5EC0A67ECC0E75F3CA9290E` |
| `docs/examples/PAYMENTS-12410/RED-REPORT.md` | `4965A1F9ACE02C890466ED1C8E23EDEDD2EA6E349B02ADF1EDF8AD9440E181E2` |
| `docs/examples/PAYMENTS-12410/RUN.md` | `96B50BA1265E25FE795FC32099930FE625F92376EB14803020A128815FEAA972` |
| `docs/examples/PAYMENTS-12410/SOURCE-EXCERPTS.md` | `C66E1A295D18DBA8293D4EC37DBD0E2ED45588DCD8301128199F65B282C71FED` |
| `docs/examples/PAYMENTS-12410/TEST-CONTRACT.md` | `226EBE33B97F69412EBA3A4B4AFAAA17C9C51CFDD7F2B938977F94A4DCFCD647` |
| `docs/examples/PAYMENTS-12410/TEST-REVIEW.md` | `23666BEB2F5C91173D7FAAEA61021F29A676A3C08961A97BCFF847CF7A649C67` |

**Final recommendation: TARGETED_CORRECTION_REQUIRED.**

