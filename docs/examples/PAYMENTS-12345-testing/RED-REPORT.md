```yaml
artifact: RED-REPORT.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: RED
producedBy: tester
inputs: [PLAN.md, TEST-REVIEW.md]
```

This is the **round-2** RED report (after the one automatic correction round TEST-REVIEW.md round 1 required). The round-1 version of `recordsRetryAttemptInAuditLog`'s RED evidence is **superseded** and not reproduced here — its failure locus was its status assertion (`assertThat(result.getResponse().getStatus()).isEqualTo(200)`, its first assertion); the correction both swapped the double and reordered the assertions, so round 2's failure locus is instead the persisted-row-presence assertion (see TEST-CONTRACT.md's Correction rounds and TEST-REVIEW.md's Finding F1).

Every excerpt below quotes a fictional `org.opentest4j.AssertionFailedError` thrown at the named test method's own assertion (AssertJ assertions, which surface as `org.opentest4j.AssertionFailedError` under JUnit 5); none is a compile error, an unresolved symbol, or a setup/infrastructure failure.

## Command per repository

**`payments-api`**: `mvn -q -Dtest='WebhookRetryServiceTest,WebhookDeliveryServiceTest,WebhookDeliveryStatusControllerTest' test`. A stage-5b correction round re-proves RED for the whole evidence package (T11), so Tester re-ran this command twice at round 2 — both runs discovered and executed the same twelve identities against the Contract map, identical to round 1: the ten `WebhookRetryServiceTest` methods (`retriesWithExponentialBackoffUntilMaxAttempts`, `continuesRetryingBeforeMaxAttemptsReached`, `stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts`, `stopsRetryingAfterSuccessfulAttempt`, `reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt`, `marksDeliveryUnreportedWhenLedgerReportBudgetExhausted`, `marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded`, `alreadyDeliveredWebhookIsNeverRetried`, `encodesRetryAttemptReportAtTheTransportEdge`, `retryReportTransportFailureLeavesAttemptUnreported`); `firstFailedAttemptIsRecordedWithFailureOutcome` (in `WebhookDeliveryServiceTest.java`, adopted); and `existingStatusValuesAreReturnedUnchangedForExistingDeliveries` (in `WebhookDeliveryStatusControllerTest.java`, its own one-method class). Round 2's results for all twelve identities are identical to round 1, since the correction changed only `payments-ledger`.

**`payments-ledger`**: `mvn -q -Dtest=WebhookRetryAuditControllerTest test`. Both round-2 runs discovered and executed `recordsRetryAttemptInAuditLog` against the Contract map.

## RED evidence

### `retriesWithExponentialBackoffUntilMaxAttempts` (AC1)

- **Expected**: after the first failed attempt, the persisted row's `next_attempt_at` column equals `Timestamp.from(fakeClock.instant().plus(Duration.ofSeconds(1)))` (`baseDelay·2^(1-1) = 1s`); assertion: `assertThat(row.get("next_attempt_at")).isEqualTo(Timestamp.from(fakeClock.instant().plus(baseDelay)))`, read via `jdbc.queryForMap("select * from webhook_delivery where id = ?", delivery.getId())`.
- **Observed**: `null` — `select *` never names a column that does not yet exist, so the key is simply absent from the returned map; not a SQL error.
- **Failure locus** (`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:42`, quoted from [TOOL], fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  expected: 2026-01-05T00:00:01Z
   but was: null
  ```
- **Setup**: Given a delivery created via `pendingDelivery("del-8001")` with four `503` responses enqueued at the merchant `MockWebServer` (D2m) — exactly the four failed attempts the loop drives (`k = 1..4`), no fewer, no more; the test drives `webhookDeliveryService.attemptDelivery(deliveryId)` once per iteration, then reads the persisted row via the pre-existing `JdbcTemplate` test support. This is not a wrong precondition: the delivery is freshly created for this test with a unique id (`del-8001`) and the merchant double is armed with exactly the failing responses this scenario requires — a passing PRESERVATION test elsewhere in the same run never substitutes for showing this WITNESS's own Given (T6). (The loop asserting the same relationship after each of attempts 2–4 never executes, since the assertion at attempt 1 already throws.)
- **Why this proves the clause is unsatisfied**: `WebhookDeliveryService` today performs exactly one attempt and marks the delivery terminal on that attempt's failure (E1); no backoff-delay computation or further-attempt scheduling exists yet, so no `next_attempt_at` value is ever persisted.
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

### `continuesRetryingBeforeMaxAttemptsReached` (AC2, non-terminal boundary — attempt 4)

- **Expected**: after driving through 4 failed attempts, the merchant mock has received exactly 4 requests; assertion: `assertThat(mockMerchantEndpoint.getRequestCount()).isEqualTo(4)`.
- **Observed**: `1` — only the first attempt ever reaches the merchant mock.
- **Failure locus** (`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:61`, fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  expected: 4
   but was: 1
  ```
- **Setup**: Given a delivery `del-8003` with four `503` responses enqueued; the drive loop calls `attemptDelivery` up to four times, advancing `FakeClock` between calls.
- **Why this proves the clause is unsatisfied**: `WebhookDeliveryService.attemptDelivery` already guards against reattempting a delivery once it is terminal (the same existing guard P1 confirms for `DELIVERED`); since it marks the delivery `FAILED` (today's terminal value) after the very first failure, every later call in the drive loop no-ops — evidencing that no retry-eligible interim state exists yet, one attempt short of the boundary.
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

### `stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts` (AC2, boundary — attempt `5 = maxAttempts`)

- **Expected**: after all 5 attempts fail, `delivery.getStatus().name()` equals `"PERMANENTLY_FAILED"`.
- **Observed**: `"FAILED"`.
- **Failure locus** (`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:79`, fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  expected: "PERMANENTLY_FAILED"
   but was: "FAILED"
  ```
- **Setup**: Given a delivery `del-8002` with five `503` responses enqueued at the merchant `MockWebServer` — one per attempt through `maxAttempts`; same drive loop as the row above, driven the full five attempts.
- **Why this proves the clause is unsatisfied**: no retry-exhaustion transition exists; the delivery is left at the pre-existing terminal value `FAILED`, reached after only the first attempt, never `PERMANENTLY_FAILED`. This is the first assertion in the method; the request-count assertion that follows, and the entire controlled subsequent check (`FakeClock` advanced 32s past the largest possible delay, the entry point called once more, then asserting no sixth request and no pending `next_attempt_at`) are unreached pre-implementation — the driver helper's own five-call bound is never treated as evidence of stopping; the controlled check is.
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

### `stopsRetryingAfterSuccessfulAttempt` (AC3)

- **Expected**: after attempt 1 fails (`503`) and attempt 2 succeeds (`200`), `delivery.getStatus().name()` equals `"DELIVERED"`.
- **Observed**: `"FAILED"` — attempt 2 never actually happens, so the queued `200` response is never consumed.
- **Failure locus** (`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:96`, fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  expected: "DELIVERED"
   but was: "FAILED"
  ```
- **Setup**: Given a delivery `del-8004` with `[503, 200]` enqueued at the merchant mock — attempt 1 fails, attempt 2 succeeds.
- **Why this proves the clause is unsatisfied**: no retry mechanism exists to reach the second, successful attempt. This is the test's first assertion; the request-count assertion and the entire controlled subsequent check (`FakeClock` advanced 32s, the entry point called once more, then asserting no further request and no pending `next_attempt_at`) are unreached pre-implementation.
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

### `reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt` (AC5, i)

- **Expected**: immediately after attempt 1, exactly one request has reached the dedicated ledger `MockWebServer` instance (D2l) — the one served the `503`, since `MockWebServer` serves enqueued responses in strict order of request arrival; assertion: `assertThat(mockLedgerServer.getRequestCount()).isEqualTo(1)`.
- **Observed**: `0` — nothing today calls `LedgerClient`/`RestLedgerClient` to report any attempt's outcome (E2).
- **Failure locus** (`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:114`, quoted from [TOOL], fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  expected: 1
   but was: 0
  ```
- **Setup**: Given a delivery `del-9002` with `[503, 200]` enqueued at the merchant `MockWebServer` and `[503, 200, 200]` enqueued at the dedicated ledger `MockWebServer` (D2l); `RestLedgerClient` is real, pointed at that instance.
- **Why this proves the clause is unsatisfied**: nothing today calls `LedgerClient`/`RestLedgerClient` to report any attempt's outcome (E2), so the ledger mock never receives a request during attempt 1. This is the test's first assertion; the check decoding that first request's body as `(del-9002, 1, FAILURE)`, the cumulative count-of-3 assertion taken after attempt 2's step, and the check draining the two remaining requests into decoded `(deliveryId, attemptNumber, outcome)` tuples, are all unreached pre-implementation. Once reached, the step-1 body check establishes that the one request made during attempt 1 is this delivery's attempt-1 `FAILURE` report, and the step-2 multiset check (expecting `(del-9002, 1, FAILURE)` and `(del-9002, 2, SUCCESS)` in any order) is what would separately catch a **wrong-delivery re-report** (a re-report carrying another delivery's id yields no `(del-9002, 1, FAILURE)` in step 2), a **wrong-attempt re-report** (re-reporting any attempt other than 1 yields a decoded body other than `(del-9002, 1, FAILURE)`), and an **attempt-2-reported-twice** defect (reporting attempt 2 twice instead of re-reporting attempt 1 yields two `(del-9002, 2, SUCCESS)` bodies) — the request-count assertions alone cannot distinguish any of these defects from correct behavior, since every scenario reaches the same totals (`1`, then `3`).
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

### `marksDeliveryUnreportedWhenLedgerReportBudgetExhausted` (AC5, ii)

- **Expected**: once the retry budget is exhausted with every ledger request rejected, the delivery is, in the same scenario, both `PERMANENTLY_FAILED` and persisted with `ledger_report_status = "UNREPORTED"` — asserted together, never delegated to the separate AC2 boundary test (which enqueues an accepting ledger response); assertion (first): `assertThat(persisted.getStatus().name()).isEqualTo("PERMANENTLY_FAILED")`.
- **Observed**: `"FAILED"` — the pre-existing terminal value, reached after only the first attempt.
- **Failure locus** (`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:145`, quoted from [TOOL], fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  expected: "PERMANENTLY_FAILED"
   but was: "FAILED"
  ```
- **Setup**: Given a delivery `del-9003` with six `503` responses enqueued at the merchant mock — five for the attempts the driver drives, plus one reserved for the post-terminal probe, which a correct implementation never consumes (the count assertion stays `5`) but which lets an incorrect sixth request be answered and counted rather than wait on an empty queue — and an always-rejecting `503` `Dispatcher` installed on the dedicated ledger `MockWebServer` (D2l), so every report and every legal re-report is rejected however many the implementation makes, and an unexpected post-terminal ledger request is answered promptly; `RestLedgerClient` is real, pointed at that instance. Both mock instances are fresh per test (created in `@BeforeEach`, shut down in `@AfterEach`), so this dispatcher reaches no other test.
- **Why this proves the clause is unsatisfied**: no retry-exhaustion transition exists, so the delivery never reaches `PERMANENTLY_FAILED`; this is the test's first assertion, so the `ledger_report_status` assertion and the entire controlled subsequent check (`FakeClock` advanced 32s, the entry point called once more, then comparing `mockLedgerServer.getRequestCount()` before and after and asserting no pending `next_attempt_at`) are unreached pre-implementation.
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

### `marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded` (AC5, iii)

- **Expected**: a delivery that reaches `DELIVERED` while its successful attempt's ledger report has been rejected has its persisted row's `ledger_report_status` column equal to `"UNREPORTED"`; assertion: `assertThat(row.get("ledger_report_status")).isEqualTo("UNREPORTED")`, read via `jdbc.queryForMap(...)`.
- **Observed**: `null` — `select *` never names a column that does not yet exist.
- **Failure locus** (`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:163`, fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  expected: "UNREPORTED"
   but was: null
  ```
- **Setup**: Given a delivery `del-9004` with a single `200` enqueued at the merchant mock (succeeds on its only attempt) and a single `503` enqueued at the dedicated ledger `MockWebServer` (D2l); `RestLedgerClient` is real, pointed at that instance.
- **Why this proves the clause is unsatisfied**: no ledger-reporting logic exists at all today (E2), so the `UNREPORTED` marker is never written even though the delivery correctly reaches `DELIVERED` on its own (that part of today's behavior is unaffected — the `DELIVERED` assertion above this one already passes pre-implementation). This is the test's second assertion; the entire controlled subsequent check that follows (`FakeClock` advanced 32s, the entry point called once more, then comparing `mockLedgerServer.getRequestCount()` before and after and asserting no pending `next_attempt_at`) is unreached pre-implementation.
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

### `encodesRetryAttemptReportAtTheTransportEdge` (I1, consumer adapter evidence)

- **Expected**: after the (only) attempt succeeds, the dedicated ledger `MockWebServer` instance (D2l) has received exactly one request; assertion: `assertThat(mockLedgerServer.getRequestCount()).isEqualTo(1)`.
- **Observed**: `0`.
- **Failure locus** (`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:198`, fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  expected: 1
   but was: 0
  ```
- **Setup**: Given a delivery `del-9005` with a single `200` enqueued at the merchant mock and a single accepting `200` enqueued at the dedicated ledger `MockWebServer` instance (D2l) — the successful ledger response is configured explicitly, never assumed as a default (the mock's default dispatcher waits on an empty queue rather than answering `200`); `RestLedgerClient` is real (not doubled), pointed at that instance. Pre-implementation the queued ledger `200` is never consumed, since no request is made.
- **Why this proves the clause is unsatisfied**: nothing today calls `LedgerClient`/`RestLedgerClient` to report any attempt's outcome (E2), so the mocked `payments-ledger` endpoint never receives a request. This is the test's first assertion; a final discrimination assertion (`assertThat(row.get("ledger_report_status")).isNull()`) is trivially true before any implementation exists — since the column does not yet exist — and continues to hold after implementation, confirming that a successful report never leaves a false outstanding-report marker.
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

### `retryReportTransportFailureLeavesAttemptUnreported` (I1, deployment-compatibility / negative evidence)

- **Expected**: after the only attempt succeeds at the merchant endpoint but `payments-ledger`'s mocked `I1` endpoint returns `503` to the retry-report request, the dedicated ledger `MockWebServer` instance (D2l) has received exactly one request; assertion: `assertThat(mockLedgerServer.getRequestCount()).isEqualTo(1)`.
- **Observed**: `0` — nothing today calls `LedgerClient` through the real retry-report path.
- **Failure locus** (`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:224`, quoted from [TOOL], fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  expected: 1
   but was: 0
  ```
- **Setup**: Given a delivery `del-9006` with a single `200` enqueued at the merchant mock and a single `503` enqueued at the dedicated ledger `MockWebServer` (D2l); `RestLedgerClient` is real (not doubled), pointed at that mock instance.
- **Why this proves the clause is unsatisfied**: nothing today calls `LedgerClient`/`RestLedgerClient` to report any attempt's outcome (E2), so the mocked `payments-ledger` endpoint never receives the retry-report request at all — this is the test's first assertion; the request-body, `ledger_report_status`, and `DELIVERED` assertions are unreached pre-implementation. The test claims only the observed consumer outcome (`ledger_report_status = UNREPORTED` after a real `503`), never the specific `LedgerReportException` translation.
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

### `recordsRetryAttemptInAuditLog` (AC4, `payments-ledger`, round 2)

- **Expected**: the audit-log row for the reported attempt is present; assertion: `assertThat(auditLogRepository.findByEntityTypeAndEntityId("WEBHOOK_DELIVERY", "del-9001")).isPresent()`.
- **Observed**: empty — the POST returns `404` (the endpoint does not exist yet), so no row is ever persisted and the repository query finds nothing.
- **Failure locus** (`payments-ledger/src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java:29`, fictional):
  ```text
  org.opentest4j.AssertionFailedError: 
  Expecting Optional to contain a value but it was empty
  ```
- **Setup**: Given a `POST` to `/internal/audit/webhook-retry-attempts` with a well-formed `RetryAttemptReport` body (`deliveryId="del-9001"`, `attemptNumber=2`, `outcome="SUCCESS"`).
- **Why this proves the clause is unsatisfied**: the endpoint (`WebhookRetryAuditController`) does not exist yet (E11 — no existing endpoint for recording a webhook retry attempt), so Spring returns `404 Not Found` and no persistence logic ever runs; this is a **different** failure locus from the round-1 (superseded) version, which asserted the HTTP status first and failed there instead — the correction round both swapped the double for the real repository and reordered the assertions so the clause's own required outcome (a persisted row) is what fails, not an incidental transport detail (see TEST-CONTRACT.md's Correction rounds and TEST-REVIEW.md's Finding F1).
- **Validity**: compiled/loaded at anchor: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes.

## Preservation results

All PRESERVATION tests pass already, before any implementation exists, and are expected to keep passing after implementation:

- `payments-api`: `WebhookRetryServiceTest.java#alreadyDeliveredWebhookIsNeverRetried` (P1) — PASS [TOOL]. A delivery already `DELIVERED` is never reconsidered for another attempt; unaffected by the retry feature's absence.
- `payments-api`: `WebhookDeliveryStatusControllerTest.java#existingStatusValuesAreReturnedUnchangedForExistingDeliveries` (P3) — PASS [TOOL], both round-2 runs of the three-class contract command, identical to round 1.
- `payments-api`: `WebhookDeliveryServiceTest.java#firstFailedAttemptIsRecordedWithFailureOutcome` (adopted) — PASS [TOOL]. A delivery's first failed attempt is already recorded with outcome `FAILURE`, independent of the retry feature.
- Relied-on baseline — `payments-ledger`: `AuditLogRepositoryTest.java#persistsPaymentCapturedEventPayload` (covers P2) — PASS [TOOL] (see TEST-CONTRACT.md's Relied-on existing tests for the scoped command and fictional output).

## Evidence excerpt

`payments-api` (round 2, run 1 — fictional):
```text
[INFO] Running com.payments.webhook.WebhookRetryServiceTest
[ERROR] Tests run: 10, Failures: 9, Errors: 0, Skipped: 0, Time elapsed: 0.842 s
[ERROR] retriesWithExponentialBackoffUntilMaxAttempts  Time elapsed: 0.071 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: 2026-01-05T00:00:01Z but was: null
[ERROR] continuesRetryingBeforeMaxAttemptsReached  Time elapsed: 0.058 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: 4 but was: 1
[ERROR] stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts  Time elapsed: 0.063 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: "PERMANENTLY_FAILED" but was: "FAILED"
[ERROR] stopsRetryingAfterSuccessfulAttempt  Time elapsed: 0.052 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: "DELIVERED" but was: "FAILED"
[ERROR] reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt  Time elapsed: 0.061 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: 1 but was: 0
[ERROR] marksDeliveryUnreportedWhenLedgerReportBudgetExhausted  Time elapsed: 0.066 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: "PERMANENTLY_FAILED" but was: "FAILED"
[ERROR] marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded  Time elapsed: 0.049 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: "UNREPORTED" but was: null
[INFO] alreadyDeliveredWebhookIsNeverRetried  Time elapsed: 0.021 s  -- PASS
[ERROR] encodesRetryAttemptReportAtTheTransportEdge  Time elapsed: 0.044 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: 1 but was: 0
[ERROR] retryReportTransportFailureLeavesAttemptUnreported  Time elapsed: 0.038 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: 1 but was: 0
[INFO] Running com.payments.webhook.WebhookDeliveryServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.210 s
[INFO] firstFailedAttemptIsRecordedWithFailureOutcome  Time elapsed: 0.019 s  -- PASS
[INFO] Running com.payments.webhook.WebhookDeliveryStatusControllerTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.083 s
[INFO] existingStatusValuesAreReturnedUnchangedForExistingDeliveries  Time elapsed: 0.041 s  -- PASS
```

`payments-api` (round 2, run 2 — fictional): identities and results identical to run 1 above (same 9 WITNESS failures at the same loci, same 1 PRESERVATION PASS in `WebhookRetryServiceTest`, same 4 PASSes including the adopted identity in `WebhookDeliveryServiceTest`, same 1 PASS in `WebhookDeliveryStatusControllerTest`; also identical to round 1); trimmed to the summary lines: `Tests run: 10, Failures: 9` / `Tests run: 4, Failures: 0` / `Tests run: 1, Failures: 0` (all `Errors: 0, Skipped: 0`).

`payments-ledger` (round 2, run 1 — fictional):
```text
[INFO] Running com.payments.ledger.WebhookRetryAuditControllerTest
[ERROR] Tests run: 1, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.187 s
[ERROR] recordsRetryAttemptInAuditLog  Time elapsed: 0.152 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: Expecting Optional to contain a value but it was empty
```

`payments-ledger` (round 2, run 2 — fictional): identities and results identical to run 1 above (`Tests run: 1, Failures: 1, Errors: 0, Skipped: 0`, same failure locus).

## Confirmation

Every contract identity named in TEST-CONTRACT.md's Contract map was discovered and executed against it, on both runs, in both repositories [TOOL]. Every WITNESS test (`retriesWithExponentialBackoffUntilMaxAttempts`, `continuesRetryingBeforeMaxAttemptsReached`, `stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts`, `stopsRetryingAfterSuccessfulAttempt`, `reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt`, `marksDeliveryUnreportedWhenLedgerReportBudgetExhausted`, `marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded`, `encodesRetryAttemptReportAtTheTransportEdge`, `retryReportTransportFailureLeavesAttemptUnreported`, `recordsRetryAttemptInAuditLog`) failed at its own assertion on the clause's outcome — never a compile error, an unresolved symbol, or a setup/infrastructure error. Every PRESERVATION test (`alreadyDeliveredWebhookIsNeverRetried`, `existingStatusValuesAreReturnedUnchangedForExistingDeliveries`, `firstFailedAttemptIsRecordedWithFailureOutcome`) passed as expected, as did the relied-on baseline (`persistsPaymentCapturedEventPayload`). Results were reproduced identically on a second, consecutive run in both repositories [TOOL].

## Amendment re-proof

none — no `TEST-CHANGE-REQUEST` (amendment) occurred in this run; the stage-5 Tester-origin adoption is recorded in TEST-CONTRACT.md's Pre-existing test conflicts, a distinct route from an amendment, and carries no separate re-proof entry here (its RED-equivalent evidence is the PRESERVATION entry for `firstFailedAttemptIsRecordedWithFailureOutcome` above, since the adopted test is classified PRESERVATION, not WITNESS).
