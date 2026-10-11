// Read-only loading of one run for the projector. It reads the journal the
// way the engine does (every complete record validated, the tail reported),
// loads the retained definition and records by identity, observes the lock,
// and writes nothing: no snapshot, no tail repair, no lock.

import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { ID_PATTERN, REF_PATTERN, type JournalEvent, refOf } from '../contracts/records.ts';
import { EngineBlock } from '../engine/errors.ts';
import { readJournal } from '../engine/journal.ts';
import { readHolder } from '../engine/lock.ts';
import type { RunView } from './contracts.ts';
import { type ProjectionInput, type SourceFailure, projectRun } from './project-run.ts';
import { parseWorkflowDef } from './workflow-def.ts';

// Retained records larger than this are not loaded for display; a tree
// manifest of a fixture application is far below it.
export const MAX_RECORD_BYTES = 1024 * 1024;

export function runDirectory(runsRoot: string, runId: string): string {
  if (!ID_PATTERN.test(runId)) throw new Error('run id has an invalid format');
  const dir = join(runsRoot, runId);
  if (existsSync(dir)) {
    const root = realpathSync(runsRoot);
    if (!realpathSync(dir).startsWith(root + sep)) throw new Error('run directory resolves outside the runs root');
  }
  return dir;
}

// Retained bytes by identity, or null when absent, too large, or altered.
export function readRetained(runDir: string, ref: string): Buffer | null {
  if (!REF_PATTERN.test(ref)) return null;
  const path = join(runDir, 'artifacts', ref.slice(7));
  try {
    if (statSync(path).size > MAX_RECORD_BYTES) return null;
    const bytes = readFileSync(path);
    return refOf(bytes) === ref ? bytes : null;
  } catch {
    return null;
  }
}

function lockOf(runDir: string): RunView['lock'] {
  const holder = readHolder(runDir);
  if (holder === 'ABSENT') return { held: false, pid: null, host: null, acquired_at: null, readable: true };
  if (holder === 'UNREADABLE') return { held: true, pid: null, host: null, acquired_at: null, readable: false };
  return { held: true, pid: holder.pid, host: holder.host, acquired_at: holder.acquired_at, readable: true };
}

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);

export function loadProjectionInput(runsRoot: string, runId: string): ProjectionInput {
  const runDir = runDirectory(runsRoot, runId);
  const empty: ProjectionInput = { run_id: runId, events: [], incomplete_tail_bytes: 0, failure: null, workflow: null, records: new Map(), lock: { held: false, pid: null, host: null, acquired_at: null, readable: true } };
  const fail = (status: SourceFailure['status'], code: string | null, message: string | null, record: number | null = null, events: JournalEvent[] = []): ProjectionInput => ({
    ...empty,
    events,
    failure: { status, code, message, record },
  });
  if (!existsSync(runDir)) return fail('UNREADABLE', 'RUN_NOT_FOUND', 'no such run');
  let read: ReturnType<typeof readJournal>;
  try {
    read = readJournal(runDir, runId);
  } catch (e) {
    if (e instanceof EngineBlock) return { ...fail('CORRUPT', e.code, e.message, typeof e.detail.record === 'number' ? e.detail.record : null), lock: lockOf(runDir) };
    return fail('UNREADABLE', 'READ_ERROR', (e as Error).message);
  }
  const lock = lockOf(runDir);
  if (read.events.length === 0) return { ...fail('NOT_INITIALIZED', 'RUN_NOT_INITIALIZED', 'the run has no committed start record'), incomplete_tail_bytes: read.tail?.length ?? 0, lock };
  const first = read.events[0] as JournalEvent;
  if (first.type !== 'run_started') return { ...fail('CORRUPT', 'JOURNAL_CORRUPT', 'the first record is not run_started', 1, read.events), lock };
  const workflowRef = str(first.data.workflow_ref);
  const retained = workflowRef ? readRetained(runDir, workflowRef) : null;
  if (!retained) {
    const reason = workflowRef && existsSync(join(runDir, 'artifacts', workflowRef.slice(7))) ? 'the retained workflow definition does not match its identity' : 'the retained workflow definition is missing';
    return { ...fail('UNSUPPORTED_WORKFLOW', 'WORKFLOW_UNAVAILABLE', reason, null, read.events), lock };
  }
  const workflow = parseWorkflowDef(retained.toString('utf8'));
  if (!workflow.ok) return { ...fail('UNSUPPORTED_WORKFLOW', 'WORKFLOW_UNPARSEABLE', `the retained workflow definition is not readable by this viewer: ${workflow.issues[0] ?? ''}`, null, read.events), lock };

  // Every identity the events name, read once by identity. Role results,
  // decisions, records, trees, and the start identities; not what an
  // execution printed (its output is named inside the execution record).
  const refs = new Set<string>();
  for (const event of read.events) {
    for (const [key, value] of Object.entries(event.data)) {
      if (typeof value === 'string' && REF_PATTERN.test(value) && key !== 'input_digest' && key !== 'result_digest' && key !== 'failure_digest' && key !== 'decision_digest') refs.add(value);
      if (key === 'subjects' && typeof value === 'object' && value !== null) {
        for (const v of Object.values(value as Record<string, unknown>)) if (typeof v === 'string' && REF_PATTERN.test(v)) refs.add(v);
      }
    }
  }
  const records = new Map<string, string>();
  for (const ref of refs) {
    const bytes = readRetained(runDir, ref);
    if (bytes) records.set(ref, bytes.toString('utf8'));
  }
  // The proposal is persisted by the sink at its recorded location, not under
  // artifacts/. It is read from there and accepted only under its identity.
  for (const event of read.events) {
    if (event.type !== 'proposal_recorded') continue;
    const location = str(event.data.location);
    const ref = str(event.data.proposal_ref);
    if (!location || !ref || !REF_PATTERN.test(ref) || !/^[A-Za-z0-9_][A-Za-z0-9._-]*(\/[A-Za-z0-9_][A-Za-z0-9._-]*)*$/.test(location)) continue;
    try {
      const path = join(runDir, ...location.split('/'));
      if (statSync(path).size > MAX_RECORD_BYTES) continue;
      const bytes = readFileSync(path);
      if (refOf(bytes) === ref) records.set(ref, bytes.toString('utf8'));
    } catch {
      // A missing or altered proposal is simply not shown.
    }
  }
  // The application's package.json from the retained base tree, for a label.
  const baseText = str(first.data.base_ref) ? records.get(first.data.base_ref as string) : undefined;
  if (baseText) {
    try {
      const files = (JSON.parse(baseText) as { files?: { path?: unknown; sha256?: unknown }[] }).files ?? [];
      const pkg = files.find((x) => x.path === 'package.json');
      if (pkg && typeof pkg.sha256 === 'string') {
        const bytes = readRetained(runDir, `sha256:${pkg.sha256}`);
        if (bytes) records.set(`sha256:${pkg.sha256}`, bytes.toString('utf8'));
      }
    } catch {
      // An unreadable manifest only costs the label.
    }
  }
  return { run_id: runId, events: read.events, incomplete_tail_bytes: read.tail?.length ?? 0, failure: null, workflow: workflow.value, records, lock };
}

export function readRun(runsRoot: string, runId: string): RunView {
  return projectRun(loadProjectionInput(runsRoot, runId));
}
