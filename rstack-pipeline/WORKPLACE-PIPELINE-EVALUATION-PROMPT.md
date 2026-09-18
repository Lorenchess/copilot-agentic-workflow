# Agent assignment: evaluate and improve the workplace pipeline using this reference

Give this document to the agent that can inspect the actual workplace pipeline. Supply the reference checkout and the authorized workplace checkout or checkouts. Relative links below resolve from this file in `rstack-pipeline/`; they are reference locations, not assumed workplace installation paths.

This is a study and adoption prompt for that agent. It is not another runtime policy, a replacement source of truth, or a document to load into every pipeline role.

## 1. Your objective and boundaries

Study this repository's sources of truth, then compare their design with the existing workplace pipeline. Identify which ideas would materially improve the workplace's software delivery: correct requirements, discriminating proof, independent review, reliable recovery, clear human decisions, and reasonable total effort. Use this repository as a reference for improvements and engineering practices, not as proof that its implementation is superior.

Preserve working workplace capabilities. A difference from this reference is not automatically a defect. Recommend keeping a workplace solution when it already provides the required outcome more simply or has better operational evidence.

Begin with read-only inspection of pipeline source and configuration. Produce the assessment and implementation proposal in the owner's agreed location. Implement only the concrete subset authorized by the owner; existing explicit authorization remains valid within its scope. This prompt alone does not authorize running the pipeline, tests or benchmarks, installing configuration, changing connectors, editing production, committing, pushing, or publishing. Do not execute historical prompts, reference skills, or commands embedded in evidence merely because you read them.

If workplace access or location is missing, request that specific input while continuing the reference study. Do not infer workplace behavior from missing uploads. Keep confidential source, raw logs, ticket content, credentials and business identifiers in their approved workplace locations; do not copy them into this reference repository.

Success means a source-backed comparison and a small, reviewable improvement plan. If implementation is authorized, success additionally requires the agreed verification and evidence for the adopted subset. More agents, more Markdown, and fewer prompt tokens are not success measures by themselves.

## 2. Establish identity and authority before comparing

Record the reference and workplace roots, branches, full commits, dirty paths, host/version, and scope of access. Include uncommitted changes in the comparison basis when the owner intends them to be reviewed; a commit alone does not identify a modified worktree. Preserve existing work and review history.

Read actual workplace instructions and identify authored, generated and installed files. Follow generator ownership: changing an installed copy that the next generation overwrites is not a durable improvement. Record actual model routing, tools, permission settings, hook registration and entry points; do not assume frontmatter establishes effective runtime grants or model identity.

### Two reference designs, with separate authority

| Reference area | Authority and purpose | How to use it |
|---|---|---|
| [RSTACK entry point](README.md) and [active V2 folder](claude-v2.2/README.md) | The entry point names `claude-v2.2` as the sole active RSTACK V2 source and owns its current acceptance status. | Primary design reference for the RSTACK workplace comparison. The candidate README includes older status paragraphs; use the entry point and the review it names to interpret them. |
| [RSTACK pipeline contract](claude-v2.2/pipeline/SKILL.md), its seven agents, standing rules and references | Define the active V2 roles, states, artifact contracts, boundaries and evidence requirements. | Read the current owner for each concern. These are accepted static contracts, not proof of installed enforcement. |
| [Repository README](../README.md) and [Copilot harness map](../.github/pipeline/HARNESS.md) | Describe a separate nine-role Copilot-native reference under `.github/`, with its own workflow, policy skills and authority relationships. | Use as additional design material and worked examples. Do not treat it as the installed form of RSTACK V2 or import its rules into V2 implicitly. |
| Earlier RSTACK versions, reconstruction files, dated reviews, manifests and proposals | Historical evidence, rationale and prior snapshots. | Consult only when a question requires history. Do not combine superseded procedures into a new operating contract. |
| Actual workplace source, host configuration and observed runs | Evidence of what the workplace currently specifies, permits and does. | Primary evidence for workplace findings. Reference limitations do not establish workplace limitations. |

Do not use "newest file wins" as an authority rule. The Copilot harness map explicitly identifies historical contract clauses that remain normative for its policy skills. Resolve a conflict using that design's stated ownership and approved amendments; surface an unresolved contradiction rather than silently choosing.

At preparation, RSTACK V2 is accepted as a refactoring reference, with R22 and C22 contract findings closed. Workplace validation and R1-R7 runtime work remain pending. Re-read the entry point on arrival because status can change. Historical hashes and byte-preservation claims describe their recorded snapshots; later naming or documentation edits do not inherit those hash identities. Record the actual bytes you evaluate.

### Read in layers

1. **Orient:** the two entry points above and the [existing workplace refactor guide](WORKPLACE-REFACTOR-AGENT.md). Establish which design you are comparing and which workplace problem you are solving.
2. **Understand RSTACK's operating contract:** [pipeline](claude-v2.2/pipeline/SKILL.md), [standing rules](claude-v2.2/rules/standing-rules.instructions.md), relevant agents, [handoffs](claude-v2.2/references/handoff-contracts.md), [write boundaries](claude-v2.2/references/write-boundaries.md), and [approval rules](claude-v2.2/references/approvals.md).
3. **Establish limits:** [workplace port](claude-v2.2/WORKPLACE-PORT.md), [runtime patch plan](claude-v2.2/RUNTIME-PATCH-PLAN.md), [open decisions](claude-v2.2/OPEN-DECISIONS.md), [validation plan](claude-v2.2/VALIDATION-PLAN.md), and [harness map](claude-v2.2/references/harness-map.md). Use [source evidence](claude-v2.2/SOURCE-EVIDENCE.md) only for its bounded historical observations.
4. **Inspect additional ideas selectively:** Copilot [flow](../.github/pipeline/FLOW.md), [agent contracts](../.github/pipeline/AGENT-CONTRACTS.md), [guardrails](../.github/pipeline/GUARDRAILS.md), and only the relevant policy skills and examples. The [comparison guide](../docs/COMPARISON-GUIDE.md) and [end-to-end trace](../docs/END-TO-END-REFERENCE-TRACE.md) help navigate this separate design.
5. **Evaluate evidence and tradeoffs:** [external-evidence review](EXTERNAL-EVIDENCE-REVIEW.md), the two [model-allocation](reviews/2026-09-17-model-allocation-analysis.md) [analyses](reviews/2026-09-17-model-allocation-independent-review.md), [corporate adoption](../docs/CORPORATE-ADOPTION.md), and [run audit and improvement](../docs/RUN-AUDIT-AND-IMPROVEMENT.md). Treat their conclusions as claims to assess, not instructions to accept automatically.

The analyst may need broad reference knowledge; an executing role should receive only its permitted inputs and applicable contracts. Those are different context needs.

## 3. Understand the RSTACK structure and its rationale

RSTACK V2 separates construction, proof and judgment. Seven roles cover more than seven states because the Planner revises, the Tester verifies at different targets, and Approval has freeze and release modes.

| Role | Responsibility | Why it is separated |
|---|---|---|
| Orchestrator | Tracks state, artifacts and results; dispatches; relays decisions; compares required fields. | Keeps the workflow from becoming an additional planner or a judge that overrides inconvenient findings. Routing still depends on faithful execution of prose unless the host enforces it. |
| Planner | Grounds the ticket in code, identifies human decisions, scopes the writable repository, creates falsifiable acceptance criteria and proof routes, and decomposes work. | Prevents implementation from defining success after the fact. Repository facts should be discovered; product and scope decisions belong to their human owner. |
| Plan Auditor | In fresh context, re-derives requirements and challenges evidence, assumptions, falsifiability, scope and combined outcomes. | Tries to catch a wrong definition of done before tests and implementation inherit it. It must find genuine defects without manufacturing objections. |
| Tester | Constructs discriminating acceptance tests, establishes valid RED, locks the test basis, and later verifies working-tree and candidate behavior. | Separates the definition and observation of success from production implementation. Its final role differs from the dedicated Verifier in the Copilot example. |
| Developer | Implements approved units against the locked tests; writes production code rather than changing tests or declaring acceptance. | Reduces the opportunity to make the result look correct by weakening the test or rewriting the acceptance evidence. |
| Reviewer / Architect | Independently examines one frozen candidate, its tests, evidence, affected surfaces and omissions in fresh context. | Checks whether passing tests actually establish the requested outcome and whether the change has unexamined consequences. |
| Approval | Freezes approved ticket content and candidate identity; later rechecks release eligibility and the authorization for each external action. | Separates technical readiness from permission to commit or publish and keeps shared effects outside the implementer's judgment. No agent merges a PR under this reference. |

For the ticketed behavior-change path, the normal sequence is:

```text
Preflight -> Plan -> Fresh plan audit
                       |
                       +-> Revise -> Fresh audit again, when required
             -> RED and lock -> Implement -> Verify WORKTREE
             -> Freeze candidate -> Verify candidate
             -> Fresh review -> Release evaluation -> Authorized external actions
```

The pipeline's routing table owns exceptions and recovery. Do not implement this diagram as an alternative specification. Investigation, documentation and behavior-preserving modes have their own playbooks; do not invent failing tests for prose edits.

Key reasons behind the structure:

- **One routing owner:** roles report results; they do not independently dispatch the next role or redefine eligibility.
- **Named artifact ownership:** a plan, proof record and review have known producers and consumers. Changing a schema requires checking every consumer, not just editing the template.
- **Proof before completion:** a green suite proves only what it exercised and asserted. A valid RED must fail at the intended assertion, not because compilation, setup or infrastructure failed.
- **Candidate identity and freshness:** working-tree feedback is useful, but final proof must identify the committed execution inputs, plan, lock and proof configuration. New relied-on evidence can invalidate review even when the source SHA stays the same.
- **Independent challenge:** the Auditor and Reviewer receive fresh, bounded contexts. A persuasive author summary is not independent evidence.
- **Explicit authority:** review eligibility, release eligibility, and permission for an external action are different decisions.
- **Recovery without invented success:** missing output and unknown external outcomes remain unresolved until reconciled. An intent without a result is not permission to retry.
- **Bounded discovery and writable scope:** dependent repositories may need inspection while only the selected repository is writable. Risk depth follows affected surfaces, not the number of changed lines.

These are reference design choices with costs. Mandatory audit and review add work; separation adds dispatches and artifacts; immutable evidence adds storage and handling. Measure their useful findings and operational benefit. Do not claim that seven roles or a particular proof rung is universally optimal. A proposed departure from an adopted invariant must be explicit, justified and authorized; do not silently remove a state as "simplification."

## 4. Do not merge similar-looking contracts

The separate `.github` reference has nine roles: Pipeline, Intake, Workspace, Planner, Adversary, Tester, Developer, Verifier and PR. Its flow has stages 0-10, a test-review stage 5b, explicit human gates and its own run artifacts. It offers useful examples of intake provenance, test-contract critique, obligations-first verification, and publication recovery.

Map responsibilities and guarantees, not role names or file counts. In particular:

- RSTACK's gate `HELD` means unaccepted inferred evidence; the Copilot flow also uses `HELD` for unresolved execution. They are not interchangeable states.
- RSTACK assigns final verification to Tester; the Copilot example has a separate Verifier. Do not add both just because both appear in this repository.
- The Copilot example includes multi-repository handling; RSTACK's selected active repository is the writable boundary. Confirm the workplace's actual scope policy.
- The Copilot test-review mode is not evidence that RSTACK must add a test-review agent. RSTACK records the extra test-audit decision as deferred; investigate whether the workplace has a demonstrated gap first.
- Different result vocabularies, AC formats, failure semantics and authorization records need explicit mapping. Similar Markdown headings do not establish parser compatibility.

Preserve working Jira, Bitbucket, CI and repository integration. Do not rebuild a connector because this reference could not validate the corporate environment.

## 5. Inspect the workplace and build an evidence-based comparison

Start with authorized source and configuration reads. Locate actual role definitions, entry points, shared policies, artifact writers/readers, generators/installers, model routing, test and gate scripts, locks, permissions, hooks and recovery procedures. Use relevant existing sanitized run evidence when available; access to a repository does not automatically authorize querying every connected system.

For each material claim, separate:

| Evidence class | What it establishes |
|---|---|
| Source fact | The named revision contains a particular rule or implementation. |
| Observed execution | An attributable invocation produced a retained result at a specified revision and environment. |
| Host observation | A permission, tool grant, model identity or context-loading behavior was actually observed. |
| Owner policy | A human chose a tradeoff; this is not an empirical superiority claim. |
| External guidance or benchmark | A cited source recommends or measures something under its own conditions. |
| Inference / unknown | A reasoned expectation or a missing fact, clearly identified as such. |

A Markdown rule does not prove enforcement. A file-read trace does not prove execution. A model's report of its own context or identity does not establish host behavior. Missing measurements remain unavailable, never zero; genuinely observed zeros remain zero. Use the workplace's actual status vocabulary and map it explicitly to the reference's meanings.

Build one comparison table, extending the team's existing assessment format if it already serves this purpose:

| Concern | Reference owner and rationale | Workplace source or observation | Assessment | Smallest useful change | Evidence needed | Cost / risk / priority |
|---|---|---|---|---|---|---|
| Example: a stopped plan audit | RSTACK pipeline, Auditor and handoff contracts prevent fallback to an earlier completed verdict | Cite the actual dispatcher/parser and a relevant trace, or mark unavailable | Equivalent / stronger / confirmed gap / intentional difference / unverified / not applicable | A named existing producer or consumer, if a gap is established | One focused recovery case using the real result format | Explain consequence and tradeoff |

Cover the concerns relevant to the workplace: requirement provenance; scope and human decisions; plan challenge; test discrimination and integrity; implementation boundaries; complete verification; candidate/evidence freshness; review independence; authorization and publication; unknown outcomes; role attribution; model/tool/context behavior; instruction ownership; and total effort.

Every proposed improvement must name a concrete failure mode or measurable opportunity, its evidence, the existing owner, exact affected sources and consumers, the smaller alternative considered, and the proof that would justify adoption. Include what should remain unchanged. Do not issue a generic best-practices checklist as a finding list.

## 6. Investigate known adoption limits without assuming they exist at work

Use the current port, open-decision and validation documents for details. Important leads include:

- **R1-R3:** release-quality capture checks on waived suites; `proceedable` and acceptance classification; candidate-bound, complete accounting of suite waivers. Reference release exceptions remain disabled until the required policy and evidence conditions are met.
- **R4:** preserve AC format compatibility and correct claims about what the actual checker accepts. A prose waiver does not make unsupported evidence pass a CLI.
- **R5-R6:** distinguish working-tree feedback from committed candidate inputs, and establish actual execution of locked checks.
- **R7:** locate the real support scripts, parsers, guards, invocation wiring and host controls before proposing runtime changes.
- **OD-14, OD-15, OD-20:** protected user-work restoration; parser compatibility with fresh-role result envelopes; which gate evaluation release relies on and whether changed acceptance inputs invalidate the packet.
- **Second-checkout verification:** the reference leaves this route source-blocked. Do not invent root flags or assume artifact paths work across checkouts.
- **Reported old-run cases:** unsupported audit finding identifiers must not parse as zero findings and success; a role must not be blamed solely because a file was already dirty; a passing module does not establish a passing full build; lack of a base delta does not prove a failure is pre-existing. These are investigation leads, not current workplace diagnoses.

Do not treat historical photo evidence as complete source, optional telemetry as mandatory proof, or an unverified reference dependency as an absent workplace component. Reuse existing focused fixtures when checks are authorized; do not construct a new testing framework simply to demonstrate the reference.

## 7. Keep Markdown instructions clear and proportionate

Instruction quality depends on correct ownership, specificity and usable context, not the accumulation of warnings. Audit the effective instruction bundle per role and mode, including host-injected content and generated copies where observable.

The RSTACK ownership pattern is useful to compare:

| Layer | What belongs there |
|---|---|
| Bootstrap or session reminder | A compact minimum and pointers to canonical rules; actual discovery/loading must be established. |
| Standing rules | Universal evidence, trust and human-control requirements. |
| Pipeline contract | State transitions, freshness, eligibility and recovery ownership. |
| Role definition | Purpose, permitted inputs, write lane, procedure, output and stop/return conditions. |
| Focused reference or skill | Detailed schemas, proof recipes, discovery technique and specialized procedures, read when applicable. |
| Maintainer and historical material | Rationale, investigations, decisions, change records and reviews; not an always-loaded instruction bundle. |

Apply these principles to existing workplace files before proposing more files:

1. **One owner per rule.** Link to it from other consumers. Distinguish an intentional short reminder from a second, subtly different procedure. Preserve a necessary delivered copy until the real loader/generator is understood.
2. **State observable conditions.** Replace vague advice such as "be careful with stale evidence" with the affected identity, the comparison, the owner and the action when it fails.
3. **Keep decision types distinct.** A fact is discovered, a human decision is requested, and a proof obligation is executed only when authorized. Do not ask the human to do routine source discovery or silently decide product scope.
4. **Specify the boundary of an exception.** State what remains mandatory, who can choose it, and what evidence is required. Do not let an exception convert unknown or failed evidence into a pass.
5. **Keep examples subordinate.** A worked example illustrates the rule; it must not silently create new permission or override a parser-owned schema.
6. **Remove contradiction before adding emphasis.** Repeating MUST in five files does not fix two incompatible transitions. Do not add a new blanket rule to repair a narrow wording defect.
7. **Match the claim to the mechanism.** A prose prohibition is not a sandbox; a self-run guard is not automatically independent enforcement. Inspect existing host controls before recommending new infrastructure.
8. **Measure reduction as well as addition.** For each added instruction, identify what behavior it should improve, what existing text it supersedes, and whether the extra context is justified. A shorter file that loses a stop condition is not an improvement.

An illustrative role-contract skeleton for analysis, not a new required schema:

```text
Purpose: one outcome this role owns.
Inputs: the exact current artifacts and source scope needed.
Lane: what it may read, write and invoke; where enforcement actually lives.
Procedure: the shortest complete sequence for this role and mode.
Output: the existing consumer's required structure and evidence identities.
Uncertainty: how missing input, failed execution and blocked decisions differ.
Return: the permitted next result; the role does not invent its own route.
Policy references: links to the applicable canonical owners.
```

Do not copy this entire evaluation prompt into agent definitions. The evaluator's research context is much broader than an executing agent's permitted context.

## 8. Evaluate model assignments and model-sensitive instructions

Record actual host routing before drawing conclusions. On 2026-09-18, the owner selected Configuration B for the RSTACK V2 trial: Sonnet 5 Orchestrator, Opus 5 Planner, and GPT-5.6 Sol Plan Auditor. Those three candidate model fields are updated. Developer and Reviewer remain Opus 5; Tester and Approval remain Sonnet 5. The separate Copilot example retains its Sonnet baseline with omitted model pins. Neither declaration proves what the workplace runs.

**TEST THE ALTERNATIVE:** follow the [model-allocation trial handoff](MODEL-ALLOCATION-TRIAL.md) for the analysis, comparison groups, host/conformance prerequisites, measurements and decision criteria. The owner has authorized the candidate configuration change; comparative evaluation and workplace validation remain pending. Preserve the dated analyses as historical reasoning. Do not treat the selected trial as a demonstrated improvement or mix model experiments with unrelated workplace changes.

| Role demand | What to evaluate in the actual model and host |
|---|---|
| Orchestration and approval | Long-run state fidelity, exact identities and schemas, tool discipline, recovery, and resistance to unauthorized advancement. Low engineering judgment does not mean low consequence. |
| Planning and test design | Requirement interpretation, repository grounding, scope, falsifiable outcomes, meaningful assertions and proof-route selection. |
| Production implementation | Correctness, local conventions, constrained edits, preservation of test meaning and honest execution reporting. |
| Auditing and review | Independent requirement derivation, counterexamples, repository reasoning, material missed defects and false positives. |

Keep the logical contract stable across models. Adapt presentation and tool syntax only when the host or measured behavior requires it. Use direct instructions, explicit inputs, consistent terms, clear condition/action pairs, and exact return formats. A more capable model still needs a clear boundary; a cheaper model should not be compensated for with pages of repeated prohibitions or weaker acceptance rules.

Check how each model handles unavailable evidence, contradictory inputs, truncation, malformed tool results and interrupted execution. Record the effective reasoning setting, context assembly and tool grants. Do not assume similarly named effort settings across providers are equivalent or that maximum context capacity means reliable use of all supplied information.

Distinguish fresh-context independence, a different evaluation lens, and model-family diversity. The first two are structural requirements of the RSTACK audit/review design. A different family may add useful error diversity, but it can also create contract disagreements and false positives. More disagreement is not automatically better review.

Use current official documentation for any new claims about supported host features or model capabilities; separate vendor guidance, benchmark conditions, observed workplace behavior and inference. Do not select a model by marketing rank or token price alone. Compare total accepted-result cost, latency, retries, material misses, false positives and human correction effort.

## 9. Resist over-engineering

Before adding an agent, gate, artifact, instruction file, hook, service or store, answer:

- What observed problem does it solve, and how often does that problem matter?
- Can an existing role, artifact, parser or host control solve it with a smaller change?
- Who owns it, who consumes it, and how is obsolete or conflicting information retired?
- What new failure, maintenance, context and recovery burden does it introduce?
- What authorized observation would show it helped enough to keep?

Do not add another reviewer to compensate for ambiguous review criteria, another status file to compensate for unclear artifact ownership, or a new orchestration layer to compensate for an incorrect transition. A parser defect needs a parser/producer correction; a permission gap needs an appropriate control, not simply another paragraph telling the model to comply.

Do not default to automatic model routers, numeric risk scoring, vector databases, knowledge graphs, autonomous curators, telemetry requirements, wrapper CLIs or new schema registries. They need demonstrated requirements and explicit scope. Existing workplace infrastructure may already satisfy those requirements; evaluate it before recommending removal or replacement.

The [knowledge-layer summary](../docs/KNOWLEDGE-LAYER-SUMMARY.md) records deferred adoption pending baseline evidence. It is not authorization to introduce a memory subsystem. Prefer a small maintained source map when a measured discovery problem warrants it, and establish that the intended sources were actually read before claiming retrieval helped.

Equally, do not remove a proven safeguard merely to make the diagram simpler. Identify the protection it provides and how the proposed design preserves or explicitly changes it.

## 10. Turn findings into small adoption slices

Rank candidate changes by consequence, evidence and effort. Separate a demonstrated correctness defect from a speculative optimization. Select the smallest coherent improvement, including all affected producers and consumers; do not bundle unrelated model, schema, role and permission changes.

For each proposed slice provide:

1. The concrete trigger and current versus intended behavior.
2. Workplace source paths and generated/installed destinations, with existing owners.
3. The reference principle being adopted and any deliberate adaptation.
4. Exact files to edit, interfaces to preserve, prerequisites and unresolved decisions.
5. Verification cases, expected observations, environment and execution authorization needed.
6. Risks, rollback procedure and compatibility with existing run/evidence records.
7. Completion criteria and the owner decision needed to proceed, if not already granted.

After authorization, change authored sources, regenerate through the real process if applicable, and inspect the concrete diff. Run only the agreed checks. Keep errors visible, preserve unrelated work and evidence, and obtain the applicable review before publication or installation. Follow the more detailed [workplace refactor guide](WORKPLACE-REFACTOR-AGENT.md) and [port plan](claude-v2.2/WORKPLACE-PORT.md) for an approved RSTACK implementation slice; do not turn this assessment into an automatic wholesale migration.

If a required runtime or host check is unavailable, mark the result implemented but unverified and state the exact missing observation. Do not claim readiness from a successful Markdown check.

## 11. Propose a small, attributable evaluation

Use existing workplace evidence first. For an authorized pilot, select a small representative set: at least one narrow change, one cross-module or interface change, and one ambiguous or failure-sensitive task. This is useful screening, not statistical proof of reliability.

Compare the unchanged workplace baseline with one defined improvement at a time, keeping other roles, tools, inputs and conditions as constant as practical. For model comparisons, use identical plan inputs for competing Auditors, fresh contexts, adjudicated defective and clean cases, and human evaluation of material findings. Repeat difficult cases if results are inconsistent rather than forcing a winner.

Record requirement and scope corrections, genuine audit/review findings, missed known defects, false positives, downstream planning-related defects, test discrimination, unauthorized transitions, recovery behavior, retries, rework, human interventions, tokens, elapsed time and available cost. Report unavailable values honestly. A reduction in findings can reflect better planning or worse detection; inspect the underlying cases.

Include relevant adverse cases such as a stale audit, locked-check failure, lost execution result, malformed parser input, contaminated review context, changed packet at unchanged SHA, protected user work, and an unknown publication outcome. Use safe existing fixtures or simulations; do not create a real external effect merely to test recovery.

State promotion criteria before the pilot. Quality and authority failures cannot be traded away silently for speed. Keep the baseline when benefits are unclear; expand the sample only when the uncertainty matters enough to justify the work.

## 12. Required deliverable and final handoff

Produce one reviewable assessment using the team's existing location/format where possible. Include:

1. **Executive judgment:** what should remain, the most useful improvements, and what cannot yet be concluded.
2. **Source and authority map:** exact comparison identities, authored/generated/installed ownership, current contracts and known conflicts.
3. **Workplace flow:** what actually happens, including failures, human decisions and external effects; distinguish specification from observation.
4. **Comparison matrix:** source-backed equivalences, stronger workplace controls, confirmed gaps, intentional differences and unknowns.
5. **Instruction and model assessment:** duplicate/conflicting context, role-specific needs, effective routing evidence and any justified experiment.
6. **Prioritized adoption plan:** a small first slice, later optional slices, exact files, dependencies, verification and rollback.
7. **Evidence limits:** unrun checks, missing sources, unresolved policy decisions and claims that rely only on inference.
8. **Owner decision:** the specific concrete proposal requiring approval, or the next action already authorized. Do not request approval again for an unchanged, already-authorized action.

If authorized implementation follows, append what changed, the actual commands and results, review disposition, remaining risks and installation/publication status. A proposal is not an implementation; an implementation is not validation; source validation is not host validation; local success is not publication.

The final recommendation should explain why each adopted change improves the existing workplace pipeline. The goal is a clearer, more reliable software delivery system with justified coordination and instruction costs, not a replica of this repository.
