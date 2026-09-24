# RSTACK Post-Run Evaluation Workflow

## Purpose

This document defines the operational separation between:

1. **RSTACK execution**, currently performed by the Copilot-based pipeline inside a developer project,
2. **post-run semantic evaluation**, initially performed by Claude Code in a fresh context,
3. **human validation**, applied selectively,
4. and **cross-run analysis**, used to improve the pipeline over time.

This document is part of the evaluation-design guidance. It is not an active runtime contract until the evaluation architecture is reviewed and implementation is explicitly approved.

## Core rule

> **The pipeline that performs the engineering work does not semantically evaluate its own run.**

Copilot/RSTACK may record execution facts and evidence during the run. A separate evaluator, initially Claude Code, judges the completed run afterward.

The evaluator must not alter the evidence it is judging.

---

# 1. Execution ownership

During a normal Jira-to-PR run, the active RSTACK/Copilot pipeline owns execution.

It may create the project's existing run artifacts under the project's .rstack directory, including state, evidence, logs, plans, acceptance-criteria records, candidate information, test evidence, review artifacts, approvals, and other currently defined RSTACK run data.

Conceptually:

~~~text
DEVELOPER PROJECT
└── .rstack/
    └── runs/
        └── <RUN-OR-TICKET-ID>/
            <existing RSTACK execution artifacts>
~~~

The exact existing layout remains authoritative until repository/workplace inspection establishes otherwise.

Do not redesign the run tree merely to match this example.

## Execution-side responsibility

The execution side should:

- perform the workflow,
- preserve existing state/evidence,
- record deterministic facts where practical,
- leave enough information to identify the run and candidate,
- and finish without attempting to grade its own semantic quality.

Examples of appropriate execution-side facts:

- candidate SHA,
- artifact presence,
- test command/result,
- phase transition,
- timestamp,
- approval event,
- tool/host event when actually observable.

Examples of semantic judgments that should not be self-authored by the executing pipeline as evaluation truth:

- "Planner quality was excellent,"
- "Auditor finding was a false positive,"
- "Tester proof was adequate,"
- "Reviewer did a good job."

Those belong to the post-run evaluation boundary.

---

# 2. Run submission / collection

After a run reaches an appropriate terminal or reviewable state, the team provides the completed run package for evaluation.

The submitted package should preserve the original run evidence.

A future internal collection may conceptually organize submissions as:

~~~text
RSTACK-EVALUATIONS/
├── <PROJECT-ID>/
│   └── <RUN-OR-TICKET-ID>/
│       ├── run/
│       │   └── <copied original run evidence>
│       └── evaluation/
│           └── <post-run evaluation outputs>
└── ...
~~~

or may preserve the existing run directory and place the evaluator-owned output directly beside it:

~~~text
<PROJECT>/.rstack/runs/<RUN-ID>/
├── <existing execution artifacts>
└── evaluation/
    <evaluator-owned outputs>
~~~

The final layout must be chosen by the evaluation-system design after inspecting the actual .rstack structure and internal storage constraints.

## Important distinction

The architectural requirement is not a particular directory name.

The requirement is:

~~~text
ORIGINAL EXECUTION EVIDENCE
        !=
POST-RUN EVALUATION OUTPUT
~~~

They must remain distinguishable and independently attributable.

---

# 3. Evidence freeze

Before semantic evaluation starts, the evaluator must identify the exact evidence package it is judging.

At minimum, the design should establish how to bind the evaluation to:

- run ID,
- ticket/work-item ID where applicable,
- project/repository identifier,
- relevant run artifact set,
- base/candidate revision when available,
- pipeline/configuration fingerprint when available,
- and evidence snapshot/fingerprint if needed.

## Evaluator immutability rule

The evaluator must treat original run evidence as read-only.

The evaluator must not:

- repair plan.md,
- rewrite Auditor findings,
- change tests,
- change production code,
- alter run state,
- "clean up" logs,
- update candidate identity,
- rewrite original approval records,
- or normalize old artifacts in place.

If evidence is malformed or incomplete, record that as an evaluation finding or observability limitation.

Do not silently repair the subject before judging it.

---

# 4. Evaluation boundary

Once the run package is frozen:

~~~text
RSTACK/COPILOT EXECUTION
          │
          ▼
   COMPLETED RUN PACKAGE
          │
──────────┼────────────────────
   POST-RUN EVALUATION BOUNDARY
──────────┼────────────────────
          │
          ▼
     CLAUDE CODE
   fresh evaluator context
~~~

Claude Code is initially the preferred semantic evaluator because it is separate from the Copilot execution session and can inspect the completed artifact package independently.

Claude Code is an **evaluator implementation**, not the definition of the evaluation system.

The same contracts should later be usable by:

- Devspace,
- Bedrock,
- another approved model/runtime,
- or a mixed deterministic + AI evaluator service.

---

# 5. Fresh-context requirement

Each post-run semantic evaluation should begin in a fresh evaluation context.

The evaluator may receive:

- the frozen run evidence,
- current evaluation rubrics,
- failure taxonomy,
- labeling guide,
- data dictionary/schema,
- evaluator configuration,
- and explicitly approved supporting evidence.

The evaluator should not rely on:

- the live Copilot conversation,
- prior persuasion from execution agents,
- hidden implementation reasoning,
- informal summaries that are not part of the submitted evidence,
- or previous evaluator conclusions unless the evaluation task explicitly requires them.

If fresh-context isolation cannot be established on the evaluator host, record that limitation.

---

# 6. Evaluator inputs

The evaluator should inspect the minimum evidence necessary for the requested rubric.

Potential evidence includes:

- Planner output,
- Planner claims/evidence,
- Plan Auditor output,
- acceptance criteria,
- Tester proof artifacts,
- test execution evidence,
- Developer implementation/candidate evidence,
- Reviewer findings,
- run/state logs,
- candidate identity,
- human questions/decisions,
- publication/approval records,
- deterministic gate results.

Do not assume all of these exist in every current run.

Missing evidence is an evaluable condition and must remain explicit.

---

# 7. Evaluator outputs

The evaluator may write only to the approved evaluation-owned area for that collected run.

A conceptual shape may be:

~~~text
evaluation/
├── manifest.json
├── planner.json
├── plan-auditor.json
├── tester.json
├── developer.json
├── reviewer.json
└── run-summary.json
~~~

This is illustrative, not a mandated final schema.

The design pass should prefer the smallest normalized artifact set that supports the needed decisions.

Evaluation outputs should preserve:

- evaluator identity/model when observable,
- evaluator configuration/rubric version,
- subject/run binding,
- evidence references,
- classifications,
- materiality,
- resolution,
- provenance,
- uncertainty,
- and later human validation.

---

# 8. No same-run feedback contamination

Post-run evaluator outputs must not influence the already-completed run being judged.

The same run must not do:

~~~text
execute
→ evaluate
→ read its own evaluation
→ change itself
→ claim the changed state was the original run
~~~

If an evaluation identifies a problem, the response happens through a future action:

- a pipeline improvement,
- a new experiment,
- a follow-up ticket,
- a rerun identified as a new run,
- or a human decision.

Never rewrite history.

---

# 9. Human validation

Humans do not need to inspect every evaluated run.

Use selective validation based on criteria defined by the evaluation system, such as:

- high-materiality findings,
- AI-judge disagreement,
- evaluator uncertainty,
- new failure type,
- random quality sample,
- experiment cases,
- suspected evaluator drift,
- pipeline-changing conclusions.

Human validation should append to the evaluation record and preserve the original evaluator judgment.

---

# 10. Cross-run accumulation

Once several evaluated runs exist, aggregate normalized evaluation records across them.

Conceptually:

~~~text
RUN-001/evaluation
RUN-002/evaluation
RUN-003/evaluation
...
        │
        ▼
NORMALIZED CROSS-RUN DATASET
        │
        ▼
trend analysis
failure frequencies
model comparisons
prompt comparisons
workflow experiments
~~~

The first value of the system is not a dashboard.

It is the ability to answer evidence-backed questions across runs.

Examples:

- Which Planner failures recur?
- How often are Auditor findings confirmed?
- Which Reviewer findings cause real corrections?
- How often do humans repair pipeline failures versus make legitimate decisions?
- Which pipeline version reduced a specific failure type?
- Which model/configuration reduces material rework?
- Which stage adds little marginal value?

---

# 11. Improvement loop

The expected RSTACK improvement loop is:

~~~text
completed runs
      ↓
post-run evaluation
      ↓
cross-run evidence
      ↓
identify recurring weakness
      ↓
form a hypothesis
      ↓
make one targeted change
      ↓
run controlled comparison
      ↓
KEEP | REVERT | INCONCLUSIVE
~~~

Do not jump directly from one bad run to a larger prompt.

First classify the failure cause:

- prompt,
- context,
- tool,
- state,
- deterministic control,
- host limitation,
- model capability,
- evaluator weakness,
- or human decision.

Different causes require different interventions.

---

# 12. Initial implementation scope

The first implementation should remain narrow.

Unless repository inspection shows otherwise, start with:

~~~text
run identity
+
configuration fingerprint
+
Planner claims/evidence
+
Plan Auditor findings/evidence
+
finding disposition/materiality
+
resolution
+
human-validation support
~~~

Use the existing run artifacts wherever possible.

Do not instrument Tester, Developer, Reviewer, cost, token usage, dashboards, and every host event simultaneously unless the design demonstrates that they are required for V0.1.

---

# 13. Claude Code operational use

Once the evaluation system is implemented, a typical evaluation invocation should conceptually tell Claude Code:

> Evaluate the submitted RSTACK run using the current approved evaluation rubrics. Treat the original run package as immutable evidence. Start from fresh context. Do not modify production code, tests, run state, or original artifacts. Write only the structured evaluation outputs to the approved evaluation area. Preserve uncertainty and cite the evidence used for each material classification.

The final evaluator prompt/configuration should be versioned and calibrated against the golden corpus before its judgments are used as strong evidence for pipeline changes.

---

# 14. Evaluator replacement / portability

Do not encode the evaluation system so that only Claude Code can perform it.

Keep stable:

- run package semantics,
- rubric semantics,
- taxonomy,
- labels,
- data model,
- provenance,
- output schema,
- calibration method.

Allow the evaluator implementation to change:

~~~text
Claude Code today
      ↓
Devspace later
      ↓
Bedrock evaluator
      ↓
future approved runtime
~~~

A host migration should not invalidate historical evaluation records.

---

# 15. Data location and confidentiality

The public reference repository must not become the storage location for real workplace runs.

Public repository:

- rubric guidance,
- schemas,
- templates,
- synthetic examples,
- sanitized approved examples.

Approved internal environment:

- actual run packages,
- Jira-linked evidence,
- source/repository evidence,
- real evaluation outputs,
- aggregate internal metrics,
- internal experiment results.

Follow RSTACK-EVALUATION-GOVERNANCE.md.

---

# 16. Required design implications

When Claude performs the evaluation-system architecture pass, it must explicitly account for this workflow.

The six design deliverables must answer:

1. How is a completed run declared ready for evaluation?
2. How is its evidence snapshot/fingerprint established?
3. What remains owned by Copilot/RSTACK execution?
4. What is owned by the post-run evaluator?
5. Where are evaluator outputs written?
6. How are original artifacts protected from evaluator mutation?
7. How is fresh evaluator context established or marked unverified?
8. How are multiple evaluated runs normalized for aggregate analysis?
9. How is human validation appended?
10. How can Claude Code later be replaced without changing evaluation semantics?
11. What is the minimal V0.1 implementation?
12. Which parts are KEEP NOW, DEFER, or REJECT?

---

# Success condition

A successful implementation makes this possible:

~~~text
Copilot executes a real RSTACK run
        ↓
team submits the completed .rstack run package
        ↓
Claude Code evaluates it independently
        ↓
evaluation is stored beside the collected run
        ↓
original evidence remains unchanged
        ↓
multiple runs accumulate
        ↓
cross-run evidence identifies a recurring weakness
        ↓
RSTACK change is tested as an experiment
        ↓
KEEP / REVERT / INCONCLUSIVE
~~~

That is the operational bridge between RSTACK execution and evidence-driven pipeline improvement.
