# ASTRA — P3-C2 FINAL TARGETED CLOSURE REVIEW

**Recommendation: READY_TO_COMMIT_P3_C2**

C2-I1, C2-I3 and C2-R1 are closed. The second correction satisfies the approved qualifications and introduces no material regression identified in this review. C2-I2 and C2-I4 remain closed. No further P3-C2 correction is required for reference readiness.

## Reviewed revision and evidence boundary

- HEAD/base: **9b78efbd55abef4ae0578ca2d23559d3d22bd8b4**, plus the uncommitted P3-C2 working tree.
- Independently reproduced ten-file fingerprint: **74ABE4E4CDA178E7DBBDF8B227D813E6E3CA9D442D868B72EBF94F7F49F5F7CF**. This matches the handoff. Definition remains SHA-256 of the ten authorized files' sorted repository-relative `path=UPPERCASE_SHA256` entries, UTF-8, LF separators, no trailing LF.
- Phase 1 tag remains **03d4230e9398a80586a4b8be47ed522638bf77d8**; Phase 2 tag remains **5a46eb7a6bb951308742975bd8f9f51f77a6aca9**. The index is empty.
- Relative to the snapshot from the [second correction scope review](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/reviews/2026-09-11-phase-3-c2-second-correction-scope-review.md>), exactly four files changed: LARGE SOURCE-EXCERPTS, RED-REPORT, TEST-CONTRACT and TEST-REVIEW. All other existing files match their saved hashes, including SMALL, both PLAN/RUN files, README files, policy assets, contracts and previous reviews.
- Fable's reconstructed before-files match the independently saved pre-correction hashes for all four files; its after-files match the actual working tree. The reconstructed comparison therefore has a verified basis. The verdict below rests on the resulting assertions and behavior, not on the reported hunk counts.
- This is a static review of fictional reference examples. No application build, test execution or Copilot/corporate validation was performed. The displayed RED output is illustrative evidence, not a record of tests I ran.

## Closure disposition

| Finding | Status | Closure basis |
|---|---|---|
| C2-I1 — re-report evidence | **CLOSED** | First report and both later reports bind delivery, attempt and outcome; step-2 ordering remains unconstrained. |
| C2-I2 — terminal stop behavior | **CLOSED** | Prior closure retained; the existing subsequent checks and combined terminal state remain intact. |
| C2-I3 — I1 failure/success discrimination | **CLOSED** | The successful ledger response is explicitly configured alongside the previously corrected real failure path. |
| C2-I4 — SMALL update coverage | **CLOSED** | Prior closure retained; SMALL is byte-identical to the reviewed version. |
| C2-R1 — insufficient response fixture | **CLOSED** | Every ledger report receives a rejection, the merchant probe has a response, and mock state is isolated per test. |

### C2-I1 — exact report identity and causal association

[SOURCE-EXCERPTS lines 176–210](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:176>) now checks one request immediately after attempt 1, consumes it and asserts `(del-9002, 1, FAILURE)`. After attempt 2, the cumulative request count must be three, and the two remaining bodies must be exactly `(del-9002, 1, FAILURE)` and `(del-9002, 2, SUCCESS)`, in either order.

Consequently:

- A wrong delivery id or wrong attempt in the re-report fails the tuple comparison.
- Reporting attempt 2 twice fails the multiset.
- Omitting the re-report fails the count.
- Reversing the two valid step-2 reports passes; no unsupported ordering requirement was introduced.
- The initial request's content is established before the next step, so the queued first rejection is associated with the required report.

The [contract map](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:24>), [RED explanation](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/RED-REPORT.md:78>) and [Adversary assessment](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-REVIEW.md:45>) use the same model. The baseline's zero-request assertion failure remains plausible; the new body checks are correctly described as unreached at that baseline.

### C2-I3 — configured successful response

[The positive I1 test](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:385>) explicitly enqueues both merchant and ledger 200 responses. It then checks the real adapter's request path and business fields, followed by absence of an outstanding-report marker. [The negative test](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:418>) retains the ledger 503, verifies the actual request and observes UNREPORTED plus DELIVERED.

The pair now distinguishes successful reporting from failed reporting: an unconditional UNREPORTED implementation fails the positive case, while an implementation that never sends the request fails the count assertion. The negative case continues to claim the consumer outcome without claiming direct observation of a specific exception type.

The [positive Setup](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/RED-REPORT.md:130>), [map row](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:29>) and [review conclusion](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-REVIEW.md:53>) agree with the configured responses. Correct behavior no longer depends on an imagined default ledger 200.

### C2-R1 — repeated failures and terminal probe

[AC5(ii)'s fixture](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:225>) supplies five merchant failures plus a sixth response reserved for an incorrect post-terminal request. Its ledger Dispatcher returns 503 for every request, so required re-reports cannot exhaust a finite ledger response queue.

After the delivery reaches PERMANENTLY_FAILED and UNREPORTED, the existing clock advance and extra entry-point call still require the merchant count to remain five, no pending next attempt, and unchanged ledger count. A sixth merchant request is answered and counted, allowing that comparison to reject it. An extra ledger request is likewise answered and detected. The fixture does not prescribe the number or order of legitimate earlier re-reports.

[Fixture isolation](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:272>) explicitly gives each test fresh servers and request history through BeforeEach/AfterEach. This prevents the rejecting Dispatcher from contaminating the positive I1 case. The [contract declaration](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:16>) and [RED Setup](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/RED-REPORT.md:102>) describe the same arrangement.

## Scope qualifications and regression check

All qualifications from the approved scope review are addressed:

- The decoding helper propagates JsonProcessingException; its caller declares `throws Exception`. The two I1 methods now also cover their existing checked parsing exceptions. No exception is swallowed to manufacture success.
- Updated fictional assertion citations agree across the source labels, contract table, RED loci and review references. This is citation consistency, not a claim of compiling a complete fictional class.
- Mock isolation and the same-scenario merchant probe response are explicit.
- The [adoption explanation](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:161>) and [matching source explanation](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:505>) distinguish the obsolete terminal expectation from the valid immediate count. The approved deletion and transition patch are unchanged.
- The fictional run's anchors, staged sets and round structure remain intact. No new activation, amendment or human decision was invented to describe edits made to the reference documentation.

**Material regressions introduced by this correction: NONE identified.**

Previously accepted limitations remain: these are focused fictional excerpts; SMALL's length and the absence of a completed activation example are acceptable; the known planning-inventory gap and P3-C1 closure notes remain recorded in the earlier reviews. Optional response-fixture housekeeping in other already-closed cases does not block this checkpoint. This review does not reopen those decisions.

## Final assessment

**P3-C2 is ready for its checkpoint commit.** All original P3-C2 findings and the subsequent fixture regression are closed at the reference-example level.

This is not a declaration that Phase 3 is complete or validated in the corporate Copilot environment. P3-C3 and publishing remain on hold under the existing workflow.

Only this new review file was created. No example, existing review, policy, contract or reference tag was modified; no implementation agent, commit or push was invoked.

