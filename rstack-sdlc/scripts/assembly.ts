// Assembly: the only place that knows which adapters exist. The local
// adapters are wired directly. Deferred integrations are loaded only when a
// caller selects one by name, so the normal local flow never constructs them.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLocalProposalSink } from '../adapters/local-pr-proposal/index.ts';
import { createLocalRequestSource } from '../adapters/local-request/index.ts';
import { createNodeTestExecutor } from '../adapters/node-test-executor/index.ts';
import type { NotConfigured, ProposalSink, RequestLocator, RequestSource, TransportClass } from '../core/contracts/ports.ts';
import { type Engine, type EngineOptions, type Reply, createEngine } from '../core/engine/engine.ts';
import { EngineBlock } from '../core/engine/errors.ts';

export interface DeferredFactories {
  jira: () => Promise<RequestSource>;
  bitbucket: () => Promise<ProposalSink>;
}

const DEFERRED: DeferredFactories = {
  jira: async () => (await import('../adapters/jira/index.ts')).createJiraRequestSource(),
  bitbucket: async () => (await import('../adapters/bitbucket/index.ts')).createBitbucketProposalSink(),
};

export interface AssemblyStart {
  source?: string;
  sink?: string;
  request: RequestLocator;
  // The application the request is about. It is read, measured, and retained; never written.
  appDir: string;
  profilePath: string;
  runId?: string;
  // How role results will reach this run. Defaults to MANUAL_TRANSPORT; a run
  // fed by the fake transport must be started as SIMULATED.
  transportClass?: TransportClass;
}

export interface Assembly {
  engine: Engine;
  runsRoot: string;
  start(input: AssemblyStart): Promise<Reply>;
}

function refusal(code: string, extra: Record<string, unknown>): Reply {
  return { ok: false, code, run_id: null, state_version: null, directive: null, ...extra };
}

// An installed package does not carry the deferred integrations. Selecting one
// there gets the same explicit answer as selecting an unconfigured one.
async function loadDeferred<T>(integration: string, factory: () => Promise<T>): Promise<T | NotConfigured> {
  try {
    return await factory();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ERR_MODULE_NOT_FOUND') throw e;
    return { status: 'INTEGRATION_NOT_CONFIGURED', integration, reason: 'Not included in this installation; use the local adapter.' };
  }
}

export function createAssembly(
  workspace: string,
  overrides: { engine?: Partial<EngineOptions>; deferred?: Partial<DeferredFactories> } = {},
): Assembly {
  const runsRoot = join(workspace, '.rstack', 'runs');
  const deferred = { ...DEFERRED, ...overrides.deferred };
  const localSink = createLocalProposalSink();
  const executor = createNodeTestExecutor();
  const engine = createEngine({
    runsRoot,
    resolveSink(id) {
      // A run can only have been started with an available sink.
      if (id !== localSink.id) throw new EngineBlock('SINK_UNAVAILABLE', `sink "${id}" is not available`, {});
      return localSink;
    },
    resolveExecutor: (runner) => (runner === executor.id ? executor : null),
    ...overrides.engine,
  });

  async function start(input: AssemblyStart): Promise<Reply> {
    const sourceId = input.source ?? 'local';
    const sinkId = input.sink ?? 'local';
    if (sourceId !== 'local' && sourceId !== 'jira') return refusal('UNKNOWN_ADAPTER', { adapter: sourceId });
    if (sinkId !== 'local' && sinkId !== 'bitbucket') return refusal('UNKNOWN_ADAPTER', { adapter: sinkId });

    const sink = sinkId === 'local' ? localSink : await loadDeferred('bitbucket', deferred.bitbucket);
    if ('status' in sink) return refusal(sink.status, { ...sink });
    const availability = sink.availability();
    if (availability.status !== 'AVAILABLE') return refusal(availability.status, { ...availability });

    const source = sourceId === 'local' ? createLocalRequestSource() : await loadDeferred('jira', deferred.jira);
    if ('status' in source) return refusal(source.status, { ...source });
    try {
      const snapshot = source.getSnapshot(input.request);
      if (snapshot.status !== 'OK') return refusal(snapshot.status, { ...snapshot });
      if (!input.appDir || !existsSync(input.appDir)) {
        return refusal('MISSING_INPUT', { message: 'the application directory does not exist', locator: input.appDir ?? null });
      }
      if (!existsSync(input.profilePath)) {
        return refusal('MISSING_INPUT', { message: 'the profile file does not exist', locator: input.profilePath });
      }
      return engine.start({
        runId: input.runId,
        snapshot,
        appDir: input.appDir,
        profileText: readFileSync(input.profilePath, 'utf8'),
        sinkId,
        transportClass: input.transportClass ?? 'MANUAL_TRANSPORT',
      });
    } catch (e) {
      if (e instanceof EngineBlock) return refusal(e.code, { message: e.message, detail: e.detail });
      throw e;
    }
  }

  return { engine, runsRoot, start };
}
