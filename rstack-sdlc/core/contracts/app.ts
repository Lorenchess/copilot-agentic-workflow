// Records for work on the application under change: its configuration, the
// controlled proof, a retained file tree, an execution record, and a review.
// As elsewhere, these parsers check shape and cross-references only.

import type { TestOutcome } from './ports.ts';
import { type Coverage, type Finding, asArray, checkCoverage, checkFindings } from './planning.ts';
import { REF_PATTERN } from './records.ts';
import {
  type Parsed,
  asInt,
  asObject,
  asOneOf,
  asString,
  checkVersion,
  finish,
  newIssues,
  parseJson,
} from './validate.ts';

const MAX_TEXT = 4000;
// A relative path of plain segments: no "..", no leading dot, no backslash, no drive.
const SAFE_PATH = /^[A-Za-z0-9_][A-Za-z0-9._-]*(\/[A-Za-z0-9_][A-Za-z0-9._-]*)*$/;
const AC_ID = /^AC-[0-9]{1,3}$/;
const TEST_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9._*/-]{0,200}$/;
const TEST_PATTERN_SEGMENT = /^[A-Za-z0-9_*][A-Za-z0-9._*-]*$/;
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

// A test pattern is handed to the runner as an argument and expanded under
// the measured application copy. It must not look like an option, and no
// part of it may name anything outside that tree: a relative glob of plain
// segments, with no "..", ".", empty or dot-leading segment, no backslash,
// no drive, no absolute form. It is refused, never rewritten. Returns what
// is wrong with the pattern, or null.
export function testPatternProblem(pattern: string): string | null {
  if (!TEST_PATTERN.test(pattern)) return 'has an invalid format';
  const bad = pattern.split('/').find((segment) => !TEST_PATTERN_SEGMENT.test(segment));
  return bad === undefined ? null : `segment "${bad}" could leave the application tree`;
}

// ---------------------------------------------------------------- application configuration

export interface AppConfig {
  schema_version: 1;
  record_type: 'app-config';
  // `env` names the variables the tests need from the caller's environment.
  // Only those, and the executor's own runtime set, reach the test process.
  test: { runner: string; patterns: string[]; timeout_seconds: number; env?: string[] };
  // Where controlled tests live. Only the proof stage may write there.
  controlled_tests_dir: string;
  // Files no role may change: they define how the proof is run.
  protected: string[];
}

export function parseAppConfig(text: string): Parsed<AppConfig> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(raw, 'app', ['schema_version', 'record_type', 'test', 'controlled_tests_dir', 'protected'], [], issues);
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'app.schema_version', issues);
  if (o.record_type !== 'app-config') issues.list.push('app.record_type: expected "app-config"');
  const t = asObject(o.test, 'app.test', ['runner', 'patterns', 'timeout_seconds'], ['env'], issues);
  if (t) {
    asString(t.runner, 'app.test.runner', issues, { pattern: /^[a-z][a-z0-9-]{0,40}$/ });
    const patterns = asArray(t.patterns, 'app.test.patterns', issues, 10);
    if (patterns.length === 0) issues.list.push('app.test.patterns: at least one pattern is required');
    patterns.forEach((p, i) => {
      const problem = testPatternProblem(asString(p, `app.test.patterns[${i}]`, issues, { allowEmpty: true }));
      if (typeof p === 'string' && problem) issues.list.push(`app.test.patterns[${i}]: ${problem}`);
    });
    asInt(t.timeout_seconds, 'app.test.timeout_seconds', 1, 300, issues);
    if (t.env !== undefined) {
      // Names only; a value is never part of the configuration. Variable names are
      // not case-sensitive on every platform, so two spellings of one name are refused.
      const seen: string[] = [];
      asArray(t.env, 'app.test.env', issues, 20).forEach((n, i) => {
        const name = asString(n, `app.test.env[${i}]`, issues, { pattern: ENV_NAME }).toUpperCase();
        if (seen.includes(name)) issues.list.push(`app.test.env[${i}]: "${name}" is declared twice`);
        seen.push(name);
      });
    }
  }
  asString(o.controlled_tests_dir, 'app.controlled_tests_dir', issues, { pattern: SAFE_PATH });
  asArray(o.protected, 'app.protected', issues, 50).forEach((p, i) => asString(p, `app.protected[${i}]`, issues, { pattern: SAFE_PATH }));
  return finish(issues, () => raw as AppConfig);
}

// ---------------------------------------------------------------- file tree

export interface TreeFile {
  path: string;
  sha256: string;
  bytes: number;
}

// A measured file tree. Its identity is the hash of this record, so two trees
// are the same candidate exactly when every path and every byte agree. This
// is what identifies uncommitted work; a commit id would not.
export interface TreeManifest {
  schema_version: 1;
  record_type: 'tree';
  files: TreeFile[];
}

// ---------------------------------------------------------------- controlled proof

export const PROOF_ROUTES = ['RED_GREEN', 'ALREADY_SATISFIED'] as const;

// How each acceptance criterion of the specification is proven.
// RED_GREEN: the named tests must fail by assertion against the unchanged
// application and pass against the candidate.
// ALREADY_SATISFIED: the behavior exists today; the named tests must pass
// against the unchanged application and still pass against the candidate.
export interface Proof {
  schema_version: 1;
  record_type: 'proof';
  criteria: { criterion: string; route: (typeof PROOF_ROUTES)[number]; tests: string[]; rationale: string }[];
}

// `criteria` are the specification's criterion ids: each must be proven
// exactly once, and nothing else may be claimed.
export function parseProof(text: string, criteria: readonly string[]): Parsed<Proof> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(raw, 'proof', ['schema_version', 'record_type', 'criteria'], [], issues);
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'proof.schema_version', issues);
  if (o.record_type !== 'proof') issues.list.push('proof.record_type: expected "proof"');
  const seen: string[] = [];
  const names: string[] = [];
  asArray(o.criteria, 'proof.criteria', issues).forEach((c, i) => {
    const p = `proof.criteria[${i}]`;
    const item = asObject(c, p, ['criterion', 'route', 'tests', 'rationale'], [], issues);
    if (!item) return;
    const id = asString(item.criterion, `${p}.criterion`, issues, { pattern: AC_ID });
    if (!criteria.includes(id)) issues.list.push(`${p}.criterion: "${id}" is not in the specification`);
    if (seen.includes(id)) issues.list.push(`${p}.criterion: "${id}" appears twice`);
    seen.push(id);
    asOneOf(item.route, `${p}.route`, PROOF_ROUTES, issues);
    asString(item.rationale, `${p}.rationale`, issues, { max: MAX_TEXT });
    const tests = asArray(item.tests, `${p}.tests`, issues, 20);
    if (tests.length === 0) issues.list.push(`${p}.tests: at least one test must be named`);
    tests.forEach((t, j) => {
      const name = asString(t, `${p}.tests[${j}]`, issues, { max: 300 });
      if (names.includes(name)) issues.list.push(`${p}.tests[${j}]: test "${name}" is named twice`);
      names.push(name);
    });
  });
  for (const id of criteria) {
    if (!seen.includes(id)) issues.list.push(`proof.criteria: ${id} has no proof`);
  }
  return finish(issues, () => raw as Proof);
}

// ---------------------------------------------------------------- execution record

export type ExecutionPurpose = 'PROOF_BASELINE' | 'CANDIDATE_VERIFICATION';

// What was actually run, on what, and what happened. `tree` is the exact
// file tree executed. `output` is the retained raw report.
export interface ExecutionRecord {
  schema_version: 1;
  record_type: 'execution';
  // The engine ran the command itself. This holds whatever produced the files it ran.
  evidence_class: 'ACTUAL_LOCAL_EXECUTION';
  purpose: ExecutionPurpose;
  executor: string;
  command: string[];
  // Relative to the run directory.
  working_directory: string;
  tree: string;
  app_config: string;
  proof: string;
  specification: string;
  final_plan: string;
  environment: Record<string, string>;
  exit_code: number | null;
  timed_out: boolean;
  duration_ms: number;
  tests: TestOutcome[];
  output: string;
  classification: { outcome: string; issues: string[] };
}

// ---------------------------------------------------------------- review

export const REVIEW_VERDICTS = ['ACCEPT', 'REJECT', 'INCONCLUSIVE'] as const;

export interface Review {
  schema_version: 1;
  record_type: 'review-result';
  subject: { candidate: string; verification: string; spec: string; proof: string };
  verdict: (typeof REVIEW_VERDICTS)[number];
  coverage: Coverage[];
  findings: Finding[];
  limitations: string[];
}

// A review counts only for the exact candidate, verification, specification,
// and proof it names, and those must be the ones the reviewer was given.
export function parseReview(text: string, subject: Review['subject']): Parsed<Review> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(raw, 'review', ['schema_version', 'record_type', 'subject', 'verdict', 'coverage', 'findings', 'limitations'], [], issues);
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'review.schema_version', issues);
  if (o.record_type !== 'review-result') issues.list.push('review.record_type: expected "review-result"');
  const s = asObject(o.subject, 'review.subject', ['candidate', 'verification', 'spec', 'proof'], [], issues);
  if (s) {
    for (const key of ['candidate', 'verification', 'spec', 'proof'] as const) {
      if (asString(s[key], `review.subject.${key}`, issues, { pattern: REF_PATTERN }) !== subject[key]) {
        issues.list.push(`review.subject.${key}: is not the ${key} this review was given`);
      }
    }
  }
  const verdict = asOneOf(o.verdict, 'review.verdict', REVIEW_VERDICTS, issues);
  const checked = checkCoverage(o.coverage, 'review', issues);
  const findings = checkFindings(o.findings, 'review', issues);
  if (verdict === 'REJECT' && findings === 0) issues.list.push('review.findings: a REJECT verdict needs at least one finding');
  if (verdict === 'ACCEPT' && checked === 0) {
    issues.list.push('review.verdict: ACCEPT needs at least one CHECKED coverage item; use INCONCLUSIVE when nothing was examined');
  }
  const limitations = asArray(o.limitations, 'review.limitations', issues);
  limitations.forEach((l, i) => asString(l, `review.limitations[${i}]`, issues, { max: MAX_TEXT }));
  if (verdict === 'INCONCLUSIVE' && limitations.length === 0) {
    issues.list.push('review.limitations: an INCONCLUSIVE verdict must state what prevented a conclusion');
  }
  return finish(issues, () => raw as Review);
}
