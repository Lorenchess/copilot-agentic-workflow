---
name: test-contract
description: Shared test-contract-quality policy — proof boundary and level selection, doubles, per-clause classification and preservation bases, RED evidence shape and validity, determinism, interface evidence, protected/envelope/proof-relevant/relied-on/controlled paths, coverage-gap and NOT_VERIFIED semantics, amendment authority and effect classification, proportionality, and the test-review challenge catalogue. Read explicitly by the tester agent (construction, assessment, amendment) and by the adversary agent in test-review mode (challenge section, after the construction rules); not a slash command.
user-invocable: false
disable-model-invocation: true
---

# `test-contract` — shared test-contract-quality policy

This skill is the normative test-contract-quality policy for stage 5 (Test RED) and stage 5b (Test review) of `FLOW.md`. It is read explicitly by `.github/agents/tester.agent.md` at the start of its procedure — for construction, for assessment mode, and for the amendment procedure — and by `.github/agents/adversary.agent.md` in test-review mode, after the construction rules, for the Challenge section below. It does not auto-load into any conversation. It states what TEST-CONTRACT.md and RED-REPORT.md must contain and how a challenge of them is conducted; it does not state stage sequencing, STOP wording, loop bounds, artifact ownership, or TEST-REVIEW.md's fixed sections — those are normative in `tester.agent.md`, `adversary.agent.md`, `pipeline.agent.md`, `AGENT-CONTRACTS.md`, and `FLOW.md`.

Historically sourced from `docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md` §3 T2–T10, T12 (authority rule, effect enum, candidate-anchor and transition-patch rule), T14, and T11's outcome-first method and challenge catalogue, which remain the normative text if this skill and the contract ever appear to diverge. The Unresolved executions rule at the end of T6, and T7's lost-observation sentence, are sourced from `docs/specs/2026-09-14-harness-execution-observation-amendment.md`, which supersedes only the clauses its §6 names and is read together with the Phase 3 contract.

## T2 — Contract map and Proves lines

TEST-CONTRACT.md's **Contract map** has one row per test (or per uncovered clause):

| Column | Content |
|---|---|
| Test | `repository: path#identity` |
| Criterion | AC/P id, and the clause when the test covers one clause of a multi-clause criterion |
| Level | `UNIT`/`SERVICE`/`API`/`UI`/`E2E`, one-line reason tied to Observed at (T3) |
| Observes | the outcome asserted, in business terms |
| Doubles | `none`, or `boundary → kind` per doubled boundary (T4); a shared declaration may be referenced instead of repeated per row |
| Classification | `WITNESS`/`PRESERVATION`, with basis (T5) |
| Expected before implementation | `RED` / `PASS` |
| Determinism | `none`, or the controls (T7) |

**Proves line** (one per test): "fails when `<outcome>` is absent because `<assertion in words>`; passes only when `<the Then>` holds."

Every AC and `P` row in PLAN.md appears at least once. A clause with no test appears with Test `—` and one of: `TEST_BOUNDARY_MISSING (raised)` · `NOT_VERIFIED (environment: <condition>; partial evidence: <test id> or none)` (T10) · `COVERED BY <test id>`. A criterion whose behavior partially exists is split at clause level: existing clauses PRESERVATION, missing clauses WITNESS. Where clauses relate (delays computed and retries performed), one test observes the combined behavior; unrelated helper tests do not establish the combination.

## T3 — Proof boundary and level selection

**Rule.** The boundary is chosen by the outcome the approved clause requires, never by repository membership or double vocabulary. The test observes the *Then* at the route Observed at names, or at a lower route that shows the identical state, with the code that produces the outcome real. Choose the lowest of `UNIT` · `SERVICE` · `API` · `UI` · `E2E` that is **sufficient**.

| Required outcome | Sufficient evidence | Not sufficient |
|---|---|---|
| Local decision, calculation, state transition, whose criterion is the decision itself | `UNIT`/`SERVICE`; a state-bearing fake repository may hold the state | — |
| Persisted outcome (a row, column, new field, new enum value, migration-dependent read) | The real repository/mapping code against the storage the repository's tests already use (`EMBEDDED`), or the real store when only it exhibits the behavior | A fake repository: it proves the intent to save, not the mapping, transaction, or stored column |
| Response contract: validation error body naming the field, status mapping, serialization, filters, paging | `API` through the real route with the framework's test client/embedded server | `UNIT` of the validator alone |
| Emitted call with business content | `SERVICE` with a recorder at the boundary, arguments asserted | Invocation verified without arguments |
| Changed wire contract between repositories | T8's interface evidence | Domain-object recorder alone |
| UI behavior | `UI` component test | `E2E` unless the journey crosses systems |
| Cross-system journey whose Then neither side's route shows | `E2E` only when T8 cannot prove it and the environment can run it; otherwise T10 | — |

Never choose a level because it is easier to make RED, and never choose `E2E` to avoid deciding a boundary. The level and its reason are recorded per row; the review checks the reason against Observed at.

## T4 — Doubles

**Principle — real inside, doubled at the edge, doubles observe or supply a Given.** The `RESPONSIBLE_COMPONENT` and every collaborator that participates in producing the required outcome are real. A boundary may be doubled where it crosses a process or I/O edge — another repository or service, a store (only when persistence is not the required outcome, T3), a broker, the clock, randomness, the filesystem, the network. A double exists to **observe** (record arguments, hold state the test asserts) or to **supply an input the Given requires** (the ledger call fails once; a lookup returns a fixture).

**Vocabulary** (Doubles column): `REAL` · `EMBEDDED` · `FAKE` (state-bearing; state asserted) · `RECORDER` (calls and arguments asserted) · `STUB` (canned input for a Given).

**Prohibitions**: (1) doubling the responsible component, the method under test, or a collaborator whose behavior is part of the criterion; (2) a double that substitutes for the behavior being proved, or that supplies the asserted result without the required transformation having run (**ordinary input stubs are allowed even when they influence the result**); (3) verifying a call without asserting the arguments that carry the business content when the criterion names that content; (4) doubling persistence when persistence is the required outcome; (5) shaping a cross-repository double from implementation convenience rather than from the `I` row and T8. When applying the principle would leave the responsible path doubled, the level is wrong or the case is `TEST_BOUNDARY_MISSING` — never a bigger mock. Doubles are tester-created support files (T9) or the repository's existing doubles cited by `ADJACENT_TEST`; never a new dependency (T13).

## T5 — Classification, preservation bases, relied-on existing tests

Classification is per test and per clause (T2). WITNESS/PRESERVATION semantics, the bounded-correction rule, `TESTS_NOT_RED`, and the `PRESERVATION_BASELINE_FAILED` diagnosis (test defect / baseline failure / environment) are unchanged from Phase 1. The developer decision "behavior already exists" at `TESTS_NOT_RED` is recorded as `PRESERVATION — ALREADY_SATISFIED (developer decision)` with the plan's evidence gap noted, never corrected by Tester.

**PRESERVATION is warranted only by, in order:**
1. every `P` row (required);
2. the existing clauses of a partially existing criterion;
3. behavior on a modified boundary that the change directly threatens — named by an Affected files `EDIT` entry or a cited evidence row, recorded as the basis; "one or two per modified boundary" restrains discretionary expansion and never authorizes omitting a material invariant — more required behavior or scope uncertainty discovered here is surfaced for planning (existing STOP routes), not silently added or dropped;
4. nothing else.

**Relied-on existing tests.** Where an existing test cited by `ADJACENT_TEST` already asserts a required constraint, Tester records it under Relied-on existing tests (`repository: path#identity — covers P2`) instead of duplicating it, **runs it at stage 5** through the repository's runner scoped to that class, and records its observed baseline result (`PASS` from `[TOOL]` output) and the scoped command used. A relied-on test that is disabled, undiscovered, or failing at baseline cannot supply coverage: it is recorded as such and the clause gets its own test or a `PRESERVATION_BASELINE_FAILED` diagnosis as applicable. At stage 7 the Verifier requires observed execution of every relied-on identity — from the full-suite output or a scoped run — and treats a missing, skipped, or failing relied-on identity as FAIL. Relied-on tests are diffed since the anchor like envelope files (T9).

## T6 — RED evidence, validity, discovery, reproduction

RED-REPORT.md's **RED evidence** section records, per WITNESS, six lines:

| Line | Content |
|---|---|
| Expected | business result, then the literal assertion in words |
| Observed | what the tree produced |
| Failure locus | the assertion or expected-exception check inside the test method, quoted from `[TOOL]` output |
| Setup | one line: how the Given was arranged and why the failure is not a wrong precondition — passing PRESERVATION tests do not establish this WITNESS's own setup |
| Why this proves the clause is unsatisfied | one sentence tying Observed to the plan's evidence of absence |
| Validity | `compiled/loaded at <anchor>: yes · failure at own assertion: yes · same-run PRESERVATION passed: yes · no other failure or error in the run: yes · reproduced on second run: yes` |

**Validity rules.** A WITNESS failure is RED only when all hold: (1) the test compiles/loads at the anchor — it references only symbols that exist there; a new status value, field, or route is observed through its representation (`status.name()`, the JSON field, the path), and "cannot resolve symbol" is never RED; (2) the failure occurs at the test's own assertion on the clause's outcome; (3) the Given was arranged as the Setup line states; (4) the same run's PRESERVATION tests pass; (5) no other test's failure or error appears in the run except other WITNESS rows' own assertion failures; (6) the contract command is run **twice** consecutively with identical per-test identities and results, recorded compactly (identities and results, plus output sufficient to inspect a discrepancy; the full suite is not run twice). A discrepancy between the two runs is **diagnosed with the evidence preserved** — a test defect (corrected within the existing budget), a race or instability in production code (recorded, routed through `TESTS_NOT_RED`/planning as the diagnosis warrants), or environment instability (`RUNNER_UNAVAILABLE`) — never repaired into stability by weakening the expectation. RED caused primarily by compilation unrelated to the clause, missing dependency or setup, unavailable infrastructure, a syntax error, an unrelated failing test, a broken fixture, or a runner failure is not RED.

**Discovery.** RED-REPORT.md's Command section records, per repository, the identities the output shows as discovered and executed against the Contract map; a missing identity is corrected before RED is claimed. Confirmation gains "every contract identity was discovered; results reproduced on a second run".

**Unresolved executions (X2–X6).** Every runner execution Tester launches has an observation state: `OBSERVED` (a terminal, attributable result was captured), `OBSERVATION_LOST` (the host stopped observing before a terminal result; completion unknown), or `ENDED_INCOMPLETE` (the process is known to have ended, but the output is incomplete or not attributable to a result). RED, PASS, and any per-identity result are derived only from an `OBSERVED` execution. For an unresolved execution, Tester records — under RED-REPORT.md's Command per repository / Evidence excerpt — the exact command, repository, observed HEAD and working-tree status before launch, any handle or identity the host exposed (`[TOOL]` or `UNAVAILABLE`), the partial output captured, the observed host timeout value (`[TOOL]` or `UNAVAILABLE`), and the observation state; it derives nothing from that execution, keeps every other execution's independently established `OBSERVED` result, and returns control to `pipeline`. No generic execution allowance exists or is created for this: a replacement runs only as a named execution authorized by a recorded execution reconciliation decision, and it neither consumes nor renews a WITNESS correction attempt. Pair re-establishment: a reconciled-ended lost execution is not an intervening run, so the replacement can complete the required second-run pair; if any other execution or a source change intervened, both runs of the pair are named as replacements. `RUNNER_UNAVAILABLE` still requires its A6 condition to be evidenced — a lost or incomplete observation is never, by itself, that condition.

## T7 — Determinism

Prefer controlled clocks, seeded inputs, completion signals, isolated data, and deliberate ordering. **Clock**: inject or fake; assert scheduled delays and timestamps as values; a real-time wait is not evidence about production scheduling or broker timing. **Randomness**: seed or replace the source. **Ordering**: assert order only where required. **Async**: await a completion signal the code exposes; a fixed sleep is never the mechanism. **Bounded time**: an infrastructure timeout is not an assertion; failure to observe a required event within an approved interval, where the interval is the requirement, is a legitimate assertion — the two are distinct, and "a timeout is never an assertion" is not an absolute. A lost host observation is neither — it is an unresolved execution (T6), never by itself an infrastructure or environment finding. **Concurrency**: where an interleaving is material, use the repository's existing synchronization facilities; no sleep-based flakiness, no custom framework. **Environment state**: each test creates its own data with unique identifiers and leaves shared state as found. **External dependencies**: doubled at the edge or `EMBEDDED` via what the repository's tests already use. The second run (T6) is a repeatability sample, not proof that all races are absent. Controls are recorded in the Determinism column only where a condition exists.

## T8 — Interface evidence

Three kinds of evidence are kept distinct and named as such: **local business evidence** (T3), **interface-conformance evidence**, and **live cross-system evidence** (`E2E`). Neither of the first two establishes transport delivery, deployment availability, or storage-engine behavior that was not exercised.

For every `I` row, TEST-CONTRACT.md's **Interface evidence** table records:

| Column | Content |
|---|---|
| Interface | id, provider → consumer, the field list from the row, verbatim, labelled *design check* |
| Consumer adapter evidence | the test that exercises the real consumer adapter/serialization path and asserts the **encoded** representation at the transport edge, using the repository's existing facility (a mock server or framework transport recorder cited by `ADJACENT_TEST`), plus the `NEGATIVE` test exercising the row's failure behavior through the adapter that translates a real transport failure into the declared exception |
| Provider decoding evidence | the test that exercises the real provider entry point with the encoded representation captured on the consumer side (or one shaped from the field list when capture is not available, labelled as such) and asserts the provider's outcome |
| Conformance | `ESTABLISHED` only when both adapter and decoding evidence exist and agree; `DESIGN_CHECK_ONLY` when only field-list agreement exists; `NOT_VERIFIED` when a side has no executable evidence here (then T10 applies to the interface clause) |
| Deployment-compatibility evidence | the `NEGATIVE` consumer test when the row names a required behavior, else `n/a — <reason>` |

A domain-object recorder at the client interface is local business evidence for the consumer's decision, not interface evidence. A field disagreement between the two sides that traces to the plan is `TEST_BOUNDARY_MISSING` with the condition "interface fields disagree with `I<n>`" — Tester never reconciles the interface.

## T9 — Protected paths, envelope, proof-relevant envelope, relied-on tests, controlled paths

- **Protected paths** — every file Tester created (tests and support: fixtures, fakes, recorders, builders, fake clocks, test-profile configuration under the test tree) and every pre-existing test file adopted through an approved amendment (T12). Immutable from the anchor until an approved amendment; Developer never edits them; the Verifier's byte-identity diff covers all of them.
- **Envelope** — pre-existing files the contract depends on: build files, pre-existing test configuration, pre-existing shared fixtures and doubles. Developer may change an envelope file with a justification under IMPLEMENTATION.md's Envelope changes; the Verifier diffs since the anchor; an unjustified or test-excluding change is FAIL (unchanged). Each envelope entry is marked **proof-relevant: yes/no by effect, never by file type**: yes when the file's content — or a property, profile, or setting within it — determines what a contract test observes or which implementation it observes: provider or adapter selection, storage or profile selection, fixture business state, a double's semantics, clock units, test data, execution scope; no when the content has no such effect (ordinary dependency versions, unrelated build settings). A build file can therefore be proof-relevant, and the entry names the property that makes it so. Tester classifies at stage 5 with the reason; the review checks the classification. **A change to a proof-relevant envelope file is not an ordinary envelope change**: it goes through the amendment path (T12) and is applied by Tester as the approved delta; the Verifier treats a proof-relevant change with no approved amendment as FAIL regardless of the Envelope changes justification. Ordinary (non-proof-relevant) envelope changes stay developer-owned and justified as today.
- **Relied-on existing tests** — T5; diffed like envelope files; observed at verification.

**Controlled paths** = Protected paths + proof-relevant envelope files + relied-on existing tests: the set every transition patch (T12) covers.

Tester may create anything the tests need under the test source tree. **Tester may edit a pre-existing file in exactly one circumstance**: as the approved delta of an amendment that names that file (an adopted test, or a proof-relevant envelope file) — this is the single narrowing of the locked own-files rule, and the Developer agent never edits any controlled path. Tester may not add a dependency or create code the production tree would compile against. A needed library or scaffold is `TEST_BOUNDARY_MISSING` naming the item (T13). Tester records, in TEST-CONTRACT.md, the `[TOOL]` staged-set output of the index-scope check taken immediately before each commit; the review compares it with Protected paths.

## T10 — Coverage gaps: equivalent evidence, partial evidence, `NOT_VERIFIED`, `INCOMPLETE`

When the level that proves a clause cannot execute here (A6 environment conditions only), Tester first seeks **equivalent evidence**: a lower-level test that proves the same clause at the same observable boundary. Equivalence is *explained* in the Contract map row (why the boundary and outcome are the same), *challenged* by the test review (T11, in `adversary.agent.md`), and never decided by the developer. Where no equivalent exists, the runnable test is **partial evidence**, the clause is recorded `NOT_VERIFIED (environment: <condition>; partial evidence: <test id>)` in the Contract map and under **Coverage gaps** (clause, level required, condition, what the partial evidence does and does not show, the deferred test's design), and Tester raises `RUNNER_UNAVAILABLE` with the per-clause condition. The developer's options: fix the environment and resume stage 5 for that clause; **proceed with the gap** (useful local progress; the clause stays `NOT_VERIFIED`); change the requirement through planning (a `SEND_BACK`-class decision starting a new planning cycle); or abort. Proceeding is authorization of progress, never a finding of equivalence. The deferred test is not committed unless the repository already has an exclusion convention usable without editing build configuration.

**Authorized exceptions.** Two developer decisions create an *authorized exception*: proceed-with-gap at `RUNNER_UNAVAILABLE` (environment) and proceed at `TEST_REVIEW_REVISE_LIMIT` (proof defect). An exception is recorded by `pipeline` in RUN.md's decision log naming the clauses and, for a proof defect, the open finding ids it covers; the environment case is also in TEST-CONTRACT.md's Coverage gaps (written at stage 5, so it is inside the review's basis). The exception marks the named clauses `NOT_VERIFIED`; it never marks evidence equivalent, never reclassifies a test, and never touches unaffected evidence. **A closed gap retires its exception from the current `NOT_VERIFIED` set** once the replacement evidence is established and re-reviewed; the RUN.md decision itself is never deleted — it stays as history, distinguishable from the current, still-open set.

**Downstream meaning of `NOT_VERIFIED`** (the minimal interfaces): Developer implements against the whole plan, not only the runnable tests. The Verifier derives the `NOT_VERIFIED` clause set from Coverage gaps plus RUN.md's authorized exceptions **that are still current** — an exception whose gap was closed by recovery and re-reviewed is history, not current, and does not re-enter the set. Its verdict is `PASS` only when that set is empty and every existing PASS condition holds; `INCOMPLETE` when every runnable check passes, the review-basis check (T11, `adversary.agent.md`/`verifier.agent.md`) holds, and the set is non-empty (recorded with the clauses and their source); `FAIL` is unchanged — a real test or implementation failure is FAIL whatever exceptions exist. Recovery, resume routing, and the `VERIFICATION_INCOMPLETE` STOP text are normative in `pipeline.agent.md` and `FLOW.md`, not here.

## T12 — Amendments: authority, effect, anchors (construction rules)

**Authority.** *An amendment may change how a test observes; it may never change what the approved clause requires.* Effect is measured against the PLAN.md clause, not against the old assertion. Human approval of a `TEST-CHANGE-REQUEST` never substitutes for planning.

**Effect enum** (assessment and record): `OBSERVATION_ONLY` (same required outcome, different route, fixture, or literal) · `SUPPORT_ONLY` (support/configuration change with the dependency set named) · `OVERCONSTRAINT_REMOVED` (the defective test demanded more than the clause; the amended test still proves the **entire** approved outcome — legitimate) · `ADOPTION` (a pre-existing test made obsolete by an approved criterion) · `REQUIREMENT_CHANGE` (removes part of the approved outcome, changes success semantics, or accepts different behavior — **not amendable**: routed as a `SEND_BACK`-class decision to a new planning cycle, which supersedes the contract) · `INCOMPLETE` (request lacks required content; returned before any STOP).

**Request content** (Developer or Tester origin): test identity; the assertion or setup at issue; the PLAN.md clause and evidence; the proposed change as an observation change; an explicit statement whether the clause's required outcome is unchanged.

**Candidate anchor and content transition patch (C1).** The commit holding the amended content is the **candidate anchor**, not yet active. With the candidate at HEAD and before it is recorded as the anchor, Tester runs `git -C <dir> diff <prior anchor>..HEAD -- <controlled paths>` — the full content patch over every controlled path (T9), including any path adopted into or removed from protection — and records it verbatim, together with the staged-set record. `git -C <dir> diff --stat <prior anchor>..HEAD -- <controlled paths>` may accompany it as a summary but **never replaces it**: a stat diff cannot establish the approved delta. **The candidate becomes the active anchor only when the re-review (T11, `adversary.agent.md`) finds that the transition patch equals the approved delta and nothing else** — every hunk accounted for, no extra change in an approved file, no change in an unapproved file, membership changes as approved — **and** Tester, re-invoked by `pipeline` in activation mode, has recorded that outcome; otherwise REVISE, and the candidate is superseded by a corrected commit with its own transition patch from the same prior anchor. Activation is recorded by Tester, re-invoked in activation mode by `pipeline` after the ACCEPT (an artifact-only edit that does not supersede the review); mechanics are normative in `tester.agent.md` and `pipeline.agent.md`. A later diff from the new anchor never validates the transition into it. For a stage-5 Tester-origin adoption (T12), no prior anchor exists yet, so the transition evidence is instead the **bare** `git -C <dir> diff` output taken **before any `git add`** in that invocation, recorded verbatim under Pre-existing test conflicts — the recorded diff must touch only the approved path and contain only the approved delta, otherwise Tester does not commit and reports the discrepancy instead; the adopted file joins Protected paths at the RED commit, which becomes the anchor the first `<prior anchor>..HEAD` transition patch is taken from. Tester is the **sole writer** of any amendment delta, on protected, adopted, or proof-relevant envelope paths alike — the Developer agent never edits any controlled path.

Assessment mechanics (who invokes Tester in assessment mode, when the STOP is voiced, how the assessment is appended and voiced) and the Tester-origin `PRE-EXISTING TEST CONFLICT` route are normative in `tester.agent.md` and `pipeline.agent.md`. Full execution mechanics (index-scope check, commit sequence, second run, per-test observed-result recording) are normative in `tester.agent.md`.

## T14 — Proportionality

Reuse the Phase 2 change class; no new classification.

| | SMALL | MEDIUM | LARGE |
|---|---|---|---|
| Contract map | one row per AC and `P` (or `COVERED BY`) | adds boundary values where a criterion names a limit/count, and every combined-outcome statement | same as MEDIUM |
| Levels | usually one | by criterion | by criterion |
| Doubles | typically `none` | rule applies | rule applies; cross-repository doubles per `I` row |
| Preservation | `P` rows only unless a modified boundary is obvious | `P` rows plus bounded discretion (T5) | same |
| Interface evidence | none | none unless an `I` row exists | required per `I` row (T8), levels by criterion |
| Self-check | four-line self-check | full self-check with `n/a — reason` | full |
| Second run (T6) | always | always | always |
| Stage 5b review | one compact pass | proportionate | proportionate |

Every class: T3–T4, T6, T9, T12 lineage apply unchanged. Shared declarations replace repetition; empty sections collapse to one line.

## Challenge section (read by `adversary` in test-review mode)

This section is the independent review method for stage 5b, read after the construction rules above. It governs *how* the test-review challenge is conducted; entry conditions, the one-package rule, Basis content, freshness, dependency-set re-review, the loop, and TEST-REVIEW.md's fixed sections are normative in `adversary.agent.md` and `pipeline.agent.md`, not here.

**Outcome-first method (order is the method).**
1. From PLAN.md alone — before inspecting test source — derive, per clause, the required observable outcome and one or more plausible incorrect behaviors (the proxy, the doubled outcome, the wrong column, the missing combination).
2. Then inspect the test source, the Contract map, doubles, proof-relevant support, RED evidence, and the staged-set record, asking for each clause: *would the incorrect behaviors pass this test?*
3. Work the catalogue below.
4. Record findings `id · category · severity · evidence · what the contract must show or change`; the reviewer identifies defects and the evidence needed, never authors tests.

**Catalogue.** Each category carries a one-line evidence expectation — what the reviewer must have looked at, not merely asserted, before recording "no finding" in that category.

| Category | Evidence expectation |
|---|---|
| Map completeness | Every AC/P id and clause from PLAN.md appears in the Contract map, as a test row or an inability value; a gap is checked against PLAN.md, not against a re-reading of the map alone. |
| Assertion target vs Observed at | The test source is read; the assertion actually targets the clause's Then at the route Observed at names (or a lower route shown equivalent), not a proxy. |
| Boundary and doubles (T3/T4) | The Doubles column and the code agree; the responsible component and its collaborators are real; no prohibited double (T4) is present. |
| Level sufficiency (T3) | The recorded level and reason are checked against the outcome table; a level chosen for ease of RED or to avoid a boundary decision is a finding. |
| RED validity and setup (T6) | RED-REPORT.md's six-line shape and the six validity rules are checked against the test source and the quoted `[TOOL]` output, including the Setup line's arrangement. |
| Clause classification and clause relationships | WITNESS/PRESERVATION classification and any clause split (T5) are checked for basis; a combined-outcome clause is checked for one test observing the combination, not two unrelated tests. |
| Preservation bases and relied-on baselines (T5) | Each PRESERVATION test's basis is one of T5's four, in order; each Relied-on existing test's observed baseline result is recorded and current. |
| Negative/boundary/combined cases from PLAN.md | Every `NEGATIVE` path, named boundary value, and combined-outcome statement in PLAN.md has a corresponding row or an honest inability value. |
| Determinism (T7) | Where a condition (clock, randomness, ordering, async, concurrency) exists in the clause, the Determinism column names a control; its adequacy is checked against T7. |
| Interface evidence kind and conformance value (T8) | For every `I` row, the Conformance value is checked against what adapter/decoding evidence actually exists — a field-list-only agreement recorded as `ESTABLISHED` is a finding. |
| Discovery (T6) | The Command section's discovered/executed identities are checked against the Contract map; a missing identity is a finding. |
| Protected/envelope/proof-relevant split against the staged set | The staged-set `[TOOL]` record is compared with Protected paths; every tester-created file is listed; every envelope entry's proof-relevant classification is checked by effect, never by file type. |
| Coverage-gap and equivalence honesty (T10) | Every `NOT_VERIFIED` row's equivalence claim (if any) is checked against T10 — a non-equivalent substitute presented as equivalent is HIGH; Coverage gaps content is checked for honesty about what is and is not shown. |
| On re-review: transition patch and dependency set (T12) | The transition patch is compared hunk-by-hunk against the approved delta — every hunk accounted for, no extra change in an approved file, no change in an unapproved file, membership changes as approved; the discrimination of amended or later-authored tests against plausible incorrect behaviors (step 1–2 above) is checked; the recorded dependency set is checked for completeness. |

**Severity and verdict.** `ACCEPT` — no unresolved blocking test-quality defect in the current evidence. `REVISE` — a specific correction or an existing STOP is needed. **No `BLOCK`.**

- **HIGH** (→ REVISE): a WITNESS whose assertion does not target the clause's outcome; the responsible path doubled; RED at a non-assertion locus or with an unarranged Given; an AC/P clause missing from the map; a required boundary or combined clause absent; interface conformance claimed beyond its evidence; a non-equivalent substitute presented as equivalent; a tester-created or proof-relevant file outside protection; a discriminating check failing on re-review.
- **MEDIUM**: fixed or residual (a required clause is never left residual while completeness is claimed — severity follows effect).
- **LOW**: note.

Depth follows the contract's actual risks: a SMALL contract gets one compact pass. **A zero-finding ACCEPT with checks recorded is legitimate; no count sentence** ("N findings raised", "M files reviewed") is required or expected to demonstrate independence.

## Mapping to TEST-CONTRACT.md / RED-REPORT.md / TEST-REVIEW.md

| Rule above | Artifact heading it populates |
|---|---|
| T2 | TEST-CONTRACT.md **Contract map**, **Proves** |
| T3 | Contract map **Level** column and reason |
| T4 | Contract map **Doubles** column |
| T5 | Contract map **Classification**; TEST-CONTRACT.md **Relied-on existing tests** |
| T6 | RED-REPORT.md **RED evidence**, **Confirmation** |
| T7 | Contract map **Determinism** column |
| T8 | TEST-CONTRACT.md **Interface evidence** |
| T9 | TEST-CONTRACT.md **Protected paths**, **Envelope**, **Relied-on existing tests**, staged-set record under **Anchor per repository** |
| T10 | Contract map inability rows; TEST-CONTRACT.md **Coverage gaps** |
| T12 | TEST-CONTRACT.md **Amendments** (request, assessment, decision, approved delta, anchors, transition patch, dependency set, observed result) |
| T14 | governs depth of every section above |
| Challenge section | TEST-REVIEW.md **Required outcomes and incorrect behaviors derived**, **Checks performed**, **Findings**, **Residual findings**, **Verdict** |
