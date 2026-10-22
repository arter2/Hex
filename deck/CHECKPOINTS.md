# Checkpoints

Known-good points to go back to.

## Before rune codes, recipes and the 4th slot

- Commit `b693137` on branch `ccr-4c59caee-nfo4lq` ("Items are gear (weapons and armor); potions become cards")
- Published prototype: version 12 of the Hexmancers artifact
- State: 1,000 cards + 6 heroes + 4 potion cards; gear; perspective camera behind the player;
  purple UI. Combos: Double/Triple (copies), Flush (3 of one color), Straight (3 ranks in a
  row); 3 queue slots, no codes.
- Why: in a 7-card hand a two-color deck can always make a Flush, a Straight 59% of the time
  and a Double 70%, so the next step tries Battle Network-style rune codes, stricter combos,
  named recipes and a rare 4th slot.

To go back: `git checkout b693137 -- deck` (or start a branch from it).
