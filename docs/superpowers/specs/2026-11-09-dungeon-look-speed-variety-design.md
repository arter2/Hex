# Dungeon: shadow shape, speed on weak devices, room variety

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

Assumptions (not stated in chat; say so if any is wrong):

- All new art is drawn in code, like today's. No image files are added.
- Themes and shapes are for the spacious dungeon (layout 2, the default for new games). The
  classic layout gets only the shadow shape and the speed work.
- Puzzle rooms, lairs, special rooms (`rooms.js`) and landmark centrepieces keep their own look.
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

Added to `x2Shape` / `x2In` beside L, H and X. Each keeps whole cells along the middle of all
four sides of its box, as the existing shapes do, so doorways still open straight onto the room.

- **O (octagon):** the four corners cut on the diagonal; uses the existing diagonal wall pieces
  (`xWedge`).
- **C (round):** a disc of cells for boxes 9 × 9 and up, stepped with diagonal pieces.
- **P (pillared hall):** a rectangle with a grid of solid pillars every third cell, clear of the
  edge ring and the middle.
- **K (cave pocket):** natural areas only; an irregular outline grown from the box's middle by a
  seeded cellular pass, kept in one piece.

Shaped rooms follow today's rule for L, H and X: no puzzles, lairs or special rooms in them.

### 3c. Saves

- A theme is stored on the room (`r.theme`) and a shape as today (`r.shape`), both in the floor
  save. Floors saved before this build have neither and are drawn exactly as now.
- Only newly dug floors get themes and the new shapes.

**Checks.** 400 seeded floors: all build, every room reachable, 12–16 rooms, worst build time
within 20% of v301's. The crawl bots and `touch-dungeon-runner.js` run on depths 1, 5, 9, 13, 17
and 21 with no new stuck or off-floor reports. A contact sheet of every theme in every area is
saved under `docs/` for review.

## Order and builds

1. Shadow shape (one build).
2. Speed: savings, then the Low preset and Auto (two builds).
3. Variety: themes, then shapes (two or more builds).

Speed goes before variety so the new rooms are measured against the faster baseline, and Low is
there to carry them.

## Out of scope

- The battle screen, camp and menus.
- New enemies, puzzles, special rooms or loot.
- Changing the camera, the wall hole or the low near walls.
- Image-based tilesets.
