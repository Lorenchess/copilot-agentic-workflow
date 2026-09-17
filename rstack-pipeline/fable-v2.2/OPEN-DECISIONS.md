# Open decisions and source dependencies

Creating this candidate is authorized. Workplace adoption, execution and publication have not occurred. Facts settled by screenshots are distinguished from policy choices and missing implementation evidence.

| ID | Status / question | Candidate choice until adopted | Evidence or decision needed |
|---|---|---|---|
| OD-1 | POLICY — independent test challenge before implementation? | No new 2b state; reviewer challenges actual tests after implementation | Measure repeated vacuous/missing checks and repair cost before adding another state |
| OD-2 | POLICY — tiers or affected surfaces only? | Keep depth-only tier plus mandatory surface evidence | Pilot whether the scalar changes a useful decision; never use it to remove a state |
| OD-3 | POLICY — persistent learnings | Experimental, human-curated, off by default | Observed rediscovery cost and decision benefit; no automatic append |
| OD-4 | SOURCE/POLICY — human authorization and effective capabilities | Primary host conversation plus explicitly limited agent record; no claimed authentication | Host receipt/grants/sandbox/branch protection; adopt candidate-commit and publication policy |
| OD-5a | SETTLED BY SCREENSHOTS — gate verdict meaning | Preserve PASS/BLOCKED/HELD and separate script checksVerdict | E03–E06; still inspect live source before patching |
| OD-5b | SETTLED BY SCREENSHOTS — AC schema and readiness | sha column, full real commit, all rows L4+ for CLI success | E01–E02; no tracking check is visible in validator |
| OD-5c | SOURCE — capture, lock, replay and remaining guards | No fabricated wrapper or lock revision id; automatic exceptions cannot rely on the shown heuristics | Actual sources, producer/consumer fixtures, invocation registration and runner output |
| OD-6 | SOURCE/POLICY — candidate binding and retention | Exact commit/tree plus real plan/lock/input identities; evidence outside evaluated commit; immutable packet | Actual lock paths, clean execution basis, ignored dependency policy, retention/access and previously tracked-artifact migration |
| OD-7 | POLICY — full verification before review | Full before review; optional scoped review is diagnostic and changed final evidence gets a new review | Explicit estate selection and measured cost; unchanged SHA does not mean unchanged evidence |
| OD-8 | POLICY — release exceptions | Disabled until estate explicitly adopts the narrow RELEASE_EXCEPTION conditions | Human receipt policy, current complete nonlocked failure accounting or specifically permitted observation gap; R1–R3 first |
| OD-9 | SOURCE — separate evidence-auditor role | Not introduced; ambiguity routes to tester, approval evaluates eligibility | Actual definition and demonstrated need before adding another role |
| OD-10 | POLICY/HOST — manual handoffs | Non-fresh manual handoffs only; pipeline dispatch is orchestrator-owned; no reviewer outgoing shortcuts | Host context propagation/isolation observation |
| OD-11 | SOURCE — post-merge docs and deletion | Outside this run; only a separately invoked docs workflow | Actual skill and explicit cleanup scope; no automatic deletion |
| OD-12 | SOURCE — authored/generated/installed topology | This folder is a candidate source set, never copied blindly to .github | Actual generator, installer manifest, registration and source provenance |
| OD-13 | POLICY — adoption/promotion evidence | Behavioral benefit NOT MEASURED | Authorized representative pilot/evaluation, regression and cost evidence |

## Important partial resolutions

The photographs resolve what HELD means; they do not resolve who measured an execution. They show tree bracket comparison; they do not establish a lock revision format or committed-input equality. They show an AC validator that can read an untracked matrix; they do not establish every other consumer's retention expectations.

The old assumption that either review order is equally safe at unchanged SHA is removed. The exact reviewed evidence packet must remain current; a new full run may require a new review.

The remaining source dependencies block claims of workplace enforcement. They do not prevent maintaining and reviewing this isolated candidate.

## Added by round 2.2 (2026-09-17)

Earlier rows are unchanged. None of the items below was decided by this round; each states the candidate's interim behavior.

| ID | Status / question | Candidate choice until adopted | Evidence or decision needed |
|---|---|---|---|
| OD-14 | POLICY — protected user work when a run stops before release | Kept held; the human is asked once whether to restore now or keep it held; approval restores as the last act of release | Whether the team prefers automatic restoration on every stop, accepting re-protection and a re-established execution basis on resume |
| OD-15 | SOURCE — persisted form of fresh-role replies | Reply = envelope block + artifact body, persisted verbatim with a Persisted-by line; complete reply always kept in logs/results | Whether the actual audit-response checker and metrics reader tolerate a leading block in plan-audit.md / review.md; otherwise persist the body only |
| OD-16 | SOURCE — candidate execution in a second checkout | Route left unspecified; in-place route only | How the actual gate, AC checker, lock and tree-digest resolve root, HEAD and artifact paths; pictured gate shows no root option |
| OD-17 | SUPERSEDED 2026-09-17 by review finding R22-05, see the correction-round section below. As first written: SOURCE — does the gate list OTel NO_CLAIM under `inferred`? | NO_CLAIM is disclosed and never counted as agreement; the normal release rule "no accepted or unaccepted observation gaps" is left as written | Actual gate JSON with OTel absent. If NO_CLAIM is an inferred item, normal release would be unreachable without OTel and the rule needs an owner decision |
| OD-18 | SETTLED BY OWNER 2026-09-17, see the correction-round section below. As first written: POLICY — failures owned by a role in this run | Routed to that owner before review; only not-in-run and UNKNOWN-attribution failures go to diagnostic review | v2.1 said both "goes to dev" and "reaches review". This round chose the owner-first reading; the owner may prefer diagnostic review first |
| OD-19 | CONTRACT CHANGED 2026-09-17 by review finding R22-03, see the correction-round section below. As first written: SOURCE/POLICY — binding an audit to the plan it read | By plan revision number only; candidate.md binds the plan by digest | A plan edited without a revision bump would keep a stale audit looking current. A digest in the audit needs the auditor or host to compute it and the real response checker to accept the field |
| OD-20 | POLICY — which gate output release evaluation relies on | Unchanged from v2.1 and ambiguous: approval is told to "read gate JSON and the complete logs"; the tester captures gate output into the packet; nothing says whether approval re-runs the gate | If a human adds an observation acceptance after the packet was assembled, the captured output is out of date. Decide whether release re-runs the gate and how that interacts with packet freshness (exception route only; disabled under OD-8) |

## Correction round after the independent review (2026-09-17)

Review: `../reviews/2026-09-17-v2.2-review.md`. The rows above are kept as first written, with a status prefix where this round changes them.

| ID | New status | What changed |
|---|---|---|
| OD-17 | SETTLED BY SCREENSHOTS for the photographed version (R22-05) | B3.7 shows the NO_CLAIM branch adding an `otel` check with name, pass and detail and no `inferred` entry; B3.9 shows the inferred list built from each check's `inferred` property. NO_CLAIM therefore raises no observation-acceptance requirement there, and the hypothetical "normal release unreachable without OTel" blocker is withdrawn. Both photographs were reopened during this round. Correspondence to the installed workplace version and runtime behavior remain UNVERIFIED. NO_CLAIM is still never agreement and is still disclosed |
| OD-18 | SETTLED BY OWNER: owner-first at both targets (R22-02) | Asked in the host conversation on 2026-09-17; the owner chose "owner-first everywhere". A failure owned by a role in this run returns to that role before freeze and before review; only not-in-run and UNKNOWN-attribution failures are carried forward, disclosed. This line is an agent-written record of that answer, not authentication of it |
| OD-19 | CONTRACT IMPLEMENTED, provenance-limited (R22-03) | Audit currency is decided by plan sha256: the dispatcher measures it at dispatch, the auditor measures the file it read and returns both in its envelope, approval compares them with the digest frozen in candidate.md. The identity lives in the envelope so the parser-owned audit body is unchanged. Both digests are agent-measured; a host-computed identity would be stronger and is not available |

OD-14, OD-15, OD-16 and OD-20 are unchanged and still open. The review's notes on them are recorded as questions in `FABLE-RESPONSE-2026-09-17-R22.md`, not acted on.
