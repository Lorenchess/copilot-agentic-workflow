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
| AC4 — retry attempt recorded in the ledger audit log | `payments-ledger`: `WebhookRetryAuditTest#recordsRetryAttemptInAuditLog` |

## Test file paths per repository

- `payments-api`: `src/test/java/com/payments/webhook/WebhookRetryServiceTest.java`
- `payments-ledger`: `src/test/java/com/payments/ledger/WebhookRetryAuditTest.java`

## RED commit SHA per repository

- `payments-api`: `aaaa1111bbbb2222cccc3333dddd4444eeee5555` [TOOL] (`git -C payments-api log -1 --format=%H`)
- `payments-ledger`: `bbbb2222cccc3333dddd4444eeee5555aaaa1111` [TOOL] (`git -C payments-ledger log -1 --format=%H`)

## Run command per repository

- `payments-api`: `mvn -q -Dtest=WebhookRetryServiceTest test`
- `payments-ledger`: `mvn -q -Dtest=WebhookRetryAuditTest test`

## Amendments

None — no test-change request was made or approved during this run.
