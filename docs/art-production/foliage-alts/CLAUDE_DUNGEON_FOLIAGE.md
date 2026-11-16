# Claude: painterly dungeon foliage alternatives

This is a texture-only handoff for Hexmancers, based on `reference/foliage-cards-original.md`. It includes six individual painterly cutouts, separate alpha masks, atlas-ready tiles, and optional glow masks. No game code or runtime atlas has been changed.

The original reference describes existing code; this handoff adds the small decorative mushrooms requested afterward. The cattail and wheat/dry-reed designs were rejected for the dungeon. Use the low grass, glowing moss and small mushrooms below instead. The three hanging-vine alternatives remain in the set.

## What each alternative does

| ID / new `envArtFx` name | Subject | Placement and selection |
| --- | --- | --- |
| `vine-broad` | Broad leafy ivy | Default lush wall vine; top attachment |
| `vine-fine` | Fine leaves and open tendrils | Sparser alternative to broad ivy; top attachment |
| `vine-weathered` | Woody stem and aged olive leaves | Less lush ruins alternative; top attachment |
| `grass-dungeon` | Low irregular wild grass, without crop seed heads | Small upright tuft in floor cracks or damp corners; bottom attachment |
| `moss-glow` | Ragged moss cushions with a few pale luminous tips | Nearly flat floor/boulder/wall patch; center attachment |
| `mushrooms-glow` | Five small blue-gray mushrooms with luminous rims | Small upright floor cluster; bottom attachment |

The three vines are interchangeable visual alternatives. Choose a stable vine ID per room or patch rather than stacking all three on every strand. Grass, moss and mushrooms are different dressing types with different orientations; select them by location and use modest mixtures where appropriate. They do not all use the same placement function.

Keep these plants small in the dungeon. Grass should read as low tufts, moss should hug a surface, and mushrooms should read as tiny floor fungi rather than oversized trees. Start mushroom clusters around half a grass tuft's visible height, then review against the game's character scale.

The existing sapling system continues using `shared-foliage/leaves.png` and `leaf-clumps`. These cards do not replace that sheet. The new small mushroom cluster is separate decorative art; leave existing `bigcap` / `caps` walk pieces alone.

## Files and destinations

| ZIP folder/file | Contents | Suggested repository destination |
| --- | --- | --- |
| `masters/<id>.png` | RGBA source; vines 512 x 1024, other plants 512 x 512 | `game/art/environment/painterly-512/shared-foliage/cards/<id>.png` |
| `masks/<id>-mask.png` | Exact master alpha as grayscale, 0/255 | Source art beside the masters; not a required extra runtime texture |
| `atlas-tiles/<id>.png` | One complete plant in a 256 x 256 RGBA tile | `game/art/environment/painterly-512/shared-foliage/card-tiles/<id>.png` |
| `emission-masks/<id>-emission.png` | Grayscale glow weights at master resolution, for moss and mushrooms | Source art beside the corresponding master |
| `emission-masks/<id>-emission-atlas.png` | Same glow weights aligned to the 256 x 256 color tile | Emission source for a matching-layout atlas or standalone material |
| `foliage-alts.json` | Exact dimensions, paths, pivots, aspect and orientations | Source/build metadata |
| `previews/` | Labeled master and actual 256 px comparisons | Review only; backgrounds are not production textures |
| `asset-checks.json` | PNG dimensions, binary alpha checks and SHA-256 hashes | Handoff verification |
| `generation-prompts.json` | Final prompt set; generated with built-in ImageGen | Art provenance/reproduction reference |

All color PNGs contain real cutout alpha: solid painted foliage at 255, clear gaps at 0. Each outer border is transparent. RGB is carried under nearby transparent edge pixels to avoid colored filtering fringes. The separate alpha mask matches its master exactly. Do not key out green or bake the preview checkerboard into a texture.

## Add the color atlas entries

Use the supplied source guide's atlas hooks after checking the current checkout:

1. Add a single-card loader/cutter next to `leaf_clumps()` in `tools/build-env-atlas.py`.
2. Append each supplied `atlas-tiles/<id>.png` to `fx` under the same ID. Each is already a complete 256 x 256 tile with cutout alpha and edge color padding.
3. Run `python3 tools/build-env-atlas.py` to rebuild the effects sheet and `game/envartmap.js`.
4. Resolve the base-color tile with `envArtFx('<id>')`.

**Each supplied tile contains one full plant, not four animation frames or four leaf clumps.** Do not apply the round `leaf_clumps()` mask, split it into quadrants, or use the leaf-ball helper's random 2 x 2 clump selection. Keep the existing `leaf-clumps` entry and its tree users unchanged.

If rebuilding from a master, resize the entire master, including its transparent margin, to the inner rectangle below. Threshold the resized alpha, then pad RGB beneath transparent edges. The supplied masters use threshold 128/255; atlas tiles use 96/255 during downsampling to preserve fine stems, then return to binary alpha. The material still uses `alphaTest: 0.5`.

| Family | Master dimensions | Region inside 256 px tile, x/y/width/height |
| --- | --- | --- |
| Vines | 512 x 1024 | `72, 16, 112, 224` |
| Grass, moss, mushrooms | 512 x 512 | `16, 16, 224, 224` |

## Card aspect and attachment pivots

Full-master geometry uses width/height 0.5 for vines and 1.0 for the other plants. **Full square atlas-tile geometry uses width/height 1.0 for every ID.** The vine's portrait aspect is already letterboxed inside its square tile; do not squeeze that full-tile quad to 0.5 again. Tighter UV cropping is possible only if the geometry aspect and pivot are transformed to match.

`foliage-alts.json` stores `master_pivot_top_origin` and `atlas_pivot_top_origin`. These are normalized coordinates with `(0,0)` at image top-left. Vines attach at the top stem, grass and mushrooms at their bottom roots, moss at the center. Use the pivot for the format actually sampled.

For a card with world-space right/up vectors, width `W`, height `H`, top-origin pivot `(u,v)`, and required attachment `anchor`, its center is:

```js
center = anchor
  + right * ((0.5 - u) * W)
  + up    * ((v - 0.5) * H);
```

This is placement pseudocode. For moss, the card's local right/up vectors lie along the receiving surface. Apply the atlas UV rectangle separately; the JSON pivots are local to the full tile, not the whole effects sheet.

## Placement by plant type

**Vines:** Use vertical wall-facing cards, top pivot at the crown or hanging attachment, normals out from the wall. Offset slightly to avoid z-fighting. Horizontal mirroring and a small lean vary the strand; keep the stem attached. Do not vertically flip it, rotate it sideways, or distribute it over a spherical canopy. The source guide points to `explore.js` (search `vine`). Retain the old strand fallback while its atlas entry is unavailable.

**Grass:** Use one or two crossed upright cards with a common bottom pivot. Add modest yaw/scale variation. For the old `xClutterThemed` `'reeds'` placement, review the location and use this grass as the new visual where appropriate. Preserve the existing cone fallback until art loads. Do not use leaf-ball normals or golden-sphere placement.

**Moss:** Use one patch or several scattered nearly flat cards facing up, with slight overlap and independent rotations. Follow the guide's ground-cover direction: normals up, small surface offset (its example is 0.02–0.08), and no more than about 20 degrees of tilt on level ground. Conform/align it to boulders or walls when used there. This is a top-view patch, so do not use it as a large upright bush. Keep the glow points sparse.

**Small mushrooms:** Use an upright card anchored at the bottom; a second crossed card is optional if side visibility needs it. Keep the cluster near the floor and vary scale/yaw modestly. Do not flatten the front-view mushroom image onto the ground. Use a dedicated small-fungus dressing path; this package does not authorize changes to large mushroom-cap geometry.

## Glow masks and materials

`moss-glow` and `mushrooms-glow` each include an emission-weight mask aligned exactly with their color image. Black means no emission; white means maximum emission. These are grayscale **linear data**, not opacity masks. Base color is sRGB. Preserve base alpha testing regardless of emission strength.

Start with a pale cyan-green emission color such as `#9AE8CF` and a restrained strength around 0.35, then tune against the game's exposure. These are starting suggestions, not engine-calibrated values. Emission keeps marked areas luminous; actual bloom or nearby light spill depends on the renderer. Do not turn the whole plant emissive or add one point light per patch.

For standalone textures, use the matching master or atlas-size color/mask pair with identical UVs. For the shared effects atlas, pack a **parallel emission atlas with exactly the same layout as the color atlas**: put these masks in their color tile slots and black in all other slots. Then both samples can use the same UV rectangle. Do not bind a differently packed mask atlas with unadjusted color UVs. The emitted contribution is `mask * emissionColor * strength`.

Verify whether the project's `xPhong` path supports an emissive map or add a small material adapter. The existing plain foliage material will not automatically consume these extra files. Retain `xDitherMat`, vertex colors, `alphaTest:.5`, `DoubleSide`, and **`material.userData.noProj = 1`**. Keep ordinary scene lighting/fog on the base color. Use alpha-aware mips/coverage preservation where supported.

Start with a neutral vertex tint so the painted palette survives. Use restrained area tint; a strong green multiply will erase the weathered-vine and blue-gray mushroom colors. Glow strength should be independent of the foliage tint.

## Alternatives, repetition and batching

Store a chosen variant ID or derive it from a stable room/patch seed. Rebuilding a room should not randomly swap its plants. Consuming the existing `R()` stream can move subsequent decorative placements, as the source guide explains.

Repeat these as separate plant instances with natural spacing, modest scale/yaw changes and suitable mirroring. Transparent outer edges prevent rectangular seams. They are not continuous stems to splice end-to-end or opaque seamless ground textures. Moss patches can overlap to break up repetition; keep upright plants rooted and vines attached.

Reuse the room/group ownership described for `xLeafMerger`, so plants show, hide and dispose with their clutter. Parameterize texture/card kind or add a placement adapter. One batch per selected variant is a straightforward approach; mixing many variants may add draw calls unless the batcher supports per-card atlas rectangles. Glowing plants may also need their own material batch. Do not assume six IDs can share one existing clump batch unchanged.

## Review before committing game changes

Inspect all six at the actual 256 px atlas resolution: fine stems remain readable, no bright green/yellow fringe, no straight card edges, correct pivots and aspect. Confirm low grass height, flat moss, small upright mushrooms, subtle isolated glow, `noProj`, lighting/fog/cutaways, stable seeded choices, room disposal and the loading/rebuild fallback (`envArtFx` / `envArtArrived`).

Use the guide's dense-foliage location (depth 18, seed 4260) where relevant, plus a vine wall and floor/boulder patch. Check the source before implementing; this ZIP supplies textures and instructions, not a completed game integration.
