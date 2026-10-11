// The local read-only dashboard service: access control, read-only routes,
// artifact identity re-checks, the event stream, and fault isolation from
// the engine. Evidence class: engine tests (offline; a real HTTP server on
// loopback, a real engine driven by the fake transport).

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { join } from 'node:path';
import { test } from 'node:test';
import { sha256Hex } from '../core/contracts/records.ts';
import type { RunView } from '../core/read-model/contracts.ts';
import { readRun } from '../core/read-model/read-run.ts';
import { type DashboardServer, createDashboardServer } from '../dashboard/server.ts';
import { reportLocation } from '../dashboard/report-writer.ts';
import { completeStep, decision, tmpDir } from './support/harness.ts';
import { scenarioRun } from './support/scenarios.ts';

const TOKEN = 'a'.repeat(64);

function digestDir(dir: string): string {
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name))
    .sort()
    .map((f) => `${f}:${sha256Hex(readFileSync(f))}:${statSync(f).mtimeMs}`);
  return sha256Hex(entries.join('\n'));
}

async function serverFor(workspace: string, extra: Partial<Parameters<typeof createDashboardServer>[0]> = {}): Promise<DashboardServer> {
  return createDashboardServer({ workspace, token: TOKEN, port: 0, pollMs: 50, heartbeatMs: 200, ...extra });
}

const bearer = { authorization: `Bearer ${TOKEN}` };
const get = (server: DashboardServer, path: string, headers: Record<string, string> = bearer, init: RequestInit = {}): Promise<Response> =>
  fetch(`${server.url}${path}`, { headers, redirect: 'manual', ...init });

// A request with an arbitrary Host header, which fetch does not allow.
function rawStatus(server: DashboardServer, path: string, host: string): Promise<number> {
  return new Promise((resolveStatus, reject) => {
    const req = request({ host: '127.0.0.1', port: server.port, path, method: 'GET', setHost: false, headers: { ...bearer, host } }, (res) => {
      res.resume();
      res.on('end', () => resolveStatus(res.statusCode ?? 0));
    });
    req.on('error', reject);
    req.end();
  });
}

// Reads server-sent events until `count` events (not comments) arrived or the time is up.
async function readSse(server: DashboardServer, count: number, lastEventId?: string, timeoutMs = 4000): Promise<{ id: string | null; event: string; data: Record<string, unknown> }[]> {
  const controller = new AbortController();
  const res = await fetch(`${server.url}/api/v1/events`, { headers: { ...bearer, ...(lastEventId ? { 'last-event-id': lastEventId } : {}) }, signal: controller.signal });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /text\/event-stream/);
  const reader = (res.body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  const events: { id: string | null; event: string; data: Record<string, unknown> }[] = [];
  let buffer = '';
  const deadline = Date.now() + timeoutMs;
  while (events.length < count && Date.now() < deadline) {
    const chunk = await Promise.race([reader.read(), new Promise<{ done: true; value: undefined }>((r) => setTimeout(() => r({ done: true, value: undefined }), Math.max(1, deadline - Date.now())))]);
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    let i: number;
    while ((i = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, i);
      buffer = buffer.slice(i + 2);
      if (block.startsWith(':')) continue;
      let id: string | null = null;
      let event = 'message';
      let data = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('id:')) id = line.slice(3).trim();
        else if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (event === 'heartbeat') continue;
      events.push({ id, event, data: data ? (JSON.parse(data) as Record<string, unknown>) : {} });
    }
  }
  controller.abort();
  return events;
}

test('DASH-20: the service binds to loopback, refuses foreign Host and Origin values, and needs the token', async (t) => {
  const run = await scenarioRun('plan-decision');
  const server = await serverFor(run.workspace);
  t.after(() => server.close());
  assert.match(server.url, /^http:\/\/127\.0\.0\.1:\d+$/);
  const port = String(server.port);
  // Host header: only loopback names. (fetch cannot set Host, so a raw request is used.)
  assert.equal(await rawStatus(server, '/api/v1/runs', 'evil.example.test'), 400);
  assert.equal(await rawStatus(server, '/api/v1/runs', `attacker.test:${port}`), 400);
  assert.equal(await rawStatus(server, '/api/v1/runs', `127.0.0.1:${Number(port) + 1}`), 400, 'another port is another server');
  assert.equal(await rawStatus(server, '/api/v1/runs', `localhost:${port}`), 200);
  assert.equal(await rawStatus(server, '/api/v1/runs', `127.0.0.1:${port}`), 200);
  assert.equal(await rawStatus(server, '/api/v1/runs', ''), 400, 'no host at all');
  // Origin: a cross-origin page cannot read, with or without the token.
  assert.equal((await get(server, '/api/v1/runs', { ...bearer, origin: 'http://attacker.test' })).status, 403);
  assert.equal((await get(server, '/api/v1/runs', { ...bearer, origin: 'http://127.0.0.1:9' })).status, 403);
  assert.equal((await get(server, '/api/v1/runs', { ...bearer, origin: server.url })).status, 200);
  assert.equal((await get(server, '/api/v1/events', { ...bearer, origin: 'http://attacker.test' })).status, 403);
  // Token: absent or wrong is refused; nothing about the run leaks in the refusal.
  const anonymous = await get(server, '/api/v1/runs', {});
  assert.equal(anonymous.status, 401);
  assert.ok(!(await anonymous.text()).includes(run.runId));
  assert.equal((await get(server, '/api/v1/runs', { authorization: `Bearer ${'b'.repeat(64)}` })).status, 401);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}`, {})).status, 401);
  assert.equal((await get(server, '/api/v1/events', {})).status, 401);
  // Methods: GET only on data routes.
  assert.equal((await get(server, '/api/v1/runs', bearer, { method: 'POST' })).status, 405);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}`, bearer, { method: 'DELETE' })).status, 405);
  // Headers on every response.
  const ok = await get(server, '/api/v1/runs');
  assert.equal(ok.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(ok.headers.get('cache-control'), 'no-store');
  assert.equal(ok.headers.get('x-frame-options'), 'DENY');
  assert.equal(ok.headers.get('referrer-policy'), 'no-referrer');
});

test('the browser gets an HttpOnly cookie from the printed URL once, and never from a wrong token', async (t) => {
  const run = await scenarioRun('fresh');
  const server = await serverFor(run.workspace);
  t.after(() => server.close());
  const entry = await get(server, `/?t=${TOKEN}`, {});
  assert.equal(entry.status, 303);
  assert.equal(entry.headers.get('location'), '/');
  const cookie = entry.headers.get('set-cookie') ?? '';
  assert.match(cookie, /^rstack_dash=[0-9a-f]{64}; /);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\//);
  const withCookie = await get(server, '/api/v1/runs', { cookie: cookie.split(';')[0] as string });
  assert.equal(withCookie.status, 200);
  const wrong = await get(server, `/?t=${'c'.repeat(64)}`, {});
  assert.equal(wrong.status, 401);
  assert.equal(wrong.headers.get('set-cookie'), null);
  // Without a cookie the page explains how to open the dashboard and shows no run data.
  const page = await get(server, '/', {});
  assert.equal(page.status, 401);
  const text = await page.text();
  assert.match(text, /rstack/i);
  assert.ok(!text.includes(run.runId));
  // The page itself carries a strict policy.
  const index = await get(server, '/', { cookie: cookie.split(';')[0] as string });
  assert.equal(index.status, 200);
  assert.match(index.headers.get('content-security-policy') ?? '', /default-src 'none'/);
  assert.match(index.headers.get('content-security-policy') ?? '', /script-src 'self'/);
  assert.match(await index.text(), /<!doctype html>/i);
});

test('the run list and the run view are the read model, byte for byte, and the service writes nothing in a run', async (t) => {
  const workspace = tmpDir('server-list');
  const a = await scenarioRun('plan-decision', 'srv-a', 'RUN-A', workspace);
  const b = await scenarioRun('planner-dispatched', 'srv-b', 'RUN-B', workspace);
  const server = await serverFor(workspace);
  t.after(() => server.close());
  const before = digestDir(a.runDir) + digestDir(b.runDir);
  const list = (await (await get(server, '/api/v1/runs')).json()) as { schema_version: number; workspace: { label: string }; runs: { run_id: string; needs_human: boolean; view_digest: string }[]; version: number };
  assert.equal(list.schema_version, 1);
  assert.deepEqual(list.runs.map((r) => r.run_id).sort(), ['RUN-A', 'RUN-B']);
  assert.equal(list.runs.find((r) => r.run_id === 'RUN-A')?.needs_human, true);
  const viewRes = await get(server, '/api/v1/runs/RUN-A');
  assert.equal(viewRes.status, 200);
  assert.match(viewRes.headers.get('content-type') ?? '', /application\/json/);
  const body = (await viewRes.json()) as { view: RunView; report: { available: boolean; path: string | null } };
  assert.equal(body.view.view_digest, readRun(a.assembly.runsRoot, 'RUN-A').view_digest);
  assert.equal(body.view.view_digest, list.runs.find((r) => r.run_id === 'RUN-A')?.view_digest);
  assert.deepEqual(body.report, { available: false, path: null });
  assert.equal((await get(server, '/api/v1/runs/RUN-C')).status, 404);
  assert.equal((await get(server, '/api/v1/runs/..%2F..%2Fx')).status, 400);
  assert.equal((await get(server, '/api/v1/runs/not%20valid')).status, 400);
  assert.equal(digestDir(a.runDir) + digestDir(b.runDir), before);
  assert.ok(!existsSync(join(a.runDir, 'lock')));
});

test('DASH-19: artifacts are served only by identity named in the run, re-hashed, and never by path', async (t) => {
  const run = await scenarioRun('plan-decision');
  const server = await serverFor(run.workspace);
  t.after(() => server.close());
  const view = readRun(run.assembly.runsRoot, run.runId);
  const spec = view.evidence.find((e) => e.key === 'spec') as { ref: string };
  const hex = spec.ref.slice(7);
  const ok = await get(server, `/api/v1/runs/${run.runId}/artifacts/${hex}`);
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get('content-type') ?? '', /^text\/plain/);
  assert.equal(ok.headers.get('content-disposition'), 'inline');
  assert.match(await ok.text(), /^# Specification/);
  // Not named by the run: refused, even when a file of that name exists elsewhere.
  const stray = sha256Hex('stray');
  writeFileSync(join(run.runDir, 'artifacts', stray), 'stray');
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/artifacts/${stray}`)).status, 404);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/artifacts/..%2Fjournal.jsonl`)).status, 400);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/artifacts/${hex.toUpperCase()}`)).status, 400);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/artifacts/${hex}/..%2F..%2Fstate.json`)).status, 400);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/artifacts/journal.jsonl`)).status, 400);
  // Altered bytes under a named identity are refused.
  const path = join(run.runDir, 'artifacts', hex);
  const original = readFileSync(path);
  writeFileSync(path, `${original.toString('utf8')}\n# altered`);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/artifacts/${hex}`)).status, 409);
  writeFileSync(path, original);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/artifacts/${hex}`)).status, 200);
  // The brief is served sandboxed, and only while it is the retained brief.
  const brief = await get(server, `/api/v1/runs/${run.runId}/brief/1`);
  assert.equal(brief.status, 200);
  assert.match(brief.headers.get('content-type') ?? '', /^text\/html/);
  assert.match(brief.headers.get('content-security-policy') ?? '', /sandbox/);
  assert.match(brief.headers.get('content-security-policy') ?? '', /frame-ancestors 'self'/);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/brief/2`)).status, 404);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/brief/x`)).status, 400);
  const briefPath = join(run.runDir, 'brief', 'round-1.html');
  const briefBytes = readFileSync(briefPath);
  writeFileSync(briefPath, `${briefBytes.toString('utf8')}<!-- changed -->`);
  assert.equal((await get(server, `/api/v1/runs/${run.runId}/brief/1`)).status, 409);
  writeFileSync(briefPath, briefBytes);
  // No directory or environment is exposed.
  for (const p of ['/api/v1/runs/' + run.runId + '/artifacts', '/api/v1/runs/' + run.runId + '/artifacts/', '/api/v1/env', '/.rstack/runs', '/../package.json', '/api/v1/runs/' + run.runId + '/work/intent-1/intent.md']) {
    const r = await get(server, p);
    assert.ok(r.status === 404 || r.status === 400, `${p}: ${r.status}`);
  }
  const health = (await (await get(server, '/api/v1/health')).json()) as Record<string, unknown>;
  assert.deepEqual(Object.keys(health).sort(), ['ok', 'pid', 'runs_root', 'schema_version', 'started_at', 'token_ok', 'version', 'workspace']);
});

test('DASH-17: live updates follow committed events only; a reconnecting client catches up or is told to resync', async (t) => {
  const run = await scenarioRun('awaiting-auditor');
  const server = await serverFor(run.workspace);
  t.after(() => server.close());
  const hello = await readSse(server, 1);
  assert.equal(hello[0]?.event, 'hello');
  assert.equal(hello[0]?.data.schema_version, 1);
  const lastId = hello[0]?.id as string;
  const before = readRun(run.assembly.runsRoot, run.runId).journal_version;
  // Nothing changes while nothing is committed: writing scratch files is not an event.
  writeFileSync(join(run.runDir, 'work', 'plan-audit-1', 'scratch.txt'), 'not evidence');
  await new Promise((r) => setTimeout(r, 200));
  const quiet = await readSse(server, 2, lastId, 400);
  assert.deepEqual(quiet.filter((e) => e.event === 'run-changed'), []);
  // One accepted result: one run-changed event with the new journal version.
  const listen = readSse(server, 2, lastId);
  completeStep(run);
  const got = (await listen).filter((e) => e.event === 'run-changed');
  assert.equal(got.length, 1);
  assert.equal(got[0]?.data.run_id, run.runId);
  assert.equal(got[0]?.data.journal_version, before + 1);
  assert.equal(got[0]?.data.view_digest, readRun(run.assembly.runsRoot, run.runId).view_digest);
  // Reconnecting with the last seen id replays what was missed; a very old id gets resync.
  const replay = await readSse(server, 2, lastId, 1500);
  assert.ok(replay.some((e) => e.event === 'run-changed' && e.data.journal_version === before + 1), 'catch-up');
  const stale = await readSse(server, 2, '0', 1500);
  assert.ok(stale.some((e) => e.event === 'resync' || e.event === 'run-changed'));
  // The run was never touched by the viewer: the engine continues normally.
  assert.equal(run.assembly.engine.next(run.runId).code, 'BRIEF_READY');
});

test('a run reaching a terminal state while the service runs gets its report in the derived area, and the view says so', async (t) => {
  const run = await scenarioRun('plan-decision');
  const server = await serverFor(run.workspace);
  t.after(() => server.close());
  const waiting = run.assembly.engine.status(run.runId);
  // The stream is opened after the initial scan: hello, then exactly the terminal change.
  const hello = await readSse(server, 1);
  const listen = readSse(server, 1, hello[0]?.id as string, 15_000);
  assert.equal(run.assembly.engine.decide(run.runId, decision(waiting, { action: 'reject' })).code, 'DECISION_RECORDED');
  const events = await listen;
  const terminal = events.find((e) => e.event === 'run-changed' && e.data.final_outcome === 'REJECTED');
  assert.ok(terminal, `terminal change announced: ${JSON.stringify(events)}`);
  const report = reportLocation(run.workspace, run.runId);
  const deadline = Date.now() + 3000;
  while (!existsSync(report) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
  assert.ok(existsSync(report), 'report written by the service');
  const body = (await (await get(server, `/api/v1/runs/${run.runId}`)).json()) as { report: { available: boolean; path: string | null } };
  assert.equal(body.report.available, true);
  assert.equal(body.report.path, report);
  const served = await get(server, `/api/v1/runs/${run.runId}/report`);
  assert.equal(served.status, 200);
  assert.match(served.headers.get('content-security-policy') ?? '', /sandbox/);
  assert.match(await served.text(), /Rejected by the human/);
  assert.ok(!existsSync(join(run.runDir, 'report.html')));
});

test('shutdown needs the token and stops the service; the engine is unaffected by a stopped or crashed service', async (t) => {
  const run = await scenarioRun('awaiting-auditor');
  const server = await serverFor(run.workspace);
  t.after(() => server.close().catch(() => undefined));
  assert.equal((await get(server, '/api/v1/shutdown', {}, { method: 'POST' })).status, 401);
  assert.equal((await get(server, '/api/v1/shutdown', bearer, { method: 'GET' })).status, 405);
  const stop = await get(server, '/api/v1/shutdown', bearer, { method: 'POST' });
  assert.equal(stop.status, 200);
  await new Promise((r) => setTimeout(r, 100));
  await assert.rejects(fetch(`${server.url}/api/v1/runs`, { headers: bearer }));
  // With the service gone the engine proceeds exactly as before.
  completeStep(run);
  assert.equal(run.assembly.engine.next(run.runId).code, 'BRIEF_READY');
  assert.equal(run.assembly.engine.status(run.runId).phase, 'WAITING_HUMAN');
});

test('the service survives a corrupt run and an unreadable record without losing the other runs', async (t) => {
  const workspace = tmpDir('server-corrupt');
  const good = await scenarioRun('fresh', 'srv-good', 'RUN-GOOD', workspace);
  const bad = await scenarioRun('plan-decision', 'srv-bad', 'RUN-BAD', workspace);
  writeFileSync(join(bad.runDir, 'journal.jsonl'), 'garbage\n');
  const server = await serverFor(workspace);
  t.after(() => server.close());
  const list = (await (await get(server, '/api/v1/runs')).json()) as { runs: { run_id: string; source_status: string }[] };
  assert.deepEqual(list.runs.map((r) => [r.run_id, r.source_status]).sort(), [['RUN-BAD', 'CORRUPT'], ['RUN-GOOD', 'CURRENT']]);
  const view = (await (await get(server, '/api/v1/runs/RUN-BAD')).json()) as { view: RunView };
  assert.equal(view.view.source_status, 'CORRUPT');
  assert.equal(view.view.diagnostic.code, 'JOURNAL_CORRUPT');
  assert.equal(good.runId, 'RUN-GOOD');
});
