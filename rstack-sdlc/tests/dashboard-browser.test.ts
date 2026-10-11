// The dashboard page in a real browser: entry through the printed URL, the
// landing and run switcher, the Live view (hero, pipeline, vitals, swimlane,
// feed) and the Inspect view, theme switching, live updates without a
// reload, honest motion (one cue per committed event, never a replay, no
// loop except the two allowed), reduced motion, containment at four widths
// in both themes, the tab title and icon, keyboard use, and the report link.
// Evidence class: browser checks against fixture-backed engine states
// (offline; the installed Chrome over the DevTools protocol). Skipped when no
// Chrome is installed; a skip is reported, never counted as a pass.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDashboardServer } from '../dashboard/server.ts';
import { type Browser, type Page, launchChrome } from './support/browser.ts';
import { completeStep, decision, tmpDir } from './support/harness.ts';
import { scenarioRun } from './support/scenarios.ts';

const TOKEN = 'd'.repeat(64);

async function fixture() {
  const workspace = tmpDir('browser');
  const decide = await scenarioRun('plan-decision', 'b-decide', 'RUN-DECIDE', workspace);
  await scenarioRun('completed', 'b-done', 'RUN-DONE', workspace);
  const live = await scenarioRun('awaiting-auditor', 'b-live', 'RUN-LIVE', workspace);
  await scenarioRun('review-rejected', 'b-blocked', 'RUN-BLOCKED', workspace);
  await scenarioRun('implementing', 'b-dev', 'RUN-DEV', workspace);
  const server = await createDashboardServer({ workspace, token: TOKEN, port: 0, pollMs: 50, heartbeatMs: 500 });
  return { workspace, decide, live, server, entry: `${server.url}/?t=${TOKEN}` };
}

// Running animations other than the heartbeat beat, by CSS name or cue id.
const RUNNING = '[...document.getAnimations()].filter((a) => a.playState === "running" && a.id !== "beat").map((a) => a.animationName || a.id)';

// Elements whose content is wider than their box, outside the regions meant to scroll.
const OVERFLOW = `(() => {
  const bad = [];
  for (const el of document.querySelectorAll('#app *')) {
    if (!(el instanceof HTMLElement) || el.closest('.run-list, [role=tabpanel], dialog, .switcher-menu')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.display === 'contents' || cs.textOverflow === 'ellipsis') continue;
    if (el.scrollWidth > el.clientWidth + 1) bad.push(el.tagName.toLowerCase() + '.' + el.className + ' ' + el.scrollWidth + '>' + el.clientWidth);
  }
  return { page: document.documentElement.scrollWidth > innerWidth, bad };
})()`;

const cueCount = (run: string, seq: number) => `(globalThis.rstackMotionLog || []).filter((c) => c.run === ${JSON.stringify(run)} && c.seq === ${seq}).length`;

async function open(page: Page, url: string, ready: string): Promise<void> {
  await page.navigate(url);
  await page.waitFor(ready, 8000);
}

test('dashboard in a browser', async (t) => {
  const browser: Browser | null = await launchChrome();
  if (!browser) {
    t.skip('no Chrome installed; browser checks not run');
    return;
  }
  const f = await fixture();
  // Each cleanup stands alone: the server must stop even if the browser misbehaves, and the other way round.
  t.after(() => f.server.close().catch(() => undefined));
  t.after(() => browser.close().catch(() => undefined));

  await t.test('the entry URL sets the cookie and lands on every run; a run that needs you opens in Live with the engine\'s actions', async () => {
    const page = await browser.page();
    await page.navigate(f.entry);
    assert.equal(await page.evaluate<string>('location.pathname + location.search'), '/', 'the token is removed from the URL');
    await page.waitFor('document.querySelectorAll(".fleet [data-switch]").length === 5', 8000);
    assert.equal(await page.evaluate<number>('document.querySelectorAll(".switcher-menu [data-switch]").length'), 5);
    assert.equal(await page.evaluate<string>('document.title'), '(1) Needs you · RSTACK Mission Control');
    assert.equal(await page.evaluate<string>('document.querySelector("link[rel=icon]").dataset.icon'), 'amber');
    await page.click('.fleet [data-switch="RUN-DECIDE"]');
    await page.waitFor('document.querySelector("[data-hero=human]")');
    const hero = (await page.text('[data-testid=hero]')) ?? '';
    assert.match(hero, /Your plan decision is needed/);
    assert.match(hero, /Decide in the Coordinator chat/);
    assert.deepEqual(await page.evaluate<string[]>('[...document.querySelectorAll("[data-testid=hero] .action")].map((a) => a.textContent)'), ['proceed', 'amend', 'second-audit', 'pause', 'reject']);
    assert.match((await page.text('[data-testid=run-status]')) ?? '', /Waiting for you/);
    assert.equal(await page.evaluate<string>('location.hash'), '#run=RUN-DECIDE');
    // Inspect keeps the full decision band, with the exact command the Coordinator uses.
    await page.click('[data-mode=inspect]');
    await page.waitFor('document.querySelector("[data-testid=human-band]")');
    const band = (await page.text('[data-testid=human-band]')) ?? '';
    assert.match(band, /A decision from you is needed/);
    assert.match(band, /decide --action <action> --expected-version/);
    assert.deepEqual(await page.evaluate<string[]>('[...document.querySelectorAll("[data-testid=human-band] .action")].map((a) => a.textContent)'), ['proceed', 'amend', 'second-audit', 'pause', 'reject']);
    assert.equal(await page.evaluate<string>('location.hash'), '#run=RUN-DECIDE&mode=inspect');
    assert.deepEqual(page.errors(), []);
    await page.close();
  });

  await t.test('theme switching is persisted locally and changes nothing about the run', async () => {
    const page = await browser.page();
    await open(page, `${f.entry}#run=RUN-DECIDE`, 'document.querySelector("[data-testid=synced]")');
    const synced = await page.text('[data-testid=synced]');
    const lightBg = await page.evaluate<string>('getComputedStyle(document.body).backgroundColor');
    await page.click('[data-theme-choice=dark]');
    await page.waitFor('document.documentElement.dataset.theme === "dark"');
    const darkBg = await page.evaluate<string>('getComputedStyle(document.body).backgroundColor');
    assert.notEqual(darkBg, lightBg);
    assert.equal(darkBg, 'rgb(7, 11, 22)');
    assert.equal(await page.evaluate<string>('localStorage.getItem("rstack-dash-theme")'), 'dark');
    assert.equal(await page.text('[data-testid=synced]'), synced, 'the journal version did not move');
    await page.navigate(`${f.entry}#run=RUN-DECIDE`);
    await page.waitFor('document.documentElement.dataset.theme === "dark"');
    await page.click('[data-theme-choice=system]');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitFor('getComputedStyle(document.body).backgroundColor === "rgb(244, 246, 251)"');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitFor('getComputedStyle(document.body).backgroundColor === "rgb(7, 11, 22)"');
    await page.close();
  });

  await t.test('a stage card opens Inspect with its records; the keyboard reaches cards, the mode toggle, and the tabs', async () => {
    const page = await browser.page();
    await open(page, `${f.entry}#run=RUN-DECIDE`, 'document.querySelector("[data-testid=live] .card[data-stage=plan-audit]")');
    assert.match(await page.evaluate<string>('document.querySelector("[data-testid=live] .card[data-stage=plan-decision]").getAttribute("aria-label")'), /Waiting for a human \(current stage\)/);
    await page.click('[data-testid=live] .card[data-stage=plan-audit]');
    await page.waitFor('document.querySelector("[data-testid=stage-detail]")');
    const detail = (await page.text('[data-testid=stage-detail]')) ?? '';
    assert.match(detail, /Stage: Plan audit/);
    assert.match(detail, /plan-audit-1/);
    assert.match(detail, /HOLDS/);
    assert.equal(await page.evaluate<string>('location.hash'), '#run=RUN-DECIDE&mode=inspect&stage=plan-audit');
    await page.evaluate('document.getElementById("tab-timeline").focus()');
    await page.press('ArrowRight');
    await page.waitFor('document.querySelector("[role=tab][aria-selected=true]").dataset.tab === "attempts"');
    assert.equal(await page.evaluate<string>('document.activeElement.dataset.tab'), 'attempts');
    // Back to Live with the keyboard, then into Inspect again from a focused card.
    await page.evaluate('document.querySelector("[data-mode=live]").focus()');
    await page.press('Enter');
    await page.waitFor('document.querySelector("[data-testid=live]")');
    await page.evaluate('document.querySelector("[data-testid=live] .card[data-stage=intent]").focus()');
    await page.press('Enter');
    await page.waitFor('(() => { const p = new URLSearchParams(location.hash.slice(1)); return p.get("mode") === "inspect" && p.get("stage") === "intent"; })()');
    assert.match((await page.text('[data-testid=stage-detail]')) ?? '', /Stage: Intake/);
    assert.deepEqual(page.errors(), []);
    await page.close();
  });

  await t.test('a committed event reaches the page without a reload and plays exactly one cue, never replayed', async () => {
    const page = await browser.page();
    await open(page, `${f.entry}#run=RUN-LIVE`, 'document.querySelector("[data-testid=live] .card")');
    await page.waitFor('document.querySelector("[data-testid=connection]").textContent === "Live"', 8000);
    // run_started, three dispatch/accept pairs, the auditor's dispatch: eight committed records.
    assert.match((await page.text('[data-testid=synced]')) ?? '', /journal v8/);
    assert.equal(await page.evaluate<string>('document.querySelector("[data-stage=plan-audit]").dataset.state'), 'DISPATCHED_AWAITING_RESULT');
    assert.equal(await page.evaluate<number>(cueCount('RUN-LIVE', 8)), 0, 'opening a run animates nothing already committed');
    completeStep(f.live); // the auditor's result is accepted by the engine: v9
    // Truth first: the accepted state is shown while its cue is still playing.
    await page.waitFor('document.querySelector("[data-stage=plan-audit]").dataset.state === "COMPLETED" && document.getAnimations().some((a) => a.id === "cue:settle:9")', 6000);
    assert.equal(await page.evaluate<number>(cueCount('RUN-LIVE', 9)), 1);
    // Re-renders, a mode round trip, and switching runs away and back replay nothing.
    await page.click('[data-theme-choice=dark]');
    await page.click('[data-mode=inspect]');
    await page.waitFor('document.querySelector("[data-testid=stage-detail], [role=tabpanel]")');
    await page.click('[data-mode=live]');
    await page.evaluate('location.hash = "#run=RUN-DONE"');
    await page.waitFor('document.querySelector("[data-hero=done]")');
    await page.evaluate('location.hash = "#run=RUN-LIVE"');
    await page.waitFor('document.querySelector("[data-testid=live][data-run=RUN-LIVE] .card")');
    await new Promise((r) => setTimeout(r, 600));
    assert.equal(await page.evaluate<number>(cueCount('RUN-LIVE', 9)), 1, 'no replay after re-render, mode switch, or run switch');
    assert.equal(f.live.assembly.engine.next(f.live.runId).code, 'BRIEF_READY'); // v10, the wait begins
    await page.waitFor('document.querySelector("[data-hero=human]")', 6000);
    await page.waitFor(`${cueCount('RUN-LIVE', 10)} === 1`, 4000);
    assert.ok(await page.evaluate<boolean>('(globalThis.rstackMotionLog || []).some((c) => c.run === "RUN-LIVE" && c.seq === 10 && c.kind === "needs-you")'));
    assert.equal(await page.evaluate<string>('document.title'), '(2) Needs you · RSTACK Mission Control');
    // Pausing holds the view; resuming catches up with only the newest cue and says what was missed.
    await page.click('[data-testid=pause]');
    await page.waitFor('document.querySelector("[data-testid=connection]").textContent.startsWith("Paused")');
    assert.equal(f.live.assembly.engine.decide(f.live.runId, decision(f.live.assembly.engine.status(f.live.runId), { action: 'pause' })).code, 'DECISION_RECORDED'); // v11
    await new Promise((r) => setTimeout(r, 700));
    assert.match((await page.text('[data-testid=synced]')) ?? '', /journal v10/, 'paused: the earlier version is still shown');
    assert.match((await page.text('[data-testid=connection]')) ?? '', /1 run\(s\) changed/);
    await page.click('[data-testid=pause]');
    await page.waitFor('document.querySelector("[data-testid=synced]").textContent.includes("journal v11")', 6000);
    assert.match((await page.text('[data-testid=hero]')) ?? '', /Paused: your decision is still needed/);
    await page.waitFor('!document.querySelector(".away").hidden', 4000);
    assert.match((await page.text('.away')) ?? '', /1 event while you were away/);
    assert.ok((await page.evaluate<number>(cueCount('RUN-LIVE', 11))) <= 1);
    assert.deepEqual(page.errors(), []);
    await page.close();
  });

  await t.test('blocked and finished runs sit still; a dispatch breathes and a wait for you pulses, nothing else loops', async () => {
    const page = await browser.page();
    for (const run of ['RUN-BLOCKED', 'RUN-DONE']) {
      await open(page, `${f.entry}#run=${run}`, 'document.querySelector("[data-testid=live] .card")');
      await new Promise((r) => setTimeout(r, 800));
      assert.deepEqual(await page.evaluate<string[]>(RUNNING), [], `${run}: nothing animates`);
    }
    await open(page, `${f.entry}#run=RUN-DEV`, 'document.querySelector("[data-hero=dispatched]")');
    const dev = await page.evaluate<string[]>(RUNNING);
    assert.ok(dev.length > 0 && dev.every((n) => n === 'breathe'), `only the breathing glow loops while a dispatch awaits its result: ${dev.join(', ')}`);
    await open(page, `${f.entry}#run=RUN-DECIDE`, 'document.querySelector("[data-hero=human]")');
    const human = await page.evaluate<string[]>(RUNNING);
    assert.ok(human.length > 0 && human.every((n) => n === 'attn'), `only the amber pulse loops while a human is needed: ${human.join(', ')}`);
    await page.close();
  });

  await t.test('heroes say what the engine knows, and never that an agent is at work; the completed run links to its report', async () => {
    const page = await browser.page();
    const heroes: [string, string, RegExp][] = [
      ['RUN-DEV', 'dispatched', /Waiting on the Developer.*Dispatched · awaiting result.*effective model not observed/s],
      ['RUN-BLOCKED', 'blocked', /Blocked at Technical review.*REVIEW_REJECTED.*No recovery path is recorded; a fix needs a new run/s],
      ['RUN-DONE', 'done', /Local PR proposal ready.*Not published: no remote pull request was created/s],
      ['RUN-DECIDE', 'human', /Your plan decision is needed.*Waiting for you/s],
    ];
    for (const [run, hero, words] of heroes) {
      await open(page, `${f.entry}#run=${run}`, `document.querySelector("[data-hero=${hero}]")`);
      assert.match((await page.text('[data-testid=hero]')) ?? '', words, run);
      assert.doesNotMatch(await page.evaluate<string>('document.querySelector("[data-testid=live]").innerText'), /\b(working|thinking|running)\b/i, `${run}: no claim that an agent is at work`);
    }
    await open(page, `${f.entry}#run=RUN-DONE`, 'document.querySelector("[data-testid=report-link]")');
    const href = await page.evaluate<string>('document.querySelector("[data-testid=report-link]").getAttribute("href")');
    assert.equal(href, '/api/v1/runs/RUN-DONE/report');
    const report = await page.evaluate<{ status: number; text: string }>(`fetch(${JSON.stringify(href)}).then(async (r) => ({ status: r.status, text: await r.text() }))`);
    assert.equal(report.status, 200);
    assert.match(report.text, /Local PR proposal prepared/);
    await open(page, `${f.entry}#run=RUN-DONE&mode=inspect`, 'document.querySelector("[data-testid=done-band]")');
    assert.match((await page.text('[data-testid=done-band]')) ?? '', /NOT_ATTEMPTED/);
    await open(page, `${f.entry}#run=RUN-BLOCKED`, 'document.querySelector("[data-hero=blocked]")');
    assert.equal(await page.evaluate<string>('document.querySelector("[data-stage=review]").dataset.state'), 'BLOCKED');
    assert.deepEqual(page.errors(), []);
    await page.close();
  });

  await t.test('content stays inside its container at 1024, 1280, 1440 and 1920 px in both themes; narrow widths list the stages', async () => {
    const page = await browser.page();
    const views = ['#run=RUN-DEV', '#run=RUN-DECIDE', '#run=RUN-BLOCKED', '#run=RUN-DECIDE&mode=inspect', '#'];
    for (const [width, themes] of [[1024, ['light', 'dark']], [1280, ['dark']], [1440, ['light']], [1920, ['light', 'dark']]] as const) {
      await page.setViewport(width, 900);
      for (const theme of themes) {
        await page.emulateMedia({ colorScheme: theme });
        for (const view of views) {
          await open(page, `${f.entry}${view}`, 'document.querySelector("[data-testid=live] .card, [data-testid=human-band], .fleet .tile")');
          await new Promise((r) => setTimeout(r, 250));
          const r = await page.evaluate<{ page: boolean; bad: string[] }>(OVERFLOW);
          assert.deepEqual(r, { page: false, bad: [] }, `${width}px ${theme} ${view}`);
        }
      }
    }
    await page.setViewport(1440, 900);
    await open(page, `${f.entry}#run=RUN-DEV`, 'document.querySelector("[data-testid=live] .card")');
    await page.waitFor('getComputedStyle(document.querySelector(".flow")).getPropertyValue("--cols").trim() === "7"');
    await page.setViewport(600, 1000);
    await page.waitFor('document.querySelector(".flow.list")');
    assert.ok((await page.evaluate<number>('document.documentElement.scrollWidth')) <= 600, 'no horizontal page overflow');
    await page.close();
  });

  await t.test('reduced motion: nothing moves; an event is marked with a still outline instead', async () => {
    const page = await browser.page();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, `${f.entry}#run=RUN-DEV`, 'document.querySelector("[data-hero=dispatched]")');
    assert.deepEqual(await page.evaluate<string[]>(RUNNING), [], 'no loop under reduced motion');
    await open(page, `${f.entry}#run=RUN-LIVE`, 'document.querySelector("[data-hero=human]")');
    await page.waitFor('document.querySelector("[data-testid=connection]").textContent === "Live"', 8000);
    const status = f.live.assembly.engine.status(f.live.runId);
    assert.equal(f.live.assembly.engine.decide(f.live.runId, decision(status, { decision_id: 'D2' })).code, 'DECISION_RECORDED'); // v12
    await page.waitFor(`${cueCount('RUN-LIVE', 12)} === 1`, 6000);
    assert.equal(await page.evaluate<boolean>('globalThis.rstackMotionLog.at(-1).reduced'), true);
    assert.deepEqual(await page.evaluate<string[]>(RUNNING), [], 'the cue is a still outline, not an animation');
    assert.deepEqual(page.errors(), []);
    await page.close();
  });
});
