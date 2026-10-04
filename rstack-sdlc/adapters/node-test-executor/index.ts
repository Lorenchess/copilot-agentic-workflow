// Runs an application's tests with the Node test runner in a child process
// and normalizes its TAP report. This is actual local execution of whatever
// code is in the directory, with this user's permissions and no sandbox.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { testPatternProblem } from '../../core/contracts/app.ts';
import type { ExecutionOutcome, ExecutionRequest, TestExecutor, TestOutcome } from '../../core/contracts/ports.ts';

const RESULT = /^(ok|not ok) \d+ - (.*)$/;
const NESTED_RESULT = /^ +(?:ok|not ok) \d+ /;
// The runner writes a "#" inside a test name as "\#", so " # " starts a directive.
const DIRECTIVE = /^(.*?) # (SKIP|TODO)\b/;

// Top-level results only. A result line is followed by an indented block that
// ends with "  ..."; `code` and `exitCode` in it tell the failure kinds apart,
// and `type` tells a test from a suite. Results nested under an entry are not
// reported themselves; they make that entry a container.
export function parseTap(output: string): TestOutcome[] {
  const tests: TestOutcome[] = [];
  const lines = output.replaceAll('\r\n', '\n').split('\n');
  let nested = false;
  for (let i = 0; i < lines.length; i++) {
    const m = RESULT.exec(lines[i] as string);
    if (!m) {
      if (NESTED_RESULT.test(lines[i] as string)) nested = true;
      continue;
    }
    let code: string | null = null;
    let type: string | null = null;
    let fileLevel = false;
    if (lines[i + 1] === '  ---') {
      // The block is skipped as a whole, so text inside it is never read as a result.
      for (i += 2; i < lines.length && (lines[i] as string).startsWith('  '); i++) {
        const line = lines[i] as string;
        if (line === '  ...') break;
        const c = /^  code: '([A-Z_]+)'$/.exec(line);
        if (c) code = c[1] as string;
        const t = /^  type: '([a-z]+)'$/.exec(line);
        if (t) type = t[1] as string;
        if (/^  exitCode: /.test(line)) fileLevel = true;
      }
    }
    const directive = DIRECTIVE.exec(m[2] as string);
    const status = directive ? (directive[2] as 'SKIP' | 'TODO') : m[1] === 'not ok' ? 'FAIL' : 'PASS';
    tests.push({
      name: directive ? (directive[1] as string) : (m[2] as string),
      // Only what the runner itself marks as one test, with nothing nested in it, is a test.
      kind: type === 'test' && !nested ? 'TEST' : 'CONTAINER',
      status,
      failure_kind: status !== 'FAIL' ? null : fileLevel ? 'LOAD' : code === 'ERR_ASSERTION' ? 'ASSERTION' : 'ERROR',
    });
    nested = false;
  }
  return tests;
}

// The child's environment is built from nothing: these names and the names
// the application declares, each with the parent's current value. No other
// variable of the parent reaches the tests. On Windows the list is the set
// the platform copies into every child process anyway; naming it makes those
// values part of the identity instead of an untracked inheritance.
const WINDOWS = process.platform === 'win32';
const RUNTIME_VARIABLES = WINDOWS
  ? ['HOMEDRIVE', 'HOMEPATH', 'LOGONSERVER', 'PATH', 'SYSTEMDRIVE', 'SYSTEMROOT', 'TEMP', 'USERDOMAIN', 'USERNAME', 'USERPROFILE', 'WINDIR']
  : ['HOME', 'PATH', 'TMPDIR'];
// These belong to the test runner: they change its behavior or report format,
// or the runner assigns them itself in every test process, so a declared value
// would not be the one a test sees. An application cannot declare them.
const RUNNER_VARIABLES = ['NODE_OPTIONS', 'NODE_TEST_CONTEXT', 'NODE_TEST_WORKER_ID'];
const fold = (name: string): string => (WINDOWS ? name.toUpperCase() : name);

// The identity names every variable and carries one digest over all names
// and values. No value is kept. A digest does not hide a value that can be
// guessed: anyone holding the record can test guesses against it.
function childEnvironment(declared: readonly string[]): { env: Record<string, string>; identity: Record<string, string> } {
  const names = [...new Set([...RUNTIME_VARIABLES, ...declared].map(fold))].sort();
  const env: Record<string, string> = {};
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined) env[name] = value;
  }
  const digest = createHash('sha256').update(JSON.stringify(names.map((name) => [name, env[name] ?? null]))).digest('hex');
  return {
    env,
    identity: {
      runtime: 'node',
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      variables: names.join(','),
      variables_digest: `sha256:${digest}`,
    },
  };
}

export function createNodeTestExecutor(): TestExecutor {
  return {
    id: 'node-test',
    environment: (declared = []) => childEnvironment(declared).identity,
    run(request: ExecutionRequest): ExecutionOutcome {
      const args = ['--test', '--test-reporter=tap', ...request.patterns];
      const declared = request.env ?? [];
      const { env, identity } = childEnvironment(declared);
      // Checked again here, whatever validated the request: nothing is run for
      // a pattern that could name a file outside `cwd`, or for a runner variable.
      const refusal =
        request.patterns.map((p) => (testPatternProblem(p) ? `test pattern ${JSON.stringify(p)} ${testPatternProblem(p)}` : null)).find((r) => r !== null) ??
        declared.filter((name) => RUNNER_VARIABLES.includes(name.toUpperCase())).map((name) => `variable ${name} belongs to the test runner and cannot be declared`)[0];
      if (refusal) {
        return { command: ['node', ...args], exit_code: null, timed_out: false, duration_ms: 0, output: `refused: ${refusal}; nothing was run`, tests: [], environment: identity };
      }
      const started = Date.now();
      const r = spawnSync(process.execPath, args, {
        cwd: request.cwd,
        env,
        encoding: 'utf8',
        timeout: request.timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
        windowsHide: true,
      });
      const output = `${r.stdout ?? ''}${r.stderr ? `\n--- stderr ---\n${r.stderr}` : ''}`;
      return {
        command: ['node', ...args],
        exit_code: r.status,
        timed_out: (r.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT',
        duration_ms: Date.now() - started,
        output,
        tests: parseTap(r.stdout ?? ''),
        environment: identity,
      };
    },
  };
}
