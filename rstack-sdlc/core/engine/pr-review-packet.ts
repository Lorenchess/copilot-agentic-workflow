// Assembles the PR review packet: one record of identities and measured facts
// that a submission review may rely on.
//
// Everything in it is derived from the run's retained records and from the
// journal up to a fixed record, so the same run state always yields the same
// bytes. The engine builds it once, and later builds it again from what is
// retained and compares: a packet whose dependencies have changed, gone
// missing, or stopped agreeing with each other is refused, never repaired.
//
// The packet carries no account of the work. It names records; it does not
// summarize them.

import { type ExecutionRecord, type TreeManifest, parseReview } from '../contracts/app.ts';
import type { FinalPlan } from '../contracts/planning.ts';
import { type ChangeSet, type PathChange, type PrReviewPacket, COMPOSER_FORMAT } from '../contracts/pr-review.ts';
import { type JournalEvent, type RoleResult, refOf } from '../contracts/records.ts';
import { EngineBlock } from './errors.ts';
import type { RunState } from './state.ts';

export interface PacketSources {
  state: RunState;
  // The run's journal records, in order, and the exact bytes of the journal file.
  events: JournalEvent[];
  journal: Uint8Array;
  // The packet covers journal records 1 to `cutoff`.
  cutoff: number;
  // Reads retained bytes by identity and refuses bytes that no longer match it.
  read(name: string, ref: string | undefined): string;
}

// Records a superseded result may have produced that are application trees.
const HISTORY_TREES = ['proof_tree', 'candidate'];

function inconsistent(why: string, detail: Record<string, unknown> = {}): never {
  throw new EngineBlock('PR_REVIEW_EVIDENCE_INCONSISTENT', `the evidence for a PR review does not agree with itself: ${why}`, detail);
}

// Paths whose bytes differ between two trees, with the identity of the bytes on each side.
export function changeSet(before: TreeManifest, after: TreeManifest): ChangeSet {
  const a = new Map(before.files.map((f) => [f.path, f.sha256]));
  const b = new Map(after.files.map((f) => [f.path, f.sha256]));
  const paths: PathChange[] = [];
  for (const path of [...new Set([...a.keys(), ...b.keys()])].sort()) {
    const from = a.get(path);
    const to = b.get(path);
    if (from === to) continue;
    paths.push({
      path,
      change: from === undefined ? 'ADDED' : to === undefined ? 'DELETED' : 'MODIFIED',
      before: from === undefined ? null : `sha256:${from}`,
      after: to === undefined ? null : `sha256:${to}`,
    });
  }
  const count = (change: PathChange['change']): number => paths.filter((p) => p.change === change).length;
  return { added: count('ADDED'), modified: count('MODIFIED'), deleted: count('DELETED'), paths };
}

// Identity of the first `cutoff` journal records, from the file's own bytes.
function journalDigest(journal: Uint8Array, cutoff: number): string {
  let end = -1;
  for (let i = 0; i < cutoff; i++) {
    end = journal.indexOf(0x0a, end + 1);
    if (end < 0) inconsistent(`the journal has fewer than ${cutoff} complete records`);
  }
  return refOf(journal.subarray(0, end + 1));
}

export function buildPrReviewPacket(src: PacketSources): PrReviewPacket {
  const { state, read } = src;
  const events = src.events.filter((e) => e.seq <= src.cutoff);
  if (events.length !== src.cutoff) inconsistent(`the journal has fewer than ${src.cutoff} records`);
  const need = (key: string): string => {
    const ref = state.subjects[key];
    if (!ref) throw new EngineBlock('MISSING_INPUT', `a PR review packet needs "${key}"`, { input: key });
    return ref;
  };
  const record = <T>(name: string, ref: string): T => JSON.parse(read(name, ref)) as T;
  const planning = state.planning;
  if (!planning) inconsistent('there is no authorized plan');

  const subjects = {
    source: need('source'),
    intent: need('intent'),
    spec: need('spec'),
    final_plan: need('final_plan'),
    audit: need('audit'),
    proof: need('proof'),
    proof_tree: need('proof_tree'),
    proof_baseline: need('proof_baseline'),
    base: need('base'),
    candidate: need('candidate'),
    verification: need('verification'),
    review: need('review'),
    procedure: need('pr_review_procedure'),
  };
  read('pr_review_procedure', subjects.procedure);
  read('source', subjects.source);
  read('intent', subjects.intent);
  read('spec', subjects.spec);
  read('workflow', state.workflow_ref);
  read('profile', state.profile_ref);
  read('app_config', state.app_config_ref);
  if (state.subjects.answers) read('answers', state.subjects.answers);
  if (state.subjects.dispositions) read('dispositions', state.subjects.dispositions);

  // ---- planning: the plan in force is the one the recorded decision authorized
  if (subjects.final_plan !== planning.final_plan || subjects.audit !== planning.audit) inconsistent('the final plan or audit is not the authorized one');
  const decision = state.decisions[planning.decision_id];
  if (!decision || decision.decision_ref !== planning.decision_ref) inconsistent('the authorizing decision is not the recorded one');
  const finalPlan = record<FinalPlan>('final_plan', subjects.final_plan);
  const named: [string, string, string][] = [
    ['last_audited_plan', finalPlan.last_audited_plan, planning.last_audited_plan],
    ['audit', finalPlan.audit, planning.audit],
    ['decision', finalPlan.decision, planning.decision_ref],
    ['brief', finalPlan.brief, planning.brief],
    ['specification', finalPlan.specification, subjects.spec],
    ['intent', finalPlan.intent, subjects.intent],
  ];
  for (const [key, found, expected] of named) {
    if (found !== expected) inconsistent(`the final plan names another ${key}`, { key });
    read(`final plan ${key}`, found);
  }
  if (finalPlan.plan_status !== planning.plan_status) inconsistent('the final plan carries another status');

  // ---- execution: each run is of the tree, proof, specification, and plan in force
  const baseline = record<ExecutionRecord>('proof_baseline', subjects.proof_baseline);
  if (baseline.purpose !== 'PROOF_BASELINE' || baseline.tree !== subjects.proof_tree || baseline.proof !== subjects.proof || baseline.classification.outcome !== 'VALID') {
    inconsistent('the proof baseline is not a valid run of this proof on this proof tree');
  }
  const verification = record<ExecutionRecord>('verification', subjects.verification);
  if (
    verification.purpose !== 'CANDIDATE_VERIFICATION' ||
    verification.tree !== subjects.candidate ||
    verification.proof !== subjects.proof ||
    verification.specification !== subjects.spec ||
    verification.final_plan !== subjects.final_plan ||
    verification.classification.outcome !== 'PASS'
  ) {
    inconsistent('the verification is not a passing run of this proof on this candidate under this specification and plan');
  }
  read('proof_baseline output', baseline.output);
  read('verification output', verification.output);
  read('proof', subjects.proof);

  // ---- technical review: it accepted this candidate, and was given this plan and audit
  const review = parseReview(read('review', subjects.review), {
    candidate: subjects.candidate,
    verification: subjects.verification,
    spec: subjects.spec,
    proof: subjects.proof,
  });
  if (!review.ok) inconsistent('the code review is not a valid review of this candidate, verification, specification, and proof', { issues: review.issues });
  if (review.value.verdict !== 'ACCEPT') inconsistent('the code review did not accept the candidate');
  const accepted = state.accepted.review;
  if (!accepted) inconsistent('no code review result was accepted');
  const dispatch = events.find((e) => e.type === 'task_dispatched' && e.data.attempt_id === accepted.attempt_id);
  const acceptance = events.find((e) => e.type === 'result_accepted' && e.data.attempt_id === accepted.attempt_id);
  if (!dispatch || !acceptance) inconsistent('the code review was not dispatched and accepted before this packet');
  if ((acceptance.data.subjects as Record<string, string>).review !== subjects.review || acceptance.data.result_ref !== accepted.result_ref) {
    inconsistent('the accepted code review is not the one in force');
  }
  const given = dispatch.data.inputs as Record<string, string>;
  for (const key of ['source', 'spec', 'final_plan', 'audit', 'proof', 'proof_tree', 'proof_baseline', 'base', 'candidate', 'verification'] as const) {
    if (given[key] !== subjects[key]) inconsistent(`the code review was given another ${key}`, { key });
  }
  const result = record<RoleResult>('result of review', accepted.result_ref);
  if (result.input_digest !== dispatch.data.input_digest || result.attempt_id !== accepted.attempt_id) inconsistent('the code review result answers another dispatch');

  // ---- history, selected from the journal up to the cutoff
  const stepOf = new Map<string, string>();
  for (const e of events) if (e.type === 'task_dispatched') stepOf.set(String(e.data.attempt_id), String(e.data.step_id));
  const failedAttempts = events
    .filter((e) => e.type === 'attempt_failed')
    .map((e) => ({ attempt_id: String(e.data.attempt_id), step_id: stepOf.get(String(e.data.attempt_id)) ?? '', kind: String(e.data.kind), record: String(e.data.failure_ref) }));
  // A tree that is history: its record and every file the record names.
  const earlierTree = (name: string, ref: string): void => {
    for (const file of record<TreeManifest>(name, ref).files) read(`file "${file.path}" of ${name}`, `sha256:${file.sha256}`);
  };
  // A run that did not pass is named with the candidate it ran on and what it
  // printed, and all three are read: the record, the output, the tree.
  const failedVerifications = events
    .filter((e) => e.type === 'verification_recorded' && e.data.outcome !== 'PASS')
    .map((e) => {
      const ref = String(e.data.verification_ref);
      const candidate = String(e.data.candidate);
      const run = record<ExecutionRecord>('failed verification', ref);
      if (run.purpose !== 'CANDIDATE_VERIFICATION' || run.tree !== candidate || run.classification.outcome !== e.data.outcome) {
        inconsistent('a failed verification is not the recorded run of the candidate the journal names', { verification: ref });
      }
      read('failed verification output', run.output);
      earlierTree('an earlier candidate', candidate);
      return { verification: ref, candidate, output: run.output };
    });
  // The result in force for each stage as the journal stood at the cutoff: the
  // last one accepted, and none for a review that an invalidation dropped. It
  // is taken from those records alone, never from later state, so the same
  // packet is assembled however far the run has gone since.
  const inForce = new Map<string, string>();
  for (const e of events) {
    if (e.type === 'result_accepted') inForce.set(stepOf.get(String(e.data.attempt_id)) ?? '', String(e.data.attempt_id));
    if (e.type === 'verification_invalidated') for (const step of ['review', 'pr-review']) inForce.delete(step);
  }
  if (inForce.get('review') !== accepted.attempt_id) inconsistent('the code review in force is not the last one accepted before this packet');
  const current = new Set(inForce.values());
  const superseded = events
    .filter((e) => e.type === 'result_accepted' && !current.has(String(e.data.attempt_id)))
    .map((e) => ({
      step_id: stepOf.get(String(e.data.attempt_id)) ?? '',
      attempt_id: String(e.data.attempt_id),
      result: String(e.data.result_ref),
      // What the journal recorded as produced by that result, in key order.
      produced: Object.entries(e.data.subjects as Record<string, string>)
        .map(([key, made]) => ({ key, record: String(made) }))
        .sort((x, y) => (x.key < y.key ? -1 : 1)),
    }));
  for (const f of failedAttempts) read(`failure of ${f.attempt_id}`, f.record);
  // A superseded result is read with every record it produced: a tree down to
  // each file, and a proof baseline with what it printed.
  for (const s of superseded) {
    if (record<RoleResult>(`superseded result of ${s.attempt_id}`, s.result).attempt_id !== s.attempt_id) {
      inconsistent('a superseded result answers another attempt', { attempt_id: s.attempt_id });
    }
    for (const made of s.produced) {
      const name = `${made.key} of superseded ${s.attempt_id}`;
      if (HISTORY_TREES.includes(made.key)) earlierTree(name, made.record);
      else if (made.key === 'proof_baseline') read(`output of ${name}`, record<ExecutionRecord>(name, made.record).output);
      else read(name, made.record);
    }
  }

  const tree = (name: string, ref: string): TreeManifest => record<TreeManifest>(name, ref);
  const candidateTree = tree('candidate', subjects.candidate);
  return {
    schema_version: 1,
    record_type: 'pr-review-packet',
    run_id: state.run_id,
    request_id: state.request_id,
    identity: {
      workflow: state.workflow_ref,
      profile: state.profile_ref,
      app_config: state.app_config_ref,
      review_procedure: subjects.procedure,
      composer_format: COMPOSER_FORMAT,
      evidence_class: state.transport_class,
    },
    requirements: { source: subjects.source, intent: subjects.intent, spec: subjects.spec, answers: state.subjects.answers ?? null },
    planning: {
      last_audited_plan: planning.last_audited_plan,
      audit: planning.audit,
      final_plan: planning.final_plan,
      decision: planning.decision_ref,
      brief: planning.brief,
      plan_status: planning.plan_status,
      dispositions: state.subjects.dispositions ?? null,
    },
    implementation: { base: subjects.base, proof_tree: subjects.proof_tree, candidate: subjects.candidate },
    execution: {
      proof: subjects.proof,
      proof_baseline: subjects.proof_baseline,
      proof_baseline_output: baseline.output,
      verification: subjects.verification,
      verification_output: verification.output,
    },
    technical_review: {
      review: subjects.review,
      verdict: 'ACCEPT',
      result: accepted.result_ref,
      attempt_id: accepted.attempt_id,
      input_digest: String(dispatch.data.input_digest),
    },
    changes: {
      base_to_candidate: changeSet(tree('base', subjects.base), candidateTree),
      proof_tree_to_candidate: changeSet(tree('proof_tree', subjects.proof_tree), candidateTree),
    },
    history: {
      journal_cutoff: src.cutoff,
      journal_digest: journalDigest(src.journal, src.cutoff),
      failed_attempts: failedAttempts,
      failed_verifications: failedVerifications,
      superseded_results: superseded,
      invalidations: events.filter((e) => e.type === 'verification_invalidated').length,
      not_included: ['Submissions the engine refused are retained under rejected/ but are not journal records, so this packet does not bind them.'],
    },
  };
}

export function packetText(packet: PrReviewPacket): string {
  return JSON.stringify(packet, null, 2);
}
