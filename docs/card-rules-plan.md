# Every card plays differently (plan)

Date: 2026-10-17 · Status: **waiting on your OK** · Comes from [card-overlap.md](card-overlap.md)

**The rule:** no two cards have the same rules. Two cards may share a shape or a keyword, but never
everything. Numbers alone (more power, more HP) don't count as different. A card's rules are made of
the parts below, and each colour may only use the parts that fit its theme ([colors.md](colors.md)).
A check in the code reports any two cards whose rules match, as the card cap does.

Why it's needed: 955 of the 1,865 cards repeat a rule their colour already has. Summons are worst:
every creature in a colour is one of 4 behaviours with the same HP formula and no keyword.

## Creatures, machines and towers (≈590 repeats, done first)

A creature's rules are made of 5 parts:

| Part | Choices |
|---|---|
| **How it attacks** | Bolt (first enemy in its row) · Pierce (every enemy in its row) · Twin (its row and the next) · Diagonals · Zigzag · Cone (short wedge) · Lob (one tile, over walls) · Blast (lob that splashes) · Cross (lob in a + shape) · Chain (jumps between 3 enemies) · Snipe (the weakest enemy anywhere) · Pounce (leaps at the nearest) · Mends you · Shields you · Guards (takes hits meant for you) |
| **Hit points** | Frail · Sturdy · Tough · Huge |
| **Speed** | Slow and heavy · Steady · Quick and light |
| **Keyword on hit** | The colour's own: burn, freeze, stun, poison, curse... or none |
| **Trait** | One per colour family (below) or none |

**Traits and the shapes each colour leans on:**

| Colour | Attacks it favours | Traits |
|---|---|---|
| 🔥 Fire | Blast, Cone, Bolt, Pounce | **Explodes** when it falls (splash) · **Fury** (hits harder as it's hurt) · **Forged** (starts with armour) |
| ❄️ Frost | Pierce, Lob, Twin, Bolt | **Chilling** (whatever hits it is slowed) · **Pack** (stronger next to another Frost creature) · **Tidal** (its hits push) |
| ⚡ Storm | Chain, Zigzag, Snipe, Diagonals | **Static** (shocks enemies that hit it) · **Swift** (moves to a new row each turn) · **Greedy** (drops gold on kills) |
| 🌿 Verdant | Pounce, Snipe, Cross, Mends | **Regrows** (heals over time) · **Seeds** (leaves a sapling when it falls) · **Thorny** (hurts attackers) |
| ✨ Light | Shields, Guards, Mends, Pierce | **Guardian** (takes hits for you) · **Blessed** (heals you a little when it attacks) · **Rallying** (other allies +power) |
| 💀 Shadow | Zigzag, Lob, Bolt, Snipe | **Rises again** once · **Lifesteal** (heals you) · **Plague** (its poison spreads) · **Dread** (confuses) |
| 🐾 Gray | Every shape, but no keyword | **Veteran** (already in) · **Loyal** (+HP next to you) · **Steadfast** (can't be pushed) |
| ⚙ Brown | Bolt, Lob, Twin, Pierce (machines) | Its **race tech**: Dwarven armour, Gnomish speed, Elven range, Goblin unstable, and so on |

Each creature gets the parts that suit **its name**: an archer shoots (Bolt, Pierce, Snipe), a giant
is Huge and Slow and lobs boulders, a familiar Mends, a wolf Pounces with Pack, a ghost Rises again.
Rarer creatures get the stronger traits. Gray has 195 creatures and can't take keywords, so it uses
every attack shape and its traits to stay unique.

## The rest (≈365 repeats, done second)

| Kind | Repeats | What makes each one different |
|---|---|---|
| Wards | 83 | Wall shape (line, rampart, arc, corridor, cage), sturdiness, keyword on the walls (burning, freezing, shocking), lasting time |
| Strikes | 74 | A second effect: pierce, ricochet, crit chance, recoil, a keyword on kill |
| Boons | 54 | How long, plus a side effect from the colour (a fire boon burns you a little, a light boon also heals) |
| Charges | 49 | Charge time and what a full charge adds (splash, pierce, a keyword) |
| Utility | 36 | What it draws or finds, plus a small bonus from the colour |
| Lobs, ground, traps, tinkers, equipment | ~66 | Pattern, area and keyword combinations not yet used |

## How it's built

1. **New attack shapes and traits** in the battle code, each with its own effect on screen, and card
   text that says exactly what the card does.
2. **An allocator** gives every card its parts. It reads hints from the card's name and keeps a list of
   what each colour has used, so no rule is handed out twice. Card ids stay the same, so saves keep
   their cards, though their rules change.
3. **A check** in `cards.js` reports any repeated rule, and `card-overlap.md` is rebuilt to show zero.

| Build | What |
|---|---|
| v78 | Creature attack shapes, HP and speed tiers, traits; creatures and machines made unique |
| v79 | Towers, wards, strikes and charges made unique |
| v80 | Boons, utility and the rest; the overlap report reads 0 |
