// Evidence integrity: decision provenance, audit coverage consistency,
// retained workflow and unsuccessful-attempt records, and resolution of a
// run's evidence from its review packet alone. Evidence class: engine tests
// (offline). Decisions here are fixtures: none is an observed human approval.

import assert from 'node:assert/strict';
import { appendFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createFakeTransport } from '../adapters/fake-transport/index.ts';
import type { FinalPlan } from '../core/contracts/planning.ts';
import { type HumanDecision, type PrProposal, canonicalJson, refOf } from '../core/contracts/records.ts';
import { driveRun } from '../core/engine/drive.ts';
import type { Reply } from '../core/engine/engine.ts';
import { frameEvent } from '../core/engine/journal.ts';
import { verifyPacket } from '../evals/verify-packet.ts';
import { WORKFLOW } from '../core/policies/workflow.ts';
import { createAssembly } from '../scripts/assembly.ts';
import {
  type TestRun,
  completeStep,
  decision,
  eventTypes,
  journalText,
  newRun,
  pendingOf,
  result,
  tmpDir,
  toHumanWait,
} from './support/harness.ts';

const artifact = (run: TestRun, ref: string): string => readFileSync(join(run.runDir, 'artifacts', ref.slice(7)), 'utf8');
type Planning = { decision_id: string; decision_ref: string; decision_provenance: string; final_plan: string; brief: string };

// The decision fixture without the provenance field at all.
function withoutProvenance(waiting: Reply, overrides: Partial<HumanDecision> = {}): string {
  const record = JSON.parse(decision(waiting, overrides)) as Record<string, unknown>;
  delete record.provenance;
  return JSON.stringify(record);
}

test('decision provenance survives replay, snapshot rebuilding, finalization, and the proposal', async () => {
  const run = await newRun('prov-chain');
  const { engine } = run.assembly;
  const waiting = toHumanWait(run);
  assert.equal(engine.decide(run.runId, decision(waiting)).code, 'DECISION_RECORDED');

  const planning = engine.status(run.runId).planning as Planning;
  assert.equal(planning.decision_provenance, 'SCRIPTED');
  // Replay by a new engine over the same directory.
  const again = createAssembly(run.workspace).engine;
  assert.deepEqual(again.status(run.runId).planning, planning);
  // Snapshot removed and rebuilt from the journal.
  rmSync(join(run.runDir, 'state.json'));
  again.resume(run.runId);
  const snapshot = JSON.parse(readFileSync(join(run.runDir, 'state.json'), 'utf8')) as { planning: Planning; decisions: Record<string, { provenance: string }> };
  assert.equal(snapshot.planning.decision_provenance, 'SCRIPTED');
  assert.equal(snapshot.decisions.D1?.provenance, 'SCRIPTED');

  // The final plan carries a reference, not its own copy; the reference resolves to the decision record.
  const finalPlan = JSON.parse(artifact(run, planning.final_plan)) as FinalPlan & Record<string, unknown>;
  assert.equal(finalPlan.decision, planning.decision_ref);
  assert.equal(finalPlan.brief, planning.brief);
  assert.ok(!('provenance' in finalPlan) && !('decision_provenance' in finalPlan), 'no second copy of the fact');
  assert.equal((JSON.parse(artifact(run, finalPlan.decision)) as HumanDecision).provenance, 'SCRIPTED');
  assert.equal(finalPlan.criteria_basis, 'SPECIFICATION');
  assert.equal(finalPlan.specification, (engine.status(run.runId).subjects as Record<string, string>).spec);

  // Downstream: the proposal links the same records, and the terminal reply states the provenance.
  const end = driveRun(engine, createFakeTransport(run.assembly.runsRoot), run.runId).last;
  assert.equal(end.directive?.kind, 'DONE');
  assert.deepEqual(end.directive?.kind === 'DONE' && end.directive.authorization, { decision_id: 'D1', provenance: 'SCRIPTED' });
  const proposal = JSON.parse(readFileSync(join(run.runDir, 'proposal', 'pr-proposal.json'), 'utf8')) as PrProposal & Record<string, unknown>;
  const subjects = (JSON.parse(artifact(run, planning.decision_ref)) as HumanDecision).subjects;
  assert.deepEqual(proposal.planning_basis, {
    final_plan: planning.final_plan,
    last_audited_plan: subjects.plan,
    audit: subjects.audit,
    decision: planning.decision_ref,
    brief: subjects.brief,
    spec: subjects.spec,
    intent: subjects.intent,
  });
  assert.equal((JSON.parse(artifact(run, proposal.planning_basis.decision)) as HumanDecision).provenance, 'SCRIPTED');
  assert.ok(!('decision_provenance' in proposal));
  // The reviewer skeleton is handed the approved specification and the final plan.
  const review = journalText(run).split('\n').find((l) => l.includes('"step_id":"review"')) as string;
  assert.deepEqual(Object.keys((JSON.parse(review.slice(65)) as { data: { inputs: object } }).data.inputs).sort(), ['audit', 'base', 'candidate', 'final_plan', 'proof', 'proof_baseline', 'proof_tree', 'source', 'spec', 'verification']);
});

test('a decision with no provenance is recorded as UNKNOWN, never as human', async () => {
  const run = await newRun('prov-unknown');
  const { engine } = run.assembly;
  const waiting = toHumanWait(run);
  assert.equal(engine.decide(run.runId, withoutProvenance(waiting)).code, 'DECISION_RECORDED');
  assert.equal((engine.status(run.runId).planning as Planning).decision_provenance, 'UNKNOWN');
  assert.equal(engine.decide(run.runId, decision(waiting, { decision_id: 'D2', provenance: 'AUTHENTICATED' as never })).code, 'MALFORMED_DECISION');
});

test('outside a simulated run, scripted or unstated decisions are refused for every action', async () => {
  const run = await newRun('prov-real', {}, 'MANUAL_TRANSPORT');
  const { engine } = run.assembly;
  const asked = completeStep(run, 'open-decision');
  // The product-question wait is a human requirement too.
  assert.equal(engine.decide(run.runId, decision(asked, { action: 'answer', answer: 'x' })).code, 'SCRIPTED_DECISION_NOT_ACCEPTED');
  assert.equal(engine.decide(run.runId, withoutProvenance(asked, { action: 'answer', answer: 'x' })).code, 'DECISION_PROVENANCE_REQUIRED');
  engine.decide(run.runId, decision(asked, { action: 'answer', answer: 'Return 503.', provenance: 'HUMAN_RECORDED' }));
  const waiting = toHumanWait(run);

  for (const action of ['proceed', 'pause', 'second-audit', 'reject'] as const) {
    assert.equal(engine.decide(run.runId, decision(waiting, { decision_id: `S-${action}`, action })).code, 'SCRIPTED_DECISION_NOT_ACCEPTED', action);
    assert.equal(engine.decide(run.runId, withoutProvenance(waiting, { decision_id: `U-${action}`, action })).code, 'DECISION_PROVENANCE_REQUIRED', action);
  }
  // A name in recorded_by is not provenance and not authentication.
  assert.equal(engine.decide(run.runId, withoutProvenance(waiting, { decision_id: 'N1', recorded_by: 'Ramon Lorente, owner' })).code, 'DECISION_PROVENANCE_REQUIRED');
  assert.equal(engine.status(run.runId).planning, null);
  assert.equal(eventTypes(run).filter((t) => t === 'decision_recorded').length, 1, 'only the recorded answer');

  const ok = engine.decide(run.runId, decision(waiting, { decision_id: 'H1', provenance: 'HUMAN_RECORDED' }));
  assert.equal(ok.code, 'DECISION_RECORDED');
  assert.equal((engine.status(run.runId).planning as Planning).decision_provenance, 'HUMAN_RECORDED');
});

test('a journal that records a scripted decision in a run that is not simulated is refused on replay', async () => {
  const run = await newRun('prov-forged', {}, 'MANUAL_TRANSPORT');
  const { engine } = run.assembly;
  const waiting = toHumanWait(run);
  const d = waiting.directive as Extract<Reply['directive'], { kind: 'WAIT' }>;
  const ref = `sha256:${'a'.repeat(64)}`;
  appendFileSync(
    join(run.runDir, 'journal.jsonl'),
    frameEvent({
      schema_version: 1,
      seq: d.expected_version + 1,
      run_id: run.runId,
      type: 'decision_recorded',
      at: 'x',
      data: { decision_id: 'F1', decision_digest: ref, decision_ref: ref, action: 'proceed', subjects: d.subjects, recorded_by: 'x', provenance: 'SCRIPTED', final_plan_ref: ref, plan_status: 'AS_AUDITED' },
    }),
  );
  assert.equal(engine.status(run.runId).code, 'JOURNAL_CORRUPT');
});

test('audit coverage: objective inconsistencies are refused; an honest "nothing examined" is accepted as INCONCLUSIVE', async () => {
  const run = await newRun('coverage');
  const { engine } = run.assembly;
  for (let i = 0; i < 3; i++) completeStep(run);
  const envelope = pendingOf(engine.next(run.runId));
  const raw = result(envelope);
  const file = join(run.runDir, envelope.work_dir, 'audit.json');
  const good = JSON.parse(readFileSync(file, 'utf8')) as Record<string, any>;
  assert.equal(good.coverage.filter((c: { status: string }) => c.status === 'CHECKED').length, 1, 'the fixture claims exactly the one comparison it performs');
  assert.match(good.coverage[0].evidence, /specification has AC-1, AC-2, AC-3; plan units carry AC-1, AC-2, AC-3; missing: none/);

  const unchecked = good.coverage.map((c: object) => ({ ...c, status: 'NOT_CHECKED', evidence: '', note: 'not examined' }));
  const cases: [string, Record<string, unknown>, RegExp][] = [
    ['HOLDS with nothing checked', { ...good, coverage: unchecked }, /HOLDS needs at least one CHECKED/],
    ['CHECKED without evidence', { ...good, coverage: [{ ...good.coverage[0], evidence: ' ' }] }, /must cite what was examined/],
    ['NOT_CHECKED citing evidence', { ...good, coverage: [good.coverage[0], { ...good.coverage[1], evidence: 'looked at it' }] }, /cannot cite examination evidence/],
    ['NOT_CHECKED without a reason', { ...good, coverage: [good.coverage[0], { ...good.coverage[1], note: '' }] }, /must say why/],
    ['INCONCLUSIVE without a limitation', { ...good, verdict: 'INCONCLUSIVE', limitations: [] }, /must state what prevented/],
    ['unknown status', { ...good, coverage: [{ ...good.coverage[0], status: 'ASSUMED' }] }, /expected one of CHECKED, NOT_CHECKED/],
  ];
  for (const [name, audit, why] of cases) {
    writeFileSync(file, JSON.stringify(audit));
    const r = engine.submit(run.runId, raw);
    assert.equal(r.code, 'CONTRACT_VIOLATION', name);
    assert.match(JSON.stringify(r.detail), why, name);
  }
  assert.deepEqual(engine.status(run.runId).audit_budget, { max: 2, used: 0 });

  // Nothing examined, said plainly: accepted, shown to the human as INCONCLUSIVE, and still a human wait.
  assert.equal(engine.submit(run.runId, result(envelope, {}, 'unexamined')).code, 'ACCEPTED');
  const waiting = engine.next(run.runId);
  assert.equal(waiting.directive?.kind, 'WAIT');
  const html = readFileSync(join(run.runDir, 'brief', 'round-1.html'), 'utf8');
  assert.match(html, /Audit verdict: <strong>INCONCLUSIVE<\/strong>/);
  assert.match(html, /3 of 3 coverage item\(s\) were not checked/);
});

test('the review packet alone resolves the workflow, the profile, every reference, and unsuccessful attempts', async () => {
  const run = await newRun('packet');
  const { engine } = run.assembly;
  // One rejected submission, one failed invocation, one abandoned attempt, then a complete run.
  const first = pendingOf(engine.next(run.runId));
  assert.equal(engine.submit(run.runId, result(first, { role: 'reviewer' })).code, 'ROLE_MISMATCH');
  assert.equal(engine.abandon(run.runId, first.attempt_id, 'dispatcher lost').code, 'FAILURE_RECORDED');
  const transport = createFakeTransport(run.assembly.runsRoot, { spec: ['timeout'] });
  const waiting = driveRun(engine, transport, run.runId).last;
  engine.decide(run.runId, decision(waiting, { action: 'amend', amendments: [{ id: 'A1', target: 'U1', text: 'Check authorization first.' }] }));
  assert.equal(driveRun(engine, transport, run.runId).last.directive?.kind, 'DONE');

  // The packet: the run directory without work/, copied somewhere unrelated to the run and the engine.
  const packet = join(tmpDir('packet-copy'), 'packet');
  mkdirSync(packet);
  for (const entry of readdirSync(run.runDir)) {
    if (entry !== 'work') cpSync(join(run.runDir, entry), join(packet, entry), { recursive: true });
  }
  const report = verifyPacket(packet);
  assert.deepEqual(report.problems, []);
  assert.equal(report.ok, true);
  assert.equal(report.events, journalText(run).split('\n').filter(Boolean).length);
  assert.deepEqual(report.workflow, { workflow_id: 'local-request-to-proposal', workflow_version: 5, stages: 13 });
  assert.deepEqual(report.profile, { profile_id: 'trial', profile_version: 1 });
  assert.equal(report.transport_class, 'SIMULATED');
  assert.deepEqual(report.unsuccessful_attempts.map((a) => [a.attempt_id, a.kind]), [['intent-1', 'EXECUTION_UNCERTAIN'], ['spec-1', 'TIMEOUT']]);
  for (const a of report.unsuccessful_attempts) {
    assert.ok(existsSync(join(packet, 'artifacts', a.record.slice(7))), 'the failure record itself is retained');
  }
  assert.equal(report.rejected_submissions.length, 1);
  assert.match(report.rejected_submissions[0] as string, /\.ROLE_MISMATCH\.json$/);
  assert.deepEqual(report.decisions.map((d) => [d.action, d.provenance]), [['amend', 'SCRIPTED']]);
  assert.deepEqual(Object.keys(report.planning_basis ?? {}).sort(), ['audit', 'brief', 'decision', 'final_plan', 'intent', 'last_audited_plan', 'spec']);

  // The retained workflow is the definition the run named, byte for byte.
  const started = JSON.parse(journalText(run).split('\n')[0]!.slice(65)) as { data: { workflow_ref: string } };
  const workflowText = readFileSync(join(packet, 'artifacts', started.data.workflow_ref.slice(7)), 'utf8');
  assert.equal(refOf(workflowText), started.data.workflow_ref);
  assert.equal(workflowText, canonicalJson(JSON.parse(workflowText)));

  // The verifier notices missing and altered evidence.
  const victim = join(packet, 'artifacts', (report.planning_basis as Record<string, string>).brief!.slice(7));
  const original = readFileSync(victim);
  writeFileSync(victim, 'altered');
  assert.equal(verifyPacket(packet).ok, false);
  rmSync(victim);
  assert.match(verifyPacket(packet).problems.join('\n'), /is not in the packet/);
  writeFileSync(victim, original);
  assert.equal(verifyPacket(packet).ok, true);
});

test('abandon invalidates a result; it does not stop the worker, and a late worker cannot change retained planning records', async () => {
  const run = await newRun('late-worker');
  const { engine } = run.assembly;
  completeStep(run);
  completeStep(run);
  const first = pendingOf(engine.next(run.runId));
  const lateResult = result(first, { summary: 'late worker' }); // the worker has produced its files but not yet submitted
  const abandoned = engine.abandon(run.runId, first.attempt_id, 'dispatcher lost; worker state unknown');
  assert.equal(abandoned.code, 'FAILURE_RECORDED');

  const second = pendingOf(engine.next(run.runId));
  assert.equal(second.attempt_id, 'plan-2');
  assert.notEqual(second.work_dir, first.work_dir, 'the replacement has its own directory');
  assert.equal(engine.submit(run.runId, result(second)).code, 'ACCEPTED');
  const planRef = (engine.status(run.runId).subjects as Record<string, string>).plan as string;
  const retained = artifact(run, planRef);

  // The abandoned worker is still alive: it rewrites its own directory, writes into the replacement's, and submits.
  writeFileSync(join(run.runDir, first.work_dir, 'plan.json'), '{"late":"worker"}');
  writeFileSync(join(run.runDir, second.work_dir, 'plan.json'), '{"late":"worker"}');
  assert.equal(engine.submit(run.runId, lateResult).code, 'STALE_ATTEMPT');
  assert.equal((engine.status(run.runId).subjects as Record<string, string>).plan, planRef);
  assert.equal(artifact(run, planRef), retained, 'the retained plan is the bytes accepted, whatever happens to work files later');
  assert.equal(refOf(retained), planRef);
});

test('abandoning an attempt on a stage with a shared write target blocks the run instead of dispatching a replacement', async () => {
  // No stage of the shipped workflow shares a write target. This variant marks one as shared to exercise the rule.
  const shared = structuredClone(WORKFLOW);
  (shared.stages.find((s) => s.id === 'implement') as { shared_write_target?: boolean }).shared_write_target = true;
  const run = await newRun('quiescence', { workflow: shared });
  const { engine } = run.assembly;
  const waiting = toHumanWait(run);
  engine.decide(run.runId, decision(waiting));
  completeStep(run); // proof
  const implement = pendingOf(engine.next(run.runId));
  assert.equal(implement.step_id, 'implement');

  const abandoned = engine.abandon(run.runId, implement.attempt_id, 'dispatcher lost; worker may still be writing');
  assert.equal(abandoned.code, 'FAILURE_RECORDED');
  assert.equal(abandoned.directive?.kind === 'BLOCKED' && abandoned.directive.blocker, 'WORKER_QUIESCENCE_UNPROVEN');
  assert.equal(engine.next(run.runId).code, 'NO_WORK');
  assert.equal(journalText(run).split('\n').filter((l) => l.includes('"step_id":"implement"')).length, 1, 'no replacement was dispatched');
  // The late worker's result is refused as before; refusing it is all the engine can do about that worker.
  assert.equal(engine.submit(run.runId, result(implement)).code, 'STALE_ATTEMPT');
  // An ordinary failed invocation of the same stage still gets a replacement.
  const other = await newRun('quiescence-timeout');
  const w = toHumanWait(other);
  other.assembly.engine.decide(other.runId, decision(w));
  const end = driveRun(other.assembly.engine, createFakeTransport(other.assembly.runsRoot, { implement: ['timeout'] }), other.runId).last;
  assert.equal(end.directive?.kind, 'DONE');
});
