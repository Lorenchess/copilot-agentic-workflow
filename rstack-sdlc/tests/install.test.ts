// Installation, drift detection, and removal of the generated package.
// Evidence class: generated-package checks (PACKAGE_TESTED). Every
// destination is a disposable directory under tests/.tmp/. Nothing here
// installs into a real workspace, and nothing shows that a host discovers or
// loads an installed file.

import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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

  // An existing file with exactly the bytes that would be written is not a conflict and is not rewritten.
  const other = fixture('install-adopt');
  install({ packageDir: other.packageDir, workspace: other.workspace, dryRun: false });
  const installed = readFileSync(join(other.workspace, PLANNER));
  uninstall({ workspace: other.workspace, dryRun: false });
  put(other.workspace, PLANNER, installed.toString());
  const adopted = install({ packageDir: other.packageDir, workspace: other.workspace, dryRun: false });
  assert.deepEqual(adopted.actions.find((a) => a.path === PLANNER)?.action, 'ADOPT_IDENTICAL');
  assert.ok(!adopted.applied.includes(PLANNER));
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
