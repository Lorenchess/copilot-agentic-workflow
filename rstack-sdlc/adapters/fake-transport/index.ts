// Scripted role transport for offline tests. It writes the files a stage
// must deliver into the attempt's work directory and returns a result that
// names them. Everything it produces is SIMULATED: it proves contracts only
// and is never evidence of real host or model behavior.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Audit, Dispositions, Plan } from '../../core/contracts/planning.ts';
import type { RoleTransport, TransportDelivery } from '../../core/contracts/ports.ts';
import type { RoleResult, TaskEnvelope } from '../../core/contracts/records.ts';
import { review, writeImplementation, writeProof } from './application.ts';

// Delivery behaviors, plus content variants for the planning stages:
//   open-decision  intent that still has an open product decision
//   refuted        audit with a REFUTED verdict and one finding
//   unexamined     audit that checked nothing and says so (INCONCLUSIVE)
//   uncovered      plan that leaves an acceptance criterion without a unit
//   hostile        records whose text carries markup and script payloads
// Variants for the stages that work on the application are in application.ts.
export type FakeBehavior =
  | 'success'
  | 'negative'
  | 'malformed'
  | 'refusal'
  | 'timeout'
  | 'repeat'
  | 'open-decision'
  | 'refuted'
  | 'unexamined'
  | 'uncovered'
  | 'hostile'
  | 'vacuous'
  | 'error-red'
  | 'broken-setup'
  | 'unmapped'
  | 'insensitive'
  | 'touches-production'
  | 'wrong'
  | 'weakens-proof'
  | 'edits-config'
  | 'reject';

// Behaviors are listed per stage id, one per attempt; unlisted attempts succeed.
export type FakeScript = Record<string, FakeBehavior[]>;

export const HOSTILE = '<script>alert("x")</script><img src=x onerror=alert(1)>"\'&';

function intent(open: boolean, hostile: boolean): string {
  return [
    `# Intent: pause exports${hostile ? ` ${HOSTILE}` : ''}`,
    `Problem: SIMULATED. Operators need to pause exports without changing authentication.${hostile ? ` ${HOSTILE}` : ''}`,
    'Outcome: A local feature flag controls whether the exporter can be invoked.',
    'Scope: Existing export operation only; no authentication redesign.',
    'Source: synthetic request; disabled response confirmed there.',
    open ? 'Open decisions: What should an authorized request receive while exports are disabled?' : 'Open decisions: None.',
    '',
  ].join('\n');
}

function spec(hostile: boolean): string {
  return [
    '# Specification: pause exports',
    'Intent: SIMULATED, from the retained intent.',
    `AC-1: An authorized request while exports are disabled returns 503 with code EXPORTS_DISABLED and invokes the exporter zero times.${hostile ? ` ${HOSTILE}` : ''}`,
    'AC-2: An authorized request while enabled preserves existing export behavior.',
    'AC-3: An unauthorized request invokes the exporter zero times in either mode.',
    'Exclusion: No new identity provider or network integration.',
    '',
  ].join('\n');
}

function plan(round: number, uncovered: boolean, hostile: boolean): Plan {
  return {
    schema_version: 1,
    record_type: 'plan',
    title: `SIMULATED plan, round ${round}${hostile ? ` ${HOSTILE}` : ''}`,
    source_basis: 'SIMULATED: export handler and its authorization check.',
    units: [
      {
        id: 'U1',
        title: 'Check the flag before the exporter is invoked',
        acceptance_criteria: uncovered ? ['AC-1', 'AC-2'] : ['AC-1', 'AC-2', 'AC-3'],
        depends_on: [],
        work: `Add the flag check after authorization.${hostile ? ` ${HOSTILE}` : ''}`,
        proof: 'Tests that count exporter invocations in each mode.',
      },
    ],
    claims: [{ id: 'C1', text: 'Authorization runs before the exporter.', evidence: 'SIMULATED source location.' }],
  };
}

// The fixture audit does one real, mechanical thing: it compares the criterion
// ids in the retained specification with those the retained plan carries, and
// reports that comparison as its only examined item. Everything it did not do
// is NOT_CHECKED. It claims no semantic examination.
function audit(runDir: string, envelope: TaskEnvelope, behavior: FakeBehavior): Audit {
  const refuted = behavior === 'refuted';
  const hostile = behavior === 'hostile';
  const read = (ref: string): string => readFileSync(join(runDir, 'artifacts', ref.slice(7)), 'utf8');
  const specIds = [...read(envelope.inputs.spec as string).matchAll(/^(AC-[0-9]+):/gm)].map((m) => m[1] as string);
  const planIds = (JSON.parse(read(envelope.inputs.plan as string)) as Plan).units.flatMap((u) => u.acceptance_criteria);
  const missing = specIds.filter((id) => !planIds.includes(id));
  const unexamined = behavior === 'unexamined';
  return {
    schema_version: 1,
    record_type: 'audit-result',
    subject: { plan: envelope.inputs.plan as string, spec: envelope.inputs.spec as string },
    verdict: unexamined ? 'INCONCLUSIVE' : refuted ? 'REFUTED' : 'HOLDS',
    coverage: [
      unexamined
        ? { item: 'Criterion ids in the specification against plan units', status: 'NOT_CHECKED', evidence: '', note: 'FIXTURE: comparison deliberately not performed.' }
        : {
            item: 'Criterion ids in the specification against plan units',
            status: 'CHECKED',
            evidence: `FIXTURE comparison by test code: specification has ${specIds.join(', ')}; plan units carry ${[...new Set(planIds)].join(', ')}; missing: ${missing.join(', ') || 'none'}.`,
            note: 'Identifier comparison only; not a judgment that the plan would satisfy the criteria.',
          },
      { item: 'Whether each unit would actually satisfy its criteria', status: 'NOT_CHECKED', evidence: '', note: 'FIXTURE: no model examined the plan.' },
      { item: 'Repository evidence for claim C1', status: 'NOT_CHECKED', evidence: '', note: 'No repository in this fixture.' },
    ],
    findings: refuted
      ? [
          {
            id: 'F1',
            target: 'AC-3',
            classification: 'BLOCKING',
            evidence: `FIXTURE finding (scripted text, not an observation): exporter is called before authorization.${hostile ? ` ${HOSTILE}` : ''}`,
            consequence: 'The required no-call behavior is violated.',
            resolution: 'Move the invocation behind the authorization check.',
          },
        ]
      : [],
    limitations: ['FIXTURE audit: one identifier comparison by test code; no model and no semantic examination.'],
  };
}

function dispositions(runDir: string, envelope: TaskEnvelope): Dispositions {
  const ref = envelope.inputs.prior_audit as string;
  const prior = JSON.parse(readFileSync(join(runDir, 'artifacts', ref.slice(7)), 'utf8')) as Audit;
  return {
    schema_version: 1,
    record_type: 'finding-dispositions',
    audit: ref,
    dispositions: prior.findings.map((f) => ({ finding_id: f.id, disposition: 'ACCEPTED', note: 'SIMULATED: plan revised.' })),
  };
}

export function createFakeTransport(runsRoot: string, script: FakeScript = {}): RoleTransport & { dispatched: string[] } {
  const dispatched: string[] = [];

  // Writes the stage's files and returns the result that names them.
  function produce(envelope: TaskEnvelope, behavior: FakeBehavior): RoleResult {
    const runDir = join(runsRoot, envelope.run_id);
    const workDir = join(runDir, envelope.work_dir);
    mkdirSync(workDir, { recursive: true });
    const hostile = behavior === 'hostile';
    const content: Record<string, () => string> = {
      intent: () => intent(behavior === 'open-decision', hostile),
      spec: () => spec(hostile),
      plan: () => JSON.stringify(plan(envelope.round, behavior === 'uncovered', hostile), null, 2),
      audit: () => JSON.stringify(audit(runDir, envelope, behavior), null, 2),
      dispositions: () => JSON.stringify(dispositions(runDir, envelope), null, 2),
      proof: () => JSON.stringify(writeProof(join(runDir, envelope.app_dir as string), behavior), null, 2),
      review: () => JSON.stringify(review(runDir, envelope, behavior), null, 2),
    };
    if (envelope.step_id === 'implement') writeImplementation(join(runDir, envelope.app_dir as string), behavior);
    const files: Record<string, string> = {};
    for (const [key, file] of Object.entries(envelope.produces)) {
      writeFileSync(join(workDir, file), (content[key] as () => string)());
      files[key] = file;
    }
    return {
      schema_version: 1,
      record_type: 'role-result',
      run_id: envelope.run_id,
      attempt_id: envelope.attempt_id,
      role: envelope.role,
      expected_version: envelope.state_version,
      input_digest: envelope.input_digest,
      outcome: behavior === 'negative' ? 'NEGATIVE' : 'COMPLETED',
      summary: `SIMULATED ${envelope.role} result for ${envelope.step_id}`,
      outputs: {},
      files,
    };
  }

  return {
    id: 'fake',
    evidence_class: 'SIMULATED',
    dispatched,
    dispatch(envelope: TaskEnvelope): TransportDelivery[] {
      dispatched.push(envelope.attempt_id);
      const attempt = Number(envelope.attempt_id.slice(envelope.attempt_id.lastIndexOf('-') + 1));
      const behavior = script[envelope.step_id]?.[attempt - 1] ?? 'success';
      switch (behavior) {
        case 'malformed':
          return [{ kind: 'RESULT', raw: '{"record_type":"role-result","attempt_id":' }];
        case 'refusal':
          return [{ kind: 'FAILURE', failure: 'REFUSED', detail: 'SIMULATED refusal' }];
        case 'timeout':
          return [{ kind: 'FAILURE', failure: 'TIMEOUT', detail: 'SIMULATED timeout' }];
        case 'repeat': {
          const raw = JSON.stringify(produce(envelope, behavior));
          return [
            { kind: 'RESULT', raw },
            { kind: 'RESULT', raw },
          ];
        }
        default:
          return [{ kind: 'RESULT', raw: JSON.stringify(produce(envelope, behavior)) }];
      }
    },
  };
}

// A successful result for an envelope, with its files written. Test helper.
export function fakeResult(runsRoot: string, envelope: TaskEnvelope, behavior: FakeBehavior = 'success'): RoleResult {
  const raw = createFakeTransport(runsRoot, { [envelope.step_id]: Array(50).fill(behavior) }).dispatch(envelope)[0];
  if (raw?.kind !== 'RESULT') throw new Error(`behavior "${behavior}" yields no result`);
  return JSON.parse(raw.raw) as RoleResult;
}
