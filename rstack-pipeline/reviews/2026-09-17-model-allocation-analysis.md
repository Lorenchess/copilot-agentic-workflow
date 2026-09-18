# Model allocation for the V2.2 roles — architect's analysis

Date: 2026-09-17. Written after, and independently of, the independent review of the same question (`2026-09-17-model-allocation-independent-review.md`). Where the two agree I say so briefly; where they differ I say why. Nothing here was measured. No file in the pipeline was changed by this analysis.

**Question.** Should the three upstream roles of the V2.2 pipeline move from the declared allocation to the proposed one?

| Role | A (declared in `claude-v2.2/agents/*.md` today) | B (proposed) | C (intermediate, from the independent review) |
|---|---|---|---|
| Orchestrator | Claude Opus 5 | Claude Sonnet 5 | Claude Sonnet 5 |
| Planner | Claude Sonnet 5 | Claude Opus 5 | Claude Opus 5 |
| Plan Auditor | Claude Opus 5 | GPT-5.6 Sol | Claude Opus 5 |

The remaining roles (tester Sonnet 5, dev Opus 5, reviewer Opus 5, approval Sonnet 5) are not in question and stay fixed in every arm.

Labels: **FACT FROM FILE** (read from the contracts in this repository), **VENDOR GUIDANCE** (a vendor's own description, no measurement), **INFERENCE** (a consequence of the contracts, not a result), **RECOMMENDATION**.

---

## 1. Verdict

**TEST, in the order C then B. Do not adopt B as a bundle.**

I agree with the independent review's verdict and with most of its reasoning. The three changes in B are three different bets with three different risk profiles, and only one of them (Planner to Opus) has a mechanism I can argue for from the contracts. I add four things the review does not say, or says less sharply:

1. **The Orchestrator's sensitivity is long-context state fidelity, not reasoning depth.** The right precondition for the Sonnet swap is not only a routing replay but host-side persistence of fresh-role replies, because that removes the largest transport burden from whichever model dispatches.
2. **The Sol substitution is a contract-conformance change before it is a reasoning change.** The audit body is parser-owned; a family switch must pass a conformance gate before any quality comparison is meaningful.
3. **The Planner has the highest leverage per token in the pipeline**, because a planning error propagates through the test lock and becomes the definition of done. That is the only argument here that rests on a mechanism rather than on a capability label.
4. **Model experiments must wait for the pending contract corrections** (the independent correction review's C1 to C3), because an ambiguous contract confounds any model comparison.

---

## 2. What each role is actually sensitive to

The contracts make the three roles sensitive to different things. Capability labels such as "more reasoning" hide that.

| Sensitivity axis | Orchestrator | Planner | Plan Auditor |
|---|---|---|---|
| Reasoning depth (engineering judgement) | Low: the contract forbids it ("never plans, tests, implements, reviews, interprets findings") | High | High |
| Long-context state fidelity | **Highest of any role**: its context spans the whole run; it saves every reply verbatim, tracks blocker identity across loops, compares digests | Medium: one ticket, several interview rounds | Low: one fresh invocation |
| Schema and tool conformance | High: envelope parsing, digest comparison, run-log columns | Medium: plan sections, `ac.tsv` seed, Claims table | **High**: the audit body is parser-owned (verdict tokens, claim ids, response checker), plus the envelope's plan-sha256 line |
| Interactive question discipline | Medium: relays, never answers | **High**: the plan interview asks only the current frontier, records `default, unopposed` honestly, never invents an AC | Low: writes nothing, asks nothing |
| Adversarial skepticism | None required | Low | **Defining**: "Default to disbelief"; the conjunction question |

FACT FROM FILE for every cell that quotes a contract; the ratings are INFERENCE.

### Orchestrator

The independent review rates this MEDIUM and calls it "the best candidate for a controlled capability reduction". I agree with the conclusion and would state the risk differently. The cheaper-model failure that matters is not a wrong routing decision on a fresh, small context; the routing table is a lookup. It is drift after a long run: a stale candidate id carried into a later dispatch, a reply transcribed with a heading dropped, a blocker identity confused between loop turns, a `STOPPED` audit archived as if completed. Those are context-length failures, and nothing in the vendor descriptions tells us how Sonnet 5 and Opus 5 differ on them at the context sizes a full run produces.

Two structural facts reduce the model's exposure regardless of which model dispatches. First, the contract already prefers host persistence of fresh-role replies over orchestrator transcription (OD-15), and the open decision OD-22 records `subagentStop` as a possible host-side scribe. Second, every eligibility comparison is by recorded field, and the contract says to stop rather than improvise. RECOMMENDATION: treat the Orchestrator swap as safe to trial only after the host persistence question is answered on the actual surface; a replay of eight states with short contexts, as the review proposes, tests decisions but not transport fidelity over a long run. Add to the replay one full-length synthetic run (all states, two loop turns, one stopped audit) and score transport exactly.

### Planner

Agree: HIGH, and Opus is the well-motivated challenger. The argument I would add is about leverage, not capability. In this pipeline the plan's acceptance criteria become the tester's checks, the checks become the locked tests, and the locked tests become the definition of done that the developer cannot change. A wrong or vacuous criterion therefore costs a human-decided lock amendment, a new candidate, full verification and a new review. The plan auditor is the only check between the planner and the lock. So the planner is the role where an error is most expensive and least reversible, and that, not a benchmark, is why reasoning capacity belongs there.

The review's caution about over-elaboration is right and is measurable without judgement: count interview questions per round, `default, unopposed` criteria, units that advance no AC, and plan revisions per ticket. A stronger planner that asks more or assumes more is not an improvement.

### Plan Auditor

Agree: HIGH. The review's table of audit capabilities is the right one. What it under-weights is that Sol is a different family running inside a Copilot custom-agent definition written for Claude. FACT FROM FILE: the auditor's reply must begin with the structured envelope, carry the `Plan: ... sha256 ...` line, use the six parser-facing headings, label every claim with one of five tokens, and end with `Wrote nothing.`; the response checker reads finding ids from it. Any deviation is a malformed handoff and a new invocation. Whether Sol reads the same instruction files, uses the same terminal tools for read-only git, and returns the same block structure is unknown and is the first thing to find out. RECOMMENDATION: a conformance gate before quality: N audits of identical plans, 100 percent envelope and body conformance, or Sol is not a candidate for this role regardless of what it finds.

On personality claims ("Sol is more adversarial"): agree there is no basis. The auditor's skepticism is a property the contract demands, and the measurement is the conditional miss rate on seeded defects at a bounded false-positive rate.

---

## 3. Model diversity

Agree with the review's ranking: fresh context and an evidence-first role are foundational; a different family is an unproven extra. The V2.2 contract already says "Model diversity is optional" and the reviewer file says "Fresh context is independence from prior reasoning, not vendor diversity."

Two additions. First, the crossed design the review proposes (two planners times two auditors on identical plans) is exactly what isolates family diversity, and the metric to read from it is the conditional one: given a seeded or spontaneous planner error, did the auditor catch it? Same-family shared blind spots show up as errors an Opus planner makes that an Opus auditor also misses but a Sol auditor catches; cross-family noise shows up as Sol findings the human adjudicates as false. Both numbers come from the same 24 audits.

Second, a practical cost the review lists but does not weigh: two vendors in one pipeline double the host-configuration surface (effort settings, tool naming, instruction discovery). The adoption record (`team-adoption.md` item 10) must be filled once per vendor. That is real work and it is a reason to run C before B.

---

## 4. Cost and latency

I do not repeat price figures here; the review quotes list prices and correctly says they are not the platform's billing rates. Two structural observations instead.

The Orchestrator's token use is dominated by input, not output: it re-reads a growing run context on every dispatch and generates short replies. The Planner's is dominated by exploration (search and read calls) and interview rounds. Swapping the two models therefore does not move a fixed token budget from one price to another; it changes which role's consumption pattern meets which price, and the net is unknown until measured. The review says the same in fewer words; I state it to warn against back-of-envelope savings.

Latency in this pipeline is bounded by loops, not by single-turn speed. If Opus planning removes one audit round per difficult ticket, that saving dwarfs any per-turn speed difference in the dispatcher. If it does not, the dispatcher swap is the only latency change. Measure elapsed time to an accepted result, as the review says.

---

## 5. Configuration comparison and order

The review's table of expectations is fair. My ordering:

1. **C first** (Sonnet / Opus / Opus). One change pair, same vendor, no new host integration. It isolates the reallocation hypothesis (reasoning toward planning) from everything else.
2. **B's Sol substitution second**, on identical plans, after the conformance gate. Comparing B with C then isolates the family-diversity hypothesis.
3. **End-to-end** on paired tickets for the strongest challenger only.

I would not add a fourth arm. A plus Sol auditor (A with only the auditor changed) is already covered by the crossed design in step 2.

---

## 6. Promotion criteria

Stated so that a run can fail them.

- **Orchestrator:** zero consequential unauthorized advancement in the replay and in the full-length synthetic run; every fresh-role reply persisted byte-exact; every stopped audit kept out of `plan-audit.md`. One failure blocks.
- **Sol conformance:** 100 percent of audits parse (envelope, headings, tokens, `Wrote nothing.`). Below that, stop.
- **Planner:** fewer contradicted assumptions and fewer omitted surfaces per ticket than the Sonnet baseline on the same tickets, with no increase in questions per round, `default, unopposed` criteria, or units advancing no AC.
- **Auditor:** lower conditional miss rate on seeded defects at an equal or lower human-adjudicated false-positive rate, and no increase in findings labelled `DUPLICATE` or `ALREADY_CAUGHT_BY_DETERMINISTIC_CHECK` (the labels in `discovery-cost.md`).
- **End to end:** fewer audit rounds and less downstream rework on paired tickets, cost and elapsed time measured through the accepted result.
- **Never:** finding count, plan length, or vendor benchmark position.

---

## 7. Preconditions

The independent correction review of the same date found three bounded contract issues (publication recovery semantics, an enforcement-classification overclaim, and provenance wording) in six V2.2 files. Its warning that "a stronger model may compensate inconsistently for an ambiguous contract" applies directly: a model comparison run against an ambiguous contract measures the models' tolerance for ambiguity, not their fitness for the role. RECOMMENDATION: apply that correction pass first, then freeze the contracts for the duration of the experiment, then run the experiment. Record effective model identity, effort setting and host version per arm, as the review says; the `models.json` the earlier design mentioned does not exist in this repository, and frontmatter is a declaration, not a dispatch record.

---

## 8. What not to do

- Do not change all three roles at once; the result would be unattributable.
- Do not infer role fitness from vendor benchmarks or launch comparisons; they measure different tasks against different baselines.
- Do not treat the current frontmatter as evidence that A was validated. It was written, not measured.
- Do not use a fall in auditor findings after a planner upgrade as evidence that the mandatory audit can go; that question is OD-24 and is decided by the finding-quality labels over representative runs, never by one experiment.
- Do not let Sol into the auditor role on the strength of structured-output features alone; conformance is measured, not documented.
- Do not describe any of this as a cost saving until billed usage through an accepted result has been compared.

---

## 9. Final position

Configuration A remains the declared allocation until an experiment says otherwise. The experiment is worth running, in the order C then B, after the pending contract corrections, with a conformance gate in front of Sol and a full-length transport check in front of the Sonnet dispatcher. The one hypothesis I would bet on is the reallocation of reasoning toward planning, because the pipeline's own mechanics make planning errors the most expensive kind. The one I would bet against, absent data, is that a second vendor by itself buys independence the fresh-context rule has not already bought.
