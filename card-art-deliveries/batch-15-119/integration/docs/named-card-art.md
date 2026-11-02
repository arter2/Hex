# Supplied painterly card artwork

Source: the 66 unchanged PNGs uploaded under `game/cards/art/` on branch `ccr-eece0795-rhbml0`, commit `010e2102f4dd52451f56a7535333745dc96e6a63`.

The runtime registry `game/cards/illustrations.js` connects 50 named scene illustrations to exact card IDs in the v179 catalogue. The per-file audit is `docs/named-card-art-mapping.json`.

Names are matched against the longest normalized catalogue-name prefix, ignoring apostrophes and filename punctuation. Explicit `vN` revisions take precedence over earlier versions; resolution breaks ties. Original files and filenames are preserved, including alternatives and byte-identical duplicates.

Four alternate files are kept but not selected. Five anonymously named `file_...png` images need card names before they can be assigned. Seven `keygreen` images have solid green backdrops; they are named correctly but are not activated as finished card illustrations. They need suitable backgrounds or background removal before use. No supplied image has been edited or regenerated.

The responsive export pipeline now crops illustrations to the shared 206 × 141 art window and fills it without letterboxing. Each image has a 512-square editable master, plus 128, 256 and 512-pixel-wide WebP crops. All sizes share the same focal point; the card detail links to the full square artwork. Other cards keep the existing procedural or painted-art fallback. Frames, icon hue rules, gameplay data and v179 typography remain intact.

Lighter agents produced 1903 named illustrations across all eight colours: 152 in batches 01–05, 32 in batch 06, 200 in each batch 07–14, and the final 119 in batch 15 (17 Fire, 20 Frost, 21 Light, 20 Shadow, 17 Storm, 24 Verdant). With the 50 supplied matches, all 1953 catalogue cards now have active illustrations. Prompts, exact IDs and crop reviews are recorded in `docs/art-production/*-generated.json`; production standards are in `docs/art-production/ART-DIRECTION.md`.

The export report covers 1969 sources: the 66 unchanged supplied originals plus 1903 generated illustrations. Thirty-one supplied sources were smaller than 512 pixels and are marked `legacyUpscaled`; their missing detail cannot be recovered by resizing. Batches 07 through 14 each contain 200 separate new 512-square paintings. The five unresolved filenames, seven green-backdrop assets and four unused alternates remain inactive.

This import is separate from PR #3, which contains the three newly generated reference-card illustrations. It does not silently replace those generated assets or merge that PR.

The final named transfer is documented in `docs/art-production/README_FOR_CLAUDE.md`. Export through batch 15, then use `node tools/card-art-handoff.js /workspace/card-art-batch-15 119 --batch=15` to prepare exactly 119 new named masters and 357 display crops. The delivery `card-art-deliveries/batch-15-119/` on `art/1953-card-handoff` includes exact IDs/names/destinations, checksums, the full earlier 1834-card manifest and Claude integration instructions. Its audit decodes all 476 images and verifies every new ID and source is disjoint from the earlier 1834. All 1953 catalogue cards have active artwork; no pending cards remain.

The editable artwork sources are exactly 512 × 512 PNG. New records identify these with `editableSourcePath`; raw generator outputs remain provenance. Rebuilds prefer existing square sources for both supplied and generated art, preserving later edits. Batch 06 source/crop review includes repaired totems, flasks, towers, spear tips, armor and faces.
