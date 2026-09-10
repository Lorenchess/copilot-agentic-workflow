# copilot-agentic-workflow

This repository is the **workspace root** for a multi-repository development workspace. It holds the shared GitHub Copilot configuration — agents, skills, instructions, MCP config — used by a standardized, Copilot-native pipeline that takes one or more Jira tickets from intake to a Bitbucket pull request. It also doubles as a **reference implementation** the team can use to tune its internal Claude Code pipeline setup.

This repo owns only the shared configuration and pipeline run artifacts. Application code lives in separately cloned repositories that sit as siblings inside this folder, not inside this repository.

## Layout

```text
copilot-agentic-workflow/        <- this repo (workspace root)
├─ .github/                      <- agents, skills, instructions, pipeline docs (this repo)
├─ .vscode/                      <- workspace settings, MCP config (this repo)
├─ docs/                         <- specs, questions, testing logs (this repo)
├─ .pipeline/                    <- run artifacts, gitignored, NOT part of this repo
│  └─ runs/<PRIMARY-JIRA>/       <- one directory per pipeline run
├─ some-service/                 <- a nested, separately cloned repository
├─ another-service/              <- a nested, separately cloned repository
└─ ...                           <- every other nested repository
```

Every top-level directory other than `.github`, `.vscode`, and `docs` is treated as an independent, separately cloned Git repository belonging to the wider workspace, not to this repo; `.gitignore` excludes them here so this repo never tracks their content.

## Single root folder requirement

Open **this folder directly** in VS Code — do not open it via a multi-root `.code-workspace` file. Customization discovery (agents, skills, instructions, MCP config, hooks) is only well-defined for a single opened root, and the terminal's working directory needs to be deterministic for the pipeline's git operations.

Session target: **Local**. Permission mode: **Manual** (no global auto-approve). These are required for the pipeline's approval-gated terminal and edit rules to work as designed.

## Running the pipeline

1. Open this repository as the single root folder in VS Code, with the nested repositories cloned as siblings underneath it.
2. In the Copilot Chat agent picker, select the **Pipeline Intake** agent.
3. Run:
   ```text
   /pipeline KEY[, KEY...]
   ```
   The first key is the **primary Jira** and becomes the feature branch prefix; any additional keys are secondary requested Jiras.
4. Follow the developer confirmation prompts the pipeline raises (repository selection, branch name, optional context, and any repository-state decisions).

Run artifacts — state, evidence, and the final intake artifact — are written to `.pipeline/runs/<PRIMARY-JIRA>/`. This directory is gitignored; it is working data for the pipeline and the developer, not repository content.

## Status

The agents, skills, settings, and schemas that implement the pipeline are delivered in later checkpoints and are not yet present in this repository. This checkpoint establishes the workspace layout and the normative policy documents only.

## Further reading

- [`docs/specs/2026-09-09-phase-1-architecture-contract.md`](docs/specs/2026-09-09-phase-1-architecture-contract.md) — the full, approved Phase 1 architecture and implementation contract (source of truth).
- [`.github/pipeline/docs/phase-1-contract.md`](.github/pipeline/docs/phase-1-contract.md) — the normative Phase 1 policy, copied from the contract.
- [`.github/pipeline/docs/decisions.md`](.github/pipeline/docs/decisions.md) — the key architectural decisions behind Phase 1, copied from the contract.
