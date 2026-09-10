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

- PR URL: `https://bitbucket.example.com/projects/PAY/repos/payments-api/pull-requests/512` [TOOL]
- Source branch: `PAYMENTS-12345-webhook-retry-backoff` → target branch: `main`
- Target branch source: WORKSPACE.md (the default branch recorded for `payments-api`), never assumed
- Existing-PR check: read existing PRs for `PAYMENTS-12345-webhook-retry-backoff` before creating — none found
- Remote SHA at creation: `cccc3333dddd4444eeee5555aaaa1111bbbb2222` [TOOL] (read after creation, via the Bitbucket read-branch capability)
- Which read it comes from: read after creation
- Equality with verified SHA (`cccc3333dddd4444eeee5555aaaa1111bbbb2222` from VERIFICATION.md, matching WORKSPACE.md's Publish section): match
- Tool evidence:
  ```text
  read-existing-prs payments-api PAYMENTS-12345-webhook-retry-backoff -> none found
  read-branch payments-api PAYMENTS-12345-webhook-retry-backoff -> cccc3333dddd4444eeee5555aaaa1111bbbb2222
  create-pull-request payments-api PAYMENTS-12345-webhook-retry-backoff -> main -> PR #512
  read-after payments-api PAYMENTS-12345-webhook-retry-backoff -> cccc3333dddd4444eeee5555aaaa1111bbbb2222
  ```

### `payments-ledger`

- PR URL: `https://bitbucket.example.com/projects/PAY/repos/payments-ledger/pull-requests/88` [TOOL]
- Source branch: `PAYMENTS-12345-webhook-retry-backoff` → target branch: `main`
- Target branch source: WORKSPACE.md (the default branch recorded for `payments-ledger`), never assumed
- Existing-PR check: read existing PRs for `PAYMENTS-12345-webhook-retry-backoff` before creating — none found
- Remote SHA at creation: `dddd4444eeee5555aaaa1111bbbb2222cccc3333` [TOOL] (read after creation, via the Bitbucket read-branch capability)
- Which read it comes from: read after creation
- Equality with verified SHA (`dddd4444eeee5555aaaa1111bbbb2222cccc3333` from VERIFICATION.md, matching WORKSPACE.md's Publish section): match
- Tool evidence:
  ```text
  read-existing-prs payments-ledger PAYMENTS-12345-webhook-retry-backoff -> none found
  read-branch payments-ledger PAYMENTS-12345-webhook-retry-backoff -> dddd4444eeee5555aaaa1111bbbb2222cccc3333
  create-pull-request payments-ledger PAYMENTS-12345-webhook-retry-backoff -> main -> PR #88
  read-after payments-ledger PAYMENTS-12345-webhook-retry-backoff -> dddd4444eeee5555aaaa1111bbbb2222cccc3333
  ```

Both PRs were created only after VERIFICATION.md's Verdict was confirmed PASS, RUN.md's gates log recorded G4 as `PUBLISH_AND_PR`, the existing-PR check found none for either source branch, and the remote SHA read after creation equaled the verified SHA for each repository.
