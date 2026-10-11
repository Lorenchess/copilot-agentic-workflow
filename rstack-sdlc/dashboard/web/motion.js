// Honest motion. `cues` turns the difference between two committed views of
// one run into at most three animation cues, one per new journal event or
// engine state transition; nothing else may start a cue. `createPlayer`
// makes each cue play at most once per run: opening a run, re-rendering,
// reconnecting, or a resync of the same version never replays one. The DOM
// effects themselves are injected (`animate`), so this module stays pure.

const CATEGORY_CUE = { dispatch: 'handoff', result: 'settle', review: 'settle', failure: 'fail', human: 'decided', verification: 'verified' };
const MAX_CUES = 3;
const STAGGER_MS = 400;

// The last cues played, newest last, for diagnostics and the browser tests.
export const log = [];
globalThis.rstackMotionLog = log;

function record(entry) {
  log.push(entry);
  if (log.length > 50) log.shift();
}

// The stage an entry happened at: its own stage, or where the run stood before it.
function stageOf(timeline, i) {
  const e = timeline[i];
  return e.stage_id ?? (i > 0 ? timeline[i - 1].stage_after : null) ?? e.stage_after ?? null;
}

export function cues(prev, next) {
  if (!prev || !next || prev.run_id !== next.run_id) return [];
  if (!(next.journal_version > prev.journal_version)) return [];
  const out = [];
  const timeline = next.timeline;
  for (let i = 0; i < timeline.length; i += 1) {
    const e = timeline[i];
    if (e.seq <= prev.journal_version) continue;
    const kind = CATEGORY_CUE[e.category];
    if (!kind) continue;
    if (kind === 'handoff') {
      const to = e.stage_id ?? e.stage_after;
      let from = null;
      for (let j = i - 1; j >= 0 && from === null; j -= 1) {
        const s = stageOf(timeline, j);
        if (s && s !== to) from = s;
      }
      out.push({ kind, seq: e.seq, stage: to, from, to });
    } else if (kind === 'decided') {
      const stage = stageOf(timeline, i);
      out.push({ kind, seq: e.seq, stage, from: stage, to: e.stage_after });
    } else {
      out.push({ kind, seq: e.seq, stage: stageOf(timeline, i) });
    }
  }
  const before = new Map(prev.stage_graph.map((s) => [s.stage_id, s.state]));
  for (const s of next.stage_graph) {
    const was = before.get(s.stage_id);
    if (was === s.state) continue;
    if (s.state === 'WAITING_HUMAN') out.push({ kind: 'needs-you', seq: next.journal_version, stage: s.stage_id });
    else if (s.state === 'BLOCKED') out.push({ kind: 'blocked', seq: next.journal_version, stage: s.stage_id });
    else if (s.branch && was === 'NOT_TAKEN') out.push({ kind: 'branch', seq: next.journal_version, stage: s.stage_id });
  }
  if (next.final_outcome === 'LOCAL_PR_PROPOSAL_PREPARED' && prev.final_outcome !== next.final_outcome) {
    out.push({ kind: 'done', seq: next.journal_version, stage: null });
  }
  // An accepted result that blocks its stage (a rejecting review) or fails it is shown
  // as that outcome only, never first as a settled success.
  const bad = new Set(out.filter((c) => c.kind === 'blocked' || c.kind === 'fail').map((c) => `${c.seq}|${c.stage}`));
  const kept = out.filter((c) => !(c.kind === 'settle' && bad.has(`${c.seq}|${c.stage}`)));
  // Stable: events in journal order, then the transitions they caused.
  const ordered = kept.map((c, i) => ({ c, i })).sort((a, b) => a.c.seq - b.c.seq || a.i - b.i).map((x) => x.c);
  return ordered.length > MAX_CUES ? ordered.slice(-MAX_CUES) : ordered;
}

export function createPlayer({ animate, reduced = () => false, hidden = () => false }) {
  const watermark = new Map();
  let deferred = null;
  // Events missed while hidden or paused, for one run only.
  let missed = { run: null, n: 0 };
  const miss = (runId, n) => {
    if (missed.run !== runId) missed = { run: runId, n: 0 };
    missed.n += n;
  };
  const run = (runId, list) => {
    list.forEach((cue, i) => {
      const r = reduced();
      record({ run: runId, kind: cue.kind, seq: cue.seq, stage: cue.stage, reduced: r });
      try {
        animate(cue, { reduced: r, delay: r ? 0 : i * STAGGER_MS });
      } catch {
        // An effect that fails never affects the state already shown.
      }
    });
    return list;
  };
  return {
    // The version a run was first shown at: nothing at or before it ever animates.
    prime(runId, version) {
      if (!watermark.has(runId) || watermark.get(runId) < version) watermark.set(runId, version);
      if (missed.run !== runId) missed = { run: runId, n: 0 };
    },
    // `events` is how many journal events this update covers; `catchUp` marks
    // the first update after a resume or a resync.
    play(runId, list, { catchUp = false, events = 0 } = {}) {
      if (!watermark.has(runId)) {
        const top = list.reduce((m, c) => Math.max(m, c.seq), -1);
        if (top >= 0) watermark.set(runId, top);
        return [];
      }
      const mark = watermark.get(runId);
      const fresh = list.filter((c) => c.seq > mark);
      if (fresh.length === 0) return [];
      watermark.set(runId, fresh.reduce((m, c) => Math.max(m, c.seq), mark));
      if (hidden()) {
        deferred = { runId, cue: fresh[fresh.length - 1] };
        miss(runId, events || fresh.length);
        return [];
      }
      if (catchUp) {
        miss(runId, events);
        return run(runId, [fresh[fresh.length - 1]]);
      }
      missed = { run: runId, n: 0 };
      return run(runId, fresh);
    },
    // The tab is visible again: the newest deferred cue plays, if it belongs to the run shown.
    resume(currentRunId) {
      const d = deferred;
      deferred = null;
      if (!d || d.runId !== currentRunId) return [];
      return run(d.runId, [d.cue]);
    },
    // How many events the given run had while it was not watched.
    missed(runId) {
      return missed.run === runId ? missed.n : 0;
    },
  };
}
