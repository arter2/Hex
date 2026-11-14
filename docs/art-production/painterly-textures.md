# Claude: integrate the Hexmancers painterly texture pack

## Task and package contents

Integrate the **68 final 512 x 512 PNGs** in this ZIP into the existing Hexmancers dungeon renderer. The art and material edits are final for this handoff; preserve their colors, shapes, transparency and filenames. This ZIP contains assets and implementation instructions, not an installed code change.

Read this file first, then **INSTRUCTIONS.md** for material settings and the independent rock-layer shader examples. **asset-map.json** gives every source file, proposed repository destination, browser URL, role, binding, color-data interpretation, normal companion and checksum. **asset-checks.csv** supplies the original file integrity checks. Preview JPGs are review images, not game textures.

## Verified project layout and placement

The current `arter2/Hex` default branch was inspected on 2026-11-13. The game now lives under `game/`; the entry point is **game/index.html**. Create the following new asset directory under the existing `game/art/` directory:

| ZIP item | Put it in the repository at |
| --- | --- |
| Contents of `textures/` | `game/art/environment/painterly-512/`, preserving all category subfolders |
| `asset-map.json` | `game/art/environment/painterly-512/asset-map.json` |
| `CLAUDE_INTEGRATION.md` | `docs/art-production/painterly-textures.md` |
| `INSTRUCTIONS.md` | `docs/art-production/painterly-material-settings.md` |
| Preview sheets and checks | Keep with the art handoff; optionally under `docs/art-production/painterly-textures/` |

Example: ZIP `textures/area-floors/vault-room-a.png` becomes repository `game/art/environment/painterly-512/area-floors/vault-room-a.png`. From `game/index.html`, load it with `./art/environment/painterly-512/area-floors/vault-room-a.png`. Do not add another `textures/` level to that destination. The new destination is a proposed directory to create, not an already installed asset location.

## Existing code to extend

| Existing file | Verified integration points |
| --- | --- |
| `game/world.js` | `AREAS` and `A.id`: `hollows`, `deeps`, `vault`, `rifts`, `ruins`, `abyss` |
| `game/nature.js` | `xAreaFloors`, `XAREA_FLOOR_KEEP`, `xThemeFloor`, `XTHEME_FLOOR_CACHE`, `xNatSurface`, `xNatPools`, `xNatureTick` |
| `game/explore.js` | `xBuildScene` floor/wall material arrays; `xGlowTex`; `xRuneTex`; `xTrimTex`; wall ghost/cutaway material construction |
| `game/look.js` | `xTex`, `xLitTag`, `xLitDefines`, `xDetailN`, `xDetShader`, `xBombShader`, `xPhong` |
| `game/surface.js` | Existing projection hooks for other untextured objects; preserve these |
| `game/index.html` | Include any new loader module in the current script/loading order |

Use function names to locate code rather than relying on line numbers. Recheck the current checkout before editing. The inspected blob SHAs are in `asset-map.json`.

### Load the images before building materials

Add a small asset loader/cache, for example `game/environment-art.js`, using the project's current script style. The existing texture factories and `xBuildScene` are synchronous. Preload/decode the required current-area and room-theme PNGs before that scene is built, then supply ready images or 512 x 512 canvases. Do not return Promises from `xAreaFloors` or `xThemeFloor`.

Retain the procedural factories as load-failure fallbacks. Cache decoded images separately from per-scene GPU texture objects. Existing scene teardown disposes maps and normals; either keep explicit shared ownership/ref-counting or recreate per-scene GPU wrappers from retained decoded images. Preserve pool animation's independently mutable texture offsets.

Do not run the finished PNGs through `xTone` or repaint them with the old procedural palette. Start material tint at neutral white; keep intentional scene lighting, fog and AO. In particular, the reference-matched stacked wall is tan/brown/gray/olive and must not receive the old purple texture recoloring.

## Area floors and walls: exact slot mapping

For each `A.id`, the floor array order is **passage, room A, room B**. `xBuildScene` uses these indices, so preserve that order:

| Index | File under the new asset directory | Role |
| --- | --- | --- |
| 0 | `area-floors/<area>-passage.png` | Corridors/passages |
| 1 | `area-floors/<area>-room-a.png` | Room style 0 |
| 2 | `area-floors/<area>-room-b.png` | Room style 1 |

All six area IDs have all three files. Keep the existing world-space floor UVs (`texCells = 8` in the inspected scene builder); increasing resolution does not mean increasing repeat density or stretching each PNG over one cell.

The wall texture array order is:

| Index | File | Existing producer to replace at the area-aware call site |
| --- | --- | --- |
| 0 | `area-walls/<area>-rock-wall.png` | `xRockWall(S, seed + 4)` |
| 1 | `area-walls/<area>-block-wall.png` | `xBlockWall(S, seed + 5, false)` |
| 2 | `area-walls/<area>-rubble-wall.png` | `xBlockWall(S, seed + 6, true)` |

These factories currently receive `S`, not `A`; select the PNGs in the area-aware scene builder, or add an area-aware adapter. Keep `XROCKTEX = wallTex[0]` and the existing `xWT(v)` routing. Preserve instancing, fog, wall geometry, AO, dither/cutaway shaders and ghost walls. Do not globally replace every rock-producing function with one area's texture.

## Theme floors and normal companions

Bind these exact theme/area pairs through `xThemeFloor(th, A, S)`. Other area/theme combinations retain their procedural fallback unless the game intentionally reuses a supplied variant. A Temple has no dedicated replacement in this pack.

| `th` | `A.id` | Color PNG under `theme-floors/` |
| --- | --- | --- |
| `armory` | `vault` | `armory-vault.png` |
| `flooded` | `deeps` | `flooded-deeps.png` |
| `overgrown` | `hollows` | `overgrown-hollows.png` |
| `collapsed` | `rifts` | `collapsed-rifts.png` |
| `library` | `ruins` | `library-ruins.png` |
| `crypt` | `abyss` | `crypt-abyss.png` |
| `forge` | `rifts` | `forge-rifts.png` |
| `bathhouse` | `ruins` | `bathhouse-ruins.png` |
| `barracks` | `vault` | `barracks-vault.png` |
| `fungus` | `hollows` | `fungus-grove-hollows.png` |

The real theme key is **`fungus`**, not `fungus-grove`. Each listed color has the same stem plus `-normal.png` under `theme-normals/`.

### Preserve the new ornate library floor

The old library generator sets `c.bomb = 8` and `c.paint = 1`. Its shader assumes the old basket-weave cells. The replacement art has framed chevron parquet panels. Start the imported library canvas with **bombing disabled** and **procedural painted-vertex modulation disabled**, while retaining normal scene lighting/AO. Do not apply the old eight-cell random quarter-turn shader; it can cut the new frames and inlays apart. Add pattern-aware variation only after checking the actual new panel layout.

### Connect the supplied normals to the lighting pipeline

The current `xLitTag` only attaches normals when `cv.h` exists, and `xLitDefines` later assigns `material.normalMap` from `material.userData.nmap`. Support an imported normal canvas/image explicitly (for example `cv.nm`) even when there is no procedural height field. Set the normal through the existing `userData.nmap` path so the normal toggle, strength controls and material cleanup continue to work. Do not attach old procedural cross shapes or weave height fields to the new marble runes or library parquet.

There are ten theme normals and one shared detail normal. Individual area-floor/wall normals, height maps, roughness maps and metalness maps are not included. Use restrained shared relief or a flat normal for those materials; do not invent a matching companion filename. The visible copper/gold is painted color; physical metalness separation requires shader logic or an additional artist-authored mask.

## Shared effects and detail layers

| File under `shared-effects/` | Use and hook |
| --- | --- |
| `detail-normal.png` | Shared fine normal relief: replace the generated source in `look.js` `xDetailN`, retaining repeat and world-space sampling |
| `glow-hole.png` | Neutral white glow for `explore.js` `xGlowTex`; retain per-emitter tint and existing blend modes |
| `rune-circle.png` | Stair-floor ring for `xRuneTex`; preserve its centered padding and placement |
| `lantern-fx-glow.png` | Optional warm amber emitter variant; do not replace the neutral glow globally, because key lanterns and particles have their own colors |
| `water-ripples.png` | Sparse quiet-puddle reflection overlay for water/flooded surfaces; add a dedicated surface-overlay hook and strength control |
| `pool-surface-water.png` | `nature.js` `xNatSurface('water')` detail layer |
| `pool-surface-ice.png` | `xNatSurface('ice')` detail layer |
| `pool-surface-lava.png` | `xNatSurface('lava')` crust detail layer |
| `pool-surface-black.png` | `xNatSurface('black')` subtle surface detail |
| `trim-fx-ruins.png` | Ruins-specific decorative strip for the `xTrimTex`/`xFloorTrim` path; other areas keep their own trim |

The water-ripple asset is **not** the searched-tile animation. `xWaveTex` in the inspected `explore.js` draws the search-wave tile and must remain separate.

### Transparent pool details need a solid pool body

The current `xNatSurface` paints an opaque white canvas, then `xNatPools` applies the pool's tint and a separate blob-shaped alpha mask. The new pool PNGs contain real transparent gaps. Composite the PNG detail over an opaque neutral base canvas before supplying that surface map, **or** keep an opaque/tinted pool body and add the detail in a separate shader layer. Preserve the existing blob mask and animation. Do not make the pool body disappear wherever the detail PNG is transparent.

Keep ice static, retain the current `xNatureTick` scrolling behavior for the other kinds, and keep lava's existing emissive/tint treatment. Use the quiet-puddle layer at a low additional strength; it is deliberately faint.

For the trim, use the source's occupied vertical alpha band or crop that band to an in-memory strip canvas. Preserve the full production PNG on disk. Keep glow/rune sprite margins; do not apply trim-style cropping to them.

## Independent rock layers: keep both separate

- **Linear grayscale noise:** `shared-detail/deeps-rock-cell-noise.png`, for optional finer cellular color/roughness breakup on the icy rock material. This is independent noise, not a pixel-registered painted-rock mask and not a normal map.
- **RGBA medium rocks:** `shared-overlays/rifts-medium-rock-overlay.png`, sampled over the **Rifts rough rock wall** `area-walls/rifts-rock-wall.png`. This supplies colored rocks and coverage, not replacement base art.

Use one to three independently offset samples of the medium-rock sheet inside the existing **opaque wall shader**, blending only `diffuseColor.rgb` with each sample's alpha. Do not set the entire wall transparent or use the sheet as the wall's global alpha map. Attach the same overlay behavior to solid and ghost/cutaway material variants.

Reuse the wall's continuous world/projection coordinates and chain the existing `onBeforeCompile` hooks and program cache key; do not replace the current lighting, dither or normal shader modifications. Decode custom color samples consistently with the base map. Default to offset/scale changes so the painted highlight direction remains coherent. See **INSTRUCTIONS.md**, “Separate medium-rock shader layer,” for the exact 1/2/3-pass example, strengths, offsets and filtering notes. The preview `previews/rifts-layering.jpg` shows the intended layering.

## Color, filtering and implementation checks

Use repeat wrapping for tiled materials and detail layers; centered effect sprites may use clamp addressing. Color PNGs are sRGB art, while normal/noise data and alpha weights are linear. The normals use OpenGL / +Y. Use the bundled Three.js API supported by the checkout rather than assuming newer `colorSpace` properties exist. Keep normal maps and associated colors aligned in UVs, repeat, flip orientation and any later texture transforms.

For this painterly set, start with linear magnification and mipmapped minification where appropriate; assess the existing texel/posterization controls instead of automatically forcing the old nearest/pixel-art presentation. Keep the smallest-device graphics path working.

Verify in the running game:

1. All 68 paths match `asset-map.json`; no 404s, duplicates, missing normals or preview images used as textures.
2. All six areas show passage plus both room floor styles and all three wall variants. Theme overrides select the exact pair listed above.
3. The library has intact parquet frames; the marble has abstract runes; jade stays dark with copper seams and tiny white flecks; the reference wall retains earth colors.
4. Pools retain their solid bodies and masks, while highlights are transparent; the search-wave visual is unchanged.
5. Rock overlays remain independent, show correct medium scale at different pass counts, and leave the wall opaque.
6. Repeats look continuous across cell/chunk boundaries; normals, lighting toggle, AO, fog, wall cutaways and ghost materials still work.
7. Moving between floors/areas and rebuilding the scene does not accumulate textures or reuse disposed GPU resources. Check phone portrait/landscape and low graphics.

Report the code files changed, the mappings installed, and actual runtime validation. Do not call the integration complete from a file-copy check alone.
