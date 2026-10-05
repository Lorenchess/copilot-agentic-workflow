// RC3: the bytes presented as the decision subject are the bytes whose
// identity the decision binds.
//
// A plan-decision wait names a file for the human to read. The engine used to
// check only the retained copy of the brief when a decision arrived, so a
// display file changed after rendering could be approved while the retained
// brief still said something else. These tests change, delete, and restore
// that display file.
//
// Evidence class: engine tests (offline). Role content comes from the fake
// transport and is SIMULATED; decisions are SCRIPTED fixtures, except the one
// command-line case, which states HUMAN_RECORDED as a fixture claim. Nothing
// here is an observed human approval.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { refOf } from '../core/contracts/records.ts';
import type { Reply } from '../core/engine/engine.ts';
import { type TestRun, auditAndBrief, cli, completeStep, decision, eventTypes, newRun, toHumanWait } from './support/harness.ts';

type Wait = Extract<Reply['directive'], { kind: 'WAIT' }>;
const wait = (r: Reply): Wait => {
  assert.equal(r.directive?.kind, 'WAIT');
  return r.directive as Wait;
};
const REFUSED = 'DISPLAYED_SUBJECT_CHANGED';
// The counterexample of the audit: only the displayed wording of AC-1 changes.
const SHOWN = 'returns 503 with code EXPORTS_DISABLED and invokes the exporter zero times';
const ALTERED = 'returns 200 and continues exporting';

const displayPath = (run: TestRun, w: Wait): string => join(run.runDir, w.read as string);
const retainedBrief = (run: TestRun, w: Wait): Buffer => readFileSync(join(run.runDir, 'artifacts', (w.subjects.brief as string).slice(7)));
const decisionsRecorded = (run: TestRun): number => eventTypes(run).filter((t) => t === 'decision_recorded').length;

function alterDisplay(run: TestRun, w: Wait): string {
  const path = displayPath(run, w);
  const shown = readFileSync(path, 'utf8');
  assert.ok(shown.includes(SHOWN), 'the fixture brief shows AC-1 as approved wording');
  const altered = shown.replace(SHOWN, ALTERED);
  assert.notEqual(altered, shown);
  writeFileSync(path, altered);
  return altered;
}

// Nothing was decided: same wait, same version, no authorization, no new event.
function assertWaitPreserved(run: TestRun, w: Wait, refused: Reply): void {
  assert.equal(refused.ok, false);
  assert.equal(refused.code, REFUSED);
  assert.deepEqual(wait(refused), w, 'the refusal still shows the same wait');
  const status = run.assembly.engine.status(run.runId);
  assert.equal(status.phase, 'WAITING_HUMAN');
  assert.equal(status.stage, 'plan-decision');
  assert.equal(status.state_version, w.expected_version);
  assert.equal(status.planning, null, 'no plan was authorized');
  assert.equal(decisionsRecorded(run), 0);
}

test('RC3 control: the wait names a file that is the retained brief, and a decision on the unchanged display is recorded', async () => {
  const run = await newRun('rc3-control');
  const waiting = toHumanWait(run);
  const w = wait(waiting);
  assert.equal(w.read, 'brief/round-1.html');
  assert.equal(refOf(readFileSync(displayPath(run, w))), w.subjects.brief, 'what is displayed is what the decision names');
  assert.equal(run.assembly.engine.decide(run.runId, decision(waiting)).code, 'DECISION_RECORDED');
  assert.equal(run.assembly.engine.status(run.runId).stage, 'proof');
});

test('RC3: a display file edited after the wait refuses every decision, keeps the wait, and is not replaced', async () => {
  const run = await newRun('rc3-edited');
  const { engine } = run.assembly;
  const waiting = toHumanWait(run);
  const w = wait(waiting);
  const altered = alterDisplay(run, w);

  // The original wait version and subjects, as the counterexample submitted them.
  const refused = engine.decide(run.runId, decision(waiting));
  assertWaitPreserved(run, w, refused);
  assert.deepEqual(refused.detail, { read: 'brief/round-1.html', subject: 'brief', expected: w.subjects.brief, found: refOf(altered) });
  assert.match(String(refused.evidence), /^rejected\/[0-9a-f]{64}\.DISPLAYED_SUBJECT_CHANGED\.json$/, 'the refused decision is kept as evidence');
  assert.ok(existsSync(join(run.runDir, String(refused.evidence))));

  // No action is taken on a display the engine cannot vouch for: not approval, not rejection.
  for (const action of w.allowed_actions) {
    const extra = action === 'amend' ? { amendments: [{ id: 'A1', target: 'U1', text: 'Check authorization before the flag.' }] } : {};
    const r = engine.decide(run.runId, decision(waiting, { decision_id: `D-${action}`, action: action as never, ...extra }));
    assertWaitPreserved(run, w, r);
  }

  // The engine neither accepted nor silently replaced what the human was shown.
  assert.equal(readFileSync(displayPath(run, w), 'utf8'), altered, 'the changed display file is left as found');
  assert.ok(retainedBrief(run, w).toString().includes(SHOWN), 'the retained brief still holds the original wording');
  // Resuming repairs derived state; it does not put the display back unasked.
  assert.equal(engine.resume(run.runId).code, 'RESUMED');
  assert.equal(readFileSync(displayPath(run, w), 'utf8'), altered);
  assertWaitPreserved(run, w, engine.decide(run.runId, decision(waiting, { decision_id: 'D-after-resume' })));

  // Explicit recovery: the retained bytes are put back, and a decision is then made on them.
  writeFileSync(displayPath(run, w), retainedBrief(run, w));
  assert.equal(engine.decide(run.runId, decision(waiting, { decision_id: 'D-recovered' })).code, 'DECISION_RECORDED');
  assert.equal(engine.status(run.runId).stage, 'proof');
  assert.equal(decisionsRecorded(run), 1);
});

test('RC3: a deleted display file refuses the decision and keeps the wait', async () => {
  const run = await newRun('rc3-deleted');
  const { engine } = run.assembly;
  const waiting = toHumanWait(run);
  const w = wait(waiting);
  rmSync(displayPath(run, w));

  const refused = engine.decide(run.runId, decision(waiting));
  assertWaitPreserved(run, w, refused);
  assert.deepEqual(refused.detail, { read: 'brief/round-1.html', subject: 'brief', expected: w.subjects.brief, found: null });
  assert.ok(!existsSync(displayPath(run, w)), 'the engine did not recreate the file');

  writeFileSync(displayPath(run, w), retainedBrief(run, w));
  assert.equal(engine.decide(run.runId, decision(waiting, { decision_id: 'D-recovered' })).code, 'DECISION_RECORDED');
});

test('RC3: in a second round the decision is bound to the round-two display', async () => {
  const run = await newRun('rc3-round-two');
  const { engine } = run.assembly;
  const first = toHumanWait(run, 'refuted');
  assert.equal(engine.decide(run.runId, decision(first, { action: 'second-audit' })).code, 'DECISION_RECORDED');
  completeStep(run);
  const second = auditAndBrief(run);
  const w = wait(second);
  assert.equal(w.read, 'brief/round-2.html');
  const original = readFileSync(displayPath(run, w));
  writeFileSync(displayPath(run, w), `${original.toString()}<!-- changed after rendering -->`);

  const refused = engine.decide(run.runId, decision(second, { decision_id: 'D2' }));
  assert.equal(refused.code, REFUSED);
  assert.deepEqual(wait(refused), w);
  assert.equal(engine.status(run.runId).planning, null);
  assert.equal(decisionsRecorded(run), 1, 'only the request for the second audit is on record');

  writeFileSync(displayPath(run, w), original);
  assert.equal(engine.decide(run.runId, decision(second, { decision_id: 'D2' })).code, 'DECISION_RECORDED');
});

test('RC3: the command-line decision path refuses the same way', async () => {
  const run = await newRun('rc3-cli', {}, 'MANUAL_TRANSPORT');
  const waiting = toHumanWait(run);
  const w = wait(waiting);
  alterDisplay(run, w);
  // HUMAN_RECORDED here is a fixture claim, not an observed approval.
  const flags = ['decide', '--workspace', run.workspace, '--run', run.runId, '--recorded-by', 'test fixture', '--provenance', 'HUMAN_RECORDED', '--action', 'proceed', '--expected-version', String(w.expected_version)];

  const refused = cli([...flags, '--decision-id', 'D1']);
  assert.equal(refused.status, 2);
  assert.equal(refused.reply.code, REFUSED);
  assert.equal(run.assembly.engine.status(run.runId).planning, null);
  assert.equal(decisionsRecorded(run), 0);

  writeFileSync(displayPath(run, w), retainedBrief(run, w));
  const ok = cli([...flags, '--decision-id', 'D2']);
  assert.equal(ok.reply.code, 'DECISION_RECORDED');
});

// Held before RC3 and kept as the other half of the invariant: at a product
// question the file named is the retained record itself, so the existing
// identity check already covers what the human reads.
test('RC3 companion: a product question names the retained record itself, and a changed record refuses the answer', async () => {
  const run = await newRun('rc3-question');
  const { engine } = run.assembly;
  const asked = completeStep(run, 'open-decision');
  const w = wait(asked);
  assert.equal(w.awaiting, 'PRODUCT_QUESTION');
  assert.equal(w.read, `artifacts/${(w.subjects.intent as string).slice(7)}`);
  const path = displayPath(run, w);
  const original = readFileSync(path);
  writeFileSync(path, original.toString().replace('What should', 'What must'));

  const answer = { action: 'answer' as const, answer: 'Return 503 with code EXPORTS_DISABLED.' };
  const refused = engine.decide(run.runId, decision(asked, answer));
  assert.equal(refused.ok, false);
  assert.equal(refused.code, 'MISSING_INPUT');
  assert.equal(decisionsRecorded(run), 0);

  writeFileSync(path, original);
  assert.equal(engine.decide(run.runId, decision(asked, answer)).code, 'DECISION_RECORDED');
});
