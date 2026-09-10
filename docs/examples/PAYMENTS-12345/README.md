# Worked example — PAYMENTS-12345

This directory holds one artifact per pipeline stage for a single fictional run of `/pipeline PAYMENTS-12345, PAYMENTS-12351` through the reference pipeline defined in `.github/pipeline/FLOW.md`. It shows what the nine agents in `.github/agents/` would actually produce, end to end, for a two-repository change: retrying failed webhook deliveries with exponential backoff in `payments-api`, and recording each retry attempt in `payments-ledger`'s audit log.

**Everything in this directory is fictional.** Every Jira key, issue, comment, and field value; every repository name, file path, and line of code description; every git SHA (all 40-hex placeholders); every Bitbucket URL; every tool output excerpt (Maven surefire lines, `git` command output) is invented for illustration. None of it corresponds to a real Jira instance, a real repository, or a real commit. The two repositories are assumed to be Java 17 / Maven / JUnit 5 projects; a third inventoried repository, `payments-web` (npm), is recommended at G1 with LOW confidence and deliberately **not** selected — this is the example's illustration of the recommendation-versus-selection distinction (see INTAKE.md's Repository recommendation section versus RUN.md's Repositories section).

## Reading order

Read the eleven artifacts in pipeline stage order — each is the immutable input to the ones after it:

1. `RUN.md` — keys, repositories (recommended vs. selected), branch, developer context, stage status with a round column, Artifact history (which version of each artifact is ACTIVE vs. SUPERSEDED), gates log with the full G4 publish tuple per repository and each gate's basis (the artifact revision(s) reviewed) and `CURRENT`/`STALE` status (owner: `pipeline`)
2. `INTAKE.md` — Jira facts, context-only Jiras, repository recommendation, proposed branch, suspicious content (owner: `intake`)
3. `WORKSPACE.md` — branch preparation and baseline SHA per repository (stage 2), and, later, the publish sequence's full preflight and explicit-object push (stage 9) (owner: `workspace`)
4. `PLAN.md` — scope, Requested scope disposition per Jira key, approach, acceptance criteria (each with a source class), risks; this is the **round-2** plan — round 1 was reviewed and sent back, and round 2 resolves that gap with AC5's explicit, tested terminal outcome rather than an unsupported promise (owner: `planner`)
5. `ADVERSARY-REVIEW.md` — verdict, findings (including the round-1 finding this round-2 review records as resolved by that explicit, tested terminal outcome), challenged assumptions; this is the **round-2** review (owner: `adversary`)
6. `TEST-CONTRACT.md` — scenario mapping, WITNESS/PRESERVATION test classification, test paths, RED commit SHAs, run commands, execution envelope per repository (owner: `tester`)
7. `RED-REPORT.md` — the RED proof for WITNESS tests, the PRESERVATION results, and why (owner: `tester`)
8. `IMPLEMENTATION.md` — the GREEN proof: what changed, how, and any execution-envelope changes with justification (owner: `developer`)
9. `VERIFICATION.md` — independent PASS verdict, verified commit SHAs, checkout state, the contract test run and full-suite run, the execution envelope check, the test-immutability check, and the changed-path inventory (owner: `verifier`)
10. `PR-DESCRIPTION.md` — the drafted PR text, quoting the verified SHAs (owner: `pr`)
11. `PR.md` — the created PR URLs, the existing-PR check, the target branch's source, and the remote-SHA-equals-verified-SHA check (owner: `pr`)

Every artifact carries the same six-field YAML header (`artifact`, `run: PAYMENTS-12345`, `primaryJira: PAYMENTS-12345`, `status`, `producedBy`, `inputs`) and the fixed section headings defined for it in `.github/pipeline/AGENT-CONTRACTS.md`, with inline provenance tags (`[JIRA]`, `[REPO]`, `[DEV]`, `[TOOL]`, `[INFERENCE]`) on every factual line. The same keys, repositories, branch name, test paths, run commands, and commit SHAs appear consistently across all eleven files — cross-check any of them against `RUN.md` or `TEST-CONTRACT.md` at any point.

For what to compare this example (and every other asset in this repository) against the organization's internal pipeline, see [`docs/COMPARISON-GUIDE.md`](../../COMPARISON-GUIDE.md).
