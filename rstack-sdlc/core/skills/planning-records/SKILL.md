# Planning records

Exact formats for the records a planning role delivers. The engine validates each one and refuses a record that does not match; it does not judge whether the content is right.

## intent.md — why

```markdown
# Intent: <short title>
Problem: <what is wrong or missing, for whom>
Outcome: <what should be true afterwards>
Scope: <what is in, what is out>
Source: <which request this comes from and what it confirms>
Open decisions: None.
```

All five labels are required, each once, each starting a line. A field may continue on following lines. If a product behavior is not settled by the request or an owner answer, write the question after `Open decisions:` instead of `None.`; the engine will take it to the owner before any specification is written.

## spec.md — what

```markdown
# Specification: <short title>
Intent: <which intent this answers>
AC-1: <one required, observable behavior>
AC-2: <...>
Exclusion: <what is deliberately not required>
```

At least one `AC-n:` line; ids are unique. Include failure cases and interfaces as criteria. No implementation steps.

## plan.json — how

```json
{
  "schema_version": 1,
  "record_type": "plan",
  "title": "<short title>",
  "source_basis": "<the source locations the plan relies on>",
  "units": [
    {
      "id": "U1",
      "title": "<ordered unit of work>",
      "acceptance_criteria": ["AC-1"],
      "depends_on": [],
      "work": "<what changes>",
      "proof": "<how this unit will be shown to work>"
    }
  ],
  "claims": [{ "id": "C1", "text": "<a material claim>", "evidence": "<what you actually saw>" }]
}
```

Every criterion of the specification must be carried by at least one unit, and no other criterion id may appear. A unit may depend only on units listed before it.

## audit.json

```json
{
  "schema_version": 1,
  "record_type": "audit-result",
  "subject": { "plan": "<inputs.plan>", "spec": "<inputs.spec>" },
  "verdict": "HOLDS",
  "coverage": [
    { "item": "<what was examined>", "status": "CHECKED", "evidence": "<what you looked at>", "note": "" },
    { "item": "<what was not>", "status": "NOT_CHECKED", "evidence": "", "note": "<why not>" }
  ],
  "findings": [
    {
      "id": "F1",
      "target": "<criterion, unit, claim, or omission>",
      "classification": "BLOCKING",
      "evidence": "<what shows it>",
      "consequence": "<what goes wrong>",
      "resolution": "<the condition that resolves it>"
    }
  ],
  "limitations": ["<what could not be checked>"]
}
```

`verdict` is `HOLDS`, `REFUTED`, or `INCONCLUSIVE`. `REFUTED` needs at least one finding; `HOLDS` needs at least one `CHECKED` item; `INCONCLUSIVE` needs at least one limitation. `coverage` must not be empty. A `CHECKED` item must have `evidence`; a `NOT_CHECKED` item must have empty `evidence` and a `note` saying why. `classification` is `BLOCKING`, `MAJOR`, or `MINOR`. `findings` may be `[]`.

## dispositions.json — revision mode only

```json
{
  "schema_version": 1,
  "record_type": "finding-dispositions",
  "audit": "<inputs.prior_audit>",
  "dispositions": [{ "finding_id": "F1", "disposition": "ACCEPTED", "note": "<one or two sentences>" }]
}
```

Exactly one entry per finding of that audit. `disposition` is `ACCEPTED`, `PARTIALLY_ACCEPTED`, or `REJECTED`.

## Rules for all records

- No fields beyond those shown. Text fields are plain text.
- File names are the ones in the envelope's `produces`, written directly in `work_dir`.
- Identities are copied exactly from the envelope; never retyped from memory.
