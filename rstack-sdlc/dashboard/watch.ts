// Watches one runs root and keeps the current read model of every run. A
// change is noticed by polling the journal of each run (size and
// modification time), with the file-system watcher as a wake-up hint where
// it works. Every change is re-read through the read model; nothing is
// inferred from the file change itself, and a change that leaves the
// projected view identical is not an event.
//
// The watcher emits one versioned event per changed view into a bounded
// ring, so a reconnecting client can catch up or be told to resync. When a
// run reaches a terminal state, the terminal report is written to the
// derived area; a failure to write it is recorded and never affects anything else.

import { type FSWatcher, existsSync, statSync, watch } from 'node:fs';
import { join } from 'node:path';
import { type RunSummary, type RunView } from '../core/read-model/contracts.ts';
import { listRunIds } from '../core/read-model/list-runs.ts';
import { summarize } from '../core/read-model/project-run.ts';
import { readRun } from '../core/read-model/read-run.ts';
import { TERMINAL_OUTCOMES, type ReportResult, reportLocation, writeReport } from './report-writer.ts';

export interface WatchEvent {
  id: number;
  type: 'run-changed' | 'run-removed';
  at: string;
  run_id: string;
  journal_version: number;
  view_digest: string | null;
  final_outcome: string | null;
  needs_human: boolean;
  source_status: string | null;
  report: string | null;
}

export interface RunWatcherOptions {
  workspace: string;
  pollMs?: number;
  ringSize?: number;
  writeReports?: boolean;
  now?: () => Date;
  onError?: (where: string, error: unknown) => void;
}

interface Entry {
  fingerprint: string;
  view: RunView;
  report: string | null;
}

export interface RunWatcher {
  readonly runsRoot: string;
  readonly version: number;
  start(): void;
  stop(): void;
  // Re-reads every run now, or one run, outside the polling interval.
  refresh(runId?: string): void;
  list(): RunSummary[];
  view(runId: string): RunView | null;
  report(runId: string): string | null;
  // Events after `afterId`, or null when the ring no longer holds that point.
  since(afterId: number): WatchEvent[] | null;
  lastId(): number;
  subscribe(listener: (event: WatchEvent) => void): () => void;
  // Whether anything changed since the given version (cheap).
  changedSince(version: number): boolean;
}

function fingerprintOf(runDir: string): string {
  const parts: string[] = [];
  for (const name of ['journal.jsonl', 'state.json', 'lock']) {
    try {
      const s = statSync(join(runDir, name));
      parts.push(`${name}:${s.size}:${s.mtimeMs}`);
    } catch {
      parts.push(`${name}:absent`);
    }
  }
  return parts.join('|');
}

export function createRunWatcher(options: RunWatcherOptions): RunWatcher {
  const runsRoot = join(options.workspace, '.rstack', 'runs');
  const pollMs = options.pollMs ?? 1000;
  const ringSize = options.ringSize ?? 500;
  const now = options.now ?? (() => new Date());
  const writeReports = options.writeReports ?? true;
  const entries = new Map<string, Entry>();
  const ring: WatchEvent[] = [];
  const listeners = new Set<(event: WatchEvent) => void>();
  let version = 0;
  let nextId = 1;
  let timer: NodeJS.Timeout | null = null;
  let hint: NodeJS.Timeout | null = null;
  let watcher: FSWatcher | null = null;
  let scanning = false;

  const emit = (event: Omit<WatchEvent, 'id' | 'at'>): void => {
    const full: WatchEvent = { id: nextId++, at: now().toISOString(), ...event };
    ring.push(full);
    while (ring.length > ringSize) ring.shift();
    version += 1;
    for (const l of listeners) {
      try {
        l(full);
      } catch (e) {
        options.onError?.('listener', e);
      }
    }
  };

  const reportFor = (runId: string, view: RunView): string | null => {
    const path = reportLocation(options.workspace, runId);
    const terminal = TERMINAL_OUTCOMES.includes(view.final_outcome) && (view.source_status === 'CURRENT' || view.source_status === 'INCOMPLETE_TAIL');
    if (terminal && writeReports) {
      try {
        const r: ReportResult = writeReport(options.workspace, runId);
        if (r.status === 'WRITTEN' || r.status === 'UNCHANGED') return r.path;
      } catch (e) {
        options.onError?.('report', e);
      }
    }
    return existsSync(path) ? path : null;
  };

  const scan = (only?: string): void => {
    if (scanning) return;
    scanning = true;
    try {
      const ids = new Set(listRunIds(runsRoot));
      for (const id of ids) {
        if (only !== undefined && id !== only) continue;
        const runDir = join(runsRoot, id);
        const fingerprint = fingerprintOf(runDir);
        const known = entries.get(id);
        if (known && known.fingerprint === fingerprint) continue;
        let view: RunView;
        try {
          view = readRun(runsRoot, id);
        } catch (e) {
          options.onError?.(`read ${id}`, e);
          continue;
        }
        const report = reportFor(id, view);
        const changed = !known || known.view.view_digest !== view.view_digest || known.report !== report;
        entries.set(id, { fingerprint, view, report });
        if (changed) {
          emit({
            type: 'run-changed',
            run_id: id,
            journal_version: view.journal_version,
            view_digest: view.view_digest,
            final_outcome: view.final_outcome,
            needs_human: view.human_action.required,
            source_status: view.source_status,
            report,
          });
        }
      }
      for (const id of [...entries.keys()]) {
        if (ids.has(id) || (only !== undefined && id !== only)) continue;
        entries.delete(id);
        emit({ type: 'run-removed', run_id: id, journal_version: 0, view_digest: null, final_outcome: null, needs_human: false, source_status: null, report: null });
      }
    } finally {
      scanning = false;
    }
  };

  const schedule = (): void => {
    if (timer) return;
    timer = setInterval(() => {
      try {
        scan();
      } catch (e) {
        options.onError?.('scan', e);
      }
    }, pollMs);
    timer.unref();
  };

  const onHint = (): void => {
    if (hint) return;
    hint = setTimeout(() => {
      hint = null;
      try {
        scan();
      } catch (e) {
        options.onError?.('scan', e);
      }
    }, Math.min(100, pollMs));
    hint.unref();
  };

  const armWatcher = (): void => {
    if (watcher || !existsSync(runsRoot)) return;
    try {
      watcher = watch(runsRoot, { recursive: true, persistent: false }, onHint);
      watcher.on('error', () => {
        watcher?.close();
        watcher = null;
      });
    } catch {
      watcher = null; // polling alone
    }
  };

  return {
    runsRoot,
    get version() {
      return version;
    },
    start() {
      scan();
      armWatcher();
      schedule();
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
      if (hint) clearTimeout(hint);
      hint = null;
      watcher?.close();
      watcher = null;
    },
    refresh(runId?: string) {
      armWatcher();
      scan(runId);
    },
    list() {
      return [...entries.values()].map((e) => summarize(e.view)).sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? '') || b.run_id.localeCompare(a.run_id));
    },
    view(runId) {
      return entries.get(runId)?.view ?? null;
    },
    report(runId) {
      return entries.get(runId)?.report ?? null;
    },
    since(afterId) {
      if (ring.length === 0) return afterId >= nextId - 1 ? [] : null;
      const oldest = (ring[0] as WatchEvent).id;
      if (afterId < oldest - 1) return null;
      return ring.filter((e) => e.id > afterId);
    },
    lastId() {
      return nextId - 1;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    changedSince(v) {
      return version !== v;
    },
  };
}
