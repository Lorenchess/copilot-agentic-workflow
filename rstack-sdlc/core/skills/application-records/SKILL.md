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
