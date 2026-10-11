# RSTACK-SDLC Express Pipeline — architecture packet

**Date:** 2026-10-11  
**Status:** PROPOSED / OWNER DECISIONS REQUIRED / NOT IMPLEMENTED  
**Scope:** Standalone `rstack-sdlc/` factory only; documentation changes only  
**Target runtime:** VS Code GitHub Copilot (real-host capabilities still require observation)  
**Owners:** Product/architecture owner approves policy exceptions; implementation agent builds only an approved increment.

## Purpose

Define a bounded, risk-adaptive Express execution profile for small, low-risk changes while retaining RSTACK's trusted controller, immutable/reconstructible subjects, tester/developer separation, independent evaluation, and authorization boundaries. **Express is not another engine, a bypass-all-agents toggle, or a promise of quality from fewer tokens.**

**Non-goal:** Rewrite the workplace engine, change legacy `rstack-pipeline/`, move files, change Jira/Bitbucket connections, install extensions, start real delivery runs, create real PRs, or publish software. This packet is for future implementation review. No decisions in it change the current default contract without explicit owner approval.

### Read in order

1. [01 — Policy and route selection](01-policy-and-routing.md): eligibility, risk taxonomy, Express/Standard transitions, phase matrix and human authority.
2. [02 — Evidence and trust boundaries](02-evidence-and-trust.md): immutable records, exact-subject verification, independent actors, fail-closed gates and negative cases.
3. [03 — Integration/change map](03-engine-integration-map.md): precise touchpoints in the current TypeScript engine and backwards-compatible migration.
4. [04 — Milestones, acceptance and builder handoff](04-implementation-plan-and-agent-handoff.md): staged tasks, observable acceptance, benchmarking and a copy-ready implementation-agent assignment.

### Observed basis versus proposed changes

**CONFIRMED IN GITHUB REFERENCE (not a live workplace assessment):**
- [Factory contract](../../01-FACTORY-CONTRACT.md) requires independent planning audit, a combined post-audit human decision, controlled proof, independent candidate review and a local PR proposal. It separates audit verdicts from human authorization.
- [Current workflow](../../core/policies/workflow.ts) defines workflow `local-request-to-proposal` version 6: `intent → spec → plan → plan-audit → brief → plan-decision → proof → implement → verify → review → pr-review-packet → pr-review → proposal`, with optional question/revision branches.
- [Trial model profile](../../profiles/trial-v2.json) is a role/model/attempt mapping, **not** a workflow selection or risk policy. Model selectors remain unverified where marked `requires-host-observation`.
- [Engine](../../core/engine/engine.ts) and [state replay](../../core/engine/state.ts) pin profile/workflow identities and use journaled state transitions. The current profile/parser, replay, evaluator, CLI and packaging must all be inspected before changing routes.
- [Host validation record](../s6-host-validation.md) explicitly distinguishes OFFLINE from COPILOT_VALIDATED. Do not reinterpret older checkpoint results as validation of a new Express package.
- [Storage/agent-boundary decision gates](../workplace-architecture-decision-gates-2026-10-08.md) are **not approved** for storage migration; full workspace copies, Git/CAS strategy and host write prevention remain separate architectural decisions.

**PROPOSAL:** Introduce a versioned `standard` / `express` workflow policy with an L0 deterministic classifier, limited L1 semantic investigation, optional L2 deep investigation, a fail-closed fallback, and durable evidence for every omission or simplification. Both share the existing engine, proof/execution controls and release safety floor.

### Principle

> Lower the cost of reaching justified confidence; do not lower the evidence required to justify a release.

A one-line authorization change can be higher risk than a large cosmetic update. Express eligibility must never depend on a line-count threshold alone.

## Desired external behavior

- **Default:** Standard remains the unchanged, fully verified path.
- **Express requested:** Engine evaluates objective exclusions first. If risk is known and within a narrowly permitted scope, it freezes an Express decision and executes its bounded route.
- **Uncertain or sensitive:** Standard is selected **before** skipping anything. If unexpected risk is found after dispatch, freeze the run, invalidate dependent evidence, and transition through an explicit escalation/rehydration operation; never silently jump over Standard obligations.
- **Every run:** Reconstructible source/candidate, role-owned writes, independent proof and verification appropriate to the work, independent technical review of the exact subject, accurate PR claims, and explicit authorization for any external action.
- **Current product:** Local PR proposal only. A successful Express run is not proof that a remote PR was created or deployed.

## Architecture sketch

~~~text
User local request + selected profile
            |
      Trusted RSTACK engine
            |
 L0 policy checks / scope inventory
            | unknown => Standard or BLOCK
     L1 semantic assessment?   L2 deep assessment?
            | neither may override L0 deny
            |
     Frozen eligibility decision
       /                    \
  STANDARD                 EXPRESS
  existing route           compact planning route
  independent audit        optional plan audit per owner policy
  human plan decision      human or explicit scoped delegation
       \                    /
        trusted proof / candidate admission
             developer production delta
       independent candidate verification
        independent focused technical review
           required independent PR review
          deterministic release/proposal checks
             local proposal only
~~~

**Do not interpret the converged middle as shared agent context.** Planner, tester, developer, reviewer, and PR reviewer keep role-specific fresh inputs and permissions. Shared *engine code* is not shared *reasoning session*.

## Hard invariants for both profiles

- Controller owns immutable identities, journal/state, decisions, stage dispatch, candidate admission, and all promotion gates.
- No skipped stage is represented as `PASS`. Use `NOT_REQUIRED_BY_POLICY` with an identified policy decision or `NOT_APPLICABLE` with an appropriate proof route; preserve as a distinct evidence state.
- Failures, unverified host capabilities, unknown changes and missing/malformed evidence cannot be approved by a stronger model.
- Independent Reviewer cannot certify its own source edits; Developer cannot edit locked test/evidence/governance authority; Reporter/Coordinator cannot fabricate proof.
- The candidate and the evidence packet reviewed must be exactly what the final gate authorizes, with stale results invalidated.
- No agent or profile can widen tool/file authority granted by the host or protected policy.
- External publication/merge/deploy remains subject to its actual human-authorized integration policy. This standalone factory stops at a local PR proposal.

## Owner decisions before implementation

These are **open**, not hidden defaults:
- **OD-E1:** Accept initial Express whitelist and mandatory Standard exclusion classes.
- **OD-E2:** Is any plan-audit omission allowed? If so only for enumerated request types; otherwise keep plan audit and reduce its depth.
- **OD-E3:** Does the first Express release retain human plan decisions? **Recommended: YES.** A later delegated waiver needs a separate authority mechanism and expiry.
- **OD-E4:** Is separate PR Reviewer always required? **Recommended: YES** for the initial release; a later contract revision may remove only mechanical duplication, not independent semantic checks.
- **OD-E5:** Which nonbehavioral work may use an explicit `NOT_APPLICABLE` proof, and which verification commands are still required?
- **OD-E6:** What minimum coverage/full-suite requirement applies before a local proposal versus later real publication?
- **OD-E7:** Select ownership and retention requirements for risk assessment records and eligibility audit history.
- **OD-E8:** What thresholds and independently reviewed comparison evidence are required for launch?

**Safe initial pilot (recommended):** Keep human plan approval, an independent focused Reviewer, a separate PR Reviewer, and existing trusted proof/execution invariants. First save time by combining Planner tasks and making risk detection deterministic. Prove these changes before requesting authority to omit plan audits or human waits.

## Source-of-truth rule

This packet is a **design proposal**, not runtime policy. Accepted decisions must be implemented in the one machine-owned workflow/control definition and referenced by a run-frozen policy identity. Do not maintain competing versions of an Express state machine in coordinator prompts, generated packages and config. Review/checkpoint evidence is never silently relabeled current after a new code change.
