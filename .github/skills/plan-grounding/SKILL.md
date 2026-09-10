---
name: plan-grounding
description: Shared planning-quality policy — requirement items, change class, repository evidence, affected files and interfaces, testability and preservation, decisions and open questions, risks, decision summary content, and cycle.round identity. Read explicitly by the planner agent (its construction rules) and the adversary agent (the shared contract it reviews against); not a slash command.
user-invocable: false
disable-model-invocation: true
---

# `plan-grounding` — shared planning-quality policy

This skill is the normative planning-quality policy for stage 3 (Plan) and stage 4 (Adversary) of `FLOW.md`. It is read explicitly by `.github/agents/planner.agent.md` at the start of its procedure, as the construction rules for PLAN.md, and by `.github/agents/adversary.agent.md`, as the shared contract PLAN.md must satisfy. It does not auto-load into any conversation. It states what PLAN.md must contain (R1–R7, R10's summary content) and how the `cycle.round` identity is represented (R8, identity only — the full G3 answer semantics, planning-cycle mechanics, and bounded-loop rule are normative in `AGENT-CONTRACTS.md` and `pipeline.agent.md`, not here). The independent review *method* — reading order, independent checks, the challenge catalogue, finding shape, severity, and verdicts — is `challenge-plan/SKILL.md`, read by `adversary` only.

Historically sourced from `docs/specs/2026-09-10-phase-2-planning-quality-contract.md` §2 R1–R7, R10, R8 (identity only), which remains the normative text if this skill and the contract ever appear to diverge.

## R1 — Requirement items and item-level disposition

The plan enumerates **requirement items**: each separable source obligation in a requested key's Acceptance Criteria field and explicit requirement statements in its description (`R1…`), and each developer constraint in RUN.md's Developer context (`D1…`). Enumerate separable obligations, not every sentence — a Jira sentence that restates or elaborates an already-captured obligation is not a second item. Context-only Jiras never produce items. INTAKE.md Unknowns and Warnings that bear on an item are carried into the plan as rows (see R6's decision routing), never dropped.

PLAN.md's **Requested scope disposition** keeps the per-key table (IMPLEMENTED / PARTIALLY IMPLEMENTED / EXCLUDED) and adds an **items table**: id · source anchor (key and field, or "RUN.md Developer context") · obligation · disposition · covered by · note.

Disposition ∈:
- `IMPLEMENTED` — planned coverage, not delivered proof.
- `PRESERVED` — existing behavior the item requires to remain.
- `EXCLUDED` — reason given.
- `UNRESOLVED` — routed as a `G3` or `BLOCKING` row per R6.

"Covered by" names AC ids, P ids, interface ids, or an implementation constraint id (`C1…`, stated in Approach) — a technical developer constraint is not forced into a Given/When/Then just to have a Given/When/Then to cite. `PARTIALLY IMPLEMENTED` at key level lists the items that are not `IMPLEMENTED`. Every item appears exactly once.

## R2 — Change class

The plan declares `Change class: SMALL | MEDIUM | LARGE` in Scope with one sentence on **consequence and uncertainty** — never a sentence that reduces to file or repository count.

`SMALL` requires **all** of:
- one repository;
- localized behavior;
- no new or changed interface;
- no persistence or configuration change;
- no permission/money/data-integrity consequence;
- no unresolved material choice.

`LARGE` is warranted by **any** of:
- an interface between repositories added or changed;
- a persistence schema or migration;
- a contract consumed outside this run;
- deploy/config coordination;
- a material unresolved requirement;
- a localized change whose failure consequence is severe (permissions, money, data integrity).

Everything else is `MEDIUM`. An unresolved *minor* detail does not by itself force `LARGE`.

The class selects review **depth**, never authorization: the coverage check (R1), decision check (R6), failure-path check (R5), and summary-fidelity check (R10) apply to every class. `SMALL` may write `None — <reason>` for Dependencies and interfaces (R4) and needs only the evidence types its change actually touches (R3). A wrong label is a finding only through what it caused to be omitted, at that omission's severity — never a standalone formatting violation.

## R3 — Repository evidence

PLAN.md gains **Repository evidence**: per confirmed repository, rows `id (E1…) · type · location (path[:symbol]) · one-sentence statement · [REPO]`.

Types: `RESPONSIBLE_COMPONENT`, `ENTRY_POINT`, `INTERFACE`, `CONFIG`, `PERSISTENCE`, `CROSS_REPO_CALL`, `ADJACENT_TEST`, `NOT_FOUND`.

A `NOT_FOUND` row records the terms and scope searched and means **"not found by these searches in this scope"** — never proof of absence. It states the consequence of that uncertainty. When the plan depends on an absence (for example, "no existing consumer reads this field"), the Planner either investigates sufficiently to cite the responsible component, or routes the dependency as a `G3`/`BLOCKING` row (R6). This is not RED proof — it never substitutes for the tester's own procedure.

Every `[REPO]` claim that supports the Approach, an interface row, an affected-file entry, or a criterion cites an evidence id; one row may support several claims. Excerpts are at most one line. Roughly twelve rows per repository is a **presentation target, not a cap** — evidence is never omitted to meet it, and a change whose consequences justify more rows gets more rows. A "Searched:" line lists the identifiers and terms used.

## R4 — Affected files and Dependencies and interfaces

**Affected files** (heading unchanged from Phase 1; the unchanged verifier classifies every changed path against it): operative entries are **file paths only** — path · repository · change type (`NEW`/`EDIT`/`CONFIG`/`DELETE`) · reason (AC/P/I/Q/C ids) · confidence (`HIGH` when an evidence row cites the path or its package; `LOW` otherwise, with the reason) · evidence id. An entry with no reason is forbidden. Locations that cannot be named as a file go under a separate **Investigation notes** list inside the section, explicitly non-operative: the verifier does not consult it, and the developer's IMPLEMENTATION.md Deviations from plan remains the place a resulting path is explained. **No directory or component entry is ever operative** — a directory or component name is never a valid Affected files row. Investigation notes are written as **prose** — a question plus the evidence id it relates to (for example, "which module owns retry backoff? — see E4") — **never** as a path or path prefix (for example, never a bare `src/ledger/` line): the verifier's changed-path match is textual, so anything written in path shape could be read as an operative entry regardless of the section it sits under.

**Dependencies and interfaces**: `None — <reason>` or rows `id (I1…) · provider · consumer · contract (what is added or changed, field level, never code) · failure behavior (what the consumer does when the provider fails or is absent) · deployment compatibility (may the consumer ship first? old callers?) · implementation order (development sequencing, distinct from rollout) · owner / prerequisite`. Deployment compatibility and implementation order are distinct questions — repositories can be developed in parallel while still carrying a rollout prerequisite. An owner outside this run is recorded as an external dependency with the decision or constraint it needs; a G3 answer never authorizes another team's work.

## R5 — Acceptance criteria: testability fields and preservation expectations

Each criterion keeps Given/When/Then and its source class (`JIRA` / `DEV` / `DERIVED` / `PROPOSED`, the last citing its `G3` row) and adds:

- **Observed at** — an **existing** exercise route through which the *Then* is observable (a public entry point, returned value, persisted state, emitted call), citing an evidence id. A new behavior is usually reachable through an existing route; the Planner must identify it. When no existing route exists, the criterion states `NO EXISTING ROUTE` and the prerequisite becomes a `G3` row (approve scaffolding as scope, redirect, or accept that the tester will raise `TEST_BOUNDARY_MISSING`) — the gap is exposed at planning time; the tester's contract is unchanged and a future boundary never satisfies it. `Observed at: NEW` (naming a boundary that does not yet exist as if it already satisfied testability) is never written.
- **Preconditions** — the state the *Given* requires.
- **Path** — `POSITIVE` or `NEGATIVE`. Every requirement item whose source text or evidence names a failure, limit, exhaustion, empty, or unavailable condition has at least one `NEGATIVE` criterion or an explicit "no failure path: `<reason>`".
- **Combined outcomes** — where two outcomes can coincide (success with reporting failure, terminal state with pending work), the plan states the required combined behavior as a criterion or an explicit decision; the Adversary challenges this per `challenge-plan`.

Sub-heading **Preservation expectations** (`P1…`, Given/When/Then, evidence id): intended unchanged business behavior, drawn from `PRESERVED` items and from evidence the change touches. They express **intent** supported by evidence; they do **not** prove the baseline passes, do **not** predetermine any test's classification, and do **not** override the tester's baseline-failure procedure. Because they sit under Acceptance criteria, the unchanged tester consumes them as ordinary scenarios.

## R6 — Decisions and open questions (replaces "Open questions")

PLAN.md's **Decisions and open questions** table: `id (Q1…) · statement · routing · planner recommendation (may be empty) · basis · consequence if wrong (concrete and observable) · surfaced at`. A row is required for every **consequential unresolved choice or material assumption**; routine implementation details are not rows.

| Routing | Meaning | Rule |
|---|---|---|
| `ASSUMED` | Planner proceeds; shown at G3 as a count with ids. | Only when the choice is technical, reversible within the change, and its consequence-if-wrong is recorded concretely or is already covered by cited evidence. A row is never `ASSUMED` because future RED/verification "would catch it"; ordering, latency, and failure semantics (for example synchronous versus asynchronous calls) are material unless evidence shows otherwise. |
| `G3` | Developer decides; the recommendation is displayed, not consent. | Any of: fixes user-observable behavior Jira/DEV do not state; chooses between interpretations of a requirement; adds or removes scope; changes a cross-repository contract or persisted shape; introduces a **new or changed materially observable default or limit** with no authoritative requirement or approved basis; a `NO EXISTING ROUTE` prerequisite. |
| `BLOCKING` | Planning cannot proceed on any honest proposal. | Meaning undeterminable, contradictory items, or a repository or owner outside the run's authorization. The item is `UNRESOLVED`; the Adversary renders BLOCK by rule. |
| `OUT_OF_SCOPE` | Belongs elsewhere. | Recorded under Out of scope with reason. |

**Shipped values (the D4 rule):** preserving an evidenced existing default, or applying a supplied approved policy, is **not** a new decision merely because Jira omits the number — the plan cites the evidence or policy instead (this is the preserved-evidenced-default / supplied-approved-policy exception). Inventing a value is a `G3` row that states units, counting semantics, and consequence. Inconsequential internal constants are not rows.

A newly needed repository is **never** added by a plan or by a G3 answer: it is a `BLOCKING` row; the developer's decision to include it re-asks G1 for that repository and runs stage 2 for it before a new planning cycle (see `cycle.round`, below, and `AGENT-CONTRACTS.md`/`pipeline.agent.md` for the cycle mechanics).

## R7 — Risks

Each risk names its trigger (an item, evidence, interface, or decision id), an optional category (`correctness · backward-compatibility · data-integrity · integration · operational/config · rollout · uncertainty` — vocabulary, not a checklist), and a **treatment**: covered by AC/P id · decision id · unresolved prerequisite (Q id) · `ACCEPTED (reason)`. A risk that restates a criterion or names nothing specific to this change is dropped, not padded in to fill a section. `ACCEPTED` risks appear at G3.

## `cycle.round` identity (R8, identity only)

Stage 3 and 4 artifacts carry a `cycle.round` identity (`1.1`, `1.2`, `2.1` …) in PLAN.md's and ADVERSARY-REVIEW.md's round sections and in RUN.md's Stage status table, Artifact history, and gate bases. Cycle 1 is the ordinary run; round increments within a cycle on an ordinary REVISE; the cycle number increments only when a new planning cycle starts. This skill states the identity's shape and where it is written only — when a new cycle starts, what happens to superseded artifacts and gate answers, and how G3 answers are recorded, are normative in `AGENT-CONTRACTS.md` and `pipeline.agent.md`, not restated here.

## R10 — Decision summary content

PLAN.md ends with **Decision summary** (before the round sections), written for the developer, not for a reviewer re-deriving the plan:

- **Intended outcomes** — two to five sentences of business behavior, ids linking to criteria, never ids alone.
- **Material choices** — each `G3` row: statement, recommendation, consequence if wrong.
- **Exclusions and unresolved scope** — `EXCLUDED`/`UNRESOLVED` items; `PRESERVED` items are **not** listed for acknowledgement (preservation normally satisfies a requirement and does not need a separate developer sign-off).
- **Consequential assumptions** — `ASSUMED` count with ids; any the Adversary flagged material is re-routed `G3` in the revision.
- **Accepted risks**.
- **Cross-repository prerequisites** — order, compatibility, external owners.

"One screen" is a usability target, never permission to omit material information. The Adversary's fidelity check compares the summary to the body; a material omission is HIGH (see `challenge-plan`). The exact wording `pipeline` voices at G3 from this summary, and the G3 answer enum and recording rules, are normative in `AGENT-CONTRACTS.md`/`pipeline.agent.md`/`FLOW.md` — this skill governs the summary's *content*, not the gate's script.

## Mapping to PLAN.md

| Rule above | PLAN.md heading it populates |
|---|---|
| R1 | **Requested scope disposition** (per-key table and requirement items table) |
| R2 | **Scope** (Change class line) |
| R3 | **Repository evidence** |
| R4 (Affected files) | **Affected files** (operative table; Investigation notes) |
| R4 (Dependencies and interfaces) | **Dependencies and interfaces** |
| R5 | **Acceptance criteria** (Observed at / Preconditions / Path / Combined outcomes; Preservation expectations) |
| R6 | **Decisions and open questions** |
| R7 | **Risks** |
| `cycle.round` | **Adversary round** heading and the round sections |
| R10 | **Decision summary** |
| — (not this skill) | **Approach per repository**, **Out of scope**, **Response to adversary findings** — see the planner's own procedure and `AGENT-CONTRACTS.md` |
