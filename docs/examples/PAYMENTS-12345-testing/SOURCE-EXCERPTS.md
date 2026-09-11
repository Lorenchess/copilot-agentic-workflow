# Source excerpts (fictional, illustrative)

This file is **illustrative documentation only** — it is not itself an artifact of the fictional run (it carries no YAML header and is not listed as an `inputs:` entry anywhere), and no other artifact in this directory cites it as an evidentiary source. `TEST-CONTRACT.md`, `RED-REPORT.md`, and `TEST-REVIEW.md` each cite the fictional test source's own `path:line` directly (see TEST-CONTRACT.md's "Assertion locations" table); this file exists only to let a reader assess the policy without a full checkout, by showing the Java/YAML content those citations point at. Every class name, method name, field name, identifier, and value below is invented for illustration and matches the identities used in `TEST-CONTRACT.md`, `RED-REPORT.md`, and `TEST-REVIEW.md` exactly; no command was run and no file shown here actually exists on any filesystem. Line ranges are approximate (a method's exact position in a hypothetical file is not load-bearing); the cited assertion line for each method, however, is the same number `TEST-CONTRACT.md`'s Assertion locations table and `RED-REPORT.md`'s Failure locus use.

## (a) `FakeClock` — clock control

`payments-api/src/test/java/com/payments/webhook/support/FakeClock.java` — fictional, illustrative:

```java
package com.payments.webhook.support;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

public final class FakeClock extends Clock {

    private Instant now;

    public FakeClock(Instant start) {
        this.now = start;
    }

    @Override
    public Instant instant() {
        return now;
    }

    @Override
    public ZoneId getZone() {
        return ZoneOffset.UTC;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return this; // single fixed zone is sufficient for this contract
    }

    public void advanceBy(Duration duration) {
        now = now.plus(duration);
    }
}
```

## (b) AC1's arrangement and assertion — `retriesWithExponentialBackoffUntilMaxAttempts`

`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:33-53` (approximate — the method spans this range; TEST-CONTRACT.md cites the assertion at `:42`) — fictional, illustrative:

```java
    @Test
    void retriesWithExponentialBackoffUntilMaxAttempts() {
        // Given a webhook delivery whose first attempt fails with a retryable error;
        // every ledger report is accepted (this clause asserts nothing about the ledger)
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(503));
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(503));
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(503));
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(503));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        WebhookDelivery delivery = repository.save(pendingDelivery("del-8001"));

        // When each attempt k (short of maxAttempts) fails, the persisted row's
        // next_attempt_at should equal the current FakeClock instant plus baseDelay*2^(k-1)
        for (int k = 1; k <= 4; k++) {
            webhookDeliveryService.attemptDelivery(delivery.getId());

            Map<String, Object> row = jdbc.queryForMap(
                "select * from webhook_delivery where id = ?", delivery.getId());
            Duration expectedDelay = Duration.ofSeconds((long) Math.pow(2, k - 1));
            assertThat(row.get("next_attempt_at"))
                .isEqualTo(Timestamp.from(fakeClock.instant().plus(expectedDelay)));

            fakeClock.advanceBy(expectedDelay);
        }
    }
```

`select *` never names a column that does not yet exist, so before implementation `row.get("next_attempt_at")` simply returns `null` — the assertion at `k = 1` fails there and the loop never reaches `k = 2..4`. The test drives the existing `webhookDeliveryService.attemptDelivery(deliveryId)` entry point directly (E1) — it never calls `WebhookRetryService`/`RetryBackoffPolicy` (PLAN.md's Approach names these as new internal collaborators of `WebhookDeliveryService`, never called directly by a test); this keeps the test compiling against symbols that already exist at the anchor (skill T6 rule 1). `jdbc` is the pre-existing `JdbcTemplate` test support `payments-api`'s tests already autowire [REPO]. `RestLedgerClient` is real here too, as it is throughout this contract (`LedgerClient` declares no retry-report method at the anchor, so no double of it could compile — T6 rule 1); the four enqueued `503` responses arm exactly the four failing attempts the loop drives, and the four accepting `200`s at the dedicated ledger `MockWebServer` let each attempt's real ledger call complete without blocking, since this clause asserts nothing about the ledger.

## (c) AC2's boundary assertion — `stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts`

`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:70-99` (approximate — assertion at `:79`) — fictional, illustrative:

```java
    @Test
    void stopsRetryingAndMarksPermanentlyFailedAtMaxAttempts() {
        // Given every attempt up to and including attempt 5 (maxAttempts) fails at the
        // merchant endpoint; every ledger report is accepted (this clause asserts
        // nothing about the ledger)
        for (int i = 0; i < 5; i++) {
            mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(503));
            mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        }
        WebhookDelivery delivery = repository.save(pendingDelivery("del-8002"));

        driveAttemptsUntilTerminalOrExhausted(delivery.getId(), fakeClock, 5);

        // Then the delivery is marked PERMANENTLY_FAILED
        WebhookDelivery persisted = repository.findById(delivery.getId()).orElseThrow();
        assertThat(persisted.getStatus().name()).isEqualTo("PERMANENTLY_FAILED");
        assertThat(mockMerchantEndpoint.getRequestCount()).isEqualTo(5);

        // And, well past the largest possible delay (8s), calling the entry point again
        // — the same entry point a real scheduler would use, not the driver helper above —
        // schedules no further work: no sixth request, and nothing left pending
        fakeClock.advanceBy(Duration.ofSeconds(32));
        webhookDeliveryService.attemptDelivery(delivery.getId());

        assertThat(mockMerchantEndpoint.getRequestCount()).isEqualTo(5);
        Map<String, Object> row = jdbc.queryForMap(
            "select * from webhook_delivery where id = ?", delivery.getId());
        assertThat(row.get("next_attempt_at")).isNull();
    }
```

The status is compared via `.name()` against the string literal `"PERMANENTLY_FAILED"` rather than against a `DeliveryStatus.PERMANENTLY_FAILED` enum constant, because that constant does not exist on the existing `DeliveryStatus` enum at the anchor — referencing it directly would not compile (skill T6 rule 1's "cannot resolve symbol is never RED"). The `driveAttemptsUntilTerminalOrExhausted` helper's own five-call bound is a test-driver convenience, not evidence of production stopping — that evidence is the controlled subsequent check: `FakeClock` advanced 32 seconds (past the largest possible delay, `8s`) and the existing entry point called once more, then asserting no sixth request and no pending `next_attempt_at`. The RED failure locus is the `PERMANENTLY_FAILED` assertion (observed `"FAILED"`, since the pre-existing terminal value is reached after only the first attempt); every assertion after it, including the whole controlled subsequent check, is unreached pre-implementation.

## (d) AC3's assertion — `stopsRetryingAfterSuccessfulAttempt`

`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:88-112` (approximate — assertion at `:96`) — fictional, illustrative:

```java
    @Test
    void stopsRetryingAfterSuccessfulAttempt() {
        // Given attempt 1 fails and attempt 2 succeeds at the merchant endpoint; every
        // ledger report is accepted (this clause asserts nothing about the ledger)
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(503));
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        WebhookDelivery delivery = repository.save(pendingDelivery("del-8004"));

        webhookDeliveryService.attemptDelivery(delivery.getId());
        fakeClock.advanceBy(Duration.ofSeconds(1));
        webhookDeliveryService.attemptDelivery(delivery.getId());

        // Then the delivery is marked DELIVERED
        WebhookDelivery persisted = repository.findById(delivery.getId()).orElseThrow();
        assertThat(persisted.getStatus().name()).isEqualTo("DELIVERED");

        // And, well past the largest possible delay, calling the entry point again
        // schedules no further work
        fakeClock.advanceBy(Duration.ofSeconds(32));
        webhookDeliveryService.attemptDelivery(delivery.getId());

        assertThat(mockMerchantEndpoint.getRequestCount()).isEqualTo(2);
        Map<String, Object> row = jdbc.queryForMap(
            "select * from webhook_delivery where id = ?", delivery.getId());
        assertThat(row.get("next_attempt_at")).isNull();
    }
```

The RED failure locus is the `"DELIVERED"` assertion (observed `"FAILED"`, since no retry mechanism exists to reach the second, successful attempt); the request-count and `next_attempt_at` assertions of the controlled subsequent check are unreached pre-implementation.

## (e) AC5(i)'s exact-request assertion — `reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt`

`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:103-135` (approximate — assertion at `:114`) — fictional, illustrative:

```java
    @Test
    void reReportsUnreportedLedgerAttemptOnNextDeliveryAttempt() throws Exception {
        // Given attempt 1 fails at the merchant endpoint and its ledger report is
        // rejected (503); attempt 2 succeeds at the merchant endpoint, and both its
        // own report and the re-report of attempt 1 are accepted (200, 200)
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(503));
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(503));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        WebhookDelivery delivery = repository.save(pendingDelivery("del-9002"));

        webhookDeliveryService.attemptDelivery(delivery.getId());

        // Then, during attempt 1 alone, exactly one request reached payments-ledger, and
        // it is this delivery's own attempt-1 FAILURE report (necessarily the one served
        // the 503: MockWebServer serves enqueued responses in strict order of arrival)
        assertThat(mockLedgerServer.getRequestCount()).isEqualTo(1);
        assertThat(reportTuple(mockLedgerServer.takeRequest(0, TimeUnit.MILLISECONDS)))
            .isEqualTo(tuple("del-9002", 1, "FAILURE"));

        fakeClock.advanceBy(Duration.ofSeconds(1));
        webhookDeliveryService.attemptDelivery(delivery.getId());

        // Then, after attempt 2's step, exactly three requests have reached
        // payments-ledger in total; the two not yet drained are this delivery's
        // re-report of attempt 1 and its own attempt-2 report, with no ordering
        // imposed between them
        assertThat(mockLedgerServer.getRequestCount()).isEqualTo(3);
        List<Tuple> reported = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            reported.add(reportTuple(mockLedgerServer.takeRequest(0, TimeUnit.MILLISECONDS)));
        }
        assertThat(reported).containsExactlyInAnyOrder(
            tuple("del-9002", 1, "FAILURE"),
            tuple("del-9002", 2, "SUCCESS"));
    }
```

`reportTuple` is a private helper declared once, at the end of the same test class (`:241-246`, after the last test method, so it shifts no cited line above it) — fictional, illustrative:

```java
    private Tuple reportTuple(RecordedRequest request) throws JsonProcessingException {
        JsonNode body = objectMapper.readTree(request.getBody().readUtf8());
        return tuple(body.get("deliveryId").asText(),
            body.get("attemptNumber").asInt(),
            body.get("outcome").asText());
    }
```

The helper propagates `ObjectMapper.readTree(String)`'s checked `JsonProcessingException` rather than swallowing it, and every calling test method declares `throws Exception` (covering both that and `takeRequest`'s `InterruptedException`), so the helper's checked exception is never left unhandled. The request-count assertion after attempt 1 is deliberately first and is a plain AssertJ comparison, so the RED failure at the anchor is a clean `org.opentest4j.AssertionFailedError` (`expected: 1 but was: 0`), never a blocked read. `takeRequest(0, TimeUnit.MILLISECONDS)` is the non-blocking form — it returns immediately from the already-received queue rather than waiting, so, once each count assertion has passed, draining the requests never hangs. Every decoded tuple carries the delivery id, so each recorded report is bound to *this* delivery: the step-1 check establishes that the single request received during attempt 1 is `del-9002`'s attempt-1 `FAILURE` report (not merely that one request of some content arrived), and the step-2 multiset — over exactly the two requests not consumed in step 1, while the count of three is asserted cumulatively — rejects a re-report carrying another delivery's id, a re-report of the wrong attempt, and a duplicated attempt-2 report, while accepting either order of the two step-2 reports. `RestLedgerClient` is real throughout — `LedgerClient` is never doubled, since the interface declares no retry-report method at the anchor and any hand double of it would fail to compile (T6 rule 1); the dedicated ledger `MockWebServer` instance (D2l) is both the accept/reject control (via its enqueued responses) and the recorder (via its received requests).

## (f) AC5(ii)'s combined assertion — `marksDeliveryUnreportedWhenLedgerReportBudgetExhausted`

`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:122-164` (approximate — assertion at `:145`) — fictional, illustrative:

```java
    @Test
    void marksDeliveryUnreportedWhenLedgerReportBudgetExhausted() {
        // Given every attempt up to and including attempt 5 (maxAttempts) fails at the
        // merchant endpoint, and every ledger report is rejected (503)
        for (int i = 0; i < 5; i++) {
            mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(503));
        }
        // One more merchant response, reserved for the post-terminal probe below: a
        // correct implementation never consumes it; an incorrect sixth request is
        // answered and counted rather than waiting on an empty merchant queue
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(503));
        // Every ledger report — each attempt's own and every re-report, however many
        // the implementation legally makes — is rejected: a dispatcher, not a finite
        // queue, so no legal report ever waits on an empty response queue, and an
        // unexpected post-terminal request is answered and counted rather than blocking
        mockLedgerServer.setDispatcher(new Dispatcher() {
            @Override
            public MockResponse dispatch(RecordedRequest request) {
                return new MockResponse().setResponseCode(503);
            }
        });
        WebhookDelivery delivery = repository.save(pendingDelivery("del-9003"));

        driveAttemptsUntilTerminalOrExhausted(delivery.getId(), fakeClock, 5);

        // Then, in the same scenario, the delivery is PERMANENTLY_FAILED and the
        // unreported attempt is marked — asserted together, never delegated to a
        // separate, accepting-ledger scenario
        WebhookDelivery persisted = repository.findById(delivery.getId()).orElseThrow();
        assertThat(persisted.getStatus().name()).isEqualTo("PERMANENTLY_FAILED");

        Map<String, Object> row = jdbc.queryForMap(
            "select * from webhook_delivery where id = ?", delivery.getId());
        assertThat(row.get("ledger_report_status")).isEqualTo("UNREPORTED");

        // And, well past the largest possible delay, calling the entry point again
        // schedules no further work and makes no further ledger request
        int ledgerRequestsBefore = mockLedgerServer.getRequestCount();
        fakeClock.advanceBy(Duration.ofSeconds(32));
        webhookDeliveryService.attemptDelivery(delivery.getId());

        assertThat(mockMerchantEndpoint.getRequestCount()).isEqualTo(5);
        Map<String, Object> rowAfter = jdbc.queryForMap(
            "select * from webhook_delivery where id = ?", delivery.getId());
        assertThat(rowAfter.get("next_attempt_at")).isNull();
        assertThat(mockLedgerServer.getRequestCount()).isEqualTo(ledgerRequestsBefore);
    }
```

The assertion order matters: `PERMANENTLY_FAILED` is checked first, in the same always-rejecting-ledger scenario, so an implementation that persists the status but leaves a further ledger request scheduled — or one that marks `UNREPORTED` without ever transitioning the delivery to `PERMANENTLY_FAILED` — now fails here directly, rather than relying on a separate, accepting-ledger test to confirm the status half. The RED failure locus is the `PERMANENTLY_FAILED` assertion (observed `"FAILED"`); the `ledger_report_status` assertion and the whole controlled subsequent check are unreached pre-implementation. `ledgerRequestsBefore` captures the ledger mock's request count before the extra call so "no further request" is asserted directly, without hard-coding an expected count.

The response fixture is deliberately not a finite queue on the ledger side. AC5 requires each failed report to be re-reported alongside later attempts, so a conforming implementation makes more ledger requests than the five new-attempt reports — how many more depends on the Developer's legal re-report choice, which this test must not prescribe. A queue of exactly five `503`s would leave the sixth legal request waiting on `MockWebServer`'s empty response queue (its default `QueueDispatcher` blocks on an empty queue unless a fail-fast response is set) rather than receiving the advertised rejection; the always-`503` `Dispatcher` answers every ledger request however many there are, and answers an unexpected post-terminal ledger request promptly, so the final unchanged-count comparison is reached and fails cleanly instead of hanging. The reserved sixth merchant response does the same job for the probe's merchant side: a correct implementation never consumes it (the count assertion stays `5`), while an incorrect sixth request is answered and counted rather than waiting on an empty merchant queue. **Fixture isolation**: both `MockWebServer` instances (`mockMerchantEndpoint`, D2m, and `mockLedgerServer`, D2l) are created and started in the class's `@BeforeEach` and shut down in `@AfterEach`, so every test method begins with fresh instances — an empty response queue, the default `QueueDispatcher`, and an empty request history. The dispatcher installed here therefore never reaches any other test; in particular it cannot leak into (i) below, whose claimed successful response depends on its own explicitly enqueued `200`.

## (g) AC5(iii)'s representation-based assertion — `marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded`

`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:152-182` (approximate — assertion at `:163`) — fictional, illustrative:

```java
    @Test
    void marksDeliveryUnreportedWhenDeliverySucceedsBeforeReportIsRecorded() {
        // Given the only attempt succeeds at the merchant endpoint but its ledger
        // report is rejected (503)
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(503));
        WebhookDelivery delivery = repository.save(pendingDelivery("del-9004"));

        webhookDeliveryService.attemptDelivery(delivery.getId());

        // Then the delivery is DELIVERED, and the unreported attempt is marked through
        // the persisted row's ledger_report_status column (the column itself is new)
        WebhookDelivery persisted = repository.findById(delivery.getId()).orElseThrow();
        assertThat(persisted.getStatus().name()).isEqualTo("DELIVERED");

        Map<String, Object> row = jdbc.queryForMap(
            "select * from webhook_delivery where id = ?", delivery.getId());
        assertThat(row.get("ledger_report_status")).isEqualTo("UNREPORTED");

        // And, well past the largest possible delay, calling the entry point again
        // schedules no further work and makes no further ledger request
        int ledgerRequestsBefore = mockLedgerServer.getRequestCount();
        fakeClock.advanceBy(Duration.ofSeconds(32));
        webhookDeliveryService.attemptDelivery(delivery.getId());

        assertThat(mockMerchantEndpoint.getRequestCount()).isEqualTo(1);
        Map<String, Object> rowAfter = jdbc.queryForMap(
            "select * from webhook_delivery where id = ?", delivery.getId());
        assertThat(rowAfter.get("next_attempt_at")).isNull();
        assertThat(mockLedgerServer.getRequestCount()).isEqualTo(ledgerRequestsBefore);
    }
```

The delivery's own `status` field is existing, so `persisted.getStatus().name()` is a direct accessor call (no new symbol involved) and this first assertion already **passes** before implementation — a successful single attempt already reaches `DELIVERED` today (E1). `ledger_report_status` is a genuinely new column PLAN.md's Affected files lists as an `EDIT` to `WebhookDelivery.java`; before the Developer adds the corresponding Java field, `select *` via the pre-existing `jdbc` (`JdbcTemplate`, autowired in the same test class [REPO]) never names it, so `row.get("ledger_report_status")` returns `null` cleanly — no SQL error, no new Java symbol referenced (skill T6 rule 1). The RED failure locus is therefore this second assertion; the controlled subsequent check that follows is unreached pre-implementation.

## (h) The AC4 test — corrected (round 2) and superseded (round 1)

`payments-api/src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java:16-40` — **round 2 (active)**, fictional, illustrative:

```java
package com.payments.ledger;

import java.util.Optional;

@SpringBootTest
@AutoConfigureMockMvc
class WebhookRetryAuditControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired AuditLogRepository auditLogRepository;

    @Test
    void recordsRetryAttemptInAuditLog() throws Exception {
        // Given a completed retry attempt reported via I1
        RetryAttemptReport report = new RetryAttemptReport("del-9001", 2, "SUCCESS");

        MvcResult result = mockMvc.perform(post("/internal/audit/webhook-retry-attempts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(asJson(report)))
            .andReturn();

        // Then the attempt is persisted through the real repository into the embedded PostgreSQL —
        // the row's presence is checked first (AC4's own required outcome), fields next, the
        // HTTP status last (an incidental transport detail, not the clause itself)
        assertThat(auditLogRepository.findByEntityTypeAndEntityId("WEBHOOK_DELIVERY", "del-9001")).isPresent();
        AuditLogRow persisted = auditLogRepository
            .findByEntityTypeAndEntityId("WEBHOOK_DELIVERY", "del-9001")
            .orElseThrow();
        assertThat(persisted.getEventType()).isEqualTo("WEBHOOK_RETRY_ATTEMPT");
        assertThat(persisted.getPayload().get("attemptNumber").asInt()).isEqualTo(2);
        assertThat(persisted.getPayload().get("outcome").asText()).isEqualTo("SUCCESS");
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
    }
}
```

**Superseded round-1 version** (TEST-REVIEW.md round 1, Finding F1, HIGH — doubled `AuditLogRepository` with a recorder instead of asserting through the real repository) — reproduced here only for contrast, not as current evidence:

```java
    @Autowired MockMvc mockMvc;
    @MockBean AuditLogRepository auditLogRepositoryRecorder;

    @Test
    void recordsRetryAttemptInAuditLog() throws Exception {
        RetryAttemptReport report = new RetryAttemptReport("del-9001", 2, "SUCCESS");

        MvcResult result = mockMvc.perform(post("/internal/audit/webhook-retry-attempts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(asJson(report)))
            .andReturn();

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        verify(auditLogRepositoryRecorder).save(argThat(row ->
            row.getEntityType().equals("WEBHOOK_DELIVERY")
                && row.getEntityId().equals("del-9001")
                && row.getEventType().equals("WEBHOOK_RETRY_ATTEMPT")));
    }
```

The two versions fail at **different** lines. Round 1's first assertion is its status check, so round 1 fails there (`expected: 200 but was: 404`) and the recorder's own line is never reached. Round 2's first assertion is the persisted row's presence, so round 2 fails there instead (`Expecting Optional to contain a value but it was empty`) — its status check, now last, is never reached either. The correction is therefore two things at once: swapping the recorder for the real repository, **and** reordering the assertions so the clause's own required outcome (a persisted row) is what the test actually targets first. With the round-1 ordering and double together, an implementation that calls `.save(row)` only on the mocked bean — never touching the real `AuditLogRepository` or the embedded PostgreSQL — would make this test pass once the endpoint exists, while `AC4`'s persisted outcome remained unproven (TEST-REVIEW.md's Finding F1).

## (i) `I1` consumer-adapter test — `encodesRetryAttemptReportAtTheTransportEdge`

`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:187-211` (approximate — assertion at `:198`) — fictional, illustrative:

```java
    @Test
    void encodesRetryAttemptReportAtTheTransportEdge() throws Exception {
        // Given the only attempt succeeds at the merchant endpoint and payments-ledger accepts
        // its report (200); LedgerClient/RestLedgerClient is real — only the endpoint is doubled (D2l)
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(200));
        WebhookDelivery delivery = repository.save(pendingDelivery("del-9005"));

        webhookDeliveryService.attemptDelivery(delivery.getId());

        // Then payments-ledger's mocked endpoint received exactly one correctly-encoded POST
        assertThat(mockLedgerServer.getRequestCount()).isEqualTo(1);
        RecordedRequest request = mockLedgerServer.takeRequest();
        assertThat(request.getPath()).isEqualTo("/internal/audit/webhook-retry-attempts");
        JsonNode body = objectMapper.readTree(request.getBody().readUtf8());
        assertThat(body.get("deliveryId").asText()).isEqualTo("del-9005");
        assertThat(body.get("attemptNumber").asInt()).isEqualTo(1);
        assertThat(body.get("outcome").asText()).isEqualTo("SUCCESS");

        // And a successful report must not leave a false outstanding-report marker
        Map<String, Object> row = jdbc.queryForMap(
            "select * from webhook_delivery where id = ?", delivery.getId());
        assertThat(row.get("ledger_report_status")).isNull();
    }
```

The request-count assertion is deliberately first: it is a plain AssertJ comparison (`0` vs `1`) rather than a blocking `takeRequest()` call, so the RED failure at the anchor is a clean `org.opentest4j.AssertionFailedError`, never a `NullPointerException` from an unfulfilled blocking read. The ledger's accepting `200` is enqueued explicitly: `MockWebServer`'s default `QueueDispatcher` does not return `200` on its own — it waits on an empty response queue — so without this line a correct implementation's synchronous report would block, and the claimed successful-response outcome could never be demonstrated. Pre-implementation the queued `200` is simply never consumed (no request is made), so RED is unaffected. The final assertion is trivially true before any implementation exists (`select *` never names the not-yet-existing `ledger_report_status` column), and it continues to hold after implementation because a successful report must never leave the delivery looking like it still has an outstanding report — the discrimination case for (j) below.

## (j) `I1` negative / deployment-compatibility evidence — `retryReportTransportFailureLeavesAttemptUnreported`

`payments-api/src/test/java/com/payments/webhook/WebhookRetryServiceTest.java:215-239` (approximate — assertion at `:224`) — fictional, illustrative:

```java
    @Test
    void retryReportTransportFailureLeavesAttemptUnreported() throws Exception {
        // Given the only attempt succeeds at the merchant endpoint; RestLedgerClient is
        // real — only the remote payments-ledger endpoint is doubled (D2l) — and that
        // endpoint responds with a transport failure (503) to the retry-report request
        mockMerchantEndpoint.enqueue(new MockResponse().setResponseCode(200));
        mockLedgerServer.enqueue(new MockResponse().setResponseCode(503));
        WebhookDelivery delivery = repository.save(pendingDelivery("del-9006"));

        webhookDeliveryService.attemptDelivery(delivery.getId());

        // Then the real retry-report request reached the failing endpoint with its
        // business payload — a plain AssertJ comparison, so the RED failure at the
        // anchor is a clean AssertionFailedError, never a blocked takeRequest() call
        assertThat(mockLedgerServer.getRequestCount()).isEqualTo(1);
        RecordedRequest request = mockLedgerServer.takeRequest();
        assertThat(request.getPath()).isEqualTo("/internal/audit/webhook-retry-attempts");
        JsonNode body = objectMapper.readTree(request.getBody().readUtf8());
        assertThat(body.get("deliveryId").asText()).isEqualTo("del-9006");
        assertThat(body.get("attemptNumber").asInt()).isEqualTo(1);
        assertThat(body.get("outcome").asText()).isEqualTo("SUCCESS");

        // And the consumer outcome is UNREPORTED — the delivery itself still reaches
        // DELIVERED; this claims only the observed consumer outcome, never the specific
        // LedgerReportException translation, which this path does not observe directly
        Map<String, Object> row = jdbc.queryForMap(
            "select * from webhook_delivery where id = ?", delivery.getId());
        assertThat(row.get("ledger_report_status")).isEqualTo("UNREPORTED");
        WebhookDelivery persisted = repository.findById(delivery.getId()).orElseThrow();
        assertThat(persisted.getStatus().name()).isEqualTo("DELIVERED");
    }
```

The RED failure locus is `assertThat(mockLedgerServer.getRequestCount()).isEqualTo(1)` (`expected: 1 but was: 0`, since nothing today calls `LedgerClient` for a retry attempt at all); the request-body, `ledger_report_status`, and `DELIVERED` assertions are unreached pre-implementation. This test drives the real retry-report call through the real `RestLedgerClient` against a `503` from the dedicated ledger `MockWebServer` (D2l) — the same real adapter (i) exercises for the successful case — so a retry-report branch that silently swallows the non-2xx response (never calling the ledger at all, or catching and discarding the failure) would leave `ledger_report_status` unset (`null`), failing this test's own final assertion. The test claims only the externally observed consumer outcome (`ledger_report_status = UNREPORTED` after a real `503`) — it does not claim to observe the `LedgerReportException` type itself, since this path does not inspect it directly.

**Discrimination from successful reporting**: (i) above, exercising the identical real adapter against an explicitly enqueued `200`, asserts a successful report leaves `ledger_report_status` `null` — an implementation that always marks `UNREPORTED` regardless of the ledger's response would fail (i)'s final assertion even though it might pass this test. Both responses are configured, so the contrast rests on two real, configured ledger outcomes, not on an assumed default.

## (k) `I1` provider-decoding assertion (field-level detail)

The provider-decoding evidence for `I1` is the same round-2 `recordsRetryAttemptInAuditLog` test shown in full under (h); the specific field-decoding assertions TEST-CONTRACT.md's Interface evidence table cites are these three lines (`payments-ledger/src/test/java/com/payments/ledger/WebhookRetryAuditControllerTest.java:32-34`):

```java
        assertThat(persisted.getEventType()).isEqualTo("WEBHOOK_RETRY_ATTEMPT");
        assertThat(persisted.getPayload().get("attemptNumber").asInt()).isEqualTo(2);
        assertThat(persisted.getPayload().get("outcome").asText()).isEqualTo("SUCCESS");
```

These decode the identical field names — `attemptNumber`, `outcome` — that (i)'s consumer-adapter test encodes at the identical path, which is what makes `Conformance: ESTABLISHED` honest rather than a field-list-only `DESIGN_CHECK_ONLY` (skill T8).

## (l) The adopted pre-existing test — before and after

`payments-api/src/test/java/com/payments/webhook/WebhookDeliveryServiceTest.java:40-51`, **before** (the prior, contradicted expectation) — fictional, illustrative:

```java
    @Test
    void failedDeliveryIsMarkedFailedAndNotRetried() {
        // Given a delivery fails on its first attempt
        mockWebServer.enqueue(new MockResponse().setResponseCode(503));
        WebhookDelivery delivery = repository.save(pendingDelivery("del-6001"));

        webhookDeliveryService.attemptDelivery(delivery.getId());

        WebhookDelivery persisted = repository.findById(delivery.getId()).orElseThrow();
        assertThat(persisted.getStatus()).isEqualTo(DeliveryStatus.FAILED);
        assertThat(persisted.getAttempts()).hasSize(1);
        assertThat(persisted.getAttempts().get(0).getOutcome()).isEqualTo(AttemptOutcome.FAILURE);
        assertThat(mockWebServer.getRequestCount()).isEqualTo(1);
    }
```

**After** the approved delta (`:40-49`, matching the diff under TEST-CONTRACT.md's Pre-existing test conflicts exactly):

```java
    @Test
    void firstFailedAttemptIsRecordedWithFailureOutcome() {
        // Given a delivery fails on its first attempt
        mockWebServer.enqueue(new MockResponse().setResponseCode(503));
        WebhookDelivery delivery = repository.save(pendingDelivery("del-6001"));

        webhookDeliveryService.attemptDelivery(delivery.getId());

        WebhookDelivery persisted = repository.findById(delivery.getId()).orElseThrow();
        assertThat(persisted.getAttempts()).hasSize(1);
        assertThat(persisted.getAttempts().get(0).getOutcome()).isEqualTo(AttemptOutcome.FAILURE);
    }
```

Two assertions are deleted. The `FAILED`-terminal assertion (`assertThat(persisted.getStatus()).isEqualTo(DeliveryStatus.FAILED)`) is what triggers the adoption: the now-approved AC1/AC2 retry behavior makes that terminal expectation obsolete — a failed first attempt is no longer terminal. The already-approved delta also removes the immediate `mockWebServer.getRequestCount()).isEqualTo(1)` assertion when retargeting the test to first-attempt recording. That count, taken right after the first call, does not itself contradict backoff (attempt 2 is delayed, never immediate) and never proved that no further attempt would occur; it is removed as part of the retargeting, not because it conflicts with the criteria. The surviving assertion (attempt 1 recorded with outcome `FAILURE`) is a `WebhookDeliveryService`-level invariant on the same modified boundary (E1) that AC1/AC2 do not disturb.

## (m) `application-test.yml` / `pom.xml` fragments justifying the proof-relevance marks

`payments-api/src/test/resources/application-test.yml` (full file, 7 lines) — fictional, illustrative:

```yaml
webhook:
  retry:
    max-attempts: 5
    base-delay: 1s
spring:
  datasource:
    url: jdbc:h2:mem:payments-api-test;DB_CLOSE_DELAY=-1
```

Lines `3-4` fix the exact values `AC1`'s delay sequence and `AC2`'s boundary attempt number assert; line `7` selects the H2 storage engine every persisted-state assertion in this contract reads from — both are proof-relevant by effect (T9).

`payments-api/pom.xml:15-30` (fragment, **not** proof-relevant) — fictional, illustrative:

```xml
    <properties>
        <maven.compiler.release>17</maven.compiler.release>
        <surefire.version>3.2.5</surefire.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.squareup.okhttp3</groupId>
            <artifactId>mockwebserver</artifactId>
            <version>4.12.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
```

No property here selects a provider, a storage/profile, a double's semantics, or execution scope; the versions pinned are ordinary dependency-management content.

`payments-ledger/pom.xml:40-44` (fragment, proof-relevant) — fictional, illustrative:

```xml
        <dependency>
            <groupId>io.zonky.test</groupId>
            <artifactId>embedded-database-spring-test</artifactId>
            <scope>test</scope>
        </dependency>
```

`payments-ledger/src/test/resources/application-test.yml` (full file, 4 lines) — fictional, illustrative:

```yaml
spring:
  test:
    database:
      replace: none
```

Line `4` (`spring.test.database.replace: none`) and the `pom.xml` dependency above are jointly necessary: the dependency alone, without this setting, would still have Spring Boot's own test-datasource replacement pre-empt zonky's embedded PostgreSQL.
