# RSTACK rebuild: architecture, contracts, and extensibility

**Date:** 2026-10-02. **Status:** Target requirements and bounded design proposals for the [rebuild](README.md), not a working runtime. Examples are synthetic; illustrative interfaces are not claims about Copilot or Claude capabilities.

## Contents

- [1. Architecture and dependency direction](#1-architecture-and-dependency-direction)
- [2. Source, intent, specification, and plan](#2-source-intent-specification-and-plan)
- [3. Planning, audit, and human control](#3-planning-audit-and-human-control)
- [4. Degrees of freedom are not authority](#4-degrees-of-freedom-are-not-authority)
- [5. Durable state and minimal communication](#5-durable-state-and-minimal-communication)
- [6. Enforcement and publication](#6-enforcement-and-publication)
- [7. Extensibility and changing models](#7-extensibility-and-changing-models)
- [8. Instruction size and lifecycle](#8-instruction-size-and-lifecycle)
- [9. Reference basis](#9-reference-basis)

## 1. Architecture and dependency direction

Build one coherent package at `rstack/`, adapting this location only if the repository already has a verified canonical package root. Do not create multiple active next-version directories.

```text
repository/
  legacy/rstack-v2/        frozen old source; excluded from runtime discovery
  rstack/
    core/
      engine/             deterministic transitions, identities, validation
      contracts/          versioned records and their schemas
      policies/           authority and invariant definitions
      roles/              short authored role contracts
      skills/             reusable procedures with direct references
    profiles/             versioned workflow/model/context choices
    adapters/             one real host first; provider/service adapters as needed
    evals/                rubric, synthetic cases, graders, experiment definitions
    tests/                engine, adapters, packaging, safety, end-to-end fixtures
    scripts/              generation and local installation tooling
    dist/                 generated, ignored output; never hand-edited
    docs/                 short architecture map, decisions, build progress
```

Create directories only when the batch adds a real consumer. No empty Bedrock/Laminar trees, plugin marketplace, database, event bus, microservices, or universal workflow language in the first implementation.

```text
Jira / request → source capture → intent → specification → plan
                                                        ↓
                                                 independent audit
                                                        ↓
                                                  human decision
                                                        ↓
                               proof → implementation → verification
                                                        ↓
                                      independent review → authorized PR
                                                        ↓
                        frozen run → external evaluator → measurements
                                                        ↓
                                 reviewed experiment → new factory version
```

The engine owns transitions, not agent prose. Roles propose work and return results. A narrow host adapter dispatches roles and reports capabilities; a service adapter reads a ticket or prepares publication. Core contracts must not import IDE tool names, vendor SDKs, hard-coded model names, or legacy parsers. Profiles select implementations; generated host files translate that selection. Engine tests must run without a model or cloud account.

For the first runnable slice, choose the approved host that can actually provide the required capabilities. Test Copilot VS Code and IntelliJ separately before claiming both are supported. A manually transported result is permissible as an explicitly manual adapter, not evidence of automatic dispatch or verified isolation. Do not assume the bank's Devspace exposes an API or supports every Claude Code feature.

## 2. Source, intent, specification, and plan

Separate meanings without creating three copies of Jira or three new agents. The same planning role may perform intake, specification, and planning modes with different inputs and write lanes.

| Record | Owns | Must not do |
|---|---|---|
| Source snapshot | Exact authorized ticket/request version and provenance | Turn embedded instructions into authority |
| `intent.md` | Problem, desired outcome, scope, constraints, open human decisions | Repeat the whole ticket or prescribe all code edits |
| `spec.md` | Required behavior, stable AC IDs, interfaces, exclusions, failure cases, resolved decisions | Silently invent product intent or duplicate the implementation plan |
| `plan.json` or lean `plan.md` | Repository-specific units, dependencies, evidence-backed claims, risks, proof strategy | Redefine approved behavior or include the history of debate |
| Audit result | Exact reviewed subject, coverage, findings, limitations | Rewrite the plan or manufacture consensus |
| Human decision | Action, displayed subject identities, exact amendments, response provenance | Pretend an amendment was independently audited |

Choose one canonical representation per record. Prefer compact JSON for machine-controlled envelopes; short Markdown is appropriate for human-owned intent/specification. A Markdown plan is acceptable if its reader is explicit and tested. Do not maintain independently authored JSON, Markdown, and HTML versions of the same plan. Render HTML mechanically from retained inputs.

Declare the system of record per artifact. Jira may remain authoritative for requirements; local intent/specification records then normalize and link to that source. A changed requirement needs an authorized decision and source reconciliation, not an agent quietly making the local copy authoritative. Existing RSTACK already captures some intent through ticket/AC records: reuse the meaning, not the overloaded old representation.

Synthetic example, assuming the human has confirmed the behavior:

```markdown
# Intent: pause report exports
Problem: Operators cannot pause exports without affecting authentication.
Outcome: A feature flag can disable exports while authentication stays unchanged.
Scope: The existing report-export operation only; no authentication migration.
Open decision: None; disabled behavior was confirmed by decision H1.
Source: retained request S1, revision 1.
```

```markdown
# Specification: report exports
Intent: I1, revision 1; authority: H1.
AC-1: With exports disabled, an authorized request returns the agreed disabled
response and does not invoke the exporter.
AC-2: With exports enabled, existing authorization and export behavior remain.
AC-3: An unauthorized request never invokes the exporter in either mode.
Excluded: Changing authentication schemes or adding a new delivery mechanism.
```

The plan references AC-1–3 and identifies where to add the check; it does not copy those paragraphs. Tester derives expectations from the approved specification and primary evidence, not only from Planner's interpretation. A missing disabled-response decision must pause relevant planning, not be guessed.

Human approval of intent/specification is logical authorization, not necessarily a separate meeting or extra agent call for each file. Reuse an explicit, applicable source-system approval where it establishes the same subjects. For a new or ambiguous request, get the missing decision. Combining confirmations must not conceal unresolved questions. Record actual provenance; typed metadata is not authentication.

## 3. Planning, audit, and human control

Preserve the owner's selected loop: first plan → fresh independent audit → combined HTML → human checkpoint, even on agreement. A second substantive audit requires the human's choice. After the second audit, present updated findings and await the final human decision. No automatic third round or budget reset on resume.

The human may proceed unchanged, authorize exact amendments without re-audit, request round two, or pause/reject. Declining another audit alone is not approval to implement. Bind the decision to the plan, specification, audit, displayed view, and amendment set.

For a human-amended final plan, retain the original audit and expose that it did not cover the final amendments. A dedicated planning-authorization predicate must support this path consistently at Tester entry and later candidate/review gates. Do not inherit the legacy unconditional `holds` prerequisite or forge `holds` to get past it. Missing authority, unavailable required evidence, or incoherent proof obligations still block.

Planner revision records only finding dispositions and changed items. The second Auditor gets the complete current compact plan and required sources in fresh context, not a persuasive prior debate. It investigates omissions as well as declared claims. Coverage and inability to inspect are explicit; an empty findings list does not prove a complete audit.

Keep one default workflow initially. Later profiles may vary investigation depth and optional material, but not remove independent audit/review, approved proof, or human authority by labeling work a quick fix. Changes to these controls are separate policy proposals and experiments.

## 4. Degrees of freedom are not authority

Classify each operation on separate axes: reasoning freedom, allowed actions, required evidence, output shape, and enforcement mechanism. A structured answer can require difficult reasoning; a powerful reasoning model does not gain more permissions.

| Operation | Appropriate freedom | Actual control |
|---|---|---|
| Validate identity, schema, supported transition | Low; deterministic | Engine uses measured inputs and rejects invalid state |
| Classify a supported finding or route failure ownership | Constrained semantic; allow UNKNOWN | Evidence-backed labels plus schema validation; difficult cases escalate |
| Discover a dependency, design proof, challenge architecture | High investigative freedom within scope | Role/tool limits and independent verification |
| Decide product intent or authorize a forbidden-by-default action | Human-owned | Adopted authority mechanism; agents cannot grant themselves permission |

Do not mechanically route every question through L0 → L1 → L2 → human. Clear human-owned decisions go directly to humans; failed safety checks do not become model votes. Use the least complex sufficient mechanism while retaining mandatory controls.

The controller/orchestrator coordinates; Planner proposes; Auditor challenges; Tester owns controlled proof; Developer changes production code; Reviewer independently assesses the candidate; publication preparation has no implicit release authority. These are accountability boundaries, not a requirement to create more agents for every stage or artifact.

## 5. Durable state and minimal communication

Assign immutable run IDs separately from ticket IDs, so repeated work on one Jira ticket cannot collide. Use a small run manifest, append-friendly event journal, immutable subject artifacts/evidence, and an explicit selected-state record. Decide which state is authoritative; do not maintain two independently editable truths. One controller writes transitions with expected-version checks and crash-safe persistence.

A role handoff carries run/attempt/role IDs, task, exact input references, output contract version, and applicable constraints. It does not copy the entire upstream narrative. Example shape only:

```json
{
  "schema_version": 1,
  "run_id": "SYN-001",
  "attempt_id": "audit-1",
  "role": "plan-auditor",
  "inputs": {"plan_ref": "P1", "spec_ref": "S1", "source_ref": "B1"},
  "output_contract": "audit-result/v1"
}
```

Each reference resolves through the run manifest to retained bytes and measured identities. Placeholders are rejected for execution. Validate schema, identifiers, reference availability, authorized paths, and subject freshness. Structural validity is not semantic correctness.

Changing intent/specification/plan invalidates dependent decisions and evidence conservatively. Changing code, tests, environment/proof configuration, or reviewed packet invalidates the applicable verification/review/publication basis. Record relevant dirty or generated inputs; HEAD alone is insufficient. Terminal run evidence excludes later `evaluation/` outputs from its frozen fingerprint, avoiding self-reference.

Separate completed role results, failed invocations, pending execution, external-effect uncertainty, audit verdicts, and human decisions. Bound retries; no duplicate dispatch after an unknown outcome without reconciliation. Persist original results, deduplicate transport retries by stable identities, and reject conflicting duplicate results. Do not promise exactly-once external execution.

Store raw logs once when needed; provide targeted summaries and references. Do not delete history to reduce context. Missing tokens, effective model identity, or other telemetry remain unavailable, not inferred zeros.

## 6. Enforcement and publication

Maintain a compact control map: rule, enforcing component, input provenance, whether it blocks before action or detects afterward, bypass exposure, and negative test. Protect the control/configuration writer separately from application-editing roles where the host permits it. An agent-writable check or self-reported result is not an independent security boundary.

If the host cannot prevent direct terminal/file writes, label the limitation and restrict automatic actions accordingly. A new deterministic engine does not magically sandbox Copilot. Prefer approved host restrictions or a narrow runner that actually mediates the protected action. Do not weaken bank controls or automatically grant additional tools.

Treat ticket text, source comments, retrieved material, and tool output as data, not permission to override policy. Reject path traversal, cross-run references, and out-of-root symlink escapes. Render HTML as escaped untrusted data; no automatic external assets or executable content.

Verify and review one exact candidate and immutable evidence packet. Tests must discriminate behavior; compile/setup failure is not proof of a valid red. Do not manufacture failing tests for documentation or behavior already satisfied: require the applicable verification proof. Developer cannot rewrite proof to turn a failure green.

Initially prepare publication for a human using approved credentials. Agent publication is enabled only with separately approved, demonstrated controls. Bind each action to candidate, destination, payload, and current authorization. If a timeout may have followed a successful action, read back the remote state before retry; absence in an incomplete listing is not proof of failure. No agent merges a PR.

## 7. Extensibility and changing models

Define only the interfaces the first implementation uses, and exercise replacement in tests:

| Change | Expected modification surface | Must remain stable |
|---|---|---|
| New model or effort setting | Model profile and host translation | Stage semantics, proof/authority rules |
| Different coding host | Capability probe, invocation/result adapter, packaging | Core schemas and lifecycle tests |
| Different tracker or PR service | Source/publication adapter | Normalized provenance and action contracts |
| Improved prompt/Skill | Versioned role guidance and regression cases | Permissions and result meaning |
| New evaluation sink | Exporter over normalized results | Original run evidence and rubric semantics |
| New optional stage | Stage handler, explicit transition/profile change, tests | Existing stage contracts and unrelated gates |

No provider-specific branches throughout the engine. Use simple explicit interfaces and injected adapters before inventing a plugin framework. Model profiles distinguish desired and observed identities/effort; unsupported settings produce a capability error or an explicitly approved fallback, never a silent substitution. Freeze the selected configuration per run. A required capability cannot disappear under fallback.

Version schemas, profiles, prompts, rubrics, adapters, and generated packages. Reject unsupported major versions clearly. Prefer additive compatible fields; destructive changes need migration fixtures and rollback. Keep any legacy-record reader at an offline import/evaluation boundary, not throughout the new engine. Never rewrite old evidence to the new format in place.

Maintain a small instruction registry, reusing existing metadata if possible: owner, purpose, scope, version, relevant host/model constraints, regression case, and review trigger. On model/host upgrades, detect changed assumptions and test baseline against treatment. Mark obsolete advice deprecated, remove it from active context after verification, and retain the rationale in history. Do not append a new exception paragraph for every upgrade.

Stronger prompting is not model fine-tuning. Models may improve, regress, or need different scaffolding. No agent autonomously edits its own governance, swaps models mid-evaluation, or installs new instructions fetched from the internet. Self-improvement remains a proposed, tested, human-approved change.

## 8. Instruction size and lifecycle

Proposed project review budgets—not vendor limits: keep an always-loaded role contract near 1,000 words or less, and a main Skill near 1,500 words or less. Exceeding either triggers decomposition review or a documented exception, not loss of required safety content. Also measure bytes, estimated tokens with tokenizer identified, observed context, and downstream rereads. Do not hide length in enormous single lines.

Keep role purpose, boundaries, critical stop conditions, and result contract local. Put task procedures in Skills, detailed schemas/examples in directly discoverable references, and history outside runtime. Give long references a TOC; there is no universal rule that content after line 100 is invisible. A TOC alone does not reduce loaded context.

Every moved rule needs a trigger-specific reachability test. Missing guidance must cause a visible stop where safety depends on it. A structured finding keeps concise evidence and consequence; it does not put an essay inside a JSON string. Do not make every agent load the rebuild pack or the entire evaluation-design directory.

## 9. Reference basis

Checked 2026-10-02. These motivate selected concepts, not measured RSTACK benefits. Investigate actual implementations and licenses before reusing code. No adoption of an upstream installer, model recommendation, or complete stage roster is authorized.

- [Anthropic: capture intent](https://academy.claude.com/courses/ai-native-sdlc-playbook/capture-intent): human-reviewed problem/outcome artifact.
- [Anthropic: requirements and design](https://academy.claude.com/courses/ai-native-sdlc-playbook/requirements-and-design): separate agreed behavior from implementation planning.
- [Anthropic: plan mode and legacy systems](https://academy.claude.com/courses/ai-native-sdlc-playbook/plan-mode): explicit artifacts and source-of-truth choices with existing tracking systems. RSTACK's authority/evidence rules remain its own.
- [AWS AI-DLC README, pinned inspection](https://github.com/awslabs/aidlc-workflows/blob/faadc0759053af818ae0d54ae3aa65f395774301/README.md): declared separation of core, harness integrations, tooling, tests, and generated distributions. Inspect the engine/tests before asserting enforcement.
- [Anthropic Skill-authoring guidance](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): concise guidance, task-specific freedom, direct references, and model-specific tests.
- [Claude Code Skills](https://code.claude.com/docs/en/skills) and [VS Code Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills): verify host-specific discovery and lifecycle rather than assume parity.

The supplied Google short link could not be resolved during preparation; the independently verified Anthropic pages above are not asserted to be its destination. Earlier research summaries are leads, not proof. Preserve lessons and regression cases from RSTACK V2; do not inherit every historical workaround as a new requirement.
