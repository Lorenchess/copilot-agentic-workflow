# Changes

Two records. The first, **Changes from fable-v2**, is the rstack-v2.1 record and is kept as written, including its preservation paragraph, which describes the v2.1 task. The second, **Round 2.2**, lists what this folder changes relative to `../rstack-v2.1`.

## Changes from fable-v2 (rstack-v2.1 record)

This revision is an editable candidate built from the preserved Fable draft and the 44 photographs. It changes the contract where the draft contradicted visible code, and records the runtime work needed to enforce stronger guarantees. It does not claim that the proposed controls already run.

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

Original reconstruction files, Astra reviews and fable-v2 remain unchanged. New files live only in rstack-v2.1. No executable script, generated workplace copy, host setting or installed skill was modified. No build, lint, test, browser, agent evaluation, commit, push or deployment was run for this revision.

## Round 2.2 — changes from rstack-v2.1 (2026-09-17)

Contract text only. No runtime script, host setting or installed file was created or changed, and nothing here has been executed. Finding ids refer to `FABLE-IMPLEMENTATION-REPORT.md`, which gives line references and before/after behavior.

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

Everything outside `fable-v2.2` — original reconstructions, Astra reviews, fable-v2 and rstack-v2.1 — is unchanged; hashes are in `FABLE-CHANGE-MANIFEST.md`. No build, lint, test, browser check, agent evaluation, runtime script, commit, stage, push, merge, installation or host-setting change was made.

## Correction round after the independent review (2026-09-17)

Review verdict CHANGES REQUESTED, findings R22-01 to R22-05. Corrected in place; contract text only; nothing executed. Exact changes, line references and hashes: `FABLE-RESPONSE-2026-09-17-R22.md`. The two records above are unchanged.

| Finding | Correction | Files |
|---|---|---|
| R22-01 immutable manifests named mutable inputs | Tester snapshots every mutable input into `evidence/attempt-<N>/inputs/` before sealing; the packet lists only immutable paths; release re-derives digests there and checks the current candidate.md against its snapshot | handoff contracts, tester, reviewer, approval, write boundaries |
| R22-02 WORKTREE had two next states | Owner decision on OD-18: owner-first at both targets. Both WORKTREE rows, the paragraph and approval's freeze precondition now agree | pipeline, approval |
| R22-03 audit bound to plan by revision only | Audit currency decided by plan sha256 carried in the 1b result envelope, measured by dispatcher and auditor, compared with candidate.md's digest; unobtainable identity stops | pipeline, handoff contracts, orchestrator, auditor, approval |
| R22-04 command templates lost path quoting | Whole script path quoted in every template; note says to keep the quotes | auditor, dev, estate layout, discovery cost |
| R22-05 OD-17 reopened a photographed fact | NO_CLAIM adds no inferred entry in the photographed gate (B3.7, B3.9): recorded as screenshot-supported, hypothetical blocker withdrawn, installed-version correspondence left unverified | harness map, source evidence, open decisions, runtime patch plan |
