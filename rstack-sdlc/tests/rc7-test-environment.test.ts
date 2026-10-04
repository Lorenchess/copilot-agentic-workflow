// RC7: the application's tests run in a controlled environment: an explicit
// runtime set plus the variable names the application configuration
// declares, and nothing else of the parent's. That effective environment has
// an identity recorded with every execution; evidence made under another
// one is not used.
//
// Evidence classes: executions are ACTUAL child processes. Role results are
// SIMULATED and decisions SCRIPTED. The variable values are fixtures.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fakeResult } from '../adapters/fake-transport/index.ts';
import { createNodeTestExecutor } from '../adapters/node-test-executor/index.ts';
import { type ExecutionRecord, parseAppConfig } from '../core/contracts/app.ts';
import type { Reply } from '../core/engine/engine.ts';
import { type Assembly, createAssembly } from '../scripts/assembly.ts';
import { APP, PROFILE, REQUEST, decision, pendingOf, tmpDir } from './support/harness.ts';

const DECLARED = 'RSTACK_RC7_DECLARED';
const AMBIENT = 'RSTACK_RC7_AMBIENT';
const GOOD = 'rc7-declared-value-A';
const BAD = 'rc7-declared-value-B';

// Sets variables for the duration of `fn` and puts back what was there.
function withEnv<T>(values: Record<string, string | undefined>, fn: () => T): T {
  const before = Object.fromEntries(Object.keys(values).map((k) => [k, process.env[k]]));
  const apply = (v: Record<string, string | undefined>): void => {
    for (const [k, value] of Object.entries(v)) {
      if (value === undefined) delete process.env[k];
      else process.env[k] = value;
    }
  };
  apply(values);
  try {
    return fn();
  } finally {
    apply(before);
  }
}

const configWith = (env: unknown): string =>
  JSON.stringify({
    schema_version: 1,
    record_type: 'app-config',
    test: { runner: 'node-test', patterns: ['tests/**/*.test.js'], timeout_seconds: 60, ...(env === undefined ? {} : { env }) },
    controlled_tests_dir: 'tests/controlled',
    protected: ['rstack.app.json'],
  });

test('RC7: the application configuration may declare variable names, and need not', () => {
  assert.ok(parseAppConfig(readFileSync(join(APP, 'rstack.app.json'), 'utf8')).ok, 'the synthetic application declares none and stays valid');
  assert.ok(parseAppConfig(configWith(undefined)).ok);
  assert.ok(parseAppConfig(configWith([])).ok);
  const declared = parseAppConfig(configWith([DECLARED, 'CI', '_private1']));
  assert.ok(declared.ok);
  assert.deepEqual(declared.ok ? declared.value.test.env : null, [DECLARED, 'CI', '_private1']);
  for (const bad of [
    'CI',
    [''],
    ['A=B'],
    ['A B'],
    ['1A'],
    ['A-B'],
    ['$A'],
    [7],
    ['SAME', 'SAME'],
    ['Same', 'SAME'],
    [`A${'x'.repeat(80)}`],
    Array.from({ length: 21 }, (_, i) => `V${i}`),
  ]) {
    const parsed = parseAppConfig(configWith(bad));
    assert.equal(parsed.ok, false, `accepted: ${JSON.stringify(bad)}`);
    assert.match(parsed.ok ? '' : parsed.issues.join('\n'), /app\.test\.env/);
  }
});

// A test file that records what its process can see, without printing any value.
function probeApp(label: string): { dir: string; seen: () => Record<string, string | null> } {
  const dir = tmpDir(label);
  mkdirSync(join(dir, 'tests'));
  writeFileSync(join(dir, 'package.json'), '{ "type": "module" }\n');
  writeFileSync(
    join(dir, 'tests', 'probe.test.js'),
    `import { writeFileSync } from 'node:fs';
import { test } from 'node:test';
test('probe', () => {
  const names = ['${DECLARED}', '${AMBIENT}', 'NODE_OPTIONS', 'RSTACK_RC7_UNDECLARED'];
  const seen = Object.fromEntries(names.map((n) => [n, process.env[n] ?? null]));
  writeFileSync(new URL('../seen.json', import.meta.url), JSON.stringify({ ...seen, count: Object.keys(process.env).length }));
});
`,
  );
  return { dir, seen: () => JSON.parse(readFileSync(join(dir, 'seen.json'), 'utf8')) as Record<string, string | null> };
}

test('RC7 actual execution: the child gets the runtime set and the declared variables, and nothing else', () => {
  const executor = createNodeTestExecutor();
  const app = probeApp('rc7-child');
  const request = { cwd: app.dir, patterns: ['tests/**/*.test.js'], timeoutMs: 60_000, env: [DECLARED] };

  const first = withEnv({ [DECLARED]: GOOD, [AMBIENT]: undefined, RSTACK_RC7_UNDECLARED: 'present in the parent', NODE_OPTIONS: '--no-warnings' }, () => {
    const outcome = executor.run(request);
    return { outcome, identity: executor.environment([DECLARED]), seen: app.seen() };
  });
  assert.equal(first.outcome.exit_code, 0, first.outcome.output);
  assert.equal(first.seen[DECLARED], GOOD, 'a declared variable reaches the test');
  assert.equal(first.seen.RSTACK_RC7_UNDECLARED, null, 'an undeclared variable does not');
  assert.equal(first.seen.NODE_OPTIONS, null, "the parent's runner options do not");
  assert.deepEqual(first.outcome.environment, first.identity, 'the outcome carries the identity of the environment it ran in');

  // The identity: what it is made of, and no value.
  assert.deepEqual(Object.keys(first.identity).sort(), ['arch', 'platform', 'runtime', 'variables', 'variables_digest', 'version']);
  assert.equal(first.identity.version, process.version);
  assert.ok((first.identity.variables as string).split(',').includes(DECLARED));
  assert.match(first.identity.variables_digest as string, /^sha256:[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(first.outcome).includes(GOOD), 'the value appears nowhere in the outcome');

  // An unrelated change in the parent changes neither the child nor the identity.
  const ambient = withEnv({ [DECLARED]: GOOD, [AMBIENT]: 'changed', RSTACK_RC7_UNDECLARED: 'changed too' }, () => {
    const outcome = executor.run(request);
    return { outcome, identity: executor.environment([DECLARED]), seen: app.seen() };
  });
  assert.equal(ambient.seen[AMBIENT], null, 'the ambient variable is not in the child');
  assert.equal(ambient.seen.count, first.seen.count, 'the child sees the same number of variables');
  assert.deepEqual(ambient.identity, first.identity);
  assert.deepEqual(ambient.outcome.environment, first.identity);

  // A changed declared value, or its absence, is a different environment.
  const changed = withEnv({ [DECLARED]: BAD }, () => ({ outcome: executor.run(request), identity: executor.environment([DECLARED]), seen: app.seen() }));
  assert.equal(changed.seen[DECLARED], BAD);
  assert.notEqual(changed.identity.variables_digest, first.identity.variables_digest);
  assert.equal(changed.identity.variables, first.identity.variables, 'the same names, another value');
  assert.deepEqual(changed.outcome.environment, changed.identity);
  const unset = withEnv({ [DECLARED]: undefined }, () => ({ identity: executor.environment([DECLARED]), outcome: executor.run(request), seen: app.seen() }));
  assert.equal(unset.seen[DECLARED], null);
  assert.notEqual(unset.identity.variables_digest, first.identity.variables_digest);
  assert.notEqual(unset.identity.variables_digest, changed.identity.variables_digest);

  // Not declared: the variable is not passed and is not part of the identity.
  const none = withEnv({ [DECLARED]: GOOD }, () => ({ outcome: executor.run({ ...request, env: [] }), identity: executor.environment([]), seen: app.seen() }));
  assert.equal(none.seen[DECLARED], null);
  assert.ok(!(none.identity.variables as string).split(',').includes(DECLARED));
  assert.deepEqual(
    withEnv({ [DECLARED]: BAD }, () => executor.environment([])),
    none.identity,
  );

  // The runner's own switches cannot be declared into the child.
  for (const name of ['NODE_OPTIONS', 'NODE_TEST_CONTEXT']) {
    const refused = withEnv({ [name]: undefined }, () => executor.run({ ...request, env: [name] }));
    assert.equal(refused.exit_code, null, name);
    assert.match(refused.output, /^refused: /, name);
    assert.deepEqual(refused.tests, []);
  }
});

// ---------------------------------------------------------------- end to end

const hashOf = (value: string): string => createHash('sha256').update(value).digest('hex');

// The synthetic application with one declared variable and an existing test
// that depends on it. The test compares a hash, so the value is in no file.
function declaringApp(root: string): string {
  const app = join(root, 'app');
  cpSync(APP, app, { recursive: true });
  const file = join(app, 'rstack.app.json');
  const config = JSON.parse(readFileSync(file, 'utf8')) as { test: { env?: string[] } };
  config.test.env = [DECLARED];
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  writeFileSync(
    join(app, 'tests', 'environment.test.js'),
    `import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
test('existing: the declared variable has the expected value', () => {
  const value = process.env.${DECLARED} ?? '';
  assert.ok(createHash('sha256').update(value).digest('hex') === '${hashOf(GOOD)}', 'the declared variable does not have the expected value');
  assert.equal(process.env.${AMBIENT}, undefined);
});
`,
  );
  return app;
}

interface Driven {
  assembly: Assembly;
  runId: string;
  runDir: string;
}

async function startRun(label: string): Promise<Driven> {
  const root = tmpDir(label);
  const workspace = join(root, 'workspace');
  mkdirSync(workspace);
  const assembly = createAssembly(workspace, { engine: { lockTimeoutMs: 400 } });
  const started = await assembly.start({ request: { path: REQUEST }, appDir: declaringApp(root), profilePath: PROFILE, transportClass: 'SIMULATED' });
  assert.equal(started.code, 'STARTED', JSON.stringify(started));
  const runId = started.run_id as string;
  return { assembly, runId, runDir: join(assembly.runsRoot, runId) };
}

function step(d: Driven): Reply {
  const { engine } = d.assembly;
  const envelope = pendingOf(engine.next(d.runId));
  const accepted = engine.submit(d.runId, JSON.stringify(fakeResult(d.assembly.runsRoot, envelope, 'success')));
  assert.equal(accepted.code, 'ACCEPTED', JSON.stringify(accepted));
  return accepted;
}

// Planning, the scripted decision, and the proof: stops at `implement`.
function toImplement(d: Driven): void {
  const { engine } = d.assembly;
  for (let i = 0; i < 4; i++) step(d);
  const waiting = engine.next(d.runId);
  assert.equal(waiting.code, 'BRIEF_READY');
  assert.equal(engine.decide(d.runId, decision(waiting)).code, 'DECISION_RECORDED');
  step(d);
  assert.equal(engine.status(d.runId).stage, 'implement');
}

const subjects = (d: Driven): Record<string, string> => d.assembly.engine.status(d.runId).subjects as Record<string, string>;
const record = (d: Driven, ref: string): ExecutionRecord => JSON.parse(readFileSync(join(d.runDir, 'artifacts', ref.slice(7)), 'utf8')) as ExecutionRecord;
const eventTypes = (d: Driven): string[] =>
  readFileSync(join(d.runDir, 'journal.jsonl'), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => (JSON.parse(line.slice(65)) as { type: string }).type);

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name));
}

test('RC7 end to end: verification refuses a proof made under another environment, and resumes when it is the same again', async () => {
  const before = { [DECLARED]: process.env[DECLARED], [AMBIENT]: process.env[AMBIENT] };
  try {
    process.env[DECLARED] = GOOD;
    delete process.env[AMBIENT];
    const d = await startRun('rc7-proof-env');
    const { engine } = d.assembly;
    toImplement(d);
    const baseline = record(d, subjects(d).proof_baseline as string);
    assert.equal(baseline.classification.outcome, 'VALID');
    assert.ok((baseline.environment.variables as string).split(',').includes(DECLARED));
    assert.match(baseline.environment.variables_digest as string, /^sha256:[0-9a-f]{64}$/);
    step(d);
    assert.equal(engine.status(d.runId).stage, 'verify');

    // The declared variable changes after the proof was established.
    process.env[DECLARED] = BAD;
    const eventsBefore = eventTypes(d).length;
    const refused = engine.next(d.runId);
    assert.equal(refused.ok, false);
    assert.equal(refused.code, 'PROOF_ENVIRONMENT_CHANGED', JSON.stringify(refused));
    assert.equal(engine.status(d.runId).stage, 'verify', 'no transition');
    assert.equal(eventTypes(d).length, eventsBefore, 'nothing was recorded');
    assert.equal(subjects(d).verification, undefined);
    assert.equal(readdirSync(join(d.runDir, 'exec')).filter((n) => n.startsWith('verify-')).length, 0, 'the candidate was not run in the other environment');

    // An unrelated variable is not part of the environment: with the declared value back, verification runs.
    process.env[DECLARED] = GOOD;
    process.env[AMBIENT] = 'irrelevant';
    assert.equal(engine.next(d.runId).code, 'VERIFICATION_PASSED');
    const verification = record(d, subjects(d).verification as string);
    assert.deepEqual(verification.environment, baseline.environment);
    step(d);
    assert.equal(engine.status(d.runId).stage, 'proposal');

    // Changed again before the proposal: the verification no longer stands, and
    // it is not re-established under an environment the proof was not made in.
    process.env[DECLARED] = BAD;
    const stale = engine.next(d.runId);
    assert.equal(stale.code, 'EVIDENCE_STALE');
    assert.equal(engine.status(d.runId).stage, 'verify');
    assert.equal(engine.next(d.runId).code, 'PROOF_ENVIRONMENT_CHANGED');
    assert.ok(!existsSync(join(d.runDir, 'proposal')), 'no proposal on stale evidence');

    // Restored: verification and review are established again, then the proposal.
    process.env[DECLARED] = GOOD;
    process.env[AMBIENT] = 'changed again';
    assert.equal(engine.next(d.runId).code, 'VERIFICATION_PASSED');
    step(d);
    assert.equal(engine.next(d.runId).code, 'PROPOSAL_READY');

    // Neither value was retained anywhere in the run's evidence.
    for (const file of filesUnder(d.runDir)) {
      const text = readFileSync(file, 'latin1');
      assert.ok(!text.includes(GOOD) && !text.includes(BAD), `a declared value is retained in ${file}`);
    }
  } finally {
    for (const [k, v] of Object.entries(before)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test('RC7 end to end: an unrelated change in the parent environment leaves the evidence current', async () => {
  const before = { [DECLARED]: process.env[DECLARED], [AMBIENT]: process.env[AMBIENT] };
  try {
    process.env[DECLARED] = GOOD;
    delete process.env[AMBIENT];
    const d = await startRun('rc7-ambient');
    const { engine } = d.assembly;
    toImplement(d);
    process.env[AMBIENT] = 'one';
    step(d);
    assert.equal(engine.next(d.runId).code, 'VERIFICATION_PASSED');
    process.env[AMBIENT] = 'two';
    step(d);
    process.env[AMBIENT] = 'three';
    assert.equal(engine.next(d.runId).code, 'PROPOSAL_READY');
    assert.ok(!eventTypes(d).includes('verification_invalidated'));
  } finally {
    for (const [k, v] of Object.entries(before)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

// ---------------------------------------------------------------- RC7 follow-up: the runner's worker id
//
// The independent verification found that NODE_TEST_WORKER_ID could be
// declared like an application variable. The parent's value was hashed into
// the environment identity, but the test runner assigns its own value to
// every test process, so the record named a value the test never saw. The
// name belongs to the runner and is refused like its other names. The value
// 999 is a synthetic fixture.

const WORKER = 'NODE_TEST_WORKER_ID';
const WORKER_VALUE = '999';
const REFUSED_WORKER = /^refused: variable \S+ belongs to the test runner and cannot be declared; nothing was run$/;

// A test file that leaves a sentinel when it is executed at all, holding what it saw.
function sentinelApp(label: string): { dir: string; ran: () => boolean; workerSeen: () => string | null } {
  const dir = tmpDir(label);
  mkdirSync(join(dir, 'tests'));
  writeFileSync(join(dir, 'package.json'), '{ "type": "module" }\n');
  writeFileSync(
    join(dir, 'tests', 'sentinel.test.js'),
    `import { writeFileSync } from 'node:fs';
import { test } from 'node:test';
test('sentinel', () => {
  writeFileSync(new URL('../ran.json', import.meta.url), JSON.stringify({ worker: process.env.${WORKER} ?? null }));
});
`,
  );
  const file = join(dir, 'ran.json');
  return { dir, ran: () => existsSync(file), workerSeen: () => (JSON.parse(readFileSync(file, 'utf8')) as { worker: string | null }).worker };
}

test('RC7 follow-up: the worker id the test runner assigns cannot be declared; the executor refuses before spawning and no test runs', () => {
  const executor = createNodeTestExecutor();
  // Declared with a parent value, declared with none, and declared in other spellings.
  for (const [declared, parent] of [
    [WORKER, WORKER_VALUE],
    [WORKER, undefined],
    ['node_test_worker_id', WORKER_VALUE],
    ['Node_Test_Worker_Id', WORKER_VALUE],
    ['Node_Test_Worker_Id', undefined],
  ] as const) {
    const what = `${declared}, parent value ${parent ?? 'absent'}`;
    const app = sentinelApp('rc7-worker-declared');
    const refused = withEnv({ [WORKER]: parent }, () => executor.run({ cwd: app.dir, patterns: ['tests/**/*.test.js'], timeoutMs: 60_000, env: [declared] }));
    assert.equal(refused.exit_code, null, what);
    assert.equal(refused.timed_out, false, what);
    assert.deepEqual(refused.tests, [], what);
    assert.match(refused.output, REFUSED_WORKER, what);
    assert.ok(refused.output.includes(` ${declared} `), `${what}: the refusal names the declared variable`);
    assert.equal(app.ran(), false, `${what}: the sentinel shows that no test was executed`);
  }
  // Beside an ordinary declared variable it is refused all the same.
  const mixed = sentinelApp('rc7-worker-mixed');
  const refused = withEnv({ [WORKER]: WORKER_VALUE, [DECLARED]: GOOD }, () => executor.run({ cwd: mixed.dir, patterns: ['tests/**/*.test.js'], timeoutMs: 60_000, env: [DECLARED, WORKER] }));
  assert.equal(refused.exit_code, null);
  assert.match(refused.output, REFUSED_WORKER);
  assert.equal(mixed.ran(), false);
});

test('RC7 follow-up control: without that declaration a run is valid, and a parent worker id is neither passed on nor part of the identity', () => {
  const executor = createNodeTestExecutor();
  // The configuration contract knows no runner: there the name is only a well-formed variable name.
  // The refusal is the executor's, which owns the runner.
  assert.ok(parseAppConfig(configWith(undefined)).ok);
  assert.ok(parseAppConfig(configWith([DECLARED])).ok);
  assert.ok(parseAppConfig(configWith([WORKER])).ok);

  const app = sentinelApp('rc7-worker-undeclared');
  const request = { cwd: app.dir, patterns: ['tests/**/*.test.js'], timeoutMs: 60_000, env: [DECLARED] };
  const withParent = withEnv({ [WORKER]: WORKER_VALUE, [DECLARED]: GOOD }, () => ({ outcome: executor.run(request), identity: executor.environment([DECLARED]) }));
  assert.equal(withParent.outcome.exit_code, 0, withParent.outcome.output);
  assert.equal(app.ran(), true, 'the test ran');
  assert.notEqual(app.workerSeen(), WORKER_VALUE, 'the test does not see the parent value; the number it sees is assigned by the runner');
  assert.ok(!(withParent.identity.variables as string).split(',').includes(WORKER), 'an undeclared name is not in the identity');
  assert.deepEqual(withParent.outcome.environment, withParent.identity);
  // The parent's worker id changes nothing: with it absent, the identity is the same.
  const withoutParent = withEnv({ [WORKER]: undefined, [DECLARED]: GOOD }, () => executor.environment([DECLARED]));
  assert.deepEqual(withoutParent, withParent.identity);
});

// The synthetic application declaring the runner's worker id, with an existing
// test that leaves a sentinel wherever it is executed.
function workerDeclaringApp(root: string, spelling: string): string {
  const app = join(root, 'app');
  cpSync(APP, app, { recursive: true });
  const file = join(app, 'rstack.app.json');
  const config = JSON.parse(readFileSync(file, 'utf8')) as { test: { env?: string[] } };
  config.test.env = [spelling];
  writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  writeFileSync(
    join(app, 'tests', 'sentinel.test.js'),
    `import { writeFileSync } from 'node:fs';
import { test } from 'node:test';
test('existing: leaves a sentinel when executed', () => {
  writeFileSync(new URL('../rc7-worker-sentinel.json', import.meta.url), '{}');
});
`,
  );
  return app;
}

test('RC7 follow-up end to end: an application that declares the worker id of the test runner cannot establish a proof', async () => {
  const before = process.env[WORKER];
  try {
    for (const spelling of [WORKER, 'Node_Test_Worker_Id']) {
      process.env[WORKER] = WORKER_VALUE;
      const root = tmpDir('rc7-worker-engine');
      const workspace = join(root, 'workspace');
      mkdirSync(workspace);
      const assembly = createAssembly(workspace, { engine: { lockTimeoutMs: 400 } });
      // The declaration is well-formed for the runner-neutral configuration, so the run starts.
      const started = await assembly.start({ request: { path: REQUEST }, appDir: workerDeclaringApp(root, spelling), profilePath: PROFILE, transportClass: 'SIMULATED' });
      assert.equal(started.code, 'STARTED', JSON.stringify(started));
      const d: Driven = { assembly, runId: started.run_id as string, runDir: join(assembly.runsRoot, started.run_id as string) };
      const { engine } = assembly;
      for (let i = 0; i < 4; i++) step(d);
      const waiting = engine.next(d.runId);
      assert.equal(waiting.code, 'BRIEF_READY');
      assert.equal(engine.decide(d.runId, decision(waiting)).code, 'DECISION_RECORDED');
      assert.equal(engine.status(d.runId).stage, 'proof');

      // The tester's result arrives; the engine's own baseline run is refused by the executor.
      const envelope = pendingOf(engine.next(d.runId));
      const eventsBefore = eventTypes(d).length;
      const refused = engine.submit(d.runId, JSON.stringify(fakeResult(assembly.runsRoot, envelope, 'success')));
      assert.equal(refused.ok, false, `${spelling}: ${JSON.stringify(refused)}`);
      assert.equal(refused.code, 'PROOF_SETUP_FAILURE', spelling);
      const detail = refused.detail as { execution: string; issues: string[] };
      assert.ok(detail.issues.includes('the test command did not exit normally') && detail.issues.includes('no test was reported'), spelling);
      const baseline = record(d, detail.execution);
      assert.equal(baseline.exit_code, null, spelling);
      assert.deepEqual(baseline.tests, [], spelling);
      assert.match(readFileSync(join(d.runDir, 'artifacts', baseline.output.slice(7)), 'utf8'), REFUSED_WORKER, spelling);

      // No proof was accepted, nothing moved, and no test of the application was executed.
      assert.equal(eventTypes(d).length, eventsBefore, `${spelling}: nothing was recorded`);
      assert.equal(engine.status(d.runId).stage, 'proof', spelling);
      assert.equal(subjects(d).proof, undefined, spelling);
      assert.equal(subjects(d).proof_baseline, undefined, spelling);
      assert.equal(filesUnder(d.runDir).filter((f) => f.endsWith('rc7-worker-sentinel.json')).length, 0, `${spelling}: the sentinel shows that no test was executed`);
      // The run cannot go on to a candidate or a proposal from here.
      assert.equal(engine.next(d.runId).code, 'PENDING_IN_FLIGHT', spelling);
      assert.ok(!existsSync(join(d.runDir, 'proposal')), spelling);
    }
  } finally {
    if (before === undefined) delete process.env[WORKER];
    else process.env[WORKER] = before;
  }
});
