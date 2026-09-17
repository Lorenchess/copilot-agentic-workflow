# Validation status and workplace plan

## Current status

This task performs document/source comparison and static artifact inspection only. Builds, lint, tests, browser checks, agent evaluations, runtime script execution and workplace deployment are NOT RUN.

Static inspection completed on 2026-09-17:

- 32 new Markdown files read back as UTF-8 and matched the authored candidate text.
- No unclosed fenced code blocks or unresolved local Markdown links were found.
- All 207 pre-existing files matched their recorded SHA-256 hashes; none was changed.
- The photo index covers all 44 supplied images. Targeted consistency review checked AC schema, gate semantics, packet ownership, result transport and authorization provenance.
- Git reported no tracked changes; rstack-pipeline remains excluded by the repository's existing ignore rule.

These are document/preservation checks. They do not validate workplace runtime execution, parser behavior or host enforcement.

Behavioral improvement, cost reduction and host enforcement remain NOT MEASURED / UNVERIFIED.

## Authorized workplace checks to select later

| Area | Smallest meaningful evidence |
|---|---|
| Gate compatibility | Real CLI JSON and exit results for PASS, HELD, BLOCKED and tool error; preserve current fields |
| Waived red suite | Full/scoped/unknown scope; stale candidate/base; extra unwaived or locked failure; malformed/missing replay; unaccepted inference |
| AC readiness | Exact header; real SHA; below-L4 waiver; stale/missing/garbled evidence; every ticket checked |
| Capture and scope | Actual wrapper/runner output, marker values from same invocation, incomplete/unknown execution, raw trim provenance, module/profile selection |
| Lock execution | Real lock path/contents, amendment behavior, skip/rename and runner identity; passing name occurrence must not substitute for execution |
| Candidate basis | Clean committed inputs vs unrelated dirty/untracked config, ignored dependencies, mutation during run, no-code candidate |
| Review freshness | Complete base/candidate diff including deletion/rename; packet mutation and same-SHA rerun invalidate old review |
| Audit/routing | Revised conditional plan always re-audited; malformed result stops; lost execution reconciled; nonlocked known-red can get diagnostic review but cannot get clean release |
| User-work preservation | Unrelated staged path, mixed hunk, no-op stash, existing stash, merge conflict, exact non-dropping restoration |
| Unknown publication result | Read-back reconciliation before retry; no duplicate PR or overwrite of a different existing target |
| Host and source delivery | Generator destinations, actual instruction loading, fresh-role context/grants, direct and child hooks, no permissive settings inference |
| Estate search | Direct/grouped layout, extension exclusions, stale checkout, hit that is comment-only, partial vs no-detail truncation, wire consumer |
| OTel | Missing/corrupt store, genuine agreement/contradiction, model-family/version limit, overlapping timestamps and retention |
| Privacy | Diagnostic probe contains no raw sensitive payload; controlled file permissions; retained evidence accessible only as approved |

Apply the concrete cases in RUNTIME-PATCH-PLAN.md to actual existing tests where possible. Avoid tests that merely search for the name of the condition being implemented. No full product suite is required for a documentation-only slice unless the actual repository's authorized process needs it.

## Candidate workflow dry run

After source mapping and approval, use a disposable repository to walk one failing criterion through plan/audit, discriminating red/lock, production fix, WORKTREE verification, freeze, candidate full verification, packet review and blocked publication checkpoint. The dry run ends before a real external write.

Separately exercise one deliberate missing outcome and one observed pre-existing nonlocked failure. Confirm neither is silently converted to PASS, and that a reviewer sees complete evidence with exact candidate/packet identity.

Observe the actual host and subprocess outputs. A role's own summary is AGENT_REPORTED; missing instrumentation is UNAVAILABLE.

## Behavioral evaluation

Use the optional eval-skill only when explicitly authorized. Compare representative equivalent tasks under paired/balanced conditions with a hidden rubric/variant identity. One fresh judge compares both anonymized arms, and a human inspects the work. Score decisions and measured outcomes, not vocabulary or instruction citations.

Record sample size, uncertainty, regressions and time/tool cost. A single improved transcript does not establish a general win. Promotion remains a separate owner decision.
