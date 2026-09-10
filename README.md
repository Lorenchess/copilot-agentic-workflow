# copilot-agentic-workflow

This repository is a **reference implementation and design laboratory** for the organization's existing internal AI pipeline. It is not a standalone executable pipeline, and it does not reproduce infrastructure the organization already has elsewhere (runtime state machinery, MCP server configuration, recovery simulation, end-to-end test harnesses). Its purpose is to give a team member a coherent, inspectable set of GitHub Copilot-native files they can open at work and compare directly against the internal pipeline: agent definitions, skills, flow, agent contracts, guardrails, model roles, and (once delivered) a worked example and a comparison guide.

## Asset tree

```text
.github/
  copilot-instructions.md                  global rules: data vs instructions, secret safety, universal git safety
  agents/                                  nine custom agents implementing the flow (R2)
  skills/                                  /pipeline entry, Jira retrieval, repository discovery (R3)
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
  examples/PAYMENTS-12345/                 worked example: one artifact per stage (R3)
  COMPARISON-GUIDE.md                      what to compare against the internal pipeline, file by file (R3)
  questions.md                             open questions
```

## How to read the assets

Start with [`.github/pipeline/FLOW.md`](.github/pipeline/FLOW.md) for the shape of a run, then [`AGENT-CONTRACTS.md`](.github/pipeline/AGENT-CONTRACTS.md) for what each agent may and may not do, then [`GUARDRAILS.md`](.github/pipeline/GUARDRAILS.md) for the safety rules those contracts rely on, then [`MODEL-ROLES.md`](.github/pipeline/MODEL-ROLES.md) for which model runs each role and why. Once R2 lands, read the nine `.agent.md` files against `AGENT-CONTRACTS.md` to see the design realized; once R3 lands, read the three skills, the worked example under `docs/examples/`, and finally `docs/COMPARISON-GUIDE.md`, which is the intended entry point for comparing this design against the organization's internal pipeline.

## Trying it in VS Code (prerequisites)

- Open this folder directly as a **single root folder** — not via a multi-root `.code-workspace`.
- Session target **Local**, permission mode **Manual** (no global auto-approve).
- **Sonnet-5** selected in the Copilot Chat model picker (agent frontmatter omits `model:` until the exact picker string is confirmed at work).
- Jira and Bitbucket MCP servers connected and authenticated in your VS Code session; both are configured **outside this repository**.

## Checkpoint status

- **R1 — Design documents and housekeeping**: delivered. `FLOW.md`, `AGENT-CONTRACTS.md`, `GUARDRAILS.md`, `MODEL-ROLES.md`, `.github/copilot-instructions.md`, the archive, and this README.
- **R2 — Agents**: pending. The nine `.agent.md` files and the `.vscode/settings.json` extensions for tester/developer/publish git forms.
- **R3 — Skills, worked example, comparison guide**: pending.

## Further reading

- [`docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md`](docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md) — the approved lean contract (source of truth for scope and acceptance).
- [`docs/specs/archive/README.md`](docs/specs/archive/README.md) — what was superseded, and why.
