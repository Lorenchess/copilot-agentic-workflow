# Proactive Production Reliability & Deployment Intelligence
## Architecture proposal, requirements-discovery playbook, and Teams Copilot investigation guide

**Date:** 2026-11-05  
**Status:** Discovery baseline / proposed architecture — **not** approved for implementation or production access  
**Scope:** Multi-environment Kubernetes / Spring Boot estates and cross-team business workflows  
**Repository sensitivity:** This repository is public. This document intentionally contains no company-specific credentials, cluster identifiers, production addresses, private Teams messages, customer or payment data, or confidential incident excerpts. Keep raw research artifacts in an authorized internal location.  
**Document owner:** To be assigned after stakeholder discovery  
**Decision state:** Proposed; unresolved items are explicitly marked **TBD**.  
**Primary objective:** Discover which production failures can be prevented, detected earlier, or diagnosed faster by combining existing observability, environment-state intelligence, and the organization's existing LLM investigation assistant.

---

## 0. Executive recommendation

**Build a reliability-intelligence and workflow-validation layer, not a replacement for Dynatrace, Grafana, Splunk, or the organization's incident-management system.** Reuse their detection, telemetry, correlation, paging, and investigation capabilities first. Add differentiated capabilities where real evidence demonstrates a gap:

1. **Environment and deployment intelligence:** Effective-state snapshots, approved UAT/production differences, configuration and feature-flag drift, artifact identity, dependency compatibility, and release readiness.
2. **Business-functionality assurance:** Observe whether critical flows such as payments succeed, even when pods and Actuator health endpoints are green; add approved synthetic checks only where needed and safe.
3. **Cross-team dependency/change intelligence:** Connect functional dependency edges, owners, transaction failures, releases, flags, network changes, and incidents across services.
4. **Evidence-driven AI investigation:** When an incident is triggered by deterministic sources, assemble bounded, redacted evidence and invoke the existing Azure-hosted LLM assistant to produce a cited human-readable investigation and next steps.
5. **One operational experience:** Unified incident timeline, drift explanation, deployment readiness, dependency view, evidence links, notifications, and conversational investigation. The GUI need not replace existing dashboards.

**Architectural rule:** Detection and notification must work when the LLM is unavailable. The LLM must not be the authoritative health checker, and it must not have default permission to mutate production.

**Recommended pilot:** One real historical UAT/prod mismatch plus one real historical cross-team payment failure. Replay available evidence; measure whether the proposed system detects, explains, and routes each case earlier or more accurately than today's process.

### 0.1 What is known vs. what must be discovered

| Statement | Evidence class | Status |
|---|---|---|
| Multiple systems interact with services owned by other teams | Reported by project initiator | Known / interview confirmation pending |
| UAT and production can differ in properties, flags, dependencies, and cluster state | Reported problem pattern | Known pattern; frequency unknown |
| Deployments may pass Cucumber regression and business transactions fail later | Reported problem pattern | Known pattern; precise causes and detection lag unknown |
| Human production-support rotation sometimes learns about failures before automated systems | Reported pattern | Known pattern; alert coverage unknown |
| Existing POC reads multiple Kubernetes environments and Spring Boot Actuator and compares state | Reported working capability | Confirmed by initiator; implementation not independently inspected |
| Existing Azure-hosted LLM assistant answers operational questions and can access Splunk and other sources | Reported integration | Confirmed by initiator; APIs, scopes, and reliability TBD |
| Grafana, Dynatrace, Splunk, and other internal tools are in use | Reported tool inventory | Confirmed names; tenant/version/capability coverage TBD |
| Teams Copilot can help review accessible conversations | Reported access | Confirmed at user level; searchable scope, retention, permissions TBD |
| Dynatrace already monitors all payment business flows | **No evidence** | Unknown; do not assume |
| The organization permits storing source telemetry or Teams extracts in a new application | **No evidence** | Unknown; require security/legal/owner review |
| The platform must run autonomous production remediations | **No evidence** | Not part of proposed MVP |

### 0.2 Outcomes and business goals

- **Prevent:** Catch actionable misconfigurations and incompatible dependencies *before* deployment, with evidence-backed advisory findings.
- **Detect:** Reduce time from first functional failure to first actionable alert; distinguish customer/business impact from pod health.
- **Diagnose:** Reduce time from first alert to evidence-supported likely cause and responsible team.
- **Coordinate:** Notify the right owner, keep one incident record, suppress duplication, and preserve a timeline.
- **Learn:** Create a sanitized knowledge base of recurring failure modes, mitigations, detection gaps, and regression cases.

**Out of scope for initial MVP:** New general-purpose APM; replacing existing alert routing; building a custom foundational model; broad ingestion of private Teams history into this public repository; unapproved production transactions; self-directed rollback or changes to Kubernetes, feature flags, DNS, networking, or databases.

---

## 1. Problem landscape and incident taxonomy

Use this taxonomy during Teams research and incident reviews. Categories can overlap; a single incident may have a **symptom**, an **immediate failure point**, and a distinct **underlying contributing change**.

| ID | Failure pattern | Typical observable signals | Likely prevention / detection route | Key discovery question |
|---|---|---|---|---|
| P01 | UAT/prod property mismatch | Different resolved property or profile | Effective-state comparison + policy | Which differences are expected vs unsafe? |
| P02 | Feature-flag drift or audience mismatch | Effective flag differs for target cohort | Flag-provider evaluation and rollout audit | Who owns flags, targeting, and change history? |
| P03 | Container/artifact/version mismatch | Image digest or build identity differs | Release manifest + deployment snapshot | Is prod running the tested artifact? |
| P04 | API or message contract incompatibility | 4xx/5xx, schema/serialization failures | Contract compatibility checks | Are consumer/provider contracts tested? |
| P05 | Unannounced upstream deployment | New failures after another team's release | Deploy-event + trace + error correlation | Can we observe other teams' release events? |
| P06 | Critical business flow fails while pods healthy | Payment success rate falls; probes green | Business SLI + trace + safe synthetic | How is a successful transaction defined? |
| P07 | Dependency latency/timeout/circuit-breaker | Slow spans, retries, open circuits | Existing APM/metrics alerts | Are retries masking a partial outage? |
| P08 | Environment routing or DNS/certificate | Wrong destination, TLS/handshake failures | Validated route/config diff + probes | Are endpoints resolved dynamically? |
| P09 | Secret, token, certificate rotation | Auth errors, expiry, refresh failure | Expiry and error monitoring, not secret exposure | Who rotates credentials and how are failures detected? |
| P10 | Cluster rollout or resource regression | OOM, restarts, pending pods, readiness failures | Kubernetes/Dynatrace/Grafana | Which alerts already catch these? |
| P11 | Data or schema migration incompatibility | SQL errors, stale schema, consumer breakage | Migration sequencing + compatibility checks | Are migrations backward compatible? |
| P12 | Queue, event, scheduler, or batch failure | Backlog, DLQ, lag, missed settlement | Functional SLI + broker metrics | Which async flows lack direct SLI coverage? |
| P13 | Misleading green tests | Cucumber passes; production scenario fails | Production-representative coverage mapping | Which variants are missing in tests? |
| P14 | Observability blind spot | No alert despite customer impact | Coverage audit + telemetry quality | Why did the monitoring stack miss it? |
| P15 | Alerting/ownership failure | Alert fired but nobody acted | Delivery, escalation, owner mapping | Who received or acknowledged the alert? |
| P16 | Incident correlation/error attribution failure | Many related alerts; wrong root-cause claim | Existing Dynatrace reasoning + evidence comparison | Did correlation identify the true first failing dependency? |
| P17 | Drift after release/change without deployment | Flags, config, networking changed later | Change-event history + scheduled reconciliation | What can change outside CI/CD? |
| P18 | External provider/service degradation | Elevated provider errors, business failures | Endpoint health + provider incident + flow metrics | What evidence is visible outside our cluster? |

**Distinguish:** symptom = “payments failing”; detected failed component = “authorization timeout”; proposed cause = “provider release five minutes earlier”; validated root cause = “owner confirmed incompatible API change and reproduction/rollback demonstrated causality.” Never collapse these into one certainty.

### 1.1 Initial failure hypotheses to falsify

- H1: An actionable fraction of deployment incidents originate in **effective configuration differences** not caught by tests or deployment checks.
- H2: Critical business workflows have **insufficient outcome-level monitoring**, even when infrastructure/APM is present.
- H3: Existing Dynatrace/Grafana alerts either fail to trigger, lack owners, or do not reach the team quickly enough for certain incidents.
- H4: Valuable incident evidence exists across Splunk, Dynatrace, releases, and Kubernetes but requires manual collection.
- H5: Cross-team ownership/change information is the main missing context for diagnosing “no deployment by our team” incidents.
- H6: A constrained AI report reduces investigation effort **without raising false-cause confidence or leaking data**.

For each, collect **supporting examples AND counterexamples**. If H2 is false because Dynatrace already covers the workflows, invest in alert delivery and evidence enrichment instead.

---

## 2. Context, stakeholders, and existing systems

### 2.1 Actors

| Actor | Desired capability | Approval or information required |
|---|---|---|
| On-call / production support developer | Actionable incident, correct severity, runbook, owner | Alert routing, escalation, silence/ack rules |
| Application developer | Why it failed, related traces/logs, configuration and code changes | Repository, change history, service identities |
| Release manager / CI/CD owner | Safe preflight result and release decision | Promotion, rollback, exceptions process |
| Observability / SRE / platform owner | No duplicate monitoring stack, consistent labels and ownership | Dynatrace/Grafana capability audit, quotas |
| Upstream service owner | Precise evidence for suspected dependency problem | Cross-team escalation contract and ownership data |
| Security/privacy/compliance owner | Least privilege, logging, masking, permitted AI data use | Threat model, data classification, retention approval |
| AI platform owner | Supported LLM API/tool contracts, limits, cost, evaluation | Existing Azure assistant integration agreement |
| QA/business process owner | Critical transaction definitions and safe test design | SLI definitions, synthetic transaction constraints |
| Leadership / sponsor | Demonstrable avoided incidents and faster investigation | Success criteria, pilot scope, cost ceiling |

### 2.2 Tool-by-tool reuse strategy

| Source | Reuse first | Possible new integration | Prove before implementing |
|---|---|---|---|
| Dynatrace | Existing problems, root-cause/impact analysis, topology, traces, SLOs | Read-only problem/event/service queries or supported event subscriptions | Which edition, Grail/Smartscape availability, coverage, API scopes, costs |
| Grafana | Alert rules, contact points, dashboards and metrics sources | Webhook ingestion, dashboard deep links; metric queries if needed | Current alert ownership, receiver type, labels, no-data behavior |
| Splunk | Saved searches, error and transaction searches, audit/log retention | Narrow time-bounded searches returning redacted snippets/counts | Search API version, quotas, indexes, PII and RBAC |
| Kubernetes | Existing watchers / state and rollout events | Namespaced list/watch or supported cluster inventory | Cluster access model, API load, identities and permissions |
| Spring Boot Actuator | Authorized effective state and health data | Controlled /info, /health, /env, /configprops read where allowed | Endpoint exposure, sanitization, property origin, security policy |
| Feature-flag/config platform | Flag target evaluation and audit trail | Approved SDK/API for cohort-specific effective values | Is effective evaluation possible? Are targeting rules sensitive? |
| CI/CD and source control | Build manifest, deploy events, artifact digest | Change-stream connector | Can release data be mapped to service/env/version reliably? |
| Existing Azure AI assistant | Question-answering, Splunk investigation | Governed incident-investigation API / tool calls | Model access, tool permissions, auditing, latency, data boundaries |
| Teams and incident tracker | Human incident narrative and known workarounds | Discovery only initially; optional approved incident-link metadata | Can research be conducted within approved retention/access policies? |
| Internal platforms | Ownership, service catalog, change calendar, network/flag history | Read-only adapters | Which source is authoritative for each entity? |

**Important vendor caveat:** Dynatrace API surfaces and recommended topology models vary by platform generation. Its official documentation recommends moving away from some classic monitored-entity APIs toward Smartscape on Grail in relevant newer versions. Validate the organization's installed environment rather than hard-coding one API model.

---

## 3. Design principles and scope boundaries

1. **Reuse before build.** For every proposed detection, ask: “Does Dynatrace/Grafana/Splunk already detect or explain it?” Prefer enriching, routing, and joining evidence.
2. **Deterministic detection; probabilistic explanation.** Rules/SLIs/synthetic results create events. AI generates hypotheses and recommended investigation, never unreviewed “confirmed cause.”
3. **Effective state, not raw YAML equality.** Different environments may intentionally differ; compare policy-relevant effective values and compatibility constraints.
4. **Business outcomes above pod health.** A green pod is neither necessary nor sufficient evidence that the whole transaction succeeds.
5. **Event-driven when possible; reconciliation when necessary.** Subscribe to problem/alert/deployment changes. Use watch/informers for Kubernetes where allowed, plus periodic freshness reconciliation.
6. **Evidence and lineage.** Each conclusion links to a source, time range, and observation; explicit unknowns and inaccessible tools.
7. **Least-privilege and data minimization.** Prefer metadata, counts, hashes, status and evidence links to copying payloads.
8. **Fail visible, not falsely green.** Collectors and rules may be HEALTHY, DEGRADED, STALE, UNKNOWN, or ERROR.
9. **Idempotency and replay.** Redelivered/out-of-order events and historical incident replay must produce stable outcomes.
10. **No shadow incident/paging system.** Integrate an existing system of record where available; do not create competing pages for one outage.
11. **Policy-based explainability.** Config drift includes a policy identifier, owner, observed values where non-sensitive, and why the difference matters.
12. **Progressive automation.** Read-only advisory → human-approved execution → narrowly preapproved runbooks only after separate review.

---

## 4. Proposed logical architecture

~~~mermaid
flowchart TB
  subgraph Existing["Existing systems — systems of record"]
    DT["Dynatrace: problems / traces / topology"]
    GF["Grafana: alerts / metrics"]
    SP["Splunk: logs / transaction searches"]
    CD["CI/CD, flag platform, service catalog"]
    AZ["Existing Azure LLM assistant"]
    IM["Existing paging / incident manager"]
  end

  subgraph Source["New read-only data ingestion"]
    WE["Alert / event webhooks"]
    CO["Bounded API connectors"]
    KS["K8s list-watch + reconciliation"]
    AC["Authorized Actuator probes"]
  end

  subgraph Core["Reliability intelligence core"]
    NM["Normalize, identity-map, deduplicate"]
    SS["Versioned effective-state snapshots"]
    DR["Policy-based drift + compatibility"]
    BF["Business-flow SLIs / safe checks"]
    DG["Service / business dependency graph"]
    IC["Correlate incidents + change timelines"]
    EV["Scoped evidence collector + redaction"]
    AI["AI investigation adapter + validation"]
    DB[("Metadata, incidents, audit, policy store")]
  end

  subgraph UX["Operational experience"]
    UI["Unified read-only dashboard + chat links"]
    NO["Notification / incident update adapter"]
    PRE["Pre-deployment readiness API"]
  end

  DT --> WE
  GF --> WE
  DT --> CO
  GF --> CO
  SP --> CO
  CD --> CO
  KS --> NM
  AC --> NM
  WE --> NM
  CO --> NM
  NM --> SS
  NM --> DG
  NM --> BF
  SS --> DR
  DG --> IC
  BF --> IC
  DR --> IC
  NM --> IC
  IC --> EV
  EV --> AI
  AI <--> AZ
  IC --> DB
  AI --> DB
  SS --> DB
  DR --> PRE
  IC --> NO
  IM <--> NO
  DB --> UI
  PRE --> UI
~~~

**Interpretation:** Boxes represent logical modules and boundaries, **not** a mandate to deploy separate microservices. Start as a Spring Boot modular monolith, with bounded connector workers if organizational access/network zones require it.

### 4.1 Proposed module contracts

| Module | Input | Output / responsibility | Safety boundary |
|---|---|---|---|
| Connector adapters | Approved API/Webhook/watch events | Source observations with provenance/freshness | Read-only service identities; rate limits |
| Identity normalization | Raw source IDs | Canonical service, environment, cluster, workflow and owner IDs | Preserve source IDs and mapping confidence |
| State history | Versioned observations | Timestamped effective-state snapshot and drift baseline | Mask/omit secrets; TTL per classification |
| Drift/rule engine | Snapshots, comparison policy | PASS / WARN / BLOCK / UNKNOWN finding + explanation | No deployment block without approved policy |
| Workflow monitor | Existing transaction SLIs / safe probe results | Flow success/error/latency and quality indicators | No real payments without explicit safety approval |
| Dependency graph | Config declarations, traces, catalogs | Versioned edges with ownership and confidence | Distinguish observed from inferred dependency |
| Correlation engine | Problems, alerts, changes, findings | Incident candidates and related evidence; deduped status | Cannot turn temporal correlation into confirmed causality |
| Evidence pack builder | Incident scope, authorized query templates | Bounded metadata, metrics, redacted log samples and links | Server-side allowlists, retention, query limits |
| AI investigator | Evidence pack + permitted tools | Structured hypotheses, impact, questions, next steps | No write tools; grounded, schema-validated output |
| Notification adapter | Incident changes / policy | Updates to existing incident and Teams/page route | Respect ownership, acknowledgement and suppression |
| UI/API | Read models and user identity | Timeline, drift, report, evidence navigation, chat | Per-user access; no unrestricted “AI tool proxy” |

### 4.2 Suggested implementation topology

- **Backend:** Java 21+ / supported Spring Boot within company standards, modular by domain. Java version is illustrative and must align with policy.
- **Durable state:** PostgreSQL or an approved internal relational store for normalized metadata, snapshots metadata, policies, incidents, identifiers, pointers and audit. Avoid storing full raw Splunk results by default.
- **Event transport:** Begin with durable DB-backed inbox/outbox and webhook queue; adopt Kafka/service bus only if existing infrastructure, volume or isolation demands it.
- **Collectors:** Kubernetes Java client informers/list-watch if permitted; REST/webhook adapters with retries, backoff and token scopes.
- **Frontend:** Reuse existing GUI or React as appropriate. Read-model APIs rather than direct source credentials in browser.
- **Identity/security:** Corporate SSO, service identities, centralized secret manager, policy-aware source adapters.
- **Telemetry:** Instrument this new service in existing Dynatrace/Grafana/Splunk; monitor connector lag, queue lag, incident delay, and AI failures.
- **Deployment:** Use existing platform conventions; avoid a privileged agent deployed into every cluster unless a demonstrated need and explicit platform approval.

**Alternatives to evaluate:**
- **A — Thin enrichment service:** Ingest Dynatrace/Grafana problems, enrich with POC drift and Splunk, notify. **Preferred first pilot** because fastest and least duplicative.
- **B — Full independent monitoring/control plane:** More flexible but expensive; risks duplicate alerts, extra credentials, operational ownership, and false confidence. Not preferred absent evidence.
- **C — Extend Dynatrace-native workflows:** Potentially cheapest if licenses, Dynatrace product tier, business-flow coverage, and internal policy support it. Benchmark before committing to A.
- **D — Use an internal event/correlation platform:** Prefer it when existing and reliable; evaluate adapter-only implementation.

---

## 5. Core models and semantics

### 5.1 Canonical identifiers

At minimum, model: **service**, **application/repository**, **workflow**, **environment**, **cluster**, **namespace**, **release/version/image digest**, **owner/team**, **dependency edge**, **signal**, **change**, **drift finding**, **incident**, **evidence reference**, and **policy**.

Do not use pod name as a stable service identity. Keep source mapping tables with:
- canonical ID and source system ID;
- environment and tenant boundaries;
- confidence and matching method (exact label/catalog match vs inferred);
- first/last observed time;
- owner of mapping;
- unresolved ambiguity and collisions.

Create explicit identifiers for *business workflows* such as “payment authorization” independent of a single Kubernetes Deployment. A workflow can cross clusters, team ownership, APIs, queues and providers.

### 5.2 Signal and incident envelope (illustrative, not final API)

~~~json
{
  "schema_version": "draft-v0",
  "event_id": "source-system:immutable-source-id",
  "source": "dynatrace|grafana|kubernetes|actuator|splunk|ci-cd|synthetic",
  "source_event_type": "problem|alert|change|snapshot|test-result",
  "observed_at": "ISO-8601-with-timezone",
  "received_at": "ISO-8601-with-timezone",
  "service_id": "catalog-service-id-or-unknown",
  "workflow_id": "workflow-id-or-null",
  "environment_id": "approved-environment-id",
  "cluster_id": "approved-cluster-id-or-null",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO|UNKNOWN",
  "state": "FIRING|RESOLVED|UNKNOWN",
  "signal_quality": "VALID|STALE|PARTIAL|UNKNOWN",
  "fingerprint": "stable-deduplication-key",
  "evidence_refs": ["authorized-internal-URI-or-source-ID"],
  "classification": "operational-metadata",
  "correlation_id": "stable-incident-id-or-null"
}
~~~

**Contract requirements:**
- Event time differs from ingestion time; record both, including timezone and clock-skew assumptions.
- At-least-once delivery with idempotency by stable source event ID plus revision.
- Out-of-order resolution events must not incorrectly reopen closed incidents.
- Reprocessing and schema evolution must be deterministic and observable.
- Unknown service mappings must remain unknown, not silently attributed.
- All evidence pointers must preserve originating access controls; never turn a restricted URL into a publicly available artifact.

### 5.3 Effective configuration and drift

Comparison should include:
- **Artifact parity:** source commit, build manifest, image digest, configuration version, deployed release.
- **Resolved properties:** active profiles, actual effective origin/priority, explicitly approved safe property names.
- **Flags:** effective value **for the same scenario / user cohort / tenant and targeting context**, rollout percentage and rule version; “flag exists” is not enough.
- **Dependencies:** configured and *actual resolved* destination, API/contract version, required capabilities, routing, broker/topic/schema.
- **Infrastructure:** images, probes, resources, service discovery configuration, policy-relevant workloads.
- **Change context:** drift creation time, last approved baseline, last deployment/flag/network change.

Each comparison policy specifies: applicability scope; field selector; normalize/transform rule; **MUST_MATCH**, **MUST_DIFFER**, **ALLOWED_VARIANCE**, **COMPATIBLE_RANGE**, or **IGNORE**; severity; owner; rationale; exception expiry; last review date.

**Four outcomes:** PASS (satisfied), WARN (actionable but nonblocking difference), BLOCK (approved gate violated), UNKNOWN (missing permissions/data or inconclusive flag evaluation). An unknown is never a pass.

**Secret policy:** Do not retrieve or log secret values. Compare stable metadata, permitted identity/version references, or restricted equality proofs when approved by security. Even hashed low-entropy secrets may be reversible; do not assume plain hashes are safe. Spring Actuator values can be sanitized and endpoints must remain protected; missing unsanitized values are not justification to relax production exposure.

**Baseline:** Prefer env-specific desired state plus approved UAT/prod invariants. Compare against the prior known-good snapshot to detect *change over time* as well as cross-environment differences. Include staleness and baseline version.

### 5.4 Business outcomes and synthetic probes

Business SLI candidates:
- successful authorization / eligible authorization attempts (exact success semantics TBD);
- checkout completion / initiated checkout for comparable cohorts;
- downstream request success, latency, timeout and retry rate;
- queue age, dead letters, settlement/reconciliation success, delayed batch completion;
- critical partner-specific error ratios.

**SLI quality checks:** minimum denominator, traffic volume, missing instrumentation, tenant segmentation, expected low-traffic windows, excluded legitimate declines, and alert burn-rate/threshold review. A spike in card declines is not necessarily a systems outage.

**Synthetic monitoring rule:** First ask if a non-mutating test or approved provider test account works in production. No unapproved charges, irreversible side effects, customer-facing data, fraud triggers or shared account misuse. If safe production synthetic is unavailable, prefer real-traffic outcome SLIs plus bounded connectivity/contract checks and explicit coverage gap.

### 5.5 Dependency graph, evidence, and hypotheses

Store graph edges with **edge type** (direct runtime call / async consumer / functional workflow dependency / config reference), observed-vs-declared source, owner, freshness, and confidence. Do not infer causal direction solely from coincident alerts.

For incident correlation, combine:
- stable incident/problem IDs from Dynatrace or incident manager;
- time windows and trace/correlation IDs;
- source service, destination and error signature;
- release/config/flag changes and known dependency paths;
- confirmed change tickets and historical similar incidents;
- impact scope and owner.

AI narrative should separate **Observed**, **Inferred**, **Unknown**, **Suggested next checks**, and **Human-verified root cause**.

---

## 6. Incident processing and AI investigation

~~~mermaid
sequenceDiagram
  participant Obs as Dynatrace/Grafana
  participant Core as Reliability Core
  participant Sources as Approved Evidence Sources
  participant AI as Azure Assistant
  participant IM as Incident/Teams
  participant Dev as On-call Engineer

  Obs->>Core: Alert/problem with stable source ID
  Core->>Core: Validate, deduplicate, map ownership, correlate
  Core->>Sources: Time-bounded scoped evidence queries
  Sources-->>Core: Redacted observations + evidence links
  Core->>IM: Immediate deterministic alert when policy requires
  Core->>AI: Sanitized evidence pack + allowed tools
  AI-->>Core: Structured hypotheses and references
  Core->>Core: Validate schema, cite evidence, mark gaps
  Core->>IM: Enriched incident update (if still relevant)
  IM-->>Dev: Route to responsible team
  Dev->>Core: Acknowledge, correct cause, give feedback
~~~

**Latency decision:** Do not delay a P1/P2 page for an LLM. Send a minimal deterministic incident first, followed by the AI-enriched update if available and policy allows.

### 6.1 Evidence pack specification

- Incident ID, current state, severity and business workflow.
- Source problem IDs/links and source timestamps; detection status.
- Affected services, owners and dependency path with mapping confidence.
- Bounded metrics: failure counts, denominators, time windows, baseline, missing periods.
- Targeted traces and sanitized log samples or aggregation (not complete payload dumps).
- Relevant change history: image, release, approved flag/config/network changes.
- Environment state snapshot summary with policy finding IDs.
- Existing Dynatrace root-cause/impact claims, distinctly labeled as vendor assessment.
- Known troubleshooting runbooks and previous incidents if permitted.
- Gaps: tools unavailable, rights denied, insufficient sample, no tracing, contradictory signals.
- Provenance: source URLs, query templates, capture timestamp, TTL, and redaction version.

**Query controls:** allowlisted saved searches or parameterized templates, no arbitrary prompt-composed SPL/SQL by default, hard limits on cardinality/time span/result size, audit each tool call, and honor upstream user/service permissions.

### 6.2 AI investigator output contract

Require structured JSON internally (render as human-readable Markdown/UI) with:
1. Incident summary and observed business impact.
2. Timeline with sources and uncertainty.
3. Facts, each citing evidence IDs; separate vendor-inferred facts.
4. Up to 3 ranked *hypotheses* with supporting and contradicting evidence.
5. Missing evidence and checks needed to disambiguate.
6. Suggested owner/team and escalation basis.
7. Safe next actions, each identifying whether read-only or requires human approval.
8. Confidence **per hypothesis** with explicit calibration rules; no precision theater.
9. Tokens/model/tool version, latency, schema validation and policy outcomes (internal audit only).
10. Optional short Teams notification and detailed investigator report.

**Guardrails:** tool outputs and logs are untrusted data; reject prompt injection instructions; enforce user access outside prompts; never trust model-proposed source URLs without validating references; redact sensitive values before model calls; no unrestricted shell, Kubernetes writes, credentials retrieval, or production remediation tools. A failed AI job returns “analysis unavailable,” not “no incident.”

### 6.3 Notification lifecycle

- Preserve the authoritative incident ID and links; do not double-page when Dynatrace and Grafana fire for one symptom.
- Distinguish **OPEN**, **ACKNOWLEDGED**, **INVESTIGATING**, **MITIGATED**, **RESOLVED**, **REOPENED**, and **UNKNOWN**; map to the existing system rather than invent independent status authority.
- Determine route using service catalog/ownership and rota; define fallback on missing owner.
- Deduplicate by source event IDs and incident fingerprint; group by shared cause candidate conservatively.
- Respect silences, maintenance windows, planned changes, per-service thresholds, and paging policy.
- Send resolution only when corroborated by authoritative signals or human verification, not because LLM declares it fixed.
- Link back to existing Dynatrace/Grafana/Splunk views; do not expose privileged raw data in Teams notifications.

---

## 7. Functional requirements baseline (to validate)

Labels are proposed IDs, **not commitments**. Each requirement needs a business owner, measurable acceptance test, priority, source evidence, and a disposition after discovery.

| ID | Candidate requirement | Proposed proof / acceptance test | Initial priority |
|---|---|---|---|
| FR-01 | Inventory applications/services across approved environments | Enumerates scoped entities with source and freshness | P0 |
| FR-02 | Maintain canonical identity and owner mapping | Known services map correctly; ambiguities visible | P0 |
| FR-03 | Capture time-versioned Kubernetes state | Detects a controlled Deployment/ConfigMap change, then recovers watch interruption | P0 |
| FR-04 | Collect only authorized Actuator data | Restricted endpoints fail closed; redacted values never surface | P0 |
| FR-05 | Compare desired and effective config via policies | Detects injected unsafe drift and suppresses permitted differences | P0 |
| FR-06 | Evaluate flag parity for defined cohorts | Difference tied to cohort/rule version; unknown if provider unavailable | P1 |
| FR-07 | Compare tested/promoted artifact and dependency compatibility | Identifies mismatched digest/contract version before deployment | P0 |
| FR-08 | Generate advisory readiness report before release | Report has status, evidence links, exceptions, and stale-data indication | P0 |
| FR-09 | Consume current Dynatrace problems/events | Ingest, dedupe, and preserve source IDs and diagnosis | P0 |
| FR-10 | Consume current Grafana alerts | Handles webhook duplicates, resolved/no-data states | P0 |
| FR-11 | Obtain scoped Splunk evidence | Returns bounded, audited, redacted results and saved search links | P0 |
| FR-12 | Observe critical workflow success/error rates | Detects seeded payment-failure replay with valid denominator | P0 |
| FR-13 | Integrate safe synthetic probes when approved | No customer data/charges, documented rollback or cleanup | P1 |
| FR-14 | Version cross-team dependency and ownership edges | Failed downstream service maps to owning team or UNKNOWN | P1 |
| FR-15 | Correlate alerts, traces, deployments and config changes | Same injected incident produces one incident candidate | P0 |
| FR-16 | Build bounded evidence pack with gaps | Each cited observation has source/time/authorization | P0 |
| FR-17 | Invoke existing Azure assistant via approved API | Valid report produced for controlled synthetic evidence | P1 |
| FR-18 | Validate and render AI report with cited facts and hypotheses | Unsupported assertions are flagged/suppressed | P0 |
| FR-19 | Notify existing on-call/incident workflow | High-priority incident arrives without waiting for AI | P0 |
| FR-20 | Present incident timeline, drift, impact and evidence links | Engineer can follow source links within authorized session | P1 |
| FR-21 | Preserve human feedback/verified root cause | Correction updates classification without rewriting evidence | P1 |
| FR-22 | Support historical incident replay / evaluation | Repeat replay yields stable dedupe and auditable output | P0 |
| FR-23 | Expose connector freshness and unknown state | Broken adapter creates visible stale/unknown signal | P0 |
| FR-24 | Enforce tenant/environment/service access limits | User cannot see another scope's restricted evidence | P0 |
| FR-25 | Export sanitized reports and review metrics | No sensitive payload included; results trace to incidents | P1 |
| FR-26 | Offer Q&A handoff to the existing assistant | Existing chat can continue from incident context without privileged leakage | P2 |
| FR-27 | Optionally block deployments on approved high-confidence rules | Explicit approval, override audit, and fail-open/closed policy defined | P2 |
| FR-28 | Optional remediation playbooks | Human approval and separately reviewed authorization boundary | Later |

### 7.1 Non-functional requirements to elicit and baseline

| ID | Requirement dimension | Questions / proposed acceptance approach |
|---|---|---|
| NFR-01 | Detection latency | Specify p50/p95 alert latency by severity and event type; measure from **source event time** |
| NFR-02 | Alert delivery | Specify p95 from detected incident to existing paging system; page without LLM dependency |
| NFR-03 | Availability | Define desired availability separately for core detection, collection, UI and AI enrichment |
| NFR-04 | Data freshness | Max permissible snapshot/metric/ownership age, plus visible STALE/UNKNOWN |
| NFR-05 | Recovery | Define RPO/RTO for metadata, replay after outage, lost watch / webhook scenarios |
| NFR-06 | Scale | Clusters, namespaces, services, alerts/min, samples/day, storage budget, API quotas |
| NFR-07 | Accuracy | False-positive / false-negative thresholds, root-cause top-3 ranking quality, calibration |
| NFR-08 | Security | SSO/RBAC, service permissions, rotation, egress restriction, audit and prompt protection |
| NFR-09 | Data governance | Data classification, residency, permitted providers, PII redaction, retention, deletion |
| NFR-10 | Operational cost | API quotas, licensing, Splunk search compute, token/model budget, infra spend ceiling |
| NFR-11 | Resilience | AI/Splunk/Dynatrace/Grafana partial outage handling, retries, backpressure, circuit breaker |
| NFR-12 | Auditability | Evidence provenance, policy version, human decision, prompt/model version, access logs |
| NFR-13 | UX/accessibility | Time to identify impact, owner, source links; accessible dashboard; consistent timezone |
| NFR-14 | Change management | Policy approval, exceptions/expiry, release compatibility, connector test contract |
| NFR-15 | Privacy | Minimized stored data, suppression of restricted Teams information in public artifacts |

**Numerical SLAs should not be invented during design.** Derive them from on-call expectations, system criticality, business impact and current measured baselines.

---

## 8. Discovery question bank (ask humans and/or Teams Copilot)

**Question tags:** **[P0]** must resolve before scoped POC; **[P1]** before production pilot; **[P2]** before broad rollout. For every answer capture: source link, date/time, person/team, confidence, whether observed or inferred, affected systems/environments, and unanswered follow-ups.

### A. Incident history, frequency and impact

1. **[P0]** Over the last 90/180 days, which **10–20 incidents** most affected transactions, deployments, support time or customers? Provide dated source threads/tickets, not just a summary.
2. **[P0]** What recurring incident categories appear in deployment and production-support discussions? Count **unique incidents**, not messages, and give uncertainty.
3. **[P0]** Which concrete incidents passed regression/deployment checks but failed business workflows hours or a day later?
4. **[P0]** For each incident, when did failure first occur, when was it first detectable, when did a person notice, when was it acknowledged, and when was it resolved?
5. **[P0]** How was each incident discovered: customer, on-call, support report, Splunk query, Dynatrace, Grafana, synthetic check, or other?
6. **[P0]** Which known incidents produced **no automated alert**? Was it telemetry missing, alert absent, suppression, wrong severity, bad routing, or alert ignored?
7. **[P0]** Which incidents generated alerts but still took a long time to diagnose, and what evidence was missing?
8. **[P1]** How much customer/business impact occurred (failed authorized transactions, affected users, duration) and how trustworthy are those numbers?
9. **[P1]** Which incidents repeat after a temporary fix? Were permanent follow-up tasks completed?
10. **[P1]** Which incidents are often incorrectly attributed to our application but originate upstream or in shared infrastructure?
11. **[P1]** Which incidents have postmortems, and where are they stored? Which have only Teams discussion?
12. **[P2]** Which incident classes are seasonal, volume-dependent, batch-window-dependent or tenant-specific?

### B. Environment, release, and configuration mismatches

13. **[P0]** Which UAT/prod mismatches have caused actual failures? Give field/flag **names only if approved**, release and outcome, with sensitive values withheld.
14. **[P0]** What are the authoritative desired states for each environment: Git/Helm/Kustomize/Argo CD/config service/flag system/manual console?
15. **[P0]** What is the promotion path (DEV → QA → UAT → PROD or other), and must production run the **same artifact digest** as tested?
16. **[P0]** What changes can happen **outside** the deployment pipeline (flags, ConfigMaps, secrets, DNS, routing, certificates, broker settings)?
17. **[P0]** What differences are intentional: endpoints, resource limits, capacity, rollout percentage, operational safety flags, external providers?
18. **[P0]** Who approves exceptions to expected invariants, and how long do exceptions remain valid?
19. **[P1]** How are active Spring profiles and resolved config values inspected today? Which Actuator endpoints are approved?
20. **[P1]** Are changes managed by GitOps, and can existing drift status be consumed rather than reimplemented?
21. **[P1]** What versions of APIs, topics, schemas, and consumers must be compatible at deployment time?
22. **[P1]** Are consumer-driven contracts, schema registries, and backward-compatibility checks part of CI/CD?
23. **[P1]** When flags differ, does the problem depend on targeting context/tenant, not just default true/false?
24. **[P2]** How is configuration history retained, and which past “known-good” snapshots exist?

### C. Business-critical functionality and payments

25. **[P0]** Identify the five highest-value end-to-end business journeys and define precisely what “success” means.
26. **[P0]** Which payment failure types count as platform failure versus valid declines or business-rule rejections?
27. **[P0]** Can transaction success rate, total attempts and error codes be calculated today by service, partner and environment?
28. **[P0]** Do existing Dynatrace/Grafana alerts cover business outcomes, or only infrastructure and service errors?
29. **[P0]** Which parts of the payment workflow are synchronous, queued, scheduled, or externally mediated?
30. **[P0]** What is the safest approved way to validate the workflow in production: passive SLI, read-only probe, isolated synthetic account, or no active test?
31. **[P1]** Which fraud, ledger, payment, chargeback, reconciliation or settlement side effects make synthetic tests unsafe?
32. **[P1]** Which cohorts/tenants/providers have different expected behavior and error baselines?
33. **[P1]** Can we trace one transaction across services using a correlation/trace ID without exposing customer data?
34. **[P1]** What low-volume, batch-window and denominator safeguards must be used in failure-rate alerts?
35. **[P1]** Which critical flows depend on another team’s component but are absent from declared deployment dependencies?
36. **[P2]** Are there safe fixtures, contract-test environments and representative scenarios for reproducing production-only failures?

### D. Dynatrace capabilities and monitoring gaps

37. **[P0]** What Dynatrace deployment/platform tier is used; are Grail, Smartscape, Business Flows, Problems, Davis analysis and API access enabled?
38. **[P0]** Which monitored services and business flows lack coverage, tracing, meaningful outcome SLIs, or ownership?
39. **[P0]** For each sampled incident, did Dynatrace create a problem? At what time and with what impact/cause finding?
40. **[P0]** If Dynatrace identified the cause, why did engineers still need manual investigation (routing, access, evidence quality, wrong team)?
41. **[P1]** Which Problems/event/trace APIs and data models are sanctioned by the installed version and platform team?
42. **[P1]** Are deployment events, feature-flag changes and topology metadata already sent to Dynatrace?
43. **[P1]** What event correlation and suppression does Dynatrace already perform? Which incident scenarios does it miss?
44. **[P1]** Are business events or custom events available and economical to ingest? Are there license/data costs?
45. **[P2]** What exists for service entity tagging, management zones, ownership and cross-team visibility?

### E. Grafana, metrics, SLIs and notifications

46. **[P0]** Which Grafana data sources, alert rules, notification policies and contact points are configured?
47. **[P0]** Which alerts fire for payment-flow failures and which do not? Verify with historical rule evaluation.
48. **[P0]** How do alerts reach on-call staff and Teams today? Who owns their policy and paging escalation?
49. **[P0]** Are there cases where Grafana indicates OK because metrics are absent, stale, mislabeled, or no-data semantics are wrong?
50. **[P1]** Can Grafana send an authenticated webhook/event to an internal enrichment service without duplicating existing pages?
51. **[P1]** Which metrics distinguish user-visible error, upstream dependency errors, retry storms and application health?
52. **[P1]** What recording rules, SLO/error-budget monitoring and cardinality limits are in use?
53. **[P2]** Can dashboards link by service/environment/incident/time window with durable URLs?

### F. Splunk, logs and observability data

54. **[P0]** What Splunk indexes/sourcetypes/searches record transaction failures and downstream errors?
55. **[P0]** Are correlation IDs consistent across services? Where are they lost?
56. **[P0]** What existing Splunk search patterns did developers use to solve the last five incidents?
57. **[P0]** Do log searches contain payment/customer/regulated information, and what can legally be sent to an LLM?
58. **[P1]** Which REST endpoints, saved searches, result limits and roles are available to an automated read-only integration?
59. **[P1]** What is the maximum safe search frequency/window given quotas and performance?
60. **[P1]** Can application/service release events and flags be joined to traces/logs reliably?
61. **[P2]** Is it preferable to store only summaries/source links rather than replicate raw logs?

### G. Kubernetes, Actuator, and the existing POC

62. **[P0]** Which clusters, namespaces and services are in scope, and is read access permitted in all environments?
63. **[P0]** What exactly does the POC already collect and compare? Which algorithms, credentials, APIs, GUI routes and persistence are implemented?
64. **[P0]** What has the POC already detected that existing monitoring did not?
65. **[P0]** Does the POC compare declared properties, resolved effective values, or both?
66. **[P0]** Which collected fields are sensitive or unsafe to persist or expose?
67. **[P1]** Can watchers/informers replace broad polling without undue API-server load?
68. **[P1]** What is the expected behavior when cluster watch disconnects, token expires, or APIs return 429/410?
69. **[P1]** How are pod/workload identity, namespace, environment and deployment revision mapped to a stable service?
70. **[P1]** Are actuator endpoints secured and sanitized in production, and should this service use a separate restricted management path?
71. **[P2]** How are snapshots versioned, compared, expired and linked to deployment history?
72. **[P2]** Can the existing GUI be retained as a module rather than rebuilt?

### H. Dependencies, ownership and cross-team changes

73. **[P0]** Which upstream/downstream services and external providers are required for each critical workflow?
74. **[P0]** Where is the authoritative service catalog/team ownership/on-call directory?
75. **[P0]** Which “surprise” cross-team changes caused outages in the last six months?
76. **[P0]** Are other teams' deployment, config and flag changes visible to our team at all?
77. **[P1]** Can topology edges be derived from traces, and which async/manual edges require declaration?
78. **[P1]** How are changes communicated; which notification failures or communication gaps recur?
79. **[P1]** What escalation channel and SLA apply when an upstream team owns the suspected failure?
80. **[P1]** Can the platform reliably tell “our deployment caused it” from “upstream changed,” or only report competing hypotheses?
81. **[P2]** Who owns review and retirement of stale dependency edges?

### I. Incident operations, humans, and current workflow

82. **[P0]** What does the production-support rotation actually do at first report? Record steps and tools in order.
83. **[P0]** Where is the incident system of record (ServiceNow, Jira, PagerDuty, internal system, Teams thread, other)?
84. **[P0]** How are severity, impact, acknowledgement, ownership, resolution and escalation decided today?
85. **[P0]** What evidence is gathered manually every time (Splunk links, traces, config diffs, recent releases)?
86. **[P1]** Which existing notification should be **enriched** rather than sending a new one?
87. **[P1]** Which alerts are considered spam or repeatedly ignored and why?
88. **[P1]** Which remediations are safe to recommend vs require explicit operator approval?
89. **[P1]** How are handoff notes and final RCA stored and retrievable?
90. **[P2]** What UI would reduce friction most: readiness screen, incident inbox, dependency map, or evidence report?

### J. Existing Azure LLM assistant / AI governance

91. **[P0]** Who owns the existing assistant; what supported integration exists (API, MCP tools, events, batch, service auth)?
92. **[P0]** Can it be called programmatically with a constrained incident context or only through interactive chat?
93. **[P0]** Which tools can the assistant call today, under whose identity and authorization?
94. **[P0]** What data categories may be submitted to Azure-hosted model processing, and what are retention/residency requirements?
95. **[P1]** Does it already produce usable cited evidence, structured JSON and audit trails?
96. **[P1]** What happens on missing evidence, conflicting sources, prompt injection in logs, timeouts or tool failure?
97. **[P1]** What model/endpoint versions, limits, token costs and fallback policies are available?
98. **[P1]** Can the system validate all model claims against source references before notifying?
99. **[P1]** Who reviews prompt/model changes, and what evaluations must pass?
100. **[P2]** Can incident context hand off to existing chat without increasing its permissions?

### K. Security, privacy, access and compliance

101. **[P0]** Is the production reliability project permitted to use the target hosting environment and source-system credentials?
102. **[P0]** Which data must never leave source systems (secrets, PII, PAN/payment details, customer payloads, internal message bodies)?
103. **[P0]** What is the approved boundary for Teams Copilot discovery, and can excerpts be retained outside Teams?
104. **[P0]** Is this public GitHub repository acceptable for **generic architecture only**? Identify the sanctioned internal location for incident evidence.
105. **[P1]** What least-privilege identities and approval workflow are needed per tool/cluster?
106. **[P1]** Are data-level RBAC/tenant restrictions enforced in the dashboard and LLM tool layer?
107. **[P1]** What redaction, encryption, access audit, retention and deletion policies apply?
108. **[P1]** What security/threat-model review and penetration testing are mandatory before prod connectivity?
109. **[P2]** Which incident recommendations require four-eyes approval/change tickets?

### L. Delivery, performance, feasibility and budget

110. **[P0]** What is the minimum pilot scope (services, clusters, workflows, on-call team, environments)?
111. **[P0]** Who can approve read-only integrations and provide test incidents and deidentified traces?
112. **[P0]** What baseline metrics exist for incident volume, time to detect, time to acknowledge and time to diagnose?
113. **[P0]** What would make the pilot a failure even if the dashboard looks impressive?
114. **[P1]** What p95 detection/notification timing is required for each critical workflow?
115. **[P1]** What throughput, API quotas and time-series/cardinality budgets constrain the system?
116. **[P1]** What is the accepted availability, RPO/RTO and data-retention envelope?
117. **[P1]** What is the maximum operating cost and who owns it?
118. **[P1]** Is platform deployment into a shared cluster approved, or must collectors run in a restricted network zone?
119. **[P2]** Which external integrations already have enterprise-approved libraries/adapters?
120. **[P2]** What evidence threshold is needed before upgrading an advisory rule into a deployment gate?

### M. Product definition and ownership

121. **[P0]** What is the primary user and first daily workflow: release preparation or active on-call support?
122. **[P0]** Who owns source integration failures, rules, UI and AI outputs after the pilot?
123. **[P1]** Is the platform a team-local tool or a candidate shared service across multiple teams?
124. **[P1]** Which decisions must it *never* make without a human?
125. **[P1]** What existing platform capabilities are required vs nice to have?
126. **[P2]** How will onboarding a new service/workflow be configured and validated?

---

## 9. Ready-to-use Teams Copilot investigation prompts

**Use these prompts *inside the approved Microsoft 365 tenant*.** Restrict Copilot to messages/channels the operator is allowed to access; do not export private transcripts to a public repo. Microsoft notes that Teams Copilot's grounding depends on the initiating user's permissions and accessible chat/channel history. Treat results as research leads, **not verified historical facts** until primary links are checked.

### Prompt 1 — Incident inventory and recurring pain points

> Analyze only Teams messages and channels I am authorized to access for the last **180 days**. Identify discussions of deployment problems, production incidents, UAT/prod mismatches, payment or transaction failures, dependency outages, late discovery after a successful deploy, and production-support escalations.
>
> Group messages into **unique incident episodes** rather than counting each message as an incident. For each episode provide: tentative incident ID; dates and timezone; affected workflow/service and environment when explicitly stated; symptom; impact; detection method; reported underlying cause if confirmed; mitigation; cross-team dependency; tools mentioned; and **clickable original Teams message/thread links**.
>
> Classify evidence separately as **directly quoted observation, team claim, Copilot inference, or unknown**. If you cannot retrieve or cite a source, mark it UNVERIFIED; never invent message links, dates, services, counts, or root causes. Search results may be incomplete due to permissions/retention.
>
> End with (1) frequency by incident category **with denominator and coverage limits**, (2) 10 highest-impact cited episodes, (3) unknowns and channels missing, and (4) questions for the engineers. Do not output secrets, customer/payment data or sensitive message contents; cite minimal context and internal links only.

### Prompt 2 — Environment and deployment discrepancy investigation

> Find dated Teams discussions about configuration drift, feature flags, effective Spring properties, different UAT/prod behavior, mismatched artifact/image versions, dependency versions, Helm values, ConfigMaps, routes and post-release regressions. For each unique incident extract **expected configuration invariant**, **observed difference**, **where it was detected**, **why regression testing did not catch it**, **resolution**, and **prevention opportunity**. Distinguish expected environment-specific variance from unexpected mismatch. Cite original threads; omit secrets and raw property values. Provide a ranked list of candidate comparison policies and the owner who must approve each.

### Prompt 3 — Healthy infrastructure, failed business workflow

> Find incidents where a deployment succeeded or health checks/tests were green but a business process later failed (especially authorization, checkout, payments, queues, settlement and external providers). Build an incident timeline: first symptom, first machine signal, first human report, first page, acknowledgement, suspected cause, confirmed cause, mitigation and resolution. Determine whether existing Dynatrace/Grafana/Splunk alerts fired, were missed, or cannot be verified. Show citations and mark all unknown times. Recommend candidate **business SLIs** and any safe non-mutating production validation opportunities; never suggest real production financial transactions without explicit approval.

### Prompt 4 — Actual tool inventory and coverage gaps

> Using cited Teams discussions (and linked accessible documentation where supported), identify which tools teams use to detect, investigate, escalate and fix incidents: Dynatrace, Grafana, Splunk, Kubernetes, Spring Boot Actuator, deployment pipelines, flag/config systems, tracing, paging, incident management, and internal dashboards. For each tool report actual use cases, observed limitations, authoritative owners, integration/API statements only if documented, and examples where it helped or failed. Separate tool **installed** from **used by the target services**. Include links and an explicit coverage/permission uncertainty column.

### Prompt 5 — Dependency and ownership map

> Extract business workflows and their upstream/downstream functional dependencies from cited incident discussions and technical explanations. For each edge give consumer, provider, workflow operation, synchronous/async type if known, owning team if explicitly named, evidence links, date, and confidence. Identify unannounced changes from other teams, ownership or escalation gaps, and stale/inconsistent dependency descriptions. Do not treat temporal coincidence as proof of causality; output unknown ownership as UNKNOWN.

### Prompt 6 — Current on-call workflow and response gaps

> Identify real examples of how production-support engineers discover, triage, communicate, and hand off incidents. For each case reconstruct the sequence of tool usage, manual Splunk searches, dashboard checks, configuration comparisons, coordination with external teams, alerts, escalation and final fix. Estimate elapsed times only when message timestamps support them and distinguish elapsed chat time from actual time-to-detect. Provide the recurring **manual tasks suitable for automation**, the human decisions that must remain manual, and supporting Teams links.

### Prompt 7 — Contradiction and validation pass

> Review the incident and tool findings generated in previous prompts. Find contradictions, duplicate threads, uncertain classifications, inferred root causes, incomplete coverage, and incidents where existing Dynatrace/Grafana functionality already solved the problem. For each proposed platform feature, find at least one **counterexample** or reason it may be unnecessary. Return a table: claim, supporting primary source, conflicting source if any, confidence, missing evidence, and human validator. Do not increase confidence without stronger evidence.

### Prompt 8 — Convert validated research into requirement candidates

> From only the cited and human-validated findings, draft a prioritized requirements backlog for a proactive reliability platform. Include requirement ID, exact user problem, proposed capability, whether existing tools already solve it, beneficiary and owner, linked incident examples, data/tool prerequisites, measurable acceptance criterion, security/operational risk, priority (must/should/later), and evidence strength. Put unvalidated claims into an **Open Questions** register, not the approved requirements. Highlight the smallest pilot that would reproduce one configuration-drift incident and one cross-team business-flow failure. Keep proprietary details inside our authorized internal system, not a public repo.

### How to run the Teams research

1. Start with **Prompt 1** on a defined time interval and allowed channel set; note the exact query scope and whether Copilot searched all or selected sources.
2. Run **Prompts 2–6** independently so they can surface evidence the first pass missed.
3. Deduplicate episodes using dates, service, symptom, incident-ticket link and resolution; never deduplicate solely on similar wording.
4. Run **Prompt 7** to challenge apparent patterns, then validate at least the top incidents with engineers and original monitoring artifacts.
5. Use **Prompt 8** only after human validation. Store raw research in the approved internal workspace; transfer only sanitized, generalized conclusions into this repository.

---

## 10. Standard incident evidence worksheet

Use one worksheet per unique incident. Unknown fields are explicit; a missing link is not evidence of absence.

| Field | Capture |
|---|---|
| Incident / ticket ID | Internal reference, not public value |
| Date range + timezone | Onset, detection, acknowledgement, mitigation, resolution |
| Affected workflow + business impact | What outcome failed and how measured |
| Involved teams/services/environments | Canonical IDs or approved internal links |
| Symptom | Directly observable error or business failure |
| First detecting source | Dynatrace, Grafana, Splunk, human, customer, other |
| Automated alert status | Fired / did not fire / suppressed / unknown |
| First machine signal | Metric/log/trace/event with timestamp and link |
| What was “green” | Pods, probes, Cucumber, app health, dashboards, if verified |
| Related releases/flags/config changes | Each with timestamp and source |
| Immediate failing hop | Service/dependency based on traces/logs |
| Suspected root causes | Hypotheses with supporting and opposing evidence |
| Verified RCA | Confirmed by whom, method and link; otherwise UNKNOWN |
| Mitigation + permanence | Rollback/workaround/fix, follow-up ticket |
| Prior alerting gap | Missing SLI, detection rule, ownership, delivery, none, unknown |
| POC capability | Could environment comparison, flow SLI, or AI enrichment have helped? |
| Replay available? | Yes/no, restricted dataset, permission, completeness |
| Evidence reliability | High / Medium / Low with justification |
| Privacy classification | Approved operational metadata only / restricted / prohibited |
| Candidate requirement IDs | FR IDs, owner and validation state |

### 10.1 Evidence strength rubric

- **A — Verified:** Primary telemetry/ticket/runbook plus relevant expert confirmation; timeline/source IDs validated.
- **B — Supported:** Multiple primary links or one reliable record; important gaps remain.
- **C — Reported:** Engineer/Teams statement with date but no accessible telemetry or postmortem.
- **D — Hypothesis:** Inferred pattern, no verified specific incident.
- **U — Unknown:** No usable evidence or insufficient access.

**Only A/B evidence should justify blocking deployment or high-confidence root-cause wording.** C/D still help generate questions and candidates.

### 10.2 Example candidate backlog item

- **ID:** FR-12 / BIZ-PAY-001 (example)
- **Problem:** A payment-related upstream failure may go unnoticed despite healthy pods and a passing deploy regression.
- **Source:** Reported by initiator; historical incident evidence TBD.
- **User story:** As on-call support, I want an alert when eligible payment-authorization success degrades so I can investigate before human escalation.
- **Existing-tool check:** Dynatrace/Grafana business-flow rule coverage **UNKNOWN**.
- **Proposed solution:** Reuse existing transaction SLI; if absent, add approved low-cardinality metric and alert with denominator checks.
- **Acceptance:** Replay of the selected historical incident triggers the expected incident route while green pod health does not suppress it; approved negative samples avoid known false alerts.
- **Dependencies:** Eligible-transaction definition, metrics owner, event routing, test dataset.
- **Risk:** False positive from legitimate declines; synthetic test side effects.
- **Status:** Candidate, not approved.

---

## 11. Requirement prioritization and traceability

**Every approved requirement should have a trace chain:**

**Primary evidence → distinct failure mode → affected user/workflow → existing-tool gap → requirement → acceptance test → owning team → measured outcome.**

Use a scoring workshop, not ungrounded numerical precision. Suggested dimensions (rate each low/medium/high with written rationale):
- **Business impact:** customer effect, revenue/operational loss, regulatory risk.
- **Occurrence:** validated incidents per defined period (with search scope).
- **Avoidability:** would prior configuration checks or timely alerts have materially changed outcome?
- **Current coverage:** already fully solved / partially solved / missing / unknown.
- **Implementation effort:** integration access, data quality, complexity, cost.
- **Security and safety:** data access, side-effect risk, policy approvals.

**Hard gates:** A high-value use case cannot start production integration if the data-access or safe-testing approvals are absent. Unknowns remain blockers for the relevant feature, not a reason to invent defaults.

### 11.1 Decision records to create after discovery

| ADR | Choice | Decision inputs |
|---|---|---|
| ADR-001 | Enrichment service vs Dynatrace-native extension | Coverage and licensing audit |
| ADR-002 | Canonical service and workflow identity | Service catalog, tracing, tags |
| ADR-003 | K8s collector placement and permissions | Network zones, RBAC, API scale |
| ADR-004 | State store and event transport | Throughput, retention, existing infrastructure |
| ADR-005 | Drift policy syntax and approval workflow | Real mismatch incidents, config ownership |
| ADR-006 | Business SLI vs synthetic coverage | Safety, observable outcomes, cost |
| ADR-007 | Existing Azure LLM integration contract | Tool/API support, data permissions, evaluation |
| ADR-008 | Incident system of record and notification ownership | On-call workflow and duplication audit |
| ADR-009 | Sensitive data and report retention | Security/compliance approval |
| ADR-010 | Definition of pilot success / go-no-go | Historical replay and metrics baselines |

---

## 12. Phased implementation and verification

### Phase 0 — Discover the actual incidents and existing coverage

**Inputs:** Teams evidence, 10–20 deduplicated cases, tool inventory, operational interviews and policies.

**Outputs:** Incident taxonomy populated with real internal references; authority/permissions matrix; known baseline MTTD/acknowledgement/diagnosis times; dependency/ownership sample; prioritized use cases; explicit “build vs reuse” decision.

**Exit criteria:** Two verified candidate incidents with replayable evidence; one approved POC scope; owners for data sources and security; no outstanding “critical unknown” for read-only pilot.

### Phase 1 — Harden the existing environment POC

Implement normalized IDs, timestamped effective-state snapshots, expected-difference policies, drift history, artifact identity and freshness reporting. Start **advisory only**; never auto-block deployments. Reuse GitOps/config tooling if authoritative.

**Exit tests:** Inject known config/flag mismatch and allowed variance; observe correct PASS/WARN/UNKNOWN; prove no secret leakage; recover from missing Actuator/K8s data; compare current vs last known-good state.

### Phase 2 — Integrate incident and workflow signals

Subscribe to existing Dynatrace/Grafana problems/alerts; collect relevant Splunk queries only after an event; define one production-safe business SLI; map owners and selected dependencies; connect to **existing** incident routing.

**Exit tests:** Replay historical business failure; immediate deterministic alert reaches approved destination; duplicate Dynatrace/Grafana signals produce one correlated incident without suppressing separate impacts; stale/no-data conditions visible.

### Phase 3 — Add evidence-pack and AI investigation

Integrate the existing Azure assistant with narrow read-only tools, audited evidence pack, schema-validated reports, observed-vs-inferred separation, and graceful degradation.

**Exit tests:** Correct evidence retrieval, relevant top hypotheses, explicit unknowns, zero fabricated source links in golden evaluation set, prompt-injection regression, redaction controls, LLM outage still pages humans, no production writes.

### Phase 4 — Unified dashboard, release readiness, and wider service onboarding

Expose release readiness, incident timeline, owner, dependency graph and linked evidence. Reuse existing chat. Add service onboarding policy templates and continuous feedback loop.

**Exit tests:** On-call can navigate from alert to evidence in approved workflow; release engineer sees actionable drift report; access restrictions honored; new service adds coverage without bespoke code where supported.

### Phase 5 — Controlled rollout and optional gates

Expand to selected teams, track performance/cost, review false alarms weekly; only then consider blocking preflight rules or approved runbook automation through separate governance.

**Exit tests:** Demonstrated business value against baseline; positive owner feedback; acceptable alert load; formal security and operational handover.

### 12.1 Historical evaluation matrix

Create a small labeled corpus:
- T01: unexpected UAT/prod effective property drift.
- T02: allowed environment-specific endpoint difference (must **not** alert).
- T03: feature flag with same default but different cohort evaluation.
- T04: production payment failure with green pods and healthy Actuator.
- T05: actual upstream deployment 5 minutes before symptoms but **not causal**.
- T06: upstream deployment verified as contributing cause.
- T07: Grafana and Dynatrace both alert for one problem.
- T08: no data / broken integration; dashboard must show UNKNOWN.
- T09: Splunk denies access or returns partial evidence.
- T10: log contains malicious instructions directed at the LLM.
- T11: AI unavailable, incident alert still delivered.
- T12: event duplication, out-of-order resolution and watch reconnection.
- T13: low traffic causes misleading 100% failure rate on one attempt.
- T14: authorized account can see one service but not another's restricted evidence.
- T15: wrong owner mapping and conflicting telemetry; report states uncertainty.

Measure **detection recall/precision** against labeled incidents, **coverage**, **p50/p95 MTTD**, alert delivery latency, **time to actionable evidence**, number of duplicated pages, AI fact citation validity, and investigation usefulness scored by engineers. Report sample sizes and selection bias.

### 12.2 Pilot go / no-go criteria (to negotiate, not fabricated targets)

- Required incidents replay with timestamps, denominators and documented baseline.
- No privileged data exposed in notifications, logs or AI reports during negative testing.
- Critical alert path remains operational without LLM.
- No unintended customer-facing synthetic side effects.
- Accepted false-positive/false-negative rate agreed by service owner.
- Existing alerting/incident system remains authoritative.
- Observability and platform teams accept connector API load, cost and ownership.
- Human on-call reviewer can explain why the system generated each finding.

---

## 13. Security, privacy, operations and threat model

### 13.1 Trust boundaries

- **Production Kubernetes/Actuator:** Read-only subject-scoped access; deny Secrets and unnecessary endpoint access; isolate credentials; least privilege per env/namespace.
- **Observability tools:** API tokens scoped to permitted indexes/environments/services; bounded queries and query auditing; do not bypass a human user's permissions through service account aggregation.
- **Existing Azure LLM assistant:** Distinct tool permission boundary; never pass unsanitized logs/headers, payment details or customer payloads; prohibit unreviewed write tools.
- **Teams discovery:** Message text is untrusted and possibly regulated. Limit research by tenant permissions/retention; verify facts; never silently train a shared knowledge store on messages.
- **Dashboard:** SSO and fine-grained authorization; source deep links rely on existing access; avoid embedding permanent bearer URLs.
- **External/public repo:** Generalized plans only. Internal incident inventory and actual connector contracts belong in an approved private workspace.

### 13.2 Threats and mitigations

| Threat | Mitigation |
|---|---|
| Exposed credentials or sanitized-but-reversible secrets | Do not collect values; service identity + secret manager; classification and redaction tests |
| Prompt injection embedded in logs or Teams messages | Treat retrieved text strictly as evidence; tool allowlists; no instruction following from sources; validate outputs |
| Cross-team privilege escalation | Source-permission checks enforced server-side, scope-limited tokens and report access |
| Malicious forged alert webhook | Sender authentication/signature or network policy, schema checks, deduplication and rate limiting |
| AI hallucinated root cause | Evidence-linked facts, explicit uncertainty, verification workflow and negative test set |
| Duplicate pages from correlation error | Preserve authoritative incident IDs; conservative grouping and feedback |
| Stale collector causes false “all healthy” | Freshness watchdog, UNKNOWN states, self-monitoring and error budget |
| Excessive Splunk/trace queries cause load/cost | Time bounds, allowlisted templates, quotas, circuit breakers, caching where allowed |
| Unapproved synthetic payment | No active financial transaction without documented approval, isolation and cleanup |
| Sensitive incident report leaked to broad Teams channel | Data-minimized notifications, scoped links and authorization checks |
| Drift policy creates unsafe deployment block | Advisory first; reviewed exceptions, manual override and auditable gate ownership |
| Data retention exceeds policy | Per-data-category TTL, provenance, deletion, and approved storage region |

### 13.3 Operational runbook obligations

- Connector credential expiry, token rotation, rate-limit and source outage handling.
- Watch/informer resynchronization after 410 Gone; explicit retry budgets and 429 backoff.
- Event inbox/outbox recovery, poison messages, safe replay and dedupe.
- False-positive reviews; exception expiry; alert fatigue monitoring.
- Policy version rollout, backward compatibility and rollback.
- AI model/tool regression suite; evaluation after prompt/model changes.
- Human correction capture and “report withdrawn / hypothesis disproven” notification where appropriate.
- Logging and metrics for the reliability platform itself, including when **it** is degraded.

---

## 14. Stakeholder interview plan

**Session A — On-call + payment-domain owners (60–90 minutes):** Walk one real late-detected payment incident from first failed business transaction to verified fix. Validate taxonomy P05/P06/P14/P15 and questions 1–12, 25–36, 82–90. Request approved telemetry and explicit definition of success/decline.

**Session B — Release + application/QA owners (60–90 minutes):** Walk one UAT/prod mismatch. Capture approved drift rules, artifact promotion, Cucumber limitations, feature-flag targeting and candidate preflight checks. Validate questions 13–24, 62–72.

**Session C — Observability/SRE (60–90 minutes):** Demonstrate Dynatrace Problems/topology, Grafana alert routing, Splunk searches and actual missing coverage for the two incidents. Validate questions 37–61; make explicit build-vs-reuse decision.

**Session D — Platform/security/AI owners (60–90 minutes):** Confirm read-only integration boundaries, Azure assistant API/tool contracts, private evidence workspace, data redaction and pilot deploy model. Validate questions 91–109, 110–120.

**Session E — Cross-team service owners and incident management (45–60 minutes):** Confirm dependency graph and change-event availability, ownership resolution and escalation. Validate questions 73–90 and 121–126.

Each session should end with: **agreed facts**, **disputed facts**, **evidence to obtain**, **open decision/owner/date**, and **requirement status**. These are suggested agendas; adapt durations to availability.

---

## 15. Open decisions and immediate actions

### 15.1 Highest-impact unknowns

| Rank | Unknown | Why it matters | Who to ask |
|---|---|---|---|
| 1 | Did Dynatrace/Grafana actually detect the past payment failures? | Determines detection vs enrichment investment | Observability owner + on-call |
| 2 | What are the exact critical business SLIs? | Prevents misleading alerts for normal declines | Product/payment owner |
| 3 | Can incident evidence be replayed securely? | Needed for credible pilot evaluation | SRE + security |
| 4 | Is effective configuration/flag evaluation accessible safely? | Determines drift accuracy and security feasibility | Application + flag owner |
| 5 | What does the existing Azure assistant expose as supported programmatic API? | Avoids recreating or misusing chat capabilities | AI platform owner |
| 6 | Which source owns incident identity, routing and acknowledgement? | Prevents duplicate pages and competing state | Incident management |
| 7 | Can other teams' deployments/changes be observed? | Determines root-cause correlation quality | Platform + service owners |
| 8 | What can be collected/shared/retained across tools? | Sets architecture and privacy boundaries | Security/compliance |
| 9 | Does the organization already have service catalog/contract tests/GitOps? | Avoids redundant work | Platform + QA |
| 10 | Is this intended as local tool or shared organizational platform? | Drives tenancy, RBAC, scale and governance | Sponsor / engineering lead |

### 15.2 Suggested next sequence

1. Run Teams Copilot **Prompts 1–3**, capture internal citations and choose two incidents.
2. Independently check the incidents in **Dynatrace, Grafana, Splunk** and existing incident tracker; distinguish “not observed” from “not accessible.”
3. Run prompts **4–7** to create tool/owner/dependency inventory and challenge assumptions.
4. Inspect the Kubernetes/Actuator POC and existing Azure assistant APIs **in the approved internal environment**; produce a capability matrix, not a hypothetical integration promise.
5. Interview owners, get read-only and privacy approvals, negotiate pilot SLI/latency targets.
6. Convert **validated** findings via Prompt 8 into signed-off user stories and ADR decisions.
7. Implement Phase 1/2 thin POC; add AI only after detection and evidence handling are trustworthy.

**Stop/go principle:** If existing Dynatrace/Grafana can already detect the highest-impact incidents reliably, prioritize on-call routing, change correlation, config drift and evidence enrichment. If they cannot, implement **only the missing business-level monitoring**, preferably inside established observability infrastructure.

---

## 16. Official reference starting points (verify against enterprise-installed versions)

These references support *potential integration approaches*, not claims that the corresponding capability is licensed, enabled, accessible, or already configured in your organization.

- Dynatrace APIs and access model: https://docs.dynatrace.com/docs/dynatrace-api
- Dynatrace Problems app / incident investigation: https://docs.dynatrace.com/docs/dynatrace-intelligence/problems-app
- Dynatrace Problems API v2: https://docs.dynatrace.com/docs/dynatrace-api/environment-api/problems-v2
- Dynatrace event analysis and correlation: https://docs.dynatrace.com/docs/dynatrace-intelligence/root-cause-analysis/event-analysis-and-correlation
- Dynatrace Smartscape-on-Grail migration note: https://docs.dynatrace.com/docs/dynatrace-api/environment-api/entity-v2
- Grafana contact points: https://grafana.com/docs/grafana/latest/alerting/fundamentals/notifications/contact-points/
- Grafana webhook notifier: https://grafana.com/docs/grafana-cloud/observe-and-act/alert-and-measure-reliability/alerting/configure-notifications/manage-contact-points/integrations/webhook-notifier/
- Splunk REST search jobs: https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-tutorials/10.4/rest-api-tutorials/creating-searches-using-the-rest-api
- Splunk search endpoint versions: https://help.splunk.com/en/splunk-enterprise/leverage-rest-apis/rest-api-reference/10.2/search-endpoints/search-endpoint-descriptions
- Kubernetes API list/watch and resource versions: https://kubernetes.io/docs/reference/using-api/api-concepts/
- Spring Boot Actuator endpoints / sensitive values: https://docs.spring.io/spring-boot/reference/actuator/endpoints.html
- Microsoft Copilot in Teams and user-grounded permissions: https://support.microsoft.com/en-us/teams/chat-channels/how-to-use-microsoft-365-copilot-in-teams-group-chats
- Microsoft Copilot Search permission boundaries: https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-search-faq

---

## 17. Document change control

- **v0.1 — 2026-11-05:** Initial candidate architecture and requirements-discovery questionnaire based on the initiator's reported incident patterns, tooling and POC. This is not an audit of the organization's systems or an assertion that any production API is authorized.
- **Next revision:** Add sanitized and approved incident pattern summaries; tool coverage matrix; agreed priorities; named internal decision owners; approved requirements and measurable baselines. Keep all confidential records in an approved **private** system, linked only where authorized.

**Acceptance for this document:** Stakeholders can use it to systematically discover problem frequency, current monitoring gaps, tools, ownership, constraints and pilot acceptance criteria **before** building the platform.
