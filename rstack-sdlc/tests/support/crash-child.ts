// Test-only process: submits one result and is killed at the commit point,
// after the journal append has been synced and before any reply is written.
//
//   node tests/support/crash-child.ts <workspace> <run-id> <result-file>

import { readFileSync } from 'node:fs';
import { createAssembly } from '../../scripts/assembly.ts';

const [workspace, runId, resultFile] = process.argv.slice(2) as [string, string, string];
const assembly = createAssembly(workspace, {
  engine: {
    onCommitted: () => process.kill(process.pid, 'SIGKILL'),
  },
});
assembly.engine.submit(runId, readFileSync(resultFile, 'utf8'));
process.stdout.write('REPLIED\n');
