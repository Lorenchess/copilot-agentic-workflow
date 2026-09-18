# Harness alignment — summary of the 2026-09-13/14 work

This file summarizes the post-Phase-5 "harness alignment" sequence: what prompted it, what was decided, what changed in the repository, what was reviewed, and what remains open. It is a record for readers returning to the repository; it creates no rule and grants no permission. Operative authority stays where [`.github/pipeline/HARNESS.md`](../.github/pipeline/HARNESS.md) says it lives.

## 1. Origin

The owner supplied an article on "harness engineering" (a six-layer minimum viable harness: contract, context, tools, state, evidence, recovery; an autonomy ladder earned by evidence; a loop that promotes each failure into a map, tool, policy, or test) and asked how the reference pipeline should adapt it. Three analyses followed, each preserved in this repository as a historical record:

| Record | Role |
|---|---|
| [`docs/specs/2026-09-13-harness-engineering-alignment-proposal.md`](specs/2026-09-13-harness-engineering-alignment-proposal.md) | Claude's proposal, revision 2. Layer-by-layer mapping (specified / constrained / observed), items H1–H6, owner decisions D1–D5, and a reconciliation record of the ChatGPT review. |
| [`Claude_Harness_Reconciliation_Review.md`](../Claude_Harness_Reconciliation_Review.md) | ChatGPT's review of revision 1: distinguish policy coverage from demonstrated behaviour; make lesson capture optional; keep the summary derived; defer a universal execution record; CA evidence never promotes a permission; a timeout is an observation, not an environment finding. All points were verified against the sources and applied. |
| [`Official_References_Pipeline_Recommendations.md`](../Official_References_Pipeline_Recommendations.md) | Application of the four primary articles (OpenAI harness engineering and Codex loop; Anthropic context engineering and tool writing) as recommendations P1–P6. |
| [`docs/reviews/2026-09-14-harness-alignment-analysis-and-implementation-plan.md`](reviews/2026-09-14-harness-alignment-analysis-and-implementation-plan.md) | ChatGPT's independent analysis and implementation plan (PROCEED_WITH_CHANGES), with a §10 addendum on repository structure: one `HARNESS.md` map, ledger at `docs/HARNESS-LEDGER.md`, native agent/skill locations kept, no `AGENTS.md`, schemas, registries, global state files, or folder moves. |

The plan's conclusion, kept throughout: the reference already specifies all six responsibilities; the useful work is a navigation and authority map, a reviewed-lesson loop, an honest autonomy table, and one precise clarification of what happens when a runner execution is not observed to completion. No new agent, gate, STOP code, artifact, tool, runtime, model change, or permission change.

## 2. What changed

| Commit | Batch | Content |
|---|---|---|
| `2634e71` | A — portable guidance and reviewed lessons | New [`.github/pipeline/HARNESS.md`](../.github/pipeline/HARNESS.md) (responsibility and authority map; optional reading). New [`docs/HARNESS-LEDGER.md`](HARNESS-LEDGER.md) (human-maintained reference lessons; change status and validation level as independent axes; five evidenced seeds; no corporate identifiers). [`GUARDRAILS.md`](../.github/pipeline/GUARDRAILS.md) "Action classes and their actual controls" (current control, mechanism, host dependency, what would make a separate owner decision considerable; runner execution stays a Manual-mode prompt). [`CORPORATE-ADOPTION.md`](CORPORATE-ADOPTION.md) common practice vs team-owned adaptation, team setup record, team context and proof-route entry shape, proportionate use across daily work. [`RUN-AUDIT-AND-IMPROVEMENT.md`](RUN-AUDIT-AND-IMPROVEMENT.md) "From incident to reviewed lesson". README and `copilot-instructions.md` gain an optional pointer only. |
| `0c2468b` | B — execution observation | Forward amendment [`docs/specs/2026-09-14-harness-execution-observation-amendment.md`](specs/2026-09-14-harness-execution-observation-amendment.md) (X1–X8) implemented across `test-contract` T6/T7, `implementation-quality` IQ3/IQ4/IQ13/IQ14, the tester, developer, verifier and pipeline agents, FLOW, AGENT-CONTRACTS and the pipeline skill. Every runner execution has an observation state (`OBSERVED` / `OBSERVATION_LOST` / `ENDED_INCOMPLETE`); an unresolved execution yields no RED, GREEN, PASS, FAIL, or verified SHA; the stage is `HELD` and `pipeline` voices an execution reconciliation decision on the delivery-continuation precedent; no automatic timeout-retry budget at any stage; stage-6 reservations stay consumed; a lost observation is never by itself `RUNNER_UNAVAILABLE`. |
| `a0f8dad` | C — optional UX patch | [`docs/specs/2026-09-14-harness-run-summary-and-lesson-note-patch.md`](specs/2026-09-14-harness-run-summary-and-lesson-note-patch.md) (S1–S4, with two labelled usability scenarios). RUN.md's Resume notes may open with a `Summary (derived; not authority)` block that never outranks resume-by-artifact; Decision-log entries may carry an optional `lesson:` / `lesson class:` note defaulting to `UNASSESSED` with no added question and no control-flow effect. |
| `3a8d186` | records | The four review inputs above and ChatGPT's implementation review tracked as historical records at their existing locations; hashes matched ChatGPT's table. |
| `f2b4868` | B fix-1 | Closes ChatGPT's B1 (HIGH) and B2 (MEDIUM), amendment revision 2: Verifier re-entry after a hold is a continuation of the pending obligations — renewed preflight, earlier results kept only on an unchanged basis, the replacement plus every unstarted required execution, then bracket and verdict; an unobserved intervening run stays in the T6 reproduction sequence, so unless its result is retrieved the decision names two fresh consecutive observed runs; X6a states the hold's lifetime. |
| `b48e849` | closure | ChatGPT's targeted-correction review preserved: B1 CLOSED, B2 CLOSED, no material regressions, READY_TO_PUBLISH_AS_REFERENCE. |

Across the sequence: 24 files changed, all Markdown; `.vscode/settings.json`, MODEL-ROLES.md, every example, every historical specification and review, all nine `tools:` blocks, every STOP code and message, G1–G4, and every numeric budget verified unchanged.

## 3. How the work was done

Each batch followed the repository's standing method: an architect brief, implementation by a Sonnet 5 agent, an architect mechanical review (file scope, unchanged surfaces byte-for-byte, link and anchor resolution) plus a read of every added line, at most one correction round, a local commit, and independent ChatGPT review. ChatGPT's implementation review ([`2026-09-14-harness-implementation-review.md`](reviews/2026-09-14-harness-implementation-review.md)) accepted A, kept C on the rendered scenarios, and required the two Batch B corrections; the targeted-correction review ([`2026-09-14-harness-targeted-correction-review.md`](reviews/2026-09-14-harness-targeted-correction-review.md)) closed both. Publication followed the owner's explicit instruction: closure report committed alone, live remote rechecked for drift, `main` pushed, all five reference tags preserved and verified unchanged, no tag created.

## 4. What remains open

- **Corporate validation.** Every row of [`CORPORATE-ADOPTION.md`](CORPORATE-ADOPTION.md) is still `NOT VERIFIED`. The corporate pilot (owner-led, one candidate at a time, matched baseline) is outside this repository; see the [investigation prompt](CORPORATE-PIPELINE-INVESTIGATION-PROMPT.md).
- **Batch C presentation notes** (deferred by review): show accepted plan risks as `none` explicitly in the normal-run scenario; give the held-run scenario's risk a consequence-bearing description; allow readable wrapping of Basis references.
- **H4 shared execution vocabulary:** implementation deferred; the amendment's §3 field mapping is the only normalization.
- **Normative repetition (N1-class debt):** unchanged; a deduplication pass waits for measured prompt-size evidence.
- **Runner auto-approval:** ledger row L-005, an open owner decision, not a defect; the GUARDRAILS action table names the evidence that would make a separate decision considerable and states that no evidence promotes it automatically.
- **Model diversity between maker and checker:** still a deferred benchmark.

## 5. Reading order for this sequence

1. [`.github/pipeline/HARNESS.md`](../.github/pipeline/HARNESS.md) — the map.
2. ChatGPT's plan, then the two forward specifications, then this summary.
3. The operative files the specifications name, read against the unchanged FLOW, AGENT-CONTRACTS, and GUARDRAILS.
4. [`docs/HARNESS-LEDGER.md`](HARNESS-LEDGER.md) and RUN-AUDIT's lesson section for how the next lesson enters the reference.
