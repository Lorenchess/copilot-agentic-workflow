// A bounded coordination loop for transports the engine process can call
// directly. It owns no state: it asks the engine for work, hands the envelope
// to the transport, and submits whatever comes back. It stops at a human
// wait, a terminal state, a blocker, an attempt another dispatcher owns, or
// its iteration limit.

import type { RoleTransport } from '../contracts/ports.ts';
import type { TransportFailure } from '../contracts/records.ts';
import type { Engine, Reply } from './engine.ts';

export interface DriveStep {
  attempt_id: string | null;
  action: string;
  code: string;
  ok: boolean;
  duplicate?: boolean;
}

export interface DriveResult {
  last: Reply;
  trace: DriveStep[];
  stopped: 'DIRECTIVE' | 'ITERATION_LIMIT' | 'ENGINE_REFUSAL' | 'IN_FLIGHT' | 'TRANSPORT_CLASS_MISMATCH';
}

export function driveRun(engine: Engine, transport: RoleTransport, runId: string, maxIterations = 30): DriveResult {
  const trace: DriveStep[] = [];
  // A run takes work only from a transport of the class it was started with,
  // so simulated results cannot enter a run that is not marked simulated.
  const status = engine.status(runId);
  if (!status.ok) return { last: status, trace, stopped: 'ENGINE_REFUSAL' };
  if (status.transport_class !== transport.evidence_class) return { last: status, trace, stopped: 'TRANSPORT_CLASS_MISMATCH' };
  let last = engine.next(runId);
  for (let i = 0; i < maxIterations; i++) {
    const envelope = last.directive?.kind === 'CONTINUE' ? last.directive.pending : null;
    trace.push({ attempt_id: envelope?.attempt_id ?? null, action: 'next', code: last.code, ok: last.ok });
    if (!last.ok) return { last, trace, stopped: 'ENGINE_REFUSAL' };
    if (!envelope) {
      if (last.directive?.kind !== 'CONTINUE') return { last, trace, stopped: 'DIRECTIVE' };
      last = engine.next(runId);
      continue;
    }

    const failure = (kind: TransportFailure['kind'], detail: string): string =>
      JSON.stringify({
        schema_version: 1,
        record_type: 'transport-failure',
        run_id: runId,
        attempt_id: envelope.attempt_id,
        expected_version: envelope.state_version,
        kind,
        detail,
      } satisfies TransportFailure);

    // Result deduplication does not undo a second execution, so the transport is
    // invoked only by the driver the engine granted this attempt to.
    if (last.dispatch !== 'GRANTED') return { last, trace, stopped: 'IN_FLIGHT' };

    for (const delivery of transport.dispatch(envelope)) {
      const raw = delivery.kind === 'RESULT' ? delivery.raw : failure(delivery.failure, delivery.detail);
      let r = engine.submit(runId, raw);
      trace.push({ attempt_id: envelope.attempt_id, action: `submit:${delivery.kind}`, code: r.code, ok: r.ok, duplicate: r.duplicate === true });
      // A result the engine refuses while the attempt is still pending is a failed
      // invocation: the attempt is closed as such, and the refusal is never retried
      // with the same content or argued with.
      const stillPending = r.directive?.kind === 'CONTINUE' && r.directive.pending?.attempt_id === envelope.attempt_id;
      if (delivery.kind === 'RESULT' && !r.ok && stillPending) {
        const unreadable = r.code === 'MALFORMED_RESULT' || r.code === 'UNSUPPORTED_SCHEMA_VERSION';
        r = engine.submit(runId, failure(unreadable ? 'MALFORMED_REPLY' : 'RESULT_REJECTED', `engine rejected the reply: ${r.code}`));
        trace.push({ attempt_id: envelope.attempt_id, action: 'submit:FAILURE', code: r.code, ok: r.ok, duplicate: r.duplicate === true });
      }
    }
    last = engine.next(runId);
  }
  return { last, trace, stopped: 'ITERATION_LIMIT' };
}
