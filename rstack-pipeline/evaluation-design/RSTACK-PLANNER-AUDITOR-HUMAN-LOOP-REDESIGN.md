# RSTACK Planner–Auditor–Human Loop: Problem and Redesign Assignment

**Prepared:** 2026-09-27. **Status:** Owner-requested workflow change for analysis; proposed interfaces, not an implemented or validated control.

**Repository basis inspected:** `37d33d0bc8cc1db57cf1e562fadee21d2238a6bf`. The active refactoring reference is `rstack-pipeline/claude-v2.2/`; workplace behavior must be checked against its actual installed sources. [R1]

**Goal:** Give the human a brief, balanced plan-and-audit HTML view after the first audit, let that human decide whether a second audit round is worthwhile, and prevent repeated narrative artifacts from becoming the agents’ communication protocol.

## Start here — instructions to Claude Code

Investigate this specific planning loop, not the whole factory. Read this brief, inspect the current owners listed in section 2, and examine approved example runs when available. Separate the owner’s requested behavior from the existing contract and from your recommendations.

First produce **one concise change review** containing the proposed transitions, minimal record shapes, affected consumers, compatibility risks, acceptance tests, and smallest implementation slice. Do not create another six-document package. Do not change runtime agents, parsers, settings, models, effort levels, or submitted evidence during this first pass. After explicit implementation approval, modify the existing canonical owners together rather than adding a competing workflow.

The desired human-controlled sequence is a requirement. JSON, filenames, field names, rendering mechanics, and the migration approach below are proposals to evaluate. Do not claim a token saving without measurement, or claim an installed capability from a reference file.

## 1. Problem observed and the boundaries of that evidence

The owner reports that the current Planner–Auditor process allows two automatic iterations before escalating disagreement. The human-facing HTML plan is produced before the Auditor’s analysis, so the human initially sees the Planner’s position without the independent challenge. The owner wants to decide whether another round is necessary **after seeing the first audit**, not after the agents have already repeated it.

The supplied screenshots show current and archived audit briefs, audits, audit responses, Markdown briefs, HTML briefs, and revision-approval documents. The displayed plan begins with extensive reconciliation and decision history; its heading identifies a later planning attempt. This illustrates why the current plan can be difficult to distinguish from the history of arguments about it.

Screenshots do not establish complete file contents, which bytes agents actually read, the true iteration counter, token usage, or billing. Multiple archived filenames alone do not prove a loop limit was violated. The previously reported approximately 80/20 documentation-to-engineering proportion is a hypothesis to measure, not a verified token or cost ratio.

The suspected costs are repeated generation and consumption of the same requirements, repeated retelling of audit history, premature human-brief generation, and unnecessary autonomous rounds. Necessary independent reads and durable evidence must not be classified as waste merely because they repeat information.

**Do not publish the workplace screenshots, ticket identifiers, internal paths, repository details, or original run content with this brief.** The examples below are synthetic.

## 2. Existing contracts that conflict with the requested flow

At the inspected reference revision:

| Existing owner | What the source currently says | Required redesign question |
|---|---|---|
| `pipeline/SKILL.md` — Routing | An audit of `holds` routes directly to Tester; `holds-with-conditions` or `refuted` routes to Planner revision and another audit. | Insert a human checkpoint after every completed round, including `holds`; no automatic second round. [R2] |
| Planner — Revision turn | Revise the plan, respond to findings, then return every changed plan to a fresh audit. | Permit a human-directed finalization path without a further audit, while preserving its real audit coverage. [R3] |
| Orchestrator — Dispatch and results | Every plan revision returns to a new audit; the driver transports results and compares identities, not engineering opinions. | Route on an explicit human decision; do not make the driver adjudicate the disagreement. [R4] |
| Plan Auditor — Inputs and Return | Bind the audit to the actual plan digest; reject contamination; preserve a completed verdict separately from `STOPPED`. | Keep identity and independence while reducing narrative and supporting at most two completed rounds in this cycle. [R5] |
| Tester — Inputs and lane | A missing audit or an audit other than `holds` blocks state 2. | Define a distinct, explicit human-authorized planning basis; otherwise the requested no-second-round path deadlocks. [R6] |
| Pipeline — Eligibility | `REVIEW_ELIGIBLE` requires a current `holds` audit matching both the plan and candidate record. | Reconcile this downstream requirement too; changing only entry to Tester leaves a later deadlock. [R2] |
| `handoff-contracts.md` | Markdown result shapes, per-round finding IDs, archived results, and parser compatibility are prescribed. | Inspect actual producers/readers before changing formats; preserve historical evidence and attribution. [R7] |

The exact workplace two-iteration rule and HTML-generation timing are **owner-reported**, not established by these reference excerpts. Locate their real implementation and configuration before changing them.

This is not just a presentation adjustment. Allowing a human-finalized plan to proceed without another audit changes the planning authorization policy. Describe that tradeoff openly. It must not be implemented by relabeling a refutation as `holds` or weakening unrelated test/release controls.

## 3. Requested sequence — one round by default, two only by human choice

For this brief, one **audit round** means an independent completed audit of one exact plan snapshot. Planner edits, transport failures, and final human amendment application are not additional completed audits; record those separately.

```text
Planner prepares plan P1
        ↓
Auditor independently examines P1 → A1
        ↓
Render HTML brief #1 from P1 + A1
        ↓
HUMAN CHECKPOINT 1 — always, even when A1 agrees
        ├─ Proceed unchanged → finalize the selected P1
        ├─ Proceed with exact amendments, no second audit
        │       → Planner applies only the approved amendments → finalize Pf
        ├─ Request second round
        │       → Planner evaluates A1, records concise agreement/disagreement,
        │         updates P2 → fresh Auditor examines P2 → A2
        │       → Render HTML brief #2 from P2 + A2 + concise change summary
        │       → HUMAN CHECKPOINT 2 — final decision in this cycle
        │               ├─ Proceed unchanged or with exact amendments → finalize Pf
        │               └─ Pause / reject / cancel
        └─ Pause / reject / cancel

Finalization verifies the approved plan/changes and the Tester handoff basis.
        ↓
Tester receives the final plan, requirement/proof references,
human decision, retained audit result, and any residual obligations.
```

No automatic third audit and no automatic Tester dispatch after round 2. Failure to reach agreement is a valid outcome to put before the human, not a reason to continue indefinitely. A later explicitly authorized new planning cycle must remain linked to this one; do not reset counters merely to evade the limit.

A clean audit does not remove the human checkpoint. A human requesting round 2 authorizes that review round, not implementation or publication.

Necessary requirement clarification may still occur before planning/auditing. The timing change concerns the **plan approval HTML**, not a prohibition on asking an indispensable repository or requirement question earlier.

## 4. Human decisions must identify an action, not merely say “no”

The HTML should make these choices explicit:

| Choice | Effect |
|---|---|
| Proceed unchanged | Select this exact plan, with a disposition for every material unresolved finding. |
| Proceed with amendments; do not re-audit | Select this plan plus specified amendments; Planner applies them and exposes the resulting changes. |
| Request another Planner–Auditor round | Available after round 1 only; specify the findings/questions that merit another round. |
| Pause / reject / cancel | Do not dispatch Tester. Preserve the evidence and state. |

“No second iteration” is not automatically “the plan is approved.” If the same reply clearly says to proceed and supplies sufficient feedback, do not ask again unnecessarily. Clarify only genuinely missing intent, amendment detail, or authority.

After round 2, the human makes the final decision for this planning cycle. If an essential question is still unresolved, the correct result is a paused run, not an invented acceptance criterion or automatic extra audit.

Record the exact human reply through the approved host channel. Bind it to the plan, audit, displayed brief, selected findings, and approved amendment set. A typed name or local JSON file is a record, not authenticated authority. Use the adopted human-decision mechanism rather than inventing a new authorization service.

## 5. Preserve three separate truths

1. **Audit result:** what the Auditor concluded about the snapshot it actually inspected.
2. **Human planning decision:** what the human authorized, including accepted residual disagreements or amendments.
3. **Verification result:** what Tester later established through actual checks.

Human acceptance does not make a factual contradiction true. Planner accepting a finding does not independently prove it fixed. Tester receiving a plan does not mean its requirements are satisfied.

### The important case: human amendments after the final audit

Suppose A1 audited P1, and the human requests a change producing Pf. A1 remains an audit of P1. It is not silently promoted into an audit of Pf.

The final handoff must distinguish, using adopted field names:

- the exact final plan reference and digest;
- the last audited plan and its unchanged audit verdict;
- whether the final plan is the same audited snapshot or was amended afterward;
- the human decision and authorized amendment set;
- unresolved findings, accepted residual risks, and required proof obligations.

Propose separate planning bases such as **human-approved audited plan** and **human-approved amended plan without re-audit**. These are proposed authorization classifications, not new audit verdicts or test outcomes. Both need the human checkpoint. The latter explicitly discloses that the final amendments did not receive an independent plan audit.

A precise human-approved change set may be applied without demanding another approval of identical intent. Check that the resulting diff is limited to that change set. Mechanical checks can establish structural changes; they cannot prove an ambiguous natural-language instruction was interpreted correctly. Any additional material change, conflicting interpretation, or stale source requires clarification, not silent advancement.

Tester may start only when the selected plan is actionable, required human decisions are explicit, scope is valid, and the proof obligations are coherent. A missing audit, malformed identity, known authorization violation, or untestable required criterion must not be converted into an approval. An audit of `undetermined` goes to the human with its missing evidence; a decision alone cannot supply that evidence. Classify any residual uncertainty under the adopted policy or pause.

Once tests, candidate verification, or final review are bound to a plan, later plan changes still invalidate the affected evidence. This planning shortcut must not become a shortcut around test locks, required verification, independent final code review, or publication authorization.

## 6. Communication format — structure the information, not another essay

**Recommendation to evaluate:** compact structured records, stable IDs, source references, and changes limited to the affected items. HTML is a derived human view, not an additional source of truth.

JSON is still text. Its advantage here is predictable fields and machine validation, not a promise that converting Markdown to JSON saves tokens. RFC 8259 defines the format; JSON Schema can constrain object fields and required properties. Neither establishes that the content is correct. [S1, S2]

| Option | Use in this redesign |
|---|---|
| Lean existing Markdown with stable sections/tables | Lowest-migration alternative if existing parsers require Markdown; remove repetition and change routing first. |
| Compact JSON | Preferred candidate for plan/audit/decision records if actual consumers can support it. Keep short natural-language statements where meaning requires them. |
| YAML | Consider only if it already fits the installed tooling; do not introduce a second parallel representation merely for appearance. |
| JSONL | Candidate for append-only decision/result events if an existing event log does not already cover them; not one giant record every agent reads. |
| Binary, opaque codes, bespoke model language | Do not introduce in this first change. No measured benefit has been demonstrated for this workflow. |

Do not force JSON into every artifact. Keep parser-owned `ac.tsv` and raw proof formats unless a separately reviewed migration is needed. Do not maintain independently authored full JSON and full Markdown plans. Choose one canonical representation; derive any required compatibility view mechanically.

Use readable field names. Requirements, claims, checks, and findings still need enough natural language to express their meaning. Replacing them with unexplained IDs simply moves the missing context elsewhere.

A path-only handoff helps only if the receiver can resolve and read that exact artifact. On an isolated host without file access, supply the minimal required content explicitly and record what was sent. On-demand retrieval is useful context-management guidance, not a guarantee of fewer reads or lower cost. [S3]

## 7. Minimal records and ownership

These are logical records; reuse existing storage and IDs rather than creating a file for every row.

| Record | Content | Owner / consumer |
|---|---|---|
| Plan snapshot | Scope, requirement references, ordered units, claims/evidence, proof strategy, assumptions, questions; no running debate history. | Planner / Auditor, Tester, renderer |
| Audit result | Audited identity, verdict, coverage, evidence-backed findings and limitations. | Auditor; persisted unchanged by host/driver |
| Revision delta | Finding disposition, affected item IDs, concise evidence, changed fields; no copied full plan. | Planner / renderer; retained for post-run evaluation |
| Human decision | Displayed subject tuple, action, per-finding dispositions, amendments, actual response reference. | Human decides; driver records without adjudicating |
| Final selection | Exact final plan, last audit, decision, coverage distinction, residual obligations. | Driver compares; Tester validates entry conditions |
| HTML brief | Derived presentation of the above, tied to their identities. | Renderer / human only |

Prefer a small existing renderer/template to another LLM summarization call. If a model is necessary to explain the result for a human, its text must be traceable to the plan/audit fields and must not invent agreement or hide blocking findings.

The Orchestrator remains a dispatcher. It must not write a rebuttal, decide that a finding is invalid, or soften an Auditor’s words. Do not add a new “debate agent.”

### Storage proposal, not a required migration

```text
.rstack/runs/<existing-run>/
  meta/                         existing ticket snapshot and human decisions
  plan/
    rounds/1/                   exact compact plan + audit, once
    rounds/2/                   only when the human requests round 2
    final/                      only if final human amendments change the plan
    final-selection.json        or equivalent existing state/decision record
    plan-brief.html             current derived human view
  ac.tsv                        existing canonical proof mapping
  logs/                         existing run/invocation log; no duplicate chronology
  evaluation/                   independent post-run evaluator only
```

Store each needed snapshot once. Unchanged selections point to existing snapshots. Full compact snapshots are an acceptable simple starting point; do not build content-addressed storage or a long replay chain merely to save small files.

Where possible, Planner produces only the changed items and a validated edit mechanism materializes the updated plan snapshot. Audit consumers receive the complete selected compact plan, not a delta lacking necessary scope. The cost of independent examination is intentional.

Retain original completed audit replies and the evidence each relies on. Do not delete past rounds to make a run appear efficient. A current pointer may change; a historical audit must still resolve to the bytes it judged. Hashes check identity, not factual truth or human authorization.

## 8. Synthetic examples — explanatory, not installed schemas

All example IDs, paths, and digest strings below are placeholders. A production validator must reject placeholder identities. Paths in these examples resolve from one declared run root; repository evidence resolves from a separately declared source snapshot. No implicit switching of path roots is allowed.

### A. Planner’s compact source of truth

```json
{
  "schema_version": "example-1",
  "run_id": "SYN-001",
  "revision": 1,
  "requirements_ref": "meta/ticket.md",
  "source_snapshot_ref": "meta/source-basis.json",
  "goal": "Gate report export without changing authentication.",
  "ac_refs": ["AC-1", "AC-2"],
  "units": [
    {"id": "U1", "change": "Add the feature check before export execution.", "ac_refs": ["AC-1", "AC-2"]}
  ],
  "claims": [
    {"id": "C1", "statement": "Authentication already guards this route.", "evidence_refs": ["E1"]},
    {"id": "C2", "statement": "An absent feature property enables export.", "evidence_refs": ["E2"]}
  ],
  "proof_strategy": [
    {"ac_ref": "AC-1", "check": "Disabled export returns the specified error and performs no export."},
    {"ac_ref": "AC-2", "check": "Enabled export preserves existing authentication behavior."}
  ],
  "open_questions": []
}
```

The full requirement wording and primary code evidence are referenced, not copied into every subsequent reply. Before audit, evidence IDs must resolve to actual retained sources and the source snapshot must identify the real code and relevant uncommitted inputs.

### B. Dispatch is a short reference envelope, not the full plan again

```json
{
  "task": "audit_plan",
  "run_id": "SYN-001",
  "audit_round": 1,
  "plan_ref": "plan/rounds/1/plan.json",
  "plan_sha256": "<measured-plan-digest>",
  "requirements_ref": "meta/ticket.md",
  "source_snapshot_ref": "meta/source-basis.json"
}
```

Auditor opens the referenced plan and primary evidence, checks omitted concerns as well as listed claims, and verifies the input identity. Do not send Planner confidence, persuasion, or a directive to agree.

### C. Auditor returns coverage plus actual findings

```json
{
  "run_id": "SYN-001",
  "audit_round": 1,
  "plan_sha256": "<measured-plan-digest>",
  "verdict": "refuted",
  "coverage": {"claim_ids_checked": ["C1", "C2"], "held_claim_ids": ["C1"], "limitations": []},
  "findings": [
    {
      "id": "R1-F1",
      "claim_ref": "C2",
      "label": "CONTRADICTED",
      "issue": "The declared configuration default disables export.",
      "evidence_refs": ["E3"],
      "consequence": "The absent-property behavior and its test need correction."
    }
  ]
}
```

This is shorter than retelling the ticket and plan. It still requires the adopted audit lenses, conjunction/omission check, evidence anchors, limitations, and tested-claim coverage. The compact example is not permission to drop any of them. A finding’s `consequence` supports the human view; it is not permission for the Auditor to edit the plan.

### D. Human declines a second audit and authorizes a specific amendment

```json
{
  "decision_id": "H1",
  "run_id": "SYN-001",
  "checkpoint": 1,
  "shown_plan_sha256": "<P1-digest>",
  "shown_audit_sha256": "<A1-digest>",
  "action": "PROCEED_WITH_AMENDMENTS",
  "request_second_audit": false,
  "finding_dispositions": [{"finding_id": "R1-F1", "decision": "ACCEPT_CORRECTION"}],
  "amendments": [{"target_id": "C2", "instruction": "Treat an absent feature property as disabled and cover that case in the proof strategy."}],
  "human_response_ref": "<actual-approved-channel-response>",
  "provenance": "HUMAN_RECORDED"
}
```

Planner applies the amendment; the final record references P1, A1, H1, and the actual Pf digest. A1 stays `refuted`; the final plan is human-amended without re-audit. Tester sees the absent-property obligation and evaluates it. Neither the human decision nor the Planner’s edit proves the test passed.

### E. Human instead requests round 2

Planner records one disposition per relevant finding: agree and revise, disagree with counterevidence, or ask for a human decision. For example:

```json
{
  "from_plan_sha256": "<P1-digest>",
  "to_plan_sha256": "<P2-digest>",
  "dispositions": [
    {"finding_id": "R1-F1", "stance": "AGREE_REVISE", "changed_ids": ["C2"], "evidence_refs": ["E3"]}
  ]
}
```

Disagreement requires evidence and a concise consequence, not a counter-essay. If Planner disagrees and changes nothing, record that honestly; do not increment a content revision merely to appear responsive.

Keep audit-round IDs distinct from plan revisions. Use qualified finding IDs such as `R1-F1` and `R2-F1`, or the existing `(round, finding_id)` pair. Do not confuse a later F1 with an earlier F1. Relationship links between findings must not imply they are the same issue without support.

For round 2, preserve the current fresh-audit principle: dispatch P2, requirement/source evidence, and necessary neutral scope information. Retain the Planner’s disagreement record for the human view and post-run evaluator; do not inject persuasive rebuttals, the first verdict, or the human’s preferred outcome into the fresh Auditor. A selective delta-review mode is a separate independence/coverage change, not the default optimization.

A2 may agree or disagree. Either outcome generates HTML brief #2 and waits for the final human decision. A unchanged plan receiving a second opinion is still round 2; it does not reset the cycle.

## 9. The HTML brief — decision surface, not another narrative artifact

Generate the approval brief only after an audit result is available. Prefer one reusable template and one current human-facing path, with exact source identities and the template version recorded. Preserve either the shown rendered bytes or enough immutable input/template material to reconstruct each decision view under the adopted retention policy; do not require both by habit.

A suitable compact layout is:

| Area | Required content |
|---|---|
| Header | Ticket/run alias, round 1 or 2, plan revision, audit coverage, awaiting-human status. |
| Proposed plan | Goal, in/out scope, ordered units, requirement/check references. |
| Auditor’s assessment | Unchanged verdict, every material finding, affected item, evidence link, consequence, and coverage limits. |
| Planner’s position | Original proposed approach in round 1; concise finding dispositions and changes in round 2. Do not invent a first-round rebuttal before the human requests one. |
| Decision controls/instructions | Proceed unchanged, proceed with specific amendments, request round 2 where allowed, or pause/reject. |
| Traceability details | Exact plan/audit/decision identifiers and expandable evidence links, without flooding the main view. |

Synthetic human view:

```text
Plan + audit — Round 1 — Awaiting your decision
Plan: Feature-gate export; preserve authentication.
Auditor: REFUTED on one configuration-default claim.
Disagreement: Plan says missing property enables; source default disables.
Impact: Decide the default and correct the proof strategy.
Choices: Proceed with specified amendment / Request round 2 / Pause.
Evidence and full scope: expandable links.
```

Do not create separate Planner brief, Auditor brief, revision-approval essay, and HTML retelling when one derived combined view can serve the decision. Keep every material disagreement accessible; brevity must not hide dissent. Short human explanations should come from owned fields, not a fresh unsourced summary.

HTML is not an approval channel by itself. A static page may describe choices that the human answers in the host chat. Working buttons require a real approved integration; do not generate decorative buttons and claim they record decisions. Escape untrusted ticket/audit strings, avoid executing embedded content, and do not add external assets, telemetry, or network submission merely to render the brief.

If the audit cannot complete, show an explicitly labeled unavailable/blocked status when presenting the problem to the human. Do not display an earlier successful audit as the latest result. An unsuccessful invocation is not consensus and does not authorize Tester.

## 10. Finalization and Tester contract

The Tester handoff should be a compact reference package containing the final plan identity, canonical requirements/AC mapping, source basis, last completed audit identity/verdict, human decision, final amendment coverage, and residual proof obligations. Tester need not read all previous debate or HTML to know what to test; it must be able to retrieve relevant primary evidence.

Define one planning-authorization predicate in the routing owner. The Orchestrator, Tester, candidate record, review eligibility, and release consumers must all use its same meaning. Separate a valid human-finalized planning basis from proof that requirements have been met.

Claude must show the exact downstream edits needed to replace the unconditional `holds` requirement where this new policy applies. Preserve the independent final code review, actual AC proof bar, test locks, candidate freshness, and publication controls. Do not leave a hidden later `holds` check that forces another planning audit, and do not globally delete all audit requirements to fix that conflict.

If the installed environment cannot support the human-finalized basis safely, report the specific blocker and smallest required change. Do not claim the requested behavior works by changing only Planner prose.

## 11. Required validation cases and measurements

Before adopting this workflow, exercise these cases with synthetic or authorized fixtures. These are required future tests, not tests run while writing this document.

| Case | Expected behavior |
|---|---|
| First audit holds | Render brief #1; wait for the human rather than auto-dispatching Tester. |
| First audit refutes; human requests round 2 | Only then invoke Planner revision and a second fresh audit. |
| First audit refutes; human authorizes exact amendment and no re-audit | Apply only that amendment, preserve the refutation and coverage difference, validate the final planning basis, then hand off to Tester. |
| Human only says “no” | Clarify whether to proceed or stop; no inferred approval. |
| Round 2 holds or refutes | Both require brief #2 and the final human decision; no automatic third round. |
| Planner disputes a finding with evidence | Preserve both positions for the human; no silent closure or forced agreement. |
| Final human edits introduce an extra unapproved material change | Stop for clarification; no reused approval or forged current audit. |
| Plan/source changes while the human is deciding | Detect stale subject; refresh the decision basis rather than using the old response blindly. |
| Latest audit stopped, older audit holds | Show latest inability to complete; never advance on the older result. |
| Missing referenced evidence or invalid structured output | Report the missing input/format problem; no fabricated field or verdict. |
| Renderer runs twice on the same pair | No second semantic summary, duplicate approval, or extra audit dispatch. |
| Session resumes at a human checkpoint | Restore the pending decision and round count; do not restart the loop. |
| Final amended plan reaches candidate review/release | No stale audit claim or hidden legacy deadlock; all unchanged proof/release controls still apply. |
| Human leaves a required criterion or authority unresolved | Remain paused, even when the two-round budget is exhausted. |

Treat substantive audits, failed invocations, transport retries, and human waits as different measurements. A transport failure must not trigger an unbounded retry loop; follow the installed recovery policy and record attempts.

Measure generated bytes by role, actual supplied/read context where observable, duplicate narrative, brief-generation calls, completed audit rounds, retries, time awaiting humans, active processing time, downstream clarification, and later proof/review defects. Record actual token/credit costs only when exposed reliably; file size is a proxy, not billing. Include failed/blocked runs in reporting.

Separate the **workflow experiment** (human checkpoint after round 1) from the **representation experiment** (compact Markdown versus JSON). Hold task inputs, model allocation, effort, tools, and review criteria fixed where practical. Start with the smallest compatible checkpoint change, then test format changes so savings or regressions can be attributed. Do not promise a percentage reduction before the pilot.

Success means less unnecessary generation/re-reading and fewer unrequested rounds **without** hiding disagreement, losing evidence, confusing final-plan identity, adding excessive human repair, or degrading downstream correctness.

## 12. Claude’s output and eventual implementation boundary

Produce one report under `rstack-pipeline/reviews/<date>-planner-auditor-human-loop-review.md`, or an approved internal location when it contains workplace evidence. Include:

1. Source-grounded current behavior versus the owner-reported behavior; missing evidence stated explicitly.
2. A proposed transition table implementing the requested human checkpoints and bounded round policy.
3. The smallest canonical records and one complete example for each branch: no second round and human-approved second round.
4. Exact existing files/readers to change, including every downstream plan-audit eligibility dependency; identify missing real parsers rather than inventing them.
5. HTML timing, provenance, finalization rules, tests, measurements, migration/rollback, and unresolved policy tradeoffs.

Prefer a narrow first implementation using existing formats when it can satisfy the user flow. Propose compact JSON only where it improves validation/transport enough to justify coordinated reader changes. Do not rewrite all agents, replace the factory, introduce new model assignments, or create another version directory.

After implementation approval, update routing in the pipeline skill, role procedures in their agents, shapes in handoff-contracts, permissions/decision semantics in their existing owners, and actual tests/readers together. Prefer reuse of existing render/decision tools. No historical run is rewritten or automatically migrated; preserve legacy input support or explicitly reject unsupported versions. Keep evaluation records external to this execution loop, under the existing post-run workflow.

Do not commit, push, install, change workplace settings, execute a live ticket, or publish internal evidence under this analysis assignment without separate authorization. This document authorizes its reviewer to propose an implementable change, not to bypass workplace controls.

## Sources and related guidance

The screenshot observations and desired sequence in sections 1 and 3–4 come from the owner’s request in this conversation. The technical design is a proposal, not a statement that those mechanisms already exist.

Repository sources inspected at `37d33d0bc8cc1db57cf1e562fadee21d2238a6bf`:

- [R1 — Canonical RSTACK entry point](https://github.com/Lorenchess/copilot-agentic-workflow/blob/37d33d0bc8cc1db57cf1e562fadee21d2238a6bf/rstack-pipeline/README.md).
- [R2 — Pipeline, especially Routing and Eligibility](https://github.com/Lorenchess/copilot-agentic-workflow/blob/37d33d0bc8cc1db57cf1e562fadee21d2238a6bf/rstack-pipeline/claude-v2.2/pipeline/SKILL.md).
- [R3 — Planner, especially Step 7 and Revision turn](https://github.com/Lorenchess/copilot-agentic-workflow/blob/37d33d0bc8cc1db57cf1e562fadee21d2238a6bf/rstack-pipeline/claude-v2.2/agents/rstack-planner.agent.md).
- [R4 — Orchestrator, especially Dispatch and results](https://github.com/Lorenchess/copilot-agentic-workflow/blob/37d33d0bc8cc1db57cf1e562fadee21d2238a6bf/rstack-pipeline/claude-v2.2/agents/rstack-orchestrator.agent.md).
- [R5 — Plan Auditor, especially Inputs and Return](https://github.com/Lorenchess/copilot-agentic-workflow/blob/37d33d0bc8cc1db57cf1e562fadee21d2238a6bf/rstack-pipeline/claude-v2.2/agents/rstack-plan-auditor.agent.md).
- [R6 — Tester, especially Inputs and lane](https://github.com/Lorenchess/copilot-agentic-workflow/blob/37d33d0bc8cc1db57cf1e562fadee21d2238a6bf/rstack-pipeline/claude-v2.2/agents/rstack-tester.agent.md).
- [R7 — Handoff contracts, especially Plan audit and response](https://github.com/Lorenchess/copilot-agentic-workflow/blob/37d33d0bc8cc1db57cf1e562fadee21d2238a6bf/rstack-pipeline/claude-v2.2/references/handoff-contracts.md).

Public technical references, checked 2026-09-27; they support format/context distinctions, not this workflow’s measured performance:

- [S1 — RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259), sections 1 and 4: text representation and object interoperability.
- [S2 — JSON Schema: object](https://json-schema.org/understanding-json-schema/reference/object): property and required-field validation.
- [S3 — Anthropic: Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents): context selection and on-demand retrieval; vendor guidance, not a RSTACK benchmark.

Use the current [artifact/handoff efficiency review](RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md), [post-run evaluation workflow](RSTACK-POST-RUN-EVALUATION-WORKFLOW.md), [labeling guide](RSTACK-EVALUATION-LABELING-GUIDE.md), and [governance guidance](RSTACK-EVALUATION-GOVERNANCE.md) only as needed. This targeted assignment does not require every agent to load the entire evaluation pack.

**Decision principle:** one concise plan, one independently attributed audit per completed round, one combined human view at the right time, and a final plan whose approval and proof status are unambiguous.
