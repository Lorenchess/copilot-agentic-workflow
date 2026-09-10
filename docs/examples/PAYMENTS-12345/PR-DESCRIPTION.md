```yaml
artifact: PR-DESCRIPTION.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: DRAFTED
producedBy: pr
inputs: [PLAN.md, VERIFICATION.md, INTAKE.md]
```

## Title per repository

- `payments-api`: "PAYMENTS-12345: Retry failed webhook deliveries with exponential backoff"
- `payments-ledger`: "PAYMENTS-12345: Record webhook retry attempts in ledger audit log"

## Summary

Failed webhook deliveries in `payments-api` are now retried with exponential backoff up to a configured maximum number of attempts, instead of failing permanently after a single attempt [REPO]. Each retry attempt, whether it succeeds or fails, is now recorded in `payments-ledger`'s existing audit log [REPO], using the existing `audit_log` table rather than a new one [INFERENCE]. If the call that reports an attempt to `payments-ledger` itself fails, `payments-api` retries that call alongside the delivery's own retry schedule rather than dropping the attempt, so the audit trail cannot silently lose a record [REPO].

## Jira links

- Primary: PAYMENTS-12345 — "Retry failed webhook deliveries with exponential backoff" [JIRA]
- Secondary: PAYMENTS-12351 — "Record webhook retry attempts in the ledger" [JIRA]

## Changes per repository

- `payments-api`: `WebhookRetryService.java` (new), `WebhookDeliveryService.java` (edited), `application.yml` (edited — retry configuration). [REPO]
- `payments-ledger`: `WebhookRetryAuditController.java` (new), `AuditLogRepository.java` (edited). [REPO]

## Testing

Acceptance tests (`WebhookRetryServiceTest`, `WebhookRetryAuditTest`) classify each test as WITNESS (missing-behavior, proven RED before implementation, then GREEN after) or PRESERVATION (`alreadyDeliveredWebhookIsNeverRetried`, `existingAuditLogWriteIsUnchanged`; expected to pass, and did pass, both before and after implementation). The verifier ran two independent executions, both required for PASS: (A) the exact contract command per repository, confirming every named test was discovered, executed, not skipped, and reached its classified result; (B) each repository's full test suite (`payments-api`: 49 tests, `payments-ledger`: 23 tests), all passing, to prove no broader regression. A test-immutability check confirmed neither acceptance-test file changed since its RED commit, and an execution envelope check found the one justified `pom.xml` dependency change in `payments-api` (IMPLEMENTATION.md's Envelope changes) with no contract test excluded. Result: PASS. [TOOL]

## Verified SHA per repository

- `payments-api`: `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL]
- `payments-ledger`: `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL]

## Risks and rollout notes

No schema migration is required — `payments-ledger` writes into its existing `audit_log` table [INFERENCE]. Backoff base delay and maximum attempts are configuration values in `application.yml`, not hardcoded, so they can be tuned post-rollout without a code change [INFERENCE]. The backoff policy has no randomized jitter; if many webhooks fail at the same time, retries could cluster — flagged as a non-blocking follow-up in ADVERSARY-REVIEW.md, not addressed in this change. [INFERENCE]
