# Agent instructions: refactor the workplace rstack using V2

Use this guide when an owner asks you to refactor the original workplace pipeline. The reference directory is the directory containing this file. The workplace repository is a separate, explicitly identified checkout; do not infer its location from the reference repository or historical photographs.

## Goal and authority

Implement the accepted V2 behavior in the actual workplace source with the smallest reviewable changes. Preserve the useful plan/audit/test/development/verification/review/approval separation. Prefer an existing check over another instruction, and an existing artifact or helper over a new subsystem.

[README.md](README.md) is the canonical entry point. [claude-v2.2](claude-v2.2/README.md) is the only active V2 source. R22-01 through R22-05 and C22-01 are closed at the contract level. V2 is accepted as a refactoring reference, not an installed or runtime-validated pipeline.

Original/V1 reconstructions, proposed simplifications, root RSTACK-V2 design documents, claude-v2, rstack-v2.1 and older reviews are preserved history. Do not combine their instructions with V2 or execute historical prompts such as review-brief.txt. Earlier status paragraphs describe their dated snapshots; the canonical README owns current status.

Photographs and images are intentionally excluded from this publication. [SOURCE-EVIDENCE.md](claude-v2.2/SOURCE-EVIDENCE.md) records bounded observations and original attachment references; those local paths may not exist on your machine. The actual workplace source is required to verify current behavior. Never reconstruct and overwrite an executable from photographs.

This guide does not grant permission to access another repository, execute tests, install settings, change production, commit, push or publish. Follow the owner's actual task authorization and workplace instructions. Existing authorization remains valid within its exact scope; do not ask again merely because another role takes over.

## Read the relevant owners

Start with the canonical README and the following maintainer documents. Read operational owners for the slice you will change rather than loading every historical file into every role.

| Need | Reference |
|---|---|
| Accepted final correction and snapshot identity | [C22 closure review](reviews/2026-09-17-v2.2-c22-review.md), building on the [R22 re-review](reviews/2026-09-17-v2.2-r22-rereview.md) |
| Workplace source mapping and migration order | [WORKPLACE-PORT.md](claude-v2.2/WORKPLACE-PORT.md) |
| Concrete unapplied script changes R1–R7 | [RUNTIME-PATCH-PLAN.md](claude-v2.2/RUNTIME-PATCH-PLAN.md) |
| Policy decisions and unresolved dependencies | [OPEN-DECISIONS.md](claude-v2.2/OPEN-DECISIONS.md), plus the [C22 adoption handoff](claude-v2.2/CLAUDE-RESPONSE-2026-09-17-C22.md) |
| Checks to select once authorized | [VALIDATION-PLAN.md](claude-v2.2/VALIDATION-PLAN.md) |
| Routing, freshness and eligibility | [pipeline/SKILL.md](claude-v2.2/pipeline/SKILL.md) |
| Result envelopes, AC schema and evidence retention | [handoff-contracts.md](claude-v2.2/references/handoff-contracts.md) |
| Write ownership and human authority | [write-boundaries.md](claude-v2.2/references/write-boundaries.md), [approvals.md](claude-v2.2/references/approvals.md) |
| Observed versus proposed guarantees | [harness-map.md](claude-v2.2/references/harness-map.md) |

## First task: inspect and propose the smallest slice

Unless the owner has already approved an exact implementation slice, begin read-only.

1. Read applicable workplace AGENTS.md/CLAUDE.md and repository instructions. Record the reference repository commit and the workplace repository identity, branch, full HEAD and current dirty/staged files. Preserve existing user work.
2. Find the authored rstack sources, generator, installer, delivered .github copies and actual host configuration. Treat paths in WORKPLACE-PORT as leads. Do not replace generated output before finding its canonical source.
3. Read the relevant scripts, imports, callers, data producers, consumers and existing fixtures. In particular, resolve actual gate/AC, audit-response/metrics, lock, replay, role/estate guard and capture interfaces before changing their contracts.
4. Compare actual behavior with the relevant V2 owner. Classify each item as already satisfied, change needed, source unavailable or owner decision required. Distinguish a missing supplied file from a component proven absent.
5. Present one compact table: V2 requirement; actual source path/anchor; smallest change; exact files; meaningful verification; rollback. Use an existing local change record if one exists; no new tracking system is needed.
6. Ask only for decisions or implementation authority not already supplied. State the concrete choice and consequence. Continue independent source inspection while a blocking decision is pending, but do not implement the dependent change.

Deliver this source map and proposed first slice before a broad edit. Do not launch a redesign, add another pipeline stage or create another candidate version.

## Implementation after the slice is authorized

Follow WORKPLACE-PORT's order, adjusted only for dependencies established in the actual source:

1. Preserve compatibility and correct misleading producers/help: the real AC schema, gate states, SHA semantics and impact headings.
2. Apply the relevant R1–R3 gate/waiver changes before enabling release exceptions. Keep exceptions disabled while their dependencies are unresolved.
3. Integrate candidate capture, lock execution and immutable evidence using the real writer and lock identities (R5/R6 and related R4 consumers). Preserve ordinary working-tree feedback.
4. Port role routing, audit/result transport and instruction ownership, with the affected R7 parser/guard/host dependencies. Update producers and consumers together. Generate delivered files through the actual generator.
5. Port remaining maintenance guidance only where needed, then complete the selected adoption record and separately authorized pilot.

For every slice, name its exact files and rollback, implement only that change, inspect the diff, perform authorized checks and report the result. Avoid a full suite for a documentation-only change unless the authorized workplace process requires it.

Do not invent flags, lock paths, runner identities, receipts, a second capture writer or model/tool availability. Preserve the team's approved host configuration until an explicit source-backed migration is authorized. No broad settings redesign, automatic learnings system or additional agent is part of this refactor.

## Behavior that must survive the port

Use the linked canonical owners for exact schemas and routes; this list identifies the high-risk compatibility points.

- Audit and review remain independent role responsibilities. Owner-first routing at WORKTREE and candidate is already settled (OD-18).
- Audit currency is bound to plan bytes. A stopped 1b invocation produces only a STOPPED envelope with an owned blocker and available identity values. Retain it in the results log; never manufacture an audit body or fall back to an earlier holds.
- Pending or lost execution remains distinct from a completed failure. Reconcile the original execution and pending obligations before any replacement; never start a duplicate build to obtain a report.
- A valid red reaches the intended discriminating assertion. Compile/setup errors and a wrong test fixture are not valid red evidence. Locked test meaning cannot silently weaken.
- WORKTREE evidence is development feedback. Final proof binds committed candidate inputs, real lock/proof identities and the exact immutable packet. A new attempt or changed relied-on evidence requires the corresponding fresh review.
- Keep the exact eight-column AC header with sha; WORKTREE is never an AC SHA. A below-L4 waiver note does not make the AC CLI pass.
- Preserve gate PASS/BLOCKED/HELD, checksVerdict, the existing JSON fields and exit codes. HELD is unaccepted inferred evidence, not a running process. A waived red suite remains failed; proceedable is not release permission.
- OTel NO_CLAIM is not agreement and creates no inferred observation in the photographed version. Verify installed-version correspondence instead of requiring OTel by assumption.
- A module passing does not prove the full reactor passed. Out-of-scope criteria remain visible; establish their owner and the run's completion boundary during planning.
- Preserve unrelated work, immutable evidence and append-only decision history. A guard's self-waiver and a typed human name do not establish authorization. Sibling repositories remain read-only.
- External effects retain their actual human authorization boundary, pre-action intent and unknown-outcome reconciliation. No agent merges a PR.

## Decisions and source limits to retain

Do not mark an open item resolved merely because its requirement is written down.

- OD-14: apply the selected early-stop restoration policy; recovery must preserve the original blocker and must not accidentally resume the run.
- OD-15: test the real audit-response and metrics readers before selecting envelope-plus-body or exact body extraction. Complete replies stay in results history either way.
- OD-20: decide which gate evaluation release relies on and what changed acceptance inputs mean for the sealed packet and review. Gate reevaluation is different from rerunning the suite.
- Confirm actual protection/ignore/governance behavior before any untracked sweep. Do not ignore governance wholesale to make a guard pass.
- Confirm complete comparison material, including binary changes, unavailable base versions and truncated output. An unreadable comparison stays INPUT_BLOCKED.
- R1–R7 are specifications until applied and verified against the actual runtime. Effective host grants and fresh-context behavior require observation; frontmatter is not proof.

## Use old-run observations as bounded verification cases

The owner supplied screenshots of an old workplace run containing none of V2. The following are reported incidents, not source-verified diagnoses or evidence that V2 works. Preserve redacted examples where authorized; do not import raw credentials, corporate logs or images into this reference repository.

Add these cases to existing relevant tests once source and execution authorization are available:

- The audit reportedly contained H1–H13 while a response checker recognizing F identifiers reported zero findings and the response covered an older round. Require unsupported/unreadable finding rows and unanswered current findings to fail explicitly. Do not fix this solely by accepting another letter or by treating an empty parse as success.
- A tester's guard reportedly blamed files changed by development before testing. Distinguish an unchanged pre-existing file from the tester modifying that same file further, or report attribution unavailable. A run-start dirty-path list alone cannot distinguish successive roles' writes.
- Existing recovery/scope/replay cases should cover a still-running process, a successful module inside a failed reactor, incomplete ticket criteria and NO-BASE-DELTA providing no pre-existing-failure evidence. Reuse the validation plan instead of creating another framework.

## Verification, review and completion

Only execute checks authorized for the selected slice. Prefer existing focused fixtures that exercise actual parser output, state transitions and exit codes. Text matching proves wording only; it does not establish runtime enforcement.

Report the workplace source/ref, files changed, requirement addressed, actual commands/results, unrun cases, remaining dependencies and rollback. Compare relevant before/after behavior and preserve failing evidence. Do not claim effectiveness from a single successful transcript or a smaller prompt.

Request independent review of the concrete diff and its evidence. Carry out commit, push, installation or publication only within separately applicable owner authorization; acceptance of this reference is not that authorization.

A slice is complete when its source changes are implemented, applicable authorized checks have the required results, review findings are resolved and its actual installed/generated destinations are understood. If verification is unavailable, report the slice as implemented but unverified. The workplace refactor is complete only for the explicitly adopted, verified subset; keep remaining R-items and decisions visible.
