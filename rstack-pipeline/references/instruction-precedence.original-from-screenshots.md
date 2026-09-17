# instruction-precedence.md — reconstructed from screenshots

> Reconstruction note: this is a careful consolidation of the visible text from the uploaded
> `pipeline/references/instruction-precedence.md` screenshots. It is not a byte-for-byte export
> of the repository file, but the visible wording and section order were preserved as closely
> as possible.

# Instruction precedence

A repository you work in already carries instructions its team wrote and pushed. They
are not wrong and they are not competitors. This file settles what happens when they
say something that contradicts the pipeline.

## The tiers, and which one can actually win

The host provides every applicable instruction file to the model and resolves conflicts
by tiers:

| Tier | Where it lives | Rank |
|---|---|---|
| Personal | the user profile instructions directory | **highest** |
| Repository | `.github/copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md` | middle |
| Organization | configured centrally | lowest |

**Two facts follow from that table, and both matter.**

First, an estate-root `.github/copilot-instructions.md` and a repository's own
`AGENTS.md` sit in the **same tier.** The host documents no ordering within a tier and
explicitly says none is guaranteed when files are combined. So placing the pipeline's
rules at the estate root does **not** make them beat a repository's rules. Anyone
relying on directory depth for precedence is relying on undefined behaviour.

Second, the only documented way to outrank a repository is to be **personal tier**. So
the pipeline's non-negotiable process rules belong in a user-level instructions file,
and everything else belongs where it is convenient.

## The split that makes most conflicts vanish

Most apparent conflicts are not conflicts, because the two files are about different
things:

| An instruction about | Who is authoritative |
|---|---|
| Framework versions, project layout, naming, which library to use, local idiom | **the repository.** It knows its code; the pipeline does not |
| What counts as verified, when work is done, when to commit, push, merge, open a pull request, or update a ticket | **the pipeline.** These are process, and a repository that automates them removes the human decision this stack exists to preserve. |

Read the active repository's own instructions and follow them on the first row. That is
not a concession, it is the reason the plan cites real file paths and the reason the
implementation looks like the surrounding code.

## The genuine conflicts, and what to do

These are the ones seen in practice:

- **"Commit and push when the change is complete."** Overridden. Nothing here pushes to
  a shared branch, and approval prepares a commit rather than publishing one.
- **"Open a pull request when tests pass."** Overridden. A clean gate is a precondition
  for a human's click and never a substitute for it.
- **"Update the ticket status when done."** Overridden. External writes are gated.
- **"Squash and merge your own change."** Overridden, with no exception and no session
  flag that unlocks it.
- **The repository ships its own agent definitions covering the same roles.** Prefer the
  pipeline's for pipeline work, because their write boundaries are what `role-guard`
  enforces. Say which set you used.

**Say when you override.** One line naming the instruction and why it lost. A silent
override teaches the next reader that the repository's instruction was followed, and the
next engineer to hit it has no idea a rule was in play.

## Where to put the personal-tier file

The pipeline ships the text as
[`rstack-process.instructions.md`](rstack-process.instructions.md). Copy it into the
host's user-level instructions directory, which is install-specific. Keep it **short**:
it is loaded on every request in every workspace, so anything that is not a
non-negotiable belongs in a skill instead.

**Leave the template where it is.** It sits in a references directory precisely because
that is not an instructions discovery location. Moving it into one, or adding its parent
to the host's instructions-locations setting, would load the same text at **repository**
tier, where it no longer outranks anything and quietly contradicts the copy that does.
A rule duplicated into the wrong tier is worse than one that is missing, because the
missing one is visible.

## Verify it, do not assume it

The tier table is documentation. Confirm the file is actually being applied before
depending on it: open a repository whose own instructions contradict one of the rules
above, ask the agent which instruction wins and why, and check that it names the
personal-tier rule. If it names the repository's, the file is not loading and the
precedence you think you have does not exist.
