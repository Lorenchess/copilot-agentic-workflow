# ASTRA — P3-C2 SECOND CORRECTION SCOPE REVIEW

**Decision: APPROVED_WITH_QUALIFICATIONS.**

Fable's proposed direction addresses C2-I1, C2-I3 and C2-R1. It is suitable for one bounded correction with the qualifications below; no further architecture proposal is needed. This is approval of the correction approach, not closure of the resulting implementation. Those three items remain pending targeted closure; C2-I2 and C2-I4 remain closed.

## Evidence and scope

Reviewed the pasted proposal against HEAD **9b78efbd55abef4ae0578ca2d23559d3d22bd8b4** and the uncommitted examples. All 82 existing tracked/untracked files match the snapshot taken at the end of the [previous targeted closure review](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/reviews/2026-09-10-phase-3-c2-targeted-closure-review.md>). Neither reference tag moved: Phase 1 still resolves to **03d4230e9398a80586a4b8be47ed522638bf77d8**, Phase 2 to **5a46eb7a6bb951308742975bd8f9f51f77a6aca9**.

The proposal's phrase “ten authorized LARGE files” is incorrect. Ten files were previously authorized across two directories. This correction needs only these **four LARGE files**:

- [SOURCE-EXCERPTS.md](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md>)
- [RED-REPORT.md](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/RED-REPORT.md>)
- [TEST-CONTRACT.md](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md>)
- [TEST-REVIEW.md](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-REVIEW.md>)

Leave LARGE README, both PLAN/RUN files, all SMALL files, policy assets, contracts, settings, historical examples, tags and existing reviews untouched.

## Accepted corrections

**C2-I1:** checking the first received body as `(del-9002, 1, FAILURE)`, then draining exactly the two remaining requests into an unordered delivery/attempt/outcome multiset closes the identified discrimination gap. The cumulative count of three is correct even after consuming the first queued request. This rejects a wrong-delivery re-report, a wrong attempt and a duplicated current report while accepting either order of the two step-2 reports. Keeping the count assertion before decoding preserves the legitimate zero-request RED at the anchor.

**C2-I3:** explicitly enqueueing the ledger 200 supplies the missing success arrangement. The unchanged request-count RED remains plausible before implementation; the success/failure marker contrast now has the required response configurations. No additional test or exception-type claim is needed.

**C2-R1:** an always-503 ledger Dispatcher is proportionate. It covers legal re-reports without fixing their number or ordering and answers an unexpected extra ledger request. MockWebServer supports replacement dispatchers, and the default QueueDispatcher otherwise waits on an empty response queue unless a fail-fast response is configured. This was checked against the pinned [MockWebServer 4.12.0 source](https://raw.githubusercontent.com/square/okhttp/parent-4.12.0/mockwebserver/src/main/kotlin/okhttp3/mockwebserver/MockWebServer.kt) and [QueueDispatcher source](https://raw.githubusercontent.com/square/okhttp/parent-4.12.0/mockwebserver/src/main/kotlin/okhttp3/mockwebserver/QueueDispatcher.kt).

## Qualifications to incorporate in the correction

### 1. Make the proposed snippet internally valid

The new `reportTuple(RecordedRequest)` declares `throws Exception`, but its [current caller](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:165>) declares only `throws InterruptedException`. Replacing only the body as proposed leaves an unhandled checked exception. Adjust the caller's declaration appropriately, or handle the helper's actual checked exception without swallowing it. This is a small source correction within the same test file, not a new helper framework or production change.

Preserve the **semantic** RED failure locus, but recheck its numeric source citations after editing. In particular, inserting the ledger enqueue before the positive I1 assertion may change its line number. Approximate method ranges do not justify blindly retaining exact line numbers in fictional stack traces.

### 2. Finish AC5(ii)'s response fixture, including its existing probe

Keep the always-rejecting ledger Dispatcher. State that each test gets fresh server instances and isolated request history, or show an equivalent reset/recreation boundary. Do not leave this as an assumed property: an always-503 dispatcher leaking into the positive I1 case would invalidate the claimed successful response. A short fixture statement is sufficient.

Also arm the **merchant response for AC5(ii)'s existing post-terminal probe**, within this same scenario. The [current fixture](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:215>) consumes its five merchant responses before the [extra entry-point call](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/SOURCE-EXCERPTS.md:235>). If incorrect code makes a sixth merchant request, the ledger Dispatcher alone cannot prevent that call from waiting on the merchant's empty queue.

An additional response reserved for that probe, or an appropriate per-test fallback, is sufficient; preserve the unchanged-count assertion. This completes the previous C2-R1 request that the extra request reach the comparison promptly. It does not reopen the closed terminal-assertion finding or require a global mock setup redesign.

Other cases that can block only when incorrect code makes an unexpected request remain non-blocking housekeeping for this targeted correction. They do not create the central regression of a conforming implementation exhausting its responses. Do not broaden this batch to all fixtures.

### 3. Simplify the adoption explanation

The proposed acknowledgement that an immediate count of one is compatible with backoff is correct. Avoid replacing the old rationale with a new claim that retaining a valid assertion would necessarily preserve a misleading reading.

A sufficient explanation is: the obsolete terminal-status expectation triggers the adoption; the already-approved delta also removes the immediate request-count assertion when retargeting the test to first-attempt recording. That count does not itself contradict backoff or prove there will never be another attempt.

Keep the approved deletion and patch unchanged. Reconcile the nearby [Prior expectation sentence](<C:/Users/Ramon Lorente/Documents/Claude/Projects/copilot-agentic-workflow/docs/examples/PAYMENTS-12345-testing/TEST-CONTRACT.md:161>) as well as the adoption paragraph and matching source explanation, so “no second attempt ever occurs” is not still presented as something the count proved.

## Completion boundary

Align the four files' source, mapping, Setup, Proves and review claims with the final assertions and response fixtures. Preserve the fictional run's existing round structure and approved adoption delta. Return the resulting four-file correction for targeted closure; do not represent this proposal assessment as an ACCEPT of those future contents.

P3-C3, committing and publishing remain on hold. No implementation agent was invoked, no application tests/build were run, and no existing project file was changed. Only this review artifact was created.

