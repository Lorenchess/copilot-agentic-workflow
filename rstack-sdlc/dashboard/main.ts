// The dashboard server process. Started detached by `rstack start` (or by
// `rstack dashboard --do start`); it serves one workspace until it is asked
// to stop, receives a termination signal, or has been idle for a day.
//
//   node dashboard/main.ts --workspace <dir> [--port <n>] [--idle-exit-ms <n>]
//
// It describes itself in <workspace>/.rstack/dashboard/instance.json once it
// listens, and writes start-failure.json instead when it cannot. It never
// writes anywhere else.

import { randomBytes } from 'node:crypto';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { type Instance, failureFile, instanceDir, removeInstance, writeInstance } from './lifecycle.ts';
import { SERVER_VERSION, createDashboardServer } from './server.ts';

const { values } = parseArgs({ options: { workspace: { type: 'string' }, port: { type: 'string' }, 'idle-exit-ms': { type: 'string' } } });
if (!values.workspace) {
  process.stderr.write('--workspace is required\n');
  process.exit(1);
}
const workspace = resolve(values.workspace);
const port = values.port && /^[0-9]{1,5}$/.test(values.port) ? Number(values.port) : 0;
const idleExitMs = values['idle-exit-ms'] && /^[0-9]{1,12}$/.test(values['idle-exit-ms']) ? Number(values['idle-exit-ms']) : 24 * 60 * 60 * 1000;
const token = randomBytes(32).toString('hex');
mkdirSync(instanceDir(workspace), { recursive: true });
const logFile = join(instanceDir(workspace), 'server.log');
const log = (line: string): void => {
  try {
    appendFileSync(logFile, `${new Date().toISOString()} ${line}\n`);
  } catch {
    // logging never matters
  }
};

let closeServer: (() => Promise<void>) | null = null;
let stopping = false;
async function stop(reason: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  log(`stopping: ${reason}`);
  try {
    await closeServer?.();
  } finally {
    removeInstance(workspace, token);
    process.exit(0);
  }
}

try {
  const server = await createDashboardServer({
    workspace,
    token,
    port,
    idleExitMs,
    onIdle: () => void stop('idle'),
    // The stop route and the signals end in the same place: instance file gone, process out.
    onClosed: () => {
      removeInstance(workspace, token);
      log('closed');
      if (!stopping) process.exit(0);
    },
    onError: (where, error) => log(`${where}: ${error instanceof Error ? error.message : String(error)}`),
  });
  closeServer = server.close;
  const instance: Instance = {
    schema_version: 1,
    pid: process.pid,
    host: server.host,
    port: server.port,
    url: server.url,
    token,
    workspace,
    runs_root: server.runsRoot,
    started_at: server.started_at,
    node: process.version,
    server_version: SERVER_VERSION,
  };
  writeInstance(workspace, instance);
  log(`listening on ${server.url} for ${workspace} (pid ${process.pid})`);
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.on(signal, () => void stop(signal));
  }
} catch (e) {
  const err = e as NodeJS.ErrnoException;
  const failure = { ok: false, code: err.code ?? 'ERROR', message: err.message, at: new Date().toISOString() };
  try {
    writeFileSync(failureFile(workspace), `${JSON.stringify(failure, null, 2)}\n`);
  } catch {
    // nothing else to do
  }
  log(`start failed: ${failure.code} ${failure.message}`);
  process.exit(1);
}
