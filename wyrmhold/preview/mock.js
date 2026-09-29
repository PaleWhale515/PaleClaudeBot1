// Preview build: runs the real engine in the browser and answers the game's
// /api/* calls locally, so the prototype can be played without a server.
// Progress is kept in this browser's storage. Three NPC rivals fill the yard.

import * as E from '../src/engine.js';

const KEY = 'wyrmhold-preview-v1';
const realNow = Date.now.bind(Date);
let db = load();
Date.now = () => realNow() + (db.offset || 0);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { offset: 0, users: {}, current: null, events: [], npcs: null };
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {}
}

function npcs() {
  if (db.npcs) return db.npcs;
  const now = Date.now();
  const mk = (name, pronouns, background, renown, bump) => {
    const s = E.newPlayer({ name, pronouns, background }, now);
    s.renown = renown;
    for (const [k, v] of Object.entries(bump)) s.stats[k] += v;
    return s;
  };
  db.npcs = {
    101: mk('Brask Holloway', 'he', 'dockhand', 40, { might: 6 }),
    102: mk('Sera Vex', 'she', 'thief', 110, { grace: 8, will: 4 }),
    103: mk('Tomas Reed', 'he', 'scholar', 15, { wit: 3 }),
  };
  return db.npcs;
}

const me = () => db.current && db.users[db.current];
const ev = (text) => {
  db.events.unshift({ at: Date.now(), text });
  db.events = db.events.slice(0, 30);
};

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function withPlayer(action) {
  const u = me();
  if (!u) throw new HttpError('Not signed in.', 401);
  const now = Date.now();
  const notices = E.tick(u.state, now);
  const result = action(u.state, now) || {};
  notices.forEach(ev);
  if (result.finished) ev(`Chapter complete: ${result.finished}.`);
  return { me: E.view(u.state, now), result, notices };
}

function route(path, body) {
  if (path === '/api/catalog') return E.catalog();
  if (path === '/api/register') {
    const username = String(body.username || '').trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new HttpError('Username must be 3–20 letters, numbers or underscores.');
    if (String(body.password || '').length < 8) throw new HttpError('Password must be at least 8 characters.');
    const name = String(body.name || '').trim();
    if (name.length < 2) throw new HttpError('Character name must be 2–24 letters.');
    if (body.adult !== true) throw new HttpError('You must confirm you are 18 or older.');
    if (db.users[username]) throw new HttpError('That username is taken.', 409);
    db.users[username] = { password: body.password, state: E.newPlayer({ name, pronouns: body.pronouns, background: body.background }, Date.now()) };
    db.current = username;
    db.events = [];
    ev(`${name} arrived at the foot of the Cliff Stair.`);
    return { ok: true };
  }
  if (path === '/api/login') {
    const u = db.users[String(body.username || '').trim().toLowerCase()];
    if (!u || u.password !== body.password) throw new HttpError('Wrong username or password.', 401);
    db.current = String(body.username).trim().toLowerCase();
    return { ok: true };
  }
  if (!me()) throw new HttpError('Not signed in.', 401);
  if (path === '/api/logout') {
    db.current = null;
    return { ok: true };
  }
  if (path === '/api/me') return withPlayer(() => ({}));
  if (path === '/api/events') return { events: db.events };
  if (path === '/api/leaderboard') {
    const now = Date.now();
    const all = [[0, me().state], ...Object.entries(npcs()).map(([id, s]) => [Number(id), s])];
    all.forEach(([, s]) => E.tick(s, now));
    return {
      players: all
        .sort((a, b) => b[1].renown - a[1].renown)
        .map(([id, s]) => ({
          id,
          you: id === 0,
          name: s.name,
          level: E.level(s.renown),
          renown: s.renown,
          patron: E.isPatron(s, now),
          brand: s.brand ? E.BRANDS[s.brand].label : null,
          wins: s.wins || 0,
          available: !(s.lockout && s.lockout.until > now) && !((s.protectedUntil || 0) > now),
        })),
    };
  }
  if (path === '/api/duel') {
    const target = npcs()[Number(body.target)];
    if (!target) throw new HttpError('Pick someone else to duel.');
    return withPlayer((s, now) => {
      E.tick(target, now);
      const r = E.duel(s, target, now, Math.random);
      const text = r.attackerWins
        ? `You challenged ${target.name} and won. +${r.renown} Renown${r.stolen ? `, +${r.stolen} crowns` : ''}.`
        : `You challenged ${target.name} and lost (-${r.dmg} Health${r.stolen ? `, -${r.stolen} crowns` : ''}).`;
      ev(text);
      return { ...r, text, success: r.attackerWins };
    });
  }
  if (path === '/api/store/checkout') throw new HttpError('The Patron store opens soon. Payments are not live yet.', 501);
  const actions = {
    '/api/train': (s, now) => E.train(s, body.stat, now),
    '/api/work': (s, now) => E.work(s, body.job, now, Math.random),
    '/api/course': (s, now) => E.startCourse(s, body.id, now),
    '/api/errand': (s, now) => E.errand(s, body.id, now, Math.random),
    '/api/talk': (s, now) => E.talk(s, body.companion, now, Math.random),
    '/api/story/start': (s) => E.startChapter(s, body.chapter),
    '/api/story/choose': (s, now) => E.choose(s, Number(body.choice), now, Math.random),
  };
  if (actions[path]) return withPlayer(actions[path]);
  throw new HttpError('Not found.', 404);
}

const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url === '/art/manifest.json') return new Response('[]', { status: 200 });
  if (!url.startsWith('/api/')) return realFetch(input, init);
  let status = 200;
  let data;
  try {
    data = route(url, init.body ? JSON.parse(init.body) : {});
  } catch (e) {
    status = e.status || (e instanceof E.GameError ? e.status : 500);
    data = { error: e.message };
  }
  save();
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
};

// ------------------------------------------------------------ preview tools

function refresh() {
  document.dispatchEvent(new Event('visibilitychange'));
}

function tools() {
  const wrap = document.createElement('div');
  wrap.className = 'pv';
  wrap.innerHTML = `<button class="pv-toggle" type="button" aria-expanded="false">Preview tools</button>
    <div class="pv-panel" hidden>
      <p>This preview runs in your browser. Progress is saved on this device only.</p>
      <button type="button" data-ff="60">Skip ahead 1 hour</button>
      <button type="button" data-ff="480">Skip ahead 8 hours</button>
      <button type="button" data-renown="100">Grant 100 Renown (unlock chapters)</button>
      <button type="button" data-affection>+20 Affection with everyone</button>
      <button type="button" data-reset class="danger">Start over</button>
    </div>`;
  const panel = wrap.querySelector('.pv-panel');
  const toggle = wrap.querySelector('.pv-toggle');
  toggle.onclick = () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  };
  panel.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const u = me();
    if (b.dataset.ff) db.offset = (db.offset || 0) + Number(b.dataset.ff) * 60_000;
    if (b.dataset.renown && u) u.state.renown += Number(b.dataset.renown);
    if ('affection' in b.dataset && u) for (const k of Object.keys(u.state.affection)) u.state.affection[k] = Math.min(100, u.state.affection[k] + 20);
    if ('reset' in b.dataset) {
      db = { offset: 0, users: {}, current: null, events: [], npcs: null };
    }
    save();
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    refresh();
  };
  document.body.appendChild(wrap);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tools);
else tools();
