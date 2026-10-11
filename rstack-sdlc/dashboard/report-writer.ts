// Writes the terminal report into the derived-report area of a workspace,
// `.rstack/reports/<run-id>/`, and nowhere else. Atomic (temporary file and
// rename), idempotent (the same run gives the same bytes; an unchanged file
// is left alone), and read-only towards the run directory.

import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ID_PATTERN, canonicalJson, sha256Hex } from '../core/contracts/records.ts';
import type { FinalOutcome } from '../core/read-model/contracts.ts';
import { projectRun } from '../core/read-model/project-run.ts';
import { loadProjectionInput } from '../core/read-model/read-run.ts';
import { renderReport } from '../core/read-model/report-html.ts';

export const REPORTS_DIR = ['.rstack', 'reports'];
export const TERMINAL_OUTCOMES: readonly FinalOutcome[] = ['LOCAL_PR_PROPOSAL_PREPARED', 'REJECTED', 'BLOCKED'];

export interface ReportResult {
  status: 'WRITTEN' | 'UNCHANGED' | 'NOT_TERMINAL' | 'UNREADABLE';
  run_id: string;
  path: string;
  sha256: string | null;
  final_outcome: FinalOutcome | null;
  detail: string | null;
}

export function reportDirectory(workspace: string, runId: string): string {
  if (!ID_PATTERN.test(runId)) throw new Error('run id has an invalid format');
  return join(workspace, ...REPORTS_DIR, runId);
}

export function reportLocation(workspace: string, runId: string): string {
  return join(reportDirectory(workspace, runId), 'report.html');
}

function writeAtomic(path: string, bytes: string): void {
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, bytes);
  try {
    renameSync(tmp, path);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
}

export function writeReport(workspace: string, runId: string, options: { force?: boolean } = {}): ReportResult {
  const dir = reportDirectory(workspace, runId);
  const path = join(dir, 'report.html');
  const runsRoot = join(workspace, '.rstack', 'runs');
  const input = loadProjectionInput(runsRoot, runId);
  const view = projectRun(input);
  if (view.source_status !== 'CURRENT' && view.source_status !== 'INCOMPLETE_TAIL') {
    return { status: 'UNREADABLE', run_id: runId, path, sha256: null, final_outcome: null, detail: view.diagnostic.message ?? view.source_status };
  }
  if (!TERMINAL_OUTCOMES.includes(view.final_outcome) && !options.force) {
    return { status: 'NOT_TERMINAL', run_id: runId, path, sha256: null, final_outcome: view.final_outcome, detail: `the run is ${view.final_outcome}; a report is generated at a terminal state or on request` };
  }
  const html = renderReport(view, input.records);
  const digest = sha256Hex(html);
  if (existsSync(path) && sha256Hex(readFileSync(path)) === digest) {
    return { status: 'UNCHANGED', run_id: runId, path, sha256: digest, final_outcome: view.final_outcome, detail: null };
  }
  mkdirSync(dir, { recursive: true });
  writeAtomic(join(dir, 'report.json'), `${canonicalJson(view)}\n`);
  writeAtomic(path, html);
  return { status: 'WRITTEN', run_id: runId, path, sha256: digest, final_outcome: view.final_outcome, detail: null };
}
