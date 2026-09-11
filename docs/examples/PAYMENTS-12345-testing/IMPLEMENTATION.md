```yaml
artifact: IMPLEMENTATION.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: GREEN
producedBy: developer
inputs: [PLAN.md, TEST-CONTRACT.md, RED-REPORT.md, WORKSPACE.md, VERIFICATION.md]
```

This is the **round-2 (active)** revision — an authorized regeneration following Verifier round 1's FAIL (`payments-api`: C1 `VIOLATED`). Round 1's own IMPLEMENTATION.md is SUPERSEDED (RUN.md's Artifact history) and is not reproduced in full here; its content is narrated where the round-2 record needs it (GREEN evidence), following the same round-history convention `RED-REPORT.md`/`TEST-REVIEW.md` use elsewhere in this directory.

**WORKSPACE.md is not reproduced in this example** (RUN.md's stage 2 row). The baseline is the `origin/<default>` (`origin/main`) SHA WORKSPACE.md would have recorded at stage 2 for each repository — not a merge-base with the feature branch. The baseline SHAs below are fictional, stated so, supplied only for the changed-path self-inventory and the read-only diff forms: `payments-api` baseline `7a7a7a7a8b8b8b8b9c9c9c9c0d0d0d0d1e1e1e1e`; `payments-ledger` baseline `2f2f2f2f3a3a3a3a4b4b4b4b5c5c5c5c6d6d6d6d` — both fictional [INFERENCE].

## Status per repository

Round: `2` (fix round, following Verifier round-1 FAIL on `payments-api`; `payments-ledger` PASSed round 1). Implementation order (IQ9, Developer's recorded choice): `payments-ledger` implemented and made GREEN first, then `payments-api`. PLAN.md's `I1` row permits either order (`PLAN.md:83`, Implementation order column); the rationale is that the provider's decoding test (AC4) is GREEN before the consumer's encoding is written — this is distinct from the rollout prerequisite (`payments-ledger` deployed before `payments-api` enables reporting), which is a `ROLLOUT` obligation, not an implementation-order constraint (see Obligations and Handoff notes). [DEV]

- `payments-ledger`: **GREEN** — allowance reserved (round 2): `C 0/6 · D 0/6 · H 1/2`.
- `payments-api`: **GREEN** — allowance reserved (round 2): `C 1/6 · D 0/6 · H 1/2`.

## Changes per repository

### `payments-ledger`

| Path | Class | Reason / trace |
|---|---|---|
| `src/main/java/com/payments/ledger/WebhookRetryAuditController.java` (NEW) | `PLANNED` | AC4, `I1` — Affected files (`PLAN.md:94`) |
| `src/main/java/com/payments/ledger/AuditLogRepository.java` (EDIT) | `PLANNED` | AC4, C2 — Affected files (`PLAN.md:95`); writes the `I1` fields into the existing `audit_log` (C2), no schema change (DIFF-EXCERPTS.md §7) |

### `payments-api`

| Path | Class | Reason / trace |
|---|---|---|
| `src/main/java/com/payments/webhook/WebhookRetryService.java` (NEW) | `PLANNED` | AC1, AC2, AC3, AC5, Q6 — Affected files (`PLAN.md:89`) |
| `src/main/java/com/payments/webhook/RetryBackoffPolicy.java` (NEW) | `PLANNED` | AC1, C1 — Affected files (`PLAN.md:90`); round-2 fix applied here (see GREEN evidence, Fix-round response) |
| `src/main/java/com/payments/webhook/WebhookDeliveryService.java` (EDIT) | `PLANNED` | AC1 — Affected files (`PLAN.md:91`) |
| `src/main/resources/application.yml` (CONFIG) | `PLANNED` | C1, Q1 — Affected files (`PLAN.md:92`); adds `webhook.retry.max-attempts: 5`, `webhook.retry.base-delay: 1s` |
| `src/main/java/com/payments/webhook/WebhookDelivery.java` (EDIT) | `PLANNED` | AC2, AC3, AC5, Q3, Q6 — Affected files (`PLAN.md:93`); adds status value `PERMANENTLY_FAILED` to the existing nested `DeliveryStatus` enum, field `ledgerReportStatus`, and a per-attempt `ledgerReported` flag on the existing nested `Attempt` type (C2-3, DIFF-EXCERPTS.md §6); the enum and the attempt type both stay inside this file, no extra file appears [DEV] |
| `src/main/java/com/payments/webhook/LedgerClient.java` (EDIT) | `PLAN-TRACED` | Trace: the Approach sentence "reports the outcome to `payments-ledger` through the existing `LedgerClient` (E2)" (`PLAN.md:71`), plus `I1`'s consumer "via `LedgerClient`" (`PLAN.md:83`). Necessity: E2 states no current caller reports a retry attempt, so the report has no method to go through. Disclosure: this is the locked plan's Affected-files gap already recorded in the Phase 3 contract §10 clarification (4) — surfaced, not repaired. See DIFF-EXCERPTS.md §3. |
| `src/main/java/com/payments/webhook/RestLedgerClient.java` (EDIT) | `PLAN-TRACED` | Same trace and necessity as `LedgerClient.java`. See DIFF-EXCERPTS.md §3. |
| `src/main/java/com/payments/webhook/WebhookClockConfiguration.java` (NEW) | `PLAN-TRACED` | Trace: AC1, whose delay is observed as the persisted `next_attempt_at` relative to the current instant, and RK1 (`PLAN.md:130`, no injectable clock exists). Necessity: the scheduled delay must be computed from an injectable time source. See DIFF-EXCERPTS.md §4. |
| `src/main/resources/db/migration/V9__webhook_delivery_retry_state.sql` (NEW) | `PLAN-TRACED` | Trace: AC1, AC2, AC5, observed at persisted `WebhookDelivery` state (E4), and Q6; the added `ledger_reported` column additionally traces to AC5(i), whose re-report on a *later* `attemptDelivery` call needs the per-attempt report state to persist across calls. Necessity: the approved persisted fields, and AC5(i)'s cross-call state, need columns. Stated fiction: `payments-api`'s schema is managed by Flyway migrations, which also run against the H2 test database — fictional, stated so, matching `payments-ledger`'s `V12__audit_log.sql` evidence pattern (PLAN.md's E14). See DIFF-EXCERPTS.md §5. |

These three `PLAN-TRACED` edits are consequential, not `MATERIAL`: the persisted shape and the `I1` route are approved by the plan (AC5, Q6, `I1`); none adds behavior the plan did not already approve.

## Commits

- `payments-ledger` — `9e9e9e9e0f0f0f0f1a1a1a1a2b2b2b2b3c3c3c3c` — "feat(PAYMENTS-12345): record webhook retry attempts in ledger audit_log" [TOOL]. Round 1 only; unchanged through round 2 (IQ13 — a fix round's GREEN evidence is regenerated even where the commit is not).
- `payments-api` (round 1, superseded HEAD) — `4d4d4d4d5e5e5e5e6f6f6f6f7a7a7a7a8b8b8b8b` — "feat(PAYMENTS-12345): retry failed webhook deliveries with exponential backoff" [TOOL].
- `payments-api` (round 2, active HEAD) — `8c8c8c8c9d9d9d9d0e0e0e0e1f1f1f1f2a2a2a2a` — "fix(PAYMENTS-12345): read retry backoff base delay from configuration (F1)" [TOOL]. Scoped to the fix (`RetryBackoffPolicy.java` only, DIFF-EXCERPTS.md §2).

No enabling-refactoring commit occurred in either repository (no refactor-under-RED was used).

## GREEN evidence

**Baseline**: not taken (optional) — no baseline full-suite run this run.

**Round 1 (superseded, narrated only — not reproduced in detail; RUN.md's Artifact history marks it SUPERSEDED).** `payments-ledger` reached a bracketed handoff GREEN at commit `9e9e9e9e0f0f0f0f1a1a1a1a2b2b2b2b3c3c3c3c` after one contract iteration and one handoff attempt (`H1`: `H1.1` contract, `H1.2` full suite, `H1.3` scoped relied-on run) — allowance reserved `C 1/6 · D 0/6 · H 1/2`. `payments-api` reached a bracketed handoff GREEN at commit `4d4d4d4d5e5e5e5e6f6f6f6f7a7a7a7a8b8b8b8b` after two contract iterations and one handoff attempt (`H1`: `H1.1` contract, `H1.2` full suite) — allowance reserved `C 2/6 · D 0/6 · H 1/2`. Round 1's `RetryBackoffPolicy.java` hard-coded the base delay (`private static final Duration BASE_DELAY = Duration.ofSeconds(1);`, DIFF-EXCERPTS.md §1) while reading `max-attempts` from configuration; `application.yml` added `webhook.retry.base-delay: 1s`, but nothing read it (DIFF-EXCERPTS.md §1). Every contract identity passed regardless: the proof-relevant `application-test.yml` also fixes `base-delay: 1s` and no test varies it (TEST-CONTRACT.md's Envelope; `SOURCE-EXCERPTS.md` (m)) — so round 1 handed off GREEN in both repositories [TOOL]/[INFERENCE]. Verifier round 1 found this `VIOLATED` against C1 (Finding F1, BLOCKING) and FAILed `payments-api` (`payments-ledger` PASSed) — see VERIFICATION.md's Prior findings for F1's full round-1 shape.

**Round 2 (active) — Iteration log**, reservation-first (skill IQ3):

`payments-ledger` — no code change this round; a fresh bracketed handoff attempt re-establishes GREEN evidence at the unchanged HEAD (IQ13):

| Id | Repo | Edit / purpose | Failing (Δ) | Class |
|---|---|---|---|---|
| `H1.1` | `payments-ledger` | contract run, `mvn -q -Dtest=WebhookRetryAuditControllerTest test` — no code change this round | none (Δ unchanged — already GREEN) | — |
| `H1.2` | `payments-ledger` | full suite, `mvn -q test` | none (Δ unchanged) | — |
| `H1.3` | `payments-ledger` | scoped relied-on run, `mvn -q -Dtest=AuditLogRepositoryTest#persistsPaymentCapturedEventPayload test` (full-suite output is aggregate-only, `mvn -q`) | none (Δ unchanged) | — |

Controlled-path check (both halves) passed at round-2 start and again before `H1` — committed half diffs from the **active anchor** in TEST-CONTRACT.md's Anchor per repository (`e3e3e3e3f4f4f4f4a5a5a5a5c1c1c1c1d2d2d2d2`), never the Developer's own commit: `git -C payments-ledger diff --stat e3e3e3e3f4f4f4f4a5a5a5a5c1c1c1c1d2d2d2d2..HEAD -- <protected paths>` — empty; `git -C payments-ledger diff --name-status e3e3e3e3f4f4f4f4a5a5a5a5c1c1c1c1d2d2d2d2..HEAD -- src/test/resources/application-test.yml src/test/java/com/payments/ledger/AuditLogRepositoryTest.java` (proof-relevant envelope file and relied-on test, skill IQ2) — lists nothing; working-tree half: `git -C payments-ledger status --porcelain=v2 --branch` — clean, no controlled-path entry [TOOL].

`payments-api` — one contract iteration applies and re-verifies the fix, then a fresh handoff attempt:

| Id | Repo | Edit / purpose | Failing (Δ) | Class |
|---|---|---|---|---|
| `C1` | `payments-api` | edit `RetryBackoffPolicy.java` to read `webhook.retry.base-delay` via constructor-injected `@Value` (fix F1, DIFF-EXCERPTS.md §2); contract run `mvn -q -Dtest='WebhookRetryServiceTest,WebhookDeliveryServiceTest,WebhookDeliveryStatusControllerTest' test` | none (Δ — no contract identity was failing before or after; the fix corrects an obligation violation no runnable test detects, C1, not a failing test) | — |
| `H1.1` | `payments-api` | contract run, same three-class command | none (Δ unchanged) | — |
| `H1.2` | `payments-api` | full suite, `mvn -q test` | none (Δ unchanged) | — |

No `D<n>` diagnostic runs were needed in either repository this round; no relied-on identity applies to `payments-api` (TEST-CONTRACT.md's Relied-on existing tests names only `payments-ledger`'s).

Controlled-path check (both halves) passed at round-2 start and again before `C1` and before `H1`: `git -C payments-api diff --stat c1c1c1c1d2d2d2d2e3e3e3e3f4f4f4f4a5a5a5a5..HEAD -- <protected paths>` — empty; `git -C payments-api status --porcelain=v2 --branch` — clean, no controlled-path entry [TOOL].

**Bracketed handoff attempts (round 2):**

`payments-ledger` `H1` — before: `status --porcelain=v2 --branch` clean, `log -1 --format=%H` = `9e9e9e9e0f0f0f0f1a1a1a1a2b2b2b2b3c3c3c3c` [TOOL]; after: same two commands, unchanged [TOOL]. `H1.1` — contract command `mvn -q -Dtest=WebhookRetryAuditControllerTest test`: `recordsRetryAttemptInAuditLog` discovered, executed, not skipped, GREEN [TOOL]. `H1.2` — full suite `mvn -q test`: no failing identity [TOOL]. `H1.3` — scoped relied-on run: `persistsPaymentCapturedEventPayload` PASS [TOOL] (matching TEST-CONTRACT.md's observed baseline). Envelope self-check (TEST-CONTRACT.md's Envelope per repository plus Relied-on existing tests, never Protected paths): `diff --name-status e3e3e3e3f4f4f4f4a5a5a5a5c1c1c1c1d2d2d2d2..HEAD -- pom.xml src/test/resources/application-test.yml src/test/java/com/payments/ledger/AuditLogRepositoryTest.java` — no output [TOOL], matching Envelope changes ("none," below). Inventory self-check: `diff --name-status <base>..HEAD` — every path `PLANNED` or `PROTECTED-TEST`, no `UNRELATED` [TOOL].

`payments-api` `H1` — before: `status --porcelain=v2 --branch` clean, `log -1 --format=%H` = `8c8c8c8c9d9d9d9d0e0e0e0e1f1f1f1f2a2a2a2a` [TOOL]; after: same two commands, unchanged [TOOL]. `H1.1` — contract command (three-class list): all twelve identities discovered, executed, not skipped, GREEN — the ten `WebhookRetryServiceTest` methods, `firstFailedAttemptIsRecordedWithFailureOutcome` (adopted), `existingStatusValuesAreReturnedUnchangedForExistingDeliveries` [TOOL]. `H1.2` — full suite `mvn -q test`: no failing identity [TOOL]. No relied-on identity applies. Envelope self-check (TEST-CONTRACT.md's Envelope per repository; no relied-on test for `payments-api`; never Protected paths): `diff --name-status c1c1c1c1d2d2d2d2e3e3e3e3f4f4f4f4a5a5a5a5..HEAD -- pom.xml src/test/resources/application-test.yml` — no output [TOOL], matching Envelope changes ("none," below). Inventory self-check: `diff --name-status <base>..HEAD` — every path `PLANNED`, `PLAN-TRACED` (as declared above), or `PROTECTED-TEST`, no `UNRELATED` [TOOL].

## Obligations

| Id | Statement | Value |
|---|---|---|
| C1 | Keep the retry backoff config in `application.yml`, don't hardcode it (`PLAN.md`'s D1) | `payments-api/src/main/java/com/payments/webhook/RetryBackoffPolicy.java:13-15` (constructor-injected `@Value("${webhook.retry.base-delay}") Duration`, DIFF-EXCERPTS.md §2) |
| C2 | Retry attempts write to the existing `audit_log` table, not a new table (`PLAN.md`'s D2) | `payments-ledger/src/main/java/com/payments/ledger/AuditLogRepository.java:21` (`recordWebhookRetryAttempt`, DIFF-EXCERPTS.md §7); no schema change to `audit_log` — migration V9 touches only `payments-api`'s `webhook_delivery`/`webhook_delivery_attempt` |
| Q1 | Shipped defaults `maxAttempts = 5`, `baseDelay = 1s` | `payments-api/src/main/resources/application.yml` (`webhook.retry.max-attempts: 5`, `webhook.retry.base-delay: 1s`) and `RetryBackoffPolicy.java:13-15` reading both |
| Q2 | Report to `payments-ledger` is synchronous within the retry step | `WebhookRetryService.java:26` (`reportAttempt`, DIFF-EXCERPTS.md §6) — called inline in the attempt path, never deferred |
| Q3 | Expose `PERMANENTLY_FAILED`, not `ledgerReportStatus`, through the existing status endpoint | `payments-api/src/main/java/com/payments/webhook/WebhookDeliveryStatusController.java:22` (unchanged response mapping; exposes the status enum's `.name()`, no `ledgerReportStatus` field) — fictional, stated |
| Q6 | Persist `ledgerReportStatus = UNREPORTED` and attempt no further report on terminal | `WebhookRetryService.java:40` (`markTerminal`, DIFF-EXCERPTS.md §6) |
| `I1` (consumer encoding) | `payments-api` encodes the retry-attempt report via `LedgerClient` | `RestLedgerClient.java:21`, encoding `LedgerClient.RetryAttemptReport` (nested record, DIFF-EXCERPTS.md §3) |
| `I1` (provider decoding) | `payments-ledger` decodes and persists the report | `WebhookRetryAuditController.java:17` (decoding its own nested `RetryAttemptReport` record) / `AuditLogRepository.java:21` (DIFF-EXCERPTS.md §7) |
| `I1` (failure behavior) | Non-2xx/transport failure signaled by `LedgerReportException`, entering the AC5 path | `RestLedgerClient.java:28-30` (DIFF-EXCERPTS.md §3) → `WebhookRetryService.java:13` (`reReportUnreportedAttempts`, DIFF-EXCERPTS.md §6) |
| `I1` (deployment compatibility) | `payments-ledger` deployed before `payments-api` enables retry reporting | `ROLLOUT` — not code-verifiable by design |
| Out of scope | no jitter, no dead-letter queue, no `audit_log` schema change | `RetryBackoffPolicy.java` (no jitter term in `delayForAttempt`); no dead-letter/queue class exists in either repository's Changes above; `V9__webhook_delivery_retry_state.sql` (DIFF-EXCERPTS.md §5) touches only `webhook_delivery`/`webhook_delivery_attempt`, never `audit_log` |

## Envelope changes

None in either repository — no ordinary (non-proof-relevant) envelope file was changed. [REPO]

## Deviations from plan

None — round 1's obligation gap (C1) is not recorded here as a declared deviation; it was an oversight Verifier caught (Finding F1), not a Developer-declared `MINOR` deviation, and it is now fixed (see Fix-round response). No enabling refactoring was used; no Affected-files entry was left planned-but-not-changed.

## Test-change requests

None.

## Handoff notes

- Implementation order (IQ9): `payments-ledger` first, then `payments-api` — Developer's recorded choice; rationale above (Status per repository). [DEV]
- Rollout: `payments-ledger` should be deployed before `payments-api` enables retry reporting (`I1`'s deployment compatibility, `PLAN.md:83`); `payments-api` tolerates the endpoint's absence via AC5's `UNREPORTED` marking and may ship first, but reports attempted before `payments-ledger` is live are persisted `UNREPORTED` until it is. Recorded as `ROLLOUT` under Obligations. [DEV]
- No `NOT_VERIFIED` clause — TEST-CONTRACT.md's Coverage gaps is `none`.
- Limitation: the round-1 hard-coded `RetryBackoffPolicy` passed every contract identity because the proof-relevant `application-test.yml` happens to fix the same value (`base-delay: 1s`) the constant produced — no contract test varies `base-delay`, so this class of obligation violation is undetectable by the contract alone and depends on the Verifier's Obligation check (skill IQ11). [INFERENCE]

## Fix-round response

- **F1 — FIXED.** `RetryBackoffPolicy.java` now reads `webhook.retry.base-delay` via a constructor-injected `@Value("${webhook.retry.base-delay}") Duration`, instead of the round-1 hard-coded `private static final Duration BASE_DELAY = Duration.ofSeconds(1)` (DIFF-EXCERPTS.md §2). Path: `payments-api/src/main/java/com/payments/webhook/RetryBackoffPolicy.java` — the only path touched this round, within F1's fix scope. Re-verified GREEN by a fresh bracketed handoff attempt (`H1`, round 2) in both repositories, per IQ13. [TOOL]/[DEV]
