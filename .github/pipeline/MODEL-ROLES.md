# Model Roles

What each of the nine agent roles demands, and the model assigned to it. Folds the former `.github/pipeline/docs/models.md`.

## Per-role demands

- **pipeline** — moderate reasoning (gate sequencing, STOP handling); high structured-output fidelity (RUN.md stage, artifact, gate, decision, budget, and delivery state must remain exact); must resist treating a developer's free-text gate answer as anything but that gate's answer; no code reasoning; moderate-to-high cost sensitivity because orchestration spans repeated stage transitions, recovery, and bounded rounds.
- **intake** — high injection resistance (the only agent reading raw Jira text); moderate structured-output fidelity (provenance-tagged INTAKE.md sections); low code reasoning; moderate cost sensitivity (one Jira-bounded pass per run).
- **workspace** — low reasoning depth (mechanical git sequencing); high output fidelity (exact SHAs, exact command forms); low injection exposure (does not receive INTAKE.md or read Jira/repository text; the artifacts it does receive remain untrusted data, contract A7); no code reasoning; low cost sensitivity.
- **planner** — high reasoning depth (approach, Given/When/Then acceptance criteria, risk analysis); high code reasoning (reads existing repository code); moderate injection resistance (reads repository content); moderate cost sensitivity.
- **adversary** — high reasoning depth (must find real gaps, not rubber-stamp); moderate code reasoning; moderate injection resistance; moderate cost sensitivity, bounded to two rounds.
- **tester** — high reasoning depth (translate acceptance criteria into real tests) and high code reasoning (must write compiling, correctly-failing tests); moderate injection resistance; moderate cost sensitivity.
- **developer** — high code reasoning (implementation to GREEN); moderate reasoning depth; low injection exposure (reads only artifacts and code); moderate-to-high cost sensitivity, bounded to two rounds.
- **verifier** — high output fidelity (the SHA and diff checks must be exact, not approximate) and moderate reasoning depth (diff-versus-plan judgment); low injection exposure; moderate cost sensitivity.
- **pr** — moderate structured-output fidelity (PR text, SHA equality checks); low code reasoning; low injection exposure (reads only artifacts); low cost sensitivity.

## First implementation

Sonnet-5 for all nine roles. `model:` is **omitted** from every `.agent.md` frontmatter field until the exact picker string is confirmed in the work environment — per documented Copilot Chat behavior, an omitted `model:` resolves to whichever model is currently selected in the model picker. Developers must manually select **Sonnet-5** in the Copilot Chat model picker before running `/pipeline` so the omission resolves correctly in practice.

### Confirmation procedure

1. Open the model picker in Copilot Chat.
2. Copy the Sonnet-5 display name exactly as shown, including any vendor suffix.
3. Add `model: <that exact string>` to all nine `.agent.md` files (a follow-up correction if they have already shipped without it).
4. Record the confirmed string in `docs/questions.md`.

## Candidates (deferred benchmarks, none are initial fallbacks)

| Candidate | Considered for | Status |
|---|---|---|
| Opus-5 | adversary, planner (if plan quality is the bottleneck) | deferred benchmark |
| Haiku 4.5 | intake (extraction-heavy, lower reasoning need) | deferred benchmark |
| GPT-5.6 Sol / Terra / Luna | any role | deferred benchmark; tier unknown |

## Benchmark protocol (outline, not implemented)

Compare a candidate against the Sonnet-5 baseline on the same fictional ticket's artifacts (PLAN.md quality for planner/adversary candidates; INTAKE.md extraction fidelity and injection resistance for intake candidates), scored on: acceptance-criteria completeness, provenance-tag correctness, and whether any instruction-like content was acted upon instead of recorded. For planner/adversary candidates, the score also records the independently selected checks (`challenge-plan`'s consequence-driven and combined-outcome checks) and their results, as an observation to compare across candidates — not a required outcome (R12, below). Results, if ever run, are recorded separately from this file — not implemented in R1–R3. For private run correlation, paired trials, cost accounting, and promotion controls, see [`docs/RUN-AUDIT-AND-IMPROVEMENT.md`](../../docs/RUN-AUDIT-AND-IMPROVEMENT.md).

## Independence of planner and adversary (R12)

Planner and Adversary are the roles whose value depends on independence, and therefore the primary candidates for model diversity later. Phase 2's structural measures — source-first derivation (the Adversary reads INTAKE.md/RUN.md and records an independent requirement derivation before reading PLAN.md's disposition), independently selected checks (the consequence-driven boundary check and the combined-outcome check in `.github/skills/challenge-plan/SKILL.md`), and a challenge catalogue kept distinct from the Planner's own construction rules (`plan-grounding` vs. `challenge-plan`) — yield **procedural** independence with Sonnet-5 on both sides. They do not guarantee a blind review, a faithful read order, or independent model errors: the same model can share the same blind spots even when it follows two different scripts. The deferred benchmark protocol (above) gains "independently selected checks recorded and their results" as an observation to compare across candidates, not a required outcome. Sonnet-5 remains the baseline for every role.

## Tester and test-review as benchmark candidates (T16)

Tester (contract construction) and the Adversary's test-review mode (stage 5b) are benchmark candidates alongside Planner/Adversary, scored on four dimensions: **assertion-target correctness** (does the test's assertion target the clause's outcome at Observed at, not a proxy), **boundary/doubles** (is the responsible component real, is a double used only to observe or supply a Given), **RED validity** (does the six-line evidence and its validity rules hold), and **incorrect-behavior discrimination** (would a plausible wrong implementation still pass). As with Planner/Adversary (R12), the test-review's independence is **procedural**: outcome-first derivation from PLAN.md before test source is inspected, a distinct catalogue (`test-contract`'s Challenge section, read only in that mode), and no re-use of a prior plan-review verdict as evidence — not a blind review, a faithful read order, or independent model errors, since Sonnet-5 sits on both sides of stage 5 and stage 5b. "Compact pass on a SMALL contract", "rare STOP" (`TEST_REVIEW_REVISE_LIMIT`), and "marginal value of the extra review" are **hypotheses to measure** against the benchmark protocol above, not results this phase claims. No model change: `adversary` now runs in two modes per run (stage 4 and stage 5b) on the same Sonnet-5 assignment; the deferred benchmark protocol gains this row when it is run.

## Developer and Verifier as benchmark candidates (IQ16)

Sonnet 5 remains the model for every role; this is documentation only, and no model change follows from it. `developer` and `verifier` are named as benchmark candidates alongside Planner/Adversary (R12) and Tester/test-review (T16), scored on:
- **Developer:** iterations and runner executions to GREEN; scope precision (declared `PLAN-TRACED`/`ENVELOPE` classifications versus what the Verifier detects); agreement between declared and detected deviations; incidence of contract-gaming patterns (`implementation-quality` skill IQ2).
- **Verifier:** detection of seeded wrong-but-test-passing implementations and seeded `DEFECT`s; the false-FAIL rate on legitimate traced edits; consistency across rounds (same finding, same classification, on re-verification).

As with Planner/Adversary and Tester/test-review, these are **hypotheses to measure** against the deferred benchmark protocol above, not results this phase claims. There is no model change.

## Change control

No model change happens without a new owner decision. No agent, and no implementer, self-authorizes a model change.
