// A second scripted role transport, used to show that a transport can be
// replaced through the RoleTransport port alone. It delivers the way a host
// worker is expected to: the worker leaves `result.json` in the attempt's
// work directory, and the transport hands the engine the bytes of that file
// and nothing else. A worker that leaves no file is reported as a failure.
//
// The role content is the same scripted content the first fake transport
// uses. Everything it produces is SIMULATED: it proves the port contract and
// is never evidence of real host or model behavior.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RoleTransport, TransportDelivery } from '../../core/contracts/ports.ts';
import type { TaskEnvelope } from '../../core/contracts/records.ts';
import { type FakeScript, fakeResult } from '../fake-transport/index.ts';

export function createFileDropTransport(runsRoot: string, script: FakeScript = {}): RoleTransport & { dispatched: string[] } {
  const dispatched: string[] = [];
  return {
    id: 'fake-file-drop',
    evidence_class: 'SIMULATED',
    dispatched,
    dispatch(envelope: TaskEnvelope): TransportDelivery[] {
      dispatched.push(envelope.attempt_id);
      const attempt = Number(envelope.attempt_id.slice(envelope.attempt_id.lastIndexOf('-') + 1));
      const behavior = script[envelope.step_id]?.[attempt - 1] ?? 'success';
      const dropped = join(runsRoot, envelope.run_id, envelope.work_dir, 'result.json');

      // The scripted worker. A timeout or a refusal leaves no file behind.
      if (behavior !== 'timeout' && behavior !== 'refusal') {
        const result = fakeResult(runsRoot, envelope, behavior === 'malformed' ? 'success' : behavior);
        writeFileSync(dropped, behavior === 'malformed' ? '{"record_type":"role-result","attempt_id":' : JSON.stringify(result, null, 2));
      }

      if (!existsSync(dropped)) {
        return [{ kind: 'FAILURE', failure: behavior === 'refusal' ? 'REFUSED' : 'TIMEOUT', detail: 'SIMULATED: the worker left no result file' }];
      }
      return [{ kind: 'RESULT', raw: readFileSync(dropped, 'utf8') }];
    },
  };
}
