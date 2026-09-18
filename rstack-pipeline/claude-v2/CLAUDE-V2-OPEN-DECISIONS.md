# Claude V2 — open human decisions

Only decisions a human must make. Each entry gives what V2 does **until** the decision is made, so the set is usable as it stands, and nothing below was decided silently.

Status of all: **OPEN — awaiting owner.**

---

## OD-1 — Add a pre-implementation Test Challenge state?

**Question.** Should a fresh role challenge the locked tests *before* the developer starts (a state 2b), as ChatGPT's review of the Copilot reference keeps?

**What exists without it.**

| Check | When | Independent of the tester? | What it sees |
|---|---|---|---|
| Plan auditor, falsifiability lens | before tests exist | yes | the *named* check, not the test |
| Tester's own red + `base-replay` | state 2 / 4 | no (self) — mechanical | that the test fails without the change; not *why* |
| Reviewer obligation 2 | state 5, after implementation | yes | the real test source |

So test adequacy **is** independently challenged without self-review — but only after implementation. A red that fails for the wrong reason, a mock asserting its own return value, or a missing converse is found at review, and the repair is expensive: a human-decided lock amendment, a new candidate, full verification and review again.

**Options.**
- **A. Keep as is** (V2 default). Reviewer is the independent judge; V2 makes that obligation explicit and primary in the reviewer file.
- **B. Add 2b using the existing plan-auditor definition in a second mode** (inputs: `plan.md`, `ac.tsv`, test sources, `red.txt`; never the tester's reasoning). No new agent, one more fresh dispatch per ticket, one more loop (2↔2b).
- **C. Add 2b only at HIGH tier.** Rejected in advance: a tier must not decide whether a state runs.

**Why it cannot be decided here.** B is a new state; the brief forbids adding one without approval, and its value is an empirical question.

**Evidence that would settle it.** `discovery-cost.md` now tracks "vacuous or missing checks found at review". If those recur across the first pilot runs — each costing a candidate round — B pays for itself. If review rarely finds them, A stands.

**Recommendation.** A for the pilot, measure, then decide. If B is adopted, the owner is `pipeline/SKILL.md` (one state row, two transitions) plus a mode section in the auditor file; nothing else changes.

---

## OD-2 — Keep LOW/MEDIUM/HIGH, or replace with affected surfaces?

**Until decided.** V2 keeps the tier as depth only and makes the **affected-surfaces line mandatory** next to it in `plan.md`. Size-driven tier raises are removed; no numeric scoring.

**Tradeoff.** The surface list is what actually tells a tester what to search and a reviewer where to look; the scalar is its summary. The scalar is cheap for a human to scan and gives the depth table a row to select. It also invites false precision and a second classification argument.

**Options.** (A) keep both (default); (B) drop the scalar, key the depth table on surfaces (boundary / contract / persistence / concurrency / security / none); (C) keep the scalar only in the human-facing reply.

**Evidence that would settle it.** Runs where the tier and the surface list would have selected different depths, and which was right.

---

## OD-3 — `learnings.md`: standard, experimental, or removed?

**Until decided.** EXPERIMENTAL and off by default. No role writes it; the orchestrator may propose an entry and a human adds it; fresh roles never receive it; an entry must be re-checked before use and is never cited as evidence; nothing depends on the file existing.

**Options.** (A) experimental, human-curated (default); (B) standard, with the orchestrator's automatic append and the `learnings-check.mjs` validator restored — reinstates a write lane, a validator nothing consumes, and a standing read cost; (C) remove entirely and put durable repository facts in the repository's own docs and tests.

**Evidence that would settle it.** The decision test in `discovery-cost.md`: a repeated, material rediscovery cost across at least three representative runs, and a named human judging that an entry changed or shortened a decision. ChatGPT's position is that the value is unproven; nothing in the reconstruction contradicts that (the original harness map says nothing had written a learning yet).

---

## OD-4 — What human-authorization mechanism does the eventual host actually provide?

**Why it matters.** Every authorization in V2 — boundary exception, lock amendment, waiver, candidate commit, push, PR — is, mechanically, a human reply in a chat that an agent then writes down. `--authorised-by`, `authorised_by` and `accepted_by` are typed strings. V2 says so plainly and claims nothing stronger.

**Needed from the owner.**
1. Does the host expose an authenticated record of who answered which prompt (session identity, signed approval, audit log)?
2. Can any action be bound to it — e.g. a push that only succeeds with the human's own credential, or branch protection requiring a human reviewer?
3. Is the final control outside the pipeline (protected branches, mandatory human PR review) considered sufficient, with in-run authorization treated as courtesy plus audit trail?

**Until decided.** PROSE CONTRACT + RECORDED DECISION written by a role other than the requester, with the host conversation as the only primary evidence. The self-issued `role-guard --waiver` is not treated as authorization.

**Related policy choice, flagged because V2 moved it:** the shipping-commit question is now asked at **freeze**, before final verification and review, because the candidate must exist before evidence can bind to it. It is asked again for each fix-round commit. The owner may prefer local candidate commits without a question (the reconstruction already treats loop commits as local and unasked) and keep the human's control at push. V2 keeps the question, as the more conservative reading.

---

## OD-5 — What suite-capture and gate tooling really exists?

**Known from the reconstruction.** No suite-capture wrapper is named anywhere; the original tester captures exit code, scope, HEAD and tree state by hand in bash and PowerShell. `gate.mjs` takes an agent-typed `--suite-exit`, emits `PASS | BLOCKED` with an owner and `proceedable`, refuses `PASS` on a scoped run, and has a `HELD` state — and nothing defines how a green scoped run ever reaches review. ChatGPT's "canonical wrapper" does not exist in the design.

**Needed from the owner.** The real source of `gate.mjs`, `test-lock.mjs`, `base-replay.mjs`, `ac-check.mjs`, `role-guard.mjs`, `estate-guard.mjs`, and whatever parses `suite.txt`; and the `prove-it` and `ac-matrix` skills.

**Decisions that follow.**
1. Map the gate's real outputs onto `REVIEW_ELIGIBLE` / `RELEASE_ELIGIBLE`, or change the gate to emit them.
2. Whether to build one capture tool (the single piece of new code V2 considers justified: it removes a page of shell choreography from a prompt and turns a typed exit code into a measured one) — or keep hand capture labelled `AGENT_REPORTED`.
3. Whether `ac-check.mjs` compares its `sha` column to HEAD in a way that still works when `ac.tsv` is no longer committed.

**Until decided.** V2 states the required capture *fields* and marks every tool-dependent line `ENFORCEMENT DEPENDENCY` or `SOURCE DEPENDENCY`. No script was invented.

---

## OD-6 — What candidate identity can the host reliably bind evidence to?

**V2 default.** A local commit on the ticket branch, created at freeze, plus its tree, the plan revision, the test-lock revision and the suite command, recorded in `candidate.md` by the approval role (so: agent-typed).

**Open points.**
1. **Commit or tree?** A commit is simple and robust; a tree id would survive a metadata-only change (message edit, no-op merge) without staling review. V2 uses the commit and treats tree equality as *not* established — ChatGPT's ADR-04 warns against assuming equivalence.
2. **Who computes it?** Ideally a tool writes `candidate.md`; today an agent does.
3. **Is there a lock revision id?** The lock file's path and format are tool-owned and unknown here.
4. **Durable record.** `ac.tsv` is no longer committed (that removes the self-referential SHA problem both the original and the proposal left open). The durable record becomes the PR's verification table naming the candidate. If the team requires an in-repo record, it must be added in a way that is not part of the evaluated commit — e.g. by the merge process, outside the pipeline.
5. **Squash merges.** If the team squashes on merge, the published commit differs from the candidate by construction; the binding then holds up to the PR head, and the squash is the team's process.

---

## Smaller decisions surfaced while editing

| # | Decision | V2 default |
|---|---|---|
| OD-7 | Default order at a candidate: full verification before review, or review on scoped evidence first? | Full first; scoped-review option selectable per estate. Both bind to the same candidate, so either is safe |
| OD-8 | Keep the pre-existing-failure waiver and accepted-unrecorded-rung paths at all? ChatGPT keeps strict full-suite PASS in the Copilot reference | Kept, because they exist in the reconstructed rstack; confined to release, reported as `RELEASE_BLOCKED proceedable`, never a pass, never a bypass of review |
| OD-9 | Drop the `evidence-auditor` sub-agent from approval? It is named in the reconstruction but undefined anywhere | Dropped: ambiguous evidence routes to the tester |
| OD-10 | Keep manual-mode chat handoffs? | Kept only between non-fresh roles; none into the auditor or reviewer, because a handoff carries context |
| OD-11 | The post-merge `docs` workflow and its deletion rules | Left to the `docs` skill; V2 only keeps the write-lane line and "never start it yourself" |
