---
name: implementation-quality
description: Shared implementation-quality and verification-depth policy — GREEN and the controlled-path check, gaming patterns, the logical-round allowance and accounting, failure classification and routing, changed-path classes and hunk scope, deviation classes, refactoring, envelope changes, cross-repository implementation, IMPLEMENTATION.md evidence, proportionality, model-role notes, and the Verifier's obligation-first method, finding shape, fix-round scope, and could-not-verify semantics. Read explicitly by the developer agent (in full) and by the verifier agent (in full, then its Verification section as method); not a slash command.
user-invocable: false
disable-model-invocation: true
---

# `implementation-quality` — shared implementation-quality policy

This skill is the normative implementation-quality and verification-depth policy for stage 6 (Develop GREEN) and stage 7 (Verify) of `FLOW.md`. `developer` reads it in full, at the start of its procedure, before any edit. `verifier` also reads it in full, then follows the Verification section below (IQ11–IQ14) as its method. It does not auto-load into any conversation.

It states what counts as GREEN, how the bounded implementation round is accounted, how a failure is classified and routed, what a Developer may and may not touch, and how the Verifier derives obligations, classifies findings, and renders a verdict. It does **not** state stage sequencing, STOP wording, the loop-budget sentence's routing, artifact ownership, or template headings — those are normative in `developer.agent.md`, `verifier.agent.md`, `pipeline.agent.md`, `FLOW.md`, and `AGENT-CONTRACTS.md`.

Historically sourced from `docs/specs/2026-09-11-phase-4-implementation-quality-contract.md` §3 IQ1–IQ16, which remain the normative text if this skill and the contract ever appear to diverge.

## IQ1 — Inputs and the use of PLAN.md and TEST-CONTRACT.md

**Developer reads:**
- this skill;
- PLAN.md, TEST-CONTRACT.md (active revision), and RED-REPORT.md;
- WORKSPACE.md, for the baseline SHA only — a new input, and a single ownership-matrix cell;
- on a fix round, VERIFICATION.md's Findings for developer;
- on a directed round, the guidance `pipeline` quotes verbatim from RUN.md's Decision log, tagged `[DEV]`.

Developer never reads INTAKE.md, ADVERSARY-REVIEW.md, TEST-REVIEW.md, or RUN.md.

**How PLAN.md is consumed (never re-derived):**
- Affected files → the expected change set.
- Approach sentences and `C` rows → obligations.
- `Q` rows → approved answers. A `CURRENT APPROVE` exists only when every material choice accepted its recommendation.
- `I` rows → fields, failure behavior, deployment compatibility, and implementation order.
- Out of scope → exclusions.
- Change class → depth.

**How TEST-CONTRACT.md is consumed:** the active anchor, the controlled paths (T9), the contract command, relied-on identities, and Coverage gaps.

A plan found wrong or infeasible is routed (IQ4), never fixed in code. Verifier inputs are otherwise unchanged; it additionally uses RUN.md's `CURRENT` G3 entry and its Decision log.

## IQ2 — GREEN, the handoff attempt, and the controlled-path check

**GREEN.** A repository is GREEN only when a **handoff attempt** on its committed HEAD shows all of the following:
1. The exact contract command from the active TEST-CONTRACT.md revision ran unmodified: no added or removed filter, profile, `-D` property, flag, or environment variable.
2. Every contract identity (parameterized invocations counted individually) was discovered, executed, and not skipped; WITNESS tests pass and PRESERVATION tests pass.
3. Every relied-on identity was observed executed and passing (scoped command when the aggregate output does not name it).
4. The full suite passed with no failing identity (D3(c)).
5. The **controlled-path check** passes (below).
6. The envelope self-check (`diff --name-status <anchor>..HEAD -- <envelope files and relied-on tests>`) matches the declared Envelope changes.
7. The changed-path self-inventory (`diff --name-status <base>..HEAD`) contains no `UNRELATED` path.

**The handoff attempt is bracketed.** Immediately before its first execution and immediately after its last, Developer records `status --porcelain=v2 --branch` (clean) and `log -1 --format=%H` (the same SHA). A bracket that disagrees makes the attempt a failed attempt (IQ3). A passing working tree is never GREEN.

**The controlled-path check** covers the complete T9 set — Protected paths, proof-relevant envelope files, and relied-on existing tests. It has two halves, and both must pass:
- **Committed.** `diff --stat <anchor>..HEAD -- <protected paths>` is empty, and `diff --name-status <anchor>..HEAD -- <proof-relevant envelope files and relied-on tests>` lists nothing — except changes an activated amendment covers.
- **Working tree.** `status --porcelain=v2 --branch` shows no entry for any controlled path: not staged, unstaged, deleted, or renamed.

**When it runs.** Developer runs the check:
- at the start of every round, before that round's first runner execution — so it also runs after every human restoration;
- before every handoff attempt;
- whenever any status read, including the index-scope check, shows a controlled path.

**What a failure means.** A failure of either half is `CONTROLLED_PATH_CHANGED` (IQ4), never a budget outcome or merely an invalid handoff. Developer still restores nothing.

**Contract-gaming patterns (never used; read for by the Verifier):**
1. **Command, discovery, or configuration games:** narrowing the command, skip or failure-ignore properties, rerun-failing-tests counts, or include/exclude/tag/profile changes through an ordinary envelope file.
2. **Test-aware production code:** branching on test profile, environment, classpath, or class presence.
3. **Fixture overfitting:** special-casing literals that appear in contract tests or fixtures.
4. **Flake laundering:** accepting a pass after an identity has flipped between identical runs. A flip is diagnosed (IQ4), never rerun until green.

## IQ3 — Logical round, allowance, and accounting

**Logical round.** The stage-6 round recorded in RUN.md's Stage status table: `1` (initial), `2`/`3` (fix rounds after a Verifier FAIL, within the unchanged budget), `D<n>` (a directed round). Only `pipeline` starts a round, and only on one of these bases:
- stage-6 entry with a current test review;
- a Verifier FAIL within the fix budget;
- a recorded `IMPLEMENTATION_BLOCKED` decision authorizing a directed round, after any required human restoration.

Resuming after an activated mid-round amendment continues the same round with its remaining allowance; the no-progress comparison restarts from the first post-activation run.

**Allowance per repository per round** (pilot defaults; tunable only by owner decision):

| Kind | Limit |
|---|---|
| Contract iterations | 6 |
| Consecutive contract iterations without progress | 2 |
| Diagnostic runs | 6 |
| Handoff attempts | 2 |

**Units.**
- A **contract iteration** (`C<n>`) is one contract-command run after an edit batch, in the inner loop. **Progress** means the failing set of contract and relied-on identities shrinks, or stays the same while at least one failing identity fails later or differently in a way the edit explains.
- A **diagnostic run** (`D<n>`) is a compile goal or a scoped subset. It is never GREEN evidence.
- A **handoff attempt** (`H<n>`) is the bracketed IQ2 execution set: one contract run, one full suite, and any required scoped relied-on runs. One attempt id is shared by all of its component executions (logged `H<n>.1`, `H<n>.2`, …); the handoff counter counts attempts, never component rows.
- The **suite baseline** is at most one full-suite run per run, in round 1 before the first edit, at the active anchor, with a clean checkout and a passing controlled-path check. It is optional and used for diagnosis only (IQ4, D3(c)).
- The full suite runs only as the baseline or inside handoff attempts, never in the inner loop. Git reads are never counted.

**Accounting and success.**
- **A limit is checked before a step starts.** A contract iteration may start only while fewer than six have been reserved in this round; a diagnostic run only while fewer than six; a handoff attempt only while fewer than two.
- **Reaching a limit never overwrites an outcome.** A contract iteration that passes on the sixth allowance stands, and a handoff attempt may follow. A handoff attempt that succeeds on the second allowance completes the round `GREEN`.
- **Allowances are independent.** A spent contract or diagnostic allowance never prevents a handoff attempt that is still available. After a failed attempt, the repair may be tested by further contract iterations if any remain, or directly by the next handoff attempt, whose own contract run tests it.
- **A spent diagnostic allowance blocks nothing by itself;** it only means no further diagnostic runs.
- **`BUDGET_EXHAUSTED` is raised when the round needs a step for which no allowance remains** — another contract iteration while the contract still fails and none is left, or another handoff attempt after the last one failed. It is also raised, separately, when two consecutive contract iterations make no progress while the contract still fails.
- **A failed attempt** — any IQ2 condition unmet, or a bracket that disagrees — consumes its allowance. The candidate it examined is not handed off; the round continues if its next needed step still has allowance (IQ4).

**Log, persistence, resume.**
- At round start Developer writes IMPLEMENTATION.md with `status: IN_PROGRESS` and the round id.
- **Before** launching any runner execution, Developer appends that execution's Iteration log line with `result: pending`, which reserves it.
- After the execution, it records the result on the same line: `<id> · <repo> · <edit or purpose, one line> · failing: <ids | none> (Δ) · class`, with ids `BASELINE`, `C<n>`, `D<n>`, `H<n>.<k>`.
- The counters are derived from the log's reservations.
- An interrupted round (IMPLEMENTATION.md `IN_PROGRESS`) resumes at stage 6 in the **same** round, with the allowance its log leaves. A reservation without a result is recorded `UNKNOWN` and counts as consumed; an interrupted handoff attempt is a failed attempt.
- Generic resume never renews an allowance.
- An IMPLEMENTATION.md `BLOCKED` without a `CURRENT` Decision-log answer is re-voiced as `IMPLEMENTATION_BLOCKED`; `developer` is not invoked.

**Disclosed cost.** Per repository per round, the limits allow at most `16 + 2R` runner executions, plus one optional baseline per run: 6 contract iterations; 6 diagnostic runs; 2 handoff attempts of `2 + R` executions each. `R` is the number of scoped relied-on runs a handoff needs: zero when the contract or full-suite output already names every relied-on identity; it comes from TEST-CONTRACT.md. Each execution prompts in Manual mode. A typical run uses far fewer; the limits bound the worst case, not the average.

## IQ4 — Failure classification and routing

| Class | Meaning | Route |
|---|---|---|
| `IMPLEMENTATION_GAP` | A WITNESS fails at its own assertion | Keep iterating |
| `REGRESSION` | A PRESERVATION, relied-on, or full-suite identity fails, and the failure does not qualify as `BASELINE_FAILURE` | Repair production code (never the expectation) within the remaining allowance; the next handoff attempt follows |
| `BUILD_BREAK` | Compile/build failure caused by the change | Repair (never `RUNNER_UNAVAILABLE`) |
| `CONTRACT_SUSPECT` / `CONTRACT_CONFLICT` | A test observes wrongly or overconstrains / two clauses cannot both pass | `TEST-CHANGE-REQUEST` (T12, unchanged) |
| `ENVIRONMENT` | A6 conditions | `RUNNER_UNAVAILABLE` (unchanged) |
| `NONDETERMINISTIC` | An identity flips between identical runs | Diagnose: production race → implementation defect; test instability → `CONTRACT_SUSPECT`; environment → `RUNNER_UNAVAILABLE` |
| `BASELINE_FAILURE` | A handoff full-suite identity that failed identically in the recorded pre-edit baseline (same identity, assertion, and result), **and** Developer's inspection finds no changed path on its observation path. When the diff touches that path, or Developer cannot tell, the failure is `REGRESSION` | `IMPLEMENTATION_BLOCKED (BASELINE_FAILURE)`, with baseline and candidate evidence and **no claim about cause** |
| `MATERIAL_DEVIATION` | Delivering the contract needs an approach that contradicts an approved element (IQ6) | `IMPLEMENTATION_BLOCKED (MATERIAL_DEVIATION)` |
| `CONTROLLED_PATH_CHANGED` | The controlled-path check fails in either half, committed or working tree (IQ2) | `IMPLEMENTATION_BLOCKED (CONTROLLED_PATH_CHANGED)`; never self-repaired |

**Candidate versus round.**
- A failed handoff attempt means only that *this candidate* cannot be handed off. The round continues while its next needed step has allowance; only the STOP reasons end a round.
- A matching baseline symptom proves neither the cause of the failure nor that a repair would be out of scope. The `BASELINE_FAILURE` STOP presents the evidence, and the human may direct a round if they judge the failure attributable to the change.
- Without a recorded baseline, no failure is `BASELINE_FAILURE`.

**BLOCKED procedure.**
1. Report first: record `status: BLOCKED`, the reason, per-repository status, and the `[TOOL]` status output. The report never waits for cleanup.
2. Then, only if it is safe, commit production work-in-progress under a message marking it not GREEN: never a controlled path, and only when the index-scope check permits.
3. Any remaining dirty state is recorded, not hidden.

**The new conditional STOP** (the only new code) is `IMPLEMENTATION_BLOCKED`, raised for exactly one of four reasons — `BUDGET_EXHAUSTED`, `MATERIAL_DEVIATION`, `CONTROLLED_PATH_CHANGED`, `BASELINE_FAILURE` — together with per-repository status, and, for a changed controlled path, an instruction to restore it first, to the recorded active anchor. The exact STOP text and the decision options are normative in `developer.agent.md` and `FLOW.md`; this skill states only the classification above and the reasons.

**Directed round.**
- Each directed round (`D<n>`) is one explicit human decision with a fresh allowance. It is never automatic and has no hidden reset.
- Its guidance is recorded verbatim `[DEV]` in the Decision log. Guidance that changes approved behavior, a decision, or scope is recorded as a planning send-back instead.
- A decision taken at a STOP routed from verification replaces that verification's fix round and counts against the unchanged fix budget (`VERIFIER_FAIL_LIMIT` on the third FAIL).

**Human restoration, for `CONTROLLED_PATH_CHANGED`:**
1. The STOP names the exact paths, whether each change is committed or in the working tree, and the active anchor SHA.
2. The human restores them outside the pipeline. Discarding an uncommitted edit may legitimately need no new commit.
3. `pipeline` records in the Decision log the paths, the anchor, what was done, and the resulting commit SHA as the human reports it, or "none — uncommitted edit discarded".
4. Only then is a round started. Before any runner execution, Developer records the observed HEAD and runs the full controlled-path check (both halves). The check must pass; otherwise it is `CONTROLLED_PATH_CHANGED` again.

Developer never edits a controlled path. T9 is unchanged.

## IQ5 — Changed-path classes and hunk scope

| Class | Rule |
|---|---|
| `PLANNED` | The path is an Affected files entry (textual, Phase 2 semantics) |
| `PLAN-TRACED` | Not listed; declared in IMPLEMENTATION.md with a trace to a specific approved behavior element (an Approach sentence, an `I` row, a `C` row, or an AC/P clause) **and** a statement of why the change is necessary to deliver it. This covers consequential edits (callers of a changed signature, wiring, the adapter an `I` row routes through). A repository evidence row alone never authorizes work. Undeclared → `UNRELATED` |
| `ENVELOPE` | An ordinary envelope file with per-hunk justification (IQ8), or a T13 prerequisite citing RUN.md (unchanged) |
| `PROTECTED-TEST` | Tester's paths; changed since the anchor only through an activated amendment. A human restoration leaves no net change |
| `UNRELATED` | Anything else → FAIL (SCOPE) |

- **Planned but not changed:** an Affected files entry left untouched is declared under Deviations with its reason; otherwise it is a NOTE. It blocks only if the element it served is undelivered (IQ11).
- **Hunk scope:** every hunk in a PLANNED or PLAN-TRACED path must connect to a plan element, a declared enabling refactoring, or a consequential edit. An unrelated hunk (formatting-only rewrite, rename in untouched code, unrelated configuration key) → FAIL (SCOPE); the remedy is to remove it or declare the connection.

## IQ6 — Deviation classes

- **Implementation detail.** Internal structure within PLANNED or PLAN-TRACED paths that contradicts no Approach sentence. No declaration needed.
- **`MINOR` deviation.** It departs from an Approach sentence or from Affected files, while every AC/P outcome, `Q` answer, `C` constraint, `I`-row field, failure behavior, compatibility claim, and Out of scope item is preserved, and it adds no new public surface, persisted shape, configuration key or policy, or repository. Developer proceeds and declares it.
- **`MATERIAL` deviation.** Anything that changes or contradicts one of those elements, or that would change the change class. Developer never proceeds: it raises `IMPLEMENTATION_BLOCKED (MATERIAL_DEVIATION)`. The human never approves a material deviation outside planning, because that would bypass stage 4.

The Verifier reconciles what was declared with what it detects: an undeclared `MINOR` deviation → NOTE; any `MATERIAL` deviation, declared or not → FAIL (DEVIATION); a declared `MINOR` deviation that the Verifier reclassifies as `MATERIAL` → FAIL.

Branch history is never rewritten; code from an abandoned approach is removed by forward edits.

## IQ7 — Refactoring

An **enabling refactoring** is allowed only when all of the following hold:
- it is **necessary for the planned change** (adjacency alone never suffices);
- it is confined to PLANNED or PLAN-TRACED paths;
- its outcomes are unchanged, evidenced by the PRESERVATION identities, the relied-on identities, and the handoff full suite;
- it is declared whenever it goes beyond the lines the planned change needs.

**Opportunistic cleanup is forbidden:** renames, reformatting, dead-code removal, dependency upgrades, or style changes the change does not need, and any public-signature change not in the plan (that is `MATERIAL`).

**Refactor under RED (optional, MEDIUM/LARGE).** The refactoring is committed first, with the contract command showing the recorded RED pattern unchanged: every WITNESS still failing at its recorded locus, every PRESERVATION and relied-on identity still passing. This is **bounded regression evidence, not proof that all behavior is preserved**, and it is never GREEN evidence.

## IQ8 — Envelope changes

Only ordinary envelope files may change, and every hunk is described by its justification. A proof-relevant file follows T9/T12, unchanged. An envelope hunk the justification does not describe → FAIL (ENVELOPE).

## IQ9 — Cross-repository implementation

- **Order.** Developer follows an `I` row's implementation order when the row mandates one. When the row permits either order, Developer records its choice and the rationale. Implementation order is distinct from rollout prerequisites, which are `ROLLOUT` obligations (IQ11).
- **No partial handoff.** Every affected repository must be GREEN before handoff. IMPLEMENTATION.md carries a status per repository. A blocked repository stops the run through `IMPLEMENTATION_BLOCKED`, naming every repository's status; GREEN repositories keep their commits, and nothing is pushed.
- **Publication (unchanged).** All repositories are verified and preflighted before any push; the existing publisher then pushes them one at a time, and a later push can fail after an earlier one succeeded. No transaction mechanism is added.
- **Interface obligations.** For each `I` row, the Obligations map names where the consumer encodes, where the provider decodes, and where the failure behavior lives.
- **Build-time artifact dependencies** between repositories are an environment condition (`RUNNER_UNAVAILABLE`), never a reason to repoint a dependency.

## IQ10 — IMPLEMENTATION.md evidence

The six existing headings (Changes per repository, Commits, GREEN evidence, Envelope changes, Test-change requests, Deviations from plan) are kept, and four are added (Status per repository, Obligations, Handoff notes, Fix-round response). The full template is normative in `AGENT-CONTRACTS.md`.

- The header `status` is `IN_PROGRESS` | `GREEN` | `BLOCKED`, and `GREEN` only when every repository is GREEN.
- Per-repository status is `PENDING` | `IN_PROGRESS` | `GREEN` | `BLOCKED (<class>)`.
- Content is proportional, with one line per entry, and empty sections collapse to one line.
- A fix round or a directed round revises the artifact as an authorized regeneration; the prior revision is SUPERSEDED in RUN.md.

## IQ15 — Proportionality

The Phase 2 change class is reused.

| | SMALL | MEDIUM | LARGE |
|---|---|---|---|
| Iteration log | often 2–3 lines | lines | lines per repository |
| Obligations | `none` or one line | `C`/`Q` rows | plus `I` facets on both sides |
| Refactor under RED | n/a | optional | optional |
| Verifier obligation and hunk review | one compact pass | proportionate | full, including cross-repository |
| IMPLEMENTATION.md | about 30–35 lines, reported as a measurement, not a gate | proportionate | grows with repositories and obligations, not iterations |

In every class: IQ2 (including the controlled-path check), the gaming patterns, IQ3's accounting, IQ5, the anchoring and `DEFECT` rules, and the verdict table apply unchanged.

## IQ16 — Model roles (documentation only)

Sonnet 5 remains the model for every role. `MODEL-ROLES.md` names `developer` and `verifier` as benchmark candidates:
- **Developer:** iterations and runner executions to GREEN; scope precision; agreement between declared and detected deviations; incidence of gaming patterns.
- **Verifier:** detection of seeded wrong-but-test-passing implementations and seeded `DEFECT`s; the false-FAIL rate on legitimate traced edits; consistency across rounds.

These are hypotheses to measure, not results. There is no model change.

## Verification section (read by `verifier` as its method)

This section is the Verifier's method for stage 7, read after the rule sections above. It governs *how* verification is conducted; entry conditions, checkout brackets, the mechanical checks unchanged from earlier phases, and VERIFICATION.md's fixed sections are normative in `verifier.agent.md`, `pipeline.agent.md`, and `AGENT-CONTRACTS.md`, not here.

### IQ11 — Verification method

**Reading order: obligations first, claims last.**
1. From PLAN.md, RUN.md's `CURRENT` G3 entry, and the Decision log — before reading the diff or IMPLEMENTATION.md — derive: the expected change set; the obligation list (`C` rows, `Q` answers, `I` facets, Out of scope, and `NOT_VERIFIED` clauses); the recorded human commits (T13 prerequisites, restorations).
2. Run the unchanged mechanical checks.
3. Build the five-class inventory (IQ5) and do the hunk review of the full `<base>..HEAD` patch.
4. Only then read IMPLEMENTATION.md, and reconcile its classifications, deviations, and Obligations map against what was found.

**Obligation values:**
- `HONORED` — with `path:line` evidence.
- `VIOLATED` → FAIL (DEVIATION).
- `NOT_LOCATABLE` → FAIL (EVIDENCE); never PASS by default.
- `ROLLOUT` — not code-verifiable by design; disclosed.

A `NOT_VERIFIED` clause with no implementation located → FAIL. With an implementation located, the verdict stays `INCOMPLETE`, because inspection is never evidence of correctness.

**Cross-repository checks.** Each `I` row is checked on both sides of the diff. Each repository gets its own verdict line, and the overall verdict is the worst of them (FAIL > INCOMPLETE > PASS). Every repository is verified inside one round's bracket.

**Full suite (D3(c)).** Any failing identity blocks. When IMPLEMENTATION.md carries a baseline showing the same identity failing, the Verifier cites it for diagnosis and records "failing; cause not established"; it never asserts cause without evidence, and it never renders PASS.

Test adequacy (stage 5b's job) and plan quality (stage 4's job) are still never reviewed here.

### IQ12 — Findings, anchoring, verdict

**Finding shape.** `id · category · severity (BLOCKING | NOTE) · repository · anchor (check, or plan element id, or the established invariant for DEFECT) · evidence ([TOOL] excerpt or path:line hunk) · required outcome (what must be true — never code) · fix scope (paths)`.

**Categories and routing:**

| Category | Blocks | Route after FAIL |
|---|---|---|
| `IMPLEMENTATION`, `REGRESSION` | yes | Fix round |
| `SCOPE` (UNRELATED path, unrelated hunk, untraced new public surface) | yes | Fix round |
| `DEVIATION` (obligation `VIOLATED`, `MATERIAL` deviation) | yes | Fix round to honor the plan; if honoring it is infeasible, Developer raises `MATERIAL_DEVIATION` |
| `ENVELOPE`, `EVIDENCE` | yes | Fix round |
| `GAMING` (production-side contract gaming) | yes | Scoped production fix round; full re-verification; disclosed in the round history |
| `CONTROLLED_PATH` (a controlled-path change, committed or in the working tree) | yes | `pipeline` voices `IMPLEMENTATION_BLOCKED (CONTROLLED_PATH_CHANGED)` → human restoration; no automatic fix round |
| `DEFECT` | yes | Fix round when restoring the established invariant suffices; `DEFECT — decision required` → `IMPLEMENTATION_BLOCKED (MATERIAL_DEVIATION)` → planning |
| `NOTE` | never | Disclosed |

**Anchoring rule.** A semantic finding blocks when it cites an approved element with hunk evidence: an AC/P clause (for gaming or a contradiction of its general statement), a `Q` answer, a `C` row, an `I` facet, an Out of scope item, Affected files scope with the trace rules, or `NOT_VERIFIED` presence.

**The `DEFECT` route.** A finding outside those elements blocks only when all three hold:
1. The defect is **introduced by a specific hunk**.
2. A concrete **mechanism or counterexample** is stated (input or state → wrong outcome).
3. The **violated established behavior or invariant** is named with its source — existing tested or documented behavior on a touched path, an existing code contract, a data-integrity invariant, or a security baseline such as credential or token exposure, authorization bypass, or injection.

This is not a mandate for a comprehensive audit. If resolving the defect requires a new product decision rather than restoring an established invariant, it goes to planning; the Verifier never invents that decision.

**Always NOTE:** style, naming, readability; speculative performance; alternative designs; unnecessary complexity that creates no new public surface.

**Verdict.**
- **FAIL** if any finding is BLOCKING.
- Otherwise **INCOMPLETE** if the `NOT_VERIFIED` set is non-empty or the review is a covered `CURRENT REVISE` (unchanged).
- Otherwise **PASS**, with NOTE findings and `ROLLOUT` obligations under Disclosures.

### IQ13 — Fix rounds and staleness

**Scope bound.** A fix round may touch only the union of the findings' fix scopes plus declared consequential edits. A new path outside that set → FAIL (SCOPE).

**Response record.** Every finding gets an entry: `FIXED` (what changed, which paths) or `DISPUTED` (with evidence). A dispute is adjudicated at re-verification and is never a pass by itself. A test-change need discovered in a fix round still goes through `TEST-CHANGE-REQUEST`.

**What becomes stale:** all of VERIFICATION.md (a new HEAD); IMPLEMENTATION.md's GREEN evidence; a G4 answer, if re-verification follows it (existing rule). TEST-CONTRACT.md and TEST-REVIEW.md stay current unless an amendment occurred, in which case the Phase 3 re-review/activation path runs first.

**Re-verification.** Every check, in every repository, every round. The bracket and the G4 basis are per round. **Prior findings** records each earlier id as `CLOSED` or `OPEN`. A new blocking finding on a hunk unchanged since the prior round is labelled "new on unchanged code".

### IQ14 — Could not verify ≠ failed ≠ passed

| Condition | Record | Effect |
|---|---|---|
| Runner or environment unavailable (stage 6 or 7) | `RUNNER_UNAVAILABLE` (unchanged) | No GREEN, no PASS |
| Required clause `NOT_VERIFIED` | `INCOMPLETE` (unchanged) | Never G4; recovery through stage 5 |
| Developer cannot reach GREEN | IMPLEMENTATION.md `BLOCKED` → `IMPLEMENTATION_BLOCKED` | No handoff; nothing published |
| A full-suite identity is failing (D3(c)) | Blocking; the baseline is diagnostic only; cause stated only where evidenced | Never PASS. **At stage 6** it is classified by IQ4: a `REGRESSION` is repaired within the remaining allowance and re-tested by the next handoff attempt; a `BASELINE_FAILURE` takes its STOP; with no allowance left for the next needed step, `BUDGET_EXHAUSTED`. The failed candidate is never handed off. **At stage 7:** FAIL for every failing identity |
| Code obligation not locatable | FAIL (EVIDENCE) | Never PASS by default |
| Rollout-only obligation | `ROLLOUT` disclosure | PASS allowed; shown under Disclosures, in the PR testing/rollout account, and at G4 |
| A full-suite subset needs unavailable infrastructure | `RUNNER_UNAVAILABLE` (unchanged) | No PASS; a qualified scope is deferred |
| Interrupted stage 6 | `IN_PROGRESS` → same round; a reservation without a result is `UNKNOWN` and consumed. `BLOCKED` without a decision → re-voice the STOP | No reset; commits stand |

## Mapping to IMPLEMENTATION.md / VERIFICATION.md

| Rule above | Artifact heading it populates |
|---|---|
| IQ1 | IMPLEMENTATION.md read inputs (not a heading) |
| IQ2 | IMPLEMENTATION.md **GREEN evidence**; **Status per repository** |
| IQ3 | IMPLEMENTATION.md **Status per repository**, **GREEN evidence** (Iteration log, allowance) |
| IQ4 | IMPLEMENTATION.md **Status per repository**; RUN.md Decision log |
| IQ5 | IMPLEMENTATION.md **Changes per repository**, **Deviations from plan**; VERIFICATION.md **Changed-path inventory** |
| IQ6 | IMPLEMENTATION.md **Deviations from plan**; VERIFICATION.md **Diff-versus-plan findings** |
| IQ7 | IMPLEMENTATION.md **Commits**, **Deviations from plan** |
| IQ8 | IMPLEMENTATION.md **Envelope changes**; VERIFICATION.md **Execution envelope check** |
| IQ9 | IMPLEMENTATION.md **Status per repository**, **Obligations**, **Handoff notes** |
| IQ10 | IMPLEMENTATION.md, all headings |
| IQ11 | VERIFICATION.md **Obligation check**, **Changed-path inventory**, **Diff-versus-plan findings** |
| IQ12 | VERIFICATION.md **Findings for developer**, **Verdict** |
| IQ13 | VERIFICATION.md **Findings for developer**, **Prior findings** |
| IQ14 | VERIFICATION.md **Verdict**, **Full-suite run** |
| IQ15 | governs depth of every heading above |
| IQ16 | `MODEL-ROLES.md` (not an artifact heading) |
