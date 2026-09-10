```yaml
artifact: PLAN.md
run: PAYMENTS-12410
primaryJira: PAYMENTS-12410
status: APPROVED
producedBy: planner
inputs: [INTAKE.md, RUN.md]
```

## Scope

Reject a non-`https` URL scheme when a merchant registers or updates a webhook endpoint in `payments-api`, per PAYMENTS-12410's Acceptance Criteria field [JIRA]. **Change class: SMALL** — one repository (`payments-api` only, RUN.md G1), a localized validation-rule addition, no new/changed interface, no persistence/config change, no permission/money/data-integrity consequence, no unresolved material choice: all R2 `SMALL` conditions hold [INFERENCE].

## Requested scope disposition

| Key | Disposition | Covering |
|---|---|---|
| `PAYMENTS-12410` | IMPLEMENTED | AC1, AC2, P1 |

| Id | Source anchor | Obligation | Disposition | Covered by |
|---|---|---|---|---|
| R1 | PAYMENTS-12410 AC field | Reject non-`https` URL, validation error naming the field | IMPLEMENTED | AC1, AC2 |
| R2 | PAYMENTS-12410 AC field | Existing registrations not modified | PRESERVED | P1 |

## Repository evidence — `payments-api`

| Id | Type | Location | Statement |
|---|---|---|---|
| E1 | RESPONSIBLE_COMPONENT | `payments-api/src/main/java/com/payments/webhook/MerchantWebhookRegistrationService.java:1` | Handles create/update of a registered endpoint URL; no scheme check today [REPO]. |
| E2 | ENTRY_POINT | `payments-api/src/main/java/com/payments/webhook/MerchantWebhookRegistrationController.java:1` | Existing REST endpoint; returns the existing validation-error response shape on invalid input [REPO]. |
| E3 | ADJACENT_TEST | `payments-api/src/test/java/com/payments/webhook/MerchantWebhookRegistrationServiceTest.java:1` | Existing test covering today's validation (blank/malformed URL) [REPO]. |
| E4 | NOT_FOUND | `payments-api/src/main/java/com/payments/webhook` (searched `scheme`, `https`, `URL`, `Protocol`) | No existing scheme validation found by these searches in this scope; genuinely new logic, not a duplicate [REPO]/[INFERENCE]. |

Searched: `MerchantWebhookRegistrationService`, `MerchantWebhookRegistrationController`, "scheme", "https", "URL", "Protocol" [REPO]/[INFERENCE].

## Approach per repository

### `payments-api`

Add a scheme check to `MerchantWebhookRegistrationService`'s existing validation step (E1), rejecting non-`https` via the existing validation-error response shape (E2) — no new interface.

## Dependencies and interfaces

None — single repository, no new/changed interface; the existing response shape (E2) is reused unchanged.

## Affected files

| Path | Repository | Change type | Reason | Confidence | Evidence |
|---|---|---|---|---|---|
| `payments-api/src/main/java/com/payments/webhook/MerchantWebhookRegistrationService.java` | `payments-api` | EDIT | AC1 | HIGH | E1 |
| `payments-api/src/main/resources/messages/validation.properties` | `payments-api` | EDIT | AC1 (error message text) | LOW — inferred conventional location, no evidence row cites it | — |

## Acceptance criteria

**AC1.** Given a registration/update URL whose scheme is not `https`, When submitted, Then it is rejected with a validation error naming the field.
Source class: JIRA. Observed at: the existing registration endpoint's response (E2). Preconditions: non-`https` scheme submitted. Path: NEGATIVE.

**AC2.** Given a registration/update URL that is `https`, When submitted, Then it is accepted as today.
Source class: DERIVED (the complement of R1's rejection rule: an accepted `https` URL continues to be accepted; reasoning recorded here). Observed at: the existing registration endpoint's response (E2). Preconditions: `https` scheme submitted. Path: POSITIVE.

### Preservation expectations

**P1.** Given an existing registration with any scheme, When this change is deployed, Then it remains readable and unmodified. Evidence: E1 [REPO].

## Risks

- Trigger AC1: scheme comparison must be case-insensitive (RFC 3986); a case-sensitive check would wrongly reject e.g. `HTTPS://...`. Treatment: covered by AC1.

## Decisions and open questions

| Id | Statement | Routing | Planner recommendation | Basis | Consequence if wrong | Surfaced at |
|---|---|---|---|---|---|---|
| Q1 | Update reuses the same validation step as register (one shared method in E1), not a separate check. | ASSUMED | — (proceeding on this basis) | E1 [REPO]/[INFERENCE] | If update has its own unvalidated path, a non-`https` URL could be set despite AC1 — observable via AC1's route (E2) on the update call. | G3 (count) |

## Out of scope

- URL reachability, DNS, or TLS handshake validation — not requested.
- Any change to `payments-ledger` or `payments-web` — not recommended at G1.
- Retroactively re-validating or migrating existing non-`https` registrations — the Acceptance Criteria field states existing registrations are not modified.

## Decision summary

**Intended outcomes.** Merchants can no longer register or update a webhook endpoint using a non-`https` URL; such attempts are rejected with a validation error naming the field (AC1), while `https` URLs continue to be accepted exactly as today (AC2), and no existing registration is touched by this change (P1).

**Material choices.** None.

**Exclusions and unresolved scope.** None.

**Consequential assumptions.** 1 (Q1).

**Accepted risks.** None.

**Cross-repository prerequisites.** None — single repository.

## Adversary round

1.1

## Response to adversary findings

n/a
