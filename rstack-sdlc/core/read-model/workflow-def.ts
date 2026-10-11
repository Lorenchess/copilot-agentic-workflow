// Parses a workflow definition as a run retained it (the canonical JSON the
// engine wrote under `workflow_ref`). The read model replays a run with the
// definition it was started under, so a run of an earlier or later workflow
// is shown as it was recorded, or refused as unsupported, never read through
// the engine's current definition.

import { asArray } from '../contracts/planning.ts';
import { type Parsed, asInt, asObject, asOneOf, asString, finish, newIssues, parseJson } from '../contracts/validate.ts';
import type { Contract, StageDef, WorkflowDef } from '../policies/workflow.ts';
import { workflowRef } from '../policies/workflow.ts';

const STAGE_ID = /^[a-z][a-z0-9-]{0,63}$/;
const KEY = /^[a-z][a-z0-9_-]{0,63}\??$/;
const CONTRACTS: readonly Contract[] = ['intent', 'spec', 'plan', 'audit', 'dispositions', 'proof', 'review', 'pr-review'];
const KINDS = ['role', 'human', 'deterministic'] as const;
const WAITS = ['PRODUCT_QUESTION', 'PLAN_DECISION'] as const;
const COPIES = ['base', 'proof_tree', 'candidate'] as const;

export function parseWorkflowDef(text: string): Parsed<WorkflowDef> {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  if (raw === undefined) return finish(issues, () => raw as never);
  const o = asObject(raw, 'workflow', ['workflow_id', 'workflow_version', 'audit_budget_max', 'max_question_rounds', 'stages'], [], issues);
  if (!o) return finish(issues, () => raw as never);
  asString(o.workflow_id, 'workflow.workflow_id', issues, { pattern: STAGE_ID });
  asInt(o.workflow_version, 'workflow.workflow_version', 1, Number.MAX_SAFE_INTEGER, issues);
  asInt(o.audit_budget_max, 'workflow.audit_budget_max', 1, 100, issues);
  asInt(o.max_question_rounds, 'workflow.max_question_rounds', 0, 100, issues);
  const ids = new Set<string>();
  const stages = asArray(o.stages, 'workflow.stages', issues, 100);
  if (stages.length === 0) issues.list.push('workflow.stages: at least one stage is required');
  stages.forEach((s, i) => {
    const p = `workflow.stages[${i}]`;
    const stage = asObject(s, p, ['id', 'kind', 'next'], ['role', 'mode', 'inputs', 'produces', 'consumes_audit', 'wait', 'app_copy', 'derives', 'shared_write_target'], issues);
    if (!stage) return;
    const id = asString(stage.id, `${p}.id`, issues, { pattern: STAGE_ID });
    if (ids.has(id)) issues.list.push(`${p}.id: "${id}" appears twice`);
    ids.add(id);
    const kind = asOneOf(stage.kind, `${p}.kind`, KINDS, issues);
    if (stage.next !== null) asString(stage.next, `${p}.next`, issues, { pattern: STAGE_ID });
    if (stage.role !== undefined) asString(stage.role, `${p}.role`, issues, { pattern: STAGE_ID });
    if (kind === 'role' && stage.role === undefined) issues.list.push(`${p}.role: a role stage needs a role`);
    if (stage.mode !== undefined) asString(stage.mode, `${p}.mode`, issues, { pattern: STAGE_ID });
    if (stage.inputs !== undefined) asArray(stage.inputs, `${p}.inputs`, issues, 50).forEach((x, j) => asString(x, `${p}.inputs[${j}]`, issues, { pattern: KEY }));
    if (stage.produces !== undefined) {
      asArray(stage.produces, `${p}.produces`, issues, 20).forEach((x, j) => {
        const q = `${p}.produces[${j}]`;
        const made = asObject(x, q, ['key', 'file', 'contract'], [], issues);
        if (!made) return;
        asString(made.key, `${q}.key`, issues, { pattern: KEY });
        asString(made.file, `${q}.file`, issues, { pattern: /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/ });
        asOneOf(made.contract, `${q}.contract`, CONTRACTS, issues);
      });
    }
    if (stage.consumes_audit !== undefined && typeof stage.consumes_audit !== 'boolean') issues.list.push(`${p}.consumes_audit: expected a boolean`);
    if (stage.shared_write_target !== undefined && typeof stage.shared_write_target !== 'boolean') issues.list.push(`${p}.shared_write_target: expected a boolean`);
    if (stage.wait !== undefined) asOneOf(stage.wait, `${p}.wait`, WAITS, issues);
    if (kind === 'human' && stage.wait === undefined) issues.list.push(`${p}.wait: a human stage needs a wait kind`);
    if (stage.app_copy !== undefined) asOneOf(stage.app_copy, `${p}.app_copy`, COPIES, issues);
    if (stage.derives !== undefined) asArray(stage.derives, `${p}.derives`, issues, 20).forEach((x, j) => asString(x, `${p}.derives[${j}]`, issues, { pattern: KEY }));
  });
  // Every `next` names a stage of this definition.
  stages.forEach((s, i) => {
    const next = (s as { next?: unknown } | null)?.next;
    if (typeof next === 'string' && !ids.has(next)) issues.list.push(`workflow.stages[${i}].next: "${next}" is not a stage`);
  });
  return finish(issues, () => raw as WorkflowDef);
}

// The main path: the first stage and every stage reached by following `next`.
// Stages off that path are branches the run enters only by a decision or a
// recorded condition (a product question, a plan revision).
export function mainPath(workflow: WorkflowDef): string[] {
  const path: string[] = [];
  const seen = new Set<string>();
  let current: StageDef | undefined = workflow.stages[0];
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.push(current.id);
    const next: string | null = current.next;
    current = next ? workflow.stages.find((s) => s.id === next) : undefined;
  }
  return path;
}

export function retainedWorkflowRef(workflow: WorkflowDef): string {
  return workflowRef(workflow);
}
