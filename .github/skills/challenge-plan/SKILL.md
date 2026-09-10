---
name: challenge-plan
description: Independent review method for PLAN.md — reading order, independent requirement derivation, the two consequence-driven independent checks, the challenge catalogue, finding shape, severity, and verdict interpretation. Read explicitly by the adversary agent only, in addition to plan-grounding; not a slash command.
user-invocable: false
disable-model-invocation: true
---

# `challenge-plan` — independent adversary review method

This skill is the normative independent-review method for stage 4 (Adversary) of `FLOW.md`. It is read explicitly by `.github/agents/adversary.agent.md`, in addition to `plan-grounding/SKILL.md` (the shared contract PLAN.md must satisfy — read this skill after that one). `planner` does not read this skill. It does not auto-load into any conversation. It governs *how* the Adversary reviews, not what PLAN.md must contain — that is `plan-grounding`.

Historically sourced from `docs/specs/2026-09-10-phase-2-planning-quality-contract.md` §2 R9, which remains the normative text if this skill and the contract ever appear to diverge.

## Order and independence

1. **Read INTAKE.md and RUN.md first**, before reading PLAN.md's disposition, and record an **Independent requirement derivation**: the items and developer constraints, and the INTAKE Unknowns/Warnings that bear on them, derived independently from those inputs — not copied from PLAN.md's Requested scope disposition. Then diff the independent derivation against PLAN.md: an item present in the derivation but missing from the plan is a finding (severity HIGH); an item in the plan with no source in the derivation is invented scope (severity HIGH). This establishes fidelity to the captured inputs, not completeness against the original Jira — both roles derive from the same captured INTAKE.md/RUN.md, so this is not independent verification against Jira itself.
2. **Confirm the change class** through what it caused to be included or omitted (per `plan-grounding` R2) — not as a standalone label check.
3. **Independent checks**, recorded even when nothing is found:
   - **(a) Evidence verification.** Verify the evidence rows that material claims rest on: does the cited path/symbol actually show what the row states?
   - **(b) The consequence-driven check.** Answer: *"what relevant caller, consumer, configuration, invariant, or failure interaction would make this plan wrong even if its citations are true?"* Select the material boundary that reasoning points to — including evidence the Planner did not cite — inspect it, and record what was inspected and the result. SMALL work may need only one obvious local check; there is no quota of files or findings to hit.
   - **(c) The combined-outcome check.** Answer: *"could an implementation satisfy every listed criterion yet violate the requested business behavior?"* Record the combined-outcome cases considered (for example: terminal success with reporting failure, or a state transition combined with pending work).
4. **Work the challenge catalogue** (below).
5. **Findings**: `id · category · severity · evidence · what the plan must show or decide`. A finding may include a concise counterexample or a bounded alternative (for example, "this existing operation appears to cover the requirement; why introduce another?") but never a competing full plan — the Adversary evaluates and challenges, it never authors a replacement plan, and it never edits PLAN.md.
6. **On a later round or cycle**, review PLAN.md's Response to adversary findings and re-raise any rejection lacking evidence-backed rationale — a rejection with no cited evidence is treated as unaddressed.

## The challenge catalogue

Each category below carries a one-line evidence expectation — what the Adversary must have looked at, not merely asserted, before recording "no finding" in that category.

| Category | Evidence expectation |
|---|---|
| Missing requirements | The independent requirement derivation (step 1) actually names every item found; a gap is checked against that derivation, not against a re-reading of PLAN.md alone. |
| Invented scope | Every plan item traces to the independent derivation or to explicit, cited reasoning in the plan; an item with neither is invented. |
| Unsupported or misrouted assumptions | Every `ASSUMED` row is checked against the R6 routing rule (`plan-grounding`); a row that should be `G3` (material, irreversible, or consequence not concretely recorded) is a finding. |
| Untestable criteria (no existing route, no preconditions) | Every acceptance criterion's Observed at and Preconditions fields are checked, not skimmed; a criterion with no route and no `G3` prerequisite row is a finding. |
| Missing failure paths and combined outcomes | Requirement items naming a failure/limit/exhaustion/empty/unavailable condition are checked against the criteria for a NEGATIVE path or an explicit "no failure path" note; the combined-outcome cases from independent check (c) are checked against what PLAN.md states. |
| Cross-repository inconsistency | Each Dependencies and interfaces row is checked for whether failure behavior, deployment compatibility, and implementation order are actually distinct and coherent with each other, not merely present as text. |
| Backward-compatibility gaps | Interface and persistence changes are checked against whether an old caller/consumer would still function, using the deployment compatibility field and, where material, repository evidence beyond what the Planner cited. |
| Unacknowledged operational risk | Risks are checked for a treatment (R7); a risk with no treatment, or an operational condition with no risk row at all, is a finding. |
| Plan-to-repository mismatch | Spot-check Repository evidence rows against the actual repository content at the cited location, not just against the plan's prose describing them. |
| Unnecessary complexity | Checked against whether an existing operation, path, or component already covers the requirement; a concise bounded alternative may be offered, never a competing full plan. |
| Unclear proposed decisions | Every `Q` row is checked for a concrete, observable consequence-if-wrong; a vague consequence ("could cause issues") is a finding. |
| Decision summary fidelity (R10) | The Decision summary is compared against the plan body, not read in isolation; a material choice, exclusion, or risk present in the body but absent from the summary is a finding. |

## Finding shape

`id · category · severity · evidence · what the plan must show or decide` — every finding names the category it belongs to (from the catalogue above or "other"), cites the evidence it rests on (a PLAN.md id, a repository location, or an INTAKE.md/RUN.md fact), and states concretely what the plan must show or decide to resolve it, not merely that something is wrong.

## Severity and verdict

**Severity:**
- **HIGH** — item missing or invented; evidence contradiction the approach depends on; criterion with no existing route and no `G3` row; undeclared interface; an `ASSUMED` row that meets the `G3` rule; a material combined outcome unstated.
- **MEDIUM** — missing negative criterion where a failure path exists; risk without treatment; `LOW`-confidence entry without reason; `G3` row without concrete consequence.
- **LOW** — note.

**Verdict:**
- Any HIGH → **REVISE**.
- **BLOCK** for a `BLOCKING` row, contradictory items, or a choice only the developer can make before revision is worthwhile.
- **APPROVE** only when no HIGH remains and every MEDIUM is fixed or listed as a **residual finding**.

A `BLOCKING` row in PLAN.md's Decisions and open questions always yields BLOCK — this is a rule, not a judgment call the Adversary weighs against other findings.

A **zero-finding APPROVE is legitimate**: it simply records that the independent checks (step 3 above) were actually performed and turned up nothing. There is no requirement that a review contain a novel finding, and no count-based sentence ("N findings raised", "reviewed M files") is required or expected to demonstrate independence — the record of what was independently derived and what was inspected in steps 1–3 is what demonstrates it.

## Counterexample and bounded-alternative allowance

A finding may include a concise counterexample or a bounded alternative to explain a flaw (see Findings, step 5, and the "unnecessary complexity" catalogue row). This is explanation of a finding, not an alternative deliverable: the Adversary never proposes a competing full plan and never edits PLAN.md under any tool name.

## Reviewing the Response to adversary findings

On a second round within a cycle, or on the first round of a new cycle, the independent requirement derivation and the independent checks (steps 1–3) are always performed first, exactly as on a first round; only after they are complete is PLAN.md's Response to adversary findings section read. Each prior finding must appear there as `ACCEPTED (what changed)` or `REJECTED (rationale, evidence)`. A `REJECTED` entry with no cited evidence or rationale is re-raised as if unaddressed — the response table makes omissions reviewable, it does not by itself prevent them. On a new cycle, also check how each G3 answer (recorded in RUN.md and referenced by the new PLAN.md) was incorporated.

## Decision summary fidelity

Compare PLAN.md's Decision summary against the plan body it summarizes (`plan-grounding` R10): every material choice, exclusion, accepted risk, and cross-repository prerequisite stated in the body must be reachable from the summary. A material omission from the summary is a HIGH finding under Decision summary fidelity, independent of whether the underlying body content was otherwise correct.

## Mapping to ADVERSARY-REVIEW.md

| Rule above | ADVERSARY-REVIEW.md heading it populates |
|---|---|
| Order step 1 | **Independent requirement derivation** |
| Order step 3 | **Independent checks** (evidence verification; consequence-driven check with boundary selected, inspected, result; combined-outcome cases) |
| Order steps 2, 4, 5 | **Findings** |
| R6-routing check (catalogue row) | **Assumptions and decisions challenged** (per Q row: agree / should be `G3` / should be `BLOCKING`) |
| Untestable-criteria and missing-failure-path catalogue rows | **Acceptance criteria and preservation review** |
| Decision summary fidelity | **Decision summary fidelity** |
| `cycle.round` (see `plan-grounding`) | **Round** |
| Severity/verdict rules | **Verdict**; **Residual findings** (every finding still open on this verdict — on APPROVE the unresolved MEDIUM/LOW; on REVISE or BLOCK every open finding, so a developer who later accepts the plan as-is at `ADVERSARY_REVISE_LIMIT`/`ADVERSARY_BLOCK` sees them at G3; `none` only when nothing is open) |
