// Planning slice: intent, specification, plan, audit, combined brief, and the
// human decision. Evidence class: engine tests (offline). Role content comes
// from the fake transport and is SIMULATED; these tests show what the engine
// enforces, not how well any model plans or audits.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { HOSTILE, createFakeTransport } from '../adapters/fake-transport/index.ts';
import type { FinalPlan } from '../core/contracts/planning.ts';
import { driveRun } from '../core/engine/drive.ts';
import type { Reply } from '../core/engine/engine.ts';
import { createAssembly } from '../scripts/assembly.ts';
import {
  type TestRun,
  auditAndBrief,
  cli,
  completeStep,
  decision,
  eventTypes,
  journalText,
  newRun,
  pendingOf,
  result,
  toHumanWait,
} from './support/harness.ts';

type Wait = Extract<Reply['directive'], { kind: 'WAIT' }>;
const wait = (r: Reply): Wait => {
  assert.equal(r.directive?.kind, 'WAIT');
  return r.directive as Wait;
};
const artifact = (run: TestRun, ref: string): string => readFileSync(join(run.runDir, 'artifacts', ref.slice(7)), 'utf8');
const dispatches = (run: TestRun, stage: string): number =>
  journalText(run).split('\n').filter((l) => l.includes('"task_dispatched"') && l.includes(`"step_id":"${stage}"`)).length;
const AMENDMENTS = [{ id: 'A1', target: 'U1', text: 'Check authorization before the flag.' }];

test('PLAN-2: an agreeing audit still ends at a human wait; the brief is rendered only after the audit', async () => {
  const run = await newRun('plan-agree');
  const { engine } = run.assembly;
  for (const stage of ['intent', 'spec', 'plan']) {
    completeStep(run);
    assert.ok(!existsSync(join(run.runDir, 'brief')), `no brief after ${stage}`);
  }
  // Before the audit, asking for work dispatches the audit; it cannot produce a brief.
  const audit = engine.next(run.runId);
  assert.equal(pendingOf(audit).step_id, 'plan-audit');
  assert.ok(!existsSync(join(run.runDir, 'brief')));
  engine.submit(run.runId, result(pendingOf(audit)));

  const waiting = engine.next(run.runId);
  assert.equal(waiting.code, 'BRIEF_READY');
  const w = wait(waiting);
  assert.equal(w.awaiting, 'PLAN_DECISION');
  assert.equal(w.round, 1);
  assert.deepEqual(w.allowed_actions, ['proceed', 'amend', 'second-audit', 'pause', 'reject']);
  assert.deepEqual(Object.keys(w.subjects).sort(), ['audit', 'brief', 'intent', 'plan', 'spec']);
  assert.ok(artifact(run, w.subjects.audit!).includes('"verdict": "HOLDS"'));
  assert.equal(readFileSync(join(run.runDir, w.read!), 'utf8'), artifact(run, w.subjects.brief!), 'the brief shown is the brief retained');

  // Agreement authorizes nothing: no work is handed out, however often it is asked for.
  for (let i = 0; i < 3; i++) assert.equal(engine.next(run.runId).code, 'NO_WORK');
  assert.equal(engine.status(run.runId).planning, null);
  assert.equal(dispatches(run, 'proof'), 0);

  const decided = engine.decide(run.runId, decision(waiting));
  assert.equal(decided.code, 'DECISION_RECORDED');
  const planning = engine.status(run.runId).planning as { plan_status: string; final_plan: string; last_audited_plan: string };
  assert.equal(planning.plan_status, 'AS_AUDITED');
  assert.equal(planning.last_audited_plan, w.subjects.plan);
  const finalPlan = JSON.parse(artifact(run, planning.final_plan)) as FinalPlan;
  assert.deepEqual(finalPlan.amendments, []);
  assert.equal(finalPlan.audit_verdict, 'HOLDS');
  assert.equal(finalPlan.required_proof.length, 1);
});

test('PLAN-3: a refuted plan authorized with exact amendments keeps its verdict and is not presented as re-audited', async () => {
  const run = await newRun('plan-amend');
  const { engine } = run.assembly;
  const waiting = toHumanWait(run, 'refuted');
  const w = wait(waiting);

  // An amendment decision must carry exact amendments that point at something in the plan.
  assert.equal(engine.decide(run.runId, decision(waiting, { action: 'amend' })).code, 'MALFORMED_DECISION');
  assert.equal(engine.decide(run.runId, decision(waiting, { action: 'amend', amendments: [] })).code, 'MALFORMED_DECISION');
  assert.equal(engine.decide(run.runId, decision(waiting, { action: 'proceed', amendments: AMENDMENTS })).code, 'MALFORMED_DECISION');
  const unknownTarget = decision(waiting, { action: 'amend', amendments: [{ id: 'A1', target: 'U9', text: 'x' }] });
  assert.equal(engine.decide(run.runId, unknownTarget).code, 'AMENDMENT_TARGET_UNKNOWN');
  assert.equal(engine.status(run.runId).planning, null);

  const decided = engine.decide(run.runId, decision(waiting, { action: 'amend', amendments: AMENDMENTS }));
  assert.equal(decided.code, 'DECISION_RECORDED');
  const status = engine.status(run.runId);
  const planning = status.planning as { plan_status: string; final_plan: string; last_audited_plan: string; audit: string };
  assert.equal(planning.plan_status, 'AMENDED_NOT_REAUDITED');
  assert.equal(planning.last_audited_plan, w.subjects.plan, 'the audited identity is the plan the auditor saw');
  assert.equal(planning.audit, w.subjects.audit);
  assert.notEqual(planning.final_plan, w.subjects.plan, 'the final plan has its own identity');

  const finalPlan = JSON.parse(artifact(run, planning.final_plan)) as FinalPlan;
  assert.equal(finalPlan.audit_verdict, 'REFUTED', 'the verdict is preserved, not rewritten');
  assert.deepEqual(finalPlan.amendments, AMENDMENTS);
  assert.equal(finalPlan.amendments_audited, false);
  assert.deepEqual(finalPlan.residual_findings.map((f) => f.id), ['F1']);
  assert.ok(artifact(run, w.subjects.audit!).includes('"verdict": "REFUTED"'), 'the original audit is unchanged');

  assert.deepEqual(status.audit_budget, { max: 2, used: 1 }, 'no re-audit happened');
  assert.equal(dispatches(run, 'plan-audit'), 1);
  assert.equal(dispatches(run, 'plan-revision'), 0);
});

test('PLAN-4: a second audit happens only on request, uses a fresh view, ends at a human wait, and there is no third', async () => {
  const run = await newRun('plan-second');
  const { engine } = run.assembly;
  const first = toHumanWait(run, 'refuted');
  const w1 = wait(first);
  assert.equal(engine.decide(run.runId, decision(first, { action: 'second-audit' })).code, 'DECISION_RECORDED');

  // The planner revises with the first audit in hand and must answer every finding.
  const revision = pendingOf(engine.next(run.runId));
  assert.equal(revision.step_id, 'plan-revision');
  assert.deepEqual(Object.keys(revision.inputs).sort(), ['intent', 'prior_audit', 'prior_plan', 'source', 'spec']);
  assert.deepEqual(revision.produces, { dispositions: 'dispositions.json', plan: 'plan.json' });
  const bad = JSON.parse(result(revision)) as { files: Record<string, string> };
  writeFileSync(
    join(run.runDir, revision.work_dir, 'dispositions.json'),
    JSON.stringify({ schema_version: 1, record_type: 'finding-dispositions', audit: revision.inputs.prior_audit, dispositions: [] }),
  );
  assert.equal(engine.submit(run.runId, JSON.stringify(bad)).code, 'CONTRACT_VIOLATION', 'a finding without a disposition is refused');
  assert.equal(engine.submit(run.runId, result(revision)).code, 'ACCEPTED');

  // The second auditor gets the complete revised plan and the original requirements: no earlier audit, no dispositions.
  const audit2 = pendingOf(engine.next(run.runId));
  assert.equal(audit2.step_id, 'plan-audit');
  assert.equal(audit2.round, 2);
  assert.deepEqual(Object.keys(audit2.inputs).sort(), ['intent', 'plan', 'source', 'spec']);
  assert.notEqual(audit2.inputs.plan, w1.subjects.plan, 'it audits the revised plan');
  assert.ok(!Object.values(audit2.inputs).includes(w1.subjects.audit!));
  engine.submit(run.runId, result(audit2));

  const second = engine.next(run.runId);
  assert.equal(second.code, 'BRIEF_READY');
  const w2 = wait(second);
  assert.equal(w2.round, 2);
  assert.deepEqual(w2.allowed_actions, ['proceed', 'amend', 'pause', 'reject'], 'a further audit is not on offer');
  assert.match(readFileSync(join(run.runDir, 'brief', 'round-2.html'), 'utf8'), /Earlier round/);
  assert.ok(existsSync(join(run.runDir, 'brief', 'round-1.html')), 'the first brief is kept');

  // A third audit cannot be requested, and nothing starts one.
  assert.equal(engine.decide(run.runId, decision(second, { action: 'second-audit', decision_id: 'D3' })).code, 'ACTION_NOT_ALLOWED');
  // Interruption: a new engine over the same directory resumes at the same wait with the same counters.
  const again = createAssembly(run.workspace).engine;
  assert.equal(again.resume(run.runId).directive?.kind, 'WAIT');
  for (let i = 0; i < 3; i++) assert.equal(again.next(run.runId).code, 'NO_WORK');
  assert.deepEqual(again.status(run.runId).audit_budget, { max: 2, used: 2 }, 'counters are not reset by resume');
  assert.equal(dispatches(run, 'plan-audit'), 2);
  assert.equal(dispatches(run, 'plan-revision'), 1);

  assert.equal(again.decide(run.runId, decision(second, { decision_id: 'D4' })).code, 'DECISION_RECORDED');
  const planning = again.status(run.runId).planning as { audit_round: number; last_audited_plan: string };
  assert.equal(planning.audit_round, 2);
  assert.equal(planning.last_audited_plan, w2.subjects.plan);
});

test('pause and reject: neither is permission to implement, and declining another audit is not approval', async () => {
  const run = await newRun('plan-pause');
  const { engine } = run.assembly;
  const waiting = toHumanWait(run);
  const paused = engine.decide(run.runId, decision(waiting, { action: 'pause' }));
  assert.equal(paused.code, 'DECISION_RECORDED');
  const w = wait(paused);
  assert.equal(w.paused, true);
  assert.equal(engine.status(run.runId).planning, null);
  assert.equal(engine.next(run.runId).code, 'NO_WORK');
  assert.equal(dispatches(run, 'proof'), 0);

  // The earlier decision cannot be replayed as a later one; a new decision names the current version.
  assert.equal(engine.decide(run.runId, decision(waiting, { decision_id: 'D2', action: 'proceed' })).code, 'STALE_STATE_VERSION');
  const rejected = engine.decide(run.runId, decision(paused, { decision_id: 'D3', action: 'reject' }));
  assert.equal(rejected.directive?.kind === 'DONE' && rejected.directive.terminal, 'REJECTED');
  assert.equal(engine.status(run.runId).planning, null);
});

test('PLAN-5: a decision whose basis changed is rejected', async () => {
  const run = await newRun('plan-stale');
  const { engine } = run.assembly;
  const first = toHumanWait(run, 'refuted');
  engine.decide(run.runId, decision(first, { action: 'second-audit' }));
  completeStep(run);
  const second = auditAndBrief(run);

  // An approval of the round-one plan, presented against the current version.
  const old = decision(first, { decision_id: 'D-old', expected_version: wait(second).expected_version });
  assert.equal(engine.decide(run.runId, old).code, 'STALE_DECISION_SUBJECT');
  // Subjects from a different run.
  const other = await newRun('plan-stale-other');
  const foreign = decision(second, { decision_id: 'D-foreign', subjects: wait(toHumanWait(other)).subjects });
  assert.equal(engine.decide(run.runId, foreign).code, 'STALE_DECISION_SUBJECT');

  // The retained plan is altered on disk while approval is pending.
  const planRef = wait(second).subjects.plan!;
  const path = join(run.runDir, 'artifacts', planRef.slice(7));
  const original = readFileSync(path);
  writeFileSync(path, original.toString().replace('SIMULATED plan', 'ALTERED plan'));
  const tampered = engine.decide(run.runId, decision(second, { decision_id: 'D-tampered' }));
  assert.equal(tampered.code, 'MISSING_INPUT');
  assert.equal(engine.status(run.runId).planning, null);
  writeFileSync(path, original);
  assert.equal(engine.decide(run.runId, decision(second, { decision_id: 'D-ok' })).code, 'DECISION_RECORDED');
});

test('PLAN-1: an open product decision goes to the human; no specification is written until it is answered', async () => {
  const run = await newRun('plan-question');
  const { engine } = run.assembly;
  const asked = completeStep(run, 'open-decision');
  const w = wait(asked);
  assert.equal(w.awaiting, 'PRODUCT_QUESTION');
  assert.deepEqual(w.allowed_actions, ['answer', 'reject']);
  assert.equal(engine.next(run.runId).code, 'NO_WORK');
  assert.equal(dispatches(run, 'spec'), 0);
  assert.match(readFileSync(join(run.runDir, w.read!), 'utf8'), /Open decisions: What should/);

  assert.equal(engine.decide(run.runId, decision(asked, { action: 'proceed' })).code, 'ACTION_NOT_ALLOWED');
  assert.equal(engine.decide(run.runId, decision(asked, { action: 'answer' })).code, 'MALFORMED_DECISION', 'an answer needs its text');
  const answered = engine.decide(run.runId, decision(asked, { action: 'answer', answer: 'Return 503 with code EXPORTS_DISABLED.' }));
  assert.equal(answered.code, 'DECISION_RECORDED');

  const retry = pendingOf(engine.next(run.runId));
  assert.equal(retry.attempt_id, 'intent-2');
  assert.deepEqual(Object.keys(retry.inputs).sort(), ['answers', 'source']);
  assert.match(artifact(run, retry.inputs.answers!), /EXPORTS_DISABLED/, 'the planner receives the human answer as retained');
  engine.submit(run.runId, result(retry));
  assert.equal(engine.status(run.runId).stage, 'spec');
});

test('open product decisions cannot loop forever', async () => {
  const run = await newRun('plan-question-limit');
  const { engine } = run.assembly;
  let last = completeStep(run, 'open-decision');
  for (let i = 1; i <= 3; i++) {
    engine.decide(run.runId, decision(last, { decision_id: `Q${i}`, action: 'answer', answer: 'unclear' }));
    last = completeStep(run, 'open-decision');
  }
  assert.equal(last.directive?.kind === 'BLOCKED' && last.directive.blocker, 'UNRESOLVED_PRODUCT_DECISIONS');
  assert.equal(dispatches(run, 'spec'), 0);
});

test('records that break their contract are refused without a transition', async () => {
  const run = await newRun('plan-contract');
  const { engine } = run.assembly;
  completeStep(run);
  completeStep(run);

  // A plan that leaves an acceptance criterion without a unit.
  const plan = pendingOf(engine.next(run.runId));
  const uncovered = engine.submit(run.runId, result(plan, {}, 'uncovered'));
  assert.equal(uncovered.code, 'CONTRACT_VIOLATION');
  assert.match(JSON.stringify(uncovered.detail), /no unit carries AC-3/);
  // A result that does not name the file it must deliver, or names an extra one.
  assert.equal(engine.submit(run.runId, result(plan, { files: {} })).code, 'CONTRACT_VIOLATION');
  assert.equal(engine.submit(run.runId, result(plan, { files: { plan: 'plan.json', extra: 'plan.json' } })).code, 'CONTRACT_VIOLATION');
  assert.equal(engine.status(run.runId).stage, 'plan');
  assert.equal(engine.submit(run.runId, result(plan)).code, 'ACCEPTED');

  // An audit that names a plan other than the one it was given.
  const audit = pendingOf(engine.next(run.runId));
  const raw = result(audit);
  const file = join(run.runDir, audit.work_dir, 'audit.json');
  const good = readFileSync(file, 'utf8');
  writeFileSync(file, good.replace(audit.inputs.plan!, `sha256:${'0'.repeat(64)}`));
  const wrongSubject = engine.submit(run.runId, raw);
  assert.equal(wrongSubject.code, 'CONTRACT_VIOLATION');
  assert.match(JSON.stringify(wrongSubject.detail), /is not the plan this audit was given/);
  // An audit that claims a refutation with no finding, or shows no coverage.
  writeFileSync(file, good.replace('"HOLDS"', '"REFUTED"'));
  assert.equal(engine.submit(run.runId, raw).code, 'CONTRACT_VIOLATION');
  writeFileSync(file, JSON.stringify({ ...JSON.parse(good), coverage: [] }));
  assert.equal(engine.submit(run.runId, raw).code, 'CONTRACT_VIOLATION');
  assert.deepEqual(engine.status(run.runId).audit_budget, { max: 2, used: 0 }, 'a refused audit does not use the budget');
  assert.equal(eventTypes(run).filter((t) => t === 'result_accepted').length, 3);
});

test('the brief escapes every role-supplied value and contains nothing executable', async () => {
  const run = await newRun('plan-html');
  const { engine } = run.assembly;
  completeStep(run, 'hostile');
  completeStep(run, 'hostile');
  completeStep(run, 'hostile');
  const envelope = pendingOf(engine.next(run.runId));
  // A refuted audit whose finding carries the payload.
  const raw = result(envelope, {}, 'refuted');
  const file = join(run.runDir, envelope.work_dir, 'audit.json');
  writeFileSync(file, readFileSync(file, 'utf8').replace('FIXTURE finding', `${JSON.stringify(HOSTILE).slice(1, -1)} FIXTURE finding`));
  assert.equal(engine.submit(run.runId, raw).code, 'ACCEPTED');
  const waiting = engine.next(run.runId);
  const html = readFileSync(join(run.runDir, wait(waiting).read!), 'utf8');

  // The payload is present as text, and only as text.
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.ok(html.split('&lt;img src=x onerror=alert(1)&gt;').length > 4, 'intent, spec, plan, and audit payloads are all shown escaped');
  const allowed = new Set(['!doctype', 'html', 'head', 'meta', 'title', 'style', 'body', 'h1', 'h2', 'h3', 'p', 'strong', 'table', 'tr', 'th', 'td', 'ul', 'li']);
  const attributes = new Set(['lang', 'charset', 'http-equiv', 'content', 'class']);
  for (const tag of html.matchAll(/<\/?([^\s>/]+)([^>]*)>/g)) {
    assert.ok(allowed.has((tag[1] as string).toLowerCase()), `unexpected element <${tag[1]}>`);
    if (tag[1] === '!doctype') continue;
    for (const attr of (tag[2] as string).matchAll(/([a-zA-Z-]+)\s*=/g)) {
      assert.ok(attributes.has((attr[1] as string).toLowerCase()), `unexpected attribute ${attr[1]} on <${tag[1]}>`);
    }
  }
  assert.match(html, /Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"/);
  assert.equal(wait(waiting).awaiting, 'PLAN_DECISION', 'hostile content changes nothing about the decision required');
});

test('a run that is not simulated refuses simulated results from the driver', async () => {
  const run = await newRun('plan-real', {}, 'MANUAL_TRANSPORT');
  const { engine } = run.assembly;
  // The driver will not feed a simulated transport into it.
  const transport = createFakeTransport(run.assembly.runsRoot);
  const refused = driveRun(engine, transport, run.runId);
  assert.equal(refused.stopped, 'TRANSPORT_CLASS_MISMATCH');
  assert.deepEqual(transport.dispatched, []);
  assert.deepEqual(eventTypes(run), ['run_started']);

  // Planning itself works with results submitted by hand (here: fixture content, standing in for a manual transport).
  const waiting = toHumanWait(run);
  // HUMAN_RECORDED here is a fixture claim made by this test, not an observed approval.
  const decided = engine.decide(run.runId, decision(waiting, { provenance: 'HUMAN_RECORDED' }));
  assert.deepEqual(decided.directive, { kind: 'CONTINUE', pending: null });
  const status = engine.status(run.runId);
  assert.equal(status.transport_class, 'MANUAL_TRANSPORT');
  assert.equal((status.planning as { status: string }).status, 'AUTHORIZED');
  // The driver still refuses to feed simulated results into it at the later stages.
  assert.equal(driveRun(engine, transport, run.runId).stopped, 'TRANSPORT_CLASS_MISMATCH');
  assert.deepEqual(transport.dispatched, []);
  assert.ok(!existsSync(join(run.runDir, 'proposal')), 'no proposal exists without a verified candidate');
});

test('command line: a decision given as flags is bound to the version shown and rejected once the run has moved on', async () => {
  const run = await newRun('plan-cli', {}, 'MANUAL_TRANSPORT');
  const waiting = toHumanWait(run);
  const w = wait(waiting);
  const base = ['decide', '--workspace', run.workspace, '--run', run.runId, '--decision-id', 'D1', '--recorded-by', 'test fixture'];
  const human = ['--provenance', 'HUMAN_RECORDED']; // a fixture claim, not an observed approval

  // Without a stated provenance the command line adds none, and the run refuses the decision.
  const unstated = cli([...base, '--action', 'proceed', '--expected-version', String(w.expected_version)]);
  assert.equal(unstated.reply.code, 'DECISION_PROVENANCE_REQUIRED');
  const stale = cli([...base, ...human, '--action', 'proceed', '--expected-version', String(w.expected_version - 1)]);
  assert.equal(stale.status, 2);
  assert.equal(stale.reply.code, 'STALE_STATE_VERSION');
  const unknown = cli([...base, ...human, '--action', 'approve', '--expected-version', String(w.expected_version)]);
  assert.equal(unknown.reply.code, 'MALFORMED_DECISION');

  const ok = cli([...base, ...human, '--action', 'proceed', '--expected-version', String(w.expected_version)]);
  assert.equal(ok.status, 0);
  assert.equal(ok.reply.code, 'DECISION_RECORDED');
  assert.equal(ok.reply.directive?.kind, 'CONTINUE');
  // The same flags after the run moved on no longer describe what was displayed:
  // the decision id is known with different content, so nothing more is recorded.
  const again = cli([...base, ...human, '--action', 'proceed', '--expected-version', String(w.expected_version)]);
  assert.equal(again.reply.code, 'CONFLICTING_DUPLICATE');
  assert.equal(eventTypes(run).filter((t) => t === 'decision_recorded').length, 1);
});
