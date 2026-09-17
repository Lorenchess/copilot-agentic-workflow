# Fable V2 — rule ownership

One canonical owner per cross-cutting rule. A **local reminder** is at most a few lines stating the role-specific consequence and pointing at the owner; it never carries the algorithm. If a reminder and its owner disagree, the owner is right and the reminder is a defect.

Maintainer document. Not a runtime input for any role.

Mechanism vocabulary is from `references/harness-map.md`. Script names are those the reconstructed rstack design names; no source has been inspected, so every "SCRIPT CHECK" below is a claim about a script, and "self-run" means the judged role runs it on itself.

| Concern | Canonical owner | Local reminders | Mechanical enforcement dependency |
|---|---|---|---|
| **Phase routing** (states, transitions, who dispatches whom) | `pipeline/SKILL.md` → States, Transitions | orchestrator: "find the row, dispatch"; planner: "you return; you never invoke the auditor" | Deterministic transition evaluator — none exists. Today: PROSE CONTRACT executed by the orchestrator |
| **Gate semantics** (`REVIEW_ELIGIBLE` vs `RELEASE_ELIGIBLE`, result vocabulary, `proceedable`) | `pipeline/SKILL.md` → Eligibility | tester: "you report a result, you do not evaluate eligibility"; approval: "re-evaluate it yourself; refuse without `review.md`" | A gate that evaluates the two predicates separately at one candidate. `gate.mjs` semantics (`PASS/BLOCKED`, scoped refusal, agent-typed `--suite-exit`) must be inspected before any mapping |
| **Candidate identity and freshness** (what stales what) | `pipeline/SKILL.md` → Candidate identity and freshness; shape in `handoff-contracts.md` → `candidate.md` | approval: freeze procedure, "record what HEAD is"; reviewer: "your review binds to this identity"; tester: "confirm HEAD equals the candidate" | A host- or tool-computed identity (commit + tree + lock revision) that agents read rather than type; lock tool must expose a revision id |
| **Artifact schemas** | `references/handoff-contracts.md` | each agent names the artifacts it writes and says "in the contract's shape"; no templates in agents | `ac-check.mjs`, `audit-response-check.mjs` (shape only). Column `sha` vs `candidate` to be confirmed against the real parser |
| **Write boundaries** (lanes, classes, per-artifact writers, exceptions) | `references/write-boundaries.md` | one "Lane" paragraph per agent; SKILL points only | `role-guard.mjs` + `boundaries.mjs`: SCRIPT CHECK, self-run, detect-after. Reviewer tool list: HOST-ENFORCED CAPABILITY. Guaranteed lanes need host-scoped write grants |
| **Test ownership** (only the tester writes tests) | `references/write-boundaries.md` §1 | tester opening lines; dev "Not tests or fixtures"; reviewer "a vacuous check is a Risk, never Act on" | Locked tests: `test-lock.mjs --verify`, cross-run at release. Unlocked tests: none — reading only |
| **Production ownership** (only dev writes production) | `references/write-boundaries.md` §1 | tester "revert it and report"; approval and planner lanes | `role-guard.mjs --role tester` self-run. Nothing prevents |
| **Test locking and amendment** | `references/write-boundaries.md` §6 (what the lock means); procedure in `rstack-tester.agent.md` | reviewer: three-case wording for a vacuous check; SKILL: "a test amendment changes the candidate" | `test-lock.mjs` (hash, assertion count, skip count). `--authorised-by` is typed text. Counts are a tripwire, not semantic proof |
| **External authorization** (request / authorization / record; what counts as an answer; which actions) | `references/approvals.md` §1–2 | process instructions: the floor list; estate template: three-line floor; approval: "one decision per action, naming the candidate" | A host authorization receipt an agent cannot write — not known to exist. Host ask-rules are friction only |
| **Human escalation** (when the run stops for a person; convergence stop) | `pipeline/SKILL.md` → Human checkpoints, Loops | orchestrator: "relay verbatim, never answer"; each role: its own stop conditions | None. HUMAN DECISION via the host conversation |
| **Publication** (exact-candidate push, PR body, checkpoint order) | `rstack-approval.agent.md` → Mode `release` (procedure); the rule that authorization is per action and per candidate is owned by `approvals.md` | SKILL: "publication authorization is stale when the candidate changes" | A guarded publisher that consumes authorization for the exact tuple — absent. Today: explicit-SHA push + re-check of HEAD, by prose |
| **Repository topology** (one writable repo, siblings, pin/verify, multi-repo tickets) | `references/estate-layout.md` | estate template: one-writable-repo paragraph; planner step 2; auditor/tester/approval run `--verify` | `estate-guard.mjs`: SCRIPT CHECK, detector, no attribution. Containment needs workspace/container permissions |
| **Evidence semantics** (rungs, AC verdicts, L4 bar) | the `prove-it` skill (outside this tree; source not supplied) | process instructions: evidence floor; SKILL: "VERIFIED at L4 or better"; tester: "never report a rung you did not reach" | `ac-check.mjs` evidence floor (rung number and shape, not truth). SOURCE DEPENDENCY: `prove-it`, `ac-matrix` |
| **Evidence capture** (what a suite capture must contain) | `references/handoff-contracts.md` → `suite.txt` | tester step 4 | Deterministic capture tooling — **none is named in the reconstruction**; capture is `AGENT_REPORTED` until supplied. `otel-trail.mjs` is the only agent-independent input |
| **Fresh-context isolation** (what a fresh role may receive) | `pipeline/SKILL.md` → Fresh roles | orchestrator dispatch rule; auditor and reviewer: "if sent X, say so and ignore it"; learnings: "never the auditor or reviewer" | Host-created isolated invocation with an input allowlist — absent. Today: dispatcher discipline; fresh roles are never reached by chat handoff |
| **Risk / depth** | `references/risk-tiers.md` | SKILL: "no tier removes a state"; tester: "at the depth the tier sets"; reviewer: "minimum breadth, never a ceiling" | None; judgement. `change-budget.mjs` is a reviewer lead only |
| **Learnings** | `references/learnings.md` (experimental, off by default) | orchestrator: "propose, never write"; fresh roles: ignore if sent | `learnings-check.mjs`, shape only, consumed by nothing |
| **Metrics provenance** | `references/discovery-cost.md` | orchestrator run-log paragraph; handoff-contracts: "the whole file is AGENT_REPORTED" | Host spans / session records (`otel-trail.mjs`, `chat-trail.mjs`) where they exist; otherwise `UNAVAILABLE` |
| **Instruction precedence** (semantic ownership vs host loading) | `references/instruction-precedence.md` | process instructions opening; estate template "same tier" line; dev "reconcile out loud" | Host behavior, observed per host and recorded in the adoption record |
| **Interview method** | `references/plan-interview.md` | planner: three consequences only | None; the plan audit reads the result |
| **Host approval settings** | `references/approvals.md` §3 | none | Installed settings fixture is the machine source of truth; `setup.mjs --fix-superseded` for drift |
| **Guarantee vocabulary** | `references/harness-map.md` | every file uses the four terms | — |
| **Global floor** (external effects, fetched content, evidence floor, gaps first) | `references/rstack-process.instructions.md` | estate template: three lines, deliberately, because that file loads without the pipeline being chosen | Loads only if the host loads it; see precedence |

## Deliberate duplications

These repeat a rule on purpose, each in a few lines, because an isolated role or a file loaded on its own would be unsafe without them:

1. The three-line floor in `estate-instructions.template.md`.
2. One "Lane" paragraph in every writing agent.
3. "If sent reasoning or learnings, say so and ignore it" in both fresh roles.
4. "No agent merges a pull request" in the process instructions, approvals and the approval agent.
5. The evidence floor in the process instructions (owner: `prove-it`).

Anything else found twice is a defect to remove, not a precedent.
