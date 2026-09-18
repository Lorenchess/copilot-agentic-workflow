# Phase 4 — Developer Implementation Quality, GREEN Iteration & Deeper Verification
## Architecture Proposal (architect role, Opus 5, for owner review)

Status: **draft for owner and ChatGPT review, 2026-09-11 — not approved; nothing implemented; no Sonnet dispatch yet.** Base: `main` at `9e29ca8` (the Phase 3 administrative closure on top of `20939cc`). Locked references, untouched and not reopened: `phase-1-reference` → `03d4230`, `phase-2-reference` → `5a46eb7`, `phase-3-reference` → `20939cc`. Everything here is forward evolution of current `main`. On approval this proposal stays unedited as the reviewed record and an approved contract is written beside it (the Phase 2/3 precedent). No Phase 5 work.

Roles: Opus 5 is architect and implementation supervisor. Sonnet 5 makes every checkpoint edit and every correction edit (Agent tool, `model: "sonnet"`; its `claude-sonnet-5` self-identification is recorded but is not independent attestation). At most two correction rounds per checkpoint. The architect reviews each checkpoint independently and commits locally on PASS. ChatGPT reviews independently. Push and tag happen only on an explicit owner authorization instruction.

**Phase 4 question.** How does Developer implement the approved test contract efficiently and correctly, and how does Verifier independently prove that the implementation is genuinely correct, not merely that the tests passed?

---

## 1. Current-state assessment

### 1.1 Locked Phase 4 input contracts (recovered; consumed unchanged)

**From Phase 2 (PLAN.md, `plan-grounding`).**
- **Affected files** is an operative table of file paths only, each with change type, reason ids (AC/P/I/Q/C), confidence, and evidence id; Investigation notes are non-operative prose (`plan-grounding` R4, `SKILL.md:66`).
- **Approach per repository** carries implementation constraints `C1…`. A developer constraint is "covered by" a `C` id, not forced into a Given/When/Then (R1, `SKILL.md:26`), so no test ever carries it.
- **Dependencies and interfaces** rows `I1…` separate contract fields, failure behavior, deployment compatibility, and implementation order (R4, `SKILL.md:68`).
- **Decisions and open questions** `Q1…`. A `CURRENT APPROVE` at G3 is valid only when every material choice accepted its displayed recommendation (`pipeline.agent.md:96`); any replacement answer is a new planning cycle. PLAN.md's recommendations are therefore the approved answers.
- **Out of scope**; change class `SMALL|MEDIUM|LARGE` (depth, never authorization).
- Phase 2 explicitly handed "verifier matching beyond operative file paths" to Phase 4 (Phase 2 contract `:150`).

**From Phase 3 (TEST-CONTRACT.md, RED-REPORT.md, TEST-REVIEW.md, `test-contract`).**
- **Controlled paths** = Protected paths + proof-relevant envelope files + relied-on existing tests (T9). Developer never edits any of them; ordinary envelope changes are developer-owned with justification; a proof-relevant change without an approved amendment is a Verifier FAIL.
- **Active anchor** = the latest *activated* amendment's candidate, otherwise the RED commit. The exact contract command per repository, with discovered identities; relied-on identities with their scoped command.
- **`NOT_VERIFIED` set** (Coverage gaps plus current authorized exceptions) → Verifier `INCOMPLETE`, never G4; recovery through 5 → 5b → (6) → 7.
- A **current test review** (T11) is the stage-6 precondition. A mid-stage-6 test change goes request → Tester assessment → human → Tester delta → 5b re-review → activation → Developer resumes. The authority rule: an amendment may change how a test observes, never what the clause requires.
- The discrimination check of an amended-and-passing WITNESS, which the Phase 3 proposal once deferred to Phase 4 (`:361`), was pulled into the stage-5b re-review by the approved Phase 3 contract (T11, `:117`). Phase 4 does not duplicate it in the Verifier.
- Phase 3 §9 (`:227`): "Phase 4 owns implementation strategy, GREEN iteration, and the Verifier's broader semantic review." Phase 3 §10 clarification (4) (`:239`) records a real plan-inventory gap that Phase 4 must handle without rewriting the locked plan: PLAN.md `1.2`'s Approach and `I1` route the report through `LedgerClient`/`RestLedgerClient`, but its Affected files omit them.

**From Phase 1 (foundations kept).**
- Verifier independence: it reruns everything and never trusts IMPLEMENTATION.md's GREEN claim.
- Clean-checkout bracket and candidate SHA; contract run plus full suite, both required; test-immutability command form fixed; envelope check; changed-path inventory from the WORKSPACE.md baseline (A5).
- Fix-loop budget: one initial verification plus two fix rounds, `VERIFIER_FAIL_LIMIT` on the third FAIL. `RUNNER_UNAVAILABLE` scope (A6). Verified-SHA publication binding (A3). G1–G4.
- The blanket git prohibition: no `reset`/`clean`/`checkout`/`restore`/`stash`/`rebase`/`pull`/force (`AGENT-CONTRACTS.md:5`). Runner commands always prompt in Manual mode.

### 1.2 What Developer and Verifier already do well (keep)

**Developer.**
- It cannot touch controlled paths or the test artifacts; the change-request path is the only route to change them.
- The index-scope check runs before every `add`/`commit`.
- GREEN is declared only from an actual passing run.
- An environment failure (`RUNNER_UNAVAILABLE`) is kept distinct from an implementation failure.
- A `NOT_VERIFIED` clause is still implemented against the whole plan.

**Verifier.**
- It runs two independent executions and confirms results at test-identity level, including relied-on tests.
- The SHA bracket proves the verified state; the immutability check is anchored at the activated anchor; the envelope diff applies proof-relevance.
- It checks the test-review basis and renders a three-valued verdict.
- The changed-path inventory is derived from the diff, never from reading files.

This is the mechanical core. Phase 4 adds to it and removes nothing.

### 1.3 What must remain unchanged

- Nine agents, and every `tools:` list byte-identical to `20939cc`.
- Four gates. G1–G3 are untouched; G4's question is untouched, and it only gains one displayed line (§15).
- Every existing STOP code and message.
- Twelve artifacts; no new artifact.
- Planner, Adversary (both modes), and Tester behavior; the `plan-grounding`, `challenge-plan`, and `test-contract` skills.
- The test-immutability command form, and the stage-6/G4 barrier sentence (identical in `pipeline.agent.md`, FLOW.md, and the pipeline skill).
- `INCOMPLETE` never reaches G4. `.vscode/settings.json` is unchanged.
- No runtime, scheduler, database, queue, state machine, CLI, or schema platform.

## 2. Remaining implementation/verification weaknesses

| # | Weakness | Evidence | Failure mode |
|---|---|---|---|
| W1 | The inner GREEN loop is unbounded | `developer.agent.md:69` "keep implementing (return to step 3)"; FLOW.md Bounded loops (`:145–152`) has no developer-iteration line | Endless autonomous loop, unbounded runner prompts |
| W2 | GREEN is not bound to the committed state, the exact command, or a full-suite result | Step 4 runs "the repository's detected test/build runner" (`:67`) *before* the commit (`:71`); nothing requires discovery/skip/relied-on confirmation, a full suite, or a clean checkout at handoff, yet the Verifier FAILs a dirty checkout (`verifier.agent.md:68`); the Phase 1 example's GREEN evidence is contract classes only (`PAYMENTS-12345/IMPLEMENTATION.md:31–45`) | GREEN from uncommitted/untracked files; regressions found only by the Verifier, spending fix rounds |
| W3 | No failure taxonomy and no escalation for an infeasible approach | Only `TEST_CHANGE_REQUESTED` and `RUNNER_UNAVAILABLE` exist; "Deviations from plan — anything implemented differently… and why" (`:52`) permits any deviation after the fact, while Out of scope forbids "redesigning implementation strategy" (`:95`) | A material deviation is silently implemented and only disclosed afterwards |
| W4 | No refactoring or cleanup rule, and UNRELATED has no verdict consequence | Verdict step (`verifier.agent.md:76`) FAILs on a "disqualifying diff-versus-plan" finding without defining one; Unrelated changes (`:56`) is descriptive only | Opportunistic cleanup expands scope; review noise hides real changes |
| W5 | Plan-to-diff is path-level only | PLANNED = path in Affected files (`:74`); unrelated hunks inside planned files, hidden config keys, planned-but-untouched paths, and plan-implied but unlisted files (Phase 3 §10 (4)) are invisible or misclassified | False PASS on noise inside planned files; false UNRELATED on `LedgerClient` |
| W6 | Approved non-test obligations are never checked | Tester consumes AC/P rows only (Phase 3 T1, `:39`); `C` constraints, G3 answers, `I`-row failure/compatibility facets, and Out of scope reach nobody after G3 | A test-passing implementation that contradicts an approved decision PASSes (the LARGE plan's C1: hard-coding the 1 s base delay passes every contract test, because proof-relevant `application-test.yml` fixes `base-delay: 1s` and no test varies it, `PAYMENTS-12345-testing/TEST-CONTRACT.md:90`) |
| W7 | Contract gaming through production code is not named | The Envelope check uses `--name-status` plus the presence of a justification (`:72`); nothing covers test-aware code, special-casing fixture literals, rerunning a flaky test until it passes, or an envelope hunk the justification does not describe | GREEN manufactured without touching a protected file |
| W8 | An integrity FAIL has no reachable remedy | Developer may not edit controlled paths and no agent may `restore`/`checkout`/revert (`AGENT-CONTRACTS.md:5`) | A protected-path edit can only burn fix rounds until `VERIFIER_FAIL_LIMIT` |
| W9 | Fix-round feedback is unshaped | "Findings for developer — actionable items" (`:57`); no required outcome, no fix scope, no response record, no closure of prior findings | Fix rounds wander or leave findings open; reviewers cannot trace closure |
| W10 | Cross-repository work is unmodelled | Developer ignores `I`-row implementation order; one status for the whole run (`status: GREEN`); partial success cannot be represented | Consumer built against a provider that does not exist yet; ambiguity when one repository is blocked |
| W11 | Full-suite causation is undefined | "any failure caused by the implementation is a FAIL finding" (`:69`); no evidence path exists for a pre-existing failure, because checkout/worktree is forbidden | Failures silently excused by attribution, or runs blocked forever |
| W12 | IMPLEMENTATION.md is thin where it matters | No per-path reason, no obligation map, no limitations, no fix-round response; too thin for LARGE multi-repo work (SMALL is fine) | The Verifier and the PR reviewer re-derive intent from the diff |
| W13 | The Verifier reads claims before evidence | Step 1 reads IMPLEMENTATION.md with every other input (`:67`) | Anchoring on the Developer's narrative (the counterpart of the procedural-independence problem 5b solved) |

## 3. Phase 4 success criterion

Phase 4 succeeds when a run satisfies all of the following:

1. **Developer handoff.** Developer hands the Verifier a **committed, clean, evidence-bound GREEN state**, reached within a **bounded, recorded iteration loop**. Every changed path and hunk traces to an approved plan element or to a declared, classified deviation. A material deviation or a stall reaches a human through one conditional STOP, never a silent redesign and never an endless loop.
2. **Independent verification.** Verifier independently proves, by rerun and by an **anchored reading of the full baseline-to-HEAD diff against the approved non-test obligations**, that the implementation satisfies the contract without contradicting the approved plan.
3. **Honest inability.** Any inability is recorded as `FAIL`, `INCOMPLETE`, `RUNNER_UNAVAILABLE`, or a disclosed pre-existing condition — never as `PASS`.
4. **LARGE example.** The Verifier catches a test-passing C1 violation (round-1 `FAIL` → one bounded fix round → round-2 `PASS`). It classifies the plan-implied `LedgerClient`/`RestLedgerClient` change as a declared trace rather than a false UNRELATED, and it honors the `I1` implementation order.
5. **SMALL example.** The SMALL run stays compact: a short IMPLEMENTATION.md, a one-pass `PASS`, and no ceremony.

## 4. Proposed Developer behavior

`developer` keeps its tools, its ownership (IMPLEMENTATION.md only), and every Phase 3 prohibition. Its procedure becomes the steps below. The policy rules are normative in the new skill (§16) as IQ1–IQ16; the agent body keeps only the procedure.

1. **Read.** Read the `implementation-quality` skill, then PLAN.md, TEST-CONTRACT.md (active revision), and RED-REPORT.md.
   - Read WORKSPACE.md **for the baseline SHA only**. This is a new input: one ownership-matrix cell changes from `—` to `input`, and it is needed for the baseline-to-HEAD self-inventory.
   - On a fix round, also read VERIFICATION.md's Findings for developer.
   - On a human-directed round, `pipeline` quotes the guidance in the invocation prompt, tagged `[DEV]`.
2. **Implementation map (before any edit; not an artifact).** Per repository, list:
   - the planned paths;
   - the non-test obligations (`C`, `Q` answers, `I` facets, Out of scope);
   - the `I`-row implementation order;
   - the expected consequential edits.

   This map later becomes IMPLEMENTATION.md's Changes and Obligations sections.
3. **Suite baseline (round 1, before the first edit, per repository).** Take a clean checkout with HEAD = active anchor and run the full suite once `[TOOL]`. Optional in general, but required before any failure can later be classified PRE-EXISTING (D3).
4. **Iterate** per the GREEN iteration contract (§5): edit batch → contract command → classify → continue or route.
5. **Commit.** At GREEN in the working tree:
   - review the bare `git -C <dir> diff` for scope, so that every hunk traces (§6);
   - run the index-scope check and commit. An optional preceding enabling-refactoring commit is allowed (§7). Amending is never allowed (`.vscode/settings.json:44` already forces a prompt).
6. **Handoff checks at the committed HEAD (IQ2).**
   - Clean status.
   - The exact contract command, with an identity tally.
   - Relied-on identities.
   - The full suite.
   - The controlled-path self-check.
   - The envelope self-check.
   - The changed-path self-inventory from the baseline, which must contain no UNRELATED path.
7. **Record** IMPLEMENTATION.md (§9). Hand off only when **every** affected repository is GREEN.
8. **Blocked.** Record `BLOCKED` with the reason and per-repository status. Commit production work-in-progress under a message marking it not GREEN (never a controlled path), so the checkout is clean for whatever comes next. Return control to `pipeline`, which voices `IMPLEMENTATION_BLOCKED` (§5, D1).

New read-only command forms for `developer`:
- `git -C <dir> diff --stat <anchor>..HEAD -- <paths>`
- `git -C <dir> diff --name-status <anchor>..HEAD -- <paths>`
- `git -C <dir> diff --name-status <base>..HEAD`
- `git -C <dir> diff <base>..HEAD` (optionally with `-- <paths>`)

These are exactly the Verifier's own evidence forms, and each already matches an existing allow rule (`.vscode/settings.json:29–33`), so neither the settings nor any `tools:` list changes. The Developer's self-checks exist to catch problems early and cheaply; the Verifier never trusts them.

## 5. GREEN iteration contract

**GREEN (IQ2), per repository.** GREEN holds only when all of the following are true on the **committed HEAD** with a **clean status**:
1. The **exact** contract command from the active TEST-CONTRACT.md revision ran unmodified. No added or removed test filter, profile, `-D` property, flag, or environment variable.
2. Every contract identity (parameterized invocations counted individually) was discovered, executed, and not skipped. WITNESS tests now pass and PRESERVATION tests still pass.
3. Every relied-on identity was observed executed and passing (scoped command if the aggregate output does not name it).
4. At handoff, the full suite passed, or its only failures are PRE-EXISTING under D3.
5. The controlled-path self-check shows no change since the active anchor that an activated amendment does not cover.

A passing working tree is not GREEN; GREEN is recorded only from the post-commit run.

**GREEN is never manufactured (the contract-gaming patterns, IQ2).** Developer never does any of the following, and the Verifier reads the diff for each:
- **Command, discovery, or configuration games:** narrowing the command to a subset; skip or failure-ignore properties (`-DskipTests`, `-Dmaven.test.failure.ignore`, `-Dsurefire.failIfNoSpecifiedTests=false`, rerun-failing-tests counts); changing test includes, excludes, tags, or profiles through an ordinary envelope file.
- **Test-aware production code:** branching on test profile, environment, classpath, or class presence.
- **Fixture overfitting:** production code that special-cases literal values that appear in contract tests or fixtures instead of implementing the clause's general Given/When/Then.
- **Flake laundering:** accepting a lucky pass after a contract identity has flipped between identical runs. A flip is diagnosed (production race → implementation defect; test instability → `CONTRACT_SUSPECT`; environment → `RUNNER_UNAVAILABLE`), never rerun until green.

**Iteration unit and cadence (IQ3).**
- An **iteration** is one contract-command run after an edit batch.
- **Diagnostic runs** are not iterations and are never GREEN evidence: a compile goal, or a single-identity scoped run for fast feedback. Each still prompts in Manual mode.
- The contract command is the iteration oracle.
- The **full suite runs twice per invocation at most**: once as the optional round-1 baseline, and once at handoff on the committed HEAD. It is never part of the inner loop.

**Progress and budget (IQ3).**
- **Progress** means the set of failing contract and relied-on identities shrinks, or stays the same while at least one failing identity now fails later or differently in a way the iteration's edit explains (recorded in one clause).
- **Budget:** at most **six iterations per repository per stage-6 invocation**, and never more than **two consecutive iterations without progress**. An implementation-caused build failure is an ordinary iteration result that makes no progress.
- Each iteration is one log line: `i<n> · <repo> · <edit, one line> · failing: <ids | none> (Δ) · class`.
- Exhausting the budget raises `IMPLEMENTATION_BLOCKED (NO_PROGRESS)`. Each invocation (initial, each fix round, a directed round) gets a fresh budget.

**Failure classification and routing (IQ4).**

| Class | Meaning | Route |
|---|---|---|
| `IMPLEMENTATION_GAP` | WITNESS fails at its own assertion | Keep iterating (budget) |
| `REGRESSION` | A PRESERVATION, relied-on, or full-suite identity now fails because of the change | Fix the production code; never touch the expectation |
| `BUILD_BREAK` | Compile/build failure caused by the change | Fix (never `RUNNER_UNAVAILABLE`) |
| `CONTRACT_SUSPECT` | Evidence that a test observes wrongly or overconstrains | `TEST-CHANGE-REQUEST` (T12 content, unchanged) |
| `CONTRACT_CONFLICT` | Two contract clauses cannot both pass | `TEST-CHANGE-REQUEST`; the assessment decides (`REQUIREMENT_CHANGE` → planning) |
| `ENVIRONMENT` | A6 conditions | `RUNNER_UNAVAILABLE` (unchanged) |
| `NONDETERMINISTIC` | An identity flips between identical runs | Diagnose as above; never launder |
| `MATERIAL_DEVIATION` | Delivering the contract needs an approach that contradicts an approved element (§6) | `IMPLEMENTATION_BLOCKED` |
| `NO_PROGRESS` | Budget or streak exhausted | `IMPLEMENTATION_BLOCKED` |
| `CONTROLLED_PATH_CHANGED` | The self-check finds a change to a controlled path | `IMPLEMENTATION_BLOCKED`; never self-repaired (D2) |

**New conditional STOP (D1).**

```text
STOP [IMPLEMENTATION_BLOCKED]: Develop GREEN cannot continue within the approved plan and test contract (<NO_PROGRESS | MATERIAL_DEVIATION | CONTROLLED_PATH_CHANGED>: <one line>; per-repository status <repo: GREEN | BLOCKED>).
Decision needed from: developer.
Direct one bounded implementation round (for a controlled-path change: authorize restoration to the active anchor), send the plan back for a new planning cycle, or abort.
```

- The directed round is explicit and bounded (Round `D1` in RUN.md's Stage status table, guidance recorded verbatim `[DEV]` in the Decision log), with a fresh iteration budget. It is never an automatic reset.
- Guidance that changes approved behavior, a decision, or scope is recorded as a planning send-back, not as a directed round.
- A directed round raised from verification replaces that verification's fix round and counts against the fix-round budget.

**New Bounded-loops sentence** (FLOW.md, GUARDRAILS.md): "Developer GREEN iteration: within one stage-6 invocation, at most six contract-command iterations per repository and never more than two consecutive iterations without progress; exhaustion, a required material deviation, or a changed controlled path raises `IMPLEMENTATION_BLOCKED`; a human-directed implementation round is explicit and bounded, never an automatic reset."

## 6. Scope/deviation rules

**Changed-path classes (IQ5).** Each class is used by Developer's self-inventory and by the Verifier's inventory.

| Class | Rule |
|---|---|
| `PLANNED` | The path is an Affected files entry (textual match, unchanged Phase 2 semantics) |
| `PLAN-TRACED` | Not listed, but declared in IMPLEMENTATION.md with a trace to a specific Approach sentence, `I` row, `C` row, or evidence id, **and** its change is necessary to deliver that element. This covers **consequential edits**: callers of a changed signature, wiring/registration, the adapter an `I` row routes through (the LARGE plan's `LedgerClient`/`RestLedgerClient`). Undeclared → `UNRELATED`. This is the Phase 4 answer to "matching beyond operative file paths" (Phase 2 contract `:150`) |
| `ENVELOPE` | An ordinary envelope file, with a per-hunk justification (IQ8) |
| `PROTECTED-TEST` | Tester's paths. Expected in a baseline diff; changed since the anchor only through an activated amendment |
| `UNRELATED` | Anything else → **FAIL (SCOPE)** |

**Planned but not changed.** An Affected files entry left untouched is declared under Deviations with its reason; otherwise it is a NOTE. It is a FAIL only if the element it served turns out to be undelivered (§11).

**Hunk-level scope (IQ5).** Within PLANNED and PLAN-TRACED paths, every hunk must connect to one of:
- a plan element;
- a declared enabling refactoring (§7);
- a consequential edit.

A hunk that connects to none of these is an **unrelated hunk** → FAIL (SCOPE). Examples: a formatting-only rewrite, a rename in code the change does not touch, an unrelated config key. The remedy is to remove it, or declare the connection so the Verifier can judge it. This makes "PLANNED" mean something at the level of content, not just file names.

**Deviation classes (IQ6).** Developer declares; the Verifier re-derives from the diff and reconciles.

| Class | Test | Handling |
|---|---|---|
| Implementation detail | Internal structure within planned or traced paths that contradicts no Approach sentence | None; no declaration |
| `MINOR` deviation | Departs from an Approach sentence or from Affected files, but preserves every AC/P outcome, `Q` answer, `C` constraint, `I` row (fields, failure behavior, deployment compatibility), and Out of scope, and adds no new public surface, persisted shape, configuration key, or repository beyond the plan. Examples: the Phase 1 example's `RetryBackoffPolicy` folded into a private method; a plan-traced adapter method | Developer proceeds and declares it (what, why, the element it touches). Verifier confirms or reclassifies it |
| `MATERIAL` deviation | Would change or contradict any element in the `MINOR` test, or would change the change class (for example, an unplanned persistence change or public contract) | Developer **never** proceeds: `IMPLEMENTATION_BLOCKED (MATERIAL_DEVIATION)`. The human sends the plan back (a new planning cycle, Phase 2 mechanism) or directs a round within the plan. A human never approves a material deviation outside planning, because that would bypass the stage-4 review |

- An undeclared `MINOR` deviation found by the Verifier is a NOTE (the record is corrected in the next handoff).
- An undeclared or declared `MATERIAL` deviation is a FAIL (DEVIATION).
- Branch history is never rewritten. Code from an abandoned approach is removed by forward edits and appears in the inventory like any other change.

## 7. Refactoring rules (IQ7)

There is no blanket ban on refactoring. **Enabling refactoring** is allowed when all four hold:
1. It is confined to PLANNED or PLAN-TRACED paths.
2. It is necessary for, or directly adjacent to, the planned change — the code the change touches.
3. It is behavior-preserving, evidenced by the PRESERVATION and relied-on identities and the handoff full suite.
4. It is declared under Deviations whenever it goes beyond the lines the planned change needs (one line: what and why).

**Opportunistic cleanup is forbidden:** renames, reformatting, dead-code removal, dependency upgrades, or style changes in code the change does not need, and any refactoring that alters a public signature or contract not in the plan (that is `MATERIAL`).

**Optional "refactor under RED" (MEDIUM/LARGE).** A non-trivial enabling refactoring may be committed first, as its own commit, with the contract command showing the RED pattern unchanged: every WITNESS still failing at its recorded locus, every PRESERVATION and relied-on identity still passing. This is cheap, strong evidence that the refactor did not change behavior. The commit is recorded in Commits and is never GREEN evidence.

## 8. Cross-repository implementation behavior (IQ9)

- **Order.** Developer follows the `I` rows' implementation order when one is stated (for example, provider before consumer). If a row says "either order", Developer picks one and records it. Deployment compatibility is a rollout fact (`ROLLOUT`, §11), never a development gate.
- **All repositories GREEN before verification.** There is no partial handoff: a partial state can never be `PASS`, and G4 publishes the set atomically (the publish preflight covers every repository before any push). IMPLEMENTATION.md records a status per repository (`GREEN` / `BLOCKED (<class>)`). A blocked repository stops the run through `IMPLEMENTATION_BLOCKED`, which names every repository's status. GREEN repositories keep their commits: nothing is reset and nothing is pushed.
- **Interface consistency.** For each `I` row, Developer's Obligations map names where the consumer encodes and where the provider decodes each field, and where the failure behavior lives. The Verifier checks both sides of the diff against the row (§10). Test-level conformance stays with T8's evidence.
- **Build-time artifact dependencies between repositories** (one repository compiling against another's unpublished artifact) are a host-environment condition. An unobtainable artifact is `RUNNER_UNAVAILABLE`, never a reason to repoint a dependency. The reference models runtime interfaces (`I` rows) only.

## 9. IMPLEMENTATION.md improvements (IQ10)

The six existing headings stay, four are added, and SMALL collapses empty sections to one line.

| Heading | Content |
|---|---|
| **Status per repository** (new) | `GREEN` / `BLOCKED (<class>)`; the header `status` is `GREEN` only when every repository is GREEN |
| **Changes per repository** (sharpened) | One line per path: path · class (`PLANNED`/`PLAN-TRACED`/`ENVELOPE`) · reason (AC/P/I/Q/C id, or the trace) |
| **Commits** | SHA, message, repository; an enabling-refactoring or work-in-progress commit is marked as such |
| **GREEN evidence** (sharpened) | Suite baseline at the anchor (if taken); iteration log lines; per repository: committed HEAD, clean status `[TOOL]`, the exact contract command with its identity tally, relied-on identities, full-suite command and tally, the controlled-path and envelope self-check outputs |
| **Obligations** (new) | Per `C` row, `Q` answer, `I` facet, and Out of scope item: where it is honored (`path:symbol`), or `ROLLOUT`; `none` when the plan has none |
| **Envelope changes** | Per ordinary envelope file: each hunk with its justification; proof-relevant files never appear here (unchanged T9) |
| **Deviations from plan** (sharpened) | `MINOR` deviations, enabling refactorings, planned-not-changed paths, each with the plan element it touches. A `MATERIAL` deviation never appears here, because it STOPs instead |
| **Test-change requests** | Unchanged (T12 content) |
| **Handoff notes** (new) | Limitations; `NOT_VERIFIED` clauses with where they are implemented; PRE-EXISTING failures (D3); cross-repository order and rollout notes for the PR |
| **Fix-round response** (new, fix rounds only) | Per finding id: `FIXED` (what changed, which paths) or `DISPUTED` (evidence). A dispute is not a pass; the Verifier adjudicates |

Proportional targets (soft): SMALL about 30–35 lines; LARGE grows with the number of repositories and obligations, not with the number of iterations (one line each). A fix round revises the same artifact as an authorized regeneration (the prior revision is SUPERSEDED in RUN.md, unchanged Phase 1 A6).

## 10. Proposed Verifier improvements

The mechanical checks (§1.2) stay exactly as they are. The procedure gains the following:

1. **Obligations first, claims last (IQ11).** Before reading the diff or IMPLEMENTATION.md, the Verifier derives from PLAN.md, and from RUN.md's `CURRENT` G3 entry, the expected change set (Affected files) and the obligation list: `C` rows, `Q` answers, `I` facets, Out of scope, and `NOT_VERIFIED` clauses. It runs the executions, builds the inventory, and reads the full patch. **Only then** does it read IMPLEMENTATION.md's classifications, deviations, and obligation map, and reconcile them. This is the counterpart of 5b's outcome-first order: procedural independence, not a blind review.
2. **Changed-path inventory with the five classes** plus planned-not-changed (§6). `UNRELATED` → FAIL (SCOPE).
3. **Hunk review.** Every hunk of the baseline-to-HEAD patch is checked in turn:
   - It must connect to a plan element, a declared enabling refactoring, or a consequential edit; otherwise FAIL (SCOPE).
   - Contract-gaming patterns → FAIL (INTEGRITY).
   - A production-config hunk must trace to a `C`/`Q`/AC element.
   - Envelope hunks are checked against their per-hunk justification (a hunk the justification does not describe → FAIL (ENVELOPE)). This closes the gap where `--name-status` plus justification text passed an undescribed `<excludes>` or version change.
4. **Obligation check.** Each obligation is recorded as `HONORED` (evidence `path:line`), `VIOLATED` → FAIL (DEVIATION), `NOT_LOCATABLE` → FAIL (EVIDENCE: the implementation must make it evident; never PASS by default), or `ROLLOUT` (not code-verifiable by design; disclosed). A `NOT_VERIFIED` clause with no implementation located is a FAIL, because Developer must implement the whole plan. With an implementation located, the verdict stays `INCOMPLETE`: inspection is never evidence of correctness.
5. **Declared-versus-detected deviations.** An undeclared `MINOR` deviation → NOTE; a `MATERIAL` deviation, declared or not → FAIL; a declared `MINOR` deviation that the Verifier reclassifies `MATERIAL` → FAIL.
6. **Cross-repository consistency.** For each `I` row, both sides of the diff are checked against its fields, failure behavior, and compatibility claim. Each repository gets its own verdict line; the overall verdict is the worst (`FAIL` > `INCOMPLETE` > `PASS`). Every repository is verified inside the same round's before/after bracket.
7. **Findings shape and verdict table** (IQ12, §12). **Prior findings** on re-verification: each prior id `CLOSED` / `OPEN`.
8. **Full-suite failure classification** (D3): each failing identity is `CAUSED` → FAIL, `PRE-EXISTING` → disclosure, or `NOT_RUN` (environment) → `RUNNER_UNAVAILABLE`.
9. **Integrity routing** (D2): an INTEGRITY finding for a changed controlled path makes `pipeline` voice `IMPLEMENTATION_BLOCKED (CONTROLLED_PATH_CHANGED)` instead of starting an automatic fix round.

VERIFICATION.md keeps its twelve headings and gains:
- **Obligation check** (new);
- **Prior findings** (new; re-verification only);
- per-repository verdict lines and a **Disclosures** line under Verdict (NOTE findings, `ROLLOUT` obligations, PRE-EXISTING failures);
- the new path classes in Changed-path inventory;
- the hunk review and reconciliation under Diff-versus-plan findings;
- the IQ12 shape for Findings for developer.

The command forms are unchanged: the Verifier already holds `diff <base>..HEAD`.

### 10.1 Is Developer → Verifier sufficient? (the independent-review question)

| Option | Value | Cost and weaknesses | Verdict |
|---|---|---|---|
| **A. Strengthen the Verifier** (obligations first, anchored semantic check, hunk review) | It already holds a terminal, reruns everything, and reads the full patch; adding anchored checks there is where the evidence lives | Same-model blind spots (Sonnet on both sides); procedural independence only | **Recommended** |
| B. Adversary implementation-review mode (a stage 7b) | A second reader with a distinct method | Adversary has no terminal, so it cannot produce the patch and would review a patch recorded by another agent (weaker evidence); adds a thirteenth artifact, a loop, and latency. Stage 5b exists because tests had no reviewer before implementation; the implementation already has an independent reviewer with a terminal | Rejected for now |
| C. A new reviewer agent with read-only terminal access | Independence plus evidence | A tenth agent and a new tool list; duplicates the Verifier | Rejected (no compelling reason) |
| D. Developer self-review only | Cheap early detection | Not independent | Kept **only** as a pre-filter under A; never trusted |

This matches the owner's default: no new agent, no new routine gate, strengthen the Verifier first. If benchmarks later show the Verifier missing seeded semantic defects, the next step is model diversity for the Verifier role (MODEL-ROLES.md), not a new stage.

### 10.2 Model strategy (documentation only, IQ16)

Sonnet 5 remains the baseline for every role, and nothing changes models automatically. MODEL-ROLES.md gains a section naming `developer` and `verifier` as benchmark candidates, scored as follows:
- **Developer:** iterations to GREEN; scope precision (the rate of UNRELATED paths and unrelated hunks); agreement between declared and detected deviations; incidence of contract-gaming patterns.
- **Verifier:** detection of seeded wrong-but-test-passing implementations (a `C` violation, fixture overfitting, test-aware code, a hidden configuration change); the false-FAIL rate on legitimate traced edits; consistency of findings across rounds.

These are hypotheses to measure, not results.

## 11. Semantic verification boundaries (IQ12)

**Anchoring rule.** A semantic finding can FAIL only when it cites a specific approved element together with diff evidence. The approved elements are:
- an AC/P clause (only for contract-gaming patterns or a contradiction of its general statement);
- a `Q` answer;
- a `C` row;
- an `I`-row field, failure behavior, or compatibility claim;
- an Out of scope item;
- the Affected files scope and its trace rules;
- a `NOT_VERIFIED` clause's presence.

Everything else is a **NOTE** (advisory) and **never** FAILs.

**In scope:**
- wrong but test-passing implementations anchored to the elements above;
- missing plan behavior that no test carries (`C`/`Q`/`I` facets, `NOT_VERIFIED` presence);
- hidden configuration changes;
- compatibility regressions against `P` rows, `PRESERVED` items, `I` compatibility, and exposure decisions (for example the LARGE plan's Q3: do not expose `ledgerReportStatus`);
- implementations that contradict approved decisions;
- **unnecessary complexity only when it creates new public surface** (an endpoint, public API, configuration key, persisted field, or dependency) that traces to no plan element → SCOPE.

**Out of scope, always:**
- judging plan quality or re-verifying PLAN.md's evidence rows (stage 4's job);
- test adequacy (stage 5b's job; the existing prohibition stays);
- proposing designs or code — findings state the *required outcome*, never the code;
- style, naming, or readability;
- performance not named by the plan;
- rollout execution (Phase 5).

The Verifier is a bounded conformance reviewer, not a second Planner or an unlimited code reviewer.

## 12. Failure feedback / fix-round behavior (IQ12, IQ13)

**Finding shape.** `id · category (IMPLEMENTATION | REGRESSION | SCOPE | DEVIATION | ENVELOPE | INTEGRITY | EVIDENCE | NOTE) · severity (BLOCKING | NOTE) · repository · anchor (the check or plan element id) · evidence ([TOOL] excerpt or path:line hunk) · required outcome (what must be true — never how to code it) · fix scope (the paths the fix is expected to touch)`.

**Verdict.** `FAIL` if any finding is BLOCKING. Otherwise `INCOMPLETE` if the `NOT_VERIFIED` set is non-empty or the review is a covered `CURRENT REVISE` (unchanged). Otherwise `PASS`, with NOTEs, `ROLLOUT` obligations, and PRE-EXISTING failures under Disclosures.

**Fix round.**
- `pipeline` passes VERIFICATION.md as today.
- **Scope bound:** Developer may touch only the union of the findings' fix scopes, plus declared consequential edits. A new path outside that set → FAIL (SCOPE).
- Every finding gets a Fix-round response entry (`FIXED` / `DISPUTED` with evidence). A test-change need discovered in a fix round still goes through `TEST-CHANGE-REQUEST`.
- Integrity findings are not fix-round material (D2).

**What becomes stale after a fix round.**
- All of VERIFICATION.md: the new HEAD invalidates the SHA bracket.
- IMPLEMENTATION.md's GREEN evidence, which is regenerated at the new HEAD.
- Any G4 answer, by the existing rule if re-verification happens after G4.
- TEST-CONTRACT.md and TEST-REVIEW.md stay current unless the round carried an amendment; an amendment follows the Phase 3 re-review/activation path first.

**Re-verification scope: everything, every repository, every round.** The before/after bracket and the G4 basis are per round. Selective reuse would need a dependency model the reference does not have — build-level coupling between repositories, cached results keyed by SHA — which is infrastructure an internal pipeline may already own; the comparison guide will ask about it. The cost is bounded by the two-fix-round budget. Each re-verification records Prior findings closure. A new BLOCKING finding on a hunk unchanged since the prior round is allowed but labelled "new on unchanged code", so the Verifier's consistency can be measured.

## 13. Partial/incomplete verification handling — could not verify ≠ failed ≠ passed

| Condition | Where recorded | Effect |
|---|---|---|
| Runner or environment unavailable (stage 6 or 7, contract or full suite) | `RUNNER_UNAVAILABLE` (unchanged A6) | No GREEN and no PASS recorded; fix the environment and resume |
| A required clause `NOT_VERIFIED` (coverage gap, covered REVISE) | `INCOMPLETE` (unchanged T10/T11) | Never G4; recovery through stage 5 |
| Developer cannot reach GREEN in a repository | IMPLEMENTATION.md `BLOCKED` → `IMPLEMENTATION_BLOCKED` | No handoff; GREEN repositories keep their commits, nothing is published |
| A code obligation cannot be located | FAIL (EVIDENCE) | Never PASS by default |
| A rollout-only obligation (for example "ledger deploys first") | `ROLLOUT` disclosure | PASS allowed; shown under Disclosures, in the PR description, and at G4 |
| A full-suite identity failing identically at the anchor baseline (D3) | `PRE-EXISTING` disclosure | Per D3 (recommended: PASS allowed with disclosure at G4) |
| A full-suite subset needs unavailable infrastructure | `RUNNER_UNAVAILABLE` (unchanged) | No PASS; a qualified full-suite scope is **deferred** (like Phase 3's D6 qualified-publication path) |
| An interrupted stage 6 | IMPLEMENTATION.md missing or `BLOCKED` → resume at stage 6 (the generic first-missing/failed rule) | Existing commits stand; the iteration log continues |

## 14. Proportionality for SMALL/MEDIUM/LARGE (IQ15)

The Phase 2 change class is reused; there is no new classification.

| | SMALL | MEDIUM | LARGE |
|---|---|---|---|
| Iteration log | often one line | lines | lines per repository |
| Suite baseline | optional (needed only to claim PRE-EXISTING) | same | same, per repository |
| Handoff full suite | always | always | always, every repository |
| Obligations | `none` or one line | `C`/`Q` rows | plus `I` facets on both sides |
| Deviations | usually `none` | as needed | as needed |
| Refactor under RED | n/a | optional | optional |
| Verifier obligation check and hunk review | one compact pass | proportionate | full, including cross-repository `I` rows |
| IMPLEMENTATION.md target | ~30–35 lines (soft) | proportionate | grows with repositories and obligations, not iterations |

In every class: the GREEN definition, the gaming patterns, the path classes, the anchoring rule, and the verdict table apply unchanged. Empty sections collapse to one line.

## 15. Human UX impact

- **No new routine gate.** G1–G3 are unchanged. G4's question is unchanged. The one addition is a **displayed Disclosures line** (NOTE findings, `ROLLOUT` obligations, and, if D3(a), PRE-EXISTING failures) beside the PR description and the tuple G4 already shows. This is information at an existing decision point, not a new decision.
- **One new conditional STOP** (`IMPLEMENTATION_BLOCKED`, D1). It replaces two things the developer cannot see today: an unbounded loop and a silent material deviation. It fires only on exhaustion, a required material deviation, or a changed controlled path.
- **Fix rounds stay automatic.** Findings become more actionable (required outcome plus fix scope), so fewer rounds should be wasted.
- **Runner prompts (Manual mode, by Phase 1 design).** Per repository per invocation: up to six iteration runs, any diagnostic runs, one post-commit contract run, one handoff full suite, and an optional baseline. The iteration ceiling bounds the prompts. The Developer's self-checks use auto-approved diff forms and do not prompt.

## 16. Whether any new skill is justified

**Yes: exactly one, `.github/skills/implementation-quality/SKILL.md`** (`user-invocable: false`, `disable-model-invocation: true`). It holds IQ1–IQ16:

| Rule | Topic |
|---|---|
| IQ1 | Inputs and consumption of PLAN.md and TEST-CONTRACT.md |
| IQ2 | The GREEN definition and the contract-gaming patterns |
| IQ3 | Iteration unit, progress, and budget |
| IQ4 | Failure classification and routing |
| IQ5 | Path classes and hunk scope |
| IQ6 | Deviation classes |
| IQ7 | Refactoring |
| IQ8 | Envelope hunks |
| IQ9 | Cross-repository behavior |
| IQ10 | Evidence |
| IQ11 | The Verification method (the section the Verifier reads) |
| IQ12 | Findings, anchoring, and the verdict table |
| IQ13 | Fix rounds and staleness |
| IQ14 | Could-not-verify mapping and the PRE-EXISTING rule |
| IQ15 | Proportionality |
| IQ16 | Model roles (documentation only) |

It is read by `developer` (construction) and by `verifier` (everything, then the Verification section).

Why a skill, rather than agent prose or two skills:
- **Two readers.** Both readers must apply one vocabulary: GREEN, path classes, deviation classes, gaming patterns. This is the `plan-grounding` and `test-contract` precedent.
- **Agent bodies stay procedural.** Both agent bodies are already dense; they will reference the rules instead of restating them.
- **Portability.** It is the most portable Phase 4 asset.
- **One skill, not two.** Developer must know exactly what the Verifier will check; the Verifier's independence comes from its order of reading and its evidence, not from hidden criteria. That is the same reasoning that kept `test-contract` as one skill.

Rejected: a separate verify-implementation skill (it would hide criteria from Developer), and separate refactoring, cross-repository, or gaming-pattern skills (they would fragment one policy).

## 17. Exact files proposed for modification

| File | Change |
|---|---|
| `.github/skills/implementation-quality/SKILL.md` **(new)** | IQ1–IQ16 (§4–§14); normative home of the policy |
| `.github/agents/developer.agent.md` | Procedure §4; GREEN at the committed HEAD; iteration log; IQ4 routing; `IMPLEMENTATION_BLOCKED` recording and the work-in-progress rule; the four read-only diff forms; WORKSPACE.md input (baseline only); the IMPLEMENTATION.md headings (§9); fix-round scope and response. `tools:` byte-identical |
| `.github/agents/verifier.agent.md` | Reading order (obligations first, claims last); five path classes; hunk review; Obligation check; deviation reconciliation; cross-repository verdict lines; finding shape and verdict table; Prior findings; PRE-EXISTING classification (D3); INTEGRITY routing (D2); VERIFICATION.md additions. `tools:` and command forms unchanged |
| `.github/agents/pipeline.agent.md` | Stage 6: relay `IMPLEMENTATION_BLOCKED` with its three options, record the directed round (`D1`, Decision log `[DEV]`) and the restoration authorization; the developer invocation names WORKSPACE.md. Stage 7: INTEGRITY → `IMPLEMENTATION_BLOCKED` instead of a fix round. G4 Disclosures line. The authorized-regeneration list gains "developer-directed implementation round". `tools:` byte-identical |
| `.github/pipeline/FLOW.md` | Stage 6/7 rows and narratives; STOP catalogue +1; Bounded-loops sentence +1; G4 displayed content; authorized-regeneration phrase |
| `.github/pipeline/AGENT-CONTRACTS.md` | `developer`/`verifier`/`pipeline` sections; developer's allowed forms (+4 read-only); ownership matrix (WORKSPACE.md → developer `input`); IMPLEMENTATION.md and VERIFICATION.md templates |
| `.github/pipeline/GUARDRAILS.md` | Bounded-loops sentence; Test immutability mechanism: the Developer self-check, "an integrity violation is never an automatic fix round", a pointer to the gaming patterns |
| `.github/pipeline/MODEL-ROLES.md` | IQ16 section (documentation only) |
| `.github/skills/pipeline/SKILL.md` | The authorized-regeneration phrase only (the stage-6/G4 sentence untouched) |
| `docs/examples/PAYMENTS-12345-testing/` | Extended in place through stage 7 (D4): IMPLEMENTATION.md, VERIFICATION.md (round 1 FAIL, round 2 PASS), a new `DIFF-EXCERPTS.md` (focused fictional hunks), RUN.md rows, README |
| `docs/examples/PAYMENTS-12410/` | Extended in place through stage 7 (D4): IMPLEMENTATION.md, VERIFICATION.md (PASS), RUN.md rows, README |
| `docs/COMPARISON-GUIDE.md` | Developer, verifier, and pipeline entries; skill entry; examples; theme "Evidence-bound GREEN and anchored verification"; **the N1 stale summaries fixed in the same edit** (these exact lines must change for Phase 4's new loop and STOP anyway) |
| `README.md` | Asset tree, Phase 4 status |
| `docs/specs/2026-09-11-phase-4-implementation-quality-contract.md` **(new, after approval)** | The approved form; this proposal stays unedited |

## 18. Explicit files/areas NOT to modify

- `tester`, `adversary`, `planner`, `intake`, `workspace`, and `pr` agents (PR-DESCRIPTION.md already draws its Testing and rollout content from VERIFICATION.md and PLAN.md).
- The `test-contract`, `plan-grounding`, `challenge-plan`, `gather-jira-context`, and `discover-affected-projects` skills; `.github/copilot-instructions.md`; `.vscode/*` (every new form already matches an allow rule, and the runner still prompts).
- The Phase 1, 2, and 3 contracts and proposals (N2 stays as §11 records it); `docs/specs/archive/`; `docs/reviews/` (owner-local, untracked); `docs/questions.md` unless a question arises.
- `docs/examples/PAYMENTS-12345/` and `PAYMENTS-12345-planning/`. Inside the two extended directories, every Phase 2/3 artifact stays byte-identical: PLAN, INTAKE, ADVERSARY-REVIEW, TEST-CONTRACT, RED-REPORT, TEST-REVIEW, and SOURCE-EXCERPTS. Only RUN.md and README change, plus the new files.
- All three reference tags. Nothing from Phase 5 (delivery, rollout execution, Jira/Bitbucket integration, a qualified full-suite or publication path).

## 19. Compatibility with locked Phase 3 test-contract semantics

- **T9 controlled paths** are used as defined. Developer's self-check uses the Verifier's own anchor rule (latest activated amendment). The one new edit Developer may ever make to a controlled path is a **human-authorized restoration** to exact anchor content (D2), verified by an empty immutability diff. It is not a test change and never changes what a test observes.
- **T10:** `NOT_VERIFIED` → `INCOMPLETE` → never G4, recovery through stage 5 — unchanged. Phase 4 adds only that a `NOT_VERIFIED` clause with no implementation located FAILs.
- **T11:** a current test review is still the stage-6 precondition; the stage-6/G4 sentence is untouched in all three places.
- **T12:** the request content, the effect enum, the authority rule, and the one package rule are unchanged. `CONTRACT_SUSPECT`/`CONTRACT_CONFLICT` enter the existing request path; `REQUIREMENT_CHANGE` still routes to planning.
- **T13:** a human prerequisite commit stays `ENVELOPE`, citing RUN.md. A restoration commit made by a human is recorded in the Decision log the same way.
- **The immutability command form** is unchanged. The Verifier's prohibition on test-adequacy review is unchanged, and the discrimination check of amended tests stays at 5b.
- **Tester, Adversary, RED-REPORT.md, TEST-CONTRACT.md, TEST-REVIEW.md:** untouched.

## 20. Proposed implementation checkpoints

**Delivery method.** Sonnet 5 implements each checkpoint; the architect reviews it against §21; at most two correction rounds; local commit on PASS; then ChatGPT review.

- **P4-C1 — Policy skill, agents, pipeline documents.** The skill; `developer`, `verifier`, `pipeline` agents; FLOW.md, AGENT-CONTRACTS.md, GUARDRAILS.md, MODEL-ROLES.md; the pipeline skill's regeneration phrase.
- **P4-C2 — Implementation-stage examples.**
  - **LARGE** (`PAYMENTS-12345-testing/` through stage 7):
    - `payments-ledger` (provider) implemented first, then `payments-api` (`I1` order).
    - Round-1 hard-coded 1 s base delay (all contract tests GREEN) → the Verifier's C1 obligation `VIOLATED` → FAIL with the IQ12 shape → one scoped fix round → round-2 PASS.
    - `LedgerClient`/`RestLedgerClient` recorded as `PLAN-TRACED` (surfacing the locked plan's inventory gap).
    - `ROLLOUT` disclosure for the ledger-first deployment.
  - **SMALL** (`PAYMENTS-12410/` through stage 7): one or two iterations, a compact IMPLEMENTATION.md, a one-pass PASS with zero semantic findings, and the LOW-confidence `validation.properties` entry handled honestly.
  - Both stop at stage 7 by design (stages 8–10 are unchanged and not re-demonstrated).
- **P4-C3 — Guide, README, contract traces and closure.** Comparison guide (including the N1 fix), README, the challenge cases traced in the contract (list below), and the closure section.

## 21. Acceptance criteria per checkpoint

**P4-C1.**
- (a) Each IQ rule lives in exactly one normative place. Agent bodies reference the skill rather than restate it. There is no contradiction across the skill, the four pipeline documents, the pipeline skill, and the three changed agents on: the GREEN definition, the gaming patterns, the iteration budget sentence (identical in FLOW.md and GUARDRAILS.md), the path and deviation classes, the anchoring rule, the finding shape, the verdict table, and the STOP text.
- (b) Every `tools:` list is byte-identical to `20939cc`. There is no new agent, gate, tool, MCP capability, setting, or artifact, and exactly **one** new STOP code (`IMPLEMENTATION_BLOCKED`, if D1 is accepted). Existing STOP messages are unchanged.
- (c) Developer's four added forms appear only in `developer.agent.md` and AGENT-CONTRACTS.md, and each matches an existing `.vscode/settings.json` allow rule (checked line by line).
- (d) The stage-6/G4 sentence is identical and unchanged in its three homes. The immutability command form is unchanged, and `INCOMPLETE` still never reaches G4. The G4 change is limited to the Disclosures line.
- (e) The ownership matrix differs from `20939cc` only in the WORKSPACE.md/developer cell.
- (f) `git diff 20939cc` is empty for every file in §18.

**P4-C2.**
- (a) The LARGE example shows every element listed in §20, including the iteration log and the full-suite and relied-on evidence at the committed HEAD per repository. The round-1 finding carries anchor `C1`, `DIFF-EXCERPTS.md` evidence, the required outcome ("the base delay is read from `webhook.retry.base-delay`"), and the fix scope. The round-2 Prior findings are `CLOSED`, and the verdict lines are per repository.
- (b) The SMALL IMPLEMENTATION.md is ≤ ~35 lines (soft; reported as measured).
- (c) Every identifier and log line is fictional and stated so; no example claims execution; the Phase 2/3 artifacts are byte-identical (hash check).

**P4-C3.**
- (a) Guide entries for the skill, the three agents, and the examples, plus the new theme. N1's eleven→twelve artifacts, loops, and resume summaries are corrected. The README is current.
- (b) Challenge cases traced as document scenarios, marking which ones an example exercises:
  1. Narrowed command or skip property (IQ2).
  2. Fixture-literal special-casing.
  3. Test-aware production code.
  4. Flake laundering.
  5. Hard-coded value violating C1 while tests pass (LARGE).
  6. Plan-implied file missing from Affected files → `PLAN-TRACED` (LARGE).
  7. Unrelated cleanup and whole-file reformat.
  8. A material deviation needed → planning.
  9. `NO_PROGRESS` → directed round.
  10. A protected test edited → `CONTROLLED_PATH_CHANGED`.
  11. One repository blocked, the other GREEN.
  12. An envelope hunk not covered by its justification.
  13. A pre-existing full-suite failure (D3).
  14. A fix round adding an unrelated path.
  15. A `NOT_VERIFIED` clause left unimplemented vs implemented.
  16. A working-tree-only file producing GREEN.
  17. A `ROLLOUT` obligation (LARGE).
  18. A SMALL compact run (SMALL).

## 22. Open owner decisions that genuinely need input

- **D1 — Bounded GREEN iteration with one new conditional STOP, `IMPLEMENTATION_BLOCKED`** (reasons `NO_PROGRESS` / `MATERIAL_DEVIATION` / `CONTROLLED_PATH_CHANGED`; options: one directed round, send back to planning, abort). Budget: six iterations per repository per invocation, and two consecutive iterations without progress. The numbers are starting values to measure.
  - **Recommended: ACCEPT.**
  - Alternative (b): no new STOP — hand a non-GREEN state to the Verifier and let `VERIFIER_FAIL_LIMIT` absorb it. This wastes full-suite runs, mislabels "cannot implement" as "verification failed", and has no route for a material deviation.
  - Alternative (c): the status quo, an unbounded loop.
- **D2 — A changed controlled path is never an automatic fix round.** It routes to `IMPLEMENTATION_BLOCKED (CONTROLLED_PATH_CHANGED)`; the human may authorize a restoration round, or restore it themselves on the branch (recorded like T13), or abort.
  - **Recommended: ACCEPT.**
  - Alternative (b): an automatic restoration fix round, disclosed at G4.
  - Alternative (c): the status quo, where the remedy is unreachable and fix rounds burn until `VERIFIER_FAIL_LIMIT`.
- **D3 — Pre-existing full-suite failures.**
  - **Recommended (a):** Developer's pre-edit suite baseline at the anchor. A failing identity that is identical at the baseline and is not a contract identity, not a relied-on identity, and not in a file the diff touches is `PRE-EXISTING`. PASS is allowed with it listed under Disclosures and shown at G4. Without a baseline record, no failure can be PRE-EXISTING.
  - (b) The same classification, plus a conditional STOP for explicit human acceptance (an authorized exception) before PASS.
  - (c) Always FAIL.
- **D4 — Example placement.**
  - **Recommended (a):** extend `PAYMENTS-12345-testing/` and `PAYMENTS-12410/` in place through stage 7. The Phase 3 tag keeps the stage-5b versions, and each README links them (the Phase 3 D5 precedent).
  - (b) A new `PAYMENTS-12345-implementation/` directory copying about 1,400 lines of Phase 2/3 artifacts.

Confirmed owner defaults, no decision needed unless you disagree: no new agent; no new routine gate; strengthen the Verifier first (§10.1); Sonnet 5 stays on every role.

## 23. Risks of the Phase 4 design itself

- **Verifier scope creep.** Mitigation: the anchoring rule, NOTEs never FAIL, and an explicit out-of-scope list in the skill.
- **False FAILs from hunk-level scope spend fix rounds.** Mitigation: the `PLAN-TRACED`, consequential-edit, and enabling-refactoring declaration routes; a cheap remedy (remove or declare); the false-FAIL rate becomes a benchmark observation.
- **`PLAN-TRACED` as a loophole.** Mitigation: it requires a specific trace plus necessity, the Verifier judges it, and an undeclared trace is `UNRELATED`. The traced paths also reveal plan-inventory quality for Phase 2 comparison.
- **Same-model Developer/Verifier blind spots.** Independence is procedural only: obligations are derived before claims are read, and the Developer's self-checks are never trusted. The model-diversity path is documented.
- **The iteration numbers are arbitrary.** The no-progress rule is the primary control; the ceiling is a backstop, stated as tunable (D1).
- **IMPLEMENTATION.md bloat.** Mitigation: one-line entries, collapse rules, a soft SMALL target, and the SMALL example as the yardstick.
- **More Manual-mode runner prompts** (post-commit run, handoff full suite, optional baseline). Bounded by the ceiling; they buy the removal of Verifier-found regressions.
- **The work-in-progress commit on BLOCKED** leaves non-GREEN commits on a local feature branch. It is never pushed without a PASS plus G4; it is labelled in Commits; it is removed by forward edits if the approach changes.
- **The PRE-EXISTING rule could excuse a regression.** Mitigation: identity plus locus match, exclusions for contract, relied-on, and touched identities, a baseline taken before any edit, and G4 disclosure. It remains model-produced evidence (the accepted procedural limitation).
- **New public-surface detection and obligation checks rely on the model reading the diff.** Stated honestly; the fictional example demonstrates the method, not its reliability.
- **Scope of P4-C1.** It touches seven operating files plus one new skill, comparable to P3-C1, which needed a targeted correction. Mitigation: acceptance (a)–(f) as mechanical checks, and a line-by-line settings match.

## 24. Expected reuse value for our internal pipeline

The following are portable independent of Copilot and of this repository's roles. Each becomes a concrete comparison question:
- the **GREEN definition** (committed state, exact command, identity tally, relied-on, handoff full suite) and the **four contract-gaming patterns**;
- the **iteration unit, progress rule, and budget**, with the **failure-classification routing table**;
- the **path classes including `PLAN-TRACED`** and **hunk-level scope**;
- the **deviation classes** with the one-line materiality test ("contradicts or changes an approved element");
- the **refactoring rule** and "refactor under RED";
- the **Obligations map ↔ Obligation check** pair and the **anchored-FAIL rule** (the direct answer to "tests passed but the implementation is wrong");
- the **finding shape with required outcome and fix scope**, fix-round scope bounds, and prior-finding closure;
- **no partial handoff**, with per-repository verdicts;
- the **could-not-verify table**, including the PRE-EXISTING rule.

Examples of the comparison questions:
- "Can an internal-pipeline implementer hard-code a value a developer constraint forbade, with every test passing, and still be verified?"
- "Does its verifier distinguish a plan-implied file from an unrelated one?"
- "Does anything bound the implementer's retry loop?"

## 25. Recommendation

**PROCEED_WITH_OWNER_DECISIONS** (D1–D4).

On approval, ChatGPT reviews this proposal. The approved form then becomes `docs/specs/2026-09-11-phase-4-implementation-quality-contract.md`, and P4-C1 is delegated to Sonnet 5 (`model: "sonnet"`, with its `claude-sonnet-5` self-identification recorded) with the contract, the locked baselines, and §21's acceptance criteria.

Until then:
- nothing is implemented;
- this proposal stays an untracked draft, and nothing is committed, pushed, or tagged;
- all three reference tags stay where they are;
- no Phase 5 work begins.
