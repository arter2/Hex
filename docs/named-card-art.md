# Supplied painterly card artwork

Source: the 66 unchanged PNGs uploaded under `game/cards/art/` on branch `ccr-eece0795-rhbml0`, commit `010e2102f4dd52451f56a7535333745dc96e6a63`.

The runtime registry `game/cards/illustrations.js` connects 50 named scene illustrations to exact card IDs in the v179 catalogue. The per-file audit is `docs/named-card-art-mapping.json`.

Names are matched against the longest normalized catalogue-name prefix, ignoring apostrophes and filename punctuation. Explicit `vN` revisions take precedence over earlier versions; resolution breaks ties. Original files and filenames are preserved, including alternatives and byte-identical duplicates.

Four alternate files are kept but not selected. Five anonymously named `file_...png` images need card names before they can be assigned. Seven `keygreen` images have solid green backdrops; they are named correctly but are not activated as finished card illustrations. They need suitable backgrounds or background removal before use. No supplied image has been edited or regenerated.

The responsive export pipeline now crops illustrations to the shared 206 × 141 art window and fills it without letterboxing. Each image has a 512-square editable master, plus 128, 256 and 512-pixel-wide WebP crops. All sizes share the same focal point; the card detail links to the full square artwork. Other cards keep the existing procedural or painted-art fallback. Frames, icon hue rules, gameplay data and v179 typography remain intact.

Lighter agents produced 984 named illustrations across all eight colours: 152 in batches 01–05, another 32 in batch 06, and 200 each in batches 07, 08, 09 and 10 (25 per colour per batch). Together with the 50 supplied matches, these make 1034 active card illustrations. Prompts and card IDs are recorded in `docs/art-production/*-generated.json`; production standards and crop-safe composition are in `docs/art-production/ART-DIRECTION.md`. This covers part of the catalogue.

The export report covers 1050 sources: the 66 unchanged supplied originals plus 984 generated illustrations. Thirty-one supplied sources were smaller than 512 pixels and are marked `legacyUpscaled`; their missing detail cannot be recovered by resizing. The 200 batch-07, 200 batch-08, 200 batch-09 and 200 batch-10 sources are separate sets of new 512-square paintings. The five unresolved filenames, seven green-backdrop assets and four unused alternates remain inactive.

This import is separate from PR #3, which contains the three newly generated reference-card illustrations. It does not silently replace those generated assets or merge that PR.

The named transfer standard is documented in `docs/art-production/README_FOR_CLAUDE.md`. After exporting through batch 10 and running the artwork checks, `node tools/card-art-handoff.js /workspace/card-art-batch-10 200 --batch=10` prepares exactly 200 new named masters and 600 crop variants, with exact card IDs, display names, repository destinations, checksums and the full earlier 834-card delivery manifest. The repository delivery is `card-art-deliveries/batch-10-200/` on branch `art/1034-card-handoff`. Its physical audit decodes all 800 images, verifies exact assignments and checks disjoint IDs and source content against all 834 earlier cards. The remaining catalogue queue contains 919 cards.

The editable artwork sources are exactly 512 × 512 PNG. New records identify these with `editableSourcePath`; raw generator outputs remain provenance. Rebuilds prefer existing square sources for both supplied and generated art, preserving later edits. Batch 06 source/crop review includes repaired totems, flasks, towers, spear tips, armor and faces.
