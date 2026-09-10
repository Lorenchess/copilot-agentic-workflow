```yaml
artifact: PR.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: CREATED
producedBy: pr
inputs: [PR-DESCRIPTION.md, VERIFICATION.md, WORKSPACE.md, RUN.md]
```

## Per repository

### `payments-api`

- Outcome: `CREATED`
- PR URL: `https://bitbucket.example.com/projects/PAY/repos/payments-api/pull-requests/512` [TOOL]
- Source branch: `PAYMENTS-12345-webhook-retry-backoff` → target branch: `main`
- Target branch source: WORKSPACE.md (the default branch recorded for `payments-api`), never assumed
- Eligibility (checked before any Bitbucket read): VERIFICATION.md Verdict = PASS; RUN.md G4 = `CURRENT` and `PUBLISH_AND_PR`; WORKSPACE.md's remote SHA (`cccc3333dddd4444eeee5555aaaa1111bbbb2222`) = the verified SHA; target `main` = WORKSPACE.md's recorded default branch = the G4 target branch — all four held.
- Existing-PR check: read existing PRs for `PAYMENTS-12345-webhook-retry-backoff` before creating — none found; no existing PR, so no reuse eligibility comparison was needed
- Remote SHA read before creation: `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL] (via the Bitbucket read-branch capability — required on both the create and the reuse path)
- Remote SHA read after creation: `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL]
- Which read it comes from: the recorded value is the read-after-creation value; the read-before-creation value was equal to it
- Equality with verified SHA (`cccc3333dddd4444eeee5555aaaa1111bbbb2222` from VERIFICATION.md, matching WORKSPACE.md's Publish section): match
- Tool evidence:
  ```text
  read-existing-prs payments-api PAYMENTS-12345-webhook-retry-backoff -> none found
  read-branch payments-api PAYMENTS-12345-webhook-retry-backoff -> cccc3333dddd4444eeee5555aaaa1111bbbb2222
  create-pull-request payments-api PAYMENTS-12345-webhook-retry-backoff -> main -> PR #512
  read-after payments-api PAYMENTS-12345-webhook-retry-backoff -> cccc3333dddd4444eeee5555aaaa1111bbbb2222
  ```

### `payments-ledger`

- Outcome: `CREATED`
- PR URL: `https://bitbucket.example.com/projects/PAY/repos/payments-ledger/pull-requests/88` [TOOL]
- Source branch: `PAYMENTS-12345-webhook-retry-backoff` → target branch: `main`
- Target branch source: WORKSPACE.md (the default branch recorded for `payments-ledger`), never assumed
- Eligibility (checked before any Bitbucket read): VERIFICATION.md Verdict = PASS; RUN.md G4 = `CURRENT` and `PUBLISH_AND_PR`; WORKSPACE.md's remote SHA (`dddd4444eeee5555aaaa1111bbbb2222cccc3333`) = the verified SHA; target `main` = WORKSPACE.md's recorded default branch = the G4 target branch — all four held.
- Existing-PR check: read existing PRs for `PAYMENTS-12345-webhook-retry-backoff` before creating — none found; no existing PR, so no reuse eligibility comparison was needed
- Remote SHA read before creation: `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL] (via the Bitbucket read-branch capability — required on both the create and the reuse path)
- Remote SHA read after creation: `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL]
- Which read it comes from: the recorded value is the read-after-creation value; the read-before-creation value was equal to it
- Equality with verified SHA (`dddd4444eeee5555aaaa1111bbbb2222cccc3333` from VERIFICATION.md, matching WORKSPACE.md's Publish section): match
- Tool evidence:
  ```text
  read-existing-prs payments-ledger PAYMENTS-12345-webhook-retry-backoff -> none found
  read-branch payments-ledger PAYMENTS-12345-webhook-retry-backoff -> dddd4444eeee5555aaaa1111bbbb2222cccc3333
  create-pull-request payments-ledger PAYMENTS-12345-webhook-retry-backoff -> main -> PR #88
  read-after payments-ledger PAYMENTS-12345-webhook-retry-backoff -> dddd4444eeee5555aaaa1111bbbb2222cccc3333
  ```

Both PRs were created only after eligibility was checked, before any Bitbucket read, for each repository: VERIFICATION.md's Verdict PASS, RUN.md's G4 `CURRENT` and `PUBLISH_AND_PR`, WORKSPACE.md's remote SHA equal to the verified SHA, and the target `main` equal to both WORKSPACE.md's recorded default and the G4 target. The remote SHA was then re-read through the Bitbucket read-branch capability immediately before creation (a check required on both the creation path taken here and the reuse path, had one applied) and again immediately after creation; both reads equaled the verified SHA for each repository. Neither repository had an existing PR for the source branch, so no reuse eligibility comparison was needed.
