# Planner Repository Grounding and Specification-Conflict Handling

## Purpose

This document defines a correction to the planning flow used by RSTACK-style agentic SDLC pipelines.

The current planning design intentionally separates **intent**, **specification**, and **implementation planning**:

- `intent.md` captures **why** the work is needed.
- `spec.md` captures **what** must be true.
- `plan.json` captures **how** the repository will be changed.

That separation is correct and should be preserved.

The problem is that the current pipeline allows the specification to be written before the Planner has established relevant facts about the current codebase. As a result, `spec.md` can contain factual statements about existing behavior that have not been verified against the repository. The later planning phase may discover that those statements are false or contradictory, but the workflow has no explicit, controlled mechanism for returning that conflict to the human and correcting the specification.

The recommended correction is:

> **Keep intent independent from the implementation, add targeted repository reconnaissance before specification, require evidence for current-state claims, and add an explicit specification-conflict path when deeper planning discovers a contradiction later.**

---

## 1. Current behavior

The current workflow is effectively:

```text
Request / ticket
    ↓
Planner — intake
    ↓
intent.md
    ↓
Planner — specification
    ↓
spec.md
    ↓
Planner — plan
    ↓
plan.json
    ↓
Plan Auditor
    ↓
Human decision
```

The Planner currently operates in separate modes.

### Intake mode

The Planner uses the request and owner answers to produce `intent.md`.

This is appropriate. Intent should represent:

- the problem;
- the desired outcome;
- scope and exclusions;
- unresolved product decisions.

Intent should not be rewritten around whatever the current implementation happens to make easy.

### Specification mode

The Planner creates `spec.md` from the request, intent, and owner answers.

The current design intentionally prevents implementation details from determining the requirements. That goal is correct.

The weakness is that the specification can still contain statements about **current behavior** even though the specification phase has not established those facts from the repository.

Examples of current-state assertions include:

- “authentication is unchanged”;
- “this route already requires authentication”;
- “the current implementation returns 403”;
- “the existing service uses this configuration”;
- “this behavior already exists and must be preserved”;
- “the endpoint is currently public”;
- “there is already a feature flag for this behavior.”

Those are not product requirements. They are repository facts and should not be stated as facts without repository evidence.

### Plan mode

The Plan phase is the first phase that performs substantial repository investigation.

At that point the Planner may discover that:

- a factual assumption in the specification is incorrect;
- the specification asks to preserve behavior that does not actually exist;
- the ticket and the implementation disagree about current behavior;
- two acceptance criteria become contradictory once the actual code is understood;
- a required product decision was hidden behind an incorrect assumption about the current implementation.

The current workflow does not give the Planner a first-class way to report:

> “The specification is not safe to plan against because one of its current-state assumptions is contradicted by the retained repository.”

The Planner is then forced into a bad choice:

1. follow the specification literally even though part of its factual basis is wrong;
2. silently reinterpret the specification to match the code;
3. choose one side and leave the contradiction for the Plan Auditor to discover later.

None of these is desirable.

---

## 2. The core design mistake

The current design correctly tries to enforce this principle:

> **Current implementation must not determine product intent.**

But it effectively turns that into a stronger and unsafe rule:

> **Specification should not inspect the codebase.**

Those are not equivalent.

A specification contains two different kinds of statements:

### A. Normative requirements

These describe what the system **must** do after the change.

Examples:

- unauthenticated requests must return 403;
- exports must be disabled when the feature flag is off;
- the existing public API response shape must remain compatible.

The authority for these statements is:

- the request/ticket;
- owner answers;
- approved product decisions.

The current code does **not** have authority to weaken these requirements.

### B. Descriptive current-state claims

These describe what the system **does today**.

Examples:

- the route is currently `permitAll`;
- the controller currently calls the exporter before authorization;
- the feature flag already exists;
- the current response is 401;
- the module already depends on a shared library.

The authority for these claims is the retained repository.

These statements require code/configuration evidence.

The pipeline needs to preserve this distinction explicitly.

---

## 3. Recommended workflow

Use the same Planner role, but add a separate repository-reconnaissance mode between Intent and Specification.

Recommended flow:

```text
Request / ticket
      ↓
Planner — Intake
      ↓
intent.md
      ↓
Planner — Repository Reconnaissance
      ↓
repo-facts.json
      ↓
Planner — Specification
      ↓
spec.md
      ↓
Planner — Deep Planning
      ↓
plan.json
      ↓
Plan Auditor
      ↓
Human decision
```

This does **not** require another reasoning agent.

The same Planner can be invoked in four bounded modes:

1. `intake`
2. `reconnaissance`
3. `specification`
4. `plan`

The important control is that each invocation has a different purpose and input set.

---

## 4. Intent remains implementation-independent

Do **not** make deep repository investigation a prerequisite for `intent.md`.

The purpose of `intent.md` remains:

> Capture why the change exists and what outcome the owner wants.

Recommended intake inputs:

```text
source request
owner answers, if any
```

Recommended intake output:

```text
intent.md
```

The Planner should not rewrite the requested outcome merely because the current repository uses a different architecture or because a different behavior is easier to implement.

Repository exploration during intake should be exceptional and limited to cases where the request cannot even be interpreted without locating a named component.

The default should remain request-first.

---

## 5. Add targeted repository reconnaissance

After Intent is settled, run a bounded reconnaissance pass.

Its job is **not to create an implementation plan**.

Its job is to establish the current-state facts necessary to write an honest specification.

### Reconnaissance should answer questions such as

- Where is the relevant endpoint/controller/service implemented?
- What authentication/authorization rule currently applies?
- What configuration currently controls the behavior?
- Does the named feature flag already exist?
- Which module owns the behavior?
- What tests currently describe the behavior?
- Is a “preserve existing behavior” statement actually true?
- Does the repository contradict a factual assumption in the request?
- Does the request depend on a component or interface that does not exist?

### Reconnaissance should not decide

- how the final implementation should be structured;
- which class should be refactored unless needed to establish a fact;
- which implementation strategy is cheapest;
- whether a requirement should be weakened because the code makes it difficult.

That belongs to Plan mode.

---

## 6. Recommended repository-facts artifact

Introduce one compact, canonical artifact such as:

```text
repo-facts.json
```

The exact schema may be adjusted to existing pipeline conventions, but the semantics should be similar to:

```json
{
  "schema_version": 1,
  "record_type": "repository-facts",
  "base": "sha256:<retained-base-tree>",
  "facts": [
    {
      "id": "RF-1",
      "claim": "The job-start endpoint is currently configured as permitAll.",
      "evidence": [
        {
          "path": "src/main/java/.../SecurityConfig.java",
          "identity": "sha256:<file-bytes>",
          "locator": "securityFilterChain / job-start matcher"
        }
      ]
    }
  ],
  "conflicts": [],
  "limitations": []
}
```

### Requirements

Every repository fact should:

- have a stable ID;
- state one factual claim;
- identify the retained base tree it came from;
- cite the actual file/configuration evidence;
- preserve limitations when the fact could not be established.

Prefer evidence bound to the retained base-tree identity rather than mutable working-tree paths alone.

The artifact should be small. It is not a codebase summary.

---

## 7. Ground current-state claims in the specification

Specification mode should receive:

```text
source
intent
owner answers
repo-facts
```

Then apply the following rule:

> **A normative requirement needs requirement authority. A current-state factual claim needs repository evidence.**

### Examples

Valid normative criterion:

```text
AC-1: An unauthenticated request to the job-start endpoint returns 403.
```

Authority:

```text
ticket / owner decision
```

Repository fact:

```text
RF-1: The endpoint is currently configured permitAll.
```

Authority:

```text
retained SecurityConfig.java evidence
```

The Spec should not silently convert:

```text
Current code is permitAll
```

into:

```text
The endpoint should remain permitAll.
```

Nor should it convert:

```text
Ticket says unauthenticated requests are rejected today
```

into a current-state fact if the repository shows otherwise.

---

## 8. Distinguish an implementation gap from a specification conflict

This distinction is critical.

### Normal implementation gap — not a conflict

The requirement says:

```text
Unauthenticated requests must return 403.
```

The current code says:

```text
permitAll
```

That is normally just the work to implement.

The specification can remain valid:

```text
desired future behavior = 403
current state = permitAll
```

The Plan explains how to close the gap.

### Real specification conflict

A conflict exists when the specification or its authority contains an assumption that cannot safely coexist with established facts.

Examples:

```text
"Authentication behavior must remain unchanged"
```

combined with:

```text
"Unauthenticated requests must become forbidden"
```

when the repository proves the endpoint is currently public.

Or:

```text
"Preserve the existing 403 behavior"
```

when retained code/tests prove no such behavior exists.

Or:

```text
"Use the existing feature flag"
```

when the retained repository proves the flag does not exist and the request does not authorize adding one.

Those require clarification rather than silent reinterpretation.

---

## 9. Add an explicit specification-conflict path

Repository reconnaissance will catch many problems, but deep Plan investigation can still discover new evidence.

Therefore Plan mode must have a first-class way to report:

```text
SPEC_CONFLICT
```

or an equivalent structured condition.

The Planner must **not** be forced to produce a normal plan when it discovers a material contradiction in the specification.

Recommended behavior:

```text
Planner finds material spec conflict
        ↓
structured conflict record
        ↓
engine validates evidence
        ↓
human clarification checkpoint
        ↓
owner resolves requirement
        ↓
spec regenerated
        ↓
plan reruns against revised spec
```

Do not let the Planner silently patch `spec.md`.

Do not let the Planner choose which requirement “probably” matters more.

Do not let the Plan Auditor become the primary repair mechanism for a specification the Planner already knows is inconsistent.

---

## 10. Recommended conflict record

A bounded record could look like:

```json
{
  "schema_version": 1,
  "record_type": "spec-conflict",
  "spec": "sha256:<spec>",
  "base": "sha256:<base-tree>",
  "conflicts": [
    {
      "id": "SC-1",
      "target": "AC-8",
      "spec_claim": "Access control remains unchanged.",
      "repository_fact": "RF-1",
      "evidence": "sha256:<repo-facts>",
      "reason": "The retained code shows the route is currently public while another criterion requires unauthenticated access to be forbidden.",
      "decision_needed": "Clarify whether access control should change or whether AC-8 should be revised."
    }
  ]
}
```

The exact schema should follow existing RSTACK record conventions.

The important requirement is that the conflict is explicit, retained, evidence-bound, and human-resolved.

---

## 11. Human clarification must be requirement-level

The existing planning approval checkpoint is primarily about approving or amending a plan.

A specification conflict is different.

The human must be able to resolve the requirement itself.

Recommended actions at a specification-conflict checkpoint:

```text
clarify
revise-spec
reject
pause
```

The owner response must become retained requirement authority.

After a requirement-level change:

1. regenerate the applicable specification;
2. invalidate plans/audits based on the previous spec;
3. plan again;
4. audit again.

Do not preserve a Plan Auditor approval from a superseded specification.

---

## 12. Deep Plan investigation remains necessary

Repository reconnaissance should be targeted.

Plan mode should still investigate the repository as deeply as needed to determine:

- implementation locations;
- dependency boundaries;
- affected modules;
- sequencing;
- migration concerns;
- test strategy;
- configuration interactions;
- material implementation risks.

So the design should **not** collapse reconnaissance and planning into one huge early code-analysis pass.

The intended separation is:

```text
Reconnaissance:
"What is true today that the spec needs to know?"

Plan:
"How should this approved requirement be implemented in this repository?"
```

This preserves both requirement independence and implementation realism.

---

## 13. Plan claims should be grounded too

The current Plan contract already expects material claims to carry evidence.

Keep and strengthen that behavior.

A Plan should never rely on an uncited statement such as:

```text
"The security filter already handles this."
```

It should cite the actual retained repository evidence.

Plan evidence may refer directly to base-tree files or reuse a repository fact when appropriate.

The repository-facts artifact is an index, not a limit on Plan investigation.

---

## 14. Plan Auditor changes

The Plan Auditor should receive:

```text
source
intent
repo-facts
spec
plan
```

Its responsibilities should include:

### Requirement fidelity

Does the Plan satisfy the approved specification?

### Repository-grounding fidelity

Are the Plan's material claims supported by the retained code/configuration?

### Conflict handling

Did the Planner ignore or conceal a known repository/specification conflict?

### Scope fidelity

Did implementation details cause the Plan to weaken or reinterpret the requirement?

The Auditor should independently inspect primary repository evidence where necessary.

It should not trust `repo-facts.json` merely because the Planner produced it.

---

## 15. Evidence and freshness

Repository reconnaissance must be bound to the exact application baseline for the run.

Recommended invariant:

```text
repo-facts.base == retained run base tree
```

If the base changes, the repository facts become stale.

Dependent artifacts should be invalidated conservatively:

```text
base change
    ↓
repo facts stale
    ↓
spec current-state claims potentially stale
    ↓
plan/audit stale
```

Do not carry repository facts between materially different base trees without revalidation.

---

## 16. What should remain source-owned

The pipeline must preserve a hierarchy of authority.

### Product authority

Owned by:

- source request;
- explicit owner answers;
- human requirement decisions.

### Current-state authority

Owned by:

- retained repository bytes;
- validated repository-fact evidence.

### Implementation authority

Owned by:

- approved specification;
- repository evidence;
- Planner's bounded engineering reasoning.

### Audit authority

Owned by:

- independent Plan Auditor result;
- primary evidence it actually checked.

No layer should silently replace the authority of another.

---

## 17. What not to do

### Do not deeply inspect the repository before Intent by default

This risks allowing implementation details to reshape the problem before the requested outcome is understood.

### Do not let current code weaken requirements

```text
"The code is currently public, therefore public access must be intended."
```

is not a valid requirement inference.

### Do not let Specification make unsupported current-state claims

If the Spec says something is true today, it needs repository evidence.

### Do not force Plan to choose between conflicting authorities

A material conflict should stop and be surfaced.

### Do not rely on Plan Auditor to discover every bad specification

The Auditor is a valuable independent defense, not the first mechanism for resolving a contradiction already known by the Planner.

### Do not duplicate the whole repository into planning artifacts

Use concise facts and evidence references.

---

## 18. Recommended workflow shape

Target workflow:

```text
source request
      ↓
Planner / intake
      ↓
intent
      ↓
[open product question?]
      ├── yes → human → intake again
      └── no
           ↓
Planner / repository reconnaissance
           ↓
repo facts
           ↓
[blocking requirement conflict?]
      ├── yes → human clarification → specification
      └── no
           ↓
Planner / specification
           ↓
spec
           ↓
Planner / deep plan
           ↓
[late spec conflict?]
      ├── yes → human clarification → regenerate spec → plan again
      └── no
           ↓
plan
           ↓
Plan Auditor
           ↓
combined brief
           ↓
human plan decision
```

---

## 19. Suggested implementation changes

The implementation agent should evaluate the smallest changes needed across:

### Workflow

Add a `reconnaissance` stage between Intent and Specification.

Consider a requirement-conflict human-wait path that can be entered from:

- reconnaissance;
- plan.

### Planner role

Add `reconnaissance` mode.

Clarify mode responsibilities:

- intake = why;
- reconnaissance = relevant current-state facts;
- specification = what must be true;
- plan = how.

### Contracts

Add a repository-facts contract.

Add a structured specification-conflict representation or equivalent validated engine state.

### Task inputs

Give reconnaissance access to the exact retained base tree/repository subject.

Give Specification the repository-facts reference.

Give Plan both repository facts and the specification.

Give Plan Auditor repository facts as an input.

### State / freshness

Bind repository facts to the retained base identity.

Invalidate dependent results if their factual basis no longer matches.

### Human decisions

Add requirement-level clarification semantics distinct from plan amendment.

### Versioning

If the stage graph or persisted record semantics change, bump the workflow version and preserve honest interpretation of older runs.

Do not silently reinterpret previous runs under the new flow.

---

## 20. Acceptance tests

At minimum, add deterministic tests for the following.

### RECON-1 — Intent stays request-driven

A repository whose current implementation contradicts the desired future behavior does not cause Intake to weaken or rewrite the requested outcome.

### RECON-2 — Repository facts are evidence-bound

A current-state fact names the retained base and resolvable repository evidence.

### RECON-3 — Unsupported current-state claim is refused

Specification cannot rely on a current-state assertion that has no repository-fact evidence when the contract requires such grounding.

### RECON-4 — Requirement can intentionally differ from current code

Desired behavior differs from current implementation, but no factual contradiction exists. The workflow continues to Plan rather than incorrectly raising a conflict.

### RECON-5 — Request assumption contradicted by code

A source assumption about current behavior is contradicted by retained repository evidence. The conflict is surfaced rather than silently copied into Spec.

### RECON-6 — Preserve-existing claim is false

A requirement says to preserve a named existing behavior that the retained base proves does not exist. Human clarification is required.

### RECON-7 — Plan discovers late conflict

Reconnaissance misses a deeper contradiction. Plan mode can produce a structured conflict instead of a misleading normal plan.

### RECON-8 — No silent spec mutation

Planner cannot resolve a conflict by changing retained `spec.md` on its own.

### RECON-9 — Requirement clarification invalidates downstream planning

After the owner changes the requirement, prior Plan/Audit evidence for the superseded Spec is not reused.

### RECON-10 — Auditor receives repository grounding

Plan Auditor can independently check repository facts and plan claims.

### RECON-11 — Stale repository facts are rejected

Repository facts bound to base A cannot be used as current-state authority for base B.

### RECON-12 — Deep planning remains independent of reconnaissance scope

Plan mode may inspect repository evidence beyond the facts recorded during reconnaissance.

---

## 21. Evaluation criteria

The corrected design should be considered successful when all of the following are true:

1. Intent remains independent from implementation convenience.
2. Specification no longer states unverified current behavior as fact.
3. Current-state claims have repository evidence.
4. Desired future behavior may legitimately differ from current implementation.
5. A real requirement/specification contradiction becomes an explicit state, not hidden Planner reasoning.
6. The human can resolve requirement-level conflicts before implementation.
7. Plan remains deeply repository-aware.
8. Auditor independently verifies both requirement fidelity and repository grounding.
9. Base/fact/spec/plan/audit identities remain traceable.
10. The change does not add another reasoning agent solely to perform reconnaissance.

---

## 22. Recommended decision

**Change the planning flow.**

Do not move deep repository analysis ahead of Intent.

Instead:

```text
Intent
→ targeted repository reconnaissance
→ grounded Specification
→ deep repository-aware Plan
→ independent Audit
```

and add:

```text
material specification conflict
→ explicit retained conflict
→ human requirement clarification
→ regenerate dependent planning artifacts
```

This keeps the original architectural advantage — requirements are not bent around the current implementation — while removing the current failure mode where a specification can make unsupported claims about existing behavior and the Planner later has no safe way to challenge them.
