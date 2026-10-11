// The local read-only dashboard service. It serves the read model of one
// workspace's runs to a browser on the loopback interface and nothing else:
// no engine command, no write to a run, no path parameter, no environment.
//
// Access control, applied to every request before any route:
//   - the Host header must name the loopback interface (DNS rebinding);
//   - an Origin header, when present, must be this server's own origin;
//   - every data route needs the instance token, as the HttpOnly cookie the
//     browser receives once from the printed URL, or as a bearer header;
//   - only GET and HEAD, except the token-protected POST that stops the server.
// Every served record is read again under its identity; altered bytes are
// refused. The human brief and the report are served under a sandboxing
// policy so nothing in them can run.

import { timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { type IncomingMessage, type Server, type ServerResponse, createServer } from 'node:http';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ID_PATTERN, refOf, sha256Hex } from '../core/contracts/records.ts';
import { DASHBOARD_SCHEMA_VERSION, type RunView } from '../core/read-model/contracts.ts';
import { runDirectory } from '../core/read-model/read-run.ts';
import { reportLocation } from './report-writer.ts';
import { type RunWatcher, type WatchEvent, createRunWatcher } from './watch.ts';

export const SERVER_VERSION = 1;
export const COOKIE = 'rstack_dash';
const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), 'web');
const MAX_SERVED_BYTES = 1024 * 1024;
const HEX = /^[0-9a-f]{64}$/;
const TOKEN = /^[0-9a-f]{64}$/;
const LOOPBACK_HOST = /^(127\.0\.0\.1|localhost|\[::1\])(?::([0-9]{1,5}))?$/i;
const STATIC_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const PAGE_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; base-uri 'none'; form-action 'none'";
const SANDBOX_CSP = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'self'";

export interface DashboardServerOptions {
  workspace: string;
  // 64 hex characters. The caller generates it and writes it to the instance file.
  token: string;
  port?: number;
  host?: string;
  pollMs?: number;
  heartbeatMs?: number;
  maxStreams?: number;
  webRoot?: string;
  writeReports?: boolean;
  // Called when no client has been connected and no run has changed for this long.
  idleExitMs?: number | null;
  onIdle?: () => void;
  // Called once after the server has closed, by whichever path closed it.
  onClosed?: () => void;
  onError?: (where: string, error: unknown) => void;
  now?: () => Date;
}

export interface DashboardServer {
  url: string;
  host: string;
  port: number;
  token: string;
  workspace: string;
  runsRoot: string;
  started_at: string;
  watcher: RunWatcher;
  streams(): number;
  close(): Promise<void>;
}

interface Ctx {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  segments: string[];
  authorized: boolean;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(text) });
  res.end(text);
}

function refuse(res: ServerResponse, status: number, code: string, message: string): void {
  sendJson(res, status, { ok: false, code, message });
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Every identity a view names: the only artifacts the service will serve for that run.
function namedIdentities(view: RunView): Set<string> {
  const out = new Set<string>();
  for (const m of JSON.stringify(view).matchAll(/sha256:([0-9a-f]{64})/g)) out.add(m[1] as string);
  return out;
}

export async function createDashboardServer(options: DashboardServerOptions): Promise<DashboardServer> {
  if (!TOKEN.test(options.token)) throw new Error('the instance token must be 64 hexadecimal characters');
  const host = options.host ?? '127.0.0.1';
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') throw new Error('the dashboard binds to the loopback interface only');
  const workspace = resolve(options.workspace);
  const webRoot = resolve(options.webRoot ?? WEB_ROOT);
  const heartbeatMs = options.heartbeatMs ?? 10_000;
  const maxStreams = options.maxStreams ?? 16;
  const now = options.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const onError = options.onError ?? (() => undefined);
  const watcher = createRunWatcher({ workspace, pollMs: options.pollMs, writeReports: options.writeReports, now, onError });
  const streams = new Set<ServerResponse>();
  let port = 0;
  let lastActivity = Date.now();

  // Static files: the files directly inside the web root, by exact name.
  const staticFiles = new Map<string, { path: string; type: string }>();
  if (existsSync(webRoot)) {
    for (const name of readdirSync(webRoot)) {
      const ext = name.slice(name.lastIndexOf('.'));
      if (/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) && STATIC_TYPES[ext] && statSync(join(webRoot, name)).isFile()) staticFiles.set(name, { path: join(webRoot, name), type: STATIC_TYPES[ext] as string });
    }
  }

  const baseHeaders = (res: ServerResponse, frame: 'DENY' | 'SAMEORIGIN' = 'DENY'): void => {
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('cache-control', 'no-store');
    res.setHeader('referrer-policy', 'no-referrer');
    res.setHeader('x-frame-options', frame);
    res.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  };

  const ownOrigin = (): string => `http://${host === '::1' ? '[::1]' : host}:${port}`;

  function authorized(req: IncomingMessage): boolean {
    const auth = req.headers.authorization;
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) return safeEqual(auth.slice(7).trim(), options.token);
    const cookie = parseCookies(req.headers.cookie)[COOKIE];
    return typeof cookie === 'string' && safeEqual(cookie, options.token);
  }

  function gate(req: IncomingMessage, res: ServerResponse): Ctx | null {
    baseHeaders(res);
    const hostHeader = req.headers.host ?? '';
    const m = LOOPBACK_HOST.exec(hostHeader);
    if (!m || (m[2] !== undefined && Number(m[2]) !== port)) {
      refuse(res, 400, 'HOST_NOT_LOOPBACK', 'this service answers only on its loopback address');
      return null;
    }
    const origin = req.headers.origin;
    if (origin !== undefined) {
      const allowed = [ownOrigin(), `http://localhost:${port}`, `http://127.0.0.1:${port}`];
      if (!allowed.includes(origin)) {
        refuse(res, 403, 'ORIGIN_REFUSED', 'cross-origin requests are refused');
        return null;
      }
    }
    let url: URL;
    try {
      url = new URL(req.url ?? '/', ownOrigin());
    } catch {
      refuse(res, 400, 'BAD_REQUEST', 'the request path is not valid');
      return null;
    }
    if ((req.url ?? '').length > 2048) {
      refuse(res, 414, 'URI_TOO_LONG', 'the request path is too long');
      return null;
    }
    const segments = url.pathname.split('/').filter((s) => s.length > 0);
    for (let i = 0; i < segments.length; i++) {
      try {
        segments[i] = decodeURIComponent(segments[i] as string);
      } catch {
        refuse(res, 400, 'BAD_REQUEST', 'the request path is not valid');
        return null;
      }
    }
    return { req, res, url, segments, authorized: authorized(req) };
  }

  function requireAuth(ctx: Ctx): boolean {
    if (ctx.authorized) return true;
    refuse(ctx.res, 401, 'UNAUTHORIZED', 'this service needs the instance token; open the dashboard through the URL printed by rstack start');
    return false;
  }

  function requireGet(ctx: Ctx): boolean {
    if (ctx.req.method === 'GET' || ctx.req.method === 'HEAD') return true;
    ctx.res.setHeader('allow', 'GET, HEAD');
    refuse(ctx.res, 405, 'METHOD_NOT_ALLOWED', 'this service is read-only');
    return false;
  }

  function serveFile(ctx: Ctx, path: string, type: string, extra: Record<string, string> = {}): void {
    let bytes: Buffer;
    try {
      bytes = readFileSync(path);
    } catch {
      refuse(ctx.res, 404, 'NOT_FOUND', 'no such file');
      return;
    }
    ctx.res.writeHead(200, { 'content-type': type, 'content-length': bytes.length, ...extra });
    ctx.res.end(ctx.req.method === 'HEAD' ? undefined : bytes);
  }

  // A run id from the path, validated; null after a refusal has been sent.
  function runIdOf(ctx: Ctx, raw: string | undefined): string | null {
    if (raw === undefined || !ID_PATTERN.test(raw)) {
      refuse(ctx.res, 400, 'INVALID_RUN_ID', 'run id has an invalid format');
      return null;
    }
    return raw;
  }

  function currentView(runId: string): RunView | null {
    watcher.refresh(runId);
    return watcher.view(runId);
  }

  function runRoute(ctx: Ctx, runId: string, rest: string[]): void {
    const view = currentView(runId);
    if (!view) {
      refuse(ctx.res, 404, 'RUN_NOT_FOUND', 'no such run');
      return;
    }
    if (rest.length === 0) {
      const report = watcher.report(runId);
      sendJson(ctx.res, 200, { schema_version: DASHBOARD_SCHEMA_VERSION, view, report: { available: report !== null, path: report } });
      return;
    }
    const [kind, arg, ...more] = rest;
    let runDir: string;
    try {
      runDir = runDirectory(watcher.runsRoot, runId);
    } catch {
      refuse(ctx.res, 400, 'INVALID_RUN_ID', 'run id has an invalid format');
      return;
    }
    if (kind === 'artifacts') {
      if (arg === undefined) {
        refuse(ctx.res, 404, 'NOT_FOUND', 'artifacts are served by identity only');
        return;
      }
      if (!HEX.test(arg) || more.length > 0) {
        refuse(ctx.res, 400, 'INVALID_ARTIFACT', 'an artifact is named by its 64-character lowercase hexadecimal identity');
        return;
      }
      if (!namedIdentities(view).has(arg)) {
        refuse(ctx.res, 404, 'NOT_FOUND', 'the run names no such record');
        return;
      }
      // The local sink retains the proposal outside artifacts/. Resolve only
      // its journal-recorded relative location, then apply the same hash and
      // containment checks used for every other retained record.
      const proposal = view.proposal;
      const location = proposal?.proposal_ref === `sha256:${arg}` ? proposal.location : null;
      if (location && !/^[A-Za-z0-9_][A-Za-z0-9._-]*(\/[A-Za-z0-9_][A-Za-z0-9._-]*)*$/.test(location)) {
        refuse(ctx.res, 404, 'NOT_FOUND', 'invalid retained proposal location');
        return;
      }
      const path = location ? join(runDir, ...location.split('/')) : join(runDir, 'artifacts', arg);
      serveRetained(ctx, runDir, path, `sha256:${arg}`, 'text/plain; charset=utf-8', { 'content-disposition': 'inline' });
      return;
    }
    if (kind === 'brief') {
      if (arg === undefined || !/^[1-9][0-9]?$/.test(arg) || more.length > 0) {
        refuse(ctx.res, 400, 'INVALID_ROUND', 'a brief is named by its round number');
        return;
      }
      const briefRefs = view.evidence.filter((e) => e.key === 'brief').map((e) => e.ref);
      const path = join(runDir, 'brief', `round-${arg}.html`);
      if (!existsSync(path)) {
        refuse(ctx.res, 404, 'NOT_FOUND', 'no brief for that round');
        return;
      }
      serveRetainedAny(ctx, runDir, path, briefRefs, 'text/html; charset=utf-8', { 'content-security-policy': SANDBOX_CSP }, 'SAMEORIGIN');
      return;
    }
    if (kind === 'report' && arg === undefined) {
      const path = reportLocation(workspace, runId);
      if (!existsSync(path)) {
        refuse(ctx.res, 404, 'NOT_FOUND', 'no report has been generated for this run');
        return;
      }
      baseHeaders(ctx.res, 'SAMEORIGIN');
      serveFile(ctx, path, 'text/html; charset=utf-8', { 'content-security-policy': SANDBOX_CSP });
      return;
    }
    refuse(ctx.res, 404, 'NOT_FOUND', 'no such route');
  }

  function serveRetained(ctx: Ctx, runDir: string, path: string, ref: string, type: string, extra: Record<string, string>): void {
    serveRetainedAny(ctx, runDir, path, [ref], type, extra, 'DENY');
  }

  // Serves a file only when its bytes carry one of the expected identities
  // and it lies inside the run directory without a link on the way.
  function serveRetainedAny(ctx: Ctx, runDir: string, path: string, refs: string[], type: string, extra: Record<string, string>, frame: 'DENY' | 'SAMEORIGIN'): void {
    let bytes: Buffer;
    try {
      const real = realpathSync(path);
      if (!real.startsWith(realpathSync(runDir) + sep)) {
        refuse(ctx.res, 404, 'NOT_FOUND', 'no such record');
        return;
      }
      if (statSync(real).size > MAX_SERVED_BYTES) {
        refuse(ctx.res, 413, 'TOO_LARGE', 'the record is larger than the viewer serves');
        return;
      }
      bytes = readFileSync(real);
    } catch {
      refuse(ctx.res, 404, 'NOT_FOUND', 'no such record');
      return;
    }
    const actual = refOf(bytes);
    if (!refs.includes(actual)) {
      refuse(ctx.res, 409, 'IDENTITY_MISMATCH', 'the file no longer matches the identity the run recorded; it is not served');
      return;
    }
    baseHeaders(ctx.res, frame);
    ctx.res.writeHead(200, { 'content-type': type, 'content-length': bytes.length, 'x-rstack-identity': actual, ...extra });
    ctx.res.end(ctx.req.method === 'HEAD' ? undefined : bytes);
  }

  function eventsRoute(ctx: Ctx): void {
    if (streams.size >= maxStreams) {
      refuse(ctx.res, 503, 'TOO_MANY_STREAMS', 'too many event streams are open');
      return;
    }
    const res = ctx.res;
    res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', connection: 'keep-alive', 'x-accel-buffering': 'no' });
    let first = true;
    const write = (event: string, id: number, data: unknown): void => {
      // The reconnection delay travels with the first event, not as a block of its own.
      res.write(`${first ? 'retry: 2000\n' : ''}id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      first = false;
    };
    streams.add(res);
    lastActivity = Date.now();
    const lastHeader = ctx.req.headers['last-event-id'];
    const last = typeof lastHeader === 'string' && /^[0-9]{1,15}$/.test(lastHeader) ? Number(lastHeader) : null;
    write('hello', watcher.lastId(), { schema_version: DASHBOARD_SCHEMA_VERSION, server_version: SERVER_VERSION, started_at: startedAt, workspace: basename(workspace), version: watcher.lastId() });
    if (last !== null) {
      const missed = watcher.since(last);
      if (missed === null) write('resync', watcher.lastId(), { reason: 'the event history no longer reaches that point; reload the run list' });
      else for (const e of missed) write(e.type, e.id, e);
    }
    const unsubscribe = watcher.subscribe((e: WatchEvent) => write(e.type, e.id, e));
    // A named event, not a comment: a browser's EventSource never sees
    // comments, and the page uses the heartbeat to tell live from stale.
    const beat = setInterval(() => {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ at: now().toISOString(), version: watcher.lastId() })}\n\n`);
    }, heartbeatMs);
    const done = (): void => {
      clearInterval(beat);
      unsubscribe();
      streams.delete(res);
      lastActivity = Date.now();
    };
    ctx.req.on('close', done);
    res.on('close', done);
  }

  function handle(req: IncomingMessage, res: ServerResponse): void {
    const ctx = gate(req, res);
    if (!ctx) return;
    const { segments } = ctx;
    // Entry with the token: set the cookie once and clean the URL.
    if (segments.length === 0 && ctx.url.searchParams.has('t')) {
      const t = ctx.url.searchParams.get('t') ?? '';
      if (!TOKEN.test(t) || !safeEqual(t, options.token)) {
        refuse(res, 401, 'UNAUTHORIZED', 'that is not this dashboard\'s token');
        return;
      }
      res.setHeader('set-cookie', `${COOKIE}=${options.token}; HttpOnly; SameSite=Strict; Path=/`);
      res.writeHead(303, { location: '/' });
      res.end();
      return;
    }
    if (segments[0] === 'api') {
      if (segments[1] !== 'v1') {
        refuse(res, 404, 'NOT_FOUND', 'unknown API version');
        return;
      }
      if (segments[2] === 'shutdown' && segments.length === 3) {
        if (req.method !== 'POST') {
          res.setHeader('allow', 'POST');
          refuse(res, 405, 'METHOD_NOT_ALLOWED', 'shutdown is a POST');
          return;
        }
        if (!requireAuth(ctx)) return;
        sendJson(res, 200, { ok: true, code: 'STOPPING' });
        setTimeout(() => void close(), 10);
        return;
      }
      if (!requireGet(ctx)) return;
      if (!requireAuth(ctx)) return;
      lastActivity = Date.now();
      if (segments[2] === 'health' && segments.length === 3) {
        sendJson(res, 200, { ok: true, schema_version: DASHBOARD_SCHEMA_VERSION, version: SERVER_VERSION, workspace, runs_root: watcher.runsRoot, token_ok: true, started_at: startedAt, pid: process.pid });
        return;
      }
      if (segments[2] === 'events' && segments.length === 3) {
        eventsRoute(ctx);
        return;
      }
      if (segments[2] === 'runs') {
        if (segments.length === 3) {
          watcher.refresh();
          sendJson(res, 200, { schema_version: DASHBOARD_SCHEMA_VERSION, workspace: { label: basename(workspace), path: workspace }, runs_root: watcher.runsRoot, version: watcher.lastId(), runs: watcher.list() });
          return;
        }
        const runId = runIdOf(ctx, segments[3]);
        if (runId === null) return;
        runRoute(ctx, runId, segments.slice(4));
        return;
      }
      refuse(res, 404, 'NOT_FOUND', 'no such route');
      return;
    }
    if (!requireGet(ctx)) return;
    if (segments.length === 0) {
      if (!ctx.authorized) {
        res.writeHead(401, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" });
        res.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>RSTACK dashboard</title><style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.5}</style></head><body><h1>RSTACK dashboard</h1><p>This page needs the dashboard token. Open the dashboard through the URL printed by <code>rstack start</code> (or by <code>rstack dashboard status</code>), which carries it once and sets a cookie for this browser.</p></body></html>');
        return;
      }
      const index = staticFiles.get('index.html');
      if (!index) {
        refuse(res, 503, 'UI_UNAVAILABLE', 'the dashboard page is not installed beside the service');
        return;
      }
      serveFile(ctx, index.path, index.type, { 'content-security-policy': PAGE_CSP });
      return;
    }
    if (segments.length === 1) {
      const file = staticFiles.get(segments[0] as string);
      if (file && segments[0] !== 'index.html') {
        serveFile(ctx, file.path, file.type, file.type.startsWith('text/html') ? { 'content-security-policy': PAGE_CSP } : {});
        return;
      }
    }
    refuse(res, 404, 'NOT_FOUND', 'no such route');
  }

  const server: Server = createServer((req, res) => {
    try {
      handle(req, res);
    } catch (e) {
      onError('request', e);
      if (!res.headersSent) refuse(res, 500, 'INTERNAL', 'the service could not answer this request');
      else res.end();
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 100;
  server.timeout = 0;

  let idleTimer: NodeJS.Timeout | null = null;
  let closed = false;
  async function close(): Promise<void> {
    if (closed) return;
    closed = true;
    if (idleTimer) clearInterval(idleTimer);
    idleTimer = null;
    watcher.stop();
    for (const s of streams) {
      try {
        s.end();
      } catch {
        // already gone
      }
    }
    streams.clear();
    await new Promise<void>((resolveClose) => {
      server.close(() => resolveClose());
      server.closeAllConnections();
    });
    options.onClosed?.();
  }

  await new Promise<void>((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(options.port ?? 0, host, () => {
      server.off('error', reject);
      resolveListen();
    });
  });
  const address = server.address();
  port = typeof address === 'object' && address ? address.port : 0;
  watcher.start();
  watcher.subscribe(() => {
    lastActivity = Date.now();
  });
  if (options.idleExitMs) {
    idleTimer = setInterval(() => {
      if (streams.size === 0 && Date.now() - lastActivity > (options.idleExitMs as number)) options.onIdle?.();
    }, Math.min(60_000, options.idleExitMs));
    idleTimer.unref();
  }

  return {
    url: ownOrigin(),
    host,
    port,
    token: options.token,
    workspace,
    runsRoot: watcher.runsRoot,
    started_at: startedAt,
    watcher,
    streams: () => streams.size,
    close,
  };
}

export function sha256OfFile(path: string): string {
  return sha256Hex(readFileSync(path));
}
