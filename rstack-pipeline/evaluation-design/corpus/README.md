# Evaluation Corpus Workspace

This directory is reserved for **synthetic or explicitly approved sanitized evaluation cases**.

Do not commit real employer source code, Jira tickets, internal URLs, credentials, raw workplace traces, or other confidential information here. This repository is public.

See:

- [Golden Evaluation Corpus guide](../RSTACK-GOLDEN-EVAL-CORPUS.md)
- [Evaluation Labeling Guide](../RSTACK-EVALUATION-LABELING-GUIDE.md)
- [Evaluator Calibration](../RSTACK-EVALUATOR-CALIBRATION.md)
- [Evaluation Governance](../RSTACK-EVALUATION-GOVERNANCE.md)

## Suggested future structure

```text
corpus/
  README.md
  synthetic/
    SYN-P-001/
    SYN-A-001/
    SYN-T-001/
  sanitized-approved/
    ...
```

A case should not be considered "gold" until its expected labels have been human-reviewed and its evidence is sufficient for the question being evaluated.

Keep held-out cases separate from examples used to refine prompts.
