# Post-Run Observability, Learning Evidence, and Shareable Support Bundles

## Purpose

RSTACK should not only execute an auditable software-delivery workflow. It should also make it possible to study how the pipeline behaved across many real developer runs so that the factory can be improved empirically.

The goal is to collect useful post-run learning evidence without contaminating the context of agents while the run is still active.

Core requirement:

> Execution evidence used to make engineering decisions must remain separate from host-level learning evidence used to study the pipeline itself.

RSTACK should not place host-visible session traces, reasoning summaries, tool activity, timing, usage data, or similar diagnostics into locations that active agents in the same run can discover.

The safest default is to collect or materialize learning evidence only after the engineering run reaches a terminal state. A future host telemetry mechanism may capture data during execution only when the sink is isolated from every agent in that run.

This document describes the intended capability and constraints. It is guidance for future design and implementation. It does not authorize a source change by itself.

---

## 1. Problem

RSTACK already retains authoritative execution evidence such as:

- source request;
- intent;
- specification;
- plan and audit;
- human decisions;
- proof;
- actual test executions;
- candidate identity;
- verification;
- code review;
- PR review;
- proposal evidence;
- engine journal and state.

That evidence tells us what the pipeline accepted and why.

It does not necessarily tell us enough about how the agents behaved while producing those artifacts.

For pipeline tuning, we may want to study host-visible information such as:

- prompts and responses exposed by the host;
- host-visible reasoning or thinking summaries;
- tool calls;
- files read;
- search activity;
- actual model identity;
- role invocation timing;
- retries;
- token or usage information where available;
- host errors;
- user interventions;
- unnecessary rereads;
- whether an Auditor investigated independently;
- whether a Reviewer was exposed to information that should have remained outside its context.

That information can help improve:

- role prompts;
- Skills;
- model assignment;
- context budgets;
- token efficiency;
- tool restrictions;
- stage ordering;
- audit effectiveness;
- failure handling;
- evidence sufficiency.

The challenge is to collect this without changing the behavior being measured.

---

## 2. Context-pollution risk

The main risk is that learning evidence created during a run becomes visible to another reasoning role in that same run.

Example:

    Planner works
        ↓
    host session trace is written into the workspace
        ↓
    Reviewer later searches the workspace
        ↓
    Reviewer discovers Planner or Developer reasoning
        ↓
    independent review is contaminated

Even if the Reviewer was not explicitly given that material, ordinary read or search tools could expose it.

This would weaken claims about:

- fresh audit context;
- independent review;
- unbiased PR review;
- separation between Developer and Reviewer;
- separation between Planner and Plan Auditor.

Therefore:

> No post-run learning transcript, host reasoning trace, or session export for an active run should be placed in an agent-visible location while any reasoning role for that run is still active.

---

## 3. Terminology

Use careful terminology.

Do not assume that a host-visible reasoning or thinking view is the model's private internal chain of thought.

Use terms such as:

- host-visible session trace;
- host-visible reasoning or thinking trace;
- session export;
- tool trace;
- host telemetry.

RSTACK should record only what the host actually exposes.

If a field is unavailable, record it as unavailable rather than inferring it.

---

## 4. Separate evidence zones

RSTACK should distinguish three evidence zones.

### 4.1 Execution evidence

Purpose:

- determine whether the engineering workflow may advance;
- validate identities;
- support audit and review;
- explain state transitions.

Suggested location:

    .rstack/runs/<run-id>/

Properties:

- authoritative for the run;
- consumed by the engine;
- selectively exposed to roles;
- retained by identity;
- governed by workflow contracts.

### 4.2 Host learning evidence

Purpose:

- study how the pipeline behaved;
- tune prompts, models, context, and tool use;
- compare runs;
- analyze efficiency and agent behavior.

Suggested location outside the active application-visible execution tree, for example:

    .rstack-learning/<run-id>/

or another RSTACK data root that active workers cannot search.

Properties:

- created only after terminal state, or written to an isolated external sink;
- never required for the same run to succeed;
- never supplied back to roles in the same run;
- may be incomplete or unavailable;
- clearly separated from authoritative execution evidence.

### 4.3 Shareable support bundle

Purpose:

- allow a developer to voluntarily provide a sanitized diagnostic package to RSTACK maintainers;
- enable cross-developer evaluation without asking developers to share an entire workspace.

Suggested output:

    rstack-support-<run-id>.zip

Properties:

- explicitly generated by the developer;
- allowlisted content;
- sanitized and redacted;
- inspectable before sharing;
- versioned manifest;
- hashes of included files;
- excludes secrets and unrelated repository content by default.

---

## 5. Learning export must not affect engineering success

Learning capture is diagnostic.

It must not become a success condition for the engineering pipeline.

Correct relationship:

    engineering run
         ↓
    PR_PROPOSAL_READY, PR_CREATED, or terminal blocker
         ↓
    engineering outcome fixed
         ↓
    post-run learning export
         ├─ COMPLETE
         ├─ PARTIAL
         └─ UNAVAILABLE

A failed host-session export must not transform a successful engineering run into a failed run.

A successful learning export must not make a failed engineering run successful.

---

## 6. Recommended deterministic post-run commands

Prefer deterministic commands rather than another reasoning role.

Possible interfaces:

    rstack learning export --run <run-id>

and:

    rstack support-bundle --run <run-id>

The learning exporter should:

1. confirm the run is terminal;
2. resolve role and attempt identities;
3. locate corresponding host session evidence where available;
4. export or copy it into the isolated learning area;
5. build a manifest;
6. hash every retained learning artifact;
7. record unavailable or partial data honestly;
8. optionally feed a separate sanitized support-bundle step.

An LLM should not decide which bytes are authoritative for the export.

A later evaluator may consume the completed learning bundle, but construction should be deterministic.

---

## 7. Correlating host sessions to RSTACK attempts

RSTACK needs a reliable mapping from workflow identity to host identity.

During execution, capture only the minimum metadata needed for later correlation.

Example fields:

- run_id;
- attempt_id;
- role;
- host;
- host_session_id, when observable;
- started_at;
- ended_at;
- effective_model, when observable.

Conceptually:

    RUN-123
    ├── intent-1       -> host session A
    ├── recon-1        -> host session B
    ├── spec-1         -> host session C
    ├── plan-1         -> host session D
    ├── plan-audit-1   -> host session E
    ├── tester-1       -> host session F
    ├── developer-1    -> host session G
    ├── reviewer-1     -> host session H
    └── pr-reviewer-1  -> host session I

After the run is terminal, RSTACK can collect the corresponding host exports.

If the host cannot expose a stable session identifier, record the limitation and use the safest available deterministic correlation method.

Do not guess.

---

## 8. Suggested learning-bundle structure

A future structure could look like:

    .rstack-learning/
      RUN-123/
        manifest.json
        pipeline-summary.json

        sessions/
          intent-1/
            metadata.json
            session-export.json

          reconnaissance-1/
            metadata.json
            session-export.json

          spec-1/
            metadata.json
            session-export.json

          plan-1/
            metadata.json
            session-export.json

          plan-audit-1/
            metadata.json
            session-export.json

          tester-1/
            metadata.json
            session-export.json

          developer-1/
            metadata.json
            session-export.json

          reviewer-1/
            metadata.json
            session-export.json

          pr-reviewer-1/
            metadata.json
            session-export.json

        metrics/
          timing.json
          tool-usage.json
          model-usage.json
          retry-summary.json

This is illustrative, not a required schema.

The final design should follow actual host capabilities established during live validation.

---

## 9. What we want to learn

The purpose is not simply to archive chats.

The data should answer concrete pipeline-quality questions.

### Planner

- How much repository exploration occurs in each mode?
- Does reconnaissance inspect the right evidence?
- Does Plan reread unnecessary material?
- How often does the Planner identify specification conflicts?
- How many Plan claims lack useful evidence?
- How often does the Plan Auditor find things the Planner missed?

### Plan Auditor

- Does the Auditor independently inspect primary evidence?
- How much does its evidence overlap the Planner's?
- Does it find real contradictions?
- How many findings are later accepted, rejected, or amended?
- Does it rely too heavily on Plan claims?

### Tester

- How many proof attempts are required?
- How often are proofs rejected as vacuous or insufficient?
- How many tests are added or read?
- Does the Tester over-test or under-test?

### Developer

- How many correction rounds occur?
- Which files are repeatedly inspected?
- Does the Developer attempt forbidden changes?
- How often does verification fail?
- Which tool patterns are expensive or redundant?

### Code Reviewer

- Does it inspect the candidate independently?
- Does it rely on retained evidence or rediscover everything?
- What findings appear after verification already passed?
- How often does it disagree with the Developer's interpretation?

### PR Reviewer

- How often does it request changes?
- Which risks appear only at PR review?
- Does it accurately reuse pipeline evidence?
- Does it unnecessarily repeat repository investigation?

### Coordinator and engine interaction

- How many retries occur?
- How often are results refused?
- Which refusal codes are common?
- How much human intervention is required?
- Which stages dominate elapsed time?
- Which roles dominate usage and cost?

---

## 10. Metrics must remain traceable

Computed metrics are useful, but the original exported host evidence should remain available locally when policy permits.

Recommended relationship:

    raw host evidence
          ↓
    deterministic normalization and metrics
          ↓
    offline analysis

Do not retain only a score.

Metrics such as repository reads, tool calls, tokens, elapsed time, retries, failed submissions, and findings should be traceable to evidence.

---

## 11. No same-run learning feedback

The system should enforce this rule:

> Learning evidence from run R must never become input to any reasoning role in run R.

A stronger default is:

> Learning evidence is available only to offline evaluation and tuning workflows, never to execution roles unless a future explicitly reviewed cross-run-memory feature authorizes it.

Do not implement automatic self-learning where agents rewrite their own prompts, Skills, or governance after a run.

Prompt, Skill, profile, and policy changes remain normal reviewed source changes.

---

## 12. Privacy and sensitive-data risk

A run may contain:

- source code;
- ticket text;
- logs;
- prompts;
- chat responses;
- tool output;
- local paths;
- user names;
- environment information;
- test data;
- proprietary implementation details.

A host session export may contain even more.

Therefore developers should not be instructed to send the entire .rstack directory to maintainers by default.

Use an explicit support-bundle exporter instead.

---

## 13. Shareable support-bundle levels

A future exporter may offer levels such as:

### Metrics

    --level metrics

Possible contents:

- stage timing;
- model labels where observable;
- token or usage counts where observable;
- attempt and retry counts;
- refusal codes;
- finding counts;
- test counts;
- no source bytes;
- no transcript text by default.

### Diagnostic

    --level diagnostic

May additionally include:

- sanitized tool calls;
- sanitized host session export;
- engine directives;
- role metadata;
- artifact identities;
- selected error or output excerpts.

### Full

    --level full

May include:

- complete host-visible session exports;
- selected execution evidence;
- selected source artifacts when explicitly allowed.

The exact levels require privacy and security review before implementation.

---

## 14. Bundle-generation rules

The support exporter should:

1. use an explicit allowlist;
2. enumerate every included file;
3. exclude secrets and tokens;
4. exclude arbitrary environment-variable values;
5. exclude unrelated repository files by default;
6. redact known credential patterns;
7. identify which redaction was performed;
8. produce a manifest with file hashes;
9. record exporter and schema version;
10. let the developer inspect the bundle before sharing.

Preferred model:

    raw evidence, local only
            ↓
         sanitizer
            ↓
      shareable bundle

Do not silently upload a bundle anywhere.

External transmission must be a separate explicit action.

---

## 15. Secret handling

Do not persist secrets merely to improve learning analysis.

At minimum avoid recording or sharing:

- authentication tokens;
- API keys;
- credentials;
- full environment values;
- private keys;
- session cookies;
- credential-store data.

If a host export contains such material, sanitize before it becomes shareable.

Raw local exports may themselves require access controls and retention policy.

Do not claim redaction is complete without adversarial tests.

---

## 16. Isolated live telemetry

Long term, a host may expose live telemetry such as:

- LLM invocation metadata;
- tool calls;
- timing;
- token usage;
- model selection;
- errors.

Recording while agents work is acceptable only if the sink is isolated from the run's agents.

Conceptual architecture:

    agents executing
          │
          ├──────────────► isolated telemetry sink
          │                 not searchable by run agents
          │
          ▼
    RSTACK run reaches terminal state
          │
          ▼
    post-run exporter
          │
          ├── engine evidence
          ├── host session exports
          └── isolated telemetry
                  ↓
           learning bundle

For initial implementation, prefer post-run export unless live-host validation proves an isolated telemetry mechanism cleanly.

---

## 17. Relationship to independent evaluation

RSTACK should distinguish three evidence classes:

### Execution

What the pipeline accepted.

### Evaluation

Whether the pipeline outcome was good.

### Host learning

How the agents and host behaved while producing it.

A future evaluator may use all three but must label the evidence class supporting each claim.

---

## 18. Cross-run analysis

The long-term value comes from comparing many runs across developers and task types.

Examples:

- Which Planner prompt version produces fewer unsupported assumptions?
- Which model is most effective as Plan Auditor?
- How much code does each role need to inspect?
- Which role causes the most retries?
- Which Skills are frequently ignored?
- Which agent and tool patterns waste tokens?
- What percentage of PR Review findings could have been caught earlier?
- How often does a human amend a plan?
- Which refusal codes indicate prompt weakness versus genuine product ambiguity?
- Does a model upgrade improve quality or only increase usage?

Compare failed and abandoned runs too, not only successful runs.

---

## 19. Versioning

Every learning and support bundle should record enough version information for meaningful comparison.

At minimum:

- RSTACK source or package version;
- workflow version;
- profile version;
- role prompt and Skill identities;
- host;
- host version;
- effective model labels where observable;
- support-bundle schema version;
- sanitizer and exporter version.

Do not compare materially different runs as equivalent without recording those differences.

---

## 20. Retention and deletion

Before enterprise rollout, define a retention policy.

Questions to resolve:

- How long does raw host evidence remain local?
- How long do sanitized bundles remain?
- Can learning evidence be deleted independently from execution evidence?
- Which evidence is mandatory for audit versus optional diagnostics?
- Can learning capture be disabled by policy?
- Who owns aggregated bundles?

Do not make indefinite retention the default without an explicit decision.

---

## 21. Proposed roadmap position

Treat this as a separate post-S6 capability.

Suggested roadmap:

    S6
    Live VS Code Copilot validation
          ↓
    host behavior proven
          ↓
    S7
    Post-run observability and learning bundle

S6 establishes:

- agent discovery;
- role dispatch;
- model behavior;
- session behavior;
- evidence transport;
- human waits;
- host limitations.

S7 then implements:

- session correlation;
- post-terminal capture;
- learning manifest;
- metrics;
- sanitization;
- support bundle;
- cross-run analysis inputs.

Do not make S7 a blocker for proving the core S6 workflow unless S6 reveals that session evidence is required for a correctness claim.

---

## 22. Suggested S7 phases

### S7-A — host evidence feasibility

Determine exactly what the host exposes through stable supported mechanisms.

Record:

- session export mechanism;
- stable identifiers;
- tool traces;
- model labels;
- token or usage data;
- timing;
- host-visible reasoning or thinking data;
- retention behavior.

### S7-B — correlation

Bind host sessions to:

- run;
- attempt;
- role;
- profile;
- model;
- timestamps.

Prove no cross-run mix-up.

### S7-C — isolated post-run exporter

Implement deterministic learning export requiring terminal run state.

### S7-D — sanitized support bundle

Implement explicit developer-controlled export.

### S7-E — evaluator and analytics

Use learning bundles to compare pipeline behavior across runs.

Do not let analytics mutate live prompts automatically.

---

## 23. Acceptance criteria

The capability should not be considered complete until at least these behaviors are proven.

### LEARN-1 — terminal-only default

No learning transcript or session artifact is created in an agent-visible run area before the run is terminal.

### LEARN-2 — role correlation

Every captured session is associated with the correct run, attempt, and role, or explicitly marked uncorrelated.

### LEARN-3 — no same-run feedback

No execution role receives learning evidence from its own active run.

### LEARN-4 — failure independence

Learning export failure does not change the engineering run's terminal result.

### LEARN-5 — evidence classes

Execution, evaluation, and host-learning evidence remain distinguishable.

### LEARN-6 — exact manifest

Every exported learning artifact is listed and hashed.

### LEARN-7 — source preservation

Learning export does not modify retained run evidence.

### LEARN-8 — support-bundle allowlist

Only explicitly allowed content can enter a support bundle.

### LEARN-9 — secret handling

Known credential and secret fixtures are excluded or redacted in adversarial tests.

### LEARN-10 — inspect before share

The developer can inspect bundle contents before external sharing.

### LEARN-11 — no automatic upload

Bundle generation performs no network publication.

### LEARN-12 — partial evidence honesty

Unavailable host data is reported as unavailable, not inferred.

### LEARN-13 — cross-run identity

Aggregated analysis retains RSTACK, profile, workflow, and model identities per run.

### LEARN-14 — hidden from active agents

Active agents cannot discover post-run learning data through ordinary workspace tools.

### LEARN-15 — deterministic metrics

Derived metrics can be traced to retained host-learning evidence.

---

## 24. Non-goals

This capability is not intended to:

- expose or reconstruct private model chain-of-thought;
- create automatic self-modifying prompts;
- allow agents to read one another's active reasoning;
- replace deterministic execution evidence;
- replace independent evaluation;
- upload developer data automatically;
- become an employee-surveillance system;
- retain arbitrary workspace content;
- make host telemetry mandatory for basic RSTACK execution.

The purpose is controlled pipeline engineering and debugging.

---

## 25. Recommended decision

Add post-run observability and shareable support bundles to the RSTACK roadmap, but keep them outside the active reasoning path.

Recommended architecture:

    RSTACK execution
          ↓
    terminal state
          ↓
    deterministic post-run exporter
          ↓
    isolated host-learning evidence
          ↓
    sanitizer and support bundle
          ↓
    offline evaluator or maintainer analysis

Guiding principle:

> Capture enough host evidence to improve RSTACK across many developers while ensuring that learning evidence from a run cannot influence the independent agents whose behavior that run is intended to measure.
