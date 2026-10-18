# Hexmancers playtests: v86 and v89

Two rounds of bot playtests, each with six fresh testers: two at high effort, two at medium and two at low. Every run started from a new save with the random 80-card start (`newSave({lean})`), playing the 60-card deck dealt from it. Raw data and scripts are in `hexmancers-playtests-v86-v89.zip`.

Colour names: fire = Red, frost = Water (Blue), storm = Yellow, verdant = Green, light = Light, shadow = Black, plus Gray and Brown, which every deck gets.

## Round 1: v86, single fights at the dealt balance

About 6,000 fights and about 16,000 single-card lab casts. There were no script errors, crashes or stuck fights.

- **Win rates.** A bot that dodges well won 87–100% at every depth. A bot that doesn't dodge lost most fights from depth 8 on. Fight length separated the colours better than win rate.
- **Weakest colour: Water.** Its fights were about 20% slower deep and on bosses. 66% of its creatures were support (heal, shield, wall) that deal no damage.
- **Gray was too strong for filler.** Its creatures did about twice the coloured average, and every deck gets 8 Gray cards.
- **Brown did little damage.** Most of its cards are support.
- **Broken cards.**
  - All 18 wedge strikes missed, because the cone was too short.
  - Capybara (a cone creature placed at the back) never hit anything.
  - Row, column and cross burning ground did almost nothing.
  - "Many uses" charges did about 7 damage per use.
  - Zombie infection was too short.
- **Too strong.** Pounce creatures, the top Gray creatures, Power boons (wand ×2.5), common wave and mark strikes, and Spore Pod spikes.
- **Bugs.**
  - Pack and Drilled only counted Water or Gray creatures.
  - Shatter was on Gray, which can't freeze.
  - The Golem reflected your own creatures' hits back at you.

## Round 2: v89, whole runs with rewards and deck building

The testers played down the levels, took the game's real rewards (cards, gold, packs, XP, gear) and rebuilt their decks as they went. A and B, the two high-effort testers, were stopped early at your request.

| Tester | Runs | What it found |
|---|---|---|
| C, medium (slow-reacting bot, swaps out its weakest cards) | 24 runs to depth 16 | No fight lost. About 40 of 60 cards changed. Rares went from about 3 to 15–23. The final deck won about 30% faster, but the starting deck also won 99/100. Yellow's HP-cost cards hurt it more than enemies did. The depth-4 Golem cost Water and Light 36–54 HP. |
| D, medium (the deep end) | 18 runs to depth 60, plus 10 runs with perfect reactions to depth 40 | 17/18 cleared depth 60 with no fight lost. The other one was ended by a **Golem crash**. A slow bot with no gear or levels also cleared 60 in every colour. Characters reached level 45 by depth 40, and runs bought 78–99 packs. The only real threats were outlaw one-shots (Marksman hit for 226 at depth 54). Charges, strikes and wards don't keep up deep: final decks were 50–90% creatures. |
| E, low | 12 runs to depth 12 (battle cards only) | 11/12 cleared. Only 3–10 cards came from battles, so the deck barely changed without packs. |
| F, low (spending all gold on packs) | 6 runs to depth 12 | Packs brought in 3–4× as many cards as battles. 46–54 of 60 deck slots were new by depth 12, and the decks became 55–59 cards of the main colour. |

**Overall:** runs are far too easy for a player who dodges. The gold-and-pack economy runs away. Battle card drops alone are thin. Deep down, the only threat is outlaw one-shots. Creatures and heroes outscale every other card kind.

## What changed

### v87–v88 (between the rounds)

- **Pack and Drilled** count creatures of the card's own colour.
- **Shatter** moved from Gray to Black and Water. The card dealer never gives Shatter to Gray.

### v89 (after round 1)

- **Wedge strikes** reach 4.5 tiles, up from 2.6.
- **Cone creatures** never stand at the back (Capybara moved to the front).
- **Water creatures** re-dealt to 38% support, down from 66%.
- **Charges** +25%, and "many uses" ones lose less per use.
- **Pounce** ×0.8; every Gray creature ×0.82.
- **Zombie infection** lasts at least 6s, and the first bite comes at once.
- **Power boons and the Rune Set combo** give wand ×1.8, down from ×2.5.
- **The Golem** reflects only cast cards and wand shots; creature hits are just resisted.
- **Burning and icy ground** hit enemies standing on them when cast. Burning ground sets alight anything that steps onto it.

### v90 (after round 2)

- **Crash fix:** a colourless wand with an effect no longer crashes the Golem before it picks a colour.
- **No one-shots:** a single enemy hit takes at most 45% of your max HP.
- **Deeper enemies attack faster:** from depth 12 on, enemy attack timers shorten 1.2% per depth, down to 65% of normal (about depth 41).
- **Economy:**
  - Family packs cost 130 (was 90) and boosters 90 (was 60).
  - Battle gold and XP grow normally up to depth 20, then at 35% of the rate.
  - A normal fight now gives a card 70% of the time (was 55%), gold 20% (was 30%) and loot 10% (was 15%).
- **HP-cost cards:** the self-pay cost is now 5 + 0.6×rank (was 8 + rank). Yellow's 24 HP-cost cards average 9.5 HP.
- **Golem reflect** now sends back 20% of the hit (was 35%).
- **Charges** +20% again, now averaging 23 power.
- **Rare and legendary strikes** +20%.

### Checks

All passed with no script errors:
- the regression test;
- the mechanics test;
- the trap test;
- a check of each fix;
- the Golem check;
- the 2-part card check (the only clash left is the Brown potion pair Healing Draught and Quicksilver Elixir, which the dealer doesn't touch);
- the random-start check (every start builds a valid deck).

## Still open

- **Runs may still be too easy for a player who dodges.** The faster deep enemies and the economy changes should help, but they haven't been playtested yet. Carrying wounds between fights (as explore mode does) would be the bigger lever.
- **Heroes do 500–1,400 per cast** and dominate damage. Captain Volta is about double the other heroes.
- **Support cards are cut from every improved deck:** wards, utility, tinker and ace-up cards. Their value isn't visible in damage numbers.
- **Strong common strikes:** wave and mark shapes (Miasma Wave, Bottle Rocket, Tanuki Leaf Trick) are well above other common strikes.
- **Spore Pod** occasionally does 1,000–4,000 damage in one cast. Not yet reproduced.
- **Card mix shortfalls** from the v86 deal: Gray got no machines or towers, and Storm still has more creatures than its weights ask for.
