# CHATGPT — PHASE 3 P3-C1 IMPLEMENTATION REVIEW

**Recommendation: TARGETED_CORRECTION_REQUIRED.**  
**P3-C2: hold delegation until the three narrow handoff defects below are corrected.**

The checkpoint substantially implements the approved architecture. Its policy, source-based challenge, exception retirement, and conservative publication boundary are sound directions. The remaining issues are procedural: staging an adopted test, activating a reviewed candidate anchor, and constructing the test-review invocation. They do not require reopening the architecture or either locked reference baseline.

## Reviewed state and limits

- Reviewed exact local commit: **92540f71b23951d0a6c5319e96b0334f46a1eacb**.
- P3-C1 comparison base: **b7a33831ed61c55d061ed888a642292b792dae71**, the committed approved contract/proposal.
- Contract SHA-256 at this checkpoint: **B3190D08510EC58CE6BE979C74E95904B75EF36CA6CBEF981EABA6C6CCD0A206**. Its heading now records revision-2 approval. P3-C1 did not change the committed contract.
- Phase 1 tag remains **03d4230e9398a80586a4b8be47ed522638bf77d8**; Phase 2 tag remains **5a46eb7a6bb951308742975bd8f9f51f77a6aca9**.
- Tracked working tree and index were clean. Existing untracked reviews were preserved.
- Inspection covered the new skill, changed agent procedures and inputs, FLOW, AGENT-CONTRACTS, GUARDRAILS, MODEL-ROLES, the pipeline skill, and the recorded clarification in docs/questions.md.
- Validation was local source comparison and handoff/scenario reasoning. No implementation agents, builds, tests, Copilot smoke checks, or remote-state checks were run. This is not corporate-host validation or Phase 3 lock approval.

Only this new review file was created.

## What is established

Source comparisons confirm:

- All nine agents' tools blocks match the Phase 2 reference.
- G1–G4's exact wording is unchanged.
- Existing FLOW STOP rows are unchanged; the additions are TEST_REVIEW_REVISE_LIMIT and VERIFICATION_INCOMPLETE.
- The new artifact is TEST-REVIEW.md.
- P3-C1 changed the intended five agents, four pipeline documents, pipeline skill, new test-contract skill, and the clarification in docs/questions.md. Planner, Intake, Workspace, PR, settings, historical contracts, and the examples were not changed by this checkpoint.
- The exception-retirement requirement is implemented in the [skill, lines 120–122](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/skills/test-contract/SKILL.md:120), [pipeline Decision log and recovery, lines 57 and 77](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/pipeline.agent.md:57), and [Verifier, lines 73–76](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/verifier.agent.md:73). Closed exceptions remain historical and are excluded from the current NOT_VERIFIED set.
- The outcome-first test-review method reads actual source, distinguishes interface evidence from field-list agreement, and requires discrimination checks on amendments. The richer policy did not introduce a new runtime or implementation role.

These checks support the checkpoint's scope and intent. They do not resolve the handoff defects below.

## Material findings

### C1-I1 — MEDIUM: initial adoption is permitted, but the final staging instruction omits the adopted file

**Evidence:** [Tester, line 93](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/tester.agent.md:93) says that, after approval of a pre-existing-test conflict, Tester edits the existing file and completes the remainder of stage 5. However, [step 11, line 100](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/tester.agent.md:100) still stages “once per path you created.” The broader allowed-command exception at [line 86](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/tester.agent.md:86) permits staging an approved existing path, but the actual final staging step does not include it.

**Concrete failure scenario:**

1. An approved criterion makes an existing test expectation obsolete.
2. Tester obtains approval, changes that existing test, and constructs new tests for the other clauses.
3. The RED runs exercise both the adopted edit and the new files.
4. Following step 11 literally, Tester stages only files it created. The adopted edit stays unstaged.
5. The recorded RED anchor therefore does not contain the adopted behavior that was run. A later clean-checkout verification fails, and Developer cannot repair the omission by committing a controlled test path.

The narrative that the file “joins Protected paths at the RED commit” does not repair this contradictory commit procedure.

**Minimum correction:** make the final stage-5 staging/index procedure include the specifically approved adopted path and delta alongside the created files. Confirm that the recorded anchor contains that edit and that the staged-set evidence matches this intended set. Retain all ownership and scope checks; no broader existing-test permission is needed.

### C1-I2 — MEDIUM: accepted candidate activation has no explicit owner handoff

**Evidence:** [Tester, line 107](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/tester.agent.md:107) writes a candidate and leaves the prior anchor active until re-review. [Adversary, lines 119–121](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/adversary.agent.md:119) records the candidate in its Basis and writes only TEST-REVIEW.md. [Pipeline, line 76](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/pipeline.agent.md:76) then proceeds toward Developer once the review is current. [Pipeline, line 84](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/pipeline.agent.md:84) requires the review Basis to equal active contract revisions, and [Verifier, lines 71–73](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/verifier.agent.md:71) reads the active anchor from TEST-CONTRACT.md and checks the matching review.

The implementation states when activation is allowed, but does not complete the stateless ownership handoff that records it.

**Concrete failure scenario:**

1. Active contract anchor is A.
2. Tester commits candidate B, records its patch, and returns with A still active.
3. Adversary accepts the B transition and writes its own review.
4. Tester is no longer running. Adversary cannot update TEST-CONTRACT.md; Pipeline owns RUN.md, not TEST-CONTRACT.md.
5. There is no scheduled finalization of the contract's active anchor/membership and activation record. The current-review comparison can remain A versus B, preventing normal continuation. Proceeding by silently editing another agent's artifact would violate ownership.

The same concern applies to finalizing recovery evidence after an accepted transition. A declarative “becomes active once accepted” is insufficient when other procedures require a stored active value and all calls are stateless.

**Minimum correction:** define an explicit ownership-respecting finalization handoff, or make a consistently specified derivation from the accepted review authoritative everywhere that reads the effective anchor. The accepted candidate, active membership, review Basis, and RUN history must agree before continuation. Finalization must not introduce a fresh source change or inadvertently supersede the review that authorized it. This is the previously requested activation implementation check, not a new architecture requirement.

### C1-I3 — MEDIUM: the orchestrator supplies inputs that test-review mode explicitly forbids

**Evidence:** [Pipeline's subagent-call convention, line 64](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/pipeline.agent.md:64) instructs calls to “planner and adversary” to read RUN.md and INTAKE.md. Its later stage-5b sentence adds test-review inputs but does not restrict the earlier rule to plan-review mode. In contrast, [Adversary's test-mode inputs, lines 35–42](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/adversary.agent.md:35) explicitly prohibit reading INTAKE.md and RUN.md.

**Concrete failure scenario:** the stage-5b invocation includes “read RUN.md and INTAKE.md” alongside the test package. The stateless reviewer receives conflicting instructions about its permitted inputs. Following the caller can bring raw requested scope or old human decisions into a review meant to challenge tests against the approved PLAN; following its mode contract means refusing part of the invocation. Neither is a coherent reusable handoff.

This matters to the approved separation between planning and test review and to the outcome-first evidence path. It is not a demand for mechanically isolated model reasoning.

**Minimum correction:** scope the INTAKE/RUN convention to Planner and Adversary's plan-review invocation. Make the stage-5b prompt use only its declared mode inputs, including approved amendment evidence where needed. Preserve PLAN as the requirement authority for test review.

## Accepted implementation clarifications

### Pipeline-owned Decision log

Accepted. The heading provides durable, pipeline-owned records for non-gate decisions, exceptions, retirement, and prerequisite commits without overloading the gate log or adding another artifact. [docs/questions.md](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/questions.md) records the question and Claude's answer. This is a reasonable implementation of the approved decision-recording requirement.

### Expanded pipeline-skill resume paragraph

Accepted. The approved acceptance criteria require the Phase 3 landing/current-review rules to agree across the orchestrator, FLOW, and pipeline skill. Updating the existing resume paragraph to express those rules is a necessary reconciliation of that requirement with the narrower file-list wording. Recording this clarification at closure is sufficient; no new architectural authorization is needed.

## Non-blocking documentation corrections

- **Terminal-approval claim:** [Tester, line 86](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/tester.agent.md:86) says all four diff forms are absent from the auto-approve list and prompt in Manual mode. The unchanged [settings, lines 26–33](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.vscode/settings.json:26) explicitly contain allow rules for the bare diff forms and SHA-to-HEAD patch/stat forms. The new source therefore overstates prompting, irrespective of deferred corporate approval-engine behavior. Correct the prose, not the locked settings. These are read-only commands, so this is not another material safety finding.
- **Initial-adoption diff spelling:** [Tester, line 93](C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/.github/agents/tester.agent.md:93) calls “git diff -- <path>” an already-allowed form, while the declared forms list bare diff and anchor-range variants. Use a consistent permitted form or document its scoped variant explicitly when fixing the adoption procedure.
- **Relied-on output fallback:** the approved contract permits observing relied-on identities through a scoped run when needed. Verifier's procedure currently requires their appearance in its contract/full-suite executions. Preserve an explicit way to obtain the required identity evidence when ordinary suite output is aggregate-only; do not infer execution from a passing aggregate.

Normative repetition remains a maintenance concern, but does not by itself block the next checkpoint. Keep this correction limited to the handoffs rather than undertaking a documentation reorganization.

## Direction for Claude

Correct C1-I1–C1-I3 within P3-C1, with the smallest corresponding procedure/contract cross-reference changes. The approved Phase 3 architecture, D6(a), both locked baselines, and the planned example scope remain valid.

Before recommending P3-C2, establish these three concrete outcomes:

- An initial adopted test's approved edit is present in the recorded anchor.
- An accepted amendment reaches a matching active contract/review basis through an authorized writer or unambiguous derivation.
- A stage-5b invocation does not request INTAKE.md or RUN.md.

No new architecture review, infrastructure, human gate, or model change is required.

**Final recommendation: TARGETED_CORRECTION_REQUIRED. Hold P3-C2 delegation pending these P3-C1 corrections.**

