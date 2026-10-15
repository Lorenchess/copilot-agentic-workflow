# RSTACK SDLC — HITL / HOTL Oversight Modes Alongside Full / Express Pipelines

**Date:** 2026-10-15  
**Type:** Owner-requested product decision, architectural design and implementation-agent handoff  
**Scope:** RSTACK workflow selection, authorization routing, evidence, user prompts, and integration tests  
**Repository:** [Lorenchess/copilot-agentic-workflow](https://github.com/Lorenchess/copilot-agentic-workflow)  
**Reference examined:** `rstack-sdlc/` on public `main` at `417bce0f4cb859f5c0fe43f09b414ad123272c51` (selected source and documents, not a complete runtime/host audit).  
**Status:** APPROVED PRODUCT DIRECTION / IMPLEMENTATION DESIGN TO VALIDATE AGAINST CURRENT CODE — **NOT** a claim that HOTL or the combined chooser exists in the running engine.

> **Owner's request:** At the existing initial developer/operator question that offers **Express** or **Full** pipeline, also ask whether to use **HITL (Human in the Loop)** or **HOTL (Human on the Loop)**. Preserve the present human-reviewed path and add a second, risk-controlled autonomous oversight path. In HOTL, eligible intermediate plan and technical-review checkpoints progress under independent agent assessment and *trusted engine policy*, with the **final human PR review/approval remaining mandatory**. High-risk work and unresolved decisions must escalate to the human earlier.
>
> **Do not make one mode replace the other.** These are two independent, explicitly recorded selections: execution strategy and oversight strategy.

## 0. Important baseline distinctions

**CONFIRMED IN THE PUBLIC REFERENCE:** [`core/policies/workflow.ts`](../core/policies/workflow.ts) contains `local-request-to-proposal` workflow version 6, with ```text
intent → spec → plan → plan-audit → brief → plan-decision (human)
→ proof → implement → verify → review (agent)
→ pr-review-packet → pr-review (agent) → proposal (local)
```
The reference requires human planning decisions after an audit even when the auditor agrees. It has independent technical and PR-review *agent* roles, followed by a **local PR proposal**; it does not thereby implement an authenticated human PR approval or a remote PR/merge action. Do not falsely mark such capabilities as present.

**CONFIRMED AS DOCUMENTATION, NOT VERIFIED LIVE:** [Express architecture packet](express-pipeline/README.md), [Express policy](express-pipeline/01-policy-and-routing.md), [engine integration map](express-pipeline/03-engine-integration-map.md) and [implementation plan](express-pipeline/04-implementation-plan-and-agent-handoff.md) define a proposed `standard` (Full) / `express` selection and phased rollout; they state Express is not yet authorized as a live bypass of human checkpoints. This document extends the proposed routing policy rather than replacing or silently overriding the Express design.

**UNVERIFIED:** The newer workplace pipeline reportedly has an existing Express/Full question and a manual code-review checkpoint. These are owner-supplied observations; determine exact question implementation, effective permissions, versions and differences **in the authorized workplace environment**. Do not equate the public reference with workplace deployment.

**SAFETY / CONFIDENTIALITY:** This GitHub repository is public. Do not commit employer source, Jira issues, internal systems or URLs, proprietary traces, credentials, or internal decision records. Keep workplace implementation and evidence in approved internal locations. This design does not authorize connecting Jira/Bitbucket, bypassing corporate controls, pushing work application code, merging or deploying.

## 1. Product decision: a two-dimensional selection

### User-facing start interaction

At the existing run-setup checkpoint, **extend that question rather than introducing a second unrelated wizard or repeated prompts**. Ask the initiating developer/operator:

**Question 1 — Execution pipeline**
- **Full (Standard)** — existing complete execution/verification workflow; safest compatibility baseline.
- **Express** — existing or proposed optimized route; available only if the separately versioned Express eligibility policy permits it.

**Question 2 — Oversight / approval approach**
- **HITL — Human in the Loop (default)** — preserve the existing human plan review, applicable manual code-review checkpoint(s), and final human PR approval as implemented in the actual target pipeline.
- **HOTL — Human on the Loop** — for an eligible, low-risk request, independent agents assess the plan and code and the engine automatically authorizes intermediate transitions; human reviews/approves the final PR packet. Escalate earlier for high risk, missing requirements, uncertain scope, audit disagreement, failed safety evidence or other policy exceptions.

Show an explicit summary before start, e.g.:

~~~text
Pipeline:        Full
Oversight:       HOTL
Plan review:     Agent-audited; automatic ONLY if risk/evidence gates pass
Code review:     Independent agent + deterministic verification
Human review:    Required at final PR; earlier if escalation is triggered
External action: Subject to separate authorization; no implied push/merge/deploy

[Start with these settings]  [Change selections]  [Cancel]
~~~

**Interaction semantics:**
1. Display both choices together if the target host supports a two-field question; otherwise use two consecutive fields within the same existing run-initiation interaction, not a new mandatory midrun interruption.
2. **HITL is preselected.** In interactive setup, ask rather than silently choose HOTL. A cancelled, unanswered or malformed question **does not start a run**. For existing noninteractive/legacy starts with no new options, preserve current **Full + HITL** behavior exactly.
3. Selecting HOTL must be a positive, explicit operator choice **and** an allowed, versioned organizational policy. UI selection does not create deployment rights or override safety requirements. If HOTL isn't enabled in the installed host, show “HOTL not enabled/validated” and stay in HITL or stop according to explicit caller action—never claim an autonomous run was selected.
4. The explanation must distinguish *request to use HOTL* from *eligibility for automatic transition*. Do not promise zero human interruptions.
5. Detect “Full” versus “Standard” as UI terminology only; map to the existing canonical executable profile after inspecting the actual implementation. Do not create an alias that conflicts with another mode.
6. Do not repeat the start question on resume. Show the pinned choice and allow a separate, deliberate escalation/change flow as authorized by policy.
7. Present the effective mode, not only the requested mode, in dashboard, CLI status, and final report.

### Combination matrix — both dimensions independent

| Execution | Oversight | Meaning | Routine human gates |
|---|---|---|---|
| **Full + HITL** | Existing default | Preserve baseline stages, manual approvals and evidence requirements. | Existing plan/manual code review/final PR as actually implemented. |
| **Full + HOTL** | New | Full Planner → Auditor → Tester → Developer → independent Reviewer → PR Reviewer; routine intermediate authorization conditional on policy. | Final human PR; earlier for risk/exception. |
| **Express + HITL** | Existing Express design plus old oversight | Express reduces validated work/context for eligible tasks; **human checkpoints remain**. | Existing plan/manual code review/final PR as actually implemented. |
| **Express + HOTL** | New combined profile | Express optimization **and separately validated** HOTL delegation; neither grants the other permission. | Final human PR; earlier for risk/exception. |

**Do not bundle changes:** introduce HOTL first against **Full** with the existing complete technical pipeline intact, while preserving Full+HITL. Combine Express+HOTL only after Express and HOTL pass their **independent** suites and a new interaction suite. If Express is not implemented, show it only according to existing product behavior; do not create a fake Express execution path.

## 2. Terminology and separation of duties

- **HITL:** human-owned decisions at the currently mandated intermediate checkpoints.
- **HOTL:** human supervises a bounded automated process and makes the final PR decision; human remains available for product/risk/exception decisions.
- **Agent assessment:** reasoning-based independent evaluation of plan and code. **It is not an authenticated human signature**, a security boundary, or an authoritative state transition.
- **Engine policy decision:** trusted deterministic controller applies allow/deny/escalate rules to an identity-bound assessment and frozen scope/policy. The engine owns progression.
- **Final PR gate:** a **genuine human approval of an exact immutable proposal/candidate packet** via a host mechanism with demonstrable operator identity or explicitly recorded limitations. The existing agent `pr-review` is **preliminary**, not a substitute for this human action.
- **Remote action gate:** branch publication, PR opening, merge and deployment are separate permissions. An approved plan or a human PR review does not silently authorize those actions.

**Never name an agent `human-approver` or write `HUMAN_APPROVED` after an LLM response.** Use explicit `AUTO_AUTHORIZED_BY_POLICY` and `HUMAN_APPROVED` origins with distinct schemas and trust rules.

## 3. Risk-adaptive HOTL authorization policy

### Tier A — low risk: possible autonomous intermediate advancement

Examples only after real impact analysis: non-operational documentation, isolated UI wording, formatting, independently proven behavior-preserving refactors, or narrowly bounded bug fixes with unambiguous acceptance criteria. Scope and proof must be established, not inferred solely from path/line counts.

Plan automatically advances only when **all** hold:
- original authorized request, source/baseline, spec and ACs are valid and complete;
- independent Auditor has fully examined the current complete plan and accepted it without unresolved material findings; no unaudited or stale review;
- no missing product or architecture decision, scope exception, unsupported claim, or contradictory evidence;
- deterministic L0 policy sees no protected domain, sensitive path, hidden/untracked risk, multi-service impact, or unknown affected ownership; optional bounded semantic L1 supports but cannot override L0;
- a **protected, versioned delegation policy** explicitly allows that exact request category, repository/owner scope, risk tier and oversight mode;
- identities of source, plan, audit, risk policy and authorization are frozen and match the stage being advanced; agent assessment and model outputs cannot write the protected policy.

Technical review gate still requires independent review on the exact candidate, meaningful tester proof, trusted execution/verification, and proof/evidence freshness. Only then can the engine mark the *intermediate* technical decision automatically accepted.

### Tier B — moderate risk: conditional escalation

For bounded, multi-file changes without protected domain effects, automatically progress only when the owner-adopted policy affirmatively permits this category **and** all Tier A evidence/verification rules hold. Otherwise pause for human plan and/or code review. Do not infer an organizational authorization for medium risk from this design alone.

### Tier C — high risk or unknown: earlier human intervention

Authentication, authorization, identity, secrets, payment routing or money movement, financial calculations, schema/data migrations, privacy, security policy, production configuration, infrastructure, CI permissions, cross-service contracts, concurrency/idempotency, compliance-sensitive paths, unknown dependency impact, or any policy/config change to the factory itself require **Full risk controls** and explicit human authorization at the appropriate earlier point. Existing corporate security/SDLC approvals cannot be waived.

A high-risk HITL checkpoint is not permission to ignore a non-waivable technical violation. Any failed integrity/authorization/security gate remains **BLOCKED** until repaired and reverified.

### Late discovery and changing risk

Reevaluate eligibility at least: intake; after spec/plan; after Plan Auditor; after controlled Tester proof; after Developer submission / actual paths; before exact-candidate verification; before technical review acceptance; before final PR proposal.

If actual work invalidates HOTL delegation:
1. Reject forbidden or out-of-scope changes independently of tier; do not “approve” them with a mode switch.
2. Stop new dispatch, reconcile in-flight worker liveness and preserve journal/evidence.
3. Record `OVERSIGHT_ESCALATION_REQUIRED` with scope, trigger, protected policy version, current subjects and invalidated dependent evidence.
4. Require genuine human action (or a linked new authorized run/route epoch) to proceed with any newly required plan/code approval.
5. **Do not** change the stored oversight mode or replay history in place. Mark the *effective approval origin* per decision; the run can remain “HOTL selected, human escalation used.”
6. Retain the final human PR gate in all cases.

## 4. Full pipeline HOTL — exact gate-by-gate behavior

| Stage | Actor(s) | Engine action on HOTL | Human intervention |
|---|---|---|---|
| Start selection / intake | Human operator + engine | Store requested/effective `Full/Express` + `HITL/HOTL` and policy refs atomically before model dispatch. | Operator chooses both fields. |
| Intent/spec | Planner | Source-grounded requirements with stable AC IDs, no invented product behavior. | Product ambiguity => ASK, not hallucinated assumptions. |
| Plan | Planner | Produce canonical identity-bound plan and proof strategy. | No routine plan approval yet. |
| Plan audit | Fresh independent Auditor | Complete audit, structured findings, coverage, limitations and basis refs. | Unresolved material findings / required design call => human; bounded revision per current policy. |
| **Plan authorization** | **Trusted engine applying policy** | On eligible case write `AUTO_AUTHORIZED_BY_POLICY`, exact policy/plan/audit refs, decision predicate results and rationale; no false human approval. | If not eligible, existing HITL plan checkpoint with combined audit/plan brief. |
| Controlled proof | Tester | Independent tests/characterization protected from Developer; honest RED semantics. | Missing valid evidence => blocked or human product clarification. |
| Implementation | Developer | Only permitted candidate paths; prevent or reject protected writes. | Unauthorized change cannot be waived by “agent approval.” |
| Candidate verification | Deterministic executor | Exact candidate/baseline evidence; verify all required tests and policy invariants. | Verification failure => bounded fix loop or block. |
| **Technical code review** | **Fresh Reviewer** | Independent findings and coverage; engine validates exact subject, allowed verdict, missing evidence and risk classification; eligible accepted verdict can progress. | For protected/high-risk/policy-exception code or unresolved review => human checkpoint. |
| Agent PR review | Fresh independent PR Reviewer | Validate proposal claims, provenance and limitations after successful technical review; cannot override an earlier rejection. | Does **not** replace final human PR review. |
| **Final PR decision** | **Human reviewer** | Always wait for genuine review of exact candidate, diff, plan, audit, tests, reviewer findings, risk and scope; verify identity/binding. | **MANDATORY** in HOTL as requested. |
| Publication / merge / deploy | Existing authorized mechanism | Preserve all separate external action gates, branch rules and deployment policy. | As mandated by existing systems; never inferred from PR review. |

In **HITL**, maintain the exact existing user experience, current wait semantics, decision identity and code-review flow; avoid adding artificial new questions. If a workplace implementation already uses a manual code review, preserve it for HITL and permit HOTL to use the automated technical review + exception logic only through an approved engine gate.

## 5. Choosing the implementation mechanism — engine owns policy, not prompts

**Do not implement HOTL by teaching the Coordinator to auto-click “proceed” or fabricate a human decision.** The baseline `plan-decision` stage in `core/policies/workflow.ts` is a human stage; `core/engine/state.ts` and downstream validators assume human plan authorization. A HOTL extension requires an actual **versioned authorization contract and transition** or equivalent validated workflow/policy variant.

Illustrative proposed types only; inspect existing contracts before choosing exact names:

~~~ts
type ExecutionMode = 'standard' | 'express';
type OversightMode = 'hitl' | 'hotl';
type DecisionOrigin = 'HUMAN' | 'AUTO_POLICY';

type OversightDisposition =
  | 'AUTO_AUTHORIZED'
  | 'REQUIRES_HUMAN'
  | 'BLOCKED';

interface SelectedRunPolicy {
  schema_version: number;
  requested_execution: ExecutionMode;
  effective_execution: ExecutionMode;
  requested_oversight: OversightMode;
  effective_oversight: OversightMode;
  execution_workflow_ref: string;
  oversight_policy_ref: string;
  risk_policy_ref: string;
  source_ref: string;
  baseline_ref: string;
  chosen_by: string; // Actual trust/authentication must be verified.
}

interface AutomatedGateDecision {
  schema_version: number;
  origin: 'AUTO_POLICY';
  stage: 'PLAN' | 'TECHNICAL_REVIEW';
  disposition: OversightDisposition;
  source_ref: string;
  plan_ref: string;
  audit_ref?: string;
  candidate_ref?: string;
  verification_ref?: string;
  reviewer_ref?: string;
  risk_assessment_ref: string;
  oversight_policy_ref: string;
  rules_evaluated: { id: string; passed: boolean; evidence_refs: string[] }[];
  reason: string;
}
~~~

- Do **not** create a dummy `humanDecision` or `audit=PASS` to get past current parsers. The controller must recognize an authorized **distinct** automatic origin and an independently validated human origin where required.
- Prefer a single engine and one canonical policy source, with separately versioned workflow/policy identities; never a forked HOTL state engine or a duplicated Coordinator routing table.
- Preserve the public `WORKFLOW` v6 identity and old run replay byte-for-byte. Add an additive new policy/route version rather than reinterpreting previous human-only runs.
- A selected HOTL run freezes the policy and source identities. On resume, reject unknown major schema, missing evidence, mismatch or unsupported policy version, rather than choosing a different policy behind the user's back.
- Track approval **per gate**; the run-level HOTL flag alone never proves any individual gate passed.
- A role model cannot change the risk tier, organization policy, registered reviewer, executor results or authorization origin by editing artifacts.
- Authenticate human choices using the target host's supported identity/approval integration. If no trustworthy mechanism exists, the reference should truthfully report `HUMAN_CONFIRMATION_UNVERIFIED` and remain local/nonpublishing rather than claim a signed PR approval.

## 6. UI, lifecycle, reporting and evidence expectations

### Exact initial question and prompt behavior

- Add **Oversight mode** to the current **Full / Express** selection view/question. Do not create a separate startup flow or ask after expensive planning has already begun.
- Explain that HOTL still contains agent review and *always* human final PR review. The system may also request early human input.
- Keep HITL as the default with a simple way to choose HOTL at run start. If the user changes their mind before starting, no engine events or remote actions should exist from the cancelled selection.
- Preserve current “Express/Full” selection interaction and all previously accepted values.
- On resume/status/display: show selected mode, effective risk, automatic authorizations, escalations, human waits and terminal state in the current read model.
- Dashboard should visually distinguish **“Agent review complete,” “Automatically authorized by policy,” and “Human approval recorded”**; don't render one generic green check as if they meant the same thing.
- The final HTML report must list effective modes, policy identities, the exact plan/candidate subjects, automatic/human decisions, exceptions, coverage/limitations and which external actions were **NOT_ATTEMPTED**.

### Sample audit record for a legitimate low-risk HOTL plan advancement

~~~json
{
  "record_type": "oversight-decision",
  "schema_version": 1,
  "run_id": "RUN-SYN-001",
  "gate": "PLAN",
  "origin": "AUTO_POLICY",
  "disposition": "AUTO_AUTHORIZED",
  "oversight_mode": "hotl",
  "execution_mode": "standard",
  "plan_ref": "sha256:example",
  "audit_ref": "sha256:example-audit",
  "risk_ref": "sha256:example-risk",
  "oversight_policy_ref": "sha256:example-policy",
  "checks": [
    { "rule": "AUDIT_ACCEPTED", "result": "PASS" },
    { "rule": "NO_MATERIAL_OPEN_FINDINGS", "result": "PASS" },
    { "rule": "DELEGATION_SCOPE_ALLOWLIST", "result": "PASS" },
    { "rule": "EXACT_SUBJECT_BINDING", "result": "PASS" }
  ],
  "human_pr_approval": "PENDING"
}
~~~

All `sha256:example` identifiers are illustrative and **invalid as execution references**. Never manufacture actual digest values. Missing source, policy or review refs must cause rejection, not auto-success.

## 7. Engineering integration map

The implementation agent must inspect current paths first; these are **starting points**, not instructions to overwrite newer workplace code:

| Source area | Existing responsibility to inspect | Minimal adaptation to design |
|---|---|---|
| `scripts/rstack.ts` / `scripts/assembly.ts` | CLI + setup, local request and active workflow | Capture two start selections, validate operator entry, freeze effective modes before start. |
| `adapters/copilot-vscode/coordinator.md` and host glue | Operator questions and dispatch | Extend existing Express/Full question to include HITL/HOTL; display only engine-derived effective policy; do not auto-answer gates in prompt. |
| `core/policies/workflow.ts` | Machine-owned stages and human waits, v6 | Add or configure versioned HOTL eligibility-aware authorization stage/policy without changing v6 semantics. |
| `core/contracts/records.ts`, planning and policy contracts | Strict record parsing, policy/profile identities | Typed oversight choice/authorization origin/risk and fresh-subject refs. |
| `core/engine/engine.ts` and `core/engine/state.ts` | Dispatch, accepted result, state replay, decisions and status | Deterministic authorized transitions, old-run compatibility, escalation and effect-reconciliation. |
| `core/engine/brief.ts` | Post-audit plan brief | Reuse existing brief for human escalations; do not present an auto-decision as a human plan approval. |
| `core/engine/execution.ts` and `core/engine/pr-review-packet.ts` | Protected proof and PR evidence | Require identical final candidate/test/review evidence regardless of oversight mode. |
| `core/engine/proposal.ts` | Local proposal creation | Attach oversight/risk policy, human PR-gate state and truthful external action status. |
| `core/read-model/**` and dashboard/report components | Journal-derived UI | Derive mode, gated decision origin and escalations from retained validated events, not from prompt text. |
| `evals/**`, `tests/**` and `tests/sensitivity.ts` | Model-independent tests and hostile cases | Add cross-mode regression tests, negative unauthorized approval tests and pilot evaluation. |

The publicly documented Express plan already contemplates later human delegation. **Do not silently implement all Express exceptions at once.** Coordinate this design with [Express phase policy](express-pipeline/01-policy-and-routing.md); retain distinct, reviewable applicability decisions for any phase that truly can be omitted. HOTL delegates *approvals* under policy; it does **not** by itself skip plan auditing, Tester proof or independent technical review.

## 8. Implementation order and deliverables

**Milestone H0 — reconfirm reality and map baseline**
- Inspect current workplace and/or public reference at exact revision, dirty paths, host, current Express/Full chooser, required human plan/code/PR checkpoints, effective PR publication semantics, target test and authorization mechanisms.
- Write a precise compatibility table of current behavior and proposed additions. Resolve ambiguity between “Full” in actual UI and `standard` in public Express design.
- Confirm whether existing Express path is live, proposed, or a partial pilot, and whether target host can present the combined two-choice question.
- Preserve unrelated local changes and existing owners' decisions; do not infer that the public design has superseded workplace behavior.

**Milestone H1 — two selections, with no gate removal**
- Implement combined question in the *existing* start interaction: Full/Express and HITL/HOTL.
- Strict enums, legacy defaults, explicit positive HOTL selection, confirmation, cancellation, frozen policy record, status/report rendering, resume and changed-input rejection.
- With HOTL engine gates not yet implemented, **reject/not-enable HOTL selection** with an accurate message; do **not** let the UI claim a mode that has no actual backing behavior.
- Validate every Full/HITL regression path and existing Express chooser behavior.

**Milestone H2 — Full+HOTL guarded plan authorization**
- Add a protected versioned oversight policy with initial conservative low-risk allowlist, mandatory exclusions and no untrusted override.
- Preserve complete independent plan audit and combined human brief for any escalation.
- Produce distinct engine-validated `AUTO_POLICY` plan authorization only when requirements, risk and no-open-finding rules pass; otherwise wait for actual human decision.
- Update downstream plan authorization validation without fabricating human or audit evidence; handle policy/subject invalidation and older journal replay.

**Milestone H3 — Full+HOTL technical-review automation and final human PR gate**
- Retain Tester proof, Developer, deterministic verification, independent technical review and separate PR-review agent.
- When code-review gate qualifies, engine records automatic intermediate acceptance only after independent fresh reviewer and exact candidate acceptance. Any unresolved material objection or high risk escalates.
- Add/verify the **mandatory final human PR decision** if the target pipeline presently only has an agent PR Reviewer. In the public local-only reference this is a distinct product addition: remain local, no remote API action.
- Human sees a single complete packet: original request, plan/audit, deviations, code diff, tests/results, security findings, risk/classification, automatic authorization log, limitations, and exact base/candidate. Reject on changed candidate after approval.

**Milestone H4 — Express compatibility, combined routes**
- Only after Express is independently implemented/validated: test Express+HITL unchanged; implement Express+HOTL using the same oversight policy (with more restrictive eligibility where applicable).
- If Express lacks mandated audit/proof capabilities, **do not** combine it with HOTL by constructing fake results. Keep Express+HOTL unavailable until it has truthful typed phase applicability and adequate compensating proof.
- Test mid-run risk escalation; use a linked new route/run when needed, never mutate frozen history.

**Milestone H5 — offline evaluation, target-host verification, gradual activation**
- Deterministic suite first, then synthetic full-chain cases, then observed actual target-host interaction and permission enforcement. Distinguish `OFFLINE_VERIFIED` / `HOST_VALIDATED` / `WORKPLACE_VALIDATED`. One is not the other.
- Run a **shadow mode** policy assessment on a human-reviewed historical/synthetic sample (e.g. 30–50 cases when approved); compare “auto-authorize” recommendations to actual human decisions, including adversarial/negative cases. Numbers are suggested sample size, not measured results.
- Start with low-risk, opt-in, nonpublishing pilot. Expand tiers only by explicit owner policy revision based on measured false approvals, escaped issues, intervention rate and time savings. Provide a kill switch to disable new HOTL starts without invalidating historic records or skipping pending human gates.

## 9. Required acceptance and negative-test matrix

Do not rely on screenshots of a prompt as proof the controller enforces its selection. All tests must use representative *synthetic* data.

| Test | Expected result |
|---|---|
| S01 Start existing CLI with no new flags | Full+HITL existing behavior; exact old workflow/journal semantics |
| S02 Choose each execution and oversight combination | Four valid choices represented accurately; unsupported combinations refused explicitly, not silently changed |
| S03 Cancel / invalid / absent interactive answer | No run started and no side effects |
| S04 Explicit HOTL attempted when policy disabled | Refused or explicit human-selected HITL; never hidden fallback |
| S05 Resume run after restart | Frozen execution+oversight+policy identities restored; no second startup prompt |
| S06 Legacy v6 journal replay | Unchanged and successful under pinned old workflow; cross-version mismatch rejected |
| S07 Low-risk plan/audit fully accepted | Trusted controller produces AUTO_POLICY plan authorization, no counterfeit human record |
| S08 Auditor findings material/unknown or missing product choice | Human escalated; no auto-advance |
| S09 Short auth, payment, schema or secret-path change | HOTL bypass prohibited despite tiny diff and benign model opinion |
| S10 False “LOW_RISK” injected via ticket/LLM output | Deterministic protected policy deny wins |
| S11 Developer touches controlled tests/policy | Modification rejected; not legalized by risk tier or human PR click |
| S12 Candidate changes after tests/review | Invalidate dependent proof/review/authorization; final PR gate cannot use stale packet |
| S13 Fresh independent technical reviewer rejects | No auto-accept; bounded repair, escalation or block |
| S14 PR reviewer approves, human has not approved | Final human PR gate remains WAIT; no PR publication or merge inferred |
| S15 Forged `HUMAN_APPROVED` in an agent artifact | Rejected by origin/host evidence check |
| S16 Human rejects, asks changes or cancels final PR | Cannot complete as approved; exact response persisted |
| S17 External PR/merge action requested by HOTL choice alone | Denied; separate authorized external-effect gate |
| S18 Risk increases during Developer implementation | Stop and escalate; reconcile worker; do not rewrite run history |
| S19 Express+HOTL requested before Express eligibility implemented | Explicitly unavailable or blocked; neither profile bypasses gates |
| S20 Concurrent/repeated result and crash recovery | Idempotent or fail-closed; never double approval or dispatch |
| S21 Dashboard loads/polls and HTML renders | Read-only projection; no event/authorization created |
| S22 Existing HITL plan amendment / second-audit path | Identical old budget, waits, subject validation and behavior |

For each test, capture actual command, revision, fixture, observed outcome, pass/fail, source/test citation and whether it was offline or host-observed. Negative coverage of every critical authorization rule is required before enabling live HOTL.

## 10. Metrics, rollout decision and reversal

Compare **Full+HITL baseline** with **Full+HOTL**, holding task, model/effort, context, host and tools stable where possible. Express comparisons are a separate factorial axis—do not attribute Express's efficiency gains to HOTL.

Track, with denominators: human interruptions per accepted change; time spent waiting for human; total completion time P50/P95; verified AC pass rate; escaped defects; material audit/review false negatives; false automatic authorizations; retry amplification; total tokens and cost when host actually exposes them; count of escalated high-risk cases; final PR approval/rejection rates.

**Non-negotiable promotion gates:**
- No tested P0 authorization bypass, forged human decision, stale-candidate release, or missing independent verification.
- Human final PR approval still demonstrated in the actual host, not merely “configured” in documentation.
- Existing Full+HITL outcomes and old replay still correct.
- Any efficiency claim backed by a measured comparable baseline.
- Clear owner decision: `KEEP_PILOT`, `EXPAND`, `REVERT` or `INCONCLUSIVE`; no self-promotion by an agent.

Rollback: a protected policy switch disables **new** HOTL starts; existing runs must either continue under their frozen valid policy or stop/escalate safely to human. Do not reinterpret old automatic decisions as human approvals or delete audit history.

## 11. Explicit implementation-agent handoff

> **Assignment:** Implement the owner's new HITL/HOTL approach **alongside** the current RSTACK workflow. First identify the actual existing Express/Full start question and current approval gates. Extend that start interaction to request *both* execution mode and oversight mode, with Full+HITL preserving legacy behavior. Implement narrow, trusted engine-owned authorization for eligible Full+HOTL plans and technical reviews; keep independent audit, Tester proof, fresh code review, separate agent PR review and an actual final human PR decision. Escalate earlier for sensitive scope, missing decisions, rejected audit/review, incomplete evidence or risk changes. Add exact identity/version/provenance persistence, deterministic gates, read-model display and negative tests. Do not implement HOTL by auto-clicking human decisions or inventing `HUMAN_APPROVED`. Treat Express as an independently validated execution policy and enable Express+HOTL only after both features are proven safe.
>
> **Review the current code and earlier architecture docs before touching it.** Work incrementally through H0–H5 and preserve legacy v6 runs. Run only the necessary affected tests while iterating, then the appropriate verification/sensitivity suite for the candidate. Keep all workplace evidence internal. Do not edit unrelated project paths, weaken approvals, enable external connectors, create remote PRs, merge, or deploy without the owner's separate permission. Report exact changed files, baseline revision, regression results, unsupported host behaviors and a precise review package before requesting broader rollout.

## 12. Related references

- [Factory contract and owner boundaries](../01-FACTORY-CONTRACT.md)
- [Current reference stage graph](../core/policies/workflow.ts)
- [Express architecture packet](express-pipeline/README.md)
- [Express execution policy](express-pipeline/01-policy-and-routing.md)
- [Express integration and compatibility](express-pipeline/03-engine-integration-map.md)
- [Express implementation plan](express-pipeline/04-implementation-plan-and-agent-handoff.md)
- [October 2026 software factory assessment](ai-software-factory-assessment-2026-10-15.md)
- [Read-only dashboard design](live-dashboard/02-architecture-and-read-model.md)
- [Existing evidence/security analysis](artifact-storage-and-agent-write-boundaries-2026-10-08.md)

**Decision record:** The user expressly requested the *two-choice initial interaction* and coexistence of HITL and HOTL modes. Initial HOTL automation is conservative and subject to verified host, policy, risk, and human final-PR controls. The design is not evidence that these mechanisms already run in the current workplace implementation.
