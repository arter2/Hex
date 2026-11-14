# Mold, Foliage Cards and Mushrooms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two pieces of painted art go into the dungeon together.
1. **Mold.** Painted mold grows over the floors and walls: dense in damp places, sparse elsewhere, coloured by area, heavier in damp room themes, with light mold in battles.
2. **Foliage.** The flat creeper strips and cone grass are replaced by painted vine and grass cards.
3. **Mushrooms.** Twelve kinds of small painted mushroom cluster grow as cards at mixed sizes: between rocks and at wall feet, and, for the bracket kinds, on walls, on the sides of wood and on new fallen logs. The luminous ones glow softly.

**Architecture:**
- **Mold sheet.** All 20 mold tiles go into one atlas sheet, `atlas/mold.webp`, at 256 px with wrapped gutters, sampled by its own sampler.
- **Mold map.** A per-floor data texture records, for each spot, the weight of each of the area's up to three mold colours, plus a damp value. It sits on the same grid as the AO map.
- **Shader.** A new patch in `look.js` (`xMoldShader`) blends mold over a material's base colour, and lightly raises its relief, wherever the mold map and the tile's alpha say so. Floor and wall materials opt in through `material.userData.xmold`, the same way the existing patches opt in.
- **Foliage cards.** The vines and grass use the painted single-plant tiles in the effects sheet. Nature's vines and grass become instanced cards. The Overgrown reeds become merged cards through a generalised `xLeafMerger`.
- **Mushroom cards.** The mushrooms are single-cluster tiles in the same effects sheet. Their glow masks go into a parallel sheet, `atlas/effects-e.webp`, with the identical layout, cut out with the same rectangles and used as `emissiveMap`. Floor clusters are nature instanced cards. Bracket clusters sit flat against a wall face or the side of a wooden piece. Fallen logs are a new clutter piece.

**Tech Stack:** three.js r128 (`onBeforeCompile` shader patches), plain browser JS, Python 3 with Pillow and numpy for the atlas build, Playwright checks under `tools/playtest/`.

**Spec:** this plan carries the agreed design itself. There's no separate spec, and the decisions below are the user's answers from 2026-11-14. The art handoffs travel with it:
- `docs/art-production/foliage-alts/CLAUDE_DUNGEON_FOLIAGE.md` (foliage);
- `docs/art-production/mold/CLAUDE_MOLD_PART_1.md` and `CLAUDE_MOLD_PART_2.md` (mold, copied in Task 1);
- `docs/art-production/mushrooms/CLAUDE_MUSHROOM_TEXTURES.md` and `mushroom-variants.json` (mushrooms, copied in Task 1).

## Agreed design (the user's answers)

| Question | Decision |
|---|---|
| Order | Foliage (vines and grass) and mold in one combined pass, pictures at the end. |
| Mold surfaces | Floors and walls. Not props or clutter. |
| Spread | Dense mold in damp places (wall feet, room corners, near water and pools, floor joints). A light sprinkle of the sparse tile elsewhere, with large clean stretches. |
| Existing growth | Mold replaces the soft green floor blotches (`nature.js` `xNatPatches`) in the areas where those are moss: the Hollows and the Ruins. Snow, ash, the dark patches and the stain decals (scorch, frost, dust) stay. |
| Palette | Each area has its own colours, and each room picks a stable one: **Hollows** olive, teal, mint. **Deeps** slate blue, ivory. **Vault** plum, dusty rose. **Rifts** rust, charcoal, ochre. **Ruins** ochre, olive, ivory. **Abyss** charcoal, plum. |
| Themes | Damp themes heavier: flooded, bathhouse, crypt, fungus, overgrown, collapsed. Less in forge, armory, barracks. None in library. |
| Storage | 256 px in an atlas sheet. Follows the Texture sharpen slider. |
| Debug | Surfaces tab: a Mold switch, an Amount slider, a Damp spread slider and a Scale slider. |
| Battles | Light sparse mold on the battle floor and its walls, with no damp spots. |
| Relief | Slightly raised, and softens the stone's bumps under it. Follows the Normal maps switch and strength sliders. |
| Default strength | Noticeable but restrained: clear growth at wall feet and corners, scattered colonies elsewhere, most floor clean. |
| Wall reach | Dense at the foot, fading out over about the lower third of the wall, with a few sparse colonies higher. Wall tops stay clean. |
| Vines | Hollows: broad ivy, with fine tendrils on every third wall. Ruins: weathered vines, with fine on every third wall. The Ruins' brown hanging roots stay as strips. |
| Grass | The Ruins' crack tufts and the Overgrown reeds become grass cards, and new low tufts go at Hollows wall feet. |
| Glow | Glow everywhere, subtle. Applies to the seven luminous mushrooms in this pass, and later to the glowing moss. |
| Mushroom cards | Little cards of different scales. Most about a quarter of the hero's height, some tiny, now and then one at knee height. A handful per room, more in Fungus rooms. Each room picks two or three types. |
| Wall and wood mushrooms | Shelf fans (05) and oyster rosette (06): on walls, on the sides of wood, and on logs, set flat against the surface and jutting from it. The other ten grow from the ground: between rocks and at wall feet. |
| Wood | A new fallen-log piece: mossy, half-rotten, with mushrooms on its sides. It goes in Overgrown, Collapsed and Fungus rooms and Hollows caves. Shelf fans also grow on the sides of old wooden furniture in damp rooms (crates, barrels, shelves, racks, tables) and on sapling trunks. |
| Mushroom areas | **Hollows** lantern bells, pinlight colony, moss puffballs, split sage caps (and the foliage pack's `mushrooms-glow`). **Deeps** ivory bonnets, pinlight colony. **Vault** violet waves, coral fingers. **Rifts** copper cups, amber buttons (sparse). **Ruins** amber buttons, split sage caps, copper cups. **Abyss** black trumpets, violet waves. Shelf fans and oyster rosette on wood everywhere but the Rifts. Fungus rooms in any area take all the floor kinds. |

## Global Constraints

- three.js r128. Shader code must compile under WebGL1 and WebGL2. `textureGrad` only under `#if __VERSION__>=300`, falling back to `texture2D`, as `look.js` `xAtS` does.
- Every material that gets a shader patch must keep its `customProgramCacheKey` distinct for each combination of defines it compiles with.
- Art masters stay under `game/art/environment/painterly-512/`, which `tools/package-itch.py` already excludes. The game reads only `game/art/environment/atlas/`.
- A sheet that hasn't loaded must never break a build. The fallback for mold is no mold. For cards, it's the old geometry. `envArtFx` and `envArtArrived` already rebuild the scene once art comes in.
- Choices are seeded and stable. A rebuild of the same floor gives the same mold colours, vine variants and card placement. Use `caveRng` streams. Don't add draws to existing streams ahead of existing draws: put new draws on their own stream, so the rest of the dressing doesn't move.
- No model IDs in repo files. Commits end with the two attribution lines in the session's reminder.
- Don't bump the version or zip unless asked.
- Send pictures after the changes (the user's standing rule). Keep testing proportionate.

## Review Focus

(Six, not five: the mushrooms brought one more.)

1. **Door and room boundaries.** Mold colours must cross-fade over about one cell at a doorway, not snap or show a third colour. The mold map is linear-filtered per channel, so this holds as long as each channel is one colour slot. Task 3's check: `moldBoundaryBlend`.
2. **Low near walls and cutaways.** Mold on a lowered wall must follow the lowered block, so the "lower third" is of the block's drawn height. Cut-away faces must not show mold on the black interior. Task 4's check: a picture of a low near wall in the Hollows.
3. **Turning mold off.** The Mold switch off must leave every surface exactly as it is today: no define, no extra lookups, and the green blotches back in the Hollows and Ruins. It does that by rebuilding the scene. Task 6's check: `moldOff`.
4. **Art not loaded.** With `mold.webp` failing or slow, floors build with no mold and no shader errors, then gain it on arrival. Task 3's check: `moldMissingSheet`.
5. **Mushrooms and walking.** Clusters are scenery and never block, but a log does. Logs must not wall off a doorway, a chest or a puzzle cell. Task 8 reruns the floor check.
6. **The darkest colour on dark rock.** Charcoal blight in the Rifts and Abyss must still read on lit stone, and mustn't punch black holes in a dark cave. Task 7's pictures include a Rifts charcoal room, and the tint floor in `xMoldShader` keeps mold no darker than 60% of the stone's value.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `game/art/environment/painterly-512/shared-mold/` | Create | The 20 mold masters at 512 (`<nn>-<id>.png`, RGBA) and both part manifests. |
| `game/art/environment/painterly-512/shared-foliage/cave-variants/` | Create | The 12 mushroom masters, `card-tiles/` (256 tiles), `emission/` (tile-size glow masks), `mushroom-variants.json`. |
| `docs/art-production/mushrooms/` | Create | The mushroom guide, preview, prompts and checks. |
| `docs/art-production/mold/` | Create | The two mold guides, previews, prompts and checks from the zips. |
| `tools/build-env-atlas.py` | Modify | Build `atlas/mold.webp` (20 wrapped tiles, 5 x 4). Add the four foliage cards, the 12 mushrooms and `mushrooms-glow` to `effects.webp`. Build `effects-e.webp`, a parallel glow sheet in the same layout (black where a tile has no glow). Record `MOLD` and `MUSH` metadata (pivots, glow colour, glow strength) in `envartmap.js`. |
| `game/envartmap.js` | Regenerated | Gains `sheets.mold` and `mold: {id: tileKey}`. |
| `game/envart.js` | Modify | Load `mold` and `effects-e` with the effects. `envArtMold()` returns `{tex, rects}` or null. `envArtFxGlow(name)` cuts the glow mask for an effect, or returns null. |
| `game/mushrooms.js` | Create | The mushroom design: `XMUSH` (kinds, areas, pivots, sizes), `xMushPick`, the card geometry, and the instancing helpers that nature and clutter call. |
| `game/mold.js` | Create | The mold design: `XMOLD` (area palettes, theme levels, densities), `xMoldPick(room, seed)`, `xMoldBake(EX)` (the per-floor mold map), `xMoldArena(A)`, `xMoldShader(sh, kind)`. |
| `game/look.js` | Modify | `XLIT_DEF` keys, `XLITU` mold uniforms, the `xLit` hook for `userData.xmold`, debug rows, and calling `xMoldBake` from `lookBake`. |
| `game/explore.js` | Modify | Tag floor (`xmold=1`) and wall (`xmold=2`) materials. |
| `game/arena.js` | Modify | Tag the battle floor and walls. Give the arena a light, even mold map. |
| `game/nature.js` | Modify | Skip the green blotches when mold is on. Vine and grass cards, new Hollows grass. |
| `game/dungeongen.js` | Modify | `xLeafMerger(name)` takes a texture name. `xGrassCards`. Reeds become grass. The new `'log'` clutter piece, in the theme kits. Bracket mushrooms on logs and sapling trunks. |
| `game/explore.js` | Modify (also) | Bracket mushrooms on the sides of wooden furniture in damp rooms (`xFurnish`). |
| `game/index.html` | Modify | The `mold.js` script tag. A Mold section in the Surfaces tab. |
| `tools/playtest/art-check.js` | Create | The Playwright checks named in the tasks. |
| `docs/status.md`, `docs/art-production/foliage-cards.md` | Modify | Record what was done. |

---

### Task 1: Art into the repository and the atlas build

**Files:**
- Create: `game/art/environment/painterly-512/shared-mold/*.png`, `.../shared-mold/mold-variants-part-1.json`, `...-part-2.json`
- Create: `docs/art-production/mold/` (both `CLAUDE_MOLD_PART_*.md`, previews, prompts, checks)
- Modify: `tools/build-env-atlas.py`
- Regenerate: `game/envartmap.js`, `game/art/environment/atlas/effects.webp`, `atlas/mold.webp`
- Test: `tools/playtest/art-check.js` (created here; later tasks add checks)

**Interfaces:**
- Produces:
  - `ENVART_MAP.sheets.mold`: `{file:'mold.webp', size:[1440,1152], tiles:{'olive-powder':[x,y,256,256], 'olive-powder-sparse':[…], …}}`, all 20.
  - The keys are the pack's stable IDs without the `mold-` prefix. Sparse ones are `<id>-sparse`.
  - `ENVART_MAP.sheets.effects.tiles` gains `vine-broad`, `vine-fine`, `vine-weathered`, `grass-dungeon`.

- [ ] **Step 1: Copy the art in.** From the two zips (already extracted under the session scratchpad as `mold1/` and `mold2/`):
  - Copy the 512 textures to `shared-mold/`, keeping their numbered names, plus both manifests.
  - Leave out the 1024 masters and the separate alphas: the alpha is embedded, and the guide says they match exactly.
  - Copy the guides, previews, prompts and checks to `docs/art-production/mold/`.
  - The foliage files already copied in this session stay.
  - From the mushroom zip (extracted under the scratchpad as `mush/`): copy the masters to `shared-foliage/cave-variants/`, the `atlas-tiles/` to `cave-variants/card-tiles/`, and the `*-emission-atlas.png` masks to `cave-variants/emission/`. Copy `mushroom-variants.json` beside them. Copy the guide, preview, prompts and checks to `docs/art-production/mushrooms/`.
- [ ] **Step 2: Write the failing check `atlasSheets`** in `tools/playtest/art-check.js`. It loads the game (the same as `scratchpad/sharp.js`: `Runner.serve()`, `Runner.launch()`) and asserts:
  - `ENVART_MAP.sheets.mold` exists with 20 tiles, each 256 wide;
  - the effects sheet has the four card keys, the 12 `cave20-mushroom-*` keys and `mushrooms-glow`;
  - `effects-e` has exactly the effects sheet's size and tile rectangles;
  - `ENVART_MAP.mush['cave20-mushroom-lantern-bells']` has `pivot:[0.5760,0.8820]`, `glow:'#8FE4DA'` and `k:0.35`.

  The script prints `PASS atlasSheets` or `FAIL atlasSheets: <why>`, and exits non-zero on any FAIL.
- [ ] **Step 3: Run `node tools/playtest/art-check.js atlasSheets`.** Expected: `FAIL atlasSheets: no mold sheet`.
- [ ] **Step 4: Extend `build-env-atlas.py`.**
  - `FOLIAGE_CARDS` is already added, with tiles appended to `fx` as they are (wrap False).
  - Add `MOLD = [(id, file), …]` for all 20, read from the two manifests.
  - Make `sheets['mold']=build('mold.webp', [(key, tile(f'shared-mold/{file}'), True) …], 'RGBA', False, cols=5)`. Lossy at q92. Wrap True, so the gutters carry the tile's own wrapped edge.
  - Write `ENVART_MAP.mold` as `{id: key}`.
  - Append the mushroom tiles to `fx` under their `envArtFx_name`, as they are (wrap False), plus the foliage pack's `mushrooms-glow`.
  - Build `effects-e.webp` from the same item list: each slot holds that effect's tile-size glow mask (grayscale in RGB, lossless) or black.
  - Write `ENVART_MAP.mush` as `{name: {pivot:[u,v] (atlas, top origin), glow:'#rrggbb'|null, k:strength, wall:bool}}`, from the JSON. `wall` is true for 05 and 06.
- [ ] **Step 5: Run `python3 tools/build-env-atlas.py`, then the check.** Expected: the build prints `mold.webp 1440x1152 20 tiles` at about 600 KB, and the check prints `PASS atlasSheets`.
- [ ] **Step 6: Commit.** "Art: the mold pack, foliage cards and mushrooms into the atlases."

### Task 2: Mold design data and the per-floor mold map (`game/mold.js`)

**Files:**
- Create: `game/mold.js`
- Modify: `game/index.html` (script tag after `envart.js`, before `explore.js`)
- Modify: `game/envart.js` (`envArtMold`)
- Test: `tools/playtest/art-check.js`

**Interfaces:**
- Produces:
  - `XMOLD = { area:{hollows:['olive-powder','teal-fuzz','mint-patina-mold'], deeps:['slate-blue-bloom','ivory-mycelium'], vault:['plum-mildew','dusty-rose-mildew'], rifts:['rust-crust','charcoal-blight','ochre-spores'], ruins:['ochre-spores','olive-powder','ivory-mycelium'], abyss:['charcoal-blight','plum-mildew']}, theme:{flooded:1.6, bathhouse:1.6, crypt:1.4, fungus:1.5, overgrown:1.4, collapsed:1.3, forge:.4, armory:.5, barracks:.5, library:0}, room:.7, passage:.45, arena:.35 }`.
    - The theme numbers multiply the room level. Rooms with no theme use `room`, corridors use `passage`, and the battle floor uses `arena`.
  - `xMoldPick(roomId:number, seed:number, nSlots:number) -> {a:number, b:number|null}`: a room's main colour slot `a`, and for rooms of 40 cells or more, a second slot `b` at half weight. It uses `caveRng(seed*31+roomId*977+4441)`, a stream of its own.
  - `xMoldBake() -> void` fills `EX.moldData` (Uint8Array, RGBA, on the AO grid of `XAO_R`=8 texels a cell, `XN*8` a side) and `EX.moldTex` (a DataTexture, LinearFilter):
    - R, G, B: the weight of colour slots 0, 1, 2 at that spot (0 to 255 = 0 to 2.0, the room's level times its pick);
    - A: damp, 0 to 255, made from three sources:
      - **wall proximity:** the AO map's `R`, reused; it's already highest in corners;
      - **water:** within 2.5 cells of any `EX.natPools` cell, of a `rooms.js` flood water cell, or of a `pool` or `basin` clutter item;
      - **floor joints:** not baked; the shader takes them from the floor tile's own darkness.

      Damp takes the larger of the first two sources.
    - It sets `XLITU.uXMoldMap.value`, and fills `XLITU.uXMoldR` (vec4[6]: dense then sparse rectangle per slot, sheet UV, v up) with the area's slots.
  - `xMoldArena(A) -> void` gives the arena a mold map: slot 0 at `XMOLD.arena` everywhere, damp 0. Its scale and origin are the arena AO map's.
  - `envArtMold() -> {tex:THREE.Texture, rect:(id)=>[u,v,w,h]} | null`: the sheet's texture (RepeatWrapping isn't needed: wrapping happens in the shader, as `xAtG` does) and a rectangle getter. It returns null until the sheet is ready, and marks the build missing art the way `envArtFx` does.

- [ ] **Step 1: Write the failing checks** in `art-check.js`, each building depth 1, world seed 11, as `scratchpad/nmap.js` does:
  - `moldPickStable`: build the floor twice with `clearFloors()` between. Assert that `EX.rooms.map(r=>xMoldPick(r.id,EX.seed,XMOLD.area.hollows.length))` is equal both times, and that `EX.moldData` is byte-equal.
  - `moldLibraryClean`: assert that every mold-map texel inside a library room has R=G=B=0. Use a seed that rolls a library; find one with a quick loop over seeds 1 to 200 at depth 2 and pin it in the check.
  - `moldDampAtWalls`: the average damp in floor cells next to a wall is more than twice the average in cells three or more from any wall.
- [ ] **Step 2: Run the checks.** Expected: FAIL, because `xMoldPick` isn't defined.
- [ ] **Step 3: Implement `game/mold.js`** with the interfaces above, and add `envArtMold` to `envart.js`. `envArtWant` loads `mold` alongside `effects`.
  - In `xBakeAO`, after the AO loop, call `if(typeof xMoldBake==='function') xMoldBake();`, so mold rebakes whenever AO does (scene build, AO slider changes).
  - Add `moldData` and `moldTex` to the `floorsave.js` TRANSIENT list beside the AO entries.
- [ ] **Step 4: Run the checks.** Expected: all three PASS.
- [ ] **Step 5: Commit.** "Mold: area palettes, room picks and the per-floor mold map."

### Task 3: The mold shader and debug settings

**Files:**
- Modify: `game/mold.js` (`xMoldShader`)
- Modify: `game/look.js` (`XLIT_DEF`, `XLITU`, `xLit`, `XDBG`, `xDbgApply`)
- Modify: `game/index.html` (Mold rows)
- Test: `tools/playtest/art-check.js`

**Interfaces:**
- Consumes: `XLITU.uXMoldMap`, `uXMoldR`, `envArtMold()` (Task 2), and `XLITU.uXSharp`, `uXAOScale`, `uXAOOrg` (existing).
- Produces:
  - `XLIT_DEF` gains `mold:true`, `moldAmt:1`, `moldSpread:1`, `moldScale:1`.
  - `XLITU` gains `uXMoldTex`, `uXMoldMap`, `uXMoldR` (6 x vec4), and `uXMoldK` (vec4: amount, spread, scale, on).
  - `xMoldShader(sh, kind:1|2) -> void`: kind 1 is a floor, 2 is a wall. `xLit` calls it when `m.userData.xmold` is set, `XLIT.mold` is on and `envArtMold()` is ready. It adds `XMOLD` to the program cache key.

**What the shader does** (the values the implementer can't choose alone):
- **Coordinates.**
  - Floors: `mu = vXLW.xz / (2.6*uXMoldK.z)`, one tile every 2.6 world units at scale 1.
  - Walls: `mu = vec2(vXLW.x+vXLW.z, vXLW.y) / (2.6*uXMoldK.z)`.
  - The sparse tile uses `mu*0.73 + vec2(.37,.61)`, a different scale and offset, so the dense and sparse colonies never line up.
- **Lookup.** Wrapped inside the tile with explicit gradients, and filtered by `uXSharp`, exactly as `xAtG` does. Factor `xAtG` out of `xAtlasShader` into a shared GLSL string `XATG_GLSL` in `look.js` that both use.
- **Mold map.** Sampled at `(vXLW.xz - uXAOOrg)/uXAOScale`. For walls, at `vXLW.xz + n.xz*.6`, where `n` is the world normal: that's the floor in front of the face.
- **Coverage per slot.** For each slot `i` with weight `w_i > 0.004`:
  - `damp = smoothstep(.15, .15+.55/uXMoldK.y, map.a)`;
  - `cov = clamp(dense.a * damp * w_i + sparse.a * (0.55*w_i) * (1.-damp*.6), 0., 1.) * uXMoldK.x`.
  - On walls, `cov *= 1. - smoothstep(.0, XWALL*.36, vXLW.y - footY)`, where `footY=0`, so the lowered blocks keep their foot at the floor. The sparse term is excluded from that fade, so a few colonies sit higher, but it's cut to 0 within 0.25 of the block's drawn top (`uXTopY` from the rock shader, or the instance top from `instanceMatrix`).
  - On floors, darker spots in the stone (`lum < 0.32`, the joints) add `+0.25*damp` to the dense term.
- **Blend.** `base = mix(base, max(mold.rgb, base*0.6), cov)`, applied after `map_fragment`, so vertex colours, AO, lighting and fog apply on top, as they do to the stone.
- **Relief.** Only when `normal_fragment_maps` exists (the normal map is on):
  - `mapN.xy *= 1. - 0.6*covTotal` softens the stone under the mold;
  - add a bump from the coverage's screen derivatives, `0.9*normalScale.x`, in the style of three's `perturbNormalArb`. Mold edges read raised.

- [ ] **Step 1: Write the failing checks:**
  - `moldShaderCompiles`: after the scene builds with the art in, count materials whose program cache key contains `XMOLD` (more than 0). Assert no `pageerror` or console error containing "shader".
  - `moldMissingSheet`: block `mold.webp` with a page route that returns 404, build the floor, and assert there are no errors and no `XMOLD` key.
  - `moldBoundaryBlend`: read the mold map along the line through a door between two rooms with different slots. Each texel has at most two non-zero colour channels, and the change from one to the other spans at least 6 texels.
- [ ] **Step 2: Run them.** Expected: `moldShaderCompiles` FAILs (no XMOLD), and `moldMissingSheet` passes trivially.
- [ ] **Step 3: Implement the shader, the uniforms and the `xLit` hook.**
  - The debug rows go in a new `<h3>Mold</h3>` in the Surfaces tab, before PBR, with `XDBG_PANES` Surfaces gaining 'Mold':
    - `dbgMold` (checkbox, action `'pbr'`: a rebuild, so it can restore the green blotches);
    - `dbgMoldAmt` (0 to 3, 0.05, `'mold'`);
    - `dbgMoldSpread` (0.25 to 3, `'mold'`);
    - `dbgMoldScale` (0.25 to 4, `'mold'`).
  - `xDbgApply('mold')` copies the three into `uXMoldK`, live.
- [ ] **Step 4: Run the checks.** Expected: all three PASS.
- [ ] **Step 5: Commit.** "Mold: the shader layer and its debug settings."

### Task 4: Mold on dungeon floors and walls; the green blotches go

**Files:**
- Modify: `game/explore.js` (floor material, about line 508; wall material, about line 555 and the ghost mesh at 566)
- Modify: `game/nature.js` (`xNatPatches`)
- Test: `tools/playtest/art-check.js`

**Interfaces:**
- Consumes: `userData.xmold` (Task 3).

- [ ] **Step 1: Write the failing check `moldOnFloorsWalls`.**
  - Depth 1 builds, and at least one floor material and one wall material have `XMOLD` in their cache key.
  - The Hollows have no `xNatPatches` mesh while `XLIT.mold` is on, and do have one when it's off.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Set `fm.userData.xmold=1` on dungeon floor materials, and `mat.userData.xmold=2` on wall materials, including the see-through ghost walls so a fading wall keeps its mold.
  - Theme floors and area floors both get it. The library is handled by its zero weight, not here.
  - In `xNatPatches`, return early when `XLIT.mold && (A.id==='hollows'||A.id==='ruins')`. `A` must be passed in: change the call in `xNature` to pass it.
- [ ] **Step 4: Run the check, and take pictures** at depth 1 world seed 11 and depth 18 world seed 4260, at the default camera, with mold on and off. Check them for:
  - foot-of-wall growth;
  - a low near wall keeping its mold to its own drawn height (Review Focus 2);
  - no seams at tile edges.
- [ ] **Step 5: Commit.** "Mold on the dungeon's floors and walls, in place of the green blotches."

### Task 5: Mold in battles

**Files:**
- Modify: `game/arena.js` (floor and island materials, about lines 137–149; walls about 147; `arenaBakeAO`; `arenaUse`, about line 219)
- Test: `tools/playtest/art-check.js`

- [ ] **Step 1: Write the failing check `moldArena`.** Start a battle at depth 1 (the way the existing battle-camera pictures were taken: `arenaBuild(1, 5)`, then render). Assert that the arena floor material's cache key has `XMOLD` and that the arena mold map has damp 0 everywhere.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Tag the floor, the island top (`xmold=1`) and the walls and rim (`xmold=2`).
  - `arenaBakeAO` calls `xMoldArena(A)` at the end.
  - `arenaUse` (line 219) sets `uXMoldMap` and `uXMoldR` to the arena's, alongside `lookUse`. Switching back to the dungeon restores the floor's, through `xMoldBake`'s uniform set or a `moldUse(EX)` mirror of `lookUse`; pick whichever matches how the dungeon restores its AO.
- [ ] **Step 4: Run the check and take a battle picture** at depth 1 and depth 10.
- [ ] **Step 5: Commit.** "Mold: a light layer on the battle floor and walls."

### Task 6: Vine and grass cards

**Files:**
- Modify: `game/nature.js` (`XKIT` Hollows `tuft`, `xNatGeo`, `xNature` piece loop, `xNatMat`, `xNatShow`)
- Modify: `game/dungeongen.js` (`xLeafMerger`, the reeds case; the new `xGrassCards`)
- Test: `tools/playtest/art-check.js`

**Interfaces:**
- Produces:
  - `xLeafMerger(name='leaf-clumps')`. Its `build()` uses `envArtFx(name)`, and the texture cache `XLEAF_TEX` becomes a Map keyed by name. Existing callers are unchanged.
  - `xGrassCards(F, x, z, size, R) -> boolean`: two crossed upright cards with the `grass-dungeon` tile. Their common bottom pivot sits at the atlas pivot `(0.4633, 0.8102)` from the top. They get random yaw, are mirrored half the time, and have normals up-leaning (`normalize(face + up*1.5)`). The tint is white times 0.9 to 1.05. Returns false if the tile isn't ready.
  - Nature card kinds:
    - `vineB`, `vineF`, `vineW`: one plane, pivot at the top (`atlas_pivot_top_origin` from `foliage-alts.json`: broad `.5175,.0903`, fine `.5124,.0903`, weathered `.5226,.0903`), facing out of the wall.
    - `grass`: the crossed pair, bottom pivot.

    They use `xNatMat` with a `map` from `envArtFx`, `alphaTest:.5`, DoubleSide, `userData.noProj=1`, and neutral instance colours: white times dim times 0.85 to 1.15, not the old green.

- [ ] **Step 1: Write the failing check `foliageCards`.**
  - Depth 1 (Hollows): there's an instanced mesh of kind `vineB`, one of `vineF`, and one of `grass`.
  - Depth 18 (Ruins, world seed 4260): `vineW`, `grass`, and the root strips still as `vine`.
  - In an Overgrown room, the reeds' merged mesh uses the `grass-dungeon` texture.
  - Rebuilding the same floor gives the same instance count per kind.
  - With the effects sheet blocked, the old `vine` and `tuft` kinds come back.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement the vines.**
  - The variant per wall comes from a stream of its own, `caveRng(seed+2909)`: every third wall face in turn takes fine, and the rest take the area's main vine.
  - Each vine draw still consumes the same `R()` calls as now. Of the old 3 to 6 strips per face, keep the ones with even `k`, so there are 2 or 3 cards.
  - Card height is `L*1.15`: the strand fills 224 of the 256 rows. Width equals height. The card sits 0.05 off the face.
  - `xNatShow`'s `vine` case applies to the card kinds too: the same top, hidden on low walls, `h=min(p.h, top-.3)`. Scale is `(h,h,1)`.
- [ ] **Step 4: Implement the grass.**
  - The Ruins `tuft` keeps its draws. Keep the even `k`, as cards sized `h*1.9`, so they come out about 0.4 to 0.95 tall: low tufts.
  - The Hollows `XKIT` gains `tuft:{col:['#ffffff'], n:.18}`: low tufts at wall feet, cards only (no cone fallback in the Hollows; with no art they're just skipped).
  - The Overgrown `'reeds'` case keeps its 9 draws per piece. Every third one becomes `xGrassCards(F, px, pz, .55+h*.35, R)`, and the cones remain only as the fallback.
- [ ] **Step 5: Run the check.** Expected: PASS.
- [ ] **Step 6: Commit.** "Foliage: painted vine and grass cards for the creepers, tufts and reeds."

### Task 7: Mushroom cards between rocks, at wall feet and on walls

**Files:**
- Create: `game/mushrooms.js` (script tag after `mold.js`)
- Modify: `game/envart.js` (`envArtFxGlow`)
- Modify: `game/nature.js` (the piece loop: new kinds; `xNatMat`, `xNatShow`)
- Test: `tools/playtest/art-check.js`

**Interfaces:**
- Consumes: `ENVART_MAP.mush`, `envArtFx`, and `xNatMat`'s card material (Task 6).
- Produces:
  - `XMUSH = { area:{hollows:['lantern-bells','pinlight-colony','moss-puffballs','split-sage-caps','glow'], deeps:['ivory-bonnets','pinlight-colony'], vault:['violet-waves','coral-fingers'], rifts:['copper-cups','amber-buttons'], ruins:['amber-buttons','split-sage-caps','copper-cups'], abyss:['black-trumpets','violet-waves']}, bracket:['shelf-fans','oyster-rosette'], noBracket:['rifts'], fungusAll:true, perRoom:[2,3], size:{tiny:[.12,.2,.25], small:[.25,.42,.6], knee:[.55,.75,.15]} }`.
    - Short names map to `cave20-mushroom-<name>`. `glow` is the foliage pack's `mushrooms-glow`.
    - `size` entries are `[min, max, weight]`, card height in world units. The hero is about 1.7 tall, so "small" is about a quarter of the hero.
    - The Rifts' amber buttons are drawn at half rate.
  - `xMushPick(room, seed) -> string[]`: the room's 2 or 3 kinds from its area's list. A Fungus room gets the area's whole floor list. It's stable, from `caveRng(seed*53+room.id*131+6007)`.
  - `xMushSize(R) -> number`: a height drawn from `XMUSH.size` by weight.
  - Nature kinds:
    - `mush:<name>` (upright): two crossed cards on the bottom pivot, the same geometry builder as `grass`. Mirrored by flipping `u`, with pivot `u=1-u`.
    - `bracket:<name>`: one card flat against the face, centre pivot, 0.03 off the surface, tilted 10 to 20 degrees down so the shelf juts out.
  - Card materials for kinds with glow set `emissive` to the JSON colour times `k`, and `emissiveMap` from `envArtFxGlow(name)`. Tinting stays neutral.

**Placement** (its own stream, `caveRng(seed+3313)`, so existing dressing doesn't move):
- **Between rocks.** Each nature `rock` or `block` piece, and each clutter `boulder` or `bigrock` piece, has a chance of 0.35 in damp cells (mold map damp above 0.4), and 0.12 elsewhere. On success it adds 1 to 3 clusters within 0.5 of the rock's edge, on the floor side.
- **Wall feet.** In rooms whose picks are non-empty, each wall face adds a cluster with chance 0.10, or 0.35 in Fungus rooms, set 0.1 to 0.3 off the face.
- **On walls.** Bracket kinds, outside the Rifts, add a 2-to-4 card patch with chance 0.06, or 0.2 in damp rooms, at 0.4 to 1.4 up the face. It belongs to the wall block, so it follows the wall's height and hides on low walls, like vines.
- **Caps.** A per-room cap of 12 clusters (30 in Fungus rooms). Never in the puzzle room, on stairs or in doorways (reuse `floorOK` and `pz`).

- [ ] **Step 1: Write the failing checks.**
  - `mushPlacement`:
    - Depth 1 (Hollows), world seed 11, has at least 4 `mush:*` instances, all of kinds in the Hollows list.
    - Each lies within 0.6 of a rock, a wall face or a log.
    - A rebuild gives identical positions.
    - The Rifts (depth 14) have no `bracket:*`.
  - `mushGlow`: a `mush:lantern-bells` material has an `emissiveMap`, and its emissive colour equals `#8FE4DA` times 0.35. A `mush:ivory-bonnets` material has none.
  - `mushFallback`: with the effects sheet blocked, no mushroom kinds are made and there are no errors.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement `mushrooms.js` and `envArtFxGlow`, and wire the kinds into `xNature`.**
- [ ] **Step 4: Run the checks.** Expected: PASS.
- [ ] **Step 5: Commit.** "Mushrooms: painted clusters between rocks, at wall feet and on walls."

### Task 8: Fallen logs, and bracket mushrooms on wood

**Files:**
- Modify: `game/dungeongen.js` (`XTHEMES` kits; `xClutterThemed` new case `'log'`; sapling trunks)
- Modify: `game/explore.js` (`xFurnish`: crates, barrels, shelves, racks, tables in damp rooms)
- Modify: `game/nature.js` (Hollows caves: a log now and then along a wall)
- Test: `tools/playtest/art-check.js`

**Interfaces:**
- Consumes: `XMUSH.bracket`, `xMushSize` (Task 7), and `xLeafMerger(name)` (Task 6).
- Produces:
  - `'log'` clutter: one cell, solid, lying along `it.v`.
    - A trunk cylinder 0.5 to 0.65 across, `XCS*1.6` long, in dark wood `#4a3420`, with lighter cut ends `#7a5a3a` and moss bands (`LEAF2`, 2 to 3 thin flattened balls).
    - On it, 2 to 5 bracket cards from `XMUSH.bracket` on its sides and ends.
    - Its footprint shape is the same as the `column` piece (`SH.column`).
  - `xBracketCards(F_by_name, x, y, z, nx, nz, R) -> void`: a 2-to-4 card patch facing `(nx, nz)`. `F_by_name` is a map from kind name to a `xLeafMerger(name)`, so each kind is one draw call per room.

- [ ] **Step 1: Write the failing check `logsAndWood`.**
  - On a floor with an Overgrown room (pin a seed found by a quick seed loop at depths 1 to 4), that room has a `'log'` clutter item, and its room group has a mesh using a `cave20-mushroom-shelf-fans` or `oyster-rosette` texture.
  - A damp room's crate or barrel has a bracket card within 0.1 of its side, in at least one of the seeds 1 to 20.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add `'log'` to the Overgrown, Collapsed and Fungus `kit` lists in `XTHEMES`, at the same weight as one existing entry, and to `XWALK_K` exclusions as a blocker.
  - In Hollows caves, nature adds a log along a wall foot with chance 0.04 per face, on its own stream.
  - In damp rooms (theme flooded, bathhouse, crypt, fungus, overgrown or collapsed, or mold-map damp above 0.5), `xFurnish` wooden pieces get a bracket patch with chance 0.3 on a side facing away from the wall.
  - Sapling trunks get a bracket patch with chance 0.4, at 0.3 to 1.0 up.
  - The puzzle solvers and walkability must not change: logs block like any other one-cell clutter, so rerun the floor check (Step 4).
- [ ] **Step 4: Run the check, then rerun the 400-floor reachability check** (`scratchpad/floorcheck.js`, first 100 floors). Expected: PASS, with no lost rooms or stranded items. Logs are clutter, which the clutter placer already keeps off paths.
- [ ] **Step 5: Commit.** "Fallen logs, and bracket mushrooms on wood."

### Task 9: Pictures, tuning, and documents

**Files:**
- Modify: `docs/status.md` (Recent changes; the plan section), `docs/art-production/foliage-cards.md` (vines and grass done, moss and mushrooms pending, with glow agreed)
- Tuning only in `XMOLD` and `XLIT_DEF` values; no new code

- [ ] **Step 1: Take the picture set** at deviceScaleFactor 2 and the default camera, one per area:
  - Hollows: depth 1, world seed 11;
  - Deeps: 6;
  - Vault: 10;
  - Rifts: 14, with a charcoal room;
  - Ruins: 18, world seed 4260;
  - Abyss: 22;
  plus one flooded room, one library room (must be clean) and one battle.

  Add a Fungus room close-up, a log with bracket mushrooms, a wall with shelf fans, and mushrooms between rocks.

  Make a before/after pair for the Hollows and the Ruins.
- [ ] **Step 2: Check the mushroom scale** against the hero in the close-ups: most clusters at about a quarter of the hero's height. Adjust only the `XMUSH.size` ranges.
- [ ] **Step 3: Tune against the agreed strength** ("noticeable but restrained: most floor clean stone"), using only the `XMOLD` levels and the default `moldAmt`. Measure coverage on the depth-1 picture's floor. The target is 15 to 30% of floor pixels with any mold, at most 10% dense.
- [ ] **Step 4: Run the whole check script.** `node tools/playtest/art-check.js` must print PASS for every check.
- [ ] **Step 5: Update the documents.**
- [ ] **Step 6: Commit, push, and send the pictures.**

---

## Deferred, as agreed

- The glowing moss (foliage pack). The art is in the repository and glow everywhere was agreed, but its placement waits for a later pass.
- The big `bigcap` and `caps` mushroom geometry stays as it is, as the mushroom guide asks.
- Mold on props and clutter.
- The battle arena still uses the code-painted floor and wall textures, not the painted atlas. The mold works on both; moving the arena to the painted art is a separate choice for you.
