// Single human entry point, and the profile's selector states. Evidence class:
// generated-package and contract checks (PACKAGE_TESTED). They show what the
// generator writes and what the profile contract accepts or refuses. They do
// not show that any host hides an agent or a Skill, dispatches a role, applies
// a model, or refuses one: every one of those is HOST_CONFIRMATION_REQUIRED.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { generatePackage } from '../adapters/copilot-vscode/generate.ts';
import { PackageError } from '../adapters/copilot-vscode/install.ts';
import { SELECTOR_STATUSES, parseProfile, sha256Hex } from '../core/contracts/records.ts';
import { WORKFLOW, dispatchRoles } from '../core/policies/workflow.ts';
import { PACKAGE_ROOT, PROFILE, newRun, pendingOf, tmpDir } from './support/harness.ts';

const profileText = readFileSync(PROFILE, 'utf8');
const WORKERS = ['planner', 'plan-auditor', 'tester', 'developer', 'reviewer', 'pr-reviewer'];
const ROLES = ['coordinator', ...WORKERS];
const WORKER_AGENTS = WORKERS.map((r) => `rstack-sdlc-${r}`);
const agentPath = (role: string): string => `.github/agents/rstack-sdlc-${role}.agent.md`;
const CHANGE_NOTES = { id: 'change-notes', source: 'tests/fixtures/extensions/change-notes/SKILL.md', description: 'Use when the human asks for change notes.', roles: ['developer'] };
const withOptionalSkill = JSON.stringify({ schema_version: 1, record_type: 'package-extensions', optional_skills: [CHANGE_NOTES], instructions: [] });

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile())
    .map((e) => relative(dir, join(e.parentPath, e.name)).replaceAll('\\', '/'))
    .sort();
}

interface Parts {
  front: Record<string, string>;
  lines: string[];
  body: string;
}

function split(text: string): Parts {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  assert.ok(m, 'file starts with frontmatter');
  const lines = (m[1] as string).split('\n');
  return { front: Object.fromEntries(lines.map((l) => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1).trim()])), lines, body: m[2] as string };
}

// A flow list as the generator writes it: ['a', 'b'].
function flowList(value: string | undefined): string[] {
  const m = /^\[(.*)\]$/.exec(value ?? '');
  assert.ok(m, `expected a flow list, got ${value}`);
  return (m[1] as string).split(', ').map((item) => {
    const quoted = /^'([^']*)'$/.exec(item);
    assert.ok(quoted, `expected a quoted item, got ${item}`);
    return quoted[1] as string;
  });
}

interface Generated {
  out: string;
  manifest: ReturnType<typeof generatePackage>;
  raw: (path: string) => string;
  agent: (role: string) => Parts;
}

function generate(label: string, text: string = profileText, extensionsText?: string): Generated {
  const out = join(tmpDir(label), 'out');
  const manifest = generatePackage({ profileText: text, outDir: out, ...(extensionsText === undefined ? {} : { extensionsText }) });
  const raw = (path: string): string => readFileSync(join(out, path), 'utf8');
  return { out, manifest, raw, agent: (role) => split(raw(agentPath(role))) };
}

// The trial profile with catalog entries changed. Nothing here is a real selector.
function variant(change: (catalog: Record<string, any>, profile: Record<string, any>) => void): string {
  const p = JSON.parse(profileText) as Record<string, any>;
  change(p.catalog, p);
  return JSON.stringify(p);
}
const pin =
  (alias: string, selector: unknown, status = 'owner-pinned') =>
  (catalog: Record<string, any>): void => {
    catalog[alias] = { ...catalog[alias], host_selector: selector, selector_status: status };
  };
const SENTINEL = { opus: 'ZZ Pin One (test only)', sonnet: 'ZZ Pin Two (test only)', sol: 'ZZ Pin Three (test only)' };
const allPinned = variant((catalog) => {
  for (const [alias, selector] of Object.entries(SENTINEL)) pin(alias, selector)(catalog);
});
const profileRoles = [...new Set([...dispatchRoles(WORKFLOW), 'coordinator'])];

function refusal(fn: () => unknown): PackageError {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof PackageError, `expected a PackageError, got ${String(e)}`);
    return e;
  }
  return assert.fail('expected the generator to refuse');
}

// ---------------------------------------------------------------- visibility

test('VISIBILITY-1: the coordinator is the entry point a user can select', () => {
  assert.equal(generate('vis-1').agent('coordinator').front['user-invocable'], 'true');
});

test('VISIBILITY-2: all six workers are hidden from the agent picker', () => {
  const pkg = generate('vis-2');
  for (const role of WORKERS) assert.equal(pkg.agent(role).front['user-invocable'], 'false', role);
});

test('VISIBILITY-3: the coordinator is not offered to other agents as a subagent', () => {
  assert.equal(generate('vis-3').agent('coordinator').front['disable-model-invocation'], 'true');
});

test('VISIBILITY-4: no worker is offered to agents that do not name it', () => {
  const pkg = generate('vis-4');
  for (const role of WORKERS) assert.equal(pkg.agent(role).front['disable-model-invocation'], 'true', role);
});

test('VISIBILITY-5: the coordinator may delegate to exactly the six workers, by name', () => {
  const pkg = generate('vis-5');
  const { front } = pkg.agent('coordinator');
  assert.deepEqual(flowList(front.agents), WORKER_AGENTS);
  assert.ok(flowList(front.tools).includes('agent'), 'the allowlist needs the agent tool');
  // Every name on the list is an agent this package generates under that exact name.
  for (const role of WORKERS) assert.equal(pkg.agent(role).front.name, `rstack-sdlc-${role}`);
  // The list is fixed by the package, not by the profile or by optional content.
  assert.deepEqual(flowList(generate('vis-5-pinned', allPinned, withOptionalSkill).agent('coordinator').front.agents), WORKER_AGENTS);
});

test('VISIBILITY-6: no worker can delegate', () => {
  const pkg = generate('vis-6');
  for (const role of WORKERS) {
    const { front } = pkg.agent(role);
    assert.ok(!flowList(front.tools).includes('agent'), `${role}: no agent tool`);
    assert.ok(!('agents' in front), `${role}: no agents list`);
  }
});

test('VISIBILITY-7: every generated Skill is kept out of the slash-command menu', () => {
  const pkg = generate('vis-7', profileText, withOptionalSkill);
  const skills = listFiles(pkg.out).filter((f) => f.startsWith('.github/skills/'));
  assert.deepEqual(skills, ['.github/skills/rstack-sdlc-application-records/SKILL.md', '.github/skills/rstack-sdlc-change-notes/SKILL.md', '.github/skills/rstack-sdlc-planning-records/SKILL.md']);
  for (const file of skills) assert.equal(split(pkg.raw(file)).front['user-invocable'], 'false', file);
});

test('VISIBILITY-8: every generated Skill stays loadable by the model', () => {
  const pkg = generate('vis-8', profileText, withOptionalSkill);
  for (const file of listFiles(pkg.out).filter((f) => f.startsWith('.github/skills/'))) {
    const { front } = split(pkg.raw(file));
    assert.ok(!('disable-model-invocation' in front), `${file}: automatic loading is not disabled`);
    // A hidden Skill is found by its description alone, so it must have one.
    assert.match(front.description as string, /^'[^']{20,}'$/, file);
    assert.deepEqual(Object.keys(front), ['name', 'description', 'user-invocable'], file);
  }
});

test('TARGET-1: all seven agents are targeted at VS Code, and the frontmatter holds only the documented keys', () => {
  const pkg = generate('target-1', allPinned);
  for (const role of ROLES) {
    const { front } = pkg.agent(role);
    assert.equal(front.target, 'vscode', role);
    const shared = ['user-invocable', 'disable-model-invocation', 'model'];
    const expected = role === 'coordinator' ? ['name', 'description', 'target', 'tools', 'agents', ...shared] : ['name', 'description', 'target', 'tools', ...shared];
    assert.deepEqual(Object.keys(front), expected, role);
  }
});

// ---------------------------------------------------------------- model precedence

test('PRECEDENCE-1: the coordinator is told never to choose, pass, substitute, or override a role model', () => {
  const pkg = generate('precedence-1');
  const text = pkg.raw(agentPath('coordinator'));
  assert.match(text, /A role agent's model is set by its installed agent file, never by you\./);
  assert.match(text, /leave the subagent tool's model argument unset: never choose, pass, substitute, or override a role's model\./);
  // A refused dispatch is reported and stopped, never worked around.
  assert.match(text, /do not retry, do not name another model or agent, do not omit the agent name, and do not do the role's work yourself/);
  assert.match(text, /```text\nRSTACK MODEL REQUIREMENT NOT AVAILABLE\nRole: <directive\.pending\.role>\nRequired model: <[^\n]+>\nHost result: <the host's message, unchanged>\n```/);
  assert.match(text, /the attempt stays pending/i);
  // The authored dispatch rule is unchanged and still excludes a model choice.
  assert.match(text, /and nothing else: no summary of earlier work, no opinion, no model choice\./);
  // Nothing gives the coordinator a model to supply.
  assert.doesNotMatch(text, /--model\b|model argument (to|as|with)\b/i);
  // Workers get no part of this: it is the coordinator's rule.
  for (const role of WORKERS) assert.doesNotMatch(pkg.raw(agentPath(role)), /RSTACK MODEL REQUIREMENT|subagent tool/, role);
});

test('PRECEDENCE-2: the role-to-model mapping exists only in the profile, never in coordinator prose or authored sources', () => {
  const catalog = (JSON.parse(allPinned) as { catalog: Record<string, { owner_label: string; family: string }> }).catalog;
  const labels = [...Object.values(SENTINEL), ...Object.values(catalog).flatMap((c) => [c.owner_label, c.family]), ...Object.keys(catalog).map((alias) => `\`${alias}\``)];

  // With every role pinned, the coordinator carries its own model in one frontmatter line and no model text anywhere else.
  const pinned = generate('precedence-2', allPinned);
  const coordinator = pinned.agent('coordinator');
  assert.equal(coordinator.front.model, SENTINEL.sonnet);
  assert.equal(coordinator.lines.filter((l) => l.includes('ZZ Pin')).length, 1);
  for (const label of labels) assert.ok(!coordinator.body.includes(label), `coordinator prose names ${label}`);

  // Unpinned, the only label it shows is the one intended for itself, in the generated note.
  const unpinned = generate('precedence-2-trial').agent('coordinator').body;
  assert.equal(unpinned.split('\n').filter((l) => /Sonnet 5/.test(l)).length, 1);
  for (const other of ['Opus 5.5', 'Sol 6.1', 'Luna', 'Terra']) assert.ok(!unpinned.includes(other), `coordinator prose names ${other}`);

  // No authored source that shapes an agent or a route names a model, a vendor, or a catalog label.
  const sources = ['adapters/copilot-vscode/generate.ts', 'adapters/copilot-vscode/coordinator.md', 'core/policies/workflow.ts', 'core/contracts/records.ts', ...WORKERS.map((r) => `core/roles/${r}.md`)];
  for (const file of sources) {
    const text = readFileSync(join(PACKAGE_ROOT, file), 'utf8');
    assert.doesNotMatch(text, /claude|gpt|sonnet|opus|anthropic|openai|\(copilot\)/i, file);
    for (const label of ['Opus 5.5', 'Sonnet 5', 'Sol 6.1', 'Luna', 'Terra']) assert.ok(!text.includes(label), `${file} names ${label}`);
  }
});

test('PRECEDENCE-3: a task envelope carries nothing about a model', async () => {
  const run = await newRun('precedence-3');
  const reply = run.assembly.engine.next(run.runId);
  const envelope = pendingOf(reply);
  assert.deepEqual(Object.keys(envelope).sort(), ['app_dir', 'attempt_id', 'input_digest', 'inputs', 'mode', 'output_contract', 'produces', 'profile_ref', 'record_type', 'role', 'round', 'run_id', 'schema_version', 'state_version', 'step_id', 'work_dir']);
  const keys: string[] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value !== null && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        keys.push(k);
        walk(v);
      }
    }
  };
  walk(reply);
  for (const k of keys) assert.doesNotMatch(k, /model|selector|alias|effort|catalog|fallback/i, `reply key ${k}`);
  const text = JSON.stringify(reply);
  for (const label of ['Opus 5.5', 'Sonnet 5', 'Sol 6.1', '"opus"', '"sonnet"', '"sol"']) assert.ok(!text.includes(label), `the reply names ${label}`);
});

// ---------------------------------------------------------------- profile selector states

test('PROFILE-1: an owner-pinned selector is accepted, written exactly, and reported as owner-pinned', () => {
  assert.deepEqual([...SELECTOR_STATUSES], ['requires-host-observation', 'owner-pinned', 'observed']);
  const text = variant(pin('opus', SENTINEL.opus));
  const parsed = parseProfile(text, profileRoles);
  assert.ok(parsed.ok, parsed.ok ? '' : parsed.issues.join('\n'));
  const pkg = generate('profile-1', text);
  for (const role of ['planner', 'reviewer', 'pr-reviewer']) {
    const agent = pkg.agent(role);
    assert.deepEqual(agent.lines.filter((l) => l.startsWith('model')), [`model: ${SENTINEL.opus}`], role);
    assert.ok(!agent.body.includes('Model not pinned'), `${role}: a pinned agent carries no unpinned note`);
    assert.deepEqual(pkg.manifest.models[role], { alias: 'opus', owner_label: 'Opus 5.5', selector_status: 'owner-pinned', model_key: 'WRITTEN' });
  }
  // The state names where the value came from: it is never reported as host-observed.
  assert.ok(!JSON.stringify(pkg.manifest.models).includes('"observed"'));
  // A pinned state without a selector, and a selector without a pinned state, are both refused.
  for (const bad of [variant(pin('opus', null)), variant(pin('opus', SENTINEL.opus, 'requires-host-observation'))]) {
    assert.ok(!parseProfile(bad, profileRoles).ok);
  }
});

test('PROFILE-2: a selector that requires host observation is omitted and the agent says so', () => {
  const pkg = generate('profile-2', variant(pin('opus', SENTINEL.opus)));
  for (const role of ['coordinator', 'plan-auditor', 'tester', 'developer']) {
    const agent = pkg.agent(role);
    assert.ok(!('model' in agent.front), `${role}: no model key`);
    assert.match(agent.body, /\n> Model not pinned\. Intended for this role: /, role);
    assert.equal(pkg.manifest.models[role]?.model_key, 'OMITTED');
    assert.equal(pkg.manifest.models[role]?.selector_status, 'requires-host-observation');
  }
});

test('PROFILE-3: a list-shaped or fallback selector is refused before anything is written', () => {
  const refused: [string, string][] = [
    ['a list value', variant(pin('opus', [SENTINEL.opus, SENTINEL.sol]))],
    ['a list written as text', variant(pin('opus', `['${SENTINEL.opus}', '${SENTINEL.sol}']`))],
    ['a bracketed single name', variant(pin('opus', `[${SENTINEL.opus}]`))],
    ['comma-separated names', variant(pin('opus', `${SENTINEL.opus}, ${SENTINEL.sol}`))],
    ['a second line', variant(pin('opus', `${SENTINEL.opus}\nmodel: ${SENTINEL.sol}`))],
    ['a quoted name', variant(pin('opus', `'${SENTINEL.opus}'`))],
    ['a comment', variant(pin('opus', `${SENTINEL.opus} # or ${SENTINEL.sol}`))],
    ['a mapping', variant(pin('opus', 'first: second'))],
    ['a padded name', variant(pin('opus', ` ${SENTINEL.opus}`))],
    ['an observed list', variant(pin('opus', [SENTINEL.opus], 'observed'))],
  ];
  for (const [label, text] of refused) {
    const parsed = parseProfile(text, profileRoles);
    assert.ok(!parsed.ok, label);
    assert.match(parsed.issues.join('\n'), /profile\.catalog\.opus\.host_selector: UNSUPPORTED_SELECTOR/, label);
    const out = join(tmpDir('profile-3'), 'out');
    const error = refusal(() => generatePackage({ profileText: text, outDir: out }));
    assert.equal(error.code, 'INVALID_PROFILE', label);
    assert.ok(!existsSync(out), `${label}: nothing was written`);
  }
  // A fallback table is still refused, with or without a pinned selector.
  const withTable = [
    variant((_catalog, p) => {
      p.fallbacks = [{ from: 'opus', to: 'sonnet' }];
    }),
    variant((catalog, p) => {
      pin('opus', SENTINEL.opus)(catalog);
      p.fallbacks = ['sonnet'];
    }),
  ];
  for (const text of withTable) {
    const parsed = parseProfile(text, profileRoles);
    assert.ok(!parsed.ok);
    assert.match(parsed.issues.join('\n'), /UNSUPPORTED_FALLBACK/);
  }
  // What is written for a pinned role is always one scalar: the selector, unchanged.
  const pkg = generate('profile-3-pinned', allPinned);
  for (const role of ROLES) assert.match(pkg.agent(role).front.model as string, /^ZZ Pin (One|Two|Three) \(test only\)$/, role);
});

test('PROFILE-4: two generations from the same profile are byte-identical, pinned or not', () => {
  const base = tmpDir('profile-4');
  const digest = (dir: string): string =>
    listFiles(dir)
      .map((f) => `${f}:${sha256Hex(readFileSync(join(dir, f)))}`)
      .join('\n');
  for (const [name, text] of [
    ['trial', profileText],
    ['pinned', allPinned],
  ] as const) {
    generatePackage({ profileText: text, outDir: join(base, name, 'a') });
    generatePackage({ profileText: text, outDir: join(base, name, 'b') });
    assert.equal(digest(join(base, name, 'a')), digest(join(base, name, 'b')), name);
    assert.equal(listFiles(join(base, name, 'a')).length, 38, name);
  }
});

test('PROFILE-5: changing one selector changes exactly the pins of the roles that use it', () => {
  const trial = generate('profile-5-trial');
  const one = generate('profile-5-one', variant(pin('opus', SENTINEL.opus)));
  const two = generate('profile-5-two', variant(pin('opus', SENTINEL.sol)));
  const differing = (a: Generated, b: Generated): string[] => listFiles(a.out).filter((f) => a.raw(f) !== b.raw(f));
  const expected = [agentPath('planner'), agentPath('pr-reviewer'), agentPath('reviewer'), 'rstack-sdlc-manifest.json', 'runtime/profiles/trial-v2.json'];
  assert.deepEqual(listFiles(one.out), listFiles(trial.out));
  assert.deepEqual(differing(trial, one), expected);
  assert.deepEqual(differing(one, two), expected);
  for (const role of ['planner', 'reviewer', 'pr-reviewer']) {
    // Pinning adds one frontmatter line and removes the unpinned note; nothing else in the file moves.
    const note = /\n> Model not pinned\.[^\n]*\n/;
    assert.match(trial.raw(agentPath(role)), note);
    assert.equal(one.raw(agentPath(role)), trial.raw(agentPath(role)).replace('\n---\n', `\nmodel: ${SENTINEL.opus}\n---\n`).replace(note, ''), role);
    // Another selector changes that line and no other.
    assert.equal(two.raw(agentPath(role)), one.raw(agentPath(role)).replace(`model: ${SENTINEL.opus}`, `model: ${SENTINEL.sol}`), role);
  }
});

test('PROFILE-6: no production pin is active: the shipped profile leaves every selector unobserved', () => {
  const dir = join(PACKAGE_ROOT, 'profiles');
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  // Version 1 is kept as it was approved; it predates the PR reviewer and names no such role.
  assert.deepEqual(files, ['trial-v1.json', 'trial-v2.json']);
  for (const file of files) {
    const parsed = parseProfile(readFileSync(join(dir, file), 'utf8'), file === 'trial-v1.json' ? profileRoles.filter((r) => r !== 'pr-reviewer') : profileRoles);
    assert.ok(parsed.ok);
    for (const [alias, entry] of Object.entries(parsed.value.catalog)) {
      assert.deepEqual([entry.host_selector, entry.selector_status], [null, 'requires-host-observation'], `${file}: ${alias}`);
    }
  }
  const pkg = generate('profile-6');
  for (const file of listFiles(pkg.out).filter((f) => f.startsWith('.github/'))) assert.doesNotMatch(pkg.raw(file), /^model:/m, file);
  assert.deepEqual([...new Set(Object.values(pkg.manifest.models).map((m) => m.model_key))], ['OMITTED']);
});
