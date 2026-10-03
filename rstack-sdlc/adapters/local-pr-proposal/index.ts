// Local proposal sink: persists the proposal record inside the run. It never
// creates a remote pull request and never reports one.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProposalPersisted, ProposalSink } from '../../core/contracts/ports.ts';
import { type PrProposal, canonicalJson, refOf } from '../../core/contracts/records.ts';

const LOCATION = 'proposal/pr-proposal.json';

export function createLocalProposalSink(): ProposalSink {
  return {
    id: 'local',
    availability: () => ({ status: 'AVAILABLE' }),
    prepare(proposal: PrProposal, runDir: string): ProposalPersisted {
      // Canonical bytes: writing the same proposal again changes nothing.
      const bytes = canonicalJson(proposal);
      mkdirSync(join(runDir, 'proposal'), { recursive: true });
      writeFileSync(join(runDir, LOCATION), bytes);
      return {
        status: 'PR_PROPOSAL_READY',
        publication_status: 'NOT_ATTEMPTED',
        proposal_ref: refOf(bytes),
        location: LOCATION,
      };
    },
  };
}
