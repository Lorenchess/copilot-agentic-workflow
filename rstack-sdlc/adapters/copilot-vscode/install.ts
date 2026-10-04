// Installs, verifies, and removes the generated VS Code Copilot package in a
// workspace. It writes only the paths it owns: the prefixed agent and Skill
// files under `.github/` and one install manifest beside them. Everything is
// planned before anything is written, and a plan that would touch a file it
// does not own, or one a user changed, stops instead.
//
// Three locations stay distinct:
//   package root   the generated package: engine runtime, profile, templates
//   workspace      where the customization files are installed and where the
//                  engine writes `.rstack/runs/<run-id>/`
//   application    named per run with `--app`; never written by the installer
//
// The package's files are templates: the engine command, workspace, profile,
// and run root are written into the installed copies as absolute paths, so the
// installed commands depend on no working directory. The engine itself is
// not copied; it runs from the package root, which must stay where it was
// when installed (verify reports a package that moved or changed).
//
// Nothing here shows that a host discovers or loads the installed files.

import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, rmdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { sha256Hex } from '../../core/contracts/records.ts';

export const PREFIX = 'rstack-sdlc-';
export const PACKAGE_MANIFEST = `${PREFIX}manifest.json`;
export const INSTALL_MANIFEST = `.github/${PREFIX}install.json`;
export const PACKAGE_MANIFEST_VERSION = 2;
export const INSTALL_MANIFEST_VERSION = 1;
export const INSTALL_TOKENS = ['ENGINE', 'WORKSPACE', 'PROFILE', 'RUN_ROOT'] as const;

// The only workspace paths this installer may create, change, or remove.
const OWNED_FILE = /^\.github\/(agents\/rstack-sdlc-[a-z0-9-]+\.agent\.md|skills\/rstack-sdlc-[a-z0-9-]+\/SKILL\.md)$/;
const OWNED_DIR = /^\.github(\/(agents|skills(\/rstack-sdlc-[a-z0-9-]+)?))?$/;
const PACKAGE_PATH = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;
// Characters that could end or reinterpret a double-quoted argument in a shell.
const UNQUOTABLE = /["`$%\r\n]/;

export class PackageError extends Error {
  readonly code: string;
  readonly detail: Record<string, unknown>;
  constructor(code: string, message: string, detail: Record<string, unknown> = {}) {
    super(`${code}: ${message}`);
    this.code = code;
    this.detail = detail;
  }
}

export interface GeneratedFile {
  path: string;
  sha256: string;
  kind: 'agent' | 'skill' | 'runtime' | 'profile';
  source: string;
  source_sha256: string;
}

// The part of the package manifest the installer relies on.
export interface InstallablePackage {
  schema_version: number;
  record_type: 'package-manifest';
  generator_version: number;
  profile: { profile_id: string; profile_version: number; sha256: string; path: string };
  engine: { entry: string };
  files: GeneratedFile[];
}

export interface InstalledFile {
  path: string;
  // Hash of the bytes written into the workspace (the rendered template).
  sha256: string;
  // Hash of the package template it was rendered from.
  package_sha256: string;
}

export interface InstallManifest {
  schema_version: 1;
  record_type: 'install-manifest';
  prefix: string;
  package: { root: string; manifest_sha256: string; generator_version: number; profile_id: string; profile_version: number };
  workspace: string;
  engine_command: string;
  files: InstalledFile[];
  // Directories this installer created, removed again only when empty.
  created_dirs: string[];
}

export type ActionKind =
  | 'CREATE'
  | 'UPDATE'
  | 'UNCHANGED'
  | 'REMOVE'
  | 'ALREADY_ABSENT'
  | 'COLLISION'
  | 'USER_MODIFIED'
  | 'PRESERVED_USER_MODIFIED';

export interface PlanAction {
  path: string;
  action: ActionKind;
  detail: string;
}

export interface OperationReport {
  ok: boolean;
  code: string;
  operation: 'install' | 'uninstall';
  dry_run: boolean;
  workspace: string;
  package_root: string | null;
  engine_command: string | null;
  actions: PlanAction[];
  blocked_by: PlanAction[];
  // What was actually written or removed. Empty for a dry run or a blocked plan.
  applied: string[];
  host_validation: 'NOT_OBSERVED';
}

const forward = (path: string): string => path.replaceAll('\\', '/');

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function under(root: string, path: string): boolean {
  return path === root || path.startsWith(root + sep);
}

// The deepest existing ancestor of the target must resolve inside the
// workspace, and the target itself must not be a link: a link or junction
// under `.github/` must never carry a write or a removal elsewhere.
function assertContained(workspace: string, rel: string): string {
  const full = join(workspace, ...rel.split('/'));
  const root = realpathSync(workspace);
  let existing = full;
  while (!existsSync(existing)) existing = dirname(existing);
  if (!under(root, realpathSync(existing))) {
    throw new PackageError('PATH_ESCAPES_WORKSPACE', `"${rel}" resolves outside the workspace`, { path: rel });
  }
  if (existsSync(full) && lstatSync(full).isSymbolicLink()) {
    throw new PackageError('PATH_ESCAPES_WORKSPACE', `"${rel}" is a link`, { path: rel });
  }
  return full;
}

function checkWorkspace(workspaceArg: string, packageDir: string | null): string {
  const workspace = resolve(workspaceArg);
  if (!existsSync(workspace) || !statSync(workspace).isDirectory()) {
    throw new PackageError('WORKSPACE_NOT_FOUND', 'the workspace directory does not exist', { workspace });
  }
  if (UNQUOTABLE.test(workspace)) {
    throw new PackageError('UNSAFE_PATH_CHARACTERS', 'the workspace path contains a character that cannot be quoted safely in a command', { workspace });
  }
  // Refused so that a package can never be installed into a directory that
  // contains it, such as the repository this package is developed in.
  if (packageDir && under(realpathSync(workspace), realpathSync(packageDir))) {
    throw new PackageError('WORKSPACE_CONTAINS_PACKAGE', 'the workspace contains the package; install into a workspace outside the package tree', { workspace });
  }
  return workspace;
}

export function loadPackage(packageArg: string): { packageDir: string; manifest: InstallablePackage; manifestSha: string } {
  const packageDir = resolve(packageArg);
  const manifestPath = join(packageDir, PACKAGE_MANIFEST);
  if (!existsSync(manifestPath)) throw new PackageError('PACKAGE_NOT_FOUND', `no ${PACKAGE_MANIFEST} in the package directory`, { package_root: packageDir });
  if (UNQUOTABLE.test(packageDir)) {
    throw new PackageError('UNSAFE_PATH_CHARACTERS', 'the package path contains a character that cannot be quoted safely in a command', { package_root: packageDir });
  }
  if (packageDir.split(sep).includes('node_modules')) {
    throw new PackageError('UNSUPPORTED_PACKAGE_LOCATION', 'the runtime cannot run from inside a node_modules directory', { package_root: packageDir });
  }
  const text = readFileSync(manifestPath, 'utf8');
  let manifest: InstallablePackage;
  try {
    manifest = JSON.parse(text) as InstallablePackage;
  } catch {
    throw new PackageError('PACKAGE_MANIFEST_MALFORMED', 'the package manifest is not valid JSON');
  }
  if (manifest?.record_type !== 'package-manifest' || !Array.isArray(manifest.files)) {
    throw new PackageError('PACKAGE_MANIFEST_MALFORMED', 'the package manifest has an unexpected shape');
  }
  if (manifest.schema_version !== PACKAGE_MANIFEST_VERSION) {
    throw new PackageError('UNSUPPORTED_PACKAGE_VERSION', `package manifest version ${String(manifest.schema_version)} is not supported (supported: ${PACKAGE_MANIFEST_VERSION})`);
  }
  for (const file of manifest.files) {
    if (typeof file.path !== 'string' || !PACKAGE_PATH.test(file.path) || file.path.split('/').some((s) => s === '..' || s === '.')) {
      throw new PackageError('UNSAFE_PACKAGE_PATH', 'the package manifest names a path outside the package', { path: file.path });
    }
    if (file.path.startsWith('.github/') && !OWNED_FILE.test(file.path)) {
      throw new PackageError('UNOWNED_PACKAGE_PATH', 'the package would install a path this installer does not own', { path: file.path });
    }
    const full = join(packageDir, ...file.path.split('/'));
    if (!existsSync(full) || sha256Hex(readFileSync(full)) !== file.sha256) {
      throw new PackageError('PACKAGE_MODIFIED', 'a package file is missing or differs from its manifest', { path: file.path });
    }
  }
  const listed = new Set(manifest.files.map((f) => f.path));
  if (!listed.has(manifest.engine?.entry) || !listed.has(manifest.profile?.path)) {
    throw new PackageError('PACKAGE_MANIFEST_MALFORMED', 'the engine entry or the profile is not among the package files');
  }
  return { packageDir, manifest, manifestSha: sha256Hex(text) };
}

export function readInstallManifest(workspace: string): InstallManifest | null {
  const full = assertContained(workspace, INSTALL_MANIFEST);
  if (!existsSync(full)) return null;
  let manifest: InstallManifest;
  try {
    manifest = JSON.parse(readFileSync(full, 'utf8')) as InstallManifest;
  } catch {
    throw new PackageError('INSTALL_MANIFEST_MALFORMED', 'the install manifest is not valid JSON; nothing was changed');
  }
  const malformed = (what: string): PackageError =>
    new PackageError('INSTALL_MANIFEST_MALFORMED', `the install manifest has an unexpected shape (${what}); nothing was changed`, { field: what });
  if (!isRecord(manifest) || manifest.record_type !== 'install-manifest' || !Array.isArray(manifest.files) || !Array.isArray(manifest.created_dirs)) {
    throw new PackageError('INSTALL_MANIFEST_MALFORMED', 'the install manifest has an unexpected shape; nothing was changed');
  }
  if (manifest.schema_version !== INSTALL_MANIFEST_VERSION) {
    throw new PackageError('UNSUPPORTED_INSTALL_MANIFEST_VERSION', `install manifest version ${String(manifest.schema_version)} is not supported (supported: ${INSTALL_MANIFEST_VERSION}); nothing was changed`);
  }
  // The whole shape is checked here, once, so that no caller dereferences a
  // field that is missing or of the wrong type.
  const pkg: unknown = manifest.package;
  if (!isRecord(pkg)) throw malformed('package');
  if (typeof pkg.root !== 'string') throw malformed('package.root');
  if (typeof pkg.manifest_sha256 !== 'string') throw malformed('package.manifest_sha256');
  if (typeof pkg.generator_version !== 'number') throw malformed('package.generator_version');
  if (typeof pkg.profile_id !== 'string') throw malformed('package.profile_id');
  if (typeof pkg.profile_version !== 'number') throw malformed('package.profile_version');
  for (const field of ['prefix', 'workspace', 'engine_command'] as const) {
    if (typeof manifest[field] !== 'string') throw malformed(field);
  }
  // A manifest is data found in the workspace. It can name only owned paths.
  for (const file of manifest.files) {
    if (!isRecord(file)) throw malformed('files');
    if (typeof file.path !== 'string' || !OWNED_FILE.test(file.path) || typeof file.sha256 !== 'string') {
      throw new PackageError('UNSAFE_MANIFEST_PATH', 'the install manifest names a path this installer does not own; nothing was changed', { path: file.path });
    }
    if (typeof file.package_sha256 !== 'string') throw malformed('files.package_sha256');
  }
  for (const dir of manifest.created_dirs) {
    if (typeof dir !== 'string' || !OWNED_DIR.test(dir)) {
      throw new PackageError('UNSAFE_MANIFEST_PATH', 'the install manifest names a directory this installer does not own; nothing was changed', { path: dir });
    }
  }
  return manifest;
}

function render(template: string, tokens: Record<string, string>, path: string): string {
  const text = template.replace(/\{\{([A-Z_]+)\}\}/g, (whole, name: string) => tokens[name] ?? whole);
  const left = /\{\{([A-Z_]+)\}\}/.exec(text);
  if (left) throw new PackageError('UNKNOWN_INSTALL_TOKEN', `"${path}" contains a placeholder this installer does not fill`, { token: left[1] });
  return text;
}

const hashOf = (full: string): string => sha256Hex(readFileSync(full));

export interface InstallOptions {
  packageDir: string;
  workspace: string;
  // Defaults to true: nothing is written unless a caller asks for it.
  dryRun?: boolean;
  // Called before each write or removal. Tests use it to interrupt an operation.
  beforeChange?: (path: string) => void;
}

// One reversal of one change made while applying. `path` and `recovery` are
// what is reported if the reversal itself fails.
interface UndoStep {
  path: string;
  step: 'RESTORE_FILE' | 'REMOVE_FILE' | 'REMOVE_DIRECTORY' | 'RESTORE_DIRECTORY';
  recovery: string;
  run: () => void;
}

function report(base:Omit<OperationReport, 'ok' | 'code' | 'blocked_by' | 'applied' | 'host_validation'>, code: string, applied: string[]): OperationReport {
  const blocked = base.actions.filter((a) => a.action === 'COLLISION' || a.action === 'USER_MODIFIED');
  return { ok: blocked.length === 0, code, ...base, blocked_by: blocked, applied, host_validation: 'NOT_OBSERVED' };
}

export function install(options: InstallOptions): OperationReport {
  const dryRun = options.dryRun ?? true;
  const { packageDir, manifest, manifestSha } = loadPackage(options.packageDir);
  const workspace = checkWorkspace(options.workspace, packageDir);
  const previous = readInstallManifest(workspace);
  const owned = new Map((previous?.files ?? []).map((f) => [f.path, f]));

  const tokens: Record<string, string> = {
    ENGINE: `node "${forward(join(packageDir, ...manifest.engine.entry.split('/')))}"`,
    WORKSPACE: `"${forward(workspace)}"`,
    PROFILE: `"${forward(join(packageDir, ...manifest.profile.path.split('/')))}"`,
    RUN_ROOT: forward(join(workspace, '.rstack', 'runs')),
  };

  const wanted = manifest.files
    .filter((f) => f.path.startsWith('.github/'))
    .map((f) => ({ file: f, content: render(readFileSync(join(packageDir, ...f.path.split('/')), 'utf8'), tokens, f.path) }));

  const actions: PlanAction[] = [];
  const writes: { path: string; full: string; content: string }[] = [];
  const removals: { path: string; full: string }[] = [];
  for (const { file, content } of wanted) {
    const full = assertContained(workspace, file.path);
    const next = sha256Hex(content);
    const prior = owned.get(file.path);
    if (!existsSync(full)) {
      actions.push({ path: file.path, action: 'CREATE', detail: prior ? 'owned by the earlier installation and missing' : 'new file' });
      writes.push({ path: file.path, full, content });
    } else if (!prior) {
      // No install manifest lists it, so it is not ours, whatever its bytes.
      // An identical file is not adopted: owning it would let a later removal
      // delete a file this installer never created.
      const identical = hashOf(full) === next;
      actions.push({ path: file.path, action: 'COLLISION', detail: identical ? 'an identical file this installer did not install exists at an owned path; it is not adopted' : 'a file this installer did not install exists at an owned path' });
    } else if (hashOf(full) !== prior.sha256) {
      actions.push({ path: file.path, action: 'USER_MODIFIED', detail: 'the installed file was changed after installation' });
    } else if (prior.sha256 === next) {
      actions.push({ path: file.path, action: 'UNCHANGED', detail: 'already installed' });
    } else {
      actions.push({ path: file.path, action: 'UPDATE', detail: 'installed by an earlier installation and unmodified' });
      writes.push({ path: file.path, full, content });
    }
  }
  // Files an earlier installation owned that this package no longer contains.
  const kept = new Set(wanted.map((w) => w.file.path));
  for (const prior of previous?.files ?? []) {
    if (kept.has(prior.path)) continue;
    const full = assertContained(workspace, prior.path);
    if (!existsSync(full)) actions.push({ path: prior.path, action: 'ALREADY_ABSENT', detail: 'no longer in the package' });
    else if (hashOf(full) !== prior.sha256) actions.push({ path: prior.path, action: 'USER_MODIFIED', detail: 'no longer in the package, and changed after installation' });
    else {
      actions.push({ path: prior.path, action: 'REMOVE', detail: 'no longer in the package and unmodified' });
      removals.push({ path: prior.path, full });
    }
  }

  // The manifest is written through a temporary file beside it. One that is
  // already there was not created by this operation, so it is not overwritten
  // or removed: it stops the plan like any other file at an owned path.
  const manifestTmp = `${INSTALL_MANIFEST}.tmp`;
  if (existsSync(assertContained(workspace, manifestTmp))) {
    actions.push({ path: manifestTmp, action: 'COLLISION', detail: 'a file this installer did not create exists where the install manifest is written; move or remove it, then install again' });
  }

  const base = { operation: 'install' as const, dry_run: dryRun, workspace, package_root: packageDir, engine_command: tokens.ENGINE as string, actions };
  if (actions.some((a) => a.action === 'COLLISION' || a.action === 'USER_MODIFIED')) return report(base, 'BLOCKED', []);
  if (dryRun) return report(base, 'PLAN_READY', []);

  // Apply. Every change is undone if any step fails, so a failed installation
  // leaves the workspace as it was. Undo steps run newest first. The undo of a
  // file change is registered before the change, so a write that fails
  // part-way is reversed too; it is harmless when the change never happened.
  const undo: UndoStep[] = [];
  const createdDirs: string[] = [];
  const applied: string[] = [];
  const fileUndo = (rel: string, full: string, before: Buffer | null, restoreNote: string): UndoStep =>
    before === null
      ? { path: rel, step: 'REMOVE_FILE', recovery: 'created by the failed installation and not removed; delete it', run: () => rmSync(full, { force: true }) }
      : { path: rel, step: 'RESTORE_FILE', recovery: restoreNote, run: () => writeFileSync(full, before) };
  const ensureDir = (rel: string): void => {
    const full = join(workspace, ...rel.split('/'));
    if (existsSync(full)) return;
    const parent = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
    if (parent) ensureDir(parent);
    mkdirSync(full);
    createdDirs.push(rel);
    undo.push({ path: rel, step: 'REMOVE_DIRECTORY', recovery: 'created by the failed installation and not removed; remove it if it is empty', run: () => rmdirSync(full) });
  };
  const put = (rel: string, full: string, content: string | null): void => {
    options.beforeChange?.(rel);
    const before = existsSync(full) ? readFileSync(full) : null;
    const relDir = rel.slice(0, rel.lastIndexOf('/'));
    if (content !== null) ensureDir(relDir);
    undo.push(fileUndo(rel, full, before, 'its earlier content was not written back; delete this file if it exists, then install again from the previously installed package'));
    if (content === null) {
      rmSync(full);
      // An owned Skill directory left empty by the removal goes with it. Its
      // undo is registered after the file's, so it runs first and the
      // directory exists again when the file is restored.
      const dir = dirname(full);
      if (/^\.github\/skills\/rstack-sdlc-[a-z0-9-]+$/.test(relDir) && readdirSync(dir).length === 0) {
        rmdirSync(dir);
        undo.push({ path: relDir, step: 'RESTORE_DIRECTORY', recovery: 'removed by the failed installation and not recreated; install again from the previously installed package', run: () => mkdirSync(dir) });
      }
    } else {
      writeFileSync(full, content);
    }
    applied.push(rel);
  };
  try {
    for (const w of writes) put(w.path, w.full, w.content);
    for (const r of removals) put(r.path, r.full, null);
    const record: InstallManifest = {
      schema_version: 1,
      record_type: 'install-manifest',
      prefix: PREFIX,
      package: {
        root: forward(packageDir),
        manifest_sha256: manifestSha,
        generator_version: manifest.generator_version,
        profile_id: manifest.profile.profile_id,
        profile_version: manifest.profile.profile_version,
      },
      workspace: forward(workspace),
      engine_command: tokens.ENGINE as string,
      files: wanted.map((w) => ({ path: w.file.path, sha256: sha256Hex(w.content), package_sha256: w.file.sha256 })),
      created_dirs: [...new Set([...(previous?.created_dirs ?? []), ...createdDirs])].filter((d) => existsSync(join(workspace, ...d.split('/')))).sort(),
    };
    const manifestFull = join(workspace, ...INSTALL_MANIFEST.split('/'));
    options.beforeChange?.(INSTALL_MANIFEST);
    const before = existsSync(manifestFull) ? readFileSync(manifestFull) : null;
    undo.push(fileUndo(`${INSTALL_MANIFEST}.tmp`, `${manifestFull}.tmp`, null, ''));
    writeFileSync(`${manifestFull}.tmp`, `${JSON.stringify(record, null, 2)}\n`);
    undo.push(fileUndo(INSTALL_MANIFEST, manifestFull, before, 'the earlier install manifest was not written back; run verify to see which owned files no longer match it'));
    renameSync(`${manifestFull}.tmp`, manifestFull);
    applied.push(INSTALL_MANIFEST);
  } catch (e) {
    const cause = e instanceof Error ? e.message : String(e);
    // An undo step that fails is recorded, never swallowed: a complete
    // rollback is claimed only when every step ran.
    const notUndone: { path: string; step: UndoStep['step']; error: string; recovery: string }[] = [];
    for (const step of undo.reverse()) {
      try {
        step.run();
      } catch (undoError) {
        notUndone.push({ path: step.path, step: step.step, error: undoError instanceof Error ? undoError.message : String(undoError), recovery: step.recovery });
      }
    }
    if (notUndone.length > 0) {
      throw new PackageError(
        'INSTALL_FAILED_ROLLBACK_INCOMPLETE',
        `the installation failed (${cause}) and ${notUndone.length} undo step(s) failed as well; the workspace is not as it was. Not undone: ${notUndone.map((u) => `${u.path} (${u.step})`).join(', ')}. Run verify and see the recovery note for each path`,
        { cause, not_undone: notUndone },
      );
    }
    throw new PackageError('INSTALL_FAILED_ROLLED_BACK', `the installation failed and its changes were undone: ${cause}`, { cause });
  }
  return report(base, 'INSTALLED', applied);
}

export interface UninstallOptions {
  workspace: string;
  dryRun?: boolean;
}

// Removes only files whose bytes are still what was installed. A file changed
// after installation is kept and reported; it belongs to the user from then on.
export function uninstall(options: UninstallOptions): OperationReport {
  const dryRun = options.dryRun ?? true;
  const workspace = checkWorkspace(options.workspace, null);
  const previous = readInstallManifest(workspace);
  const base = { operation: 'uninstall' as const, dry_run: dryRun, workspace, package_root: previous?.package.root ?? null, engine_command: null };
  if (!previous) return { ok: true, code: 'NOT_INSTALLED', ...base, actions: [], blocked_by: [], applied: [], host_validation: 'NOT_OBSERVED' };

  const actions: PlanAction[] = [];
  const removals: string[] = [];
  for (const file of previous.files) {
    const full = assertContained(workspace, file.path);
    if (!existsSync(full)) actions.push({ path: file.path, action: 'ALREADY_ABSENT', detail: 'not present' });
    else if (hashOf(full) !== file.sha256) actions.push({ path: file.path, action: 'PRESERVED_USER_MODIFIED', detail: 'changed after installation; kept' });
    else {
      actions.push({ path: file.path, action: 'REMOVE', detail: 'unmodified since installation' });
      removals.push(full);
    }
  }
  const preserved = actions.some((a) => a.action === 'PRESERVED_USER_MODIFIED');
  const done = (code: string, applied: string[]): OperationReport => ({ ok: true, code, ...base, actions, blocked_by: [], applied, host_validation: 'NOT_OBSERVED' });
  if (dryRun) return done(preserved ? 'PLAN_READY_WITH_PRESERVED_FILES' : 'PLAN_READY', []);

  for (const full of removals) rmSync(full);
  rmSync(join(workspace, ...INSTALL_MANIFEST.split('/')));
  // Deepest first; a directory holding anything else is left in place.
  for (const dir of [...previous.created_dirs].sort((a, b) => b.length - a.length)) {
    const full = assertContained(workspace, dir);
    if (existsSync(full) && readdirSync(full).length === 0) rmdirSync(full);
  }
  const applied = [...actions.filter((a) => a.action === 'REMOVE').map((a) => a.path), INSTALL_MANIFEST];
  return done(preserved ? 'UNINSTALLED_WITH_PRESERVED_FILES' : 'UNINSTALLED', applied);
}

export interface VerifyReport {
  ok: boolean;
  code: 'CLEAN' | 'DRIFT' | 'NOT_INSTALLED';
  workspace: string;
  files: { path: string; status: 'OK' | 'MODIFIED' | 'MISSING' }[];
  // Whether the package the installed commands point to is still there and unchanged.
  package: 'PRESENT' | 'MISSING' | 'CHANGED' | null;
  host_validation: 'NOT_OBSERVED';
}

// Drift detection. It reads; it never repairs.
export function verify(workspaceArg: string): VerifyReport {
  const workspace = checkWorkspace(workspaceArg, null);
  const previous = readInstallManifest(workspace);
  if (!previous) return { ok: true, code: 'NOT_INSTALLED', workspace, files: [], package: null, host_validation: 'NOT_OBSERVED' };
  const files = previous.files.map((file) => {
    const full = assertContained(workspace, file.path);
    const status = !existsSync(full) ? ('MISSING' as const) : hashOf(full) === file.sha256 ? ('OK' as const) : ('MODIFIED' as const);
    return { path: file.path, status };
  });
  const packageManifest = join(previous.package.root, PACKAGE_MANIFEST);
  const pkg = !existsSync(packageManifest) ? 'MISSING' : hashOf(packageManifest) === previous.package.manifest_sha256 ? 'PRESENT' : 'CHANGED';
  const clean = pkg === 'PRESENT' && files.every((f) => f.status === 'OK');
  return { ok: clean, code: clean ? 'CLEAN' : 'DRIFT', workspace, files, package: pkg, host_validation: 'NOT_OBSERVED' };
}
