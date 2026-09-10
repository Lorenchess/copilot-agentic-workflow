# Phase 1 — Core Pipeline Design & Reusable Copilot Assets
## Lean Contract (Fable → Sonnet handoff)

Status: approved by the owner 2026-09-09 (re-scope plus the verified commit invariant and artifact ownership rules); supersedes the archived Phase 1 architecture contract (see `docs/specs/archive/README.md` once R1 lands).

## 1. Purpose and success criterion

This repository is a **reference implementation and design laboratory** for the organization's existing internal AI pipeline. It is not a standalone executable pipeline and it does not reproduce infrastructure the organization already has (runtime state machinery, MCP configuration, recovery simulation, end-to-end harnesses).

Success criterion: at the end of Phase 1 the repository holds a coherent set of GitHub Copilot-native files that a team member can open at work and compare directly with the internal pipeline: agent definitions, skills, flow, agent contracts, guardrails, model roles, one worked example, and a comparison guide.

## 2. Binding constraints

- Copilot-native configuration-as-code only: `.agent.md`, `SKILL.md`, `copilot-instructions.md`, workspace settings, Markdown. No scripts, no `package.json`, no hooks, no application code, no MCP server configuration in this repo. If Sonnet believes code is unavoidable it stops and reports; writing it is an architecture violation.
- Every file must earn its place as a reusable, inspectable asset. Nothing is built only to prove this repository can run on its own.
- The archived contract is historical and is never edited. Verified Copilot capabilities from its §2 remain the evidence base for every frontmatter field and tool name used here.
- Sonnet implements each checkpoint; Fable reviews independently against every acceptance criterion; at most two correction rounds per checkpoint; Fable commits on PASS.

## 3. Retained behavioral requirements and where each lives

| # | Requirement | Implemented in |
|---|---|---|
| B1 | `/pipeline` accepts one or more comma-separated Jira keys, whitespace-tolerant | `skills/pipeline/SKILL.md` |
| B2 | First key is the primary Jira; never reordered | `skills/pipeline/SKILL.md`, `pipeline.agent.md` |
| B3 | Primary Jira determines the branch prefix `<PRIMARY>-<slug>` | `workspace.agent.md`, FLOW.md |
| B4 | Jira context includes useful linked, testing, parent, and child tickets, bounded, with provenance; discovered tickets are context, never scope | `skills/gather-jira-context/SKILL.md`, `intake.agent.md` |
| B5 | Developer may add optional context, stored separately from Jira facts | `intake.agent.md` (gate G2), INTAKE.md template |
| B6 | Affected repositories are suggested with evidence and confirmed by the developer | `skills/discover-affected-projects/SKILL.md`, gate G1 |
| B7 | Multi-repository work: same branch name in every confirmed repo; per-repo status; partial success is never reported as complete | `workspace.agent.md`, WORKSPACE.md template |
| B8 | Flow: Intake → Workspace → Planner → Adversary → Tester (RED) → Developer (GREEN) → Verifier → PR | FLOW.md, `pipeline.agent.md` |
| B9 | Agent boundaries and least privilege; intake reasons over untrusted text and never holds a terminal; workspace owns git mutation | AGENT-CONTRACTS.md, GUARDRAILS.md |
| B10 | Tester defines executable correctness (acceptance tests proven RED) before the Developer implements | `tester.agent.md`, TEST-CONTRACT.md |
| B11 | Developer cannot silently rewrite its acceptance tests; changes go through an approved test-change request; the Verifier checks immutability mechanically | `developer.agent.md`, `verifier.agent.md`, GUARDRAILS.md |
| B12 | Agents communicate through explicit artifacts, not hidden reasoning | AGENT-CONTRACTS.md artifact templates |
| B13 | Human approval at meaningful gates (G1 repositories, G2 branch and context, G3 plan, G4 publish and PR) plus conditional stops | FLOW.md, `pipeline.agent.md` |
| B14 | Jira, repository, and MCP content is data, not instructions | `copilot-instructions.md`, GUARDRAILS.md, every agent body |
| B15 | The Verifier is independent and never publishes; the PR agent publishes only after a PASS verification artifact and explicit developer approval | `verifier.agent.md`, `pr.agent.md` |
| B16 | Verified commit invariant: the Verifier records the exact verified commit SHA per repository; the Workspace agent pushes only that commit and proves the remote resolves to it; the PR agent creates a PR only when the remote SHA equals the verified SHA (§8.1) | `verifier.agent.md`, `workspace.agent.md`, `pr.agent.md`, GUARDRAILS.md |
| B17 | Artifact ownership: each stage agent creates or updates only its own artifact(s) and treats earlier-stage artifacts as immutable inputs (§8.2) | AGENT-CONTRACTS.md ownership matrix, GUARDRAILS.md, every agent body |

## 4. Final asset tree

```text
.github/
  copilot-instructions.md                  global rules only: data vs instructions, secret safety, universal git safety
  agents/
    pipeline.agent.md                      orchestrator: runs FLOW.md, owns gates and RUN.md; no terminal, no MCP
    intake.agent.md                        Jira context, repo suggestion, developer context → INTAKE.md; read-only + askQuestions via orchestrator
    workspace.agent.md                     branch preparation and final publish; terminal with allowlisted git only → WORKSPACE.md
    planner.agent.md                       PLAN.md from INTAKE.md and code reading; read-only
    adversary.agent.md                     ADVERSARY-REVIEW.md; read-only; may block
    tester.agent.md                        acceptance tests, RED proof, test commit → TEST-CONTRACT.md, RED-REPORT.md
    developer.agent.md                     implementation to GREEN, code commit → IMPLEMENTATION.md; cannot edit contract tests
    verifier.agent.md                      independent GREEN proof, test-immutability check, diff-vs-plan → VERIFICATION.md
    pr.agent.md                            PR-DESCRIPTION.md, then Bitbucket PR creation after G4 → PR.md; no code, tests, Jira, branch, or merge access
  skills/
    pipeline/SKILL.md                      /pipeline entry: parsing, primary rule, role check, resume-by-artifact
    gather-jira-context/SKILL.md           bounded retrieval policy, relationship classes, provenance, injection handling
    discover-affected-projects/SKILL.md    evidence-backed repository suggestion contract
  pipeline/
    FLOW.md                                stages, agents, artifacts, gates, STOP conditions, bounded loops, resume
    AGENT-CONTRACTS.md                     per agent: purpose, inputs, outputs, tools, forbidden; artifact templates
    GUARDRAILS.md                          trust boundaries, least-privilege table, git safety, test immutability, gates
    MODEL-ROLES.md                         model per role with reasoning; benchmark candidates (deferred)
.vscode/
  settings.json                            optional guardrail asset: terminal approval rules, edit approval for .github/.vscode
  extensions.json                          recommends GitHub Copilot Chat
docs/
  specs/2026-09-09-phase-1-core-pipeline-design-contract.md   this document
  specs/archive/README.md                  superseded notice, pointer here, what was not incorporated
  specs/archive/2026-09-09-phase-1-architecture-contract.md   byte-identical to commit 47c2df6
  specs/archive/c0-pipeline-docs/phase-1-contract.md          the C0 verbatim policy copy, unchanged
  specs/archive/c0-pipeline-docs/decisions.md                 the C0 verbatim decisions copy, unchanged
  examples/PAYMENTS-12345/                 worked example: one artifact per stage for a fictional ticket
  COMPARISON-GUIDE.md                      what to compare against the internal pipeline, file by file
  questions.md                             open questions (existing)
README.md, .gitignore                      existing; README rewritten for the new scope
.pipeline/runs/<PRIMARY-JIRA>/             run artifacts at runtime, gitignored (not shipped)
```

## 5. Pipeline flow

Stage agents run as subagents of `pipeline.agent.md` (stateless, isolated; they cannot ask the developer, so every gate and every conditional stop is voiced by the orchestrator). Each stage agent writes exactly one artifact into `.pipeline/runs/<PRIMARY-JIRA>/`; the orchestrator maintains `RUN.md` (keys, repositories, branch, stage status table).

| Stage | Agent | Reads | Writes | Gate or STOP |
|---|---|---|---|---|
| 0 Entry | skill + orchestrator | `/pipeline KEYS` | RUN.md | Invalid key → STOP. Existing run dir → propose resume at first missing or failed artifact; developer confirms. |
| 1 Intake | intake | Jira (read tools), workspace listing, README heads | INTAKE.md | **G1** repositories (developer authoritative); **G2** branch name and optional context |
| 2 Workspace | workspace | INTAKE.md | WORKSPACE.md | Per repo: dirty, existing branch, diverged default, unreachable remote, unknown default → STOP and ask. Never destructive. |
| 3 Plan | planner | INTAKE.md, code | PLAN.md | none |
| 4 Adversary | adversary | PLAN.md, INTAKE.md, code | ADVERSARY-REVIEW.md (APPROVE / REVISE / BLOCK) | REVISE → planner revises once; second REVISE or BLOCK → developer decides. **G3** plan approval. |
| 5 Test (RED) | tester | PLAN.md | test files in repos (committed), TEST-CONTRACT.md (paths, scenario mapping, RED commit per repo), RED-REPORT.md (run command, failing tests, reasons) | Tests that pass before implementation → STOP (not RED). |
| 6 Develop (GREEN) | developer | PLAN.md, TEST-CONTRACT.md, RED-REPORT.md (immutable) | code (committed), IMPLEMENTATION.md | Contract test needs changing → TEST-CHANGE-REQUEST in IMPLEMENTATION.md → STOP for developer decision → tester amends, new RED, TEST-CONTRACT.md and RED-REPORT.md amended by the tester only. |
| 7 Verify | verifier | all above, repos | VERIFICATION.md (PASS / FAIL) including the **verified commit SHA per repository** from `git rev-parse HEAD` on the feature branch | FAIL → developer fixes, at most two rounds, then STOP. |
| 8 PR draft | pr | PLAN.md, VERIFICATION.md, INTAKE.md (all immutable) | PR-DESCRIPTION.md | **G4** developer approves publish and PR, seeing the description, the diff summary, and the verified SHAs. |
| 9 Publish | workspace | VERIFICATION.md (immutable), WORKSPACE.md | WORKSPACE.md updated (Publish section) | Per repo, in order: read the verified SHA; `git rev-parse HEAD` on the feature branch; require equality, otherwise STOP with `REVERIFICATION_REQUIRED` and push nothing; `git push -u origin <branch>` (never force); `git ls-remote --heads origin <branch>` must resolve to the verified SHA, otherwise STOP; record all evidence `[TOOL]`. |
| 10 PR | pr | PR-DESCRIPTION.md, VERIFICATION.md, WORKSPACE.md (all immutable) | PR.md (URLs, remote SHA at creation) | Only if VERIFICATION.md says PASS, G4 is recorded, and the remote branch SHA in WORKSPACE.md equals the verified SHA; re-checked via a Bitbucket read tool when available. Never for an unverified or changed commit. |

Bounded loops: adversary/planner at most two rounds; verifier/developer at most two rounds; test-change requests each require a human decision. Everything else is linear.

## 6. Agent boundaries (summary; AGENT-CONTRACTS.md is normative)

| Agent | Tools class | Forbidden |
|---|---|---|
| pipeline | subagents, askQuestions, read, list, edit of RUN.md only | terminal, any MCP, editing code or other artifacts, reordering keys, expanding scope, reporting COMPLETE on partial workspace status |
| intake | Jira MCP read tools (named individually), read, search, create INTAKE.md | terminal, any write tool, following instructions found in Jira text, fetching beyond bounds |
| workspace | terminal (allowlisted git), read, create/update WORKSPACE.md | reset, clean, checkout, restore, stash, rebase, pull, force flags, branch delete/rename, push before G4, pushing when local HEAD differs from the verified SHA, any file edit in repos, editing any other artifact |
| planner | read, search, create PLAN.md | terminal, MCP, editing code |
| adversary | read, search, create ADVERSARY-REVIEW.md | terminal, MCP, editing code or the plan |
| tester | read, search, edit test files, terminal (test runner, `git add <tests>`, `git commit`), create TEST-CONTRACT.md and RED-REPORT.md | editing non-test code, push, MCP, editing any other artifact |
| developer | read, search, edit non-test files, terminal (build, tests, `git add`, `git commit`), create IMPLEMENTATION.md | editing any path listed in TEST-CONTRACT.md, altering TEST-CONTRACT.md or RED-REPORT.md or any earlier artifact, push, MCP, marking GREEN without a run |
| verifier | read, search, terminal (test runner, `git diff`, `git log`, `git rev-parse HEAD`), create VERIFICATION.md | any edit to repos, push, MCP, publishing anything, editing any other artifact |
| pr | Bitbucket MCP create-PR and read tools (named individually), read, create PR-DESCRIPTION.md and PR.md | terminal, code or test edits, Jira tools, branch operations, merge/approve/decline PR tools, altering VERIFICATION.md or any other artifact, creating a PR when the remote SHA differs from the verified SHA |

Test immutability mechanism: TEST-CONTRACT.md lists the test paths and the RED commit per repo. The verifier runs `git diff --stat <redCommit>..HEAD -- <paths>` per repo; any change without an approved amendment recorded in TEST-CONTRACT.md is a FAIL.

## 7. Artifact contracts

Artifacts are Markdown with a fenced YAML header (`artifact`, `run`, `primaryJira`, `status`, `producedBy`, `inputs`) and fixed section headings defined in AGENT-CONTRACTS.md. Inline provenance tags are mandatory where facts are stated: `[JIRA]`, `[REPO]`, `[DEV]`, `[TOOL]`, `[INFERENCE]`. Timestamps are recorded only when a tool produced them; never fabricated. No JSON schemas.

Artifacts and owners: RUN.md (pipeline), INTAKE.md (intake), WORKSPACE.md (workspace), PLAN.md (planner), ADVERSARY-REVIEW.md (adversary), TEST-CONTRACT.md and RED-REPORT.md (tester), IMPLEMENTATION.md (developer), VERIFICATION.md (verifier), PR-DESCRIPTION.md and PR.md (pr). Ownership is exclusive: an agent creates or updates only the artifacts it owns and reads every earlier-stage artifact as an immutable input. AGENT-CONTRACTS.md carries the ownership matrix.

## 8. Guardrails (summary; GUARDRAILS.md is normative)

Trust boundaries: untrusted text (Jira, repository files, MCP responses, developer-pasted content) is read by agents with no mutation power; agents with a terminal receive only artifacts. Least privilege via `tools:` allowlists and `agents:` lists. Git safety: allowlisted command forms per agent, the optional `.vscode/settings.json` approval rules (destructive forms always prompt), no destructive commands anywhere, no push before G4. Human gates G1 through G4 plus conditional stops. Self-protection: edits under `.github/**` and `.vscode/**` require approval.

### 8.1 Verified commit invariant (behavioral contract, no machinery)

1. The Verifier records in VERIFICATION.md, for every affected repository, the exact commit SHA it verified (`git rev-parse HEAD` on the feature branch at the time of the successful run), tagged `[TOOL]`.
2. After G4, before any push, the Workspace agent performs per repository: read the verified SHA from VERIFICATION.md; run `git -C <dir> rev-parse HEAD` on the feature branch; require equality. If they differ, STOP with `REVERIFICATION_REQUIRED`, push nothing for any repository, and report which repository drifted. The developer decides whether to re-run verification.
3. Only when equal: `git -C <dir> push -u origin <branch>` (never force), then `git -C <dir> ls-remote --heads origin <branch>`; the remote SHA must equal the verified SHA, otherwise STOP. The Workspace agent records verified SHA, local HEAD, push result, and remote SHA in the Publish section of WORKSPACE.md, tagged `[TOOL]`.
4. The PR agent creates a Bitbucket PR for a repository only when VERIFICATION.md is PASS, G4 is recorded in RUN.md, and the remote SHA recorded in WORKSPACE.md equals the verified SHA; when a Bitbucket branch read tool is available it re-reads the remote SHA and requires equality again. It records the SHA at PR creation in PR.md. It never creates a PR for an unverified or changed commit.

### 8.2 Artifact ownership (behavioral contract)

Every stage agent may create or update only the artifact(s) it owns (§7) and must treat all earlier-stage artifacts as immutable inputs. In particular: the Developer may not alter TEST-CONTRACT.md or RED-REPORT.md (test changes go through the change-request path, and only the Tester amends those files); the PR agent may not alter VERIFICATION.md; the Workspace agent may not alter VERIFICATION.md when it reads the verified SHA; the orchestrator edits only RUN.md. The Verifier treats any edit to an earlier artifact by a later agent as a FAIL finding when it can detect it from the artifact history recorded in RUN.md.

## 9. Model roles (summary; MODEL-ROLES.md is normative)

First implementation: Sonnet-5 for every role, `model:` omitted until the exact picker string is confirmed at work (developers select Sonnet-5 in the picker). MODEL-ROLES.md records per-role reasoning needs and candidates: Opus-5 for adversary and planner if plan quality is the bottleneck; Haiku 4.5 for intake extraction; all as deferred benchmarks, none as initial fallbacks.

## 10. Checkpoints

**R1 — Design documents and housekeeping.**
Files: `.github/pipeline/FLOW.md`, `AGENT-CONTRACTS.md`, `GUARDRAILS.md`, `MODEL-ROLES.md`; `.github/copilot-instructions.md` (global only); `docs/specs/archive/` (README plus the three archived files, moved with `git mv`); deletion of `docs/testing/c1-settings.md`, `.github/pipeline/docs/mcp-capabilities.md`, `.github/pipeline/docs/models.md` after folding their content (MCP capability expectations into AGENT-CONTRACTS.md intake and pr sections; model text into MODEL-ROLES.md); README rewritten for the new scope; `docs/questions.md` rows marked deferred.
Acceptance: every B-requirement (B1–B17) maps to a named section; every stage in FLOW.md has reads, writes, and gate or STOP, including the §8.1 publish sequence and `REVERIFICATION_REQUIRED`; every agent in AGENT-CONTRACTS.md has purpose, inputs, outputs, tools, forbidden, and its artifact template, and the file carries an explicit artifact-ownership matrix (owner per artifact, "immutable input" for everyone else); GUARDRAILS.md contains the least-privilege table, the test-immutability mechanism, the verified commit invariant (§8.1), and the artifact-ownership rule (§8.2); archived files are byte-identical to commit 47c2df6 (`git diff 47c2df6:<old path> <new path>` empty); no runtime infrastructure described; `copilot-instructions.md` under 60 lines with no pipeline-specific rule.
Must not: create agents or skills; edit the archived files; add schemas, state files, or test suites.

**R2 — Agents.**
Files: the nine `.agent.md` files; `.vscode/settings.json` extended with the tester, developer, and publish git forms (`git -C <dir> add <path>`, `git -C <dir> commit -m <msg>`, `git -C <dir> diff …`, `git -C <dir> log …`, `git -C <dir> push -u origin <branch>`), reviewed offline by Fable, no test log.
Acceptance: frontmatter uses only verified fields (`name`, `description`, `tools`, `agents`, `user-invocable`, `disable-model-invocation`, `handoffs`); tools match AGENT-CONTRACTS.md exactly; each body contains its identity line, artifact template, STOP conditions, its own out-of-scope list, and the ownership rule (own artifacts only, earlier artifacts immutable); developer body forbids editing TEST-CONTRACT paths and altering TEST-CONTRACT.md or RED-REPORT.md, and defines the change-request path; verifier body performs the `git diff` immutability check and records the verified SHA per repository; workspace body implements the §8.1 publish sequence with `REVERIFICATION_REQUIRED`; pr body requires PASS, G4, and remote SHA equal to verified SHA, and lists no merge tool; orchestrator `agents:` equals the eight stage agents and its gates match FLOW.md; a smoke check that the agents appear in the Copilot Chat agent picker is recorded when a VS Code session is available, otherwise marked pending.
Must not: add MCP configuration; give any agent tools beyond its contract; add `model:` before the picker string is confirmed.

**R3 — Skills, worked example, comparison guide.**
Files: the three skills; `docs/examples/PAYMENTS-12345/` with one artifact per stage (RUN through PR) for a fictional two-repository ticket; `docs/COMPARISON-GUIDE.md`; final README pass.
Acceptance: `/pipeline` parsing examples cover whitespace, duplicates, invalid keys, and the primary rule; the Jira skill states bounds (depth 1, max related, comment limits), relationship classes, provenance, and injection handling; the discovery skill states input, output, evidence types, confidence rules, and failure behavior; every example artifact follows its template and shows provenance tags, a G1 recommendation versus selection, a RED and a GREEN report, a verification with the immutability check, and PR text; the comparison guide gives, per asset, what to look at and the questions to ask of the internal pipeline.
Must not: build an execution harness; add scripts; expand beyond the asset tree.

## 11. Disposition of prior work

Preserved unchanged: commit 47c2df6 (C0). The old contract and the two C0 copies move to `docs/specs/archive/` byte-identical; `docs/specs/archive/README.md` explains that they are superseded by this contract and states explicitly that the slot amendment approved during the C1 review (`<dir>` slot tightened to start alphanumeric) was **not** incorporated into the archived text and instead lives in GUARDRAILS.md and `.vscode/settings.json`.

Retained from the unfinished C1 work: `.vscode/settings.json` (re-verified and extended in R2), `.vscode/extensions.json`, the README MCP note (rewritten in R1), the two `docs/questions.md` rows (marked deferred).

Deleted in R1: `docs/testing/c1-settings.md`; `.github/pipeline/docs/mcp-capabilities.md` and `models.md` after their content is folded.

## 12. Deferred

Hooks hardening; quoted-path support for repository directory names; model benchmarks; org-level agent distribution; Agent Host portability; confirming exact Jira and Bitbucket MCP tool names and the model picker string (needed only when running at work); any runtime resumability beyond artifact presence.

## 13. Open questions for the owner (non-blocking)

1. Test runner conventions differ per repository; the tester and developer bodies will detect the runner from build files and otherwise ask. Confirm that is acceptable for the reference implementation.
2. Whether the worked example should use a Java/Maven-style repository pair (assumed, given the Payments domain) or another stack.

## 14. Amendments

**2026-09-10 (owner, post-R2 consistency correction; commit follows R2 `645d637`).** Two targeted corrections, no re-scope:

1. **INTAKE.md is written once and is immutable thereafter.** It holds Jira and repository evidence and the intake recommendation (including the *proposed* branch name). The G1/G2 developer decisions — confirmed repositories, confirmed branch name, optional developer context — are recorded only in RUN.md, owned by `pipeline`. `intake` is not invoked a second time to copy those decisions. Downstream agents that need the confirmed decisions (`workspace` at stage 2, `planner`, `adversary`) read INTAKE.md for evidence and RUN.md for decisions, both as immutable inputs. This amends B5's "Implemented in" column (developer context lives in RUN.md, still stored separately from Jira facts), the INTAKE.md and RUN.md templates in AGENT-CONTRACTS.md, the ownership matrix (RUN.md becomes an input for `planner` and `adversary`), and the stage 1–3 reads in §5 and FLOW.md. Ownership is unchanged: `pipeline` edits only RUN.md, `intake` edits only INTAKE.md.
2. **`TESTS_NOT_RED` is bounded and developer-decided.** An acceptance test that passes on its first run is first investigated and corrected by `tester` within at most two correction attempts, re-proving RED each time. `tester` never weakens an acceptance criterion to manufacture RED. Only when legitimate RED (failure caused by the missing acceptance behavior, not compilation, setup, or infrastructure) cannot be established does `tester` record `TESTS_NOT_RED` for `pipeline` to raise; the decision is the developer's (behavior already exists, criterion is wrong, or the test needs redesign).

Also corrected: GUARDRAILS.md no longer lists "the test runner" among the `.vscode/settings.json` forms R2 added; test/build runner commands intentionally remain non-auto-approved and prompt in Manual mode. The Copilot agent-picker smoke check remains deferred and does not block R3.

**2026-09-10 (owner, post-Astra remediation; commits follow R3 `7a0861b`).** Five amendments arising from the independent architecture audit and the owner-approved Fable remediation plan. They correct evidence bindings, test-integrity rules, recovery semantics, and security claims. They add no runtime, schema, state machine, or script; every change is a contract statement, an agent procedure step, an allowlisted read-only git form, or an artifact template section. The nine roles, eleven artifacts, and every decision listed under "What we will not change" in the remediation plan stand.

**A3 — Verified input, approval, and publication binding (amends §5 stages 2, 7, 9, 10; §6 workspace, verifier, pr; §8.1).**
- Verifier: before any test execution it requires a clean checkout (`git -C <dir> status --porcelain=v2 --branch` with no modified or untracked entries) and records `git -C <dir> rev-parse HEAD`; after all execution it re-runs both and requires the same HEAD and a clean state, otherwise FAIL. Ignored build outputs are not purged (clean is forbidden) and are a stated host-environment limitation.
- G4 records, per repository: repository directory, current push destination (from `git -C <dir> remote -v`), source branch, verified SHA, target (default) branch, and publish mode. The developer approves that tuple, not a bare answer.
- Publish (§8.1 steps 2–3 replaced): step 0 requires G4 = `PUBLISH_AND_PR` or `PUBLISH_ONLY` (`G4_NOT_RECORDED`); step 1, for every repository before any push, re-reads the current push destination, current branch, current HEAD, and current default branch and requires each to equal the G4 tuple and the current VERIFICATION.md SHA — a HEAD mismatch is `REVERIFICATION_REQUIRED`, any other mismatch is `G4_STALE`; either STOP pushes nothing for any repository. Only when every repository passes does step 2 run per repository: `git -C <dir> push origin <verifiedSHA>:refs/heads/<branch>` (explicit verified object as source, never a branch name, never force, no `-u`), then `git -C <dir> ls-remote --heads origin <branch>` must equal the verified SHA (`REMOTE_SHA_MISMATCH`). The guarantee is stated exactly: the pushed object is the verified commit; protection of the branch after publication belongs to the server.
- Stage 2: after `merge --ff-only origin/<default>`, `git -C <dir> rev-list --left-right --count origin/<default>...<default>` must be `0 0`, otherwise STOP `WORKSPACE_DEFAULT_AHEAD`; the baseline recorded in WORKSPACE.md is the `origin/<default>` SHA.
- PR agent: the Bitbucket read capability is required; without it no PR is created automatically and the blocking condition is reported. Before creating, it reads existing PRs for the source branch and records an existing one rather than creating a duplicate. The target branch is the default branch recorded in WORKSPACE.md. PR.md records whether its SHA was read before or after creation.

**A4 — Test contract semantics (amends §5 stages 5–7; §6 tester, developer, verifier; §8 test-immutability summary).**
- Every acceptance test is classified in TEST-CONTRACT.md as a missing-behavior *witness* (must be proven RED) or a *preservation* constraint (expected to pass before and after). §5 stage 5's "tests that pass before implementation → STOP" applies to witnesses only. A change with no testable boundary without scaffolding is STOP `TEST_BOUNDARY_MISSING` (developer decides).
- TEST-CONTRACT.md records the *execution envelope*: the exact contract command per repository, the build/test configuration files, and the helper and fixture paths the tests depend on. The developer may change envelope files but must list and justify each change in IMPLEMENTATION.md.
- Amendments record the approved delta, the active protected paths, the active anchor SHA, and the observed result per amended test. A test that passes against the current tree is recorded as passing and is never labelled RED. The verifier uses the latest amendment's anchor and paths.
- Verifier executes twice, both required for PASS: (A) the exact contract command, confirming each named test was discovered, executed, not skipped, and produced its classified result; (B) the repository's independently detected full suite/build, to prove no broader regression. Envelope files are diffed since the active anchor; each change is a finding and an unjustified change is FAIL.
- Tests assert the observable business outcome, not a proxy.

**A5 — Verifier change evidence (amends §6 verifier).** Allowed read-only forms add `git -C <dir> diff --stat <base>..HEAD`, `git -C <dir> diff --name-status <base>..HEAD`, and `git -C <dir> diff <base>..HEAD` (with optional `-- <paths>`), where `<base>` is the baseline SHA in WORKSPACE.md. VERIFICATION.md records the changed-path inventory and classifies every path as planned, envelope, or unrelated.

**A6 — Resume lineage, loop budgets, tool alignment (amends §5 bounded loops and stage 0; §6 planner, adversary, verifier, developer).**
- RUN.md carries an Artifact history (artifact, stage, round, ACTIVE or SUPERSEDED) and round counters. Resume point is the earlier of the first missing or failed artifact and the first unanswered gate; the requested key list must equal RUN.md's Keys (`RUN_KEYS_MISMATCH`); redoing an artifact marks every later-stage artifact SUPERSEDED.
- Budgets: one initial attempt plus at most two fix rounds; `VERIFIER_FAIL_LIMIT` on the third FAIL. Authorized regenerations: planner round 2, developer fix rounds, tester amendments and RED re-proofs, verifier re-runs. The developer receives VERIFICATION.md on fix rounds.
- `RUNNER_UNAVAILABLE` is raised only when a meaningful test/build execution cannot be obtained because the execution mechanism or required environment is unavailable (runner missing or cannot launch, required tooling or dependency unobtainable in the environment, required external infrastructure unavailable, or another environment condition that prevents a valid result). An assertion failure, a legitimate RED, a regression failure, a compilation or build failure caused by the code, or a full-suite failure caused by the implementation is never `RUNNER_UNAVAILABLE`; those remain RED, implementation failure, or verification FAIL evidence for their stage. Environment inability is never RED, GREEN, or PASS.
- Planner, adversary, and verifier hold `edit/editFiles` in addition to `edit/createFile`, restricted by contract to their own artifact.

**A7 — Trust model wording (amends §8 trust boundaries).** Jira and MCP retrieval are isolated by role in `intake` and `pr`. Repository content, every artifact, and every tool output are untrusted data wherever consumed; tool allowlists remove tools, agent prose restricts commands and paths, and anything stronger must be enforced by the host environment. INTAKE.md is consumed only by `pipeline`, `planner`, `adversary`, and `pr`; the terminal-holding `workspace` and `verifier` agents do not receive it. §8's "agents with a terminal receive only artifacts" is read as "receive only artifacts, which remain data, not instructions". GUARDRAILS.md states the host-environment assumptions (test execution runs repository-controlled code; hooks and build scripts act beyond their command names; ignored outputs are not purged; server branch protection governs post-publication; regex approval is a best-effort backstop).
