# Hexmancers: where we are

Date: 2026-10-16 · Latest build: **v75** (`hexmancers-itch-v75.zip`) · Branch `claude/hopeful-hypatia-stzuj0`, merged to `main`

This is a snapshot of the game: what is in it, what changed recently, what we plan next, and what
is still open. The design reasoning behind each feature is in [fun-roadmap.md](fun-roadmap.md).

---

## 1. The game today

Hexmancers is a browser card roguelike for itch.io, built for phones first. It is plain
JavaScript with three.js (r128) and has no build step.

### The loop

1. **Camp:** build decks, buy and open packs, take contracts, check the bestiary, gear up.
2. **Dungeon:** explore a 3D floor with secrets, traps, special rooms and puzzles, then find the
   stairs down.
3. **Battle:** a real-time fight on a hex board. You queue 3 cards and cast them, shoot your wand,
   dodge telegraphs and counter attacks.
4. Bring what you found back to camp. Cards stay in your collection between runs.

### What is built

| Area | What's in it |
|---|---|
| **World** | 6 areas of 4 floors each (Glowworm Hollows, Frozen Deeps, Storm Vault, Ember Rifts, Gilded Ruins, The Abyss). Each area ends in a boss floor and has its own battle rule (v59). |
| **Character** | 8 races, man or woman, stat dials (STR, DEX, CON, INT and more), levels, and gear (head, body, arms, weapon, off hand, rings). |
| **Cards** | A collection of about 1,000 cards in 8 colours, 5 deck slots and a deck builder. Combos are copies, Flush, Straight, Rune Run, Rune Set and secret recipes. Instants, aces and the wild rune ✱. |
| **Battle** | Real-time hex board in 3D (sprites, lights, spell effects, camera moves). Telegraphs, attack bars, counters, perfect dodges, a combo gauge, elemental weaknesses, minibosses, rare foes and 18 bosses. |
| **Reading enemies (v70)** | Each enemy's tile has an attack bar that fills counter-clockwise and flashes twice before it casts. Each kind of move has its own tell. Countering during the flash and perfect dodges are rewarded. The Bestiary records creatures as you fight them. |
| **Collecting (v58)** | Contracts on the bounty board, area affinities with elemental enemy variants, shards and crafting (breaking cards is manual), and colour mastery with set rewards. |
| **Dungeon flow (v66)** | Floors twice the size, and a path map at the stairs (Worn Stair / quiet / peril / treasure). The *stirring dark* sends spawns that grow harder over time up to a cap per floor. Teleport traps and trapdoors. Deep falls of 2 or 3 floors, with a Wayshard to fetch from above and a Lost Satchel. |
| **Special rooms (v67, v68)** | 15 rare rooms every 2 to 3 floors: nest, teleport hub, pit, treasury, mirror, gambler, forge, trade table, camp, chapel, flooded hall, dark room, bridge, library, crystal geode. |
| **Puzzles (v69)** | 14 puzzle kinds, a puzzle room on 60% of floors. Plus your three: the switch circuit vault, the ghost's table (20 elemental artifacts), and the cursed idol with its cleansing altar. |
| **Shop and packs** | Madame Oriel's shop: packs by colour or booster, selling cards, pack opening. |
| **Saving** | Save points, plus a full-floor save in the run (v2 format). |
| **Settings** | Phone and tablet layouts, text size, orientation, full screen, sound, cast-card style, 4 touch movement modes, dungeon tips, and rebindable keyboard controls. |
| **Debug menu** | Lighting, PBR, normal maps, baked AO and SSAO, haze, a full battle camera (angle, field of view, zoom, move and rotate on X/Y/Z), depth of field, wall see-through, frame rate, auto quality, pause. |

### Recent changes (v71 to v75)

| Build | Change |
|---|---|
| v71 | New font, **Jersey 15**, so 3, 5 and 8 (and B and G) are easy to tell apart. One back button style on every full screen and one ✕ on every window, both drawn as pixel shapes. |
| v72 | Settings goes back with the ← button. The battle camera can move and rotate on X/Y/Z. Field of view works without an angle set. Depth of field added. |
| v73 | Floor effects (tile glow, telegraphs, decals) can no longer draw over a faded character. The default battle camera is now Angle 36, Lens 61, Zoom 1.1. |
| v74 | The depth-of-field blur fades in smoothly. New sliders: blur fade, near blur, far blur. Focus dials 25 tiles forward or back. |
| v75 | **Crash fix:** pushing into the wall beside the stairs could bounce you up and down floors until the screen went black. Stairs you arrive on now wait until you walk clear, and old floors are fully freed from graphics memory. |

---

## 2. What we plan to do

These are agreed or proposed and waiting on a decision or a turn.

### Waiting on your decision

- **Hiding enemy patterns (reading enemies, option 3).** You didn't want the player to know which
  cards are coming. The proposal is:
  - hide the next-move icon over an enemy until you have learned that creature in the Bestiary;
  - clever enemies sometimes show a **fake intent**.
  - Other ways I offered were: showing only a danger level, or removing the icon entirely.
- **Battle and dungeon zoom.** The Zoom slider is shared, so the dungeon also starts at 1.1 now.
  This could be split into a separate battle zoom and dungeon zoom.

### Next features (from the roadmap)

| Feature | Notes |
|---|---|
| **Goals beyond a single run** (roadmap idea 4) | Collection book completion rewards, a daily seeded dungeon with a score, unlockable card backs (Arcane Weave and Starfield are already drawn). |
| **Battle sound effects** | The dungeon has sound effects; battles don't yet. |
| **Area rules in the dungeon** | Each area has its own battle rule, but there is no matching rule for exploring. |
| **Trading post** | The camp button exists but only says "coming soon": trading cards with other players. |
| **Polish and accessibility** (point 9) | Deferred until you call it. |

---

## 3. Outstanding

### To check

- **Black screen on the stairs:** the cause found is fixed in v75, but it couldn't be reproduced on
  the test machine. It needs checking on your phone.
- Values you set before on the debug sliders still override the new camera defaults. Use
  **Reset all** to pick up the new ones.

### Decided not to build

- Boon altars and risk doors (runs get their story from the dungeon instead).
- Colour locks.
- The Executioner (replaced by the stirring dark).
- Showing upcoming enemy moves on the Spell screen (it gave away too much).
- Pinch zoom.

---

## 4. How a round works

- Every change is committed, pushed to the branch and to `main`, and built into
  `hexmancers-itch-vN.zip`, which is sent with screenshots.
- Each feature has its own browser test (Playwright). The regression suites (battle 3D, reading,
  rooms, puzzles, dungeon, stairs, walking) run before each build.
- The roadmap doc and its artifact page are updated when a roadmap item lands.
