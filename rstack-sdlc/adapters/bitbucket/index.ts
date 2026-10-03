// Deferred placeholder. It has no service payloads, addresses, credentials,
// or retries; it exists only so that accidental selection fails explicitly.

import type { NotConfigured, ProposalSink } from '../../core/contracts/ports.ts';

const NOT_CONFIGURED: NotConfigured = {
  status: 'INTEGRATION_NOT_CONFIGURED',
  integration: 'bitbucket',
  reason: 'Deferred by owner; use the local PR proposal workflow.',
};

export function createBitbucketProposalSink(): ProposalSink {
  return { id: 'bitbucket', availability: () => NOT_CONFIGURED, prepare: () => NOT_CONFIGURED };
}
