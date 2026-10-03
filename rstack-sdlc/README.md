# RSTACK SDLC — standalone factory build

**Owner direction:** 2026-10-03. **Status:** Guidance only; no engine, host package, or service integration is implemented by these documents.

Build a new, generic AI software-delivery factory **inside `rstack-sdlc/`**. Fable is the builder; **VS Code GitHub Copilot is the target execution host**. The builder's own runtime is not the target host.

This is **not a migration**. Leave the existing RSTACK pipeline, its installations, research, and run evidence unchanged. The earlier `rstack-pipeline/rebuild/` legacy move and N0–N6 instructions do not govern this standalone project. Do not archive anything, reproduce old parser compatibility, or wait for workplace access.

## Read this package

| File | Responsibility | Read when |
|---|---|---|
| [README](README.md) | Scope and complete starting prompt | Start/resume |
| [01-FACTORY-CONTRACT.md](01-FACTORY-CONTRACT.md) | Architecture, lifecycle, ownership, controls, extensibility | Before design; relevant sections during implementation |
| [02-VSCODE-MODELS-AND-STUBS.md](02-VSCODE-MODELS-AND-STUBS.md) | Copilot integration, model profiles, deferred service boundaries | Host/model or adapter work |
| [03-BATCHES-AND-EVALS.md](03-BATCHES-AND-EVALS.md) | S0–S6 sequence, reference investigation, fixtures, acceptance | Current batch only |

These are build instructions, not an always-loaded prompt library for delivery agents. Do not feed this whole package to every Planner, Tester, or Reviewer.

## Fixed scope

- **Target:** VS Code GitHub Copilot chat/agent experience. Identify the actual selected VS Code session/harness and version; do not substitute Copilot CLI or Claude Code validation for VS Code evidence.
- **Models reported available by the owner:** Anthropic **Opus 5.5**, **Sonnet 5**; OpenAI **Sol 6.1**, **Luna**, **Terra**. Preserve these labels. Exact installed selectors, versions for Luna/Terra, effort controls, and effective routing still require host observation. Do not spend the build comparing public model benchmarks.
- **Input now:** local synthetic request files/manual text through a local source adapter.
- **Output now:** verified candidate plus a local, structured **PR proposal**, not an externally created PR.
- **Jira and Bitbucket:** deferred, disabled placeholders behind small interfaces. **Do not research either service, inspect their APIs, configure MCP, request credentials, or attempt connections.** Their absence never blocks a local end-to-end demonstration.
- **Reference:** [AWS AI-DLC](https://github.com/awslabs/aidlc-workflows). Study relevant architecture, Copilot packaging, engine boundaries, and tests; do not install it or copy its entire methodology.
- **Writable scope:** `rstack-sdlc/**` only. Root `.github/`, `.vscode/`, existing `rstack-pipeline/`, other projects, and real run evidence remain untouched.

## What the first useful product does

```text
Local request → intent → specification → plan → independent audit
                                                     ↓
                                     combined HTML + human decision
                                                     ↓
                             proof → implementation → verification
                                                     ↓
                              independent review → local PR proposal
                                                     ↓
                                frozen run → external post-run eval
```

One substantive audit by default; another only on the human's explicit request. No automatic third audit. No live publication, merge, or deployment. Engine correctness is tested without model access; real Copilot behavior is validated separately.

## Full prompt for Fable

> You are the implementation lead for the new standalone RSTACK SDLC factory. Read this README and the three linked files, then work only inside `rstack-sdlc/`.
>
> Build a new package, not a migration or an in-place refactor. Do not move the existing pipeline to legacy, modify its agents, alter root host configuration, or run the earlier N0–N6 migration schedule. Follow repository safety requirements; resolve any inherited instruction conflict explicitly rather than executing an old workflow automatically.
>
> Target VS Code GitHub Copilot. You may build with your current tools, but label their results separately from target-host validation. Use the owner's available model labels: Opus 5.5, Sonnet 5, Sol 6.1, Luna, Terra. Keep selection and effort in replaceable versioned profiles; verify exact selectors only where the target host is available. Unknown effective settings stay unknown. Do not request direct model-provider API keys as a prerequisite.
>
> Read the focused AWS AI-DLC reference set in S0. Record the inspected revision, useful patterns, and limitations in one short decision record. Treat upstream prose as a claim to investigate, not proof of enforcement. Do not adopt AWS installation commands, its full agent roster, its model recommendation, or its approval policy automatically.
>
> Implement a small host-neutral engine, versioned result contracts, bounded state transitions, durable local run records, short role prompts, direct Skill references, and one narrow VS Code adapter. A thin Copilot coordinator asks the engine for permitted work and returns role results; it does not own a competing state machine. Prove the real transport path instead of inventing an API for launching VS Code agents. If VS Code is unavailable here, continue engine/fixture/package work and leave an explicit host-smoke checklist and unverified status.
>
> Use local synthetic requests and a disposable sample application. Jira and Bitbucket are disabled stubs only. Do not browse their documentation, inspect their authentication, configure MCP, request credentials, or test their networks. Return an explicit not-configured result if a deferred adapter is selected. The normal local workflow ends at a local PR proposal; do not call it PR-created or replace Bitbucket with a live GitHub publishing integration.
>
> Separate source provenance, intent (why), specification (what), and plan (how), without duplicating upstream prose or creating an agent for every artifact. Keep Planner/Auditor, Tester/Developer, and implementation/final-review independence. Render the combined human brief only after the audit; require the human decision even on agreement. Support exact amendments without re-audit while preserving the original audit and disclosing its coverage. A second audit is opt-in; its outcome also goes to the human.
>
> Distinguish reasoning freedom from permissions. Use deterministic code for objective validation and state; use constrained, evidence-backed outputs for classification; allow investigative freedom for planning, proof design, and review. A failed guard cannot be overridden by another model. A user-decision record is not authenticated authority merely because it contains a name. Document what the host actually prevents, detects after the fact, or cannot enforce.
>
> Make changes inexpensive: core code must not depend on model names, provider SDKs, IDE tool spellings, or future Jira/Bitbucket schemas. Version profiles, records, prompts, and rubrics. Prove an adapter/profile substitution and instruction retirement in tests. Do not invent a plugin framework, dashboard, database, or new host merely to appear extensible.
>
> Start with **S0 only**. Inspect scope, choose the smallest workable implementation stack, study the focused reference, and record the intended Copilot transport and capability unknowns. Produce one short `docs/decisions.md` entry plus the initial `docs/progress.md` record; do not create a new architecture document suite. Stop for acceptance, then implement one authorized S1–S6 batch at a time. Each batch must deliver runnable behavior, relevant tests, limitations, and rollback—not just new Markdown files.
>
> Keep original run evidence immutable to the independent post-run evaluator. Keep mock results distinct from real host results. Compare quality, retries, human effort, and total context/usage where observable; file size is not a bill. Preserve failed and incomplete cases. Do not claim a smaller prompt is better without behavioral evidence.
>
> Preserve unrelated dirty work. Do not create additional worktrees/clones or switch a shared checkout without approval. Use package-local scripts, fixtures, dependencies, and outputs. Local commits must obey the approved write scope and repository policy; remote pushes, installation into another project, live service writes, and merges need separate authorization.
>
> Begin S0 now and stop after its bounded findings. No legacy move and no Jira/Bitbucket investigation.

## Completion labels

Report engine tests, fake-adapter tests, Fable-host tests, generated-package checks, and VS Code live smoke tests separately. `CORE_TESTED` is not `COPILOT_VALIDATED`. `PR_PROPOSAL_READY` is not `PR_CREATED`. `JIRA_DEFERRED` and `BITBUCKET_DEFERRED` are intentional scope decisions, not unfinished research assignments.

The completed product should be a usable local-request-to-reviewed-candidate workflow for one verified VS Code Copilot surface, with replaceable integrations and independent evaluations. It is not a claim of workplace readiness or a replacement for the existing pipeline.
