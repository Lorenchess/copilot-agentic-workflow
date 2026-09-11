# Source excerpts — PAYMENTS-12410

**Everything below is fictional** — invented for illustration, as in `TEST-CONTRACT.md`, `RED-REPORT.md`, and every other file in this directory; none of it corresponds to a real repository. These are the focused excerpts TEST-CONTRACT.md's Envelope classification and RED-REPORT.md's Failure locus rest on.

## `payments-api: src/test/java/com/payments/webhook/MerchantWebhookRegistrationApiTest.java` — `#rejectsNonHttpsEndpointUrlNamingTheField(Operation)` (AC1)

```java
enum Operation { CREATE, UPDATE }

@ParameterizedTest(name = "[{index}] {0}")
@EnumSource(Operation.class)
void rejectsNonHttpsEndpointUrlNamingTheField(Operation operation) {
    String candidateUrl = "http://merchant.example.com/hook";
    ResponseEntity<ValidationErrorBody> response;

    if (operation == Operation.UPDATE) {
        ResponseEntity<RegistrationBody> existing = testClient.post()
            .uri("/api/webhooks/registrations")
            .bodyValue(new RegisterWebhookRequest("https://merchant.example.com/hook"))
            .exchange()
            .toEntity(RegistrationBody.class);
        assertThat(existing.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String id = existing.getBody().getId();

        response = testClient.put()
            .uri("/api/webhooks/registrations/{id}", id)
            .bodyValue(new RegisterWebhookRequest(candidateUrl))
            .exchange()
            .toEntity(ValidationErrorBody.class);
    } else {
        response = testClient.post()
            .uri("/api/webhooks/registrations")
            .bodyValue(new RegisterWebhookRequest(candidateUrl))
            .exchange()
            .toEntity(ValidationErrorBody.class);
    }

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThat(response.getBody().getFieldErrors())
        .extracting("field")
        .containsExactly("endpointUrl");
}
```

The nested `Operation` enum and this method occupy lines 8–42 of the fictional test class (the enum at line 8, the shown method at lines 10–42); the shared final assertion both parameter invocations fail at is `MerchantWebhookRegistrationApiTest.java:38` — the UPDATE branch (arranging an existing registration at lines 16–23, then PUTting the candidate at lines 25–29) and the CREATE branch (lines 30–36) both fall through to the same two-line `assertThat` block at lines 38–41, so RED-REPORT.md's Failure locus for `[1] CREATE` and `[2] UPDATE` is identically line 38.

## `payments-api: src/test/resources/application-test.yml`

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:payments-api-test
logging:
  level:
    com.payments: WARN
```

## `payments-api: pom.xml` (fragment)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
</plugin>
```

The `pom.xml` test dependencies and the `surefire` plugin select nothing these tests observe — no provider, adapter, profile, or fixture-state property is present — so TEST-CONTRACT.md's Envelope classifies `pom.xml` `proof-relevant: no`. The `application-test.yml` `spring.datasource.url`, by contrast, selects the H2 in-memory database as the storage `#acceptsHttpsEndpointUrlAsToday(Operation)` (both `[1] CREATE` and `[2] UPDATE`) and `#existingRegistrationRemainsReadableUnchanged` read a registration back from — storage selection is a proof-relevant effect under skill T9 — so that file is classified `proof-relevant: yes` (its logging level has no such effect; the classification follows the property, not the file type). `#rejectsNonHttpsEndpointUrlNamingTheField(Operation)` asserts on the error body's field name, not on message text, for both discovered parameter identities; the validation message text itself comes from `src/main/resources/messages/validation.properties`, which is production source, not envelope.
