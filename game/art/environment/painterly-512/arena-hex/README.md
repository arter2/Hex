# Arena hex floor: complete critique art set revision2

Six areas: Hollows, Deeps, Vault, Rifts, Ruins and Abyss. Every area has eight painted tile variants, joint fill, 16 flat growth pieces, 16 upright sprigs and an aligned upright glow mask. The nine original named images per area are present (54 total), plus roughness and metalness for BOTH hex sheets, joint fill, flat growth and upright growth (60 additional maps). All material images are 1024 x 1024 PNG.

Review images show all eight tiles at80px and55px across, all growth, and examples of the height/roughness/metalness/masks/joint maps. These are flat material previews, not in-game PBR renders. Tile numbers1–4 are sheet A;5–8 are sheet B. Growth cells are row-major1–16.

`areas/<area>/` contains the original nine named art files and ten roughness/metalness files. `variation/<area>/` contains four independent masks per sheet, RGBA channel packs and separate tile coverage. `shared/` contains repeating broad noise. `review/` contains critique sheets. `docs/validation.json` records sizes, populated growth cells, transparency, channel packing and repeat-boundary checks.

Roughness uses white=rough, black=smooth. The stone substrate, dirt, moss, plants, fungi, ice and quartz use metalness0. The embedded SILVER inclusions on Deeps hexes and GOLD inclusions on Abyss hexes use metalness1 exactly where painted; their roughness is lower than the surrounding stone. Other zero-valued metalness images are intentional. Growth roughness separates crystal facets, mushroom caps, foliage and gritty debris. Transparency is supplied only by growth albedo or the separate tile-coverage map, never by material masks.

Height maps are derived in exact pixel alignment from template edge distance, measured defect masks and restrained surface variation. They are approximations to relief, not scanned PBR measurements. Normal and AO maps can be derived from these heights by the game build. Glow masks are derived directly from selected upright crystal tips and lantern caps. Ruins has no luminous growth, so its glow mask is intentionally black. Flat growth does not glow.

The painted art and extra source masks/noise were made using built-in image generation. Technical maps, packing, geometry clipping, edge colour carry, baseline normalization and review sheets were generated deterministically from the art. Exact generation prompts are supplied in docs.

This is the complete ART REVIEW delivery. Nothing has been committed to GitHub or connected to the live game's materials. See CLAUDE.md for integration and downsizing instructions.

## Latest approved changes
Deeps has sparse embedded silver inclusions; Abyss has sparse gold inclusions. Ruins tile stone is aged ivory-grey marble. The upright sheets use complementary three-hue colour groups, with cells9–11 as ferns and12–14 as plain blade-only grass. All grain/seed heads have been removed. The two top rows remain crystals and fungi, the last two cells root loops. See docs/revision2-notes.md and the new small-size proof.
