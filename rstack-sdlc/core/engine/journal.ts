// The run journal is the single authority for run state.
//
// Framing: one record per line, `<sha256 hex of payload> <payload JSON>\n`.
// A record is complete only when its terminating newline is present.
// Commit point: the framed line has been written and fsync has returned.
//
// Reading never skips anything. A complete record that fails its checksum,
// its schema, its sequence, or its run identity blocks the run. Bytes after
// the last newline are an incomplete tail: they were never acknowledged, and
// only `quarantineTail` may remove them, after preserving them.

import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  truncateSync,
  writeSync,
} from 'node:fs';
import { join } from 'node:path';
import { type JournalEvent, parseEvent, sha256Hex } from '../contracts/records.ts';
import { EngineBlock } from './errors.ts';

export const JOURNAL_FILE = 'journal.jsonl';
const LINE = /^([0-9a-f]{64}) (.+)$/;

export interface JournalRead {
  events: JournalEvent[];
  completeBytes: number;
  tail: Uint8Array | null;
}

export function frameEvent(event: JournalEvent): string {
  const payload = JSON.stringify(event);
  return `${sha256Hex(payload)} ${payload}\n`;
}

export function readJournal(runDir: string, runId: string): JournalRead {
  const path = join(runDir, JOURNAL_FILE);
  if (!existsSync(path)) return { events: [], completeBytes: 0, tail: null };
  const bytes = readFileSync(path);
  const lastNewline = bytes.lastIndexOf(0x0a);
  const completeBytes = lastNewline + 1;
  const tail = completeBytes < bytes.length ? bytes.subarray(completeBytes) : null;

  const events: JournalEvent[] = [];
  if (completeBytes > 0) {
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, completeBytes - 1));
    } catch {
      throw new EngineBlock('JOURNAL_CORRUPT', 'journal contains bytes that are not UTF-8', { record: null });
    }
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const record = i + 1;
      const m = LINE.exec(lines[i] as string);
      if (!m) {
        throw new EngineBlock('JOURNAL_CORRUPT', `journal record ${record} is not framed correctly`, { record });
      }
      const [, hash, payload] = m as unknown as [string, string, string];
      if (sha256Hex(payload) !== hash) {
        throw new EngineBlock('JOURNAL_CORRUPT', `journal record ${record} fails its checksum`, { record });
      }
      const parsed = parseEvent(payload);
      if (!parsed.ok) {
        const code = parsed.code === 'UNSUPPORTED_SCHEMA_VERSION' ? 'UNSUPPORTED_SCHEMA_VERSION' : 'JOURNAL_CORRUPT';
        throw new EngineBlock(code, `journal record ${record} is not a valid event`, { record, issues: parsed.issues });
      }
      if (parsed.value.seq !== record) {
        throw new EngineBlock('JOURNAL_CORRUPT', `journal record ${record} carries version ${parsed.value.seq}`, {
          record,
        });
      }
      if (parsed.value.run_id !== runId) {
        throw new EngineBlock('JOURNAL_CORRUPT', `journal record ${record} belongs to another run`, { record });
      }
      events.push(parsed.value);
    }
  }
  return { events, completeBytes, tail };
}

export function appendEvent(runDir: string, event: JournalEvent): void {
  const fd = openSync(join(runDir, JOURNAL_FILE), 'a');
  try {
    writeSync(fd, frameEvent(event));
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

export interface TailRecovery {
  bytes: number;
  preserved_at: string;
}

// Caller must hold the run lock. The tail is copied out and synced before the
// journal is shortened, so the bytes survive whichever step is interrupted.
export function quarantineTail(runDir: string, read: JournalRead): TailRecovery | null {
  if (!read.tail) return null;
  const dir = join(runDir, 'journal-tail');
  mkdirSync(dir, { recursive: true });
  const name = `${read.completeBytes}-${sha256Hex(read.tail)}.bin`;
  const fd = openSync(join(dir, name), 'w');
  try {
    writeSync(fd, read.tail);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  truncateSync(join(runDir, JOURNAL_FILE), read.completeBytes);
  return { bytes: read.tail.length, preserved_at: `journal-tail/${name}` };
}
