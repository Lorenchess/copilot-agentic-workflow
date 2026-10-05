// Plans, applies, verifies, and removes an installation of the generated
// VS Code Copilot package. Each command prints one JSON reply and exits 0
// when the reply is ok, 2 when the operation was refused or blocked, 1 on a
// usage error.
//
//   node scripts/install-package.ts plan      --workspace <dir> [--package <dir>]
//   node scripts/install-package.ts install   --workspace <dir> [--package <dir>] [--apply]
//   node scripts/install-package.ts verify    --workspace <dir>
//   node scripts/install-package.ts uninstall --workspace <dir> [--apply]
//
// Without --apply, install and uninstall only report what they would do.
// When this script runs from inside a generated package, that package is the
// default; from a source checkout --package is required. The working
// directory is never used to find the package or the workspace.

import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { PACKAGE_MANIFEST, PackageError, install, uninstall, verify } from '../adapters/copilot-vscode/install.ts';

const COMMANDS = ['plan', 'install', 'verify', 'uninstall'];

function usage(message: string): never {
  process.stderr.write(`${message}\ncommands: ${COMMANDS.join(', ')}\n`);
  process.exit(1);
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { workspace: { type: 'string' }, package: { type: 'string' }, apply: { type: 'boolean' } },
});
const command = positionals[0];
if (!command || !COMMANDS.includes(command) || positionals.length !== 1) usage('expected exactly one command');
if (!values.workspace) usage('--workspace is required');
const workspace = resolve(values.workspace);

// <package>/runtime/scripts/install-package.ts → <package>
const enclosing = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const packageDir = values.package ? resolve(values.package) : existsSync(join(enclosing, PACKAGE_MANIFEST)) ? enclosing : null;

let reply: { ok: boolean } & Record<string, unknown>;
try {
  if (command === 'verify') reply = { ...verify(workspace) };
  else if (command === 'uninstall') reply = { ...uninstall({ workspace, dryRun: !values.apply }) };
  else {
    if (!packageDir) usage('--package is required when this script is not run from a generated package');
    reply = { ...install({ packageDir, workspace, dryRun: command === 'plan' || !values.apply }) };
  }
} catch (e) {
  if (!(e instanceof PackageError)) throw e;
  reply = { ok: false, code: e.code, message: e.message, ...e.detail };
}
process.stdout.write(`${JSON.stringify(reply, null, 2)}\n`);
process.exitCode = reply.ok ? 0 : 2;
