---
name: pipeline
description: "Deliver a ticket through planning, independent plan audit, RED tests, implementation, verification, independent review, and human-controlled publication. Use for /pipeline or a ticketed change with acceptance criteria."
menu-description: plan, audit, test, implement, verify, review, prepare approval
---

# Pipeline

> Refactoring candidate, not an installed replacement. Derived only from
> [the latest screenshot transcription](pipeline-SKILL.original-latest.md).
> Four source passages are incomplete. The maintainer note records them, the
> proposed corrections, and the decisions required before workplace adoption.

Use separate roles to define checks, implement the change, and judge the result.
Advance on the required artifacts and gate verdicts. The implementer's phase-3
report permits independent measurement in phase 4; it does not prove completion.

Read `principles` in full, `prove-it`, and `ac-matrix` before phase 1. Use their
evidence vocabulary and contracts rather than inventing local substitutes.
For a read-only question, unticketed defect, or behavior-preserving restructure,
use the investigation, bug-fix, or refactor playbook through `rstack-mode`.
If acceptance criteria cannot be settled with anyone, stop instead of inventing them.

## 1. Start the run and establish its scope

One ticket is the normal unit of work. Related stories may share a branch named
for the primary key, a plan, suite run, review, and PR, but retain one matrix and
verdict per ticket. Pass comma-separated keys, primary first, to the orchestrator
and `gate.mjs --issue A,B,C`; all matrices must pass. Prefix each commit with the
key whose work it carries. Handle unrelated tickets separately.

### Phase 0: inspect, prepare, then ask once

| Check | Action |
|---|---|
| Current repository | `git rev-parse --show-toplevel` |
| Sibling repositories | `estate-guard.mjs --list`; identify moved or absent siblings |
| Artifact protection | Run `protect-artifacts.sh` in the selected repository; this writes local exclusions |
| Unrelated work | `git status --porcelain`, excluding `.rstack/learnings.md` from the unrelated-work count |
| Verifier | Look for a `verify-<service>` skill with a feature map |
| Previous observations | Read `.rstack/learnings.md` if present; absence is acceptable |

At an estate root, defer the last four checks until phase 1 pins the active
repository. Do not inspect an arbitrary child as a substitute. Once the active
repository is settled, apply these checks there before repository-dependent work.
Missing or moved siblings are unresolved evidence, not permission to guess a path.

Classify results as GREEN (no narration), HEAL (perform the specified local
preparation), or ASK (a human decision). Bundle the applicable stash and verifier
questions into one numbered message with stated defaults. Do not repeat a question
already settled. This limits phase-0 questions only; it does not replace the
planner's mandatory interview or later approval decisions. It is a prose contract.

- Unrelated work: name it, ask before stashing, and promise restoration. Default:
  leave it untouched pending an answer. Label an approved stash with ticket and
  run, record its exact ref in a phase-0 `run-log.tsv` row, and restore it as the
  run's last act after phase 6. Report whether restoration was clean. On conflict,
  stop and report that the stash remains. Phase 6 owns its own, separate stash.
  Never use `git stash drop` or `git stash clear` as cleanup.
- Missing verifier: offer `create-service-verifier` once, unless already declined
  this session. Default: do not build one without agreement. Use the offer below,
  naming the actual caller surface and the work it entails. A browser-only frontend
  needs a browser harness; do not describe that as a small service adapter.

> This repo has no verifier: no scripted way to start it, drive it as a caller does, and capture what it did. Tests still reach L4 for the behaviour they exercise. What they cannot reach is behaviour only visible in the running service, and a criterion about that would be recorded at a lower rung with the gap stated rather than proven. Building one for this repo would mean <the surface a caller actually touches here>. Want that first, or proceed and let any such row say so honestly?

A declined verifier does not stop investigation or testing, waive an AC, or make
unreached behavior proven. A test is L4 for behavior it asserts and L1 for everything
else under the source's ladder; missing verification reach does not demote every test.

### Phase 1: select the writable repository after reading the ticket

The planner probes at Step 0, reads the ticket at Step 1, opens the mandatory
interview at Step 2 with **which repositories the ticket touches**, then resolves
and pins the active repository at Step 3. Evidence each candidate from the ticket;
identify missing clones and criteria this run cannot cover. Exactly one repository
is writable; siblings are read-only. Record the active repository in `plan.md` so
every later phase and the driver use the same working directory.

Run deferred setup there. Artifact protection uses:

```bash
bash "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/protect-artifacts.sh
```

It excludes the six run subdirectories `meta/`, `plan/`, `evidence/`, `review/`,
`approval/`, and `logs/` under `.rstack/runs/*/`, plus `.rstack/shared/`,
`.rstack/decisions/`, `.rstack/scratch/`, and `.doc/`, through `.git/info/exclude`.
Do not edit tracked `.gitignore` or exclude `.rstack/runs/` itself: `ac.tsv` must
remain committable. The script checks both ignored and committable paths.

## 2. Dispatch and route by the result

The lead owns dispatch and handoffs, or delegates that work once to
`rstack-orchestrator`. Dispatch using `Agent subagent_type: "<agent-name>"`.
Each agent pins its model; allocation is recorded in `models.json`. Do not pass
`model` on calls by default or override it without a stated reason. Model names
are deliberately not duplicated in this workflow.

| Phase | Agent | Required work and next route |
|---|---|---|
| 1 | `rstack-planner` | Save the tracker ticket verbatim, settle falsifiable ACs and named checks, get confirmation of any AC absent from the ticket, seed the matrix, create the local branch, and write the plan. Then 1b. |
| 1b | `rstack-plan-auditor` | In fresh context, re-derive the plan's existing-code claims from primary evidence, running Git itself. `holds` advances to 2; `holds-with-conditions` advances only after every `CONDITIONAL` assumption is recorded in the plan. `refuted` returns to 1. `undetermined` or no audit stops for a human decision. |
| 2 | `rstack-tester` | Write each new AC check, run it, read and state the reason it fails, save RED evidence, and create the test lock before 3. See the verification-only limitation below. |
| 3 | `rstack-dev` | Implement the smallest production change per unit without changing tests. Report green units and the command run, then hand to 4 for independent verification. |
| 4 | `rstack-tester` | Run the suite, fill the matrix, capture impact evidence, and run the gate. Normal advancement to 5 requires `GATE: PASS`, all ACs `VERIFIED` at L4+, and impact evidence. Route `GATE: BLOCKED` to its named owner. |
| 5 | `rstack-reviewer-architect` | In a new context on every invocation, judge the diff, tests, and impact against the plan. Production `CHANGES REQUESTED` returns to 3; uncovered `RISKS` or nondiscriminating tests return to 4. `CLEAN`, no remaining Act on findings, and every named risk covered by a test permit 6. |
| 6 | `rstack-approval` | Re-open artifacts, protect the tree, integrate once, and return to 4 for full verification at the merged SHA. Resume approval only with applicable review and verification evidence; prepare the issue-prefixed message and human decisions. See section 5. |

If the host cannot honor the planner's auditor delegation, the lead dispatches
1b with the sanitized brief. Never silently omit the audit. The driver writes
`plan-audit.md` verbatim from the auditor's reply; the planner never writes it.

Pass artifact paths, not reasoning narratives. The auditor does not receive the
planner's reasoning. Phase 5 receives only the branch, plan, matrix, and impact
evidence; it is never resumed from an implementation or tester context. Neither
independent role receives the learnings path. These input limits are not enforced
by a write guard.

The risk tier changes phase-4 impact-search breadth and phase-5 review depth,
not phase selection. Ratchet it up, never down, on a budget overrun, a consumer
outside the changed unit, or an audit contradicting scope; record why in the run log.

Verification-only tickets follow `1 -> 1b -> 2 -> 4 -> 5 -> 6`, recording phase 3
as `skip: <reason>`. Review still judges whether the tests discriminate. The source
does not resolve how already-shipping behavior meets the new-test RED requirement;
do not fabricate RED evidence or silently waive that gate. Resolve this with the
human before proceeding past the affected gate. Any other skipped phase or gate
is a finding to escalate and lead with in the report, not an authorized shortcut.

Rework continues until proof and review requirements hold. No iteration budget
turns an unproven AC into an acceptable one. Escalate nonconvergence without
lowering the bar. For a reviewer finding about a locked test, the tester follows
the human-authorized amendment path, runs the discriminating check, and sends an
actual failing behavior to the developer; the developer cannot repair test code.

## 3. Keep ownership and artifacts explicit

Paths below are relative to `.rstack/runs/<KEY>/` unless shown otherwise.

| Artifact | Writer / responsibility | Committed |
|---|---|---|
| `ac.tsv` | Planner seeds; tester fills and re-stamps from observed evidence | Yes |
| `meta/ticket.md` | Planner; verbatim tracker content | No |
| `plan/plan.md` | Planner | No |
| `plan/plan-audit.md` | Driver; auditor's reply verbatim | No |
| `plan/plan-audit-response.md` | Planner after revising the plan | No |
| `evidence/`, including `impact.md` | Tester captures; reviewer judges impact | No |
| `evidence/test-report.md` | Tester; only when a run failed | No |
| `review/review.md` | Reviewer; orchestrator or lead transcribes verbatim | No |
| `approval/approval.md` | Approval | No |
| `.rstack/learnings.md` (repository root) | Orchestrator only | Repo team's decision |

Use `references/handoff-contracts.md` for schemas. Stop on a malformed handoff;
do not infer missing fields. The detailed write-lane table belongs only in
`references/write-boundaries.md`. Tester owns tests; developer owns production
code; auditor and reviewer are read-only. Check the applicable writing role with:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/role-guard.mjs --role <planner|tester|dev|approval>
```

The source describes the reviewer's `Read, Grep, Glob` tools as host-enforced.
Role self-checks are weaker than a sandbox. A justified out-of-lane change needs
a reasoned waiver in `.rstack/shared/boundary-waivers.tsv` and disclosure in the
report, following the canonical boundary contract.

## 4. Preserve the definition of done and measure the result

After phase 2 captures the right RED failure, pin the tests:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/test-lock.mjs --create --issue <KEY> \
  --red-evidence .rstack/runs/<KEY>/evidence/red.txt \
  --map "<test-path>=AC-1,AC-2"
```

The lock records hashes, assertion counts, and skip-marker counts. Gate failures
include hash drift, added skip markers, deleted locked tests, and a header-only
lock. An amendment authorizes only its recorded revision; later edits still fail.
Unamended drift belongs to the implementer to revert; post-amendment drift needs
new human authorization. `--amend` refuses fewer assertions or added skip markers
and requires a reason, `--authorised-by` naming the approving human, and an
`rstack-amend:` note in the test. The gate does not re-count assertions after a
matching hash. No amendment licenses a new skip marker.

`change-budget.mjs` judges production-line changes and measures test lines without
budgeting them. Preserve useful checks; this is not a reason to add redundant tests.

Run the repository's published suite command. Full suite is the default on loop
passes and mandatory after integration. A scoped loop run is allowed only after
the tester has timed both scopes in this repository and reported the comparison.
Record scope in the suite log. A scoped run cannot receive `GATE: PASS` and cannot
be presented as satisfying the normal phase-4-to-5 gate.

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/gate.mjs --issue <KEY> \
  --suite-exit <N> --suite-log .rstack/runs/<KEY>/evidence/suite.txt
```

Read the actual checks from `gate.mjs --json`; do not maintain another checklist
here. Normal `GATE: PASS` routes to phase 5, not directly to approval. The explicit
post-integration return is covered in section 5. A passing sibling check never
covers a failing one. `phase-results` is described as rejecting missing or
unresolved plan audits that advanced regardless.

The source's host-span check reads the host store directly and compares it with
agent-written `run-log.tsv`, including model claims. Inspect it with
`otel-trail.mjs --verify --issue <KEY>`. Missing recording, an unsupported host,
or expired records yield `NO CLAIM`, not corroboration. Contradictions must surface.
Agent-written evidence and self-checks do not become independent host evidence.

### Pre-existing suite failures remain blocked

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/base-replay.mjs --issue <KEY> \
  --suite "<the command>" --mode pre-existing --test <path> \
  --reason "<why this is not this ticket's to fix>" --authorised-by "<the human who agreed>"
```

Only a `PRE-EXISTING` replay writes `evidence/suite-waivers.tsv`. A valid waiver
leaves the verdict `BLOCKED`, changes ownership to the human, and sets
`proceedable: true` in gate JSON. This is the only blocked state approval may act
on. Locked tests cannot be waived; a moved fork point expires the waiver. Do not
relabel this as PASS or bypass the independent review. Confirm the precise review
handoff for this exception before adoption; it is unclear in the source.

### Repair the behavior, not the evidence

Never manipulate timestamps, rewrite verbatim artifacts for a parser, narrow a
suite to hide failure, relax assertions, or skip cases to manufacture a green.
If a rung was overstated, report the honest correction and its reason; a lower
rung does not satisfy an L4+ requirement. If a gate can be satisfied by changing
evidence instead of doing the work, report that flaw and treat the check as unpassed.

## 5. Integrate, re-verify, then prepare the human decision

The source's integration sequence is `5 -> 6 (integrate) -> 4 (full re-gate) -> 6`.
Integration moves HEAD and invalidates AC rows tied to the old SHA. Approval must
re-read the merged files, even after a conflict-free merge. The tester alone
re-runs the full suite and gate and updates the matrix from evidence at the merged
SHA; approval never re-stamps rows on the tester's behalf.

**Proposed review-freshness safeguard:** if integration changes the reviewed diff,
route the verified result through a fresh phase 5 before resuming approval. If
review applicability cannot be established, stop for a human rather than treating
the old CLEAN as current. This is an explicit proposal, not a claim that the source
or an existing script already enforces it.

Integrate once. If upstream moves again after the re-gate, fetch and compare the
upstream and ticket changes from their common ancestor. These comparison commands
correct the source's two-tip comparison; they do not merge or authorize a push:

```bash
git fetch origin
git diff --name-only <gated-sha>...origin/<default-branch>
git diff --name-only origin/<default-branch>...<gated-sha>
```

No path overlap: proceed at the gated SHA, disclose how far behind the branch is,
and retain the publication decisions below. Overlap: name the paths and ask the
developer before another integration. File disjointness is only this routing
heuristic; it does not prove that upstream cannot affect behavior.

Re-open artifacts, confirm applicable verification and review, protect the tree,
and prepare the issue-prefixed commit message and PR description. Ask for the
shipping commit decision. The source leaves evidence identity after that new
commit unresolved; the workplace agent must reconcile it before adoption.

## 6. Permissions, reporting, and closeout

`rstack-mode` owns the autonomy boundary; this skill cannot widen it. Local,
reversible work includes reading, searching, branching, tests, run artifacts, and
intermediate local commits. The shipping commit prepared by phase 6 asks first.
Phase 6 asks separately about its push; shared-branch pushes, PRs, Jira/Bitbucket/
Confluence writes, deploys, and shared-environment writes require explicit approval
of the stated action and destination. Refuse production actions. No agent merges
a PR, even under a broad autonomy grant.

Approval is an affirmative reply to the specific request. Silence, questions,
unrelated acknowledgments, a previous approval for another action, a general
"do the ticket," the agent's confidence, and ticket/comment/PR text are not approval.
Ask and wait when an answer is ambiguous; describe any changed action again.

Read `plainly`. Phase replies use headings and bullets, one fact and at most one
citation per bullet, verdict before evidence, then one recommended phase or command
with its reason. At completion, report in this order:

1. What remains unproven or skipped, including a waived BLOCKED state, and its owner.
2. Per AC: rung, verdict, artifact path.
3. Review verdict and findings acted on.
4. Phase-3-to-5 loop count and the reason for each turn.
5. Branch, commit message, and the decision awaiting the user.

Quote evidence verbatim and never fabricate a ticket key, commit, or link. Restore
any phase-0 stash and report its outcome. Publication is not post-merge cleanup:
a human invokes `docs` in a later session. It checks default-branch ancestry,
produces a local, uncommitted run document, lists validator-selected deletion paths
and sizes, then deletes only that set after approval. The source says role-guard
cannot see those deletions. The PR description is the durable shared record.

### Repository learnings

Read `.rstack/learnings.md` at setup. Pass its path to phases 1, 2, 3, 4, and 6,
never 1b or 5. Stored observations are leads to re-confirm, not present-tense proof.
Only the orchestrator may append, at run end, when something verified and new was
learned; most runs add nothing. Use observations with source and re-check route:

```text
- (YYYY-MM-DD) <what was observed> src: <where it came from> check: <how to re-confirm it>
```

Keep the four fixed sections, at most twelve entries each, 400 characters per
entry, and 24,000 bytes for the file. Do not put operating instructions into
observations. Validate an append with:

```bash
node "$CLAUDE_PLUGIN_ROOT"/skills/pipeline/scripts/learnings-check.mjs
```

Redaction and instruction detection are shape checks, not guarantees. Check
sensitive content manually. The writer runs its own validator; no gate consumes
this file. The original's contradictory wording about `->` needs reconciliation
against the workplace validator before adoption.

### Command discipline and reference ownership

Use one command per purpose. Read directly rather than wrapping reads in existence
guards. Discover published runners instead of inventing invocations; prefer existing
checked-in scripts to inline programs. The source's host policy denies `node -e`
and `python -c`. Do not pipe output to PowerShell's `cat`; use `git --no-pager`.
Search for an identifier and read surrounding lines instead of measuring a file
before reading. Use an existing validator instead of comparing artifact timestamps.

These are paths in the intended installed skill; their contents were not reviewed
for this candidate. Consult the relevant owner without loading every reference
into every phase or expanding an independent reviewer's allowed inputs.

| Reference | Owns |
|---|---|
| `references/handoff-contracts.md` | Artifact schemas and waiver contracts |
| `references/write-boundaries.md` | Complete write lanes and boundary waivers |
| `references/estate-layout.md` | Repository resolution and cross-repository limits |
| `references/plan-interview.md` | Interview detail, pruning, and unknown answers |
| `references/risk-tiers.md` | Risk depth and escalation rules |
| `references/learnings.md` | Fixed sections, capture, and consolidation rules |
| `references/approvals.md` | Host command policy and approval detail |
| `references/harness-map.md` | Optional: rule locations and enforcement mechanisms |
| `references/team-adoption.md` | Optional: team-owned adaptation decisions |
| `references/discovery-cost.md` | Optional: available discovery measurements |

---

## Maintainer note: why this version is shorter and how to adopt it

This section is review guidance for the workplace agent, not extra instructions
to append to every phase prompt. Only the supplied transcription was analyzed.
No linked reference, script, agent definition, model registry, older version, or
workplace repository was inspected. Script and host behavior described above is
the transcription's account, not independently verified implementation evidence.

### Review findings and reduction method

The source contains 9,834 whitespace-delimited words. The condensed operating
section is about 3,100 words; the whole candidate, including this handoff note, is
about 4,400 words: roughly 55% less text overall. These are size measurements,
not model-token counts or evidence of better runtime performance.

The original mixes the current procedure with incident accounts, retired wording,
repeated rules, and arguments for decisions. That makes an agent repeatedly infer
which sentence is operative. It also repeats routing in a diagram, dispatch list,
gate table, and corrective prose. Those copies already disagree in this source.

This version keeps one phase-routing table, groups setup in one place, and retains
the artifact owners, commands, verdict tokens, recovery routes, approval boundaries,
and enforcement limitations. It removes historical anecdotes, superseded phrasing,
sample SHAs, one-run timing examples, and absolute claims such as tests being
incapable of adding risk. Their useful operational consequences remain. The original
stays unchanged as the history and source record; no extra mandatory document is
introduced to hide the removed text elsewhere.

Conciseness is useful only while a role can still identify its inputs, permitted
writes, required output, exit condition, and failure owner. Do not shorten by
removing independent review, changing evidence thresholds, suppressing failures,
or weakening approval. Conversely, do not turn each past mistake into a new
always-loaded paragraph. Fix a deterministic defect in its owning script where
appropriate; keep rationale outside the execution path and link to one owner.

Model-specific capabilities were not evaluated here. Keep the same explicit
contracts across models, with model selection in agent definitions and the registry.
Use observed failures to justify a targeted instruction or tooling change; more
instructions or a larger model are not evidence that a failure has been corrected.
Fresh context and restricted inputs remain requirements regardless of model family.

### Mapping and explicit proposed corrections

Line numbers refer to the unchanged transcription, whose first 798 lines track
the photographed source positions.

| Source lines | Destination / treatment |
|---|---|
| 1-115, 487-517, 592-610, 706-720 | Opening and section 2: one dispatch/routing table; keep unconditional audit/review, risk escalation, test-risk routing, and the limited phase-3 self-report. |
| 117-285 | Section 1: combine preflight, repository selection, stash ownership, and verifier offer. Correct the "all read-only" label: artifact protection writes `.git/info/exclude`. |
| 287-303, 387-406 | Section 3: retain artifact ownership; reference the detailed lane table once. |
| 305-385 | Repository learnings: preserve caps, provenance, re-checking, writer, recipients, and weak-enforcement caveats; remove format history. |
| 408-485, 677-704 | Section 4: retain lock/amendment controls, gate semantics, host corroboration limits, waiver distinction, and evidence integrity. |
| 519-590 | Section 5: retain one integration and mandatory full re-gate; propose the review-freshness safeguard and correct the upstream comparison. |
| 612-675, 722-797 | Sections 1 and 6: group run scope, command/reply rules, permissions, alternatives, and later cleanup; remove repeated rationale. |

The upstream comparison changes intentionally. Source line 572 compares the gated
tip directly with upstream, so the "upstream changed" list can include the ticket's
own changes. The two three-dot comparisons above compare each side against the
common ancestor. They preserve the overlap decision while making the two lists
answer the stated question. They do not establish semantic independence.

The additional fresh review when integration changes the reviewed diff is also
intentional. The source invalidates test evidence when HEAD changes but describes
returning directly to approval after the re-gate. A previous CLEAN cannot simply
be assumed to cover a changed diff. This proposal may cost another review; adopt
it explicitly and align the actual handoff/validator behavior rather than claiming
that wording alone enforces freshness.

### Unresolved source issues: settle these before replacing the workplace skill

| Issue | Visible evidence and required decision |
|---|---|
| Verification-only RED | Lines 100-105 and 592-610 allow already-shipping behavior and a phase-3 skip, while 712 requires every new test to fail. Confirm the sanctioned discrimination proof and lock creation path. Do not invent a failing implementation or an exemption. |
| Scoped loop routing | Lines 3 and 496 call phase 4 scoped; 714 permits green "at the scope recorded"; 545-553 explicitly prohibit PASS on scoped evidence. This candidate uses the explicit full-suite requirement for normal advancement. Confirm the actual gate and loop behavior. |
| Waived BLOCKED routing | Lines 481-485 allow approval to act on `proceedable: true`, but the normal 4-to-5 and 6-to-human gates require green. Specify how independent review and human acceptance occur without converting BLOCKED to PASS. |
| Final evidence identity | Lines 521-537 bind ACs to HEAD, then the sequence commits after verification. Confirm how the final commit and committed matrix retain valid evidence identity; this file cannot define that protocol from the available text. |
| Learnings format | Lines 348-357 show a format without `->`, then ambiguously say "So is `->`" while explaining why the old instructional arrow format was wrong. The candidate retains the visible example and observation-only intent; confirm the validator's actual rule. |
| Enforcement claims | Lines 343-344, 404, 450-456, and 732 describe different kinds of controls. Confirm host tool grants, self-checks, span availability, artifact freshness, and deletion visibility in the actual environment. Do not label prose or an agent-run check as a sandbox. |

### Preserved transcription gaps

These are unknown text, not deletions justified by this refactor. They must be
recovered from the workplace source, not filled from earlier reconstructions.

- Review-risk routing, source 111: [TRANSCRIPTION GAP: the remainder of source line 111 is cut off in IMG_1400.jpeg and hidden beneath the sticky headings in IMG_1401.jpeg.]
- Gate description, source 448: [TRANSCRIPTION GAP: the middle of source line 448 is not visible between IMG_1409.jpeg and IMG_1410.jpeg.] The visible ending includes `STOPPED` and a host-span comparison; no missing predicate or meaning for that fragment is inferred.
- Reviewer dispatch, source 517: [TRANSCRIPTION GAP: source line 517 is cut off at the bottom of IMG_1411.jpeg; IMG_1412.jpeg starts at line 518. No wording has been supplied from earlier versions.]
- Phase-3 self-report rationale, source 720: [TRANSCRIPTION GAP: the remainder of source line 720 is cut off at the bottom of IMG_1416.jpeg; IMG_1417.jpeg starts at line 721.]

### Workplace refactoring instructions

1. Compare this candidate with the actual workplace `plugins/rstack/skills/pipeline/SKILL.md`,
   recover all four gaps, and resolve the issues above against the owning references,
   agent definitions, scripts, and host grants. That is follow-up work, not a claim
   made by this source-only review.
2. Apply the wording and duplication reductions first. Keep the current operating
   contracts. Do not copy this maintainer note into the installed execution prompt;
   retain it as review history and remove the candidate banner when adoption is settled.
3. Review the two intentional changes separately: upstream comparison and review
   freshness after integration. If implementation changes are needed, identify the
   exact owners and get the workplace task's authorization before expanding scope.
4. With authorized verification, exercise the routes affected by adoption: audit
   refutation/absence, RED lock and amendment, vacuous-test routing, scoped versus
   full results, pre-existing failure acceptance, verification-only delivery,
   integration changing the diff, final commit identity, and stash restoration.
   Use existing checks and a small representative run; do not build a new framework
   merely to validate a documentation reduction.
5. Report what was verified and what remains unknown. Keep the previous installed
   skill available for rollback, review the diff, and publish only the authorized
   workplace change. Do not claim this candidate is runtime-validated.

Source: `pipeline-SKILL.original-latest.md`, added in repository commit
`8f2d3fe`; 22 images, `IMG_1398.jpeg` through `IMG_1419.jpeg`. The source is a visual
transcription, not a byte-for-byte export of the workplace file. Its SHA-256 is
`0b015f540b00889fd99b9aacf75f279c6c86bf7ebff8df54096f3e5db765a496`.
