// The single machine-owned route. Prompts and adapters derive from this; they
// do not keep their own copy. A run records this definition's identity at
// start and refuses to continue under a different one.

import { canonicalJson, refOf } from '../contracts/records.ts';

export type Contract = 'intent' | 'spec' | 'plan' | 'audit' | 'dispositions' | 'proof' | 'review' | 'pr-review';

export interface Produced {
  key: string;
  file: string;
  contract: Contract;
}

export interface StageDef {
  id: string;
  kind: 'role' | 'human' | 'deterministic';
  role?: string;
  mode?: string;
  // Subject keys handed to the role as inputs. A trailing "?" marks an input
  // that is passed only when it exists.
  inputs?: string[];
  // Files the role must deliver; each is checked against its contract and
  // retained under the given subject key.
  produces?: Produced[];
  consumes_audit?: boolean;
  wait?: 'PRODUCT_QUESTION' | 'PLAN_DECISION';
  // The attempt gets its own copy of the application, re-created from this
  // retained tree: the unchanged base, the base plus controlled proof, or the
  // candidate. Attempts never share a copy.
  app_copy?: 'base' | 'proof_tree' | 'candidate';
  // Subject keys the engine derives itself when it accepts this stage's result.
  derives?: string[];
  // The stage writes somewhere attempts share. Abandoning such an attempt does
  // not stop its worker, so the run blocks instead of dispatching a
  // replacement beside it. No stage of this workflow does: each attempt works
  // in its own copy. The rule stays for any stage that cannot be isolated.
  shared_write_target?: boolean;
  next: string | null;
}

export interface WorkflowDef {
  workflow_id: string;
  workflow_version: number;
  audit_budget_max: number;
  max_question_rounds: number;
  stages: StageDef[];
}

export const WORKFLOW: WorkflowDef = {
  workflow_id: 'local-request-to-proposal',
  workflow_version: 6,
  audit_budget_max: 2,
  max_question_rounds: 3,
  stages: [
    {
      id: 'intent',
      kind: 'role',
      role: 'planner',
      mode: 'intake',
      inputs: ['source', 'answers?'],
      produces: [{ key: 'intent', file: 'intent.md', contract: 'intent' }],
      next: 'spec',
    },
    { id: 'product-question', kind: 'human', wait: 'PRODUCT_QUESTION', next: 'intent' },
    {
      id: 'spec',
      kind: 'role',
      role: 'planner',
      mode: 'specification',
      inputs: ['source', 'intent'],
      produces: [{ key: 'spec', file: 'spec.md', contract: 'spec' }],
      next: 'plan',
    },
    {
      id: 'plan',
      kind: 'role',
      role: 'planner',
      mode: 'plan',
      inputs: ['source', 'intent', 'spec'],
      produces: [{ key: 'plan', file: 'plan.json', contract: 'plan' }],
      next: 'plan-audit',
    },
    {
      // Entered only when the human asks for a second round.
      id: 'plan-revision',
      kind: 'role',
      role: 'planner',
      mode: 'revision',
      inputs: ['source', 'intent', 'spec', 'prior_plan', 'prior_audit'],
      produces: [
        { key: 'dispositions', file: 'dispositions.json', contract: 'dispositions' },
        { key: 'plan', file: 'plan.json', contract: 'plan' },
      ],
      next: 'plan-audit',
    },
    {
      // The auditor receives the complete plan and the original requirements,
      // never an earlier audit or the planner's dispositions.
      id: 'plan-audit',
      kind: 'role',
      role: 'plan-auditor',
      mode: 'audit',
      inputs: ['source', 'intent', 'spec', 'plan'],
      produces: [{ key: 'audit', file: 'audit.json', contract: 'audit' }],
      consumes_audit: true,
      next: 'brief',
    },
    { id: 'brief', kind: 'deterministic', next: 'plan-decision' },
    { id: 'plan-decision', kind: 'human', wait: 'PLAN_DECISION', next: 'proof' },
    {
      // The tester writes controlled tests in a copy of the unchanged application.
      // The engine then runs them there itself; the proof is accepted only if
      // that run shows what the proof claims.
      id: 'proof',
      kind: 'role',
      role: 'tester',
      mode: 'proof',
      inputs: ['source', 'spec', 'final_plan', 'base'],
      app_copy: 'base',
      produces: [{ key: 'proof', file: 'proof.json', contract: 'proof' }],
      derives: ['proof_tree', 'proof_baseline'],
      next: 'implement',
    },
    {
      // The developer works in a copy that already holds the controlled tests
      // and may not change them. The engine measures the result as the candidate.
      id: 'implement',
      kind: 'role',
      role: 'developer',
      mode: 'implement',
      inputs: ['spec', 'final_plan', 'proof', 'proof_tree', 'verification?'],
      app_copy: 'proof_tree',
      derives: ['candidate'],
      next: 'verify',
    },
    { id: 'verify', kind: 'deterministic', next: 'review' },
    {
      // The reviewer gets records, not a narrative: the specification, the final
      // plan with its amendments, the complete audit, the proof and both runs,
      // and the exact candidate.
      id: 'review',
      kind: 'role',
      role: 'reviewer',
      mode: 'review',
      inputs: ['source', 'spec', 'final_plan', 'audit', 'proof', 'proof_tree', 'proof_baseline', 'base', 'candidate', 'verification'],
      app_copy: 'candidate',
      produces: [{ key: 'review', file: 'review.json', contract: 'review' }],
      next: 'pr-review-packet',
    },
    // After technical acceptance the engine assembles one record of references
    // and measured facts: what a submission review may rely on, and nothing else.
    { id: 'pr-review-packet', kind: 'deterministic', next: 'pr-review' },
    {
      // A second, separate review: is this change ready to be submitted, and is
      // what will be said about it supported by the retained evidence? The code
      // review stays the technical gate; this one cannot override it. Only
      // APPROVE lets the proposal be composed.
      id: 'pr-review',
      kind: 'role',
      role: 'pr-reviewer',
      mode: 'pr-review',
      inputs: [
        'pr_review_packet',
        'pr_review_procedure',
        'source',
        'intent',
        'spec',
        'final_plan',
        'audit',
        'proof',
        'proof_tree',
        'proof_baseline',
        'base',
        'candidate',
        'verification',
        'review',
      ],
      app_copy: 'candidate',
      produces: [{ key: 'pr_review', file: 'pr-review.json', contract: 'pr-review' }],
      next: 'proposal',
    },
    { id: 'proposal', kind: 'deterministic', next: null },
  ],
};

export function workflowRef(workflow: WorkflowDef): string {
  return refOf(canonicalJson(workflow));
}

export function dispatchRoles(workflow: WorkflowDef): string[] {
  return [...new Set(workflow.stages.flatMap((s) => (s.role ? [s.role] : [])))];
}

export function stageOf(workflow: WorkflowDef, id: string): StageDef | null {
  return workflow.stages.find((s) => s.id === id) ?? null;
}

// What the human may choose at a wait. A second audit can be requested once,
// after the first, while the budget allows it. There is no third.
export function allowedActions(
  workflow: WorkflowDef,
  wait: StageDef['wait'],
  round: number,
  auditsUsed: number,
): string[] {
  if (wait === 'PRODUCT_QUESTION') return ['answer', 'reject'];
  const actions = ['proceed', 'amend', 'pause', 'reject'];
  if (round === 1 && auditsUsed < workflow.audit_budget_max) actions.splice(2, 0, 'second-audit');
  return actions;
}

// Subjects a decision at this wait must name exactly as displayed.
export function decisionSubjectKeys(wait: StageDef['wait']): string[] {
  return wait === 'PRODUCT_QUESTION' ? ['intent'] : ['intent', 'spec', 'plan', 'audit', 'brief'];
}
