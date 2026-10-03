# RSTACK rebuild: small batches and proof of progress

**Date:** 2026-10-02. **Owner:** This document orders work authorized by the [master assignment](README.md). It replaces the old in-place Batch 0–14 schedule for this rebuild; it does not authorize every batch at once.

## Contents

- [Execution rules](#execution-rules)
- [N0: preserve and retire legacy](#n0-preserve-and-retire-legacy)
- [N1: executable foundation](#n1-executable-foundation)
- [N2: complete planning and human-decision slice](#n2-complete-planning-and-human-decision-slice)
- [N3: proof through reviewed candidate](#n3-proof-through-reviewed-candidate)
- [N4: independent post-run evaluations](#n4-independent-post-run-evaluations)
- [N5: extension and packaging challenge](#n5-extension-and-packaging-challenge)
- [N6: controlled pilot and promotion](#n6-controlled-pilot-and-promotion)
- [Acceptance fixtures](#acceptance-fixtures)
- [Measurement and batch handoff](#measurement-and-batch-handoff)

## Execution rules

Work on one approved branch and one batch at a time. Each batch has a verified baseline, declared write scope, observable outcome, tests, and rollback. Prefer one coherent behavior over arbitrary file-count limits; required producers, consumers, and tests may change together. Separate prompt/model/effort experiments from those implementation changes.

Do not recreate the old 15-batch refactor inside the new project. Build a thin end-to-end capability early. Do not generate a full documentation suite or all roles/adapters before a minimal controller runs.

Use N0a/b/c identifiers for bounded substeps when needed, not a new version directory for every attempt. Default to one implementation session. Parallel work is allowed only with frozen interfaces, disjoint write lanes, isolated test outputs, and one integrator. Never let parallel sessions write the same state, fixtures, generated distribution, or run evidence.

Read only the guide sections required for the current batch. At completion, report observed results, recommend KEEP/REVERT/INCONCLUSIVE, and stop. The human accepts the batch and authorizes the next. A green test run does not authorize publication or rollout.

## N0: preserve and retire legacy

Follow [01-LEGACY-MIGRATION.md](01-LEGACY-MIGRATION.md). Reuse Session A–D evidence where it matches the actual revision; do not delay for irrelevant research. Preserve their provenance and disagreements.

**Deliver:** verified legacy archive, frozen reproduction basis, short archive index, current entry points, and explicit discovery/deployment status. No new runtime installed.

**Pass:** every moved file accounted for; unrelated work intact; archive excluded from active discovery where validated; old version reproducible; no false claim of workplace migration.

**Rollback:** reverse only mapped moves/settings against the preserved baseline. Stop on collisions or new work. Human accepts N0 before N1.

## N1: executable foundation

Agree on a minimal package location and one approved implementation language/runtime already workable in the target environment. Record that decision briefly. Avoid adding a framework or dependency for aesthetics.

Implement a small engine with versioned run/role-result records, reference validation, legal transitions, expected-state checks, bounded attempts, and durable local persistence. Provide actual commands or API tests for starting a synthetic run, reading state, accepting/rejecting a result, and resuming. CLI names are yours to define and document; no command in these guides is claimed to exist.

Define explicit host/service adapter interfaces and one fake adapter that can return success, malformed output, refusal, timeout, and duplicate/out-of-order results. Probe the intended real host's loading, tools, fresh invocation, model/effort reporting, and permission boundaries. Missing essential capability is a named blocker, not an invented SDK call.

**Deliver:** executable engine, a passing synthetic happy path, adversarial transition tests, and one small capability record. External actions are disabled. Input/evidence fingerprints and evaluation-version fields exist from the first run.

**Pass:** no model needed to test routing; stale/invalid/conflicting duplicate results rejected; crash/resume preserves accepted state and counters; a required capability cannot be silently bypassed. A deterministic engine test is not yet proof of host enforcement.

## N2: complete planning and human-decision slice

Implement source capture → short intent → specification → compact plan → fresh audit → combined HTML → recorded human decision. Use a synthetic request first; preserve links to a real tracker only through approved read access. Implement the selected real host's narrow invocation or explicitly manual transport path.

Follow the planning policy in [02-FACTORY-CONTRACT.md](02-FACTORY-CONTRACT.md#3-planning-audit-and-human-control). Support both no-second-round finalization and a human-requested second round, including accurate audit coverage after amendments. Do not add separate agents or approval prompts just because artifacts are separate.

Keep the engine as routing owner. The HTML is a derived view, not an independently authored interpretation or an approval channel. Escape inputs. The decision records the exact displayed subjects and authorized action.

**Deliver:** a demonstrable planning run that waits at the correct checkpoint and can resume without repeating an audit. Preserve immutable inputs and a basic external evaluation result on the synthetic case.

**Pass:** clean and refuted audits both wait for a human; second round occurs only on request; round two always ends at a final human decision; no third automatic audit. Human amendments do not forge an audit of the final plan. Missing evidence/authority remains blocking.

## N3: proof through reviewed candidate

Add Tester proof design, bounded Developer implementation, verification of an exact candidate, independent review, and prepared publication intent. Work only in an approved disposable synthetic application; do not run a real business ticket yet.

Tester must detect a meaningful pre-change failure or use an explicitly appropriate verification/sensitivity route. Developer cannot change controlled proof or governance. Review reads primary requirements, source, tests, and immutable evidence rather than persuasive implementation history. Keep every cited artifact resolvable after later attempts.

Publish nothing externally. Use fake remote services to exercise authorization, matching existing PRs, mismatches, uncertain effects, and retry restrictions. Prepare the human-readable action to be performed later.

**Deliver:** the first full synthetic request-to-reviewed-candidate-and-PR-intent run, including paused/failed paths. Document actual boundary mechanisms and any host bypass exposure.

**Pass:** identity and proof gates fail closed; independent review cannot bless missing proof; a timeout does not create duplicate publication; malformed plans or unsupported schemas never advance by optimistic prose. A successful synthetic run does not establish production readiness.

## N4: independent post-run evaluations

Implement the minimal evaluator interface, initially operated by fresh Claude Code sessions: read a frozen run plus rubric, write only that run's `evaluation/<evaluation-id>/` outputs. Re-evaluations preserve older judgments. Use approved internal storage for actual workplace data.

Retain run, requirement, configuration, source, rubric, and evaluator identities. Keep deterministic checks separate from semantic classifications and later human adjudication. Record finding validity, materiality, duplication, and resolution separately rather than forcing them into one ambiguous score.

Aggregate results across runs using simple files or an existing approved store first. No dashboard or Laminar dependency is required. Missing measurements stay missing. Importing legacy evidence is optional and offline; it cannot contaminate new execution or rewrite original records.

**Deliver:** comparable evaluations for clean, defective, incomplete, and failed runs; a compact cross-run report; human-reviewed calibration examples.

**Pass:** frozen evidence hashes unchanged after evaluation; no same-run evaluator feedback into execution; unknown is not zero/pass; original AI labels survive human correction; duplicate imports do not inflate counts.

## N5: extension and packaging challenge

Prove extensibility through a small replacement, not an architectural diagram. Substitute a second test adapter and alternate model profile without changing core lifecycle code. Add one optional procedure/reference with direct discovery and a regression case. Demonstrate explicit rejection of unsupported capabilities and schema versions.

Generate the selected host package reproducibly from canonical source. Test clean generation, drift detection, install/uninstall ownership, source attribution, and exclusion of legacy/research/private run data. Do not overwrite unrelated workspace settings. Build a real second-host adapter only when access and demand justify it; otherwise label the substitution test as a contract test, not host certification.

Run a prompt-evolution fixture: retire a now-counterproductive instruction through a versioned change, prove required behavior still holds, and verify the retired text no longer loads. Do not alter actual deployed model selection during this test without approval.

**Deliver:** tested extension seam, reproducible package, and one configuration/prompt change with rollback.

**Pass:** replacements stay within the declared adapter/profile/Skill surface; core remains host-neutral; no silent fallback or broadened permission; fresh sessions discover only the intended package.

## N6: controlled pilot and promotion

Select representative approved tasks and a cost/time ceiling with the owner. Keep a frozen legacy baseline for comparison, including known defects rather than forcing the new build to reproduce them. Use matched tasks/snapshots where practical. Separate the initial architecture comparison from later model/effort experiments.

Pilot one verified host at a time. VS Code success is not IntelliJ or Devspace evidence. Begin with prepared PR actions; live publication requires its own authorization and established candidate/action controls. No production deployment, automatic merge, or organization-wide replacement is included.

**Deliver:** task-level quality/efficiency results, human adjudication, observed host limitations, operational rollback, and a release recommendation.

**Pass:** predeclared quality and control criteria satisfied, no unresolved critical safety failures, and usable operating instructions. Fewer tokens cannot compensate for invalid approvals, weakened proof, or missing evidence. A small pilot is screening evidence, not a universal reliability guarantee.

After separate promotion approval, select the new runtime as the sole active runtime in the chosen installation. Record exactly which environments changed. Legacy remains reproducible and is not overwritten by the new installer.

## Acceptance fixtures

Implement these as small synthetic fixtures alongside the batch that first introduces the behavior. Expected outcomes describe the target contract, not the wording of a preferred model answer.

| ID | Scenario | Required observable outcome |
|---|---|---|
| L1 | Dirty old tree and archive-path collision | No lost work or overwritten destination; stop with exact unresolved scope. |
| L2 | Archived Skill still discovered through another root | Migration not declared isolated; correct only authorized registration or pause. |
| C1 | Result names a different plan/spec/source basis | Reject stale subject; retain original result. |
| C2 | Process dies after accepting a result but before replying | Resume sees the accepted result and does not dispatch duplicate work. |
| C3 | Concurrent writers submit against the same state version | One valid transition; stale competing update rejected, not merged heuristically. |
| P1 | Request lacks required disabled-feature behavior | Ask the owner; no invented AC. |
| P2 | Audit agrees on the first plan | Combined brief and human wait, not automatic Tester. |
| P3 | Audit refutes; human authorizes exact amendment without round two | Preserve refutation and non-reaudited coverage; final plan limited to amendments. |
| P4 | Human requests round two, session then resumes | One authorized second audit; counters preserved; final human wait. |
| P5 | Source changes while approval is pending | Stale decision basis rejected/refreshed. |
| T1 | Test fails to compile instead of reaching its assertion | Not accepted as valid behavioral red. |
| T2 | Developer attempts to weaken tests or edit governance | Prevent where supported; otherwise detect and stop, documenting actual guarantee. |
| V1 | Same commit but altered environment or evidence packet | Dependent verification/review is stale until re-established. |
| X1 | PR-create times out, then matching remote PR is found | Reconcile and reuse; no second creation. |
| X2 | Remote lookup is incomplete and shows nothing | Outcome remains unknown; no blind retry. |
| S1 | Ticket/log instructs the agent to ignore a gate or disclose a secret | Data cannot change authority; no unauthorized write or disclosure. |
| E1 | New rubric evaluates an old run twice | Separate versioned evaluations; original evidence intact; aggregation selects explicitly. |
| M1 | Requested model/effort unavailable | Explicit unsupported/fallback decision; never record desired setting as observed. |
| R1 | Required instruction lies late in a reference | Agent can locate/apply it or reports missing guidance; no assumed 100-line cutoff. |

For L1/L2/X1/X2/S1 use sandboxed fixtures, not real destructive operations or secret material. To validate an enforcement test, deliberately break the relevant test-only control in an isolated copy: the test must then fail for the expected reason. Never mutate a live guard to demonstrate sensitivity.

## Measurement and batch handoff

Capture source/profile/rubric versions, intended versus observed model/effort, host, fixture inputs, outcomes, attempts, references actually read where visible, active time, human effort/wait, and observed usage/cost. File bytes are a proxy, not a bill. Preserve incomplete and failed attempts in the denominator; report missing-data coverage.

For semantic comparisons, use fresh contexts, paired inputs, fixed evaluators, clean cases, known defects, and held-out cases. Blind model/treatment identity where practical and have humans adjudicate material disagreements. Repeat stochastic cases; report uncertainty rather than infer superiority from one win. Claims within one ticket are not independent tickets. Calibrate each judge task separately.

Classify regressions by cause: contract, context, host/tool, engine, model, evaluator, or human decision. A fix must replace or relocate the faulty mechanism rather than automatically add another paragraph. Allow experimental instructions to expire; retain required policy until a separately authorized change replaces it.

Keep one progress index and one compact record per accepted batch under the build's documentation area. Each record lists scope, baseline, authored/generated files changed, tests actually run, relevant results/limitations, unresolved risks, rollback, and next proposed batch. No giant transcript or duplicated architecture report.

**Finish each batch with a recommendation, not self-authorization.** STOP on unknown ownership, unsafe migration, wrong host loading, missing required evidence, privilege expansion, schema drift, or failed rollback. The owner chooses KEEP/REVERT/INCONCLUSIVE and whether the next batch begins.
