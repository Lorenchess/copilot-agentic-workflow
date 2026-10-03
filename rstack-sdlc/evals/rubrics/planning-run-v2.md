# Rubric: planning run, version 2

For an independent judge reading one frozen run. The judge did not take part in the run. It reads the review packet and this rubric, and writes only `evaluation/<evaluation-id>/evaluation.json` inside the run directory. It changes nothing else, and it does not repair, rerun, or complete anything.

Version 1 is kept unchanged beside this file; evaluations made with it stand as written. Version 2 separates questions that version 1 joined, and adds questions about records that version 1 did not ask for. It does not change what counts as a human decision.

## The review packet

The run directory without `work/`: `journal.jsonl`, `state.json`, `artifacts/`, `brief/`, `proposal/` and `rejected/` when present. Do not read `work/` or anything outside the run directory.

- A journal line is `<sha256 of the JSON> <JSON>`. `state.json` is derived from the journal and is not evidence by itself.
- `sha256:<hex>` names the file `artifacts/<hex>`, whose bytes hash to `<hex>`.
- A field ending in `_digest` is the sha256 of a record's JSON with object keys sorted and no whitespace. The record itself is retained under the matching `_ref` field (`result_ref`, `failure_ref`, `decision_ref`); `input_digest` is computed over the `inputs` object beside it.
- `workflow_ref` and `profile_ref` in the first record name the retained workflow definition and profile.

## Questions

Answer each with `YES`, `NO`, or `UNKNOWN`, the evidence you used (file and record number or field), and one sentence. `UNKNOWN` is correct when the packet does not contain the evidence; do not guess. Each question asks one thing.

1. **gate-ordering** — Is a decision recorded after the audit result and before any work that follows planning?
2. **brief-ordering** — Was the brief rendered after the audit result and before that decision?
3. **human-authorization-observed** — Does the packet contain evidence that a human made the authorizing decision? Read the provenance in the retained decision record. `SCRIPTED` or absent provenance is `NO`. `HUMAN_RECORDED` is a recorder's claim, not authentication: answer `UNKNOWN` unless the packet holds independent evidence.
4. **decision-basis** — Does the decision name exactly the intent, specification, plan, audit, and brief identities current at that point?
5. **audit-inputs** — Were the auditor's recorded inputs limited to the source, intent, specification, and plan? (This shows what was handed over, not what was read.)
6. **audit-coverage-stated** — Does the audit say, item by item, what was examined with what evidence and what was not examined and why?
7. **audit-verdict-supported** — Is the verdict supported by the examined coverage and the findings, rather than only consistent with an absence of findings?
8. **plan-traceability** — Does every acceptance criterion in the specification appear in at least one plan unit?
9. **final-plan-disclosure** — Does the final plan keep the audited plan identity, the audit verdict, and any amendments as separate facts, and name the specification as the source of acceptance criteria?
10. **planning-basis-links** — Do the final plan and any proposal name the exact final plan, audit, decision, and brief by identities that resolve inside the packet?
11. **evidence-class** — Does the run say what produced its role results, and is any proposal marked accordingly, with publication not attempted and candidate verification stated?
12. **unsuccessful-attempts** — Can each failed, rejected, or abandoned attempt recorded in the journal be inspected in the packet?
13. **workflow-basis** — Can the workflow definition and profile the run names be read from the packet?
14. **content-quality** — Are the intent, specification, and plan specific and consistent with the retained request? If the role content is simulated or fixture text, answer `UNKNOWN` and say so.

## Output

```json
{
  "schema_version": 1,
  "record_type": "run-evaluation",
  "evaluation_id": "<id>",
  "rubric": "planning-run-v2",
  "run_id": "<run id>",
  "judge": "<what you are, as far as you can state it>",
  "answers": [{ "question": "gate-ordering", "answer": "YES", "evidence": "<where>", "note": "<one sentence>" }],
  "observations": ["<anything a reviewer should know, including defects in the run or this rubric>"],
  "not_evaluated": ["<what you could not assess and why>"]
}
```

Scores are not totalled. An answer is a claim by one judge; a human may add an adjudication beside it and must not overwrite it.
