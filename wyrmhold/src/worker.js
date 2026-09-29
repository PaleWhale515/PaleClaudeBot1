// Wyrmhold API + static site, served from one Cloudflare Worker.
// Every game action loads the player's state, brings it up to date with
// `tick`, runs a pure engine function, and saves with a version check.

import * as E from './engine.js';
import { hashPassword, verifyPassword, newToken, sha256 } from './auth.js';

const SESSION_COOKIE = 'wh_session';
const SESSION_DAYS = 30;
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const NAME_RE = /^[\p{L}][\p{L} '\-.]{1,23}$/u;

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await route(request, env, url);
    } catch (err) {
      if (err instanceof HttpError || err instanceof E.GameError) return json({ error: err.message }, err.status);
      console.error(err);
      return json({ error: 'Something went wrong.' }, 500);
    }
  },
};

async function route(request, env, url) {
  const { pathname: path } = url;
  const method = request.method;
  let body = {};
  if (method === 'POST') {
    // JSON-only POSTs plus an Origin check keep cross-site forms from acting as the player.
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin) throw new HttpError('Bad origin.', 403);
    if (!(request.headers.get('content-type') || '').includes('application/json')) throw new HttpError('Expected JSON.', 415);
    body = await request.json().catch(() => ({}));
  }

  if (method === 'GET' && path === '/api/catalog') return json(E.catalog());
  if (method === 'POST' && path === '/api/register') return register(env, body);
  if (method === 'POST' && path === '/api/login') return login(env, body);
  if (method === 'POST' && path === '/api/admin/patron') return adminPatron(request, env, body);

  const user = await currentUser(request, env);
  if (!user) throw new HttpError('Not signed in.', 401);

  if (method === 'POST' && path === '/api/logout') return logout(request, env);
  if (method === 'GET' && path === '/api/me') return withPlayer(env, user.id, () => ({}));
  if (method === 'GET' && path === '/api/events') return events(env, user.id);
  if (method === 'GET' && path === '/api/leaderboard') return leaderboard(env, user.id);
  if (method === 'POST' && path === '/api/duel') return duel(env, user.id, body);
  if (method === 'POST' && path === '/api/store/checkout') return checkout(env, body);

  const actions = {
    '/api/train': (s, now) => E.train(s, body.stat, now),
    '/api/work': (s, now) => E.work(s, body.job, now, Math.random),
    '/api/course': (s, now) => E.startCourse(s, body.id, now),
    '/api/errand': (s, now) => E.errand(s, body.id, now, Math.random),
    '/api/talk': (s, now) => E.talk(s, body.companion, now, Math.random),
    '/api/story/start': (s) => E.startChapter(s, body.chapter),
    '/api/story/choose': (s, now) => E.choose(s, Number(body.choice), now, Math.random),
  };
  if (method === 'POST' && actions[path]) return withPlayer(env, user.id, actions[path], path);

  throw new HttpError('Not found.', 404);
}

// ------------------------------------------------------------------ auth

async function register(env, b) {
  const username = String(b.username || '').trim();
  const password = String(b.password || '');
  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  if (!USERNAME_RE.test(username)) throw new HttpError('Username must be 3–20 letters, numbers or underscores.');
  if (password.length < 8 || password.length > 200) throw new HttpError('Password must be at least 8 characters.');
  if (!NAME_RE.test(name)) throw new HttpError('Character name must be 2–24 letters.');
  if (b.adult !== true) throw new HttpError('You must confirm you are 18 or older.');

  const now = Date.now();
  const state = E.newPlayer({ name, pronouns: b.pronouns, background: b.background }, now);
  const { hash, salt } = await hashPassword(password);
  const existing = await env.DB.prepare('SELECT 1 FROM users WHERE username = ?').bind(username).first();
  if (existing) throw new HttpError('That username is taken.', 409);
  const nameTaken = await env.DB.prepare('SELECT 1 FROM players WHERE name = ? COLLATE NOCASE').bind(name).first();
  if (nameTaken) throw new HttpError('Another cadet already goes by that name.', 409);
  const res = await env.DB.prepare('INSERT INTO users (username, pass_hash, pass_salt, created_at) VALUES (?, ?, ?, ?)')
    .bind(username, hash, salt, now)
    .run();
  const userId = res.meta.last_row_id;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO players (user_id, name, renown, patron_until, state, version, updated_at) VALUES (?, ?, 0, 0, ?, 0, ?)').bind(
      userId,
      name,
      JSON.stringify(state),
      now,
    ),
    env.DB.prepare('INSERT INTO events (user_id, at, text) VALUES (?, ?, ?)').bind(userId, now, `${name} arrived at the foot of the Cliff Stair.`),
  ]);
  return startSession(env, userId);
}

async function login(env, b) {
  const username = String(b.username || '').trim();
  const row = await env.DB.prepare('SELECT id, pass_hash, pass_salt FROM users WHERE username = ?').bind(username).first();
  const ok = row && (await verifyPassword(String(b.password || ''), row.pass_hash, row.pass_salt));
  if (!ok) throw new HttpError('Wrong username or password.', 401);
  return startSession(env, row.id);
}

async function startSession(env, userId) {
  const token = newToken();
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), userId, expires).run();
  const cookie = `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}`;
  return json({ ok: true }, 200, { 'set-cookie': cookie });
}

function readToken(request) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([a-f0-9]{64})`));
  return m ? m[1] : null;
}

async function currentUser(request, env) {
  const token = readToken(request);
  if (!token) return null;
  const row = await env.DB.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?').bind(await sha256(token)).first();
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.user_id };
}

async function logout(request, env) {
  const token = readToken(request);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return json({ ok: true }, 200, { 'set-cookie': `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0` });
}

// ---------------------------------------------------------------- player

async function loadPlayer(env, userId) {
  const row = await env.DB.prepare('SELECT state, version FROM players WHERE user_id = ?').bind(userId).first();
  if (!row) throw new HttpError('No character found.', 404);
  return { state: JSON.parse(row.state), version: row.version };
}

function saveStatement(env, userId, state, version, now) {
  return env.DB.prepare(
    'UPDATE players SET state = ?, name = ?, renown = ?, patron_until = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND version = ?',
  ).bind(JSON.stringify(state), state.name, state.renown, state.patronUntil || 0, now, userId, version);
}

const eventStatement = (env, userId, now, text) => env.DB.prepare('INSERT INTO events (user_id, at, text) VALUES (?, ?, ?)').bind(userId, now, text);

async function withPlayer(env, userId, action) {
  const now = Date.now();
  const { state, version } = await loadPlayer(env, userId);
  const notices = E.tick(state, now);
  const result = action(state, now) || {};
  const stmts = [saveStatement(env, userId, state, version, now)];
  for (const n of notices) stmts.push(eventStatement(env, userId, now, n));
  if (result.finished) stmts.push(eventStatement(env, userId, now, `Chapter complete: ${result.finished}.`));
  const [save] = await env.DB.batch(stmts);
  if (save.meta.changes !== 1) throw new HttpError('Your character was busy. Try again.', 409);
  return json({ me: E.view(state, now), result, notices });
}

async function events(env, userId) {
  const { results } = await env.DB.prepare('SELECT at, text FROM events WHERE user_id = ? ORDER BY at DESC, id DESC LIMIT 30').bind(userId).all();
  return json({ events: results });
}

async function leaderboard(env, userId) {
  const now = Date.now();
  const { results } = await env.DB.prepare('SELECT user_id, name, renown, patron_until, state FROM players ORDER BY renown DESC LIMIT 50').all();
  return json({
    players: results.map((r) => {
      const s = JSON.parse(r.state);
      return {
        id: r.user_id,
        you: r.user_id === userId,
        name: r.name,
        level: E.level(r.renown),
        renown: r.renown,
        patron: r.patron_until > now,
        brand: s.brand ? E.BRANDS[s.brand].label : null,
        wins: s.wins || 0,
        available: !(s.lockout && s.lockout.until > now) && !((s.protectedUntil || 0) > now),
      };
    }),
  });
}

async function duel(env, userId, b) {
  const targetId = Number(b.target);
  if (!Number.isInteger(targetId) || targetId === userId) throw new HttpError('Pick someone else to duel.');
  const now = Date.now();
  const me = await loadPlayer(env, userId);
  const them = await loadPlayer(env, targetId);
  const notices = E.tick(me.state, now);
  E.tick(them.state, now);
  const r = E.duel(me.state, them.state, now, Math.random);
  const a = me.state.name;
  const d = them.state.name;
  const myText = r.attackerWins
    ? `You challenged ${d} and won. +${r.renown} Renown${r.stolen ? `, +${r.stolen} crowns` : ''}.`
    : `You challenged ${d} and lost (-${r.dmg} Health${r.stolen ? `, -${r.stolen} crowns` : ''}).`;
  const theirText = r.attackerWins
    ? `${a} challenged you and won (-${r.dmg} Health${r.stolen ? `, -${r.stolen} crowns` : ''}).`
    : `${a} challenged you and lost. +${r.renown} Renown${r.stolen ? `, +${r.stolen} crowns` : ''}.`;
  const [s1, s2] = await env.DB.batch([
    saveStatement(env, userId, me.state, me.version, now),
    saveStatement(env, targetId, them.state, them.version, now),
    eventStatement(env, userId, now, myText),
    eventStatement(env, targetId, now, theirText),
  ]);
  if (s1.meta.changes !== 1 || s2.meta.changes !== 1) throw new HttpError('The yard was too crowded. Try again.', 409);
  return json({ me: E.view(me.state, now), result: { ...r, text: myText }, notices });
}

// ----------------------------------------------------------------- store

async function checkout(env, b) {
  if (!E.PACKS[b.pack]) throw new HttpError('Unknown pack.');
  if (!env.STRIPE_SECRET_KEY) throw new HttpError('The Patron store opens soon. Payments are not live yet.', 501);
  // Stripe Checkout goes here: create a session with client_reference_id = user id,
  // then grant the Seal from a verified webhook (never from the browser).
  throw new HttpError('Payments are not live yet.', 501);
}

async function adminPatron(request, env, b) {
  const auth = request.headers.get('authorization') || '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) throw new HttpError('Not found.', 404);
  const row = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(String(b.username || '')).first();
  if (!row) throw new HttpError('No such user.', 404);
  const days = Math.max(1, Math.min(365, Number(b.days) || 30));
  return withPlayer(env, row.id, (s, now) => {
    E.grantPatron(s, days, now);
    return { text: `Granted ${days} days of Patron’s Seal.` };
  });
}
