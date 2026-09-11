# ASTRA — P5-C2 corporate-adoption checklist review

**Base:** `f3aa9d425868fa48d934a065872c32b367015cba`.
**Reviewed revision:** `54b900b748d80aff48300e845016c359d7c0b702` (the accepted two-file C2 working tree).
**Decision: PASS.** One ordinary correction round; no material finding remains.

## Assessment

The 20 checks are usable adoption instructions, with manual steps, expected outcomes, explicit result/evidence/recorder fields, failure scope, fallbacks and governing sources. Every result remains **NOT VERIFIED**. Nothing in the checklist claims corporate execution occurred. Future checks require an approved disposable environment; dangerous terminal previews are cancelled. It separates portable policy from Copilot packaging and corporate dependencies rather than adding another integration platform.

The checklist addresses the evidence that delivery actually needs: exact connector identifiers and result schemas, Jira field names and bounded pagination, complete PR candidate reads, direct reads of known PR identities, unknown create outcomes, and mandatory post-create identity/SHA reads (CA-09–15). Three capability groups do not imply three concrete tool IDs. Missing read completeness blocks automated PR work; `PUBLISH_ONLY` is an honest alternative, not proof that PR automation works.

CA-04–08 distinguish actual tool grants, observed artifact ownership, protected-file edit approval, terminal approval behavior, human gates and subagent routing. Generic edit permission is explicitly not a hard path sandbox. CA-16–19 cover supported repository layouts, effective Git destinations/ref effects/hooks, corporate execution restrictions and database/Kafka proof. Host configuration review is a human prerequisite outside the pipeline command list; no new runtime command or setting is invented. Partial evidence does not become PASS merely because a fallback is available.

CA-20 keeps full corporate end-to-end validation separate from component checks. Failure or unavailable coverage remains visible. The 20-row matrix is necessarily wide; it is a one-time adoption worksheet, not extra per-ticket ceremony.

## Correction round 1

**C2-1 — MEDIUM, CLOSED:** The initial CA-01 required all nine agents in the user picker, contradicting `user-invocable: false` on the eight stage agents. The corrected row requires Pipeline selection and checks stage-agent inventory/routing through CA-08. The outside-Pipeline role guard uses an actually available ordinary/user-invocable role. Correctly hidden stage agents no longer cause a false failure.

The same bounded round added explicit protected-instruction/settings edit-preview observations to CA-05 and removed a misleading fixed tool-count implication in CA-13. Source links and requested Jira constants were checked against the actual files. No second round was needed.

## Verification and limits

Astra read the actual checklist and questions diff, compared the referenced rules, and checked the two-file scope. Existing `docs/questions.md` content is preserved; only a link section is appended. Working-file hashes were compared against the accepted C1 snapshot; prior reviews and unrelated assets were unchanged. Whitespace checking passed. These are document/source checks, not tests of Copilot, Jira, Bitbucket, Git approval-engine behavior or corporate execution.

The worker's platform turn context continues to identify `gpt-5.6-sol`. This establishes authoring provenance only; the corporate reference runtime remains Sonnet 5 and requires CA-03 validation. This review is intentionally untracked.
