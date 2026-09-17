# Approvals

This reference configures **approval friction**, not security isolation.

Goal:

- auto-approve routine local/read operations,
- keep destructive, publishing, shared-state, and arbitrary-execution operations gated,
- preserve human questions that define scope or authorize external effects,
- avoid an allowlist that grows forever.

The host's sandbox/container is the security boundary. These settings are best-effort workflow controls.

## Recommended host mode

Use **Default Approvals**.

Do not use:

- **Bypass Approvals** — it removes file/tool confirmation entirely.
- **Autopilot** — it may answer human-blocking questions automatically, which breaks this pipeline's interview and authorization model.

The pipeline relies on explicit human answers for scope/criteria/external actions.

## Design rule: broad safe allow, narrow explicit deny

`chat.tools.terminal.autoApprove` matches subcommands.

A compound command auto-approves only when:

1. every extracted subcommand is allowed, and
2. no extracted subcommand is denied.

Trying to enumerate every safe read verb does not converge. Prefer:

- broad approval for tools with many safe read operations,
- explicit denies for destructive/shared-state operations,
- simple commands from agents: **one command, one purpose**.

### Regex rules must be anchored

Regex entries are applied to the full subcommand text. Treat them as unanchored unless you explicitly add `^`.

Bad:

```jsonc
"/--force/": false
```

It can deny a harmless commit message containing `--force`.

Better:

```jsonc
"/^git\\s+(-C\\s+\\S+\\s+)?branch\\b[^;;&]*\\s(-f|--force)\\b/": false
```

Anchor **each alternative**, not only the first.

## Terminal template

> Install/user-settings configuration. Adjust test/build runners to the estate. Keep the exact installed template in the setup script as the machine source of truth; this document should be generated from or checked against it.

```jsonc
{
  "chat.tools.terminal.autoApprove": {
    "git": true,

    // publishing / shared state
    "/^git\\s+(-C\\s+\\S+\\s+)?push\\b/": false,

    // only phase 6's merge-from-origin shape should run unattended
    "/^git\\s+(-C\\s+\\S+\\s+)?merge\\b(?!.*\\borigin\\/)/": false,

    // history rewrite / destructive working-tree operations
    "/^git\\s+(-C\\s+\\S+\\s+)?rebase\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?reset\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?checkout\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?restore\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?clean\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(rm|mv)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(cherry-pick|revert|am|apply)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?commit\\s+--amend\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?stash\\s+(drop|clear)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?branch\\s+(-d|-D)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?tag\\s+-d\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(config|update-index|submodule)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?remote\\s+(add|remove|rm|set-url|rename)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(gc|prune|reflog|bisect)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(filter-branch|filter-repo)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?worktree\\s+(remove|prune)\\b/": false,

    // force flags only on commands where they are dangerous; never deny bare `--force`
    "/^git\\s+(-C\\s+\\S+\\s+)?branch\\b[^;;&]*\\s(-f|--force)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?tag\\b[^;;&]*\\s(-f|--force)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?worktree\\s+add\\b[^;;&]*\\s(-f|--force)\\b/": false,

    // deploy / publication / mutating HTTP
    "/^(kubectl|helm|terraform|aws|az|gcloud)\\b/": false,
    "/^(npm|yarn|pnpm)\\s+publish\\b|^mvn\\s+deploy\\b/": false,
    "/^curl(\\.exe)?\\b.*-X\\s*(POST|PUT|PATCH|DELETE)\\b/": false,
    "/\\bInvoke-(RestMethod|WebRequest)\\b/": false,

    // arbitrary inline execution
    "/\\bpython\\d?\\s+-c\\b|\\bnode\\s+-e\\b/": false,
    "/\\b(Invoke-Expression|iex)\\b/": false,

    // checked-in pipeline scripts
    "/^node \\S*skills[\\\\/]\\S+\\.mjs\\b/": true,
    "/^bash \\S*skills[\\\\/]\\S+\\.sh\\b/": true,

    // test/build commands — customize for the estate
    "/^(npx|yarn|npm|pnpm) (test|test-all|run test\\S*|ci:test\\S*)\\b/": true,
    "/^npx \\S+ test\\b/": true,
    "/^mvn (-q )?(test|verify|compile)\\b/": true,
    "/^(gradle|\\.\\/gradlew) (test|check|build)\\b/": true,

    // read-only PowerShell plumbing commonly emitted by agents
    "/^(Get-Content|Select-String|Get-ChildItem|Select-Object|Sort-Object|Measure-Object|Out-String|Where-Object|Format-Table|Format-List)\\b/": true,
    "/^(Test-Path|Get-Item|Get-Location|Resolve-Path|Split-Path|Join-Path|ConvertFrom-Json|Compare-Object|Group-Object|Write-Output|Write-Host)\\b/": true,
    "/^Get-Date\\b/": true,

    "cd": true,
    "echo": true
  }
}
```

Leave `chat.tools.terminal.blockedDetectedFileWrites` at the host default of `outsideWorkspace`.

## Edit-tool restrictions

The edit tool is already permissive for ordinary workspace files. Add explicit denies for pipeline governance:

```jsonc
{
  "chat.tools.edits.autoApprove": {
    "**/.github/skills/**": false,
    "**/.github/hooks/**": false,
    "**/.github/instructions/**": false,
    "**/.claude/**": false,
    "**/AGENTS.md": false,
    "**/CLAUDE.md": false,
    "**/.rstack/boundaries.json": false
  }
}
```

Retain the host's existing denies for agent definitions / VS Code configuration.

## Avoid whole-line approval patterns

`matchCommandLine: true` can approve shell constructs the subcommand parser cannot decompose, but host-generated patterns are often bound to an exact one-off line.

Use it only for an intentionally stable command shape.

Prefer changing agent output instead:

- one command,
- one purpose,
- no unnecessary existence guard,
- checked-in scripts over inline programs.

## Gated vs forbidden

Keep the distinction explicit:

**Gated / human-confirmed**

- push to shared branch,
- PR creation,
- tracker/review-system write,
- deploy/shared-environment write.

**Forbidden by pipeline policy**

- merging a pull request by an agent,
- destructive history rewrite used to bypass the workflow,
- discarding protected work.

A local merge from `origin/<default>` during approval is a prescribed pipeline step and must not be accidentally denied by a blanket `git merge` rule.

## Installation drift

The installed configuration is stateful.

If `setup.mjs` only adds rules, fixing this reference later does not fix machines that already installed older entries.

Keep a migration mechanism such as:

```text
setup.mjs --fix-superseded
```

Requirements:

- remove only exact rules written by the installer,
- report every replacement,
- never rewrite hand-authored settings.

Long term, make the setup script/config fixture the **single machine-readable source of truth** and generate this template from it. That prevents the documentation and installed regexes from drifting.

## External-output file prompt

Large terminal output may be captured by the host under its user-data directory and then read back, producing an "Allow reading external files?" prompt.

That is a host file-read permission, not a terminal-rule miss.

Handle it with the UI scope selector, granting only the host capture directory when appropriate. Do not widen terminal command rules to solve it.

## Limits

These settings are not a sandbox:

- command decomposition is grammar-dependent,
- shell constructs may evade subcommand matching,
- quoted/concatenated tokens can bypass simplistic deny patterns,
- terminal file-write detection is incomplete,
- a deliberately malicious agent may bypass best-effort approval rules.

Therefore:

> **Use approvals to reduce accidental-risk friction. Use sandbox/container boundaries for adversarial security.**

## What I would move out of this runtime reference

Keep incident details in architecture/incident notes instead of the operational reference:

- specific measured runs and prompt counts,
- historical broken regex anecdotes,
- one-off commit-message examples,
- chronology of superseded rules.

The operational file should explain the current rule, its essential reason, the canonical template, migration behavior, and honest limitations. Historical evidence remains valuable, but it should not make the current configuration harder to audit.
