# Comparison guide

This is the intended entry point for comparing this reference implementation against the organization's existing internal AI pipeline. It is not a marketing document and it does not claim this design is better — it is a checklist of specific, file-level design choices, paired with concrete questions worth asking about how the internal pipeline handles the same problem. Where this repository made a choice the internal pipeline handles differently (or doesn't need to handle at all, because its infrastructure already solves it), that is exactly the kind of thing worth surfacing in the comparison.

## Reading order

1. `.github/copilot-instructions.md` — the only rule that applies to every conversation in this workspace, not just pipeline runs.
2. The nine agents in `.github/agents/` — read each against its section in `.github/pipeline/AGENT-CONTRACTS.md`.
3. The three skills in `.github/skills/`.
4. `.github/pipeline/FLOW.md`, then `AGENT-CONTRACTS.md`, then `GUARDRAILS.md`, then `MODEL-ROLES.md` — in that order, since each later file assumes the vocabulary of the one before it.
5. `.vscode/settings.json`.
6. `docs/examples/PAYMENTS-12345/` — the worked example, to see the design actually produce artifacts end to end.
7. The cross-cutting themes below, last — once every individual asset is familiar, the themes tie them together.

## `.github/copilot-instructions.md`

**What to look at**: the file is deliberately short (global rules only — trust boundaries, secrets, git safety, a pointer to `FLOW.md`) and contains no pipeline-specific rule (`docs/specs/2026-09-09-phase-1-core-pipeline-design-contract.md` §10 R1 acceptance required it stay under 60 lines with no pipeline-specific rule). It applies to every Copilot Chat conversation in the workspace, not just `/pipeline` runs.

**Questions to ask of the internal pipeline**:
- Does the internal pipeline have an equivalent "applies to every conversation" instruction file, or is trust-boundary guidance scattered per agent?
- How does the internal pipeline word its data-vs-instructions rule, and does it cover MCP tool responses explicitly, or only Jira/repository text?
- Where does the internal pipeline's secret-redaction rule live — a global instruction, a per-tool filter, or a runtime hook?
- Does a global instruction file risk being silently overridden by a more specific one, and if so, how does the internal pipeline order precedence?

## Agents (`.github/agents/*.agent.md`)

Each agent file below is read against its corresponding section of `AGENT-CONTRACTS.md`, which is normative for its `tools:` list and forbidden-operations list.

### `pipeline.agent.md`

**What to look at**: the orchestrator holds no terminal and no MCP tool at all (`tools:` in `pipeline.agent.md` frontmatter) — it only runs subagents, asks questions, and edits `RUN.md`. It is the only agent with `vscode/askQuestions`, because subagents are stateless and cannot ask the developer anything (documented explicitly in the agent body's Role and purpose section).

**Questions to ask of the internal pipeline**:
- Does the internal pipeline's orchestrator (if it has one) hold any direct mutation capability, or is it purely a sequencer like this one?
- How does the internal pipeline's coordinator handle a developer's free-text answer to a gate — is there an equivalent rule to "only text typed directly into a gate answer is an instruction"?
- What happens if a subagent-equivalent in the internal pipeline needs to ask a follow-up question mid-stage — does it have a mechanism, or does it also have to return control first?

### `intake.agent.md`

**What to look at**: the only agent with any Jira MCP tool, and the only agent that reads raw Jira text at all (`GUARDRAILS.md`'s Trust boundaries: "agents that hold a terminal ... never read Jira text or raw MCP responses directly"). Its `tools:` list has the four Jira read capabilities commented out pending confirmed tool names (`docs/questions.md`).

**Questions to ask of the internal pipeline**:
- Does the internal pipeline isolate Jira-reading to a single agent/service, or do multiple components read raw Jira text?
- How does the internal pipeline resolve the "acceptance criteria" custom field across Jira instances where the field ID differs — by name search, like this repo, or a fixed field ID per instance?
- What happens when the internal pipeline's Jira integration is down mid-run — is there an equivalent to `JIRA_UNAVAILABLE`, and does it distinguish primary-key failures from secondary-key failures the way this design does?

### `workspace.agent.md`

**What to look at**: the only agent with a terminal that never reads Jira or repository *text* — only artifacts and git command output (`GUARDRAILS.md` Trust boundaries). Its allowed git command forms are an explicit allowlist (Procedure section), and it runs the stage-9 publish sequence exactly as specified in contract §8.1 / `GUARDRAILS.md`.

**Questions to ask of the internal pipeline**:
- Does the internal pipeline have a single git-mutating component, or does more than one agent touch git directly?
- Is the internal pipeline's git command surface an allowlist (deny by default) or a denylist (allow by default, block specific verbs)?
- How does the internal pipeline prevent a push before its equivalent of a publish approval gate — a mechanical precondition check like this design's `G4_NOT_RECORDED`, or a different control?

### `planner.agent.md`

**What to look at**: every acceptance criterion must trace to `INTAKE.md` or `RUN.md`'s developer context or explicit reasoning recorded in the plan itself (Forbidden actions: "inventing acceptance criteria not traceable to..."). The planner is read-only over repository code.

**Questions to ask of the internal pipeline**:
- How does the internal pipeline enforce (or not) that every acceptance criterion is traceable back to a specific source?
- Does the internal pipeline's planning step read existing code, and if so, is that read-only, or can the planner make exploratory edits?
- What happens on a revise round in the internal pipeline — is there a round limit, and who decides when it's exhausted?

### `adversary.agent.md`

**What to look at**: a dedicated, read-only, plan-only critic that can only render APPROVE / REVISE / BLOCK — it cannot edit the plan itself, and it cannot approve a plan with no acceptance criteria (Forbidden actions).

**Questions to ask of the internal pipeline**:
- Does the internal pipeline have an adversarial-review step distinct from the planner, or does the same component plan and self-critique?
- What is the internal pipeline's bound on revise rounds, and what happens when it's exhausted — automatic escalation, or does the plan simply proceed?
- Is BLOCK (an unconditional stop) distinguished from REVISE (a fixable gap) in the internal pipeline, or is there only a single "needs work" outcome?

### `tester.agent.md`

**What to look at**: the only agent, besides `developer`, that can edit files inside a repository — and only test files it created itself (Forbidden actions: "`git add` a path it did not create under a test directory"). It must prove RED for the acceptance condition itself, never by weakening a criterion (Procedure step 5, Forbidden actions).

**Questions to ask of the internal pipeline**:
- Does the internal pipeline require acceptance tests to be proven RED before implementation, or does it allow test-and-implementation to happen together?
- How does the internal pipeline distinguish a legitimate RED (missing behavior) from a compile error or setup failure — is there a bounded correction-attempt mechanism like this design's two-attempt limit?
- What happens in the internal pipeline when a written test passes on the first try — is there an equivalent to `TESTS_NOT_RED`, and who decides the outcome?

### `developer.agent.md`

**What to look at**: forbidden from ever editing a path listed in `TEST-CONTRACT.md`, or altering `TEST-CONTRACT.md` / `RED-REPORT.md` itself, under any circumstance — the only route to change a contract test is the `TEST-CHANGE-REQUEST` STOP, decided by the developer, executed only by `tester` (Procedure step 5, Artifact ownership rule).

**Questions to ask of the internal pipeline**:
- Does the internal pipeline technically prevent (not just discourage) an implementer from editing its own acceptance tests, or is that only a code-review convention?
- What is the internal pipeline's equivalent of the test-change-request path, and who is authorized to approve it?
- How does the internal pipeline confirm GREEN — trusted self-report, or an independent rerun (see `verifier.agent.md` below)?

### `verifier.agent.md`

**What to look at**: independently reruns the *full* test suite (not just the new acceptance tests) rather than trusting `IMPLEMENTATION.md`'s GREEN claim, and performs the test-immutability check (`git diff --stat <redCommit>..HEAD -- <paths>`) as a mechanical command, not a judgment call (Procedure steps 2–3).

**Questions to ask of the internal pipeline**:
- Is there an independent verification step in the internal pipeline, separate from the implementer, or does the implementer's own test run stand as the record of GREEN?
- Does the internal pipeline mechanically check that contract tests weren't altered, or rely on code review to catch it?
- Where does the internal pipeline record the exact commit SHA it verified, and is that SHA later used as a gate for anything downstream (see the verified commit invariant, below)?

### `pr.agent.md`

**What to look at**: no merge, approve, decline, or create-branch Bitbucket tool appears in its `tools:` list under any name (Forbidden actions, MCP capability expectations) — it can only draft, create, and re-read. It re-confirms the remote SHA via a Bitbucket read tool immediately before creating the PR, in addition to trusting `WORKSPACE.md` (Procedure, stage 10, step 3).

**Questions to ask of the internal pipeline**:
- Does the internal pipeline's PR-creation step have merge or approval capability, or is that always a separate, human-only action?
- Does the internal pipeline re-verify anything (SHA, branch state) immediately before PR creation, or does it trust an earlier-computed value?
- How does the internal pipeline decide whether to open one PR or several for a multi-repository change?

## Skills (`.github/skills/*/SKILL.md`)

### `pipeline/SKILL.md`

**What to look at**: the parsing rules are stated once, here, and not duplicated in `pipeline.agent.md`'s body beyond a one-line restatement — the skill is the source of truth for whitespace-tolerance, dedup, and the "first key is primary, never reordered" rule (`docs/specs/archive/2026-09-09-phase-1-architecture-contract.md` §7.1).

**Questions to ask of the internal pipeline**:
- What is the internal pipeline's equivalent entry-point contract, and does it validate key shape before or after touching Jira?
- How does the internal pipeline decide the "primary" ticket in a multi-key request, and can that decision ever be overridden mid-run?
- Does the internal pipeline's resume mechanism depend on a state machine, or — like this design's "resume by artifact" — purely on which output files already exist?

### `gather-jira-context/SKILL.md`

**What to look at**: the bound constants (`MAX_LINK_DEPTH = 1`, `MAX_RELATED = 15`, `COMMENTS_PER_REQUESTED = 20`, `COMMENTS_PER_TEST_ISSUE = 5`, `DESCRIPTION_TRUNCATE_RELATED = 2000` chars) are fixed, named, and never silently raised; discovered issues are permanently `CONTEXT_ONLY` and cannot become scope no matter how relevant they look.

**Questions to ask of the internal pipeline**:
- What are the internal pipeline's actual bounds on Jira traversal depth, related-issue count, and comment count — and are they configurable per team, or fixed?
- Can a discovered (linked/parent/child) Jira ever become implementation scope in the internal pipeline, or is "context only" enforced there too?
- How does the internal pipeline handle instruction-like text found inside Jira comments — is there a recorded "suspicious content" equivalent, or is it only handled by the model's general judgment?

### `discover-affected-projects/SKILL.md`

**What to look at**: a recommendation with zero evidence lines is explicitly invalid and must be dropped (Confidence rules) — there is no path to a bare "trust me" recommendation, at any confidence level, including LOW.

**Questions to ask of the internal pipeline**:
- Does the internal pipeline require evidence for every repository recommendation, or can a model recommend based on unstated reasoning?
- What is the internal pipeline's budget on repository search (search count, file-read count) before it returns partial results, and how are partial results communicated to the developer?
- Is the developer always the final authority on repository selection in the internal pipeline, the way G1 is designed here, or can a high-confidence recommendation auto-select?

## `FLOW.md`

**What to look at**: the stage table, the exact gate wording (G1–G4), and the conditional STOP catalogue with a fixed message shape (`STOP [<CODE>]: ...`). The illustrative transcript near the end shows the shape of a full run without needing to read every agent file.

**Questions to ask of the internal pipeline**:
- Does the internal pipeline document its flow as a single normative table like this one, or is the sequence implicit in code/config across several services?
- How many human gates does the internal pipeline have, and at which points — does it match G1 (repositories), G2 (branch/context), G3 (plan), G4 (publish/PR), or does it gate at different points (e.g. after code review instead of before test authoring)?
- What is the internal pipeline's bound on adversarial-review and verify-fix loops, and does it escalate to a human the same way (`ADVERSARY_REVISE_LIMIT`, `VERIFIER_FAIL_LIMIT`), or retry indefinitely?

## `AGENT-CONTRACTS.md`

**What to look at**: the blanket forbidden-command list at the top of the file ("No agent, anywhere, under any tool name, may run: `reset`, `clean`, `checkout`, ...") applies even to agents with no terminal at all — it bounds what any future tool grant could ever permit. The artifact-ownership matrix is a single table answering "who may write this file" and "who must treat it as immutable" for all eleven artifacts at once.

**Questions to ask of the internal pipeline**:
- Does the internal pipeline have a single normative source for "which component owns which output," or is ownership implicit in who happens to call which API?
- Is there a blanket-forbidden operation list that applies regardless of which tool grants terminal access, or are dangerous git operations blocked only per-tool?
- How does the internal pipeline define "immutable input" for an earlier-stage artifact — is a later stage even capable of altering an earlier one, or is that only a policy?

## `GUARDRAILS.md`

**What to look at**: the verified commit invariant (§8.1) and the artifact-ownership rule (§8.2) are both reproduced here verbatim from the contract, specifically so a reader doesn't have to cross-reference the contract to find the exact mechanism. The Known limitations section lists what this design does *not* solve (no hard block without hooks, no concurrent-run locking, single-root-folder only).

**Questions to ask of the internal pipeline**:
- What is the internal pipeline's equivalent guarantee that "what got reviewed is what gets published" — a SHA-equality invariant like this one, a signed artifact, or something else?
- How does the internal pipeline handle concurrent runs against the same ticket — is there a lock, a queue, or is it simply not supported (as here)?
- Is the internal pipeline's approval-rule enforcement a hard block, or (like this design's `.vscode/settings.json`) a prompt that a human can still override?

## `MODEL-ROLES.md`

**What to look at**: every role uses the same model (Sonnet-5) in the first implementation, with `model:` intentionally omitted from every agent's frontmatter until the exact picker string is confirmed at work — an explicit acknowledgment that model choice is deferred, not yet differentiated per role, and requires a human-verified string before it can be hardcoded.

**Questions to ask of the internal pipeline**:
- Does the internal pipeline use different models per role (e.g. a cheaper model for extraction-heavy steps), or a single model throughout?
- What criteria would justify splitting model choice per role here — is "high injection resistance" (intake) or "high code reasoning" (developer, tester) actually the right axis, per the internal pipeline's own experience?
- How does the internal pipeline handle a model-picker or model-name change across environments — a config value, or a hardcoded string requiring a redeploy?

## `.vscode/settings.json`

**What to look at**: `chat.tools.terminal.autoApprove` is built from two layers — a `true`-rule allowlist of exact, anchored command forms (the `<dir>` slot itself is restricted to `[A-Za-z0-9][A-Za-z0-9._-]*` so `-C .` or `-C ..` can't escape the intended repository), and a `false`-rule layer that force-prompts on destructive verbs and flags anywhere in the command line — a `false` rule always wins, but it is a prompt, not a hard block (`git.autoRepositoryDetection` and `chat.tools.edits.autoApprove` round out the file; `.github/**` and `.vscode/**` edits always require approval, i.e. no agent can silently rewrite its own guardrails).

**Questions to ask of the internal pipeline**:
- Does the internal pipeline rely on an editor-level approval-rule file at all, or is git-command safety enforced entirely server-side (a proxy, a policy engine)?
- Is there an equivalent to this file's self-protection rule (agents cannot edit their own configuration without a prompt), and does it cover the orchestrator itself?
- Test/build runner commands are deliberately excluded from the auto-approve list here (they always prompt) — does the internal pipeline auto-approve test execution, and if so, on what basis?

## The worked example (`docs/examples/PAYMENTS-12345/`)

**What to look at**: the full eleven-artifact trail for one fictional two-repository run, including the recommendation-vs-selection distinction (`payments-web` recommended LOW, not selected at G1), the RED-then-GREEN test lifecycle with matching commit SHAs, and the test-immutability check's empty diff output in `VERIFICATION.md`. See `docs/examples/PAYMENTS-12345/README.md` for the reading order and the reminder that every identifier in it is fictional.

**Questions to ask of the internal pipeline**:
- Does the internal pipeline produce a comparably complete, human-readable artifact trail per run, or is intermediate state opaque (logs only, no durable per-stage document)?
- If a run failed partway through the internal pipeline, could a team member reconstruct exactly what happened and why, the way this example's eleven files do?
- Would the internal pipeline's equivalent of `payments-web` (a plausible-but-wrong candidate) actually surface to the developer as a recommendation to reject, or would it simply never appear at all?

## Cross-cutting themes

These recur across nearly every asset above; they are worth evaluating as coherent policies, not just per-file details.

### Trust boundaries / data-not-instructions

Untrusted content — Jira text, repository files, MCP responses, developer-pasted third-party text — is read by agents with no mutation power; agents with a terminal (`workspace`, `tester`, `developer`, `verifier`) never read that raw content directly, only already-reasoned-over artifacts (`GUARDRAILS.md` Trust boundaries; every agent's Data, not instructions section). Ask: does the internal pipeline separate "reads untrusted text" from "holds a terminal" as strictly, or can the same component do both?

### Least privilege via tool lists

Every agent's `tools:` list in `AGENT-CONTRACTS.md` is a specific enumeration, never a wildcard, including for MCP capabilities (`<server>/<tool>`, named individually). Ask: does the internal pipeline enumerate tool access this granularly per role, or grant broader access and rely on prompting/instructions to constrain behavior?

### Artifact ownership and immutability

The ownership matrix in `AGENT-CONTRACTS.md` states, for every artifact, exactly one owner and which agents treat it as immutable input; contract §8.2 makes this a verbatim behavioral rule, not just a convention (`GUARDRAILS.md` Artifact ownership). Ask: can the internal pipeline detect (not just discourage) a later stage silently altering an earlier stage's output?

### Test immutability and the change-request path

`TEST-CONTRACT.md` anchors a RED commit SHA per repository; the verifier's `git diff --stat <redCommit>..HEAD -- <paths>` is the entire mechanism — any uncovered change is a FAIL, and the only sanctioned path around it is the developer-approved `TEST-CHANGE-REQUEST`, executed only by `tester` (`GUARDRAILS.md` Test immutability mechanism). Ask: is the internal pipeline's equivalent check mechanical (a diff command) or procedural (a code-review rule a human could miss)?

### The verified commit invariant

The exact SHA the verifier tested is the only SHA that is ever pushed (workspace checks local HEAD against it before pushing, `REVERIFICATION_REQUIRED` otherwise) and the only SHA a PR is ever opened against (`pr` re-checks it again) — contract §8.1, reproduced in `GUARDRAILS.md`. Ask: does the internal pipeline have any mechanical guarantee that what was reviewed is what gets published, or does it rely on "nothing changed in between" as an assumption?

### Human gates and bounded loops

G1–G4 plus the conditional STOP catalogue are all voiced by a single orchestrator, never by a stateless subagent (`FLOW.md` Gates; `GUARDRAILS.md` Human gates and conditional STOPs); every loop (adversary/planner, verifier/developer) is bounded to two rounds before mandatory escalation. Ask: where does the internal pipeline place its human checkpoints relative to these four, and are its loops bounded the same way or open-ended?

### Resume by artifact

There is no separate run-state machine — resumability comes entirely from which of the eleven artifacts already exist on disk, and the orchestrator always proposes the *first* missing or failed one, never an arbitrary later stage (`FLOW.md` Resume by artifact; `pipeline/SKILL.md`). Ask: does the internal pipeline persist a separate state machine, and if its state and its artifacts ever disagree, which one wins?

## Deferred / known limitations

This design intentionally leaves several things unresolved for Phase 1. Before treating any absence above as a design flaw, check whether it is already listed as deferred: `GUARDRAILS.md`'s Known limitations section (no hard block without hooks, single-root-folder only, Local-harness-only, `<dir>` slot excludes whitespace/shell-special repository names, no concurrent-run locking) and contract §12 Deferred (hooks hardening, quoted-path support, model benchmarks, org-level agent distribution, Agent Host portability, confirming exact Jira/Bitbucket MCP tool names and the model picker string, any runtime resumability beyond artifact presence).
