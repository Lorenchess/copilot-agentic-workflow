# RSTACK SDLC — Artifact Storage, Agent Write Boundaries, and Scalable Evidence

**Date:** 2026-10-08  
**Type:** Engineering investigation, remediation design, and Claude Code implementation guide  
**Repository:** [Lorenchess/copilot-agentic-workflow](https://github.com/Lorenchess/copilot-agentic-workflow)  
**Scope:** `rstack-sdlc/**` only  
**Source inspected:** `main` at commit [`3b3471097f9a924613a7fcb2b5c88037f58fe55e`](https://github.com/Lorenchess/copilot-agentic-workflow/commit/3b3471097f9a924613a7fcb2b5c88037f58fe55e)  
**Status:** Analysis and recommendations; **no runtime changes or host validation performed as part of this investigation**.  
**Target host:** VS Code GitHub Copilot, per RSTACK SDLC's own contract. Claude Code may implement/refine this design but its own behavior is not evidence of VS Code Copilot enforcement.

> **Primary design principle:** RSTACK should not duplicate entire source trees as the means of assigning authority to agents. **Storage/provenance, write prevention, tamper detection, and independent proof execution are different controls.** Retain each only where it is needed, and do not trade away existing safety for disk savings.

## 1. Executive conclusion and precise problem statement

The current engine already uses a SHA-256 **content-addressed store per run**. Identical bytes within one run are stored under the same `artifacts/<sha256>` path; retaining each successive tree does **not** necessarily copy all unchanged bytes into a fresh artifact. Therefore the claim "one full hashed copy per phase in artifacts" would be inaccurate.

There are nonetheless two distinct scalability problems:

1. **Repeated full materialization:** agent stages `proof`, `implement`, `review`, and `pr-review` each receive an application copy. The independent RED and candidate verification executions also materialize trees. Retried attempts create additional work directories. A successful path can thus create **four agent application materializations plus two execution materializations**, in addition to the durable content-addressed objects. The code has no general automatic reclamation of those completed `work/` and `exec/` directories.
2. **Retention scope / fixture limits:** content identities deduplicate **within a run**, not between runs; `measureTree` reads each file into memory and rejects trees above **2,000 files or 20 MiB**. A large Java/Spring multi-module repository does not fit that fixture-oriented design.

There is also a separate trust-boundary problem: accepted file diffs are checked **after** an agent has written its private application copy. That helps reject forbidden content on submission but **does not prevent** writes while the agent operates, cross-attempt writes by a worker with broad filesystem access, or transient modifications later reverted before inspection.

**Recommended outcome:** preserve the engine's independent identity/verification guarantees while (a) avoiding unnecessary full working copies, (b) retaining immutable recoverable content with shared deduplication or pinned Git objects, (c) moving write authority into a trusted boundary where the execution host permits it, and (d) measuring real disk allocation, not just nominal file sizes.

Do **not** remove the per-attempt separation merely to save space; it currently protects accepted evidence from late workers. The remediation must preserve or strengthen that property.

## 2. Evidence from the current implementation

References below are pinned to the inspected commit. `CONFIRMED` means directly supported by checked-in code or its checked-in historical reports. `UNVERIFIED` means runtime/host behavior not demonstrated by this investigation.

| ID | Finding | Source / precise behavior | Significance |
|---|---|---|---|
| F01 | `CONFIRMED`: per-run CAS | [`core/engine/engine.ts#L209-L230`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/core/engine/engine.ts#L209-L230): `writeArtifact` names objects by SHA-256; existing hash paths are reused **within that run**. | Deduplication is already partially implemented. Avoid a second redundant store of the same kind. |
| F02 | `CONFIRMED`: entire tree measured/retained | [`core/engine/tree.ts#L10-L55`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/core/engine/tree.ts#L10-L55), [`engine.ts#L638-L662`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/core/engine/engine.ts#L638-L662). Buffers are held in a map; each unique file is retained by hash. | Memory and file-count limits matter independently of disk usage. |
| F03 | `CONFIRMED`: fixture size ceiling | `MAX_FILES = 2000` and `MAX_BYTES = 20 * 1024 * 1024` in [`tree.ts#L18-L54`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/core/engine/tree.ts#L18-L54). Error text explicitly calls this a "fixture application" limit. | It is **not** currently an enterprise-scale whole-repository snapshotter. |
| F04 | `CONFIRMED`: four stage materializations | [`core/policies/workflow.ts`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/core/policies/workflow.ts) assigns `app_copy` to proof, implement, technical review and PR review; [`engine.ts#L1003-L1017`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/core/engine/engine.ts#L1003-L1017) materializes them. | An app with unchanged files is still checked out physically into distinct agent directories. |
| F05 | `CONFIRMED`: extra execution copies | [`engine.ts#L725-L765`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/core/engine/engine.ts#L725-L765) materializes the proof tree and candidate into `exec/` before running tests. | Exact-candidate execution is valuable; disk duplication is not inherently required for that guarantee. |
| F06 | `CONFIRMED`: detect-after lane checks | [`engine.ts#L768-L815`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/core/engine/engine.ts#L768-L815): tester changes outside controlled test dir rejected; developer changes to controlled tests and config-listed protected paths rejected; PR-review copy checked at acceptance. | These checks validate **final observed bytes**, not ongoing filesystem permissions. |
| F07 | `CONFIRMED`: Developer's allowlist is incomplete for a general repository | `acceptCandidate` forbids edits to `controlled_tests_dir` and exact entries in `config.protected`; other paths are not classified into comprehensive "production", "other tests", "build", or "governance" groups. The synthetic fixture protects `rstack.app.json` and `package.json` explicitly. | A test outside the controlled folder or an undeclared build file can fall through as writable. A repository-provided config alone is not a trusted authority. |
| F08 | `CONFIRMED`: cross-attempt prevention is not enforced | [`tests/proof.test.ts#L290-L356`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/tests/proof.test.ts#L290-L356) deliberately shows a late worker writing into another attempt's copy before it submits. [`docs/decisions.md`](decisions.md) discusses the limitation. | Separate directories are not equivalent to separate OS principals/mount namespaces. |
| F09 | `CONFIRMED`: reviewer temporal gap | [`engine.ts#L804-L815`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/core/engine/engine.ts#L804-L815) explicitly says a reviewer's temporary edit restored before acceptance is not observable. [`docs/progress.md`](progress.md) also states technical review is not currently measured the same way. | A hash at acceptance cannot establish what the reviewer actually read or did earlier. |
| F10 | `CONFIRMED`: tests execute without an OS sandbox | [`adapters/node-test-executor/index.ts#L1-L5`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/adapters/node-test-executor/index.ts#L1-L5) explicitly states the test process runs with the user's permissions and no sandbox. | Untrusted test/build code can modify paths outside its `exec/` directory; environment-variable filtering is not filesystem containment. |
| F11 | `CONFIRMED`: the storage metric is incomplete | [`evals/deterministic.ts#L81-L107`](https://github.com/Lorenchess/copilot-agentic-workflow/blob/3b3471097f9a924613a7fcb2b5c88037f58fe55e/rstack-sdlc/evals/deterministic.ts#L81-L107) excludes `work` and `exec` from "packet storage" and sums file lengths, not physical allocated blocks. | A favorable packet-size number does **not** measure actual disk pressure or copy-on-write savings. |
| F12 | `CONFIRMED`: disk exhaustion has occurred | [`docs/progress.md`](progress.md), 2026-10-05 entry, records an `ENOSPC` interruption with about 9,325 scratch entries under `tests/.tmp/`, subsequent targeted cleanup, and retained older scratch evidence. | Cleanup and retention ownership are immediate operational requirements, not just speculative future scale work. |
| F13 | `UNVERIFIED`: Copilot preventive write isolation | [`docs/parallel-host-readiness.md`](parallel-host-readiness.md), [`docs/s6-host-validation.md`](s6-host-validation.md), and [`docs/progress.md`](progress.md) distinguish offline engine tests from pending real VS Code Copilot validation. | Never relabel offline change rejection as prevention by the target host. |

**Correction to the original intuition:** `artifacts/<sha256>` is valuable retained evidence, **not necessarily an accidental byte-for-byte duplicate of each class for each phase**. The main avoidable amplifier is repeated `work/` and `exec/` materialization plus per-run duplication and scratch accumulation. Any proposal to replace it must account for what those trees currently guarantee: an immutable source of bytes after acceptance and a clean starting basis for each retry.

### Three different meanings of "copy"

- **Durable retained object:** exact unique file bytes stored to rebuild a base, proof tree, candidate, or failed candidate later. Needed unless those bytes are independently guaranteed available through pinned Git objects or another durable store.
- **Transient role workspace:** writable view assembled from a known tree for an attempt. Needed for safe isolation, but not necessarily via a full physical byte copy.
- **Transient execution workspace:** reproducible view assembled to run RED / GREEN evidence. Must not trust the role's still-writable workspace and must be isolated from protected evidence.

Optimize all three separately. Do not treat a content hash as a replacement for durable bytes. Do not treat a transient workspace as authoritative evidence.

## 3. Threat model and non-negotiable controls

**Assets to protect:** original source, controlled tests, all other tests and build/test configuration, protected governance files, immutable baseline/proof/candidate objects, run journal/decisions, verification receipts, independent review findings, and any retained owner approvals.

**Adversarial actions to test, even if agents act accidentally:** Developer edits/weakens tests or test runner settings; Tester edits production; Reviewer mutates candidate and restores it; stale agent writes into the live attempt; model invokes an alternate shell/tool/MCP path; test process writes into the run's trusted store; symlink/junction or path case bypass; deleted/recreated files; changed chmod/executable bit; tampering with journal/manifest; provenance forgery; unbounded scratch/resource use.

**Threat boundary:** anything an agent or an agent-triggered build/test process can write must be treated as untrusted until a trusted controller admits it. A SHA-256 digest detects a content mismatch only when the expected digest is protected from that same writer. It does not provide authentication, permission enforcement, or evidence of a file's prior state during execution.

Required invariants, with independently tested proofs:

1. **Role ownership:** Tester only changes approved controlled test paths; Developer only changes explicitly approved production paths. Tests outside the controlled directory, configs, build files, workflows, pipeline policy, credential files, and run-control files are denied by default. Legitimate exceptions require an external human authorization bound to exact paths/revisions; no role can mint its own waiver.
2. **Immutable accepted subjects:** base, locked proof, candidate, packet and authoritative run history cannot be changed by role agents. Retained content must remain reconstructible, not merely hash-shaped.
3. **Attempt isolation:** one attempt (including an abandoned but still-running worker) cannot alter another attempt, its controls, or protected run evidence. Merely comparing directories later is not sufficient for a "prevented" claim.
4. **Trusted proof execution:** RED and GREEN are executed by the trusted controller against the exact selected bytes, with the same controlled proof/environment contract. Executor outputs and logs are retained with hashes and reviewed for authenticity limits.
5. **Independent review:** a reviewer sees the exact candidate/proof records and has no write authority to the tested subject, execution receipt, or review policy.
6. **Fail closed:** unavailable prevention, inconsistent manifests, unsupported paths/file types, missing blobs, changed execution context, unresolved worker liveness, and quota overruns produce explicit blocked/unsupported results. Never silently mark these as successful enforcement.
7. **Recovery/audit:** retained required objects remain reachable for the documented retention period; crash recovery and abandoned attempts cannot cause accidental deletion of proof or approved content.
8. **No unwarranted publication:** the local PR proposal remains `NOT_ATTEMPTED` for external publication, consistent with current scope.

## 4. Evaluate established patterns (not interchangeable)

| Pattern | Disk benefit | What it actually guarantees | Limitations / RSTACK decision |
|---|---|---|---|
| **Pinned Git commit/tree + changes** | Repository already stores versioned content efficiently; refs rather than full source copies for clean baselines. | Content identity and reproducible tree *if* objects remain available. | Git SHA alone omits dirty/untracked/generated inputs; Git GC/force pushes/shallow history and agent control of the Git database matter. **Recommended as an optional clean-Git provenance backend, not the only backend.** |
| **Shared content-addressed immutable blobs** | Deduplication across runs, not just within a run. | Can reconstruct exact non-Git, dirty, controlled-test and candidate bytes. | Must establish tenant/repository isolation, atomic creation, integrity checks, garbage collection, retention/pinning, quotas and genuine write protection. **Strong candidate for durable storage.** |
| **Reflink / copy-on-write file clone** | On supported filesystems, logical copies initially share physical extents and diverge on write. | Distinct writable workspaces; efficient space for unchanged files. | Reflink is **not** permission separation. Platform capability must be probed, and fallback copies consume full space. **Good optional materializer.** |
| **Linux OverlayFS or equivalent CoW mount** | Common immutable lower view; only modified files occupy upper layer. | Cheap isolated workspace *views* if lower/upper are controlled. | OverlayFS alone does not prevent edits inside the view; host OS, mount capabilities and cleanup matter. **Good optional controlled host strategy.** |
| **Git worktree** | Shares Git object database; each checked-out file still occupies workspace storage unless underlying filesystem uses CoW. | Separate worktrees / independent HEAD state. | Not a security boundary; shared `.git` can be mutable; previous RSTACK scope discourages unexplained worktrees. **Not the default solution.** |
| **Trusted patch broker** | Avoids sending/keeping full file copies as a *handoff*: submit structured changes/diffs. | Preventive only when it is the exclusive write authority and it validates paths + base identities atomically. | If an agent retains unrestricted shell/file writes, broker can be bypassed. **Preferred write admission interface when host permits.** |
| **OS/container/VM isolation** | Can be combined with shared lower + CoW upper. | Preventive filesystem, process, network and secret boundary when correctly configured. | Adds operational complexity and must encompass ALL agent tools and child processes; mounting read-only data plus unrestricted scratch still needs patch admission. **Preferred stronger boundary for real deployment.** |
| **Hashes and diff guards alone** | Very small evidence overhead. | Detects byte changes at observation points. | Cannot stop edits, prove what was read, detect edit-then-restore, or prevent artifact tampering by the same principal. **Keep as a second gate, never relabel as prevention.** |
| **Hardlinks/symlinked mutable baselines** | Saves initial bytes. | Little useful protection. | Hardlinks share inode: in-place edits can corrupt the supposedly immutable baseline; symlinks can escape boundaries. **Reject.** |

Primary external references (official documentation, checked 2026-10-08):
- [Git worktrees](https://git-scm.com/docs/git-worktree): linked worktrees share repository metadata/object storage, **not** filesystem write privilege boundaries.
- [Node.js v24 `fs.copyFile` / `COPYFILE_FICLONE`](https://nodejs.org/download/release/v24.20.0/docs/api/fs.html): reflink attempted, fallback copy allowed unless FORCE is selected. A successful ordinary copy is not proof of a reflink.
- [Linux OverlayFS](https://docs.kernel.org/filesystems/overlayfs.html): lower/upper layers; modified files copy up.
- [Docker read-only bind mounts](https://docs.docker.com/engine/storage/bind-mounts/): `readonly` / `ro` prevents a container writing to the specific bind mount, but other writable mounts and privileges need review.
- [Claude Code shell sandbox scope](https://code.claude.com/docs/en/sandboxing): shell subprocess sandbox does not encompass built-in Read/Edit/Write tools, hooks, MCP servers and other helpers; native Windows shell commands are unsandboxed. **This is context for Claude as a builder, not evidence about VS Code Copilot.**

## 5. Recommended target design

~~~text
Trusted RSTACK controller / policy / journal (agent-inaccessible)
     |
     +-- Immutable source identity
     |     - committed Git tree/commit when eligible and pinned
     |     - otherwise, recoverable immutable CAS blobs + manifest
     |
     +-- Locked test revision and approved proof contract
     |
     +-- Attempt-specific, untrusted workspace view
     |     - shared immutable lower + private CoW upper if supported
     |     - otherwise a bounded private materialized directory
     |     - no access to other attempts or protected control plane
     |
     +-- Change admission (exclusive trusted broker or gated diff)
     |     - role/path/operation classification and exact base revision
     |     - deny protected and ambiguous paths
     |
     +-- Trusted reconstruction and sandboxed test execution
     |     - exact accepted candidate + locked proof + pinned environment
     |
     +-- Immutable evidence receipt, independent review, local PR proposal
~~~

### 5.1 Preserve current logical subject identities

Do not casually replace `base`, `proof_tree`, `candidate` and evidence references with unqualified Git commit hashes. They currently identify **measured logical trees**, including uncommitted, controlled-test and candidate content, and the packet verifier relies on those relationships. A Git revision may be a **storage provenance hint** or backing object source. Keep the canonical tree manifest and its identity stable unless a deliberately versioned contract migration is approved and tested.

A proposed small internal seam:

~~~text
RetainedContent:
  put(bytes) -> contentRef
  get(contentRef) -> verified bytes
  pin(contentRef, runId)
  verify(contentRef) -> valid | blocked

AttemptView:
  create(baseTreeRef, attemptId, capabilities) -> workspace descriptor
  measureAndClose(attemptId) -> trusted manifest/diff
  reclaim(attemptId) -> result or explicit reason for deferral
~~~

These are interface sketches, **not required filenames or a mandate to add a plugin framework**. Reuse existing `writeArtifact`, `retainTree`, `materializeTree` and engine paths where possible. Prefer one tested abstraction per real implementation need.

### 5.2 Define a *trusted* write policy separate from repository data

The existing `rstack.app.json` contains controlled test directory and `protected` list. That is useful application configuration but not sufficient to authorize all edits. Introduce or adapt a **single protected classifier** to distinguish:

- controlled tests and all other tests/fixtures,
- production files,
- build/test runner configurations (Maven/Gradle, package manifests, CI, coverage/runner settings),
- governance and RSTACK control/evidence files,
- local/scratch/generated/ignored paths,
- unknown/ambiguous paths (deny by default).

Use canonical paths, real-path checks and filesystem-specific normalization (Windows case-insensitivity, junction/reparse points, symlinks, absolute/`..` paths, alternate data streams where applicable). Apply policy equally to add, modify, rename, delete, mode change and replacement. Do not grant production writes simply because a path was not named in `protected`.

**Important:** if a role can still invoke an unrestricted terminal or file tool, the controller may **detect/reject before acceptance** but cannot claim it **prevented the underlying write**. For the prevention claim, place the entire worker process/tool surface behind an enforceable boundary or make the trusted broker the only writer. State the enforcement level in every control report: `BLOCK_BEFORE`, `REJECT_AT_GATE` or `ADVISORY/UNVERIFIED`.

### 5.3 Keep authoritative evidence outside agent control

The run journal is the authoritative state history; `state.json` is a derived snapshot. Preserve those semantics. Keep controller policy, immutable content, accepted manifests, decision records, and trusted execution receipts where agents and tests cannot alter them. A run-local directory is **not** a trust boundary if its parent user/process can write it.

Do not rely on a SHA-256 name alone as access control. Verify bytes on every trusted read; preserve references/leases against garbage collection; validate complete manifests (duplicate paths, case collisions, path traversal, type/mode metadata as appropriate); account for crash-atomic writes and fsync behavior.

For non-Git or dirty source, retain the unique missing bytes once in the protected CAS (and relevant metadata), even when a clean Git revision covers most of the source. A hash-only "snapshot" that cannot be reconstructed is a regression.

### 5.4 Avoid full materialization when safe; retain fallback

Two separate optimizations:

1. **Transient views:** where supported and approved, use CoW/reflink/overlay materialization for ``work/` and `exec/`. Read-only reviewer views are better than writable reviewer copies when the host permits them. Do not use hardlinks. For unsupported filesystems (notably unknown native Windows configurations), use the existing verified full-copy fallback or fail if policy requires a stronger guarantee. Report which path was used.
2. **Durable retention:** optionally share the immutable byte store across runs of the same permitted security scope; keep per-run manifests/references. Pin accepted candidates and evidence for retention. Only reclaim unreferenced objects after proving no active run/evaluation/recovery reference remains.

A CoW workspace still requires exclusive ownership. Worker A must not be able to write Worker B's upper layer, scratch or controller state. A writeable overlay is **not** the prevention boundary by itself.

### 5.5 Test runner must be sandboxed before claiming host prevention

The current Node executor explicitly runs untrusted test code with the caller's permissions. Make test-execution isolation an explicit capability and record what is enforced. The same principle applies to Java/Maven/Gradle builds, which can run scripts/plugins with broad filesystem/network access.

A safe future test runtime needs a read-only verified input, writable scratch/build output, no access to control-plane storage, bounded CPU/disk/memory/time/processes, and explicit network/secrets policy. Test outputs must be observed by the controller. If the corporate target host cannot provide this, preserve the detect-after assurance level; **do not** advertise prevention as implemented.

### 5.6 Lifecycle and retention policy

Define a real lifecycle for `work/`, `exec/` and `tests/.tmp/`. Do not delete in-flight, abandoned-but-live, unknown-liveness, resumable, or externally owned evidence. A successful accepted attempt's disposable view may be reclaimed **only after** the accepted immutable objects/receipts are verified, no reader depends on the directory, and the worker is quiescent or securely isolated. Failed attempts may need longer retention under an explicitly defined budget. Retain a compact reason/log/manifest when discarding large disposable files.

Make cleanup idempotent, crash-resumable, ownership-scoped, bounded by retention periods/quotas, and auditable (what was reclaimed and why). A global "delete all old scratch" command is not acceptable without ownership and liveness checks. The historical `ENOSPC` incident makes this phase a priority.

## 6. Implementation plan for Claude Code — small independently reviewable phases

**Scope guard:** do not modify `rstack-pipeline/`, root host configs, live corporate projects, Jira, Bitbucket, or actual user run evidence. Do not create extra clones/worktrees. No broad cleanup. Changes belong only to `rstack-sdlc/` and affected tests. This document gives design guidance; implementation should follow the existing owner approval and review gates. Avoid a large rewrite.

### Phase P0 — READ-ONLY inventory and baseline (required first)

Inspect `tree.ts`, `engine.ts`, `workflow.ts`, `containment.ts`, `node-test-executor`, packet/evaluation paths, stage prompts, host adapter and all test/retention fixtures.

Deliver:

- an **artifact flow matrix** for every producer, consumer, recovery use and cleanup owner: `artifacts/`, `work/`, `exec/`, `brief/`, `rejected/`, `state.json`, `journal`, `evaluation/`, `tests/.tmp/`;
- a source-of-truth list showing which blobs must remain reconstructible after each transition;
- exact existing tests protecting late-worker isolation, proof immutability, reviewer subject identity, recovery and evaluation identity;
- per-stage/per-attempt file count, **logical bytes and physically allocated bytes** (where measurable), wall time and peak RSS on a small fixture and a **synthetic large sample**; include repeat runs and failures;
- count of unique SHA blobs within runs and duplicate SHA blobs across runs;
- a capability matrix for Windows/WSL/Linux and the *actual* VS Code Copilot runtime, marking every unavailable probe `UNVERIFIED`;
- a security map identifying write access of controller, role agent, test runner, filesystem materializer and reviewer.

**Gate:** no implementation until P0 identifies what every copy is buying today. Do not invent exact current disk totals or claim host prevention from code reading.

### Phase P1 — Reclaim safe disposable materializations

Implement the smallest lifecycle change that can reclaim proven-unused successful `work/`/`exec/` copies **without** removing retained authoritative bytes. Prefer a narrowly scoped opt-in and dry-run listing for cleanup. Where worker liveness cannot be established, do not reclaim. Ensure stopped/resumed/abandoned runs, late workers, and independent evaluation still work.

Measure allocated disk before/after; negative tests must show recovery still succeeds and untouched failed evidence remains available. No changes to content identity or stage contracts in this phase.

### Phase P2 — Cheap workspace views

Introduce a single materialization strategy selection behind current stage dispatch/execution mechanics. Consider Node v24 reflink support or host-approved CoW overlays; retain proven fallback. Measure whether the clone is **actually** CoW, not merely whether `copyFile` returned successfully. Enforce distinct attempt ownership and prevent shared-inode mutation. No hardlinks. Preserve symlink/junction rejection until explicitly redesigned and tested.

**Gate:** demonstrate exact tree identity and existing tests with every supported strategy and fallback, plus large-fixture allocated-byte reduction evidence. If the filesystem does not support CoW, report that rather than claiming savings.

### Phase P3 — Harden the write classifier and acceptance boundary

Close F07: default-deny non-production paths for Developer; default-deny non-controlled-tests paths for Tester; protect build/test execution, governance, all tests, metadata and accepted evidence. Keep one policy source. Make exceptions external and bound to the exact revision/path. Cover rename, delete, mode, case, links and alternate paths.

Preserve the existing `WRITE_BOUNDARY_VIOLATION` semantics when appropriate. Report **detected-at-submit** separately from **prevented-at-write**. Do not reintroduce a self-issued waiver or a second competing policy in role prompts.

**Gate:** negative tests for non-controlled tests, `pom.xml` / `build.gradle` / `settings.gradle` / CI, `rstack.app.json`, test patterns, source-to-test renames, case aliases, symlinks/junctions, deleted files and tampered manifests. Tests must prove the forbidden candidate cannot be accepted. Prevention claims require host enforcement evidence in addition.

### Phase P4 — Durable shared storage / Git provenance pilot

Only after P0 evidence justifies it, choose the smallest durable-content optimization:
- Option A: shared protected SHA-256 object store with per-run references/leases and garbage collection, supporting clean and dirty/non-Git inputs;
- Option B: pinned clean-Git tree as a reusable base, plus protected CAS for any dirty/untracked files, controlled proof and uncommitted candidates.

Keep logical tree contracts compatible where feasible. Make storage scope/retention/security explicit. Test independent run restart, missing source checkout, changed original checkout, missing/corrupt object, garbage collection, concurrent writes, crash/recovery, dirty/untracked inputs, and reuse across two runs. Version persisted records only if unavoidable, with migration or read compatibility documented.

**Gate:** reconstruct the exact base, proof tree and candidate after original workspace changes or disappears. Repeated runs show fewer unique retained bytes without weakening evidence isolation.

### Phase P5 — Real preventive host boundary (separate capability work)

Validate actual VS Code Copilot capabilities and corporate restrictions. An agent prompt or tool list alone is not an OS access control. Choose one enforceable surface: trusted exclusive patch broker with no other mutation channel, or isolated worker/runtime whose whole process and tools cannot access protected files/other attempts. Run hostile probes through every relevant write route, including terminal/file/MCP/hook/subprocess. Verify denied writes **before** they touch real targets; explicitly mark unavailable/unsupported host surfaces.

Test runner gets its own execution boundary. Keep the offline engine tests distinct from live target-host tests; **Claude Code success is not `COPILOT_VALIDATED`**.

### Phase P6 — Independent regression, scale and rollout

Run affected tests first, then wider package checks as permitted. Re-run adversarial/sensitivity cases relevant to touched invariants; report untouched or unrun cases truthfully. Test both normal and fallback materializers, refused and failed runs, interrupted/recovered runs, stale workers, host unavailability, and storage corruption.

Publish a before/after benchmark for physical disk allocation, peak disk, memory, elapsed time, duplicate bytes, retries, recovery success, and evidence integrity. Keep failure cases in denominators. Use an opt-in rollout/rollback path for storage format changes. Do not auto-delete previous immutable evidence or convert it irreversibly.

## 7. Minimum adversarial acceptance matrix

| Probe | Required outcome | What it validates |
|---|---|---|
| Developer edits a controlled unit test | Rejected; **prevented** only when host boundary proved | Tester/Developer split |
| Developer edits unrelated tests, test fixtures, `pom.xml`, Gradle, CI or test runner patterns | Rejected; explicit path/report | General classifier completeness |
| Tester edits `src/main` / application production file | Rejected | Tester lane |
| Agent creates, renames, deletes/recreates or case-aliases a protected path | Rejected | Full operation coverage |
| Agent writes through symlink/junction/`..`/absolute path | Rejected or blocked at boundary | Path containment |
| Old worker writes into currently pending attempt | Protected input unaffected or run fails closed; never accepted as the intended worker's work | Attempt independence |
| Reviewer changes then restores a file before returning approval | Not labeled "never edited" absent preventive boundary; reviewed subject reconstructed independently | Temporal truthfulness |
| Build/test command attempts to alter run journal or accepted proof | Host prevents it, or prevention claim withdrawn and integrity gate blocks publication | Executor boundary |
| Protected content blob missing/modified | Deterministic failure before trusted proposal | Durable evidence |
| Same content in two runs | One authorized physical object per content scope under shared CAS; both remain restorable | Cross-run dedup |
| Dirty/untracked source with no Git commit | Exact tree reconstructible from protected retained bytes | Completeness of provenance |
| Worker crash or run resume during cleanup | Retained evidence and accepted candidate still reconstruct; cleanup safe/repeatable | Recovery |
| Filesystem without reflink support | Explicit reported fallback or fail-closed according to policy; no false savings claim | Portability |
| Multi-module large fixture above old 2,000/20 MiB caps | Successful bounded processing under new policy, without unbounded memory or fabricated proof | Scale |
| Disk quota reached mid-write | No half-accepted object, no falsely advanced journal, explicit recovery | Resource exhaustion |

Require tests of **both mutation attempts and the actual trust boundary**. A test that only compares two hashes after an agent turn is a detect-after test.

## 8. Benchmark protocol (do not invent gains)

Measure at least these cases: existing tiny fixture; source-dense simulated Java multi-module tree with many small files; larger files; unchanged candidate; small delta; many modifications; failed attempt followed by retry; two runs sharing most content.

For each case capture:

| Metric | Measurement |
|---|---|
| Retained blobs | number of unique objects / summed logical bytes, including cross-run overlap |
| Workspace copies | number of `work/` and `exec/` views, live plus stale |
| Physical disk | allocated bytes/block usage, not only apparent size (platform-specific) |
| Peak storage | maximum observed during RED + implementation + verification + retries |
| Memory | peak RSS during measure/retention/materialization |
| Latency | dispatch materialization, submit/measure, execution startup, cleanup |
| Correctness | identical canonical manifest and candidate identity, passing negative guards |
| Recovery | restart with original app changed/missing; verify every pinned subject |
| Host assurance | `BLOCK_BEFORE` vs `REJECT_AT_GATE` vs `UNVERIFIED` with evidence |

Separate *target* savings from *observed* savings. Reflink/overlay support depends on filesystem, host policies and how files are modified; no percentage is guaranteed. An empty Git object pool may initially consume storage before dedup yields savings.

## 9. Traps to avoid

1. **Do not replace durable bytes with hashes alone.** Accepted subjects must remain reproducible without trusting the original checkout.
2. **Do not assume the current CAS stores a full separate copy for every phase.** Same-byte content is already deduplicated inside a run.
3. **Do not let a worker edit `artifacts/` or the journal and call SHA checks sufficient.** Authoritative expected identities must be outside worker control.
4. **Do not use hardlinks for mutable application trees.** In-place writes can mutate shared source objects.
5. **Do not equate a Git worktree, overlay, directory layout or Docker image with role-aware write permissions.**
6. **Do not silently omit paths from a large repository.** Unsupported file types, symlinks, generated inputs, submodules and test fixtures need explicit classification or refusal.
7. **Do not blindly delete `exec/`, `work/` or `tests/.tmp/`.** Some are part of active/resumable attempts; others are retained diagnostic evidence or another process's files.
8. **Do not alter the human approval/audit budget, verifier independence, verdict semantics, proposal publication status, or deferred Jira/Bitbucket integration.** They are outside this refactor.
9. **Do not inflate the solution into a new general-purpose artifact server or plugin framework without measured necessity.** Start with lifecycle and materialization.
10. **Do not claim security properties from role instructions or agent confidence.** Test host capabilities and show where bypasses remain.

## 10. Explicit design decisions still needed

Present these to the owner **after P0**, with evidence and recommendations, rather than silently deciding:

- **Backend:** retain per-run CAS with better cleanup, add per-repository protected shared CAS, use pinned Git with CAS fallback, or a staged combination? What retention/backup and tenant security boundary is required?
- **Host:** which execution OS/filesystem (native Windows, WSL2/Linux, other), target VS Code Copilot version, and permissions actually exist? Are read-only mounts, sandboxed processes or exclusive write broker possible?
- **Ownership:** who controls trusted state, content objects, test runners and cleanup processes, and are they outside every agent/child process's writable area?
- **Policy:** precise production/tests/build/governance classifications for a typical Java/Spring repository, and the owner-approved mechanism for rare cross-lane changes.
- **Evidence retention:** how long are successful/failed executions and original bytes retained, what must be available after a restart, and what storage budget is acceptable?
- **Migration:** does the existing per-run `sha256:` format need to remain readable indefinitely? Which active/unfinished runs may not be migrated?

## 11. Claude Code handoff instructions

**Goal:** reduce RSTACK SDLC storage amplification and close write-boundary assurance gaps **without removing proven safeguards**. Do not jump directly to deleting hashed files or entire attempt trees.

1. Read this document and the implementation/record contracts it references. Verify all assumptions against the **current** checkout and report any drift from the inspected commit.
2. Perform **P0 read-only inventory first**. Show exact paths, authoritative vs transient semantics, real storage metrics, and host support status.
3. Compare at least two practical options and identify the smallest first change that retains existing security and recovery. Separate disk savings from preventive permissions.
4. Propose a bounded sequence of implementation PRs with affected files, preserved invariants, negative tests, benchmarks, rollback and explicit owner gates. Do not move/modify other RSTACK projects.
5. Following the project's approval process, implement **one phase at a time**, with minimal production changes and tests of only touched mechanisms first; use independent reviewer/auditor for claims of safety.
6. In every handoff report: `CONFIRMED` evidence vs `ASSUMED/UNVERIFIED`, exact files changed, tests actually executed, baseline vs candidate identifiers, physical storage before/after, known host limitations, and remaining risks.
7. Stop and request the owner's decision for changes that modify authority boundaries, evidence retention/GC, host security settings, active-run migration, or destructive cleanup. No self-issued waivers.

**Acceptance criteria for the overall remediation:**

- Existing role/proof/candidate/PR-review semantics and exact-subject identities remain correct, or have a controlled tested schema migration.
- Every accepted tree can be independently reconstructed and verified after the original checkout changes.
- The system measures actual disk cost and demonstrably reduces redundant storage on **supported** platforms without pretending unsupported platforms provide CoW.
- Roles cannot *successfully promote* out-of-lane changes; any claim of *preventing writes* is supported by demonstrated host-level enforcement.
- Late/abandoned agents cannot contaminate independently accepted work; where that is not preventable, block and label the risk.
- Scratch retention/cleanup is bounded, owned and recoverable, and large-repository size/memory limits are explicit rather than fixture-sized.
- No unrelated pipeline, external integration, real evidence, or publication/merge operation is changed by this effort.

---

## 12. Relationship to existing RSTACK documents

This document is **not** a replacement for the authoritative [factory contract](../01-FACTORY-CONTRACT.md), [stage/evaluation contract](../03-BATCHES-AND-EVALS.md), [decisions](decisions.md), or current [progress](progress.md). It is a focused engineering remediation brief to be validated, approved and implemented under those contracts. In particular, the previous decision to isolate attempts by copies was a response to a real late-worker integrity bug. Any change that removes full copies must supply an equally strong or stronger replacement for that invariant.

**Scope of this commit:** a new Markdown investigation file only. No engine change, host policy, filesystem cleanup, benchmark execution, or runtime test is claimed.
