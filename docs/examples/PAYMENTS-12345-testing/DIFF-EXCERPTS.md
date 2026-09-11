# Diff excerpts (fictional, illustrative)

This file is **illustrative documentation only** — it is not itself an artifact of the fictional run (it carries no YAML header and is not listed as an `inputs:` entry anywhere), and no other artifact in this directory cites it as an evidentiary source beyond a pointer. `IMPLEMENTATION.md` and `VERIFICATION.md` each cite the fictional production diff's own `path:line`, and point here (`DIFF-EXCERPTS.md §<n>`) for the hunk itself, so a reader can see the actual code without a full checkout. This is **not a full implementation** — only the hunks the run's story needs are shown, focused and kept short, styled like `SOURCE-EXCERPTS.md`. Every class name, method name, field name, identifier, and value below matches the identities used in `PLAN.md`, `TEST-CONTRACT.md`, `RED-REPORT.md`, and `SOURCE-EXCERPTS.md` exactly. No command was run and no file shown here actually exists on any filesystem; line numbers and hunk ranges are illustrative and approximate, consistent with `SOURCE-EXCERPTS.md`'s own note — the cited fix-scope path is what is load-bearing, not the exact line.

## §1 — Round 1 (wrong): `RetryBackoffPolicy.java` (new) and the `application.yml` hunk

`payments-api/src/main/java/com/payments/webhook/RetryBackoffPolicy.java` — **round-1 commit** (new file), fictional tool output:

```diff
diff --git a/src/main/java/com/payments/webhook/RetryBackoffPolicy.java b/src/main/java/com/payments/webhook/RetryBackoffPolicy.java
new file mode 100644
index 0000000..1a2b3c4
--- /dev/null
+++ b/src/main/java/com/payments/webhook/RetryBackoffPolicy.java
@@ -0,0 +1,21 @@
+package com.payments.webhook;
+
+import java.time.Duration;
+import org.springframework.beans.factory.annotation.Value;
+import org.springframework.stereotype.Component;
+
+@Component
+public class RetryBackoffPolicy {
+
+    private static final Duration BASE_DELAY = Duration.ofSeconds(1);
+
+    private final int maxAttempts;
+
+    public RetryBackoffPolicy(@Value("${webhook.retry.max-attempts}") int maxAttempts) {
+        this.maxAttempts = maxAttempts;
+    }
+
+    public Duration delayForAttempt(int attempt) {
+        return BASE_DELAY.multipliedBy(1L << (attempt - 1));
+    }
+}
```

`payments-api/src/main/resources/application.yml` — round-1 hunk, fictional tool output:

```diff
diff --git a/src/main/resources/application.yml b/src/main/resources/application.yml
index 9f8e7d6..2c3b4a5 100644
--- a/src/main/resources/application.yml
+++ b/src/main/resources/application.yml
@@ -12,3 +12,6 @@ spring:
   datasource:
     url: jdbc:postgresql://localhost:5432/payments_api
+webhook:
+  retry:
+    max-attempts: 5
+    base-delay: 1s
```

`RetryBackoffPolicy`'s constructor reads only `webhook.retry.max-attempts`; line 10's `BASE_DELAY` constant is a hard-coded `1` second, never bound to `webhook.retry.base-delay`, even though that key exists in `application.yml` from this same round. This is the round-1 hunk Verifier round 1's Finding F1 cites as evidence (VERIFICATION.md's Prior findings) — required outcome: "the base delay is read from `webhook.retry.base-delay`"; fix scope: `payments-api/src/main/java/com/payments/webhook/RetryBackoffPolicy.java`.

## §2 — Round 2 fix: `RetryBackoffPolicy.java`

`payments-api/src/main/java/com/payments/webhook/RetryBackoffPolicy.java` — **round-2 fix commit** (fix scope only; no other path touched), fictional tool output:

```diff
diff --git a/src/main/java/com/payments/webhook/RetryBackoffPolicy.java b/src/main/java/com/payments/webhook/RetryBackoffPolicy.java
index 1a2b3c4..5d6e7f8 100644
--- a/src/main/java/com/payments/webhook/RetryBackoffPolicy.java
+++ b/src/main/java/com/payments/webhook/RetryBackoffPolicy.java
@@ -6,15 +6,16 @@ import org.springframework.stereotype.Component;
 @Component
 public class RetryBackoffPolicy {
 
-    private static final Duration BASE_DELAY = Duration.ofSeconds(1);
-
+    private final Duration baseDelay;
     private final int maxAttempts;
 
-    public RetryBackoffPolicy(@Value("${webhook.retry.max-attempts}") int maxAttempts) {
+    public RetryBackoffPolicy(
+            @Value("${webhook.retry.base-delay}") Duration baseDelay,
+            @Value("${webhook.retry.max-attempts}") int maxAttempts) {
+        this.baseDelay = baseDelay;
         this.maxAttempts = maxAttempts;
     }
 
     public Duration delayForAttempt(int attempt) {
-        return BASE_DELAY.multipliedBy(1L << (attempt - 1));
+        return baseDelay.multipliedBy(1L << (attempt - 1));
     }
 }
```

The constructor now takes `webhook.retry.base-delay` as a constructor-injected `@Value(...) Duration`, exactly as `application.yml`'s existing key already declared it (round 1 added the key but nothing read it). No test identity's expected result changes: `application-test.yml` fixes `base-delay: 1s` (TEST-CONTRACT.md's Envelope; `SOURCE-EXCERPTS.md` (m)), the same value round 1's hard-coded constant already produced — the fix corrects the obligation (C1: configuration, not a hard-coded value), not a test outcome. This is the F1 fix Verifier round 2 records `HONORED`, citing `RetryBackoffPolicy.java:13-15` (the constructor, including the `@Value("${webhook.retry.base-delay}")` parameter).

## §3 — `LedgerClient` / `RestLedgerClient`: added retry-attempt report method

`payments-api/src/main/java/com/payments/webhook/LedgerClient.java` — round-1 hunk (`PLAN-TRACED`), fictional tool output:

```diff
diff --git a/src/main/java/com/payments/webhook/LedgerClient.java b/src/main/java/com/payments/webhook/LedgerClient.java
index a1b2c3d..e4f5061 100644
--- a/src/main/java/com/payments/webhook/LedgerClient.java
+++ b/src/main/java/com/payments/webhook/LedgerClient.java
@@ -1,7 +1,15 @@
 package com.payments.webhook;
 
 public interface LedgerClient {
 
     void reportPaymentCaptured(PaymentCapturedEvent event) throws LedgerReportException;
 
+    void reportWebhookRetryAttempt(RetryAttemptReport report) throws LedgerReportException;
+
+    // The I1 report shape (C2-3): a record nested in this interface, never a separate
+    // DTO file — its three components are exactly the fields the consumer-adapter test
+    // (encodesRetryAttemptReportAtTheTransportEdge) asserts in the encoded JSON body.
+    record RetryAttemptReport(String deliveryId, int attemptNumber, String outcome) {
+    }
+
 }
```

`payments-api/src/main/java/com/payments/webhook/RestLedgerClient.java` — round-1 hunk (`PLAN-TRACED`), fictional tool output:

```diff
diff --git a/src/main/java/com/payments/webhook/RestLedgerClient.java b/src/main/java/com/payments/webhook/RestLedgerClient.java
index b2c3d4e..f6071829 100644
--- a/src/main/java/com/payments/webhook/RestLedgerClient.java
+++ b/src/main/java/com/payments/webhook/RestLedgerClient.java
@@ -18,6 +18,20 @@ public class RestLedgerClient implements LedgerClient {
         }
     }
 
+    @Override
+    public void reportWebhookRetryAttempt(RetryAttemptReport report) throws LedgerReportException {
+        try {
+            ResponseEntity<Void> response = restTemplate.postForEntity(
+                ledgerBaseUrl + "/internal/audit/webhook-retry-attempts", report, Void.class);
+            if (!response.getStatusCode().is2xxSuccessful()) {
+                throw new LedgerReportException(
+                    "Ledger rejected retry-attempt report: " + response.getStatusCode());
+            }
+        } catch (RestClientException e) {
+            throw new LedgerReportException("Ledger unreachable for retry-attempt report", e);
+        }
+    }
+
 }
```

Trace (IMPLEMENTATION.md's Changes per repository): the Approach sentence "reports the outcome to `payments-ledger` through the existing `LedgerClient` (E2)", plus `I1`'s consumer "via `LedgerClient`". Necessity: E2 states no current caller reports a retry attempt, so the report has no method to go through without this addition. A non-2xx response, or a transport exception, is translated to `LedgerReportException` — never a silently success-shaped result — matching E12/E13 and driving the AC5 re-report/`UNREPORTED` path. `restTemplate` and `ledgerBaseUrl` are existing fields of `RestLedgerClient`, unchanged by this hunk — only the new method and the nested `RetryAttemptReport` record are added.

## §4 — `WebhookClockConfiguration` bean (new)

`payments-api/src/main/java/com/payments/webhook/WebhookClockConfiguration.java` — round-1 commit (new file, `PLAN-TRACED`), fictional tool output:

```diff
diff --git a/src/main/java/com/payments/webhook/WebhookClockConfiguration.java b/src/main/java/com/payments/webhook/WebhookClockConfiguration.java
new file mode 100644
index 0000000..7c8d9e0
--- /dev/null
+++ b/src/main/java/com/payments/webhook/WebhookClockConfiguration.java
@@ -0,0 +1,13 @@
+package com.payments.webhook;
+
+import java.time.Clock;
+import org.springframework.context.annotation.Bean;
+import org.springframework.context.annotation.Configuration;
+
+@Configuration
+public class WebhookClockConfiguration {
+
+    @Bean
+    public Clock webhookRetryClock() {
+        return Clock.systemUTC();
+    }
+}
```

Trace: AC1, whose delay is observed as the persisted `next_attempt_at` relative to the current instant, and RK1 (no injectable clock exists at the anchor). Necessity: the scheduled delay must be computed from an injectable time source. The test context replaces this production bean with `FakeClock` (`support/FakeClock.java`, D1) — the production bean itself is never exercised by a contract test, only its role as the sole `Clock` `WebhookRetryService` is wired against.

## §5 — Flyway migration `V9__webhook_delivery_retry_state.sql`

`payments-api/src/main/resources/db/migration/V9__webhook_delivery_retry_state.sql` — round-1 commit (new file, `PLAN-TRACED`), fictional tool output:

```diff
diff --git a/src/main/resources/db/migration/V9__webhook_delivery_retry_state.sql b/src/main/resources/db/migration/V9__webhook_delivery_retry_state.sql
new file mode 100644
index 0000000..3e4f5a6
--- /dev/null
+++ b/src/main/resources/db/migration/V9__webhook_delivery_retry_state.sql
@@ -0,0 +1,6 @@
+ALTER TABLE webhook_delivery
+    ADD COLUMN next_attempt_at TIMESTAMP,
+    ADD COLUMN ledger_report_status VARCHAR(32);
+
+ALTER TABLE webhook_delivery_attempt
+    ADD COLUMN ledger_reported BOOLEAN NOT NULL DEFAULT false;
```

`webhook_delivery_attempt` is the existing, fictionally-named table `WebhookDelivery.Attempt` (the existing per-attempt records PLAN.md's E4 already maps — stated fiction, C2-3) is persisted into; this migration only adds a column to it, never creates it.

Trace: AC1, AC2, and AC5, observed at persisted `WebhookDelivery` state (E4), and Q6. The `ledger_reported` column additionally traces to AC5(i)'s re-report requirement: a still-unreported attempt must be re-reportable on a *later*, separate `attemptDelivery` call, so which attempts remain unreported has to persist between calls, not live only in memory. Necessity: the approved persisted fields, and the per-attempt report state AC5(i)'s re-report needs across calls, need columns to exist in. **Stated fiction**: `payments-api`'s schema is managed by Flyway migrations, which also run against the H2 test database — fictional, stated so, matching the `payments-ledger` `V12__audit_log.sql` evidence pattern (PLAN.md's E14). This migration touches only `webhook_delivery` and `webhook_delivery_attempt`; it does not touch `audit_log` — no schema change there, honoring C2 and PLAN.md's Out of scope.

## §6 — Key `WebhookRetryService` hunks: the synchronous report, the re-report, the `UNREPORTED` marking

**Existing types this excerpt uses (C2-3), never redeclared here:** `DeliveryStatus` is the existing status enum nested in `WebhookDelivery.java` — fictional, stated so — gaining the new value `PERMANENTLY_FAILED` via that file's `EDIT` (Changes per repository); `SOURCE-EXCERPTS.md:120` calls it "the existing `DeliveryStatus` enum." `WebhookDelivery.Attempt` is the existing per-attempt record type nested in the same `WebhookDelivery.java` — fictional, stated so — that the adopted `firstFailedAttemptIsRecordedWithFailureOutcome` test already reads via `persisted.getAttempts().get(0).getOutcome()`, returning the existing `AttemptOutcome` enum (`AttemptOutcome.FAILURE`, `SOURCE-EXCERPTS.md` §(l)); its existing `getAttemptNumber()`/`getOutcome()` are unchanged, and that same `WebhookDelivery.java` `EDIT` adds one new member to it: a `ledgerReported` flag (`isLedgerReported()`/`setLedgerReported(boolean)`), persisted via the `webhook_delivery_attempt.ledger_reported` column (§5). No `UnreportedAttempt` type exists anywhere in this run — "unreported attempts" are simply this delivery's attempts with `ledgerReported = false`; this is what lets the state survive between separate `attemptDelivery` calls, which AC5(i)'s re-report on the *next* call requires.

`payments-api/src/main/java/com/payments/webhook/WebhookRetryService.java` — round-1 commit (new file, `PLANNED`); excerpt only, three private methods, fictional tool output:

```diff
--- /dev/null
+++ b/src/main/java/com/payments/webhook/WebhookRetryService.java
@@ (excerpt — new file; only the re-report, synchronous-report, and UNREPORTED-marking
@@  methods are shown here; the full class, including the public attemptDelivery-facing
@@  entry points and the RetryBackoffPolicy wiring, is omitted for focus)
+    // AC5(i): re-report every already-recorded attempt still ledgerReported = false.
+    // Called once per attemptDelivery invocation, before the current attempt's own
+    // report below — so on the delivery's first-ever attempt this loop finds nothing
+    // (matching the frozen test's exactly-one request after attempt 1) — bounded by
+    // the delivery's own configured max-attempts budget, never an unbounded or
+    // separately-scheduled retry of the report itself.
+    private void reReportUnreportedAttempts(WebhookDelivery delivery) {
+        for (WebhookDelivery.Attempt priorAttempt : delivery.getAttempts()) {
+            if (!priorAttempt.isLedgerReported()) {
+                reportAttempt(delivery, priorAttempt);
+            }
+        }
+    }
+
+    // Q2: the report to payments-ledger is synchronous, inside the same attempt path
+    // that persists the delivery's own state — never deferred or fire-and-forget.
+    private void reportAttempt(WebhookDelivery delivery, WebhookDelivery.Attempt attempt) {
+        LedgerClient.RetryAttemptReport report = new LedgerClient.RetryAttemptReport(
+            delivery.getId(), attempt.getAttemptNumber(), attempt.getOutcome().name());
+        try {
+            ledgerClient.reportWebhookRetryAttempt(report);
+            attempt.setLedgerReported(true);
+        } catch (LedgerReportException e) {
+            // stays ledgerReported = false; re-reported on the next scheduled attempt
+        }
+    }
+
+    // AC5(ii)/(iii), Q6: whenever the delivery becomes terminal — budget exhausted
+    // (PERMANENTLY_FAILED) or delivered (DELIVERED) — with any attempt still
+    // ledgerReported = false, persist ledgerReportStatus = UNREPORTED and attempt no
+    // further report.
+    private void markTerminal(WebhookDelivery delivery, DeliveryStatus terminalStatus) {
+        delivery.setStatus(terminalStatus);
+        boolean anyUnreported = delivery.getAttempts().stream()
+            .anyMatch(attempt -> !attempt.isLedgerReported());
+        if (anyUnreported) {
+            delivery.setLedgerReportStatus("UNREPORTED");
+        }
+        deliveryRepository.save(delivery);
+    }
```

`reReportUnreportedAttempts` (AC5(i)) is cited at `WebhookRetryService.java:13`; `reportAttempt` (Q2, synchronous) at `WebhookRetryService.java:26`; `markTerminal` (AC5(ii)/(iii), Q6) at `WebhookRetryService.java:40`. `deliveryRepository` is the existing delivery repository (E4) — unchanged.

## §7 — The `payments-ledger` controller and repository hunks

`payments-ledger/src/main/java/com/payments/ledger/WebhookRetryAuditController.java` — round-1 commit (new file, `PLANNED`), fictional tool output:

```diff
diff --git a/src/main/java/com/payments/ledger/WebhookRetryAuditController.java b/src/main/java/com/payments/ledger/WebhookRetryAuditController.java
new file mode 100644
index 0000000..4f5a6b7
--- /dev/null
+++ b/src/main/java/com/payments/ledger/WebhookRetryAuditController.java
@@ -0,0 +1,23 @@
+package com.payments.ledger;
+
+import org.springframework.http.ResponseEntity;
+import org.springframework.web.bind.annotation.*;
+
+@RestController
+@RequestMapping("/internal/audit/webhook-retry-attempts")
+public class WebhookRetryAuditController {
+
+    private final AuditLogRepository auditLogRepository;
+
+    public WebhookRetryAuditController(AuditLogRepository auditLogRepository) {
+        this.auditLogRepository = auditLogRepository;
+    }
+
+    @PostMapping
+    public ResponseEntity<Void> recordRetryAttempt(@RequestBody RetryAttemptReport report) {
+        auditLogRepository.recordWebhookRetryAttempt(
+            report.deliveryId(), report.attemptNumber(), report.outcome());
+        return ResponseEntity.ok().build();
+    }
+
+    // payments-ledger's own request-body shape (C2-3) — a record nested in this
+    // controller, never a separate DTO file; same three components as payments-api's
+    // LedgerClient.RetryAttemptReport (§3), since both sides of I1 agree field-for-field.
+    record RetryAttemptReport(String deliveryId, int attemptNumber, String outcome) {
+    }
+}
```

`payments-ledger/src/main/java/com/payments/ledger/AuditLogRepository.java` — round-1 hunk (`PLANNED`, C2: existing `audit_log` table, no schema change), fictional tool output:

```diff
diff --git a/src/main/java/com/payments/ledger/AuditLogRepository.java b/src/main/java/com/payments/ledger/AuditLogRepository.java
index 5a6b7c8..8d9e0f1 100644
--- a/src/main/java/com/payments/ledger/AuditLogRepository.java
+++ b/src/main/java/com/payments/ledger/AuditLogRepository.java
@@ -18,6 +18,16 @@ public class AuditLogRepository {
         // existing PAYMENT_CAPTURED write path, unchanged
     }
 
+    public void recordWebhookRetryAttempt(String deliveryId, int attemptNumber, String outcome) {
+        Map<String, Object> payload = Map.of(
+            "attemptNumber", attemptNumber,
+            "outcome", outcome);
+        jdbc.update(
+            "insert into audit_log (entity_type, entity_id, event_type, payload, recorded_at) "
+                + "values (?, ?, ?, ?::jsonb, now())",
+            "WEBHOOK_DELIVERY", deliveryId, "WEBHOOK_RETRY_ATTEMPT", toJson(payload));
+    }
+
     public Optional<AuditLogRow> findByEntityTypeAndEntityId(String entityType, String entityId) {
         // existing read path, unchanged
     }
```

`WebhookRetryAuditController.recordRetryAttempt` is cited at `WebhookRetryAuditController.java:17`; `AuditLogRepository.recordWebhookRetryAttempt` is cited at `AuditLogRepository.java:21`. The insert targets the existing `audit_log` columns (`entity_type`, `entity_id`, `event_type`, `payload`, `recorded_at` — PLAN.md's E14) with no `ALTER TABLE` against `audit_log` anywhere in this run — honoring C2 and Out of scope. `jdbc` and `toJson` are `AuditLogRepository`'s existing helpers (`jdbc`: the pre-existing `JdbcTemplate`; `toJson`: the existing structured-`payload` write helper the `PAYMENT_CAPTURED` path already uses, E15) — unchanged by this hunk, reused for the new write exactly as for the existing one.
