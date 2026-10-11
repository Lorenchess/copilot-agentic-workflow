# 03 — Engine integration map, contracts and backwards compatibility

**Status:** Design guidance ONLY. Exact file inventory below is from the GitHub `rstack-sdlc/` reference on 2026-10-11; the builder must inspect current branch/revision before editing. No employer implementation is assumed identical.

## 1. Prefer narrow extension over a second pipeline

The present engine already has a useful seam: `createEngine(options)` selects `options.workflow ?? WORKFLOW` and computes a workflow identity; `state.ts` replays journal events against a workflow; stages have `inputs`, `produces`, `next`, optional `app_copy` and an explicit role/mode. Preserve those properties.

Do **not** create `express-engine.ts` as a duplicate engine, second journal, coordinator-owned route table, prompt-only risk classifier, or another profile parser. A versioned workflow definition with trusted stage policies is the proper extension surface. Keep Standard `WORKFLOW` version 6 byte/behavior-compatible for existing runs and fixtures. Do not repurpose version 6 to mean something new.

The current `profiles/trial-v2.json` covers **role/model configuration**, not workflow selection. Proposed design should introduce separate *workflow selection* and *risk policy* authorities; do not abuse role model aliases as policy.

## 2. Component-by-component change map

| Existing component | What to inspect | Proposed narrow change | Regression |
|---|---|---|---|
| `core/policies/workflow.ts` | `WorkflowDef`, `StageDef`, `WORKFLOW` v6, `workflowRef`, `allowedActions` | Keep v6; add one separately versioned Express pilot workflow and validated definition metadata. Ensure phase applicability comes from engine-checked policy, not conditionals scattered in stages. | Historical v6 replay and all mandatory stages |
| `core/contracts/records.ts` | `parseProfile`, `TaskEnvelope`, `RoleResult`, `DecisionAction`, digests | Define validated effective selection and risk decision/phase applicability records; canonical refs; strict compatibility. Add fields only through explicit schema bump or compatible new contracts. | Unknown fields/ref mismatches refused; profile/model selectors unchanged |
| `core/contracts/planning.ts` | Valid intent/spec/plan/audit/final-plan identities, amendment logic | Compact Planner emits same typed intent/spec/plan subjects atomically; distinguish unaudited vs audited plan, no counterfeit audit. | Existing auditors, plan decisions and amendment paths |
| `core/contracts/app.ts` and `core/engine/execution.ts` | Proof, baseline classification, candidate verification and reviewer contracts | Future controlled proof-kind discrimination (RED / preservation / static); do not enable alternative until executor and packet consumers enforce it. | Fake RED/refusal, test count, lock and exact candidate checks |
| `core/engine/engine.ts` | `createEngine`, start/next/submit/decide/resume/abandon, stage derivation, materialization | Resolve approved workflow at start; evaluate/freeze eligibility; enforce promotion re-checks; handle atomic multi-output planner; preserve idempotency and no out-of-order dispatch. | Journal/attempt identity, crash recovery, stale submits, no side-effect `status` |
| `core/engine/state.ts` | `RunState` replay, stage transitions, authorization and audit-budget assumptions | New event types/state for risk and route epochs, phase applicability and explicit escalation; only when required. Never reinterpret old events. | Stale/altered event replay fails; v6 unchanged |
| `core/engine/journal.ts` / `lock.ts` | Atomic persistence, expected version, crash repair | Reuse trusted atomic journal; add event payloads with exact policy identity only through reviewed schema. | Concurrent starts, truncated journal, duplicate submits |
| `core/engine/tree.ts` / `containment.ts` | Source measurement, materialized attempt views, path containment | Reuse trusted admission model; check risk actual-path delta at gates. Do not do storage migration here. | Traversal, symlinks, dirty/untracked, multiple roots |
| `core/engine/brief.ts` | Post-audit HTML, escaped contents, decision subjects | Produce a truthful compact Express brief with unaudited-stage notice **only if policy permits**; keep Standard brief unchanged. | Malicious HTML, missing authorizing identities |
| `core/engine/pr-review-packet.ts` | Current strict need for `audit`, `proof_baseline`, `verification`, `review` | In pilot, keep required inputs intact. In later policy revision accept explicit applicability records and correct alternate proof, never arbitrary nulls. | PRR tests: no PR-review bypass, stale packet rejected |
| `core/engine/proposal.ts` | Composition after reviews; statements of test/PR status | Attach effective profile, accurate omissions, risk gates and limitations; no claim of external PR. | Unauthorized proposal and ungrounded claims blocked |
| `core/policies/pr-review-procedure.ts` / `core/roles/pr-reviewer.md` | Distinct independent PR gate and input packet | Narrow semantic checklist while retaining separate review. Mechanical comparisons stay in engine. | Reviewer verdict cannot override technical rejection |
| `core/roles/planner.md` and planning Skill | Planner modes and exact output contracts | Add `compact` mode that emits validated canonical records; no skipped source requirements. | Partial/malformed multi-output rejected |
| `core/roles/reviewer.md` and application Skill | Technical review contract and findings | Add constrained `focused` review procedure, still independent and evidence-backed. | Required minimum lenses and read-only behavior |
| `scripts/assembly.ts` and `scripts/rstack.ts` | Run setup/config and CLI start arguments | Add explicit optional `--workflow standard|express` or equivalent; default Standard. Show requested/effective profile and refusal/escalation. | Existing CLI invocations mean Standard |
| `adapters/copilot-vscode/generate.ts` / `scripts/generate-package.ts` | Host package contents, manifest identities | Include new policy/role procedures only as needed; verify generated output uses single source, no copied routing policy in prompts. | Package reproducible, installs do not widen rights |
| `profiles/trial-v2.json` | Active model aliases/effort and host selectors | Preserve default, introduce separate opt-in Express profile only when owner approved; do not invent selectors/effort. | Standard unchanged, unknown host remains unverified |
| `evals/deterministic.ts` / `evals/verify-packet.ts` / rubrics | Audit, human, proof, technical and PR reviewer scoring | Make Express-applicability explicit and score only valid omissions. Flag counterfeit PASS and unsupported waiver. Compare Express+Standard outcomes. | Old frozen eval packets still resolve correctly |
| `tests/*`, `tests/sensitivity.ts` | Engine, proof, evidence, packaging, PR review, replays | Add small targeted tests for each policy state/negative; preserve existing safety mutation tests and failure witness. | No regression in old model or default route |

**Implementation note:** Some apparent stage flexibility is deceptive: current engine, final-plan logic, packet builders and proposal validators may assume an audit and baseline proof always exist. Merely modifying `next` pointers in `workflow.ts` can break correctness or bypass gates. Trace **every** consumer and retroactive replay validation before attempting a stage omission.

## 3. Recommended phased route definitions

### Express pilot A — no exceptions to safety baseline

Best first implementable profile. Keep all independent plan-audit and human checks, Tester, Developer, technical reviewer and PR reviewer; reduce work by:
- L0 controller eligibility that rejects sensitive/unknown work;
- one compact Planner invocation emitting separate canonical intent/spec/plan records;
- concise deterministic HTML derived from the same records;
- focused auditing/review procedures with unmodified required semantic checks;
- smaller role envelopes, evidence references and conditional extra investigation;
- narrow targeted test feedback before existing final candidate verification.

The pilot retains current RED proof semantics until `proof-kind` support is independently approved. Cosmetic/no-op/`STATIC_NONBEHAVIORAL` routes should **remain on Standard or STOP as not supported** if the current proof protocol cannot represent them honestly. Do not change expected failing tests to force eligibility.

### Express pilot B — explicit audit omission (owner-only opt-in)

After pilot A is safe and benchmarked, a specifically versioned path for allowlisted classes may bypass the independent **plan audit** while retaining human authorization and proof/review. This requires:
- validated phase-applicability schema with policy and plan refs;
- full packet/brief/proposal logic for an **unaudited** plan;
- no unconditional `audit` requirement in downstream parsers that cannot be truthfully satisfied;
- stricter eligibility scope and independent compensating evidence;
- negative tests of tampered waiver, stale revision and Standard escalation.

Before approval, do not infer that "low risk" is itself authority to skip a declared contractual stage.

### Express pilot C — limited human delegation / alternate proof (later)

Separate opt-in proposals. Do not combine this with pilot B in one unreviewed change. Human planning delegation requires trusted owner enrollment and scope-limited revocable authority; alternate proof requires credible executor and reviewer semantics. Keep the two changes independently evaluated. Initial implementation must not offer misleading CLI flags that claim unsupported features.

## 4. Example workflow policy structure (illustrative)

~~~ts
type ExecutionSelection = 'standard' | 'express';
type EligibilityStatus =
  | 'ELIGIBLE_EXPRESS'
  | 'REQUIRE_STANDARD'
  | 'NEEDS_HUMAN_SCOPE_DECISION'
  | 'BLOCKED_UNVERIFIED';

type Applicability = 'REQUIRED' | 'NOT_REQUIRED_BY_POLICY' | 'NOT_APPLICABLE';

interface FrozenSelection {
  requested: ExecutionSelection;
  effective: ExecutionSelection;
  workflowRef: string;
  riskPolicyRef: string;
  baselineRef: string;
  scopeRef: string;
  eligibilityRef: string;
  // Must not be mutable after dispatch under this route epoch.
}
~~~

Illustrative only: do not paste this type into source without aligning with `records.ts`, event replay and strict shape validation. Prefer a deterministic `resolveExecutionPolicy(...)` step that returns **either** a complete validated frozen selection **or** a typed blocker. An L1 evaluator may provide an assessment record but never directly mutate `RunState` or choose permissions.

## 5. Routing and replay

- Default CLI without Express flag => same Standard workflow and same required human waits.
- Starting Express on a prohibited request => produce a grounded `REQUIRE_STANDARD` explanation and either a new explicit Standard start or a refusal to ask for an allowed route; no intermediate Express stage dispatch.
- During run, if a new path or dependency invalidates eligibility => `ESCALATION_REQUIRED` event; stop new dispatch and settle in-flight worker; link a new Standard run from an authorized source with lineage refs. Do not overwrite the old run's `workflow_ref`.
- Resume always checks exact pinned workflow and policy bytes; absent/changed => deterministic BLOCKED with diagnostic. An unknown schema major is not auto-migrated.
- Terminal Express record names all skipped/non-applicable stages, if any, the identity that authorized each, and proof/review constraints.

### Avoid common failure modes

1. **The twin-truth bug:** Coordinator prompt and engine have different stage rules.
2. **The fake audit bug:** Store `audit=PASS` merely to appease a downstream parser after skipping an audit.
3. **The paper sandbox bug:** Assumes tool frontmatter prevents write access without host probe.
4. **The mutable proof bug:** Reviewer examines a candidate differing from the one verification executed.
5. **The missing-bytes bug:** Discards dirty baseline bytes because their SHA remains in a manifest.
6. **The posthoc eligibility bug:** Classifies an unauthorized Developer change "safe" and accepts it instead of rejecting scope drift.
7. **The false savings bug:** Exchanges fewer calls for more retries, slower completion, or missed defects.
8. **The broken old-run bug:** Existing v6 journals are interpreted with an Express schema/route.

## 6. Packaging and compatibility acceptance

Before shipping any workflow/profile change, require all of the following:
- Default factory `WORKFLOW` and documented `trial-v2` behavior preserved.
- Both frozen workflow identities stable and distinct; no in-place reassignment of version 6 meaning.
- Old journal replay under matching old definition passes; cross-definition replay rejects.
- Package generator and installed Coordinator obtain routing/role outputs from engine, not duplicated logic.
- Strict new schema parsing rejects unknown enums, missing refs, stale subject digests.
- Synthetic end-to-end Standard and Express cases show independent workers, genuine test receipts, separate PR review, and local proposal only.
- Host validation labels are current and scope-specific. Offline success is not evidence of Copilot-host enforced file write restrictions.

No code implementation or acceptance claim is authorized by publishing this design file.
