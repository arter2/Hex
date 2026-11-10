# Dungeon: shadow shape, speed on weak devices, room variety, new puzzles

Date: 2026-11-09 · Status: approved in chat, awaiting spec review · Base build: v301

## Goal

Make the dungeon part of the game better looking and less repetitive as a roguelike, keep the
characters readable when something stands in front of them, and make the dungeon run faster on
low-end devices.

Decisions made in chat:

- **Shadow shape:** you and every enemy in sight show as a dark shape wherever something covers
  them. The see-through hole that walls already get (`xCutAway`) stays.
- **Variety:** room themes and new room shapes, both.
- **Speed:** the game looks the same on capable devices. Cost is removed where it is invisible,
  and a Low graphics preset is added that weak devices start on.
- **Shaped rooms are not plain:** puzzles, lairs and special rooms may sit in shaped rooms, old
  shapes and new.
- **Puzzles:** more kinds of puzzle. How often a floor has a puzzle room stays as it is (one
  room on 60% of floors).

Assumptions (not stated in chat; say so if any is wrong):

- All new art is drawn in code, like today's. No image files are added.
- Themes and shapes are for the spacious dungeon (layout 2, the default for new games). The
  classic layout gets only the shadow shape and the speed work.
- Puzzle rooms, lairs, special rooms (`rooms.js`) and landmark centrepieces keep their own look
  (they are not given a theme), whatever the shape of the room they are in.
- "Keep the same amount and scale" was read as: no change to how many puzzle rooms a floor has
  at any depth.
- Work goes on the branch `dungeon-look-speed-variety`, with the build number raised per piece
  and `docs/status.md` updated as earlier builds were.

## What exists today (measured on v301, 390 × 844, one floor per area)

| | Value |
|---|---|
| Draw calls at a floor's start | 109–142 |
| Triangles at a floor's start | 122k–184k |
| Lights | 7: ambient, sun, your lamp, 4 pooled torch lights |
| Full-screen passes on by default | 3: SSAO, depth of field (32 samples), vignette |
| Floor build time (desktop CPU) | 0.7–1.3 s |
| Room shapes | rectangle, L, H, X (`x2Shape`, `dungeongen.js`) |
| Floor textures per area | 3: one for passages, two for rooms (`xAreaFloors`, `nature.js`) |
| Furniture sets | 5 (`XROOM_KINDS`), picked per room from 4–5 per area (`XAREA_KIND`) |

- **Occlusion.** Walls between the camera and you are cut by a dithered shaft in the shader
  (`xSinkShader`), and near walls stand low (`xStepLow`). Furniture, landmark pieces, arches seen
  from the side, pillars and classic-layout props are not cut, so they cover the sprites.
- **Quality.** `lookQuality` steps down `LQ_STEPS` only after the frame time has averaged over
  20 ms for 1.5 s. Every device starts on the top step.
- **Per-frame waste.** `xWallCut` makes a `Matrix4`, a `Set` and a joined array each frame;
  `xWallFade` makes two matrices and a colour per wall touched; the minimap is redrawn every
  sixth frame whether or not anything changed.

## Piece 1: the shadow shape

**What you see.** Where a character is covered, a flat shape of the character shows through the
thing covering it: dark, tinted with the area's glow colour, about 55% solid. Inside the wall
hole the character is drawn normally. Enemies show it only while in sight, exactly when their
sprite shows.

**How.**

- `xSprite` gives each character sprite a companion sprite (`userData.shade`) that shares the
  same texture and is kept at the same position and scale after `xStand`.
- The companion's material: flat colour (texture alpha only), `depthFunc: THREE.GreaterDepth`,
  `depthWrite: false`, `alphaTest` as the sprite, `fog: false`. It passes only where the depth
  already drawn is nearer than the character, which is exactly where the character is covered.
- It is drawn before the character sprites (lower `renderOrder` in the transparent pass), so one
  character standing in front of another does not put a shadow on it.
- `xRefresh` sets the companion's map whenever it sets the sprite's.
- Things that do not write depth (the darkness veil, glows, faded classic walls) never cause a
  shadow, which is right: they do not hide the character.

**Settings.** Debug menu › Dungeon view: Shadow shape on/off (`dShade`, on), strength
(`dShadeA`, 0.55), tint toward the area glow (`dShadeTint`, 0.35). Saved like the other sliders.

**Checks.** A scripted test places the mage behind an arch, a pillar, a bookcase and inside the
wall hole, and an enemy behind a low wall, and compares the screen: covered pixels of the sprite's
outline are the shadow colour; uncovered pixels are unchanged from v301; nothing is drawn for an
enemy out of sight.

## Piece 2: speed

### 2a. Savings that change nothing on screen

- **No allocation in the frame loop.** `xWallCut`, `xWallFade`, `xLightPool` and `xDraw` reuse
  module-level scratch objects (matrix, colour, set, arrays).
- **Furniture merged per room.** Each room's furniture already goes through `xMerger`; rooms
  whose pieces are still separate meshes (pots aside, since they break) are merged to one mesh
  per room per material.
- **Minimap on change.** `xMini` runs when the player's cell, the seen map, a door or a marker
  changed, or the map is open; otherwise it is skipped.
- **Light list.** `xWallCut`'s walk over `EX.glows` and `EX.onWall` runs only when the cut line
  or the player's cell changed.

Anything else is added only if the profile (below) shows it costs over 0.3 ms a frame.

### 2b. The Low preset

| | High (today) | Low |
|---|---|---|
| Depth of field | on | off |
| SSAO | on | off (baked AO stays) |
| Vignette | on | on, drawn in CSS over the canvas, no full-screen pass |
| Torch lights | 4 | 2 |
| Wall blocks | bevelled, about 250 vertices | plain boxes (the existing lighter deep-mass geometry) |
| Dust, weather, motes | full | half the count |
| Pixel ratio cap | 2 | 1 |

With no post pass left, Low renders straight to the screen (`xRender`'s early return).

### 2c. Choosing the preset

- Settings › Graphics: **Auto**, **High**, **Low** (`hexmancers-gfx`). Auto is the default.
- Auto: on the first dungeon floor of a session, the first 90 drawn frames after the floor's
  shaders are warm are timed. A median over 22 ms starts the device on Low; the result is kept
  in `localStorage` so later sessions start right. `lookQuality` still steps within the preset.
- Switching preset rebuilds the current floor's scene (the wall geometry differs).

**Checks.** `tools/playtest/dungeon-profile.js` (new): for one seeded floor per area and each
preset it records draw calls, triangles, programs, script time per frame and frame time at 4×
CPU slowdown, before and after. Targets: High draws the same picture as v301 (screens compared);
Low at least halves triangles and removes all full-screen passes; script time per frame does not
rise. The software GPU here gives relative numbers only; a real phone check follows
`docs/iphone-checklist.md`.

## Piece 3: variety

### 3a. Room themes

A theme is one table entry: a floor painter, a wall-dressing list, a furniture pool, a light
colour and strength, and optional floor features. `xAssignThemes` gives each ordinary room a
theme from the area's weighted list, seeded by the floor, never the same theme for two rooms
joined by one passage where the area has another to give.

| Theme | Floor | Dressing and furniture | Light |
|---|---|---|---|
| Armory | worn slabs, iron inlay | weapon racks, shields, anvil, crates | warm torches |
| Flooded | dark wet tiles, shallow pools | reeds, a drain grate, drips | cold, dim |
| Overgrown | cracked slabs, moss and roots | vines on walls, saplings, mushrooms | green, soft |
| Collapsed | broken paving, rubble fans | fallen blocks, props, dust in the air | dim, one shaft from above |
| Library | planks or fine tiles, a runner | bookcases, desks, candles, scrolls | warm candles |
| Crypt | flagstones with grave slabs | sarcophagi, urns, bones, wall niches | pale |
| Forge | soot-black stone, ember cracks | furnace, bellows, ingots, quench trough | orange, strong |
| Bathhouse | small mosaic tiles, a sunk basin | benches, urns, steam | pale blue |
| Barracks | plain boards and slabs | bunks, tables, chests, banners | warm torches |
| Fungus grove | earth and mycelium | tall glowing caps, spore motes | the area's glow, strong |

- Weights per area keep each area's character (Ember Rifts favours Forge and Collapsed, Frozen
  Deeps favours Flooded and Crypt, and so on). Natural cave areas use the natural themes
  (Flooded, Overgrown, Collapsed, Fungus grove) plus a few built rooms.
- Floors: `variant` in `xBuildScene` grows from 3 values to one per theme present on the floor.
  Each floor texture is one more mesh and one more texture, so a floor uses at most 5 themes.
- Furniture pieces new to `xFurnish` are built from the shared `XG` shapes through `xMerger`,
  like the existing ones.
- Passages get 2 or 3 floor variants per area in place of one, chosen per corridor.

### 3b. New room shapes

Shapes become **templates**: a named grid of tile codes, one string per row, kept in a new
`game/roomshapes.js`. The generator picks a template that fits the room's box, turns or mirrors
it at random, and stamps it. L, H and X stay as they are (`x2Shape` / `x2In`).

Tile codes: `.` rock, `#` floor, `P` pillar (solid, full height), `L` low wall (solid, seen
over), `W` water, `C` chasm, `B` bridge, `D` a spot where a doorway may open.

| Template | Box | What it is |
|---|---|---|
| Octagon | 11 | corners cut on the diagonal |
| Round | 11 | a disc |
| Pillared hall | 11 | pillars every third cell |
| Cave pocket | 11 | irregular outline, natural areas only |
| Ring and sanctum | 11 | a vault inside the hall, one door in |
| Keyhole | 11 | a round head on a long nave |
| Cathedral | 15 | nave, transept, apse, two rows of pillars |
| Quatrefoil | 15 | four round lobes on a crossing |
| Honeycomb | 15 | three joined hexagons |
| Cloister | 15 | a colonnade round a pool |
| Spiral | 15 | winds in to a sealed heart that holds the reward |
| Chasm hall | 15 | a drop across the hall, two bridges |

- The 15-cell templates are landmark halls (3 or 4 a floor); the 11-cell ones are ordinary rooms.
- Stepped corners are built with the existing diagonal wall pieces (`xWedge`).
- Corridors join a template only at its `D` cells, so a doorway always opens onto floor.
- Water and chasm are impassable; a bridge is walkable. Enemies path the same way.
- **Your own shapes.** The Room Shaper artifact (claude.ai/artifact/TjFjM8YiwdmQUxTTqmSNac)
  saves shapes in the same row-string format. Shapes saved there are added to
  `game/roomshapes.js` after a check that all floor is connected and there is at least one
  doorway.

### 3c. Shaped rooms hold puzzles, lairs and special rooms

Today `xAssignRooms` (`dungeon.js`) and the special-room planner (`rooms.js`) pass over any room
with a shape or low walls. That rule goes, for L, H and X as well as the new shapes.

- **Fitting.** Each role asks for the space it needs inside the room's own floor, using
  `pzRect` (already used by the grid puzzles): the biggest clear rectangle of the room's cells
  with a walkable rim. A role is given to a shaped room only if its rectangle fits; otherwise the
  next candidate room is tried, plain rooms included.
- **Puzzles.** The eight grid puzzles already build through `pzRect`. The older six (levers,
  plates, mirrors, runes, statues, trial) are moved onto it where they still read the room's box.
  `xPlacePuzzle` already tries each kind in turn and undoes a failed attempt, so a kind that does
  not fit a room is skipped.
- **Lairs and special rooms.** Their furniture and set pieces are laid out in the fitted
  rectangle; the rest of the shaped room is ordinary floor round it. A pillared hall counts its
  pillars as taken cells.
- Every built-in template has a clear rectangle of at least 3 × 3; the Spiral's heart and the
  Ring's sanctum hold a chest or a lair, not a grid puzzle.

### 3d. Saves

- A theme is stored on the room (`r.theme`) and a shape as today (`r.shape`), both in the floor
  save. Floors saved before this build have neither and are drawn exactly as now.
- Only newly dug floors get themes and the new shapes.

**Checks.** 400 seeded floors: all build, every room reachable, 12–16 rooms, worst build time
within 20% of v301's; every planned puzzle, lair and special room is placed (none dropped for
want of a room), and at least a third of them land in shaped rooms. `puzzle-lab.js` solves every
puzzle kind in each room shape. The crawl bots and `touch-dungeon-runner.js` run on depths 1, 5, 9, 13, 17
and 21 with no new stuck or off-floor reports. A contact sheet of every theme in every area is
saved under `docs/` for review.

## Piece 4: new puzzle kinds

Today there are 14 kinds of puzzle room: levers, plates, mirrors, runes, statues, trial, path,
memory, bells, ice, scales, shift, riddle and braziers. Six are added, to make 20. Each is one
entry in `PUZZLE_BUILD` with its interaction, tick, mesh and first-time tip, like the round 4
puzzles in `puzzles.js`, and each opens the rich chest at its heart when solved.

| Kind | What you do | Why it can always be solved |
|---|---|---|
| Lanterns | Step on a floor lantern and it and its neighbours flip; light them all | Built lit, then scrambled by legal steps |
| Sliding mural | Slide the eight stone panels of a wall mural back into the picture | Built solved, then slid at random |
| Sentries | Cross the hall while stone heads sweep their gaze; seen, you are sent back | Sweep timing always leaves a gap wider than a walk across it |
| Herding | A wisp flees from you; drive it onto a rune plate | The room is laid out with no corner the wisp cannot be driven out of |
| Echo | A ghost repeats your steps a few seconds late; use it to hold two plates at once | The plates are placed along a path the delay makes possible |
| Hidden bridge | The way across only shows in the dark; put out the room's lights to see it | The bridge is laid first; the lights are all in reach |

- Wrong moves cost what today's puzzles cost: a bite, a reset or a walk back, never a lost run.
- Frequency is unchanged (a puzzle room on 60% of floors, one at most); with 20 kinds a run of
  24 floors rarely repeats one.
- Each kind is added to `puzzle-lab.js` and solved many times by the bot in plain and shaped
  rooms before it ships.

## Order and builds

1. Shadow shape (one build).
2. Speed: savings, then the Low preset and Auto (two builds).
3. Variety: themes, then shapes with roles in shaped rooms (three or more builds).
4. New puzzle kinds, two or three a build.

Speed goes before variety so the new rooms are measured against the faster baseline, and Low is
there to carry them.

## Out of scope

- The battle screen, camp and menus.
- New enemies, special rooms or loot.
- How often puzzle rooms appear.
- Changing the camera, the wall hole or the low near walls.
- Image-based tilesets.
