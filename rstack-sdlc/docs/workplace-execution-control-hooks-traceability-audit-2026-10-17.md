# RSTACK-SDLC — Workplace Audit: Deterministic Execution Control, Copilot Hooks, and Traceability

**Date:** 2026-10-17  
**Status:** Audit and implementation-planning brief — **NOT authorization to modify the workplace pipeline**  
**Audience:** RSTACK engineering agents, independent reviewers, and the workplace implementation owner  
**Scope:** The actual, currently deployed **workplace** AI software factory; use the public `rstack-sdlc/` project only as a reference, never as proof of workplace behavior.  
**Target host:** The VS Code GitHub Copilot configuration actually available and approved at work. Claude Code may help analyze or implement authorized changes, but its behavior is not evidence of Copilot-host capabilities.  
**Outcome:** An evidence-based current-state audit and a staged, reviewable improvement plan for the three owner priorities below. **Stop after presenting the audit and plan for human approval.**

> **Central design objective:** Keep the deterministic code engine authoritative for what is allowed, accepted, retried, promoted, and recorded. Let the Copilot coordinator/agents act as an execution transport through whatever the **actual supported host** offers. Use hooks and restricted execution environments for preventive guardrails where demonstrably supported. Capture sufficient trustworthy telemetry to reconstruct, diagnose, and improve each run. Do **not** assume a callable agent SDK exists in the workplace environment.

## 0. The three outcomes to investigate

1. **Deterministic engine execution control (P0).** Prove that a single engine owns workflow state, role authorization, transitions, retry budgets, phase acceptance, human decisions, and promotion. Identify places where an LLM/coordinator can still self-select a phase, forge authority, bypass checks, or perform external side effects. Differentiate **safety** (unapproved work cannot be *accepted/promoted*) from **liveness** (the Copilot host actually invokes the next worker and finishes). Without an agent-invocation SDK, the engine can own safety but may need Copilot-mediated dispatch for progress.
2. **Hooks and enforceable guardrails (P0).** Determine which **real** host/harness lifecycle hooks exist, run for subagents, and can prevent a tool action **before it executes**. Map their coverage, trust boundary, tamper resistance, fallback behavior, and gaps. Build a defense-in-depth plan: engine policy, capability-restricted roles, trusted hook checks where supported, operating-system/worktree isolation where warranted, and independent post-execution validation. Do not call a post-hoc diff check a sandbox.
3. **Traceability and continuous improvement (P1; P0 for audit/security evidence).** Reconstruct the causal path from authorized request to each dispatch, agent/tool activity, permission decision, output, deterministic gate, retry, approval, and final proposal. Separate **authoritative execution evidence** from **untrusted host diagnostics** and **post-run learning artifacts**. Make gaps and unknown token/cost data visible instead of fabricating them.

**Explicit non-goal:** Replacing the TypeScript engine with a Python factory, forcing an unsupported Copilot SDK, rewriting the entire SDLC, implementing HOTL as unchecked autonomy, adding agents for deterministic shell commands, or adopting another project's permission logic without threat-model review.

## 1. Safety, confidentiality, and audit-only first pass

- The public [copilot-agentic-workflow](https://github.com/Lorenchess/copilot-agentic-workflow) repository **must not receive employer source, organization/repository identifiers, company URLs, internal prompts, ticket text, secrets, auth data, execution logs, proprietary diagrams, or trace exports**. Work on sensitive evidence only in company-approved workspaces and storage; share only sanitized, approved conclusions outside the company.
- On the first pass: **read and inspect only**. Do not alter production code, agent files, hooks, settings, tool permissions, policy, tests, workspace security settings, credentials, CI/CD, branch rules, run evidence, or approval records. Do not initiate agent dispatches, tool calls with external effects, actual pipeline runs, security experiments, merges, or deployments without separate authorization.
- Use a **separate, disposable, non-sensitive fixture** after explicit approval for negative/security tests; never attempt destructive examples against real company systems. Observe and preserve original behavior.
- Record: repository and revision; workspace/extension/VS Code versions; selected Copilot **harness and session target**; enterprise policy restrictions; current run start command; profiles; actual available tools and hooks. If access is unavailable, label `UNVERIFIED` rather than extrapolating from the public reference.
- Do not infer effective model, reasoning effort, tool inventory, context use, cost, or hook coverage from filenames or marketing documentation; obtain host evidence or record `UNKNOWN`.
- Use evidence labels consistently: **CONFIRMED** (inspected implementation or controlled test), **INFERRED**, **ASSUMED**, **UNVERIFIED**, **CONTRADICTED**. A configured control is not necessarily an executed or effective control.
- Existing controls must be preserved or strengthened. **No silent fallback to a less restrictive path.** A design or test that would weaken the present pipeline requires an explicit tradeoff decision and rollback plan.

## 2. Start by reconstructing the *actual workplace* architecture

Deliver a one-page control-flow diagram and an evidence-linked inventory of:

- Entry point and startup choices (Full/Express, HITL/HOTL if present); how selections are persisted and who can alter them.
- Which program creates run/phase/attempt IDs, chooses the next role, invokes tests, records authorizations, handles failed runs, and creates a PR proposal.
- Actual Copilot coordinator and subagent definitions, how `runSubagent` or equivalent delegation is performed, and whether those agents can use general terminal, filesystem, git, network, MCP, or repository-edit tools.
- Role-by-role accessible paths, credentials, commands, tools, and allowed side effects; whether permission rules are prompts, host configuration, hooks, OS restrictions, or engine-enforced acceptance checks.
- Engine-to-host bridge: CLI, MCP, files, or other verified mechanism; structured request and response contracts; retry/cancellation semantics; in-flight recovery; any host-specific dispatch limitations.
- The complete approval chain: plan, automated tests, code review, PR review, PR creation, merge, deployment. **These are separate authorities.** Identify the true source of a human decision and whether identity/provenance is authenticated or merely text.
- Authoritative state store, immutable or versioned artifacts, read model, live dashboard, end-of-run HTML, external tracing, and post-run evaluation/learning stores. Identify who can write each store.
- Constraints/limitations of the workplace deployment that differ from the public reference and from official VS Code documentation.

**Do not recreate functionality that already exists.** The public reference already includes an engine, a versioned workflow definition, a coordinator adapter, controlled proof/candidate checks, durable journal/read model, a live dashboard, and post-run observability planning. Investigate workplace equivalents and gaps before proposing new components.

### Reference starting points (reference repository only, not proof of workplace behavior)

- [Current reference workflow](../core/policies/workflow.ts), [engine](../core/engine/engine.ts), [coordinator contract](../adapters/copilot-vscode/coordinator.md), and [engine CLI](../scripts/rstack.ts).
- [AI software factory assessment](ai-software-factory-assessment-2026-10-15.md) — broad audit matrix; use rather than duplicating A01/A03/A05/A07/A08.
- [Artifact storage and agent write boundaries](artifact-storage-and-agent-write-boundaries-2026-10-08.md) — protected paths, materializations, detection versus prevention.
- [HITL/HOTL delegated gates](hitl-hotl-oversight-selection-and-delegated-approval-2026-10-15.md) — design **not automatically implemented**.
- [Live dashboard server guidance](live-dashboard/05-dashboard-server-guidance.md) — read-only projection and state authority.
- [Post-run observability and learning bundles](post-run-observability-and-learning-bundles.md) — isolated host evidence and redaction.
- External comparison: [IndyDevDan's Super Simple Software Factory](https://github.com/disler/super-simple-software-factory) uses deterministic Python to launch agents directly. Its principles may be useful; its direct process-launch mechanism is **not assumed usable for Copilot at work**.

## 3. Workstream A — Deterministic execution authority (P0)

**Audit question:** If the coordinator misunderstands instructions, invokes the wrong role, modifies a result, skips a step, loses context, or dies mid-run, which decisions does *executable code* still enforce?

### A1. Trace the control-plane boundary

Document, with exact code references and a real or prior authorized run:

1. Run/attempt identity, workflow version, current state, expected version, immutable input references, and role-specific task envelope.
2. The **only** allowed advance path: `engine.next()`-like authorization → host dispatch → returned role result → `engine.submit()`-like validation → committed transition. Determine whether code, rather than coordinator prose, enforces that order.
3. Distinguish engine *authorization to dispatch* from agent *invocation*. If the host cannot be invoked programmatically, a thin coordinator may do the launch, but its response cannot independently advance engine state.
4. All transition preconditions: role/attempt/run identity, state version, input digest, output contract, file paths, changed-tree identity, artifact freshness, evidence quality, test results, independent review, and allowed human action.
5. Replay/concurrency: locks, append-only journal, duplicate submissions, out-of-order results, interrupted attempts, retry ceilings, stale callbacks, resumed sessions, and cross-run isolation.
6. Independence: planner versus auditor, proof author versus implementer, reviewer versus developer, final PR reviewer versus accepted technical review. A reviewer cannot silently edit what it approves.
7. Mutation/publication boundary: distinguish provisional agent edits, retained candidate, local proposal, remote PR, merge and deploy; find every action possible **outside** the engine's approval path.

### A2. Identify non-engine authority and bypass paths

Build a table of all coordinator, role, script, hook, test-runner, and user entry points that can mutate code, workflow configuration, tests, run records, approvals, git state, or external services. For each, answer:

- Can it execute before receiving an engine authorization? Can it call engine commands directly or fabricate an authorization/`HUMAN_RECORDED` decision?
- Can it edit protected files, engine logic, hook scripts/configuration, test configuration, security policies, approval evidence, or tracing?
- Does denial happen **before the operation**, only **when accepting artifacts**, or not at all?
- Does any controller proceed after an unsuccessful gate, absent telemetry, unknown risk, or ambiguous decision?
- Does the host itself enforce role/tool boundaries, or merely advertise them to the model?
- If the coordinator dispatches incorrectly, what can be damaged **even though** the engine refuses its output?

**Recommended invariant:** The engine alone can produce an accepted state transition. The dispatcher has no unreviewed promotion authority. The execution adapter is a transport, never a second workflow state machine. **This invariant does not by itself provide pre-execution containment.**

### A3. Design candidates to evaluate (do not implement yet)

- **Minimal compatible option (preferred until disproven):** Retain the existing TypeScript engine and Copilot coordinator; use verified CLI or narrow MCP interfaces for `start / status / next / submit / decide / resume / abandon`. The coordinator may dispatch an agent but never decide policy, repair evidence, forge a user decision, or override refusal.
- **Narrow tool adapter:** If the existing CLI interface is error-prone, evaluate exposing a small, separately controlled engine MCP server. It must call the *same* policy/state code; MCP is a transport and not a new authority. Assess caller authentication, access to mutation endpoints, and direct-tool bypass.
- **Host permission and isolation layer:** Where permitted, launch agents with role-specific tools and per-attempt writable directories, isolate authoritative state outside agent write scope, and restrict dangerous shell/git/network actions. If the host cannot enforce this, label residual risks and investigate OS/runner-level alternatives.
- **Bounded deterministic repair:** Tests, lint, type-check and security checks should run through trusted code using configured commands, not be rediscovered or certified by an agent. Evidence of a failed deterministic check may lead to an explicitly budgeted repair attempt; security/policy denies are not automatically repairable by re-prompting.
- **HITL/HOTL compatibility:** Tie Full/Express and HITL/HOTL to a trusted policy decision; avoid creating a second controller, auto-approving human gates, or weakening final PR review. Preserve the owner's higher-risk escalation rules.

### A4. Required safety properties to prove

- **A-P0-01:** No result from a wrong role, wrong run, stale attempt, changed input, or mismatched candidate advances the engine.
- **A-P0-02:** A failed required gate does not become success due to agent wording, timeout, retry, exception, or restart.
- **A-P0-03:** Repeated `next`/`submit`/`resume` and concurrent requests do not create untracked duplicate work or promote stale work.
- **A-P0-04:** Critical approvals are bound to displayed content and real authority; a string such as `HUMAN_RECORDED` is **not** treated as authentication.
- **A-P0-05:** Independent validation runs on exactly the candidate and controls being approved; altered tests and stale results cannot pass.
- **A-P0-06:** The engine does not assume a host will automatically resume/dispatch; an unavailable worker leaves a truthful WAIT/BLOCKED/in-flight status.
- **A-P0-07:** All permitted external actions have a separate authorization boundary, audit record, and safe replay/idempotency behavior.

## 4. Workstream B — Copilot hooks and preventive guardrails (P0)

**Audit question:** Which operations can we genuinely prevent in the *selected Copilot host* before any side effect, and which can we only detect after the fact?

### B1. Discover the actual hook implementation before writing hooks

For **each** workplace session target (e.g., VS Code Local, Copilot CLI, cloud/Agent Host, Claude/Codex through VS Code where applicable), record:

- Host product/version, harness provider, workspace trust, enterprise policy, settings, agent definition location, available hook configuration path, execution scope, and supported lifecycle events.
- Whether a pre-tool event actually fires for the coordinator, named subagents, nested subagents, edits, terminal commands, git commands, MCP tools, external writes, and failed calls.
- Exact event input schema, tool names, outputs (ALLOW/DENY/ASK or equivalent), decision precedence, blocking semantics, error/timeout handling, and what happens if hook scripts are absent, invalid, or disabled.
- How hook scripts/config are trusted, protected from modification, deployed, updated, pinned, and audited. Check whether a worker could alter the very file evaluating its tool calls.
- Whether enterprise policy allows hooks at all; never enable a new hook mechanism or change enterprise settings without authorized review.

**Do not transpose event names, schemas, or guarantees between harnesses.** The official VS Code hooks documentation says the selected harness determines implementation and that VS Code's hooks experience is in Preview. The Local `PreToolUse` and `SubagentStart` events are candidates to test, **not universal guarantees**. The Copilot SDK's separate hook APIs are not evidence of an SDK available to our workplace factory.

Official starting references (recheck against installed versions):
- [VS Code — Configure agent hooks](https://code.visualstudio.com/docs/agent-customization/hooks)
- [VS Code — Local hooks reference](https://code.visualstudio.com/docs/agents/reference/hooks-reference)
- [VS Code — Custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- [GitHub Copilot — About hooks](https://docs.github.com/en/copilot/concepts/agents/hooks)

### B2. Construct a capability and enforcement map

For every privileged action class (write/delete/move, general terminal, git, network, secrets, policy/hook change, reading restricted files, engine mutation commands, approval recording, external publication), identify:

`role → tool name + args → applicable hook → policy decision → host enforcement → actual observed result → post-execution validation`.

Classify each guardrail as:

- **PREVENTIVE / VERIFIED:** specific prohibited action was blocked before its side effect in an approved fixture, including subagent route.
- **DETECTIVE / VERIFIED:** action happened but engine caught it on acceptance; residual damage explicitly assessed.
- **INSTRUCTION-ONLY:** depends on the model following Markdown, prompt, or convention.
- **UNSUPPORTED / UNVERIFIED:** host, environment, schema, or coverage unknown.
- **OUTSIDE BOUNDARY:** tool/environment can bypass hook entirely.

No blanket “hooks make the pipeline safe” claim is acceptable. Shell tools may have indirect filesystem/network effects that argument inspection does not fully predict. A pre-tool hook does not automatically provide complete OS sandboxing or protect other processes.

### B3. Proposed hook ownership and behavior

If host capabilities prove sufficient, design *thin*, deterministic hooks rather than a second autonomous orchestrator:

1. **Pre-tool policy check:** Calls one trusted policy authority for the current authenticated/validated run, role, attempt, tool, and scoped capability. Deny unknown or unauthorized high-impact operations; preserve allowed safe operations. Treat missing run/role identity, unavailable policy service, malformed hook input, and stale authorization conservatively.
2. **Dispatch/phase correlation:** Where the harness exposes reliable subagent-start/stop events, associate the observed host session with the **engine-issued attempt**. Correlation must be verified; a prompt-supplied attempt ID alone is not trustworthy.
3. **Post-tool audit:** Capture minimally necessary tool outcome, policy decision, error classification, and affected path identifiers; never treat a post-hook as prevention or a trace event as permission.
4. **Stop/completion check:** Detect missing deliverables/unfinished attempts and reconcile with the engine; do not fabricate approval or force a hidden autonomous retry.
5. **Isolation fallback:** For actions the host cannot intercept, use trusted filesystem/process/network isolation if feasible, or explicitly state the risk and request a human gate. Restrict environment variables and tool scopes for test execution independently from agent-role instructions.

**Trust rule:** Agents must not be able to edit the engine, hook validator, trusted policy, authorization records, trace collector, or their own permission profile during an active run. If the same local account has unrestricted shell access to those resources, acknowledge that true pre-execution integrity is not proved; investigate external protected controls.

### B4. Required negative and failure-mode tests (execute only after approval)

| ID | Safe fixture scenario | Expected evidence |
| --- | --- | --- |
| B-01 | Builder requests edit outside its allowed attempt scope | Pre-tool DENY if covered; otherwise detected boundary violation, **not** labeled prevention |
| B-02 | Reviewer tries to change accepted candidate or controlled tests | Denied or rejected; no accepted altered candidate |
| B-03 | Agent attempts to alter hook/policy/engine files | Protected before execution, or documented critical enforcement gap |
| B-04 | General terminal command would indirectly modify restricted content | Determine actual hook visibility and OS boundary; never assume command text filtering is enough |
| B-05 | Coordinator invokes a different subagent than engine authorized | Engine never accepts incorrect role; assess unauthorized side effects separately |
| B-06 | Hook fails, times out, returns malformed output, or is disabled | Observed fail behavior; no silent green or unrecorded bypass |
| B-07 | Nested subagent, MCP tool, git operation, or alternate invocation path | Precisely label covered vs uncovered routes |
| B-08 | Agent submits counterfeit human decision or changes approval display | Refused without authenticated authorization and content match |

## 5. Workstream C — End-to-end traceability and improvement (P1/P0 evidence)

**Audit question:** Can an independent reviewer answer **who/what caused each transition, with which permissions and exact inputs**, and identify where time, retries, quality, or cost were wasted—without trusting an agent's narration?

### C1. Separate three evidence zones

1. **Authoritative execution evidence:** Engine-owned journal, state transition, run/attempt identity, versioned contracts, input/output hashes, accepted candidate, deterministic verification, decisions and policy verdicts. This is the source of truth for workflow state.
2. **Host execution diagnostics:** Available host session and subagent IDs, tool-use metadata, hook decisions, errors, status, elapsed time and **observed** model/token/cost information. Collection may be partial, untrusted, or host-limited; it **must not** promote a run or overwrite authority records.
3. **Post-run learning bundle:** Sanitized, versioned, read-only export/reports/evaluations for identifying systematic problems across completed runs. Kept away from active agents to avoid context contamination. Collection failure must not turn a valid engineering outcome into an invalid one, unless a specific mandatory compliance/audit control explicitly requires the record.

Reuse current journal/read-model/dashboard if present. Build one **causal trace**, not a second competing execution database.

### C2. Proposed canonical trace contract (illustrative; finalize after inventory)

Each *available* observation should link through:

- `run_id`; `workflow_version` / policy/profile/config digest; `phase_id` / `stage_id`; `attempt_id`; agent role and *observed* host session ID.
- Unique `event_id`, causal `parent_event_id` or span parent, UTC timestamp, duration/monotonic timing where measurable, source and confidence/evidence class.
- Event type: `run_start`, `authorization_requested`, `authorization_granted/denied`, `agent_invocation`, `tool_request`, `pretool_verdict`, `tool_result`, `artifact_submitted`, `gate_result`, `test_execution`, `retry`, `human_wait`, `human_decision`, `transition`, `blocked`, `run_end`.
- Authoritative state version before/after, input/candidate/proof hashes where applicable, expected/actual attempt identity, policy rule/version, denial reason, validation failure code, outcome, retry budget remaining.
- For tool calls: hashed/redacted argument metadata and affected path class (not raw shell contents or secrets by default), event source/harness, hook coverage status, exit status, duration, and the limitation of any correlation.
- For model usage: provider/model/effort, token categories, total cost **only if the host exposes trustworthy values**; otherwise `NOT_EXPOSED` / `UNKNOWN`. Never estimate these from file size, a guessed model price, or prompt characters and present them as measured data.
- Trace gaps and drop counters: missing events, blocked collector, absent hook, ambiguous mapping, clock skew, crash, or redaction. A complete-looking dashboard must not conceal incomplete telemetry.

### C3. Reconstruction and integrity tests

- Can a reviewer reconstruct the exact stage order, gate decisions, denied operations, retries, human interactions, final candidate identity, and external effects from durable engine evidence?
- Does the dashboard remain **strictly read-only** and faithfully label pending, failed, rejected, and missing-data states? Can a terminal HTML report reproduce the same causal summary offline?
- Can host events be correlated to the right attempt after session compaction, retries, nested subagents, process restart, or concurrent runs? What correlations are *inferred* rather than verified?
- Is the collector append-only/isolated from workers as needed? Are integrity checks sufficient to detect alterations? **Do not claim tamper-proof tracing merely because records are hashed.**
- Can trace collection fail or stall without mutating workflow decisions? If audit events are mandatory for a regulated operation, define a *specific* fail-closed promotion policy independently.
- What raw data is collected, where, by whom, under what permissions, with what retention, access logging, secret/PII redaction, approval for export, and deletion procedure?
- Is there a reproducible replay/test fixture that proves a fabricated tool event or forged success cannot become authoritative evidence?

### C4. Baseline metrics before proposing optimizations

Record for **representative, authorized** fixture runs and available historic workplace runs:

| Measure | Why | Evidence requirement |
| --- | --- | --- |
| End-to-end wall time and per-phase p50/p95 | Identify bottlenecks | Engine timestamps plus observed host timing; state sample size |
| Host dispatch wait, in-flight, and human wait | Separate model delays from approval/transport delays | Correlated attempt/session events |
| Pass/fail/blocked rates and reason codes | Reliability | Engine journal, not chat claims |
| Retries, rework cycles, context loss | Target waste | Attempt/version history and host evidence |
| Plan audit defects found; review escape rate | Quality | Independent adjudicated evaluation |
| Tool calls, rereads, unneeded operations | Harness efficiency | Available redacted host telemetry |
| Token usage and cost per phase/model | Resource optimization | Host-supplied data only, otherwise unknown |
| Hook denials, bypass coverage, false positives | Guardrail effectiveness | Matched pre-tool observations and fixture results |
| Trace completeness and overhead | Operational feasibility | Expected/observed events, disk/time overhead and lost event count |

Evaluate changes against **quality, safety, latency, human effort, and total resource use together**; a shorter prompt or fewer tokens alone is not success. Compare to a pinned baseline with fixed tasks, model/environment, risk profile, and repeated trials where affordable. Record both improvements and regressions.

## 6. Unified audit matrix and required report

For every finding, include: **ID, owner priority (P0/P1/P2), system/host revision, actual code/config location, observed behavior, control owner, preventive/detective/instruction-only/unsupported classification, evidence reference, controlled negative-test result or `NOT_RUN`, confidence label, residual risk, proposed change, compatibility impact, rollout/rollback, and open decision**.

Recommended inventory IDs:

| ID | Topic | Priority |
| --- | --- | --- |
| EX-01 | Single state/transition authority and trusted dispatcher boundary | P0 |
| EX-02 | Role invocation, reentrancy, retries, stale attempt/concurrency | P0 |
| EX-03 | Human approval provenance and external-action authority | P0 |
| EX-04 | Independent validation of candidate/tests/reviewer decisions | P0 |
| HK-01 | Actual host/harness hook capabilities and enterprise policy | P0 |
| HK-02 | Protected control-plane files, shell/FS/git/network coverage | P0 |
| HK-03 | Hook fail-closed behavior, tamper resistance, bypass routes | P0 |
| HK-04 | Hook/engine policy coherence and role-specific scopes | P0 |
| TR-01 | Engine journal-to-host session causal correlation | P1 |
| TR-02 | Trace integrity, sensitive data, isolation, retention | P0 for compliance; otherwise P1 |
| TR-03 | Coverage gaps, dashboard/report honesty, replay | P1 |
| TR-04 | Benchmark baseline, measurements, evaluation feedback | P1 |

### Deliverables (in approved workplace storage)

1. **Current-state evidence report:** exact tested revisions and host versions, real workflow/control-flow diagrams, role/tool/permission matrix, source references, known versus unknown capabilities, and divergences from public RSTACK guidance. No assertion of a missing feature without searching for its implementation.
2. **Three workstream gap tables:** EX, HK, TR rows with classification and severity. Distinguish a **verified exploit path** from a hypothesis; do not overclaim.
3. **Host-hook feasibility report:** per-harness event/tool matrix, sample **redacted** payload schema from authorized observations if allowed, observed ALLOW/DENY/ASK behavior, enterprise restrictions, default/error behavior, and proof of subagent coverage or explicitly `UNVERIFIED`.
4. **Causal trace proposal:** event schema, source-of-truth ownership, sinks and isolation, retention/redaction design, mapping to existing journal/dashboard/report, completeness rules, example **synthetic** timeline, and measurable overhead.
5. **Prioritized implementation plan (no implementation):** for each small batch include objective, exact existing extension point, affected interfaces/files in the *workplace* codebase, dependencies, threat addressed, migration/compatibility strategy, acceptance/negative tests, observable success measure, rollback and stop condition.
6. **Decision log for the human owner:** unresolved limitations and recommended choices; preserve disagreement and make access restrictions explicit.
7. **Sanitized executive summary** suitable for sharing to the public repository *only after* company review; no sensitive underlying artifacts.

## 7. Proposed implementation sequence — for review, not automatic execution

**Gate 0 — Owner accepts the audit.** No code change or active testing before this gate.

- **Batch 1 (P0): Execution authority inventory and contract hardening.** Confirm one controller and authenticated decisions. Tighten existing engine CLI/MCP permissions, state freshness, dispatch identities, approval provenance and invalid-transition behavior where gaps are proven. Keep existing agent transport compatible.
- **Batch 2 (P0): Verified hooks in shadow/observe-only mode.** Test installed harness event coverage and redaction on an isolated fixture. Establish event schemas and rule mapping. **Do not** deploy enforcement before false-positive and bypass analysis.
- **Batch 3 (P0): Selective preventive enforcement.** Enable least-privilege hook decisions only for proven-covered operations; protect control-plane files and credentials with host/OS controls as needed. Fail safely under errors; include explicit operator escape/recovery procedures requiring authorization, never a silent unrestricted bypass.
- **Batch 4 (P1): Trustworthy correlation and telemetry.** Reuse engine journal and dashboard; add only verified host/agent/tool/hook spans; record missing telemetry as missing; separate active-run authority from post-run learning.
- **Batch 5 (P1): Controlled evaluations and rollout.** Run the negative test matrix, paired baseline experiments, concurrency/crash recovery, rollback drills and overhead measurements. Promote in stages only after independent human review.

For **each batch**, require a design review and approval, a small PR, an evidence-backed before/after comparison, and rollback instructions. Existing Full/Express and HITL/HOTL behavior must not regress. The final human PR decision must remain an explicit independent authority.

## 8. Minimum acceptance and stop criteria

The proposal may be recommended for implementation only if:

- A real workplace run path and selected Copilot harness have been identified; unknown capabilities are not invented.
- The audit names the exact code-owned acceptance boundary and the host-owned dispatch boundary, with a documented plan for both **safety** and **liveness**.
- At least one controlled negative scenario is specified for wrong role, forbidden edit, hook failure/bypass, stale result, forged approval, and missing trace; execution is deferred until authorized.
- Preventive controls are distinguished from detective controls, and all bypassable host paths have explicit residual risk and compensating measures.
- The trace design can attribute decisions to concrete versions, attempts and evidence without disclosing secrets or turning host logs into workflow authority.
- No proposed change depends on a nonexistent Copilot invocation API or on Claude Code behavior standing in for Copilot validation.
- The plan preserves operational safety, confidentiality, existing engine invariants and mandatory human authority.

**STOP / escalate to owner immediately** if the audit finds a live bypass capable of changing protected engine/policy files, publishing/merging/deploying without approval, falsifying human authority, leaking company data, or defeating the accepted-candidate boundary. Preserve evidence according to company procedure; do not attempt to exploit, publicize or hotfix it without authorization.

## 9. Starter assignment for the workplace agent

> Investigate our **currently installed workplace RSTACK-SDLC pipeline**, not just the public GitHub reference. Read this guide and the existing related design/audit documents; inspect the actual executable engine, Copilot coordinator, agents, permissions, approval paths, hooks, journal and dashboard. Start in **read-only audit mode**. Determine what is really enforced in code or the host versus what exists only in Markdown. We cannot assume a usable SDK to launch agents: retain Copilot-supported invocation and make engine state/policy authoritative. For the three priorities—deterministic execution control, hooks/guardrails, traceability—produce an evidence matrix, host compatibility assessment, negative-test plan, and independently reviewable implementation batches. Mark unsupported and unverified functionality honestly. Keep all workplace-sensitive findings in approved internal storage. **Do not implement, enable hooks, run intrusive tests, change permissions, commit, create PRs, or deploy. Stop and ask for human approval after the audit and plan.**

---

**Relationship to existing guidance:** This document is the **focused workplace audit execution brief** for the three owner priorities. It complements rather than supersedes the October 15 general factory assessment, the October 15 HITL/HOTL design, the October 8 artifact/write-boundary analysis, the dashboard guidance and the post-run observability proposal. If they conflict with the actual workplace implementation, report the conflict for a human architecture decision instead of silently editing the earlier documents.
