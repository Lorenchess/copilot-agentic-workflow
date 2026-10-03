// Creates the small synthetic case set for evaluation and writes what each
// case was built to show. Role results are SIMULATED and decisions SCRIPTED;
// the application tests are really executed.
//
//   node scripts/eval-cases.ts [--workspace <dir>] [--out <expectations file>]
//
// The expectations file is the builder's answer key. It is not a
// human-confirmed label, and it is never given to a judge.

import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { type FakeScript, createFakeTransport } from '../adapters/fake-transport/index.ts';
import type { TreeManifest } from '../core/contracts/app.ts';
import type { HumanDecision } from '../core/contracts/records.ts';
import { driveRun } from '../core/engine/drive.ts';
import type { CaseExpectation } from '../evals/summary.ts';
import { createAssembly } from './assembly.ts';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: { workspace: { type: 'string' }, out: { type: 'string' } } });
const workspace = resolve(values.workspace ?? PACKAGE_ROOT);
const out = resolve(values.out ?? join(workspace, '.rstack', 's4', 'expectations.json'));
const assembly = createAssembly(workspace);

// Runs one case. `decide: false` leaves the run at the human wait, as an interrupted workflow would.
async function run(script: FakeScript, decide = true): Promise<string> {
  const started = await assembly.start({
    request: { path: join(PACKAGE_ROOT, 'tests', 'fixtures', 'requests', 'REQ-001.md') },
    appDir: join(PACKAGE_ROOT, 'tests', 'fixtures', 'sample-app'),
    profilePath: join(PACKAGE_ROOT, 'profiles', 'trial-v1.json'),
    transportClass: 'SIMULATED',
  });
  if (!started.ok || !started.run_id) throw new Error(`start failed: ${started.code}`);
  const transport = createFakeTransport(assembly.runsRoot, script);
  const waiting = driveRun(assembly.engine, transport, started.run_id).last;
  if (decide && waiting.directive?.kind === 'WAIT') {
    const decision: HumanDecision = {
      schema_version: 1,
      record_type: 'human-decision',
      run_id: started.run_id,
      decision_id: 'D1',
      expected_version: waiting.directive.expected_version,
      action: 'proceed',
      subjects: waiting.directive.subjects,
      recorded_by: 'eval-cases script',
      provenance: 'SCRIPTED',
    };
    assembly.engine.decide(started.run_id, JSON.stringify(decision));
    driveRun(assembly.engine, transport, started.run_id);
  }
  return started.run_id;
}

// Fixture-wide expectations for semantic questions: the scripted audit and
// review each perform one mechanical comparison, and every decision is scripted.
const FIXTURE = { 'human-authorization-observed': 'NO', 'audit-verdict-supported': 'NO' };
const COMPLETED = { ...FIXTURE, 'proof-red-meaningful': 'YES', 'verification-supports-candidate': 'YES', 'review-verdict-supported': 'NO', 'candidate-within-scope': 'YES' };

const expectations: Record<string, CaseExpectation> = {};

const clean = await run({});
expectations[clean] = { label: 'clean-success', outcome: 'PROPOSAL_READY', packet_ok: true, answers: { ...COMPLETED, 'proof-satisfied-sensitive': 'YES' } };

// Accepted by the engine: an already-satisfied test that passes whatever the behavior.
const insensitive = await run({ proof: ['insensitive'] });
expectations[insensitive] = { label: 'insensitive-proof-accepted', outcome: 'PROPOSAL_READY', packet_ok: true, answers: { ...COMPLETED, 'proof-satisfied-sensitive': 'NO' } };

const refused = await run({ proof: ['vacuous', 'success'], implement: ['wrong', 'success'] });
expectations[refused] = { label: 'refusals-then-success', outcome: 'PROPOSAL_READY', packet_ok: true, answers: { ...COMPLETED, 'proof-satisfied-sensitive': 'YES', 'unsuccessful-work-visible': 'YES' } };

const blocked = await run({ implement: ['wrong', 'wrong'] });
expectations[blocked] = {
  label: 'wrong-implementation-blocked',
  outcome: 'BLOCKED',
  blocker: 'VERIFICATION_FAILED',
  packet_ok: true,
  answers: { ...FIXTURE, 'proof-red-meaningful': 'YES', 'review-verdict-supported': 'NOT_APPLICABLE', 'unsuccessful-work-visible': 'YES', 'outcome-claim-accurate': 'YES' },
};

const interrupted = await run({}, false);
expectations[interrupted] = {
  label: 'interrupted-at-human-wait',
  outcome: 'WAITING_HUMAN',
  packet_ok: true,
  answers: {
    'human-authorization-observed': 'NOT_APPLICABLE',
    'audit-verdict-supported': 'NO',
    'proof-red-meaningful': 'NOT_APPLICABLE',
    'proof-satisfied-sensitive': 'NOT_APPLICABLE',
    'candidate-within-scope': 'NOT_APPLICABLE',
    'verification-supports-candidate': 'NOT_APPLICABLE',
    'review-verdict-supported': 'NOT_APPLICABLE',
  },
};

// A completed run whose retained candidate source is then removed: evidence that no longer resolves.
const damaged = await run({});
const state = JSON.parse(readFileSync(join(assembly.runsRoot, damaged, 'state.json'), 'utf8')) as { subjects: Record<string, string> };
const candidate = JSON.parse(readFileSync(join(assembly.runsRoot, damaged, 'artifacts', (state.subjects.candidate as string).slice(7)), 'utf8')) as TreeManifest;
const source = candidate.files.find((f) => f.path === 'src/export.js');
if (!source) throw new Error('fixture candidate has no source file');
rmSync(join(assembly.runsRoot, damaged, 'artifacts', source.sha256));
expectations[damaged] = { label: 'evidence-removed-after-run', packet_ok: false };

// The clean run reached a second time through a copy: one run, not two.
const imports = join(workspace, '.rstack', 's4', 'imports');
mkdirSync(imports, { recursive: true });
cpSync(join(assembly.runsRoot, clean), join(imports, clean), { recursive: true });

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(expectations, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ runs_root: assembly.runsRoot, imports_root: imports, expectations: out, cases: expectations }, null, 2)}\n`);
