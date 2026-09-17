# approvals.md — reconstructed from screenshots

> Reconstruction note: this is a careful consolidation of the visible text from the uploaded `pipeline/references/approvals.md` screenshots (IMG_1270–IMG_1278). It is not a byte-for-byte export of the repository file. Overlapping regions were deduplicated. The large JSONC template is transcribed from the visible screenshots as closely as possible; use the actual repository file as the authority for exact escaping before applying any setting.

# Approvals

A pipeline run issues dozens of terminal commands. Confirming each one by hand is
tiring enough that the confirmation stops being read and a dialog nobody reads is not a
control. This settles how to remove the friction without removing the protection.

## Do not solve it with a blanket permission level

Two of the host's levels approve everything, and neither is the right tool here.

**Bypass Approvals** approves every tool call, file edits included. The pipeline's write
boundaries are checks the agent runs on itself, so nothing else is standing between a
mistaken edit and the working tree.

**Autopilot is worse for this pipeline specifically**, and the reason is easy to miss:
it *auto-responds to questions that would normally block*. Three phases here are built
on asking a human. The planner asks which repository the work lands in rather than
inferring it. It interviews the user when acceptance criteria are not falsifiable. It
stops when a branch belongs to another ticket. Autopilot answers all three on its own,
which converts the interview into the invented criteria the phase exists to prevent.

**Use `Default Approvals`** and configure the terminal allow and deny lists underneath
it. That level is documented to respect the finer-grained settings; the other two
override them.

## The allow and deny lists

`chat.tools.terminal.autoApprove` maps a command pattern to `true` (approve
automatically) or `false` (always ask). Wrap a pattern in `/` for a regular expression.

The matching rule matters: **patterns match individual subcommands, and every subcommand
must match a `true` entry and no `false` entry.** So a compound command is approved only
when all of its parts are, and one unrecognised stage sends the whole line to a dialog.
That is the behaviour you want, and it is why some compound commands still prompt after
this is configured.

**It also means an allowlist of read verbs never converges.** A five-part command with
four parts allowed still prompts, so each new dialog is a different combination of the
same missing verb, and the list grows one annoyance at a time. Two attempts at
enumerating git's read verbs here both shipped with gaps, and the second gap was
`rev-list`, which is the command the planner's own branch rule prescribes.

**Invert it.** A deny entry beats an allow entry, so allow the tool wholesale and
enumerate what must never run unattended:

```jsonc
{ "git": true, "/\\bgit\\s+reset\\b/": false, "/\\bgit\\s+push\\b/": false }
```

That converges because the sets are asymmetric. A version control system has perhaps
twenty ways to read and grows more of them; it has about fifteen ways to lose work and
that set barely moves. Enumerate the small stable set, not the large growing one.

Two of the denials are worth their own sentence, because they are the operations that
discard work silently rather than loudly: `git checkout` and `git reset`. Neither is
needed here, since branches are created with `switch -c` and integration is a merge.

The host already ships defaults that approve common safe commands and block risky ones.
These entries extend them.

### A regex entry is not anchored, whatever the setting's description says

The host's own description of this setting says patterns "will be matched against the start of a
command". That is true of a plain word like `git`, and **false of every `/.../` entry**: the
regex form is compiled verbatim, unanchored, and tested against the whole subcommand text,
arguments included. Read off the host's regex conversion rather than the prose.

So an unanchored deny is a substring search over the command line, and these were all refused:

```text
git commit -m "add aws sdk client"      the cloud-vendor rule
git commit -m "drop --force from deploy" the force rule
git commit -m "remove wget fallback"     the outbound-HTTP rule
npm install --force                      the force rule
pip install --force-reinstall            the force rule
docker build --force-rm .                the force rule
```

A developer cannot diagnose any of those from a settings file, because the rule that fires
names a tool the command does not use. **Anchor every regex, and put `^` in front of every
alternative** -- one anchor before an alternation only anchors the first branch, which is how
`wget` in a commit message reached a deny about HTTP.

Anchoring alone is not always enough. A rule matching a bare flag, like `--force`, still finds
it inside a quoted message on a git command. Where that happens, replace the flag rule with the
subcommands it uniquely covered, chosen so each takes no free text.

### A construct is not a subcommand, and the escape hatch does not scale

The patterns in the table below match the *parts* of a command, because extraction is
grammar-based. A shell conditional has no parts it can reach:

```powershell
Test-Path .rstack/boundaries.json; if (Test-Path .rstack/boundaries.json) { Get-Content .rstack/boundaries.json }
```

Every verb there is a read and two are allow-listed, and it prompts anyway, because
`if (...) { ... }` is a construct rather than a subcommand. Observed on a real run.

There **is** an escape hatch, and it is worth understanding before reaching for it. An
entry whose value is an object carrying `matchCommandLine: true` is tested against the
whole command line rather than its parts:

```jsonc
{ "/^Test-Path \\S+$/" : { "approve": true, "matchCommandLine": true } }
```

The host's own Allow dropdown writes these for you, fully escaped and anchored end to end,
and that is the trap: the entry it generates is bound to the exact line it saw. A ticket
key, a quoted path, and the order of two flags all end up inside the pattern, so it
matches once and never again. Four such entries accumulated in a single run here, every
one naming the same ticket. That is the non-convergence this file opens with, reached one
dialog at a time instead of one verb at a time.

So use it for a shape chosen on purpose, never for whatever the dropdown offers. Keep it
narrow for a second reason as well: a whole-line allow is held in a different rule set
from the subcommand rules, and whether a subcommand denial still beats it was not
established here. Treating a loose whole-line allow as safe would be the substitution
this stack exists to prevent, so the deny entries above should not be assumed to survive
one.

The better fix is on the other side, in what the agents emit: **one command, one purpose,
no guard.** Read the file and let a missing-file error be the answer, rather than testing
for it first and reading it second. That halves the commands, removes the dialog, and it
also just tends to go wrong. The rule is stated for agents in the pipeline skill, because
a rule that lives only in this file changes nothing: nothing reads this file except a
human configuring an install.

### The denylist is the valuable half

**Gated and forbidden are different, and this paragraph used to blur them.** It said the stack
"forbids pushing, merging, rewriting history, and discarding work", which was wrong in two
directions at once. Pushing a branch is *gated*: phase 6 asks, and a human who answers yes gets
the push. Bringing the default branch in is not gated at all, it is phase 6's own prescribed
step, and a blanket `git merge` deny here put a dialog in front of it on every run. What is
genuinely forbidden, on any verdict and under any autonomy grant, is **merging a pull request**
-- which is the standing rule's wording, not this file's.

So: rewriting history and discarding work are denied here. Pushing is denied here because a
dialog is exactly what "gated" means in this table. Merging a pull request is not something a
terminal rule can reach at all.

Until now every one of those was prose an agent was asked to follow. Writing them here as
`false` makes them the first rules in this pipeline that are actually enforced rather than
checked afterwards. **Configure the denylist even if you never configure the allowlist.**

## Template

Install-specific, so it belongs in user or workspace settings rather than in this
repository. Adjust the build and test entries to the runners the estate actually uses.

```jsonc
{
  "chat.tools.terminal.autoApprove": {
    // git wholesale, minus the operations that lose work or change shared state.
    "git": true,

    // ANCHOR EVERY REGEX. See "A regex entry is not anchored" below: without `^` these
    // match inside a quoted argument, so they deny commit messages.
    "/^git\\s+(-C\\s+\\S+\\s+)?push\\b/": false,

    // Bringing the default branch in is phase 6's prescribed step; merging a local or
    // feature branch is not. The lookahead is what separates them.
    "/^git\\s+(-C\\s+\\S+\\s+)?merge\\b(?!.*\\borigin\\/)/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?rebase\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?reset\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?checkout\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?restore\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?clean\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(rm|mv)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(cherry-pick|revert|am|apply)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?commit\\s+--amend\\b/": false,

    // Only the two stash forms that lose work. `push` and `pop` are prescribed by phase 6.
    "/^git\\s+(-C\\s+\\S+\\s+)?stash\\s+(drop|clear)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?branch\\s+(-d|-D)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?tag\\s+-d\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(config|update-index|submodule)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?remote\\s+(add|remove|rm|set-url|rename)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(gc|prune|reflog|bisect)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?(filter-branch|filter-repo)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?worktree\\s+(remove|prune)\\b/": false,

    // Named per subcommand rather than as a bare `--force`. A bare one matched
    // `git commit -m "drop --force from deploy"`, and anchoring did not save it.
    "/^git\\s+(-C\\s+\\S+\\s+)?branch\\b[^;;&]*\\s(-f|--force)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?tag\\b[^;;&]*\\s(-f|--force)\\b/": false,
    "/^git\\s+(-C\\s+\\S+\\s+)?worktree\\s+add\\b[^;;&]*\\s(-f|--force)\\b/": false,

    // deploys, publication, and mutating HTTP are external writes
    "/^(kubectl|helm|terraform|aws|az|gcloud)\\b/": false,
    "/^(npm|yarn|pnpm)\\s+publish\\b|^mvn\\s+deploy\\b/": false,
    "/^curl(\\.exe)?\\b.*-X\\s*(POST|PUT|PATCH|DELETE)\\b/": false,
    "/\\bInvoke-(RestMethod|WebRequest)\\b/": false,

    // inline code is arbitrary execution; a checked-in script is not
    "/\\bpython\\d?\\s+-c\\b|\\bnode\\s+-e\\b/": false,
    "/\\b(Invoke-Expression|iex)\\b/": false,

    // the pipeline's own scripts, by extension and location
    "/^node \\S*skills[\\\\/]\\S+\\.mjs\\b/": true,
    "/^bash \\S*skills[\\\\/]\\S+\\.sh\\b/": true,

    // suites and builds. Replace with the runners this estate uses.
    //
    // A repository often invokes its runner through a package executor rather than a
    // named script, so the script-name patterns alone leave a gap that shows up as a
    // prompt at the worst moment: the first time a suite runs. The executor form is
    // bounded by requiring `test` as the subcommand, and that is a genuine loosening,
    // because an executor can fetch and run a package the repository does not contain.
    // Pin the exact runner instead where that matters.
    "/^(npx|yarn|npm|pnpm) (test|test-all|run test\\S*|ci:test\\S*)\\b/": true,
    "/^npx \\S+ test\\b/": true,
    "/^mvn (-q )?(test|verify|compile)\\b/": true,
    "/^(gradle|\\.\\/gradlew) (test|check|build)\\b/": true,

    // read-only shell plumbing. An agent pipes output through these constantly, and
    // one unlisted formatter sends the whole compound command to a dialog.
    //
    // `Test-Path` was the gap found the hard way: so it is the verb an agent reaches for
    // before reading a file that may not exist, so it appears early in a run and it was
    // missing from this list for the whole of the first one.
    "/^(Get-Content|Select-String|Get-ChildItem|Select-Object|Sort-Object|Measure-Object|Out-String|Where-Object|Format-Table|Format-List)\\b/": true,
    "/^(Test-Path|Get-Item|Get-Location|Resolve-Path|Split-Path|Join-Path|ConvertFrom-Json|Compare-Object|Group-Object|Write-Output|Write-Host)\\b/": true,

    // Reading the clock, which is the single most frequent command in a run because every
    // run-log row is timestamped from the machine rather than guessed. Missing from this list
    // for its first several runs: one measured run stopped 37 times to ask what time it was.
    // Only the cmdlet form is reachable. `(Get-Date).ToUniversalTime()...` is an expression
    // with no subcommand, so no entry here can approve it -- see the construct section above,
    // and note that the agents were changed to emit `Get-Date -AsUTC -Format ...` instead.
    "/^Get-Date\\b/": true,

    "cd": true,
    "echo": true
  }
}
```

Leave `chat.tools.terminal.blockedDetectedFileWrites` at its default of
`outsideWorkspace`. A terminal command writing outside the workspace still asks, which
is the case that costs somebody else their afternoon.

## The edit tool has its own map, and this stack only narrows it

`chat.tools.edits.autoApprove` is the same shape -- glob to boolean, last match wins -- and it
ships with `**/*: true` plus specific denies. So in-workspace edits are already approved and
there is nothing here to widen. What the shipped set does not know about is this pipeline's
governance class: the files that define what each agent may do. The terminal list refuses them
and `role-guard.mjs` refuses a waiver for them, while the edit tool would have approved a
rewrite of any of them without asking. Three controls, one absent, and the absent one is the
tool an agent edits with.

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

The host's defaults already carry `**/.github/agents/**` and `**/.vscode/*.json`. These are the
rest of the same class. It is application-scoped, so it belongs in user settings and cannot be
set per workspace.

## A corrected rule does not reach a machine that already installed

`setup.mjs` adds entries and never changes one, which is the right default and has a cost that
took a measured run to notice: when this file corrects a rule, every machine that installed
earlier keeps the broken one, and nothing tells the developer. Both of the entries corrected so
far made the pipeline stop on a **read** -- a blanket `git stash` deny caught `git stash list`,
which the last gate of every run executes, and a blanket `git switch` deny caught the planner's
first command.

`setup.mjs --fix-superseded` removes those, reporting each with its replacement and what it costs.
Only exact matches of strings the script itself wrote are eligible, so a hand-authored rule is
never touched.

## One dialog this table cannot reach

The host writes long terminal output to a file under its own user-data directory and reads
it back, which counts as reading outside the workspace and raises "Allow reading external
files?". It is the host's own scratch, not something an agent chose, and no entry in the
table above covers it: these are file reads rather than terminal commands.

Worth knowing for two reasons. It recurs on any command with substantial output, so it is
the dialog most likely to be clicked without reading. And it explains a file that looks
alarming in a transcript: an agent appearing to read `content.txt` out of nowhere is the
host handing it captured output, not a read-only agent writing scratch files. That
distinction was checked on a real run before anyone was accused of anything.

Settle it with the scope dropdown beside the Allow button rather than by widening the
terminal lists, and grant the directory rather than the file, because the name carries a
fresh uuid each time.

## Honest limits

Straight from the host's own documentation, and worth repeating because the
configuration above reads more solid than it is:

- **Best effort, and it assumes the agent is not acting maliciously.** It is friction
  removal, not a sandbox.
- **Subcommand extraction is grammar-based.** Patterns are not detected where the shell
  grammar does not split them, and there is no grammar for every shell.
- **Quote concatenation subverts it.** `find -exec` is blocked and `find -e"x"ec` is not,
  while doing the same thing. Any denylist entry here can be evaded the same way by
  anything that wants to.
- **File-write detection is minimal**, so a terminal command can write files that the
  editing tools would have required approval for.

So the denylist raises the cost of a mistake and does not prevent a determined bypass.
Where prompt injection is a real possibility, the host's sandboxing or a container is the
control, and this file is not a substitute for either.
