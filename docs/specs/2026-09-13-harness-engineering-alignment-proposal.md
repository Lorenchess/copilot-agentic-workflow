# Harness-engineering alignment — architecture proposal (revision 2)

**Status: DRAFT, UNTRACKED, NOT APPROVED. Nothing implemented. No Sonnet dispatch. No phase is authorized by this document.**

- **Base:** `main` at `77940936e7c1b8cd55b1ae29701c6f2b3d6dc85e` (post-Phase-5 efficiency batch). Locked references `phase-1-reference` … `phase-5-reference` are untouched and remain immutable.
- **Author / role:** Claude 5.1 as architect. Revision 1 written 2026-09-13 at the owner's request to analyse the "harness engineering" article (six-layer minimum viable harness; X post by @iiiichigo_chan, supplied as pasted text plus three figures; the PDF copy is image-only and was not text-extracted). **Revision 2, 2026-09-14,** incorporates the owner-forwarded ChatGPT reconciliation review (`Claude_Harness_Reconciliation_Review.md`); §10 records what changed and why.
- **Constraints honoured:** Copilot-native configuration-as-code only (no CLI, scripts, hooks, runtime, policy engine); Sonnet 5 implements any approved edit, the architect reviews, ChatGPT reviews independently; publication only on the owner's explicit authorization; "keep the architecture, bounded forward improvements, measure before restructuring" (ChatGPT, `docs/reviews/2026-09-11-reference-efficiency-and-audit-review.md`).

## 1. One-paragraph verdict

The article's thesis — *the model proposes; the harness selects context, authorizes tools, stores state, collects evidence, enforces limits, recovers* — is the design this repository has already **specified** in Markdown over five phases. Specification is not the same as constraint or observed behaviour: prose tool and path restrictions are not a complete permission gateway, files describing checkpoint recovery do not prove durable restoration, and every host-dependent guarantee remains `NOT VERIFIED` (CORPORATE-ADOPTION CA-01 … CA-22). Read that way, the reference extensively specifies all six responsibilities; its remaining work is to **connect lesson capture to reviewed improvements and validate the host-dependent guarantees, not to rebuild the architecture**. The improvement loop itself is not absent — RUN-AUDIT already defines paired trials, retained failures, human promotion and rollback — but the narrow gap is a consistent link from a particular incident to a proposed lesson and its validation record. A second point is a decision, not a gap: the article's autonomy ladder places "run tests in an isolated workspace with a recorded diff" at *automatic + checks*; the pipeline prompts for every runner execution because those prerequisites (isolation, containment of repository-controlled build code) are unverified here. That is the article's principle applied to the current evidence, not a rejection of it. Everything else the article recommends is present as specification, deliberately declined for a recorded reason, or forbidden by the Copilot-native rule (code gateways, `verify.ts`, `traces.jsonl` runtimes).

## 2. Layer-by-layer mapping

Three questions apply to every row, and the assessment column answers all three: **Specified?** (agent instructions, skills, contracts, procedures) · **Constrained?** (an actual host mechanism whose boundaries have been checked) · **Observed?** (representative runs including failure and recovery). In this repository the honest answer to the third is always *no*, and to the second usually *partly*.

| # | Article layer (what it demands) | Pipeline mechanism today | Specified / Constrained / Observed |
|---|---|---|---|
| 1 | **Contract** — bounded task object: goal, inputs, constraints, deliverable, `done_when`, `escalate_when`; prevents silent task substitution | INTAKE.md (provenance-tagged inputs) + RUN.md Keys/Repositories/Branch/Developer context (G1/G2) + PLAN.md (`plan-grounding` R1 item-level disposition = anti-substitution; `C` rows = constraints; AC Given/When/Then with Observed at + `P` rows = `done_when`; `Q` rows `ASSUMED/G3/BLOCKING` = decisions; change class = depth). `escalate_when` = the global STOP catalogue plus per-loop budgets. G3 binds approval to the exact `cycle.round` reviewed. | **Specified, richer than the article** (source classes, evidence rows, adversarial challenge, revision-bound approval). Constrained: gate wording and answer recording are procedural (CA-07). Observed: no. |
| 2 | **Context compiler** — assemble only what the step needs; map not manual; progressive disclosure | Per-agent `Inputs` lists (AGENT-CONTRACTS); mode-specific scoping (test-review mode reads only PLAN/TEST-CONTRACT/RED/controlled paths); policy skills `user-invocable: false` + `disable-model-invocation: true`, read explicitly by name; terminal-holding agents never receive INTAKE.md (A7); `copilot-instructions.md` ≤ 60 lines; the subagent-call header names stage, mode, round, run dir, active allowed-input revision ids, owned output, return condition; Tester activation mode loads no skill. | **Specified.** Constrained: skill loading and mode-specific reads are unverified in the host (CA-02). Two hygiene notes: (a) no compact "where are we" summary exists — `pipeline` re-derives the run position from RUN.md's tables and twelve artifacts on every resume; (b) accepted debt N1 (rules repeated across agent bodies, AGENT-CONTRACTS, skills) is the article's "manual" anti-pattern in miniature; ChatGPT: measure prompt size before restructuring. |
| 3 | **Tool gateway** — schema, scoped permission, predictable result shape, timeout; policy authorizes, tool executes, harness records; risk-classified permission ladder | Tool allowlists per agent; MCP capabilities named individually; per-agent allowed git command forms + literal-argument policy; `.vscode/settings.json` anchored `true` rules with literal-token slots and `false` rules that force a prompt; edit auto-approve off for `.github/**` and `.vscode/**`; index-scope check; explicit-object non-force push. Observations: `[TOOL]` excerpts, identity tallies, staged-set records, six-line RED evidence. | **Specified for authorization; partially specified for observation shape; no timeout rule.** Constrained: only tool-list removal is a real boundary; regex approval is a prompt, not a wall; generic edit tools are not a path sandbox (GUARDRAILS says so; CA-04/05/06). The gateway is necessarily declarative here. |
| 4 | **Durable state** — status, current step, completed, decisions, artifacts, open risks, next action; FACTS / DECISIONS / STATE / LESSONS; survive context loss and handoff | RUN.md (Stage status, Artifact history ACTIVE/SUPERSEDED, gates log with basis + CURRENT/STALE, Decision log, Resume notes); resume-by-artifact; IMPLEMENTATION.md reservation-first Iteration log; WORKSPACE.md Publish section and PR.md record intent before effects; RUN-AUDIT snapshot-before-replacement and ownership transfer. FACTS = INTAKE/PLAN evidence/WORKSPACE; DECISIONS = gates log, Decision log, PLAN `Q` rows; STATE = Stage status, Artifact history, per-repo statuses. | **Specified for FACTS/DECISIONS/STATE; LESSONS unspecified at run level.** Constrained/Observed: durable restoration and exact-byte snapshots are `NOT VERIFIED` (CA-22); `.pipeline/` is ignored and is neither archive nor backup (RUN-AUDIT). No run-level `next action` / open-items summary. |
| 5 | **Evidence gate** — environment produces evidence, harness decides sufficiency; deterministic checks first, model reviewer second; maker ≠ checker; accept / retry / escalate | RED proven twice at the test's own assertion (T6); identity tallies; byte-identity immutability at the active anchor; envelope diff with proof-relevance by effect; relied-on identities observed; obligation-first verification; `PASS / INCOMPLETE / FAIL` with could-not-verify ≠ failed ≠ passed (IQ14); IQ4 routes + IQ12 category table; maker/checker separation at three points with fresh context and distinct method skills. | **Specified, richer than the article.** Constrained: the checks are commands and comparisons an agent must actually run; compliance is a trust assumption (ChatGPT final review, Limits). Observed: no; runner behaviour, DB/Kafka proof paths `NOT VERIFIED` (CA-18/19). Model diversity between maker and checker remains a deferred benchmark (R12/T16/IQ16). |
| 6 | **Trace and recovery** — record the run; classify the failure *by harness layer* before retrying; promote the fix (map / tool / policy / test) | Trace: twelve artifacts + git commits; RUN-AUDIT metadata envelope with `OBSERVED / AGENT_REPORTED / INFERRED / UNAVAILABLE`, one-change paired trials, human promote/rollback. Recovery: STOP catalogue, bounded loops, human-directed rounds, same-basis delivery continuation, rollback point = baseline SHA / active anchor. Design-time loop: ChatGPT findings → contract amendments → §7 challenge-case tables. | **Trace and improvement loop: specified as guidance, `NOT VERIFIED` (CA-21/22). Recovery: specified. Incident → lesson → validation link: unspecified.** IQ4/IQ12 classify failures for routing only; nothing records whether an incident reveals a reusable weakness, what change it suggests, or how that change was validated. |

**Permission ladder (figure 2) mapped to the pipeline.**

| Ladder tier | Article control | Pipeline today | Match |
|---|---|---|---|
| Read / research | automatic | allowlisted read-only git forms auto-approve; file reads and searches free; Jira reads confined to `intake` | matches |
| Write in workspace (edit isolated files, run tests; article assumes *isolated workspace* and *diff recorded*) | automatic + checks | edits and `add`/`commit` on the feature branch auto-approve with index-scope, controlled-path, and bracket checks; **every test/build runner execution prompts** | stricter for runners, because the article's two prerequisites are unverified here |
| Send / merge / deploy | evidence + approval | G4 tuple approval on current PASS + empty gap set; explicit-object push; PR create only after confirmed publication | matches |
| Delete / pay / publish (irreversible) | explicit human confirmation | destructive verbs forbidden to every agent; `false` rules force a prompt; no merge/approve/decline tool exists | stricter (forbidden, not confirmed) |

## 3. Decisions, not gaps

**D-A. Runner execution.** Prompting stands. What is missing is a written statement of what evidence would make a *separate owner decision* to change it considerable at all (H5). No CA row, alone or combined, promotes a permission.

**D-B. Code gateway vs declarative gateway.** Forbidden by the owner's rule; the host approval engine is the gateway; GUARDRAILS already states the consequence. No change.

**D-C. Same model on both sides of every check.** Procedural independence only; the article reinforces the deferred benchmark's value but supplies no evidence. Keep deferred.

**D-D. Ceremony.** The pipeline's reviewers all review against objective criteria; RUN-AUDIT already refuses raw transcripts as memory. No change.

## 4. Proposed adaptations (ranked; each bounded and Copilot-native)

Each item names what it is, where it lands, what it must not become, and how it would be checked. Wording, field names, and file lists are proposals for a contract, not commitments. **Frozen throughout:** every historical spec/proposal/review, every tagged example view, `.vscode/**`, MODEL-ROLES.md. Worked examples for any item are **new fictional cases or clearly labelled forward scenarios** (the P5-C3 precedent), never newly invented decisions inserted into existing example run records.

### H1 — Optional, non-blocking lesson annotation on run incidents (the incident → lesson link)

- **Two questions, kept apart.** *Operational:* why must this run stop and what may happen next — answered, unchanged, by the existing STOP code, verdict, and recovery route. *Improvement:* does this incident reveal something worth changing for future runs — answered by a new, **optional** annotation. The annotation never authorizes a retry, renews an allowance, changes a route, or turns a disputed finding into a confirmed false block.
- **What:** a Decision-log entry (STOP decision, `TEST_CHANGE_REQUESTED`, disputed verifier finding, developer-declared false block, delivery continuation) *may* carry `lesson: <one line>` and `lesson class`. Class values: `MISSING_CONTEXT · TOOL_CONTRACT · MISSING_GUARDRAIL · WEAK_VERIFICATION · OTHER (<named>) · NONE_IDENTIFIED · UNASSESSED` (default `UNASSESSED`). `NONE_IDENTIFIED` means the run stopped correctly and no reusable weakness was seen *so far*; it never asserts that nothing should change. `pipeline` may propose a class tagged `[INFERENCE]`; only a human confirms it (`[DEV]`), at the STOP or later between runs. The article's four categories are examples, not a taxonomy; `OTHER` is expected.
- **Where:** `pipeline.agent.md` Decision-log section and RUN.md template in AGENT-CONTRACTS (one optional field pair); FLOW.md STOP catalogue preamble (one sentence). Entry STOPs raised before RUN.md exists (`INVALID_KEY`) and pre-run `RUN_EXISTS` get no artifact and no annotation; a lesson about them, if any, goes to the ledger (H2) by hand.
- **Selection of the next improvement** (RUN-AUDIT "Evaluate one small change"): never by frequency alone; weigh consequence, recurrence, human burden, and strength of evidence together. One sentence added to RUN-AUDIT.
- **Must not become:** a mandatory diagnosis at every interruption, a new artifact, gate, or STOP, an automatic rule change, or a self-reported fact. Review burden is itself a cost the article's metric counts.
- **Check:** a forward fictional scenario shows one annotated entry and one `UNASSESSED` entry in the same run; a contract challenge case traces "a `CONTROLLED_PATH` block that later proves to be an envelope misclassification is annotated `WEAK_VERIFICATION` → candidate `test`; its route and the human restoration were unchanged".

### H2 — A reference harness ledger, separated from corporate incident records

- **What:** one tracked, human-maintained table, `docs/HARNESS-LEDGER.md`: `id · date · source · lesson class · weakness (what failed, deidentified) · proposed promotion (map / tool / policy / test) · target file(s) · status · validation`. **Source** is a design-review id (`docs/reviews/…`), a contract §-reference, or "approved deidentified corporate lesson" — never a run correlation id, ticket key, repository or branch name, path, or log excerpt (RUN-AUDIT: those may be sensitive and corporate run material never enters this repository). Run-linked incidents, evidence references, and private ids stay in the organization's existing private record; the ledger holds only the general lesson.
- **Status and validation are distinct.** Status ∈ `OPEN · PROMOTED at <commit> · DECLINED (<reason>)`. Validation ∈ `DOCUMENT_SCENARIO_REVIEWED (<review id / challenge case id>) · REGRESSION_CASE_EXECUTED (<where>) · CORPORATE_OUTCOME_MEASURED (<private reference, no content>) · NOT_VALIDATED`. A commit touching the target file proves a change occurred, not that the weakness was corrected; the validation column says which.
- **Seeding:** the Phase 1–5 review findings that became amendments (each `PROMOTED`, validation `DOCUMENT_SCENARIO_REVIEWED` citing its challenge case or closure review); N1, N2, N3 as `OPEN` with their accepted-debt status unchanged — a ledger row does not resolve them; D-A as `OPEN` policy.
- **Must not become:** a backlog of feature ideas, a place any agent writes during a run (`pipeline` owns RUN.md only; the ledger is maintained between runs like `docs/questions.md`), or a way to make an improvement look more proven than its validation column says.
- **Check:** every `PROMOTED` row names a commit whose diff touches the target file *and* a validation value other than `NOT_VALIDATED` or an explicit reason it is still `NOT_VALIDATED`.

### H3 — Run-state summary in RUN.md (derived, basis-bearing, human-readable)

- **What:** a fixed section at the top of RUN.md, pipeline-owned, rewritten in the same edit as any Stage status / Artifact history / gates / Decision-log change: `current stage and round · next action (one line, derived from the resume rules) · pending decision (STOP code, or none) · open items — each as id + a short plain-language phrase, grouped: accepted plan risks, verifier disclosures, current NOT_VERIFIED clauses, pending delivery effects (PENDING / UNKNOWN / BLOCKED repositories) · basis (the Artifact-history revision ids this summary was derived from)`. The section is labelled for its scope ("open items known to the orchestrator at this basis"), never "all open risks".
- **Authority:** a derived cache. On resume `pipeline` still runs the resume-by-artifact rule; if the summary disagrees, the discrepancy is recorded under Resume notes and the rule wins. Nothing about who reads RUN.md changes: modes forbidden from reading RUN.md (Tester non-activation modes, Adversary test-review mode, Developer) remain forbidden; the summary is for the human and the orchestrator.
- **Why:** the article's compact history and `state/current.json`; what RUN-AUDIT's ownership-transfer receiver reads first; a human-orientation improvement. It does not improve storage durability or prove faster resumption while the source checks stay mandatory.
- **Must not become:** a state machine, a second source of truth, a shortcut past the resume rule, or a reason to widen any agent's inputs.
- **Check (contract challenge cases):** an older run with no summary resumes unchanged; a summary saying stage 6 while TEST-REVIEW.md is SUPERSEDED lands at 5b and records the discrepancy; a completed `PUBLISH_ONLY` run without PR.md shows `next action: none — terminal` and is not reopened.

### H4 — Shared execution-observation vocabulary — mapping first, implementation deferred

- **What is deferred:** revision 1 proposed one execution record with a single status enum replacing three stage-specific evidence shapes. That would risk losing meanings the stages depend on: a WITNESS failing at its own assertion is *failed test* and *correct RED evidence* at once (T6); a diagnostic run may legitimately discover no identities (IQ3); a reservation with no result must remain `pending` then `UNKNOWN` and consumed (IQ3); an execution over uncommitted edits is not identified by HEAD alone; "retryable" is a technical property and never a permission under the current allowance or decision.
- **What is proposed instead:** before any operative change, a **no-loss field mapping** table in the contract: every field currently required by RED-REPORT.md Command/RED evidence/Confirmation, IMPLEMENTATION.md Iteration log/GREEN evidence, and VERIFICATION.md Contract/Full-suite/Checkout — its owner, source (`[TOOL]`/derived), retained meaning, and stage applicability. Only if that table shows an actual reporting problem (a field two stages need and record incompatibly, or evidence a later stage cannot consume) does a shared subset of *neutral observation fields* (command exact, repository, observed HEAD and working-tree state, identities discovered/executed/skipped, trimmed `[TOOL]` excerpt) get named once, with every stage-specific proof and verdict field retained where it lives.
- **Must not become:** a JSON schema, a new file per execution, a single status collapsing RED/FAIL/UNKNOWN/NOT_RUN/pending, or a reason for Tester to read `implementation-quality` (or Developer to read `test-contract`) — that would grow context and blur the mode separation the last batch tightened.

### H5 — Autonomy ladder with *evidence for a decision*, not promotion conditions (documentation only; settings unchanged)

- **What:** a table in GUARDRAILS.md under Git safety: for each action class (read; edit own files; `add`/`commit`; runner execution; push; PR create; forbidden verbs) — current control, article tier, the CA rows whose `PASS` would make a *separate, explicit owner decision* to change the control considerable, and the questions that decision would have to answer. Forbidden verbs are marked "never — forbidden by design". Runner execution is the only row whose current control differs from the article tier for a reason other than "forbidden".
- **Rule stated in the table:** *Relevant CA evidence permits consideration of a separately approved policy change; it never promotes a permission automatically, and no agent or implementer self-authorizes it* (the MODEL-ROLES change-control sentence, applied to permissions). CA-17 and CA-18 passing shows the runner ran once under approval in a checked host; it does not show that unattended execution of repository-controlled build code is contained. A later proposal would have to address the actually granted capabilities, credential and resource boundaries, permitted targets (exact detected commands, never a wildcard), the bypass cases already listed in Host-environment assumptions, and which host changes invalidate the evidence.
- **Must not become:** a change to `.vscode/settings.json`, a wildcard rule, or a claim that a sandbox exists.
- **Check:** every cited CA row exists; CORPORATE-ADOPTION's Dependent-reference-behaviour column links back to the table.

### H6 — Timeout handling: an observation whose cause is unestablished (behavioural; not documentation-only)

- **Correction from revision 1:** a host timeout with no terminal result is *not* by itself an environment condition. Classifying it as `RUNNER_UNAVAILABLE` would misroute a production hang (an implementation failure) and contradict T7, which already separates an infrastructure timeout from a legitimate assertion on a required interval.
- **What:** one clarification, placed where each stage records execution results: an execution that the host stops without a valid terminal result is recorded with result `UNKNOWN` — cause unestablished, process completion unestablished — and its reservation stays consumed (stage 6: IQ3 already says this; stages 5 and 7 gain the equivalent sentence: no RED, GREEN, PASS, or FAIL evidence is recorded from it). The *next* step is decided from evidence, through existing routes only: infrastructure shown unavailable → `RUNNER_UNAVAILABLE`; the hang reproduces on the changed code and not at the anchor → IQ4 `IMPLEMENTATION_GAP` / `REGRESSION` / `NONDETERMINISTIC` as the evidence warrants; a timing requirement the test asserts → ordinary test evidence (T7). No overlapping execution and no blind retry: a further execution needs its own allowance and, at stages 5 and 7, is one more run under the existing budgets. The observed host timeout value is recorded `[TOOL]` or `UNAVAILABLE`; CA-18's timeout observation gains a consumer.
- **Must not become:** a pipeline-chosen timeout value, a new STOP, a change to any STOP message, an automatic environment diagnosis, or a renewed allowance.
- **Sequencing consequence:** this changes classification and routing at three stages and therefore belongs with the behavioural batch (H-C2), not the documentation batch.

### Explicitly not proposed

- The article's `agent-harness/` layout, `contracts/task.schema.json`, `checks/verify.ts`, `tools/registry.json`, `runs/traces.jsonl`: code or runtime — forbidden here and covered declaratively.
- Auto-approving runner execution, now or on any CA row's `PASS` alone (D-A, H5).
- A model change for any role (D-C).
- A new agent, gate, STOP code, or run artifact. H1–H6 add optional fields, tables, and sentences to existing owners.
- A second orchestrator or approval system; six agents mirroring the article's six layers.
- Restructuring skills/agents to remove N1 before prompt sizes are measured.
- Retroactive edits to historical example run records to illustrate new fields.

## 5. Sequencing (if the owner opens work at all)

| Batch | Scope | Character | Why this order |
|---|---|---|---|
| H-C1 | H2 (ledger, seeded), H5 (autonomy-ladder table) | Documentation only; zero change to any agent procedure, STOP, route, or budget | Establishes the vocabulary; can follow the forward-refinement pattern (architect brief → Sonnet → architect review → ChatGPT review → local commit), no phase contract needed. |
| H-C2 | H1 (optional lesson annotation), H3 (run-state summary), H6 (timeout as `UNKNOWN`) | Behavioural: touches `pipeline.agent.md`, RUN.md template, FLOW.md, pipeline skill, and (H6) tester/developer/verifier evidence sentences | Needs a phase contract with challenge cases and ChatGPT's contract review, because it changes what the orchestrator records and how three stages classify an execution. |
| H-C3 | H4 mapping table only | Analysis, then a separate decision | Implementation only if the mapping evidences a reporting problem. |

Every batch: Sonnet 5 implements from an architect brief; architect reviews (≤ 2 correction rounds); ChatGPT reviews the exact commit; local commit only; no push/tag without the owner's authorization text.

## 6. Owner decisions requested

| Id | Decision | Recommendation |
|---|---|---|
| D1 | Adopt the optional lesson annotation (H1) and the reference ledger (H2), with corporate run-linked records kept in approved private storage? Ledger as new `docs/HARNESS-LEDGER.md`, or a section in RUN-AUDIT? | Adopt both; new file — RUN-AUDIT is procedure, the ledger is a record. |
| D2 | Adopt the run-state summary (H3) as a derived, basis-bearing, human-readable cache with unchanged resume authority and reader boundaries? | Adopt. |
| D3 | H4: commission the no-loss field mapping and defer any implementation until it evidences a reporting problem? | Mapping only. |
| D4 | Adopt the autonomy-ladder table (H5) as documentation, with CA evidence framed as input to a future explicit decision, never a promotion condition? | Adopt. |
| D5 | Sequencing: H-C1 as a forward-refinement batch now; H-C2 as a contracted phase after ChatGPT reviews this revision; H-C3 as analysis? | As stated. |

## 7. Measures

The article's headline ratio, *accepted outputs / human review minutes*, is RUN-AUDIT scorecard items 2 (independently accepted correct completed runs over all eligible initiated runs) and 3 (active human time). It should be reported only together with the scorecard's other items — material rework, false blocks and useful findings (item 5), correct STOP/resume behaviour and control violations (item 6) — because H1 and H3 add reading and annotation work that the ratio's denominator must count. A one-sentence addition to RUN-AUDIT naming the ratio and this pairing is proposed; no new measure or collector.

## 8. What the article under-specifies and the pipeline already answers

- *Whose approval is an approval?* Every gate answer carries a basis and is staled on supersession (A8).
- *What if the checker is wrong?* `DISPUTED` findings adjudicated at re-verification; NOTE never blocks; the anchoring rule; `DEFECT — decision required` routes to planning.
- *Partial and unknown external effects.* Intent-before-effect, unknown-result blocking, same-basis continuation, no blind retry.

## 9. Reconciling further analyses

Before accepting any recommendation from another analysis:

1. Does it name the pipeline mechanism that already *specifies* the layer (§2)? A claimed gap must cite the file and rule believed missing, and say whether the gap is specification, constraint, or observation.
2. Does it propose code, a runtime, a schema, a hook, or a service? Then it must be re-expressed declaratively or dropped.
3. Does it loosen an approval without naming both the evidence and the separate decision that would authorize it? Then it is D-A restated.
4. Does it add an agent, gate, STOP, or artifact? Then it needs a stronger justification than the article supplies.
5. Does it propose a model change? Deferred benchmark.
6. Does it turn a lesson into a rule or a challenge case with a stated validation level? Candidate H2 row.

## 10. Revision 2 — reconciliation record

The owner forwarded a ChatGPT review of revision 1 on 2026-09-14. Each of its points was checked against the current sources before being applied. All were applied; none was rejected. The material ones:

| Review point | Verified against | Change made |
|---|---|---|
| "Covered at or beyond" conflates policy coverage with demonstrated behaviour | CORPORATE-ADOPTION (all 22 rows `NOT VERIFIED`), GUARDRAILS Host-environment assumptions, ChatGPT final review Limits | §1 rewritten; §2 assessment column now answers specified / constrained / observed; headline replaced with the review's proposed statement. |
| The improvement loop is not "absent"; the narrow gap is incident → lesson → validation | RUN-AUDIT "Evaluate one small change" | §1 and §2 row 6 corrected. |
| H1 must not require a diagnosis at every STOP; `GENUINE` overreached; four categories are illustrative; entry STOPs precede RUN.md; frequency-only selection is wrong | FLOW.md STOP catalogue (`INVALID_KEY` before any run); IQ3 (annotation must not renew allowance) | H1 made optional with `UNASSESSED` default, `OTHER`, `NONE_IDENTIFIED`; no artifact for pre-run STOPs; multi-factor selection. |
| H2 admitted run correlation ids; "promoted" conflated a commit with validation; N1–N3 not resolved by a row | RUN-AUDIT lines on sensitive identifiers and the no-corporate-content rule | Source column restricted; status and validation split; N1–N3 seeded `OPEN`. |
| H3 needs readable open items, honest scope, unchanged reader boundaries, and compatibility cases | R10 ("ids linking to criteria, never ids alone"); AGENT-CONTRACTS ownership matrix | All added; three challenge cases named. |
| H4 collapses distinct meanings (`pending`, RED-as-evidence, no-identity diagnostics, retryable ≠ permission) and could make Tester load a second skill | IQ3 reservation-first log; T6; T14/IQ1 skill scoping | H4 reduced to a no-loss mapping first; implementation deferred. |
| H5: CA-17/18 `PASS` is not sufficiency for unattended runners; CA evidence enables a decision, never promotes | CA-17, CA-18 text (Manual approval); MODEL-ROLES change control | H5 reworded; promotion condition replaced by decision prerequisites. |
| H6 misclassifies a timeout as environment; must preserve T7; no overlapping execution or blind retry; it is behavioural, not documentation | T7; IQ3 (`UNKNOWN`, consumed); IQ4 | H6 rewritten as `UNKNOWN`-result observation with evidence-driven routing; moved from H-C1 to H-C2. |
| Examples: use forward or new fictional cases, never retroactive decisions in historical records | Phase 5 P5-C3 scenario precedent; frozen-file rule | Stated once in §4's preamble; H1's check reworded. |
| The ratio metric needs companions (rework, false blocks, active effort, control violations) | RUN-AUDIT scorecard items 2, 3, 5, 6 | §7 added. |

Two points the review made that this revision deliberately keeps narrow: the reference ledger (H2) is not a corporate incident record and must never become one; and every H-item remains an addition to an existing owner's artifact or document, so the nine agents, seven skills, twelve artifacts, four gates, and the STOP catalogue are unchanged in count.
