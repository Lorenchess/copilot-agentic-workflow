# RSTACK SDLC — parallel host readiness (VS Code Copilot)

**Date:** 2026-10-03. **Author:** parallel readiness investigator, read-only. **Status:** evidence and a smoke plan only. Nothing was installed, configured, generated, or run in VS Code. No live Copilot interaction took place, so nothing here is `LIVE_TESTED` and nothing supports `COPILOT_VALIDATED`.

For the main session: consume at a batch boundary. This file changes no decision; U1–U12 in [decisions.md](decisions.md) stay open.

**Labels.** `DOCUMENTED` = official page fetched today through a summarizing extraction tool (wording relayed, not checked against raw HTML). `LOCALLY_OBSERVED` = files, processes, or logs read on this machine today. `LIVE_TESTED` = observed in a Copilot session (none). `UNVERIFIED` = no evidence either way.

## 1. Blocking finding

**The GitHub account signed in to VS Code on this machine has no active Copilot licence.** `LOCALLY_OBSERVED`:

- Every Copilot Chat log from 2026-09-09 to today reports the token request failing with HTTP 403 and "Your subscription has ended" (177 occurrences), plus "not licensed to use Copilot" and `copilot_license_required`. No log contains a successful token line.
- After each failure the extension logs "BYOK: unregistered providers due to enterprise policy", so bring-your-own-key models are also not offered.
- Source: `%APPDATA%\Code\logs\*\window*\exthost\GitHub.copilot-chat\GitHub Copilot Chat.log`; the latest is `20260923T060851\window2`, 08:28–08:58 today, opened on this repository.

Consequence: U1 currently fails on this machine. No model label, selector, tier, dispatch, or transport probe can run here until the owner restores entitlement or names another machine or account. The five owner-reported model labels were not observable anywhere on this machine.

## 2. Capability table

| Question (unknown) | Evidence today | Label | Still needs a live probe |
|---|---|---|---|
| VS Code version | Running process is 1.138.0 (commit `7debcd0e`). 1.139.0, 1.139.1, and 1.140.0 are staged; `updating_version` points at 1.140.0 (`07f806f9`), so the next restart changes the version | `LOCALLY_OBSERVED` | Re-read at smoke time (Help > About) |
| Copilot extension | Bundled extension `copilot` (package name `copilot-chat`, publisher GitHub) 0.66.0 with 1.138.0; 0.68.0 with 1.140.0. No separate Copilot extension under `~/.vscode/extensions` | `LOCALLY_OBSERVED` | Same |
| Execution surface (U1) | Harness is chosen in the "Session Target" control: Local, Copilot (Agent Host), Claude, Codex, Cloud ([H5](https://code.visualstudio.com/docs/agents/run/agent-harnesses)). Which target is selected is not readable from disk. Claude Code and OpenAI ChatGPT/Codex extensions are also installed, so the Claude and Codex targets may appear and must not be mistaken for Local | `DOCUMENTED` + `LOCALLY_OBSERVED`; selection `UNVERIFIED` | P0 |
| Model labels (U2) | None observable (section 1). The only local trace is a stale `chatLanguageModels.json` entry from 2026-05-28: vendor `copilot`, model `claude-opus-4.6`, `reasoningEffort: medium`. It is a stored value, not proof of availability or of applied effort | `UNVERIFIED` | P1 |
| Selection mechanism (U2) | Agent frontmatter `model` takes one name or a prioritized list, in the form `Name (vendor)`, for example `GPT-5 (copilot)` ([H1](https://code.visualstudio.com/docs/agent-customization/custom-agents)). Otherwise the picker's model is used | `DOCUMENTED` | P1, P3 |
| Coordinator-to-worker model combinations (U3, U4) | Local precedence: explicit `runSubagent` model argument, then the agent's `model`, then Auto if `chat.subagents.defaultToAuto` applies, then the main model. Explicit and agent-configured choices are "checked against the main model's cost tier"; above it "the subagent doesn't run and reports which models are available" ([H2](https://code.visualstudio.com/docs/agents/run/subagents)). The tiers of the five labels are unknown | `DOCUMENTED`; tiers `UNVERIFIED` | P3 |
| Named-role dispatch (U6, U8) | Local tool is `agent/runSubagent`. `agents:` restricts which agents can be invoked and overrides a target's `disable-model-invocation`. `user-invocable: false` hides an agent from the dropdown ([H1], [H2]). The setting `chat.customAgentInSubagent.enabled` is absent from the 1.138.0 bundle, so no extra flag appears to gate this in that build | `DOCUMENTED` + `LOCALLY_OBSERVED` (string absent) | P2 |
| Fresh context | A Local subagent "doesn't inherit the main conversation history"; each invocation is stateless. Nested subagents are off by default (`chat.subagents.allowInvocationsFromSubagents`). Handoffs carry conversation context ([H1], [H2]) | `DOCUMENTED` | P4 |
| Inherited instructions (U11) | Per [H2], a Local subagent inherits the main agent's instructions and tools "unless you specify a custom agent". Whether workspace and user instruction files still reach a custom-agent subagent is not stated | `DOCUMENTED`, partly `UNVERIFIED` | P5 |
| Inherited customizations on this machine (U11) | Parent repository `.github/` holds 9 agents, 7 Skills, and `copilot-instructions.md`. `chat.useCustomizationsInParentRepositories` exists in the 1.138.0 bundle; it is not set in user settings and its default was not determined. No user prompts folder, no `~/.copilot/agents`, no `~/.copilot/skills`, no `~/.claude/agents`. `~/.claude/skills` exists (synced content), and [H3](https://code.visualstudio.com/docs/agent-customization/agent-skills) lists that folder as a user Skill location | `LOCALLY_OBSERVED` + `DOCUMENTED` | P5 |
| Tool permissions (U8, U9) | An unavailable listed tool "is ignored" ([H1]); enforcement of `tools:` is not stated. User settings contain no `chat.tools.*` keys. The parent repository's `.vscode/settings.json` auto-approves a list of `git` commands only and denies edit auto-approval under `.github/` and `.vscode/`; it applies only when that folder is the opened workspace. Default terminal profile is Git Bash | `DOCUMENTED` + `LOCALLY_OBSERVED` | P6 |
| Result transport (U7) | Docs say the main agent "receives the result" and do not say whether it is verbatim, summarized, or size-limited ([H2]). The file-reference design in [D-S2](decisions.md) avoids relying on that | `UNVERIFIED` | P7 |
| Skill discovery and resources (U6) | `.github/skills/<name>/SKILL.md`; `name` must match the directory or the Skill "silently fail[s] to load"; body loads on relevance, linked files on reference ([H3]) | `DOCUMENTED` | P2 |
| Human wait and resume (U12) | Subagents cannot use the question tool ([H2]). Sessions and their history are restored when reopened after a reload; since 1.108 the last session is not reopened automatically (`chat.restoreLastPanelSession`) ([chat sessions](https://code.visualstudio.com/docs/agents/sessions/chat-sessions)). What happens to a turn in progress at close is not stated | `DOCUMENTED`, partly `UNVERIFIED` | P8 |
| Effective model and effort reporting (U5) | A setting `github.copilot.chat.agent.modelDetails.enabled` exists in the 0.66.0 manifest. An Agent Debug Log panel (Preview) is described as showing model requests and tool calls ([guide](https://code.visualstudio.com/docs/agents/guides/get-agent-back-on-track)). No frontmatter effort key is documented; the local `reasoningEffort` entry shows a per-model stored setting exists | `LOCALLY_OBSERVED` + `DOCUMENTED` | P3 (observe only) |
| Evidence surfaces | Chat view right-click > Diagnostics lists loaded agents, instructions, Skills, and errors ([H1]). "Chat: Export Chat..." writes the session as JSON ([chat sessions]) | `DOCUMENTED` | Used by every probe |
| Hooks (U10) | Preview; deferred | — | Not planned |

## 3. Minimal live smoke plan

Preconditions: section 4 decisions 1–4. All UI actions are manual; the investigator cannot operate the VS Code window, the model picker, or the Session Target control. Evidence for every probe: VS Code and extension version, Session Target value, a "Chat: Export Chat..." JSON, and a Diagnostics screenshot where named.

Workspace: one empty folder outside every git repository, opened alone in its own window. Stage A needs only four hand-written files there (two agents, one Skill with one linked resource, one instructions canary). Stage A does not use the engine or the generated package, so it does not depend on S3. Stage B uses the generated package and waits for a main-session batch boundary.

| # | Question | Smallest action | Expected result | If it fails |
|---|---|---|---|---|
| P0 | Is Copilot usable and is Local the session target? (U1) | Open the folder, open Chat, read the Session Target control, send "reply OK" | A reply; target reads Local | Stop. No adapter claim is possible on this machine |
| P1 | Exact model labels and selectors (U2) | Open the model picker and screenshot it; open the picker's manage-models view if present | Five labels matching the owner's list, each with a visible name and vendor | Missing label: that alias stays unconfigured; the owner picks a substitute. Do not guess selectors |
| P2 | Are a custom agent and a Skill discovered, and can a coordinator dispatch a named worker? (U6, U8) | Add `probe-coordinator.agent.md` (`tools: ['agent','read']`, `agents: ['probe-worker']`) and `probe-worker.agent.md` (`user-invocable: false`). Open Diagnostics. Ask the coordinator to delegate "state your agent name and list your tools" | Both agents and the Skill listed without errors; the worker is absent from the dropdown; the reply names `probe-worker` and its own tool list | Not discovered: file location or frontmatter is wrong for this build; the generator must change. Not dispatchable: adapter falls back to `MANUAL_TRANSPORT` |
| P3 | Are the trial model pairs permitted? (U3, U4, U5) | Set the worker's `model` to the observed Opus selector, pick Sonnet in the picker for the coordinator, dispatch once. Repeat with the Sol selector. Note what the UI or debug log reports as the worker's model | Worker runs and a surface names its model; or a refusal that lists the permitted models | Refusal: the `sonnet` Coordinator cannot drive `opus` or `sol` workers. Owner decision 5. No silent fallback |
| P4 | Fresh context | Tell the coordinator a canary word in chat, then dispatch a worker with the task "repeat any word you were told earlier; otherwise say NONE", with the coordinator instructed to pass that task text only | `NONE` | Leak: native dispatch cannot back the independent audit or review; those roles need fresh manual chats |
| P5 | Which instructions reach a worker? (U11) | Put a canary line in the workspace `.github/copilot-instructions.md`; ask the worker to list every instruction source and Skill name it can see | The canary appears or not (either is a finding); no agent or Skill from the parent repository or `~/.claude/skills` appears | Foreign items appear: record them; the installer documentation must name the settings that admit them. Do not change the settings to hide them |
| P6 | Are `tools:` lists enforced, and how are terminal commands approved? (U8, U9) | Worker with `tools: ['read']` is asked to create a file. Coordinator with a terminal tool is asked to run `node --version` | No file is created; the terminal command shows an approval prompt | File created: write boundaries are detect-after only, as [D-S0 §6](decisions.md) assumes. No prompt: record which setting approved it |
| P7 | Result transport (U7) | Worker (with an edit tool) writes a 3 KB JSON file containing a known hash into a named folder and replies with the path only; the coordinator prints the file with a terminal command | File bytes match the known hash; the coordinator's chat text is not needed for fidelity | Worker cannot write, or the coordinator cannot read the path: file-reference transport is not viable and D-S2's proposal must be revisited |
| P8 | Human wait and resume (U12) | Coordinator ends its turn asking for a decision. Close the window, reopen the folder, reopen the session from the sessions list, reply | The session reopens with history and the reply continues it. Also try a new chat given only a status file path | History lost: resume must rely on the engine's `status` and `resume` alone, in a new chat |
| P9 (Stage B) | Does the generated package work end to end on the planning slice? | After main-session approval: generate, copy into the smoke workspace, run one synthetic request to the first human wait | Engine replies are followed; one subagent per `GRANTED`; stop at `WAIT` | Recorded per step against the capability record |

Order: P0 and P1 first; a failure at P0 ends the session. P2 gates P3–P8. Total live cost for Stage A is roughly ten short requests.

## 4. Owner decisions needed

1. **Copilot entitlement.** Restore the licence for the account on this machine, or name the machine and account where the five models are available. Without this, nothing below can start.
2. **Smoke workspace location.** Approve one exact path outside any repository, for example `C:\rstack-sdlc-smoke\` (no space in the path) or a path of the owner's choosing. Nothing has been created.
3. **Version to test.** VS Code will move from 1.138.0 / 0.66.0 to 1.140.0 / 0.68.0 at its next restart. Recommendation: restart first, then test and record 1.140.0, since results on 1.138.0 would be stale immediately.
4. **Authorization for Stage A live interactions** (P0–P8), performed by the owner in the UI, including the requests they consume. Stage B needs a separate approval after S3.
5. **If P3 refuses a pair:** choose between a higher-tier Coordinator model, a same-tier Auditor and Reviewer, or `MANUAL_TRANSPORT` for those roles. The profile is not changed until then.
6. **Hooks** stay deferred unless the owner says otherwise.

## 5. Notes for the main session (not a review; S3 source is in motion)

- `DEFAULT_ENGINE_COMMAND` in `adapters/copilot-vscode/generate.ts` is `node rstack-sdlc/scripts/rstack.ts`, a path relative to this repository. In a workspace outside the repository it will not resolve; Stage B needs an explicit `engineCommand`, and absolute paths on this machine contain a space.
- The default terminal profile here is Git Bash. Engine command quoting (`--recorded-by "<who said it>"`, `--answer "<text>"`) should be checked under that shell in P9.
- Documentation gives model selectors as `Name (vendor)`. A `host_selector` should be recorded in exactly the observed form.
- Skill `name` must equal its directory name or the Skill is silently dropped; the generator already does this, and P2's Diagnostics view is the check.
- The tool-set names `execute`, `read`, `search`, `edit`, `agent` in the generator were not confirmed against documentation in this pass and remain `UNVERIFIED` until P2.
- A context-carrying Skill mode (`context: fork`, experimental) exists; it is not needed and should stay unused.
