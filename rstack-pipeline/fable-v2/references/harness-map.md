# The harness map

An optional index. It defines no policy. It answers:

> Where is the rule, and what actually holds it?

If this map disagrees with a source it points to, the source wins and the map is fixed. It is not an agent, an artifact, a required input or a permission, and it is not proof that any control works.

## Guarantee vocabulary

Every rstack document uses these four terms and no stronger ones.

| Term | Meaning | What it cannot claim |
|---|---|---|
| **PROSE CONTRACT** | a role was told to | that anything stops it |
| **SCRIPT CHECK** | a script detects a violation and says so. Say who runs it: *self-run* (the judged role runs it on itself) or *cross-run* (a different role does) | prevention; trust in inputs the agent typed (an exit code, a scope marker, a name) |
| **HOST-ENFORCED CAPABILITY** | the host withholds the tool or permission | more than the host actually honours; untested until observed |
| **HUMAN DECISION** | a person answered a specific request | that an agent-written record of it authenticates that person |

Never write "the harness prevents", "enforced" or "guaranteed" for a PROSE CONTRACT or a self-run SCRIPT CHECK. A validator that finds a field present has validated the field. Parsing an agent-written file does not make its content observed.

## Authority map

| Concern | Canonical owner | What holds it today |
|---|---|---|
| States, transitions, loops, candidate freshness, eligibility, fresh-role inputs, human checkpoints | `pipeline/SKILL.md` | PROSE CONTRACT; `gate.mjs` as SCRIPT CHECK (self-run, agent-typed exit code) |
| Artifact shapes | `handoff-contracts.md` | SCRIPT CHECK for shape only: `ac-check.mjs`, `audit-response-check.mjs` |
| File-write lanes, exceptions, test lock | `write-boundaries.md` | reviewer tool list = HOST-ENFORCED CAPABILITY; `role-guard.mjs` self-run; `test-lock.mjs` cross-run at release |
| Authorization model, external actions, host approval settings | `approvals.md` | HUMAN DECISION + host ask-rules (friction, not isolation) |
| Repository topology | `estate-layout.md` | `estate-guard.mjs` = SCRIPT CHECK, detector only |
| Evidence rungs and AC verdicts | `prove-it` skill | `ac-check.mjs` evidence floor (shape and rung number, not truth) |
| Discrimination and pre-existing failures | `rstack-tester.agent.md` | `base-replay.mjs` SCRIPT CHECK, self-run |
| Depth | `risk-tiers.md` | PROSE CONTRACT |
| Interview method | `plan-interview.md` | PROSE CONTRACT; the audit reads the result |
| Semantic ownership vs host loading | `instruction-precedence.md` | host behavior, untested until observed |
| Global floor | `rstack-process.instructions.md` | loads only if the host loads it |
| Metrics provenance | `discovery-cost.md` | — |
| Cross-run memory (experimental) | `learnings.md` | `learnings-check.mjs`, shape only |
| Each role's method | that role's agent file | — |

Full ownership table with local reminders: `FABLE-V2-RULE-OWNERSHIP.md` (maintainer document, not runtime input).

## Scripts named by the reconstructed design

Source for none of these has been inspected. Names, flags and behaviors are as the reconstruction describes them; treat every row as a claim until the real implementation is read.

`gate.mjs` · `ac-check.mjs` · `audit-response-check.mjs` · `test-lock.mjs` · `base-replay.mjs` · `role-guard.mjs` · `boundaries.mjs` · `estate-guard.mjs` · `protect-artifacts.sh` · `change-budget.mjs` · `learnings-check.mjs` · `pipeline-metrics.mjs` · `otel-trail.mjs` · `chat-trail.mjs` · `doc-check.mjs` · `install-estate.mjs` · `setup.mjs` · `gen-copilot.mjs` · `resolve.sh` — plus the skills `principles`, `prove-it`, `ac-matrix`, `plainly`, `rstack-mode`, `docs`, `blast-radius`, `interrogate`, `estate-sweep`, `create-service-verifier`, and repository-root `HARNESS-LIMITS.md` / `HARNESS-LEDGER.md` for what has and has not been demonstrated on real runs.

No suite-capture tool is named anywhere in the reconstruction.

`otel-trail.mjs` is the only check whose input is not written by an agent. `NO CLAIM` from it means nothing was checked, never that the claim held.

## Maintenance

Change the owning source, then the script if one exists, then this map only if a pointer, owner or mechanism changed. No incident history, validator internals, lane tables or schemas here.
