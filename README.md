# copilot-agentic-workflow

This repository is a **reference implementation and design laboratory** for the organization's existing internal AI pipeline. It is not a standalone executable pipeline, and it does not reproduce infrastructure the organization already has elsewhere (runtime state machinery, MCP server configuration, recovery simulation, end-to-end test harnesses). Its purpose is to give a team member a coherent, inspectable set of GitHub Copilot-native files they can open at work and compare directly against the internal pipeline: agent definitions, skills, flow, agent contracts, guardrails, model roles, a worked example, and a comparison guide.

## Asset tree

```text
.github/
  copilot-instructions.md                  global rules: data vs instructions, secret safety, universal git safety
  agents/                                  nine custom agents implementing the flow
  skills/                                  /pipeline entry, Jira retrieval, repository discovery, policy skills
    plan-grounding/                        Phase 2: PLAN.md construction rules — read by planner and adversary
    challenge-plan/                        Phase 2: independent adversary review method — read by adversary only
    test-contract/                         Phase 3: test-contract-quality policy — read by tester and adversary in test-review mode
    implementation-quality/                Phase 4: GREEN and verification policy — read by developer and verifier
  pipeline/
    FLOW.md                                stages, agents, artifacts, gates, STOP conditions, bounded loops, resume
    AGENT-CONTRACTS.md                     per-agent purpose/inputs/outputs/tools/forbidden; artifact templates
    GUARDRAILS.md                          trust boundaries, least-privilege table, git safety, test immutability
    MODEL-ROLES.md                         model per role, reasoning; benchmark candidates (deferred)
.vscode/
  settings.json                            optional guardrail asset: terminal approval rules, edit approval
  extensions.json                          recommends GitHub Copilot Chat
docs/
  specs/2026-09-09-phase-1-core-pipeline-design-contract.md       the approved lean contract for Phase 1's scope
  specs/2026-09-10-phase-2-planning-quality-contract.md           the approved contract for Phase 2 (Planner/Adversary/G3); the proposal it supersedes is kept unedited as the reviewed record
  specs/2026-09-10-phase-3-test-contract-integrity-contract.md    the approved contract for Phase 3 (Tester/test-review/stage 5b); the proposal it supersedes is kept unedited as the reviewed record
  specs/2026-09-11-phase-4-implementation-quality-contract.md     the approved contract for Phase 4 (Developer GREEN/Verifier/stages 6–7); the proposal it supersedes is kept unedited as the reviewed record
  specs/archive/                           the superseded original contract and its C0 extracts, unedited
  examples/PAYMENTS-12345/                 worked example: one artifact per stage, plus its own README index
  examples/PAYMENTS-12345-planning/        Phase 2 planning-only variant of the same scenario, stops at G3
  examples/PAYMENTS-12345-testing/         Phase 3 LARGE test stage + Phase 4 implementation/verification, stops after stage 7 (stage-5b view at tag phase-3-reference)
  examples/PAYMENTS-12410/                 Phase 2 planning + Phase 3 test + Phase 4 implementation/verification, SMALL, stops after stage 7 (earlier views at reference tags)
  COMPARISON-GUIDE.md                      what to compare against the internal pipeline, file by file
  questions.md                             open questions
```

## How to read the assets

Start with [`.github/pipeline/FLOW.md`](.github/pipeline/FLOW.md) for the shape of a run, then [`AGENT-CONTRACTS.md`](.github/pipeline/AGENT-CONTRACTS.md) for what each agent may and may not do, then [`GUARDRAILS.md`](.github/pipeline/GUARDRAILS.md) for the safety rules those contracts rely on, then [`MODEL-ROLES.md`](.github/pipeline/MODEL-ROLES.md) for which model runs each role and why. Read the nine `.agent.md` files against `AGENT-CONTRACTS.md`, followed by the three Phase 1 skills; the Phase 2 [`plan-grounding`](.github/skills/plan-grounding/SKILL.md) and [`challenge-plan`](.github/skills/challenge-plan/SKILL.md) policies; the Phase 3 [`test-contract`](.github/skills/test-contract/SKILL.md) policy read by `tester` and `adversary` in test-review mode; and the Phase 4 [`implementation-quality`](.github/skills/implementation-quality/SKILL.md) policy read by `developer` and `verifier`. Then read the completed Phase 1 example under [`docs/examples/PAYMENTS-12345/`](docs/examples/PAYMENTS-12345/README.md), the Phase 2 planning view under [`PAYMENTS-12345-planning/`](docs/examples/PAYMENTS-12345-planning/README.md), and the tagged earlier views plus current stage-7 versions of [`PAYMENTS-12345-testing/`](docs/examples/PAYMENTS-12345-testing/README.md) (LARGE) and [`PAYMENTS-12410/`](docs/examples/PAYMENTS-12410/README.md) (SMALL). Finally, read [`docs/COMPARISON-GUIDE.md`](docs/COMPARISON-GUIDE.md), the intended entry point for comparing this design against the organization's internal pipeline asset by asset.

## Trying it in VS Code (prerequisites)

- Open this folder directly as a **single root folder** — not via a multi-root `.code-workspace`.
- Session target **Local**, permission mode **Manual** (no global auto-approve).
- **Sonnet-5** selected in the Copilot Chat model picker (agent frontmatter omits `model:` until the exact picker string is confirmed at work).
- Jira and Bitbucket MCP servers connected and authenticated in your VS Code session; both are configured **outside this repository**.

## Checkpoint status

- **R1 — Design documents and housekeeping**: delivered. `FLOW.md`, `AGENT-CONTRACTS.md`, `GUARDRAILS.md`, `MODEL-ROLES.md`, `.github/copilot-instructions.md`, the archive, and this README.
- **R2 — Agents**: delivered. The nine `.agent.md` files under `.github/agents/` and the `.vscode/settings.json` extensions for the tester/developer/publish git forms. The Copilot Chat agent-picker smoke check (agents appear and are selectable in VS Code) is **pending** — no VS Code session is available in this environment.
- **R3 — Skills, worked example, comparison guide**: delivered. The three skills under `.github/skills/`, the worked example under `docs/examples/PAYMENTS-12345/`, and `docs/COMPARISON-GUIDE.md`. This completes Phase 1. The Copilot Chat agent-picker smoke check from R2 remains **pending**, deferred until a VS Code session is available.
- **Post-audit remediation: delivered** (contract §14 A3–A7; commits fix-1 to fix-4). The Copilot Chat agent-picker smoke check is still **pending**.
- **Post-closure-review corrections: delivered** (contract §14 A8–A10 plus the R3/R5/R6 traceability paragraph; commits fix-5 and fix-6). Closes the six remaining findings of the independent remediation closure review. The agent-picker smoke check remains **pending**.
- **Phase 1 reference closure: recorded** at `03d4230` (fix-7, common re-read SHA comparison and the example's AC5 terminal rule; tag `phase-1-reference`). The independent R2/R3 closure review found no remaining finding and no new regression (contract §15). Accepted limitations and the deferred corporate validation — exact Jira/Bitbucket MCP tool names, the model-picker string, the agent-picker smoke check, approval-engine behavior, model benchmarks — carry forward unchanged; the agent-picker smoke check remains **pending**. The Phase 1 reference tag `phase-1-reference` still pins `03d4230`, and `docs/examples/PAYMENTS-12345/` is unchanged by everything below.

### Phase 2 — Planning quality & adversarial review

- **Contract approved 2026-09-10**, after the independent architecture review (`docs/reviews/2026-09-10-phase-2-architecture-review.md`: PROCEED_WITH_CHANGES; owner decisions D1–D4). See [`docs/specs/2026-09-10-phase-2-planning-quality-contract.md`](docs/specs/2026-09-10-phase-2-planning-quality-contract.md).
- **P2-C1 — Policy skills, contracts, agents: delivered** at commit `abf8468`. The two policy skills (`plan-grounding`, `challenge-plan`); `planner.agent.md`, `adversary.agent.md`, and `pipeline.agent.md` updated for G3 and planning cycles; `FLOW.md`, `AGENT-CONTRACTS.md`, `GUARDRAILS.md`, and `MODEL-ROLES.md` reconciled with the new rules.
- **P2-C2 — Planning examples: delivered** at commit `960ac5b`. The two planning-only examples, `docs/examples/PAYMENTS-12345-planning/` (`LARGE`, cross-repository) and `docs/examples/PAYMENTS-12410/` (`SMALL`), each running through gate G3 only.
- **Post-review targeted correction (fix-1): delivered.** Closes the independent implementation review's three findings (`docs/reviews/2026-09-10-phase-2-implementation-review.md`): a repository added at G1 makes WORKSPACE.md incomplete until prepared, so resume returns to stage 2 (F1); the LARGE example's ledger-client failure contract and audit-table capability are evidenced (E12–E15) instead of assumed, and its AC2 stopping point matches the approved total-attempt budget (F2, F3); plus the accepted non-blocking items (change class in the G3 script, "changed interface" clarified, SMALL AC2 relabelled `DERIVED`, later-round reading order aligned, closure claims qualified).
- **P2-C3 — Guide, README, closure: delivered.** `docs/COMPARISON-GUIDE.md` and this README updated; the five challenge cases are traced as document scenarios in the Phase 2 contract's §6, and the contract's §8 records the checkpoint closure.
- **Phase 2 reference closure: recorded** at `5a46eb7` (fix-1; tag `phase-2-reference`). The independent targeted-correction review found F1–F3 closed and no material regression (contract §9). Accepted limitations (procedural recovery and approval controls, procedural Planner/Adversary independence, fictional examples) and the deferred corporate validation carry forward unchanged; the agent-picker smoke check remains **pending**. Phase 3 is closed as a reference, below.

### Phase 3 — Acceptance-test quality, RED proof & test-contract integrity

- **Contract approved 2026-09-10** (revision 2; architecture review [`docs/reviews/2026-09-10-phase-3-architecture-review.md`](docs/reviews/2026-09-10-phase-3-architecture-review.md): PROCEED_WITH_CHANGES with M1–M5; draft-contract review [`docs/reviews/2026-09-10-phase-3-contract-review.md`](docs/reviews/2026-09-10-phase-3-contract-review.md); revision-2 review [`docs/reviews/2026-09-10-phase-3-contract-revision-2-review.md`](docs/reviews/2026-09-10-phase-3-contract-revision-2-review.md): PROCEED; owner decisions D1–D6). See [`docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md`](docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md).
- **P3-C1 — Policy skill, contracts, agents: delivered** at `92540f7`, with the targeted correction at `9b78efb` closing the independent review's three findings ([`docs/reviews/2026-09-10-phase-3-c1-implementation-review.md`](docs/reviews/2026-09-10-phase-3-c1-implementation-review.md)): stage-5 adoption staged into the RED anchor; Tester activation mode for accepted candidate anchors; stage-5b invocation scoped to test-review inputs.
- **P3-C2 — Test-stage examples: delivered** at `4750ddf` (`docs/examples/PAYMENTS-12345-testing/`, `docs/examples/PAYMENTS-12410/` extended through 5b), after the independent implementation review ([`docs/reviews/2026-09-10-phase-3-c2-implementation-review.md`](docs/reviews/2026-09-10-phase-3-c2-implementation-review.md), four findings) and two targeted correction rounds closed by [`docs/reviews/2026-09-11-phase-3-c2-final-closure-review.md`](docs/reviews/2026-09-11-phase-3-c2-final-closure-review.md) (READY_TO_COMMIT_P3_C2): re-report evidence bound to delivery, attempt and outcome; terminal-stop behaviour proven by controlled subsequent checks; I1 success/failure discrimination through the real adapter against configured responses; SMALL CREATE/UPDATE coverage; response fixtures sufficient for legal re-reports with per-test mock isolation.
- **P3-C3 — Guide, README, closure: delivered.** `docs/COMPARISON-GUIDE.md` and this README updated; the sixteen challenge cases traced as document scenarios in the Phase 3 contract's §7 and the closure recorded in its §10 (Fable).
- **Phase 3 reference closure: recorded** at `20939cc` (P3-C3; tag `phase-3-reference`). The independent final review found no material finding and recommended READY_TO_PUSH_AND_LOCK_PHASE_3 (contract §11). The stale comparison-guide summaries recorded as N1 are corrected in P4-C3; Phase 3's closure-attribution note (N2), accepted limitations, and deferred corporate validation remain historical record. The agent-picker smoke check remains **pending**.

### Phase 4 — Developer implementation quality, GREEN iteration & deeper verification

- **Contract approved 2026-09-11** (revision 2, after architecture and contract review; owner decisions D1–D4 adopted). See [`docs/specs/2026-09-11-phase-4-implementation-quality-contract.md`](docs/specs/2026-09-11-phase-4-implementation-quality-contract.md).
- **P4-C1 — Policy skill, agents, pipeline documents: accepted** at `d525456`. It adds `implementation-quality`, bounded GREEN iteration, the two-half controlled-path check, implementation routing, and obligation-first Verifier review without changing the pipeline's Sonnet-5 runtime baseline. Three accepted non-blocking notes remain recorded in the contract's §10: detailed normative repetition, third-FAIL/controlled-path STOP precedence wording, and the envelope-template summary.
- **P4-C2 — Implementation-stage examples: accepted** at `a5af172`, with the bounded evidence/link correction at `713a302`. The fictional LARGE and SMALL examples are extended in place through stage 7; each links its Phase 3 tagged view and claims no command execution.
- **P4-C3 — Guide, README, traces, checkpoint closure: implemented** in the commit containing this section. The comparison guide includes current Phase 4 entries, the required evidence-bound GREEN theme, and the Phase 3 N1 cleanup; all 28 contract challenge cases are traced as document scenarios, with only cases 5, 6, 24, and 25 marked exercised by the fictional examples.
- **Phase 4 assembled acceptance and publication: pending.** The owner has authorized completion and publication after acceptance, but the independent assembled review, any administrative reference closure, push, and tag remain separate later steps. Phase 5 is not started.

## Further reading

- [`docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md`](docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md) — the approved lean contract for Phase 1 (source of truth for its scope and acceptance).
- [`docs/specs/2026-09-10-phase-2-planning-quality-contract.md`](docs/specs/2026-09-10-phase-2-planning-quality-contract.md) — the approved contract for Phase 2 (source of truth for its scope and acceptance).
- [`docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md`](docs/specs/2026-09-10-phase-3-test-contract-integrity-contract.md) — the approved contract for Phase 3 (source of truth for its scope and acceptance).
- [`docs/specs/2026-09-11-phase-4-implementation-quality-contract.md`](docs/specs/2026-09-11-phase-4-implementation-quality-contract.md) — the approved contract for Phase 4 (source of truth for its scope and acceptance).
- [`docs/specs/archive/README.md`](docs/specs/archive/README.md) — what was superseded, and why.
