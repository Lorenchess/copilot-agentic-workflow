// One writer per run. The lock is a file created exclusively; waiting is
// bounded. A lock is taken over only when its holder is provably gone: same
// host and no process with that id. Age is never evidence. Anything else
// (live process id, another host, unreadable content) is reported, not
// reclaimed, and needs an operator.

import { randomBytes } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeSync,
} from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { EngineBlock } from './errors.ts';

export const LOCK_FILE = 'lock';
const RECLAIM_FILE = 'lock.reclaim';
const POLL_MS = 25;

export interface LockHolder {
  token: string;
  pid: number;
  host: string;
  acquired_at: string;
}

export interface HeldLock {
  reclaimed: LockHolder | null;
  release(): void;
}

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function readHolder(runDir: string): LockHolder | 'ABSENT' | 'UNREADABLE' {
  let text: string;
  try {
    text = readFileSync(join(runDir, LOCK_FILE), 'utf8');
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'ENOENT' ? 'ABSENT' : 'UNREADABLE';
  }
  try {
    const h = JSON.parse(text) as Partial<LockHolder>;
    if (
      typeof h.token === 'string' &&
      typeof h.pid === 'number' &&
      Number.isInteger(h.pid) &&
      h.pid > 0 &&
      typeof h.host === 'string' &&
      typeof h.acquired_at === 'string'
    ) {
      return { token: h.token, pid: h.pid, host: h.host, acquired_at: h.acquired_at };
    }
  } catch {
    // fall through
  }
  return 'UNREADABLE';
}

type Liveness = 'DEAD' | 'ALIVE' | 'UNKNOWN';

function holderLiveness(holder: LockHolder): Liveness {
  if (holder.host !== hostname()) return 'UNKNOWN';
  try {
    process.kill(holder.pid, 0);
    return 'ALIVE';
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'ESRCH' ? 'DEAD' : 'ALIVE';
  }
}

function tryCreate(path: string, content: string): boolean {
  let fd: number;
  try {
    fd = openSync(path, 'wx');
  } catch (e) {
    // On Windows a name whose previous file is still being deleted reports a
    // permission error instead of EEXIST; both mean "not created, try again".
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'EEXIST' || code === 'EPERM' || code === 'EACCES' || code === 'EBUSY') return false;
    throw e;
  }
  try {
    writeSync(fd, content);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  return true;
}

function removeWithRetry(path: string): void {
  for (let i = 0; ; i++) {
    try {
      unlinkSync(path);
      return;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return;
      if (i >= 40 || (code !== 'EPERM' && code !== 'EBUSY' && code !== 'EACCES')) throw e;
      sleep(POLL_MS);
    }
  }
}

// Moves a dead holder's lock aside, keeping it as evidence. A second guard
// file makes the check-then-move step exclusive, so two reclaimers cannot
// remove a lock that one of them has just taken.
function reclaim(runDir: string, dead: LockHolder): boolean {
  const guard = join(runDir, RECLAIM_FILE);
  if (!tryCreate(guard, JSON.stringify({ pid: process.pid, host: hostname() }))) return false;
  try {
    const current = readHolder(runDir);
    if (typeof current === 'string' || current.token !== dead.token) return false;
    if (holderLiveness(current) !== 'DEAD') return false;
    const dir = join(runDir, 'abandoned-locks');
    mkdirSync(dir, { recursive: true });
    try {
      renameSync(join(runDir, LOCK_FILE), join(dir, `${dead.token}.json`));
    } catch {
      return false;
    }
    return true;
  } finally {
    removeWithRetry(guard);
  }
}

export function acquireLock(runDir: string, timeoutMs: number, now: () => Date): HeldLock {
  const token = randomBytes(12).toString('hex');
  const path = join(runDir, LOCK_FILE);
  const deadline = Date.now() + timeoutMs;
  let reclaimed: LockHolder | null = null;

  for (;;) {
    const content = JSON.stringify({ token, pid: process.pid, host: hostname(), acquired_at: now().toISOString() });
    if (!existsSync(join(runDir, RECLAIM_FILE)) && tryCreate(path, content)) {
      return {
        reclaimed,
        release() {
          const holder = readHolder(runDir);
          if (typeof holder !== 'string' && holder.token === token) removeWithRetry(path);
        },
      };
    }

    const holder = readHolder(runDir);
    const dead = typeof holder !== 'string' && holderLiveness(holder) === 'DEAD';
    if (dead && reclaim(runDir, holder)) {
      reclaimed = holder;
      continue;
    }
    // A takeover that did not succeed (another reclaimer's guard is in the way,
    // or the lock could not be moved) waits and is bounded like any other wait.

    if (Date.now() >= deadline) {
      if (existsSync(join(runDir, RECLAIM_FILE))) {
        throw new EngineBlock('LOCK_UNCERTAIN', 'a lock takeover did not finish; an operator must inspect the run', {
          file: RECLAIM_FILE,
        });
      }
      // The lock vanished at the deadline: allow a bounded extra window to take it.
      if (holder === 'ABSENT' && Date.now() < deadline + timeoutMs) continue;
      if (holder === 'ABSENT') {
        throw new EngineBlock('LOCK_BUSY', 'the run lock could not be taken within the time limit', {});
      }
      if (holder === 'UNREADABLE') {
        throw new EngineBlock('LOCK_UNCERTAIN', 'the run lock cannot be read; its holder is unknown', {});
      }
      if (dead) {
        throw new EngineBlock('LOCK_UNCERTAIN', 'the run lock belongs to a process that is gone and could not be taken over', { holder });
      }
      if (holderLiveness(holder) === 'UNKNOWN') {
        throw new EngineBlock('LOCK_UNCERTAIN', 'the run lock is held from another host; its holder cannot be checked', {
          holder,
        });
      }
      throw new EngineBlock('LOCK_BUSY', 'the run lock is held by a running process', { holder });
    }
    sleep(POLL_MS);
  }
}
