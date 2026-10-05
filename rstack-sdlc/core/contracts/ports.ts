// Ports implemented by adapters. The core owns these shapes and never imports
// an adapter; a thin assembly layer wires implementations in.

import type { FailureKind, PrProposal, TaskEnvelope } from './records.ts';

// Returned by a deliberately deferred integration. It carries no service
// payload, URL, or credential detail.
export interface NotConfigured {
  status: 'INTEGRATION_NOT_CONFIGURED';
  integration: string;
  reason: string;
}

export interface RequestProvenance {
  adapter: string;
  locator: string;
  captured_at: string;
}

export interface RequestSnapshot {
  status: 'OK';
  request_id: string;
  bytes: Uint8Array;
  provenance: RequestProvenance;
}

export interface RequestLocator {
  path?: string;
  text?: string;
  request_id?: string;
}

export interface RequestSource {
  readonly id: string;
  getSnapshot(locator: RequestLocator): RequestSnapshot | NotConfigured;
}

export interface ProposalPersisted {
  status: 'PR_PROPOSAL_READY';
  publication_status: 'NOT_ATTEMPTED';
  proposal_ref: string;
  location: string;
}

// `prepare` must be repeatable: the same proposal written twice yields the
// same bytes and the same reference.
export interface ProposalSink {
  readonly id: string;
  // Checked when a run selects this sink, before any run is created.
  availability(): { status: 'AVAILABLE' } | NotConfigured;
  prepare(proposal: PrProposal, runDir: string): ProposalPersisted | NotConfigured;
}

export type TransportClass = 'SIMULATED' | 'MANUAL_TRANSPORT';

export type TransportDelivery =
  | { kind: 'RESULT'; raw: string }
  | { kind: 'FAILURE'; failure: FailureKind; detail: string };

// One dispatch may yield more than one delivery (a transport can repeat
// itself); the engine decides what each delivery means.
export interface RoleTransport {
  readonly id: string;
  // What a result from this transport is evidence of. A run accepts work only
  // from a transport of the class it was started with.
  readonly evidence_class: TransportClass;
  dispatch(envelope: TaskEnvelope): TransportDelivery[];
}

// ---------------------------------------------------------------- test execution

// One top-level entry of the runner's report.
// kind: TEST is a single test with nothing nested in it. CONTAINER is a suite
// or a test holding other tests; its status says nothing about which
// assertions ran, and what is nested in it is not reported.
// status: SKIP means the runner did not execute it. TODO means it is marked
// as not expected to hold yet, so its result does not count. Neither is a
// passing executed test, whatever the report line says.
// failure_kind, for FAIL only. ASSERTION: the test ran and an assertion in it
// failed. ERROR: the test ran and threw something else. LOAD: a test file
// could not be loaded or crashed, so its tests never ran.
export interface TestOutcome {
  name: string;
  kind: 'TEST' | 'CONTAINER';
  status: 'PASS' | 'FAIL' | 'SKIP' | 'TODO';
  failure_kind: 'ASSERTION' | 'ERROR' | 'LOAD' | null;
}

export interface ExecutionRequest {
  cwd: string;
  patterns: string[];
  timeoutMs: number;
  // Names of the variables the application declares its tests need. The child
  // gets these and the executor's own runtime set, and no other variable.
  env?: string[];
}

export interface ExecutionOutcome {
  command: string[];
  exit_code: number | null;
  timed_out: boolean;
  duration_ms: number;
  output: string;
  tests: TestOutcome[];
  // Identity of the environment the child was actually given.
  environment: Record<string, string>;
}

// Runs an application's tests for real and reports what happened. The
// executor reports; it does not decide whether the result is acceptable.
export interface TestExecutor {
  readonly id: string;
  // What a result depends on besides the files: runtime, version, platform,
  // and the variables a child would be given now for these declared names.
  // It identifies the values without containing them.
  environment(declared?: readonly string[]): Record<string, string>;
  run(request: ExecutionRequest): ExecutionOutcome;
}
