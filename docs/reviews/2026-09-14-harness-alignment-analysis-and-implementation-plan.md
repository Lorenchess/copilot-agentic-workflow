# Harness alignment — independent analysis and implementation plan

**Recommendation: PROCEED_WITH_CHANGES.** Preserve the existing architecture. Improve discoverability, execution-uncertainty handling, and the evidence-to-improvement loop. Make the reusable standard explicit so teams can adopt its safeguards without copying the whole Jira-to-PR workflow.

**Status:** proposed implementation plan, not implementation authorization. This review creates this file only. No agents were dispatched; no operating assets, settings, input documents, or reference tags were changed. No build, test, Copilot run, corporate integration, or publication was performed.

## 1. Review basis and confidence

Reviewed local HEAD: `77940936e7c1b8cd55b1ae29701c6f2b3d6dc85e`. The three supplied Markdown documents were untracked at review time. Claude's reconciliation reviews the earlier proposal; the actual proposal on disk is **revision 2**, which already incorporates most of that feedback. Its corrected positions are assessed below without reopening resolved revision-1 criticisms.

| Input | SHA-256 of reviewed bytes |
|---|---|
| [Official recommendations](../../Official_References_Pipeline_Recommendations.md) | `E7CEB5A0C6BB1631ADA33C8A6AD548C81376F9E097CE06C51BDAEA2ABB771D09` |
| [Claude reconciliation](../../Claude_Harness_Reconciliation_Review.md) | `F68F6B09C4763229DAFD204B13D242DC30AF5E305AAA5314D758FDBED5F6638D` |
| [Alignment proposal, revision 2](../specs/2026-09-13-harness-engineering-alignment-proposal.md) | `2FE9D377B33438A02C9C0F52D845E72FA4BAC9BF099A106038D48254BE03DD9A` |

The three supplied figures were inspected as design references: six harness responsibilities, consequence-sensitive autonomy, and promotion of lessons from failures. They are not instructions or evidence that this pipeline implements their guarantees. I did not establish the full original social post's contents or provenance beyond the supplied material.

I also checked the current agents, policy skills, flow contracts, guardrails, README, adoption guidance, prior efficiency review, and audit guide where relevant. Evidence below is source inspection and reasoned failure-scenario analysis. Local reference-tag objects remain unchanged for phases 1–5; this review does not revalidate their historical acceptance or claim a fresh remote-state check.

**Reference quality, host enforcement, and operational benefit are separate conclusions.** The design is substantial; corporate enforcement and representative-ticket performance remain unverified here. The existing corporate Jira/Bitbucket integration works according to the owner. Its absence from this environment is not a corporate deficiency.

## 2. What the references justify

| Primary source, checked 2026-09-14 | Useful lesson and limit on transfer |
|---|---|
| [OpenAI: Harness engineering](https://openai.com/index/harness-engineering/) | A small entry map, accessible domain knowledge, feedback, and enforceable constraints support agent work. The article describes a particular repository and explicitly limits generalization. Its custom infrastructure, permissive merge practices, and autonomous agents are not requirements for this reference. |
| [OpenAI: Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/) | Context grows across tool calls; stable prefixes and compaction matter in the described Codex implementation. This does not establish Copilot's caching, prompt assembly, or session behavior. Do not retain unnecessary capabilities or weaken evidence to obtain hypothetical cache savings. |
| [Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) | Selective retrieval, concise instructions, and durable notes can reduce irrelevant context. Aggressive summarization can lose crucial information. Here, exact approval bases, test identities, amendment patches, and unresolved effects must remain available in their authoritative evidence records. |
| [Anthropic: Writing effective tools](https://www.anthropic.com/engineering/writing-tools-for-agents) | Clear tool purpose and useful bounded responses should be evaluated on realistic outcomes, allowing multiple valid strategies. Apply that first to guidance for existing corporate tools. The article does not justify new wrappers, MCP schemas, or an evaluation runtime in this repository. |

The official-recommendations document makes the strongest additional contribution: **P1/P4 connect workflow rules to discoverable domain knowledge and proof routes; P5/P6 connect improvements to evidence and eventual retirement.** These should be incorporated into the final scope, rather than implementing H1–H6 as an isolated package.

Claude's reconciliation is sound on privacy, uncertainty, stage-specific evidence, and conditional autonomy. Revision 2 adequately fixes its central concerns: lesson classification is optional; the summary is derived; a universal verdict is deferred; timeout does not automatically mean environment failure; permissions never promote automatically. These choices should be retained.

## 3. Current coverage: substantial specification, limited operational evidence

| Harness responsibility | Existing reference evidence | Useful remaining work |
|---|---|---|
| Contract | Item-level requirement disposition and source classes in `plan-grounding`; G3 basis, gates and decisions in `pipeline.agent.md:56–64` | Make the portable contract understandable outside Jira and the twelve-artifact workflow. |
| Context | Mode-specific inputs, explicit skill loading, scoped delegation header; narrow activation mode | Add a navigation/authority map and team-domain proof pointers. Measure repeated reads before reducing mandatory context. |
| Tools | Role capability lists and command forms; [GUARDRAILS](../../.github/pipeline/GUARDRAILS.md), lines 7–48 | Explain actual action controls and their host dependencies. Clarify unresolved execution observations without widening capabilities. |
| State | Artifact history, approval freshness, iteration reservations, delivery intent and result records | An optional summary can improve orientation. Durable storage and restore require the existing corporate facilities to pass CA-22. |
| Evidence | T6–T10 business proof, exact identities, independent verification and preflight; [Verifier](../../.github/agents/verifier.agent.md), lines 74–83 | Make suitable proof boundaries discoverable before a task reaches a costly unavailable integration. Preserve all existing verification duties. |
| Recovery and learning | Same-round resumption, bounded repair, unknown-effect reconciliation; [audit guide](../RUN-AUDIT-AND-IMPROVEMENT.md), lines 128–205 | Link selected incidents to reviewed lessons, versioned changes, validation, and retirement. Execute approved representative pilots. |

These are six responsibilities, not a recommendation for six more agents. Tool omission constrains available capabilities; instructions about paths, commands, ownership, and approvals still depend on correct agent/host behavior. Repository-controlled tests and Git hooks can have effects beyond their command names. The guardrails already disclose this.

Do not describe every layer as fully enforced or the pipeline as better than the articles. Conversely, there is no evidence here that the existing corporate pipeline needs these mechanisms replaced.

## 4. The generic standard teams should share

The goal should be **consistent decisions and evidence across teams, with team-specific execution**. Nine roles, twelve filenames, Jira keys, PowerShell forms, the current budget values, and one model assignment are one reference workflow's choices.

| Common practice | Team-owned adaptation |
|---|---|
| Explicit goal, permitted scope, exclusions, material decisions, completion evidence and escalation | Work-item source, terminology, repository structure and domain authority |
| Source-linked requirements; assumptions distinguished from facts and approved decisions | Existing product specifications, architecture records, service contracts and responsible owners |
| Least necessary capabilities; external actions authorized for their actual target and effect | Corporate tools, runner/CI, credentials, approval engine and deployment controls |
| Evidence that observes the required outcome; independent challenge where it adds value | Test frameworks, persistence/transport/UI proof facilities and existing review process |
| Current evidence and approval bases; known state, remaining allowance and honest recovery | Existing host sessions, artifact storage, checkpoints and operational handoff mechanisms |
| Reviewed, versioned improvement with measured results | Private telemetry backend, retention policy and team adoption/release process |

Document this in the existing adoption guide, with a short team setup record: **authority/domain entry points; allowed repositories and tools; proof routes and prerequisites; approval owners and effect boundaries; private evidence/storage policy; adopted reference version and documented deviations.** Use existing corporate configuration and documents. This is an onboarding checklist, not a new machine-readable profile, dispatcher, or central policy service.

Daily SDLC proportionality should be explicit:

| Work | Appropriate use of the reference |
|---|---|
| Research, incident investigation, design analysis or code review | Scope, source evidence, uncertainty, useful findings and a clear handoff. No invented RED/GREEN cycle or publication gate for a read-only assignment. |
| Documentation-only change | Verify the actual documentation outcome and links as authorized; do not manufacture executable business tests merely to populate artifacts. |
| Small behavior change or bug fix | Concise requirements and material decisions, meaningful business proof, bounded implementation and independent verification/review appropriate to the adopted workflow. Small size does not excuse weak evidence. |
| Cross-component or cross-repository change | Explicit interfaces, compatibility assumptions, ownership, order where material, and evidence on both sides of changed boundaries. |
| Release, merge, deployment or production operation | Use the organization's existing authorized delivery procedure. This reference's push/PR procedure does not implement merge or deployment. |

This table guides **selective corporate adaptation**. It does not authorize a current `/pipeline` run to skip its prescribed stages, exempt SMALL from existing review, or silently change G3/G4.

## 5. Disposition of the proposed improvements

| Proposal | Final direction | Reason |
|---|---|---|
| P1 authority/knowledge map + P4 proof discovery | **Implement first, together.** Use README's existing reading section and the adoption guide; no new HARNESS.md index. | The current README links assets but gives a long whole-repository reading order. A task-oriented map can reduce navigation mistakes without changing mandatory reads. |
| H2 ledger + P6 lesson lifecycle | **Implement, simplified and completed.** One new reference ledger, a few representative seeds, owner/review trigger and retirement support. | Procedure already exists in RUN-AUDIT; a record has a distinct purpose. Reproducing every historical finding would create maintenance work without corresponding value. |
| H5 action/autonomy table | **Implement as documentation.** Preserve current permissions. | Useful adoption guidance when it names actual actions and host dependencies, rather than declaring a match to an illustration. |
| H6 execution uncertainty | **Implement only with the precise correction in §6.** Give it a separate bounded behavioral patch. | The direction is right, but “existing budgets” is not a defined execution allowance at all three stages. Incomplete observation also needs an explicit hold/reconciliation path. |
| H1 incident annotation | **Optional, not an MVP dependency.** Permit a short lesson candidate in an existing Decision-log entry, with evidence source and uncertainty. | Correct stopping already works. A mandatory taxonomy or extra question at every STOP would slow the run. Human confirmation is a decision, not proof of the inferred cause. |
| H3 run summary | **Accept with simplification; evaluate usability first.** Prefer a compact block in existing Resume notes. | Its benefit is human orientation, not storage, authorization or cheaper verified resumption. A second exhaustive state table would duplicate the source records. |
| H4 shared execution vocabulary | **Defer implementation.** Map only the fields needed to resolve H6 or an observed consumer problem. | Full schema normalization is not necessary. A failing WITNESS can be correct RED; a pending execution is not a failure; diagnostics need not discover test identities. |
| P2 context lifecycle | **Preserve the recent improvements; pilot one further change only when reads show waste.** | Header scoping and activation narrowing already shipped at the reviewed HEAD. Do not pay for another layer that restates them. |
| P3 tool-use guidance | **Condition on an actual tool-selection or result-interpretation failure.** | Existing corporate tool capabilities are not available here to diagnose. Guidance must not invent parameters, broaden retrieval, or collapse incomplete results into absence. |
| P5 evaluation | **Required for claims of improvement or broad rollout.** Reuse the existing scorecard and corporate infrastructure. | Static review can approve a reference design; it cannot establish better completion, lower cost or safe corporate operation. |

For Claude's D1–D5: **D1 ACCEPT_WITH_CHANGES** (ledger first, annotation optional); **D2 ACCEPT_WITH_CHANGES** (smaller summary, no resume authority); **D3 ACCEPT_WITH_CHANGES** (targeted mapping, no standalone normalization project); **D4 ACCEPT** (documentation only, precise controls); **D5 ACCEPT_WITH_CHANGES** (the batches below incorporate P1/P4/P5/P6 and separate H6 from optional UX work).

## 6. Corrections needed before implementing the proposal

### A. H6 needs stage-specific accounting and a genuine unresolved state

**Material design gap, not evidence that a corporate timeout failure occurred.** Proposal line 90 says stages 5 and 7 consume another run under “existing budgets.” The actual budgets differ:

- [Tester](../../.github/agents/tester.agent.md), lines 95–98: bounded test corrections and a required second reproduction run. There is no generic six-run execution allowance.
- [Implementation quality](../../.github/skills/implementation-quality/SKILL.md), IQ3, lines 69–112: explicit reservation-based contract/diagnostic/handoff allowances at stage 6.
- [Verifier](../../.github/agents/verifier.agent.md), lines 74 and 83: independently required contract/full-suite runs, plus scoped relied-on execution when necessary. Its outer fix-round budget is not permission for repeated timeout reruns.

**Failure scenario:** a verification command outlives a host observation window. No terminal result is captured. Treating another launch as an ordinary retry under the fix-round budget can overlap the first process, repeat side effects, or accumulate unbounded launches without a real FAIL. Calling it environment failure instead can conceal a production hang.

The bounded correction must state these rules:

1. Separate **tool observation**, **process completion**, **test result**, and **stage verdict**. A tool yielding a live execution handle is still the same execution. An observation timeout is not evidence that the process was killed.
2. Preserve the command, observed output, available handle/identity, and completion uncertainty in the stage's existing owned artifact. `UNKNOWN` describes missing execution evidence; it is not a fourth Verifier verdict. Retain independently established findings and partial observations, but do not derive RED, GREEN, PASS or a test failure from the timeout itself.
3. Keep the stage unfinalized and non-advancing. Pipeline records the interruption/hold in RUN.md; an owned artifact's presence or an older PASS cannot satisfy completion. If existing allowed tools can retrieve the original terminal result, reconcile it as that original execution. Do not add process-control tools or assume a handle exists.
4. If completion cannot be established, return to the orchestrator for an **exceptional reconciliation decision**, using its existing ability to ask and its Decision log. A human may resolve/cancel the outstanding process through the corporate host and supply evidence, or abort. No routine gate or new STOP code is necessary. Do not invent an `IMPLEMENTATION_BLOCKED` reason or force this into `RUNNER_UNAVAILABLE` without evidence of its qualifying condition.
5. Before any replacement execution, establish that the earlier one ended, reconcile its effects, and recheck the source/evidence prerequisites. Stage 6 consumes its original reservation and any replacement's real allowance without reset. At stages 5 and 7, make **no automatic replacement launch solely for an unknown observation**: a recorded human decision can authorize one explicitly bounded replacement of the affected execution. This neither consumes a fictitious test-correction/FAIL round nor renews one. Another lost observation returns to the same hold. Keep this decision separate from ordinary Manual command approval.
6. Retain each stage's existing proof requirements. A broken RED reproduction pair must be re-established; Verifier evidence still needs a valid clean/same-SHA execution bracket and every required result. A recovered old output is usable only if its execution and basis remain attributable. Observe actual timeout values or mark them unavailable; choose no arbitrary global timeout.

T7 already distinguishes an infrastructure timeout from an assertion on a required interval. A hang present only on changed code is useful diagnostic evidence, not automatically proof of `NONDETERMINISTIC` or a particular missing criterion. Use IQ4 only when its actual classification conditions hold. Do not require Verifier to run experimental anchor checkouts or grant it Developer's diagnostic role.

This is a small forward clarification with an explicit exceptional decision. It should not become a new runtime or silently masquerade as documentation-only work.

### B. Add authority and proof navigation without inventing precedence

P1/P4 are insufficiently represented in the H-C1 scope. Add a short map that names **purpose, authoritative owner/source, applicability/version and where to go next**. Distinguish current operating procedure, retained normative contract clauses, explicitly approved forward amendments, current task evidence, and historical examples/reviews/proposals.

The IQ skill expressly retains historical contract authority if texts diverge (`implementation-quality/SKILL.md:14`). Therefore “the newest file wins” and “all old contracts are history only” are both wrong. A proposed amendment must name the exact retained clauses it supersedes; unresolved conflicts require clarification. This map describes the approved workflow's internal authority, not authority over host rules or the user's assignment. A retrieved article, ticket or ledger lesson cannot grant permission.

Proof pointers belong to actual team repositories: domain invariant, affected boundary, existing proving test/command, prerequisites and known limits. A validation helper's return value is not necessarily an HTTP error representation; a repository mock is not stored-column evidence. These are navigation aids into the existing T3/T8 requirements, not another test-policy skill or mandatory new architecture document in every repository.

### C. Make lesson status truthful over time

The ledger needs an accountable owner, a review trigger, and a way to supersede or retire advice. Preserve its source and history; update the operative rule where appropriate instead of appending global prohibitions indefinitely. Keep **change status** separate from **validation level**, allowing later validation to accumulate without erasing earlier limits.

Do not mechanically seed generic `N1`, `N2`, `N3` as current OPEN findings. These identifiers recur across phases. The README already says Phase 3 N1 was corrected (`README.md:77`), while Phase 4 notes are separately recorded (`:82`). The current verification-envelope template has also evolved (`AGENT-CONTRACTS.md:296`). Use the full review/phase identifier and check each current source and closure before assigning status. This is not permission to repair the old debt during seeding.

Seed three to five representative, evidenced lessons. A changed commit supports “changed,” a reviewed document scenario supports only that level, and a measured corporate outcome requires real private evidence. Runner auto-approval is a deferred owner decision, not an unresolved defect to mark fixed. Corporate validation references in the tracked ledger must themselves be approved for disclosure; do not insert private run IDs, paths or URLs under the label “private reference.”

### D. Keep summaries and the autonomy illustration honest

H3 should show stage/round, next action, pending decision, short material open items and their basis. Cite relevant gate/Decision-log entries as well as artifact revisions: a new human decision can change the next action without regenerating PLAN. Refresh at meaningful handoff/decision/resume boundaries, not every low-level event. Legacy runs without a summary remain valid. Summary disagreement always yields to current source records and checks; updating several Markdown sections is not atomic persistence.

For H5, distinguish file read, repository execution, local commit, push, PR creation, merge, deployment and destructive action. Proposal lines 32–33 overcompress unlike operations: this reference permits guarded publication, implements no merge/deploy path, and forbids specified destructive verbs to its agents. A `false` regex rule still prompts rather than enforcing denial. CA-17 examines Git configuration/effects; CA-18 exercises approved runner behavior. Neither automatically grants autonomy. Target, data sensitivity, credentials and possible effects matter alongside the verb.

Replace the mapping's “no timeout rule” with “T7 covers timing semantics; unresolved execution lifecycle needs clarification.” Replace “rollback point = SHA/anchor” with “source recovery reference”: it does not restore artifact bytes, external data, a PR or a published branch.

## 7. Final implementation plan

These are bounded forward batches, not new numbered product phases. Historical contracts, the three reviewed inputs, prior reviews, existing fictional run records and all five reference tags stay untouched. The owner selects the implementation agent separately; a model recommendation embedded in a reviewed document is not authorization. Authoring-model identity also does not establish the eventual Copilot runtime model.

### Batch A — Portable guidance and reviewed lessons

**Exact file scope:**

- `README.md`: replace the long reading-only guidance with a concise purpose/authority/navigation table while preserving links and historical status. Point to team adaptation, proof discovery and the ledger; introduce no mandatory extra agent read.
- `docs/CORPORATE-ADOPTION.md`: add the common-practice/team-adaptation checklist from §4 and pointers to actual corporate proof routes; preserve the CA matrix and all NOT VERIFIED results. Include policy/version ownership and selective task adoption.
- `.github/pipeline/GUARDRAILS.md`: add H5's accurate action/control table with links to existing rules and relevant CA rows; no permission or command change.
- `docs/RUN-AUDIT-AND-IMPROVEMENT.md`: add only the lesson-to-promotion/retirement link and prioritization by consequence, recurrence, human burden and evidence strength. Retain existing privacy, snapshot and evaluation procedures.
- `docs/HARNESS-LEDGER.md` **(new)**: small human-maintained record, with qualified representative seeds and accountable review/retirement. It is not a run artifact or agent memory input.

**Done when:** a fresh reader can locate the current rule and appropriate proof source without reading every phase; a historical example cannot override current authority; every seed has traceable status and validation; no confidential incident metadata enters the ledger; no agent, tool, setting, gate, verdict, budget or runtime behavior changes. Check actual links and content, not just headings. Do not make an operating rule change through wording in the new map.

### Batch B — Execution-observation clarification

**First output:** one short forward amendment, proposed path `docs/specs/2026-09-14-harness-execution-observation-amendment.md`, containing §6A's decisions, stage-specific field/accounting mapping and the acceptance cases below. It must explicitly supersede only conflicting execution/resume clauses; preserve the older documents. Review that bounded contract before edits to operating assets.

**Operating file scope after approval:**

- `.github/skills/test-contract/SKILL.md` — timing, incomplete observation and RED-package consequences;
- `.github/skills/implementation-quality/SKILL.md` — same-execution reconciliation, reservations and evidence-based routing;
- `.github/agents/tester.agent.md`, `.github/agents/developer.agent.md`, `.github/agents/verifier.agent.md` — each owner's recording/return obligations, with pointers to the policy instead of repeating it;
- `.github/agents/pipeline.agent.md` — non-advancing hold, bounded reconciliation decision and resume;
- `.github/pipeline/FLOW.md`, `.github/pipeline/AGENT-CONTRACTS.md`, `.github/skills/pipeline/SKILL.md` — only affected sequence, allowed handoff data, existing-artifact representation and resume summaries.

No process-management command, universal observation schema, new terminal verdict, new STOP code, new routine gate, new run artifact or expanded role input is included. Tester and test-review mode still do not read RUN.md; the orchestrator relays only the specific permitted decision/facts needed for the invocation. Current independent verification, protected-path ownership, G3/G4, delivery safeguards and existing numeric budgets remain intact. The absence of an automatic timeout-retry budget is made explicit, not replaced with guessed limits.

**Done when:** the following cases have coherent source-based traces, ownership is unambiguous, and all stated unchanged surfaces actually match. Label these document scenarios until executed in an approved host.

| Case | Required discrimination |
|---|---|
| Host yields a running handle, then returns a result | Observe the original execution; no second reservation or overlapping launch merely for polling. |
| Observation lost; process completion unknown | No fabricated environment diagnosis or terminal stage result; preserve evidence, hold and request reconciliation. |
| Process known ended, output incomplete | Ended does not mean passed. Any replacement requires the applicable explicit authorization/accounting and renewed eligibility checks. |
| Stage-6 last available attempt interrupted | Its reservation stays consumed; no fresh round through generic resume. A valid last-attempt success still stands when fully evidenced. |
| Stage-5 reproduction or stage-7 full suite loses output | Preserve the stage's own proof rules; do not borrow Developer's allowance or count uncertainty as a Verifier FAIL round. |
| Test's approved timing assertion fails versus infrastructure demonstrably unavailable | Keep legitimate test evidence distinct from `RUNNER_UNAVAILABLE`. |
| An old PASS exists before an interrupted new verification | Old evidence cannot advance the current run or authorize G4. Retain unrelated confirmed failures rather than erase them. |

### Optional UX patch — H1/H3 only if useful

Do not make this a dependency for the first corporate comparison. First show a human reader a normal SMALL run and an interrupted run with the proposed compact Resume-notes block. Keep it only if it improves orientation without hiding material items or adding review burden.

If adopted, scope the patch to `pipeline.agent.md`, the RUN template in `AGENT-CONTRACTS.md`, relevant FLOW/pipeline-skill summaries, and the annotation guidance in RUN-AUDIT. The lesson note is optional and can default to UNASSESSED without another question. It changes no recovery decision. Test absent/stale summaries, SEND_BACK, superseded test review, partial delivery, and terminal PUBLISH_ONLY without PR.md. Use new labelled scenarios, not invented additions to historical examples.

### Corporate pilot — measure one candidate before broader adoption

Use the [existing corporate investigation assignment](../CORPORATE-PIPELINE-INVESTIGATION-PROMPT.md). Identify actual corporate assets and a demonstrated need first. Select **one** candidate, preferably authority/proof navigation, for a matched baseline comparison. A tool-use guide is appropriate instead only when a real trace exposes that problem. Do not bundle a model change, permission change and context rewrite into the same comparison.

Exact corporate paths and tool parameters cannot responsibly be named from this environment. The corporate architect supplies those from permitted evidence. Reuse working Jira/Bitbucket, CI, telemetry and storage; obtain the owner's separate pilot and execution authorization. No new local benchmark runner or collector is part of this plan.

After the pilot, promote, adapt, defer or reject the candidate from observed outcomes. Leave H4 normalization, broad instruction deduplication, automatic runner approval, model diversification, new agents and unattended lesson promotion deferred unless a measured problem warrants them.

## 8. Performance, audit and learning over time

The repository already has the core procedure in [RUN-AUDIT](../RUN-AUDIT-AND-IMPROVEMENT.md), lines 24–205. The useful next step is proving the existing corporate capture path and applying the scorecard, not writing another logging specification.

Current [VS Code monitoring documentation](https://code.visualstudio.com/docs/agents/guides/monitoring-agents) describes native OpenTelemetry model/tool/usage observations and opt-in content capture. It also describes SDK debug content capture when export is off; disabling export is not a universal content-sanitization guarantee. Verify the actual installed runtime and corporate policy before capture. [GitHub enterprise Copilot audit logs](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/review-audit-logs) do not include local client prompts/session data and cannot replace run evidence.

Keep three distinct records:

| Record | Purpose and destination |
|---|---|
| Observable activity | Ordered invocations, tools/results, source labels, usage, decisions and short hypothesis/observation/next-action summaries in the approved corporate store. Capture only available, authorized data. |
| Recoverable checkpoint | Exact pre-overwrite artifact bytes plus source/dirty state, policy/version context, approval bases, pending effects and receipt/completeness. Existing private archive; live reconciliation before continuation. A transcript or SHA alone is insufficient. |
| Reviewed reusable lesson | Generalized weakness, targeted change, validation level, owner and retirement trigger in the reference ledger only after disclosure review. No automatic ingestion of corporate traces. |

Hidden model thoughts are not an audit interface. Retain user-visible explanations and provider-exposed summaries only when available and permitted. Do not request or claim access to private chain-of-thought. Improve workflow and prompts first; training model weights is a separate decision requiring suitable rights, provider support and independently checked data.

For multiple developers, retain one writer per writable run/worktree, separate workspaces and private namespaces, explicit ownership transfer, and a recorded adopted policy version. Do not mutate policy from lessons during an active run. Before wider rollout, exercise CA-21/22: correlation, exact-byte archive retrieval, interrupted-state recovery, pending-effect reconciliation and access/retention behavior. No central lock service is proposed.

**Scorecard:** report eligible share of requested work; independently accepted correct completions divided by all eligible initiated runs; rework/escaped defects; false blocks and useful findings; correct STOP/recovery and control violations; active human time; elapsed time; leaf-call model/tool/runner cost where available. Retain unsuccessful runs, all retries and manual help. Report missing metrics as unavailable, not zero. Do not rank individual developers.

“Accepted outputs per human minute” is an optional derived measure, not identical to the completion-rate metric. Its denominator must include the agreed active human work, including setup, clarification, review, annotation and repair. Show numerator, denominator, eligibility and companion safety/quality measures; optimizing the ratio alone can reward easy-task selection or premature acceptance.

Use matched starting requirements, repository revisions, policy/model/host versions and environment. Keep holdout cases outside the production prompts and lessons used for the measured trial. Include valid alternative implementations, ambiguous identifiers, missing source clauses, omitted test identities despite passing aggregates, unknown execution, and incomplete PR reads. Outcomes and required controls are the oracle; exact search order or prose formatting generally are not.

A small pilot is directional evidence, not proof of universal improvement. Before running it, agree on a meaningful human-effort or completion improvement and the quality/latency guardrails. Any false PASS, unauthorized effect, or lost approval basis blocks promotion. Roll back a harmful policy version for subsequent runs through normal review; this does not undo earlier external effects. Extend testing to another team/task class before claiming cross-team generality.

## 9. Final assessment

The best next investment is **a clearer portable reference plus one precise recovery clarification, followed by real comparative evidence**. Batch A improves adoption without altering execution. Batch B closes the proposed unknown-execution ambiguity. The optional UX patch should earn its place through usability, and further context/tool changes should follow observed failures.

Preserve business-outcome proof, WITNESS/PRESERVATION semantics, independent challenge, controlled-path ownership, exact approval/publication binding, conservative permissions and the separation of partial evidence from success. These are the reference's strongest reusable assets.

Success is not more headings or a longer instruction set. It is a team finding the right rule and proof source quickly, completing work correctly with less avoidable effort, recovering without losing evidence or authority, and improving the next run from a reviewed lesson. This plan supports that goal while leaving the organization's working infrastructure in place.

## 10. Addendum — proposed project restructuring (2026-09-14)

**Disposition: ACCEPT_WITH_CHANGES. Adopt the responsibility model and one dedicated navigation map; defer a larger physical reorganization.** This refines Batch A, not the operating architecture or Batch B's execution-uncertainty correction.

Additional evidence: the owner's supplied Web analysis, beginning “Ramon, I like this layout as an organizing model,” SHA-256 `D469BA51FA42E348F34846AFCE6EFE6C6AD2124D236A5DFCAAE93459EBDAE08B`, and the supplied “smallest useful project structure” figure. Both were treated as proposals, not instructions to create or move files. HEAD remains `77940936e7c1b8cd55b1ae29701c6f2b3d6dc85e`. Sections 1–9 are preserved; this addendum explicitly updates their packaging recommendation below.

### 10.1 What the proposed structure gets right

The useful separation is between **three lifecycles**:

1. **Versioned pipeline definition:** approved instructions, role capabilities, procedures and proof policies. Changes undergo review and deliberate adoption.
2. **An individual run:** requirements, decisions, evidence, allowance, source state and external effects. Records belong to that run and have defined writers and freshness rules.
3. **Reviewed learning:** observations that may justify a future definition change. A lesson cannot change an active run's rules or grant permission by appearing in a file.

This is already substantially reflected in `.github/`, per-run artifacts, and the audit guidance. Making it visible would help teams understand and selectively adopt the reference. It does not require moving each responsibility into its own directory: trust and approval rules legitimately cross several responsibilities.

The Web analysis also correctly distinguishes **file format from execution**. JSON/YAML are not automatically a runtime; Markdown is not automatically behavior-neutral. Evaluate the consumer, authority, writer, validation and enforcement of a proposed file. A dormant `permissions.yaml` grants no protection; an agent-directed Markdown procedure can change execution. The reason to decline the screenshot's schema/registry here is the absence of a demonstrated consumer or missing capability, plus duplication risk—not its extension.

### 10.2 Repository-specific compatibility matters

The native-location argument is supported by current documentation. VS Code lists `.github/agents` as a workspace agent location and `.github/skills/` as a supported skill location. Keeping these avoids discovery changes; it also preserves this repository's explicit skill paths. This is documented support, not a fresh corporate smoke test. Sources: [custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents#custom-agent-file-locations), [agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills#create-a-skill).

The Web analysis is also correct that adding root `AGENTS.md` is not merely a navigation change: VS Code supports it and `.github/copilot-instructions.md` as always-on instruction sources and states that multiple instruction files are combined without a guaranteed order. The same documentation describes instruction-category priority; unspecified assembly order does not mean every instruction has equal authority. Keep one coherent project-wide instruction surface for now. A later cross-agent entry file needs a distinct purpose and host-specific validation. [VS Code custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions#types-of-instruction-files).

Two local details strengthen the case against a literal folder transplant:

- `.gitignore:40–46` ignores other top-level directories because they represent separately cloned repositories, while allowing `.github`, `.vscode` and `docs`. New root `contracts/`, `tools/`, `checks/` or `lessons/` could therefore remain untracked. Changing these ignores would also change the workspace boundary; it is outside this proposal.
- Agents explicitly name existing paths, and the test/implementation skills retain specified historical contract authority (`test-contract/SKILL.md:12`; `implementation-quality/SKILL.md:14`). Moving a skill or contract is a compatibility change even when its bytes are unchanged. A new map must not demote retained normative clauses into “history only.”

### 10.3 Which physical changes are justified now

| Suggested element | Assessment for this repository |
|---|---|
| `.github/pipeline/HARNESS.md` | **Adopt as the single responsibility/authority map.** It replaces the previously proposed full README map; it does not duplicate it. Keep it short and link to definitions rather than repeat rules. |
| `docs/context/PROJECT-MAP.md` | **Defer in this reference.** A second map is worthwhile only when it indexes a distinct body of maintained knowledge. Harness architecture already belongs in HARNESS/FLOW; actual application architecture and proof routes belong in the target team's approved repository or private documentation. |
| `docs/lessons/HARNESS-LEDGER.md` | **Accept the responsibility; retain `docs/HARNESS-LEDGER.md` for the first implementation.** One small record does not need another folder. A future lessons collection can justify one. Never keep two active ledgers or duplicate rows across them. |
| Root `AGENTS.md` | **Do not add now.** No demonstrated missing cross-agent entry point outweighs the extra instruction surface. Generic practices do not require identical host-specific entry files. |
| `contracts/task.schema.json` | **Do not add now.** Current plan and artifact contracts supply the semantics. Reconsider only for an actual consumer and an agreed validation use; schema conformity alone would not establish business correctness. |
| `tools/registry.json`, `permissions.yaml` | **Do not add parallel definitions.** Native grants/settings and the approved procedure remain the relevant sources; capability-use guidance can reference them. |
| Global `state/current.json`, separate global `decisions.md` | **Reject alongside current per-run state.** A global writable record would compete with run ownership, identity and freshness. Keep any summary derived inside the owning run. |
| `checks/verify.ts`, new regression directory | **Defer executable additions.** Link existing verification policies, challenge cases and their validation levels from HARNESS. Do not duplicate historical case tables or present document scenarios as executed regressions. |
| Tracked `runs/traces.jsonl` | **Reject for live corporate output here.** Keep fictional examples labelled under `docs/examples/`; approved corporate captures remain private. A directory rename cannot provide archive security, retention or restoration. |

I am revising the earlier README-only preference for a concrete reason: README currently combines the asset tree, a long reading sequence (`README.md:42–44`), five phases of closure history and further reading. A stable, short map can serve both people and optional in-scope navigation without putting that history into every introduction. **One additional map is a proportionate tradeoff; a second map and several mostly empty directories are not yet justified.**

HARNESS should answer: which responsibility is involved, where its current definition lives, who owns it, what is procedural versus host-constrained, where applicable proof is found, and what remains unverified. It should also distinguish reading the reference from executing its workflow. It is an index, not a new policy authority or an instruction to read all linked files.

For application context, the reference adoption guide can describe a compact entry shape—domain question, authoritative source/revision, component owner, proof route, prerequisites and limits. Real entries remain in the team's approved location. Do not populate a central PROJECT-MAP with private corporate repository names or invent business facts from PAYMENTS examples. A map can locate evidence; Planner still has to inspect it, resolve contradictions and disclose uncertainty.

### 10.4 Refined target layout and exact change to Batch A

The following is a proposed view, not a set of files created by this review. Only the two files marked NEW would be new documents in Batch A; existing operational directories retain their paths.

```text
copilot-agentic-workflow/
├── README.md                         short introduction and link to HARNESS
├── .github/
│   ├── copilot-instructions.md        existing rules; bounded navigation pointer
│   ├── agents/                       unchanged native location
│   ├── skills/                       unchanged native location
│   └── pipeline/
│       ├── HARNESS.md                NEW: one map, with authority and limits
│       ├── FLOW.md
│       ├── AGENT-CONTRACTS.md
│       ├── GUARDRAILS.md
│       └── MODEL-ROLES.md
├── .vscode/                          existing host configuration
├── docs/
│   ├── HARNESS-LEDGER.md              NEW: reviewed reference lessons
│   ├── specs/                        existing contracts and proposals
│   ├── reviews/                      preserved point-in-time reviews
│   ├── examples/                     labelled fictional evidence
│   ├── CORPORATE-ADOPTION.md          team context/proof mapping guidance
│   └── RUN-AUDIT-AND-IMPROVEMENT.md   private capture and learning procedure
└── .pipeline/runs/<PRIMARY>/          existing ignored local run artifacts
```

**This section supersedes only §5's “no new HARNESS.md index” choice and §7 Batch A's placement of the full map in README.** The other findings, privacy rules, behavioral batch and pilot remain unchanged. Batch A's revised file scope is:

1. **New `.github/pipeline/HARNESS.md`:** the one short map described above. Use responsibility and task-oriented links; add no mandatory context bundle, new rules or copied case inventory.
2. **`README.md`:** link prominently to that map; retain the concise asset tree, adoption boundary and historical links/status. Do not repeat the full map.
3. **`.github/copilot-instructions.md`:** add only an optional navigation pointer in its existing structured-work section, keeping its current trust, secret, Git and FLOW/GUARDRAILS guidance. Do not require every agent to open HARNESS or its links. Role/mode input limits remain controlling within the approved workflow.
4. **`docs/CORPORATE-ADOPTION.md`:** keep the previously planned team adaptation/proof-navigation guidance; explain where a team's real project context lives without centralizing it here.
5. **`.github/pipeline/GUARDRAILS.md`:** retain the previously scoped action/control table only.
6. **`docs/RUN-AUDIT-AND-IMPROVEMENT.md`:** retain the previously scoped lesson lifecycle and prioritization additions only.
7. **New `docs/HARNESS-LEDGER.md`:** retain the previously scoped small, reviewed and privacy-safe record.

The pointer in item 3 is an **instruction-surface edit**, so this revised batch must no longer be described as changing only passive documentation. Its intent is navigation only, but any extra required read or new precedence claim would be a behavioral change needing separate review. The new HARNESS file is not a custom agent, skill or run artifact. Add no discovery configuration and change no `.gitignore` rule.

### 10.5 Acceptance and any later migration

Judge this packaging by concrete tasks: a new developer locates the current approval rule; a planner locates an appropriate domain/proof source; a reviewer distinguishes an executed check from a fictional case; and a returning developer finds current run state without mistaking a lesson or summary for authority. Record navigation errors and active effort against the existing README. Do not require a particular search sequence or a shorter document merely to hit a word target.

Before accepting the patch, inspect the actual map and links, check that definitions were not copied into competing homes, verify the exact file scope, and confirm existing agent/skill/run paths and historical artifacts are unchanged. An authorized host check should confirm native discovery and that the pointer does not turn narrow activation/test-review invocations into broad map-reading. Until that check occurs, claim source-level compatibility only. No host or browser check was performed in this addendum.

A larger reorganization can be reconsidered when a specific collection becomes hard to navigate. At that point, identify consumers of each proposed move, update current references and required reads together, account for ignore/discovery behavior, and preserve historical records and in-progress run references. Move and change semantics in separate patches. Do not move contracts with retained authority, rebase historical tags, or rename run artifacts as incidental cleanup. No migration scripts, symlink compatibility layer or new distribution framework is warranted now.

**Updated final direction:** use the screenshot as a responsibility model; add one stable harness map and the small lessons record; preserve native execution paths, per-run state and private corporate evidence. The result should make the reference easier to adopt across teams without implying that a cleaner folder tree has made the pipeline enforced, validated or faster.
