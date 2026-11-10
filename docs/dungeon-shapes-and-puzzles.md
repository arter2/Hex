# Dungeon room shapes and puzzles

Date: 2026-11-09 · Status: room shapes built (game/roomshapes.js); the six puzzles not built yet · For: the spacious dungeon (layout 2)

This is the reference for the two pieces of the dungeon work that are still to be built: the new
room shapes and the new puzzle kinds. The full design, with the room themes, is in
[superpowers/specs/2026-11-09-dungeon-look-speed-variety-design.md](superpowers/specs/2026-11-09-dungeon-look-speed-variety-design.md).
The shadow shape and the speed pass from that design shipped as v305 and v306.

## Room shapes

### How a shape is stored

A shape is a **template**: a name, a box size, and one string per row. They will live in a new
`game/roomshapes.js`. The generator picks a template that fits a room's box, turns or mirrors it at
random, and stamps it onto the floor. The existing L, H and X rooms stay as they are (`x2Shape` /
`x2In` in `game/dungeongen.js`).

| Code | Tile | Rule |
|---|---|---|
| `.` | Rock | Solid wall. |
| `#` | Floor | Open floor. |
| `P` | Pillar | Solid, full height. You walk round it. |
| `L` | Low wall | Solid underfoot, low enough to see over. |
| `W` | Water | Blocks the way unless a bridge crosses it. |
| `C` | Chasm | Blocks the way unless a bridge crosses it. |
| `B` | Bridge | Walkable, over water or a chasm. |
| `D` | Doorway | A spot where a door may open. Corridors join a room only here. |

Rules every template follows:

- All walkable cells (`#`, `B`, `D`) are joined in one piece.
- There is at least one `D`, and each `D` touches rock or the edge of the box.
- Stepped corners are built with the game's diagonal wall pieces (`xWedge`), so they show as smooth
  45-degree walls.
- Puzzles, lairs and special rooms may sit in a shaped room. Each is fitted into the biggest clear
  rectangle of plain floor (`pzRect` in `game/puzzles.js`); the rest of the room is ordinary floor
  round it.
- The six 11-cell shapes are ordinary rooms. The six 15-cell shapes are landmark halls, 3 or 4 a
  floor.
- Only newly dug floors get these shapes. Floors already saved keep their layout.

Open point: water and chasm are impassable in this design. Wading through water, or falling into a
chasm and landing a floor below, was raised and not decided.

### Your own shapes

The **Room Shaper** (claude.ai/artifact/TjFjM8YiwdmQUxTTqmSNac) paints shapes in this same format
and saves them with the page. A saved shape is added to `game/roomshapes.js` after a check that
all its floor is connected and it has at least one doorway.

### The twelve shapes

### Octagon

- **Box:** 11 x 11 cells
- **Use:** Ordinary room
- **What it is:** Corners cut on the diagonal.

```
...##D##...
..#######..
.#########.
###########
###########
D#########D
###########
###########
.#########.
..#######..
...##D##...
```

### Round

- **Box:** 11 x 11 cells
- **Use:** Ordinary room
- **What it is:** A disc.

```
....#D#....
..#######..
.#########.
.#########.
###########
D#########D
###########
.#########.
.#########.
..#######..
....#D#....
```

### Pillared hall

- **Box:** 11 x 11 cells
- **Use:** Ordinary room
- **What it is:** Solid pillars every third cell.

```
#####D#####
###########
##P##P##P##
D##########
###########
##P#####P##
###########
##########D
##P##P##P##
###########
#####D#####
```

### Cave pocket

- **Box:** 11 x 11 cells
- **Use:** Ordinary room, natural areas only
- **What it is:** Irregular outline.

```
...####....
..######...
.########..
.#########.
D##########
##########.
.#########.
..########D
..########.
...######..
....#D#....
```

### Ring and sanctum

- **Box:** 11 x 11 cells
- **Use:** Ordinary room
- **What it is:** A vault inside the hall with one door in. The sanctum holds a chest or a lair, not a grid puzzle.

```
#####D#####
###########
###########
###.....###
###.###.###
D##.###.##D
###.###.###
###..D..###
###########
###########
###########
```

### Keyhole

- **Box:** 11 x 11 cells
- **Use:** Ordinary room
- **What it is:** A round head on a long nave.

```
....#D#....
...#####...
..#######..
.#########.
.#########.
.#########.
..#######..
..#######..
..D######..
..#######..
..###D###..
```

### Cathedral

- **Box:** 15 x 15 cells
- **Use:** Landmark hall
- **What it is:** Nave, transept, apse and two rows of pillars.

```
......#D#......
.....#####.....
....#######....
....#######....
....#######....
###############
D#############D
###############
..###########..
..##P#####P##..
..###########..
..##P#####P##..
..###########..
..##P#####P##..
..#####D#####..
```

### Quatrefoil

- **Box:** 15 x 15 cells
- **Use:** Landmark hall
- **What it is:** Four round lobes on a crossing.

```
......#D#......
.....#####.....
....#######....
....#######....
..###########..
.#############.
###############
D#############D
###############
.#############.
..###########..
....#######....
....#######....
.....#####.....
......#D#......
```

### Honeycomb

- **Box:** 15 x 15 cells
- **Use:** Landmark hall
- **What it is:** Three joined hexagons.

```
...............
..####...####..
..#####.#####..
.######.######.
D#############D
.######.######.
..#####.#####..
..###########..
.....#####.....
....#######....
....#######....
....#######....
.....#####.....
......#D#......
...............
```

### Cloister

- **Box:** 15 x 15 cells
- **Use:** Landmark hall
- **What it is:** A colonnade round a pool.

```
...............
.######D######.
.#############.
.##P#P#P#P#P##.
.#############.
.##P#WWWWW#P##.
.####WWWWW####.
.D#P#WWWWW#P#D.
.####WWWWW####.
.##P#WWWWW#P##.
.#############.
.##P#P#P#P#P##.
.#############.
.######D######.
...............
```

### Spiral

- **Box:** 15 x 15 cells
- **Use:** Landmark hall
- **What it is:** Winds in to a sealed heart that holds the reward (a chest or a lair).

```
...............
.#############.
.D############.
.##.........##.
.##########.##.
.##########.##.
.##.##...##.##.
.##.####.##.##.
.##.##...##.##.
.##.#######.##.
.##.#######.##.
.##.........##.
.############D.
.#############.
...............
```

### Chasm hall

- **Box:** 15 x 15 cells
- **Use:** Landmark hall
- **What it is:** A drop across the hall with two bridges.

```
...............
...............
######CCC###D##
######CCC######
#####BBBBBB####
#######CCC#####
##L###CCC###L##
D#L###CCC###L#D
##L###CCC###L##
######CCCC#####
#####BBBBBB####
######CCC######
######CCC######
...............
...............
```

## Puzzles

Today there are 14 kinds of puzzle room: levers, plates, mirrors, runes, statues, trial, path,
memory, bells, ice, scales, shift, riddle and braziers. Six are added, to make 20. How often a
floor has a puzzle room does not change: one room on 60% of floors, at every depth.

Each new kind is one entry in `PUZZLE_BUILD` with its interaction, tick, mesh and first-time tip,
like the round 4 puzzles in `game/puzzles.js`. Solving one opens the rich chest at its heart.

| Kind | What you do | Why it can always be solved |
|---|---|---|
| **Lanterns** | Step on a floor lantern and it and its neighbours flip. Light them all. | Built lit, then scrambled by legal steps. |
| **Sliding mural** | Slide the eight stone panels of a wall mural back into the picture. | Built solved, then slid at random. |
| **Sentries** | Cross the hall while stone heads sweep their gaze. Seen, you are sent back to the start. | The sweep timing always leaves a gap wider than a walk across it. |
| **Herding** | A wisp flees from you. Drive it onto a rune plate. | The room is laid out with no corner the wisp cannot be driven out of. |
| **Echo** | A ghost repeats your steps a few seconds late. Use it to hold two plates at once. | The plates are placed along a path the delay makes possible. |
| **Hidden bridge** | The way across only shows in the dark. Put out the room's lights to see it. | The bridge is laid first; the lights are all in reach. |

Rules for all six:

- A wrong move costs what today's puzzles cost: a bite, a reset or a walk back. Never a lost run.
- Each kind is added to `tools/playtest/puzzle-lab.js` and solved many times by the bot, in plain
  and shaped rooms, before it ships.

### Dropped, and why

These were proposed and cut because the game already has the mechanic:

| Proposed | Already covered by |
|---|---|
| Code lock | Levers, Runes and Echo bells (find the right order) |
| Water jugs, Counterweights | Weight scales |
| Crystal lenses | Mirrors and Shifting stones (route a beam) |
| Crumbling floor | Pressure path and Memory tiles (close, and the weakest of the set) |

## What is not decided yet

- Whether water and chasm stay impassable.
- The implementation plans for shapes, themes and puzzles. Each gets its own plan.
