// Evaluation commands. Each prints one JSON reply. None of them runs a model
// or executes application code; the judge is a separate fresh session that
// reads the rubric and the packet and writes one file.
//
//   node scripts/evaluate.ts check     --run-dir <dir>
//   node scripts/evaluate.ts prepare   --run-dir <dir> --rubric <id> [--evaluation-id <id>]
//   node scripts/evaluate.ts accept    --run-dir <dir> --evaluation-id <id>
//   node scripts/evaluate.ts adjudicate --run-dir <dir> --evaluation-id <id> --question <id>
//                                      --label CONFIRM|REJECT|MODIFY|UNRESOLVED [--answer <answer>]
//                                      --note <text> --recorded-by <text> --provenance HUMAN_RECORDED|SCRIPTED
//   node scripts/evaluate.ts summary   --runs-root <dir> [--runs-root <dir>]... --rubric <id>
//                                      [--expectations <file>] [--out <file>]

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { evaluateDeterministic } from '../evals/deterministic.ts';
import { acceptEvaluation, adjudicate, prepareEvaluation } from '../evals/evaluation.ts';
import { type CaseExpectation, summarize } from '../evals/summary.ts';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMMANDS = ['check', 'prepare', 'accept', 'adjudicate', 'summary'];

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'run-dir': { type: 'string' },
    'runs-root': { type: 'string', multiple: true },
    rubric: { type: 'string' },
    'evaluation-id': { type: 'string' },
    question: { type: 'string' },
    label: { type: 'string' },
    answer: { type: 'string' },
    note: { type: 'string' },
    'recorded-by': { type: 'string' },
    provenance: { type: 'string' },
    expectations: { type: 'string' },
    out: { type: 'string' },
  },
});

function fail(message: string): never {
  process.stdout.write(`${JSON.stringify({ ok: false, message }, null, 2)}\n`);
  process.exit(2);
}

const command = positionals[0] ?? '';
if (!COMMANDS.includes(command)) fail(`expected one of: ${COMMANDS.join(', ')}`);
const need = (name: keyof typeof values): string => {
  const v = values[name];
  if (typeof v !== 'string' || !v) fail(`--${name} is required`);
  return v as string;
};

let reply: unknown;
try {
  if (command === 'summary') {
    const roots = values['runs-root'] ?? [];
    if (roots.length === 0) fail('--runs-root is required');
    const runDirs = roots.flatMap((root) =>
      readdirSync(resolve(root))
        .sort()
        .map((name) => join(resolve(root), name))
        .filter((dir) => statSync(dir).isDirectory()),
    );
    const expectations = values.expectations ? (JSON.parse(readFileSync(values.expectations, 'utf8')) as Record<string, CaseExpectation>) : {};
    const summary = summarize(runDirs, need('rubric'), expectations);
    if (values.out) {
      mkdirSync(dirname(resolve(values.out)), { recursive: true });
      writeFileSync(resolve(values.out), `${JSON.stringify(summary, null, 2)}\n`);
    }
    reply = summary;
  } else {
    const runDir = resolve(need('run-dir'));
    if (!existsSync(runDir)) fail('the run directory does not exist');
    if (command === 'check') reply = evaluateDeterministic(runDir);
    if (command === 'prepare') reply = prepareEvaluation(PACKAGE_ROOT, runDir, need('rubric'), { evaluationId: values['evaluation-id'] });
    if (command === 'accept') reply = acceptEvaluation(runDir, need('evaluation-id'));
    if (command === 'adjudicate') {
      reply = adjudicate(runDir, need('evaluation-id'), {
        question: need('question'),
        label: need('label'),
        answer: values.answer,
        note: need('note'),
        recorded_by: need('recorded-by'),
        // No default: an adjudication that does not say how it was recorded is refused.
        provenance: need('provenance'),
      });
    }
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}
process.stdout.write(`${JSON.stringify(reply, null, 2)}\n`);
