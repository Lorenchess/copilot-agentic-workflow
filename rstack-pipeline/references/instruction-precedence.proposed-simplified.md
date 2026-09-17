# Instruction precedence

This reference answers one question:

> When repository instructions and pipeline process rules appear to disagree, which source should the run follow?

The answer has **two separate layers** that must not be conflated:

1. **Semantic ownership**: which source is authoritative for the subject matter.
2. **Host loading precedence**: which instruction source the current host/model actually applies first.

The pipeline owns the first. The host owns the second.

## 1. Semantic ownership

Most apparent conflicts disappear when rules are classified by subject.

| Subject | Authority |
|---|---|
| Framework/library versions, local project layout, naming, coding idiom, build conventions | **Repository instructions** |
| Acceptance criteria, proof bar, write boundaries, test ownership, gating, commit/push/PR policy, ticket/external writes | **Pipeline process** |
| Tool permissions and platform safety limits | **Host / platform** |

Repository instructions make code fit the repository.

Pipeline process rules make the run auditable and preserve human control over external effects.

Host/platform rules always constrain both.

## 2. Never make correctness depend on custom-instruction precedence

The factory must remain safe even if the host:

- changes instruction precedence,
- combines same-tier files differently,
- does not load one expected file,
- runs in another supported host,
- or ignores an instruction file entirely.

Therefore:

**Non-negotiable process rules must be enforced by the harness whenever enforcement is possible.**

Examples:

- write lanes -> `role-guard.mjs` / `estate-guard.mjs`
- proof/gate semantics -> `gate.mjs`, `ac-check.mjs`, `test-lock.mjs`
- external action approval -> approval phase / host permission boundary
- artifact shapes -> contract validators

Instruction files explain and bootstrap those controls. They are not the control.

## 3. Host precedence is host-specific, not pipeline policy

Do not encode one global Personal > Repository > Organization table as an architectural guarantee
unless the active host/version explicitly documents and demonstrates it.

For each supported host, keep a small compatibility record:

```text
host:
version:
instruction sources:
observed precedence:
verification date:
verification method:
```

Where a host provides a user-level/personal instruction location that reliably outranks repository
instructions, the pipeline may place a **small bootstrap file** there. That file should contain only
rules that help the model find and respect the real harness.

It must not become a second copy of the pipeline skill.

## 4. Conflict handling

When a repository instruction conflicts with pipeline process:

- follow the repository on **code conventions**;
- follow the pipeline on **verification and delivery process**;
- follow the host/platform where it imposes a stronger safety/tool restriction.

Examples:

- "Use Java 21 and the repository's existing Gradle conventions." -> repository
- "Commit and push when done." -> pipeline approval process governs the external action
- "Open a PR automatically after tests pass." -> pipeline approval process governs
- "Update Jira when complete." -> pipeline approval process governs
- "Squash and merge your own PR." -> pipeline/human boundary governs
- "Use this local test command." -> repository, unless it conflicts with evidence requirements

When an override materially changes behavior, report it in one line:

```text
Override: <repository instruction> -> <pipeline/host rule>, because <reason>.
```

Do not silently override.

## 5. Repository-provided agent definitions

Repository agents may still be useful for repository-specific knowledge.

For pipeline phases, use the pipeline phase agent whose write lane and contract the harness expects.
A repository agent may inform the work, but it must not silently replace a phase whose identity is
part of the enforcement model.

## 6. Bootstrap instruction file

`rstack-process.instructions.md` should be **short**.

Its purpose is to tell the host/model:

- this workspace uses the rstack pipeline,
- where the pipeline skill and authoritative references live,
- that harness-enforced boundaries must not be bypassed,
- that external writes require the pipeline's human checkpoint.

Do not duplicate detailed phase rules, artifact schemas, or gate behavior there.

Keep the template in the references area unless the installer is deliberately copying it to a
host-specific instruction location.

## 7. Verify loading, not just precedence

Before relying on a host-specific bootstrap file, verify:

1. the file is actually loaded,
2. the expected repository instruction file is also loaded,
3. a deliberate test conflict resolves as expected,
4. the harness still blocks the unsafe action even if the model answers the precedence question wrong.

The fourth check is the most important.

A model saying "the personal rule wins" is not proof of enforcement. A guard refusing the forbidden
write is.

## 8. Maintenance

This file should describe **semantic precedence** and the portability rule.

Host-specific precedence details belong in host compatibility documentation or installer tests, where
they can change without rewriting the pipeline architecture.

If a rule must be true for correctness, prefer:

**script / gate / permission boundary > prose instruction precedence.**
