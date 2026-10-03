# RSTACK SDLC — build batches, references, and acceptance

**Status:** Execution plan for [README](README.md). It governs this standalone S0–S6 build, not the previous RSTACK migration. Each batch requires its own acceptance; completing guidance does not authorize implementation of every batch at once.

## Contents

- [1. Batch rules](#1-batch-rules)
- [2. S0: focused reference and implementation decisions](#2-s0-focused-reference-and-implementation-decisions)
- [3. S1: runnable core and local boundaries](#3-s1-runnable-core-and-local-boundaries)
- [4. S2: planning and the human-controlled audit loop](#4-s2-planning-and-the-human-controlled-audit-loop)
- [5. S3: proof to reviewed candidate and local proposal](#5-s3-proof-to-reviewed-candidate-and-local-proposal)
- [6. S4: independent evaluations](#6-s4-independent-evaluations)
- [7. S5: extension and packaging challenge](#7-s5-extension-and-packaging-challenge)
- [8. S6: VS Code acceptance and local pilot](#8-s6-vs-code-acceptance-and-local-pilot)
- [9. Fixture catalog](#9-fixture-catalog)
- [10. Measurement and completion](#10-measurement-and-completion)

## 1. Batch rules

Write only inside `rstack-sdlc/`. Preserve the existing pipeline, parent host settings, shared manifests, and unrelated dirty work. No legacy move, real ticket execution, remote PR, migration parser, or Jira/Bitbucket investigation.

Use one approved branch and one implementation session initially. Do not create unexplained worktrees or switch a checkout another session is using. Each batch has a baseline, allowed files, runnable result, tests, and targeted rollback. A known baseline failure stays disclosed; do not fix unrelated problems inside the batch.

Keep one primary behavior per sub-batch. Required producers, schemas, consumers, and tests may change together, but isolate model/effort experiments from prompt/architecture changes. Use S2a/S2b for bounded substeps, not another project tree. Parallelize only against frozen interfaces, disjoint writes, isolated test outputs, and one integrator.

At completion, recommend KEEP, REVERT, or INCONCLUSIVE and stop for the owner. Build docs are not runtime safety controls. Mocks prove contracts, not real-host behavior. No stage passes solely because files exist.

## 2. S0: focused reference and implementation decisions

**Goal:** Resolve a few implementation decisions, not launch another broad research program. Record repository/package identity and dirty state; no existing-pipeline ownership audit or migration prerequisite.

### AWS reference set

Primary reference: [awslabs/aidlc-workflows](https://github.com/awslabs/aidlc-workflows).

Preparation inspected revision **`30fe4b251eadd3d24d7f08ef4ed9cc9a43b91757`** on 2026-10-03. Use that revision for a reproducible starting point or record a deliberately selected newer revision. Do not silently mix documentation and code from different commits.

Read these focused sources and then trace only the mechanics relevant to the first slice:

| Source | Investigation question |
|---|---|
| [Pinned README](https://github.com/awslabs/aidlc-workflows/blob/30fe4b251eadd3d24d7f08ef4ed9cc9a43b91757/README.md) | How are authored core, harness-specific input, generated distribution, and tests separated? |
| [Architecture reference](https://github.com/awslabs/aidlc-workflows/blob/30fe4b251eadd3d24d7f08ef4ed9cc9a43b91757/docs/reference/01-architecture.md) | Which claims are design conventions, actual controls, or host-specific descriptions? |
| [Copilot harness guide](https://github.com/awslabs/aidlc-workflows/blob/30fe4b251eadd3d24d7f08ef4ed9cc9a43b91757/docs/guide/harnesses/copilot.md) | How does neutral code become discoverable Copilot agents/Skills/hooks? Which claims distinguish VS Code from CLI? |
| `core/`, `harness/copilot/`, `scripts/package.ts`, relevant tests at that revision | Trace one dispatch/state boundary and one generation path to their tests. Resolve actual filenames from the repository rather than inventing them. |
| [License](https://github.com/awslabs/aidlc-workflows/blob/30fe4b251eadd3d24d7f08ef4ed9cc9a43b91757/LICENSE) | Establish reuse terms and provenance before adapting any code; inspect third-party terms separately. |

The inspected README describes authored core and thin harness inputs with derived distributions. Its architecture text also explicitly describes some immutability as a convention in editable files. That distinction is important: do not promote a convention into a security guarantee. The reference is inspiration and source evidence, not proof our target host works.

Produce a short table: pattern, exact source/revision, ADAPT/DEFER/REJECT, reason, and proving test. Prefer adapted ideas over copying the project. Do not import the whole agent/stage roster, automatic learned-rule behavior, model recommendation, installer, approval scheme, or optional workflow machinery.

Two focused supplementary references are sufficient:
- [Anthropic capture intent](https://academy.claude.com/courses/ai-native-sdlc-playbook/capture-intent) — an explicit human-reviewed intent artifact; our local authority and storage contract still governs.
- [Anthropic Skill authoring](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — concise task-specific guidance, appropriate freedom, and discoverable references; test behavior rather than enforce a mythical 100-line truncation limit.

Do not run upstream installers or download a whole dependency stack just to read sources. Missing external source access is a documented limitation, not permission to fabricate findings or an indefinite blocker to local engine design.

**Deliver:** one short `docs/decisions.md` entry covering implementation runtime, canonical package, initial interfaces, reference decisions, first profile, proposed Copilot transport, and host unknowns; one initial `docs/progress.md` entry. No new documentation suite.

**Pass:** scope excludes migration and live services; initial core tests need no model; actual VS Code transport is identified or explicitly unverified. The builder understands how to continue local work without credentials.

## 3. S1: runnable core and local boundaries

Implement versioned run/task/result records, one authoritative state model, expected-version updates, bounded attempts, reference/identity validation, crash-safe persistence, and actual package-local start/status/submit/resume commands or equivalent API entry points.

Add a local request adapter, local proposal representation, fake role transport, and disabled Jira/Bitbucket stubs. Do not initialize deferred integrations in the normal local flow. Record profile/input identities from the first run. Keep source code and tests independent of external services.

**Deliver:** a runnable synthetic state sequence plus adversarial tests for invalid schema, stale identity, duplicate/out-of-order results, concurrent submissions, interrupted persistence, and missing input. Fake transport supports success, negative result, malformed reply, refusal, timeout, and repeated delivery.

**Pass:** invalid transitions do not advance; identical retries are deduplicated; conflicting duplicates are rejected; resume preserves accepted work and audit budget. Status/read operations never dispatch new work. Selecting a deferred adapter performs no network or credential lookup and returns NOT_CONFIGURED. Default local flow remains usable.

**Rollback:** revert only S1-owned package changes; retain baseline and failed test evidence. These are core tests, not proof that Copilot cannot bypass the engine.

## 4. S2: planning and the human-controlled audit loop

Implement local source → short intent → specification → compact plan → independent audit → combined HTML → human decision. Use the synthetic export request in 01, including a variant with missing disabled-response intent. Build the narrow coordinator/role transport and generated planning package for VS Code; test it early where the host is available.

Required paths: agreeing first audit; refuted first audit; exact human amendments without re-audit; human-requested second round; pause/reject; session interruption and resume; stale approval subject. Both completed audits end at a human checkpoint. Do not preload the fresh Auditor with prior rebuttal or implementation persuasion.

**Deliver:** a repeatable demonstration, preserved plan/audit/decision identities, generated safe HTML, and a basic independent evaluation of one synthetic run. Missing native-host access leaves explicit package/contract results and a pending smoke test, not a fabricated successful invocation.

**Pass:** no premature brief, no automatic round two/three, no replay after resume, and no false audit coverage after amendments. Human 'no more audit' is not silently implementation approval. An input script in a plan cannot execute in HTML. Required unresolved product decisions block the relevant step.

## 5. S3: proof to reviewed candidate and local proposal

Use a disposable synthetic application with a small, explicit build/test command; one application language proves the slice without making it a core dependency. Add Tester, Developer, candidate verification, fresh Reviewer, and deterministic local PR proposal assembly.

Derive tests from the approved spec and source, not only Planner prose. Ensure tests execute the intended assertion, protect proof/governance, and detect stale source or evidence. Documentation/already-satisfied cases need legitimate verification rather than manufactured failures.

**Deliver:** first complete local request-to-reviewed-candidate-to-proposal path plus negative paths. Proposal includes exact base/candidate and required review/evidence references. No push, remote PR creation, merge, or deployment.

**Pass:** compile/setup failures are not valid red; attempted proof weakening is prevented where supported or detected with an explicit host limitation; changed candidate/environment/packet invalidates dependent evidence. Terminal status is PR_PROPOSAL_READY with publication NOT_ATTEMPTED. Deferred adapters remain unused.

## 6. S4: independent evaluations

Implement a small evaluator input/output contract and initially use a fresh Fable/Claude session as an external judge. Read a frozen run plus rubric and write only `evaluation/<evaluation-id>/`; do not change execution artifacts or teach the ongoing run from its own score.

Retain evaluator/rubric/profile/source/run identities and evidence references. Re-evaluation creates another result. Append human adjudication without overwriting original AI labels. Separate mechanical validation, semantic quality, actual host observation, and human decisions.

**Deliver:** evaluations of clean, defective, incomplete, and failed synthetic runs; one compact cross-run summary; a small human-adjudicated calibration set. No dashboard, Laminar deployment, external metrics server, or legacy-data import is required.

**Pass:** evidence digest unchanged after evaluation; unknown measurements remain unavailable; repeated imports do not inflate counts; previous judgments remain accessible. Each metric has a denominator and provenance, not just a numeric score.

## 7. S5: extension and packaging challenge

Substitute a second fake adapter and an alternate model profile without editing core lifecycle code. Add/remove one optional procedure through the existing Skill interface. Retire a synthetic obsolete instruction and prove the required behavior remains while the retired text no longer loads. Do not change current real-host selection during an experiment without approval.

Implement reproducible VS Code packaging under `dist/copilot-vscode/`, source attribution, dry-run installation, owned-path collision checks, drift detection, and uninstall/rollback that preserves user edits. Keep current root `.github`/`.vscode` unchanged. No new real host or service integration is required.

**Deliver:** passing replacement/retirement tests and a package installable in an approved disposable sample workspace.

**Pass:** provider/model/IDE details remain outside core; unsupported settings/schema versions fail explicitly; no silent fallback or broadened permissions; generation twice from identical inputs is stable. Distribution excludes build guidance, old pipeline, private evidence, and unused integrations.

## 8. S6: VS Code acceptance and local pilot

Run the published smoke procedure on the actual VS Code Copilot session/harness and record its versions, observed tools, model/effort reporting, discovered customizations, role transport, and known limits. Exercise the full local workflow and at least the critical negative cases. Bound task count and actual usage with the owner.

Use approved synthetic fixtures, not employer repositories. Keep the agreed model/profile fixed during architecture comparison. A later model or effort comparison is a distinct experiment.

**Deliver:** install/use/resume/remove instructions, measured local pilot outcomes, independent review of the batch evidence, and a recommendation to use the package for the demonstrated local scope.

**Pass:** host behavior actually observed; human checkpoints preserved; no unresolved critical control failures; existing pipeline untouched; Jira/Bitbucket remain intentionally deferred. If host access is unavailable, conclude CORE/PACKAGE TESTED, COPILOT VALIDATION PENDING—not complete target-host acceptance.

Future real Jira/Bitbucket integration is a separate owner-requested batch. S6 does not silently enable it.

## 9. Fixture catalog

Add fixtures beside the batch that first implements the behavior. Keep tests focused; do not build every fixture before the first engine runs.

| ID | Scenario | Required outcome |
|---|---|---|
| SCOPE-1 | Build/generation attempts to write outside `rstack-sdlc/` | Test fails; old pipeline and root configuration untouched |
| CORE-1 | Result belongs to another run/role/input version | Reject, retain evidence, no transition |
| CORE-2 | Crash after accepted result, before response | Resume without redispatching accepted work |
| CORE-3 | Two writers submit against one state version | One accepted update; no heuristic state merge |
| CORE-4 | User requests status or selects another record only | No stage starts merely because a hook expects progress |
| PLAN-1 | Required product behavior omitted | Ask; no invented acceptance criterion |
| PLAN-2 | Auditor agrees | Combined brief followed by human wait |
| PLAN-3 | Refuted plan; exact amendments approved, no re-audit | Preserve verdict; disclose final non-reaudited changes |
| PLAN-4 | Second round authorized, then resume | One second audit; final human checkpoint; no third |
| PLAN-5 | Source/plan changes while approval is pending | Reject stale decision basis |
| PROOF-1 | Compilation failure or vacuous test | Not accepted as discriminating behavioral proof |
| PROOF-2 | Developer changes a controlled test or governance | Enforce available boundary; otherwise detect/stop and disclose limitation |
| REVIEW-1 | Same Git SHA, changed proof environment or packet | Re-establish dependent verification/review |
| SECURITY-1 | Prompt injection in request, file, log, or reference | Untrusted data cannot grant authority or leak secrets |
| SECURITY-2 | Escaping path/symlink or HTML script payload | Reject unsafe path; escape rendered data |
| STUB-1 | Jira/Bitbucket selected without configuration | Immediate explicit deferred result, zero network calls |
| STUB-2 | Normal local end-to-end run | No deferred adapter initialization or credential prompts |
| MODEL-1 | Unknown selector or unsupported effort/fallback | Explicit limitation/decision; no false effective model claim |
| RETRIEVAL-1 | Necessary rule late in a direct reference | Retrieve/apply it, or stop visibly; no assumed cutoff |
| EVAL-1 | Two judges or repeated imports evaluate one run | Original evidence intact; versions kept; no double-counting |
| PACKAGE-1 | Existing destination file modified by user | Installer/uninstaller preserves it or stops on collision |

Where a deterministic guard is safety-relevant, demonstrate test sensitivity with an isolated test-only mutation: break the guard and confirm the fixture fails for the expected reason, then restore it. Never weaken a live guard or make a real external write for a test.

## 10. Measurement and completion

Record source/profile/rubric versions, intended versus observed model/effort, host identity, exact fixture, outcome, attempts, material errors, human repair/wait, references actually read where visible, and observed input/output usage. Measure total run effort including retries and failed attempts. Stored bytes and line counts are diagnostics, not token bills.

Use paired tasks and fresh contexts; keep model, effort, tools, evaluator, and request/source constant when testing prompt architecture. Include clean cases to catch over-refutation, known defects to measure misses, held-out cases, and repeated stochastic trials. Do not count multiple claims from one request as independent tickets. Report uncertainty and missing-data coverage.

Critical authority violations, corrupted state, false evidence, lost work, or skipped human gates fail acceptance regardless of average quality or token savings. No improvement claim from one successful synthetic run or a cleaner file tree.

Keep one progress index and short batch records under `docs/`. Each states: scope, baseline, files changed, generated outputs, tests actually run, observed results, unverified capabilities, regression risks, rollback, and proposed next batch. Do not copy the full architecture into every report.

**Completion target:** a maintainable local-request-to-reviewed-candidate-and-PR-proposal workflow on one verified VS Code Copilot surface, with independent evaluations and replaceable service stubs. It does not migrate, replace, install into, or certify the user's workplace pipeline.
