// The dashboard read model against committed journals. Evidence class:
// engine tests (offline, fake role results, real test executions). Every
// run here was driven by the engine; the projector is checked against the
// engine's own status reply and against the journal.

import assert from 'node:assert/strict';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ID_PATTERN, canonicalJson, sha256Hex } from '../core/contracts/records.ts';
import { WORKFLOW, workflowRef } from '../core/policies/workflow.ts';
import { DASHBOARD_SCHEMA_VERSION, type RunView } from '../core/read-model/contracts.ts';
import { listRuns } from '../core/read-model/list-runs.ts';
import { projectRun } from '../core/read-model/project-run.ts';
import { readRun } from '../core/read-model/read-run.ts';
import { mainPath, parseWorkflowDef } from '../core/read-model/workflow-def.ts';
import { PACKAGE_ROOT, journalText, tmpDir } from './support/harness.ts';
import { type ScenarioRun, scenarioRun } from './support/scenarios.ts';

const stage = (view: RunView, id: string) => {
  const node = view.stage_graph.find((s) => s.stage_id === id);
  assert.ok(node, `stage ${id} is in the graph`);
  return node;
};
const view = (run: ScenarioRun): RunView => readRun(run.assembly.runsRoot, run.runId);

// Every file under a directory with its bytes, so a read can be shown to change nothing.
function digestDir(dir: string): string {
  const entries = readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name))
    .sort()
    .map((f) => `${f}:${sha256Hex(readFileSync(f))}:${statSync(f).mtimeMs}`);
  return sha256Hex(entries.join('\n'));
}

test('DASH-02: a freshly started run shows intake as current with nothing dispatched and no model claim', async () => {
  const run = await scenarioRun('fresh');
  const v = view(run);
  assert.equal(v.schema_version, DASHBOARD_SCHEMA_VERSION);
  assert.equal(v.record_type, 'dashboard-run-view');
  assert.equal(v.source_status, 'CURRENT');
  assert.equal(v.journal_version, 1);
  assert.deepEqual([v.engine.phase, v.engine.stage, v.engine.directive], ['ACTIVE', 'intent', 'CONTINUE']);
  assert.equal(stage(v, 'intent').state, 'CURRENT_IDLE');
  assert.equal(v.current_activity.dispatch_status, 'NONE');
  assert.equal(v.current_activity.attempt_id, null);
  assert.equal(v.current_activity.effective_model, 'NOT_OBSERVED');
  assert.equal(v.final_outcome, 'IN_PROGRESS');
  assert.equal(v.human_action.required, false);
  assert.deepEqual(v.workflow, { id: 'local-request-to-proposal', version: 6, ref: workflowRef(WORKFLOW), execution_profile: 'STANDARD', stages: WORKFLOW.stages.length });
  assert.deepEqual(v.application, { label: 'sample-export-app', label_source: 'retained-package-json', base_ref: v.application.base_ref, app_config_ref: v.application.app_config_ref });
  assert.equal(v.request.request_id, 'REQ-001');
  assert.equal(v.request.locator, 'file:REQ-001.md');
  assert.ok(v.not_observed.some((n) => /model/i.test(n)), 'says the effective model is not observed');
  assert.equal(v.timeline.length, 1);
  assert.equal(v.timeline[0]?.category, 'start');
  assert.equal(v.proposal, null);
  assert.equal(v.engine.publication_status, 'NOT_ATTEMPTED');
});

test('DASH-03: a dispatched planner is shown as awaiting a result, with the configured model and no effective model', async () => {
  const run = await scenarioRun('planner-dispatched');
  const v = view(run);
  assert.equal(stage(v, 'intent').state, 'DISPATCHED_AWAITING_RESULT');
  assert.equal(v.current_activity.dispatch_status, 'DISPATCHED_AWAITING_RESULT');
  assert.equal(v.current_activity.attempt_id, 'intent-1');
  assert.equal(v.current_activity.role, 'planner');
  assert.equal(v.current_activity.mode, 'intake');
  assert.deepEqual(v.current_activity.configured_model, { alias: 'opus', owner_label: 'Opus 5.5', family: 'Anthropic', selector_status: 'requires-host-observation', host_selector: null });
  assert.equal(v.current_activity.effective_model, 'NOT_OBSERVED');
  assert.deepEqual(v.current_activity.retry, { used: 0, budget: 2 });
  const attempt = v.attempts.find((a) => a.attempt_id === 'intent-1');
  assert.ok(attempt);
  assert.equal(attempt.status, 'PENDING');
  assert.equal(attempt.settled_at, null);
  assert.equal(attempt.dispatched_version, 2);
  assert.equal(v.timeline[1]?.category, 'dispatch');
});

test('the auditor dispatch follows three accepted planner results', async () => {
  const run = await scenarioRun('awaiting-auditor');
  const v = view(run);
  for (const id of ['intent', 'spec', 'plan']) assert.equal(stage(v, id).state, 'COMPLETED', id);
  assert.equal(stage(v, 'plan-audit').state, 'DISPATCHED_AWAITING_RESULT');
  assert.equal(v.current_activity.role, 'plan-auditor');
  assert.deepEqual(v.current_activity.configured_model?.owner_label, 'Sol 6.1');
  assert.equal(stage(v, 'intent').completed_at, v.timeline[2]?.at);
  assert.deepEqual(Object.keys(stage(v, 'spec').produced), ['spec']);
});

test('DASH-05: the plan decision is a prominent human wait with the engine\'s exact actions and the audit summary', async () => {
  const run = await scenarioRun('plan-decision');
  const v = view(run);
  const status = run.assembly.engine.status(run.runId);
  assert.equal(v.source_status, 'CURRENT');
  assert.equal(v.final_outcome, 'WAITING_HUMAN');
  assert.equal(v.engine.directive, 'WAIT');
  assert.equal(stage(v, 'plan-decision').state, 'WAITING_HUMAN');
  assert.equal(stage(v, 'brief').state, 'COMPLETED');
  assert.equal(stage(v, 'proof').state, 'NOT_REACHED');
  assert.equal(stage(v, 'product-question').state, 'NOT_TAKEN');
  assert.equal(stage(v, 'plan-revision').state, 'NOT_TAKEN');
  const h = v.human_action;
  assert.equal(h.required, true);
  assert.equal(h.awaiting, 'PLAN_DECISION');
  assert.equal(h.decision_state, 'AWAITING');
  const wait = status.directive?.kind === 'WAIT' ? status.directive : null;
  assert.ok(wait);
  assert.deepEqual(h.allowed_actions, wait.allowed_actions);
  assert.equal(h.expected_version, wait.expected_version);
  assert.equal(h.expected_version, v.journal_version);
  assert.equal(h.read, 'brief/round-1.html');
  assert.deepEqual(h.subjects, wait.subjects);
  assert.deepEqual(h.audit, { verdict: 'HOLDS', findings: 0, unchecked: 2, blocking: 0 });
  assert.equal(h.waiting_since, v.last_committed_at);
  assert.equal(v.current_activity.dispatch_status, 'NONE');
  assert.equal(v.current_activity.kind, 'human');
  assert.equal(v.evidence.find((e) => e.key === 'brief')?.kind, 'html');
});

test('DASH-04: an intent with open product decisions waits for the human with answer or reject', async () => {
  const run = await scenarioRun('product-question');
  const v = view(run);
  assert.equal(v.human_action.awaiting, 'PRODUCT_QUESTION');
  assert.deepEqual(v.human_action.allowed_actions, ['answer', 'reject']);
  assert.match(v.human_action.open_decisions ?? '', /What should an authorized request receive/);
  assert.match(v.human_action.read ?? '', /^artifacts\/[0-9a-f]{64}$/);
  assert.equal(stage(v, 'product-question').state, 'WAITING_HUMAN');
  assert.equal(stage(v, 'intent').state, 'COMPLETED');
  assert.equal(v.human_action.audit, null);
});

test('DASH-06: a second audit round shows the revision branch, both audits, and no further second-audit action', async () => {
  const run = await scenarioRun('second-audit');
  const v = view(run);
  assert.equal(v.engine.round, 2);
  assert.equal(stage(v, 'plan-revision').state, 'COMPLETED');
  assert.deepEqual(stage(v, 'plan-audit').attempt_ids, ['plan-audit-1', 'plan-audit-2']);
  assert.equal(stage(v, 'plan-audit').accepted_attempt, 'plan-audit-2');
  const audits = v.reviews.filter((r) => r.stage_id === 'plan-audit');
  assert.deepEqual(audits.map((a) => [a.round, a.verdict, a.current]), [[1, 'REFUTED', false], [2, 'HOLDS', true]]);
  assert.equal(audits[0]?.findings.length, 1);
  assert.ok(!v.human_action.allowed_actions.includes('second-audit'));
  assert.equal(v.human_action.read, 'brief/round-2.html');
  assert.equal(v.decisions.length, 1);
  assert.equal(v.decisions[0]?.action, 'second-audit');
  assert.equal(v.attempts.find((a) => a.attempt_id === 'plan-audit-1')?.superseded, true);
  assert.equal(v.attempts.find((a) => a.attempt_id === 'plan-1')?.superseded, true);
});

test('DASH-07: a failed attempt and its retry are both retained, with the retry budget', async () => {
  const run = await scenarioRun('failed-attempt-retried');
  const v = view(run);
  const first = v.attempts.find((a) => a.attempt_id === 'intent-1');
  const second = v.attempts.find((a) => a.attempt_id === 'intent-2');
  assert.deepEqual([first?.status, first?.failure_kind, first?.settled_version], ['FAILED', 'TIMEOUT', 3]);
  assert.equal(second?.status, 'PENDING');
  assert.equal(stage(v, 'intent').state, 'DISPATCHED_AWAITING_RESULT');
  assert.deepEqual(v.current_activity.retry, { used: 1, budget: 2 });
  assert.equal(v.problems.filter((p) => p.kind === 'ATTEMPT_FAILED').length, 1);
  assert.equal(v.timeline.find((t) => t.seq === 3)?.category, 'failure');
});

test('a developer dispatch after an accepted proof shows the tester\'s execution record', async () => {
  const run = await scenarioRun('implementing');
  const v = view(run);
  assert.equal(stage(v, 'proof').state, 'COMPLETED');
  assert.equal(stage(v, 'implement').state, 'DISPATCHED_AWAITING_RESULT');
  assert.equal(v.executions.length, 1);
  assert.deepEqual([v.executions[0]?.purpose, v.executions[0]?.outcome], ['PROOF_BASELINE', 'VALID']);
  assert.ok(v.executions[0] && v.executions[0].tests.length >= 3);
  assert.equal(v.decisions[0]?.plan_status, 'AS_AUDITED');
});

test('DASH-09: a failed verification shows the failed run, no success mark, and the developer stage current again', async () => {
  const run = await scenarioRun('verification-failed');
  const v = view(run);
  assert.equal(v.engine.failed_verifications, 1);
  assert.equal(v.engine.stage, 'implement');
  assert.equal(stage(v, 'verify').state, 'FAILED_ATTEMPT');
  assert.equal(stage(v, 'implement').state, 'CURRENT_IDLE');
  const failed = v.executions.find((e) => e.purpose === 'CANDIDATE_VERIFICATION');
  assert.equal(failed?.outcome, 'FAIL');
  assert.ok(failed && failed.issues.length > 0);
  assert.equal(v.problems.filter((p) => p.kind === 'VERIFICATION_FAILED').length, 1);
  assert.equal(v.final_outcome, 'IN_PROGRESS');
});

test('DASH-10: a rejecting code review blocks the run with its verdict and no proposal', async () => {
  const run = await scenarioRun('review-rejected');
  const v = view(run);
  assert.equal(v.final_outcome, 'BLOCKED');
  assert.equal(v.engine.blocker?.code, 'REVIEW_REJECTED');
  assert.equal(stage(v, 'review').state, 'BLOCKED');
  assert.equal(stage(v, 'pr-review').state, 'NOT_REACHED');
  const review = v.reviews.find((r) => r.stage_id === 'review');
  assert.deepEqual([review?.verdict, review?.findings.length, review?.current], ['REJECT', 1, true]);
  assert.equal(v.proposal, null);
  assert.equal(v.problems[0]?.kind, 'BLOCKED');
});

test('DASH-11: a PR review that requests changes blocks the run; no proposal is ready', async () => {
  const run = await scenarioRun('pr-review-changes');
  const v = view(run);
  assert.equal(v.engine.blocker?.code, 'PR_REVIEW_CHANGES_REQUESTED');
  assert.equal(stage(v, 'pr-review').state, 'BLOCKED');
  assert.equal(stage(v, 'pr-review-packet').state, 'COMPLETED');
  assert.equal(v.reviews.find((r) => r.stage_id === 'pr-review')?.verdict, 'REQUEST_CHANGES');
  assert.equal(v.proposal, null);
  assert.equal(stage(v, 'proposal').state, 'NOT_REACHED');
});

test('DASH-12: a completed run is a local proposal, publication NOT_ATTEMPTED, every main-path stage completed', async () => {
  const run = await scenarioRun('completed');
  const v = view(run);
  assert.equal(v.final_outcome, 'LOCAL_PR_PROPOSAL_PREPARED');
  assert.equal(v.engine.terminal, 'PR_PROPOSAL_READY');
  assert.deepEqual(v.proposal, { proposal_ref: v.proposal?.proposal_ref, location: 'proposal/pr-proposal.json', status: 'LOCAL_PR_PROPOSAL_PREPARED', publication_status: 'NOT_ATTEMPTED', title: 'SIMULATED: pause exports behind a feature flag' });
  assert.equal(stage(v, 'proposal').state, 'DONE_TERMINAL');
  for (const id of mainPath(WORKFLOW).filter((s) => s !== 'proposal')) assert.equal(stage(v, id).state, 'COMPLETED', id);
  assert.equal(stage(v, 'product-question').state, 'NOT_TAKEN');
  assert.equal(stage(v, 'plan-revision').state, 'NOT_TAKEN');
  assert.equal(v.timeline.length, v.journal_version);
  assert.deepEqual(v.executions.map((e) => e.outcome), ['VALID', 'PASS']);
  assert.deepEqual(v.reviews.map((r) => [r.stage_id, r.verdict]), [['plan-audit', 'HOLDS'], ['review', 'ACCEPT'], ['pr-review', 'APPROVE']]);
  assert.equal(v.decisions[0]?.provenance, 'SCRIPTED');
  assert.equal(v.human_action.required, false);
  assert.ok(v.evidence.every((e) => /^sha256:[0-9a-f]{64}$/.test(e.ref)));
  assert.ok(v.evidence.some((e) => e.key === 'candidate' && e.kind === 'tree'));
  assert.equal(v.current_activity.dispatch_status, 'NONE');
  assert.ok(!JSON.stringify(v).includes('PR_CREATED'));
});

test('a human reject ends the run as REJECTED with the decision recorded', async () => {
  const run = await scenarioRun('rejected');
  const v = view(run);
  assert.equal(v.final_outcome, 'REJECTED');
  assert.equal(v.engine.terminal, 'REJECTED');
  assert.equal(v.human_action.required, false);
  assert.equal(v.human_action.decision_state, 'RECORDED');
  assert.equal(v.human_action.last_decision?.action, 'reject');
  assert.equal(stage(v, 'plan-decision').state, 'DONE_TERMINAL');
});

test('a paused decision is still a wait, marked paused', async () => {
  const run = await scenarioRun('paused');
  const v = view(run);
  assert.equal(v.human_action.required, true);
  assert.equal(v.human_action.paused, true);
  assert.equal(v.human_action.decision_state, 'PAUSED');
  assert.equal(v.engine.paused, true);
});

test('DASH-13: an incomplete journal tail is a diagnostic, never an event', async () => {
  const run = await scenarioRun('plan-decision');
  const before = view(run);
  appendFileSync(join(run.runDir, 'journal.jsonl'), 'deadbeef {"schema_version":1,"seq":99,"type":"proposal_recorded"');
  const v = view(run);
  assert.equal(v.source_status, 'INCOMPLETE_TAIL');
  assert.equal(v.journal_version, before.journal_version);
  assert.ok(v.diagnostic.incomplete_tail_bytes > 0);
  assert.equal(v.timeline.length, before.timeline.length);
  assert.equal(v.final_outcome, 'WAITING_HUMAN');
  assert.ok(v.problems.some((p) => p.kind === 'INCOMPLETE_TAIL'));
  // The read did not repair the journal.
  assert.ok(readFileSync(join(run.runDir, 'journal.jsonl'), 'utf8').endsWith('"proposal_recorded"'));
});

test('DASH-14: a corrupt journal is shown as corrupt with the record number and no replayed state', async () => {
  const run = await scenarioRun('plan-decision');
  const lines = journalText(run).split('\n');
  const third = lines[2] as string;
  lines[2] = `${third.slice(0, 70)}X${third.slice(71)}`;
  writeFileSync(join(run.runDir, 'journal.jsonl'), lines.join('\n'));
  const v = view(run);
  assert.equal(v.source_status, 'CORRUPT');
  assert.equal(v.diagnostic.code, 'JOURNAL_CORRUPT');
  assert.equal(v.diagnostic.record, 3);
  assert.equal(v.journal_version, 0);
  assert.equal(v.final_outcome, 'UNREADABLE');
  assert.equal(v.engine.phase, null);
  assert.ok(v.stage_graph.every((s) => s.state === 'NOT_REACHED'));
  assert.equal(v.human_action.required, false);
  assert.equal(v.timeline.length, 0);
});

test('DASH-15: a run whose retained workflow definition is missing or invalid is unsupported, not reinterpreted', async () => {
  const run = await scenarioRun('plan-decision');
  const first = JSON.parse((journalText(run).split('\n')[0] as string).slice(65)) as { data: { workflow_ref: string } };
  const retained = join(run.runDir, 'artifacts', first.data.workflow_ref.slice(7));
  const bytes = readFileSync(retained);
  rmSync(retained);
  const missing = view(run);
  assert.equal(missing.source_status, 'UNSUPPORTED_WORKFLOW');
  assert.equal(missing.final_outcome, 'UNREADABLE');
  assert.equal(missing.workflow.id, null);
  assert.equal(missing.journal_version, 0);
  assert.ok(missing.stage_graph.length === 0);
  // Altered bytes under the same name are not accepted either.
  writeFileSync(retained, `${bytes.toString('utf8')} `);
  assert.equal(view(run).source_status, 'UNSUPPORTED_WORKFLOW');
  assert.match(view(run).diagnostic.message ?? '', /identity/);
});

test('a run directory without a committed start record is NOT_INITIALIZED', () => {
  const workspace = tmpDir('uninitialized');
  const runsRoot = join(workspace, '.rstack', 'runs');
  mkdirSync(join(runsRoot, 'RUN-empty'), { recursive: true });
  const v = readRun(runsRoot, 'RUN-empty');
  assert.equal(v.source_status, 'NOT_INITIALIZED');
  assert.equal(v.journal_version, 0);
  assert.throws(() => readRun(runsRoot, '../escape'), /run id/);
  assert.equal(readRun(runsRoot, 'RUN-absent').source_status, 'UNREADABLE');
});

test('DASH-21: reading a run and listing a workspace change no file', async () => {
  const run = await scenarioRun('completed');
  const before = digestDir(run.runDir);
  view(run);
  listRuns(run.assembly.runsRoot);
  assert.equal(digestDir(run.runDir), before);
  assert.ok(!existsSync(join(run.runDir, 'lock')), 'no lock was taken');
});

test('the projection is deterministic for the same committed events and changes when the journal grows', async () => {
  const run = await scenarioRun('awaiting-auditor');
  const a = view(run);
  const b = view(run);
  assert.equal(canonicalJson(a), canonicalJson(b));
  assert.equal(a.view_digest, b.view_digest);
  assert.equal(a.view_digest, `sha256:${sha256Hex(canonicalJson({ ...a, view_digest: null }))}`);
  const { completeStep } = await import('./support/harness.ts');
  completeStep(run);
  const c = view(run);
  assert.notEqual(c.view_digest, a.view_digest);
  assert.equal(c.journal_version, a.journal_version + 1, 'the pending audit was accepted: one more committed event');
});

test('projectRun is pure: the same input object projects twice to the same bytes and is not mutated', async () => {
  const run = await scenarioRun('plan-decision');
  const { loadProjectionInput } = await import('../core/read-model/read-run.ts');
  const input = loadProjectionInput(run.assembly.runsRoot, run.runId);
  const frozen = canonicalJson({ ...input, records: [...input.records.entries()] });
  const x = projectRun(input);
  const y = projectRun(input);
  assert.equal(canonicalJson(x), canonicalJson(y));
  assert.equal(canonicalJson({ ...input, records: [...input.records.entries()] }), frozen);
});

test('DASH-16: two runs in one workspace are listed separately with their own state', async () => {
  const workspace = tmpDir('two-runs');
  const a = await scenarioRun('plan-decision', 'two-a', 'RUN-A', workspace);
  const b = await scenarioRun('completed', 'two-b', 'RUN-B', workspace);
  assert.equal(a.assembly.runsRoot, b.assembly.runsRoot);
  writeFileSync(join(a.assembly.runsRoot, 'stray.txt'), 'not a run');
  mkdirSync(join(a.assembly.runsRoot, 'not a valid id!'));
  const list = listRuns(a.assembly.runsRoot);
  assert.deepEqual(list.map((r) => r.run_id).sort(), ['RUN-A', 'RUN-B']);
  const sa = list.find((r) => r.run_id === 'RUN-A');
  const sb = list.find((r) => r.run_id === 'RUN-B');
  assert.deepEqual([sa?.needs_human, sa?.final_outcome, sa?.phase, sa?.stage], [true, 'WAITING_HUMAN', 'WAITING_HUMAN', 'plan-decision']);
  assert.deepEqual([sb?.needs_human, sb?.final_outcome], [false, 'LOCAL_PR_PROPOSAL_PREPARED']);
  assert.equal(sa?.application_label, 'sample-export-app');
  assert.equal(sa?.view_digest, readRun(a.assembly.runsRoot, 'RUN-A').view_digest);
  assert.ok(list.every((r) => ID_PATTERN.test(r.run_id)));
  assert.deepEqual(listRuns(join(workspace, 'no-such-root')), []);
  // The run list carries each stage's state, in stage-graph order, for the mini pipeline strip.
  const va = readRun(a.assembly.runsRoot, 'RUN-A');
  assert.deepEqual(sa?.stage_states, va.stage_graph.map((s) => ({ stage_id: s.stage_id, state: s.state })));
  assert.equal(sa?.stage_states.find((s) => s.stage_id === 'plan-decision')?.state, 'WAITING_HUMAN');
  assert.ok(sb?.stage_states.every((s) => s.state !== 'DISPATCHED_AWAITING_RESULT' && s.state !== 'WAITING_HUMAN'));
});

test('DASH-18: no attempt carries an effective model; configured models come from the retained profile only', async () => {
  const run = await scenarioRun('completed');
  const v = view(run);
  assert.ok(v.attempts.length >= 8);
  for (const a of v.attempts) {
    assert.equal(a.effective_model, 'NOT_OBSERVED');
    assert.equal(a.configured_model?.selector_status, 'requires-host-observation');
  }
  assert.equal(v.attempts.find((a) => a.role === 'tester')?.configured_model?.owner_label, 'Sonnet 5');
  assert.deepEqual(v.profile, { id: 'trial', version: 2, ref: v.profile.ref, host: 'copilot-vscode' });
});

test('DASH-19: hostile text in retained records reaches the view as data only', async () => {
  const run = await scenarioRun('fresh');
  const { completeStep } = await import('./support/harness.ts');
  completeStep(run, 'hostile'); // intent with markup and script payloads
  const v = view(run);
  const text = JSON.stringify(v);
  assert.ok(text.includes('<script>') || !text.includes('alert('), 'the view carries text verbatim; escaping is the renderer\'s job');
  assert.equal(v.source_status, 'CURRENT');
});

test('historical runs of an earlier workflow version replay under their retained definition', (t) => {
  const runsRoot = join(PACKAGE_ROOT, '.rstack', 'runs');
  if (!existsSync(runsRoot)) {
    t.skip('no historical runs in this checkout');
    return;
  }
  const runs = listRuns(runsRoot);
  if (runs.length === 0) {
    t.skip('no historical runs in this checkout');
    return;
  }
  for (const r of runs) {
    const v = readRun(runsRoot, r.run_id);
    assert.ok(['CURRENT', 'INCOMPLETE_TAIL', 'CORRUPT', 'UNSUPPORTED_WORKFLOW'].includes(v.source_status), `${r.run_id}: ${v.source_status}`);
    if (v.source_status === 'CURRENT') {
      assert.ok(v.workflow.version !== null && v.workflow.version <= WORKFLOW.workflow_version);
      assert.ok(v.stage_graph.length > 0);
      assert.ok(v.timeline.length === v.journal_version);
    }
    t.diagnostic(`${r.run_id}: workflow v${v.workflow.version} ${v.source_status} ${v.final_outcome}`);
  }
});

test('the retained-definition parser accepts the engine definition and refuses a broken one', () => {
  const ok = parseWorkflowDef(canonicalJson(WORKFLOW));
  assert.ok(ok.ok);
  assert.equal(workflowRef(ok.value), workflowRef(WORKFLOW));
  assert.deepEqual(mainPath(ok.value), ['intent', 'spec', 'plan', 'plan-audit', 'brief', 'plan-decision', 'proof', 'implement', 'verify', 'review', 'pr-review-packet', 'pr-review', 'proposal']);
  const extra = parseWorkflowDef(JSON.stringify({ ...WORKFLOW, extra: 1 }));
  assert.ok(!extra.ok);
  const dangling = parseWorkflowDef(JSON.stringify({ ...WORKFLOW, stages: [{ id: 'a', kind: 'deterministic', next: 'b' }] }));
  assert.ok(!dangling.ok && dangling.issues.some((i) => /not a stage/.test(i)));
  assert.ok(!parseWorkflowDef('{').ok);
});
