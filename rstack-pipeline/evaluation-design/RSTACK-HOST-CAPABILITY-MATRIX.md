# RSTACK Host Capability Matrix

## Purpose

This matrix prevents the evaluation architecture from assuming that every execution host exposes the same controls or telemetry.

It is deliberately conservative.

A capability is not considered available for evaluation simply because:

- a reference document describes it,
- another host supports it,
- an agent claims it happened,
- or a similar product surface supports it.

The active host must establish the capability with direct evidence.

## Status vocabulary

- `CONFIRMED_CURRENT_USE` — observed in the active project/environment and sufficient for the stated use.
- `REFERENCE_DECLARED` — the RSTACK reference expects or describes the capability, but workplace/runtime validation is still required.
- `TO_VERIFY` — likely relevant; run an explicit host probe before relying on it.
- `PARTIAL` — some of the capability exists, but not enough to claim the full guarantee.
- `UNKNOWN` — no sufficient evidence yet.
- `NOT_REQUIRED` — not needed for that host role.
- `NOT_TARGET` — the host is not intended to provide this capability.

Do not promote a cell without recording the evidence that justified the promotion.

## Current host roles

### GitHub Copilot host

Current developer-facing host for the RSTACK pilot/reference work.

The evaluation architecture must not assume that every Copilot surface, IDE, extension version, or enterprise policy exposes identical behavior.

### Claude Code

Useful current development/evaluation environment.

Treat it as an analysis and experimentation host, not as a permanent architectural dependency.

### Devspace

Potential managed execution host.

Capabilities must be discovered from the actual environment rather than inferred from Claude Code documentation or behavior elsewhere.

### Bedrock / notebook lab

Potential evaluation and experimentation environment.

Use it initially as a controlled lab unless/until an approved production architecture and required controls are established.

---

# Capability matrix

The cells below are intentionally starting statuses, not final product claims.

| Capability | Copilot host | Claude Code | Devspace | Bedrock / notebook lab |
|---|---|---|---|---|
| Repository read | CONFIRMED_CURRENT_USE | CONFIRMED_CURRENT_USE for development use | TO_VERIFY | TO_VERIFY |
| Repository write | CONFIRMED_CURRENT_USE but policy/approval semantics vary | CONFIRMED_CURRENT_USE for development use | TO_VERIFY | NOT_TARGET initially |
| Custom role/agent definitions | REFERENCE_DECLARED / current project use | TO_VERIFY exact portability | TO_VERIFY | application-defined if built |
| Role-specific tool exposure | REFERENCE_DECLARED; host enforcement must be validated | TO_VERIFY | TO_VERIFY | application-defined if built |
| Fresh-context subagent isolation | TO_VERIFY | TO_VERIFY | TO_VERIFY | application-defined if built |
| Per-role model selection | PARTIAL / host-dependent | TO_VERIFY | TO_VERIFY | likely application-defined; verify allowed models |
| Hook/lifecycle events | REFERENCE_DECLARED / surface-dependent | TO_VERIFY | TO_VERIFY | application-defined if built |
| Pre-action blocking | TO_VERIFY exact semantics | TO_VERIFY | TO_VERIFY | application-defined if built |
| Post-action observation | TO_VERIFY | TO_VERIFY | TO_VERIFY | application-defined if built |
| Tool-call trace | PARTIAL / host-dependent | TO_VERIFY | TO_VERIFY | application-defined if instrumented |
| Agent-start/stop trace | TO_VERIFY | TO_VERIFY | TO_VERIFY | application-defined if instrumented |
| Exact prompt/context capture | UNKNOWN / avoid assuming | TO_VERIFY | TO_VERIFY | application-defined if permitted |
| Exact token usage | UNKNOWN / host-dependent | TO_VERIFY | TO_VERIFY | TO_VERIFY via provider/runtime telemetry |
| Exact model cost | UNKNOWN / host-dependent | TO_VERIFY | TO_VERIFY | TO_VERIFY via provider/runtime telemetry |
| Phase timing | can be RSTACK-observed if instrumented | can be RSTACK-observed if instrumented | TO_VERIFY | application-defined if instrumented |
| File-change observation | PARTIAL; repository/tool evidence available | PARTIAL; repository/tool evidence available | TO_VERIFY | only if repository execution is added |
| Strong filesystem isolation | TO_VERIFY | TO_VERIFY | TO_VERIFY | application/deployment-defined |
| Durable run state across process loss | REFERENCE_DECLARED through artifacts, not assumed as host primitive | UNKNOWN | TO_VERIFY | application-defined if built |
| Authenticated human approval receipt | TO_VERIFY | TO_VERIFY | TO_VERIFY | application-defined if integrated |
| Jira read/write | host/tool integration dependent | tool/integration dependent | TO_VERIFY | API/integration dependent |
| PR/repository publication | host/tool integration dependent | tool/integration dependent | TO_VERIFY | NOT_TARGET initially |
| External action reconciliation | RSTACK contract can require it; host observation varies | RSTACK contract can require it | TO_VERIFY | application-defined if built |
| Central aggregate evaluation store | not assumed | not assumed | TO_VERIFY | candidate lab capability; design separately |

"Application-defined if built" means the capability is under the control of a future custom runtime, not that it currently exists.

---

# Evidence required to promote a capability

For each host capability, capture:

- host/surface name,
- IDE/client if applicable,
- host version,
- extension/runtime version if available,
- date tested,
- exact probe,
- expected result,
- observed result,
- evidence reference,
- guarantee type,
- limitations.

Use a record like:

```text
Capability: fresh-context subagent isolation
Host: <host/surface>
Status before: TO_VERIFY
Probe: <reproducible test>
Observed: <fact>
Evidence: <artifact/log/reference>
Limitations: <known gaps>
Status after: PARTIAL | CONFIRMED_CURRENT_USE
```

## Guarantee type

When useful, pair capability status with the current RSTACK guarantee vocabulary, for example:

- host-enforced,
- deterministic check,
- detect-after,
- observe-only,
- prose contract.

Do not call observe-only behavior a preventive boundary.

---

# Priority host probes

The evaluation design should prioritize probes that affect whether metrics can be trusted.

## 1. Agent identity and role attribution

Can the host prove which role produced a specific event/artifact/tool call?

If not, role-level metrics may need to be artifact-based rather than event-based.

## 2. Model identity

Can the host establish the actual model used for a role/run?

If not, model-comparison experiments cannot claim strong attribution.

## 3. Fresh-context behavior

Can the host establish that Auditor/Reviewer received a fresh context rather than inherited conversation state?

If not, record freshness as host-dependent rather than verified.

## 4. Tool/action observation

Can RSTACK observe tool invocation and result reliably enough to distinguish:

- requested,
- attempted,
- succeeded,
- failed,
- unknown?

## 5. Timing

Can phase start/end be captured from RSTACK-owned events even if provider timing is unavailable?

## 6. Token/cost telemetry

Can the host provide actual usage/cost?

If not, omit or mark unavailable. Do not estimate and present as observed.

## 7. Human approval provenance

Can the host produce a receipt binding:

- actor,
- action,
- target,
- candidate,
- decision,
- timestamp?

If not, distinguish HUMAN_RECORDED from stronger authenticated authorization.

---

# Adapter rule

Canonical evaluation records should be host-neutral.

A host adapter may populate additional fields, but should not change the meaning of:

- run identity,
- candidate identity,
- claim/finding labels,
- evidence provenance,
- materiality,
- resolution,
- human validation,
- experiment assignment.

If a host cannot supply a field, the canonical record should support absence/UNKNOWN rather than inventing a substitute.

---

# Review cadence

Re-run capability probes when:

- host version changes,
- IDE/extension version changes,
- enterprise policy changes,
- agent/tool configuration changes,
- a previously UNKNOWN capability becomes important to an experiment,
- or observed behavior contradicts the current matrix.

This matrix should evolve from host evidence, not vendor assumptions.
