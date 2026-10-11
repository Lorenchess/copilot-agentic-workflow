// Starting, finding, and stopping the dashboard for one workspace. The
// engine's commands are short-lived processes, so the dashboard is a
// detached process of its own, described by an instance file under the
// workspace. A caller reuses a live instance of the same workspace, replaces
// a dead or foreign one, and never kills a process it did not start. Nothing
// here can fail an engine command: every outcome is a status, never a throw.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const INSTANCE_DIR = ['.rstack', 'dashboard'];
export const DEFAULT_START_TIMEOUT_MS = 5000;

export interface Instance {
  schema_version: 1;
  pid: number;
  host: string;
  port: number;
  url: string;
  token: string;
  workspace: string;
  runs_root: string;
  started_at: string;
  node: string;
  server_version: number;
}

export interface DashboardStatus {
  status: 'STARTED' | 'REUSED' | 'DISABLED' | 'UNAVAILABLE';
  url: string | null;
  // The URL to open once in a browser: it carries the token and sets the cookie.
  entry_url: string | null;
  instance_file: string | null;
  pid: number | null;
  detail: string | null;
}

export interface EnsureOptions {
  env?: NodeJS.ProcessEnv;
  disabled?: boolean;
  port?: number;
  timeoutMs?: number;
  mainScript?: string;
}

const MAIN_SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), 'main.ts');
const TOKEN = /^[0-9a-f]{64}$/;

export function instanceDir(workspace: string): string {
  return join(resolve(workspace), ...INSTANCE_DIR);
}

export function instanceFile(workspace: string): string {
  return join(instanceDir(workspace), 'instance.json');
}

export function failureFile(workspace: string): string {
  return join(instanceDir(workspace), 'start-failure.json');
}

export function entryUrl(instance: Pick<Instance, 'url' | 'token'>): string {
  return `${instance.url}/?t=${instance.token}`;
}

export function runUrl(instance: Pick<Instance, 'url' | 'token'>, runId: string): string {
  return `${entryUrl(instance)}#run=${encodeURIComponent(runId)}`;
}

export function readInstance(workspace: string): Instance | null {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(instanceFile(workspace), 'utf8'));
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (o.schema_version !== 1) return null;
  if (!Number.isInteger(o.pid) || (o.pid as number) <= 0) return null;
  if (!Number.isInteger(o.port) || (o.port as number) <= 0 || (o.port as number) > 65535) return null;
  for (const key of ['host', 'url', 'token', 'workspace', 'runs_root', 'started_at', 'node']) if (typeof o[key] !== 'string') return null;
  if (!TOKEN.test(o.token as string)) return null;
  if (!/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):[0-9]{1,5}$/.test(o.url as string)) return null;
  if (!Number.isInteger(o.server_version)) return null;
  return o as unknown as Instance;
}

export function writeInstance(workspace: string, instance: Instance): void {
  mkdirSync(instanceDir(workspace), { recursive: true });
  const path = instanceFile(workspace);
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(instance, null, 2)}\n`);
  renameSync(tmp, path);
}

// Removes the instance file only when it still describes this token.
export function removeInstance(workspace: string, token: string): void {
  const current = readInstance(workspace);
  if (current && current.token === token) rmSync(instanceFile(workspace), { force: true });
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code !== 'ESRCH';
  }
}

function samePath(a: string, b: string): boolean {
  const norm = (p: string): string => resolve(p).replaceAll('\\', '/').replace(/\/$/, '').toLowerCase();
  return norm(a) === norm(b);
}

function httpJson(url: string, token: string, method: 'GET' | 'POST', timeoutMs: number): Promise<{ status: number; body: Record<string, unknown> | null }> {
  return new Promise((resolveJson) => {
    let settled = false;
    const done = (value: { status: number; body: Record<string, unknown> | null }): void => {
      if (!settled) {
        settled = true;
        resolveJson(value);
      }
    };
    let req: ReturnType<typeof request>;
    try {
      req = request(url, { method, headers: { authorization: `Bearer ${token}` }, timeout: timeoutMs }, (res) => {
        let text = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          if (text.length < 65536) text += chunk;
        });
        res.on('end', () => {
          let body: Record<string, unknown> | null = null;
          try {
            const parsed = JSON.parse(text) as unknown;
            body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
          } catch {
            body = null;
          }
          done({ status: res.statusCode ?? 0, body });
        });
      });
    } catch {
      done({ status: 0, body: null });
      return;
    }
    req.on('error', () => done({ status: 0, body: null }));
    req.on('timeout', () => {
      req.destroy();
      done({ status: 0, body: null });
    });
    req.end();
  });
}

export type Liveness = 'LIVE' | 'DEAD' | 'FOREIGN';

// Whether the described instance is alive, is ours (same workspace and
// token), or belongs to something else. A process that is gone is DEAD; a
// process that answers but for another workspace or token is FOREIGN.
export async function probeInstance(workspace: string, instance: Instance, timeoutMs = 1500): Promise<Liveness> {
  if (!pidAlive(instance.pid)) return 'DEAD';
  const { status, body } = await httpJson(`${instance.url}/api/v1/health`, instance.token, 'GET', timeoutMs);
  if (status === 0) return 'DEAD';
  if (status !== 200 || !body || body.ok !== true || body.token_ok !== true) return 'FOREIGN';
  if (typeof body.workspace !== 'string' || !samePath(body.workspace, workspace)) return 'FOREIGN';
  if (typeof body.pid === 'number' && body.pid !== instance.pid) return 'FOREIGN';
  return 'LIVE';
}

export interface InstanceStatus {
  status: 'RUNNING' | 'STOPPED' | 'STALE' | 'FOREIGN';
  url: string | null;
  entry_url: string | null;
  pid: number | null;
  instance_file: string;
  detail: string | null;
}

export async function dashboardStatus(workspace: string): Promise<InstanceStatus> {
  const file = instanceFile(workspace);
  const instance = readInstance(workspace);
  if (!instance) return { status: 'STOPPED', url: null, entry_url: null, pid: null, instance_file: file, detail: existsSync(file) ? 'the instance file is unreadable' : 'no instance file' };
  const liveness = await probeInstance(workspace, instance);
  if (liveness === 'LIVE') return { status: 'RUNNING', url: instance.url, entry_url: entryUrl(instance), pid: instance.pid, instance_file: file, detail: null };
  if (liveness === 'DEAD') return { status: 'STALE', url: null, entry_url: null, pid: instance.pid, instance_file: file, detail: `process ${instance.pid} no longer answers; the next start replaces the instance file` };
  return { status: 'FOREIGN', url: null, entry_url: null, pid: instance.pid, instance_file: file, detail: 'the instance file describes a server that is not this workspace\'s dashboard; it is not adopted' };
}

function disabledBy(env: NodeJS.ProcessEnv): boolean {
  const v = (env.RSTACK_DASHBOARD ?? '').trim().toLowerCase();
  return v === 'off' || v === '0' || v === 'false' || v === 'no';
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function ensureDashboard(workspace: string, options: EnsureOptions = {}): Promise<DashboardStatus> {
  const env = options.env ?? process.env;
  const file = instanceFile(workspace);
  const none = (status: DashboardStatus['status'], detail: string | null): DashboardStatus => ({ status, url: null, entry_url: null, instance_file: null, pid: null, detail });
  if (options.disabled || disabledBy(env)) return none('DISABLED', 'dashboard disabled by --no-dashboard or RSTACK_DASHBOARD=off');
  try {
    const existing = readInstance(workspace);
    if (existing) {
      const liveness = await probeInstance(workspace, existing);
      if (liveness === 'LIVE') return { status: 'REUSED', url: existing.url, entry_url: entryUrl(existing), instance_file: file, pid: existing.pid, detail: null };
      rmSync(file, { force: true });
    }
    const port = options.port ?? (env.RSTACK_DASHBOARD_PORT && /^[0-9]{1,5}$/.test(env.RSTACK_DASHBOARD_PORT) ? Number(env.RSTACK_DASHBOARD_PORT) : 0);
    if (!Number.isInteger(port) || port < 0 || port > 65535) return none('UNAVAILABLE', 'the configured dashboard port is not valid');
    mkdirSync(instanceDir(workspace), { recursive: true });
    rmSync(failureFile(workspace), { force: true });
    const script = options.mainScript ?? MAIN_SCRIPT;
    if (!existsSync(script)) return none('UNAVAILABLE', 'the dashboard is not installed beside this engine');
    const spawnedAt = Date.now();
    let exited: number | null = null;
    const child = spawn(process.execPath, [script, '--workspace', resolve(workspace), '--port', String(port)], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: { ...env, RSTACK_DASHBOARD: 'on' },
    });
    child.on('exit', (code) => {
      exited = code ?? -1;
    });
    child.on('error', () => {
      exited = -1;
    });
    child.unref();
    const deadline = spawnedAt + (options.timeoutMs ?? DEFAULT_START_TIMEOUT_MS);
    while (Date.now() < deadline) {
      await sleep(50);
      const failure = failureFile(workspace);
      if (existsSync(failure) && statSync(failure).mtimeMs >= spawnedAt - 1000) {
        let detail = 'the dashboard process could not start';
        try {
          const f = JSON.parse(readFileSync(failure, 'utf8')) as { code?: string; message?: string };
          detail = `${f.code ?? 'ERROR'}: ${f.message ?? detail}`;
        } catch {
          // keep the generic detail
        }
        return none('UNAVAILABLE', detail);
      }
      const instance = readInstance(workspace);
      if (instance && instance.pid !== (existing?.pid ?? -1) && statSync(file).mtimeMs >= spawnedAt - 1000) {
        const liveness = await probeInstance(workspace, instance, 1000);
        if (liveness === 'LIVE') return { status: 'STARTED', url: instance.url, entry_url: entryUrl(instance), instance_file: file, pid: instance.pid, detail: null };
      }
      if (exited !== null && !existsSync(file)) return none('UNAVAILABLE', `the dashboard process ended before it listened (exit code ${exited})`);
    }
    return none('UNAVAILABLE', 'the dashboard did not report itself alive in time; a later start reuses it if it is');
  } catch (e) {
    return none('UNAVAILABLE', (e as Error).message);
  }
}

export interface StopStatus {
  status: 'STOPPED' | 'NOT_RUNNING' | 'FOREIGN' | 'UNAVAILABLE';
  pid: number | null;
  detail: string | null;
}

// Asks a live instance of this workspace to stop. A stale instance file is
// removed; a foreign server is left alone.
export async function stopDashboard(workspace: string): Promise<StopStatus> {
  const instance = readInstance(workspace);
  if (!instance) return { status: 'NOT_RUNNING', pid: null, detail: 'no instance file' };
  const liveness = await probeInstance(workspace, instance);
  if (liveness === 'DEAD') {
    rmSync(instanceFile(workspace), { force: true });
    return { status: 'NOT_RUNNING', pid: instance.pid, detail: 'the instance file was stale and has been removed' };
  }
  if (liveness === 'FOREIGN') return { status: 'FOREIGN', pid: instance.pid, detail: 'the instance file describes a server that is not this workspace\'s dashboard; it is left alone' };
  const { status } = await httpJson(`${instance.url}/api/v1/shutdown`, instance.token, 'POST', 2000);
  if (status !== 200) return { status: 'UNAVAILABLE', pid: instance.pid, detail: `the server answered ${status} to the stop request` };
  // The server removes its own instance file as it exits; wait briefly for that.
  for (let i = 0; i < 40 && existsSync(instanceFile(workspace)); i++) await sleep(50);
  return { status: 'STOPPED', pid: instance.pid, detail: null };
}
