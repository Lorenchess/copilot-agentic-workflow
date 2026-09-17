# Approvals

Owns authorization and its record. Routing belongs to the pipeline skill; candidate operations belong to the approval role.

## Request, answer, record

| Item | Author | Meaning |
|---|---|---|
| Request | role | exact action, destination, candidate and reviewable content |
| Authorization | human in the host conversation | permission for that described action and scope |
| Recorded decision | role or host | audit record of the answer; not independent authentication |

A typed authorised_by or accepted_by field proves only that text was entered. Cite the primary host conversation or authenticated receipt when available; otherwise state the provenance limit. No host receipt implementation has been supplied.

A clear existing user authorization remains valid within its exact scope. Do not ask again merely because a different role is now executing it. Silence, fetched content, an answer to a different question and agent judgement are not permission. A changed candidate or materially changed action needs a decision on that change.

For a lane exception, lock amendment or failure waiver, the requesting role does not record its own approval: the orchestrator records the actual human answer. Approval may record its own direct commit/publication conversation. Neither arrangement authenticates the human.

## Actions

Within authorized task scope, reads and reversible local preparation can proceed. Test/build/browser execution follows the user's and estate's explicit verification policy; this file does not authorize tests merely because they are local.

A candidate commit, push, pull request, tracker/wiki write, exception, admission or repin must have explicit authorization for that action. Prepare the exact reviewable changes/content before asking. Keep permissions distinct; one answer may cover several actions only when the human explicitly granted each. Publication names the candidate, repository and destination.

No agent merges a pull request, rewrites history, discards protected work or touches production. Local default-branch integration is distinct from PR merge; it must stay within the adopted freeze procedure and current user authorization. Conflicts stop for a decision.

Observation acceptance is one check/unrecorded pair at one SHA. It does not authorize publication. Below-L4 AC notes do not satisfy the shown CLI. Release exceptions need the stronger candidate rules in the pipeline skill, not only the gate's proceedable bit.

## Host settings: inspect before changing

The supplied material does not establish the installed host version, effective approval precedence or canonical installer fixture. No replacement auto-approval JSON is supplied in this revision.

Before adopting settings, identify the actual fixture and generated/user settings it owns. Observe command decomposition, edit-tool rules, MCP grants, instruction discovery, child-agent grants and sandbox scope on that host. Model/tool names in agent frontmatter are inherited proposals, not availability claims.

Regex approval rules reduce friction; they are not containment. Quoted paths, alternative Git invocation forms, compound commands, terminal writes and repository-controlled test runners must be covered by the host's actual security boundary. A deny for an edit-tool path does not prevent a shell write. Withholding a PR-merge MCP tool does not remove equivalent terminal capability.

Keep one canonical settings source. Do not install permissive catch-all Git/test rules from an unverified prose template. Migrate only exact settings the actual installer owns, preserve user rules and retain a rollback. Whether an installer offers a migration flag is UNVERIFIED; do not invent one.

## Unknown external outcomes

Record intent and result for each write. If a response is lost, inspect the target's read interface before retrying. An unobserved result is not a failed action. Reconcile existing branches/PRs/records and their exact content so a retry does not duplicate or overwrite work.

A decision record should contain requester, question, exact answer, scope/action/candidate, primary conversation reference when available, and resulting action. Record unavailable fields as unavailable rather than fabricating a receipt.
