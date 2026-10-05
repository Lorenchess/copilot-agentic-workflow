// Test-only preload (node --import). It records every module the process
// loads and makes every network entry point record the attempt and throw.
// The log path comes from RSTACK_TEST_LOG.

import dns from 'node:dns';
import { appendFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import net from 'node:net';

const log = process.env.RSTACK_TEST_LOG as string;
const record = (line: string): void => appendFileSync(log, `${line}\n`);

registerHooks({
  load(url, context, nextLoad) {
    record(`LOAD ${url}`);
    return nextLoad(url, context);
  },
});

function denied(what: string): never {
  record(`NETWORK ${what}`);
  throw new Error(`network access denied by test fixture: ${what}`);
}

net.Socket.prototype.connect = function connect(): never {
  return denied('net.connect');
} as unknown as typeof net.Socket.prototype.connect;
dns.lookup = (() => denied('dns.lookup')) as unknown as typeof dns.lookup;
globalThis.fetch = (() => denied('fetch')) as unknown as typeof fetch;
