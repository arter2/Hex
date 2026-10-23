# Playtest with a human-like bot (v121)

Date: 2026-10-23 · Build v121 · 1,404 fights, no errors · Tools: `tools/playtest/` (bot.js, runner.js, mkjobs.js, analyze.js)

## Why

Earlier playtests used a bot that saw every attack the moment it appeared, dodged after 0.3 s, tapped Fire every
0.3 s for whole fights (166 shots a minute) and solved every Spell screen by trying every mix. It said the game was
far too easy and that the wand did most of the work. That didn't match how the game feels in the hand.

## The bots

| | Robot (old) | Good human | Casual human |
|---|---|---|---|
| Reaction to an attack | 0.3 s, to telegraphs only; shots and wind-ups at once | 0.5 s ± 0.12 (never under 0.3) | 0.7 s ± 0.18 (never under 0.4) |
| Attacks never noticed | 0 | 8% | 19% |
| Fire | every 0.3 s, all fight | ~2.2 taps a second, random gaps; a moment's rest after each move; 8% held charge shots | ~1.4 taps a second; 10% charge shots |
| Taps the wrong tile | never | 4% | 8% |
| Finds the best combo | always | 70% | 35% (otherwise its strongest cards) |
| Casts after the card is ready | at once | 0.3-1 s | 0.5-2 s |
| Notices the Spell gauge is full | at once | 0.4-1.5 s | 0.8-3 s |

Every bot plays a fresh level 1 character with no gear and the 6 starter decks, 6 fights per deck and depth.

## Results

Win % / average fight length (s):

| Bot | d1 | d3 | d5 | d8 | d10 | d12 | d14 | d16 | d18 | d20 | d30 | d45 | d60 | All |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Robot | 100/8 | 100/24 | 100/42 | 100/223 | 100/123 | 100/245 | 94/164 | 97/287 | 83/256 | 97/419 | 81/280 | 75/315 | 14/407 | 88% |
| Good human | 100/11 | 100/29 | 100/46 | 83/247 | 78/152 | 56/227 | 78/165 | 42/231 | 36/220 | 47/381 | 33/234 | 14/168 | 0/129 | 59% |
| Casual human | 100/13 | 100/33 | 94/62 | 64/238 | 61/122 | 44/221 | 58/156 | 28/193 | 19/186 | 19/247 | 3/106 | 3/81 | 0/49 | 46% |

Damage shares and pace:

| Bot | Wand | Cast cards | Creatures | Other | Wand shots/min | Casts/min | HP lost per fight |
|---|---|---|---|---|---|---|---|
| Robot | 38% | 26% | 26% | 10% | 166 | 13.2 | 14 |
| Good human | 29% | 28% | 34% | 10% | 103 | 12.6 | 96 |
| Casual human | 23% | 29% | 37% | 11% | 80 | 12.7 | 129 |

Win % by deck (all depths):

| Bot | Burn + Storm | Frost + Storm | Verdant + Shadow | Frost + Light | Verdant + Light | Fire + Shadow |
|---|---|---|---|---|---|---|
| Robot | 90% | 90% | 95% | 81% | 94% | 78% |
| Good human | 36% | 56% | 73% | 67% | 86% | 36% |
| Casual human | 28% | 36% | 59% | 55% | 71% | 26% |

## What it shows

1. **The robot was the problem, not the game.** Played like a person, the game is not too easy: the good human wins
   59% overall and starts losing from depth 8. The robot hid this with perfect dodging.
2. **Cards carry the fight.** For the humans, cast cards and creatures deal 62-66% of the damage and the wand 23-29%.
   The robot's wand share (38%, 47% early) came from tapping 166 times a minute.
3. **Decks matter, and the Fire decks fall behind.** Depths 8-20, good human: Verdant + Light 98%, Verdant + Shadow
   88%, Burn + Storm 24%, Fire + Shadow 21%. The Verdant decks heal 122-126 HP a fight and summon creatures that
   take hits and deal half their damage; the Fire decks heal 7-36 and summon none. A human makes mistakes, so
   sustain decides who survives. The robot made no mistakes, so it never saw this.
4. **A few mistakes kill.** A lost fight is 4-5 hits (the biggest about 45 HP of 120), after about 2 minutes.
5. **Enemy shots do half the damage** humans take (48-55%); then blinks, cleaves, ice slams and cross attacks.
   The enemies behind most losses: paladin, caller, sellsword, shade, ram, mite, cultist, bomber.
6. **Fights are long in the middle.** 150-250 s from depth 8 on, 250-380 s on boss floors, and some frost and
   light fights at depths 18-45 hit the 7-minute limit.

## Caveats

- No levels, gear or collected cards: a real player at depth 16 is stronger, so the deep win rates are low. The
  comparisons (robot vs human, deck vs deck, what hurts) hold; the absolute deep numbers don't.
- The bots walk by tapping tiles (moveTo), not with the joystick or flicks.
- The humans still never panic, never misread which row a shot is in, and see the whole board at once.

## Rerun

    node tools/playtest/mkjobs.js /tmp/jobs.json human_good 6 1,3,5,8,10 0,1,2,3,4,5
    BOTFILE=bot.js node tools/playtest/runner.js /tmp/jobs.json /tmp/out/full_0.jsonl
    node tools/playtest/analyze.js /tmp/out
