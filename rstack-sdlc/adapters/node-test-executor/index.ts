// Runs an application's tests with the Node test runner in a child process
// and normalizes its TAP report. This is actual local execution of whatever
// code is in the directory, with this user's permissions and no sandbox.

import { spawnSync } from 'node:child_process';
import type { ExecutionOutcome, ExecutionRequest, TestExecutor, TestOutcome } from '../../core/contracts/ports.ts';

const RESULT = /^(ok|not ok) \d+ - (.*)$/;

// Top-level results only. A result line is followed by an indented block that
// ends with "  ..."; `code` and `exitCode` in it tell the failure kinds apart.
export function parseTap(output: string): TestOutcome[] {
  const tests: TestOutcome[] = [];
  const lines = output.replaceAll('\r\n', '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = RESULT.exec(lines[i] as string);
    if (!m) continue;
    let code: string | null = null;
    let fileLevel = false;
    for (let j = i + 1; j < lines.length && (lines[j] as string).startsWith('  '); j++) {
      const line = lines[j] as string;
      if (line === '  ...') break;
      const c = /^  code: '([A-Z_]+)'$/.exec(line);
      if (c) code = c[1] as string;
      if (/^  exitCode: /.test(line)) fileLevel = true;
    }
    const failed = m[1] === 'not ok';
    tests.push({
      name: m[2] as string,
      status: failed ? 'FAIL' : 'PASS',
      failure_kind: !failed ? null : fileLevel ? 'LOAD' : code === 'ERR_ASSERTION' ? 'ASSERTION' : 'ERROR',
    });
  }
  return tests;
}

export function createNodeTestExecutor(): TestExecutor {
  return {
    id: 'node-test',
    environment: () => ({ runtime: 'node', version: process.version, platform: process.platform, arch: process.arch }),
    run(request: ExecutionRequest): ExecutionOutcome {
      const args = ['--test', '--test-reporter=tap', ...request.patterns];
      // The child must not inherit this process's test-runner or option state,
      // or its report would be in another format.
      const env = { ...process.env };
      delete env.NODE_TEST_CONTEXT;
      delete env.NODE_OPTIONS;
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
      };
    },
  };
}
