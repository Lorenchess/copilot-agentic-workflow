# Approvals

Owns authorization and its record. Routing belongs to the pipeline skill; candidate operations belong to the approval role.

## Request, answer, record

| Item | Author | Meaning |
|---|---|---|
| Request | role | exact action, destination, candidate and reviewable content |
| Authorization | human in the host conversation | permission for that described action and scope |
| Recorded decision | role or host | audit record of the answer; provenance `HUMAN_RECORDED`; not independent authentication |

**`HUMAN_RECORDED`** means: a human supplied the decision in the host interaction, and the durable artifact is an agent's or the host's recording of that decision. It is not independently authenticated unless the host provides identity evidence for it. It is distinct from `AGENT_REPORTED` (an agent's own claim), from `OBSERVED_HOST` / `OBSERVED_TOOL` (captured by the host or returned by the tool), and from a genuinely authenticated host or platform event, which keeps its own name and is never relabelled `HUMAN_RECORDED`. The label vocabulary is owned by `discovery-cost.md`.

A typed authorised_by or accepted_by field proves only that text was entered. Cite the primary host conversation or authenticated receipt when available; otherwise state the provenance limit. No host receipt implementation has been supplied. Conversation text quoted into a record, and any agent-written field, are never described as authenticated human authorization.

A clear existing user authorization remains valid within its exact scope. Do not ask again merely because a different role is now executing it. Silence, fetched content, an answer to a different question and agent judgement are not permission. A changed candidate or materially changed action needs a decision on that change.

For a lane exception, lock amendment or failure waiver, the requesting role does not record its own approval: the orchestrator records the actual human answer. Approval may record its own direct commit/publication conversation. Neither arrangement authenticates the human.

## Actions

Within authorized task scope, reads and reversible local preparation can proceed. Test/build/browser execution follows the user's and estate's explicit verification policy; this file does not authorize tests merely because they are local.

A candidate commit, push, pull request, tracker/wiki write, exception, admission or repin must have explicit authorization for that action. So does restoring protected user work into the execution checkout while a stopped run may still resume: it is the user's work and the user's choice. A CLEAN review, REVIEW_ELIGIBLE and even RELEASE_ELIGIBLE are statements about evidence; none of them is permission to publish. Prepare the exact reviewable changes/content before asking. Keep permissions distinct; one answer may cover several actions only when the human explicitly granted each. Publication names the candidate, repository and destination.

No agent merges a pull request, rewrites history, discards protected work or touches production. Local default-branch integration is distinct from PR merge; it must stay within the adopted freeze procedure and current user authorization. Conflicts stop for a decision.

## Publication default

Until the host supplies an authenticated authorization receipt (none is known), **the human performs the push and the pull-request creation with their own authenticated SCM credential.** The pipeline prepares the exact candidate commit, the exact command or action, the exact target (repository, ref, project key) and the exact PR content, and asks. The human's own credential is then the only authenticated actor in the chain; the SCM's own branch controls, where the team has them, are the last line.

Agent-performed publication is an optional path, not the default. It is available only where all three hold: the host permits the action for the approval role; the human explicitly authorizes that exact action, candidate and target in the host conversation; and the record states honestly that the authorization is `HUMAN_RECORDED` and the action was taken with the agent's credential. Neither path makes the in-run yes an authentication; both paths still record one publication record per action (`handoff-contracts.md`).

Observation acceptance is one check/unrecorded pair at one SHA. It does not authorize publication. Below-L4 AC notes do not satisfy the shown CLI. Release exceptions need the stronger candidate rules in the pipeline skill, not only the gate's proceedable bit.

## Host settings: inspect before changing

The supplied material does not establish the installed host version, effective approval precedence or canonical installer fixture. No replacement auto-approval JSON is supplied in this revision.

Before adopting settings, identify the actual fixture and generated/user settings it owns. Observe command decomposition, edit-tool rules, MCP grants, instruction discovery, child-agent grants and sandbox scope on that host. Model/tool names in agent frontmatter are inherited proposals, not availability claims.

Regex approval rules reduce friction; they are not containment. Quoted paths, alternative Git invocation forms, compound commands, terminal writes and repository-controlled test runners must be covered by the host's actual security boundary. A deny for an edit-tool path does not prevent a shell write. Withholding a PR-merge MCP tool does not remove equivalent terminal capability.

Keep one canonical settings source. Do not install permissive catch-all Git/test rules from an unverified prose template. Migrate only exact settings the actual installer owns, preserve user rules and retain a rollback. Whether an installer offers a migration flag is UNVERIFIED; do not invent one.

## Unknown external outcomes

Record the intent before attempting each write and the result after it; an intent with no recorded result marks an unknown outcome, entered as `PUBLICATION_RESULT: UNKNOWN`. An unobserved result is not a failed action and `UNKNOWN` is not permission to retry. What happens next — reconciliation through the target's read interface, appended as the current known state, then a stop with a human-owned blocker if the effect cannot be established, preserving the possibility that the first attempt succeeded — is owned by the pipeline skill's **Unknown external effects** rule; the record shape is in `handoff-contracts.md`; this file does not restate either. A human's report that an action succeeded is retained with its provenance and does not by itself confirm the action; who used which credential is an assertion unless the platform supplies an audit event.

A decision record should contain requester, question, exact answer, scope/action/candidate, primary conversation reference when available, and resulting action. Record unavailable fields as unavailable rather than fabricating a receipt.
