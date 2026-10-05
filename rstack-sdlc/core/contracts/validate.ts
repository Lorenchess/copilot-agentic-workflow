// Runtime input validation primitives. TypeScript types describe accepted
// values; these functions are what actually rejects malformed input.

export const SCHEMA_VERSION = 1;

export type Parsed<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'MALFORMED' | 'UNSUPPORTED_SCHEMA_VERSION'; issues: string[] };

export interface Issues {
  list: string[];
  unsupportedVersion: boolean;
}

export function newIssues(): Issues {
  return { list: [], unsupportedVersion: false };
}

export function finish<T>(issues: Issues, value: () => T): Parsed<T> {
  if (issues.unsupportedVersion) {
    return { ok: false, code: 'UNSUPPORTED_SCHEMA_VERSION', issues: issues.list };
  }
  if (issues.list.length > 0) return { ok: false, code: 'MALFORMED', issues: issues.list };
  return { ok: true, value: value() };
}

export function parseJson(text: string, issues: Issues): unknown {
  try {
    return JSON.parse(text);
  } catch {
    issues.list.push('input is not valid JSON');
    return undefined;
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Returns the object only when it is a plain object with exactly the allowed
// keys. Unknown keys are rejected rather than ignored.
export function asObject(
  v: unknown,
  path: string,
  required: readonly string[],
  optional: readonly string[],
  issues: Issues,
): Record<string, unknown> | null {
  if (!isPlainObject(v)) {
    issues.list.push(`${path}: expected an object`);
    return null;
  }
  for (const key of required) {
    if (!Object.hasOwn(v, key)) issues.list.push(`${path}.${key}: missing`);
  }
  for (const key of Object.keys(v)) {
    if (!required.includes(key) && !optional.includes(key)) {
      issues.list.push(`${path}.${key}: unknown field`);
    }
  }
  return v;
}

// A record map with caller-validated values and pattern-checked keys.
export function asMap(
  v: unknown,
  path: string,
  keyPattern: RegExp,
  issues: Issues,
): Record<string, unknown> | null {
  if (!isPlainObject(v)) {
    issues.list.push(`${path}: expected an object`);
    return null;
  }
  for (const key of Object.keys(v)) {
    if (!keyPattern.test(key)) issues.list.push(`${path}.${key}: invalid key`);
  }
  return v;
}

export function checkVersion(v: unknown, path: string, issues: Issues): void {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
    issues.list.push(`${path}: expected a positive integer schema version`);
    return;
  }
  if (v !== SCHEMA_VERSION) {
    issues.unsupportedVersion = true;
    issues.list.push(`${path}: schema version ${v} is not supported (supported: ${SCHEMA_VERSION})`);
  }
}

export function asString(
  v: unknown,
  path: string,
  issues: Issues,
  opts: { max?: number; pattern?: RegExp; allowEmpty?: boolean } = {},
): string {
  if (typeof v !== 'string') {
    issues.list.push(`${path}: expected a string`);
    return '';
  }
  if (!opts.allowEmpty && v.length === 0) issues.list.push(`${path}: must not be empty`);
  if (opts.max !== undefined && v.length > opts.max) {
    issues.list.push(`${path}: longer than ${opts.max} characters`);
  }
  if (opts.pattern && !opts.pattern.test(v)) issues.list.push(`${path}: invalid format`);
  return v;
}

export function asInt(v: unknown, path: string, min: number, max: number, issues: Issues): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    issues.list.push(`${path}: expected an integer from ${min} to ${max}`);
    return min;
  }
  return v;
}

export function asOneOf<T extends string>(
  v: unknown,
  path: string,
  allowed: readonly T[],
  issues: Issues,
): T {
  if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
    issues.list.push(`${path}: expected one of ${allowed.join(', ')}`);
    return allowed[0] as T;
  }
  return v as T;
}

export function asLiteral(v: unknown, path: string, expected: string, issues: Issues): void {
  if (v !== expected) issues.list.push(`${path}: expected "${expected}"`);
}
