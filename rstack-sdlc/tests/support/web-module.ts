// Loads a module of the dashboard page (plain browser JavaScript) in Node for
// its unit tests. The specifier is built at run time so the typecheck does not
// try to resolve untyped JavaScript; each test declares the shape it uses.

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PACKAGE_ROOT } from './harness.ts';

export async function loadWeb<T>(name: string): Promise<T> {
  return (await import(pathToFileURL(join(PACKAGE_ROOT, 'dashboard', 'web', name)).href)) as T;
}
