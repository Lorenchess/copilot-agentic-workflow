// RC4: before a proposal is assembled, the engine re-establishes that every
// identity the proposal relies on still resolves to the retained bytes: the
// candidate, proof and base trees down to each file, both execution records
// and their raw output, the review, the planning basis, the accepted results,
// and the frozen source, configuration, profile, and workflow.
//
// Before RC4 the gate re-read a few top-level records only, so a candidate
// file overwritten after verification and review still reached
// PROPOSAL_READY while its tree record was unchanged.
//
// Evidence class: test executions are ACTUAL local child processes; role
// results come from the fake transport and are SIMULATED; decisions are
// SCRIPTED fixtures.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import type { ExecutionRecord, TreeManifest } from '../core/contracts/app.ts';
import type { PrProposal } from '../core/contracts/records.ts';
import type { Reply } from '../core/engine/engine.ts';
import { verifyPacket } from '../evals/verify-packet.ts';
import { type TestRun, completeStep, decision, eventTypes, journalText, newRun, toHumanWait } from './support/harness.ts';

const subjects = (run: TestRun): Record<string, string> => run.assembly.engine.status(run.runId).subjects as Record<string, string>;
const artifactPath = (run: TestRun, ref: string): string => join(run.runDir, 'artifacts', ref.replace(/^sha256:/, ''));
const json = <T>(run: TestRun, ref: string): T => JSON.parse(readFileSync(artifactPath(run, ref), 'utf8')) as T;
const leaf = (run: TestRun, treeRef: string, path: string): string => {
  const file = json<TreeManifest>(run, treeRef).files.find((f) => f.path === path);
  assert.ok(file, `${path} is in the tree`);
  return artifactPath(run, file.sha256);
};
const events = (run: TestRun): { type: string; data: Record<string, unknown> }[] =>
  journalText(run)
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line.slice(65)) as { type: string; data: Record<string, unknown> });

// A run whose candidate passed the real verification and was accepted by the
// review: the next engine step is the proposal.
async function atProposal(label: string): Promise<TestRun> {
  const run = await newRun(label);
  const { engine } = run.assembly;
  assert.equal(engine.decide(run.runId, decision(toHumanWait(run))).code, 'DECISION_RECORDED');
  completeStep(run); // proof
  completeStep(run); // implement
  assert.equal(engine.next(run.runId).code, 'VERIFICATION_PASSED');
  completeStep(run); // review
  assert.equal(engine.status(run.runId).stage, 'proposal');
  return run;
}

// The proposal step refuses, writes no proposal, records no event, and leaves the run where it was.
function assertRefused(run: TestRun, what: string): Reply {
  const { engine } = run.assembly;
  const version = engine.status(run.runId).state_version;
  const refused = engine.next(run.runId);
  assert.equal(refused.ok, false, what);
  assert.equal(refused.code, 'MISSING_INPUT', what);
  assert.ok(!existsSync(join(run.runDir, 'proposal')), `${what}: no proposal file was written`);
  assert.equal(eventTypes(run).filter((t) => t === 'proposal_recorded').length, 0, `${what}: no proposal event`);
  const status = engine.status(run.runId);
  assert.equal(status.stage, 'proposal', what);
  assert.equal(status.state_version, version, what);
  return refused;
}

// Damages one retained file, expects the refusal, and puts the bytes back.
function damage(run: TestRun, what: string, path: string, how: 'change' | 'remove', replacement?: Buffer): Reply {
  const original = readFileSync(path);
  if (how === 'remove') rmSync(path);
  else writeFileSync(path, replacement ?? Buffer.concat([original, Buffer.from('\n// changed after review\n')]));
  try {
    return assertRefused(run, `${what} (${how})`);
  } finally {
    writeFileSync(path, original);
  }
}

function assertProposalReady(run: TestRun): PrProposal {
  assert.equal(run.assembly.engine.next(run.runId).code, 'PROPOSAL_READY');
  const report = verifyPacket(run.runDir);
  assert.deepEqual(report.problems, []);
  return JSON.parse(readFileSync(join(run.runDir, 'proposal', 'pr-proposal.json'), 'utf8')) as PrProposal;
}

test('RC4 control: unchanged retained evidence reaches the proposal, and work or execution copies are not evidence', async () => {
  const run = await atProposal('rc4-control');
  // Not part of the packet: the developer's working copy and the directories the tests ran in.
  writeFileSync(join(run.runDir, 'work', 'implement-1', 'app', 'src', 'export.js'), 'export function handleExport() { return { status: 500 }; }\n');
  const execDirs = readdirSync(join(run.runDir, 'exec'));
  assert.ok(execDirs.some((d) => d.startsWith('verify-')));
  for (const dir of execDirs) rmSync(join(run.runDir, 'exec', dir), { recursive: true, force: true });
  rmSync(join(run.runDir, 'work', 'review-1'), { recursive: true, force: true });

  const proposal = assertProposalReady(run);
  assert.equal(proposal.candidate_ref, subjects(run).candidate);
});

test('RC4: a candidate file changed or substituted after review stops the proposal while its tree record is unchanged', async () => {
  const run = await atProposal('rc4-changed');
  const s = subjects(run);
  const candidateFile = leaf(run, s.candidate!, 'src/export.js');
  const manifestBefore = readFileSync(artifactPath(run, s.candidate!));

  // The audit's counterexample: the retained leaf is overwritten, the manifest is not.
  const changed = damage(run, 'candidate file', candidateFile, 'change', Buffer.from('export function handleExport() { return { status: 200 }; }\n'));
  assert.match(String(changed.message), /"src\/export\.js" of candidate does not match its identity/);
  assert.deepEqual((changed.detail as { input: string }).input, 'candidate');
  // Substituted by another retained file: the unchanged application's version of the same path.
  const baseFile = readFileSync(leaf(run, s.base!, 'src/export.js'));
  assert.notDeepEqual(baseFile, readFileSync(candidateFile), 'the candidate changed this file');
  damage(run, 'candidate file substituted by the base version', candidateFile, 'change', baseFile);

  assert.deepEqual(readFileSync(artifactPath(run, s.candidate!)), manifestBefore, 'the tree record was never touched');
  assertProposalReady(run);
});

test('RC4: a candidate file missing after review stops the proposal', async () => {
  const run = await atProposal('rc4-missing');
  const refused = damage(run, 'candidate file', leaf(run, subjects(run).candidate!, 'src/export.js'), 'remove');
  assert.match(String(refused.message), /"src\/export\.js" of candidate is missing/);
  assertProposalReady(run);
});

test('RC4: every record and file the proposal relies on is re-established before it is assembled', async () => {
  const run = await atProposal('rc4-closure');
  const s = subjects(run);
  const log = events(run);
  const started = log.find((e) => e.type === 'run_started')!.data as Record<string, string>;
  const verification = json<ExecutionRecord>(run, s.verification!);
  const baseline = json<ExecutionRecord>(run, s.proof_baseline!);
  const controlledTest = json<TreeManifest>(run, s.proof_tree!).files.find((f) => f.path.startsWith('tests/controlled/'));
  assert.ok(controlledTest, 'the proof tree holds a controlled test');
  const results = log.filter((e) => e.type === 'result_accepted').map((e) => String(e.data.result_ref));
  const decisions = log.filter((e) => e.type === 'decision_recorded').map((e) => String(e.data.decision_ref));
  assert.equal(results.length, 7, 'intent, spec, plan, audit, proof, implement, review');
  assert.equal(decisions.length, 1);

  const relied: [string, string][] = [
    // Trees, down to the file.
    ['proof tree file not in the candidate', leaf(run, s.proof_tree!, 'src/export.js')],
    ['controlled test file', artifactPath(run, controlledTest.sha256)],
    ['base tree record', artifactPath(run, s.base!)],
    ['proof tree record', artifactPath(run, s.proof_tree!)],
    ['candidate tree record', artifactPath(run, s.candidate!)],
    // Both real runs and what they printed.
    ['verification record', artifactPath(run, s.verification!)],
    ['verification output', artifactPath(run, verification.output)],
    ['baseline record', artifactPath(run, s.proof_baseline!)],
    ['baseline output', artifactPath(run, baseline.output)],
    // Proof and review.
    ['proof record', artifactPath(run, s.proof!)],
    ['review record', artifactPath(run, s.review!)],
    // Planning basis.
    ['intent', artifactPath(run, s.intent!)],
    ['specification', artifactPath(run, s.spec!)],
    ['audited plan', artifactPath(run, s.plan!)],
    ['audit', artifactPath(run, s.audit!)],
    ['brief', artifactPath(run, s.brief!)],
    ['final plan', artifactPath(run, s.final_plan!)],
    ['authorizing decision', artifactPath(run, decisions[0]!)],
    // Accepted role results the proposal lists as evidence.
    ...results.map((ref, i): [string, string] => [`accepted result ${i + 1}`, artifactPath(run, ref)]),
    // What the run was started with.
    ['request source', artifactPath(run, started.source_ref!)],
    ['application configuration', artifactPath(run, started.app_config_ref!)],
    ['profile', artifactPath(run, started.profile_ref!)],
    ['workflow definition', artifactPath(run, started.workflow_ref!)],
  ];
  for (const [what, path] of relied) {
    damage(run, what, path, 'change');
    damage(run, what, path, 'remove');
  }

  // Restored evidence permits the normal path, and the proposal names exactly what was checked.
  const proposal = assertProposalReady(run);
  assert.equal(proposal.candidate_ref, s.candidate);
  assert.equal(proposal.verification, s.verification);
  assert.equal(proposal.review, s.review);
  assert.deepEqual(Object.values(proposal.evidence).sort(), [...results].sort());
  assert.equal(proposal.planning_basis.decision, decisions[0]);
});
