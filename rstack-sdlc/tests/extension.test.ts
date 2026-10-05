// Extension boundaries: a replaced transport, an alternate profile, an
// optional procedure, and a retired instruction. Evidence class: engine and
// generated-package tests (offline). Role content is SIMULATED throughout.
// Inspecting generated files shows what the package contains; it does not
// show what a host loads.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { generatePackage } from '../adapters/copilot-vscode/generate.ts';
import { PackageError } from '../adapters/copilot-vscode/install.ts';
import { createFileDropTransport } from '../adapters/fake-file-drop-transport/index.ts';
import { type FakeScript, createFakeTransport } from '../adapters/fake-transport/index.ts';
import type { RoleTransport } from '../core/contracts/ports.ts';
import { sha256Hex } from '../core/contracts/records.ts';
import { driveRun } from '../core/engine/drive.ts';
import { createAssembly } from '../scripts/assembly.ts';
import { APP, PACKAGE_ROOT, PROFILE, REQUEST, decision, eventTypes, newRun, tmpDir } from './support/harness.ts';

const ALT_PROFILE = join(PACKAGE_ROOT, 'tests', 'fixtures', 'profiles', 'alt-test-v2.json');
const profileText = readFileSync(PROFILE, 'utf8');
const altText = readFileSync(ALT_PROFILE, 'utf8');

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)).replaceAll('\\', '/'))
    .sort();
}

const read = (dir: string, path: string): string => readFileSync(join(dir, path), 'utf8');

function codeOf(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof PackageError, `expected a PackageError, got ${String(e)}`);
    return e.code;
  }
  return 'NO_ERROR';
}

// Drives one run to its end with the given transport and a scripted decision.
async function lifecycle(label: string, make: (runsRoot: string, script: FakeScript) => RoleTransport, script: FakeScript): Promise<{ steps: string[]; events: string[]; final: string }> {
  const run = await newRun(label);
  const { engine } = run.assembly;
  const transport = make(run.assembly.runsRoot, script);
  const first = driveRun(engine, transport, run.runId);
  assert.equal(first.last.directive?.kind, 'WAIT', 'the human checkpoint is reached and is not skipped');
  engine.decide(run.runId, decision(first.last));
  const second = driveRun(engine, transport, run.runId);
  const steps = [...first.trace, ...second.trace].filter((t) => t.action !== 'next').map((t) => `${t.attempt_id} ${t.action} ${t.code}`);
  const d = second.last.directive;
  return { steps, events: eventTypes(run), final: d?.kind === 'DONE' ? d.terminal : `${d?.kind}` };
}

test('a second fake transport replaces the first through the port, with the same lifecycle and the same refusals', async () => {
  // One inadequate proof and one wrong implementation, so the engine's refusals are exercised by both.
  const script: FakeScript = { intent: ['timeout', 'success'], proof: ['vacuous', 'success'], implement: ['wrong', 'success'] };
  const first = await lifecycle('swap-fake', createFakeTransport, script);
  const second = await lifecycle('swap-file-drop', createFileDropTransport, script);
  assert.equal(second.final, 'PR_PROPOSAL_READY');
  assert.deepEqual(second.steps, first.steps, 'every submission is accepted or refused exactly as with the first transport');
  assert.deepEqual(second.events, first.events, 'the journal records the same sequence of events');
  assert.ok(second.steps.some((s) => /^proof-1 submit:RESULT (?!ACCEPTED)/.test(s)), 'the vacuous proof was refused');
  assert.ok(second.events.includes('verification_failed') || second.steps.some((s) => s.startsWith('implement-2')), 'the wrong implementation did not pass');

  // The run's evidence class still gates what a transport may feed it.
  const manual = await newRun('swap-class', {}, 'MANUAL_TRANSPORT');
  const refused = driveRun(manual.assembly.engine, createFileDropTransport(manual.assembly.runsRoot), manual.runId);
  assert.equal(refused.stopped, 'TRANSPORT_CLASS_MISMATCH');
  assert.deepEqual(refused.trace, [], 'nothing was dispatched');

  // The substitution needed no core change: the core does not know either transport.
  for (const entry of readdirSync(join(PACKAGE_ROOT, 'core'), { withFileTypes: true, recursive: true }).filter((e) => e.isFile())) {
    assert.doesNotMatch(readFileSync(join(entry.parentPath, entry.name), 'utf8'), /fake-transport|fake-file-drop|file-drop/i, entry.name);
  }
});

test('an alternate profile is used by a run and by a package without touching the active profile', async () => {
  const activeBefore = sha256Hex(readFileSync(PROFILE));

  // The run freezes the profile it was started with, and its attempt limits apply.
  const blockedAfter = async (profilePath: string): Promise<{ profileId: string; implementAttempts: number; blocker: string | false }> => {
    const assembly = createAssembly(tmpDir('alt-profile'), { engine: { lockTimeoutMs: 400 } });
    const started = await assembly.start({ request: { path: REQUEST }, appDir: APP, profilePath, transportClass: 'SIMULATED' });
    assert.equal(started.code, 'STARTED');
    const runId = started.run_id as string;
    const transport = createFakeTransport(assembly.runsRoot, { implement: ['wrong', 'wrong'] });
    assembly.engine.decide(runId, decision(driveRun(assembly.engine, transport, runId).last));
    const end = driveRun(assembly.engine, transport, runId).last;
    const first = JSON.parse(readFileSync(join(assembly.runsRoot, runId, 'journal.jsonl'), 'utf8').split('\n')[0]!.slice(65)) as { data: { profile_id: string } };
    return {
      profileId: first.data.profile_id,
      implementAttempts: transport.dispatched.filter((a) => a.startsWith('implement-')).length,
      blocker: end.directive?.kind === 'BLOCKED' && end.directive.blocker,
    };
  };
  assert.deepEqual(await blockedAfter(PROFILE), { profileId: 'trial', implementAttempts: 2, blocker: 'VERIFICATION_FAILED' });
  assert.deepEqual(await blockedAfter(ALT_PROFILE), { profileId: 'alt-test', implementAttempts: 1, blocker: 'VERIFICATION_FAILED' }, 'the alternate limit applies; the failed verification still blocks');

  // The package generated from it names the alternate assignments and still pins nothing.
  const out = join(tmpDir('alt-package'), 'out');
  const manifest = generatePackage({ profileText: altText, outDir: out });
  assert.deepEqual([manifest.profile.profile_id, manifest.profile.path, manifest.profile.sha256], ['alt-test', 'runtime/profiles/alt-test-v2.json', sha256Hex(altText)]);
  assert.equal(read(out, manifest.profile.path), altText, 'the profile travels with the package byte for byte');
  assert.deepEqual(Object.fromEntries(Object.entries(manifest.models).map(([role, m]) => [role, `${m.owner_label}:${m.model_key}`])), {
    coordinator: 'Luna:OMITTED',
    planner: 'Sol 6.1:OMITTED',
    'plan-auditor': 'Opus 5.5:OMITTED',
    tester: 'Terra:OMITTED',
    developer: 'Terra:OMITTED',
    reviewer: 'Sol 6.1:OMITTED',
    'pr-reviewer': 'Sol 6.1:OMITTED',
  });
  for (const file of listFiles(out).filter((f) => f.endsWith('.agent.md'))) assert.doesNotMatch(read(out, file), /^model:/m, `${file}: no model key`);

  assert.equal(sha256Hex(readFileSync(PROFILE)), activeBefore, 'the active profile file is unchanged');
});

test('MODEL-1: unsupported profile settings and versions are refused by name, by the engine and by the generator', async () => {
  const variant = (change: (p: Record<string, any>) => void): string => {
    const p = JSON.parse(altText) as Record<string, any>;
    change(p);
    return JSON.stringify(p);
  };
  const cases: [string, string, RegExp, string][] = [
    ['schema version', variant((p) => (p.schema_version = 2)), /schema version 2 is not supported/, 'UNSUPPORTED_SCHEMA_VERSION'],
    ['effort', variant((p) => (p.roles.planner.effort_policy = 'high')), /UNSUPPORTED_EFFORT/, 'INVALID_PROFILE'],
    ['fallback', variant((p) => (p.fallbacks = [{ from: 'sol', to: 'luna' }])), /UNSUPPORTED_FALLBACK/, 'INVALID_PROFILE'],
    ['unknown setting', variant((p) => (p.roles.planner.temperature = 0)), /temperature: unknown field/, 'INVALID_PROFILE'],
    ['invented selector', variant((p) => (p.catalog.luna.host_selector = 'luna-9')), /requires selector_status/, 'INVALID_PROFILE'],
  ];
  const workspace = tmpDir('unsupported');
  const profiles = tmpDir('unsupported-profiles');
  const out = join(tmpDir('unsupported-package'), 'out');
  generatePackage({ profileText: altText, outDir: out });
  const before = listFiles(out).map((f) => `${f}:${sha256Hex(readFileSync(join(out, f)))}`);
  for (const [name, text, issue, code] of cases) {
    const profilePath = join(profiles, `${code}-${cases.findIndex((c) => c[0] === name)}.json`);
    writeFileSync(profilePath, text);
    const reply = await createAssembly(workspace).start({ request: { path: REQUEST }, appDir: APP, profilePath, transportClass: 'SIMULATED' });
    assert.equal(reply.ok, false, name);
    assert.equal(reply.code, code, name);
    assert.match(JSON.stringify(reply), issue, name);

    let thrown: PackageError | null = null;
    try {
      generatePackage({ profileText: text, outDir: out });
    } catch (e) {
      thrown = e as PackageError;
    }
    assert.equal(thrown?.code, code, `${name}: generator`);
    assert.match(JSON.stringify(thrown?.detail), issue, `${name}: generator`);
  }
  assert.ok(!existsSync(join(workspace, '.rstack')), 'no run was created from a refused profile');
  assert.deepEqual(listFiles(out).map((f) => `${f}:${sha256Hex(readFileSync(join(out, f)))}`), before, 'a refused generation leaves the earlier output as it was');
  assert.equal(codeOf(() => generatePackage({ profileText: altText.replace('"copilot-vscode"', '"other-host"'), outDir: out })), 'UNSUPPORTED_HOST');
});

const extensions = (change: Record<string, unknown> = {}): string =>
  JSON.stringify({ schema_version: 1, record_type: 'package-extensions', optional_skills: [], instructions: [], ...change });
const CHANGE_NOTES = { id: 'change-notes', source: 'tests/fixtures/extensions/change-notes/SKILL.md', description: 'Use when the human asks for change notes.', roles: ['developer'] };
const BANNER = { id: 'legacy-banner', source: 'tests/fixtures/extensions/obsolete-banner.md', roles: ['developer', 'tester'], purpose: 'Synthetic workaround used by the packaging tests.' };
const CANARY = 'SYNTHETIC-OBSOLETE-INSTRUCTION-7C41';

test('an optional procedure is added and removed through the Skill interface without changing anything required', () => {
  const base = tmpDir('optional-skill');
  const plain = join(base, 'plain');
  const withSkill = join(base, 'with');
  generatePackage({ profileText, outDir: plain });
  const manifest = generatePackage({ profileText, outDir: withSkill, extensionsText: extensions({ optional_skills: [CHANGE_NOTES] }) });

  // Added: one Skill file and one line pointing the named role to it.
  const added = listFiles(withSkill).filter((f) => !listFiles(plain).includes(f));
  assert.deepEqual(added, ['.github/skills/rstack-sdlc-change-notes/SKILL.md']);
  const skill = read(withSkill, added[0]!);
  assert.match(skill, /^---\nname: rstack-sdlc-change-notes\ndescription: 'Use when the human asks for change notes\.'\nuser-invocable: false\n---\n<!-- GENERATED by .* from tests\/fixtures\/extensions\/change-notes\/SKILL\.md/);
  assert.deepEqual(manifest.extensions.optional_skills.map((s) => [s.id, s.roles]), [['change-notes', ['developer']]]);
  const developer = '.github/agents/rstack-sdlc-developer.agent.md';
  assert.equal(
    read(withSkill, developer),
    `${read(plain, developer)}\nOptional procedure: the \`rstack-sdlc-change-notes\` Skill. Use when the human asks for change notes.\n`,
    'the developer agent gains exactly one line',
  );
  // Nothing else moved: every other agent, both required Skills, and the whole runtime are byte-identical.
  for (const file of listFiles(plain).filter((f) => f !== developer && f !== 'rstack-sdlc-manifest.json')) {
    assert.equal(read(withSkill, file), read(plain, file), file);
  }
  assert.equal(read(withSkill, developer).match(/^tools: .*$/m)?.[0], read(plain, developer).match(/^tools: .*$/m)?.[0], 'no tool was added');

  // Removed: regenerating without it gives the plain package again, byte for byte.
  generatePackage({ profileText, outDir: withSkill });
  assert.deepEqual(listFiles(withSkill).map((f) => `${f}:${sha256Hex(readFileSync(join(withSkill, f)))}`), listFiles(plain).map((f) => `${f}:${sha256Hex(readFileSync(join(plain, f)))}`));
});

test('a retired instruction leaves the package while every required instruction stays', () => {
  const base = tmpDir('retire');
  const plain = join(base, 'plain');
  const active = join(base, 'active');
  const retired = join(base, 'retired');
  generatePackage({ profileText, outDir: plain });
  generatePackage({ profileText, outDir: active, extensionsText: extensions({ instructions: [{ ...BANNER, status: 'active' }] }) });
  const manifest = generatePackage({
    profileText,
    outDir: retired,
    extensionsText: extensions({ instructions: [{ ...BANNER, status: 'retired', retired_reason: 'The host quirk it worked around no longer exists.' }] }),
  });

  // While active it is in exactly the agents it names, with its source identified.
  const carriers = listFiles(active).filter((f) => read(active, f).includes(CANARY));
  assert.deepEqual(carriers, ['.github/agents/rstack-sdlc-developer.agent.md', '.github/agents/rstack-sdlc-tester.agent.md']);
  assert.match(read(active, carriers[0]!), /## Additional instructions\n\n<!-- instruction legacy-banner from tests\/fixtures\/extensions\/obsolete-banner\.md \(sha256:[0-9a-f]{64}\) -->/);

  // Retired: the text is in no file of the package, and the manifest keeps the id and the reason.
  for (const file of listFiles(retired)) assert.ok(!read(retired, file).includes(CANARY) && !read(retired, file).includes('LEGACY-BANNER'), `${file} carries no retired text`);
  assert.deepEqual(manifest.extensions.instructions.map((i) => [i.id, i.status, i.retired_reason]), [['legacy-banner', 'retired', 'The host quirk it worked around no longer exists.']]);

  // Required behavior remains: retiring it restores every agent, Skill, and runtime file exactly.
  for (const file of listFiles(plain).filter((f) => f !== 'rstack-sdlc-manifest.json')) assert.equal(read(retired, file), read(plain, file), file);
  // And while it was active, the authored role text was still complete in front of it.
  for (const file of carriers) assert.ok(read(active, file).startsWith(read(plain, file)), `${file}: authored text is intact`);
});

test('extensions cannot weaken the package: unsupported versions, unknown fields, required Skills, and escaping sources are refused', () => {
  const out = join(tmpDir('ext-refused'), 'out');
  const gen = (text: string) => () => generatePackage({ profileText, outDir: out, extensionsText: text });
  assert.equal(codeOf(gen(extensions({ schema_version: 2 }))), 'UNSUPPORTED_SCHEMA_VERSION');
  assert.equal(codeOf(gen('{ not json')), 'INVALID_EXTENSIONS');
  const refused: Record<string, unknown>[] = [
    { remove_agents: ['reviewer'] },
    { optional_skills: [{ ...CHANGE_NOTES, tools: ['execute'] }] },
    { optional_skills: [{ ...CHANGE_NOTES, model: 'x' }] },
    { optional_skills: [{ ...CHANGE_NOTES, id: 'planning-records' }] },
    { optional_skills: [{ ...CHANGE_NOTES, roles: ['coordinator'] }] },
    { optional_skills: [{ ...CHANGE_NOTES, roles: [] }] },
    { optional_skills: [CHANGE_NOTES, CHANGE_NOTES] },
    { optional_skills: [{ ...CHANGE_NOTES, source: '../README.md' }] },
    { optional_skills: [{ ...CHANGE_NOTES, source: 'C:/x/SKILL.md' }] },
    { optional_skills: [{ ...CHANGE_NOTES, description: "it's quoted" }] },
    { instructions: [{ ...BANNER, status: 'paused' }] },
    { instructions: [{ ...BANNER, status: 'retired' }] },
    { instructions: [{ ...BANNER, status: 'active', retired_reason: 'x' }] },
    { instructions: [{ ...BANNER, status: 'active', roles: ['nobody'] }] },
  ];
  for (const change of refused) assert.equal(codeOf(gen(extensions(change))), 'INVALID_EXTENSIONS', JSON.stringify(change));
  assert.equal(codeOf(gen(extensions({ optional_skills: [{ ...CHANGE_NOTES, source: 'tests/fixtures/extensions/missing.md' }] }))), 'SOURCE_NOT_FOUND');
  assert.ok(!existsSync(out), 'no refused definition produced any output');

  // A retired instruction whose text is still in an authored source is caught, not shipped.
  const still = extensions({ instructions: [{ id: 'still-there', source: 'core/roles/tester.md', roles: ['tester'], purpose: 'x', status: 'retired', retired_reason: 'x' }] });
  assert.equal(codeOf(gen(still)), 'RETIRED_INSTRUCTION_PRESENT');
});
