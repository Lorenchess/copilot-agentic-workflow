// Shared test helpers. Every test works in its own directory under the
// ignored tests/.tmp/, never in the repository's tracked tree.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type FakeBehavior, fakeResult } from '../../adapters/fake-transport/index.ts';
import type { TransportClass } from '../../core/contracts/ports.ts';
import type { HumanDecision, RoleResult, TaskEnvelope, TransportFailure } from '../../core/contracts/records.ts';
import type { EngineOptions, Reply } from '../../core/engine/engine.ts';
import { type Assembly, createAssembly } from '../../scripts/assembly.ts';

export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PROFILE = join(PACKAGE_ROOT, 'profiles', 'trial-v2.json');
export const REQUEST = join(PACKAGE_ROOT, 'tests', 'fixtures', 'requests', 'REQ-001.md');
export const CLI = join(PACKAGE_ROOT, 'scripts', 'rstack.ts');
// The synthetic application. Runs only read it; every attempt works on its own copy.
export const APP = join(PACKAGE_ROOT, 'tests', 'fixtures', 'sample-app');

export function tmpDir(label: string): string {
  const root = join(PACKAGE_ROOT, 'tests', '.tmp');
  mkdirSync(root, { recursive: true });
  return mkdtempSync(join(root, `${label}-`));
}

export interface TestRun {
  workspace: string;
  assembly: Assembly;
  runId: string;
  runDir: string;
}

// Runs are started as SIMULATED unless a test says otherwise, because their
// role results come from the fake transport.
const runsRoots = new Map<string, string>();

export async function newRun(
  label: string,
  engine: Partial<EngineOptions> = {},
  transportClass: TransportClass = 'SIMULATED',
): Promise<TestRun> {
  const workspace = tmpDir(label);
  const assembly = createAssembly(workspace, { engine: { lockTimeoutMs: 400, ...engine } });
  const started = await assembly.start({ request: { path: REQUEST }, appDir: APP, profilePath: PROFILE, transportClass });
  assert.equal(started.code, 'STARTED');
  const runId = started.run_id as string;
  runsRoots.set(runId, assembly.runsRoot);
  return { workspace, assembly, runId, runDir: join(assembly.runsRoot, runId) };
}

export function pendingOf(reply: Reply): TaskEnvelope {
  assert.equal(reply.directive?.kind, 'CONTINUE', `expected CONTINUE, got ${reply.code}`);
  const pending = reply.directive?.kind === 'CONTINUE' ? reply.directive.pending : null;
  assert.ok(pending, 'expected a pending task envelope');
  return pending;
}

// A result for the envelope with its files written into the attempt directory.
export function result(envelope: TaskEnvelope, overrides: Partial<RoleResult> = {}, behavior: FakeBehavior = 'success'): string {
  const runsRoot = runsRoots.get(envelope.run_id);
  assert.ok(runsRoot, 'run was not created by newRun');
  return JSON.stringify({ ...fakeResult(runsRoot, envelope, behavior), ...overrides });
}

export function failure(envelope: TaskEnvelope, kind: TransportFailure['kind'] = 'TIMEOUT'): string {
  const record: TransportFailure = {
    schema_version: 1,
    record_type: 'transport-failure',
    run_id: envelope.run_id,
    attempt_id: envelope.attempt_id,
    expected_version: envelope.state_version,
    kind,
    detail: 'SIMULATED',
  };
  return JSON.stringify(record);
}

export function decision(waiting: Reply, overrides: Partial<HumanDecision> = {}): string {
  assert.equal(waiting.directive?.kind, 'WAIT');
  const d = waiting.directive as Extract<Reply['directive'], { kind: 'WAIT' }>;
  const record: HumanDecision = {
    schema_version: 1,
    record_type: 'human-decision',
    run_id: waiting.run_id as string,
    decision_id: 'D1',
    expected_version: d.expected_version,
    action: 'proceed',
    subjects: d.subjects,
    recorded_by: 'test fixture',
    // Fixture decisions say what they are. A test that needs another provenance sets it.
    provenance: 'SCRIPTED',
    ...overrides,
  };
  return JSON.stringify(record);
}

// Dispatches the current stage and accepts a result for it.
export function completeStep(run: TestRun, behavior: FakeBehavior = 'success'): Reply {
  const envelope = pendingOf(run.assembly.engine.next(run.runId));
  const accepted = run.assembly.engine.submit(run.runId, result(envelope, {}, behavior));
  assert.equal(accepted.code, 'ACCEPTED');
  return accepted;
}

// After an accepted code review: the engine assembles the PR review packet,
// then the PR review is dispatched and accepted. `behavior` selects its content.
export function prReviewStep(run: TestRun, behavior: FakeBehavior = 'success'): Reply {
  assert.equal(run.assembly.engine.next(run.runId).code, 'PR_REVIEW_PACKET_READY');
  return completeStep(run, behavior);
}

// Advances a run from the intent stage to the plan decision and returns the
// waiting reply. `auditBehavior` selects the audit's content.
export function toHumanWait(run: TestRun, auditBehavior: FakeBehavior = 'success'): Reply {
  for (const stage of ['intent', 'spec', 'plan']) {
    assert.equal(run.assembly.engine.status(run.runId).stage, stage);
    completeStep(run);
  }
  return auditAndBrief(run, auditBehavior);
}

// Completes the audit stage, renders the brief, and returns the waiting reply.
export function auditAndBrief(run: TestRun, auditBehavior: FakeBehavior = 'success'): Reply {
  completeStep(run, auditBehavior);
  const waiting = run.assembly.engine.next(run.runId);
  assert.equal(waiting.code, 'BRIEF_READY');
  assert.equal(waiting.directive?.kind, 'WAIT');
  return waiting;
}

export function journalText(run: TestRun): string {
  return readFileSync(join(run.runDir, 'journal.jsonl'), 'utf8');
}

export function eventTypes(run: TestRun): string[] {
  return journalText(run)
    .split('\n')
    .filter(Boolean)
    .map((line) => (JSON.parse(line.slice(65)) as { type: string }).type);
}

export function writeTemp(run: TestRun, name: string, content: string): string {
  const path = join(run.workspace, name);
  writeFileSync(path, content);
  return path;
}

export interface CliResult {
  status: number | null;
  reply: Reply;
  stderr: string;
}

function parseCli(status: number | null, stdout: string, stderr: string): CliResult {
  let reply: Reply;
  try {
    reply = JSON.parse(stdout) as Reply;
  } catch {
    throw new Error(`CLI produced no JSON reply (exit ${status}): ${stderr || stdout}`);
  }
  return { status, reply, stderr };
}

export function cli(args: string[], nodeArgs: string[] = [], env: NodeJS.ProcessEnv = {}): CliResult {
  const r = spawnSync(process.execPath, [...nodeArgs, CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return parseCli(r.status, r.stdout, r.stderr);
}

export function cliAsync(args: string[]): Promise<CliResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (status) => {
      try {
        resolvePromise(parseCli(status, stdout, stderr));
      } catch (e) {
        reject(e as Error);
      }
    });
  });
}

// A process id that belonged to a process which has already exited.
export function deadPid(): number {
  const r = spawnSync(process.execPath, ['-e', '']);
  assert.equal(r.status, 0);
  return r.pid;
}
