```yaml
artifact: PR.md
run: PAYMENTS-12345
primaryJira: PAYMENTS-12345
status: CREATED
producedBy: pr
inputs: [PR-DESCRIPTION.md, VERIFICATION.md, WORKSPACE.md]
```

## Per repository

### `payments-api`

- PR URL: `https://bitbucket.example.com/projects/PAY/repos/payments-api/pull-requests/512` [TOOL]
- Source branch: `PAYMENTS-12345-webhook-retry-backoff` → target branch: `main`
- Remote SHA at creation: `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL] (re-read via the Bitbucket read-branch capability immediately before creating the PR)
- Equality with verified SHA (`cccc3333dddd4444eeee5555aaaa1111bbbb2222` from VERIFICATION.md, matching WORKSPACE.md's Publish section): match
- Tool evidence:
  ```text
  read-branch payments-api PAYMENTS-12345-webhook-retry-backoff -> cccc3333dddd4444eeee5555aaaa1111bbbb2222
  create-pull-request payments-api PAYMENTS-12345-webhook-retry-backoff -> main -> PR #512
  ```

### `payments-ledger`

- PR URL: `https://bitbucket.example.com/projects/PAY/repos/payments-ledger/pull-requests/88` [TOOL]
- Source branch: `PAYMENTS-12345-webhook-retry-backoff` → target branch: `main`
- Remote SHA at creation: `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL] (re-read via the Bitbucket read-branch capability immediately before creating the PR)
- Equality with verified SHA (`dddd4444eeee5555aaaa1111bbbb2222cccc3333` from VERIFICATION.md, matching WORKSPACE.md's Publish section): match
- Tool evidence:
  ```text
  read-branch payments-ledger PAYMENTS-12345-webhook-retry-backoff -> dddd4444eeee5555aaaa1111bbbb2222cccc3333
  create-pull-request payments-ledger PAYMENTS-12345-webhook-retry-backoff -> main -> PR #88
  ```

Both PRs were created only after VERIFICATION.md's Verdict was confirmed PASS, RUN.md's gates log recorded G4 as `PUBLISH_AND_PR`, and the remote SHA re-read here equaled the verified SHA for each repository.
