# Phase 1 independent remediation closure review

**Recommendation: TARGETED_CORRECTION_REQUIRED**

Six targeted corrections remain. The remediation substantially improves Phase 1, but the current reference still has gaps in approval recovery, PR reuse, test semantics, and the guarantees taught by the example. Eleven original findings are closed or closed within the approved reference limits; six remain open.

## Reviewed revision and scope

- Repository: `Lorenchess/copilot-agentic-workflow`.
- Original audited baseline: `7a0861b029152c3e1492e61996c46d52411f5b8f`.
- Reviewed revision: `c2f703641575e28e1eae4c1cfad3487637d1c8d3`.
- Remediation commits: `ff3af61`, `a2f29d4`, `7751851`, `c2f7036`.
- Local HEAD and remote main matched the handoff revision during the review.
- Contract §14 amendments A3–A7 were treated as authoritative over retained historical contract text.
- Review date: 2026-09-10.

The assessment concerns readiness as a reusable reference for comparison and selective adaptation inside the existing internal pipeline. It does not establish validation in the corporate VS Code / GitHub Copilot environment.

Evidence includes the actual revised files, their interactions, Git history, and an isolated in-memory probe of the checked-in approval regexes. No probe command strings were executed. No implementation agents, application tests, builds, browser checks, Jira mutations, commits, pushes, or PR creation were performed. The repository remained unchanged during the investigation. This report was subsequently added at the user's explicit request; it does not alter the reviewed reference assets.

Source links below are pinned to the reviewed commit so that later changes to main do not silently change the evidence.

## Disposition of every original finding

“Closed” means adequate as a reference procedure, not demonstrated host enforcement.

| Original finding | Disposition | Evidence and assessment |
|---|---|---|
| **C1 — Verification not bound to committed content** | **CLOSED WITH ACCEPTED LIMITATION** | Clean checkout and candidate SHA are checked before and after execution. Ignored outputs and repository-controlled execution remain disclosed limitations. [Verifier, lines 67–69](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/verifier.agent.md#L67-L69). |
| **C2 — G4 approval not bound to the publication tuple** | **CLOSED** | All repositories are preflighted against the approved destination, branch, SHA, and target before any push. Drift stops publication. [Workspace, lines 65–68](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/workspace.agent.md#L65-L68). |
| **H1 — Incorrect trust boundary and Intake exposure** | **STILL OPEN** | The central trust model is corrected, but the orchestrator still instructs Workspace to consume Intake. See R5. [Pipeline, line 63](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/pipeline.agent.md#L63). |
| **H2 — Protected paths mistaken for semantic test integrity** | **CLOSED WITH ACCEPTED LIMITATION** | Exact contract execution, named-test discovery, envelope review, full-suite execution, and full-patch review now work together. Semantic adequacy still depends on reviewer judgment. [Verifier, lines 68–74](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/verifier.agent.md#L68-L74). |
| **H3 — Verifier lacked actual change evidence** | **CLOSED** | Full baseline-to-HEAD patch and changed-path inventory are explicitly allowed and required. [Verifier, lines 64–72](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/verifier.agent.md#L64-L72). |
| **H4 — Resume ignored evidence and approval freshness** | **STILL OPEN** | Artifact supersession is added, but gate-answer validity is not reconciled with the revised artifact. See R1. [Pipeline, line 79](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/pipeline.agent.md#L79). |
| **H5 — Amendment evidence and active anchor ambiguous** | **CLOSED WITH ACCEPTED LIMITATION** | Approved amendments explicitly record actual PASS/RED results and active paths/anchor; Verifier consumes the latest amendment. A passing amendment does not prove historical RED. [Tester, line 92](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/tester.agent.md#L92), [Verifier, line 70](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/verifier.agent.md#L70). |
| **H6 — Publication/PR races and incomplete preflight** | **STILL OPEN** | Explicit-SHA pushes, all-repository preflight, and required PR reads address the original publishing defects. Existing-PR handling still bypasses validation. See R2. [PR, lines 74–79](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/pr.agent.md#L74-L79). |
| **H7 — Example could pass while business behavior was wrong** | **STILL OPEN** | Timing and persisted-state assertions are improved; the ledger-loss scenario remains unsupported. See R3. [Example test contract, lines 14–19](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/examples/PAYMENTS-12345/TEST-CONTRACT.md#L14-L19). |
| **M1 — All tests required to fail initially** | **STILL OPEN** | WITNESS/PRESERVATION classification fixes the original restriction, but categorical treatment of failing preservation tests introduces a correctness problem. See R4. [Tester, line 87](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/tester.agent.md#L87). |
| **M2 — Artifact revision lacked edit capability** | **CLOSED** | Planner, Adversary, and Verifier now have explicit own-artifact update procedures and tools. [Planner, line 66](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/planner.agent.md#L66), [Adversary, line 63](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/adversary.agent.md#L63), [Verifier, line 75](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/verifier.agent.md#L75). |
| **M3 — Retry budgets and feedback inconsistent** | **CLOSED WITH ACCEPTED LIMITATION** | A6 defines initial verification plus two fix rounds, passes verification findings explicitly, and authorizes regeneration. This bounds orchestration rounds—not every internal edit/test iteration or total cost. [Pipeline, lines 71–77](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/pipeline.agent.md#L71-L77), [Developer, line 69](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/developer.agent.md#L69). |
| **M4 — Approval patterns broader than claimed** | **STILL OPEN** | Older permissive patterns remain alongside tightened rules. The isolated matcher probe reproduced this. See R6. [Settings, lines 19–26](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.vscode/settings.json#L19-L26). |
| **M5 — Local default could carry unpublished commits** | **CLOSED** | Preparation now requires `origin/default...default` counts of `0 0` before creating the feature branch. [Workspace, lines 60–62](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/workspace.agent.md#L60-L62). |
| **M6 — Requested scope could disappear or be invented** | **CLOSED** | Every requested key requires a disposition; product proposals require explicit G3 confirmation. [Planner, lines 60–62](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/planner.agent.md#L60-L62), [Pipeline, line 85](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/pipeline.agent.md#L85). |
| **M7 — Retrieval and confidence overstated completeness** | **CLOSED WITH ACCEPTED LIMITATION** | Omissions are disclosed, unevaluated repositories are distinguished, and correlated evidence cannot inflate confidence. Retrieval remains deliberately bounded. [Gather, lines 68–73](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/skills/gather-jira-context/SKILL.md#L68-L73), [Discovery, lines 24–30](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/skills/discover-affected-projects/SKILL.md#L24-L30) and [50–58](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/skills/discover-affected-projects/SKILL.md#L50-L58). |
| **L1 — Responsibility/provenance inaccuracies** | **CLOSED** | Branch/push ownership is distinguished from commits; the example now attributes implemented behavior to repository evidence. Remaining trust wording is covered under H1. [Workspace, line 14](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/workspace.agent.md#L14), [Example PR description, line 17](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/examples/PAYMENTS-12345/PR-DESCRIPTION.md#L17). |

## Remaining material corrections

### R1 — HIGH: Resume can reuse approval of an obsolete plan

**Original finding:** H4.

The resume rule looks for a gate with **no recorded answer**, while regeneration supersedes downstream **artifacts**. It does not invalidate dependent gate answers or require that they apply to the active artifact revision. The same rule appears in [FLOW, line 162](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/pipeline/FLOW.md#L162).

**Failure scenario:** G3 approves plan A. The developer requests a revision; plan B and its approving adversary review are produced. Execution stops before fresh G3 approval. On resume, the old G3 answer still exists and testing is the first missing stage. The documented selection rule can advance to testing without approval of B.

**Minimum direction:** Make dependent approvals stale when their basis changes, and require a current affirmative answer before resuming past the gate. Record which plan/review revision G3 approved. Apply this consistently to the orchestrator, flow, pipeline skill, and RUN contract. Existing artifact bookkeeping is sufficient; no new runtime is needed. Fable should determine the precise implementation plan.

### R2 — HIGH: Existing PR reuse does not establish the requested operation's guarantees

**Original finding:** H6.

PR step 2 records an existing PR immediately. Step 3 applies PASS/G4/SHA/target checks only to **“each remaining repository.”** The mandatory current-SHA read is likewise restricted to creation. Separately, [PR, line 83](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/pr.agent.md#L83) describes finding an existing PR as a blocking condition, leaving reuse versus blocking ambiguous.

**Failure scenario:** The source branch already has a PR targeting `release`, while G4 approved `main`. The existing-PR path can record that PR without establishing target equality, current verified source SHA, or whether its state permits reuse. This is a wrong-result/recovery defect; merely reading that PR is not an unauthorized mutation.

**Minimum direction:** Define eligibility checks common to creation and reuse—approved repository/source/target, current verified SHA, authorization, and acceptable PR state. Record mismatches as blocked rather than treating any source-branch match as fulfillment. Do not silently modify an existing PR. Align the PR agent procedure and corresponding handoff/contract descriptions.

### R3 — HIGH: The example still teaches an unsupported no-loss guarantee

**Original finding:** H7.

[PLAN, line 53](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/examples/PAYMENTS-12345/PLAN.md#L53) requires failed ledger reports never to be silently dropped, but [PLAN, line 59](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/examples/PAYMENTS-12345/PLAN.md#L59) bounds reporting retries to the delivery budget. No terminal reporting-failure behavior is specified.

The test mapping covers persistence when the ledger receives a report, not failed report delivery or retry exhaustion. Nevertheless, [ADVERSARY-REVIEW, line 18](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/examples/PAYMENTS-12345/ADVERSARY-REVIEW.md#L18) declares the loss gap resolved. [IMPLEMENTATION, line 13](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/examples/PAYMENTS-12345/IMPLEMENTATION.md#L13) and [PR-DESCRIPTION, line 17](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/examples/PAYMENTS-12345/PR-DESCRIPTION.md#L17) carry the same unsupported conclusion forward.

**Failure scenario:** The ledger remains unavailable for the entire finite budget. Delivery becomes terminal, reporting stops, and no audit record exists. Every named example test can still pass.

**Minimum direction:** Explicitly decide the exhausted-reporting outcome and demonstrate corresponding failure-path coverage across the example artifacts. Alternatively, narrow the guarantee through an explicit accepted product decision. The correction concerns the fictional example's reasoning and evidence; it does not require implementing infrastructure here.

### R4 — MEDIUM: A failed preservation test is not necessarily a defective test

**Original finding:** M1; introduced by the remediation's treatment of the new classification.

Tester categorically says a failing PRESERVATION test is a test-design defect. [The comparison guide, line 80](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/COMPARISON-GUIDE.md#L80) repeats this instruction.

**Failure scenario:** A correctly written preservation test exposes an existing production defect. Following the procedure directs Tester to change the test instead of establishing whether the expectation, implementation, or environment is wrong. That can normalize the defect before the protected contract is committed.

**Minimum direction:** Require diagnosis and retain the observed failure. Fix the test only when evidence establishes a test defect; otherwise return the baseline failure or scope decision through Pipeline. Do not weaken the expectation merely to obtain PASS. Correct the Tester instruction and its repeated comparison guidance, with only the necessary handoff clarification.

### R5 — MEDIUM: Workspace's actual handoff contradicts A7

**Original finding:** H1.

Pipeline's subagent-call convention explicitly includes Workspace among consumers of `INTAKE.md`, whereas [GUARDRAILS, line 9](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/pipeline/GUARDRAILS.md#L9) excludes it. [MODEL-ROLES, line 9](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/pipeline/MODEL-ROLES.md#L9) also retains the claim that Workspace has “no injection exposure” because it reads only artifacts.

**Failure scenario:** Intake contains a suspicious Jira instruction quoted for reporting. The orchestrator explicitly directs terminal-capable Workspace to read it. The instructions now conflict at precisely the boundary the remediation intended to simplify.

**Minimum direction:** Correct the Workspace handoff and remove the zero-exposure claim. Artifacts remain untrusted even when Intake is excluded. This is an avoidable reference contradiction, not an unavoidable host limitation.

### R6 — MEDIUM: An older approval rule defeats the advertised tightening

**Original finding:** M4; the updated comparison claim adds a documentation regression.

Settings line 23 introduces matching local/remote branch names through a backreference, but line 21 retains the independent-name rule. [The comparison guide, line 189](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/COMPARISON-GUIDE.md#L189) consequently overstates what the combined rules establish.

**Isolated evidence:** The checked-in JSON was read, slash-delimited regex keys were evaluated using JavaScript `RegExp`, and probe strings were matched against all those rules. These strings each matched a `true` rule and no `false` rule:

```text
git -C repo switch -c PAY-123-feature --track origin/PAY-999-other
git -C repo switch $(whoami)
```

The first matched the older tracking rule at line 21; the second matched the broad branch token at line 19. Neither command was executed. This probe did not exercise Copilot's approval engine, which may apply additional parsing or protections.

**Failure scenario:** The reference's approval patterns admit unequal tracking branches despite the claimed equality protection. They also accept a shell-substitution string as a branch token despite the stated literal-token policy. Actual execution through Copilot is not established by this review.

**Minimum direction:** Remove overlapping permissive allowances and reconcile remaining broad argument slots with the stated literal-token policy. Unsupported shapes can require approval. Correct the comparison claim; a comprehensive shell-sanitizing system is unnecessary.

## Accepted limitations and non-blocking clarification

The reference can reasonably depend on host controls for repository-controlled scripts/hooks, ignored build outputs, post-publication branch protection, and stronger enforcement than agent prose. These boundaries are stated in [GUARDRAILS, lines 39–47](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/pipeline/GUARDRAILS.md#L39-L47).

Multi-repository publication remains non-atomic: preflight prevents known mismatches before starting, but a later push can fail after an earlier push succeeds. This does not itself prevent reference readiness and does not call for a custom transaction coordinator.

Semantic test review and adversarial review remain model judgments. The revised procedures improve their evidence; they do not prove absence of correlated reasoning errors or provide tamper-proof artifact enforcement.

The accepted A6 budget limits orchestration rounds. Developer's internal implementation/test loop is not a total execution, time, or cost cap. Closure of M3 must not be read as such a claim.

The residual **“new RED commit SHA”** terminology in the amendment procedure should become “active amendment anchor.” This is non-blocking wording because A4 and the operative procedure explicitly require observed PASS to remain PASS. The chosen approved alternative addresses the original false-evidence problem without requiring every amended test to fail against already-implemented code.

## Deferred environment checks

Corporate Copilot validation is **NOT VERIFIED**. Exact Jira/Bitbucket MCP identifiers, model-picker selection, agent dispatch, edit permissions, approval-engine behavior, and the in-editor workflow remain deferred. Those omissions do not independently fail Phase 1.

The worked example is explicitly fictional, as stated in its [README, line 5](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/docs/examples/PAYMENTS-12345/README.md#L5). It provides no evidence that real tests or publications occurred. Its required standard is an internally adequate demonstration of evidence and decisions; R3 concerns that standard.

## Final recommendation

**TARGETED_CORRECTION_REQUIRED**

The remaining work is targeted procedural and documentation correction within Phase 1. Fable should evaluate R1–R6 and propose the implementation scope separately. This review authorizes no implementation changes and does not begin Phase 2.
