// Test-sensitivity demonstration. For each critical guard, the package is
// copied to a throwaway directory under tests/.tmp/, the guard is broken in
// that copy only, and the relevant test file is run there. The run must fail
// in the named test. The live source is never modified, and every copy is
// removed as soon as its case is done.
//
//   node tests/sensitivity.ts                      every case (a full run)
//   node tests/sensitivity.ts --cases 80,81        only these cases, with the controls they depend on
//   node tests/sensitivity.ts --list               print the numbered cases and run nothing
//     [--out <dir>]          where records are kept (default tests/.tmp/sensitivity-results-<time>/; must be new or empty)
//     [--timeout-ms <n>]     limit for each test process (default 600000)
//
// What is kept, written as each case completes, so an interrupted run still
// shows what it did: run.json (source identity and the exact selection),
// cases.jsonl (one record per test process: exit status, signal, launch
// error, duration, result), <case>.stdout.txt and <case>.stderr.txt, and
// summary.json at the end.
//
// A result is only DETECTED or NOT_DETECTED when the test process ran to its
// end and reported its tests. A process that did not start, was killed, ran
// out of time, or ended without a test report is reported as that, and a
// control that did not pass makes every case that depends on it inconclusive.
// A run of selected cases is never a full sensitivity pass and says so.
// Exit code: 0 all selected cases detected, 1 otherwise, 2 the request was refused.

import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { sha256Hex } from '../core/contracts/records.ts';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COPIED = ['core', 'adapters', 'scripts', 'profiles', 'evals', 'tests', 'package.json', 'tsconfig.json'];

interface Mutation {
  guard: string;
  file: string;
  find: string;
  replace: string;
  testFile: string;
  expectFailing: string;
}

const MUTATIONS: Mutation[] = [
  {
    guard: 'evaluation must leave the run evidence unchanged',
    file: 'evals/evaluation.ts',
    find: "if (after.digest !== request.evidence.digest) issues.push('the run evidence changed between preparation and acceptance');",
    replace: '',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'an evaluation writes only in its own area and leaves the evidence unchanged; otherwise it is rejected',
  },
  {
    guard: 'judge answers must come from the rubric vocabulary',
    file: 'evals/evaluation.ts',
    find: 'asOneOf(item.answer, `${p}.answer`, rubric.answers, issues);',
    replace: '',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'judge output: malformed, incomplete, or mismatched evaluations are rejected by the contract',
  },
  {
    guard: 'a new evaluation never reuses an existing identity',
    file: 'evals/evaluation.ts',
    find: 'if (existsSync(dir) || existsSync(control)) throw new Error(`evaluation "${id}" already exists; a new evaluation needs a new id`);',
    replace: '',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 're-evaluation gets a new identity and leaves earlier evaluations byte-identical',
  },
  {
    guard: 'adjudication refuses a judge output changed after acceptance',
    file: 'evals/evaluation.ts',
    find: "if (sha256Hex(readFileSync(join(dir, 'evaluation.json'))) !== acceptance.evaluation_sha256) throw new Error('evaluation.json changed after it was accepted');",
    replace: '',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'human adjudication is appended beside the judgment and never overwrites it',
  },
  {
    guard: 'the same run imported twice is counted once',
    file: 'evals/summary.ts',
    find: 'const key = report.run_id ? `${report.run_id}:${report.run_fingerprint}` : `unreadable:${index}`;',
    replace: 'const key = `copy:${index}`;',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'cross-run summary: denominators, explicit rubric selection, no double counting, and nothing unknown counted as pass or zero',
  },
  {
    guard: 'scripted adjudications are not counted as human calibration',
    file: 'evals/summary.ts',
    find: "const human = adjudications.filter((a) => a.provenance === 'HUMAN_RECORDED');",
    replace: 'const human = adjudications;',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'cross-run summary: denominators, explicit rubric selection, no double counting, and nothing unknown counted as pass or zero',
  },
  {
    guard: 'only evaluations accepted under the selected rubric are aggregated',
    file: 'evals/summary.ts',
    find: "const accepted = evaluations.filter((e) => e.status === 'ACCEPTED' && e.rubric === rubricId);",
    replace: 'const accepted = evaluations.filter((e) => e.evaluation !== null);',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'cross-run summary: denominators, explicit rubric selection, no double counting, and nothing unknown counted as pass or zero',
  },
  {
    guard: 'unsupported record formats are not interpreted',
    file: 'evals/deterministic.ts',
    find: 'if (version === null || !SUPPORTED_WORKFLOW_VERSIONS.includes(version)) {',
    replace: 'if (false) {',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'a run in a record format the evaluator does not interpret is reported as such, not failed',
  },
  {
    guard: 'a passing already-satisfied test is not reported as sensitive',
    file: 'evals/deterministic.ts',
    find: "sensitivity: c.route === 'RED_GREEN' ? 'DEMONSTRATED' : 'NOT_DEMONSTRATED',",
    replace: "sensitivity: 'DEMONSTRATED',",
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'a valid packet is not falsely rejected, and its evidence classes stay separate',
  },
  {
    guard: 'a scripted decision is not reported as human-observed',
    file: 'evals/deterministic.ts',
    find: "human_observed: provenance === 'SCRIPTED' ? 'NO' : provenance === 'HUMAN_RECORDED' ? 'UNVERIFIED_CLAIM' : 'UNKNOWN',",
    replace: "human_observed: 'UNVERIFIED_CLAIM',",
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'a valid packet is not falsely rejected, and its evidence classes stay separate',
  },
  {
    guard: 'a proof that passes without the change is refused',
    file: 'core/engine/execution.ts',
    find: "if (!results.some((r) => r.status === 'FAIL' && r.failure_kind === 'ASSERTION')) {",
    replace: 'if (false) {',
    testFile: 'tests/proof.test.ts',
    expectFailing: 'inadequate proofs are refused on the evidence of the real run, without a transition',
  },
  {
    guard: 'a load or compile failure is not a behavioral red',
    file: 'core/engine/execution.ts',
    find: "if (t.failure_kind === 'LOAD') issues.push(",
    replace: 'if (false) issues.push(',
    testFile: 'tests/proof.test.ts',
    expectFailing: 'inadequate proofs are refused on the evidence of the real run, without a transition',
  },
  {
    guard: 'tester write boundary',
    file: 'core/engine/engine.ts',
    find: "    if (outside.length > 0) {\n      return { code: 'WRITE_BOUNDARY_VIOLATION', detail: { reason: 'the proof stage may only write controlled tests', paths: outside } };\n    }",
    replace: '    void outside;',
    testFile: 'tests/proof.test.ts',
    expectFailing: 'the tester may write controlled tests only',
  },
  {
    guard: 'developer cannot change controlled tests or protected files',
    file: 'core/engine/engine.ts',
    find: 'const forbidden = changed.filter((p) => isUnder(p, config.controlled_tests_dir) || config.protected.includes(p));',
    replace: 'const forbidden = changed.filter(() => false);',
    testFile: 'tests/proof.test.ts',
    expectFailing: 'the developer cannot weaken the controlled proof or change how it is run',
  },
  {
    guard: 'verification runs the retained candidate, not a writable directory',
    file: 'core/engine/engine.ts',
    find: '    materializeTree(runDir, treeName, treeRef, dir);\n    const outcome = executor.run({ cwd: dir,',
    replace: "    materializeTree(runDir, treeName, treeRef, dir);\n    const live = purpose === 'CANDIDATE_VERIFICATION' ? join(runDir, 'work', `implement-${state.attempts.implement}`, 'app') : dir;\n    const outcome = executor.run({ cwd: live,",
    testFile: 'tests/proof.test.ts',
    expectFailing: 'delayed worker: an abandoned attempt that writes or returns later cannot contaminate the accepted candidate',
  },
  {
    guard: 'a failed verification is not accepted as a candidate',
    file: 'core/engine/execution.ts',
    find: "  return issues.length > 0 ? { outcome: 'FAIL', issues } : { outcome: 'PASS', issues: [] };",
    replace: "  return { outcome: 'PASS', issues: [] };",
    testFile: 'tests/proof.test.ts',
    expectFailing: 'a candidate that fails the real verification goes back with the record; rounds are bounded',
  },
  {
    guard: 'stale verification is invalidated before a proposal',
    file: 'core/engine/engine.ts',
    find: 'if (canonicalJson(environment) === canonicalJson(verification.environment) && verification.tree === state.subjects.candidate) return null;',
    replace: 'if (true) return null;',
    testFile: 'tests/proof.test.ts',
    expectFailing: 'REVIEW-1: when what the verification relied on changes, the verification and the review are established again',
  },
  {
    guard: 'review must name the exact candidate',
    file: 'core/contracts/app.ts',
    find: 'issues.list.push(`review.subject.${key}: is not the ${key} this review was given`);',
    replace: '',
    testFile: 'tests/proof.test.ts',
    expectFailing: 'a review counts only for the exact candidate and verification it names, and only ACCEPT leads to a proposal',
  },
  {
    guard: 'only an accepting review leads to a proposal',
    file: 'core/engine/state.ts',
    find: "if (verdict !== 'ACCEPT') {",
    replace: 'if (false) {',
    testFile: 'tests/proof.test.ts',
    expectFailing: 'a review counts only for the exact candidate and verification it names, and only ACCEPT leads to a proposal',
  },
  {
    guard: 'retained tree bytes are checked against their identity before use',
    file: 'core/engine/engine.ts',
    find: '    if (sha256Hex(bytes) !== sha256) throw new EngineBlock(\'MISSING_INPUT\', `retained file "${path}" of ${name} does not match its identity`, { input: name });',
    replace: '',
    testFile: 'tests/proof.test.ts',
    expectFailing: 'retained candidate bytes that no longer match their identity stop verification and the proposal',
  },
  {
    guard: 'no replacement beside a possibly live worker on a shared write target',
    file: 'core/engine/state.ts',
    find: "if (kind === 'EXECUTION_UNCERTAIN' && stage.shared_write_target) {",
    replace: 'if (false) {',
    testFile: 'tests/evidence.test.ts',
    expectFailing: 'abandoning an attempt on a stage with a shared write target blocks the run instead of dispatching a replacement',
  },
  {
    guard: 'missing provenance is never treated as human',
    file: 'core/engine/engine.ts',
    find: "const provenance: DecisionProvenance = decision.provenance ?? 'UNKNOWN';",
    replace: "const provenance: DecisionProvenance = decision.provenance ?? 'HUMAN_RECORDED';",
    testFile: 'tests/evidence.test.ts',
    expectFailing: 'a decision with no provenance is recorded as UNKNOWN, never as human',
  },
  {
    guard: 'scripted decision refused outside a simulated run (engine and replay)',
    file: 'core/engine/state.ts',
    find: "if (state.transport_class !== 'SIMULATED' && provenance !== 'HUMAN_RECORDED') {\n        corrupt(event, `a ${provenance} decision cannot stand in a run that is not simulated`);\n      }",
    replace: '',
    testFile: 'tests/evidence.test.ts',
    expectFailing: 'a journal that records a scripted decision in a run that is not simulated is refused on replay',
  },
  {
    guard: 'scripted decision refused outside a simulated run (decide)',
    file: 'core/engine/engine.ts',
    find: "if (state.transport_class !== 'SIMULATED' && provenance !== 'HUMAN_RECORDED') {\n        return reject(",
    replace: 'if (false) {\n        return reject(',
    testFile: 'tests/evidence.test.ts',
    expectFailing: 'outside a simulated run, scripted or unstated decisions are refused for every action',
  },
  {
    guard: 'HOLDS needs examined coverage',
    file: 'core/contracts/planning.ts',
    find: "if (verdict === 'HOLDS' && checked === 0) {",
    replace: 'if (false) {',
    testFile: 'tests/evidence.test.ts',
    expectFailing: 'audit coverage: objective inconsistencies are refused; an honest "nothing examined" is accepted as INCONCLUSIVE',
  },
  {
    guard: 'workflow definition retained in the run',
    file: 'core/engine/engine.ts',
    find: 'workflow_ref: writeArtifact(runDir, canonicalJson(workflow)),',
    replace: 'workflow_ref: wfRef,',
    testFile: 'tests/evidence.test.ts',
    expectFailing: 'the review packet alone resolves the workflow, the profile, every reference, and unsuccessful attempts',
  },
  {
    guard: 'final plan and proposal link the authorizing decision',
    file: 'core/contracts/planning.ts',
    find: '    decision: input.decision_ref,',
    replace: '    decision: input.brief_ref,',
    testFile: 'tests/evidence.test.ts',
    expectFailing: 'decision provenance survives replay, snapshot rebuilding, finalization, and the proposal',
  },
  {
    guard: 'only the granted dispatcher invokes the transport',
    file: 'core/engine/drive.ts',
    find: "if (last.dispatch !== 'GRANTED') return { last, trace, stopped: 'IN_FLIGHT' };",
    replace: '',
    testFile: 'tests/dispatch.test.ts',
    expectFailing: 'two cooperating driver processes never both invoke the transport for one attempt',
  },
  {
    guard: 'human wait after an agreeing audit (no work handed out while waiting)',
    file: 'core/engine/engine.ts',
    find: "if (directiveOf(state).kind !== 'CONTINUE') return reply(ctx, true, 'NO_WORK');",
    replace: "if (state.phase === 'WAITING_HUMAN') { commit(ctx, 'decision_recorded', { decision_id: 'AUTO', decision_digest: state.subjects.plan, decision_ref: state.subjects.plan, action: 'proceed', subjects: {}, recorded_by: 'engine', final_plan_ref: state.subjects.plan, plan_status: 'AS_AUDITED' }); }\n      if (directiveOf(ctx.state).kind !== 'CONTINUE') return reply(ctx, true, 'NO_WORK');",
    testFile: 'tests/planning.test.ts',
    expectFailing: 'PLAN-2: an agreeing audit still ends at a human wait; the brief is rendered only after the audit',
  },
  {
    guard: 'no third audit',
    file: 'core/policies/workflow.ts',
    find: 'if (round === 1 && auditsUsed < workflow.audit_budget_max)',
    replace: 'if (auditsUsed < 99)',
    testFile: 'tests/planning.test.ts',
    expectFailing: 'PLAN-4: a second audit happens only on request, uses a fresh view, ends at a human wait, and there is no third',
  },
  {
    guard: 'second auditor is not given the earlier audit',
    file: 'core/policies/workflow.ts',
    find: "inputs: ['source', 'intent', 'spec', 'plan'],\n      produces: [{ key: 'audit'",
    replace: "inputs: ['source', 'intent', 'spec', 'plan', 'prior_audit?'],\n      produces: [{ key: 'audit'",
    testFile: 'tests/planning.test.ts',
    expectFailing: 'PLAN-4: a second audit happens only on request, uses a fresh view, ends at a human wait, and there is no third',
  },
  {
    guard: 'amended plan is not labelled as audited',
    file: 'core/contracts/planning.ts',
    find: "plan_status: input.amendments.length > 0 ? 'AMENDED_NOT_REAUDITED' : 'AS_AUDITED',",
    replace: "plan_status: 'AS_AUDITED',",
    testFile: 'tests/planning.test.ts',
    expectFailing: 'PLAN-3: a refuted plan authorized with exact amendments keeps its verdict and is not presented as re-audited',
  },
  {
    guard: 'stale decision subject rejection',
    file: 'core/engine/engine.ts',
    find: "if (canonicalJson(decision.subjects) !== canonicalJson(shown)) return reject('STALE_DECISION_SUBJECT');",
    replace: '',
    testFile: 'tests/planning.test.ts',
    expectFailing: 'PLAN-5: a decision whose basis changed is rejected',
  },
  {
    guard: 'retained record identity check at decision time',
    file: 'core/engine/engine.ts',
    find: '    if (refOf(bytes) !== ref) {\n      throw new EngineBlock(\'MISSING_INPUT\', `retained record "${name}" does not match its identity`, { input: name, ref });\n    }',
    replace: '',
    testFile: 'tests/planning.test.ts',
    expectFailing: 'PLAN-5: a decision whose basis changed is rejected',
  },
  {
    guard: 'open product decision blocks the specification',
    file: 'core/engine/state.ts',
    find: "if (stage.id === 'intent' && event.data.open_decisions === true) {",
    replace: 'if (false) {',
    testFile: 'tests/planning.test.ts',
    expectFailing: 'PLAN-1: an open product decision goes to the human; no specification is written until it is answered',
  },
  {
    guard: 'audit must name the plan it was given',
    file: 'core/contracts/planning.ts',
    find: "issues.list.push('audit.subject.plan: is not the plan this audit was given');",
    replace: '',
    testFile: 'tests/planning.test.ts',
    expectFailing: 'records that break their contract are refused without a transition',
  },
  {
    guard: 'HTML escaping of role content',
    file: 'core/engine/brief.ts',
    find: ".replaceAll('<', '&lt;')",
    replace: '',
    testFile: 'tests/planning.test.ts',
    expectFailing: 'the brief escapes every role-supplied value and contains nothing executable',
  },
  {
    guard: 'simulated transport refused by a run of another class',
    file: 'core/engine/drive.ts',
    find: "if (status.transport_class !== transport.evidence_class) return { last: status, trace, stopped: 'TRANSPORT_CLASS_MISMATCH' };",
    replace: '',
    testFile: 'tests/planning.test.ts',
    expectFailing: 'a run that is not simulated refuses simulated results from the driver',
  },
  {
    guard: 'path text containment (traversal)',
    file: 'core/engine/containment.ts',
    find: 'if (!SEGMENT.test(segment) || segment.includes(\'..\')) return { ok: false, reason: `path segment "${segment}" is not allowed` };',
    replace: '',
    testFile: 'tests/containment.test.ts',
    expectFailing: 'traversal and non-relative paths are refused by their text alone',
  },
  {
    guard: 'link and junction refusal',
    file: 'core/engine/containment.ts',
    find: 'if (stat.isSymbolicLink()) return { ok: false, reason: `"${segments.slice(0, i + 1).join(\'/\')}" is a link` };',
    replace: '',
    testFile: 'tests/containment.test.ts',
    expectFailing: 'a Windows junction or directory link inside the attempt directory is refused',
  },
  {
    guard: 'unobserved selector never written as a pinned model',
    file: 'adapters/copilot-vscode/generate.ts',
    find: 'const selector = WRITTEN_SELECTOR_STATUSES.includes(entry.selector_status) ? entry.host_selector : null;',
    replace: 'const selector = entry.host_selector ?? entry.owner_label;',
    testFile: 'tests/package.test.ts',
    expectFailing: 'MODEL-1: an unobserved selector is never written as a pinned model, and no effort key exists',
  },
  {
    guard: 'generator write scope',
    file: 'adapters/copilot-vscode/generate.ts',
    find: '  if (!outDir.startsWith(PACKAGE_ROOT + sep)) {\n    throw new Error(`refusing to generate outside the package: ${outDir}`);\n  }',
    replace: '  if (!outDir.startsWith(PACKAGE_ROOT + sep)) return {} as PackageManifest;',
    testFile: 'tests/package.test.ts',
    expectFailing: 'SCOPE-1: the generator refuses to write outside the package or into its sources',
  },
  {
    guard: 'conflicting duplicate rejection',
    file: 'core/engine/engine.ts',
    find: "if (log.digest !== digest) return reject('CONFLICTING_DUPLICATE', { attempt_status: log.status });",
    replace: '',
    testFile: 'tests/engine.test.ts',
    expectFailing: 'identical retry returns the original outcome; a conflicting duplicate is rejected',
  },
  {
    guard: 'result bound to its input identity',
    file: 'core/engine/engine.ts',
    find: "if (sub.input_digest !== pending.input_digest) return reject('INPUT_MISMATCH');",
    replace: '',
    testFile: 'tests/engine.test.ts',
    expectFailing: 'CORE-1: a result for another run, role, or input version is rejected without a transition',
  },
  {
    guard: 'expected-version check on decisions',
    file: 'core/engine/engine.ts',
    find: 'if (decision.expected_version !== state.version) {',
    replace: 'if (false) {',
    testFile: 'tests/engine.test.ts',
    expectFailing: 'human decision: stale subject and stale version are rejected; reject ends the run',
  },
  {
    guard: 'one pending attempt per step slot',
    file: 'core/engine/engine.ts',
    find: "if (state.pending) return reply(ctx, true, 'PENDING_IN_FLIGHT', { dispatch: 'IN_FLIGHT' });",
    replace: '',
    testFile: 'tests/engine.test.ts',
    expectFailing: 'next and resume preserve the pending attempt instead of creating another',
  },
  {
    guard: 'journal record checksum',
    file: 'core/engine/journal.ts',
    find: 'if (sha256Hex(payload) !== hash) {',
    replace: 'if (false) {',
    testFile: 'tests/persistence.test.ts',
    expectFailing: 'a corrupt complete record blocks every operation and is never skipped or repaired',
  },
  {
    guard: 'replay consistency check on events',
    file: 'core/engine/state.ts',
    find: "if (state.phase !== 'ACTIVE' || stage.id !== 'proposal') corrupt(event, 'no proposal allowed here');",
    replace: '',
    testFile: 'tests/persistence.test.ts',
    expectFailing: 'a corrupt complete record blocks every operation and is never skipped or repaired',
  },
  {
    guard: 'incomplete tail detection and preservation',
    file: 'core/engine/journal.ts',
    find: 'const tail = completeBytes < bytes.length ? bytes.subarray(completeBytes) : null;',
    replace: 'const tail = null as Uint8Array | null;',
    testFile: 'tests/persistence.test.ts',
    expectFailing: 'incomplete trailing bytes are reported, preserved, then removed; they are never applied',
  },
  {
    guard: 'snapshot is never trusted over the journal',
    file: 'core/engine/engine.ts',
    find: 'const { state, tailBytes, events } = loadState(runDir, runId, false);',
    replace:
      "const loaded = loadState(runDir, runId, false); const { tailBytes, events } = loaded; let state = loaded.state; try { state = JSON.parse(readFileSync(join(runDir, SNAPSHOT_FILE), 'utf8')) as RunState; } catch { /* keep */ }",
    testFile: 'tests/persistence.test.ts',
    expectFailing: 'the snapshot is derived: missing, stale, or edited snapshots never change the state',
  },
  {
    guard: 'live lock holder is respected regardless of age',
    file: 'core/engine/lock.ts',
    find: "process.kill(holder.pid, 0);\n    return 'ALIVE';",
    replace: "process.kill(holder.pid, 0);\n    return 'DEAD';",
    testFile: 'tests/concurrency.test.ts',
    expectFailing: 'a lock held by a running process is respected however old it is; waiting is bounded',
  },
  {
    guard: 'uncertain lock holder is not reclaimed',
    file: 'core/engine/lock.ts',
    find: "if (holder.host !== hostname()) return 'UNKNOWN';",
    replace: "if (holder.host !== hostname()) return 'DEAD';",
    testFile: 'tests/concurrency.test.ts',
    expectFailing: 'an uncertain lock is never reclaimed: unreadable content, another host, unfinished takeover',
  },
  {
    guard: 'exclusive writer lock',
    file: 'core/engine/engine.ts',
    find: 'const lock = acquireLock(runDir, lockTimeoutMs, now);\n      try {\n        const { state, recovered } = loadState(runDir, runId, true);',
    replace:
      'const lock = { reclaimed: null, release() {} } as HeldLock; void acquireLock;\n      try {\n        const { state, recovered } = loadState(runDir, runId, true);',
    testFile: 'tests/concurrency.test.ts',
    expectFailing: 'a lock held by a running process is respected however old it is; waiting is bounded',
  },
  {
    guard: 'deferred sink refuses at selection',
    file: 'scripts/assembly.ts',
    find: "if (availability.status !== 'AVAILABLE') return refusal(availability.status, { ...availability });",
    replace: 'void availability;',
    testFile: 'tests/adapters.test.ts',
    expectFailing: 'STUB-1: selecting a deferred adapter returns INTEGRATION_NOT_CONFIGURED at once, with no network use and no run',
  },
  {
    guard: 'deferred adapters are not loaded in the local flow',
    file: 'scripts/assembly.ts',
    find: "import { createLocalRequestSource } from '../adapters/local-request/index.ts';",
    replace: "import { createLocalRequestSource } from '../adapters/local-request/index.ts';\nimport '../adapters/jira/index.ts';",
    testFile: 'tests/adapters.test.ts',
    expectFailing: 'STUB-2: the normal local flow never loads or constructs a deferred adapter and makes no network attempt',
  },
  {
    guard: 'core does not import adapters',
    file: 'core/engine/drive.ts',
    find: "import type { RoleTransport } from '../contracts/ports.ts';",
    replace: "import type { RoleTransport } from '../contracts/ports.ts';\nimport '../../adapters/fake-transport/index.ts';",
    testFile: 'tests/architecture.test.ts',
    expectFailing: 'core imports only node built-ins and other core files',
  },
  {
    guard: 'judge answers: only applicable answers form the denominator',
    file: 'evals/summary.ts',
    find: 'const denominator = answers.filter((a) => APPLICABLE.includes(a)).length;',
    replace: 'const denominator = answers.length;',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'summary: applicable denominators, no rate without applicable cases, and one owner decision per case',
  },
  {
    guard: 'owner adjudication: one decision per case, the latest entry',
    file: 'evals/summary.ts',
    find: '${a.evaluation_sha256}:${a.question}`;',
    replace: '${a.evaluation_sha256}:${a.question}:${a.seq}`;',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'summary: applicable denominators, no rate without applicable cases, and one owner decision per case',
  },
  {
    guard: 'a retired instruction is not written into any agent',
    file: 'adapters/copilot-vscode/generate.ts',
    find: ".filter((i) => i.status === 'active' && i.roles.includes(agent.role))",
    replace: '.filter((i) => i.roles.includes(agent.role))',
    testFile: 'tests/extension.test.ts',
    expectFailing: 'a retired instruction leaves the package while every required instruction stays',
  },
  {
    guard: 'retired text still present in an emitted file stops generation',
    file: 'adapters/copilot-vscode/generate.ts',
    find: 'if (content.includes(retired.text.trim())) {',
    replace: 'if (false) {',
    testFile: 'tests/extension.test.ts',
    expectFailing: 'extensions cannot weaken the package: unsupported versions, unknown fields, required Skills, and escaping sources are refused',
  },
  {
    guard: 'an extension cannot carry tools or a model',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "const e = asObject(entry, p, ['id', 'source', 'description', 'roles'], [], issues);",
    replace: "const e = asObject(entry, p, ['id', 'source', 'description', 'roles'], ['tools', 'model'], issues);",
    testFile: 'tests/extension.test.ts',
    expectFailing: 'extensions cannot weaken the package: unsupported versions, unknown fields, required Skills, and escaping sources are refused',
  },
  {
    guard: 'the generator refuses a profile the contract rejects',
    file: 'adapters/copilot-vscode/generate.ts',
    find: 'if (!parsedProfile.ok) {',
    replace: 'if (false) {',
    testFile: 'tests/extension.test.ts',
    expectFailing: 'MODEL-1: unsupported profile settings and versions are refused by name, by the engine and by the generator',
  },
  {
    guard: 'installation is a dry run unless a caller asks to apply',
    file: 'adapters/copilot-vscode/install.ts',
    find: 'const dryRun = options.dryRun ?? true;',
    replace: 'const dryRun = options.dryRun ?? false;',
    testFile: 'tests/install.test.ts',
    expectFailing: 'a dry run reports the plan and writes nothing; applying it writes only owned paths',
  },
  {
    guard: 'the installed engine command is an absolute path into the package',
    file: 'adapters/copilot-vscode/install.ts',
    find: 'ENGINE: `node "${forward(join(packageDir, ...manifest.engine.entry.split(\'/\')))}"`,',
    replace: 'ENGINE: `node "${manifest.engine.entry}"`,',
    testFile: 'tests/install.test.ts',
    expectFailing: 'a dry run reports the plan and writes nothing; applying it writes only owned paths',
  },
  {
    guard: 'a file the installer did not install is a collision, not a target',
    file: 'adapters/copilot-vscode/install.ts',
    find: "actions.push({ path: file.path, action: 'COLLISION', detail: identical ? 'an identical file this installer did not install exists at an owned path; it is not adopted' : 'a file this installer did not install exists at an owned path' });",
    replace: "actions.push({ path: file.path, action: 'UPDATE', detail: 'x' }); writes.push({ path: file.path, full, content });",
    testFile: 'tests/install.test.ts',
    expectFailing: 'PACKAGE-1: a file the installer did not install is never overwritten',
  },
  {
    guard: 'an unmanaged file with identical bytes is a collision, never adopted',
    file: 'adapters/copilot-vscode/install.ts',
    find: 'const identical = hashOf(full) === next;',
    replace: "const identical = hashOf(full) === next; if (identical) { actions.push({ path: file.path, action: 'UNCHANGED', detail: 'x' }); continue; }",
    testFile: 'tests/install.test.ts',
    expectFailing: 'PACKAGE-1: a file the installer did not install is never overwritten',
  },
  {
    guard: 'the install manifest package object is validated before it is used',
    file: 'adapters/copilot-vscode/install.ts',
    find: "if (!isRecord(pkg)) throw malformed('package');",
    replace: '',
    testFile: 'tests/install.test.ts',
    expectFailing: 'a malformed install manifest is refused by name before it is used, and nothing is changed',
  },
  {
    guard: 'a removed Skill directory is recreated before its file is restored',
    file: 'adapters/copilot-vscode/install.ts',
    find: 'run: () => mkdirSync(dir) });',
    replace: 'run: () => {} });',
    testFile: 'tests/install.test.ts',
    expectFailing: 'a failed update that removes a Skill restores it, and an undo step that fails is reported, not hidden',
  },
  {
    guard: 'an undo step that fails is reported, not claimed as a complete rollback',
    file: 'adapters/copilot-vscode/install.ts',
    find: 'if (notUndone.length > 0) {',
    replace: 'if (false) {',
    testFile: 'tests/install.test.ts',
    expectFailing: 'a failed update that removes a Skill restores it, and an undo step that fails is reported, not hidden',
  },
  {
    guard: 'an existing manifest temporary file is a collision, never overwritten or removed',
    file: 'adapters/copilot-vscode/install.ts',
    find: 'if (existsSync(assertContained(workspace, manifestTmp))) {',
    replace: 'if (false) {',
    testFile: 'tests/install.test.ts',
    expectFailing: 'an existing file where the manifest is written through is a collision: it is never overwritten or removed',
  },
  {
    guard: 'the undo of a write is registered before the write',
    file: 'adapters/copilot-vscode/install.ts',
    find: "undo.push(fileUndo(`${INSTALL_MANIFEST}.tmp`, `${manifestFull}.tmp`, null, ''));",
    replace: '',
    testFile: 'tests/install.test.ts',
    expectFailing: 'a write that fails part-way leaves no partial file behind',
  },
  {
    guard: 'an installed file changed by the user stops a reinstall',
    file: 'adapters/copilot-vscode/install.ts',
    find: '} else if (hashOf(full) !== prior.sha256) {',
    replace: '} else if (false) {',
    testFile: 'tests/install.test.ts',
    expectFailing: 'drift: a file changed after installation is detected, never overwritten, and kept on removal',
  },
  {
    guard: 'removal keeps a file changed after installation',
    file: 'adapters/copilot-vscode/install.ts',
    find: "else if (hashOf(full) !== file.sha256) actions.push({ path: file.path, action: 'PRESERVED_USER_MODIFIED', detail: 'changed after installation; kept' });",
    replace: '',
    testFile: 'tests/install.test.ts',
    expectFailing: 'drift: a file changed after installation is detected, never overwritten, and kept on removal',
  },
  {
    guard: 'an install manifest may name only owned paths',
    file: 'adapters/copilot-vscode/install.ts',
    find: "if (typeof file.path !== 'string' || !OWNED_FILE.test(file.path) || typeof file.sha256 !== 'string') {",
    replace: 'if (false) {',
    testFile: 'tests/install.test.ts',
    expectFailing: 'SECURITY-2: unsafe destinations and manifest paths cannot leave the workspace',
  },
  {
    guard: 'a target that resolves outside the workspace is refused',
    file: 'adapters/copilot-vscode/install.ts',
    find: 'if (!under(root, realpathSync(existing))) {',
    replace: 'if (false) {',
    testFile: 'tests/install.test.ts',
    expectFailing: 'SECURITY-2: unsafe destinations and manifest paths cannot leave the workspace',
  },
  {
    guard: 'a workspace that contains the package is refused',
    file: 'adapters/copilot-vscode/install.ts',
    find: 'if (packageDir && under(realpathSync(workspace), realpathSync(packageDir))) {',
    replace: 'if (false) {',
    testFile: 'tests/install.test.ts',
    expectFailing: 'SECURITY-2: unsafe destinations and manifest paths cannot leave the workspace',
  },
  {
    guard: 'a package file that differs from its manifest is refused',
    file: 'adapters/copilot-vscode/install.ts',
    find: "return sha256Hex(readFileSync(full)) === file.sha256 ? 'OK' : 'MODIFIED';",
    replace: "return 'OK';",
    testFile: 'tests/install.test.ts',
    expectFailing: 'SECURITY-2: unsafe destinations and manifest paths cannot leave the workspace',
  },
  {
    guard: 'a package may install only owned paths',
    file: 'adapters/copilot-vscode/install.ts',
    find: "if (file.path.startsWith('.github/') && !OWNED_FILE.test(file.path)) {",
    replace: 'if (false) {',
    testFile: 'tests/install.test.ts',
    expectFailing: 'SECURITY-2: unsafe destinations and manifest paths cannot leave the workspace',
  },
  {
    guard: 'a failed installation undoes its changes',
    file: 'adapters/copilot-vscode/install.ts',
    find: 'for (const step of undo.reverse()) {',
    replace: 'for (const step of [] as UndoStep[]) {',
    testFile: 'tests/install.test.ts',
    expectFailing: 'a failed installation is undone: no partial install and no lost user content',
  },
  {
    guard: 'a deferred integration missing from an installation is an explicit refusal',
    file: 'scripts/assembly.ts',
    find: "if ((e as NodeJS.ErrnoException).code !== 'ERR_MODULE_NOT_FOUND') throw e;",
    replace: 'throw e;',
    testFile: 'tests/portable.test.ts',
    expectFailing: 'the installed engine runs a whole lifecycle from an unrelated directory, resolving only through the relocated package',
  },
  {
    guard: 'write-scope violation detection',
    file: 'scripts/check-scope.ts',
    find: '!p.startsWith(PACKAGE_PREFIX) && !allowed.includes(p)',
    replace: "p.startsWith('.github/') && !allowed.includes(p)",
    testFile: 'tests/architecture.test.ts',
    expectFailing: 'SCOPE-1: a path outside the package is a violation unless exactly allowed',
  },
  // ---- R2 (review findings D6 and D7): evaluation control area, accepted content, deterministic selection.
  {
    guard: 'D6: control files are never read from the judge area',
    file: 'evals/evaluation.ts',
    find: "return existsSync(control) ? { dir, control, layout: 'SEPARATE' } : { dir, control: dir, layout: 'COLOCATED' };",
    replace: "return { dir, control: dir, layout: 'COLOCATED' };",
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated',
  },
  {
    guard: 'D6: a judge area holding anything but the judge output rejects the evaluation',
    file: 'evals/evaluation.ts',
    find: '  for (const name of namesIn(dir)) if (name !== JUDGE_FILE) issues.push(`unexpected file in the evaluation area: ${name}`);\n  // Before the first verdict',
    replace: '  // Before the first verdict',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated',
  },
  {
    guard: 'D6: a control area changed before the first verdict rejects the evaluation',
    file: 'evals/evaluation.ts',
    find: 'for (const name of namesIn(control)) if (!PREPARED_FILES.includes(name)) issues.push(`unexpected file in the control area before acceptance: ${name}`);',
    replace: '',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated',
  },
  {
    guard: 'D6: the packet is checked again at acceptance, independently of the stored request',
    file: 'evals/evaluation.ts',
    find: "else if (!evaluateDeterministic(runDir).packet.ok) issues.push('the packet does not resolve at acceptance');",
    replace: '',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated',
  },
  {
    guard: 'D6: an evaluation directory the judge created rejects the evaluation',
    file: 'evals/evaluation.ts',
    find: 'if (name !== id && !(request.judge_area_before ?? []).includes(name) && !existsSync(join(runDir, CONTROL_AREA, name))) issues.push(`the judge area gained "${name}" during this evaluation`);',
    replace: '',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated',
  },
  {
    guard: 'D6: accepted content that changed is detected when evaluations are read',
    file: 'evals/evaluation.ts',
    find: "const unchanged = status !== 'ACCEPTED' || (currentHash !== null && currentHash === acceptedHash);",
    replace: 'const unchanged = true;',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated',
  },
  {
    guard: 'D6: an evaluation that disagrees with its control record is not aggregated',
    file: 'evals/summary.ts',
    find: 'const selected = latest && latest.issues.length === 0 ? latest : null;',
    replace: 'const selected = latest;',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated',
  },
  {
    guard: 'D6: control files that appear in the judge area after separation are not trusted',
    file: 'evals/evaluation.ts',
    find: "if (e.layout === 'COLOCATED' && e.status !== 'LEGACY' && before.some((names) => !names.includes(e.evaluation_id))) {",
    replace: 'if (false) {',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated',
  },
  {
    guard: 'D6: an adjudication entry must name the accepted content',
    file: 'evals/evaluation.ts',
    find: 'else if (!entry || entry.evaluation_id !== id || entry.evaluation_sha256 !== acceptedHash) issues.push(`adjudication entry ${i + 1} does not name the accepted content of this evaluation`);',
    replace: '',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D6: control information is read from the evaluator\'s area only, and accepted content that changed is not aggregated',
  },
  {
    guard: 'D6: an unchecked evaluation in the earlier layout cannot be accepted',
    file: 'evals/evaluation.ts',
    find: "if (layout === 'COLOCATED') {\n    throw new Error(",
    replace: 'if (false) {\n    throw new Error(',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'evaluations in the earlier colocated layout are read as recorded and never rewritten; an unchecked one cannot be accepted',
  },
  {
    guard: 'D7: evaluation ids are ordered by their number, not as text',
    file: 'evals/evaluation.ts',
    find: "if (na !== nb) return Number(na) - Number(nb) || (na < nb ? -1 : 1);",
    replace: 'if (na !== nb) return na < nb ? -1 : 1;',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D7: the latest evaluation is chosen by preparation time and numbered id, never by how names sort as text',
  },
  {
    guard: 'D7: preparation time orders evaluations before their ids',
    file: 'evals/evaluation.ts',
    find: 'return ta < tb ? -1 : 1;',
    replace: 'return compareIds(a.evaluation_id, b.evaluation_id);',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D7: the latest evaluation is chosen by preparation time and numbered id, never by how names sort as text',
  },
  {
    guard: 'D7: the copy that holds every other copy is read, whatever the argument order',
    file: 'evals/summary.ts',
    find: 'const complete = copies.find((c) => copies.every((o) => holdsAll(c.evaluations, o.evaluations)));',
    replace: 'const complete = copies[0];',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D7: copies of one run give the same summary in either order, and copies that disagree are shown, not chosen between',
  },
  {
    guard: 'D7: runs are listed by id, not in argument order',
    file: 'evals/summary.ts',
    find: 'rows.sort((a, b) => order(a.row.run_id, b.row.run_id) || order(JSON.stringify(a.row), JSON.stringify(b.row)));',
    replace: '',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D7: copies of one run give the same summary in either order, and copies that disagree are shown, not chosen between',
  },
  {
    guard: 'D7: copies whose run records differ are shown, and their evaluations are not aggregated',
    file: 'evals/summary.ts',
    find: 'if (copies.some((c) => JSON.stringify(c.report) !== JSON.stringify(first.report))) {',
    replace: 'if (false) {',
    testFile: 'tests/evaluation.test.ts',
    expectFailing: 'D7: copies of one run give the same summary in either order, and copies that disagree are shown, not chosen between',
  },

  // ---- R3 and R4 (review findings D3 and D5): the result contract of the Skills, the closed specification syntax, the brief.
  {
    guard: 'D5: a line with a label the specification syntax does not have is refused',
    file: 'core/contracts/planning.ts',
    find: '} else if (SPEC_LABEL.test(line) || SPEC_MARKUP.test(line)) {',
    replace: '} else if (SPEC_MARKUP.test(line)) {',
    testFile: 'tests/spec-brief.test.ts',
    expectFailing: 'D5: an unknown label is refused, wherever it stands',
  },
  {
    guard: 'D5: the brief shows the exclusions of the specification',
    file: 'core/engine/brief.ts',
    find: "${m.spec.exclusions.length === 0 ? '<p>None stated.</p>' : `<ul>${m.spec.exclusions.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`}",
    replace: '<p>None stated.</p>',
    testFile: 'tests/spec-brief.test.ts',
    expectFailing: 'D5: the brief shows every accepted item of the specification, escaped, and nothing executable',
  },
  {
    guard: 'D3: the result template of a Skill carries record_type',
    file: 'core/skills/planning-records/SKILL.md',
    find: '  "record_type": "role-result",',
    replace: '',
    testFile: 'tests/protocol.test.ts',
    expectFailing: 'D3: the template has exactly the required fields, and removing any one of them is refused',
  },
  // Cases 100-113: the release-candidate repairs RC1-RC9.
  {
    guard: 'RC1: a proof may name only an executed test, never a suite or a test holding other tests',
    file: 'core/engine/execution.ts',
    find: "      if (t.kind !== 'TEST') issues.push(",
    replace: '      if (false) issues.push(',
    testFile: 'tests/rc1-test-result-semantics.test.ts',
    expectFailing: 'RC1: a criterion is proven only by an executed top-level test',
  },
  {
    guard: 'RC1: a skipped or TODO line of the report is not read as a pass',
    file: 'adapters/node-test-executor/index.ts',
    find: "    const status = directive ? (directive[2] as 'SKIP' | 'TODO') : m[1] === 'not ok' ? 'FAIL' : 'PASS';",
    replace: "    const status = m[1] === 'not ok' ? 'FAIL' : 'PASS';",
    testFile: 'tests/rc1-test-result-semantics.test.ts',
    expectFailing: 'RC1: the report tells an executed test from a skipped one, a TODO, and a container',
  },
  {
    guard: 'RC2: a test pattern with a segment that can leave the application tree is refused',
    file: 'core/contracts/app.ts',
    find: '  return bad === undefined ? null : `segment "${bad}" could leave the application tree`;',
    replace: '  return null;',
    testFile: 'tests/rc2-test-pattern-containment.test.ts',
    expectFailing: 'RC2: the application configuration refuses a test pattern that can leave the application tree',
  },
  {
    guard: 'RC2: the executor runs nothing for a pattern it would refuse',
    file: 'adapters/node-test-executor/index.ts',
    find: '      if (refusal) {',
    replace: '      if (false) {',
    testFile: 'tests/rc2-test-pattern-containment.test.ts',
    expectFailing: 'RC2 actual execution: the executor refuses an escaping pattern and the outside test never runs',
  },
  {
    guard: 'RC3: a decision is refused when the file shown to the human is not the subject it names',
    file: 'core/engine/engine.ts',
    find: '      if (found !== shown[displayed.subject]) {',
    replace: '      if (false) {',
    testFile: 'tests/rc3-displayed-brief.test.ts',
    expectFailing: 'RC3: a display file edited after the wait refuses every decision, keeps the wait, and is not replaced',
  },
  {
    // Since the PR review, the trees are read again when the packet is re-established, which the proposal step does first.
    guard: 'RC4: every file of the base, proof, and candidate trees is read again before a proposal',
    file: 'core/engine/engine.ts',
    find: '        readTreeFile(runDir, name, file.sha256, file.path);\n        permitted.add(',
    replace: '        permitted.add(',
    testFile: 'tests/rc4-proposal-evidence.test.ts',
    expectFailing: 'RC4: a candidate file changed or substituted after review stops the proposal while its tree record is unchanged',
  },
  {
    guard: 'RC4: every record the proposal relies on is read again before it is assembled',
    file: 'core/engine/engine.ts',
    find: '      readArtifact(runDir, name, ref);\n      read.add(ref as string);',
    replace: '      read.add(ref as string);',
    testFile: 'tests/rc4-proposal-evidence.test.ts',
    expectFailing: 'RC4: every record and file the proposal relies on is re-established before it is assembled',
  },
  {
    // As for the trees: read when the packet is re-established.
    guard: 'RC4: what both real runs printed is read again before a proposal',
    file: 'core/engine/pr-review-packet.ts',
    find: "  read('verification output', verification.output);",
    replace: '',
    testFile: 'tests/rc4-proposal-evidence.test.ts',
    expectFailing: 'RC4: every record and file the proposal relies on is re-established before it is assembled',
  },
  {
    guard: 'RC5: a takeover that did not succeed waits and is bounded by the deadline',
    file: 'core/engine/lock.ts',
    find: '    if (dead && reclaim(runDir, holder)) {\n      reclaimed = holder;\n      continue;\n    }',
    replace: '    if (dead) {\n      if (reclaim(runDir, holder)) reclaimed = holder;\n      continue;\n    }',
    testFile: 'tests/rc5-lock-reclaim-deadline.test.ts',
    expectFailing: 'RC5: a dead lock with an unfinished takeover guard is reported within a bounded time, and nothing is deleted',
  },
  {
    guard: 'RC6: verify reports a listed package file that is missing or differs',
    file: 'adapters/copilot-vscode/install.ts',
    find: "  return { package: drifted.length === 0 ? 'PRESENT' : 'FILES_CHANGED', package_files: drifted };",
    replace: "  return { package: 'PRESENT', package_files: [] };",
    testFile: 'tests/rc6-package-verify.test.ts',
    expectFailing: 'RC6: a runtime file changed after installation is reported as drift while the package manifest is unchanged',
  },
  {
    guard: 'RC7: a candidate is not verified in an environment other than the one the proof ran in',
    file: 'core/engine/engine.ts',
    find: '        if (canonicalJson(environment) !== canonicalJson(baseline.environment)) {',
    replace: '        if (false) {',
    testFile: 'tests/rc7-test-environment.test.ts',
    expectFailing: 'RC7 end to end: verification refuses a proof made under another environment, and resumes when it is the same again',
  },
  {
    guard: 'RC7: the test process is given the built environment, not the parent one',
    file: 'adapters/node-test-executor/index.ts',
    find: '        cwd: request.cwd,\n        env,',
    replace: '        cwd: request.cwd,\n        env: process.env,',
    testFile: 'tests/rc7-test-environment.test.ts',
    expectFailing: 'RC7 actual execution: the child gets the runtime set and the declared variables, and nothing else',
  },
  {
    guard: 'RC8: a judgment of evidence the run no longer has is not aggregated',
    file: 'evals/evaluation.ts',
    find: "    if (status === 'ACCEPTED' && request && request.evidence.digest !== currentEvidence()) {",
    replace: '    if (false) {',
    testFile: 'tests/rc8-evaluation-freshness.test.ts',
    expectFailing: 'RC8: a judgment accepted while the run waited is not aggregated after the run goes on to a proposal',
  },
  {
    guard: 'RC9: human text given inline is refused unless no shell could have altered it',
    file: 'scripts/rstack.ts',
    find: '  if (inline !== undefined && !(inlineAllowed && PLAIN_TEXT.test(inline))) {',
    replace: '  if (false) {',
    testFile: 'tests/rc9-human-text-transport.test.ts',
    expectFailing: 'RC9: a text file that is missing, not UTF-8, or doubled by an inline flag is refused and records nothing',
  },
  // Cases 114-119: further guards the RC1-RC9 repairs introduced, added at closeout.
  {
    guard: 'RC1: a proof may not name a skipped test',
    file: 'core/engine/execution.ts',
    find: "      else if (t.status === 'SKIP') issues.push(",
    replace: '      else if (false) issues.push(',
    testFile: 'tests/rc1-test-result-semantics.test.ts',
    expectFailing: 'RC1: a criterion is proven only by an executed top-level test',
  },
  {
    guard: 'RC1: a proof may not name a test marked TODO',
    file: 'core/engine/execution.ts',
    find: "      else if (t.status === 'TODO') issues.push(",
    replace: '      else if (false) issues.push(',
    testFile: 'tests/rc1-test-result-semantics.test.ts',
    expectFailing: 'RC1: a criterion is proven only by an executed top-level test',
  },
  {
    guard: 'RC1: a suite or a test holding other tests is reported as a container, not as a test',
    file: 'adapters/node-test-executor/index.ts',
    find: "      kind: type === 'test' && !nested ? 'TEST' : 'CONTAINER',",
    replace: "      kind: 'TEST',",
    testFile: 'tests/rc1-test-result-semantics.test.ts',
    expectFailing: 'RC1: the report tells an executed test from a skipped one, a TODO, and a container',
  },
  {
    guard: 'RC5: a dead lock that could not be taken over ends in LOCK_UNCERTAIN',
    file: 'core/engine/lock.ts',
    find: "      if (dead) {\n        throw new EngineBlock('LOCK_UNCERTAIN', 'the run lock belongs to a process that is gone and could not be taken over', { holder });\n      }\n",
    replace: '',
    testFile: 'tests/rc5-lock-reclaim-deadline.test.ts',
    expectFailing: 'RC5: a dead lock that cannot be moved aside ends in a named refusal, not a loop',
  },
  {
    guard: 'RC7: the environment identity covers the values of the variables, not only their names',
    file: 'adapters/node-test-executor/index.ts',
    find: 'JSON.stringify(names.map((name) => [name, env[name] ?? null]))',
    replace: 'JSON.stringify(names)',
    testFile: 'tests/rc7-test-environment.test.ts',
    expectFailing: 'RC7 actual execution: the child gets the runtime set and the declared variables, and nothing else',
  },
  {
    guard: 'RC9: a text file that is not UTF-8 is refused',
    file: 'scripts/rstack.ts',
    find: "const UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });",
    replace: "const UTF8 = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });",
    testFile: 'tests/rc9-human-text-transport.test.ts',
    expectFailing: 'RC9: a text file that is missing, not UTF-8, or doubled by an inline flag is refused and records nothing',
  },
  // Case 120: the RC7 follow-up after the independent verification.
  {
    guard: 'RC7 follow-up: the worker id the test runner assigns cannot be declared as an application variable',
    file: 'adapters/node-test-executor/index.ts',
    find: "const RUNNER_VARIABLES = ['NODE_OPTIONS', 'NODE_TEST_CONTEXT', 'NODE_TEST_WORKER_ID'];",
    replace: "const RUNNER_VARIABLES = ['NODE_OPTIONS', 'NODE_TEST_CONTEXT'];",
    testFile: 'tests/rc7-test-environment.test.ts',
    expectFailing: 'RC7 follow-up: the worker id the test runner assigns cannot be declared; the executor refuses before spawning and no test runs',
  },
  // Cases 121 to 134: single human entry point and the profile's selector states.
  {
    guard: 'an owner-pinned selector is written',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "const WRITTEN_SELECTOR_STATUSES: readonly string[] = ['owner-pinned', 'observed'];",
    replace: "const WRITTEN_SELECTOR_STATUSES: readonly string[] = ['observed'];",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'PROFILE-1: an owner-pinned selector is accepted, written exactly, and reported as owner-pinned',
  },
  {
    guard: 'a list-shaped selector is refused',
    file: 'core/contracts/records.ts',
    find: "if (typeof selector !== 'string' || selector.length > SELECTOR_MAX || !SELECTOR_PATTERN.test(selector)) {",
    replace: "if (typeof selector !== 'string') {",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'PROFILE-3: a list-shaped or fallback selector is refused before anything is written',
  },
  {
    guard: 'role agents are hidden from the agent picker',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "...(agent.worker ? ['user-invocable: false'] : [`agents: ${yamlList(workers)}`, 'user-invocable: true']),",
    replace: "...(agent.worker ? [] : [`agents: ${yamlList(workers)}`, 'user-invocable: true']),",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'VISIBILITY-2: all six workers are hidden from the agent picker',
  },
  {
    guard: 'no agent is offered to other agents as a subagent',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "      'disable-model-invocation: true',",
    replace: '',
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'VISIBILITY-4: no worker is offered to agents that do not name it',
  },
  {
    guard: 'the coordinator delegates only to the six role agents',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "[`agents: ${yamlList(workers)}`, 'user-invocable: true']",
    replace: "[`agents: ['*']`, 'user-invocable: true']",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'VISIBILITY-5: the coordinator may delegate to exactly the six workers, by name',
  },
  {
    guard: 'Skills are kept out of the slash-command menu',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "`description: '${description}'`, 'user-invocable: false', '---'];",
    replace: "`description: '${description}'`, '---'];",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'VISIBILITY-7: every generated Skill is kept out of the slash-command menu',
  },
  {
    guard: 'automatic loading of a Skill is never disabled',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "`description: '${description}'`, 'user-invocable: false', '---'];",
    replace: "`description: '${description}'`, 'user-invocable: false', 'disable-model-invocation: true', '---'];",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'VISIBILITY-8: every generated Skill stays loadable by the model',
  },
  {
    guard: 'every agent is targeted at VS Code',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "      'target: vscode',",
    replace: '',
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'TARGET-1: all seven agents are targeted at VS Code, and the frontmatter holds only the documented keys',
  },
  {
    guard: 'the coordinator is told never to set or substitute a role model',
    file: 'adapters/copilot-vscode/generate.ts',
    find: " and leave the subagent tool's model argument unset: never choose, pass, substitute, or override a role's model.",
    replace: '.',
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'PRECEDENCE-1: the coordinator is told never to choose, pass, substitute, or override a role model',
  },
  {
    guard: 'the role-to-model mapping is not repeated in coordinator text',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "  'Role: <directive.pending.role>',",
    replace: "  'Role: <directive.pending.role> (the planner runs on Opus 5.5)',",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'PRECEDENCE-2: the role-to-model mapping exists only in the profile, never in coordinator prose or authored sources',
  },
  {
    guard: 'a role agent has no delegation tool',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "tools: ['read', 'search', 'edit', 'execute'],",
    replace: "tools: ['read', 'search', 'edit', 'execute', 'agent'],",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'VISIBILITY-6: no worker can delegate',
  },
  {
    guard: 'a task envelope carries no model',
    file: 'core/engine/engine.ts',
    find: '      profile_ref: state.profile_ref,\n      mode: stage?.mode ?? null,',
    replace: "      profile_ref: state.profile_ref,\n      model: 'x',\n      mode: stage?.mode ?? null,",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'PRECEDENCE-3: a task envelope carries nothing about a model',
  },
  {
    guard: 'no production pin is active in the shipped profile',
    file: 'profiles/trial-v1.json',
    find: '"opus": { "owner_label": "Opus 5.5", "family": "Anthropic", "host_selector": null, "selector_status": "requires-host-observation" }',
    replace: '"opus": { "owner_label": "Opus 5.5", "family": "Anthropic", "host_selector": "ZZ Pin One (test only)", "selector_status": "owner-pinned" }',
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'PROFILE-6: no production pin is active: the shipped profile leaves every selector unobserved',
  },
  {
    guard: 'the coordinator is the agent a user can select',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "[`agents: ${yamlList(workers)}`, 'user-invocable: true']",
    replace: "[`agents: ${yamlList(workers)}`, 'user-invocable: false']",
    testFile: 'tests/single-entry.test.ts',
    expectFailing: 'VISIBILITY-1: the coordinator is the entry point a user can select',
  },
  // Cases 135 to 171: the PR review packet, the PR review, and the composed proposal.
  {
    guard: 'the code review is followed by the PR review packet, not by the proposal',
    file: 'core/policies/workflow.ts',
    find: "      next: 'pr-review-packet',",
    replace: "      next: 'proposal',",
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-1: the packet and the PR review come after technical acceptance and before the proposal, and replay refuses a journal that skips them',
  },
  {
    guard: 'the PR review is done by its own role, not by the code reviewer',
    file: 'core/policies/workflow.ts',
    find: "      role: 'pr-reviewer',",
    replace: "      role: 'reviewer',",
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-1: the packet and the PR review come after technical acceptance and before the proposal, and replay refuses a journal that skips them',
  },
  {
    guard: 'a definition that routes around the PR review cannot record a proposal',
    file: 'core/engine/state.ts',
    find: "if (stage.id === 'proposal' && stageOf(workflow, 'pr-review') && (state.pr_review?.verdict !== 'APPROVE' || !state.subjects.pr_review_packet || state.pr_review.record !== state.subjects.pr_review)) {",
    replace: 'if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-1: the packet and the PR review come after technical acceptance and before the proposal, and replay refuses a journal that skips them',
  },
  {
    guard: 'only an approving PR review leads to a proposal',
    file: 'core/engine/state.ts',
    find: "if (verdict !== 'APPROVE') {",
    replace: 'if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-5: a PR review that returns REQUEST_CHANGES is retained, blocks the run, and starts no repair',
  },
  {
    guard: 'the engine composes no proposal without an approving PR review',
    file: 'core/engine/engine.ts',
    find: "if (!reviewed || reviewed.verdict !== 'APPROVE' || reviewed.record !== state.subjects.pr_review) {",
    replace: 'if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-16: a run recorded under workflow version 5 keeps its meaning: version 6 does not continue, relabel, or reinterpret it',
  },
  {
    guard: 'the composer refuses anything but an approved, accepted candidate',
    file: 'core/engine/proposal.ts',
    find: "  if (pr.verdict !== 'APPROVE' || review.verdict !== 'ACCEPT') {",
    replace: '  if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-19: the proposal is exactly what the composer gives for the retained records, and an interrupted packet step is not repeated',
  },
  {
    guard: 'a PR review counts only for the packet and candidate it was given',
    file: 'core/contracts/pr-review.ts',
    find: "        issues.list.push(`pr_review.subject.${key}: is not the ${key} this review was given`);",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-3: a result from another role, for another attempt, or for another subject is not a PR review',
  },
  {
    guard: 'APPROVE needs every mandatory coverage item checked',
    file: 'core/contracts/pr-review.ts',
    find: "      if (status.has(item) && status.get(item) !== 'CHECKED') {",
    replace: '      if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PR review contract: verdicts need what makes them mean something, text is bounded and plain, and nothing unknown is carried',
  },
  {
    guard: 'a mandatory coverage item cannot be left out',
    file: 'core/contracts/pr-review.ts',
    find: "    if (!status.has(item)) issues.list.push(`pr_review.coverage: mandatory item \"${item}\" is missing`);",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PR review contract: verdicts need what makes them mean something, text is bounded and plain, and nothing unknown is carried',
  },
  {
    guard: 'APPROVE cannot stand with a blocking or major finding',
    file: 'core/contracts/pr-review.ts',
    find: "    if (serious > 0) issues.list.push('pr_review.verdict: APPROVE cannot stand with a BLOCKING or MAJOR finding');",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PR review contract: verdicts need what makes them mean something, text is bounded and plain, and nothing unknown is carried',
  },
  {
    guard: 'REQUEST_CHANGES needs a finding',
    file: 'core/contracts/pr-review.ts',
    find: "  if (verdict === 'REQUEST_CHANGES' && findings === 0) issues.list.push('pr_review.findings: a REQUEST_CHANGES verdict needs at least one finding');",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PR review contract: verdicts need what makes them mean something, text is bounded and plain, and nothing unknown is carried',
  },
  {
    guard: 'a PR review may cite only evidence of its packet',
    file: 'core/contracts/pr-review.ts',
    find: "      if (typeof r === 'string' && REF_PATTERN.test(id) && !expected.permitted.has(id)) {",
    replace: '      if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PR review contract: verdicts need what makes them mean something, text is bounded and plain, and nothing unknown is carried',
  },
  {
    guard: 'a PR review record is bounded in size',
    file: 'core/contracts/pr-review.ts',
    find: '  if (Buffer.byteLength(text) > PR_REVIEW_LIMITS.record_bytes) {',
    replace: '  if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PR review contract: verdicts need what makes them mean something, text is bounded and plain, and nothing unknown is carried',
  },
  {
    guard: 'the packet is re-established before a PR review is dispatched',
    file: 'core/engine/engine.ts',
    find: "      if (stage.id === 'pr-review') currentPacket(ctx.runDir, state);",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: every dependency of the packet is re-established before assembly, before dispatch, before acceptance, and before composition',
  },
  {
    guard: 're-establishing the packet assembles it again from what is retained',
    file: 'core/engine/engine.ts',
    find: 'if (refOf(packetAt(runDir, state, packet.history.journal_cutoff)) !== ref) {',
    replace: 'if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: every dependency of the packet is re-established before assembly, before dispatch, before acceptance, and before composition',
  },
  {
    guard: 'every file of the three trees is read again before a PR review is accepted',
    file: 'core/engine/engine.ts',
    find: "        readTreeFile(runDir, name, file.sha256, file.path);\n        permitted.add(",
    replace: '        permitted.add(',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-7: a candidate file changed, substituted, or removed after the code review stops the PR review from being accepted',
  },
  {
    guard: 'what the proof baseline printed is read again with the packet',
    file: 'core/engine/pr-review-packet.ts',
    find: "  read('proof_baseline output', baseline.output);",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: every dependency of the packet is re-established before assembly, before dispatch, before acceptance, and before composition',
  },
  {
    guard: 'the history a packet names is read again with the packet',
    file: 'core/engine/pr-review-packet.ts',
    find: "  for (const f of failedAttempts) read(`failure of ${f.attempt_id}`, f.record);",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: every dependency of the packet is re-established before assembly, before dispatch, before acceptance, and before composition',
  },
  {
    guard: 'the verification a packet names must be of its candidate',
    file: 'core/engine/pr-review-packet.ts',
    find: "    verification.tree !== subjects.candidate ||\n",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: evidence that is intact but no longer agrees with itself is refused, and a later journal record does not make a packet stale',
  },
  {
    guard: 'the code review a packet follows must have been given the plan and audit in force',
    file: 'core/engine/pr-review-packet.ts',
    find: "for (const key of ['source', 'spec', 'final_plan', 'audit', 'proof', 'proof_tree', 'proof_baseline', 'base', 'candidate', 'verification'] as const) {",
    replace: "for (const key of ['source', 'spec', 'proof', 'proof_tree', 'proof_baseline', 'base', 'candidate', 'verification'] as const) {",
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: evidence that is intact but no longer agrees with itself is refused, and a later journal record does not make a packet stale',
  },
  {
    guard: 'the packet binds the procedure the review follows',
    file: 'core/engine/pr-review-packet.ts',
    find: '      review_procedure: subjects.procedure,',
    replace: '      review_procedure: subjects.source,',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-2: the packet names the exact candidate and the whole evidence set, and the PR reviewer is given exactly that',
  },
  {
    guard: "a packet's path counts restate its list of paths",
    file: 'core/contracts/pr-review.ts',
    find: "    if (o[key] !== counts[change]) issues.list.push(`${path}.${key}: does not equal the number of ${change} paths`);",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-11: added, modified, and deleted paths are measured from the trees, including what the proof added',
  },
  {
    guard: 'an invalidated verification drops the PR review as well',
    file: 'core/engine/state.ts',
    find: '      delete state.pr_review;',
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: when the execution environment changes, the code review, the packet, and the PR review are all established again',
  },
  {
    guard: 'history is taken from the journal at the cutoff, with invalidated reviews as superseded',
    file: 'core/engine/pr-review-packet.ts',
    find: "    if (e.type === 'verification_invalidated') for (const step of ['review', 'pr-review']) inForce.delete(step);",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: when the execution environment changes, the code review, the packet, and the PR review are all established again',
  },
  {
    guard: 'stale verification is found before the PR review packet is assembled',
    file: 'core/engine/engine.ts',
    find: "        const stale = invalidateIfStale(ctx);\n        if (stale) return stale;\n        // Assembled from retained records",
    replace: '        // Assembled from retained records',
    testFile: 'tests/proof.test.ts',
    expectFailing: 'REVIEW-1: when what the verification relied on changes, the verification and the review are established again',
  },
  {
    guard: 'an execution outcome in the proposal comes from the execution record',
    file: 'core/engine/proposal.ts',
    find: "outcome ${mdText(record.classification.outcome)};",
    replace: 'outcome PASS;',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-12: execution is reported as entries by kind and status, never as a number of tests that passed',
  },
  {
    guard: 'report entries are counted by kind, not as tests',
    file: 'core/engine/proposal.ts',
    find: "  const single = tests.filter((t) => t.kind === 'TEST');",
    replace: '  const single = tests;',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-12: execution is reported as entries by kind and status, never as a number of tests that passed',
  },
  {
    guard: "the code review's limitations are rendered whatever the PR review says",
    file: 'core/engine/proposal.ts',
    find: "    ...list(review.limitations.map(mdText), 'none stated'),",
    replace: "    ...list([], 'none stated'),",
    testFile: 'tests/pr-review.test.ts',
    expectFailing: "PRR-13: the code review's verdict, findings, limitations, and unchecked items, and the plan's unaudited amendments, reach the proposal as they are",
  },
  {
    guard: 'PR review narrative is escaped before it is placed in the body',
    file: 'core/engine/proposal.ts',
    find: '    mdText(pr.summary),',
    replace: '    pr.summary,',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-10, PRR-14: a hostile PR review cannot change a machine fact or the structure of the proposal',
  },
  {
    guard: 'markup characters in supplied text are escaped',
    file: 'core/engine/proposal.ts',
    find: "    .replace(/</g, '&lt;')\n",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-14: text from outside the composer is made inert for Markdown',
  },
  {
    guard: 'supplied text cannot span lines',
    file: 'core/engine/proposal.ts',
    find: "    .replace(/\\r\\n?|\\n/g, ' ')\n",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-14: text from outside the composer is made inert for Markdown',
  },
  {
    guard: 'a run of another workflow version is refused before it is replayed',
    file: 'core/engine/engine.ts',
    find: 'if (recorded !== undefined && recorded !== wfRef) {',
    replace: 'if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-16: a run recorded under workflow version 5 keeps its meaning: version 6 does not continue, relabel, or reinterpret it',
  },
  {
    guard: 'a version 5 run is not evaluated as if it had a PR review',
    file: 'evals/deterministic.ts',
    find: '  const prReviewed = (format.version ?? 0) >= PR_REVIEW_SINCE;',
    replace: '  const prReviewed = true;',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-16: a run recorded under workflow version 5 keeps its meaning: version 6 does not continue, relabel, or reinterpret it',
  },
  {
    guard: 'a version 6 proposal must be in the format that carries a PR review',
    file: 'evals/deterministic.ts',
    find: "      if (proposal.schema_version !== 2) problems.push('the proposal is not in the format that carries a PR review');",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-16: a run recorded under workflow version 5 keeps its meaning: version 6 does not continue, relabel, or reinterpret it',
  },
  {
    guard: 'a run needs a PR review procedure before it exists',
    file: 'core/engine/engine.ts',
    find: 'if (needsProcedure && (procedure.trim().length === 0 || Buffer.byteLength(procedure) > MAX_PROCEDURE_BYTES)) {',
    replace: 'if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: "PRR-17: a profile without the PR reviewer is refused before a run or a package exists, and the shipped profiles give it the code reviewer's model alias",
  },
  {
    guard: 'the PR reviewer has no terminal',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "ready to submit and writes a PR review record.',\n    tools: ['read', 'search', 'edit'],\n    worker: true,",
    replace: "ready to submit and writes a PR review record.',\n    tools: ['read', 'search', 'edit', 'execute'],\n    worker: true,",
    testFile: 'tests/pr-review.test.ts',
    expectFailing: "PRR-18: the generated PR reviewer is a hidden worker on the coordinator's list, with the code reviewer's tools and no way to delegate, run commands, or publish",
  },
  {
    guard: 'the PR reviewer is a hidden worker',
    file: 'adapters/copilot-vscode/generate.ts',
    find: "ready to submit and writes a PR review record.',\n    tools: ['read', 'search', 'edit'],\n    worker: true,",
    replace: "ready to submit and writes a PR review record.',\n    tools: ['read', 'search', 'edit'],\n    worker: false,",
    testFile: 'tests/pr-review.test.ts',
    expectFailing: "PRR-18: the generated PR reviewer is a hidden worker on the coordinator's list, with the code reviewer's tools and no way to delegate, run commands, or publish",
  },
  {
    guard: 'what a failed verification printed is read again with the packet',
    file: 'core/engine/pr-review-packet.ts',
    find: "      read('failed verification output', run.output);\n",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: every dependency of the packet is re-established before assembly, before dispatch, before acceptance, and before composition',
  },
  {
    guard: 'every file of an earlier candidate the packet names is read again with the packet',
    file: 'core/engine/pr-review-packet.ts',
    find: '    for (const file of record<TreeManifest>(name, ref).files) read(`file "${file.path}" of ${name}`, `sha256:${file.sha256}`);',
    replace: '    record<TreeManifest>(name, ref);',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: every dependency of the packet is re-established before assembly, before dispatch, before acceptance, and before composition',
  },
  {
    guard: 'a failed verification the packet names must be the recorded run of that candidate',
    file: 'core/engine/pr-review-packet.ts',
    find: "      if (run.purpose !== 'CANDIDATE_VERIFICATION' || run.tree !== candidate || run.classification.outcome !== e.data.outcome) {",
    replace: '      if (false) {',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: evidence that is intact but no longer agrees with itself is refused, and a later journal record does not make a packet stale',
  },
  {
    guard: 'a record a superseded result produced is read again with the packet',
    file: 'core/engine/pr-review-packet.ts',
    find: '      else read(name, made.record);',
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-8: when the execution environment changes, the code review, the packet, and the PR review are all established again',
  },
  {
    guard: "the reviewer's copy of the candidate is measured before a PR review is accepted",
    file: 'core/engine/engine.ts',
    find: "        const refusal = unchangedCopy(ctx, sub.attempt_id, 'candidate');\n        if (refusal) return reject(refusal.code as string, refusal.detail as Record<string, unknown>);\n",
    replace: '',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-7: a PR review is accepted only while the copy of the candidate it was given is unchanged',
  },
  {
    guard: 'a digest in the packet is not evidence a PR review may cite',
    file: 'core/contracts/pr-review.ts',
    find: '    technical_review.result,\n',
    replace: '    technical_review.result,\n    technical_review.input_digest,\n    history.journal_digest,\n',
    testFile: 'tests/pr-review.test.ts',
    expectFailing: 'PRR-2: the packet names the exact candidate and the whole evidence set, and the PR reviewer is given exactly that',
  },
];

// Digest of every live source file a mutation could touch, taken before and
// after, to show the live package was left as it was.
function liveDigest(): string {
  const files = COPIED.flatMap((entry) => {
    const path = join(PACKAGE_ROOT, entry);
    if (!statSync(path).isDirectory()) return [path];
    return readdirSync(path, { withFileTypes: true, recursive: true })
      .filter((e) => e.isFile() && !join(e.parentPath, e.name).split(sep).includes('.tmp'))
      .map((e) => join(e.parentPath, e.name));
  }).sort();
  return sha256Hex(files.map((f) => `${relative(PACKAGE_ROOT, f)}:${sha256Hex(readFileSync(f))}`).join('\n'));
}

function makeCopy(parent: string, name: string): string {
  const dest = join(parent, name);
  mkdirSync(dest);
  for (const entry of COPIED) {
    if (entry !== 'tests') {
      cpSync(join(PACKAGE_ROOT, entry), join(dest, entry), { recursive: true });
      continue;
    }
    // The copies live under tests/.tmp/, so tests/ is copied child by child without it.
    mkdirSync(join(dest, 'tests'));
    for (const child of readdirSync(join(PACKAGE_ROOT, 'tests'))) {
      if (child !== '.tmp') cpSync(join(PACKAGE_ROOT, 'tests', child), join(dest, 'tests', child), { recursive: true });
    }
  }
  return dest;
}

// ---------------------------------------------------------------- selection

function refuse(message: string): never {
  process.stderr.write(`${JSON.stringify({ ok: false, refused: message }, null, 2)}\n`);
  process.exit(2);
}

function options(): { cases?: string; out?: string; 'timeout-ms'?: string; list?: boolean } {
  try {
    return parseArgs({ options: { cases: { type: 'string' }, out: { type: 'string' }, 'timeout-ms': { type: 'string' }, list: { type: 'boolean' } } }).values;
  } catch (e) {
    return refuse(e instanceof Error ? e.message : String(e));
  }
}
const args = options();

if (args.list) {
  process.stdout.write(`${JSON.stringify(MUTATIONS.map((m, i) => ({ case: i + 1, guard: m.guard, mutated: m.file, test_file: m.testFile })), null, 2)}\n`);
  process.exit(0);
}

// Case numbers are positions in MUTATIONS, from 1. Without --cases every case is selected.
function selectedCases(): number[] {
  if (args.cases === undefined) return MUTATIONS.map((_, i) => i + 1);
  const parts = args.cases.split(',').map((p) => p.trim());
  if (parts.length === 0 || parts.some((p) => p === '')) refuse('--cases needs a comma-separated list of case numbers, for example --cases 80,81');
  const numbers = parts.map((p) => (/^[1-9]\d*$/.test(p) ? Number(p) : refuse(`--cases: "${p}" is not a case number`)));
  for (const n of numbers) if (n > MUTATIONS.length) refuse(`--cases: there is no case ${n}; cases are 1 to ${MUTATIONS.length}`);
  if (new Set(numbers).size !== numbers.length) refuse('--cases: a case is listed more than once');
  return numbers;
}
const SELECTED = selectedCases();
const FULL = args.cases === undefined;
const TIMEOUT_MS = args['timeout-ms'] === undefined ? 600_000 : /^[1-9]\d*$/.test(args['timeout-ms']) ? Number(args['timeout-ms']) : refuse('--timeout-ms needs a positive whole number');

const STARTED_AT = new Date();
const OUT = resolve(args.out ?? join(PACKAGE_ROOT, 'tests', '.tmp', `sensitivity-results-${STARTED_AT.toISOString().replace(/[-:.]/g, '')}`));
if (existsSync(OUT) && (!statSync(OUT).isDirectory() || readdirSync(OUT).length > 0)) refuse(`--out: ${OUT} already holds files; earlier records are not overwritten`);
mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- one bounded test process

type Execution = 'COMPLETED' | 'TIMED_OUT' | 'KILLED' | 'NOT_LAUNCHED';

interface ChildRecord {
  execution: Execution;
  exit_status: number | null;
  signal: string | null;
  launch_error: string | null;
  duration_ms: number;
  // From the test report. Null when the process printed no summary.
  tests_reported: number | null;
  failing_tests: string[];
  stdout_file: string;
  stderr_file: string;
}

function runTests(cwd: string, testFile: string, id: string): ChildRecord {
  const started = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', testFile], { cwd, encoding: 'utf8', timeout: TIMEOUT_MS, killSignal: 'SIGKILL', maxBuffer: 256 * 1024 * 1024 });
  const duration = Date.now() - started;
  const stdout = typeof r.stdout === 'string' ? r.stdout : '';
  const stderr = typeof r.stderr === 'string' ? r.stderr : '';
  writeFileSync(join(OUT, `${id}.stdout.txt`), stdout);
  writeFileSync(join(OUT, `${id}.stderr.txt`), stderr);
  const error = r.error as NodeJS.ErrnoException | undefined;
  const timedOut = error?.code === 'ETIMEDOUT';
  const reported = /^# tests (\d+)$/m.exec(stdout);
  return {
    execution: timedOut ? 'TIMED_OUT' : error ? 'NOT_LAUNCHED' : r.signal ? 'KILLED' : r.status === null ? 'NOT_LAUNCHED' : 'COMPLETED',
    exit_status: r.status,
    signal: r.signal,
    launch_error: error && !timedOut ? `${error.code ?? 'ERROR'}: ${error.message}` : null,
    duration_ms: duration,
    tests_reported: reported ? Number(reported[1]) : null,
    failing_tests: [...stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1] as string),
    stdout_file: `${id}.stdout.txt`,
    stderr_file: `${id}.stderr.txt`,
  };
}

// The process ran to its end and said how many tests it ran. Without this,
// an exit status alone says nothing about the tests: a process that was
// killed, or that never loaded its tests, also ends without failing tests.
const reportedTests = (c: ChildRecord): boolean => c.execution === 'COMPLETED' && c.tests_reported !== null && c.tests_reported > 0;

type ControlResult = 'PASSES' | 'CONTROL_FAILED' | 'CONTROL_NOT_RUN';
type CaseResult =
  | 'DETECTED'
  // The tests ran to their end and all passed with the guard broken.
  | 'NOT_DETECTED'
  // Tests failed, but not the named one.
  | 'FAILED_ELSEWHERE'
  // The process ended without a usable test report: nothing is known about the guard.
  | 'INCONCLUSIVE_NO_TEST_REPORT'
  | 'INCONCLUSIVE_TIMED_OUT'
  | 'INCONCLUSIVE_NOT_RUN'
  | 'INCONCLUSIVE_CONTROL'
  | 'INCONCLUSIVE_INTERRUPTED'
  | 'MUTATION_NOT_APPLIED';

function controlResult(c: ChildRecord): ControlResult {
  if (reportedTests(c) && c.exit_status === 0 && c.failing_tests.length === 0) return 'PASSES';
  return reportedTests(c) && c.failing_tests.length > 0 ? 'CONTROL_FAILED' : 'CONTROL_NOT_RUN';
}

function caseResult(c: ChildRecord, expectFailing: string): CaseResult {
  if (c.execution === 'TIMED_OUT') return 'INCONCLUSIVE_TIMED_OUT';
  if (c.execution !== 'COMPLETED') return 'INCONCLUSIVE_NOT_RUN';
  if (!reportedTests(c)) return 'INCONCLUSIVE_NO_TEST_REPORT';
  if (c.exit_status !== 0 && c.failing_tests.includes(expectFailing)) return 'DETECTED';
  if (c.exit_status === 0 && c.failing_tests.length === 0) return 'NOT_DETECTED';
  return c.failing_tests.length > 0 ? 'FAILED_ELSEWHERE' : 'INCONCLUSIVE_NO_TEST_REPORT';
}

// ---------------------------------------------------------------- the run

const record = (name: string, value: unknown): void => writeFileSync(join(OUT, name), `${JSON.stringify(value, null, 2)}\n`);
const completed = (row: Record<string, unknown>): void => appendFileSync(join(OUT, 'cases.jsonl'), `${JSON.stringify({ ...row, recorded_at: new Date().toISOString() })}\n`);
// A copy still held open by a leftover process is reported, not fought over.
const remove = (dir: string): boolean => {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    return true;
  } catch {
    return false;
  }
};
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: PACKAGE_ROOT, encoding: 'utf8' });

const before = liveDigest();
const controlFiles = [...new Set(SELECTED.map((n) => (MUTATIONS[n - 1] as Mutation).testFile))];
const run = {
  record_type: 'sensitivity-run',
  started_at: STARTED_AT.toISOString(),
  node: process.version,
  platform: process.platform,
  timeout_ms_per_process: TIMEOUT_MS,
  source: {
    git_head: head.status === 0 ? head.stdout.trim() : null,
    live_digest_before: before,
    runner_sha256: sha256Hex(readFileSync(fileURLToPath(import.meta.url))),
  },
  selection: {
    mode: FULL ? 'ALL' : 'SUBSET',
    requested: args.cases ?? null,
    total_cases: MUTATIONS.length,
    cases: SELECTED.map((n) => ({ case: n, guard: (MUTATIONS[n - 1] as Mutation).guard, mutated: (MUTATIONS[n - 1] as Mutation).file, test_file: (MUTATIONS[n - 1] as Mutation).testFile })),
    controls: controlFiles,
  },
};
record('run.json', run);

// A stop request is honoured between test processes; what was not reached is reported as not run.
let interrupted: string | null = null;
for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK'] as const) process.on(signal, () => (interrupted ??= signal));
const breathe = (): Promise<void> => new Promise((done) => setImmediate(done));

mkdirSync(join(PACKAGE_ROOT, 'tests', '.tmp'), { recursive: true });
const parent = mkdtempSync(join(PACKAGE_ROOT, 'tests', '.tmp', 'sensitivity-'));
const rows: Record<string, unknown>[] = [];
const controls = new Map<string, ControlResult | 'INCONCLUSIVE_INTERRUPTED'>();
const leftovers: string[] = [];
try {
  // Control: an unmodified copy must pass, so a later failure is caused by the mutation.
  const control = makeCopy(parent, 'control');
  for (const [i, testFile] of controlFiles.entries()) {
    await breathe();
    if (interrupted) {
      controls.set(testFile, 'INCONCLUSIVE_INTERRUPTED');
      rows.push({ guard: 'CONTROL (unmodified copy)', test_file: testFile, result: 'INCONCLUSIVE_INTERRUPTED' });
      continue;
    }
    const child = runTests(control, testFile, `control-${i + 1}`);
    const result = controlResult(child);
    controls.set(testFile, result);
    const row = { guard: 'CONTROL (unmodified copy)', test_file: testFile, result, ...child };
    rows.push(row);
    completed(row);
  }
  if (!remove(control)) leftovers.push('control');

  for (const n of SELECTED) {
    await breathe();
    const m = MUTATIONS[n - 1] as Mutation;
    const base = { case: n, guard: m.guard, mutated: m.file, test_file: m.testFile, expect_failing: m.expectFailing };
    const controlState = controls.get(m.testFile);
    if (interrupted || controlState !== 'PASSES') {
      // Without a passing control a failure could not be attributed to the mutation, so the case is not run.
      const row = { ...base, result: interrupted ? 'INCONCLUSIVE_INTERRUPTED' : 'INCONCLUSIVE_CONTROL', control: controlState };
      rows.push(row);
      completed(row);
      continue;
    }
    const copy = makeCopy(parent, `m${n}`);
    const target = join(copy, m.file);
    const source = readFileSync(target, 'utf8').replaceAll('\r\n', '\n');
    if (!source.includes(m.find)) {
      const row = { ...base, result: 'MUTATION_NOT_APPLIED', detail: 'the text this case breaks is not in the source' };
      rows.push(row);
      completed(row);
    } else {
      writeFileSync(target, source.replace(m.find, m.replace));
      const child = runTests(copy, m.testFile, `m${n}`);
      const row = { ...base, result: caseResult(child, m.expectFailing), ...child };
      rows.push(row);
      completed(row);
    }
    if (!remove(copy)) leftovers.push(`m${n}`);
  }
} finally {
  if (!remove(parent)) leftovers.push('(parent directory)');
}

const after = liveDigest();
const restored = before === after;
const count = (list: unknown[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const v of list) out[String(v)] = (out[String(v)] ?? 0) + 1;
  return out;
};
const controlRows = rows.filter((r) => r.case === undefined);
const caseRows = rows.filter((r) => r.case !== undefined);
const allDetected = caseRows.length === SELECTED.length && caseRows.every((r) => r.result === 'DETECTED');
const controlsPass = controlRows.every((r) => r.result === 'PASSES');
const ok = allDetected && controlsPass && restored && interrupted === null;
const summary = {
  ok,
  // True only when every case of the suite was selected and every one was detected with passing controls.
  full_sensitivity_pass: ok && FULL,
  scope: FULL ? `all ${MUTATIONS.length} cases` : `SUBSET: ${SELECTED.length} of ${MUTATIONS.length} cases (${SELECTED.join(', ')}); this is not a full sensitivity run`,
  interrupted,
  live_source_unchanged: restored,
  source: { ...run.source, live_digest_after: after },
  finished_at: new Date().toISOString(),
  controls: count(controlRows.map((r) => r.result)),
  cases: count(caseRows.map((r) => r.result)),
  copies_not_removed: leftovers,
  records: OUT,
  results: rows,
};
record('summary.json', summary);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
process.exitCode = ok ? 0 : 1;
