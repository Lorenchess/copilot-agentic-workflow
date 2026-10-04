// Installation, drift detection, and removal of the generated package.
// Evidence class: generated-package checks (PACKAGE_TESTED). Every
// destination is a disposable directory under tests/.tmp/. Nothing here
// installs into a real workspace, and nothing shows that a host discovers or
// loads an installed file.

import assert from 'node:assert/strict';
import fs, { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { join, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { generatePackage } from '../adapters/copilot-vscode/generate.ts';
import { type InstallManifest, type OperationReport, PackageError, install, uninstall, verify } from '../adapters/copilot-vscode/install.ts';
import { sha256Hex } from '../core/contracts/records.ts';
import { PACKAGE_ROOT, PROFILE, tmpDir } from './support/harness.ts';

const profileText = readFileSync(PROFILE, 'utf8');
const MANIFEST = '.github/rstack-sdlc-install.json';
const REVIEWER = '.github/agents/rstack-sdlc-reviewer.agent.md';
const PLANNER = '.github/agents/rstack-sdlc-planner.agent.md';
const OWNED = [
  '.github/agents/rstack-sdlc-coordinator.agent.md',
  '.github/agents/rstack-sdlc-developer.agent.md',
  '.github/agents/rstack-sdlc-plan-auditor.agent.md',
  PLANNER,
  REVIEWER,
  '.github/agents/rstack-sdlc-tester.agent.md',
  '.github/skills/rstack-sdlc-application-records/SKILL.md',
  '.github/skills/rstack-sdlc-planning-records/SKILL.md',
];
const OPTIONAL_SKILL = JSON.stringify({
  schema_version: 1,
  record_type: 'package-extensions',
  optional_skills: [{ id: 'change-notes', source: 'tests/fixtures/extensions/change-notes/SKILL.md', description: 'Use when the human asks for change notes.', roles: ['developer'] }],
  instructions: [],
});

// Every file with its hash, and every directory, so a leftover empty directory is seen too.
function snapshot(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .map((e) => {
      const full = join(e.parentPath, e.name);
      const rel = relative(dir, full).replaceAll('\\', '/');
      return e.isDirectory() ? `${rel}/` : `${rel}:${sha256Hex(readFileSync(full))}`;
    })
    .sort();
}

const files = (dir: string): string[] => snapshot(dir).filter((l) => !l.endsWith('/')).map((l) => l.slice(0, l.lastIndexOf(':')));

// A generated package and an empty workspace beside it, in one disposable directory.
function fixture(label: string, extensionsText?: string): { base: string; packageDir: string; workspace: string } {
  const base = tmpDir(label);
  const packageDir = join(base, 'package');
  generatePackage({ profileText, outDir: packageDir, extensionsText });
  const workspace = join(base, 'workspace');
  mkdirSync(workspace);
  return { base, packageDir, workspace };
}

function put(workspace: string, rel: string, content: string): void {
  mkdirSync(resolve(workspace, rel, '..'), { recursive: true });
  writeFileSync(join(workspace, rel), content);
}

function codeOf(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof PackageError, `expected a PackageError, got ${String(e)}`);
    return e.code;
  }
  return 'NO_ERROR';
}

function errorOf(fn: () => unknown): PackageError {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof PackageError, `expected a PackageError, got ${String(e)}`);
    return e;
  }
  throw new Error('expected a PackageError, and nothing was thrown');
}

type WriteFile = (path: string, data: string | Uint8Array) => void;

// Runs `run` with every file write, the installer's included, passing through
// `fault`, which may write part of a file, throw, or pass the call on. The
// real function is put back afterwards, whatever happens.
function withWriteFault<T>(fault: (path: string, data: string | Uint8Array, real: WriteFile) => void, run: () => T): T {
  const real = fs.writeFileSync;
  fs.writeFileSync = ((path: string, data: string | Uint8Array) => fault(String(path).replaceAll('\\', '/'), data, real as WriteFile)) as typeof fs.writeFileSync;
  syncBuiltinESMExports();
  try {
    return run();
  } finally {
    fs.writeFileSync = real;
    syncBuiltinESMExports();
  }
}

const kinds = (r: OperationReport): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const a of r.actions) out[a.action] = (out[a.action] ?? 0) + 1;
  return out;
};

test('a dry run reports the plan and writes nothing; applying it writes only owned paths', () => {
  const { packageDir, workspace } = fixture('install-plan');
  put(workspace, 'README.md', 'user file\n');
  put(workspace, '.github/workflows/ci.yml', 'user workflow\n');
  put(workspace, '.github/agents/my-own.agent.md', 'user agent\n');
  const before = snapshot(workspace);

  // Dry by default, and when asked.
  for (const plan of [install({ packageDir, workspace }), install({ packageDir, workspace, dryRun: true })]) {
    assert.deepEqual([plan.ok, plan.code, plan.dry_run, plan.applied], [true, 'PLAN_READY', true, []]);
    assert.deepEqual(plan.actions.map((a) => [a.path, a.action]), OWNED.map((p) => [p, 'CREATE']));
    assert.equal(plan.host_validation, 'NOT_OBSERVED');
  }
  assert.deepEqual(snapshot(workspace), before, 'the dry run wrote nothing');

  const done = install({ packageDir, workspace, dryRun: false });
  assert.deepEqual([done.ok, done.code], [true, 'INSTALLED']);
  assert.deepEqual(done.applied, [...OWNED, MANIFEST]);
  assert.deepEqual(files(workspace), ['.github/agents/my-own.agent.md', ...OWNED.slice(0, 6), MANIFEST, ...OWNED.slice(6), '.github/workflows/ci.yml', 'README.md'].sort());
  for (const line of before.filter((l) => !l.endsWith('/'))) assert.ok(snapshot(workspace).includes(line), `unrelated file kept: ${line}`);

  // The manifest names exactly the owned files with the hashes of what was written.
  const manifest = JSON.parse(readFileSync(join(workspace, MANIFEST), 'utf8')) as InstallManifest;
  assert.deepEqual(manifest.files.map((f) => f.path), OWNED);
  for (const f of manifest.files) assert.equal(sha256Hex(readFileSync(join(workspace, f.path))), f.sha256);
  assert.deepEqual(manifest.created_dirs, ['.github/skills', '.github/skills/rstack-sdlc-application-records', '.github/skills/rstack-sdlc-planning-records']);

  // Placeholders are filled with absolute, quoted paths; none is left.
  const forward = (p: string): string => p.replaceAll('\\', '/');
  const coordinator = readFileSync(join(workspace, OWNED[0]!), 'utf8');
  const engine = `node "${forward(packageDir)}/runtime/scripts/rstack.ts"`;
  assert.equal(done.engine_command, engine);
  assert.ok(coordinator.includes(`${engine} start --workspace "${forward(workspace)}" --profile "${forward(packageDir)}/runtime/profiles/trial-v1.json" --app`));
  assert.ok(coordinator.includes(`The run directory is \`${forward(workspace)}/.rstack/runs/<run-id>/\``));
  for (const p of OWNED) assert.doesNotMatch(readFileSync(join(workspace, p), 'utf8'), /\{\{[A-Z_]+\}\}/, p);

  assert.deepEqual([verify(workspace).code, verify(workspace).package], ['CLEAN', 'PRESENT']);
});

test('PACKAGE-1: a file the installer did not install is never overwritten', () => {
  const { packageDir, workspace } = fixture('install-collision');
  put(workspace, PLANNER, 'my own planner agent\n');
  const before = snapshot(workspace);
  for (const dryRun of [true, false]) {
    const r = install({ packageDir, workspace, dryRun });
    assert.deepEqual([r.ok, r.code, r.applied], [false, 'BLOCKED', []]);
    assert.deepEqual(r.blocked_by.map((a) => [a.path, a.action]), [[PLANNER, 'COLLISION']]);
    assert.deepEqual(snapshot(workspace), before, 'nothing was written, not even the files that did not collide');
  }
  assert.equal(uninstall({ workspace, dryRun: false }).code, 'NOT_INSTALLED', 'and nothing is removed, because nothing was installed');
  assert.deepEqual(snapshot(workspace), before);

  // An unmanaged file with exactly the bytes that would be written is still
  // not the installer's: it is a collision, never adopted, and never removed.
  const other = fixture('install-identical');
  put(other.workspace, 'notes.txt', 'user file\n');
  install({ packageDir: other.packageDir, workspace: other.workspace, dryRun: false });
  const installed = readFileSync(join(other.workspace, PLANNER));
  uninstall({ workspace: other.workspace, dryRun: false });
  mkdirSync(join(other.workspace, '.github/agents'), { recursive: true });
  writeFileSync(join(other.workspace, PLANNER), installed);
  const unmanaged = snapshot(other.workspace);
  assert.deepEqual(files(other.workspace), [PLANNER, 'notes.txt']);
  for (const dryRun of [true, false]) {
    const r = install({ packageDir: other.packageDir, workspace: other.workspace, dryRun });
    assert.deepEqual([r.ok, r.code, r.applied], [false, 'BLOCKED', []], `identical unmanaged file, dryRun ${dryRun}`);
    assert.deepEqual(r.blocked_by.map((a) => [a.path, a.action]), [[PLANNER, 'COLLISION']]);
    assert.deepEqual(snapshot(other.workspace), unmanaged, 'nothing was written and no install manifest was created');
  }
  assert.equal(verify(other.workspace).code, 'NOT_INSTALLED');
  for (const dryRun of [true, false]) assert.equal(uninstall({ workspace: other.workspace, dryRun }).code, 'NOT_INSTALLED');
  assert.deepEqual(snapshot(other.workspace), unmanaged, 'removal has nothing to remove and the unmanaged file is intact');
  assert.deepEqual(readFileSync(join(other.workspace, PLANNER)), installed);

  // Once the user removes that file, a normal installation and a repeated one work as before.
  rmSync(join(other.workspace, PLANNER));
  assert.deepEqual(kinds(install({ packageDir: other.packageDir, workspace: other.workspace, dryRun: false })), { CREATE: 8 });
  assert.deepEqual(kinds(install({ packageDir: other.packageDir, workspace: other.workspace, dryRun: false })), { UNCHANGED: 8 });
  assert.equal(verify(other.workspace).code, 'CLEAN');
});

test('drift: a file changed after installation is detected, never overwritten, and kept on removal', () => {
  const { packageDir, workspace } = fixture('install-drift');
  put(workspace, 'notes.txt', 'user file\n');
  install({ packageDir, workspace, dryRun: false });
  const edited = `${readFileSync(join(workspace, REVIEWER), 'utf8')}\nMy own reviewer notes.\n`;
  writeFileSync(join(workspace, REVIEWER), edited);

  const drift = verify(workspace);
  assert.deepEqual([drift.ok, drift.code], [false, 'DRIFT']);
  assert.deepEqual(drift.files.filter((f) => f.status !== 'OK'), [{ path: REVIEWER, status: 'MODIFIED' }]);

  // Reinstalling stops and leaves the edit and everything else as it was.
  const before = snapshot(workspace);
  const again = install({ packageDir, workspace, dryRun: false });
  assert.deepEqual([again.ok, again.code], [false, 'BLOCKED']);
  assert.deepEqual(again.blocked_by.map((a) => [a.path, a.action]), [[REVIEWER, 'USER_MODIFIED']]);
  assert.deepEqual(snapshot(workspace), before);

  // Removal: the plan says what will be kept; applying it removes the rest and nothing else.
  const plan = uninstall({ workspace });
  assert.deepEqual([plan.code, plan.dry_run, kinds(plan)], ['PLAN_READY_WITH_PRESERVED_FILES', true, { REMOVE: 7, PRESERVED_USER_MODIFIED: 1 }]);
  assert.deepEqual(snapshot(workspace), before, 'the dry run removed nothing');
  const removed = uninstall({ workspace, dryRun: false });
  assert.equal(removed.code, 'UNINSTALLED_WITH_PRESERVED_FILES');
  assert.deepEqual(files(workspace), [REVIEWER, 'notes.txt']);
  assert.equal(readFileSync(join(workspace, REVIEWER), 'utf8'), edited, 'the user edit is intact');

  // From here the kept file is the user's: a new installation stops on it, and a second removal has nothing to do.
  assert.deepEqual(install({ packageDir, workspace, dryRun: false }).blocked_by.map((a) => [a.path, a.action]), [[REVIEWER, 'COLLISION']]);
  assert.equal(uninstall({ workspace, dryRun: false }).code, 'NOT_INSTALLED');
  assert.deepEqual(files(workspace), [REVIEWER, 'notes.txt']);

  // A missing installed file is drift too, and a reinstall restores it.
  const missing = fixture('install-missing');
  install({ packageDir: missing.packageDir, workspace: missing.workspace, dryRun: false });
  const whole = snapshot(missing.workspace);
  rmSync(join(missing.workspace, PLANNER));
  assert.deepEqual(verify(missing.workspace).files.filter((f) => f.status !== 'OK'), [{ path: PLANNER, status: 'MISSING' }]);
  assert.deepEqual(kinds(install({ packageDir: missing.packageDir, workspace: missing.workspace, dryRun: false })), { CREATE: 1, UNCHANGED: 7 });
  assert.deepEqual(snapshot(missing.workspace), whole);
});

test('repeated installation and removal are predictable and return the workspace to its starting bytes', () => {
  const { packageDir, workspace } = fixture('install-repeat');
  put(workspace, '.github/CODEOWNERS', '* @someone\n');
  put(workspace, 'src/app.js', 'export {};\n');
  const start = snapshot(workspace);

  install({ packageDir, workspace, dryRun: false });
  const installed = snapshot(workspace);
  const second = install({ packageDir, workspace, dryRun: false });
  assert.deepEqual([second.code, kinds(second)], ['INSTALLED', { UNCHANGED: 8 }]);
  assert.deepEqual(second.applied, [MANIFEST]);
  assert.deepEqual(snapshot(workspace), installed, 'a second installation changes no byte');

  assert.deepEqual([uninstall({ workspace, dryRun: false }).code, snapshot(workspace)], ['UNINSTALLED', start]);
  assert.equal(uninstall({ workspace, dryRun: false }).code, 'NOT_INSTALLED');
  assert.equal(verify(workspace).code, 'NOT_INSTALLED');
  install({ packageDir, workspace, dryRun: false });
  assert.deepEqual(snapshot(workspace), installed);
  uninstall({ workspace, dryRun: false });
  assert.deepEqual(snapshot(workspace), start, 'directories the installer created are gone; those it found are kept');

  // In a workspace with no .github at all, removal leaves no directory behind.
  const bare = fixture('install-bare');
  install({ packageDir: bare.packageDir, workspace: bare.workspace, dryRun: false });
  uninstall({ workspace: bare.workspace, dryRun: false });
  assert.deepEqual(snapshot(bare.workspace), []);
});

test('an update from a regenerated package changes only unmodified owned files and removes what the package dropped', () => {
  const { packageDir, workspace } = fixture('install-update', OPTIONAL_SKILL);
  const skill = '.github/skills/rstack-sdlc-change-notes/SKILL.md';
  put(workspace, 'notes.txt', 'user file\n');
  install({ packageDir, workspace, dryRun: false });
  assert.ok(files(workspace).includes(skill));

  // The same package location, regenerated without the optional Skill.
  generatePackage({ profileText, outDir: packageDir });
  assert.equal(verify(workspace).package, 'CHANGED', 'verify reports that the package behind the installation changed');
  const plan = install({ packageDir, workspace });
  assert.deepEqual(kinds(plan), { UNCHANGED: 7, UPDATE: 1, REMOVE: 1 });
  const updated = install({ packageDir, workspace, dryRun: false });
  assert.deepEqual(updated.applied, ['.github/agents/rstack-sdlc-developer.agent.md', skill, MANIFEST]);
  assert.deepEqual(files(workspace), [...OWNED.slice(0, 6), MANIFEST, ...OWNED.slice(6), 'notes.txt'].sort());
  assert.ok(!existsSync(join(workspace, '.github/skills/rstack-sdlc-change-notes')), 'the dropped Skill directory is gone');
  assert.equal(verify(workspace).code, 'CLEAN');

  // A dropped file the user changed is kept and stops the update.
  const second = fixture('install-update-edited', OPTIONAL_SKILL);
  install({ packageDir: second.packageDir, workspace: second.workspace, dryRun: false });
  writeFileSync(join(second.workspace, skill), 'my edits\n');
  generatePackage({ profileText, outDir: second.packageDir });
  const stopped = install({ packageDir: second.packageDir, workspace: second.workspace, dryRun: false });
  assert.deepEqual(stopped.blocked_by.map((a) => [a.path, a.action]), [[skill, 'USER_MODIFIED']]);
  assert.equal(readFileSync(join(second.workspace, skill), 'utf8'), 'my edits\n');
});

test('SECURITY-2: unsafe destinations and manifest paths cannot leave the workspace', () => {
  const { base, packageDir, workspace } = fixture('install-unsafe');
  const outside = join(base, 'outside');
  mkdirSync(outside);
  writeFileSync(join(outside, 'keep.txt'), 'outside the workspace\n');

  // A package whose manifest was altered is refused before anything is written.
  const tamper = (name: string, change: (m: Record<string, any>) => void, file?: [string, string]): string => {
    const copy = join(base, name);
    cpSync(packageDir, copy, { recursive: true });
    const path = join(copy, 'rstack-sdlc-manifest.json');
    const m = JSON.parse(readFileSync(path, 'utf8')) as Record<string, any>;
    change(m);
    writeFileSync(path, JSON.stringify(m));
    if (file) put(copy, file[0], file[1]);
    return copy;
  };
  const evil = 'x\n';
  const cases: [string, string][] = [
    [tamper('p-escape', (m) => m.files.push({ path: '../outside/keep.txt', sha256: sha256Hex(evil), kind: 'agent', source: 'x', source_sha256: 'x' })), 'UNSAFE_PACKAGE_PATH'],
    [tamper('p-absolute', (m) => m.files.push({ path: outside.replaceAll('\\', '/') + '/keep.txt', sha256: sha256Hex(evil), kind: 'agent', source: 'x', source_sha256: 'x' })), 'UNSAFE_PACKAGE_PATH'],
    [tamper('p-unowned', (m) => m.files.push({ path: '.github/workflows/evil.yml', sha256: sha256Hex(evil), kind: 'agent', source: 'x', source_sha256: 'x' }), ['.github/workflows/evil.yml', evil]), 'UNOWNED_PACKAGE_PATH'],
    [tamper('p-settings', (m) => m.files.push({ path: '.github/copilot-instructions.md', sha256: sha256Hex(evil), kind: 'agent', source: 'x', source_sha256: 'x' }), ['.github/copilot-instructions.md', evil]), 'UNOWNED_PACKAGE_PATH'],
    [tamper('p-version', (m) => (m.schema_version = 3)), 'UNSUPPORTED_PACKAGE_VERSION'],
    [tamper('p-old', (m) => (m.schema_version = 1)), 'UNSUPPORTED_PACKAGE_VERSION'],
    [tamper('p-edited', () => {}, [PLANNER, 'edited inside the package\n']), 'PACKAGE_MODIFIED'],
  ];
  for (const [dir, code] of cases) {
    assert.equal(codeOf(() => install({ packageDir: dir, workspace, dryRun: false })), code, dir);
    assert.deepEqual(snapshot(workspace), [], `${code}: the workspace is untouched`);
  }
  assert.equal(codeOf(() => install({ packageDir: join(base, 'no-such-package'), workspace, dryRun: false })), 'PACKAGE_NOT_FOUND');
  assert.equal(codeOf(() => install({ packageDir, workspace: join(base, 'no-such-workspace'), dryRun: false })), 'WORKSPACE_NOT_FOUND');

  // A workspace that contains the package is refused: this is what keeps the
  // repository this package lives in, and its .github/, out of reach.
  const repoRoot = resolve(PACKAGE_ROOT, '..');
  for (const containing of [base, PACKAGE_ROOT, repoRoot]) {
    assert.equal(codeOf(() => install({ packageDir, workspace: containing, dryRun: true })), 'WORKSPACE_CONTAINS_PACKAGE', containing);
  }
  assert.ok(!existsSync(join(base, '.github')));

  // A .github that is a link to somewhere else is not written through.
  const linked = join(base, 'linked-workspace');
  mkdirSync(linked);
  symlinkSync(outside, join(linked, '.github'), 'junction');
  assert.equal(codeOf(() => install({ packageDir, workspace: linked, dryRun: false })), 'PATH_ESCAPES_WORKSPACE');
  assert.deepEqual(readdirSync(outside), ['keep.txt'], 'nothing was written through the link');

  // An install manifest is data found in the workspace: one that names anything
  // but owned paths stops removal before a single file is touched.
  install({ packageDir, workspace, dryRun: false });
  const installed = snapshot(workspace);
  const manifestPath = join(workspace, MANIFEST);
  const original = readFileSync(manifestPath, 'utf8');
  const alter = (change: (m: Record<string, any>) => void): void => {
    const m = JSON.parse(original) as Record<string, any>;
    change(m);
    writeFileSync(manifestPath, JSON.stringify(m));
  };
  const keep = sha256Hex(readFileSync(join(outside, 'keep.txt')));
  put(workspace, 'src/keep.js', 'user code\n');
  const manifestCases: [(m: Record<string, any>) => void, string][] = [
    [(m) => m.files.push({ path: '../outside/keep.txt', sha256: keep, package_sha256: keep }), 'UNSAFE_MANIFEST_PATH'],
    [(m) => m.files.push({ path: 'src/keep.js', sha256: sha256Hex('user code\n'), package_sha256: keep }), 'UNSAFE_MANIFEST_PATH'],
    [(m) => m.files.push({ path: '.github/agents/rstack-sdlc-x/../../../src/keep.js', sha256: sha256Hex('user code\n'), package_sha256: keep }), 'UNSAFE_MANIFEST_PATH'],
    [(m) => m.created_dirs.push('..'), 'UNSAFE_MANIFEST_PATH'],
    [(m) => m.created_dirs.push('src'), 'UNSAFE_MANIFEST_PATH'],
    [(m) => (m.schema_version = 2), 'UNSUPPORTED_INSTALL_MANIFEST_VERSION'],
  ];
  for (const [change, code] of manifestCases) {
    alter(change);
    for (const op of [() => uninstall({ workspace, dryRun: false }), () => install({ packageDir, workspace, dryRun: false }), () => verify(workspace)]) {
      assert.equal(codeOf(op), code);
    }
    assert.ok(existsSync(join(outside, 'keep.txt')) && existsSync(join(workspace, 'src/keep.js')) && existsSync(join(workspace, PLANNER)), `${code}: nothing was removed`);
  }
  writeFileSync(manifestPath, original);
  assert.deepEqual(snapshot(workspace).filter((l) => !l.startsWith('src')), installed);
  assert.equal(uninstall({ workspace, dryRun: false }).code, 'UNINSTALLED');
  assert.deepEqual(files(workspace), ['src/keep.js']);
});

test('a failed installation is undone: no partial install and no lost user content', () => {
  const { base, packageDir, workspace } = fixture('install-fail');
  put(workspace, '.github/CODEOWNERS', '* @someone\n');
  put(workspace, 'notes.txt', 'user file\n');
  const start = snapshot(workspace);
  const failAt = (n: number): ((path: string) => void) => {
    let count = 0;
    return (path) => {
      count += 1;
      if (count === n) throw new Error(`injected failure before ${path}`);
    };
  };

  // Fails at each point of a fresh installation, including the manifest write.
  for (const n of [1, 4, 8, 9]) {
    assert.equal(codeOf(() => install({ packageDir, workspace, dryRun: false, beforeChange: failAt(n) })), 'INSTALL_FAILED_ROLLED_BACK', `change ${n}`);
    assert.deepEqual(snapshot(workspace), start, `after a failure at change ${n} the workspace is as it was`);
  }

  // Fails in the middle of an update: the earlier installation is restored, still clean.
  install({ packageDir, workspace, dryRun: false });
  const installed = snapshot(workspace);
  const moved = join(base, 'package moved');
  cpSync(packageDir, moved, { recursive: true });
  assert.deepEqual(kinds(install({ packageDir: moved, workspace })), { UPDATE: 1, UNCHANGED: 7 }, 'only the coordinator names the package location');
  const withSkill = join(base, 'package-with-skill');
  generatePackage({ profileText, outDir: withSkill, extensionsText: OPTIONAL_SKILL });
  assert.deepEqual(kinds(install({ packageDir: withSkill, workspace })), { UPDATE: 2, UNCHANGED: 6, CREATE: 1 });
  for (const n of [2, 3, 4]) {
    assert.equal(codeOf(() => install({ packageDir: withSkill, workspace, dryRun: false, beforeChange: failAt(n) })), 'INSTALL_FAILED_ROLLED_BACK');
    assert.deepEqual(snapshot(workspace), installed, `update failure at change ${n}`);
  }
  assert.equal(verify(workspace).code, 'CLEAN');
  uninstall({ workspace, dryRun: false });
  assert.deepEqual(snapshot(workspace), start);
});

test('a failed update that removes a Skill restores it, and an undo step that fails is reported, not hidden', () => {
  const skill = '.github/skills/rstack-sdlc-change-notes/SKILL.md';
  const developer = '.github/agents/rstack-sdlc-developer.agent.md';
  const failAtManifest = (path: string): void => {
    if (path === MANIFEST) throw new Error('injected failure before the manifest write');
  };
  // Installed from a package with an optional Skill; the update comes from a package without it.
  const setup = (label: string): { workspace: string; without: string; installed: string[] } => {
    const { base, packageDir, workspace } = fixture(label, OPTIONAL_SKILL);
    put(workspace, 'notes.txt', 'user file\n');
    install({ packageDir, workspace, dryRun: false });
    const without = join(base, 'package-without-skill');
    generatePackage({ profileText, outDir: without });
    assert.deepEqual(kinds(install({ packageDir: without, workspace })), { UPDATE: 2, UNCHANGED: 6, REMOVE: 1 });
    return { workspace, without, installed: snapshot(workspace) };
  };

  // The removal empties and removes the Skill directory; the failure comes after it.
  const a = setup('install-fail-removal');
  const failed = errorOf(() => install({ packageDir: a.without, workspace: a.workspace, dryRun: false, beforeChange: failAtManifest }));
  assert.equal(failed.code, 'INSTALL_FAILED_ROLLED_BACK');
  assert.deepEqual(snapshot(a.workspace), a.installed, 'the removed Skill, its directory, the updated files, and the manifest are as they were');
  assert.deepEqual([verify(a.workspace).code, verify(a.workspace).package], ['CLEAN', 'PRESENT']);

  // The same failure, and then the undo step that restores the Skill fails too.
  const b = setup('install-fail-undo');
  const incomplete = withWriteFault(
    (path, data, real) => {
      if (path.endsWith(skill)) throw new Error('injected undo failure');
      real(path, data);
    },
    () => errorOf(() => install({ packageDir: b.without, workspace: b.workspace, dryRun: false, beforeChange: failAtManifest })),
  );
  assert.equal(incomplete.code, 'INSTALL_FAILED_ROLLBACK_INCOMPLETE');
  assert.doesNotMatch(incomplete.message, /were undone/);
  assert.match(incomplete.message, /rstack-sdlc-change-notes\/SKILL\.md/);
  const notUndone = incomplete.detail.not_undone as { path: string; step: string; error: string; recovery: string }[];
  assert.deepEqual(notUndone.map((u) => [u.path, u.step]), [[skill, 'RESTORE_FILE']]);
  assert.match(notUndone[0]!.error, /injected undo failure/);
  assert.ok(notUndone[0]!.recovery.length > 0);
  assert.match(String(incomplete.detail.cause), /injected failure before the manifest write/);
  // Everything else was put back, and verify states what is still wrong.
  assert.deepEqual(snapshot(b.workspace), b.installed.filter((l) => !l.startsWith(`${skill}:`)));
  assert.deepEqual(verify(b.workspace).files.filter((f) => f.status !== 'OK'), [{ path: skill, status: 'MISSING' }]);
  assert.ok(readFileSync(join(b.workspace, developer), 'utf8').includes('change-notes'), 'the updated agent file was restored');
});

test('a write that fails part-way leaves no partial file behind', () => {
  const { packageDir, workspace } = fixture('install-partial');
  put(workspace, 'notes.txt', 'user file\n');
  const start = snapshot(workspace);
  // Fails the first write to the path after writing part of it; later writes (the undo) pass.
  const partialAt = (suffix: string): ((path: string, data: string | Uint8Array, real: WriteFile) => void) => {
    let fired = false;
    return (path, data, real) => {
      if (fired || !path.endsWith(suffix)) return real(path, data);
      fired = true;
      real(path, 'partial');
      throw new Error(`injected failure part-way through ${suffix}`);
    };
  };
  // A new owned file, and the temporary file the manifest is written through.
  for (const suffix of [PLANNER, `${MANIFEST}.tmp`]) {
    const failed = withWriteFault(partialAt(suffix), () => errorOf(() => install({ packageDir, workspace, dryRun: false })));
    assert.equal(failed.code, 'INSTALL_FAILED_ROLLED_BACK', suffix);
    assert.deepEqual(snapshot(workspace), start, `a partial write of ${suffix} was undone`);
  }

  // The same during an update: the earlier content comes back.
  install({ packageDir, workspace, dryRun: false });
  const installed = snapshot(workspace);
  const { packageDir: withSkill } = fixture('install-partial-update', OPTIONAL_SKILL);
  const developer = '.github/agents/rstack-sdlc-developer.agent.md';
  const failed = withWriteFault(partialAt(developer), () => errorOf(() => install({ packageDir: withSkill, workspace, dryRun: false })));
  assert.equal(failed.code, 'INSTALL_FAILED_ROLLED_BACK');
  assert.deepEqual(snapshot(workspace), installed);
  assert.equal(verify(workspace).code, 'CLEAN');
});

test('an existing file where the manifest is written through is a collision: it is never overwritten or removed', () => {
  const TMP = `${MANIFEST}.tmp`;
  const earlier = 'bytes the installer did not write\n';
  const partial = (path: string, data: string | Uint8Array, real: WriteFile): void => {
    if (!path.endsWith(TMP)) return real(path, data);
    real(path, 'PARTIAL');
    throw new Error('injected failure part-way through the temporary file');
  };
  const refused = (packageDir: string, workspace: string, label: string): void => {
    const before = snapshot(workspace);
    const attempts = [
      (): OperationReport => install({ packageDir, workspace }),
      (): OperationReport => install({ packageDir, workspace, dryRun: false }),
      (): OperationReport => withWriteFault(partial, () => install({ packageDir, workspace, dryRun: false })),
    ];
    for (const attempt of attempts) {
      const r = attempt();
      assert.deepEqual([r.ok, r.code, r.applied], [false, 'BLOCKED', []], label);
      assert.deepEqual(r.blocked_by.map((a) => [a.path, a.action]), [[TMP, 'COLLISION']], label);
      assert.deepEqual(snapshot(workspace), before, `${label}: nothing was written or removed`);
      assert.equal(readFileSync(join(workspace, TMP), 'utf8'), earlier, `${label}: the earlier bytes are intact`);
    }
  };

  // Before any installation.
  const { packageDir, workspace } = fixture('install-tmp-existing');
  put(workspace, 'notes.txt', 'user file\n');
  put(workspace, TMP, earlier);
  refused(packageDir, workspace, 'fresh installation');
  assert.equal(verify(workspace).code, 'NOT_INSTALLED');
  assert.equal(uninstall({ workspace, dryRun: false }).code, 'NOT_INSTALLED');
  assert.equal(readFileSync(join(workspace, TMP), 'utf8'), earlier);

  // Once the user moves it away, installation works; one that appears later stops an update and survives removal.
  rmSync(join(workspace, TMP));
  assert.deepEqual(kinds(install({ packageDir, workspace, dryRun: false })), { CREATE: 8 });
  put(workspace, TMP, earlier);
  const { packageDir: withSkill } = fixture('install-tmp-existing-update', OPTIONAL_SKILL);
  refused(withSkill, workspace, 'update');
  assert.equal(verify(workspace).code, 'CLEAN');
  assert.equal(uninstall({ workspace, dryRun: false }).code, 'UNINSTALLED');
  assert.deepEqual(files(workspace), [TMP, 'notes.txt']);
  assert.equal(readFileSync(join(workspace, TMP), 'utf8'), earlier);
});

test('a malformed install manifest is refused by name before it is used, and nothing is changed', () => {
  const { packageDir, workspace } = fixture('install-malformed');
  put(workspace, 'notes.txt', 'user file\n');
  install({ packageDir, workspace, dryRun: false });
  const manifestPath = join(workspace, MANIFEST);
  const original = readFileSync(manifestPath, 'utf8');
  const cases: [string, (m: Record<string, any>) => unknown][] = [
    ['no package object', (m) => delete m.package],
    ['package is null', (m) => (m.package = null)],
    ['package is a string', (m) => (m.package = 'C:/somewhere')],
    ['package is an array', (m) => (m.package = [])],
    ['package.root is missing', (m) => delete m.package.root],
    ['package.root is a number', (m) => (m.package.root = 5)],
    ['package.manifest_sha256 is missing', (m) => delete m.package.manifest_sha256],
    ['package.manifest_sha256 is an object', (m) => (m.package.manifest_sha256 = {})],
    ['package.generator_version is a string', (m) => (m.package.generator_version = '1')],
    ['package.profile_id is missing', (m) => delete m.package.profile_id],
    ['package.profile_version is missing', (m) => delete m.package.profile_version],
    ['prefix is missing', (m) => delete m.prefix],
    ['workspace is a number', (m) => (m.workspace = 1)],
    ['engine_command is missing', (m) => delete m.engine_command],
    ['a file entry is null', (m) => m.files.push(null)],
    ['a file entry is a string', (m) => m.files.push(PLANNER)],
    ['a file entry has no package_sha256', (m) => delete m.files[0].package_sha256],
    ['files is an object', (m) => (m.files = {})],
    ['created_dirs is missing', (m) => delete m.created_dirs],
  ];
  const wholeCases: [string, string][] = [['the manifest is null', 'null'], ['the manifest is an array', '[]'], ['the manifest is not JSON', '{']];
  const check = (label: string): void => {
    const before = snapshot(workspace);
    for (const op of [() => uninstall({ workspace, dryRun: false }), () => uninstall({ workspace }), () => install({ packageDir, workspace, dryRun: false }), () => install({ packageDir, workspace }), () => verify(workspace)]) {
      let thrown: unknown = null;
      try {
        op();
      } catch (e) {
        thrown = e;
      }
      assert.ok(thrown instanceof PackageError, `${label}: expected a named refusal, got ${String(thrown)}`);
      assert.equal(thrown.code, 'INSTALL_MANIFEST_MALFORMED', label);
    }
    assert.deepEqual(snapshot(workspace), before, `${label}: nothing was written or removed`);
  };
  for (const [label, change] of cases) {
    const m = JSON.parse(original) as Record<string, any>;
    change(m);
    writeFileSync(manifestPath, JSON.stringify(m));
    check(label);
  }
  for (const [label, text] of wholeCases) {
    writeFileSync(manifestPath, text);
    check(label);
  }

  // Control: the manifest as the installer wrote it is accepted by all three operations.
  writeFileSync(manifestPath, original);
  assert.equal(verify(workspace).code, 'CLEAN');
  assert.deepEqual(kinds(install({ packageDir, workspace, dryRun: false })), { UNCHANGED: 8 });
  assert.equal(uninstall({ workspace, dryRun: false }).code, 'UNINSTALLED');
  assert.deepEqual(files(workspace), ['notes.txt']);
});
