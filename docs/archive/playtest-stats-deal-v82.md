# Playtest stats: the random 80-card start (v82)

Date: 2026-10-17 · Headless Chromium, the "good" bot. **360 fights, every one with a freshly dealt character** (6 lean colours × depths 1–20 × 6). No page errors.

## The deal (100 characters per colour)

- **The deal is exactly as planned every time:** 80 cards, 32 of the lean colour, 8 Gray, 8 Brown, and the rest from 2–3 other colours (2.5 on average). Rarities are 64 common / 12 uncommon / 4 rare, every card is rank 1–6, and there are about 47 different cards with at most 3 copies of any one.
- **Every first deck is valid:** 60 cards including the hero of the lean colour. It holds 33 lean-colour cards (counting the hero), all 16 neutrals, and the one biggest other colour (1.1 on average).
- **Combos in a random 6-card hand:**

| Deck | Hand can make a Flush | Hand can make a Straight |
|---|---|---|
| Dealt (any colour) | 28–34% | 8–12% |
| Old starters | 12–43% | 6–17% |

## Win % / average fight length (s)

| Deck | d1 | d3 | d5 | d8 | d10 | d12 | d14 | d16 | d18 | d20 | All | HP lost |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dealt Fire | 100/6 | 100/21 | 100/33 | 100/183 | 100/111 | 100/203 | 100/103 | 83/233 | 83/193 | 100/288 | 96% | 15 |
| Dealt Frost | 100/5 | 100/9 | 100/35 | 100/195 | 100/110 | 100/202 | 100/129 | 100/249 | 100/196 | 100/316 | 100% | 4 |
| Dealt Storm | 100/4 | 100/17 | 100/30 | 100/123 | 100/127 | 100/200 | 100/93 | 100/220 | 100/168 | 100/295 | 100% | 2 |
| Dealt Verdant | 100/8 | 100/15 | 100/35 | 100/129 | 100/120 | 100/149 | 100/143 | 83/189 | 100/194 | 100/345 | 98% | 9 |
| Dealt Light | 100/6 | 100/19 | 100/47 | 100/161 | 100/109 | 100/170 | 100/107 | 100/184 | 66/218 | 100/351 | 96% | 7 |
| Dealt Black (Shadow) | 100/3 | 100/26 | 100/32 | 100/130 | 100/110 | 100/205 | 100/133 | 100/149 | 100/109 | 100/297 | 100% | 9 |
| **All dealt** | 100/5 | 100/18 | 100/35 | 100/153 | 100/115 | 100/188 | 100/118 | 94/204 | 91/180 | 100/315 | **98%** | 7 |
| Old starters (v80) | 100/6 | 100/20 | 100/42 | 100/198 | 100/103 | 95/231 | 100/127 | 95/271 | 87/209 | 100/352 | 97% | 10 |

Dealt decks win as often as the old starters, and their fights are about 10% shorter.

Combos per 100 hands, dealt vs starters:

| Combo | Dealt | Starters |
|---|---|---|
| Flush | 12 | 8 |
| Straight | 3 | 3 |
| Rune Set | 31 | 25 |
| Rune Run | 27 | 21 |
| Double/Triple | 15 | 32 |
| Brood | 0 | 4 |
| Recipe | 0 | 1 |

## The problem: Gray summons carry the deck

| | Wand | Cards | Creatures |
|---|---|---|---|
| Dealt | 37% | 15% | 45% |
| Starters | 39% | 26% | 31% |

**Gray deals 51% of all card and creature damage from about 8 of 60 cards.** The lean colour deals about 7%.

| Card kind | Damage per cast | Casts per fight |
|---|---|---|
| Gray summon | 152 | 3.5 |
| Brown machine | 168 | 0.8 |
| Shadow summon | 183 | 0.8 |
| Frost summon | 134 | |
| Verdant / Fire / Light summon | 96–113 | |
| Storm / Frost strike | 46–51 | |

- Low-rank summons and machines deal 2–3× a strike, because they keep attacking for 20–30 s. The bot plays them first because they're worth the most.
- **Gray is meant to be neutral filler, but right now it is the strongest part of every deck.** This undercuts colour themes. It also matches the earlier finding that Gray + Brown with no main colour was the fastest deck.

Suggestions:
1. Bring Gray summons down to other colours' summons (about −30%). Or make Gray's Guardian/Veteran summons defensive (lower damage, more HP).
2. Look again at the strike vs summon value at low ranks.

## Search cards in slots (v81 rules)

The bot slots and uses search cards: 49 uses, 48 found a card.
