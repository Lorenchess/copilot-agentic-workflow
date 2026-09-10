```yaml
artifact: RUN.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: PLANNED
producedBy: pipeline
inputs: [INTAKE.md, PLAN.md, ADVERSARY-REVIEW.md]
```

## Keys

1. `PAYMENTS-12345` — primary [DEV] (first key typed to `/pipeline`)
2. `PAYMENTS-12351` — secondary requested [DEV]

Developer invocation: `/pipeline PAYMENTS-12345, PAYMENTS-12351` [DEV].

## Repositories

| Repository | Recommended | Confidence | Selected | Evidence summary |
|---|---|---|---|---|
| `payments-api` | yes | HIGH [JIRA]/[REPO] | yes | Jira Components match; `WebhookDeliveryService` found in code — see INTAKE.md |
| `payments-ledger` | yes | HIGH [JIRA]/[REPO] | yes | Jira Components match; `AuditLogRepository` found in code — see INTAKE.md |
| `payments-web` | yes | LOW [INFERENCE] | no | Name similarity only, no Jira or code evidence — see INTAKE.md |

Both selected repositories were agent-recommended [DEV]. `payments-web` was recommended (LOW) but excluded by the developer at G1 [DEV].

## Branch

`PAYMENTS-12345-webhook-retry-backoff` [DEV] — accepted as proposed at G2 (INTAKE.md's Proposed branch name, unchanged).

## Developer context

- [DEV] "Keep the retry backoff config in application.yml, don't hardcode it."
- [DEV] "Ledger team asked that retry attempts write to the existing audit_log table, not a new table."

## Stage status table

| # | Stage | Agent | Artifact | Status | Round |
|---|---|---|---|---|---|
| 0 | Entry | pipeline | RUN.md | COMPLETE | — |
| 1 | Intake | intake | INTAKE.md | COMPLETE | — |
| 2 | Workspace (prepare) | workspace | WORKSPACE.md | COMPLETE — both repositories PREPARED [INFERENCE] (reused for scenario continuity from `docs/examples/PAYMENTS-12345/WORKSPACE.md`'s pattern; not reproduced as a separate file in this planning-only variant, since this directory demonstrates stages 1, 3, and 4 only) | — |
| 3 | Plan | planner | PLAN.md | COMPLETE | 1.2 |
| 4 | Adversary | adversary | ADVERSARY-REVIEW.md | COMPLETE — APPROVE | 1.2 |
| 5 | Test (RED) | tester | TEST-CONTRACT.md, RED-REPORT.md | NOT RUN — planning-only demonstration | — |
| 6 | Develop (GREEN) | developer | IMPLEMENTATION.md | NOT RUN — planning-only demonstration | — |
| 7 | Verify | verifier | VERIFICATION.md | NOT RUN — planning-only demonstration | — |
| 8 | PR draft | pr | PR-DESCRIPTION.md | NOT RUN — planning-only demonstration | — |
| 9 | Publish | workspace | WORKSPACE.md (Publish section) | NOT RUN — planning-only demonstration | — |
| 10 | PR | pr | PR.md | NOT RUN — planning-only demonstration | — |

This run stops at G3 by design (see README.md); stages 5–10 are not run and produce no artifacts in this directory.

## Artifact history

| Artifact | Stage | Round | Status | Producing agent |
|---|---|---|---|---|
| INTAKE.md | 1 | 1 | ACTIVE | intake |
| PLAN.md | 3 | 1.1 | SUPERSEDED | planner |
| ADVERSARY-REVIEW.md | 4 | 1.1 | SUPERSEDED | adversary |
| PLAN.md | 3 | 1.2 | ACTIVE | planner |
| ADVERSARY-REVIEW.md | 4 | 1.2 | ACTIVE | adversary |

Round-`1.1` PLAN.md and ADVERSARY-REVIEW.md (adversary verdict REVISE — findings F1 HIGH, F2 HIGH, F3 MEDIUM, F4 HIGH; see PLAN.md 1.2's Response to adversary findings) are recorded here as SUPERSEDED; only the round-`1.2`, ACTIVE versions are this run's PLAN.md and ADVERSARY-REVIEW.md. No gate answer became STALE in this run: G3 was first asked after the round-`1.2` plan, so no G3 answer existed when the round-`1.1` PLAN.md and ADVERSARY-REVIEW.md were superseded. This is the ordinary bounded planner/adversary loop within cycle 1 (contract A6) — no developer-directed new planning cycle occurred.

## Gates log

**G1 — Repositories.** Asked: "Which repositories does this work affect? Recommended: `payments-api` (HIGH, Jira Components match + `WebhookDeliveryService` found in code), `payments-ledger` (HIGH, Jira Components match + `AuditLogRepository` found in code), `payments-web` (LOW, name similarity only). Select the repositories to include." Answered [DEV]: select `payments-api`, `payments-ledger`; exclude `payments-web`. Both selected repositories were agent-recommended. Basis: INTAKE.md round 1 — Status: CURRENT.

**G2 — Branch and context.** Asked: "Proposed branch name: `PAYMENTS-12345-webhook-retry-backoff`. Accept or provide a replacement slug. Optionally add context (constraints, known files, things to avoid, discussion with another developer) — or continue without adding context." Answered [DEV]: accept proposed slug unchanged; context provided (see Developer context above). Basis: INTAKE.md round 1 — Status: CURRENT.

**G3 — Plan approval.** Asked, round `1.1`: adversary returned REVISE (findings F1 HIGH, F2 HIGH, F3 MEDIUM, F4 HIGH — see ADVERSARY-REVIEW.md's Response-to-findings history in PLAN.md 1.2), so G3 was not yet asked; the planner produced a round-`1.2` plan instead. Asked, round `1.2`, voiced directly from PLAN.md 1.2's Decision summary and ADVERSARY-REVIEW.md 1.2's verdict, round, and Residual findings:

> "The plan for `PAYMENTS-12345` (cycle `1`, round `2`; change class `LARGE` — a new cross-repository interface (I1) plus an audit-trail data-integrity consequence if a retry report is silently lost, either of which alone would warrant `LARGE`) has been reviewed (`APPROVE`). Intended outcomes: Failed webhook deliveries to merchant endpoints are automatically retried with exponential backoff instead of failing permanently on the first error (AC1); retries stop once the configured maximum number of attempts has all failed and the delivery is marked permanently failed (AC2); a successful retry stops further attempts (AC3). Every retry attempt — successful or not — is recorded in payments-ledger's existing audit trail with the delivery id, attempt number, and outcome (AC4); if that audit-trail report itself cannot be delivered, it is re-attempted alongside the delivery's own retries and, if the delivery still finishes without a successful report, an explicit, queryable marker is left rather than silently losing the record (AC5). Material choices needing your answer: Q1: shipped defaults for maxAttempts and baseDelay are not stated in either Jira issue — recommended: maxAttempts = 5 total attempts including the first, baseDelay = 1 second; if wrong: too few attempts abandons deliveries that would have recovered, too many or too-long delays unacceptably lengthens merchant-visible delivery latency. Q2: whether the report to payments-ledger (I1) is synchronous within the retry step or asynchronous — recommended: synchronous, matching the existing LedgerClient usage pattern; if wrong: an asynchronous report could let the delivery reach a terminal state before a report failure is known, defeating AC5's UNREPORTED marking, and the ordering between report and state persistence becomes non-deterministic. Q3: whether the new PERMANENTLY_FAILED status and the new ledgerReportStatus field are exposed through the existing merchant-facing delivery status endpoint — recommended: expose PERMANENTLY_FAILED, do not expose ledgerReportStatus; if wrong: merchants either see no signal that retries have stopped, or gain a dependency on an internal audit-trail bookkeeping field that must then be preserved indefinitely. Q6: terminal outcome for a delivery that becomes terminal with a retry attempt still unreported to payments-ledger — recommended: persist ledgerReportStatus = UNREPORTED and attempt no further report, with no indefinite retry and no alerting/dead-lettering; if wrong: either the delivery's terminal state is indefinitely blocked on an unreachable ledger, or the audit-trail gap goes unrecorded. Exclusions and unresolved scope: none. Consequential assumptions: none. Accepted risks: RK1 (test-timing scaffolding, deferred to Phase 3), RK2 (lockstep retries without jitter), RK5 (report-succeeds-but-persist-fails data-integrity edge). Cross-repository prerequisites: payments-ledger's new retry-attempt-recording endpoint (I1) should be deployed before payments-api enables retry reporting; payments-api tolerates the endpoint's absence via AC5's UNREPORTED marking and may ship first, but reports made before payments-ledger is live remain UNREPORTED until it is. Adversary residual findings: F5, LOW: AC1's backoff formula has no jitter; many webhooks failing at the same time would retry in lockstep against the same downstream endpoint — not blocking. For each material choice, accept the recommendation or give a replacement. Then: Approve this plan as displayed to proceed to test authoring / Send back with answers / Abort."

Answered [DEV]: **APPROVE**. Each material choice's answer: Q1 — accept recommendation (`maxAttempts = 5`, `baseDelay = 1s`); Q2 — accept recommendation (synchronous); Q3 — accept recommendation (expose `PERMANENTLY_FAILED`, not `ledgerReportStatus`); Q6 — accept recommendation (persist `ledgerReportStatus = UNREPORTED`, no further report attempted). Exclusions acknowledged: none (none were displayed). Basis: PLAN.md `1.2`, ADVERSARY-REVIEW.md `1.2` — Status: CURRENT.

Only a `CURRENT` `APPROVE` answer authorizes stage 5; this run stops here by design (see README.md) — stage 5 (Test) is not invoked.

## Resume notes

None.
