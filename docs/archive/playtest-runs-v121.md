# Playtest: whole runs with joystick, flicks and deck building (v121)

Date: 2026-10-23 · Build v121 · 48 runs, 1,928 fights, no errors · Tools: `tools/playtest/` (bot.js, mkruns.js, run-runner.js, analyze-runs.js)

## The setup

- **Controls:** the bots move the way a thumb does: they hold the joystick toward where they want to be (with a few
  degrees of wobble) and let go early so the slide and the magnet finish it, and flick to get out of an attack that
  is about to land. They use the game's own stick and flick code with the v118 settings. About 2 flicks and 11-16 s
  of stick a fight.
- **The start:** one colour; 20 commons and 10 uncommons of it, 30 random commons and uncommons, 1 or 2 rares (rank
  1-6), and the colour's hero. Each bot builds its first deck from that.
- **A run:** one battle per depth, from 1 down. A win pays what the game pays (cards, gold, gear, XP, a boss's pack);
  a loss costs 20% of the gold and the depth is tried again; three losses in a row end the run. The bots level up,
  spend their points, put on better gear and rebuild their deck after every fight. Capped at depth 40 / 60 fights.
  No shop and no dungeon floors (gold just piles up).
- **The four players** (6 colours × 2 runs each):

| | Average | Good | Fast | Combo breaker |
|---|---|---|---|---|
| Reaction | 0.65 s, misses 14% | 0.5 s, misses 8% | 0.5 s, misses 10%, dodges only what is close | 0.55 s, misses 10% |
| Fire | 1.7 taps/s | 2.2 | 2.8 | 2.0 |
| Combos | finds the best 45% | 75% | 50% | always |
| Deck | keeps its 60, swaps in some new cards | best 50 with a mix of attack, defence and creatures | 45, damage first, almost no wards or boons | 45 around one rune, 4 copies of its best |
| Stats | CON, INT, STR, DEX | INT, CON, CST, RCH | STR, INT, RCH | INT, CST, CON |

## Results

| Player | Cleared depth 40 | Losses per run | Win % at depths 25-40 | Fight length at 25-40 | HP lost per fight at 25-40 | Level at the end |
|---|---|---|---|---|---|---|
| Average | 9 of 12 (the others stopped at 35-40) | 2.5 | 87% | 160 s | 151 | 40 |
| Good | 12 of 12 | 0.3 | 98% | 121 s | 67 | 41 |
| Fast | 11 of 12 (one Storm run died at depth 12) | 1.3 | 95% | 109 s | 72 | 39 |
| Combo breaker | 12 of 12 | 0.1 | 99% | 139 s | 57 | 41 |

| Player | Wand | Cards | Creatures | Combos per fight | Rune Sets | Flushes | Straights | Rune Runs | Biggest rune in the deck |
|---|---|---|---|---|---|---|---|---|---|
| Average | 38% | 22% | 41% | 4.1 | 1.5 | 0.5 | 0.2 | 1.6 | 28% |
| Good | 29% | 34% | 37% | 6.0 | 1.9 | 0.5 | 0.3 | 3.0 | 26% |
| Fast | 42% | 29% | 30% | 3.9 | 1.5 | 0.3 | 0.2 | 1.7 | 27% |
| Combo breaker | 28% | 38% | 33% | 9.0 | 3.9 | 1.2 | 1.1 | 2.3 | 57% |

By colour, every colour reaches 37-41 on average; the Fire weakness from the fixed-deck test is gone once decks grow.

### What makes it easy: switching parts off (average and good, 6 colours each)

| Variant | Average: depth reached / losses / win % at 25+ | Good: depth / losses / win % at 25+ |
|---|---|---|
| Everything on | 40.0 / 2.5 / 87% | 41 / 0.3 / 98% |
| No stat points from levels | 33.0 / 6.0 / 71% | 41 / 2.8 / 89% |
| No gear upgrades | 35.0 / 6.2 / 71% | 41 / 1.0 / 94% |
| Deck never changes | 39.2 / 4.2 / 79% | 41 / 0.2 / 98% (4 runs; 2 ended by a harness bug) |

## What it shows

1. **With progression, the game is too easy past the early floors.** The good and combo players lost 4 fights in
   about 970. Even the average player won 87% at depths 25-40 and 9 of 12 cleared depth 40.
2. **Levels outrun the depth.** A battle-only player gains about one level a fight, 2 stat points each, so by depth
   30 the main stats sit at the cap of 24 (CON 24 is +84 HP; INT 24 is +56% card power). Stat points and gear each
   take the average player from 33-35 to 40. For a good player no single part matters: any two are enough.
3. **The combo breaker didn't break combos.** It built a 45-card deck that is 57% one rune and made 9 combos a fight
   (4 Rune Sets), and did as well as the good player, not better. Combos are strong and reliable but not broken.
   No recipe was ever made: recipe cards aren't in the start deal and never dropped.
4. **Going fast barely pays.** The fast player's fights are 10% shorter, it takes about the same damage, and it is
   the only one to lose a whole run early. Fight length is set by enemy HP, not by how hard you push.
5. **Fights are long all the way down:** 90-160 s from depth 5 on, for every style.
6. **The controls hold up.** About 2 flicks and 11-16 s of stick a fight, no stuck moves, no errors in 1,928 fights.

## A bug found on the way

Charge cards that run out of uses burn up and leave the deck. If that takes the active deck below 45, the camp
shows the count in red, but **Explore** and **Battle only** then do nothing with no message (`enterExplore` and
`fight` return quietly).

## Caveats

- Battle only, one fight per depth: in the dungeon a player fights more per depth and levels even faster.
- No shop: the bots end with 4,500-6,000 gold unspent. Buying packs would make them stronger still.
- 12 runs a player, 6 per variant: the big gaps are clear; small ones (a point or two of depth) are noise.
