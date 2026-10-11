// Honest motion (dashboard/web/motion.js): cues come only from new committed
// journal events and engine transitions, and each plays at most once per
// run. Evidence class: unit tests over consecutive views of real engine runs
// (offline, SIMULATED role results).

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RunView } from '../core/read-model/contracts.ts';
import { readRun } from '../core/read-model/read-run.ts';
import { completeStep, decision } from './support/harness.ts';
import { scenarioRun } from './support/scenarios.ts';
import { loadWeb } from './support/web-module.ts';

interface Cue { kind: string; seq: number; stage: string | null; from?: string | null; to?: string | null }
interface Player {
  prime(run: string, version: number): void;
  play(run: string, cues: Cue[], opts?: { catchUp?: boolean; events?: number }): Cue[];
  resume(run: string): Cue[];
  missed(run: string): number;
}
interface Motion {
  cues(prev: RunView | null, next: RunView | null): Cue[];
  createPlayer(o: { animate: (c: Cue, o: { reduced: boolean; delay: number }) => void; reduced?: () => boolean; hidden?: () => boolean }): Player;
  log: { run: string; kind: string; seq: number; reduced: boolean }[];
}

const m = await loadWeb<Motion>('motion.js');

// One live run, read after each engine step.
async function progression() {
  const run = await scenarioRun('awaiting-auditor', 'motion-live');
  const read = () => readRun(run.assembly.runsRoot, run.runId);
  const v8 = read(); // the auditor is dispatched
  completeStep(run);
  const v9 = read(); // the audit is accepted
  run.assembly.engine.next(run.runId);
  const v10 = read(); // the brief is rendered; the run waits for a human
  run.assembly.engine.decide(run.runId, decision(run.assembly.engine.status(run.runId)));
  run.assembly.engine.next(run.runId);
  const v12 = read(); // decided, the Tester dispatched
  return { v8, v9, v10, v12 };
}

test('no cue without a newer committed version of the same run', async () => {
  const { v8, v9 } = await progression();
  assert.deepEqual(m.cues(null, v8), []);
  assert.deepEqual(m.cues(v8, null), []);
  assert.deepEqual(m.cues(v8, v8), [], 'the same version re-delivered (resync, reconnect) starts nothing');
  assert.deepEqual(m.cues(v9, v8), [], 'an older version starts nothing');
  const other = await scenarioRun('awaiting-auditor', 'motion-other');
  const o = readRun(other.assembly.runsRoot, other.runId);
  assert.deepEqual(m.cues(v8, { ...o, journal_version: 99 } as RunView), [], 'a different run starts nothing');
});

test('each committed event maps to its cue; transitions add needs-you', async () => {
  const { v8, v9, v10, v12 } = await progression();
  assert.deepEqual(m.cues(v8, v9).map((c) => [c.kind, c.seq, c.stage]), [['settle', 9, 'plan-audit']]);
  assert.deepEqual(m.cues(v9, v10).map((c) => [c.kind, c.seq, c.stage]), [['needs-you', 10, 'plan-decision']]);
  const after = m.cues(v10, v12);
  assert.deepEqual(after.map((c) => c.kind), ['decided', 'handoff']);
  const decided = after[0] as Cue;
  assert.equal(decided.stage, 'plan-decision');
  assert.equal(decided.to, 'proof');
  const handoff = after[1] as Cue;
  assert.deepEqual([handoff.from, handoff.to], ['plan-decision', 'proof']);
});

test('many events in one update keep only the newest three cues, in journal order', async () => {
  const { v8, v12 } = await progression();
  const list = m.cues(v8, v12);
  assert.equal(list.length, 3);
  assert.deepEqual(list.map((c) => c.seq), [...list.map((c) => c.seq)].sort((a, b) => a - b));
  assert.equal(list.at(-1)?.kind, 'handoff');
});

test('a dispatch back to an earlier stage travels from where the run was', async () => {
  const run = await scenarioRun('verification-failed', 'motion-loop');
  const before = readRun(run.assembly.runsRoot, run.runId);
  run.assembly.engine.next(run.runId); // the developer is dispatched again
  const after = readRun(run.assembly.runsRoot, run.runId);
  const handoff = m.cues(before, after).find((c) => c.kind === 'handoff');
  assert.deepEqual([handoff?.from, handoff?.to], ['verify', 'implement']);
});

test('the player plays a cue once, never on first sight of a run, and keeps runs apart', async () => {
  const played: Cue[] = [];
  const p = m.createPlayer({ animate: (c) => played.push(c) });
  const a: Cue = { kind: 'settle', seq: 9, stage: 'plan-audit' };
  assert.deepEqual(p.play('RUN-A', [a]), [], 'an unprimed run takes the cues as already shown');
  assert.deepEqual(p.play('RUN-A', [a]), []);
  p.prime('RUN-B', 8);
  assert.deepEqual(p.play('RUN-B', [{ kind: 'settle', seq: 8, stage: 'x' }]), [], 'the primed version itself never animates');
  assert.equal(p.play('RUN-B', [a]).length, 1);
  assert.equal(p.play('RUN-B', [a]).length, 0, 'the same cue again (re-render, resync) is ignored');
  assert.equal(p.play('RUN-A', [{ kind: 'handoff', seq: 10, stage: 'y' }]).length, 1, 'run A has its own watermark');
  assert.deepEqual(played.map((c) => c.seq), [9, 10]);
  assert.ok(m.log.some((e) => e.run === 'RUN-B' && e.seq === 9));
});

test('a hidden tab defers only the newest cue and counts the events missed; catch-up plays only the newest', () => {
  let hidden = true;
  const played: Cue[] = [];
  const p = m.createPlayer({ animate: (c) => played.push(c), hidden: () => hidden });
  p.prime('RUN-H', 1);
  assert.deepEqual(p.play('RUN-H', [{ kind: 'settle', seq: 2, stage: 'a' }, { kind: 'handoff', seq: 3, stage: 'b' }], { events: 2 }), []);
  assert.equal(p.play('RUN-H', [{ kind: 'settle', seq: 4, stage: 'b' }], { events: 1 }).length, 0);
  assert.equal(played.length, 0);
  assert.equal(p.missed('RUN-H'), 3);
  hidden = false;
  assert.deepEqual(p.resume('RUN-H').map((c) => c.seq), [4]);
  assert.deepEqual(p.resume('RUN-H'), [], 'a deferred cue plays once');
  assert.deepEqual(p.play('RUN-H', [{ kind: 'a', seq: 5, stage: 'c' }, { kind: 'b', seq: 6, stage: 'd' }], { catchUp: true, events: 2 }).map((c) => c.seq), [6]);
  assert.equal(p.missed('RUN-H'), 5);
  assert.equal(p.missed('RUN-OTHER'), 0, 'the away count belongs to its own run');
  p.prime('RUN-OTHER', 3);
  assert.equal(p.missed('RUN-H'), 0, 'switching to another run drops the count');
  p.prime('RUN-H', 6);
  p.play('RUN-H', [{ kind: 'c', seq: 7, stage: 'e' }], { catchUp: true, events: 1 });
  assert.equal(p.missed('RUN-H'), 1);
  assert.equal(p.play('RUN-H', [{ kind: 'c', seq: 8, stage: 'e' }]).length, 1);
  assert.equal(p.missed('RUN-H'), 0, 'a normal visible update clears the away count');
});

test('a review that rejects and blocks its stage shows the block only, not a success first', async () => {
  const run = await scenarioRun('review-rejected', 'motion-reject');
  const after = readRun(run.assembly.runsRoot, run.runId);
  // The view one version earlier: the review dispatched, nothing settled.
  const before = { ...after, journal_version: after.journal_version - 1, stage_graph: after.stage_graph.map((s) => (s.stage_id === 'review' ? { ...s, state: 'DISPATCHED_AWAITING_RESULT' } : s)) } as RunView;
  const list = m.cues(before, after);
  assert.deepEqual(list.map((c) => [c.kind, c.stage]), [['blocked', 'review']]);
});

test('reduced motion is passed to the effect with no stagger; a failing effect is contained', () => {
  const seen: { reduced: boolean; delay: number }[] = [];
  const p = m.createPlayer({ animate: (_c, o) => { seen.push(o); throw new Error('effect failed'); }, reduced: () => true });
  p.prime('RUN-R', 0);
  assert.equal(p.play('RUN-R', [{ kind: 'settle', seq: 1, stage: 'a' }, { kind: 'handoff', seq: 2, stage: 'b' }]).length, 2);
  assert.deepEqual(seen, [{ reduced: true, delay: 0 }, { reduced: true, delay: 0 }]);
  assert.equal(m.log.at(-1)?.reduced, true);
});
