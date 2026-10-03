// Local adapters, deferred stubs, and the fake transport. Evidence class:
// fake-adapter tests (offline). Nothing here contacts any service.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createBitbucketProposalSink } from '../adapters/bitbucket/index.ts';
import { createFakeTransport } from '../adapters/fake-transport/index.ts';
import { createJiraRequestSource } from '../adapters/jira/index.ts';
import { driveRun } from '../core/engine/drive.ts';
import { createAssembly } from '../scripts/assembly.ts';
import { APP, PACKAGE_ROOT, PROFILE, REQUEST, cli, decision, eventTypes, newRun, tmpDir } from './support/harness.ts';

const DENY = join(PACKAGE_ROOT, 'tests', 'support', 'deny-network.ts');

function denied(workspace: string, name: string): { nodeArgs: string[]; env: NodeJS.ProcessEnv; log: () => string[] } {
  const logFile = join(workspace, name);
  writeFileSync(logFile, '');
  return {
    nodeArgs: ['--import', `file://${DENY.replaceAll('\\', '/')}`],
    env: { RSTACK_TEST_LOG: logFile },
    log: () => readFileSync(logFile, 'utf8').split('\n').filter(Boolean),
  };
}

test('STUB-1: selecting a deferred adapter returns INTEGRATION_NOT_CONFIGURED at once, with no network use and no run', () => {
  const workspace = tmpDir('stub');
  const cases: [string[], string][] = [
    [['--source', 'jira', '--request', 'ANY-1', '--app', APP], 'jira'],
    [['--sink', 'bitbucket', '--request', REQUEST, '--app', APP], 'bitbucket'],
  ];
  for (const [extra, integration] of cases) {
    const fixture = denied(workspace, `${integration}.log`);
    const r = cli(['start', '--workspace', workspace, ...extra], fixture.nodeArgs, fixture.env);
    assert.equal(r.status, 2);
    assert.equal(r.reply.ok, false);
    assert.equal(r.reply.code, 'INTEGRATION_NOT_CONFIGURED');
    assert.equal(r.reply.integration, integration);
    assert.equal(r.reply.run_id, null);
    const log = fixture.log();
    assert.ok(log.some((l) => l.includes(`/adapters/${integration}/`)), 'the stub was the code that answered');
    assert.deepEqual(log.filter((l) => l.startsWith('NETWORK')), [], 'no network attempt');
  }
  assert.ok(!existsSync(join(workspace, '.rstack')), 'no run was created');
  assert.equal(cli(['start', '--workspace', workspace, '--source', 'github', '--request', REQUEST, '--app', APP]).reply.code, 'UNKNOWN_ADAPTER');
});

test('stubs carry no service detail and fabricate nothing', () => {
  const jira = createJiraRequestSource().getSnapshot({ path: 'ANY-1' });
  const sink = createBitbucketProposalSink();
  for (const r of [jira, sink.availability(), sink.prepare({} as never, '')]) {
    assert.deepEqual(Object.keys(r).sort(), ['integration', 'reason', 'status']);
    assert.equal(r.status, 'INTEGRATION_NOT_CONFIGURED');
  }
  for (const dir of ['jira', 'bitbucket']) {
    const source = readFileSync(join(PACKAGE_ROOT, 'adapters', dir, 'index.ts'), 'utf8');
    assert.doesNotMatch(source, /https?:|fetch\(|node:(net|http|https|dns|tls)|token|password|process\.env/i);
  }
});

test('STUB-2: the normal local flow never loads or constructs a deferred adapter and makes no network attempt', async () => {
  // In a real process with network entry points denied and module loads recorded.
  const workspace = tmpDir('local-flow');
  const fixture = denied(workspace, 'local.log');
  const started = cli(['start', '--workspace', workspace, '--request', REQUEST, '--app', APP, '--profile', PROFILE], fixture.nodeArgs, fixture.env);
  assert.equal(started.reply.code, 'STARTED');
  const run = ['--workspace', workspace, '--run', started.reply.run_id as string];
  assert.equal(cli(['next', ...run], fixture.nodeArgs, fixture.env).reply.code, 'DISPATCHED');
  assert.equal(cli(['status', ...run], fixture.nodeArgs, fixture.env).reply.code, 'STATUS');
  const log = fixture.log();
  assert.ok(log.some((l) => l.includes('/adapters/local-request/')), 'the load log is working');
  assert.deepEqual(log.filter((l) => /\/adapters\/(jira|bitbucket)\//.test(l)), [], 'deferred modules never loaded');
  assert.deepEqual(log.filter((l) => l.startsWith('NETWORK')), []);

  // In process, through to the proposal, with factories that fail if touched.
  const touched: string[] = [];
  const assembly = createAssembly(tmpDir('local-flow-full'), {
    deferred: {
      jira: async () => {
        touched.push('jira');
        throw new Error('deferred adapter constructed');
      },
      bitbucket: async () => {
        touched.push('bitbucket');
        throw new Error('deferred adapter constructed');
      },
    },
  });
  const s = await assembly.start({ request: { path: REQUEST }, appDir: APP, profilePath: PROFILE, transportClass: 'SIMULATED' });
  const transport = createFakeTransport(assembly.runsRoot);
  const waiting = driveRun(assembly.engine, transport, s.run_id as string).last;
  assembly.engine.decide(s.run_id as string, decision(waiting));
  const end = driveRun(assembly.engine, transport, s.run_id as string).last;
  assert.equal(end.directive?.kind === 'DONE' && end.directive.terminal, 'PR_PROPOSAL_READY');
  assert.deepEqual(touched, []);
});

test('local request source keeps exact bytes and provenance; manual text needs an id', async () => {
  const run = await newRun('request');
  const started = JSON.parse(readFileSync(join(run.runDir, 'journal.jsonl'), 'utf8').split('\n')[0]!.slice(65)) as {
    data: { request_id: string; source_ref: string; source_provenance: { adapter: string; locator: string } };
  };
  assert.equal(started.data.request_id, 'REQ-001');
  assert.equal(started.data.source_provenance.adapter, 'local-request');
  assert.equal(started.data.source_provenance.locator, 'file:REQ-001.md', 'the locator is the file name, not a local path');
  const retained = readFileSync(join(run.runDir, 'artifacts', started.data.source_ref.slice(7)));
  assert.deepEqual(retained, readFileSync(REQUEST), 'source snapshot is byte-identical');

  const manual = await run.assembly.start({ request: { text: 'Pause exports.', request_id: 'REQ-TEXT' }, appDir: APP, profilePath: PROFILE });
  assert.equal(manual.code, 'STARTED');
  assert.equal((await run.assembly.start({ request: { text: 'no id' }, appDir: APP, profilePath: PROFILE })).code, 'MISSING_INPUT');
  assert.equal((await run.assembly.start({ request: { text: '', request_id: 'REQ-EMPTY' }, appDir: APP, profilePath: PROFILE })).code, 'EMPTY_REQUEST');
});

test('local proposal is a local record: exact references, NOT_ATTEMPTED, and no address of any kind', async () => {
  const run = await newRun('proposal');
  const { engine } = run.assembly;
  const transport = createFakeTransport(run.assembly.runsRoot);
  engine.decide(run.runId, decision(driveRun(engine, transport, run.runId).last));
  const end = driveRun(engine, transport, run.runId).last;
  assert.equal(end.code, 'PROPOSAL_READY');

  const text = readFileSync(join(run.runDir, 'proposal', 'pr-proposal.json'), 'utf8');
  const proposal = JSON.parse(text) as Record<string, any>;
  assert.equal(proposal.status, 'PR_PROPOSAL_READY');
  assert.equal(proposal.publication_status, 'NOT_ATTEMPTED');
  assert.match(proposal.base_ref, /^sha256:[0-9a-f]{64}$/, 'the base is a measured tree identity');
  assert.match(proposal.candidate_ref, /^sha256:[0-9a-f]{64}$/, 'the candidate is a measured tree identity, not a commit id');
  assert.notEqual(proposal.base_ref, proposal.candidate_ref);
  assert.deepEqual(Object.keys(proposal.evidence).sort(), ['implement', 'intent', 'plan', 'plan-audit', 'proof', 'review', 'spec']);
  assert.deepEqual(Object.keys(proposal.planning_basis).sort(), ['audit', 'brief', 'decision', 'final_plan', 'intent', 'last_audited_plan', 'spec']);
  assert.equal(proposal.evidence_class, 'SIMULATED', 'the proposal says its role results were simulated');
  assert.equal(proposal.candidate_verification, 'PASSED_LOCAL_EXECUTION');
  assert.deepEqual(proposal.evidence_classes, { role_results: 'SIMULATED', review: 'SIMULATED', test_execution: 'ACTUAL_LOCAL_EXECUTION' });
  for (const ref of [proposal.source_ref, ...Object.values(proposal.evidence), ...Object.values(proposal.planning_basis), proposal.base_ref, proposal.candidate_ref, proposal.proof, proposal.proof_tree, proposal.proof_baseline, proposal.verification, proposal.review] as string[]) {
    assert.ok(existsSync(join(run.runDir, 'artifacts', ref.slice(7))), 'every reference resolves to retained bytes');
  }
  assert.doesNotMatch(text, /https?:|pr_url|pull_request|PR_CREATED/i);
});

test('fake transport: success, negative, malformed, refusal, timeout, and repeated delivery', async () => {
  const run = await newRun('fake');
  const { engine } = run.assembly;
  const transport = createFakeTransport(run.assembly.runsRoot, {
    intent: ['malformed', 'success'],
    'plan-audit': ['refusal', 'refuted'],
    proof: ['timeout', 'repeat'],
    implement: ['success'],
  });
  const first = driveRun(engine, transport, run.runId);
  assert.deepEqual(
    first.trace.filter((t) => t.action !== 'next').map((t) => `${t.attempt_id} ${t.action} ${t.code}`),
    [
      'intent-1 submit:RESULT MALFORMED_RESULT',
      'intent-1 submit:FAILURE FAILURE_RECORDED',
      'intent-2 submit:RESULT ACCEPTED',
      'spec-1 submit:RESULT ACCEPTED',
      'plan-1 submit:RESULT ACCEPTED',
      'plan-audit-1 submit:FAILURE FAILURE_RECORDED',
      'plan-audit-2 submit:RESULT ACCEPTED',
    ],
  );
  assert.equal(first.last.directive?.kind, 'WAIT', 'a refuted audit goes to the human');
  assert.equal(readdirSync(join(run.runDir, 'rejected')).length, 1, 'the malformed reply is retained');

  engine.decide(run.runId, decision(first.last));
  const second = driveRun(engine, transport, run.runId);
  const proof = second.trace.filter((t) => t.attempt_id === 'proof-2' && t.action === 'submit:RESULT');
  assert.deepEqual(proof.map((t) => [t.code, t.duplicate]), [['ACCEPTED', false], ['ACCEPTED', true]], 'repeated delivery is deduplicated');
  assert.equal(second.last.directive?.kind, 'DONE');
  assert.equal(eventTypes(run).filter((t) => t === 'result_accepted').length, 7);
  assert.equal(eventTypes(run).filter((t) => t === 'attempt_failed').length, 3);
  assert.deepEqual(engine.status(run.runId).audit_budget, { max: 2, used: 1 }, 'a failed audit invocation does not consume the audit budget');
});
