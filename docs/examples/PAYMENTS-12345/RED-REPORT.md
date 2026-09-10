```yaml
artifact: RED-REPORT.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: RED
producedBy: tester
inputs: [PLAN.md]
```

## Command per repository

- `payments-api`: `mvn -q -Dtest=WebhookRetryServiceTest test`
- `payments-ledger`: `mvn -q -Dtest=WebhookRetryAuditTest test`

## Failing tests

- `payments-api`: `WebhookRetryServiceTest#retriesWithExponentialBackoffUntilMaxAttempts`, `WebhookRetryServiceTest#stopsRetryingAfterMaxAttemptsExceeded`, `WebhookRetryServiceTest#stopsRetryingAfterSuccessfulAttempt`, `WebhookRetryServiceTest#reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt`, `WebhookRetryServiceTest#marksDeliveryUnreportedWhenLedgerReportBudgetExhausted`, `WebhookRetryServiceTest#marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded` — all six WITNESS tests fail.
- `payments-ledger`: `WebhookRetryAuditTest#recordsRetryAttemptInAuditLog` — the one WITNESS test fails.

## Failure reasons

All seven WITNESS tests were written against `payments-api`'s and `payments-ledger`'s **existing** classes and endpoints only (no production code was added by this agent), so each compiles cleanly; every failure is an assertion failure caused by the missing acceptance behavior itself, not a compile or setup error [TOOL]:

- `retriesWithExponentialBackoffUntilMaxAttempts`: `WebhookDeliveryService` currently performs exactly one delivery attempt with no retry orchestration, so `FakeClock`'s recorded scheduled-delay sequence is empty instead of the expected `[1s, 2s, 4s]`.
- `stopsRetryingAfterMaxAttemptsExceeded`: with no retry loop, a failed delivery is left in status `FAILED`, never `PERMANENTLY_FAILED`.
- `stopsRetryingAfterSuccessfulAttempt`: with no retry loop, a delivery that would succeed on a later attempt never gets that later attempt, so it stays `FAILED` instead of reaching `DELIVERED`.
- `reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt`: no re-report logic exists yet, so when the fake `LedgerClient` fails once and the delivery's next scheduled attempt runs, the fake ledger never receives a second, re-reported call for the earlier unreported attempt.
- `marksDeliveryUnreportedWhenLedgerReportBudgetExhausted`: no `ledgerReportStatus` field or exhaustion handling exists yet, so after the delivery's retry budget is exhausted with an attempt still unreported, the persisted delivery record's `ledgerReportStatus` stays `null` instead of `UNREPORTED`.
- `marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded`: no `ledgerReportStatus` handling exists yet, so after a successful attempt whose ledger report fails, the persisted delivery record's `ledgerReportStatus` stays `null` instead of `UNREPORTED`, even though the delivery is already terminal (`DELIVERED`).
- `recordsRetryAttemptInAuditLog`: the internal endpoint the test posts to does not exist yet, so no row is persisted; `AuditLogRepository.findByDeliveryIdAndAttemptNumber(...)` returns empty instead of a row with the expected delivery id, attempt number, and outcome.

## Preservation results

Both PRESERVATION tests pass already, before any implementation exists, and are expected to keep passing after implementation [TOOL]:

- `payments-api`: `WebhookRetryServiceTest#alreadyDeliveredWebhookIsNeverRetried` — PASS. Asserts that a delivery already marked `DELIVERED` has an unchanged attempt history and is never scheduled for another attempt; passes now because no retry mechanism exists yet, and must keep passing once `WebhookRetryService` exists (it must not retry an already-delivered webhook).
- `payments-ledger`: `WebhookRetryAuditTest#existingAuditLogWriteIsUnchanged` — PASS. Asserts that an existing, unrelated `audit_log` write path (a settlement-event write already covered by `AuditLogRepository`) still persists its expected fields unchanged; unaffected by the new webhook-retry endpoint, before and after.

## Evidence excerpt

`payments-api`:
```text
[INFO] Running com.payments.webhook.WebhookRetryServiceTest
[ERROR] Tests run: 7, Failures: 6, Errors: 0, Skipped: 0, Time elapsed: 0.696 s
[ERROR] retriesWithExponentialBackoffUntilMaxAttempts  Time elapsed: 0.101 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected scheduled delay sequence: <[PT1S, PT2S, PT4S]> but was: <[]>
[ERROR] stopsRetryingAfterMaxAttemptsExceeded  Time elapsed: 0.098 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <PERMANENTLY_FAILED> but was: <FAILED>
[ERROR] stopsRetryingAfterSuccessfulAttempt  Time elapsed: 0.096 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <DELIVERED> but was: <FAILED>
[ERROR] reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt  Time elapsed: 0.087 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected fake ledger to receive a re-report for [deliveryId=del-9002, attemptNumber=1, outcome=FAILURE] but received no second call
[ERROR] marksDeliveryUnreportedWhenLedgerReportBudgetExhausted  Time elapsed: 0.081 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <UNREPORTED> but was: <null>
[ERROR] marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded  Time elapsed: 0.084 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: delivery del-9003 DELIVERED on attempt 2 with a failed ledger report — expected: <UNREPORTED> but was: <null>
[INFO] alreadyDeliveredWebhookIsNeverRetried  Time elapsed: 0.024 s  -- PASS
```

`payments-ledger`:
```text
[INFO] Running com.payments.ledger.WebhookRetryAuditTest
[ERROR] Tests run: 2, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.241 s
[ERROR] recordsRetryAttemptInAuditLog  Time elapsed: 0.198 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected persisted audit row [deliveryId=del-9001, attemptNumber=2, outcome=SUCCESS] but found: none
[INFO] existingAuditLogWriteIsUnchanged  Time elapsed: 0.020 s  -- PASS
```

## Confirmation

Every WITNESS test failed for its acceptance condition itself — the missing retry orchestration, re-report logic, and `ledgerReportStatus` marking in `payments-api`; the missing audit-recording endpoint and persisted fields in `payments-ledger` — none failed to compile, and none failed due to test setup or infrastructure [TOOL]. Every PRESERVATION test (`alreadyDeliveredWebhookIsNeverRetried` in `payments-api`; `existingAuditLogWriteIsUnchanged` in `payments-ledger`) passed as expected.

## Amendment re-proof

None — no test-change request was made or approved during this run.
