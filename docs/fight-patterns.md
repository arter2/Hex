# Fight patterns (design for v125)

Your answers (2026-10-23):
- **Patterns:** all four: group tactics, move sequences, board shaping, phases.
- **Danger:** ramps with depth.
- **Scaling:** smarter, not bigger; elite affixes; stronger stats.
- **Groups:** role squads, themed by area.

## Why fights are safe now

A dungeon group is 1 to 3 enemies taken from the first wave of a random encounter. Each enemy picks its next move
at random and moves at random, so attacks rarely line up. The bots lose 3 HP or less in 83–90% of dungeon fights.

## 1. Roles and squads

Every enemy gets a role:

| Role | Job | Enemies |
|---|---|---|
| **Tank** | Stands in front, shields others | Sellsword, Hex Knight, Dawn Paladin, Gloop |
| **Striker** | Big telegraphed hits | Thunder Ram, Bandit, Crossbowman, Powder Monkey, Cinder Wisp, Volt Beetle |
| **Controller** | Pins, slows and shapes the board | Frost Mite, Frost Witch, Dark Wizard, Storm Caller, Witch Healer (snare) |
| **Support** | Heals, blesses, revives | Halo Sprite, Priest, Witch Healer, Grove Warden |
| **Skirmisher** | Fast, from odd angles | Shade, Cutpurse, Ember Cultist, Shapeshifter |

A squad is built from a template, filled with enemies of the area's colour where possible:

| Squad | From depth | Roles |
|---|---|---|
| Pair | 1 | Striker + one other |
| Anvil | 4 | Tank + Striker (+ Striker from 12) |
| Snare | 5 | Controller + Striker (+ Skirmisher from 10) |
| Choir | 8 | Support + Striker + Tank |
| Hunt | 10 | Skirmisher + Skirmisher + Controller |
| Warband | 16 | Tank + Controller + Striker + Support |

Vermin nests stay as they are on the first floors.

## 2. Group tactics (squads act together)

- **Crossfire:** when a Controller pins or slows you, the squad's Strikers aim their next attack at your tile and
  the tiles you would dodge to.
- **Shield wall:** a Tank steps into the row in front of a hurt Support or caster and guards it.
- **Flank:** two Skirmishers attack from the rows above and below you at the same moment.
- **Focus:** a Support's blessing makes the next Striker attack faster.

## 3. Move sequences (learnable rhythm)

Instead of a random move each time, each enemy repeats a short rhythm that its intent icon already shows. For example:
- **Thunder Ram:** shot, shot, **rush**.
- **Frost Mite:** ice slam, shot.
- **Crossbowman:** snipe, snipe, a rest.
- **Bandit:** lunge, lunge, shot.

Deeper enemies (from depth 12) learn a longer rhythm with one extra move.

## 4. Board shaping (new moves)

- **Fire lane:** a row on your side burns for 4 s.
- **Stone wall:** a rock rises on your side and blocks a row.
- **Drag:** pulls you one tile toward the enemy, after a short warning.
- **Frost field:** three tiles turn to ice.

## 5. Phases (ordinary enemies, at half HP, once)

| Role | What it does |
|---|---|
| Striker | Enrages: attacks 30% faster |
| Tank | Hardens: a 30-point shield |
| Support | Calls help: one minion |
| Skirmisher | Slips back and heals 15% |
| Controller | Casts its board-shaping move at once |

## 6. Elites (from depth 6; 5% of enemies at depth 6, rising to 30% at depth 30)

| Affix | Effect |
|---|---|
| Shielded | A shield that comes back every 8 s |
| Hasty | Moves and attacks 35% faster |
| Vampiric | Heals for half the damage it deals |
| Splitting | Splits into two halves when it dies |
| Thorned | Reflects 15% of damage |
| Volatile | Explodes on death (telegraphed, 1 s) |

An elite shows a coloured ring and its affix in its name. It pays 50% more gold and XP.

## 7. Stats and the danger ramp

- **Dungeon groups** use the full squad. Group size is set by depth, not a random 1 to 3.
- **Stats:** enemy HP and damage grow a little faster past depth 12 (HP 13% → 15% a depth, damage 10% → 12%).
- **Targets for HP lost in an ordinary dungeon fight, checked with the bots:**

| Depths | Target HP lost |
|---|---|
| 1–4 | about 5% |
| 5–11 | about 10% |
| 12–23 | 15–20% |
| 24+ | 25% |

  Some fights, about 1 in 6, should go well over the target.
