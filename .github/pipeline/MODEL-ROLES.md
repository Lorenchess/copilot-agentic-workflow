# Model Roles

What each of the nine agent roles demands, and the model assigned to it. Folds the former `.github/pipeline/docs/models.md`.

## Per-role demands

- **pipeline** — moderate reasoning (gate sequencing, STOP handling); low structured-output needs; must resist treating a developer's free-text gate answer as anything but that gate's answer; no code reasoning; low cost sensitivity (one call per stage transition).
- **intake** — high injection resistance (the only agent reading raw Jira text); moderate structured-output fidelity (provenance-tagged INTAKE.md sections); low code reasoning; moderate cost sensitivity (one Jira-bounded pass per run).
- **workspace** — low reasoning depth (mechanical git sequencing); high output fidelity (exact SHAs, exact command forms); no injection exposure (never reads Jira/repo text, only artifacts); no code reasoning; low cost sensitivity.
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

Compare a candidate against the Sonnet-5 baseline on the same fictional ticket's artifacts (PLAN.md quality for planner/adversary candidates; INTAKE.md extraction fidelity and injection resistance for intake candidates), scored on: acceptance-criteria completeness, provenance-tag correctness, and whether any instruction-like content was acted upon instead of recorded. Results, if ever run, are recorded separately from this file — not implemented in R1–R3.

## Change control

No model change happens without a new owner decision. No agent, and no implementer, self-authorizes a model change.
