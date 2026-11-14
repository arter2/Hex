# Claude: 12 painterly dungeon mushrooms

This is the mushroom-only subset of the 20-option cave-growth pack. It contains the same twelve source designs, with no changes to the texture pixels. This is an art handoff; game code and the runtime atlas have not been changed.

## Choices

| Option | Stable ID | Appearance | Placement | Glow masks |
| --- | --- | --- | --- | --- |
| 01 | `mushroom-lantern-bells` | Lantern bells | Upright floor cluster | Yes |
| 02 | `mushroom-amber-buttons` | Amber buttons | Upright floor cluster | Yes |
| 03 | `mushroom-ivory-bonnets` | Ivory bonnets | Upright floor cluster | No |
| 04 | `mushroom-violet-waves` | Violet waves | Upright floor cluster | Yes |
| 05 | `mushroom-shelf-fans` | Shelf fans | Wall | No |
| 06 | `mushroom-oyster-rosette` | Oyster rosette | Upright floor cluster | No |
| 07 | `mushroom-moss-puffballs` | Moss puffballs | Upright floor cluster | Yes |
| 08 | `mushroom-coral-fingers` | Coral fingers | Upright floor cluster | Yes |
| 09 | `mushroom-copper-cups` | Copper cups | Upright floor cluster | No |
| 10 | `mushroom-black-trumpets` | Black trumpets | Upright floor cluster | No |
| 11 | `mushroom-pinlight-colony` | Pinlight colony | Upright floor cluster | Yes |
| 12 | `mushroom-split-sage-caps` | Split sage caps | Upright floor cluster | Yes |

## Files

- `masters/`: 512 × 512 RGBA sources with genuine binary cutout alpha.
- `alpha-masks/`: exact master alpha as separate grayscale PNGs; white is solid, black is clear.
- `atlas-tiles/`: 256 × 256 RGBA tiles, one whole mushroom cluster per tile.
- `emission-masks/`: seven luminous designs have matching master- and tile-resolution glow-weight masks. These are optional linear grayscale data, separate from opacity.
- `mushroom-variants.json`: exact paths, atlas IDs, dimensions, orientations and attachment pivots.
- `previews/mushrooms-numbered.jpg`: all twelve choices, numbered consistently with the original cave pack.
- `asset-checks.json`, `SHA256SUMS.txt`: dimensions and original production-file checksums.
- `generation-prompts.json`: original prompts and built-in ImageGen provenance.

Only the mushroom designs are included. This ZIP can be used independently of the mold packs.

## Import and geometry

Suggested source destination: `game/art/environment/painterly-512/shared-foliage/cave-variants/`, with tile inputs under `card-tiles/`. Verify the current checkout before implementing.

The original project guide identifies `tools/build-env-atlas.py` and `envArtFx` as the atlas hooks. Add each supplied 256 px tile as a single effects entry using its JSON `envArtFx_name`. These retain the `cave20-` prefix from the original cave pack. Rebuild the atlas with `python3 tools/build-env-atlas.py` if using that pipeline.

Every tile is **one complete cluster**. Do not split it into four leaf-clump quadrants or apply a circular tree-clump mask. Keep existing sapling `leaf-clumps` and large `bigcap` / `caps` mushroom geometry separate from these small decorative fungi.

Both master and tile canvases are square; full-image card width/height is 1. The tile contains the whole 512 px source resized to 224 × 224 at `(16,16)`. Do not squeeze the image to the visible plant's bounding box without updating UVs, aspect and pivot.

Use `master_pivot_top_origin` or `atlas_pivot_top_origin` from the JSON for the image actually sampled. They are normalized coordinates measured from the top-left of that image, not the whole atlas. For card right/up vectors, width W, height H, pivot (u,v) and desired anchor:

```js
center = anchor
  + right * ((0.5 - u) * W)
  + up    * ((v - 0.5) * H);
```

Most options stand upright with their bottom/root pivot at floor level. Use a facing card or two crossed cards sharing the same root, modest yaw/scale variation, and small dungeon-dressing scale. Horizontal mirroring also needs `u = 1-u` for the pivot. Do not lay the front-view mushrooms flat on the ground.

Option 05, shelf fans, is wall growth. Use a wall-facing card with its center pivot at the intended wall patch and a small depth offset to avoid z-fighting. Its center is a placement pivot, not a modeled stem attachment.

## Alpha, lighting and glow

Color textures are sRGB. Alpha and emission masks are linear data. Embedded master alpha and the separate alpha file match exactly. Preserve cutout testing around 0.5 and the narrow painted silhouettes. RGB is padded beneath nearby clear pixels to protect filtering.

Follow the existing foliage material behavior: `xDitherMat`, vertex colors, `alphaTest:.5`, `DoubleSide`, and `material.userData.noProj = 1` on the independent foliage mesh. Retain room ownership/disposal, fog/cutaways and the art-loading fallback/rebuild behavior. Start with neutral tint so the painted blue, gray, violet, ivory and ochre palettes survive.

For luminous options, the emission mask means black = no emission and white = maximum. Start with the JSON color and strength around 0.35, then tune to the game's exposure. Use `mask * emissionColor * strength`; keep normal lighting on the base color. Emission does not itself light nearby stone, and bloom depends on the renderer.

Standalone color/mask pairs must use identical UVs. For a shared effects atlas, use a parallel emission atlas with exactly matching tile positions and black in nonluminous slots. Do not sample an independently packed mask atlas using unchanged color UVs. Verify or extend the current `xPhong` adapter to consume the extra map; copying files alone will not enable glow.

## Repetition and selection

These repeat as separate rooted/wall-mounted **instances** with transparent margins. They are not seamless opaque floor or wall material maps. Choose a stable ID by room/patch seed, vary scale and yaw modestly, and batch selected alternatives as supported by the current renderer. Loading all twelve into every room is unnecessary.

Review at actual 256 px atlas resolution: visible stems, clean masks, no colored fringe or rectangle edges, correct pivots and scale, restrained glow, stable selection, and correct room cleanup/loading fallback. Runtime integration still needs testing in the current project.
