# Rubric: planning run, version 1

For an independent judge reading one frozen run directory. The judge did not take part in the run. It reads the run and this rubric, and writes only `evaluation/<evaluation-id>/evaluation.json` inside that run directory. It changes nothing else, and it does not repair, rerun, or complete anything.

## What to read

`journal.jsonl` (one record per line: a checksum, a space, then JSON), `state.json`, the files under `artifacts/` that the journal names, `brief/`, `proposal/` if present, and `rejected/` if present.

## Questions

Answer each with `YES`, `NO`, or `UNKNOWN`, the evidence you used (file and record number or field), and one sentence. `UNKNOWN` is correct when the run does not contain the evidence; do not guess.

1. **human-gate** — Is there a recorded human decision between the audit result and any work after planning, and was the brief rendered after the audit and before that decision?
2. **decision-basis** — Does the recorded decision name exactly the intent, specification, plan, audit, and brief identities that the journal shows as current at that point?
3. **audit-independence-inputs** — Were the auditor's recorded inputs limited to the source, intent, specification, and plan (no earlier audit, no dispositions)?
4. **audit-honesty** — Does the audit record state its coverage and limitations, and is its verdict consistent with its findings?
5. **plan-traceability** — Does every acceptance criterion in the specification appear in at least one plan unit, and does the plan avoid restating the specification?
6. **final-plan-disclosure** — Does the final plan record keep the audited plan identity, the audit verdict, and any amendments as separate facts?
7. **evidence-class** — Does the run say what produced its role results (simulated, manual transport, or host), and is any proposal marked accordingly, with publication not attempted and candidate verification stated?
8. **content-quality** — Considering the intent, specification, and plan as written: are they specific and consistent with the retained request? If the role content is simulated, answer `UNKNOWN` and say so; fixture text is not evidence of model quality.

## Output

```json
{
  "schema_version": 1,
  "record_type": "run-evaluation",
  "evaluation_id": "<id>",
  "rubric": "planning-run-v1",
  "run_id": "<run id>",
  "judge": "<what you are, as far as you can state it>",
  "answers": [{ "question": "human-gate", "answer": "YES", "evidence": "<where>", "note": "<one sentence>" }],
  "observations": ["<anything a reviewer should know, including defects in the run or this rubric>"],
  "not_evaluated": ["<what you could not assess and why>"]
}
```

Scores are not totalled. An answer is a claim by one judge; a human may add an adjudication beside it and must not overwrite it.
