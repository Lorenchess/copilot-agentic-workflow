// Test-only process: one driver over a run, with a fake transport that
// records every real invocation to a shared log before doing anything else.
//
//   node tests/support/driver-child.ts <workspace> <run-id> <log-file> <mode> [delay-ms]
//
// Modes:
//   drive                 drive until a stop; each invocation takes delay-ms
//   die-in-transport      be killed after the invocation started, before any result is submitted
//   die-after-dispatch    be killed when the dispatch event is committed, before the reply

import { appendFileSync } from 'node:fs';
import { createFakeTransport } from '../../adapters/fake-transport/index.ts';
import type { RoleTransport } from '../../core/contracts/ports.ts';
import { driveRun } from '../../core/engine/drive.ts';
import { createAssembly } from '../../scripts/assembly.ts';

const [workspace, runId, logFile, mode, delay] = process.argv.slice(2) as [string, string, string, string, string?];
const die = (): never => process.kill(process.pid, 'SIGKILL') as never;

const assembly = createAssembly(workspace, {
  engine: {
    onCommitted: (event) => {
      if (mode === 'die-after-dispatch' && event.type === 'task_dispatched') die();
    },
  },
});
const fake = createFakeTransport(assembly.runsRoot);
const transport: RoleTransport = {
  id: fake.id,
  evidence_class: fake.evidence_class,
  dispatch(envelope) {
    appendFileSync(logFile, `${process.pid} ${envelope.attempt_id}\n`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number(delay ?? 0));
    if (mode === 'die-in-transport') die();
    return fake.dispatch(envelope);
  },
};

const out = driveRun(assembly.engine, transport, runId);
process.stdout.write(`${JSON.stringify({ stopped: out.stopped, code: out.last.code, trace: out.trace })}\n`);
