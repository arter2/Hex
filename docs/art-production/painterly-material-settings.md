# Hexmancers texture implementation

All production texture PNGs are **512 x 512**. The current pack contains **68 individual textures**, including the two new independent detail layers. Use the PNGs in `textures/`; the JPGs are labeled review sheets with backgrounds applied for visibility.

## Current material edits

| File under `textures/` | Current treatment |
| --- | --- |
| `area-floors/vault-room-a.png` | Dark, desaturated emerald jade; restrained copper grout; tiny white mineral speckles confined to jade |
| `area-floors/ruins-room-b.png` | Dark recessed grout along the diamond lattice; gold intersection studs retained |
| `area-floors/deeps-room-a.png` | Varied rock sizes and finer irregular stone segmentation interrupt the broad icy strata |
| `area-walls/vault-rubble-wall.png` | Irregular dry-stacked slabs and deep gaps; reference-matched tan, brown, stone-gray and mossy olive colors |
| `theme-floors/library-ruins.png` | Ornate flush hardwood library parquet, framed chevron panels, inlay, scuffs and damaged boards |
| `theme-floors/crypt-abyss.png` | Dark marble with fine white veins and abstract carved runes |
| `theme-floors/flooded-deeps.png` | Teal tile faces and water details retained; medium cool-gray grout |
| `shared-effects/water-ripples.png` | Very quiet puddle reflections with sparse low-opacity marks and real alpha |
| `shared-detail/deeps-rock-cell-noise.png` | Independent grayscale cellular rock/brick breakup texture |
| `shared-overlays/rifts-medium-rock-overlay.png` | Independent warm brown medium-rock color layer with real alpha |

## Import settings

- Use repeat/wrap addressing on U and V. Texture boundaries have been checked on both axes.
- Color materials and colored overlays use sRGB color; alpha remains a linear blend weight.
- Normal maps and the grayscale noise texture are linear data; disable sRGB for these.
- The normal maps use OpenGL / +Y convention. Invert green when using a renderer that expects DirectX / -Y.
- Theme normal maps are approximate height-derived companions. The library, crypt and flooded theme normals were refreshed for their new surfaces.
- Preserve RGBA transparency for visual overlays. Checkerboard or dark-blue preview backgrounds are not part of the production PNGs.

## Separate medium-rock shader layer

Keep these files separate:

- Base: `textures/area-walls/rifts-rock-wall.png`
- Medium detail: `textures/shared-overlays/rifts-medium-rock-overlay.png`

The overlay contains medium rock fragments and small clusters, with transparent gaps. Do not replace the base with the sheet or bake it permanently into the base. Sample it independently so the artist can repeat, offset and blend it a few times as needed.

Start with one pass. Add a second or third pass only where the base still has large uninterrupted areas. Suggested starting controls:

| Pass | Tiling multiplier | UV offset | Alpha strength |
| --- | ---: | --- | ---: |
| 1 | 1 | `(0.17, 0.43)` | 0.70 |
| 2 | 2 | `(0.61, 0.09)` | 0.50 |
| 3 | 3 | `(0.29, 0.73)` | 0.35 |

Use the existing continuous wall UVs for all samples. Each pass needs its own offset. Keep tiling and alpha strength exposed as material parameters. Integer multipliers retain a one-base-tile repeat when a composite is baked or evaluated per tile; arbitrary multipliers are also possible with continuous world/material UVs.

Shader-style pseudocode, assuming texture samples return linear RGB and straight alpha:

```hlsl
float3 color = SampleBase(uv).rgb;

float4 rock0 = SampleMediumRock(uv * 1.0 + float2(0.17, 0.43));
color = lerp(color, rock0.rgb, saturate(rock0.a * 0.70));

float4 rock1 = SampleMediumRock(uv * 2.0 + float2(0.61, 0.09));
color = lerp(color, rock1.rgb, saturate(rock1.a * 0.50));

float4 rock2 = SampleMediumRock(uv * 3.0 + float2(0.29, 0.73));
color = lerp(color, rock2.rgb, saturate(rock2.a * 0.35));
```

Use alpha-aware filtering/mip generation for clean transparent edges. The overlay export includes RGB color padding underneath transparent pixels near rock silhouettes. Default to offsets and scale changes; the painted highlights share the base's light direction, so arbitrary rotations can make the lighting disagree.

This sheet supplies color and coverage; it is not a normal map. Its alpha can also weight artist-controlled roughness or tint changes in the same places. The pack's base rock color remains a separate source.

See `previews/rifts-layering.jpg` for the base, overlay, and one-pass/three-pass composites. `repeat-checks/rifts-layering.jpg` shows the three-pass result repeated.

## Separate cellular noise layer

`textures/shared-detail/deeps-rock-cell-noise.png` is a grayscale rock/brick breakup map. Light areas are stone faces; dark areas are irregular joints. It has varied cell sizes and is independent of the blue floor color texture. It is not a pixel-registered mask for every painted stone.

Import it as linear data. Sample with its own tiling and offset. For subtle color breakup, a useful starting expression is:

```hlsl
float noise = SampleRockNoise(detailUV).r;
color *= lerp(1.0, lerp(0.75, 1.08, noise), noiseStrength);
```

Start `noiseStrength` around `0.15` to `0.30` and expose it. The map can also drive a restrained roughness or height variation if the shader supports it. It is opaque grayscale data; the warm medium-rock sheet is the separate RGBA color overlay.

## Quiet puddle overlay

`shared-effects/water-ripples.png` is deliberately sparse and low opacity. Blend using its own alpha, then expose an additional strength control. Keep the underlying floor visible. The preview uses a blue backing only to show the faint reflections.

## Review and integrity

- `previews/` contains the current material sheets and latest edit overview.
- `repeat-checks/` shows current textures tiled, plus the rock layering composite.
- `asset-checks.csv` lists each production PNG, dimensions, pixel mode, boundary checks and SHA-256.
- `generation-prompts.json` retains the latest image-generation instructions per asset.
