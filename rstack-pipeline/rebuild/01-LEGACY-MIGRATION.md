# RSTACK rebuild: preserve and retire the old source

**Date:** 2026-10-02. **Scope:** Batch N0 of the [rebuild assignment](README.md). This is an executable migration procedure for the repository-aware agent, not a claim that the move has happened.

## Contents

- [Authority and boundary](#authority-and-boundary)
- [N0a: establish the subject](#n0a-establish-the-subject)
- [N0b: preserve a recoverable baseline](#n0b-preserve-a-recoverable-baseline)
- [N0c: move only the identified legacy source](#n0c-move-only-the-identified-legacy-source)
- [N0d: prove the archive is safe](#n0d-prove-the-archive-is-safe)
- [Rollback and completion](#rollback-and-completion)

## Authority and boundary

The owner has selected a fresh implementation and requested preservation of the old pipeline as legacy. When the owner invokes this assignment, N0 authorizes the verified, repository-local archival move on a dedicated branch. It does not authorize organization-wide installation changes, live ticket execution, publishing internal data, deleting work, merging a PR, or deploying the new runtime.

This replaces the old in-place-refactor sequence for the new build. It does not remove safety requirements. Sessions A–D are evidence inputs; their recommendations are not automatically adopted. Finish useful read-only investigations, but stop competing implementation sessions before moving shared paths.

**Retiring development source, disabling local discovery, and replacing deployed installations are three different actions.** Archive source now where verified. Existing developer installations may remain pinned to the legacy release until a separately approved replacement is ready. Do not claim a source move upgraded those installations.

## N0a: establish the subject

1. Read the repository root instructions, status entry points, manifests, generators, package scripts, and available Session A report. Record the actual Git root, repository identity, branch, HEAD, staged/unstaged work, and current processes. Do not infer the workplace tree from screenshots or the public reference repository.
2. Identify each authored pipeline root, generated copy, installation destination, shared asset, active discovery configuration, and owner. Read generator inputs and consumers; a `GENERATED` header alone is not sufficient evidence.
3. Create one migration table in the batch record:

| Source path | Classification | Generator/consumer | Proposed archive path | Action | Reason |
|---|---|---|---|---|---|
| `<verified old runtime root>` | Legacy authored source | Exact observed references | `legacy/rstack-v2/<original-relative-path>` | Move | Superseded implementation |
| `<verified generated output>` | Legacy derived output | Exact generator | Same relative path under archive, if needed | Archive or retain frozen package | Reproducibility |
| `<shared CI/config>` | Shared | Old and new/other users | Unchanged | Preserve | Not exclusively legacy |
| `rstack-pipeline/rebuild/` | New build guidance | Maintainer | Unchanged | Preserve | Current assignment |
| `<run evidence>` | Private runtime data | Evaluator/operator | Approved internal store | Preserve outside public archive | Confidential evidence |

4. Confirm the destination is not occupied by unrelated content. If `rstack/` already exists, inspect it; never overwrite it or create a competing `rstack-next-final` tree.
5. Use one dedicated branch. Do not switch a checkout another session is editing. Do not create extra worktrees/clones without an explicit location and ownership agreement. A single approved isolated worktree is acceptable when necessary; record cleanup conditions.

If the installed runtime is unavailable, state **reference-only migration** and archive only the proven reference sources. Do not guess a workplace path, silently broaden the archive, or claim the installed pipeline has been retired. Ask only for unresolved scope that prevents a safe move.

## N0b: preserve a recoverable baseline

Record the pre-migration commit and a durable restoration method. A commit alone does not preserve uncommitted, ignored, or untracked files. Preserve authorized dirty work separately, with owner-approved handling; do not silently stash, reset, clean, or commit it.

Before moving, record a manifest of the selected files: original relative path, intended destination, content digest, Git mode/type, and tracked status. Include executable bits and symlink targets. Do not dereference symlinks outside authorized roots. Treat submodules and nested repositories explicitly rather than moving them as ordinary directories.

Keep confidential logs, secrets, credentials, and corporate code in the approved internal environment. A public manifest must not expose sensitive paths or content. Never upload ignored files merely to make the archive appear complete.

Capture existing safe test results and generated-output identities. If the old implementation is failing, preserve that result as a known defect; do not repair it inside N0 or label it the desired behavior. Baseline scripts may write files or call services: inspect before execution and use an approved disposable test area where needed.

A tag is optional. The recoverability requirement is a retained revision plus explicit preservation of anything that revision does not contain. Do not publish a tag or branch without the applicable repository authorization.

## N0c: move only the identified legacy source

Perform the approved move list with Git-aware moves, preserving contents and modes. Do not rewrite archived prompts to make them fit the new architecture. The archive is historical evidence, not another maintained runtime.

Use `legacy/rstack-v2/<original-relative-path>` as the default archive mapping. The complete previous revision remains the authoritative reproduction point when old relative links or build paths cannot operate from inside the archive. Record that limitation rather than duplicating the whole repository or editing the archive to hide it.

Do **not** move the entire `.github`, `.claude`, `docs`, `tests`, or `rstack-pipeline` directory by wildcard. These can contain CI, repository governance, current rebuild guidance, shared configuration, or nonlegacy projects. Move only inventoried pipeline-owned items. Keep the accumulated research and evaluation guidance discoverable as historical inputs, outside routine agent loading.

Update only the necessary entry points, packaging selectors, and repository-local discovery settings in the same coherent migration batch. Preserve copies of changed settings for rollback. Do not weaken managed permissions, disable all hooks, or broaden terminal auto-approval to make the migration easier.

Add a short `legacy/rstack-v2/README.md` identifying the frozen revision, archive map, reproduction procedure, retired status, and new build entry point. The old README's statements remain historical; the active entry point must no longer instruct maintainers to refine V2 as the new design.

Archived instructions must not be selected as active agents/Skills or included in new packaging. Directory names, banners, and ignore files are not sufficient enforcement. Inspect every applicable discovery root, plugin registration, configured path, ancestor instruction, and additional workspace root. Test the actual host. If safe exclusion is unavailable, preserve the legacy release outside discoverable workspace roots under an explicitly approved location, or pause the move.

Do not regenerate or install an unfinished replacement. The new target remains `BUILDING`; the workspace must clearly state when no new runtime is available. A separate environment may still use its deliberately pinned legacy installation.

## N0d: prove the archive is safe

Before calling N0 complete, establish all of the following:

| Check | Required evidence |
|---|---|
| Preservation | Every selected file has the same content and mode at its mapped destination; missing/extra files explained. |
| Scope | Diff is limited to archival moves, archive metadata, and necessary entry/discovery changes. |
| User work | Staged, unstaged, ignored, and unrelated files remain accounted for; no unexplained deletion. |
| Reproduction | The recorded previous revision and authorized dependencies can reconstruct the prior layout in a safe test environment. |
| Discovery | Fresh host inspection does not discover both legacy and new agents as active; unavailable hosts are marked unverified. |
| Packaging | No new build imports or packages legacy files; shared configuration still works. |
| Records | Historical run IDs, evidence, hashes, and audit outcomes have not been rewritten. |

Full legacy execution from the relocated archive is not required. Recoverability of the old version is required. Do not report end-to-end readiness from a static path check.

## Rollback and completion

Restore only the migration-owned paths/settings from the recorded baseline, preserving unrelated later work. Prefer a targeted revert or explicit reverse mapping; never use destructive repository-wide reset/clean commands. Before reversal, check for new files, concurrent changes, or active work at the old locations. Stop rather than overwrite them.

N0 ends with one short batch record: source revision, archive mapping, preserved-work references, checks actually run, failures/limitations, and rollback evidence. Record `ARCHIVED`, `REFERENCE_ONLY_ARCHIVED`, or `BLOCKED` accurately. The agent recommends whether to retain the batch; human acceptance authorizes the next batch.

**After N0, stop.** Start a fresh build session for N1 so previously loaded legacy instructions do not silently govern the new implementation. N0 does not authorize the complete build in one uninterrupted run.
