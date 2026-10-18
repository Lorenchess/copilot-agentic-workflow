# RSTACK-SDLC — Hook-Free Policy Enforcement When Enterprise Copilot Hooks Are Disabled

**Date:** 2026-10-17
**Status:** Architecture proposal and workplace audit/implementation brief — **not implemented; no workplace changes authorized by this document**
**Audience:** RSTACK-SDLC owners, engineering agents, reviewers, security/enterprise administrators
**Applies to:** VS Code GitHub Copilot environments where native agent lifecycle hooks are disabled or restricted by organizational policy
**Reference implementation:** `rstack-sdlc/` in this public repository; **do not infer that the separate workplace implementation has identical behavior**

> **Decision:** Do not bypass or re-create forbidden Copilot hooks inside the Copilot process. Instead, make a trusted, executable RSTACK **policy enforcement layer** authoritative for dispatch eligibility, output acceptance, phase transitions, PR readiness and evidence, and pair it with **approved isolation/least-privilege controls** and **independent CI branch protections**. Treat tools, prompts, local Git hooks and agent self-reports as weaker controls. A post-execution gate protects acceptance, **not arbitrary actions already executed by the agent**.

## 0. Relationship to prior work and immediate objective

This is the **hook-disabled decision branch** of [Workplace audit: deterministic control, hooks and traceability](workplace-execution-control-hooks-traceability-audit-2026-10-17.md). Read it with [artifact storage/write boundaries](artifact-storage-and-agent-write-boundaries-2026-10-08.md), [HITL/HOTL oversight selection](hitl-hotl-oversight-selection-and-delegated-approval-2026-10-15.md) and [post-run observability](post-run-observability-and-learning-bundles.md). **Do not duplicate or replace existing controls.**

The owner reports that the workplace organization blocks hooks in Copilot. Treat this as an operating constraint, not a setting to work around. First verify *which* selected harness, versions, tools, enterprise settings and approved telemetry/sandbox facilities actually apply. If hooks are unavailable, **the recommended solution works without them**; do not spend the implementation attempting to enable an administratively disabled mechanism.

This document requests a **read-only current-state audit and a phased implementation plan first**. Implement only after the owner approves a scoped batch. Do not edit enterprise policy, hooks, credentials, CI protections or the workplace pipeline just to investigate.

**Confidentiality:** This repository is public. Never upload employer code, repository identifiers, internal logs, prompts, traces, diagrams, secrets, approvals, systems or proprietary policy. Sensitive findings remain in company-approved storage. Publish only sanitized summaries approved for disclosure.

## 1. Exactly what can and cannot be enforced without native hooks

There are three different control surfaces. They are not interchangeable:

1. **Pre-action prevention:** Stop a specific tool or process operation *before it happens*. Requires a host-enforced permission/tool boundary, OS/container/workspace isolation, or trusted mediation of that specific operation. A generic external engine cannot magically intercept all Copilot-internal tool calls.
2. **Post-execution acceptance:** Deterministically reject an attempted result, modified tree, artifact or transition after the agent returns. The engine can do this **if it alone owns the transition and its evidence is trustworthy**, regardless of whether hooks exist.
3. **Repository promotion:** Enforce required review, tests and policy status on an exact commit using an independently protected branch/CI system. Does not undo harmful actions already performed in an overly privileged local process.

| Requested property | Proposed boundary | Claim we may make only after evidence |
| --- | --- | --- |
| No skipped plan/test/review phases | Engine state machine + versioned gate checks | Prevents *accepted* phase skips |
| No unauthorized file changes accepted | Independent base-to-candidate diff/tree validator | Detects and rejects changed scope at a checkpoint |
| No unreviewed merge | Required CI checks + protected branch/ruleset and bypass governance | Blocks merge through that protected route |
| No prohibited command executed by Copilot | Approved host permissions or OS-level process containment | **Not guaranteed** by engine post-gates alone |
| No data exfiltration via arbitrary terminal/network | Approved network/credential isolation | **Not guaranteed** by agent instructions or tool labels |
| Every internal Copilot action is visible | Explicitly approved, tested host telemetry | May be partial; unknown gaps stay `UNKNOWN` |
| Journal is trustworthy against hostile local user | External access control, append-only/remote attestation or equivalent | Hash-chaining/checksums alone are **not** tamper resistance |

**Safety vs liveness:** An engine can refuse bad submissions even without an agent-invocation SDK. It cannot guarantee the host will launch the next Copilot agent or that a human will respond. The coordinator/adapter may dispatch an approved step, but it must **never self-authorize advancing the workflow**.

## 2. Audit the actual implementation before designing a second engine

### Reference capabilities already present in the public project (inspect again at workplace HEAD)

- [`core/policies/workflow.ts`](../core/policies/workflow.ts) defines the versioned `WORKFLOW` (reference workflow version 6 when this brief was drafted), role/human/deterministic steps, result contracts and the ordered route.
- [`core/engine/engine.ts`](../core/engine/engine.ts), [`state.ts`](../core/engine/state.ts), [`drive.ts`](../core/engine/drive.ts) and [`journal.ts`](../core/engine/journal.ts) supply executable run transitions, pending attempts, state replay and checked journal framing.
- [`containment.ts`](../core/engine/containment.ts) validates paths of submitted role files. **This is input-path containment, not an OS sandbox around the running agent.**
- [`adapters/copilot-vscode/coordinator.md`](../adapters/copilot-vscode/coordinator.md) describes `next` / dispatch / `submit` and human decisions. The prose is a behavioral instruction; prove the engine independently refuses forbidden transitions.
- [`scripts/rstack.ts`](../scripts/rstack.ts), [`dashboard/`](../dashboard/) and [`tests/`](../tests/) provide a local CLI, run/read-model reporting and existing tests. Reuse them; do not add a parallel dashboard, duplicate state machine or competing event store.
- [HITL/HOTL proposal](hitl-hotl-oversight-selection-and-delegated-approval-2026-10-15.md) describes independent Full/Express and HITL/HOTL selection; **a proposal is not proof of implementation**.

**Current-state questions for the workplace agent:**

1. What command starts a run? Which executable alone grants dispatch, accepts results, advances phases, records decisions and seals the candidate?
2. What are the actual available Copilot tools, custom-agent role restrictions, launch/dispatch controls and permissions? Can a user/agent switch into an unrestricted session?
3. Which storage locations and engine policy files can Copilot, subagents, scripts, test code and developers write? Can they mutate the journal, acceptance logic or its evidence?
4. What runs outside the engine (arbitrary commands, Git operations, shell scripts, network requests, PR publication)? What is **prevented**, merely **detected**, or **not observed**?
5. Which mandatory checks exist as **TypeScript/test code** versus Markdown instructions? Are negative outcomes actually fail-closed?
6. Does the workplace pipeline already offer approved isolation, protected CI, OpenTelemetry or a privileged mediation service? Record configuration **and a safe behavioral test** before claiming enforcement.
7. Does changing oversight mode (HITL/HOTL) or pipeline depth (Full/Express) accidentally weaken mandatory security gates?
8. Where are engine-run correlation, approval provenance, run recovery and exact-candidate identity recorded?

Use evidence labels `CONFIRMED`, `INFERRED`, `ASSUMED`, `UNVERIFIED`, `CONTRADICTED`; link findings to internal locations in **approved internal reporting**, not this public repository.

## 3. Proposed hook-free control plane

```text
     Authorized request + versioned workflow/policy + approved profile
                              |
                    Trusted RSTACK engine
                 (state/version/attempt authority)
                              |
             PRE-DISPATCH GATE [fail closed]
       scope | role | prerequisites | delegation | isolation
                              |
                Copilot adapter/coordinator
              (dispatches only granted attempt)
                              |
                VS Code Copilot agent(s)
       (approved tool restrictions where available)
       (approved sandbox / least privilege as needed)
                              |
                untrusted agent deliverables
                              |
                POST-RESULT GATE [fail closed]
      schema | attempt | exact tree | changed scope | tests
      provenance | review independence | evidence freshness
                              |
                  engine records outcome
                    /              \
                ACCEPT            REFUSE
               next gate      block / bounded retry
                    |
                 PR-readiness gate
                    |
        protected CI + branch/ruleset + human PR review
                    |
      local PR proposal / authorized publication (distinct)
                    |
          journal/read model + approved trace correlation
```

**Engine ownership invariants:**

- Only a trusted engine command can create an accepted transition. The coordinator is transport, not policy authority.
- Every dispatch is bound to `run_id`, `attempt_id`, `state_version`, `workflow_ref`, effective `policy_ref`, expected role, source/input references and allowed workspace.
- A result for an expired, wrong or duplicate attempt cannot create a second side effect or silently replace a newer result.
- Checks run on the **actual on-disk evidence and candidate** from an independently determined baseline, not a model's assertion that tests passed.
- Missing, stale, unreadable, unverifiable or mismatched mandatory evidence **blocks**, rather than being interpreted as success.
- Policy authority, trusted baseline and authoritative evidence must be inaccessible to the role whose work they validate, or the reduced trust must be explicitly disclosed.
- Distinguish `AGENT_COMPLETED`, `RESULT_ACCEPTED`, `CANDIDATE_VERIFIED`, `PR_READY` and `MERGED`; they are not synonyms.

## 4. Design: policy gates as executable, reusable functions

Do not add a new orchestrator if `engine.next()`/`engine.submit()` and the workflow already cover these responsibilities. Extend the existing trusted path with small, pure checks that yield a structured decision and evidence references.

| Gate | Trigger | Deterministic decisions | Outcome on failure |
| --- | --- | --- | --- |
| G0 — run admission | `start` | Authorized profile, policy digest, baseline/workspace, supported mode | Refuse start |
| G1 — before dispatch | `next` | Stage, role, state version, scope, prerequisites, risk, capability availability, human/delegated authorization | Do not grant attempt |
| G2 — result intake | `submit` | Schema, actor/attempt identity, required outputs, path containment, provenance, freshness, replay | Refuse submission |
| G3 — candidate verification | after developer/tester | Independently inspect base/tree/diff, protected paths, controlled tests, test execution/exit, reviewer separation | Block/quarantine candidate |
| G4 — approval and PR readiness | before proposal/publish | Exact candidate hash, evidence, approvals, security checks, delegated limits, publication permissions | Hold or escalate |
| G5 — merge boundary | protected repository CI/rulesets | Required checks, trusted status issuer, reviewers, branch state, commit SHA | Reject merge |

A conceptual pure policy result (**design sketch, not a request to replace existing TypeScript contracts**):

```ts
type GateResult = {
  gate_id: string;             // stable identity, e.g. G3
  policy_ref: string;          // immutable policy content identity
  run_id: string;
  attempt_id?: string;
  state_version: number;       // expected engine version
  subject_ref: string;         // exact tree/evidence under evaluation
  verdict: 'ALLOW' | 'DENY' | 'ESCALATE';
  reason_codes: string[];      // machine-readable, never model-provided authority
  evidence_refs: string[];     // independently produced where required
};
```

**Enforcement placement matters:** A helper the agent is merely *asked* to invoke is optional. Gates must be executed by engine-owned paths before dispatch/transition and by protected CI before merging. For high-risk work, take policy and gate implementations from a trusted checkout/process, not the very candidate being inspected.

**Data binding:** Pin source commit, planned scope, exact candidate tree, controlled-test baseline, verifier version, policy identity and approval subjects. Reverify if any relevant input changes. In the workplace implementation, prefer existing content-addressed subject identities and journal structures; evaluate whether new fields are needed before changing schemas.

**Oversight:** Both HITL and HOTL run mandatory gates. HOTL may replace only *explicitly delegated, eligible human decisions* with typed policy authorizations; it may not invent `HUMAN_RECORDED` provenance or waive security. Express may omit optional workflow detail only when validated; it may not skip minimum safety evidence.

## 5. Host-facing prevention: layered, policy-compliant controls

Use defense in depth in this priority order, **subject to enterprise approval**:

1. **Role-specific tool surface:** Configure supported Copilot custom-agent tool allowlists, reduced delegation, read-only reviewer/auditor roles and human approval for privileged actions. Verify against the exact selected harness: role files and prompts are *not universal enforcement*. A user switching to another broader agent/session may bypass the role boundary.
2. **Separate execution context:** Put agent writable files in a disposable workspace/worktree with no write permission to engine policy, authoritative journal, trusted verifier or secrets. A Git worktree by itself only separates working copies, **not privileges**. Use OS user/account permissions, container/VM policy or enterprise-managed sandboxing when actual prevention is required. Windows and Unix need separate behavioral verification.
3. **Tool/process mediation if supported and approved:** Expose only narrow, validated commands from a trusted service/CLI with least-privilege credentials. This controls mediated operations; an unrestricted shell or alternate path remains a bypass, so disable it at the proper host/OS boundary when necessary.
4. **Credentials and egress:** No production credentials in agent/test environments; restrict network destinations and secrets through approved platform controls. Never rely on redacting output to prevent the original exfiltration.
5. **Protected promotion:** Dedicated CI in a trusted environment re-evaluates changed scope, policy, tests, approval evidence and exact SHA; require these checks and human review with branch/ruleset protection. Limit bypass actors and choose an expected status-check source when available.
6. **Git client hooks:** Optional developer convenience only (pre-commit/pre-push). They are commonly skippable and are **not** enterprise-equivalent to native pre-tool hooks or protected CI.

**If a preventive boundary is unavailable:** Record `PREVENTION_UNAVAILABLE`, limit high-risk tasks to read-only/manual approval paths, or refuse the task. Do not silently advertise detection as prevention.

### Distinguish common attacks and control limits

| Threat | Required control / honest residual risk |
| --- | --- |
| Agent edits engine policy or journal | Trusted separate permissions and protected code owners/CI; checksums alone detect accidental corruption, not privileged tampering |
| Agent uses direct shell/file write outside a proposed wrapper | OS/host tool restriction; external engine checks cannot stop the action in real time |
| Agent reports passing tests that never ran | Engine/CI invokes trusted verifier and records actual exit/results against pinned candidate |
| Agent changes files after verification | Verify exact SHA at proposal/merge; invalidate prior evidence if tree changes |
| Agent forges human/delegated approval | Trusted decision origin and typed provenance; prose or writable JSON is insufficient |
| Agent submits symlink/junction/path traversal | Reuse input containment plus independently secured worktree/mount boundaries |
| Stale/duplicate attempt completes after retry | Lock/version/attempt fencing and deterministic refusal; earlier external effects might persist |
| Malicious tests/build scripts execute | Isolate execution and limit credentials/network; deterministic assertions alone cannot protect host |
| CI status forged/bypassed | Protected branch and authorized check source, trusted CI config and restricted bypass rights |
| Telemetry captures secrets or loses events | Approved collector, content capture off by default, redaction, access controls and explicit gaps |

## 6. Traceability without hooks

Prefer the **existing authoritative journal and read model** for machine decisions. Correlate *optional* approved host telemetry without letting it alter engine transitions.

Minimal event model (reuse existing contracts if possible):

- `run_id`, `attempt_id`, `step_id`, `event_id`, `state_version`, `policy_ref`, `workflow_ref`, `subject_ref`
- `event_type`: admission/dispatch, agent start/end if observable, gate evaluated, result refused/accepted, human/delegated decision, escalation, candidate verified, PR-readiness, stop/recovery
- `gate_id`, `verdict`, machine-readable `reason_codes`, `evidence_refs`, source `ENGINE` / `HOST_DIAGNOSTIC` / `CI`, correlation/trace ID
- Timestamp and duration when reliably measured; explicit `NOT_OBSERVED`/`UNKNOWN` on missing host spans/token/cost fields
- Causal parent IDs to reconstruct dispatch → attempt → evidence → gate → transition; independent integrity and retention

**Authority rule:** Engine journal and trusted verifier/CI outputs determine pass/fail. Copilot traces are diagnostic observations, potentially incomplete and subject to enterprise policy; never use presence/absence of a telemetry span as proof that a tool was prevented.

VS Code documents optional Copilot OpenTelemetry signal export (model, tool, duration, tokens, nested agent context) with settings such as `github.copilot.chat.otel.enabled`; availability depends on actual extension/harness and organizational policy. **Do not enable collection or send trace content externally without approval.** Keep prompt/tool-argument/content and identity capture disabled unless specifically authorized. Handle dropped spans, unsupported sessions, mismatched IDs, clock skew and collector failure explicitly. Integrate correlation in the existing live dashboard and post-run HTML only after data classification and retention review.

## 7. Candidate rollout — audit first, then small reviewable batches

**Phase A — Read-only workplace evidence (mandatory).** Inspect installed Copilot harness and policy, executable engine, coordinator, workflow modes, tests, protected paths, CI and available telemetry. Deliver a control matrix showing *enforced / detect-only / prompt-only / absent / unknown*, file/line evidence, bypass risk and change cost. Run no security experiments without authorized disposable fixtures.

**Phase B — Pure policy checks in shadow mode.** Extract/reuse deterministic validators without altering accepted behavior. Produce dry-run gate decisions and compare them with current transitions on sanitized fixture replays. Pin policy inputs and record disagreements. No new duplicate engine state store.

**Phase C — Fail-closed engine gates.** After owner review, wire approved gates into `next`, `submit`, deterministic verification and PR readiness, preserving existing contracts, replay and bounded recovery. Negative result halts or uses explicitly bounded remediation, never retries endlessly or silently widens scope.

**Phase D — Trusted execution boundary.** Where security review allows, move sensitive checks/policy outside agent writable space, introduce role-specific tools and isolate untrusted test/agent processes. Test Windows and actual workplace host independently. Document controls unavailable under corporate policies.

**Phase E — Protected CI/promotion and approval mapping.** Implement independent commit-SHA checks and required statuses where the actual repository platform and admins support them (GitHub/Bitbucket capabilities differ; investigate workplace provider separately). Keep final PR review human-owned unless a separately authorized policy says otherwise.

**Phase F — Observability integration.** Correlate approved host events and CI evidence with authoritative journal using stable IDs. Surface event gaps, refused transitions, retries, policy decisions and failure reasons on current dashboard/report. Baseline false positives, runtime and effort before considering optimization.

**Phase G — Controlled rollout and rollback.** Use synthetic/adversarial fixtures, a shadow period, owner sign-off, progressive activation by profile and documented disable/rollback procedure. Never bypass existing stronger checks to achieve compatibility.

## 8. Mandatory negative tests and acceptance criteria

All tests must use disposable non-sensitive fixtures and authorized environments; no destructive testing against real employer systems.

| Test | Expected behavior |
| --- | --- |
| Dispatch a wrong role or skip plan approval | Engine refuses; no transition granted |
| Submit stale/mismatched attempt/version or replay result | Refused with stable reason, no duplicate accepted side effects |
| Submit malformed or self-asserted validation without evidence | Refused; verifier must independently assess evidence |
| Change protected policy/test path or unexpected application path | Exact-tree/scope gate rejects candidate |
| Change candidate after successful verification | Old verification invalidated; re-evaluate |
| Run with missing/unreadable policy, verifier or journal | Fail closed and preserve diagnostic evidence |
| Agent forges a human decision or HOTL delegated decision | Provenance/authorization validation rejects it |
| Reviewer's own changes or circular self-approval | Separation rules reject |
| Agent takes side-effectful path outside engine | Residual risk disclosed; host/OS prevention must be separately proven, never falsely attributed to gate |
| Long-running worker completes after abandonment | Stale submission refused; possible earlier external effects clearly reported |
| Telemetry disabled/collector offline | Engine decisions remain correct; dashboard flags incomplete diagnostics |
| CI protection absent/bypassed | Do not claim merge-level enforcement; escalate for repository owner approval |
| Full/Express × HITL/HOTL variants | Mandatory gates retained, with distinct correctly sourced authorizations |

**Exit criteria:** demonstrate engine-only accepted transitions; testable policy versioning, fail-closed denial and recovery; exact-candidate validation; protections for sensitive policy/evidence; no unauthorized merge through protected path; independent evidence of prevention where claimed; truthful telemetry coverage; meaningful regression suite; no leaks into public repository. Quantify any remaining bypass route.

## 9. Deliverables requested from the implementing agent

Prepare, **in company-approved internal storage**, without leaking workplace specifics to this public repo:

1. **Current-state architecture and controls matrix:** exact file/line/host-setting evidence, effective permissions, trust boundaries, current gaps, and verification statuses.
2. **Hook-free target design:** reused engine modules, gate interface/owners, trusted deployment boundary, policy digests, events and interaction with HITL/HOTL + Express/Full.
3. **Prioritized small-batch plan:** exact files likely to change, dependencies, rollback and security approvals, fixture tests, CI changes, and measurable acceptance criteria.
4. **Tradeoff decision:** what can be *prevented*, merely *rejected after the fact*, or *observed only* in the enterprise Copilot environment, with explicit residual risks.
5. **Human review checkpoint:** stop after the audit and recommended plan. Do not assume this document authorizes an implementation.

### Ready-to-use assignment to the workplace agent

> Our organization disables native Copilot hooks. Using this document, audit the **actual workplace RSTACK-SDLC implementation** and design a hook-free, executable policy-gate approach with trusted isolation and independent promotion checks. Reuse existing engine state, journal, workflow, candidate verifier, test runner, dashboard and HITL/HOTL decisions. Separate pre-action prevention, post-result acceptance and repository promotion. Verify the precise Copilot harness, corporate restrictions and potential approved OTel capabilities; never bypass administrative policy or invent an invocation SDK. First produce an evidence-based current-state report, prioritized implementation plan, test matrix and residual-risk register. Do not modify production code or enterprise configuration until a human approves a specific batch. Keep proprietary findings inside approved internal storage.

## 10. Official documentation to verify against actual workplace versions

- [VS Code — Agent hooks (Preview), selected harness and enterprise restrictions](https://code.visualstudio.com/docs/agent-customization/hooks)
- [VS Code — Custom agents, tools and security considerations](https://code.visualstudio.com/docs/agent-customization/custom-agents)
- [VS Code — Use tools with agents; availability vs approval](https://code.visualstudio.com/docs/agents/run/tools)
- [VS Code — Monitor agent usage with OpenTelemetry](https://code.visualstudio.com/docs/agents/guides/monitoring-agents)
- [GitHub — Available rules for repository rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub — Protected branches and required status checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing/protected-branches/about-protected-branches)

**Bottom line:** RSTACK can be a deterministic **workflow and acceptance** engine without Copilot hooks. To claim deterministic **tool-action prevention**, it additionally needs an approved host/OS mediation boundary. To claim merge protection, it needs separately administered, mandatory repository checks. **Do not conflate the three.**
