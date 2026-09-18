# Harness map

This is a concise owner/compatibility index, not runtime proof. See SOURCE-EVIDENCE.md for direct screenshot findings and WORKPLACE-PORT.md for installation ownership.

## Guarantee vocabulary

Every mechanism is classified on two axes: its **guarantee type** (who or what holds it) and its **effect** (when it acts).

| Guarantee type | Meaning |
|---|---|
| PROSE CONTRACT | instruction to a role; no prevention established |
| DETERMINISTIC CHECK | a script or platform decides from objective state. SCRIPT CHECK — SCREENSHOT-SUPPORTED is the subtype whose executable branch is visible in a supplied screenshot; not executed here. Say who runs it: self-run (the judged role) or cross-run (another role or the host) |
| HOST-ENFORCED CAPABILITY | withheld capability or protected authority demonstrated on the target host; none newly verified here |
| HUMAN DECISION | exact human authorization; recorded names are not authentication; the record's provenance is `HUMAN_RECORDED` (`approvals.md`). By itself it has no enforced effect: a role obeying an answer is a PROSE CONTRACT, and only a separate host mechanism can enforce it |

UNVERIFIED is an evidence status, not a fifth guarantee type: it marks a mechanism whose implementation, wiring, runtime behavior or grant has not been supplied or observed.

| Effect | Meaning |
|---|---|
| BLOCK-BEFORE | the action cannot take effect: the capability is absent or the call is denied before execution |
| DETECT-AFTER | the action can take effect; a later check reports it. A detect-after check is never a sandbox, whatever runs it |
| OBSERVE-ONLY | records that something happened; neither prevents nor judges |
| — | no enforced effect: an instruction, an answer or a record that nothing in the host acts on |

Readable code supports a bounded static finding. Comments support intent/history claims only. Neither establishes installed-version identity, passing tests or actual dispatch.

## Mechanisms by guarantee type and effect

| Mechanism | Guarantee type | Effect | Condition |
|---|---|---|---|
| Reviewer without edit or terminal tools (frontmatter `tools`) | HOST-ENFORCED CAPABILITY | BLOCK-BEFORE | only to the extent the actual Copilot surface honours the configured tool list; UNVERIFIED until observed |
| Orchestrator's `agents` list limiting which roles it can spawn | HOST-ENFORCED CAPABILITY | BLOCK-BEFORE | same condition; the Markdown declares, the host enforces or does not |
| No role holds a PR-merge MCP tool | HOST-ENFORCED CAPABILITY, for that MCP tool path on the selected host only | BLOCK-BEFORE on that path only | terminal and API credentials are separate capabilities; withholding the tool does not remove them (`approvals.md`) |
| Host edit/terminal ask-rules | HOST-ENFORCED CAPABILITY, only while the covered call is actually withheld pending permission | BLOCK-BEFORE for the covered tool path only | an observed host gate, not a prose request to ask; friction, not containment; a shell write bypasses an edit-tool rule |
| `role-guard.mjs --role <r>` self-run | DETERMINISTIC CHECK, self-run | DETECT-AFTER | source UNVERIFIED |
| `test-lock.mjs --verify` at verification and release | DETERMINISTIC CHECK, cross-run | DETECT-AFTER | source UNVERIFIED; gate call sites pictured; a later detection blocks advancement, it does not undo the edit |
| `estate-guard.mjs --verify` | DETERMINISTIC CHECK, self-run | DETECT-AFTER | detector only; attributes nothing |
| AC checker and gate | DETERMINISTIC CHECK (SCRIPT CHECK — SCREENSHOT-SUPPORTED) | DETECT-AFTER | inputs are agent-supplied (`--suite-exit`, markers); they judge form and recorded values |
| Candidate, packet and plan digest comparisons | the comparison is an objective equality operation; that it was run, and that its inputs were captured, is PROSE CONTRACT | DETECT-AFTER when run | digests agent-measured; no independent assurance the comparison happened |
| Governance paths untouched | PROSE CONTRACT generally; HOST-ENFORCED CAPABILITY only on an observed, configured edit-tool path | BLOCK-BEFORE on that observed path only; otherwise — | terminal writes remain a gap; an unconfigured rule is not prevention |
| Fresh-role allowlist | PROSE CONTRACT | — | dispatcher discipline; host isolation UNVERIFIED |
| Auditor writes nothing | PROSE CONTRACT | — | it holds a terminal |
| Every lane paragraph in an agent file | PROSE CONTRACT | — | — |
| Human answer to a request; exception decision | HUMAN DECISION | — | the answer and its `HUMAN_RECORDED` transcription are not a technical blocker; a separate host mechanism may enforce it |
| Human-performed publication default | HUMAN DECISION plus PROSE CONTRACT | — | no agent capability is withheld by the default: the approval role still declares terminal and create-PR tools; the human's own credential authenticates the human to the platform, assuming the credential ownership assertion holds |
| Run log, result envelopes, OTel/chat trails | recording mechanism; provenance per producer (`discovery-cost.md`) | OBSERVE-ONLY | `otel-trail` is the only agent-independent input named |

Agent frontmatter `tools:` and `agents:` are HOST-ENFORCED CAPABILITY declarations only to the extent the actual Copilot surface honours them; the Markdown itself enforces nothing, and the adoption record must state what was observed (`team-adoption.md`).

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

Known gaps on the gate's exception path, from the screenshots; none is closed by this candidate, and each stays a release blocker for the exception route until its runtime patch is applied and observed:

| Gap | Evidence | Patch |
|---|---|---|
| Size, full-scope, reactor and trim-provenance checks are not applied to a waived red suite | E03, B2.3–6 | R1 |
| `proceedable` is computed before acceptances are classified and ignores unaccepted observations | E05, B3.8–9 | R2 |
| `waived_at_sha` is parsed but not compared with the candidate in the waiver classifier | E04, B1.8–9 | R3 |
| A waived test is matched by basename occurrence; nothing enumerates every failure, so attribution is incomplete | E04, E07, B2.3–4 | R3, R6 |

A waived red suite remains a failed suite. HELD is an overlay on passing checks, never a pending or lost execution.

Gate PASS is not proof of full semantic execution: missing OTel can be NO_CLAIM, runner-name matching is heuristic, tree markers are self-reported, and accepted capture gaps remain gaps. proceedable is weaker than the candidate's exception conditions. See RUNTIME-PATCH-PLAN.md.

## Remaining dependencies

Full role-guard, boundaries, test-lock, estate-guard, base-replay, protect-artifacts, OTel/chat-trail, generator, installer, prove-it, AC skill, models, hooks, auxiliary reviewers and invariant suites are unavailable. SCREENSHOT-SUPPORTED (B3.7, B3.9): in the photographed gate the NO_CLAIM branch adds an `otel` check with name, pass and detail only and no `inferred` entry, and the inferred list is built from each check's `inferred` property; so NO_CLAIM raises no observation-acceptance requirement in that version. Its correspondence to the workplace's installed version, and its runtime behavior, remain UNVERIFIED. Also not established: how gate, AC checker, lock and tree-digest resolve root and paths for a second checkout; whether the audit-response checker and metrics reader tolerate a leading envelope block in persisted audit/review files. No standalone capture wrapper was supplied; existence is unknown.

Do not delete or disable them because this review cannot inspect them. Map authored source before changing generated/installed output.
