// Role and coordinator instructions against the engine they describe.
// Evidence class: generated-package checks and engine tests (offline). These
// show that what the installed text tells a role or the coordinator to do is
// accepted by the real validator and the real command line. They do not show
// that a model follows the text.

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { generatePackage } from '../adapters/copilot-vscode/generate.ts';
import { type TaskEnvelope, parseSubmission } from '../core/contracts/records.ts';
import type { Reply } from '../core/engine/engine.ts';
import { WORKFLOW } from '../core/policies/workflow.ts';
import { PACKAGE_ROOT, PROFILE, type TestRun, cli, eventTypes, newRun, pendingOf, result, tmpDir } from './support/harness.ts';

const SKILLS = ['planning-records', 'application-records'];
const ROLES = ['planner', 'plan-auditor', 'tester', 'developer', 'reviewer', 'pr-reviewer'];
const RESULT_KEYS = ['schema_version', 'record_type', 'run_id', 'attempt_id', 'role', 'expected_version', 'input_digest', 'outcome', 'summary', 'outputs', 'files'];

const source = (path: string): string => readFileSync(join(PACKAGE_ROOT, path), 'utf8');

// The generated files a host would be given, read once.
const packageDir = tmpDir('protocol-package');
generatePackage({ profileText: readFileSync(PROFILE, 'utf8'), outDir: packageDir });
const generated = (path: string): string => readFileSync(join(packageDir, '.github', path), 'utf8');
const agentFile = (role: string): string => generated(`agents/rstack-sdlc-${role}.agent.md`);

// The "result.json" section of a Skill, from its heading to the next one.
function resultSection(skillText: string): string {
  const start = skillText.indexOf('## result.json');
  assert.ok(start >= 0, 'the Skill has a result.json section');
  const end = skillText.indexOf('\n## ', start + 1);
  return skillText.slice(start, end < 0 ? undefined : end);
}

function resultTemplate(skillText: string): string {
  const block = /```json\n([\s\S]*?)\n```/.exec(resultSection(skillText));
  assert.ok(block, 'the result.json section has one template');
  return block[1] as string;
}

// What a role does with the template: every "<envelope.x>" is replaced by the
// envelope's own value, and nothing else is changed.
function fill(template: string, envelope: TaskEnvelope): string {
  return template.replaceAll(/<envelope\.([a-z_]+)>/g, (_, field: string) => {
    const value = (envelope as unknown as Record<string, unknown>)[field];
    assert.notEqual(value, undefined, `the envelope has no "${field}"`);
    return typeof value === 'string' ? value : JSON.stringify(value);
  });
}

// The Skill the generated agent file for a role tells it to use.
function skillOf(role: string): string {
  const named = /Use the `(rstack-sdlc-[a-z-]+)` Skill for record formats/.exec(agentFile(role));
  assert.ok(named, `${role}: the agent file names its Skill`);
  return generated(`skills/${named[1]}/SKILL.md`);
}

function envelopeFor(stageId: string): TaskEnvelope {
  const stage = WORKFLOW.stages.find((s) => s.id === stageId);
  assert.ok(stage?.role);
  return {
    schema_version: 1,
    record_type: 'task-envelope',
    run_id: 'RUN-1',
    attempt_id: `${stageId}-1`,
    step_id: stageId,
    role: stage.role,
    state_version: 7,
    inputs: {},
    input_digest: `sha256:${'a'.repeat(64)}`,
    output_contract: 'role-result/v1',
    profile_ref: `sha256:${'b'.repeat(64)}`,
    mode: stage.mode ?? null,
    round: 1,
    work_dir: `work/${stageId}-1`,
    produces: Object.fromEntries((stage.produces ?? []).map((p) => [p.key, p.file])),
    app_dir: null,
  };
}

const roleStages = WORKFLOW.stages.filter((s) => s.kind === 'role');

test('D3: both Skills carry the same result.json section, byte for byte, in source and in the generated package', () => {
  const [planning, application] = SKILLS.map((s) => resultSection(source(`core/skills/${s}/SKILL.md`))) as [string, string];
  assert.equal(planning, application);
  assert.ok(Buffer.from(planning).equals(Buffer.from(application)));
  for (const s of SKILLS) {
    assert.equal(resultSection(generated(`skills/rstack-sdlc-${s}/SKILL.md`)), planning, `generated ${s}`);
  }
  assert.ok(planning.includes('"record_type": "role-result"') && planning.includes('"schema_version": 1'));
});

test('D3: the result the earlier role prompts described is refused by the validator', () => {
  // The fields the tester, developer, reviewer, and auditor prompts listed
  // before the repair: everything except schema_version and record_type.
  const e = envelopeFor('proof');
  const described = {
    run_id: e.run_id,
    attempt_id: e.attempt_id,
    role: e.role,
    expected_version: e.state_version,
    input_digest: e.input_digest,
    outcome: 'COMPLETED',
    summary: 'wrote the proof',
    outputs: {},
    files: { proof: 'proof.json' },
  };
  const parsed = parseSubmission(JSON.stringify(described));
  assert.equal(parsed.ok, false);
  const issues = parsed.ok ? '' : parsed.issues.join('\n');
  assert.match(issues, /schema_version/);
  assert.match(issues, /record_type/);
});

test('D3: for every role stage, the agent file plus the Skill it names yields a result the validator accepts', () => {
  assert.deepEqual([...new Set(roleStages.map((s) => s.role))].sort(), [...ROLES].sort());
  for (const stage of roleStages) {
    const role = stage.role as string;
    const text = agentFile(role);
    assert.match(text, /`result\.json` section of the (planning|application)-records Skill/, `${role}: points to the Skill contract`);
    assert.ok(!text.includes('"record_type"'), `${role}: carries no template of its own`);
    assert.ok(!/planner contract/i.test(text), `${role}: does not depend on another role's prompt`);
    assert.ok(!text.includes('NEGATIVE'), `${role}: does not use NEGATIVE`);

    const skill = skillOf(role);
    assert.match(skill, /These roles do not use `NEGATIVE`/);
    const envelope = envelopeFor(stage.id);
    const parsed = parseSubmission(fill(resultTemplate(skill), envelope));
    assert.ok(parsed.ok, `${stage.id}: ${parsed.ok ? '' : parsed.issues.join('; ')}`);
    assert.equal(parsed.value.record_type, 'role-result');
    if (parsed.value.record_type !== 'role-result') continue;
    assert.deepEqual(Object.keys(parsed.value), RESULT_KEYS);
    assert.equal(parsed.value.expected_version, envelope.state_version);

    // File keys: what the stage must deliver, and what the role text says.
    const expected = (stage.produces ?? []).map((p) => p.key).sort();
    assert.deepEqual(Object.keys(parsed.value.files).sort(), expected, `${stage.id}: file keys`);
    const stated = /`files` `(\{[^`]*\})`/.exec(text);
    if (stated) {
      assert.deepEqual(JSON.parse(stated[1] as string), envelope.produces, `${role}: the files the prompt states are the stage's`);
    } else {
      assert.equal(role, 'planner', 'only the planner, whose files differ by mode, refers to `produces` instead');
      assert.match(text, /`files` naming each file in `produces`/);
    }
  }
});

test('D3: the template has exactly the required fields, and removing any one of them is refused', () => {
  const full = JSON.parse(fill(resultTemplate(source('core/skills/planning-records/SKILL.md')), envelopeFor('plan-audit'))) as Record<string, unknown>;
  assert.deepEqual(Object.keys(full), RESULT_KEYS);
  assert.ok(parseSubmission(JSON.stringify(full)).ok);
  for (const key of RESULT_KEYS) {
    const { [key]: _removed, ...rest } = full;
    assert.equal(parseSubmission(JSON.stringify(rest)).ok, false, `without ${key}`);
  }
  assert.equal(parseSubmission(JSON.stringify({ ...full, expected_version: '7' })).ok, false, 'a version given as text');
});

test('D3: the engine accepts a result written from the template for a real envelope', async () => {
  const run = await newRun('protocol-template');
  const { engine } = run.assembly;
  const envelope = pendingOf(engine.next(run.runId));
  result(envelope); // writes the files named in `produces` into the attempt directory
  const raw = fill(resultTemplate(skillOf(envelope.role)), envelope);
  const reply = engine.submit(run.runId, raw);
  assert.equal(reply.code, 'ACCEPTED', JSON.stringify(reply));
});

// ---------------------------------------------------------------- D4

// A command line exactly as the installed coordinator shows it, with its
// placeholders filled. Only the engine launcher itself is supplied by the test.
function coordinatorCommand(name: string, values: Record<string, string>): string[] {
  const block = /```text\n([\s\S]*?)\n```/.exec(agentFile('coordinator'));
  assert.ok(block, 'the coordinator lists its commands');
  const line = (block[1] as string).split('\n').find((l) => l.startsWith(`{{ENGINE}} ${name} `));
  assert.ok(line, `the coordinator documents "${name}"`);
  const filled = line
    .replace('{{ENGINE}} ', '')
    .replaceAll(/\s+/g, ' ')
    .replace('{{WORKSPACE}}', '<workspace>')
    .replaceAll(/"<[^>]*>"|<[^>]*>/g, (placeholder) => {
      const key = Object.keys(values).find((k) => placeholder.includes(k));
      assert.ok(key, `no value for ${placeholder} in "${name}"`);
      return `\u0000${values[key] as string}\u0000`;
    });
  return filled
    .split('\u0000')
    .flatMap((part, i) => (i % 2 === 1 ? [part] : part.split(' ').filter(Boolean)));
}

function coordinator(run: TestRun, name: string, values: Record<string, string> = {}): Reply {
  return cli(coordinatorCommand(name, { workspace: run.workspace, 'run-id': run.runId, ...values })).reply;
}

// The abandon reason travels in a file the human saved; the command carries its path.
function reasonFile(run: TestRun, text: string): string {
  const path = join(run.workspace, 'abandon-reason.txt');
  writeFileSync(path, text);
  return path;
}

const blocker = (r: Reply): string | null => (r.directive?.kind === 'BLOCKED' ? r.directive.blocker : null);
const dispatched = (run: TestRun): number => eventTypes(run).filter((t) => t === 'task_dispatched').length;

// A result the engine refuses while its attempt stays pending: the shape the
// earlier prompts described. The role's files are in place.
function refusedResultFile(run: TestRun, envelope: TaskEnvelope): string {
  const { schema_version: _v, record_type: _t, ...rest } = JSON.parse(result(envelope)) as Record<string, unknown>;
  const path = join(run.runDir, envelope.work_dir, 'result.json');
  writeFileSync(path, JSON.stringify(rest));
  return path;
}

test('D4: the coordinator text gives the refusal step and the abandon rules', () => {
  const text = agentFile('coordinator');
  for (const needed of [
    '{{ENGINE}} abandon --workspace {{WORKSPACE}} --run <run-id> --attempt <attempt-id> --reason',
    '## A refused result',
    'Do not edit or resubmit it',
    'abandon attempt <attempt-id> and retry',
    'Never abandon the attempt that is pending now because of it',
    'Never run it on your own',
    'That request does not authorize new work; do not run `next`',
    'recorded as failed with its execution uncertain',
    'does not stop or revoke the earlier worker',
    'counts against the attempts the profile allows',
    'ATTEMPTS_EXHAUSTED',
    'WORKER_QUIESCENCE_UNPROVEN',
  ]) {
    assert.ok(text.includes(needed), `coordinator lacks: ${needed}`);
  }
});

test('D4: refused result, documented abandon, replacement, bounded exhaustion, and a stale late result, through the documented command lines', async () => {
  const run = await newRun('protocol-refusal', {}, 'MANUAL_TRANSPORT');
  const limit = (JSON.parse(readFileSync(PROFILE, 'utf8')) as { roles: Record<string, { max_attempts: number }> }).roles.planner?.max_attempts;
  assert.equal(limit, 2, 'the trial profile allows the planner two attempts');

  // Attempt 1 is dispatched and its result is refused.
  const granted = coordinator(run, 'next');
  assert.equal(granted.dispatch, 'GRANTED');
  const first = pendingOf(granted);
  const refused = coordinator(run, 'submit', { 'result.json': refusedResultFile(run, first) });
  assert.equal(refused.ok, false);
  assert.equal(refused.code, 'MALFORMED_RESULT');

  // The same attempt is still pending, and the run does not move by itself.
  assert.equal(pendingOf(coordinator(run, 'status')).attempt_id, first.attempt_id);
  const stuck = coordinator(run, 'next');
  assert.equal(stuck.code, 'PENDING_IN_FLIGHT');
  assert.equal(stuck.dispatch, 'IN_FLIGHT');
  assert.equal(dispatched(run), 1);

  // Abandon names one attempt. Any other id settles nothing.
  const wrong = coordinator(run, 'abandon', { 'attempt-id': 'not-the-attempt', why: reasonFile(run, 'wrong id') });
  assert.equal(wrong.code, 'NOT_PENDING');
  assert.equal(pendingOf(coordinator(run, 'status')).attempt_id, first.attempt_id);

  // A bare abandon settles the attempt and starts nothing.
  const abandoned = coordinator(run, 'abandon', { 'attempt-id': first.attempt_id, why: reasonFile(run, 'the engine refused its result; the human said to abandon it') });
  assert.equal(abandoned.code, 'FAILURE_RECORDED');
  assert.equal(abandoned.directive?.kind, 'CONTINUE');
  assert.equal(abandoned.directive?.kind === 'CONTINUE' ? abandoned.directive.pending : 'x', null, 'no attempt is pending after a bare abandon');
  assert.equal(dispatched(run), 1, 'abandon alone dispatches no replacement');
  assert.equal(eventTypes(run).at(-1), 'attempt_failed');

  // The retry is a separate, explicit `next`: a replacement with a new identity.
  const replacement = coordinator(run, 'next');
  assert.equal(replacement.dispatch, 'GRANTED');
  const second = pendingOf(replacement);
  assert.notEqual(second.attempt_id, first.attempt_id);
  assert.equal(dispatched(run), 2);

  // The first worker delivers late, now with a valid result: refused as stale,
  // and the newer attempt is untouched. The coordinator rule for this case is
  // "a different attempt is pending: report and stop", so nothing is abandoned.
  const latePath = join(run.runDir, first.work_dir, 'result.json');
  writeFileSync(latePath, result(first));
  const late = coordinator(run, 'submit', { 'result.json': latePath });
  assert.equal(late.ok, false);
  assert.equal(late.code, 'STALE_ATTEMPT');
  assert.equal(pendingOf(coordinator(run, 'status')).attempt_id, second.attempt_id);
  assert.equal(coordinator(run, 'abandon', { 'attempt-id': first.attempt_id, why: reasonFile(run, 'stale') }).code, 'NOT_PENDING');
  assert.equal(pendingOf(coordinator(run, 'status')).attempt_id, second.attempt_id, 'the newer attempt is still pending');

  // Attempt 2 is refused and abandoned as well: the profile's bound holds.
  assert.equal(coordinator(run, 'submit', { 'result.json': refusedResultFile(run, second) }).code, 'MALFORMED_RESULT');
  const exhausted = coordinator(run, 'abandon', { 'attempt-id': second.attempt_id, why: reasonFile(run, 'refused again') });
  assert.equal(exhausted.code, 'FAILURE_RECORDED');
  assert.equal(blocker(exhausted), 'ATTEMPTS_EXHAUSTED');
  const after = coordinator(run, 'next');
  assert.notEqual(after.dispatch, 'GRANTED');
  assert.equal(blocker(after), 'ATTEMPTS_EXHAUSTED');
  assert.equal(dispatched(run), limit, 'no attempt beyond the profile');
  assert.equal(coordinator(run, 'abandon', { 'attempt-id': second.attempt_id, why: reasonFile(run, 'again') }).code, 'NOT_PENDING', 'abandoning again clears nothing');
});
