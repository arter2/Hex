# Implementation notes for the arena floor art

Read README.md and the supplied brief. Preserve the existing9x14 grid, layout, gameplay, highlights, walls, island, chasm and props. This package only supplies arena-floor art.

## Masters and runtime sizing
Keep these1024px master sheets. Each hex sheet is2x2 cells512px, pointy-top radius240px centered in its cell. The art brief is authoritative for atlas geometry. If the existing mesh is flat-top, remap its UVs by30degrees while preserving the original board grid. Do not reshape the grid to fit the artwork.

Cut BOTH sheets into8 variants at256px per hex for runtime. Use exact template geometry and the supplied coverage to preserve corner damage; match mesh/silhouette or alpha-test the damage rather than rendering neutral-grey cutouts as stone. Carry colour beyond cut boundaries and add atlas padding before mipmaps. Do not treat the neutral-grey background as material. Growth uses4x4 cells256px; flat pieces are inside the template circle, upright pieces sit at local baseline224 with generous cell margins. Keep upright geometry0.08–0.22 world units tall, below ankle height, at three-way joints only. Flat pieces sit below tile-edge height. No growth collision.

## Material maps
Load albedo as sRGB; height, roughness, metalness, glow and variation/coverage as LINEAR DATA. Roughness is direct, not gloss: do not invert it. White=rough. The substrate and all nonmetal growth use metalness0. EXCEPTIONS: Deeps silver flecks and Abyss gold flecks on both hex sheets use the delivered nonzero metalness masks. Do not override those hex metalness maps with a global0. Use roughness and normal/Fresnel response for crystals; do not turn them metallic.

Derive tangent-space normals and AO from the provided pixel-aligned heights. Height top is around200, bevel falls toward120, defects lower; avoid excessive displacement. Tune normal strength, AO, roughness scale/offset, edge wear and joint glow in the Arena floor debug controls. Keep the stand-in material until an area's art has loaded. Use the supplied maps as a starting point; visually tune under game lighting.

Packed mask channels: R=edge wear; G=existing cracks/chip faces; B=broad colour patches; A=moss/mineral staining. Packed A is DATA, not opacity. Preserve RGB under zero A, avoid premultiplied upload and alpha blending for this data texture, and match every mask transform to its albedo UV. Separate channel PNGs are included if packed decoding is unsuitable. Coverage is a DIFFERENT file. G strengthens existing painted defects; it does not erase baked cracks or create new geometry.

Use stable tile keys for variant,60degree rotation, occasional mirroring, mild tone shifts, mask strength and broad-noise offsets. Avoid identical neighbouring variant/turn combinations. Keep tile brightness within roughly+/-7percent and colour shifts restrained. Preserve calm centers and highlight readability. One merged/instanced tile draw, one joint plane and one merged mesh per growth sheet remain the target.

Glow is the upright emission mask only. Flat pieces do not emit. Ruins emission stays off. Keep crystal/mushroom emission restrained; no halo baked into albedo. Side colour belongs in a soft emissive joint mask, not a teal wash on the tile stone.

## Validation before accepting implementation
Recheck all cell indices, alpha on dark/light backgrounds, exact tile UV alignment, seam padding/mips and map conventions. Validate the material at55px and80px tile widths AND under the actual battle camera with units/highlights. This art package has not yet been integrated or performance-tested in the game.

## Revision2: material and foliage corrections
Deeps=silver inclusions, Ruins=aged ivory-grey marble, Abyss=gold inclusions. Updated masks, heights, roughness and metalness align with the revised albedo. Marble veins are colour variation, not deep cracks.

Upright row-major cells9–11 are THREE FERNS;12–14 are THREE PLAIN GRASS TUFTS. No wheat, crop heads, seed spikes or reed plumes. Triadic hues are material colours, not baked light. Preserve them in the shader rather than multiplying the entire sheet by an area-colour wash.

The 4/8/12px size proof is a real downsample of the Rifts artwork, with nearest-neighbour enlarged pixels for inspection. At4px the plants only read as colour specks; at8px fern/grass identity is weak; around12px the shapes read better. Do not claim distinct fern detail at4px. Below about8px projected height, use the existing flat moss/lichen joint dressing or cull small upright pieces as a LOD choice. Do not make props taller than the ankle constraint just to hit a pixel target. The exact threshold still needs an in-game camera/material test.
