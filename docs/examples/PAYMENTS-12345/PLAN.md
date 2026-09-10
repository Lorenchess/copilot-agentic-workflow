```yaml
artifact: PLAN.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: APPROVED
producedBy: planner
inputs: [INTAKE.md, RUN.md, ADVERSARY-REVIEW.md]
```

## Scope

Retry a failed webhook delivery in `payments-api` using exponential backoff up to a configured maximum number of attempts, per PAYMENTS-12345's Acceptance Criteria field [JIRA], and record every retry attempt (success or failure) in `payments-ledger`'s existing audit log, per PAYMENTS-12351's Acceptance Criteria field [JIRA], including re-reporting a failed ledger-report call on the delivery's next attempt within its own retry budget, with an explicit terminal outcome if that budget is exhausted before the attempt is reported (resolved in round 2, see Requested scope disposition below). Both repositories were confirmed at G1 (RUN.md, Repositories) [DEV]. This is the round-2 version of this plan; round 1 was reviewed and returned REVISE.

## Requested scope disposition

| Key | Disposition | Covering criteria / reason |
|---|---|---|
| `PAYMENTS-12345` (primary) | IMPLEMENTED | AC1, AC2, AC3 |
| `PAYMENTS-12351` | IMPLEMENTED | AC4, AC5 |

Round 1 of this plan covered the same two keys with the same disposition (both IMPLEMENTED), but round 1's AC4 stated only that a retry attempt "is recorded" in the ledger, with no stated outcome for a failure of that recording call. ADVERSARY-REVIEW.md's round-1 verdict was REVISE on exactly that gap: a best-effort/non-blocking treatment of the ledger call (as round 1's Risks section implied) would let the audit trail silently lose records, contradicting PAYMENTS-12351's Acceptance Criteria field ("every webhook retry attempt ... is recorded"). This round-2 plan resolves it explicitly with new AC5 below: an explicit, testable terminal outcome — a persisted `ledgerReportStatus = UNREPORTED` marker — for the case where the ledger-report call keeps failing until the delivery's own retry budget is exhausted, marked PROPOSED and requiring G3 confirmation. Round 1's own text is not reproduced here; RUN.md's Artifact history records it as SUPERSEDED.

## Approach per repository

### `payments-api`

Extend the existing outbound webhook delivery path so a failed delivery is retried with exponential backoff instead of failing once and stopping. `WebhookDeliveryService` (`payments-api/src/main/java/com/payments/webhook/WebhookDeliveryService.java`) currently performs a single delivery attempt with no retry logic [REPO]. Add a `WebhookRetryService` that `WebhookDeliveryService` calls on a retryable failure; the delay for the next attempt is computed by a small new `RetryBackoffPolicy` class that `WebhookRetryService` calls (`baseDelay * 2^(attempt-1)`; for example, with `baseDelay=1s` the scheduled delay sequence is `[1s, 2s, 4s]`), up to a configured maximum attempt count read from `application.yml`, per the developer's instruction to keep the retry backoff config in `application.yml` rather than hardcoding it [DEV], and `WebhookRetryService` marks the delivery `PERMANENTLY_FAILED` once the maximum is exceeded, or `DELIVERED` once a retry succeeds. On each attempt (success or failure) it reports the outcome to `payments-ledger` through the existing `LedgerClient` interface, already present in `payments-api` [REPO]; per AC5 (round 2), if that call itself fails, `WebhookRetryService` re-reports the unreported attempt alongside the delivery's next scheduled attempt, bounded by the delivery's configured max-attempts budget, and if that budget is exhausted while an attempt remains unreported, marks the delivery's `ledgerReportStatus = UNREPORTED` (new field on `WebhookDelivery`) at the same time it is marked `PERMANENTLY_FAILED` or `DELIVERED`, rather than retrying indefinitely.

### `payments-ledger`

Add an internal endpoint that records a reported webhook retry attempt into the existing `audit_log` table via `AuditLogRepository` (`payments-ledger/src/main/java/com/payments/ledger/AuditLogRepository.java`) [REPO], per the developer's explicit instruction that retry attempts write to the existing `audit_log` table, not a new table [DEV]. No change is required here for AC5's retry-on-failure behavior — that retry is driven entirely from the `payments-api` side calling the same endpoint again.

## Affected files

- `payments-api/src/main/java/com/payments/webhook/WebhookRetryService.java` (new) [INFERENCE]
- `payments-api/src/main/java/com/payments/webhook/RetryBackoffPolicy.java` (new) [INFERENCE]
- `payments-api/src/main/java/com/payments/webhook/WebhookDeliveryService.java` (edited: invoke retry on failure) [REPO]
- `payments-api/src/main/resources/application.yml` (edited: add retry configuration block) [DEV]
- `payments-api/src/main/java/com/payments/webhook/WebhookDelivery.java` (edited: add `ledgerReportStatus`) [REPO]
- `payments-ledger/src/main/java/com/payments/ledger/WebhookRetryAuditController.java` (new) [INFERENCE]
- `payments-ledger/src/main/java/com/payments/ledger/AuditLogRepository.java` (edited: add a method to record a webhook retry attempt) [REPO]

## Acceptance criteria

**AC1 (`payments-api`).** Given a webhook delivery fails with a retryable error, When the retry is scheduled, Then the next attempt's delay follows exponential backoff (`baseDelay * 2^(attempt-1)`; e.g., with `baseDelay=1s` the scheduled delay sequence is `[1s, 2s, 4s]`) up to the configured maximum number of attempts.
Source class: JIRA (PAYMENTS-12345 Acceptance Criteria field).

**AC2 (`payments-api`).** Given a webhook delivery has already failed the configured maximum number of attempts, When another failure occurs, Then no further retry is scheduled and the delivery is marked `PERMANENTLY_FAILED`.
Source class: JIRA (PAYMENTS-12345 Acceptance Criteria field).

**AC3 (`payments-api`).** Given a webhook delivery succeeds on a retry attempt, When the successful response is received, Then no further retries are scheduled and the delivery is marked `DELIVERED`.
Source class: JIRA (PAYMENTS-12345 Acceptance Criteria field).

**AC4 (`payments-ledger`).** Given a webhook retry attempt completes, When `payments-api` reports it, Then `payments-ledger` records it in the audit log with delivery id, attempt number, outcome.
Source class: JIRA (PAYMENTS-12351 Acceptance Criteria field).

**AC5 (`payments-api`).** Given the report call to `payments-ledger` fails, When the delivery's next scheduled attempt runs, Then the unreported attempt is re-reported alongside it, bounded by the delivery's configured max-attempts budget; and given that budget is exhausted while an attempt remains unreported, When the delivery is marked `PERMANENTLY_FAILED` or `DELIVERED`, Then the delivery is also persisted with `ledgerReportStatus = UNREPORTED` and no further report is attempted.
Source class: PROPOSED (product decision proposed by the planner in round 2 to resolve ADVERSARY-REVIEW.md's round-1 REVISE finding; requires explicit G3 confirmation — confirmed, see RUN.md Gates log G3). This is the accepted terminal outcome: the gap is recorded locally in `payments-api` and observable, never silent.

## Risks

- Backoff calculation must use an injectable clock/scheduler in tests, or acceptance tests become timing-flaky [INFERENCE].
- AC5's retry-on-failure decision means a persistently unreachable `payments-ledger` could otherwise stall webhook delivery indefinitely if the ledger retry were unbounded; this plan bounds the ledger-recording retry to the delivery's own configured max-attempts budget and states the terminal outcome explicitly: once that budget is exhausted with an attempt still unreported, the delivery is persisted with `ledgerReportStatus = UNREPORTED` rather than retried further [INFERENCE].
- No default base delay or maximum attempt count is stated in either Jira issue (INTAKE.md, Unknowns) [INFERENCE]; this plan treats them as configuration values (see `application.yml`, per developer context) rather than hardcoding a guess. The `[1s, 2s, 4s]` sequence above is an illustrative example only, not a value taken from Jira.

## Open questions

- Should the call from `payments-api` to `payments-ledger` be synchronous (blocking the retry loop) or fire-and-forget? This plan assumes the existing `LedgerClient` pattern (synchronous) based on repository evidence, now reinforced by AC5's retry-on-failure requirement (a fire-and-forget call could not be retried); not confirmed by either Jira issue [INFERENCE].

## Out of scope

- Adding retry jitter (randomized spread) — not requested by either Jira issue.
- A dead-letter queue, alerting, or any UI for permanently failed deliveries.
- Any change to `payments-web` (recommended LOW at G1, not selected).
- PAYMENTS-12210 (webhook signature verification hardening) — linked context only, already shipped separately.

## Adversary round

2
