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

// One test as the runner reported it. ASSERTION: the test ran and an
// assertion in it failed. ERROR: the test ran and threw something else.
// LOAD: a test file could not be loaded or crashed, so its tests never ran.
export interface TestOutcome {
  name: string;
  status: 'PASS' | 'FAIL';
  failure_kind: 'ASSERTION' | 'ERROR' | 'LOAD' | null;
}

export interface ExecutionRequest {
  cwd: string;
  patterns: string[];
  timeoutMs: number;
}

export interface ExecutionOutcome {
  command: string[];
  exit_code: number | null;
  timed_out: boolean;
  duration_ms: number;
  output: string;
  tests: TestOutcome[];
}

// Runs an application's tests for real and reports what happened. The
// executor reports; it does not decide whether the result is acceptable.
export interface TestExecutor {
  readonly id: string;
  // What the result depends on besides the files: runtime, version, platform.
  environment(): Record<string, string>;
  run(request: ExecutionRequest): ExecutionOutcome;
}
