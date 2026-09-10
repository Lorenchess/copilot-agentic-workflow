# Implementation Questions

Implementers record open questions raised while working a checkpoint here instead of editing the approved contract (`docs/specs/2026-09-09-phase-1-architecture-contract.md`).

| Checkpoint | Question | Raised by | Status | Answer |
|---|---|---|---|---|
| C1 | Exact Sonnet-5 model picker string in the work environment? | Sonnet | Deferred (needed only when running at work) | |
| C1 | Jira MCP server name as shown in the tools picker, and the exact read tool names for: get issue with field names, list comments, list links, JQL search? | Sonnet | Deferred (needed only when running at work) | |
| R2 | Bitbucket MCP server name as shown in the tools picker, and the exact tool names for: create pull request; read branch / read repository (to re-confirm the remote SHA before creating); read existing pull requests for a branch (the required existing-PR check before creating)? Needed to replace the commented-out capability lines in `pr.agent.md`'s `tools:` list with live entries. | Sonnet | Open | |
