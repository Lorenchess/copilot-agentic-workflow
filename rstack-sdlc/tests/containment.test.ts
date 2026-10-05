// Containment of role-produced file references: traversal, cross-run
// references, and link or junction escape. Evidence class: engine tests
// (offline), on this machine's filesystem. A capability the machine does not
// grant is reported as a skipped test, not as a pass.

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { readContained } from '../core/engine/containment.ts';
import { eventTypes, newRun, pendingOf, result, tmpDir } from './support/harness.ts';

const VALID_INTENT = '# Intent: x\nProblem: p\nOutcome: o\nScope: s\nSource: r\nOpen decisions: None.\n';

function layout(): { root: string; attempt: string; outside: string } {
  const base = tmpDir('contain');
  const root = join(base, 'run');
  const attempt = join(root, 'work', 'intent-1');
  const outside = join(base, 'outside');
  mkdirSync(attempt, { recursive: true });
  mkdirSync(outside);
  writeFileSync(join(attempt, 'intent.md'), VALID_INTENT);
  writeFileSync(join(outside, 'secret.md'), VALID_INTENT);
  return { root, attempt, outside };
}

// Creates a link and reports whether the operating system allowed it.
function tryLink(target: string, path: string, type: 'file' | 'dir' | 'junction'): boolean {
  try {
    symlinkSync(target, path, type);
    return true;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'EPERM' || code === 'EACCES' || code === 'ENOSYS') return false;
    throw e;
  }
}

test('a plain file inside the attempt directory is read; nested directories are allowed', () => {
  const { root, attempt } = layout();
  assert.equal(readContained(root, attempt, 'intent.md').ok, true);
  mkdirSync(join(attempt, 'sub'));
  writeFileSync(join(attempt, 'sub', 'a.md'), 'x');
  assert.equal(readContained(root, attempt, 'sub/a.md').ok, true);
});

test('traversal and non-relative paths are refused by their text alone', () => {
  const { root, attempt, outside } = layout();
  const bad = [
    '../intent-1/intent.md',
    '..',
    'sub/../../x',
    './intent.md',
    '/etc/passwd',
    resolve(outside, 'secret.md'),
    'C:/Windows/win.ini',
    '..\\outside\\secret.md',
    'sub\\a.md',
    'intent.md:stream',
    '',
    'a//b',
    '.hidden',
    'intent.md/',
    'x'.repeat(301),
  ];
  for (const path of bad) assert.equal(readContained(root, attempt, path).ok, false, `accepted: ${path}`);
  assert.equal(readContained(root, attempt, 'missing.md').ok, false);
  assert.equal(readContained(root, attempt, 'sub').ok, false);
  mkdirSync(join(attempt, 'dir.md'));
  assert.equal(readContained(root, attempt, 'dir.md').ok, false, 'a directory is not a file');
  writeFileSync(join(attempt, 'big.md'), 'x'.repeat(256 * 1024 + 1));
  assert.equal(readContained(root, attempt, 'big.md').ok, false, 'oversized file');
});

test('a Windows junction or directory link inside the attempt directory is refused', (t) => {
  const { root, attempt, outside } = layout();
  if (!tryLink(outside, join(attempt, 'link'), 'junction')) return t.skip('this machine does not allow creating a junction');
  const r = readContained(root, attempt, 'link/secret.md');
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /is a link/);
});

test('an attempt directory or work directory that is itself a junction is refused', (t) => {
  const { root, outside } = layout();
  writeFileSync(join(outside, 'intent.md'), VALID_INTENT);
  if (!tryLink(outside, join(root, 'work', 'intent-2'), 'junction')) return t.skip('this machine does not allow creating a junction');
  assert.equal(readContained(root, join(root, 'work', 'intent-2'), 'intent.md').ok, false, 'attempt directory is a link');

  // The whole work directory redirected elsewhere: every component below it is a real directory there.
  const other = layout();
  mkdirSync(join(other.outside, 'intent-9'));
  writeFileSync(join(other.outside, 'intent-9', 'intent.md'), VALID_INTENT);
  rmSync(join(other.root, 'work'), { recursive: true });
  assert.ok(tryLink(other.outside, join(other.root, 'work'), 'junction'));
  const r = readContained(other.root, join(other.root, 'work', 'intent-9'), 'intent.md');
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /resolves outside the run/);
});

test('a symbolic link to a file is refused', (t) => {
  const { root, attempt, outside } = layout();
  if (!tryLink(join(outside, 'secret.md'), join(attempt, 'alias.md'), 'file')) {
    return t.skip('this machine does not allow creating file symbolic links (needs elevation or Developer Mode on Windows)');
  }
  assert.equal(readContained(root, attempt, 'alias.md').ok, false);
});

test('engine: a result that points outside its own attempt directory is rejected and nothing is retained', async (t) => {
  const run = await newRun('contain-engine');
  const other = await newRun('contain-other');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  const otherEnvelope = pendingOf(other.assembly.engine.next(other.runId));
  result(otherEnvelope); // writes a valid intent.md into the other run's attempt directory
  const retained = (): string[] => readdirSync(join(run.runDir, 'artifacts')).sort();
  const artifactsBefore = retained();

  const attempts: [string, string][] = [
    ['sibling attempt', '../intent-9/intent.md'],
    ['other run, relative', `../../../${other.runId}/work/intent-1/intent.md`],
    ['other run, absolute', join(other.runDir, 'work', 'intent-1', 'intent.md').replaceAll('\\', '/')],
    ['run journal', '../../journal.jsonl'],
  ];
  for (const [name, path] of attempts) {
    const r = engine.submit(run.runId, result(envelope, { files: { intent: path } }));
    assert.equal(r.code, 'UNSAFE_PATH', name);
    assert.ok(existsSync(join(run.runDir, r.evidence as string)), `${name}: rejected result kept as evidence`);
  }

  // A junction planted in the attempt directory that leads into the other run.
  const link = join(run.runDir, envelope.work_dir, 'other');
  if (tryLink(join(other.runDir, 'work', 'intent-1'), link, 'junction')) {
    assert.equal(engine.submit(run.runId, result(envelope, { files: { intent: 'other/intent.md' } })).code, 'UNSAFE_PATH');
    rmSync(link, { recursive: true });
  } else {
    t.diagnostic('junction case not run: this machine does not allow creating a junction');
  }

  assert.deepEqual(eventTypes(run), ['run_started', 'task_dispatched'], 'no transition');
  assert.deepEqual(retained(), artifactsBefore, 'nothing from outside was retained');
  assert.equal(engine.status(run.runId).stage, 'intent');
  assert.equal(engine.submit(run.runId, result(envelope)).code, 'ACCEPTED', 'the contained file is still accepted');

  // Input identities from another run do not match what this run dispatched.
  const spec = pendingOf(engine.next(run.runId));
  assert.equal(engine.submit(run.runId, result(spec, { input_digest: otherEnvelope.input_digest })).code, 'INPUT_MISMATCH');
});
