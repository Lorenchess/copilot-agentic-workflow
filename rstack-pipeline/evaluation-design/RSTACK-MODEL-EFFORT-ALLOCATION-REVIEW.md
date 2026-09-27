# RSTACK Model and Effort Allocation: Analysis and Independent Review

**Prepared:** 2026-09-27. **Status:** Research synthesis and review assignment; not an approved model change or a benchmark result.

**Repository basis:** `Lorenchess/copilot-agentic-workflow` at `cb63921ced2b21806b318db4c154187dc65e6cd2`. The active reference is `rstack-pipeline/claude-v2.2/`. Its accepted contract design is not evidence that the workplace implementation or model routing has been validated. [R0]

**Purpose:** Preserve the preceding model-allocation analysis and give Claude Code, acting as an independent agent judge, a concrete assignment to verify it, challenge it, and recommend whether model selection, reasoning effort, context handling, or workflow design should change.

No RSTACK run, model comparison, cost measurement, host probe, or workplace experiment was executed while preparing this document. Public sources were checked on the preparation date. Recheck them before relying on time-sensitive claims.

## Start here: assignment for Claude Code

Read this document and the current repository entry point. Investigate the recommendations rather than trying to agree with them. Reopen the cited primary sources, inspect the actual role contracts and available run evidence, and distinguish documented capabilities from observed workplace behavior.

Evaluate the configuration as **model + effort + host + tools + context + task**, not the model name alone. Determine which changes deserve a controlled experiment, which are unsupported, and whether an apparent model problem is actually a workflow, evidence, or tooling problem.

This first pass is analysis only. Read existing sources and approved evidence; create one review report as specified in section 11. Do not change agents, model pins, effort settings, permissions, scripts, schemas, state transitions, or original run artifacts. Do not run model trials, builds, installers, or publication operations under this assignment. Propose the smallest useful experiment and stop for human review.

This document is not an additional runtime prompt. Do not load it into every execution agent.

## 1. Authority, scope, and evidence

The existing [model-allocation trial](../MODEL-ALLOCATION-TRIAL.md) owns the selected trial and its A/B/C definitions. This analysis supplements that trial; it does not replace it, create a second configuration authority, or authorize a new allocation. [R1]

The requested candidate set is Claude Haiku 4.5, Claude Sonnet 5, Claude Opus 5, GPT-5.6 Sol, GPT-5.6 Terra, and GPT-5.6 Luna. GitHub's catalog uses **Luna**, not the earlier conversational spelling “Lune.” The catalog lists these models, but organization policy, client, and plan still determine practical access. Do not silently substitute newer models just because they appear in the catalog. [S1]

Use these distinctions in the review, without replacing the repository's existing provenance vocabulary:

| Evidence | What it establishes | What it does not establish |
|---|---|---|
| Repository contract | Intended role, allocation, permissions, and output requirements | Effective host routing or successful execution |
| Official host documentation | Documented behavior on the named surface/version | Configuration in the bank's installed environment |
| Vendor model guidance | Provider's description and tuning advice | Comparative RSTACK quality |
| Vendor benchmark | Reported performance under that benchmark's setup | Performance with RSTACK's tools, evidence, and constraints |
| Submitted run evidence | The observations actually preserved for that run | Unrecorded model identity, effort, cost, or causality |
| This document's recommendation | A reasoned hypothesis to test | A measured winner |
| Claude's judgment | An attributable semantic assessment | Ground truth or authorization |

### Read the relevant owners, not every historical design

Start with [RSTACK README](../README.md), [MODEL-ALLOCATION-TRIAL.md](../MODEL-ALLOCATION-TRIAL.md), the seven [active agents](../claude-v2.2/agents/), and the active [pipeline skill](../claude-v2.2/pipeline/SKILL.md). Follow the handoff, approvals, write-boundary, and measurement references when a conclusion depends on them.

Use the existing evaluation materials rather than restating them: [post-run workflow](RSTACK-POST-RUN-EVALUATION-WORKFLOW.md), [labeling guide](RSTACK-EVALUATION-LABELING-GUIDE.md), [calibration](RSTACK-EVALUATOR-CALIBRATION.md), [experiment registry](RSTACK-EXPERIMENT-REGISTRY.md), [host matrix](RSTACK-HOST-CAPABILITY-MATRIX.md), [artifact efficiency](RSTACK-ARTIFACT-HANDOFF-EFFICIENCY-REVIEW.md), and [governance](RSTACK-EVALUATION-GOVERNANCE.md). Read the [decision-layer audit](RSTACK-DECISION-LAYER-EFFICIENCY-AUDIT.md) when deciding whether a task needs an LLM at all.

Record the revision actually reviewed. Where the working tree differs from the reference, identify the differences before applying this analysis.

## 2. Current allocation and the proposed direction

The reference currently selects Configuration B for evaluation, not as an established optimum. Effective routing and comparative performance remain unverified. All three groups preserve the same contracts and downstream allocations. [R0][R1]

| Role | A: previous declaration | B: selected trial | C: comparison group |
|---|---|---|---|
| Orchestrator | Opus 5 | Sonnet 5 | Sonnet 5 |
| Planner | Sonnet 5 | Opus 5 | Opus 5 |
| Plan Auditor | Opus 5 | Sol 5.6 | Opus 5 |
| Tester | Sonnet 5 | Sonnet 5 | Sonnet 5 |
| Developer | Opus 5 | Opus 5 | Opus 5 |
| Reviewer-Architect | Opus 5 | Opus 5 | Opus 5 |
| Approval | Sonnet 5 | Sonnet 5 | Sonnet 5 |

**Recommendation carried forward from the analysis:** validate B against the existing comparisons first. Then investigate Sonnet 5 and Terra 5.6 for bounded Developer work. Preserve capable semantic judgment in difficult planning, proof design, and review unless an evaluated alternative performs adequately. Do not find a permanent job for every model merely because it is available.

The following are hypotheses, not installed changes:

| Role | Starting position | Useful challenger | Why this comparison matters |
|---|---|---|---|
| Orchestrator | Sonnet 5 | Terra 5.6; keep Opus baseline | Sustained state/transport fidelity may not require the most expensive reasoning model |
| Planner | Opus 5 | Sonnet 5; later Terra on narrow tasks | Better initial decisions may avoid expensive downstream corrections |
| Plan Auditor | Sol 5.6 | Opus 5 on identical plans | Test evidence-grounded defect detection, not disagreement count |
| Tester | Sonnet 5 | Opus 5 or Sol for difficult proof design | Designing proof and executing a known command have different reasoning demands |
| Developer | Retain Opus baseline during the existing trial | Sonnet 5 and Terra 5.6 | Approved scope and controlled tests may make less expensive implementation viable |
| Reviewer-Architect | Opus 5 | Sol 5.6 on the same candidate | Compare reachable defects, proof gaps, and false positives with read-only tools |
| Approval | Sonnet 5 | Terra only after safety-fixture screening | Git state, user work, identity, and external effects are high-consequence responsibilities |

## 3. Public model evidence: shortlist, not a ranking

| Model | Source-supported positioning | RSTACK hypothesis |
|---|---|---|
| Haiku 4.5 | Anthropic's fast tier; documented 200K context and manual extended thinking. [S4] | Narrow extraction/classification where independent checks can catch errors |
| Sonnet 5 | Coding and agentic work, with effort-sensitive behavior. [S5] | General-purpose execution and structured coordination |
| Opus 5 | Complex coding and long-horizon enterprise work. [S6] | Consequential semantic decisions and difficult debugging/review |
| Sol 5.6 | Flagship professional-work tier; GitHub highlights deep reasoning over codebases. [S2][S7] | Evidence-heavy audit, complex reasoning, and review |
| Terra 5.6 | Intelligence/cost balance; roughly the earlier mini tier. [S8] | Challenger for everyday coding and bounded coordination |
| Luna 5.6 | Cost-sensitive, high-volume workloads; roughly the earlier nano tier. [S9] | Bounded, checkable work with little decision authority |

### Vendor-reported benchmark observations

OpenAI reports the following results. These are not independent RSTACK measurements, and the cited comparison does not provide Opus 5 results. Do not compare Opus 4.8 results with Sol and call that a Sol-versus-Opus-5 experiment. [S10]

| Evaluation | Sol 5.6 | Terra 5.6 | Luna 5.6 |
|---|---:|---:|---:|
| DeepSWE v1.1 | 72.7% | 69.6% | 67.2% |
| Terminal-Bench 2.1 | 88.8% | 87.4% | 84.7% |
| MRCR v2, 8-needle, 256K–512K | 91.5% | 89.6% | 41.3% |

**Inference:** Terra warrants serious testing. Luna's retrieval result cautions against equating a large supported context with reliable long-session orchestration. Neither inference proves a RSTACK allocation. Before citing comparisons in a decision, inspect benchmark version, tools, effort, retries, token limits, and harness; leave unreported settings unknown.

## 4. Role-specific reasoning and evaluation cases

These responsibility summaries come from the active agent definitions whose blob identities were checked against the repository basis. The recommendations below them remain hypotheses. [R2]

### Orchestrator

The [Orchestrator](../claude-v2.2/agents/rstack-orchestrator.agent.md) routes recorded state, checks plan identities, transports replies, handles stopped invocations, and relays human questions. It is prohibited from deciding whether another role's engineering work is correct.

Keep Sonnet initially because low engineering judgment does not imply low consequence. A lightweight replacement must preserve identities and results over long runs, not merely choose the right next role in one short prompt. Test a stopped latest audit with an older successful audit present, a changed plan digest, malformed results, pending human decisions, and unknown external outcomes. Prefer deterministic comparisons where an adopted implementation already owns them.

### Planner

The [Planner](../claude-v2.2/agents/rstack-planner.agent.md) captures requirements, resolves repository scope, separates facts from human decisions, establishes falsifiable checks, and exposes load-bearing claims for audit.

Opus is a plausible investment for ambiguous or cross-module work because mistakes propagate into tests and implementation. Compare Sonnet and later Terra on explicit narrow tickets. Judge supported claims, missing requirements, negative-search overreach, and downstream repair. A larger model cannot establish an absence claim from missing search evidence. More detailed plans are not automatically better plans.

### Plan Auditor

The [Plan Auditor](../claude-v2.2/agents/rstack-plan-auditor.agent.md) independently tests ref discipline, falsifiability, provenance, citation truth, and completeness. Its terminal access does not itself enforce read-only behavior.

Sol versus Opus should be a crossed audit of the same plans. Cross-provider diversity may help, but is not a correctness or independence guarantee. Include supported clean plans, real contradictions, unsupported absence claims, missing requirements, and design preferences that should not be presented as factual refutations. Preserve legitimate uncertainty and score false positives as well as real catches.

### Tester: proof design versus verification

The [Tester](../claude-v2.2/agents/rstack-tester.agent.md) designs discriminating checks, establishes valid red evidence, controls amendments, and later captures verification against a working tree or frozen candidate.

Keep Sonnet as the initial general-purpose choice. Compare stronger settings/models for subtle concurrency, persistence, boundary, and preservation properties. Distinguish an assertion failure caused by unmet behavior from compilation, setup, or fixture failure. A known command's exit capture and hash checks belong to reliable tooling where available; deciding whether a test proves the requirement remains semantic. Compare these modes within the existing role, not by adding another permanent agent.

### Developer

The [Developer](../claude-v2.2/agents/rstack-dev.agent.md) changes production code against approved scope and controlled tests, stops on plan/test disagreement, and cannot redefine proof or declare ticket completion.

This is a promising cost experiment: compare Sonnet and Terra with Opus on matched local implementation tasks. Separate broad migrations and difficult debugging from straightforward changes. Measure effort through verification and independent review, including failed attempts. A cheaper first patch that requires extra test and review cycles may cost more overall.

### Reviewer-Architect

The [Reviewer](../claude-v2.2/agents/rstack-reviewer-architect.agent.md) judges one frozen candidate and its evidence packet. It has read/search tools, not shell/Git execution, and must disclose which identity claims come from other roles.

Keep Opus as baseline and compare Sol. Use the actual read-only packet; autonomous coding benchmarks are not a substitute. Challenge test discrimination and reachable behavior, including deleted/renamed content. Do not interpret a small diff as low semantic risk or automatically choose a different provider solely because the implementer used Opus.

### Approval: freeze, release, and recovery

The [Approval role](../claude-v2.2/agents/rstack-approval.agent.md) handles candidate preparation, user-work protection/restoration, verification of release prerequisites, and specifically authorized publication/reconciliation. It never merges a pull request.

Keep Sonnet initially; test a Terra challenger in non-publishing fixtures before considering any downshift. Include unrelated staged changes, a contaminated checkout, missing proof, changed packet hashes, an existing PR, a timed-out action that may have succeeded, and a protected stash that still needs restoration. No model replaces authorization, deterministic checks, or human ownership. Correctly stopping can be success; unnecessary stopping can be a usability defect.

### Haiku and Luna: bounded opportunities, not mandatory roles

Consider explicit metadata extraction with evidence locations, classification of delimited log entries, candidate-file discovery followed by verification, or a short summary of settled structured data. GitHub positions these models for smaller/faster work. [S2]

Do not let failed retrieval become proof of absence, a summary become raw evidence, or a small model's judgment become permission. Compare against an existing parser before adding an LLM call. No extra agent, handoff, or summarizer is justified merely by a low token price.

## 5. Reasoning effort: an independent experimental variable

### Documented API behavior is not Copilot configuration

The provider documentation describes Sonnet 5 with adaptive thinking and a `high` default, supporting lower settings for bounded work and `xhigh` for harder tasks. It warns that `low` can under-think moderately complex work and that effort names do not represent equal compute across models. [S5]

Opus 5 guidance also starts at `high` and recommends testing lower effort where quality holds. It distinguishes thinking effort from visible response length. [S6]

The Sol, Terra, and Luna API pages each list `none`, `low`, `medium` (default), `high`, `xhigh`, and `max`. [S7][S8][S9] Haiku's page describes manual extended thinking rather than the same generic effort control. [S4]

These are provider facts, not instructions to add guessed YAML fields. Establish which controls the actual Copilot surface exposes, their scope, precedence, persistence, and inheritance into subagents. Record requested and effective values separately; an unobserved mapping remains unverified.

### Proposed effort screening matrix

This table expands the preceding analysis into testable effort hypotheses. It does not change current settings. Use only settings the host demonstrably supports; otherwise mark the comparison unavailable.

| Role or mode | First comparison, after recording the actual current baseline | Deeper trial only when justified | Main failure to watch |
|---|---|---|---|
| Orchestrator / Sonnet | `high` versus `medium` | Retain higher setting if state fidelity degrades | Wrong route, altered result, stale identity |
| Planner / Opus | `high` versus `medium`, stratified by task difficulty | `xhigh` on demonstrably difficult plans | Unsupported claims, omitted scope, unnecessary planning work |
| Auditor / Sol | `medium` versus `high` | `xhigh` for difficult evidence synthesis | Missed defects, over-refutation, unjustified stops |
| Tester / Sonnet, proof design | `high` versus `medium` | Higher effort or stronger-model comparison on difficult proof | Vacuous checks, false red, missed cases |
| Tester / Sonnet, execution analysis | Current/default versus one supported lower setting | Escalate ambiguous failure diagnosis, not mechanical capture | Wrong execution classification or failure ownership |
| Developer | Within each model first: Opus/Sonnet `high` vs `medium`; Terra `medium` vs `high` | Difficult debugging cases at higher effort | Rework, regressions, boundary violations |
| Reviewer / Opus | `high` versus `medium` | `xhigh` for difficult contracts/proof | Misses, false positives, inability to substantiate a finding |
| Approval / Sonnet | `high` versus `medium` on controlled fixtures | No automatic maximal setting or authority expansion | Unsafe progression, wrong candidate, bad recovery |
| Luna, bounded task | `medium` versus `low` where exposed | Escalation should be rare and justified | Extraction errors, lost qualifiers, hallucinated metadata |
| Haiku, bounded task | Current supported configuration | Separate thinking experiment only if exposed | Incorrectly assuming unsupported effort semantics |

If the installed setting is neither arm shown, retain it as the real baseline rather than pretending the experiment starts from a default. Do not equate “regular” in a UI with `medium` in an API without evidence.

### Keep these knobs separate

Reasoning effort, visible verbosity, maximum output, context-window choice, tool permissions, and number of agents are different variables. High effort cannot recover evidence never supplied. A low output cap can truncate the required handoff rather than make it efficient. A large context window does not justify injecting every artifact.

Do not assume `ultra` is another scalar effort value: OpenAI's release describes it in terms of parallel-agent execution, while the individual model API pages list effort through `max`. Its availability and topology in Copilot require separate verification. [S10][S7]

**Proposed escalation rule for later review:** permit an authorized, bounded escalation only for a diagnosed reasoning difficulty, with the triggering evidence, old/new setting, fresh attempt, and cumulative cost recorded. Missing credentials, unreadable files, absent requirements, host errors, and unknown external effects require their proper owners, not more thinking or blind retries. The first review must propose this policy, not install it.

## 6. Pricing, context, and artifact efficiency

### Dated public Copilot price snapshot

USD per one million tokens, default tier, as shown by GitHub on 2026-09-27. These are public list rates, not measured bank charges. Cache writes are a separate category. [S3]

| Model | Input | Cached input | Cache write | Output |
|---|---:|---:|---:|---:|
| Luna 5.6 | $0.20 | $0.02 | $0.25 | $1.20 |
| Haiku 4.5 | $1.00 | $0.10 | $1.25 | $5.00 |
| Sonnet 5 | $2.00 | $0.20 | $2.50 | $10.00 |
| Terra 5.6 | $2.00 | $0.20 | $2.50 | $12.00 |
| Sol 5.6 | $4.00 | $0.40 | $5.00 | $20.00 |
| Opus 5 | $5.00 | $0.50 | $6.25 | $25.00 |

GitHub lists higher long-context rates for the OpenAI models. Its Luna threshold is 200K, whereas the Luna API page states 272K. Treat these as product-specific documented differences, not interchangeable billing rules. The launch article also shows different launch prices from current pages. Verify date, product, tier, and enterprise terms before costing a run. [S3][S9][S10]

**Arithmetic inference:** Terra is not automatically cheaper than Sonnet; Luna's listed token rates are lower than Haiku's. Neither statement proves total task cost or quality.

### How to account for cost

Prefer the host's attributable usage and billing evidence. Reconcile input, cached-read, cache-write, output/reasoning, tool, and platform categories using their documented semantics; do not double-count reasoning tokens already included in billed output or overlapping cache categories.

When only usage and public rates exist, label the result a **modeled cost**, not observed spending. When usage is incomplete, report partial cost and missing coverage. Do not estimate tokens from characters and present them as measured. Different tokenizers, caching behavior, and retry patterns prevent raw token counts from being a universal efficiency unit.

Define the primary economic diagnostic as:

```text
model_cost_per_accepted_outcome =
  all attributable model cost across included attempts, retries, failures, and stops
  / number of outcomes accepted under the preregistered task criteria
```

A zero denominator yields unavailable/undefined, not zero. Report accepted-outcome rate beside the ratio. Show human repair time, downstream rework, platform/tool costs, and post-run evaluator cost separately; combine them only under an explicit, disclosed costing model.

### Connection to the artifact problem

Opus 5 documentation notes longer visible replies and written deliverables; lowering effort does not reliably shorten visible responses. It also warns about over-verification and excessive delegation. These are vendor observations, not proof of the cause of RSTACK's artifact volume. [S6]

Test compact required outputs, evidence references, and role-owned deltas as a separate context experiment. Preserve raw evidence and independent review. A vendor suggestion to remove redundant self-verification is not authority to remove RSTACK's required controls or proof.

Persisted bytes, handoff bytes, actually consumed context, and billed tokens are distinct. A smaller handoff can trigger extra retrieval and cost more overall. Measure total consumption and result quality, not merely the outgoing packet size. A user's 80/20 artifact estimate is a hypothesis until the denominator and actual consumption are established.

## 7. Host-specific checks before model conclusions

GitHub documents one-million-token context selection for VS Code/CLI and configurable reasoning for VS Code/CLI/cloud agent. It recommends regular context and reasoning by default, increasing them for complex work. These statements do not establish equivalent IntelliJ controls. [S1]

JetBrains custom agents are documented as public preview. [S12] VS Code allows a single model or prioritized fallback list; an omitted model uses the current picker selection. Handoff buttons carry conversation context. Do not confuse them with fresh independent invocation. [S11]

For each actual surface, collect only the information necessary to attribute a trial:

| Required observation | Why it matters |
|---|---|
| IDE, extension/runtime version, policy context | Separates host differences from model differences |
| Model displayed, requested selector, resolved identity if exposed | Detects aliases, fallback, and unverified routing |
| Available effort controls, effective setting, inheritance | Prevents an effort trial whose setting never changed |
| Context setting, submitted evidence, compaction/retrieval behavior | Separates missing context from reasoning weakness |
| Tools, permissions, subagent invocation route | Establishes the actual task the model was allowed to perform |
| Usage categories, timestamps, cache observations | Establishes cost/latency coverage and limits |
| Original reply and persisted artifact | Detects transport or parser errors |

An unverified model/effort run may still reveal workflow defects, but must not be presented as proof that a particular model/effort combination won. Keep VS Code and IntelliJ as separate cohorts until comparable behavior is established. Do not assume an API feature is exposed through Copilot or that Copilot and Devspace grant the same controls.

## 8. Performance evaluation: points to inspect

Reuse the existing labeling guide and rubrics. Do not introduce a new all-purpose quality score or rewrite runtime verdicts as evaluation labels. Keep validity, materiality, duplication, resolution, and human adjudication separate, even where an existing artifact combines them; propose a mapping rather than silently changing schemas.

| Area | Main quality questions | Efficiency and reliability observations |
|---|---|---|
| Orchestrator | Correct route? Exact result/identity preserved? Correct latest-attempt handling? | Invalid transitions, malformed handoffs, restoration omissions, human repairs |
| Planner | Material claims supported? Requirements complete? Human decisions explicit? Proof routes viable? | Revisions, search overreach, unnecessary units, audit/downstream repair |
| Auditor | Real defect or preference? Evidence from the same snapshot? Known defects missed? | Confirmed findings, false findings, duplicates, unjustified stops, audit rounds |
| Tester | Tests discriminate? Red is genuine? Failures attributed correctly? Candidate proof current? | False-red defects, amendments, missed tests, extra execution, proof gaps |
| Developer | Required behavior implemented without redefining proof? Regression introduced? | First-attempt acceptance, correction loops, unnecessary changes, boundary violations |
| Reviewer | Reachable defect/proof gap? Candidate and evidence aligned? | Validated catches, known misses, false positives, needless rework |
| Approval | Exact candidate/action authorized and verified? User work protected? Unknown outcome reconciled? | Unsafe advances, duplicate effects, stale authorization, correct versus unnecessary stops |
| Whole run | Agreed task completed, blocked correctly, or failed? | Total cost, elapsed time, human repair, interruptions, incomplete outcomes |

### Metric definitions and denominator discipline

| Metric | Definition / caution |
|---|---|
| Material claim correction rate | Material claims adjudicated unsupported/contradicted divided by material claims adjudicated; report unresolved and unreviewed counts separately |
| Finding precision | Confirmed true-positive findings divided by adjudicated true-positive plus false-positive findings under a stated inclusion policy |
| False-discovery proportion | False positives divided by true positives plus false positives; do not call this classical false-positive rate |
| Clean-case false-alarm rate | Known-clean cases receiving an unjustified defect verdict divided by evaluated known-clean cases |
| Known-defect detection | Human-validated seeded/known defects detected divided by defects in that defined set; not recall over all possible defects |
| Contract conformance | Applicable valid outputs divided by attempts requiring that contract; preserve failed attempts and correct stopped-result cases |
| Accepted-outcome rate | Independently accepted task outcomes divided by included tasks; report failed, aborted, correctly blocked, and incomplete outcomes |
| Rework burden | Count/time of attributable correction attempts; separate changed requirements, environment problems, and pipeline/model mistakes |
| Latency | End-to-end and per-phase median plus tail summary when sample permits; separate human wait and tool execution where observed |
| Resource use | Attributable input/output/cache/reasoning usage and billed or modeled cost, each with coverage and provenance |
| Information efficiency | Persisted bytes, duplicated content, handoff bytes, extra retrieval, and truncation; pair reductions with audit sufficiency |
| Observation coverage | Measured/attributable values divided by expected values; missing data must remain visible |

A narrow search with no match supports a scoped negative result, not universal absence. A planning revision does not prove the Auditor was right. Green tests do not establish every requirement. Fewer findings can mean either better input or weaker detection.

Keep provenance through derivation: a script parsing agent-written timestamps does not make them host-observed. Reuse `OBSERVED_HOST`, `OBSERVED_TOOL`, `AGENT_REPORTED`, `HUMAN_RECORDED`, and the other current labels as actually defined by the measurement owner.

### Anti-metrics

Never optimize alone for fewer tokens, shorter prompts, smaller diffs, more findings, fewer findings, fewer human questions, or higher judge scores. Pair savings with accepted outcomes, false alarms, missed defects, recovery behavior, and human repair. Necessary human decisions and correct uncertainty are not failures.

## 9. Experiment sequence: small and attributable

**Stage 0 — inspect and establish conformance.** Review the existing A/B/C trial; establish actual model/effort selection, parser compatibility, tools, and result persistence before scoring quality. Do not build a new harness merely to make this document executable. Missing prerequisites are findings.

**Stage 1 — complete the existing Planner/Auditor screening.** The trial proposes six representative tickets, a Sonnet and Opus plan for each (12 plans), then an Opus and Sol audit of each identical plan (24 audits), plus separately scored known defects and clean controls. Preserve that design, its human-answer fixtures, and its fixed downstream roles. Six tasks are screening, not a reliability guarantee. [R1]

**Stage 2 — effort sweeps within a fixed model.** Select a small representative subset. Compare the real baseline with one supported adjacent effort setting, keeping source, role prompt, tools, context policy, and evaluator fixed. Repeat difficult/close cases. Do not test every model at every effort immediately.

**Stage 3 — bounded Developer challengers.** Compare Sonnet and Terra against the Opus baseline on the same approved plan, controlled tests, repository snapshot, and acceptance process. Cost the full repair chain, not just code generation. Keep harder migration/debugging tasks separately visible.

**Stage 4 — context/verbosity treatment.** Compare current versus compact handoffs within the same model/effort. Preserve evidence access and output requirements. Track extra reads, truncation, clarification, and post-run audit sufficiency.

**Stage 5 — end-to-end confirmation.** Evaluate the promising configuration as a whole, including stopped/failed attempts. Only then recommend a limited rollout and rollback criteria. A component win is not automatically a pipeline win.

### Controls for meaningful comparisons

Freeze task/repository/requirement snapshots, contract versions, tool access, human-answer fixtures, and adjudication criteria. Randomize run order; blind model attribution and rotate answer order for pairwise judging. Keep natural and seeded defects separate. Preserve clean controls and held-out tasks.

Initially use the same role prompt to measure a drop-in model substitution. Model-specific prompting can be a later configuration experiment, but label that as model-plus-prompt rather than a pure model win.

Report paired task-level results, sample sizes, unresolved cases, and uncertainty. Repeated trials of one ticket are not independent tickets; avoid treating all correlated claims or findings as independent samples. Report confidence intervals when justified and do not force a winner from a small or biased sample.

Equal effort labels are not equal budgets. Distinguish an operational-default comparison from an explicitly budget-matched comparison, and state which question is being answered. Record caching/order effects rather than assuming all runs start equally warm.

Any experiment involving state mutations must be separately authorized and isolated. Use synthetic/non-publishing fixtures for approval and external-action cases. Never duplicate a real PR, push, ticket mutation, or deployment to obtain a comparison.

## 10. Claude as independent post-run judge

Copilot/RSTACK creates execution evidence. Claude evaluates a frozen submitted run afterward and owns only the evaluation outputs. The [post-run workflow](RSTACK-POST-RUN-EVALUATION-WORKFLOW.md) remains the authority for collection and immutability.

For a later authorized evaluation, retain the original run unchanged and write a distinct evaluation attempt inside its approved `evaluation/` area. Re-evaluation must not overwrite earlier judgments. Keep analysis used to improve future runs out of the execution context of the run being judged.

Claude should not prefer Anthropic outputs because it is Claude, nor accept this document because another assistant authored it. Use evidence-linked categorical judgments and human-reviewed calibration cases. OpenAI's evaluation guidance warns about position and verbosity biases and recommends task-specific evaluation calibrated with human judgments. [S13]

Measure the judge as well as the candidates. Preserve its model/configuration, rubric, evidence coverage, errors, abstentions, and later human corrections. Do not let a candidate Auditor be the sole adjudicator of its own findings. Use a second approved judge selectively for disagreement, not as a mandatory cost on every finding. Neither majority vote nor high self-reported confidence establishes truth.

Incomplete submissions still deserve an evaluation of what can be established. Do not infer missing phases, model identities, effort levels, or billing from desired configuration. No hidden chain-of-thought needs to be collected; preserve observable actions, outputs, concise rationales, and evidence references.

## 11. Required independent review and one deliverable

### Questions Claude must answer

1. Does the current source still select B? What is declared versus observed in the installed environment?
2. Do these recommendations match each role's real responsibilities and allowed tools? Where do they overstate reasoning needs or underestimate operational risk?
3. Which cited public claims remain supported, have changed, conflict across products, or are too weak to guide a decision?
4. Which model/effort options can actually be selected per role on VS Code and IntelliJ? Does the selection survive subagent dispatch or fallback?
5. Could an existing deterministic mechanism perform the work instead of any LLM? Is a proposed extra model call adding more overhead than value?
6. Is the cost problem model selection, reasoning effort, repeated artifacts, retrieval, tools, context compaction, or workflow retries? What evidence distinguishes these causes?
7. Which smallest experiment can resolve the highest-value uncertainty without changing multiple major variables?
8. What exact results would support retaining, changing, or rejecting an allocation? What safety failures stop the trial?
9. Can the existing per-run evaluation design capture the necessary evidence without new competing schemas or excessive artifact growth?
10. What remains impossible to determine from the available source/run package? Do not substitute a plausible answer.

### Write one report, not another documentation suite

Create `rstack-pipeline/reviews/<YYYY-MM-DD>-model-effort-allocation-review.md`, using the actual review date. If the path already exists, preserve it and choose a distinct review suffix. If the report contains workplace evidence, write it only in an approved internal location instead; do not publish internal data to this public repository.

Use these sections:

- **Verdict and basis:** source revision, host evidence, sources verified, what was not run.
- **Claim audit:** material claim, source/anchor, status, correction, impact on recommendation.
- **Role/mode matrix:** current versus proposed model, effective/current effort, proposed effort comparison, host support, expected benefit, principal risk, confidence and evidence.
- **Performance evaluation:** metrics with denominators, raw evidence required, existing artifact mapping, missing telemetry, judge-calibration plan.
- **Experiment and rollback:** smallest next study, frozen controls, estimated study size clearly labeled as a plan, acceptance criteria to agree before execution, stop/rollback conditions.
- **Workflow implications:** separate model changes from effort changes, context/prompt changes, deterministic tooling, and authority/policy changes. Name exact affected owners only as proposals.
- **Decision table:** `KEEP`, `EXPERIMENT`, `REJECT`, or `UNAVAILABLE`, with evidence and the next owner. `KEEP` is not permission to install a change.

Use the existing labeling guide where possible. For the claim audit, distinguish supported source facts from hypotheses requiring a trial. “Vendor recommends” is a valid source finding, but not confirmation that the recommendation improves RSTACK.

### Write and action boundary

Only the new review report is authorized by this assignment. Do not edit this source analysis, the selected trial, runtime agent files, settings, permissions, scripts, evaluator rubrics, or original run evidence. Do not commit, push, create a PR, install a model, or execute a benchmark unless separately authorized. Record proposed changes and stop.

The strongest outcome may be “retain the current allocation; investigate context waste first.” Agreement, disagreement, and insufficient evidence are all acceptable when substantiated.

## 12. Source catalog and reproducibility

Public pages below were reopened on **2026-09-27**. These links are live and may change; a later reviewer must record its own access date and relevant section or short excerpt. Repository links below pin the inspected basis. Relative links elsewhere intentionally point reviewers to current owners.

| ID | Primary source | Use in this analysis |
|---|---|---|
| S1 | [GitHub: Supported AI models](https://docs.github.com/en/copilot/reference/ai-models/supported-models) | Catalog, naming, availability conditions, extended controls |
| S2 | [GitHub: AI model comparison](https://docs.github.com/en/copilot/reference/ai-models/model-comparison) | Host's model positioning; not a RSTACK ranking |
| S3 | [GitHub: Models and pricing](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing) | Dated Copilot list rates, caches, context tiers |
| S4 | [Anthropic: Haiku 4.5 overview](https://platform.claude.com/docs/en/models/haiku-4-5/overview) | Context, positioning, thinking/effort distinction |
| S5 | [Anthropic: Prompting Sonnet 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5) | Coding, effort behavior, tuning cautions |
| S6 | [Anthropic: Prompting Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) | Complex work, lower-effort trials, verbosity/delegation cautions |
| S7 | [OpenAI: GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol) | Model tier and supported API effort |
| S8 | [OpenAI: GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra) | Model tier and supported API effort |
| S9 | [OpenAI: GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) | Model tier, API effort, API billing threshold |
| S10 | [OpenAI: GPT-5.6 release](https://openai.com/index/gpt-5-6/) | Vendor benchmarks, launch-price context, ultra topology |
| S11 | [VS Code: Custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents) | Model selection/fallback and context-carrying handoffs |
| S12 | [GitHub: Custom agents configuration](https://docs.github.com/en/copilot/reference/custom-agents-configuration) | Surface-specific configuration and JetBrains preview status |
| S13 | [OpenAI: Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices) | Task-specific evals, judge bias, human calibration |
| R0 | [RSTACK entry point at inspected revision](https://github.com/Lorenchess/copilot-agentic-workflow/blob/cb63921ced2b21806b318db4c154187dc65e6cd2/rstack-pipeline/README.md) | Active source, selected B, reference-only acceptance |
| R1 | [Existing trial at inspected revision](https://github.com/Lorenchess/copilot-agentic-workflow/blob/cb63921ced2b21806b318db4c154187dc65e6cd2/rstack-pipeline/MODEL-ALLOCATION-TRIAL.md) | A/B/C ownership, fixed downstream roles, study design |
| R2 | [Seven agent definitions at inspected revision](https://github.com/Lorenchess/copilot-agentic-workflow/tree/cb63921ced2b21806b318db4c154187dc65e6cd2/rstack-pipeline/claude-v2.2/agents) | Actual declared responsibilities, tools, and model pins |

**Final decision principle:** choose the least expensive configuration that preserves the required engineering outcome and control boundaries, counting downstream repair and human effort. Do not confuse a plausible allocation with a demonstrated improvement.
