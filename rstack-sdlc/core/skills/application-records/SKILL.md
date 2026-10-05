# Application records

Exact formats for the records a role delivers when working on the application. The engine validates each one and runs the application's tests itself; it refuses a record that does not match or that its own run contradicts.

## rstack.app.json — read only

In the application copy. It names the test runner and patterns, the controlled-tests directory, and protected files. No role may change it.

The engine runs the tests with only the variables the runner itself needs and the names listed in `test.env`, if any. No other environment variable reaches a test. A test that needs one that is not listed cannot be made to pass by setting it; say so in your reply instead.

## proof.json — tester

```json
{
  "schema_version": 1,
  "record_type": "proof",
  "criteria": [
    {
      "criterion": "AC-1",
      "route": "RED_GREEN",
      "tests": ["<exact test name>"],
      "rationale": "<why this route, in one sentence>"
    },
    {
      "criterion": "AC-2",
      "route": "ALREADY_SATISFIED",
      "tests": ["<exact test name>"],
      "rationale": "<what exists today and must be preserved>"
    }
  ]
}
```

Rules the engine applies:

- Every acceptance criterion of the specification appears exactly once; no other id appears.
- Each test name is unique and is reported by the test run exactly as written.
- Each named test is a top-level `test('<name>', ...)` in a test file: not inside `describe` or another suite, not a subtest of another test, and with no subtests of its own. The engine sees top-level results only. It refuses a proof that names a suite, a nested test, or a test holding other tests.
- Each named test actually runs: not skipped (`skip`, `it.skip`, `t.skip()`) and not marked TODO. A skipped or TODO test proves nothing and is refused, on either route.
- `RED_GREEN`: against the unchanged application at least one named test fails by a failed assertion. A test that throws another error, or a file that cannot be loaded, is refused.
- `ALREADY_SATISFIED`: against the unchanged application every named test passes.
- Tests outside the proof must pass against the unchanged application.
- Against the candidate, no test may fail, and every named test must run and pass.

## review.json — reviewer

```json
{
  "schema_version": 1,
  "record_type": "review-result",
  "subject": {
    "candidate": "<inputs.candidate>",
    "verification": "<inputs.verification>",
    "spec": "<inputs.spec>",
    "proof": "<inputs.proof>"
  },
  "verdict": "ACCEPT",
  "coverage": [
    { "item": "<what was examined>", "status": "CHECKED", "evidence": "<what you looked at>", "note": "" },
    { "item": "<what was not>", "status": "NOT_CHECKED", "evidence": "", "note": "<why not>" }
  ],
  "findings": [
    {
      "id": "F1",
      "target": "<criterion, file, or behavior>",
      "classification": "BLOCKING",
      "evidence": "<what shows it>",
      "consequence": "<what goes wrong>",
      "resolution": "<the condition that resolves it>"
    }
  ],
  "limitations": ["<what could not be examined>"]
}
```

`verdict` is `ACCEPT`, `REJECT`, or `INCONCLUSIVE`. `ACCEPT` needs at least one `CHECKED` item; `REJECT` needs at least one finding; `INCONCLUSIVE` needs at least one limitation. A `CHECKED` item must have `evidence`; a `NOT_CHECKED` item must have empty `evidence` and a `note`. `classification` is `BLOCKING`, `MAJOR`, or `MINOR`. `findings` may be `[]`.

## pr-review.json — PR reviewer

```json
{
  "schema_version": 1,
  "record_type": "pr-review-result",
  "subject": { "packet": "<inputs.pr_review_packet>", "candidate": "<inputs.candidate>" },
  "verdict": "APPROVE",
  "title": "<one line, at most 120 characters>",
  "summary": "<what was asked for and what changed, at most 1200 characters>",
  "change_analysis": [{ "text": "<what changed and why it matters>", "evidence": ["<identity you read>"] }],
  "testing_analysis": [{ "text": "<what the retained runs establish and leave untested>", "evidence": ["<identity you read>"] }],
  "risks": [{ "text": "<a risk a human reviewer needs to know>", "evidence": [] }],
  "limitations": ["<what you could not examine>"],
  "reviewer_notes": ["<where a human reviewer should look>"],
  "findings": [],
  "coverage": [
    { "item": "intent-fidelity", "status": "CHECKED", "evidence": "<what you looked at>", "note": "" },
    { "item": "measured-change-fidelity", "status": "CHECKED", "evidence": "<what you looked at>", "note": "" },
    { "item": "verification-claims", "status": "CHECKED", "evidence": "<what you looked at>", "note": "" },
    { "item": "technical-review-disclosure", "status": "CHECKED", "evidence": "<what you looked at>", "note": "" },
    { "item": "material-risks", "status": "CHECKED", "evidence": "<what you looked at>", "note": "" },
    { "item": "title-and-scope", "status": "CHECKED", "evidence": "<what you looked at>", "note": "" },
    { "item": "submission-readiness", "status": "CHECKED", "evidence": "<what you looked at>", "note": "" }
  ],
  "evidence_references": ["<every identity you read>"]
}
```

Rules the engine applies:

- `verdict` is `APPROVE`, `REQUEST_CHANGES`, or `INCONCLUSIVE`.
- `coverage` holds the seven items above by exactly these names, each once, plus any item the procedure adds. `APPROVE` needs all seven `CHECKED`.
- `APPROVE` also needs at least one `change_analysis` entry, at least one `testing_analysis` entry, and no `BLOCKING` or `MAJOR` finding. `REQUEST_CHANGES` needs at least one finding, in the `findings` format of `review.json`. `INCONCLUSIVE` needs at least one limitation.
- Every `change_analysis` and `testing_analysis` entry cites at least one identity. `risks` entries may cite none.
- An identity may be cited only if the packet names it, it is the packet, or it is a file of the packet's three trees (`sha256:` followed by the file's hash). Anything else is refused.
- Text fields are plain text with no control characters; `title` is one line. Lists are short: at most 12 `change_analysis` entries and 8 of each other kind, 600 characters each. The whole file is at most 64 KiB.
- There is no field for a path, a count, a command, a test result, another review's verdict, or an authorization. The engine takes those from the retained records; writing them in your text does not change them.

## result.json — every role

Write it last, directly in `work_dir`. Copy each `<envelope.…>` value exactly from your task envelope.

```json
{
  "schema_version": 1,
  "record_type": "role-result",
  "run_id": "<envelope.run_id>",
  "attempt_id": "<envelope.attempt_id>",
  "role": "<envelope.role>",
  "expected_version": <envelope.state_version>,
  "input_digest": "<envelope.input_digest>",
  "outcome": "COMPLETED",
  "summary": "<one or two factual sentences>",
  "outputs": {},
  "files": <envelope.produces>
}
```

- All eleven fields are required, and no others. `schema_version` is the number `1`; `record_type` is exactly `"role-result"`.
- `expected_version` is the envelope's `state_version`, as a number and not as text.
- `files` is the envelope's `produces` object: each record key with the name of the file you wrote in `work_dir`. It is `{}` when `produces` is empty.
- `outputs` is `{}`. `summary` is plain text and not empty.
- `outcome` is always `COMPLETED`. These roles do not use `NEGATIVE`. If you cannot produce a valid result, stop and say why in your reply; do not write a `result.json` that claims otherwise, and do not fill a record with guesses.

## Identities you will see

- A tree identity (`base`, `proof_tree`, `candidate`) names a record listing every file with its hash. It identifies exact content, including uncommitted changes. It is not a commit id.
- An execution record (`proof_baseline`, `verification`) says what command ran, on which tree, in which environment, with which result for each test, and where the raw output is retained.

## Rules for all records

- No fields beyond those shown. Text fields are plain text.
- Identities are copied exactly from the envelope; never retyped from memory.
