# Claude external-evidence review

**Subject.** `rstack-ai-software-factory-evidence-report.md` (dated 2026-09-17), an external research synthesis, checked against its own cited primary sources and then against the Claude V2 architecture in `rstack-pipeline/claude-v2/`.

**Date.** 2026-09-17. **Author.** Claude (architect / reviewer). **Status.** Analysis only. No file outside this one was created or modified; nothing staged, committed or pushed.

**Method.** Every source the report relies on for a material conclusion was fetched live on 2026-09-17 (41 catalog entries; the six openai.com pages block non-browser fetchers and were read in a real browser session). Quotes below are verbatim from the fetched pages. Five parallel verification passes covered OpenAI, Anthropic, GitHub, Google/research papers, and durable-state/telemetry/supply-chain sources; Claude spot-checked host documentation the report did not cite (Claude Code subagents and hooks, VS Code custom agents, subagents and hooks). Labels used throughout: **SOURCE FACT** (the page says it), **EMPIRICAL RESULT** (the page reports a measurement), **VENDOR GUIDANCE** (a vendor recommends it, no measurement), **INFERENCE** (a conclusion drawn across sources), **RECOMMENDATION** (what Claude should do).

**Scope caveat.** The task names `claude-v2/` (7 agents, `pipeline/SKILL.md`, 13 references) and its `CLAUDE-V2-OPEN-DECISIONS.md`. Since that folder was written, `rstack-pipeline/README.md` has made `claude-v2.2` the sole active V2 source and added OD-12 to OD-20, a `hooks/` directory, and photograph-reconciled gate facts (PASS / BLOCKED / HELD, 8-column sha-based `ac.tsv`). This review evaluates `claude-v2` as instructed and notes, without reviewing `claude-v2.2`, where a finding is already known to have moved. Any change recommended here must be applied to the active source, not to `claude-v2`.

---

# 1. Executive assessment

**Verdict: ALIGNED WITH IMPORTANT CORRECTIONS.**

Claude V2's load-bearing structure is supported by the strongest evidence class the report cites (platform controls and standards, grade A): one immutable candidate identity, evidence and review bound to it and invalidated when it changes, integration before final verification, review eligibility separated from release eligibility, no self-issued authorization, no agent merges a pull request, an orchestrator that dispatches rather than judges, and a fresh reviewer. Those are not conclusions the report reached by inference; they are direct analogues of GitHub required-status strict mode, dismiss-stale-approvals, prevent-self-review, protected-environment secret withholding, full-SHA pinning, and in-toto's authorized-functionary model. Claude V2 also already states, in its own vocabulary, the report's central rule that a prompt is not a boundary and an agent-written record is not authentication.

The corrections are real but bounded:

1. **The multi-agent evidence is weaker and more double-edged than the report presents.** The Google study is an unreviewed preprint whose benchmarks contain no software engineering; its current revision adds a small SWE-bench slice on which every multi-agent architecture scored below a single agent. That supports Claude's deterministic dispatcher, but it equally warns against the coordination cost of seven mandatory dispatches per ticket. Claude's justification for role separation must therefore rest on adversarial independence (author is never judge), which no cited study measures, not on performance.
2. **The separate-Tester and mandatory-Plan-Auditor choices have narrower support than Claude's confidence implies.** AgentCoder does contain an ablation for a separate test-writing agent, but on function-level Python with GPT-3.5. Nothing external supports RED-first or a plan audit on every ticket. Both are defensible RSTACK policy choices; neither is externally proven.
3. **Claude V2 uses no host hooks and enforces lanes only by self-run detectors.** The Copilot hooks reference documents `preToolUse` deny and a `subagentStop` hook that receives the subagent's full response and can block or rewrite it. Those two mechanisms directly address two of Claude's stated enforcement dependencies (protected-path prevention; host-side persistence of a fresh role's reply). They are available today only on Copilot CLI and the cloud agent, and preview in VS Code, so their adoption is host information, not a design change.
4. **The approval agent is narrower than the original but still a reasoning agent holding publication tools.** The evidence says release eligibility belongs to a deterministic gate and authorization to an authenticated platform event; Claude already declares both as enforcement dependencies. What can change now is the default: the human performs the external action with their own credential unless the host provides an authorization receipt.
5. **The report's evidence is entirely GitHub-centric for authorization, while RSTACK's approval agent targets Bitbucket and Jira.** No source in the report says anything about Bitbucket branch permissions, required reviewers or merge checks. That is host information the owner must supply; this review does not invent it.

Nothing verified here justifies a redesign. Several things justify sharper labelling, one added rule (reconcile unknown external effects before retry), and a measurement plan before any further mechanism is added.

---

# 2. Research-report verification

## 2.1 Reliability summary

| Item | Result |
|---|---|
| Catalog entries | 41 (S1 to S46 with gaps; S20a and S37a as sub-entries) |
| Fetched and checked | 41 of 41. All resolve. openai.com returns HTTP 403 to non-browser clients (access limitation, not a dead link) |
| Dates stated by the report | All stated dates match the pages. S18 carries no date in the report; the page is 2025-09-15, not 2026 |
| Citations in the body with **no catalog entry** | **[S12]** (section 1.3), **[S19]** (2.5), **[S27]** (1.17), **[S37]** (1.5). These are dangling references; the reader cannot check them |
| Catalog entries **never cited** in the body | S5 (Codex app), S40 (NIST SSDF). NIST is listed but does no work in the argument |
| Misattributed claims | 4 (see 2.2) |
| Aliased or wrong-page URLs | 3 (S17 durable-execution, S44 provenance fields, S7 redirect) |
| Overstated claims | 5 (see 2.3) |
| Claims contradicted by their source | 0 |

The report is honest in structure (its evidence grades and FACT / EMPIRICAL / INFERENCE labels are mostly right) and its recommendations survive verification. Its citation hygiene is mediocre: four dangling references, four misattributions, and one benchmark finding attached to the wrong benchmark.

## 2.2 Source-by-source verification

Columns: A = accessible; P/S = primary or secondary; Match = MATCH / PARTIAL / MISMATCH against what the report claims of it.

| Src | Title (as fetched) | A | P/S | Date | What it actually says (key fact) | Match | Limitation |
|---|---|---|---|---|---|---|---|
| S1 | Running Codex safely at OpenAI | yes (browser) | P | 2026-05-08 | "The sandbox defines the technical execution boundary"; approval policy "determines when Codex must ask ... such as when it needs to do something outside of the sandbox"; managed network allow/deny; OpenTelemetry export of prompts, approvals, tool results, MCP, proxy events | PARTIAL: "policy for crossing it" is a paraphrase, not a quote | Vendor internal posture; network policy under an `experimental_network` key |
| S2 | Agents SDK overview | yes | P | undated | Agents, agents-as-tools, handoffs, guardrails, "Sandbox agents", tracing | PARTIAL: the tracing enumeration (LLM generations, tool calls, handoffs, guardrails) is on the tracing sub-page | Unversioned live docs |
| S3 | Agents SDK guardrails | yes | P | undated | "Input guardrails run only for the first agent in the chain"; "Output guardrails run only for the agent that produces the final output"; hosted tools "do not use this guardrail pipeline"; tool guardrails "do not apply to the handoff call itself" | MATCH in substance | Live docs, "does not currently" wording |
| S4 | Agents SDK handoffs | yes | P | undated | Input filters; new agent "gets to see the entire previous conversation history" by default; "perform the check at the start of `on_handoff`, before any application side effects" | PARTIAL: "authorization must be checked before side effects" is developer advice, not an SDK guarantee | The SDK "continues the transfer after `on_handoff` returns successfully" |
| S5 | Introducing the Codex app | yes (browser) | P | 2026-02-02 | Parallel agents, threads, worktrees: "Each agent works on an isolated copy of your code" | MATCH | Launch post; never cited in the body |
| S18 | Introducing upgrades to Codex | yes (browser) | P | **2025-09-15** | "we always recommend using Codex as an additional reviewer—not a replacement for human reviews" | MATCH (verbatim) | Vendor; internal review-quality claim without methodology |
| S32 | Introducing SWE-bench Verified | yes (browser) | P | 2024-08-13 | 500 human-validated tasks; 1,699 annotated; 38.3% underspecified, 61.1% unfair tests, 68.3% filtered | MATCH | Filter "is likely to be overzealous" |
| S33a | Why SWE-bench Verified no longer measures frontier coding capabilities | yes (browser) | P | 2026-02-23 | Audit of 138 hard tasks (27.6%): 59.4% flawed, split into narrow (35.5%) and wide (18.8%) tests that **reject correct** solutions; contamination; "we have stopped reporting SWE-bench Verified scores" | **MISMATCH on one point**: "low-coverage tests that accept incomplete fixes" is not a finding of this post | Title in the report is the URL slug, not the page title; failure-selected subset |
| S33b | Separating signal from noise in coding evaluations | yes (browser) | P | 2026-07-08 | SWE-bench **Pro**: ~30% of tasks broken; "Low-coverage tests under check the requested feature, so incomplete fixes can pass" (9.4% human / 4.1% pipeline); "we retract our earlier recommendation to adopt SWE-Bench Pro" | MATCH, but only for Pro | Vendor self-audit |
| S8 | Building effective agents | yes | P | 2024-12-19 | Workflows = "predefined code paths"; "programmatic checks (see 'gate')"; parallelization example "Reviewing a piece of code for vulnerabilities"; evaluator-optimizer "when we have clear evaluation criteria" | MATCH | Guidance essay, pre-Claude-4 |
| S9 | How we built our multi-agent research system | yes | P | 2025-06-13 | "multi-agent systems use about 15× more tokens than chats"; "Most coding tasks involve fewer truly parallelizable tasks than research"; 90.2% gain is on an internal **research** eval | MATCH | Internal eval; "today" qualifier, June 2025 |
| S10 | Effective harnesses for long-running agents | yes | P | 2025-11-26 | Features "initially marked as 'failing'"; agents "edit this file only by changing the status of a passes field"; "It is unacceptable to remove or edit tests" | MATCH. **This is where the protect-the-test-definition mechanism lives** | Single demo family (web app); narrative |
| S11 | Harness design for long-running application development | yes | P | 2026-03-24 | Planner / generator / evaluator; "agents tend to respond by confidently praising the work"; "tuning a standalone evaluator to be skeptical turns out to be far more tractable"; "sprint contract" agreed before code | PARTIAL: the "authors too generous" quote is a paraphrase; test-weakening prevention is **misattributed** (it is S10) | "an internal engineering project"; web apps and games; single-run cost anecdotes |
| S13 | Scaling Managed Agents | yes | P | 2026-04-08 | Context resets "had become dead weight" on Opus 4.5; harness assumptions "need to be frequently questioned" | PARTIAL: it does **not** recommend "methodical component removal/ablation" | Infrastructure post; one anecdote |
| S14 | How we contain Claude across products | yes | P | 2026-05-25 | "users approved roughly 93% of permission prompts"; 84% prompt reduction restated; "The deterministic boundary is what gets hit when everything probabilistic misses" | MATCH | Undisclosed telemetry methodology |
| S15 | Beyond permission prompts (page title differs from report) | yes | P | 2025-10-20 | Filesystem and network isolation; "sandboxing safely reduces permission prompts by 84%" (origin of the figure) | MATCH | "internal usage", no denominator |
| S20a | Effective context engineering for AI agents | yes | P | 2025-09-29 | "finite resource with diminishing marginal returns"; "attention budget"; progressive disclosure; compaction, structured note-taking, sub-agents | MATCH | Essay |
| S21 | Equipping agents ... with Agent Skills | yes | P | 2025-10-16 | Name and description preloaded; full SKILL.md loaded when relevant; bundled files on demand | MATCH | Launch post |
| S20 | Copilot customization cheat sheet | yes | P | undated | Seven customization types; subagents "in isolated context"; hooks "execute deterministically"; surface matrix: hooks **preview** in VS Code, unsupported in other IDEs; subagents **not** on GitHub.com | PARTIAL: the "simple rules vs detailed skills" sentence is on S23, not here | Surface limits omitted by the report |
| S22 / S26 | Copilot hooks reference | yes | P | undated | Events: sessionStart, sessionEnd, userPromptSubmitted, userPromptTransformed, preToolUse, postToolUse, postToolUseFailure, agentStop, subagentStart, subagentStop, errorOccurred, preCompact, notification, permissionRequest; "supported in two Copilot surfaces: Copilot CLI and Copilot cloud agent"; policy hooks "cannot be disabled by `disableAllHooks`" from `/etc/github-copilot/policy.d/*.json`, `C:\ProgramData\GitHub\Copilot\policy.d\*.json`, `HKLM\Software\Policies\GitHub\Copilot`; subagentStart "cannot block creation"; subagentStop receives `response` and may return `decision: "block"` / `modifiedResponse` | PARTIAL: "most powerful hook" is the report's phrase; surfaces omitted | preToolUse input has no agent identity field |
| S23 | Adding agent skills (cloud agent) | yes | P | undated | "custom instructions for simple instructions relevant to almost every task ... and skills for more detailed instructions that Copilot should only access when relevant" | MATCH (this is the source of the sentence) | "Progressive" wording not on page |
| S24 | Custom agents (Copilot SDK) | yes | P | undated | Per-agent prompt and `tools`; sub-agent "runs with its own prompt and restricted tool set" in "isolated context"; skills opt-in; example `security-auditor` | PARTIAL: no "critic" agent | SDK surface only |
| S25 | Hooks (Copilot SDK) | yes | P | undated | onPreToolUse allow/deny/modify; onPostToolUse "Transform results, redact secrets, audit" | MATCH | No subagent hooks on this page |
| S41 | Actions secure use | yes | P | undated | "Pinning an action to a full-length commit SHA is currently the only way to use an action as an immutable release"; least-privilege `GITHUB_TOKEN` | MATCH | none |
| S42 | Available rules for rulesets | yes | P | undated | Strict: "The topic branch must be up to date with the base branch before merging"; expected source app; "dismiss stale pull request approvals when commits are pushed"; "require an approval from someone other than the last person to push"; default-on "Require an additional approval for unattributed Copilot pull requests" | MATCH; last rule omitted by the report | Org rulesets plan requirement unverified |
| S43 | Deployments and environments | yes | P | undated | Up to six reviewers; "Only one of the required reviewers needs to approve"; "users who initiate a deployment cannot approve the deployment job"; "a job cannot access environment secrets until one of the required reviewers approves it"; admins bypass by default; required reviewers public-repo-only below Enterprise | MATCH | Plan and bypass caveats omitted |
| S6 | Towards a science of scaling agent systems (blog) | yes | **S** (blog of arXiv 2512.08296) | 2026-01-28 | 180 configs, four benchmarks (Finance-Agent, BrowseComp-Plus, PlanCraft, Workbench); PlanCraft: hybrid −39.1%, decentralized −41.5%, centralized −50.3%, independent −70.0%; error amplification 4.4× centralized vs 17.2× independent; **v3 (2026-04-08): 260 configs, adds SWE-bench Verified (20 instances, 8 models) where hybrid −2.1%, centralized −3.1%, decentralized −5.4%, independent −14.9% vs single agent** | PARTIAL: numbers match the blog; the paper's SWE-bench slice and non-peer-reviewed status are omitted | No software task in the headline results; preprint |
| S7 | Google ADK docs | redirects to adk.dev | P | undated | "Template workflow agents ... without consulting an AI model for assistance with the orchestration. This approach results in deterministic and predictable execution patterns." | MATCH | Design property, no measurement |
| S30 | SWE-agent | yes | P | NeurIPS 2024 (confirmed via proceedings) | ACI; 12.47% SWE-bench; +10.7 pp over shell-only | MATCH | GPT-4 Turbo era |
| S31 | AgentCoder | yes | P | arXiv only, **not peer reviewed** | Programmer / test designer / test executor; tests generated "without seeing the whole code snippet"; **ablation**: single agent for code and tests 71.3% / 79.4% vs separate agents 79.9% / 89.9% (GPT-3.5-turbo, HumanEval / MBPP) | MATCH; the report undersells the ablation and oversells the venue | Function-level Python only |
| S34 | Agentless | yes (ACM DL 403) | P | v2 2024-10-29; FSE 2025 per search only | v1 was **two-phase**; v2 three-phase 32.00% SWE-bench Lite at $0.70; best among open-source approaches | PARTIAL: "validation" stage exists only in v2 | Mid-2024 comparators |
| S35 | OpenHands | yes | P | ICLR 2025 | Event stream; "securely isolated docker container sandbox" | MATCH | 2024 numbers |
| S36 | ChatDev | yes | P | ACL 2024 | Synthetic SRDD prompts; executability = "compiles and runs", not correctness | MATCH | Proxy metrics |
| S37a | MetaGPT | yes | P | ICLR 2024 oral | SOPs "to verify intermediate results and reduce errors"; "cascading hallucinations" | MATCH | Function-level plus 70-task subjective set |
| S17 | LangGraph persistence / durable execution | persistence yes; **durable-execution URL silently serves the persistence page** | P | undated | Checkpointer = "short-term, thread-scoped memory"; store = "long-term, cross-thread memory"; idempotency text now on functional-api ("A task that started but did not finish may run again on that resume, so design side effects to be idempotent") and interrupts pages | MATCH in substance; **wrong URL** for the idempotency claim | Docs restructured |
| S38 | OTel context propagation | yes | P | undated | Trace and span ids "build causal information"; "Malicious actors could send forged trace headers" | MATCH | none |
| S39 | MLflow agent / trace evaluation | yes | P | MLflow 3.3+ | "evaluate the agent's behavior precisely, not only the final output, such as the tool call trajectory" | MATCH | Unpinned "latest" |
| S40 | NIST SP 800-218 | yes | P | v1.1 Feb 2022 final; **v1.2 = SP 800-218r1 initial public draft (2025-12-17), not final** | PS.1.1 least privilege, commit signing, owner review; PS.3.2 provenance; PW.7 code review; PW.8 testing | MATCH (version) | Never cited in the body |
| S44 | SLSA provenance v1.2 | yes | P | v1.2 Approved | Concept page only; distinguishes **Build** provenance from **Source** provenance ("the creation of source code revisions and the change management processes") | PARTIAL: field names are on S45 | Wrong page for schema |
| S45 | SLSA build provenance v1.2 | yes | P | v1.2 Approved | `subject`, `buildDefinition{buildType, externalParameters, internalParameters, resolvedDependencies}`, `runDetails{builder.id, metadata.invocationId/startedOn/finishedOn, byproducts}` | MATCH | none |
| S46 | in-toto getting started | yes | P | undated | Layout "lists the sequence of steps ... and the functionaries authorized to perform these steps"; link metadata signed per step; "each step was performed and signed by the authorized functionary" | MATCH | Walkthrough, not the spec |

Uncatalogued: **[S12], [S19], [S27], [S37]** cannot be verified because they do not exist in the catalog.

## 2.3 Overstated claims

1. **Section 1.19 / S13.** "Recommends methodical component removal/ablation." The source observes one harness feature going stale; it recommends questioning assumptions, not an ablation programme. Ablation is the report's idea (a reasonable one), not Anthropic's.
2. **Section 1.16 / S33.** "OpenAI's 2026 audits found low-coverage tests ... capable of accepting incomplete fixes" is attributed to the SWE-bench Verified audit. The Verified audit found tests that reject correct solutions. Low-coverage tests are a SWE-bench Pro finding, and OpenAI has since retracted its Pro recommendation. The principle the report draws (green tests are not semantic proof) still holds, from S33b.
3. **Section 1.1 / S6.** "Google Research evaluated 180 agent configurations" is the January blog. The paper's April revision has 260 configurations and a SWE-bench slice on which multi-agent systems did not help. The omission matters because the report uses S6 as its top evidence for agent architecture in a software pipeline.
4. **Section 1.3 / S11.** The claim that Anthropic prevents "the coding agent from weakening the feature/test definition" belongs to S10, and it is a prompt instruction ("It is unacceptable to remove or edit tests"), that is, a PROMPT_CONTRACT in the report's own vocabulary, not a mechanism.
5. **Section 9.2 / S22.** "GitHub describes this as the most powerful hook." Not on the page.

## 2.4 Understated findings

1. **AgentCoder has a real ablation** (separate test agent vs one agent writing both) that the report does not mention; it is the only controlled comparison for the Tester question, even if narrow.
2. **`subagentStop` can block and rewrite** the subagent's response and receives it in full. The report calls it a "structural checkpoint"; it is more than that: it is a host-executed hook that can persist and shape-check a fresh role's reply before the parent sees it.
3. **GitHub's default-on "Require an additional approval for unattributed Copilot pull requests"** rule is directly relevant to an agentic pipeline and unmentioned.
4. **The Google v3 SWE-bench slice** strengthens the report's own "fewer reasoning agents" thesis; the report leaves it out.
5. **In-toto transfers better than SLSA build provenance** to a source-level candidate (materials and products are arbitrary hashed files; layouts name authorized functionaries per step). The report treats them together.

## 2.5 Important missing evidence

1. **The corporate host.** The report's authorization and hook evidence is GitHub-only. Claude's approval agent holds `bitbucket-mcp` tools and the planner holds `jira-mcp`. No Bitbucket branch-permission, required-reviewer, or merge-check documentation was cited or verified. This review does not invent it (section 9).
2. **Copilot surface limits.** Hooks are GA on CLI and cloud agent, preview in VS Code, absent elsewhere. Subagents are not available on GitHub.com. `handoffs` frontmatter is "currently not supported for Copilot cloud agent". VS Code subagents "cannot" use "the built-in tools for asking clarifying questions and managing todo items" and "Each subagent invocation is stateless". The report never states which surface RSTACK runs on; its hook recommendations are only as real as that answer.
3. **Copilot `preToolUse` input carries no agent identity** (fields: `sessionId, timestamp, cwd, toolName, toolArgs`). A hook cannot know which rstack role is calling. Role-scoped lane enforcement through hooks is therefore not a documented Copilot capability; Claude Code's hooks do carry `agent_type`.
4. **Anthropic's own agent documentation** (not cited): Claude Code subagents run "in its own context window", can be restricted with `tools` or `disallowedTools`, and enterprise `allowManagedHooksOnly` hooks cannot be disabled by users. This is corroborating vendor documentation for fresh-role isolation and managed policy hooks, but for a different host.
5. **No evidence at all** on risk tiers, plan interviews, or the value of cross-run memory for coding agents. The report says so for memory; it should say so for the other two.

---

# 3. Strongest externally supported RSTACK principles

Ranked by evidence strength (source type, directness, whether the source is a mechanism or an opinion).

| Rank | Principle in Claude V2 | Evidence | Type | Strength |
|---|---|---|---|---|
| 1 | Evidence, review and authorization bind to an immutable commit identity and go stale when it changes | S41 full-SHA pinning; S42 dismiss stale approvals on push, approval by someone other than the last pusher; S45 subject digests; S46 materials/products | Platform mechanism + standard | Very high |
| 2 | Integrate the base branch before final verification and review | S42 strict mode: "must be up to date with the base branch before merging" | Platform mechanism | Very high (as analogue) |
| 3 | An agent-written approval record is not authentication; authorization belongs to a platform event outside the actor | S43 required reviewers, prevent self-review, secrets withheld until approval; S46 signed by "the authorized functionary" | Platform mechanism + standard | Very high |
| 4 | A prompt is not a boundary; containment first, prompts second; approvals are friction, not isolation | S1 "The sandbox defines the technical execution boundary"; S14 "The deterministic boundary is what gets hit when everything probabilistic misses"; S15 isolation | Vendor production security | High |
| 5 | Global always-on instructions stay small; procedure lives in on-demand skills | S23 (verbatim guidance); S21; S20a finite context | Vendor guidance, two vendors | High |
| 6 | Green tests are necessary, not sufficient; test adequacy is itself reviewable | S32, S33a, S33b (measured benchmark test defects) | Empirical | High for the principle |
| 7 | Reviewer independent of author; agent review supplements human review | S11 (narrative), S18 (verbatim), S8 evaluator-optimizer | Engineering narrative + vendor guidance | Medium-high |
| 8 | Orchestration as predefined transitions, not model-chosen paths | S8 workflows vs agents; S7 deterministic workflow agents; S6 centralized error containment | Guidance + preprint | Medium-high |
| 9 | Provenance is inherited through derivation; agent logs are not telemetry | S38, S39 (trace semantics); INFERENCE | Tooling semantics | Medium |
| 10 | Reconcile an external effect of unknown result before retrying | S17 (functional-api / interrupts pages) idempotency on resume | Framework docs | Medium; **not yet in Claude V2** |
| 11 | Separate test author from implementer | S31 ablation (GPT-3.5, function-level); S10 locked feature list | Preprint + narrative | Medium-low |
| 12 | Keep memory optional; run state is not long-term memory | S17 checkpointer vs store; S20a | Design distinction only | Low |

---

# 4. Claims that are weaker than the research report suggests

1. **"Centralized orchestration contains error amplification better" (S6).** SOURCE FACT for four non-software benchmarks in a preprint. EMPIRICAL RESULT on the one software benchmark in the paper: every multi-agent variant, centralized included, scored below the single agent (−3.1% centralized). The transferable content is a heuristic: independent parallel agents amplify errors (17.2×); sequential decomposition costs. It does not show that a centralized seven-role pipeline outperforms one strong agent on code.
2. **"Coding is often less parallelizable than research" (S9).** SOURCE FACT, but it is one sentence of vendor opinion with a June 2025 "today" qualifier. It supports not parallelizing the delivery chain; it says nothing about how many sequential specialists to use.
3. **"Self-evaluation is weak; a separate evaluator is easier to tune" (S11).** SOURCE FACT, from "an internal engineering project" building web apps and games, with single-run cost anecdotes and an admission that the separate evaluator "is still an LLM that is inclined to be generous". No controlled comparison exists in the cited set. The report grades this B/C; C is right, B is not.
4. **"Tester ≠ Developer" (S31, S10).** S31's ablation is real but on 164 + 500 function-synthesis problems with GPT-3.5. S10's mechanism is a prompt instruction. Neither says anything about RED-first, locking, or repositories with existing suites. INFERENCE only for RSTACK's setting.
5. **"Harness complexity must be continually re-earned" (S13).** One anecdote; no recommendation of ablation in the source. The principle is sensible; its evidence grade is anecdote, not "C".
6. **"Hooks: preToolUse is the highest-value blocking hook" (S22).** Correct that it can deny, but the report never says the hook cannot see which agent is calling on Copilot, cannot run in most IDEs, and is preview in VS Code. As written, the section invites host capabilities that may not exist for RSTACK.
7. **"Use in-toto / SLSA as the reference for candidate identity" (S44–S46).** SLSA build provenance describes built artifacts; a commit is an input (`resolvedDependencies` with `gitCommit` digest), not a subject. The relevant SLSA track is Source, which the report does not cite. In-toto transfers, but its guarantee rests on functionary keys that RSTACK agents do not hold.
8. **"OpenAI found low-coverage tests accepting incomplete fixes on SWE-bench Verified."** Wrong benchmark (section 2.3).

---

# 5. Multi-agent architecture findings

**What the evidence supports.** Predefined control flow for a known process (S8 VENDOR GUIDANCE; S7 SOURCE FACT on ADK's deterministic workflow agents). Centralized coordination limits error propagation relative to independent agents (S6 EMPIRICAL, non-software). Parallel fan-out is expensive (S9: 15× tokens) and helps breadth-first work, not tightly coupled work. Every added agent on a sequential task is a cost the study measured as negative.

**What it does not support.** That a pipeline of seven specialised LLM roles delivers software more reliably than one agent plus deterministic gates. The only software-engineering datum in the cited set (S6 v3, 20 SWE-bench instances) points slightly the other way, and MetaGPT / ChatDev (S36, S37a) show role structures on synthetic tasks with proxy metrics.

**Comparison with Claude V2.** Claude's pipeline is a strictly sequential chain (0 → 1 → 1b → 1r → 2 → 3 → 4 → F → 4 → 5 → 6) dispatched by an orchestrator that "never plans, tests, implements, reviews, interprets findings". It is the report's "deterministic controller" in shape, executed by an LLM in practice (SKILL.md: "Unless a line here says otherwise, it is a PROSE CONTRACT"). There is no parallel fan-out anywhere, which is consistent with S9. There is also no per-ticket variation: every ticket pays seven dispatches, two of them fresh. The Google and Anthropic evidence say that cost is real and unmeasured.

**Assessment.** Making the orchestrator "mostly deterministic" is supported (medium-high). Claude already did that in prose; the evidence says the transition table should eventually be evaluated by code (ADK, LangGraph), which Claude lists as an enforcement dependency. The evidence does not tell RSTACK to remove roles; it tells RSTACK that the reason for each role must be independence (author never judges), and that the cost of that independence must be measured (section 17). Where a role's output has no consumer that a deterministic check could not serve, the evidence favours removal; Claude already removed `evidence-auditor` on that reasoning.

---

# 6. Role-by-role assessment

**Orchestrator.** SUPPORTED. Dispatcher-only, routes from artifacts not prose, compares fields, never judges. This is the ADK "workflow agent" role (S7) with an LLM executor. Two gaps the evidence exposes: no rule for an external effect whose result is unknown (S17: "A task that started but did not finish may run again on that resume"); and its `agents:` frontmatter list is a host-enforced restriction on VS Code ("Use ... an empty array `[]` to prevent any subagent use") that Claude does not label as such. On VS Code the orchestrator's fresh roles are subagents that "cannot" ask questions and are "stateless"; Claude's design (roles ask through their reply, orchestrator relays) is consistent with that, and should say so in the adoption record.

**Planner.** SUPPORTED as a distinct pass (S8 prompt chaining with gates; S11 planner; S10 initializer). The interview method, verbatim ticket capture and provenance labels are RSTACK-specific; no external source addresses them and none contradicts them. Removal of self-dispatched audit is supported by the evaluator-independence argument (S11).

**Plan Auditor.** SUPPORTED as a role; **NOT SUPPORTED as a mandatory state on every ticket.** S8's evaluator-optimizer is recommended "when we have clear evaluation criteria"; S11's evaluator judges output, not plans. Claude's rationale (falsifiability of criteria before tests are locked, so that a vacuous check is caught before the expensive repair) is coherent and is the best available argument; it is untested. The report's proposal to run it conditionally is INFERENCE and conflicts with Claude's invariant "no risk tier ... removes a state". That invariant is an OWNER POLICY, not an evidence finding. Recommendation: keep mandatory for the pilot, run ablation A (section 17), decide with data.

**Tester.** SUPPORTED WITH CHANGES. Separate test authorship: medium-low external support (S31 ablation; S10). Locking tests against the implementer: the S10 instruction is the closest analogue, and it is a PROMPT_CONTRACT there too. RED-first, two-run flake check, base replay, fixture-survival rule: RSTACK-specific engineering discipline with no external citation and no contradiction. Change: `suite.txt` is `AGENT_REPORTED`; the host's `postToolUse` hook receives `toolResult.textResultForLlm` for the terminal tool, which is a host-observed record of the same execution (section 12). That is the first credible route to `OBSERVED_HOST` receipts without a new wrapper.

**Developer.** SUPPORTED. Smallest agent; receives only plan, failing tests, and `Act on` findings (S4 input filtering; S20a). "Nothing in the host stops you opening a test file" is exactly the honesty S1 and S14 call for. No change from evidence.

**Reviewer-Architect.** SUPPORTED, strongest role. Fresh context, read-only tool list (host-enforced "to the extent the host honours the list", which matches VS Code: "If a given tool is not available when using the custom agent, it is ignored"), candidate-bound, test adequacy as primary obligation (S33b principle), findings routed by owner. The independence statement ("Fresh context is independence from prior reasoning, not vendor diversity") matches the report's 15.16 and is better evidenced than model diversity. Two host facts to record: the review reply's persistence depends on the parent (VS Code: "The main agent receives only the final recommendation"), and `subagentStop` could persist it host-side (section 12).

**Approval.** SUPPORTED WITH CHANGES. The evidence (S42, S43, S46) says: eligibility is a deterministic check; authorization is a platform event by someone other than the initiator; the action is performed by a guarded publisher with credentials withheld until approval; the result is re-read. Claude's `release` mode already re-checks eligibility mechanically (HEAD, `suite.txt` fields, `review.md` presence and verdict, lock, estate), asks one decision per action naming the candidate, pushes the explicit SHA, offers "to let the human perform the action themselves", and refuses merges. What remains reasoning-heavy is the eligibility re-evaluation being done by a model reading files, and the agent holding `bitbucket-mcp` PR-creation tools throughout the run. Recommendation: (a) keep the stage and the two modes; (b) rename in substance to a release coordinator whose eligibility step is a script once the real gate is known; (c) make "human performs push and PR with their own credential" the default when the host has no authorization receipt; (d) add the unknown-result reconciliation rule. It should not disappear as a role until a gate script and a host receipt exist; until then it is the only place the re-check happens at all.

---

# 7. State-machine assessment

**Centralized transitions.** SUPPORTED (S7, S8, S6). One owner (`SKILL.md`), one table, results read from artifacts. The report's minimal state list (section 6.1) is a superset of Claude's; the names are immaterial.

**Retries.** Claude has a convergence rule keyed on blocker identity ("Three consecutive turns with no change in what is blocking → stop") and no iteration budget that converts an unproven criterion into a pass. Evidence neither supports nor contradicts a specific count. **Gap:** nothing in `SKILL.md`, `approvals.md` or the approval agent says what happens when a push, PR creation or tracker write was attempted and its result is unknown. S17 (functional-api: "design side effects to be idempotent"; interrupts: "any code that ran before the interrupt will execute again") is directly on point. RECOMMENDATION: add to `SKILL.md` a rule that an external action with an unknown result yields `NEEDS_HUMAN` with a remote re-read, never a retry; add a `PUBLICATION_RESULT` line with `SUCCEEDED | FAILED | UNKNOWN | PARTIAL` to `approval.md` in `handoff-contracts.md`.

**HELD.** `claude-v2` has no `HELD` state; it has `NEEDS_HUMAN`, `CONFLICT`, `BLOCKED owner=human` and `RELEASE_BLOCKED proceedable`. The photographed gate emits `HELD` (known since the v2.1 reconciliation, and the memory rule "HELD is not pending execution"). External evidence says nothing about HELD; it is an RSTACK gate fact and belongs to the source-inspection decision (OD-5). `claude-v2.2` already carries it; nothing further from this review.

**Review eligibility.** SUPPORTED. Five field comparisons at one candidate. The AC-carried-forward rule ("does not block review; ... blocks release") is a sound reading of S42's separation between review and merge requirements.

**Release eligibility.** SUPPORTED. Six conditions, `proceedable` never equals eligible, waivers confined to release. Analogue: S43 "administrators can bypass the protection rules" by default; a bypass is a recorded human act, not a pass. Claude's deviation from S42 strict mode (continue at the candidate if the base moved without path overlap) is a deliberate cost trade-off, weaker than strict, and correctly stated as such; it stays an OWNER POLICY.

---

# 8. Candidate identity and provenance

Claude's `candidate.md`: repository, commit, tree, integrated default, plan revision, test-lock revision, suite command, changed paths, superseded candidates; written by the approval role at freeze; no evidence file inside the commit.

| Concept | External analogue | Transfers to RSTACK? |
|---|---|---|
| Commit SHA as the immutable subject | S41 "the only way to use an action as an immutable release"; S42 status checks are per-commit | **Yes, directly.** Git's own identity; no framework needed |
| Tree hash | Not in the cited sources (in-toto DigestSet lists `gitCommit`; a tree id is a Git object) | Yes as an optional second key; Claude rightly does not assume tree equality survives review (OD-6) |
| Artifact digest | S45 `subject` digests | **No, not now.** RSTACK publishes source, builds nothing. Becomes relevant only if RSTACK ever drives deployment |
| Build provenance (`buildDefinition`, `runDetails`) | S45 | Vocabulary only. SLSA's **Source** track (S44: "the creation of source code revisions and the change management processes") is the correct frame for a commit-level candidate; the report cites the wrong track |
| Materials / products per step, authorized functionaries | S46 | Conceptually yes: plan → tests → implementation → review as steps with declared inputs and outputs and an allowed role per step. The signature half does not transfer: agents hold no keys. Commit signing (NIST PS.1.1 example) is the nearest available functionary signature, and only for the freeze commit |
| Strict branch freshness | S42 strict mode | Claude is deliberately looser (path-overlap rule). Weaker, stated, owner's choice |
| Stale evidence after mutation | S42 "dismiss stale pull request approvals when commits are pushed that affect the diff" | **Yes, directly.** Claude's single freshness rule is the same rule generalised to tests and authorization |
| Evidence outside the evaluated commit | Not stated by any source; INFERENCE (a file naming its own final SHA cannot be inside it) | Yes. Sound. Note the photographed `ac.tsv` is committed and sha-based; that conflict is already in the v2.2 record (OD-5b), not resolved by evidence |
| Who computes the identity | S45 `runDetails.builder.id` is a trusted builder, not a participant | Claude's "today an agent types it" is honest; a tool should write `candidate.md` (OD-6 point 2) |

Assessment of `candidate.md`: SUPPORTED. It is the most externally corroborated artifact in Claude V2. Two refinements the evidence suggests: cite the SLSA Source track rather than build provenance if a rationale is ever written into the reference; and record `Persisted-by:` or a tool marker so that the agent-typed status of the identity is visible in the file itself, as review and audit artifacts already do.

---

# 9. Human authorization and release control

**The four-way distinction (request, decision, authentication, action).** SUPPORTED by mature systems. S43 separates the initiator (request), the required reviewer (decision, "users who initiate a deployment cannot approve"), the platform's identity of that reviewer (authentication), and the job that then receives the secrets (action). S46 separates the layout (who may act), the link (that they acted, signed), and verification. Claude's `approvals.md` already separates REQUEST / HUMAN AUTHORIZATION / RECORDED DECISION and states the authentication limit ("A record is agent-written text ... it authenticates nobody").

**What Claude calls "authorization" that is really weaker:**

| Claude term or field | Actual provenance |
|---|---|
| `HUMAN DECISION` (guarantee vocabulary) | HUMAN_RECORDED: a human replied in the host conversation; an agent wrote it down. Claude says this in the definition ("that an agent-written record of it authenticates that person" is what it cannot claim). The term itself reads stronger than the definition |
| `--authorised-by`, `authorised_by`, `accepted_by` | AGENT_REPORTED (typed text). Claude says so in four files |
| `meta/decisions.md` "Answer: the human's words, verbatim" | HUMAN_RECORDED by a role other than the requester. Correct labelling; no authentication |
| `observation-accept.tsv` "by a human's own hand" | HUMAN_RECORDED at best; nothing verifies the hand |
| "Push the candidate commit explicitly" by the approval agent | AGENT action under a HUMAN_RECORDED decision, with the agent's credential |
| "Offer to let the human perform the action themselves" | The only path in Claude V2 where the action is bound to an authenticated human: the human's own SCM credential and, if configured, the SCM's own branch controls |

**Strongest feasible model on RSTACK's host, given what is verified:**

1. Release eligibility as a script over `candidate.md`, `suite.txt`, `ac.tsv`, `review.md`, lock and estate (DETERMINISTIC_CHECK). Claude's approval agent performs this by reading today.
2. The human performs push and PR creation with their own credential by default (HUMAN authenticated by the SCM), the agent prepares the exact commands and text. Claude offers this as option (b); make it the default until the host provides a receipt.
3. SCM-side controls as the last line: branch permissions, required reviewers, no self-approval, required builds. **These are Bitbucket features on RSTACK's host and none was verified in this review.** The GitHub evidence shows what to look for; it does not show what Bitbucket provides. HOST INFORMATION REQUIRED.
4. Credentials for external writes absent from every role but the publisher, and ideally absent until eligibility holds (S43 secret withholding). Today Claude's approval agent holds `bitbucket-mcp` tools for the whole run; whether Copilot can scope MCP tools per state is unknown.
5. The in-run "yes" remains the courtesy checkpoint and audit trail Claude already describes; it is not the control.

This is the report's model with one difference: where the report assumes a platform approval event exists, this review says the human's own credential is the authenticated event available now.

---

# 10. Enforcement hierarchy

The report's five terms and Claude's four map as follows. Claude's vocabulary is the more precise one on the axis that matters (who runs the check); the report's is more precise on provenance of a claim. Both are needed.

| Claude guarantee | Held by | Report term | Block or detect |
|---|---|---|---|
| Reviewer writes nothing | tool list (read and search only) | HOST_ENFORCED, "as far as the host honours the list" (VS Code: unavailable tools "ignored") | block |
| No role has a PR-merge tool; only approval has PR creation | tool lists | HOST_ENFORCED | block |
| Orchestrator may only spawn the six named roles | `agents:` list (VS Code: `[]` prevents subagent use) | HOST_ENFORCED, **currently unlabelled in Claude** | block |
| Fresh roles receive only the allowlist | dispatcher discipline | PROMPT_CONTRACT | none |
| Planner / tester / dev / approval lanes | `role-guard.mjs` self-run | DETERMINISTIC_CHECK, detect-after, self-run | detect |
| Locked test unchanged | `test-lock.mjs --verify` cross-run | DETERMINISTIC_CHECK, cross-run | detect |
| Unlocked test unchanged by dev | tester and reviewer reading | PROMPT_CONTRACT | none |
| Test executed, exit code | tester-typed `suite.txt` | AGENT_REPORTED | none |
| Candidate identity | approval-typed `candidate.md` from git output | AGENT_REPORTED (of a tool output) | none |
| Sibling repository untouched | `estate-guard.mjs --verify` | DETERMINISTIC_CHECK, detect-after | detect |
| External action needs a yes | host ask-rules + prose | PROMPT_CONTRACT + friction (S1: approvals are policy, not the boundary) | prompt |
| The yes itself | chat reply written by another role | HUMAN_DECISION, provenance HUMAN_RECORDED | none |
| Governance files untouched | edit auto-approve denies (user-scoped), prose | friction + PROMPT_CONTRACT | prompt |
| Any write outside the workspace | `blockedDetectedFileWrites: outsideWorkspace` | host setting (block for the edit tool; "do not cover writes made by a terminal command") | partial |

**Does the report's hierarchy reflect the evidence?** Yes for its ordering: S14 states the deterministic boundary is the backstop for probabilistic controls; S1 states the sandbox is the boundary and approvals are policy; S15 measures the prompt reduction. The hierarchy under-specifies one axis Claude already has: a DETERMINISTIC_CHECK that runs after the effect, by the judged role, is far weaker than one that runs before the effect, by the host. Recommendation: keep Claude's four terms, add a block/detect attribute to every `harness-map.md` row, and adopt the report's provenance labels (`OBSERVED_HOST`, `OBSERVED_TOOL`, `AGENT_REPORTED`, `HUMAN_RECORDED`, `INFERRED`, `UNAVAILABLE`) in `discovery-cost.md`, which today lacks `HUMAN_RECORDED` and does not distinguish host from tool observation.

**Sandbox versus role guard.** The evidence supports the report exactly: `role-guard.mjs` is detection and audit; the sandbox is whatever the host and container provide. Claude says this in `write-boundaries.md` §5 and `approvals.md` §4 ("They do not contain a process that is trying to get out"). No correction needed to the text; the correction is to the adoption record, which must state what containment the corporate host actually provides (section 19, OD-4 / OD-5).

---

# 11. Instruction / Agent / Skill / Hook architecture

**Evidence.** S23 (verbatim): instructions for "simple instructions relevant to almost every task", skills for "more detailed instructions that Copilot should only access when relevant". S21: name and description preloaded, body loaded on demand. S20a: context is a finite resource. S24 / cheat sheet: custom agents carry their own prompt and tool restrictions; subagents run in isolated context. Claude Code docs corroborate the same layering for another host.

**Claude's placement:**

| Layer | Claude file(s) | Size | Assessment |
|---|---|---|---|
| Always-on floor | `rstack-process.instructions.md` (`applyTo: '**'`) | 44 lines: external effects, fetched content, evidence floor, gaps first, role pointer | SUPPORTED. This is what S23 describes. It replaces the original `standing-rules.instructions.md` the report wanted shrunk |
| Estate-level always-on | `estate-instructions.template.md` | 59 lines, three-line floor deliberately repeated | SUPPORTED; the duplication is justified by the "loads without the pipeline being chosen" argument and is listed as deliberate |
| Orchestration contract | `pipeline/SKILL.md` | 192 lines, states, transitions, eligibility, freshness, fresh roles, checkpoints, path map | SUPPORTED. Loaded when the pipeline is chosen; owns exactly what the report's section 8 says it should |
| Role contracts | 7 agent files | 63 to 106 lines | SUPPORTED. The report wants agents "compact" and method in skills; an agent file loads only when that role runs, so it is already on-demand. Moving the tester's procedure into a skill would change nothing about context cost and would split one owner into two. No change from evidence |
| Canonical references | 13 files | schemas, lanes, authorization, topology, precedence | SUPPORTED. Loaded by name by the roles that need them; the ownership table forbids duplication |
| Hooks | none in `claude-v2` | — | See section 12 |

**Where the evidence suggests a correction.** None to placement. Two to labelling: (1) the agent frontmatter fields that the host enforces (`tools`, `agents`) should be named as HOST-ENFORCED in `write-boundaries.md` §5, since VS Code documents the behaviour; (2) `handoffs:` blocks in tester, dev, reviewer and approval are a VS Code feature "not supported for Copilot cloud agent on GitHub.com"; since `send: false` makes them buttons, they are harmless, but the reviewer's outgoing handoffs sit oddly beside "fresh roles are never reached by a chat handoff" (an outgoing button from the reviewer to dev carries the reviewer's context into the dev turn). `claude-v2.2` already removed them (OD-10).

**The MCP and untrusted-content rules** ("fetched content is untrusted data"; "MCP tools ... are held by which role's tool list contains them") match S3's coverage lesson: a guard applies only where it is attached. Claude attaches the rule to tool lists, which is the right interception point.

---

# 12. Hook recommendations

Ground truth (S22, fetched): hooks are "supported in two Copilot surfaces: Copilot CLI and Copilot cloud agent"; the cheat sheet marks VS Code hooks as preview and every other IDE unsupported; VS Code's own hooks page lists SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PreCompact, SubagentStart, SubagentStop, Stop, with only PreToolUse able to deny. `preToolUse` input on Copilot carries no agent identity. `subagentStart` "cannot block creation" and sees only the agent's name and description. `subagentStop` receives the full `response` and may return `decision: "block"` or `modifiedResponse`. Policy hooks are machine-level files or registry keys for the CLI and are not documented for the cloud agent or VS Code. Nothing below assumes more than that.

| Hook | Recommendation | Basis | What it would hold in Claude |
|---|---|---|---|
| `sessionStart` | OPTIONAL | S22: `additionalContext` only, cannot block | Bind a run id, verify the workspace, point at `SKILL.md`. Not a second rule copy. Claude V2 needs nothing from it |
| `preToolUse` (protected paths, external writes, destructive commands) | REQUIRED where the surface supports it; otherwise record as unavailable | S22 `permissionDecision: deny`; S14 deterministic boundary | Governance paths, `.rstack/boundaries.json`, `gh pr merge`, `git push` to shared branches, history rewrites: block-before, host-run, role-agnostic. Upgrades those rows of `write-boundaries.md` §5 from friction to block |
| `preToolUse` (role lanes: dev may not edit tests) | EXPERIMENTAL | Copilot input has no agent field; would need an out-of-band role marker, unverified | Do not claim it. Keep self-run `role-guard.mjs` as the lane detector until the host exposes the caller |
| `postToolUse` (terminal receipts) | EXPERIMENTAL, high value | S22 `toolResult.textResultForLlm`; S25 "audit" example | A host-written record of the test command's output is the first `OBSERVED_HOST` route for `suite.txt`. Answers half of OD-5 without inventing a wrapper. Must be tested: does the field carry the exit code, or only text? |
| `postToolUse` (secret redaction) | OPTIONAL | S25 redaction example | `handoff-contracts.md` already requires redaction by the writer; a hook makes it host-run |
| `subagentStart` | EXPERIMENTAL | S22: cannot block; sees name only; can prepend context | Could inject the candidate id and the fresh-role allowlist, but that adds context the dispatcher already controls. Run once to learn whether it fires for `runSubagent`; then keep or remove. The existing probe in the real rstack: REMOVE once answered |
| `subagentStop` | EXPERIMENTAL, highest structural value | S22: full `response`, `decision: "block"`, `modifiedResponse` | (a) Shape-check a fresh role's reply against the `plan-audit.md` / `review.md` headings and block a malformed one (DETERMINISTIC_CHECK, host-run); (b) write the response verbatim to the artifact path, removing the orchestrator as scribe. This directly addresses the enforcement dependency in the orchestrator file ("host persistence of a read-only role's reply"). Never use `modifiedResponse` to alter a verdict |
| `sessionEnd` / `agentStop` | OPTIONAL | S22 | Close a trace; never "ticket complete" |
| `errorOccurred` | OPTIONAL | S22 no output fields | Record; route to `NEEDS_HUMAN` by the state machine, never retry an external action (section 7) |
| Release-boundary hook | REMOVE as a hook | Report 9.9; nothing in S22 suits a multi-artifact gate | A named gate script plus the human's own action (section 9) |
| Policy hooks (machine-owned) | HOST INFORMATION REQUIRED | S22: CLI paths and registry; not documented for VS Code or cloud agent | If RSTACK runs on Copilot CLI, `C:\ProgramData\GitHub\Copilot\policy.d\*.json` is a real admin-owned layer; otherwise do not plan around it |

None of these is a change to `claude-v2` runtime files. They are entries for the adoption record and, once observed, rows in `harness-map.md` and `write-boundaries.md` §5.

---

# 13. Testing architecture

**Separate Tester.** Justified as a policy with medium-low external support. S31 shows a separate test-writing agent beats one agent writing both on function-level tasks (EMPIRICAL, preprint, GPT-3.5); S10 shows Anthropic protecting the feature list from the implementer (PROMPT_CONTRACT in a narrative). The strongest argument is structural and Claude states it: "The role that writes the implementation must never be able to rewrite the check that judges it." That is the same principle as prevent-self-review (S43), applied one level down. Keep.

**RED-first.** No external evidence in the cited set. It is the discipline that makes the lock meaningful (a lock on a test that never failed proves nothing), so it is internally required, not externally proven. Keep; label RSTACK-specific.

**Test lock.** The best-evidenced piece: S10's "unacceptable to remove or edit tests" instruction is the same intent, weaker mechanism. Claude's lock is a cross-run DETERMINISTIC_CHECK (hash, assertion count, skip count) plus a human-decided amendment path; Claude already calls the counts "a tripwire, not proof of strength". Keep. Change only when the real `test-lock.mjs` is read (OD-5).

**Test Challenge (OD-1).** Classification: **EVIDENCE INSUFFICIENT; deferring is the evidence-consistent default.** No source evaluates a pre-implementation test critique. The coordination-cost evidence (S6, S9) argues against adding a dispatch without a measured need; S33b's low-coverage finding argues that test adequacy review matters, which Claude already assigns to the reviewer after implementation. Claude's own measure ("vacuous or missing checks found at review") is the right instrument. Keep A; measure; decide.

---

# 14. Review architecture

**Plan audit.** Role supported (S8, S11 evaluator pattern); universality unsupported (section 6). The five lenses, falsifiability test and "attempted and found nothing" requirement are RSTACK-specific and uncontradicted.

**Semantic review.** SUPPORTED, strongest. Candidate-bound, fresh, read-only, tests judged for discrimination before code is read for correctness. S18 says agent review supplements human review; Claude's PR body ("Reviewed: fresh independent context") and "no agent merges a pull request" keep the human PR review in place. The GitHub rule requiring an extra approval for unattributed Copilot PRs (S42) is a platform-side expression of the same policy on a host RSTACK may not use.

**Panel review.** Not in `claude-v2` (the reconstruction's `panel-reviewer` was not carried). S8 names parallel vulnerability review as a valid pattern; S6 and S9 price it. Correct to leave optional; nothing to add.

**Evidence audit.** Dropped in Claude (OD-9). The report's test ("what can it find that `gate.mjs` cannot deterministically detect ... does it merely re-read agent-authored reports?") is INFERENCE but a sound one; the reconstruction's `evidence-auditor` had no definition. Dropping it is weakly supported.

---

# 15. Learnings / memory

**Evidence.** S17 distinguishes thread-scoped checkpoints from cross-thread stores (SOURCE FACT, a design distinction, not an outcome). S20a names structured note-taking as one long-horizon technique (VENDOR GUIDANCE). No cited source measures whether automatic memory improves coding-agent outcomes. The report is right to say so.

**Claude OD-3.** Keep EXPERIMENTAL, off by default, human-written, never to fresh roles, entries as leads with a re-check. Evidence strength for this position: low but uncontradicted, and the alternative (automatic append) has no evidence either. Claude's `discovery-cost.md` decision test (three representative runs, a named human judging that an entry changed a decision) is the right threshold. Classification: EXTERNAL EVIDENCE WEAKLY SUPPORTS the current direction; RSTACK EXPERIMENT REQUIRED for any promotion.

---

# 16. Risk / depth model

**Evidence.** None. No cited source discusses scalar risk tiers or surface-based scoping for agent review depth. NIST PW.8.2 says to "scope the testing", which is not a tiering model. The report's ablation D is its own INFERENCE.

**Claude OD-2.** Entirely an RSTACK design choice. Claude's current position (tier is depth only, never removes a state, surfaces mandatory beside it, size never raises it, ratchets up) is internally consistent and cheap. Recommendation unchanged: keep both, record per run whether tier and surface list would have selected different depths. Classification: RSTACK EXPERIMENT REQUIRED, then OWNER POLICY.

---

# 17. Metrics and experiments

**Trace-based metrics.** SUPPORTED (S38 causal trace identity; S39 "tool call trajectory ... not only the final output"). Claude's `discovery-cost.md` already inherits provenance and marks tokens `UNAVAILABLE`; `otel-trail.mjs` is the only agent-independent input. Add the report's finding-quality taxonomy (true positive, false positive, duplicate, changed plan, changed code, already caught by test, human-only) as a per-finding label in `review.md` / `plan-audit.md` post-resolution; it is the input every ablation below needs.

**Are the proposed experiments technically sensible?** Mostly. Two need changing:

- **Ablation C (drop the agent reviewer on low-risk tickets)** conflicts with Claude's invariant that state 5 always runs. Run it as an observational study first: classify every reviewer finding on LOW tickets by the taxonomy; if unique material findings are near zero over N runs, the owner decides whether to relax the invariant. Do not remove the state to measure it.
- **Ablation B (independent Tester vs developer-written tests)** needs seeded or retrospectively classified defects and a mutation score; without them "test strength" is a judgement. Run it after A, not in parallel, on the same ticket set.

**Prioritised list.**

| # | Experiment | Decides | Why first |
|---|---|---|---|
| 1 | Capture receipt: compare tester-typed `suite.txt` against `postToolUse` terminal output for the same run | OD-5 (is `OBSERVED_HOST` capture available without a wrapper) | Every eligibility predicate rests on `AGENT_REPORTED` today |
| 2 | Vacuous or missing checks found at review, per run | OD-1 | Claude's own measure; no design change needed to collect |
| 3 | Ablation A: plan auditor findings by taxonomy, cost per ticket | Plan Auditor universality | Highest-cost mandatory fresh dispatch |
| 4 | Tier vs surfaces: record both per run, note divergent depth choices | OD-2 | Observational, free |
| 5 | Ablation B: tester separation | Tester | Needs the taxonomy and defect seeding from 3 |
| 6 | `subagentStop` persistence and shape-check trial | Enforcement dependency on reply persistence | One hook, one fresh role, one run |
| 7 | Ablation E: learnings exposure | OD-3 | Last; the decision test already says "not from one run" |

---

# 18. File-by-file Claude V2 matrix

| Claude V2 file | Major design choice | External evidence | Assessment | Recommended follow-up |
|---|---|---|---|---|
| `agents/rstack-orchestrator.agent.md` | Dispatcher only; routes from artifacts; compares fields; relays questions verbatim | S7, S8, S6 (centralized control); S17 (resume semantics) | SUPPORTED | Label `agents:` list as host-enforced; add unknown-external-effect rule (via SKILL); record VS Code subagent limits in adoption record |
| `agents/rstack-planner.agent.md` | Plan before code; verbatim ticket; no self-audit; claims index for the auditor | S8 chaining with gates; S11 planner; S4 input filtering | SUPPORTED | None from evidence |
| `agents/rstack-plan-auditor.agent.md` | Fresh adversarial audit of every plan; writes nothing; five lenses | S8 evaluator-optimizer; S11 separate evaluator | SUPPORTED as role; NOT SUPPORTED as mandatory per ticket | Keep for pilot; ablation A; no file change now |
| `agents/rstack-tester.agent.md` | Only tester writes tests; RED-first; lock; amendment via human; hand capture labelled `AGENT_REPORTED` | S31 ablation; S10 locked features; S33b test adequacy | SUPPORTED WITH CHANGES | Trial `postToolUse` capture; otherwise unchanged |
| `agents/rstack-dev.agent.md` | Smallest agent; production only; never commits; stop rules | S10; S4; S20a | SUPPORTED | Drop `handoffs` if the host does not support them (already done in v2.2) |
| `agents/rstack-reviewer-architect.agent.md` | Fresh, read-only, candidate-bound; test adequacy primary; independence statement | S11, S18, S8, S33b | SUPPORTED | Record reply-persistence mechanism; `subagentStop` trial |
| `agents/rstack-approval.agent.md` | Two modes; freeze creates candidate; release re-checks eligibility by reading; one decision per action; explicit-SHA push; never merges | S42, S43, S46 (gate + authenticated human + guarded publisher) | SUPPORTED WITH CHANGES | Default to human-performed push/PR; eligibility to a script when gate source is known; add `PUBLICATION_RESULT` and UNKNOWN handling; withhold `bitbucket-mcp` until release if host allows |
| `pipeline/SKILL.md` | One state table; two predicates; single freshness rule; fresh-role allowlist; human checkpoints; no state removable | S7, S8, S42 strict mode and dismiss-stale, S43 | SUPPORTED WITH CHANGES | Add reconciliation rule for unknown external results; note HELD mapping under OD-5 (already in v2.2) |
| `references/approvals.md` | Request / authorization / record; typed names authenticate nobody; ask-rules are friction | S43, S46, S1, S14 | SUPPORTED WITH CHANGES | Mark record provenance `HUMAN_RECORDED`; make human-performed action the default absent a receipt; Bitbucket controls to adoption record |
| `references/discovery-cost.md` | Provenance inherited; `UNAVAILABLE` not estimated; OD-1 measure | S38, S39 | SUPPORTED | Add `HUMAN_RECORDED`, `OBSERVED_HOST` vs `OBSERVED_TOOL`; add finding-quality taxonomy |
| `references/estate-instructions.template.md` | Three-line floor; one writable repo; same tier as repo instructions | S23 small always-on | SUPPORTED | None |
| `references/estate-layout.md` | One writable repo per run; siblings read-only; pin/verify as detector | INFERENCE from candidate identity; S15 isolation is a container property | RSTACK-SPECIFIC / EXTERNAL EVIDENCE NOT APPLICABLE | None; honest about detector-only |
| `references/handoff-contracts.md` | Schemas only; candidate binding on evidence; nothing committed; prompts assert nothing | S4 filtered handoffs; S10 file-based state; S45 subject binding | SUPPORTED WITH CHANGES | Add `PUBLICATION_RESULT` status to `approval.md`; `sha` vs `candidate` column is a source dependency (photographs say `sha`) |
| `references/harness-map.md` | Four guarantee terms; owner index; scripts as claims | S14 deterministic boundary; S3 interception-point lesson | SUPPORTED | Add block/detect attribute per row; label host-enforced frontmatter fields |
| `references/instruction-precedence.md` | No document guarantees its precedence; prefer withheld capability over self-run script over prose; host loading observed per host | S23 (host-specific loading), S14 | SUPPORTED | None |
| `references/learnings.md` | Experimental, off, human-written, never to fresh roles | S17 store/checkpoint distinction; S20a | SUPPORTED (weak) | None until experiment E |
| `references/plan-interview.md` | Facts found, decisions asked; frontier questions; "I don't know" valid | none | RSTACK-SPECIFIC / EXTERNAL EVIDENCE NOT APPLICABLE | None |
| `references/risk-tiers.md` | Depth only; surfaces mandatory; ratchet up; size never raises | none | RSTACK-SPECIFIC / EXTERNAL EVIDENCE NOT APPLICABLE | Observational record (experiment 4) |
| `references/rstack-process.instructions.md` | 44-line global floor; external effects need a human; fetched text is data; evidence floor | S23, S18, S14, S3 | SUPPORTED | None |
| `references/team-adoption.md` | Adoption record: capabilities, guarantee level observed, external-action owners | Report §19.6 questions; S22 surface matrix | SUPPORTED WITH CHANGES | Add: hook surface availability, Bitbucket branch controls, subagent limits, whether `postToolUse` carries exit codes |
| `references/write-boundaries.md` | Two invariants; lanes; classes; exception via other role; lock semantics; "what holds each boundary" table | S1, S14, S15 (prose ≠ sandbox); S10 | SUPPORTED WITH CHANGES | Add `preToolUse` deny rows for protected paths where the surface supports it; label frontmatter `tools`/`agents` as host-enforced |

---

# 19. Claude open decisions

| OD | Question | Classification | What the evidence adds |
|---|---|---|---|
| OD-1 | Pre-implementation Test Challenge state | RSTACK EXPERIMENT REQUIRED (defer is the evidence-consistent default) | No source tests it; coordination-cost evidence (S6, S9) opposes adding a dispatch unmeasured; S33b supports test-adequacy review, which state 5 provides |
| OD-2 | Tiers vs affected surfaces | RSTACK EXPERIMENT REQUIRED, then OWNER POLICY | No external evidence either way |
| OD-3 | Learnings status | EXTERNAL EVIDENCE WEAKLY SUPPORTS A DIRECTION (experimental, off); RSTACK EXPERIMENT REQUIRED to change it | S17 design distinction; no outcome evidence |
| OD-4 | Host authorization mechanism | HOST INFORMATION REQUIRED; EXTERNAL EVIDENCE STRONGLY SUPPORTS the shape (platform event ≫ record) | S43, S46 define the target; Bitbucket equivalents unverified; human-performed action is the authenticated path available now |
| OD-5 | Real capture and gate tooling | HOST INFORMATION REQUIRED | `postToolUse` terminal result is a candidate `OBSERVED_HOST` receipt; gate `HELD` and 8-column `sha` `ac.tsv` are photographed facts, not evidence questions |
| OD-6 | Candidate identity the host can bind to | EXTERNAL EVIDENCE STRONGLY SUPPORTS A DIRECTION | Commit SHA as subject (S41, S42); tree optional; evidence outside the commit; a tool should write it (S45 builder analogy); squash-merge binding to PR head is policy (S42 merge-type rule) |
| OD-7 | Full verification before review, or scoped first | OWNER POLICY | S42 requires checks before merge, not before review; no source orders review vs full suite |
| OD-8 | Keep waiver / accepted-rung paths | OWNER POLICY; EXTERNAL EVIDENCE WEAKLY SUPPORTS keeping them as recorded human bypasses | S43: admin bypass exists by default and is a recorded act; never a pass |
| OD-9 | Drop `evidence-auditor` | EXTERNAL EVIDENCE WEAKLY SUPPORTS dropping | Report §5.9 test (INFERENCE); S6/S9 cost |
| OD-10 | Manual chat handoffs | HOST INFORMATION REQUIRED | `handoffs` unsupported on cloud agent; VS Code `send: false` is a button; never into fresh roles stands |
| OD-11 | Post-merge docs workflow | OWNER POLICY | Not addressed by any source |

---

# 20. What Claude should change next

Conceptual changes, to be applied to the **active source** (`claude-v2.2`), not to `claude-v2`; nothing is changed by this review.

1. **`pipeline/SKILL.md`** — add one rule under Human checkpoints or Loops: an external action whose result is unknown (push, PR creation, tracker write) is never retried; the run stops as `NEEDS_HUMAN` with a remote re-read. Basis: S17 idempotency on resume. (Section 7.)
2. **`references/handoff-contracts.md`** — `approval.md` gains a `Publication result` line per action: `SUCCEEDED | FAILED | UNKNOWN | PARTIAL`, with the remote object read back. Basis: same.
3. **`agents/rstack-approval.agent.md`** — make "the human performs the push and PR creation with their own credential; the agent prepares the exact commands and text" the default path, and the agent-performed action the option, until the host provides an authorization receipt. Basis: S43 and S46: authentication of the deciding human is the control, and the human's own credential is the only authenticated path available now. (Section 9.)
4. **`references/approvals.md`** — state the provenance of a RECORDED DECISION as `HUMAN_RECORDED` in those words, and add the sentence that the SCM's own branch controls, not the in-run yes, are the last line. Basis: S43.
5. **`references/harness-map.md`** and **`references/write-boundaries.md` §5** — add a block-before / detect-after attribute to every mechanism row; label agent frontmatter `tools` and `agents` as HOST-ENFORCED CAPABILITY with the VS Code wording ("ignored" if unavailable; `[]` prevents subagent use). Basis: VS Code custom-agent documentation. (Section 10.)
6. **`references/discovery-cost.md`** — extend the provenance labels with `HUMAN_RECORDED` and split `OBSERVED` into `OBSERVED_HOST` and `OBSERVED_TOOL`; add the finding-quality taxonomy as a post-resolution label. Basis: S38, S39 and the ablations in section 17.
7. **`references/team-adoption.md`** — add to the adoption record: which Copilot surface runs the pipeline; hook availability on it (CLI and cloud agent GA, VS Code preview); whether `postToolUse` output carries exit codes; whether MCP tools can be scoped per state; Bitbucket branch permissions, required reviewers and self-approval rules as observed. Basis: S20 surface matrix, S22, section 9.
8. **`agents/rstack-orchestrator.agent.md`** — one line noting that on VS Code fresh roles run as stateless subagents that cannot ask the user, so every question reaches the human through the role's reply and the orchestrator's relay. Basis: VS Code subagent documentation.
9. **Adoption-record experiments, not file changes** — the `subagentStop` persistence and shape-check trial, and the `postToolUse` capture comparison (section 12, section 17 items 1 and 6).

---

# 21. What Claude should NOT change based only on this research

1. **Do not remove or make conditional the Plan Auditor, the Tester, or state 5.** The evidence for reducing agent count is from non-software benchmarks and one 20-instance slice; the evidence for independent judgement is narrative. Neither settles RSTACK's case. Measure first (section 17).
2. **Do not add a Test Challenge state, a reviewer panel, an evidence auditor, learnings automation, numeric risk scoring, or a model-diversity router.** No source supports any of them; the coordination-cost evidence opposes unmeasured additions.
3. **Do not adopt SLSA build provenance fields into `candidate.md`.** RSTACK builds nothing; the Source track and in-toto's step model are the honest analogues, and Git's commit identity already does the work.
4. **Do not replace `role-guard.mjs` with a `preToolUse` lane hook.** Copilot's hook input does not identify the calling agent; claiming role enforcement through it would be inventing a host capability.
5. **Do not plan around machine-level policy hooks** unless RSTACK runs on Copilot CLI; they are not documented for VS Code or the cloud agent.
6. **Do not weaken the "no risk tier removes a state" invariant or the strict-freshness deviation** on the strength of this report; both are owner policies, and the report's alternatives are inference.
7. **Do not treat any GitHub environment or ruleset feature as available.** RSTACK's approval agent targets Bitbucket; the corresponding Bitbucket controls were not verified here.
8. **Do not move role method out of agent files into skills for context-cost reasons.** An agent file is already loaded on demand; the ownership model would lose its one-owner property.
9. **Do not cite the research report's numbers without the corrections in section 2.3** (180 vs 260 configurations; SWE-bench Verified vs Pro; S10 vs S11; S13 does not recommend ablation).

---

# 22. Evidence matrix

| Recommendation | Source | Source type | Direct / indirect | Evidence strength | Limitation | Claude impact |
|---|---|---|---|---|---|---|
| Bind evidence, review, authorization to an immutable commit; stale on change | S41, S42, S45, S46 | Platform docs, standards | Direct analogue | Very high | Claude's identity is agent-typed today | `candidate.md`, freshness rule: keep |
| Integrate base before final verify and review | S42 strict mode | Platform doc | Direct analogue | Very high | Claude's overlap rule is looser | State F order: keep; deviation stays owner policy |
| Human authorization is a platform event, not agent text | S43, S46 | Platform doc, standard | Direct | Very high | Bitbucket equivalents unverified | approvals, approval agent: default to human-performed action |
| Withhold release credentials until eligibility | S43 | Platform doc | Direct | Very high | Copilot per-state MCP scoping unknown | Adoption record question |
| Sandbox is the boundary; approvals are friction; detectors are audit | S1, S14, S15 | Vendor production security | Direct | High | Vendor telemetry, undisclosed methods | write-boundaries §5, approvals §3–4: already stated |
| Deterministic orchestration for a known process | S7, S8; S6 | Vendor docs, guidance; preprint | Direct (design), indirect (empirical) | Medium-high | S6 non-software; SWE slice negative for all MAS | Orchestrator, SKILL: keep; transition evaluator remains a dependency |
| Avoid parallel fan-out in the delivery chain | S9, S6 | Vendor post, preprint | Indirect | Medium-high | Coding sentence is one line of opinion | No panel by default: keep |
| Independent reviewer; agent review supplements human review | S11, S18, S8 | Narrative, vendor guidance | Direct | Medium-high | No controlled study | Reviewer: keep; human PR review stays |
| Separate test author from implementer | S31 (ablation), S10 | Preprint, narrative | Partial | Medium-low | Function-level, GPT-3.5; prompt-only lock | Tester: keep; label as policy |
| Do not add a test-challenge agent yet | S6, S9 (cost); absence of evidence | Inference | Indirect | Medium | Requires RSTACK measurement | OD-1: defer, measure |
| Plan audit conditional rather than mandatory | Report inference from S8 | Inference | Indirect | Low | No source on plan audits | OD: keep mandatory for pilot; ablation A |
| Green tests are not semantic proof | S32, S33a, S33b | Empirical benchmark audits | Direct principle | High | Benchmark pathology ≠ internal suites | Reviewer obligation 2: keep |
| Small always-on instructions; skills on demand | S23, S21, S20a | Vendor guidance, two vendors | Direct | High | No token threshold | Process instructions, SKILL: keep |
| `preToolUse` deny for protected paths and external writes | S22 | Platform doc | Direct | Very high on supported surfaces | CLI / cloud agent GA; VS Code preview; no agent identity | Hooks: REQUIRED where available |
| `subagentStop` as host-side persistence and shape check | S22 | Platform doc | Direct | High | Not yet observed on RSTACK's host | Experiment 6 |
| Host traces over model-authored logs; provenance inherited | S38, S39; S1 telemetry | Tooling docs | Direct | High | Trace storage trust | discovery-cost: extend labels |
| Reconcile unknown external effects before retry | S17 (functional-api, interrupts) | Framework docs | Direct analogue | High | Cited URL is aliased | **Add to SKILL and approval.md** |
| Long-term memory optional and separate from run state | S17, S20a | Design docs | Indirect | Low | No outcome evidence | learnings: keep experimental |
| Risk tiers | none | — | — | None | — | OD-2: RSTACK experiment |
| Re-question harness mechanisms as models change | S13 | Vendor anecdote | Direct | Low | One example; no ablation recommended | Deletion conditions in adoption record: sensible, unforced |
| Model diversity is not the independence guarantee | S11, S24 (fresh context, tool restriction) | Inference | Indirect | Medium | Diversity may still help | Reviewer independence statement: keep |

---

# 23. Final recommendation

**Should Claude V2 remain the working architecture? YES WITH CORRECTIONS.**

Why. Every conclusion in the research report that survived verification at grade A (platform mechanisms and standards) is already embodied in Claude V2: immutable candidate identity, freshness invalidation, integration before final proof, separate review and release eligibility, honest authorization provenance, no self-waiver, no agent merge, small global floor, orchestrator as dispatcher, fresh reviewer, learnings off. The report's own alignment list in its section 4.2 is confirmed, not merely restated.

The corrections are of three kinds. First, labelling: `HUMAN DECISION` reads stronger than its definition; host-enforced frontmatter fields go unlabelled; provenance labels lack `HUMAN_RECORDED`. Second, one missing rule with direct evidence: reconcile an external effect of unknown result instead of retrying it. Third, a default: the human performs the publication action with their own credential until the host proves it can authenticate a reply. None of these alters a state, a role, or an invariant.

The report's weaker claims, on multi-agent coordination, separate testing, and plan auditing, do not justify removing anything either. They justify measuring: the pipeline currently pays seven dispatches per ticket on a theory of adversarial independence that no cited study tests. Section 17's experiments are the price of keeping that theory.

Two things this review could not settle and did not invent: what containment, hooks and authorization receipts the corporate Copilot surface actually provides, and what branch controls Bitbucket offers. Until the owner supplies them, every enforcement row in Claude V2 stays exactly as honest as it is now.
