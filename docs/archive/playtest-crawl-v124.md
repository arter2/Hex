# Playtest: traps, charges and pop-ups (v124)

Date: 2026-10-23 · Build v124 · 60 careers of 3 hours (180 hours), 11,518 fights, 583 puzzles, 1,524 floors, no errors.
The same bots, players and seeds as [playtest-crawl-v123.md](playtest-crawl-v123.md). Two things changed besides the game:
- **The bots react to traps.** They notice a trap's tell some of the time. That chance is an assumption, not a
  measurement: average 35%, good 55%, fast 25%, combo 45%, shopaholic 50%. They also stop and search when they hear the
  click (average 60%, good 90%, fast 40%).
- **The bots shop like players.** At dungeon merchants they buy better gear, upgrades, good cards, blessings and
  potions, and sell gear they don't wear. At camp they recharge low Charge cards and buy better gear and good cards
  before packs.

## v123 → v124

| | v123 | v124 |
|---|---|---|
| Frustration an hour (average / good / fast / combo / shopaholic) | 180 / 205 / 230 / 208 / 190 | 104 / 117 / 149 / 115 / 103 |
| Fun ÷ frustration (average / good / fast / combo / shopaholic) | 4.5 / 4.4 / 4.6 / 5.0 / 5.6 | 8.2 / 8.9 / 7.6 / 9.7 / 11.1 |
| "Would put the game down" moments an hour | 3.4 | 1.2 |
| Hidden traps a floor | about 5 (up to 9) | 2.4 (0–8; 2 at most on easy floors) |
| Hidden traps set off | 3,376 | 823 |
| HP lost to traps an hour | 309 | 90 |
| HP lost on the map an hour (traps, chests, blades, puzzles) | 538 | 304 |
| Dialog boxes an hour / of them "New card!" | 50 / 23 | 36 / 9 |
| Puzzle damage an hour | 16 | 6 |
| Gold spent per career (not counting the shopaholic) | 4,000–6,400 (packs only) | 8,000–10,000 (packs, gear, cards, upgrades, recharges) |
| Gold left at the end (same four players) | 26,000–37,000 | 29,000–41,000 |

Tells came into view within 3 tiles 2,594 times; the bots noticed 1,183 of them, and heard 2,457 clicks.

## What it shows

1. **Traps are no longer the main problem.** Hidden traps went from about half of all frustration to a fifth, and the
   moments a player would put the game down fell by two thirds. What is left is spread out.
2. **The new top pain is the trapped chest** (1,344 hits, 18.7 frustration an hour). It is 12% of chests, with no tell,
   and you only find out by opening it. **Swinging blades** come next (598 hits; they are visible, but they catch
   players walking past).
3. **Burning cards are still about 15–24 per career.** The bots recharge at camp, but only every few floors, and
   cards often run dry between visits. A recharge from the dungeon merchants would help.
4. **Gold still piles up.** Shopping like a player spends twice as much (8,000–10,000 a career), but the careful players
   still finish with 29,000–41,000. The dungeon simply pays too much. **Less gold from chests and piles** is now the
   clear fix; prices are not the issue.
5. **Fights were not changed in v124** and are still mostly no danger (the bots won 99–100%). That is v125, from your
   answers: [../fight-patterns.md](../fight-patterns.md).

---

# The full tables

60 careers, 180.2 hours of play in all, 11518 fights, 583 puzzles met. Errors: 0.

## Each player

| Player | Hours | Deepest (avg, range) | Deaths / h | Fights / h | Fun / h | Frustration / h | Fun : frustration | Would quit (per h) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| average | 36.0 | 25.1 (22–28) | 0.1 | 52 | 855 | 104 | 8.2 | 0.9 |
| good | 36.0 | 21.4 (18–24) | 0.0 | 66 | 1035 | 117 | 8.9 | 0.2 |
| fast | 36.0 | 33.9 (31–38) | 0.5 | 74 | 1130 | 149 | 7.6 | 3.9 |
| combo | 36.1 | 25.8 (24–29) | 0.1 | 68 | 1122 | 115 | 9.7 | 0.5 |
| shopaholic | 36.0 | 20.8 (19–23) | 0.0 | 60 | 1147 | 103 | 11.1 | 0.6 |

## Where the time goes

| Player | Walking & exploring | Fighting | Puzzles | Dialogs & screens | Camp |
|---|---:|---:|---:|---:|---:|
| average | 49% | 36% | 1% | 9% | 5% |
| good | 51% | 38% | 1% | 7% | 3% |
| fast | 53% | 40% | 1% | 5% | 2% |
| combo | 51% | 35% | 1% | 9% | 4% |
| shopaholic | 51% | 33% | 1% | 7% | 8% |

## Pain points (frustration, all players)

| Kind | Share | Per hour | Times | Felt most by | Examples |
|---|---:|---:|---:|---:|---:|
| hurt:chest | 16% | 18.7 | 1351 | fast (24.1/h) | a trapped chest ×1344; a trapped lock ×7 |
| hurt:trap | 11% | 13.1 | 675 | fast (17.5/h) | a spike trap ×143; a dart trap ×127; a pit ×101 |
| card:burned | 11% | 12.8 | 1150 | fast (15.8/h) | Venom Vials ×24; Blasting Caps ×24; Naphtha Grenades ×23 |
| trap:unseen | 10% | 11.4 | 823 | fast (14.5/h) | spike trap ×131; dart trap ×118; alarm rune ×105 |
| fight:surprised | 9% | 11.0 | 1318 | average (14.4/h) | Mimic ×187; Bandit ×66; Frost Mite ×66 |
| hurt:hazard | 8% | 8.9 | 598 | good (13.8/h) | a swinging blade ×598 |
| bad:other | 8% | 8.8 | 1988 | fast (10.1/h) | A swinging blade cuts you! ×598; A rune shrieks! Everything on this floor heard that. ×107; Far off, chains rattle: the Dungeon Warden answe |
| cursed | 7% | 8.5 | 614 | good (10.3/h) | The totem’s gaze settles on you: cursed (max HP -#%). Smash it, or cure it. ×526; A glittering idol… and a chill climbs your arm. You are cu |
| dead time | 4% | 5.0 | 678 | shopaholic (5.7/h) | stairs ×367; explore ×97; search-wide ×44 |
| death | 4% | 4.5 | 23 | fast (17.4/h) | fight: ★ Prism Ram ×4; fight: Shadow Assassin ×3; fight: Hex Knight ×2 |
| fight:dull | 3% | 3.8 | 1139 | good (5.0/h) | Sellsword #s, no danger ×81; Dungeon Warden #s, no danger ×74; Gloop #s, no danger ×61 |
| puzzle:mistake | 3% | 3.4 | 255 | average (5.9/h) | The last violet flame gutters out. The cold lifts from the floor. ×102; A sour clang echoes down the halls. Strike the gong to hear it again |
| hurt:other:falling stone | 1% | 1.1 | 94 | fast (1.8/h) | falling stone ×94 |
| hurt:puzzle | 1% | 1.0 | 91 | average (1.7/h) | a biting stone ×47; a dead stone ×23; a rune’s backlash ×17 |
| puzzle:gaveup | 1% | 1.0 | 29 | average (2.5/h) | trial: declined the trial ×10; runes: could not work out the rune order ×7; bells: could not repeat the tune ×4 |
| seal | 1% | 0.6 | 39 | fast (1.3/h) | A Fallen Seal holds these stairs shut. Its Wayshard lies on depth #, up the stairs and a  ×31; A Fallen Seal holds these stairs shut. Its Wa |
| fight:long | 1% | 0.6 | 114 | average (1.2/h) | Glacier Queen #s ×22; ★ Old Mossback #s ×20; Thunder Roc #s ×20 |
| disarm:fail | 0% | 0.6 | 52 | good (0.9/h) | You slip! ×45; Click. A needle jabs your hand! ×7 |
| floor:long | 0% | 0.5 | 17 | fast (2.0/h) | depth # over #s ×17 |
| lost | 0% | 0.5 | 28 | good (1.7/h) | cursed, no altar found ×12; boss unreachable ×8; no way on found ×8 |
| puzzle:slow | 0% | 0.4 | 18 | good (0.8/h) | levers took #s ×13; braziers took #s ×4; path took #s |
| poison | 0% | 0.3 | 59 | good (0.7/h) | The green puddle burns: you are poisoned. ×59 |

## What they enjoyed

| Kind | Share | Per hour | Times | Examples |
|---|---:|---:|---:|---:|
| card:new | 46% | 490.0 | 20356 | Pyre-Lord’s Dragon Kiln (rare) ×51; Stormcrown’s Golden Touch (rare) ×50 |
| fight:win | 18% | 187.1 | 11496 | Halo Sprite ×511; Frost Mite ×504 |
| chest | 11% | 111.7 | 12226 |  |
| gear | 7% | 72.7 | 5011 | Thunderbolt Repeater ×322; Runecarved Staff ×313 |
| fight:strike | 6% | 60.9 | 7313 |  |
| puzzle:solved | 2% | 25.6 | 434 | plates in #s, # mistakes ×64; runes in #s, # mistakes ×51 |
| depth:new | 2% | 23.2 | 1408 | depth # ×1408 |
| quest:done | 2% | 20.1 | 904 | +# XP · quest reward ×210; +# XP · a prisoner’s thanks ×197 |
| levelup | 1% | 15.7 | 940 | level # ×940 |
| card:dupe | 1% | 8.4 | 3771 | Bright Comet (rare) ×11; Lamassu (rare) ×11 |
| secret | 1% | 8.2 | 369 | You find a hidden door! ×255; You pull the hidden lever. Somewhere, stone grinds aside. ×34 |
| legendary | 1% | 7.9 | 177 | A legendary find: Shroud of the Long Night ✹! ×36; A legendary find: Aegis of Dawn ✹! ×35 |
| trap:spotted | 1% | 6.6 | 1193 | You find a spike trap. ×180; You find a dart trap. ×164 |
| blessing | 0% | 5.3 | 238 | The orb sinks into your hands: a blessing of Insight (see # tile further in the dungeon),  ×24; The  |

## By depth

| Depth | Hours there | Fun / h | Frustration / h | Worst three |
|---|---:|---:|---:|---:|
| 1–3 | 11.4 | 1108 | 124 | card:burned 29/h, hurt:chest 27/h, fight:surprised 14/h |
| 4–7 | 15.4 | 1579 | 192 | card:burned 33/h, hurt:chest 26/h, cursed 21/h |
| 8–12 | 19.7 | 1968 | 217 | hurt:chest 34/h, card:burned 26/h, fight:surprised 25/h |
| 13–20 | 29.2 | 2164 | 258 | hurt:chest 36/h, hurt:trap 35/h, trap:unseen 31/h |
| 21+ | 15.5 | 3340 | 321 | hurt:chest 60/h, death 43/h, hurt:trap 41/h |

## Puzzles

| Puzzle | Met | Solved | Gave up | Skipped | Avg time | Mistakes each | HP lost each | Why they gave up |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| plates | 93 | 69% | 4% | 27% | 8s | 0.1 | 0.0 | blocks would not sit on the plates ×4 |
| runes | 75 | 68% | 9% | 23% | 14s | 0.4 | 3.9 | could not work out the rune order ×7 |
| levers | 51 | 84% | 0% | 6% | 100s | 0.1 | 0.0 |  |
| path | 45 | 67% | 4% | 29% | 32s | 1.8 | 21.9 | kept stepping on biting stones ×2 |
| trial | 44 | 68% | 27% | 5% | 32s | 0.1 | 0.0 | declined the trial ×7 |
| scales | 41 | 88% | 0% | 12% | 16s | 0.0 | 0.0 |  |
| statues | 38 | 87% | 0% | 13% | 13s | 0.1 | 0.0 |  |
| memory | 34 | 74% | 0% | 26% | 21s | 1.1 | 5.4 |  |
| bells | 34 | 79% | 12% | 9% | 33s | 1.6 | 0.0 | could not repeat the tune ×4 |
| riddle | 30 | 87% | 3% | 10% | 6s | 0.2 | 1.8 | the guardian fell silent |
| mirrors | 29 | 90% | 3% | 7% | 5s | 0.1 | 0.0 | the light never reached the crystal |
| braziers | 28 | 43% | 0% | 39% | 107s | 0.9 | 0.0 |  |
| shift | 23 | 87% | 0% | 13% | 28s | 0.1 | 0.0 |  |
| ice | 18 | 61% | 0% | 39% | 7s | 0.1 | 0.0 |  |

## Fights in the dungeon

| Player | Fights | Won | Avg length | Over 100 s | No danger (≤3 HP lost) | Surprised | Ambush/strike |
|---|---:|---:|---:|---:|---:|---:|---:|
| average | 1863 | 100% | 25s | 2% | 78% | 19% | 48% |
| good | 2389 | 100% | 20s | 1% | 91% | 9% | 75% |
| fast | 2663 | 99% | 19s | 1% | 84% | 10% | 70% |
| combo | 2446 | 100% | 18s | 0% | 90% | 11% | 64% |
| shopaholic | 2157 | 100% | 20s | 1% | 88% | 11% | 73% |

## Deaths

- fight: ★ Prism Ram ×4
- fight: Shadow Assassin ×3
- fight: Hex Knight ×2
- fight: Sellsword ×2
- fight: Hollow King ×1
- fight: Radiant Golem ×1
- fight: ★ Old Mossback ×1
- fight: Frost Witch ×1
- fight: Volt Beetle ×1
- fight: Cutpurse ×1
- fight: Thunder Roc ×1
- fight: Thunder Ram ×1

## Moments a player would likely put the game down

222 in all (1.2 an hour). What filled the 10 minutes before, by its biggest part:

- hurt:trap ×46
- hurt:chest ×39
- hurt:hazard ×33
- card:burned ×28
- death ×20
- puzzle:mistake ×13
- cursed ×10
- trap:unseen ×10
- floor:long ×4
- hurt:other:falling stone ×4
- fight:surprised ×4
- lost ×3
- dead time ×3
- puzzle:gaveup ×2
- fight:dull ×1
- bad:other ×1
- puzzle:slow ×1

By depth: 1–3: 7, 4–7: 23, 8–12: 40, 13–20: 74, 21+: 78.

## Damage outside fights (HP per hour)

chest 134, trap 90, hazard 67, other:falling stone 7, puzzle 6

## Dialogs

36 an hour. Most often: New card! 9/h, Choose your way down 6/h, Wanted 2/h, A scream! 1/h, Card found 1/h, A nest hatches 1/h, Violet fire 1/h, Scattered pages 1/h.

## Money and packs

| Player | Packs bought | Gold spent on packs | Gold at the end | Level | Deck value start → end | Cards burned up |
|---|---:|---:|---:|---:|---:|---:|
| average | 11.3 | 4739 | 28957 | 16.3 | 23 → 46 | 15.2 |
| good | 9.7 | 3707 | 36617 | 14.8 | 23 → 60 | 19.0 |
| fast | 10.8 | 5758 | 39053 | 20.8 | 24 → 48 | 23.7 |
| combo | 11.9 | 5101 | 40654 | 16.8 | 24 → 43 | 15.8 |
| shopaholic | 86.5 | 33145 | 3992 | 14.6 | 22 → 70 | 22.4 |

## Traps

2.4 hidden traps a floor on average over 1524 floors (how many floors held each number: 0: 230, 1: 318, 2: 417, 3: 164, 4: 139, 5: 109, 6: 75, 7: 44, 8: 28). Tells that came into view within 3 tiles: 2594, noticed: 1183; clicks heard: 2457.

## Where the gold goes (per career)

| Player | packs | gear | card | recharges | upgrades | blessings | potions | materials | curses | Sold gear for | Gold at the end |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| average | 4739 | 1120 | 817 | 226 | 562 | 0 | 10 | 75 | 198 | 1138 | 28957 |
| good | 3707 | 1220 | 1024 | 454 | 635 | 195 | 29 | 20 | 131 | 5726 | 36617 |
| fast | 5758 | 1525 | 634 | 329 | 613 | 437 | 34 | 84 | 78 | 1060 | 39053 |
| combo | 5101 | 480 | 1086 | 15 | 880 | 212 | 25 | 29 | 170 | 2783 | 40654 |
| shopaholic | 33145 | 1244 | 331 | 820 | 1058 | 0 | 57 | 45 | 187 | 6411 | 3992 |

## Secrets

Searches: 13471, found something: 1593; whispered hints heard: 1381.

