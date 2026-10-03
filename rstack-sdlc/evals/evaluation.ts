// Per-run evaluations: prepare, accept, adjudicate.
//
// An evaluation lives in `<run>/evaluation/<evaluation-id>/` and is the only
// place an evaluation may write. Files:
//   request.json        what was to be judged: run, rubric, and evidence identities
//   deterministic.json  the deterministic report at preparation time (no model)
//   evaluation.json     the judge's output (written by the judge session)
//   acceptance.json     the tool's verdict on that output: ACCEPTED or REJECTED
//   adjudication.jsonl  human adjudication, appended; it never edits the above
//
// An evaluation id is used once. Re-evaluating creates a new id; nothing is
// overwritten. The judge's claims and the deterministic report stay in
// separate files and are never merged into one score.

import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { asObject, asOneOf, asString, checkVersion, finish, newIssues, parseJson, type Parsed } from '../core/contracts/validate.ts';
import { ID_PATTERN, sha256Hex } from '../core/contracts/records.ts';
import { type DeterministicReport, evaluateDeterministic } from './deterministic.ts';
import { RUBRICS, type Rubric } from './rubrics.ts';

const ALLOWED_FILES = ['request.json', 'deterministic.json', 'evaluation.json', 'acceptance.json', 'adjudication.jsonl'];

// ---------------------------------------------------------------- evidence digest

// Digest of every file in the run directory except the evaluation area.
// Taken before and after an evaluation: equal digests mean the evaluation
// changed nothing it was judging.
export function evidenceDigest(runDir: string): { files: number; digest: string } {
  const list: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      const rel = relative(runDir, full).split(sep).join('/');
      if (rel === 'evaluation' || rel === 'lock') continue;
      if (statSync(full).isDirectory()) walk(full);
      else list.push(`${rel}:${sha256Hex(readFileSync(full))}`);
    }
  };
  walk(runDir);
  return { files: list.length, digest: sha256Hex(list.join('\n')) };
}

// ---------------------------------------------------------------- contracts

export interface EvaluationRequest {
  schema_version: 1;
  record_type: 'evaluation-request';
  evaluation_id: string;
  run_id: string;
  rubric: { id: string; sha256: string };
  identities: DeterministicReport['identities'];
  evidence: { files: number; digest: string };
  // The judge reads the rubric and the packet only. It is not shown the
  // deterministic report, earlier evaluations, or any expected answer.
  judge_reads: string[];
  judge_writes: string;
  // False when the packet's own records do not resolve; a semantic judgment of
  // unreliable evidence would be meaningless, so none is requested.
  judgeable: boolean;
  prepared_at: string;
}

export interface Answer {
  question: string;
  answer: string;
  evidence: string;
  note: string;
}

export interface Evaluation {
  schema_version: 1;
  record_type: 'run-evaluation';
  evaluation_id: string;
  rubric: string;
  run_id: string;
  judge: string;
  answers: Answer[];
  observations: string[];
  not_evaluated: string[];
}

function strings(v: unknown, path: string, issues: ReturnType<typeof newIssues>): void {
  if (!Array.isArray(v)) {
    issues.list.push(`${path}: expected a list`);
    return;
  }
  v.forEach((s, i) => asString(s, `${path}[${i}]`, issues, { max: 4000 }));
}

// Validates a judge's output against one rubric version. It checks that the
// output is complete and well-formed. It does not check that the judge is right.
export function parseEvaluation(text: string, rubric: Rubric, expected: { evaluation_id: string; run_id: string }): Parsed<Evaluation> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(raw, 'evaluation', ['schema_version', 'record_type', 'evaluation_id', 'rubric', 'run_id', 'judge', 'answers', 'observations', 'not_evaluated'], [], issues);
  if (!o) return finish(issues, () => raw as never);
  checkVersion(o.schema_version, 'evaluation.schema_version', issues);
  if (o.record_type !== 'run-evaluation') issues.list.push('evaluation.record_type: expected "run-evaluation"');
  if (o.evaluation_id !== expected.evaluation_id) issues.list.push('evaluation.evaluation_id: is not the id this evaluation was prepared under');
  if (o.run_id !== expected.run_id) issues.list.push('evaluation.run_id: is not the run this evaluation was prepared for');
  if (o.rubric !== rubric.id) issues.list.push(`evaluation.rubric: expected "${rubric.id}"`);
  asString(o.judge, 'evaluation.judge', issues, { max: 1000 });
  const expectedIds = rubric.questions.map((q) => q.id);
  const seen: string[] = [];
  if (!Array.isArray(o.answers)) issues.list.push('evaluation.answers: expected a list');
  else {
    o.answers.forEach((a, i) => {
      const p = `evaluation.answers[${i}]`;
      const item = asObject(a, p, ['question', 'answer', 'evidence', 'note'], [], issues);
      if (!item) return;
      const id = asString(item.question, `${p}.question`, issues, { max: 80 });
      if (!expectedIds.includes(id)) issues.list.push(`${p}.question: "${id}" is not a question of ${rubric.id}`);
      if (seen.includes(id)) issues.list.push(`${p}.question: "${id}" is answered twice`);
      seen.push(id);
      asOneOf(item.answer, `${p}.answer`, rubric.answers, issues);
      asString(item.evidence, `${p}.evidence`, issues, { max: 4000 });
      asString(item.note, `${p}.note`, issues, { max: 4000 });
    });
    for (const id of expectedIds) if (!seen.includes(id)) issues.list.push(`evaluation.answers: question "${id}" has no answer`);
  }
  strings(o.observations, 'evaluation.observations', issues);
  strings(o.not_evaluated, 'evaluation.not_evaluated', issues);
  return finish(issues, () => raw as Evaluation);
}

// ---------------------------------------------------------------- prepare and accept

export interface Acceptance {
  schema_version: 1;
  record_type: 'evaluation-acceptance';
  evaluation_id: string;
  status: 'ACCEPTED' | 'REJECTED';
  issues: string[];
  evaluation_sha256: string | null;
  evidence_before: string;
  evidence_after: string;
  evidence_unchanged: boolean;
  // What the judge says it is. The effective model is not observable here.
  judge: { self_reported: string | null; effective_model: 'UNAVAILABLE' };
  checked_at: string;
}

const dirOf = (runDir: string, id: string): string => join(runDir, 'evaluation', id);
const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;

export function nextEvaluationId(runDir: string): string {
  const root = join(runDir, 'evaluation');
  const used = existsSync(root) ? readdirSync(root) : [];
  for (let n = 1; ; n++) if (!used.includes(`EVAL-${n}`)) return `EVAL-${n}`;
}

export function prepareEvaluation(packageRoot: string, runDir: string, rubricId: string, options: { evaluationId?: string; now?: () => Date } = {}): EvaluationRequest {
  const rubric = RUBRICS[rubricId];
  if (!rubric) throw new Error(`unsupported rubric "${rubricId}"; supported: ${Object.keys(RUBRICS).join(', ')}`);
  const id = options.evaluationId ?? nextEvaluationId(runDir);
  if (!ID_PATTERN.test(id)) throw new Error('evaluation id has an invalid format');
  const dir = dirOf(runDir, id);
  if (existsSync(dir)) throw new Error(`evaluation "${id}" already exists; a new evaluation needs a new id`);
  const evidence = evidenceDigest(runDir);
  const deterministic = evaluateDeterministic(runDir);
  if (!deterministic.run_id) throw new Error('the run has no readable journal');
  const request: EvaluationRequest = {
    schema_version: 1,
    record_type: 'evaluation-request',
    evaluation_id: id,
    run_id: deterministic.run_id,
    rubric: { id: rubric.id, sha256: sha256Hex(readFileSync(join(packageRoot, rubric.file))) },
    identities: deterministic.identities,
    evidence,
    judge_reads: [rubric.file, 'the run directory without work/, exec/, and evaluation/'],
    judge_writes: `evaluation/${id}/evaluation.json`,
    judgeable: deterministic.packet.ok,
    prepared_at: (options.now ?? (() => new Date()))().toISOString(),
  };
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'request.json'), `${JSON.stringify(request, null, 2)}\n`);
  writeFileSync(join(dir, 'deterministic.json'), `${JSON.stringify(deterministic, null, 2)}\n`);
  return request;
}

// Checks a judge's output and records the verdict beside it. A rejected
// evaluation stays where it is, marked REJECTED; it is not deleted or fixed.
export function acceptEvaluation(runDir: string, id: string, now: () => Date = () => new Date()): Acceptance {
  const dir = dirOf(runDir, id);
  const requestFile = join(dir, 'request.json');
  if (!existsSync(requestFile)) throw new Error(`evaluation "${id}" was not prepared`);
  if (existsSync(join(dir, 'acceptance.json'))) return readJson<Acceptance>(join(dir, 'acceptance.json'));
  const request = readJson<EvaluationRequest>(requestFile);
  const rubric = RUBRICS[request.rubric.id] as Rubric;
  const issues: string[] = [];
  const file = join(dir, 'evaluation.json');
  let evaluationHash: string | null = null;
  let judge: string | null = null;
  if (!request.judgeable) issues.push('the packet did not resolve at preparation; no semantic judgment was requested');
  if (!existsSync(file)) issues.push('evaluation.json is missing');
  else {
    const text = readFileSync(file, 'utf8');
    evaluationHash = sha256Hex(text);
    const parsed = parseEvaluation(text, rubric, { evaluation_id: id, run_id: request.run_id });
    if (parsed.ok) judge = parsed.value.judge;
    else issues.push(...parsed.issues);
  }
  for (const name of readdirSync(dir)) if (!ALLOWED_FILES.includes(name)) issues.push(`unexpected file in the evaluation area: ${name}`);
  const after = evidenceDigest(runDir);
  if (after.digest !== request.evidence.digest) issues.push('the run evidence changed between preparation and acceptance');
  const acceptance: Acceptance = {
    schema_version: 1,
    record_type: 'evaluation-acceptance',
    evaluation_id: id,
    status: issues.length === 0 ? 'ACCEPTED' : 'REJECTED',
    issues,
    evaluation_sha256: evaluationHash,
    evidence_before: request.evidence.digest,
    evidence_after: after.digest,
    evidence_unchanged: after.digest === request.evidence.digest,
    judge: { self_reported: judge, effective_model: 'UNAVAILABLE' },
    checked_at: now().toISOString(),
  };
  writeFileSync(join(dir, 'acceptance.json'), `${JSON.stringify(acceptance, null, 2)}\n`);
  return acceptance;
}

// ---------------------------------------------------------------- human adjudication

export const ADJUDICATION_LABELS = ['CONFIRM', 'REJECT', 'MODIFY', 'UNRESOLVED'] as const;
export const ADJUDICATION_PROVENANCES = ['HUMAN_RECORDED', 'SCRIPTED'] as const;

// One appended line. CONFIRM keeps the judge's answer; REJECT and MODIFY
// state the human's answer beside it; UNRESOLVED records that the point was
// looked at and left open. The judge's file is never changed.
export interface Adjudication {
  schema_version: 1;
  record_type: 'adjudication';
  seq: number;
  evaluation_id: string;
  evaluation_sha256: string;
  question: string;
  label: (typeof ADJUDICATION_LABELS)[number];
  answer: string | null;
  note: string;
  recorded_by: string;
  // HUMAN_RECORDED is the recorder's claim that a human said this. SCRIPTED
  // entries are fixtures and are never counted as human calibration.
  provenance: (typeof ADJUDICATION_PROVENANCES)[number];
  at: string;
}

export function readAdjudications(runDir: string, id: string): Adjudication[] {
  const file = join(dirOf(runDir, id), 'adjudication.jsonl');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Adjudication);
}

export function adjudicate(
  runDir: string,
  id: string,
  entry: { question: string; label: string; answer?: string; note: string; recorded_by: string; provenance: string },
  now: () => Date = () => new Date(),
): Adjudication {
  const dir = dirOf(runDir, id);
  const acceptanceFile = join(dir, 'acceptance.json');
  if (!existsSync(acceptanceFile)) throw new Error('only an evaluation that has been checked can be adjudicated');
  const acceptance = readJson<Acceptance>(acceptanceFile);
  if (acceptance.status !== 'ACCEPTED' || !acceptance.evaluation_sha256) throw new Error('a rejected evaluation cannot be adjudicated');
  const request = readJson<EvaluationRequest>(join(dir, 'request.json'));
  const rubric = RUBRICS[request.rubric.id] as Rubric;
  if (!rubric.questions.some((q) => q.id === entry.question)) throw new Error(`"${entry.question}" is not a question of ${rubric.id}`);
  if (!(ADJUDICATION_LABELS as readonly string[]).includes(entry.label)) throw new Error(`label must be one of ${ADJUDICATION_LABELS.join(', ')}`);
  if (!(ADJUDICATION_PROVENANCES as readonly string[]).includes(entry.provenance)) throw new Error(`provenance must be one of ${ADJUDICATION_PROVENANCES.join(', ')}`);
  const needsAnswer = entry.label === 'REJECT' || entry.label === 'MODIFY';
  if (needsAnswer && !rubric.answers.includes(entry.answer ?? '')) throw new Error(`${entry.label} needs the human's answer, one of ${rubric.answers.join(', ')}`);
  if (!needsAnswer && entry.answer !== undefined) throw new Error(`${entry.label} takes no answer`);
  if (!entry.note.trim() || !entry.recorded_by.trim()) throw new Error('a note and recorded_by are required');
  if (sha256Hex(readFileSync(join(dir, 'evaluation.json'))) !== acceptance.evaluation_sha256) throw new Error('evaluation.json changed after it was accepted');
  const record: Adjudication = {
    schema_version: 1,
    record_type: 'adjudication',
    seq: readAdjudications(runDir, id).length + 1,
    evaluation_id: id,
    evaluation_sha256: acceptance.evaluation_sha256,
    question: entry.question,
    label: entry.label as Adjudication['label'],
    answer: needsAnswer ? (entry.answer as string) : null,
    note: entry.note,
    recorded_by: entry.recorded_by,
    provenance: entry.provenance as Adjudication['provenance'],
    at: now().toISOString(),
  };
  appendFileSync(join(dir, 'adjudication.jsonl'), `${JSON.stringify(record)}\n`);
  return record;
}

// ---------------------------------------------------------------- reading stored evaluations

export interface StoredEvaluation {
  evaluation_id: string;
  rubric: string | null;
  // PREPARED: no judge output checked yet. LEGACY: written before this tooling (no request or acceptance).
  status: 'ACCEPTED' | 'REJECTED' | 'PREPARED' | 'LEGACY';
  evaluation: Evaluation | null;
  evaluation_sha256: string | null;
  adjudications: Adjudication[];
}

export function listEvaluations(runDir: string): StoredEvaluation[] {
  const root = join(runDir, 'evaluation');
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .sort()
    .map((id) => {
      const dir = join(root, id);
      const file = join(dir, 'evaluation.json');
      const text = existsSync(file) ? readFileSync(file, 'utf8') : null;
      let evaluation: Evaluation | null = null;
      try {
        evaluation = text ? (JSON.parse(text) as Evaluation) : null;
      } catch {
        evaluation = null;
      }
      const acceptance = existsSync(join(dir, 'acceptance.json')) ? readJson<Acceptance>(join(dir, 'acceptance.json')) : null;
      const request = existsSync(join(dir, 'request.json')) ? readJson<EvaluationRequest>(join(dir, 'request.json')) : null;
      const status: StoredEvaluation['status'] = acceptance ? acceptance.status : request ? 'PREPARED' : 'LEGACY';
      return {
        evaluation_id: id,
        rubric: request?.rubric.id ?? evaluation?.rubric ?? null,
        status,
        evaluation: status === 'REJECTED' ? null : evaluation,
        evaluation_sha256: text ? sha256Hex(text) : null,
        adjudications: readAdjudications(runDir, id),
      };
    });
}
