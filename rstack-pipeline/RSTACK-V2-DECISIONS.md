# RSTACK V2 decisions

**Status of every entry: PROPOSED — awaiting owner review.** Reviewed source: `main@3e9345166cb387824e3cda36fb46ed940dfeea6d`. These decisions authorize no implementation, new tool permission, test execution, commit or publication.

Evidence labels follow the architecture review: facts are source/configuration observations; inferences concern mechanisms and costs; chosen directions are recommendations. The actual repository is a procedural Copilot reference. Its separate rstack comparison bundle is not authoritative implementation evidence.

## ADR-01 — Review the implementation that is actually available

**Decision:** Keep the Copilot reference and the imported rstack hypothesis distinct.

**Context:** `README.md:3` excludes executable runtime infrastructure. `.github/pipeline/FLOW.md:3` says there is no state machine or scheduler. Named rstack agents/scripts appear only in `rstack-pipeline/`; the real nine roles use different artifacts, approval rules and repository scope.

**Options considered:** Treat the screenshots as source; assume equivalence from similar roles; distinguish the systems and obtain missing source.

**Chosen direction:** Consolidate the real reference if approved. Defer claims about live rstack enforcement, script deletion and installed behavior until its source is available.

**Why:** Similar intent does not establish equivalent ownership, capabilities or gates.

**What becomes simpler:** No invented source mapping, duplicated installation, or attempt to fix a missing runtime in the wrong repository.

**What invariant remains protected:** Evidence cannot be upgraded from reconstructed prose to executable proof.

**What evidence would cause us to revisit this decision:** Exact live rstack checkout/version, authored/generated mapping, scripts, invariant tests and relevant host evidence.

## ADR-02 — One current owner per rule; preserve historical records

**Decision:** Centralize current authority without erasing reviewed history.

**Context:** `HARNESS.md:13`, `plan-grounding/SKILL.md:12`, `test-contract/SKILL.md:12` and `implementation-quality/SKILL.md:14` retain authority in dated contracts and forward amendments. Current agents/contracts/FLOW also repeat substantial procedure.

**Options considered:** Delete old files; pick newest file on conflict; keep every copy “for safety”; explicitly map/supersede operative clauses.

**Chosen direction:** FLOW owns transitions, AGENT-CONTRACTS owns mode IO/schemas, policy skills own engineering semantics, GUARDRAILS owns safety/action policy, and actual frontmatter/settings own configured capabilities. HARNESS indexes the exact supersession map. Keep dated source and review files unchanged.

**Why:** Removing a historical precedence sentence without transferring its clauses could silently remove a protection.

**What becomes simpler:** Contributors change one algorithm rather than reconciling several independently editable copies.

**What invariant remains protected:** Every approved requirement and amendment remains traceable to its successor; chronology is not silently rewritten.

**What evidence would cause us to revisit this decision:** A demonstrated isolated-context failure requiring a short local reminder. That justifies the reminder, not a second full specification.

## ADR-03 — Preserve independent judgment, not a target agent count

**Decision:** Keep existing authors and reviewers separate; use explicit role modes.

**Context:** `adversary.agent.md` has independent plan and test-review modes; `tester.agent.md` owns tests; `developer.agent.md` owns production. AGENT-CONTRACTS' coarse matrix contradicts test-review inputs at rows 157–158.

**Options considered:** Merge Tester and Developer; replace all nine roles with the seven imported names; keep role count while narrowing contracts.

**Chosen direction:** Initially retain nine definitions, correct mode-specific input/output ownership, and preserve independent test challenge. Propose a separate fresh semantic-review invocation after Verifier execution eligibility. Mechanical adapters may replace mechanical role work later.

**Why:** Self-review creates a real failure mechanism; saving two definitions does not establish lower total cost or stronger outcomes.

**What becomes simpler:** Each invocation has one purpose, explicit allowed inputs and one owned result; mode exceptions stop leaking through an inaccurate aggregate table.

**What invariant remains protected:** Implementation does not grade its requirements, tests are independently authored, and review judges more than green tests.

**What evidence would cause us to revisit this decision:** Comparative host runs show a role adds no independent findings and can be removed without shared author/reviewer authority; actual prompt assembly establishes the proposed fresh invocation is isolated.

## ADR-04 — One final candidate for evidence, review and publication

**Decision:** Bind every eligibility claim to the same candidate and proof basis.

**Context:** Actual `GUARDRAILS.md`, Verified commit invariant, binds publication to a verified SHA. Imported proposed approval lines 118–170 integrates after review and returns through tests but not renewed semantic review. Imported handoff-contracts commits an AC matrix whose evidence SHA must equal current HEAD.

**Options considered:** Re-stamp evidence after commits; test only after late integration; pin source before verification and invalidate every dependent result on change.

**Chosen direction:** Create the candidate source commit before final proof. Bind repository identity, source commit/tree, approved requirement revision, controlled-test revision and relevant execution configuration. Keep evidence outside that evaluated commit. Perform integration before final evidence/review; a later content change returns through both.

**Why:** A review of one tree is not a review of a merged tree. Committing a proof file containing its own supposed current commit identity creates a recurring identity problem.

**What becomes simpler:** One freshness predicate replaces scattered SHA updates, late-merge exceptions and AC restamping choreography.

**What invariant remains protected:** The object published is the object independently tested and reviewed. A no-op merge does not require pretending HEAD changed.

**What evidence would cause us to revisit this decision:** A verified immutable-tree-equivalence mechanism proves that a metadata-only change preserves every relevant source/proof input. Do not assume that equivalence from a clean working tree.

## ADR-05 — Separate deterministic checks from prevention and attestation

**Decision:** A small checker may validate prerequisites; only a proven host boundary can enforce capabilities and authenticate observations.

**Context:** `GUARDRAILS.md:57-66` acknowledges unsandboxed runner/hook effects. Its edit protection at line 113 is broader than the actual settings can establish. No rstack script is available here.

**Options considered:** Trust prose; call a role guard a sandbox; add many validators; combine one objective checker with an existing trusted host adapter.

**Chosen direction:** Keep the procedural reference honest. If an enforced profile is approved, reuse organizational containment, capture and action adapters. Consider one pure checker and receipt capture only where absent. Policy, receipts and authorization must be protected from the phase being judged.

**Why:** A schema can prove a field exists, not that an execution happened or a human authorized it. A post-write diff cannot prevent or reverse an escaped write.

**What becomes simpler:** No validator validating a model's narrative about another validator. No broad schema/generator/plugin platform added solely to shorten prompts.

**What invariant remains protected:** Wrong-root writes, forged evidence and self-granted exceptions cannot be represented as prevented without the actual mechanism.

**What evidence would cause us to revisit this decision:** Authorized host negative tests establish filesystem/subprocess/credential scope, receipt provenance, protected policy and exact action authorization; or reveal a containment gap.

## ADR-06 — Distinguish review eligibility from release eligibility

**Decision:** Use explicit prerequisites for useful review and stricter final publication success.

**Context:** Imported `rstack-orchestrator.proposed-simplified.md:122-128` routes PASS to review but a proceedable BLOCKED result to approval; scoped tests are expected to return BLOCKED. Approval then demands a CLEAN review.

**Options considered:** Treat every BLOCKED result as failure; treat scoped success as release PASS; use separate predicates.

**Chosen direction:** Define whether the candidate can be reviewed from current evidence without implying it can ship. Default release requires the full required suite, current independent review, no unproved required clauses and a current human-approved tuple. A waiver must never bypass review.

**Why:** A single overloaded PASS/BLOCKED signal invites loops, skipped review and misleading success.

**What becomes simpler:** The driver selects a transition from explicit conditions, not an interpretation of prose or a special “expected blocked” exception.

**What invariant remains protected:** Partial/scoped evidence cannot silently become full verification; implementing-agent confidence cannot complete a run.

**What evidence would cause us to revisit this decision:** The actual missing gate has distinct, well-tested transition semantics that already solve the ambiguity. Adopt its demonstrated semantics rather than invent parallel ones.

## ADR-07 — Retain selected multi-repository scope until usage evidence permits narrowing

**Decision:** Do not replace explicit multi-repository support with the imported one-writable-repo estate model.

**Context:** Actual FLOW prepares, implements, verifies and publishes every G1-selected repository. The proposed estate template assumes a non-Git root and one writable active child, while this workspace root itself is versioned.

**Options considered:** One repository per run only; arbitrary estate writes; explicit selected writable set and read-only contextual siblings.

**Chosen direction:** Keep the selected set. Default UI may favor one ticket/repository, but cross-repository interfaces and sequential partial publication remain supported. Do not add dirty-baseline exemptions, sibling repins or automatic stashing by default.

**Why:** Multi-repository support is an explicit reference requirement, not evidence of unnecessary generalization. Its actual frequency remains unmeasured.

**What becomes simpler:** One approved root set and candidate tuple per repository; no competing estate resolver/pinning system.

**What invariant remains protected:** No write outside the selected set; no fake atomic publication; interface conformance is not relabelled live end-to-end evidence.

**What evidence would cause us to revisit this decision:** Owner confirms coordinated writes are unnecessary, or real work demonstrates a supported dirty-tree/estate requirement that cannot be handled by clean isolated preparation.

## ADR-08 — Keep decision-bearing artifacts; derive summaries

**Decision:** Retain the twelve actual artifact types initially and avoid importing a parallel .rstack store.

**Context:** `AGENT-CONTRACTS.md:146-181` maps twelve owners/consumers. Imported rstack adds matrices, locks, waivers, pins, metrics and memory; some exact state filenames are script-owned and unavailable.

**Options considered:** Collapse all state into one model-written file; keep both artifact families; preserve ownership and derive redundant summaries.

**Chosen direction:** Keep distinct plan, independent review, test definition and evidence, verification, human approval history and external-effect records. Compact IMPLEMENTATION/RUN summaries and derive inventories. Merge imported audit responses into the revised plan if that concept is adopted; don't duplicate independent audit output.

**Why:** Independent decisions need their original basis and author. A lower artifact count is not worth losing provenance or replay safety.

**What becomes simpler:** No second source of truth, no metrics sidecar just to measure ceremony, no model acting as a mandatory transcript copier.

**What invariant remains protected:** Historical execution and human decisions are never regenerated as if observed; effect intent/results survive interruption.

**What evidence would cause us to revisit this decision:** A retained artifact has no decision consumer, or trusted host receipts support a demonstrably simpler representation with equal recovery and ownership.

## ADR-09 — Preserve current local authority and explicit shared-effect control

**Decision:** Do not import new approval friction or broader permissions as “simplification.”

**Context:** Actual Tester/Developer create local commits; G4 approves a specific publication basis. Tests prompt under Manual mode by design (`GUARDRAILS.md`, Action classes). Imported approval asks separately for final commit, push and PR, and introduces local integration/stash work.

**Options considered:** Ask before every local action; auto-approve arbitrary runner/terminal work; bind approval to a meaningful scoped action and safe host.

**Chosen direction:** Preserve existing local-commit and G4 behavior initially. Reduce repeated local prompts only after an owner-approved, capability-scoped host policy exists. Treat PR merge/deployment/Jira writes as outside current pipeline authority. Any later shared action must match its approved target and content.

**Why:** Local reversibility alone does not contain repository-controlled runner code. Conversely, repeatedly approving already-authorized constrained steps does not improve a source-of-truth design.

**What becomes simpler:** One action policy distinguishes local work, local integration, publication and PR merge; no generic “external” label for local commits.

**What invariant remains protected:** Human controls meaningful shared effects; unknown effects are reconciled, not blindly retried; no agent merges a PR.

**What evidence would cause us to revisit this decision:** Measured prompt burden plus verified runner containment supports a narrower unattended local execution allowance; owner explicitly changes release policy.

## ADR-10 — Missing proof and failing suites do not become success

**Decision:** Retain current strict full-suite release semantics.

**Context:** `implementation-quality/SKILL.md`, IQ11, blocks every failing full-suite identity even if a baseline also fails; `test-contract/SKILL.md`, T10, permits local progress with a gap but caps verification at INCOMPLETE. Proposed rstack supports BLOCKED/proceedable pre-existing-failure waivers.

**Options considered:** Auto-waive baseline failures; permit a separately authorized risk-acceptance release; preserve strict default.

**Chosen direction:** Preserve strict default. A risk-accepted release profile, if desired, needs its own explicit owner decision, invariant limits and distinct reported outcome; it cannot masquerade as PASS.

**Why:** Matching symptoms do not establish cause, and approval cannot create equivalent proof.

**What becomes simpler:** No imported base-replay/waiver/observation-acceptance release subgraph until justified.

**What invariant remains protected:** Unproven required behavior is visible; neither human nor agent can silently upgrade its evidence level.

**What evidence would cause us to revisit this decision:** A demonstrated operational need for risk-accepted release, approved ownership and auditable scope, without waiving new contract failures or independent review.

## ADR-11 — Evidence-directed depth, no parallel risk taxonomy

**Decision:** Preserve meaningful depth behavior, not two competing tier systems.

**Context:** Actual plan-grounding R2 uses SMALL/MEDIUM/LARGE and T14/IQ10 adjust construction/review detail. Imported risk tiers affect search/reviewer breadth; original LOC overrun raises the tier, proposed risk text rejects LOC alone, while the proposed orchestrator still references script-driven raises.

**Options considered:** Remove all depth guidance; add numeric scores; retain one consequence-based policy with explicit affected surfaces.

**Chosen direction:** Keep current class semantics until downstream consumers are mapped. Then prefer a compact record of material interfaces, persistence, concurrency, authorization and uncertainty with corresponding proof obligations. Do not import a second LOW/MEDIUM/HIGH state machine.

**Why:** A class is useful only if it changes a decision. Line count is not a semantic impact measurement.

**What becomes simpler:** No duplicated classification/promotion/metrics schema; reviewers follow concrete dependencies.

**What invariant remains protected:** Required phases and material boundary evidence never disappear because a task is called small.

**What evidence would cause us to revisit this decision:** Comparative runs show a tier improves decisions more reliably than explicit surface guidance, with acceptable classification cost.

## ADR-12 — Runtime memory remains optional and unproven

**Decision:** Do not add automatic cross-run memory to V2 by default.

**Context:** Actual `docs/HARNESS-LEDGER.md` is owner-written, not a runtime input. The knowledge experiment remains deferred. Imported original harness-map says nothing had written learnings yet; that is only a reconstructed historical claim, not current live-system measurement.

**Options considered:** Auto-append after every run; delete all historical learning; retain reviewed maintenance history and require evidence for runtime retrieval.

**Chosen direction:** Keep the ledger and private measurement guidance. If a later experiment is approved, use a small human-reviewed source map with a pinned basis and cheap revalidation; use ordinary docs/tests when possible. No automatic writer, curator or new validator now.

**Why:** Memory can add stale authority and contaminate independent review without demonstrated savings.

**What becomes simpler:** No default learning lane, size-rule validator, cleanup exemptions or repeated read cost.

**What invariant remains protected:** Prior observations are leads, never current proof; fresh reviewers do not inherit conclusions; absent memory never blocks correctness.

**What evidence would cause us to revisit this decision:** Independently observed repeated discovery cost and a controlled trial showing lower total effort without lost findings, stale-source reliance or privacy risk.

## ADR-13 — Preserve provenance through metrics derivation

**Decision:** A parser does not turn an agent report into independent observation.

**Context:** Proposed discovery-cost labels run-log-derived events OBSERVED even though proposed orchestrator writes the log. Actual `docs/RUN-AUDIT-AND-IMPROVEMENT.md` separates OBSERVED, AGENT_REPORTED, INFERRED and UNAVAILABLE. Its knowledge guidance requires observed reads, not a citation alone.

**Options considered:** Trust syntactically valid timestamps/logs; discard all agent reports; retain them with inherited provenance and optional host corroboration.

**Chosen direction:** Derive metrics once, on demand, preserving input ancestry. Host spans establish only fields actually recorded; no spans means unavailable/no claim. Keep valid observed zeros; never estimate absent duration, cost or model identity.

**Why:** Format validation can detect implausibility but cannot attest truth. “Audit caught N” is not “saved N escaped defects.”

**What becomes simpler:** No separate metrics gate or repeated model-authored cost report; no ritual counts masquerading as engineering outcomes.

**What invariant remains protected:** Evidence cannot silently be fabricated or upgraded by copying or parsing.

**What evidence would cause us to revisit this decision:** A host-owned, tamper-resistant event source provides reliable dispatch, execution and timing fields and has demonstrated retention.

## ADR-14 — Keep budgets and repeated execution until their tradeoffs are measured

**Decision:** Consolidate accounting before tuning or deleting it.

**Context:** IQ3 has separate 6/6/2 allowances and a disclosed upper bound; Developer and Verifier both execute a full handoff suite. The model/role docs call benefits and costs hypotheses. HELD recovery prevents a lost observation from renewing an allowance.

**Options considered:** One unconstrained “continue until done” loop; remove all duplicate runs; centralize existing accounting and evaluate trusted evidence reuse later.

**Chosen direction:** Preserve current bounds, success-on-last-allowance semantics and durable reservations. Move definitions to one owner. Evaluate evidence reuse only at an identical immutable candidate and with independently trustworthy capture, not Developer's GREEN narrative.

**Why:** Repeated execution has both cost and independent-verification value. This checkout has no measured runner/prompt cost from which to pick new numbers.

**What becomes simpler:** One definition of a round/attempt/reservation; no different counters silently reset by different resume paths.

**What invariant remains protected:** No infinite retry, lost failure, fabricated observation or automatic budget reset; all pending verification obligations still complete.

**What evidence would cause us to revisit this decision:** Representative private runs quantify wasted executions and reveal a simpler bound or reuse rule that preserves fault detection.

## ADR-15 — Consolidation first; executable runtime is a separate architecture decision

**Decision:** Do not replace excessive prose with an equally excessive framework.

**Context:** The requested scripts, generated-source machinery and invariant tests are missing. The current README intentionally positions this repository as a reference rather than an executable product.

**Options considered:** Build all nineteen described scripts; add a schema/generator/validator stack immediately; consolidate reference contracts first and choose minimum executable gaps later.

**Chosen direction:** Start with authority/mode/identity corrections and content consolidation. If an enforced profile is approved, prefer the existing corporate runtime; otherwise consider only the conditional checker/capture/tests paths in the file plan. Do not implement during this review.

**Why:** A code layer is justified by a concrete failure it can mechanically prevent or detect, not by a desire to shorten a prompt.

**What becomes simpler:** No speculative installer, compatibility layer, telemetry daemon, memory curator, lock database or new historical archive.

**What invariant remains protected:** Every claimed guarantee has a named mechanism and evidence level; missing mechanisms remain explicit adoption limits.

**What evidence would cause us to revisit this decision:** Owner selects an executable product scope and supplies host requirements plus failure cases that the procedural profile cannot adequately handle.

## Decisions requiring owner acceptance

The owner needs to settle target/source, guarantee level, fresh-review dispatch, supported multi-repository scope, approval/failure policy, and whether any optional experiment is warranted. The recommended defaults preserve the current reference's scope and safety semantics while reducing duplication.

Acceptance of these directions is not approval to implement a batch, execute tests, broaden permissions, stage, commit or publish. Each future batch should cite the relevant ADRs, its exact files, invariant validation and rollback from the architecture review.

