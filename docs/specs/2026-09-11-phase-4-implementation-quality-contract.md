# Phase 4 — Developer Implementation Quality, GREEN Iteration & Deeper Verification
## Contract (architect → Sonnet 5 handoff) — revision 2, approved

**Status: revision 2, approved by the owner on 2026-09-11.** The approved text has SHA-256 `F1C43E221E5D4FBC7E4281FA541A8E3ABBD8C8F473043B7543B6AF7116FB242C`; this file is identical to it except for this status line and the heading's approval label. **Owner decisions adopted:** D1 and D2 as written, D3 option (c), D4 as proposed (§8). **Authorized:** delegating P4-C1 to Sonnet 5. **Not authorized:** P4-C2, P4-C3, push, tag, or Phase 5.

- **Source.**
  - Revision 1 applied Astra's architecture review (`docs/reviews/2026-09-11-phase-4-architecture-review.md`: PROCEED_WITH_CHANGES, material findings M1–M5, D1–D3 ACCEPT_WITH_CHANGES, D4 ACCEPT) to the proposal `docs/specs/2026-09-11-phase-4-implementation-quality-architecture-proposal.md`.
  - Revision 2 applies Astra's review of revision 1 (`docs/reviews/2026-09-11-phase-4-contract-review.md`: TARGETED_CORRECTION_REQUIRED, corrections C1–C3 plus four precision notes; the reviewed revision 1 had SHA-256 `CFC8B3F8…7533`).
  - The proposal is kept unedited as the reviewed record (SHA-256 `84341712…4458`).
- **Base.** `main` at `9e29ca8`, the captured pre-Phase-4 starting revision. Locked references are not reopened: `phase-1-reference` → `03d4230`, `phase-2-reference` → `5a46eb7`, `phase-3-reference` → `20939cc`.
- **How D1–D4 are written.** The rules below are written for the recommended options. §8 names exactly which rules change if the owner selects an alternative.

**Roles.**
- Opus 5 is architect and implementation supervisor.
- Sonnet 5 makes every checkpoint edit and every correction edit (dispatched with `model: "sonnet"`; its `claude-sonnet-5` self-identification is recorded, and it is not independent attestation). At most two correction rounds per checkpoint.
- The architect reviews each checkpoint against §6 and commits locally on PASS.
- Astra reviews independently.
- Push and tag happen only on an explicit owner authorization instruction.

## 1. Question, boundary, and binding constraints

**Question.** How does Developer implement the approved test contract efficiently and correctly, and how does Verifier independently establish that the result conforms to the approved plan and carries no demonstrable defect — rather than merely that the tests passed?

**What this phase claims.** Independent conformance and defect evidence, bounded by the approved plan and the diff. It does not claim proof of general correctness.

**Boundary.** Phase 4 changes the following, and nothing else:
- `developer` and `verifier`.
- `pipeline` at the stage-6/7 routing: one new conditional STOP, the directed round, and the G4 Disclosures line.
- The IMPLEMENTATION.md and VERIFICATION.md templates.
- One new policy skill.

Planner, Adversary (both modes), Tester, `workspace`, `pr`, and `intake` are untouched. Under the recommended D2 and D3, the Phase 3 test-contract semantics (T1–T16, including T9's sole-writer rule and T10's meaning of `PASS`) are untouched.

**Constraints.**
- Copilot-native Markdown assets only: no runtime, scheduler, database, queue, state machine, CLI, or schema platform.
- Nine roles; twelve artifacts.
- Four gates: G1–G3 unchanged; G4's question unchanged, gaining one displayed Disclosures line.
- Every `tools:` list byte-identical to `20939cc` (also identical at `9e29ca8`).
- Every existing STOP code and message unchanged; exactly one new STOP code.
- `.vscode/settings.json` unchanged. Every new Developer command form already matches an allow rule there (`:29–33`), and the runner still prompts in Manual mode.
- Sonnet-5 for every role.

## 2. Review disposition

**Revision 1 — architecture review.**

| Finding | Disposition | Where resolved |
|---|---|---|
| M1 — the budget does not bound execution or survive resume | Accepted. The allowance is bound to the **logical round** `pipeline` starts. Diagnostic runs and handoff attempts are counted alongside contract iterations. Every runner execution is logged in IMPLEMENTATION.md (status `IN_PROGRESS`). An interrupted round resumes with its remaining allowance. A pending `IMPLEMENTATION_BLOCKED` is re-voiced, never renewed. Only a round `pipeline` starts on an authorized basis gets a fresh allowance. | IQ3, §4 FLOW/pipeline |
| M2 — the full-suite cap prevents a legitimate handoff repair | Accepted. **Two handoff attempts per round**, with repair between them. The full suite stays out of the inner loop. The final handoff execution is bracketed by HEAD and status before and after, as the Verifier's is. | IQ2, IQ3, IQ4, IQ14 |
| M3 — D3's identity/locus match is insufficient for a PASS exception | Accepted. **D3 recommendation changed to (c):** any full-suite failure blocks; the pre-edit baseline is diagnostic only; `PASS` keeps its meaning; no qualified PASS in Phase 4 (deferred, like Phase 3's D6). The strengthened qualified-PASS alternative (a′) is specified in §8 with the forward interface it would change, for explicit owner adoption only. | IQ4, IQ11, IQ14, §8 |
| M4 — integrity routing and restoration authority are inconsistent | Accepted. Controlled-path corruption (`CONTROLLED_PATH`) is separated from production-side contract gaming (`GAMING`). Gaming is an ordinary scoped fix round with full re-verification. Corruption is repaired only by **human restoration** against a recorded anchor/path basis; there is no agent restoration mode, and T9 stays intact. A blocked state is reported before, and independent of, any cleanup or commit. | IQ2, IQ4, IQ12, §8 D2 |
| M5 — "everything else is NOTE" can force approval of a concrete defect | Accepted. A narrow `DEFECT` route blocks a demonstrable diff-introduced functional, data-integrity, or security defect when three conditions hold (mechanism or counterexample, violated established behavior or invariant, hunk evidence). A defect whose resolution needs a new product decision goes to planning. Style, speculative performance, and alternative designs remain NOTE. | IQ12 |
| Accuracy notes (non-material) | Accepted: the current-state claims are qualified (below); `I1` allows either order (provider-first is a recorded choice); "atomically" is corrected to "all repositories verified and preflighted before publication" (sequential push; a later push can fail after an earlier one succeeds — the accepted Phase 1 limitation, unchanged); refactor-under-RED is bounded regression evidence, not proof; adjacency alone never justifies a refactoring; the runner cost is disclosed; P4-C1's unchanged-file guard uses `9e29ca8`; the lack of a terminal is not an absolute disqualifier for a second reviewer, whose marginal value is simply undemonstrated; D2/D3 are named as the compatibility decisions; the examples gain short document traces for the four scenarios Astra named. | §1, IQ3, IQ7, IQ9, §6, §7 |

**Revision 2 — contract review.**

| Finding | Disposition | Where resolved |
|---|---|---|
| C1 — IQ14 routed every stage-6 full-suite failure to the baseline STOP, bypassing IQ4's repair route | Accepted. IQ14 now defers to IQ4's classification. A repairable `REGRESSION` uses the remaining allowance and the next handoff attempt. A qualifying `BASELINE_FAILURE` takes its STOP. A round with no allowance left for its next needed step takes `BUDGET_EXHAUSTED`. "Cannot hand off this candidate" (a failed attempt) is kept distinct from "cannot continue this round" (the STOP). Stage 7 still FAILs every failing identity. A matching baseline symptom proves neither the cause nor that a repair is out of scope. | IQ4, IQ14, §7 |
| C2 — counter exhaustion and handoff accounting had no success rule | Accepted. The units are defined; a handoff attempt is one id shared by its component executions. Limits are checked **before** a step starts, and a step that succeeds on the last allowance stands. A spent contract or diagnostic allowance never blocks an available handoff attempt. `BUDGET_EXHAUSTED` is raised only when the round needs a step with no allowance left; the no-progress rule is kept separately. Failed and interrupted attempts have a stated treatment. | IQ3, §4, §7 |
| C3 — the restoration self-check covered only committed content | Accepted. The **controlled-path check** now has a committed half (`<anchor>..HEAD`) and a working-tree half (no staged, unstaged, deleted, or renamed status entry on any T9 controlled path). It runs at round start before any runner execution (and so after every restoration), before every handoff attempt, and whenever a status read shows a controlled path. A working-tree difference takes the `CONTROLLED_PATH_CHANGED` route. The restoration record accepts "no new commit" for a discarded uncommitted edit, and the observed resulting HEAD is recorded. | IQ2, IQ4, §7 |
| Precision notes | Accepted. The runner cost is stated as a formula: `16 + 2R` executions per repository per round, plus the optional baseline. Each execution is reserved in the log before launch, so an interrupted execution counts as consumed with result `UNKNOWN`; this replaces revision 1's "at most one lost execution". The frozen example files are listed by name, and RUN.md and README.md are explicitly exempt. Per-repository status gains `PENDING` and `IN_PROGRESS`. | IQ3, §4, §5, §6 |

**Current-state qualification.** The existing Verifier already reads the full patch and derives diff-versus-plan findings against Approach and Affected files (`verifier.agent.md:74`). What is missing is explicit obligations and explicit disqualifying criteria, not patch reading.

A `C` row can be covered by a test — the LARGE plan's C2 (existing `audit_log` table) overlaps AC4 — but a `C` id guarantees no executable coverage. The LARGE plan's C1 (backoff configuration in `application.yml`) has none: the proof-relevant `application-test.yml` fixes `base-delay: 1s` (`PAYMENTS-12345-testing/TEST-CONTRACT.md:90`) and no test varies it.

The Verifier's clean-checkout/SHA bracket already protects verification. A stricter Developer GREEN mainly improves handoff integrity and efficiency.

## 3. Design rules

Each rule is normative; its single normative home after P4-C1 is the new `.github/skills/implementation-quality/SKILL.md` (IQ15 aside, which also shapes the templates). Agent bodies own procedure, STOPs, and ownership; FLOW.md owns routing and budgets.

### IQ1 — Inputs and the use of PLAN.md and TEST-CONTRACT.md

**Developer reads:**
- the skill;
- PLAN.md, TEST-CONTRACT.md (active revision), and RED-REPORT.md;
- WORKSPACE.md, for the baseline SHA only — a new input, and a single ownership-matrix cell;
- on a fix round, VERIFICATION.md's Findings for developer;
- on a directed round, the guidance `pipeline` quotes verbatim from RUN.md's Decision log, tagged `[DEV]`.

Developer never reads INTAKE.md, ADVERSARY-REVIEW.md, TEST-REVIEW.md, or RUN.md.

**How PLAN.md is consumed (never re-derived):**
- Affected files → the expected change set.
- Approach sentences and `C` rows → obligations.
- `Q` rows → approved answers. A `CURRENT APPROVE` exists only when every material choice accepted its recommendation (`pipeline.agent.md:96`).
- `I` rows → fields, failure behavior, deployment compatibility, and implementation order.
- Out of scope → exclusions.
- Change class → depth.

**How TEST-CONTRACT.md is consumed:** the active anchor, the controlled paths (T9), the contract command, relied-on identities, and Coverage gaps.

A plan found wrong or infeasible is routed (IQ4), never fixed in code. Verifier inputs are unchanged; it additionally uses RUN.md's `CURRENT` G3 entry and its Decision log.

### IQ2 — GREEN, the handoff attempt, and the controlled-path check

**GREEN.** A repository is GREEN only when a **handoff attempt** on its committed HEAD shows all of the following:
1. The exact contract command from the active TEST-CONTRACT.md revision ran unmodified: no added or removed filter, profile, `-D` property, flag, or environment variable.
2. Every contract identity (parameterized invocations counted individually) was discovered, executed, and not skipped; WITNESS tests pass and PRESERVATION tests pass.
3. Every relied-on identity was observed executed and passing (scoped command when the aggregate output does not name it).
4. The full suite passed with no failing identity (D3(c)).
5. The **controlled-path check** passes (defined below).
6. The envelope self-check (`diff --name-status <anchor>..HEAD -- <envelope files and relied-on tests>`) matches the declared Envelope changes.
7. The changed-path self-inventory (`diff --name-status <base>..HEAD`) contains no `UNRELATED` path.

**The handoff attempt is bracketed.** Immediately before its first execution and immediately after its last, Developer records `git -C <dir> status --porcelain=v2 --branch` (clean) and `git -C <dir> log -1 --format=%H` (the same SHA). A bracket that disagrees makes the attempt a failed attempt (IQ3). A passing working tree is never GREEN.

**The controlled-path check (C3)** covers the complete T9 set — Protected paths, proof-relevant envelope files, and relied-on existing tests. It has two halves, and both must pass:
- **Committed.** `git -C <dir> diff --stat <anchor>..HEAD -- <protected paths>` is empty, and `git -C <dir> diff --name-status <anchor>..HEAD -- <proof-relevant envelope files and relied-on tests>` lists nothing — except changes an activated amendment covers.
- **Working tree.** `git -C <dir> status --porcelain=v2 --branch` shows no entry for any controlled path: not staged, unstaged, deleted, or renamed.

**When it runs.** Developer runs the check:
- at the start of every round, before that round's first runner execution — so it also runs after every human restoration;
- before every handoff attempt;
- whenever any status read, including the index-scope check, shows a controlled path.

**What a failure means.** A failure of either half is `CONTROLLED_PATH_CHANGED` (IQ4), never a budget outcome or merely an invalid handoff. The existing status and diff forms suffice, and Developer still restores nothing.

**Contract-gaming patterns (never used; read for by the Verifier):**
1. **Command, discovery, or configuration games:** narrowing the command, skip or failure-ignore properties, rerun-failing-tests counts, or include/exclude/tag/profile changes through an ordinary envelope file.
2. **Test-aware production code:** branching on test profile, environment, classpath, or class presence.
3. **Fixture overfitting:** special-casing literals that appear in contract tests or fixtures.
4. **Flake laundering:** accepting a pass after an identity has flipped between identical runs. A flip is diagnosed (IQ4), never rerun until green.

### IQ3 — Logical round, allowance, and accounting (M1, M2, C2)

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
- A **handoff attempt** (`H<n>`) is the bracketed IQ2 execution set: one contract run, one full suite, and any required scoped relied-on runs. **One attempt id is shared by all of its component executions** (logged `H<n>.1`, `H<n>.2`, …); the handoff counter counts attempts, never component rows.
- The **suite baseline** is at most one full-suite run per run, in round 1 before the first edit, at the active anchor, with a clean checkout and a passing controlled-path check. It is optional and used for diagnosis only (IQ4, D3(c)).
- The full suite runs only as the baseline or inside handoff attempts, never in the inner loop. Git reads are never counted.

**Accounting and success (C2).**
- **A limit is checked before a step starts.** A contract iteration may start only while fewer than six have been reserved in this round; a diagnostic run only while fewer than six have been reserved; a handoff attempt only while fewer than two have been reserved.
- **Reaching a limit never overwrites an outcome.** A contract iteration that passes on the sixth allowance stands, and a handoff attempt may follow. A handoff attempt that succeeds on the second allowance completes the round `GREEN`.
- **Allowances are independent.** A spent contract or diagnostic allowance never prevents a handoff attempt that is still available: once the contract passes on the committed candidate, the attempt may start. After a failed attempt, the repair may be tested by further contract iterations if any remain, or directly by the next handoff attempt, whose own contract run tests it.
- **A spent diagnostic allowance blocks nothing by itself;** it only means no further diagnostic runs.
- **`BUDGET_EXHAUSTED` is raised when the round needs a step for which no allowance remains.** That means another contract iteration while the contract still fails and none is left, or another handoff attempt after the last one failed. It is also raised, as a separate rule, when two consecutive contract iterations make no progress while the contract still fails.
- **A failed attempt** — any IQ2 condition unmet, or a bracket that disagrees — consumes its allowance. The candidate it examined is not handed off; the round continues if its next needed step still has allowance (IQ4, C1).

**Log, persistence, resume.**
- At round start Developer writes IMPLEMENTATION.md with `status: IN_PROGRESS` and the round id.
- **Before** launching any runner execution, Developer appends that execution's Iteration log line with `result: pending`, which reserves it.
- After the execution, it records the result on the same line: `<id> · <repo> · <edit or purpose, one line> · failing: <ids | none> (Δ) · class`, with ids `BASELINE`, `C<n>`, `D<n>`, `H<n>.<k>`.
- The counters are derived from the log's reservations.
- An interrupted round (IMPLEMENTATION.md `IN_PROGRESS`) resumes at stage 6 in the **same** round, with the allowance its log leaves. A reservation without a result is recorded `UNKNOWN` and counts as consumed; an interrupted handoff attempt is a failed attempt.
- Generic resume never renews an allowance.
- An IMPLEMENTATION.md `BLOCKED` without a `CURRENT` Decision-log answer is re-voiced as `IMPLEMENTATION_BLOCKED`; `developer` is not invoked.

**Disclosed cost.** Per repository per round, the limits allow at most `16 + 2R` runner executions, plus one optional baseline per run:
- 6 contract iterations;
- 6 diagnostic runs;
- 2 handoff attempts of `2 + R` executions each.

`R` is the number of scoped relied-on runs a handoff needs: zero when the contract or full-suite output already names every relied-on identity. It comes from TEST-CONTRACT.md, so a repository with many aggregate-only relied-on identities can exceed twenty executions. Each execution prompts in Manual mode. A typical run uses far fewer; the limits bound the worst case, not the average.

### IQ4 — Failure classification and routing

| Class | Meaning | Route |
|---|---|---|
| `IMPLEMENTATION_GAP` | A WITNESS fails at its own assertion | Keep iterating |
| `REGRESSION` | A PRESERVATION, relied-on, or full-suite identity fails, and the failure does not qualify as `BASELINE_FAILURE` | Repair production code (never the expectation) within the remaining allowance; the next handoff attempt follows (IQ3) |
| `BUILD_BREAK` | Compile/build failure caused by the change | Repair (never `RUNNER_UNAVAILABLE`) |
| `CONTRACT_SUSPECT` / `CONTRACT_CONFLICT` | A test observes wrongly or overconstrains / two clauses cannot both pass | `TEST-CHANGE-REQUEST` (T12, unchanged) |
| `ENVIRONMENT` | A6 conditions | `RUNNER_UNAVAILABLE` (unchanged) |
| `NONDETERMINISTIC` | An identity flips between identical runs | Diagnose: production race → implementation defect; test instability → `CONTRACT_SUSPECT`; environment → `RUNNER_UNAVAILABLE` |
| `BASELINE_FAILURE` | A handoff full-suite identity that failed identically in the recorded pre-edit baseline (same identity, assertion, and result), **and** Developer's inspection finds no changed path on its observation path. When the diff touches that path, or Developer cannot tell, the failure is `REGRESSION` | `IMPLEMENTATION_BLOCKED (BASELINE_FAILURE)`, with baseline and candidate evidence and **no claim about cause** |
| `MATERIAL_DEVIATION` | Delivering the contract needs an approach that contradicts an approved element (IQ6) | `IMPLEMENTATION_BLOCKED (MATERIAL_DEVIATION)` |
| `CONTROLLED_PATH_CHANGED` | The controlled-path check fails in either half, committed or working tree (IQ2) | `IMPLEMENTATION_BLOCKED (CONTROLLED_PATH_CHANGED)`; never self-repaired |

**Candidate versus round (C1).**
- A failed handoff attempt means only that *this candidate* cannot be handed off. The round continues while its next needed step has allowance; only the STOP reasons end a round.
- A matching baseline symptom proves neither the cause of the failure nor that a repair would be out of scope. The `BASELINE_FAILURE` STOP presents the evidence, and the human may direct a round if they judge the failure attributable to the change.
- Without a recorded baseline, no failure is `BASELINE_FAILURE`.

**BLOCKED procedure.**
1. Report first: record `status: BLOCKED`, the reason, per-repository status, and the `[TOOL]` status output. The report never waits for cleanup.
2. Then, only if it is safe, commit production work-in-progress under a message marking it not GREEN: never a controlled path, and only when the index-scope check permits.
3. Any remaining dirty state is recorded, not hidden.

**New conditional STOP** (the only new code):

```text
STOP [IMPLEMENTATION_BLOCKED]: Develop GREEN cannot continue within the approved plan and test contract (<BUDGET_EXHAUSTED | MATERIAL_DEVIATION | CONTROLLED_PATH_CHANGED | BASELINE_FAILURE>: <one line>; <repo>: <GREEN | BLOCKED>[, …]).
Decision needed from: developer.
Direct one bounded implementation round, send the plan back for a new planning cycle, or abort — for a changed controlled path, first restore it yourself to the recorded active anchor.
```

**Directed round.**
- Each directed round (`D<n>`) is one explicit human decision with a fresh allowance. It is never automatic and has no hidden reset.
- Its guidance is recorded verbatim `[DEV]` in the Decision log. Guidance that changes approved behavior, a decision, or scope is recorded as a planning send-back instead.
- A decision taken at a STOP routed from verification replaces that verification's fix round and counts against the unchanged fix budget (`VERIFIER_FAIL_LIMIT` on the third FAIL).

**Human restoration (D2).** For `CONTROLLED_PATH_CHANGED`:
1. The STOP names the exact paths, whether each change is committed or in the working tree, and the active anchor SHA.
2. The human restores them outside the pipeline. Discarding an uncommitted edit may legitimately need no new commit.
3. `pipeline` records in the Decision log the paths, the anchor, what was done, and the resulting commit SHA as the human reports it, or "none — uncommitted edit discarded" (the T13 precedent).
4. Only then is a round started. Before any runner execution, Developer records the observed HEAD (`git -C <dir> log -1 --format=%H`, `[TOOL]`) and runs the full controlled-path check (IQ2, both halves). The check must pass; otherwise it is `CONTROLLED_PATH_CHANGED` again.

Developer never edits a controlled path. T9 is unchanged.

### IQ5 — Changed-path classes and hunk scope

| Class | Rule |
|---|---|
| `PLANNED` | The path is an Affected files entry (textual, Phase 2 semantics) |
| `PLAN-TRACED` | Not listed; declared in IMPLEMENTATION.md with a trace to a specific approved behavior element (an Approach sentence, an `I` row, a `C` row, or an AC/P clause) **and** a statement of why the change is necessary to deliver it. This covers consequential edits (callers of a changed signature, wiring, the adapter an `I` row routes through). A repository evidence row alone never authorizes work. Undeclared → `UNRELATED`. This answers Phase 2's "verifier matching beyond operative file paths" (Phase 2 contract `:150`) |
| `ENVELOPE` | An ordinary envelope file with per-hunk justification (IQ8), or a T13 prerequisite citing RUN.md (unchanged) |
| `PROTECTED-TEST` | Tester's paths; changed since the anchor only through an activated amendment. A human restoration leaves no net change |
| `UNRELATED` | Anything else → FAIL (SCOPE) |

- **Planned but not changed:** an Affected files entry left untouched is declared under Deviations with its reason; otherwise it is a NOTE. It blocks only if the element it served is undelivered (IQ11).
- **Hunk scope:** every hunk in a PLANNED or PLAN-TRACED path must connect to a plan element, a declared enabling refactoring, or a consequential edit. An unrelated hunk (formatting-only rewrite, rename in untouched code, unrelated configuration key) → FAIL (SCOPE); the remedy is to remove it or declare the connection.

### IQ6 — Deviation classes

- **Implementation detail.** Internal structure within PLANNED or PLAN-TRACED paths that contradicts no Approach sentence. No declaration needed.
- **`MINOR` deviation.** It departs from an Approach sentence or from Affected files, while all of the following still hold:
  - every AC/P outcome, `Q` answer, `C` constraint, `I`-row field, failure behavior, and compatibility claim, and every Out of scope item is preserved;
  - it adds no new public surface, persisted shape, configuration key or configuration policy, or repository.

  Developer proceeds and declares it.
- **`MATERIAL` deviation.** Anything that changes or contradicts one of those elements, or that would change the change class. Developer never proceeds: it raises `IMPLEMENTATION_BLOCKED (MATERIAL_DEVIATION)`. The human never approves a material deviation outside planning, because that would bypass stage 4.

The Verifier reconciles what was declared with what it detects:
- an undeclared `MINOR` deviation → NOTE;
- any `MATERIAL` deviation, declared or not → FAIL (DEVIATION);
- a declared `MINOR` deviation that the Verifier reclassifies as `MATERIAL` → FAIL.

Branch history is never rewritten; code from an abandoned approach is removed by forward edits.

### IQ7 — Refactoring

An **enabling refactoring** is allowed only when all of the following hold:
- it is **necessary for the planned change** (adjacency alone never suffices);
- it is confined to PLANNED or PLAN-TRACED paths;
- its outcomes are unchanged, evidenced by the PRESERVATION identities, the relied-on identities, and the handoff full suite;
- it is declared whenever it goes beyond the lines the planned change needs.

**Opportunistic cleanup is forbidden:** renames, reformatting, dead-code removal, dependency upgrades, or style changes the change does not need, and any public-signature change not in the plan (that is `MATERIAL`).

**Refactor under RED (optional, MEDIUM/LARGE).** The refactoring is committed first, with the contract command showing the recorded RED pattern unchanged: every WITNESS still failing at its recorded locus, every PRESERVATION and relied-on identity still passing. This is **bounded regression evidence, not proof that all behavior is preserved**, and it is never GREEN evidence.

### IQ8 — Envelope changes

Only ordinary envelope files may change, and every hunk is described by its justification. A proof-relevant file follows T9/T12, unchanged. An envelope hunk the justification does not describe → FAIL (ENVELOPE).

### IQ9 — Cross-repository implementation

- **Order.** Developer follows an `I` row's implementation order when the row mandates one. When the row permits either order (the LARGE plan's `I1`, `PLAN.md:83`), Developer records its choice and the rationale. Implementation order is distinct from rollout prerequisites, which are `ROLLOUT` obligations (IQ11).
- **No partial handoff.** Every affected repository must be GREEN before handoff. IMPLEMENTATION.md carries a status per repository. A blocked repository stops the run through `IMPLEMENTATION_BLOCKED`, naming every repository's status; GREEN repositories keep their commits, and nothing is pushed.
- **Publication (unchanged).** All repositories are verified and preflighted before any push; the existing publisher then pushes them one at a time, and a later push can fail after an earlier one succeeded — the accepted Phase 1 limitation. No transaction mechanism is added.
- **Interface obligations.** For each `I` row, the Obligations map names where the consumer encodes, where the provider decodes, and where the failure behavior lives.
- **Build-time artifact dependencies** between repositories are an environment condition (`RUNNER_UNAVAILABLE`), never a reason to repoint a dependency.

### IQ10 — IMPLEMENTATION.md evidence

The six existing headings are kept (Changes per repository, Commits, GREEN evidence, Envelope changes, Test-change requests, Deviations from plan) and four are added (Status per repository, Obligations, Handoff notes, Fix-round response). The full template is in §4.

- The header `status` is `IN_PROGRESS` | `GREEN` | `BLOCKED`, and `GREEN` only when every repository is GREEN.
- Per-repository status is `PENDING` | `IN_PROGRESS` | `GREEN` | `BLOCKED (<class>)`.
- Content is proportional, with one line per entry, and empty sections collapse to one line.
- A fix round or a directed round revises the artifact as an authorized regeneration; the prior revision is SUPERSEDED in RUN.md (Phase 1 A6).

### IQ11 — Verification method

**Reading order: obligations first, claims last.**
1. From PLAN.md, RUN.md's `CURRENT` G3 entry, and the Decision log — before reading the diff or IMPLEMENTATION.md — derive:
   - the expected change set;
   - the obligation list (`C` rows, `Q` answers, `I` facets, Out of scope, and `NOT_VERIFIED` clauses);
   - the recorded human commits (T13 prerequisites, restorations).
2. Run the unchanged mechanical checks.
3. Build the five-class inventory and do the hunk review of the full `<base>..HEAD` patch.
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

**The `DEFECT` route (M5).** A finding outside those elements blocks only when all three hold:
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

**What becomes stale:**
- all of VERIFICATION.md (a new HEAD);
- IMPLEMENTATION.md's GREEN evidence;
- a G4 answer, if re-verification follows it (existing rule).

TEST-CONTRACT.md and TEST-REVIEW.md stay current unless an amendment occurred, in which case the Phase 3 re-review/activation path runs first.

**Re-verification.** Every check, in every repository, every round. The bracket and the G4 basis are per round, and SHA-keyed result reuse would need infrastructure the reference does not have. **Prior findings** records each earlier id as `CLOSED` or `OPEN`. A new blocking finding on a hunk unchanged since the prior round is labelled "new on unchanged code".

### IQ14 — Could not verify ≠ failed ≠ passed

| Condition | Record | Effect |
|---|---|---|
| Runner or environment unavailable (stage 6 or 7) | `RUNNER_UNAVAILABLE` (A6, unchanged) | No GREEN, no PASS |
| Required clause `NOT_VERIFIED` | `INCOMPLETE` (T10/T11, unchanged) | Never G4; recovery through stage 5 |
| Developer cannot reach GREEN | IMPLEMENTATION.md `BLOCKED` → `IMPLEMENTATION_BLOCKED` | No handoff; nothing published |
| A full-suite identity is failing (D3(c)) | Blocking; the baseline is diagnostic only; cause stated only where evidenced | Never PASS. **At stage 6** it is classified by IQ4: a `REGRESSION` is repaired within the remaining allowance and re-tested by the next handoff attempt; a `BASELINE_FAILURE` takes its STOP; with no allowance left for the next needed step, `BUDGET_EXHAUSTED`. The failed candidate is never handed off. **At stage 7:** FAIL for every failing identity |
| Code obligation not locatable | FAIL (EVIDENCE) | Never PASS by default |
| Rollout-only obligation | `ROLLOUT` disclosure | PASS allowed; shown under Disclosures, in the PR testing/rollout account, and at G4 |
| A full-suite subset needs unavailable infrastructure | `RUNNER_UNAVAILABLE` (unchanged) | No PASS; a qualified scope is deferred |
| Interrupted stage 6 | `IN_PROGRESS` → same round; a reservation without a result is `UNKNOWN` and consumed. `BLOCKED` without a decision → re-voice the STOP | No reset; commits stand |

### IQ15 — Proportionality

The Phase 2 change class is reused.

| | SMALL | MEDIUM | LARGE |
|---|---|---|---|
| Iteration log | often 2–3 lines | lines | lines per repository |
| Obligations | `none` or one line | `C`/`Q` rows | plus `I` facets on both sides |
| Refactor under RED | n/a | optional | optional |
| Verifier obligation and hunk review | one compact pass | proportionate | full, including cross-repository |
| IMPLEMENTATION.md | about 30–35 lines, reported as a measurement, not a gate | proportionate | grows with repositories and obligations, not iterations |

In every class: IQ2 (including the controlled-path check), the gaming patterns, IQ3's accounting, IQ5, the anchoring and `DEFECT` rules, and the verdict table apply unchanged.

### IQ16 — Model roles (documentation only)

Sonnet 5 remains the model for every role. MODEL-ROLES.md names `developer` and `verifier` as benchmark candidates:
- **Developer:** iterations and runner executions to GREEN; scope precision; agreement between declared and detected deviations; incidence of gaming patterns.
- **Verifier:** detection of seeded wrong-but-test-passing implementations and seeded `DEFECT`s; the false-FAIL rate on legitimate traced edits; consistency across rounds.

These are hypotheses to measure, not results. There is no model change.

## 4. Artifact templates (representation)

**IMPLEMENTATION.md** (owner: developer). Header `status: IN_PROGRESS | GREEN | BLOCKED`. Fixed headings:

| Heading | Content |
|---|---|
| **Status per repository** | Round id; per repository `PENDING` (not started in this round), `IN_PROGRESS`, `GREEN`, or `BLOCKED (<class>)`; allowance reserved, as `C n/6 · D n/6 · H n/2` |
| **Changes per repository** | One line per path: path · class · reason or trace |
| **Commits** | Enabling-refactoring and work-in-progress commits marked as such |
| **GREEN evidence** | Baseline, if taken. The Iteration log, reservation-first; a handoff attempt's component executions share its attempt id. Per repository, the bracketed handoff attempt(s): contract command and identity tally, relied-on identities, full-suite tally, and the controlled-path, envelope, and inventory self-check outputs |
| **Obligations** | `C`, `Q`, `I`, and Out of scope → `path:symbol`, or `ROLLOUT`, or `none` |
| **Envelope changes** | Per hunk |
| **Deviations from plan** | `MINOR` deviations, enabling refactorings, planned-not-changed paths |
| **Test-change requests** | Unchanged |
| **Handoff notes** | Limitations; `NOT_VERIFIED` clauses with their implementation location; the chosen implementation order and its rationale; rollout notes |
| **Fix-round response** | Fix and directed rounds only |

**VERIFICATION.md** (owner: verifier). The twelve existing headings are kept. Additions:
- Under **Verdict**: per-repository verdict lines and a **Disclosures** line (NOTE findings, `ROLLOUT` obligations).
- **Obligation check** (new heading, before Changed-path inventory): the obligations derived before the diff, each with its value.
- **Changed-path inventory**: the five classes plus planned-not-changed.
- **Diff-versus-plan findings**: the hunk review and the declared-versus-detected reconciliation.
- **Full-suite run**: failing identities with the "cause not established" diagnosis where applicable.
- **Findings for developer**: in the IQ12 shape.
- **Prior findings** (new heading, re-verification only).

**RUN.md** (owner: pipeline):
- Stage-6 round ids `1`/`2`/`3`/`D<n>`.
- Decision-log entries for `IMPLEMENTATION_BLOCKED`:
  - the reason, per-repository status, and the option chosen;
  - the directed-round guidance, verbatim `[DEV]`;
  - for a restoration: the paths (each marked committed or working tree), the active anchor, what was done, and the resulting commit SHA as reported or "none — uncommitted edit discarded" (the T13 precedent).

**FLOW.md, `pipeline.agent.md`, pipeline skill** — each gets one sentence, identical in its three homes, plus the related edits:
- **Stage 6/7 rows and narratives.**
- **STOP catalogue:** +1 row.
- **G4:** displays a "Verification disclosures: `<NOTE findings; ROLLOUT obligations>` or none" line beside the PR description and the tuple; the question itself is unchanged.
- **Authorized regenerations:** gain "developer-directed implementation round".
- **Bounded loops** (FLOW.md and GUARDRAILS.md): "Developer GREEN iteration: per repository per logical stage-6 round, at most six contract iterations, six diagnostic runs, and two handoff attempts (one attempt id across its executions), and never more than two consecutive contract iterations without progress while the contract still fails; each limit is checked before a step starts, so a step that succeeds on the last allowance stands; the allowance survives interruption and is renewed only by a round `pipeline` starts on an authorized basis; needing a step with no allowance left, a required material deviation, a changed controlled path, or a qualifying baseline full-suite failure raises `IMPLEMENTATION_BLOCKED`, and each directed round is one explicit human decision, never an automatic reset."
- **Resume** (the identical sentence in its three homes): "IMPLEMENTATION.md `IN_PROGRESS` resumes stage 6 in the same round with the allowance its log leaves, a reserved execution without a result counting as consumed; IMPLEMENTATION.md `BLOCKED` without a recorded decision re-voices `IMPLEMENTATION_BLOCKED` and never invokes `developer`."

The existing stage-6/G4 barrier sentence is untouched.

## 5. Files

**Added:**
- `.github/skills/implementation-quality/SKILL.md` (`user-invocable: false`, `disable-model-invocation: true`; IQ1–IQ16; read by `developer`, and by `verifier`, which reads it in full and then its Verification section);
- `docs/examples/PAYMENTS-12345-testing/DIFF-EXCERPTS.md` (focused fictional hunks; teaching material, not a run artifact).

**Modified:**

| File | Change |
|---|---|
| `.github/agents/developer.agent.md` | IQ1–IQ10, IQ13 procedure; four read-only forms (`diff --stat <anchor>..HEAD -- <paths>`, `diff --name-status <anchor>..HEAD -- <paths>`, `diff --name-status <base>..HEAD`, `diff <base>..HEAD` optionally with `-- <paths>`); STOP recording |
| `.github/agents/verifier.agent.md` | IQ11–IQ14; forms unchanged |
| `.github/agents/pipeline.agent.md` | Stage 6/7 routing, the directed round, restoration recording, the developer invocation naming WORKSPACE.md, the G4 Disclosures line, the resume and regeneration sentences |
| `.github/pipeline/FLOW.md` | The §4 additions |
| `.github/pipeline/AGENT-CONTRACTS.md` | `developer`/`verifier`/`pipeline` sections; the developer's forms; ownership matrix (WORKSPACE.md → developer `input`); templates |
| `.github/pipeline/GUARDRAILS.md` | Bounded loops; Test immutability: the two-half controlled-path check, human-only restoration, a pointer to the gaming patterns |
| `.github/pipeline/MODEL-ROLES.md` | IQ16 |
| `.github/skills/pipeline/SKILL.md` | The resume and regeneration sentences only |
| `docs/examples/PAYMENTS-12345-testing/` | New IMPLEMENTATION.md and VERIFICATION.md; RUN.md rows and README extended (D4) |
| `docs/examples/PAYMENTS-12410/` | New IMPLEMENTATION.md and VERIFICATION.md; RUN.md rows and README extended (D4) |
| `docs/COMPARISON-GUIDE.md` | Phase 4 entries; theme "Evidence-bound GREEN and anchored verification"; the N1 stale summaries corrected in the same edit |
| `README.md` | Asset tree and status |

**Not modified:**
- `tester`, `adversary`, `planner`, `intake`, `workspace`, and `pr` agents;
- the `test-contract`, `plan-grounding`, `challenge-plan`, `gather-jira-context`, and `discover-affected-projects` skills;
- `.github/copilot-instructions.md`; `.vscode/*`;
- every historical contract and proposal, including the Phase 4 proposal; `docs/specs/archive/`; `docs/reviews/`;
- `docs/examples/PAYMENTS-12345/` and `PAYMENTS-12345-planning/`;
- the frozen files inside the two extended directories, byte-identical to `9e29ca8`:
  - in `PAYMENTS-12345-testing/`: `PLAN.md`, `TEST-CONTRACT.md`, `RED-REPORT.md`, `TEST-REVIEW.md`, `SOURCE-EXCERPTS.md`;
  - in `PAYMENTS-12410/`: `INTAKE.md`, `PLAN.md`, `ADVERSARY-REVIEW.md`, `TEST-CONTRACT.md`, `RED-REPORT.md`, `TEST-REVIEW.md`, `SOURCE-EXCERPTS.md`;
  - `RUN.md` and `README.md` in both directories are explicitly exempt, because they are extended;
- all three tags.

## 6. Checkpoints and acceptance

**P4-C1 — Policy skill, agents, pipeline documents.**
- (a) Every IQ rule lives in exactly one normative place, and agent bodies reference rather than restate it. There is no contradiction across the skill, the pipeline documents, the pipeline skill, and the three agents on any of:
  - IQ2 and the two-half controlled-path check;
  - the gaming patterns;
  - IQ3's allowance, units, accounting, success, and resume rules;
  - IQ4's routing, including the candidate-versus-round distinction;
  - IQ5/IQ6 classes;
  - IQ12's anchoring, `DEFECT` rule, categories, and verdict;
  - the STOP text.
- (b) Every `tools:` list is byte-identical to `20939cc`. There is no new agent, gate, tool, MCP capability, setting, or artifact. Exactly one new STOP code; existing STOP messages are unchanged.
- (c) The four Developer forms appear only in `developer.agent.md` and AGENT-CONTRACTS.md, and each matches an existing allow rule (checked line by line against `.vscode/settings.json:29–33`).
- (d) The stage-6/G4 barrier sentence is identical and unchanged in its three homes. The new resume sentence is identical in its three homes, and the Bounded-loops sentence is identical in FLOW.md and GUARDRAILS.md. `INCOMPLETE` never reaches G4. The G4 change is limited to the Disclosures line.
- (e) The ownership matrix differs from `9e29ca8` only in the WORKSPACE.md/developer cell. The T9 sole-writer rule and T10's meaning of PASS are unchanged.
- (f) Every file in §5 "Not modified" shows an empty `git diff 9e29ca8`.

**P4-C2 — Implementation-stage examples (D4).**
- (a) **LARGE**, extended through stage 7:
  - `payments-ledger` is implemented before `payments-api` as a recorded **choice** with its rationale, not presented as mandated by `I1`.
  - Round 1: all contract tests are GREEN, and the base delay is hard-coded to 1 s. The Verifier's C1 obligation is `VIOLATED` → FAIL (DEVIATION), in the IQ12 shape, with `DIFF-EXCERPTS.md` evidence and the required outcome "the base delay is read from `webhook.retry.base-delay`".
  - One scoped fix round with its Fix-round response → round 2 PASS, with Prior findings `CLOSED`.
  - `LedgerClient`/`RestLedgerClient` are `PLAN-TRACED` to the Approach and `I1`, with necessity stated.
  - The ledger-first deployment is a `ROLLOUT` disclosure.
  - Reservation-first Iteration log lines, bracketed handoff evidence with shared attempt ids, and the allowance line per repository.
- (b) **SMALL**, extended through stage 7: a compact handoff and a one-pass PASS with zero blocking findings. The LOW-confidence `validation.properties` entry is handled honestly. IMPLEMENTATION.md's line count is reported as measured.
- (c) Everything is fictional and stated so. No example claims execution. The frozen files listed in §5 are byte-identical to `9e29ca8` (hash check); `RUN.md` and `README.md` are exempt. Both examples stop at stage 7 by design, and each README links its Phase 3 tagged view.

**P4-C3 — Guide, README, traces, closure.**
- Guide entries, the new theme, and the N1 fix; README current.
- §7 traced as document scenarios, marking which ones an example exercises.
- A closure section.

## 7. Closure evidence — challenge cases (to be traced at P4-C3)

| # | Case | Expected outcome | Rules |
|---|---|---|---|
| 1 | The contract command is narrowed, or a skip/failure-ignore property is added | Not GREEN; the Verifier runs the exact command; any envelope hunk → FAIL | IQ2, IQ8 |
| 2 | Production code special-cases a fixture literal | FAIL (GAMING); scoped fix round | IQ2, IQ12 |
| 3 | Production code detects the test profile | FAIL (GAMING); fix round; no controlled path involved, so no restoration | IQ2, IQ12 |
| 4 | A contract identity flips and then passes on a rerun | Diagnosed; never laundered | IQ2, IQ4 |
| 5 | A hard-coded value violates C1 while every test passes | FAIL (DEVIATION) → fix round → PASS (LARGE example) | IQ11, IQ12 |
| 6 | A plan-implied adapter is missing from Affected files | `PLAN-TRACED` with necessity; an evidence row alone never suffices (LARGE example) | IQ5 |
| 7 | Unrelated cleanup, or a whole-file reformat of a planned file | FAIL (SCOPE) | IQ5, IQ7 |
| 8 | Delivering the contract needs an unplanned persisted field | `IMPLEMENTATION_BLOCKED (MATERIAL_DEVIATION)` → planning | IQ6 |
| 9 | Developer loops on diagnostic runs without running the contract | The diagnostic allowance is spent after six; further progress needs contract iterations, which are counted and bounded | IQ3 |
| 10 | Interruption mid-round, then resume | Same round, remaining allowance; a reservation without a result is `UNKNOWN` and consumed; no renewal | IQ3 |
| 11 | Resume while a BLOCKED decision is pending | The STOP is re-voiced; `developer` is not invoked | IQ3 |
| 12 | Handoff attempt `H1` finds a new full-suite regression while allowance remains | Classified `REGRESSION`, not `BASELINE_FAILURE`; that candidate is not handed off; repaired within the remaining allowance; `H2` → GREEN | IQ3, IQ4, IQ14 |
| 13 | Same-locus failure in an unchanged test that runs through a changed shared dependency | The diff touches its observation path, so it is `REGRESSION`, never `BASELINE_FAILURE`; repaired within the allowance, or `BUDGET_EXHAUSTED`; stage 7 FAILs it regardless; no PASS (D3(c)) | IQ4, IQ11, IQ14 |
| 14 | A failing identity that failed identically in the recorded baseline, with no changed path on its observation path | `IMPLEMENTATION_BLOCKED (BASELINE_FAILURE)`, with no claim about cause; the human directs a round, sends the plan back, or aborts | IQ4, IQ14 |
| 15 | Developer weakens a protected test in the working tree while HEAD is unchanged | The check's working-tree half fails → `CONTROLLED_PATH_CHANGED`. Human restoration, which may need no commit. The new round records the observed HEAD and passes both halves before any runner execution | IQ2, IQ4, D2 |
| 16 | The Verifier finds a controlled-path change | `CONTROLLED_PATH` → the STOP instead of an automatic fix round | IQ12 |
| 17 | A planned change logs a request object containing a token | FAIL (DEFECT) under the security baseline | IQ12 |
| 18 | A defect needs a new product decision | `DEFECT — decision required` → planning | IQ12 |
| 19 | One repository GREEN, the other blocked | No handoff; per-repository status in the STOP | IQ9 |
| 20 | An envelope justification omits a hunk | FAIL (ENVELOPE) | IQ8 |
| 21 | A fix round adds an unrelated path | FAIL (SCOPE) | IQ13 |
| 22 | A `NOT_VERIFIED` clause is left unimplemented vs implemented | FAIL vs `INCOMPLETE` | IQ11 |
| 23 | Only an uncommitted file makes the contract pass | The handoff bracket and post-commit run catch it; the Verifier's checkout check also catches it | IQ2 |
| 24 | A rollout-only obligation | `ROLLOUT` disclosure at G4 (LARGE example) | IQ11 |
| 25 | A SMALL change | Compact artifacts; one-pass PASS (SMALL example) | IQ15 |
| 26 | The sixth contract iteration is the first to pass | It stands; handoff attempt `H1` may start | IQ3 |
| 27 | Handoff attempt `H2` succeeds completely | The round completes `GREEN`; no `BUDGET_EXHAUSTED` | IQ3 |
| 28 | A handoff attempt is interrupted after its contract run | The reserved component is `UNKNOWN`; the attempt counts as failed; resume continues the same round with the remaining allowance | IQ3 |

## 8. Owner decisions (pending the owner's answers)

**D1 — Bounded GREEN iteration and `IMPLEMENTATION_BLOCKED`.** Recommended: **ACCEPT_WITH_CHANGES as written**; revision 2 resolves the contract review's C1 and C2. This means:
- the logical-round allowance (6 contract iterations / 2 without progress / 6 diagnostic runs / 2 handoff attempts), as pilot defaults;
- reservation-first, log-derived counters; limits checked before a step starts, with success on the last allowance standing; handoff attempts counted by attempt id; same-round resume;
- a pending decision is re-voiced, never renewed;
- each directed round is one explicit human decision;
- the four STOP reasons, the candidate-versus-round distinction, and the disclosed `16 + 2R` runner cost.

**D2 — Controlled-path corruption is never an automatic fix round.** Recommended: **ACCEPT_WITH_CHANGES as written**; revision 2 resolves C3 — the check covers the working tree as well as committed content:
- **Human restoration only.** The STOP names the exact paths (committed or working tree) and the active anchor. The restoration is recorded in the Decision log (the T13 precedent), and "no new commit" is valid for a discarded uncommitted edit. A fresh round begins by recording the observed HEAD and passing both halves of the check.
- There is no agent restoration mode, so T9's sole-writer rule and the Developer's no-controlled-edit rule stay intact.
- Production-side gaming is separate: an ordinary scoped fix round.

*Alternative:* an agent restoration mode is not proposed. It would need its own reader and writer authority, a content-retrieval form (for example `git show <anchor>:<path>`, which is not currently allowed), and an explicit T9 amendment. It is deferred.

**D3 — Pre-existing full-suite failures.** Recommended: **(c), conservative** (the contract review recommends ACCEPT of (c)):
- Any failing full-suite identity blocks the candidate.
- At stage 6 it is classified by IQ4: a `REGRESSION` is repaired within the allowance; a qualifying `BASELINE_FAILURE` STOPs. The optional pre-edit baseline is diagnostic evidence only.
- `PASS` keeps its meaning ("the full suite passed"). T10 and the Verifier's verdict are unchanged.
- The human's options at `BASELINE_FAILURE`: direct a round if they judge the failure attributable to the change, send the repair into planned scope, or abort and repair outside this run.
- A qualified PASS is **deferred**, like Phase 3's D6.
- Cost: a repository whose suite is already broken cannot complete a run until the breakage is repaired.

*Alternative (a′), only by explicit owner adoption of a narrower meaning of PASS.* Eligibility would require all of the following:
- comparable baseline and candidate commands and execution conditions;
- matching identity, assertion, and result evidence;
- an independent Verifier assessment that no changed production, support, or dependency path lies on the failing test's observation path, where "uncertain" is ineligible;
- exclusion of contract, relied-on, required-clause, environment, and nondeterministic failures.

An eligible result would be recorded as a "still-failing, observed baseline condition". The report would never say the full suite passed, and the exact identities would be carried into VERIFICATION.md, the PR's testing account, and G4.

Adopting (a′) changes the Verifier's verdict rule, the G4 Disclosures line, and the downstream meaning of PASS stated in T10 (`test-contract` `SKILL.md:122`) through a named forward interface. It adds a Verifier dependency-path assessment, and it contradicts §1's "Phase 3 semantics untouched" statement, which would then be removed. Option (b) — the same classification plus an extra approval — does not repair weak evidence and is not offered.

**D4 — Examples.** Recommended: **ACCEPT**:
- Extend `PAYMENTS-12345-testing/` and `PAYMENTS-12410/` in place through stage 7.
- The frozen files (§5) stay byte-identical; RUN.md and README.md are extended, and each README links the Phase 3 tagged view.
- `DIFF-EXCERPTS.md` is teaching material.
- The implementation order is shown as a choice.

**Confirmed owner defaults, recorded unless the owner disagrees:** no new agent; no new routine gate; strengthen the Verifier first. A second reviewer's marginal value is undemonstrated, and the existing Verifier is the appropriate role — the lack of a terminal is not an absolute disqualifier. Sonnet 5 stays on every role.

## 9. Deferred

- A qualified PASS with observed baseline failures (if D3(c) is chosen).
- A qualified full-suite scope under partial infrastructure.
- An agent restoration mode.
- Selective (SHA-keyed) re-verification.
- Model benchmarks and model diversity for the Verifier.
- Measurement of the allowance defaults.
- Corporate validation items, unchanged from Phase 3 §9/§11: MCP tool names, the model-picker string, the agent-picker smoke check, approval-engine behavior.
- Phase 2 proposal line 261's "the verifier does not verify planning evidence claims" remains declined: re-verifying PLAN.md's evidence rows is stage 4's job.
- Phase 5: delivery, rollout execution, Jira/Bitbucket integration, a qualified publication path.
