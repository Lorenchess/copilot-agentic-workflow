// Starting, reusing, and stopping the dashboard beside a run, and the
// engine command's independence from it. Evidence class: engine tests
// (offline; real detached processes on loopback, started and stopped here).

import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { test } from 'node:test';
import { type DashboardStatus, dashboardStatus, ensureDashboard, instanceFile, readInstance, stopDashboard } from '../dashboard/lifecycle.ts';
import { reportLocation } from '../dashboard/report-writer.ts';
import { APP, PROFILE, REQUEST, cli, decision, tmpDir } from './support/harness.ts';
import { scenarioRun } from './support/scenarios.ts';

const LIVE = { RSTACK_DASHBOARD: 'on' };

async function stopped(workspace: string): Promise<void> {
  try {
    await stopDashboard(workspace);
  } catch {
    // nothing to stop
  }
}

async function health(url: string, token: string): Promise<Record<string, unknown>> {
  const r = await fetch(`${url}/api/v1/health`, { headers: { authorization: `Bearer ${token}` } });
  return (await r.json()) as Record<string, unknown>;
}

test('ensureDashboard starts a detached server for a workspace, records its instance, and reuses it on the next call', async (t) => {
  const workspace = tmpDir('lifecycle-start');
  t.after(() => stopped(workspace));
  const first: DashboardStatus = await ensureDashboard(workspace, { env: LIVE });
  assert.equal(first.status, 'STARTED', first.detail ?? '');
  assert.match(first.url ?? '', /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.match(first.entry_url ?? '', /^http:\/\/127\.0\.0\.1:\d+\/\?t=[0-9a-f]{64}$/);
  const instance = readInstance(workspace);
  assert.ok(instance);
  assert.equal(instance.workspace.replaceAll('\\', '/'), workspace.replaceAll('\\', '/'));
  assert.equal(instance.pid !== process.pid, true, 'the server is its own process');
  assert.ok(existsSync(instanceFile(workspace)));
  const h = await health(first.url as string, instance.token);
  assert.equal(h.ok, true);
  assert.equal(h.pid, instance.pid);
  const second = await ensureDashboard(workspace, { env: LIVE });
  assert.equal(second.status, 'REUSED');
  assert.equal(second.url, first.url);
  assert.equal(readInstance(workspace)?.pid, instance.pid, 'no second process');
  const status = await dashboardStatus(workspace);
  assert.equal(status.status, 'RUNNING');
  const stop = await stopDashboard(workspace);
  assert.equal(stop.status, 'STOPPED');
  const deadline = Date.now() + 3000;
  while (existsSync(instanceFile(workspace)) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
  assert.ok(!existsSync(instanceFile(workspace)), 'the instance file is removed on a clean stop');
  assert.equal((await dashboardStatus(workspace)).status, 'STOPPED');
});

test('a stale instance file (dead process) is replaced, and a server of another workspace is never adopted', async (t) => {
  const workspace = tmpDir('lifecycle-stale');
  const other = tmpDir('lifecycle-other');
  t.after(async () => {
    await stopped(workspace);
    await stopped(other);
  });
  mkdirSync(join(workspace, '.rstack', 'dashboard'), { recursive: true });
  writeFileSync(
    instanceFile(workspace),
    JSON.stringify({ schema_version: 1, pid: 999999, host: '127.0.0.1', port: 1, url: 'http://127.0.0.1:1', token: 'f'.repeat(64), workspace, runs_root: join(workspace, '.rstack', 'runs'), started_at: '2020-01-01T00:00:00.000Z', node: 'v0', server_version: 1 }),
  );
  assert.equal((await dashboardStatus(workspace)).status, 'STALE');
  const started = await ensureDashboard(workspace, { env: LIVE });
  assert.equal(started.status, 'STARTED', started.detail ?? '');
  assert.notEqual(readInstance(workspace)?.pid, 999999);
  // Another workspace's live server, copied as this workspace's instance file: refused as foreign.
  const otherStart = await ensureDashboard(other, { env: LIVE });
  assert.equal(otherStart.status, 'STARTED');
  await stopDashboard(workspace);
  await new Promise((r) => setTimeout(r, 300));
  writeFileSync(instanceFile(workspace), readFileSync(instanceFile(other)));
  const status = await dashboardStatus(workspace);
  assert.equal(status.status, 'FOREIGN');
  const again = await ensureDashboard(workspace, { env: LIVE });
  assert.equal(again.status, 'STARTED');
  assert.notEqual(readInstance(workspace)?.port, readInstance(other)?.port);
});

test('a configured port that is in use is reported, and the process holding it is left alone', async (t) => {
  const workspace = tmpDir('lifecycle-port');
  const blocker = createServer();
  await new Promise<void>((r) => blocker.listen(0, '127.0.0.1', () => r()));
  const port = (blocker.address() as { port: number }).port;
  t.after(async () => {
    blocker.close();
    await stopped(workspace);
  });
  const result = await ensureDashboard(workspace, { env: LIVE, port, timeoutMs: 6000 });
  assert.equal(result.status, 'UNAVAILABLE');
  assert.match(result.detail ?? '', /EADDRINUSE|in use/);
  assert.ok(blocker.listening, 'the other process still holds the port');
  assert.ok(!existsSync(instanceFile(workspace)));
});

test('the headless switch and the explicit flag keep every engine command free of a dashboard', async () => {
  const workspace = tmpDir('lifecycle-off');
  const off = await ensureDashboard(workspace, { env: { RSTACK_DASHBOARD: 'off' } });
  assert.deepEqual([off.status, off.url], ['DISABLED', null]);
  const flagged = await ensureDashboard(workspace, { env: LIVE, disabled: true });
  assert.equal(flagged.status, 'DISABLED');
  assert.ok(!existsSync(join(workspace, '.rstack', 'dashboard')));
});

test('rstack start reports the dashboard in its reply, status never starts one, and a terminal transition writes the report', async (t) => {
  const workspace = tmpDir('lifecycle-cli');
  t.after(() => stopped(workspace));
  const started = cli(['start', '--workspace', workspace, '--request', REQUEST, '--app', APP, '--profile', PROFILE, '--simulated'], [], LIVE);
  assert.equal(started.reply.code, 'STARTED');
  const dashboard = started.reply.dashboard as { status: string; url: string | null; run_url: string | null };
  assert.equal(dashboard.status, 'STARTED', JSON.stringify(dashboard));
  assert.match(dashboard.run_url ?? '', new RegExp(`\\?t=[0-9a-f]{64}#run=${started.reply.run_id}$`));
  assert.match(started.stderr, /RSTACK dashboard: http:\/\/127\.0\.0\.1:/);
  const run = ['--workspace', workspace, '--run', started.reply.run_id as string];
  // status is a read: it starts nothing and says nothing about the dashboard.
  await stopDashboard(workspace);
  await new Promise((r) => setTimeout(r, 300));
  const status = cli(['status', ...run], [], LIVE);
  assert.equal(status.reply.code, 'STATUS');
  assert.equal(status.reply.dashboard, undefined);
  assert.ok(!existsSync(instanceFile(workspace)), 'status did not start a dashboard');
  // A start with the dashboard off still starts the run.
  const quiet = cli(['start', '--workspace', workspace, '--request', REQUEST, '--app', APP, '--profile', PROFILE, '--simulated', '--no-dashboard'], [], LIVE);
  assert.equal(quiet.reply.code, 'STARTED');
  assert.equal((quiet.reply.dashboard as { status: string }).status, 'DISABLED');
  // The report command and the automatic report at a terminal transition.
  const refused = cli(['report', ...run]);
  assert.equal(refused.reply.code, 'NOT_TERMINAL');
  assert.equal(refused.status, 2);
});

test('a human reject through the CLI ends the run and writes the report without changing the engine reply', async () => {
  const run = await scenarioRun('plan-decision');
  const waiting = run.assembly.engine.status(run.runId);
  const file = join(run.workspace, 'decision.json');
  writeFileSync(file, decision(waiting, { action: 'reject' }));
  const decided = cli(['decide', '--workspace', run.workspace, '--run', run.runId, '--file', file]);
  assert.equal(decided.reply.code, 'DECISION_RECORDED');
  assert.equal(decided.status, 0);
  assert.equal(decided.reply.directive?.kind, 'DONE');
  const report = decided.reply.report as { status: string; path: string };
  assert.equal(report.status, 'WRITTEN');
  assert.equal(report.path, reportLocation(run.workspace, run.runId));
  assert.ok(existsSync(report.path));
  assert.match(decided.stderr, /RSTACK report: /);
  const again = cli(['report', '--workspace', run.workspace, '--run', run.runId]);
  assert.equal(again.reply.code, 'UNCHANGED');
  assert.equal(again.status, 0);
});

test('the dashboard command reports and stops an instance', async (t) => {
  const workspace = tmpDir('lifecycle-cmd');
  t.after(() => stopped(workspace));
  assert.equal(cli(['dashboard', '--workspace', workspace]).reply.code, 'STOPPED');
  const started = cli(['dashboard', '--workspace', workspace, '--do', 'start'], [], LIVE);
  assert.equal(started.reply.code, 'STARTED', JSON.stringify(started.reply));
  assert.equal(cli(['dashboard', '--workspace', workspace, '--do', 'status']).reply.code, 'RUNNING');
  assert.equal(cli(['dashboard', '--workspace', workspace, '--do', 'stop']).reply.code, 'STOPPED');
});
