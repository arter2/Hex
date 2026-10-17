# Area rules in the dungeon (design draft)

Date: 2026-10-17 · Status: **proposal, round 2** (Rifts and Abyss redone, see the end)

Each area already has one battle rule (v59, `game/arearules.js`). This adds a matching rule for
**exploring**. The aim is that each area feels different while you walk through it, not only once a
fight starts.

## Principles

1. **Same idea, both places.** Each dungeon rule uses the same kind of thing as its battle rule
   (crystals, ice, lightning, fire, gold, void), so you learn one idea per area.
2. **It carries into the fight.** How you use the rule while exploring changes how the next battle
   starts. This ties the two halves of the game together.
3. **It makes you choose.** Each rule is a small trade (detour or not, wait or rush, risk or loot),
   never just a penalty.
4. **Phone first.** No new buttons. Everything works by walking, with the 4 touch movement modes.
5. **Fair play** (same as `dungeon.js`): no rule ever blocks the stairs down or the only way to them,
   and every hazard has a clear warning before it hurts.
6. **Built on what exists:** the fog and torch light, the trap system, the braziers and ice puzzles,
   and the battle openings (`ambush` / `strike` / `surprised`).

## The six rules

| Area | Battle rule (now) | Dungeon rule (new) | Carries into the fight |
|---|---|---|---|
| 💎 Glowworm Hollows | Glow crystals | **Glow crystals:** crystal clusters grow in side passages and dead ends. Walk into one to take its glow (up to 3 💎 pips). Each one lights a wide circle for a moment. | Each pip charges one of your first cards (+50%). Glow fades 1 pip every 40 s, so it rewards going looking for a fight. |
| ❄️ Frozen Deeps | Black ice | **Black ice:** ice patches on floors and corridors. Step on one and you slide in a straight line until something stops you (a wall, a door, a chest, an enemy). Wandering enemies slide too. | Slide into an enemy and you **slam** it: the fight opens as *First Strike* and that enemy starts stunned and takes slam damage. |
| ⚡ Storm Vault | Storm strikes | **Storm strikes:** every 12 to 18 s lightning marks a cell near you, or near a wandering enemy you can see (a ring for 1.6 s, then the strike). The flash lights the whole room for 2 s and shows any traps and secret doors within 3 cells. | A struck enemy starts the fight with 20% less health and stunned. If you are struck, you take a small hit (6% health) and no other penalty. |
| 🌋 Ember Rifts | Rising lava | **Fire vents and embers:** vents puff fire on a beat you can see. Braziers give you an ember to carry. Plus a new puzzle: **magma belts**. | An enemy caught in a burst starts the fight burning. Carry an ember into a fight and your first card adds burn. |
| 🪙 Gilded Ruins | Gilded floor | **Gilded rooms:** 1 or 2 rooms a floor have gold floors, with coins to pick up. Gold rooms hide twice as many traps, so you trade greed against the search (F) key. | Fight an enemy standing on gold and the battle board gets 6 gold tiles instead of 4. |
| 🕳 The Abyss | Void tiles | **Forgetting dark and void watchers:** the map you have explored fades back into fog, and void lanterns keep it. Eyes in the dark watch a cone and wake enemies when they see you. | Seen by a watcher, the fight opens *Surprised*. Sneak past a watcher unseen and your next fight opens with an *Ambush*. |

### How each one plays

**Hollows: hunting the glow.** The light is the game here: corridors and dark rooms show very
little, and a crystal lights a wide circle for 3 s. Crystals sit off the main path, so the choice is
whether to take a detour. Because glow fades, the best play is to charge up and then go and find a
fight, which is the opposite of sneaking past. Pips show as 💎 on the HUD.

**Deeps: ice routes.** Ice turns a corridor into a short puzzle: where will I stop? It reuses the
slide code from the ice puzzle. Dangers: sliding over a trap you haven't found (it triggers), or
sliding past a door you wanted. Sliding always stops on the stairs cell **without using it**.
Arriving stairs already wait until you walk clear (v75), and a slide only counts as walking clear
once you have stepped off the ice. Touch input is ignored during a slide.

**Vault: reading the storm.** The ring shows 1.6 s before the strike, the same warning as in battle.
You can step away, or wait for an enemy to walk into the ring. The flash also gives you information
(traps and secret doors close by), so standing near a strike has a reason beyond danger. Safe rooms
(sanctuary, merchant, camp, and the safe special rooms) never get strikes.

**Rifts: fire you can read, and fire you can carry.** Three parts that share the fire theme:

- **Fire vents.** Iron grates in corridors and rooms, 4 to 8 a floor. Each one has a beat it shows:
  it glows for 1 s, bursts for 1.2 s, then rests for 2 to 3 s. Nearby vents can be out of step, so a
  corridor of them becomes a rhythm to walk through. A burst hits for 8% health. Enemies walk through
  without thinking: if a burst catches one, it starts the next fight **burning** (it loses health
  over the first 6 s). Vents are never placed on the stairs or in safe rooms, and there is always a
  gap you can walk through.
- **Carried embers.** 2 or 3 braziers a floor. Walk into one to take an ember. While you carry it,
  it lights a wide circle in dark rooms and corridors, burns through **web curtains** (new: thick webs
  across 1 or 2 doorways a floor, each hiding a small side room with a chest), and shows secret doors
  when you walk next to them. Today's cobwebs are only corner decoration, so the curtains are new. It costs 1 HP every 5 s. Walk into a brazier again to put it back. Go into a
  fight carrying it and your first card adds burn, and then the ember is used up. This is the
  braziers puzzle's flame turned into a tool for the whole floor: it doesn't time out, it costs
  health instead.
- **Magma belts (new puzzle kind).** Rifts floors use this as their puzzle room more often than other
  floors do (about half the time), and it can turn up rarely in other areas from the Rifts on. It
  works like the spinner and conveyor floors in Pokémon: belts of moving stone carry you in their
  arrow's direction until you reach a **stop plate** (or a wall). You only choose where to step on.
  Reach the pedestal for the rich chest. Building on the ice puzzle code, it is built solved and then
  scrambled, so it can always be solved. Deeper floors add **turn plates** that switch a belt's
  direction each time you cross them, and a vent that fires across one lane. If you fall off into the
  slag at the edge, you're put back at the entrance with a small burn, never trapped.

**Ruins: greed.** Gold rooms show on the path map (🪙) and are lit, so you see them from the door.
The coins are worth having, but each step on gold is a trap roll. Searching (F) is the answer. It
leans on a system you already have without adding a new one.

**Abyss: the dark that forgets and the dark that watches.** Two parts that work together:

- **Forgetting dark.** Parts of the map you've explored slowly fade back into fog: a cell you
  haven't seen for 45 s starts to fade, and is gone 30 s later. You see it as the minimap and floor
  slowly darkening at the edges. **Void lanterns** stand in some rooms. Light one (walk into it) and
  everything within its room and the corridors next to it stays mapped for the rest of the floor.
  The stairs down, once found, are always remembered. There is no damage: it's about holding a map in
  your head, and choosing which lanterns to light.
- **Void watchers.** 2 to 4 eyes a floor, set in walls or floating in dark rooms. Each one watches a
  cone, drawn faintly on the floor, that slowly sweeps back and forth. If you step into the cone, the
  eye opens wide (a clear warning), and after 0.5 s it **wakes every enemy within 8 cells** and sends
  them towards you. Your next fight opens *Surprised*. If you walk past a watcher's cone without being
  seen, you get a 👁 pip, and your next fight opens with an *Ambush*. A lit lantern closes the eyes
  of any watcher in its room, so lanterns help with both parts.

## Common rules

- **Introduction:** the first time you reach a floor of the area, show the same banner and tip as in
  battle (`R.icon + R.name`), with a dungeon line of text. It's shown once per run, and the dungeon
  tips setting covers it.
- **Shown where you plan:** the camp area info (`areaRuleHTML`) and the path map show both lines:
  battle and dungeon.
- **Strength by floor:** floors 1 to 3 of an area build up (fewer vents, watchers and so on, and
  slower timers). On the boss floor the rule is at full strength, or turned off so the boss fight is
  clean. See decision 1.
- **Path map routes:** the Quiet Way halves the rule (fewer cells, slower timers), the Perilous Way
  makes it 1.3 times stronger, and the Gilded Way doubles the gold rooms in the Ruins.
- **Saving:** the floor save (v2) adds `EX.ar`, which holds ice cells, vents, braziers, lanterns,
  watchers, gold rooms and crystal state, plus your pips and ember. Older saves load with the rule set
  fresh.
- **Debug menu:** a "Dungeon area rule" switch (on / off / force an area) to test any rule on any
  floor, plus "force puzzle: magma belts".
- **Speed on phones:** one shared decal per kind (ice, gold, vent glow, watcher cone), drawn the way
  floor effects already are, so there are no new lights. The vault flash and a carried ember each
  borrow one of the 4 real lights. The forgetting dark only writes to the fog texture that already
  exists.

## Build plan

One build per step, each with its own Playwright test, running the dungeon, stairs, walking and
puzzle suites:

| Build | What | Why this order |
|---|---|---|
| v76 | Framework (`game/arearules-x.js`, hooks into `explore.js`, saving, banner, debug switch), **Ruins** and **Hollows** | The simplest ones (pickups and room flags) prove the hooks. |
| v77 | **Vault** and **Deeps** | A timed hazard with a warning, and the ice slide (reusing the ice puzzle code and the v75 stairs fix). |
| v78 | **Rifts**: fire vents, embers, burning start | Vents reuse the vault's warning-and-hit code. Embers reuse the braziers flame. |
| v79 | **Magma belts** puzzle | A new puzzle kind with its own solver test (always solvable after it is scrambled). |
| v80 | **Abyss**: forgetting dark, lanterns, watchers | It touches the fog and enemy waking, the core of exploring, so it comes last. |

## Decisions for you

1. **Boss floors.** Should the dungeon rule be at full strength on the boss floor, or turned off?
   *Suggestion: full strength. The boss floor should feel like the area at its peak.*
2. **Hollows glow fading.** Fade 1 pip every 40 s (pushes you to fight), or keep pips until your next
   fight? *Suggestion: fade.*
3. **Magma belts outside the Rifts.** Only in the Rifts, or rarely in later areas too? *Suggestion:
   rarely later too, so the puzzle pool keeps growing.*
4. **Forgetting speed.** 45 s before a cell starts to fade, then 30 s to go dark. Too harsh on a big
   floor? *Suggestion: try it, with a debug slider to tune it on your phone.*

Decided in round 2: Rising lava and Void cells are dropped from the dungeon (both stay as battle
rules).
