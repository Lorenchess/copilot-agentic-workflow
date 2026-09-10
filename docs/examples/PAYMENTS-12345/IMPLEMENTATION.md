```yaml
artifact: IMPLEMENTATION.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: GREEN
producedBy: developer
inputs: [PLAN.md, TEST-CONTRACT.md, RED-REPORT.md]
```

## Changes per repository

### `payments-api`
- `src/main/java/com/payments/webhook/WebhookRetryService.java` (new) — computes exponential backoff, schedules retries, reports each attempt to `payments-ledger` via `LedgerClient`; per PLAN.md's round-2 AC5, re-reports an unreported attempt on the delivery's next scheduled attempt within the delivery's own max-attempts budget, and marks `ledgerReportStatus = UNREPORTED` on the delivery once that budget is exhausted with an attempt still unreported. [REPO]
- `src/main/java/com/payments/webhook/WebhookDeliveryService.java` (edited) — calls `WebhookRetryService` on a retryable failure instead of stopping after one attempt. [REPO]
- `src/main/resources/application.yml` (edited) — added `webhook.retry.base-delay` and `webhook.retry.max-attempts` configuration keys. [REPO]/[DEV]
- `src/main/java/com/payments/webhook/WebhookDelivery.java` (edited) — added `ledgerReportStatus` field, set to `UNREPORTED` by `WebhookRetryService` when the retry budget is exhausted with an attempt still unreported. [REPO]

### `payments-ledger`
- `src/main/java/com/payments/ledger/WebhookRetryAuditController.java` (new) — internal `POST /internal/webhook-retries` endpoint that records a reported attempt with delivery id, attempt number, and outcome. [REPO]
- `src/main/java/com/payments/ledger/AuditLogRepository.java` (edited) — added `recordWebhookRetry(deliveryId, attemptNumber, outcome)`, writing into the existing `audit_log` table (no new table). [REPO]/[DEV]

No path listed in TEST-CONTRACT.md's Test file paths per repository was edited.

## Commits

- `payments-api`: `cccc3333dddd4444eeee5555aaaa1111bbbb2222` — "feat(PAYMENTS-12345): retry failed webhook deliveries with exponential backoff" [TOOL]
- `payments-ledger`: `dddd4444eeee5555aaaa1111bbbb2222cccc3333` — "feat(PAYMENTS-12345): record webhook retry attempts in ledger audit_log" [TOOL]

## GREEN evidence

`payments-api` — `mvn -q -Dtest=WebhookRetryServiceTest test`:
```text
[INFO] Running com.payments.webhook.WebhookRetryServiceTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.588 s
[INFO] BUILD SUCCESS
```

`payments-ledger` — `mvn -q -Dtest=WebhookRetryAuditTest test`:
```text
[INFO] Running com.payments.ledger.WebhookRetryAuditTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.203 s
[INFO] BUILD SUCCESS
```

Both runs are actual passing runs captured by this agent, covering both the WITNESS and PRESERVATION tests in each class; GREEN is not asserted without one. [TOOL]

## Envelope changes

### `payments-api`
- `pom.xml` — added runtime dependency `org.springframework.retry:spring-retry:2.0.5`. Needed by `WebhookRetryService` to schedule delayed retry attempts; no test-scope change. No contract test was made undiscovered, skipped, or excluded by this change. [REPO]/[DEV]

### `payments-ledger`
- None. [REPO]

## Test-change requests

None.

## Deviations from plan

PLAN.md's Approach for `payments-api` named a separate `RetryBackoffPolicy` class for the backoff calculation. Implemented the calculation as a private method on `WebhookRetryService` instead — it is a single, purely computational three-line expression (`baseDelay * 2^(attempt-1)`) with no independent responsibility, so a separate class added indirection without benefit. No behavioral difference from PLAN.md's AC1–AC3. [INFERENCE]
