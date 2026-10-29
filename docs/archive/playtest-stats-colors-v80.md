# Playtest stats: Gray, Brown and Black (v80)

Date: 2026-10-17 · Headless Chromium, the "good" bot (dodges with 0.3 s reactions). **1,192 fights, no page errors.**
The v79 run only used the six starter decks, so it never played a Gray or Brown card, and Black (Shadow) appeared only inside two starters. This run fills those gaps.

| Run | What | Fights |
|---|---|---|
| Mixes | each of the 6 starters as-is, + Gray, + Brown, + Gray and Brown; depths 1–20 | 960 |
| Built decks | from collection cards only: Black, Black + Gray, Black + Brown, Gray + Brown | 160 |
| Search | each starter + all 13 Brown search cards (25 copies); depths 3, 8, 12, 16 | 72 |

Cards added (2 copies each, replacing the starter's most-copied cards):
- **Gray (12 cards):** Living Armor, Lares of the Home, Wild Boar (summons), Shield Wall, Battle Cry, Sling Stones.
- **Brown (16 cards):** Dwarven Cannon Nest, Troll Pebble Hurler (machines), Dowsing Rod, Rune Compass (search), Dwarven War Axe (equip), Whetstone (tinker), Silver Bullets (ace-up), Dwarven Stout.

Black is **Shadow** in the game (docs/colors.md). Hellfire Pact and Bulwark Drain are the two starters with Black in them.

## Win % (4 fights per cell)

| Deck | as-is | + Gray | + Brown | + Gray + Brown |
|---|---|---|---|---|
| Burn Rush | 97 | 100 | 100 | 100 |
| Hold the Line | 92 | 90 | 97 | 100 |
| Bulwark Drain (Black) | 97 | 100 | 100 | 100 |
| Hellfire Pact (Black) | 100 | 100 | 100 | 100 |
| Blizzard | 100 | 100 | 100 | 100 |
| Sacred Grove | 100 | 100 | 97 | 100 |

Built decks: Black only 100%, Black + Gray 100%, Black + Brown 100%, Gray + Brown 100%.

- **Mixing in Gray and Brown works.** No deck got worse except Hold the Line + Gray at depths 18–20 (2 losses in 8). Gray + Brown together made every starter's deep fights 10–30% shorter.
- **Gray + Brown with no main color is the fastest deck tested** (d20 in 195 s, against 240–530 s for the rest), and it took 2 HP of damage a fight. 68% of its damage comes from creatures. It needs watching: the neutral colors shouldn't beat the main ones.
- **Black on its own is fine.** It's the slowest built deck (d20 in 316 s), and its damage splits evenly between cards and creatures.
- **Depth 20 (Elder Treant):** won in every deck except Hold the Line + Gray (50%). In v79 it was 0–33%. The v80 Treant fixes worked, maybe too well; 4 fights per cell isn't enough to be sure.

## Damage share

| Deck | Wand | Cards | Creatures/machines | Gray | Brown |
|---|---|---|---|---|---|
| Starters as-is (median) | 38% | 30% | 23% | – | – |
| + Gray | 39% | 27% | 30% | 8% | – |
| + Brown | 35% | 22% | 37% | – | 17% |
| + Gray + Brown | 35% | 20% | 43% | 10% | 16% |

| Card kind | Casts | Damage per cast |
|---|---|---|
| Brown machine | 1,173 | 316 |
| Black summon | 534 | 152 |
| Gray summon | 2,232 | 131 |
| Black sentry | 792 | 116 |
| Brown ace | 166 | 85 |
| Black strike | 2,322 | 76 |
| Black lob | 743 | 55 |
| Gray / Black / Brown charge | 1,706 / 1,327 / 489 | 25 / 23 / 18 |

Brown machines look big here, but the two tested are rank 9–10 and the Gray summons rank 1–4. Their stats match Fire's machines of the same rank (Hand Cannon 14 every 1.4 s), so this is rank, not color.

## Search cards

Yes, the game has deck search. There are 13 Brown instants (tap to use, no queue slot):

| Finds | Cards | Rarity | Used | Found nothing |
|---|---|---|---|---|
| any random card | Dowsing Rod, Gnomish Card-Finder, Smuggler's Map, Goblin Rummage Sack | common | 622 | 2% |
| an attack | Quartermaster's Ledger, Weapon Rack Index | uncommon | 304 | 12% |
| a defense | Armorer's Catalog, Shield Rack Index | uncommon | 305 | 18% |
| a creature, machine or tower | Beast Whistle, Kite Signal | uncommon | 308 | **40%** |
| your queue's rune | Rune Compass, Lodestone Locator | rare | 300 | 10% |
| pick any card | Akashic Lens | legendary | 80 | 3% |

- They work: no errors, and nothing was lost to a full hand.
- **A search that finds nothing is a wasted card.** The creature search misses 40% of the time, because most starters hold only a few sentries. Suggestion: when a search finds nothing, draw a card instead.
- The bot uses search cards at once and doesn't play around them, so this tests that they work, not how good they are. A deck with 25 search cards won as often as the plain starters (69/72 against 94/96).
- None of the starter decks contain a search card. They exist only in the Brown collection.
