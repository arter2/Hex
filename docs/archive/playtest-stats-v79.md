# Playtest and balance stats (v79)

Date: 2026-10-17 · Four test agents ran the game headless in Chromium: **26,221 fights and casts** in all. No page errors, no NaN numbers, no stuck fights, nothing off the board.
Raw data and scripts: the session scratchpad, `stats/{creatures,traits,strikes,playtest}`.

| Run | What | Size |
|---|---|---|
| Creatures | 24 behaviours × 5 HP tiers × 4 speeds, depths 3/9/15, vs old summons and machines | 7,575 fights |
| Traits | 38 traits + 10 races + keywords, each vs the same card with no trait | 10,128 fights |
| Strikes | 23 shapes, 5 cluster patterns, 4 riders, 3 depths, 2 positions, preview accuracy | 7,620 casts |
| Playtest bot | 6 starter decks × depths 1–20, 4 bot skill levels, 3 decks with new-rules cards | 1,273 fights |

## 1. How the game plays

Win % / average fight length in seconds, good bot (dodges with 0.3 s reactions), 6 fights per cell. Depths 8, 12, 16 and 20 are boss floors.

| Deck | d1 | d3 | d5 | d8 | d10 | d12 | d14 | d16 | d18 | d20 |
|---|---|---|---|---|---|---|---|---|---|---|
| Burn Rush | 100/10 | 100/27 | 100/37 | 100/162 | 100/116 | 100/261 | 100/206 | 100/262 | 100/183 | **0**/741 |
| Hold the Line | 100/10 | 100/37 | 100/44 | 100/252 | 100/137 | 100/358 | 83/183 | 100/418 | 100/239 | **0**/900 |
| Bulwark Drain | 100/10 | 100/8 | 100/45 | 100/167 | 100/77 | 100/141 | 100/104 | 100/187 | 100/92 | 33/756 |
| Hellfire Pact | 100/8 | 100/12 | 100/33 | 100/198 | 100/103 | 100/214 | 100/162 | 67/269 | 83/197 | **0**/863 |
| Blizzard | 100/9 | 100/15 | 100/21 | 100/189 | 100/121 | 100/248 | 100/125 | 83/349 | 83/255 | **0**/900 |
| Sacred Grove | 100/8 | 100/22 | 100/39 | 100/177 | 100/69 | 100/153 | 100/85 | 100/188 | 83/230 | **0**/900 |

| Bot | Win % | HP lost per fight | Cards cast | Wand shots |
|---|---|---|---|---|
| Good (0.3 s reactions) | 89% | 12 | 28 | 567 |
| Casual (0.6 s) | 87% | 16 | 29 | 589 |
| Never dodges | 36% | 114 | 9 | 118 |
| Lazy (never moves) | 28% | 119 | 10 | 151 |

- **Dodging is almost everything.** Every enemy attack can be dodged with a 0.3 s reaction; without dodging, win rate falls to ~6–39% at depth 8 and ~0% from depth 14.
- **The wand deals 40–56% of all damage** in every deck; cards 10–31%, creatures 21–51%.
- **Elder Treant (depth 20) is close to unwinnable**: 0–33% (11% even for a bot that kills Root Nodes first). It arrives as wave 3 after 2–5 minutes, the deck runs dry at ~250 s, and in phase 3 the Root Nodes heal it faster than the wand alone can hurt it (bosses.js:51, :92, :109).
- **Deep fights drag on healer packs** (priest, halo sprite, witch healer): 19 of 36 fights at depth 18 ran over 3 minutes, ending on the wand alone with an empty deck.
- **Near one-shots at depths 16–20**: enemy line strikes hit for 96–118 and the crossbowman's snipe for 83–100, against 120 max HP. Enemy card power is scaled by depth twice (`enemyCast` `.6*e.ds` plus stronger cards in `enemyDeck`).
- **New-rules decks**: creatures deck 95% win (base 88%), fights 18% shorter, and it won the Treant 3 of 6; strikes deck 90% (base 90%); mixed 88% (base 87%).

## 2. Creatures

Median damage per second (attacking behaviours) ≈ 10–12.

| Behaviour × median | | | |
|---|---|---|---|
| **Chain 1.83** | **Dash 1.50** | Beam 1.39 | Pounce 1.38 |
| Blast 1.25 | Trample 1.12 | Pierce 1.11 | Snipe, Cross 1.09 |
| Twin 0.96 | Lob 0.94 | Bolt 0.92 | Summoner 0.91 |
| Barrage 0.89 | Cone 0.81 (0.4 at depth 3) | Burrow 0.79 | Zigzag 0.66 |
| **Diagonals 0.25** | Taunt / Guards hitting back 0.35 / 0.19 | | |

| HP tier | DPS | Total damage | Alive (s) | Died |
|---|---|---|---|---|
| Frail | 1.20 | 1.08 | 14.6 | 44% |
| Sturdy | 1.00 | 1.00 | 16.7 | 34% |
| Tough | 0.84 | 0.92 | 18.4 | 21% |
| Huge | 0.71 | 0.82 | 19.5 | 8% |
| Colossal | 0.62 | 0.72 | 19.9 | 3% |

- Speeds balance (DPS 0.92 / 0.95 / 1.00 / 1.11 for Frantic → Slow).
- **Tougher tiers lose overall**: they hit softer, but with a 20 s life most Sturdy creatures survive anyway, so the extra HP rarely pays back.
- **Diagonals** runs off the 7-row board before reaching most enemies; **Cone** (reach 3) misses a lot early.
- **Support is weak**: Guards and Taunt die in 64–72% of fights; Mends heals ~43 per fight, the same as the old healer.
- Old cards compared: Mortar 1.99×, Repeater 1.44×, Shooter 1.10× (they also last 3–4 turns, the new ones 2).

## 3. Traits (damage vs the same card with no trait)

| | Traits |
|---|---|
| Too strong | **Tidal +88%**, **Sea-folk +73%** (a free push; the slam is 26% of their damage), **Overclock +54%** (its drain takes 50 s to kill; life is 20 s) |
| Strong | Scorched +32, Plague +30, Overcharge +29, Gnome +25, Submerge +22, Alchemy +22 |
| Middle | Steadfast +17, Human +16, Fury +16, Forged +16, Elf +14, Explodes +12, Djinn +11, Rises +11, Last stand +10, Radiant +10, Troll +10 |
| Weak | Ambush, Self-repair, Swift, Bloodlust, Veteran, Dwarf, Static, Sandstorm +8–9; Regrows +6, Seeds +4, Goblin +4, Chilling, Harvest, Thorny +3, Greedy +1 |
| About 0 | Shatter (+65% with Freeze), Phantom, Sky-folk, Dread, **Loyal (never triggers)** |
| Harmful | **Guardian: −39% damage, and you take 19% more** |
| In groups of 3 | Pack +26, Drilled +18, Rallying +16, Camouflage +11 |

Keywords on Bolt: Push +41–56%, Burn +42, Poison +25, Pull +5–12, Curse +10, Stun +6; Freeze, Slow, Confuse, Mend and Drain −2 to −6% (they pay the keyword cost and their effect doesn't make it back in damage).

## 4. Strikes (damage per cast × the old shapes' median of 44)

| Shape | × | Note |
|---|---|---|
| **Wave** | 2.75 | the old *All* with 14% more power |
| **Delayed mark** | 2.47 | often lands as a Counter Hit (double) |
| Shockwave | 2.30 | from the front only; **0 from your start tile** |
| **Chain** | 2.08 | |
| Machine gun | 1.97 | +30% if you switch rows during it |
| Mine (aimed) | 2.02 | self-placed: goes off after 4–6 s, 10–17% expire unused |
| Column | 1.60 | |
| Snipe | 1.25 | |
| Twin, Burst, Boomerang, Spear | 0.94–1.04 | half that when not in the enemy's row |
| Cluster bomb | 0.83–1.05 | aiming adds only 0–8% |
| Fan | 0.77 | |
| **Ricochet** | 0.54 | stops on rocks |
| Old Diagonals | 0.19 | |

Riders: Crit +25–29%; Recoil +29–31% (Fan only +16%; it still gets +30% when a rock blocks the move); Pierce ~0 (at most +9%, and it is offered on shapes that aren't shots); Reaper gives the intended 15% gauge per kill.

## 5. Bugs found

| # | Where | Bug |
|---|---|---|
| 1 | creatures.js `crCamo` | Two Camouflage creatures hide each other and can never be hit |
| 2 | creatures.js `crSave` | A Rises again creature hit while it is down dies for good (12% of rises) |
| 3 | battle.js `hitPlayer` | A guarded hit passes no attacker, so Static, Thorny, Chilling and Guards/Taunt's keyword never fire; the guard soaks hits before your shield, and even burning-floor ticks |
| 4 | battle.js `timeTick` | Explodes, Seeds and Martyr do nothing when the creature runs out of time instead of dying; a Seed is lost if its tile is taken |
| 5 | creatures.js | Overclock and the goblin backfire kill silently |
| 6 | battle.js `placementTiles` | Loyal can never trigger: creatures are placed 4 tiles from you |
| 7 | creatures.js `crTick` | Ambush and the Overcharge count are spent on acts that hit nothing |
| 8 | enemies.js | Taunt only redirects some attacks (shot, rush, cleave and hex still aim at you) |
| 9 | creatures.js `crHit` | Phantom/Sky shots lose `dig`, so enemy shields still apply |
| 10 | creatures.js | Frantic Dash overlaps its own dashes (visual); Ward-maker walls, Summoner helpers and Empower ignore speed |
| 11 | strikes.js | Boomerang and Ricochet previews ignore rocks (wrong in 16–27% of casts) |
| 12 | strikes.js | Scatter cluster preview re-rolls, so it isn't where the bomblets land |
| 13 | strikes.js `mineTile` | A self-placed mine sits in your firing row, so your next shot sets it off with no enemy in range |
| 14 | strikes.js / battle.js | Previews: mine shows no hits, Recoil isn't shown, Chain shows 1 target of 3, Missiles marks every foe, Machine gun shows only the first |
| 15 | engine.js `oneRune` | Cards with no rune act as wild runes (lab cards made Straights 5× as often); new collection cards need a rune |
| 16 | cardlab.js | A creature's id leaves out its race, so two race-tech cards overwrite each other; every default lab card is named "… Imp" / "… Lance" |
