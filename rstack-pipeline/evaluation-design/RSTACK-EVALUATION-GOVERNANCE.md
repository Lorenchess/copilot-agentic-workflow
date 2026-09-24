# RSTACK Evaluation Governance

## Purpose

This document defines safety and governance constraints for evaluation-system design.

It is not a substitute for employer information-security, data-retention, model-risk, legal, privacy, or compliance policy.

Where organizational policy is unknown, mark it as an open requirement and obtain the appropriate internal decision.

## Critical repository constraint

This GitHub repository is public.

Therefore this repository must contain only material that is safe for public disclosure, such as:

- generic architecture guidance,
- templates,
- schemas,
- synthetic examples,
- sanitized examples explicitly approved for public use.

Do **not** commit real workplace:

- source code,
- Jira ticket text,
- repository names if confidential,
- internal URLs,
- credentials or tokens,
- model/API secrets,
- screenshots containing internal systems,
- raw agent traces,
- proprietary prompts/instructions,
- employee identifiers,
- production data,
- customer data,
- or security-sensitive configuration.

Real evaluation data belongs in an approved internal storage location.

---

# 1. Separate public design from internal evidence

Use a conceptual split:

```text
PUBLIC REFERENCE REPOSITORY
- schemas
- taxonomies
- templates
- synthetic corpus
- experiment methodology

INTERNAL EVALUATION STORE
- real run manifests
- real traces
- Jira-linked evidence
- source references
- human validation
- cost/usage telemetry
- internal experiment results
```

Do not make the public repository the default persistence location for workplace runs.

---

# 2. Data minimization

Persist only data that supports an explicit evaluation or reproducibility decision.

Before adding a field ask:

1. What decision requires this field?
2. Can a less sensitive identifier provide the same value?
3. Does it need full content or only a hash/reference?
4. How long must it remain available?
5. Who needs to read it?

Examples:

- store a prompt/configuration hash instead of duplicating full prompt text when the source is durably recoverable;
- store an internal artifact reference instead of copying source code into evaluation records;
- store a candidate SHA instead of an entire diff when the approved repository remains available.

---

# 3. Secrets

Never persist:

- API keys,
- access tokens,
- passwords,
- session cookies,
- private keys,
- credential-bearing URLs,
- or raw environment dumps containing secrets

inside evaluation artifacts.

If a trace source may contain secrets, sanitize before persistence or store it only in an approved secret-safe logging system.

---

# 4. Human identity

Evaluation may need to know that a human:

- approved,
- corrected,
- overrode,
- or adjudicated

a decision.

Do not collect more identity information than policy requires.

Possible designs include:

- pseudonymous validator ID,
- authenticated platform actor ID,
- team/role rather than personal identity,

subject to employer policy.

Do not invent a privacy model in the public reference.

---

# 5. Source-code and Jira evidence

Semantic evaluation often requires repository and ticket evidence.

The public design should refer to those via abstract identifiers.

The internal implementation should determine:

- whether raw code may be stored,
- whether Jira text may be copied,
- whether evidence must remain in source systems,
- whether evaluators may receive full artifacts or retrieved excerpts,
- whether data may cross environment boundaries.

These are policy decisions, not prompt-design decisions.

---

# 6. External model/provider use

Before sending internal evaluation evidence to any model/provider, establish:

- the provider is approved,
- the endpoint/environment is approved,
- the data classification is allowed,
- retention/training terms meet organizational requirements,
- access is authenticated and auditable,
- and any region/network restrictions are satisfied.

If this is unknown, treat external semantic evaluation as blocked pending policy clarification.

Do not assume that because a developer can access a model in one tool, the same data may be sent through another API.

---

# 7. Retention

The evaluation system will become more valuable as history grows, but indefinite retention may conflict with policy.

The internal design should define separate retention for:

- run metadata,
- event traces,
- semantic evidence,
- source excerpts,
- AI-judge outputs,
- human labels,
- experiment results.

Where exact retention periods are not supplied, record them as open governance decisions.

Do not invent periods in this public reference.

---

# 8. Immutability and corrections

Preserve auditability without preventing corrections.

For important evaluation records:

- original AI judgment should remain,
- later human correction should append rather than overwrite,
- experiment decisions should preserve prior states,
- external-action attempts and reconciliations should remain traceable.

If data must be deleted for policy reasons, deletion requirements override convenience of historical analysis.

---

# 9. Access control

Internal evaluation data may reveal:

- source architecture,
- defects,
- developer behavior,
- model performance,
- security findings,
- release decisions.

Define least-privilege access.

A dashboard intended for broad engineering use may need aggregated metrics while raw evidence remains restricted.

---

# 10. Metrics and people

Do not use RSTACK evaluation metrics as individual developer performance scoring without explicit organizational policy and human-governance review.

The evaluation system is designed to improve:

- pipeline quality,
- model selection,
- workflow design,
- reliability,
- and developer experience.

Metrics such as human corrections, interruptions, or rework can be heavily confounded by task difficulty and pipeline behavior.

---

# 11. Evaluation of security/compliance findings

AI-judge classifications for security, compliance, or authorization issues should not replace required specialist review or deterministic policy controls.

Use them as triage/evidence only unless organizational policy explicitly authorizes more.

---

# 12. Environment boundary

For every host adapter document:

- where data originates,
- where model inference occurs,
- where traces are stored,
- what credentials are used,
- what external systems are contacted,
- and which boundaries are host-enforced.

Unknown external effects must remain UNKNOWN until reconciled.

---

# 13. Required governance questions before implementation

The evaluation-system design should explicitly surface unresolved questions such as:

- Where may real run data be stored?
- Can source excerpts be persisted?
- Can Jira text be persisted?
- Which model endpoints may process evaluation data?
- Are model prompts/responses retained by the platform?
- What are required retention/deletion periods?
- Who may view raw traces?
- How are human validator identities represented?
- Are experiment results considered internal engineering data?
- What approval is needed before a Bedrock or other API prototype processes real workplace artifacts?

Do not let Claude silently answer these from general knowledge.

---

# 14. Synthetic-first rule

Until governance is established, design and test the evaluation machinery using:

- synthetic Jira tickets,
- toy repositories,
- synthetic Planner/Auditor outputs,
- and sanitized examples.

This allows schema/rubric/tooling work to proceed without moving confidential data.

---

# 15. Governance acceptance

Before real workplace run persistence is enabled, require an internal review of:

- data classification,
- storage,
- access,
- provider usage,
- retention,
- and audit requirements.

This public document should remain a conservative design constraint, not a declaration that any specific internal use is already approved.
