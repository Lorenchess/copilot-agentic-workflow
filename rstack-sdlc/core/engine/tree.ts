// Measuring, retaining, and re-creating application file trees.
//
// A tree is measured by reading every file under a directory. Links and
// junctions are refused, not followed, so a tree can only contain bytes that
// are really inside it. A measured tree is retained file by file under
// content identities; any later copy is re-created from those retained
// bytes, never from a directory a role can still write to.

import { lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { TreeFile, TreeManifest } from '../contracts/app.ts';
import { canonicalJson, refOf, sha256Hex } from '../contracts/records.ts';
import { EngineBlock } from './errors.ts';

// Never part of an application tree: dependency and version-control
// directories, and this engine's own run directory.
const IGNORED_DIRS = new Set(['node_modules', '.git', '.rstack']);
const MAX_FILES = 2000;
const MAX_BYTES = 20 * 1024 * 1024;

export type Measured = { ok: true; files: Map<string, Buffer> } | { ok: false; reason: string };

export function measureTree(root: string): Measured {
  const files = new Map<string, Buffer>();
  let total = 0;
  const walk = (dir: string, prefix: string): string | null => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      const rel = prefix ? `${prefix}/${name}` : name;
      const stat = lstatSync(full);
      // Symbolic links and Windows junctions both report as links here.
      if (stat.isSymbolicLink()) return `"${rel}" is a link`;
      if (stat.isDirectory()) {
        if (IGNORED_DIRS.has(name)) continue;
        const problem = walk(full, rel);
        if (problem) return problem;
      } else if (stat.isFile()) {
        if (rel.includes('\\') || rel.includes(':')) return `"${rel}" has an unsupported name`;
        const bytes = readFileSync(full);
        total += bytes.length;
        files.set(rel, bytes);
        if (files.size > MAX_FILES || total > MAX_BYTES) return 'the tree is larger than the limit for a fixture application';
      } else {
        return `"${rel}" is not a regular file`;
      }
    }
    return null;
  };
  let problem: string | null;
  try {
    if (lstatSync(root).isSymbolicLink()) return { ok: false, reason: 'the application directory is a link' };
    problem = walk(root, '');
  } catch (e) {
    return { ok: false, reason: `the application directory cannot be read: ${(e as NodeJS.ErrnoException).code ?? 'error'}` };
  }
  return problem ? { ok: false, reason: problem } : { ok: true, files };
}

export function manifestOf(files: Map<string, Buffer>): TreeManifest {
  const list: TreeFile[] = [...files.entries()]
    .map(([path, bytes]) => ({ path, sha256: sha256Hex(bytes), bytes: bytes.length }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { schema_version: 1, record_type: 'tree', files: list };
}

export function manifestText(manifest: TreeManifest): string {
  return canonicalJson(manifest);
}

export function treeRef(manifest: TreeManifest): string {
  return refOf(manifestText(manifest));
}

// Paths whose content differs between two trees, including paths present in only one.
export function changedPaths(before: TreeManifest, after: TreeManifest): string[] {
  const a = new Map(before.files.map((f) => [f.path, f.sha256]));
  const b = new Map(after.files.map((f) => [f.path, f.sha256]));
  const changed = new Set<string>();
  for (const [path, hash] of a) if (b.get(path) !== hash) changed.add(path);
  for (const path of b.keys()) if (!a.has(path)) changed.add(path);
  return [...changed].sort();
}

export function isUnder(path: string, dir: string): boolean {
  return path.startsWith(`${dir}/`);
}

// Writes a retained tree into a fresh directory. `read` returns the retained
// bytes for a file identity and fails if they are missing or altered.
export function materialize(manifest: TreeManifest, dest: string, read: (sha256: string, path: string) => Buffer): void {
  mkdirSync(dest, { recursive: true });
  if (readdirSync(dest).length > 0) throw new EngineBlock('UNSAFE_PATH', 'a tree can only be written into an empty directory', {});
  for (const file of manifest.files) {
    const target = join(dest, ...file.path.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, read(file.sha256, file.path));
  }
}
