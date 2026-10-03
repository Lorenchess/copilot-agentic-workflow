// Runtime validation of records. Evidence class: engine tests (offline).

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseDecision, parseEvent, parseProfile, parseSubmission } from '../core/contracts/records.ts';
import { WORKFLOW, dispatchRoles } from '../core/policies/workflow.ts';
import { PROFILE } from './support/harness.ts';

const roles = dispatchRoles(WORKFLOW);
const profileText = readFileSync(PROFILE, 'utf8');
const profile = (): Record<string, any> => JSON.parse(profileText);

const validResult = {
  schema_version: 1,
  record_type: 'role-result',
  run_id: 'RUN-1',
  attempt_id: 'plan-1',
  role: 'planner',
  expected_version: 2,
  input_digest: `sha256:${'a'.repeat(64)}`,
  outcome: 'COMPLETED',
  summary: 'ok',
  outputs: {},
  files: {},
};

test('trial profile is valid and keeps owner labels with unresolved selectors', () => {
  const parsed = parseProfile(profileText, roles);
  assert.ok(parsed.ok);
  const labels = Object.values(parsed.value.catalog).map((c) => c.owner_label);
  assert.deepEqual(labels.sort(), ['Luna', 'Opus 5.5', 'Sol 6.1', 'Sonnet 5', 'Terra']);
  for (const entry of Object.values(parsed.value.catalog)) {
    assert.equal(entry.host_selector, null);
    assert.equal(entry.selector_status, 'requires-host-observation');
  }
  for (const role of Object.values(parsed.value.roles)) assert.equal(role.effort_policy, 'host-default');
});

test('MODEL-1: unsupported effort, fallback, and false selector claims are rejected', () => {
  const effort = profile();
  effort.roles.planner.effort_policy = 'max';
  const r1 = parseProfile(JSON.stringify(effort), roles);
  assert.ok(!r1.ok);
  assert.match(r1.issues.join('\n'), /UNSUPPORTED_EFFORT/);

  const fallback = profile();
  fallback.fallbacks = [{ from: 'opus', to: 'sonnet' }];
  const r2 = parseProfile(JSON.stringify(fallback), roles);
  assert.ok(!r2.ok);
  assert.match(r2.issues.join('\n'), /UNSUPPORTED_FALLBACK/);

  const pinned = profile();
  pinned.catalog.opus.selector_status = 'observed';
  assert.ok(!parseProfile(JSON.stringify(pinned), roles).ok, 'null selector reported as observed');

  const unknownAlias = profile();
  unknownAlias.roles.planner.model_alias = 'unlisted';
  assert.ok(!parseProfile(JSON.stringify(unknownAlias), roles).ok);

  const missingRole = profile();
  delete missingRole.roles.reviewer;
  assert.ok(!parseProfile(JSON.stringify(missingRole), roles).ok);
});

test('unsupported schema versions are named, not treated as malformed', () => {
  const p = profile();
  p.schema_version = 2;
  const r = parseProfile(JSON.stringify(p), roles);
  assert.ok(!r.ok);
  assert.equal(r.code, 'UNSUPPORTED_SCHEMA_VERSION');
  const s = parseSubmission(JSON.stringify({ ...validResult, schema_version: 9 }));
  assert.ok(!s.ok);
  assert.equal(s.code, 'UNSUPPORTED_SCHEMA_VERSION');
});

test('submissions: malformed, unknown fields, and wrong types are rejected', () => {
  assert.ok(parseSubmission(JSON.stringify(validResult)).ok);
  const bad: unknown[] = [
    'not json',
    '[]',
    'null',
    JSON.stringify({ ...validResult, extra: 1 }),
    JSON.stringify({ ...validResult, outcome: 'APPROVED' }),
    JSON.stringify({ ...validResult, expected_version: '2' }),
    JSON.stringify({ ...validResult, expected_version: 0 }),
    JSON.stringify({ ...validResult, run_id: '../other' }),
    JSON.stringify({ ...validResult, input_digest: 'P1' }),
    JSON.stringify({ ...validResult, outputs: { ok: 5 } }),
    JSON.stringify({ ...validResult, schema_version: undefined }),
    JSON.stringify({ ...validResult, summary: '' }),
  ];
  for (const text of bad) {
    const r = parseSubmission(text as string);
    assert.ok(!r.ok, `accepted: ${String(text)}`);
    assert.equal(r.code, 'MALFORMED');
  }
});

test('decisions and events are validated the same way', () => {
  const d = {
    schema_version: 1,
    record_type: 'human-decision',
    run_id: 'RUN-1',
    decision_id: 'D1',
    expected_version: 5,
    action: 'proceed',
    subjects: { plan: `sha256:${'b'.repeat(64)}` },
    recorded_by: 'someone',
  };
  assert.ok(parseDecision(JSON.stringify(d)).ok);
  assert.ok(!parseDecision(JSON.stringify({ ...d, action: 'approve-everything' })).ok);
  assert.ok(!parseDecision(JSON.stringify({ ...d, subjects: { plan: 'latest' } })).ok);
  assert.ok(!parseDecision(JSON.stringify({ ...d, authenticated: true })).ok);

  const e = { schema_version: 1, seq: 1, run_id: 'RUN-1', type: 'run_started', at: '2026-01-01T00:00:00.000Z', data: {} };
  assert.ok(parseEvent(JSON.stringify(e)).ok);
  assert.ok(!parseEvent(JSON.stringify({ ...e, type: 'state_overwritten' })).ok);
  assert.ok(!parseEvent(JSON.stringify({ ...e, data: [] })).ok);
});
