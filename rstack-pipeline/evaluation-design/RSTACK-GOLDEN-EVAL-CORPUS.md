# RSTACK Golden Evaluation Corpus

## Purpose

The golden corpus is a curated set of representative, labeled RSTACK cases used to:

- calibrate AI evaluators,
- regression-test pipeline changes,
- compare models/prompts,
- and prevent optimization only against recent anecdotal failures.

This file defines the corpus policy and index structure.

It does **not** contain real workplace data.

## Public-repository warning

This repository is public.

Do not commit employer source code, Jira tickets, internal repository names, credentials, internal URLs, proprietary traces, screenshots, or other confidential information.

Real workplace cases should be kept in an approved internal evaluation store.

This public corpus may contain:

- synthetic cases,
- deliberately constructed toy repositories,
- sanitized examples that have been approved for public use,
- and metadata/templates describing internal cases without exposing their content.

---

# What makes a case "golden"

A golden case should have:

1. a stable input/snapshot,
2. a clear evaluation question,
3. enough evidence to adjudicate the important labels,
4. human-reviewed expected labels,
5. known ambiguity recorded explicitly,
6. configuration/version metadata,
7. and a reason the case is representative.

Do not call a case golden merely because one judge model labeled it.

---

# Initial case families

Build the corpus from multiple failure and success families.

## Planning

- supported plan with no material audit correction,
- unsupported negative claim,
- directly contradicted claim,
- material dependency omission,
- human decision incorrectly assumed,
- correct explicit uncertainty.

## Plan Auditor

- valid contradiction,
- valid unsupported-claim finding,
- Auditor false positive,
- design disagreement that should not block,
- snapshot mismatch,
- duplicate/non-material finding.

## Testing

- discriminating red-first proof,
- test that passes before implementation unexpectedly,
- test that reaches code but does not prove AC,
- missing AC coverage,
- attempted test weakening.

## Development

- clean first implementation,
- out-of-scope change,
- regression,
- wrong-lane test change,
- repeated rework caused by implementation defect.

## Review

- real semantic defect caught,
- test gap caught,
- false-positive review finding,
- stale-candidate review,
- issue missed by review and discovered later.

## Workflow/reliability

- candidate changed and evidence correctly invalidated,
- stale evidence incorrectly accepted,
- unknown external effect correctly reconciled,
- blind retry/duplicate side effect,
- necessary human decision,
- human repair caused by pipeline failure.

Include successful/clean cases so evaluators are not trained to always find a defect.

---

# Case index

The actual index should use non-sensitive IDs.

| Case ID | Family | Primary labels | Difficulty | Source type | Human-reviewed? | Held out? | Notes |
|---|---|---|---|---|---|---|---|
| SYN-P-001 | Planning | UNSUPPORTED | medium | synthetic | pending | no | placeholder |
| SYN-A-001 | Auditor | FALSE_POSITIVE | medium | synthetic | pending | no | placeholder |
| SYN-T-001 | Testing | TEST_PROOF_GAP | medium | synthetic | pending | no | placeholder |
| SYN-W-001 | Workflow | STALE_EVIDENCE | high | synthetic | pending | yes candidate | placeholder |

These rows are placeholders for corpus construction, not completed gold cases.

---

# Case package

Each case should eventually contain or reference:

```text
case.json
input/
expected/
evidence/
notes.md
```

The exact structure belongs to the evaluation-system design.

A case manifest should be able to identify:

- case ID,
- task description,
- repository/snapshot reference,
- applicable RSTACK phase,
- evidence available to the subject agent,
- evidence available to evaluator,
- expected categorical labels,
- materiality,
- known ambiguity,
- human validator record,
- whether the case is training/dev/held-out.

---

# Held-out discipline

Do not repeatedly use every golden case while refining prompts.

Maintain separate groups such as:

- development cases,
- calibration cases,
- held-out regression cases.

The held-out group should not be exposed to the prompt-refactoring agent as a source of answers.

Otherwise the pipeline may simply overfit known examples.

---

# Human adjudication

For a case to become gold:

- at least one qualified human should review the evidence and label,
- difficult/ambiguous cases should receive a second review where practical,
- disagreements should be preserved,
- and unresolved cases should remain `UNRESOLVED` rather than forced into a binary label.

The corpus should include ambiguity intentionally; a reliable evaluator must know when evidence is insufficient.

---

# Case selection

Prefer cases that are:

- representative of repeated failure modes,
- materially consequential,
- discriminating between competing pipeline configurations,
- and understandable from preserved evidence.

Avoid a corpus dominated by:

- easy syntax failures,
- one specific repository pattern,
- one model's known mistakes,
- only negative cases,
- or cases hand-selected because a desired treatment wins.

---

# Growth policy

Add cases when:

- a new recurring failure mode appears,
- an evaluator repeatedly misclassifies a pattern,
- a host migration introduces a new meaningful failure surface,
- or a pipeline change exposes a gap in the benchmark.

Do not automatically add every production incident.

The corpus should remain curated enough that humans can understand what each case tests.
