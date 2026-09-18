# Changes from claude-v2

This revision is an editable candidate built from the preserved Claude draft and the 44 photographs. It changes the contract where the draft contradicted visible code, and records the runtime work needed to enforce stronger guarantees. It does not claim that the proposed controls already run.

| Change | Files | Reason / evidence |
|---|---|---|
| Restore sha-based eight-column AC interface; real HEAD for working-tree feedback | pipeline, planner, tester, approval, handoff contracts | E01; no WORKTREE literal or candidate-column migration |
| Separate execution, review and release outcomes | pipeline, tester, reviewer, approval | E02–E07; known-red diagnostic review is different from permission to ship |
| Keep photographed HELD and exit-code semantics | pipeline, orchestrator, harness map | E06; lost/running execution is a separate status |
| Bind review to complete immutable evidence and comparison | approval, tester, reviewer, handoffs | Prevent old review being reused after evidence replacement; proposed design |
| Establish committed candidate input basis | pipeline, approval, handoffs | E08; matching dirty digests do not establish committed execution |
| Fix freeze/index/stash and publication recovery procedure | approval | Preserve user work, no no-op stash pop, no unrelated staging, reconcile unknown external results; proposed design |
| Fresh audit after every revised plan; no independence by forgetting | planner, auditor, orchestrator, reviewer, pipeline | A response checker is not a new audit; proposed design |
| Make role result transport explicit | orchestrator, developer, handoffs, write boundaries | Driver can persist verbatim envelopes without developer-written artifacts |
| Preserve exception schema, tighten release contract | pipeline, approval, handoffs, runtime patch plan | E03–E05; current proceedable and waiver matching do not prove all requirements |
| Correct authorization record provenance | approvals, write boundaries, approval | Agent-written records and human-name fields do not authenticate a decision |
| Remove inherited approval-regex installation template | approvals | Host/installer version and effective behavior unverified; do not publish permissive settings as ready |
| Consolidate universal floor; preserve no PR merge/production tests | standing rules, session context, process reminder, precedence | Avoid conflicting duplicated policy; actual loading still needs verification |
| State guard/host/telemetry limits | write boundaries, harness map, discovery cost, estate layout | Source/call site differs from observed execution or containment |
| Add bounded estate search contract | estate-sweep, estate layout, impact schema | E11–E12; null, partial and uncovered results remain distinct |
| Add screened, blinded skill-change evaluation | eval-skill, learnings | E13; actual behavioral benefit is unmeasured |
| Preserve source-backed criteria and conditional defaults | planner, plan interview | Do not manufacture requirements or settle material uncertainty by silence |

## Deliberate design choices, not photographed runtime behavior

The committed-candidate phase, packet digests, immutable attempts, structured envelopes, mandatory fresh re-audit, review/release predicates and clean candidate input basis are proposed integration changes. They need adoption and actual source support. State numbers and compatibility paths alone do not make existing consumers support them.

Full candidate verification before review is the default. The optional scoped-review route is diagnostic until full evidence exists; a materially changed packet requires another review. This trades extra runs/reviews for explicit evidence freshness.

The normal release route permits no accepted observation gaps. A separate, disabled-until-adopted exception route may accept only specified gaps or fully accounted pre-existing nonlocked failures; it never waives locked execution, complete scope, candidate identity or L4 AC proof.

## Preservation and validation boundary

Original reconstruction files, ChatGPT reviews and claude-v2 remain unchanged. New files live only in rstack-v2.1. No executable script, generated workplace copy, host setting or installed skill was modified. No build, lint, test, browser, agent evaluation, commit, push or deployment was run for this revision.
