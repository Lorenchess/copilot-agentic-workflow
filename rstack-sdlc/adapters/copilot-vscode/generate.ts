// Generates the VS Code Copilot package from explicit inputs: authored core
// content, one profile, one extensions definition, and the engine runtime
// reached from the command entry points. Output is derived: every file names
// its source, and a manifest records source and output hashes. Nothing here
// installs anything.
//
// The package holds three kinds of file:
//   .github/…   agent and Skill templates. They carry install-time
//               placeholders ({{ENGINE}}, {{WORKSPACE}}, {{PROFILE}},
//               {{RUN_ROOT}}) which the installer fills with absolute paths.
//   runtime/…   the engine and installer sources the commands need, copied by
//               following static imports from the entry points. Test
//               adapters, deferred integrations, the evaluator, and this
//               generator are not reached and are not shipped.
//   manifest    identities of the inputs and of every file.
// The runtime is TypeScript run directly by Node; Node is required and is not
// bundled, so the package is not self-contained.
//
// Host syntax used below (file locations, frontmatter keys, tool-set names)
// comes from VS Code documentation read on 2026-10-03, and for the visibility,
// target, and model keys on 2026-10-04. It has not been observed on a host:
// the package is PACKAGE_TESTED at most, never COPILOT_VALIDATED, until the
// smoke procedure is run.
//
// One human entry point: the coordinator is the only agent a user can select.
// The role agents are hidden and are reached only through the coordinator's
// list of names. Skills are kept out of the slash-command menu and stay
// loadable by the model. What the host actually shows, hides, or allows is
// HOST_CONFIRMATION_REQUIRED.

import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { asArray } from '../../core/contracts/planning.ts';
import { parseProfile, sha256Hex } from '../../core/contracts/records.ts';
import { asLiteral, asObject, asOneOf, asString, checkVersion, finish, newIssues, parseJson } from '../../core/contracts/validate.ts';
import { WORKFLOW, dispatchRoles } from '../../core/policies/workflow.ts';
import { type GeneratedFile, INSTALL_TOKENS, PACKAGE_MANIFEST, PREFIX, PackageError } from './install.ts';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const GENERATOR = 'rstack-sdlc/adapters/copilot-vscode/generate.ts';
export const GENERATOR_VERSION = 4;
export const HOST = 'copilot-vscode';
export const EXTENSIONS_SOURCE = 'adapters/copilot-vscode/extensions.json';
// Commands the installed package must be able to run.
export const RUNTIME_ENTRIES = ['scripts/rstack.ts', 'scripts/install-package.ts'];
export { PREFIX };

interface AgentSpec {
  role: string;
  source: string;
  description: string;
  tools: string[];
  worker: boolean;
  skill?: string;
}

// Tool-set names are documented, not observed (capability unknown U8). Role
// agents need a file-editing tool to write into their attempt directory; the
// host is not known to confine that tool to it.
const AGENTS: AgentSpec[] = [
  {
    role: 'coordinator',
    source: 'adapters/copilot-vscode/coordinator.md',
    description: 'Relays between the human, the RSTACK SDLC engine, and role agents. Start here.',
    tools: ['execute', 'read', 'agent'],
    worker: false,
  },
  {
    role: 'planner',
    source: 'core/roles/planner.md',
    description: 'RSTACK SDLC planner: writes intent, specification, and plan records for one task envelope.',
    tools: ['read', 'search', 'edit'],
    worker: true,
    skill: 'planning-records',
  },
  {
    role: 'plan-auditor',
    source: 'core/roles/plan-auditor.md',
    description: 'RSTACK SDLC plan auditor: independently examines one plan and writes an audit record.',
    tools: ['read', 'search', 'edit'],
    worker: true,
    skill: 'planning-records',
  },
  // The tester and developer may run the application's tests in their own copy,
  // so they also get the terminal tool set. The engine's own run is what counts.
  {
    role: 'tester',
    source: 'core/roles/tester.md',
    description: 'RSTACK SDLC tester: writes the controlled proof for one approved specification.',
    tools: ['read', 'search', 'edit', 'execute'],
    worker: true,
    skill: 'application-records',
  },
  {
    role: 'developer',
    source: 'core/roles/developer.md',
    description: 'RSTACK SDLC developer: implements one approved plan in its own copy of the application.',
    tools: ['read', 'search', 'edit', 'execute'],
    worker: true,
    skill: 'application-records',
  },
  {
    role: 'reviewer',
    source: 'core/roles/reviewer.md',
    description: 'RSTACK SDLC reviewer: independently examines one exact candidate and writes a review record.',
    tools: ['read', 'search', 'edit'],
    worker: true,
    skill: 'application-records',
  },
  // The PR reviewer gets the code reviewer's tool sets and no more: it reads
  // retained records and writes its own record. The editing tool is there only
  // for that record. The host is not known to confine it, so the tool set does
  // not prevent a write elsewhere; the engine re-reads everything a proposal
  // relies on by identity and refuses what was altered. It has no terminal, no
  // agent tool, and nothing that could publish.
  {
    role: 'pr-reviewer',
    source: 'core/roles/pr-reviewer.md',
    description: 'RSTACK SDLC PR reviewer: independently decides whether one accepted candidate is ready to submit and writes a PR review record.',
    tools: ['read', 'search', 'edit'],
    worker: true,
    skill: 'application-records',
  },
];

const SKILLS = [
  {
    name: `${PREFIX}planning-records`,
    source: 'core/skills/planning-records/SKILL.md',
    description:
      'Exact formats for RSTACK SDLC planning records (intent.md, spec.md, plan.json, audit.json, dispositions.json). Use when writing or checking any of these files for a task envelope.',
  },
  {
    name: `${PREFIX}application-records`,
    source: 'core/skills/application-records/SKILL.md',
    description:
      'Exact formats for RSTACK SDLC proof and review records (proof.json, review.json, pr-review.json) and the rules the engine applies when it runs the application tests. Use when writing controlled tests, implementing, or reviewing for a task envelope.',
  },
];

// A selector is written only for these states of a catalog entry. The value
// comes from the profile and from nowhere else: no model is named in this file,
// in a role prompt, or in the coordinator's text.
const WRITTEN_SELECTOR_STATUSES: readonly string[] = ['owner-pinned', 'observed'];

// Host rules for the coordinator, placed after its authored text the way the
// role agents get theirs. On this host the model argument of the subagent tool
// outranks a role agent's own model (documented), so the coordinator must
// never use it. Whether the host refuses, ignores, or applies a role's model
// is not known from this text.
const COORDINATOR_LANE = [
  '',
  '## On this host',
  '',
  "A role agent's model is set by its installed agent file, never by you. Invoke each role by its exact name and leave the subagent tool's model argument unset: never choose, pass, substitute, or override a role's model.",
  '',
  "If the host does not run the named role agent as installed, do not retry, do not name another model or agent, do not omit the agent name, and do not do the role's work yourself. When the host's message is about a model or a cost tier, report exactly this:",
  '',
  '```text',
  'RSTACK MODEL REQUIREMENT NOT AVAILABLE',
  'Role: <directive.pending.role>',
  'Required model: <the `model:` value in the frontmatter of that role\'s agent file under `.github/agents/` in the workspace, or "not pinned" if it has none>',
  "Host result: <the host's message, unchanged>",
  '```',
  '',
  'For any other refusal, report the host\'s message unchanged. In both cases the attempt stays pending: tell the human its attempt id and stop. Only the human can settle it, under the abandon rule.',
  '',
].join('\n');

// ---------------------------------------------------------------- extensions

// Optional content, kept apart from the fixed tables above. It can add an
// optional Skill and extra instruction text for named roles. It cannot name
// tools, models, or effort, and it cannot remove an agent, a required Skill,
// or any authored role text: there is no field for any of that.
export interface OptionalSkill {
  id: string;
  source: string;
  description: string;
  roles: string[];
}

export interface Instruction {
  id: string;
  source: string;
  roles: string[];
  purpose: string;
  status: 'active' | 'retired';
  // Why it was retired. Present exactly when the status is retired.
  retired_reason?: string;
}

export interface Extensions {
  schema_version: 1;
  record_type: 'package-extensions';
  optional_skills: OptionalSkill[];
  instructions: Instruction[];
}

const EXT_ID = /^[a-z][a-z0-9-]{0,39}$/;
const SOURCE_PATH = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*\.md$/;
// Written inside single-quoted YAML and inline code: no quote, backtick, or line break.
const PLAIN_TEXT = /^[^'`\r\n]+$/;

export function parseExtensions(text: string): Extensions {
  const issues = newIssues();
  const raw = parseJson(text, issues);
  const o = raw === undefined ? null : asObject(raw, 'extensions', ['schema_version', 'record_type', 'optional_skills', 'instructions'], [], issues);
  const workers = AGENTS.filter((a) => a.worker).map((a) => a.role);
  const allRoles = AGENTS.map((a) => a.role);
  if (o) {
    checkVersion(o.schema_version, 'extensions.schema_version', issues);
    asLiteral(o.record_type, 'extensions.record_type', 'package-extensions', issues);
    const rolesOf = (v: unknown, p: string, allowed: string[]): void => {
      const list = asArray(v, p, issues, 10);
      if (list.length === 0) issues.list.push(`${p}: must name at least one role`);
      list.forEach((r, i) => asOneOf(r, `${p}[${i}]`, allowed, issues));
    };
    const sourceOf = (v: unknown, p: string): void => {
      const source = asString(v, p, issues, { pattern: SOURCE_PATH, max: 200 });
      if (source.split('/').some((s) => s === '.' || s === '..')) issues.list.push(`${p}: must stay inside the package`);
    };
    const ids = new Set<string>();
    const unique = (id: string, p: string): void => {
      if (ids.has(id)) issues.list.push(`${p}: duplicate id "${id}"`);
      ids.add(id);
    };
    asArray(o.optional_skills, 'extensions.optional_skills', issues, 10).forEach((entry, i) => {
      const p = `extensions.optional_skills[${i}]`;
      const e = asObject(entry, p, ['id', 'source', 'description', 'roles'], [], issues);
      if (!e) return;
      const id = asString(e.id, `${p}.id`, issues, { pattern: EXT_ID });
      unique(`skill:${id}`, `${p}.id`);
      if (SKILLS.some((s) => s.name === `${PREFIX}${id}`)) issues.list.push(`${p}.id: "${id}" is a required Skill and cannot be redefined`);
      sourceOf(e.source, `${p}.source`);
      asString(e.description, `${p}.description`, issues, { pattern: PLAIN_TEXT, max: 1024 });
      rolesOf(e.roles, `${p}.roles`, workers);
    });
    asArray(o.instructions, 'extensions.instructions', issues, 20).forEach((entry, i) => {
      const p = `extensions.instructions[${i}]`;
      const e = asObject(entry, p, ['id', 'source', 'roles', 'purpose', 'status'], ['retired_reason'], issues);
      if (!e) return;
      unique(`instruction:${asString(e.id, `${p}.id`, issues, { pattern: EXT_ID })}`, `${p}.id`);
      sourceOf(e.source, `${p}.source`);
      asString(e.purpose, `${p}.purpose`, issues, { pattern: PLAIN_TEXT, max: 300 });
      rolesOf(e.roles, `${p}.roles`, allRoles);
      const status = asOneOf(e.status, `${p}.status`, ['active', 'retired'], issues);
      if (status === 'retired') asString(e.retired_reason, `${p}.retired_reason`, issues, { pattern: PLAIN_TEXT, max: 300 });
      else if (e.retired_reason !== undefined) issues.list.push(`${p}.retired_reason: only a retired instruction has one`);
    });
  }
  const parsed = finish(issues, () => raw as Extensions);
  if (!parsed.ok) {
    throw new PackageError(parsed.code === 'MALFORMED' ? 'INVALID_EXTENSIONS' : parsed.code, 'the extensions definition was rejected', { issues: parsed.issues });
  }
  return parsed.value;
}

// ---------------------------------------------------------------- inputs

function readSource(rel: string): { text: string; sha256: string } {
  const full = resolve(PACKAGE_ROOT, ...rel.split('/'));
  if (!full.startsWith(PACKAGE_ROOT + sep) || !existsSync(full) || !statSync(full).isFile()) {
    throw new PackageError('SOURCE_NOT_FOUND', `source "${rel}" is not a file inside this package`, { source: rel });
  }
  // Line endings are normalized so the output does not depend on checkout settings.
  const text = readFileSync(full, 'utf8').replaceAll('\r\n', '\n');
  return { text, sha256: sha256Hex(text) };
}

// The entry points and every file they import statically, transitively.
// A dynamic import is a deliberately deferred integration and is not followed.
export function runtimeSources(entries: readonly string[] = RUNTIME_ENTRIES): string[] {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const rel = queue.pop() as string;
    if (seen.has(rel)) continue;
    seen.add(rel);
    const { text } = readSource(rel);
    for (const m of text.matchAll(/^\s*(?:import|export)\s[^'"]*?\sfrom\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm)) {
      const spec = (m[1] ?? m[2]) as string;
      if (spec.startsWith('node:')) continue;
      if (!spec.startsWith('.')) throw new PackageError('UNSUPPORTED_RUNTIME_IMPORT', `"${rel}" imports "${spec}", which the package cannot carry`, { source: rel });
      const target = resolve(PACKAGE_ROOT, dirname(rel), spec);
      if (!target.startsWith(PACKAGE_ROOT + sep)) throw new PackageError('UNSUPPORTED_RUNTIME_IMPORT', `"${rel}" imports outside this package`, { source: rel });
      queue.push(relative(PACKAGE_ROOT, target).split(sep).join('/'));
    }
  }
  return [...seen].sort();
}

// ---------------------------------------------------------------- output

export interface PackageManifest {
  schema_version: 2;
  record_type: 'package-manifest';
  generator: string;
  generator_version: number;
  host: string;
  profile: { profile_id: string; profile_version: number; sha256: string; path: string };
  extensions: {
    source: string;
    sha256: string;
    optional_skills: { id: string; source: string; source_sha256: string; roles: string[] }[];
    instructions: { id: string; status: 'active' | 'retired'; source: string; source_sha256: string; roles: string[]; purpose: string; retired_reason: string | null }[];
  };
  engine: { entry: string; installer: string; resolution: 'INSTALL_TIME_ABSOLUTE_PATH' };
  install_tokens: readonly string[];
  // What must already be present where the package is used. Nothing here is bundled.
  runtime_requirements: { node: string; bundled: false; third_party_packages: 'none' };
  validation_status: 'UNVERIFIED_ON_HOST';
  models: Record<string, { alias: string; owner_label: string; selector_status: string; model_key: 'OMITTED' | 'WRITTEN' }>;
  effort: 'host-default (no key written)';
  files: GeneratedFile[];
}

const yamlList = (items: string[]): string => `[${items.map((i) => `'${i}'`).join(', ')}]`;

export interface GenerateOptions {
  profileText: string;
  outDir: string;
  // The extensions definition as text. Defaults to the authored file, which defines none.
  extensionsText?: string;
}

// Writes the package under `outDir`, which must be inside this package (its
// dist/ or a test directory). It replaces only its own output directory.
export function generatePackage(options: GenerateOptions): PackageManifest {
  const outDir = resolve(options.outDir);
  if (!outDir.startsWith(PACKAGE_ROOT + sep)) {
    throw new Error(`refusing to generate outside the package: ${outDir}`);
  }
  const rel = relative(PACKAGE_ROOT, outDir).split(sep);
  if (rel[0] !== 'dist' && !(rel[0] === 'tests' && rel[1] === '.tmp')) {
    throw new Error(`refusing to generate into a source directory: ${outDir}`);
  }

  // Every input is validated before the output directory is touched.
  const parsedProfile = parseProfile(options.profileText, [...new Set([...dispatchRoles(WORKFLOW), ...AGENTS.map((a) => a.role)])]);
  if (!parsedProfile.ok) {
    throw new PackageError(parsedProfile.code === 'MALFORMED' ? 'INVALID_PROFILE' : parsedProfile.code, 'the profile was rejected', { issues: parsedProfile.issues });
  }
  const profile = parsedProfile.value;
  if (profile.host !== HOST) {
    throw new PackageError('UNSUPPORTED_HOST', `this generator targets "${HOST}"; the profile names "${profile.host}"`, { host: profile.host });
  }
  const extensionsText = (options.extensionsText ?? readSource(EXTENSIONS_SOURCE).text).replaceAll('\r\n', '\n');
  const extensions = parseExtensions(extensionsText);
  const optionalSkills = extensions.optional_skills.map((s) => ({ ...s, ...readSource(s.source) }));
  const instructions = extensions.instructions.map((i) => ({ ...i, ...readSource(i.source) }));
  for (const item of [...optionalSkills, ...instructions]) {
    if (item.text.trim().length === 0) throw new PackageError('INVALID_EXTENSIONS', `source "${item.source}" is empty`, { source: item.source });
  }
  const runtime = runtimeSources();
  const nodeRange = (JSON.parse(readSource('package.json').text) as { engines?: { node?: string } }).engines?.node;
  if (!nodeRange) throw new PackageError('SOURCE_NOT_FOUND', 'package.json states no Node version requirement');

  const stamp = `${GENERATOR} v${GENERATOR_VERSION}`;
  const origin = `profile ${profile.profile_id} v${profile.profile_version}`;
  const header = (source: string, sourceHash: string): string =>
    `<!-- GENERATED by ${stamp} from ${source} (sha256:${sourceHash}), ${origin}. Do not edit; edit the source and regenerate. -->`;
  const workers = AGENTS.filter((a) => a.worker).map((a) => `${PREFIX}${a.role}`);

  rmSync(outDir, { recursive: true, force: true });
  const files: GeneratedFile[] = [];
  const models: PackageManifest['models'] = {};
  const emit = (path: string, content: string, kind: GeneratedFile['kind'], source: string, sourceHash: string): void => {
    const full = join(outDir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
    files.push({ path, sha256: sha256Hex(content), kind, source, source_sha256: sourceHash });
  };

  for (const agent of AGENTS) {
    const source = readSource(agent.source);
    const role = profile.roles[agent.role];
    const entry = role ? profile.catalog[role.model_alias] : undefined;
    if (!role || !entry) throw new PackageError('INVALID_PROFILE', `profile has no model entry for role "${agent.role}"`);
    // A selector the profile does not state is never written as if it were
    // pinned: the key is left out and the agent uses the picker's model.
    const selector = WRITTEN_SELECTOR_STATUSES.includes(entry.selector_status) ? entry.host_selector : null;
    models[agent.role] = {
      alias: role.model_alias,
      owner_label: entry.owner_label,
      selector_status: entry.selector_status,
      model_key: selector ? 'WRITTEN' : 'OMITTED',
    };
    const front = [
      '---',
      `name: ${PREFIX}${agent.role}`,
      // Quoted: an unquoted value containing ": " is not valid YAML.
      `description: '${agent.description}'`,
      'target: vscode',
      `tools: ${yamlList(agent.tools)}`,
      // The coordinator is the one agent a user selects, and the only one that
      // may delegate: to the role agents, by name, and to nothing else.
      ...(agent.worker ? ['user-invocable: false'] : [`agents: ${yamlList(workers)}`, 'user-invocable: true']),
      // No agent is offered to other agents. The coordinator reaches the role
      // agents because it names them (documented; not observed).
      'disable-model-invocation: true',
      ...(selector ? [`model: ${selector}`] : []),
      '---',
    ];
    const note = selector
      ? ''
      : `\n> Model not pinned. Intended for this role: ${entry.owner_label} (alias \`${role.model_alias}\`); its host selector has not been observed. Select the model in the picker and record what was used.\n`;
    const optional = optionalSkills
      .filter((s) => s.roles.includes(agent.role))
      .map((s) => `\nOptional procedure: the \`${PREFIX}${s.id}\` Skill. ${s.description}\n`)
      .join('');
    const lane = agent.worker
      ? `\n## On this host\n\nUse the \`${PREFIX}${agent.skill}\` Skill for record formats. Write only inside the attempt directories you were given. This host is not known to confine your file or terminal tools to those directories, so staying inside them is your responsibility.\n${optional}`
      : COORDINATOR_LANE;
    // Only active instructions are written. A retired one stays in the
    // definition, with its reason, and is recorded in the manifest.
    const extra = instructions
      .filter((i) => i.status === 'active' && i.roles.includes(agent.role))
      .map((i) => `\n<!-- instruction ${i.id} from ${i.source} (sha256:${i.sha256}) -->\n${i.text.trim()}\n`)
      .join('');
    emit(
      `.github/agents/${PREFIX}${agent.role}.agent.md`,
      `${front.join('\n')}\n${header(agent.source, source.sha256)}\n${note}\n${source.text}${lane}${extra ? `\n## Additional instructions\n${extra}` : ''}`,
      'agent',
      agent.source,
      source.sha256,
    );
  }

  const skill = (name: string, description: string, source: string, text: string, hash: string): void => {
    // Out of the slash-command menu, still loaded by the model from its
    // description. Automatic loading is never disabled: the roles depend on it.
    const front = ['---', `name: ${name}`, `description: '${description}'`, 'user-invocable: false', '---'];
    emit(`.github/skills/${name}/SKILL.md`, `${front.join('\n')}\n${header(source, hash)}\n\n${text}`, 'skill', source, hash);
  };
  for (const s of SKILLS) {
    const source = readSource(s.source);
    skill(s.name, s.description, s.source, source.text, source.sha256);
  }
  for (const s of optionalSkills) skill(`${PREFIX}${s.id}`, s.description, s.source, s.text, s.sha256);

  // The runtime: sources as authored, at the same relative paths, so every
  // relative import resolves inside the package.
  for (const source of runtime) {
    const { text, sha256 } = readSource(source);
    emit(`runtime/${source}`, text, 'runtime', source, sha256);
  }
  const runtimePackage = `${JSON.stringify({ name: 'rstack-sdlc-runtime', private: true, type: 'module', engines: { node: nodeRange } }, null, 2)}\n`;
  emit('runtime/package.json', runtimePackage, 'runtime', 'package.json', readSource('package.json').sha256);
  const profilePath = `runtime/profiles/${profile.profile_id}-v${profile.profile_version}.json`;
  emit(profilePath, options.profileText, 'profile', 'profile given to the generator', sha256Hex(options.profileText));

  // No emitted file may carry retired text, and only the documented install
  // placeholders may remain for the installer.
  for (const file of files.filter((f) => f.kind === 'agent' || f.kind === 'skill')) {
    const content = readFileSync(join(outDir, file.path), 'utf8');
    for (const retired of instructions.filter((i) => i.status === 'retired')) {
      if (content.includes(retired.text.trim())) {
        throw new PackageError('RETIRED_INSTRUCTION_PRESENT', `retired instruction "${retired.id}" is still present in ${file.path}`, { id: retired.id, path: file.path });
      }
    }
    for (const m of content.matchAll(/\{\{([A-Z_]+)\}\}/g)) {
      if (!(INSTALL_TOKENS as readonly string[]).includes(m[1] as string)) {
        throw new PackageError('UNKNOWN_INSTALL_TOKEN', `${file.path} contains a placeholder the installer does not fill`, { token: m[1] });
      }
    }
  }

  const manifest: PackageManifest = {
    schema_version: 2,
    record_type: 'package-manifest',
    generator: GENERATOR,
    generator_version: GENERATOR_VERSION,
    host: profile.host,
    profile: { profile_id: profile.profile_id, profile_version: profile.profile_version, sha256: sha256Hex(options.profileText), path: profilePath },
    extensions: {
      source: options.extensionsText === undefined ? EXTENSIONS_SOURCE : 'extensions given to the generator',
      sha256: sha256Hex(extensionsText),
      optional_skills: optionalSkills.map((s) => ({ id: s.id, source: s.source, source_sha256: s.sha256, roles: s.roles })),
      instructions: instructions.map((i) => ({
        id: i.id,
        status: i.status,
        source: i.source,
        source_sha256: i.sha256,
        roles: i.roles,
        purpose: i.purpose,
        retired_reason: i.retired_reason ?? null,
      })),
    },
    engine: { entry: 'runtime/scripts/rstack.ts', installer: 'runtime/scripts/install-package.ts', resolution: 'INSTALL_TIME_ABSOLUTE_PATH' },
    install_tokens: INSTALL_TOKENS,
    runtime_requirements: { node: nodeRange, bundled: false, third_party_packages: 'none' },
    validation_status: 'UNVERIFIED_ON_HOST',
    models,
    effort: 'host-default (no key written)',
    files: files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)),
  };
  writeFileSync(join(outDir, PACKAGE_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
