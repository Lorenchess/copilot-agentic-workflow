// The Live view: built once per run, then patched in place on every new
// committed version, so the two allowed loops (breathe, attn) and any
// running cue survive updates. The words here follow the engine: an agent is
// "dispatched" and the run is "waiting on" it; nothing claims an agent is at
// work, because the engine records only commit times.

import { fmtDuration, heroState, isTerminal, roleBadge, roleLabel, roleToken, runEnd, seconds, vitals } from './derive.js';
import { setAttr, setText } from './dom.js';
import { createFeed } from './feed.js';
import { createFlow } from './flow.js';
import { createLanes } from './lanes.js';
import { h, refButton, stageLabel } from './views.js';

const ACTION_HINT = 'Decide in the Coordinator chat. This dashboard is read-only and records nothing.';

function clock(since, until, offset) {
  return h('b', { 'data-since': since, 'data-until': until || null, 'data-offset': offset ? String(offset) : null }, '0:00');
}

function reportLink(view, report) {
  return report && report.available
    ? h('a', { class: 'btn', href: `/api/v1/runs/${encodeURIComponent(view.run_id)}/report`, target: '_blank', rel: 'noopener', 'data-testid': 'report-link' }, 'Open the run report')
    : null;
}

// The stage after the current one, from the stage's own `next` (a branch
// stage rejoins the main path there); null at the final stage.
function nextStage(view) {
  const here = view.stage_graph.find((s) => s.stage_id === view.engine.stage);
  return here && here.next ? view.stage_graph.find((s) => s.stage_id === here.next) || null : null;
}

// What the hero says for each engine state. Returns plain parts; `renderHero` builds them.
function heroParts(view, ctx, report) {
  const state = heroState(view);
  const a = view.current_activity;
  const stage = view.stage_graph.find((s) => s.stage_id === view.engine.stage) || null;
  const label = stage ? stage.label : stageLabel(view, view.engine.stage);
  switch (state) {
    case 'dispatched': {
      const model = a.configured_model;
      return {
        token: roleToken(a.role, a.kind), badge: roleBadge(a.role, a.kind), tone: 'info',
        title: `Waiting on the ${roleLabel(a.role)}`, chip: '◇ Dispatched · awaiting result',
        facts: ['Dispatched ', clock(a.dispatched_at), ' ago', a.attempt_id ? ` · attempt ${a.attempt_id}` : '',
          a.retry.budget !== null ? ` · retries ${a.retry.used} of ${a.retry.budget} used` : '',
          model ? ` · ${model.owner_label} configured ` : ' · no model configured in the profile ',
          h('span', { class: 'na' }, '(effective model not observed)')],
      };
    }
    case 'human': {
      const ha = view.human_action;
      const audit = ha.audit;
      const read = ha.read
        ? ha.awaiting === 'PLAN_DECISION'
          ? h('button', { type: 'button', class: 'btn attn', 'data-focus': 'hero-read', onclick: () => ctx.openBrief(ha.round) }, `Open the brief (round ${ha.round})`)
          : h('button', { type: 'button', class: 'btn attn', 'data-focus': 'hero-read', onclick: () => ctx.openArtifact(ha.subjects.intent, 'intent.md') }, 'Review the open product decisions')
        : null;
      return {
        token: 'you', badge: 'YOU', tone: 'human',
        title: ha.paused ? 'Paused: your decision is still needed' : ha.awaiting === 'PLAN_DECISION' ? 'Your plan decision is needed' : 'Your answer to a product question is needed',
        chip: '! Waiting for you',
        facts: ['Waiting ', clock(ha.waiting_since), audit ? ` · audit round ${ha.round}: ${audit.verdict}, ${audit.blocking} blocking finding(s), ${audit.unchecked} item(s) not checked` : ha.open_decisions ? ` · ${ha.open_decisions}` : ''],
        actions: [read, h('span', { class: 'hint' }, ACTION_HINT)],
        list: ha.allowed_actions,
      };
    }
    case 'blocked': {
      const b = view.engine.blocker;
      const findings = view.reviews.some((r) => r.current && r.findings.length > 0);
      return {
        glyph: '■', tone: 'danger', title: `Blocked at ${label}`, chip: '■ Blocked',
        detail: b ? [h('code', {}, b.code), `: ${b.detail}`] : null,
        facts: ['No recovery path is recorded; a fix needs a new run.'],
        actions: [findings ? h('button', { type: 'button', class: 'btn', 'data-focus': 'hero-findings', onclick: () => ctx.inspectTab('reviews') }, 'See the findings') : null, reportLink(view, report)],
      };
    }
    case 'done': {
      const vit = vitals(view);
      return {
        glyph: '✓', tone: 'ok', title: 'Local PR proposal ready', chip: '✓ Completed',
        facts: [`${vit.completed} of ${vit.total} stages accepted in `, h('b', {}, fmtDuration(seconds(view.started_at, runEnd(view)))), '. Not published: no remote pull request was created.'],
        actions: [view.proposal ? refButton(view.proposal.proposal_ref, ctx, 'proposal') : null, reportLink(view, report)],
      };
    }
    case 'rejected':
      return {
        glyph: '×', tone: 'neutral', title: 'Ended: rejected by the human', chip: '× Rejected',
        facts: ['A human recorded reject; the run ended without implementation.'],
        actions: [reportLink(view, report)],
      };
    case 'unreadable':
      return {
        glyph: '■', tone: 'danger', title: `Run records are ${view.source_status.toLowerCase().replaceAll('_', ' ')}`, chip: '■ Unreadable',
        facts: [`${view.diagnostic.code || ''}: ${view.diagnostic.message || 'the run cannot be read by this viewer'}${view.diagnostic.record ? ` (journal record ${view.diagnostic.record})` : ''}. Nothing here is a replayed state; the viewer does not repair run records.`],
      };
    default: {
      const kind = stage ? stage.kind : null;
      return {
        token: stage ? roleToken(stage.role, stage.kind) : 'engine', badge: stage ? roleBadge(stage.role, stage.kind) : 'EN', tone: 'info',
        title: `${label} is next`, chip: '◎ Ready',
        facts: [kind === 'role'
          ? `The engine has not dispatched the ${roleLabel(stage.role)} yet; the run continues when the Coordinator asks the engine for its next step.`
          : 'An engine step; the run continues when the Coordinator asks the engine for its next step.'],
      };
    }
  }
}

export function createLive(ctx) {
  const flow = createFlow({ onSelect: (id) => ctx.inspectStage(id) });
  const lanes = createLanes();
  const feed = createFeed();

  const avatar = h('div', { class: 'avatar', 'aria-hidden': 'true' });
  const heroMain = h('div', { class: 'hero-main' });
  const runTime = h('span', { class: 'big' }, '0:00');
  const nextLine = h('span', {});
  const hero = h('section', { class: 'hero', 'data-testid': 'hero', role: 'status', 'aria-live': 'polite', 'aria-label': 'Current state of the run' },
    avatar, heroMain, h('div', { class: 'hero-side' }, 'Run time', runTime, nextLine));
  const tail = h('p', { class: 'callout human' });
  tail.hidden = true;
  const stale = h('p', { class: 'callout danger', role: 'status' });
  stale.hidden = true;

  const flowTitle = h('h2', {});
  const flowPanel = h('section', { class: 'panel flow-panel', 'aria-label': 'Pipeline' }, flowTitle, flow.el);
  const vit = {};
  const vitalItem = (key, label) => {
    vit[key] = { dt: h('dt', {}, label), dd: h('dd', {}) };
    return h('div', { class: 'vital', 'data-vital': key }, vit[key].dt, vit[key].dd);
  };
  const vitalsPanel = h('section', { class: 'panel vitals-panel', 'data-testid': 'vitals', 'aria-label': 'Run vitals' }, h('h2', {}, 'Run vitals'),
    h('dl', { class: 'vitals-list' }, vitalItem('stages', 'Stages completed'), vitalItem('attempts', 'Agent attempts'), vitalItem('tests', 'Tests'), vitalItem('audit', 'Plan audit budget'), vitalItem('wait', 'Time waiting on you')));
  const lanesPanel = h('section', { class: 'panel', 'aria-label': 'Who held the work' }, h('h2', {}, 'Who held the work'), lanes.el);
  const feedPanel = h('section', { class: 'panel', 'aria-label': 'Journal feed' }, h('h2', {}, 'Journal feed'), feed.el);
  const footnote = h('p', { class: 'footnote' });
  const el = h('section', { class: 'live-view', 'data-testid': 'live', 'aria-label': 'Live run' },
    hero, stale, tail,
    h('div', { class: 'live-row primary' }, flowPanel, vitalsPanel),
    h('div', { class: 'live-row secondary' }, lanesPanel, feedPanel),
    footnote);

  let heroKey = '';

  function renderHero(view, report) {
    const p = heroParts(view, ctx, report);
    const state = heroState(view);
    setAttr(hero, 'data-hero', state);
    setAttr(avatar, 'data-token', p.token || null);
    setAttr(avatar, 'data-glyph', p.glyph ? '' : null);
    setAttr(avatar, 'data-tone', p.glyph ? p.tone : null);
    setText(avatar, p.glyph || p.badge || '');
    const key = `${state}|${view.journal_version}|${report && report.available}|${view.human_action.paused}`;
    if (key !== heroKey) {
      heroKey = key;
      heroMain.replaceChildren(...[
        h('h1', {}, p.title, h('span', { class: 'chip', 'data-tone': p.tone, 'data-testid': 'run-status' }, p.chip)),
        p.detail ? h('p', { class: 'hero-detail' }, p.detail) : null,
        h('p', { class: 'hero-facts' }, p.facts),
        p.list && p.list.length ? h('ul', { class: 'actions-list', 'aria-label': 'Decisions the engine allows now' }, p.list.map((x) => h('li', { class: 'action' }, x))) : null,
        p.actions && p.actions.some(Boolean) ? h('div', { class: 'hero-actions' }, p.actions) : null,
      ].filter(Boolean));
    }
    setAttr(runTime, 'data-since', view.started_at);
    setAttr(runTime, 'data-until', runEnd(view));
    const next = isTerminal(view) ? null : nextStage(view);
    setText(nextLine, isTerminal(view) ? `ended at journal v${view.journal_version}` : next ? `next: ${next.label} · ${next.kind === 'role' ? roleLabel(next.role) : next.kind === 'human' ? 'You' : 'Engine'}` : 'final stage');
  }

  function renderVitals(view) {
    const v = vitals(view);
    vit.stages.dd.replaceChildren(String(v.completed), ' ', h('small', {}, `of ${v.total}`));
    vit.attempts.dd.replaceChildren(String(v.attempts), ' ', h('small', {}, `${v.failed} failed`));
    if (v.tests) {
      setText(vit.tests.dt, v.tests.purpose === 'PROOF_BASELINE' ? 'Tests, proof baseline' : 'Tests, latest verification');
      const failedBad = v.tests.failed > 0 && v.tests.purpose !== 'PROOF_BASELINE';
      vit.tests.dd.replaceChildren(h('span', { class: 'roll ok' }, `${v.tests.passed} ✓`), ' ', h('span', { class: failedBad ? 'roll bad' : 'roll' }, `${v.tests.failed} ✗`));
    } else {
      setText(vit.tests.dt, 'Tests');
      vit.tests.dd.replaceChildren('—', ' ', h('small', {}, 'not run yet'));
    }
    vit.audit.dd.replaceChildren(v.audit ? String(v.audit.used) : '—', ' ', h('small', {}, v.audit ? `of ${v.audit.max} used` : ''));
    vit.wait.dd.replaceChildren(v.waitSince ? h('span', { 'data-since': v.waitSince, 'data-offset': String(v.waitSeconds) }, fmtDuration(v.waitSeconds)) : fmtDuration(v.waitSeconds));
  }

  function update(view, { report, away = 0, error = null, now = new Date().toISOString() } = {}) {
    setAttr(el, 'data-run', view.run_id);
    renderHero(view, report);
    stale.hidden = !error;
    setText(stale, error ? `Update unavailable: ${error}. Showing the last received state (journal v${view.journal_version}).` : '');
    tail.hidden = view.source_status !== 'INCOMPLETE_TAIL';
    setText(tail, `${view.diagnostic.incomplete_tail_bytes} byte(s) after the last committed record were never acknowledged; they are not shown as an event.`);
    const hasGraph = view.stage_graph.length > 0;
    flowPanel.hidden = !hasGraph;
    if (hasGraph) {
      setText(flowTitle, `Pipeline · ${view.workflow.id ?? 'unknown workflow'} v${view.workflow.version ?? '?'}`);
      flow.update(view);
    }
    renderVitals(view);
    lanes.update(view, now);
    feed.update(view, { away });
    setText(footnote, `Times are engine commit times. A dispatch that awaits its result is not proof that a model is executing.${view.transport_class === 'SIMULATED' ? ' Role results in this run are SIMULATED: scripted fixture content, not the work of any model or person.' : ''}`);
  }

  const tag = (anim, id) => {
    if (anim && id) anim.id = id;
    return anim;
  };

  // Feed rows already slid in, so an event with two cues (a dispatch that
  // also opens a wait) moves its row once.
  const fed = new Set();
  // The ring colour follows what the card now shows, so a result that ended
  // in a block or a failure never flashes as a success.
  const toneOf = (stageId) => {
    const card = flow.cardOf(stageId);
    const s = card && card.dataset.state;
    return s === 'BLOCKED' || s === 'FAILED_ATTEMPT' ? 'danger' : s === 'WAITING_HUMAN' ? 'human' : 'ok';
  };

  // One cue, started by a committed event (motion.js decides which and when).
  function animate(cue, { reduced, delay = 0 }) {
    const id = `cue:${cue.kind}:${cue.seq}`;
    const target = (cue.stage && flow.cardOf(cue.stage)) || hero;
    if (reduced) {
      target.classList.add('cue-outline');
      setTimeout(() => target.classList.remove('cue-outline'), 1000);
      return;
    }
    const item = fed.has(cue.seq) ? null : feed.itemOf(cue.seq);
    if (item) {
      fed.add(cue.seq);
      tag(item.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay, easing: 'ease-out' }), id);
    }
    switch (cue.kind) {
      case 'handoff':
        if (cue.from) flow.packet(cue.from, cue.to, { id, delay });
        flow.pop(cue.to, { id, delay: delay + (cue.from ? 880 : 0) });
        tag(avatar.animate([{ opacity: 0, transform: 'scale(0.85)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: delay + (cue.from ? 880 : 0), easing: 'ease-out' }), id);
        break;
      case 'settle':
      case 'decided':
        flow.ring(cue.stage, toneOf(cue.stage), { id, delay });
        break;
      case 'fail':
        flow.ring(cue.stage, 'danger', { id, delay });
        tag(vit.attempts.dd.animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay }), id);
        break;
      case 'needs-you':
        flow.ring(cue.stage, 'human', { id, delay });
        tag(hero.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.01)' }, { transform: 'scale(1)' }], { duration: 500, delay }), id);
        break;
      case 'verified': {
        const card = flow.cardOf(cue.stage);
        flow.ring(cue.stage, card && card.dataset.state === 'FAILED_ATTEMPT' ? 'danger' : 'ok', { id, delay });
        tag(vit.tests.dd.animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay }), id);
        break;
      }
      case 'branch':
        flow.ring(cue.stage, 'human', { id, delay });
        break;
      case 'blocked':
        flow.ring(cue.stage, 'danger', { id, delay });
        tag(hero.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.01)' }, { transform: 'scale(1)' }], { duration: 500, delay }), id);
        break;
      case 'done':
        flow.sweep({ id, delay });
        break;
      default:
        break;
    }
  }

  return {
    el,
    update,
    animate,
    tick(nowMs) {
      lanes.tick(new Date(nowMs).toISOString());
      feed.tick(nowMs);
    },
    setAway: (n) => feed.setAway(n),
    redraw: () => flow.redraw(),
    destroy: () => flow.destroy(),
  };
}
