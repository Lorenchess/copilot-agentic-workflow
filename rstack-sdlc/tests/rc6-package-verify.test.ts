// RC6: `verify` checks the files of the package the installed commands run,
// not only that package's manifest.
//
// Installed commands execute the runtime inside the package directory. Before
// RC6, verification compared the package manifest's hash with the installed
// identity and stopped there, so a runtime file edited afterwards still
// verified CLEAN while the manifest was unchanged.
//
// Evidence class: generated-package checks (PACKAGE_TESTED). Every package
// and workspace is a disposable directory under tests/.tmp/. Nothing here
// installs into a real workspace or shows that a host loads an installed file.

import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { generatePackage } from '../adapters/copilot-vscode/generate.ts';
import { PACKAGE_MANIFEST, install, verify } from '../adapters/copilot-vscode/install.ts';
import { sha256Hex } from '../core/contracts/records.ts';
import { PROFILE, tmpDir } from './support/harness.ts';

const profileText = readFileSync(PROFILE, 'utf8');
const ENGINE = 'runtime/core/engine/engine.ts';
const LOCK = 'runtime/core/engine/lock.ts';
const PROFILE_FILE = 'runtime/profiles/trial-v1.json';
const REVIEWER_TEMPLATE = '.github/agents/rstack-sdlc-reviewer.agent.md';

// Every file with its hash, and every directory.
function snapshot(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .map((e) => {
      const full = join(e.parentPath, e.name);
      const rel = relative(dir, full).replaceAll('\\', '/');
      return e.isDirectory() ? `${rel}/` : `${rel}:${sha256Hex(readFileSync(full))}`;
    })
    .sort();
}

// A generated package installed into an empty workspace beside it.
function installed(label: string): { base: string; packageDir: string; workspace: string } {
  const base = tmpDir(label);
  const packageDir = join(base, 'package');
  generatePackage({ profileText, outDir: packageDir });
  const workspace = join(base, 'workspace');
  mkdirSync(workspace);
  assert.equal(install({ packageDir, workspace, dryRun: false }).ok, true);
  return { base, packageDir, workspace };
}

// Verification reads; it never writes, repairs, or installs.
function verifyReadOnly(base: string, workspace: string): ReturnType<typeof verify> {
  const before = snapshot(base);
  const report = verify(workspace);
  assert.deepEqual(snapshot(base), before, 'verify changed nothing in the package or the workspace');
  return report;
}

test('RC6 control: an unchanged package verifies CLEAN, with no package file reported', () => {
  const { base, workspace } = installed('rc6-control');
  const report = verifyReadOnly(base, workspace);
  assert.deepEqual([report.ok, report.code, report.package], [true, 'CLEAN', 'PRESENT']);
  assert.deepEqual(report.package_files, []);
  assert.ok(report.files.length === 8 && report.files.every((f) => f.status === 'OK'));
});

test('RC6: a runtime file changed after installation is reported as drift while the package manifest is unchanged', () => {
  const { base, packageDir, workspace } = installed('rc6-runtime-modified');
  const manifestBefore = readFileSync(join(packageDir, PACKAGE_MANIFEST));
  const engine = join(packageDir, ENGINE);
  const original = readFileSync(engine);
  // The audit's counterexample: a harmless comment appended to the engine the installed commands run.
  appendFileSync(engine, '\n// changed after installation\n');

  const report = verifyReadOnly(base, workspace);
  assert.deepEqual([report.ok, report.code, report.package], [false, 'DRIFT', 'FILES_CHANGED']);
  assert.deepEqual(report.package_files, [{ path: ENGINE, status: 'MODIFIED' }]);
  assert.ok(report.files.every((f) => f.status === 'OK'), 'the installed workspace files themselves are unchanged');
  assert.deepEqual(readFileSync(join(packageDir, PACKAGE_MANIFEST)), manifestBefore, 'the manifest was never touched');

  writeFileSync(engine, original);
  assert.deepEqual([verify(workspace).code, verify(workspace).package], ['CLEAN', 'PRESENT']);
});

test('RC6: a missing runtime file, a changed profile, and a changed template are each named', () => {
  const { base, packageDir, workspace } = installed('rc6-several');
  rmSync(join(packageDir, LOCK));
  appendFileSync(join(packageDir, PROFILE_FILE), '\n');
  appendFileSync(join(packageDir, REVIEWER_TEMPLATE), '\nextra instruction\n');

  const report = verifyReadOnly(base, workspace);
  assert.deepEqual([report.ok, report.code, report.package], [false, 'DRIFT', 'FILES_CHANGED']);
  assert.deepEqual(
    [...report.package_files].sort((a, b) => a.path.localeCompare(b.path)),
    [
      { path: REVIEWER_TEMPLATE, status: 'MODIFIED' },
      { path: LOCK, status: 'MISSING' },
      { path: PROFILE_FILE, status: 'MODIFIED' },
    ],
  );
});

test('RC6: the earlier package states keep their meaning', () => {
  // Another manifest behind the installation: CHANGED, and its files are not judged against the installed identity.
  const changed = installed('rc6-manifest-changed');
  const manifestPath = join(changed.packageDir, PACKAGE_MANIFEST);
  writeFileSync(manifestPath, `${readFileSync(manifestPath, 'utf8')}\n`);
  appendFileSync(join(changed.packageDir, ENGINE), '\n// also changed\n');
  const afterChange = verifyReadOnly(changed.base, changed.workspace);
  assert.deepEqual([afterChange.ok, afterChange.code, afterChange.package, afterChange.package_files], [false, 'DRIFT', 'CHANGED', []]);

  // The package is gone.
  const missing = installed('rc6-package-missing');
  rmSync(missing.packageDir, { recursive: true, force: true });
  const afterRemoval = verify(missing.workspace);
  assert.deepEqual([afterRemoval.ok, afterRemoval.code, afterRemoval.package, afterRemoval.package_files], [false, 'DRIFT', 'MISSING', []]);

  // An installed workspace file changed while the package is intact.
  const edited = installed('rc6-installed-edited');
  appendFileSync(join(edited.workspace, REVIEWER_TEMPLATE), '\nMy own notes.\n');
  const afterEdit = verifyReadOnly(edited.base, edited.workspace);
  assert.deepEqual([afterEdit.ok, afterEdit.code, afterEdit.package, afterEdit.package_files], [false, 'DRIFT', 'PRESENT', []]);
  assert.deepEqual(afterEdit.files.filter((f) => f.status !== 'OK'), [{ path: REVIEWER_TEMPLATE, status: 'MODIFIED' }]);

  // Nothing installed.
  const none = verify(tmpDir('rc6-not-installed'));
  assert.deepEqual([none.ok, none.code, none.package, none.package_files], [true, 'NOT_INSTALLED', null, []]);
});

test('RC6: the verify command exits 2 and names the drifted runtime file', async () => {
  const { spawnSync } = await import('node:child_process');
  const { packageDir, workspace } = installed('rc6-command');
  // The installer shipped inside the package, as an installed workspace would run it.
  const script = join(packageDir, 'runtime', 'scripts', 'install-package.ts');
  const run = (): { status: number | null; reply: { code: string; package: string; package_files: unknown[] } } => {
    const r = spawnSync(process.execPath, [script, 'verify', '--workspace', workspace], { encoding: 'utf8' });
    return { status: r.status, reply: JSON.parse(r.stdout) as { code: string; package: string; package_files: unknown[] } };
  };
  assert.deepEqual([run().status, run().reply.code], [0, 'CLEAN']);
  appendFileSync(join(packageDir, 'runtime', 'core', 'engine', 'state.ts'), '\n// changed after installation\n');
  const drift = run();
  assert.equal(drift.status, 2);
  assert.deepEqual([drift.reply.code, drift.reply.package], ['DRIFT', 'FILES_CHANGED']);
  assert.deepEqual(drift.reply.package_files, [{ path: 'runtime/core/engine/state.ts', status: 'MODIFIED' }]);
});
