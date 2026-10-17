# The whole collection on the new rules (v84)

Date: 2026-10-17 · Card rules plan, step 2.

## What changed

- **Every creature, strike, lob, ward, boon, charge, trap and ground card (1,555) is built from parts**, and the parts are written in the card files:
  - `cardsets.js` lines, such as `Red Dragon Whelp | summon | u | body=Dragon mod=Tiny beh=cone tier=frail speed=quick`;
  - `SIGNATURE` and `FORM_WALLS` in `cards.js`, as `parts:{…}`.
- **Names are unchanged.**
- **`kinds.js` builds every card from its parts** (`partsBuild`). The on/off switch and `cardparts.js` are gone.
- **`allocate.js` is now a tool and isn't loaded by the game.** It is what chose every card's parts from its name, old rule and colour, and it can be run again.
- **New parts and what they do:**

| Kind | Parts |
|---|---|
| Lob | pattern · fuse (quick 0.35 s and weaker, or heavy 1 s and stronger) · keyword · aftermath (leaves its colour's ground, or knocks back) |
| Ward | form (line, arc, rampart, corridor, cage, or a shield on you) · build (light: more walls, weaker; heavy: fewer, tougher) · wall effect (thorns, burning, freezing, shocking, healing, draining, steady; by colour) · how long |
| Boon | what it does · how long (for boons that last) · colour side effect (2 per colour) · timing (now; Echo, again at half strength 5 s later; Delayed, 2 s later and 30% stronger) |
| Charge | shot (bolt, twin bolt, lob, splash lob) · uses (few and strong, or many and weak) · keyword · edge (pierce, crit, splash) |
| Trap | kind · keyword · how long · size (one tile, or three) |
| Ground | kind · pattern · how long · keyword (given to enemies standing there when it appears) |
| Strike | + cast: Quick (your next card comes sooner, −15%), or Charged (half a second wind-up, +35%) |
| Gray creature | + stance: Front line (at the front, −20% damage taken), Rear guard (at the back, +20% damage), or Escort (keeps to your row) |

- **Colour side effects on boons:**

| Colour | Side effects |
|---|---|
| Fire | Scorch, Embers |
| Frost | Chill, Rime armour |
| Storm | Spark, Jolt |
| Verdant | Sprout, Cleanse |
| Light | Glow, Radiance |
| Shadow | Blood price, Siphon |
| Gray | Rally, Muster |
| Brown | Wound up, Spare parts |

- **The Card lab now has Cast for strikes and Stance for Gray creatures.**
- **Not converted:** instants, Legendary pieces, heroes, Brood, aces, equipment and tinkers. They use the older rules, as do the battle code for heroes, Brood critters and enemy-side allies.

## The 2-part rule

With the new parts, every creature, strike, lob, ward, charge, trap and ground card in a colour differs from every other card of its kind in that colour in at least 2 parts. **Only 3 pairs of boons break it:** 1 in Frost and 2 in Light.

## Checks

- **Rebuild:** all 1,555 cards rebuild from the card files with exactly the same card text the allocator made.
- **Mechanics:** a battle test of every new part passed with no errors. It covered:
  - charged and quick casts;
  - lob ground and knockback;
  - all 7 wall effects, the shield with an effect, and cages;
  - all 16 boon side effects, Echo and Delayed;
  - the 4 charge shots and 3 edges;
  - triple traps and ground with a keyword;
  - the 3 Gray stances.
- **Other tests:** the regression run, the deck-tool test and 93 Card lab setups all ran with no errors.

## Playtest (360 fights, a fresh 80-card deal each)

| Lean | d1 | d3 | d5 | d8 | d10 | d12 | d14 | d16 | d18 | d20 | All | HP lost |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fire | 100/6 | 100/17 | 100/25 | 100/169 | 100/104 | 100/202 | 100/142 | 100/243 | 100/205 | 100/429 | 100% | 8 |
| Frost | 100/5 | 100/26 | 100/43 | 100/196 | 100/129 | 100/205 | 100/151 | 100/258 | 100/209 | 100/282 | 100% | 5 |
| Storm | 100/8 | 100/26 | 100/30 | 100/160 | 100/119 | 100/215 | 100/88 | 100/243 | 100/127 | 100/288 | 100% | 7 |
| Verdant | 100/6 | 100/17 | 100/58 | 100/124 | 100/110 | 100/220 | 100/125 | 100/271 | 83/213 | 100/340 | 98% | 13 |
| Light | 100/7 | 100/19 | 100/33 | 100/159 | 100/98 | 100/213 | 100/100 | 83/159 | 100/189 | 100/418 | 98% | 12 |
| Black (Shadow) | 100/7 | 100/14 | 100/35 | 100/181 | 100/109 | 100/169 | 100/107 | 100/143 | 66/145 | 100/250 | 96% | 12 |
| **All, v84** | 100/6 | 100/20 | 100/38 | 100/165 | 100/112 | 100/204 | 100/119 | 97/220 | 91/181 | 100/334 | **98%** | 9 |
| All, v83 | 100/6 | 100/23 | 100/36 | 100/172 | 100/101 | 97/220 | 97/128 | 97/234 | 94/182 | 100/296 | 98% | 9 |

- **Wins and fight lengths match v83.**
- **Damage:** the wand deals 39%, cards 16% and creatures 39%.
- **Combos per 100 hands:** Flush 13, Straight 3, Rune Set 36, Rune Run 26.
- **Gray still deals 48% of card damage.** All 8 Gray cards in a deal are creatures, and the bot plays creatures first.

| Kind | Damage per cast |
|---|---|
| Summon | 116 |
| Machine | 166 |
| Tower | 123 |
| Strike | 60 |
| Lob | 41 |
| Trap | 20 |
| Charge (each use) | 15 |
