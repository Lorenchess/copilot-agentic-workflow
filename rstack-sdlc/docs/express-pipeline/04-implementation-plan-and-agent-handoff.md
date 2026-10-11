# 04 — Implementation milestones, acceptance/evaluation and builder handoff

**Date:** 2026-10-11  
**State:** IMPLEMENTATION GUIDANCE, **NOT** blanket implementation approval. Current Standard workflow stays the behavior of record.  
**Allowed implementation scope, once authorized:** `rstack-sdlc/**` only; no changes to other repository paths.  
**Product boundary:** local synthetic input → validated local PR proposal. No Jira/Bitbucket activation, remote PR, push of application code, installation in employer workspace, merge or deploy.

## 1. Contract-first build order

Do not start by removing agents, skipping audits, changing model assignments, parallelizing copies, or optimizing storage. First establish exactly what the present engine guarantees and where current assumptions bind the workflow.

### Preflight (read-only before source implementation)

1. Record current revision/branch/dirty state, enabled host/session and baseline test results. Preserve unrelated work; do not create clones or worktrees as a shortcut.
2. Read `README.md`, `01-FACTORY-CONTRACT.md`, `03-BATCHES-AND-EVALS.md`, `core/policies/workflow.ts`, `core/engine/{engine,state,execution,tree,brief,pr-review-packet,proposal}.ts` and relevant validators, package scripts, profile and tests.
3. Trace a real Standard synthetic run: source → Planner → Plan Auditor → human decision → Tester/RED → Developer → independent verification → technical review → independent PR review → local proposal. Record each canonical subject and all consumer assumptions.
4. Verify which stage-skipping/multi-output behaviors are genuinely supported. Distinguish existing flexibility (e.g. injectable workflow definition) from safe operational support (parsers, replay, consumers, package and evals).
5. Inspect the S6 host-validation status. Re-run specific offline checks; never relabel OFFLINE as COPILOT_VALIDATED.
6. Write an acceptance-ready **owner decision sheet** for OD-E1–E8 from the packet README, with recommendations, risks, alternatives and measurable verification. **Stop if permission to change the live workflow contract has not been granted.**

### Milestone E0 — Policy and source-of-truth foundations (no route skips)

**Implement only after owner approves the architecture/pilot scope.**

Deliverables:
- Versioned Express eligibility policy with precise allowlist, exclusions, unknown handling, policy digest and stable rule IDs.
- Controller-owned L0 assessment that is independent of the agent prose; optional schema for L1/L2 with evidence references. No production model-call dependency for deterministic tests.
- Frozen run selection (requested/effective profile, policy/workflow/baseline/scope/decision refs), strictly parsed and journaled.
- Standard stays the default; a rejected Express request either explicitly selects Standard or BLOCKS before Express dispatch. No auto-promotion based on an untrusted assertion.
- Scoped, synthetic explain-why report visible to human and auditable via immutable record.

Tests: deterministic L0 allow/deny matrix; unknown/hazardous/disguised text; tampered/missing ref; replay with different policy; duplicate submissions; Standard bit-for-bit route behavior. Sensitivity mutation: remove one deny guard and prove a test fails.

**Exit:** No Standard behavior regression; no gate bypass; risk classification inspectable independently of the LLM.

### Milestone E1 — Compact planning in a pilot profile (first real savings)

Deliverables:
- Separately versioned `express-pilot` workflow. Do **not** rename/rewrite v6 `WORKFLOW`.
- One Planner dispatch produces validated canonical `intent`, `spec` and `plan` records atomically; all stable AC IDs, source and exclusions retained.
- Planner compact procedure uses narrow context, no duplicate prose, no extra invented source authority.
- Keep **independent Plan Auditor and mandatory human planning checkpoint** as currently required. Keep full proof, Developer, independent reviewer, PR reviewer and local proposal.
- Derived brief accurately shows exact subjects and audit findings after the audit; no early plan approval HTML.
- Current restarts/resume/abandon behavior preserved; malformed partial multi-output cannot become a half-accepted stage.

Tests: equivalent intent/spec/plan content contracts; mid-output crash/retry; short and long requests; missing product requirement still asks human; second audit only on explicit choice; hostile prompt-injection and HTML escaping; existing v6 journal replay/cross-version refusal.

**Exit:** Verified decrease in Planner dispatch count without a change to the safety floor or a rise in ambiguous requirements silently implemented.

### Milestone E2 — Focused but independent review and minimized handoff

Deliverables:
- Express Reviewer `focused` procedure with required minimum lenses; fresh read-only worker on exact admitted candidate and immutable proof/evidence packet.
- PR review stays **a separate, independently executed role** in the first release. Engine performs candidate/digest/coverage/PR claim consistency mechanically before this semantic review; no duplicated full engineering investigation.
- Handoff references immutable records; no large narrative rewrites, redundant full source copies merely for context, or hidden model confidence transported between reviewers.
- Review verdicts explicitly include coverage and unknowns; no reviewer can repair then self-approve.

Tests: malicious/speculative PR text; code change with changed auth behavior; modified candidate after GREEN; missing acceptance-criterion proof; stale Reviewer/PR packet; reviewer own writes; missing reviewer stage; existing `tests/pr-review.test.ts` safety properties. Host preventive claims remain separate empirical checks.

**Exit:** Identical safety rejection on comparable Standard/Express negative fixtures; reduced review context/latency measured rather than guessed.

### Milestone E3 — Qualified proof routes (separate owner decision)

**Not a prerequisite for E1/E2 unless the pilot explicitly includes nonbehavioral tasks.** Current proof contract is not bypassable with an empty test report.

Deliverables after separate approval:
- Discriminated proof-kind contract (`BEHAVIOR_RED`, `PRESERVATION_OR_CHARACTERIZATION`, `STATIC_NONBEHAVIORAL`, `ALREADY_SATISFIED`), each with independent runner evidence and acceptance rules.
- Exact changed path, risk and subject validation for doc/static routes; no silent zero-tests PASS.
- Engine final gate/proposal/reviews/evals know the kind and disclose exclusions.
- A separate test that correct existing behavior remains unchanged on Standard.

Tests: meaningful intended RED vs compilation RED; preservation verified on base and candidate; static docs requiring no code changes; dependency/config doc misclassified as static; no-op request; falsified test count; runner unavailable. Negative coverage is as important as happy path.

**Exit:** The proof classification represents what was actually observed. No fabricated RED or automatic exemption for a documentation filename.

### Milestone E4 — Scopable audit omission, only by accepted contract revision

**Do not bundle with human-delegation relaxation.** Separate architecture review is required for this milestone.

Deliverables:
- Owner-approved narrowly scoped rule for one or more specific request types.
- Typed applicability evidence with policy/version, scope, approved plan ref, human plan decision ref, and prominent "Plan not independently audited" disclosure.
- End-to-end truthful handling of missing audit in planner authorization, brief, state replay, tester handoff, technical review, PR review, packet builder, proposal and evaluators.
- Hard rule: an audit omission cannot be passed through unchanged strict downstream parsers with a fake PASS object.

Tests: malformed waiver; waiver minted by agent, not trusted controller; scope expansion; changed plan digest; unauthorized PR; escalation to Standard; replay of old v6; reviewer sees unaudited identity and risk.

**Exit:** Reviewer and final gate can distinguish an authorized omission from missing evidence, and reject all unauthorized paths.

### Milestone E5 — Escalation, delegated decisions and lifecycle (separate authorizations)

For escalation: when new impact makes Express ineligible, stop and persist a grounded, immutable trigger and invalidation set; link a new Standard run after reconciling worker liveness, preserving lineage. Do not pretend old unearned Standard decisions exist.

For optional future delegated planning approval: implement only with a demonstrated trusted owner-enrollment/revocation and host identity mechanism, bounds for repositories/request class/expiry, and override; **not** a self-declared JSON field or agent-generated button. Absence of trustworthy identity => human wait.

Tests: late discovery of cross-service effect; changed code/test/policy mid-run; crashed/abandoned worker; revoked/mismatched/stale human delegation; correct lineage and replay; no unauthorized advancement.

**Exit:** No partially classified Express candidate can slip into local proposal with Standard-required evidence missing.

### Milestone E6 — Evaluation and rollout gate

Use a small synthetic, security-aware A/B suite to compare the **same task definitions** on Standard and Express; runs must each have their own immutable subject and quality judgment. Compare failed/incomplete runs, not only successful calls.

Required dimensions:
- safety: L0 false allow, unauthorized writes, missing reviews/authorizations, stale evidence erroneously accepted (**zero tolerated** in the tested suite);
- correctness: AC fulfillment, independent semantic reviewer misses, regressions, baseline proof validity, PR claim accuracy;
- effort: number of model dispatches, input/output tokens when available, context size, wall clock, tool calls, rework and human interventions;
- storage/operations: peak and retained allocated bytes, artifact counts, reconstructibility, timeouts and recovery;
- host reality: OFFLINE versus real VS Code role dispatch and enforcement, effective model identifiers, unknown permissions.

Suggested starter fixture catalog (add more if failures reveal new classes):

| Fixture | Expected route | Main check |
|---|---|---|
| One label/grammar correction with known usage | Conditional Express | True nonbehavioral scope and proof |
| Formatter-only nonsemantic change | Conditional Express | Preservation and actual diff |
| Isolated well-tested bug with explicit ACs | Conditional Express | Genuine RED, GREEN and independent review |
| Missing disabled-response requirement | Standard / human question | Planner must not invent behavior |
| Basic Auth → newer identity migration | Standard | Security and integration implications |
| Add/modify authorization guard | Standard | High impact despite tiny diff |
| Schema migration or Prisma model edit | Standard | Data safety |
| Payment total/calculation adjustment | Standard | Financial correctness |
| Changed CI/deployment secrets | Standard / BLOCK | Infrastructure/security |
| Dependency upgrade with runtime effect | Standard | Operational blast radius |
| Documentation changing on-call operations | Standard | Not all Markdown is safe |
| Developer adds forbidden path after eligibility | Escalate / admission reject | No posthoc safe label |
| Sibling root edit | Reject | Scope integrity |
| Stale Reviewer packet | Reject | Exact-subject freshness |
| Agent fabricates skipped Plan Audit PASS | Reject | Evidence integrity |
| Partial journal/crash after selection | Deterministic resume or BLOCK | Recovery |
| L1 incorrectly claims security change is low risk | Standard | L0 dominance |

Use a separate fresh reviewer/judge on frozen run evidence and a human-adjudicated sample for calibration. Report uncertainty and actual numeric denominators.

**Success criteria before owner permits broader rollout:** no tested invariant violations; no statistically or operationally meaningful increase in defect misses; measurable wall-clock and/or total cost reduction across representative tasks; recoverable runs after failures; reproducible package; actual VS Code host behavior witnessed. Do not invent numerical percentage targets—owner chooses thresholds before comparing results. If savings are unclear, retain Standard and run more controlled experiments.

## 2. Build discipline and review gates

Every milestone requires: baseline SHA, allowed file list, exact claims being changed, test commands/results, negative tests, offline/host labels, changed-package manifest, rollback instruction and an independent review of the diff. Implement one bounded increment at a time. **One agent should not implement the change and then count its self-review as independent acceptance.**

Repository scripts presently provided by [package.json](../../package.json):
- `npm run typecheck`
- `npm test`
- `npm run test:sensitivity`
- `npm run check:scope`
- `npm run generate:package`
- `npm run demo:synthetic`

Run targeted newly created/affected tests during iteration. Before accepting a candidate, run the applicable repository validation suite, scope/sensitivity checks and reproducible package generation; record failures without weakening them. Do not use an "all green" claim when host validation is pending.

## 3. Decision gates and change-control sequence

**D0 — Owner architecture acceptance:** Resolve OD-E1–E8 and freeze chosen MVP scope. Documents alone are not approval.

**D1 — Preflight / trace:** Agent documents exact current behavior and regressions at current commit. If materially different from this packet, propose a narrowly scoped contract amendment; do not bulldoze the implementation.

**D2 — E0/E1 permission:** Owner authorizes concrete files and acceptance. Build, test, independent review, owner accepts/reverts.

**D3 — E2 permission:** Same separate process; compare context/time with controls held constant.

**D4 — Exception design review:** Owner independently decides proof variants, audit omission and delegation; no grouped blanket waiver.

**D5 — Host pilot:** Demonstrate real Copilot dispatch, model capability and authority boundary; keep `COPILOT_VALIDATED: NO` until specifically observed for the new package.

**D6 — Scale decision:** Review A/B outcome; require explicit KEEP/REVERT/INCONCLUSIVE with evidence. Do not declare success on estimated tokens.

## 4. Copy-ready instruction for the implementation agent

~~~text
ROLE: RSTACK-SDLC implementation architect / builder.

TARGET: The standalone rstack-sdlc/ factory within
Lorenchess/copilot-agentic-workflow, not the separate rstack-pipeline/
reference and not the newer proprietary workplace pipeline.

STARTING MATERIAL:
  rstack-sdlc/docs/express-pipeline/README.md
  rstack-sdlc/docs/express-pipeline/01-policy-and-routing.md
  rstack-sdlc/docs/express-pipeline/02-evidence-and-trust.md
  rstack-sdlc/docs/express-pipeline/03-engine-integration-map.md
  rstack-sdlc/docs/express-pipeline/04-implementation-plan-and-agent-handoff.md

Read the current standalone factory contract, source, tests, profile,
package generator, and host-validation record. These files are
PROPOSED guidance, not permission to override currently operative
contracts or skip required phases.

Mission: implement ONE owner-approved Express increment using the
existing RSTACK engine, preserving Standard as the unchanged default.

Hard requirements:
1) One canonical engine-owned workflow/policy. No separate Express
   engine, coordinator state machine, model-controlled permission
   exception, fabricated audit or fabricated RED.
2) L0 deterministic sensitive-scope exclusions are authoritative;
   conditional L1/L2 may investigate ambiguity but cannot override
   a protected deny or missing identity.
3) Freeze requested/effective profile, workflow/policy IDs, source,
   eligibility, proof and candidate identities. Resume/replay must
   reject mismatched old/new definitions.
4) Preserve separate responsibilities for Tester, Developer,
   independent read-only technical Reviewer, independent PR Reviewer
   and real human authorization. In the first Express pilot, keep
   independent plan audit and the human planning checkpoint.
5) Agent write boundaries and submitted candidate differences must
   be checked against trusted repository/sibling-root state. Label
   PREVENTED vs REJECTED_AT_GATE vs UNVERIFIED honestly.
6) Require independent exact-candidate verification and current
   evidence before a local PR proposal. No real external publication.
7) Keep existing Standard v6 history, tests, profiles and
   generated packages compatible. Don't mix offline evidence with
   live VS Code/Copilot host proof.
8) No Jira, Bitbucket, real bank code, real PR creation, deployment,
   AWS dependencies, or storage migration.
9) Only modify rstack-sdlc/** in an approved implementation batch.
   Do not change root host settings, unrelated dirty work or legacy
   pipeline. No additional worktrees/clones without authorization.
10) Measure actual end-to-end results including failed attempts.

Execution:
A. Perform a read-only implementation trace first. Produce an exact
   touched-file plan, current gate assumptions, policy/contract gaps,
   negative test plan, rollback, and the owner decisions needed.
B. If the owner has approved E0, implement E0 only; if E0 is already
   accepted and E1 is explicitly authorized, implement E1 only.
C. Write the failing safety/behavior tests before or alongside the
   minimal functional change. Run affected tests and then all
   applicable package checks. Do not repair unrelated failures.
D. Produce a bounded handoff with changed files, diff summary,
   subject digests, evidence class, required future checks, and a
   recommendation KEEP / REVERT / INCONCLUSIVE.
E. Stop for independent review and the next owner decision.

If owner approval is missing, stop after A. If you discover a
contradiction with the current engine contract, state it as
CONFIRMED (measured), INFERRED (reasoned), or UNVERIFIED, and
propose a narrow policy/contract change before implementing.
~~~

## 5. Definition of done for Express as a product

Express is ready for actual work only when an authorized class of request can be routed through the existing engine with truthful phase applicability, fully retained evidence, independent tested candidate/review, compatibility with Standard, reliable interruption/recovery, an inspectable local PR proposal, a measured advantage, and separately observed target-host behavior. A design document or a model claim of completion does not satisfy any of these.

**Immediate recommended next action:** owner accepts a deliberately narrow E0/E1 pilot and leaves plan-audit bypass, delegated approval, alternate proof kinds, and storage changes for later evidence-backed design gates.
