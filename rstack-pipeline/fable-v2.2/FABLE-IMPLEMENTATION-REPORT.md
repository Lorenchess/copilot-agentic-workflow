# Fable implementation report — round 2.2 on rstack-v2.1

Date: 2026-09-17. Baseline: `../rstack-v2.1` (32 files). Candidate: this folder, created as a byte-identical copy of the baseline and then edited. Status: **awaiting independent review; not workplace-ready.**

Nothing was executed. Every correction below is contract text. No runtime script, lock format, host capability, interface or execution evidence was created or assumed. No `AGENTS.md` or `CLAUDE.md` exists anywhere in the workspace, so no repository instruction file applied beyond the task brief. The 44 photographs are not on disk here; `SOURCE-EVIDENCE.md` is their only available record, and E-numbers below cite it, not the images.

## Method

1. Read README, CHANGES, SOURCE-EVIDENCE, RUNTIME-PATCH-PLAN, WORKPLACE-PORT, OPEN-DECISIONS, VALIDATION-PLAN and all 25 operational files in full.
2. Traced one run by reading: preflight → plan → audit → revised plan → re-audit → red/lock → implement → working-tree verify → freeze → candidate verify → review → release evaluation → publication. At each step asked: what result token is returned, who writes which path, what the next state is, and which field decides it.
3. Changed only where that trace found a missing, contradictory or unimplementable instruction. Where a correction needed unavailable source, marked it SOURCE-BLOCKED and continued.

Status vocabulary: **IMPLEMENTED CONTRACT** (prose contract changed; nothing enforces or has exercised it) · **IMPLEMENTED RUNTIME** (none in this round) · **SOURCE-BLOCKED** · **DECISION-PENDING** · **NOT NEEDED**.

Line references are to files in this folder (`fable-v2.2`), after the edit.

---

## Findings and corrections

### V22-01 — No result token for state 4 or for blocked outcomes; routes missing

- **Source.** v2.1 `pipeline/SKILL.md` states table: state 4 listed no result, states 2 and F said "or named blocker"; `handoff-contracts.md` envelope required `Result: <state result>`. Routing had no row for `RELEASE_BLOCKED`, for a stopped role, or for a working-tree run whose locked checks failed. The handoff said state-4 outcomes "also appear" in the test report, but the envelope had no fields for them.
- **Before.** The tester had nothing to put in `Result:`; the orchestrator was told to route on "complete and locked tests passed", a phrase no field carried; a blocked release had no next step.
- **After.** `VERIFY_RECORDED` (execution completed with known outcomes, including failing ones) and a generic `STOPPED` with an owned blocker (reusing the developer's existing token). State 4 adds four separate envelope lines: Execution, Locked checks, Suite, AC readiness. Routing keys on those lines. Rows added for working-tree locked failure, `RELEASE_BLOCKED`, any `STOPPED`. A closed token list makes anything else a malformed handoff. Tokens are declared role results, never gate verdicts.
- **Why.** A dispatcher that may not interpret prose needs a field for every branch. Keeping a complete failing suite (`VERIFY_RECORDED`, Suite FAILED) apart from an unresolved execution (`STOPPED`) preserves the v2.1 rule that a complete suite failure is not an unknown execution.
- **Files.** `pipeline/SKILL.md` 36, 38–39, 49–50, 62–63, 73–74; `references/handoff-contracts.md` 54–64; `agents/rstack-orchestrator.agent.md` 21; `agents/rstack-tester.agent.md` 56, 68; `agents/rstack-planner.agent.md` 90, 106; `agents/rstack-dev.agent.md` 61, 65.
- **Maps to.** E06 (gate states stay distinct from execution status and predicates). No R-item.
- **Status.** IMPLEMENTED CONTRACT.

### V22-02 — "Every role returns an envelope" versus fresh-role replies persisted verbatim as artifacts

- **Source.** v2.1 handoff: envelope "returned by every role". v2.1 auditor: "Your reply is persisted verbatim as `plan-audit.md` … end with `Wrote nothing.`". Reviewer likewise. Five of seven agent files never mentioned the envelope, although CHANGES said result transport had been made explicit for the developer.
- **Before.** An auditor following its own file returned no envelope; one following the handoff produced a reply that no longer matched the artifact schema. The orchestrator would have had to cut or synthesize, which it is forbidden to do.
- **After.** Every agent's reply begins with the envelope. For 1b and 5 the reply is envelope block + artifact body; Result must equal the body's verdict; Artifacts is None; a mismatch is malformed and needs a new invocation. Persistence is verbatim with only the Persisted-by line added; the complete reply is always kept in `logs/results/<N>.md`. State 0 is the orchestrator's own and is recorded by its run-log row.
- **Why.** Removes the only place where the driver would have had to edit an independent verdict.
- **SOURCE-BLOCKED part.** Whether the real audit-response checker and metrics reader accept a leading block in `plan-audit.md` / `review.md` is unknown. The contract names the fallback (persist body only, byte for byte) and leaves the choice to whoever reads the parsers (OD-15, R7 addendum).
- **Files.** `references/handoff-contracts.md` 41, 65; `agents/rstack-plan-auditor.agent.md` 70, 75; `agents/rstack-reviewer-architect.agent.md` 37; `agents/rstack-orchestrator.agent.md` 21, 29; `agents/rstack-approval.agent.md` 17.
- **Maps to.** R7.
- **Status.** IMPLEMENTED CONTRACT; persisted layout SOURCE-BLOCKED.

### V22-03 — Nobody named as evaluator of `REVIEW_ELIGIBLE`; "current audit" undefined

- **Source.** v2.1 skill defines the predicate; the orchestrator file says it is "not an evidence adjudicator"; approval evaluates release only; the tester may not route.
- **After.** A **Who evaluates** paragraph: the orchestrator evaluates review eligibility by comparing recorded fields and artifact presence, never by judging evidence; the reviewer independently returns `INPUT_BLOCKED`; approval alone evaluates release predicates and re-derives digests. All three are stated to be agent-performed prose contract. "Current" audit is defined as naming the same plan revision as `plan.md` and `candidate.md`.
- **Files.** `pipeline/SKILL.md` 124, 129; `agents/rstack-orchestrator.agent.md` 23.
- **Maps to.** E05/E06 (script output is not the predicate).
- **Status.** IMPLEMENTED CONTRACT. Residual risk recorded as OD-19: the audit is bound to the plan by revision number, not digest.

### V22-04 — Scoped-review option: "materially different evidence" contradicts digest-bound freshness; return route missing

- **Source.** v2.1 skill line 73 ("new or materially different evidence … invalidates") versus its Freshness section and approval line 35 (packet bound by digest; "a changed packet needs a new review"). Routing said "5 CLEAN → 6, or full candidate verification first" with no row back to review.
- **After.** Staleness is decided by digest comparison only. The option is written out as scoped verification → diagnostic review → full verification → **new review of the full packet** → release, with explicit routing rows, and the text says plainly that it costs two reviews.
- **Why.** "Material" is a judgement no role is allowed to make for routing; and a release predicate that requires a review naming the exact packet can never be met by a review of the scoped packet.
- **Files.** `pipeline/SKILL.md` 67–68, 81.
- **Maps to.** OD-7 stays open; this does not choose whether the option is adopted.
- **Status.** IMPLEMENTED CONTRACT.

### V22-05 — Candidate failures both "go to their owner" and "reach review"

- **Source.** v2.1 skill line 62 (review-eligible candidates go to 5 "including observed nonlocked failures") versus line 71 ("a candidate verification failure owned by production goes to dev…").
- **After.** Owner-first: a failure or missing proof owned by a role in this run goes to that role. Only failures this run does not own, or whose attribution is UNKNOWN, travel to review, disclosed with their attribution status. The tester must say UNKNOWN rather than guess, because the pictured gate does not attribute failures and a basename match is not attribution.
- **Why.** Without a rule the orchestrator had two valid next states. Owner-first is the reading that does not spend a review on a defect already known to be the run's own.
- **Files.** `pipeline/SKILL.md` 65–66, 79; `agents/rstack-tester.agent.md` 56.
- **Maps to.** E04, E07; R3, R6 (failure inventory and execution identity remain runtime gaps).
- **Status.** IMPLEMENTED CONTRACT, and flagged **DECISION-PENDING (OD-18)**: choosing between two v2.1 sentences is arguably policy. The alternative — diagnostic review first — is a one-row change.

### V22-06 — Approval record overwritten across modes; no archive names; reviewed packet had no immutable home

- **Source.** v2.1 approval: "Always write approval.md" under Release, while the handoff makes the same file carry the freeze commit decision. Handoff required snapshots "for every reviewed round" but named only audit archives. The tester wrote `evidence/review-packet.md` in place, so a second attempt replaced the bytes a review had cited.
- **After.** `approval.md` is append-only with numbered entries per dispatch. Archive names follow the existing audit convention: `review/review-round<N>.md`, `candidate-round<N>.md`. The packet is written inside `evidence/attempt-<N>/`, never edited, and copied byte-identically to the current path; reviews cite the attempt path and digest. The "pointer to the accepted attempt" is defined as the test report's Attempt field and the packet's Verification attempt line.
- **Files.** `references/handoff-contracts.md` 27–28, 33–37, 93, 222–224; `agents/rstack-approval.agent.md` 17, 39, 43; `agents/rstack-tester.agent.md` 54; `agents/rstack-reviewer-architect.agent.md` 16; `agents/rstack-orchestrator.agent.md` 29; `references/write-boundaries.md` 34, 37–38, 40.
- **Maps to.** E11; R5 (immutable attempt output; digests over every listed file).
- **Status.** IMPLEMENTED CONTRACT. Whether an existing capture helper owns the compatibility paths is SOURCE-BLOCKED (R5 addendum).

### V22-07 — Comparison packet had no path, and the no-shell reviewer was asked for things it cannot do

- **Source.** v2.1 reviewer: read/search tools only, yet "read source at the specified revisions" and "do not substitute the current working tree for candidate content". Approval was to provide "a way to read both versions" with no form or location.
- **After.** The comparison packet is plain files under `comparison/round-<N>/`: name/status list, full patch, base-version copies of every changed, deleted or renamed file, listed with digests in `candidate.md`. The reviewer reads changed content from it, may read unchanged context from the recorded execution checkout, and must state that checkout equality and all digests are as recorded by other roles. A packet without patch and base copies is `INPUT_BLOCKED`.
- **Files.** `references/handoff-contracts.md` 83, 87–88; `agents/rstack-approval.agent.md` 31–33; `agents/rstack-reviewer-architect.agent.md` 20–21.
- **Maps to.** E11.
- **Status.** IMPLEMENTED CONTRACT. File names inside the directory are left to approval; nothing consumes them mechanically.

### V22-08 — Freeze left untracked inputs in the execution checkout and could stash the run's own evidence

- **Source.** v2.1 skill: untracked source/configuration that can affect execution is excluded from candidate runs. v2.1 approval freeze step 5 described a stash but not untracked paths; a stash that includes untracked files would also take `.rstack/` if it is not ignored. The earlier reconstruction says artifact protection writes `.git/info/exclude`, but that script is unavailable. Separately, step 3 lets the human commit, and nothing compared that commit with the approved diff.
- **After.** Protection covers unrelated untracked non-ignored paths; before any untracked sweep, Git's own ignore check must show `.rstack/` excluded, otherwise stop; ignored dependencies stay and are declared; status afterwards must show only what `candidate.md` declares. Whoever commits, the resulting commit is compared with the approved diff.
- **Files.** `agents/rstack-approval.agent.md` 25, 27.
- **Maps to.** E08; R5. The ignore check is plain Git, not an invented script.
- **Status.** IMPLEMENTED CONTRACT. Real protect-artifacts behavior SOURCE-BLOCKED (R5 addendum).

### V22-09 — Restoring user work had no owner or timing when a run stops early

- **Source.** v2.1 approval step 7: restore "only after candidate-dependent activity ends or an explicit interruption recovery"; its reply section owes a restoration report. But freeze returns with the work still held, release might never be reached, the orchestrator has no Git lane, and no route mentioned it.
- **After.** Skill: a run never ends silently holding user work; at an early stop the orchestrator reports the protection identity and asks the human once — restore now or keep held; until answered it stays held. Restoring contaminates the execution checkout, so a resumed run must re-protect and re-establish the basis. Approval: restoration is the last act of release mode whatever the result (new step 11); a recovery-only dispatch performs just that step and returns `STOPPED` carrying the run's original blocker. Approvals reference lists it among actions needing the user's explicit answer.
- **Files.** `pipeline/SKILL.md` 75, 115–116, 181; `agents/rstack-approval.agent.md` 29, 56, 62; `agents/rstack-orchestrator.agent.md` 41; `references/approvals.md` 23.
- **Maps to.** R5 ("approval must not restore unrelated work into the execution checkout before candidate verification/review end").
- **Status.** IMPLEMENTED CONTRACT for ownership and reporting; the default on a stop is **DECISION-PENDING (OD-14)**. No new state or mode was added; the recovery dispatch reuses an existing mode and token.

### V22-10 — Publication intent was not required to precede the action

- **Source.** v2.1 approval step 10 and the approvals reference: "record intent and result" with no order. If the session ends mid-action nothing shows an attempt was made.
- **After.** Intent is written before the attempt, result after; an intent without a result *is* the marker of an unknown outcome. For a push, reconciliation reads the named remote ref and compares it with the candidate commit before any retry.
- **Files.** `agents/rstack-approval.agent.md` 54; `references/approvals.md` 41; `references/handoff-contracts.md` 224.
- **Status.** IMPLEMENTED CONTRACT.

### V22-11 — The separate clean-checkout route cannot be specified from available source

- **Source.** v2.1 skill offered "a separately prepared clean checkout of the same active repository". SOURCE-EVIDENCE B1.10 and the harness map show the gate resolving root and HEAD itself with no root option; E01/R4 show the AC checker resolving artifacts from the repository root; run evidence lives in the active repository's `.rstack/`.
- **After.** The route is kept as an idea but marked SOURCE-BLOCKED in the skill and approval file, with the exact missing facts named; only the in-place route is specified; agents are told not to improvise root or path arguments.
- **Files.** `pipeline/SKILL.md` 103–104; `agents/rstack-approval.agent.md` 33; `references/harness-map.md` 55.
- **Maps to.** E01, E08; R4, R5.
- **Status.** SOURCE-BLOCKED (OD-16).

### V22-12 — Host-delivery assumptions that contradicted the candidate's own rules

- **Source.** v2.1 tester: commands "must be resolved from the adopted installation, not from a guessed plugin environment variable"; estate template: do not rely on the variable surviving between calls. Yet the auditor, developer, estate-layout and discovery-cost files still showed `node "$CLAUDE_PLUGIN_ROOT"/…`. `learnings.md` said fresh roles "ignore it if sent", contradicting the contamination rule in the skill, auditor and reviewer. The estate template's header comment named the process instructions as owner of process rules, while v2.1 made the standing rules the universal owner. The auditor's return still asked for "anything you were sent that you ignored".
- **After.** Commands use a `<pipeline-scripts>` placeholder with one sentence on resolving it; learnings and auditor wording match the contamination rule; the template comment names the right owners and says its `.github` paths are the reconstructed layout to confirm.
- **Files.** `agents/rstack-plan-auditor.agent.md` 33, 36–37, 75; `agents/rstack-dev.agent.md` 29, 32–33; `references/estate-layout.md` 32, 34–35; `references/discovery-cost.md` 53–54, 56–57; `references/learnings.md` 29; `references/estate-instructions.template.md` 9–11.
- **Maps to.** R7.
- **Status.** IMPLEMENTED CONTRACT. The actual script location stays an adoption fact.

### V22-13 — Tester steps did not say which apply at WORKTREE

- **Source.** v2.1 tester steps 7, 8 and 12 assume a candidate; the handoff says working-tree feedback stays in the test report; nothing said the gate output at WORKTREE is expected to fail on seeded matrices.
- **After.** One sentence ahead of the step list: steps 7, 8 and 12 are candidate-only; at WORKTREE `ac.tsv` is not written, there is no packet, and gate output is diagnostic.
- **Files.** `agents/rstack-tester.agent.md` 41–42; `references/handoff-contracts.md` 93.
- **Maps to.** E01, E02; R4. Keeps WORKTREE out of the sha column and keeps seeded rows failing the CLI honestly.
- **Status.** IMPLEMENTED CONTRACT.

### V22-14 — Gate exception gaps were stated partially and in several places

- **Source.** v2.1 skill named failure coverage and unaccepted observations but not scope/provenance on a waived red suite (R1) nor `waived_at_sha` (R3); tester and approval each mentioned a different subset.
- **After.** One four-row table in the harness map (owner of script limits) with evidence and patch ids; the skill names all four and points to it; it restates that a waived red suite remains failed and that HELD is never a pending execution.
- **Files.** `references/harness-map.md` 40–50; `pipeline/SKILL.md` 150.
- **Maps to.** E03, E04, E05, E07; R1, R2, R3, R6.
- **Status.** Contract IMPLEMENTED; all four runtime fixes remain **SOURCE-BLOCKED** and unapplied. The exception route stays disabled (OD-8).

### V22-15 — Review readiness versus permission to publish, stated in the authorization owner

- **Source.** The distinction was in the reviewer file and skill but not in `approvals.md`, which owns authorization.
- **After.** One sentence: CLEAN, `REVIEW_ELIGIBLE` and `RELEASE_ELIGIBLE` are statements about evidence; none is permission to publish.
- **Files.** `references/approvals.md` 23.
- **Maps to.** E02, E05.
- **Status.** IMPLEMENTED CONTRACT.

---

## Reviewed and left unchanged — NOT NEEDED

| Area | Why no edit |
|---|---|
| AC header `ac_id, criterion, check, artifact, ladder, verdict, sha, note`; full real SHA; no WORKTREE in sha | Consistent across skill, planner, tester, approval, handoff (E01, R4) |
| Below-L4 `waiver:` note does not make the AC CLI succeed | Stated in skill, handoff, approval, approvals (E02) |
| Gate PASS/BLOCKED/HELD, `checksVerdict`, JSON fields, exit 0/1/2 | Harness map and orchestrator agree (E06, R2 preserve clause) |
| HELD is not pending or lost execution | Skill, tester, harness map agree |
| Waived red suite remains failed | Handoff, tester, skill agree |
| Matching tree markers do not prove committed-candidate execution | Skill, handoff, write boundaries, estate layout agree (E08) |
| OTel NO_CLAIM is not agreement | Skill, harness map, reviewer agree (E09) |
| Standing rules, session reminder, process bootstrap | The three agree with each other and with the estate floor; each already says it cannot declare its own loading |
| Instruction precedence, plan interview, risk tiers, team adoption | No contradiction found with the run trace |
| estate-sweep and eval-skill | Match E12/E13; not on the run path |
| SOURCE-EVIDENCE, WORKPLACE-PORT | Evidence record and port guide; nothing in this round changes what the photographs show or the port order |

## SOURCE-BLOCKED items, with the exact missing dependency

| Item | Missing producer / consumer / behavior |
|---|---|
| Gate exception fixes R1–R3, execution identity R6 | Live `gate.mjs`, base-replay producer, lock `--paths` output, a runner-result adapter, and their fixtures |
| Persisted layout of fresh-role replies | audit-response checker and pipeline-metrics reader: what they parse in `plan-audit.md`, round archives and `review.md` |
| Separate clean-checkout route | Root, HEAD and artifact-path resolution in gate, ac-check, lock tool and `role-guard --tree-digest` |
| `.rstack/` protection before an untracked sweep | protect-artifacts source and the effective ignore state in a real workplace repository |
| Whether NO_CLAIM is an `inferred` item | Real gate JSON with OTel absent (affects the normal-release rule on observation gaps; OD-17) |
| Attempt directories versus an existing capture writer | Whether any real helper owns `evidence/suite.txt` |
| Lock identity in `candidate.md` | Real lock storage, amendment behavior and any native revision id (unchanged from v2.1) |
| Audit bound to plan by digest | A place for the digest the real response checker accepts (OD-19) |

## Static checks actually performed

All by reading or by hashing and string comparison; none executes pipeline code.

1. Baseline copy verified identical to `rstack-v2.1` by SHA-256 before editing (32/32).
2. After editing, all 105 files that existed under `rstack-pipeline/` before this round re-hashed and matched.
3. Direct file comparison of v2.1 and v2.2 (Git ignores this directory): changed, unchanged and added sets listed in the manifest.
4. Local Markdown links resolve; fenced blocks balanced.
5. Every role-result token used in operational files is in the handoff token list.
6. Eleven photographed interface strings are byte-identical in both handoff versions; gate exit codes and JSON field list unchanged in the harness map.
7. No plugin-variable command and none of the two removed phrases remain in operational files.
8. One end-to-end run re-read after the edits for a defined result, writer, path and next state at every step.

## Validation not run

Builds, lint, tests, browser automation, agent or skill evaluations, any rstack script (`gate.mjs`, `ac-check.mjs`, guards, lock, replay), host loading of any instruction file, tool-grant or isolation observation, Git operations of the freeze procedure on a real repository, any publication or remote read. No behavioral benefit is measured. `VALIDATION-PLAN.md` lists the workplace checks these corrections now call for.

## Remaining risks and questions for the independent reviewer

1. **V22-05 is a choice.** Is owner-first the intended reading, or should an in-run failure get a diagnostic review before returning to its owner (OD-18)?
2. **Two new tokens.** `VERIFY_RECORDED` and generic `STOPPED` are the smallest vocabulary I could find that gives every branch a field. Are they acceptable, or should state 4 route on the four outcome lines alone with no token?
3. **`AC readiness: READY | NOT_READY | NOT_EVALUATED`** is new wording for a line v2.1 asked for without values. It is a report of the AC CLI outcome, not a parser field; confirm it cannot be mistaken for one.
4. **Recovery-only dispatch of approval** reuses a mode and returns `STOPPED` with the original blocker. It adds no state, but it is a third way approval can be invoked. Is that within "no new workflow states", or should recovery be left entirely to the human with the recorded identity?
5. **Comparison packet copies source text into `.rstack/`.** That is private run storage, but it widens what retention and redaction policy must cover.
6. **Envelope at the top of persisted audit and review files** may break a parser nobody here can read. The fallback is written down; the decision is not made.
7. **Audit-to-plan binding is by revision number** (OD-19). A plan edited without a bump defeats "current audit". Not fixed, because a digest field needs a consumer I cannot inspect.
8. **Gate output at release** (OD-20): v2.1's ambiguity about re-running the gate was left as found.
9. **Normal release and NO_CLAIM** (OD-17): if the gate reports NO_CLAIM as an inferred item, "no accepted or unaccepted observation gaps" makes normal release unreachable without OTel. Left as written pending real JSON.
10. **Annotated dated text.** In `VALIDATION-PLAN.md` the v2.1 line "Static inspection completed on 2026-09-17:" gained a parenthetical saying its counts describe the v2.1 task; in `CHANGES.md` two v2.1 headings were demoted one level under a new v2.1-record heading. The wording of the earlier findings is otherwise untouched; the manifest shows the exact diff size.
11. **Text growth.** The 25 operational files grew from 134,789 to 152,325 characters (+17,536, about 13%). Every addition traces to a finding above, but this round made the candidate longer, not shorter; the skill, handoff contract and approval file carry most of it. A reviewer may judge some sentences redundant between the skill and the agents, or movable to the handoff contract. No context-cost effect is measured.
