// Composes the local proposal from retained evidence. Deterministic: the same
// records always give the same title and body, byte for byte.
//
// Two kinds of content, kept apart:
//   machine-owned  identities, measured paths and counts, acceptance criteria,
//                  commands and execution outcomes, both review verdicts, the
//                  planning decision and its provenance, evidence classes, and
//                  the publication status. Each is read from a retained record
//                  here. No model output is consulted for any of them.
//   narrative      the PR reviewer's title, summary, analysis of the change
//                  and of the testing, risks, limitations, and notes. It is
//                  placed only in the sections marked as the PR reviewer's.
// The proposal is built field by field from an explicit list. A PR review is
// never merged into it as an object, and it has no field through which it
// could state a path, a count, a test result, a verdict, or an authorization.
//
// All text that did not originate in this file is escaped before it is placed
// in the Markdown body: narrative, and also evidence-derived text such as
// paths, test names, and criteria. Headings and list structure come only from
// this file.

import type { ExecutionRecord, Proof, Review } from '../contracts/app.ts';
import type { FinalPlan, Spec } from '../contracts/planning.ts';
import type { ChangeSet, PrReview, PrReviewPacket } from '../contracts/pr-review.ts';
import type { TestOutcome, TransportClass } from '../contracts/ports.ts';
import type { DecisionAction, DecisionProvenance, PrProposal } from '../contracts/records.ts';
import { EngineBlock } from './errors.ts';

const MAX_LISTED_PATHS = 200;
// U+FFFD, shown in place of a control character.
const REPLACEMENT = String.fromCharCode(0xfffd);

// Text from outside this file, made inert for Markdown. Line breaks become
// spaces, so supplied text can never start a block (a heading, a list, a
// fence, a table row). Other control characters are shown as the replacement
// character. Markup, entity, emphasis, code, link, and template characters are
// escaped, and so is a leading character that would open a block.
export function mdText(value: string): string {
  return value
    .replace(/\r\n?|\n/g, ' ')
    .replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, REPLACEMENT)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]|~]/g, '\\$&')
    .trim()
    .replace(/^([-+=#])/, '\\$1')
    .replace(/^(\d+)([.)])/, '$1\\$2');
}

// An identity or other machine value known to contain no backtick.
const code = (value: string): string => `\`${value}\``;

// What an execution reported, without calling a count of entries a count of
// tests: a container's nested results are not in the report.
export function entryCounts(tests: readonly TestOutcome[]): string {
  const single = tests.filter((t) => t.kind === 'TEST');
  const containers = tests.filter((t) => t.kind === 'CONTAINER');
  const n = (status: TestOutcome['status']): number => single.filter((t) => t.status === status).length;
  return (
    `${tests.length} top-level report entries: ${single.length} single tests (${n('PASS')} passed, ${n('FAIL')} failed, ${n('SKIP')} skipped, ${n('TODO')} todo) ` +
    `and ${containers.length} containers (${containers.filter((t) => t.status === 'FAIL').length} failed). ` +
    'What is nested in a container is not reported, and an entry is not an assertion.'
  );
}

export interface ComposeInput {
  run_id: string;
  request_id: string;
  source_ref: string;
  transport_class: TransportClass;
  // Accepted role results by stage, by retained identity.
  evidence: Record<string, string>;
  packet_ref: string;
  packet: PrReviewPacket;
  pr_review_ref: string;
  pr_review: PrReview;
  review: Review;
  spec: Spec;
  proof: Proof;
  final_plan: FinalPlan;
  baseline: ExecutionRecord;
  verification: ExecutionRecord;
  decision: { decision_id: string; action: DecisionAction; provenance: DecisionProvenance };
  controlled_tests_dir: string;
}

function list(items: string[], none: string): string[] {
  return items.length > 0 ? items.map((i) => `- ${i}`) : [`- ${none}`];
}

function changedPaths(set: ChangeSet): string[] {
  const shown = set.paths.slice(0, MAX_LISTED_PATHS).map((p) => `${p.change.toLowerCase()}: ${mdText(p.path)}`);
  const rest = set.paths.length - shown.length;
  return [...shown, ...(rest > 0 ? [`and ${rest} more; the complete list is in the \`changes\` field of this record`] : [])];
}

function execution(label: string, record: ExecutionRecord): string[] {
  return [
    `${label}: outcome ${mdText(record.classification.outcome)}; exit code ${record.exit_code === null ? 'none' : record.exit_code}${record.timed_out ? '; timed out' : ''}; executor ${mdText(record.executor)}; command ${mdText(record.command.join(' '))}.`,
    '',
    entryCounts(record.tests),
  ];
}

export function composeProposal(input: ComposeInput): PrProposal {
  const { packet, pr_review: pr, review, final_plan: plan, verification, baseline } = input;
  // The composer writes a proposal for an approved candidate and for nothing else.
  if (pr.verdict !== 'APPROVE' || review.verdict !== 'ACCEPT') {
    throw new EngineBlock('JOURNAL_CORRUPT', 'a proposal needs an accepting code review and an approving PR review', {});
  }
  if (pr.subject.packet !== input.packet_ref || pr.subject.candidate !== packet.implementation.candidate) {
    throw new EngineBlock('PR_REVIEW_EVIDENCE_INCONSISTENT', 'the PR review is not of this packet and candidate', {});
  }
  const all = packet.changes.base_to_candidate;
  const implementation = packet.changes.proof_tree_to_candidate;
  const proofPaths = all.paths.filter((p) => p.path.startsWith(`${input.controlled_tests_dir}/`)).length;
  const reported = new Map(verification.tests.map((t) => [t.name, t]));
  const narrative = (entries: { text: string }[]): string[] => entries.map((e) => mdText(e.text));
  const finding = (f: Review['findings'][number]): string =>
    `${mdText(f.id)} (${f.classification}) ${mdText(f.target)}: ${mdText(f.evidence)} Consequence: ${mdText(f.consequence)} Resolution: ${mdText(f.resolution)}`;
  const unchecked = (coverage: Review['coverage']): string[] => coverage.filter((c) => c.status === 'NOT_CHECKED').map((c) => `${mdText(c.item)}: ${mdText(c.note)}`);

  const criteria = input.spec.criteria.map((c) => {
    const proven = input.proof.criteria.find((p) => p.criterion === c.id);
    const tests = (proven?.tests ?? []).map((name) => {
      const t = reported.get(name);
      return `"${mdText(name)}" ${t ? `${t.status} (${t.kind === 'TEST' ? 'single test' : 'container'})` : 'not reported'}`;
    });
    return `${mdText(c.id)}: ${mdText(c.text)} Route ${proven ? mdText(proven.route) : 'none'}. In the candidate verification: ${tests.join('; ') || 'no test named'}.`;
  });

  const authorization =
    `decision ${mdText(input.decision.decision_id)} (${input.decision.action}), recorded as ${input.decision.provenance}. ` +
    (input.decision.provenance === 'HUMAN_RECORDED'
      ? 'HUMAN_RECORDED is the recorder\'s claim that a human decided; it is not authentication.'
      : 'This is not a record of a human decision.');
  const history = packet.history;

  const body = [
    '## Summary',
    '',
    mdText(pr.summary),
    '',
    `Request ${code(input.request_id)}, run ${code(input.run_id)}, candidate ${code(packet.implementation.candidate)}.`,
    '',
    '## What changed',
    '',
    `Measured by the engine from the retained file trees, unchanged application to candidate: ${all.added} added, ${all.modified} modified, ${all.deleted} deleted.`,
    '',
    ...list(changedPaths(all), 'no path differs'),
    '',
    `Paths under the controlled-tests directory among these: ${proofPaths}. From the proof tree to the candidate, which is the implementation alone: ${implementation.added} added, ${implementation.modified} modified, ${implementation.deleted} deleted.`,
    '',
    'PR reviewer\'s analysis of the change:',
    '',
    ...list(narrative(pr.change_analysis), 'none given'),
    '',
    '## Verification',
    '',
    'Acceptance criteria, from the specification, with their proof:',
    '',
    ...list(criteria, 'none'),
    '',
    ...execution('Candidate verification, run by the engine on the exact candidate', verification),
    '',
    ...execution('Proof baseline, run by the engine on the unchanged application with the controlled tests', baseline),
    '',
    'PR reviewer\'s reading of the testing:',
    '',
    ...list(narrative(pr.testing_analysis), 'none given'),
    '',
    '## Risks and limitations',
    '',
    'PR reviewer, risks:',
    '',
    ...list(narrative(pr.risks), 'none stated'),
    '',
    'PR reviewer, limitations:',
    '',
    ...list(pr.limitations.map(mdText), 'none stated'),
    '',
    'PR review, findings that did not prevent approval:',
    '',
    ...list(pr.findings.map(finding), 'none'),
    '',
    'PR review, items not checked:',
    '',
    ...list(unchecked(pr.coverage), 'none'),
    '',
    'Code review, limitations:',
    '',
    ...list(review.limitations.map(mdText), 'none stated'),
    '',
    'Code review, findings that did not prevent acceptance:',
    '',
    ...list(review.findings.map(finding), 'none'),
    '',
    'Code review, items not checked:',
    '',
    ...list(unchecked(review.coverage), 'none'),
    '',
    `Plan: status ${plan.plan_status}; audit verdict ${plan.audit_verdict} in round ${plan.audit_round}, with ${plan.audit_checked_items} item(s) checked.`,
    '',
    'Plan amendments that were not audited:',
    '',
    ...list(plan.amendments.map((a) => `${mdText(a.id)} on ${mdText(a.target)}: ${mdText(a.text)}`), 'none'),
    '',
    'Audit items not checked:',
    '',
    ...list(plan.audit_unchecked.map((u) => `${mdText(u.item)}: ${mdText(u.note)}`), 'none'),
    '',
    'Audit findings left open:',
    '',
    ...list(plan.residual_findings.map((f) => `${mdText(f.id)} (${f.classification}) ${mdText(f.target)}`), 'none'),
    '',
    `Unsuccessful work recorded in this run before the PR review: ${history.failed_attempts.length} failed attempt(s), ${history.failed_verifications.length} failed verification(s), ${history.superseded_results.length} superseded result(s), ${history.invalidations} invalidated verification(s). Submissions the engine refused are not counted here.`,
    '',
    '## Review and planning basis',
    '',
    `- Code review: ${review.verdict}, record ${code(packet.technical_review.review)}.`,
    `- PR review: ${pr.verdict}, record ${code(input.pr_review_ref)}, of packet ${code(input.packet_ref)}.`,
    `- Role results and both reviews are ${input.transport_class} evidence${input.transport_class === 'SIMULATED' ? ': scripted fixture content, not the work of any model or person' : ''}. Test execution is ACTUAL_LOCAL_EXECUTION.`,
    `- Plan authorization: ${authorization}`,
    `- PR review procedure: ${code(packet.identity.review_procedure)}. Body format: ${code(packet.identity.composer_format)}.`,
    '',
    'PR reviewer\'s notes for the human reviewer:',
    '',
    ...list(pr.reviewer_notes.map(mdText), 'none'),
    '',
    '## Evidence references',
    '',
    ...[
      ['request', packet.requirements.source],
      ['intent', packet.requirements.intent],
      ['specification', packet.requirements.spec],
      ['final plan', packet.planning.final_plan],
      ['audit', packet.planning.audit],
      ['decision', packet.planning.decision],
      ['unchanged application', packet.implementation.base],
      ['proof tree', packet.implementation.proof_tree],
      ['candidate', packet.implementation.candidate],
      ['proof', packet.execution.proof],
      ['proof baseline', packet.execution.proof_baseline],
      ['verification', packet.execution.verification],
      ['code review', packet.technical_review.review],
      ['PR review packet', input.packet_ref],
      ['PR review', input.pr_review_ref],
    ].map(([name, ref]) => `- ${name}: ${code(ref as string)}`),
    '',
    'Identities are hashes of retained records and file trees; they do not name a revision in any repository. Publication status: NOT_ATTEMPTED. This is a local proposal; no pull request was created.',
    '',
  ].join('\n');

  return {
    schema_version: 2,
    record_type: 'pr-proposal',
    run_id: input.run_id,
    request_id: input.request_id,
    composer_format: packet.identity.composer_format,
    title: pr.title.trim(),
    body,
    base_ref: packet.implementation.base,
    candidate_ref: packet.implementation.candidate,
    proof: packet.execution.proof,
    proof_tree: packet.implementation.proof_tree,
    proof_baseline: packet.execution.proof_baseline,
    verification: packet.execution.verification,
    review: packet.technical_review.review,
    pr_review_packet: input.packet_ref,
    pr_review: input.pr_review_ref,
    reviews: {
      code_review: { record: packet.technical_review.review, verdict: 'ACCEPT' },
      pr_review: { record: input.pr_review_ref, verdict: 'APPROVE' },
    },
    changes: { added: all.added, modified: all.modified, deleted: all.deleted, paths: all.paths.map((p) => ({ path: p.path, change: p.change })) },
    source_ref: input.source_ref,
    evidence: input.evidence,
    planning_basis: {
      final_plan: packet.planning.final_plan,
      last_audited_plan: packet.planning.last_audited_plan,
      audit: packet.planning.audit,
      decision: packet.planning.decision,
      brief: packet.planning.brief,
      spec: packet.requirements.spec,
      intent: packet.requirements.intent,
    },
    status: 'PR_PROPOSAL_READY',
    publication_status: 'NOT_ATTEMPTED',
    evidence_class: input.transport_class,
    evidence_classes: {
      role_results: input.transport_class,
      review: input.transport_class,
      pr_review: input.transport_class,
      test_execution: 'ACTUAL_LOCAL_EXECUTION',
    },
    candidate_verification: 'PASSED_LOCAL_EXECUTION',
  };
}
