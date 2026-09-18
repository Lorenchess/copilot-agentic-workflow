# Validation status and workplace plan

## Current status

Two dated static-inspection records follow: the rstack-v2.1 record, kept as written, and the round 2.2 record further down. Neither round executed anything.

This task performs document/source comparison and static artifact inspection only. Builds, lint, tests, browser checks, agent evaluations, runtime script execution and workplace deployment are NOT RUN.

Static inspection completed on 2026-09-17 (rstack-v2.1 record; counts describe that task, not this folder):

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

## Round 2.2 static inspection (2026-09-17)

Performed on this folder after the round 2.2 edits. Document checks only; builds, lint, tests, browser checks, agent evaluations, runtime scripts and workplace deployment remain NOT RUN.

- Starting point verified: `claude-v2.2` was created as a copy of `rstack-v2.1` and all 32 files matched by SHA-256 before any edit.
- Preservation: all 105 files that existed under `rstack-pipeline/` before this round (originals, ChatGPT reviews, claude-v2, rstack-v2.1) were re-hashed after the edits and match their recorded SHA-256 values. Git cannot show this work because `rstack-pipeline/` is ignored; files were compared directly.
- Inventory against v2.1: 21 files changed, 11 unchanged, 2 added, none deleted. Per-file hashes are in `CLAUDE-CHANGE-MANIFEST.md`.
- Local Markdown links resolve; fenced code blocks are balanced in every file.
- Every role-result token used in agents, skill, references, rules, hooks and skills belongs to the token list in `references/handoff-contracts.md`; no unlisted `VERIFY_*`, `RELEASE_*` or `STATE_*` token exists.
- Photographed interface strings are byte-identical in the v2.1 and v2.2 handoff contracts: the eight-column AC header, both exception TSV headers, the five suite markers and the raw-log marker, the tree-marker syntax, the five impact headings, and the rule that WORKTREE is never a sha value. Gate exit codes and the JSON field list in the harness map are unchanged.
- No command in an operational file still depends on a plugin environment variable, and the phrases "ignore it if sent" and "materially different" no longer occur.
- One run was traced by reading, state by state, for a defined result, writer, path and next state. This is a reading, not an execution; it cannot show that any agent behaves as written.

Not checked, because it cannot be from documents: parser acceptance of any proposed field or layout, host loading of any instruction file, tool grants, isolation of fresh roles, stash and index behavior on real user work, publication reconciliation against a real remote.

### Additional workplace checks raised by round 2.2

| Area | Smallest meaningful evidence |
|---|---|
| Result transport | A role returning STOPPED without an owned blocker, or a Result outside the token list, stops the run; a complete failing suite is recorded as VERIFY_RECORDED with Suite FAILED, not as an unknown execution |
| Fresh-role persistence | Real audit-response checker and metrics reader run against a plan-audit.md that begins with the envelope block; if either rejects it, confirm the body-only form |
| Owner-first routing | An in-run regression at candidate returns to dev and is not sent to review; a replay-supported pre-existing failure and an UNKNOWN-attribution failure both reach review with their status disclosed |
| Scoped-review option | After a CLEAN scoped review and a full run, release evaluation refuses the first review and accepts only a review citing the full packet's attempt path and digest |
| Packet immutability | A second attempt leaves `evidence/attempt-<N>/review-packet.md` of the first untouched; the current copy equals the newest by hash |
| Approval record | A release entry appended after a freeze entry leaves the freeze entry's commit decision intact |
| Reviewer inputs | A reviewer with read/search tools only can read patch and base versions from `comparison/round-<N>/`; a packet lacking them yields INPUT_BLOCKED |
| Freeze protection | Repository where `.rstack/` is not ignored: freeze stops before any untracked sweep. Unrelated untracked source is absent from the execution checkout during candidate verification. A human-made commit that differs from the approved diff stops the freeze |
| Restoration | Run stopped at review with work held: report names the identity and asks once; keep-held leaves the checkout clean; restore-now followed by resume forces re-protection before any candidate-dependent step |
| Unknown publication | Session ended between intent and result: next dispatch finds the intent without result, reads the remote ref, and neither retries blindly nor records success |

## Correction round after the independent review (2026-09-17)

Independent review verdict: CHANGES REQUESTED, five findings (R22-01 to R22-05). This section records the static checks made after correcting them in place. Nothing was executed; every earlier NOT RUN item stays NOT RUN.

- All files under `rstack-pipeline/` were hashed before the round (141 files, including the new root README and `reviews/`). After the round, every file outside `claude-v2.2` re-hashed identical. Inside `claude-v2.2` the changed, unchanged and added sets and their hashes are in `CLAUDE-RESPONSE-2026-09-17-R22.md`. The round 2.2 report and manifest were not edited.
- Local Markdown links resolve; fenced blocks balanced; every role-result token is in the contract's list; the eleven photographed interface strings, gate exit codes and JSON field list are unchanged.
- Every `node` command template in an operational file has its script path inside double quotes.
- R22-01 acceptance case walked by reading: after a second attempt and second candidate replace every current file, each path in the first packet is under `evidence/attempt-1/`, `comparison/round-1/` or an archive name, none of which a later round writes.
- R22-02: the two WORKTREE rows, the two candidate rows, the explanatory paragraph and approval's freeze precondition were read together; an in-run-owned failure has exactly one next state at each target.
- R22-03: the predicate, envelope line, dispatcher duty, auditor duty and approval comparison were read together; a plan edited without a revision bump now changes a compared digest.
- R22-05: B3.7 and B3.9 were opened and read; the recorded fact matches the reviewer's reading.

Added workplace checks:

| Area | Smallest meaningful evidence |
|---|---|
| Immutable packet inputs | Two attempts and two candidates in a disposable repository; every path in attempt 1's packet still hashes to its recorded value |
| Audit bound to plan bytes | Plan edited after a `holds` audit with no revision bump: review eligibility and release evaluation both refuse; auditor given a wrong dispatched digest returns STOPPED |
| Owner-first at WORKTREE | Locked checks pass, a nonlocked regression attributed to the change: run returns to dev and freeze is not dispatched; approval refuses to freeze if dispatched anyway |
| Quoted script paths | Installation directory containing a space: each documented command runs as one script argument |
| NO_CLAIM in the installed gate | Installed gate source compared with B3.7/B3.9; only if it differs does the OTel question reopen |
