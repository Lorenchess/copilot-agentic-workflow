// Per-run evaluations: prepare, accept, adjudicate.
//
// An evaluation has two areas in the run directory, and they are the only
// places an evaluation may write.
//
// `<run>/evaluation/<evaluation-id>/` is the judge's write area. It holds
// one file:
//   evaluation.json     the judge's output (written by the judge session)
//
// `<run>/evaluation-control/<evaluation-id>/` belongs to this tool. The judge
// is not told to read or write it, and nothing in the judge's area is ever
// read as control information:
//   request.json        what was to be judged: run, rubric, and evidence identities
//   deterministic.json  the deterministic report at preparation time (no model)
//   acceptance.json     the tool's verdict on the output: ACCEPTED or REJECTED
//   adjudication.jsonl  human adjudication, appended; it never edits the above
//
// Evaluations prepared before the areas were separated keep all five files
// in `evaluation/<id>/` (layout COLOCATED). They are read as recorded and are
// never moved or rewritten; a colocated evaluation that was not yet checked
// cannot be accepted any more.
//
// The separation is by location and instruction. A judge process with file
// access is not prevented from writing the control area; what is checked is
// stated at each check.
//
// An evaluation id is used once. Re-evaluating creates a new id; nothing is
// overwritten. The judge's claims and the deterministic report stay in
// separate files and are never merged into one score.

import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { asInt, asLiteral, asMap, asObject, asOneOf, asString, checkVersion, finish, type Issues, newIssues, parseJson, type Parsed } from '../core/contracts/validate.ts';
import { ID_PATTERN, sha256Hex } from '../core/contracts/records.ts';
import { type DeterministicReport, evaluateDeterministic } from './deterministic.ts';
import { RUBRICS, type Rubric } from './rubrics.ts';

const JUDGE_AREA = 'evaluation';
const CONTROL_AREA = 'evaluation-control';
const JUDGE_FILE = 'evaluation.json';
// What preparation writes. The verdict and adjudications are added to the control area later.
const PREPARED_FILES = ['request.json', 'deterministic.json'];

export type EvaluationLayout = 'SEPARATE' | 'COLOCATED';

// Where one evaluation's files are. `dir` is the judge's area; `control` is
// the evaluator's, which is the same directory only in the earlier layout.
function locate(runDir: string, id: string): { dir: string; control: string; layout: EvaluationLayout } {
  const dir = join(runDir, JUDGE_AREA, id);
  const control = join(runDir, CONTROL_AREA, id);
  return existsSync(control) ? { dir, control, layout: 'SEPARATE' } : { dir, control: dir, layout: 'COLOCATED' };
}

const namesIn = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).sort() : []);

// ---------------------------------------------------------------- evidence digest

// Digest of every file in the run directory except the two evaluation areas.
// Taken before and after an evaluation: equal digests mean the evaluation
// changed nothing it was judging.
export function evidenceDigest(runDir: string): { files: number; digest: string } {
  const list: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      const rel = relative(runDir, full).split(sep).join('/');
      if (rel === JUDGE_AREA || rel === CONTROL_AREA || rel === 'lock') continue;
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
  // Names present in the judge area root when this evaluation was prepared.
  // An evaluation in the earlier layout that is not listed here appeared
  // afterwards and is not aggregated. Absent in requests of the earlier layout.
  judge_area_before?: string[];
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

// ---------------------------------------------------------------- stored control records
//
// A control record is read back only as what this tool writes. These checks
// say what is wrong with one; an empty list means it can be relied on. They
// check the record's form and that it agrees with itself, not who wrote it.

const HEX64 = /^[0-9a-f]{64}$/;

// A time as this tool records one: the form `toISOString` writes, and nothing looser.
function asTime(v: unknown, path: string, issues: Issues): void {
  if (typeof v !== 'string' || Number.isNaN(Date.parse(v)) || new Date(v).toISOString() !== v) issues.list.push(`${path}: expected a recorded time`);
}

function checkRequest(raw: unknown, id: string): string[] {
  const issues = newIssues();
  const o = asObject(raw, 'request', ['schema_version', 'record_type', 'evaluation_id', 'run_id', 'rubric', 'identities', 'evidence', 'judge_reads', 'judge_writes', 'judgeable', 'prepared_at'], ['judge_area_before'], issues);
  if (!o) return issues.list;
  checkVersion(o.schema_version, 'request.schema_version', issues);
  asLiteral(o.record_type, 'request.record_type', 'evaluation-request', issues);
  if (o.evaluation_id !== id) issues.list.push('request.evaluation_id: is not the id of this evaluation');
  asString(o.run_id, 'request.run_id', issues, { max: 200 });
  const rubric = asObject(o.rubric, 'request.rubric', ['id', 'sha256'], [], issues);
  if (rubric) {
    if (typeof rubric.id !== 'string' || !Object.hasOwn(RUBRICS, rubric.id)) issues.list.push('request.rubric.id: is not a supported rubric');
    asString(rubric.sha256, 'request.rubric.sha256', issues, { pattern: HEX64 });
  }
  asMap(o.identities, 'request.identities', /./, issues);
  const evidence = asObject(o.evidence, 'request.evidence', ['files', 'digest'], [], issues);
  if (evidence) {
    asInt(evidence.files, 'request.evidence.files', 0, Number.MAX_SAFE_INTEGER, issues);
    asString(evidence.digest, 'request.evidence.digest', issues, { pattern: HEX64 });
  }
  strings(o.judge_reads, 'request.judge_reads', issues);
  asString(o.judge_writes, 'request.judge_writes', issues, { max: 400 });
  if (typeof o.judgeable !== 'boolean') issues.list.push('request.judgeable: expected true or false');
  if (Object.hasOwn(o, 'judge_area_before')) strings(o.judge_area_before, 'request.judge_area_before', issues);
  // Without a readable preparation time the evaluation has no place in the order.
  asTime(o.prepared_at, 'request.prepared_at', issues);
  return issues.list;
}

function checkAcceptance(raw: unknown, id: string): string[] {
  const issues = newIssues();
  const o = asObject(raw, 'acceptance', ['schema_version', 'record_type', 'evaluation_id', 'status', 'issues', 'evaluation_sha256', 'evidence_before', 'evidence_after', 'evidence_unchanged', 'judge', 'checked_at'], [], issues);
  if (!o) return issues.list;
  checkVersion(o.schema_version, 'acceptance.schema_version', issues);
  asLiteral(o.record_type, 'acceptance.record_type', 'evaluation-acceptance', issues);
  if (o.evaluation_id !== id) issues.list.push('acceptance.evaluation_id: is not the id of this evaluation');
  asOneOf(o.status, 'acceptance.status', ['ACCEPTED', 'REJECTED'], issues);
  strings(o.issues, 'acceptance.issues', issues);
  if (o.evaluation_sha256 !== null) asString(o.evaluation_sha256, 'acceptance.evaluation_sha256', issues, { pattern: HEX64 });
  asString(o.evidence_before, 'acceptance.evidence_before', issues, { pattern: HEX64 });
  asString(o.evidence_after, 'acceptance.evidence_after', issues, { pattern: HEX64 });
  if (o.evidence_unchanged !== (o.evidence_before === o.evidence_after)) issues.list.push('acceptance.evidence_unchanged: does not agree with the two evidence digests');
  const judge = asObject(o.judge, 'acceptance.judge', ['self_reported', 'effective_model'], [], issues);
  if (judge) {
    if (judge.self_reported !== null) asString(judge.self_reported, 'acceptance.judge.self_reported', issues, { max: 1000 });
    asLiteral(judge.effective_model, 'acceptance.judge.effective_model', 'UNAVAILABLE', issues);
  }
  asTime(o.checked_at, 'acceptance.checked_at', issues);
  // The verdict is ACCEPTED exactly when the check found nothing.
  const found = Array.isArray(o.issues) ? o.issues.length : 0;
  if (o.status === 'ACCEPTED') {
    if (found > 0) issues.list.push('acceptance.issues: an accepted evaluation records no issue');
    if (o.evaluation_sha256 === null) issues.list.push('acceptance.evaluation_sha256: an accepted evaluation names its content');
    if (o.evidence_unchanged !== true) issues.list.push('acceptance.evidence_unchanged: an accepted evaluation left the evidence unchanged');
  } else if (o.status === 'REJECTED' && found === 0) issues.list.push('acceptance.issues: a rejected evaluation records why');
  return issues.list;
}

// A verdict is given on a request: one on another evidence baseline is not this evaluation's.
function checkPair(request: EvaluationRequest, acceptance: Acceptance): string[] {
  return acceptance.evidence_before === request.evidence.digest ? [] : ['acceptance.json does not carry the evidence digest of request.json'];
}

// Reads one control record for a command. A record that is not valid is
// refused by name; the command stops, and the record is left as found.
function controlRecord<T>(control: string, name: string, id: string, check: (raw: unknown, id: string) => string[]): T {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(control, name), 'utf8'));
  } catch {
    throw new Error(`evaluation "${id}": ${name} is not valid JSON`);
  }
  const problems = check(raw, id);
  if (problems.length > 0) throw new Error(`evaluation "${id}": ${name} is not a valid record (${problems.join('; ')})`);
  return raw as T;
}

// The request and verdict of a checked evaluation, for a command. Each must be a valid record and the two must
// belong together, as the reader requires; otherwise the command stops and nothing is written.
function checkedPair(control: string, id: string): { request: EvaluationRequest; acceptance: Acceptance } {
  if (!existsSync(join(control, 'request.json'))) throw new Error(`evaluation "${id}": acceptance.json has no request.json`);
  const request = controlRecord<EvaluationRequest>(control, 'request.json', id, checkRequest);
  const acceptance = controlRecord<Acceptance>(control, 'acceptance.json', id, checkAcceptance);
  const problems = checkPair(request, acceptance);
  if (problems.length > 0) throw new Error(`evaluation "${id}": ${problems.join('; ')}`);
  return { request, acceptance };
}

// Every evaluation id of a run, from either area.
function evaluationIds(runDir: string): string[] {
  return [...new Set([...namesIn(join(runDir, JUDGE_AREA)), ...namesIn(join(runDir, CONTROL_AREA))])];
}

export function nextEvaluationId(runDir: string): string {
  const used = evaluationIds(runDir);
  for (let n = 1; ; n++) if (!used.includes(`EVAL-${n}`)) return `EVAL-${n}`;
}

export function prepareEvaluation(packageRoot: string, runDir: string, rubricId: string, options: { evaluationId?: string; now?: () => Date } = {}): EvaluationRequest {
  const rubric = RUBRICS[rubricId];
  if (!rubric) throw new Error(`unsupported rubric "${rubricId}"; supported: ${Object.keys(RUBRICS).join(', ')}`);
  const id = options.evaluationId ?? nextEvaluationId(runDir);
  if (!ID_PATTERN.test(id)) throw new Error('evaluation id has an invalid format');
  const dir = join(runDir, JUDGE_AREA, id);
  const control = join(runDir, CONTROL_AREA, id);
  if (existsSync(dir) || existsSync(control)) throw new Error(`evaluation "${id}" already exists; a new evaluation needs a new id`);
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
    judge_reads: [rubric.file, 'the run directory without work/, exec/, evaluation/, and evaluation-control/'],
    judge_writes: `evaluation/${id}/evaluation.json`,
    judgeable: deterministic.packet.ok,
    judge_area_before: namesIn(join(runDir, JUDGE_AREA)),
    prepared_at: (options.now ?? (() => new Date()))().toISOString(),
  };
  mkdirSync(control, { recursive: true });
  writeFileSync(join(control, 'request.json'), `${JSON.stringify(request, null, 2)}\n`);
  writeFileSync(join(control, 'deterministic.json'), `${JSON.stringify(deterministic, null, 2)}\n`);
  // The judge's area starts empty: no control file is ever placed in it.
  mkdirSync(dir, { recursive: true });
  return request;
}

// Checks a judge's output and records the verdict in the control area. A
// rejected evaluation stays where it is, marked REJECTED; it is not deleted
// or fixed. The verdict is written once: a later call returns the recorded
// one, read from the control area only, and only when the request and verdict
// on file are valid records that belong together. Otherwise it refuses and
// writes nothing.
export function acceptEvaluation(runDir: string, id: string, now: () => Date = () => new Date()): Acceptance {
  const { dir, control, layout } = locate(runDir, id);
  const requestFile = join(control, 'request.json');
  if (!existsSync(requestFile)) throw new Error(`evaluation "${id}" was not prepared`);
  if (existsSync(join(control, 'acceptance.json'))) return checkedPair(control, id).acceptance;
  // In the earlier layout a verdict or an adjudication found here could have been written by the judge.
  if (layout === 'COLOCATED') {
    throw new Error(`evaluation "${id}" was prepared in the earlier layout, with its control files in the judge's write area; it cannot be accepted now. Prepare a new evaluation`);
  }
  // A request that is not a valid record of this evaluation is refused here; no verdict is written on top of it.
  const request = controlRecord<EvaluationRequest>(control, 'request.json', id, checkRequest);
  const rubric = RUBRICS[request.rubric.id] as Rubric;
  const issues: string[] = [];
  const file = join(dir, 'evaluation.json');
  let evaluationHash: string | null = null;
  let judge: string | null = null;
  if (!request.judgeable) issues.push('the packet did not resolve at preparation; no semantic judgment was requested');
  // Recomputed from the run's own records, so this check does not rest on the stored request.
  else if (!evaluateDeterministic(runDir).packet.ok) issues.push('the packet does not resolve at acceptance');
  if (!existsSync(file)) issues.push('evaluation.json is missing');
  else {
    const text = readFileSync(file, 'utf8');
    evaluationHash = sha256Hex(text);
    const parsed = parseEvaluation(text, rubric, { evaluation_id: id, run_id: request.run_id });
    if (parsed.ok) judge = parsed.value.judge;
    else issues.push(...parsed.issues);
  }
  // The judge writes one file. Anything else in its area, a control file above all, rejects the evaluation.
  for (const name of namesIn(dir)) if (name !== JUDGE_FILE) issues.push(`unexpected file in the evaluation area: ${name}`);
  // Before the first verdict the control area holds what preparation wrote and nothing more.
  for (const name of namesIn(control)) if (!PREPARED_FILES.includes(name)) issues.push(`unexpected file in the control area before acceptance: ${name}`);
  // Nor does the judge create evaluations: a name in its area that preparation did not put there has no control record.
  for (const name of namesIn(join(runDir, JUDGE_AREA))) {
    if (name !== id && !(request.judge_area_before ?? []).includes(name) && !existsSync(join(runDir, CONTROL_AREA, name))) issues.push(`the judge area gained "${name}" during this evaluation`);
  }
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
  writeFileSync(join(control, 'acceptance.json'), `${JSON.stringify(acceptance, null, 2)}\n`);
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

// What is wrong with one stored line, as the entry at position `seq` under `rubric`: the same rules `adjudicate`
// applies before it writes one. That the line names this evaluation's accepted content is checked where it is read.
function checkAdjudication(raw: unknown, seq: number, rubric: Rubric): string[] {
  const issues = newIssues();
  const o = asObject(raw, 'adjudication', ['schema_version', 'record_type', 'seq', 'evaluation_id', 'evaluation_sha256', 'question', 'label', 'answer', 'note', 'recorded_by', 'provenance', 'at'], [], issues);
  if (!o) return issues.list;
  checkVersion(o.schema_version, 'adjudication.schema_version', issues);
  asLiteral(o.record_type, 'adjudication.record_type', 'adjudication', issues);
  if (o.seq !== seq) issues.list.push(`adjudication.seq: expected ${seq}`);
  if (!rubric.questions.some((q) => q.id === o.question)) issues.list.push(`adjudication.question: "${String(o.question)}" is not a question of ${rubric.id}`);
  asOneOf(o.label, 'adjudication.label', ADJUDICATION_LABELS, issues);
  if (o.label === 'REJECT' || o.label === 'MODIFY') {
    if (typeof o.answer !== 'string' || !rubric.answers.includes(o.answer)) issues.list.push(`adjudication.answer: ${o.label} needs an answer of ${rubric.id}`);
  } else if (o.answer !== null) issues.list.push(`adjudication.answer: ${String(o.label)} takes no answer`);
  asString(o.note, 'adjudication.note', issues);
  asString(o.recorded_by, 'adjudication.recorded_by', issues);
  asOneOf(o.provenance, 'adjudication.provenance', ADJUDICATION_PROVENANCES, issues);
  asTime(o.at, 'adjudication.at', issues);
  return issues.list;
}

export function readAdjudications(runDir: string, id: string): Adjudication[] {
  const file = join(locate(runDir, id).control, 'adjudication.jsonl');
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
  const { dir, control } = locate(runDir, id);
  const acceptanceFile = join(control, 'acceptance.json');
  if (!existsSync(acceptanceFile)) throw new Error('only an evaluation that has been checked can be adjudicated');
  const { request, acceptance } = checkedPair(control, id);
  if (acceptance.status !== 'ACCEPTED' || !acceptance.evaluation_sha256) throw new Error('a rejected evaluation cannot be adjudicated');
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
  appendFileSync(join(control, 'adjudication.jsonl'), `${JSON.stringify(record)}\n`);
  return record;
}

// ---------------------------------------------------------------- reading stored evaluations

export interface StoredEvaluation {
  evaluation_id: string;
  rubric: string | null;
  // As recorded. PREPARED: no judge output checked yet. LEGACY: written before this tooling (no request or acceptance).
  // INVALID: a request or verdict is on file and is not a valid record, or the two do not belong together; what was
  // recorded is unknown, so it is not read as accepted, rejected, or prepared.
  status: 'ACCEPTED' | 'REJECTED' | 'PREPARED' | 'LEGACY' | 'INVALID';
  layout: EvaluationLayout;
  // Null without a valid request: the evaluation then has no place in the order.
  prepared_at: string | null;
  // The request and verdict files as they are now; null when absent. Copies of a run are compared on these too.
  control_sha256: { request: string | null; acceptance: string | null };
  // The judge's output. Null when rejected, and when the file is no longer the content that was accepted.
  evaluation: Evaluation | null;
  // The file as it is now, and the content the acceptance recorded.
  evaluation_sha256: string | null;
  accepted_sha256: string | null;
  // Entries made on the accepted content. Others are left out and named in `issues`.
  adjudications: Adjudication[];
  // What no longer agrees with the control record. An evaluation with any issue is listed, never aggregated.
  issues: string[];
}

// EVAL-2 before EVAL-10: a trailing number is compared as a number.
function compareIds(a: string, b: string): number {
  const [, pa = '', na = ''] = /^(.*?)(\d*)$/.exec(a) ?? [];
  const [, pb = '', nb = ''] = /^(.*?)(\d*)$/.exec(b) ?? [];
  if (pa !== pb) return pa < pb ? -1 : 1;
  if (na !== nb) return Number(na) - Number(nb) || (na < nb ? -1 : 1);
  return 0;
}

// Oldest first: by the time each evaluation was prepared, then by id. Times
// are compared as instants, not as text: `toISOString` writes a year outside
// 0000-9999 with a sign and six digits, and those do not sort as text. The
// order never depends on how names sort as text. Evaluations without a
// valid request carry no time and come last, by id.
export function listEvaluations(runDir: string): StoredEvaluation[] {
  const ids = evaluationIds(runDir);
  // A record that is absent is null. One that is present and not valid is null too, with the reason in `issues`.
  const read = <T>(control: string, name: string, id: string, check: (raw: unknown, id: string) => string[], issues: string[]): T | null => {
    if (!existsSync(join(control, name))) return null;
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(control, name), 'utf8'));
    } catch {
      issues.push(`${name} is not readable`);
      return null;
    }
    const problems = check(raw, id);
    if (problems.length === 0) return raw as T;
    issues.push(`${name} is not a valid record: ${problems.join('; ')}`);
    return null;
  };
  const hashOf = (file: string): string | null => (existsSync(file) ? sha256Hex(readFileSync(file)) : null);
  // Judge-area listings recorded by the separated requests of this run.
  const before: string[][] = [];
  const stored = ids.map((id): StoredEvaluation => {
    const { dir, control, layout } = locate(runDir, id);
    const issues: string[] = [];
    const file = join(dir, JUDGE_FILE);
    const text = existsSync(file) ? readFileSync(file, 'utf8') : null;
    let evaluation: Evaluation | null = null;
    try {
      evaluation = text ? (JSON.parse(text) as Evaluation) : null;
    } catch {
      evaluation = null;
    }
    const acceptance = read<Acceptance>(control, 'acceptance.json', id, checkAcceptance, issues);
    const request = read<EvaluationRequest>(control, 'request.json', id, checkRequest, issues);
    const controlHashes = { request: hashOf(join(control, 'request.json')), acceptance: hashOf(join(control, 'acceptance.json')) };
    // A verdict is given on a request: one without it, or on another evidence baseline, is not this evaluation's.
    if (acceptance && controlHashes.request === null) issues.push('acceptance.json has no request.json');
    else if (acceptance && request) issues.push(...checkPair(request, acceptance));
    if (layout === 'SEPARATE' && request) before.push(request.judge_area_before ?? []);
    // Every issue so far is about the control records themselves. With one, the recorded status is not relied on,
    // and the evaluation is not read as merely prepared or absent either.
    const status: StoredEvaluation['status'] = issues.length > 0 ? 'INVALID' : acceptance ? acceptance.status : request ? 'PREPARED' : 'LEGACY';
    const currentHash = text === null ? null : sha256Hex(text);
    const acceptedHash = acceptance?.evaluation_sha256 ?? null;

    // Control information is read from the control area only; a copy in the judge's area is reported, never used.
    if (layout === 'SEPARATE') for (const name of namesIn(dir)) if (name !== JUDGE_FILE) issues.push(`unexpected file in the evaluation area: ${name}`);
    const unchanged = status !== 'ACCEPTED' || (currentHash !== null && currentHash === acceptedHash);
    if (!unchanged) issues.push('evaluation.json is not the content that was accepted');

    const adjudications: Adjudication[] = [];
    const adjudicationFile = join(control, 'adjudication.jsonl');
    const lines = existsSync(adjudicationFile) ? readFileSync(adjudicationFile, 'utf8').split('\n').filter(Boolean) : [];
    lines.forEach((line, i) => {
      let entry: Adjudication | null = null;
      try {
        entry = JSON.parse(line) as Adjudication;
      } catch {
        entry = null;
      }
      if (status !== 'ACCEPTED') issues.push(`adjudication entry ${i + 1} is on an evaluation that was not accepted`);
      else if (!entry || entry.evaluation_id !== id || entry.evaluation_sha256 !== acceptedHash) issues.push(`adjudication entry ${i + 1} does not name the accepted content of this evaluation`);
      else {
        // An accepted evaluation has a valid request, so its rubric is known.
        const problems = checkAdjudication(entry, i + 1, RUBRICS[(request as EvaluationRequest).rubric.id] as Rubric);
        if (problems.length > 0) issues.push(`adjudication entry ${i + 1} is not a valid adjudication record: ${problems.join('; ')}`);
        else adjudications.push(entry);
      }
    });

    return {
      evaluation_id: id,
      // An INVALID evaluation's rubric is taken from a valid request only, never from the judge's file.
      rubric: request?.rubric.id ?? (status === 'INVALID' ? null : (evaluation?.rubric ?? null)),
      status,
      layout,
      prepared_at: request?.prepared_at ?? null,
      control_sha256: controlHashes,
      evaluation: status === 'REJECTED' || status === 'INVALID' || !unchanged ? null : evaluation,
      evaluation_sha256: currentHash,
      accepted_sha256: acceptedHash,
      adjudications,
      issues,
    };
  });

  // Since the areas were separated, preparation never writes control files into the judge's area. An evaluation
  // that claims them there, and was not present when a separated evaluation of this run was prepared, did not
  // come from this tool.
  for (const e of stored) {
    if (e.layout === 'COLOCATED' && e.status !== 'LEGACY' && before.some((names) => !names.includes(e.evaluation_id))) {
      e.issues.push("control files in the judge area appeared after this run's control area was separated");
    }
  }

  // A time is present only with a valid request, so it always parses.
  const instant = (e: StoredEvaluation): number | null => (e.prepared_at === null ? null : Date.parse(e.prepared_at));
  return stored.sort((a, b) => {
    const ta = instant(a);
    const tb = instant(b);
    if (ta !== tb) {
      if (ta === null) return 1;
      if (tb === null) return -1;
      return ta < tb ? -1 : 1;
    }
    return compareIds(a.evaluation_id, b.evaluation_id);
  });
}
