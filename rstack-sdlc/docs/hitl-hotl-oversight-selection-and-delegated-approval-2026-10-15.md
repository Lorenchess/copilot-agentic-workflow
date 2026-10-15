# RSTACK-SDLC — Full/Express × HITL/HOTL Startup Selection and Delegated Gates

**Date:** 2026-10-15  
**Status:** Owner-requested implementation design and agent handoff; **not yet implemented or host-validated**  
**Repository:** [Lorenchess/copilot-agentic-workflow](https://github.com/Lorenchess/copilot-agentic-workflow)  
**Intended scope:** Standalone RSTACK SDLC reference under `rstack-sdlc/`; adapt to the current workplace system only after inspecting that separate implementation.  
**Owner's requested outcome:** At the **existing startup question** that asks whether to use **Express or Full**, also ask whether the developer wants **HITL (Human in the Loop) or HOTL (Human on the Loop)**. Maintain the existing behavior and offer the new route alongside it. In HOTL, let independent agents and deterministic gates handle eligible intermediate plan/code checks; retain **human final PR review**, and escalate earlier for ambiguity or elevated risk.

> **Do not interpret this document as evidence that the Express selection or HITL/HOTL selection already runs in the public reference.** The checked-in `rstack-sdlc/core/policies/workflow.ts` at the inspected reference defines workflow `local-request-to-proposal` v6 with a mandatory human `plan-decision`; the Express documentation is a *proposed architecture*. The reported Express/Full startup question may exist in the newer workplace pipeline. The implementation agent must find and describe the **actual** entry point, host question capability, and version before modifying them.

## 1. Product decision: TWO independent settings, not one conflated shortcut

A pipeline **depth** choice and an **oversight** choice address different concerns.

1. **Pipeline:** `full` (comprehensive stages and evidence; public reference calls this `standard`) or `express` (eligible, bounded lower-cost delivery, per the separate Express design).
2. **Oversight:** `hitl` (current human intermediate checkpoints) or `hotl` (agent-driven, policy-authorized progression **only** when eligibility is established; human final PR review and mandatory earlier escalation when needed).

This creates four explicit combinations:

| Requested pipeline | Oversight | Intended workflow | Availability/rollout |
|---|---|---|---|
| **Full** | **HITL** | Current audit → human plan decision → proof → implementation → verification/reviews → existing human PR process | **Existing baseline. Default and backward compatible** |
| **Full** | **HOTL** | Full Planner/Auditor/Tester/Developer/Reviewer/PR Reviewer, engine permits approved intermediate automation; final human PR review | **First HOTL pilot after controls/tests** |
| **Express** | **HITL** | Express optimization subject to risk eligibility; preserve HITL decisions and required verification | Only if Express already exists and is verified on the target host; otherwise **not available** |
| **Express** | **HOTL** | Express optimization plus HOTL oversight, no combined weakening of safety controls | **Later opt-in**, after each dimension separately passes its acceptance suite |

**Never silently substitute a different requested combination.** If an option is unavailable in the current installation, disclose `NOT_AVAILABLE`, present the supported choices, and request explicit selection. A risk escalation *within HOTL* may add a human checkpoint without pretending the whole run was originally HITL. Routing from Express to Full requires an explicit safe transition/new run with preserved evidence and any needed owner decision.

### Naming compatibility

- UI label: **Full Pipeline**. Existing standalone engine/config may call it `standard`. Adapt at the UI boundary, not by repurposing old workflow versions.
- UI label: **Express Pipeline**. Do not market it as automatically safe for small files or skip required tests.
- **HITL** = humans review the approved intermediate decision(s) and final PR.
- **HOTL** = humans supervise and handle escalation/final PR; agent verdicts are *advice and verification inputs*, while engine policy grants any delegated progression.

## 2. Startup question — exact proposed user experience

Modify **the place where the current Express/Full selection is asked**. Do not scatter multiple independent prompts later in the workflow or re-ask on every resume.

**Recommended single startup interaction (two fields in the same UI question group):**

> **How do you want RSTACK to execute this change?**
>
> **Pipeline:**  
> - **Full (recommended default):** Comprehensive planning, testing and review.  
> - **Express:** Risk-eligible shorter execution, with the same mandatory safety and release protections.
>
> **Oversight:**  
> - **HITL — Human in the Loop (recommended default):** You review the plan and required intermediate checkpoints as today, and the final PR.  
> - **HOTL — Human on the Loop:** Independent agents and enforceable gates approve eligible intermediate steps automatically. You still review the final PR. RSTACK will stop to ask you about important risks, ambiguities or disagreements.

Display the resolved selection in the initial confirmation and live dashboard, for example `FULL • HOTL`; include what remains human-gated. Distinguish **requested** versus **effective** selection after policy checking. The UI should show a short warning for HOTL: **"Not unattended release: the final PR still requires human review."**

If the host question API permits only one multiple-choice input, use four unambiguous options (`Full + HITL`, `Full + HOTL`, `Express + HITL`, `Express + HOTL`), with unavailable combinations disabled or rejected before any work begins. Keep **two normalized fields** in the run record either way.

**Default and missing answer:** `full + hitl`. Existing startup invocations without new fields must preserve their current semantics. An empty/dismissed explicit selection must not be interpreted as authorization for HOTL; follow the host's existing cancel/stop behavior or require confirmation. On resume, read the frozen settings—**no duplicate selection question**.

**Question location investigation:** Trace actual startup/user-interaction code in both the reference and the active workplace implementation. The public standalone `scripts/rstack.ts` / `scripts/assembly.ts` and `adapters/copilot-vscode/coordinator.md` are starting points; `vscode/askQuestions` or the installed host's equivalent must be verified, not assumed. If an existing Express/Full chooser is only implemented in the workplace variant, implement there according to its own approved paths; don't manufacture a second chooser in the public reference.

## 3. Invariants: what HOTL does NOT mean

HOTL changes **intermediate decision authority under a bounded policy**, not the engineering evidence standard:

- Planner produces requirements-grounded, versioned intent/spec/plan with stable acceptance criteria; unresolved product decisions still go to a human.
- Fresh **independent Plan Auditor** reviews the plan and evidence; HOTL is not “skip the auditor.” Disagreement with material findings, insufficient audit coverage or unresolved requirements => human or a correctly bounded remediation step; no counterfeit `PASS`.
- Tester generates protected proof; Developer implements in its authorized lane; deterministic executor verifies the *exact* candidate. Agent self-review is not independent review.
- Independent technical Reviewer and existing independent PR Reviewer retain authority to **reject**; their `REQUEST_CHANGES`, `INCONCLUSIVE`, stale packet or hard failure cannot be converted to approval by another agent.
- The controller validates structured decisions, workflow/plan/source identities, paths, freshness, attempt versions, and required evidence. **No agent gets to grant itself broader privileges.**
- Risk and sensitivity must be reevaluated against the **actual changed files and effects** before each promotion gate, not just an initial ticket label or line count.
- **A human reviews the final PR change package in all four modes.** The local reference produces a PR *proposal*, not a remotely created PR. Do not falsely label proposal creation as human PR review or imply this design authorizes actual remote publication, merge or deploy.
- Approval of a plan, acceptance of a technical review, approval of a local PR proposal, permission to create a remote PR, and permission to merge/deploy are **different authorities**. Keep existing organizational branch protection, separation of duties and external-action permissions.
- Preserve the human's ability to pause or stop a run. An outstanding agent cannot bypass a pending human gate by retrying, changing prompts, or submitting a fake decision record.

## 4. Risk-adaptive automatic progression, with a firm escalation floor

Do **not** introduce a free-standing "Agent Approver" solely to mirror the human. Reuse the Plan Auditor, Reviewer, PR Reviewer and existing deterministic checks. A **policy decision in the engine** chooses whether an intermediate human decision is still mandatory.

### Initial conservative eligibility for AUTO-PLAN in HOTL

A plan can progress automatically **only if all** conditions are supported by frozen evidence:

1. A trusted run-start selection explicitly requested HOTL and the current deployment supports it.
2. The current policy version permits delegated planning for the observed task/scope, and the source/repository snapshot is complete and reconstructible.
3. Intent, specification and acceptance criteria are unambiguous; there are **no** unresolved business decisions, unverified required assumptions, or unexplained omissions.
4. A fresh independently produced audit was accepted for the **exact** plan and inputs, with no unresolved **material** findings and adequate coverage.
5. Objective risk rules classify the request and affected scope as eligible. Unknown or sensitive risk => HUMAN_PLAN_REQUIRED or BLOCKED (never auto-green).
6. No forbidden path, protected test, security configuration, unknown dependency, or unauthorised external effect is present.
7. Delegated approval is a trusted **controller-owned** capability bound to run, profile, policy revision, time/scope limits (where supported), and exact plan/audit/spec/source digests. A plain editable JSON value or agent phrase is not trusted authorization.
8. Mandatory test/verification/reviewer/PR-review stages remain applicable; HOTL cannot selectively omit them to save tokens.

If any condition fails, stop to request a human plan decision or block when a nonwaivable security/evidence prerequisite has failed. **Human judgment cannot fabricate missing technical evidence or override a hard deny.**

**High-risk categories requiring earlier human plan review:** authentication/authorization; secrets; payment routing/calculation/settlement; schema and data migrations; infrastructure/CI/deployment permissions; cross-service contracts; idempotency/concurrency; security policy and the factory's own permissions; sensitive privacy/retention impacts; unclear impact or requirements. Align this list with the existing Express risk taxonomy rather than maintaining contradictory copies. HOTL can still be selected, but no delegated planning approval is granted for these classes in the first release.

### Concrete plan-decision policy

```text
after independent plan audit:
  verify identity, coverage, required contracts and negative findings
  evaluate current risk + approved HOTL delegation policy
  if mode == HITL: WAIT_HUMAN_PLAN (unchanged legacy route)
  else if mandatory security/evidence check failed: BLOCK
  else if risk HIGH/UNKNOWN or requirements unclear or material finding remains:
       WAIT_HUMAN_PLAN (with reason and exact review subjects)
  else:
       append POLICY_DELEGATED_PLAN_AUTHORIZATION bound to identities
       enter protected proof stage

after proof, candidate verification and technical/PR reviews:
  any failure/stale evidence => stop/rework/escalate per existing engine policy
  eligible passes => prepare the exact human-facing final PR package
  ALWAYS WAIT_HUMAN_FINAL_PR_REVIEW before an external PR/release action
```

The transition above is a **proposed contract**, not currently an implemented parser or stage name.

### Controlled disagreement handling

- Keep the existing bounded Planner–Auditor loop semantics. Do not allow repeated model-to-model argument until costs are exhausted.
- In HOTL, a materially failed audit does **not** automatically greenlight revision. If the contract permits a bounded automatic revision, generate a fresh plan and a fresh independent audit; persist prior findings/dispositions and retain a strict retry limit. Otherwise escalate.
- Plan-level disagreements that require interpreting owner intent go to the developer/human; do not substitute model majority voting for product authority.
- Present one compact after-audit brief when a human is needed. Do not ask for preliminary plan approval before the Auditor has finished.

## 5. Engine and schema design: authorizations are typed, not falsified

The current reference `core/policies/workflow.ts` defines `plan-decision` as a `kind: 'human'` stage and `wait: 'PLAN_DECISION'` under workflow version 6. Related code consumes a **human decision and final-plan identity**. The implementation agent must trace *all* consumers before enabling an alternative. Simply modifying Coordinator prompts or skipping `plan-decision` will break invariants.

**Recommended design:**

- Add explicit, validated run selection fields, independent of model-profile settings: `requested_pipeline`, `effective_pipeline`, `requested_oversight`, `effective_oversight`, `workflow_ref`, `oversight_policy_ref`, `risk_policy_ref`, `source_ref`, `selection_origin`, and relevant owner/host capability identity.
- Freeze selection and version identities in the authoritative journal at run start. Changes on resume require an explicit authenticated/recorded transition or a linked new run—not a mutable default.
- Introduce a typed **authorization union**, e.g. `HUMAN_PLAN_AUTHORIZATION` versus `POLICY_DELEGATED_PLAN_AUTHORIZATION`, with separate provenance, evidence requirements and validation. **Never** mark a policy decision `HUMAN_RECORDED`, and never forge an audit/human-decision artifact to satisfy old consumers.
- Reuse existing immutable subject/content identities and the journal/state replay. Preserve human decision provenance limitations: a `recorded_by` string is not itself authenticated identity. State exactly what the actual host proves.
- Keep reference Full + HITL v6 **byte/behavior-compatible** for old journals; use a separately versioned workflow/policy or carefully designed backwards-compatible gate extension for opt-in HOTL. Do not reinterpret historic `PLAN_DECISION` events under new semantics.
- The stage graph, brief, proof handoff, proposal builder, dashboard read model, post-run evaluator and PR-review packet must all understand **whether a plan was human-authorized or policy-delegated** and use correct, exact subjects.
- The final PR human checkpoint needs an accurate ready-to-review package (diff, baseline/head, risk, plan, audit, verification, technical review, PR Reviewer verdict, limitations). It cannot be skipped by later engine events. Since the public standalone product stops at a **local proposal**, clearly separate review/authorization of that local package from review of a subsequently created remote PR.

Illustrative schema shape only—**do not paste this into production without validating current contracts and backward compatibility**:

```json
{
  "schema_version": 1,
  "requested_pipeline": "full",
  "effective_pipeline": "full",
  "requested_oversight": "hotl",
  "effective_oversight": "hotl",
  "oversight_policy_ref": "sha256:<actual-policy-digest>",
  "plan_authorization": {
    "kind": "POLICY_DELEGATED",
    "plan_ref": "sha256:<actual-plan-digest>",
    "audit_ref": "sha256:<actual-audit-digest>",
    "source_ref": "sha256:<actual-source-digest>",
    "policy_rule_id": "HOTL-PLAN-LOW-RISK",
    "evidence_ref": "sha256:<actual-decision-record>"
  },
  "final_pr_human_review": "REQUIRED"
}
```

The `<...>` strings above are descriptive placeholders, not valid digests. No submitted runtime record may accept them.

## 6. Responsibility/authority matrix

| Decision | Full + HITL | Full + HOTL (eligible) | Express + HITL | Express + HOTL (later) |
|---|---|---|---|---|
| Choose pipeline and oversight | Human | Human | Human | Human |
| Resolve missing product requirement | Human | **Human** | Human | **Human** |
| Plan Auditor reviews plan | Agent | Agent | As authorized Express policy | As authorized Express policy |
| Intermediate plan authorization | Human | **Trusted policy after independent audit; human on exceptions** | Human | Delegated only for narrow eligible scope |
| Tester + Developer | Agents with separation | Same | Same invariant | Same invariant |
| Exact-candidate CI and technical review | Mandatory | Mandatory | Mandatory | Mandatory |
| PR Reviewer agent | Mandatory where existing | Mandatory | Mandatory | Mandatory |
| **Final human PR review** | **Mandatory** | **Mandatory** | **Mandatory** | **Mandatory** |
| Remote PR creation/merge/deploy | Existing separate authorization | Unchanged | Unchanged | Unchanged |

**Clarification:** The technical Reviewer and PR Reviewer remain independent **agent** gates in HOTL. Their verdicts can block a run; approval to *proceed past the plan checkpoint* is issued by the controller using trusted policy. The human's final PR review is never replaced by an agent.

## 7. Integration map — inspect exact implementation before editing

| Target | Assessment/change required |
|---|---|
| **Existing Express/Full startup question** in current workplace engine (location unverified) | Add oversight as a second selectable dimension at the **same initial interaction**, or four combined choices if required by host; do not silently downgrade. |
| `scripts/rstack.ts`, `scripts/assembly.ts`, `adapters/copilot-vscode/coordinator.md` | In standalone reference, identify launch and selection seams; CLI flags or host question must resolve to one canonical selection before dispatch. |
| `core/policies/workflow.ts` and workflow versions | Preserve existing Full/HITL v6; introduce opt-in HOTL route/policy without duplicating entire engine. Express policy remains separately versioned. |
| `core/engine/{engine,state,journal}.ts` and `core/contracts/` | Trusted policy-delegated plan authorization, identity/freshness checks, safe human escalation, duplicate/replay behavior. |
| `core/engine/brief.ts` and planning/audit contracts | Show precise agent audit + human/delegated decision and risk explanation; never present delegation as a human click. |
| `core/engine/{execution,pr-review-packet,proposal}.ts` | Keep proof, candidate validation, independent reviews and correct final PR authorization; no fabricated approval field. |
| `core/read-model/`, `dashboard/`, HTML report | Display `Full/Express · HITL/HOTL`, actual current gate, `AUTO_AUTHORIZED_BY_POLICY` vs `WAITING_HUMAN`, escalation reason, and final human PR status. |
| `evals/`, `tests/`, `tests/sensitivity.ts` | Paired baseline versus HOTL evaluation, shadow-mode comparison, adversarial negative tests, historic journal replay, old-mode regression. |
| `docs/express-pipeline/` | Reuse current Express L0/L1/L2 risk strategy and its phased implementation plan. Do not enable Express audit omissions simultaneously with new delegated planning. |
| `profiles/trial-v2.json` and generated package | Preserve model allocation as a **separate concern**; new oversight selection must not edit effort/model labels or introduce new privilege. |

**Canonical source rule:** The engine or explicitly trusted configuration owns mode, risk and authorization decisions; Coordinator text and the UI reflect that source of truth. Do not create multiple unversioned, contradictory routing tables.

## 8. Implementation milestones for the agent

### H0 — Baseline and decision inventory (read-only)

- Record exact repo/workplace revision, branch, dirty state, current host, test baseline, installed engine and actual Express/Full question code/behavior.
- Inspect existing Full/HITL path, planned Express path, `PLAN_DECISION` assumptions in state, validators, read model, evaluators and PR packet.
- Identify approved owner scope and current internal security/release requirements; note any inability to inspect the real host.
- Deliver small file/change plan and tests, reusing existing implementation. Do not rewrite the factory to solve a single option.

### H1 — Startup dual selection (no gate changes)

- Add both fields at the **existing** selection point. Defaults `full + hitl`; preserve old invocations, host UI behavior, cancellations, and resumptions.
- Validate supported combinations and input values. Freeze requested/effective choices, policy/workflow identities and host capability before dispatch.
- Show choices and effective selection in `start/status`, dashboard/report if available. Display unsupported options honestly.
- Tests for all four combinations, default/no field, invalid value, cancelled question, stale resume, missing policy, and case-insensitive UI labels if applicable.
- **Acceptance:** Existing Full/HITL run is unchanged; choosing HOTL does not yet bypass a human gate until H2.

### H2 — Full + HOTL **shadow mode**

- Keep current human plan decision authoritative; independently compute the **would-auto-authorize** / **would-escalate** policy result without advancing execution.
- Sample clean and defective synthetic cases, including unknown requirements and sensitive changes.
- Record audit coverage, risk rationale, material findings, current human outcome and identity. Compare decisions without providing the HOTL agent the human answer as input.
- **Acceptance:** No demonstrated false delegation of P0/high-risk cases; discrepancies reviewed before moving to live mode.

### H3 — Full + HOTL controlled opt-in

- Add controller-owned policy authorization record and trustworthy gate. Preserve Auditor and all subsequent mandatory proof/review stages.
- In eligible tasks only, auto-progress after completed audit. On risk, missing evidence, scope drift, unknown or disagreeing audit => human wait or block with exact reason.
- Ensure the **human final PR review** remains mandatory. For the reference local-proposal flow, show accurate `LOCAL_PROPOSAL_READY_FOR_HUMAN` (or equivalent, after schema design) rather than claiming a remote PR exists.
- Tests must exercise replay, crashes, invalid/revoked policy, stale plan, forged agent authorization, missing human final decision, altered candidate and no publication without permission.
- **Acceptance:** Full+HITL default and historic runs remain unchanged; HOTL cannot override blockers, skipped tests or required PR review.

### H4 — Express compatibility (after Express has its own verified implementation)

- First verify Express+HITL works against the effective engine and policy. Do **not** falsely advertise public-reference documentation as an implemented choice.
- Enable Express+HOTL only when Express eligibility, delegation policy, proof, audit and review have been independently tested **together**, using the same engine and explicit risk reclassification.
- If the combined route is not ready, mark it unavailable. Do not silently select Full+HOTL or Express+HITL.
- **Acceptance:** No new exception bypasses a prohibition belonging to either dimension.

### H5 — Evaluation and rollout

- Compare paired tasks with **same source, model+effort+host, tool set, frozen code baseline and acceptance criteria**, changing oversight only.
- Measure **human interruptions**, median/P95 cycle time, accepted task correctness, missed-material-audit rate, proof/technical/PR review integrity, per-stage tokens/cost where *actually observable*, rework, and escalations.
- Use held-out known-defect cases as well as clean cases; adjudicate false approvals. Record unknown metrics as unknown.
- Enable HOTL by explicit owner opt-in only after negative tests, security reviews and approved host capability evidence; retain easy rollback to Full+HITL for new runs.

## 9. Required negative tests and acceptance criteria

| ID | Scenario | Required behavior |
|---|---|---|
| SEL-01 | Legacy start without new fields | Full+HITL, no new automatic authorization |
| SEL-02 | User chooses Full+HOTL | Exact choice persisted once; visible in state/report |
| SEL-03 | User chooses unsupported Express+HOTL | `NOT_AVAILABLE`; explicit new choice; no silent fallback |
| SEL-04 | User resumes an existing run | Same frozen mode/policy; startup prompt not repeated |
| SEL-05 | Tampered oversight field or stale policy digest | Reject or block; no policy bypass |
| PLAN-01 | Auditor agrees on clean low-risk plan | If qualified, engine-generated delegated authorization tied to exact subjects |
| PLAN-02 | Auditor finds material defect / unsupported assumption | Human decision or bounded re-audit; no automatic PASS |
| PLAN-03 | Required product detail missing | Human question, not model invention |
| PLAN-04 | One-line authentication/payment logic change | Mandatory early human review, even if HOTL selected |
| PLAN-05 | Planner changes plan after automated authorization | Invalidate decision and dependent work |
| SEC-01 | Agent forges `HUMAN_RECORDED` or `POLICY_DELEGATED` | Cannot advance without trusted authority |
| SEC-02 | Agent modifies protected tests/policy or writes out of lane | Trusted prevention or explicit detect-and-block; never release |
| RUN-01 | Crash after recorded delegated decision | Idempotent replay, no double dispatch |
| RUN-02 | Unknown external effect / stale evidence | Reconcile or STOP; no blind retry |
| REVIEW-01 | Test/verification failure, stale candidate, Reviewer rejection | Block/rework per policy; no final-ready claim |
| PR-01 | Agents all approve but human rejects final PR | Remains unapproved; no publication, merge or deploy |
| PR-02 | PR packet changed after final human approval | Prior human decision invalidated; fresh review required |
| PR-03 | Local proposal exists but remote PR was never created | UI/report says `NOT_PUBLISHED`, not “PR approved/merged” |
| EVAL-01 | HOTL on clean and adversarial paired fixtures | Truthful quality + intervention + cost comparison |

For every test, state whether it is **OFFLINE_UNIT**, **OFFLINE_INTEGRATION**, **HOST_OBSERVED**, or **INTERNAL_OBSERVED**. Do not claim host enforcement from green offline unit tests. Run relevant affected tests first; retain full applicable suite results and independent review before merging code.

## 10. UX/dashboard and final report expectations

The developer should always be able to answer:

- **Which choices did I request?** `Full + HOTL`.
- **Which choices are actually in force?** `Full + HOTL` or explicit unavailable/escalated status.
- **Who authorized this plan?** `HUMAN` or `ENGINE_POLICY (rule-id, audit-ref)`; never “AI approved for human.”
- **What did the auditor find?** Accepted material findings, open findings, coverage limitations, exact plan version.
- **Why am I being interrupted?** Specific risk finding, missing requirement, stale evidence, or exception.
- **Is the PR ready?** Separate: technical approval, independent PR Reviewer acceptance, **human final review pending/accepted/rejected**, external publication state.

Report every delegated decision in the journal and terminal HTML with explicit provenance. The existing Mission Control read model derives display state from committed events: **do not animate speculative agent progress or add UI-triggered state mutations**. Keep dark/light themes and accessible, text-based status semantics.

## 11. Compatibility / failure behavior and rollback

- Do not alter historical workflow-v6 event meanings; old runs must replay under their recorded workflow identity.
- Do not replace `HUMAN_RECORDED` with new policy-delegated semantics, or write fake agent approvals into existing human-only parsers.
- On missing effective host identity, unsupported policy, unknown risk, conflicting approvals or corrupt journal: reject auto-advance, expose reason and preserve evidence.
- When new scope invalidates HOTL eligibility, **freeze automatic progression**; wait for human authorization or block. Do not retroactively rewrite the earlier valid plan decision.
- If Express becomes ineligible, use the existing Express design's explicit route-epoch or linked Full run preserving lineage; never edit `workflow_ref` in place or silently weaken Full.
- Rollback of a new deployment disables HOTL for **new starts**, while in-progress HOTL runs either safely resume with their pinned compatible engine/policy or stop with an explicit supported migration decision. Never silently reinterpret as HITL.
- No new AI role, server, database or credentials are necessary simply to represent a second startup field. Introduce only the smallest justified extension and test it.

## 12. Implementation agent's executable handoff

> **Task:** Implement a backward-compatible oversight-mode selection in the actual current RSTACK system. At the *existing* Express/Full pipeline startup question, ask for **HITL or HOTL** too. Keep Full+HITL the default. Use independent oversight policy fields, not a combined prompt shortcut. Preserve current Human-in-the-Loop behavior unchanged and add Full+HOTL initially with shadow-mode evaluation, deterministic delegation eligibility, honest human escalation and mandatory human final PR review. Enable Express combinations only where the Express implementation/policy is demonstrably available; otherwise show unavailable, not silent fallback.
>
> **First:** fetch current `main`, record branch, latest commit, dirty files and applicable host; inspect this document, `01-FACTORY-CONTRACT.md`, `docs/express-pipeline/`, workflow v6, engine/state/decision/brief/PR packet, dashboard and tests. Locate the **real** Express/Full selection, which may be in the separate workplace build. Report **CONFIRMED / ASSUMED / UNVERIFIED** status for each assumption. Preserve unrelated local changes; do not copy employer evidence into public GitHub.
>
> **Then:** propose and implement H1 through H3 in small, reviewable increments. Keep existing gates unless an explicit versioned change and negative tests prove their replacement. Exercise the adversarial scenarios in §9. Compare shadow-mode decisions with current HITL decisions. Obtain independent review of the candidate and report tests and host constraints accurately. Never bypass final human PR approval or perform external publication/merge/deployment just because the new mode was selected.
>
> **Deliver:** a short change map; source changes where authorized; tested schema/transition updates; updated startup question; truthful dashboard/report view; regression/sensitivity evidence; example runs for Full+HITL and Full+HOTL; explicit Express support matrix; and a clean owner review summary with exact files, commits, limitations, rollback and next unresolved decisions.

### Related architecture and provenance

- [RSTACK standalone contract](../01-FACTORY-CONTRACT.md) and [workflow v6](../core/policies/workflow.ts)
- [Express pipeline overview](express-pipeline/README.md), [eligibility and route policy](express-pipeline/01-policy-and-routing.md), [engine integration](express-pipeline/03-engine-integration-map.md) and [phased plan](express-pipeline/04-implementation-plan-and-agent-handoff.md)
- [October 2026 factory assessment](ai-software-factory-assessment-2026-10-15.md)
- [Existing RSTACK dashboard architecture](live-dashboard/02-architecture-and-read-model.md) and [current dashboard findings](live-dashboard/04-engine-findings-research-and-decisions.md)
- [Artifact/write boundaries](artifact-storage-and-agent-write-boundaries-2026-10-08.md)

**Preparation limits:** This design reflects selected current public GitHub reference source and user-reported workplace workflow. No code or host execution tests were run to produce the document; availability of Express/Full chooser and real workplace approval implementation **must be verified by the implementing agent**.
