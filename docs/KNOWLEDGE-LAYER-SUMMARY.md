# Persistent knowledge layer — summary of the 2026-09-14 investigation and K0

This file summarizes the persistent-knowledge-layer sequence: what prompted it, what was decided, what changed in the repository, what was reviewed, what remains open, and how a corporate pipeline team should study these records and take from them. It is a record for readers returning to the repository; it creates no rule and grants no permission. Operative authority stays where [`.github/pipeline/HARNESS.md`](../.github/pipeline/HARNESS.md) says it lives.

## 1. Origin

The owner asked how Andrej Karpathy's "LLM Wiki" idea — immutable raw sources, an LLM-compiled wiki, an index, a log, periodic health checks — could give this pipeline a durable, compounding memory without retraining any model, while keeping the human in control. The instruction was to investigate and design, not implement.

The investigation studied the primary sources (Karpathy's post and gist; GitHub, Anthropic, OpenAI, and Google documentation; the agent-memory literature) and the repository as it is. Its central finding: the pipeline already has four of the five memory types the brief named (source of truth; episodic run artifacts; procedural lessons through the ledger; working state in RUN.md). The candidate gap is curated, revision-pinned knowledge about the target repositories and the team's standing constraints — and whether that gap is material is a hypothesis, not an established need.

## 2. What was decided

The independent review's verdict was **DEFER PENDING BASELINE EVIDENCE**: accept source-linked repository/team knowledge as a working hypothesis; authorize only K0 (measurement guidance) separately; treat candidate capture, a structured store, a curator, settings changes, and runtime retrieval as later, separate decisions. The investigation's revision 2 reconciled all findings (its §27) and its final recommendation matches that disposition.

Three corrections from the review changed the design materially and are worth knowing before reading anything else:

- **Authority is three domains, not one ranking.** Current source and attributable execution evidence establish what happens; requirements, authorized decisions, and the approved plan establish what must change; policy and approvals govern what may be executed. "Current code wins" was rejected because it would preserve the defect a task asks to fix.
- **Verification must match the claim.** A file read confirms a static fact; it never establishes an execution outcome or a decision's current applicability. A knowledge claim is relied on only once the evidence class its kind requires has been met in the current run.
- **"Only an agent file can restrict tools" was wrong.** A VS Code prompt file also declares `tools`, with precedence over the referenced agent's list; and an edit-approval glob prompts before a matching edit is applied — it is not a sandbox. Any curator is therefore deferred until manual curation has shown work worth assisting.

## 3. What changed

| Commit | Content |
|---|---|
| `fb6527c` | [`docs/specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md`](specs/2026-09-14-persistent-knowledge-layer-architecture-investigation.md) — the reviewed draft (revision 2, 26 sections plus §27 reconciliation record; status INVESTIGATION DRAFT, NOT APPROVED; disposition DEFER PENDING BASELINE EVIDENCE). |
| `0a6984c` | [`docs/specs/2026-09-14-persistent-knowledge-layer-investigation-artifact.md`](specs/2026-09-14-persistent-knowledge-layer-investigation-artifact.md) — the published-page record (name, URL, version history; the repository file is the record). |
| `80c810b` | [`docs/RUN-AUDIT-AND-IMPROVEMENT.md`](RUN-AUDIT-AND-IMPROVEMENT.md) gains "Discovery effort and total effort": seven measures, each with where it is observed, its source label (`OBSERVED` / `AGENT_REPORTED` / `INFERRED` / `UNAVAILABLE`), and what it is not; missing values stay `UNAVAILABLE`, never zero or estimated; a dry run against the fictional examples must show which measures artifacts cannot supply. [`docs/CORPORATE-ADOPTION.md`](CORPORATE-ADOPTION.md) gains CA-23 (Copilot Memory presence, enablement, and policy in the intended host) and CA-24 (prerequisites for a possible later knowledge-map trial, in two groups: retrieval prerequisites proven by independently observed read evidence, and assisted-curation prerequisites), plus one sentence in Staged adoption. Both rows are `NOT VERIFIED`. |
| this batch | This summary and a README status subsection. |

Across the sequence: no agent, skill, setting, store, run artifact, artifact field, gate, STOP, tool, budget, model, or permission changed. `.github/**`, `.vscode/**`, every example, and every historical specification and review are untouched. No reference tag was created or moved.

## 4. How the work was reviewed

The investigation went through three review rounds relayed by the owner (initial review with findings F1–F12; two targeted-correction reviews that found tables and diagrams still stating superseded rules), each answered by verifying the point against the sources and correcting at the cited line, and each recorded in the investigation's §27. K0 followed the standing method: an architect brief, implementation by a Sonnet 5 agent, an architect mechanical review (file scope, additions only, table shape, link and anchor resolution, label vocabulary, no thresholds, no corporate content) plus a read of every added line, then independent review. Two correction rounds closed the reviewer's P2 (CA-24 blocked more than the Planner-only trial needs) and P3 (human minutes lacked a label); the closure review raised one further P2 (CA-24 accepted the Planner's own `inputs:` line as proof of what it read) which, being beyond the two-round cap, returned to the owner, who authorized one more bounded round; the wording now requires independently observed read evidence, with artifact declarations as corroboration only. The commit and push followed the owner's explicit instruction.

## 5. What remains open

- **Baseline execution** (three representative tasks on the unchanged pipeline) is separately authorized and not yet run; every value it would produce is `UNAVAILABLE` until then.
- **Corporate validation:** CA-01 … CA-24 all remain `NOT VERIFIED`.
- **Every later phase** — K1 candidate capture (a behavioural change to six agents), K2 store and approval configuration, any curator, K3 Planner-only retrieval, K4 health — is unauthorized and waits on baseline evidence and its own decision. The investigation's twenty open questions (§25) are the decision list.
- **Later retrieval** requires demonstrated use of the intended snapshot from independently observed read evidence (CA-24), not from the Planner's own report.
- The reviewer noted that published-page and repository-file equality was not independently checked; the artifact record states what is and is not claimed.

## 6. How a corporate pipeline team should study these records

Reading order, then what to take, then what not to take.

**Read in this order.**

1. [`.github/pipeline/HARNESS.md`](../.github/pipeline/HARNESS.md) — the authority model; everything below is either workflow authority, task evidence, or history, and the investigation is history (a draft record).
2. The investigation's §1 (executive summary with the revision 2 disposition), §5 (which memory types the reference already has, and at what validation level), §9 (three authority domains; verification must match the claim), §22 (the baseline and the Planner-only experiment), §23 (phase semantics, with K1 correctly labelled behavioural), §26–27.
3. [`docs/RUN-AUDIT-AND-IMPROVEMENT.md`](RUN-AUDIT-AND-IMPROVEMENT.md), "Discovery effort and total effort", against your own pipeline's artifacts.
4. [`docs/CORPORATE-ADOPTION.md`](CORPORATE-ADOPTION.md) rows CA-21 to CA-24.
5. [`docs/HARNESS-LEDGER.md`](HARNESS-LEDGER.md) and RUN-AUDIT's "From incident to reviewed lesson" — the existing path for lessons about the pipeline itself, which the knowledge layer must never duplicate.

**Take now (no architecture change needed).**

- **Map the seven measures onto your pipeline's own records.** For each row, name the corporate artifact or host field that supplies it (your equivalents of INTAKE.md's identifiers searched, PLAN.md's evidence rows and "Searched:" terms, the tester's and verifier's detected commands, the developer's iteration log, the human's context lines and decisions, the verifier's findings, and host usage fields). Where nothing supplies a measure, write `UNAVAILABLE`; do not estimate.
- **Run the baseline** once your existing prerequisites for the exercised stages and your private evidence policy are met: three representative tasks, current pipeline unchanged, failed and aborted attempts and manual help preserved, values in your private scorecard only. Nothing corporate enters this reference.
- **Record CA-23** for your Copilot host: whether Copilot Memory is present, enabled, admin-controlled, and applied in code review. If it is enabled and unmanaged, you already have a parallel repository memory outside version control; govern it before considering anything in the investigation.
- **Keep the two promotion targets apart from day one.** Lessons about how the pipeline should behave go to your ledger and, if adopted, into a policy file. Facts about a repository or a team constraint are a different record with a different owner, and they must be phrased as observations and locations, never as instructions to an agent.
- **Improve discoverability of documentation you already have** (ADRs, service contracts, proof routes) before duplicating its content anywhere. A source map links at a revision; it does not summarize.

**Decide only after the baseline.** Proceed to the Planner-only source-map comparison (investigation §22 Step 2: a hand-written map frozen at one commit, three paired runs, fresh sessions, fixed configuration, independent review) only if the baseline shows a recurring navigation or constraint problem, current sources a small map could locate, measured discovery and human effort, and an approved private owner and location for maintained material. Before that trial, complete CA-24's retrieval prerequisites with independently observed read evidence.

**Do not take.**

- The §15 architecture as a build plan. It is the candidate target, with its design questions answered, so that if the evidence arrives nothing has to be re-derived.
- A raw or experience archive of run artifacts, a discipline-organized wiki, automatic promotion, scheduled health checks, a root `AGENTS.md`, a search service, or any mechanism that lets a run read a previous run.
- Any threshold from the investigation's revision 1; every percentage was withdrawn. The pilot reports measures and an independent reviewer's judgement.
- Any claim that an edit-approval glob confines an agent to a directory. It prompts before a matching edit; that is all.

## 7. Reading order for this sequence

1. This summary.
2. The investigation, §1 and §27 first, then the sections named in §6 above.
3. The K0 additions to RUN-AUDIT and CORPORATE-ADOPTION, read against the unchanged FLOW, AGENT-CONTRACTS, and GUARDRAILS.
4. The artifact record, for the published page.
