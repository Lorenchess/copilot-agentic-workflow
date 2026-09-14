# Forward amendment — execution observation, unresolved executions, and bounded reconciliation

**Status: APPROVED FOR IMPLEMENTATION by owner instruction on 2026-09-14 ("continue with the other batches; Astra will review everything done at the end"). Astra's independent review of this text and of the resulting commit is pending and happens at the end of the batch sequence.** This file is the Batch B first output under Astra's plan (`docs/reviews/2026-09-14-harness-alignment-analysis-and-implementation-plan.md` §6A, §7 Batch B); the owner elected to defer the pre-edit review to the end-of-sequence review.

- **Base:** `main` at `77940936e7c1b8cd55b1ae29701c6f2b3d6dc85e`, plus the Batch A documentation commit if already applied (Batch A changes no execution rule). Locked references `phase-1-reference` … `phase-5-reference` remain immutable.
- **Author / role:** Fable 5.1 as architect. Implementation, once approved, is delegated to Sonnet 5; the architect reviews; Astra reviews the exact commit.
- **Supersedes:** only the clauses named in §6. Every other clause of the Phase 1–5 contracts, the two policy skills' retained normative sources, and the historical documents remain unchanged. Revision 2 of the alignment proposal's item H6 (which said stages 5 and 7 "consume another run under the existing budgets") is withdrawn in favour of this text; that proposal is a draft and was never operative.

## 1. Problem

A runner execution can outlive the host's observation window, be interrupted, or end without usable output. The current rules cover three neighbouring situations precisely — an environment that cannot produce a valid result (`RUNNER_UNAVAILABLE`, contract A6), a stage-6 reservation with no result (IQ3: `UNKNOWN`, consumed), and a test whose approved timing requirement is itself the assertion (T7) — but no rule says what an agent records, what it may not conclude, and what happens next when **the observation is lost and the process may still be running**. Two wrong readings are currently possible: treating the lost observation as an environment failure (which can hide a production hang), or treating another launch as an ordinary retry (which can overlap the first process, repeat side effects, or accumulate launches with no real FAIL). This amendment closes that ambiguity without a new STOP code, gate, artifact, verdict, tool, or budget.

## 2. Decisions (normative once approved)

**X1 — Four things are kept distinct.** *Tool observation* (what the host returned to the agent), *process completion* (whether the launched process ended), *test result* (identities and their results from a terminal, attributable output), and *stage verdict* (RED, GREEN, PASS/INCOMPLETE/FAIL). A tool that yields a live execution handle and later returns output describes **the same execution**; polling or waiting on that handle is not a second execution and reserves nothing. An observation timeout is not evidence that the process was killed, ended, passed, or failed.

**X2 — Observation states.** Every runner execution an agent records has one observation state: `OBSERVED` (a terminal, attributable result was captured), `OBSERVATION_LOST` (the host stopped observing before a terminal result; completion unknown), or `ENDED_INCOMPLETE` (the process is known to have ended, but the output is incomplete or not attributable to a result). `OBSERVED` is required before any test result is derived. The other two are **unresolved executions**. `UNKNOWN` remains the IQ3 word for a reservation's missing result; it describes missing execution evidence and is never a fourth Verifier verdict or a test result.

**X3 — What is recorded, where.** For an unresolved execution the owning agent records, in its own existing artifact under its existing execution heading: the exact command, repository, observed HEAD and working-tree status before launch, any handle or identity the host exposed (`[TOOL]` or `UNAVAILABLE`), the partial output captured, the observed host timeout value (`[TOOL]` or `UNAVAILABLE`), and the observation state. It derives **no** RED, GREEN, PASS, FAIL, or per-identity result from the unresolved execution. Independently established results from other `OBSERVED` executions in the same invocation are retained, and previously confirmed failures are never erased.

**X4 — The stage does not finalize and does not advance.** The owning agent returns control to `pipeline` with the unresolved execution named. `pipeline` records the hold in RUN.md (Stage status table: `HELD — unresolved execution <id>`; Decision log: the facts relayed) and voices an **execution reconciliation decision** following the Phase 5 delivery-continuation precedent (a non-gate, Decision-log decision voiced by `pipeline` through its existing ask capability; not a new STOP code and not a routine gate). Neither an owned artifact's presence nor an earlier PASS satisfies completion while a hold is recorded; G4 is never asked on a held verification.

**X5 — Reconciliation before any replacement.** If an existing allowed read (the same execution's handle, the runner's own report file already on disk, or output the host retained) can retrieve the original terminal result, the agent reconciles it **as that original execution** and continues under the stage's ordinary rules; no new reservation, no replacement. Otherwise the decision offers exactly: (a) the human establishes through the corporate host that the process ended, reconciles any effect it had on the working tree, and supplies that fact `[DEV]`, then authorizes **named, explicitly bounded replacement executions** (one replacement per affected execution; the decision names each); or (b) abort. `pipeline` records the answer; no process-control command or tool is added to any agent. A further lost observation on a replacement returns to the same hold; there is **no automatic timeout-retry budget** at any stage.

**X6 — Stage-specific accounting (no budget is created or renewed).**
- *Stage 6 (Developer):* the unresolved execution's reservation stays consumed (`UNKNOWN`, IQ3 unchanged); a lost handoff attempt is a failed attempt as today, and the candidate is neither GREEN nor proven failing. A replacement execution takes its own reservation from the round's **remaining** allowance; the reconciliation decision renews nothing. If no allowance remains for the step the round needs, `IMPLEMENTATION_BLOCKED (BUDGET_EXHAUSTED)` applies unchanged.
- *Stage 5 (Tester):* there is no generic execution allowance and none is introduced. A lost first or second RED run, scoped relied-on run, or correction re-run is a replacement authorized only by the reconciliation decision; it does not consume and does not renew a WITNESS correction attempt. The T6 reproduction pair is re-established: a reconciled-ended lost execution is not an intervening run, so the replacement can complete the pair; if any other execution or source change intervened, both runs of the pair are named as replacements. `RUNNER_UNAVAILABLE` still requires its A6 condition to be evidenced.
- *Stage 7 (Verifier):* a lost contract, full-suite, or scoped relied-on run is recorded `UNRESOLVED` under its heading; the verification round is **not** a FAIL round for `VERIFIER_FAIL_LIMIT`, no verified SHA is recorded, and the Verifier renders no verdict for that repository. After reconciliation, the named replacement executes inside the **same** verification round and the existing bracket rule applies unchanged: the post-execution status must be clean and HEAD unchanged, otherwise FAIL "checkout changed during verification". The Verifier never diagnoses a hang by checking out another revision and never assumes Developer's diagnostic role.

**X7 — Evidence-based routing only, through existing routes.** Once a terminal, attributable result exists, ordinary rules apply. A test whose approved interval is the assertion and fails is test evidence (T7). Infrastructure shown unavailable is `RUNNER_UNAVAILABLE`. At stage 6, a hang that reproduces on the changed code is diagnostic evidence for IQ4 classification by the Developer, applied only when a class's actual conditions hold — it is not automatic proof of `NONDETERMINISTIC` or of any particular criterion. No rule in this amendment supplies a cause; the timeout observation supplies none.

**X8 — Resume.** A recorded hold with no reconciliation decision is re-voiced on resume, exactly as a pending `IMPLEMENTATION_BLOCKED` is; the owning agent is never re-invoked to "retry". On a recorded decision, `pipeline` re-invokes the owning agent naming only: the execution id, the decision outcome, the retrieved result verbatim `[TOOL]` when case X5-retrieve applies, or the named replacement executions when case X5-(a) applies. Tester (all non-activation modes), Adversary test-review mode, and Developer still do not read RUN.md.

## 3. Stage-specific field mapping (the only "shared vocabulary" this amendment introduces)

| Field | Stage 5 — RED-REPORT.md (Command per repository / Evidence excerpt) | Stage 6 — IMPLEMENTATION.md (Iteration log row) | Stage 7 — VERIFICATION.md (Contract test run / Full-suite run / Checkout state) |
|---|---|---|---|
| Command, repository | present today | present today (`<id> · <repo> · …`) | present today |
| Pre-launch HEAD and status | staged-set record / anchor | bracket rows (handoff) or new one-line note | Checkout state (present) |
| Handle / identity from host | new, `[TOOL]` or `UNAVAILABLE` | new, on the row | new, per execution |
| Partial output | Evidence excerpt (present, may be partial) | row note | trimmed output (present, may be partial) |
| Observed host timeout | new, `[TOOL]` or `UNAVAILABLE` | new | new |
| Observation state | new: `OBSERVED` / `OBSERVATION_LOST` / `ENDED_INCOMPLETE` | new, alongside `result:` | new: `UNRESOLVED (<state>)` next to `NOT_RUN` |
| Result derivation | only from `OBSERVED` | `result: pending` → `UNKNOWN` (present) | none from an unresolved execution |
| Accounting effect | none (no allowance exists) | reservation consumed (present) | not a FAIL round; no verified SHA |
| Stage outcome while unresolved | package incomplete; return to `pipeline` | round held; return to `pipeline` | no verdict for the repository; return to `pipeline` |

Nothing else is normalized. `pending` stays distinct from `UNKNOWN`; a WITNESS failing at its own assertion stays valid RED evidence; a diagnostic run that discovers no identities stays legitimate; "possible to repeat" never means "permitted to repeat".

## 4. Acceptance cases (document scenarios until executed in an approved host)

| # | Case | Required discrimination under X1–X8 |
|---|---|---|
| 1 | Host yields a running handle, then returns a result | Same execution; `OBSERVED`; no second reservation, no overlapping launch, no hold. |
| 2 | Observation lost; process completion unknown | `OBSERVATION_LOST`; no environment diagnosis, no terminal result; evidence preserved; hold; reconciliation decision. |
| 3 | Process known ended, output incomplete | `ENDED_INCOMPLETE`; "ended" ≠ passed; a replacement needs the named authorization and, at stage 7, renewed eligibility checks (preflight and bracket). |
| 4 | Stage-6 last available handoff attempt interrupted | Reservation consumed; no fresh round through generic resume; a replacement needs remaining allowance, else `BUDGET_EXHAUSTED`; a fully evidenced success on the last allowance still stands. |
| 5 | Stage-5 second RED run, or stage-7 full suite, loses output | Stage's own proof rules kept: the pair is re-established (stage 5) or the run is replaced inside the same verification round (stage 7); no Developer allowance is borrowed; no Verifier FAIL round is consumed. |
| 6 | Approved timing assertion fails vs. infrastructure demonstrably unavailable | Test evidence (T7) vs. `RUNNER_UNAVAILABLE` (A6); the observation state is `OBSERVED` in the first case. |
| 7 | An old PASS exists before an interrupted new verification | Old evidence cannot advance the run or authorize G4; the hold governs; earlier confirmed findings are retained. |

## 5. Operating file scope after approval

| File | Change |
|---|---|
| `.github/skills/test-contract/SKILL.md` | T6/T7: observation states, what an unresolved execution may not establish, pair re-establishment; one short subsection. |
| `.github/skills/implementation-quality/SKILL.md` | IQ3/IQ14: same-execution reconciliation, observation state on the row, no renewal, evidence-based routing sentence; Verifier: `UNRESOLVED` and the same-round replacement. |
| `.github/agents/tester.agent.md`, `developer.agent.md`, `verifier.agent.md` | Each owner's recording and return obligation, pointing to the policy (no restatement). |
| `.github/agents/pipeline.agent.md` | Hold recording, the reconciliation decision (delivery-continuation shape), re-invocation content, resume precedence. |
| `.github/pipeline/FLOW.md`, `AGENT-CONTRACTS.md`, `.github/skills/pipeline/SKILL.md` | Only: stage table cells for 5/6/7 (one clause each), Decision-log template line, RUN.md Stage status value, resume sentence. |

**Unchanged surfaces (must match byte-for-byte or be verified unchanged):** every STOP code and message; G1–G4 wording and answers; the 6/6/2/2 allowances and the 2-attempt/1-correction/2-fix-round limits; `.vscode/settings.json`; every tool list; every command form; artifact set (twelve); role/mode input restrictions; protected-path ownership; delivery safeguards; MODEL-ROLES.

## 6. Supersession statement

This amendment supersedes only: (i) any reading of contract A6 / the `RUNNER_UNAVAILABLE` definition under which an execution with no terminal result is, by that fact alone, an environment condition; (ii) any reading of IQ3's "interrupted" that treats a lost observation as licence to launch again without reconciliation; (iii) any reading of the Verifier fix-round budget as permission for repeated reruns after a lost observation. All other clauses remain in force, and the two skills' "historically sourced … remain the normative text if they diverge" sentences continue to apply to their contracts, read together with this amendment.

## 7. Review request

Astra reviews this text for: coherence of X1–X8 with T6/T7, IQ2–IQ4, IQ14, the Verifier bracket rule, and the delivery-continuation precedent; the seven cases; the file scope; and the unchanged-surface list. On approval the owner authorizes Sonnet 5 delegation; the architect briefs, reviews, and commits locally; nothing is pushed without the owner's authorization text.
