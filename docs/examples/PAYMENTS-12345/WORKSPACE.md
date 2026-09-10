```yaml
artifact: WORKSPACE.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: PUBLISHED
producedBy: workspace
inputs: [INTAKE.md, RUN.md, VERIFICATION.md]
```

## Per repository

### `payments-api`

- Path: `payments-api` [TOOL]
- Remote: `https://bitbucket.example.com/scm/pay/payments-api.git` [TOOL] (`git -C payments-api remote -v`)
- Default branch: `main`, determined via `git -C payments-api symbolic-ref --short refs/remotes/origin/HEAD` [TOOL]
- Status: **PREPARED**
- Base commit: `0000111122223333444455556666777788889999` [TOOL] (`git -C payments-api rev-parse HEAD` on `main` after fast-forward)
- Actions taken, in order, each `[TOOL]`:
  1. `git -C payments-api status --porcelain=v2 --branch` — clean
  2. `git -C payments-api symbolic-ref --short refs/remotes/origin/HEAD` → `main`
  3. `git -C payments-api fetch --prune origin` — succeeded
  4. `git -C payments-api branch --list PAYMENTS-12345-webhook-retry-backoff` and `git -C payments-api ls-remote --heads origin PAYMENTS-12345-webhook-retry-backoff` — neither found
  5. `git -C payments-api switch main`
  6. `git -C payments-api merge --ff-only origin/main` — fast-forwarded cleanly
  7. `git -C payments-api switch -c PAYMENTS-12345-webhook-retry-backoff`

### `payments-ledger`

- Path: `payments-ledger` [TOOL]
- Remote: `https://bitbucket.example.com/scm/pay/payments-ledger.git` [TOOL] (`git -C payments-ledger remote -v`)
- Default branch: `main`, determined via `git -C payments-ledger symbolic-ref --short refs/remotes/origin/HEAD` [TOOL]
- Status: **PREPARED**
- Base commit: `1111222233334444555566667777888899990000` [TOOL] (`git -C payments-ledger rev-parse HEAD` on `main` after fast-forward)
- Actions taken, in order, each `[TOOL]`:
  1. `git -C payments-ledger status --porcelain=v2 --branch` — clean
  2. `git -C payments-ledger symbolic-ref --short refs/remotes/origin/HEAD` → `main`
  3. `git -C payments-ledger fetch --prune origin` — succeeded
  4. `git -C payments-ledger branch --list PAYMENTS-12345-webhook-retry-backoff` and `git -C payments-ledger ls-remote --heads origin PAYMENTS-12345-webhook-retry-backoff` — neither found
  5. `git -C payments-ledger switch main`
  6. `git -C payments-ledger merge --ff-only origin/main` — fast-forwarded cleanly
  7. `git -C payments-ledger switch -c PAYMENTS-12345-webhook-retry-backoff`

Committer identity epoch captured once for this run (`git -C payments-api var GIT_COMMITTER_IDENT`) [TOOL]: `Pipeline Reference Bot <pipeline-bot@example.com> 1757502000 +0000`. No other timestamp field in this or any other artifact is fabricated; fields with no tool-produced value are left blank.

## Publish section

Publish sequence executed after G4 = `PUBLISH_AND_PR` was confirmed present in RUN.md's gates log (publish step 0).

### `payments-api`

- Verified SHA (from VERIFICATION.md): `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL]
- Local HEAD (`git -C payments-api rev-parse HEAD` on the feature branch): `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL]
- Equality result: match
- Push result: `git -C payments-api push -u origin PAYMENTS-12345-webhook-retry-backoff` — succeeded [TOOL]
  ```text
  * [new branch]      PAYMENTS-12345-webhook-retry-backoff -> PAYMENTS-12345-webhook-retry-backoff
  branch 'PAYMENTS-12345-webhook-retry-backoff' set up to track 'origin/PAYMENTS-12345-webhook-retry-backoff'.
  ```
- Remote SHA (`git -C payments-api ls-remote --heads origin PAYMENTS-12345-webhook-retry-backoff`): `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL]
- Final verdict: **PUBLISHED**

### `payments-ledger`

- Verified SHA (from VERIFICATION.md): `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL]
- Local HEAD (`git -C payments-ledger rev-parse HEAD` on the feature branch): `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL]
- Equality result: match
- Push result: `git -C payments-ledger push -u origin PAYMENTS-12345-webhook-retry-backoff` — succeeded [TOOL]
  ```text
  * [new branch]      PAYMENTS-12345-webhook-retry-backoff -> PAYMENTS-12345-webhook-retry-backoff
  branch 'PAYMENTS-12345-webhook-retry-backoff' set up to track 'origin/PAYMENTS-12345-webhook-retry-backoff'.
  ```
- Remote SHA (`git -C payments-ledger ls-remote --heads origin PAYMENTS-12345-webhook-retry-backoff`): `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL]
- Final verdict: **PUBLISHED**

Both repositories: local HEAD = verified SHA = remote SHA. No repository was pushed before this equality was confirmed; nothing was force-pushed.
