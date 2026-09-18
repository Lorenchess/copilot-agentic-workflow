# Write boundaries

The canonical answer to one question:

> Which role may write which class of file — and what actually holds it to that?

Git operations and external actions: `approvals.md`. Repository scope: `estate-layout.md`. Artifact shapes: `handoff-contracts.md`.

## 1. The two invariants

1. **Only the tester writes tests.**
2. **Only the developer writes production source.**

The role that writes the implementation must never be able to rewrite the check that judges it, and the role that writes the check must never write the behavior that satisfies it. Everything else in this file serves those two lines.

## 2. Lanes

| Role | Run artifacts | Tests | Production | Build/config | Governance |
|---|---|---|---|---|---|
| `rstack-orchestrator` | own files only | no | no | no | never |
| `rstack-planner` | own files only | no | no | no | never |
| `rstack-plan-auditor` | none | no | no | no | never |
| `rstack-tester` | own files only | **write** | no | no | never |
| `rstack-dev` | none | no | **write** | no | never |
| `rstack-reviewer-architect` | none | no | no | no | never |
| `rstack-approval` | own files only | no | no | no | never |

Artifact writers, path by path:

| Artifact | Writer |
|---|---|
| `meta/ticket.md`, `plan/plan.md`, `plan/plan-audit-response.md` | planner |
| `ac.tsv` | planner seeds; tester writes the evidence columns |
| `evidence/red.txt`, `suite.txt`, `test-report.md`, `impact.md`, `review-packet.md` and the immutable `evidence/attempt-<N>/` directories, each holding its captures, that attempt's review packet and `inputs/` — byte-identical copies of the mutable files the packet relies on, including other roles' artifacts, which the tester copies and never edits | tester |
| `evidence/suite-waivers.tsv` | the replay tooling, run by the tester after a recorded human decision; never hand-written |
| `evidence/observation-accept.tsv` | a human, by hand; `governance` class |
| `candidate.md` and its `candidate-round<N>.md` archives, `comparison/round-<N>/` (candidate comparison packet), `approval/approval.md` (append-only entries) | approval |
| `plan/plan-audit.md`, `review/review.md` and their round archives | the host, from the read-only role's reply; failing that, the orchestrator as verbatim transcriber. **Never the planner, tester or developer** |
| `meta/decisions.md` | orchestrator for relayed exceptions; never the requester; approval records its own direct commit/publication answers in approval.md |
| `logs/run-log.tsv`, `logs/results/<N>.md` (each role's complete reply, saved verbatim, never overwritten) | orchestrator |
| `.rstack/learnings.md` | a human (experimental; `learnings.md`) |
| `.doc/<KEY>.md` | orchestrator, only while the human-invoked `docs` skill runs |

## 3. File classes

One classifier (`boundaries.mjs` in the reconstructed design) owns the class globs; they are not repeated in agents or other references.

- **`governance`** — the installed pipeline (the delivered `.github/` copy: skills, agents, instructions, hooks), permission policy, plugin manifests, `.rstack/boundaries.json`, `evidence/observation-accept.tsv`. No role writes it; no exception crosses it; a repository override that tries to declare it is an error. Changing it is maintenance of rstack, outside any run.
- **`artifact`** — `.rstack/runs/<KEY>/**`, narrowed by the table above.
- **`test`** — repository tests and test-only fixtures. Defaults cover common layouts; a repository extends them in `.rstack/boundaries.json`. An empty class in that file is refused: it would silently move every test into `production`.
- **`build`** — build definitions, dependency manifests, runner and workflow configuration. They decide how evidence is produced, so no implementing role holds them by default.
- **`production`** — everything tracked and unclaimed. The safe fallback: an unknown path is judged, not ignored.
- **`local`** — files a repository declares machine-local for its whole life (not "whatever is dirty today"). Reported, never judged, never staged. A known hole: a wrong `local` glob hides real source, so inspect the classifier's output before a repository's first run.

A repository override may define `test`, `build`, `artifact` and `local` only.

## 4. Exceptions: request, authorization, record

A role never waives the rule that constrains it. For a write outside its lane:

1. **REQUEST FOR EXCEPTION** — the role stops and names the exact path, the change, and why the owning role cannot make it. A request is not permission.
2. **HUMAN AUTHORIZATION** — a human answers that specific request (`approvals.md` defines what counts as an answer).
3. **RECORDED DECISION** — a *different* role writes the human's words into `meta/decisions.md`. The requesting role then makes only that write and cites the record.

No exception crosses `governance`.

Be honest about what step 3 is: text written by an agent. It records that a decision was reported; it does not authenticate the human, and a validator that finds the field present has proved only that. The primary evidence is the host's own conversation record.

The reconstructed `role-guard.mjs` accepts `--waiver "<path>=<reason>"` from the constrained role itself, exits 0, and logs to `.rstack/shared/boundary-waivers.tsv`. That is a self-issued visibility note, not authorization; under this contract a role does not use it on itself. ENFORCEMENT DEPENDENCY: a guard that refuses an out-of-lane write unless an authorization exists that the constrained role could not have created.

## 5. What actually holds each boundary

The mechanisms below are reconstructed requirements. Runtime source, invocation and actual host grants remain UNVERIFIED except for the call sites identified in SOURCE-EVIDENCE.md.

Guarantee types and effects are defined in `harness-map.md`: HOST-ENFORCED CAPABILITY, DETERMINISTIC CHECK, PROSE CONTRACT, HUMAN DECISION; BLOCK-BEFORE, DETECT-AFTER, OBSERVE-ONLY, and `—` for no enforced effect. This table applies that one vocabulary to the lanes; it defines no second one.

| Boundary | Intended mechanism | Guarantee type | Effect |
|---|---|---|---|
| Reviewer writes nothing | frontmatter `tools` without edit or terminal tools | HOST-ENFORCED CAPABILITY, only to the extent the actual Copilot surface honours the configured list; UNVERIFIED host grant until observed | BLOCK-BEFORE, if honoured |
| Orchestrator spawns only the six named roles | frontmatter `agents` list | HOST-ENFORCED CAPABILITY on the same condition; the Markdown declares, it does not enforce | BLOCK-BEFORE, if honoured |
| Auditor writes nothing | it was told not to; it holds a terminal | PROSE CONTRACT | — |
| Planner, tester, dev, approval lanes | the role runs `role-guard.mjs --role <r>` on itself before reporting (exit 0 in lane, 1 out of lane with paths, 2 usage/environment) | DETERMINISTIC CHECK, self-run: detects an honest mistake afterwards; prevents nothing | DETECT-AFTER |
| Orchestrator's file list | it lists what it wrote | PROSE CONTRACT — the guard sees one `.rstack/**` bucket and a whole working tree, so the orchestrator and the auditor do not run it | — |
| Dev did not touch a locked test | lock verification by the tester and again at release | DETERMINISTIC CHECK, cross-run; a later detection blocks advancement, it does not undo the edit | DETECT-AFTER |
| Dev did not touch an **unlocked** test | the tester's and reviewer's reading | PROSE CONTRACT | — |
| Governance paths untouched | prose; plus a host edit-tool ask-rule only where one is observed to be configured | PROSE CONTRACT generally; HOST-ENFORCED CAPABILITY on an observed, configured edit-tool path only; an unconfigured rule or a prompt is not prevention; a shell write bypasses it | BLOCK-BEFORE on that observed path only; otherwise — |
| Out-of-lane write needs a human | request, human answer, record by another role | HUMAN DECISION; the record is `HUMAN_RECORDED`; neither the answer nor its record is a technical block, and a separate host mechanism may enforce it | — |

A guard is a detector: DETECT-AFTER is never a sandbox. It cannot undo an escaped write, and a check an agent runs on itself is weaker than one a different role or the host runs. A guaranteed lane needs host-scoped write grants, which are BLOCK-BEFORE and are recorded in the adoption record only once observed.

## 6. Test lock

UNVERIFIED IMPLEMENTATION: the following are required candidate invariants from reconstructed contracts. The lock source has not been supplied; gate screenshots only show calls to --verify and --paths. Do not claim its hashing/amendment/skip implementation has been inspected.

Role separation stops the developer editing tests; it does not stop the tester weakening its own test after red. The lock (`test-lock.mjs`) records each locked test while it is red: content hash, assertion count, skip-marker count.

At verification: changed content fails unless an amendment matches that exact revision — a further edit after an amendment fails again; a new skip marker fails, and no amendment can license one; a deleted test fails; an empty or header-only lock fails. A drop in assertion count is refused when the amendment is created.

Counts are a tripwire, not proof of strength: whether a test still means what it meant is the reviewer's judgement.

An amendment changes the definition of done. It follows section 4 exactly — the tester requests, a human decides, another role records — and the lock tool's `--authorised-by` value is typed text, not a signature.

## 7. Pre-existing work

This baseline may attribute writes, but it does not establish candidate execution. Final verification/review uses committed inputs with unrelated changes excluded under the skill's rule. Actual estate/role-guard baseline implementations remain UNVERIFIED.

Preferred: the run starts on a clean active-repo tree. Where the human keeps unrelated dirty files, the pin taken in state 1 records each dirty path with its content hash, and a later check excludes a path only while its bytes still match; a role that changes it further brings it into the run. No pin, no exclusions. The pin is taken before any role writes outside `.rstack/`, so it cannot absorb pipeline writes. This baseline is tool-owned (`estate-guard.mjs --pin` feeds `role-guard`); this file only states what it must mean.

## 8. Editing and deletion

Never emulate an edit by deleting and recreating a file. A whole-file tool overwrites in one operation. A deletion the plan names, in a class the role owns, as the intended end state, is allowed; a shell delete used to get an edit through is the signal to stop and report the missing capability.
