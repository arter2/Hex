# Claude: mold pack — part 2 of 2

This ZIP contains options **06, 07, 08, 09, 10, 16, 17, 18, 19, 20**, with five dense/sparse color pairs. Both resolutions, matching alphas and repeat previews are included for every option.

The companion ZIP is `hexmancers-mold-part-1.zip`. Extract both into the same folder to combine all 20 options. Production filenames are unique across the two ZIPs. Metadata and guide filenames are also unique. Read both part manifests when using the full set.

## Dense/sparse pairing

| Dense option | Sparse option | Pattern | Sparse mold coverage |
| --- | --- | --- | --- |
| 06 | 16 | Ochre spore mold | 4.2% |
| 07 | 17 | Ivory mycelium | 4.2% |
| 08 | 18 | Charcoal blight | 4.1% |
| 09 | 19 | Dusty rose mildew | 7.3% |
| 10 | 20 | Mint patina mold | 5.2% |

Coverage is measured at alpha >= 0.5 on the 1024 px tile; antialiased edge pixels add a narrow fringe. Each sparse color uses its own matching alpha. Use the same moldAmount when comparing dense and sparse options.

## Dense options included here

| Option | Stable ID | Color/material character |
| --- | --- | --- |
| 06 | `ochre-spores` | Ochre spore mold |
| 07 | `ivory-mycelium` | Ivory mycelium |
| 08 | `charcoal-blight` | Charcoal blight |
| 09 | `dusty-rose-mildew` | Dusty rose mildew |
| 10 | `mint-patina-mold` | Mint patina mold |

Options 01–10 are the original dense patterns. Options 11–20 are their sparse counterparts, with separately painted small colonies, opaque interiors and broad transparent gaps. Select the density and color deliberately; reducing a dense texture's opacity does not create the sparse spacing. Choose a stable option by room or surface. Use natural variation in scale and coverage so one conspicuous colony does not repeat at the same size everywhere. Keep the painted palette muted; start with a neutral tint.

## Files

| Folder | Contents |
| --- | --- |
| `textures-1024/` | 1024 × 1024 RGBA master tiles, with real transparency |
| `alphas-1024/` | Matching 1024 × 1024 grayscale alphas |
| `textures-512/` | 512 × 512 RGBA runtime tiles |
| `alphas-512/` | Matching 512 × 512 grayscale alphas |
| `previews/options-part-2.jpg` | Numbered colors included in this ZIP |
| `previews/alphas-part-2.jpg` | Matching alpha comparison |
| `previews/repeats/` | Each pattern shown repeated 3 × 3 for seam review |
| `mold-variants-part-2.json` | Exact file pairing, dimensions, IDs, repeat settings and seam metrics |
| `asset-checks-part-2.json`, `SHA256SUMS-PART-2.txt` | PNG/alpha checks and checksums |
| `generation-prompts-part-2.json` | Final ImageGen prompt set and generation method |

Every separate alpha matches the embedded A channel of its paired color PNG exactly. White/255 means mold; black/0 means the underlying surface shows through. Narrow antialiased edge coverage is retained. Use the same resolution for color and alpha. These are not height or normal maps.

The final tiles wrap painted colonies across opposing borders. They include periodic filtering/downsampling and RGB color padding under nearby clear pixels. The transparent regions remain real alpha, not a painted black background. All images use power-of-two dimensions.

## Suggested source placement

Keep these separate from `leaves.png`, tree `leaf-clumps`, upright grass and small mushroom cards:

```text
game/art/environment/painterly-512/shared-mold/1024/
game/art/environment/painterly-512/shared-mold/512/
```

Put matching grayscale source masks alongside their color images or under an `alphas/` subfolder. Select the file pair via `mold-variants-part-2.json`. Exact numbered filenames are stable throughout the package.

## Blend over the dungeon surface

The default use is a second material layer on the existing wall/floor/cave material. Keep the underlying stone/wood visible through the holes; do not replace the entire material with the mold texture.

Color is **sRGB**, alpha is **linear data**. The RGBA texture already supplies its own mask, so a second alpha texture is optional. If using the grayscale file, sample its red channel with the same UV coordinates and transform as the color.

Conceptual shader logic:

```glsl
vec2 moldUV = surfaceUV * moldTiling + moldOffset;
vec4 mold = texture(moldColor, moldUV);
float mask = mold.a; // or texture(moldAlpha, moldUV).r
float coverage = clamp(mask * moldAmount * areaMask, 0.0, 1.0);
baseColor = mix(baseColor, mold.rgb * moldTint, coverage);
```

This is pseudocode, not a patch against the current renderer. Implement it in the actual wall/floor material path after inspecting the checkout. The mold is ordinary shaded material, not emissive. Roughness/normal variation is optional authored shader treatment; no physically measured PBR maps are claimed by this pack.

Set **both texture axes to RepeatWrapping** with normal linear filtering/mips as supported. Do not clamp the texture or inset its UVs as if it were a leaf card. Rotate by quarter turns, mirror or offset the UVs for variety. Apply the same UV transform to any separately sampled alpha.

For a hard cutout overlay, alpha testing around 0.5 is a useful start. For material blending, use the full alpha coverage above. Avoid enabling transparent blending on an entire opaque dungeon wall merely to layer mold.

A separate decal/conforming overlay plane is an alternative. Keep it close to the receiving surface with depth handling appropriate to the engine; avoid z-fighting, visible rectangle boundaries and excessive stacked transparency. Only such an independent overlay mesh may need the earlier foliage material's `noProj` behavior to prevent the projected atlas overwriting this art. **Do not disable the existing stone/wood material projection on the base wall/floor.**

## Atlas considerations

Standalone repeat-wrapped textures are the simplest safe route. If the current renderer requires these in an atlas, repeating the whole atlas will sample unrelated tiles. Add local wrapping in the mold UV domain, then map into the specific atlas rectangle, with wrapping-aware gutters and mip handling:

```glsl
vec2 localUV = fract(moldUV);
vec2 atlasUV = moldRect.xy + localUV * moldRect.zw;
```

That formula describes the mapping only; derivative/mip discontinuities at `fract` require explicit gradients or equivalent engine support. Keep mask and color layouts aligned. Do not put these through `leaf_clumps()`, its circular cutout or four-quadrant selector.

## Natural variation and repetition

- Store a chosen mold ID or derive it from a stable room/surface seed.
- Vary UV scale between surfaces. Fine powder/mycelium can use a smaller apparent growth scale than crusty colonies.
- Use a room/vertex/world mask for damp corners, mortar joints and worn areas rather than covering every surface uniformly. Start with a sparse tile for light contamination and use the dense counterpart locally for heavy growth.
- For a larger wall, mix two selected patterns at different tiling scales and offsets, with restrained coverage. Use only a few selected patterns on a surface.
- Preserve the underlying surface's shading, fog and cutaway behavior.

Do not copy the 3 × 3 preview into a material; it is proof imagery only. Repeat the actual one-tile RGBA/alpha pair.

## Validation

Check the repeated previews and an in-game wall/floor at actual runtime resolution. Confirm no straight seam, colored fringe, baked checkerboard, opaque black backing, atlas bleed or mismatched alpha transform. Test the darkest charcoal option against a lit surface as well as a dark cave. Verify loading fallback and that variant choices stay stable across rebuilds.

The package contains art and integration notes only. Claude still needs to implement and test the current project's material overlay path.

