// Runs the synthetic request against the synthetic application through the
// whole sequence. Role results come from the fake transport (SIMULATED) and
// the decision is scripted. The test executions are real: the engine runs
// the application's tests itself, against the unchanged application and
// against each candidate. The script includes one inadequate proof and one
// wrong implementation so the refusals are visible in the trace.
//
//   node scripts/synthetic-run.ts [--workspace <dir>]
//
// The default workspace is this package, so evidence lands in the ignored
// rstack-sdlc/.rstack/runs/<run-id>/.

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createFakeTransport } from '../adapters/fake-transport/index.ts';
import type { HumanDecision } from '../core/contracts/records.ts';
import { driveRun } from '../core/engine/drive.ts';
import { createAssembly } from './assembly.ts';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: { workspace: { type: 'string' } } });
const assembly = createAssembly(resolve(values.workspace ?? PACKAGE_ROOT));
const transport = createFakeTransport(assembly.runsRoot, { intent: ['timeout', 'success'], proof: ['vacuous', 'success'], implement: ['wrong', 'success'] });

const started = await assembly.start({
  request: { path: join(PACKAGE_ROOT, 'tests', 'fixtures', 'requests', 'REQ-001.md') },
  appDir: join(PACKAGE_ROOT, 'tests', 'fixtures', 'sample-app'),
  profilePath: join(PACKAGE_ROOT, 'profiles', 'trial-v1.json'),
  transportClass: 'SIMULATED',
});
if (!started.ok || !started.run_id) {
  process.stdout.write(`${JSON.stringify(started, null, 2)}\n`);
  process.exit(2);
}
const runId = started.run_id;

const toHuman = driveRun(assembly.engine, transport, runId);
let trace = toHuman.trace;
let last = toHuman.last;
if (last.directive?.kind === 'WAIT') {
  const decision: HumanDecision = {
    schema_version: 1,
    record_type: 'human-decision',
    run_id: runId,
    decision_id: 'D1',
    expected_version: last.directive.expected_version,
    action: 'proceed',
    subjects: last.directive.subjects,
    recorded_by: 'synthetic-run script',
    provenance: 'SCRIPTED',
  };
  const decided = assembly.engine.decide(runId, JSON.stringify(decision));
  trace = [...trace, { attempt_id: null, action: 'decide', code: decided.code, ok: decided.ok }];
  const rest = driveRun(assembly.engine, transport, runId);
  trace = [...trace, ...rest.trace];
  last = rest.last;
}

process.stdout.write(
  `${JSON.stringify({ evidence_class: 'SIMULATED', run_id: runId, runs_root: assembly.runsRoot, trace, final: last }, null, 2)}\n`,
);
process.exitCode = last.directive?.kind === 'DONE' && last.directive.terminal === 'PR_PROPOSAL_READY' ? 0 : 2;
