# Harness map

This is a concise owner/compatibility index, not runtime proof. See SOURCE-EVIDENCE.md for direct screenshot findings and WORKPLACE-PORT.md for installation ownership.

## Guarantee vocabulary

| Label | Meaning |
|---|---|
| PROSE CONTRACT | instruction to a role; no prevention established |
| SCRIPT CHECK — SCREENSHOT-SUPPORTED | executable branch visible in a supplied screenshot; not executed here |
| HOST-ENFORCED | withheld capability or protected authority demonstrated on the target host; none newly verified here |
| HUMAN DECISION | exact human authorization; recorded names are not authentication |
| UNVERIFIED | implementation, wiring, runtime behavior or evidence not supplied/observed |

Readable code supports a bounded static finding. Comments support intent/history claims only. Neither establishes installed-version identity, passing tests or actual dispatch.

## Owners

| Concern | Owner | Mechanism/limit |
|---|---|---|
| Routing, candidate freshness, review/release | pipeline/SKILL.md | prose; no state evaluator supplied |
| AC shape and CLI outcome | actual ac-check.mjs; reference schema matches photographed columns | screenshot-supported parser/CLI; semantics not independently executed |
| Gate checks | actual gate.mjs | screenshot-supported branches; self-authored logs, optional host adapter |
| Artifact transport | handoff-contracts.md | proposed packet/result schema; adapter adoption required |
| Lanes and lock | write-boundaries.md plus actual role/lock scripts | script internals unavailable; gate invokes lock verify/paths |
| Human authority | approvals.md and actual host conversation | names are records; receipt mechanism unverified |
| Universal policy | rules/standing-rules.instructions.md | host loading unverified; compact reminders elsewhere |
| Topology and search | estate-layout.md; skills/estate-sweep/SKILL.md | pictured sweep instructions; sweep/estate scripts unavailable |
| Model routing | actual generator/config, once traced | seven candidate pins are declarations, not observed dispatch |
| Optional metrics/memory | discovery-cost.md / learnings.md | no runtime savings established |

## Gate interface to preserve

The pictured gate accepts --issue, --suite-exit, --suite-log, optional --ac for a single issue, --json, and an OTel database override. Exit 0 = PASS; 1 = BLOCKED or HELD; 2 = usage/environment error.

JSON includes verdict, checksVerdict, proceedable, checks, inferred, accepted, expiredAcceptances, staleAcceptances, unaccepted, issue, issues, sha. Preserve fields; do not rename PASS to review eligibility.

HELD means all checks pass but an inferred observation is unaccepted. Unknown/pending execution is a separate workflow blocker. Acceptances can restore script PASS; report their continuing evidence limitations.

Gate PASS is not proof of full semantic execution: missing OTel can be NO_CLAIM, runner-name matching is heuristic, tree markers are self-reported, and accepted capture gaps remain gaps. proceedable is weaker than the candidate's exception conditions. See RUNTIME-PATCH-PLAN.md.

## Remaining dependencies

Full role-guard, boundaries, test-lock, estate-guard, base-replay, protect-artifacts, OTel/chat-trail, generator, installer, prove-it, AC skill, models, hooks, auxiliary reviewers and invariant suites are unavailable. No standalone capture wrapper was supplied; existence is unknown.

Do not delete or disable them because this review cannot inspect them. Map authored source before changing generated/installed output.
