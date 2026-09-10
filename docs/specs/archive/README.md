# Archive

`2026-09-09-phase-1-architecture-contract.md` is the original Phase 1 contract, committed at C0 (commit `47c2df6`). It was superseded on 2026-09-09 by [`../2026-09-09-phase-1-core-pipeline-design-contract.md`](../2026-09-09-phase-1-core-pipeline-design-contract.md) because it over-engineered this repository as a standalone runtime — state machinery, JSON schemas, and a resumability model this repository does not need to reproduce.

The archived file, and the two files under `c0-pipeline-docs/`, are byte-identical to their commit-`47c2df6` versions (modulo the CRLF/LF normalization this repository's `core.autocrlf` setting already applies on every checkout — Git treats these as unchanged). **They must never be edited.**

The C1-review amendment approved by the owner — tightening the `<dir>` slot in the approval-rule regexes to `[A-Za-z0-9][A-Za-z0-9._-]*` so that `git -C .` and `git -C ..` can never match an allow rule — was deliberately **not** incorporated into this historical text. It lives instead in `.github/pipeline/GUARDRAILS.md` and in `.vscode/settings.json`, which reflect the current, corrected rule.

`c0-pipeline-docs/` holds the two verbatim extracts that C0 originally placed under `.github/pipeline/docs/` (`phase-1-contract.md` and `decisions.md`), moved here unchanged.
