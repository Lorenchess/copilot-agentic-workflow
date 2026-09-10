# copilot-agentic-workflow

This repository is a **reference implementation and design laboratory** for the organization's existing internal AI pipeline. It is not a standalone executable pipeline, and it does not reproduce infrastructure the organization already has elsewhere (runtime state machinery, MCP server configuration, recovery simulation, end-to-end test harnesses). Its purpose is to give a team member a coherent, inspectable set of GitHub Copilot-native files they can open at work and compare directly against the internal pipeline: agent definitions, skills, flow, agent contracts, guardrails, model roles, a worked example, and a comparison guide.

## Asset tree

```text
.github/
  copilot-instructions.md                  global rules: data vs instructions, secret safety, universal git safety
  agents/                                  nine custom agents implementing the flow
  skills/                                  /pipeline entry, Jira retrieval, repository discovery
  pipeline/
    FLOW.md                                stages, agents, artifacts, gates, STOP conditions, bounded loops, resume
    AGENT-CONTRACTS.md                     per-agent purpose/inputs/outputs/tools/forbidden; artifact templates
    GUARDRAILS.md                          trust boundaries, least-privilege table, git safety, test immutability
    MODEL-ROLES.md                         model per role, reasoning; benchmark candidates (deferred)
.vscode/
  settings.json                            optional guardrail asset: terminal approval rules, edit approval
  extensions.json                          recommends GitHub Copilot Chat
docs/
  specs/2026-09-09-phase-1-core-pipeline-design-contract.md   the approved lean contract for this scope
  specs/archive/                           the superseded original contract and its C0 extracts, unedited
  examples/PAYMENTS-12345/                 worked example: one artifact per stage, plus its own README index
  COMPARISON-GUIDE.md                      what to compare against the internal pipeline, file by file
  questions.md                             open questions
```

## How to read the assets

Start with [`.github/pipeline/FLOW.md`](.github/pipeline/FLOW.md) for the shape of a run, then [`AGENT-CONTRACTS.md`](.github/pipeline/AGENT-CONTRACTS.md) for what each agent may and may not do, then [`GUARDRAILS.md`](.github/pipeline/GUARDRAILS.md) for the safety rules those contracts rely on, then [`MODEL-ROLES.md`](.github/pipeline/MODEL-ROLES.md) for which model runs each role and why. Then read the nine `.agent.md` files against `AGENT-CONTRACTS.md` to see the design realized, and the three skills under `.github/skills/`. Finally, read the worked example under [`docs/examples/PAYMENTS-12345/`](docs/examples/PAYMENTS-12345/README.md) to see the design actually produce artifacts end to end, and [`docs/COMPARISON-GUIDE.md`](docs/COMPARISON-GUIDE.md) — the intended entry point for comparing this design against the organization's internal pipeline, asset by asset.

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
- **Phase 1 reference closure: recorded** at `03d4230` (fix-7, common re-read SHA comparison and the example's AC5 terminal rule; tag `phase-1-reference`). The independent R2/R3 closure review found no remaining finding and no new regression (contract §15). Accepted limitations and the deferred corporate validation — exact Jira/Bitbucket MCP tool names, the model-picker string, the agent-picker smoke check, approval-engine behavior, model benchmarks — carry forward unchanged; the agent-picker smoke check remains **pending**. Phase 2 is not started.

## Further reading

- [`docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md`](docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md) — the approved lean contract (source of truth for scope and acceptance).
- [`docs/specs/archive/README.md`](docs/specs/archive/README.md) — what was superseded, and why.
