# Changes

Two records. The first, **Changes from claude-v2**, is the rstack-v2.1 record and is kept as written, including its preservation paragraph, which describes the v2.1 task. The second, **Round 2.2**, lists what this folder changes relative to `../rstack-v2.1`.

## Changes from claude-v2 (rstack-v2.1 record)

This revision is an editable candidate built from the preserved Claude draft and the 44 photographs. It changes the contract where the draft contradicted visible code, and records the runtime work needed to enforce stronger guarantees. It does not claim that the proposed controls already run.

| Change | Files | Reason / evidence |
|---|---|---|
| Restore sha-based eight-column AC interface; real HEAD for working-tree feedback | pipeline, planner, tester, approval, handoff contracts | E01; no WORKTREE literal or candidate-column migration |
| Separate execution, review and release outcomes | pipeline, tester, reviewer, approval | E02–E07; known-red diagnostic review is different from permission to ship |
| Keep photographed HELD and exit-code semantics | pipeline, orchestrator, harness map | E06; lost/running execution is a separate status |
| Bind review to complete immutable evidence and comparison | approval, tester, reviewer, handoffs | Prevent old review being reused after evidence replacement; proposed design |
| Establish committed candidate input basis | pipeline, approval, handoffs | E08; matching dirty digests do not establish committed execution |
| Fix freeze/index/stash and publication recovery procedure | approval | Preserve user work, no no-op stash pop, no unrelated staging, reconcile unknown external results; proposed design |
| Fresh audit after every revised plan; no independence by forgetting | planner, auditor, orchestrator, reviewer, pipeline | A response checker is not a new audit; proposed design |
| Make role result transport explicit | orchestrator, developer, handoffs, write boundaries | Driver can persist verbatim envelopes without developer-written artifacts |
| Preserve exception schema, tighten release contract | pipeline, approval, handoffs, runtime patch plan | E03–E05; current proceedable and waiver matching do not prove all requirements |
| Correct authorization record provenance | approvals, write boundaries, approval | Agent-written records and human-name fields do not authenticate a decision |
| Remove inherited approval-regex installation template | approvals | Host/installer version and effective behavior unverified; do not publish permissive settings as ready |
| Consolidate universal floor; preserve no PR merge/production tests | standing rules, session context, process reminder, precedence | Avoid conflicting duplicated policy; actual loading still needs verification |
| State guard/host/telemetry limits | write boundaries, harness map, discovery cost, estate layout | Source/call site differs from observed execution or containment |
| Add bounded estate search contract | estate-sweep, estate layout, impact schema | E11–E12; null, partial and uncovered results remain distinct |
| Add screened, blinded skill-change evaluation | eval-skill, learnings | E13; actual behavioral benefit is unmeasured |
| Preserve source-backed criteria and conditional defaults | planner, plan interview | Do not manufacture requirements or settle material uncertainty by silence |

### Deliberate design choices, not photographed runtime behavior

The committed-candidate phase, packet digests, immutable attempts, structured envelopes, mandatory fresh re-audit, review/release predicates and clean candidate input basis are proposed integration changes. They need adoption and actual source support. State numbers and compatibility paths alone do not make existing consumers support them.

Full candidate verification before review is the default. The optional scoped-review route is diagnostic until full evidence exists; a materially changed packet requires another review. This trades extra runs/reviews for explicit evidence freshness.

The normal release route permits no accepted observation gaps. A separate, disabled-until-adopted exception route may accept only specified gaps or fully accounted pre-existing nonlocked failures; it never waives locked execution, complete scope, candidate identity or L4 AC proof.

### Preservation and validation boundary (v2.1 task)

Original reconstruction files, ChatGPT reviews and claude-v2 remain unchanged. New files live only in rstack-v2.1. No executable script, generated workplace copy, host setting or installed skill was modified. No build, lint, test, browser, agent evaluation, commit, push or deployment was run for this revision.

## Round 2.2 — changes from rstack-v2.1 (2026-09-17)

Contract text only. No runtime script, host setting or installed file was created or changed, and nothing here has been executed. Finding ids refer to `CLAUDE-IMPLEMENTATION-REPORT.md`, which gives line references and before/after behavior.

| Change | Files | Finding / evidence |
|---|---|---|
| A result token for every state outcome (`VERIFY_RECORDED`, generic `STOPPED`), separate state-4 envelope lines, and routes for `RELEASE_BLOCKED`, `STOPPED` and working-tree locked failures | pipeline, handoff contracts, orchestrator, tester, planner, dev | V22-01; keeps role results distinct from gate PASS/BLOCKED/HELD (E06) |
| Fresh-role reply = envelope block + artifact body; persistence rule; parser tolerance left SOURCE-BLOCKED | handoff contracts, auditor, reviewer, orchestrator | V22-02; R7 |
| Named evaluators for review and release predicates; "current audit" defined by plan revision | pipeline, orchestrator | V22-03 |
| Scoped-review option: staleness by digest, explicit second review, no "materially different" judgement | pipeline | V22-04; OD-7 unchanged |
| In-run-owned failures go to their owner before review; pre-existing and UNKNOWN attribution travel to review, disclosed | pipeline, tester | V22-05; E04, E07 |
| approval.md append-only; round archive names; immutable per-attempt review packet with a current copy | handoff contracts, approval, tester, reviewer, orchestrator, write boundaries | V22-06; E11, R5 |
| Comparison packet as plain files; reviewer states what it cannot verify without Git | handoff contracts, approval, reviewer | V22-07; E11 |
| Freeze: unrelated untracked inputs, `.rstack/` exclusion check before any untracked sweep, human-made commit compared with approved diff | approval | V22-08; E08, R5 |
| Restoration of protected user work: held through release evaluation, last act of release, human's choice on an early stop, never silent | pipeline, approval, orchestrator, approvals | V22-09; R5; OD-14 |
| External-action intent written before the attempt; push reconciliation reads the named remote ref | approval, approvals, handoff contracts | V22-10 |
| Separate-checkout execution route marked SOURCE-BLOCKED | pipeline, approval, harness map | V22-11; E01, E08, B1.10; R4, R5 |
| Plugin environment variable removed from commands; learnings contamination wording; estate-template owner comment | auditor, dev, estate layout, discovery cost, learnings, estate template | V22-12; R7 |
| Tester steps marked by target; no `ac.tsv` write and no packet at WORKTREE | tester, handoff contracts | V22-13; E01, E02, R4 |
| Four gate exception gaps tabulated once and referenced from the skill | harness map, pipeline | V22-14; E03–E05, E07; R1–R3, R6 |
| Evidence statements are not publication permission, stated in the authorization owner | approvals | V22-15 |

Unchanged from v2.1 because no defect was found: the eight-column sha-based AC schema, the rule that WORKTREE is never a sha value, the below-L4 waiver-note rule, gate PASS/BLOCKED/HELD with `checksVerdict` and exit codes, HELD as an overlay rather than a pending execution, a waived red suite remaining failed, tree markers as stability evidence only, OTel NO_CLAIM as absence of a claim, the standing rules, session reminder and process bootstrap, instruction precedence, plan interview, risk tiers, team adoption, both maintenance skills, SOURCE-EVIDENCE and WORKPLACE-PORT.

### Preservation and validation boundary (round 2.2)

Everything outside `claude-v2.2` — original reconstructions, ChatGPT reviews, claude-v2 and rstack-v2.1 — is unchanged; hashes are in `CLAUDE-CHANGE-MANIFEST.md`. No build, lint, test, browser check, agent evaluation, runtime script, commit, stage, push, merge, installation or host-setting change was made.

## Correction round after the independent review (2026-09-17)

Review verdict CHANGES REQUESTED, findings R22-01 to R22-05. Corrected in place; contract text only; nothing executed. Exact changes, line references and hashes: `CLAUDE-RESPONSE-2026-09-17-R22.md`. The two records above are unchanged.

| Finding | Correction | Files |
|---|---|---|
| R22-01 immutable manifests named mutable inputs | Tester snapshots every mutable input into `evidence/attempt-<N>/inputs/` before sealing; the packet lists only immutable paths; release re-derives digests there and checks the current candidate.md against its snapshot | handoff contracts, tester, reviewer, approval, write boundaries |
| R22-02 WORKTREE had two next states | Owner decision on OD-18: owner-first at both targets. Both WORKTREE rows, the paragraph and approval's freeze precondition now agree | pipeline, approval |
| R22-03 audit bound to plan by revision only | Audit currency decided by plan sha256 carried in the 1b result envelope, measured by dispatcher and auditor, compared with candidate.md's digest; unobtainable identity stops | pipeline, handoff contracts, orchestrator, auditor, approval |
| R22-04 command templates lost path quoting | Whole script path quoted in every template; note says to keep the quotes | auditor, dev, estate layout, discovery cost |
| R22-05 OD-17 reopened a photographed fact | NO_CLAIM adds no inferred entry in the photographed gate (B3.7, B3.9): recorded as screenshot-supported, hypothetical blocker withdrawn, installed-version correspondence left unverified | harness map, source evidence, open decisions, runtime patch plan |

## External Evidence Reconciliation (2026-09-17)

Specification: `../EXTERNAL-EVIDENCE-REVIEW.md`, section 20 (verdict on the architecture: YES WITH CORRECTIONS). Corrected in place; contract text only; nothing executed; no runtime script, host setting, state, agent or role added or removed. The records above are unchanged. Before/after hashes and byte counts: `CLAUDE-CHANGE-MANIFEST.md`, addendum of the same date.

| Correction | Source in the evidence review | Files |
|---|---|---|
| Canonical recovery rule for an external action of unknown result: record the attempt, mark `UNKNOWN`, reconcile through the target's read interface, stop `NEEDS_HUMAN` if unestablished, preserve the possibility that the first attempt succeeded; never a blind retry. Ownership row added; routing row and human checkpoints reference it | §7 retries; §20 item 1 (LangGraph resume semantics) | pipeline |
| One publication record per external action in approval.md with `PUBLICATION_RESULT: SUCCEEDED / FAILED / UNKNOWN / PARTIAL`, action, performer, candidate, target, remote object, reconciliation and authorization provenance; `UNKNOWN` never implies retry | §20 item 2 | handoff contracts; short consumer reminder in the approval agent |
| Human-performed publication is the default: the human pushes and creates the PR with their own credential from prepared exact candidate, command, target and content; agent-performed publication is optional under three stated conditions and is recorded as `HUMAN_RECORDED` with the agent's credential | §9; §20 item 3 (GitHub environments, in-toto functionaries: the authenticated actor is the control) | approvals, approval agent |
| `HUMAN_RECORDED` defined as a provenance label, distinct from `AGENT_REPORTED`, `OBSERVED_HOST`, `OBSERVED_TOOL`, `INFERRED`, `UNAVAILABLE`; authenticated host events keep their own name | §9 table; §20 item 4 | approvals, discovery cost |
| Generic `OBSERVED` replaced by `OBSERVED_HOST` and `OBSERVED_TOOL`; inheritance restated: a derived value carries its weakest input; parsing never upgrades `AGENT_REPORTED` | §10; §20 item 6 (OpenTelemetry and MLflow trace semantics) | discovery cost |
| Every mechanism classified on two axes: guarantee type (HOST-ENFORCED CAPABILITY, DETERMINISTIC CHECK, PROSE CONTRACT, HUMAN DECISION) and effect (BLOCK-BEFORE, DETECT-AFTER, OBSERVE-ONLY); a detect-after check is never a sandbox | §10; §20 item 5 (containment posts: deterministic boundary versus post-hoc detection) | harness map, write boundaries |
| Frontmatter `tools` and `agents` named as HOST-ENFORCED CAPABILITY declarations only to the extent the actual Copilot surface honours them; the Markdown enforces nothing | §11; §20 item 5 (VS Code custom-agent documentation) | harness map, write boundaries |
| Adoption record item 10: Copilot surface, hook support and GA status, `postToolUse` payload, MCP scoping, subagent isolation, frontmatter enforcement, Bitbucket branch protection, required review and self-approval prevention, credential ownership, host authorization receipt; GitHub controls are not Bitbucket facts | §2.5, §9, §12; §20 item 7 | team adoption |
| HOST-DEPENDENT note: on VS Code, fresh roles as stateless subagents cannot ask the user; questions return in the result and are relayed verbatim | §6 Orchestrator; §20 item 8 (VS Code subagent documentation) | orchestrator |
| Post-resolution finding-quality labels (`TRUE_POSITIVE` … `HUMAN_ONLY_DECISION`), measurement only, never eligibility | §17; §20 item 6 | discovery cost |
| Deferred experiments and host observations recorded as OD-21 to OD-27; status notes on OD-1 to OD-10 | §12, §17, §19 | open decisions |

Ownership delta (this folder has no separate rule-ownership file; owners live in the pipeline skill's Ownership table and the harness map): the unknown-external-effect recovery rule is owned by `pipeline/SKILL.md`; the publication record shape by `references/handoff-contracts.md`; the publication default and `HUMAN_RECORDED` meaning by `references/approvals.md`; the provenance and finding-quality label vocabularies by `references/discovery-cost.md`; the guarantee-type and effect vocabulary by `references/harness-map.md`. Agents carry one-line reminders only.

Kept unchanged, as the correction brief required: the planner does not dispatch its auditor; the orchestrator is the sole dispatcher; tester and developer are separate; the reviewer is fresh and read-only; `REVIEW_ELIGIBLE` is not `RELEASE_ELIGIBLE`; a changed candidate stales evidence, review and authorization; final integration precedes final verification and review; no tier removes a state; learnings stay experimental and off; no test-challenge state, mandatory panel or evidence-auditor; no agent merges a PR; INCONCLUSIVE never becomes VERIFIED; a human decision creates no missing evidence. Not implemented, on the evidence review's own advice: `postToolUse` capture, `subagentStop` persistence, `preToolUse` lane hooks, any ablation, any change to risk tiers, any new script.

Host-dependent questions this batch leaves open are listed at the end of the matching section in `OPEN-DECISIONS.md`.

## Correction pass after the batch review (2026-09-17)

Review: `../reviews/2026-09-17-v2.2-external-evidence-batch-review.md` — verdict READY WITH TARGETED CORRECTIONS, findings C1 to C3, six operational files. Corrected in place; contract text only; nothing executed; no state, role, script, hook or setting added. The records above are unchanged; where their summaries were overstated the review says so and this section does not rewrite them: "one-line reminders only" and "no procedure was duplicated" were too strong — approval's release step 10 had repeated the recovery sequence, and the skill carried the concrete reads. Both are now corrected as described below. Hashes: `CLAUDE-CHANGE-MANIFEST.md`, second addendum.

| Finding | Correction | Files |
|---|---|---|
| C1 publication recovery did not separate the original attempt, the reconciled state and verification of the exact authorized action | Skill rule rewritten: intent, immutable attempt result and appended reconciliation lines with an intent comparison; current known state defined as the latest supported observation as of that read; absence establishes failure only when the interface proves the request terminal with no effect; the human decides the recovery action and may supply checkable evidence, never the fact; state behaviour per status (reuse success, retry a terminal failure only within current authorization, never on `UNKNOWN`, only unfinished components on `PARTIAL`); every unresolved intent recovered before a new attempt; approval named the sole **agent** publisher owning preparation and reconciliation for either performer; the release-time stop mapped to the existing `STOPPED` with a human-owned blocker rather than a new token. Record schema gains action ref, retained intent payload with digest, components, `Attempted`, `PUBLICATION_RESULT` defined as the immutable attempt result, per-read `Reconciliation`, `Intent comparison` and `CURRENT_KNOWN_STATE`; a status table with permitted next behaviour; rules for ancestor-only pushes, mismatched objects, human reports and actor attribution. Approval step 9 persists expected SHA, repository identity, full refs and the approved payload before the human acts and requires observed equality afterwards; step 10 keeps only the concrete reads and cites the skill. Approvals pointer aligned to the stop mapping and to unconfirmed human reports | pipeline, handoff contracts, approval agent, approvals |
| C2 human compliance classified as a technical block; axes mixed; capability claims under-qualified | `HUMAN DECISION` defined as having no enforced effect by itself; `—` legend for no enforced effect; UNVERIFIED moved out of the guarantee-type table as an evidence status; PR-merge tool row qualified to the MCP path on the selected host; ask-rules row qualified to calls actually withheld pending permission; digest comparisons split into the objective operation and the prose assurance it ran; governance row made prose-general with a conditional observed edit-tool block; human-publication default row added with no capability withheld; recording mechanisms given a producer-based type with `OBSERVE-ONLY` as the effect. Write-boundaries §5 aligned cell by cell | harness map, write boundaries |
| C3 false total ordering of provenance; human timing as host telemetry; original `UNKNOWN` attempts conflated with unresolved actions | Labels have no order: a derived value keeps the label of each input (lineage) and states what each supports; "weakest input" removed; "a human with a clock" removed from `OBSERVED_HOST`; human minutes are `HUMAN_RECORDED`; `HUMAN_RECORDED` covers a supplied value as well as a decision and states an asserted source, not authorship; the publication measure split into original-`UNKNOWN` attempts and currently-unresolved actions so a reconciled success stays counted; finding-quality adjudication convention added (`TRUE_POSITIVE` / `FALSE_POSITIVE` exclusive per resolved claim, other labels as coexisting dimensions) | discovery cost |

Kept as written on the review's verdict: approvals policy (apart from the pointer above), team adoption, orchestrator, OPEN-DECISIONS. Design phase closed by the review for the next stage; open questions move to host and runtime observation (`OPEN-DECISIONS.md`, OD-21 to OD-27 and the listed host questions).
