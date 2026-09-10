```yaml
artifact: INTAKE.md
run: PAYMENTS-12410
primaryJira: PAYMENTS-12410
status: COMPLETE
producedBy: intake
inputs: []
```

## Requested Jiras

### PAYMENTS-12410 (PRIMARY)

- Summary: "Reject non-HTTPS webhook endpoint URLs at merchant webhook registration" [JIRA]
- Status: "To Do" [JIRA]
- Type: "Story" [JIRA]
- Acceptance Criteria field (field name "Acceptance Criteria"): "Registering or updating a merchant webhook endpoint whose URL scheme is not https is rejected with a validation error naming the field; existing registrations are not modified by this change." [JIRA]
- Components: "Payments API" [JIRA]
- Labels: "webhooks", "validation" [JIRA]

## Context-only Jiras

None found within budget [INFERENCE].

## Repository recommendation

**`payments-api`** — confidence HIGH
- `JIRA_COMPONENT`: Components field on PAYMENTS-12410 is "Payments API", matching this repository's name [JIRA]
- `IDENTIFIER_FOUND_IN_CODE`: `MerchantWebhookRegistrationService` found at `payments-api/src/main/java/com/payments/webhook/MerchantWebhookRegistrationService.java:1` [REPO]
- `README_MATCH`: README head states "Handles outbound webhook delivery and merchant webhook endpoint registration." [REPO]

**`payments-ledger`** — not recommended
- `INFERENCE`: no Jira Component or Label match; no identifier from PAYMENTS-12410 found in this repository's code within budget [INFERENCE]

**`payments-web`** — not recommended
- `INFERENCE`: repository name shares the `payments-` prefix with `payments-api`; no Jira Component, Label, or text match; no identifier found in this repository's code within budget [INFERENCE]

Identifiers searched: `MerchantWebhookRegistrationService`, "webhook", "registration", "scheme", "https" [INFERENCE]. Limitations: none — budget (`maxTextSearches = 12`, `maxFilesRead = 20`) was not exhausted.

## Proposed branch name

`PAYMENTS-12410-https-only-webhook-urls` [INFERENCE] — derived from the primary Jira's key and summary. The confirmed name (accepted unchanged) is recorded in RUN.md.

## Facts / Assumptions / Unknowns / Warnings

### Facts
- PAYMENTS-12410 is an open, unassigned Story-type issue [JIRA].
- `payments-api` already contains a `MerchantWebhookRegistrationService` component that handles both registering a new webhook endpoint and updating an existing one [REPO].

### Assumptions

None material [INFERENCE].

### Unknowns

None.

### Warnings

None.

## Suspicious content

None found [JIRA].
