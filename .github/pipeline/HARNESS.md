# Harness map

One map of the reference's six harness responsibilities and its authority model. This is an index, not a policy: reading it is optional for every role and mode, and it grants no permission and adds no required input to any agent's Inputs list.

## 1. How to use this map

Reading this file is optional; nothing in `AGENT-CONTRACTS.md`'s per-role/mode input list changes because a human or agent opened it. Executing `/pipeline` is governed directly by `FLOW.md`, `AGENT-CONTRACTS.md`, `GUARDRAILS.md`, and the policy skills — this map only helps someone already permitted to read those files find the current rule faster. A lesson, worked example, comparison summary, or article reached through any route — including this one — never grants permission or substitutes for the approved workflow's own gates and checks.

## 2. Authority model

| Kind | What belongs here | Notes |
|---|---|---|
| **Workflow authority** | Operative procedure: the nine `.agent.md` files, the policy skills, `FLOW.md`, `AGENT-CONTRACTS.md`, `GUARDRAILS.md`, `MODEL-ROLES.md`, `.vscode/settings.json`. Retained normative contract clauses: `.github/skills/test-contract/SKILL.md:12` and `.github/skills/implementation-quality/SKILL.md:14` each state their historical contract "remain[s] the normative text if this skill and the contract ever appear to diverge" — "newest file wins" is not the rule here. Approved forward amendments, which must name the exact clauses they supersede. Artifact ownership, per [`AGENT-CONTRACTS.md`'s Artifact ownership matrix](AGENT-CONTRACTS.md#artifact-ownership-matrix). | A historical specification can still contain an expressly operative clause; it is not history merely by being older. |
| **Task evidence** | Current run artifacts under `.pipeline/runs/<PRIMARY>/`, repository facts, and approved product constraints — located in the team's permitted sources, never in this reference. | This reference never stores corporate task evidence; see `docs/CORPORATE-ADOPTION.md`. |
| **Historical material** | `docs/specs/*proposal*`, `docs/specs/archive/`, `docs/reviews/`, `docs/examples/` — point-in-time records, reviews, and fictional worked examples. | A file date is not authority. A fictional example never overrides a current rule. An unresolved map/rule conflict is handled by the existing uncertainty/decision rules (`plan-grounding` R6; INTAKE.md's Unknowns, per [`AGENT-CONTRACTS.md`'s INTAKE.md template](AGENT-CONTRACTS.md#intakemd-owner-intake)) — never by picking the newest file. |

## 3. Six responsibilities

| Responsibility | What it covers here | Current definition | Owner | Procedural vs. host-constrained | Proof in a run | Unverified |
|---|---|---|---|---|---|---|
| **Contract** | Requirement disposition, item-level source classes, gate wording and decision authority. | [`plan-grounding/SKILL.md`](../skills/plan-grounding/SKILL.md) R1/R6; [`pipeline.agent.md`](../agents/pipeline.agent.md) Gates | Planner (PLAN.md); Pipeline (RUN.md gates) | Prose/procedure; the gate UI itself is host-rendered, not sandboxed here. | PLAN.md Decision summary; RUN.md Gates log | CA-07 (`docs/CORPORATE-ADOPTION.md#validation-matrix`) |
| **Context** | Per-mode permitted inputs, invocation header, activation narrowing. | [`AGENT-CONTRACTS.md`](AGENT-CONTRACTS.md) per-agent Inputs; [`pipeline.agent.md`](../agents/pipeline.agent.md) invocation header | Pipeline (invocation); each agent (its own Inputs section) | Prose; host prompt assembly and caching are not verified here. | each artifact's `inputs:` header field (AGENT-CONTRACTS Artifact templates); RUN.md Stage status table and Artifact history | CA-02 (`docs/CORPORATE-ADOPTION.md#validation-matrix`) |
| **Tools** | Per-role tool allowlists, allowed git command forms, approval regex classes. | [`GUARDRAILS.md`](GUARDRAILS.md) Least-privilege table and Action classes and their actual controls; `.vscode/settings.json` | GUARDRAILS (rule); `.vscode/settings.json` (mechanical backstop) | Tool omission is the only hard boundary; regex is a best-effort backstop; everything else is prose. | `[TOOL]`-tagged output in the owning artifacts: TEST-CONTRACT.md staged-set record, RED-REPORT.md Evidence excerpt, IMPLEMENTATION.md GREEN evidence, VERIFICATION.md Checkout state and runs, WORKSPACE.md/PR.md effect records | CA-04/CA-06 (`docs/CORPORATE-ADOPTION.md#validation-matrix`) |
| **State** | The twelve owned artifacts, ownership rules, resume-by-artifact. | [`AGENT-CONTRACTS.md#artifact-ownership-matrix`](AGENT-CONTRACTS.md#artifact-ownership-matrix); [`pipeline` skill, Resume by artifact](../skills/pipeline/SKILL.md#resume-by-artifact) | Pipeline (RUN.md); each stage agent (its own artifact) | Prose ownership; no hard path sandbox is assumed without host enforcement. | RUN.md Artifact history and Resume notes | CA-05/CA-22 (`docs/CORPORATE-ADOPTION.md#validation-matrix`) |
| **Evidence** | RED proof, controlled-path integrity, obligations-first verification. | [`test-contract/SKILL.md#t9--protected-paths-envelope-proof-relevant-envelope-relied-on-tests-controlled-paths`](../skills/test-contract/SKILL.md#t9--protected-paths-envelope-proof-relevant-envelope-relied-on-tests-controlled-paths); [`verifier.agent.md`](../agents/verifier.agent.md) Procedure | Tester (TEST-CONTRACT.md/RED-REPORT.md); Verifier (VERIFICATION.md) | Mechanical diff/identity checks are procedural; the runner itself is host-constrained (prompts every run). | RED-REPORT.md; VERIFICATION.md sections | CA-18/CA-19 (`docs/CORPORATE-ADOPTION.md#validation-matrix`) |
| **Recovery and learning** | Bounded loops, same-basis resumption, the reviewed-lesson lifecycle. | [`FLOW.md#bounded-loops`](FLOW.md#bounded-loops); [`RUN-AUDIT-AND-IMPROVEMENT.md`, "From incident to reviewed lesson"](../../docs/RUN-AUDIT-AND-IMPROVEMENT.md#from-incident-to-reviewed-lesson); [`docs/HARNESS-LEDGER.md`](../../docs/HARNESS-LEDGER.md) | Pipeline (RUN.md Decision log); repository owner (the ledger) | Bounds are prose; durable archive and restore are host-constrained. | RUN.md Decision log; VERIFICATION.md Prior findings | CA-21/CA-22 (`docs/CORPORATE-ADOPTION.md#validation-matrix`) |

## 4. Task-oriented entry points

- **"I need the current approval rule for X"** → [`GUARDRAILS.md`, Action classes and their actual controls](GUARDRAILS.md#action-classes-and-their-actual-controls), or the per-agent Forbidden actions in `AGENT-CONTRACTS.md`.
- **"I am planning and need where proof routes live"** → [`plan-grounding/SKILL.md` R5, Observed at](../skills/plan-grounding/SKILL.md#r5--acceptance-criteria-testability-fields-and-preservation-expectations); [`test-contract/SKILL.md` T3/T8](../skills/test-contract/SKILL.md#t3--proof-boundary-and-level-selection); [`docs/CORPORATE-ADOPTION.md`, Team context and proof-route entries](../../docs/CORPORATE-ADOPTION.md#team-context-and-proof-route-entries).
- **"I am resuming a run"** → [`pipeline` skill, Resume by artifact](../skills/pipeline/SKILL.md#resume-by-artifact).
- **"I want to know what is validated"** → [`docs/CORPORATE-ADOPTION.md`](../../docs/CORPORATE-ADOPTION.md).
- **"I found a lesson"** → [`docs/HARNESS-LEDGER.md`](../../docs/HARNESS-LEDGER.md) and [`RUN-AUDIT-AND-IMPROVEMENT.md`, From incident to reviewed lesson](../../docs/RUN-AUDIT-AND-IMPROVEMENT.md#from-incident-to-reviewed-lesson).
- **"I want to compare with an internal pipeline"** → [`docs/COMPARISON-GUIDE.md`](../../docs/COMPARISON-GUIDE.md), [`docs/END-TO-END-REFERENCE-TRACE.md`](../../docs/END-TO-END-REFERENCE-TRACE.md), [`docs/CORPORATE-PIPELINE-INVESTIGATION-PROMPT.md`](../../docs/CORPORATE-PIPELINE-INVESTIGATION-PROMPT.md).

## 5. What this map is not

- Not a custom agent, skill, or run artifact — it is a plain Markdown index.
- Not a mandatory context bundle — no agent's Inputs section is expanded by this file existing, and no role or mode is required to read it.
- Not host-verified — it states source-level compatibility only; see CA-01/CA-02 in `docs/CORPORATE-ADOPTION.md#validation-matrix`.
