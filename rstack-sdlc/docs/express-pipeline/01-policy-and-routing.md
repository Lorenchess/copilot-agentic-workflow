# 01 — Express eligibility, phase policy and route transitions

**Status:** Proposed policy. In case of disagreement, the current [Factory Contract](../../01-FACTORY-CONTRACT.md) controls until amended by the owner.

## 1. Profiles are routing choices, not authorities

Expose `standard` (default) and `express` through a versioned, validated workflow selection under protected configuration. The workflow policy (allowed transitions, required evidence and invariant gates) remains owned by the engine. Model allocation may vary by profile, but a model alias/effort value must not confer file access, suppress tests, or change release authority.

At run start freeze: requested profile; effective profile; workflow definition digest/version; risk-policy digest; baseline identity; requested scope; owner-delegation identity if any; package/host evidence classification. On resume, use the frozen policy or refuse with an explicit compatibility/migration decision. **Do not let an updated profile silently change an in-flight run.**

## 2. Risk classifier

Three levels denote **decision method**, not permission to weaken the result:

- **L0: deterministic, mandatory, cheap.** Controller checks source/request shape, changed-path inventory when available, policy-controlled path classes, repo roots, sensitivity, scope completeness, and authority. L0 exclusion is final: neither a model nor human prose may reinterpret an objective policy violation as Express eligible. A human may propose a future policy revision under its own governance.
- **L1: bounded semantic investigation, only if L0 allows.** Small-context agent identifies requirement ambiguity, external interfaces, dependency blast radius, preservation expectations, and likely hidden sensitive effects. Require citations to actual repository symbols/files or record `UNKNOWN`; confident prose without evidence is not sufficient.
- **L2: deeper investigation only if needed.** More independent analysis when L1 is uncertain, the request is complex, or the reviewer discovers a contradiction. Prefer escalation to Standard when additional classification is more expensive than the work being classified.
- **Human:** Resolves product and authorization choices, not missing security evidence. An owner cannot use a chat answer to override the fail-closed gate or claim a skipped review happened.

Classifier statuses: `ELIGIBLE_EXPRESS`, `REQUIRE_STANDARD`, `NEEDS_HUMAN_SCOPE_DECISION` and `BLOCKED_UNVERIFIED`. Include deterministic rule IDs, matched paths/claims, evidence references, uncertainty, policy identity, and reason. Avoid a bare confidence score or invented numeric risk threshold.

### Initial allowlist (pilot, owner must approve)

1. Documentation-only edits that do not alter generated/code-executed config, runbooks that drive operations, compliance rules, or security instructions.
2. Static end-user wording changes on previously approved UI surfaces, with no auth, financial, localization-contract, accessibility or state-flow implications.
3. Isolated formatting or behavior-preserving refactor with independently executable preservation checks and known call sites.
4. Narrow defect corrections only when the contract is unambiguous, changed paths are allowlisted, the relevant code has executable tests, and L1 finds no cross-boundary consequence.

No item is automatically eligible merely because of its label. A `docs/` path may contain policy documentation or executable generated input; a UI text change may alter accessibility or security meaning. Inspect actual usage.

### Mandatory Standard exclusions (proposed baseline)

Authentication, authorization, identity, security checks/crypto, secrets handling, payment/billing calculations, financial ledger effects, data schema/migrations, retention, privacy-sensitive processing, CI/CD and infrastructure permissions, deployment, cross-service APIs/event schemas, concurrency/idempotency, protected tests/governance, risk policy itself, dependency upgrades with security/runtime effects, and changes crossing more than one independently owned service/repository. Treat uncertain reachability or implicit side effects as Standard.

Reject Express for missing requirements, untrusted scope expansion, unexplained untracked/ignored inputs that affect execution, unresolved baseline failures, unavailable proof runners, a stale policy, a nonreconstructible baseline, and unsupported host permissions.

## 3. Risk is revisited, not guessed once

Run a deterministic reclassification at **request intake**, **after compact planning**, **after Tester proof**, **after Developer change submission**, **before final verification/review**, and **before proposal composition**. Semantic re-evaluation is conditional when new affected interfaces or requirements appear.

Compare **declared impact** with **actual full change set**: tracked/untracked/deleted/renamed; staging; symlinks; generated/execution input changes; relevant sibling roots. Reject unauthorized changes independently of whether the new risk level appears low.

A risk trigger at any point makes Express ineligible. Stop and record `ESCALATION_REQUIRED` with changed inputs, exact trigger and invalidated evidence. No new Standard role may be dispatched until:
- the controller freezes a new approved execution route from a trustable baseline and retains the old run history;
- all formerly skipped mandatory Standard obligations are completed against the applicable source/spec/plan/candidate versions;
- required human authorization is obtained, and stale proof/review decisions are re-earned;
- any in-flight/abandoned worker has been reconciled, isolated or stopped under the actual host semantics.

Do not mutate `workflow_ref` behind a recorded event; use an explicit route-epoch/transition record or a new linked Standard run with provenance. Choose one in implementation design and negative-test replay/recovery. **Preferred first milestone:** link to a new Standard run, avoiding complex in-place journal rewrites.

## 4. Phase-by-phase policy

| Responsibility | Standard (keep existing) | Express target | Conditions and evidence |
|---|---|---|---|
| Intake / specification / plan | Separate Planner modes with validated records | One compact Planner invocation, possibly multiple validated outputs | Preserve provenance, intent, `spec`, stable AC IDs, exclusions, impact, proof plan; never silently invent decisions |
| Plan Auditor | Independent full audit | Initially focused independent audit; conditional omission **future policy option** | If omitted, record `NOT_REQUIRED_BY_POLICY`, rule ID, exact authorized plan and an explicit no-audit disclosure |
| Combined HTML brief | After audit | Derived compact brief after any required audit | Escaped deterministic rendering, truthful missing-audit notice, display exact decision subjects |
| Human plan decision | Mandatory after audit | **Keep in first release** | Later exemption only via explicit time/scope-bound approved delegation; not a model-generated checkbox |
| Tester proof / baseline | Tester creates protected witness/preservation evidence | Proportionate proof for work class | Behavior change: meaningful RED where feasible and lawful; nonbehavioral: justified baseline/preservation/sensitivity route, never fabricated RED |
| Developer | Production-only edit within approved scope | Same boundary; narrower context | No controlled-test or policy edits; submit candidate changes to trusted admission |
| Candidate verification | Controller runs independent exact-subject verification | Same trusted executor and required checks | Targeted early tests may accelerate feedback; final proof remains mandatory for release-eligible claims |
| Technical reviewer | Independent full technical review | Independent focused review | Fresh context, cannot write code, same frozen packet, minimum lenses always applied |
| PR review | Separate role following technical approval | **Keep separate initially; narrower packet/checklist** | Mechanical claim/identity checks in engine; independent review of semantic PR assertions, limitations, scope |
| Proposal assembly | Deterministic | Same | Only after valid required decisions and review; local PR proposal, no external action |

### Reviewer minimum lenses for Express

Regardless of profile, independently examine: (a) acceptance criteria and observable behavior, (b) tests/coverage and regressions, (c) unintended changed paths/privilege boundaries, (d) interface/compatibility impact, (e) audit/proof/execution freshness and gaps, (f) uncertainty and reason for release/not-release. Deeper performance/architecture lenses are conditional unless relevant. `FOCUSED` must not mean `AUTHOR_SELF_REVIEW` or `REVIEW_NOT_PERFORMED`.

### Audit bypass is not human delegation

Even with an authorized audit omission, current Standard human decision rules do not disappear automatically. Independent audit and plan approval are separate controls. For an initial pilot, **retain both roles but compress their workload**, then separately experiment with narrowly scoped audit bypass. Do not create both exceptions in the first rollout.

## 5. Decision rules as implementable logic

~~~text
resolve requestedProfile = explicit_request ?? "standard"
if requestedProfile == "standard": use Standard unchanged

policy = loadSignedOrTrustedVersionedPolicy()
baseline = pinAndMeasureAuthorizedBaseline()
r0 = deterministicEligibility(request, baseline, policy)
if r0 has deny or unknown: route STANDARD / BLOCK
else if r0 requires interpretation:
    r1 = boundedSemanticAssessment(with grounded evidence)
    if r1 uncertain or higher-risk:
        route STANDARD / BLOCK
    else if policy demands independent check:
        r2 = independentAssessment(r0, r1, request evidence)
        if r2 unclear: route STANDARD
decision = freezeEligibility(r0, r1?, r2?, exact identities)
route = resolvePolicyRoute(decision, ownerDelegation?)
execute route via engine-validated stages
at each promotion boundary: reclassify actual scope, freshness, admission
on mismatch: STOP -> linked Standard run / designated human
~~~

Labels such as `signed` are not claims the current factory has authenticated delegation or cryptographic signatures. At first implement a controller-protected owner-configured record and report actual trust; add stronger attestation only after host capability proof.

## 6. Hard-coded negative decisions (required tests)

- One-line auth conditional fix => Standard.
- Two-file security config change => Standard even if few lines.
- README edit that alters a deployment/security procedure => Standard.
- Dependency version bump or Prisma/schema migration => Standard.
- Unknown affected package or sibling repo => Standard/BLOCKED.
- UI text change that introduces an unapproved API/permission call => escalating stop before proposal.
- Developer changes protected tests => rejected at admission, not converted to Standard approval.
- L1 `ELIGIBLE` contradicts L0 deny => L0 wins.
- Plan accepted on old digest then edited => invalidation/re-authorization.
- Human click or stale decision for another run/scope => rejected.
- `express` requested with missing policy/profile/host capability => fail closed, never silently degrade control.

## 7. Economics: why this should help

Prioritize avoided model invocations, narrower context, and avoiding repeated summaries. Count L0 checks as inexpensive, and L1/L2 invocation costs explicitly. **No projected time/token saving in this packet is a measured result.** The evaluation plan defines the benchmark; a decrease in token use accompanied by a higher missed-defect rate is failure.
