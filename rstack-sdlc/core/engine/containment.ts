// Containment for file paths named by a role. A role may only hand over
// regular files inside its own attempt directory. The path text is checked
// first; then every component is checked on disk, so a link or junction
// anywhere on the way is refused even when its target looks harmless.

import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { join, sep } from 'node:path';

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
export const MAX_FILE_BYTES = 256 * 1024;

export type Contained = { ok: true; bytes: Buffer } | { ok: false; reason: string };

// `rootDir` is the run directory; `baseDir` is the attempt directory inside it.
export function readContained(rootDir: string, baseDir: string, relative: string): Contained {
  if (relative.length === 0 || relative.length > 300) return { ok: false, reason: 'path is empty or too long' };
  if (relative.includes('\\') || relative.includes(':') || relative.startsWith('/')) {
    return { ok: false, reason: 'path must be relative and use forward slashes' };
  }
  const segments = relative.split('/');
  for (const segment of segments) {
    if (!SEGMENT.test(segment) || segment.includes('..')) return { ok: false, reason: `path segment "${segment}" is not allowed` };
  }

  let realBase: string;
  try {
    if (lstatSync(baseDir).isSymbolicLink()) return { ok: false, reason: 'the attempt directory is a link' };
    realBase = realpathSync(baseDir);
    // A link higher up (for example the work directory itself) must not move the attempt out of its run.
    if (!realBase.startsWith(realpathSync(rootDir) + sep)) return { ok: false, reason: 'the attempt directory resolves outside the run' };
  } catch {
    return { ok: false, reason: 'the attempt directory does not exist' };
  }

  let current = baseDir;
  for (let i = 0; i < segments.length; i++) {
    current = join(current, segments[i] as string);
    let stat;
    try {
      stat = lstatSync(current);
    } catch {
      return { ok: false, reason: 'file does not exist' };
    }
    // Symbolic links and Windows junctions both report as links here.
    if (stat.isSymbolicLink()) return { ok: false, reason: `"${segments.slice(0, i + 1).join('/')}" is a link` };
    const last = i === segments.length - 1;
    if (last ? !stat.isFile() : !stat.isDirectory()) return { ok: false, reason: 'path is not a regular file inside directories' };
    if (last && stat.size > MAX_FILE_BYTES) return { ok: false, reason: 'file is too large' };
  }
  // Last line of defence: the resolved location must still be inside the base.
  if (!realpathSync(current).startsWith(realBase + sep)) return { ok: false, reason: 'path resolves outside the attempt directory' };
  return { ok: true, bytes: readFileSync(current) };
}
