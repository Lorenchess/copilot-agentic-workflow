# Claude V2 — changelog

Changes relative to the ChatGPT proposed set (the editing baseline), organised by concern. "Restored" means the reconstructed original had it and the proposal dropped it. "ChatGPT Cn / ADR-n" refers to `RSTACK-V2-ARCHITECTURE-REVIEW.md` §3 and `RSTACK-V2-DECISIONS.md`.

ChatGPT's recommendations were sorted first: **A** applies only to the Copilot reference (not adopted: nine roles, 12-artifact `.pipeline/` set, multi-writable repositories, G1–G4 gates, local commits by tester/dev, strict no-waiver release, deleting learnings outright); **B** exposes a defect in the proposed rstack files (adopted: C6–C9, C12); **C** general principle (adopted: one owner per rule, candidate identity, honest enforcement vocabulary, provenance inheritance, no framework-for-prose).

## Rule ownership

- One owner per concern, listed in `CLAUDE-V2-RULE-OWNERSHIP.md`; five deliberate short duplications are named there, everything else found twice is a defect.
- `SKILL.md` no longer restates lanes, schemas, the learnings format, the external-action list or the tester's manual. The proposal said "do not restate the boundary matrix" and then restated it.
- Agents carry a one-paragraph lane and point to `write-boundaries.md`; artifact templates exist only in `handoff-contracts.md`.
- `harness-map.md` owns the four-term guarantee vocabulary and nothing else of substance.
- Removed the reviewer's notes left inside runtime references ("What I would change", "This fixes stale wording…", "Key corrections", "Why this template is short").

## Orchestration

- Orchestrator reduced to a dispatcher: state, paths, recorded result, next role, loop count, human decision points. It no longer builds the auditor's per-claim brief (that paraphrased engineering content), runs change-budget, passes tier raises as prose to the reviewer, or writes learnings.
- **Planner no longer dispatches or briefs its own auditor** (ChatGPT C8; the conflict was already in the original). Planner writes `## Claims for audit` inside `plan.md` and returns; the orchestrator alone dispatches; the planner sees findings only on a revision turn (state 1r). `agents:` and all chat handoffs removed from the planner.
- Added the missing routing rows: every auditor verdict, the 1b↔1r loop, state F, malformed handoff.
- Fixed the **scoped-gate deadlock** inherited from the original and copied by the proposal (scoped never passes → only a pass reaches review → full run only after approval → approval needs a clean review).
- Convergence rule applies to every loop and keys on blocker identity; the proposal's "with no new evidence" loophole removed. Restored: "report and stop when the human is unavailable", "say a result is wrong and leave it blocked", "lead with what is not proven even when empty".
- Restored `runSubagent` and `todos` in tool lists the proposal had dropped.

## Candidate identity

- New: one candidate = repository + commit/tree + plan revision + test-lock revision + proof configuration, recorded in `candidate.md` (ChatGPT C7, ADR-04).
- Flow reordered from `review → integrate → full re-test → approval` to `verify(worktree) → freeze (commit + integrate) → verify at candidate → review at candidate → release`. Integration now happens **before** the evidence and the review that must describe it.
- One freshness rule: a changed candidate stales verification, review **and** publication authorization. Re-running tests never revives a review; nobody re-stamps a SHA.
- **Self-referential SHA removed**: `ac.tsv` is no longer committed, and no evidence file enters the candidate. Neither the original nor the proposal closed that regress. The PR verification table is the durable record.
- Commit message no longer claims "Verified… Reviewed…" — at freeze neither is true yet.
- Late default-branch movement: overlap → human decision → new candidate → verification **and** review again.

## Evidence

- Two predicates replace the overloaded `PASS/BLOCKED`: `REVIEW_ELIGIBLE` and `RELEASE_ELIGIBLE` (ChatGPT C6, ADR-06). Scoped evidence can make a candidate reviewable; it never makes it releasable.
- Restored the L4 bar ("VERIFIED at L4 or better, per `prove-it`") where the proposal wrote an undefined "required rung / configured proof bar"; `prove-it` named as owner again.
- `WORKTREE` evidence is dev feedback only and is never cited for eligibility.
- Transcribed artifacts carry `Persisted-by:` so a model-scribed verdict is labelled as such.
- The proposal's invented "canonical suite-capture wrapper" removed; required capture fields stated; dependency marked.

## Testing

- Test/production split stated as the two invariants everything else serves; unchanged in strength.
- Lock amendment and waivers: tester **requests**, a human decides, a different role records; `--authorised-by` described as typed text. Restored: post-amendment drift fails; no amendment licenses a skip; never hand a green run to the lock; verification-only tickets still go to review; new symbols reached through a compiling representation; test report written whenever anything fails; "never modify a validator".
- Shell capture choreography (bash/PowerShell marker snippets) moved out of the prompt; the invariants that matter kept as required fields.
- Tester no longer runs the gate or routes the run; it reports one result line with one owner per failure.
- Reviewer's test-adequacy obligation made explicit and primary; pre-implementation Test Challenge evaluated and left to the owner (OD-1).

## Review

- Review binds to the named candidate and cannot be carried to a later one; `## Candidate` added to the schema.
- Fresh-role allowlist owned once in `SKILL.md`; no handoff reaches a fresh role; reviewer told it cannot verify the changed-path list against git and must say so.
- Restored: three-case wording for a vacuous check; "quote the assertion"; missing `impact.md` ⇒ plan blast-radius claims are L1 (the proposal's "blocking input failure" had no verdict and was unreachable); narrow impact scope and false sibling contracts are `critical`; reviewer's own pass/fail reading is L2; more than five `Act on` means not filtering; cite by quoting.
- Auditor: restored the core falsifiability test, "at least three load-bearing citations", "label every claim tested", conclusion-vs-sentence rule, status codes, and schema-conformant headings (the proposal's `###` sections broke the contract it is persisted under).

## Approval

- Split into two explicit modes, `freeze` and `release`; no longer engineer, tester, reviewer or evidence adjudicator (`evidence-auditor` dropped, OD-9).
- A waiver or accepted rung yields `RELEASE_BLOCKED proceedable`, requires the human, still requires a `CLEAN` review at the same candidate, and is never reported as a pass. The proposal routed proceedable results straight to approval with no path through review.
- Release re-checks HEAD against the candidate before **each** external action and pushes the candidate SHA explicitly.
- Fixed the stash defect (proposal stashed only "unrelated work" with no pop while the ticket change was uncommitted): commit first, stash what remains, merge, pop, report.
- Restored: refuse without `review.md`; open one artifact per AC; never clear an estate mismatch by re-pinning; state the PR target out loud; let the human act themselves; waivers named in both PR sections.
- Authorization model rewritten around REQUEST / HUMAN AUTHORIZATION / RECORDED DECISION with the authentication limit stated (ChatGPT #6, ADR-05). Restored the original's "what counts as an answer" table.
- Terminal template: `git commit`, `git pull`, `git -c/--git-dir` forms and `gh pr create|merge` now ask; merge auto-approval narrowed to the exact integration shape; three unanchored regexes anchored; `npx <pkg> test` executor form removed. Marked as reconstructed — validate before installing.

## Repositories

- Kept one writable active repo + readable siblings + one run per repository, with the reason stated (candidate identity binds to one commit namespace). ChatGPT's multi-writable model was **not** imported (it is an A-class recommendation).
- Simplified: contract depends only on pin, verify and a recorded human decision before re-pinning. The repin ledger, `--pin --writable` and sibling dirty-path tracking are left inside the tool.
- Restored: auditor runs `--verify`; "say which criteria this run does not cover"; two candidates is a question.
- Resolved the timing contradiction: pin in state 1 after the active repo is settled and before any write outside `.rstack/`.
- Estate template: removed the false "always-loaded" claim about the references copy; restored a three-line safety floor and "same tier, does not outrank".

## Memory

- `learnings.md` is EXPERIMENTAL and off by default; human-curated; no role has a write lane; re-check before use; never evidence; never reaches a fresh role (ChatGPT ADR-12). Removed from preflight and from the orchestrator's duties.

## Risk / depth

- Depth only; no tier, budget or instruction removes a state. Restored: ratchets up, needs nobody's agreement, any one signal suffices. Removed the proposal's downward bias ("known to apply").
- Size no longer raises the tier; affected-surfaces line made mandatory; scalar-vs-surfaces tradeoff documented (OD-2). No numeric scoring.

## Metrics / provenance

- Provenance is inherited through derivation (ChatGPT C9, ADR-13): everything computed from the orchestrator's run log is `AGENT_REPORTED`. `loopTurns`, `firstPassPhase4`, `wallMinutes`, `acsMappedToTests` relabelled.
- "A citation proves an entry was read" corrected: it does not.
- Added one measure — vacuous or missing checks found at review — as the input to OD-1.

## Instruction precedence

- Process instructions no longer claim "these rules win" (ChatGPT C12). The precedence file now states the circularity plainly: guards run because an instruction said so, so they are not a layer beneath the prose; what survives an unloaded file is withheld tools, host ask-rules and the human.

## Deliberately not carried over

Historical incident narratives; shell snippets for capture; the full `docs` protocol (left to the `docs` skill, OD-11); `models.json` detail; principle numbers; the phase-0 verifier-offer wording; `build_loc` parser detail. None is a safety invariant; each is listed in the manifest where it was dropped.
