# Supplied painterly card artwork

Source: the 66 unchanged PNGs uploaded under `game/cards/art/` on branch `ccr-eece0795-rhbml0`, commit `010e2102f4dd52451f56a7535333745dc96e6a63`.

The runtime registry `game/cards/illustrations.js` connects 50 named scene illustrations to exact card IDs in the v179 catalogue. The per-file audit is `docs/named-card-art-mapping.json`.

Names are matched against the longest normalized catalogue-name prefix, ignoring apostrophes and filename punctuation. Explicit `vN` revisions take precedence over earlier versions; resolution breaks ties. Original files and filenames are preserved, including alternatives and byte-identical duplicates.

Four alternate files are kept but not selected. Five anonymously named `file_...png` images need card names before they can be assigned. Seven `keygreen` images have solid green backdrops; they are named correctly but are not activated as finished card illustrations. They need suitable backgrounds or background removal before use. No supplied image has been edited or regenerated.

The responsive export pipeline now crops illustrations to the shared 206 × 141 art window and fills it without letterboxing. Each image has a 512-square editable master, plus 128, 256 and 512-pixel-wide WebP crops. All sizes share the same focal point. The game itself draws painted art from per-colour atlas sheets that the same build packs from the masters (`game/cards/art/atlas`: a full-card sheet from the 512 crop for big cards, a thumbnail sheet from the 256 crop for everything smaller); the separate crops stay for the art team and the review page and are not shipped (`tools/package-itch.py`). The card detail links to the full square artwork in the repo copy, where the masters are. Other cards keep the existing procedural or painted-art fallback. Frames, icon hue rules, gameplay data and v179 typography remain intact.

Lighter agents produced 384 named illustrations across all eight colours: 152 in batches 01–05, another 32 in batch 06, and 200 in batch 07 (25 per colour, delivered in `card-art-deliveries/batch-07-200` on `art/434-card-handoff`). Together with the 50 supplied matches, these make 434 active card illustrations, packed into 36 atlas sheets. Prompts and card IDs are recorded in `docs/art-production/*-generated.json`; production standards and crop-safe composition are in `docs/art-production/ART-DIRECTION.md`. These are an initial batch, not the entire catalogue.

The export report covers 450 sources: the 66 unchanged supplied originals plus 384 generated illustrations. Thirty-one supplied sources were smaller than 512 pixels and are marked `legacyUpscaled`; their missing detail cannot be recovered by resizing. The five unresolved filenames, seven green-backdrop assets and four unused alternates remain inactive.

This import is separate from PR #3, which contains the three newly generated reference-card illustrations. It does not silently replace those generated assets or merge that PR.

The named transfer standard is documented in `docs/art-production/README_FOR_CLAUDE.md`. `tools/card-art-handoff.js` prepares a directory of named masters and their crops, with exact card IDs, display names, repository destinations and checksums: `--batch=<n>` for one batch's new artwork, `--all` for the combined collection. Creating that directory does not create a ZIP or push to GitHub. The remaining catalogue queue contains 1,519 cards.

The editable artwork sources are exactly 512 × 512 PNG. New records identify these with `editableSourcePath`; raw generator outputs remain provenance. Rebuilds prefer existing square sources for both supplied and generated art, preserving later edits. Batch 06 source/crop review includes repaired totems, flasks, towers, spear tips, armor and faces.
