// The page's pure derivations (dashboard/web/derive.js) against views of real
// engine runs and against hand-made edge cases. Evidence class: unit tests
// over engine-committed journals (offline, SIMULATED role results).

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RunView, StageNode } from '../core/read-model/contracts.ts';
import { readRun } from '../core/read-model/read-run.ts';
import { completeStep } from './support/harness.ts';
import { type Scenario, scenarioRun } from './support/scenarios.ts';
import { loadWeb } from './support/web-module.ts';

interface Segment { start: string; end: string | null; kind: string; id: string }
interface Derive {
  seconds(a: string | null, b: string | null): number | null;
  fmtDuration(s: number | null): string;
  isTerminal(v: RunView): boolean;
  runEnd(v: RunView): string | null;
  roleBadge(role: string | null, kind: string): string;
  roleToken(role: string | null, kind: string): string;
  mainPath(stages: StageNode[]): StageNode[];
  stageTiming(v: RunView, id: string): { seconds: number | null; since: string | null; until: string | null };
  humanWaits(v: RunView): { stage_id: string; start: string; end: string | null; seq: number }[];
  vitals(v: RunView): { completed: number; total: number; attempts: number; failed: number; tests: { passed: number; failed: number; purpose: string } | null; audit: { used: number; max: number } | null; waitSeconds: number; waitSince: string | null };
  axis(v: RunView, now: string): { start: string; end: string; ms: number };
  lanes(v: RunView): { key: string; label: string; segments: Segment[] }[];
  heroState(v: RunView): string;
}

const d = await loadWeb<Derive>('derive.js');
const viewOf = async (scenario: Scenario): Promise<RunView> => {
  const run = await scenarioRun(scenario, `derive-${scenario}`);
  return readRun(run.assembly.runsRoot, run.runId);
};

test('durations format as m:ss or h:mm:ss and never go negative', () => {
  assert.equal(d.fmtDuration(0), '0:00');
  assert.equal(d.fmtDuration(65), '1:05');
  assert.equal(d.fmtDuration(3725), '1:02:05');
  assert.equal(d.fmtDuration(-4), '0:00');
  assert.equal(d.fmtDuration(null), '0:00');
  assert.equal(d.fmtDuration(59.9), '0:59');
  assert.equal(d.seconds('2026-10-11T10:00:00Z', '2026-10-11T10:00:00Z'), 0);
  assert.equal(d.seconds('2026-10-11T10:00:05Z', '2026-10-11T10:00:00Z'), 0);
  assert.equal(d.seconds('2026-10-11T10:00:00Z', '2026-10-11T10:01:30Z'), 90);
  assert.equal(d.seconds(null, '2026-10-11T10:00:00Z'), null);
  assert.equal(d.seconds('not a time', '2026-10-11T10:00:00Z'), null);
});

test('role badges and colour tokens name every role, the human, and the engine', () => {
  assert.deepEqual(['planner', 'plan-auditor', 'tester', 'developer', 'reviewer', 'pr-reviewer'].map((r) => d.roleBadge(r, 'role')), ['PL', 'AU', 'TE', 'DEV', 'CR', 'PR']);
  assert.equal(d.roleBadge(null, 'human'), 'YOU');
  assert.equal(d.roleBadge(null, 'deterministic'), 'EN');
  assert.equal(d.roleBadge('designer', 'role'), 'DE');
  assert.equal(d.roleToken('developer', 'role'), 'developer');
  assert.equal(d.roleToken(null, 'human'), 'you');
  assert.equal(d.roleToken('unknown-role', 'role'), 'engine');
});

test('a run waiting for a plan decision: one open human wait, audit vitals, the human hero, no run end', async () => {
  const v = await viewOf('plan-decision');
  assert.equal(d.heroState(v), 'human');
  assert.equal(d.runEnd(v), null);
  assert.equal(d.isTerminal(v), false);
  const waits = d.humanWaits(v);
  assert.equal(waits.length, 1);
  assert.equal(waits[0]?.stage_id, 'plan-decision');
  assert.equal(waits[0]?.end, null);
  const vit = d.vitals(v);
  assert.equal(vit.total, d.mainPath(v.stage_graph).length);
  assert.equal(vit.completed, 5, 'intent, spec, plan, plan-audit, brief');
  assert.deepEqual(vit.audit, { used: 1, max: 2 });
  assert.equal(vit.tests, null, 'no test execution yet');
  assert.equal(vit.waitSince, waits[0]?.start);
  const timing = d.stageTiming(v, 'plan-decision');
  assert.equal(timing.since, v.stage_graph.find((s) => s.stage_id === 'plan-decision')?.entered_at);
  assert.equal(timing.seconds, null);
  assert.equal(d.stageTiming(v, 'intent').seconds, 0, 'a completed stage of a simulated run lasted under a second');
  assert.deepEqual(d.stageTiming(v, 'review'), { seconds: null, since: null, until: null });
  assert.deepEqual(d.lanes(v).map((l) => l.key), ['planner', 'plan-auditor', 'engine', 'human']);
});

test('a dispatched developer: the dispatched hero, a pending segment, a closed wait, test vitals', async () => {
  const v = await viewOf('implementing');
  assert.equal(d.heroState(v), 'dispatched');
  const dev = d.lanes(v).find((l) => l.key === 'developer');
  assert.equal(dev?.segments.length, 1);
  assert.equal(dev?.segments[0]?.kind, 'pending');
  assert.equal(dev?.segments[0]?.end, null);
  const you = d.lanes(v).find((l) => l.key === 'human');
  assert.equal(you?.segments[0]?.kind, 'wait');
  assert.notEqual(you?.segments[0]?.end, null, 'the decision closed the wait');
  const vit = d.vitals(v);
  assert.equal(vit.waitSince, null);
  assert.ok(vit.tests && vit.tests.passed + vit.tests.failed > 0, 'the proof baseline ran tests');
  assert.equal(vit.failed, 0);
});

test('a failed verification sends the work back: the superseded attempt and engine ticks are shown', async () => {
  const v = await viewOf('verification-failed');
  const dev = d.lanes(v).find((l) => l.key === 'developer');
  assert.equal(dev?.segments.some((s) => s.kind === 'superseded'), true);
  const engine = d.lanes(v).find((l) => l.key === 'engine');
  assert.ok((engine?.segments.length ?? 0) >= 2, 'brief and verification are engine ticks');
  assert.ok(engine?.segments.every((s) => s.kind === 'tick' && s.start === s.end));
  // The developer stage was re-entered after its earlier completion: no negative duration.
  const t = d.stageTiming(v, 'implement');
  assert.ok(t.seconds === null || t.seconds >= 0);
  assert.equal(d.vitals(v).tests?.purpose, 'CANDIDATE_VERIFICATION');
});

test('terminal runs stop their clocks at the last commit', async () => {
  for (const [scenario, hero] of [['completed', 'done'], ['review-rejected', 'blocked'], ['rejected', 'rejected']] as const) {
    const v = await viewOf(scenario);
    assert.equal(d.heroState(v), hero, scenario);
    assert.equal(d.runEnd(v), v.last_committed_at, scenario);
    const ax = d.axis(v, '2099-01-01T00:00:00Z');
    assert.equal(ax.end, v.last_committed_at, `${scenario}: the axis ends at the terminal commit, not now`);
    for (const s of v.stage_graph) assert.equal(d.stageTiming(v, s.stage_id).since, null, `${scenario}: no live clock on ${s.stage_id}`);
    assert.equal(d.vitals(v).waitSince, null);
  }
  const done = await viewOf('completed');
  assert.equal(d.vitals(done).completed, d.vitals(done).total, 'every main-path stage is accepted');
});

test('equal timestamps never divide by zero: the axis spans at least one second', async () => {
  const v = await viewOf('awaiting-auditor');
  const ax = d.axis(v, v.started_at as string);
  assert.equal(ax.ms, 1000);
  const broken = { ...v, started_at: null } as RunView;
  assert.equal(d.axis(broken, '2026-10-11T10:00:00Z').ms, 1000);
});

test('a source that cannot be read gets the unreadable hero; the main path follows next', async () => {
  const v = await viewOf('fresh');
  assert.equal(d.heroState({ ...v, source_status: 'CORRUPT' } as RunView), 'unreadable');
  assert.equal(d.heroState(v), 'idle', 'a fresh run has nothing dispatched yet');
  const path = d.mainPath(v.stage_graph).map((s) => s.stage_id);
  assert.equal(path[0], 'intent');
  assert.equal(path.at(-1), 'proposal');
  assert.ok(!path.includes('product-question') && !path.includes('plan-revision'));
  // A run that moved on: completing the intent step changes nothing about this view's derivations.
  const run = await scenarioRun('planner-dispatched', 'derive-moved');
  completeStep(run);
  const moved = readRun(run.assembly.runsRoot, run.runId);
  assert.equal(d.stageTiming(moved, 'intent').since, null);
});
