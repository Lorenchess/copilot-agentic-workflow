# RSTACK Evaluation Data Dictionary

## Status

This is a **provisional semantic dictionary**, not an implementation schema.

Its purpose is to give the evaluation-system designer stable meanings for important fields before JSON schemas, tables, or dashboards are created.

The final design should reuse existing RSTACK fields where compatible.

## Design rules

1. Define meaning before storage format.
2. Missing values are allowed when the host cannot observe them.
3. Never substitute an estimate for an observed value without changing provenance.
4. IDs should be stable within the evaluation system.
5. Configuration fields must be sufficient to attribute experimental differences.
6. Human labels and AI-judge labels must coexist; neither overwrites the other.

---

# Run identity

| Field | Meaning | Suggested type | Source | Mutability | May be absent? |
|---|---|---|---|---|---|
| `run_id` | Immutable identifier for one RSTACK execution | string | RSTACK/controller | immutable | no |
| `work_item_id` | Jira/ticket/work-item identifier or sanitized evaluation case ID | string | tool/human | immutable for run | yes for synthetic cases |
| `repo_id` | Stable repository identifier; avoid confidential names in public datasets | string | tool/config | immutable for run | no for repository tasks |
| `base_revision` | Revision from which the run starts | string | git/tool | immutable | yes if unavailable |
| `candidate_revision` | Exact candidate identity evaluated for final verification/review | string | git/tool | changes only when candidate changes; history should be evented | yes before candidate freeze |
| `branch_ref` | Branch/worktree reference where applicable | string | git/tool | run-scoped | yes |
| `host_id` | Execution host/surface identifier | string | host/config | immutable for invocation | no |
| `pipeline_version` | Version/fingerprint of RSTACK workflow semantics | string | config/repo | immutable for run | no |
| `config_fingerprint` | Fingerprint of the role/model/prompt/skill configuration used | string | deterministic | immutable for run | strongly preferred |
| `experiment_id` | Controlled experiment assignment | string | experiment registry | immutable for run | yes |
| `started_at` | Run start timestamp | timestamp | host/RSTACK | immutable | no |
| `ended_at` | Terminal timestamp | timestamp | host/RSTACK | immutable once terminal | yes until terminal |
| `run_outcome` | Completed/blocked/failed/aborted/etc. | enum | RSTACK | terminal | yes until terminal |

---

# Configuration attribution

| Field | Meaning | Suggested type | Source | Notes |
|---|---|---|---|---|
| `role` | RSTACK role such as Planner/Auditor/Tester/Developer/Reviewer | enum/string | pipeline | use canonical role names |
| `agent_definition_ref` | Version/hash of the agent definition | string | deterministic repo hash | prefer hash/ref over prompt copy |
| `skill_refs` | Relevant loaded skill versions/hashes | array | deterministic/host if observable | do not assume load if host cannot prove |
| `reference_refs` | Relevant reference versions/hashes | array | deterministic/host if observable | distinguish available vs actually loaded |
| `model_provider` | Provider family | string | host/config | UNKNOWN if not provable |
| `model_name` | Actual model identifier used | string | host/config | do not infer from desired frontmatter alone |
| `model_config_ref` | Reasoning/temperature/etc. configuration fingerprint where observable | string | host/config | optional |
| `evaluator_version` | Evaluator implementation/configuration version | string | evaluation system | required for AI-judge comparisons |
| `rubric_version` | Version of rubric used for semantic judgment | string | evaluation system | required for AI-judge comparisons |

---

# Event record

A canonical event should describe an observable state change or action.

| Field | Meaning |
|---|---|
| `event_id` | Unique event identifier |
| `run_id` | Parent run |
| `timestamp` | Event time |
| `event_type` | Stable event category |
| `phase` | RSTACK phase when applicable |
| `role` | Responsible role when attributable |
| `subject_ref` | Candidate/artifact/action the event concerns |
| `payload` | Event-specific structured values |
| `provenance` | How the event was established |
| `source_ref` | Log/tool/artifact that supports the event |

Do not include hidden reasoning/chain-of-thought in event payloads.

---

# Planner claim record

| Field | Meaning |
|---|---|
| `claim_id` | Stable identifier within the run/plan |
| `run_id` | Parent run |
| `plan_ref` | Plan artifact/version |
| `claim_text` | The material claim being evaluated |
| `claim_scope` | What repository/system/snapshot the claim purports to cover |
| `evidence_refs` | Evidence the Planner relied on |
| `planner_label` | fact/assumption/human-decision/etc. if the Planner distinguishes it |
| `evaluation_label` | SUPPORTED/CONTRADICTED/UNSUPPORTED/etc. |
| `materiality` | Consequence if wrong |
| `evaluator_ref` | Judge/human evaluation record |
| `resolution` | What changed after evaluation |

Claims should be material enough to affect planning. Do not explode every sentence into a claim.

---

# Finding record

Use for Plan Auditor and Reviewer findings.

| Field | Meaning |
|---|---|
| `finding_id` | Stable finding ID |
| `run_id` | Parent run |
| `role` | Auditor or Reviewer |
| `subject_ref` | Plan/candidate/artifact being reviewed |
| `finding_text` | Concise asserted issue |
| `finding_type` | CONTRADICTION, UNSUPPORTED_CLAIM, etc. |
| `evidence_refs` | Evidence supporting the finding |
| `disposition` | TRUE_POSITIVE/FALSE_POSITIVE/DUPLICATE/NON_MATERIAL/UNRESOLVED |
| `materiality` | CRITICAL/HIGH/MEDIUM/LOW/UNRESOLVED |
| `resolution` | What happened after the finding |
| `human_validation` | Human confirmation/rejection state |
| `evaluator_ref` | Semantic evaluator metadata |

A finding can be TRUE_POSITIVE and LOW materiality.

---

# Test/proof record

| Field | Meaning |
|---|---|
| `proof_id` | Stable proof unit ID |
| `run_id` | Parent run |
| `ac_refs` | Acceptance criteria this proof targets |
| `test_refs` | Test files/cases/commands |
| `pre_implementation_result` | Result before implementation where required/available |
| `candidate_result` | Result against shipping candidate |
| `discriminating_basis` | Why this proof distinguishes correct from incorrect behavior |
| `environment_ref` | Relevant execution environment |
| `provenance` | Observation source |
| `evaluation_label` | Adequate/gap/unresolved, per final rubric |

Do not infer proof quality from pass/fail alone.

---

# Developer iteration record

| Field | Meaning |
|---|---|
| `iteration_id` | Stable implementation loop ID |
| `run_id` | Parent run |
| `input_failure_refs` | Test/review findings driving the iteration |
| `candidate_before` | Candidate/revision before changes |
| `candidate_after` | Candidate/revision after changes |
| `changed_paths` | Files/areas changed where available |
| `verification_ref` | Evidence produced after the iteration |
| `reason` | Structured reason for another loop |

Do not reward fewer iterations without considering correctness.

---

# Human interaction record

| Field | Meaning |
|---|---|
| `human_event_id` | Stable ID |
| `run_id` | Parent run |
| `interaction_type` | decision/approval/correction/repair/override |
| `subject_ref` | Exact action/candidate/finding/question |
| `decision` | Structured outcome |
| `provenance` | HUMAN_RECORDED or stronger verified receipt |
| `reason_ref` | Optional rationale/evidence |
| `timestamp` | When recorded |

Do not store identity beyond what is permitted by approved internal policy.

---

# AI evaluator record

| Field | Meaning |
|---|---|
| `evaluation_id` | Stable judgment ID |
| `subject_ref` | Claim/finding/test/run being judged |
| `rubric_version` | Exact rubric |
| `evaluator_model` | Actual evaluator model if observable |
| `evaluator_config_ref` | Prompt/config fingerprint |
| `evidence_refs` | Evidence provided to evaluator |
| `classification` | Structured judgment |
| `confidence` | Optional calibrated confidence; do not assume raw self-confidence is probabilistic |
| `explanation` | Concise evidence-linked rationale |
| `timestamp` | Judgment time |
| `human_validation` | Separate later validation |

---

# Provenance field

The final implementation should reuse the active RSTACK provenance vocabulary.

The semantic meaning must distinguish at least:

- observed by host,
- observed by tool,
- deterministically derived,
- reported by agent,
- recorded by human,
- unknown.

If the existing contract uses more precise names, use those instead of creating synonyms.

---

# Null/unknown discipline

A field may be absent because:

- the host does not expose it,
- the event predates instrumentation,
- the field is not applicable,
- collection failed,
- policy prevents collection.

If these reasons matter analytically, encode a separate availability/reason value.

Do not silently convert absent values to zero, false, or "none."

---

# Public-repository constraint

This public repository should contain only the dictionary/schema/templates.

Do not populate example records with confidential workplace:

- source code,
- Jira text,
- repository names,
- internal URLs,
- credentials,
- user identities,
- or raw traces.

Use synthetic/sanitized examples here; store real evaluation records only in an approved internal location.
