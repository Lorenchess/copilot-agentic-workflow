# RSTACK SDLC — S6 owner script (live VS Code Copilot run)

**Status: S6 STARTED — LIVE HOST EXECUTION PENDING ACCESS.** `COPILOT_VALIDATED`: NO. Nothing in this file has been observed on a host. Prepared by BUILD-03 from the committed sources at `07de93a49b4ec62ada46f0a55d2430ac208a4b53`; shared records are kept by BUILD-02 in [s6-host-validation.md](s6-host-validation.md). Wording corrected by BUILD-02 on 2026-10-04, on the owner's authorization, to match two owner decisions: the baseline model rule (stages 3 and 4) and what is actually known about reproducibility (stages 0 and 2). No existing command, path, or expected engine reply changed.

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

**Save:** `C:\rstack-sdlc-smoke\evidence\i1-verify.txt` (paste the JSON of the last `verify`), `C:\rstack-sdlc-smoke\evidence\d1-picker.png`, `C:\rstack-sdlc-smoke\evidence\d1-diagnostics.png` (or the diagnostics text as `d1-diagnostics.txt`), `C:\rstack-sdlc-smoke\evidence\d1-coordinator-tools.png`.

**PASS:** `CLEAN`; the Coordinator selectable; all five role agents and both Skills listed **in the live diagnostics view**. A file existing on disk is not discovery.

**BLOCKED:** `verify` prints `DRIFT`, or plan/install prints `BLOCKED` or any `ok: false` → stop, save the JSON, tell BUILD-02. Do not delete or edit files to clear it.
**FAIL:** the Coordinator is not in the picker, or a role agent or Skill is missing from diagnostics, or diagnostics reports a frontmatter error for an `rstack-sdlc-` file → save the view and stop before stage 4. If no diagnostics view exists, mark discovery of role agents and Skills UNVERIFIED and continue; stage 4 will show whether dispatch works.

---

## Stage 3 — Model and profile observation

**Changes files:** no. **Do not** edit any agent file or the profile, and do not add a model selector or a fallback selector anywhere.

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
- Not established before this run: that the package and the folder rebuild to the same bytes on another machine or checkout. A stage 0 that passes on a second machine shows it for that machine and checkout only. The known line-ending cause (finding S6-P1) is classified FUTURE_HARDENING / PORTABILITY and is not repaired before the baseline run.
