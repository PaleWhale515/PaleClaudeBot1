import { art, loadManifest } from './art.js';

const $app = document.getElementById('app');
const $toast = document.getElementById('toast');

const ui = {
  me: null,
  cat: null,
  tab: 'home',
  lastRoll: null,
  events: [],
  board: [],
  authMode: 'register',
  form: { background: 'dockhand', pronouns: 'they' },
  busy: false,
};

// ------------------------------------------------------------------ utils

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const rich = (s) =>
  esc(s)
    .split('\n\n')
    .map((p) => `<p>${p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>')}</p>`)
    .join('');

function clock(ms) {
  if (ms <= 0) return 'now';
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h ${m}m` : `${m}:${String(sec).padStart(2, '0')}`;
}

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

let toastTimer;
function toast(msg, bad = false) {
  $toast.textContent = msg;
  $toast.className = `show${bad ? ' bad' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($toast.className = ''), 3200);
}

async function api(path, body) {
  const res = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Run a game action, update state, show what happened.
async function act(path, body, { quiet = false } = {}) {
  if (ui.busy) return null;
  ui.busy = true;
  try {
    const data = await api(path, body);
    ui.me = data.me;
    for (const n of data.notices || []) toast(n);
    if (!quiet && data.result && data.result.text) toast(data.result.text, data.result.success === false);
    render();
    return data;
  } catch (e) {
    toast(e.message, true);
    if (e.status === 401) return boot();
    return null;
  } finally {
    ui.busy = false;
  }
}

// ------------------------------------------------------------------ boot

async function boot() {
  await loadManifest();
  ui.cat = ui.cat || (await api('/api/catalog'));
  try {
    const data = await api('/api/me');
    ui.me = data.me;
    for (const n of data.notices || []) toast(n);
    if (ui.me.scene) ui.tab = 'story';
  } catch {
    ui.me = null;
  }
  render();
}

// ------------------------------------------------------------------ auth

function authView() {
  const f = ui.form;
  const reg = ui.authMode === 'register';
  const bgs = Object.entries(ui.cat.backgrounds)
    .map(([id, b]) => `<button type="button" data-bg="${id}" class="${f.background === id ? 'on' : ''}"><div class="t">${esc(b.label)}</div><div class="d">${esc(b.desc)}</div></button>`)
    .join('');
  return `<div class="auth">
    <div class="hero">${art('gate')}</div>
    <div class="logo">WYRMHOLD</div>
    <p class="tag">Survive the war college. Win a wyrm. Choose your life.</p>
    <div class="seg"><button data-mode="register" class="${reg ? 'on' : ''}">New cadet</button><button data-mode="login" class="${reg ? '' : 'on'}">Sign in</button></div>
    <form id="auth">
      <label class="f">Username<input name="username" autocomplete="username" required minlength="3" maxlength="20" value="${esc(f.username || '')}"></label>
      <label class="f">Password<input name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" required minlength="8"></label>
      ${
        reg
          ? `<label class="f">Character name<input name="name" required maxlength="24" value="${esc(f.name || '')}" placeholder="What the ledger will call you"></label>
      <label class="f">Pronouns<select name="pronouns">${['she', 'he', 'they']
        .map((p) => `<option value="${p}" ${f.pronouns === p ? 'selected' : ''}>${{ she: 'she/her', he: 'he/him', they: 'they/them' }[p]}</option>`)
        .join('')}</select></label>
      <div class="small muted">Background</div>
      <div class="bgs">${bgs}</div>
      <label class="check"><input type="checkbox" name="adult" required> <span>I am 18 or older. Wyrmhold contains violence, death and romantic themes.</span></label>`
          : ''
      }
      <div class="err" id="err"></div>
      <button class="btn block" type="submit">${reg ? 'Climb the Cliff Stair' : 'Sign in'}</button>
    </form>
  </div>`;
}

function bindAuth() {
  $app.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = () => ((ui.authMode = b.dataset.mode), render())));
  $app.querySelectorAll('[data-bg]').forEach(
    (b) =>
      (b.onclick = () => {
        ui.form.background = b.dataset.bg;
        $app.querySelectorAll('[data-bg]').forEach((x) => x.classList.toggle('on', x === b));
      }),
  );
  const form = document.getElementById('auth');
  form.onsubmit = async (e) => {
    e.preventDefault();
    saveForm();
    const fd = new FormData(form);
    const body = Object.fromEntries(fd);
    body.adult = fd.get('adult') === 'on';
    body.background = ui.form.background;
    try {
      await api(ui.authMode === 'register' ? '/api/register' : '/api/login', body);
      ui.tab = ui.authMode === 'register' ? 'story' : 'home';
      await boot();
      if (ui.authMode === 'register' && !ui.me.scene) await act('/api/story/start', { chapter: 'stair' }, { quiet: true });
    } catch (err) {
      document.getElementById('err').textContent = err.message;
    }
  };
}

function saveForm() {
  const form = document.getElementById('auth');
  if (!form) return;
  for (const k of ['username', 'name', 'pronouns']) if (form[k]) ui.form[k] = form[k].value;
}

// ------------------------------------------------------------------ chrome

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  story: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M8 7h7M8 11h7"/>',
  campus: '<path d="M6 12h12M4 9v6M20 9v6M2 11v2M22 11v2"/>',
  night: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3-6 6.5-6s6 2 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c3 0 5 1.8 5.5 5"/>',
};

function header() {
  const m = ui.me;
  const regen = { energy: 5, nerve: 1, health: 5 };
  const bar = (k, label, color) => {
    const pct = Math.min(100, (m.bars[k] / m.maxes[k]) * 100);
    const next = m.nextRegen[k];
    return `<div class="bar"><div class="lbl"><span>${label}</span><b>${Math.floor(m.bars[k])}/${m.maxes[k]}</b></div>
      <div class="track"><div class="fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="next" ${next ? `data-until="${next}" data-prefix="+${regen[k]} in "` : ''}>${next ? '' : 'Full'}</div></div>`;
  };
  const span = m.nextLevelAt - m.thisLevelAt;
  const xp = Math.min(100, ((m.renown - m.thisLevelAt) / span) * 100);
  return `<header class="top">
    <div class="who">
      <div><div class="name ${m.patron ? 'patron' : ''}">${esc(m.name)}</div>
      <div class="meta">Level ${m.level} · ${m.renown} Renown${m.brand ? ` · ${esc(m.brand.label)}` : ''}</div></div>
      <button class="btn ghost" data-store style="min-height:34px;padding:6px 10px"><span class="crowns">◈ ${m.crowns}</span></button>
    </div>
    <div class="bars">${bar('energy', 'Energy', 'var(--energy)')}${bar('nerve', 'Nerve', 'var(--nerve)')}${bar('health', 'Health', 'var(--health)')}</div>
    <div class="xp" title="Renown to next level"><div style="width:${xp}%"></div></div>
  </header>`;
}

function nav() {
  const openStory = ui.me.chapters.some((c) => c.status === 'open') || ui.me.scene;
  const tabs = [
    ['home', 'Home'],
    ['story', 'Story', openStory],
    ['campus', 'Campus'],
    ['night', 'Night', ui.me.bars.nerve >= 2],
    ['people', 'People'],
  ];
  return `<nav class="tabs"><div class="inner">${tabs
    .map(([id, label, dot]) => `<button data-tab="${id}" class="${ui.tab === id ? 'on' : ''}"><svg viewBox="0 0 24 24">${ICONS[id]}</svg>${label}${dot && ui.tab !== id ? '<span class="dot"></span>' : ''}</button>`)
    .join('')}</div></nav>`;
}

function lockBanner() {
  const l = ui.me.lockout;
  if (!l) return '';
  const text = l.kind === 'infirmary' ? 'You are recovering in the infirmary.' : 'You are serving detention.';
  return `<div class="banner ${l.kind}"><b>${text}</b> <span class="muted">Free in <span data-until="${l.until}"></span></span></div>`;
}

// ------------------------------------------------------------------ home

function todo() {
  const m = ui.me;
  const items = [];
  if (m.scene) items.push(['story', `Continue “${m.scene.title}”`, 'Your story is waiting mid-scene.']);
  else {
    const open = m.chapters.find((c) => c.status === 'open' && c.kind === 'main') || m.chapters.find((c) => c.status === 'open');
    if (open) items.push(['story', `Play “${open.title}”`, open.blurb]);
  }
  if (m.bars.energy >= 10) items.push(['campus', 'Spend your Energy', `${Math.floor(m.bars.energy)} Energy: train, work a shift, or talk to someone.`]);
  if (m.bars.nerve >= 2) items.push(['night', 'Run a Night Errand', `${m.bars.nerve} Nerve to spend on risky business.`]);
  if (!m.course) items.push(['campus', 'Enroll in a course', 'Courses run in real time while you’re away.']);
  const ready = m.companions.find((c) => c.met && c.readyAt <= Date.now());
  if (ready) items.push(['people', `Talk to ${ready.name}`, 'Raise Affection to unlock their story.']);
  return items.slice(0, 4);
}

function homeView() {
  const m = ui.me;
  const course = m.course
    ? `<div class="card"><div class="row" style="padding:0;border:0;background:none"><div class="grow"><div class="title">${esc(m.course.label)}</div><div class="sub">Course in progress</div></div><span class="pill ember" data-until="${m.course.endsAt}"></span></div></div>`
    : '';
  return `${lockBanner()}
    <div class="section"><h2>Things to do</h2><div class="list">${todo()
      .map(([tab, t, s]) => `<button class="row" data-tab="${tab}"><div class="grow"><div class="title">${esc(t)}</div><div class="sub">${esc(s)}</div></div><span class="muted">›</span></button>`)
      .join('') || '<div class="card muted">You’ve done everything for now. Your bars refill while you’re away.</div>'}</div></div>
    ${course ? `<div class="section">${course}</div>` : ''}
    <div class="section"><h2>Your cadet</h2>
      <div class="stats">${Object.entries(ui.cat.stats).map(([k, l]) => `<div class="stat" data-tab="campus"><div class="v">${m.stats[k]}</div><div class="k">${l}</div></div>`).join('')}</div>
      <div class="small muted" style="margin-top:8px">${esc(m.background)} · ${m.wins}W / ${m.losses}L in duels${m.romance ? ` · with ${esc(m.companions.find((c) => c.id === m.romance).name)}` : ''}</div>
      ${m.brand ? `<div class="card" style="margin-top:10px"><div class="title">Brand: ${esc(m.brand.label)}</div><div class="sub muted small">${esc(m.brand.desc)}</div></div>` : ''}
    </div>
    ${
      m.patron
        ? ''
        : `<div class="section"><button class="card seal row" data-store><div class="grow"><div class="title">Patron’s Seal</div><div class="sub">150 Energy, faster regen, gold name. Support Wyrmhold.</div></div><span class="pill ember">Store</span></button></div>`
    }
    <div class="section"><h2>Recent <button class="btn ghost small" data-refresh-events style="min-height:28px;padding:2px 10px">Refresh</button></h2>
      <div class="feed">${ui.events.map((e) => `<div class="ev"><time>${ago(e.at)}</time><span>${esc(e.text)}</span></div>`).join('') || '<div class="muted small">Nothing yet.</div>'}</div></div>
    <div class="section" style="text-align:center"><button class="btn ghost" data-logout>Sign out</button></div>`;
}

// ------------------------------------------------------------------ story

const NAMES = { rhaelle: 'Rhaelle Sund', dax: 'Dax Morrow', isolde: 'Isolde Crane', corvin: 'Corvin Ashe', holt: 'Commandant Holt', oril: 'Master Oril', grel: 'Grel' };

function rollView() {
  const r = ui.lastRoll;
  if (!r) return '';
  const parts = [];
  if (r.roll) {
    const x = r.roll;
    parts.push(`<span class="die">d20: ${x.die}</span> + ${x.mod} = <b>${x.total}</b> vs ${x.dc} (${esc(ui.cat.stats[x.stat])}) — <b>${x.success ? 'Success' : 'Failure'}</b>`);
  }
  if (r.gained && r.gained.length) parts.push(`<div class="muted">${r.gained.map(esc).join(' · ')}</div>`);
  if (!parts.length) return '';
  return `<div class="roll ${r.roll ? (r.roll.success ? 'ok' : 'no') : ''}">${parts.join('')}</div>`;
}

function storyView() {
  const m = ui.me;
  if (m.scene) {
    const sc = m.scene;
    return `${lockBanner()}<div class="section">
      <div class="scene-art">${art(sc.art)}<div class="chapter">${esc(sc.title)}</div></div>
      ${rollView()}
      ${sc.portrait ? `<div class="speaker"><div class="portrait big">${art(sc.portrait, 'portrait')}</div><div class="title">${esc(sc.speaker || NAMES[sc.portrait] || '')}</div></div>` : ''}
      <div class="story-text">${rich(sc.text)}</div>
      <div class="choices">${sc.choices
        .map((c) => `<button class="choice" data-choice="${c.index}" ${m.lockout ? 'disabled' : ''}><span>${esc(c.text)}</span>${c.check ? `<span class="pill">${esc(c.check.stat)} ${c.check.dc}</span>` : ''}</button>`)
        .join('')}</div></div>`;
  }
  const section = (kind, title) => {
    const list = m.chapters.filter((c) => c.kind === kind);
    return `<div class="section"><h2>${title}</h2><div class="list">${list
      .map(
        (c) => `<button class="row chapter-card ${c.status}" ${c.status === 'open' ? `data-chapter="${c.id}"` : 'disabled'}>
        <div class="thumb">${art(c.art)}</div>
        <div><div class="title">${esc(c.title)}</div><div class="sub">${esc(c.status === 'locked' ? c.reason : c.blurb)}</div>
        ${c.status === 'done' ? '<span class="pill good">Complete</span>' : c.status === 'open' ? '<span class="pill ember">Play</span>' : ''}</div></button>`,
      )
      .join('')}</div></div>`;
  };
  const last = ui.lastRoll && ui.lastRoll.finished ? `<div class="banner info"><b>Chapter complete: ${esc(ui.lastRoll.finished)}</b>${ui.lastRoll.gained.length ? `<div class="small muted">${ui.lastRoll.gained.map(esc).join(' · ')}</div>` : ''}</div>` : '';
  return `${lockBanner()}${last}${section('main', 'Year One')}${section('companion', 'Companions')}`;
}

// ------------------------------------------------------------------ campus

function campusView() {
  const m = ui.me;
  const c = ui.cat;
  const locked = !!m.lockout;
  const train = Object.entries(c.stats)
    .map(([k, l]) => `<button class="stat" data-train="${k}" ${locked || m.bars.energy < c.costs.train ? 'disabled' : ''}><div class="v">${m.stats[k]}</div><div class="k">${l}</div></button>`)
    .join('');
  const jobs = Object.entries(c.jobs)
    .map(([id, j]) => `<div class="row"><div class="grow"><div class="title">${esc(j.label)}</div><div class="sub">${c.costs.job} Energy · ~${j.pay + (m.level - 1) * 2}${j.tips ? '+tips' : ''} crowns · +${esc(c.stats[j.stat])}</div></div><button class="btn" data-work="${id}" ${locked || m.bars.energy < c.costs.job ? 'disabled' : ''}>Work</button></div>`)
    .join('');
  const courses = Object.entries(c.courses)
    .map(([id, co]) => {
      const done = m.coursesDone.includes(id);
      const active = m.course && m.course.id === id;
      let btn;
      if (done) btn = '<span class="pill good">Done</span>';
      else if (active) btn = `<span class="pill ember" data-until="${m.course.endsAt}"></span>`;
      else if (m.level < co.level) btn = `<span class="pill">Lv ${co.level}</span>`;
      else btn = `<button class="btn" data-course="${id}" ${m.course || m.crowns < co.cost ? 'disabled' : ''}>${co.cost} ◈</button>`;
      const hrs = co.minutes >= 60 ? `${co.minutes / 60}h` : `${co.minutes}m`;
      return `<div class="row"><div class="grow"><div class="title">${esc(co.label)}</div><div class="sub">${esc(co.desc)} · ${hrs}</div></div>${btn}</div>`;
    })
    .join('');
  return `${lockBanner()}
    <div class="section"><h2>Train <span class="small muted">${c.costs.train} Energy each</span></h2><div class="stats">${train}</div>
      <div class="small muted" style="margin-top:6px">Gains shrink as a stat grows. Checks use stat ÷ 5 as your bonus.</div></div>
    <div class="section"><h2>Work a shift</h2><div class="list">${jobs}</div></div>
    <div class="section"><h2>Courses</h2><div class="list">${courses}</div></div>`;
}

// ------------------------------------------------------------------ night

function nightView() {
  const m = ui.me;
  const c = ui.cat;
  const list = Object.entries(c.errands)
    .map(([id, e]) => {
      const lockedLv = m.level < e.level;
      return `<div class="row"><div class="grow"><div class="title">${esc(e.label)}</div>
        <div class="sub">${e.nerve} Nerve · ${esc(c.stats[e.stat])} ${e.dc} · fail: ${e.fail.kind} ${e.fail.minutes}m</div></div>
        ${lockedLv ? `<span class="pill">Lv ${e.level}</span>` : `<button class="btn" data-errand="${id}" ${m.lockout || m.bars.nerve < e.nerve ? 'disabled' : ''}>Go</button>`}</div>`;
    })
    .join('');
  return `${lockBanner()}<div class="section"><h2>Night Errands</h2>
    <p class="small muted" style="margin-top:-4px">Quick, risky, and against the rules. Nerve refills 1 every 5 minutes.</p>
    ${rollView()}<div class="list" style="margin-top:10px">${list}</div></div>`;
}

// ------------------------------------------------------------------ people

function peopleView() {
  const m = ui.me;
  const comps = m.companions
    .map((c) => {
      const cool = c.readyAt > Date.now();
      let btn;
      if (!c.met) btn = '<span class="pill">Not met</span>';
      else if (cool) btn = `<span class="pill" data-until="${c.readyAt}"></span>`;
      else btn = `<button class="btn" data-talk="${c.id}" ${m.lockout || m.bars.energy < ui.cat.costs.talk ? 'disabled' : ''}>Talk</button>`;
      return `<div class="row"><div class="portrait">${art(c.id, 'portrait')}</div><div class="grow"><div class="title">${esc(c.met ? c.name : '???')}${m.romance === c.id ? ' ♥' : ''}</div>
        <div class="sub">${esc(c.met ? c.title : 'You haven’t met yet.')}</div>${c.met ? `<div class="affection"><div style="width:${c.affection}%"></div></div>` : ''}</div>${btn}</div>`;
    })
    .join('');
  const board = ui.board
    .map(
      (p, i) => `<div class="row"><div style="width:22px" class="muted">${i + 1}</div><div class="grow"><div class="title" style="${p.patron ? 'color:var(--gold)' : ''}">${esc(p.name)}${p.you ? ' (you)' : ''}</div>
      <div class="sub">Lv ${p.level} · ${p.renown} Renown${p.brand ? ` · ${esc(p.brand)}` : ''} · ${p.wins} wins</div></div>
      ${p.you ? '' : p.available ? `<button class="btn ghost" data-duel="${p.id}" ${m.lockout || m.bars.energy < ui.cat.costs.duel ? 'disabled' : ''}>Duel</button>` : '<span class="pill">Away</span>'}</div>`,
    )
    .join('');
  return `${lockBanner()}
    <div class="section"><h2>Companions <span class="small muted">${ui.cat.costs.talk} Energy</span></h2><div class="list">${comps}</div></div>
    <div class="section"><h2>The Yard <span class="small muted">Duel: ${ui.cat.costs.duel} Energy</span></h2><div class="list">${board || '<div class="muted small">Loading…</div>'}</div></div>`;
}

// ------------------------------------------------------------------ store

function openStore() {
  const packs = Object.entries(ui.cat.packs)
    .map(
      ([id, p]) => `<div class="card seal"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${esc(p.label)}</h3><span class="price">${esc(p.price)}</span></div>
      <ul class="perks"><li>Energy cap 150 and faster regen</li><li>Nerve cap 25</li><li>Gold name and Patron title</li></ul>
      <button class="btn block" data-buy="${id}">Become a Patron</button></div>`,
    )
    .join('');
  const el = document.createElement('div');
  el.className = 'modal';
  el.innerHTML = `<div class="sheet"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2>The Patron Store</h2><button class="btn ghost" data-close>Close</button></div>
    ${ui.me.patron ? `<div class="banner info">You are a Patron until ${new Date(ui.me.patronUntil).toLocaleDateString()}. Thank you.</div>` : ''}
    <p class="small muted">Patrons keep Wyrmhold running. Seals give convenience and style, never stats or story.</p>${packs}</div>`;
  el.onclick = async (e) => {
    if (e.target === el || e.target.closest('[data-close]')) return el.remove();
    const buy = e.target.closest('[data-buy]');
    if (buy) {
      try {
        const r = await api('/api/store/checkout', { pack: buy.dataset.buy });
        if (r.url) location.href = r.url;
      } catch (err) {
        toast(err.message, true);
      }
    }
  };
  document.body.appendChild(el);
}

// ------------------------------------------------------------------ render

function render() {
  if (!ui.me) {
    $app.innerHTML = authView();
    bindAuth();
    return;
  }
  const views = { home: homeView, story: storyView, campus: campusView, night: nightView, people: peopleView };
  $app.innerHTML = `<div class="shell">${header()}<main>${views[ui.tab]()}</main></div>${nav()}`;
  updateTimers();
}

async function switchTab(tab) {
  if (tab !== ui.tab) ui.lastRoll = null;
  ui.tab = tab;
  render();
  window.scrollTo(0, 0);
  if (tab === 'home') loadEvents();
  if (tab === 'people') loadBoard();
}

async function loadEvents() {
  try {
    ui.events = (await api('/api/events')).events;
    if (ui.tab === 'home') render();
  } catch {}
}

async function loadBoard() {
  try {
    ui.board = (await api('/api/leaderboard')).players;
    if (ui.tab === 'people') render();
  } catch {}
}

$app.addEventListener('click', async (e) => {
  const t = e.target.closest('button, [data-tab]');
  if (!t || t.disabled || !ui.me) return;
  const d = t.dataset;
  if (d.tab) return switchTab(d.tab);
  if ('store' in d) return openStore();
  if ('logout' in d) {
    await api('/api/logout', {}).catch(() => {});
    ui.me = null;
    return render();
  }
  if ('refreshEvents' in d) return loadEvents();
  if (d.train) return act('/api/train', { stat: d.train });
  if (d.work) return act('/api/work', { job: d.work });
  if (d.course) return act('/api/course', { id: d.course });
  if (d.talk) return act('/api/talk', { companion: d.talk });
  if (d.errand) {
    const r = await act('/api/errand', { id: d.errand }, { quiet: true });
    if (r) {
      ui.lastRoll = { roll: r.result.roll, gained: [r.result.text] };
      toast(r.result.text, !r.result.success);
      render();
    }
    return;
  }
  if (d.duel) {
    const r = await act('/api/duel', { target: Number(d.duel) });
    if (r) loadBoard();
    return;
  }
  if (d.chapter) {
    ui.lastRoll = null;
    const r = await act('/api/story/start', { chapter: d.chapter }, { quiet: true });
    if (r) window.scrollTo(0, 0);
    return;
  }
  if (d.choice) {
    const r = await act('/api/story/choose', { choice: Number(d.choice) }, { quiet: true });
    if (r) {
      ui.lastRoll = r.result;
      if (r.result.finished) toast(`Chapter complete: ${r.result.finished}`);
      render();
      window.scrollTo(0, 0);
    }
  }
});

// Live countdowns; refresh from the server when something finishes.
let refreshing = false;
function updateTimers() {
  const now = Date.now();
  let due = false;
  document.querySelectorAll('[data-until]').forEach((el) => {
    const left = Number(el.dataset.until) - now;
    if (left <= 0) due = true;
    el.textContent = (el.dataset.prefix || '') + clock(left);
  });
  if (due && !refreshing && ui.me) {
    refreshing = true;
    api('/api/me')
      .then((d) => {
        ui.me = d.me;
        for (const n of d.notices || []) toast(n);
        render();
      })
      .catch(() => {})
      .finally(() => setTimeout(() => (refreshing = false), 3000));
  }
}
setInterval(updateTimers, 1000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ui.me) boot();
});

boot();
