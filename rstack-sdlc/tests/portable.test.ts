// Portable engine invocation. A generated package is relocated, installed
// into a disposable workspace by its own installer, and its engine is then
// driven only through the command lines written into the installed
// coordinator, from an unrelated working directory, through a shell. Every
// path involved contains a space.
//
// Evidence class: generated-package checks (PACKAGE_TESTED). Role content is
// SIMULATED and the decision is SCRIPTED; the application tests are actually
// executed by the relocated engine. A shell on this machine is not the VS
// Code terminal tool: nothing here is COPILOT_VALIDATED.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { generatePackage } from '../adapters/copilot-vscode/generate.ts';
import { fakeResult } from '../adapters/fake-transport/index.ts';
import type { TaskEnvelope } from '../core/contracts/records.ts';
import { sha256Hex } from '../core/contracts/records.ts';
import { APP, PACKAGE_ROOT, REQUEST, tmpDir } from './support/harness.ts';

const ALT_PROFILE = readFileSync(join(PACKAGE_ROOT, 'tests', 'fixtures', 'profiles', 'alt-test-v2.json'), 'utf8');
const DENY = join(PACKAGE_ROOT, 'tests', 'support', 'deny-network.ts');
const forward = (p: string): string => p.replaceAll('\\', '/');

function snapshot(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => `${forward(relative(dir, join(e.parentPath, e.name)))}:${sha256Hex(readFileSync(join(e.parentPath, e.name)))}`)
    .sort();
}

const bytesOf = (dir: string): number =>
  readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .reduce((sum, e) => sum + statSync(join(e.parentPath, e.name)).size, 0);

interface Shell {
  name: string;
  run: (line: string, cwd: string, env?: NodeJS.ProcessEnv) => { status: number | null; stdout: string; stderr: string };
}

const SYSTEM_SHELL: Shell = {
  name: process.platform === 'win32' ? 'cmd.exe' : 'sh',
  run: (line, cwd, env = {}) => spawnSync(line, { shell: true, cwd, encoding: 'utf8', env: { ...process.env, ...env } }),
};

// Git Bash is the default terminal profile on the build machine. Another
// `bash` (for example one that maps drives differently) is not used.
function gitBash(): Shell | null {
  if (process.platform !== 'win32') return null;
  const probe = spawnSync('bash', ['-c', 'uname -s'], { encoding: 'utf8' });
  if (probe.status !== 0 || !/^(MINGW|MSYS)/.test(probe.stdout)) return null;
  return { name: 'Git Bash', run: (line, cwd, env = {}) => spawnSync('bash', ['-c', line], { cwd, encoding: 'utf8', env: { ...process.env, ...env } }) };
}

interface Reply {
  ok: boolean;
  code: string;
  run_id: string | null;
  directive: { kind: string; pending?: TaskEnvelope | null; expected_version?: number; terminal?: string } | null;
  [extra: string]: unknown;
}

function reply(r: { status: number | null; stdout: string; stderr: string }): Reply & { exit: number | null } {
  try {
    return { ...(JSON.parse(r.stdout) as Reply), exit: r.status };
  } catch {
    throw new Error(`no JSON reply (exit ${r.status}): ${r.stderr || r.stdout}`);
  }
}

// A relocated package, an application copy, a workspace, and an unrelated
// working directory: four separate directories, each with a space in its path.
function relocated(label: string): { base: string; pkg: string; app: string; workspace: string; cwd: string; request: string } {
  const base = tmpDir(label);
  const generated = join(base, 'generated');
  generatePackage({ profileText: ALT_PROFILE, outDir: generated });
  const pkg = join(base, 'relocated package');
  cpSync(generated, pkg, { recursive: true });
  // The directory it was generated into is removed: nothing can resolve through it.
  rmSync(generated, { recursive: true });
  const app = join(base, 'application copy');
  cpSync(APP, app, { recursive: true });
  const workspace = join(base, 'work space');
  const cwd = join(base, 'unrelated cwd');
  const requests = join(base, 'request files');
  for (const dir of [workspace, cwd, requests]) mkdirSync(dir);
  cpSync(REQUEST, join(requests, 'REQ-001.md'));
  // Bounded: the copies are the package (under 400 KB) and the sample application, not the project.
  assert.ok(bytesOf(pkg) < 400_000, `package is ${bytesOf(pkg)} bytes`);
  assert.ok(bytesOf(app) < 50_000);
  return { base, pkg, app, workspace, cwd, request: join(requests, 'REQ-001.md') };
}

// The command lines exactly as the installed coordinator shows them.
function installedCommands(workspace: string): Record<string, string> {
  const text = readFileSync(join(workspace, '.github', 'agents', 'rstack-sdlc-coordinator.agent.md'), 'utf8');
  const commands: Record<string, string> = {};
  for (const m of text.matchAll(/^(node "[^"]+" (status|next|submit|decide|resume)\b.*)$/gm)) commands[m[2] as string] = (m[1] as string).replace(/ {2,}/g, ' ');
  const start = /`(node "[^"`]+" start [^`]+)`/.exec(text);
  assert.ok(start, 'the coordinator shows a start command');
  commands.start = start[1] as string;
  assert.deepEqual(Object.keys(commands).sort(), ['decide', 'next', 'resume', 'start', 'status', 'submit']);
  return commands;
}

function installWithOwnInstaller(f: ReturnType<typeof relocated>): void {
  // The package installs itself: no --package, and a working directory that is neither.
  const r = spawnSync(process.execPath, [join(f.pkg, 'runtime', 'scripts', 'install-package.ts'), 'install', '--workspace', f.workspace, '--apply'], { cwd: f.cwd, encoding: 'utf8' });
  const out = JSON.parse(r.stdout) as { ok: boolean; code: string; package_root: string };
  assert.deepEqual([r.status, out.code], [0, 'INSTALLED'], r.stderr);
  assert.equal(forward(out.package_root), forward(f.pkg));
}

test('the installed engine runs a whole lifecycle from an unrelated directory, resolving only through the relocated package', (t) => {
  const f = relocated('portable');
  const packageBefore = snapshot(f.pkg);
  const appBefore = snapshot(f.app);
  installWithOwnInstaller(f);
  const cmd = installedCommands(f.workspace);
  const sh = SYSTEM_SHELL;
  t.diagnostic(`shell: ${sh.name}`);

  // No installed command names the development checkout or a relative engine path.
  for (const line of Object.values(cmd)) {
    assert.ok(line.startsWith(`node "${forward(f.pkg)}/runtime/scripts/rstack.ts" `), line);
    assert.ok(line.includes(`--workspace "${forward(f.workspace)}"`), line);
  }

  const startLine = `${cmd.start!.replace('<application directory>', `"${forward(f.app)}"`).replace('<file>', `"${forward(f.request)}"`)} --simulated`;
  const started = reply(sh.run(startLine, f.cwd));
  assert.deepEqual([started.exit, started.code], [0, 'STARTED']);
  const runId = started.run_id as string;
  const runsRoot = join(f.workspace, '.rstack', 'runs');
  const runDir = join(runsRoot, runId);
  const withRun = (line: string): string => line.replace('<run-id>', runId);

  // Three roots, kept apart: the run is in the workspace, not in the package, the application, or the working directory.
  assert.ok(existsSync(join(runDir, 'journal.jsonl')));
  const first = JSON.parse(readFileSync(join(runDir, 'journal.jsonl'), 'utf8').split('\n')[0]!.slice(65)) as { data: { profile_id: string; profile_ref: string } };
  assert.equal(first.data.profile_id, 'alt-test', 'the profile is the one carried by the package, not the checkout default');
  assert.equal(first.data.profile_ref, `sha256:${sha256Hex(ALT_PROFILE)}`);

  // Drive it to the end using only the installed command lines. Role results are
  // the scripted fixture content, written where a worker would leave them.
  let final: Reply | null = null;
  const recordedBy = 'portable test fixture, not a human';
  for (let i = 0; i < 40 && !final; i++) {
    const next = reply(sh.run(withRun(cmd.next!), f.cwd));
    assert.equal(next.ok, true, `next: ${next.code}`);
    const d = next.directive;
    if (d?.kind === 'CONTINUE' && d.pending) {
      const resultFile = join(runDir, d.pending.work_dir, 'result.json');
      writeFileSync(resultFile, JSON.stringify(fakeResult(runsRoot, d.pending)));
      const submitted = reply(sh.run(withRun(cmd.submit!).replace('<path to result.json>', `"${forward(resultFile)}"`), f.cwd));
      assert.equal(submitted.code, 'ACCEPTED', d.pending.attempt_id);
    } else if (d?.kind === 'WAIT') {
      const line = withRun(cmd.decide!)
        .replace('<action>', 'proceed')
        .replace('<n>', String(d.expected_version))
        .replace('<id>', 'D1')
        .replace('<who said it>', recordedBy)
        .replace('HUMAN_RECORDED', 'SCRIPTED');
      assert.equal(reply(sh.run(line, f.cwd)).ok, true);
    } else if (d?.kind === 'DONE' || d?.kind === 'BLOCKED') {
      final = next;
    }
  }
  assert.deepEqual([final?.directive?.kind, final?.directive?.terminal], ['DONE', 'PR_PROPOSAL_READY']);
  assert.ok(existsSync(join(runDir, 'proposal', 'pr-proposal.json')));
  assert.ok(readdirSync(join(runDir, 'exec')).length >= 2, 'the relocated engine ran the application tests itself');
  assert.ok(readFileSync(join(runDir, 'journal.jsonl'), 'utf8').includes(recordedBy), 'a quoted argument with spaces and a comma arrived whole');
  assert.equal(reply(sh.run(withRun(cmd.status!), f.cwd)).code, 'STATUS');
  assert.equal(reply(sh.run(withRun(cmd.resume!), f.cwd)).ok, true);

  // Nothing was written to the package, the application, or the working directory.
  assert.deepEqual(snapshot(f.pkg), packageBefore, 'the package is unchanged');
  assert.deepEqual(snapshot(f.app), appBefore, 'the application is unchanged');
  assert.deepEqual(readdirSync(f.cwd), [], 'the working directory is untouched');
  assert.deepEqual(readdirSync(f.workspace).sort(), ['.github', '.rstack']);

  // Every module the engine process loads comes from the relocated package.
  const log = join(f.base, 'loads.log');
  writeFileSync(log, '');
  const traced = withRun(cmd.status!).replace(/^node /, `node --import "${pathToFileURL(DENY).href}" `);
  assert.equal(reply(sh.run(traced, f.cwd, { RSTACK_TEST_LOG: log })).code, 'STATUS');
  const loads = readFileSync(log, 'utf8').split('\n').filter((l) => l.startsWith('LOAD file:'));
  const packageUrl = pathToFileURL(f.pkg).href;
  assert.ok(loads.length >= 15, `${loads.length} files loaded`);
  for (const line of loads) assert.ok(line.startsWith(`LOAD ${packageUrl}/runtime/`), `loaded from outside the package: ${line}`);
  assert.deepEqual(readFileSync(log, 'utf8').split('\n').filter((l) => l.startsWith('NETWORK')), []);

  // Explicit refusals instead of a silent fallback to the checkout.
  const noProfile = reply(sh.run(startLine.replace(/ --profile "[^"]+"/, ''), f.cwd));
  assert.deepEqual([noProfile.exit, noProfile.code, noProfile.message], [2, 'MISSING_INPUT', 'the profile file does not exist']);
  const deferred = reply(sh.run(startLine.replace(' --simulated', ' --source jira --simulated'), f.cwd));
  assert.deepEqual([deferred.exit, deferred.code, deferred.integration], [2, 'INTEGRATION_NOT_CONFIGURED', 'jira']);
  assert.equal(readdirSync(runsRoot).length, 1, 'neither refusal created a run');

  // A package with a runtime file missing fails loudly; it does not find the file elsewhere.
  const broken = join(f.base, 'broken package');
  cpSync(f.pkg, broken, { recursive: true });
  rmSync(join(broken, 'runtime', 'core', 'engine', 'journal.ts'));
  const failed = sh.run(withRun(cmd.status!).replace(forward(f.pkg), forward(broken)), f.cwd);
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /ERR_MODULE_NOT_FOUND/);

  // Moving the package after installation is reported, and removal still works
  // and leaves the run evidence in place.
  const installer = (pkg: string, args: string): Reply & { exit: number | null } =>
    reply(sh.run(`node "${forward(pkg)}/runtime/scripts/install-package.ts" ${args} --workspace "${forward(f.workspace)}"`, f.cwd));
  assert.deepEqual([installer(f.pkg, 'verify').code, installer(f.pkg, 'verify').package], ['CLEAN', 'PRESENT']);
  const moved = join(f.base, 'moved package');
  // Copy and remove rather than rename: a directory rename can be refused while a scanner holds a handle.
  cpSync(f.pkg, moved, { recursive: true });
  rmSync(f.pkg, { recursive: true, maxRetries: 10, retryDelay: 200 });
  const drift = installer(moved, 'verify');
  assert.deepEqual([drift.exit, drift.code, drift.package], [2, 'DRIFT', 'MISSING']);
  assert.equal(installer(moved, 'uninstall').code, 'PLAN_READY', 'without --apply removal is only planned');
  assert.ok(existsSync(join(f.workspace, '.github')));
  assert.equal(installer(moved, 'uninstall --apply').code, 'UNINSTALLED');
  assert.deepEqual(readdirSync(f.workspace), ['.rstack'], 'the customization files are gone and the run evidence stays');
  assert.ok(existsSync(join(runDir, 'proposal', 'pr-proposal.json')));
});

test('the installed command lines keep their arguments whole under Git Bash', (t) => {
  const sh = gitBash();
  if (!sh) {
    t.skip('Git Bash is not available on this machine');
    return;
  }
  const f = relocated('portable-bash');
  installWithOwnInstaller(f);
  const cmd = installedCommands(f.workspace);
  const startLine = cmd.start!.replace('<application directory>', `"${forward(f.app)}"`).replace('<file>', `"${forward(f.request)}"`);
  const started = reply(sh.run(startLine, f.cwd));
  assert.deepEqual([started.exit, started.code], [0, 'STARTED']);
  const runId = started.run_id as string;
  assert.ok(existsSync(join(f.workspace, '.rstack', 'runs', runId, 'journal.jsonl')));
  assert.equal(reply(sh.run(cmd.next!.replace('<run-id>', runId), f.cwd)).code, 'DISPATCHED');

  // A decision line with quoted free text: the engine answers it as one command
  // (a refusal here, because nothing is awaiting a decision), not as a usage error.
  const decide = cmd
    .decide!.replace('<run-id>', runId)
    .replace('<action>', 'proceed')
    .replace('<n>', '1')
    .replace('<id>', 'D1')
    .replace('<who said it>', 'a person, quoted "here"'.replaceAll('"', '\\"'));
  const refused = reply(sh.run(decide, f.cwd));
  assert.deepEqual([refused.exit, refused.ok], [2, false]);
  assert.deepEqual(readdirSync(f.cwd), []);
});
