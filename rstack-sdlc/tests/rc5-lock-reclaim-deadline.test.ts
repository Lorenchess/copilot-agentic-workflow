// RC5: a takeover that does not succeed obeys the same deadline and polling
// delay as any other wait for the lock. Acquisition always runs in a child
// process with an outer limit, so a loop that never returns fails the test
// instead of hanging it.
//
// Evidence class: engine tests with planted lock files (fault injection).
// The holder process ids belong to processes that really exited.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { PACKAGE_ROOT, deadPid, tmpDir } from './support/harness.ts';

const OUTER_LIMIT_MS = 8000;

const CHILD = `
import { acquireLock } from ${JSON.stringify(pathToFileURL(join(PACKAGE_ROOT, 'core', 'engine', 'lock.ts')).href)};
const [runDir, timeoutMs] = process.argv.slice(1);
const started = Date.now();
let report;
try {
  const lock = acquireLock(runDir, Number(timeoutMs), () => new Date());
  report = { acquired: true, reclaimed: lock.reclaimed, ms: Date.now() - started };
  lock.release();
} catch (e) {
  report = { acquired: false, code: e.code ?? null, message: String(e.message), detail: e.detail ?? null, ms: Date.now() - started };
}
process.stdout.write(JSON.stringify(report));
`;

interface Report {
  acquired: boolean;
  reclaimed?: { token: string } | null;
  code?: string | null;
  message?: string;
  detail?: Record<string, unknown> | null;
  ms: number;
}

const childArgs = (runDir: string, timeoutMs: number): string[] => ['--input-type=module', '-e', CHILD, runDir, String(timeoutMs)];

function acquire(runDir: string, timeoutMs: number): Report {
  const r = spawnSync(process.execPath, childArgs(runDir, timeoutMs), { encoding: 'utf8', timeout: OUTER_LIMIT_MS });
  assert.equal((r.error as NodeJS.ErrnoException | undefined)?.code, undefined, `acquireLock(${timeoutMs} ms) did not return within ${OUTER_LIMIT_MS} ms`);
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout) as Report;
}

function plantLock(label: string, pid: number, token = 'gone'): { runDir: string; lock: string; guard: string; content: string } {
  const runDir = tmpDir(label);
  const content = JSON.stringify({ token, pid, host: hostname(), acquired_at: '2001-01-01T00:00:00.000Z' });
  writeFileSync(join(runDir, 'lock'), content);
  return { runDir, lock: join(runDir, 'lock'), guard: join(runDir, 'lock.reclaim'), content };
}

test('RC5: a dead lock with an unfinished takeover guard is reported within a bounded time, and nothing is deleted', () => {
  // The state a reclaimer leaves when it dies after creating its guard and before moving the lock.
  const f = plantLock('rc5-dead-guard', deadPid());
  const guardContent = JSON.stringify({ pid: deadPid(), host: hostname() });
  writeFileSync(f.guard, guardContent);

  const report = acquire(f.runDir, 150);
  assert.equal(report.acquired, false);
  assert.equal(report.code, 'LOCK_UNCERTAIN');
  assert.deepEqual(report.detail, { file: 'lock.reclaim' });
  assert.ok(report.ms >= 150 && report.ms < 3000, `returned after ${report.ms} ms`);
  assert.equal(readFileSync(f.lock, 'utf8'), f.content, 'the dead lock is kept');
  assert.equal(readFileSync(f.guard, 'utf8'), guardContent, 'the guard is kept');
  assert.ok(!existsSync(join(f.runDir, 'abandoned-locks')), 'nothing was reclaimed');

  // The wait is spent sleeping, not spinning: a longer limit waits longer, and still returns.
  const longer = acquire(f.runDir, 600);
  assert.equal(longer.code, 'LOCK_UNCERTAIN');
  assert.ok(longer.ms >= 600 && longer.ms < 3500, `returned after ${longer.ms} ms`);
});

test('RC5: a dead lock that cannot be moved aside ends in a named refusal, not a loop', () => {
  const f = plantLock('rc5-unmovable', deadPid());
  // Fault injection: the place the dead lock would be moved to is occupied by a directory.
  mkdirSync(join(f.runDir, 'abandoned-locks', 'gone.json'), { recursive: true });

  const report = acquire(f.runDir, 150);
  assert.equal(report.acquired, false);
  assert.equal(report.code, 'LOCK_UNCERTAIN');
  assert.match(report.message ?? '', /could not be taken over/);
  assert.ok(report.ms >= 150 && report.ms < 3000, `returned after ${report.ms} ms`);
  assert.equal(readFileSync(f.lock, 'utf8'), f.content, 'the dead lock is kept');
  assert.ok(!existsSync(f.guard), 'the guard this attempt created is removed again');
});

test('RC5: a takeover in progress by another process is waited for, not interfered with', async () => {
  const f = plantLock('rc5-live-reclaimer', deadPid());
  writeFileSync(f.guard, JSON.stringify({ pid: process.pid, host: hostname() }));

  const child = spawn(process.execPath, childArgs(f.runDir, 4000), { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
  const closed = new Promise<number | null>((done) => child.on('close', done));
  const limit = setTimeout(() => child.kill(), OUTER_LIMIT_MS);

  // While the other reclaimer holds the guard, the waiter leaves both files alone.
  await new Promise((done) => setTimeout(done, 400));
  assert.equal(readFileSync(f.lock, 'utf8'), f.content);
  assert.ok(existsSync(f.guard));
  assert.equal(stdout, '', 'the waiter has not returned');
  // The other reclaimer finishes: it moves the dead lock aside and removes its guard.
  mkdirSync(join(f.runDir, 'abandoned-locks'));
  renameSync(f.lock, join(f.runDir, 'abandoned-locks', 'gone.json'));
  unlinkSync(f.guard);

  assert.equal(await closed, 0);
  clearTimeout(limit);
  const report = JSON.parse(stdout) as Report;
  assert.equal(report.acquired, true);
  assert.equal(report.reclaimed, null, 'the waiter took a free lock; it did not reclaim one');
  assert.ok(report.ms < 4000, `acquired after ${report.ms} ms`);
  assert.deepEqual(readdirSync(join(f.runDir, 'abandoned-locks')), ['gone.json']);
});

test('RC5: dead-lock recovery and ordinary contention are unchanged', () => {
  const dead = plantLock('rc5-recover', deadPid());
  const recovered = acquire(dead.runDir, 400);
  assert.equal(recovered.acquired, true);
  assert.equal(recovered.reclaimed?.token, 'gone');
  assert.equal(readFileSync(join(dead.runDir, 'abandoned-locks', 'gone.json'), 'utf8'), dead.content, 'the dead lock is kept as evidence');
  assert.ok(!existsSync(dead.lock), 'released after use');
  assert.ok(!existsSync(dead.guard));

  // A lock held by a running process (this test) is never taken, however old.
  const live = plantLock('rc5-busy', process.pid, 'held');
  const busy = acquire(live.runDir, 150);
  assert.equal(busy.acquired, false);
  assert.equal(busy.code, 'LOCK_BUSY');
  assert.ok(busy.ms >= 150 && busy.ms < 3000, `returned after ${busy.ms} ms`);
  assert.equal(readFileSync(live.lock, 'utf8'), live.content);
  assert.ok(!existsSync(join(live.runDir, 'abandoned-locks')));
});
