# Adopting rstack on a team

A portability guide, not a runtime rulebook. Runtime authority stays in the pipeline skill, its references and the role definitions.

## Keep the discipline; adapt the mechanics

| Keep stable | Adapt to the team |
|---|---|
| Explicit scope, exclusions and decision owners | tracker, ticket format, terminology |
| Acceptance criteria tied to a source | product specs, ADRs, service contracts |
| The author of a check is never the author of the behavior, and neither judges the result | models, tools, runners, host capabilities |
| Fresh, independent plan audit and review on every ticket | how the host creates an isolated invocation |
| One candidate identity for verification, review and publication | what the host can reliably bind evidence to |
| Evidence that directly observes the behavior; unknown and unavailable stay unknown and unavailable | test frameworks, proof routes, retention and privacy policy |
| A human decides every external action; the pipeline merges no pull request and deploys nothing, and should not be extended to | who may approve commit, push, pull request and ticket writes |
| Least capability that does the job | each role's actual tool list |

Do not copy phase labels, filenames, numeric limits or scripts because they exist here. Keep one only while it still solves the same problem in the target environment.

## Minimum adoption record

Before the first production-like pilot, record in the team's existing source of truth (no new configuration file unless something consumes it):

1. **Authorities** — where product decisions, architecture and service contracts live.
2. **Writable scope** — estate root, which repositories may be active, which are context only.
3. **Capabilities** — tools, runners, environments, credentials; and per host: which instruction files load, in what observed order, verified how (`instruction-precedence.md`).
4. **Guarantee level** — for each boundary in `write-boundaries.md` §5 and each human decision in `approvals.md`: is it prose, a self-run check, or something the host really withholds? Record what was *observed*, not what the documents hope.
5. **Proof routes** — how each recurring kind of criterion can actually be observed; whether the full suite is cheap enough to run before every review or the scoped-review option is chosen.
6. **External-action owners** — who may approve which action.
7. **Evidence policy** — what artifacts may contain, where they live, how long; where the PR's verification table is the durable record.
8. **Optional mechanisms** — learnings on or off (default off); metrics collected or not.
9. **Adopted version and deviations**, each with its reason.
10. **Host and SCM facts**, each recorded as observed on the actual surface, never copied from another vendor's documentation (GitHub environment and ruleset controls are not Bitbucket facts):
   - the Copilot surface actually running RSTACK (VS Code, CLI, cloud agent, other) and its version;
   - whether hooks are supported on that surface, and whether they are GA, preview or unavailable there;
   - whether `postToolUse` exposes the tool's exit status or only result text;
   - whether MCP tools can be scoped by role or by state, or only per agent definition;
   - whether subagents are truly isolated and stateless, whether they can ask the user, and what their result returns to the parent;
   - whether frontmatter `tools` and `agents` are honoured (a tool absent from the list is unavailable, not merely hidden);
   - Bitbucket branch protection rules on the target repositories;
   - Bitbucket required-review behaviour (how many, who, whether re-approval is required after a new push);
   - whether Bitbucket supports preventing self-approval of the initiator's own change, and whether it is enabled;
   - who owns the publication credentials, and whether any role's session holds them before release;
   - whether any host-generated authorization receipt exists (who answered which prompt, for which action and candidate) — if none, every in-run decision is `HUMAN_RECORDED` and the human's own credential on a human-performed publication is the authenticated actor (`approvals.md`).

## Choose the playbook before the run

Do not start the ticketed pipeline and then remove controls because the task looks small.

| Work | Result |
|---|---|
| Investigation, incident analysis, design question, code read | scoped findings, cited evidence, stated uncertainty, a handoff; no synthetic red/green |
| Documentation-only change | verify the documentation outcome and links; do not manufacture executable tests |
| Behavior change or bug fix | the full pipeline: every state, at every tier |
| Cross-repository change | one repository-scoped run per writable repository under one key, an explicit interface between them, and evidence for each side; interface conformance is not end-to-end evidence |
| Release, deployment, PR merge, production operation | the team's authorised operational process; rstack prepares evidence and stops |

## Pilot deliberately

Expect the first runs to expose adapter gaps: a runner that reports modules instead of tests; output that cannot be mapped to source files; a dependency that cannot start; no callable verifier for an integration surface; evidence in a form the checks cannot read. These are capability gaps, not reasons to weaken a check. Absent evidence is a stated caveat in the result, never a quiet pass.

For each: record what could and could not be proven; name the missing adapter or proof route; decide to add support or keep the limit explicit; re-run on a representative ticket before making the adaptation a default.

Sequence: one representative low-risk ticket; one with a real external dependency or cross-module boundary; one that exercises the team's normal review and approval path. Only then tune limits, consider automating classification, or decide the open questions in `../OPEN-DECISIONS.md` that need run evidence.

The aim is not quiet runs. It is that every claim the pipeline makes corresponds to something the team can actually prove.
