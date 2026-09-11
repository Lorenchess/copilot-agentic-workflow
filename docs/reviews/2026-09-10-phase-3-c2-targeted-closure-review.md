# ASTRA — P3-C2 TARGETED CLOSURE REVIEW

**Overall recommendation: TARGETED_CORRECTION_REQUIRED**

Two original findings are closed. C2-I1 and C2-I3 retain narrow gaps against the approved qualifications, and the real-transport substitution introduces one response-fixture regression. These are LARGE-example corrections; they do not require reopening the architecture or the locked references.

## Reviewed state and limits

- Base/HEAD: **9b78efbd55abef4ae0578ca2d23559d3d22bd8b4**, plus the current uncommitted P3-C2 examples.
- Peeled reference tags remain **03d4230e9398a80586a4b8be47ed522638bf77d8** (Phase 1) and **5a46eb7a6bb951308742975bd8f9f51f77a6aca9** (Phase 2).
- Compared with the saved pre-correction scope-review snapshot, exactly the ten authorized example files changed: TEST-CONTRACT, RED-REPORT, TEST-REVIEW, SOURCE-EXCERPTS and README in each directory. PLAN/RUN, SMALL planning artifacts, existing reviews and other assets are unchanged. The index is empty. SMALL RUN remains modified relative to HEAD as part of the earlier P3-C2 work; it was not changed by this correction.
- This is source-level reasoning about fictional examples, including counterexamples to their assertions. No application tests, build, Copilot execution or corporate validation were performed. Fictional RED output is assessed for plausibility, not treated as actual execution evidence.

Scope authority: [approved correction and its two qualifications](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/reviews/2026-09-10-phase-3-c2-correction-scope-review.md>).

## Disposition

| Finding | Status | Result |
|---|---|---|
| C2-I1 — re-report evidence | **STILL_OPEN** | Baseline observation and multiplicities corrected; delivery identity and first-request content remain unbound. |
| C2-I2 — terminal stop behavior | **CLOSED** | Subsequent checks and the combined terminal/failure scenario now exist. The separate fixture regression below affects execution of AC5(ii). |
| C2-I3 — I1 negative evidence | **STILL_OPEN** | Real retry-report failure path now exercised; successful-response discrimination is asserted without configuring that success response. |
| C2-I4 — SMALL update path | **CLOSED** | CREATE and UPDATE each have explicit discovery/results and update arrangement. |

### C2-I1 — remaining qualification gap

**Severity: MEDIUM (narrow residual of the original HIGH finding).**

**Evidence:** [AC5(i) source](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:178>) checks one request after step 1, then three requests overall. Its decoded tuples at lines 193–200 contain only attempt number and outcome. [Proves claim](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:59>) and [Adversary reasoning](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-REVIEW.md:45>) describe those requests as the rejected report, its re-report and the current report.

The new zero-request RED is consistent with E2, and the multiset correctly rejects reporting attempts 1 and 2 only once each. It also avoids inventing an order between the two step-2 reports.

**Remaining failure scenario:** the initial and current reports use the correct delivery id, but the re-report uses another delivery's id. The tuples still equal `{(1, FAILURE), (1, FAILURE), (2, SUCCESS)}`, so this test passes despite failing to re-report this delivery's attempt. The separate positive I1 case covers a fresh successful attempt, not the identity carried by this re-report branch.

Additionally, the first count proves which request received the first queued response, but not that its body was the required attempt-1 FAILURE report. The final unordered multiset cannot establish that causal association by itself.

**Minimum direction:** bind every recorded report to the expected delivery, and check the initial report's content in the first step. Keep the two later reports unordered relative to each other. Align the map, Proves, RED and review claims with those assertions. No product decision or extra scenario is required.

### C2-I2 — closed

**Evidence:** [AC2 subsequent check](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:88>), [AC3 subsequent check](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:126>), [AC5(ii) combined state and subsequent check](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:223>), and [AC5(iii) subsequent check](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:264>).

Each relevant case now advances FakeClock 32 seconds, calls the existing entry point again, checks an unchanged merchant count and no pending `next_attempt_at`, and, for AC5, checks unchanged ledger request count. AC5(ii) asserts PERMANENTLY_FAILED and UNREPORTED in the same failing-ledger scenario. The driver's bounded loop is no longer substituted for evidence that production stops.

**Residual limitation:** these are illustrative assertions, not observed GREEN results. C2-R1 below must be fixed so the AC5(ii) fixture can reach them under correct reporting behavior.

### C2-I3 — negative path corrected, positive qualification incomplete

**Severity: MEDIUM.**

**Evidence:** [negative I1 case](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:391>) drives the existing entry point through real RestLedgerClient, enqueues a ledger 503, checks the request path and all three business fields, then observes UNREPORTED plus DELIVERED. This adequately replaces the unrelated settlement test and does not overclaim an exception type.

However, [positive I1 arrangement](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:359>) enqueues a merchant 200 only. It invokes the synchronous delivery step before inspecting the ledger request. Neither that excerpt nor [its RED Setup](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/RED-REPORT.md:130>) configures a ledger success response. Nevertheless, [the discrimination explanation](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:427>) and [review acceptance](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-REVIEW.md:53>) explicitly claim a ledger 200.

MockWebServer 4.12.0 uses QueueDispatcher by default, and its default empty response queue waits for a response; it does not automatically return 200. See the pinned [MockWebServer source](https://raw.githubusercontent.com/square/okhttp/parent-4.12.0/mockwebserver/src/main/kotlin/okhttp3/mockwebserver/MockWebServer.kt) and [QueueDispatcher source](https://raw.githubusercontent.com/square/okhttp/parent-4.12.0/mockwebserver/src/main/kotlin/okhttp3/mockwebserver/QueueDispatcher.kt).

**Failure scenario:** a correct implementation makes the synchronous ledger request and waits, or eventually handles a client timeout as failure. It cannot demonstrate the claimed successful-response/null-marker outcome with this arrangement. The baseline can still produce the shown RED because it makes no ledger request; that does not validate the future success fixture.

**Minimum direction:** explicitly configure the ledger's successful response and keep the source, Setup and discrimination claims aligned. Preserve the required contrast: a successful report must not leave a false outstanding-report marker. No new test or gate is needed.

### C2-I4 — closed

**Evidence:** [parameterized source](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/SOURCE-EXCERPTS.md:8>) and [individual RED/PASS evidence](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12410/RED-REPORT.md:12>).

UPDATE first creates an HTTPS registration, checks that arrangement, captures its id and PUTs the candidate HTTP URL. Both AC1 invocations then reach the rejection assertion. AC2 records distinct CREATE/UPDATE preservation results, including uppercase HTTPS and read-back; P1 remains the fifth identity. The map stays at three rows.

A creation-only implementation now fails the UPDATE contract. The example no longer depends on the shared-validation assumption to obtain update coverage. This does not prove that the two operations internally share code, nor does it need to.

## Material regression introduced by the correction

### C2-R1 — finite ledger response queue does not implement “every report is rejected”

**Severity: MEDIUM.**

**Affected components:** LARGE AC5(ii) source/setup and the corresponding contract/review claims.

**Evidence:** [fixture](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:213>) and [RED Setup](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/RED-REPORT.md:102>) enqueue exactly five ledger 503 responses alongside five merchant failures. [PLAN AC5](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/PLAN.md:115>) requires failed reports to be re-reported alongside subsequent attempts, and [Q2](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/PLAN.md:141>) makes reporting synchronous.

**Concrete failure scenario:** a conforming implementation reports each attempt and re-reports earlier failed attempts during later delivery steps. This requires more ledger requests than the five new-attempt reports alone. Once the five configured responses are consumed, another required report waits on the empty response queue instead of receiving the advertised 503. The terminal assertions may never be reached or may depend on wall-clock client timeouts. FakeClock does not supply missing HTTP responses. This follows from the same pinned QueueDispatcher behavior cited above; it is not an observed test run.

The former always-rejecting object double did not have this finite-response mismatch. Switching to the real adapter is a sound correction, but its transport fixture must preserve the intended failure behavior.

**Minimum direction:** provide explicit, sufficient response behavior for the legal report/re-report sequence without prescribing an extra ordering or retry algorithm. Also make an unexpected post-terminal request complete promptly enough to reach the unchanged-count assertion, rather than leaving the discrimination case waiting for an unconfigured response. Use the existing MockWebServer facilities; no new infrastructure is warranted.

## Non-blocking observations and accepted limits

- The real RestLedgerClient/transport-edge recorder is an appropriate substitute for the proposed double of a not-yet-declared method. Keep that choice; repair its fixture setup.
- The four displayed patch hunk counts now match their bodies: 15/13, 5/7, 5/5 and 10/13. The provider correction is accurately counted as three hunks. This structural check supports evidence readability, not test correctness.
- The disclosed LedgerClient/RestLedgerClient omission from PLAN's affected-file table is pre-existing, not a regression of this correction. Approach/I1 already identify their role. Keep the locked plan untouched here, but treat the omission as a known planning-inventory gap; later Verifier discovery is not a substitute for acknowledging it when Tester notices it. This does not add a blocker to this targeted stage-5b review.
- The adoption rationale is still slightly overstated: [the request-count deletion explanation](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:165>) treats an immediate count of one as a perpetual no-retry assertion. That immediate count is compatible with backoff. The approved deletion and obsolete terminal-status conflict remain visible; correct the explanation without broadening the adoption delta.
- SMALL's 69-line contract, absence of a completed activation example, and the previously accepted P3-C1 closure notes remain accepted. They do not justify another architecture cycle.

## Final recommendation

**TARGETED_CORRECTION_REQUIRED.** Preserve the terminal checks and SMALL correction. Complete C2-I1's business-identity binding and make the LARGE ledger response fixtures support the claimed success and repeated-failure cases. Update their evidence claims together, then perform a targeted closure review. P3-C2 is not yet ready to commit; P3-C3 and publishing remain on hold.

Only this new review artifact was created. No existing project file or review was edited, and no implementation agent, commit or push was invoked.

### Working-tree identity

Ten-file fingerprint: `436768F281722DB8A17FC5F076293397C3F79B0389FE99995C2C31CF4252CA75`.

Definition: SHA-256 of UTF-8 text containing the ten authorized files' lexically sorted repository-relative `path=UPPERCASE_SHA256` entries, joined by LF with no trailing LF. This identifies the reviewed uncommitted contents separately from HEAD.

