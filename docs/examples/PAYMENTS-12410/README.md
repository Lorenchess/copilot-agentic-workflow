# Worked example — PAYMENTS-12410 (planning-only, Phase 2, SMALL)

This directory is a **Phase 2 planning-only example** for a fictional ticket, PAYMENTS-12410, "Reject non-HTTPS webhook endpoint URLs at merchant webhook registration." It runs stages 0–4 of `.github/pipeline/FLOW.md` (Entry, Intake, Workspace, Plan, Adversary) and stops at gate **G3 — Plan approval**. Stages 5–10 (Test through PR) are **not run** and produce no artifacts in this directory.

Where `docs/examples/PAYMENTS-12345-planning/` demonstrates the `LARGE` end of Phase 2's planning contract (a cross-repository interface, several `G3` decisions, a round-1.1-to-1.2 revision resolving three findings), this directory demonstrates the opposite end: a genuinely **`SMALL`** change, in a single repository, with no new or changed interface, no persistence or configuration change, and no unresolved material choice. It shows that Phase 2's richer contract does not force artificial weight onto a small change — PLAN.md here is short, Dependencies and interfaces is `None — <reason>`, and ADVERSARY-REVIEW.md legitimately records an **APPROVE on round 1.1**, with zero findings, because the independent checks it performed actually found nothing to raise — not because those checks were skipped.

**Everything in this directory is fictional.** The Jira key, issue, and field value; the repository name, file paths, and code descriptions; every identifier (`E1…`, `Q1…`, `AC1…`, `P1…`, `R1…`) is invented for illustration, as in `docs/examples/PAYMENTS-12345/` and `docs/examples/PAYMENTS-12345-planning/`. This directory does not modify, and is independent of, either of those.

## Reading order

1. `RUN.md` — keys (a single primary key, no secondary), repositories (only `payments-api` recommended and selected), branch, developer context (`provided: false`), Stage status table through stage 4 (stages 5–10 explicitly not run), Artifact history (round `1.1` ACTIVE throughout — no revise round was needed), the full G3 gate entry (owner: `pipeline`).
2. `INTAKE.md` — the fictional Jira facts and repository recommendation this plan is grounded in (owner: `intake`).
3. `PLAN.md` — `Change class: SMALL` with the sentence stating every limiting condition holds; a two-item requirement table (one `IMPLEMENTED`, one `PRESERVED`); repository evidence including a `NOT_FOUND` row; `Dependencies and interfaces: None — <reason>`; two acceptance criteria (one NEGATIVE, one POSITIVE) plus one preservation expectation; one risk; one `ASSUMED` decision row; a short Decision summary (owner: `planner`).
4. `ADVERSARY-REVIEW.md` — an independent two-item requirement derivation, one obvious local check appropriate to `SMALL` work, one combined-outcome case, and a legitimate zero-finding `APPROVE` on round `1.1` (owner: `adversary`).

Every artifact carries the same six-field YAML header and the fixed section headings defined in `.github/pipeline/AGENT-CONTRACTS.md` and `.github/skills/plan-grounding/SKILL.md`/`.github/skills/challenge-plan/SKILL.md`, with inline provenance tags (`[JIRA]`, `[REPO]`, `[DEV]`, `[TOOL]`, `[INFERENCE]`) on every factual line.

For what to compare this example (and every other asset in this repository) against the organization's internal pipeline, see [`docs/COMPARISON-GUIDE.md`](../../COMPARISON-GUIDE.md).
