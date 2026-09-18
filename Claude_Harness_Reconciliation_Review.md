# Claude harness proposal — reconciliation review

**Review recommendation:** revise the proposal before implementation approval.

**Repository checked:** `Lorenchess/copilot-agentic-workflow`, `main` at `77940936e7c1b8cd55b1ae29701c6f2b3d6dc85e`.

**Proposal reviewed:** `2026-09-13-harness-engineering-alignment-proposal.md`, supplied by the owner, marked DRAFT / UNTRACKED / NOT APPROVED.

**Boundary:** source review and design recommendations only. No repository edits, execution tests, corporate operations, model changes, new phase, implementation dispatch, commits, or publication are authorized by this review. This downloaded review is not a modification to the repository.

## 1. Reconciled direction

Use Claude's proposal as the scope-correct starting point. Preserve Copilot-native configuration and documentation, existing agent ownership, G3/G4 authority, budgets, verdict semantics, and the reference/corporate boundary. Do not introduce a runner wrapper, scripts, hooks, schemas, services, or a policy engine under the current scope.

The earlier ChatGPT recommendation to implement a wrapped test operation is withdrawn as the next deliverable for this repository. It described an executable-harness direction, whereas this proposal explicitly restricts the repository to declarative Copilot assets. That scope distinction must not be erased by either analysis.

At the same time, declarative coverage is not equivalent to demonstrated enforcement, durable recovery, or measured quality. The fact that stronger machinery is out of scope does not mean the corresponding guarantees have been established.

The article's most useful application here is to link observed failures to a small, reviewed improvement process while keeping operational routing and permissions unchanged.

## 2. Correct the architecture verdict

### 2.1 Distinguish three levels of evidence

For each layer, record separately:

- **Specified:** the rule or procedure exists in the reference.
- **Enforced:** a verified host mechanism constrains the relevant action.
- **Demonstrated:** an observed representative run supports the claimed behavior.

This can be three columns in the existing mapping, not a new runtime or schema.

Contract, context selection, and evidence review are extensively specified. Tool grants provide one control mechanism, but role-, mode-, command-, and path-specific prose is not a complete enforced gateway. Durable snapshots, export, and restore remain explicitly unverified in the corporate adoption record.

Replace broad claims that four layers exceed the article's bar with a qualified statement about the detailed policy coverage. No benchmark compares the article's illustrative design and the actual workflow.

### 2.2 Narrow the layer-six gap

The audit guide already specifies paired trials, retained failures, human promotion/rollback, and policy improvement. The missing piece is a consistent, evidenced link from a run incident to a proposed lesson and its validation/promotion record—not the absence of improvement guidance altogether.

### 2.3 Treat runner autonomy as conditional fit, not a fundamental disagreement

The article's automatic workspace tier assumes isolation and checks. The reference explicitly states that repository-controlled runner code is not sandboxed by the reference. Keeping Manual approvals is consistent with that incomplete evidence. There is no need to characterize this as a principle-level conflict.

## 3. H1 — Non-blocking lesson-candidate classification

**Disposition: revise substantially; do not require a diagnosis at every STOP.**

The useful idea is to distinguish why the current run stopped from what, if anything, should improve future runs. Those are separate questions.

Preserve the current operational category and route. Add only an optional lesson assessment, without allowing it to alter the STOP, verdict, retry allowance, or approval.

A normal `RUN_EXISTS` stop can mean the workflow is operating correctly. A blocked controlled-path edit may show a guardrail doing its job. Conversely, a genuine environment outage can still suggest a better preflight or diagnostic. `GENUINE` should therefore not mean that nothing in the harness could ever improve.

Recommended adjustments:

1. Permit an unassessed or unknown diagnosis. Never force one of the four illustrative article categories when evidence is insufficient, including state/recovery incidents that do not fit them.
2. Treat agent classifications as hypotheses with provenance. A human's confirmation is a decision or assessment, not tool-produced proof of root cause.
3. Capture candidates without an extra mandatory confirmation round at every stop. Confirm diagnosis in the existing incident discussion when useful, or between runs.
4. Entry stops before a run exists must not create an artifact solely to store this field.
5. Keep the existing routing category distinct from the lesson candidate. A disputed block is not automatically a proven false block.
6. Do not predetermine that an envelope misclassification must be WEAK_VERIFICATION and fixed only by a test. Inspect its actual origin first.
7. Select improvement work by impact, risk, human burden, evidence, and recurrence—not frequency alone.

A candidate annotation can remain in an existing allowed record. No new agent, STOP, gate, or permission is needed.

**Validation:** a correct normal STOP needs no harness defect classification; an unresolved diagnosis stays unresolved; a late diagnosis does not change an earlier authorization; missing classification does not prevent correct recovery.

## 4. H2 — Separate the reference lessons record from private operational evidence

**Disposition: accept the record concept with privacy and validation corrections.**

A human-maintained ledger is useful. Its location determines what it may contain.

### Reference ledger

`docs/HARNESS-LEDGER.md` may contain the reference's own design-review lessons and separately approved, deidentified general lessons. Do not copy corporate run IDs, private trace/archive links, repository/branch names, source paths, ticket identifiers, or incident metadata into it merely because raw log text has been omitted.

### Corporate operational record

Actual run-linked lesson records and evidence references belong in the already approved private corporate store, under its access, retention, and export policies. Use the existing system; this review proposes no additional service.

The current audit guide explicitly treats correlation identifiers and other metadata as potentially sensitive. The fact that the reference repository itself is private does not make it an approved corporate evidence destination.

### Promotion evidence

A commit touching a named target proves that a file changed. It does not prove that the intended defect was corrected or that behavior improved.

For each promoted lesson, preserve the source, change/version, owner decision, and validation status. Distinguish a reviewed document scenario from an executed regression test and from a measured corporate outcome.

N1–N3 must retain their actual accepted-debt/open status unless an independently checked later change closed them. Do not mark a lesson fixed merely because a ledger row exists. Historical records must not invent runtime observations or developer confirmations.

**Validation:** no unapproved corporate metadata in the reference; an entry marked promoted has an actual authorized change and honestly qualified validation; documentation-only promotion is not represented as runtime success.

## 5. H3 — A derived human-readable run summary

**Disposition: accept with narrow semantics; measure benefit rather than claiming it.**

The proposed top-of-RUN summary can improve human orientation. It does not itself improve storage durability or remove the existing mandatory resume checks.

Keep these requirements:

- Basis-bearing and explicitly derived; the current artifacts and resume rules win on disagreement.
- Missing summary on an older run is valid and does not block recovery.
- No additional per-role or per-mode input access follows from the summary.
- Keep the summary useful to a person: one short explanation beside relevant IDs, rather than an opaque list of IDs alone.
- Label a compact risk list honestly. PLAN accepted risks and verification disclosures are not necessarily all unresolved decisions, evidence gaps, or unknown external effects.
- A state update and the summary should remain consistent, but do not claim atomic persistence merely because the agent is told to perform one edit.

Recompute it at relevant state/decision transitions without using it to skip source validation. Do not describe it as a demonstrated token or latency optimization: those benefits have not been measured.

**Validation:** stale summary versus superseded TEST-REVIEW resumes correctly; an absent summary works; a PUBLISH_ONLY terminal run is not misclassified because PR.md is absent; the summary never authorizes a stage.

## 6. H4 — Common observation vocabulary, not one universal verdict

**Disposition: defer operative normalization; first require a field-preservation mapping.**

The three execution records are related but are not interchangeable.

- A WITNESS assertion failure can be the intended evidence for a successful RED stage.
- A diagnostic compile may discover no test identities, correctly.
- A reserved execution has no outcome yet. The proposed enum omits the existing pending reservation that prevents retry-budget resets.
- HEAD identifies the committed state, not the uncommitted changes being exercised by a construction or diagnostic run.
- `retryable` is not authorization to retry. The role, current state, remaining allowance, and relevant human decision still govern the next action.

Keep any common fields strictly about observed execution and its basis. Retain role-specific proof semantics, including T6's assertion locus, arranged Given, same-run PRESERVATION, discovery, and reproduction requirements; IQ3's reservations and accounting; and Verifier's independent preflight and committed-state brackets.

Allow N/A, unavailable, and unknown where appropriate; do not force invented identities, hashes, timestamps, or results into a universal shape.

Do not solve duplication by making Tester load all of implementation-quality, or Developer load the test-review method. A shared reference must be limited to neutral record definitions and must preserve the explicit role/mode context boundaries.

First produce a mapping in the revised proposal showing every current field, its owner, source, and retained meaning. Only an evidenced reporting inconsistency should justify an operative refactor.

**Validation:** legitimate RED remains RED evidence rather than pipeline failure; pending reservations survive; diagnostics need not claim test execution; dirty checkout evidence is not represented as a verified commit; normalization loses no required proof field.

## 7. H5 — Autonomy ladder with necessary, not sufficient, prerequisites

**Disposition: accept the documentation; revise the promotion condition.**

Do not change `.vscode/settings.json` or relax runner approval.

CA-17 inspects Git endpoints, configuration, hooks, and publication side effects. CA-18 launches the runner under Manual approval and records environment behavior. Passing them would not establish that unattended execution is safe, that every route is contained, or that a repository script cannot exercise unapproved credentials or I/O.

The ladder should say that relevant CA evidence permits consideration of a separate owner-reviewed policy change; it never promotes permissions automatically.

Before any such future change, the corporate owner would need evidence about the actual granted tools and approval behavior, the bounded commands and targets, repository-controlled scripts and hooks, available resources/credentials, relevant denial or bypass cases, and what changes invalidate the evidence. Extend the relevant existing validation rows where needed rather than treating an old PASS as permanent authorization.

Also distinguish intended controls from host-validated controls in the ladder. Other rows are not automatically proven merely because only runner autonomy is proposed for future discussion.

**Validation:** CA-17/18 PASS alone changes no permissions; G3 cannot authorize publishing; no wildcard or merge/deploy/delete capability is added; changed evidence requires renewed review.

## 8. H6 — Timeout is an observation; its cause must be established

**Disposition: reject the blanket environment classification as written; replace with an explicitly reviewed clarification.**

The proposed sentence classifies absence of a terminal result within a configured timeout as an environment condition. This can misclassify a production hang, a blocked test fixture, or an exceeded business deadline.

The existing T7 already distinguishes an infrastructure timeout from a legitimate assertion about a required bounded-time outcome.

Preserve these cases:

| Observed situation | Required interpretation |
|---|---|
| A test's own assertion shows an approved timing requirement was violated | Actual test evidence; apply the existing WITNESS or regression/verification rules. It is not automatically RUNNER_UNAVAILABLE. |
| Host execution/observation ends without a valid terminal result | Execution evidence is unavailable or unknown; root cause and process completion are not assumed. No PASS. |
| Evidence establishes unavailable infrastructure or tooling prevented meaningful execution | Existing environment route applies. |
| Evidence points to changed production code as the cause of noncompletion | Preserve it for diagnosis; do not hide the suspected implementation defect behind an unsupported environment label. |

Record a timeout value only when observed; do not invent a universal value. No valid result does not prove a child process ended. Do not start overlapping work or blindly rerun an operation with an unknown outcome. Preserve existing reservations and budgets.

This is behavioral policy, not merely documentation. It changes how agents may classify and route a run. It must not be slipped into a batch described as having no procedural effect, and frozen historical A6 specifications must not be edited.

**Validation:** requirement timeout versus host timeout; process still active versus confirmed ended; missing timeout metadata; environment failure versus implementation-caused hang; no budget renewal or duplicate execution.

## 9. Revised sequencing

### First: revise the proposal only

Correct the coverage claims; narrow the layer-six gap; incorporate the H1/H2/H4/H5/H6 qualifications; state how implementation scope and historical authority will be preserved. Reconcile the two analyses by evidence, not by counting agreements.

### Small documentation refinement, after owner approval

Use corrected H2 and H5 plus the qualified layer mapping. Keep all settings, tools, verdicts, loops, and runtime procedures unchanged. Do not include H6 as currently drafted.

### Separate behavioral refinement, only if approved

Consider optional H1 and bounded H3 with explicit compatibility checks. Review timeout semantics separately or clearly within this behavioral contract. Keep the exact changes small and independently reviewed.

### H4 later

Defer operative execution-record normalization until the mapping identifies an actual ambiguity or repeated defect that warrants it.

Use new fictional scenario fixtures or clearly identified forward examples for the new behavior. Do not retrospectively insert new human decisions or runtime observations into historical example records. Preserve locked tags and historical specs/proposals/reviews; no amendment of frozen policy sources by stealth.

## 10. Recommended answers to D1–D5

These are recommendations for the owner, not recorded approvals.

| Decision | Recommended answer |
|---|---|
| D1 — H1 and H2 | Accept the lesson-record concept. Make diagnosis non-blocking and uncertainty-aware. Separate reference design lessons from private corporate run records. |
| D2 — H3 | Accept a short, derived, basis-bearing summary with unchanged resume authority and backwards compatibility. |
| D3 — H4 | Defer implementation. Request a no-loss field mapping and a demonstrated reason first. |
| D4 — H5 | Accept documentation only. CA evidence is necessary input to a later decision, never automatic permission promotion. |
| D5 — Sequence | Revise first; then an owner-approved H2/H5 documentation batch. H1/H3 and timeout-routing changes require explicit behavioral scope. Do not open the whole H-C1..C3 sequence automatically. |

## 11. Evaluation and promotion standard

Use accepted correct outputs per human review minute as one view, not the sole gate. Include all initiated trials and repair attempts, and separately report active clarification/recovery effort, material rework, false blocks, eligibility, control violations, and unknown measurements.

A correctly blocked unsafe request is not an unsuccessful harness. A real failure is not automatically a harness defect. A reviewed document change is not proof that future runs improve. Promotion requires appropriate evidence and explicit owner approval.

## 12. Source references

### User-supplied sources

- **P:** `2026-09-13-harness-engineering-alignment-proposal.md`, lines 3–7 (status/scope); 11–22 (verdict/mapping); 35–41 (autonomy and scope); 47–83 (H1–H6); 93–111 (sequencing/decisions); 115–136 (claims and reconciliation).
- **A:** supplied article Markdown, lines 155–215 (gateway and observations), 217–269 (state), 271–316 (evidence), 318–376 (trace/repair), 378–433 (permissions), 469–509 (incremental build), 527–541 (metric).

### Repository sources, all at the reviewed SHA

- `.github/pipeline/GUARDRAILS.md`: Trust boundaries, Git safety, Host-environment assumptions.
- `.github/skills/test-contract/SKILL.md`: T6 and T7; RED proof and time-based assertions.
- `.github/skills/implementation-quality/SKILL.md`: IQ3 and IQ4; reservation continuity, diagnostic evidence, routing.
- `.github/agents/pipeline.agent.md`: entry, context restrictions, current-basis approval and resume rules.
- `.github/agents/tester.agent.md`: activation-mode restrictions and role-specific proof.
- `.github/agents/verifier.agent.md`: preflight, execution evidence, independent checks and verdicts.
- `docs/CORPORATE-ADOPTION.md`: CA-17/18 and CA-21/22, including their NOT VERIFIED status.
- `docs/RUN-AUDIT-AND-IMPROVEMENT.md`: private evidence, exact-byte snapshots, paired trials, promotion/rollback and validation limits.
- `docs/reviews/2026-09-11-reference-efficiency-and-audit-review.md`: accepted forward improvements and remaining limitations.

No finding in this review asserts an observed corporate failure, a measured saving, or a defect in a corporate integration whose implementation was unavailable.
