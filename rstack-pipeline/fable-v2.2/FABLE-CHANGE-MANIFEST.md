# Fable change manifest — fable-v2.2 against rstack-v2.1

Generated 2026-09-17 by hashing files directly (SHA-256). `rstack-pipeline/` is covered by the repository's existing ignore rule, so `git status` and `git diff` show none of this work; every comparison here is file against file.

Baseline: `rstack-pipeline/rstack-v2.1` (32 files). Result: `rstack-pipeline/fable-v2.2` (33 files plus this manifest, which cannot contain its own hash).

| Set | Count |
|---|---:|
| Added | 1 (+ this manifest) |
| Changed | 21 |
| Unchanged | 11 |
| Deleted | 0 |

## Added

| File | SHA-256 | Purpose |
|---|---|---|
| FABLE-IMPLEMENTATION-REPORT.md | `4aaaf7446324bb6f704dcb3debca6c6265c561d8155fbe8799e4cb4d196dbd4c` | New: findings, line references, before/after, E/R mapping, status, checks, risks. |
| FABLE-CHANGE-MANIFEST.md | not self-recorded | This manifest |

## Changed

| File | Baseline SHA-256 | Resulting SHA-256 | Bytes before → after | Why |
|---|---|---|---|---|
| CHANGES.md | `308b251639eb51e9e0fe0a01240d04e18748b717ddc034024979cbd007096590` | `a412313f90f8aac29f2a82087a48074fcb487ab9dac71b05880d01028f920236` | 4376 → 8502 | v2.1 record kept under its own heading; round 2.2 change table and preservation paragraph appended. |
| OPEN-DECISIONS.md | `02d930c5745bfb94b36b72d5ed32db4b126606f23fa7a616545b15add8ae51b0` | `072440de389c1d8bf89d78e20736946791f2560f3326d8465e86ddd355a96440` | 4261 → 6964 | OD-14 to OD-20 appended; earlier rows unchanged. |
| README.md | `bbf07d5934cd85405fcb78af5307c6947d6c6feb9e0877b20ae11ca18728ff65` | `327e4d26fa94e85c0c1f86d526994c6a41e5fbac692f0c3e6cb0b804280e3cfe` | 3417 → 4921 | Describes round 2.2, links the two handoff files, corrects the document count and the preservation statement. |
| RUNTIME-PATCH-PLAN.md | `fb793720eb99192bba87464e10d6ff579cc0d63d899f4929af93db7d5eba687d` | `85087bcddb108622293ab0d9b604e9f9ac276c1fe8a6a3abfa312ee40137595d` | 11205 → 13665 | Round 2.2 addenda appended: source questions only; R1–R7 unchanged. |
| VALIDATION-PLAN.md | `e023e6278fddf3771bb9e09447668c75d4b5b2c547cd297ce0d5473ac08f6384` | `6865c1d80f53371d87c942683e1c11101022ac94747af1429b21bc86a73a554f` | 4739 → 9106 | v2.1 inspection record labelled as such; round 2.2 static inspection and additional workplace checks appended. |
| agents/rstack-approval.agent.md | `5691d3ad5200ddd1f4b84e821675014901e9082ea75ff0c137b4764cfd3c642c` | `953b294fac0544448e0ce3e6e1b359be2515537e5af66fb4264393318042f826` | 8218 → 10822 | Append-only entries; human-made commit compared with approved diff; untracked inputs and .rstack exclusion check; work held through release evaluation, restoration as last act, recovery-only dispatch; file-based comparison packet; intent before action; separate-checkout caveat (V22-06, 07, 08, 09, 10, 11). |
| agents/rstack-dev.agent.md | `f14682f6d11175b0e6ed15a427a766ae23739e12091d47f73b887de70c7ddeb3` | `81b7b6c85415f0523ad8c34b394a6347d3775b09e7f4b065fcbfed3f962c24a7` | 4706 → 5289 | Envelope; explicit no-code result for verification-only units; script path placeholder (V22-01, 02, 12). |
| agents/rstack-orchestrator.agent.md | `d93de1e621e170a57decfda8c11ab5112dbfd09f2b79efa6b39aba0e4e2ddf48` | `c66a9a664df9b6fb1ba51cc3eea26ea082b7f343900aa97418f7f0050955b698` | 4376 → 5590 | Routes on envelope fields; field-comparison evaluation of review eligibility only; persistence and archive names; reports held user work at any stop (V22-01, 02, 03, 06, 09). |
| agents/rstack-plan-auditor.agent.md | `2f9084b7befbf8fd0b36bea944bbbb43f731c18a062ee8fdadab2f1bcebd9545` | `ee8a1b34663e09bea362cc1d43d507ba90479b57959cfb508889585736fd3ea5` | 6582 → 7235 | Reply = envelope + audit body; contamination wording; script path placeholder instead of a plugin variable (V22-02, 12). |
| agents/rstack-planner.agent.md | `a249d07353d090060ef1f0f7d8fffa1a99067574c03a601fa197afa7acd65f69` | `83313ac4fb9f717b5bfc4b36ba498a36308fd224ae13f29020cffbdff06dbca3` | 9070 → 9275 | Reply begins with the envelope; NEEDS_HUMAN / STOPPED when it cannot complete (V22-01, 02). |
| agents/rstack-reviewer-architect.agent.md | `cd82940a9358cef9022817ba357878d77b75f1628bdaf6e56bae54e68fa7f2be` | `2af41f6b75338dbae103270777321a9edc8c7084633f81f4873fab86e8ea77eb` | 4255 → 5091 | Cites the attempt-path packet; reads changed content from the comparison packet and states what it cannot verify without Git; envelope (V22-02, 06, 07). |
| agents/rstack-tester.agent.md | `60f294a1e7886d686ae2cbbfa5d0aef28b6a62b0b37c785a3d77e01f1661ebfc` | `d0f2f0790b531979a2c34d5f3b26ffe8dd680d511ac85a00f57175ceb151abae` | 8378 → 9478 | Steps marked by target; packet written in the attempt directory and copied; VERIFY_RECORDED / STOPPED; failure owner may be UNKNOWN (V22-01, 05, 06, 13). |
| pipeline/SKILL.md | `8bfb1357e561a5e74620f2956e0c00738989fe7349d6ea63d97f7772a94ad3ab` | `a807319f34465d651e588130fa8669cc0c0049b48491077910e3abfab6420584` | 14025 → 18544 | Result tokens and separate state-4 lines; routes for locked failure, RELEASE_BLOCKED, STOPPED and held user work; owner-first routing of in-run failures; digest-decided scoped-review route; named evaluators and 'current audit'; separate-checkout route marked SOURCE-BLOCKED; restoration rule; four gate exception gaps named (V22-01, 03, 04, 05, 09, 11, 14). |
| references/approvals.md | `83eddebb8070069c3cc47642681eafea2fafa72d9b2b1359891488c43d0cc426` | `d93f1acba1743e18e501b2465eac3083a80c916c13b0f194a0f6be4168e43f77` | 4266 → 4634 | Restoring held user work needs the user's answer; evidence statements are not publication permission; intent recorded before each write (V22-09, 10, 15). |
| references/discovery-cost.md | `0e1c142fb28fdf8448c1c35ad384d020fa68e416c04c9117315213bbc03222e1` | `50ca1e8e175da7ab246461165a1730b492b50b03d6fd8d1d1b186f2012e223f5` | 4757 → 4918 | Script path placeholder instead of a plugin variable (V22-12). |
| references/estate-instructions.template.md | `4ba6eeec8e15653ddee3d8ff1bbc72944655f93e4b9c3de19dfb873cae50914d` | `fc1340c27701385b7a72b3f6037635ad5be8773e00d6ea463f51d34bdc6ee3e0` | 3277 → 3421 | Header comment names the standing rules and skill as owners and flags the .github paths as the reconstructed layout (V22-12). |
| references/estate-layout.md | `cc0598f5cd24c8672f7dae964a8f0fcf1da846ba0894be2826f3df1accca69db` | `4e285627ef55952ae5de97db57e588731f15efe9c8301132cfdceb540684fdec` | 5687 → 5875 | Script path placeholder instead of a plugin variable (V22-12). |
| references/handoff-contracts.md | `14581e5e866a97b0a44cb321f24a2d8577869b18fa94d4c43010bd9561bba452` | `6bf2886179564cfa0db91660a5d5e5ebe20f4b165fd931a700ba7de1b6fe8e5d` | 14812 → 18309 | Envelope as first reply block, state-4 lines, closed token list, fresh-role reply layout and persistence; round archive names; immutable per-attempt review packet with current copy; file-based comparison packet; append-only approval.md with intent before action (V22-01, 02, 06, 07, 10, 13). |
| references/harness-map.md | `0e520eef360a1f26f0b78057d3271fb1db4d5deb11297776efa090f0b097d93a` | `3000581a0a5d02ae5645cfc4eff72dfc0464681a5e37b73e55cdd08958f51d20` | 3550 → 4698 | Table of the four gate exception gaps with evidence and patch ids; three further unestablished behaviors listed (V22-11, 14). |
| references/learnings.md | `6f24f2023556f306d4d5091f6806b5c8316338b45ddfa372bc2d9fa005cb4e6f` | `5aa230dce80f3079935d7de9ee8caa0ebfcc889abc1696ce48797f9c87f6a199` | 3225 → 3330 | Contamination wording aligned with the skill and fresh roles (V22-12). |
| references/write-boundaries.md | `a182b5661152c060bfe874e99497184aaa1a5d63c4fb4b65773379ed5b054686` | `b2c7910f906e16371f24c1ace2002413a4ebbd34b50e20995cfd76bf90e87667` | 8843 → 9104 | Writer rows for attempt directories, candidate archives, comparison packet, append-only approval.md, round archives and saved replies (V22-06). |

## Unchanged (byte-identical to the baseline)

| File | SHA-256 |
|---|---|
| SOURCE-EVIDENCE.md | `cca47b06e04bc5f7173480d6ee5878771b978f824a2cd32c2a42c91ab9139639` |
| WORKPLACE-PORT.md | `a8caac784362b2f5177fe349923912336a0b19877a1309a9a43bc41fecd350d7` |
| hooks/session-start-context.md | `a89cfb1f8d578adfe707323980bbb6aeef370a188c47379a7c5a88e77d6682c9` |
| references/instruction-precedence.md | `bc884c35b344d43910650cbb1cd6d59cf95585930a0e707be996aa176ca45686` |
| references/plan-interview.md | `408580048e1fec1c9701b3bca845a6c1d7539cfa8a3b5602fb3dce9e22bbda8c` |
| references/risk-tiers.md | `939e036037de2ab5b8fb5e4f630062bc8cb16a8a53e36d3c3123836bc9ca152a` |
| references/rstack-process.instructions.md | `933cafa56fa178a2de98b7bb0af9aa7de3b526e139010fe197b0bbc31cd4ffe7` |
| references/team-adoption.md | `735afa82bf6c7b4d9232d32b507ae9f65b88b0a287b8176de6b34392e6093844` |
| rules/standing-rules.instructions.md | `6e543e459d2d3d0ebdb41b1fae2f3f3886175cd9039a28ee69b1b453fbdb54b9` |
| skills/estate-sweep/SKILL.md | `2849e7ba69f90b901260ebe7f27900d0adf88800adf04c7023ffe82c30a78217` |
| skills/eval-skill/SKILL.md | `1f523ef398e679a774409b578c5f452d4b906d946cc6f4a58f63b03c667d3eaf` |

## Deleted

None.

## Preservation outside fable-v2.2

Before any edit, every file then present under `rstack-pipeline/` was hashed (105 files). After the last edit each was hashed again.

| Location | Files recorded | Still byte-identical |
|---|---:|---:|
| (rstack-pipeline root) | 6 | 6 |
| agents | 14 | 14 |
| fable-v2 | 25 | 25 |
| pipeline-skill | 2 | 2 |
| references | 26 | 26 |
| rstack-v2.1 | 32 | 32 |

Result: 105 of 105 preserved; none missing or changed.

The repository outside `rstack-pipeline/` was not written to: no file was created, staged, committed, pushed or merged, `.gitignore` and host settings were not touched, and `git status` for the tracked tree was clean before and after. Temporary patch scripts and the recorded hash list live in the session scratch directory, outside the repository.

## How to reproduce the comparison

From `rstack-pipeline/`: hash both trees with any SHA-256 tool and compare, or run a recursive file diff of `rstack-v2.1` against `fable-v2.2`. Line-level findings for each changed operational file are in `FABLE-IMPLEMENTATION-REPORT.md`.
