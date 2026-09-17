# harness-map.md — reconstructed from screenshots

> Reconstruction note: this is a careful consolidation of the visible text from the uploaded
> `pipeline/references/harness-map.md` screenshots (IMG_1310–IMG_1313). It is not a byte-for-byte
> export of the repository file. Overlapping regions were deduplicated and visible wording was
> preserved as closely as possible.

# The harness map

Where each rule actually lives, who owns it, and whether a script refuses a violation or the rule
is prose. One table, so a developer who needs the current rule does not have to guess which agent
or which reference file states it.

**Reading this is optional.** It grants no permission, it adds no required input to any agent, and
no phase is required to open it. Nothing in [`write-boundaries.md`](write-boundaries.md) or
[`SKILL.md`](../SKILL.md) changes because a human or an agent read this file. It is an index of
where the authority is, never a second copy of the authority.

## The distinction this table exists to make

A rule can be true in three different ways, and the difference decides how much weight it carries:

- **Specified.** The rule is written down. Every row below is at least this.
- **Enforced.** A script refuses the violation and exits non-zero. This is what the `enforced by`
  column names, and it is the column that separates this stack from a set of instructions.
- **Demonstrated.** A real run was observed behaving that way. That is not this file's claim to
  make. `HARNESS-LIMITS.md` at the repository root scores it, and its default is not verified.

The `prose only` column is the honest half. A rule in that column is real and worth following, and
nothing will stop you breaking it.

## The six responsibilities

| responsibility | where the current rule lives | owner | enforced by | proven by | prose only |
|---|---|---|---|---|---|
| **Contract.** What the ticket asks, and what counts as done. | [`SKILL.md`](../SKILL.md) The flow; [`handoff-contracts.md`](handoff-contracts.md) for `plan.md` and the AC matrix; [`risk-tiers.md`](risk-tiers.md) for what a tier does and does not change; [`plan-interview.md`](plan-interview.md) for the interview that sharpens the plan before the audit sees it | `rstack-planner` seeds the matrix and writes the plan; `rstack-tester` is the only role that may mark a row verified | `ac-check.mjs` for row shape, the evidence floor, the sha pin and the encoding tolerance; `gate.mjs` runs it once per issue; `audit-response-check.mjs` for whether the plan carries the fixes the planner claims | invariants 8, 12, 24 | Interviewing the developer when the ticket has no clear criteria, question legibility, and the whole of the plan interview: its rounds, its pruning rules, and whether an unknown reached the auditor's brief. All mandatory, none scripted. The tell for a skipped interview is a thin ticket whose plan carries no assumptions. |
| **Context.** What an agent may read, and which instruction wins. | [`instruction-precedence.md`](instruction-precedence.md); [`rstack-process.instructions.md`](rstack-process.instructions.md) for the always-loaded tier; [`SKILL.md`](../SKILL.md) phase 0 | The installer places the tiers; each agent owns its own inputs | Nothing at read time; `install-estate.mjs` places and drift-checks the tier files, which is delivery rather than precedence | invariants 21, 35 | The tier ordering itself. `instruction-precedence.md` says plainly that it was read from host documentation and never observed resolving a real conflict. |
| **Tools and write lanes.** Who may write which path. | [`write-boundaries.md`](write-boundaries.md), which declares itself the only copy of the lane table and must stay that way | Each agent's frontmatter `tools:` plus the lane table for paths | [`role-guard.mjs`](../scripts/role-guard.mjs) for per-role paths; [`estate-guard.mjs`](../scripts/estate-guard.mjs) for a write into a sibling repository, which `role-guard` cannot see; [`boundaries.mjs`](../scripts/boundaries.mjs) as the one path classifier both importers share | invariants 13, 18, 26, 27, 37 | Frontmatter `tools:` is coarse by construction. It can say whether an agent holds Write, never which paths, which is why the guard scripts exist at all. |
| **State and artifacts.** What a run writes down, and who owns each file. | [`handoff-contracts.md`](handoff-contracts.md) for every artifact schema; [`SKILL.md`](../SKILL.md) Layout | The phase that writes an artifact owns it | [`protect-artifacts.sh`](../scripts/protect-artifacts.sh) keeps evidence out of git while leaving the one committed artifact committable; `doc-check.mjs` refuses an incomplete document and never proposes deleting a file shared between tickets | invariants 23, 25 | Resume by artifact. A run interrupted mid-phase is resumed by a human reading the artifacts, and no script derives the resume point. |
| **Evidence.** Whether a claim was measured or inferred. | [`SKILL.md`](../SKILL.md) The stop flag, and "Satisfy the condition, never the instrument" | `rstack-tester` for the gate package; `rstack-reviewer-architect` for the review verdict | [`gate.mjs`](../scripts/gate.mjs), whose own output is the list of checks and their owners, so read that rather than a count written here; [`test-lock.mjs`](../scripts/test-lock.mjs) pins a locked test's content and rules what an amendment authorises; [`base-replay.mjs`](../scripts/base-replay.mjs) re-derives a red instead of trusting the file that says it happened | invariants 29, 30, 31, 32, 33, 34, 40 | Five branches tolerate absent evidence as a caveat rather than a failure. The gate now derives them into an `OBSERVATION` block beside the verdict and an `inferred` array in `--json`, so an inferred rung is visible rather than buried in a passing check's prose. Reporting is not blocking: the tolerances are unchanged, and whether they should block is an open decision. |
| **Recovery and learning.** What survives a run. | [`learnings.md`](learnings.md) for the per-repository file contract, and its own table of which rules are enforced; [`handoff-contracts.md`](handoff-contracts.md) for the entry schema; [`SKILL.md`](../SKILL.md) "What the last run learned", including which phases receive it | The orchestrator appends once at the end of a run and is the only role that may, via the `learning` lane; the `docs` skill prunes after the merge and captures the run metrics before deleting their source | [`learnings-check.mjs`](../scripts/learnings-check.mjs) for the sections, caps, required `src:` and `check:` fields, and refusal of instruction-shaped content; [`role-guard.mjs`](../scripts/role-guard.mjs) for the one-writer lane; `doc-check.mjs` for the metrics capture | invariants 23, 28, 47 | Whether the file is worth its read cost. **Nothing has written one yet**, so the contract is specified and unexercised, and every claim about what it saves is a hypothesis. Which phases read it is prose: `role-guard` sees writes, not reads, and no script can see what an agent was handed. |

## What the gate checks

The gate is where most of the enforcement lands, so its checks are named here rather than left to
"go and read the script". This list is kept in step with `gate.mjs` by an invariant that derives the
names from the script and fails when one is missing here, which is why it is safe to write down.
Run the gate for the current detail text and each owner: it prints its own list, and the detail is
where the reasoning lives.

| check | what it refuses |
|---|---|
| `suite` | A suite that did not run, an empty log, a claimed exit code that disagrees with the recorded one, and a log describing a commit nobody is gating. A red suite is blocked, and the waiver path is the one narrow route past it. |
| `ac-matrix` | A criterion not proven at the current head, a row below the evidence floor, and a missing matrix. One check per issue on a batched run, so two tickets cannot hide behind one verdict. |
| `test-lock` | A locked test whose content moved, whose assertions fell, or which gained a skip marker. |
| `impact` | A missing or stubbed impact record, which is the evidence the review phase is about to judge. |
| `test-execution` | A locked test the runner never named, which means the log names tests at all. |
| `tree-bracket` | A working tree that moved while the suite ran, so the pinned commit cannot describe a tree the code never ran from. |
| `otel` | A run log that disagrees with the host's own span record: a phase claiming a model family the host did not serve, or a phase the host dispatched with no row for it. The only check here whose evidence has an author other than the phase being judged. It never requires the record to exist: no store, no `node:sqlite`, no spans in the run's window all pass and print `NO CLAIM`. |

[`otel-trail.mjs`](../scripts/otel-trail.mjs) is the reader behind that check:
`--list` for what the store holds, `--trace <id>` for one run as a tree,
`--verify --issue <KEY>` for the cross-check on its own. The gate calls the same code rather than
reading a file some phase produced, because a check fed by an agent's artifact is self-attestation
again. Limits, including the store's rolling 7-day and 100-session window, are in
`HARNESS-LIMITS.md` and printed by the check itself.

Two validators sit outside the six because they measure rather than refuse:

- [`change-budget.mjs`](../scripts/change-budget.mjs) compares the plan's estimate against what was
  written.
- [`pipeline-metrics.mjs`](../scripts/pipeline-metrics.mjs) reports what a run cost and caught.

A budget overrun raises the tier and goes to the architect as a finding. Neither blocks.

**`pipeline-metrics.mjs` judges its own input before using it.** Every duration it reports comes
from `run-log.tsv`'s `ts` column, and that column carried invented values on both real runs this
stack has had. It now refuses the shapes the orchestrator's contract names and reports the
durations `UNAVAILABLE` rather than printing a fabricated number. Invariant 48 asserts both real
shapes, and asserts that an honest clock still measures.

## If you are looking for something specific

- **The current rule for who may write a path.** [`write-boundaries.md`](write-boundaries.md), then
  the per-agent Forbidden section in that agent's own file.
- **What the gate will refuse.** Run it. `gate.mjs` prints its check list, each owner, and the reason,
  which is more current than any summary of it.
- **What a tier changes.** [`risk-tiers.md`](risk-tiers.md). It changes depth only. No tier, budget
  verdict, or session instruction skips phase 5.
- **What an external write needs.** [`approvals.md`](approvals.md). No agent merges, and external
  writes are asked one at a time.
- **How to adopt this on a new team or stack.** [`team-adoption.md`](team-adoption.md).
- **What a run costs, and which costs cannot be measured here.**
  [`discovery-cost.md`](discovery-cost.md). Read it before arguing that the pipeline should remember
  more; nothing in it has been collected yet, and it says so.
- **What is actually validated.** `HARNESS-LIMITS.md` at the repository root.
- **A weakness worth recording.** `HARNESS-LEDGER.md` at the repository root.

The maintainer records at the repository root are named without links on purpose. They are outside
the installed set, so a link from here would resolve in the clone and break in installed estates.

## What this map is not

- Not a phase, an agent, a skill, or a run artifact. It is one Markdown table.
- Not a required read. No agent's inputs grew because this file exists.
- Not authority. Where this file and the file it points at disagree, the file it points at wins, and
  this one is wrong and should be fixed.
- Not a claim that anything here was observed working. That is `HARNESS-LIMITS.md`'s job, and its
  answer is mostly not verified.
