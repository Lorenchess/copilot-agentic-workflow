# ASTRA — PHASE 1 FINAL CLOSURE REVIEW

Reviewed revision: `7fc98b4ae70e5018392fc010a795a234f27e04bb`

Previous reviewed baseline: `c2f703641575e28e1eae4c1cfad3487637d1c8d3`

Targeted correction commits: `52d8530`, `7fc98b4`

Overall recommendation: **TARGETED_CORRECTION_REQUIRED**

Four findings close. The original existing-PR reuse defect is corrected, but its remediation introduces a gap in the new-PR creation procedure. The worked example now handles exhausted reporting retries, but still leaves an early successful delivery with a failed ledger report outside its terminal-outcome rule. These two narrow corrections prevent locking this revision.

## Review scope and evidence

This was a targeted closure review of R1–R6 and material regressions introduced by the two correction commits, not a new architecture audit. Local HEAD and `origin/main` both resolved to the reviewed revision; remote alignment was also supplied in the handoff. Live remote state was not independently queried during this review. All source links below are pinned to the reviewed revision, except the explicitly labeled before-change comparison.

The review compared the actual changed agents, contracts, flow, skills, approval settings, example artifacts, and comparison guidance. Amendments A8–A10 were evaluated together with the earlier applicable amendments. Fable's and Sonnet's completion statements were not treated as closure evidence.

One isolated experiment evaluated the checked-in terminal approval regexes in memory using JavaScript, including false-rule precedence: 22 intended command forms and 15 unsafe or unsupported command strings, with zero unexpected results. None of those command strings was executed. This was not a test of Copilot's approval engine.

No implementation agents, builds, application tests, browser checks, Jira mutations, commits, pushes, or PR operations were performed. The user subsequently authorized this new report file. The previous report, `docs/reviews/2026-09-10-phase-1-remediation-closure-review.md`, is preserved unchanged. No reference asset was edited.

## R1 — RESUME APPROVALS

**Disposition: CLOSED_WITH_ACCEPTED_LIMITATION**

**Evidence:** [Pipeline, lines 56–81](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/agents/pipeline.agent.md#L56-L81); [contract A8, lines 213–217](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md#L213-L217); [pipeline skill, line 86](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/skills/pipeline/SKILL.md#L86).

**Reasoning:** Gate answers now record the artifact rounds actually reviewed and CURRENT/STALE status. Supersession invalidates dependent answers in the same RUN update, and the orchestrator checks that a CURRENT answer's basis matches the ACTIVE artifact rounds before proceeding. Re-verification after G4 explicitly stales G4 and requires a new answer before publication or PR handling. The previous scenario—plan A approved, plan B produced, interruption before fresh G3—can no longer advance on the old G3 under the stated procedure. Keeping G3 current through an approved test amendment is reasonable when the approved plan is unchanged; downstream evidence must still follow the regeneration and gate rules.

**Residual limitation:** This is procedural revision bookkeeping, not tamper-proof or transactional storage. It assumes agents honor artifact ownership and record regeneration accurately. It does not validate silent out-of-band edits. That is an acceptable reference boundary, not a reason to require a new runtime.

## R2 — PR REUSE

**Disposition: REGRESSED — original reuse defect closed; new-PR creation comparison regressed**

**Evidence:** [PR agent, lines 73–80](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/agents/pr.agent.md#L73-L80); [agent contracts, lines 109–117](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/pipeline/AGENT-CONTRACTS.md#L109-L117); [FLOW, line 82](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/pipeline/FLOW.md#L82). Before-change comparison: [PR agent at c2f7036, line 76](https://github.com/Lorenchess/copilot-agentic-workflow/blob/c2f703641575e28e1eae4c1cfad3487637d1c8d3/.github/agents/pr.agent.md#L76).

**Reasoning:** Reuse now requires PASS, CURRENT G4 with PUBLISH_AND_PR, the intended repository/source/target, OPEN state, and a freshly read source SHA matching the verified SHA. Mismatches are reported as blocked; no duplicate is created and the existing PR is not modified. This closes the original reuse scenario.

However, the earlier procedure explicitly required the freshly read SHA to equal the verified SHA immediately before creation. The revised procedure checks only WORKSPACE.md's recorded SHA during initial eligibility (line 74), reads the current SHA (line 76), and checks equality inside the existing-PR branch (line 77). The no-existing-PR branch then calls create directly (line 78). The same branching structure is repeated in FLOW and AGENT-CONTRACTS.

**Concrete failure scenario:** Verification and Workspace publication record SHA A; G4 approves A. Before stage 10, the remote source branch advances to B. There is no existing PR. Initial eligibility passes because WORKSPACE.md still records A. The fresh read returns B, but the creation procedure contains no comparison/rejection step on that path and proceeds to create the PR against B. This is drift already observed before the operation, not an unavoidable race after the last check.

The general SHA-equality intent remains elsewhere in the reference, including the PR agent's introductory/data language. That does not make the newly explicit asymmetric procedure an adequate reusable instruction: an implementer should not have to reconstruct the removed comparison from a general invariant.

**Minimum correction:** Make `fresh remote source SHA == verified SHA == approved G4 SHA` a mandatory common condition after the read and before either create or reuse. A mismatch must record BLOCKED and perform neither operation. Reconcile the corresponding PR procedure, agent contract, flow, and applicable amendment wording. This is a small procedural correction, not a request for locking infrastructure.

**Residual limitation after correction:** The source branch can still move after the final read; that remains the disclosed server/host boundary. It does not justify ignoring a mismatch already returned by the read.

## R3 — WORKED-EXAMPLE CORRECTNESS

**Disposition: STILL_OPEN**

**Evidence:** [PLAN, lines 48–63](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/docs/examples/PAYMENTS-12345/PLAN.md#L48-L63); [TEST-CONTRACT, lines 14–21](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/docs/examples/PAYMENTS-12345/TEST-CONTRACT.md#L14-L21); [IMPLEMENTATION, lines 13–16](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/docs/examples/PAYMENTS-12345/IMPLEMENTATION.md#L13-L16); [VERIFICATION, lines 37–45](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/docs/examples/PAYMENTS-12345/VERIFICATION.md#L37-L45); [G3 decision, RUN line 80](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/docs/examples/PAYMENTS-12345/RUN.md#L80).

**Reasoning:** The exhaustion case is materially improved. AC5 explicitly permits a locally persisted UNREPORTED marker rather than pretending every report eventually reaches the ledger. The fictional G3 approves that product decision. Two new WITNESS tests cover re-reporting and budget exhaustion, and the RED/GREEN/verification evidence carries those tests forward. This is a proportionate solution within the example's scope.

The remaining problem is the interaction between successful delivery and reporting failure. AC3 stops further retries as soon as delivery succeeds. AC5 retries a failed report on the next delivery attempt and requires the UNREPORTED marker only when the configured retry budget is exhausted. Success can terminate delivery while attempts remain available.

**Concrete failure scenario:** With a maximum of five attempts, delivery succeeds on attempt two and its ledger-report call fails. AC3 schedules no further attempt. The configured budget is not exhausted, so AC5 does not require the UNREPORTED marker. The report is neither retried nor required to leave the promised visible terminal record. The shown re-reporting test and exhausted-budget test can both pass while this case loses the report silently.

**Minimum correction:** Define the reporting outcome whenever delivery becomes terminal with an unreported attempt, including success before the maximum. The smallest direction is to extend the already accepted local-marker outcome to that case and show the corresponding acceptance scenario/test/evidence, subject to Fable's product-decision review. Keep PLAN, the fictional G3/adversary decision, TEST-CONTRACT, RED/GREEN/verification evidence, and final claims aligned. No durable queue or reconciliation service is required by this finding.

**Residual limitation:** UNREPORTED makes an audit gap observable locally; it does not guarantee later ledger persistence. Reconciliation and alerting are explicitly out of scope. That is acceptable when stated and approved honestly.

**Non-blocking editorial note:** [VERIFICATION, line 85](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/docs/examples/PAYMENTS-12345/VERIFICATION.md#L85) still says “all four” API contract tests, although the detailed table and totals correctly show six. This stale count is not a separate lock blocker.

## R4 — PRESERVATION TESTS

**Disposition: CLOSED**

**Evidence:** [Tester, lines 83–92](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/agents/tester.agent.md#L83-L92) and [104–113](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/agents/tester.agent.md#L104-L113); [Pipeline, lines 70–72](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/agents/pipeline.agent.md#L70-L72); [Verifier, lines 68–74](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/agents/verifier.agent.md#L68-L74).

**Reasoning:** Tester must diagnose the failure and record evidence. A demonstrated test defect can be corrected; a genuine baseline failure is preserved and returned through PRESERVATION_BASELINE_FAILED; inability to obtain a meaningful run uses RUNNER_UNAVAILABLE. Reclassification to WITNESS or exclusion requires an explicit human decision with a recorded reason. A later implementation regression still fails verification, while contract amendments remain approved, Tester-owned changes with actual observed outcomes and an active anchor. Expectations may not be weakened merely to obtain PASS.

**Residual limitation:** Diagnosis remains a judgment supported by evidence. An approved exclusion is a scope decision, not proof the excluded behavior is correct, and it does not waive the independent full-suite verification requirements.

## R5 — WORKSPACE INPUTS / TRUST BOUNDARY

**Disposition: CLOSED**

**Evidence:** [Pipeline, line 63](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/agents/pipeline.agent.md#L63); [Workspace, lines 22–25](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/agents/workspace.agent.md#L22-L25); [MODEL-ROLES, line 9](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/pipeline/MODEL-ROLES.md#L9); [GUARDRAILS, lines 7–9](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.github/pipeline/GUARDRAILS.md#L7-L9).

**Reasoning:** Workspace's invocation now names RUN.md alone for preparation, supplying the confirmed repositories and branch. It no longer receives INTAKE.md. Its declared later inputs remain operational verification/publication evidence. The zero-injection-exposure claim is replaced with an explicit statement that received artifacts remain untrusted. The assembled handoff and trust description agree.

**Residual limitation:** This is role/input minimization, not proof that artifact content or tool output cannot influence a model. Host enforcement is still required for stronger isolation.

## R6 — APPROVAL REGEXES

**Disposition: CLOSED_WITH_ACCEPTED_LIMITATION**

**Evidence:** [Settings, lines 8–25](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.vscode/settings.json#L8-L25) and [28–39](https://github.com/Lorenchess/copilot-agentic-workflow/blob/7fc98b4ae70e5018392fc010a795a234f27e04bb/.vscode/settings.json#L28-L39); the isolated regex replay described above.

**Reasoning:** The independent-name tracking rule is removed. Tracking now uses the equality backreference. Broad ref/operand slots were narrowed to literal character classes, closing the previously reproduced substitution and mismatched-tracking cases. All 37 replay cases matched their expected allow/prompt result: 22 intended forms remain eligible, including default/feature branch preparation, matching tracking branches, evidence diffs, staging/commit forms, and explicit-SHA publication; 15 unsafe or unsupported forms fall back to a prompt.

Examples now falling back to a prompt:

```text
git -C repo switch -c PAY-123-feature --track origin/PAY-999-other
git -C repo switch $(whoami)
git -C repo merge --ff-only origin/$(whoami)
```

Those are test strings only; none was executed.

**Residual limitation:** Regex matching is a best-effort approval backstop. The replay does not establish corporate shell parsing or Copilot approval-engine behavior, nor turn a prompt into a prohibition. Unsupported legitimate names may require manual approval. No command sandbox guarantee is inferred.

## NEW MATERIAL REGRESSIONS

**One: the creation-path fresh-SHA comparison described under R2.** Reuse validation was strengthened, but the previously explicit comparison immediately before new-PR creation was removed from that branch of the procedure. Restore it as a common condition for both outcomes.

R3 is an incomplete closure of the reporting-loss scenario, not a demand for a new architecture. No other material regression was identified within this targeted review. The stale example test count is editorial only.

## ACCEPTED HOST / ENVIRONMENT LIMITATIONS

- Artifact lineage, diagnosis, and command/path restrictions remain procedural/model-mediated where the host does not enforce them.
- Test/build execution and Git hooks run repository-controlled code. The reference does not sandbox them or purge ignored build outputs.
- Remote branches can move after a final read; server protections govern that remaining interval and subsequent state. This does not excuse proceeding after a fresh read already reveals a mismatch.
- Multi-repository publication remains non-atomic.
- The example is fictional and is assessed as a demonstration of adequate evidence, not as proof that real tests or publication occurred.

These accepted limits do not require a custom runtime, database, scheduler, cryptographic mechanism, or locking system.

## DEFERRED CORPORATE VALIDATION

**NOT VERIFIED:** exact Jira MCP tool names; exact Bitbucket MCP tool names; exact Sonnet-5 Copilot model-picker string; Copilot agent-picker smoke check; corporate approval-engine behavior; broader model benchmarking.

Those intentionally deferred items are not reasons for the recommendation. Readiness as a reference and validation inside the corporate Copilot environment remain separate conclusions.

## FINAL ASSESSMENT

**Do not lock `7fc98b4ae70e5018392fc010a795a234f27e04bb` as the reference baseline yet.** Two small remaining corrections matter:

1. Reject a freshly observed remote-SHA mismatch before creating a new PR, just as the reuse path does.
2. Define and demonstrate the ledger-reporting outcome when delivery succeeds before its retry budget is exhausted.

Both can be resolved within the existing agents, contract prose, and fictional example. Fable should independently evaluate these findings and propose the minimum correction scope. This report authorizes no implementation changes and does not begin Phase 2.

**TARGETED_CORRECTION_REQUIRED**
