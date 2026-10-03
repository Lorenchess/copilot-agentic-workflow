// Deterministic judgments on a real test execution. The executor reports
// what happened; these functions decide whether that is a valid behavioral
// red for a controlled proof, or a passing verification of a candidate.
// They judge the execution record, not the quality of the tests.

import type { Proof } from '../contracts/app.ts';
import type { ExecutionOutcome, TestOutcome } from '../contracts/ports.ts';

export interface Classification {
  outcome: string;
  issues: string[];
}

function byName(tests: TestOutcome[]): Map<string, TestOutcome[]> {
  const map = new Map<string, TestOutcome[]>();
  for (const t of tests) map.set(t.name, [...(map.get(t.name) ?? []), t]);
  return map;
}

// Problems that mean the run says nothing about behavior: it did not finish,
// ran nothing, or a test file failed to load or compile.
function setupProblems(outcome: ExecutionOutcome): string[] {
  const issues: string[] = [];
  if (outcome.timed_out) issues.push('the test command timed out');
  if (outcome.exit_code === null && !outcome.timed_out) issues.push('the test command did not exit normally');
  if (outcome.tests.length === 0) issues.push('no test was reported');
  for (const t of outcome.tests) {
    if (t.failure_kind === 'LOAD') issues.push(`"${t.name}" could not be loaded or crashed; its tests did not run`);
  }
  return issues;
}

function resolve(proof: Proof, tests: Map<string, TestOutcome[]>, issues: string[]): void {
  for (const c of proof.criteria) {
    for (const name of c.tests) {
      const found = tests.get(name) ?? [];
      if (found.length === 0) issues.push(`${c.criterion}: test "${name}" was not reported by the run`);
      if (found.length > 1) issues.push(`${c.criterion}: test name "${name}" is reported more than once`);
    }
  }
}

// The controlled proof run against the unchanged application.
//   VALID                 every criterion behaves as its route says
//   SETUP_FAILURE         the run is not evidence of behavior at all
//   BASELINE_UNHEALTHY    a test outside the proof fails before any change
//   NOT_DISCRIMINATING    a criterion's proof does not show what it claims
export function classifyBaseline(proof: Proof, outcome: ExecutionOutcome): Classification {
  const setup = setupProblems(outcome);
  const tests = byName(outcome.tests);
  resolve(proof, tests, setup);
  if (setup.length > 0) return { outcome: 'SETUP_FAILURE', issues: setup };

  const proofNames = new Set(proof.criteria.flatMap((c) => c.tests));
  const unhealthy = outcome.tests.filter((t) => !proofNames.has(t.name) && t.status === 'FAIL').map((t) => `existing test "${t.name}" fails against the unchanged application`);
  if (unhealthy.length > 0) return { outcome: 'BASELINE_UNHEALTHY', issues: unhealthy };

  const issues: string[] = [];
  for (const c of proof.criteria) {
    const results = c.tests.map((name) => (tests.get(name) as TestOutcome[])[0] as TestOutcome);
    if (c.route === 'RED_GREEN') {
      // A red that is an exception rather than a failed assertion shows that the test broke, not that the behavior is absent.
      for (const t of results.filter((r) => r.status === 'FAIL' && r.failure_kind !== 'ASSERTION')) {
        issues.push(`${c.criterion}: "${t.name}" fails with an error, not a failed assertion`);
      }
      if (!results.some((r) => r.status === 'FAIL' && r.failure_kind === 'ASSERTION')) {
        issues.push(`${c.criterion}: no named test fails by assertion against the unchanged application, so the proof does not show the behavior is missing`);
      }
    } else {
      for (const t of results.filter((r) => r.status !== 'PASS')) {
        issues.push(`${c.criterion}: "${t.name}" does not pass against the unchanged application, so the behavior is not already satisfied`);
      }
    }
  }
  return issues.length > 0 ? { outcome: 'NOT_DISCRIMINATING', issues } : { outcome: 'VALID', issues: [] };
}

// The candidate run with the controlled proof.
//   PASS   exit 0, every reported test passes, every proof test was reported
//   FAIL   anything else, with the reasons
export function classifyVerification(proof: Proof, outcome: ExecutionOutcome): Classification {
  const issues = setupProblems(outcome);
  resolve(proof, byName(outcome.tests), issues);
  for (const t of outcome.tests.filter((x) => x.status === 'FAIL' && x.failure_kind !== 'LOAD')) {
    issues.push(`"${t.name}" fails (${t.failure_kind})`);
  }
  if (issues.length === 0 && outcome.exit_code !== 0) issues.push(`the test command exited with ${outcome.exit_code}`);
  return issues.length > 0 ? { outcome: 'FAIL', issues } : { outcome: 'PASS', issues: [] };
}
