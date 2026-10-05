// Engine entry points: start, status, next, submit, decide, resume, abandon.
//
// - Every state change is one journal event, appended under the run lock.
// - `status` takes no lock, writes nothing, and never dispatches.
// - `next` creates at most one pending attempt per stage slot and grants its
//   dispatch to the caller that created it. Anyone asking again is told the
//   attempt is in flight. `resume` repairs derived files and reports the
//   current directive; it never creates an attempt.
// - `submit` and `decide` are idempotent per attempt or decision identity.
// - `abandon` is the only way an attempt of unknown execution state is closed.

import { randomBytes } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeSync,
} from 'node:fs';
import { join, sep } from 'node:path';
import {
  type Audit,
  type FinalPlan,
  type Plan,
  buildFinalPlan,
  parseAudit,
  parseDispositions,
  parseIntent,
  parsePlan,
  parseSpec,
} from '../contracts/planning.ts';
import {
  type AppConfig,
  type ExecutionPurpose,
  type ExecutionRecord,
  type Proof,
  type TreeManifest,
  parseAppConfig,
  parseProof,
  parseReview,
} from '../contracts/app.ts';
import type { NotConfigured, ProposalSink, RequestSnapshot, TestExecutor, TransportClass } from '../contracts/ports.ts';
import { type PrReviewPacket, packetIdentities, parsePrReview, parsePrReviewPacket } from '../contracts/pr-review.ts';
import {
  type DecisionProvenance,
  type JournalEvent,
  type PrProposal,
  type RoleResult,
  type TaskEnvelope,
  type TransportFailure,
  ID_PATTERN,
  canonicalJson,
  parseDecision,
  parseProfile,
  parseSubmission,
  refOf,
  sha256Hex,
} from '../contracts/records.ts';
import type { Parsed } from '../contracts/validate.ts';
import {
  type StageDef,
  type WorkflowDef,
  WORKFLOW,
  allowedActions,
  decisionSubjectKeys,
  dispatchRoles,
  stageOf,
  workflowRef,
} from '../policies/workflow.ts';
import { renderBrief } from './brief.ts';
import { readContained } from './containment.ts';
import { EngineBlock } from './errors.ts';
import { classifyBaseline, classifyVerification } from './execution.ts';
import { changedPaths, isUnder, manifestOf, manifestText, materialize, measureTree } from './tree.ts';
import { type TailRecovery, JOURNAL_FILE, appendEvent, quarantineTail, readJournal } from './journal.ts';
import { type HeldLock, type LockHolder, acquireLock, readHolder } from './lock.ts';
import { buildPrReviewPacket, packetText } from './pr-review-packet.ts';
import { composeProposal } from './proposal.ts';
import { type RunState, applyEvent, currentStage, replay } from './state.ts';

const SNAPSHOT_FILE = 'state.json';
const MAX_SUBMISSION_BYTES = 256 * 1024;
const MAX_PROCEDURE_BYTES = 64 * 1024;

export type Directive =
  | { kind: 'CONTINUE'; pending: TaskEnvelope | null }
  | {
      kind: 'WAIT';
      awaiting: 'PRODUCT_QUESTION' | 'PLAN_DECISION';
      paused: boolean;
      round: number;
      subjects: Record<string, string>;
      allowed_actions: string[];
      expected_version: number;
      // Where the human reads what is being decided, relative to the run directory.
      read: string | null;
    }
  | {
      kind: 'DONE';
      terminal: 'PR_PROPOSAL_READY' | 'REJECTED';
      publication_status: 'NOT_ATTEMPTED';
      evidence_class: TransportClass;
      // PASSED_LOCAL_EXECUTION: the engine ran the controlled proof against the
      // exact candidate itself. NOT_PERFORMED: no candidate was verified.
      candidate_verification: 'NOT_PERFORMED' | 'PASSED_LOCAL_EXECUTION';
      // How the planning authorization was recorded; null when none was given.
      authorization: { decision_id: string; provenance: DecisionProvenance } | null;
      proposal: RunState['proposal'];
    }
  | {
      kind: 'BLOCKED';
      blocker: string;
      detail: string;
      // Present when a PR review stopped the run: its verdict and the retained
      // record that holds its findings and limitations.
      pr_review?: { verdict: string; record: string };
    };

export interface Reply {
  ok: boolean;
  code: string;
  run_id: string | null;
  state_version: number | null;
  directive: Directive | null;
  [extra: string]: unknown;
}

export interface EngineOptions {
  runsRoot: string;
  workflow?: WorkflowDef;
  now?: () => Date;
  lockTimeoutMs?: number;
  // Observer called after an event is committed and before anything else
  // happens. Tests use it to interrupt the process at the commit point.
  onCommitted?: (event: JournalEvent) => void;
  resolveSink?: (id: string) => ProposalSink;
  // Returns the executor for an application's declared test runner.
  resolveExecutor?: (runner: string) => TestExecutor | null;
}

export interface StartInput {
  runId?: string;
  snapshot: RequestSnapshot;
  // Directory of the application the request is about. It is measured and
  // retained at start; the run never writes to it.
  appDir: string;
  profileText: string;
  // The procedure the PR reviewer follows: the default or a team's own. Its
  // exact text is retained and every PR review in the run is bound to it.
  prReviewProcedure?: string;
  sinkId: string;
  transportClass: TransportClass;
}

export interface Engine {
  start(input: StartInput): Reply;
  status(runId: string): Reply;
  next(runId: string): Reply;
  submit(runId: string, raw: string): Reply;
  decide(runId: string, raw: string): Reply;
  resume(runId: string): Reply;
  abandon(runId: string, attemptId: string, detail: string): Reply;
}

interface Ctx {
  runDir: string;
  state: RunState;
  recovered: TailRecovery | null;
  lock: HeldLock;
}

type Refusal = { code: string; detail: Record<string, unknown> };
type Ingested = { subjects: Record<string, string>; open: boolean; verdict: string | null } | Refusal;

function writeFileSynced(path: string, bytes: string | Uint8Array): void {
  const tmp = `${path}.${randomBytes(6).toString('hex')}.tmp`;
  const fd = openSync(tmp, 'w');
  try {
    writeSync(fd, bytes as Uint8Array);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tmp, path);
}

export function createEngine(options: EngineOptions): Engine {
  const workflow = options.workflow ?? WORKFLOW;
  const wfRef = workflowRef(workflow);
  const now = options.now ?? (() => new Date());
  const lockTimeoutMs = options.lockTimeoutMs ?? 5000;

  function runDirOf(runId: string): string {
    if (!ID_PATTERN.test(runId)) throw new EngineBlock('INVALID_RUN_ID', 'run id has an invalid format', {});
    const dir = join(options.runsRoot, runId);
    if (!existsSync(dir)) throw new EngineBlock('RUN_NOT_FOUND', 'no such run', {});
    const root = realpathSync(options.runsRoot);
    if (!realpathSync(dir).startsWith(root + sep)) {
      throw new EngineBlock('UNSAFE_PATH', 'run directory resolves outside the runs root', {});
    }
    return dir;
  }

  // Artifacts are named by their content, inside the run. A reference can
  // therefore never point at another run or outside the run directory.
  function writeArtifact(runDir: string, bytes: string | Uint8Array): string {
    const hex = sha256Hex(bytes);
    const dir = join(runDir, 'artifacts');
    mkdirSync(dir, { recursive: true });
    const path = join(dir, hex);
    if (!existsSync(path)) writeFileSynced(path, bytes);
    return `sha256:${hex}`;
  }

  // Reads retained bytes by identity and refuses bytes that no longer match it.
  function readArtifact(runDir: string, name: string, ref: string | undefined): string {
    const path = ref ? join(runDir, 'artifacts', ref.slice('sha256:'.length)) : null;
    if (!ref || !path || !existsSync(path)) {
      throw new EngineBlock('MISSING_INPUT', `retained record "${name}" is missing`, { input: name, ref: ref ?? null });
    }
    const bytes = readFileSync(path);
    if (refOf(bytes) !== ref) {
      throw new EngineBlock('MISSING_INPUT', `retained record "${name}" does not match its identity`, { input: name, ref });
    }
    return bytes.toString('utf8');
  }

  // Parses a record the engine itself validated and retained earlier.
  function retained<T>(name: string, parsed: Parsed<T>): T {
    if (!parsed.ok) throw new EngineBlock('MISSING_INPUT', `retained record "${name}" is no longer valid`, { issues: parsed.issues });
    return parsed.value;
  }

  function retainRejected(runDir: string, code: string, raw: string, detail: unknown): string {
    const dir = join(runDir, 'rejected');
    mkdirSync(dir, { recursive: true });
    const name = `${sha256Hex(raw)}.${code}.json`;
    const path = join(dir, name);
    if (!existsSync(path)) {
      writeFileSynced(path, JSON.stringify({ code, received_at: now().toISOString(), detail, raw }, null, 2));
    }
    return `rejected/${name}`;
  }

  function writeSnapshot(runDir: string, state: RunState): void {
    writeFileSynced(join(runDir, SNAPSHOT_FILE), JSON.stringify(state, null, 2));
  }

  function snapshotStatus(runDir: string, state: RunState): 'CURRENT' | 'STALE' | 'MISSING' | 'INVALID' {
    const path = join(runDir, SNAPSHOT_FILE);
    if (!existsSync(path)) return 'MISSING';
    try {
      const snap = JSON.parse(readFileSync(path, 'utf8')) as unknown;
      if (canonicalJson(snap) === canonicalJson(state)) return 'CURRENT';
      const version = (snap as { version?: unknown }).version;
      return typeof version === 'number' && version < state.version ? 'STALE' : 'INVALID';
    } catch {
      return 'INVALID';
    }
  }

  function envelopeOf(state: RunState): TaskEnvelope | null {
    const p = state.pending;
    if (!p) return null;
    const stage = stageOf(workflow, p.step_id);
    return {
      schema_version: 1,
      record_type: 'task-envelope',
      run_id: state.run_id,
      attempt_id: p.attempt_id,
      step_id: p.step_id,
      role: p.role,
      state_version: p.dispatched_version,
      inputs: p.inputs,
      input_digest: p.input_digest,
      output_contract: 'role-result/v1',
      profile_ref: state.profile_ref,
      mode: stage?.mode ?? null,
      round: state.round,
      work_dir: `work/${p.attempt_id}`,
      produces: Object.fromEntries((stage?.produces ?? []).map((x) => [x.key, x.file])),
      app_dir: stage?.app_copy ? `work/${p.attempt_id}/app` : null,
    };
  }

  function subjectsOf(state: RunState, stage: StageDef): Record<string, string> {
    const subjects: Record<string, string> = {};
    for (const key of decisionSubjectKeys(stage.wait)) {
      const ref = state.subjects[key];
      if (ref) subjects[key] = ref;
    }
    return subjects;
  }

  // The file a wait tells the human to read, relative to the run directory,
  // and the subject whose identity a decision at that wait binds. A product
  // question is read from the retained record itself; a plan decision is read
  // from a copy of the brief that a browser can open.
  function displayedAt(state: RunState, wait: StageDef['wait']): { read: string; subject: string } {
    return wait === 'PRODUCT_QUESTION'
      ? { read: `artifacts/${(state.subjects.intent ?? '').slice(7)}`, subject: 'intent' }
      : { read: `brief/round-${state.round}.html`, subject: 'brief' };
  }

  function directiveOf(state: RunState): Directive {
    const stage = currentStage(state, workflow);
    switch (state.phase) {
      case 'BLOCKED':
        return {
          kind: 'BLOCKED',
          blocker: state.blocker?.code ?? 'UNKNOWN',
          detail: state.blocker?.detail ?? '',
          ...(state.pr_review && state.blocker?.code.startsWith('PR_REVIEW_') ? { pr_review: state.pr_review } : {}),
        };
      case 'DONE':
        return {
          kind: 'DONE',
          terminal: state.terminal ?? 'REJECTED',
          publication_status: state.publication_status,
          evidence_class: state.transport_class,
          candidate_verification: state.terminal === 'PR_PROPOSAL_READY' ? 'PASSED_LOCAL_EXECUTION' : 'NOT_PERFORMED',
          authorization: state.planning ? { decision_id: state.planning.decision_id, provenance: state.planning.decision_provenance } : null,
          proposal: state.proposal,
        };
      case 'WAITING_HUMAN': {
        const wait = stage?.wait ?? 'PLAN_DECISION';
        return {
          kind: 'WAIT',
          awaiting: wait,
          paused: state.paused,
          round: state.round,
          subjects: stage ? subjectsOf(state, stage) : {},
          allowed_actions: allowedActions(workflow, wait, state.round, state.audit_budget.used),
          expected_version: state.version,
          read: displayedAt(state, wait).read,
        };
      }
      case 'ACTIVE':
        return { kind: 'CONTINUE', pending: envelopeOf(state) };
    }
  }

  function reply(ctx: Ctx, ok: boolean, code: string, extra: Record<string, unknown> = {}): Reply {
    return {
      ok,
      code,
      run_id: ctx.state.run_id,
      state_version: ctx.state.version,
      directive: directiveOf(ctx.state),
      ...(ctx.recovered ? { recovered_tail: ctx.recovered } : {}),
      ...(ctx.lock.reclaimed ? { reclaimed_lock: ctx.lock.reclaimed } : {}),
      ...extra,
    };
  }

  function blocked(runId: string | null, e: unknown): Reply {
    if (e instanceof EngineBlock) {
      return { ok: false, code: e.code, run_id: runId, state_version: null, directive: null, message: e.message, detail: e.detail };
    }
    throw e;
  }

  function loadState(runDir: string, runId: string, repair: boolean): { state: RunState; recovered: TailRecovery | null; tailBytes: number; events: number } {
    const read = readJournal(runDir, runId);
    // Checked before anything is replayed. A run recorded under another
    // definition is refused as that; its records are never read through this
    // one, which would give them a meaning they did not have.
    const recorded = read.events[0]?.type === 'run_started' ? read.events[0].data.workflow_ref : undefined;
    if (recorded !== undefined && recorded !== wfRef) {
      throw new EngineBlock('WORKFLOW_MISMATCH', 'the run was started under a different workflow definition', { recorded, engine: wfRef });
    }
    const state = replay(read.events, workflow);
    if (!state) throw new EngineBlock('RUN_NOT_INITIALIZED', 'the run has no committed start record', {});
    if (state.workflow_ref !== wfRef) {
      throw new EngineBlock('WORKFLOW_MISMATCH', 'the run was started under a different workflow definition', {});
    }
    // Only a journal whose complete records are all valid may have its tail removed.
    const recovered = repair ? quarantineTail(runDir, read) : null;
    return { state, recovered, tailBytes: read.tail?.length ?? 0, events: read.events.length };
  }

  // Runs `fn` as the only writer of the run. An incomplete journal tail is
  // preserved and removed first, and is reported in the reply.
  function withRun(runId: string, fn: (ctx: Ctx) => Reply): Reply {
    try {
      const runDir = runDirOf(runId);
      const lock = acquireLock(runDir, lockTimeoutMs, now);
      try {
        const { state, recovered } = loadState(runDir, runId, true);
        return fn({ runDir, state, recovered, lock });
      } finally {
        lock.release();
      }
    } catch (e) {
      return blocked(runId, e);
    }
  }

  function commit(ctx: Ctx, type: JournalEvent['type'], data: Record<string, unknown>): void {
    const event: JournalEvent = {
      schema_version: 1,
      seq: ctx.state.version + 1,
      run_id: ctx.state.run_id,
      type,
      at: now().toISOString(),
      data,
    };
    // Validate against current state before writing, so an event that replay
    // would refuse is never committed.
    const nextState = applyEvent(ctx.state, event, workflow);
    appendEvent(ctx.runDir, event);
    options.onCommitted?.(event);
    ctx.state = nextState;
    writeSnapshot(ctx.runDir, nextState);
  }

  // ------------------------------------------------------------ planning records

  function loadAuditedPlan(runDir: string, state: RunState): { plan: Plan; audit: Audit } {
    const spec = retained('spec', parseSpec(readArtifact(runDir, 'spec', state.subjects.spec)));
    const criteria = spec.criteria.map((c) => c.id);
    const plan = retained('plan', parsePlan(readArtifact(runDir, 'plan', state.subjects.plan), criteria));
    const audit = retained(
      'audit',
      parseAudit(readArtifact(runDir, 'audit', state.subjects.audit), {
        plan: state.subjects.plan as string,
        spec: state.subjects.spec as string,
      }),
    );
    return { plan, audit };
  }

  // Checks one delivered file against its contract and the records it must
  // agree with. An empty issue list means the record is accepted.
  function checkContract(runDir: string, contract: string, text: string, inputs: Record<string, string>, state: RunState): { issues: string[]; open: boolean; verdict?: string } {
    const fail = (p: Parsed<unknown>): string[] => (p.ok ? [] : p.issues);
    switch (contract) {
      case 'intent': {
        const p = parseIntent(text);
        return { issues: fail(p), open: p.ok && p.value.open_decisions };
      }
      case 'spec':
        return { issues: fail(parseSpec(text)), open: false };
      case 'plan': {
        const spec = retained('spec', parseSpec(readArtifact(runDir, 'spec', inputs.spec)));
        return { issues: fail(parsePlan(text, spec.criteria.map((c) => c.id))), open: false };
      }
      case 'audit':
        return { issues: fail(parseAudit(text, { plan: inputs.plan as string, spec: inputs.spec as string })), open: false };
      case 'dispositions': {
        const prior = JSON.parse(readArtifact(runDir, 'prior_audit', inputs.prior_audit)) as Audit;
        return {
          issues: fail(parseDispositions(text, inputs.prior_audit as string, prior.findings.map((f) => f.id))),
          open: false,
        };
      }
      case 'proof': {
        // The proof is checked against the approved specification, not against the plan's reading of it.
        const spec = retained('spec', parseSpec(readArtifact(runDir, 'spec', inputs.spec)));
        return { issues: fail(parseProof(text, spec.criteria.map((c) => c.id))), open: false };
      }
      case 'review': {
        const p = parseReview(text, {
          candidate: inputs.candidate as string,
          verification: inputs.verification as string,
          spec: inputs.spec as string,
          proof: inputs.proof as string,
        });
        return { issues: fail(p), open: false, verdict: p.ok ? p.value.verdict : undefined };
      }
      case 'pr-review': {
        // The packet is re-established first. A review is then accepted only for
        // that packet and that candidate, citing only what the packet permits.
        const current = currentPacket(runDir, state);
        if (current.ref !== inputs.pr_review_packet) return { issues: ['pr_review: the packet in force is not the one this review was given'], open: false };
        const p = parsePrReview(text, { packet: current.ref, candidate: inputs.candidate as string, permitted: current.permitted });
        return { issues: fail(p), open: false, verdict: p.ok ? p.value.verdict : undefined };
      }
      default:
        return { issues: [`unknown contract "${contract}"`], open: false };
    }
  }

  function renderBriefFor(ctx: Ctx): { ref: string; location: string } {
    const { state, runDir } = ctx;
    const { plan, audit } = loadAuditedPlan(runDir, state);
    const html = renderBrief({
      run_id: state.run_id,
      request_id: state.request_id,
      round: state.round,
      // Rendering the brief is itself one event, so the wait begins one version later.
      decision_version: state.version + 1,
      evidence_class: state.transport_class,
      allowed_actions: allowedActions(workflow, 'PLAN_DECISION', state.round, state.audit_budget.used),
      refs: Object.fromEntries(['source', 'intent', 'spec', 'plan', 'audit'].map((k) => [k, state.subjects[k] ?? ''])),
      intent: retained('intent', parseIntent(readArtifact(runDir, 'intent', state.subjects.intent))),
      spec: retained('spec', parseSpec(readArtifact(runDir, 'spec', state.subjects.spec))),
      plan,
      audit,
      prior:
        state.round > 1
          ? {
              audit: JSON.parse(readArtifact(runDir, 'prior_audit', state.subjects.prior_audit)) as Audit,
              dispositions: JSON.parse(readArtifact(runDir, 'dispositions', state.subjects.dispositions)),
            }
          : undefined,
    });
    const location = `brief/round-${state.round}.html`;
    mkdirSync(join(runDir, 'brief'), { recursive: true });
    writeFileSynced(join(runDir, location), html);
    return { ref: writeArtifact(runDir, html), location };
  }

  // ------------------------------------------------------------ PR review

  // Assembles the packet for journal records 1 to `cutoff` from what the run retains now.
  function packetAt(runDir: string, state: RunState, cutoff: number): string {
    const packet = buildPrReviewPacket({
      state,
      events: readJournal(runDir, state.run_id).events,
      journal: readFileSync(join(runDir, JOURNAL_FILE)),
      cutoff,
      read: (name, ref) => readArtifact(runDir, name, ref),
    });
    return packetText(packet);
  }

  // The packet in force, re-established. Its retained bytes are read again by
  // identity, the packet is assembled again from what the run retains now, and
  // the two must be the same record. Every record it names, every file of its
  // three trees, and what both real runs printed are read on the way, so a
  // dependency that is missing, altered, or no longer consistent stops here.
  // Returns the packet and every identity a review of it may cite.
  function currentPacket(runDir: string, state: RunState): { ref: string; packet: PrReviewPacket; permitted: Set<string> } {
    const ref = state.subjects.pr_review_packet;
    const packet = retained('pr_review_packet', parsePrReviewPacket(readArtifact(runDir, 'pr_review_packet', ref)));
    if (refOf(packetAt(runDir, state, packet.history.journal_cutoff)) !== ref) {
      throw new EngineBlock('PR_REVIEW_PACKET_STALE', 'the PR review packet no longer matches the evidence it was assembled from', { packet: ref });
    }
    // Assembling the packet again has just read every record it names, so
    // each identity permitted here is one that was resolved a moment ago.
    const permitted = new Set<string>([ref as string, ...packetIdentities(packet)]);
    for (const [name, treeRef] of Object.entries(packet.implementation)) {
      for (const file of readTree(runDir, name, treeRef).files) {
        readTreeFile(runDir, name, file.sha256, file.path);
        permitted.add(`sha256:${file.sha256}`);
      }
    }
    return { ref: ref as string, packet, permitted };
  }

  // A proposal is composed only for a candidate whose packet is still what was
  // assembled and whose PR review of that packet approved it. The review is
  // validated again here, against the packet as re-established, before any of
  // its text is used.
  function buildProposal(runDir: string, state: RunState): PrProposal {
    const evidence: Record<string, string> = {};
    for (const [stageId, accepted] of Object.entries(state.accepted)) evidence[stageId] = accepted.result_ref;
    const planning = state.planning;
    if (!planning) throw new EngineBlock('JOURNAL_CORRUPT', 'a proposal needs an authorized plan', {});
    const decision = state.decisions[planning.decision_id];
    if (!decision) throw new EngineBlock('JOURNAL_CORRUPT', 'a proposal needs the authorizing decision', {});
    const reviewed = state.pr_review;
    if (!reviewed || reviewed.verdict !== 'APPROVE' || reviewed.record !== state.subjects.pr_review) {
      throw new EngineBlock('PR_REVIEW_REQUIRED', 'a proposal needs an approving PR review of the candidate', {});
    }
    const { ref, packet, permitted } = currentPacket(runDir, state);
    const prReview = retained(
      'pr_review',
      parsePrReview(readArtifact(runDir, 'pr_review', reviewed.record), { packet: ref, candidate: packet.implementation.candidate, permitted }),
    );
    if (prReview.verdict !== 'APPROVE') throw new EngineBlock('PR_REVIEW_REQUIRED', 'the retained PR review does not approve the candidate', {});
    const spec = retained('spec', parseSpec(readArtifact(runDir, 'spec', packet.requirements.spec)));
    const execution = (name: string, id: string): ExecutionRecord => JSON.parse(readArtifact(runDir, name, id)) as ExecutionRecord;
    return composeProposal({
      run_id: state.run_id,
      request_id: state.request_id,
      source_ref: state.source_ref,
      transport_class: state.transport_class,
      evidence,
      packet_ref: ref,
      packet,
      pr_review_ref: reviewed.record,
      pr_review: prReview,
      review: retained(
        'review',
        parseReview(readArtifact(runDir, 'review', packet.technical_review.review), {
          candidate: packet.implementation.candidate,
          verification: packet.execution.verification,
          spec: packet.requirements.spec,
          proof: packet.execution.proof,
        }),
      ),
      spec,
      proof: retained('proof', parseProof(readArtifact(runDir, 'proof', packet.execution.proof), spec.criteria.map((c) => c.id))),
      final_plan: JSON.parse(readArtifact(runDir, 'final_plan', packet.planning.final_plan)) as FinalPlan,
      baseline: execution('proof_baseline', packet.execution.proof_baseline),
      verification: execution('verification', packet.execution.verification),
      decision: { decision_id: planning.decision_id, action: decision.action, provenance: decision.provenance },
      controlled_tests_dir: appConfigOf(runDir, state).controlled_tests_dir,
    });
  }

  // Takes the files a role result names from the attempt's directory, checks
  // containment and contracts, and retains them. Nothing is retained unless
  // every file passes.
  function ingestFiles(ctx: Ctx, stage: StageDef, result: RoleResult, inputs: Record<string, string>): Ingested {
    const produces = stage.produces ?? [];
    const expected = produces.map((p) => p.key).sort();
    if (Object.keys(result.files).sort().join() !== expected.join()) {
      return { code: 'CONTRACT_VIOLATION', detail: { issues: [`result.files must name exactly: ${expected.join(', ') || '(nothing)'}`] } };
    }
    const workDir = join(ctx.runDir, 'work', result.attempt_id);
    const checked: { key: string; bytes: Buffer }[] = [];
    let open = false;
    let verdict: string | null = null;
    for (const p of produces) {
      const file = readContained(ctx.runDir, workDir, result.files[p.key] as string);
      if (!file.ok) return { code: 'UNSAFE_PATH', detail: { key: p.key, reason: file.reason } };
      const outcome = checkContract(ctx.runDir, p.contract, file.bytes.toString('utf8'), inputs, ctx.state);
      if (outcome.issues.length > 0) return { code: 'CONTRACT_VIOLATION', detail: { key: p.key, issues: outcome.issues } };
      open ||= outcome.open;
      verdict = outcome.verdict ?? verdict;
      checked.push({ key: p.key, bytes: file.bytes });
    }
    const subjects: Record<string, string> = {};
    for (const c of checked) subjects[c.key] = writeArtifact(ctx.runDir, c.bytes);
    return { subjects, open, verdict };
  }

  // ------------------------------------------------------------ application trees and execution

  // Retains every file of a measured tree and the tree record itself.
  function retainTree(runDir: string, files: Map<string, Buffer>): { ref: string; manifest: TreeManifest } {
    for (const bytes of files.values()) writeArtifact(runDir, bytes);
    const manifest = manifestOf(files);
    return { ref: writeArtifact(runDir, manifestText(manifest)), manifest };
  }

  function readTree(runDir: string, name: string, ref: string | undefined): TreeManifest {
    return JSON.parse(readArtifact(runDir, name, ref)) as TreeManifest;
  }

  // Retained bytes of one file of a tree, by identity. Bytes that are missing or
  // no longer match it are refused.
  function readTreeFile(runDir: string, name: string, sha256: string, path: string): Buffer {
    const file = join(runDir, 'artifacts', sha256);
    if (!existsSync(file)) throw new EngineBlock('MISSING_INPUT', `retained file "${path}" of ${name} is missing`, { input: name });
    const bytes = readFileSync(file);
    if (sha256Hex(bytes) !== sha256) throw new EngineBlock('MISSING_INPUT', `retained file "${path}" of ${name} does not match its identity`, { input: name });
    return bytes;
  }

  // Re-creates a retained tree in a fresh directory, from retained bytes only.
  function materializeTree(runDir: string, name: string, ref: string | undefined, dest: string): void {
    rmSync(dest, { recursive: true, force: true });
    materialize(readTree(runDir, name, ref), dest, (sha256, path) => readTreeFile(runDir, name, sha256, path));
  }

  // Re-establishes a retained tree without writing it anywhere: its record and
  // every file the record names.
  function verifyTree(runDir: string, name: string, ref: string | undefined): void {
    for (const file of readTree(runDir, name, ref).files) readTreeFile(runDir, name, file.sha256, file.path);
  }

  // A proposal is assembled only from evidence that is still what was retained.
  // Two steps establish that, and the proposal stage runs both. Building the
  // proposal re-establishes the PR review packet (`currentPacket`): the base,
  // proof, and candidate trees down to each file, what both real runs printed,
  // the planning records, the code review, and the history the packet names.
  // This function reads the rest again by identity: the frozen source,
  // configuration, profile, and workflow; every current subject, which
  // includes the packet, the PR review, and its procedure; every accepted
  // result; and every recorded decision. Bytes that are missing or no longer
  // match stop the proposal before anything is written. Work and execution
  // directories are not what the proposal relies on and are not read; the
  // packet verifier reports on the whole run.
  function assertProposalEvidence(runDir: string, state: RunState, proposal: PrProposal): void {
    const records: [string, string | undefined][] = [
      ['source', state.source_ref],
      ['app_config', state.app_config_ref],
      ['profile', state.profile_ref],
      ['workflow', state.workflow_ref],
      ...Object.entries(state.subjects),
      ...Object.entries(proposal.planning_basis),
      ...Object.entries(proposal.evidence).map(([stageId, ref]): [string, string] => [`result of ${stageId}`, ref]),
      ...Object.entries(state.decisions).map(([id, d]): [string, string] => [`decision ${id}`, d.decision_ref]),
    ];
    const read = new Set<string>();
    for (const [name, ref] of records) {
      if (ref !== undefined && read.has(ref)) continue;
      readArtifact(runDir, name, ref);
      read.add(ref as string);
    }
  }

  // A verification stands only for the conditions it ran under. If they have
  // changed, it and everything that relied on it are dropped and established
  // again: nothing downstream is carried forward. Returns the reply when the
  // evidence was found stale.
  function invalidateIfStale(ctx: Ctx): Reply | null {
    const { state } = ctx;
    const verification = JSON.parse(readArtifact(ctx.runDir, 'verification', state.subjects.verification)) as ExecutionRecord;
    const appConfig = appConfigOf(ctx.runDir, state);
    const environment = executorFor(appConfig).environment(appConfig.test.env ?? []);
    if (canonicalJson(environment) === canonicalJson(verification.environment) && verification.tree === state.subjects.candidate) return null;
    commit(ctx, 'verification_invalidated', { reason: 'EXECUTION_ENVIRONMENT_CHANGED', was: verification.environment, now: environment });
    return reply(ctx, true, 'EVIDENCE_STALE', { reason: 'EXECUTION_ENVIRONMENT_CHANGED' });
  }

  function appConfigOf(runDir: string, state: RunState): AppConfig {
    return retained('app_config', parseAppConfig(readArtifact(runDir, 'app_config', state.app_config_ref)));
  }

  function executorFor(config: AppConfig): TestExecutor {
    const executor = options.resolveExecutor?.(config.test.runner);
    if (!executor) throw new EngineBlock('EXECUTOR_UNAVAILABLE', `no executor is wired for test runner "${config.test.runner}"`, {});
    return executor;
  }

  // Runs the application's tests for real on a retained tree, in a directory
  // the engine creates for this one run, and retains the record. The local
  // directory path is replaced in the retained output so the record is portable.
  function runExecution(ctx: Ctx, purpose: ExecutionPurpose, treeName: string, treeRef: string, proofRef: string, label: string): { ref: string; record: ExecutionRecord } {
    const { runDir, state } = ctx;
    const config = appConfigOf(runDir, state);
    const executor = executorFor(config);
    const proof = JSON.parse(readArtifact(runDir, 'proof', proofRef)) as Proof;
    const workingDirectory = `exec/${label}`;
    const dir = join(runDir, 'exec', label);
    materializeTree(runDir, treeName, treeRef, dir);
    const outcome = executor.run({ cwd: dir, patterns: config.test.patterns, timeoutMs: config.test.timeout_seconds * 1000, env: config.test.env ?? [] });
    const real = realpathSync(dir);
    let output = outcome.output;
    for (const form of new Set([real, real.replaceAll('\\', '\\\\'), real.replaceAll('\\', '/'), encodeURI(real.replaceAll('\\', '/'))])) {
      output = output.replaceAll(form, '<exec>');
    }
    const record: ExecutionRecord = {
      schema_version: 1,
      record_type: 'execution',
      evidence_class: 'ACTUAL_LOCAL_EXECUTION',
      purpose,
      executor: executor.id,
      command: outcome.command,
      working_directory: workingDirectory,
      tree: treeRef,
      app_config: state.app_config_ref,
      proof: proofRef,
      specification: state.subjects.spec ?? '',
      final_plan: state.subjects.final_plan ?? '',
      // The identity of the environment the tests were actually given.
      environment: outcome.environment,
      exit_code: outcome.exit_code,
      timed_out: outcome.timed_out,
      duration_ms: outcome.duration_ms,
      tests: outcome.tests,
      output: writeArtifact(runDir, output),
      classification: purpose === 'PROOF_BASELINE' ? classifyBaseline(proof, outcome) : classifyVerification(proof, outcome),
    };
    return { ref: writeArtifact(runDir, JSON.stringify(record, null, 2)), record };
  }

  // Proof stage: the tester may only add or change controlled tests. The
  // engine then runs the proof against the unchanged application itself.
  function acceptProof(ctx: Ctx, attemptId: string, proofRef: string): Record<string, string> | Refusal {
    const { runDir, state } = ctx;
    const config = appConfigOf(runDir, state);
    const measured = measureTree(join(runDir, 'work', attemptId, 'app'));
    if (!measured.ok) return { code: 'UNSAFE_PATH', detail: { reason: measured.reason } };
    const tree = manifestOf(measured.files);
    const outside = changedPaths(readTree(runDir, 'base', state.subjects.base), tree).filter((p) => !isUnder(p, config.controlled_tests_dir));
    if (outside.length > 0) {
      return { code: 'WRITE_BOUNDARY_VIOLATION', detail: { reason: 'the proof stage may only write controlled tests', paths: outside } };
    }
    const proofTree = retainTree(runDir, measured.files);
    const baseline = runExecution(ctx, 'PROOF_BASELINE', 'proof_tree', proofTree.ref, proofRef, `${attemptId}-baseline`);
    if (baseline.record.classification.outcome !== 'VALID') {
      return { code: `PROOF_${baseline.record.classification.outcome}`, detail: { execution: baseline.ref, issues: baseline.record.classification.issues } };
    }
    return { proof_tree: proofTree.ref, proof_baseline: baseline.ref };
  }

  // Implement stage: the developer may change the application but not the
  // controlled tests or the files that define how the proof is run. What it
  // leaves in its own copy is measured and retained as the candidate.
  function acceptCandidate(ctx: Ctx, attemptId: string): Record<string, string> | Refusal {
    const { runDir, state } = ctx;
    const config = appConfigOf(runDir, state);
    const measured = measureTree(join(runDir, 'work', attemptId, 'app'));
    if (!measured.ok) return { code: 'UNSAFE_PATH', detail: { reason: measured.reason } };
    const changed = changedPaths(readTree(runDir, 'proof_tree', state.subjects.proof_tree), manifestOf(measured.files));
    const forbidden = changed.filter((p) => isUnder(p, config.controlled_tests_dir) || config.protected.includes(p));
    if (forbidden.length > 0) {
      return { code: 'WRITE_BOUNDARY_VIOLATION', detail: { reason: 'controlled tests and protected files may not be changed by the implementation', paths: forbidden } };
    }
    return { candidate: retainTree(runDir, measured.files).ref };
  }

  // PR review stage: the reviewer is given a copy of the candidate to read.
  // A review is accepted only while that copy is still the candidate, file for
  // file, so an approval cannot rest on an application other than the retained
  // one. This measures the copy as it is at acceptance; it does not show what
  // the copy held at any earlier moment.
  function unchangedCopy(ctx: Ctx, attemptId: string, treeName: 'candidate'): Refusal | null {
    const { runDir, state } = ctx;
    const measured = measureTree(join(runDir, 'work', attemptId, 'app'));
    if (!measured.ok) return { code: 'UNSAFE_PATH', detail: { reason: measured.reason } };
    const changed = changedPaths(readTree(runDir, treeName, state.subjects[treeName]), manifestOf(measured.files));
    if (changed.length === 0) return null;
    return { code: 'WRITE_BOUNDARY_VIOLATION', detail: { reason: 'the PR review may not change the copy of the candidate it was given', paths: changed } };
  }

  // ------------------------------------------------------------ entry points

  function start(input: StartInput): Reply {
    const runId = input.runId ?? `RUN-${now().toISOString().replace(/[-:.]/g, '').slice(0, 15)}-${randomBytes(4).toString('hex')}`;
    try {
      if (!ID_PATTERN.test(runId)) throw new EngineBlock('INVALID_RUN_ID', 'run id has an invalid format', {});
      if (!ID_PATTERN.test(input.snapshot.request_id)) {
        throw new EngineBlock('INVALID_REQUEST_ID', 'request id has an invalid format', {});
      }
      if (!ID_PATTERN.test(input.sinkId)) throw new EngineBlock('INVALID_SINK', 'sink id has an invalid format', {});
      if (input.snapshot.bytes.length === 0) throw new EngineBlock('EMPTY_REQUEST', 'the request snapshot is empty', {});
      const app = measureTree(input.appDir);
      if (!app.ok) throw new EngineBlock('INVALID_APPLICATION', 'the application directory was rejected', { reason: app.reason });
      const configBytes = app.files.get('rstack.app.json');
      if (!configBytes) throw new EngineBlock('INVALID_APPLICATION', 'the application has no rstack.app.json', {});
      const config = parseAppConfig(configBytes.toString('utf8'));
      if (!config.ok) throw new EngineBlock('INVALID_APPLICATION', 'rstack.app.json was rejected', { issues: config.issues });
      executorFor(config.value);
      const profile = parseProfile(input.profileText, dispatchRoles(workflow));
      if (!profile.ok) {
        throw new EngineBlock(profile.code === 'MALFORMED' ? 'INVALID_PROFILE' : profile.code, 'the profile was rejected', {
          issues: profile.issues,
        });
      }
      // A workflow that reviews every proposal needs the procedure for that review before a run exists.
      const needsProcedure = workflow.stages.some((s) => (s.inputs ?? []).includes('pr_review_procedure'));
      const procedure = input.prReviewProcedure ?? '';
      if (needsProcedure && (procedure.trim().length === 0 || Buffer.byteLength(procedure) > MAX_PROCEDURE_BYTES)) {
        throw new EngineBlock('INVALID_PR_REVIEW_PROCEDURE', `this workflow needs a PR review procedure of at most ${MAX_PROCEDURE_BYTES} bytes`, {});
      }
      mkdirSync(options.runsRoot, { recursive: true });
      const runDir = join(options.runsRoot, runId);
      try {
        mkdirSync(runDir);
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'EEXIST') throw new EngineBlock('RUN_EXISTS', 'a run with this id already exists', {});
        throw e;
      }
      const lock = acquireLock(runDir, lockTimeoutMs, now);
      try {
        const maxAttempts: Record<string, number> = {};
        for (const role of dispatchRoles(workflow)) maxAttempts[role] = profile.value.roles[role]?.max_attempts ?? 1;
        const event: JournalEvent = {
          schema_version: 1,
          seq: 1,
          run_id: runId,
          type: 'run_started',
          at: now().toISOString(),
          data: {
            request_id: input.snapshot.request_id,
            source_ref: writeArtifact(runDir, input.snapshot.bytes),
            source_provenance: input.snapshot.provenance,
            profile_ref: writeArtifact(runDir, input.profileText),
            profile_id: profile.value.profile_id,
            profile_version: profile.value.profile_version,
            // The definition is retained under its own identity, so the run can be
            // read later without the code that started it.
            workflow_ref: writeArtifact(runDir, canonicalJson(workflow)),
            // The unchanged application, measured and retained before any work.
            base_ref: retainTree(runDir, app.files).ref,
            app_config_ref: writeArtifact(runDir, configBytes),
            ...(needsProcedure ? { pr_review_procedure_ref: writeArtifact(runDir, procedure) } : {}),
            sink: input.sinkId,
            transport_class: input.transportClass,
            max_attempts: maxAttempts,
            audit_budget_max: workflow.audit_budget_max,
          },
        };
        const state = applyEvent(null, event, workflow);
        appendEvent(runDir, event);
        options.onCommitted?.(event);
        writeSnapshot(runDir, state);
        return reply({ runDir, state, recovered: null, lock }, true, 'STARTED');
      } finally {
        lock.release();
      }
    } catch (e) {
      return blocked(runId, e);
    }
  }

  function status(runId: string): Reply {
    try {
      const runDir = runDirOf(runId);
      const { state, tailBytes, events } = loadState(runDir, runId, false);
      const holder = readHolder(runDir);
      const lock: LockHolder | 'UNREADABLE' | null = holder === 'ABSENT' ? null : holder;
      return {
        ok: true,
        code: 'STATUS',
        run_id: runId,
        state_version: state.version,
        directive: directiveOf(state),
        phase: state.phase,
        stage: state.stage,
        round: state.round,
        transport_class: state.transport_class,
        attempts: state.attempts,
        audit_budget: state.audit_budget,
        planning: state.planning,
        subjects: state.subjects,
        ...(state.pr_review ? { pr_review: state.pr_review } : {}),
        journal: { events, incomplete_tail_bytes: tailBytes },
        snapshot: snapshotStatus(runDir, state),
        lock,
      };
    } catch (e) {
      return blocked(runId, e);
    }
  }

  function next(runId: string): Reply {
    return withRun(runId, (ctx) => {
      const { state } = ctx;
      if (directiveOf(state).kind !== 'CONTINUE') return reply(ctx, true, 'NO_WORK');
      // Only the call that created an attempt is told to dispatch it. Anyone else
      // sees it as in flight: it may hold a result to submit, but must not invoke.
      if (state.pending) return reply(ctx, true, 'PENDING_IN_FLIGHT', { dispatch: 'IN_FLIGHT' });
      const stage = currentStage(state, workflow);
      if (!stage) throw new EngineBlock('JOURNAL_CORRUPT', 'the run is at an unknown stage', {});

      if (stage.id === 'brief') {
        const brief = renderBriefFor(ctx);
        commit(ctx, 'brief_rendered', { brief_ref: brief.ref, location: brief.location, round: state.round });
        return reply(ctx, true, 'BRIEF_READY');
      }
      if (stage.id === 'verify') {
        // The candidate is run from its retained bytes, never from a directory a role can still write to.
        const candidate = state.subjects.candidate as string;
        // The proof was established in one environment. A candidate is not verified
        // in another: the run is refused, unchanged, until the environment is that one again.
        const appConfig = appConfigOf(ctx.runDir, state);
        const environment = executorFor(appConfig).environment(appConfig.test.env ?? []);
        const baseline = JSON.parse(readArtifact(ctx.runDir, 'proof_baseline', state.subjects.proof_baseline)) as ExecutionRecord;
        if (canonicalJson(environment) !== canonicalJson(baseline.environment)) {
          return reply(ctx, false, 'PROOF_ENVIRONMENT_CHANGED', { proof_baseline: state.subjects.proof_baseline, was: baseline.environment, now: environment });
        }
        const run = runExecution(ctx, 'CANDIDATE_VERIFICATION', 'candidate', candidate, state.subjects.proof as string, `verify-${state.version}`);
        const outcome = run.record.classification.outcome;
        commit(ctx, 'verification_recorded', { verification_ref: run.ref, outcome, candidate });
        return reply(ctx, true, outcome === 'PASS' ? 'VERIFICATION_PASSED' : 'VERIFICATION_FAILED', { verification: run.ref, issues: run.record.classification.issues });
      }
      if (stage.id === 'pr-review-packet') {
        const stale = invalidateIfStale(ctx);
        if (stale) return stale;
        // Assembled from retained records and the journal as it stands now. The
        // record is checked against its own format before it is retained.
        const text = packetAt(ctx.runDir, state, state.version);
        const packet = parsePrReviewPacket(text);
        if (!packet.ok) throw new EngineBlock('PR_REVIEW_EVIDENCE_INCONSISTENT', 'the assembled PR review packet is not a valid record', { issues: packet.issues });
        for (const [name, treeRef] of Object.entries(packet.value.implementation)) verifyTree(ctx.runDir, name, treeRef);
        const packetRef = writeArtifact(ctx.runDir, text);
        commit(ctx, 'pr_review_packet_recorded', { packet_ref: packetRef, journal_cutoff: state.version, candidate: state.subjects.candidate });
        return reply(ctx, true, 'PR_REVIEW_PACKET_READY', { pr_review_packet: packetRef });
      }
      if (stage.id === 'proposal') {
        const stale = invalidateIfStale(ctx);
        if (stale) return stale;
        const proposal = buildProposal(ctx.runDir, state);
        assertProposalEvidence(ctx.runDir, state, proposal);
        if (!options.resolveSink) throw new EngineBlock('SINK_UNAVAILABLE', 'no proposal sink was wired', {});
        const result: ReturnType<ProposalSink['prepare']> = options.resolveSink(state.sink).prepare(proposal, ctx.runDir);
        if (result.status === 'INTEGRATION_NOT_CONFIGURED') {
          const nc: NotConfigured = result;
          return reply(ctx, false, nc.status, { integration: nc.integration, reason: nc.reason });
        }
        commit(ctx, 'proposal_recorded', { proposal_ref: result.proposal_ref, location: result.location });
        return reply(ctx, true, 'PROPOSAL_READY');
      }
      if (stage.kind !== 'role') throw new EngineBlock('JOURNAL_CORRUPT', `stage ${stage.id} has no handler`, {});

      const inputs: Record<string, string> = {};
      for (const spec of stage.inputs ?? []) {
        const optional = spec.endsWith('?');
        const key = optional ? spec.slice(0, -1) : spec;
        const ref = state.subjects[key];
        if (!ref) {
          if (optional) continue;
          throw new EngineBlock('MISSING_INPUT', `stage ${stage.id} needs "${key}"`, { input: key });
        }
        readArtifact(ctx.runDir, key, ref);
        inputs[key] = ref;
      }
      // A PR review is dispatched only on a packet that is still what was assembled.
      if (stage.id === 'pr-review') currentPacket(ctx.runDir, state);
      const attemptId = `${stage.id}-${(state.attempts[stage.id] ?? 0) + 1}`;
      // The attempt's own write lane, created fresh. A directory left by an
      // interrupted dispatch of this same attempt id was never handed out.
      const lane = join(ctx.runDir, 'work', attemptId);
      rmSync(lane, { recursive: true, force: true });
      mkdirSync(lane, { recursive: true });
      if (stage.app_copy) materializeTree(ctx.runDir, stage.app_copy, state.subjects[stage.app_copy], join(lane, 'app'));
      commit(ctx, 'task_dispatched', {
        attempt_id: attemptId,
        step_id: stage.id,
        role: stage.role,
        inputs,
        input_digest: refOf(canonicalJson(inputs)),
      });
      return reply(ctx, true, 'DISPATCHED', { dispatch: 'GRANTED' });
    });
  }

  function submit(runId: string, raw: string): Reply {
    return withRun(runId, (ctx) => {
      const reject = (code: string, detail: Record<string, unknown> = {}): Reply =>
        reply(ctx, false, code, { evidence: retainRejected(ctx.runDir, code, raw, detail), detail });

      if (Buffer.byteLength(raw) > MAX_SUBMISSION_BYTES) {
        return reply(ctx, false, 'SUBMISSION_TOO_LARGE', { limit_bytes: MAX_SUBMISSION_BYTES });
      }
      const parsed = parseSubmission(raw);
      if (!parsed.ok) {
        return reject(parsed.code === 'MALFORMED' ? 'MALFORMED_RESULT' : parsed.code, { issues: parsed.issues });
      }
      const sub = parsed.value;
      const { state } = ctx;
      if (sub.run_id !== state.run_id) return reject('RUN_MISMATCH');
      const log = state.attempt_log[sub.attempt_id];
      if (!log) return reject('UNKNOWN_ATTEMPT');
      const digest = refOf(canonicalJson(sub));
      const settledAs = sub.record_type === 'role-result' ? 'ACCEPTED' : 'FAILED';

      if (log.status !== 'PENDING') {
        if (log.status !== settledAs) return reject('STALE_ATTEMPT', { attempt_status: log.status });
        if (log.digest !== digest) return reject('CONFLICTING_DUPLICATE', { attempt_status: log.status });
        return reply(ctx, true, settledAs === 'ACCEPTED' ? 'ACCEPTED' : 'FAILURE_RECORDED', {
          duplicate: true,
          settled_version: log.settled_version,
        });
      }

      const pending = state.pending;
      if (!pending || pending.attempt_id !== sub.attempt_id) return reject('STALE_ATTEMPT', { attempt_status: log.status });
      if (sub.expected_version !== pending.dispatched_version || state.version !== pending.dispatched_version) {
        return reject('STALE_STATE_VERSION', { expected_version: sub.expected_version, state_version: state.version });
      }

      if (sub.record_type === 'transport-failure') {
        commit(ctx, 'attempt_failed', {
          attempt_id: sub.attempt_id,
          kind: sub.kind,
          detail: sub.detail,
          failure_digest: digest,
          failure_ref: writeArtifact(ctx.runDir, raw),
        });
        return reply(ctx, true, 'FAILURE_RECORDED', { duplicate: false, settled_version: ctx.state.version });
      }

      if (sub.role !== pending.role) return reject('ROLE_MISMATCH', { expected_role: pending.role });
      if (sub.input_digest !== pending.input_digest) return reject('INPUT_MISMATCH');
      const stage = currentStage(state, workflow);
      if (!stage) throw new EngineBlock('JOURNAL_CORRUPT', 'the run is at an unknown stage', {});
      const ingested = ingestFiles(ctx, stage, sub, pending.inputs);
      if ('code' in ingested) return reject(ingested.code, ingested.detail);
      // Stages that work on the application: the engine measures what the role
      // left in its own copy. Nothing a role says about it is taken on trust.
      if (stage.id === 'proof') {
        const derived = acceptProof(ctx, sub.attempt_id, ingested.subjects.proof as string);
        if ('code' in derived) return reject(derived.code as string, derived.detail as Record<string, unknown>);
        Object.assign(ingested.subjects, derived);
      }
      if (stage.id === 'implement') {
        const derived = acceptCandidate(ctx, sub.attempt_id);
        if ('code' in derived) return reject(derived.code as string, derived.detail as Record<string, unknown>);
        Object.assign(ingested.subjects, derived);
      }
      if (stage.id === 'pr-review') {
        const refusal = unchangedCopy(ctx, sub.attempt_id, 'candidate');
        if (refusal) return reject(refusal.code as string, refusal.detail as Record<string, unknown>);
      }

      commit(ctx, 'result_accepted', {
        attempt_id: sub.attempt_id,
        result_ref: writeArtifact(ctx.runDir, raw),
        result_digest: digest,
        outcome: sub.outcome,
        outputs: sub.outputs,
        subjects: ingested.subjects,
        // What this result is evidence of: the class of the transport the run takes
        // role results from. Recorded per result so a reader need not infer it.
        evidence_class: state.transport_class,
        open_decisions: ingested.open,
        ...(ingested.verdict ? (stage.id === 'pr-review' ? { pr_review_verdict: ingested.verdict } : { review_verdict: ingested.verdict }) : {}),
      });
      return reply(ctx, true, 'ACCEPTED', { duplicate: false, settled_version: ctx.state.version });
    });
  }

  function decide(runId: string, raw: string): Reply {
    return withRun(runId, (ctx) => {
      const reject = (code: string, detail: Record<string, unknown> = {}): Reply =>
        reply(ctx, false, code, { evidence: retainRejected(ctx.runDir, code, raw, detail), detail });

      if (Buffer.byteLength(raw) > MAX_SUBMISSION_BYTES) {
        return reply(ctx, false, 'SUBMISSION_TOO_LARGE', { limit_bytes: MAX_SUBMISSION_BYTES });
      }
      const parsed = parseDecision(raw);
      if (!parsed.ok) {
        return reject(parsed.code === 'MALFORMED' ? 'MALFORMED_DECISION' : parsed.code, { issues: parsed.issues });
      }
      const decision = parsed.value;
      const { state } = ctx;
      if (decision.run_id !== state.run_id) return reject('RUN_MISMATCH');
      const digest = refOf(canonicalJson(decision));
      const known = state.decisions[decision.decision_id];
      if (known) {
        if (known.digest !== digest) return reject('CONFLICTING_DUPLICATE');
        return reply(ctx, true, 'DECISION_RECORDED', { duplicate: true, settled_version: known.recorded_version });
      }
      if (decision.expected_version !== state.version) {
        return reject('STALE_STATE_VERSION', { expected_version: decision.expected_version, state_version: state.version });
      }
      const stage = currentStage(state, workflow);
      if (state.phase !== 'WAITING_HUMAN' || !stage?.wait) return reject('NOT_WAITING_FOR_DECISION');
      const allowed = allowedActions(workflow, stage.wait, state.round, state.audit_budget.used);
      if (!allowed.includes(decision.action)) return reject('ACTION_NOT_ALLOWED', { allowed_actions: allowed });
      const shown = subjectsOf(state, stage);
      if (canonicalJson(decision.subjects) !== canonicalJson(shown)) return reject('STALE_DECISION_SUBJECT');
      // What was shown must still be what is retained.
      for (const [key, ref] of Object.entries(shown)) readArtifact(ctx.runDir, key, ref);
      // The human read a file, not an identity. A decision counts only while that
      // file holds the bytes the decision names. One that was changed or removed
      // is left as found: the engine neither decides on it nor puts the retained
      // bytes back unasked, because what the human saw is then not known.
      const displayed = displayedAt(state, stage.wait);
      let found: string | null = null;
      try {
        found = refOf(readFileSync(join(ctx.runDir, ...displayed.read.split('/'))));
      } catch {
        found = null;
      }
      if (found !== shown[displayed.subject]) {
        return reject('DISPLAYED_SUBJECT_CHANGED', { read: displayed.read, subject: displayed.subject, expected: shown[displayed.subject] ?? null, found });
      }
      // A decision that does not say how it was recorded is UNKNOWN, never assumed
      // human. Outside a simulated run only HUMAN_RECORDED is accepted, and even
      // that is the recorder's claim, not authentication.
      const provenance: DecisionProvenance = decision.provenance ?? 'UNKNOWN';
      if (state.transport_class !== 'SIMULATED' && provenance !== 'HUMAN_RECORDED') {
        return reject(provenance === 'SCRIPTED' ? 'SCRIPTED_DECISION_NOT_ACCEPTED' : 'DECISION_PROVENANCE_REQUIRED', { provenance });
      }
      const decisionRef = writeArtifact(ctx.runDir, raw);

      const data: Record<string, unknown> = {
        decision_id: decision.decision_id,
        decision_digest: digest,
        decision_ref: decisionRef,
        action: decision.action,
        subjects: decision.subjects,
        recorded_by: decision.recorded_by,
        provenance,
      };
      if (decision.action === 'proceed' || decision.action === 'amend') {
        const { plan, audit } = loadAuditedPlan(ctx.runDir, state);
        const amendments = decision.amendments ?? [];
        const units = plan.units.map((u) => u.id);
        const unknown = amendments.filter((a) => a.target !== 'plan' && !units.includes(a.target)).map((a) => a.id);
        if (unknown.length > 0) return reject('AMENDMENT_TARGET_UNKNOWN', { amendments: unknown });
        const finalPlan = buildFinalPlan({
          run_id: state.run_id,
          decision_id: decision.decision_id,
          plan_ref: state.subjects.plan as string,
          plan,
          audit_ref: state.subjects.audit as string,
          audit,
          round: state.round,
          amendments,
          decision_ref: decisionRef,
          brief_ref: state.subjects.brief as string,
          spec_ref: state.subjects.spec as string,
          intent_ref: state.subjects.intent as string,
        });
        data.final_plan_ref = writeArtifact(ctx.runDir, JSON.stringify(finalPlan, null, 2));
        data.plan_status = finalPlan.plan_status;
      }
      commit(ctx, 'decision_recorded', data);
      return reply(ctx, true, 'DECISION_RECORDED', { duplicate: false, settled_version: ctx.state.version });
    });
  }

  function resume(runId: string): Reply {
    return withRun(runId, (ctx) => {
      const before = snapshotStatus(ctx.runDir, ctx.state);
      if (before !== 'CURRENT') writeSnapshot(ctx.runDir, ctx.state);
      return reply(ctx, true, 'RESUMED', { snapshot_before: before, ...(ctx.state.pending ? { dispatch: 'IN_FLIGHT' } : {}) });
    });
  }

  // Settles a pending attempt whose execution state is unknown (its dispatcher
  // went away). This is an explicit, recorded act; the engine never does it on
  // its own. The attempt counts against the retry budget and any later result
  // for it is stale. A new attempt gets a new identity.
  function abandon(runId: string, attemptId: string, detail: string): Reply {
    const current = status(runId);
    const pending = current.directive?.kind === 'CONTINUE' ? current.directive.pending : null;
    if (!current.ok) return current;
    if (!pending || pending.attempt_id !== attemptId) {
      return { ...current, ok: false, code: 'NOT_PENDING', attempt_id: attemptId };
    }
    const record: TransportFailure = {
      schema_version: 1,
      record_type: 'transport-failure',
      run_id: runId,
      attempt_id: attemptId,
      expected_version: pending.state_version,
      kind: 'EXECUTION_UNCERTAIN',
      detail,
    };
    return submit(runId, JSON.stringify(record));
  }

  return { start, status, next, submit, decide, resume, abandon };
}
