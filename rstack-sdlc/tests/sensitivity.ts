// Test-sensitivity demonstration. For each critical guard, the package is
// copied to a throwaway directory under tests/.tmp/, the guard is broken in
// that copy only, and the relevant test file is run there. The run must fail
// in the named test. The live source is never modified, and every copy is
// removed afterwards.
//
//   node tests/sensitivity.ts

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
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
    find: 'if (existsSync(dir)) throw new Error(`evaluation "${id}" already exists; a new evaluation needs a new id`);',
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
    find: 'if (report.run_id && seen.has(key)) {',
    replace: 'if (false) {',
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
    find: 'if (canonicalJson(environment) !== canonicalJson(verification.environment) || verification.tree !== state.subjects.candidate) {',
    replace: 'if (false) {',
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
    find: '      if (sha256Hex(bytes) !== sha256) throw new EngineBlock(\'MISSING_INPUT\', `retained file "${path}" of ${name} does not match its identity`, { input: name });',
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
    find: "const selector = entry.selector_status === 'observed' ? entry.host_selector : null;",
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
    find: "else actions.push({ path: file.path, action: 'COLLISION', detail: 'a file this installer did not install exists at an owned path' });",
    replace: "else { actions.push({ path: file.path, action: 'UPDATE', detail: 'x' }); writes.push({ path: file.path, full, content }); }",
    testFile: 'tests/install.test.ts',
    expectFailing: 'PACKAGE-1: a file the installer did not install is never overwritten',
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
    find: 'if (!existsSync(full) || sha256Hex(readFileSync(full)) !== file.sha256) {',
    replace: 'if (!existsSync(full)) {',
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
    replace: 'for (const step of [] as (() => void)[]) {',
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

function runTests(cwd: string, testFile: string): { status: number | null; failing: string[] } {
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', testFile], { cwd, encoding: 'utf8' });
  const failing = [...r.stdout.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1] as string);
  return { status: r.status, failing };
}

const before = liveDigest();
mkdirSync(join(PACKAGE_ROOT, 'tests', '.tmp'), { recursive: true });
const parent = mkdtempSync(join(PACKAGE_ROOT, 'tests', '.tmp', 'sensitivity-'));
const rows: Record<string, unknown>[] = [];
let failed = false;
try {
  // Control: an unmodified copy must pass, so a later failure is caused by the mutation.
  const control = makeCopy(parent, 'control');
  for (const testFile of [...new Set(MUTATIONS.map((m) => m.testFile))]) {
    const r = runTests(control, testFile);
    const ok = r.status === 0 && r.failing.length === 0;
    rows.push({ guard: 'CONTROL (unmodified copy)', test_file: testFile, result: ok ? 'PASSES' : 'CONTROL_FAILED' });
    failed ||= !ok;
  }

  MUTATIONS.forEach((m, i) => {
    const copy = makeCopy(parent, `m${i + 1}`);
    const target = join(copy, m.file);
    const source = readFileSync(target, 'utf8').replaceAll('\r\n', '\n');
    assert.ok(source.includes(m.find), `mutation target not found for "${m.guard}"`);
    writeFileSync(target, source.replace(m.find, m.replace));
    const r = runTests(copy, m.testFile);
    const detected = r.status !== 0 && r.failing.includes(m.expectFailing);
    rows.push({
      guard: m.guard,
      mutated: m.file,
      test_file: m.testFile,
      result: detected ? 'DETECTED' : 'NOT_DETECTED',
      failing_tests: r.failing,
    });
    failed ||= !detected;
  });
} finally {
  rmSync(parent, { recursive: true, force: true });
}

const after = liveDigest();
const restored = before === after;
process.stdout.write(`${JSON.stringify({ ok: !failed && restored, live_source_unchanged: restored, results: rows }, null, 2)}\n`);
process.exitCode = !failed && restored ? 0 : 1;
