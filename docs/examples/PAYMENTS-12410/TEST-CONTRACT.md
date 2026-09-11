```yaml
artifact: TEST-CONTRACT.md
run: PAYMENTS-12410
primaryJira: PAYMENTS-12410
status: RED
producedBy: tester
inputs: [PLAN.md]
```

## Contract map

| Test (`payments-api: .../MerchantWebhookRegistrationApiTest.java`) | Criterion | Level | Observes | Doubles | Classification | Expected | Determinism |
|---|---|---|---|---|---|---|---|
| `#rejectsNonHttpsEndpointUrlNamingTheField(Operation)` — `[1] CREATE`, `[2] UPDATE` (`@ParameterizedTest(name = "[{index}] {0}") @EnumSource(Operation.class)`, `Operation { CREATE, UPDATE }` a tester-created nested enum) | AC1 | `API` — Observed at is the existing registration endpoint's response (E2), exercised through both the create route (POST) and the update route (arrange an existing registration, then PUT) — Q1's shared-validation-step assumption is now exercised, not assumed; an error body naming the field is a response contract (skill T3 row 3) | HTTP 400 whose validation-error body names field `endpointUrl` | none | WITNESS | RED | none |
| `#acceptsHttpsEndpointUrlAsToday(Operation)` — `[1] CREATE`, `[2] UPDATE` | AC2 | `API` — same route (E2), both operations | HTTP 201 Created (CREATE) / 200 OK (UPDATE); the registration reads back with the submitted URL; each operation exercised with `https://` then `HTTPS://` as a second input (Risk 1, case-insensitivity) | none | PRESERVATION — basis 2 (existing clause of a partially existing criterion; AC2 is DERIVED as the complement of AC1; both operations already accept any scheme today, E4) | PASS | none |
| `#existingRegistrationRemainsReadableUnchanged` | P1 | `API` — same route (E2) | An existing registration (any scheme) remains readable and unmodified through the endpoint | none | PRESERVATION — basis 1 (`P` row, required) | PASS | none |

## Proves

- `#rejectsNonHttpsEndpointUrlNamingTheField(Operation)` — fails when the non-`https` rejection is absent on either operation because the assertion on the response status and the error body's field name would find `201 Created` (CREATE) or `200 OK` (UPDATE) instead of `400` naming `endpointUrl`; passes only when both the create route and the update route reject with `400` naming `endpointUrl`.
- `#acceptsHttpsEndpointUrlAsToday(Operation)` — fails when an `https` (or `HTTPS://`) submission stops being accepted on either operation because the assertion on `201 Created`/`200 OK` and on reading the registration back would find a rejection instead; passes only when both inputs are accepted on both operations and readable back unchanged.
- `#existingRegistrationRemainsReadableUnchanged` — fails when an existing registration becomes unreadable or is altered because the assertion on the read-back body would find a missing or changed record; passes only when the pre-existing registration reads back identical to before.

## Protected paths per repository

`payments-api`: `src/test/java/com/payments/webhook/MerchantWebhookRegistrationApiTest.java` — the one new test class, including the nested `Operation` enum (`CREATE`, `UPDATE`) AC1/AC2 parameterize over; no support files needed (Doubles `none`; the framework test client and the H2 test database are pre-existing).

## Envelope per repository

`payments-api`: `pom.xml` — proof-relevant: **no** (inspected: `surefire` plugin, Spring Boot starter test, H2 test-scope dependency; no property here selects what these tests observe or which implementation they observe); `src/test/resources/application-test.yml` — proof-relevant: **yes** (inspected: its `spring.datasource.url` selects the H2 in-memory database as the storage AC2's read-back and P1's unchanged-registration assertions observe — storage selection, skill T9; the logging level has no such effect). The validation message text AC1 asserts on is not an envelope concern: AC1 asserts the field name, and the message text lives in `src/main/resources/messages/validation.properties`, production source.

## Relied-on existing tests

none — E3's existing tests (`MerchantWebhookRegistrationServiceTest`) cover blank/malformed-URL validation, not P1's readability invariant; no test is honestly `COVERED BY` for P1.

## Anchor per repository

`payments-api`: active anchor `eeee5555ffff6666aaaa1111bbbb2222cccc3333` [TOOL] (`git -C payments-api log -1 --format=%H`, fictional tool output). Staged-set record [TOOL] (`git -C payments-api status --porcelain=v2 --branch`, taken immediately before the commit; fictional tool output), showing exactly one entry: `1 A. N... 000000 100644 100644 0000000000000000000000000000000000000000 5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e src/test/java/com/payments/webhook/MerchantWebhookRegistrationApiTest.java`.

## Contract command per repository

`payments-api`: `mvn -q -Dtest=MerchantWebhookRegistrationApiTest test` [TOOL] (fictional tool output) — discovered and executed all five contract identities: `rejectsNonHttpsEndpointUrlNamingTheField(Operation)[1] CREATE` — RED, `rejectsNonHttpsEndpointUrlNamingTheField(Operation)[2] UPDATE` — RED, `acceptsHttpsEndpointUrlAsToday(Operation)[1] CREATE` — PASS, `acceptsHttpsEndpointUrlAsToday(Operation)[2] UPDATE` — PASS, `existingRegistrationRemainsReadableUnchanged` — PASS, matching the Contract map.

## Interface evidence

none — no `I` row (PLAN.md: Dependencies and interfaces `None`).

## Coverage gaps

none.

## Pre-existing test conflicts

none — E3's expectations (blank/malformed URLs rejected) are not contradicted by AC1's non-`https` rejection.

## Contract self-check

1. Every AC/`P` row in PLAN.md appears in the Contract map: yes (AC1, AC2, P1).
2. The WITNESS test's assertion targets the clause's Then at Observed at (E2), for both discovered parameter identities (`[1] CREATE`, `[2] UPDATE`): yes.
3. No forbidden double is present (Doubles `none` throughout, real endpoint and real service): yes.
4. Both contract-command runs (RED-REPORT.md) show identical per-test identities and results across all five discovered invocations: yes.

## Correction rounds

none.

## Amendments

none.
