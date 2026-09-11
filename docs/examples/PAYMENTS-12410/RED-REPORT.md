```yaml
artifact: RED-REPORT.md
run: PAYMENTS-12410
primaryJira: PAYMENTS-12410
status: RED
producedBy: tester
inputs: [PLAN.md]
```

## Command per repository

`payments-api`: `mvn -q -Dtest=MerchantWebhookRegistrationApiTest test`, run twice consecutively [TOOL] (fictional tool output). Both runs discovered and executed all five contract identities (`rejectsNonHttpsEndpointUrlNamingTheField(Operation)[1] CREATE`, `rejectsNonHttpsEndpointUrlNamingTheField(Operation)[2] UPDATE`, `acceptsHttpsEndpointUrlAsToday(Operation)[1] CREATE`, `acceptsHttpsEndpointUrlAsToday(Operation)[2] UPDATE`, `existingRegistrationRemainsReadableUnchanged`) against the Contract map, with identical per-test identities and results on both runs.

## RED evidence

The one WITNESS method's two discovered parameter invocations, T6's six-line shape, each compact:

**`#rejectsNonHttpsEndpointUrlNamingTheField(Operation)[1] CREATE`**
- Expected: HTTP 400 Bad Request whose validation-error body names field `endpointUrl`; the literal assertion: `assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST)`, then `assertThat(response.getBody().getFieldErrors()).extracting("field").containsExactly("endpointUrl")` (`MerchantWebhookRegistrationApiTest.java:38–41`).
- Observed: HTTP 201 Created — the `http://` URL was accepted and a new registration was persisted directly via POST [TOOL].
- Failure locus: `assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST)` at `MerchantWebhookRegistrationApiTest.rejectsNonHttpsEndpointUrlNamingTheField(Operation)[1](MerchantWebhookRegistrationApiTest.java:38)`, quoted from the fictional surefire output below.
- Setup: the Given arranges a registration request whose `endpointUrl` is `http://merchant.example.com/hook` (non-`https`) posted directly to the existing registration endpoint (CREATE — no prior arrangement needed); the request is well-formed and reached the endpoint, as the observed `201 Created` and the persisted registration themselves show — the failure is the acceptance of the `http` scheme, not a malformed request or a wrong precondition.
- Why this proves the clause is unsatisfied: the endpoint currently accepts any well-formed URL regardless of scheme on creation (E4, `NOT_FOUND` — no scheme check exists), so Observed (`201 Created`) directly contradicts AC1's required rejection.
- Validity: `compiled/loaded at eeee5555ffff6666aaaa1111bbbb2222cccc3333: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes`.

**`#rejectsNonHttpsEndpointUrlNamingTheField(Operation)[2] UPDATE`**
- Expected: HTTP 400 Bad Request whose validation-error body names field `endpointUrl`; the same literal assertion, same locus (`MerchantWebhookRegistrationApiTest.java:38–41`).
- Observed: HTTP 200 OK — the existing registration (arranged with `https://merchant.example.com/hook`, `201 Created`, id captured) was updated to the `http://` URL and persisted via PUT [TOOL].
- Failure locus: `assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST)` at `MerchantWebhookRegistrationApiTest.rejectsNonHttpsEndpointUrlNamingTheField(Operation)[2](MerchantWebhookRegistrationApiTest.java:38)` — the same shared locus as `[1] CREATE`, quoted from the fictional surefire output below.
- Setup: the Given first arranges an existing registration by POSTing `https://merchant.example.com/hook` (asserted `201 Created`, id captured), then PUTs the non-`https` candidate URL to `/api/webhooks/registrations/{id}`; the arrangement's own success is asserted inline before the candidate is submitted, so the failure is not a wrong precondition.
- Why this proves the clause is unsatisfied: the update path shares the same unvalidated step (E1) as creation, so a non-`https` URL is likewise accepted on update today, directly contradicting AC1's required rejection for the update operation — and exercising this shows Q1's shared-validation-step assumption held, rather than assuming it.
- Validity: `compiled/loaded at eeee5555ffff6666aaaa1111bbbb2222cccc3333: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes`.

## Preservation results

- `#acceptsHttpsEndpointUrlAsToday(Operation)[1] CREATE` — PASS on both runs [TOOL]. Asserts `201 Created` for an `https` endpoint URL submitted via POST, and again for `HTTPS://` (Risk 1, case-insensitivity), with each registration readable back through the endpoint; passes today because `https` submissions already succeed on creation (E1) and must keep passing once AC1's rejection exists.
- `#acceptsHttpsEndpointUrlAsToday(Operation)[2] UPDATE` — PASS on both runs [TOOL]. Asserts `200 OK` for an `https` endpoint URL submitted via PUT to an existing registration, and again for `HTTPS://`, with each update readable back through the endpoint; passes today because `https` submissions already succeed on update as well (E1 — the same unvalidated step handles both operations) and must keep passing once AC1's rejection exists.
- `#existingRegistrationRemainsReadableUnchanged` — PASS on both runs [TOOL]. Asserts a pre-existing registration (seeded with an `http` endpoint URL, predating this change) reads back through the endpoint unchanged; passes today and must keep passing, since AC1 only changes what is accepted going forward (E1), never an existing row.
- Relied-on baselines: none — no relied-on existing test was used (TEST-CONTRACT.md's Relied-on existing tests).

## Evidence excerpt

Fictional surefire output, run 1:

```text
[INFO] Running com.payments.webhook.MerchantWebhookRegistrationApiTest
[ERROR] Tests run: 5, Failures: 2, Errors: 0, Skipped: 0, Time elapsed: 0.417 s
[ERROR] rejectsNonHttpsEndpointUrlNamingTheField(Operation)[1] CREATE  Time elapsed: 0.071 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <400 BAD_REQUEST> but was: <201 CREATED>
	at com.payments.webhook.MerchantWebhookRegistrationApiTest.rejectsNonHttpsEndpointUrlNamingTheField(MerchantWebhookRegistrationApiTest.java:38)
[ERROR] rejectsNonHttpsEndpointUrlNamingTheField(Operation)[2] UPDATE  Time elapsed: 0.084 s  <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <400 BAD_REQUEST> but was: <200 OK>
	at com.payments.webhook.MerchantWebhookRegistrationApiTest.rejectsNonHttpsEndpointUrlNamingTheField(MerchantWebhookRegistrationApiTest.java:38)
[INFO] acceptsHttpsEndpointUrlAsToday(Operation)[1] CREATE  Time elapsed: 0.093 s  -- PASS
[INFO] acceptsHttpsEndpointUrlAsToday(Operation)[2] UPDATE  Time elapsed: 0.102 s  -- PASS
[INFO] existingRegistrationRemainsReadableUnchanged  Time elapsed: 0.067 s  -- PASS
```

Run 2 (fictional tool output, compact): identical identities and results — `rejectsNonHttpsEndpointUrlNamingTheField(Operation)[1] CREATE` and `[2] UPDATE` both `<<< FAILURE!` at the same shared locus (`MerchantWebhookRegistrationApiTest.java:38`) with the same `AssertionFailedError` types (`<201 CREATED>` and `<200 OK>` respectively); `acceptsHttpsEndpointUrlAsToday(Operation)[1] CREATE` PASS; `acceptsHttpsEndpointUrlAsToday(Operation)[2] UPDATE` PASS; `existingRegistrationRemainsReadableUnchanged` PASS.

## Confirmation

Every contract identity was discovered and executed — all five: `rejectsNonHttpsEndpointUrlNamingTheField(Operation)[1] CREATE`, `[2] UPDATE`, `acceptsHttpsEndpointUrlAsToday(Operation)[1] CREATE`, `[2] UPDATE`, `existingRegistrationRemainsReadableUnchanged`; the WITNESS method's two parameter invocations each failed for their own assertion on the response status and field name, not a compile or setup error; all three PRESERVATION invocations (`#acceptsHttpsEndpointUrlAsToday(Operation)[1] CREATE`, `[2] UPDATE`, and `#existingRegistrationRemainsReadableUnchanged`) passed as expected; results reproduced identically on a second run [TOOL].

## Amendment re-proof

none — no test-change request was made or approved during this run.
