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

- `payments-api`: `WebhookRetryServiceTest#retriesWithExponentialBackoffUntilMaxAttempts`, `WebhookRetryServiceTest#stopsRetryingAfterMaxAttemptsExceeded`, `WebhookRetryServiceTest#stopsRetryingAfterSuccessfulAttempt` — all three WITNESS tests fail.
- `payments-ledger`: `WebhookRetryAuditTest#recordsRetryAttemptInAuditLog` — the one WITNESS test fails.

## Failure reasons

All four WITNESS tests were written against `payments-api`'s and `payments-ledger`'s **existing** classes and endpoints only (no production code was added by this agent), so each compiles cleanly; every failure is an assertion failure caused by the missing acceptance behavior itself, not a compile or setup error [TOOL]:

- `retriesWithExponentialBackoffUntilMaxAttempts`: `WebhookDeliveryService` currently performs exactly one delivery attempt with no retry orchestration, so `FakeClock`'s recorded scheduled-delay sequence is empty instead of the expected `[1s, 2s, 4s]`.
- `stopsRetryingAfterMaxAttemptsExceeded`: with no retry loop, a failed delivery is left in status `FAILED`, never `PERMANENTLY_FAILED`.
- `stopsRetryingAfterSuccessfulAttempt`: with no retry loop, a delivery that would succeed on a later attempt never gets that later attempt, so it stays `FAILED` instead of reaching `DELIVERED`.
- `recordsRetryAttemptInAuditLog`: the internal endpoint the test posts to does not exist yet, so no row is persisted; `AuditLogRepository.findByDeliveryIdAndAttemptNumber(...)` returns empty instead of a row with the expected delivery id, attempt number, and outcome.

## Preservation results

Both PRESERVATION tests pass already, before any implementation exists, and are expected to keep passing after implementation [TOOL]:

- `payments-api`: `WebhookRetryServiceTest#alreadyDeliveredWebhookIsNeverRetried` — PASS. Asserts that a delivery already marked `DELIVERED` has an unchanged attempt history and is never scheduled for another attempt; passes now because no retry mechanism exists yet, and must keep passing once `WebhookRetryService` exists (it must not retry an already-delivered webhook).
- `payments-ledger`: `WebhookRetryAuditTest#existingAuditLogWriteIsUnchanged` — PASS. Asserts that an existing, unrelated `audit_log` write path (a settlement-event write already covered by `AuditLogRepository`) still persists its expected fields unchanged; unaffected by the new webhook-retry endpoint, before and after.

## Evidence excerpt

`payments-api`:
```text
[INFO] Running com.payments.webhook.WebhookRetryServiceTest
[ERROR] Tests run: 4, Failures: 3, Errors: 0, Skipped: 0, Time elapsed: 0.436 s
[ERROR] retriesWithExponentialBackoffUntilMaxAttempts  Time elapsed: 0.101 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected scheduled delay sequence: <[PT1S, PT2S, PT4S]> but was: <[]>
[ERROR] stopsRetryingAfterMaxAttemptsExceeded  Time elapsed: 0.098 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <PERMANENTLY_FAILED> but was: <FAILED>
[ERROR] stopsRetryingAfterSuccessfulAttempt  Time elapsed: 0.096 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <DELIVERED> but was: <FAILED>
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

Every WITNESS test failed for its acceptance condition itself — the missing retry orchestration in `payments-api`; the missing audit-recording endpoint and persisted fields in `payments-ledger` — none failed to compile, and none failed due to test setup or infrastructure [TOOL]. Every PRESERVATION test (`alreadyDeliveredWebhookIsNeverRetried` in `payments-api`; `existingAuditLogWriteIsUnchanged` in `payments-ledger`) passed as expected.

## Amendment re-proof

None — no test-change request was made or approved during this run.
