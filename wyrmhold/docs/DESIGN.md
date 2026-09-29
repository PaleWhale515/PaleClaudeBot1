# Wyrmhold — Design Document

*Working title. A mobile-first, persistent, text-driven RPG about surviving a
dragon war college and choosing the life that comes after it.*

---

## 1. Pitch

You arrive at **Wyrmhold**, a war college cut into the sea cliffs of the
kingdom of **Caldris**. One in three cadets does not live to see graduation.
Survive the trials, win a wyrm's bond, fall in (and out of) love, and decide
who you become: a **Professor** who shapes the next class, a **Tradesman**
who grows rich in the port city, an **Adventurer** who maps the wild edges of
the kingdom, or a **Soldier** in the war the crown insists is not happening.

Played in short, satisfying ~20-minute sessions on a phone, like Torn, with a
real story running underneath it, like a D&D campaign.

## 2. Pillars

1. **Your life, your path.** Branching careers, not a single hero plot.
2. **Every choice rolls.** Stats feed d20 checks; failure is interesting, not
   a dead end.
3. **Romance is a main path.** Slow-burn relationships with memorable
   characters. Intimate scenes fade to black. All characters are adults.
4. **The clock is a friend.** Energy, Nerve, courses and jobs tick in real
   time, so every return visit has something waiting.
5. **Friends matter.** Duels, rivalries, squads, and a public leaderboard.

## 3. The World (original IP)

| Thing | Name | Notes |
|---|---|---|
| Kingdom | **Caldris** | Coastal monarchy, rich, paranoid, at "peace". |
| Capital / port | **Varnhollow** | Where cadets work shifts, trade, and get into trouble. |
| The college | **Wyrmhold** | Carved into the cliffs above the Shrike Sea. |
| Dragons | **Wyrms** | Sea-and-sky dragons; they choose riders, never the reverse. |
| The bond | **The Claiming** | Happens under the Ember Moon at the end of the first term. |
| Bond power | **Brand** | The bond burns a sigil into the rider's skin and grants one power. |
| The hidden war | **The Tidewrought** | Drowned things rising from the sea as the old **Wardstones** fail. The crown hides it. |

### The four Orders (the "majors" of Wyrmhold)

| Order | Sigil | Fantasy | Key stat |
|---|---|---|---|
| **Talon** | a claw | Dragon riders — the most prestige, the most dead | Grace / Will |
| **Bulwark** | a tower shield | Line infantry and siege — the ones who hold | Might |
| **Lantern** | an open eye | Archivists, cartographers, codebreakers — they know things | Wit |
| **Vein** | a drop of blood | Field surgeons and alchemists | Wit / Charm |

In the prototype every cadet starts as a **Talon hopeful**, so everyone gets
the dragon storyline. Choosing another Order at the end of Year One comes
later.

### Brands (bond powers)

| Brand | Effect in play |
|---|---|
| **Stormcall** | Lightning. Big duel damage. |
| **Veilstep** | Short-range shadow-step. Errand success bonus. |
| **Mindthread** | Hear surface thoughts. Charm/persuasion bonus. |
| **Ironskin** | Hardened flesh. Less damage taken. |
| **Emberheart** | Heat and fire. Balanced damage bonus. |
| **Tidesense** | Feel the sea and what is under it. Story secrets. |

### Main cast (romance options marked ♥, all adults, 20+)

| Character | Role | Hook |
|---|---|---|
| ♥ **Rhaelle Sund** | Third-year Talon, your squad's second | Cold, brilliant, keeps score. Rival first. |
| ♥ **Dax Morrow** | First-year Bulwark, dockworker's son | Warm, funny, stubborn — will carry you out of a fire. |
| ♥ **Isolde Crane** | Lantern archivist | Knows the Wardstones are failing. Wants to know what *you* know. |
| ♥ **Corvin Ashe** | Wingleader, fourth-year | Dangerous, charming, and hiding a scar that is not from a wyrm. |
| **Commandant Sabine Holt** | Head of Wyrmhold | Believes cruelty makes survivors. Might be right. |
| **Master Oril** | Old Lantern professor | Your future mentor if you take the Professor path. |
| **Grel** | Wyrm, ancient, one-eyed | Speaks to cadets he finds funny. Rarely. |

Romance is gender-neutral: the player chooses name and pronouns, and any
romance option is open to any player.

## 4. Core Systems

### 4.1 Stats
| Stat | Used for |
|---|---|
| **Might** | Hauling, melee, Bulwark work |
| **Grace** | Climbing, flight, dodging |
| **Wit** | Study, lockpicking, spotting lies |
| **Will** | Fear checks, intimidation, holding on |
| **Charm** | Persuasion, romance, bargaining |

Checks: `d20 + floor(stat / 5)` vs a difficulty (DC). Natural 20 always wins,
natural 1 always fails. The roll is shown to the player.

### 4.2 Bars (regenerate in real time)
| Bar | Max | Regen | Spent on |
|---|---|---|---|
| **Energy** | 100 (150 Patron) | 5 / 10 min (Patron: 5 / 6 min) | Training, work shifts, talking to people |
| **Nerve** | 20 (25 Patron) | 1 / 5 min | Night Errands (risky actions) |
| **Health** | 100 | 5 / 5 min | Lost in duels, errands, trials |

At 0 Health you go to the **Infirmary** for a timer and can't act.

### 4.3 Actions
- **Train** (10 Energy): +stat with diminishing returns. The gym of Torn.
- **Work a shift** (15 Energy): earn Crowns (money) + a small stat bump at one
  of four Varnhollow jobs.
- **Courses** (Crowns + real time): permanent bonuses; one at a time. The
  "education" of Torn.
- **Night Errands** (Nerve): risky, quick, funny. Success = Crowns/items/
  renown; failure = Infirmary or Detention (timed lockout). The "crimes" of Torn.
- **Story chapters** (free, gated by progress/level): the D&D campaign.
- **Companions** (5 Energy per talk): raise Affection; thresholds unlock
  romance scenes.
- **Duels** (20 Energy): attack another player. Winner gains Renown and a cut
  of Crowns; loser goes to the Infirmary.

### 4.4 Progression
**Renown** is XP. Level = `floor(sqrt(renown / 25)) + 1`. Levels gate story
chapters and courses. The leaderboard sorts by Renown.

## 5. The 20-minute session

| Minutes | What the player does |
|---|---|
| 0–3 | Collect: finished course, overnight regen, duel log, event feed |
| 3–8 | Spend Energy: train, work a shift, talk to a companion |
| 8–15 | Play the next story chapter (5–8 scenes, dice checks) |
| 15–20 | Spend Nerve on errands, duel a rival, queue the next course |

Energy caps at ~100 and refills in ~3.3 hours, so logging in 2–4 times a day
is rewarded but never required.

## 6. Monetization: Patron's Seal (donator packs)

Modeled on Torn's donator status: convenience and cosmetics, **never** raw
stats or story gates.

| Pack | Price (suggested) | Grants |
|---|---|---|
| Patron's Seal — 30 days | $4.99 | Energy cap 150, faster regen, Nerve 25, gold name, Patron title |
| Patron's Seal — 90 days | $12.99 | Same, 90 days |
| Refill Draught (x5) | $2.99 | Refill Energy once per use (max 1/day) |
| Cosmetics | $1–3 | Name colors, sigils, wyrm color variants |

**Payments:** Stripe Checkout (fine for a fade-to-black romance game). The
prototype has the store screen and the server logic that applies a Seal;
the Stripe webhook is wired when you have a Stripe account.

## 7. Content & Safety Rules
- All characters are adults. Romance is fade-to-black.
- 18+ account confirmation at signup (mature violence and romantic themes).
- No player-to-player free text in the prototype (no moderation burden yet).
- Server-authoritative: every roll and reward is computed on the server.

## 8. Tech

| Part | Choice |
|---|---|
| Hosting | Cloudflare Workers (API + static files in one Worker) |
| Database | Cloudflare D1 (SQLite) |
| Frontend | Plain HTML/CSS/JS, mobile-first, no build step |
| Art (now) | Hand-drawn SVG scenes in code |
| Art (later) | AI images from `docs/ART_PROMPTS.md`, dropped into `public/art/` |
| Auth | Username + password (PBKDF2), http-only session cookie |

## 9. Roadmap

1. **Prototype (this build):** accounts, bars, training, jobs, courses,
   errands, Year One Act I story (through the Claiming), four companions,
   duels, leaderboard, Patron store screen.
2. **Year One complete:** Acts II–III, Order choice, first Tidewrought
   encounter, first romance scenes.
3. **Life paths:** Professor, Trade, Adventurer, War — each with its own
   job ladder, chapters and endgame.
4. **Social:** squads (guilds), squad missions, events, chat with moderation.
5. **Payments & launch:** Stripe, custom domain, analytics, anti-cheat.

## 10. Open questions for the owner
- Final name (Wyrmhold is a working title — trademark search before launch).
- Permadeath hardcore mode?
- How dark should the war arc get?
- Launch region and pricing.
