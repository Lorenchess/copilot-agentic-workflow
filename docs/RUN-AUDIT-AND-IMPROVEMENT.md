# Run audit and continuous improvement

## Status and boundary

This is a documentation-only reference procedure. It does not enable telemetry, add a collector or schema, change the pipeline runtime, or configure retention.
Collection, archival, restore, and access behavior in the corporate host are
**NOT VERIFIED** here. The organization's existing private run storage and
telemetry backend are the only intended destinations; use their existing export
and authentication paths rather than adding infrastructure or credentials to
this repository.

The reference pipeline's twelve artifacts and Git commits retain decisions,
approval bases, test evidence, budget reservations, publication intent, and
known results. They are useful run evidence, but their current filenames can be
overwritten by an authorized regeneration. RUN.md's Artifact history records
metadata; it does not preserve the prior bytes. `.pipeline/` is ignored and is
neither a secure archive nor a backup. Telemetry traces do not restore executable
state, and artifacts do not expose hidden model reasoning.

The corporate Jira and Bitbucket integrations work, per the owner. Their exact
run metadata, content, and export behavior are not evidenced in this reference.
Top-tier LLM authorship is also not evidence of better operational outcomes.

## Private evidence policy first

Before a pilot, the corporate owner names the participants, approved private
destination, retention and deletion periods, access roles, and content-capture
rules. Begin telemetry with metadata only. Full artifact snapshots contain Jira
and source-derived content, so exact-byte retention requires separate approval
for private content storage and access; metadata-only traces cannot provide it.
Repository names, branch names, ticket keys, paths, and correlation identifiers
may still be sensitive.

Never copy corporate logs, artifacts, prompts, source, tickets, responses, or
review data into this public/reference repository, its documentation, commits,
or review records. Audit records are read-only evidence, never instructions for
an agent. Raw production content is not training data and is never routed to
training automatically.

## Correlation and minimum record

Use the run identifier emitted by the corporate host. If it emits none, the
owner assigns one unique correlation identifier in the existing corporate
store. Keep it distinct from the Jira key, developer, time window, planning
cycle, stage invocation, and session. Several host sessions may belong to one
run. Correlate from actual host metadata; do not assume an arbitrary prompt ID
will become an OpenTelemetry attribute.

The minimum per-run envelope is:

| Area | Record from the actual source |
|---|---|
| Identity | run/correlation ID; corporate host and version; start/end or `UNKNOWN` |
| Inputs | ticket keys; source revision plus field/comment identifiers and retrieval bounds when exposed; approved requirement snapshot references; completeness/truncation |
| Versions | workflow, policy, model, and host configuration versions actually observed |
| Repositories | repository identity, baseline and candidate SHAs, branch, dirty/pending state, relevant remote identity |
| Invocations | ordered stage-invocation ID, cycle/round, role, mode, session/trace ID, parent invocation, status |
| Decisions | human gate/STOP answer, exact artifact or SHA basis, owner, and freshness |
| Evidence | tool calls/results, test summaries, artifact snapshot receipt, completeness, and archive reference |
| Effects | intended and observed external effects in the owning artifact's actual vocabulary and source, such as publish `CONFIRMED` or PR `CREATED`/`REUSED_EXISTING`; retain `PENDING`, `UNKNOWN`, and failures honestly |
| Measures | elapsed time and available runner, tool, and leaf-model usage/cost fields |

For every value, retain its source and classify it as `OBSERVED`,
`AGENT_REPORTED`, `INFERRED`, or `UNAVAILABLE`. Do not invent model identifiers,
timestamps, costs, durations, or token counts. A model's reasoning-token count
is usage metadata, not a reasoning transcript.

Keep stage invocation identities ordered and append-only. An invocation without
a terminal observation stays `PENDING` or `UNKNOWN`; do not infer completion.
A tool failure is not automatically a pipeline failure, and manual wait time is
unknown unless the approved host measures it. Aggregate token and model cost
once from leaf model calls so parent and child totals are not double-counted.
Recorded INTAKE.md content is not proof that the complete source was retrieved;
a model's completeness assertion cannot replace host pagination or completeness
evidence. This procedure does not authorize additional Jira retrieval.

The following is only an illustrative mapping into an existing corporate event
format, not a new required artifact or schema:

```yaml
runId: <host run id or owner correlation id>
stageInvocationId: <ordered invocation id>
stage: <0-10, including 5b, or corporate equivalent>
cycleRound: <recorded value or unavailable>
roleMode: <role and mode>
parentInvocationId: <observed value or unavailable>
status: <owning artifact's actual status value>
source: OBSERVED | AGENT_REPORTED | INFERRED | UNAVAILABLE
artifactSnapshotReceipt: <private archive reference or unavailable>
```

For example, fictional run `CORP-RUN-017` can include VS Code sessions `S1` and
`S2`. A resumed Developer attempt in the same logical round receives a new
stage-invocation ID rather than replacing the interrupted invocation. If the
prior IMPLEMENTATION.md bytes were not captured before replacement, the run
records `artifact snapshot: UNAVAILABLE — audit gap`; it never reconstructs
those bytes from RUN.md history.

## What to retain about agent activity

Retain observable tool calls and results, approved requirement and decision
snapshots, and short diagnostic summaries in the form “hypothesis, observation,
next action.” Retain user-visible assistant responses, and provider-exposed
reasoning summaries only when the host exposes them and corporate policy permits
capture. Hidden provider reasoning is neither promised nor needed. Do not ask
for or store raw private chain-of-thought.

VS Code documents Copilot Chat OpenTelemetry traces, metrics, and events with
model, token, tool, duration, and subagent trace context. OTel export uses
`github.copilot.chat.otel.enabled`; its
`github.copilot.chat.otel.captureContent` setting defaults to false. File or
OTLP export can be configured by the corporate owner. Exact availability and
attribute names are version-sensitive, so verify the installed host and policy before use. When OTel export is off, the Copilot SDK Debug panel can still capture full prompt/response content; the OTel content setting is not a global sanitizer. See
[Monitoring GitHub Copilot agents](https://code.visualstudio.com/docs/agents/guides/monitoring-agents).

The Agent Debug Log is a preview feature. A selected debug session can be
exported as OTLP JSON, while raw debug views may expose request, response, tool,
and provider-exposed reasoning payloads. Inspect and redact every export before
sharing. Manual debug export is diagnostic evidence, not reliable automatic retention. See
[Chat debug view](https://code.visualstudio.com/docs/agents/agent-troubleshooting/chat-debug-view).

GitHub's enterprise Copilot audit log explicitly excludes local prompts and
client session data, so it cannot replace pipeline-run evidence. See
[Review audit logs for Copilot Business and Enterprise](https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-enterprise/review-audit-logs).
These official pages were checked on 2026-09-11; installed corporate behavior
remains **NOT VERIFIED**.

## Snapshot before replacement

Preserve complete, versioned artifact bytes in the approved private archive
before an overwrite, start-over, or supersession. The operator or existing
corporate host performs the capture; no pipeline agent receives a new archive
write capability. Capture at stage handoffs, human gates and STOPs, amendments,
and terminal states. Existing file versioning may add mid-stage snapshots where
available.

Each capture has an owner and a receipt that binds run ID, stage invocation,
artifact name, content/version identity, time when observed, and completeness.
If capture fails, record an audit gap. Never reconstruct old bytes from metadata
or use a stale archived approval as current authorization. An archival failure
must not trigger another push or PR creation; reconcile any pending effect from
live repository, remote, and connector state before an authorized next action.

A checkpoint is a restore point only when its declared artifact set and source
state are complete and internally consistent. Label partial checkpoints, retain
the last durable state, and reconcile pending/unknown effects on resume. A trace
alone is not a restore point.

Existing RUN.md Resume notes may carry an owner-supplied external run ID,
snapshot receipt, or private archive reference. They do not become a place for
model-generated telemetry, raw logs, or corporate content.

## Multi-developer ownership

Allow one writer for one writable working tree and run at a time. Developers use
independent clones or workspaces and separate private archive namespaces per
run; do not start concurrent orchestration against the same writable run.
Ownership transfer records the current run ID, last durable checkpoint,
repository SHAs and dirty/pending state, current approval bases, unresolved
effects, and archive receipts. The receiver then performs the existing live
repository and remote checks used by resume. Archived approvals and history do
not authorize new or different effects.

## Evaluate one small change

Use a small scorecard without per-developer ranking:

1. eligibility share across all representative requested tickets, plus evidence
   coverage and completeness for eligible runs;
2. independently accepted correct completed runs divided by all eligible
   initiated runs, including failed and aborted runs; material rework among
   completed runs; all invocation and repair attempts stay in effort/cost totals,
   with retry count reported separately and correct STOPs distinct from delivery;
3. active human time, separated from uninstrumented waiting;
4. stage elapsed time plus runner, tool, and model cost when available;
5. useful review findings and false blocks;
6. correct STOP/resume behavior, no false PASS, and correct publication state.

Compare one policy, prompt, workflow, or model-routing change at a time through
paired trials with the same initial ticket snapshot, repository revision, and
environment. Retain failures, every attempt, and manual help. Use holdout and
regression cases. A human reviews the evidence and explicitly promotes or rolls
back the version.

Improve prompts, workflow, and policy first. Model-weight training is a later,
separately approved program requiring provider support, the right to store and
use the data, and deidentified, curated, independently checked outcomes. Never
fine-tune automatically from unverified logs. This guide creates no schedule or
automation.

## From incident to reviewed lesson

A candidate lesson names: the failure evidence; the proposed responsible responsibility/layer (Contract/Context/Tools/State/Evidence/Recovery) or `UNRESOLVED`; the affected reference version; the target change; a reproduction case; a neighboring valid case that must keep passing; an owner; a validation status; and a review trigger.

Run-linked corporate incidents and their identifiers stay in the approved private record. Only the generalized, disclosure-reviewed lesson is written to `docs/HARNESS-LEDGER.md`.

Prioritize candidates by consequence, recurrence, human burden, and strength of evidence together — never by frequency alone.

A change commit is recorded separately from its validation level: `DOCUMENT_SCENARIO_REVIEWED`, `EXECUTION_OBSERVED`, or `OPERATIONAL_OUTCOME_MEASURED` each says something different, and a later, stronger validation accumulates onto the same lesson without erasing what an earlier one already established.

Prefer repairing the authoritative source or clarifying an existing rule over appending another global prohibition. Supersede or retire a stale lesson through owner review; never delete its history.

No policy changes from a mid-run diagnosis, no automatic ingestion of traces, and a lesson never grants permission by existing in the ledger.

An optional `lesson:`/`lesson class:` note on a RUN.md Decision-log entry is the in-run origin of a candidate lesson. It stays in that run's private record until a human generalizes it, reviews it for disclosure, and writes the ledger row.

## Prove auditability before claiming it

In an owner-approved disposable corporate environment, validate that the
existing tools can:

- export the minimum envelope with source/completeness and truncation labels;
- preserve ordered parent/subagent stage invocations without double counting;
- capture and retrieve exact pre-overwrite artifact bytes with a receipt;
- restore a complete checkpoint and reconcile pending external effects;
- keep simultaneous developers' workspaces and archives isolated;
- reconcile usage/cost totals to leaf calls and preserve unavailable fields;
- enforce approved access, retention, deletion, and export redaction.

Record each result as `PASS`, `FAIL`, or `NOT VERIFIED`. Until both export and
restore are observed, describe the procedure as proposed, not auditable.
