// RC9: what a human said reaches the engine byte for byte. The text travels
// in a file, so no shell ever parses it; the command line carries only the
// file's path.
//
// Evidence class: engine and command-line tests (offline). The shells are
// real (PowerShell, cmd.exe, Git Bash where present); the texts are harmless
// fixtures and HUMAN_RECORDED here is a fixture claim, not an observed human.
// Nothing shows that a model writes the file faithfully; that is a host check.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import type { Reply } from '../core/engine/engine.ts';
import { CLI, PACKAGE_ROOT, type TestRun, cli, completeStep, journalText, newRun, pendingOf, tmpDir } from './support/harness.ts';

// Everything a shell would rewrite or run if it ever parsed the text.
const HOSTILE =
  'Return the literal text $true when $env:RSTACK_RC9_SENTINEL is "set"; `whoami` | echo \'x\' > rc9-executed.txt & echo %RSTACK_RC9_SENTINEL% ^ $(New-Item rc9-executed.txt) $RSTACK_RC9_SENTINEL !x! \\ \\" — naïve ✓ 日本語';
const ANSWER = `${HOSTILE}\nsecond line\twith a tab\r\nthird line; --answer not-a-flag`;
const RECORDED_BY = 'Ramón "the owner" O\'Neil $true `id` | $env:RSTACK_RC9_SENTINEL ✓';
const REASON = `${HOSTILE}\nthe worker's state is unknown`;
const SENTINEL_ENV = { RSTACK_RC9_SENTINEL: 'EXPANDED' };

interface Event {
  type: string;
  data: Record<string, unknown>;
}
const events = (run: TestRun): Event[] =>
  journalText(run)
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line.slice(65)) as Event);
const lastEvent = (run: TestRun, type: string): Event => {
  const found = events(run).filter((e) => e.type === type).at(-1);
  assert.ok(found, `no ${type} event`);
  return found;
};
const retainedDecision = (run: TestRun): Record<string, unknown> => {
  const ref = lastEvent(run, 'decision_recorded').data.decision_ref as string;
  return JSON.parse(readFileSync(join(run.runDir, 'artifacts', ref.slice(7)), 'utf8')) as Record<string, unknown>;
};

function textFile(dir: string, name: string, text: string | Uint8Array): string {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name);
  writeFileSync(path, text);
  return path;
}

async function atQuestion(label: string): Promise<{ run: TestRun; version: number }> {
  const run = await newRun(label, {}, 'MANUAL_TRANSPORT');
  const asked = completeStep(run, 'open-decision');
  assert.equal(asked.directive?.kind, 'WAIT');
  const version = asked.directive?.kind === 'WAIT' ? asked.directive.expected_version : -1;
  return { run, version };
}

// ---------------------------------------------------------------- shells

interface Shell {
  name: string;
  run: (line: string, cwd: string) => { status: number | null; stdout: string; stderr: string };
}

const env = { ...process.env, ...SENTINEL_ENV };
const available = (command: string, args: string[]): boolean => spawnSync(command, args, { encoding: 'utf8' }).status === 0;

function shells(): Shell[] {
  const list: Shell[] = [{ name: process.platform === 'win32' ? 'cmd.exe' : 'sh', run: (line, cwd) => spawnSync(line, { shell: true, cwd, encoding: 'utf8', env }) }];
  for (const exe of ['powershell.exe', 'pwsh']) {
    if (available(exe, ['-NoProfile', '-NonInteractive', '-Command', 'exit 0'])) {
      list.push({ name: exe, run: (line, cwd) => spawnSync(exe, ['-NoProfile', '-NonInteractive', '-Command', line], { cwd, encoding: 'utf8', env }) });
    }
  }
  const bash = spawnSync('bash', ['-c', 'uname -s'], { encoding: 'utf8' });
  if (process.platform === 'win32' && bash.status === 0 && /^(MINGW|MSYS)/.test(bash.stdout)) {
    list.push({ name: 'Git Bash', run: (line, cwd) => spawnSync('bash', ['-c', line], { cwd, encoding: 'utf8', env }) });
  }
  return list;
}

const forward = (path: string): string => path.replaceAll('\\', '/');
const coordinatorText = readFileSync(join(PACKAGE_ROOT, 'adapters', 'copilot-vscode', 'coordinator.md'), 'utf8');

// A command line as the coordinator text documents it, with the launcher and
// each placeholder filled the way the text says: full paths in double quotes.
function documented(name: string, run: TestRun, values: Record<string, string>): string {
  const block = /```text\n([\s\S]*?)\n```/.exec(coordinatorText);
  assert.ok(block);
  const line = (block[1] as string).split('\n').find((l) => l.startsWith(`{{ENGINE}} ${name} `));
  assert.ok(line, `the coordinator documents "${name}"`);
  return line
    .replace('{{ENGINE}}', `node "${forward(CLI)}"`)
    .replace('{{WORKSPACE}}', `"${forward(run.workspace)}"`)
    .replace('<run-id>', run.runId)
    .replaceAll(/"<[^>]*>"|<[^>]*>/g, (placeholder) => {
      const key = Object.keys(values).find((k) => placeholder.includes(k));
      assert.ok(key, `no value for ${placeholder} in "${name}"`);
      return placeholder.startsWith('"') ? `"${values[key] as string}"` : (values[key] as string);
    })
    .replaceAll(/ {2,}/g, ' ');
}

function replyOf(r: { status: number | null; stdout: string; stderr: string }, context: string): Reply {
  try {
    return JSON.parse(r.stdout) as Reply;
  } catch {
    throw new Error(`${context}: no JSON reply (exit ${r.status}): ${r.stderr || r.stdout}`);
  }
}

// ---------------------------------------------------------------- tests

test('RC9: the coordinator text takes human text from a file and allows inline only what no shell can alter', () => {
  for (const flag of ['--answer-file "<', '--recorded-by-file "<', '--reason-file "<']) {
    assert.ok(coordinatorText.includes(flag), `coordinator lacks: ${flag}`);
  }
  assert.ok(!coordinatorText.includes('--answer "<'), 'an answer is never documented as a quoted argument');
  assert.match(coordinatorText, /Never (put|type|pass) the human's words on a command line/);
  assert.match(coordinatorText, /letters, digits, spaces/);
  assert.match(coordinatorText, /INLINE_TEXT_REFUSED/);
});

test('RC9: answer and recorded-by given as files are retained byte for byte, with provenance and decision identity kept', async () => {
  const { run, version } = await atQuestion('rc9-argv');
  const input = join(run.workspace, 'human-text');
  const base = ['decide', '--workspace', run.workspace, '--run', run.runId, '--action', 'answer', '--expected-version', String(version)];
  const files = ['--recorded-by-file', textFile(input, 'who.txt', RECORDED_BY), '--answer-file', textFile(input, 'answer.txt', ANSWER)];

  const recorded = cli([...base, '--decision-id', 'Q1', '--provenance', 'HUMAN_RECORDED', ...files], [], SENTINEL_ENV);
  assert.equal(recorded.reply.code, 'DECISION_RECORDED', JSON.stringify(recorded.reply));
  const retained = retainedDecision(run);
  assert.equal(retained.answer, ANSWER);
  assert.ok(Buffer.from(retained.answer as string, 'utf8').equals(Buffer.from(ANSWER, 'utf8')));
  assert.equal(retained.recorded_by, RECORDED_BY);
  assert.equal(retained.provenance, 'HUMAN_RECORDED');
  assert.equal(retained.decision_id, 'Q1');
  assert.equal(retained.expected_version, version);
  assert.equal(retained.action, 'answer');
  const event = lastEvent(run, 'decision_recorded').data;
  assert.equal(event.recorded_by, RECORDED_BY);
  assert.equal(event.provenance, 'HUMAN_RECORDED');
  // The planner is given exactly that answer.
  const retry = pendingOf(run.assembly.engine.next(run.runId));
  const answers = JSON.parse(readFileSync(join(run.runDir, 'artifacts', (retry.inputs.answers as string).slice(7)), 'utf8')) as { answer: string };
  assert.equal(answers.answer, ANSWER, 'the retained answer the planner reads is the exact text');
});

test('RC9: a text file that is missing, not UTF-8, or doubled by an inline flag is refused and records nothing', async () => {
  const { run, version } = await atQuestion('rc9-refusals');
  const input = join(run.workspace, 'human-text');
  const who = textFile(input, 'who.txt', 'fixture');
  const answer = textFile(input, 'answer.txt', 'Return 503.');
  const base = ['decide', '--workspace', run.workspace, '--run', run.runId, '--action', 'answer', '--expected-version', String(version), '--decision-id', 'Q1', '--provenance', 'HUMAN_RECORDED'];

  const missing = cli([...base, '--recorded-by-file', who, '--answer-file', join(input, 'absent.txt')]);
  assert.deepEqual([missing.status, missing.reply.code], [2, 'MISSING_INPUT']);
  const binary = cli([...base, '--recorded-by-file', who, '--answer-file', textFile(input, 'latin1.txt', Uint8Array.from([0x63, 0x61, 0x66, 0xe9]))]);
  assert.deepEqual([binary.status, binary.reply.code], [2, 'INPUT_NOT_UTF8']);
  for (const doubled of [
    ['--recorded-by-file', who, '--answer-file', answer, '--answer', 'inline'],
    ['--recorded-by-file', who, '--recorded-by', 'inline', '--answer-file', answer],
  ]) {
    const r = spawnSync(process.execPath, [CLI, ...base, ...doubled], { encoding: 'utf8' });
    assert.equal(r.status, 1, 'a usage error');
    assert.match(r.stderr, /not both/);
  }
  // Inline text: an answer never; a label or reason only in characters no supported shell rewrites.
  const inlineAnswer = cli([...base, '--recorded-by', 'test fixture', '--answer', 'Return 503']);
  assert.deepEqual([inlineAnswer.status, inlineAnswer.reply.code], [2, 'INLINE_TEXT_REFUSED']);
  for (const label of ['a $true label', 'quoted "here"', "O'Neil", 'back`tick', 'semi;colon', 'pipe | x', '%PATH%', 'bang!', 'two\nlines', 'caret^', 'amp & x', 'paren (x)', 'star *', 'path\\x', 'tilde ~']) {
    const r = cli([...base, '--recorded-by', label, '--answer-file', answer]);
    assert.deepEqual([r.status, r.reply.code], [2, 'INLINE_TEXT_REFUSED'], label);
  }
  // A plain label and a plain reason are accepted inline and kept exactly.
  const plain = 'Ramón Lorente, owner_1 @ desk-2 + 3.';
  assert.equal(cli([...base, '--recorded-by', plain, '--answer-file', join(input, 'absent.txt')]).reply.code, 'MISSING_INPUT');
  // An empty file is an empty text, which the engine refuses as it always did.
  assert.equal(cli([...base, '--recorded-by-file', who, '--answer-file', textFile(input, 'empty.txt', '')]).reply.code, 'MALFORMED_DECISION');
  assert.equal(events(run).filter((e) => e.type === 'decision_recorded').length, 0);

  // Abandon: the same rules for its reason.
  const abandon = ['abandon', '--workspace', run.workspace, '--run', run.runId, '--attempt', 'intent-1'];
  assert.equal(cli([...abandon, '--reason-file', join(input, 'absent.txt')]).reply.code, 'MISSING_INPUT');
  const both = spawnSync(process.execPath, [CLI, ...abandon, '--reason-file', who, '--reason', 'inline'], { encoding: 'utf8' });
  assert.equal(both.status, 1);
  const neither = spawnSync(process.execPath, [CLI, ...abandon], { encoding: 'utf8' });
  assert.equal(neither.status, 1, 'abandon still needs an explicit reason');
});

test('RC9: through real shells, the documented command lines deliver the text unchanged and execute none of it', async (t) => {
  for (const shell of shells()) {
    t.diagnostic(`shell: ${shell.name}`);
    const { run, version } = await atQuestion('rc9-shell');
    const cwd = tmpDir('rc9-cwd');
    const input = join(run.workspace, '.rstack', 'human-text');
    const who = textFile(input, 'who.txt', RECORDED_BY);
    const answer = textFile(input, 'answer.txt', ANSWER);

    // The label is outside the plain set, so, as the text says, it goes by file too.
    const decide = `${documented('decide', run, { action: 'answer', '<n>': String(version), '<id>': 'Q1', who: 'unused' }).replace('--recorded-by "unused"', `--recorded-by-file "${forward(who)}"`)} --answer-file "${forward(answer)}"`;
    assert.ok(decide.includes('--recorded-by-file'));
    const recorded = replyOf(shell.run(decide, cwd), `${shell.name} decide`);
    assert.equal(recorded.code, 'DECISION_RECORDED', `${shell.name}: ${JSON.stringify(recorded)}`);
    const retained = retainedDecision(run);
    assert.equal(retained.answer, ANSWER, shell.name);
    assert.equal(retained.recorded_by, RECORDED_BY, shell.name);
    assert.equal(retained.provenance, 'HUMAN_RECORDED', shell.name);
    assert.ok(!JSON.stringify(retained).includes('EXPANDED'), `${shell.name}: nothing in the text was expanded`);

    // Abandon the attempt the answer led to, with the reason from a file.
    const attempt = pendingOf(run.assembly.engine.next(run.runId));
    const reason = textFile(input, 'reason.txt', REASON);
    const abandon = documented('abandon', run, { 'attempt-id': attempt.attempt_id, why: forward(reason) });
    assert.ok(abandon.includes('--reason-file'));
    const abandoned = replyOf(shell.run(abandon, cwd), `${shell.name} abandon`);
    assert.equal(abandoned.code, 'FAILURE_RECORDED', `${shell.name}: ${JSON.stringify(abandoned)}`);
    const failed = lastEvent(run, 'attempt_failed');
    assert.equal(failed.data.detail, REASON, `${shell.name}: the reason is retained exactly`);
    assert.equal(failed.data.kind, 'EXECUTION_UNCERTAIN');
    assert.ok(!journalText(run).includes('EXPANDED'), shell.name);

    assert.deepEqual(readdirSync(cwd), [], `${shell.name}: nothing in the text was executed`);
    assert.ok(!existsSync(join(run.workspace, 'rc9-executed.txt')));
  }
});
