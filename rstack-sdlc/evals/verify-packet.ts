// Resolves a run's evidence from its review packet alone.
//
// The packet is the run directory without `work/`: journal.jsonl, artifacts/,
// brief/, proposal/, rejected/ and, when present, journal-tail/ and
// abandoned-locks/. Nothing outside the packet directory is read, so the
// result does not depend on the checkout that produced the run.
//
// This checks that identities resolve and match. It does not judge content.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { canonicalJson, refOf, sha256Hex } from '../core/contracts/records.ts';

const REF = /^sha256:[0-9a-f]{64}$/;

export interface PacketReport {
  ok: boolean;
  problems: string[];
  events: number;
  references_resolved: number;
  workflow: { workflow_id: string; workflow_version: number; stages: number } | null;
  profile: { profile_id: string; profile_version: number } | null;
  transport_class: string | null;
  unsuccessful_attempts: { attempt_id: string; kind: string; detail: string; record: string }[];
  rejected_submissions: string[];
  decisions: { decision_id: string; action: string; provenance: string; record: string }[];
  planning_basis: Record<string, string> | null;
  // Real test executions recorded by the run, and the candidate they led to.
  executions: { purpose: string; outcome: string; tree: string; tests: number; record: string }[];
  candidate: { base: string; candidate: string; verification: string; review: string } | null;
}

interface ExecutionSummary {
  purpose: string;
  tree: string;
  output: string;
  proof: string;
  app_config: string;
  tests: unknown[];
  classification: { outcome: string };
}

interface Event {
  seq: number;
  type: string;
  data: Record<string, unknown>;
}

export function verifyPacket(packetDir: string): PacketReport {
  const problems: string[] = [];
  let resolved = 0;

  const artifact = (ref: unknown, what: string): string | null => {
    if (typeof ref !== 'string' || !REF.test(ref)) {
      problems.push(`${what}: not an identity`);
      return null;
    }
    const path = join(packetDir, 'artifacts', ref.slice(7));
    if (!existsSync(path)) {
      problems.push(`${what}: ${ref} is not in the packet`);
      return null;
    }
    const bytes = readFileSync(path);
    if (refOf(bytes) !== ref) {
      problems.push(`${what}: retained bytes do not match ${ref}`);
      return null;
    }
    resolved += 1;
    return bytes.toString('utf8');
  };
  // A digest is the identity of a record's canonical form; the record itself is retained by `refKey`.
  const digestOf = (event: Event, digestKey: string, refKey: string): void => {
    const text = artifact(event.data[refKey], `record ${event.seq} ${refKey}`);
    if (text !== null && refOf(canonicalJson(JSON.parse(text))) !== event.data[digestKey]) {
      problems.push(`record ${event.seq}: ${digestKey} does not match the retained ${refKey}`);
    }
  };
  const file = (location: unknown, ref: unknown, what: string): string | null => {
    const path = typeof location === 'string' ? join(packetDir, location) : null;
    if (!path || !existsSync(path)) {
      problems.push(`${what}: file is not in the packet`);
      return null;
    }
    const bytes = readFileSync(path);
    if (refOf(bytes) !== ref) problems.push(`${what}: file does not match its recorded identity`);
    else resolved += 1;
    return bytes.toString('utf8');
  };

  const executions: { ref: string; record: ExecutionSummary }[] = [];
  const events: Event[] = [];
  const journal = join(packetDir, 'journal.jsonl');
  if (!existsSync(journal)) return emptyReport(['journal.jsonl is not in the packet']);
  readFileSync(journal, 'utf8')
    .split('\n')
    .filter(Boolean)
    .forEach((line, i) => {
      const payload = line.slice(65);
      if (sha256Hex(payload) !== line.slice(0, 64)) problems.push(`record ${i + 1}: checksum mismatch`);
      else events.push(JSON.parse(payload) as Event);
    });

  const report: PacketReport = {
    ok: false,
    problems,
    events: events.length,
    references_resolved: 0,
    workflow: null,
    profile: null,
    transport_class: null,
    unsuccessful_attempts: [],
    rejected_submissions: existsSync(join(packetDir, 'rejected')) ? readdirSync(join(packetDir, 'rejected')).sort() : [],
    decisions: [],
    planning_basis: null,
    executions: [],
    candidate: null,
  };

  for (const event of events) {
    const d = event.data;
    const where = `record ${event.seq}`;
    switch (event.type) {
      case 'run_started': {
        artifact(d.source_ref, `${where} source_ref`);
        artifact(d.app_config_ref, `${where} app_config_ref`);
        // Recorded only by runs whose workflow has a PR review.
        if (d.pr_review_procedure_ref !== undefined) artifact(d.pr_review_procedure_ref, `${where} pr_review_procedure_ref`);
        const profile = artifact(d.profile_ref, `${where} profile_ref`);
        if (profile) {
          const p = JSON.parse(profile) as { profile_id: string; profile_version: number };
          report.profile = { profile_id: p.profile_id, profile_version: p.profile_version };
        }
        const workflow = artifact(d.workflow_ref, `${where} workflow_ref`);
        if (workflow) {
          const w = JSON.parse(workflow) as { workflow_id: string; workflow_version: number; stages: unknown[] };
          report.workflow = { workflow_id: w.workflow_id, workflow_version: w.workflow_version, stages: w.stages.length };
        }
        report.transport_class = String(d.transport_class);
        break;
      }
      case 'task_dispatched': {
        const inputs = d.inputs as Record<string, string>;
        for (const [key, ref] of Object.entries(inputs)) artifact(ref, `${where} input ${key}`);
        if (refOf(canonicalJson(inputs)) !== d.input_digest) problems.push(`${where}: input_digest does not match the inputs`);
        break;
      }
      case 'result_accepted':
        digestOf(event, 'result_digest', 'result_ref');
        for (const [key, ref] of Object.entries(d.subjects as Record<string, string>)) {
          const text = artifact(ref, `${where} subject ${key}`);
          if (key === 'proof_baseline' && text) executions.push({ ref, record: JSON.parse(text) as ExecutionSummary });
        }
        break;
      case 'attempt_failed':
        digestOf(event, 'failure_digest', 'failure_ref');
        report.unsuccessful_attempts.push({
          attempt_id: String(d.attempt_id),
          kind: String(d.kind),
          detail: String(d.detail),
          record: String(d.failure_ref),
        });
        break;
      case 'brief_rendered':
        artifact(d.brief_ref, `${where} brief_ref`);
        file(d.location, d.brief_ref, `${where} brief file`);
        break;
      case 'decision_recorded': {
        digestOf(event, 'decision_digest', 'decision_ref');
        for (const [key, ref] of Object.entries(d.subjects as Record<string, string>)) artifact(ref, `${where} decision subject ${key}`);
        const text = artifact(d.decision_ref, `${where} decision_ref`);
        // Provenance is read from the retained decision record and must agree with the journal.
        const recorded = text ? ((JSON.parse(text) as { provenance?: string }).provenance ?? 'UNKNOWN') : 'UNRESOLVED';
        if (recorded !== d.provenance) problems.push(`${where}: journal provenance differs from the decision record`);
        report.decisions.push({ decision_id: String(d.decision_id), action: String(d.action), provenance: recorded, record: String(d.decision_ref) });
        if (d.final_plan_ref !== undefined) {
          const finalPlan = artifact(d.final_plan_ref, `${where} final_plan_ref`);
          if (finalPlan) {
            const f = JSON.parse(finalPlan) as Record<string, string>;
            for (const key of ['last_audited_plan', 'audit', 'decision', 'brief', 'specification', 'intent']) {
              artifact(f[key], `final plan ${key}`);
            }
            if (f.decision !== d.decision_ref) problems.push(`${where}: the final plan names a different decision`);
          }
        }
        break;
      }
      case 'verification_recorded': {
        const text = artifact(d.verification_ref, `${where} verification_ref`);
        if (text) executions.push({ ref: String(d.verification_ref), record: JSON.parse(text) as ExecutionSummary });
        artifact(d.candidate, `${where} candidate`);
        break;
      }
      case 'verification_invalidated':
        break;
      case 'pr_review_packet_recorded': {
        // The packet and every identity it names, at any depth.
        const text = artifact(d.packet_ref, `${where} packet_ref`);
        if (text) {
          const walk = (v: unknown, path: string): void => {
            if (typeof v === 'string') {
              if (REF.test(v)) artifact(v, `PR review packet ${path}`);
            } else if (typeof v === 'object' && v !== null) {
              // A digest identifies bytes that are not retained under it; the two the packet carries are checked below.
              for (const [key, value] of Object.entries(v)) if (!key.endsWith('_digest')) walk(value, `${path}.${key}`);
            }
          };
          const packet = JSON.parse(text) as {
            implementation?: { candidate?: string };
            technical_review?: { attempt_id?: string; input_digest?: string };
            history?: { journal_cutoff?: number; journal_digest?: string };
          };
          walk(packet, 'packet');
          if (packet.implementation?.candidate !== d.candidate) problems.push(`${where}: the packet names another candidate than the journal`);
          // The journal it was assembled from is the journal in this packet directory, up to its cutoff.
          const cutoff = packet.history?.journal_cutoff ?? -1;
          const lines = readFileSync(journal, 'utf8').split('\n').slice(0, Math.max(cutoff, 0));
          if (cutoff !== event.seq - 1 || refOf(lines.map((l) => `${l}\n`).join('')) !== packet.history?.journal_digest) {
            problems.push(`${where}: the packet's journal digest does not match the journal records before it`);
          }
          const dispatch = events.find((e) => e.type === 'task_dispatched' && e.data.attempt_id === packet.technical_review?.attempt_id);
          if (!dispatch || dispatch.data.input_digest !== packet.technical_review?.input_digest) {
            problems.push(`${where}: the packet's code review dispatch is not the one in the journal`);
          }
        }
        break;
      }
      case 'proposal_recorded': {
        const text = file(d.location, d.proposal_ref, `${where} proposal file`);
        if (text) {
          const proposal = JSON.parse(text) as Record<string, string> & { planning_basis: Record<string, string>; evidence: Record<string, string>; source_ref: string };
          for (const key of ['base_ref', 'candidate_ref', 'proof', 'proof_tree', 'proof_baseline', 'verification', 'review']) {
            artifact(proposal[key], `proposal ${key}`);
          }
          // A proposal that follows a PR review names the packet and the review as well.
          if ((proposal as { schema_version?: unknown }).schema_version === 2) {
            for (const key of ['pr_review_packet', 'pr_review']) artifact(proposal[key], `proposal ${key}`);
          }
          report.candidate = { base: String(proposal.base_ref), candidate: String(proposal.candidate_ref), verification: String(proposal.verification), review: String(proposal.review) };
          report.planning_basis = proposal.planning_basis;
          for (const [key, ref] of Object.entries(proposal.planning_basis)) artifact(ref, `proposal planning_basis ${key}`);
          for (const [key, ref] of Object.entries(proposal.evidence)) artifact(ref, `proposal evidence ${key}`);
          artifact(proposal.source_ref, 'proposal source_ref');
        }
        break;
      }
      default:
        problems.push(`${where}: unknown event type ${event.type}`);
    }
  }
  // Every retained file tree must be complete, and every execution record must
  // name a retained tree, a retained output, and the proof it ran.
  const trees = new Set<string>();
  for (const event of events) {
    if (event.type === 'run_started') trees.add(String(event.data.base_ref));
    if (event.type === 'result_accepted') {
      const subjects = event.data.subjects as Record<string, string>;
      for (const key of ['proof_tree', 'candidate']) if (subjects[key]) trees.add(subjects[key]);
    }
  }
  for (const ref of trees) {
    const text = artifact(ref, `tree ${ref}`);
    if (!text) continue;
    for (const f of (JSON.parse(text) as { files: { path: string; sha256: string }[] }).files) artifact(`sha256:${f.sha256}`, `tree file ${f.path}`);
  }
  for (const e of executions) {
    if (!trees.has(e.record.tree)) problems.push(`execution ${e.ref}: ran a tree the journal does not record`);
    artifact(e.record.output, `execution ${e.ref} output`);
    artifact(e.record.proof, `execution ${e.ref} proof`);
    artifact(e.record.app_config, `execution ${e.ref} app_config`);
    report.executions.push({ purpose: e.record.purpose, outcome: e.record.classification.outcome, tree: e.record.tree, tests: e.record.tests.length, record: e.ref });
  }
  report.references_resolved = resolved;
  report.ok = problems.length === 0;
  return report;

  function emptyReport(list: string[]): PacketReport {
    return {
      ok: false,
      problems: list,
      events: 0,
      references_resolved: 0,
      workflow: null,
      profile: null,
      transport_class: null,
      unsuccessful_attempts: [],
      rejected_submissions: [],
      decisions: [],
      planning_basis: null,
      executions: [],
      candidate: null,
    };
  }
}
