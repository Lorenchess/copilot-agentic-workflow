// Deferred placeholder. It has no service payloads, addresses, credentials,
// or retries; it exists only so that accidental selection fails explicitly.

import type { NotConfigured, RequestSource } from '../../core/contracts/ports.ts';

const NOT_CONFIGURED: NotConfigured = {
  status: 'INTEGRATION_NOT_CONFIGURED',
  integration: 'jira',
  reason: 'Deferred by owner; use the local request source.',
};

export function createJiraRequestSource(): RequestSource {
  return { id: 'jira', getSnapshot: () => NOT_CONFIGURED };
}
