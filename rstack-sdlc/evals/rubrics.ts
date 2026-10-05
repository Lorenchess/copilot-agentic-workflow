// Rubric registry. A rubric version is a fixed set of question ids and a
// fixed answer vocabulary. Evaluations are validated against, and aggregated
// within, exactly one version; answers under different versions are never
// combined, because the questions are not the same measurement.

export type Dimension = 'control' | 'execution' | 'proof' | 'content' | 'authorization';

export interface Rubric {
  id: string;
  file: string;
  // UNKNOWN: the packet does not contain the evidence to answer.
  // NOT_APPLICABLE: the question has no subject in this run (for example, no
  // candidate exists because the run stopped earlier). Not every version has it.
  answers: readonly string[];
  questions: { id: string; dimension: Dimension }[];
}

const q = (dimension: Dimension, ...ids: string[]): Rubric['questions'] => ids.map((id) => ({ id, dimension }));

export const RUBRICS: Record<string, Rubric> = {
  // Versions 1 and 2 are kept exactly as they were used for EVAL-1 and EVAL-2.
  'planning-run-v1': {
    id: 'planning-run-v1',
    file: 'evals/rubrics/planning-run-v1.md',
    answers: ['YES', 'NO', 'UNKNOWN'],
    questions: [
      ...q('control', 'human-gate', 'decision-basis', 'audit-independence-inputs', 'final-plan-disclosure', 'evidence-class'),
      ...q('content', 'audit-honesty', 'plan-traceability', 'content-quality'),
    ],
  },
  'planning-run-v2': {
    id: 'planning-run-v2',
    file: 'evals/rubrics/planning-run-v2.md',
    answers: ['YES', 'NO', 'UNKNOWN'],
    questions: [
      ...q('control', 'gate-ordering', 'brief-ordering', 'decision-basis', 'audit-inputs', 'final-plan-disclosure', 'planning-basis-links', 'evidence-class', 'unsuccessful-attempts', 'workflow-basis'),
      ...q('authorization', 'human-authorization-observed'),
      ...q('content', 'audit-coverage-stated', 'audit-verdict-supported', 'plan-traceability', 'content-quality'),
    ],
  },
  'run-v3': {
    id: 'run-v3',
    file: 'evals/rubrics/run-v3.md',
    answers: ['YES', 'NO', 'UNKNOWN', 'NOT_APPLICABLE'],
    questions: [
      ...q('content', 'spec-fidelity', 'plan-serves-spec', 'audit-verdict-supported', 'candidate-within-scope', 'review-verdict-supported'),
      ...q('authorization', 'human-authorization-observed'),
      ...q('proof', 'proof-red-meaningful', 'proof-satisfied-sensitive'),
      ...q('execution', 'verification-supports-candidate'),
      ...q('control', 'unsuccessful-work-visible', 'evidence-classes-stated', 'outcome-claim-accurate'),
    ],
  },
  // Version 3 is kept exactly as it was used. Version 4 repeats its questions
  // and adds those about the PR review and the composed proposal. Answers
  // under the two are never combined; for a run whose workflow has no PR
  // review, the added questions are NOT_APPLICABLE.
  'run-v4': {
    id: 'run-v4',
    file: 'evals/rubrics/run-v4.md',
    answers: ['YES', 'NO', 'UNKNOWN', 'NOT_APPLICABLE'],
    questions: [
      ...q('content', 'spec-fidelity', 'plan-serves-spec', 'audit-verdict-supported', 'candidate-within-scope', 'review-verdict-supported'),
      ...q('authorization', 'human-authorization-observed'),
      ...q('proof', 'proof-red-meaningful', 'proof-satisfied-sensitive'),
      ...q('execution', 'verification-supports-candidate'),
      ...q('control', 'unsuccessful-work-visible', 'evidence-classes-stated', 'outcome-claim-accurate'),
      ...q('content', 'pr-review-verdict-supported', 'pr-description-accurate', 'pr-testing-claims-bounded', 'pr-risks-disclosed'),
    ],
  },
};
