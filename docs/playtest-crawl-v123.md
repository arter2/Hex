# Playtest: bots that play the real dungeon (v123)

Date: 2026-10-23 · Build v123 · 60 careers of 3 hours each (179 hours of play), 10,800 fights, 570 puzzles, 1,246 floors.
Five players (average, good, fast, combo breaker, shopaholic), each of the six colours twice. One career hit the
bots' 15-minute safety stop after 2.1 hours (a Fallen Seal climb it could not finish); its first 2.1 hours are in the tables.

## What changed in the game for this test

- **Pack prices rise with your deepest depth:** booster 90 + 15 × depth, family pack 130 + 20 × depth
  (105 / 150 at depth 1, 390 / 530 at depth 20, 690 / 930 at depth 40).
- **No puzzles before floor 4:** puzzle rooms, switch circuits, ghost tables and cursed idols start at depth 4.
- **Bugs the bots ran into, fixed** (each one would hit real players):
  1. **The light-and-mirrors puzzle could not be solved.** Touching a puzzle mirror opened the Mirror room's
     "touch the glass and your reflection fights you" dialog, because both things were named `mirror`.
  2. **A tap on a statue kept turning it** every 0.35 s until you tapped somewhere else (8 or 9 turns in 3 s).
     A tap now uses a thing once; holding a key or the stick still repeats.
  3. **You could be pinned in place**, unable to move any way: by a spike, dart, fire, pit or teleport trap you had
     just set off (it stays armed, and your body was still over its edge), or by a chest or pedestal that appeared
     under the edge of you when you solved a puzzle. They now only stop you stepping onto them, and puzzle rewards
     never appear under you.
  4. **A card burning up mid-dive threw you out of the dungeon.** The deck dropped under 45 cards and the next fight
     silently sent you to camp, losing the dive. The dive now goes on with the short deck and tells you; Explore and
     Battle at camp say why they will not start, instead of doing nothing.
  5. **A monster chasing you stopped just short** once it reached your tile, and waited while you stood still.
  6. **Talking to the rival after beating them to the treasure could crash** (their spare item could be a scroll).

## How the bots play

Each bot plays a whole career in the real game: the same screens, the same code, the same rules. Nothing is
simulated except the clock, which runs fast because the map is never drawn.

- **Start:** a new human character, the one-colour deal (20 commons and 10 uncommons of its colour, 30 random,
  1 or 2 rares, its colour's hero), a deck built in its style, 100 gold, depth 1.
- **On the map** it walks the way a player taps: the game's own path-to-tap, so it goes wherever a tap would take
  you (across puzzle rooms too, until a careful player learns not to). It bumps into things to use them, opens
  chests, picks things up, reads tablets and talks to people, takes quests now and then, rests at shrines, buys a
  healing draught from merchants, and searches for secrets when it hears the game's whisper ("a cold draft…").
  It explores until it has seen enough of the floor for its style, then takes the stairs and picks a way down on
  the path map.
- **Dialogs and screens:** it waits to read each one (longer text, longer wait), then taps a button the way its
  style would. It opens packs card by card, closes the victory screen and spends level-up points.
- **Fights** are the human battle bot from v121 (joystick, flicks, reaction times, missed threats, combo skill),
  now taking over the fight the dungeon started. It also knows the dungeon trials' rules (step on the glowing
  tiles; break them in order), as a player reads them off the board.
- **Puzzles** are solved with what the game shows the player and the bot's skills: knowing the colour wheel,
  remembering a shown path or tune, working out sums and pipe turns, not slipping on a step. Wrong moves are
  real moves in the game, with their bites, resets and noise. It remembers stones that bit it, and gives up
  after a few tries, as a person would.
- **Camp:** every few floors (every 3 for the shopaholic, 4 for most, 6 for the fast player), and whenever it arrives
  on a floor badly hurt, it goes up to camp from the stairs up (free there; the floor waits), and after a death it
  comes back from camp. At camp it puts on better gear, spends points, buys packs at the new prices (careful players
  keep a reserve; the shopaholic spends it all) and rebuilds its deck.
- **When stuck** it does what a player does: disarms a trap in the way, picks a lock, searches the walls nearest the
  part of the map it can see but not reach, climbs back up for a Fallen Seal's Wayshard, and as a last resort flees
  to camp from the pause menu.

## The fun and frustration score

Every moment a person would feel is logged with a weight: a new card is +2 (rare +6, legendary +10), a chest +1.5,
a won fight +2 (+4 for a close call, +8 a boss), a solved puzzle +6 (+3 if clean, +2 if quick), a secret +4, a
level +3. On the other side: a hidden trap going off +2.5 plus the damage, being surprised by a monster +1.5, a
puzzle mistake +2 (growing with each repeat), giving up a puzzle +6, a death +12 plus the gold lost, 30 seconds
with nothing new +1.2, a card burning up +2, four dialogs in 25 seconds +1.2, a fight over 100 s, and so on (all in
`tools/playtest/crawl.js`). Each style has its own patience: when the frustration of the last ten minutes passes
it (average 30, good 45, fast 22, combo 40, shopaholic 35), the moment is marked as one where that player would
likely put the game down. The fast player feels waiting, dead time, slow puzzles and long fights double.

The weights are a judgement, not a measurement. Read the tables for what stands out against what, and the counts
for how often things happen.

## What it shows: the pain points, worst first

1. **Hidden traps are the biggest frustration by far: about half of all of it, and most of the moments a player
   would put the game down.** The bots set off a hidden trap about every 3.5 minutes of walking at depths 1–3 and about
   every minute at depth 21 and deeper (16 an hour of exploring at 1–3, 58 at 21+), plus 15–20 trapped chests an hour.
   Teleport runes, dart and spike traps are the most common. Of the 607 "would put it down" moments, 438 came after a
   run of traps. Searching rarely helps: 9,141 searches found 429 things.
2. **You lose more HP walking the map than fighting.** 538 HP an hour to traps, trapped chests, blades and puzzles,
   against 304 an hour in fights. 83–90% of dungeon fights cost 3 HP or less, every player wins 99–100% of them, and the
   average fight costs 1.6 HP at depths 1–3 and 7.8 at 21+. Deaths are rare (32 in 179 hours) and come from a few foes:
   the Thunder Roc, the Dungeon Warden and the rare Prism Ram, and 5 from traps on the map.
3. **Cards burning up:** a career loses about 18 cards to charges running out (against 364 found). Each one is a card
   gone from the collection for good, and a short deck afterwards.
4. **Gold piles up even at the new prices.** A 3-hour career earns about 36,000 gold. The careful players bought
   10–13 packs on their camp trips and still finished with 26,000–37,000 gold; the shopaholic bought 71 packs and kept
   8,700. The dungeon's chests and gold piles pay far more than the battle-only mode that set the old prices.
5. **Fallen Seals:** one floor in eight (165 of 1,246) had its stairs sealed, sending the player back up a floor for a
   Wayshard; 124 were opened, 10 given up, and a few ended in fleeing.
6. **Puzzles are mostly fine; four stand out.**
   - **Braziers** take longest (2 m 38 s on average) and are solved least (56%), because the 30 s flame keeps dying on
     the way to the next room.
   - **The stone path** costs 53 HP a try on average (4.6 bites). Wrong stones bite even before you start, and other
     stones carry the same symbol, so it is trial and error.
   - **Levers** take over a minute: the order is scratched on a wall somewhere else on the floor.
   - **Puzzle rooms in the way:** the path-to-tap walks you straight across an unsolved stone field (it bites) or across
     the ice (you slide), and solved ice stays slippery. That happened 358 times.
7. **"New card!" pop-ups:** 23 an hour, out of 50 dialogs an hour. Every card found stops the game.
8. **Surprise fights:** 12% of fights start with the monster striking first; mimics are the most common (191).

## What they enjoyed

New cards are almost half of all the fun (449 an hour), then won fights, chests, gear and first strikes. Fun goes
up with depth (1,129 an hour at 1–3, 3,382 at 21+) because the loot gets better, but frustration rises faster
(187 to 637). The fast player goes deepest (32 on average) and has the most fun an hour, but also dies the most;
the good player explores every room and is the slowest to go down (22).

## What to change (your call)

- **Traps:** fewer hidden traps deeper down, a visible tell more often, or Wisdom and searching that find them more
  often. This is the change that would remove the most frustration.
- **Dungeon fights:** most are no danger at all. Tougher groups, or fewer and harder fights.
- **Gold:** less gold from chests and piles in the dungeon, or more things to spend it on (pack prices alone do not
  bind).
- **Burning cards:** fewer charge cards, more charges, or a warning before a card's last charge.
- **Puzzles:** a longer brazier flame (45 s), stones that only bite once you have stepped on the start plate, and a
  path-to-tap that walks around an unsolved puzzle's stones and ice.
- **"New card!" pop-ups:** a small toast instead of a dialog for common cards.

## Caveats

- The fun and frustration weights are a judgement (see above), not a measurement of people; the counts are real.
- The bots read and decide faster than a first-time player and never get bored of a floor; they do not learn the map
  between careers.
- 12 careers per player: big differences are real, small ones are noise.

---

# The full tables

60 careers, 179.3 hours of play in all, 10800 fights, 570 puzzles met. Errors: 1.

## Each player

| Player | Hours | Deepest (avg, range) | Deaths / h | Fights / h | Fun / h | Frustration / h | Fun : frustration | Would quit (per h) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| average | 36.1 | 25.1 (20–28) | 0.1 | 49 | 808 | 180 | 4.5 | 3.5 |
| good | 36.0 | 22.3 (20–28) | 0.1 | 59 | 911 | 205 | 4.4 | 2.0 |
| fast | 35.1 | 32.3 (18–39) | 0.6 | 70 | 1070 | 230 | 4.6 | 5.1 |
| combo | 36.0 | 26.6 (21–29) | 0.2 | 66 | 1029 | 208 | 5.0 | 3.0 |
| shopaholic | 36.0 | 22.8 (16–25) | 0.0 | 58 | 1065 | 190 | 5.6 | 3.3 |

## Where the time goes

| Player | Walking & exploring | Fighting | Puzzles | Dialogs & screens | Camp |
|---|---:|---:|---:|---:|---:|
| average | 44% | 41% | 1% | 9% | 4% |
| good | 48% | 40% | 1% | 8% | 3% |
| fast | 51% | 40% | 1% | 5% | 3% |
| combo | 50% | 35% | 1% | 10% | 4% |
| shopaholic | 48% | 36% | 1% | 8% | 6% |

## Pain points (frustration, all players)

| Kind | Share | Per hour | Times | Felt most by | Examples |
|---|---:|---:|---:|---:|---:|
| trap:unseen | 23% | 47.1 | 3376 | combo (53.0/h) | teleport rune ×559; dart trap ×538; spike trap ×501 |
| hurt:trap | 23% | 45.9 | 2390 | combo (52.1/h) | a dart trap ×551; a spike trap ×517; a fire rune ×514 |
| hurt:chest | 10% | 20.9 | 1452 | fast (25.8/h) | a trapped chest ×1195; a falling block trap ×257 |
| card:burned | 6% | 12.0 | 1067 | shopaholic (14.7/h) | Baghdad Battery ×25; Magnet Shot ×22; Marsh Leech Pouch ×21 |
| bad:other | 6% | 11.5 | 2573 | combo (13.5/h) | A swinging blade cuts you! ×507; The floor collapses beneath you! ×292; The floor gives way and you fall into a pit! ×257 |
| fight:surprised | 5% | 10.8 | 1294 | combo (13.9/h) | Mimic ×191; Cutpurse ×65; Gloop ×58 |
| dead time | 4% | 7.7 | 1003 | fast (9.9/h) | stairs ×534; explore ×98; off-ice ×76 |
| hurt:hazard | 4% | 7.4 | 505 | good (9.5/h) | a swinging blade ×505 |
| cursed | 3% | 6.0 | 428 | good (7.1/h) | The totem’s gaze settles on you: cursed (max HP -#%). Smash it, or cure it. ×362; A glittering idol… and a chill climbs your arm. You are cu |
| puzzle:mistake | 3% | 5.8 | 368 | average (7.5/h) | The stone bites! Spikes jab up through the cracks. ×158; The last violet flame gutters out. The cold lifts from the floor. ×90; A sour clang |
| death | 3% | 5.2 | 32 | fast (18.5/h) | fight: Thunder Roc ×4; fight: Dungeon Warden ×3; fight: ★ Prism Ram ×3 |
| fight:dull | 2% | 5.0 | 1494 | average (6.6/h) | Dungeon Warden #s, no danger ×139; Sellsword #s, no danger ×96; Gloop #s, no danger ×83 |
| puzzle:crossed | 2% | 4.1 | 358 | good (12.6/h) | slid across the ice crossing the room on the way somewhere else ×328; bitten crossing a puzzle room on the way somewhere else ×30 |
| seal | 1% | 2.8 | 165 | combo (3.7/h) | A Fallen Seal holds these stairs shut. Its Wayshard lies on depth #, up the stairs and a  ×144; A Fallen Seal holds these stairs shut. Its W |
| hurt:puzzle | 1% | 2.0 | 174 | good (2.6/h) | a biting stone ×126; a dead stone ×23; a rune’s backlash ×17 |
| puzzle:gaveup | 1% | 1.6 | 47 | fast (2.7/h) | trial: declined the trial ×17; runes: could not work out the rune order ×6; braziers: the flame kept dying on the way ×5 |
| hurt:other:falling stone | 1% | 1.0 | 92 | shopaholic (1.7/h) | falling stone ×92 |
| fight:long | 1% | 1.0 | 145 | average (2.2/h) | Elder Treant #s ×34; Glacier Queen #s ×20; Thunder Roc #s ×19 |
| disarm:fail | 0% | 0.9 | 79 | good (1.3/h) | You slip! ×79 |
| lost | 0% | 0.6 | 31 | good (0.9/h) | boss unreachable ×13; cursed, no altar found ×11; no way on found ×7 |
| floor:long | 0% | 0.6 | 22 | fast (2.0/h) | depth # over #s ×22 |
| stuck | 0% | 0.6 | 48 | shopaholic (2.0/h) | walk timeout ×48 |

## What they enjoyed

| Kind | Share | Per hour | Times | Examples |
|---|---:|---:|---:|---:|
| card:new | 46% | 449.2 | 18667 | Winterheart’s Great White Shark (rare) ×49; Pyre-Lord’s Dragon Kiln (rare) ×47 |
| fight:win | 19% | 184.7 | 10773 | Gloop ×462; Frost Mite ×460 |
| chest | 10% | 101.0 | 11040 |  |
| gear | 6% | 63.3 | 4413 | Storm Trident ×252; Kabuto ×251 |
| fight:strike | 6% | 57.3 | 6846 |  |
| puzzle:solved | 3% | 24.7 | 422 | plates in #s, # mistakes ×75; runes in #s, # mistakes ×42 |
| depth:new | 2% | 21.1 | 1246 | depth # ×1246 |
| quest:done | 2% | 18.4 | 827 | +# XP · quest reward ×198; +# XP · a prisoner’s thanks ×182 |
| levelup | 2% | 15.8 | 945 | level # ×945 |
| secret | 1% | 7.9 | 353 | You find a hidden door! ×260; You pull the hidden lever. Somewhere, stone grinds aside. ×29 |
| card:dupe | 1% | 7.0 | 3148 | Minotaur's Labyrinth (rare) ×9; Thunder Row (uncommon) ×9 |
| legendary | 1% | 6.2 | 140 | A legendary find: Staff of the First Flame ✹! ×35; A legendary find: Frostfang Scepter ✹! ×33 |
| blessing | 1% | 5.2 | 234 | The orb sinks into your hands: a blessing of Might (+# wand damage, +# charged), for good. ×22; The  |
| key | 0% | 2.8 | 331 | Inside lies a Silver key. ×148; Inside lies a Bronze key. ×131 |

## By depth

| Depth | Hours there | Fun / h | Frustration / h | Worst three |
|---|---:|---:|---:|---:|
| 1–3 | 11.2 | 1129 | 187 | trap:unseen 41/h, card:burned 33/h, hurt:trap 30/h |
| 4–7 | 14.2 | 1669 | 280 | trap:unseen 59/h, hurt:trap 46/h, card:burned 33/h |
| 8–12 | 19.2 | 1825 | 405 | trap:unseen 86/h, hurt:trap 77/h, hurt:chest 39/h |
| 13–20 | 27.3 | 2010 | 488 | hurt:trap 125/h, trap:unseen 124/h, hurt:chest 48/h |
| 21+ | 14.5 | 3382 | 637 | hurt:trap 162/h, trap:unseen 145/h, hurt:chest 70/h |

## Puzzles

| Puzzle | Met | Solved | Gave up | Skipped | Avg time | Mistakes each | HP lost each | Why they gave up |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| plates | 97 | 77% | 3% | 19% | 8s | 0.1 | 0.0 | blocks would not sit on the plates ×3 |
| runes | 57 | 74% | 11% | 16% | 14s | 0.4 | 4.0 | could not work out the rune order ×6 |
| levers | 49 | 61% | 8% | 24% | 67s | 0.1 | 0.0 | pulled them wrong ×4 |
| trial | 46 | 72% | 9% | 17% | 41s | 0.1 | 0.0 | declined the trial ×15 |
| braziers | 45 | 56% | 11% | 11% | 158s | 0.9 | 0.0 | the flame kept dying on the way ×5 |
| path | 41 | 76% | 10% | 15% | 28s | 4.6 | 53.0 | kept stepping on biting stones ×4 |
| bells | 36 | 72% | 8% | 19% | 34s | 1.3 | 0.0 | could not repeat the tune ×3 |
| riddle | 34 | 88% | 3% | 9% | 6s | 0.3 | 3.5 | the guardian fell silent |
| statues | 33 | 67% | 0% | 27% | 9s | 0.1 | 0.0 |  |
| mirrors | 32 | 88% | 0% | 13% | 4s | 0.1 | 0.0 |  |
| memory | 28 | 86% | 7% | 7% | 23s | 1.2 | 6.0 | could not remember the path ×2 |
| scales | 26 | 85% | 0% | 15% | 14s | 0.0 | 0.0 |  |
| shift | 25 | 84% | 4% | 12% | 26s | 0.0 | 0.0 | could not join the channel |
| ice | 21 | 62% | 5% | 33% | 8s | 0.1 | 0.0 | no way across the ice |

## Fights in the dungeon

| Player | Fights | Won | Avg length | Over 100 s | No danger (≤3 HP lost) | Surprised | Ambush/strike |
|---|---:|---:|---:|---:|---:|---:|---:|
| average | 1763 | 100% | 30s | 3% | 83% | 17% | 49% |
| good | 2111 | 100% | 24s | 1% | 89% | 10% | 73% |
| fast | 2469 | 99% | 20s | 1% | 85% | 11% | 69% |
| combo | 2378 | 100% | 19s | 0% | 90% | 14% | 64% |
| shopaholic | 2079 | 100% | 22s | 2% | 89% | 9% | 73% |

## Deaths

- fight: Thunder Roc ×4
- fight: Dungeon Warden ×3
- fight: ★ Prism Ram ×3
- map: a trapped chest ×2
- fight: Radiant Golem ×2
- fight: Crossbowman ×2
- fight: Magma Wyrm ×2
- map: a swinging blade ×2
- fight: Corrupted Knight ×1
- fight: Shadow Assassin ×1
- map: a spike trap ×1
- fight: Thunder Ram ×1

## Moments a player would likely put the game down

607 in all (3.4 an hour). What filled the 10 minutes before, by its biggest part:

- hurt:trap ×243
- trap:unseen ×195
- hurt:chest ×40
- card:burned ×30
- death ×26
- puzzle:mistake ×23
- hurt:hazard ×22
- cursed ×5
- puzzle:crossed ×4
- puzzle:gaveup ×4
- lost ×4
- hurt:other:falling stone ×3
- dead time ×3
- floor:long ×2
- puzzle:slow ×1
- fight:surprised ×1
- bad:other ×1

By depth: 1–3: 17, 4–7: 48, 8–12: 122, 13–20: 244, 21+: 176.

## Damage outside fights (HP per hour)

trap 309, chest 152, hazard 55, puzzle 16, other:falling stone 6

## Dialogs

50 an hour. Most often: New card! 23/h, Choose your way down 4/h, Card found 3/h, Wanted 1/h, A scream! 1/h, Scattered pages 1/h, Violet fire 1/h, A nest hatches 1/h.

## Money and packs

| Player | Packs bought | Gold spent on packs | Gold at the end | Level | Deck value start → end | Cards burned up |
|---|---:|---:|---:|---:|---:|---:|
| average | 10.8 | 4468 | 25702 | 16.4 | 23 → 45 | 15.0 |
| good | 9.8 | 3702 | 28976 | 15.2 | 23 → 58 | 19.7 |
| fast | 12.7 | 6410 | 35811 | 19.8 | 24 → 49 | 20.3 |
| combo | 11.2 | 4785 | 36953 | 17.2 | 24 → 45 | 12.3 |
| shopaholic | 71.1 | 25667 | 8754 | 15.3 | 22 → 67 | 22.0 |

## Secrets

Searches: 9141, found something: 429; whispered hints heard: 1425.

## Errors

- real-time limit at 7728s, depth 18, task climb ×1

