// Scope check: reports every changed, staged, or untracked path in the
// repository that is outside this package. Exits 1 when any is found.
//
//   node scripts/check-scope.ts [--base <commit>] [--allow <path>]...
//
// `--allow` names an exact repository path the owner has authorized.

import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const PACKAGE_PREFIX = 'rstack-sdlc/';

export function findScopeViolations(paths: readonly string[], allowed: readonly string[]): string[] {
  return [...new Set(paths)]
    .map((p) => p.replaceAll('\\', '/'))
    .filter((p) => p.length > 0 && !p.startsWith(PACKAGE_PREFIX) && !allowed.includes(p))
    .sort();
}

function git(cwd: string, args: string[]): string[] {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).split('\0').filter(Boolean);
}

export function changedPaths(repoRoot: string, base: string | undefined): string[] {
  // Porcelain v1 with -z: "XY path", and for renames a second entry with the old path.
  const status = git(repoRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all']).map((entry) =>
    /^[ MADRCU?!]{2} /.test(entry) ? entry.slice(3) : entry,
  );
  const sinceBase = base ? git(repoRoot, ['diff', '--name-only', '-z', base]) : [];
  return [...status, ...sinceBase];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    options: { base: { type: 'string' }, allow: { type: 'string', multiple: true } },
  });
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const allowed = values.allow ?? [];
  const violations = findScopeViolations(changedPaths(repoRoot, values.base), allowed);
  process.stdout.write(`${JSON.stringify({ ok: violations.length === 0, base: values.base ?? null, allowed, violations }, null, 2)}\n`);
  process.exitCode = violations.length === 0 ? 0 : 1;
}
