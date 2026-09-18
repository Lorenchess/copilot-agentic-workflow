# CHATGPT — P3-C2 CORRECTION SCOPE REVIEW

**Decision: APPROVED_WITH_QUALIFICATIONS — one bounded Sonnet 5 correction round.**

This approves Claude's proposed correction approach, subject to the two qualifications below. It does **not** close C2-I1–I4: closure depends on the resulting diff. P3-C2 remains uncommitted; P3-C3 and publishing remain on hold.

Reviewed against HEAD **9b78efbd55abef4ae0578ca2d23559d3d22bd8b4**, the current example, and the [P3-C2 implementation review](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/reviews/2026-09-10-phase-3-c2-implementation-review.md>). No implementation agent was invoked by this review.

## Accepted direction

- **C2-I1:** replace delivery-wide counts with business-content history, and make the pre-implementation observation an empty history. Update source, recorder, mapping, RED and review together.
- **C2-I2:** assert the terminal state and reporting state in the same failing-ledger scenario, then use controlled time and the existing entry point to check no further work. Assert pending scheduling state and unchanged call/history evidence. Do not substitute the driver's iteration limit for production stop behavior.
- **C2-I3:** drive retry reporting through the real adapter against a failing ledger endpoint. Removing the unrelated settlement test is proportionate. The replacement must satisfy the evidence qualification below.
- **C2-I4:** parameterize the compact AC rows over creation and update. The update rejection must start from an existing registration; continued HTTPS acceptance must also cover update. Record each discovered parameter invocation and its result, not merely the method name.
- The proposed non-blocking corrections are accepted within the same example-only scope.

## Qualification 1 — exact business history must not invent ordering

[PLAN AC5](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/PLAN.md:115>) requires re-reporting the old attempt alongside the next attempt. [Q2](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/PLAN.md:141>) makes reporting synchronous, but does not prescribe whether the old re-report precedes the current attempt's report within that step.

A chronological recorder is appropriate. Assert the exact delivery/attempt/outcome contents and multiplicities, including the initial failed report, its later re-report, and the current attempt's report. Preserve required causal ordering and the association with the next delivery step. Do not reject a correct implementation solely because the two reports during that step occur in the opposite order. No new G3 decision is needed; keep the test within the existing requirement.

## Qualification 2 — UNREPORTED alone is not proof of the real I1 failure path

A test that only observes DELIVERED plus UNREPORTED can pass when code writes UNREPORTED unconditionally or never attempts the ledger request. The failing MockWebServer response can remain unused.

The focused evidence must establish that the actual retry-report request reaches the ledger transport edge with its business payload and that the configured failure is encountered through the real adapter. Show discrimination from successful reporting as well: the corresponding successful-response case must not leave a false outstanding-report marker. Reuse the positive I1 case where possible; do not add an unrelated preservation test or invent a new status value.

Keep the distinction between the externally observed consumer outcome and any claim about the specific LedgerReportException translation. Claim the latter only to the extent the real-path source/evidence supports it. The replacement still enters through symbols that exist at the RED anchor.

## Authorized correction scope and completion boundary

Only these five files in **each** example directory:

- TEST-CONTRACT.md
- RED-REPORT.md
- TEST-REVIEW.md
- SOURCE-EXCERPTS.md
- README.md

Directories: `docs/examples/PAYMENTS-12345-testing/` and `docs/examples/PAYMENTS-12410/`.

Keep both PLAN.md and RUN.md files unchanged, as proposed. Do not change policy assets, contracts, baseline examples, reference tags, settings, or existing reviews. If the correction exposes a dependency outside this scope, report it before changing that file.

Claude may delegate this single bounded correction round to Sonnet 5, review the assembled result, and return the full diff for targeted closure. Do not commit, push, or begin P3-C3. This approval is not a claim that the corrected examples have already passed review.

