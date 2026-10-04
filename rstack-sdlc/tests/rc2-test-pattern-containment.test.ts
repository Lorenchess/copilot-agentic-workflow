// RC2: a test pattern from the application configuration is expanded under
// the measured application copy and nowhere else. A pattern that could name
// a file outside it is refused before anything runs; it is never rewritten
// into another target.
//
// Evidence class: the executor cases are ACTUAL child-process executions.

import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { createNodeTestExecutor } from '../adapters/node-test-executor/index.ts';
import { parseAppConfig } from '../core/contracts/app.ts';
import { createAssembly } from '../scripts/assembly.ts';
import { APP, PROFILE, REQUEST, tmpDir } from './support/harness.ts';

const configWith = (patterns: unknown[]): string =>
  JSON.stringify({
    schema_version: 1,
    record_type: 'app-config',
    test: { runner: 'node-test', patterns, timeout_seconds: 60 },
    controlled_tests_dir: 'tests/controlled',
    protected: ['rstack.app.json'],
  });

// Forms that leave the tree, or that only stay inside it after normalization.
const ESCAPES = [
  'x/../../outside.test.js',
  'tests/../../*.test.js',
  'tests/**/../../outside.test.js',
  'tests/..',
  '../outside.test.js',
  '..',
  'tests/./a.test.js',
  'tests//a.test.js',
  'tests/a.test.js/',
  'tests/.hidden/a.test.js',
  'tests/.../a.test.js',
  '/outside.test.js',
  '//server/share/outside.test.js',
  'C:/outside.test.js',
  'C:outside.test.js',
  'tests\\..\\..\\outside.test.js',
  '..\\outside.test.js',
  'C:\\outside.test.js',
  '\\\\server\\share\\outside.test.js',
  '\\outside.test.js',
  '--test-only',
];

const VALID = ['tests/**/*.test.js', 'tests/a.test.js', 'tests/unit/deep/*.test.js', 'tests/*/unit/*.test.js', 'src/**/__tests__/*.js', 'tests/a..b/x.test.js'];

test('RC2: the application configuration refuses a test pattern that can leave the application tree', () => {
  for (const pattern of ESCAPES) {
    const parsed = parseAppConfig(configWith([pattern]));
    assert.equal(parsed.ok, false, `accepted: ${pattern}`);
    assert.match(parsed.ok ? '' : parsed.issues.join('\n'), /app\.test\.patterns\[0\]/, pattern);
  }
  // One bad pattern among good ones refuses the configuration.
  assert.equal(parseAppConfig(configWith(['tests/**/*.test.js', 'x/../../outside.test.js'])).ok, false);
  for (const pattern of VALID) {
    const parsed = parseAppConfig(configWith([pattern]));
    assert.ok(parsed.ok, `refused: ${pattern}: ${parsed.ok ? '' : parsed.issues.join('; ')}`);
  }
});

// inside/ is the execution directory; the sentinel next to it records being run.
function fixture(label: string): { root: string; inside: string; ran: string } {
  const root = tmpDir(label);
  const inside = join(root, 'inside');
  mkdirSync(join(inside, 'x'), { recursive: true });
  mkdirSync(join(inside, 'tests', 'unit', 'deep'), { recursive: true });
  writeFileSync(join(root, 'package.json'), '{ "type": "module" }\n');
  writeFileSync(
    join(root, 'outside.test.js'),
    "import { writeFileSync } from 'node:fs';\nimport { test } from 'node:test';\nwriteFileSync(new URL('./outside-ran.txt', import.meta.url), 'ran');\ntest('outside witness', () => {});\n",
  );
  writeFileSync(join(inside, 'tests', 'top.test.js'), "import { test } from 'node:test';\ntest('inside top', () => {});\n");
  writeFileSync(join(inside, 'tests', 'unit', 'deep', 'nested.test.js'), "import { test } from 'node:test';\ntest('inside nested', () => {});\n");
  return { root, inside, ran: join(root, 'outside-ran.txt') };
}

test('RC2 actual execution: the executor refuses an escaping pattern and the outside test never runs', () => {
  const f = fixture('rc2-executor');
  const executor = createNodeTestExecutor();
  const outside = join(f.root, 'outside.test.js');
  const absolute = [outside, outside.replaceAll('\\', '/'), outside.replace(/^[A-Za-z]:/, ''), resolve(f.inside, '..', 'outside.test.js')];
  for (const pattern of [...ESCAPES, ...absolute, '..\\*.test.js', '../*.test.js']) {
    // A valid pattern in the same request does not get the others through.
    const outcome = executor.run({ cwd: f.inside, patterns: ['tests/**/*.test.js', pattern], timeoutMs: 60_000 });
    assert.equal(existsSync(f.ran), false, `the outside test ran for: ${pattern}`);
    assert.equal(outcome.exit_code, null, `not refused: ${pattern}`);
    assert.deepEqual(outcome.tests, [], pattern);
    assert.match(outcome.output, /^refused: /, pattern);
  }
  assert.equal(existsSync(f.ran), false);

  // Valid nested globs still run, and only what is inside.
  const outcome = executor.run({ cwd: f.inside, patterns: ['tests/**/*.test.js'], timeoutMs: 60_000 });
  assert.equal(outcome.exit_code, 0, outcome.output);
  assert.deepEqual(outcome.tests.map((t) => [t.name, t.status]).sort(), [
    ['inside nested', 'PASS'],
    ['inside top', 'PASS'],
  ]);
  const single = executor.run({ cwd: f.inside, patterns: ['tests/unit/deep/*.test.js'], timeoutMs: 60_000 });
  assert.deepEqual(single.tests.map((t) => t.name), ['inside nested']);
  assert.equal(existsSync(f.ran), false);
});

test('RC2: a run is not started for an application whose test pattern escapes its tree', async () => {
  const root = tmpDir('rc2-start');
  const app = join(root, 'app');
  cpSync(APP, app, { recursive: true });
  const file = join(app, 'rstack.app.json');
  const config = JSON.parse(readFileSync(file, 'utf8')) as { test: { patterns: string[] } };
  config.test.patterns = ['tests/../../outside.test.js'];
  writeFileSync(file, JSON.stringify(config));
  const workspace = join(root, 'workspace');
  mkdirSync(workspace);
  const assembly = createAssembly(workspace, { engine: { lockTimeoutMs: 400 } });
  const refused = await assembly.start({ request: { path: REQUEST }, appDir: app, profilePath: PROFILE, transportClass: 'SIMULATED' });
  assert.equal(refused.ok, false);
  assert.equal(refused.directive?.kind === 'BLOCKED' ? refused.directive.blocker : refused.code, 'INVALID_APPLICATION');
  assert.match(JSON.stringify(refused), /app\.test\.patterns\[0\]/);
  assert.ok(!existsSync(assembly.runsRoot) || readdirSync(assembly.runsRoot).length === 0, 'no run was created');
});
