# Playtest stats: the new-rules card list (v83)

Date: 2026-10-17 · Headless Chromium, the "good" bot. **360 fights, every one with a freshly dealt 80-card character**, now dealt from the new-rules cards. No page errors.

## What changed (card rules plan, step 2, first pass)

`allocate.js` gives every creature (summon, machine, tower) and every strike in the collection its new-rules parts, based on its name, its old rule and its colour. The parts are saved in `cardparts.js`, one line per card, and can be edited by hand.

- **Creatures:** 723 cards, each with a behaviour, HP tier, speed, keyword and trait. They are built with `crBuild`, the same rules as the Card lab.
- **Strikes:** 231 cards, each with a shape, keyword and rider (plus the bomblet pattern on cluster bombs).
- **Name hints work:** archers snipe, giants are Huge and Slow, walls become Ward-makers, ghosts get Phantom or Rises again. Towers never get a moving behaviour.
- **Review sheet:** every card is listed in `docs/card-list/new-rules-cards.csv`, with its parts, numbers and card text.
- **Not done yet:** the other kinds (wards, boons, lobs, charges, traps) are unchanged. The cuts (down to 200 per colour) haven't been made.

## Spread of parts (723 creatures, 231 strikes)

**Creatures:**
- All 24 behaviours are used, from Guards (58) and Bolt (55) down to Burrow (5).
- Tiers: Sturdy 304, Tough 240, Huge 90, Frail 85, Colossal 4.
- Speeds: Steady 276, Slow 241, Quick 115, Frantic 91.

**Strikes:** all 23 shapes are used. 88 have no rider; the rest are spread over crit, on-kill, recoil and pierce.

## The 2-part rule can't hold for every card

| | Pairs of cards in one colour that differ in only 1 part |
|---|---|
| Creatures, every colour except Gray | **0** |
| Gray creatures (195 cards) | 95 |
| Strikes (35–47 per colour) | 3–16 per colour |

This is a limit of the rule, not of the allocator:

- **Strikes:** two strikes with the same keyword and rider can only differ in shape, which is one part. So a colour fits at most (keywords + 1) × (riders + 1) strikes. That's 20 for Fire, but each colour has 35–47.
- **Gray creatures:** they take no keyword, so a colour fits at most 5 tiers × 4 speeds × 6 trait choices = **120**, and Gray has 195.

To meet the rule, strikes need another part or more riders and keywords, and Gray needs a 5th part or about 75 fewer creatures.

## Win % / average fight length (s)

| Lean | d1 | d3 | d5 | d8 | d10 | d12 | d14 | d16 | d18 | d20 | All | HP lost |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fire | 100/9 | 100/23 | 100/28 | 100/163 | 100/111 | 100/235 | 100/130 | 100/251 | 66/139 | 100/319 | 96% | 8 |
| Frost | 100/5 | 100/26 | 100/42 | 100/205 | 100/105 | 100/233 | 100/147 | 100/255 | 100/218 | 100/302 | 100% | 16 |
| Storm | 100/5 | 100/20 | 100/27 | 100/135 | 100/97 | 100/219 | 100/113 | 100/230 | 100/152 | 100/354 | 100% | 4 |
| Verdant | 100/8 | 100/21 | 100/44 | 100/204 | 100/104 | 83/186 | 100/121 | 83/217 | 100/220 | 100/263 | 96% | 8 |
| Light | 100/5 | 100/29 | 100/48 | 100/155 | 100/87 | 100/236 | 100/128 | 100/235 | 100/157 | 100/224 | 100% | 4 |
| Black (Shadow) | 100/4 | 100/19 | 100/29 | 100/169 | 100/100 | 100/212 | 83/126 | 100/214 | 100/208 | 100/314 | 98% | 16 |
| **All, new cards** | 100/6 | 100/23 | 100/36 | 100/172 | 100/101 | 97/220 | 97/128 | 97/234 | 94/182 | 100/296 | **98%** | 9 |
| All, old cards (v82) | 100/5 | 100/18 | 100/35 | 100/153 | 100/115 | 100/188 | 100/118 | 94/204 | 91/180 | 100/315 | 98% | 7 |

## Damage

| Source | New cards | Old cards |
|---|---|---|
| Wand | 40% | 37% |
| Cards | 17% | 15% |
| Creatures | 38% | 45% |

| Kind | Damage per cast |
|---|---|
| Summon | 103 |
| Machine | 164 |
| Tower | 108 |
| Strike | 58 |
| Lob | 46 |
| Hero | 668 (6 per fight in total) |

- **Gray's share of card damage is down from 51% to 44%.** A Gray summon now deals 118 per cast (was 152), close to the other summons (71–135).
- Gray's share stays high because all 8 Gray cards in a deal are creatures, and the bot plays creatures first. Its 1,294 Gray casts compare with about 300 for each other colour's creatures.
- Snipe is the most common damage source among creatures: archers, hunters and eyes all hint at it.
- Combos per 100 hands: Flush 12, Straight 3, Rune Set 35, Rune Run 27. That's the same as with the old cards.
