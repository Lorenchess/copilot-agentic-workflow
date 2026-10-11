// The terminal HTML report: a standalone, escaped, deterministic page
// rendered from the read model. Evidence class: engine tests (offline).

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { sha256Hex } from '../core/contracts/records.ts';
import { renderReport } from '../core/read-model/report-html.ts';
import { loadProjectionInput, readRun } from '../core/read-model/read-run.ts';
import { reportLocation, writeReport } from '../dashboard/report-writer.ts';
import { completeStep } from './support/harness.ts';
import { scenarioRun } from './support/scenarios.ts';

function digestDir(dir: string): string {
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name))
    .sort()
    .map((f) => `${f}:${sha256Hex(readFileSync(f))}:${statSync(f).mtimeMs}`);
  return sha256Hex(entries.join('\n'));
}

test('a completed run renders a standalone report with the local-proposal outcome and no remote asset', async () => {
  const run = await scenarioRun('completed');
  const input = loadProjectionInput(run.assembly.runsRoot, run.runId);
  const view = readRun(run.assembly.runsRoot, run.runId);
  const html = renderReport(view, input.records);
  assert.ok(html.startsWith('<!doctype html>'));
  assert.match(html, /Local PR proposal prepared/);
  assert.match(html, /NOT_ATTEMPTED/);
  assert.doesNotMatch(html, /PR_CREATED/);
  assert.doesNotMatch(html, /https?:\/\//, 'no remote asset or link');
  assert.doesNotMatch(html, /<script/i, 'no script');
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, new RegExp(view.run_id));
  assert.match(html, new RegExp(`journal version ${view.journal_version}`));
  assert.match(html, /Not observed/);
  assert.match(html, /SIMULATED/);
  for (const r of view.reviews) assert.match(html, new RegExp(r.verdict));
  assert.match(html, /AC-1/);
});

test('every value from a record is escaped: hostile text cannot become markup', async () => {
  const run = await scenarioRun('fresh');
  completeStep(run, 'hostile');
  const input = loadProjectionInput(run.assembly.runsRoot, run.runId);
  const html = renderReport(readRun(run.assembly.runsRoot, run.runId), input.records);
  assert.doesNotMatch(html, /<script|<img|<svg/i, 'no tag from a record survives as markup');
  assert.match(html, /&lt;script&gt;alert/);
  assert.match(html, /&lt;img src=x onerror=/);
});

test('blocked and rejected runs render their outcome without a proposal', async () => {
  const blocked = await scenarioRun('review-rejected');
  const b = renderReport(readRun(blocked.assembly.runsRoot, blocked.runId), loadProjectionInput(blocked.assembly.runsRoot, blocked.runId).records);
  assert.match(b, /Blocked/);
  assert.match(b, /REVIEW_REJECTED/);
  assert.doesNotMatch(b, /Local PR proposal prepared/);
  const rejected = await scenarioRun('rejected');
  const r = renderReport(readRun(rejected.assembly.runsRoot, rejected.runId), loadProjectionInput(rejected.assembly.runsRoot, rejected.runId).records);
  assert.match(r, /Rejected by the human/);
});

test('the report is written atomically to the derived area, is deterministic, and leaves the run untouched', async () => {
  const run = await scenarioRun('completed');
  const before = digestDir(run.runDir);
  const first = writeReport(run.workspace, run.runId);
  assert.equal(first.status, 'WRITTEN');
  assert.equal(first.path, reportLocation(run.workspace, run.runId));
  assert.ok(existsSync(first.path));
  assert.ok(first.path.includes(join('.rstack', 'reports', run.runId)));
  assert.ok(!existsSync(join(run.runDir, 'report.html')), 'nothing written in the run directory');
  assert.equal(digestDir(run.runDir), before);
  const bytes = readFileSync(first.path);
  const second = writeReport(run.workspace, run.runId);
  assert.equal(second.status, 'UNCHANGED');
  assert.deepEqual(readFileSync(second.path), bytes, 'regeneration gives the same bytes');
  assert.equal(second.sha256, sha256Hex(bytes));
  assert.ok(existsSync(join(run.workspace, '.rstack', 'reports', run.runId, 'report.json')));
  assert.ok(!readdirSync(join(run.workspace, '.rstack', 'reports', run.runId)).some((f) => f.endsWith('.tmp')));
});

test('a report is refused for a run that is not terminal unless forced, and names the reason', async () => {
  const run = await scenarioRun('plan-decision');
  const r = writeReport(run.workspace, run.runId);
  assert.equal(r.status, 'NOT_TERMINAL');
  assert.ok(!existsSync(reportLocation(run.workspace, run.runId)));
  const forced = writeReport(run.workspace, run.runId, { force: true });
  assert.equal(forced.status, 'WRITTEN');
  assert.match(readFileSync(forced.path, 'utf8'), /Waiting for a human decision/);
  assert.equal(writeReport(run.workspace, 'RUN-absent').status, 'UNREADABLE');
  assert.throws(() => writeReport(run.workspace, '../x'), /run id/);
});

test('a large history is bounded in the report and the omission is stated', async () => {
  const run = await scenarioRun('completed');
  const view = readRun(run.assembly.runsRoot, run.runId);
  const padded = { ...view, timeline: Array.from({ length: 2500 }, (_, i) => ({ ...(view.timeline[0] as (typeof view.timeline)[number]), seq: i + 1 })) };
  const html = renderReport(padded, new Map());
  assert.match(html, /500 earlier entries are not listed/);
  assert.ok(html.length < 2_000_000);
});
