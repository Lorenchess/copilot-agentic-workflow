// Discovery of the runs under one runs root, bounded and read-only. Only a
// directory whose name is a valid run id is a run; nothing else is opened.

import { type Dirent, existsSync, readdirSync } from 'node:fs';
import { ID_PATTERN } from '../contracts/records.ts';
import type { RunSummary } from './contracts.ts';
import { summarize } from './project-run.ts';
import { readRun } from './read-run.ts';

export const MAX_LISTED_RUNS = 500;

export function listRunIds(runsRoot: string): string[] {
  if (!existsSync(runsRoot)) return [];
  let entries: Dirent[];
  try {
    entries = readdirSync(runsRoot, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && ID_PATTERN.test(e.name))
    .map((e) => e.name)
    .sort()
    .reverse()
    .slice(0, MAX_LISTED_RUNS);
}

export function listRuns(runsRoot: string): RunSummary[] {
  return listRunIds(runsRoot)
    .map((id) => summarize(readRun(runsRoot, id)))
    .sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? '') || b.run_id.localeCompare(a.run_id));
}
