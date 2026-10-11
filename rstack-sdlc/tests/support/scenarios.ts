// Reproducible runs in the states the dashboard must show. Each scenario
// drives a real engine with the fake transport (SIMULATED role results) and
// real test executions, and stops at a named point. Nothing here writes a
// journal by hand: every event is one the engine committed.

import assert from 'node:assert/strict';
import { createFakeTransport } from '../../adapters/fake-transport/index.ts';
import { driveRun } from '../../core/engine/drive.ts';
import type { EngineOptions } from '../../core/engine/engine.ts';
import { type TestRun, completeStep, decision, failure, newRun, pendingOf, prReviewStep, result, toHumanWait } from './harness.ts';

export const SCENARIOS = [
  'fresh',
  'planner-dispatched',
  'awaiting-auditor',
  'plan-decision',
  'product-question',
  'second-audit',
  'failed-attempt-retried',
  'implementing',
  'verification-failed',
  'review-rejected',
  'pr-review-changes',
  'completed',
  'rejected',
  'paused',
] as const;
export type Scenario = (typeof SCENARIOS)[number];

export interface ScenarioRun extends TestRun {
  scenario: Scenario;
}

// Builds one run in the given state inside `workspace` (a fresh temp
// workspace when not given) and returns it. The run id is engine-generated
// unless given. `engineOptions` pass through to the engine (the demo uses
// them for a clock that spaces commit times out).
export async function scenarioRun(scenario: Scenario, label = `scenario-${scenario}`, runId?: string, workspaceDir?: string, engineOptions: Partial<EngineOptions> = {}): Promise<ScenarioRun> {
  const run = await newRun(label, engineOptions, 'SIMULATED', runId, workspaceDir);
  const { engine } = run.assembly;
  const transport = createFakeTransport(run.assembly.runsRoot);
  switch (scenario) {
    case 'fresh':
      break;
    case 'planner-dispatched':
      pendingOf(engine.next(run.runId));
      break;
    case 'awaiting-auditor':
      for (let i = 0; i < 3; i++) completeStep(run);
      assert.equal(pendingOf(engine.next(run.runId)).role, 'plan-auditor');
      break;
    case 'plan-decision':
      toHumanWait(run);
      break;
    case 'product-question': {
      const envelope = pendingOf(engine.next(run.runId));
      assert.equal(engine.submit(run.runId, result(envelope, {}, 'open-decision')).code, 'ACCEPTED');
      assert.equal(engine.status(run.runId).phase, 'WAITING_HUMAN');
      break;
    }
    case 'second-audit': {
      const waiting = toHumanWait(run, 'refuted');
      assert.equal(engine.decide(run.runId, decision(waiting, { action: 'second-audit' })).code, 'DECISION_RECORDED');
      completeStep(run); // plan-revision
      completeStep(run); // plan-audit round 2
      assert.equal(engine.next(run.runId).code, 'BRIEF_READY');
      break;
    }
    case 'failed-attempt-retried': {
      const first = pendingOf(engine.next(run.runId));
      assert.equal(engine.submit(run.runId, failure(first, 'TIMEOUT')).code, 'FAILURE_RECORDED');
      const second = pendingOf(engine.next(run.runId));
      assert.equal(second.attempt_id, 'intent-2');
      break;
    }
    case 'implementing': {
      const waiting = toHumanWait(run);
      assert.equal(engine.decide(run.runId, decision(waiting)).code, 'DECISION_RECORDED');
      completeStep(run); // proof
      assert.equal(pendingOf(engine.next(run.runId)).role, 'developer');
      break;
    }
    case 'verification-failed': {
      const waiting = toHumanWait(run);
      assert.equal(engine.decide(run.runId, decision(waiting)).code, 'DECISION_RECORDED');
      completeStep(run); // proof
      completeStep(run, 'wrong'); // implement, a candidate that fails AC-1
      assert.equal(engine.next(run.runId).code, 'VERIFICATION_FAILED');
      break;
    }
    case 'review-rejected': {
      const waiting = toHumanWait(run);
      assert.equal(engine.decide(run.runId, decision(waiting)).code, 'DECISION_RECORDED');
      completeStep(run); // proof
      completeStep(run); // implement
      assert.equal(engine.next(run.runId).code, 'VERIFICATION_PASSED');
      completeStep(run, 'reject'); // review
      assert.equal(engine.status(run.runId).phase, 'BLOCKED');
      break;
    }
    case 'pr-review-changes': {
      const waiting = toHumanWait(run);
      assert.equal(engine.decide(run.runId, decision(waiting)).code, 'DECISION_RECORDED');
      completeStep(run);
      completeStep(run);
      assert.equal(engine.next(run.runId).code, 'VERIFICATION_PASSED');
      completeStep(run);
      prReviewStep(run, 'reject');
      assert.equal(engine.status(run.runId).phase, 'BLOCKED');
      break;
    }
    case 'completed': {
      const toHuman = driveRun(engine, transport, run.runId);
      assert.equal(toHuman.last.directive?.kind, 'WAIT');
      assert.equal(engine.decide(run.runId, decision(toHuman.last)).code, 'DECISION_RECORDED');
      const rest = driveRun(engine, transport, run.runId);
      assert.equal(rest.last.directive?.kind, 'DONE');
      break;
    }
    case 'rejected': {
      const waiting = toHumanWait(run);
      assert.equal(engine.decide(run.runId, decision(waiting, { action: 'reject' })).code, 'DECISION_RECORDED');
      break;
    }
    case 'paused': {
      const waiting = toHumanWait(run);
      assert.equal(engine.decide(run.runId, decision(waiting, { action: 'pause' })).code, 'DECISION_RECORDED');
      break;
    }
  }
  return { ...run, scenario };
}
