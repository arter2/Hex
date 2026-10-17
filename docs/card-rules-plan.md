# Every card plays differently (plan)

Date: 2026-10-17 · Status: **step 1 done** (creatures and the Card lab in v78, strike shapes and riders in v79); **step 2 in v84**: every creature, strike, lob, ward, boon, charge, trap and ground card is written with its parts (cardsets.js, cards.js) and built by kinds.js; strikes gained a cast part and Gray creatures a stance so the 2-part rule holds (3 boon pairs left). Brown instants and Legendary pieces are on parts too. Colour weights: the Colour Weights page (https://claude.ai/artifact/3m6dfKxLsSuu5ZEBGkpJEL, source docs/card-list/colour-weights.html) saves per-colour weights that allocate.js reads as AL_WEIGHTS. Waiting on: your review and weights; the collection may stay a little over 200 per colour for now; aces, equipment, tinkers and utility keep their own rules

955 of the 1,865 regular cards repeat a rule their colour already has. Creatures are the worst: every
creature in a colour is one of 4 behaviours with the same HP formula and no keyword. This plan
makes every card play differently and brings the collection down to an even size per colour.

## Decisions

| Question | Decision |
|---|---|
| What counts as different | A card's rules are made of **parts** (below). Two cards of the **same colour** must differ in **at least 2 parts**. |
| Across colours | Copycats are allowed (a white and a green card can both deal a 20-damage shot), but they must still differ in **at least 1 part** besides colour. |
| What isn't a part | Colour, name, art, rank, rarity and raw numbers (20 vs 25 damage). Tiers (HP, speed) **are** parts. |
| Collection size | **200 regular cards in every colour = 1,600**, plus the 84 heroes (14 in each main colour) = **1,684**. |
| Cuts | 265 cards: Fire 32, Frost 35, Storm 32, Verdant 39, Light 36, Shadow 35, Gray 26, Brown 30. Mostly creatures, then the cards whose rules are hardest to make unique. |
| Players' saves | Not needed: the game isn't live. Testers' saves drop cut cards on load so decks still validate. |
| Order of work | **Rules first** (new attacks, traits, shapes, tried in a test battle), **then the card list**. |

## Creatures (summons), machines and towers

Five parts: **behaviour**, **HP tier**, **speed**, **keyword on hit**, **trait**.

### Behaviours (24)

| Group | Behaviours |
|---|---|
| Shots | **Bolt** (first enemy in its row) · **Pierce** (every enemy in its row) · **Twin** (its row and the next) · **Diagonals** · **Zigzag** · **Cone** (short wedge) · **Snipe** (the weakest enemy anywhere) · **Chain** (jumps between 3 enemies) · **Beam** (charged, the whole row across the board, walls and rocks too; slow) · **Burrow** (tunnels under walls and rocks to the first enemy in its row) · **Barrage** (a rain of small hits on random enemy tiles) |
| Lobs | **Lob** (one tile, over walls) · **Blast** (lob that splashes) · **Cross** (lob in a + shape) |
| Close | **Pounce** (leaps at the nearest enemy) · **Trample** (charges down its row into the enemy side, hits everything on the way, runs back) · **Dash** (dashes at an enemy and strikes, then a 2nd, and a 3rd on rarer cards; each target flashes just before and can sidestep to a free tile about 1 time in 4) |
| Support | **Mends** you · **Shields** you · **Guards** you (takes hits meant for you) · **Taunt** (enemies must aim at it) · **Summoner** (calls a small helper every few seconds) · **Ward-maker** (raises a small wall in front of you every few seconds) · **Empower** (doesn't attack; your next card cast while it stands hits harder) |

### HP tiers (5) and speeds (4)

| HP tier | HP vs today | | Speed | Attacks |
|---|---|---|---|---|
| Frail | ×0.6 | | Frantic | every 0.4 s, very low power |
| Sturdy | ×1 | | Quick | every 0.7 s, low power |
| Tough | ×1.6 | | Steady | every 1.2 s |
| Huge | ×2.5 | | Slow | every 2 s, high power |
| Colossal | ×3.5, rare and up only | | | |

Power is balanced against HP and speed: a Huge slow creature hits hard and rarely, a Frail quick one
often and lightly. Each tier shows on the card as a word and an icon.

### Keyword on hit

The colour's own keywords (burn, freeze, stun, poison, curse, slow, push, pull, confuse, drain,
mend...) or none. Gray creatures take no keyword.

### Traits (5 per colour; Shadow has 6, Brown its race tech plus 2)

| Colour | Traits |
|---|---|
| 🔥 Fire | **Explodes** when it falls (splash) · **Fury** (hits harder as it's hurt) · **Forged** (starts with armour) · **Scorched earth** (its hits leave burning ground for a few seconds) · **Bloodlust** (each kill makes it attack faster) |
| ❄️ Frost | **Chilling** (whatever hits it is slowed) · **Pack** (stronger next to another Frost creature) · **Tidal** (its hits push) · **Shatter** (double damage to frozen enemies) · **Submerge** (can't be hit for a moment after it attacks) |
| ⚡ Storm | **Static** (shocks enemies that hit it) · **Swift** (moves to a new row each turn) · **Greedy** (drops gold on kills) · **Overcharge** (every 3rd attack is doubled and stuns) · **Sandstorm** (enemies in its row miss 1 shot in 4) |
| 🌿 Verdant | **Regrows** (heals over time) · **Seeds** (leaves a sapling when it falls) · **Thorny** (hurts attackers) · **Ambush** (its first attack hits three times as hard) · **Camouflage** (enemies ignore it while any other target stands) |
| ✨ Light | **Guardian** (takes hits for you) · **Blessed** (heals you a little when it attacks) · **Rallying** (other allies +power) · **Martyr** (when it falls you get a big shield) · **Radiant** (enemies it hits take +15% from you for a few seconds) |
| 💀 Shadow | **Rises again** once · **Lifesteal** (heals you) · **Plague** (its poison spreads) · **Dread** (confuses) · **Phantom** (its attacks pass through enemy walls and rocks) · **Soul harvest** (grows stronger each time an enemy dies) |
| 🐾 Gray | **Veteran** (already in) · **Loyal** (+HP next to you) · **Steadfast** (can't be pushed) · **Drilled** (+power for every other Gray creature on the board) · **Last stand** (survives a killing blow once, at 1 HP) |
| ⚙ Brown | **Race tech** (Dwarven armour, Gnomish speed, Elven range, Goblin unstable, and the rest) · **Overclock** (attacks faster but slowly loses HP) · **Self-repair** (mends itself between shots) |

Each creature gets parts that suit **its name**: an archer shoots, a giant is Huge and Slow and
lobs boulders, a familiar mends, a wolf pounces with Pack, a ghost rises again. Rarer cards get the
stronger traits. Machines and towers use the same behaviours and tiers (towers never move).

## Strikes (23 shapes)

| Group | Shapes |
|---|---|
| Today (8) | Line · Row · Wedge · All · Dig · Zigzag · Diagonals · Missiles |
| Shots (6) | **Twin** (your row and the next) · **Fan** (your row and both diagonals) · **Spear** (through the first enemy into the one behind) · **Boomerang** (down your row, back up the next) · **Machine gun** (a stream of fast bolts for a few seconds, following you as you move) · **Wave** (a horizontal line sweeping forward across the whole enemy side, hitting each enemy once) |
| Spread (4) | **Burst** (first enemy in your row, splashing around it) · **Chain** (first enemy, then jumps to the 2 nearest, weaker each jump) · **Ricochet** (bounces off the board's edge walls, can hit from behind) · **Snipe** (the enemy with the least HP anywhere) |
| Areas and timing (3) | **Shockwave** (every enemy within 4 tiles of you; 3 barely reached past the middle) · **Column** (one horizontal line across all rows of the enemy side, instantly) · **Delayed mark** (marks an enemy; 1.5 s later it explodes for big damage) |
| Bombs (2) | **Cluster bomb** (a lob that breaks into bomblets in the card's own shape: ring, cross, X, forward fan, scatter) · **Proximity mine** (laid on the enemy side; goes off when an enemy steps on or next to it, or when you shoot it) |

Strike parts: **shape**, **keyword**, and a **rider** (pierce, crit chance, recoil, bonus on a kill).

## The other kinds

| Kind | Parts that make each one unique |
|---|---|
| Wards | Wall shape (line, rampart, arc, corridor, cage) · sturdiness · effect on the walls (burning, freezing, shocking, healing you while they stand) |
| Boons | What it does · how long · a colour side effect (a fire boon burns you a little, a light one heals) |
| Charges | Charge time · what a full charge adds (splash, pierce, a keyword) |
| Utility | What it draws or finds · a small colour bonus |
| Lobs, ground, traps, tinkers, equipment | Pattern · area · keyword combinations not yet used |

## How it's built

| Step | What |
|---|---|
| 1. Rules | The 24 creature behaviours, 5 HP tiers, 4 speeds, the colour traits and the 15 new strike shapes in the battle code, each with its own effect on screen and clear card text. A **Card lab** on the front page: pick any behaviour, trait or shape and try it in a test battle. Its button is hidden until **Show Card lab** is ticked in the debug menu; the tick is saved in that browser only, so it shows on your devices and nobody else's. |
| 2. Card list, one colour at a time | An allocator gives each card its parts from its name and colour, and picks the cuts. You review each colour as a spreadsheet and a readable page before it goes in. |
| 3. Checks | `cards.js` reports any two cards that break the 2-part rule (or the 1-part rule across colours), and any colour that isn't 200. `card-overlap.md` is rebuilt and reads 0. |
