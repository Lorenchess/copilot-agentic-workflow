// Package-local engine commands. Each prints one JSON reply on stdout and
// exits 0 when the reply is ok, 2 when the engine refused, 1 on a usage error.
//
//   node scripts/rstack.ts start   --workspace <dir> --app <application dir> --request <file> [--request-id <id>]
//                                  [--request-text <text>] [--profile <file>]
//                                  [--source local] [--sink local] [--run-id <id>] [--simulated]
//   node scripts/rstack.ts status  --workspace <dir> --run <id>
//   node scripts/rstack.ts next    --workspace <dir> --run <id>
//   node scripts/rstack.ts submit  --workspace <dir> --run <id> --file <result.json>
//   node scripts/rstack.ts decide  --workspace <dir> --run <id> --file <decision.json>
//   node scripts/rstack.ts decide  --workspace <dir> --run <id> --action <action> --expected-version <n>
//                                  --decision-id <id> (--recorded-by <plain text> | --recorded-by-file <file>)
//                                  [--provenance HUMAN_RECORDED|SCRIPTED] [--answer-file <file>] [--amendments-file <file>]
//   node scripts/rstack.ts resume  --workspace <dir> --run <id>
//   node scripts/rstack.ts abandon --workspace <dir> --run <id> --attempt <id> (--reason <plain text> | --reason-file <file>)
//
// Text a human said (an answer, who recorded a decision, an abandon reason)
// is read from a file: the file's bytes are the text, as UTF-8, with nothing
// trimmed or added. A shell rewrites quoted arguments ("$true", backticks,
// "%NAME%"), and this program only ever sees the result. So an answer is
// never accepted inline, and an inline label or reason is accepted only when
// it consists of characters no supported shell rewrites.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import type { Reply } from '../core/engine/engine.ts';
import { createAssembly } from './assembly.ts';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const COMMANDS = ['start', 'status', 'next', 'submit', 'decide', 'resume', 'abandon'];

// Letters, digits, spaces and . , _ @ + - : unchanged inside double quotes by cmd.exe, PowerShell, and POSIX shells.
const PLAIN_TEXT = /^[\p{L}\p{N} .,_@+-]*$/u;
const UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

class Refused extends Error {
  readonly reply: Reply;
  constructor(code: string, run: string, detail: Record<string, unknown>) {
    super(code);
    this.reply = { ok: false, code, run_id: run, state_version: null, directive: null, ...detail };
  }
}

// One human text, from `--<name>-file` or, where allowed, inline.
function humanText(run: string, name: string, inline: string | undefined, file: string | undefined, inlineAllowed = true): string | undefined {
  if (inline !== undefined && file !== undefined) usage(`give --${name} or --${name}-file, not both`);
  if (file !== undefined) {
    let bytes: Uint8Array;
    try {
      bytes = readFileSync(file);
    } catch {
      throw new Refused('MISSING_INPUT', run, { locator: file });
    }
    try {
      return UTF8.decode(bytes);
    } catch {
      throw new Refused('INPUT_NOT_UTF8', run, { locator: file });
    }
  }
  if (inline !== undefined && !(inlineAllowed && PLAIN_TEXT.test(inline))) {
    throw new Refused('INLINE_TEXT_REFUSED', run, { flag: `--${name}`, use: `--${name}-file` });
  }
  return inline;
}

function usage(message: string): never {
  process.stderr.write(`${message}\ncommands: ${COMMANDS.join(', ')}\n`);
  process.exit(1);
}

async function main(): Promise<Reply> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      workspace: { type: 'string' },
      run: { type: 'string' },
      file: { type: 'string' },
      request: { type: 'string' },
      app: { type: 'string' },
      'request-id': { type: 'string' },
      'request-text': { type: 'string' },
      profile: { type: 'string' },
      source: { type: 'string' },
      sink: { type: 'string' },
      'run-id': { type: 'string' },
      'lock-timeout-ms': { type: 'string' },
      attempt: { type: 'string' },
      simulated: { type: 'boolean' },
      action: { type: 'string' },
      'expected-version': { type: 'string' },
      'decision-id': { type: 'string' },
      'recorded-by': { type: 'string' },
      'recorded-by-file': { type: 'string' },
      provenance: { type: 'string' },
      answer: { type: 'string' },
      'answer-file': { type: 'string' },
      'amendments-file': { type: 'string' },
      reason: { type: 'string' },
      'reason-file': { type: 'string' },
    },
  });
  const command = positionals[0];
  if (!command || !COMMANDS.includes(command) || positionals.length !== 1) usage('expected exactly one command');
  if (!values.workspace) usage('--workspace is required');
  const lockTimeoutMs = values['lock-timeout-ms'] ? Number(values['lock-timeout-ms']) : undefined;
  if (lockTimeoutMs !== undefined && !(Number.isInteger(lockTimeoutMs) && lockTimeoutMs > 0)) {
    usage('--lock-timeout-ms must be a positive integer');
  }
  const assembly = createAssembly(resolve(values.workspace), { engine: lockTimeoutMs ? { lockTimeoutMs } : {} });

  if (command === 'start') {
    return assembly.start({
      source: values.source,
      sink: values.sink,
      request: { path: values.request, text: values['request-text'], request_id: values['request-id'] },
      appDir: values.app ? resolve(values.app) : '',
      profilePath: values.profile ?? join(PACKAGE_ROOT, 'profiles', 'trial-v1.json'),
      runId: values['run-id'],
      transportClass: values.simulated ? 'SIMULATED' : 'MANUAL_TRANSPORT',
    });
  }

  const run = values.run;
  if (!run) usage('--run is required');
  const { engine } = assembly;
  if (command === 'status') return engine.status(run);
  if (command === 'next') return engine.next(run);
  if (command === 'resume') return engine.resume(run);
  if (command === 'abandon') {
    const reason = humanText(run, 'reason', values.reason, values['reason-file']);
    if (!values.attempt || !reason) usage('--attempt and a reason (--reason-file or --reason) are required');
    return engine.abandon(run, values.attempt, reason);
  }

  // A decision given as flags is bound to the version the human was shown.
  // The subjects are those the engine displays at exactly that version; if the
  // run has moved on, the engine rejects the decision as stale.
  if (command === 'decide' && values.action) {
    const version = Number(values['expected-version']);
    const recordedBy = humanText(run, 'recorded-by', values['recorded-by'], values['recorded-by-file']);
    const answer = humanText(run, 'answer', values.answer, values['answer-file'], false);
    if (!values['decision-id'] || recordedBy === undefined || !Number.isInteger(version)) {
      usage('--action needs --expected-version, --decision-id and --recorded-by-file or --recorded-by');
    }
    const current = engine.status(run);
    const subjects = current.directive?.kind === 'WAIT' ? current.directive.subjects : {};
    const amendmentsFile = values['amendments-file'];
    if (amendmentsFile && !existsSync(amendmentsFile)) {
      return { ok: false, code: 'MISSING_INPUT', run_id: run, state_version: null, directive: null, locator: amendmentsFile };
    }
    return engine.decide(
      run,
      JSON.stringify({
        schema_version: 1,
        record_type: 'human-decision',
        run_id: run,
        decision_id: values['decision-id'],
        expected_version: version,
        action: values.action,
        subjects,
        recorded_by: recordedBy,
        // Passed through as given. There is no default: a decision that does not
        // say how it was recorded is UNKNOWN and is refused outside simulated runs.
        ...(values.provenance !== undefined ? { provenance: values.provenance } : {}),
        ...(answer !== undefined ? { answer } : {}),
        ...(amendmentsFile ? { amendments: JSON.parse(readFileSync(amendmentsFile, 'utf8')) as unknown } : {}),
      }),
    );
  }

  const file = values.file;
  if (!file) usage('--file is required');
  if (!existsSync(file)) {
    return { ok: false, code: 'MISSING_INPUT', run_id: run, state_version: null, directive: null, locator: file };
  }
  const raw = readFileSync(file, 'utf8');
  return command === 'submit' ? engine.submit(run, raw) : engine.decide(run, raw);
}

const reply = await main().catch((e: unknown) => {
  if (e instanceof Refused) return e.reply;
  throw e;
});
process.stdout.write(`${JSON.stringify(reply, null, 2)}\n`);
process.exitCode = reply.ok ? 0 : 2;
