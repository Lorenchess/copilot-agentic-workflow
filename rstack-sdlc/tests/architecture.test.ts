// Dependency direction and write scope. Evidence class: engine tests
// (offline, static checks over the package source).

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { findScopeViolations } from '../scripts/check-scope.ts';
import { PACKAGE_ROOT } from './support/harness.ts';

function sourceFiles(dir: string): string[] {
  return readdirSync(join(PACKAGE_ROOT, dir), { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.ts'))
    .map((e) => join(e.parentPath, e.name));
}

function imports(file: string): string[] {
  const text = readFileSync(file, 'utf8');
  return [...text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)].map((m) => m[1] as string);
}

test('core imports only node built-ins and other core files', () => {
  const coreRoot = join(PACKAGE_ROOT, 'core') + sep;
  const files = sourceFiles('core');
  assert.ok(files.length >= 8);
  for (const file of files) {
    for (const spec of imports(file)) {
      if (spec.startsWith('node:')) continue;
      assert.ok(spec.startsWith('.'), `${relative(PACKAGE_ROOT, file)} imports package "${spec}"`);
      const target = resolve(file, '..', spec);
      assert.ok(target.startsWith(coreRoot), `${relative(PACKAGE_ROOT, file)} imports outside core: ${spec}`);
    }
  }
});

test('core names no model, vendor, IDE tool, or deferred service', () => {
  const forbidden = /opus|sonnet|\bsol\b|luna|terra|anthropic|openai|copilot|vscode|vs code|runsubagent|jira|bitbucket|github/i;
  const authored = readdirSync(join(PACKAGE_ROOT, 'core'), { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => join(e.parentPath, e.name));
  assert.ok(authored.length >= 3, 'role contracts and Skills are checked too');
  for (const file of [...sourceFiles('core'), ...authored]) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      assert.doesNotMatch(line, forbidden, `${relative(PACKAGE_ROOT, file)}:${i + 1}`);
    });
  }
});

test('adapters and scripts add no third-party runtime dependency', () => {
  const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')) as Record<string, unknown>;
  assert.equal(pkg.dependencies, undefined, 'no runtime dependencies');
  for (const dir of ['core', 'adapters', 'scripts']) {
    for (const file of sourceFiles(dir)) {
      for (const spec of imports(file)) {
        assert.ok(spec.startsWith('node:') || spec.startsWith('.'), `${relative(PACKAGE_ROOT, file)} imports "${spec}"`);
      }
    }
  }
});

test('SCOPE-1: a path outside the package is a violation unless exactly allowed', () => {
  const changed = [
    'rstack-sdlc/core/engine/engine.ts',
    'rstack-sdlc\\tests\\x.test.ts',
    '.gitignore',
    '.github/agents/pipeline.agent.md',
    '.vscode/settings.json',
    'rstack-pipeline/README.md',
    'rstack-sdlc-evil/file.ts',
    'docs/rstack-sdlc/notes.md',
  ];
  assert.deepEqual(findScopeViolations(changed, ['.gitignore']), [
    '.github/agents/pipeline.agent.md',
    '.vscode/settings.json',
    'docs/rstack-sdlc/notes.md',
    'rstack-pipeline/README.md',
    'rstack-sdlc-evil/file.ts',
  ]);
  assert.deepEqual(findScopeViolations(['.gitignore'], []), ['.gitignore'], 'the root ignore file needs an explicit allowance');
  assert.deepEqual(findScopeViolations(['rstack-sdlc/a', 'rstack-sdlc/b'], []), []);
});
