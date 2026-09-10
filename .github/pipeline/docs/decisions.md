# Phase 1 Architecture Decisions

This document is copied verbatim from §3 of the approved contract at `docs/specs/2026-09-09-phase-1-architecture-contract.md` (which remains the source of truth), copy date 2026-09-09.

---

## 3. Key architectural decisions

**D1 — `/pipeline` is a skill, not a prompt file.**
Reason: prompt files are deprecated for Agent Host and tied to the Local agent, which the docs say will be removed. Skills are slash commands with `argument-hint` and free-text arguments, portable across Local, Agent Host, and Copilot CLI.
Alternatives: prompt file with `agent:` (deprecated); custom agent only (no slash command).
Risks: a skill cannot select an agent. Mitigation: the skill's first step is a role check: "If your instructions do not contain the line `You are the Pipeline Intake agent`, stop and tell the developer to select **Pipeline Intake** in the agent picker and re-run `/pipeline <keys>`."

**D2 — One coordinator agent plus three narrow subagents.**
Reason: least privilege and injection containment. Raw Jira text is only read inside the Jira subagent's isolated context and comes back as a structured extract; the git subagent never sees Jira text; the coordinator is the only agent that talks to the developer (askQuestions is unavailable in subagents). Each subagent's `tools:` list is its permission boundary.
Alternatives: single agent with all tools (simplest, but MCP + terminal + edit in one injectable context); handoff chain of user-driven agents (handoffs carry full context, so no isolation, and more clicks).
Risks: subagents are stateless, so every call must carry complete inputs; each call is a model request (cost); subagent model tier cannot exceed the coordinator's.

**D3 — Workspace opened as a single root folder containing nested repositories.**
Reason: multi-root merge semantics for `.github` customizations are undocumented, MCP config loads from a single folder, hooks load from one folder, and Agent Host multi-root is Experimental. A single root makes discovery unambiguous and the terminal cwd deterministic.
Alternatives: `.code-workspace` multi-root (ambiguous discovery today).
Risks: the root is itself a git repo, so nested repos must be ignored by the root `.gitignore`; VS Code's git extension must be allowed to detect sub-folder repos (`git.autoRepositoryDetection`). All git commands use `git -C <repo-dir>` with the bare relative directory name, so the workspace root path itself may contain spaces. **MVP limitation, not a git requirement**: repository directory names containing whitespace or shell-special characters are listed in the inventory as unsupported and are not selectable at G1, because the approval-rule slots accept only bare tokens; §11.7 documents the removal path.

**D4 — Target the Local harness; keep files harness-portable.**
Reason: only Local has confirmed access to every built-in tool (including `vscode/askQuestions`) and authenticated/remote MCP servers.
Alternatives: Copilot harness on Agent Host (blocked today if the Jira MCP needs auth).
Risks: the Local agent is slated for removal. Mitigation: no prompt files, skills and agents in standard locations, MCP config also expressible as `.mcp.json`.

**D5 — Branch preparation uses local git, not Bitbucket MCP.**
Reason: local git is deterministic, offline-inspectable, already authenticated, and gives everything Phase 1 needs (remote identity, default branch via `symbolic-ref`/`ls-remote`, remote branch existence via `ls-remote`). Bitbucket MCP is not required in Phase 1; the remote URL is the repository identity.
Alternatives: create branches via Bitbucket MCP (remote-first, then the local clone still needs syncing; two sources of truth).
Risks: none new. Later PR phases will use Bitbucket MCP.

**D6 — Guardrails are tool restriction + workspace approval settings + instructions (no hooks).**
Reason: owner decision. `false` rules force a human approval prompt for destructive commands; only the git subagent has the terminal at all; instructions forbid the commands outright.
Risks: a `false` rule is not a block; the developer can still approve. Accepted. Hook-based hard deny documented in §13.7 as optional.

**D7 — Run identity is the primary Jira key: `.pipeline/runs/<PRIMARY-JIRA>/`.**
Reason: deterministic, human-findable, gives idempotent resume without a generated ID. `.pipeline/` is already gitignored.
Alternatives: timestamp-based run IDs (not resumable by key). Risks: one active run per primary Jira; "start over" resets stages in place and appends the previous run to `history[]` (the coordinator cannot rename directories).

**D8 — Same branch name in every selected repository by default, with recorded exceptions.**
Reason: cross-repo traceability for one logical change. Exceptions only when a repo already has a conflicting branch (§11.4) and the developer chooses a per-repo name at gate 3. Overrides are recorded with a reason; an LLM may never invent divergent names.
Risks: collision with an unrelated existing branch of the same name (handled by precheck).

**D9 — One bounded Jira retrieval pass, before repository discovery.**
Reason: the recommendation needs components, labels, summary, description, and links anyway; a second "complete" pass would double cost and create two versions of the truth. Bounds in §9 keep it small.

**D10 — Jira MCP is consumed via a capability contract; write tools are excluded by omission.**
Reason: exact tool names vary by server. The Jira reader's `tools:` list will name only read tools once Sonnet confirms them; no write/delete/transition/comment tool may appear.

**D11 — Sonnet-5 for all four Phase 1 agents in the first implementation.**
Reason: reliability and simplicity. The coordinator needs multi-step tool discipline and gate handling; the git preparer must read git state correctly; the Jira reader and discovery agent must produce valid structured JSON and resist injected text. One model makes the "a subagent cannot exceed the coordinator's cost tier" rule trivially true and leaves exactly one picker name to verify.
Alternatives: Haiku 4.5 for the Jira reader and discovery agent (cheaper) is kept as a **future benchmark after C9**, not an initial fallback; Opus-5 is not needed; GPT-5.6 Sol / Terra / Luna have unknown tiers and are not evaluated in Phase 1.
Risks: higher cost per run than a mixed roster. Accepted for the first implementation.

**D12 — Gate 2 combines the optional context interview with branch-name confirmation.**
Reason: one round trip instead of two; the developer sees the proposed branch while deciding whether to add context.

**D13 — Phase 1 never pushes.**
Reason: pushing an empty branch adds a remote side effect with no Phase 1 benefit. Later phases push.

**D14 — The artifact carries decisions, statuses, summaries, and pointers; evidence files carry the full records.**
Reason: re-copying full Jira records through the coordinator LLM invites paraphrase and breaks provenance. `phase-1-intake.json` holds keys, roles, relationships, one-line summaries, recommendations, selections, developer context, branch, per-repo status, and `evidenceFile` pointers. Phase 2 reads `evidence/jira-context.json` directly for full text.

**D15 — Repositories are independent during preparation.**
Reason: one repo's failure must not block another's preparation nor be hidden by it. S10 runs one subagent call per repository, records state after each, never auto-retries a mutating call, and always continues to the next repo.
