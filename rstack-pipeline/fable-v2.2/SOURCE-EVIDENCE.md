# Source evidence — 44 photographs

This is a manual, visual comparison with the supplied photographs, not source-checkout inspection or an execution result. SCREENSHOT-SUPPORTED means the relevant text/branch is visible. Comments establish documented intent or a historical claim, not that an incident occurred or a control runs. Clipped lines, folded imports and missing dependencies prevent byte-exact reconstruction.

The gate is shown in an installed .github/skills tree; ac-check is shown in an authored plugins/rstack tree. Their deployment/version correspondence is unverified. No runtime script is installed by this candidate.

## Complete photo index

All paths below are under the supplied attachment root:
C:\Users\Ramon Lorente\.codex\codex-remote-attachments\01a0ad25-0211-76a1-9bf9-29d7120040bd

Within each batch, photo N is N-Photo-N.jpg. Line ranges are approximate visible coverage, including sticky editor lines and overlap.

| Batch | Attachment directory | Photos |
|---|---|---:|
| B1 | A7351829-C82B-4E85-9CAA-1EF3434826A4 | 10 |
| B2 | B15A928B-E2E0-44F1-B729-72E881F576ED | 10 |
| B3 | FE64AA50-DDDF-49F6-B7A1-E636C6FA4650 | 10 |
| B4 | 9EE02603-53EE-40B7-BD79-57B77CB8C72E | 10 |
| B5 | 9165C7CF-7A7A-44ED-AB01-8EDF263A87EB | 4 |

| Photo | File / approximate lines | Content used |
|---|---|---|
| B1.1 | gate.mjs 1–45 | check inventory, usage, stated evidence goals |
| B1.2 | gate.mjs 45–89 | imports and reactor/trim intent |
| B1.3 | gate.mjs 88–132 | raw trim provenance |
| B1.4 | gate.mjs 131–174 | failure signals and reactor coverage |
| B1.5 | gate.mjs 173–216 | reactor counting, OTel imports, constants |
| B1.6 | gate.mjs 216–259 | waiver/acceptance schemas and comments |
| B1.7 | gate.mjs 258–302 | acceptance reader and classifier |
| B1.8 | gate.mjs 301–344 | acceptance tail, waiver reader/classifier |
| B1.9 | gate.mjs 342–385 | waiver classifier, child runner, main |
| B1.10 | gate.mjs 385–428 | issue keys, arguments, root/HEAD, AC override |
| B2.1 | gate.mjs 429–469 | suite exit/scope markers and reactor |
| B2.2 | gate.mjs 469–512 | log presence, exit agreement, HEAD freshness |
| B2.3 | gate.mjs 511–554 | cannot-run classification and waiver eligibility |
| B2.4 | gate.mjs 543–586 | valid/undated/invalid waiver reporting |
| B2.5 | gate.mjs 585–628 | stale waiver report, size and scope branches |
| B2.6 | gate.mjs 626–669 | reactor/trim and missing-marker inferences |
| B2.7 | gate.mjs 669–712 | missing HEAD, lock verification, per-ticket AC call |
| B2.8 | gate.mjs 709–752 | impact artifact and required headings |
| B2.9 | gate.mjs 752–795 | approximate-count rejection, execution-check intent |
| B2.10 | gate.mjs 794–838 | marker exclusion and bounded test-name heuristic |
| B3.1 | gate.mjs 835–881 | locked-path retrieval and named/missing branches |
| B3.2 | gate.mjs 880–923 | scoped/none-named inferences, tree intent |
| B3.3 | gate.mjs 921–963 | stability vs cleanliness, two marker producer calls |
| B3.4 | gate.mjs 961–1003 | tree parser; absent, partial and malformed brackets |
| B3.5 | gate.mjs 999–1044 | HEAD/digest mismatch, matching bracket |
| B3.6 | gate.mjs 1039–1086 | self-report/two-sample limits, OTel intent |
| B3.7 | gate.mjs 1084–1128 | store errors, NO_CLAIM and AGREE |
| B3.8 | gate.mjs 1125–1168 | contradictions, base verdict and proceedable |
| B3.9 | gate.mjs 1168–1211 | inferred list, acceptances, HELD, JSON fields |
| B3.10 | gate.mjs 1212–1255 | accepted/expired output and HELD instructions |
| B4.1 | gate.mjs 1249–1279 | qualified BLOCKED output; exit 0/1 |
| B4.2 | ac-check.mjs 1–52 | exact schema, verdicts, regexes, encoding check |
| B4.3 | ac-check.mjs 51–99 | root/HEAD helpers, prefix matching, TSV parser |
| B4.4 | ac-check.mjs 99–145 | header, empty matrix, row shape, HEAD fallback |
| B4.5 | ac-check.mjs 145–191 | row validity, artifact existence/encoding |
| B4.6 | ac-check.mjs 191–238 | below-L4 note, SHA check, accessibility intent |
| B4.7 | ac-check.mjs 238–285 | ignored-artifact warning, atBar summary, CLI |
| B4.8 | ac-check.mjs 272–316 | CLI success/failure and import guard |
| B4.9 | estate-sweep/SKILL.md 1–38 | read-only sibling scope, commands, root |
| B4.10 | estate-sweep/SKILL.md 38–68 | stale/null results, extensions, truncation, wire names |
| B5.1 | estate-sweep/SKILL.md 40–71 | search limits, cost qualification and reply |
| B5.2 | eval-skill/SKILL.md 1–28 | proposal screening and human selection |
| B5.3 | eval-skill/SKILL.md 28–58 | blinded tasks, rubric and transcript approach |
| B5.4 | eval-skill/SKILL.md 56–75 | nested transcript location, judge and promotion |

## Findings carried into this revision

| ID | Evidence | Supported fact | Consequence |
|---|---|---|---|
| E01 | B4.2–8 | Exact AC header ends in sha/note; SHA must be 7–40 hex and match current/explicit HEAD by prefix | Remove candidate-column and WORKTREE-SHA proposals; keep full real SHA values |
| E02 | B4.6–8 | A below-L4 VERIFIED row can have a waiver note, but atBar excludes it and CLI exits 1 | No release route through a lower-rung AC waiver |
| E03 | B2.2–6 | Stale HEAD is checked before the red-suite waiver branch; scope/size/reactor/trim checks follow the nonzero-exit branch | Preserve freshness; require full/provenance conditions for exceptions without assuming the current branch enforces them |
| E04 | B1.8–9, B2.3–4 | Visible waiver classifier checks base/evidence presence and a basename occurrence; waived_at_sha is parsed but not used there | Require candidate-bound replay and complete failure accounting; stronger implementation needs actual replay/lock/runner sources |
| E05 | B3.8–9 | proceedable is calculated before acceptance classification and does not consult unaccepted | Do not use the bit as complete release permission; specify a narrow additional guard |
| E06 | B3.9–10, B4.1 | HELD overlays passing checks when inferred rungs are unaccepted; BLOCKED stays BLOCKED; PASS exits 0, HELD/BLOCKED 1 | Keep gate states distinct from execution status and review/release predicates |
| E07 | B2.10, B3.1–2 | Marker lines are removed, but test execution is inferred from names; none named is a passing check with an inferred gap | Preserve exclusion; do not claim filenames prove execution or that an accepted gap proves a locked test passed |
| E08 | B3.3–6 | Equal supplied digests prove only matching samples under the producer's definition; gate does not re-derive them | Candidate verification requires a separate committed-input basis; no universal clean-tree change to the existing working-tree loop |
| E09 | B3.6–8 | OTel is optional; unavailable/unreadable store gives NO_CLAIM; contradictions fail | Keep no-evidence separate from agreement; model-family and time-window limits remain explicit |
| E10 | B1.2–5, B2.5–6 | Raw trim check verifies size/hash and a few failure signals in the passing/full branch | Preserve raw bytes and concise logs; do not claim semantic completeness from this heuristic |
| E11 | B2.8–9, B4.5–7 | Impact headings/count form and AC artifact availability/encoding are checked; ignored artifacts warn | Exact, accessible, retained evidence is needed; a hash alone is not reviewer access |
| E12 | B4.9–10, B5.1 | Sweep skill states sibling read-only, direct-child/default-extension/staleness/truncation limits | Carry explicit scope and wire identifiers; no automatic sibling execution |
| E13 | B5.2–4 | Skill proposal screening, blinding, transcript inspection and one judge are documented | Add an evaluation workflow; balance model/task conditions across arms and do not promote on prose quality alone |

## What this evidence does not establish

- No runtime execution, hook invocation, effective grants, model selection, parser tests, benchmark or behavioral improvement was observed in this task.
- Actual lock storage and amendment behavior, role/estate boundaries, replay producer, OTel verifier/store semantics, response checker, capture wrapper and installer are not supplied as complete source.
- Agent and reference drafts originate in the preserved Fable/reconstruction material. They are candidate design, not photographs of every underlying original file.
- Session-context/standing-rule/probe observations also use the earlier reconstruction material; they are not among these 44 photographs. Probe fixes are port requirements only.
- Current review-diff/ac-matrix skill bodies and models/settings sources are not established by the photographed script. Their integration remains an adoption dependency.
- Historical incidents and timing figures in photographed comments were not independently verified.

## Added 2026-09-17 — correction round after the independent review

The table and findings above are unchanged. One finding is added; both photographs were reopened from the attachment root during this round.

| ID | Evidence | Supported fact | Consequence |
|---|---|---|---|
| E09a | B3.7 (gate 1112–1120), B3.9 (gate 1179, 1186–1188) | When the OTel result is NO_CLAIM the gate pushes a check `{ name: 'otel', pass: true, detail }` with no `inferred` property. The inferred list is `checks.flatMap(c => c.inferred ...)`, and HELD is `verdict === 'PASS' && unaccepted.length > 0` | In the photographed version NO_CLAIM creates no inferred rung, so it cannot hold the gate or require an observation acceptance. It is still a check that "could not look", not agreement. Installed-version correspondence is UNVERIFIED |

Correction to an earlier statement: the round 2.2 implementation report said the photographs were not on disk. They are outside the repository, at the attachment root named at the top of this file, and are readable; only the in-repository search had found nothing.
