// Generates the VS Code Copilot package into the ignored dist/copilot-vscode/.
// It installs nothing and writes nowhere else.
//
//   node scripts/generate-package.ts [--profile <file>] [--extensions <file>]
//
// Without --profile the active profile (profiles/trial-v2.json) is used;
// without --extensions the authored definition, which adds nothing.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { generatePackage } from '../adapters/copilot-vscode/generate.ts';
import { PackageError } from '../adapters/copilot-vscode/install.ts';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: { profile: { type: 'string' }, extensions: { type: 'string' } } });
try {
  const manifest = generatePackage({
    profileText: readFileSync(values.profile ?? join(PACKAGE_ROOT, 'profiles', 'trial-v2.json'), 'utf8'),
    extensionsText: values.extensions ? readFileSync(values.extensions, 'utf8') : undefined,
    outDir: join(PACKAGE_ROOT, 'dist', 'copilot-vscode'),
  });
  const count = (kind: string): number => manifest.files.filter((f) => f.kind === kind).length;
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        out_dir: 'dist/copilot-vscode',
        validation_status: manifest.validation_status,
        profile: manifest.profile,
        runtime_requirements: manifest.runtime_requirements,
        models: manifest.models,
        files: { agents: count('agent'), skills: count('skill'), runtime: count('runtime'), profile: count('profile'), manifest: 1 },
        installed_paths: manifest.files.filter((f) => f.path.startsWith('.github/')).map((f) => f.path),
      },
      null,
      2,
    )}\n`,
  );
} catch (e) {
  if (!(e instanceof PackageError)) throw e;
  process.stdout.write(`${JSON.stringify({ ok: false, code: e.code, message: e.message, ...e.detail }, null, 2)}\n`);
  process.exitCode = 2;
}
