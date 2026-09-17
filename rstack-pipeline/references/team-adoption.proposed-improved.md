# Adopting rstack on a team

This file is a **portability guide**, not a runtime rulebook.

Use it when adapting rstack to a new team, repository family, or toolchain. Runtime authority stays
in the pipeline skill, the process instructions, the agent definitions, and the enforcement scripts.

## Keep the principles; adapt the mechanics

The portable part of rstack is the discipline, not the exact implementation.

| Keep stable | Adapt to the team |
|---|---|
| Explicit scope, exclusions, and decision owners | Tracker, ticket format, and terminology |
| Acceptance criteria tied to a source | Product specs, ADRs, service contracts, and other authorities |
| Independent checks between authoring and judging | Available models, tools, runners, and host capabilities |
| Evidence that directly observes the required behaviour | Test frameworks and proof routes available on this stack |
| Honest treatment of unknown, skipped, and unavailable evidence | Artifact retention, privacy, and local storage policy |
| Human control of external writes | Who may approve commits, pushes, pull requests, deployments, and ticket writes |
| Versioned changes to the pipeline itself | The team's release and rollout process |

Do not copy rstack's phase count, filenames, numeric thresholds, or specific scripts merely because
they exist here. Keep them only when they still solve the same problem in the target environment.

## Minimum adoption record

Before the first production-like pilot, record:

1. **Authorities** — where product decisions, architecture, and service contracts live.
2. **Writable scope** — which repositories may be changed and which are read-only context.
3. **Available capabilities** — tools, runners, environments, credentials, and known host limits.
4. **Proof routes** — how each recurring kind of acceptance criterion can actually be observed.
5. **External-write owners** — who may approve commit, push, pull-request, ticket, wiki, deploy, or
   other shared-state actions.
6. **Evidence policy** — what artifacts may contain, where they may live, retention limits, and what
   must never be committed.
7. **Adopted version and deviations** — the rstack version plus every intentional local change and
   its reason.

Keep this record in the team's existing source of truth. Do not invent a second configuration file
unless the pipeline actually consumes and validates it.

## Choose the playbook before the run starts

Different work should enter through different playbooks. Do not start the full ticketed pipeline and
then remove controls because the task looks small.

| Work shape | Appropriate result |
|---|---|
| Investigation, incident analysis, design question, or code read | Scoped findings, cited evidence, uncertainty, and a handoff. No synthetic red/green cycle. |
| Documentation-only change | Verify the documentation outcome and links. Do not manufacture executable tests just to populate an artifact. |
| Behaviour change or bug fix | Falsifiable criteria, a real red/green proof path, bounded implementation, impact evidence, independent review, and the normal approval boundary. |
| Cross-component or cross-repository change | Explicit interface/contract, ownership on both sides, compatibility assumptions, and evidence for each affected boundary. |
| Release, deployment, pull-request merge, or production operation | Use the team's authorised operational process. rstack may prepare evidence and ask for the next action; it does not merge pull requests or deploy on its own. |

Within a ticketed rstack run, phase presence is defined by the pipeline contract. Risk tiers adjust
**depth**, not which mandatory phases exist.

## Pilot a new stack deliberately

Expect the first few real runs to expose adapter gaps.

Typical examples:

- the runner reports modules instead of individual tests,
- test output cannot be mapped cleanly to source files,
- the environment cannot start a required dependency,
- the repository has no callable verifier for an integration surface,
- existing scripts produce evidence in a form the gate cannot interpret.

Treat those as **capability gaps**, not reasons to weaken the gate.

For each gap:

1. record what the pipeline could and could not prove,
2. identify the missing adapter, verifier, or proof route,
3. decide whether to add support or keep the limitation explicit,
4. re-run on a representative ticket before making the adaptation a default.

## Adoption sequence

Use a small rollout:

1. one representative low-risk ticket,
2. one ticket with a real external dependency or cross-module boundary,
3. one ticket that exercises the team's normal review and approval path.

Only after those runs should the team tune numeric limits, automate classification, or generalise
repository-specific adapters.

The target is not to make every run quiet. The target is to make the pipeline's claims correspond to
what the team can actually prove.
