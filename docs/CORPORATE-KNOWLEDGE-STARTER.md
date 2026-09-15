# Corporate knowledge starter — the Planner-only source-map experiment

**Status: optional corporate adoption guide, documentation only. This file creates no workflow authority under [`.github/pipeline/HARNESS.md`](../.github/pipeline/HARNESS.md)'s authority model — it is historical/guidance material, never workflow authority and never task evidence. It creates no new gate, STOP, setting, artifact, tool, or permission, and no new policy. It authorizes no knowledge layer, no phase of one (K0–K5), and no experiment. It applies only after a corporate team has adopted this reference pipeline and has completed and reviewed its own baseline measurements. The corporate team owns its private knowledge material; nothing corporate ever enters this reference, and nothing but a sanitized, disclosure-reviewed harness lesson ever returns from it. Disposition, unchanged from the investigation's revision 2: DEFER PENDING BASELINE EVIDENCE.**

## 1. Purpose and status

This guide answers one practical question:

> "We have adopted this reference pipeline internally, completed our baseline measurements, and believe repeated repository/context discovery may be expensive enough to justify a knowledge experiment. What exactly should we do next?"

It exists so a corporate engineering team can act on that question without first reconstructing the answer from the full architecture investigation. It is optional reading, not a required step of adoption, and reading it grants no permission.

Status, restated:

- This is documentation only. It is not a skill, agent, setting, artifact, gate, STOP, or tool, and it adds none of those.
- It authorizes nothing. K0 (measurement guidance) is already implemented in this reference; K1 (candidate capture), K2 (store, settings, curator), K3 (runtime retrieval), K4 (health), and K5 (scale) each remain a separate, unauthorized architectural decision, whatever this guide describes them doing.
- It applies only after baseline measurements have been collected on the team's own pipeline and reviewed by a human, per [`RUN-AUDIT-AND-IMPROVEMENT.md`, "Discovery effort and total effort"](RUN-AUDIT-AND-IMPROVEMENT.md#discovery-effort-and-total-effort) and the investigation's [§22 Smallest useful experiment](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#22-smallest-useful-experiment), Step 1.
- The corporate team owns its private knowledge material: where it lives, who approves it, and how long it is kept are the team's decisions, not this reference's.

For the full reasoning behind every rule in this guide, read [`KNOWLEDGE-LAYER-SUMMARY.md`](KNOWLEDGE-LAYER-SUMMARY.md) first, then the investigation's own [§1 Executive summary](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#1-executive-summary) and [§26 Final recommendation (revision 2)](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#26-final-recommendation-revision-2). This guide summarizes their conclusions for a team about to act; it does not re-argue them, and where the two disagree, the investigation and its reconciliation record are the record to follow.

## 2. Preconditions

Do not start the experiment in §3 until every item below is true. None of these is a percentage or a threshold — each is a fact a human reviewer confirms.

- [ ] **Baseline runs completed.** Three representative tasks run on the corporate pipeline, unchanged, per the investigation's §22 Step 1 and [RUN-AUDIT-AND-IMPROVEMENT.md, "Discovery effort and total effort"](RUN-AUDIT-AND-IMPROVEMENT.md#discovery-effort-and-total-effort).
- [ ] **Evidence of a real problem.** A human reviewer, not an agent, has judged from those baseline runs that there is a recurring navigation or constraint problem, or repeated human-stated constraints being retyped — and that current sources exist which a small map could actually locate.
- [ ] **Measured cost.** Discovery effort and human effort from the baseline are recorded in the private scorecard with the four source labels (`OBSERVED`/`AGENT_REPORTED`/`INFERRED`/`UNAVAILABLE`). Missing values remain `UNAVAILABLE`, never replaced by zero or an estimate; genuinely observed zeros are retained.
- [ ] **Discoverability checked first.** Where authoritative team documentation (ADRs, service contracts, proof routes) already exists, its discoverability has been improved before considering duplicating any of its content into a map.
- [ ] **A private, approved location.** A location for the map exists in the team's own approved documentation — never in this reference repository.
- [ ] **A named owner.** One person or role owns approval of entries, consistent with the team's own version of the proportional approval model in the investigation's [§12 Human-in-the-loop model](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#12-human-in-the-loop-model).
- [ ] **Information-handling policy in force.** The team's private evidence policy is in effect, per [RUN-AUDIT-AND-IMPROVEMENT.md, "Private evidence policy first"](RUN-AUDIT-AND-IMPROVEMENT.md#private-evidence-policy-first): no corporate logs, artifacts, prompts, source, or ticket content is ever copied into this reference.
- [ ] **CA-23 recorded.** Copilot Memory's presence, enablement, and policy in the intended host are recorded, per [CORPORATE-ADOPTION.md, Validation matrix](CORPORATE-ADOPTION.md#validation-matrix). If it is enabled and unmanaged, the team already has a parallel, ungoverned repository memory to deal with before adding another one.
- [ ] **CA-24 retrieval prerequisites met.** CA-24 groups (a) and (b) — that the Planner actually reads the frozen snapshot, and that an unconfirmed snapshot falls back to ordinary discovery — are recorded with **independently observed read evidence** (retained host tool calls/results, such as the CA-21 export or the chat debug view, compared against the frozen snapshot). The Planner's own `inputs:` line corroborates this evidence; it never substitutes for it. CA-24's assisted-curation prerequisites (c)–(f) are **not** needed for this experiment — there is no curator in the first trial.
- [ ] **Host behaviour verified where the experiment depends on it.** Which files the Planner actually reads, observed directly; and that fallback to ordinary discovery is observed on a deliberately unconfirmed snapshot.
- [ ] **The team's own authorization.** The team has authorized this specific experiment for itself, under its own change control. Nothing in this guide authorizes it for them.

## 3. What the first experiment is

```text
Human-maintained source map
        ↓
Planner only
        ↓
small relevant subset
        ↓
current source verification
        ↓
normal planning
```

That is the entire shape. It is deliberately small.

It is **not**, yet:

- a general memory system;
- a multi-agent knowledge layer;
- automatic learning from runs;
- a wiki maintained by agents;
- a curator workflow.

It also does not include, in this first trial:

- candidate capture in run artifacts (that would be K1 — a separate behavioural change to six agents);
- any settings change (no new edit-approval glob, no new tool grant);
- a health skill (the manual checks of the investigation's §13 are worked by hand, before any retrieval, not automated).

## 4. Recommended private corporate structure

Illustrative only — the exact location is the team's own decision, and none of this is created in the reference repository:

```text
docs/
└── knowledge/
    ├── INDEX.md
    └── entries/
        ├── K-0001.md
        ├── K-0002.md
        └── ...
```

**The frozen snapshot.** The map is not a live, editable directory that the Planner reads at whatever state it happens to be in. It is frozen at **one Git commit** of the team's workspace-root repository. The commit SHA is the map's identity, and it is recorded **outside the snapshot** — by the human, in the run record, at run start — never written inside `INDEX.md`, because writing it into the index after committing would change the tree and invalidate the identity it names (investigation [§10.1 Index-first, scope-filtered, bounded](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#101-index-first-scope-filtered-bounded)). The human confirms a clean tree at that commit before the run.

Edits to the map happen only **between** runs, never during one. Any of the following is a mismatch, and every mismatch means the Planner falls back to ordinary discovery for that invocation, recorded, never silent:

- the stated commit SHA cannot be confirmed;
- an `INDEX.md` line names an entry file that does not exist;
- a named entry is missing or retired;
- the tree under `docs/knowledge/` is dirty;
- knowledge reading is disabled for the run.

A mismatch never causes a silent fallback to a newer, unconfirmed entry — it always falls back to the pipeline's existing discovery behaviour.

Keep this to a handful of entries. The pilot is not the place to write a wiki.

## 5. Minimal INDEX example

A fictional index, small enough to read in one pass:

| ID | Kind | Scope | Status | Question it answers | Source locator |
|---|---|---|---|---|---|
| K-0001 | REPO_FACT | payments-api | ACTIVE | Where are the integration tests? | `payments-api/src/test/java/...` |
| K-0002 | PROOF_ROUTE | payments-api | ACTIVE | Where is retry backoff behaviour tested? | `RetryBackoffTest.java` |
| K-0003 | TEAM_CONSTRAINT | TEAM | ACTIVE | Where is retry configuration expected to remain? | ADR-014 @ revision |

The snapshot identity is the commit SHA of the workspace-root repository, recorded by the human outside this file at run start (investigation §10.1) — this index intentionally carries no `Snapshot:` line of its own.

Do not start this experiment with a large wiki. If this table grows past a handful of rows before the first comparison has even run, that alone is a reason to stop and ask why.

## 6. Minimal entry example

One fictional entry, using the investigation's [§9.2 Provenance: the smallest useful schema](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#92-provenance-the-smallest-useful-schema) header fields plus the `domain_question`/`prerequisites`/`limits` shape from [CORPORATE-ADOPTION.md, "Team context and proof-route entries"](CORPORATE-ADOPTION.md#team-context-and-proof-route-entries) (domain question · authoritative source and revision · component owner · proof route · prerequisites · known limits — here `source` carries the authoritative source and revision, `owner` the component owner, and `statement`/`verify` the proof route itself):

```yaml
id: K-0002
kind: PROOF_ROUTE
scope: payments-api
domain_question: Where is retry backoff behaviour tested?
statement: Retry backoff between attempts is exercised by RetryBackoffTest, which asserts increasing delay across two retries.
source:
  - "[REPO] payments-api/src/test/java/com/example/retry/RetryBackoffTest.java:18 @ 9f8e7d6"
verify: Open RetryBackoffTest.java and confirm it asserts increasing delay across at least two retry attempts.
verified_at: 9f8e7d6
status: ACTIVE
approved: "[DEV] 2026-09-14"
decision_record: n/a
owner: payments-team
prerequisites: The retry module's default configuration profile must be active for the test to exercise real timing rather than a stub.
limits: Confirms the test exists and what it asserts. Does not prove that the test currently passes, and does not prove production retry behaviour matches the test's assumptions.
```

`decision_record` is required only for `TEAM_CONSTRAINT` and `OPEN_RISK` entries (an accessible, owner-approved decision record in the team's own documentation — a bare gate id is not enough); it is `n/a` here because a `PROOF_ROUTE` needs no such record. The optional `owner` field names a team, here `payments-team`; whether individual persons may ever be named there is the team's own private-policy decision, never one this reference makes.

Deliberately absent, and why (investigation §9.2, "deliberately not a field"):

- **`confidence`** — implied by the source class and the verify result; a free-standing number invites asserted confidence no read actually earned.
- **`discovered_by`** (an agent name) — once approved, the entry's authority is the human's approval and its source, not which role first noticed it.
- **`human_approved: true`** — every `ACTIVE` entry is human-approved by construction; the `approved` line already records who and when.
- **A date-only `last_verified`** — for a repository-scoped entry the revision is the truth; a date can be true while the tree has moved on.
- **Entry-to-entry sources** — a source must be primary (`[REPO]` path at a revision, `[DEV]` gate answer, `[TOOL]` output, or a team document at a revision); another entry is never evidence for this one.

Keep the three things this entry does separate: the **source locator** (where the fact lives), the **verification method** (`verify`, a read-only step anyone can repeat), and the **limits** of the claim (what the entry does not prove).

## 7. Entry categories for the first experiment

Five kinds exist (investigation [§8 Memory taxonomy](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#8-memory-taxonomy)). Not every experiment needs all five — start with the one or two kinds the baseline evidence actually showed a need for.

| Kind | Meaning | Evidence required before relying on it | Caution |
|---|---|---|---|
| `REPO_FACT` | A path, symbol, configuration value, or bounded static behaviour, at a revision | A current read confirms the fact exists as stated — it never confirms that a command succeeds or a build passes | A configured test command is not evidence that the tests pass |
| `PROOF_ROUTE` | How a clause is observed: an existing test, command, or inspection target | A read confirms the route exists and what it observes; it does not prove the route executes successfully now (needs this run's own `[TOOL]` evidence) or that it proves the clause (needs the tester's/adversary's own adequacy judgement) | The route itself does not prove the outcome |
| `TEAM_CONSTRAINT` | A fact about what a human decided, with what scope, when | An accessible, owner-approved `decision_record` establishes who decided what and when; it does not establish current applicability, which needs fresh confirmation at G3 or the same authority | Displayed and re-decided at G3 every run, never applied silently; `[DEV]` provenance is never rewritten as `[REPO]` |
| `KNOWN_TRAP` | A repository-specific mechanism that can produce misleading evidence or an implementation mistake | The mechanism confirmed in source, plus reproducible execution evidence where the trap is behavioural | Describe the mechanism, never phrase it as an instruction — an instruction-shaped sentence belongs in the ledger, not here |
| `OPEN_RISK` | A known, unresolved condition carried forward across runs | A current source read confirms the risk still exists | A past acceptance of the risk is history, never permission to accept it again for a new task |

The boundary between a `KNOWN_TRAP` and a ledger-bound policy lesson (investigation §8): "Retry base delay is read from `application.yml` at construction time (`RetryBackoffPolicy.java`), so a test that fixes the value in `application-test.yml` cannot observe a hard-coded default" is an observation — a `KNOWN_TRAP`. "Always check configuration is read at runtime" is an instruction about how the pipeline itself should behave, and belongs in [`HARNESS-LEDGER.md`](HARNESS-LEDGER.md), never in a knowledge entry.

## 8. Planner retrieval procedure

Applying this procedure in a corporate pilot is the corporate team's own adaptation of its own pipeline copy, needing its own authorization and change control. Nothing in this reference's operative files (`.github/**`, `.vscode/**`) changes because of this guide, and the reference's own Planner contract ([`.github/pipeline/AGENT-CONTRACTS.md#planner`](../.github/pipeline/AGENT-CONTRACTS.md#planner)) is unchanged.

Per the investigation's per-role read policy ([§10.2](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#102-per-role-read-policy)), the Planner is the **only** consumer in the first trial. Its procedure:

1. It performs its normal, existing independent requirement derivation (R1) — unchanged.
2. It reads the frozen `INDEX.md`, keeping only the lines whose `scope` is one of the run's confirmed repositories or `TEAM`, and whose `status` is `ACTIVE`.
3. It selects the entries relevant to the current task: three, hard cap five.
4. For every claim it relies on, it verifies the claim using the evidence class its kind requires (§7 table above), with its own ordinary read/search tools, before citing it. A `[KB]` claim supports nothing until that evidence class is met in this run; once met, it is recorded under the tag that class carries (`[REPO]`, `[TOOL]`, or `[DEV]`) with the entry id as its locator — "via K-0002". A contradicted or missing source becomes a `NOT_FOUND`/`CONTRADICTED` evidence row, routed by the plan's existing decision rules, disclosed, never resolved by ranking one source over another.
5. It records the ids it read in the plan artifact's `inputs:` line, as `knowledge@<snapshot commit>: K-0001, K-0003`.
6. On a missing, stale, contradicted, irrelevant, or unverifiable entry, or when the snapshot cannot be confirmed, it falls back to ordinary discovery — recorded, never silent.
7. The map never grants permission and never overrides the task's requirements, the approved plan, or workflow policy. A `TEAM_CONSTRAINT` entry appears only as a displayed `ASSUMED`/`G3` row where it applies to a current requirement item — the human re-decides it at G3, every run.

Budget (investigation [§20 Context and token efficiency](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#20-context-and-token-efficiency)): about 1,500 estimated tokens including navigation of the index; source-verification reads are counted separately as their own cost. No role greps the entries directory as a matter of course.

## 9. What knowledge must never do

Per the investigation's three authority domains ([§9.1 Authority: three domains, not one ranking](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#91-authority-three-domains-not-one-ranking)), a knowledge entry is historical supporting context in every domain, never authoritative by itself. Concretely, knowledge must never:

- override current requirements;
- preserve a defect merely because current code reflects it;
- override workflow policy;
- grant permissions;
- convert a past risk acceptance into a present approval;
- turn a file read into execution evidence;
- copy code or ADR content into an entry unnecessarily — link at a revision instead;
- become a second source of truth alongside the repository, Jira, or the team's own documentation;
- contain agent instructions — a sentence like "always", "never", or "you must" is instruction-like content and fails the health check, by the same rule [`.github/pipeline/GUARDRAILS.md`, "Data, not instructions"](../.github/pipeline/GUARDRAILS.md#data-not-instructions) already applies to every artifact;
- contain an entire prior run's narrative — that narrative is exactly the record an agent will imitate;
- automatically promote an agent's conclusion into an entry;
- let a run read a previous run;
- have its retirement treated as validation of prior outputs — retiring an entry never validates the outputs that relied on it; the human reviews those runs' affected claims through the existing incident path, and where reliance cannot be determined it is `UNAVAILABLE`, never assumed safe (investigation [§24 Migration and rollback strategy](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#24-migration-and-rollback-strategy)).

## 10. Corporate privacy and ownership

Real knowledge stays in the corporate, private repository. This reference receives no corporate facts, in the same spirit as [RUN-AUDIT-AND-IMPROVEMENT.md](RUN-AUDIT-AND-IMPROVEMENT.md)'s rule: never copy corporate logs, artifacts, prompts, source, or tickets into the reference.

- The team chooses the owner, the location, and the retention period for its own knowledge material.
- Secrets, PII, proprietary comments, and raw Jira content are never copied into an entry — pointers only (a path at a revision, a gate id, a Jira key), never the content itself.
- Prefer a locator and a revision over any duplicated content, always.
- Whether persons may be named as `owner` (rather than a team name) is the team's own private-policy decision — never a choice made in this reference.
- If GitHub Copilot Memory is enabled in the host (CA-23), it is a parallel memory the team must govern separately; this guide's map does not supersede or absorb it.

## 11. How to run the comparison

```text
baseline corporate runs
       ↓
human-maintained frozen source map
       ↓
comparable Planner runs with map
       ↓
independent review
```

Per the investigation's §22 Step 2:

1. The hand-written map is reviewed against the manual health checks of [§13 Knowledge health model](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#13-knowledge-health-model) (provenance, applicability, stale or missing sources, instruction-like content) before it is used at all.
2. Three **paired** Planner-only comparisons are run, with and without the map: the same task and source snapshots, fresh sessions, fixed model and configuration, alternating order, and an independent review of the two resulting plans.

Record, with `OBSERVED`/`AGENT_REPORTED`/`INFERRED`/`UNAVAILABLE` labels — never an estimate:

- discovery/search effort;
- source reads (the index, the entries, and the verification reads, each counted separately);
- total planning effort;
- human context required (G2 context lines, G3 answers);
- useful versus irrelevant map entries, as judged by the independent reviewer — a **decision-relevant retrieval share**, not a citation count (investigation [§21 Metrics](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#21-metrics));
- contradictions or stale entries, split into those caught safely and those relied upon;
- verification work the map introduced;
- total effort, with the map against without it.

Stop conditions — any one ends the comparison: unsupported reliance (a plan rested on a `[KB]` claim whose evidence class was never met); a false PASS; an unauthorized effect; scope contamination (corporate content reaching the reference); or a stale claim relied upon rather than caught.

This is a feasibility and engineering comparison — whether the Planner uses the map correctly, and what it costs. It is **not** proof of end-to-end causal improvement, and it proves no statistical causality.

## 12. Decision after the experiment

- **Outcome A — no meaningful benefit.** Total effort does not improve, or the reviewer finds no better-grounded plan. Stop. Build no more architecture. Record the outcome.
- **Outcome B — useful, manual maintenance sufficient.** Keep the map human-maintained; add no curator and no additional agents. Any expansion — K1 candidate capture, *or* a second consumer role, never both at once — is requested separately, with the evidence attached.
- **Outcome C — useful, but curation becomes repetitive.** Only now reconsider assisted curation, and only after CA-24's assisted-curation host checks (c)–(f) are observed. The curator may be an agent or a prompt file. An edit-approval glob makes such an edit prompt for human approval — it is not a sandbox.
- **Outcome D — retrieval itself does not scale.** Triggered by the independent reviewer reporting the cap is binding, or an index exceeding 150 lines. K5's steps apply, in order: split indexes per repository → tighten kinds per role → raise the cap with evidence → only then consider the host's existing `search/codebase` over the directory. BM25, vector stores, and MCP knowledge servers remain outside the owner's rule regardless of outcome.

> "Complexity must be earned by measured need."

## 13. What remains deferred

None of the following is implied by this guide, or by a successful experiment. Each remains its own separate architectural decision (investigation [§23 Incremental rollout plan](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#23-incremental-rollout-plan)), requiring its own evidence and its own authorization:

- candidate capture by pipeline agents (K1 — a behavioural change to six agents);
- a curator agent or prompt file;
- automatic knowledge promotion, of any kind;
- a health or lint workflow (K4);
- consumption by any role beyond the Planner (adversary, tester, developer, verifier, intake);
- runtime knowledge writes;
- scheduled maintenance;
- vector or BM25 search infrastructure;
- a RAG service or an MCP knowledge server;
- the settings glob that would protect a knowledge directory (K2);
- an organization-level shared store.

## 14. Relationship to the reference repository

The **reference repository** contains:

- the architecture investigation and its review/reconciliation record ([§27 Revision 2 — reconciliation record](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md#27-revision-2--reconciliation-record));
- K0 measurement guidance ([RUN-AUDIT-AND-IMPROVEMENT.md](RUN-AUDIT-AND-IMPROVEMENT.md); CA-23/CA-24 in [CORPORATE-ADOPTION.md](CORPORATE-ADOPTION.md));
- the summary ([KNOWLEDGE-LAYER-SUMMARY.md](KNOWLEDGE-LAYER-SUMMARY.md));
- this starter guide.

The **corporate repository** contains:

- the team's actual entries;
- its actual internal sources;
- its actual experiment results and private scorecard.

Only sanitized, generalized lessons about the harness itself may later return to the reference — through the existing reviewed ledger process ([RUN-AUDIT-AND-IMPROVEMENT.md, "From incident to reviewed lesson"](RUN-AUDIT-AND-IMPROVEMENT.md#from-incident-to-reviewed-lesson) → [`HARNESS-LEDGER.md`](HARNESS-LEDGER.md)), after disclosure review. Entries themselves never flow back.
