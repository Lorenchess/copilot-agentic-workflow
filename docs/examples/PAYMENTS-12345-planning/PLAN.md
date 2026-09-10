```yaml
artifact: PLAN.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: APPROVED
producedBy: planner
inputs: [INTAKE.md, RUN.md, ADVERSARY-REVIEW.md]
```

## Scope

Retry a failed webhook delivery in `payments-api` using exponential backoff up to a configured maximum number of attempts, per PAYMENTS-12345's Acceptance Criteria field [JIRA], and record every retry attempt (success or failure) in `payments-ledger`'s existing audit log, per PAYMENTS-12351's Acceptance Criteria field [JIRA]. Both repositories were confirmed at G1 (RUN.md, Repositories) [DEV]. This is the round-`1.2` version of this plan; round `1.1` was reviewed and returned REVISE.

**Change class: LARGE.** This change adds an interface between repositories (`I1` below: a new internal `payments-ledger` endpoint that `payments-api` calls to record a retry attempt) and, independently of the interface, carries an audit-trail data-integrity consequence: if a retry attempt's report to `payments-ledger` is silently lost, PAYMENTS-12351's "every ... attempt ... is recorded" requirement [JIRA] is violated without anyone observing it — either condition alone would already warrant `LARGE` per the `plan-grounding` R2 rule [INFERENCE].

## Requested scope disposition

| Key | Disposition | Covering criteria / reason |
|---|---|---|
| `PAYMENTS-12345` (primary) | IMPLEMENTED | AC1, AC2, AC3 |
| `PAYMENTS-12351` | IMPLEMENTED | AC4, AC5 |

### Requirement items

| Id | Source anchor | Obligation | Disposition | Covered by | Note |
|---|---|---|---|---|---|
| R1 | PAYMENTS-12345 Acceptance Criteria field | Retry with exponential backoff up to a configured maximum number of attempts | IMPLEMENTED | AC1 | Shipped `maxAttempts`/`baseDelay` values are not stated in Jira — see Q1 |
| R2 | PAYMENTS-12345 Acceptance Criteria field | Once the maximum is reached, the delivery is marked permanently failed | IMPLEMENTED | AC2 | — |
| R3 | PAYMENTS-12345 Acceptance Criteria field | A retry that succeeds stops further retries | IMPLEMENTED | AC3 | — |
| R4 | PAYMENTS-12351 Acceptance Criteria field | Every webhook retry attempt (success or failure) is recorded in the ledger's audit trail with delivery id, attempt number, and outcome | IMPLEMENTED | AC4, AC5 | AC5 covers the combined outcome where the report call to `payments-ledger` itself fails; its terminal outcome is a `G3`-confirmed product decision — see Q6 |
| D1 | RUN.md Developer context | Keep the retry backoff config in `application.yml`, don't hardcode it | IMPLEMENTED | C1 | — |
| D2 | RUN.md Developer context | Retry attempts write to the existing `audit_log` table, not a new table | IMPLEMENTED | C2 | — |

Every item appears exactly once; none is `EXCLUDED`, `UNRESOLVED`, or `PRESERVED` — this change adds behavior rather than protecting existing behavior at the item level (existing behavior protected by evidence is instead captured under Preservation expectations, P1–P3, below).

## Repository evidence

### `payments-api`

| Id | Type | Location | Statement |
|---|---|---|---|
| E1 | RESPONSIBLE_COMPONENT | `payments-api/src/main/java/com/payments/webhook/WebhookDeliveryService.java:1` | Performs a single outbound delivery attempt today; no retry or backoff logic present [REPO]. |
| E2 | CROSS_REPO_CALL | `payments-api/src/main/java/com/payments/webhook/LedgerClient.java:1` | Existing interface `payments-api` already uses to call `payments-ledger`; no current caller reports a retry attempt [REPO]. |
| E3 | CONFIG | `payments-api/src/main/resources/application.yml` | Existing configuration file; no retry/backoff block present today [REPO]. |
| E4 | PERSISTENCE | `payments-api/src/main/java/com/payments/webhook/WebhookDelivery.java:1` | Existing persisted delivery entity/status; no `ledgerReportStatus` field today [REPO]. |
| E5 | ADJACENT_TEST | `payments-api/src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java:1` | Existing test class covering today's single-attempt delivery success/failure paths [REPO]. |
| E6 | NOT_FOUND | `payments-api/src/main` (searched `retry`, `backoff`, `Scheduler`) | No existing retry/backoff/scheduling logic found by these searches in this scope. Consequence: no existing mechanism to extend for the delay/attempt-count behavior — `WebhookRetryService`/`RetryBackoffPolicy` must be built new; this does not block the approach because the extension point itself (E1) is clearly identified [REPO]/[INFERENCE]. |
| E7 | RESPONSIBLE_COMPONENT | `payments-api/src/main/java/com/payments/webhook/WebhookDeliveryStatusController.java:1` | Existing merchant-facing endpoint that returns the delivery status enum for a given delivery; a consumer of that enum outside this run's own code path. Uncited by round `1.1`; found by the adversary's round-`1.1` consequence-driven check and cited here in round `1.2` [REPO]. |
| E12 | INTERFACE | `payments-api/src/main/java/com/payments/webhook/LedgerClient.java:1` | Its methods declare `throws LedgerReportException` [REPO]. |
| E13 | INTERFACE | `payments-api/src/main/java/com/payments/webhook/RestLedgerClient.java:1` | The existing implementation wraps non-2xx responses and transport failures (`IOException`, timeouts) into `LedgerReportException`; a response is never success-shaped on failure [REPO]. |

Searched: `WebhookDeliveryService`, `WebhookDeliveryStatusController`, `LedgerClient`, `LedgerReportException`, `RestLedgerClient`, `WebhookDelivery`, `application.yml`, "retry", "backoff", "Scheduler" [REPO]/[INFERENCE].

### `payments-ledger`

| Id | Type | Location | Statement |
|---|---|---|---|
| E8 | RESPONSIBLE_COMPONENT | `payments-ledger/src/main/java/com/payments/ledger/AuditLogRepository.java:1` | Existing repository writing to the `audit_log` table; no method for recording a webhook retry attempt today [REPO]. |
| E9 | PERSISTENCE | `payments-ledger` `audit_log` table (via `AuditLogRepository`) | Existing table; per the developer's explicit instruction (D2), retry attempts must write here, not to a new table [REPO]/[DEV]. |
| E10 | ADJACENT_TEST | `payments-ledger/src/test/java/com/payments/ledger/AuditLogRepositoryTest.java:1` | Existing test class covering today's `audit_log` write path [REPO]. |
| E11 | NOT_FOUND | `payments-ledger/src/main` (searched `WebhookRetryAuditController`, `retry`, `webhook`) | No existing endpoint for recording a webhook retry attempt found by these searches in this scope. Consequence: a new endpoint is required (see `I1`); there is no existing behavior at this boundary to preserve [REPO]/[INFERENCE]. |
| E14 | PERSISTENCE | `payments-ledger/src/main/resources/db/migration/V12__audit_log.sql:1` | Existing `audit_log` columns: `id`, `entity_type`, `entity_id`, `event_type`, `payload` (jsonb), `recorded_at` [REPO]. |
| E15 | RESPONSIBLE_COMPONENT | `payments-ledger/src/main/java/com/payments/ledger/AuditLogRepository.java:1` | An existing write already stores a typed event with structured fields in `payload` (e.g. `PAYMENT_CAPTURED` with amount and currency) [REPO]. |

Searched: `AuditLogRepository`, `audit_log`, `WebhookRetryAuditController`, `V12__audit_log`, "retry", "webhook" [REPO]/[INFERENCE].

## Approach per repository

### `payments-api`

Extend the existing outbound delivery path (E1) so a failed delivery is retried with exponential backoff instead of failing once and stopping. Add a `WebhookRetryService` that `WebhookDeliveryService` calls on a retryable failure; the delay for the next attempt is computed by a new `RetryBackoffPolicy` (`baseDelay * 2^(attempt-1)`), up to a configured maximum attempt count read from `application.yml` (E3), per implementation constraint **C1** — keep the retry backoff configuration in `application.yml` rather than hardcoding it [DEV] (D1). `WebhookRetryService` marks the delivery `PERMANENTLY_FAILED` once attempt number `maxAttempts` has also failed (Q1's total-including-first convention), or `DELIVERED` once a retry succeeds (E4). On each attempt it reports the outcome to `payments-ledger` through the existing `LedgerClient` (E2); the report call's failure is signaled by a thrown `LedgerReportException` (E12, E13), never a silently success-shaped response, so per AC5, if that report call fails, the unreported attempt is re-reported alongside the delivery's next scheduled attempt, and whenever the delivery becomes terminal with an attempt still unreported, `WebhookDelivery.ledgerReportStatus` (new field, E4) is persisted `UNREPORTED`.

The delivery status enum this change adds a new value to (`PERMANENTLY_FAILED`) is already exposed to merchants through the existing `WebhookDeliveryStatusController` (E7) — a consumer round `1.1` did not cite. Round `1.2` resolves the resulting compatibility question explicitly as **Q3** (Decisions and open questions, below) rather than leaving the new status's exposure undecided.

### `payments-ledger`

Add a new internal endpoint (`WebhookRetryAuditController`, backed by `AuditLogRepository`, E8) that records a reported retry attempt into the existing `audit_log` table (E9), per implementation constraint **C2** — write to the existing `audit_log` table, not a new one [DEV] (D2). AC4's recording writes `entity_type = WEBHOOK_DELIVERY`, `entity_id = <delivery id>`, `event_type = WEBHOOK_RETRY_ATTEMPT`, `payload = {attemptNumber, outcome}` into the existing `audit_log` columns (E14); no schema change is needed — the existing table already carries a typed event with structured `payload` fields for other event types (E15). No change is required here for AC5's retry-on-failure behavior — that retry is driven entirely from the `payments-api` side calling this same endpoint again.

## Dependencies and interfaces

| Id | Provider | Consumer | Contract | Failure behavior | Deployment compatibility | Implementation order | Owner / prerequisite |
|---|---|---|---|---|---|---|---|
| I1 | `payments-ledger` | `payments-api` (via `LedgerClient`, E2) | New internal endpoint recording a retry attempt (delivery id, attempt number, outcome; field level, no code) into the existing `audit_log` table: `entity_type = WEBHOOK_DELIVERY`, `entity_id = delivery id`, `event_type = WEBHOOK_RETRY_ATTEMPT`, `payload = {attemptNumber, outcome}` — no schema change (E14, E15) | Consumer treats a non-2xx response or the provider being unavailable as a report failure (signaled by `LedgerReportException`, E12, E13), entering the AC5 re-report/`UNREPORTED` path (never as delivery failure) | `payments-ledger` should be deployed before `payments-api` enables retry reporting; `payments-api` tolerates the endpoint's absence via AC5's `UNREPORTED` marking and may ship first, but every report attempted before the endpoint exists is persisted `UNREPORTED` until `payments-ledger` is live | Either order is implementable against this stated contract (`payments-ledger`'s endpoint first, or both in parallel) — deployment order, not implementation order, is what matters (see Deployment compatibility) | This run (both repositories confirmed at G1) |

## Affected files

| Path | Repository | Change type | Reason (AC/P/I/Q/C) | Confidence | Evidence |
|---|---|---|---|---|---|
| `payments-api/src/main/java/com/payments/webhook/WebhookRetryService.java` | `payments-api` | NEW | AC1, AC2, AC3, AC5, Q6 | HIGH — package cited by E1 | E1 |
| `payments-api/src/main/java/com/payments/webhook/RetryBackoffPolicy.java` | `payments-api` | NEW | AC1 | HIGH — package cited by E1 | E1 |
| `payments-api/src/main/java/com/payments/webhook/WebhookDeliveryService.java` | `payments-api` | EDIT | AC1 | HIGH | E1 |
| `payments-api/src/main/resources/application.yml` | `payments-api` | CONFIG | C1, Q1 | HIGH | E3 |
| `payments-api/src/main/java/com/payments/webhook/WebhookDelivery.java` | `payments-api` | EDIT | AC2, AC3, AC5, Q3, Q6 | HIGH | E4 |
| `payments-ledger/src/main/java/com/payments/ledger/WebhookRetryAuditController.java` | `payments-ledger` | NEW | AC4, I1 | HIGH — package cited by E8 | E8 |
| `payments-ledger/src/main/java/com/payments/ledger/AuditLogRepository.java` | `payments-ledger` | EDIT | AC4, C2 | HIGH | E8 |

### Investigation notes (non-operative — not consulted by the verifier)

- Where the merchant-facing response mapping/serialization for the delivery status enum is implemented, beyond `WebhookDeliveryStatusController`'s entry point itself — see E7, Q3.

## Acceptance criteria

**AC1 (`payments-api`).** Given a webhook delivery fails with a retryable error and the delivery has not yet reached the configured maximum number of attempts, When the retry is scheduled, Then the next attempt's delay follows exponential backoff (`baseDelay * 2^(attempt-1)`) up to the configured maximum number of attempts.
Source class: JIRA (PAYMENTS-12345 Acceptance Criteria field). Observed at: the persisted `WebhookDelivery` scheduled-attempt/delay state via the existing repository (E4). Preconditions: a webhook delivery has failed with a retryable error and has not yet reached the configured maximum. Path: POSITIVE.

**AC2 (`payments-api`).** Given a webhook delivery has failed on every attempt before the configured maximum and its next attempt is the configured maximum (attempt number `maxAttempts`), When that final attempt also fails, Then no further retry is scheduled and the delivery is marked `PERMANENTLY_FAILED`.
Source class: JIRA (PAYMENTS-12345 Acceptance Criteria field). Observed at: the persisted `WebhookDelivery` status field via the existing repository (E4). Preconditions: attempt number `maxAttempts` is the one being made; all earlier attempts failed. Path: NEGATIVE.

**AC3 (`payments-api`).** Given a webhook delivery succeeds on a retry attempt, When the successful response is received, Then no further retries are scheduled and the delivery is marked `DELIVERED`.
Source class: JIRA (PAYMENTS-12345 Acceptance Criteria field). Observed at: the persisted `WebhookDelivery` status field via the existing repository (E4). Preconditions: a retry attempt succeeds. Path: POSITIVE.

**AC4 (`payments-ledger`).** Given a webhook retry attempt completes, When `payments-api` reports it via `I1`, Then `payments-ledger` records it in the audit log with delivery id, attempt number, outcome.
Source class: JIRA (PAYMENTS-12351 Acceptance Criteria field). Observed at: the existing `audit_log` row via `AuditLogRepository` (E8, E9). Preconditions: `payments-api` calls the new endpoint with a completed attempt's outcome. Path: POSITIVE.

**AC5 (`payments-api`).** Given the report call to `payments-ledger` (`I1`) fails, When the delivery's next scheduled attempt runs, Then the unreported attempt is re-reported alongside it, bounded by the delivery's configured max-attempts budget; and Given the delivery becomes terminal (`DELIVERED` or `PERMANENTLY_FAILED`) while an attempt remains unreported — whether because the configured max-attempts budget is exhausted or because delivery succeeded before it — When that terminal status is persisted, Then the delivery is also persisted with `ledgerReportStatus = UNREPORTED` and no further report is attempted.
Source class: PROPOSED (cites Q6 — R4's "every attempt ... is recorded" obligation [JIRA] entails that a gap must not be silent, but it does not by itself entail *this* terminal outcome: retrying the report indefinitely, blocking the delivery's terminal state on a successful report, alerting/dead-lettering, or reconciling later are all live alternatives Jira/DEV do not rule out, so the specific choice is a product decision routed `G3` as Q6, not an entailment). Observed at: the existing `LedgerClient` call, which signals report failure via `LedgerReportException` (E2, E12) and the persisted `WebhookDelivery.ledgerReportStatus` via the existing repository (E4). Preconditions: the report call to `payments-ledger` has failed at least once for a given attempt. Path: NEGATIVE.

**Combined outcomes.** Two cases where a terminal delivery outcome coincides with a still-unreported ledger attempt — (i) the delivery reaches `DELIVERED` before the attempt is reported, and (ii) the delivery reaches `PERMANENTLY_FAILED` with the max-attempts budget for reporting also exhausted — are both required behavior, not edge cases left implicit; AC5 states both explicitly, as a PROPOSED decision (Q6), and requires the same `ledgerReportStatus = UNREPORTED` outcome for either. A third combination — the report call to `payments-ledger` succeeds but persisting the delivery's own terminal state then fails — is not a distinct acceptance criterion; see Risks (trigger E4, `ACCEPTED`).

### Preservation expectations

**P1.** Given a webhook delivery already marked `DELIVERED`, When the delivery is next considered by any scheduled or triggered retry check, Then it is never retried again. Evidence: E1, E4 [REPO].

**P2.** Given `payments-ledger`'s existing, unrelated `audit_log` write path (any write not originating from the new `I1` endpoint), When this change is deployed, Then that existing write path's behavior is unchanged. Evidence: E8, E9 [REPO].

**P3.** Given an existing webhook delivery whose status predates this change, When a merchant queries it through the existing `WebhookDeliveryStatusController` endpoint, Then the existing status values it already returns continue to be returned unchanged for that delivery. Evidence: E7 [REPO]. Arises from the round-`1.1` finding that this consumer was uncited (see Response to adversary findings, below).

## Risks

- **RK1** — trigger E6/AC1: no existing injectable clock/scheduler was found for `payments-api`'s time-delayed operations; backoff-delay assertions will need a deterministic time source. Treatment: `ACCEPTED` (test-level scaffolding decision; owned by Phase 3 test design, out of this plan's scope) [INFERENCE].
- **RK2** — trigger Q1/AC1: the backoff formula as stated has no jitter; many webhooks failing at the same time would retry in lockstep against the same downstream endpoint. Treatment: `ACCEPTED` (not requested by either Jira issue) [INFERENCE].
- **RK3** — trigger I1/E6: a persistently unreachable `payments-ledger` could otherwise stall webhook delivery indefinitely if the ledger-report retry were unbounded. Treatment: covered by AC5 (Q6) — bounded to the delivery's own configured max-attempts budget; explicit terminal `UNREPORTED` outcome, never an indefinite retry.
- **RK4** — trigger E6/Q1: no default base delay or maximum attempt count is stated in either Jira issue. Treatment: covered by Q1 (routed `G3`).
- **RK5** — trigger E4, category data-integrity: the report call to `payments-ledger` succeeds but persisting the delivery's own terminal-state write then fails, leaving payments-ledger's audit record and payments-api's own delivery status inconsistent. Treatment: `ACCEPTED` (payments-api's existing single local persistence call for a delivery's status is assumed atomic for that write, consistent with E4; a genuine split between an external report succeeding and a local write failing is an existing operational risk not unique to this change, not modeled as a separate acceptance criterion) [INFERENCE].

## Decisions and open questions

| Id | Statement | Routing | Planner recommendation | Basis | Consequence if wrong | Surfaced at |
|---|---|---|---|---|---|---|
| Q1 | Shipped defaults for `maxAttempts` and `baseDelay` are not stated in either Jira issue (INTAKE.md, Unknowns). | G3 | `maxAttempts = 5` total attempts, including the first; `baseDelay = 1` second (backoff delays before attempts 2–5: 1s, 2s, 4s, 8s). | INTAKE.md Unknowns; R6 shipped-value rule (inventing a value is `G3`); AC2's terminal transition fires on the failure of attempt `maxAttempts`, never a further attempt. | Too few attempts (e.g. 3) abandons deliveries that would have recovered by attempt 5; too many or too-long delays (e.g. `baseDelay = 10s`) unacceptably lengthens merchant-visible delivery latency and audit-trail completion time. | G3 |
| Q2 | Whether the report to `payments-ledger` (`I1`) is synchronous within the retry step or asynchronous. | G3 (re-routed from `ASSUMED` in round `1.1`; see Response to adversary findings) | Synchronous within the retry step, matching the existing `LedgerClient` usage pattern (E2). | E2; adversary round-`1.1` finding F2. | If actually asynchronous, AC5's re-report/`UNREPORTED` behavior cannot detect a report failure synchronously — a delivery could reach a terminal state before an async report's failure is even known, and the ordering between the report and the delivery's terminal-state persistence (E4) becomes non-deterministic. | G3 |
| Q3 | Whether the new `PERMANENTLY_FAILED` status value and the new `ledgerReportStatus` field are exposed through the existing merchant-facing `WebhookDeliveryStatusController` (E7). | G3 (changes a contract consumed outside this run's code path — merchants) | Expose the new `PERMANENTLY_FAILED` status value; do **not** expose `ledgerReportStatus`. | E7; adversary round-`1.1` finding F1. | If `PERMANENTLY_FAILED` is not exposed, merchants see a delivery stuck in an ambiguous or unchanged status with no signal that retries have stopped. If `ledgerReportStatus` is exposed, an internal audit-trail bookkeeping detail becomes an externally consumed contract field that must then be preserved indefinitely. | G3 |
| Q6 | Terminal outcome when a delivery becomes terminal with a retry attempt still unreported to `payments-ledger` (AC5). | G3 | Persist `WebhookDelivery.ledgerReportStatus = UNREPORTED`; attempt no further report; reconciliation/alerting on `UNREPORTED` deliveries is left out of scope. | R4 (every attempt must be recorded, so the gap must not be silent); I1's failure behavior; RK3. | The live alternatives this recommendation is chosen over: retrying the report indefinitely would stall the delivery's own terminal state on an unreachable `payments-ledger`; alerting or dead-lettering is unrequested scope (see Out of scope); silently dropping the gap violates R4's "every attempt ... is recorded" [JIRA]. | G3 |

## Out of scope

- Adding retry jitter (randomized spread) — not requested by either Jira issue; see RK2.
- A dead-letter queue, alerting, or any UI for permanently failed deliveries.
- Any change to `payments-web` (recommended LOW at G1, not selected).
- PAYMENTS-12210 (webhook signature verification hardening) — linked context only, already shipped separately.
- Test level, test doubles, and RED mechanics for AC1–AC5 and P1–P3 — Phase 3 scope per the contract's Boundary (§1), not this plan's.
- A schema change to `audit_log` — not needed: E14/E15 show the existing columns carry the required fields.

## Decision summary

**Intended outcomes.** Failed webhook deliveries to merchant endpoints are automatically retried with exponential backoff instead of failing permanently on the first error (AC1); retries stop once the configured maximum number of attempts has all failed and the delivery is marked permanently failed (AC2); a successful retry stops further attempts (AC3). Every retry attempt — successful or not — is recorded in `payments-ledger`'s existing audit trail with the delivery id, attempt number, and outcome (AC4); if that audit-trail report itself cannot be delivered, it is re-attempted alongside the delivery's own retries and, if the delivery still finishes without a successful report, an explicit, queryable marker is left rather than silently losing the record (AC5).

**Material choices.**
- Q1 — shipped `maxAttempts`/`baseDelay` defaults: recommended `maxAttempts = 5` (total, including the first), `baseDelay = 1s`; if wrong, deliveries are abandoned too early or delivery latency grows unacceptably.
- Q2 — synchronous vs. asynchronous ledger reporting: recommended synchronous; if wrong, AC5's re-report/`UNREPORTED` behavior cannot rely on synchronous failure detection and report-versus-persist ordering becomes non-deterministic.
- Q3 — exposure of `PERMANENTLY_FAILED`/`ledgerReportStatus` through the existing status endpoint: recommended expose the status, not the field; if wrong, merchants either get no signal retries have stopped, or gain a dependency on an internal bookkeeping field.
- Q6 — terminal outcome for a delivery that becomes terminal with an attempt still unreported to `payments-ledger`: recommended persist `ledgerReportStatus = UNREPORTED` and attempt no further report (no indefinite retry, no alerting/dead-lettering); if wrong, either the delivery's terminal state is indefinitely blocked on an unreachable ledger, or the audit-trail gap goes unrecorded.

**Exclusions and unresolved scope.** None — both requested keys are fully `IMPLEMENTED`; no item is `EXCLUDED` or `UNRESOLVED`.

**Consequential assumptions.** None — round `1.2` replaced the two candidate assumptions with repository evidence (E12–E13 for the `LedgerClient` failure contract; E14–E15 for the `audit_log` column capability).

**Accepted risks.** RK1 (test-timing scaffolding, deferred to Phase 3), RK2 (lockstep retries without jitter), RK5 (report-succeeds-but-persist-fails data-integrity edge).

**Cross-repository prerequisites.** I1 — `payments-ledger`'s new retry-attempt-recording endpoint should be deployed before `payments-api` enables retry reporting; `payments-api` tolerates the endpoint's absence via AC5's `UNREPORTED` marking and may ship first, but reports made before `payments-ledger` is live remain `UNREPORTED` until it is.

## Adversary round

1.2

## Response to adversary findings

| Finding (round 1.1) | Response |
|---|---|
| F1 (HIGH — backward-compatibility / plan-to-repository mismatch: the consequence-driven check found the uncited `WebhookDeliveryStatusController` consumer of the delivery status enum; round `1.1` added `PERMANENTLY_FAILED` without stating exposure/compatibility) | ACCEPTED — added Repository evidence row E7, Decisions and open questions row Q3, and Preservation expectations row P3. |
| F2 (HIGH — unsupported/misrouted assumption: round `1.1` routed synchronous-vs-asynchronous ledger reporting as `ASSUMED`, reasoning "AC5 would catch it if wrong") | ACCEPTED — re-routed as **Q2** (`G3`); the R6 rule that a row is never `ASSUMED` because future RED/verification "would catch it" applies directly. |
| F3 (MEDIUM — Q1 lacked units and counting semantics) | ACCEPTED — Q1 now states `maxAttempts = 5` total attempts including the first, `baseDelay = 1` second, with a concrete consequence-if-wrong. |
| F4 (HIGH — unsupported/misrouted assumptions: round `1.1` routed the `LedgerClient` failure contract and the `audit_log` column capability as `ASSUMED` with no evidence row) | ACCEPTED — added Repository evidence rows E12–E15 (E12/E13: `LedgerClient`/`RestLedgerClient` failure contract; E14/E15: `audit_log` schema and its existing structured-payload write pattern); Q4/Q5 withdrawn as assumptions — the underlying facts are now evidence, not routed decisions. |

Round `1.1`'s own text is not reproduced here; RUN.md's Artifact history records it SUPERSEDED.
