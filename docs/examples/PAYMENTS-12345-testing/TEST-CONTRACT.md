```yaml
artifact: TEST-CONTRACT.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: RED
producedBy: tester
inputs: [PLAN.md, TEST-REVIEW.md]
```

This is the **round-2 (active)** revision, produced after one automatic correction round (`.github/skills/test-contract/SKILL.md` T11's loop). PLAN.md (round `1.2`) is the only artifact input for construction; `TEST-REVIEW.md`'s round-1 Findings are the immutable input naming what this correction round corrects (T11).

**Representation note** (applies throughout this contract). Per T6 rule 1, a new field is observed through its **persisted representation** — the column — never through a new Java accessor that would not yet exist at the anchor; the Developer owns the field and its Java mapping, the test owns nothing but the column's name. `payments-api`'s tests already autowire a `JdbcTemplate` [REPO]; column names follow the repository's existing snake_case JPA naming convention [REPO]/[INFERENCE]. AC1's scheduled-attempt state — PLAN.md's own Observed at names "the persisted `WebhookDelivery` scheduled-attempt/delay state via the existing repository" — is observed by reading the delivery's row directly (`jdbc.queryForMap("select * from webhook_delivery where id = ?", id)`) and asserting `row.get("next_attempt_at")`; `select *` never names a column that does not yet exist, so pre-implementation the key is simply absent from the returned map and `row.get(...)` returns `null` cleanly, never a SQL error. AC5(ii)/(iii)'s `ledgerReportStatus` field (PLAN.md's Affected files: `WebhookDelivery.java` `EDIT`) is observed the same way, asserting `row.get("ledger_report_status")`. The new `PERMANENTLY_FAILED` status **value** on the existing `DeliveryStatus` enum (`WebhookDelivery.getStatus()`, an existing field) is unaffected by this note and stays observed via `.name()` string comparison against the literal `"PERMANENTLY_FAILED"`, never via a `DeliveryStatus.PERMANENTLY_FAILED` symbol reference, which would not compile at the anchor — T6 rule 1's own example. `payments-ledger`'s new audit fields (`attemptNumber`, `outcome`) are likewise observed through the existing generic jsonb `payload` column (E14/E15), read back as a `JsonNode` and queried by field name.

## Contract map

Doubles declared once and referenced by row: **D1** `FakeClock → FAKE` (injected clock controlling scheduled-delay advancement, `support/FakeClock.java`) · **D2** `MockWebServer → RECORDER`, two instances of the same pre-existing double kind at two different edges — **D2m** at the merchant-endpoint HTTP edge (the repository's existing simulated webhook-delivery target) and **D2l** at the `I1` transport edge (a second instance standing in for `payments-ledger`'s endpoint). `LedgerClient`/`RestLedgerClient` is never doubled anywhere in this contract — the interface does not yet declare a retry-report method at the anchor (E2/E12), so any hand-written double implementing it would fail to compile (T6 rule 1); every test whose production path reports to `payments-ledger` therefore points the real `RestLedgerClient` at the same `D2l` instance, controlling accept/reject through the enqueued response (`200` accepted, `503` rejected — the real adapter's own translation of a non-2xx response is what drives the re-report/`UNREPORTED` path) or, for AC5(ii) alone, through an always-rejecting `503` `Dispatcher` (so every legal report and re-report is rejected however many there are, without the test prescribing their number or order), and, where a clause asserts the report's business content, reading the recorded requests' JSON bodies back. Both `MockWebServer` instances are created and started in the test class's `@BeforeEach` and shut down in `@AfterEach`, so every test method starts with fresh instances — an empty response queue, the default `QueueDispatcher`, and an empty request history — and no enqueued response or installed dispatcher reaches another test. AC1–AC3 enqueue only accepting `200`s at `D2l` and assert nothing about it, since those clauses are indifferent to the report outcome; AC5's rows and both `I1` rows assert `D2l`'s request count, timing, or decoded content directly. No other boundary is doubled; `WebhookRetryService`/`RetryBackoffPolicy` (the new internal collaborators PLAN.md's Approach describes) are never called directly by any test — every `payments-api` test drives the existing `WebhookDeliveryService.attemptDelivery(deliveryId)` entry point (E1), repeating the call and advancing `FakeClock` by the recorded next delay, exactly as a real scheduler would; this keeps every test compiling against symbols that already exist at the anchor.

| Test | Criterion | Level (reason) | Observes | Doubles | Classification (basis) | Expected | Determinism |
|---|---|---|---|---|---|---|---|
| `payments-api`: `WebhookRetryServiceTest.java#retriesWithExponentialBackoffUntilMaxAttempts` | AC1 | SERVICE — a local decision/state-transition outcome (scheduled delay values), sufficient per T3's first row; the persisted `webhook_delivery.next_attempt_at` column, read via the pre-existing `JdbcTemplate` test support, against H2 | After each failed attempt `k` short of `maxAttempts`, the persisted `next_attempt_at` column equals the current `FakeClock` instant plus `baseDelay·2^(k-1)` | D1, D2m, D2l (real `RestLedgerClient`; ledger `MockWebServer` enqueues an accepting `200` per attempt — ordinary input stub, T4 exception 2; this clause asserts nothing about the ledger) | WITNESS | RED | FakeClock |
| `payments-api`: `WebhookRetryServiceTest.java#continuesRetryingBeforeMaxAttemptsReached` | AC2 (boundary value — attempt 4, non-terminal) | SERVICE — same boundary as AC1's row | After attempt 4 fails (one short of `maxAttempts = 5`), the delivery is **not yet** `PERMANENTLY_FAILED` and only 4 requests have reached the merchant endpoint | D1, D2m, D2l (real `RestLedgerClient`; ledger `MockWebServer` enqueues an accepting `200` per attempt — ordinary input stub, T4 exception 2; unasserted) | WITNESS | RED | FakeClock |
| `payments-api`: `WebhookRetryServiceTest.java#stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts` | AC2 (boundary value — attempt `5 = maxAttempts`) | SERVICE — persisted status transition, sufficient per T3's first row | Once attempt `maxAttempts` also fails, the delivery is marked `PERMANENTLY_FAILED`; a controlled subsequent check (`FakeClock` advanced 32s past the largest possible delay, the entry point called once more) confirms no sixth merchant request occurs and no `next_attempt_at` is left pending — never the driver helper's own five-call bound | D1, D2m, D2l (real `RestLedgerClient`; ledger `MockWebServer` enqueues an accepting `200` per attempt — ordinary input stub, T4 exception 2; unasserted) | WITNESS | RED | FakeClock |
| `payments-api`: `WebhookRetryServiceTest.java#stopsRetryingAfterSuccessfulAttempt` | AC3 | SERVICE | Once a retry attempt succeeds, the delivery is marked `DELIVERED`; a controlled subsequent check (`FakeClock` advanced 32s, the entry point called once more) confirms no further merchant request occurs and no `next_attempt_at` is left pending | D1, D2m, D2l (real `RestLedgerClient`; ledger `MockWebServer` enqueues an accepting `200` per attempt — ordinary input stub, T4 exception 2; unasserted) | WITNESS | RED | FakeClock |
| `payments-api`: `WebhookRetryServiceTest.java#reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt` | AC5 (i) | SERVICE — emitted call with business content, `RECORDER` at the `I1` transport edge, exact request content asserted (T3 row 4) | Immediately after attempt 1, exactly one request has reached `payments-ledger`, and its decoded body is this delivery's attempt-1 `FAILURE` report (`(del-9002, 1, FAILURE)` — the one served the `503`); after attempt 2's step, exactly three have reached it in total, and the two not yet drained decode to exactly this delivery's re-report of attempt 1 and its own attempt-2 report (`(del-9002, 1, FAILURE)` and `(del-9002, 2, SUCCESS)`, multiset asserted via `containsExactlyInAnyOrder`), with no ordering imposed between them; every decoded tuple carries `deliveryId`, binding each report to this delivery | D1, D2m, D2l (real `RestLedgerClient`; ledger `MockWebServer` enqueues `[503, 200, 200]` — rejects the first report, accepts the rest; the recorded requests' JSON bodies, decoded as `(deliveryId, attemptNumber, outcome)`, are the business-content evidence) | WITNESS | RED | FakeClock |
| `payments-api`: `WebhookRetryServiceTest.java#marksDeliveryUnreportedWhenLedgerReportBudgetExhausted` | AC5 (ii) | SERVICE — the persisted `webhook_delivery.ledger_report_status` column, read via `JdbcTemplate`, against H2 | In the same always-rejecting-ledger scenario, once the retry budget is exhausted the delivery is independently `PERMANENTLY_FAILED` **and** the persisted `ledger_report_status` column equals `UNREPORTED` (both asserted together in this one test, never delegated to AC2's separate, accepting-ledger scenario); a controlled subsequent check compares `mockLedgerServer.getRequestCount()` before and after the extra call, confirming no further merchant request or ledger request occurs, and no `next_attempt_at` is left pending | D1, D2m (five `503`s for the driven attempts plus one reserved `503` the post-terminal probe consumes only if an incorrect sixth request is made), D2l (real `RestLedgerClient`; ledger `MockWebServer` answers every request `503` through an always-rejecting `Dispatcher` — every report and every legal re-report rejected, however many, and an unexpected post-terminal request answered promptly rather than left waiting) | WITNESS | RED | FakeClock |
| `payments-api`: `WebhookRetryServiceTest.java#marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded` | AC5 (iii) | SERVICE — the persisted `webhook_delivery.ledger_report_status` column, read via `JdbcTemplate`, against H2 | A delivery that reaches `DELIVERED` while its successful attempt's ledger report has been rejected has its persisted `ledger_report_status` column equal to `UNREPORTED`; a controlled subsequent check compares `mockLedgerServer.getRequestCount()` before and after the extra call, confirming no further merchant request or ledger request occurs, and no `next_attempt_at` is left pending | D1, D2m, D2l (real `RestLedgerClient`; ledger `MockWebServer` enqueues a single `503`) | WITNESS | RED | FakeClock |
| `payments-api`: `WebhookRetryServiceTest.java#alreadyDeliveredWebhookIsNeverRetried` | P1 | SERVICE | A delivery already `DELIVERED` is never retried again when next considered | none — real components; no attempt path is exercised, so nothing needs doubling | PRESERVATION (basis 1 — required `P` row) | PASS | none |
| `payments-api`: `WebhookDeliveryStatusControllerTest.java#existingStatusValuesAreReturnedUnchangedForExistingDeliveries` | P3 | API — the existing merchant-facing route, real controller and repository (T3 row 3) | Pre-existing deliveries' existing status values (`PENDING`, `DELIVERED`, `FAILED`) continue to be returned unchanged through the existing endpoint | none | PRESERVATION (basis 1 — required `P` row) | PASS | none |
| `payments-api`: `WebhookRetryServiceTest.java#encodesRetryAttemptReportAtTheTransportEdge` | I1 (consumer adapter evidence) | SERVICE — exercises the real consumer adapter (`RestLedgerClient`) end-to-end from `WebhookDeliveryService`'s attempt path down to the encoded HTTP request; T8 interface evidence, not a domain-object recorder (T8: "a domain-object recorder ... is local business evidence ..., not interface evidence") | A completed attempt's outcome is reported to `payments-ledger` as a POST to `/internal/audit/webhook-retry-attempts` whose JSON body carries `deliveryId`, `attemptNumber`, `outcome`; a successful report leaves the persisted `ledger_report_status` column `null` (trivially true before implementation, since the column does not exist yet — the discrimination case for the negative evidence row below) | D2m (a single merchant `200`), D2l (real `RestLedgerClient`, not doubled; only the remote HTTP endpoint is doubled, and it enqueues a single accepting `200` — configured explicitly, since the mock's default dispatcher waits on an empty queue rather than answering `200`) | WITNESS | RED | none |
| `payments-api`: `WebhookRetryServiceTest.java#retryReportTransportFailureLeavesAttemptUnreported` | I1 (deployment-compatibility / negative evidence) | SERVICE — real consumer adapter exercised end-to-end against a failing transport response (T3 row 4 / T8) | A non-2xx (`503`) response from `payments-ledger`'s endpoint, reached through the real `RestLedgerClient`, results in the retry-report request actually having been made with its business payload, and the delivery's persisted `ledger_report_status` equal to `UNREPORTED` (never a silently success-shaped result); claims only the observed consumer outcome, never the specific `LedgerReportException` translation | D2l (real `RestLedgerClient`, not doubled; only the remote HTTP endpoint is doubled) | WITNESS | RED | none |
| `payments-api`: `WebhookDeliveryServiceTest.java#firstFailedAttemptIsRecordedWithFailureOutcome` (**adopted**, see Pre-existing test conflicts) | — (discretionary preservation, basis 3 — modified boundary named by the Affected files `EDIT` entry on `WebhookDeliveryService.java`, E1) | SERVICE | A delivery's first failed attempt is recorded with outcome `FAILURE`, independent of whatever happens afterward | D2m (pre-existing usage, unchanged by the adoption) | PRESERVATION (basis 3) | PASS | none |
| `payments-ledger`: `WebhookRetryAuditControllerTest.java#recordsRetryAttemptInAuditLog` | AC4 | API — response/persistence contract through the real route with the framework's test client and the real repository against the storage the repository's tests already use (T3 rows 2–3) | A retry attempt reported via `I1` is persisted in `audit_log` with `entity_type = WEBHOOK_DELIVERY`, `entity_id = <delivery id>`, `event_type = WEBHOOK_RETRY_ATTEMPT`, `payload.attemptNumber`, `payload.outcome` | none (round-2, corrected — see Correction rounds; round-1 doubled `AuditLogRepository` with a recorder, superseded) | WITNESS | RED | none |
| `payments-ledger`: — | P2 | n/a | `payments-ledger`'s existing, unrelated `audit_log` write path is unchanged | n/a | `COVERED BY payments-ledger: AuditLogRepositoryTest.java#persistsPaymentCapturedEventPayload` (see Relied-on existing tests) | n/a | n/a |

**Assertion locations** (path:line — the citation every other artifact in this run uses):

| Test | File:line |
|---|---|
| `retriesWithExponentialBackoffUntilMaxAttempts` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:42` |
| `continuesRetryingBeforeMaxAttemptsReached` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:61` |
| `stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:79` |
| `stopsRetryingAfterSuccessfulAttempt` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:96` |
| `reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:114` |
| `marksDeliveryUnreportedWhenLedgerReportBudgetExhausted` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:145` |
| `marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:163` |
| `alreadyDeliveredWebhookIsNeverRetried` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:180` |
| `existingStatusValuesAreReturnedUnchangedForExistingDeliveries` | `payments-api/src/test/java/com/payments/webhook/WebhookDeliveryStatusControllerTest.java:28` |
| `encodesRetryAttemptReportAtTheTransportEdge` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:198` |
| `retryReportTransportFailureLeavesAttemptUnreported` | `payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:224` |
| `firstFailedAttemptIsRecordedWithFailureOutcome` (adopted) | `payments-api/src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java:47` (post-delta line; the diff above under Pre-existing test conflicts shows the pre-delta context at `:40-50`) |
| `recordsRetryAttemptInAuditLog` (round 2) | `payments-ledger/src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java:29` (round 2's first assertion, `assertThat(auditLogRepository.findByEntityTypeAndEntityId("WEBHOOK_DELIVERY", "del-9001")).isPresent()` — this is the line that fails at the anchor in round 2; round 1's own first assertion, at the same relative position, was instead its status check — see Correction rounds and TEST-REVIEW.md's Finding F1) |

## Proves

- `retriesWithExponentialBackoffUntilMaxAttempts` — fails when the persisted `next_attempt_at` column is absent (`null`) after the first failed attempt because no delay is ever computed or scheduled; passes only when, after each failed attempt `k` short of `maxAttempts`, `next_attempt_at` equals the current `FakeClock` instant plus `baseDelay·2^(k-1)`.
- `continuesRetryingBeforeMaxAttemptsReached` — fails when the delivery is already `PERMANENTLY_FAILED` (or a 5th request has already been made) one attempt before the boundary because no interim, non-terminal state exists yet; passes only when, after attempt 4 fails, the delivery is not yet terminal and exactly 4 requests have been made.
- `stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts` — fails when the status is not `PERMANENTLY_FAILED` after attempt `maxAttempts` fails because no retry-exhaustion transition exists; passes only when that exact status is reached and, well past the largest possible delay, calling the entry point again makes no sixth request and leaves no `next_attempt_at` pending.
- `stopsRetryingAfterSuccessfulAttempt` — fails when the delivery does not reach `DELIVERED` after a later attempt succeeds because no retry loop exists to reach that later attempt; passes only when a successful retry attempt terminates the delivery `DELIVERED` and, well past the largest possible delay, calling the entry point again makes no further request and leaves no `next_attempt_at` pending.
- `reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt` — fails when the ledger mock records zero requests after attempt 1 (`expected: 1 but was: 0` before any implementation exists, since nothing reports an attempt today); passes only when exactly one request reaches `payments-ledger` during attempt 1 and decodes to this delivery's attempt-1 `FAILURE` report (`(del-9002, 1, FAILURE)`), exactly three have reached it in total after attempt 2's step, and the two not yet drained decode to exactly this delivery's re-report of attempt 1 and its own attempt-2 report (`(del-9002, 1, FAILURE)` and `(del-9002, 2, SUCCESS)`), with no ordering imposed between them — a re-report carrying another delivery's id, a re-report of the wrong attempt, or a duplicated attempt-2 report each fails the multiset.
- `marksDeliveryUnreportedWhenLedgerReportBudgetExhausted` — fails when the status is not `PERMANENTLY_FAILED` after the retry budget is exhausted because no retry-exhaustion transition exists; passes only when, in the same scenario, that exact status is reached, the persisted `ledger_report_status` column equals `"UNREPORTED"`, and calling the entry point again well past the largest delay makes no further merchant or ledger request.
- `marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded` — fails when the persisted `ledger_report_status` column is `null` instead of `"UNREPORTED"` because no such marking exists (the delivery itself already reaches `DELIVERED` today); passes only when a delivery reaching `DELIVERED` with an unreported attempt has its persisted `ledger_report_status` column set to `"UNREPORTED"`, and calling the entry point again well past the largest delay makes no further merchant or ledger request.
- `alreadyDeliveredWebhookIsNeverRetried` — already passes; continues to pass only while a `DELIVERED` webhook is never reconsidered for another attempt.
- `existingStatusValuesAreReturnedUnchangedForExistingDeliveries` — already passes; continues to pass only while the existing status values returned through the existing endpoint are unchanged for pre-existing deliveries.
- `encodesRetryAttemptReportAtTheTransportEdge` — fails when the ledger mock endpoint records zero requests because nothing today calls `LedgerClient` for a webhook delivery attempt's outcome; passes only when exactly one correctly-encoded POST is recorded per completed attempt; the additional assertion that a successful report leaves `ledger_report_status` `null` is trivially true before implementation and continues to hold after.
- `retryReportTransportFailureLeavesAttemptUnreported` — fails when the ledger mock endpoint records zero requests (`expected: 1 but was: 0`) because nothing today calls `LedgerClient` through the real retry-report path; passes only when the real request reaches the failing endpoint with its business payload and the delivery's persisted `ledger_report_status` is left `UNREPORTED`.
- `firstFailedAttemptIsRecordedWithFailureOutcome` (adopted) — already passes; continues to pass only while a delivery's first failed attempt is recorded with outcome `FAILURE`, independent of whether a further attempt later occurs.
- `recordsRetryAttemptInAuditLog` — fails when the persisted `audit_log` row for the reported attempt is absent because the endpoint and persistence path do not exist yet; passes only when the row is persisted with the exact `entity_type`, `entity_id`, `event_type`, and `payload` fields.

## Protected paths per repository

### `payments-api`

- `src/test/java/com/payments/webhook/WebhookRetryServiceTest.java` (created)
- `src/test/java/com/payments/webhook/WebhookDeliveryStatusControllerTest.java` (created)
- `src/test/java/com/payments/webhook/support/FakeClock.java` (created)
- `src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java` — **adopted at the RED anchor** (stage-5 adoption, see Pre-existing test conflicts); pre-existing file, immutable from the round-1 anchor onward except for the approved delta already applied

### `payments-ledger`

- `src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java` (created)
- `src/test/java/com/payments/ledger/support/AuditLogTestFixtures.java` (created)

## Envelope per repository

### `payments-api`

| File | Proof-relevant | Effect (or its absence) |
|---|---|---|
| `pom.xml` (`payments-api/pom.xml:15-30` inspected — the `<properties>` and `<dependencies>` blocks) | **no** | Inspected content: the `maven.compiler.release` property, the Surefire plugin version, and ordinary library dependency versions only. No property here selects a provider, a storage/profile, a double's semantics, or execution scope — nothing a contract test observes depends on this file's content. |
| `src/test/resources/application-test.yml` (`payments-api/src/test/resources/application-test.yml:1-7`) | **yes** | Two independent effects on the same file: (1) `webhook.retry.max-attempts: 5` and `webhook.retry.base-delay: 1s` (`:3-4`) fix the exact delay sequence `AC1` asserts (`1s,2s,4s,8s`) and the exact attempt number `AC2`'s boundary asserts (`5`); (2) `spring.datasource.url: jdbc:h2:mem:payments-api-test;DB_CLOSE_DELAY=-1` (`:7`) selects the H2 storage engine every `AC1`–`AC5`/`P1`/adopted test reads persisted `WebhookDelivery` state from (T9's storage-selection effect) — changing either the retry properties or the datasource URL changes what these tests observe or which storage they observe it against. |

### `payments-ledger`

| File | Proof-relevant | Effect (or its absence) |
|---|---|---|
| `pom.xml` (`payments-ledger/pom.xml:40-44`) | **yes** | Carries the `io.zonky.test:embedded-database-spring-test` test-scope dependency (lines `40-44`), which enables the auto-configuration that provisions and swaps in the embedded PostgreSQL `AC4`'s test persists into. Removing or replacing it changes which storage engine, if any, the test's persistence assertion exercises — provider/storage selection (T9). |
| `src/test/resources/application-test.yml` (`payments-ledger/src/test/resources/application-test.yml:1-4`) | **yes** | Sets `spring.test.database.replace: none` (`:4`), which disables Spring Boot's own test-datasource replacement (which would otherwise substitute a different in-memory fake ahead of zonky's auto-configuration). This property and the `pom.xml` dependency above are jointly necessary — the dependency alone, without this setting, would still have Spring Boot's own replacement pre-empt it. Without both, `AC4`'s persistence assertion would silently run against a different, non-representative storage engine. |

## Relied-on existing tests

- `payments-ledger`: `src/test/java/com/payments/ledger/AuditLogRepositoryTest.java#persistsPaymentCapturedEventPayload` — covers P2. Observed baseline: **PASS** [TOOL]. Scoped command: `mvn -q -Dtest=AuditLogRepositoryTest#persistsPaymentCapturedEventPayload test`.

Fictional tool output (round 1, unaffected by the round-2 correction, re-confirmed unchanged at round 2):
```text
[INFO] Running com.payments.ledger.AuditLogRepositoryTest#persistsPaymentCapturedEventPayload
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.312 s
```

## Anchor per repository

### `payments-api`

Active anchor: `c1c1c1c1d2d2d2d2e3e3e3e3f4f4f4f4a5a5a5a5` [TOOL] (`git -C payments-api log -1 --format=%H`) — set at round 1 (the stage-5 adoption's RED commit) and **unchanged at round 2** (see Correction rounds — the correction touched only `payments-ledger`).

Staged-set record [TOOL] (`git -C payments-api status --porcelain=v2 --branch`, taken immediately before the round-1 commit — fictional tool output):
```text
# branch.head PAYMENTS-12345-webhook-retry-backoff
1 A. N... 000000 100644 100644 0000000000000000000000000000000000000000 a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1 src/test/java/com/payments/webhook/WebhookRetryServiceTest.java
1 A. N... 000000 100644 100644 0000000000000000000000000000000000000000 b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2 src/test/java/com/payments/webhook/WebhookDeliveryStatusControllerTest.java
1 A. N... 000000 100644 100644 0000000000000000000000000000000000000000 c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3 src/test/java/com/payments/webhook/support/FakeClock.java
1 M. N... 100644 100644 100644 1111111111111111111111111111111111111111 2222222222222222222222222222222222222222 src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java
```
This staged set equals exactly Protected paths per repository above for `payments-api`: three created files (`1 A.`) plus the single approved adopted path (`1 M.`) — no other path.

### `payments-ledger`

Active anchor: `e3e3e3e3f4f4f4f4a5a5a5a5c1c1c1c1d2d2d2d2` [TOOL] (round 2, the correction commit). Round-1 anchor `d2d2d2d2e3e3e3e3f4f4f4f4a5a5a5a5c1c1c1c1` [TOOL] is superseded (see Correction rounds).

Staged-set record, round 1 (superseded), taken immediately before the round-1 commit — fictional tool output:
```text
1 A. N... 000000 100644 100644 0000000000000000000000000000000000000000 e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5 src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java
1 A. N... 000000 100644 100644 0000000000000000000000000000000000000000 f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6 src/test/java/com/payments/ledger/support/AuditLogTestFixtures.java
```

Staged-set record, round 2 (active), taken immediately before the correction commit — fictional tool output:
```text
1 M. N... 100644 100644 100644 5555555555555555555555555555555555555555 6666666666666666666666666666666666666666 src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java
```
This round-2 staged set equals exactly the one file the correction changes (see Correction rounds' transition patch) — the support fixture file is untouched by the correction and does not appear here.

## Contract command per repository

- `payments-api`: `mvn -q -Dtest='WebhookRetryServiceTest,WebhookDeliveryServiceTest,WebhookDeliveryStatusControllerTest' test` (a comma-separated class list in single quotes — the valid Surefire multi-class form; `-Dtest=A+B` is **not** a valid form and is never used). Discovered-identity confirmation (round 2, both runs identical to each other and to round 1 — see RED-REPORT.md): all ten `WebhookRetryServiceTest` methods (`retriesWithExponentialBackoffUntilMaxAttempts`, `continuesRetryingBeforeMaxAttemptsReached`, `stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts`, `stopsRetryingAfterSuccessfulAttempt`, `reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt`, `marksDeliveryUnreportedWhenLedgerReportBudgetExhausted`, `marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded`, `alreadyDeliveredWebhookIsNeverRetried`, `encodesRetryAttemptReportAtTheTransportEdge`, `retryReportTransportFailureLeavesAttemptUnreported`); `WebhookDeliveryServiceTest#firstFailedAttemptIsRecordedWithFailureOutcome` plus that class's other pre-existing methods; and `WebhookDeliveryStatusControllerTest#existingStatusValuesAreReturnedUnchangedForExistingDeliveries` (P3, its own one-method class) — all discovered and executed against the Contract map by this single three-class command. Because a stage-5b correction round re-proves RED for the whole evidence package (T11), Tester re-ran this command twice at round 2 in `payments-api` as well as in `payments-ledger`: `payments-api`'s round-2 results are identical to round 1, since the correction changed only `payments-ledger`.
- `payments-ledger`: `mvn -q -Dtest=WebhookRetryAuditControllerTest test`. Discovered-identity confirmation: `recordsRetryAttemptInAuditLog` discovered and executed against the Contract map, round 1 and both round-2 runs.

## Interface evidence

| Interface | Consumer adapter evidence | Provider decoding evidence | Conformance | Deployment-compatibility evidence |
|---|---|---|---|---|
| `I1` — `payments-ledger` (provider) → `payments-api` (consumer, via `LedgerClient`/`RestLedgerClient`), fields (verbatim, *design check*, from PLAN.md's Dependencies and interfaces): `entity_type = WEBHOOK_DELIVERY`, `entity_id = <delivery id>`, `event_type = WEBHOOK_RETRY_ATTEMPT`, `payload = {attemptNumber, outcome}` | `payments-api`: `WebhookRetryServiceTest.java#encodesRetryAttemptReportAtTheTransportEdge` — exercises the real `RestLedgerClient` against a `MockWebServer` instance standing in for `payments-ledger`'s endpoint (D2l); asserts the encoded JSON body (`deliveryId`, `attemptNumber`, `outcome`) and path (`/internal/audit/webhook-retry-attempts`) | `payments-ledger`: `WebhookRetryAuditControllerTest.java#recordsRetryAttemptInAuditLog` (round-2, corrected) — exercises the real provider entry point with the framework test client, posting the same field shape the consumer test encodes, and asserts the persisted `audit_log` row through the real `AuditLogRepository` against the embedded PostgreSQL | **`ESTABLISHED`** — both sides' evidence exists and agrees field-for-field: consumer encodes `{deliveryId, attemptNumber, outcome}` at `/internal/audit/webhook-retry-attempts`; provider decodes the identical field names at the identical path and persists them into `payload.attemptNumber`/`payload.outcome` | `payments-api`: `WebhookRetryServiceTest.java#retryReportTransportFailureLeavesAttemptUnreported` — drives the real retry-report path through `RestLedgerClient` against a `503` from the mocked `I1` endpoint; asserts the request actually reached the failing endpoint with its business payload and that the consumer outcome is `ledger_report_status = UNREPORTED` (never a silently success-shaped result) — claims only the observed consumer outcome, never the specific `LedgerReportException` translation (WITNESS, RED) |

## Coverage gaps

none — every clause's level executes locally (H2 for `payments-api`, the embedded PostgreSQL for `payments-ledger`, `MockWebServer` at both the merchant and `I1` transport edges); no clause required an environment condition this run could not obtain.

## Pre-existing test conflicts

**File**: `payments-api/src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java`
**Identity**: `failedDeliveryIsMarkedFailedAndNotRetried`
**Clause**: AC1 / AC2
**Prior expectation** (quoted): asserts the delivery's status is `FAILED` after one failed attempt, and that `mockWebServer.getRequestCount()` equals `1` immediately after that first call.

The `FAILED`-terminal expectation directly contradicts the now-approved AC1/AC2 retry behavior (a failed delivery is retried with backoff up to `maxAttempts`, not left `FAILED` after one attempt) and is what triggers this adoption. Constructing the rest of the contract found no other conflict; per T12's Tester-origin route, Tester recorded this conflict here and returned control **before running the contract command or committing** — the evidence package cannot be complete while a conflict is outstanding (see RUN.md's Decision log for the full assessment/approval sequence).

**Approved delta** (as assessed and approved, `ADOPTION`): rename the test to `firstFailedAttemptIsRecordedWithFailureOutcome`; delete the assertion that status is `FAILED` (the obsolete terminal claim that triggers the adoption) and, in retargeting the test to first-attempt recording, also the immediate `mockWebServer.getRequestCount()` equals `1` assertion — that count, taken right after the first call, does not itself contradict backoff (attempt 2 is delayed, never immediate) and never proved that no further attempt would occur; keep the assertion that attempt 1 is recorded with outcome `FAILURE` — a `WebhookDeliveryService`-level invariant on the same modified boundary (E1) that AC1/AC2 do not disturb.

No prior anchor existed at this point in stage 5, so the transition evidence is the **bare** `git -C payments-api diff` output, taken **before any `git add`** in the re-invocation that applied this delta — new files (the four created `payments-api` test/support files) are untracked at this point and do not appear in it, so it shows exactly the adopted delta and nothing else (fictional tool output, verbatim):

```diff
diff --git a/src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java b/src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java
index 1111111..2222222 100644
--- a/src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java
+++ b/src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java
@@ -40,15 +40,13 @@ class WebhookDeliveryServiceTest {
 
     @Test
-    void failedDeliveryIsMarkedFailedAndNotRetried() {
+    void firstFailedAttemptIsRecordedWithFailureOutcome() {
         // Given a delivery fails on its first attempt
         mockWebServer.enqueue(new MockResponse().setResponseCode(503));
         WebhookDelivery delivery = repository.save(pendingDelivery("del-6001"));
 
         webhookDeliveryService.attemptDelivery(delivery.getId());
 
         WebhookDelivery persisted = repository.findById(delivery.getId()).orElseThrow();
-        assertThat(persisted.getStatus()).isEqualTo(DeliveryStatus.FAILED);
         assertThat(persisted.getAttempts()).hasSize(1);
         assertThat(persisted.getAttempts().get(0).getOutcome()).isEqualTo(AttemptOutcome.FAILURE);
-        assertThat(mockWebServer.getRequestCount()).isEqualTo(1);
     }
```

This recorded diff touches only the approved path and contains only the approved delta (a rename plus the deletion of exactly the two superseded assertions) — nothing else changed, so Tester proceeded to commit. The adopted file joined Protected paths at the round-1 RED commit (`c1c1c1c1d2d2d2d2e3e3e3e3f4f4f4f4a5a5a5a5`), which is itself the anchor — the `<prior anchor>..HEAD` transition-patch form applies only from the first amendment onward (T12), and no amendment has occurred in this run.

## Contract self-check

- Every AC/P row from PLAN.md appears in the Contract map at least once (T2): yes — AC1, AC2 (both the boundary and the non-terminal value), AC3, AC4, AC5 (all three combined cases), P1, P2 (`COVERED BY`), P3.
- Doubles limited to the permitted edges, nothing else doubled (T4, contract §6 P3-C2(a)): yes — doubles are limited to the ledger transport edge (`MockWebServer` at `D2l`), the merchant transport edge (`MockWebServer` at `D2m`), and the clock (`FakeClock`); `LedgerClient`/`RestLedgerClient` is never doubled, and the responsible components (`WebhookDeliveryService`, the real repositories, `RestLedgerClient`, `WebhookRetryAuditController`) are real throughout, including in every `AC5` and `I1` row.
- Determinism named wherever a scheduling condition exists (T7): yes — every row asserting a delay or attempt count names `FakeClock`; rows with no timing dependency (P1, P3, AC4, both `I1` rows, the adopted row) record `none`.
- RED proven on two consecutive runs with identical per-test identities and results (T6 rule 6): yes — see RED-REPORT.md's Command per repository and Confirmation.
- Protected paths equal the staged-set record for both repositories (T9): yes — see Anchor per repository above.
- Every envelope entry classified proof-relevant **by effect**, not file type (T9, contract §6 P3-C2(a)): yes — one `no` (`payments-api/pom.xml`) and three `yes` entries, each with the specific property named.
- Interface evidence present for the one `I` row with an honest Conformance value (T8): yes — `ESTABLISHED`, both sides' evidence shown to agree field-for-field.
- Coverage gaps honestly stated (T10): yes — `none`, with the reason.
- Pre-existing test conflicts recorded, not silently resolved or dropped (T12): yes — one entry, the stage-5 Tester-origin adoption, approved delta applied exactly as assessed.
- Relied-on existing test run at stage 5 with its observed baseline and scoped command recorded (T5): yes — `AuditLogRepositoryTest#persistsPaymentCapturedEventPayload`.
- Correction round recorded with the superseded anchor and the transition patch, not merely a `--stat` summary (T12/T11): yes — see Correction rounds.
- Amendments: n/a — none occurred; the one test-change event this run is the stage-5 adoption above, a distinct route from an amendment.

## Correction rounds

**Round 1 → Round 2** (following TEST-REVIEW.md round 1's `REVISE`, finding F1, HIGH):

- Superseded anchor (`payments-ledger`): `d2d2d2d2e3e3e3e3f4f4f4f4a5a5a5a5c1c1c1c1` [TOOL]
- Candidate/active anchor (`payments-ledger`): `e3e3e3e3f4f4f4f4a5a5a5a5c1c1c1c1d2d2d2d2` [TOOL]
- Superseded and active anchor (`payments-api`, **unchanged**): `c1c1c1c1d2d2d2d2e3e3e3e3f4f4f4f4a5a5a5a5` [TOOL]

Transition patch, `payments-ledger` (`git -C payments-ledger diff d2d2d2d2e3e3e3e3f4f4f4f4a5a5a5a5c1c1c1c1..HEAD -- <controlled paths>`, verbatim, fictional tool output):

```diff
diff --git a/src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java b/src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java
index 5555555..6666666 100644
--- a/src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java
+++ b/src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java
@@ -1,5 +1,7 @@
 package com.payments.ledger;
 
+import java.util.Optional;
+
 @SpringBootTest
 @AutoConfigureMockMvc
 class WebhookRetryAuditControllerTest {
@@ -12,5 +14,5 @@ class WebhookRetryAuditControllerTest {
     @Autowired MockMvc mockMvc;
-    @MockBean AuditLogRepository auditLogRepositoryRecorder;
+    @Autowired AuditLogRepository auditLogRepository;
 
     @Test
     void recordsRetryAttemptInAuditLog() throws Exception {
@@ -24,10 +26,13 @@ class WebhookRetryAuditControllerTest {
                 .content(asJson(report)))
             .andReturn();
 
-        assertThat(result.getResponse().getStatus()).isEqualTo(200);
-        verify(auditLogRepositoryRecorder).save(argThat(row ->
-            row.getEntityType().equals("WEBHOOK_DELIVERY")
-                && row.getEntityId().equals("del-9001")
-                && row.getEventType().equals("WEBHOOK_RETRY_ATTEMPT")));
+        assertThat(auditLogRepository.findByEntityTypeAndEntityId("WEBHOOK_DELIVERY", "del-9001")).isPresent();
+        AuditLogRow persisted = auditLogRepository
+            .findByEntityTypeAndEntityId("WEBHOOK_DELIVERY", "del-9001")
+            .orElseThrow();
+        assertThat(persisted.getEventType()).isEqualTo("WEBHOOK_RETRY_ATTEMPT");
+        assertThat(persisted.getPayload().get("attemptNumber").asInt()).isEqualTo(2);
+        assertThat(persisted.getPayload().get("outcome").asText()).isEqualTo("SUCCESS");
+        assertThat(result.getResponse().getStatus()).isEqualTo(200);
     }
 }
```

(`--stat` companion, summary only, never a substitute for the above:)
```text
 src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java | 17 +++++++++++++------
 1 file changed, 11 insertions(+), 6 deletions(-)
```

Transition patch, `payments-api` (`git -C payments-api diff c1c1c1c1d2d2d2d2e3e3e3e3f4f4f4f4a5a5a5a5..HEAD -- <controlled paths>`) — **empty**: the correction touched only `payments-ledger`; `payments-api`'s anchor is unchanged between round 1 and round 2, so this range resolves to no commits and produces no diff.

**What changed** (three hunks, recounted against the shown body — `@@ -1,5 +1,7 @@`, `@@ -12,5 +14,5 @@`, `@@ -24,10 +26,13 @@`, matching the `--stat` totals of 11 insertions/6 deletions above): two things, both required by Finding F1. (1) `recordsRetryAttemptInAuditLog` no longer doubles `AuditLogRepository` with a `@MockBean` recorder; it now injects and asserts against the real, Spring-managed `AuditLogRepository`, persisting into and reading back from the embedded PostgreSQL, per T3's rule that a persisted outcome requires the real repository against the storage the repository's tests already use. (2) The assertions are reordered so the persisted row's presence is checked first (`assertThat(auditLogRepository.findByEntityTypeAndEntityId(...)).isPresent()`), then its fields, with the HTTP status check moved last — the failure locus now targets AC4's own required outcome (a persisted row) rather than an incidental transport detail. `support/AuditLogTestFixtures.java` is unchanged by this correction.

This anchor is **recorded directly as the anchor**, with no activation step: per `tester.agent.md`'s Activation mode Scope paragraph, activation applies only to a candidate anchor committed while a **prior reviewed anchor already exists** (an amendment after stage 5b, or a recovery entry) — it does not apply to the stage-5 RED commit or to a stage-5b correction-round commit, both of which "replace an anchor no review has accepted, and are recorded as the anchor directly." No review had accepted the round-1 anchor (round 1's verdict was `REVISE`), so there is nothing for activation mode to record here.

## Amendments

none — no `TEST-CHANGE-REQUEST` occurred after stage 5; the one test-change event in this run is the stage-5 Tester-origin adoption, recorded above under Pre-existing test conflicts, which is a distinct route (T12) from an amendment and is never recorded here.
