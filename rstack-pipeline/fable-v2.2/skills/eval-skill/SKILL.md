---
name: eval-skill
description: Screen a proposed instruction change, then evaluate observable behavior under an explicitly authorized comparison.
menu-description: justify and measure a skill change
---

# Evaluate a skill change

This is an optional maintainer workflow, not a ticket gate. Editing a local candidate does not authorize deployment, external writes or running an evaluation. Follow the active task's permission boundaries.

## Screen the change

Before adding instructions:

1. Was the relevant skill actually loaded? A body edit cannot fix a discovery/description failure.
2. Is the rule already present? Prefer clearer placement/removal of contradiction to duplication.
3. Would an existing parser, type, test or narrow check enforce the measurable property more reliably? Route that change to its actual owner; do not add prose to mask it.
4. Is the failure repeated or a demonstrated general contract contradiction? Do not turn one task preference into permanent policy.

Record accepted proposals, rejected proposals and source-dependent code changes with evidence. An owner's existing scoped approval remains valid; do not repeatedly ask for the same authorized edit. Workplace adoption/promotion is a distinct decision.

## Evaluation when explicitly authorized

- Define the behavior and three to six concrete judging criteria before running. Keep rubric and variant identity out of worker inputs.
- Use representative tasks with equivalent source, tools, environment, permissions and budget. Keep input ordering and capture policy consistent.
- Compare current versus proposed instructions using paired/balanced model versions across both arms. Varying models only within one arm confounds model effects with the skill change. Counterbalance order and use repeated runs; report sample size and uncertainty.
- Give workers natural task prompts, not requests to demonstrate compliance or name applied skills. Hide experimental labels and the other arm; do not rename genuine domain files merely because they contain a word such as candidate or test.
- Collect actual host tool-call/results and produced artifacts with protected retention. A citation does not prove a read; a read does not prove application; a file's existence does not prove a command executed.
- Transcript locations in screenshots are host/version-specific leads. Locate actual parent/subagent records and their mapping before judging. If missing, mark read/dispatch/execution claims UNAVAILABLE; observed output properties may still be scored, separately.
- A fresh judge compares both anonymized arms on the same rubric. Distinct model diversity is optional and must be reported, not presumed. Follow actual host/delegation authorization.
- Inspect outcomes yourself. Explain disagreement with the judge; do not promote from one flattering score.

## Promotion

Promote only for the predefined behavioral improvement without unacceptable regressions/cost. Source-size reduction alone is not effectiveness. Store task/variant identities, actual captures, sample size, scores, uncertainty and limitations alongside the proposed change; redact sensitive transcripts.

No evaluation was run by writing this skill. If builds/tests/agent runs were not authorized, deliver the evaluation plan and label behavioral benefit NOT MEASURED. Runtime deployment and Jira/backlog publication require their own authorization.
