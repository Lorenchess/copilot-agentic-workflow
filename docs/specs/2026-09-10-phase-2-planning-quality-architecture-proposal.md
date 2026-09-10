# Phase 2 — Planning Quality & Adversarial Review
## Architecture Proposal (Fable, for owner review)

Status: **DRAFT — not approved, not implemented.** Written 2026-09-10 against the locked Phase 1 baseline `03d4230` (tag `phase-1-reference`; administrative closure `0f54a59`). No Phase 1 asset has been edited. Nothing here authorizes implementation; Sonnet 5 has not been invoked for implementation. Delegation target verified: `model: "sonnet"` resolves to Claude Sonnet 5 / `claude-sonnet-5`.

Phase 2 question: **How do Planner + Adversary produce a plan that is grounded, complete, testable, and challengeable before Tester writes executable acceptance tests?** Phase 2 deepens Planner → Adversary → G3. It does not touch test-level selection, RED mechanics, WITNESS/PRESERVATION policy, or anything after G3 (Phases 3–5).

---

## 1. Current-state assessment

### 1.1 What Planner and Adversary already do well (keep)

Evidence is cited to the locked files.

| Strength | Where |
|---|---|
| Every acceptance criterion carries a source class (`JIRA` / `DEV` / `DERIVED` / `PROPOSED`); a `PROPOSED` criterion needs explicit G3 confirmation and may never be presented as sourced. | `planner.agent.md` lines 47, 62, 76 |
| Requested scope disposition per Jira key; omitting a key is a REVISE by rule, not by judgment. | `planner.agent.md` line 60; `adversary.agent.md` lines 55, 60 |
| Planner is read-only over code; Adversary cannot edit the plan; both are stateless subagents with no terminal and no MCP. | `AGENT-CONTRACTS.md` planner/adversary sections |
| Bounded loop (two rounds), BLOCK distinguished from REVISE, escalation to the developer via `ADVERSARY_REVISE_LIMIT` / `ADVERSARY_BLOCK`. | `FLOW.md` Bounded loops, STOP catalogue |
| G3 answers are bound to the exact PLAN.md and ADVERSARY-REVIEW.md rounds reviewed (basis + `CURRENT`/`STALE`, contract A8). | `pipeline.agent.md` line 87; contract §14 A8 |
| Provenance tags on every factual line; no fabricated timestamps. | all artifacts |
| The worked example shows a *substantive* round-1 REVISE (silent audit-record loss contradicting PAYMENTS-12351) resolved by a G3-confirmed product decision (AC5), not a format nit. | `docs/examples/PAYMENTS-12345/ADVERSARY-REVIEW.md`, `PLAN.md` |
| Adversary findings already carry severity, evidence, recommendation; an "Assumptions challenged" section exists. | `adversary.agent.md` lines 43–46 |

### 1.2 Concrete weaknesses Phase 2 should solve

Each weakness is shown against the worked example so it is a demonstrated gap, not a hypothetical one.

**W1 — Disposition is per key, not per requirement.** PAYMENTS-12345's Acceptance Criteria field contains three separable clauses; the disposition row says `IMPLEMENTED: AC1, AC2, AC3`. That works for three clauses, but a key with six clauses can be `IMPLEMENTED` while clause four silently disappears, and `PARTIALLY IMPLEMENTED` does not require naming what was left out. The two `[DEV]` constraints in RUN.md ("keep config in application.yml", "write to the existing audit_log table") have no disposition at all — they are honored in Approach prose, but nothing checks that each developer constraint was implemented, preserved, or explicitly excluded. (Failure modes: *Jira requirement silently omitted*, *developer constraint dropped*.)

**W2 — Only acceptance criteria have a decision model; the rest of the plan has only provenance tags.** The example's single open question ("synchronous or fire-and-forget?") says "This plan assumes … [INFERENCE]" — an assumption sitting under *Open questions*, resolved by the model, never shown to the developer at G3. INTAKE.md's Unknowns (no base delay, no max attempts) are carried into Risks as "treated as configuration values", yet someone will write a concrete default into `application.yml` — a shipped product value with no Jira source, never surfaced as a decision. `PROPOSED` exists only as a class of *acceptance criterion*; a proposed decision that is not an AC (a new persisted field, reuse of the sync `LedgerClient` pattern) has no vehicle. There is no rule for when an open question may stay an assumption, must go to G3, blocks planning, or belongs out of scope. (Failure modes: *proposed assumption becomes accepted fact*, *open question silently resolved by the model*, *G3 approval hides material assumptions*.)

**W3 — Repository grounding has no evidence expectations.** Planner step 2 says "read the code … tagging findings `[REPO]`" with no minimum: nothing requires the responsible component, the data-flow entry point, the interfaces touched, the persistence boundary, or adjacent existing tests. The example happens to cite `WebhookDeliveryService` and `AuditLogRepository`, but nothing would have flagged a plan that cited nothing. Negative evidence ("no retry logic exists" — the fact that makes Phase 3's RED legitimate) is not a required record. The Adversary "challenges assumptions against what the code shows" but has no required verification of the plan's `[REPO]` claims. (Failure mode: *repository evidence contradicts the plan*, *plan-to-repository mismatch*.)

**W4 — Affected files is a flat list with no reason, change type, or confidence.** The verifier (Phase 4, contract A5) classifies every changed path as PLANNED against this list — a speculative list inflates PLANNED and weakens the UNRELATED signal; a too-short list produces false UNRELATED findings. Quality here has downstream mechanical consequences. (Failure mode: *excessive speculative affected-file lists*.)

**W5 — Cross-repository contracts are implicit.** In the example, `payments-api` calls a *new* endpoint in `payments-ledger`. PLAN.md never states the interface (path, payload fields, error behavior), the implementation order (ledger before api), backward compatibility (what happens if api deploys first — AC5 covers unavailability but nobody said so), or ownership. AC4 says "When `payments-api` reports it" and leaves the contract to two testers writing tests in two repositories independently. (Failure modes: *multi-repo dependency omitted*, *cross-repository inconsistency*.)

**W6 — Testability is asserted, not shown.** Each AC is Given/When/Then, but nothing names the boundary through which the outcome is observable, the preconditions, or whether the failure path is covered. `TEST_BOUNDARY_MISSING` is discovered by the tester at stage 5, *after* G3 — late. The two PRESERVATION tests in the example's TEST-CONTRACT.md ("already DELIVERED is never retried", "existing audit write unchanged") were invented at test time; the plan never stated what must be preserved. (Failure modes: *acceptance criteria technically present but not testable*, *happy-path-only plan*.)

**W7 — Risks have no grounding or treatment rule.** The example's second risk is a restatement of AC5; nothing prevents a generic list, and nothing requires a risk to say whether it is covered by a criterion, a decision, an open question, or accepted. (Failure mode: *unacknowledged operational risk* hidden among generic ones.)

**W8 — The Adversary's procedure mirrors the Planner's checklist.** Its checks (traceability, disposition coverage, PROPOSED flagging) are the same rules the Planner already follows; "challenge assumptions" is one step with no method. Nothing requires the Adversary to derive the requirements *independently* from INTAKE.md and RUN.md before reading the plan, so a plan and its review can share the same blind spot. Findings have no category, severity is undefined (the example uses `LOW` and `RESOLVED`), and on a revise round the Planner "addresses every finding" with no recorded accept/reject disposition per finding. The round-2 review in the example is largely a restatement of the plan; both challenged assumptions end "not disqualifying". (Failure modes: *Adversary rubber-stamps Planner*, *Planner and Adversary repeat the same reasoning*, *adversary finding ignored without explicit rationale*.)

**W9 — G3 shows too little to decide and too much to read.** The gate voices the verdict, per-key disposition, and PROPOSED criteria. It does not show unresolved questions, material risks, cross-repo ordering, residual (non-blocking) adversary findings, or the criteria themselves — the developer must open PLAN.md to approve responsibly. (Failure mode: *G3 approval hides material assumptions*; *planning ceremony so heavy developers bypass the pipeline* — the reading burden is the ceremony.)

**W10 — One planning depth for every ticket.** The template makes no distinction between a one-file fix and a two-repository contract change. Without a depth rule, any Phase 2 enrichment of PLAN.md lands with full weight on the smallest ticket. (Failure mode: *huge plans for tiny tickets*.)

### 1.3 What must remain unchanged

- The nine roles and eleven artifacts. No new agent. No new artifact. No new gate.
- Planner and Adversary tool lists (read/search + own-artifact edit; no terminal, no MCP).
- Artifact ownership, immutability, provenance tags, the YAML header.
- APPROVE / REVISE / BLOCK (see §3.6 — it is enough).
- The two-round adversary/planner budget and its STOPs (one owner decision affects a G3 send-back, §12 D2).
- G3 basis/`CURRENT`/`STALE` binding (A8); resume by artifact; everything after G3.
- The three existing skills, `copilot-instructions.md`, `GUARDRAILS.md`, `.vscode/settings.json`.
- Sonnet-5 for every role (§3.9 documents candidates only).

---

## 2. Phase 2 success criterion

At the end of Phase 2, for the regenerated two-repository worked example **and** for a new single-repository SMALL example, a reader who opens only PLAN.md and ADVERSARY-REVIEW.md can determine, without reading code or Jira:

1. the disposition of every requested requirement item and every developer constraint (nothing silently absent);
2. which statements are sourced facts, which are assumptions the plan proceeds on, which are decisions the developer must make, and which questions are still open — and why each was routed where it was;
3. the repository evidence the approach rests on, including what was searched for and not found;
4. every cross-repository interface, its ordering and compatibility requirement (or an explicit "none");
5. for every acceptance criterion, the observable outcome, the boundary it is observed at, its preconditions, and whether the failure path is covered;
6. that the Adversary derived the requirements independently and verified the plan's repository claims, with every finding categorized, evidenced, and either resolved or carried to G3;

and the developer can answer G3 from PLAN.md's Decision summary plus the adversary verdict alone, with each proposed decision and open question answered explicitly and recorded in RUN.md.

The Phase 2 → Phase 3 handoff is a PLAN.md that the **unchanged** `tester.agent.md` consumes with its existing procedure. Phase 2 is complete when the SMALL example's PLAN.md stays short (target: under ~60 lines) — the depth rule demonstrably works.

---

## 3. Proposed behavioral improvements

Design principle: every improvement is an artifact section, a decision rule, an evidence expectation, or a review question. No machinery.

### 3.1 Requirement items and item-level disposition (W1)

**Rule.** Before writing anything else, the Planner enumerates *requirement items*: each separable clause of every requested key's Acceptance Criteria field, each explicit requirement statement in its description (INTAKE.md quotes them), and each `[DEV]` constraint in RUN.md's Developer context. Items get stable ids (`R1…`, `D1…`). Context-only Jiras never produce items.

**Disposition per item** (the smallest useful extension of the existing per-key table): `IMPLEMENTED` (→ AC ids) · `PRESERVED` (existing behavior the item requires to remain; → preservation expectation id, §3.5) · `EXCLUDED` (reason) · `UNRESOLVED` (→ open question id, §3.7). The existing per-key row remains, now derived from its items; `PARTIALLY IMPLEMENTED` must list which items are not `IMPLEMENTED`.

**Adversary check.** The Adversary produces its *own* item list from INTAKE.md and RUN.md **before** reading PLAN.md's disposition (§3.8), then diffs: an item missing from the plan is a HIGH finding; an item in the plan with no source is *invented scope*, also HIGH.

Why not more: no priorities, no weights, no traceability matrix beyond ids. One table.

### 3.2 Decision model: facts, assumptions, decisions, questions (W2)

Existing provenance tags (`[JIRA]` `[REPO]` `[DEV]` `[TOOL]` `[INFERENCE]`) already separate sourced facts from reasoning. What is missing is a **routing rule** for the `[INFERENCE]` half. PLAN.md's *Open questions* section becomes **Decisions and open questions**: one table, id, statement, planner recommendation (may be empty), basis, consequence if wrong, and a **routing** class:

| Routing | Meaning | Rule |
|---|---|---|
| `ASSUMED` | Planner proceeds on it; shown at G3 as a count, not asked. | Allowed only when all hold: technical (not user-observable product behavior), reversible within this change, and its falsity would surface in RED/verification or the Adversary's evidence check. |
| `G3` | Developer must decide. Planner's recommendation is the default answer. | Any of: fixes user-observable behavior Jira/DEV do not state; chooses between interpretations of a requirement; adds or removes scope; changes a cross-repo contract or persisted shape; picks a **shipped value** (a default, a limit) Jira leaves unstated. |
| `BLOCKING` | Planning cannot proceed on any reasonable proposal. | The item's meaning cannot be determined and no `G3` proposal is honest. The corresponding item is `UNRESOLVED`; the Adversary renders BLOCK by rule (§3.6). |
| `OUT_OF_SCOPE` | Belongs elsewhere; recorded under Out of scope with reason. | — |

The existing `PROPOSED` AC source class is retained and now *references* a `G3` row, so a proposed decision that is not itself a criterion (new persisted field, interface shape, default value) has the same vehicle. Applied to the example: "sync vs fire-and-forget" is `ASSUMED` (technical, reversible, AC5 ordering catches it); the concrete `maxAttempts`/`baseDelay` defaults are `G3` (shipped values with no source) — the Phase 1 example never surfaced them.

**Forbidden for the Planner:** resolving a question by choosing silently (every choice is a row), carrying a `BLOCKING` question as `ASSUMED`, presenting an `ASSUMED` row's content as fact elsewhere in the plan.

### 3.3 Repository evidence (W3)

New PLAN.md section **Repository evidence**, one short table per confirmed repository, evidence rows of the form `type · path[:symbol] · one sentence · [REPO]`. Evidence types (portable vocabulary): `RESPONSIBLE_COMPONENT`, `ENTRY_POINT`, `INTERFACE`, `CONFIG`, `PERSISTENCE`, `CROSS_REPO_CALL`, `ADJACENT_TEST`, `NOT_FOUND` (the term searched and where — the negative finding that justifies "this behavior does not exist yet").

**Which types are required scales with the change class (§4):** SMALL — `RESPONSIBLE_COMPONENT` and `ADJACENT_TEST` (or `NOT_FOUND` for each); MEDIUM adds `ENTRY_POINT`, `INTERFACE`, `CONFIG` where the change touches them; LARGE adds `PERSISTENCE` and `CROSS_REPO_CALL`. Bound: at most 12 rows per repository, no code excerpt longer than one line, and a one-line "searched for: …" record (the same disclosure habit `discover-affected-projects` already uses). Every `[REPO]` claim in Approach, Interfaces, Affected files, or a criterion must point at an evidence row; a `[REPO]` claim with no row is forbidden.

**Adversary check.** The Adversary verifies every evidence row it can reach with its read tools and records the result (confirmed / not found / contradicts) under a new **Evidence verification** section. A contradiction on a row the approach depends on is HIGH (plan-to-repository mismatch).

This is deliberately not code archaeology: the bound and the type list cap it; the rows are pointers, not dumps.

### 3.4 Affected files → implementation map (W4)

Heading **Affected files** is kept (the verifier's PLANNED classification, contract A5, names it). Each entry becomes: path · repository · change type (`NEW` / `EDIT` / `CONFIG` / `DELETE`) · reason (AC id, interface id, or decision id) · confidence (`HIGH` when an evidence row cites the path or the new file's package is evidenced; `LOW` when inferred, with the reason) · evidence row id. An entry with no reason is forbidden. When the exact file is not determinable, the Planner names the narrowest evidenced location (directory or component) and marks it `LOW` rather than inventing a filename.

Cross-phase note (§6, C-1): the verifier matches paths; directory-level `LOW` entries need a matching rule in Phase 4. Phase 2 keeps file paths wherever evidence allows and leaves `verifier.agent.md` untouched.

### 3.5 Dependencies and interfaces (W5)

New PLAN.md section **Dependencies and interfaces**; `None — <reason>` is a valid body for SMALL. One row per interaction the change adds or alters: id · provider (repo/component) · consumer · interface (endpoint / message / schema / config key) · shape at field level (names and meaning — never code) · `NEW`/`CHANGED` · backward-compatibility requirement (may the consumer deploy first? old callers?) · implementation order · owner (this run, or another team → `G3` decision or `EXCLUDED`) · migration/config coordination.

For the example this yields one row: `payments-ledger` provides an internal record-retry-attempt endpoint accepting delivery id, attempt number, outcome; `payments-api` consumes it through `LedgerClient`; ledger first; api must tolerate unavailability (AC5); no schema change (existing `audit_log`). Two testers now write against one stated contract.

Not a dependency engine: a table the Adversary reads for consistency (an interface used in an AC or Approach with no row is a HIGH finding).

### 3.6 Acceptance criteria: testability fields and preservation expectations (W6)

Each criterion keeps Given/When/Then and its source class and adds three lines:
- **Observed at** — the boundary where the *Then* is observable: an existing one (pointing at an evidence row), `NEW: <boundary this change introduces>`, or `NONE KNOWN` (which forces an open question, so `TEST_BOUNDARY_MISSING` is anticipated at planning time instead of discovered at stage 5).
- **Preconditions** — the state the *Given* requires (existing rows, config, prior calls).
- **Path** — `POSITIVE` or `NEGATIVE` (failure, limit, exhaustion, empty, unavailable). Rule: every requirement item whose Jira text or evidence names a failure path has at least one `NEGATIVE` criterion, or the plan states "no failure path: <reason>" for that item.

New subsection **Preservation expectations** under Acceptance criteria: Given/When/Then statements of existing behavior that must not change (from `PRESERVED` dispositions and from evidence rows the change touches), ids `P1…`. Because they sit under the Acceptance criteria heading, the **unchanged** tester picks them up and classifies them PRESERVATION exactly as it does today; the example's two invented PRESERVATION tests become traceable to P1/P2. Phase 3 owns any refinement of what the tester does with them.

Boundary with Phase 3 (stated, not crossed): the plan names *where* an outcome is observable and *what state* it needs; it never names a test level, a test double, a test file, or a runner.

### 3.7 Risks and open questions (W7, W8-adjacent)

**Risks**: each risk names its trigger (an evidence row, an interface row, an item, or a decision), an optional category from `correctness · backward-compatibility · data-integrity · integration · operational/config · rollout · uncertainty` (categories are a vocabulary, never a checklist to fill), and a **treatment**: covered by AC/P id · decision id · open question id · `ACCEPTED (reason)`. A risk that restates a criterion, or that names nothing specific to this change or these repositories, is dropped. `ACCEPTED` risks appear at G3.

**Open questions** are the `G3`, `BLOCKING`, and `OUT_OF_SCOPE` rows of §3.2's table; there is no separate free list any more.

### 3.8 Adversary: challenge, do not lint and do not re-plan (W8)

Procedure order is the method:

1. Read INTAKE.md and RUN.md **first**. Enumerate requirement items and developer constraints yourself. Record them under **Independent requirement derivation** *before* reading PLAN.md's disposition.
2. Read PLAN.md. Diff your items against the disposition (missing → HIGH; unsourced → invented scope, HIGH). Confirm the change class (§4); under-classification is HIGH because sections were legitimately skipped on a false premise.
3. Verify Repository evidence rows and any `[REPO]` claim a criterion or interface depends on; record under **Evidence verification**.
4. Work the challenge catalogue (a reusable skill, §5): missing requirements · invented scope · unsupported assumptions (every `ASSUMED` row: agree, or should be `G3`/`BLOCKING`) · weak or untestable criteria (no observed-at boundary, no preconditions, missing negative path) · missing failure paths · cross-repository inconsistency (interface used but not declared; order or compatibility unstated) · backward-compatibility gaps · unacknowledged operational risk · plan-to-repository mismatch · unnecessary complexity (a `NEW` file or interface with no item or decision justifying it) · unclear proposed decisions (a `G3` row without a consequence-if-wrong or with an unfalsifiable recommendation) · **Decision summary fidelity** (anything material in the body absent from the summary — the guard against G3 hiding assumptions).
5. Record findings: id · category (from the catalogue) · severity · evidence (artifact section or path) · what the plan must show or decide. A recommendation is a demand for evidence or a decision, never an alternative approach — the Adversary may not plan.
6. Verdict (§3.9). On round 2, additionally check PLAN.md's **Response to adversary findings** (§3.10): a rejected finding without evidence-backed rationale is re-raised at the same severity.

**Anti-rubber-stamp rule.** An APPROVE with zero findings must state "independent derivation: N items, 0 differences; evidence verified: M rows, 0 contradictions." Rubber-stamping is made *visible*, which is what a prompt-mediated design can honestly do.

### 3.9 Verdicts and severity: keep APPROVE / REVISE / BLOCK

Three verdicts are enough once severity is defined and the residue is carried to G3:

- **HIGH** — a requested item missing or invented; an evidence contradiction the approach depends on; a criterion with no observable boundary; an undeclared cross-repo interface; an `ASSUMED` row that meets the `G3` rule; under-classified change class. **Any HIGH → REVISE.**
- **MEDIUM** — fixable weakness: missing negative criterion where a failure path exists, a risk without treatment, a `LOW`-confidence file entry without reason, a `G3` row without consequence-if-wrong.
- **LOW** — note; never blocks.
- **BLOCK** — the developer must decide before a revision is worth attempting: a `BLOCKING` question, requirement items that contradict each other, or scope only the developer can choose (an interface owned by another team, for instance). BLOCK is rendered by rule for any `UNRESOLVED` item routed `BLOCKING`, which lets a Planner that cannot plan escalate through existing machinery — no Planner STOP is added.
- **APPROVE** only when no HIGH remains and every MEDIUM is fixed or explicitly listed as a **residual finding**; residual MEDIUM/LOW findings are voiced at G3 (§3.11). A fourth verdict ("approve with conditions") is unnecessary because G3 *is* the conditional approval.

### 3.10 Planner: revised procedure and the response to findings

The Planner's procedure becomes: enumerate items (§3.1) → classify change class (§4) → gather bounded evidence (§3.3) → Approach → Interfaces (§3.5) → Affected files map (§3.4) → criteria with testability fields and preservation expectations (§3.6) → decisions and open questions with routing (§3.2) → risks with treatment (§3.7) → Out of scope → **Decision summary** (§3.11) → round bookkeeping.

On round 2 it adds **Response to adversary findings**: per finding id, `ACCEPTED (what changed)` or `REJECTED (rationale, evidence)`. Ignoring a finding silently becomes impossible by construction.

### 3.11 G3: a compact approval view without a new gate (W9)

PLAN.md gains a final section **Decision summary**, written by the Planner for the developer, one screen: change class and repositories · requirement items not `IMPLEMENTED` (each with disposition) · every `G3` row with the recommendation · `ASSUMED` count (not asked) · cross-repo order/compatibility line · `ACCEPTED` risks · criteria titles (AC and P ids only). `pipeline` voices G3 as: the Decision summary, the adversary verdict and round, residual findings, then the questions: confirm/reject/replace each `G3` decision (recommendation is the default), acknowledge each non-`IMPLEMENTED` item and each `ACCEPTED` risk. Options remain **Approve / Send back with answers / Abort**.

Answers are recorded in RUN.md's G3 entry as today (basis, `CURRENT`), extended to one line per `G3` item. On **Send back with answers**, the Planner's next round reads the G3 entry from RUN.md — already a Planner input — as `[DEV]` decisions; no new artifact, no new channel. Whether that send-back is a developer-directed redo with a fresh round budget (recommended) or consumes the existing budget is owner decision D2.

The artifact stays detailed; the gate gets concise. No fifth gate.

### 3.12 Model correlation (documented, not changed)

MODEL-ROLES.md gains a short section: Planner and Adversary are the two roles whose value depends on *independence*, so they are the primary candidates for model diversity later; a same-model pair sharing inputs and prompt style shares blind spots. Phase 2's structural mitigations (independent derivation before reading the plan; evidence verification; a challenge catalogue distinct from the Planner's construction rules) reduce correlation without a model change and are what to compare against. The benchmark protocol gains one Phase 2 metric: findings grounded in evidence the plan did not cite. Sonnet-5 remains the baseline; benchmarking stays deferred.

---

## 4. Change class: one template, scaled depth (W10)

**Needed?** Yes, minimally. Without it, every Phase 2 enrichment lands at full weight on a one-file fix and nothing tells the Adversary how deep to go or lets it object when a Planner writes "None" on a two-repo contract change. With it, one template degrades gracefully and the class is itself checkable.

**Rule.** The Planner declares `Change class: SMALL | MEDIUM | LARGE` in Scope, with the triggers that fired. Any trigger sets *at least* that class; the Planner may never downgrade a fired trigger.

| Class | Triggers (any one) | Effect |
|---|---|---|
| SMALL | single repository, one component, localized behavior, no new/changed interface, no persistence or config change | Evidence: `RESPONSIBLE_COMPONENT`, `ADJACENT_TEST`/`NOT_FOUND`. Interfaces: `None — reason`. Adversary: steps 1–3 plus the testability, assumptions, and summary-fidelity questions. Summary ≤ ~10 lines. |
| MEDIUM | multiple components in one repo · a new interface within a repo · new config keys · more than one repo **without** an interface between them | Adds `ENTRY_POINT`, `INTERFACE`, `CONFIG` evidence where touched; full challenge catalogue minus cross-repo items unless triggered. |
| LARGE | an interface between repositories added/changed · persistence schema or migration · a contract consumed outside this run (API, event, shared config) · deploy/config coordination · any `UNRESOLVED` item | All evidence types where applicable; Interfaces section mandatory; full catalogue including compatibility, ownership, rollout. |

Not three pipelines: same agents, same artifacts, same gate; only which sections may say `None — reason` and how far the Adversary must go.

---

## 5. Exact files Phase 2 would modify or add

| File | Change |
|---|---|
| `.github/agents/planner.agent.md` | Procedure (§3.10), PLAN.md sections, new forbidden actions (§3.2, §3.3, §3.4), reads the two policy skills. Tools unchanged. |
| `.github/agents/adversary.agent.md` | Procedure (§3.8), ADVERSARY-REVIEW.md sections, severity/verdict rules (§3.9), anti-rubber-stamp rule, reads both skills. Tools unchanged. |
| `.github/agents/pipeline.agent.md` | G3 wording and recorded fields (§3.11); Send-back semantics per D2. Nothing else. |
| `.github/pipeline/FLOW.md` | Stage 3/4 narratives, G3 wording, bounded-loops sentence per D2. STOP catalogue unchanged. |
| `.github/pipeline/AGENT-CONTRACTS.md` | planner/adversary sections; PLAN.md and ADVERSARY-REVIEW.md templates; RUN.md G3 recorded fields. Ownership matrix unchanged. |
| `.github/pipeline/MODEL-ROLES.md` | §3.12 paragraph and one benchmark metric. |
| `.github/skills/plan-grounding/SKILL.md` **(new)** | Read explicitly by planner and adversary (the intake-skill pattern): requirement-item enumeration, change-class triggers, evidence types and bounds, decision routing rule, criterion testability fields, implementation-map columns, risk treatment rule. One source of truth both roles apply. |
| `.github/skills/challenge-plan/SKILL.md` **(new)** | Read explicitly by adversary: independent-derivation procedure, the challenge catalogue with per-category evidence expectations, finding record shape, severity → verdict mapping. The most directly portable Phase 2 asset. |
| `docs/examples/PAYMENTS-12345/PLAN.md`, `ADVERSARY-REVIEW.md`, `RUN.md` (G3 entry only) | Regenerated to the new templates; AC ids and affected paths kept identical so TEST-CONTRACT.md, IMPLEMENTATION.md, VERIFICATION.md stay consistent untouched. `README.md` reading-order lines for these three updated. |
| `docs/examples/<SMALL-KEY>/` **(new, per D3)** | Planning-only example: `RUN.md` (through G3), `INTAKE.md`, `PLAN.md`, `ADVERSARY-REVIEW.md`, `README.md` stating it stops at G3. Demonstrates the depth rule. |
| `docs/COMPARISON-GUIDE.md` | planner/adversary/worked-example sections; new cross-cutting theme "Facts, assumptions, decisions"; skills entries. |
| `README.md` | Asset tree (two skills, second example), Phase 2 checkpoint status. |
| `docs/specs/2026-09-10-phase-2-planning-quality-contract.md` **(new)** | The approved form of this proposal after owner review — Phase 2's contract, separate from the locked Phase 1 contract. |

Two policy skills rather than inline prose: they keep the two agent bodies readable, follow the repository's own precedent, and are the assets most worth porting. Neither is a slash command (`user-invocable: false`). No new agent, artifact, gate, STOP code, tool, or setting.

## 6. Files and areas Phase 2 will NOT modify

- `intake`, `workspace`, `tester`, `developer`, `verifier`, `pr` agents — untouched. In particular `tester.agent.md` consumes the new PLAN.md unchanged.
- `.github/skills/pipeline`, `gather-jira-context`, `discover-affected-projects`.
- `GUARDRAILS.md` (no tool, command, or trust change), `.github/copilot-instructions.md`, `.vscode/*`.
- `docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md` and the archive — not edited; Phase 2 has its own spec.
- The example's downstream artifacts: `WORKSPACE.md`, `TEST-CONTRACT.md`, `RED-REPORT.md`, `IMPLEMENTATION.md`, `VERIFICATION.md`, `PR-DESCRIPTION.md`, `PR.md`, `INTAKE.md`.
- `docs/reviews/` stays untracked unless the owner decides otherwise.
- Nothing from Phases 3–5: test level, doubles, RED proof, WITNESS/PRESERVATION policy, GREEN iteration, verifier judgment, diff-versus-plan enforcement, Bitbucket/Jira specifics.

**Cross-phase compatibility issues (named, not silently edited):**
- **C-1** Verifier PLANNED classification vs directory-level `LOW` entries in the implementation map — Phase 4 needs a matching rule; Phase 2 keeps file paths wherever evidence allows.
- **C-2** FLOW.md bounded-loops sentence and A6/A8 wording if D2 chooses a fresh budget on G3 send-back — a locked Phase 1 rule changes; owner decision.
- **C-3** PLAN.md template: "Open questions" heading is replaced by "Decisions and open questions"; RUN.md G3 fields extended. No downstream agent reads either heading mechanically.
- **C-4** Preservation expectations under Acceptance criteria are consumed by the unchanged tester as ordinary Given/When/Then; Phase 3 decides finer policy.
- **C-5** BLOCK-by-rule for `BLOCKING` questions is a clarification of the existing BLOCK definition, not a new STOP.

## 7. Human UX impact

Before: G3 shows a verdict, per-key disposition, and PROPOSED criteria; approving responsibly means reading the whole plan. After: one screen — what is not implemented, the decisions with a recommended default, accepted risks, cross-repo order, residual findings — and the developer answers the decisions inline or sends the plan back *with* those answers. Fewer silent assumptions without more interruptions: `ASSUMED` items are counted, not asked; a SMALL change typically has zero or one `G3` row. G1, G2, G4 unchanged. The cost is a longer PLAN.md on LARGE changes, which is where the reading was already necessary.

## 8. Expected internal-pipeline reuse value

Portable as-is, independent of Copilot: the requirement-item enumeration and item-level disposition table (§3.1); the decision routing rule (§3.2); the evidence-type vocabulary with `NOT_FOUND` (§3.3); the implementation-map columns (§3.4); the interface table (§3.5); the observed-at/preconditions/path fields and preservation expectations (§3.6); the risk treatment rule (§3.7); the Adversary's independent-derivation step, challenge catalogue, severity→verdict mapping, and anti-rubber-stamp rule (§3.8–3.9); the response-to-findings record (§3.10); the Decision summary (§3.11); the change-class triggers (§4). Each becomes a comparison question in `COMPARISON-GUIDE.md` ("does the internal pipeline's planner record what it searched for and did not find?").

## 9. Risks of the Phase 2 design itself

- **Ceremony creep → bypass.** Mitigation: change class, `None — reason`, bounds (12 evidence rows/repo, one-line excerpts), the SMALL example as the yardstick (< ~60 lines) — a checkpoint acceptance criterion, not a hope.
- **Requirement items depend on decomposable Jira text.** Free-form tickets make enumeration a judgment; the Adversary's independent list turns disagreement into a finding rather than a silent choice. Accepted.
- **Order-of-reading is prompt-mediated.** A Copilot subagent cannot be forced to read INTAKE.md before PLAN.md; the artifact requires the derivation to be recorded, which makes skipping visible, not impossible. Same honesty level as Phase 1's procedural controls.
- **Same model both sides.** Structural independence reduces, does not remove, correlated blind spots (§3.12).
- **Evidence claims are still model-produced.** The Adversary verifies them within its read tools; the verifier does not (Phase 4).
- **Decision summary drift.** Mitigated by the fidelity check; a drifted summary is a HIGH finding.
- **Two agent bodies grow.** Mitigated by moving rules into the two skills; Fable's independent review checks agent/skill/contract consistency line by line.
- **G3 question wall.** Bounded by construction: only `G3` rows, non-`IMPLEMENTED` items, `ACCEPTED` risks, and residual findings are asked.

## 10. Implementation checkpoints

Same working rule as Phase 1 §2: Sonnet 5 implements; Fable reviews independently against every acceptance criterion; at most two correction rounds; Fable commits on PASS.

- **P2-C1 — Policy skills, contracts, agents.** `plan-grounding/SKILL.md`, `challenge-plan/SKILL.md`, `planner.agent.md`, `adversary.agent.md`, `pipeline.agent.md` (G3 only), `FLOW.md`, `AGENT-CONTRACTS.md`, `MODEL-ROLES.md`.
- **P2-C2 — Worked examples.** Regenerated PAYMENTS-12345 planning artifacts (both rounds' content reflected as today: round 2 kept, round 1 described) and the new SMALL example.
- **P2-C3 — Guide, README, Phase 2 closure.** `COMPARISON-GUIDE.md`, `README.md`, the Phase 2 contract's closure section; Fable runs the challenge catalogue against both example plans as the independent closure check.

## 11. Acceptance criteria per checkpoint

**P2-C1**
- Every rule in §3 and §4 appears exactly once as normative text (skill or contract) and is referenced, not restated, by the agent bodies; no contradiction between `AGENT-CONTRACTS.md`, the two agent bodies, `FLOW.md`, and the skills (checked line by line).
- Planner/Adversary `tools:` lists are byte-identical to Phase 1; no new tool, agent, artifact, gate, STOP code, or setting.
- PLAN.md template has the sections of §3 with "Affected files", "Acceptance criteria", "Requested scope disposition", "Adversary round" headings unchanged; ADVERSARY-REVIEW.md template has Verdict, Independent requirement derivation, Findings (id/category/severity/evidence/demand), Evidence verification, Assumptions challenged, Missing or weak acceptance criteria, Decision summary fidelity, Round.
- Decision routing rule, change-class triggers, severity→verdict mapping, and the anti-rubber-stamp sentence are quotable one-paragraph rules.
- G3 wording in `pipeline.agent.md` equals `FLOW.md`'s; RUN.md G3 record fields cover every `G3` item; D2's chosen send-back semantics are stated in one place and referenced elsewhere.
- `tester.agent.md`, `verifier.agent.md`, `GUARDRAILS.md` unchanged (`git diff` empty for them).

**P2-C2**
- PAYMENTS-12345 PLAN.md: item-level disposition covers three PAYMENTS-12345 clauses, one PAYMENTS-12351 clause, two `[DEV]` constraints; the defaults question is a `G3` row; sync-vs-async is `ASSUMED` with basis; one interface row; every AC has observed-at/preconditions/path; P1/P2 match the existing PRESERVATION tests; AC1–AC5 ids and every affected path identical to Phase 1 so `TEST-CONTRACT.md`, `IMPLEMENTATION.md`, `VERIFICATION.md` remain consistent without edits (checked by grep).
- PAYMENTS-12345 ADVERSARY-REVIEW.md round 2: independent derivation recorded, evidence verification recorded, at least one finding grounded in evidence the plan did not cite, response-to-findings referenced.
- RUN.md G3 entry records each `G3` answer; basis/`CURRENT` unchanged in form.
- SMALL example: class SMALL with triggers, Interfaces `None — reason`, PLAN.md under ~60 lines, adversary APPROVE round 1 with the anti-rubber-stamp sentence, README states it stops at G3; every identifier fictional.

**P2-C3**
- Comparison guide has, for each Phase 2 asset, "what to look at" and internal-pipeline questions; the new cross-cutting theme present; README asset tree and status current.
- Fable's closure check: running `challenge-plan` against both example plans yields no HIGH finding the example's review missed.
- Phase 1 tag still resolves to `03d4230`; no Phase 1 contract or archive file edited.

## 12. Owner decisions needed

- **D1 — Change class.** Adopt the three-class rule (§4) — *recommended* — or ship the enriched template with `None — reason` alone and no class.
- **D2 — G3 "Send back with answers".** (a) *Recommended:* a developer-directed redo (A8's existing "developer-decided plan redo") that starts a fresh two-round adversary/planner budget — bounded by the human, never automatic; changes FLOW.md's bounded-loops sentence (C-2). (b) Keep Phase 1's "only if round budget remains", accepting that a rejected `G3` decision after round 2 forces Approve-or-Abort.
- **D3 — SMALL example.** Add a second, planning-only example directory (*recommended*; it is the proof the depth rule works) or demonstrate SMALL only in prose.
- **D4 — Shipped defaults.** Confirm the routing rule's stance that a concrete value Jira leaves unstated (`maxAttempts`, `baseDelay`) is always a `G3` decision, never `ASSUMED` — *recommended*; the alternative is `ASSUMED` when the value lives in configuration, which is what the Phase 1 example silently did.

Everything else in this proposal is a design call I am prepared to make.

## 13. Recommendation

**PROCEED_WITH_OWNER_DECISIONS** (D1–D4). On approval, this proposal becomes `docs/specs/2026-09-10-phase-2-planning-quality-contract.md`, and P2-C1 is delegated to Sonnet 5 with the contract, the locked baseline, and the acceptance criteria of §11.
