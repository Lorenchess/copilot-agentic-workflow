# Instruction precedence

> When repository instructions and the pipeline appear to disagree, which does the run follow?

Two layers, never conflated: **semantic ownership** (which source is the authority for a subject — the pipeline's to define) and **host loading** (which files the host loads and how it orders them — the host's, and only observable, not declarable).

## 1. Semantic ownership

| Subject | Authority |
|---|---|
| Framework and library versions, project layout, naming, idiom, build conventions, the local test command | **Repository instructions** |
| Acceptance criteria, proof bar, write lanes, test ownership, eligibility, commit/push/PR policy, tracker and other external writes | **Pipeline** |
| Tool permissions and platform safety limits | **Host / platform** — constrains both |

Most conflicts vanish once classified. Rulings for the ones that recur:

| Repository says | Ruling |
|---|---|
| "Use Java 21 and our Gradle conventions." | repository |
| "Use this local test command." | repository, unless it cannot produce the evidence the contract requires |
| "Commit and push when done." / "Open a PR automatically." / "Update Jira when complete." | pipeline: prepare the work and stop at the human decision |
| "Squash and merge your own PR." | pipeline: no agent merges a pull request, with no exception and no session flag |

When following one source over another changes behavior, say so in one line — never silently:

```text
Override: <repository instruction> -> <pipeline/host rule>, because <reason>.
```

Say which instruction files you read, and which agent set you used. For pipeline states use the rstack role agents, because the lanes and tool lists belong to those identities; a repository's own agents may inform the work and never replace a state.

## 2. No document can guarantee its own precedence

A sentence saying "these rules win" is a PROSE CONTRACT addressed to a model that may never see it. The pipeline must therefore not depend on precedence for correctness — and must be honest about what it depends on instead:

- The role guards, the gate and the estate guard run **because an instruction told an agent to run them**. A host that drops the instruction file also drops the guard run. They are self-run detectors, not an independent layer beneath the prose.
- The controls that do not depend on a model reading anything are the host's ask/deny rules, the tools each role's definition omits (the reviewer has no edit or terminal tool; no role has a PR-merge tool), and the human at each external action.

So for anything that must hold regardless: prefer **a withheld capability or a human decision** over a script an agent runs on itself, and that over prose. Where only prose exists, the documents say so (`harness-map.md`).

## 3. Host loading is observed per host, never assumed

Do not write a global "Personal > Repository > Organization" table as an architectural fact. For each supported host keep a small compatibility record in the adoption record:

```text
host / version:
instruction sources and where each is discovered:
observed precedence:
verified on / how:
```

Before relying on a user-level bootstrap file, verify: (1) it is actually loaded; (2) the repository's instruction file is loaded too; (3) a deliberate test conflict resolves as expected; (4) **the unsafe action is still stopped when the model gets the precedence question wrong** — by a host ask-rule or a missing tool, not by the model's answer. The fourth check is the one that matters. A model saying "the personal rule wins" is not evidence of anything.

## 4. The bootstrap file

`rstack-process.instructions.md` is installed by the installer into the host's user-level instruction location. The copy in this references directory is the template: a references directory is not an instruction discovery location, so that copy is **not** loaded. Do not add this directory to the host's instruction-locations setting — that would load a second copy at repository tier.

The bootstrap stays small: the global floor and where the real contract lives. It is not a second pipeline skill.
