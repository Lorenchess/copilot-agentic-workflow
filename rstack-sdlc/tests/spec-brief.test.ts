// Specification syntax and what the human brief shows of it. Evidence class:
// contract and engine tests (offline). The decision approves the specification
// by hash, so everything the parser accepts must reach the brief and
// everything else must be refused, not dropped.

import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { HOSTILE } from '../adapters/fake-transport/index.ts';
import { parseSpec } from '../core/contracts/planning.ts';
import { refOf } from '../core/contracts/records.ts';
import { esc } from '../core/engine/brief.ts';
import type { Reply } from '../core/engine/engine.ts';
import { type TestRun, auditAndBrief, completeStep, newRun, pendingOf, result, toHumanWait } from './support/harness.ts';

type Wait = Extract<Reply['directive'], { kind: 'WAIT' }>;
const wait = (r: Reply): Wait => {
  assert.equal(r.directive?.kind, 'WAIT');
  return r.directive as Wait;
};

const VALID = ['# Specification: pause exports', 'Intent: answers the retained intent', 'AC-1: first behavior', 'AC-2: second behavior', ''];
const spec = (...lines: string[]): string => lines.join('\n');
const issuesOf = (text: string): string => {
  const parsed = parseSpec(text);
  assert.equal(parsed.ok, false, 'expected the specification to be refused');
  return parsed.ok ? '' : parsed.issues.join('\n');
};
// VALID with one line placed after the given line number (1-based).
const withLine = (after: number, ...extra: string[]): string => spec(...VALID.slice(0, after), ...extra, ...VALID.slice(after));

test('D5: a valid specification parses into intent, criteria, and exclusions, with continuation text kept', () => {
  const parsed = parseSpec(
    spec(
      '# Specification: pause exports',
      'Intent: answers the retained intent',
      '  and its owner answer',
      '',
      'AC-1: first behavior',
      'continued on a second line',
      'AC-2: second behavior',
      '',
      'Exclusion: no new identity provider',
      'or network integration',
      'Exclusion: no change to authentication',
      '',
    ),
  );
  assert.ok(parsed.ok, parsed.ok ? '' : parsed.issues.join('; '));
  assert.deepEqual(parsed.value, {
    title: 'pause exports',
    intent: 'answers the retained intent and its owner answer',
    criteria: [
      { id: 'AC-1', text: 'first behavior continued on a second line' },
      { id: 'AC-2', text: 'second behavior' },
    ],
    exclusions: ['no new identity provider or network integration', 'no change to authentication'],
  });
  const plain = parseSpec(spec(...VALID));
  assert.ok(plain.ok);
  assert.deepEqual(plain.value.exclusions, []);
  assert.ok(parseSpec(spec(...VALID).replaceAll('\n', '\r\n')).ok, 'line endings do not matter');
});

test('D5: an unknown label is refused, wherever it stands', () => {
  assert.match(issuesOf(withLine(3, 'Note: AC-1 does not apply to admin users')), /line 4: not an accepted item/);
  assert.match(issuesOf(withLine(4, 'Assumption: the flag exists')), /line 5: not an accepted item/);
  assert.match(issuesOf(withLine(4, '', 'Note: after a blank line')), /line 6: not an accepted item/);
  assert.match(issuesOf(withLine(1, 'Exclusions: plural is not the label')), /line 2: not an accepted item/);
});

test('D5: a malformed or bulleted criterion is refused, not merged into its neighbour', () => {
  for (const line of ['- AC-3: bulleted', '* AC-3: bulleted', '  AC-3: indented', '1. AC-3: numbered', 'AC-3:no space', 'AC-3: ', 'AC-1234: too many digits', 'ac-3 without a label', '## AC-3: heading', '| AC-3 | table |', '```']) {
    const text = withLine(3, line);
    if (line === 'ac-3 without a label') {
      // Plain text directly under an item is that item's continuation, and is kept as such.
      const parsed = parseSpec(text);
      assert.ok(parsed.ok);
      assert.equal(parsed.value.criteria[0]?.text, 'first behavior ac-3 without a label');
      continue;
    }
    assert.match(issuesOf(text), /line 4: not an accepted item/, line);
  }
  assert.match(issuesOf(withLine(4, 'AC-1: again')), /AC-1 appears twice/);
});

test('D5: a second Intent, an empty item, and text that belongs to no item are refused', () => {
  assert.match(issuesOf(withLine(4, 'Intent: another one')), /line 5: "Intent:" appears twice/);
  assert.match(issuesOf(spec('# Specification: t', 'Intent:', 'AC-1: x')), /"Intent:" is empty/);
  assert.match(issuesOf(withLine(4, 'Exclusion:')), /line 5: "Exclusion:" is empty/);
  assert.match(issuesOf(spec('# Specification: t', 'AC-1: x')), /an "Intent:" line is required/);
  assert.match(issuesOf(spec('# Specification: t', 'Intent: i')), /at least one acceptance criterion/);
  // Text before the first item, and text after a blank line, continue nothing.
  assert.match(issuesOf(withLine(1, 'some preamble')), /line 2: text that belongs to no item/);
  assert.match(issuesOf(withLine(4, '', 'a paragraph on its own')), /line 6: text that belongs to no item/);
  // Text after a refused line is not attached to the item before it.
  assert.match(issuesOf(withLine(3, 'Note: x', 'trailing text')), /line 5: text that belongs to no item/);
});

test('D5: the synthetic fixture specification is read as before, and its exclusion is now kept', async () => {
  const run = await newRun('spec-fixture');
  const waiting = toHumanWait(run);
  const text = readFileSync(join(run.runDir, 'work', 'spec-1', 'spec.md'), 'utf8');
  assert.equal(wait(waiting).subjects.spec, refOf(text), 'the specification is still identified by the hash of its bytes');
  const parsed = parseSpec(text);
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value, {
    title: 'pause exports',
    intent: 'SIMULATED, from the retained intent.',
    criteria: [
      { id: 'AC-1', text: 'An authorized request while exports are disabled returns 503 with code EXPORTS_DISABLED and invokes the exporter zero times.' },
      { id: 'AC-2', text: 'An authorized request while enabled preserves existing export behavior.' },
      { id: 'AC-3', text: 'An unauthorized request invokes the exporter zero times in either mode.' },
    ],
    exclusions: ['No new identity provider or network integration.'],
  });
  const html = readFileSync(join(run.runDir, wait(waiting).read as string), 'utf8');
  assert.ok(html.includes('<p>Intent: SIMULATED, from the retained intent.</p>'));
  for (const c of parsed.value.criteria) assert.ok(html.includes(`<td>${c.id}</td><td>${esc(c.text)}</td>`), c.id);
  assert.ok(html.includes('<li>No new identity provider or network integration.</li>'));
});

// Replaces the specification the fake planner wrote for the pending attempt.
function submitSpec(run: TestRun, text: string): Reply {
  const envelope = pendingOf(run.assembly.engine.next(run.runId));
  assert.equal(envelope.step_id, 'spec');
  const raw = result(envelope);
  writeFileSync(join(run.runDir, envelope.work_dir, 'spec.md'), text);
  return run.assembly.engine.submit(run.runId, raw);
}

test('D5: the engine refuses a specification with content the brief could not show', async () => {
  const run = await newRun('spec-refused');
  completeStep(run);
  const reply = submitSpec(run, spec('# Specification: pause exports', 'Intent: i', 'AC-1: x', 'Note: AC-1 does not apply to admin users', ''));
  assert.equal(reply.ok, false);
  assert.equal(reply.code, 'CONTRACT_VIOLATION');
  assert.match(JSON.stringify(reply.detail), /line 4: not an accepted item/);
  assert.equal(run.assembly.engine.status(run.runId).stage, 'spec', 'the run did not advance');
});

test('D5: the brief shows every accepted item of the specification, escaped, and nothing executable', async () => {
  const run = await newRun('spec-brief');
  completeStep(run);
  const text = spec(
    '# Specification: pause exports',
    `Intent: the retained intent ${HOSTILE}`,
    'with a second intent line',
    'AC-1: disabled exports return 503',
    `and invoke the exporter zero times ${HOSTILE}`,
    'AC-2: enabled exports behave as before',
    'AC-3: unauthorized requests never reach the exporter',
    '',
    `Exclusion: no new identity provider ${HOSTILE}`,
    'and no network integration',
    'Exclusion: no change to authentication',
    '',
  );
  const accepted = submitSpec(run, text);
  assert.equal(accepted.code, 'ACCEPTED', JSON.stringify(accepted));
  completeStep(run);
  const waiting = auditAndBrief(run);
  assert.equal(wait(waiting).subjects.spec, refOf(text), 'the decision is bound to the exact bytes submitted');

  const parsed = parseSpec(text);
  assert.ok(parsed.ok);
  const html = readFileSync(join(run.runDir, wait(waiting).read as string), 'utf8');
  assert.ok(html.includes(`<p>Intent: ${esc(parsed.value.intent)}</p>`), 'intent with its continuation');
  assert.equal(parsed.value.criteria.length, 3);
  for (const c of parsed.value.criteria) assert.ok(html.includes(`<td>${c.id}</td><td>${esc(c.text)}</td>`), c.id);
  assert.equal(parsed.value.exclusions.length, 2);
  for (const x of parsed.value.exclusions) assert.ok(html.includes(`<li>${esc(x)}</li>`), x);

  // Every non-empty line of the file after the title is in the page, as escaped text.
  for (const line of text.split('\n').slice(1).filter((l) => l.trim())) {
    const body = line.replace(/^(Intent|Exclusion|AC-[0-9]+):/, '').trim();
    assert.ok(html.includes(esc(body)), `shown: ${line}`);
  }

  assert.ok(!html.includes('<script') && !html.includes('<img'), 'the payload is never markup');
  assert.match(html, /<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">/);
  const allowed = new Set(['!doctype', 'html', 'head', 'meta', 'title', 'style', 'body', 'h1', 'h2', 'h3', 'p', 'strong', 'table', 'tr', 'th', 'td', 'ul', 'li']);
  const attributes = new Set(['lang', 'charset', 'http-equiv', 'content', 'class']);
  for (const tag of html.matchAll(/<\/?([^\s>/]+)([^>]*)>/g)) {
    assert.ok(allowed.has((tag[1] as string).toLowerCase()), `unexpected element <${tag[1]}>`);
    if (tag[1] === '!doctype') continue;
    for (const attr of (tag[2] as string).matchAll(/([a-zA-Z-]+)\s*=/g)) {
      assert.ok(attributes.has((attr[1] as string).toLowerCase()), `unexpected attribute ${attr[1]} on <${tag[1]}>`);
    }
  }
});
