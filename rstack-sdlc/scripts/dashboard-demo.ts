// A reproducible demonstration of the dashboard: real engine runs driven by
// the fake transport (SIMULATED role results, real test executions) in the
// states a reader must see, one dashboard server over them, and screenshots
// of each state in both themes taken by the installed Chrome. Everything it
// writes lands under the ignored .rstack/dashboard-demo/.
//
//   node scripts/dashboard-demo.ts [--keep] [--no-screenshots]
//
// --keep leaves the server running and prints its URL; otherwise the server
// is stopped at the end. Nothing here is host evidence: the role results are
// scripted, as the dashboard itself says on every run.

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { randomBytes } from 'node:crypto';
import { createDashboardServer } from '../dashboard/server.ts';
import { writeReport } from '../dashboard/report-writer.ts';
import { launchChrome } from '../tests/support/browser.ts';
import { completeStep, decision } from '../tests/support/harness.ts';
import { type Scenario, scenarioRun } from '../tests/support/scenarios.ts';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: { keep: { type: 'boolean' }, 'no-screenshots': { type: 'boolean' } } });
const demoRoot = join(PACKAGE_ROOT, '.rstack', 'dashboard-demo');
const workspace = join(demoRoot, 'workspace');
const shots = join(demoRoot, 'shots');
rmSync(demoRoot, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });
mkdirSync(shots, { recursive: true });

// The seven states the owner asked to see, plus two more worth having.
const STATES: [string, Scenario, string][] = [
  ['RUN-01-FRESH', 'fresh', '1. Freshly started run'],
  ['RUN-02-PLANNER', 'planner-dispatched', '2. Planner dispatched'],
  ['RUN-03-AUDITOR', 'awaiting-auditor', '3. Waiting for the Plan Auditor result'],
  ['RUN-04-DECISION', 'plan-decision', '4. Human plan decision required'],
  ['RUN-05-DEVELOPER', 'implementing', '5. Developer activity after the tester proof'],
  ['RUN-06-BLOCKED', 'review-rejected', '6. Blocked: technical review rejected'],
  ['RUN-07-DONE', 'completed', '7. Completed with its HTML report'],
  ['RUN-08-VERIFY-FAIL', 'verification-failed', 'A failed verification, developer dispatched again'],
  ['RUN-09-SECOND-AUDIT', 'second-audit', 'A second audit round'],
];

const runs = new Map<string, Awaited<ReturnType<typeof scenarioRun>>>();
for (const [id, scenario] of STATES) runs.set(id, await scenarioRun(scenario, `demo-${id}`, id, workspace));
// The live run: the dashboard follows it while this script drives it.
const live = await scenarioRun('awaiting-auditor', 'demo-live', 'RUN-10-LIVE', workspace);

const report = writeReport(workspace, 'RUN-07-DONE');
const token = randomBytes(32).toString('hex');
const server = await createDashboardServer({ workspace, token, port: 0, pollMs: 200, heartbeatMs: 5000 });
const entry = `${server.url}/?t=${token}`;
const summary: Record<string, unknown> = { evidence_class: 'SIMULATED', workspace, url: server.url, entry_url: entry, report: report.path, states: STATES.map(([id, s, title]) => ({ run_id: id, scenario: s, title })), screenshots: [] as string[] };

if (!values['no-screenshots']) {
  const browser = await launchChrome();
  if (!browser) {
    summary.screenshots = 'skipped: no Chrome installed';
  } else {
    const taken: string[] = [];
    const page = await browser.page();
    await page.setViewport(1440, 900);
    await page.navigate(entry);
    await page.waitFor('document.querySelectorAll("[data-run]").length >= 10', 10_000);
    for (const [id] of STATES) {
      for (const theme of ['light', 'dark'] as const) {
        await page.navigate(`${server.url}/#run=${id}`);
        await page.waitFor('document.querySelector("[data-testid=synced]")', 10_000);
        await page.click(`[data-theme-choice=${theme}]`);
        await page.waitFor(`document.documentElement.dataset.theme === "${theme}"`);
        await new Promise((r) => setTimeout(r, 150));
        const file = join(shots, `${id.toLowerCase()}-${theme}.png`);
        await page.screenshot(file, true);
        taken.push(file);
      }
    }
    // Live progression without a reload: one page, several committed events.
    await page.navigate(`${server.url}/#run=RUN-10-LIVE`);
    await page.waitFor('document.querySelector("[data-testid=connection]").textContent === "Live"', 10_000);
    await page.click('[data-theme-choice=dark]');
    const frame = async (name: string, until: string): Promise<void> => {
      await page.waitFor(until, 10_000);
      await new Promise((r) => setTimeout(r, 300));
      const file = join(shots, `live-${name}-dark.png`);
      await page.screenshot(file, false);
      taken.push(file);
    };
    await frame('1-auditor-dispatched', 'document.querySelector("[data-testid=synced]").textContent.includes("journal v8")');
    completeStep(live);
    await frame('2-audit-accepted', 'document.querySelector("[data-testid=synced]").textContent.includes("journal v9")');
    live.assembly.engine.next(live.runId);
    await frame('3-human-decision', 'document.querySelector("[data-testid=human-band]")');
    live.assembly.engine.decide(live.runId, decision(live.assembly.engine.status(live.runId)));
    await frame('4-decided', 'document.querySelector("[data-testid=synced]").textContent.includes("journal v11")');
    completeStep(live); // proof
    live.assembly.engine.next(live.runId); // developer dispatched
    await frame('5-developer-dispatched', 'document.querySelector("[data-stage=implement]").dataset.state === "DISPATCHED_AWAITING_RESULT"');
    completeStep(live); // implement
    live.assembly.engine.next(live.runId); // verification
    await frame('6-verified', 'document.querySelector("[data-stage=verify]").dataset.state === "COMPLETED"');
    completeStep(live); // review
    live.assembly.engine.next(live.runId); // packet
    completeStep(live); // pr-review
    live.assembly.engine.next(live.runId); // proposal
    await frame('7-completed-report', 'document.querySelector("[data-testid=report-link]")');
    await page.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
    summary.screenshots = taken;
    summary.live_run = { run_id: live.runId, final: live.assembly.engine.status(live.runId).directive };
  }
}

writeFileSync(join(demoRoot, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (values.keep) {
  process.stdout.write(`\nDashboard running at ${entry}\nPress Ctrl+C to stop.\n`);
} else {
  await server.close();
  if (!existsSync(join(demoRoot, 'summary.json'))) process.exitCode = 1;
}
