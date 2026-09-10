```yaml
artifact: PLAN.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: APPROVED
producedBy: planner
inputs: [INTAKE.md, RUN.md]
```

## Scope

Retry a failed webhook delivery in `payments-api` using exponential backoff up to a configured maximum number of attempts [JIRA — PAYMENTS-12345 Acceptance Criteria], and record every retry attempt (success or failure) in `payments-ledger`'s existing audit log [JIRA — PAYMENTS-12351 Acceptance Criteria]. Both repositories were confirmed at G1 (RUN.md, Repositories) [DEV].

## Approach per repository

### `payments-api`

Extend the existing outbound webhook delivery path so a failed delivery is retried with exponential backoff instead of failing once and stopping. `WebhookDeliveryService` currently performs a single delivery attempt with no retry logic [REPO — `payments-api/src/main/java/com/payments/webhook/WebhookDeliveryService.java`]. Add a `WebhookRetryService` that `WebhookDeliveryService` calls on a retryable failure; the delay for the next attempt is computed by a small new `RetryBackoffPolicy` class (`baseDelay * 2^(attempt-1)`), which `WebhookRetryService` calls, up to a configured maximum attempt count read from `application.yml` [DEV — "Keep the retry backoff config in application.yml, don't hardcode it."], and `WebhookRetryService` marks the delivery `PERMANENTLY_FAILED` once the maximum is exceeded. On each attempt (success or failure) it reports the outcome to `payments-ledger` through the existing `LedgerClient` interface [REPO — `LedgerClient` found in `payments-api`].

### `payments-ledger`

Add an internal endpoint that records a reported webhook retry attempt into the existing `audit_log` table via `AuditLogRepository` [REPO — `payments-ledger/src/main/java/com/payments/ledger/AuditLogRepository.java`], per the developer's explicit instruction not to introduce a new table [DEV — "Ledger team asked that retry attempts write to the existing audit_log table, not a new table."].

## Affected files

- `payments-api/src/main/java/com/payments/webhook/WebhookRetryService.java` (new) [INFERENCE]
- `payments-api/src/main/java/com/payments/webhook/RetryBackoffPolicy.java` (new) [INFERENCE]
- `payments-api/src/main/java/com/payments/webhook/WebhookDeliveryService.java` (edited: invoke retry on failure) [REPO]
- `payments-api/src/main/resources/application.yml` (edited: add retry configuration block) [DEV]
- `payments-ledger/src/main/java/com/payments/ledger/WebhookRetryAuditController.java` (new) [INFERENCE]
- `payments-ledger/src/main/java/com/payments/ledger/AuditLogRepository.java` (edited: add a method to record a webhook retry attempt) [REPO]

## Acceptance criteria

**AC1 (`payments-api`).** Given a webhook delivery fails with a retryable error, When the retry is scheduled, Then the next attempt's delay follows exponential backoff (`baseDelay * 2^(attempt-1)`) up to the configured maximum number of attempts. [JIRA — PAYMENTS-12345]

**AC2 (`payments-api`).** Given a webhook delivery has already failed the configured maximum number of attempts, When another failure occurs, Then no further retry is scheduled and the delivery is marked `PERMANENTLY_FAILED`. [JIRA — PAYMENTS-12345]

**AC3 (`payments-api`).** Given a webhook delivery succeeds on a retry attempt, When the successful response is received, Then no further retries are scheduled and the delivery is marked `DELIVERED`. [JIRA — PAYMENTS-12345]

**AC4 (`payments-ledger`).** Given a webhook retry attempt completes (success or failure), When `payments-api` reports the attempt, Then `payments-ledger` records it in the audit log with delivery id, attempt number, and outcome. [JIRA — PAYMENTS-12351]

## Risks

- Backoff calculation must use an injectable clock/scheduler in tests, or acceptance tests become timing-flaky [INFERENCE].
- A `payments-ledger` call failure must not block or corrupt the retry state machine in `payments-api`; the two systems must degrade independently [INFERENCE].
- No default base delay or maximum attempt count is stated in either Jira issue (INTAKE.md, Unknowns) [INFERENCE]; this plan treats them as configuration values (see `application.yml`, per developer context) rather than hardcoding a guess.

## Open questions

- Should the call from `payments-api` to `payments-ledger` be synchronous (blocking the retry loop) or fire-and-forget? This plan assumes the existing `LedgerClient` pattern (synchronous) based on repository evidence; not confirmed by either Jira issue [INFERENCE].

## Out of scope

- Adding retry jitter (randomized spread) — not requested by either Jira issue.
- A dead-letter queue, alerting, or any UI for permanently failed deliveries.
- Any change to `payments-web` (recommended LOW at G1, not selected).
- PAYMENTS-12210 (webhook signature verification hardening) — linked context only, already shipped separately.

## Adversary round

1
