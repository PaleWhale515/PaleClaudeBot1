import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/engine.js';
import { CHAPTERS, COMPANIONS } from '../src/content/story.js';

const T0 = 1_800_000_000_000;
const fixed = (v) => () => v; // rng that always returns v
const nat20 = fixed(0.99);
const nat1 = fixed(0);

const fresh = () => E.newPlayer({ name: 'Wren', pronouns: 'they', background: 'thief' }, T0);

test('new player gets background bonuses', () => {
  const s = fresh();
  assert.equal(s.stats.grace, 14);
  assert.equal(s.stats.charm, 12);
  assert.equal(s.stats.might, 10);
  assert.equal(s.crowns, 25);
  assert.equal(E.level(s.renown), 1);
});

test('energy regenerates 5 per 10 minutes and caps', () => {
  const s = fresh();
  s.bars.energy = 50;
  E.tick(s, T0 + 25 * E.MIN);
  assert.equal(s.bars.energy, 60);
  E.tick(s, T0 + 10 * 60 * E.MIN);
  assert.equal(s.bars.energy, 100);
});

test('patron seal raises energy cap and regen', () => {
  const s = fresh();
  E.grantPatron(s, 30, T0);
  assert.equal(E.maxes(s, T0).energy, 150);
  s.bars.energy = 100;
  E.tick(s, T0 + 12 * E.MIN);
  assert.equal(s.bars.energy, 110);
});

test('training spends energy and has diminishing returns', () => {
  const s = fresh();
  const low = E.train(s, 'might', T0).gain;
  s.stats.might = 200;
  const high = E.train(s, 'might', T0).gain;
  assert.ok(low > high);
  assert.equal(s.bars.energy, 80);
});

test('cannot act without energy', () => {
  const s = fresh();
  s.bars.energy = 5;
  assert.throws(() => E.train(s, 'wit', T0), /Not enough energy/);
});

test('failed errand sends you to detention and blocks actions', () => {
  const s = fresh();
  const r = E.errand(s, 'pass', T0, nat1);
  assert.equal(r.success, false);
  assert.equal(s.lockout.kind, 'detention');
  assert.throws(() => E.train(s, 'wit', T0), /detention/);
  E.tick(s, T0 + 11 * E.MIN);
  assert.equal(s.lockout, null);
});

test('natural 20 always passes a check', () => {
  const s = fresh();
  const r = E.check(s, 'might', 99, nat20);
  assert.equal(r.success, true);
});

test('courses complete over real time', () => {
  const s = fresh();
  E.startCourse(s, 'drills', T0);
  assert.throws(() => E.startCourse(s, 'etiquette', T0), /already enrolled/);
  const notices = E.tick(s, T0 + 16 * E.MIN);
  assert.ok(s.coursesDone.includes('drills'));
  assert.equal(notices.length, 1);
});

test('talk has a cooldown and requires meeting the companion', () => {
  const s = fresh();
  assert.throws(() => E.talk(s, 'dax', T0, nat20), /not met/);
  s.story.done.push('stair');
  E.talk(s, 'dax', T0, nat20);
  assert.ok(s.affection.dax > 0);
  assert.throws(() => E.talk(s, 'dax', T0 + E.MIN, nat20), /busy/);
});

test('duel moves renown and protects the loser', () => {
  const a = fresh();
  const d = E.newPlayer({ name: 'Brask', pronouns: 'he', background: 'dockhand' }, T0);
  a.stats.might = 80;
  const r = E.duel(a, d, T0, fixed(0.5));
  assert.equal(r.attackerWins, true);
  assert.ok(a.renown > 0);
  assert.ok(d.bars.health < 100);
  assert.throws(() => E.duel(a, d, T0 + E.MIN, fixed(0.5)), /recovering/);
});

// ---------------------------------------------------------------- story graph

test('every story link points at a real scene', () => {
  for (const ch of Object.values(CHAPTERS)) {
    assert.ok(ch.scenes[ch.start], `${ch.id} start`);
    for (const req of ch.requires || []) assert.ok(CHAPTERS[req], `${ch.id} requires ${req}`);
    if (ch.companion) assert.ok(COMPANIONS[ch.companion], `${ch.id} companion`);
    for (const [sid, sc] of Object.entries(ch.scenes)) {
      assert.ok(sc.choices && sc.choices.length, `${ch.id}.${sid} has choices`);
      for (const c of sc.choices) {
        for (const n of [c.next, c.failNext].filter(Boolean)) {
          assert.ok(n === 'END' || ch.scenes[n], `${ch.id}.${sid} -> ${n}`);
        }
        if (c.check) assert.ok(E.STATS.includes(c.check.stat), `${ch.id}.${sid} stat`);
      }
    }
  }
});

test('the whole main story can be played start to finish', () => {
  const s = fresh();
  s.renown = 10_000; // skip level gates
  for (const id of ['stair', 'drowning', 'firstblood', 'stacks', 'roost', 'claiming']) {
    E.startChapter(s, id);
    let guard = 0;
    while (s.story.current && guard++ < 50) {
      const view = E.sceneView(s);
      E.choose(s, view.choices[0].index, T0, nat20);
    }
    assert.ok(s.story.done.includes(id), id);
  }
  assert.ok(s.brand, 'claimed a brand');
});

test('romance with one companion hides the others’ romance chapters', () => {
  const s = fresh();
  s.renown = 10_000;
  s.story.done.push('drowning', 'dax_1', 'rhaelle_1');
  s.affection.dax = 50;
  s.affection.rhaelle = 50;
  E.startChapter(s, 'dax_2');
  E.choose(s, 0, T0, nat20); // kiss
  assert.equal(s.romance, 'dax');
  assert.equal(E.chapterStatus(s, CHAPTERS.rhaelle_2), 'hidden');
});
