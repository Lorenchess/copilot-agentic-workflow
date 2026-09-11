---
name: pipeline
description: Entry point for the reference pipeline. Parses one or more comma-separated Jira keys, validates them, and hands off to the pipeline orchestrator agent to run FLOW.md stage 0 onward.
argument-hint: "KEY-1[, KEY-2, ...]"
user-invocable: true
disable-model-invocation: true
---

# `/pipeline` — entry skill

This is the `/pipeline KEY-1[, KEY-2, ...]` entry point. It defines how the raw argument text is parsed into a validated, ordered key list before the `pipeline` orchestrator agent (`.github/agents/pipeline.agent.md`) begins `FLOW.md` stage 0. It does not repeat the gate wording or the conditional STOP catalogue — those are normative in `FLOW.md` and `pipeline.agent.md`; this skill covers parsing and resume only.

## Role check

This skill only does anything inside the `pipeline` custom agent. If the currently active agent is not `pipeline`, tell the developer to select the **pipeline** agent (and **Sonnet-5** in the model picker) and stop — do nothing else: do not parse, do not read `.pipeline/runs/`, do not invoke any subagent.

Also remind the developer, before proceeding, that the reference implementation assumes:
- Session target **Local** (not Agent Host or Cloud).
- Permission mode **Manual** (no global auto-approve setting active).

These are prerequisites recorded in the repository README, not something this skill can verify from inside a chat turn — state them as a reminder, then continue.

## Parsing rules

Applied to the raw text typed after `/pipeline`, in this order (archived contract §7.1):

1. Split the argument text on commas.
2. Trim leading and trailing whitespace from each resulting token.
3. Keep the tokens in their original order — **never sort, deduplicate-and-reorder, or alphabetize**.
4. A token is a **valid key** only if it matches `^[A-Z][A-Z0-9_]*-[0-9]+$` (uppercase project key, then a hyphen, then a numeric part).
5. If any token does not match that shape, STOP `INVALID_KEY`, naming the offending token, using the message shape from `FLOW.md`:
   ```text
   STOP [INVALID_KEY]: A comma-separated token does not match a valid Jira key shape.
   Decision needed from: developer.
   Re-run with corrected keys.
   ```
   Do not invoke any stage agent when this STOP fires.
6. An **empty argument list** (nothing typed, or the text trims to nothing) is treated exactly like an invalid token: STOP `INVALID_KEY`.
7. **Duplicates**: if the same key appears more than once after trimming, keep only the first occurrence, in its original position, and add a warning to RUN.md noting the duplicate and which occurrence was dropped.
8. **Primary rule**: the first valid key in the (deduplicated, trimmed) list is the primary Jira, no matter its lexical or numeric relationship to the other keys. It is never reordered — not to sort ticket numbers, not to put "the biggest scope" first, not for any reason.

## Examples

| Input | Outcome |
|---|---|
| `PAYMENTS-12345` | Valid. Single key; primary = `PAYMENTS-12345`. |
| `PAYMENTS-12345, PAYMENTS-12351` | Valid. Primary = `PAYMENTS-12345` (first given); secondary = `PAYMENTS-12351`; order preserved. |
| ` PAYMENTS-12345 ,PAYMENTS-12351 ` | Valid — whitespace around each token is trimmed before validation; same result as the row above. |
| `PAYMENTS-12345, PAYMENTS-12345` | Valid — duplicate token; first occurrence kept, second dropped; RUN.md records a duplicate-key warning. |
| `PAYMENTS-12351, PAYMENTS-12345` | Valid — **primary rule**: primary = `PAYMENTS-12351` because it was given first. `PAYMENTS-12345` is the secondary requested key. The list is never reordered, even though `12345` is numerically smaller. |
| `payments-12345` | Invalid. STOP `INVALID_KEY` naming `payments-12345` — lowercase does not match `^[A-Z][A-Z0-9_]*-[0-9]+$`. |
| `PAYMENTS-12345, 12351` | Invalid. STOP `INVALID_KEY` naming `12351` — no project-key prefix before the hyphen. |
| `PAYMENTS12345` | Invalid. STOP `INVALID_KEY` naming `PAYMENTS12345` — no hyphen separating the project key from the numeric part. |
| *(empty)* | Invalid. STOP `INVALID_KEY` — an empty argument list is treated the same as an invalid token. |

## Resume by artifact

There is no separate run-state machine (`FLOW.md`, "Resume by artifact"). Resumability comes entirely from which of the twelve artifacts already exist on disk under `.pipeline/runs/<PRIMARY>/`, in this stage order:

1. RUN.md (stage 0, pipeline)
2. INTAKE.md (stage 1, intake)
3. WORKSPACE.md (stage 2 prepare, workspace)
4. PLAN.md (stage 3, planner)
5. ADVERSARY-REVIEW.md (stage 4, adversary)
6. TEST-CONTRACT.md and RED-REPORT.md (stage 5, tester)
7. TEST-REVIEW.md (stage 5b, adversary)
8. IMPLEMENTATION.md (stage 6, developer)
9. VERIFICATION.md (stage 7, verifier)
10. PR-DESCRIPTION.md (stage 8, pr)
11. WORKSPACE.md Publish section (stage 9, workspace)
12. PR.md (stage 10, pr)

After parsing succeeds, check whether `.pipeline/runs/<PRIMARY>/` already holds artifacts:

- **If it does**, STOP `RUN_EXISTS`:
  ```text
  STOP [RUN_EXISTS]: .pipeline/runs/<PRIMARY>/ already has artifacts.
  Decision needed from: developer.
  Choose where to resume, or start over.
  ```
  Read RUN.md. Before proposing a resume point, the requested key list must equal RUN.md's Keys, otherwise STOP `RUN_KEYS_MISMATCH`:
  ```text
  STOP [RUN_KEYS_MISMATCH]: The requested Jira keys differ from the keys recorded in RUN.md for this run.
  Decision needed from: developer.
  Re-run with the recorded keys, or start a new run with a different primary.
  ```
  Otherwise, list which of the twelve artifacts above are present, missing, incomplete, or recorded as failed. Propose resuming at the earlier of (a) the **first missing, failed, or incomplete artifact** and (b) the **first gate in G1–G4 with no `CURRENT` answer (none recorded, or `STALE`)** — never at an arbitrary later stage. The developer confirms that proposal or chooses to start the run over. WORKSPACE.md is incomplete whenever it lacks a `PREPARED` or `REUSED_EXISTING` status for a repository in the CURRENT G1 selection, whatever the Stage status table says, so a repository added at G1 returns the run to stage 2 before any planning; a repository whose preparation recorded `FAILED` or `BLOCKED` is a failed artifact under (a) as before. An existing artifact is always treated as an immutable input unless the developer explicitly asks for it to be redone; that decision, if made, is recorded in RUN.md by `pipeline`, not by this skill. Redoing an artifact marks every later-stage artifact SUPERSEDED in RUN.md's Artifact history, and, in the same RUN.md edit, marks every gate answer whose basis names a superseded artifact `STALE`; a `STALE` answer is never treated as an approval and the gate is re-asked before any later stage runs, producing a new `CURRENT` entry. Those later stages run again; a SUPERSEDED artifact is never used as an input by any agent — except `planner`, which reads the immediately prior PLAN.md/ADVERSARY-REVIEW.md revision as the prior plan on a revise round or a new cycle. For G3 specifically, a `CURRENT` answer means a `CURRENT` `APPROVE`: a `SEND_BACK` or `ABORT` entry, even if recorded `CURRENT`, never counts as an answered gate for rule (b) above. An artifact whose every recorded version is SUPERSEDED counts as missing for rule (a) above. An interrupted planning cycle resumes at stage 2 when a newly added repository is not yet prepared, at stage 3 when the replacement plan does not yet exist, and at stage 4 when the replacement plan exists but its review does not — never at stage 5 or later against a superseded plan. **TEST-REVIEW.md missing or SUPERSEDED resumes at stage 5b; TEST-CONTRACT.md superseded by a correction or by a recovery decision resumes at stage 5.** An entry in TEST-CONTRACT.md whose candidate anchor a CURRENT `ACCEPT` names but whose activation is not recorded is an incomplete TEST-CONTRACT.md and resumes at the activation step (Tester activation mode), never at stage 6. IMPLEMENTATION.md `IN_PROGRESS` resumes stage 6 in the same round with the allowance its log leaves, a reserved execution without a result counting as consumed; IMPLEMENTATION.md `BLOCKED` without a recorded decision re-voices `IMPLEMENTATION_BLOCKED` and never invokes `developer`. **Stage 6 cannot start, and G4 cannot be asked, without a current test review or on a verification `INCOMPLETE`; recovery from `INCOMPLETE` returns to stage 5 and never to stage 7 alone.**
  A stage agent is **never** re-invoked to silently regenerate an artifact that already exists — except the authorized regenerations under contract A6 (planner round 2, developer fix rounds, tester amendments and RED re-proofs, verifier re-runs, tester correction round and test re-review, a developer-directed implementation round, and a developer-directed planning cycle — a G3 `SEND_BACK` or a "redirect the planner" choice, identified by `cycle.round`), each recorded in RUN.md's Artifact history with the prior version marked SUPERSEDED.
- **If it does not**, create an empty RUN.md for the new run and proceed.

## Hand-off

Once parsing (and, on an existing run, the resume decision) is settled, the `pipeline` agent proceeds with `FLOW.md` stage 0 → stage 1 (Intake) using the validated, ordered key list. This skill does not itself invoke any subagent, voice any gate, or duplicate the gate wording or the STOP catalogue — those live in `FLOW.md` and `.github/agents/pipeline.agent.md`, which are normative.
