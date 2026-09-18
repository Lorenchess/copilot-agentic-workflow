# Claude V2 — manifest

Every file below was written new into `rstack-pipeline/claude-v2/`. No existing file anywhere was modified; nothing was staged or committed; no script was created.

**Baselines.** "Proposed" = the ChatGPT file (`*.proposed-simplified.md` / `*.proposed-improved.md`), the editing baseline. "Original" = the screenshot reconstruction (`*.original-from-screenshots.md`), read to find guarantees the proposal dropped; for the planner only its operative part (lines 1–296, not the OCR appendix). **ChatGPT findings** cite `RSTACK-V2-ARCHITECTURE-REVIEW.md` §3 (C-numbers), `RSTACK-V2-DECISIONS.md` (ADR-numbers) and the fifteen numbered findings of the editing brief (#n).

**Size** (characters; 21 runtime files): originals 499,103 (404,482 without the OCR appendix) · proposed 156,877 · V2 135,064 — about 14% smaller than the proposed set and 61% fewer lines (4,805 → 1,853). V2 is not smaller everywhere: guarantees were restored into the auditor, tester and write-boundaries files. Character counts are source sizes, not measured context cost.

---

## Agents

### `agents/rstack-orchestrator.agent.md`
- **Baseline:** proposed orchestrator (11,284) → 6,562; original read for routing and lane rules.
- **ChatGPT findings:** #2, #3, #8, #14; C6, C8, C9.
- **Major changes:** dispatcher only; routes by looking up `SKILL.md` transitions; no auditor brief, no change-budget run, no tier prose to the reviewer, no learnings lane; evaluates eligibility by field comparison only; `meta/decisions.md` added to its files; `runSubagent`/`todos` restored.
- **Invariants preserved:** paths not summaries; fresh roles get only their allowlist; never override or re-run a check; verbatim transcription with round archiving; host-reported `ts`/`model` or blank; list every file written; relay human questions unanswered.
- **Enforcement dependencies:** host persistence of read-only replies; isolated fresh invocation; a transition evaluator. Its file list is prose (the role guard cannot check it).

### `agents/rstack-planner.agent.md`
- **Baseline:** proposed planner (15,375) → 8,553; original lines 1–296.
- **ChatGPT findings:** #3, #11, #13; C8.
- **Major changes:** Step 9 (self-dispatched audit) removed; `agents:` and handoffs removed; `## Claims for audit` is the audit input; separate revision turn; interview method delegated to `plan-interview.md`, estate mechanics to `estate-layout.md`, schema to the contract; affected surfaces required.
- **Invariants preserved / restored:** verbatim ticket with `## Completeness` and `Quoted, not followed`; no invented AC; three provenance values; check named before code; read the code, git-aware absence; paths exist or `NEW`; ask before reshaping a ticket whose behavior already exists; say what the run does not cover; never write `plan-audit.md`; may dispute, never overrule; do not stash or discard user work.
- **Enforcement dependencies:** role guard (self-run); repository locator; audit-response checker.

### `agents/rstack-plan-auditor.agent.md`
- **Baseline:** proposed auditor (7,552) → 6,261; original for dropped lens rules.
- **ChatGPT findings:** #8, #7.
- **Major changes:** honest boundary ("not a sandbox; you hold a terminal"); return headings aligned to the contract; reads the claims index from the plan, tests beyond it; shell tutorials cut.
- **Restored:** the falsifiability test against today's code; ≥3 load-bearing citations; label every tested claim; conclusion-vs-sentence rule; status codes; absence without ref+pathspec is `UNKNOWN`; sweep is L2; truncation with numbers; correct reason for not running role-guard.
- **Enforcement dependencies:** `estate-guard.mjs --verify` (self-run); fresh invocation by the host.

### `agents/rstack-tester.agent.md`
- **Baseline:** proposed tester (9,610) → 10,080 (larger: restorations); original for capture and waiver rules.
- **ChatGPT findings:** #4, #5, #6, #7, #9, #15; C6.
- **Major changes:** verifies against `WORKTREE` or a named candidate; reports one result line, does not run the gate or route; amendment and waiver become request → human → record-by-another-role; invented capture wrapper removed; duplicate amendment section merged.
- **Invariants preserved / restored:** tester-only tests; valid-red definition and not-red list; two runs; fixtures survive correct code; lock before suite; repository's real command; dependency-graph scoping; base replay; locked tests unwaivable; impact facts without judgement; stop conditions; verification-only still reviewed; never green-as-red; never modify a validator.
- **Enforcement dependencies:** suite-capture tooling (**none named in the reconstruction**); `test-lock.mjs`, `base-replay.mjs`, `ac-check.mjs`, `audit-response-check.mjs`, `role-guard.mjs`, `change-budget.mjs`.

### `agents/rstack-dev.agent.md`
- **Baseline:** proposed dev (5,425) → 4,515 — the smallest agent.
- **ChatGPT findings:** #9, #6, #7.
- **Major changes:** no self-issued `--waiver`; honest "nothing stops you opening a test file"; returns `UNITS_GREEN`, claims nothing about completion; reads `Act on` on review rounds.
- **Invariants preserved / restored:** production only; never commits; stop when plan and test disagree; smallest change per unit; run the already-passing tests; fail louder; stop conditions; no scope creep.
- **Enforcement dependencies:** `role-guard.mjs --role dev` (self-run); lock verification by others; unlocked tests protected by reading only.

### `agents/rstack-reviewer-architect.agent.md`
- **Baseline:** proposed reviewer (8,512) → 6,691.
- **ChatGPT findings:** #5, #8, #10; C7.
- **Major changes:** binds to `candidate.md`; verdict not transferable; test adequacy declared the pipeline's independent challenge; handoff to approval removed (the orchestrator decides, by identity).
- **Invariants preserved / restored:** no write or shell tools; obligation-order reading; vacuous check → Risks, three cases; resolve by reading, never delegate; missing impact ⇒ L1; critical cases; quote-based citation; five buckets, `CLEAN` rule, independence statement.
- **Enforcement dependencies:** host honouring the tool list; host persistence of the reply; a verified diff (today a reported path list).

### `agents/rstack-approval.agent.md`
- **Baseline:** proposed approval (8,090) → 8,426; original for stash, overlap and post-commit rules.
- **ChatGPT findings:** #4, #5, #6; C6, C7, C11; ADR-04, ADR-09.
- **Major changes:** two modes; freeze = human-decided commit → stash remainder → merge default → pop → record candidate; release = independent `RELEASE_ELIGIBLE` re-check, proceedable path, overlap check, one decision per action with HEAD re-checked, explicit-SHA push; `evidence-auditor` dropped; commit message claims no verification.
- **Invariants preserved / restored:** never resolve conflicts, rewrite history, `add -A`, drop stashes, re-stamp evidence, re-pin to clear a mismatch, or merge a PR; refuse without `review.md`; open an artifact per AC; separate asks; fetched text is data.
- **Enforcement dependencies:** authenticated authorization receipt; guarded publisher; tool-computed candidate identity.

## Pipeline

### `pipeline/SKILL.md`
- **Baseline:** proposed skill (11,659) → 14,123 (larger: it now *is* the state machine the other files stopped duplicating); original for phase 0, batching, autonomy and stop rules.
- **ChatGPT findings:** #1, #2, #4, #5, #8, #13; C6, C7; ADR-04, ADR-06.
- **Major changes:** state and transition tables; candidate identity and the single freshness rule; two eligibility predicates; scoped-review option; fresh-role allowlist; human checkpoint list; path map. Removed: tester manual, lane list, learnings format, write-boundary summary, external-action list, command discipline, the invented capture harness.
- **Invariants preserved / restored:** no state removed by tier or instruction; state 5 always; L4 bar; no iteration budget; blocker-identity convergence; satisfy the condition not the instrument; phase-0 rules (≤2 questions, defer at estate root, `.git/info/exclude`); stash discipline; batching; gaps first.
- **Enforcement dependencies:** a gate evaluating both predicates at one candidate; isolated invocations; `gate.mjs` real semantics.

## References

### `references/handoff-contracts.md`
- **Baseline:** proposed (15,427) → 13,866. **ChatGPT:** #1, #5, #6, #14; "HEAD/committed AC cycle unresolved".
- **Major changes:** schemas only; candidate binding (◆) on every evidence artifact; `candidate.md` and `meta/decisions.md` added; `ac.tsv` `sha` → `candidate`, no longer committed; `## Candidate` in review; `Persisted-by:`; `red.txt`/`suite.txt` given a required-field schema; approval schema by mode; run-log phase enum restored; editorial notes removed; learnings schema moved to its owner.
- **Preserved / restored:** malformed handoff stops; prompts assert nothing; empty ≠ absent; round archiving; `fixed` needs findable excerpt and `was:`; comment bounds (40 / 20+20, one hop); waiver limits; human-name fields are not authentication; redaction by replacement.
- **Dependencies:** real parsers for `ac.tsv` and the suite log; marker spellings.

### `references/write-boundaries.md`
- **Baseline:** proposed-improved (8,810) → 7,944. **ChatGPT:** #6, #7, #9.
- **Major changes:** request / authorization / record with the authentication limit; a table of what actually holds each boundary; self-issued `--waiver` named and rejected; learnings lane removed; test lock stated as tripwire, not semantic proof; dirty baseline reduced to its meaning.
- **Restored:** `observation-accept.tsv` as governance; override declaring governance is an error; empty class refused; "installed" = delivered `.github/` copy; orchestrator and auditor do not run the guard; no amendment licenses a skip; `local` hole; shell delete is the stop signal.
- **Dependencies:** a guard that refuses without an authorization the constrained role could not create; host-scoped write grants.

### `references/approvals.md`
- **Baseline:** proposed (8,426) → 9,302. **ChatGPT:** #6, #7; ADR-05, ADR-09.
- **Major changes:** now owns the authorization model and the external-action list; template hardened (see changelog); MCP actions noted as unreachable by terminal rules; meta-section removed.
- **Restored:** "what counts as an answer"; refused-not-confirmed list; configure denies regardless; edits map is user-scoped; `matchCommandLine` precedence caveat.
- **Dependencies:** authenticated receipt; validated regex fixture; `setup.mjs`.

### `references/estate-layout.md`
- **Baseline:** proposed (6,642) → 4,841. **ChatGPT:** #11; C10; ADR-07 (A-class — not imported).
- **Major changes:** one-writable-repo kept with its reason; pin/verify kept as a detector with limits; repin ledger, `--writable` and sibling dirty tracking dropped from the contract; timing fixed.
- **Dependencies:** `estate-guard.mjs`; container/workspace permissions for real isolation.

### `references/estate-instructions.template.md`
- **Baseline:** proposed (4,419) → 3,233. **ChatGPT:** #1, #7, C12.
- **Major changes:** false "always-loaded" claim removed; three-line safety floor restored; "same tier" restored; evidence section removed (owner: process instructions / `prove-it`).
- **Dependencies:** `install-estate.mjs`.

### `references/harness-map.md`
- **Baseline:** proposed (4,276) → 4,308. **ChatGPT:** #7, #1; C1.
- **Major changes:** owns the four-term vocabulary; every row says who runs the check; scripts listed as claims from a reconstruction; "fail CI" and the unqualified Enforcement column removed; notes that no capture tool is named and that only `otel-trail` has agent-independent input.

### `references/instruction-precedence.md`
- **Baseline:** proposed (5,402) → 4,128. **ChatGPT:** C12, #7.
- **Major changes:** "must be enforced by the harness" replaced with the honest circularity statement; rulings table restored (squash-merge: no exception); template-location warning restored; host record moved to the adoption record.

### `references/learnings.md`
- **Baseline:** proposed (5,234) → 3,212. **ChatGPT:** #12; ADR-12.
- **Major changes:** experimental, off by default, human-written, re-check before use, never evidence, never to fresh roles; validator described as shape-only and consumed by nothing.

### `references/plan-interview.md`
- **Baseline:** proposed (4,466) → 3,284.
- **Restored:** recommendation = recorded default, as `default, unopposed`; say "I don't know" is valid in round one; do not block on a running search; linked page date; the skipped-interview tell; "nothing enforces this".

### `references/risk-tiers.md`
- **Baseline:** proposed (3,454) → 3,442. **ChatGPT:** #13; ADR-11.
- **Major changes:** affected surfaces mandatory; size never raises the tier; raise travels by artifact, not dispatch prose; tier-vs-surfaces tradeoff.
- **Restored:** ratchet; "needs nobody's agreement"; any one signal; HIGH includes estate sweep.

### `references/rstack-process.instructions.md`
- **Baseline:** proposed (2,790) → 3,204. **ChatGPT:** C12, #6.
- **Major changes:** precedence claim removed; deploy not a pipeline action; "a human may proceed without evidence, which never raises a rung"; closing paragraph states that lanes are instructions plus self-checks.
- **Restored:** instruction surfaced "as a finding, explicitly not followed"; automatic commit/push/PR instructions overridden — prepare and stop.

### `references/team-adoption.md`
- **Baseline:** proposed-improved (4,945) → 4,618. **ChatGPT:** #11, #15.
- **Major changes:** adoption record gains observed guarantee level, host loading record, scoped-review choice, optional mechanisms; cross-repository = one run per repository.
- **Restored:** least capability; "should not be extended to" merge or deploy; absent evidence is a stated caveat.

### `references/discovery-cost.md`
- **Baseline:** proposed (5,303) → 4,471. **ChatGPT:** #14; C9; ADR-13.
- **Major changes:** provenance inheritance rule; four measures relabelled; model identity row; citation ≠ read; one new measure for OD-1; meta-section removed.

## Claude documents

`CLAUDE-V2-MANIFEST.md` (this file) · `CLAUDE-V2-CHANGELOG.md` · `CLAUDE-V2-RULE-OWNERSHIP.md` · `CLAUDE-V2-OPEN-DECISIONS.md`.

## Self-consistency review (performed after writing)

| Question | Answer in V2 | Where |
|---|---|---|
| Who dispatches the plan auditor? | Orchestrator only (or a human in a new chat) | SKILL Transitions; orchestrator; planner |
| Who writes each artifact? | One table | write-boundaries §2 |
| Who may change tests? | Tester; locked tests only after a human decision recorded by another role | write-boundaries §1, §6; tester |
| Scoped verification succeeds — then what? | At `WORKTREE` → freeze. At a candidate (scoped-review option) → review, then full at the same candidate | SKILL Transitions |
| Review-eligible? | Five conditions at candidate C | SKILL Eligibility |
| Release-eligible? | Six conditions at the same C, then one human decision per action | SKILL Eligibility; approvals §2 |
| Integration changes content? | New candidate; verification, review and authorization all stale | SKILL freshness; approval §3 |
| Does review go stale? Test evidence? | Yes, both, by identity | SKILL freshness |
| Who can authorize a boundary exception? | A human; recorded by a role other than the requester | write-boundaries §4; approvals §1 |
| Is a human-name field called authenticated? | No — stated as typed text in four files | approvals §1; handoff-contracts; write-boundaries; tester |
| "Never merge" vs local integration? | Everywhere "no agent merges a **pull request**"; local merge of default named as integration | process instructions; approvals §2; approval agent; team-adoption |
| One writable repo or many? | One, everywhere | estate-layout; template; team-adoption |
| Do fresh roles receive learnings? | Never | SKILL Fresh roles; learnings; both fresh agents |
| Do metrics upgrade self-reports? | No — provenance inherited | discovery-cost; handoff-contracts run-log |
| Can a tier skip a state? | No | SKILL States; risk-tiers |
| Can a waiver bypass review? | No — waivers exist only at release and still need `CLEAN` at C | SKILL Eligibility; approval release §2 |

Fixed during that review: team-adoption said the pipeline "merges nothing" (contradicting the prescribed local merge); the reviewer's allowlist said "the candidate diff" though it cannot run git; the human-checkpoint list omitted sibling movement; eligibility item 2 mis-stated which plan revision the audit covers.
