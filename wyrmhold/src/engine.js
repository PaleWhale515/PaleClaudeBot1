// Pure game rules. Every function takes the player state, the current time
// and an injectable rng so the server stays authoritative and tests stay
// deterministic. Nothing in here touches the database or the network.

import { CHAPTERS, COMPANIONS } from './content/story.js';

export const MIN = 60_000;
export const STATS = ['might', 'grace', 'wit', 'will', 'charm'];
export const STAT_LABEL = { might: 'Might', grace: 'Grace', wit: 'Wit', will: 'Will', charm: 'Charm' };
export const PRONOUNS = {
  she: { they: 'she', them: 'her', their: 'her' },
  he: { they: 'he', them: 'him', their: 'his' },
  they: { they: 'they', them: 'them', their: 'their' },
};

export const BACKGROUNDS = {
  dockhand: { label: 'Dockhand’s child', desc: 'You grew up hauling rope in Varnhollow.', stats: { might: 4, will: 2 }, crowns: 10 },
  noble: { label: 'Minor noble', desc: 'A good name, a thin purse, and excellent manners.', stats: { charm: 4, wit: 2 }, crowns: 40 },
  scholar: { label: 'Temple scholar', desc: 'Raised among books by patient priests.', stats: { wit: 4, will: 2 }, crowns: 20 },
  thief: { label: 'Street runner', desc: 'Rooftops, pockets, and never getting caught.', stats: { grace: 4, charm: 2 }, crowns: 25 },
};

export const BRANDS = {
  stormcall: { label: 'Stormcall', desc: 'Lightning answers you. +15 duel power.' },
  veilstep: { label: 'Veilstep', desc: 'You step through shadow. +2 on Night Errands.' },
  mindthread: { label: 'Mindthread', desc: 'You hear surface thoughts. +2 on Charm checks.' },
  ironskin: { label: 'Ironskin', desc: 'Your skin hardens like plate. Take 30% less duel damage.' },
  emberheart: { label: 'Emberheart', desc: 'Fire lives in your chest. +8 duel power, 15% less damage.' },
  tidesense: { label: 'Tidesense', desc: 'You feel the sea and what moves beneath it. +2 on Wit checks.' },
};

export const JOBS = {
  docks: { label: 'Haul cargo on the Varnhollow docks', stat: 'might', pay: 12 },
  courier: { label: 'Run letters across the upper city', stat: 'grace', pay: 12 },
  scriptorium: { label: 'Copy charts in the Lantern scriptorium', stat: 'wit', pay: 12 },
  tavern: { label: 'Pour drinks at the Gilded Gull', stat: 'charm', pay: 9, tips: 8 },
};
export const JOB_ENERGY = 15;
export const TRAIN_ENERGY = 10;
export const TALK_ENERGY = 5;
export const DUEL_ENERGY = 20;
export const TALK_COOLDOWN = 30 * MIN;
export const DUEL_PROTECTION = 10 * MIN;

export const COURSES = {
  drills: { label: 'Cliffside Conditioning', desc: '+10% gains from training.', cost: 20, minutes: 15, level: 1 },
  etiquette: { label: 'Court Etiquette of Caldris', desc: '+1 on Charm checks, +1 Affection per talk.', cost: 40, minutes: 30, level: 1 },
  anatomy: { label: 'Wyrm Anatomy I', desc: '+15 Renown. Wyrms find you less alarming.', cost: 60, minutes: 60, level: 2 },
  lockcraft: { label: 'Locks, Seals & Ciphers', desc: '+1 on Night Errands.', cost: 90, minutes: 120, level: 2 },
  fieldmed: { label: 'Field Medicine', desc: 'Infirmary stays are halved.', cost: 150, minutes: 240, level: 3 },
  tactics: { label: 'Wing Tactics', desc: '+10 duel power.', cost: 250, minutes: 480, level: 3 },
};

export const ERRANDS = {
  pastry: { label: 'Steal a honey pastry from the officers’ mess', nerve: 2, stat: 'grace', dc: 8, level: 1, crowns: [3, 8], renown: 2, fail: { kind: 'detention', minutes: 5 } },
  pass: { label: 'Forge a leave pass to Varnhollow', nerve: 3, stat: 'wit', dc: 11, level: 1, crowns: [10, 20], renown: 3, fail: { kind: 'detention', minutes: 10 } },
  roost: { label: 'Sneak into the roost to watch the wyrms sleep', nerve: 4, stat: 'will', dc: 12, level: 1, crowns: [0, 0], renown: 8, fail: { kind: 'infirmary', minutes: 10, damage: 30 } },
  tonic: { label: 'Run contraband tonic for a dockside apothecary', nerve: 5, stat: 'charm', dc: 13, level: 2, crowns: [25, 45], renown: 4, fail: { kind: 'detention', minutes: 15 } },
  race: { label: 'Race a rival along the battlements at midnight', nerve: 5, stat: 'grace', dc: 14, level: 2, crowns: [5, 15], renown: 12, fail: { kind: 'infirmary', minutes: 20, damage: 45 } },
  stacks: { label: 'Pick the lock on the Lantern restricted stacks', nerve: 6, stat: 'wit', dc: 15, level: 3, crowns: [15, 30], renown: 15, fail: { kind: 'detention', minutes: 20 } },
};

// ---------------------------------------------------------------- helpers

export const level = (renown) => Math.floor(Math.sqrt(Math.max(0, renown) / 25)) + 1;
export const renownForLevel = (lv) => 25 * (lv - 1) ** 2;
export const isPatron = (s, now) => (s.patronUntil || 0) > now;
const round1 = (n) => Math.round(n * 10) / 10;
const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

export class GameError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function maxes(s, now) {
  const p = isPatron(s, now);
  return { energy: p ? 150 : 100, nerve: p ? 25 : 20, health: 100 };
}

function regenRules(s, now) {
  return {
    energy: { amount: 5, every: (isPatron(s, now) ? 6 : 10) * MIN },
    nerve: { amount: 1, every: 5 * MIN },
    health: { amount: 5, every: 5 * MIN },
  };
}

export function newPlayer({ name, pronouns, background }, now) {
  const bg = BACKGROUNDS[background];
  if (!bg) throw new GameError('Unknown background.');
  if (!PRONOUNS[pronouns]) throw new GameError('Unknown pronouns.');
  const stats = Object.fromEntries(STATS.map((k) => [k, 10 + (bg.stats[k] || 0)]));
  return {
    v: 1,
    name,
    pronouns,
    background,
    stats,
    bars: { energy: 100, nerve: 20, health: 100 },
    regenAt: { energy: now, nerve: now, health: now },
    crowns: bg.crowns,
    renown: 0,
    course: null,
    coursesDone: [],
    lockout: null,
    story: { current: null, done: [], flags: {} },
    affection: Object.fromEntries(Object.keys(COMPANIONS).map((k) => [k, 0])),
    talkedAt: {},
    romance: null,
    brand: null,
    wyrm: null,
    patronUntil: 0,
    protectedUntil: 0,
    wins: 0,
    losses: 0,
  };
}

// Bring a stored state up to `now`: regenerate bars, finish courses, release
// lockouts. Returns notices the player should see.
export function tick(s, now) {
  const notices = [];
  const mx = maxes(s, now);
  const rules = regenRules(s, now);
  for (const bar of Object.keys(rules)) {
    const { amount, every } = rules[bar];
    if (s.bars[bar] >= mx[bar]) {
      s.regenAt[bar] = now;
      continue;
    }
    const steps = Math.floor((now - s.regenAt[bar]) / every);
    if (steps > 0) {
      s.bars[bar] = Math.min(mx[bar], s.bars[bar] + steps * amount);
      s.regenAt[bar] += steps * every;
      if (s.bars[bar] >= mx[bar]) s.regenAt[bar] = now;
    }
  }
  if (s.course && s.course.endsAt <= now) {
    const c = COURSES[s.course.id];
    s.coursesDone.push(s.course.id);
    if (s.course.id === 'anatomy') s.renown += 15;
    notices.push(`Course complete: ${c.label}. ${c.desc}`);
    s.course = null;
  }
  if (s.lockout && s.lockout.until <= now) {
    if (s.lockout.kind === 'infirmary') s.bars.health = Math.max(s.bars.health, 60);
    notices.push(s.lockout.kind === 'infirmary' ? 'The healers have released you.' : 'Detention is over. Try not to get caught again.');
    s.lockout = null;
  }
  return notices;
}

export function roll(rng) {
  return 1 + Math.floor(rng() * 20);
}

export function checkBonus(s, stat) {
  let b = 0;
  if (stat === 'charm' && s.coursesDone.includes('etiquette')) b += 1;
  if (stat === 'charm' && s.brand === 'mindthread') b += 2;
  if (stat === 'wit' && s.brand === 'tidesense') b += 2;
  return b;
}

// d20 + floor(stat/5) + bonuses vs dc. Natural 20 always succeeds, natural 1 always fails.
export function check(s, stat, dc, rng, extra = 0) {
  const die = roll(rng);
  const mod = Math.floor(s.stats[stat] / 5) + checkBonus(s, stat) + extra;
  const total = die + mod;
  const success = die === 20 || (die !== 1 && total >= dc);
  return { stat, dc, die, mod, total, success };
}

function requireFree(s) {
  if (s.lockout) {
    const where = s.lockout.kind === 'infirmary' ? 'in the infirmary' : 'in detention';
    throw new GameError(`You are ${where}.`, 409);
  }
}

function spend(s, bar, amount) {
  if (s.bars[bar] < amount) throw new GameError(`Not enough ${bar}. You need ${amount}.`, 409);
  s.bars[bar] -= amount;
}

function lockOut(s, kind, minutes, now) {
  let m = minutes;
  if (kind === 'infirmary' && s.coursesDone.includes('fieldmed')) m = Math.ceil(m / 2);
  s.lockout = { kind, until: now + m * MIN };
  if (kind === 'infirmary') s.bars.health = 0;
}

// ---------------------------------------------------------------- actions

export function train(s, stat, now) {
  if (!STATS.includes(stat)) throw new GameError('Unknown stat.');
  requireFree(s);
  spend(s, 'energy', TRAIN_ENERGY);
  const mult = 1 + (s.coursesDone.includes('drills') ? 0.1 : 0);
  const gain = round1(Math.max(0.1, 2.5 * (40 / (40 + s.stats[stat])) * mult));
  s.stats[stat] = round1(s.stats[stat] + gain);
  return { text: `You train ${STAT_LABEL[stat]} until your arms shake. +${gain} ${STAT_LABEL[stat]}.`, gain };
}

export function work(s, jobId, now, rng) {
  const job = JOBS[jobId];
  if (!job) throw new GameError('Unknown job.');
  requireFree(s);
  spend(s, 'energy', JOB_ENERGY);
  const lv = level(s.renown);
  const tips = job.tips ? randInt(rng, 0, job.tips) : 0;
  const pay = job.pay + (lv - 1) * 2 + tips;
  s.crowns += pay;
  s.stats[job.stat] = round1(s.stats[job.stat] + 0.3);
  s.renown += 1;
  return { text: `${job.label}: shift done. You earn ${pay} crowns${tips ? ` (${tips} in tips)` : ''}. +0.3 ${STAT_LABEL[job.stat]}.`, pay };
}

export function startCourse(s, id, now) {
  const c = COURSES[id];
  if (!c) throw new GameError('Unknown course.');
  if (s.course) throw new GameError('You are already enrolled in a course.', 409);
  if (s.coursesDone.includes(id)) throw new GameError('You have already completed that course.', 409);
  if (level(s.renown) < c.level) throw new GameError(`Requires level ${c.level}.`, 409);
  if (s.crowns < c.cost) throw new GameError(`You need ${c.cost} crowns.`, 409);
  s.crowns -= c.cost;
  s.course = { id, endsAt: now + c.minutes * MIN };
  return { text: `You enroll in ${c.label}. It finishes in ${c.minutes} minutes.` };
}

export function errand(s, id, now, rng) {
  const e = ERRANDS[id];
  if (!e) throw new GameError('Unknown errand.');
  requireFree(s);
  if (level(s.renown) < e.level) throw new GameError(`Requires level ${e.level}.`, 409);
  spend(s, 'nerve', e.nerve);
  const extra = (s.coursesDone.includes('lockcraft') ? 1 : 0) + (s.brand === 'veilstep' ? 2 : 0);
  const r = check(s, e.stat, e.dc, rng, extra);
  if (r.success) {
    const crowns = randInt(rng, e.crowns[0], e.crowns[1]);
    s.crowns += crowns;
    s.renown += e.renown;
    return { success: true, roll: r, text: `Success. +${e.renown} Renown${crowns ? `, +${crowns} crowns` : ''}.` };
  }
  if (e.fail.kind === 'infirmary') {
    lockOut(s, 'infirmary', e.fail.minutes, now);
    return { success: false, roll: r, text: `It goes badly. You wake up in the infirmary.` };
  }
  lockOut(s, 'detention', e.fail.minutes, now);
  return { success: false, roll: r, text: `Caught. An instructor marches you to detention for ${e.fail.minutes} minutes.` };
}

export function talk(s, who, now, rng) {
  const c = COMPANIONS[who];
  if (!c) throw new GameError('Unknown companion.');
  requireFree(s);
  if (c.unlock && !s.story.done.includes(c.unlock)) throw new GameError(`You have not met ${c.name} yet.`, 409);
  const last = s.talkedAt[who] || 0;
  if (now - last < TALK_COOLDOWN) {
    const mins = Math.ceil((TALK_COOLDOWN - (now - last)) / MIN);
    throw new GameError(`${c.name} is busy. Try again in ${mins} min.`, 409);
  }
  spend(s, 'energy', TALK_ENERGY);
  s.talkedAt[who] = now;
  const r = check(s, 'charm', c.talkDc, rng);
  const bonus = s.coursesDone.includes('etiquette') ? 1 : 0;
  const gain = (r.success ? 5 : 1) + bonus;
  s.affection[who] = Math.min(100, s.affection[who] + gain);
  const line = c.lines[Math.floor(rng() * c.lines.length)];
  return { roll: r, gain, text: `${line} (+${gain} Affection)` };
}

// ---------------------------------------------------------------- story

export function chapterStatus(s, ch) {
  if (s.story.done.includes(ch.id)) return 'done';
  const lv = level(s.renown);
  if (lv < (ch.level || 1)) return 'locked';
  for (const req of ch.requires || []) if (!s.story.done.includes(req)) return 'locked';
  if (ch.companion && s.affection[ch.companion] < ch.affection) return 'locked';
  if (ch.romance && s.romance && s.romance !== ch.companion) return 'hidden';
  return 'open';
}

export function lockReason(s, ch) {
  const lv = level(s.renown);
  const missing = (ch.requires || []).filter((r) => !s.story.done.includes(r));
  if (missing.length) return `Finish “${CHAPTERS[missing[0]].title}” first.`;
  if (lv < (ch.level || 1)) return `Reach level ${ch.level}.`;
  if (ch.companion && s.affection[ch.companion] < ch.affection) return `${COMPANIONS[ch.companion].name}: Affection ${ch.affection} needed.`;
  return '';
}

function meets(s, req) {
  if (!req) return true;
  if (req.flag && !s.story.flags[req.flag]) return false;
  if (req.notFlag && s.story.flags[req.notFlag]) return false;
  if (req.crowns && s.crowns < req.crowns) return false;
  if (req.course && !s.coursesDone.includes(req.course)) return false;
  return true;
}

export function visibleChoices(s, scene) {
  return (scene.choices || []).map((c, i) => ({ c, i })).filter(({ c }) => meets(s, c.requires));
}

export function startChapter(s, id) {
  const ch = CHAPTERS[id];
  if (!ch) throw new GameError('Unknown chapter.');
  requireFree(s);
  if (s.story.current && s.story.current.chapter === id) return;
  if (chapterStatus(s, ch) !== 'open') throw new GameError(lockReason(s, ch) || 'That chapter is not available.', 409);
  s.story.current = { chapter: id, scene: ch.start, log: [] };
}

function applyEffects(s, fx, now) {
  const out = [];
  if (!fx) return out;
  for (const [k, v] of Object.entries(fx.stats || {})) {
    s.stats[k] = round1(s.stats[k] + v);
    out.push(`${v > 0 ? '+' : ''}${v} ${STAT_LABEL[k]}`);
  }
  if (fx.crowns) {
    s.crowns = Math.max(0, s.crowns + fx.crowns);
    out.push(`${fx.crowns > 0 ? '+' : ''}${fx.crowns} crowns`);
  }
  if (fx.renown) {
    s.renown += fx.renown;
    out.push(`+${fx.renown} Renown`);
  }
  if (fx.health) {
    s.bars.health = Math.max(1, Math.min(100, s.bars.health + fx.health));
    out.push(`${fx.health > 0 ? '+' : ''}${fx.health} Health`);
  }
  for (const [k, v] of Object.entries(fx.affection || {})) {
    s.affection[k] = Math.max(0, Math.min(100, s.affection[k] + v));
    out.push(`${v > 0 ? '+' : ''}${v} ${COMPANIONS[k].name}`);
  }
  for (const [k, v] of Object.entries(fx.flags || {})) s.story.flags[k] = v;
  if (fx.brand) {
    s.brand = fx.brand;
    s.wyrm = fx.wyrm;
    out.push(`Brand: ${BRANDS[fx.brand].label}`);
  }
  if (fx.romance) {
    s.romance = fx.romance;
    out.push(`You and ${COMPANIONS[fx.romance].name} are together`);
  }
  return out;
}

export function choose(s, index, now, rng) {
  const cur = s.story.current;
  if (!cur) throw new GameError('No chapter in progress.', 409);
  requireFree(s);
  const ch = CHAPTERS[cur.chapter];
  const scene = ch.scenes[cur.scene];
  const choice = (scene.choices || [])[index];
  if (!choice || !meets(s, choice.requires)) throw new GameError('That choice is not available.');
  let result = null;
  let success = true;
  if (choice.check) {
    result = check(s, choice.check.stat, choice.check.dc, rng);
    success = result.success;
  }
  const fx = success ? choice.effects : choice.failEffects;
  const gained = applyEffects(s, fx, now);
  const next = success ? choice.next : choice.failNext || choice.next;

  if (next === 'END') {
    s.story.done.push(cur.chapter);
    s.story.current = null;
    const reward = applyEffects(s, ch.reward, now);
    return { roll: result, gained: gained.concat(reward), finished: ch.title };
  }
  if (!ch.scenes[next]) throw new GameError(`Broken story link: ${next}`, 500);
  cur.scene = next;
  return { roll: result, gained };
}

// ---------------------------------------------------------------- duels

export function duelPower(s, rng) {
  let p = s.stats.might + s.stats.grace + s.stats.will * 0.5;
  if (s.brand === 'stormcall') p += 15;
  if (s.brand === 'emberheart') p += 8;
  if (s.coursesDone.includes('tactics')) p += 10;
  const die = roll(rng);
  return { power: round1(p + die * 3), die };
}

function damageTaken(s, base) {
  let d = base;
  if (s.brand === 'ironskin') d *= 0.7;
  if (s.brand === 'emberheart') d *= 0.85;
  return Math.round(d);
}

export function duel(attacker, defender, now, rng) {
  requireFree(attacker);
  if (defender.lockout && defender.lockout.until > now) throw new GameError(`${defender.name} is not available right now.`, 409);
  if ((defender.protectedUntil || 0) > now) throw new GameError(`${defender.name} is still recovering from a recent duel.`, 409);
  spend(attacker, 'energy', DUEL_ENERGY);
  const a = duelPower(attacker, rng);
  const d = duelPower(defender, rng);
  const attackerWins = a.power >= d.power;
  const winner = attackerWins ? attacker : defender;
  const loser = attackerWins ? defender : attacker;
  const dmg = damageTaken(loser, randInt(rng, 35, 65));
  loser.bars.health = Math.max(0, loser.bars.health - dmg);
  const stolen = Math.min(50, Math.floor(loser.crowns * 0.05));
  loser.crowns -= stolen;
  winner.crowns += stolen;
  const gap = Math.max(0, level(loser.renown) - level(winner.renown));
  const renown = 5 + gap * 3;
  winner.renown += renown;
  winner.wins = (winner.wins || 0) + 1;
  loser.losses = (loser.losses || 0) + 1;
  if (loser.bars.health <= 0) lockOut(loser, 'infirmary', 15, now);
  // A defender who just lost can't be farmed by the same or other attackers right away.
  if (attackerWins) defender.protectedUntil = now + DUEL_PROTECTION;
  return { attackerWins, a, d, dmg, stolen, renown };
}

// ---------------------------------------------------------------- store

export const PACKS = {
  seal30: { label: 'Patron’s Seal — 30 days', price: '$4.99', days: 30 },
  seal90: { label: 'Patron’s Seal — 90 days', price: '$12.99', days: 90 },
};

export function grantPatron(s, days, now) {
  const from = Math.max(now, s.patronUntil || 0);
  s.patronUntil = from + days * 24 * 60 * MIN;
}

// ---------------------------------------------------------------- view

function template(text, s) {
  const p = PRONOUNS[s.pronouns];
  const cap = (w) => w[0].toUpperCase() + w.slice(1);
  return text
    .replaceAll('{name}', s.name)
    .replaceAll('{they}', p.they)
    .replaceAll('{them}', p.them)
    .replaceAll('{their}', p.their)
    .replaceAll('{They}', cap(p.they))
    .replaceAll('{Their}', cap(p.their));
}

export function sceneView(s) {
  const cur = s.story.current;
  if (!cur) return null;
  const ch = CHAPTERS[cur.chapter];
  const scene = ch.scenes[cur.scene];
  return {
    chapter: ch.id,
    title: ch.title,
    art: scene.art || ch.art,
    portrait: scene.portrait || null,
    speaker: scene.speaker || null,
    text: template(scene.text, s),
    choices: visibleChoices(s, scene).map(({ c, i }) => ({
      index: i,
      text: template(c.text, s),
      check: c.check ? { stat: STAT_LABEL[c.check.stat], dc: c.check.dc } : null,
    })),
  };
}

export function view(s, now) {
  const mx = maxes(s, now);
  const rules = regenRules(s, now);
  const nextRegen = Object.fromEntries(
    Object.keys(rules).map((b) => [b, s.bars[b] >= mx[b] ? null : s.regenAt[b] + rules[b].every]),
  );
  const lv = level(s.renown);
  return {
    name: s.name,
    pronouns: s.pronouns,
    background: BACKGROUNDS[s.background].label,
    level: lv,
    renown: s.renown,
    nextLevelAt: renownForLevel(lv + 1),
    thisLevelAt: renownForLevel(lv),
    stats: s.stats,
    bars: s.bars,
    maxes: mx,
    nextRegen,
    crowns: s.crowns,
    patron: isPatron(s, now),
    patronUntil: s.patronUntil,
    lockout: s.lockout,
    course: s.course ? { ...s.course, label: COURSES[s.course.id].label } : null,
    coursesDone: s.coursesDone,
    brand: s.brand ? { id: s.brand, ...BRANDS[s.brand] } : null,
    wyrm: s.wyrm,
    romance: s.romance,
    wins: s.wins || 0,
    losses: s.losses || 0,
    scene: sceneView(s),
    chapters: Object.values(CHAPTERS)
      .map((ch) => ({ id: ch.id, title: ch.title, blurb: ch.blurb, art: ch.art, kind: ch.companion ? 'companion' : 'main', companion: ch.companion || null, status: chapterStatus(s, ch), reason: lockReason(s, ch) }))
      .filter((c) => c.status !== 'hidden'),
    companions: Object.entries(COMPANIONS).map(([id, c]) => ({
      id,
      name: c.name,
      title: c.title,
      met: !c.unlock || s.story.done.includes(c.unlock),
      affection: s.affection[id],
      readyAt: (s.talkedAt[id] || 0) + TALK_COOLDOWN,
    })),
  };
}

export function catalog() {
  return {
    stats: STAT_LABEL,
    jobs: JOBS,
    courses: COURSES,
    errands: ERRANDS,
    backgrounds: BACKGROUNDS,
    brands: BRANDS,
    packs: PACKS,
    costs: { train: TRAIN_ENERGY, job: JOB_ENERGY, talk: TALK_ENERGY, duel: DUEL_ENERGY },
  };
}
