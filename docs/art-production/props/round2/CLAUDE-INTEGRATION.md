# Hexmancers: medieval catacomb materials, round 2

## Delivery and art direction

17 materials, each with a 1024 x 1024 PNG albedo, height and roughness map: 51 master images.
Combine both ZIPs into the same folder. Each master occurs once across the delivery.
The existing nine round-1 materials are already in the game and are not duplicated here.

All surfaces belong to a hand-painted medieval game exploring ancient catacombs. Use hand-worked stone,
forged metal, worn timber, aged handmade fabric and hide, damp staining and accumulated wear.
The revised brick is irregular hand-fired catacomb masonry with crumbling lime mortar. Keep this version;
the earlier neat modern-looking brick drafts are superseded.

Medium-scale features were enlarged in fabric, furniture wood, soil and basalt for small props.
The `previews/small-size-*.png` sheets show the 256px tile and 64px/32px reductions, with labelled enlarged views.
Fine grain naturally filters away at these sizes; preserve the broader material pattern and value groups.
Smooth materials such as parchment, leather and steel intentionally keep quieter detail.

These are flat surface materials, not pictures of individual props. One tile represents approximately one metre.

## File conventions

Masters are `props/props--<key>-albedo.png`, `props/props--<key>-height.png`,
and `props/props--<key>-roughness.png`.

- Albedo is colour, interpreted as sRGB.
- Height is grayscale data: white higher, black lower. Do not treat pigment or marble veins as displacement.
- Roughness is grayscale data: white rough, black smooth. Do not invert it into gloss.
- Height and roughness are data maps. Use the existing atlas builder's data handling; do not apply an sRGB colour transform.
- Use repeat wrapping. The 1024px exports have matching opposing edge texels in both axes.
- Keep normal strength subtle for fabric, parchment, leather, furniture wood, marble and fungus.

## Material assignment and append order

The slot numbers below assume the existing nine slots remain `planks, rough-wood, iron, clay, cloth,
carved-stone, bone, brass, books` at indices 0–8. Append; never reorder an existing slot.

| Slot | Key | Use |
|---|---|---|
| 9 | dressed-stone | Built pillars, pilasters, arches, cornices, skirting, niche and door frames, stairs, troughs, pool rims, hall stonework, dais and built arena pillars |
| 10 | rough-rock | Boulders, rubble, natural cave rock, pool-side rocks, cave rock pillars and arena rocks |
| 11 | bark | Logs, sapling trunks, roots, camp logs and totem poles |
| 12 | fabric | Banners, blankets, robes, hats, bedding and rugs; keep existing `cloth` for sacking |
| 13 | furniture-wood | Tables, desks, shelves, bookcase frames, wooden benches, bunks and merchant stalls |
| 14 | sandstone | Pushable sand blocks and crumbling Ruins pieces |
| 15 | end-grain | Cut log and beam ends and stump tops; bark on stump sides |
| 16 | steel | Blades, weapon heads, mirror frames and cages |
| 17 | marble | Bathhouse basins and benches, temple columns and mirror-puzzle plinths |
| 18 | brick | Catacomb forge furnace and chimney |
| 19 | leather | Straps, grips, desk book covers and leather-covered shields |
| 20 | parchment | Blank scrolls and desk papers |
| 21 | straw | Loose barracks straw and straw mattresses |
| 22 | soil | Planters and sapling ground |
| 23 | coal | Coal heaps |
| 24 | fungus | Mushroom stems; keep cap artwork separate |
| 25 | basalt | Ember Rifts rock, basalt arena rocks and forge floor stone |

## Installation and downsizing

1. Retain the supplied 1024px files as the masters.
2. For the game's working source, downsize each map to 512 x 512 and write it to
   `game/art/environment/painterly-512/props/<key>-<map>.png`, dropping the `props--` prefix.
   For example, `props--bark-albedo.png` becomes `bark-albedo.png`.
   Keep the three maps at identical size, orientation and crop. Use a proper area/box or Lanczos reduction;
   never nearest-neighbour for the exported materials. Generate lower mips from the reduced texture.
3. Append the keys above in the same order to `PROPS` in `tools/build-env-atlas.py` and `XPROP_MATS`.
   The 26 total materials fit a 6 x 5 sheet: set `cols` to 6 and retain the builder's wrapped gutters.
4. Add the brief's gloss values: `steel: 1`, `marble: 0.5`, `leather: 0.3`.
5. Rebuild with `python3 tools/build-env-atlas.py`. The builder produces 256px tiles, wrapped gutters,
   normals derived from height in RG, roughness in B, and the updated means in `game/envartmap.js`.
6. Assign each part explicitly. The colour-based guess cannot distinguish these new keys.
   Follow the supplied `REMAINING-PAINTED-MATERIALS.md` for the exact call sites, deterministic dressing rules,
   material-map handling, cache separation, and geometry work. Preserve the room-dressing random call count.
7. Review one close in-game picture per change, including one Low-graphics picture. These art previews check
   source tiling and scale; actual game lighting, shader gloss and mapping scale still require that integration check.

## Validation and provenance

The delivered files were checked for the full 51-file set, 1024px square dimensions, grayscale scalar channels,
and equal opposing edge texels. Repeated previews and small-size reductions were visually inspected.
`SHA256SUMS.txt` covers all 51 PNG masters.

Art was generated and revised with the built-in image generation tool, including map conversion from the final
albedos. Technical export conditioning sets the exact resolution and wraps the edges. The supplied
`CHATGPT-PROMPTS-2.md` records the source prompt set; the medieval catacomb direction, irregular brickwork and
small-size revisions described above supersede the earlier generic draft appearances.
