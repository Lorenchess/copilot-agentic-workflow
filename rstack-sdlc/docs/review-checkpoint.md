# RSTACK SDLC — review checkpoint (S0–S5, pre-repair)

**Date:** 2026-10-03. **Branch:** `feat/rstack-sdlc-local-build`. **Base:** `da64f6d`.

This is a navigation and status record for reviewers. It is not a runtime contract, a release, or an approval. Scope and semantics stay owned by [README](../README.md) and 01–03; decisions are in [decisions.md](decisions.md).

## Status

- **Project:** a standalone, generic software-delivery factory under `rstack-sdlc/`, targeting VS Code GitHub Copilot. It is not a migration of any existing pipeline. The builder's own tools are not the target host.
- **Batches:** S0–S5 are implemented. S6 (VS Code acceptance and local pilot) is not started.
- **Independent offline review verdict: CHANGES REQUESTED.** The candidate is **not approved for installation into a real workspace.**
- **This commit is the pre-repair candidate.** No defect below is fixed here; repairs follow as separate, separately reviewable changes.

## Open defects (from the offline review)

The review covers what its reviewer examined; it is not proof of unexamined behavior.

| ID | Summary | Main location |
|---|---|---|
| D1 | The installer adopts an unmanaged, byte-identical file as its own and a later uninstall deletes it | `adapters/copilot-vscode/install.ts` |
| D2 | A failed update can lose a removed Skill file while reporting a full rollback | `adapters/copilot-vscode/install.ts` |
| D3 | Four role prompts omit result-envelope fields the engine requires | `core/roles/`, `core/contracts/records.ts` |
| D4 | A refused result can strand the run on the installed coordinator path (no documented recovery step) | `adapters/copilot-vscode/coordinator.md`, `core/engine/` |
| D5 | The human brief omits specification text that the decision approves | `core/contracts/planning.ts`, `core/engine/brief.ts` |
| D6 | Evaluation acceptance and summary trust control files in the judge's own write area | `evals/evaluation.ts` |
| D7 | "Latest" evaluation and duplicate-run selection depend on name and argument order | `evals/evaluation.ts`, `evals/summary.ts` |
| D8 | A malformed install manifest can throw instead of refusing cleanly | `adapters/copilot-vscode/install.ts` |

Planned repair groups (none started):

| Group | Defects | Theme |
|---|---|---|
| R1 | D1, D2, D8 | Installer preservation |
| R2 | D6, D7 | Evaluation integrity |
| R3 | D3, D4 | Role contracts and recovery |
| R4 | D5 | Approval completeness |

## Checks

**Reported by the prior offline review (not reproduced for this checkpoint):**

- Type-check: 0 errors.
- Tests: 117 passed, 1 skipped (a symbolic-link case that needs elevation).
- Sensitivity: 75 broken guards detected, 15 control runs passed.
- Package generation: two byte-identical runs, 33 generated files.

**Run while preparing this checkpoint:**

- `npm run typecheck`: no errors reported.
- Nothing else. The test suite, the sensitivity suite, and package generation were not rerun.

All of the above are engine, fake-transport, and package checks with simulated role content. None is host evidence.

## Host and integrations

- **VS Code Copilot:** live validation is pending. `COPILOT_VALIDATED` is no. Model selectors are unobserved and host questions U1–U12 in [decisions.md](decisions.md) remain open. It needs a licensed Copilot session and an approved disposable workspace.
- **Jira and Bitbucket:** intentionally deferred. `adapters/jira/` and `adapters/bitbucket/` are disabled placeholders that return `INTEGRATION_NOT_CONFIGURED`; they were not researched or contacted.

## Where to look

| Path | Contents |
|---|---|
| `core/` | Engine, contracts, workflow policy, role prompts, Skills |
| `adapters/` | Copilot package generator and installer, local and fake adapters, deferred placeholders |
| `profiles/` | Trial profile |
| `evals/` | Deterministic and judge evaluation, rubrics, summary |
| `scripts/` | Package-local entry points |
| `tests/` | Tests, sensitivity runner, synthetic fixtures |

Setup: Node `>=24.0.0 <25`, `npm ci` in `rstack-sdlc/`, then the scripts in `package.json`.

## Kept local, not published

Intentionally omitted from this checkpoint and retained unchanged in the builder's checkout:

- The full offline review report, the host-readiness report, and the batch progress record (`docs/`): they contain machine-local details and were not edited for publication.
- Retained runs, evaluations, and imports (`.rstack/`), source baselines (`.baselines/`), the generated package (`dist/`), test scratch output (`tests/.tmp/`), and `node_modules/`.

Some published files refer to those local records; such references will not resolve in this repository.
