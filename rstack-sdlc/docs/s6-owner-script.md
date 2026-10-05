# RSTACK SDLC — S6 owner script (live VS Code Copilot run)

**Status: S6 STARTED — LIVE HOST EXECUTION PENDING ACCESS.** `COPILOT_VALIDATED`: NO. Nothing in this file has been observed on a host. Prepared by BUILD-03 from the committed sources at `07de93a49b4ec62ada46f0a55d2430ac208a4b53`; shared records are kept by BUILD-02 in [s6-host-validation.md](s6-host-validation.md). Wording corrected by BUILD-02 on 2026-10-04, on the owner's authorization, to match two owner decisions: the baseline model rule (stages 3 and 4) and what is actually known about reproducibility (stages 0 and 2). No existing command, path, or expected engine reply changed.

**Added 2026-10-04 by BUILD-03 (draft text, nothing run): S6 IN PROGRESS — NEW SINGLE-ENTRY CANDIDATE AWAITING OFFLINE VERIFICATION.** `COPILOT_VALIDATED`: NO. The owner decided that RSTACK has one human entry point in VS Code, the Coordinator, and BUILD-02 built a new package candidate for that. **The new package identity is PENDING INDEPENDENT VERIFICATION until Astra approves it.** Until then:

- The `READY_FOR_S6` verdict covers checkpoint `07de93a` and manifest `1f5eaef8…08fa` only. Every expected identity in stages 0, 1 and 2 is still that one and has not been replaced.
- `C:\rstack-sdlc-smoke\` still holds the old package and has not been rebuilt. It is rebuilt only from the approved package, after the approval.
- Stage P and stage L below, and every paragraph headed "New candidate", describe the new candidate. They cannot be run before the approval and the rebuild. Do not run them against the package now in `C:\rstack-sdlc-smoke\`.

You run this script yourself in VS Code. You do not need any other document while you work.

## How to use this script

- Work through the stages in order. Each stage says what to do, what should happen, what to save, what counts as PASS, what counts as BLOCKED or FAIL, and whether files change.
- Every expected value below is marked **DOC-EXPECTED** (VS Code documentation, never seen on this host) or **OFFLINE** (read from the committed source or seen in offline tests; the engine replies were also rehearsed by BUILD-02 on 2026-10-04 through the package copy's command line, with simulated role results). Neither is host evidence. What you see is recorded as **OWNER-OBSERVED**. What the host does not show stays **UNVERIFIED**; do not guess it.
- A surprise is a result, not a problem to fix. Write down what happened, save the evidence, and follow the stage's BLOCKED/FAIL line. Never edit an installed file, a file under `.rstack/`, a role's `result.json`, or the brief to make a step pass.
- Do not change a model selector, a role's tools, or the profile to get past a step. If a step cannot proceed as installed, stop that path; the decision is yours to take later, outside the run.
- Stop conditions for the whole session: Copilot entitlement unavailable (stage 1); the Coordinator or a role agent not discovered (stage 2); any step that would need Jira, Bitbucket, a real repository, or publishing anything.

### Places

Everything lives under one disposable folder, `C:\rstack-sdlc-smoke\`, which is not a git repository. If that folder does not exist on the machine you are using, do stage 0 first.

| What | Path |
|---|---|
| Workspace: the only folder you open in VS Code | `C:\rstack-sdlc-smoke\workspace` |
| Generated package (never edit) | `C:\rstack-sdlc-smoke\package` |
| Synthetic application (never edit) | `C:\rstack-sdlc-smoke\app` |
| Synthetic request | `C:\rstack-sdlc-smoke\requests\REQ-001.md` |
| Text files you save | `C:\rstack-sdlc-smoke\human\` |
| Evidence you save | `C:\rstack-sdlc-smoke\evidence\` |
| Run records (written by the engine) | `C:\rstack-sdlc-smoke\workspace\.rstack\runs\<run-id>\` |

Package identity (OFFLINE): manifest SHA-256 `1f5eaef83d2309b7daddaec978fe147128d06cbe5b35a4efb8e4f1513e6208fa`, generated from commit `07de93a49b4ec62ada46f0a55d2430ac208a4b53`. The manifest hash is the identity that counts for the host run.

Engine command for your own read-only checks: `node "C:/rstack-sdlc-smoke/package/runtime/scripts/rstack.ts" status --workspace "C:/rstack-sdlc-smoke/workspace" --run <run-id>`

The folder `evidence\` already holds three OFFLINE records made by BUILD-03 on 2026-10-04 (`offline-plan.json`, `offline-install.json`, `offline-verify.json`). Leave them.

### Saving evidence

- **Chat export:** Command Palette → `Chat: Export Chat...` → save as the file name the stage gives, in `C:\rstack-sdlc-smoke\evidence`. (DOC-EXPECTED command name; if it differs, note the real one.)
- **Screenshot:** save as PNG in `C:\rstack-sdlc-smoke\evidence` with the name the stage gives.
- **Notes:** one file, `C:\rstack-sdlc-smoke\evidence\notes.md`. For each stage write the stage number, PASS / FAIL / BLOCKED, and anything that differed from this script.
- **Run records:** the engine writes them itself under `C:\rstack-sdlc-smoke\workspace\.rstack\runs\<run-id>\`. Do not copy or open them for editing during a run; they are collected in stage 8.

### Text files you save (your words never go on a command line)

The Coordinator must not type your free text into a command and must not create these files. You save them, it passes only the path.

To save one: in VS Code, `File → New Text File`, type the text, `File → Save As...`, choose the path given. Check the status bar shows `UTF-8` (not `UTF-8 with BOM`). Do not press Enter after the last word: a final line break becomes part of the recorded text.

| File | When needed | Content |
|---|---|---|
| `C:\rstack-sdlc-smoke\human\recorded-by.txt` | stage 5, last decision | `Ramon Lorente (owner)` |
| `C:\rstack-sdlc-smoke\human\reason-1.txt` | stage 7 | your own reason for abandoning, e.g. `S6 recovery scenario: attempt interrupted on purpose` |
| `C:\rstack-sdlc-smoke\human\reason-2.txt` | stage 7 | your own reason for the second abandon |
| `C:\rstack-sdlc-smoke\human\answer-1.txt` | only if the run asks a product question (stage 4) | your own answer, written after you read the question |
| `C:\rstack-sdlc-smoke\human\not-a-result.txt` | stage 7 | `this is not a result` |

Each time you save one, add a line to `notes.md`: how long it took and whether it was awkward. This is the S6 usability observation for file-based human text.

---

## Stage 0 — Rebuild the disposable folder (only if `C:\rstack-sdlc-smoke\` does not exist on this machine)

Skip this stage when the folder exists. Which machine and which checkout to use is your decision. This stage rebuilds the folder and recomputes the source and package identities on the machine you use. The run proceeds only if they match the expected READY_FOR_S6 identities given in the steps below. A mismatch stops the run and is kept as portability evidence. That a rebuild gives the same bytes on a second machine or a second checkout has not been demonstrated yet; this stage is where it is tested. (Where the prepared folder already exists, its identity is checked in stage 1, step 7 and stage 2, step 1.)

**Changes files:** yes: creates `C:\rstack-sdlc-smoke\` and, if you clone, a repository checkout. Nothing else.

**Do** (PowerShell, Node 24 installed; no `npm install` is needed)

1. Get the sources with line-ending conversion off. New clone:
   `git clone -c core.autocrlf=false https://github.com/Lorenchess/copilot-agentic-workflow.git C:\rstack-src`
   `git -C C:\rstack-src checkout feat/rstack-sdlc-local-build`
   (With an existing checkout, use its path instead of `C:\rstack-src` below and rely on the hash check in step 4.)
2. `git -C C:\rstack-src merge-base --is-ancestor 07de93a49b4ec62ada46f0a55d2430ac208a4b53 HEAD; $LASTEXITCODE` → must print `0`.
3. `git -C C:\rstack-src diff --quiet 07de93a49b4ec62ada46f0a55d2430ac208a4b53 HEAD -- rstack-sdlc/adapters rstack-sdlc/core rstack-sdlc/scripts rstack-sdlc/profiles rstack-sdlc/package.json; $LASTEXITCODE` → must print `0` (nothing the package is built from changed).
4. `cd C:\rstack-src\rstack-sdlc`, then `node scripts/generate-package.ts`, then
   `(Get-FileHash -Algorithm SHA256 "dist\copilot-vscode\rstack-sdlc-manifest.json").Hash.ToLower()` → must print `1f5eaef83d2309b7daddaec978fe147128d06cbe5b35a4efb8e4f1513e6208fa`.
5. Create the folder and copy:
   `New-Item -ItemType Directory C:\rstack-sdlc-smoke, C:\rstack-sdlc-smoke\requests, C:\rstack-sdlc-smoke\workspace, C:\rstack-sdlc-smoke\human, C:\rstack-sdlc-smoke\evidence`
   `Copy-Item -Recurse dist\copilot-vscode C:\rstack-sdlc-smoke\package`
   `Copy-Item -Recurse tests\fixtures\sample-app C:\rstack-sdlc-smoke\app`
   `Copy-Item tests\fixtures\requests\REQ-001.md C:\rstack-sdlc-smoke\requests\`
6. `(Get-FileHash -Algorithm SHA256 "C:\rstack-sdlc-smoke\requests\REQ-001.md").Hash.ToLower()` → `e33cd9b9f7b3670b37a0e6d2373a6640c4c9ffd0c58dda0d97ac3c72ed4f36c3`; the same for `C:\rstack-sdlc-smoke\app\rstack.app.json` → `fe210841a1dc9abe9b5069b60ad3a76da67448e79ae40c8e9e60ecf88923a89e`.
7. Install: run the `plan`, `install ... --apply` and `verify` commands of stage 2, step 2.

**Expect** (OFFLINE): generation prints `"ok": true`; `plan` prints `PLAN_READY` with eight `CREATE`; `install` prints `INSTALLED`; `verify` prints `CLEAN`. The installed files are expected to have the hashes listed in stage 2, because the paths are the same. That is an expectation: it has not been shown on a second machine.

**Save:** the three JSON replies as `C:\rstack-sdlc-smoke\evidence\rebuild-plan.json`, `rebuild-install.json`, `rebuild-verify.json`; a note of the checkout path and its `git rev-parse HEAD`.

**PASS:** steps 2 and 3 print `0`, every hash in steps 4 and 6 equals the expected READY_FOR_S6 value given there, and `verify` is `CLEAN`. Only then go on to stage 1.

**BLOCKED:** step 2 or 3 does not print `0`, or any hash differs → stop. Do not go on to stage 1 and do not open the folder in VS Code. A mismatch is portability evidence: write down which value differed, what was printed, the checkout path, its `git rev-parse HEAD`, and the output of `git -C <checkout> config --get core.autocrlf`, and keep that note. Do not edit, convert, or regenerate anything to make a value match, and do not continue with a different identity.

- One cause is known (OFFLINE, finding S6-P1, classified by the owner as FUTURE_HARDENING / PORTABILITY and not repaired before the baseline run): in a checkout made with line-ending conversion on (`core.autocrlf=true`) the profile file has different bytes, and the package identity changes with it. The fixture files are expected to change the same way; that was not probed.
- If the checkout you used was not a new clone made exactly as in step 1, you may repeat this stage once with such a clone, after removing a partly built `C:\rstack-sdlc-smoke\`. Keep the note of the first mismatch.
- If a clone made exactly as in step 1 still gives a different value, this machine cannot reproduce the approved identity: stop before any host step and report the note to BUILD-02.

---

## Stage 1 — G0 live gate

**Changes files:** no.

**Do**

1. VS Code → `Help → About`. Copy the whole text into `notes.md`.
2. Extensions view → search `@builtin copilot` and `copilot`. Note the name and version of each Copilot / Copilot Chat entry actually listed as enabled.
3. Accounts icon (bottom left). Note whether a GitHub account is signed in (write "signed in" and the account's display name, nothing more).
4. Open the Chat view. Note any banner or message about a plan, subscription, or quota. Send one message in the default mode: `Reply with the single word READY.`
5. In the Chat view note the session target / agent type selector (for example Local) and its current value.
6. In VS Code's integrated terminal (PowerShell) run `node --version`.
7. In the same terminal run `(Get-FileHash -Algorithm SHA256 "C:\rstack-sdlc-smoke\package\rstack-sdlc-manifest.json").Hash.ToLower()`.
8. `File → Open Folder...` → `C:\rstack-sdlc-smoke\workspace` (if not already open). Note whether VS Code shows it as trusted, and whether it is inside a git repository (Source Control view).
9. Note anything VS Code would load from outside `C:\rstack-sdlc-smoke\workspace`: Command Palette → `Chat: Open Chat Customizations` or the gear in the Chat view (DOC-EXPECTED) → list every custom agent, instruction file, prompt and Skill shown that does not start with `rstack-sdlc-`, and where it comes from (user profile, `~/.claude/skills`, an extension).

**Expect**

- Node `v24.x` (OFFLINE: the package requires `>=24.0.0 <25`).
- Package manifest hash `1f5eaef83d2309b7daddaec978fe147128d06cbe5b35a4efb8e4f1513e6208fa` (OFFLINE).
- `C:\rstack-sdlc-smoke\workspace` is not inside any git repository and holds no `.github` content other than what stage 2 installs (OFFLINE).
- The message in step 4 gets an answer (DOC-EXPECTED when entitlement is active). The "subscription has ended" message seen before 2026-10-04 is historical; only what you see today counts.

**Save:** `C:\rstack-sdlc-smoke\evidence\g0-about.png`, `C:\rstack-sdlc-smoke\evidence\g0-chat.png` (Chat view showing step 4's answer or the refusal), `C:\rstack-sdlc-smoke\evidence\g0-terminal.png`, notes for steps 1–9.

**PASS:** step 4 answered; Node 24; package hash matches; workspace outside every repository; inherited items listed (an empty list is a valid result).

**BLOCKED:** step 4 refused for plan, subscription, sign-in or quota → write `COPILOT_VALIDATION_BLOCKED_BY_ENTITLEMENT` in `notes.md`, save `g0-chat.png`, and **stop live S6 here**. Do not continue with any later stage and do not simulate one.
**FAIL:** Node is not 24, or the package hash differs → stop and tell BUILD-02. Do not continue with a different package.

---

## Stage 2 — Installation check and discovery

**Changes files:** normally no: the package was installed offline on 2026-10-04 (or by you in stage 0), and step 1 only reads. Only if step 1 says `NOT_INSTALLED` does step 2 create in `C:\rstack-sdlc-smoke\workspace`: `.github\agents\rstack-sdlc-*.agent.md` (6 files), `.github\skills\rstack-sdlc-planning-records\SKILL.md`, `.github\skills\rstack-sdlc-application-records\SKILL.md`, `.github\rstack-sdlc-install.json`. Nothing else, and nothing outside `C:\rstack-sdlc-smoke\workspace`.

**Do** (integrated terminal; type each command exactly)

1. `node "C:/rstack-sdlc-smoke/package/runtime/scripts/install-package.ts" verify --workspace "C:/rstack-sdlc-smoke/workspace"`
2. Only if step 1 printed `"code": "NOT_INSTALLED"`:
   `node "C:/rstack-sdlc-smoke/package/runtime/scripts/install-package.ts" plan --workspace "C:/rstack-sdlc-smoke/workspace"`, read the plan, then
   `node "C:/rstack-sdlc-smoke/package/runtime/scripts/install-package.ts" install --workspace "C:/rstack-sdlc-smoke/workspace" --apply`, then repeat step 1.
3. Reload the window: Command Palette → `Developer: Reload Window`.
4. Open the Chat view. Open the agent picker (the mode/agent dropdown). Note every entry.
5. Open the diagnostics for chat customizations: right-click in the Chat view → `Diagnostics`, or Command Palette → `Chat: Open Diagnostics` / `Developer: Show Chat Debug View` (DOC-EXPECTED; note the real name). Find the lists of custom agents, Skills, instructions and tools.
6. Select `rstack-sdlc-coordinator` in the agent picker. Open its tools list (tools icon in the chat input). Note the tools shown as enabled.

**Expect**

- Step 1 (after install): `"ok": true, "code": "CLEAN"`, `"package": "PRESENT"`, eight files each `"status": "OK"` (OFFLINE). Plan prints `PLAN_READY` with eight `CREATE` actions; install prints `INSTALLED` (OFFLINE).
- The eight installed files and the install record have these SHA-256 values (OFFLINE, installed by BUILD-03 on 2026-10-04 on the build machine; after a stage 0 rebuild they are expected to be the same because the paths are the same, which has not been shown on a second machine). You only need them if `verify` is not `CLEAN`:

  | File under `workspace\.github\` | SHA-256 |
  |---|---|
  | `agents\rstack-sdlc-coordinator.agent.md` | `1368e55c63ae2fc3fdbc56b2cb73db6d2ab6d080cb34f5542ef3bcd19a4fdddb` |
  | `agents\rstack-sdlc-developer.agent.md` | `7659e4d1d4f8b8fc85337036fe075a6193fbce002812fc47c22f9178d23c3635` |
  | `agents\rstack-sdlc-plan-auditor.agent.md` | `6b966f9df4cdc2fdb405f086efa78bbe1b2768e34096fa7afc58fad29c5a4bfa` |
  | `agents\rstack-sdlc-planner.agent.md` | `252102fde9efb60e5f5775a9082181175033d10bd653401e43a2a5315bf28d9a` |
  | `agents\rstack-sdlc-reviewer.agent.md` | `2653850bfc8a813f761ba8a6a5bc9f546ae27d94e6d8fd8cf28df282663444f9` |
  | `agents\rstack-sdlc-tester.agent.md` | `43f035dd05d8b6f23ae283da2b0efc7889818cd9bc3c24d7dd165fa8a6755053` |
  | `skills\rstack-sdlc-application-records\SKILL.md` | `8617520ccbf744d386d13f84ef90506930e2bb54aac76e759aa0a779faec0f37` |
  | `skills\rstack-sdlc-planning-records\SKILL.md` | `2d050e8ca4e22a0d8ecca6388a024ddbb51a6558cc3946b81fab0a82be2f0d69` |
  | `rstack-sdlc-install.json` | `ac35c33d92f22b138f0e4ea324e482716f96fa0f72a2ed9a5fd67f6ebfcea7e3` |
- Agent picker shows `rstack-sdlc-coordinator`. The five role agents (`rstack-sdlc-planner`, `-plan-auditor`, `-tester`, `-developer`, `-reviewer`) are installed with `user-invocable: false`, so they should be loaded but not offered in the picker (DOC-EXPECTED).
- Diagnostics lists six `rstack-sdlc-` agents and two Skills, `rstack-sdlc-planning-records` and `rstack-sdlc-application-records` (DOC-EXPECTED).
- Coordinator tools: terminal/execute, read, and agent/subagent tools, and no file-editing tool (OFFLINE: the file declares `execute`, `read`, `agent`; whether the host enforces that list is DOC-EXPECTED).

**New candidate (PENDING INDEPENDENT VERIFICATION; applies only after Astra's approval and the rebuild).** The values above stay as they are until then. What will have to change in this stage, read by BUILD-03 on 2026-10-04 from the candidate package on the build machine (OFFLINE; manifest SHA-256 `d5ce0c0cfd6fcffec8a2196ae53a7c5fccc4aac014be6fc39f6b7abffff814f9`, which BUILD-02 reports as 33 files, generator version 3):

- The package manifest hash, the hashes of the six agent files and the two Skill files, and the install record hash will be different. The new values are not listed here: they are written in only from the approved package.
- Coordinator frontmatter (OFFLINE): `target: vscode`; `tools: ['execute', 'read', 'agent']`; `agents:` exactly the five `rstack-sdlc-` role agents; `user-invocable: true`; `disable-model-invocation: true`; no `model:` line.
- Each role agent's frontmatter (OFFLINE): `target: vscode`; its tools as before, without `agent`; `user-invocable: false`; `disable-model-invocation: true`; no `model:` line.
- Both Skills' frontmatter (OFFLINE): `name`, `description`, `user-invocable: false`; no `disable-model-invocation` key.
- Picker and `/` menu (DOC-EXPECTED): among `rstack-sdlc-` entries only the Coordinator is in the agent picker, and neither Skill is offered when you type `/`. Diagnostics should still list six agents and two Skills. These are checked in stage P, part A.

**Save:** `C:\rstack-sdlc-smoke\evidence\i1-verify.txt` (paste the JSON of the last `verify`), `C:\rstack-sdlc-smoke\evidence\d1-picker.png`, `C:\rstack-sdlc-smoke\evidence\d1-diagnostics.png` (or the diagnostics text as `d1-diagnostics.txt`), `C:\rstack-sdlc-smoke\evidence\d1-coordinator-tools.png`.

**PASS:** `CLEAN`; the Coordinator selectable; all five role agents and both Skills listed **in the live diagnostics view**. A file existing on disk is not discovery.

**BLOCKED:** `verify` prints `DRIFT`, or plan/install prints `BLOCKED` or any `ok: false` → stop, save the JSON, tell BUILD-02. Do not delete or edit files to clear it.
**FAIL:** the Coordinator is not in the picker, or a role agent or Skill is missing from diagnostics, or diagnostics reports a frontmatter error for an `rstack-sdlc-` file → save the view and stop before stage 4. If no diagnostics view exists, mark discovery of role agents and Skills UNVERIFIED and continue; stage 4 will show whether dispatch works.

---

## Stage P — Model and visibility probe (new candidate only)

**This whole stage applies to a package identity that is PENDING INDEPENDENT VERIFICATION** (candidate manifest `d5ce0c0c…14f9`). It cannot be run before Astra approves the candidate and BUILD-03 rebuilds `C:\rstack-sdlc-smoke\` from the approved package. Once that is done, it is the first Copilot-specific experiment: after stage 1 and the stage 2 installation check, and before the full workflow (stages 3 to 8). Nothing in it has been observed on a host. **The stage ends at its gate ("Stage P gate" below): for the new candidate the script stops there in every outcome, and stage 4 is not started from here.**

**Changes files:** yes, in two places only. A scratch folder you create, `C:\rstack-sdlc-smoke\probe\` (parts B to E). One run directory written by the engine under `C:\rstack-sdlc-smoke\workspace\.rstack\runs\` (part I, run P). No installed file, nothing under `C:\rstack-sdlc-smoke\package`, and no profile is created or edited. No model selector is written into an installed file or a profile, today or as a result of this stage.

**Intended models (owner decision, unchanged):** Coordinator, tester, developer = Sonnet 5; planner, reviewer = Opus 5.5; plan-auditor = Sol 6.1. No fallback. The exact strings the host accepts for them are HOST_CONFIRMATION_REQUIRED; this stage is where you look them up. It activates nothing.

**Rules for this stage**

- The scratch agents are for parts B to E only. Never start an RSTACK run from them, and never copy an installed `rstack-sdlc-` file into the scratch folder.
- Parts A and B send no chat message. Part I sends exactly one, in the workspace window, to the installed Coordinator. Parts C to E send exactly one, in the probe window, to the scratch lead.
- Order: A, B, I, then C to E. The scratch pair (C to E) and the installed pair (I) answer different questions, and neither result stands in for the other.
- If an unresolved worker model silently runs on the coordinator's model, that is a host limitation and is written down as one. It is never recorded as successful pinning.

### Part A — What a developer sees of RSTACK

**Do** (window open on `C:\rstack-sdlc-smoke\workspace`, session type Local)

1. Open the agent picker. Note every entry whose name starts with `rstack-sdlc-`.
2. Click in the chat input and type `/`. Note whether `rstack-sdlc-planning-records` or `rstack-sdlc-application-records` is offered. Delete the `/`; send nothing.
3. Open the diagnostics view found in stage 2, step 5. Note the `rstack-sdlc-` agents and Skills it lists.

**Expect**

- Picker: `rstack-sdlc-coordinator` is the only `rstack-sdlc-` entry; the five role agents cannot be selected (DOC-EXPECTED; OFFLINE: the files declare `user-invocable: false`).
- `/` menu: neither Skill is offered (DOC-EXPECTED; OFFLINE: both declare `user-invocable: false`).
- Diagnostics: six `rstack-sdlc-` agents and two Skills are still listed as loaded (DOC-EXPECTED).
- Built-in agents, your own agents, and organization agents are outside this check. List them if you wish; no expectation is stated about them.

**Save:** `C:\rstack-sdlc-smoke\evidence\p1-picker.png`, `p1-slash-menu.png`, `p1-diagnostics.png` (or `.txt`).

**PASS:** all three as expected. **FAIL:** a role agent is selectable, a Skill is offered under `/`, or one of the eight is missing from diagnostics → save the view, note it, and stop this stage here (gate, row 1). If no diagnostics view exists, mark that line UNVERIFIED and go on.

### Part B — Which model strings the editor accepts (no chat message)

**Do**

1. Create `C:\rstack-sdlc-smoke\probe\.github\agents\`. Open `C:\rstack-sdlc-smoke\probe` in a **new VS Code window** (`File → New Window`, then `File → Open Folder...`). Leave the workspace window alone.
2. Save three files there, each with this content and its own model line, typed exactly:

   ```text
   ---
   name: probe-sonnet
   description: 'Scratch probe. Not part of RSTACK.'
   model: Claude Sonnet 5 (copilot)
   ---
   Scratch probe. Do nothing.
   ```

   | File | `name:` | `model:` value, exactly |
   |---|---|---|
   | `probe-sonnet.agent.md` | `probe-sonnet` | `Claude Sonnet 5 (copilot)` |
   | `probe-opus.agent.md` | `probe-opus` | `Claude Opus 5.5 (copilot)` |
   | `probe-sol.agent.md` | `probe-sol` | `GPT-6.1 Sol (copilot)` |

3. For each file, open in the editor, record:
   - whether a warning or hint is shown on the `model:` line, and its exact text (an "Unknown model" hint is the one looked for; its wording is UNVERIFIED);
   - what hovering over the model value shows;
   - the exact strings the editor's completion offers for the `model:` key (delete the value, press `Ctrl+Space`, write down or screenshot the list, then restore the value);
   - the exact label of that model in the chat model picker, and any availability, policy, tier or multiplier mark next to it.

**Expect:** nothing is stated in advance about which of the three strings resolve. The form `Model Name (copilot)` is DOC-EXPECTED; the names themselves come from the Copilot service and are UNVERIFIED.

**Save:** `p2-sonnet.png`, `p2-opus.png`, `p2-sol.png` (editor with the model line and any hint), `p2-completion.png`, `p2-model-picker.png`; in `notes.md` a table: *candidate string / hint text or "none" / hover / completion offers it (yes, no, or the nearest string offered) / picker label / marks*.

**Result, per string:** CONFIRMED (no hint, and the completion list or the picker shows the same string), NOT RESOLVED (hint shown, or the string is not offered), or UNVERIFIED (the editor shows nothing either way). If the completion list offers a different string for the same model, write that string down exactly as the candidate for the owner to decide on; do not put it into any file other than a scratch probe file. Nothing here is PASS or FAIL: it is a lookup.

### Part I — The installed Coordinator reaches the installed Planner (one chat message, one dispatch)

This part uses the installed files only, as installed: no scratch agent, no model line, no profile change. The Planner is invoked only by the Coordinator, and only for an attempt the engine has granted. Never invoke `rstack-sdlc-planner` in any other way. The run started here is **run P**: it is kept as evidence and never continued. Run W (stage 4) is a different, fresh run, later.

**Changes files:** yes, only one new run directory under `C:\rstack-sdlc-smoke\workspace\.rstack\runs\`. `C:\rstack-sdlc-smoke\app` is never written.

**Do** (window open on `C:\rstack-sdlc-smoke\workspace`, session type Local)

1. Start a **new chat**. Select `rstack-sdlc-coordinator`. Do not pick a model; note the exact agent name and model label the chat shows.
2. Send exactly:
   `Start a run. Application directory: C:/rstack-sdlc-smoke/app  Request file: C:/rstack-sdlc-smoke/requests/REQ-001.md`
3. Read each terminal command before you allow it. Allow one command at a time; never choose "always allow". Allow only these, in this order: `start`; the **first** `next`; the `submit` of `work/intent-1/result.json`. A `status` command may be allowed at any point (it only reads).
4. **Stopping point.** After the `submit` reply, the Coordinator will ask to run `next` a second time. **Do not allow it: press Stop** (cancel the turn). Send nothing more in this chat.
5. In a second terminal run the engine `status` command from the Places section with the run id. Write the run id in `notes.md` as **run P**.

**Expect** (OFFLINE: the engine replies were rehearsed by BUILD-02 on 2026-10-04 through the candidate package's command line, in a throwaway workspace, with the same request and application and a simulated role result. Everything about the host is DOC-EXPECTED or UNVERIFIED.)

- `start` → `"code": "STARTED"`, a `run_id` starting `RUN-`.
- First `next` → `"code": "DISPATCHED", "dispatch": "GRANTED"`, with `directive.pending.attempt_id` = `intent-1`, `role` = `planner`, `work_dir` = `work/intent-1`.
- The Coordinator then invokes one subagent, named `rstack-sdlc-planner`, and gives it only the `directive.pending` JSON and the run directory path (DOC-EXPECTED that the host runs a hidden agent named in the Coordinator's `agents:` list).
- `submit` → `"code": "ACCEPTED"`.
- `status` in step 5 → stage `spec`, `attempts` = `{"intent":1}`, no pending attempt. Nothing moves until a further `next`, which is not given.
- Two things may differ and are recorded as seen, not corrected. A real Planner may raise a product question, and the run then stands at a human wait instead of stage `spec`; leave it unanswered. If the host runs terminal commands without asking, a second dispatch (`spec-1`) may be granted before you can press Stop; press Stop as soon as you can and note how far it went.

**Keep as evidence**

| What | Where to look | Save as |
|---|---|---|
| Both installed agent names, exactly as the host shows them | the chat's agent selector for the Coordinator; the subagent block for the Planner | `p4-coordinator.png`, `p4-subagent-block.png` |
| The engine-granted attempt | the first `next` reply in the chat or terminal | `p4-next-reply.txt` |
| The envelope unchanged | expand the subagent block; compare its prompt with the `directive.pending` JSON printed just above; note "identical" or what differs | same screenshot, and a line in `notes.md` |
| The invocation itself | the subagent block shows `rstack-sdlc-planner` ran and returned | same screenshot |
| The effective model of the Planner, if shown | subagent block, pill, or hover; if not shown: UNVERIFIED | `p4-model.png` if shown |
| The stop | the chat after you pressed Stop, with no second `next` | `p4-stop.png` |
| The run's state | `status` from step 5 | `p4-status.txt` |
| The whole chat | export | `p4-chat-export.json` |

**Result of the installed-pair item** (write exactly one in `notes.md`)

- **REACHED:** after a `GRANTED` attempt `intent-1`, the host shows that the agent named `rstack-sdlc-planner` was invoked by `rstack-sdlc-coordinator`. Note separately whether the envelope was unchanged and what `submit` replied. A `submit` that replies `"ok": false` is the engine working: record the code, do not abandon or retry, and stop as in step 4.
- **NOT REACHED:** the engine granted the attempt but no subagent named `rstack-sdlc-planner` ran: the Coordinator invoked another agent, did the work itself, or invoked nothing.
- **REFUSED:** the host refused the invocation. Save its exact message. For a model or cost-tier message the Coordinator is expected to report the block `RSTACK MODEL REQUIREMENT NOT AVAILABLE` (OFFLINE: its file says so; UNVERIFIED on the host).
- **NOT EXERCISED:** the engine did not grant the attempt (`start` or `next` replied `"ok": false`). Save the reply.

Only REACHED completes this item. A `PONG` from the scratch pair in parts C to E never completes it, and nothing else in this script does. With any other result, stop here: do not go on to parts C to E. The gate below says what follows.

What you see here is OWNER-OBSERVED for this run. In the shared records the item stays HOST_CONFIRMATION_REQUIRED until the S6 evidence is independently accepted.

### Parts C, D and E — One scratch dispatch (one chat message)

Run this only if part I ended REACHED and part B gave a CONFIRMED string for both Sonnet 5 and Opus 5.5. If a string is missing, write "C–E not exercised: no confirmed string for <model>" and go to the gate below.

**Do** (in the probe window)

1. Save two more files in `C:\rstack-sdlc-smoke\probe\.github\agents\`, with the confirmed strings in place of the two model values:

   `probe-lead.agent.md`
   ```text
   ---
   name: probe-lead
   description: 'Scratch probe lead. Not part of RSTACK.'
   tools: ['agent']
   agents: ['probe-worker']
   model: <confirmed Sonnet 5 string>
   ---
   When asked to run the probe, invoke the agent probe-worker once with the prompt "Answer." Leave the subagent tool's model argument unset. Then repeat the worker's answer and stop. Do nothing else. If the host does not run probe-worker, report the host's message unchanged and stop: no retry, no other agent, no other model.
   ```

   `probe-worker.agent.md`
   ```text
   ---
   name: probe-worker
   description: 'Scratch probe worker. Not part of RSTACK.'
   tools: []
   user-invocable: false
   disable-model-invocation: true
   model: <confirmed Opus 5.5 string>
   ---
   Answer with the single word PONG. Use no tool. Change nothing.
   ```

2. Reload the window. Check the agent picker: `probe-lead` is listed, `probe-worker` is not. Select `probe-lead`. Do not pick a model; note the exact model label the chat shows.
3. Send exactly: `Run the probe.`
4. Expand the subagent block. Look for the model the worker ran on in each place the host may show it: the subagent block or its pill, the Agents window indicator, and the hover on the response.

**Expect**

- C, tier (DOC-EXPECTED): a worker whose model is above the coordinator's cost tier does not run. Whether Opus 5.5 is above Sonnet 5 on this account is UNVERIFIED, so either outcome may appear: the worker answers `PONG`, or the host refuses.
- D, hidden worker (DOC-EXPECTED): a worker with `user-invocable: false` and `disable-model-invocation: true` is still reached because the lead names it in `agents:`. This shows the mechanism for the scratch pair only. Whether the installed Coordinator reaches the installed `rstack-sdlc-planner` is part I's question, and only part I answers it.
- E, effective model: whether the host shows the model a subagent ran on is UNVERIFIED.

**Record in `notes.md`**

| Part | What to write |
|---|---|
| C | the exact result: the worker's answer, or the host's exact message |
| D | worker hidden from the picker (yes/no); worker reached through `agents:` (yes/no) |
| E | the exact model label shown for the worker and where it was shown; whether it equals the worker's declared model, the lead's model, or neither. If nowhere shown: UNVERIFIED |

**Save:** `p3-chat-export.json`, `p3-picker.png`, `p3-subagent-block.png`, and a screenshot of each place that shows a model label.

**What to write for the scratch dispatch** (one of these; what follows from it is in the gate below)

- The worker answered and the host shows it ran on its declared Opus 5.5 model → "pin applied on this host, this account, this scratch pair". OWNER-OBSERVED for the scratch pair only.
- The worker answered but the host shows the lead's model, or another model → "host limitation: worker model not applied", with the labels. Not a successful pin.
- The worker answered and no model is shown → E is UNVERIFIED. The pin is neither confirmed nor refuted, and is not written down as confirmed anywhere.
- The host refused because the worker's model is above the coordinator's tier, or for any model, tier or policy reason → save the exact message. No other model, no change to the role-to-model map, no second attempt.
- The worker was not reached for another reason (for example the host says the agent is unknown or cannot be invoked) → save the exact message.

When the parts are finished, close the probe window. Leave `C:\rstack-sdlc-smoke\probe\` in place as evidence; it is never opened together with the workspace.

### Stage P gate — what happens next (new candidate)

For the new candidate, **the script stops here in every outcome**. Stage 4 is not started from this stage: the unpinned full workflow is not run on the new candidate. This follows the owner's decision D-SE, which for the new candidate replaces the older order (routing by model only after a successful baseline run); that older order belongs to the old candidate.

Find the **first** row that matches, from the top. It gives the one next action. No row authorizes a production pin: a pin is made only by a separate change that you authorize in your own words.

| # | Outcome | The one next action |
|---|---|---|
| 1 | Part A failed (a role agent selectable, a Skill under `/`, or one of the eight missing from diagnostics) | STOP. Give the saved views to BUILD-03, who preserves them and hands them to BUILD-02. Nothing is edited or reinstalled. |
| 2 | Part I did not end REACHED (NOT REACHED, REFUSED, or NOT EXERCISED) | STOP. Progression is blocked whatever the scratch pair did or would do. Give the part I evidence to BUILD-03, who preserves it and hands it to BUILD-02. No retry, no other way of invoking the Planner. |
| 3 | Part B: any of the three strings is NOT RESOLVED or UNVERIFIED | STOP. Report the table from part B to yourself as the model decision to take, outside the run. No string, including a different one the editor offered, goes into a profile. |
| 4 | Parts C to E: the host refused for a tier, model or policy reason | STOP. The model-routing decision returns to you, outside the run. The map is not changed, and no pin is made. |
| 5 | Parts C to E: the scratch worker was not reached for another reason | STOP. Give the exact message to BUILD-03, who preserves it and hands it to BUILD-02. |
| 6 | Parts C to E: the worker answered, but its effective model was not shown, or was not its declared model | STOP. Recorded as UNVERIFIED (not shown) or as a host limitation (another model); never as a confirmed pin. Whether to pin without that confirmation is your decision, outside the run. |
| 7 | Success: A passed; I ended REACHED; all three strings CONFIRMED; the scratch worker answered; the host showed it ran on its declared Opus 5.5 model | STOP and hand the evidence back to BUILD-03 and BUILD-02. The steps after that are in the list below and are not part of this session. |

After row 7, in this order, each step separate and none of them done by this script:

1. You authorize the pinning change in your own words. Without that, nothing is pinned.
2. BUILD-02 makes one bounded change: a production profile with the confirmed selectors, marked as observed. The package is regenerated.
3. A focused independent verification of that package (the exact pins, visibility, determinism, no fallback).
4. BUILD-03 rebuilds `C:\rstack-sdlc-smoke\` from the verified package and replaces the expected identities in stages 0, 1 and 2 of this script.
5. Only then is the full workflow (stages 3 to 8) run, on that package.

Limits of row 7, to be said in the handback: the scratch pair tests Sonnet 5 dispatching Opus 5.5 only. Sonnet 5 dispatching Sol 6.1 is not tested by this stage and stays UNVERIFIED. Row 7 shows a pin applied for one scratch pair on one host and account; it does not show it for the installed role agents.

Stage L below is not part of the full workflow: it starts no run and sends no chat message. It may be done in the same session after this gate, in any outcome, and its notes go into the same handback. It does not lift the stop.

---

## Stage L — Enterprise layout visibility (new candidate only; observation, no redesign)

**Applies to a package identity that is PENDING INDEPENDENT VERIFICATION**, under the same condition as stage P. It can be done at any point after stage P's parts, on either side of the stage P gate's stop, and is independent of stages 3 to 8. It is not the full workflow and does not lift that stop. No run is started and no chat message is sent. The installer commands below were rehearsed once by BUILD-02 on 2026-10-04 (OFFLINE, candidate package on the build machine, a throwaway git-initialized folder of the same shape, not this folder): `PLAN_READY` with eight `CREATE`, `INSTALLED`, `CLEAN`, nine files under the root `.github`, the three subfolders left empty.

**Changes files:** yes, only in a second disposable folder, `C:\rstack-sdlc-smoke\layout\`, which you create. It gets its own local git repository with no remote; nothing is pushed anywhere.

The layout stands for the intended enterprise repository: `.github\agents` and `.github\skills` at the repository root, with the subprojects `service-a`, `service-b` and `frontend` below it.

**Do**

1. `New-Item -ItemType Directory C:\rstack-sdlc-smoke\layout\service-a, C:\rstack-sdlc-smoke\layout\service-b, C:\rstack-sdlc-smoke\layout\frontend`, then `git -C C:\rstack-sdlc-smoke\layout init`.
2. Install once, at the root: the `plan` and `install ... --apply` commands of stage 2, step 2, with `--workspace "C:/rstack-sdlc-smoke/layout"`, then `verify` with the same path.
3. Open `C:\rstack-sdlc-smoke\layout` in a new window. Repeat stage P, part A (picker, `/`, diagnostics).
4. Close it. Open `C:\rstack-sdlc-smoke\layout\service-a` alone in a new window. If VS Code asks whether you trust the parent folder, note the prompt and your answer. Look up the VS Code setting that makes chat customizations from a parent repository apply: `chat.useCustomizationsInParentRepositories` (DOC-EXPECTED id, read by BUILD-02 in the VS Code documentation; if Settings shows another id, note the real one). Note its current value and do not change it yet. Repeat part A.
5. Optional: switch that setting on for this window's workspace only, reload, and repeat part A. Switch it back afterwards.

**Expect**

- Root opened: one visible RSTACK Coordinator, role agents hidden, Skills not under `/` (DOC-EXPECTED).
- The same whichever subproject a run would name as `--app`: `--app` is an argument of the `start` command and no installed file depends on it (as reported by BUILD-02; not exercised here, since no run is started).
- `service-a` opened alone: what appears follows the parent-repository setting, which is documented as off by default (DOC-EXPECTED). With it off, no RSTACK agent is expected in the picker. With it on, one Coordinator is expected, under the documented conditions: the opened folder has no `.git` folder of its own, a parent folder has one, and the parent repository folder is trusted (DOC-EXPECTED). The layout meets the first two; a declined trust prompt would also explain an empty picker.
- A duplicate Coordinator is expected only where a second RSTACK installation is also visible to the same window (DOC-EXPECTED). This script does not create one.

**Save:** `l1-root-picker.png`, `l1-sub-picker-setting-off.png`, `l1-sub-picker-setting-on.png` (if step 5 was done), `l1-verify.txt`; in `notes.md` the setting's exact id and default.

**Result:** observation only. Write what was seen against each expectation. A difference is recorded and reported to BUILD-03; nothing is redesigned or reinstalled to change it.

---

## Stage 3 — Model and profile observation

**Changes files:** no. **Do not** edit any agent file or the profile, and do not add a model selector or a fallback selector anywhere.

**New candidate (PENDING INDEPENDENT VERIFICATION).** The background below stays true for the candidate package: its agent files carry no `model:` line either (OFFLINE). For the new candidate, stages 3 to 8 do not follow stage P directly: the script stops at the stage P gate in every outcome, and the full workflow runs only on a package that was independently verified after that gate (owner decision D-SE). The baseline rule below, with its last sentence that routing by model follows a successful baseline run, was written for the old candidate (D-S6) and does not set the order for the new one. In no case do you pick a model by hand or add a selector during a run; pins come only from a separate change that the owner authorizes. This stage's wording for the pinned package is written when that package is verified. One addition in the candidate's Coordinator file (OFFLINE): a section "On this host" tells it never to choose, pass, substitute or override a role's model, and, if the host does not run the named role agent, not to retry, name another model or agent, omit the agent name, or do the work itself. For a model or cost-tier message it reports a fixed block, `RSTACK MODEL REQUIREMENT NOT AVAILABLE` / `Role: …` / `Required model: …` / `Host result: <the host's message, unchanged>`, says the attempt stays pending, gives the attempt id, and stops. Whether it does so on the host is UNVERIFIED and would first be seen in stage 4.

Background you need (OFFLINE): the installed agent files carry no `model:` line, because no host selector has been observed. Each role file only states the intended model in a note. Intended: Coordinator Sonnet 5; planner Opus 5.5; plan-auditor Sol 6.1; tester Sonnet 5; developer Sonnet 5; reviewer Opus 5.5.

Baseline rule (owner decision, 2026-10-04): this first run uses whatever model the Coordinator chat actually has selected. You observe and record; you do not steer. The intended models above are for comparison only. An intended Opus, Sol or Sonnet model that is missing from the picker is an observation, not a blocker. Only a real refusal by the host blocks a path. The same rule holds for every Coordinator chat in this script, including the new chats in stages 4, 5.2 and 7: do not pick a model; note the exact label the chat shows. Routing roles to specific models is a separate experiment after a successful baseline run.

**Do**

1. With `rstack-sdlc-coordinator` selected, open the model picker. Note every model listed, the exact label of each, any cost multiplier or tier mark, and any model shown as unavailable.
2. Note which model is currently selected: its exact label as the host shows it. Note any effort / reasoning / thinking control shown and its value.
3. Keep that model. Do not choose another one to come closer to an intended model. For each intended model (Sonnet 5, Opus 5.5, Sol 6.1) note whether it is listed, missing, or shown as unavailable.
4. Leave the role agents alone: they cannot be selected (stage 2), so their model can only be observed during dispatch in stage 4. There, record the effective model of each role's subagent wherever the host shows it.

**Expect**

- A subagent without a `model:` line runs on the model of the chat that invoked it (DOC-EXPECTED). If so, every role will run on the Coordinator's model, not on its intended one. That is an observation to record, not something to correct today.
- The picker may not list one or more of the intended models, and the selected model may be none of them. Either is recorded, and the run continues on the selected model.
- Whether the host shows the effective model, effort level, or tier for a subagent is unknown (UNVERIFIED until you see it).

**Save:** `C:\rstack-sdlc-smoke\evidence\m1-model-picker.png`; notes: the exact label of the model selected in the Coordinator chat, then one line per role with *selectable model / effective model if shown (filled in stage 4) / effort if shown / tier restriction / dispatchable by the Coordinator (filled in stage 4) / explicit setting ignored, rejected or applied (write "none set")*.

**PASS:** the selected model was kept and its exact label recorded; the table is filled with what was seen, and UNVERIFIED where nothing was shown. A missing intended model does not prevent PASS.

**BLOCKED:** only a real refusal by the host: it will not run the Coordinator chat on the selected model for a tier, policy or entitlement reason (for example, the selected model is shown as unavailable to this account) → save the exact message or mark, and stop that path. A refusal to dispatch a role appears in stage 4 and blocks there. No fallback is chosen, no selector is added, and the profile is not changed in this session; what to do next is your decision, outside the run.

---

## Stage 4 — Real role dispatch (run W, request to audit)

**New candidate (PENDING INDEPENDENT VERIFICATION): gate.** Do not start this stage on the new candidate from stage P. It may be started only when all of these hold: stage P ended at row 7 of its gate; the owner authorized the pinning change; the regenerated package was independently verified; `C:\rstack-sdlc-smoke\` was rebuilt from it; and stages 0, 1 and 2 of this script carry that package's identities. If any of these is missing, stop. Run P from stage P, part I is never continued here: run W is a fresh run.

**Changes files:** yes, only under `C:\rstack-sdlc-smoke\workspace\.rstack\runs\<run-id>\` (written by the engine and by role agents in `work\<attempt-id>\`). `C:\rstack-sdlc-smoke\app` is never written.

**Do**

1. Start a **new chat**. Select `rstack-sdlc-coordinator`. Do not pick a model: note the exact label the new chat shows. It is expected to be the one recorded in stage 3; if it is another, that is an observation, and the run uses what the chat shows.
2. Send exactly:
   `Start a run. Application directory: C:/rstack-sdlc-smoke/app  Request file: C:/rstack-sdlc-smoke/requests/REQ-001.md`
3. When the host asks to allow a terminal command, read the command, then allow it. Allow one command at a time; do not choose "always allow".
4. Watch the chat until the Coordinator stops and tells you a decision is awaited (or a product question, see below). Do not type anything in between.
5. Open a second terminal and run the engine `status` command from the Places section with the run id (this only reads).

**If the Coordinator stops with a product question** (`awaiting: PRODUCT_QUESTION`): open the file it names, read the question, save your own answer as `C:\rstack-sdlc-smoke\human\answer-1.txt`, and reply: `My decision is: answer. Decision id S6-W-A1. Recorded by Ramon Lorente. Answer file: C:\rstack-sdlc-smoke\human\answer-1.txt`. Then keep watching. Note that this happened.

**Expect** (OFFLINE unless marked)

- First command: `... start --workspace "C:/rstack-sdlc-smoke/workspace" --profile "C:/rstack-sdlc-smoke/package/runtime/profiles/trial-v1.json" --app "C:/rstack-sdlc-smoke/app" --request "C:/rstack-sdlc-smoke/requests/REQ-001.md"`, reply `"code": "STARTED"` with a `run_id` starting `RUN-`. Write the run id in `notes.md` as **run W**. The `status` reply in step 5 should show under `subjects`: `source` = `sha256:e33cd9b9f7b3670b37a0e6d2373a6640c4c9ffd0c58dda0d97ac3c72ed4f36c3` and `base` = `sha256:3685b56aa9f121166bbff92c3454171acbd69ce10a9852b3721e0a807c3c4fbe` (OFFLINE, computed by BUILD-02 from the same request and application). A different value means the request or the application is not the prepared one: stop and report.
- Then a loop of `next` → `"code": "DISPATCHED", "dispatch": "GRANTED"` → one subagent → `submit --file "<run dir>/work/<attempt>/result.json"` → `"code": "ACCEPTED"`. Attempts in order: `intent-1`, `spec-1`, `plan-1` (role `planner`), `plan-audit-1` (role `plan-auditor`). Then `next` → `"code": "BRIEF_READY"` whose directive is already `"kind": "WAIT"`, and the Coordinator stops (a further `next` would only answer `NO_WORK` with the same wait).
- Each subagent is named `rstack-sdlc-<role>` and receives only the `directive.pending` JSON and the run directory path: no summary of earlier steps, no opinion, no model choice.
- The Coordinator does not edit, summarize or repair `result.json`, and has no tool to do so.
- A fresh subagent context per dispatch, and Skill loading by the role, are DOC-EXPECTED.

**Check for each of the four dispatches and write one line each in `notes.md`**

| Question | Where to look |
|---|---|
| Correct role agent invoked? | the subagent block in the chat shows the agent name |
| Envelope passed unchanged, nothing added? | expand the subagent block; compare its prompt with the `directive.pending` JSON printed just above |
| Fresh context? Earlier conversation visible to the role? | subagent block; if not shown, UNVERIFIED |
| Skill discovered and read? | subagent block shows a read of `rstack-sdlc-...-records` SKILL.md; if not shown, UNVERIFIED |
| Effective model and effort of this role's subagent (exact label)? Same as the Coordinator chat's model? | subagent block or diagnostics; if not shown, UNVERIFIED |
| `result.json` submitted as written? | the `submit` command names the file inside `work\<attempt-id>\`; no edit or rewrite step appears between the role's return and `submit` |
| Engine accepted or refused? | the `submit` reply: `"ok": true, "code": "ACCEPTED"` or the refusal code |

**Save:** `C:\rstack-sdlc-smoke\evidence\r1-chat-export.json` (export now, before stage 5), `C:\rstack-sdlc-smoke\evidence\r1-status.txt` (the `status` JSON from step 5), screenshots `r1-dispatch-<attempt-id>.png` of each expanded subagent block.

**PASS:** four results `ACCEPTED`, each by the named role, each submitted from its own `work\<attempt-id>\result.json`, and the Coordinator stopped at the wait without being told to.

**FAIL / BLOCKED**

- The Coordinator invokes a different agent, does the role's work itself, or does not invoke a subagent although the host refused nothing → FAIL; export the chat and stop.
- A `submit` replies `"ok": false` (for example `CONTRACT_VIOLATION`, `MALFORMED_RESULT`) → this is the engine working. The Coordinator should run `status` once, tell you the code and the attempt id, offer "abandon attempt <id> and retry", and stop. Record it. You may then save `C:\rstack-sdlc-smoke\human\reason-1.txt` and reply `Abandon attempt <id> and retry. Reason file: C:\rstack-sdlc-smoke\human\reason-1.txt` **once** per stage. A second refusal at the same stage ends the run (`ATTEMPTS_EXHAUSTED`): record it as the result for run W and go to stage 7.
- The host itself refuses the dispatch, for a tier, policy or entitlement reason or because it does not support that dispatch → BLOCKED for that path; save the exact message and stop. No fallback, no selector, no profile change. A role that runs on a model other than its intended one is not a refusal: record the model and continue.
- The Coordinator rewrites a result, retries on its own, or abandons without your words → FAIL; export the chat.

---

## Stage 5 — Human checkpoint (run W, plan decision)

**Changes files:** yes, only run W's records. **Do not** open `brief\round-N.html` in an editor or save over it; open it in a browser only. A decision is refused (`DISPLAYED_SUBJECT_CHANGED`) if that file changes.

Use the **same chat** as stage 4. In every reply below, the version is the `expected_version` the Coordinator last told you; never reuse an older one.

**5.1 The wait itself.** Do nothing yet. Read what the Coordinator said.

- Expect (OFFLINE): it names what is awaited (`PLAN_DECISION`), the file `brief/round-1.html` inside the run directory, the allowed actions `proceed, amend, second-audit, pause, reject`, and an expected version. It then ended its turn. This holds even if the audit verdict is `HOLDS`.
- Open `C:\rstack-sdlc-smoke\workspace\.rstack\runs\<run-id>\brief\round-1.html` in a browser. Expect the headings **Decision needed**, **Intent**, **Specification** with the criteria and **Exclusions**, **Plan** with **Material claims**, **Audit** (Findings, Coverage, Limitations), **Identities shown**; the same decision version and the same allowed actions as the Coordinator stated.
- Save `C:\rstack-sdlc-smoke\evidence\h1-wait.png` (chat) and `C:\rstack-sdlc-smoke\evidence\h1-brief-round-1.png` (browser).
- PASS: the Coordinator waited; brief, actions and version agree. FAIL: it recorded a decision or dispatched anything without your words.

**5.2 Pause, close, reopen, resume.** Reply: `My decision is: pause. Decision id S6-W-D1. Recorded by Ramon Lorente.`

- Expect: one `decide ... --action pause --expected-version <n> --decision-id S6-W-D1 --recorded-by "Ramon Lorente" --provenance HUMAN_RECORDED` → `"code": "DECISION_RECORDED"`; the directive is still `WAIT` with `"paused": true` and a version one higher. The Coordinator stops.
- Export the chat as `C:\rstack-sdlc-smoke\evidence\h1-chat-export-before-close.json`. Close VS Code completely. Reopen it, open `C:\rstack-sdlc-smoke\workspace`, start a **new chat** with `rstack-sdlc-coordinator`, and send: `Resume run <run-id>.`
- Expect: `resume` → `"code": "RESUMED"`, same run id, directive `WAIT` with the same actions and the version the pause produced; nothing dispatched. The directive still says `"paused": true` after `resume`: that is expected and is not a failure (the pause ends when you record your next decision); the Coordinator tells you the wait again and stops.
- PASS: same run, no new attempt, the new version shown. FAIL: a new run was started, or anything was dispatched.

**5.3 Second audit, only on request.** Reply: `My decision is: second-audit. Decision id S6-W-D2. Recorded by Ramon Lorente.`

- Expect: `DECISION_RECORDED`, then `next` dispatches `plan-revision-1` (planner), then `plan-audit-2` (plan-auditor), then `BRIEF_READY`, then a `WAIT` for round 2. Allowed actions are now `proceed, amend, pause, reject`: no `second-audit`. The file to read is `brief/round-2.html`, with an **Earlier round** section.
- Check in the `plan-audit-2` subagent block that the auditor was not given the first audit or the planner's dispositions (OFFLINE: the envelope's `inputs` are `source, intent, spec, plan` only).
- Save `C:\rstack-sdlc-smoke\evidence\h1-brief-round-2.png`.
- PASS: second audit ran only because you asked; the Coordinator stopped again. FAIL: a second audit ran before you asked, or a third started.

**5.4 No third audit.** Reply: `My decision is: second-audit. Decision id S6-W-D3. Recorded by Ramon Lorente.`

- Expect one of two acceptable outcomes: the Coordinator says the action is not allowed and asks you to choose (no command run); or it runs `decide` and the engine replies `"ok": false, "code": "ACTION_NOT_ALLOWED"` with the allowed list, and the Coordinator reports it and stops. Note which.
- FAIL: an audit is dispatched, or the Coordinator picks another action for you.

**5.5 Decision with a label that must come from a file.** Save `C:\rstack-sdlc-smoke\human\recorded-by.txt` as described at the top. Reply: `My decision is: proceed. Decision id S6-W-D4. Who said it is in the file C:\rstack-sdlc-smoke\human\recorded-by.txt (it contains brackets, so it cannot go inline).`

- Expect: `decide ... --action proceed --expected-version <n> --decision-id S6-W-D4 --recorded-by-file "C:\rstack-sdlc-smoke\human\recorded-by.txt" --provenance HUMAN_RECORDED` → `"code": "DECISION_RECORDED"`. The Coordinator did not create, edit or retype the file. It then continues with `next` (stage 6 begins by itself).
- If instead it types the label inline, the engine replies `"code": "INLINE_TEXT_REFUSED"`; the Coordinator should report it and ask for a file. Record exactly what happened; both the mistake and the refusal are findings.
- PASS: decision recorded with provenance `HUMAN_RECORDED`, label from the file, your text never on a command line. FAIL: the Coordinator invents a decision, changes your label, or writes a file for you.

**Save for the stage:** `C:\rstack-sdlc-smoke\evidence\h1-chat-export.json` (export at the end of stage 6, since the chat continues), the screenshots named above, usability notes on the text file.

---

## Stage 6 — Complete synthetic workflow (run W, proof to local proposal)

**Changes files:** yes, only run W's records. Nothing is published anywhere.

**Important (OFFLINE):** from the moment the proof is accepted until the proposal is written, keep VS Code open and use the same chat and terminal. The engine verifies the candidate only in the environment the proof ran in; `PATH`, `TEMP` and the Node version are part of that identity. A restart that changes them stops the run with `PROOF_ENVIRONMENT_CHANGED`.

**Do:** nothing. Watch, and allow each terminal command after reading it.

**Expect** (OFFLINE)

1. `DISPATCHED` `proof-1` → `rstack-sdlc-tester` → `submit` → `ACCEPTED`. On acceptance the engine itself runs the application's tests in its own directory; a proof that does not fail for the right reason is refused with `PROOF_SETUP_FAILURE`, `PROOF_NOT_DISCRIMINATING` or `PROOF_BASELINE_UNHEALTHY`.
2. `DISPATCHED` `implement-1` → `rstack-sdlc-developer` → `ACCEPTED`.
3. `next` → `VERIFICATION_PASSED` (the engine ran the tests; no agent involved). `VERIFICATION_FAILED` sends the run back to the developer once (`implement-2`); a second failure blocks the run with `VERIFICATION_FAILED`.
4. `DISPATCHED` `review-1` → `rstack-sdlc-reviewer` → `ACCEPTED`. The reviewer must be given only the envelope; the Coordinator must not tell it what the developer did.
5. `next` → `PROPOSAL_READY` with `directive.kind: "DONE"`, `"terminal": "PR_PROPOSAL_READY"`, `"publication_status": "NOT_ATTEMPTED"`, `"candidate_verification": "PASSED_LOCAL_EXECUTION"`, `"evidence_class": "MANUAL_TRANSPORT"`, and `authorization` naming `S6-W-D4` with `HUMAN_RECORDED`.
6. The Coordinator reports that a local proposal file exists and that nothing was published, and stops. The file is `C:\rstack-sdlc-smoke\workspace\.rstack\runs\<run-id>\proposal\pr-proposal.json`.

For `proof-1`, `implement-1` and `review-1` write the same per-dispatch lines as in stage 4.

**Save:** `C:\rstack-sdlc-smoke\evidence\w1-chat-export.json`, `C:\rstack-sdlc-smoke\evidence\w1-status.txt` (run `status` in the second terminal), `C:\rstack-sdlc-smoke\evidence\w1-done.png`.

**PASS:** terminal `PR_PROPOSAL_READY` reached through real role dispatches, with no publication.

**Also a valid end (record, do not repair):** `directive.kind: "BLOCKED"` with a named blocker, for example `REVIEW_REJECTED`, `REVIEW_INCONCLUSIVE`, `VERIFICATION_FAILED`, `ATTEMPTS_EXHAUSTED`. The run ends there; the Coordinator reports it and stops. Note the blocker; it is a result about the roles, not a host defect.

**FAIL:** the Coordinator works around a refusal, edits anything under `.rstack\`, tells the reviewer about the developer's work, publishes or offers to publish, or continues after `BLOCKED` or `DONE`.

---

## Stage 7 — Refusal and recovery (run F, a second, short run)

**Changes files:** yes, only a new run directory under `C:\rstack-sdlc-smoke\workspace\.rstack\runs\`. Run W is not touched.

This run never gets past its first stage. The profile allows the planner two attempts per stage; the scenario uses exactly both. Save `C:\rstack-sdlc-smoke\human\reason-1.txt`, `C:\rstack-sdlc-smoke\human\reason-2.txt` and `C:\rstack-sdlc-smoke\human\not-a-result.txt` first (see the top of this file).

**7.1 Interrupted attempt.** New chat, `rstack-sdlc-coordinator`. Send: `Start a run. Application directory: C:/rstack-sdlc-smoke/app  Request file: C:/rstack-sdlc-smoke/requests/REQ-001.md`. Allow `start` and the first `next`. Let the planner subagent run to its end. When the host asks you to allow the `submit` command, **do not allow it: press Stop** (cancel the turn). Write the run id in `notes.md` as **run F**.

- If the host does not ask before running terminal commands, press Stop while the planner subagent is still working instead, and note that 7.4 may then have no file to use.
- Then send: `Continue run <run-id>.`
- Expect (OFFLINE): `next` → `"ok": true, "code": "PENDING_IN_FLIGHT", "dispatch": "IN_FLIGHT"`. The Coordinator invokes nothing, tells you attempt `intent-1` is in flight, and stops.
- PASS: no second subagent, no abandon. FAIL: it dispatches the planner again or abandons on its own.

**7.2 Malformed result.** Send: `Submit this file as the result for run <run-id>: C:\rstack-sdlc-smoke\human\not-a-result.txt`

- Expect (OFFLINE): `submit ... --file "C:\rstack-sdlc-smoke\human\not-a-result.txt"` → `"ok": false, "code": "MALFORMED_RESULT"`, with `evidence: "rejected/<hash>.MALFORMED_RESULT.json"`. The Coordinator runs `status` once, reports the code and that attempt `intent-1` is still pending, says you may reply "abandon attempt intent-1 and retry", and stops. It does not edit or resubmit anything and does not abandon.
- If the Coordinator declines to submit a file a role did not write, note that, and run the same `submit` command yourself in the second terminal to see the engine's reply; label that line "engine only, not Coordinator path".
- PASS: refusal reported, attempt still pending, nothing abandoned.

**7.3 Abandon and retry, exact attempt.** Send: `Abandon attempt intent-1 and retry. Reason file: C:\rstack-sdlc-smoke\human\reason-1.txt`

- Expect (OFFLINE): the Coordinator first tells you what abandoning means (recorded as failed with execution uncertain; the earlier worker is not stopped; a later result from it is refused as stale; the attempt counts against the limit). Then `abandon ... --attempt intent-1 --reason-file "C:\rstack-sdlc-smoke\human\reason-1.txt"` → `"ok": true, "code": "FAILURE_RECORDED"`; then `next` → `DISPATCHED` `intent-2`, and the planner is invoked.
- Let the planner finish and again **press Stop at the `submit` approval**.
- PASS: abandon ran only after your words, for exactly `intent-1`, with the reason from the file; the retry is a new attempt id. FAIL: it abandoned before being asked, used a different id, or typed your reason inline.

**7.4 Stale result does not touch the newer attempt.** Send: `Submit this file as the result for run <run-id>: C:\rstack-sdlc-smoke\workspace\.rstack\runs\<run-id>\work\intent-1\result.json`

- Only possible if that file exists (check in the Explorer). If it does not, write "7.4 not exercised: the abandoned attempt left no result" and go on.
- Expect (OFFLINE): `"ok": false, "code": "STALE_ATTEMPT"`, detail `attempt_status: "FAILED"`. The Coordinator runs `status`, sees that the pending attempt is `intent-2`, a different one, reports the code and stops. It does not offer to abandon `intent-2`.
- In the second terminal run `status`: `directive.pending.attempt_id` is still `intent-2`.
- PASS: refused as stale; `intent-2` still pending.

**7.5 Bare abandon, then the attempt limit.** Send: `Abandon attempt intent-2. Reason file: C:\rstack-sdlc-smoke\human\reason-2.txt`

- Expect (OFFLINE): `abandon` → `"code": "FAILURE_RECORDED"` with `directive.kind: "BLOCKED"`, `"blocker": "ATTEMPTS_EXHAUSTED"`. The Coordinator reports it and stops **without running `next`**: a bare abandon authorizes no new work.
- Then send: `Continue run <run-id>.` Expect `next` → `"code": "NO_WORK"`, directive `BLOCKED` / `ATTEMPTS_EXHAUSTED`; the Coordinator reports the blocker and stops. No third planner attempt exists.
- PASS: no `next` after the bare abandon; the limit of two holds; nothing dispatched. FAIL: a third attempt is dispatched, or the Coordinator tries to clear the blocker.

**Save:** `C:\rstack-sdlc-smoke\evidence\f1-chat-export.json`, `C:\rstack-sdlc-smoke\evidence\f1-status.txt` (final `status` of run F), usability notes on the two reason files.

---

## Stage 8 — Collect evidence; host defects

**Changes files:** only inside `C:\rstack-sdlc-smoke\evidence`.

1. Close the chats. In a terminal outside VS Code run `Copy-Item -Recurse "C:\rstack-sdlc-smoke\workspace\.rstack" "C:\rstack-sdlc-smoke\evidence\rstack-records"` and `Copy-Item -Recurse "C:\rstack-sdlc-smoke\workspace\.github" "C:\rstack-sdlc-smoke\evidence\installed"`.
2. Run `node "C:/rstack-sdlc-smoke/package/runtime/scripts/install-package.ts" verify --workspace "C:/rstack-sdlc-smoke/workspace"` once more and save the JSON as `C:\rstack-sdlc-smoke\evidence\i1-verify-after.txt`. Expect `CLEAN` (OFFLINE): nothing in the run should have changed an installed file.
3. Re-read stage 1 items 1 and 2 (VS Code and Copilot versions) and note whether they changed during the session.
4. Finish `notes.md`: one line per stage with PASS / FAIL / BLOCKED / NOT RUN, and the usability observations.
5. Tell BUILD-03 or BUILD-02 that `C:\rstack-sdlc-smoke\evidence` is ready. Leave `C:\rstack-sdlc-smoke\workspace` as it is; do not uninstall.

**If something looks like a defect of the package or the host** (not just a role producing a weak answer): stop that stage. Do not fix, edit or retry differently. Save the chat export, a screenshot, the exact command and reply, and the `status` JSON, and write in `notes.md` what you did immediately before. BUILD-03 preserves the reproduction and hands it to BUILD-02; shared source is changed only by BUILD-02, and only the affected stage is repeated afterwards.

## What this session can and cannot establish

- A completed script gives OWNER-OBSERVED evidence for one host version, one account, one model selection. It does not by itself make the package `COPILOT_VALIDATED`; that word is used only after an independent acceptance of the evidence.
- Stays UNVERIFIED unless the host shows it: the effective model and effort of a subagent, whether a subagent's context is really fresh, and whether a role's tools are confined to its attempt directory (OFFLINE: they are not known to be).
- Not exercised by this script: `amend`, `reject`, a product question unless the run raises one, Jira, Bitbucket, publication.
- Stages P and L, when they can be run, give observations for one host version and one account. Only stage P, part I shows whether the installed Coordinator reaches the installed Planner, and it shows it for that one role and one dispatch; the other four role agents are first reached in the full workflow. A scratch pair that shows a pinned worker model does not show it for the installed role agents, which carry no `model:` line. A worker that silently runs on the coordinator's model is a host limitation, never a successful pin.
- Not established before this run: that the package and the folder rebuild to the same bytes on another machine or checkout. A stage 0 that passes on a second machine shows it for that machine and checkout only. The known line-ending cause (finding S6-P1) is classified FUTURE_HARDENING / PORTABILITY and is not repaired before the baseline run.
