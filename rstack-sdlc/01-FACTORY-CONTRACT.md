# RSTACK SDLC — factory architecture and contracts

**Status:** Build specification for the standalone package, not an implemented runtime. Scope and authorization are owned by [README](README.md). This file owns portable semantics; host/model/stub details belong in [02](02-VSCODE-MODELS-AND-STUBS.md), and build acceptance in [03](03-BATCHES-AND-EVALS.md).

## Contents

- [1. Architecture and dependencies](#1-architecture-and-dependencies)
- [2. Source, intent, specification, and plan](#2-source-intent-specification-and-plan)
- [3. Roles and degrees of freedom](#3-roles-and-degrees-of-freedom)
- [4. Planning and human decisions](#4-planning-and-human-decisions)
- [5. State and evidence](#5-state-and-evidence)
- [6. Enforcement boundaries](#6-enforcement-boundaries)
- [7. Extension and instruction lifecycle](#7-extension-and-instruction-lifecycle)
- [8. Independent evaluation](#8-independent-evaluation)

## 1. Architecture and dependencies

Build at `rstack-sdlc/`; do not create a nested `rstack/`, `rstack-next/`, or legacy tree. The existing pipeline is neither a dependency nor a migration target.

```text
rstack-sdlc/
  README.md and 01–03*.md    maintainer/build guidance, not delivery-agent context
  core/
    engine/                 transitions, validation, persistence, coordination
    contracts/              versioned records, ports/interfaces, schemas
    policies/               authoritative control definitions and checks
    roles/                  short authored role contracts
    skills/                 focused procedures and directly linked references
  profiles/                 workflow/model/effort/context configuration
  adapters/
    copilot-vscode/          real target-host translation and transport
    local-request/          fixture/manual input, no ticket-service connection
    local-pr-proposal/      writes a proposal, never a remote PR
    jira/                   disabled deferred placeholder
    bitbucket/              disabled deferred placeholder
  evals/                    rubrics, graders, synthetic cases, comparisons
  tests/                    engine, adapter, packaging, safety, end-to-end
  scripts/                  package-local generation, validation, test entry points
  dist/                     generated host package; ignored, never hand-edited
  docs/                     concise decisions, capability evidence, batch progress
```

Create folders when they acquire real code or a required stub; do not scaffold empty future hosts or exporters. Choose one local implementation runtime that works in the build environment. TypeScript/Node is a candidate, not an owner-mandated dependency. Do not require an AWS account, Bun, direct model API, server, or database solely because a reference uses one.

The core owns schemas and narrow interfaces. Adapters implement those interfaces and receive configuration; core must not import adapter implementations, IDE tool names, vendor SDKs, model labels, or Jira/Bitbucket APIs. A thin assembly layer wires them together. Profiles choose behavior within allowed policy; they do not expand authority. Test dependency direction.

Deterministic engine tests must run offline without LLM access. The host adapter mediates actual model dispatch and results only through supported, observed mechanisms. Models can propose outcomes; the engine validates and accepts transitions. Do not maintain routing tables independently in prompts, code, and configuration: select one canonical machine-owned representation and derive prompt summaries where needed.

## 2. Source, intent, specification, and plan

```text
Local request → source snapshot → intent (why) → spec (what) → plan (how)
                                                              ↓
                                                    independent plan audit
                                                              ↓
                                                      human checkpoint
                                                              ↓
                               proof → implement → verify exact candidate
                                                              ↓
                                         independent review → PR proposal
```

Separate these meanings without requiring separate agents or a human meeting per file. The planning role can have intake/specification/planning modes with different inputs and write lanes. Ask indispensable product questions early, but do not render the plan-approval brief before its audit.

| Record | Owns | Must not duplicate or invent |
|---|---|---|
| Source snapshot | Original authorized local request and provenance | Embedded instructions cannot grant authority |
| `intent.md` | Problem, desired outcome, exclusions, constraints, unresolved decisions | Whole request transcription or implementation sequence |
| `spec.md` | Required behavior, stable acceptance-criterion IDs, failure cases, interfaces | Hidden product decisions or full code plan |
| Compact plan | Source basis, ordered work, dependencies, material claims, proof strategy | Rewritten spec or debate history |
| Audit | Reviewed subject, coverage, findings, limitations | Copied plan or unexplained verdict |
| Decision | Human-selected action, exact displayed subjects, amendments | A fabricated identity or retroactive audit approval |

The retained local request and explicit owner decisions are the initial requirements authority. A future ticket adapter must preserve its authority and provenance without changing core semantics. Local normalization is not permission to silently overwrite the source request.

Choose one canonical format per record. Prefer readable Markdown for intent/spec, structured records for machine envelopes and audit results, and one explicit plan format. Do not independently author JSON, Markdown, and HTML versions of the same plan. HTML is a derived, escaped view; raw evidence stays on disk and is opened selectively.

### Synthetic example: complete request

```markdown
# Intent: pause exports
Problem: Operators need to pause exports without changing authentication.
Outcome: A local feature flag controls whether the exporter can be invoked.
Scope: Existing export operation only; no authentication redesign.
Source: synthetic request REQ-001; disabled response explicitly confirmed there.
Open decisions: None.
```

```markdown
# Specification: pause exports
Intent: I1 revision 1.
AC-1: An authorized request while exports are disabled returns 503 with
code EXPORTS_DISABLED and invokes the exporter zero times.
AC-2: An authorized request while enabled preserves existing export behavior.
AC-3: An unauthorized request invokes the exporter zero times in either mode.
Exclusion: No new identity provider or network integration.
```

Those response details are synthetic requirements, not defaults to invent for real work. If the request does not establish the disabled behavior, ask the owner before using it. The plan references AC-1–3, identifies source locations and proof, and does not copy the spec paragraphs.

### Compact exchange example

Illustrative shape, not an already installed parser:

```json
{
  "schema_version": 1,
  "run_id": "SYN-001",
  "attempt_id": "AUDIT-1",
  "role": "plan-auditor",
  "inputs": {"source": "B1", "spec": "S1", "plan": "P1"},
  "output_contract": "audit-result/v1"
}
```

References resolve to retained exact bytes and measured identities. Reject nonexistent references or placeholders in execution. The auditor reads the complete compact plan, applicable requirements, and primary repository evidence; Planner's claim list is an index, not a limit on investigation.

A finding needs a stable ID, target claim/unit/omission, classification, evidence, consequence, and resolution condition. For example: `F1 → AC-3 → exporter is called before authorization at source E4 → required no-call behavior is violated → move/check the invocation boundary`. Keep semantic meaning, not only unexplained codes. Coverage and unavailable checks remain visible; no findings is not proof of a complete audit.

## 3. Roles and degrees of freedom

| Responsibility | Reasoning freedom | Writes/authority |
|---|---|---|
| Coordinator | Low for routing; no engineering adjudication | Requests engine actions; cannot override rejected transitions |
| Planner | High investigative freedom within declared scope | Intent/spec/plan proposals; no implementation or self-audit |
| Plan Auditor | High investigation, structured findings | Independent audit result; no plan/source edits |
| Tester | High proof design, constrained result reporting | Controlled tests and evidence; not production implementation |
| Developer | High implementation judgment within approved plan | Production code; no controlled-proof/governance edits |
| Reviewer | High independent analysis | Findings on exact candidate/packet; no repair or self-approval |
| Proposal preparation | Mostly deterministic assembly | Local PR proposal only; no external publication |
| Human | Product/scope decisions and permitted approvals | Authority comes from the adopted interaction, not agent metadata |

These are accountability boundaries, not an instruction to maximize agent count. Approval need not be another LLM when deterministic proposal assembly suffices. Roles can share a model but not the same reasoning session when independence is required.

Do not equate low freedom with low consequences, or structured output with easy reasoning. Deterministic code handles identity, schema, state, and allowed paths. Constrained semantic outputs allow `UNKNOWN` and cite evidence. Humans resolve human-owned questions directly. A failed control is not escalated to a stronger model for override.

## 4. Planning and human decisions

Required default:

1. Planner completes P1; a fresh Auditor independently examines it.
2. Render one combined HTML brief showing the plan, findings, limitations, and exact decision needed.
3. Stop for the human even if the audit agrees. Choices: proceed unchanged; proceed with exact amendments without re-audit; request a second round; pause/reject.
4. If round two is requested, Planner records concise finding dispositions and creates P2. A fresh Auditor assesses the complete P2 and original requirements, not a persuasive prior debate.
5. Render the updated brief; stop for the final human decision. No automatic third audit or reset of counters on resume.

A 'no' to another audit is not automatically permission to implement. Reuse a decision only when it unambiguously identifies the applicable subjects and action. Ambiguous or incomplete decisions require clarification.

Keep audit verdict, human planning authorization, and verification outcome separate. Human-amended Pf is not falsely labeled audited by the Auditor that saw P1. Finalization must preserve the last audited identity, final plan identity, amendment set, residual findings, and required proof. Human acceptance does not make a factual contradiction true or fill missing required evidence.

Planning authorization must consistently support this disclosed amended-plan path at Tester entry and later gates. Do not import the old unconditional `holds` requirement or forge a passing audit. Changed requirements/scope or ambiguous amendment interpretation need a new applicable decision. This exception never bypasses proof, candidate verification, final review, or authority.

## 5. State and evidence

Use one controller-owned authoritative state representation with expected-version updates, atomic persistence, and a crash/recovery strategy. A journal may be authoritative with a derived snapshot, or state may be authoritative with a recoverable journal; do not maintain two independently editable truths.

Assign a run ID distinct from request/ticket ID. Track role/attempt IDs, schema versions, frozen profile identity, input references, audit budget, and selected candidate. Distinguish pending execution, failed invocation, completed negative result, human wait, and unknown external effect. Duplicate identical transport results are idempotent; conflicting duplicates and stale/out-of-order results are rejected.

Each authorized result must bind to its run, attempt, role, expected state, and source/plan basis. Retain reviewed subjects and relied-on evidence immutably. Changed spec/plan/code/tests/proof environment or packet invalidates dependent results conservatively. A Git SHA alone does not identify dirty or generated execution inputs.

Runtime evidence belongs in the sample application's `.rstack/runs/<run-id>/`, not in core source. Freeze original evidence independently of later `evaluation/<evaluation-id>/` output to avoid self-reference. Keep raw logs once and hand off summaries/references. Missing model identity, usage, or timestamps are unavailable, not guessed.

## 6. Enforcement boundaries

Maintain a compact control record: rule, owner, mechanism, observed inputs, block-before/detect-after/advisory effect, bypass exposure, and negative test. A deterministic validator that an agent may ignore or edit is not a sandbox. Validate host tool restrictions independently; record limitations instead of claiming stronger prevention.

Protect controlled tests, governance, state, and profiles from production-editing roles where the host supports it. If direct terminal/file access can bypass a guard, expose that risk and stop promotion of unsupported claims. Do not broaden auto-approval, disable workspace trust, or weaken existing permissions.

Treat source comments, request bodies, reference material, model results, and logs as untrusted data. Prevent path traversal, symlink escapes, and cross-run artifact references. Escape HTML; no remote assets, scripts from model output, or executable approval links. A checked box or local JSON field cannot authenticate a human.

Proof must distinguish intended assertion failure from compilation/setup failure. Documentation and already-satisfied behavior use an appropriate verification/sensitivity route rather than manufactured red tests. A candidate is reviewed only against the preserved proof and source basis. No role repairs original evidence to improve its score.

No external writes exist in the current product scope. Future action reconciliation can be tested against a local fake, but a simulated success is never evidence of a real PR. No automatic merge or deployment.

## 7. Extension and instruction lifecycle

Version records, profiles, role prompts, Skills, rubrics, and packages. Reject unsupported major schema versions. Declare configuration precedence: protected policy constrains project/profile selection; run settings freeze at start; untrusted artifacts cannot override any of them. Do not hot-swap a model or policy in an active run.

Keep replaceable seams small: host transport, source input, proposal sink, proof executor, evaluator, and profile selection. Introduce only interfaces with a first consumer. A future Jira/Bitbucket implementation replaces a stub at its adapter boundary, not the engine. New optional stages require an explicit handler, route change, policy review, and tests; no arbitrary plugin discovery.

Use simple per-instruction metadata where helpful: owner, purpose, regression example, scope, version, and reevaluation trigger. On host/model updates, compare current guidance with removal/replacement candidates. Deprecate obsolete instructions, test removal from active context, and retain rationale in history. Do not append exceptions indefinitely or let runtime agents rewrite their own governance.

**Project review budgets, not vendor limits:** target role prompts below 1,000 words and primary Skills below 1,500 words; exceed only with a justified review. Also inspect bytes, observed context, and rereads. Keep critical boundaries/stop rules local; load detailed procedures and examples through direct links. Add navigation to long references. There is no universal 100-line cutoff, and a TOC alone does not reduce loaded context.

## 8. Independent evaluation

The execution pipeline emits evidence, not self-awarded quality scores. A separate fresh Fable/Claude judge reads a frozen run and versioned rubric; it writes only that run's evaluation area. Retain prior evaluations and append human adjudication rather than replacing the original judgment.

Measure decision quality, proof adequacy, false findings/misses, retries, human repair/wait, evidence sufficiency, and actual usage when observable. Compare complete outcomes, including failed runs, not merely successful model calls. Tests of the engine, live-host behavior, and semantic quality are separate evidence classes.

An evaluation platform or dashboard is optional later. The first deliverable is a small inspectable result and cross-run report. Real employer data is out of scope; use synthetic requests and local sample code throughout this build.
