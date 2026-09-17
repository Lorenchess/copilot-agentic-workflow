# RSTACK V2 proposed source tree

**Proposal only; source basis `3e9345166cb387824e3cda36fb46ed940dfeea6d`.** This tree targets the repository that actually exists: a Copilot-native reference. It does not pretend the comparison bundle is an installed rstack plugin.

## Legend and scope

- **[KEEP]** Existing path stays; any bounded update is described in the file plan.
- **[MERGED]** Existing path remains as a canonical owner or a smaller consumer after duplicated content is consolidated. This does not mean roles are merged or files renamed.
- **[ARCHIVE]** Existing dated record remains at its current path. For retained normative clauses, its authority transfers only after an explicit supersession map. No historical file is moved, edited or deleted by this review.
- **[NEW]** New file; conditional runtime files require a later approval.
- **[DELETE]** File removal. **No existing source file is proposed for deletion in the initial consolidation.** Duplicate prose is removed from operational consumers after its canonical owner is established.

The file plan lists every tracked file's exact path, dependencies and invariant. Directories remain [KEEP] even when they contain historical records.

## 1. Default V2 repository tree

This complete tracked tree preserves existing paths and history. The important change is **where current rules live**, not a new folder hierarchy.

```text
copilot-agentic-workflow/
├── [KEEP] .github/
│   ├── [KEEP] agents/
│   │   ├── [MERGED] adversary.agent.md
│   │   ├── [MERGED] developer.agent.md
│   │   ├── [MERGED] intake.agent.md
│   │   ├── [MERGED] pipeline.agent.md
│   │   ├── [MERGED] planner.agent.md
│   │   ├── [MERGED] pr.agent.md
│   │   ├── [MERGED] tester.agent.md
│   │   ├── [MERGED] verifier.agent.md
│   │   └── [MERGED] workspace.agent.md
│   ├── [KEEP] copilot-instructions.md
│   ├── [KEEP] pipeline/
│   │   ├── [MERGED] AGENT-CONTRACTS.md
│   │   ├── [MERGED] FLOW.md
│   │   ├── [MERGED] GUARDRAILS.md
│   │   ├── [MERGED] HARNESS.md
│   │   └── [MERGED] MODEL-ROLES.md
│   └── [KEEP] skills/
│       ├── [KEEP] challenge-plan/
│       │   └── [KEEP] SKILL.md
│       ├── [KEEP] discover-affected-projects/
│       │   └── [KEEP] SKILL.md
│       ├── [KEEP] gather-jira-context/
│       │   └── [KEEP] SKILL.md
│       ├── [KEEP] implementation-quality/
│       │   └── [MERGED] SKILL.md
│       ├── [KEEP] pipeline/
│       │   └── [MERGED] SKILL.md
│       ├── [KEEP] plan-grounding/
│       │   └── [MERGED] SKILL.md
│       └── [KEEP] test-contract/
│           └── [MERGED] SKILL.md
├── [KEEP] .gitignore
├── [KEEP] .vscode/
│   ├── [KEEP] extensions.json
│   └── [KEEP] settings.json
├── [KEEP] docs/
│   ├── [KEEP] COMPARISON-GUIDE.md
│   ├── [KEEP] CORPORATE-ADOPTION.md
│   ├── [KEEP] CORPORATE-KNOWLEDGE-STARTER.md
│   ├── [KEEP] CORPORATE-PIPELINE-INVESTIGATION-PROMPT.md
│   ├── [KEEP] END-TO-END-REFERENCE-TRACE.md
│   ├── [KEEP] examples/
│   │   ├── [KEEP] PAYMENTS-12345/
│   │   │   ├── [ARCHIVE] ADVERSARY-REVIEW.md
│   │   │   ├── [ARCHIVE] IMPLEMENTATION.md
│   │   │   ├── [ARCHIVE] INTAKE.md
│   │   │   ├── [ARCHIVE] PLAN.md
│   │   │   ├── [ARCHIVE] PR-DESCRIPTION.md
│   │   │   ├── [ARCHIVE] PR.md
│   │   │   ├── [ARCHIVE] README.md
│   │   │   ├── [ARCHIVE] RED-REPORT.md
│   │   │   ├── [ARCHIVE] RUN.md
│   │   │   ├── [ARCHIVE] TEST-CONTRACT.md
│   │   │   ├── [ARCHIVE] VERIFICATION.md
│   │   │   └── [ARCHIVE] WORKSPACE.md
│   │   ├── [KEEP] PAYMENTS-12345-planning/
│   │   │   ├── [ARCHIVE] ADVERSARY-REVIEW.md
│   │   │   ├── [ARCHIVE] INTAKE.md
│   │   │   ├── [ARCHIVE] PLAN.md
│   │   │   ├── [ARCHIVE] README.md
│   │   │   └── [ARCHIVE] RUN.md
│   │   ├── [KEEP] PAYMENTS-12345-testing/
│   │   │   ├── [ARCHIVE] DIFF-EXCERPTS.md
│   │   │   ├── [ARCHIVE] IMPLEMENTATION.md
│   │   │   ├── [ARCHIVE] PLAN.md
│   │   │   ├── [ARCHIVE] README.md
│   │   │   ├── [ARCHIVE] RED-REPORT.md
│   │   │   ├── [ARCHIVE] RUN.md
│   │   │   ├── [ARCHIVE] SOURCE-EXCERPTS.md
│   │   │   ├── [ARCHIVE] TEST-CONTRACT.md
│   │   │   ├── [ARCHIVE] TEST-REVIEW.md
│   │   │   └── [ARCHIVE] VERIFICATION.md
│   │   └── [KEEP] PAYMENTS-12410/
│   │       ├── [ARCHIVE] ADVERSARY-REVIEW.md
│   │       ├── [ARCHIVE] IMPLEMENTATION.md
│   │       ├── [ARCHIVE] INTAKE.md
│   │       ├── [ARCHIVE] PLAN.md
│   │       ├── [ARCHIVE] README.md
│   │       ├── [ARCHIVE] RED-REPORT.md
│   │       ├── [ARCHIVE] RUN.md
│   │       ├── [ARCHIVE] SOURCE-EXCERPTS.md
│   │       ├── [ARCHIVE] TEST-CONTRACT.md
│   │       ├── [ARCHIVE] TEST-REVIEW.md
│   │       └── [ARCHIVE] VERIFICATION.md
│   ├── [ARCHIVE] HARNESS-ALIGNMENT-SUMMARY.md
│   ├── [KEEP] HARNESS-LEDGER.md
│   ├── [ARCHIVE] KNOWLEDGE-LAYER-SUMMARY.md
│   ├── [KEEP] questions.md
│   ├── [KEEP] reviews/
│   │   ├── [ARCHIVE] 2026-09-10-phase-1-final-closure-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-1-r2-r3-closure-review-03d4230.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-1-remediation-closure-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-2-architecture-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-2-implementation-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-2-targeted-correction-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-3-architecture-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-3-c1-correction-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-3-c1-implementation-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-3-c2-correction-scope-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-3-c2-implementation-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-3-c2-targeted-closure-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-3-contract-review.md
│   │   ├── [ARCHIVE] 2026-09-10-phase-3-contract-revision-2-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-3-c2-checkpoint-confirmation.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-3-c2-final-closure-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-3-c2-second-correction-scope-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-3-closure-actions-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-3-final-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-3-publication-confirmation.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-4-architecture-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-4-contract-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-4-contract-revision-2-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-4-final-implementation-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-4-p4-c1-implementation-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-4-p4-c2-implementation-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-4-publication-confirmation.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-5-architecture-acceptance.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-5-closure-actions-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-5-final-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-5-p5-c1-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-5-p5-c2-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-5-p5-c3-review.md
│   │   ├── [ARCHIVE] 2026-09-11-phase-5-publication-confirmation.md
│   │   ├── [ARCHIVE] 2026-09-11-reference-efficiency-and-audit-review.md
│   │   ├── [ARCHIVE] 2026-09-14-harness-alignment-analysis-and-implementation-plan.md
│   │   ├── [ARCHIVE] 2026-09-14-harness-implementation-review.md
│   │   └── [ARCHIVE] 2026-09-14-harness-targeted-correction-review.md
│   ├── [KEEP] RUN-AUDIT-AND-IMPROVEMENT.md
│   └── [KEEP] specs/
│       ├── [ARCHIVE] 2026-09-09-phase-1-core-pipeline-design-contract.md
│       ├── [ARCHIVE] 2026-09-10-phase-2-planning-quality-architecture-proposal.md
│       ├── [ARCHIVE] 2026-09-10-phase-2-planning-quality-contract.md
│       ├── [ARCHIVE] 2026-09-10-phase-3-test-contract-integrity-architecture-proposal.md
│       ├── [ARCHIVE] 2026-09-10-phase-3-test-contract-integrity-contract.md
│       ├── [ARCHIVE] 2026-09-11-phase-4-implementation-quality-architecture-proposal.md
│       ├── [ARCHIVE] 2026-09-11-phase-4-implementation-quality-contract.md
│       ├── [ARCHIVE] 2026-09-11-phase-5-delivery-adoption-contract.md
│       ├── [ARCHIVE] 2026-09-13-harness-engineering-alignment-proposal.md
│       ├── [ARCHIVE] 2026-09-14-harness-execution-observation-amendment.md
│       ├── [ARCHIVE] 2026-09-14-harness-run-summary-and-lesson-note-patch.md
│       ├── [ARCHIVE] 2026-09-14-persistent-knowledge-layer-architecture-investigation.md
│       ├── [ARCHIVE] 2026-09-14-persistent-knowledge-layer-investigation-artifact.md
│       └── [KEEP] archive/
│           ├── [ARCHIVE] 2026-09-09-phase-1-architecture-contract.md
│           ├── [KEEP] c0-pipeline-docs/
│           │   ├── [ARCHIVE] decisions.md
│           │   └── [ARCHIVE] phase-1-contract.md
│           └── [ARCHIVE] README.md
├── [ARCHIVE] Fable_Harness_Reconciliation_Review.md
├── [ARCHIVE] Official_References_Pipeline_Recommendations.md
└── [KEEP] README.md
```

The active pipeline directory remains:

```text
.github/pipeline/ [KEEP]
├── AGENT-CONTRACTS.md [MERGED]  mode inputs/outputs/ownership + artifact schemas
├── FLOW.md [MERGED]            sole transition, gate, loop and recovery contract
├── GUARDRAILS.md [MERGED]      trust, external actions and honest host limits
├── HARNESS.md [MERGED]         optional authority index + explicit supersession map
└── MODEL-ROLES.md [MERGED]     human model policy and deferred measurements
```

Keep the seven skills and nine agent definitions. Entry parsing stays in the pipeline skill; engineering methods stay in their policy skills; agent frontmatter remains the actual configured tool list. The Verifier may gain separate execution and fresh-review invocations only after the owner accepts that dispatch change.

## 2. Review/comparison directory

The existing comparison bundle remains inactive and ignored by the current `.gitignore`. [NEW] below identifies the only additions authorized in this review. No comparison file is installed into `.github/`.

```text
rstack-pipeline/ [KEEP]
├── README.md [KEEP]
├── review-brief.txt [KEEP]
├── RSTACK-V2-ARCHITECTURE-REVIEW.md [NEW]
├── RSTACK-V2-FILE-PLAN.md [NEW]
├── RSTACK-V2-TREE.md [NEW]
├── RSTACK-V2-DECISIONS.md [NEW]
├── agents/ [KEEP]
│   ├── rstack-approval.original-from-screenshots.md [KEEP]
│   ├── rstack-approval.proposed-simplified.md [KEEP]
│   ├── rstack-dev.original-from-screenshots.md [KEEP]
│   ├── rstack-dev.proposed-simplified.md [KEEP]
│   ├── rstack-orchestrator.original-from-screenshots.md [KEEP]
│   ├── rstack-orchestrator.proposed-simplified.md [KEEP]
│   ├── rstack-plan-auditor.original-from-screenshots.md [KEEP]
│   ├── rstack-plan-auditor.proposed-simplified.md [KEEP]
│   ├── rstack-planner.original-from-screenshots.md [KEEP]
│   ├── rstack-planner.proposed-simplified.md [KEEP]
│   ├── rstack-reviewer-architect.original-from-screenshots.md [KEEP]
│   ├── rstack-reviewer-architect.proposed-simplified.md [KEEP]
│   ├── rstack-tester.original-from-screenshots.md [KEEP]
│   ├── rstack-tester.proposed-simplified.md [KEEP]
├── pipeline-skill/ [KEEP]
│   ├── pipeline-skill.original-from-screenshots.md [KEEP]
│   ├── pipeline-skill.proposed-simplified.md [KEEP]
└── references/ [KEEP]
    ├── approvals-reference.original-from-screenshots.md [KEEP]
    ├── approvals-reference.proposed-simplified.md [KEEP]
    ├── discovery-cost.original-from-screenshots.md [KEEP]
    ├── discovery-cost.proposed-simplified.md [KEEP]
    ├── estate-instructions.template.original-from-screenshots.md [KEEP]
    ├── estate-instructions.template.proposed-simplified.md [KEEP]
    ├── estate-layout.original-from-screenshots.md [KEEP]
    ├── estate-layout.proposed-simplified.md [KEEP]
    ├── handoff-contracts.original-from-screenshots.md [KEEP]
    ├── handoff-contracts.proposed-simplified.md [KEEP]
    ├── harness-map.original-from-screenshots.md [KEEP]
    ├── harness-map.proposed-simplified.md [KEEP]
    ├── instruction-precedence.original-from-screenshots.md [KEEP]
    ├── instruction-precedence.proposed-simplified.md [KEEP]
    ├── learnings.original-from-screenshots.md [KEEP]
    ├── learnings.proposed-simplified.md [KEEP]
    ├── plan-interview.original-from-screenshots.md [KEEP]
    ├── plan-interview.proposed-simplified.md [KEEP]
    ├── risk-tiers.original-from-screenshots.md [KEEP]
    ├── risk-tiers.proposed-simplified.md [KEEP]
    ├── rstack-process.instructions.original-from-screenshots.md [KEEP]
    ├── rstack-process.instructions.proposed-simplified.md [KEEP]
    ├── team-adoption.original-from-screenshots.md [KEEP]
    ├── team-adoption.proposed-improved.md [KEEP]
    ├── write-boundaries.original-from-screenshots.md [KEEP]
    └── write-boundaries.proposed-improved.md [KEEP]
```

## 3. Conditional executable extension

**This is not part of the default tree, not existing code, and not authorized implementation.** Prefer reusing the organization's runtime. Only if the owner explicitly chooses to supply executable checks here:

```text
.github/pipeline/
└── runtime/ [NEW, conditional]
    ├── check.mjs [NEW, conditional]
    ├── capture.mjs [NEW, conditional only if trusted capture is not supplied by host]
    └── check.test.mjs [NEW, conditional with actual evaluator implementation]
```

`check.mjs` would own objective data/identity/precondition checks in one module, without a second schema/registry/generator stack. `capture.mjs` would provide attributable execution receipts only inside a proven host boundary. The tests would exercise negative invariants, not mirror implementation or test reversible documentation edits.

A filesystem/credential boundary, independent dispatch identity and guarded publisher still belong to the host. Their source is absent here; no invented corporate adapter filename is shown. Adding these three files alone would not establish write prevention, trusted human authorization or tamper-resistant execution evidence.

## 4. Runtime artifacts: retain decision ownership first

This is a proposed artifact view, not directories created by this review. Names and ownership stay compatible with the actual reference while duplicate human summaries become derived. No `.rstack/` state is added.

```text
.pipeline/ [KEEP, runtime-only and ignored]
└── runs/ [KEEP]
    └── <PRIMARY>/ [KEEP]
        ├── RUN.md [KEEP]              scope/decisions/revisions; summaries derived
        ├── INTAKE.md [KEEP]           original requirement provenance
        ├── WORKSPACE.md [KEEP]        preparation + publication intent/results
        ├── PLAN.md [KEEP]             approved behavior and proof boundaries
        ├── ADVERSARY-REVIEW.md [KEEP]  plan review at exact revision
        ├── TEST-CONTRACT.md [KEEP]    proof map + controlled paths + anchor lineage
        ├── RED-REPORT.md [KEEP]       attributable before-implementation evidence
        ├── TEST-REVIEW.md [KEEP]      independent test adequacy decision
        ├── IMPLEMENTATION.md [KEEP]   bounded attempts + claims for reconciliation
        ├── VERIFICATION.md [KEEP]     candidate-bound execution/review outcome
        ├── PR-DESCRIPTION.md [KEEP]   exact content approved by human
        └── PR.md [KEEP]               PR intent/identity/result/recovery
```

Raw execution/host receipts remain in approved private evidence storage. Their exact host storage path is not specified by this repository. Evidence references must identify retained receipts; a path string is not proof the host captured or preserved them.

## 5. Historical rationale and intentional deletions

| Content | Destination / disposition |
|---|---|
| Accepted old requirements and amendment rationale | Existing exact `docs/specs/` paths [ARCHIVE]; current authority mapped in HARNESS before removing historical precedence |
| Dated findings and review outcomes | Existing exact `docs/reviews/` paths [ARCHIVE]; no rewriting |
| General reusable maintenance lesson | Existing `docs/HARNESS-LEDGER.md` [KEEP], through owner review |
| Fictional examples and invariant scenarios | Existing `docs/examples/` paths [ARCHIVE]; do not relabel as executed tests |
| New V2 tradeoffs | `rstack-pipeline/RSTACK-V2-DECISIONS.md` [NEW], proposed until accepted |
| Duplicate current algorithms/templates | [DELETE] duplicated **sections only**, after moving authority; no file deletion |
| Automatic runtime memory, metrics daemon, estate installer, generated agents copied from the bundle | [DELETE] from the **proposed adoption scope**, not from this repository; these implementations are absent |

No new “design history” directory is necessary. The existing historical record already serves that purpose; creating another archive would add an authority problem while leaving the original one unresolved.

## 6. Source-selection stop

Do not apply this tree to a separate rstack plugin without first obtaining that plugin's exact source tree and generator inputs. This checkout cannot justify deleting its missing scripts, changing its installed configuration, or asserting what its invariant tests currently enforce.

