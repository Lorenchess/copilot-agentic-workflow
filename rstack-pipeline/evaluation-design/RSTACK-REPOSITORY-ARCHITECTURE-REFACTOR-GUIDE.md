# RSTACK Repository Architecture Refactor Guide

**Status:** Architecture-review guidance only.

**Purpose:** Help Claude 5 inspect the current RSTACK repository/workspace, determine which files are canonical versus generated/runtime/evaluation/documentation, and propose a clearer AI software factory structure without changing behavior during the analysis pass.

This guide does **not** authorize moving files, changing runtime paths, regenerating host packages, changing models, changing pipeline behavior, changing agent responsibilities, changing Skill discovery, changing hooks or permissions, or modifying artifact schemas.

First understand the current system. Then propose the migration.

> **A new engineer should be able to look at the repository and immediately understand where the factory brain, workers, controls, host adapters, evaluation system, tests, generated outputs, and documentation live.**

---

# 1. Why this review is necessary

RSTACK has grown through custom agents, Skills, references, hooks, scripts, model configuration, generated Copilot/Claude artifacts, evaluation design, tests, historical reviews, runtime evidence, and host-specific packaging.

That growth is expected.

The problem is that the repository can become difficult to reason about when those concerns are visually mixed.

A developer may have to ask:

~~~text
Which copy of Planner is canonical?
Do I edit agents, copilot-agents, .github, generated, or a plugin tree?
Is this Skill authored source or installed output?
Does this hook belong to the control plane or a host adapter?
Where is model routing configured?
Where is evaluation logic versus execution logic?
Which files describe policy and which files enforce it?
Where are tests of the factory itself?
Is .rstack source code or runtime state?
What can safely be regenerated?
~~~

Those questions should have obvious answers.

---

# 2. Evidence discipline

The owner has shown a workspace containing custom-agent files, copilot-agents, hooks, Skills, scripts, tests, models.json, generated files with GENERATED FILE headers, evaluation material, and host/plugin-specific folders.

That is evidence that authored source, generated host output, tooling, and evaluation material may be visually close together.

It does **not** prove:

- which copy is canonical,
- which generator owns each generated file,
- which paths are installed at runtime,
- whether all displayed trees belong to the same repository revision,
- or which paths the active host loads.

Claude must establish those facts from the actual local repository, generators, tests, install scripts, and host configuration.

Do not infer authority from filenames alone.

---

# 3. Target conceptual architecture: four planes

Use this as the architecture we are aiming to evaluate and adapt.

~~~text
                            RSTACK FACTORY
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                        │
          ▼                       ▼                        ▼
     CONTROL PLANE          EXECUTION PLANE          EVALUATION PLANE
          │                       │                        │
      pipeline                 agents                   rubrics
      routing                  skills                   datasets
      policies                 tools                    judges
      state                    hooks                    experiments
          │                       │                        │
          └───────────────┬───────┴──────────────┬─────────┘
                          │                      │
                          ▼                      ▼
                    HOST ADAPTERS           OBSERVABILITY
                          │                      │
                   Copilot / Claude          Laminar etc.
                   Devspace / Bedrock
                          │
                          ▼
                    DEVELOPER PROJECT
                          │
                          ▼
                   .rstack/runs/JIRA
                          │
                          ▼
                       PR
~~~

This is a conceptual target, not a claim about the current implementation.

---

# 4. Plane 1 — Control plane

The control plane owns how the factory is governed.

Examples:

- pipeline states,
- routing,
- transition predicates,
- candidate freshness,
- authorization rules,
- human checkpoints,
- write-boundary policy,
- recovery policy,
- risk policy,
- artifact contracts,
- central model-routing configuration where applicable.

Conceptual shape:

~~~text
control-plane/
  pipeline/
  contracts/
  policies/
  state/
~~~

Claude must answer:

1. Where is the actual state machine defined today?
2. Is routing defined once or repeated across agents/scripts/hooks?
3. Which files are normative policy owners?
4. Which files merely restate policy?
5. Which decisions are deterministic and should become code?
6. Which decisions require semantic judgment?
7. Which decisions belong to humans?
8. Which policies are host-independent versus host-specific?

---

# 5. Plane 2 — Execution plane

The execution plane performs engineering work.

Examples:

- Planner,
- Plan Auditor,
- Tester,
- Developer,
- Reviewer,
- Approval,
- reusable Skills,
- repository tools,
- validators,
- execution-support hooks,
- deterministic harness scripts.

Conceptual shape:

~~~text
execution/
  agents/
  skills/
  harness/
    validators/
    hooks/
    scripts/
~~~

Claude must answer:

1. Where is each role's canonical authored definition?
2. Which agent files are generated outputs?
3. Which Skills are shared procedures versus host packaging?
4. Which scripts enforce objective behavior?
5. Which hooks are general harness behavior versus Copilot-specific integration?
6. Which responsibilities are duplicated between agents and Skills?
7. Which role instructions contain pipeline-wide concerns that belong in the control plane?
8. Which role instructions contain deterministic logic that belongs in harness code?

Use the instruction-hardening guide to classify degrees of freedom.

---

# 6. Plane 3 — Host adapters

Host-specific packaging should be separated from portable RSTACK semantics.

Potential hosts:

- GitHub Copilot / VS Code,
- GitHub Copilot / IntelliJ,
- Claude Code,
- Devspace,
- Bedrock or another future API runtime.

A host adapter may own:

- frontmatter translation,
- model selector syntax,
- host-specific tool names,
- installation paths,
- Skill packaging,
- hook registration,
- generated host files,
- capability probes.

Conceptual shape:

~~~text
adapters/
  copilot/
    vscode/
    intellij/
  claude-code/
  devspace/
  bedrock/
~~~

Claude must answer:

1. What is currently Copilot-specific?
2. What is Claude-specific?
3. Which files are portable but located inside host-specific trees?
4. Are generated files being mistaken for authored source?
5. Does a host require a flat Skill/agent installation layout?
6. Can host output be generated reproducibly from canonical source?
7. Which host capabilities remain unverified?

---

# 7. Plane 4 — Evaluation plane

Evaluation is a first-class subsystem.

It should not look like miscellaneous documentation.

Responsibilities:

- rubrics,
- datasets,
- golden cases,
- experiments,
- judge configuration,
- evaluator calibration,
- normalized results,
- model comparisons,
- instruction-architecture experiments,
- artifact-efficiency experiments,
- exporters to observability systems such as Laminar.

Conceptual shape:

~~~text
evaluation/
  rubrics/
  schemas/
  datasets/
  golden-cases/
  experiments/
  judges/
  reports/
  exporters/
    laminar/
~~~

Claude must answer:

1. Which evaluation files are methodology versus runtime inputs?
2. Which evaluation files belong in the public reference repo?
3. Which real-run results must stay internal?
4. Which schemas must remain portable across hosts?
5. Which post-run evaluator config is independent of execution?
6. Where should Laminar/export/observability integration live?
7. Which evaluation artifacts are authored versus generated from runs?

---

# 8. Runtime state is not factory source

A developer project's runtime directory:

~~~text
PROJECT/
  .rstack/
    runs/
      TICKET/
~~~

is not RSTACK source.

Keep this explicit:

~~~text
FACTORY SOURCE
defines how RSTACK behaves

!=

.rstack RUNTIME STATE
records what happened in one project/run
~~~

Analogy:

~~~text
Docker source       != container filesystem
CI pipeline source  != build workspace
RSTACK source       != .rstack run evidence
~~~

Claude must check whether runtime examples, real runs, or evaluation outputs are mixed into authored source.

---

# 9. Generated output must be unmistakable

Establish exactly one canonical authored source wherever practical.

Generated files should clearly communicate:

~~~text
GENERATED — DO NOT EDIT

Source:
<canonical source>

Generator:
<generator/tool>

Regenerate:
<exact command>
~~~

Desired relationship:

~~~text
CANONICAL AUTHORED SOURCE
        │
        ▼
DISTRIBUTION / GENERATOR
        │
        ├── Copilot output
        ├── Claude output
        └── Devspace output
~~~

For every apparent duplicate Claude must answer:

1. Which file is canonical?
2. Which file is generated?
3. What command regenerates it?
4. Is regeneration deterministic?
5. Is the generated copy committed?
6. Does CI verify generated output is current?
7. Can someone accidentally edit the generated copy?
8. Are generated files present in multiple trees?
9. Are equivalent outputs byte-equal where expected?
10. Are differences intentional host translations?

---

# 10. Distribution should be explicit

Packaging and installation should be separate from factory semantics.

Conceptual shape:

~~~text
distribution/
  generators/
  templates/
  install/
  packaging/
~~~

Potential derived output:

~~~text
generated/
  copilot/
  claude/
  devspace/
~~~

The exact paths are proposals.

Claude must inspect the existing generator/installer before recommending moves.

---

# 11. Tests should test the factory itself

The repository should make factory tests obvious.

Conceptual categories:

~~~text
tests/
  contracts/
  routing/
  agent-behavior/
  skills/
  reference-loading/
  generated-output/
  safety/
  end-to-end/
~~~

Examples:

- latest audit STOPPED must not reuse an older successful audit,
- malformed result envelope must be rejected,
- moved reference rule remains reachable,
- generated Copilot agent matches canonical source,
- Developer cannot silently weaken proof,
- first-audit human checkpoint prevents automatic second round when configured,
- unknown external effect must reconcile before retry.

Prefer deterministic tests for deterministic properties.

---

# 12. Skills can be grouped semantically in canonical source

A host may require a flat installed Skill directory.

That does not require canonical authored source to be flat.

Potential grouping:

~~~text
skills/
  workflow/
    pipeline
    mode
    decision-log

  planning/
    repo-locate
    repo-profile
    estate-sweep
    blast-radius

  verification/
    prove-it
    ac-matrix
    create-service-verifier
    maintain-service-verifier

  communication/
    plainly
    explain-me

  platform/
    authed-session
    model-pins

  evaluation/
    eval-skill
~~~

If the host requires flat names, generate the flat installation layout.

Do not reorganize until discovery/install behavior is tested.

---

# 13. Agents can be role packages in canonical source

Potential canonical organization:

~~~text
execution/
  agents/
    planner/
      AGENT.md
      examples/

    plan-auditor/
      AGENT.md
      examples/

    tester/
      AGENT.md
      examples/

    developer/
      AGENT.md
      examples/

    reviewer/
      AGENT.md
      examples/

    approval/
      AGENT.md
      examples/
~~~

Generated host output can remain flat where required:

~~~text
generated/copilot/agents/
  rstack-planner.agent.md
  rstack-plan-auditor.agent.md
  ...
~~~

This allows examples to live near roles without inflating permanent prompts.

---

# 14. Target repository example

Use this as a model to adapt, not a mandatory literal migration.

~~~text
rstack/
│
├── README.md
├── ARCHITECTURE.md
│
├── factory/                         # CANONICAL AUTHORED SOURCE
│   │
│   ├── control-plane/
│   │   ├── pipeline/
│   │   │   └── SKILL.md
│   │   ├── contracts/
│   │   │   ├── handoffs.md
│   │   │   ├── candidate.md
│   │   │   └── evidence.md
│   │   ├── policies/
│   │   │   ├── write-boundaries.md
│   │   │   ├── approvals.md
│   │   │   ├── risk-tiers.md
│   │   │   └── recovery.md
│   │   └── state/
│   │       └── models.json
│   │
│   ├── execution/
│   │   ├── agents/
│   │   │   ├── planner/
│   │   │   ├── plan-auditor/
│   │   │   ├── tester/
│   │   │   ├── developer/
│   │   │   ├── reviewer/
│   │   │   └── approval/
│   │   │
│   │   ├── skills/
│   │   │   ├── workflow/
│   │   │   ├── planning/
│   │   │   ├── verification/
│   │   │   ├── communication/
│   │   │   └── platform/
│   │   │
│   │   └── harness/
│   │       ├── validators/
│   │       ├── hooks/
│   │       └── scripts/
│   │
│   └── shared/
│       ├── principles/
│       └── schemas/
│
├── adapters/                        # HOST-SPECIFIC
│   ├── copilot/
│   │   ├── vscode/
│   │   └── intellij/
│   ├── claude-code/
│   ├── devspace/
│   └── bedrock/
│
├── evaluation/                      # QUALITY SYSTEM
│   ├── rubrics/
│   ├── schemas/
│   ├── datasets/
│   ├── golden-cases/
│   ├── experiments/
│   ├── judges/
│   ├── reports/
│   └── exporters/
│       └── laminar/
│
├── tests/                           # TEST THE FACTORY
│   ├── contracts/
│   ├── routing/
│   ├── agent-behavior/
│   ├── skills/
│   ├── reference-loading/
│   ├── generated-output/
│   ├── safety/
│   └── end-to-end/
│
├── distribution/                    # BUILD / INSTALL
│   ├── generators/
│   ├── templates/
│   └── install/
│
├── generated/                       # NEVER EDIT BY HAND
│   ├── copilot/
│   ├── claude/
│   └── devspace/
│
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── research/
│   ├── adoption/
│   └── history/
│
└── examples/
    └── sample-project/
~~~

The exact paths may differ.

The separation of responsibilities is the important part.

---

# 15. The ten one-minute questions

Use these as a usability test.

A new engineer should be able to answer quickly:

1. Where is the pipeline state machine?
2. Where do I change Planner behavior?
3. Where do I add a reusable planning procedure?
4. Where do I change a hard policy?
5. Where do I add a deterministic guard?
6. Where do I configure the intended model for a role?
7. Where is Copilot-specific translation?
8. Where is generated Copilot output?
9. Where do I evaluate whether my change improved the factory?
10. Where are regression tests for RSTACK itself?

For each question, report:

- current location,
- proposed location,
- ambiguity today,
- migration required.

If these answers are not obvious, architecture discoverability needs improvement.

---

# 16. Current-tree inventory

Before proposing moves, classify every relevant current path.

| Field | Meaning |
|---|---|
| Current path | Exact repository-relative path |
| Type | file / directory |
| Concern | pipeline / agent / skill / hook / script / eval / docs / generated / runtime |
| Canonical? | YES / NO / UNKNOWN |
| Generated? | YES / NO / UNKNOWN |
| Runtime-loaded? | YES / NO / HOST_DEPENDENT / UNKNOWN |
| Producer | human / generator / host / script / unknown |
| Consumers | exact known readers |
| Degree of freedom | L0 / L1 / L2 / HUMAN / N/A |
| Portable? | host-independent / host-specific / mixed |
| Target plane | control / execution / adapter / evaluation / distribution / docs |
| Migration risk | LOW / MEDIUM / HIGH |
| Evidence | source/generator/config establishing classification |

Do not classify a file as generated solely because its header says generated. Find the producer.

---

# 17. Duplicate-source audit

Search for equivalent or generated copies of:

- agents,
- Skills,
- hooks,
- model config,
- rules,
- scripts,
- references.

For every duplicate group report:

~~~text
CANONICAL SOURCE:
GENERATED COPIES:
GENERATOR:
INSTALL DESTINATIONS:
MANUAL EDIT RISK:
DRIFT DETECTION:
~~~

Distinguish:

- intentional generated duplication,
- compatibility copies,
- historical copies,
- accidental competing sources.

The highest-risk condition is two files that both look editable and authoritative.

---

# 18. Dependency and reference graph

Build a graph of:

- agent → Skill,
- Skill → reference,
- Skill → script,
- hook → script,
- generator → source,
- generated output → host destination,
- evaluator → rubric,
- test → runtime component.

Flag:

- cycles,
- deep reference chains,
- references pointing into generated output,
- generated files consumed as source,
- host-specific dependencies inside portable policy,
- evaluation dependencies leaking into execution.

---

# 19. Architecture smells to flag

## Mixed authority

Two locations both appear to own the same rule.

## Generated-source ambiguity

A developer can edit generated output without realizing it will be overwritten.

## Host leakage

Portable policy uses Copilot-specific paths or tool names directly.

## Runtime/evaluation leakage

Execution agents consume post-run evaluation output from the same run.

## Documentation on hot path

Historical rationale is loaded as runtime instruction.

## Flat semantic namespace

Many Skills exist with no grouping or obvious ownership.

## Script/prompt duplication

An objective check exists in code but agents are also told to reproduce it manually.

## Path-driven architecture

Folders reflect historical implementation rather than system responsibility.

## Evaluation as an afterthought

Rubrics/experiments are mixed with miscellaneous docs.

## Unclear regeneration

Generated output cannot be reproduced from a clean checkout with one documented process.

---

# 20. No-behavior-change migration principle

Do not combine architecture migration with semantic redesign unless unavoidable.

Separate:

~~~text
PATH / OWNERSHIP MIGRATION
from
PROMPT REFACTOR
from
MODEL CHANGE
from
WORKFLOW CHANGE
from
ARTIFACT FORMAT CHANGE
~~~

The first migration should preserve:

- role responsibilities,
- model selections,
- effort settings,
- state transitions,
- result tokens,
- hook behavior,
- permissions,
- human checkpoints,
- test semantics.

If moving a path changes host discovery behavior, test it explicitly.

---

# 21. Proposed migration phases

## Phase 0 — architecture analysis

No moves.

Produce inventory, ownership map, dependency graph, duplicate-source map, target tree, and risk assessment.

## Phase 1 — canonical-source markers

Without behavior change:

- document canonical authored roots,
- document generated roots,
- standardize generated-file headers where appropriate,
- document regeneration commands,
- identify unsupported manual copies.

## Phase 2 — distribution/generation hardening

Make generated host output reproducible.

Add drift tests.

## Phase 3 — control-plane extraction

Group routing, contracts, policies, and state/config.

Preserve compatibility paths or generate them.

## Phase 4 — execution-plane organization

Group canonical agents, Skills, and harness scripts.

Preserve host-required generated layouts.

## Phase 5 — evaluation-plane consolidation

Organize rubrics, datasets, experiments, judges, exporters, and reports.

Keep real internal run evidence out of the public reference repo.

## Phase 6 — host adapters

Move host-specific transformations and installers into adapter/distribution ownership.

## Phase 7 — enforce architecture

CI or deterministic checks detect:

- manual edits to generated files,
- stale generated output,
- broken references,
- competing canonical owners,
- undeclared generated artifacts.

Every phase needs rollback.

---

# 22. Reproducibility target

A clean checkout should eventually support something conceptually like:

~~~text
validate
test
generate
~~~

using the project's real tooling.

Desired properties:

- generated output reproducible,
- generated drift detectable,
- canonical source clear,
- adapters independently testable,
- installation package derivable from source.

Do not add a new build system just for appearance.

---

# 23. README / ARCHITECTURE expectations

Top-level architecture docs should explain:

1. What RSTACK is.
2. The four planes.
3. Canonical source root.
4. Generated output root.
5. Host adapter strategy.
6. Runtime .rstack distinction.
7. Evaluation feedback loop.
8. How to regenerate host output.
9. How to run factory tests.
10. Where to make common changes.

Do not duplicate detailed policy in ARCHITECTURE.md.

Link to canonical owners.

---

# 24. Architecture evaluation criteria

Evaluate the target structure against:

- **Discoverability** — can a new engineer find the owner quickly?
- **Authority clarity** — canonical versus generated is obvious.
- **Portability** — portable semantics survive host change.
- **Testability** — control, execution, adapters, and evaluation can be tested independently.
- **Progressive disclosure** — only relevant instructions need loading.
- **Deterministic hardening** — validators/scripts have an obvious home.
- **Evaluation maturity** — rubrics/experiments/judges/dashboard exporters have an obvious home.
- **Distribution clarity** — host artifacts can be regenerated.
- **Migration safety** — architecture can move incrementally.
- **Operational fit** — actual Copilot/Claude/Devspace requirements still work.

Do not prefer conceptual elegance over host compatibility.

---

# 25. Required Claude deliverable

For the analysis pass, produce **one architecture review**, not another documentation suite.

Suggested public-safe path:

~~~text
rstack-pipeline/reviews/<YYYY-MM-DD>-repository-architecture-review.md
~~~

If the review contains internal paths or workplace evidence, keep it in an approved internal location.

The report must contain:

## A. Executive assessment

- what the current tree communicates,
- largest ambiguities,
- most important risks,
- what should remain unchanged.

## B. Current inventory

Use the table from section 16.

## C. Canonical/generated map

For every duplicate group.

## D. Current conceptual architecture

Map real current paths into control, execution, adapters, evaluation, distribution, generated, docs, and runtime.

## E. Target architecture

Adapt section 14 to the real repository. Do not create unused folders.

## F. Ten one-minute questions

Answer each for current and proposed architecture.

## G. Migration plan

Small ordered phases with exact path/consumer/generator/test implications.

## H. Behavioral risks

Especially Skill discovery, agent loading, generated drift, broken references, duplicate authority, and host-specific failures.

## I. Tests

Use RSTACK-INSTRUCTION-ARCHITECTURE-EVAL-PLAN.md.

## J. Recommendation

Classify proposed migrations:

- KEEP NOW
- EXPERIMENT
- DEFER
- REJECT

Stop before implementation unless separately authorized.

---

# 26. Questions Claude must answer explicitly

1. What is the single canonical authored source today?
2. If there is not one, which competing sources exist?
3. Which directories are generated?
4. Can every generated artifact be traced to a generator and source?
5. Where is the actual pipeline state machine?
6. Where are policies versus role procedures?
7. Where are deterministic controls?
8. Which hooks are portable versus host-specific?
9. Which Skills are portable versus host packaging?
10. Which model config is canonical?
11. Which tests validate the factory itself?
12. Where does post-run evaluation belong?
13. Where should Laminar/export/observability integration live?
14. What is runtime .rstack versus factory source?
15. What is historical versus active?
16. Which folder names are host implementation details?
17. What can move without behavior change?
18. What cannot move until generator/host tests exist?
19. What should CI enforce after migration?
20. Does the target architecture make the ten one-minute questions obvious?

If any answer is UNKNOWN, preserve uncertainty and name the evidence needed.

---

# 27. Example decisions

## Generated Copilot agent

If a current file is generated:

~~~text
factory/execution/agents/planner/AGENT.md
        ↓ generator
generated/copilot/agents/rstack-planner.agent.md
~~~

Do not adopt this exact path without proving generator support.

## Model configuration

Canonical config may conceptually live in:

~~~text
factory/control-plane/state/models.json
~~~

Evaluation evidence explaining why a model was selected belongs in evaluation, not runtime config.

## Skill grouping

Canonical:

~~~text
factory/execution/skills/planning/repo-locate/
~~~

Generated host install if flat naming is required:

~~~text
generated/copilot/skills/rstack-repo-locate/
~~~

## Laminar exporter

Conceptually:

~~~text
evaluation/exporters/laminar/
~~~

The exporter consumes normalized post-run evaluation records. It should not be embedded in Planner or Tester.

---

# 28. Anti-goals

Do not:

- rename everything for aesthetics,
- create empty folders with no owner,
- duplicate current files into a new clean tree,
- create V3 merely to avoid migration,
- hide host requirements behind abstractions that do not work,
- move generated output without updating the generator,
- move a Skill without testing discovery,
- move an agent without testing host loading,
- mix prompt refactor into path migration,
- mix model changes into architecture migration,
- delete history because it looks messy,
- upload internal evidence to the public repo,
- create another architecture authority beside the canonical source.

---

# 29. Relationship to instruction hardening

The architecture should enable:

~~~text
small global floor
      ↓
role-local agent
      ↓
task Skill
      ↓
direct reference
      ↓
deterministic script
~~~

A good repository architecture makes progressive disclosure natural.

Use:

- RSTACK-INSTRUCTION-ARCHITECTURE-HARDENING-GUIDE.md
- RSTACK-INSTRUCTION-ARCHITECTURE-EVAL-PLAN.md

during migration.

---

# Final principle

> **RSTACK should look like a factory because its responsibilities are separated like a factory—not because the folders have impressive names.**

The repository should make these boundaries obvious:

~~~text
CONTROL
what may happen and when

EXECUTION
who performs the work

ADAPTERS
how the factory runs on a specific host

EVALUATION
how we know whether the factory works

DISTRIBUTION
how authored source becomes installable output

GENERATED
derived files nobody edits manually

TESTS
how the factory itself is verified

DOCS
why the architecture exists

RUNTIME .rstack
what happened in a specific project/run
~~~

The target structure is successful when developers can navigate ownership quickly, generated output cannot masquerade as authored source, host changes do not require rewriting portable semantics, and evaluation is a first-class feedback loop.
