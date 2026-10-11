// The dashboard page in a real browser: entry through the printed URL, run
// selection, the human-wait band, stage expansion, theme switching, live
// updates without a reload, keyboard navigation, responsive layout, and the
// report link. Evidence class: browser checks against fixture-backed engine
// states (offline; the installed Chrome over the DevTools protocol). Skipped
// when no Chrome is installed; a skip is reported, never counted as a pass.

import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createDashboardServer } from '../dashboard/server.ts';
import { type Browser, launchChrome } from './support/browser.ts';
import { completeStep, decision, tmpDir } from './support/harness.ts';
import { scenarioRun } from './support/scenarios.ts';

const TOKEN = 'd'.repeat(64);

async function fixture() {
  const workspace = tmpDir('browser');
  const decide = await scenarioRun('plan-decision', 'b-decide', 'RUN-DECIDE', workspace);
  await scenarioRun('completed', 'b-done', 'RUN-DONE', workspace);
  const live = await scenarioRun('awaiting-auditor', 'b-live', 'RUN-LIVE', workspace);
  await scenarioRun('review-rejected', 'b-blocked', 'RUN-BLOCKED', workspace);
  const server = await createDashboardServer({ workspace, token: TOKEN, port: 0, pollMs: 50, heartbeatMs: 500 });
  const shots = join(workspace, 'shots');
  mkdirSync(shots, { recursive: true });
  return { workspace, decide, live, server, shots, entry: `${server.url}/?t=${TOKEN}` };
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

  await t.test('the entry URL sets the cookie and lists every run; a waiting run shows the human band with the engine\'s actions', async () => {
    const page = await browser.page();
    await page.navigate(f.entry);
    assert.equal(await page.evaluate<string>('location.pathname + location.search'), '/', 'the token is removed from the URL');
    await page.waitFor('document.querySelectorAll("[data-run]").length === 4');
    await page.click('[data-run="RUN-DECIDE"]');
    await page.waitFor('document.querySelector("[data-testid=human-band]")');
    const band = await page.text('[data-testid=human-band]');
    assert.match(band ?? '', /A decision from you is needed/);
    assert.match(band ?? '', /decide --action <action> --expected-version/);
    const actions = await page.evaluate<string[]>('[...document.querySelectorAll("[data-testid=human-band] .action")].map((a) => a.textContent)');
    assert.deepEqual(actions, ['proceed', 'amend', 'second-audit', 'pause', 'reject']);
    assert.match((await page.text('[data-testid=run-status]')) ?? '', /Waiting for you/);
    assert.equal(await page.evaluate<string>('location.hash'), '#run=RUN-DECIDE');
    assert.deepEqual(page.errors(), []);
    await page.screenshot(join(f.shots, 'decision-light.png'));
    await page.close();
  });

  await t.test('theme switching is persisted locally and changes nothing about the run', async () => {
    const page = await browser.page();
    await page.navigate(`${f.entry}#run=RUN-DECIDE`);
    await page.waitFor('document.querySelector("[data-testid=synced]")');
    const synced = await page.text('[data-testid=synced]');
    const lightBg = await page.evaluate<string>('getComputedStyle(document.body).backgroundColor');
    await page.click('[data-theme-choice=dark]');
    await page.waitFor('document.documentElement.dataset.theme === "dark"');
    const darkBg = await page.evaluate<string>('getComputedStyle(document.body).backgroundColor');
    assert.notEqual(darkBg, lightBg);
    assert.equal(await page.evaluate<string>('localStorage.getItem("rstack-dash-theme")'), 'dark');
    assert.equal(await page.text('[data-testid=synced]'), synced, 'the journal version did not move');
    await page.screenshot(join(f.shots, 'decision-dark.png'));
    await page.navigate(`${f.entry}#run=RUN-DECIDE`);
    await page.waitFor('document.documentElement.dataset.theme === "dark"');
    await page.click('[data-theme-choice=system]');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitFor('getComputedStyle(document.body).backgroundColor !== "rgb(17, 21, 24)"');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitFor('getComputedStyle(document.body).backgroundColor === "rgb(17, 21, 24)"');
    await page.close();
  });

  await t.test('selecting a stage on the rail opens its records; keyboard moves between tabs', async () => {
    const page = await browser.page();
    await page.navigate(`${f.entry}#run=RUN-DECIDE`);
    await page.waitFor('document.querySelector("[data-stage=plan-audit] .node")');
    await page.click('[data-stage=plan-audit] .node');
    await page.waitFor('document.querySelector("[data-testid=stage-detail]")');
    const detail = await page.text('[data-testid=stage-detail]');
    assert.match(detail ?? '', /Stage: Plan audit/);
    assert.match(detail ?? '', /plan-audit-1/);
    assert.match(detail ?? '', /HOLDS/);
    assert.equal(await page.evaluate<string>('location.hash'), '#run=RUN-DECIDE&stage=plan-audit');
    await page.evaluate('document.getElementById("tab-timeline").focus()');
    await page.press('ArrowRight');
    await page.waitFor('document.querySelector("[role=tab][aria-selected=true]").dataset.tab === "attempts"');
    assert.equal(await page.evaluate<string>('document.activeElement.dataset.tab'), 'attempts');
    await page.press('ArrowRight');
    await page.waitFor('document.querySelector("[role=tab][aria-selected=true]").dataset.tab === "tests"');
    assert.deepEqual(page.errors(), []);
    await page.close();
  });

  await t.test('a committed event reaches the page without a reload', async () => {
    const page = await browser.page();
    await page.navigate(`${f.entry}#run=RUN-LIVE`);
    await page.waitFor('document.querySelector("[data-testid=synced]")');
    await page.waitFor('document.querySelector("[data-testid=connection]").textContent === "Live"', 8000);
    const before = await page.text('[data-testid=synced]');
    // run_started, three dispatch/accept pairs, the auditor's dispatch: eight committed records.
    assert.match(before ?? '', /journal v8/);
    assert.match((await page.text('[data-stage=plan-audit]')) ?? '', /Plan audit/);
    assert.equal(await page.evaluate<string>('document.querySelector("[data-stage=plan-audit]").dataset.state'), 'DISPATCHED_AWAITING_RESULT');
    completeStep(f.live); // the auditor's result is accepted by the engine: v9
    await page.waitFor('document.querySelector("[data-testid=synced]").textContent.includes("journal v9")', 6000);
    assert.equal(await page.evaluate<string>('document.querySelector("[data-stage=plan-audit]").dataset.state'), 'COMPLETED');
    assert.equal(f.live.assembly.engine.next(f.live.runId).code, 'BRIEF_READY'); // v10, the wait begins
    await page.waitFor('document.querySelector("[data-testid=human-band]")', 6000);
    assert.match((await page.text('[data-testid=run-status]')) ?? '', /Waiting for you/);
    assert.match((await page.text('[data-testid=synced]')) ?? '', /journal v10/);
    // Pausing holds the view; resuming catches up.
    await page.click('[data-testid=pause]');
    await page.waitFor('document.querySelector("[data-testid=connection]").textContent.startsWith("Paused")');
    assert.equal(f.live.assembly.engine.decide(f.live.runId, decision(f.live.assembly.engine.status(f.live.runId), { action: 'pause' })).code, 'DECISION_RECORDED'); // v11
    await new Promise((r) => setTimeout(r, 700));
    assert.match((await page.text('[data-testid=synced]')) ?? '', /journal v10/, 'paused: the earlier version is still shown');
    assert.match((await page.text('[data-testid=connection]')) ?? '', /1 run\(s\) changed/);
    await page.click('[data-testid=pause]');
    await page.waitFor('document.querySelector("[data-testid=synced]").textContent.includes("journal v11")', 6000);
    assert.match((await page.text('[data-testid=human-band]')) ?? '', /Paused: a decision from you is still needed/);
    assert.deepEqual(page.errors(), []);
    await page.close();
  });

  await t.test('a completed run links to its report, a blocked run shows its blocker', async () => {
    const page = await browser.page();
    await page.navigate(`${f.entry}#run=RUN-DONE`);
    await page.waitFor('document.querySelector("[data-testid=done-band]")');
    await page.waitFor('document.querySelector("[data-testid=report-link]")', 6000);
    const href = await page.evaluate<string>('document.querySelector("[data-testid=report-link]").getAttribute("href")');
    assert.equal(href, '/api/v1/runs/RUN-DONE/report');
    const report = await page.evaluate<{ status: number; text: string }>(`fetch(${JSON.stringify(href)}).then(async (r) => ({ status: r.status, text: await r.text() }))`);
    assert.equal(report.status, 200);
    assert.match(report.text, /Local PR proposal prepared/);
    assert.match((await page.text('[data-testid=done-band]')) ?? '', /NOT_ATTEMPTED/);
    await page.screenshot(join(f.shots, 'done-light.png'));
    await page.navigate(`${f.entry}#run=RUN-BLOCKED`);
    await page.waitFor('document.querySelector("[data-testid=blocked-band]")');
    assert.match((await page.text('[data-testid=blocked-band]')) ?? '', /REVIEW_REJECTED/);
    assert.equal(await page.evaluate<string>('document.querySelector("[data-stage=review]").dataset.state'), 'BLOCKED');
    await page.close();
  });

  await t.test('narrow viewports keep the pipeline readable as a list; the laptop viewport keeps the rail', async () => {
    const page = await browser.page();
    await page.setViewport(1366, 640);
    await page.navigate(`${f.entry}#run=RUN-DECIDE`);
    await page.waitFor('document.querySelector(".rail")');
    assert.equal(await page.evaluate<string>('getComputedStyle(document.querySelector(".rail")).gridAutoFlow'), 'column');
    await page.screenshot(join(f.shots, 'laptop-1366x640.png'));
    await page.setViewport(820, 1100);
    await page.waitFor('getComputedStyle(document.querySelector(".rail")).gridAutoFlow === "row"');
    assert.ok((await page.evaluate<number>('document.documentElement.scrollWidth')) <= 820, 'no horizontal page overflow');
    await page.screenshot(join(f.shots, 'tablet-820.png'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate<string>('getComputedStyle(document.querySelector(".stage .node")).animationName'), 'none');
    await page.close();
  });
});
