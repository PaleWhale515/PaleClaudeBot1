// Year One, Act I of Wyrmhold, plus the companion arcs.
//
// Chapter shape:
//   { id, title, blurb, art, level, requires: [chapterIds], start, reward, scenes }
// Companion chapters add { companion, affection } and romance chapters add { romance: true }.
// Scene shape:
//   { art?, portrait?, speaker?, text, choices: [{ text, check?: {stat, dc},
//     effects?, failEffects?, next, failNext?, requires?: {flag|notFlag|course|crowns} }] }
// `next: 'END'` finishes the chapter and grants its `reward`.
// Text placeholders: {name} {they} {them} {their} {They} {Their}.
// All characters are adults. Romance fades to black.

export const COMPANIONS = {
  rhaelle: {
    name: 'Rhaelle Sund',
    title: 'Third-year Talon, your squad’s second',
    unlock: 'stair',
    talkDc: 13,
    lines: [
      'Rhaelle corrects your grip without looking up from her ledger.',
      'Rhaelle says your footwork is “less embarrassing than yesterday.” High praise.',
      'You catch Rhaelle almost smiling at something you said. She denies it.',
      'Rhaelle shares half an orange with you on the wall and says nothing at all.',
    ],
  },
  dax: {
    name: 'Dax Morrow',
    title: 'First-year Bulwark, dockworker’s son',
    unlock: 'stair',
    talkDc: 9,
    lines: [
      'Dax teaches you a sailor’s knot that he swears has saved his life twice.',
      'Dax saves you the last heel of bread at supper and pretends he wasn’t hungry.',
      'Dax laughs so hard at your impression of the Commandant that he gets sent to run laps.',
      'Dax shows you the scar on his palm from a cargo hook and tells the story three different ways.',
    ],
  },
  isolde: {
    name: 'Isolde Crane',
    title: 'Lantern archivist',
    unlock: 'stacks',
    talkDc: 12,
    lines: [
      'Isolde lends you a book with her notes in every margin. Some of them are about you.',
      'Isolde quizzes you on sea charts until you get six in a row right.',
      'Isolde tells you which archive stairs creak, “in case you ever need to not be heard.”',
      'Isolde pushes her spectacles up with an inky finger and leaves a smudge. You don’t tell her.',
    ],
  },
  corvin: {
    name: 'Corvin Ashe',
    title: 'Wingleader, fourth-year',
    unlock: 'drowning',
    talkDc: 14,
    lines: [
      'Corvin tells you exactly which instructor to avoid tomorrow, then walks off before you can thank him.',
      'Corvin watches you train from the gallery. When you look up, he’s gone.',
      'Corvin asks what you’re afraid of, and actually listens to the answer.',
      'Corvin tosses you a flask of something warm and says, “Don’t tell anyone I’m nice.”',
    ],
  },
};

const FADE = 'The lamp gutters out. Whatever happens next belongs to the two of you, and the night keeps the secret.';

export const CHAPTERS = {
  // ------------------------------------------------------------------ main
  stair: {
    id: 'stair',
    title: 'The Cliff Stair',
    blurb: 'Nine hundred steps to Wyrmhold. The bell will not wait.',
    art: 'gate',
    level: 1,
    requires: [],
    start: 's1',
    reward: { renown: 15 },
    scenes: {
      s1: {
        text:
          'The supply barge scrapes against the harbor stones and a sergeant bellows that anyone not at the top of the Cliff Stair by the evening bell can swim home.\n\nAbove you, Wyrmhold is carved straight into the black rock, hundreds of windows burning like coals. Something enormous circles the highest tower.\n\nBeside you on the first step, a broad young man drops his pack. It bursts. Dried fish everywhere.',
        choices: [
          { text: 'Help him gather it and heft the pack', check: { stat: 'might', dc: 10 }, effects: { affection: { dax: 5 }, stats: { might: 0.5 } }, failEffects: { affection: { dax: 3 }, health: -5 }, next: 's2' },
          { text: 'Make a joke about the fish', check: { stat: 'charm', dc: 9 }, effects: { affection: { dax: 4 } }, failEffects: { affection: { dax: 1 } }, next: 's2' },
          { text: 'Keep climbing. The bell won’t wait.', effects: { flags: { cold_start: true } }, next: 's2' },
        ],
      },
      s2: {
        portrait: 'dax',
        text:
          '“Dax,” the young man says, catching up, grin crooked. “Dax Morrow. Bulwark, if I live.”\n\nHalfway up, the wind comes off the Shrike Sea like a slap. Ahead of you a thin cadet steps on a crumbling edge and it goes. He’s hanging by his fingers over three hundred feet of nothing.',
        choices: [
          { text: 'Dive and grab his wrist', check: { stat: 'grace', dc: 11 }, effects: { renown: 5, flags: { saved_cadet: true } }, failEffects: { health: -10, flags: { saved_cadet: true } }, next: 's3' },
          { text: 'Shout at him to swing to the wall', check: { stat: 'will', dc: 10 }, effects: { renown: 3, flags: { saved_cadet: true } }, failEffects: { flags: { lost_cadet: true } }, next: 's3' },
          { text: 'Don’t look. Keep moving.', effects: { stats: { will: 0.5 }, flags: { lost_cadet: true } }, next: 's3' },
        ],
      },
      s3: {
        portrait: 'rhaelle',
        speaker: 'Rhaelle Sund',
        text:
          'At the top, lungs burning, you reach a gate where a young woman in black flight leathers stands with a ledger. Silver-blonde braid. Scar through one eyebrow. She looks at you the way a butcher looks at a side of beef.\n\n“Name.”',
        choices: [
          { text: 'Give your name and hold her stare', check: { stat: 'will', dc: 12 }, effects: { affection: { rhaelle: 5 } }, failEffects: { affection: { rhaelle: 1 } }, next: 's4' },
          { text: 'Smile and ask for hers', check: { stat: 'charm', dc: 13 }, effects: { affection: { rhaelle: 3 }, flags: { asked_rhaelle: true } }, failEffects: { affection: { rhaelle: -2 } }, next: 's4' },
          { text: 'Just give your name', next: 's4' },
        ],
      },
      s4: {
        portrait: 'holt',
        speaker: 'Commandant Holt',
        text:
          '“{name},” the woman repeats, writing. “Rhaelle Sund. Third-year. Your squad’s second. Try not to die before I learn your face.”\n\nIn the courtyard, Commandant Sabine Holt addresses two hundred of you from a balcony, hands clasped behind her back.\n\n“One in three of you will be dead before the Ember Moon. I do not apologize for this. The wyrms do not bond with the soft, and Caldris has no use for the soft. Tomorrow, at low tide, you face the Drowning.”\n\nThe bell rings. Someone behind you is crying quietly.',
        choices: [{ text: 'Find your bunk and try to sleep', next: 'END' }],
      },
    },
  },

  drowning: {
    id: 'drowning',
    title: 'The Drowning',
    blurb: 'Climb down to the tide caves, take a token, get out before the sea returns.',
    art: 'drowning',
    level: 1,
    requires: ['stair'],
    start: 'd1',
    reward: { renown: 20 },
    scenes: {
      d1: {
        text:
          'Grey dawn. The tide has pulled back so far the sea looks like it is holding its breath. Ropes hang down the cliff to a line of caves at the waterline.\n\n“A bronze token waits in each cave,” an instructor calls. “Bring one up before the tide turns. It turns in an hour. It does not care about you.”\n\nOn a ledge above, a tall fourth-year in black armor watches with the bored patience of a cat. Silver claw insignia: a wingleader.\n\nDax stares at the drop. He has gone very pale.',
        choices: [
          { text: 'Take the rope fast', check: { stat: 'grace', dc: 12 }, effects: { flags: { fast_down: true }, stats: { grace: 0.5 } }, failEffects: { health: -10 }, next: 'd2' },
          { text: 'Climb carefully, testing each hold', check: { stat: 'wit', dc: 10 }, effects: { stats: { wit: 0.5 } }, failEffects: { health: -5 }, next: 'd2' },
          { text: 'Talk Dax down the rope first', check: { stat: 'will', dc: 11 }, effects: { affection: { dax: 6 }, flags: { helped_dax_drown: true } }, failEffects: { affection: { dax: 3 }, health: -5 }, next: 'd2' },
        ],
      },
      d2: {
        text:
          'Three caves gape at the bottom.\n\nThe **wide cave**: already crowded, cadets shoving and swinging at each other over the tokens.\n\nThe **narrow crack**: dark, barely shoulder-wide, water dripping from somewhere you can’t see.\n\nThe **flooded cave**: its mouth half underwater. Beneath the surface, something glows faint blue.',
        choices: [
          { text: 'Shoulder into the wide cave', check: { stat: 'might', dc: 12 }, effects: { renown: 3 }, failEffects: { health: -15 }, next: 'd3' },
          { text: 'Squeeze through the crack', check: { stat: 'grace', dc: 13 }, effects: { renown: 5 }, failEffects: { health: -10 }, next: 'd3' },
          { text: 'Take a breath and dive for the glow', check: { stat: 'will', dc: 13 }, effects: { renown: 8, flags: { found_stone: true } }, failEffects: { health: -20, flags: { found_stone: true } }, next: 'd3' },
        ],
      },
      d3: {
        text:
          'Token in your fist, you reach the rope just as the first real wave booms into the caves behind you.\n\nA heavy first-year with a shaved head is blocking the rope. Brask, someone called him last night. He holds out his palm.\n\n“Token. Now. Or you can explain to the sea why you were slow.”',
        choices: [
          { text: 'Hit him first', check: { stat: 'might', dc: 13 }, effects: { renown: 6, flags: { beat_brask: true } }, failEffects: { health: -15 }, next: 'd4' },
          { text: 'Stare him down', check: { stat: 'will', dc: 12 }, effects: { renown: 4, stats: { will: 0.5 } }, failEffects: { health: -10 }, next: 'd4' },
          { text: 'Ignore him and free-climb the rock beside the rope', check: { stat: 'grace', dc: 13 }, effects: { renown: 5 }, failEffects: { health: -15 }, next: 'd4' },
        ],
      },
      d4: {
        portrait: 'corvin',
        speaker: 'Corvin Ashe',
        text:
          'You haul yourself over the top, soaked and shaking, token clenched so hard it has cut your palm. Below, the sea swallows the caves whole. Not everyone came up.\n\nThe wingleader drops down from his ledge beside you. Black hair, dark eyes, a smile that has gotten him out of a great deal of trouble.\n\n“Corvin Ashe. I watch the Drowning every year. Most of them look at the token.” His eyes narrow slightly. “Some of them look at other things.”',
        choices: [
          { text: 'Ask him what the glowing stone underwater was', requires: { flag: 'found_stone' }, effects: { affection: { corvin: 5 }, flags: { asked_stone: true } }, next: 'd5' },
          { text: 'Ask why he watches every year', effects: { affection: { corvin: 2 } }, next: 'd5' },
          { text: 'Walk past him to find Dax', effects: { affection: { dax: 3 } }, next: 'd5' },
        ],
      },
      d5: {
        text:
          'Corvin’s smile doesn’t move, but something behind it does.\n\n“Keep your head down, first-year. People who notice things here tend to have accidents.”\n\nHe’s gone before you can answer. Dax finds you a minute later and nearly crushes you in a hug. He is alive. So are you. For today, that is everything.',
        choices: [{ text: 'Go get warm', next: 'END' }],
      },
    },
  },

  firstblood: {
    id: 'firstblood',
    title: 'First Blood',
    blurb: 'Sparring in the courtyard. Rhaelle Sund volunteers to demonstrate on you.',
    art: 'courtyard',
    level: 2,
    requires: ['drowning'],
    start: 'f1',
    reward: { renown: 20 },
    scenes: {
      f1: {
        portrait: 'rhaelle',
        text:
          'Sparring circles are scratched into the courtyard flagstones, stained darker in places you try not to think about.\n\n“Demonstration,” the instructor says. “Sund. Pick one.”\n\nRhaelle points her practice blade at you without hesitation. The yard goes quiet.',
        choices: [
          { text: 'Go on the offensive before she can', check: { stat: 'might', dc: 13 }, effects: { affection: { rhaelle: 5 }, renown: 5 }, failEffects: { health: -15, affection: { rhaelle: 1 } }, next: 'f2' },
          { text: 'Circle, watch, read her', check: { stat: 'wit', dc: 12 }, effects: { affection: { rhaelle: 6 }, stats: { wit: 0.5 } }, failEffects: { health: -10 }, next: 'f2' },
          { text: 'Take the beating. Refuse to yield.', check: { stat: 'will', dc: 12 }, effects: { affection: { rhaelle: 5 }, stats: { will: 0.5 } }, failEffects: { health: -20, affection: { rhaelle: 3 } }, next: 'f2' },
        ],
      },
      f2: {
        portrait: 'dax',
        text:
          'You’re still catching your breath when you hear it by the weapon racks: Brask and two friends have Dax pinned against the wall.\n\n“Bulwark trash,” Brask says. “Dockrat. Your mother still gut fish for coppers?”\n\nDax’s jaw is tight. He isn’t fighting back. If he strikes a cadet in the yard, he’s expelled. Brask knows it.',
        choices: [
          { text: 'Step in. You’re not Bulwark. You can hit him.', check: { stat: 'might', dc: 13 }, effects: { affection: { dax: 8 }, renown: 5, flags: { beat_brask: true } }, failEffects: { affection: { dax: 6 }, health: -15 }, next: 'f3' },
          { text: 'Loudly announce the Commandant is coming', check: { stat: 'charm', dc: 12 }, effects: { affection: { dax: 5 } }, failEffects: { affection: { dax: 2 } }, next: 'f3' },
          { text: 'Tell Brask you’ll see him on the duel board', effects: { affection: { dax: 4 }, flags: { brask_rival: true } }, next: 'f3' },
        ],
      },
      f3: {
        portrait: 'rhaelle',
        speaker: 'Rhaelle Sund',
        text:
          'That evening you find Rhaelle on the sea wall, ledger in her lap, writing names.\n\n“Casualties,” she says without looking up. “Someone should remember them properly.” She closes the book. “You don’t fight like the others. Where did you learn?”',
        choices: [
          { text: 'Tell her the truth about where you come from', effects: { affection: { rhaelle: 4 } }, next: 'END' },
          { text: 'Ask why she really picked you today', effects: { affection: { rhaelle: 3 }, flags: { holt_wants_you: true } }, next: 'f4' },
          { text: 'Say nothing. Sit with her.', effects: { affection: { rhaelle: 5 } }, next: 'END' },
        ],
      },
      f4: {
        portrait: 'rhaelle',
        speaker: 'Rhaelle Sund',
        text:
          '“Because Holt told the instructor to pair you with the worst fourth-year in the yard,” Rhaelle says. “I got there first. I hit less hard than he does.”\n\nShe stands and tucks the ledger under her arm.\n\n“Someone up there wants you gone, {name}. Figure out why before they manage it.”',
        choices: [{ text: 'Watch her walk away', next: 'END' }],
      },
    },
  },

  stacks: {
    id: 'stacks',
    title: 'The Restricted Stacks',
    blurb: 'Punishment duty in the archive. An archivist with ink on her fingers needs a favor.',
    art: 'archive',
    level: 2,
    requires: ['drowning'],
    start: 'a1',
    reward: { renown: 25 },
    scenes: {
      a1: {
        portrait: 'isolde',
        speaker: 'Isolde Crane',
        text:
          'Punishment duty: shelving returns in the Lantern archive until midnight. The shelves spiral up into the dark like the inside of a shell.\n\nAn archivist with auburn hair, round spectacles, and a pencil stuck through her bun looks you over.\n\n“Isolde Crane. You’re strong enough to reach the top shelves in the restricted stacks. I need a chart from up there.” A pause. “It’s allowed. Technically.”',
        choices: [
          { text: '“Technically?”', check: { stat: 'wit', dc: 11 }, effects: { affection: { isolde: 4 } }, failEffects: { affection: { isolde: 1 } }, next: 'a2' },
          { text: 'Take the lantern and go', effects: { affection: { isolde: 2 } }, next: 'a2' },
        ],
      },
      a2: {
        text:
          'The restricted stacks smell of salt and old glue. The chart she wants is a map of the whole Caldris coast, dotted with standing stones: the **Wardstones**. Beside each, in fresh ink, a date.\n\nYou read them in order. The dates get closer together. Six this year alone. Each one crossed out.\n\nA second lantern is coming up the stairs. Slow footsteps. An old man’s cough.',
        choices: [
          { text: 'Kill your light and hide in the shelves', check: { stat: 'grace', dc: 12 }, effects: { flags: { saw_charts: true }, stats: { grace: 0.5 } }, failEffects: { flags: { saw_charts: true, oril_met: true } }, next: 'a3' },
          { text: 'Step out and tell the truth', check: { stat: 'charm', dc: 12 }, effects: { flags: { saw_charts: true, oril_met: true }, renown: 5 }, failEffects: { flags: { oril_met: true } }, next: 'a3' },
        ],
      },
      a3: {
        portrait: 'isolde',
        speaker: 'Isolde Crane',
        text:
          'Back at her desk, Isolde reads your face before you say a word.\n\n“You saw the dates.” She takes off her spectacles. “The Wardstones hold something back. Something in the sea. The oldest texts are very clear about that and very vague about everything else. Six went dark this year. The Commandant knows. The crown knows. They’re telling everyone it’s peacetime.”',
        choices: [
          { text: 'Promise to keep her secret', effects: { affection: { isolde: 6 }, flags: { isolde_trust: true } }, next: 'END' },
          { text: 'Ask what exactly is in the sea', check: { stat: 'wit', dc: 13 }, effects: { affection: { isolde: 4 }, flags: { knows_tidewrought: true }, stats: { wit: 0.5 } }, failEffects: { affection: { isolde: 2 } }, next: 'a4' },
          { text: 'Tell her you want no part of this', effects: { affection: { isolde: -3 } }, next: 'END' },
        ],
      },
      a4: {
        portrait: 'isolde',
        speaker: 'Isolde Crane',
        text:
          '“The old texts call them the **Tidewrought**,” she says quietly. “The drowned that do not stay drowned. Every account of them ends mid-sentence.”\n\nShe puts her spectacles back on, and her voice goes brisk.\n\n“Return the chart. Tell no one. And come back tomorrow, {name}. I have a great many more shelves.”',
        choices: [{ text: 'Return the chart', next: 'END' }],
      },
    },
  },

  roost: {
    id: 'roost',
    title: 'Night at the Roost',
    blurb: 'Cadets are forbidden from the roost before the Claiming. Naturally, you go.',
    art: 'roost',
    level: 3,
    requires: ['firstblood', 'stacks'],
    start: 'r1',
    reward: { renown: 30 },
    scenes: {
      r1: {
        portrait: 'grel',
        text:
          'The roost is a cavern open to the sea, big enough to hold a cathedral. The wyrms sleep in heaps of slate and green and bronze, breath rolling out like surf.\n\nOne of them is awake.\n\nHe is enormous, barnacled, older than the college. One eye is a ruined scar. The other opens, ember-orange, and fixes on you.\n\nA voice fills your skull like warm smoke: *Small. Loud. Smells of fear and dock tar.*',
        choices: [
          { text: 'Bow low, the way you would to a king', check: { stat: 'charm', dc: 12 }, effects: { flags: { grel_friend: true } }, next: 'r2' },
          { text: 'Stand your ground and meet the eye', check: { stat: 'will', dc: 14 }, effects: { flags: { grel_friend: true }, stats: { will: 1 } }, failEffects: { health: -15 }, next: 'r2' },
          { text: 'Run', effects: { flags: { fled_grel: true } }, next: 'r3' },
        ],
      },
      r2: {
        portrait: 'grel',
        speaker: 'Grel',
        text:
          '*I am Grel.* The voice is amused now. *Under the Ember Moon we choose. Your masters think we choose the strong. We choose those who do not lie to themselves. Few do not.*\n\nThe great eye half closes.',
        choices: [
          { text: 'Ask him about the Wardstones', requires: { flag: 'saw_charts' }, effects: { flags: { grel_warned: true }, renown: 5 }, next: 'r2b' },
          { text: 'Ask what he sees when he looks at you', effects: { stats: { will: 0.5 } }, next: 'r3' },
        ],
      },
      r2b: {
        portrait: 'grel',
        speaker: 'Grel',
        text:
          '*The stones are teeth,* Grel says. *Teeth in the mouth of the sea, holding it shut. The teeth are breaking.* The eye opens fully. *When the mouth opens, little one, your masters will need every rider they have killed.*',
        choices: [{ text: 'Back away slowly', next: 'r3' }],
      },
      r3: {
        portrait: 'corvin',
        speaker: 'Corvin Ashe',
        text:
          'You nearly make it back to the stair.\n\n“Cadets who come here at night,” Corvin Ashe says from the dark, “get claimed early or eaten early. Which were you going for?”\n\nHe steps into the moonlight. His collar has slipped. There’s a pale, jagged scar at his collarbone, and it is not a burn and not a claw.\n\nHe doesn’t call a guard.',
        choices: [
          { text: 'Ask about the scar', check: { stat: 'charm', dc: 14 }, effects: { affection: { corvin: 6 }, flags: { corvin_scar: true } }, failEffects: { affection: { corvin: -2 } }, next: 'r4' },
          { text: 'Ask why he isn’t reporting you', effects: { affection: { corvin: 3 } }, next: 'r4' },
          { text: 'Thank him and go', effects: { affection: { corvin: 2 } }, next: 'END' },
        ],
      },
      r4: {
        portrait: 'corvin',
        speaker: 'Corvin Ashe',
        text:
          'He fixes his collar without hurrying.\n\n“The sea gave me that,” he says. “Last winter, on a patrol that officially never happened. Holt would report you. I make it a rule not to do anything Holt would.”\n\nHe nods at the stair.\n\n“Go. And {name}? Whatever the old one told you, don’t repeat it in the mess hall.”',
        choices: [{ text: 'Go', next: 'END' }],
      },
    },
  },

  claiming: {
    id: 'claiming',
    title: 'The Ember Moon',
    blurb: 'The wyrms come to choose. Those who run are eaten first.',
    art: 'claiming',
    level: 4,
    requires: ['roost'],
    start: 'c1',
    reward: { renown: 40, crowns: 50 },
    scenes: {
      c1: {
        text:
          'The moon rises the color of a forge. Two hundred cadets stood on the Cliff Stair. A hundred and thirty-one stand on the plateau tonight.\n\nDax is next to you, shoulders squared. Among the riders at the edge you see Rhaelle, arms folded. Corvin, leaning on nothing.\n\n“Stand,” Commandant Holt says. “Do not run. Those who run are eaten first.”\n\nThe wind changes. The sky fills with wings.',
        choices: [
          { text: 'Take Dax’s hand for a moment', effects: { affection: { dax: 5 } }, next: 'c2' },
          { text: 'Find Rhaelle’s eyes across the plateau', effects: { affection: { rhaelle: 3 } }, next: 'c2' },
          { text: 'Breathe. Face forward.', effects: { stats: { will: 0.5 } }, next: 'c2' },
        ],
      },
      c2: {
        text:
          'They land in thunder. A storm-grey wyrm crackling with light. A sea-green one rising dripping from the surf below the cliff. A black one that seems to be made of the shadows between torches. A crimson one with fire in the cracks of its scales. A bronze one like a moving wall. A violet one with curious, glowing eyes.\n\nAll of them are looking at the line of cadets. Several are looking at you.\n\nWhat do you do?',
        choices: [
          { text: 'Stand perfectly still and let the storm come to you', check: { stat: 'will', dc: 13 }, effects: { brand: 'stormcall', wyrm: 'storm', renown: 20 }, failEffects: { brand: 'stormcall', wyrm: 'storm', health: -25 }, next: 'c3' },
          { text: 'Walk to the cliff edge toward the sea-green wyrm', check: { stat: 'wit', dc: 13 }, effects: { brand: 'tidesense', wyrm: 'tide', renown: 20 }, failEffects: { brand: 'tidesense', wyrm: 'tide', health: -25 }, next: 'c3' },
          { text: 'Meet the black wyrm’s gaze in the shadows', check: { stat: 'grace', dc: 13 }, effects: { brand: 'veilstep', wyrm: 'shadow', renown: 20 }, failEffects: { brand: 'veilstep', wyrm: 'shadow', health: -25 }, next: 'c3' },
          { text: 'Speak to them out loud, like people', check: { stat: 'charm', dc: 13 }, effects: { brand: 'mindthread', wyrm: 'mind', renown: 20 }, failEffects: { brand: 'mindthread', wyrm: 'mind', health: -25 }, next: 'c3' },
          { text: 'Plant your feet like a wall', check: { stat: 'might', dc: 13 }, effects: { brand: 'ironskin', wyrm: 'iron', renown: 20 }, failEffects: { brand: 'ironskin', wyrm: 'iron', health: -25 }, next: 'c3' },
          { text: 'Search the sky for one ember eye', requires: { flag: 'grel_friend' }, effects: { brand: 'emberheart', wyrm: 'ember', renown: 25, flags: { grel_chose: true } }, next: 'c3' },
        ],
      },
      c3: {
        text:
          'It comes for you. Not gently. A head the size of a cart stops a hand’s width from your face, breath hot enough to blister, and a voice that is not Grel’s pours into your skull and **stays**.\n\nThen the pain. White and total, a burning line drawn down your forearm from the inside out. When you can see again, a sigil is smoking on your skin.\n\nThe bond is made. You are a rider of Wyrmhold.',
        choices: [{ text: 'Look up', next: 'c4' }],
      },
      c4: {
        art: 'sea',
        text:
          'From the plateau you can see the whole coast of Caldris laid out under the red moon. Far out along the shore stands a line of tall pale stones, glowing faintly blue.\n\nAs you watch, one of them flickers.\n\nAnd goes dark.\n\nBeneath the water beyond it, something vast and pale turns over, slowly, like a sleeper getting comfortable.\n\nBeside you, your wyrm growls, low enough to shake your ribs.\n\n**End of Year One, Act I.**',
        choices: [{ text: 'Hold on to your wyrm', next: 'END' }],
      },
    },
  },

  // ------------------------------------------------------------ companions
  dax_1: {
    id: 'dax_1',
    title: 'Dax: Dockside',
    blurb: 'Dax wants to show you where he’s from.',
    art: 'varnhollow',
    companion: 'dax',
    affection: 15,
    level: 1,
    requires: ['drowning'],
    start: 'x1',
    reward: { renown: 10, affection: { dax: 5 } },
    scenes: {
      x1: {
        portrait: 'dax',
        text:
          'On your first leave day, Dax drags you down the Cliff Stair into Varnhollow, talking the whole way. The docks smell of tar, fish and rain. His mother, a tiny ferocious woman, is gutting mackerel at a stall and does not stop when she sees you.\n\n“This one,” she says to Dax, pointing her knife at you. “This one is the one you keep talking about?”\n\nDax turns an impressive shade of red.',
        choices: [
          { text: 'Pick up a knife and help her gut fish', check: { stat: 'might', dc: 9 }, effects: { affection: { dax: 5 } }, failEffects: { affection: { dax: 3 }, health: -2 }, next: 'x2' },
          { text: 'Charm her shamelessly', check: { stat: 'charm', dc: 11 }, effects: { affection: { dax: 5 } }, failEffects: { affection: { dax: 2 } }, next: 'x2' },
          { text: 'Ask what Dax was like as a child', effects: { affection: { dax: 3 } }, next: 'x2' },
        ],
      },
      x2: {
        portrait: 'dax',
        speaker: 'Dax Morrow',
        text:
          'Later, sitting on the end of a pier with your legs over the water and a paper cone of fried fish between you, Dax goes quiet.\n\n“My father died on these docks. Crushed under a cargo net because a noble’s steward wanted it unloaded fast.” He shrugs. “Bulwark pays. Bulwark means she never works another day. So I don’t get to die up there. Understand?”',
        choices: [
          { text: '“Then I’ll make sure you don’t.”', effects: { affection: { dax: 5 } }, next: 'END' },
          { text: 'Lean your shoulder against his', effects: { affection: { dax: 4 } }, next: 'END' },
        ],
      },
    },
  },

  dax_2: {
    id: 'dax_2',
    title: 'Dax: The Lighthouse',
    blurb: 'The old lighthouse at the end of the breakwater. Just the two of you.',
    art: 'sea',
    companion: 'dax',
    affection: 40,
    romance: true,
    level: 3,
    requires: ['dax_1'],
    start: 'x1',
    reward: { renown: 15 },
    scenes: {
      x1: {
        portrait: 'dax',
        speaker: 'Dax Morrow',
        text:
          'The abandoned lighthouse is Dax’s secret: a broken door, a hundred and twelve steps, and at the top a room of salt-clouded glass with the whole sea spread out below.\n\n“I used to come up here when I was a kid and pretend I was a rider,” he says. He isn’t looking at the sea. He’s looking at you. “I’m bad at this. I’m better at carrying things. But I think about you all the time, {name}, and I’m tired of pretending I don’t.”',
        choices: [
          { text: 'Kiss him', effects: { romance: 'dax', affection: { dax: 10 } }, next: 'x2' },
          { text: 'Tell him gently that you see him as your closest friend', effects: { affection: { dax: 2 }, flags: { dax_friend: true } }, next: 'x3' },
        ],
      },
      x2: {
        portrait: 'dax',
        text: `He kisses you back like he’s been holding his breath since the Cliff Stair. Outside, the tide comes in. ${FADE}`,
        choices: [{ text: 'Morning', next: 'END' }],
      },
      x3: {
        portrait: 'dax',
        text: 'Dax nods slowly, then laughs, a little cracked. “Best friend. I can do best friend. I’m very good at best friend.” He bumps your shoulder, and for a while you both just watch the sea.',
        choices: [{ text: 'Walk back together', next: 'END' }],
      },
    },
  },

  rhaelle_1: {
    id: 'rhaelle_1',
    title: 'Rhaelle: The Ledger',
    blurb: 'Rhaelle is keeping score. You want to know why.',
    art: 'courtyard',
    companion: 'rhaelle',
    affection: 15,
    level: 1,
    requires: ['drowning'],
    start: 'x1',
    reward: { renown: 10, affection: { rhaelle: 5 } },
    scenes: {
      x1: {
        portrait: 'rhaelle',
        speaker: 'Rhaelle Sund',
        text:
          'You find Rhaelle alone in the empty yard after lights-out, running forms with a real blade in the dark. She doesn’t stop.\n\n“If you’re here to ask about the ledger, the answer is no.”',
        choices: [
          { text: 'Pick up a blade and run forms beside her', check: { stat: 'grace', dc: 12 }, effects: { affection: { rhaelle: 5 }, stats: { grace: 0.5 } }, failEffects: { affection: { rhaelle: 2 }, health: -5 }, next: 'x2' },
          { text: '“I’m not here about the ledger.”', check: { stat: 'charm', dc: 12 }, effects: { affection: { rhaelle: 4 } }, failEffects: { affection: { rhaelle: 1 } }, next: 'x2' },
        ],
      },
      x2: {
        portrait: 'rhaelle',
        speaker: 'Rhaelle Sund',
        text:
          'An hour later she finally stops, breathing hard, and sits on the edge of a sparring circle.\n\n“My brother was a first-year when I was a second-year,” she says. “He fell off the Cliff Stair. Nobody wrote his name down. The college just… didn’t have him anymore.” She stares at her hands. “So I write them all down.”',
        choices: [
          { text: 'Ask his name, and remember it', effects: { affection: { rhaelle: 6 }, flags: { knows_brother: true } }, next: 'END' },
          { text: 'Sit beside her without a word', effects: { affection: { rhaelle: 4 } }, next: 'END' },
        ],
      },
    },
  },

  rhaelle_2: {
    id: 'rhaelle_2',
    title: 'Rhaelle: The High Wall',
    blurb: 'Rhaelle asks you to meet her on the highest wall. She does not say why.',
    art: 'gate',
    companion: 'rhaelle',
    affection: 40,
    romance: true,
    level: 3,
    requires: ['rhaelle_1'],
    start: 'x1',
    reward: { renown: 15 },
    scenes: {
      x1: {
        portrait: 'rhaelle',
        speaker: 'Rhaelle Sund',
        text:
          'The highest wall of Wyrmhold, wind snapping at your coats. Rhaelle has her ledger with her. She opens it to the last page and shows you: your name, written in her neat hand, and beside it nothing at all.\n\n“I don’t want to write anything next to it,” she says, and her voice is very steady and her hands are not. “That’s a problem. I don’t have problems, {name}. I have plans.”',
        choices: [
          { text: 'Take the ledger, close it, and kiss her', effects: { romance: 'rhaelle', affection: { rhaelle: 10 } }, next: 'x2' },
          { text: 'Tell her you’ll make sure she never has to, as her friend', effects: { affection: { rhaelle: 2 }, flags: { rhaelle_friend: true } }, next: 'x3' },
        ],
      },
      x2: {
        portrait: 'rhaelle',
        text: `For once, Rhaelle Sund does not have a plan. She pulls you down out of the wind into the lee of the tower. ${FADE}`,
        choices: [{ text: 'Morning', next: 'END' }],
      },
      x3: {
        portrait: 'rhaelle',
        text: '“Friend,” she repeats, as if testing the weight of a new blade. Then she nods, once, sharp. “Good. Friends are harder to kill. I’ve checked.”',
        choices: [{ text: 'Stay on the wall a while', next: 'END' }],
      },
    },
  },

  isolde_1: {
    id: 'isolde_1',
    title: 'Isolde: Marginalia',
    blurb: 'Isolde has found something in a book no one has opened in a century.',
    art: 'archive',
    companion: 'isolde',
    affection: 15,
    level: 2,
    requires: ['stacks'],
    start: 'x1',
    reward: { renown: 10, affection: { isolde: 5 } },
    scenes: {
      x1: {
        portrait: 'isolde',
        speaker: 'Isolde Crane',
        text:
          'Isolde waves you over the moment you walk in, nearly knocking over an inkwell.\n\n“Look. Look at this.” A crumbling logbook from a Wardstone keeper, three hundred years old. In the margin, in a different, shakier hand: *they sing before they come.*\n\n“Nobody has read this in a century. Nobody but me. And now you.” She seems pleased about the second part.',
        choices: [
          { text: 'Help her cross-reference the keeper’s logs all night', check: { stat: 'wit', dc: 12 }, effects: { affection: { isolde: 6 }, stats: { wit: 1 } }, failEffects: { affection: { isolde: 3 } }, next: 'x2' },
          { text: 'Ask why she trusts you with this', effects: { affection: { isolde: 4 } }, next: 'x2' },
        ],
      },
      x2: {
        portrait: 'isolde',
        speaker: 'Isolde Crane',
        text:
          'Near dawn, cold tea and a dozen open books between you, Isolde rests her chin on her hand.\n\n“My whole life, people have treated what I know like a party trick. You treat it like it matters.” She looks at you over her spectacles. “That’s dangerous, {name}. I could get used to it.”',
        choices: [
          { text: '“Get used to it.”', effects: { affection: { isolde: 5 } }, next: 'END' },
          { text: 'Fix the ink smudge on her cheek', effects: { affection: { isolde: 6 } }, next: 'END' },
        ],
      },
    },
  },

  isolde_2: {
    id: 'isolde_2',
    title: 'Isolde: Lamp Oil',
    blurb: 'The archive is closed. Isolde left the side door unlocked.',
    art: 'archive',
    companion: 'isolde',
    affection: 40,
    romance: true,
    level: 3,
    requires: ['isolde_1'],
    start: 'x1',
    reward: { renown: 15 },
    scenes: {
      x1: {
        portrait: 'isolde',
        speaker: 'Isolde Crane',
        text:
          'The archive after hours: one lamp, a thousand shadows. Isolde is sitting on her desk, not reading, which you have never seen before.\n\n“I have written eleven drafts of what I want to say to you,” she says. “They’re all very well cited. I burned them.” She takes off her spectacles and sets them down carefully. “So I’m going to try it without footnotes.”',
        choices: [
          { text: 'Close the distance and kiss her first', effects: { romance: 'isolde', affection: { isolde: 10 } }, next: 'x2' },
          { text: 'Tell her kindly that you treasure her as a friend', effects: { affection: { isolde: 2 }, flags: { isolde_friend: true } }, next: 'x3' },
        ],
      },
      x2: {
        portrait: 'isolde',
        text: `She laughs against your mouth, surprised and delighted, and reaches blindly behind her to turn the lamp down. ${FADE}`,
        choices: [{ text: 'Morning', next: 'END' }],
      },
      x3: {
        portrait: 'isolde',
        text: 'Isolde puts her spectacles back on and smiles, only a little crooked. “Then I’ll keep the twelfth draft for my memoirs. Now, help me with these shelves, friend.”',
        choices: [{ text: 'Help with the shelves', next: 'END' }],
      },
    },
  },

  corvin_1: {
    id: 'corvin_1',
    title: 'Corvin: Night Patrol',
    blurb: 'Corvin needs someone quiet for a patrol that isn’t on any roster.',
    art: 'sea',
    companion: 'corvin',
    affection: 15,
    level: 2,
    requires: ['drowning'],
    start: 'x1',
    reward: { renown: 10, affection: { corvin: 5 } },
    scenes: {
      x1: {
        portrait: 'corvin',
        speaker: 'Corvin Ashe',
        text:
          '“You’re awake. Good.” Corvin is at your bunk at the third bell, fully dressed. “I need someone who notices things and keeps their mouth shut. You’re the only first-year who qualifies.”\n\nHe leads you down a smugglers’ path to the shore below the college, where one of the Wardstones stands in the surf, glowing weakly.',
        choices: [
          { text: 'Keep watch on the water while he inspects the stone', check: { stat: 'wit', dc: 12 }, effects: { affection: { corvin: 5 }, flags: { saw_shape: true } }, failEffects: { affection: { corvin: 2 } }, next: 'x2' },
          { text: 'Ask what he’s really looking for', check: { stat: 'charm', dc: 13 }, effects: { affection: { corvin: 5 } }, failEffects: { affection: { corvin: 1 } }, next: 'x2' },
        ],
      },
      x2: {
        portrait: 'corvin',
        speaker: 'Corvin Ashe',
        text:
          'Something moves out past the breakers. Pale. Just for a moment.\n\nCorvin sees it too. For the first time since you’ve known him, he isn’t smiling.\n\n“Last winter there were twelve of us on this patrol,” he says. “Three came back. Holt made the other nine into training accidents.” He touches the scar at his collar. “I don’t trust many people, first-year. Don’t make me regret this.”',
        choices: [
          { text: '“You won’t.”', effects: { affection: { corvin: 5 } }, next: 'END' },
          { text: 'Ask the names of the nine', effects: { affection: { corvin: 6 }, flags: { knows_nine: true } }, next: 'END' },
        ],
      },
    },
  },

  corvin_2: {
    id: 'corvin_2',
    title: 'Corvin: Above the Clouds',
    blurb: 'Corvin offers you a ride on his wyrm. At night. Against every regulation.',
    art: 'claiming',
    companion: 'corvin',
    affection: 40,
    romance: true,
    level: 4,
    requires: ['corvin_1', 'claiming'],
    start: 'x1',
    reward: { renown: 15 },
    scenes: {
      x1: {
        portrait: 'corvin',
        speaker: 'Corvin Ashe',
        text:
          'Above the clouds, the world goes silent and silver. Corvin’s wyrm glides on a thermal, and you can feel Corvin’s heartbeat against your back.\n\n“I’ve spent four years making sure nobody here matters to me,” he says into your ear, over the wind. “It kept me alive. It’s stopped working.” A pause. “You broke it, {name}. I’d like you to know that I’m furious about it.”',
        choices: [
          { text: 'Turn in the saddle and kiss him', effects: { romance: 'corvin', affection: { corvin: 10 } }, next: 'x2' },
          { text: 'Tell him you’ll always have his back, as his friend', effects: { affection: { corvin: 2 }, flags: { corvin_friend: true } }, next: 'x3' },
        ],
      },
      x2: {
        portrait: 'corvin',
        text: `His wyrm, with enormous tact, finds a quiet ledge high on the cliffs and pointedly looks the other way. ${FADE}`,
        choices: [{ text: 'Morning', next: 'END' }],
      },
      x3: {
        portrait: 'corvin',
        text: 'Corvin is quiet for a long moment. Then he laughs, the real one, the one you’ve heard maybe twice. “Friend. All right. That’s still more than anyone’s gotten out of me in four years.”',
        choices: [{ text: 'Fly on until dawn', next: 'END' }],
      },
    },
  },
};
