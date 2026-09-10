```yaml
artifact: WORKSPACE.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: PUBLISHED
producedBy: workspace
inputs: [RUN.md, VERIFICATION.md]
```

## Per repository

### `payments-api`

- Path: `payments-api` [TOOL]
- Push destination (`git -C payments-api remote -v`): `https://bitbucket.example.com/scm/pay/payments-api.git` [TOOL]
- Default branch: `main`, determined via `git -C payments-api symbolic-ref --short refs/remotes/origin/HEAD` [TOOL]
- Status: **PREPARED**
- Baseline (`origin/main`) SHA: `0000111122223333444455556666777788889999` [TOOL] (`git -C payments-api rev-parse origin/main` after fetch; equal to local `main`'s HEAD after the fast-forward below)
- Actions taken, in order, each `[TOOL]`:
  1. `git -C payments-api status --porcelain=v2 --branch` — clean
  2. `git -C payments-api symbolic-ref --short refs/remotes/origin/HEAD` → `main`
  3. `git -C payments-api fetch --prune origin` — succeeded
  4. `git -C payments-api branch --list PAYMENTS-12345-webhook-retry-backoff` and `git -C payments-api ls-remote --heads origin PAYMENTS-12345-webhook-retry-backoff` — neither found
  5. `git -C payments-api switch main`
  6. `git -C payments-api merge --ff-only origin/main` — fast-forwarded cleanly
  7. `git -C payments-api rev-list --left-right --count origin/main...main` → `0 0` (local default carries nothing origin doesn't have)
  8. `git -C payments-api switch -c PAYMENTS-12345-webhook-retry-backoff`

### `payments-ledger`

- Path: `payments-ledger` [TOOL]
- Push destination (`git -C payments-ledger remote -v`): `https://bitbucket.example.com/scm/pay/payments-ledger.git` [TOOL]
- Default branch: `main`, determined via `git -C payments-ledger symbolic-ref --short refs/remotes/origin/HEAD` [TOOL]
- Status: **PREPARED**
- Baseline (`origin/main`) SHA: `1111222233334444555566667777888899990000` [TOOL] (`git -C payments-ledger rev-parse origin/main` after fetch; equal to local `main`'s HEAD after the fast-forward below)
- Actions taken, in order, each `[TOOL]`:
  1. `git -C payments-ledger status --porcelain=v2 --branch` — clean
  2. `git -C payments-ledger symbolic-ref --short refs/remotes/origin/HEAD` → `main`
  3. `git -C payments-ledger fetch --prune origin` — succeeded
  4. `git -C payments-ledger branch --list PAYMENTS-12345-webhook-retry-backoff` and `git -C payments-ledger ls-remote --heads origin PAYMENTS-12345-webhook-retry-backoff` — neither found
  5. `git -C payments-ledger switch main`
  6. `git -C payments-ledger merge --ff-only origin/main` — fast-forwarded cleanly
  7. `git -C payments-ledger rev-list --left-right --count origin/main...main` → `0 0` (local default carries nothing origin doesn't have)
  8. `git -C payments-ledger switch -c PAYMENTS-12345-webhook-retry-backoff`

Committer identity epoch captured once for this run (`git -C payments-api var GIT_COMMITTER_IDENT`) [TOOL]: `Pipeline Reference Bot <pipeline-bot@example.com> 1757502000 +0000`. No other timestamp field in this or any other artifact is fabricated; fields with no tool-produced value are left blank.

## Publish section

**Step 0** — read RUN.md's gates log: G4 is recorded as `PUBLISH_AND_PR` [TOOL]. Proceeding to step 1.

**Step 1 — preflight, both repositories, before any push.** Per repository: current push destination (`git -C <dir> remote -v`), current branch (`git -C <dir> rev-parse --abbrev-ref HEAD`), current HEAD (`git -C <dir> rev-parse HEAD`), current default branch (`git -C <dir> ls-remote --symref origin HEAD`), and the SHA read from VERIFICATION.md — each compared against the G4 tuple recorded in RUN.md's Gates log:

| Repository | Push destination | Current branch | Current HEAD | Current default | VERIFICATION.md SHA | Compared to G4 tuple | Result |
|---|---|---|---|---|---|---|---|
| `payments-api` | `https://bitbucket.example.com/scm/pay/payments-api.git` | `PAYMENTS-12345-webhook-retry-backoff` | `cccc3333dddd4444eeee5555aaaa1111bbbb2222` | `main` | `cccc3333dddd4444eeee5555aaaa1111bbbb2222` | all fields equal | OK |
| `payments-ledger` | `https://bitbucket.example.com/scm/pay/payments-ledger.git` | `PAYMENTS-12345-webhook-retry-backoff` | `dddd4444eeee5555aaaa1111bbbb2222cccc3333` | `main` | `dddd4444eeee5555aaaa1111bbbb2222cccc3333` | all fields equal | OK |

Every field for every repository equals the G4 tuple; no `G4_STALE`, no `REVERIFICATION_REQUIRED`. Every read `[TOOL]`. Only because both repositories passed this preflight does step 2 run.

**Step 2 — push, per repository, the explicit verified commit object:**

### `payments-api`

- Verified SHA (from VERIFICATION.md): `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL]
- Push command: `git -C payments-api push origin cccc3333dddd4444eeee5555aaaa1111bbbb2222:refs/heads/PAYMENTS-12345-webhook-retry-backoff` — succeeded [TOOL]
  ```text
  * [new branch]      cccc3333dddd4444eeee5555aaaa1111bbbb2222 -> PAYMENTS-12345-webhook-retry-backoff
  ```
- Step 3 — `git -C payments-api ls-remote --heads origin PAYMENTS-12345-webhook-retry-backoff`: `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL] — equals the verified SHA
- Final verdict: **PUBLISHED**

### `payments-ledger`

- Verified SHA (from VERIFICATION.md): `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL]
- Push command: `git -C payments-ledger push origin dddd4444eeee5555aaaa1111bbbb2222cccc3333:refs/heads/PAYMENTS-12345-webhook-retry-backoff` — succeeded [TOOL]
  ```text
  * [new branch]      dddd4444eeee5555aaaa1111bbbb2222cccc3333 -> PAYMENTS-12345-webhook-retry-backoff
  ```
- Step 3 — `git -C payments-ledger ls-remote --heads origin PAYMENTS-12345-webhook-retry-backoff`: `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL] — equals the verified SHA
- Final verdict: **PUBLISHED**

Both repositories: preflight passed for every repository before either was pushed; each push named the explicit verified commit object, never a branch name and never `-u`; nothing was force-pushed; local HEAD = verified SHA = remote SHA for both.
