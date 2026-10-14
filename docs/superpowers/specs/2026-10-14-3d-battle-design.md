# 3D battle screen, in sync with the dungeon's look

Date: 2026-10-14 · Status: approved in chat, awaiting spec review

## Goal

Bring the dungeon's shader and design pass (texel lighting, light bands, normal maps, baked and
screen-space AO, the lamp and torch lights, area haze, the debug settings) to the battle screen,
so the two views share one look and one set of settings. The battle arena changes with the area
and floor you are on, and is more epic: more movement and more light.

Decisions made in chat:

- **Full 3D battle (option B):** the arena, board, units and effects are all drawn by three.js.
- **"In sync" means the same look and settings**, not the same place. A battle is still its own
  screen. One debug slider changes both views.
- **Camera:** the dungeon's tilt and lens are the base. Cinematic moves play on top, and stop
  while your finger is down.
- **Arenas:** one per area, with layout and lights shuffled on floors 1 to 3, plus a set-piece
  arena on each boss floor.
- **Spell light:** big moments (projectiles, explosions, heals, boss attacks) throw a real
  coloured light from a small shared pool of lights. Small effects only glow.
- **One big build.** The old 2D battle drawing is replaced, with no fallback switch.
- **Performance:** a 60 fps target, scaling quality down automatically on slow phones.

## What exists today

- **Dungeon (`explore.js`):**
  - Draws through three.js, using one `WebGLRenderer` on `#xView`.
  - The lighting pass lives inline in `explore.js`: `xLitShader`, `xLitTag`, `xLitAll`,
    `xLitDefines`, `xNormalMap`, `xBakeAO`, `xSSAOInit`, `xRender`, `xFpsTick`, and the settings
    `XLIT` / `XLIT_DEF` / `XLITU`.
  - The stone painters (`xRockFloor`, `xSlabFloor`, `xRockWall`, `xBlockWall`) also make height
    fields for the normal maps.
  - The debug menu (`#debug`, the `XDBG` table) binds the settings.
- **Battle (`battle.js`):**
  - Draws on a 2D canvas (`View.canvas`, `View.ctx`) through a hand-written fake-3D projection:
    `boardUV`, `nearK`, `proj`, `scaleAt` and `hexCorners`, set up in `resizeView`.
  - `render()` paints, in order: the cave (`buildCave` / `drawCave`), the tiles with all their
    states, aim previews, traps, path dots, the units (via the `DRAW[kind]` table), the boss bar,
    damage estimates, shots, lobs, effects (`palfx`, `ring`, `beam`, `bolt`, `arc`), particles
    (`drawPart`) and floating text.
  - Tile picking is a hex polygon test in `pickAt`.
- **Other files:** `minibosses.js` (`extraDraw`) and `ui.js` use `proj` / `scaleAt` / `View.ctx`
  in a few places.
- **Areas:** the `AREAS` table in `world.js` (6 areas, 4 floors each, floor 4 is the boss floor)
  already describes each area's rock, wall, glow, fog, veins, floor and stone colours.

## Architecture

### `look.js` (new, loads after `three.min.js` and before `explore.js`)

The shared look. It moves out of `explore.js` without changing behaviour:

- **The one `WebGLRenderer`.** Its canvas is moved into whichever screen is showing (dungeon or
  battle), so textures, painted stone and shader programs are shared and built only once.
- **The shader patches and settings:** `XLIT`, `XLIT_DEF`, `XLITU`, the material registry
  (`XLITMATS`) and `xLitShader` / `xLitTag` / `xLitAll` / `xLitDefines` / `xLitRefresh`.
- **The rest of the pass:** the normal-map maker, the AO bake (generalized to take a list of solid
  cells or tiles), the SSAO passes, the stone painters and their height fields.
- **`lookRender(scene, cam)`:** the render call both screens use (today's `xRender`), followed by
  the frame-time tick.
- **Auto quality.** A rolling average of frame time drives it:
  - Above about 20 ms it steps down: first render resolution (pixel ratio 2, then 1.5, then 1,
    then 0.75), then screen-space AO off, then fewer spell lights.
  - Below about 13 ms for a few seconds it steps back up.
  - The frame-rate readout shows the current step.
- **The debug menu bindings (`XDBG`).** The menu opens on the battle screen too.

`explore.js` keeps its scene building and gameplay and calls into `look.js`.

### `arena.js` (new, loads after `look.js`)

The 3D battle scene, built at the start of each battle and thrown away at its end.

- `arenaBuild(depth, seed)`: builds the scene for the area and floor (see Arenas).
- `arenaSync(dt)`: called each frame from the battle loop. It moves the 3D objects to match the
  battle state: the tiles' state looks, units, shots, lobs, effects, particles and spell lights.
- `arenaCamera(dt)`: the camera (see Camera).
- `arenaPick(x, y)`: casts a ray from the camera onto the board plane and returns the hex under it
  (the nearest hex within reach). This replaces the polygon test in `pickAt`.
- `arenaProject(wx, y, wz)`: projects a world point to canvas pixels through the 3D camera.
  `proj()` and `scaleAt()` in `battle.js` keep their names and signatures and call this, so
  `minibosses.js`, `ui.js` and the 2D layer keep working.

### The 2D layer

`View.canvas` stays, as a transparent canvas laid over the WebGL canvas. `render()` shrinks to the
things that must stay crisp and flat:

- health bars, turn pips and status icons over units
- floating damage and heal numbers
- the boss bar
- expected-damage labels
- the aim-path dashes and arrows (`previewOverlay`)
- `extraDraw` (minibosses)

Everything else `render()` drew today moves into `arena.js`.

### What stays the same

All battle rules, tiles, targeting, timing and the data on units and effects (`B`, `TILES`,
`b.shots`, `b.lobs`, `b.fx`, `b.parts`, `b.floaters`). `arena.js` only reads them.

## Arenas

The world matches the battle's board coordinates (`t.wx`, `t.wz`): one hex has radius 1 and the
board's y = 0 is the tile tops.

**Board:**

- Each hex is a real hex prism, the height of today's `SLAB`, lit with `xLitTag`.
- The tiles use the area's dungeon floor stone and its normal map. Each side gets its own tint:
  - your side: cool blue
  - the enemy side: neutral
  - neutral tiles: the area's accent colour
- A fine pixel grid and rim keep tiles readable.

**Tile states.** These keep today's meanings and colours, now drawn as an emissive tint and glow on
the lit stone:

- claimed land, with its last-3-seconds blink
- an incoming telegraph that fills the tile as it nears
- burning, lava, icy, thorns, zap and void tiles
- elemental ground
- hit flashes
- holes: the tile drops away, with an ember rim
- fog over the enemy half
- trap runes: a glowing pixel decal, visible only to you

**Cave:**

- A ring of the area's dungeon wall blocks and rock rises around the board.
- The back and side walls are tall, and the front wall is low, so it never blocks the board.
- Baked AO comes from the generalized bake, with the board cells and wall cells as its input.

**Per area:**

- **Glowworm Hollows (crystal grotto):**
  - Props: green crystal clusters on the walls, mossy pillars.
  - Motion and light: crystals pulse, glowworm motes drift, green light pools.
- **Frozen Deeps (ice cavern):**
  - Props: icicles, frost-rimmed walls.
  - Motion and light: falling snow, ice shimmer, cold blue rim light.
- **Storm Vault (ruined vault):**
  - Props: broken pillars, chained storm-stones.
  - Motion and light: random lightning flashes that light the whole arena for about 0.1 s.
- **Ember Rifts (lava rift):**
  - Props: flowing lava channels beside the board, cracked basalt.
  - Motion and light: rising embers, flickering warm underlight.
- **Gilded Ruins (gilded hall):**
  - Props: gold inlay, fallen statues, braziers.
  - Motion and light: brazier flames, motes in light shafts.
- **The Abyss (starfield void):**
  - Props: floating rock islands.
  - Motion and light: slowly wheeling stars, faint ghost lights.

**Floors 1 to 3:**

- A seed (depth plus battle count) shuffles the prop layout, the number of prop lights (2 to 4)
  and their warmth.
- The haze gets a little denser each floor.

**Boss floor (set piece).** The cave is larger, with a raised dais behind the enemy half and two
extra lights:

- golem: crystal throne
- glacier: frozen falls
- roc: open storm sky
- wyrm: lava lake
- treant: overgrown gold hall
- Hollow King: void rim

**Shared with the dungeon:** the area light, haze colour and distances, and the ambient and top
light, all scaled by the same `XLIT` settings.

## Camera

- **Base view:** the dungeon's tilt (about 48 degrees) and lens, aimed at the board centre. The
  distance is fitted so the whole board plus unit headroom fits the canvas, in portrait and in
  landscape. This replaces `resizeView`'s fitting.
- **Fly-in:** at battle start, about 1.2 s from high and behind the enemy side, ending at the base
  view. A tap skips it.
- **Drift:** while a unit winds up a cast, the camera eases up to 6% of the board width toward it.
- **Boss attacks:** a swing of up to 4 degrees, plus a shake scaled by the hit.
- **Crits and kills:** a punch-in of up to 6% zoom, eased in and out over about 0.4 s.
- **Finger down:** when you aim, drag or hold, every offset eases back to the base view within
  0.15 s and holds there until you lift your finger. Picking always uses the camera as it is drawn.
- `View.shake` keeps its meaning and moves the 3D camera.

## Units and effects

**Units:**

- Units are camera-facing sprites standing on their tiles, using the same pixel frames as today
  (`spr.img`, the white flash, tints), drawn as textures with nearest filtering.
- Each has a soft ground shadow and keeps today's breathing, bob and death fade.
- `FACES_LEFT` and `facing()` flip the sprite.
- Rocks and walls are lit 3D blocks in the area's stone.

**Shots and lobs:**

- Glowing sprite heads with a fading trail.
- Pal sprites (the crystal shard, rocks) are billboards turned to their direction of travel.
- Lobs fly the same arc as today.

**Effects:**

- `beam`: a glowing ribbon.
- `bolt`: a jagged line that is redrawn each frame.
- `arc`: a curved ribbon.
- `ring`: an expanding floor ring.
- `palfx`: animated billboards.
- `drawPart` particles: additive points.

**Spell lights:**

- A pool of 4 point lights, plus 1 for the boss.
- A new big projectile, explosion, heal or boss attack takes the free light that has waited
  longest (or the dimmest one), coloured by the card.
- The light flashes up, then fades over 0.25 to 0.6 s.
- Auto quality can shrink the pool.

## Performance

- 60 fps target, with auto quality as described in `look.js`.
- About 80 hex tiles are drawn as 1 to 3 instanced meshes. Their state colours and glows go in
  per-instance attributes, so state changes cost no material switches.
- Units are pooled sprites. Particles share one Points object.
- Arena props are merged into a few meshes per area.
- Normal maps and AO follow the shared settings. The baked AO is built once per battle.

## Testing

Extend the Playwright scripts (headless Chromium, as before):

- **Fights:** a full fight in each of the 6 areas and each of the 6 boss arenas. Check for no
  errors and take screenshots for review.
- **Picking:** taps on the centre and corner hexes of both halves land on the right tile, in
  portrait and in landscape.
- **Previews:** a card of every targeting shape. The 2D aim previews line up with the 3D tiles.
- **Screen changes:** dungeon to battle and back. The renderer canvas moves, the dungeon redraws,
  and the debug menu works on both screens.
- **Auto quality:** forced slow frames step the quality down and fast frames step it back up.
- **Regressions:** walk5, stairs and deckback still pass.

## Out of scope

- Fighting in the dungeon room itself (option D).
- New battle rules, cards or enemies.
- Point 9 (polish and accessibility), which stays deferred.
