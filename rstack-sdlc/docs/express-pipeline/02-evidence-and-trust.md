# 02 — Mandatory evidence, trust boundaries and fail-closed gates

**Status:** PROPOSED. The baseline RSTACK safeguards in [Factory Contract](../../01-FACTORY-CONTRACT.md) remain applicable. This design **does not** assert that a VS Code/Copilot host has enforced write isolation.

## 1. Invariant evidence floor

Every Express run must be independently reconstructible and auditable. **Do not confuse a small delivery packet with deleting source evidence.** Store large raw evidence once, reference it by immutable identities, and build compact machine-checkable summaries without rewriting the underlying proof.

| Required logical item | Minimum payload / binding | Producer / enforcement owner | Failure |
|---|---|---|---|
| Authorized source and baseline | Original request/provenance; requested repo/root; frozen logical full-tree identity; relevant dirty/staged/untracked/ignored executable input bytes and metadata or durable resolvers | Engine with trusted input | Block missing or nonreconstructible content |
| Frozen selection | Requested/effective profile, workflow/policy hashes, eligibility status and L0/L1/L2 citations, material exclusions, authority | Engine | Unknown/deny => Standard or BLOCK |
| Semantic contract | Stable AC identifiers, exclusions, preserved behavior, changed surface, unresolved product decisions | Planner proposes; engine validates; human resolves decisions | Missing AC basis => stop/escalate |
| Planning disposition | Exact plan identity, audited vs unaudited distinction, audit findings if any, human/delegated authorization basis and limitations | Engine / independent Auditor / human | Missing applicable authorization => WAIT/BLOCK |
| Proof | Declared proof kind and rationale; exact locked tests or static/preservation controls; genuine baseline observations and their meaning | Independent Tester proposes; engine executes/locks | Fake RED, unknown runner or mutation => block |
| Candidate | Full source revision/tree, selected implementation delta, allowed path set, locked test digest, relevant execution/dependency inputs | Trusted admission engine | Missing bytes, unauthorized path, drift => block |
| Verification | Runner identity, exact tree/test/env, command, timestamps/outcome/exit/timeout, raw logs, observed tests and AC mapping | Engine-owned independent executor | No verifiable execution => no PASS |
| Technical review | Independent fresh-context role, exact reviewed candidate + proof/verification packet refs, minimum lenses, findings, coverage gaps/verdict | Read-only Reviewer | No review or stale digest => no proposal |
| PR review | Exact packet/procedure/candidate/ref, semantic scope/claim review, verdict and limitations | Independent PR Reviewer; deterministic checks by engine | No independent approval of current packet => no proposal initially |
| Final decision/action | Release gate result with per-obligation status; approval provenance where required; local proposal bytes, `NOT_ATTEMPTED` publication | Engine / authorized human | No counterfeit external action receipt |

**Separate three concepts:** `COMPLETED_PASS`, `NOT_REQUIRED_BY_POLICY` (a deliberate documented routing choice), and `NOT_APPLICABLE` (a reasoned, evidenced route for work without meaningful RED). `SKIPPED_UNKNOWN` or missing artifacts is failure. A risk classifier output is not test evidence.

## 2. Minimum proposed schema additions

The following are **illustrative design records**, not assertions about current parsers or permission to add unreviewed fields. The builder must adapt them to the actual schema/journal version with strict validation and deterministic serialization.

~~~json
{
  "record_type": "express-eligibility",
  "schema_version": 1,
  "run_id": "SYN-EXP-001",
  "requested_profile": "express",
  "effective_profile": "express",
  "policy_ref": "sha256:<policy digest>",
  "workflow_ref": "sha256:<workflow digest>",
  "baseline_ref": "sha256:<complete baseline identity>",
  "scope_ref": "sha256:<authorized request/scope>",
  "decision": "ELIGIBLE_EXPRESS",
  "rules": [{"id": "L0-ALLOW-UI-TEXT", "result": "MATCH", "evidence": ["source/path:line"]}],
  "assessments": [{"level": "L1", "result": "LOW_RISK", "evidence_refs": ["sha256:<assessment digest>"]}],
  "uncertainties": [],
  "checked_at_transition": "run-start"
}
~~~

~~~json
{
  "record_type": "phase-applicability",
  "schema_version": 1,
  "run_id": "SYN-EXP-001",
  "subject_ref": "sha256:<plan-or-candidate>",
  "policy_ref": "sha256:<policy>",
  "stage": "plan-audit",
  "status": "NOT_REQUIRED_BY_POLICY",
  "rule_id": "E-AUDIT-SCOPED-1",
  "disclosure": "Plan has not received independent audit",
  "authority_ref": "sha256:<approved policy decision>"
}
~~~

A `proof-route` record should discriminate at least:
- `BEHAVIOR_RED`: newly added witness genuinely fails against the unchanged base for intended assertion reasons; locked proof then passes against candidate.
- `PRESERVATION_OR_CHARACTERIZATION`: executable tests establish intended unchanged behavior; pin baseline and candidate measurements. Do not force a failing test.
- `STATIC_NONBEHAVIORAL`: an explicitly approved documentation/resource-only route with scope proof, type/link/format checks where relevant and independent candidate review.
- `ALREADY_SATISFIED`: work shown already correct with reproducible evidence and an owner-visible disposition; do not manufacture a code change or RED.

**These variants are a prospective contract change.** Current `proof` acceptance/execution requirements must not be bypassed just by writing one of these values. Implement validation, proof-running semantics, downstream packet and evaluator support **before** enabling alternative routes.

## 3. Independent actors and what independence means

- **Planner:** proposes intent/spec/plan; cannot declare its own independent audit.
- **Plan Auditor (when required):** receives exact source/spec/plan with access to relevant repository evidence, not the Planner's persuading reasoning. An omission is transparently recorded as no audit, not a low-cost fabricated sign-off.
- **Tester:** designs appropriate witness/preservation checks and supplies controlled test deltas. Engine independently executes them on the selected baseline and candidate. Tester cannot alter Developer production code to force GREEN.
- **Developer:** production delta only in admitted scope. May read locked tests, cannot write or replace them as an authority token.
- **Technical Reviewer:** fresh context, read-only inspected frozen candidate/evidence and own findings; cannot implement fixes and review them in the same role.
- **PR Reviewer:** separate fresh decision on scope/claims/proposal-readiness. Deterministic claims validation should precede that role; its semantic conclusion must not override failing technical review.
- **Coordinator:** transports exact engine-directed envelopes/results and may not substitute another agent, alter verdicts, or become an unofficial implementation/approval agent.
- **Controller/engine:** owns immutable control/policy, role admission, journal/state transitions, proof execution, freshness and final gate. Host permissions must be measured, not assumed.

Model separation and fresh context are useful but **not equivalent to a preventive filesystem sandbox**. Distinguish `PREVENTED` by host/OS, `REJECTED_AT_GATE` by measured controller state, and `UNVERIFIED` when a capability is missing.

## 4. Repository integrity and exact-subject proof

The planned Express speedup must not weaken the independent storage/admission design. Reference [architecture decision gates](../workplace-architecture-decision-gates-2026-10-08.md); that decision is still pending.

Controller should:
1. Pin the entire logically relevant source baseline and evidence inputs, including staging status, types/modes, renames/deletions and content needed if a checkout disappears.
2. Materialize an attempt-local writable view only for roles requiring edits; do not share live writable directories across abandoned workers.
3. Measure and admit exact authorized Tester changes; lock controlled proof identity before Developer dispatch.
4. Accept only production-authorized Developer changes. Independently compare expected and observed full source trees and protected sibling roots at admission.
5. Reconstruct/seal exact candidate bytes; run trusted relevant proof and verification from those bytes and declared environment.
6. Measure integrity again at verification, review and proposal boundaries; hash alone detects observed mismatches, not a transient write-and-restore or a blocked write.
7. Retain raw logs, result envelopes, candidate/lock identities and failed attempts; ensure replay can resolve every referenced object even if scratch views are deleted.
8. Check all required evidence and exact packet identities at proposal, not merely presence of files with familiar names.

**Never reconstitute a full physical directory just to satisfy an artificial phase boundary if safe byte-identical reconstruction/reference works.** But **do not** replace bytes with SHA-only references that cannot restore dirty/non-Git content. Optimize storage separately after measured architecture decision.

## 5. Freshness and invalidation DAG

~~~text
source / scope / policy + host constraints
           |
       eligibility
           |
    intent -> spec -> plan -> applicable audit -> authorization
                        |
                     proof route + locked tests
                        |
                 admitted candidate
                        |
            final independent verification
                        |
              exact-packet technical review
                        |
              exact-packet PR review
                        |
                deterministic proposal
~~~

Changes to an upstream identity conservatively invalidate dependent decisions:
- new requirements, different file scope or policy => eligibility and every derived stage;
- revised plan/spec => previous audit/authorization and downstream work as dictated by applicable policy;
- changed locked tests or proof env => verification/review/proposal;
- changed candidate (including integration) => verification/reviews/proposal;
- changed evidence packet/PR review procedure => PR review/proposal; changed verification receipt => relevant technical review if relied upon;
- changed host/policy that affects safety => block before continuation.

No agent re-stamps a result onto a new subject. An Express-to-Standard escalation must either create a linked new Standard run with all required new evidence, or record a formally versioned route-epoch and demonstrate deterministic replay. Choose one; for MVP, **linked run** is preferable.

## 6. Tests that prove *non-evasion*

Run with disposable fixtures, never a live employer repository:

| Scenario | Required result |
|---|---|
| Missing source blob with valid SHA label | Reconstruction fails; no review/proposal |
| Dirty/untracked/binary mode change omitted from baseline | Admission or execution basis fails |
| Developer alters locked test, then restores file before gate | Cannot claim PREVENTED from snapshots; disclose detection limit and prove effective host prevention separately |
| Developer leaves an unauthorized protected-file change | Gate rejects; no GREEN or proposal |
| Sibling repository touched | Scope/integrity check fails where sibling root is declared |
| L0 disallow + L1 "safe" | Standard required, no model override |
| Risk rises after Developer edit | Express halts; skips cannot be retroactively upgraded to PASS |
| Tester reports RED but run was compile failure | Proof invalid; no implementation dispatch |
| Correct behavior requires no RED (documentation) | Approved nonbehavioral route verifies applicable checks; no fabricated failure |
| Test runner exits 0 with zero executed tests | No verification PASS when executable tests were required |
| Full suite fails outside changed area | Attributed, disclosed and handled by existing exception policy; never silently waived by Express |
| Reviewer receives stale source or verification digest | Rejected at packet gate |
| Two agents submit same attempt differently | Conflicting duplicate refused; state not rewritten |
| Abandoned worker later writes | Retry cannot accept stale result or contaminate next attempt; host isolation claim remains empirical |
| Replay run with different workflow/policy/profile | Refused or explicit compatible migration; no silent route reinterpretation |
| Owner decision for different plan digest | Not applicable; human redecision required |
| PR Reviewer omitted while policy requires it | Proposal refused |
| PR proposal says "published" | Rejected: current product is local proposal only |

## 7. Authority decisions and disclosure

Maintain two distinct facts:
1. **Risk eligibility** — an engine-validated observation against immutable policy and evidence.
2. **Authority** — the actual human decision or properly preauthorized policy capability for the exact scope/time/action.

The initial Express implementation must retain the human plan decision. A later opt-in delegated decision requires a trusted enrollment and revocation model, bounded request classes and repositories, maximum change budget, effective date/expiry, one-run audit trail, owner-visible pause/override, and an explicit fail-closed response when identity/revocation cannot be established. Do not implement this delegation as a checkbox or arbitrary local JSON file and claim it authenticates a human.

## 8. Minimal review packet shape

Present a short human-readable summary **derived from**, not copied over, canonical records:

- source and requested/effective profile; why Express qualified;
- exact requirement/plan/test/candidate digests;
- decisions and **unperformed** stages with reasons, prominently disclosed;
- proof kind, test baseline and final outcome; environment/coverage gaps;
- Reviewer and PR Reviewer identity/verdict/freshness;
- unauthorized-path/integrity check results;
- authorization status and any no-publication caveat.

Opaque `PASS` without inspectable evidence is not sufficient. Engine contracts and frozen versioned policies, not the HTML renderer, determine execution eligibility.
