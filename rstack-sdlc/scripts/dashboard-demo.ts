// A reproducible demonstration of the dashboard: real engine runs driven by
// the fake transport (SIMULATED role results, real test executions) in the
// states a reader must see, one dashboard server over them, and screenshots
// of each state in both themes taken by the installed Chrome. Everything it
// writes lands under the ignored .rstack/dashboard-demo/.
//
//   node scripts/dashboard-demo.ts [--keep] [--no-screenshots] [--replay] [--step-ms 5000]
//
// --keep leaves the server running and prints its URL; otherwise the server
// is stopped at the end. --replay (implies --keep) starts one more run and
// advances it by one engine call every --step-ms milliseconds until it ends,
// so the Live view's hand-offs can be watched: each step commits a real
// journal event, and only those events animate. Nothing here is host
// evidence: the role results are scripted, as the dashboard itself says on
// every run.

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { randomBytes } from 'node:crypto';
import { createDashboardServer } from '../dashboard/server.ts';
import { writeReport } from '../dashboard/report-writer.ts';
import { launchChrome } from '../tests/support/browser.ts';
import { type TestRun, completeStep, decision, result } from '../tests/support/harness.ts';
import { type Scenario, scenarioRun } from '../tests/support/scenarios.ts';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values } = parseArgs({ options: { keep: { type: 'boolean' }, 'no-screenshots': { type: 'boolean' }, replay: { type: 'boolean' }, 'step-ms': { type: 'string' } } });
const stepMs = Math.max(500, Number(values['step-ms'] ?? 5000) || 5000);
const demoRoot = join(PACKAGE_ROOT, '.rstack', 'dashboard-demo');
const workspace = join(demoRoot, 'workspace');
const shots = join(demoRoot, 'shots');
rmSync(demoRoot, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });
mkdirSync(shots, { recursive: true });

// A commit clock for the sample runs: starts `minutesAgo` in the past and
// advances 4 to 40 seconds (seeded, so reproducible in shape) on every
// reading, never passing the real time. The engine still commits every
// event; only its timestamps are spread out so durations are readable.
function demoClock(minutesAgo: number, seed: number): () => Date {
  let t = Date.now() - minutesAgo * 60_000;
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    t = Math.min(t + 4_000 + (s % 36_000), Date.now());
    return new Date(t);
  };
}

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
let seed = 7;
for (const [id, scenario] of STATES) runs.set(id, await scenarioRun(scenario, `demo-${id}`, id, workspace, { now: demoClock(45, (seed += 13)) }));
// The live run: the dashboard follows it while this script drives it.
const live = await scenarioRun('awaiting-auditor', 'demo-live', 'RUN-10-LIVE', workspace, { now: demoClock(20, 101) });

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
    await page.waitFor('document.querySelectorAll("[data-switch]").length >= 10', 10_000);
    const settle = () => new Promise((r) => setTimeout(r, 400));
    for (const [id] of STATES) {
      for (const theme of ['light', 'dark'] as const) {
        await page.navigate(`${server.url}/#run=${id}`);
        await page.waitFor('document.querySelector("[data-testid=live] .card")', 10_000);
        await page.click(`[data-theme-choice=${theme}]`);
        await page.waitFor(`document.documentElement.dataset.theme === "${theme}"`);
        await settle();
        const file = join(shots, `${id.toLowerCase()}-${theme}.png`);
        await page.screenshot(file, true);
        taken.push(file);
      }
    }
    for (const theme of ['light', 'dark'] as const) {
      await page.navigate(`${server.url}/#run=RUN-04-DECISION&mode=inspect`);
      await page.waitFor('document.querySelector("[data-testid=human-band]")', 10_000);
      await page.click(`[data-theme-choice=${theme}]`);
      await settle();
      const file = join(shots, `inspect-run-04-decision-${theme}.png`);
      await page.screenshot(file, true);
      taken.push(file);
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
    await frame('3-human-decision', 'document.querySelector("[data-hero=human]")');
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

// One engine call per step: dispatch, then the scripted result, then the
// next stage; a human wait gets a scripted "proceed" on the following step.
function stepper(run: TestRun): () => string | null {
  const { engine } = run.assembly;
  let pending: Parameters<typeof result>[0] | null = null;
  let waiting: ReturnType<typeof engine.next> | null = null;
  let ended = false;
  return () => {
    if (ended) return null;
    if (pending) {
      const r = engine.submit(run.runId, result(pending));
      const done = `${pending.attempt_id} result submitted: ${r.code}`;
      pending = null;
      return done;
    }
    if (waiting) {
      const r = engine.decide(run.runId, decision(waiting));
      waiting = null;
      return `scripted decision: ${r.code}`;
    }
    const reply = engine.next(run.runId);
    const d = reply.directive;
    if (d?.kind === 'CONTINUE' && d.pending) {
      pending = d.pending;
      return `dispatched ${d.pending.role} (${d.pending.attempt_id})`;
    }
    if (d?.kind === 'WAIT') {
      waiting = reply;
      return `waiting for a human: ${reply.code}`;
    }
    if (d?.kind === 'DONE' || d?.kind === 'BLOCKED') {
      ended = true;
      return `${reply.code} (${d.kind})`;
    }
    return reply.code;
  };
}

writeFileSync(join(demoRoot, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (values.replay) {
  const replay = await scenarioRun('fresh', 'demo-replay', 'RUN-11-REPLAY', workspace);
  process.stdout.write(`\nReplay: open ${server.url}/#run=RUN-11-REPLAY after the entry URL below; one engine step every ${stepMs} ms.\nDashboard running at ${entry}\n`);
  const step = stepper(replay);
  await new Promise((r) => setTimeout(r, stepMs * 2));
  for (let n = 1; ; n += 1) {
    const what = step();
    if (what === null) break;
    process.stdout.write(`step ${n}: ${what}\n`);
    await new Promise((r) => setTimeout(r, stepMs));
  }
  process.stdout.write(`Replay finished: ${replay.assembly.engine.status(replay.runId).directive?.kind ?? 'unknown'}. Press Ctrl+C to stop.\n`);
} else if (values.keep) {
  process.stdout.write(`\nDashboard running at ${entry}\nPress Ctrl+C to stop.\n`);
} else {
  await server.close();
  if (!existsSync(join(demoRoot, 'summary.json'))) process.exitCode = 1;
}
