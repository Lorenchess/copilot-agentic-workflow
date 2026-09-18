# Phase 3 — Acceptance-Test Quality, RED Proof & Test-Contract Integrity
## Architecture Proposal (Claude, for owner review)

Status: **DRAFT — not approved, not implemented.** Written 2026-09-10 against current `main` (`c3904cf`, the administrative Phase 2 closure commit). Locked baselines: `phase-1-reference` → `03d4230`, `phase-2-reference` → `5a46eb7`; neither tag is moved and no Phase 1 or Phase 2 contract is edited. No repository asset has been changed by this proposal. Delegation target verified: `model: "sonnet"` resolves to Claude Sonnet 5 / `claude-sonnet-5`. Sonnet has not been invoked for implementation.

Phase 3 question: **How does Tester convert the approved Phase 2 plan into an executable definition of correctness that genuinely protects the Developer/Verifier workflow?** Phase 3 deepens Tester, TEST-CONTRACT.md, RED-REPORT.md, and test-change semantics. It touches Planner, Developer, Verifier, and `pipeline` only at the interfaces those semantics require, and it does not redesign implementation strategy or the Verifier's broader review (Phase 4).

---

## 1. Current-state assessment

### 1.1 What Phase 1 and Phase 2 already solve (keep)

Every row is cited to the locked files so the assessment is a demonstrated baseline, not a summary.

| Established mechanism | Where |
|---|---|
| Tester runs before Developer; tests derive from the approved plan only; Tester never writes production code or pushes. | `tester.agent.md` Role and purpose, Inputs (PLAN.md only) |
| WITNESS must be proven RED for the acceptance condition itself; PRESERVATION must pass before and after; a passing test is never labelled RED; a criterion is never weakened to manufacture RED; bounded two-attempt correction, then `TESTS_NOT_RED`. | `tester.agent.md` step 6; contract §14 amendment 2 |
| PRESERVATION baseline failure is diagnosed (test defect / baseline failure / environment), never normalised as a test defect; `PRESERVATION_BASELINE_FAILED` is one STOP, one decision. | contract A10; `tester.agent.md` step 6 |
| Compile/setup/environment inability is never RED, GREEN, or PASS (`RUNNER_UNAVAILABLE`, verbatim scope). | contract A6; every terminal-holding agent |
| `TEST_BOUNDARY_MISSING` when no existing testable boundary exists; Phase 2 exposes that gap at planning time (`NO EXISTING ROUTE` → `G3`). | `tester.agent.md` step 3; `plan-grounding` R5 |
| Execution envelope recorded (contract command, config files, helper/fixture paths); developer may change envelope files only with justification; changing one so a test is undiscovered/skipped/excluded is forbidden. | contract A4; `developer.agent.md` step 2; `verifier.agent.md` step 6 |
| Three-control test integrity: byte identity at the active anchor, envelope review, identity confirmation from the contract run's output. Byte identity alone is explicitly not integrity. | `GUARDRAILS.md` Test immutability mechanism |
| The only change path is `TEST-CHANGE-REQUEST` → human decision → Tester amends → new active anchor and protected paths → re-proof recorded; a passing amended test is PASS, never RED. | `developer.agent.md` step 5; `tester.agent.md` Amendment procedure |
| Verifier runs the contract command and the full suite as two required executions; neither replaces the other. | contract A4; `verifier.agent.md` step 3 |
| Assertions target observable business outcomes (persisted state, returned value, emitted call with arguments, timing where required), never an invocation count or an HTTP status alone. | `AGENT-CONTRACTS.md` tester "Assertion quality" |
| Index-scope check before every `add`/`commit`; tester stages only paths it created under test directories. | `tester.agent.md` Procedure |
| Phase 2 gives Tester: requirement items with `PRESERVED` disposition, change class, typed repository evidence (`RESPONSIBLE_COMPONENT`, `ADJACENT_TEST`, `NOT_FOUND`, `CROSS_REPO_CALL`, `INTERFACE`), an operative Affected files table, interface rows with field-level contracts and failure behavior, per-criterion Observed at / Preconditions / Path, combined-outcome statements, Preservation expectations `P1…`, and G3-confirmed decisions folded into PLAN.md (a replacement answer is a `SEND_BACK`, so PLAN.md always reflects the decision). | `plan-grounding` R1–R7; `docs/examples/PAYMENTS-12345-planning/PLAN.md` |

### 1.2 Concrete remaining test-quality weaknesses

Each weakness is shown against the Phase 1 worked example (`docs/examples/PAYMENTS-12345/`) or the Phase 2 LARGE plan, so it is a demonstrated gap.

**W1 — The mapping records *which* test, not *how* it proves the criterion.** TEST-CONTRACT.md's Scenario-to-test mapping is `AC → test name`. Nothing records the test level, the outcome actually asserted, or the double boundary. AC4's test `recordsRetryAttemptInAuditLog` "posts to the internal endpoint" and reads `AuditLogRepository` — is the repository real, in-memory, or stubbed? The contract does not say, so neither Developer nor Verifier can tell whether persistence was ever exercised. (Failure modes: *HTTP status asserted while persistence is wrong*, *test names exist but don't prove the criterion*.)

**W2 — Doubles are unconstrained.** The six AC5/AC1–AC3 tests use "the fake `LedgerClient`" and `FakeClock`. The rule "assert the observable outcome, not a proxy" does not say what may be doubled, whether the responsible component must be real, or that a double's canned return must never be the expected outcome itself. A test that mocks `WebhookRetryService` and verifies the mock was called with `PERMANENTLY_FAILED` satisfies every current rule and proves nothing. (Failure modes: *every test mocked so integration behavior is never exercised*, *tests mirror implementation*, *mock called without argument/business-state assertions*.)

**W3 — Cross-repository interface conformance is unchecked.** The consumer-side tests (`payments-api`) assert against a fake ledger; the provider-side test (`payments-ledger`) posts a request the tester shaped itself. Nothing ties both to `I1`'s field list (`deliveryId`, `attemptNumber`, `outcome`, `entity_type = WEBHOOK_DELIVERY` …). Each repository can go GREEN while the request `payments-api` actually emits is one the `payments-ledger` endpoint rejects. (Failure mode: *a multi-repo change passes each repository independently but the interface between them is incompatible*.)

**W4 — Tester-created support files are developer-editable.** `FakeClock.java` and `AuditLogTestFixtures.java` are listed under the *execution envelope*, alongside `pom.xml`. The developer may change an envelope file "when the implementation genuinely needs it" with a justification; the verifier treats an envelope change as a finding, FAIL only if unjustified or if it undiscovers/skips/excludes a test. A justified edit to `FakeClock` that changes what "scheduled delay sequence" means passes every control while the WITNESS's meaning silently changes. (Failure modes: *helpers/fixtures change test meaning*, *developer games tests through config*.)

**W5 — RED evidence has no required shape and no locus rule.** RED-REPORT.md's Failure reasons in the example are good prose ("`FakeClock`'s recorded scheduled-delay sequence is empty instead of `[1s, 2s, 4s]`") and the report states, as a one-off observation, that "no production code was added by this agent, so each compiles cleanly". Neither the expected-versus-observed shape nor the "failure must occur at the test's own assertion, on a tree where the test compiles and the same run's PRESERVATION tests pass" rule is written anywhere. A RED produced by a `NoSuchMethodError` in a fixture, or by an unrelated failing test in the same class, is not excluded by the contract text. (Failure mode: *RED exists only because setup is broken*.)

**W6 — No one reviews the tests before Developer implements against them.** The plan has the Adversary; the implementation has the Verifier; the test contract — the artifact the whole workflow calls the definition of "done" — has no independent reader. The Verifier confirms identities, results, and byte identity, by design never assertion quality; the Developer has the wrong incentive; the human never sees tests. W1–W5 therefore reach GREEN unchallenged. (Failure mode: every one above, unobserved.)

**W7 — All-or-nothing RED and all-or-nothing environment.** `TESTS_NOT_RED` and `RUNNER_UNAVAILABLE` are whole-test and whole-stage. A criterion whose behavior partially exists (retry exists, backoff does not) has no representation other than "one test that must be RED"; an environment where unit tests run but DB-backed tests cannot stops the entire stage with no route to a lower-level substitute or a disclosed gap. (Failure modes: *missing environment presented as evidence* on one side, *ceremony too expensive* on the other.)

**W8 — Preservation has no bound and no discretion rule.** Phase 2 supplies `P1…` rows, but nothing says whether Tester may add PRESERVATION tests beyond them, on what basis, or how many. The Phase 1 example invented both PRESERVATION tests at test time; a more cautious Tester would invent twelve. (Failure mode: *PRESERVATION tests become an uncontrolled regression suite*.)

**W9 — Test levels are undefined.** Nothing tells Tester when a unit test suffices and when an API-level or cross-system test is required; Phase 2's Observed at names the route but not the minimum level that honestly observes it. (Failure modes: *E2E chosen when a unit test suffices*, *unit test chosen when the criterion is cross-system*.)

**W10 — The amendment path has no content rule, no effect classification, and no distinction between a test bug and a plan change.** A `TEST-CHANGE-REQUEST` is "the test, the reason, and the proposed change". The human decides without the Tester's assessment; a request that quietly relaxes the criterion and a request that fixes a wrong fixture look alike; a request that really changes acceptance behavior (a plan change after G3) has no rule sending it back to a planning cycle. An amendment that changes only how a test observes and one that narrows what it demands are recorded identically. (Failure modes: *Developer pressures Tester into easier tests*, *test amendments lose evidence lineage*.)

**W11 — Determinism is unspecified.** `FakeClock` exists because the example's tester was careful; RK1 in the Phase 2 plan explicitly defers "a deterministic time source" to Phase 3. No rule covers clocks, sleeps, randomness, ordering, async completion, or environment state, and RED is proven from a single run.

**W12 — Contract-command completeness is a habit, not a rule.** The example annotates "(runs all seven methods in the class)". Nothing requires Tester to confirm from the run's output that every named identity was discovered — the same check the Verifier performs later, absent at the moment the contract is formed.

**W13 — An approved behavior change can make a pre-existing test obsolete, and nobody may touch it.** Tester edits only files it creates; Developer edits only non-test files; the full suite at stage 7 will then fail on the obsolete test and the run has no in-pipeline route. Phase 2's `ADJACENT_TEST` evidence rows (E5, E10 in the LARGE plan) make this predictable at stage 5, but no rule uses them.

### 1.3 What must remain unchanged

- The nine roles; the four gates; every existing STOP code and its wording; Sonnet-5 for every role.
- Tester operates before Developer, from PLAN.md, and never writes production code, edits build/config files, or pushes.
- WITNESS / PRESERVATION as the two classifications; RED never manufactured; passing tests never called RED; `TESTS_NOT_RED` bounded; `TEST_BOUNDARY_MISSING`; `PRESERVATION_BASELINE_FAILED` diagnosis; `RUNNER_UNAVAILABLE`'s verbatim scope ("could not verify ≠ failed ≠ passed").
- The three-control integrity mechanism and its commands; the change-request path as the only route around it; the Verifier's two executions; artifact ownership and immutability; provenance tags; the tool lists of every agent (no new tool, no MCP, no terminal for the Adversary).
- Phase 2's PLAN.md fields as the Tester's input — Phase 3 consumes them; it does not re-derive requirements, re-decide `Q` rows, or re-open G3.
- `docs/examples/PAYMENTS-12345/` byte-identical; both reference tags; both historical contracts.

---

## 2. Phase 3 success criterion

At the end of Phase 3, for a LARGE test-stage example built on the Phase 2 LARGE plan and for the SMALL example extended through stage 5, a reader who opens only PLAN.md, TEST-CONTRACT.md, RED-REPORT.md, and TEST-REVIEW.md can determine, without running anything:

1. for every acceptance criterion and preservation expectation, which test proves it, at what level, through which observable outcome, with which boundaries doubled and which real — or the recorded reason it cannot be tested here;
2. for every WITNESS, what the expected business result was, what was observed instead, where the failure occurred, and why that failure demonstrates the criterion is unsatisfied — and that the failure is not a compile, fixture, environment, or unrelated-test failure;
3. for every cross-repository interface, that the consumer's emitted request and the provider's accepted request were checked against the same field list;
4. which files are protected (immutable until an approved amendment), which are envelope (developer-changeable with justification), and which pre-existing tests the contract relies on;
5. that every amendment records what changed, its effect on the criterion (observation-only, narrowing, broadening, support-only), the Tester's assessment, the decision, and the honest observed result;
6. that an independent reader challenged the contract against a stated catalogue before Developer started, with every finding resolved or carried as a residual;

and the SMALL example's TEST-CONTRACT.md stays short (target: under ~50 lines with normal spacing, a soft presentation target), which is the proof that the proportionality rule works.

---

## 3. Proposed Tester behavior

Design principle, unchanged from Phase 2: every improvement is a policy rule, an artifact field, an evidence expectation, or a review question. No runner, harness, or schema.

**Inputs.** PLAN.md (immutable, as today) plus the new policy skill `.github/skills/test-contract/SKILL.md`, read explicitly at the start of the procedure — the intake/plan-grounding pattern. Tester still never reads INTAKE.md, RUN.md, or ADVERSARY-REVIEW.md; PLAN.md carries every decision it needs (a replacement G3 answer produces a new plan, so decisions are in the plan, never in the gate log).

**How Tester uses the Phase 2 inputs (without re-doing Planner's job).**

| PLAN.md field | Tester use |
|---|---|
| Requirement items, disposition | `PRESERVED` items → their `P` rows → PRESERVATION tests. `IMPLEMENTED` items → their AC ids. `EXCLUDED`/`UNRESOLVED` items are never tested. |
| Change class | Test depth (§14), review depth (§13). Never re-derived. |
| `RESPONSIBLE_COMPONENT` evidence | The component that must be **real** in the test (§8). |
| `ADJACENT_TEST` evidence | Where existing tests live (placement, conventions, fixtures to reuse), which existing tests sit on the modified boundary (§6, §12). |
| `NOT_FOUND` evidence | The expected reason a WITNESS is RED ("no retry orchestration exists — E6"); cited in RED-REPORT.md's *Why this proves*. |
| `INTERFACE`, `CROSS_REPO_CALL`, `I` rows | The boundary that may be doubled on the consumer side, and the field list both sides' tests must conform to (§10). |
| Affected files (EDIT entries) | The modified boundary used to bound discretionary PRESERVATION tests (§6). |
| AC: Observed at | The minimum test level and the assertion target (§5, §4). A test that does not observe the outcome at that route (or a lower route that genuinely shows the same state) does not prove the criterion. |
| AC: Preconditions | The Given setup; a test whose Given differs is a different scenario. |
| AC: Path NEGATIVE | Its own test, always. |
| Combined outcomes | One test per stated combined case. |
| Risks `ACCEPTED` naming test conditions (e.g. RK1 clock) | Determinism controls the tests must supply (§9). |
| `Q` rows routed `ASSUMED` | Never tested as criteria; noted only if a test's setup depends on the assumption. |

**Procedure shape (stage 5).** Read the skill → read PLAN.md → detect runner (unchanged) → for each AC and P row decide the test level, observation, doubles, classification, and determinism controls per the skill, recording an inability where one exists → write tests and any needed support files (all new, all under test directories) → run the contract command; confirm from the output that every contract identity was discovered → apply the RED-validity rules per WITNESS; run a second time and require the same per-test results → write the RED evidence → self-check → commit → record TEST-CONTRACT.md and RED-REPORT.md → return. Stage 5b (§13) then challenges the contract; on REVISE, Tester is re-invoked for one correction round before hand-forward.

**Re-invocations.** Unchanged in kind: correction round after a test-review REVISE (new, §13), amendment after an approved `TEST-CHANGE-REQUEST` (extended, §12), assessment before a `TEST_CHANGE_REQUESTED` STOP is voiced (new, §12), and recording a `PRESERVATION_BASELINE_FAILED` decision (unchanged).

---

## 4. Criterion-to-test mapping design

Replace TEST-CONTRACT.md's two tables (Scenario-to-test mapping, Test classification) with one **Contract map**, one row per test, and a short **Proves** line per test. Fields were kept only where a Developer, Verifier, reviewer, or human would act differently without them.

| Column | Content | Audit value |
|---|---|---|
| Test | `repository: path#identity` — the exact identity the contract command and the Verifier match. | Identity confirmation (existing control). |
| Criterion | AC/P id and, when the test covers one clause of a multi-clause criterion, the clause ("AC5, terminal-with-unreported, `DELIVERED` case"). | Coverage completeness; partial-behavior representation (§6). |
| Level | `UNIT` / `SERVICE` / `API` / `UI` / `E2E`, plus a one-line reason tied to the criterion's Observed at (§5). | Detects level-too-low and level-too-high. |
| Observes | The outcome asserted, in business terms, matching Observed at ("persisted `WebhookDelivery.status` via the existing repository"). | Detects proxy assertions (§7). |
| Doubles | `none`, or `boundary → kind` per doubled boundary (`LedgerClient → RECORDER`, `Clock → FAKE`). | Detects mock-the-implementation and tautologies (§8). |
| Classification | `WITNESS` or `PRESERVATION`, with basis: the `P` id, or the evidence/Affected-files id for a discretionary preservation test, or the developer decision for a reclassified/excluded test (existing). | Bounds the regression suite (§6). |
| Expected before implementation | `RED` or `PASS`; for a deferred test, `NOT_EXECUTED` (§11). | Verifier's classification expectation; environment honesty. |
| Determinism | `none`, or the controls in one line (`fake clock; scheduled delays asserted, never waited`). | Repeatability (§9). |

**Proves line (per test):** one sentence: "Fails when `<business outcome>` is absent because `<literal assertion in words>`; passes only when `<the Then>` holds." This is what the reviewer and the human read; the table is what the Verifier and Developer read.

**Inability rows.** A criterion or clause with no test is never silent. It appears in the map with Test `—` and one of: `TEST_BOUNDARY_MISSING (raised)`, `NOT_EXECUTABLE_HERE (see Execution limitations)`, or `COVERED BY <other test id>` (a clause proven by another row). Every AC and P row in PLAN.md appears at least once; the reviewer's first check is that diff.

**Other TEST-CONTRACT.md sections (retained or added):** Protected paths per repository (replaces Test file paths; §11) · Envelope per repository (pre-existing files only; §11) · Relied-on existing tests (§6) · RED commit SHA per repository (unchanged) · Contract command per repository, with the identity-completeness confirmation (§7) · Interface conformance (LARGE with `I` rows; §10) · Execution limitations (§11) · Contract self-check (§13) · Correction rounds (§13) · Amendments (extended; §12).

---

## 5. Test-level selection policy

One rule, then a table, then two prohibitions. Not a taxonomy.

**Rule.** Choose the lowest level at which the criterion's *Then* is observed at the route PLAN.md names in Observed at (or a lower route that shows the identical state), with the responsible component real (§8). If a lower level can only observe a *proxy* for that outcome, it is the wrong level.

| Criterion shape (from PLAN.md) | Sufficient level, usually | Not sufficient |
|---|---|---|
| Business rule, calculation, state transition observable as a returned value or persisted state of one component | `UNIT` or `SERVICE` (the service with a real or in-memory repository) | `API` adds cost without evidence unless serialization or status mapping is the criterion |
| Validation error shape, response fields, status mapping, filters, pagination, content negotiation (Observed at names an endpoint's *response*) | `API` (the real controller/route, embedded server or framework test client) | `UNIT` of the validator alone — it proves the rule, not the contract the caller sees (the SMALL example's AC1 "validation error naming the field" is an `API`-level criterion) |
| Persistence outcome (row written, column value, migration-dependent read) | `SERVICE` with the repository's real mapping against the embedded/in-memory database the repository already uses in its tests; `API` when the criterion is the endpoint's persistence | A stubbed repository: the persistence *decision* would then be the double's |
| Emitted call to another system with specific arguments | `SERVICE` with a `RECORDER` at the client boundary, arguments asserted | `verify(called)` without the arguments |
| UI behavior (rendered state, interaction outcome) | `UI` component test | `E2E` unless the journey crosses systems |
| Cross-system journey where neither side's Observed at shows the business result | `E2E`, only when §10's conformance evidence cannot prove it and the environment can run it; otherwise §10 + §11 | — |

**Prohibitions.** (1) Never choose a level because it is easier to make RED. (2) Never choose `E2E` to avoid deciding a double boundary. The level and its reason are recorded per test (§4); the reviewer checks the reason against Observed at, not the label.

**Proportionality.** SMALL work typically has one level for all tests. LARGE work mixes levels by criterion; it never requires "one of each".

---

## 6. WITNESS / PRESERVATION refinement

**Classification is per test, per clause — never per criterion.** A criterion whose behavior partially exists is split at the clause level in the Contract map (§4). "Retry exists without backoff": `retries up to the configured maximum` is PRESERVATION (basis: evidence row showing existing retry, or the `P` row if the planner wrote one); `delays follow exponential backoff` is WITNESS. "Endpoint exists but does not persist one field": the endpoint's existing outcome is PRESERVATION on the modified boundary; the missing field is WITNESS asserting the persisted column. The all-or-nothing reading of RED is removed by construction: RED is required of the WITNESS rows, not of the scenario.

**When the whole criterion already passes.** Unchanged: after the bounded investigation, `TESTS_NOT_RED` → developer decides. Phase 3 adds the recorded outcome for the decision "behavior already exists": the test stays in the contract as `PRESERVATION — ALREADY_SATISFIED (developer decision, TESTS_NOT_RED)` with the developer's reason; the plan's evidence gap (a `NOT_FOUND` that was wrong) is noted in the map, never corrected by the Tester.

**When PRESERVATION is warranted.** Exactly these, in priority order:
1. every `P` row in PLAN.md (required, one test each, or `COVERED BY` an existing relied-on test);
2. the existing clauses of a partially existing criterion (above);
3. at Tester's discretion, behavior on a modified boundary that the change directly threatens — bounded to what an Affected files `EDIT` entry or a cited evidence row names, at most one or two per modified boundary, each with its basis recorded in the Classification column;
4. nothing else. A PRESERVATION test with no `P` id, no partial-criterion clause, and no modified-boundary basis is out of contract and is removed at self-check or by the review.

**Relied-on existing tests.** Before writing a discretionary PRESERVATION test, Tester checks the `ADJACENT_TEST` evidence: if an existing test already asserts the constraint, Tester records it under **Relied-on existing tests** (`repository: path#identity — covers P2`) instead of duplicating it. Relied-on tests are not protected paths (the Tester did not create them) but the Verifier diffs them since the anchor exactly as it diffs envelope files: any change is a finding, and one without an approved amendment is FAIL. They are executed by the Verifier's full-suite run, not by the contract command, so the contract command stays the tester-created set.

**Reclassification and exclusion** (`PRESERVATION_BASELINE_FAILED`) are unchanged.

---

## 7. RED evidence requirements

RED-REPORT.md's *Failing tests* and *Failure reasons* sections are replaced by one **RED evidence** section: per WITNESS, five short lines.

- **Expected:** the business result, then the literal assertion in words ("delivery persisted `PERMANENTLY_FAILED`; asserted `status.name() == "PERMANENTLY_FAILED"`").
- **Observed:** what the tree produced ("`FAILED`; no retry orchestration ran").
- **Failure locus:** the assertion inside the test method (or the expected-exception check), quoted from the tool output. Never a setup, fixture, compile, resolution, or runner error.
- **Why this proves the criterion is unsatisfied:** one sentence tying Observed to the plan's evidence of absence ("E6: no retry/backoff logic exists; the observed single attempt is exactly that absence").
- **Validity:** `compiled at <RED SHA>: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · reproduced on second run: yes`.

**RED validity rules (normative in the skill).** A WITNESS failure is legitimate RED only when all hold: (1) the test compiles/loads at the RED commit — a WITNESS references only symbols that exist at that commit; a new status value, field, or endpoint is observed through its representation (`status.name()`, the JSON field, the route) not through a not-yet-existing symbol, and "cannot resolve symbol" is never RED; (2) the failure occurs at the test's own assertion on the criterion's outcome; (3) the same run's PRESERVATION tests pass, which shows the fixtures and environment work; (4) no other test's failure or error is present in the run except other WITNESS rows' own assertion failures; (5) the run is reproduced once — two consecutive runs of the contract command with identical per-test results (the second run is the determinism check, §9, and costs one runner invocation). RED caused primarily by compilation unrelated to the criterion, a missing dependency or setup, unavailable infrastructure, a syntax error, an unrelated failing test, a broken fixture, or a runner failure is not RED: it is corrected (test defect, within the existing two-attempt budget) or it is `RUNNER_UNAVAILABLE` (§11).

**Contract-command completeness.** RED-REPORT.md's Command section records, per repository, the identities the output shows as discovered and executed against the Contract map's identities; a missing identity is corrected before RED is claimed. This is the Verifier's stage-7 check performed once at stage 5, where a wrong command is cheap.

**Evidence excerpt and Confirmation** are unchanged in role; the Confirmation sentence gains "…and every contract identity was discovered; results reproduced on a second run".

---

## 8. Mocking / test-double policy

One principle, one vocabulary, five prohibitions, one recording rule. Mocks are not banned; integration tests are not required where a unit test proves the behavior.

**Principle — real inside, doubled at the edge, doubles observe.** The component that owns the criterion's behavior (`RESPONSIBLE_COMPONENT` evidence) and every collaborator inside the same repository that participates in producing the *Then* are real. A boundary may be doubled when it crosses a process or I/O edge — another repository or service (`CROSS_REPO_CALL`, `INTERFACE`), a database (only when persistence is not the criterion), a message broker, the clock, randomness, the filesystem, the network. A double at such an edge exists to **observe** (record arguments, hold state the test asserts) or to **supply an input the criterion's Given requires** (the ledger call fails once). It never supplies the outcome the criterion is about.

**Vocabulary (recorded in the Doubles column).** `REAL` · `EMBEDDED` (the repository's existing in-memory/embedded substitute, e.g. H2, an in-memory broker the tests already use) · `FAKE` (a state-bearing substitute whose state the test asserts, e.g. `FakeClock`, an in-memory repository) · `RECORDER` (captures calls and arguments for assertion) · `STUB` (returns canned data to satisfy a Given). A `MOCK` in the "verify it was called" sense is a `RECORDER` whose arguments are asserted, or it is a proxy.

**Prohibitions.** (1) Doubling the responsible component, the method under test, or any collaborator whose behavior is part of the criterion. (2) A tautology: a `STUB` whose canned return value is, or determines, the asserted outcome. (3) Verifying a call without asserting the arguments that carry the business content, when the criterion names that content ("recorded with delivery id, attempt number, outcome"). (4) Doubling persistence in a test whose criterion is persistence; use `EMBEDDED` or `FAKE` with asserted state. (5) Shaping a cross-repository double from the implementation's convenience rather than from the `I` row's field list (§10).

**When mocking destroys the signal.** If, after applying the principle, a test's Doubles column would contain the responsible component or the outcome-producing path, the level is wrong (§5) or the criterion is a `TEST_BOUNDARY_MISSING` case — not a case for a bigger mock.

**Recording.** Per test, `Doubles: none` or the boundary → kind list. Doubles are tester-created support files under the test tree (§11) or the repository's existing test doubles cited by `ADJACENT_TEST` evidence; never a new test-scope dependency (§11).

---

## 9. Determinism policy

Expectations, not a framework. Applied where a test touches the named condition; recorded in the Determinism column only when a control was needed.

| Condition | Expectation |
|---|---|
| Clock / time | Inject or fake the clock (`FAKE`); assert scheduled delays and timestamps as values; never sleep to let time pass; a real-time wait is never an assertion. |
| Randomness | Seed it or replace the source; a criterion about randomness asserts distribution properties on a seeded sequence. |
| Ordering | Assert order only where the criterion requires it; otherwise compare as sets/multisets; never depend on hash or map iteration order. |
| Async | Await a completion signal the code exposes (future, latch, callback, message receipt); never a fixed sleep; a timeout is a guard against hanging, never the assertion. |
| Retries / backoff | Configure attempt counts and delays through the existing configuration the test controls; drive attempts through the fake clock. |
| Environment state | Each test creates its own data with unique identifiers and leaves the shared state as it found it; no dependence on execution order between tests. |
| External dependencies | Doubled at the edge (§8) or `EMBEDDED` via what the repository's tests already use; Tester introduces no new infrastructure or dependency. |

**Repeatability proof.** The second contract run (§7) must reproduce every per-test result; a test whose result differs between the two runs is a test defect (bounded correction) and never RED or PASS. Support files that implement these controls (fake clock, seeded source, latch helper) are tester-created protected files (§11).

---

## 10. Cross-repository testing approach

For every `I` row in PLAN.md (a LARGE change by R2), TEST-CONTRACT.md gains an **Interface conformance** table — the lightweight contract test, requiring neither a running peer service nor Pact-style tooling:

| Column | Content |
|---|---|
| Interface | `I1`, provider → consumer, the field list from the row's *contract* column, verbatim. |
| Consumer-side test | The consumer repository's test that exercises the real consumer code path with a `RECORDER`/`FAKE` at the client boundary, asserting the **emitted** request's fields and values against the field list; and the `NEGATIVE` test exercising the row's *failure behavior* (the double returns the failure shape the row states, e.g. `LedgerReportException`). |
| Provider-side test | The provider repository's test that exercises the real provider entry point with a request **shaped from the same field list**, asserting the provider's outcome (persisted row, returned body). |
| Match | `YES` / `NO` — the tester's inspection that both tests reference the identical field names, types/representations, and enumerated values; a `NO` is corrected before RED is claimed, or recorded as an inability if the mismatch is in the plan (then it is a plan defect: the Tester never reconciles the interface itself — `TEST_BOUNDARY_MISSING`-style STOP text "interface fields disagree with I1", developer decides). |
| Deployment compatibility test | Only when the `I` row's *deployment compatibility* names a required behavior (e.g. "consumer tolerates the endpoint's absence via `UNREPORTED`"): the consumer-side NEGATIVE test above is the evidence; otherwise `n/a — <reason>`. |

**When E2E is required.** Only when the criterion is a cross-system journey whose *Then* neither side's Observed at shows (the row above cannot prove it) **and** the environment can execute it. If it cannot, §11 applies: the conformance table is the evidence and the gap is disclosed, never presumed closed.

**What the table does not do.** It does not run one repository's tests against the other's code, does not generate stubs, and does not replace the Verifier's per-repository runs. It makes the two testers' (one Tester, two repositories) shared assumption explicit and reviewable.

---

## 11. Execution-envelope / helper / fixture policy

**Two sets, distinguished by who created the file — the smallest useful rule.**

- **Protected paths** (immutable from the RED commit until an approved amendment; Developer may never edit; Verifier's byte-identity diff covers all of them): every file the Tester created — test files **and** tester-created support files: fixtures, fakes, recorders, test data builders, fake clocks, test-scope configuration files the Tester creates under the test tree. This closes W4: `FakeClock` moves from envelope to protected.
- **Envelope** (pre-existing files the contract depends on; Developer may change with justification; Verifier diffs since the anchor; unjustified or test-excluding change is FAIL — unchanged rule): build files, pre-existing test configuration, pre-existing shared fixtures and doubles the tests reuse (cited via `ADJACENT_TEST`).
- **Relied-on existing tests** (§6): diffed like envelope files; executed by the full suite.

**What the Tester may create.** Anything under the repository's test source tree that the tests need and the repository lacks: fixtures, fakes, recorders, builders, a fake clock, a test-profile configuration file. All new files, all listed as protected, all committed with the tests.

**What the Tester may not do.** Edit any pre-existing file (test or production, including `pom.xml`, `package.json`, existing test configuration); add a test-scope dependency; create production code under the guise of a helper (a class the production code would compile against is scaffolding). A needed library or scaffolding that does not exist is `TEST_BOUNDARY_MISSING` with the specific item named ("no HTTP-client recorder exists and none can be built without a new dependency") — the developer approves it as scope (Developer then adds it as an envelope change) or redirects.

**Environment limitations — per test, three outcomes, one existing STOP.**
1. Prefer a level that runs here when it proves the same criterion (an `EMBEDDED` database instead of the unavailable Postgres, when the persistence *mapping* is not the criterion) — recorded as the test's level reason.
2. When the only valid level cannot execute here (the criterion *is* the real-database behavior, the broker, the external service), the Tester designs the test, records it under **Execution limitations** (criterion, level required, condition, proposed substitute test id or `none`, and the residual gap in words), and raises `RUNNER_UNAVAILABLE` with the per-test condition text — the existing code and message shape; the resolution options gain one: **accept the substitute as the contract test with the disclosed gap**, alongside fix-the-environment-and-resume and abort. The deferred test is not committed (it would error in the Verifier's full-suite run) unless the repository already has an exclusion convention the Tester can use without editing build configuration; its design stays recorded for CI.
3. Never: labelling a non-executed test RED or PASS; presenting the substitute as proving what it does not; omitting the limitation from TEST-CONTRACT.md. The Verifier's Contract test run carries the Execution limitations section forward verbatim so the gap reaches G4 and the PR description through VERIFICATION.md.

Environment limitation is recognised by the A6 criteria only; a test that cannot be made RED for any other reason is `TESTS_NOT_RED`.

---

## 12. Amendment / test-change policy

**Two rules above everything.** (1) *An amendment may change how a test observes; it may never change what a criterion requires.* A change to acceptance behavior is a plan change: it is not amendable, it is a `SEND_BACK`-class decision that starts a new planning cycle, which supersedes TEST-CONTRACT.md and RED-REPORT.md (A6/A8 already do this). (2) *Every amendment keeps its lineage*: original RED anchor and failing assertion, the approved delta, the effect classification, the new anchor, the observed result.

**Trigger table.**

| Case | Who raises | Route | Outcome recorded |
|---|---|---|---|
| Test contains a bug (wrong fixture, wrong setup, wrong literal) | Developer, `TEST-CHANGE-REQUEST` | Assessment → STOP → approval → Tester amends | Effect `OBSERVATION_ONLY` or `SUPPORT_ONLY`; observed result honest (PASS or RED with the assertion) |
| Tester misunderstood the requirement (test contradicts PLAN.md's Then/Observed at) | Developer, citing the AC clause | Same | Effect classified by what the assertion now demands; if `NARROWS`, voiced as such |
| Implementation reveals the observation route is unusable (Observed at cannot be exercised as planned) | Developer | Same; or Tester raises `TEST_BOUNDARY_MISSING` on assessment | `OBSERVATION_ONLY` (new route to the same outcome) or STOP |
| New repository evidence changes the boundary (e.g. an existing consumer the plan missed) | Developer | If the outcome changes → plan cycle; if only the route → amendment | — |
| Plan changed after G3 (developer wants different acceptance behavior) | Developer | **Not an amendment.** Tester's assessment returns `PLAN_CHANGE`; `pipeline` voices it as the existing G3-style decision (send back → new cycle) | TEST-CONTRACT.md untouched; superseded by the cycle |
| Amended test passes because behavior already exists | Tester, on re-run | Record `PASS — RED not re-proven after amendment`; classification unchanged unless the developer reclassifies via the existing `TESTS_NOT_RED` decision options | Stage-5b re-review of the amended test only (§13) |
| Pre-existing test made obsolete by an approved criterion (W13; owner decision D2) | Tester at stage 5 (predicted from `ADJACENT_TEST`) or Developer at stage 6 | `TEST-CHANGE-REQUEST` naming the pre-existing file; on approval Tester amends **only the approved delta** and the file joins the protected paths at the new anchor | Lineage as above |

**Request content (Developer interface, minimal).** A `TEST-CHANGE-REQUEST` names: the test identity; the assertion or setup line at issue; the PLAN.md clause it conflicts with or the defect it shows (evidence, `[TOOL]` output); the proposed change stated as an observation change; and an explicit statement whether the criterion's required outcome is unchanged. A request without the last two is returned by the assessment as `INCOMPLETE` before any STOP is voiced.

**Assessment before the STOP (anti-pressure control, owner decision D4).** On a `TEST-CHANGE-REQUEST`, `pipeline` first re-invokes Tester in assessment mode: Tester reads the request entry and the test, and appends to TEST-CONTRACT.md's Amendments section an assessment: effect `OBSERVATION_ONLY` / `SUPPORT_ONLY` / `NARROWS` / `BROADENS` / `PLAN_CHANGE` / `INCOMPLETE`, with one sentence of reason and a recommendation (apply / decline / plan cycle). `pipeline` voices `TEST_CHANGE_REQUESTED` with both the request and the assessment. The human decides; on approval the Tester applies exactly the approved delta. A `NARROWS` amendment that is approved is applied and recorded as `NARROWS (approved by developer)`; it is never hidden, and it is re-reviewed at stage 5b. The Developer never sees the Tester's assessment before the human does, and the Tester never sees IMPLEMENTATION.md beyond the request entry.

**Amendment execution (extended, otherwise unchanged).** Only the named test(s), only the approved delta; index-scope check; contract run twice; per-test observed result; new active anchor; Amendments entry with lineage; RED-REPORT.md Amendment re-proof entry with the §7 five-line shape for any test recorded RED. A change to any other protected path rides along nowhere: the Verifier's diff at the new anchor covers it.

---

## 13. Independent test-quality review recommendation

**Recommendation: yes — option B, narrowed, bounded, proportional, with no human gate.** The Adversary performs a read-only test-contract challenge between RED and Developer (stage 5b), writing a twelfth artifact, TEST-REVIEW.md.

**Why a review is needed.** The test contract is the one consequential artifact no independent reader ever checks (W6). Its failure modes (mocked SUT, proxy assertion, RED-by-setup, interface mismatch, wrong level) are invisible to the Verifier by design and to the human by design. They are cheapest to fix before Developer implements to them and most expensive after GREEN, where fixing a weak test means an amendment and possibly re-implementation. The pipeline already accepted an equivalent cost for plans (Adversary) on the same reasoning.

**Options weighed.**

| Option | Quality benefit | Cost | Verdict |
|---|---|---|---|
| A. No extra review | none | none | Leaves W6 open; the only unreviewed critical artifact stays unreviewed. |
| B. Adversary, narrow post-RED challenge | High: reads the actual test code against the contract's claims, PLAN.md's Observed at/`I` rows, and the skill's catalogue; catches W1–W5 before Developer | One read-only subagent call per run; at most one Tester correction round; one new artifact and one new STOP code | **Recommended.** |
| C. Verifier reviews afterward | Low: after GREEN, the wrong agent (mechanical by design), the wrong time; a FAIL would send Developer to fix tests it may not touch | Verifier scope creep into Phase 4 | Rejected. |
| D. Tester self-check only | Medium-low: makes claims explicit and falsifiable but the same model that wrote the tests checks them | Near zero | Kept **in addition** (Contract self-check section), not instead. |
| New agent ("test critic") | Same as B | A tenth role, new tool list, new model-role row | Not justified: the Adversary already has exactly the tools (read/search, own-artifact edit, no terminal) and the disposition (challenge, never author). |

**Design of B.**
- **Trigger:** after stage 5 returns RED, for every change class (uniform flow; depth is proportional — a SMALL contract is two tests and a five-minute read; the SMALL example's AC1 is precisely where a proxy assertion of "HTTP 400 only" would slip through). Also re-invoked, on the amended tests only, after an amendment recorded `NARROWS` or `PASS — RED not re-proven`.
- **Inputs:** the `test-contract` skill (its challenge section), PLAN.md, TEST-CONTRACT.md, RED-REPORT.md, the protected test files (repository read), and the cited evidence locations where a check needs them. No terminal: it does not run tests; it checks that RED-REPORT.md's evidence is coherent with the test code (the reported assertion message exists in the file; the failure locus is inside the test method) and that the contract's claims match what the code does.
- **Method (the challenge section of the skill), each row with an evidence expectation:** map completeness against PLAN.md's AC/P ids · assertion target versus Observed at, read from the code · double boundary (responsible component real; no tautology; arguments asserted) · level sufficiency · RED validity (locus, expected/observed in business terms, second-run reproduction) · partial-behavior classification honest · preservation bounded to §6's bases · negative/boundary/combined cases from PLAN.md present · determinism controls where the condition exists · interface conformance fields identical · command completeness · protected/envelope split correct (every tester-created file listed protected) · execution-limitation honesty · amendment effect (re-review only).
- **Output:** TEST-REVIEW.md (owner: adversary): Verdict `ACCEPT` / `REVISE` · Checks performed (recorded even when nothing is found; a zero-finding ACCEPT is legitimate, as in `challenge-plan`) · Findings `id · category · severity · evidence · what the contract must show or change` · Residual findings · Round. No `BLOCK`: block-worthy conditions already have STOPs (`TEST_BOUNDARY_MISSING`, `TESTS_NOT_RED`, `RUNNER_UNAVAILABLE`), and a finding says "raise it".
- **Severity → verdict:** HIGH (a WITNESS whose assertion does not target the criterion's outcome; the responsible component doubled; RED at a non-assertion locus; a missing AC/P row; an interface field mismatch; a tester-created file listed as envelope) → REVISE. MEDIUM (missing boundary case the plan names; discretionary preservation without basis; level reason absent) → fixed or residual. LOW → note.
- **Bounded loop:** initial review, then at most one Tester correction round (stage 5 re-invocation: corrections, both contract runs, new RED commit — recorded under TEST-CONTRACT.md's Correction rounds with the superseded RED SHA — then a second review). A second REVISE raises `STOP [TEST_REVIEW_REVISE_LIMIT]: The test contract still has a HIGH finding after one correction round. Decision needed from: developer. Accept the contract as-is (residual findings recorded), redirect the tester (one human-directed round), or abort.` The human sees the residuals; no routine gate.
- **Human gate:** none. Stage 5b is silent on ACCEPT. The human is involved only at the existing STOPs and the new revise-limit STOP.

**Cost/benefit statement.** Per run: one read-only agent call always; one correction round sometimes; one STOP rarely. Against that, every W1–W5 failure mode gets one independent reading at the only cheap moment. Same-model caveat as Phase 2: procedural independence only (different inputs — the reviewer reads code, the Tester's claims, and the plan; a different catalogue; no terminal), not independent errors; MODEL-ROLES.md records it.

**Why the challenge catalogue lives in the same skill the Tester reads.** For plans, hiding the review method from the constructor protects independence of *judgment*. For tests, the catalogue is a list of objective defects (doubled SUT, tautology, proxy, wrong locus); the Tester should know them, and the review's independence comes from a second reader with the code in front of it, not from secret criteria. One skill, two readers, one section marked "challenge". The owner may split it later at no design cost.

---

## 14. Proportional test-depth behavior

Reuse Phase 2's change class. No new classification.

| | SMALL | MEDIUM | LARGE |
|---|---|---|---|
| Contract map | One test per AC and per `P` row; inability rows | Same, plus boundary values where a criterion names a limit/count and every combined-outcome statement | Same as MEDIUM |
| Levels | Usually one level | By criterion | By criterion; E2E only per §10 |
| Doubles | Rule applies; Doubles column usually `none` or one edge | Rule applies | Rule applies; cross-repository doubles shaped from `I` rows |
| Preservation | `P` rows only, unless a modified boundary is obvious | `P` rows plus bounded discretion (§6) | Same |
| Interface conformance | `n/a` | `n/a` unless an `I` row exists | Required per `I` row |
| Determinism column | Only where a condition exists | Same | Same; second run always (every class) |
| Self-check | Four lines (map, assertion target, doubles, RED locus) | Full catalogue, `n/a — reason` allowed | Full |
| Stage 5b review | Yes, proportionate (few checks apply) | Yes | Yes |
| Execution limitations | Rare | As needed | As needed |

Rules that apply to every class regardless: the RED validity rules (§7), the double principle (§8), the observable-outcome rule, protected/envelope split (§11), lineage on amendment (§12). A one-line validation change yields a TEST-CONTRACT.md of roughly two map rows, two Proves lines, one protected path, one command, four self-check lines.

---

## 15. Human UX impact

No new routine gate. Where the human is touched:

- **Existing STOPs, unchanged:** `TESTS_NOT_RED`, `TEST_BOUNDARY_MISSING` (now also used for a missing test library/scaffolding item and an `I`-row field disagreement, each with a specific condition), `PRESERVATION_BASELINE_FAILED`, `RUNNER_UNAVAILABLE` (now per-test capable, with one added resolution option: accept the substitute with the disclosed gap).
- **`TEST_CHANGE_REQUESTED`, improved:** the human now sees the request *and* the Tester's effect assessment (D4) and decides once, as today. A `PLAN_CHANGE` assessment is voiced as the existing send-back decision.
- **New, rare:** `TEST_REVIEW_REVISE_LIMIT` after one correction round; three options mirroring the plan loop.
- **Silent on the happy path:** stage 5b ACCEPT produces no prompt. Developers approve no individual test.
- **G4 unchanged in wording;** VERIFICATION.md carries Execution limitations and amendment effects forward so the PR description's Testing section can state them — `pr.agent.md` is not modified in Phase 3 (it reads VERIFICATION.md already).

---

## 16. Phase boundaries and compatibility

**With Phase 2 (consumed, not changed).** PLAN.md's fields are read as §3's table; `plan-grounding` and `challenge-plan` are untouched; `planner.agent.md` needs no change — the interface language Phase 3 needs (Observed at, `P` rows, `I` field lists, `ADJACENT_TEST`, `NOT_FOUND`) already exists. Phase 3 does not re-open G3: a Tester finding that the plan is wrong is routed through the existing STOPs, never fixed in the contract.

**With Phase 4 (deferred, named).** Developer's implementation strategy, IMPLEMENTATION.md's content beyond the request shape in §12, the Verifier's judgment beyond the mechanical additions below, semantic verification of an amended-and-passing WITNESS at stage 7, and matching beyond operative paths remain Phase 4.

**Compatibility requirements identified explicitly (not silently changed):**

- **C-1 Twelfth artifact.** TEST-REVIEW.md (owner: adversary) enters the ownership matrix, FLOW.md's resume list, `skills/pipeline/SKILL.md`'s eleven-artifact list, RUN.md's Stage status table (stage 5b) and Artifact history. Resume rule unchanged in shape; TEST-REVIEW.md missing → resume at 5b.
- **C-2 Protected versus envelope.** TEST-CONTRACT.md's "Test file paths per repository" becomes "Protected paths per repository" (tests + tester-created support files); the Verifier's immutability diff takes that list; the envelope holds pre-existing files only; "Relied-on existing tests" join the envelope diff. Developer's forbidden "edit any path listed in TEST-CONTRACT.md" is re-worded to "any protected path". `GUARDRAILS.md`'s three-control text and least-privilege row ("own new files" → "own new test and support files") change accordingly. The Phase 1 example, which lists `FakeClock` under envelope, is left byte-identical; the comparison guide notes the difference.
- **C-3 Adversary inputs.** The Adversary's inputs extend to TEST-CONTRACT.md, RED-REPORT.md, the protected test files, and the `test-contract` skill, in a second mode; its `tools:` list is unchanged; its ownership gains TEST-REVIEW.md.
- **C-4 `pipeline` sequencing.** Stage 5b inserted; one correction round; the assessment step before `TEST_CHANGE_REQUESTED`; relay of `TEST_REVIEW_REVISE_LIMIT`; the added `RUNNER_UNAVAILABLE` resolution. The G3 wording, G4 wording, and every other gate are untouched.
- **C-5 Pre-existing test amendment (D2).** If accepted, the locked "Tester `git add`s only paths it created" is narrowed to "…or a pre-existing test path named in an approved amendment, for the approved delta only". `.vscode/settings.json` is unaffected (the `add` slot is a path class, not an ownership check).
- **C-6 STOP catalogue.** One code added (`TEST_REVIEW_REVISE_LIMIT`); no existing code or message changed; `RUNNER_UNAVAILABLE` and `TEST_BOUNDARY_MISSING` gain condition text and resolution options without changing their shape.
- **C-7 Bounded loops.** One sentence added: "Adversary/Tester (test review): one initial review plus at most one correction round; `TEST_REVIEW_REVISE_LIMIT` on the second REVISE."

---

## 17. Exact files proposed for modification

| File | Change |
|---|---|
| `.github/skills/test-contract/SKILL.md` **(new)** | The normative test-contract policy T1–T14 (§4–§12, §14) and the challenge section (§13). `user-invocable: false`, `disable-model-invocation: true`; read explicitly by `tester` and, in test-review mode, by `adversary`. |
| `.github/agents/tester.agent.md` | Reads the skill; Contract map, Proves lines, RED evidence shape, second run, identity completeness, protected/envelope split, support-file rule, Execution limitations, self-check, correction round, assessment mode, extended amendment procedure. Tools unchanged. |
| `.github/agents/adversary.agent.md` | Stage-5b test-review mode: inputs, TEST-REVIEW.md, verdict rules, bounded loop. Tools unchanged. |
| `.github/agents/developer.agent.md` | Minimal: "protected paths" wording; `TEST-CHANGE-REQUEST` content requirements (§12); "an amendment never changes what a criterion requires". |
| `.github/agents/verifier.agent.md` | Minimal: immutability over Protected paths; envelope diff includes Relied-on existing tests; Contract test run carries Execution limitations forward; amendment effect noted in the Test immutability check when an amendment exists. |
| `.github/agents/pipeline.agent.md` | Stage 5b; assessment step at `TEST_CHANGE_REQUESTED`; relay of the new STOP; RUN.md rows for stage 5b; twelve-artifact list. |
| `.github/pipeline/FLOW.md` | Diagram (stage 5b), stages table, stage 5/5b/6/7 narratives, STOP catalogue (+1), bounded loops (+1), resume list (+1). |
| `.github/pipeline/AGENT-CONTRACTS.md` | tester, adversary, developer, verifier, pipeline sections; TEST-CONTRACT.md, RED-REPORT.md, TEST-REVIEW.md, IMPLEMENTATION.md (request shape) templates; ownership matrix (+1 row). |
| `.github/pipeline/GUARDRAILS.md` | Test immutability mechanism (protected/envelope/relied-on); least-privilege tester row; bounded loops sentence. |
| `.github/pipeline/MODEL-ROLES.md` | Tester as a benchmark candidate (assertion-target correctness, double boundary, RED validity as scored dimensions); Adversary's second invocation and the same-model caveat extended to test review. No model change. |
| `.github/skills/pipeline/SKILL.md` | Artifact list (twelve); authorized-regeneration sentence gains "tester correction round". |
| `docs/examples/PAYMENTS-12345-testing/` **(new)** | LARGE test-stage example on the Phase 2 LARGE plan (round `1.2`): `README.md` (boundary and non-validation caveat versus both existing PAYMENTS directories), `RUN.md` through stage 5b, `PLAN.md` copied verbatim from `PAYMENTS-12345-planning/` with a note, `TEST-CONTRACT.md`, `RED-REPORT.md`, `TEST-REVIEW.md`. Demonstrates: mixed classification, `API`/`SERVICE` levels with reasons, doubles at `LedgerClient`/clock only, five-line RED evidence, second-run reproduction, Interface conformance for `I1`, protected `FakeClock`, a proportionate review (a finding only if one is honestly there). |
| `docs/examples/PAYMENTS-12410/` | Extended in place through stage 5b (D5): `TEST-CONTRACT.md` (short), `RED-REPORT.md`, `TEST-REVIEW.md` (ACCEPT, checks recorded), `RUN.md` rows, README boundary line updated. |
| `docs/COMPARISON-GUIDE.md` | tester, adversary (test mode), developer, verifier sections; skill entry; worked-examples section; cross-cutting theme "Executable definition of done". |
| `README.md` | Asset tree, Phase 3 status. |
| `docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md` **(new, after approval)** | The approved form of this proposal; this proposal stays unedited as the reviewed record. |

## 18. Files and areas NOT to modify

- `docs/examples/PAYMENTS-12345/` (all eleven Phase 1 artifacts, byte-identical) and `docs/examples/PAYMENTS-12345-planning/` (Phase 2 LARGE planning example; the testing example copies its PLAN.md rather than editing it).
- `intake`, `workspace`, `pr` agents; `planner.agent.md` (no interface change needed — stated in §16).
- `.github/skills/plan-grounding/SKILL.md`, `challenge-plan/SKILL.md`, `gather-jira-context`, `discover-affected-projects`.
- `.github/copilot-instructions.md`; `.vscode/*` (no new command form: the second run is the same command; tester `add` slot unchanged).
- `docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md`, `docs/specs/2026-09-10-phase-2-planning-quality-contract.md`, the Phase 2 proposal, `docs/specs/archive/`, `docs/reviews/`.
- Both reference tags.
- Nothing from Phase 4 (implementation strategy, Verifier judgment, GREEN iteration) or later (Jira/Bitbucket integration).

## 19. Proposed new skill

One skill, `.github/skills/test-contract/SKILL.md`. Why a skill rather than agent prose: (1) `tester.agent.md` is already the longest agent body; adding §4–§12 inline would bury the procedure; (2) two readers — Tester (construction) and Adversary (challenge) — must apply the same rules, which is exactly the Phase 2 `plan-grounding` precedent; (3) the policy is the most portable Phase 3 asset: an organization with a different pipeline can adopt the level rule, the double principle, the RED validity rules, the amendment effect classes, and the challenge catalogue as a testing policy without this repository's agents; (4) the agent body then references rules instead of restating them, which the Phase 2 reviews found necessary to keep skill/contract/agent text from drifting. Why not two skills (construction + challenge): §13 explains — the test challenge catalogue is a list of objective defects the Tester should know, and the review's independence comes from reading the code, not from hidden criteria. Avoided: a determinism skill, a mocking skill, a cross-repository skill — each would be a page and would fragment one policy.

## 20. Implementation checkpoints

Same working rule as Phases 1–2: Sonnet 5 (`model: "sonnet"`) implements; Claude reviews independently against every acceptance criterion; at most two correction rounds per checkpoint; Claude commits on PASS; push and lock need owner approval.

- **P3-C1 — Policy skill, contracts, agents.** `test-contract/SKILL.md`; tester, adversary, developer, verifier, pipeline agents; FLOW.md, AGENT-CONTRACTS.md, GUARDRAILS.md, MODEL-ROLES.md, `skills/pipeline/SKILL.md`.
- **P3-C2 — Test-stage examples.** `PAYMENTS-12345-testing/` (LARGE) and `PAYMENTS-12410/` extended (SMALL).
- **P3-C3 — Guide, README, closure.** COMPARISON-GUIDE.md, README.md, the Phase 3 contract's closure section with the challenge cases of §21 traced as document scenarios.

## 21. Acceptance criteria per checkpoint

**P3-C1**
- (a) Every rule in §4–§14 lives in exactly one normative place (the skill, or a contract section for representation) and the five agent bodies reference rather than restate it; no contradiction across the skill, AGENT-CONTRACTS.md, FLOW.md, GUARDRAILS.md, the pipeline skill, and the five agent bodies — in particular the protected/envelope definitions, the bounded-loop sentence, the STOP wording, and the amendment effect enum.
- (b) Tester, Adversary, Developer, Verifier, pipeline `tools:` lists byte-identical to `5a46eb7`; no new agent, gate, tool, MCP capability, or setting; exactly one new artifact (TEST-REVIEW.md) and one new STOP code.
- (c) The Contract map columns, Proves line, inability values, RED evidence five-line shape, RED validity rules (compile-at-anchor, own-assertion locus, same-run PRESERVATION pass, no other failures, second-run reproduction), identity-completeness check, double principle and five prohibitions, level rule and table, preservation bases (four, ordered), determinism table, Interface conformance columns, protected/envelope/relied-on definitions, Execution limitations shape and the added `RUNNER_UNAVAILABLE` option, amendment trigger table, request content requirements, assessment effect enum, and the challenge catalogue with per-row evidence expectations are each present and quotable.
- (d) "An amendment may change how a test observes; never what a criterion requires" and its routing to a planning cycle appear in the skill, `tester.agent.md`, `developer.agent.md`, and `pipeline.agent.md` consistently.
- (e) The Verifier's immutability command form is unchanged; only its path input (Protected paths) and the envelope diff input (envelope + relied-on tests) change.
- (f) Stage 5b: uniform for every class; ACCEPT is silent; one correction round; `TEST_REVIEW_REVISE_LIMIT` on the second REVISE; a zero-finding ACCEPT with checks recorded is legitimate; no count sentence.
- (g) `planner`, `intake`, `workspace`, `pr` agents, the two Phase 2 skills, the three Phase 1 skills, `copilot-instructions.md`, `.vscode/*`, both historical contracts, and `docs/examples/PAYMENTS-12345/` and `PAYMENTS-12345-planning/` unchanged (`git diff` empty).

**P3-C2**
- (a) LARGE example: every AC1–AC5 clause and P1–P3 appears in the map (AC5's three combined cases as three rows; AC2 asserting the boundary attempt `maxAttempts`); levels with reasons tied to Observed at (AC4 at `API` with `EMBEDDED` persistence asserted; AC1–AC3, AC5 at `SERVICE` with a real `WebhookDeliveryService`/retry path); Doubles limited to `LedgerClient → RECORDER/STUB` and `Clock → FAKE`; RED evidence in the five-line shape with a second run; Interface conformance for `I1` with `Match: YES` and the NEGATIVE consumer test as deployment-compatibility evidence; `FakeClock` and the fixtures under Protected paths, `pom.xml` and `application-test.yml` under Envelope; P2 shown as `COVERED BY` a relied-on existing test if E10 supports it, otherwise a bounded discretionary test with basis; self-check complete; TEST-REVIEW.md with checks recorded and findings only where honestly present; RUN.md through 5b; README with the non-validation caveat toward both existing PAYMENTS directories.
- (b) SMALL example: two map rows plus one `P` row (or `COVERED BY`), AC1 at `API` asserting the validation error names the field (not status alone), AC2 at the same level, Doubles `none`, four self-check lines, TEST-REVIEW.md ACCEPT with checks recorded, TEST-CONTRACT.md under ~50 lines with normal spacing (soft target; content, not length, is what stays small).
- (c) Every identifier fictional; every RED excerpt shows an assertion failure inside a test method, never a compile or setup error; no example claims execution that did not occur.

**P3-C3**
- (a) Guide entries for the skill, the tester/adversary/developer/verifier changes, the two examples, and the new theme; README current.
- (b) Contract §6 completed by Claude with these challenge cases traced against the delivered files: *a WITNESS that mocks the responsible component* → HIGH at 5b, REVISE, corrected; *RED produced by a fixture error* → fails validity rule (2)/(3), corrected as a test defect, never RED; *the two repositories' tests disagree on an `I1` field* → `Match: NO` caught at stage 5 or HIGH at 5b; *a `TEST-CHANGE-REQUEST` that lowers the required outcome* → assessment `NARROWS`, voiced, applied only if approved and recorded as such, re-reviewed; *a request that changes acceptance behavior* → `PLAN_CHANGE`, planning cycle, contract superseded; *only the DB-backed level can prove a criterion and no DB is available* → Execution limitations, `RUNNER_UNAVAILABLE` with the substitute option, never PASS; *a genuinely small change* → short contract, four-line self-check, silent ACCEPT.
- (c) Both reference tags still resolve to `03d4230` and `5a46eb7`; no historical contract edited.

## 22. Open owner decisions

- **D1 — Independent test-contract challenge (§13).** (a) *Recommended:* Adversary at stage 5b for every change class, TEST-REVIEW.md as a twelfth artifact, one correction round, `TEST_REVIEW_REVISE_LIMIT`, no human gate. (b) Same, but skipped for SMALL (saves a call on the most frequent class; adds a `SKIPPED (SMALL)` state to resume logic). (c) Self-check only — no new artifact, no STOP, W6 stays open and is recorded as an accepted limitation.
- **D2 — Pre-existing tests made obsolete by an approved criterion (§12, W13).** (a) *Recommended:* allow the Tester to amend a pre-existing test file only through an approved `TEST-CHANGE-REQUEST`, for the approved delta only, the file then joining the protected paths — narrows the locked "own files only" rule at exactly one point, keeps "only the Tester edits tests" and "only via the approval path". (b) Keep the locked rule; an obsolete pre-existing test surfaces as a stage-7 full-suite FAIL and is resolved outside the pipeline, recorded as a known limitation.
- **D3 — Environment substitution (§11).** (a) *Recommended:* `RUNNER_UNAVAILABLE` may be raised per test with a proposed lower-level substitute; the developer may accept the substitute with the gap disclosed in TEST-CONTRACT.md, VERIFICATION.md, and the PR. (b) Strict: any unexecutable contract test stops the stage until the environment is fixed.
- **D4 — Tester assessment before `TEST_CHANGE_REQUESTED` is voiced (§12).** (a) *Recommended:* yes — one extra Tester invocation on a rare path; the human sees effect and recommendation alongside the request. (b) No — the human decides on the Developer's request alone, as today.
- **D5 — SMALL example placement.** (a) *Recommended:* extend `docs/examples/PAYMENTS-12410/` in place through stage 5b, updating its README boundary line (the Phase 2 tag is unaffected). (b) A separate `PAYMENTS-12410-testing/` directory duplicating RUN/INTAKE/PLAN.

Everything else in this proposal is a design call I am prepared to make.

## 23. Risks of the Phase 3 architecture itself

- **Same-model review.** Sonnet reviewing Sonnet's tests shares blind spots; procedural independence only. Mitigation: different inputs (code, not claims), an objective catalogue, and MODEL-ROLES.md naming Tester and test-review as benchmark candidates.
- **Ceremony on MEDIUM.** The Contract map and stage 5b add reading to the most common non-trivial class. Mitigation: §14's table, `n/a — reason`, the SMALL example as the yardstick, and no per-test human approval.
- **Adversary role dilution.** A second mode blurs "the plan critic". Mitigation: the mode is named, its inputs are enumerated, its output is a separate artifact; the plan method (`challenge-plan`) is not read in test mode.
- **Twelfth artifact ripples.** Resume list, matrix, pipeline skill, RUN.md rows all change together; a missed reference creates a resume inconsistency. Mitigation: acceptance (a) and (b) check every current-main location, as Phase 2's fix-1 did for the resume predicate.
- **Interface conformance by inspection is not tooling.** `Match: YES` is a model's reading of two files. Stated honestly; the org's contract-testing tooling, if any, supersedes it — a comparison-guide question.
- **Substitution normalises weaker evidence.** D3(a) could become "always accept the unit test". Mitigation: the gap is recorded in three artifacts and voiced at G4; the substitute must be a level that proves the same criterion, not a related one; the reviewer checks the limitation's honesty.
- **The assessment gives the Tester a voice at a human decision.** Could read as the Tester defending its tests. Mitigation: the effect enum is descriptive, the recommendation is one line, the human decides; the alternative (no assessment) leaves the pressure asymmetry in place.
- **Protected/envelope split depends on the Tester listing every created file.** A support file omitted from Protected paths is unprotected. Mitigation: the index-scope check already requires the staged set to equal the intended files; the reviewer checks the staged set (RED commit's file list, `git log`-visible) against Protected paths; a mismatch is HIGH.
- **Second run doubles runner time at stage 5.** Acceptable for the contract command (a class or two); it is not applied to the full suite.
- **Skill length.** Fourteen rule sections plus a catalogue risk a long file. Mitigation: each rule is a paragraph or a table; the P3-C1 review rejects restatement.

## 24. Expected reusable value for the internal pipeline

Portable as-is, independent of Copilot and of this repository's roles: the Contract map columns and the Proves line (§4); the level rule and table (§5); the per-clause classification and the four preservation bases (§6); the RED validity rules and five-line evidence shape (§7); the double principle, vocabulary, and prohibitions (§8); the determinism table and second-run rule (§9); the Interface conformance table (§10); the protected/envelope/relied-on distinction (§11); the amendment trigger table, request content, effect enum, and "observe, never require" rule (§12); the challenge catalogue with evidence expectations (§13); the proportionality table (§14). Each becomes a comparison question ("does the internal pipeline record what each acceptance test doubles, and would a test that mocks the component under test pass its review?", "can an implementer's request to change a test quietly lower what the criterion requires?", "when the environment cannot run a test, does the pipeline record a gap or a pass?").

## 25. Recommendation

**PROCEED_WITH_OWNER_DECISIONS** (D1–D5). On approval, this proposal becomes `docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md`, and P3-C1 is delegated to Sonnet 5 (`model: "sonnet"`, verified `claude-sonnet-5`) with the contract, the locked baselines, and §21's acceptance criteria. Until then nothing is implemented, no Phase 4 work begins, and both reference tags stay where they are.
