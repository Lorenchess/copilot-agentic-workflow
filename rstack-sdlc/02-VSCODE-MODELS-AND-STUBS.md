# RSTACK SDLC — VS Code, models, and deferred adapters

**Status:** Host/integration requirements, not tested capabilities. [README](README.md) owns scope; [01](01-FACTORY-CONTRACT.md) owns portable behavior. Exact host syntax must be verified before generation.

## Contents

- [1. Target host, not builder host](#1-target-host-not-builder-host)
- [2. Thin Copilot transport](#2-thin-copilot-transport)
- [3. Model catalog and initial trial](#3-model-catalog-and-initial-trial)
- [4. Effort and profile changes](#4-effort-and-profile-changes)
- [5. Jira and Bitbucket placeholders](#5-jira-and-bitbucket-placeholders)
- [6. Packaging and workspace isolation](#6-packaging-and-workspace-isolation)
- [7. Host acceptance and official references](#7-host-acceptance-and-official-references)

## 1. Target host, not builder host

The production target for this project is **VS Code GitHub Copilot**. Fable may implement with its existing tools. A test executed in Claude Code/Fable or a fake runner is not a VS Code Copilot integration test.

Identify the actual VS Code version, Copilot extension/harness or session target, OS, and relevant approved settings. VS Code supports different harness experiences; configuration and tools can differ. Do not treat Copilot CLI documentation, Claude's Task tool, or a generic provider API as proof of the target interface. Current official documentation is a discovery lead; actual capability checks settle this build's support. [H1–H3]

Do not require IntelliJ, Devspace, Bedrock, Cursor, or another real host in this build. The core remains portable, but only VS Code Copilot needs a real adapter. No direct Anthropic/OpenAI API keys are a prerequisite.

If Fable cannot launch VS Code, it can still build offline engine tests, fake transport, packaging, and exact manual smoke instructions. Label the host integration `UNVERIFIED` until the owner runs those checks. Do not replace the target or wait indefinitely for workplace access.

## 2. Thin Copilot transport

Prefer the smallest supported arrangement:

```text
Human starts the RSTACK SDLC coordinator in VS Code Copilot
  → coordinator asks a package-local engine command for the next permitted task
  → engine validates current state and returns a bounded task envelope
  → coordinator invokes the named role through the verified host mechanism
  → exact role result is submitted to the engine with run/attempt/input identity
  → engine validates, persists, and returns CONTINUE, WAIT, or a named blocker
```

These are conceptual operations, not claims that an API or CLI already exists. Define and test concrete engine commands in S1. The engine does not need a private API that remotely controls VS Code. The Copilot coordinator must not become a second state machine.

A role dispatch must establish the applied tools, input scope, model selector, result transport, and actual isolation. Use fresh audit/review invocations; do not use a context-carrying UI handoff as proof of independent review. Public docs describe subagent and handoff mechanisms, but exact behavior varies by harness. [H1, H2]

Validate loaded global instructions as well as the supplied task. Two invocations sharing a model can be separate; two different models exposed to the same persuasive history are not automatically independent.

Maintain one compact capability record: capability, desired behavior, observed test, evidence, limitation, status. Probe custom-agent discovery, Skill/resource loading, subagent selection, structured-result capture, human reply capture, hooks, and model/effort reporting. Unsupported required capability yields a named blocker; optional capability may be omitted with an explicit limitation.

A manual fresh-chat transport can demonstrate contracts while native transport is unavailable. Label it `MANUAL_TRANSPORT`, not automatic completion. Do not enable recursive delegation or unbounded parallel agents by default.

## 3. Model catalog and initial trial

The following labels come from the owner, not an independently verified public catalog:

| Local alias | Owner-provided name | Family | Mapping rule |
|---|---|---|---|
| `opus` | Opus 5.5 | Anthropic | Observe exact picker/frontmatter selector |
| `sonnet` | Sonnet 5 | Anthropic | Observe exact picker/frontmatter selector |
| `sol` | Sol 6.1 | OpenAI | Observe exact picker/frontmatter selector |
| `luna` | Luna | OpenAI | Do not invent a numeric version |
| `terra` | Terra | OpenAI | Do not invent a numeric version |

Do not substitute old labels from the existing RSTACK pipeline or infer API access from picker availability. Do not spend S0 researching model marketing, benchmarks, pricing, or whether the owner's labels appear in public documentation. Resolve operational selectors when the actual host is available.

A suggested initial **trial**, not a proven optimum or an authorized deployment change:

| Role | Candidate alias | Reason for the trial, to be evaluated |
|---|---|---|
| Coordinator | `sonnet` | Bounded coordination against engine results |
| Planner, including intake/spec modes | `opus` | Compare grounded planning and downstream rework |
| Plan Auditor | `sol` | Independent evidence-based challenge |
| Tester | `sonnet` | General proof design/execution baseline |
| Developer | `sonnet` | Bounded implementation with separate proof/review |
| Reviewer | `opus` | Independent candidate/proof analysis |
| Local PR proposal | None required | Deterministic assembly where possible |

Register Luna/Terra as available candidates but do not force them into a role. Later tests may compare them on bounded extraction, implementation, or other appropriate tasks. Cheap per-call behavior and stronger branding are not evidence of cost per accepted outcome. Cross-family auditing is a hypothesis, not a correctness guarantee.

If this trial cannot be selected on the installed host, report the limitation and obtain a specific approved selection. Do not silently fall back or change the model mid-run. Missing effective-model telemetry should not prevent offline engine work, but it limits model-specific conclusions.

Illustrative **internal profile**, not Copilot frontmatter or a supported external configuration format:

```yaml
profile_version: 1
host: copilot-vscode
roles:
  planner:
    model_alias: opus
    effort_policy: host-default
catalog:
  opus:
    owner_label: Opus 5.5
    host_selector: null
    selector_status: requires-host-observation
```

The generator translates resolved profiles into the actual supported host schema. A null required selector cannot be advertised as a successfully pinned model. It may produce a clearly unconfigured template, or require an explicit observed picker selection with its limitations recorded.

## 4. Effort and profile changes

Start the first workflow baseline with the host's supported default rather than inventing an `effort` frontmatter field or requiring maximum reasoning everywhere. Record requested setting, resolved setting when visible, reporting source, and unavailable values separately.

Once supported controls are demonstrated, compare effort levels independently of model/prompt changes. Higher reasoning effort does not expand permissions, prove better judgment, or ensure concise visible output. A configured value is not evidence that the host applied it.

Profile schema validates role IDs, model aliases, effort representation, timeout/attempt budgets, and permitted fallbacks. Freeze the profile content/version per run. Do not allow lower-level project overrides or fallbacks to remove required tools, independence, or safety gates. Configuration migrations need tests and a rollback path.

## 5. Jira and Bitbucket placeholders

**These integrations are deliberately deferred. No research or setup work is authorized for either.**

Do not inspect service API docs, authentication methods, permissions, MCP servers, organizations, domains, or credentials. Do not call a live endpoint. Do not convert missing connector settings into a human-question loop. Do not implement live GitHub publication as a substitute.

Define only two small domain ports required by the local implementation; names/signatures are illustrative:

| Port | Present implementation | Deferred placeholder |
|---|---|---|
| Request source: obtain an authorized request snapshot | Read a provided local fixture/manual request with provenance | Jira returns `INTEGRATION_NOT_CONFIGURED` |
| Proposal sink: prepare a reviewable publication proposal | Persist local candidate/base/title/body/evidence references | Bitbucket returns `INTEGRATION_NOT_CONFIGURED` for remote publication |

The placeholders have no vendor payloads, URLs, SDKs, tokens, retry loops, or guessed API fields. Their only job is to make the boundary visible and test that accidental selection fails explicitly. They must never fabricate a ticket, approval, or PR URL.

```json
{
  "status": "INTEGRATION_NOT_CONFIGURED",
  "integration": "bitbucket",
  "reason": "Deferred by owner; use the local PR proposal workflow."
}
```

A selected disabled adapter returns immediately without network access or credential discovery. The default local-source/local-proposal configuration succeeds without constructing or initializing either deferred adapter. Test this with a denied-network fixture.

The local terminal outcome is `PR_PROPOSAL_READY` (or an equivalent adopted token), with `publication_status: NOT_ATTEMPTED`. A fake remote may return `SIMULATED` outcomes for reconciliation fixtures; the fake's records never count as real publication evidence.

Later, the owner can implement Jira and Bitbucket adapters behind these ports with service-specific tests. Do not predesign their pagination, authentication, API versions, or organization policy now.

## 6. Packaging and workspace isolation

Author runtime content under `core/` and translate it through `adapters/copilot-vscode/` into ignored `dist/copilot-vscode/`. Use names prefixed `rstack-sdlc-` to avoid ambiguity with existing RSTACK agents/Skills. Verify the host's actual naming and location requirements. Generated files identify their source, generator, and profile; they are not additional authored copies.

Official VS Code documentation identifies workspace custom-agent and Skill locations, but a nested source directory does not install itself into an active workspace. [H1, H3] Build packaging inside this package; do not write the parent repository's `.github` or `.vscode` directories.

Run live smoke tests only in an explicitly approved disposable sample workspace. Inspect parent-repository, user-level, and organization customizations for unintended inherited instructions. If a separate workspace is needed, ask for its location instead of creating unexplained clones/worktrees or disabling protections globally.

The installer must have dry-run output, explicit owned paths, collision checks, source hashes, and an uninstall/rollback plan that preserves user changes. Do not alter workspace trust, globally auto-approve terminal commands, increase request limits, or install hooks silently.

Hook support and schema must be tested for the selected session, not copied from another harness. If hooks only observe or detect after execution, record that. A Stop hook must not turn a status lookup or human wait into new unrequested work. [H4]

## 7. Host acceptance and official references

Before reporting `COPILOT_VALIDATED`, demonstrate in the named VS Code version/session: intended agents and Skills discovered; exact selectors handled; fresh audit/review transport; engine refusal respected by the supported workflow; human wait/resume; known tool/write-boundary limits; generated-package regeneration; and no accidental legacy loading. Retain reproducible smoke steps and actual results.

Documentation checked during preparation on 2026-10-03; recheck only the relevant mechanism when implementing it. These are primary sources, not proof of the owner's installed capabilities:

- **H1:** [VS Code custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents) — locations, role definitions, tool/model configuration, context-carrying handoffs.
- **H2:** [VS Code subagents](https://code.visualstudio.com/docs/agents/run/subagents) — harness-specific delegation and model-selection behavior.
- **H3:** [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) — discovery locations and resource references.
- **H4:** [VS Code hooks](https://code.visualstudio.com/docs/agent-customization/hooks) — selected-harness event configuration and limitations.
- **H5:** [VS Code harness selection](https://code.visualstudio.com/docs/agents/run/agent-harnesses) — distinguish the actual session target from the editor name.

No Jira or Bitbucket reference is needed for this phase.
