```yaml
artifact: TEST-CONTRACT.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: RED
producedBy: tester
inputs: [PLAN.md]
```

## Scenario-to-test mapping

| Scenario | Test |
|---|---|
| AC1 — retry follows exponential backoff up to the configured maximum | `payments-api`: `WebhookRetryServiceTest#retriesWithExponentialBackoffUntilMaxAttempts` |
| AC2 — no further retry, `PERMANENTLY_FAILED`, once the maximum is exceeded | `payments-api`: `WebhookRetryServiceTest#stopsRetryingAfterMaxAttemptsExceeded` |
| AC3 — no further retry, `DELIVERED`, once a retry succeeds | `payments-api`: `WebhookRetryServiceTest#stopsRetryingAfterSuccessfulAttempt` |
| AC4 — retry attempt recorded in the ledger audit log, including delivery id, attempt number, outcome | `payments-ledger`: `WebhookRetryAuditTest#recordsRetryAttemptInAuditLog` |
| AC5 — a failed ledger-report call is re-reported on the delivery's next scheduled attempt | `payments-api`: `WebhookRetryServiceTest#reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt` |
| AC5 — delivery persisted with `ledgerReportStatus = UNREPORTED` once the retry budget is exhausted with an attempt still unreported | `payments-api`: `WebhookRetryServiceTest#marksDeliveryUnreportedWhenLedgerReportBudgetExhausted` |
| Preservation — a webhook already marked `DELIVERED` is never retried again | `payments-api`: `WebhookRetryServiceTest#alreadyDeliveredWebhookIsNeverRetried` |
| Preservation — an existing (pre-existing, unrelated) `payments-ledger` audit-log write path is unchanged | `payments-ledger`: `WebhookRetryAuditTest#existingAuditLogWriteIsUnchanged` |

## Test classification

| Test | Classification |
|---|---|
| `payments-api`: `WebhookRetryServiceTest#retriesWithExponentialBackoffUntilMaxAttempts` | WITNESS |
| `payments-api`: `WebhookRetryServiceTest#stopsRetryingAfterMaxAttemptsExceeded` | WITNESS |
| `payments-api`: `WebhookRetryServiceTest#stopsRetryingAfterSuccessfulAttempt` | WITNESS |
| `payments-api`: `WebhookRetryServiceTest#reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt` | WITNESS |
| `payments-api`: `WebhookRetryServiceTest#marksDeliveryUnreportedWhenLedgerReportBudgetExhausted` | WITNESS |
| `payments-api`: `WebhookRetryServiceTest#alreadyDeliveredWebhookIsNeverRetried` | PRESERVATION |
| `payments-ledger`: `WebhookRetryAuditTest#recordsRetryAttemptInAuditLog` | WITNESS |
| `payments-ledger`: `WebhookRetryAuditTest#existingAuditLogWriteIsUnchanged` | PRESERVATION |

## Test file paths per repository

- `payments-api`: `src/test/java/com/payments/webhook/WebhookRetryServiceTest.java`
- `payments-ledger`: `src/test/java/com/payments/ledger/WebhookRetryAuditTest.java`

## RED commit SHA per repository

- `payments-api`: `aaaa1111bbbb2222cccc3333dddd4444eeee5555` [TOOL] (`git -C payments-api log -1 --format=%H`)
- `payments-ledger`: `bbbb2222cccc3333dddd4444eeee5555aaaa1111` [TOOL] (`git -C payments-ledger log -1 --format=%H`)

## Run command per repository

- `payments-api`: `mvn -q -Dtest=WebhookRetryServiceTest test` (runs all six methods in the class: five WITNESS, one PRESERVATION)
- `payments-ledger`: `mvn -q -Dtest=WebhookRetryAuditTest test` (runs both methods in the class: one WITNESS, one PRESERVATION)

## Execution envelope per repository

### `payments-api`

- Contract command: `mvn -q -Dtest=WebhookRetryServiceTest test`
- Build/test configuration files: `pom.xml`, `src/test/resources/application-test.yml`
- Helper/fixture paths: `src/test/java/com/payments/webhook/support/FakeClock.java` (injectable clock the tests use to assert the scheduled delay sequence deterministically)

### `payments-ledger`

- Contract command: `mvn -q -Dtest=WebhookRetryAuditTest test`
- Build/test configuration files: `pom.xml`, `src/test/resources/application-test.yml`
- Helper/fixture paths: `src/test/java/com/payments/ledger/support/AuditLogTestFixtures.java` (builds expected audit-row fixtures used by both the new and the preservation test)

## Amendments

None — no test-change request was made or approved during this run.
