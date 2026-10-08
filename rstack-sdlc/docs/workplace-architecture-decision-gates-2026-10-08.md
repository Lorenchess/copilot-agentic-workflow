# RSTACK-SDLC — Architecture Decision Gates for Artifacts, Repository Integrity, and Agent Isolation

**Date:** 2026-10-08  
**Purpose:** Second, decision-focused design review and Claude Code handoff  
**Scope:** Evolved downstream/workplace RSTACK-SDLC, compared against the **public GitHub reference**  
**Decision state:** **NOT APPROVED FOR IMPLEMENTATION** — evidence collection and owner decisions first  
**Change class:** Documentation only. This is not an approved architecture migration or security certification.

> **Owner's architectural challenge:** Are we preserving a large system of source-code artifacts and full working copies because we truly need those bytes for verification and recovery, or because our original isolation design made copying the default? Do not optimize the copies before answering that question.

**Read with:** [Original artifact-storage analysis](artifact-storage-and-agent-write-boundaries-2026-10-08.md), [Factory contract](../01-FACTORY-CONTRACT.md), [Workflows](../core/policies/workflow.ts), and [Previous decisions](decisions.md). Those describe the GitHub reference, **not necessarily the newer workplace engine**.

**Public-repository caution:** This design memo deliberately avoids proprietary application names, organization-specific directories, internal code, credentials, and raw workplace evidence. Store detailed workplace code excerpts, screenshots, machine/environment identifiers, logs, and measurements **only** in approved private company storage. Do not copy those into this public repository.

## 0. Instructions to the next Claude Code session

**Do not begin with parallel I/O or a storage rewrite.** Begin by verifying the current workplace repository state, the meaning of every artifact, and the integrity of the *real application repository* now that accepted changes are applied during a run.

Deliver a design-decision packet with falsifiable answers to **D1–D10** below, a reproducible benchmark comparing architectures, and a recommended sequence of narrowly scoped changes. Separate **CONFIRMED** (directly inspected/tested), **REPORTED** (workplace-agent screenshots or prior notes), **INFERRED** (engineering analysis), and **UNVERIFIED** (needs a host test).

**No source edits, deletions, environment changes, new worktrees, refactors, or cleanup during this first decision pass.** Do not assume that having a hash proves write prevention, that keeping a CAS implies keeping full copies, or that deleting the CAS is automatically an optimization.

## 1. What changed between the reference and the evolved workplace pipeline?

The first memo examined GitHub reference code. The owner then supplied screenshots of a separate Claude Code investigation against the **newer workplace implementation**, derived from that reference. This is not the same commit or necessarily the same design.

| Topic | GitHub reference (confirmed from source during prior review) | Workplace version (reported by the user's screenshots; re-check locally) | Consequence |
|---|---|---|---|
| Content retention | `artifacts/<sha256>` per run deduplicates identical bytes **within** the run | Reportedly still true; a local experiment noted a relatively small stored starting application | CAS is already partly efficient; do not misidentify every hash as a duplicate |
| Tree-size bound | `2,000 files / 20 MiB` fixture limit | Reportedly raised to `10,000 files / 100 MiB` | Earlier numeric bound is obsolete for work; whole-tree memory strategy still needs review |
| Whole-tree memory | `measureTree` retains bytes of every included file while measuring | Reportedly still retains all measured file bytes in memory | Large repositories threaten peak memory; raising limits is not streaming |
| Agent workspaces | Separate materialized copies for Tester, Developer, technical reviewer, PR reviewer | Reportedly still four materializations on the successful path | Copies may dominate *transient* allocated disk and startup latency |
| Execution workspaces | RED baseline and candidate verification materialize trees | Reportedly those plus a background full-suite execution | Additional disk/CPU pressure; execution isolation and evidence fidelity need independent design |
| Direct writes to user's app | Reference start documented not writing into the source app itself | Workplace engine reportedly applies **accepted changes directly to the real application directory as the run progresses** | **New trust boundary:** full repository drift, source-baseline changes, and attribution must be handled |
| Role write checks | Diff of controlled tests / protected config in agent-copy at submission | Reportedly re-checks only engine-applied files against real app, not every file an agent could have touched | An unanticipated file edit may remain undetected |
| Sibling repositories | Not part of reference evidence | Reportedly no checking of other repositories in the VS Code workspace | Agents with filesystem/shell reach may change unrelated repositories |
| Late worker | Reference has a test showing one abandoned worker can write into another attempt's live copy | Reportedly still reproducible | Attempt directories are not OS security isolation |
| Reviewer | PR-reviewer copy checked at acceptance, temporary edit-and-restore invisible; technical reviewer not equivalently checked | Reportedly technical reviewer remains unchecked | Check-at-hand-in is not proof of read-only review |
| Executor | Reference Node executor explicitly says "no sandbox" | Workplace screenshots report Node, Vitest/Jest, and Maven execution without an OS sandbox | Tests/build scripts must be considered untrusted code with broad process rights |
| Storage evaluation | Reference metric excludes `work/` and `exec/` and sums apparent file lengths | Reportedly unchanged | Existing metric understates peak/actual disk allocation |
| Lifecycle | Run evidence and materialization retained for later use | Reportedly working copies are reclaimed only when the run folder is deleted by a final cleanup after documentation | Failed/interrupted/long runs can accumulate transient copies |

**Important limits of this comparison:** All workplace behaviors above are **REPORTED**, not independently inspected through this public repository. In particular, examine the current workplace `engine.ts`, workflow, test-runner adapters, artifact store, final cleanup, and the actual host tool policy. Source line numbers differ and should not be treated as stable across branches.

### Workplace experiment reported in the screenshots

A ~7,700-file/~73 MB repository was used for a local timing experiment:

| Operation | Serial / prior | Proposed parallel | What has actually been demonstrated |
|---|---:|---:|---|
| SHA/content fingerprinting, 32 concurrent reads | ~11.8–12.9 s | ~1.3–2.2 s | Potential latency reduction, same logical input/identities |
| Creating a physical working copy | ~40.8 s | ~10.1 s | Faster **copying**, not fewer bytes copied |
| Reflink/CoW attempt on that drive | Not measured as an improvement | `ENOSYS` on tested NTFS volume | Unsupported **in that test**; no universal Windows/enterprise capability conclusion |
| Timestamp-only shortcut | — | ~7.7 s | Inadequate as an authoritative content identity and slower than reported parallel hashing |

**Do not promote these timings to pipeline evidence.** They were reported from a busy machine with real-time scanning, not cold- and warm-cache controlled runs, no peak disk/RSS study, and not a full RSTACK run. The experiment does not compare the alternative Git/CAS storage designs.

The screenshots also show a session UI with **25 files changed** at that moment while its narrative says no pipeline code was changed for the investigation. These facts might be compatible (pre-existing changes or unrelated session actions), but **confirm the actual base, current diff, file owners, and clean/dirty state before doing any new work**. Do not discard or overwrite unexplained changes.

## 2. Engineering verdict: separate four questions

Claude's proposal to start with parallel reads/writes is an optimization of the *current mechanism*. It is **not yet** an architectural answer.

1. **What bytes must be retained?** Exact accepted revisions, dirty/untracked sources, controlled tests, failed attempt evidence, and trusted execution artifacts must remain independently reconstructible. But committed Git bytes that are securely available need not necessarily be re-stored per run.
2. **How are working views supplied?** Materialized full copies are just one possible way to provide the agent with a candidate. They can be temporary, CoW, reconstructed from Git + changes, or avoided in some phases. Their physical storage cost should not be conflated with retained evidence.
3. **Who can write where?** A content hash detects mismatches. The real security question is whether an agent or test runner can write to the real app, sibling repositories, protected tests, the journal, or another attempt. Detect-after and prevent-before are different guarantees.
4. **What does the independent verifier actually execute?** RED/GREEN results must be produced from an exact, frozen candidate and the locked test revision, under a recorded execution environment. Neither a developer-supplied result nor a changing real checkout is authoritative proof.

**Provisional recommendation:** Evaluate a **Git-backed + small protected CAS hybrid** as a serious alternative to current per-run storage, while immediately designing a comprehensive **repository-integrity/patch-admission boundary** for the changed workplace flow. Do not commit to either storage backend until the benchmark and recovery tests show an advantage.

## 3. Artifact inventory: prove need before keeping or deleting bytes

For **every** current artifact and copy, ask: *Who writes it? Who can mutate it afterward? Who consumes it? Is it canonical? Can it be reconstructed? When is it safe to delete?*

| Artifact type | Minimum required guarantee | Plausible minimal representation | Retention guidance |
|---|---|---|---|
| Run identity, state/journal, decisions, approved plan, scopes, role/policy versions | Immutable or tamper-evident controller-owned record; exact referenced revision | Small versioned records + authoritative control store | Durable per policy; **never** writable by a constrained role |
| Committed source baseline | Exact repository tree and object availability for whole retention period | Pinned Git commit/tree plus object availability proof | No duplicate full bytes if object source is truly protected and durable |
| Dirty/staged/untracked baseline changes | Exact bytes, paths, metadata, index/worktree distinction | Immutable content objects or versioned binary-safe delta on pinned Git base | Retain unique bytes until all dependent runs and review obligations end |
| Accepted Tester changes | Locked exact test content and proof mapping | Changed-file blob(s) or reconstructible patch + digest | Durable; independent from Developer write scope |
| Accepted Developer changes | Exact candidate revision and authorized changed-path set | Changed-file blobs or patch against exact pinned parent | Durable until required evaluation, recovery, and publication complete |
| Tree identity / source-to-candidate manifest | Canonical complete logical tree and identity, not necessarily full file bytes | Manifest of path/type/mode/content refs + root hash | Small durable record; reject missing or ambiguous entries |
| RED/GREEN execution evidence | Exactly what bytes/env/command were tested; genuine execution result | Immutable receipt + logs + test identities + sealed candidate ID | Durable; test runner cannot change authoritative receipt |
| Temporary agent workspace | Attempt-local changes, cannot contaminate another attempt | Materialized view / CoW upper layer / bounded scratch | Temporary **only after** liveness, durability and recovery checks |
| Temporary execution workspace | Exact sealed candidate with safe scratch output | Sandboxed reconstructed view | Temporary after trusted receipt and quiescence, per retention rules |
| Reviewer workspace | Ability to inspect exact candidate/proof without modifying them | Immutable read-only view or direct inspection of protected retained objects | Usually no persistent copy needed |
| Failed attempt / recovery | Reproducible failure explanation and optionally exact changed bytes | Receipt + relevant objects, not necessarily full directory | Budget/time policy; exceptions defined for investigations |
| Duplicate content across runs | No loss of referenced data; no unauthorized cross-run access | Shared protected CAS scoped by repo/tenant, or Git base + protected deltas | Deduplicate only where security boundary and GC permit |

**Do not confuse:** (a) hash-only manifest, (b) durable CAS blob, (c) working directory, and (d) test-execution filesystem. Only (b), an independently retained Git object, or another durable exact source can restore arbitrary bytes. A SHA-256 string alone cannot.

**Explicit counterexample:** If RSTACK stores only the hash of a dirty Java class and the original checkout disappears, the run is no longer reconstructible. That is an evidence regression even if storage is smaller.

## 4. New risk introduced by directly applying changes to the real repository

The public reference's attempt copies buffered accepted changes away from the original app. The workplace engine reportedly **applies each accepted change to the app as it goes**. That requires a different trust model.

### R1 — Real-app integrity gap (highest priority)

A validator that confirms only `files_applied_by_engine` cannot establish the integrity of the entire relevant repository if an agent can edit other files directly via VS Code editing, terminal commands, subprocesses or extensions.

**Required state transition:**

~~~text
trusted observed baseline + permitted engine patch
  -> expected complete repository state
  -> compare to independently measured actual state
  -> classify all deviations
  -> accept only the exact authorized state
~~~

This must cover **tracked, staged, unstaged, added, deleted, renamed, case-colliding, and relevant untracked files**, plus relevant test/build/configuration/generated inputs according to a protected policy. Do not silently skip ignored files if they influence execution. Do not attribute pre-existing dirty work to the agent: pin it first. Concurrent human edits are **unknown provenance**, not automatically authorized or malicious.

A repository snapshot/diff taken at a gate can only detect the **state observed at that time**. It cannot prove that a file was never modified and then restored. Nor can it prevent writes during the agent's action. Preventive enforcement requires a stronger host/process/write-broker boundary.

### R2 — Sibling repository / workspace escape

The observed weakness concerns **other Git repositories** in the workspace. Create an explicit, trusted **scope manifest** for protected roots: the target repository and all known sibling repositories requiring protection. Test changes to those roots before and after dispatch and at handoff, decision, proof, review and final proposal/publish boundaries as risk warrants.

A `git status` run for each root is useful but insufficient on its own: Git ignores some files by default, has index/worktree distinctions, and only observes the chosen roots. Prefer deterministic complete hashes for critical protected subsets plus robust Git path detection; define what is excluded and why.

**No boundary claim may exceed inventory:** paths outside known roots, tools running with broad privileges, external processes, unmonitored caches and temporary changes remain possible until a preventative host policy covers them.

### R3 — Tester/Developer and runner permissions

The current workplace evidence reportedly only forbids Developer edits in controlled test dir and exact config-listed `protected` paths. That does not imply other tests, CI or Maven/Gradle files are protected.

Define a **single owner-controlled classifier**:

| File class | Tester | Developer | Reviewer |
|---|---|---|---|
| Controlled tests and fixtures | Only approved test paths | No write | Read only |
| Other tests | No, unless explicitly scoped to Tester | **No** | Read only |
| Production code | No write | Only approved production paths | Read only |
| Build/test config, CI, Maven/Gradle, runner patterns | No default write | No default write | Read only |
| Governance, permissions, agent/profile definitions, control/evidence | No write | No write | No write |
| Generated build outputs/scratch | Per-attempt scoped only | Per-attempt scoped only | None or narrowly scoped |
| Unknown/ambiguous path | Deny | Deny | Deny |

No agent may grant itself a waiver. Any genuine cross-lane change must be issued through a **trusted externally authorized, exact-path and revision-scoped exception**. A repository-local YAML or JSON file edited by an agent cannot become the authoritative permission policy.

Java/Spring examples to classify: `src/main/**` vs `src/test/**`, `pom.xml`, `build.gradle*`, `settings.gradle*`, test resources, generated sources, Maven Surefire/Failsafe settings, pipeline YAML, Dockerfile, and test scripts. Handle multirepo/multimodule layouts, Kotlin/Groovy and mixed JavaScript projects, rather than assuming one fixed directory.

### R4 — Reviewer read-only semantics

The workplace screenshot reports that PR review receives a final-state check but technical review may have no such check. Even checking both copies at submission **does not establish read-only execution**, because an edit can be restored.

Preferred: reviewer reads a controller-frozen candidate through a read-only mechanism proven for the **actual harness**. If impossible, measure at acceptance and label it **DETECT_AFTER**, not `READ_ONLY_PREVENTED`. Do not permit shared mutable reviewer workspaces.

### R5 — Test executor and evidence trust

Node/Jest/Vitest/Maven tests are executable programs with filesystem/network effects, not passive assertions. If launched with the same OS identity that owns the CAS/journal, a malicious or buggy test can target those controls regardless of where its source files were copied.

Require an explicit sandbox/isolation capability evaluation for execution; protect the trusted store from **all runner subprocesses**. Red/green outputs must be bound to the exact candidate and tests executed, not merely to a result file the test runner could rewrite.

### R6 — Late workers, races and direct apply

Per-attempt directories reduce accidental collision but do not stop a stale process that has access to another attempt's path or real repository. "Attempt settled" is not equivalent to "worker terminated." A cleanup or patch admission gate must account for worker quiescence and race windows.

**No TOCTOU leap:** a valid scan before writing does not guarantee the target stayed unchanged during patch application. A trustworthy broker must check exact base identities while holding appropriate locks or applying an atomic operation, then verify authoritative result. A separate sealing step is required before review and trusted execution.

## 5. Competing architectures — compare fairly; do not preselect

### A. Retain the current per-run CAS, with disciplined materialization

- Reuse existing file-hash dedup **within** the run.
- Stream measurements instead of buffering whole trees; reclaim safe obsolete `work/` / `exec/` directories; consider faster parallel I/O and platform-specific CoW after measuring.
- Add complete repository-state verification, role policy and external host isolation **independently**.
- Strength: least schema/recovery disruption, straightforward dirty/non-Git support.
- Cost: still likely stores the same committed baseline bytes in every run; durable blobs may duplicate Git; working copies may still dominate disk unless materialization changes.
- Best when: Git objects cannot be guaranteed available or existing per-run evidence format/independence is non-negotiable.

### B. Git as authoritative committed base + immutable change sets

- Pin the exact Git commit/tree and independently verify **object availability** and retention; record status/index/dirty/untracked additions separately.
- Store accepted test/production changes as binary-safe reconstructible patches or changed blobs with exact parent identities and mode/type metadata.
- Reconstruct a logical base, locked proof tree and candidate from trusted objects; verify the canonical tree and digest. No permanent full working copies.
- Strength: excellent reuse of already retained Git bytes for clean repositories, fewer durable copies for small changes.
- Risks: dirty/ignored/generated files, disappearing or GC'd Git objects, shallow repositories, private remotes, concurrent index changes, renames/binaries, filesystem metadata and security of a writable `.git` object database.
- Best when: a protected Git object source and durable access can be guaranteed for the retention window.

### C. Hybrid: Git base when trustworthy, protected CAS for everything else

- Prefer a securely pinned Git base **only where eligible**.
- Add a small, protected content-addressed store for dirty/untracked source, locked tests, uncommitted implementation changes, and any missing/candidate bytes.
- Preserve versioned logical tree manifests independent of where file content is stored; durable references survive checkout relocation or deletion.
- Stage candidates through a controller-owned reconstruction/admission path.
- Strength: combines clean-source reuse with exact recovery for real-world dirty/binary/non-Git inputs.
- Risks: resolver/GC/ref-count complexity, security boundary of the shared store, schema/versioning and operational migration.
- Best when: enterprise repos are typically Git-backed but some run inputs exist only in workspace or are never committed.

### 5.1 Decision matrix (qualitative, not benchmark results)

| Criterion | A: optimized per-run CAS | B: Git + change sets | C: hybrid |
|---|---|---|---|
| Smallest immediate source change | **Strong** | Weak | Medium |
| Avoid re-storing already committed file contents | Weak across runs | **Strong** | **Strong** |
| Handle arbitrary dirty/non-Git inputs | **Strong** | Needs extra byte retention | **Strong** |
| Exact recovery if original checkout disappears | **Strong** when run CAS intact | Conditional on pinned Git + dirty/delta retention | **Strong** if stores/pins intact |
| Preserve existing subject format with minimal migration | **Strong** | Requires careful adaptation | Requires careful adaptation |
| Lowest temporary disk cost | Depends on materializer / cleanup | Depends on materializer / cleanup | Depends on materializer / cleanup |
| Prevent role-authority violations | **None intrinsically** | **None intrinsically** | **None intrinsically** |
| Operational complexity | Lower | Moderate | Higher |
| Potential savings | Primarily transient copies / retention lifecycle | Committed-source dedup | Committed-source dedup plus dirty coverage |

**Decision:** C is an **engineering hypothesis**, not an authorization to build. A is a legitimate alternative if a measured cleanup/streaming/materializer refactor meets the storage and recovery targets with much less risk. B may be sufficient for an explicitly clean-Git-only product, but the current RSTACK scope must not silently narrow to that case.

**Mandatory selection rule:** no option wins on "copy speed" alone. Compare storage, correctness, recovery, cross-platform behavior, security exposure, operational cost and migration complexity. Write down the actual weighted priorities with owner approval **before** scoring.

## 6. Preferred workflow model to test

~~~text
             TRUSTED CONTROLLER (agents cannot mutate state/policy)
                         |
           Pin authorized source baseline
             Git objects / retained bytes
                         |
          Pin dirty + staged + relevant untracked content
                         |
             Tester proposes test delta
                         |
       Trusted change admission + true RED execution
                         |
              LOCK EXACT TEST REVISION
                         |
           Developer proposes production delta
                         |
           Trusted change admission + sealed candidate
                         |
         Trusted GREEN / full-suite execution from sealed bytes
                         |
       Complete app + declared sibling-repository integrity gate
                         |
       Independent technical / PR review of exact sealed subject
                         |
        Human approval -> controlled final application / proposal
~~~

**Direct-apply decision:** The newer workplace engine writes accepted changes into the real repository mid-run. Evaluate whether that behavior is a genuine business requirement or an implementation convenience.

- **Preferred stronger path:** work against trusted versioned candidate state and apply changes to the real repository only through a controlled publisher/admission step after gates. No role itself edits the authoritative checkout.
- **If intermediate direct apply must remain:** controller alone applies exact authorized changes through a broker against precondition hashes; maintain an expected complete repository state; scan all protected roots and block unexpected drift; preserve rollback/transaction recovery. Explain residual non-preventive risks with current agent tool permissions.
- **Neither approach:** rely on `git status` alone and then trust an agent's claim about what it touched.

**Do not copy tests to Developer as an authority token.** The Developer may need to **read** test content, but the authoritative immutable locked test revision and RED evidence should stay controller-owned.

## 7. Effective host permissions: investigate rather than speculate

The screenshot asserts that real write prevention is "not possible" because Copilot tools can write anywhere and no CoW is available on that NTFS drive. The **measured fact** is narrower: one tested CoW mechanism returned `ENOSYS`; current session tools reportedly have broad write/command reach. These facts do not prove all preventive architecture alternatives are impossible.

**Different execution surfaces must not be conflated.** A custom agent running as a VS Code **Local** session is not automatically subject to the same controls as a **Copilot Agent Host** session. Tool frontmatter may be guidance or enforced depending on harness. Terminal sandboxing does not necessarily sandbox separate VS Code built-in edit/write tools, nor host-external MCP/process paths.

Relevant current first-party documentation:
- [VS Code — Trust and safety](https://code.visualstudio.com/docs/agents/concepts/trust-and-safety): process sandbox vs separate read/edit/write tool permissions; host and Windows caveats.
- [VS Code — Copilot Agent Host sandboxing](https://code.visualstudio.com/docs/agents/run/agent-sandboxing): Agent Host-specific permission paths and `/sandbox policy`, not automatically applicable to Local sessions.
- [VS Code — Custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents): tool restrictions, discovery and security considerations.
- [VS Code — Customize agents across harnesses](https://code.visualstudio.com/docs/agents/guides/customize-copilot-guide): do not assume a given harness enforces `tools` frontmatter.
- [Node `copyFile` / CoW flags](https://nodejs.org/download/release/v24.20.0/docs/api/fs.html): `COPYFILE_FICLONE` can fall back; `COPYFILE_FICLONE_FORCE` is needed to prove support/fail for that operation.
- [Git status semantics](https://git-scm.com/docs/git-status): tracked, index, worktree, untracked, ignored and submodule differences.

**Read-only capability plan** (no setting changes during investigation): identify actual Chat session target, installed VS Code / extension versions, tool list, approval mode, effective sandbox policy, OS filesystem/mount/user/process boundaries and corporate restrictions. Document whether each tool can mutate target source, protected tests, sibling repos, controller records, and test-runner output. Confirm with safe disposable **company-approved** probes only after owner approval. Do not probe the real application or real sibling repositories destructively.

Report each control as:

- `PREVENTED` — host/process/write broker denies write before real protected filesystem mutation, demonstrated across relevant tools.
- `REJECTED_AT_GATE` — write may occur but RSTACK independently detects noncompliant observed state and blocks admission/promotion.
- `UNVERIFIED` — not tested, unknown harness behavior, missing evidence.
- `UNSUPPORTED` — limitation directly observed on the exact host; do not generalize beyond it.

Do not label local/offline engine tests as proof of actual VS Code Copilot host restrictions.

## 8. Exact-snapshot and evidence rules

A Git SHA is not the whole starting state when the repository is dirty, staged, untracked, or has generated execution inputs. A sufficiently accurate source snapshot needs at least:

1. Canonical root identity, Git HEAD commit/tree where present, branch/worktree context, expected parent and relevant submodule references.
2. Staged index state **and** working-tree state; do not assume they match.
3. Explicitly scoped untracked and ignored/generated execution-affecting files, with exact bytes if not otherwise recoverable.
4. Path names, file kind, modes relevant to execution, symlink/junction handling, case collisions, deletions, renames and binary data.
5. Versioned repository policy/classifier, test-runner command/configuration and execution environment identity.
6. Immutable locked tester revision; exact candidate; proof/ref/receipt versions; verification verdict and independent review subject.
7. Retention/pinning proof for Git/CAS objects; corruption/missing-object failure behavior.

**Optimization:** path/size/date metadata can guide a faster dirty-path **candidate list** if the trust model permits, but cannot be the final proof of byte identity. For protected-content claims, hash the actual relevant bytes or verify against independently trusted Git/blob identities at the final gate.

**Reconstruction challenge:** after creating a run and accepted candidate, deliberately change or remove the original throwaway checkout, reopen the run, rebuild its base/proof/candidate from retained data, and get the identical canonical identities. Repeat with dirty/untracked files, binary changes, executable bits, deletions and missing/corrupt objects.

**Evidence integrity:** store authoritative expected hashes and output receipts outside agent/test-runner mutable reach. If that boundary cannot be met, explicitly downgrade tamper-prevention claims.

## 9. Benchmark plan — storage architecture first, parallel I/O second

Benchmark **A, B and C on the same inputs** before choosing; then independently compare serial vs parallel I/O within whichever design survives. Do not conflate speed of copying with total allocated bytes.

**Workloads:** one small clean fixture, an enterprise-like multi-module Java/Spring fixture with tests/config, a medium source tree, a deliberately large tree beyond the workplace limit, dirty/staged/untracked and binary inputs, a 1-file change, a many-file change, two similar runs, failed attempt and retry, stale worker, and a long interrupted run.

**Record for each:**

| Dimension | Required observations |
|---|---|
| Physical disk | Baseline + peak + final allocated space, `artifacts/`, `work/`, `exec/`, temp, Git/CAS; filesystem-aware counting, not just summed apparent lengths |
| Logical bytes | Unique file content, repeated copies, reachable objects, dedup across phases/runs |
| Time | Pin/read/fingerprint, materialize, submit/measure, RED, GREEN, full suite, cleanup, recovery |
| Memory/process | Peak RSS, file descriptors, CPU and I/O load, child process count |
| Cold/warm | Separate runs with cache state noted and background scanning/load disclosed |
| Correctness | Exact canonical tree identity, locked tests, successful recovery after checkout disappearance |
| Risk | Violations prevented, detected at gate, missed/unknown; test runner access; sibling-root drift |
| Reliability | Interruption, disk full, abort, cleanup retry, concurrent writer and missing/corrupt blob behavior |
| Cost | Complexity/maintenance, platform availability, durable storage/quota and GC/retention costs |

**Separate two analyses:** (a) current workplace engine must not regress; (b) chosen future design must meet configurable enterprise scale. The reported `10,000 files / 100 MiB` bound is a policy/capacity decision, not proof of general scalability. Include an explicit outcome for larger projects; never silently truncate the tree.

**Retention experiment:** compare one run and multiple runs, including how much storage remains after only truly safe transient cleanup. Report whether the starting Git commit/blob set was already on disk or had to be fetched. Do not credit git-based design with "zero bytes" if it requires downloading/pinning Git objects in another protected store.

## 10. Negative tests and guard matrix

| Test | Expected outcome |
|---|---|
| Developer edits controlled tests **or unrelated tests** | Protected state rejected; preventative claim only with observed host denial |
| Developer edits `pom.xml`, Gradle build file, runner pattern, CI pipeline | Rejected even when absent from app config's prior `protected` list |
| Tester edits production | Rejected; separate prevention probe |
| Any role edits the RSTACK policy, CAS, journal, lock, run manifest, prior RED receipt | Cannot become authoritative; missing prevent-before is labeled |
| Role adds/deletes/renames/recreates test file, uses case alias or linked path | Rejected, no missed path because of enumeration assumptions |
| A role edits a sibling repository and tries to proceed | Workspace scope gate blocks observed drift; no unjustified outside-inventory claim |
| A role modifies then restores protected file | End-state detector admits limitation; preventive boundary required to make a stronger claim |
| Stale worker writes into newer active attempt or real checkout | Cannot contaminate accepted subject; fail closed if quiescence uncertain |
| Trusted publisher finds concurrent human edit on target path | Conflict/unknown provenance, no silent overwrite |
| Developer or runner changes a test **during** RED/GREEN | Trusted execution uses frozen locked bytes; genuine proof integrity preserved |
| Reviewer edits then restores a candidate | If not prevented, no false "read-only" assertion |
| Original source deleted or Git GC removes an unpinned blob | Reconstruct or block honestly; never accept hash-only ghost evidence |
| Dirty/untracked file changes between pin and submit | Detected and classified; must be recoverable or block |
| Missing CAS object / corrupted blob / manifest collision | Atomic refusal and repair/recovery instructions |
| Crash/`ENOSPC` mid-artifact-write, materialization or cleanup | No partial accepted result or corrupted journal; no unrelated deletion |
| Windows volume with no reflink support | Explicit full-copy/fail policy, not an invented CoW saving |
| >10k-file or >100-MiB representative project | Explicit measured capability, bounded memory, or documented justified stop |
| Attempt cleanup while agent still running | Not deleted or isolated such that no shared evidence/active work is damaged |

**Independence rule:** an adversarial self-test run by the same unconstrained OS account does not by itself establish host-level prevention. Label each observed test by evidence class and source.

## 11. Design questions D1–D10 — required decision record

Claude must produce a structured decision record with **question, options, measured evidence, recommendation, residual risk, rollback, owner decision (blank until explicit approval), and evidence link/reference**.

| ID | Owner decision to request | Minimum evidence before choosing |
|---|---|---|
| D1 | Must the live app be modified at each accepted stage, or can RSTACK delay publication until a verified candidate? | Functional dependency/host flow demonstration and recovery implications |
| D2 | A vs B vs C durable-storage model | Same-workload retained bytes, restore test, GC/availability analysis, migration cost |
| D3 | Which files are authoritative retained evidence vs disposable work? | Producer/consumer inventory including interrupted runs and evaluation |
| D4 | What is the **complete** protected path policy across target and sibling repositories? | Repo inventory, test/build/governance classification, known exclusions, negative probes |
| D5 | Which preventive host capability can the actual Copilot setup enforce? | Session target, tool and process privilege map, approved probes, unsupported list |
| D6 | How are real-app and sibling-root drift detected and attributed? | Baseline pin, dirty files, concurrent human change and path coverage tests |
| D7 | What exact recovery and retention window is required for base/proof/candidate/failed runs? | Restart/reconstruction with missing original checkout and pinned objects |
| D8 | Who owns GC/cleanup; what liveness/quotas are needed? | Attempt lifecycle and `ENOSPC`/race experiments; dry-run evidence |
| D9 | Which Windows/WSL/Linux materialization backends are supported? | Host/filesystem probes, measured physical bytes, safe fallback |
| D10 | What are deployment, rollback, schema-compatibility and independent approval gates? | Small PR plan, baseline/target tests and reversible migration |

**Decision rubric** (propose weights to owner, then freeze): Security/invariants and reconstructibility are hard pass/fail gates, not a weighted tradeoff. Among options that pass, compare **peak allocated storage**, memory, total elapsed time, operational complexity, cross-host viability, and migration risk. State unknowns and perform sensitivity checks rather than inventing confident numerical scores.

## 12. Recommended sequencing (proposal, not authorization)

**Phase 0 — Forensics and evidence, READ ONLY.** Inspect current workplace pipeline and current diff before anything else. Trace source-copy producer/consumer graph, all direct-app mutations, all agent/shell/runner privileges, every repository root, persistence schema and cleanup. Produce baseline disk/latency/RSS measurements and the D1–D10 decision packet.

**Phase 1 — Architecture experiment, disposable only.** Prototype A/B/C against sanitized or synthetic throwaway repositories; exact content and recovery tests; compare physical storage. Do not modify the company pipeline or checkout. Present recommendation to owner with failure cases.

**STOP FOR OWNER ARCHITECTURE DECISION.** No implicit approval from a promising parallel benchmark, no self-issued waiver, and no transfer of authority to a model's risk score.

After approval, propose separately reviewable production changes in this **risk order**:

1. Close blind spots in **real application and sibling repository drift**, with fail-closed acceptance/promotion rules and protected path classifier. Correctly label this as `REJECTED_AT_GATE` until prevention is proven.
2. Establish exclusive, trusted mutation/patch admission and where technically possible a **preventive** agent/executor boundary, without silently rewriting agent/host policy.
3. Preserve canonical reconstructible base/proof/candidate subjects while implementing the selected A/B/C storage solution; retain compatibility/recovery as required.
4. Add measured, safe, owned **transient cleanup**; do not delete data from unknown still-live attempts. Optimize materialization and streaming/parallel I/O **only then**.
5. Independently re-run targeted, adversarial, recovery, disk-exhaustion and scale cases, plus a target-host validation pass before stronger host-enforced claims.
6. Roll out behind an explicit rollback/compatibility boundary; keep original evidence intact through the required retention window.

**Nuance:** A narrow parallel-read speedup can be a legitimate independent low-risk improvement **after** the decision packet and owner permission, so long as it does not distract from unresolved write-integrity exposure or change canonical content identities. It is **not** the first architecture decision.

## 13. Exact output requested from Claude Code

Before asking to implement anything, deliver:

1. **Verified source-state report:** actual workplace branch/revision, current dirty files, who owns them, run engine files examined, and differences from the public reference. Do not paste company code into the public GitHub document.
2. **Artifact flow map:** all file bytes/manifest hashes, producer, reader, retention, cleanup, materialization frequency and authority classification.
3. **Security surface map:** role tools, shell, test subprocesses, candidate/review/evidence storage, target and sibling repos, observed vs claimed boundaries.
4. **A/B/C decision matrix and measurements:** physical disk peak/final, memory, time, dedup, recovery, risk and rollback on identical fixtures.
5. **D1–D10 recommended choices:** specific proposed decisions marked **PENDING OWNER APPROVAL**, with evidence and alternatives.
6. **Implementation backlog:** minimal ordered PRs, exact subsystem/file touch points, isolated tests, negative probes, benchmark and rollback for each PR. No implementation until approved.
7. **Unknowns/blockers:** host permission untested, ignored/generated scope, concurrent writers, Git retention, running workers, test-executor isolation, stale historical evidence.

## 14. Copy-ready instructions for Claude Code

> Read `rstack-sdlc/docs/workplace-architecture-decision-gates-2026-10-08.md` and the first artifact-storage memo. The GitHub implementation is a **reference**; our workplace RSTACK-SDLC is a newer, diverged engine. Verify every reported difference against the **current workplace source** and our approved test environment. Do not assume the reference line numbers, 2,000-file limit, or old "never writes to app" semantics remain valid.
>
> **Read-only decision pass. No code changes.** Do not immediately optimize parallel reads/writes or treat `artifacts/` as an immutable design choice. Inventory durable bytes versus disposable materializations and compare three designs: per-run CAS, pinned Git + immutable change sets, and hybrid Git + protected CAS. Prove exact reconstruction with dirty/untracked inputs and unavailable source checkout. Report allocated disk/memory/time across complete candidate/retry/full-suite lifecycles.
>
> Prioritize the newly reported real-repository and sibling-repository write detection gaps. Show whether agent tools/test runners can bypass the current admission checks and which host protections **actually** prevent writes as opposed to merely detect them. Do not claim a write cannot be prevented until the effective VS Code harness, OS policies, and all mutation tools have been examined. Do not change enterprise security settings without approval.
>
> Return D1–D10 with evidence, alternatives, recommendation, limits and a bounded multi-PR plan. **Stop for my explicit architecture decision** before implementing, cleaning run directories, migrating storage, or changing agent permissions. Preserve separate Tester/Developer authority, immutable locked tests, truthful RED/GREEN receipts, human approvals and recovery.

## 15. External technical references

- [Git revision/object identification](https://git-scm.com/docs/git-rev-parse) and [Git object retrieval](https://git-scm.com/docs/git-cat-file).
- [Git status/index/untracked semantics](https://git-scm.com/docs/git-status).
- [Git worktrees](https://git-scm.com/docs/git-worktree): useful for multiple checked-out views, **not** a permissions boundary and not zero-cost checkouts.
- [Node.js file copy and reflink behavior](https://nodejs.org/download/release/v24.20.0/docs/api/fs.html).
- [VS Code agent trust/safety](https://code.visualstudio.com/docs/agents/concepts/trust-and-safety), [Agent Host sandbox](https://code.visualstudio.com/docs/agents/run/agent-sandboxing), and [agent customization](https://code.visualstudio.com/docs/agent-customization/custom-agents).

**Boundary of this memo:** analysis, not execution. No workplace repo was accessed through this GitHub commit; all workplace-specific findings are **REPORTED** by screenshots. No current-host security enforcement, benchmark speedup, Git/CAS recovery result, or pipeline modification is claimed proven by creating this document.
