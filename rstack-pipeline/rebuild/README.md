# RSTACK greenfield rebuild — start here

**Owner direction recorded:** 2026-10-02. **Status:** Build guidance committed; legacy migration, new engine, installation, and runtime validation have not been performed by creating these documents.

The owner has chosen a fresh RSTACK implementation rather than continuing the in-place V2 refactor. Preserve the old system as recoverable legacy and carry forward its proven controls and regression cases, not all its historical formats and workarounds. A rebuild is the selected direction, not evidence that a replacement already outperforms V2.

## The four-file package

| File | Read when | Owns |
|---|---|---|
| This README | Starting or resuming the rebuild | Assignment, scope, supersession, and entry prompt |
| [01-LEGACY-MIGRATION.md](01-LEGACY-MIGRATION.md) | Before N0 | Safe archive, source/discovery boundaries, preservation, rollback |
| [02-FACTORY-CONTRACT.md](02-FACTORY-CONTRACT.md) | Before design/build; then relevant sections | Architecture, intent/spec/plan, controls, extension seams, instruction lifecycle |
| [03-BATCHES-AND-ACCEPTANCE.md](03-BATCHES-AND-ACCEPTANCE.md) | Before each authorized batch | N0–N6 order, executable deliverables, fixtures, measurement, promotion |

These are maintainer/build instructions, not additional always-loaded runtime prompts. Each supporting file has a contents section. Do not make future delivery agents read the complete package or the old evaluation-design library.

## Full prompt for the repository-aware build agent

Copy the following into a fresh Claude Code session in the **actual repository that owns the pipeline**. The relative paths refer to this package's location in the Copilot repository; resolve an intentionally copied package by its actual location, not by guessing a workspace root.

> You are the implementation lead for a greenfield RSTACK AI software factory. Work from this repository and its actual host/tool capabilities, not from prior chat assumptions.
>
> Read `rstack-pipeline/rebuild/README.md`, `01-LEGACY-MIGRATION.md`, `02-FACTORY-CONTRACT.md`, and `03-BATCHES-AND-ACCEPTANCE.md` in that same directory. Follow this package as the coordinator for this rebuild. Inspect existing repository instructions and identify conflicts before making changes. Enterprise, platform, security, and publication permissions remain binding.
>
> The owner has selected a new implementation. Preserve and retire the verified old pipeline source into legacy, then build the replacement in small tested batches. Do not perform the old in-place refactor schedule in parallel. Do not copy the whole old prompt library into the new core and call it a rebuild.
>
> Start with **N0 only**. Establish the repository identity, dirty work, canonical sources, generators, installations, active discovery roots, and current run activity. Reuse completed Sessions A–D reports as evidence, checking their revisions; do not treat any report as automatically correct. Preserve all work and recoverability. Execute only the verified repository-local legacy move described in 01. This request authorizes that bounded archive on a dedicated branch once its safety conditions are met; it is not merely a request for another architecture proposal. If the target is ambiguous, work is at risk, or the true installed source is absent, pause only the affected move and state exactly what is missing. Never guess or broaden the move.
>
> Keep archived bytes and historical results intact. Preserve current research/rebuild guidance and unrelated CI, settings, and tests. Do not move all of `.github` or another shared directory by wildcard. Verify that legacy instructions are not selected as the active new runtime. Distinguish archived source from developer installations that still deliberately run a pinned legacy release. Do not install an unfinished replacement.
>
> After N0, report the archive mapping, pre-migration revision, actual validation, limitations, and rollback. Stop for human acceptance. Begin N1 in a fresh context after authorization, so previously loaded legacy instructions do not govern the new implementation. Continue one authorized batch at a time through N6.
>
> Build one small host-neutral core with deterministic lifecycle control, versioned contracts, short role prompts, reusable Skills, direct references, and narrow host/service adapters. Choose one approved runtime/language and one actual host first. Do not create empty future integrations, a plugin framework, a database, or a dashboard before a demonstrated need. Produce executable capabilities and tests from N1 onward, not another large documentation suite.
>
> Separate source provenance, `intent.md` (why), `spec.md` (what), and the compact plan (how). Keep one owner per fact and explicit upstream references. Separate concepts do not require separate new agents or repeated human meetings. Resolve human-owned requirements before relying on them. Do not silently make a local specification override Jira or another authoritative system.
>
> Preserve Planner/Auditor, Tester/Developer, and implementation/final-review independence. Show the combined plan-and-audit HTML after the first audit, require the human's decision, and run a second audit only when requested. Preserve original audit findings when the human authorizes amendments without another audit. Verification and publication remain separate gates. No automatic third audit and no agent PR merge.
>
> Strengthen actual control rather than prose volume. Deterministic checks own objective state, identity, path, and schema conditions. Models retain investigative freedom within explicit write/tool boundaries. Human-owned authority is not delegated to a model. Structured output does not prove semantic correctness. Report when a host only detects violations afterward or permits bypass; never label a self-run check a sandbox.
>
> Make change inexpensive by keeping model/effort/context choices in versioned profiles and host syntax in adapters. Freeze the effective configuration per run; report unavailable telemetry and unsupported settings honestly. A new model, retired instruction, optional Skill, or evaluator must have a small declared modification surface, regression tests, and rollback. Do not let agents self-modify governance or automatically install advice from the web.
>
> Keep runtime files focused. Use the review budgets and direct-reference design in 02; do not satisfy line targets through long paragraphs or delete essential controls. Every moved instruction needs a reachability test. Every new rule needs a purpose and owner; changing models should trigger reevaluation of old advice, not endless appended exceptions.
>
> Persist enough evidence to reconstruct each run without repeatedly loading all of it into each agent. Use separate run IDs, immutable reviewed subjects, measured identities, bounded attempts, and current-state validation. Unknown outcomes never become success. Reconcile potentially completed external actions before retrying.
>
> Include independent post-run evaluation from the beginning of the runnable slices. Claude is initially the external judge, not a self-grading execution phase. Evaluation writes only inside the collected run's evaluation area, leaves execution evidence unchanged, preserves human corrections, and supports cross-run comparisons. Keep real corporate data in approved internal storage; use synthetic examples in this public repository.
>
> For every batch, declare scope and a rollback point, implement only the assigned concern, run the required deterministic and behavioral checks, and compare to the recorded baseline. No hidden cleanup, model swap, effort change, uncontrolled parallel writer, or retrospective fixture weakening. Record real failures and missing tests. Recommend KEEP, REVERT, or INCONCLUSIVE, then stop for human approval of the next batch. Local commits must contain only authorized batch work and follow repository policy. Remote publication, live installation, production use, and merge need their applicable separate authorization.
>
> Begin N0 now. Deliver a safe, evidence-backed legacy retirement result or a precise blocker—not a claim that the entire replacement is ready.

## Scope change versus previous guidance

For this new build, this package replaces the old requirement to finish in-place refactoring before creating a new core and replaces the old Batch 0–14 execution order. It does not supersede enterprise permissions or authorize deleting evidence. Existing V2 sources and acceptance reports describe the legacy/reference baseline; they do not prescribe the new storage format.

Use prior guidance selectively: preserve candidate freshness, protected proof, bounded human-controlled audit loops, independent post-run evals, safe batching, and evidence discipline. Redesign legacy parser compatibility, repeated narrative, historical directory layouts, duplicated rules, and host-specific prompt syntax where the new contracts make them unnecessary.

The current public repository identifies V2 as a refactoring reference with workplace implementation unverified at the inspected baseline. It is not a reliable map of every installed workplace tree. See [the pinned baseline entry point](https://github.com/Lorenchess/copilot-agentic-workflow/blob/181b600d1d1c1688cd4995370d1aff83c9b82461/rstack-pipeline/README.md). Do not archive a claimed production pipeline that is not actually present.

## Initial milestones

| Batch | Observable result |
|---|---|
| N0 | Verified recoverable legacy archive, explicit discovery/deployment status |
| N1 | Executable engine and adversarial contract tests, no external actions |
| N2 | Source-to-plan/audit/HTML/human-decision slice that resumes safely |
| N3 | Synthetic proof-to-reviewed-candidate and prepared PR intent |
| N4 | Independent per-run evaluation and comparable aggregate results |
| N5 | Tested extension seams and reproducible host package |
| N6 | Approved pilot evidence and a separate promotion decision |

No stage is completed merely because files exist. No rule becomes effective merely because its Markdown says MUST. The build must show what actually executes, what actually blocks, and what remains a human or host dependency.

**Design aim:** a small stable safety contract around replaceable models, instructions, tools, and hosts—not a fixed collection of prompts that becomes harder to change every time AI evolves.
