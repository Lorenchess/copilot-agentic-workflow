// RC1: only a test that actually ran can prove a criterion. A skipped or
// TODO test has an `ok` line in the report, and a suite has one for the
// tests inside it; neither is a passing executed test.
//
// Evidence classes: the executions are ACTUAL (real child processes of the
// Node test runner). Role results are SIMULATED and decisions are SCRIPTED.

import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createNodeTestExecutor, parseTap } from '../adapters/node-test-executor/index.ts';
import type { Proof } from '../core/contracts/app.ts';
import type { ExecutionOutcome, TestOutcome } from '../core/contracts/ports.ts';
import { classifyBaseline, classifyVerification } from '../core/engine/execution.ts';
import { type TestRun, decision, eventTypes, newRun, pendingOf, result, tmpDir, toHumanWait } from './support/harness.ts';

const block = (type: string, indent = ''): string[] => [`${indent}  ---`, `${indent}  duration_ms: 1`, `${indent}  type: '${type}'`, `${indent}  ...`];

// The report shapes below are the ones Node 24 prints; the child-process
// tests further down check that against the real runner.
const REPORT = [
  'TAP version 13',
  '# Subtest: leaf pass',
  'ok 1 - leaf pass',
  ...block('test'),
  '# Subtest: leaf fail',
  'not ok 2 - leaf fail',
  '  ---',
  "  type: 'test'",
  "  failureType: 'testCodeFailure'",
  '  error: |-',
  '    ok 1 - text inside an error message is not a result',
  "  code: 'ERR_ASSERTION'",
  '  ...',
  '# Subtest: leaf skip',
  'ok 3 - leaf skip # SKIP',
  ...block('test'),
  '# Subtest: leaf skip with reason',
  'ok 4 - leaf skip with reason # SKIP because \\# reasons',
  ...block('test'),
  '# Subtest: leaf todo failing',
  'not ok 5 - leaf todo failing # TODO',
  '  ---',
  "  type: 'test'",
  "  code: 'ERR_ASSERTION'",
  '  ...',
  '# Subtest: leaf todo passing',
  'ok 6 - leaf todo passing # TODO later',
  ...block('test'),
  '# Subtest: suite of skips',
  '    # Subtest: never',
  '    ok 1 - never # SKIP',
  ...block('test', '    '),
  '    1..1',
  'ok 7 - suite of skips',
  ...block('suite'),
  '# Subtest: parent test',
  '    # Subtest: sub',
  '    ok 1 - sub',
  ...block('test', '    '),
  '    1..1',
  'ok 8 - parent test',
  ...block('test'),
  '# Subtest: empty suite',
  'ok 9 - empty suite',
  ...block('suite'),
  '# Subtest: after a parent',
  'ok 10 - after a parent',
  ...block('test'),
  '# Subtest: name ending \\# SKIP',
  'ok 11 - name ending \\# SKIP',
  ...block('test'),
  '1..11',
].join('\n');

test('RC1: the report tells an executed test from a skipped one, a TODO, and a container', () => {
  assert.deepEqual(parseTap(REPORT), [
    { name: 'leaf pass', kind: 'TEST', status: 'PASS', failure_kind: null },
    { name: 'leaf fail', kind: 'TEST', status: 'FAIL', failure_kind: 'ASSERTION' },
    { name: 'leaf skip', kind: 'TEST', status: 'SKIP', failure_kind: null },
    { name: 'leaf skip with reason', kind: 'TEST', status: 'SKIP', failure_kind: null },
    { name: 'leaf todo failing', kind: 'TEST', status: 'TODO', failure_kind: null },
    { name: 'leaf todo passing', kind: 'TEST', status: 'TODO', failure_kind: null },
    { name: 'suite of skips', kind: 'CONTAINER', status: 'PASS', failure_kind: null },
    { name: 'parent test', kind: 'CONTAINER', status: 'PASS', failure_kind: null },
    { name: 'empty suite', kind: 'CONTAINER', status: 'PASS', failure_kind: null },
    // A container does not make the test after it one, and an escaped "#" in a name is not a directive.
    { name: 'after a parent', kind: 'TEST', status: 'PASS', failure_kind: null },
    { name: 'name ending \\# SKIP', kind: 'TEST', status: 'PASS', failure_kind: null },
  ]);
  // A result the runner did not mark as one test is not treated as one.
  assert.deepEqual(parseTap('ok 1 - untyped\n  ---\n  duration_ms: 1\n  ...\n'), [{ name: 'untyped', kind: 'CONTAINER', status: 'PASS', failure_kind: null }]);
});

const proofOf = (...criteria: [string, Proof['criteria'][number]['route'], string][]): Proof => ({
  schema_version: 1,
  record_type: 'proof',
  criteria: criteria.map(([criterion, route, name]) => ({ criterion, route, tests: [name], rationale: 'fixture' })),
});
const outcomeOf = (exit: number, tests: TestOutcome[]): ExecutionOutcome =>
  ({ command: [], exit_code: exit, timed_out: false, duration_ms: 1, output: '', tests }) as unknown as ExecutionOutcome;
const leaf = (name: string, status: TestOutcome['status'], failure: TestOutcome['failure_kind'] = null): TestOutcome =>
  ({ name, kind: 'TEST', status, failure_kind: failure }) as TestOutcome;
const container = (name: string, status: TestOutcome['status']): TestOutcome => ({ name, kind: 'CONTAINER', status, failure_kind: null }) as TestOutcome;

test('RC1: a criterion is proven only by an executed top-level test', () => {
  // Passing and failing leaves keep their meaning.
  const good = proofOf(['AC-1', 'RED_GREEN', 'red'], ['AC-2', 'ALREADY_SATISFIED', 'green']);
  assert.deepEqual(classifyBaseline(good, outcomeOf(1, [leaf('red', 'FAIL', 'ASSERTION'), leaf('green', 'PASS')])), { outcome: 'VALID', issues: [] });
  assert.deepEqual(classifyVerification(good, outcomeOf(0, [leaf('red', 'PASS'), leaf('green', 'PASS')])), { outcome: 'PASS', issues: [] });
  assert.equal(classifyVerification(good, outcomeOf(1, [leaf('red', 'FAIL', 'ASSERTION'), leaf('green', 'PASS')])).outcome, 'FAIL');

  const one = proofOf(['AC-1', 'ALREADY_SATISFIED', 'named']);
  for (const [reported, expected] of [
    [leaf('named', 'SKIP'), /AC-1: test "named" was skipped/],
    [leaf('named', 'TODO'), /AC-1: test "named" is marked TODO/],
    [container('named', 'PASS'), /AC-1: "named" is a suite or holds nested tests/],
    [container('named', 'SKIP'), /AC-1: "named" is a suite or holds nested tests/],
  ] as const) {
    const baseline = classifyBaseline(one, outcomeOf(0, [reported, leaf('other', 'PASS')]));
    assert.equal(baseline.outcome, 'SETUP_FAILURE', `${reported.kind} ${reported.status}`);
    assert.match(baseline.issues.join('\n'), expected);
    const verification = classifyVerification(one, outcomeOf(0, [reported, leaf('other', 'PASS')]));
    assert.equal(verification.outcome, 'FAIL', `${reported.kind} ${reported.status}`);
    assert.match(verification.issues.join('\n'), expected);
  }
  // A skipped test cannot be the red of a RED_GREEN criterion either.
  assert.equal(classifyBaseline(proofOf(['AC-1', 'RED_GREEN', 'named']), outcomeOf(0, [leaf('named', 'SKIP')])).outcome, 'SETUP_FAILURE');

  // Mixed pass and skip: a skipped test outside the proof does not stand in
  // for anything and does not fail the run; a skipped proof test does.
  const mixed = [leaf('named', 'PASS'), leaf('existing, skipped', 'SKIP'), container('existing suite', 'PASS')];
  assert.deepEqual(classifyBaseline(one, outcomeOf(0, mixed)), { outcome: 'VALID', issues: [] });
  assert.deepEqual(classifyVerification(one, outcomeOf(0, mixed)), { outcome: 'PASS', issues: [] });
  assert.equal(classifyVerification(one, outcomeOf(0, [leaf('named', 'SKIP'), leaf('other', 'PASS')])).outcome, 'FAIL');
  // A nested test is not reported under its own name, so naming one is refused.
  const nested = classifyBaseline(proofOf(['AC-1', 'ALREADY_SATISFIED', 'sub']), outcomeOf(0, [container('parent test', 'PASS')]));
  assert.equal(nested.outcome, 'SETUP_FAILURE');
  assert.match(nested.issues.join('\n'), /AC-1: test "sub" was not reported by the run/);
});

function fixtureApp(label: string, source: string): string {
  const dir = tmpDir(label);
  mkdirSync(join(dir, 'tests'));
  writeFileSync(join(dir, 'package.json'), '{ "type": "module" }\n');
  writeFileSync(join(dir, 'tests', 'a.test.js'), source);
  return dir;
}

test('RC1 actual execution: skip, TODO, and suites as the real runner reports them cannot satisfy a criterion', () => {
  const dir = fixtureApp(
    'rc1-real',
    `import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';
test('executed', () => { assert.equal(1, 1); });
test('direct skip', { skip: true }, () => { throw new Error('never run'); });
test('runtime skip', (t) => { t.skip('decided while running'); });
test.todo('todo failing', () => { assert.equal(1, 2); });
test('todo passing', { todo: true }, () => {});
describe('all skipped suite', () => { it.skip('never', () => { throw new Error('never run'); }); });
describe('mixed suite', () => { it('inner pass', () => {}); it.skip('inner skip', () => {}); });
test('parent', async (t) => { await t.test('sub', () => {}); });
`,
  );
  const outcome = createNodeTestExecutor().run({ cwd: dir, patterns: ['tests/**/*.test.js'], timeoutMs: 60_000 });
  assert.equal(outcome.exit_code, 0, 'the runner itself is satisfied, which is the trap');
  assert.deepEqual(
    outcome.tests.map((t) => [t.name, t.kind, t.status]),
    [
      ['executed', 'TEST', 'PASS'],
      ['direct skip', 'TEST', 'SKIP'],
      ['runtime skip', 'TEST', 'SKIP'],
      ['todo failing', 'TEST', 'TODO'],
      ['todo passing', 'TEST', 'TODO'],
      ['all skipped suite', 'CONTAINER', 'PASS'],
      ['mixed suite', 'CONTAINER', 'PASS'],
      ['parent', 'CONTAINER', 'PASS'],
    ],
  );
  assert.deepEqual(classifyVerification(proofOf(['AC-1', 'ALREADY_SATISFIED', 'executed']), outcome), { outcome: 'PASS', issues: [] });
  for (const name of ['direct skip', 'runtime skip', 'todo failing', 'todo passing', 'all skipped suite', 'mixed suite', 'parent', 'inner pass', 'sub']) {
    const proof = proofOf(['AC-1', 'ALREADY_SATISFIED', name]);
    assert.equal(classifyBaseline(proof, outcome).outcome, 'SETUP_FAILURE', name);
    assert.equal(classifyVerification(proof, outcome).outcome, 'FAIL', name);
  }
});

async function atProof(label: string): Promise<TestRun> {
  const run = await newRun(label);
  assert.equal(run.assembly.engine.decide(run.runId, decision(toHumanWait(run))).code, 'DECISION_RECORDED');
  assert.equal(run.assembly.engine.status(run.runId).stage, 'proof');
  return run;
}

const alreadySatisfied = (names: string[]): Proof => ({
  schema_version: 1,
  record_type: 'proof',
  criteria: names.map((name, i) => ({ criterion: `AC-${i + 1}`, route: 'ALREADY_SATISFIED', tests: [name], rationale: 'Fixture: no assertion behind this name is executed.' })),
});

// The audit's counterexample: the application is unchanged, every criterion
// is mapped to a name the runner reports as `ok`, and nothing was asserted.
test('RC1 end to end: a proof made of unexecuted tests is refused before implementation', async () => {
  const names = ['criterion 1', 'criterion 2', 'criterion 3'];
  const shapes: Record<string, string> = {
    'suites holding only it.skip': `import { describe, it } from 'node:test';\n${names.map((n) => `describe('${n}', () => { it.skip('assertion never executed', () => { throw new Error('never run'); }); });`).join('\n')}\n`,
    'directly skipped tests': `import { test } from 'node:test';\n${names.map((n) => `test('${n}', { skip: true }, () => { throw new Error('never run'); });`).join('\n')}\n`,
    'TODO tests': `import { test } from 'node:test';\n${names.map((n) => `test.todo('${n}', () => { throw new Error('not expected to hold yet'); });`).join('\n')}\n`,
  };
  for (const [shape, source] of Object.entries(shapes)) {
    const run = await atProof('rc1-unexecuted');
    const { engine } = run.assembly;
    const envelope = pendingOf(engine.next(run.runId));
    const raw = result(envelope);
    writeFileSync(join(run.runDir, envelope.app_dir as string, 'tests', 'controlled', 'pause-exports.test.js'), source);
    writeFileSync(join(run.runDir, envelope.work_dir, 'proof.json'), JSON.stringify(alreadySatisfied(names)));

    const refused = engine.submit(run.runId, raw);
    assert.equal(refused.ok, false, shape);
    assert.equal(refused.code, 'PROOF_SETUP_FAILURE', shape);
    const detail = refused.detail as { execution: string; issues: string[] };
    assert.equal(detail.issues.length, 3, shape);
    const record = JSON.parse(readFileSync(join(run.runDir, 'artifacts', detail.execution.slice(7)), 'utf8')) as { exit_code: number; classification: { outcome: string } };
    assert.equal(record.exit_code, 0, 'the real run exited 0; the refusal comes from what was executed');
    assert.equal(record.classification.outcome, 'SETUP_FAILURE');

    // No transition: nothing reaches implementation, verification, or a proposal.
    const status = engine.status(run.runId);
    assert.equal(status.stage, 'proof', shape);
    const subjects = status.subjects as Record<string, string>;
    assert.equal(subjects.proof, undefined);
    assert.equal(subjects.proof_baseline, undefined);
    assert.equal(eventTypes(run).filter((t) => t === 'result_accepted').length, 4, 'only the four planning results');
    assert.equal(engine.next(run.runId).code, 'PENDING_IN_FLIGHT', 'the tester attempt is still the pending one');
  }
});

test('RC1 end to end: executed top-level tests are still accepted as a proof', async () => {
  const run = await atProof('rc1-executed');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'ACCEPTED');
  assert.equal(engine.status(run.runId).stage, 'implement');
});
