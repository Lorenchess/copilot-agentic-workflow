# Runtime patch plan for the workplace source

These are concrete port specifications, not applied script changes. Obtain the actual source and its fixtures first. Photograph line numbers locate the observed branches; use function/control-flow anchors in the live version. Preserve existing field names, exit codes and unrelated behavior. Do not paste reconstructed executable code over a source file.

Priority 1 is the gate/waiver path. Priority 2 is candidate capture/lock integration. Skills and host loading come after parser compatibility is established.

## R1 — apply release-quality capture checks to waived red suites

Target: authored skills/pipeline/scripts/gate.mjs, main's suite branch; producer/capture helper if one exists.

Evidence: B2.3–6. Nonzero suite exits enter waiver handling before size, full-scope, reactor and trim-provenance branches. A valid waiver plus HEAD does not establish those later conditions.

Change: factor the conditions that make evidence usable for an exception into a shared assessment consumed by both the passing-full and waived-red paths. Require a full run, current identity and usable capture for exception eligibility. Keep scoped red feedback and its honest failure status; do not classify every scoped run as an infrastructure error. Apply Maven-specific reactor/trim conditions only when the actual parser recognizes that format. No inferred module count for other runners.

Preserve: cannot-run never waived; stale HEAD blocks before waiver evaluation; a red suite remains BLOCKED. Prevent exception eligibility if scope/provenance is incomplete. Do not create a second regex/parser definition in another script.

Required cases: full/scoped/unmarked red logs with the same otherwise-valid waiver; short Maven reactor; valid/invalid raw trim provenance; oversize log; cannot-run; old HEAD. Verify ordinary scoped iteration remains clearly blocked without falsely reporting a product regression.

## R2 — compute proceedable after acceptance classification

Target: gate.mjs main, failed/verdict/inferred/classifyAcceptances/proceedable aggregation.

Evidence: B3.8–9. proceedable ignores the subsequently computed unaccepted list. Therefore a waived suite can be the only failed check while a passing check contains an unaccepted inference.

Change: move final exception-eligibility calculation after classifyAcceptances. Preserve the original necessary conditions (BLOCKED, only suite failed, suite waiver valid), add no unaccepted observations, and require R1's usable full capture. Accepted observations still remain in JSON; they do not prove the missing fact. The approval role must enforce the adopted exception policy independently.

Preserve: BLOCKED outranks HELD; HELD is only the overlay on passing checks; checksVerdict and all existing JSON names remain; exit 0 only for PASS, 1 for HELD/BLOCKED, 2 for errors. The human acceptance file must not become agent-writable.

Required cases: waived suite plus missing tree pair; unaccepted vs accepted vs expired observations; a second failed check; green checks with unaccepted inference; fully measured pass. Inspect actual JSON behavior, not a grep that only finds a field name in comments.

## R3 — candidate-bound and complete suite waivers

Targets: gate.mjs readWaivers/classifyWaivers and actual base-replay producer; actual lock --paths interface; runner failure inventory adapter if present.

Evidence: B1.6–9 and B2.3–4. Visible code parses waived_at_sha but does not check it in classifyWaivers. A basename substring in the log does not prove that the named test failed, nor that every failure is covered. A valid nonempty set is not completeness.

Change in the consumer: validate required fields and actual replay evidence; bind waived_at_sha to the candidate under the adopted SHA policy; retain exact current merge-base matching. Reject applicability to a locked executable check. Ensure producer and consumer agree on test identity and stale-row behavior before changing either.

Failure completeness needs actual runner-reported failing identities. Prefer an existing machine-readable result adapter. Do not replace basename matching with a larger regex and claim exhaustive attribution. If no adapter can enumerate failures reliably, report coverage unknown and keep automatic exception eligibility false; a broad human statement does not supply missing measurements.

Preserve: current six-column TSV unless producer/consumer migration is separately needed; historical rows may remain but must not count toward the current candidate. A pre-existing failure stays a failure. Never invent replay evidence or use an old fork point after the base changes.

Required cases: missing signer/reason; stale/malformed waived_at_sha; stale base; missing/empty replay; name appears only in a passing line; prefix/case/path collision; locked test; extra unwaived failure; valid complete nonlocked failure inventory. Exercise the real replay output, not handcrafted happy-path rows alone.

## R4 — keep AC compatibility and correct its claims

Target: skills/ac-matrix/scripts/ac-check.mjs and actual ac-matrix skill/template producers.

Evidence: B4.2–8. Exact schema is ac_id, criterion, check, artifact, ladder, verdict, sha, note. Row validation permits a below-L4 waiver note, but CLI success still requires every row at L4+. Artifact paths resolve from repository root where Git is available.

Change: fix producers/documentation that use candidate or WORKTREE in the SHA cell. Use actual full source commit values; working-tree proof is explicitly labeled in report metadata and never final candidate proof. Seed rows may fail readiness until real evidence exists; do not manufacture a placeholder artifact as proof.

If the live source still describes lower-rung waivers as a CLI success route, correct that comment/help, not the atBar requirement. Existing short-SHA compatibility is visible; full-SHA candidate records are the stricter candidate contract. Do not silently change shared parser compatibility without inspecting every consumer.

Required cases: exact/reordered/wrong header; WORKTREE literal; stale SHA; below-L4 with/without waiver; NOT_VERIFIED/INCONCLUSIVE; missing/empty/garbled evidence; valid L4 current row; two tickets with one invalid matrix. Confirm CLI exit and summary agree.

The ignored-artifact warning is not enforcement of safe retention or access. Do not turn private raw artifacts into committed files to silence it.

## R5 — capture candidate inputs without breaking working-tree feedback

Targets: real capture/wrapper, role-guard --tree-digest, boundaries classifier, lock storage, candidate orchestration and packet producer.

Evidence: B3.3–6. Equal supplied tree digests show matching samples under the producer's definition. Current pipeline comments explicitly permit dirty working-tree runs. A universal clean-tree requirement would break that loop.

Change: retain WORKTREE feedback. Add the candidate phase only after the actual lock and proof-input identities are available. Candidate runs must use committed tracked inputs and exclude unrelated/untracked execution inputs. Keep ignored dependencies/configuration declared and bounded. Record actual execution location, before/after state and immutable attempt output; prevent two processes from writing one compatibility log.

Obtain actual lock paths from the implementation. Do not invent --revision, a lock filename, or a digest wrapper. If a capture helper already exists, adapt it instead of adding another writer.

Required cases: unchanged dirty feedback; candidate plus unrelated dirty config; pre-existing untracked source; fixture generated during execution; changed then restored file (document sampling limit); missing/empty/half tree marker; candidate changes after tests; rerun at same SHA changes packet; no-code candidate; prior evidence tracked in Git.

Approval must not restore unrelated work into the execution checkout before candidate verification/review end. Packet digest checks must cover every listed file, not only the manifest bytes.

## R6 — actual locked-test execution

Targets: test-lock --paths output and real runner result parser; gate test-execution check.

Evidence: B2.10 and B3.1–2. Marker exclusion is useful, but bounded filename tokens are a heuristic. None named is an inferred gap; a fixture/base class may never have its own runner identity.

Change: retain marker exclusion and honest inference reporting. Map executable tests to runner identities and support files to their actual executing checks where the runner supports it. Candidate review requires attributable passed locked checks; a human observation acceptance does not create that evidence.

Without an adapter, preserve UNPROVEN and block the candidate predicate; do not claim a new regex closes the gap. Keep the distinction between locked files unchanged and locked behavior executed.

Required cases: marker-only log; OrderTest vs OrderTestBase; Go function/file mismatch; fixture/base class; skipped/discovered-but-not-executed test; renamed/moved test; complete runner results; partial capture.

## R7 — support scripts and host controls

Targets to inspect: role/estate guards, response checker, OTel trail/store helpers, installer/generator fixtures, hook registration and diagnostic probe.

Do not upgrade these from UNVERIFIED based on their call sites.

- Verify actual per-role boundaries and exception paths. A self-issued --waiver field is not human authorization. Preserve tool-owned ledgers until producer/consumer dependencies are known.
- Verify actual lock amendment semantics and source-change invalidation. Never weaken a locked test to reach green.
- OTel NO_CLAIM remains distinct from AGREE. Preserve missing/corrupt-store behavior and explicitly test contradiction routing with the real store schema. Model-family agreement is not exact model-version verification; overlapping run windows need an acknowledged limit or actual run identity.
- Read installer/generator registration before removing duplicated instructions. Observe SessionStart and child-agent behavior separately. A read-only frontmatter list is not proof of host isolation.
- For the earlier reconstructed diagnostic probe: handle an unset PID under set -u, remove raw payload logging, bound/redact metadata, validate existing-file permissions rather than only umask, and do not label shell-normalized input length as raw byte count. Missing output proves no observation, not that a hook did not fire. Remove the diagnostic once its bounded question is answered.

No production checks, sibling writes, live publication, settings installation or behavioral experiments are authorized by this plan. The workplace maintainer selects and runs the bounded validation plan in a disposable environment.

## Completion evidence for each applied patch

Record actual repository/ref, authored file diff, generated/installed destinations, exact checks executed and outcomes, unrun cases and rollback. Preserve earlier failing examples. A passing static inspection or source diff is not an observed runtime success. Promote only the applied subset with its evidence.
