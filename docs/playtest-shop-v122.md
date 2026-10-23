# Playtest: slower levels and pack buying (v122)

Date: 2026-10-23 · Build v122 · 60 runs, 2,478 fights, no errors · Same bots and setup as [playtest-runs-v121.md](playtest-runs-v121.md)
(joystick and flicks, the one-colour start deal, deck building, depth 1 to 40), now with v122's slower levels and a shop.

## What changed

- **Slower levels (in the game):** you level at full speed up to the level your depth calls for (1 + depth/2), and
  each level above it takes 30% off what you earn, down to a tenth. Battle wins and dungeon XP both use it.
- **The bots shop after every win.** The four careful players keep a reserve of 200 + 10 × depth gold and buy at
  most one pack a fight: a pack of their colour (130), or a booster (90) for the average player. The new
  **shopaholic** plays exactly like the good player but spends everything on packs after every fight (70% its
  colour, 30% boosters). Every player gets the same start deal per colour and seed.

## Results

| Player | Cleared d40 | Losses per run | Win % at d25-40 | HP lost per fight at d25-40 | Level at d10 / 20 / 30 / 40 | Packs bought | Card value, start -> end |
|---|---|---|---|---|---|---|---|
| Average | 8 of 12 | 4.3 | 82% | 222 | 8 / 13 / 18 / 23 | 27 | 21 -> 35 |
| Good | 12 of 12 | 0.7 | 97% | 112 | 8 / 13 / 18 / 23 | 29 | 23 -> 50 |
| Fast | 9 of 12 | 3.4 | 85% | 104 | 8 / 13 / 18 / 23 | 28 | 25 -> 45 |
| Combo breaker | 12 of 12 | 0.3 | 98% | 122 | 8 / 13 / 18 / 23 | 29 | 25 -> 42 |
| Shopaholic | 11 of 12 | 1.5 | 94% | 120 | 8 / 13 / 18 / 23 | 48 | 23 -> 52 |

Against the v121 run (old levels, no shop):

| | v121 | v122 |
|---|---|---|
| Level at depth 40 | 40 | 23 |
| Average: losses per run / win % at d25-40 | 2.5 / 87% | 4.3 / 82% |
| Good: losses per run / win % at d25-40 | 0.3 / 98% | 0.7 / 97% |
| Good: card value at the end | 35 | 50 |
| Good: share of damage from cast cards | 34% | 50% |
| Combo breaker: one rune in the deck / combos a fight | 57% / 9.0 | 74% / 13.4 |

## What it shows

1. **Slower levels work as meant:** level 23 at depth 40 instead of 40, and stats no longer hit the cap by depth 30.
   The average player feels it (more losses, more HP lost deep down).
2. **Packs took the place of levels.** Even careful players buy about 28 packs in a run (about 3,600 gold), because
   gold comes in much faster than packs cost: a fight at depth 20 pays about 340 gold and a pack is 90-130. Their
   decks end twice as strong as they started, and cast cards now deal half the damage.
3. **Buying everything doesn't break it.** The shopaholic bought 48 packs and ended with a deck only a little
   stronger than the good player's (52 vs 50), and did no better (1.5 losses vs 0.7). Past about 30 packs a deck is
   full of rares and legendaries and more packs add little. What makes the game easy is buying at all.
4. **The good and combo players still find it easy** (97-98% deep down). The combo breaker, with more packs to choose
   from, built a deck 74% one rune and made 13 combos a fight, the most of anyone, and lost least.
5. **Fast still doesn't pay:** fights 25% shorter than the good player's deep down, but 5 times the losses.

## What to change next (your call)

- **Gold or pack prices:** packs that cost more as you go deeper (for example 90 + 5 × depth), or less gold a
  fight, so a pack is a choice and not an every-fight habit.
- **Enemies deeper down:** good players still win 97% at depths 25-40.

## Caveats

- Battle only (one fight per depth, no dungeon floors), no single-card or gear buying in the shop.
- 12 runs a player: big gaps are real, a point or two of depth is noise.
