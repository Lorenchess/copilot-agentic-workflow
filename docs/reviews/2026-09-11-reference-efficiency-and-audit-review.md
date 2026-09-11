# ASTRA — Reference efficiency and audit review

## Decision and review basis

**Keep the architecture and accept the bounded forward improvements described below.** The Web analysis identifies useful work, but does not justify another orchestration layer, extra agents, weaker verification, or a larger autonomous scope.

Reviewed base: `c38c8ca1454cda293a7e9286b3925e6a34fa5794`, plus this task's uncommitted working-tree changes. The supplied Web analysis has SHA-256 `8F576911264DB0930E979D364451DD0F52D8A66D9F9B63EB09A43EE6F765F44D`. Two explicitly selected GPT-5.6 Sol subagents authored the changes; Astra inspected the sources, directed corrections, and wrote this assessment. Authoring-model selection does not establish the model used by a future corporate Copilot run.

The five reference tags, historical specifications, examples, and earlier reviews remain unchanged. These are forward refinements, not a reopening of those baselines or a new phase. The old locked reviews do not automatically validate these refinements.

**Boundary:** this is source and scenario review, not corporate runtime validation or a performance benchmark. The corporate Jira/Bitbucket integrations work according to the owner; their implementation and production run evidence were not available here. The reference has not been validated on real tickets.

## What actually needed changing

| Change | Evidence and engineering reason | Result |
|---|---|---|
| Verifier eligibility before runners | At the reviewed base, verifier Procedure step 4 ran tests before steps 6–8 checked immutability, envelope changes and review freshness. An ineligible package could consume two expensive executions before rejection. | [Verifier Procedure](../../.github/agents/verifier.agent.md#procedure) now checks review/anchor eligibility, clean candidate state and controlled/envelope paths first. Unexecuted checks are `NOT_RUN`, not invented failures or passes. No verified SHA is recorded for a skipped package. Eligible repositories still need independent contract/full-suite/relied-on execution and the post-run bracket. |
| Narrow activation context | Tester read the full construction policy on every invocation even though activation changes only the accepted anchor and membership. | [Tester](../../.github/agents/tester.agent.md#procedure) skips policy loading only for activation. It validates the named Round, ACCEPT, Basis, entry and transition; only TEST-CONTRACT.md changes. Other modes retain their policy obligations. This removes an explicit read requirement, not a measured number of tokens. |
| Make delegation and G3 clearer | Call details were distributed through the orchestration prose; G3's final choice mentioned test authoring although eligible local implementation followed automatically. | [Pipeline](../../.github/agents/pipeline.agent.md#procedure) names mode, round, allowed input revisions, output and return condition explicitly. Its G3 disclosure explains subsequent test review and bounded local implementation. G4 still authorizes publication. No additional gate or authority is created. |
| Make diagnosis useful evidence | IQ3 recorded an edit/purpose and failure delta; a differently worded failure was too easy to describe as progress. | [IQ3](../../.github/skills/implementation-quality/SKILL.md#iq3--logical-round-allowance-and-accounting) uses the existing log for a short hypothesis, discriminating observation and result. Changed wording or cycling alone is not progress. Reservations, interruption handling and the 6/6/2 allowances are unchanged. |
| Define audit retention and evaluation | Existing artifacts record evidence and decisions, but `Artifact history` is a metadata list, not a versioned content archive. No corporate collection or restore evidence exists in this repository. | [Run audit guide](../RUN-AUDIT-AND-IMPROVEMENT.md) defines a small integration procedure using existing corporate storage and observability. [CA-21/22](../CORPORATE-ADOPTION.md#validation-matrix) explicitly leave export, correlation and restore `NOT VERIFIED`. Nothing was enabled or collected. |

AGENT-CONTRACTS and FLOW were reconciled only where these changes affect their summaries. MODEL-ROLES now recognizes the orchestrator's need for exact structured state and measures rather than assumes its cost. README and the corporate investigation prompt link the new guidance and distinguish it from the locked baseline.

## Disposition of the remaining Web recommendations

| Topic | Assessment |
|---|---|
| Intake completeness and source identifiers | A real residual limitation: downstream independence cannot recover a clause never captured. However, [gather-jira-context](../../.github/skills/gather-jira-context/SKILL.md#provenance) already requires verbatim source-field labels; its Disclosure section requires visible truncation/omission warnings. Keep these. The audit guide requests actual source versions, field/comment identifiers and completeness evidence when exposed. A new extractor, blanket Jira access, new fetch budget or automatic re-fetch route is not justified without corporate examples of loss. |
| Large requested-key sets and long descriptions | The related-issue/comment caps do not bound every requested payload. Retain this as a workload/adoption question. Do not silently truncate requirements or invent a splitting threshold before measuring actual ticket sizes. |
| Earlier execution suitability | Use existing [CA-16–19](../CORPORATE-ADOPTION.md#validation-matrix) and known repository/environment evidence before an approved pilot. Do not add a second environment checklist or weaken PASS to improve completion statistics. |
| Earlier Planner clarification | Plausible latency improvement, deferred. Planner currently routes BLOCKING questions through Adversary rather than inventing an answer. Changing this would add a control-flow path; first measure how often it performs substantial doomed work. |
| Independent planning/test review and SMALL depth | Preserve them. Passing tests can prove the wrong outcome. Measure useful counterexamples, false blocks and reviewer effort; neither mandatory findings nor an automatic SMALL review exemption follows from this analysis. |
| Developer autonomy and scaffolding | Already bounded and useful. Keep PLAN-TRACED work, justified refactoring, human decisions on material deviation and controlled-path ownership. Measure boundary/scaffolding friction rather than granting Tester production-edit powers. |
| Deduplicate Developer/Verifier executions or verify selected repositories only | Defer. These runs have different responsibilities; reuse would require an adequately bound execution environment, source/evidence identity and invalidation rule. Static repetition is not enough evidence to remove independent verification. |
| Restructure every skill, change models or parallelize implementation | Defer. Activation is the smallest context experiment. Other changes need measured benefits and correctness comparisons; shared working trees still support one active writer. No custom runtime, locking service or concurrency engine was introduced. |
| Delivery and terminal approval rules | Preserve exact-SHA binding, unknown-effect reconciliation, human continuation and conservative approval behavior. Logging failure cannot authorize repeating a push or PR create. Global auto-approval is not a solution to latency. |
| Reviewer/model benchmarking | Accepted as a measurement procedure, not a claimed result. Evaluate independently accepted correct changes, eligible workload share, human effort and complete cost—including unsuccessful attempts. No model switch or new benchmark harness was made. |

## Independent review of Sol's changes

The review required corrections before acceptance:

- Preserve initial RED and stage-5b correction anchors, which require no amendment activation. Do not require a new membership field in TEST-REVIEW: resolve membership through its referenced contract revision/entry.
- Keep activation reads internally consistent with its Round/Verdict/Basis checks; keep Tester-origin conflicts in TEST-CONTRACT rather than incorrectly placing them in IMPLEMENTATION.
- Allow only a bounded ordinary-envelope justification read after independent content inspection; retain the full claims-last reconciliation. A legitimate ordinary build change must not fail just because its file changed.
- Prevent a generic delegation header from exposing a forbidden accounting artifact to test-review mode.
- Distinguish metadata-only telemetry from approved storage of full artifact content; separate completed-run denominators from retry counts; do not present new guidance as part of an older tag.
- Repair a line-ending serialization error and check real file structure before accepting the final files.

These were corrected by Sol, not by silently editing its implementation during review.

## Scenario review

These are reasoned traces through the resulting instructions, not executed Copilot tests.

| Scenario | Expected path checked |
|---|---|
| Normal initial SMALL anchor, current ACCEPT | No activation record demanded; required verification still runs. The existing SMALL example's Basis shape remains sufficient. |
| LARGE correction-round anchor, no amendment | Top-level correction anchor is valid; no fabricated amendment/activation prerequisite. |
| Missing/stale review or pending amendment activation | Preflight fails; dependent runner evidence is NOT_RUN; no verified SHA or G4 eligibility. Missing anchor/membership never produces a guessed Git diff. |
| Committed or working-tree controlled-path change | CONTROLLED_PATH finding; existing human-restoration route, not an automatic production fix to tests. |
| Legitimate ordinary envelope change versus test exclusion | Inspect content and corroborate the limited justification; a legitimate change remains eligible, while exclusion/weakening fails. |
| Covered CURRENT REVISE and a live gap | Runnable checks remain required; the result is capped at INCOMPLETE, never PASS or G4. |
| Checkout changes during execution | Post-execution bracket fails; the SHA does not become verified. |
| Activation matches / mismatches the accepted entry | Exact match updates only contract anchor/membership; mismatch records the problem and returns without activation. |
| Interrupted diagnostic run or oscillating failures | Pending reservation remains consumed; observations support/refute the hypothesis without renewing allowance. Different error text alone does not reset progress. |
| Two developers, multiple sessions, missing snapshot or uncertain PR effect | Separate writable runs and archive namespaces; ordered invocation identity; explicit audit gap; existing live-state reconciliation before any authorized external continuation. |

## Auditing and improvement over time

The practical retained record is **what was supplied, decided, attempted, observed and changed**. Short diagnostic summaries make the record intelligible. A provider's hidden reasoning is neither an accessible nor necessary audit trail; reasoning-token counts do not contain reasoning text.

Official documentation describes [Copilot OTel export](https://code.visualstudio.com/docs/agents/guides/monitoring-agents) and [debug-session exports](https://code.visualstudio.com/docs/agents/agent-troubleshooting/chat-debug-view). That documents possible host facilities, not their availability or configuration in the corporate installation. The guide records this distinction and the content/privacy boundary.

Use the existing corporate run identifier and private storage, preserve exact artifact bytes before replacement, and correlate observed session/subagent/tool events. Retain policy/source/configuration versions and real repository state. Mark unavailable or agent-reported measurements honestly. A coherent artifact snapshot plus fresh repository/remote checks supports recovery; a chat transcript alone does not.

Start with one small comparison against the existing corporate flow. Keep all initiated runs and their unsuccessful attempts, report workload eligibility separately, and compare accepted correctness, material rework, human effort and cost. Review the evidence before promoting one prompt/policy change. Maintain held-out and regression cases. This is a proposed human-led practice, not an automation created by this task.

Workflow/prompt tuning comes first. Model-weight training is a separate, explicitly approved activity with provider support, permitted data use and independently curated outcomes. Raw corporate logs must not be committed to this public reference repository or automatically become training data.

## Verification and remaining limits

The final source review found no remaining material defect in this bounded batch. Static review covered the final diff, procedure/input consistency, normal and failure cases above, file scope, tool lists, STOP literals and reference refs. Git whitespace checks pass. The nine agents, seven skills, twelve run artifacts and four gates remain; no tool grant, setting, runtime or storage system was added. The ten edited existing files, new audit guide and this review are the complete task delta. Historical specifications, examples and prior reviews are untouched.

No build, lint, test runner, browser automation, real Jira/Bitbucket interaction, telemetry capture, checkpoint restoration or corporate end-to-end run was performed. No speed, token-saving, quality or multi-developer safety improvement is claimed measured. Instruction compliance, source completeness, timing/cost attribution and snapshot coherence still need evidence in the actual host.

**Final assessment:** the bounded source changes are suitable for review and selective corporate adaptation. The audit guide is ready to use as an integration brief; durable collection and recovery are not implemented here. Keep the architecture, gather trustworthy corporate evidence, and let that evidence determine the next refinement. Nothing was committed, tagged or pushed by this task.

## Reviewed working-tree fingerprint

The eleven implementation/documentation files (excluding this report) are bound by fingerprint `0A6A6F807461A356929BC3EB0ABEC61958B965369C234AD970562D6A6FA68078`. Compute SHA-256 over UTF-8 lines exactly in the order below, each `relative-path|uppercase-file-SHA256` followed by LF, including the final LF. File hashes cover actual bytes; changing checkout line endings changes the fingerprint. This identifies the reviewed files; it is not a new runtime enforcement mechanism.

```text
.github/agents/pipeline.agent.md|F275EBF7A9B52AD2743B5EFE29E20F39812F45F1EE66DC18D4812FDF472D470B
.github/agents/tester.agent.md|B20F941E4A858DCA18100401EF68408BA9A01E76B55F43863941FA06A2A29601
.github/agents/verifier.agent.md|953AD60E0A022A0603987BD5AD8D057C23036AB9164E79CE7C0EE673D546920E
.github/pipeline/AGENT-CONTRACTS.md|0193919CBB389C6CC2ACF46284BDDC60BB11C77F7D066DABCBEBC5B39F1B02C5
.github/pipeline/FLOW.md|13457BF265BC7D9F42ED7AFFA069FCF253873439737C1B61F59BF3BFFB10433B
.github/pipeline/MODEL-ROLES.md|BC161383B2F65E38C6B3BDBBFFFF37068C4FA32610A4F2BF60448776E831F252
.github/skills/implementation-quality/SKILL.md|48210D2014C4B25EDA0380B7E457EC40D66D233E4FB14EE8CA84739A1F056DA9
docs/CORPORATE-ADOPTION.md|398777C3A687DD37128CDD5FCA4900EA57E6FDA4A2EECDA7A20CAADE45BB7EC5
docs/CORPORATE-PIPELINE-INVESTIGATION-PROMPT.md|26B7D7E53CA771E55192D34D16A99F3ACC297437622E3A74BC99523A253613B4
docs/RUN-AUDIT-AND-IMPROVEMENT.md|B2B0B0EF6996C2EF79A427B7B094310426638E2E755B5B394D49A208075E65D8
README.md|71ACEB632CAD6FDB05AE6CD8B352614AB91624BD296DDB2234E6A1D0683E3576
```
