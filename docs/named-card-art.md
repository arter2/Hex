# Supplied painterly card artwork

Source: the 66 unchanged PNGs uploaded under `game/cards/art/` on branch `ccr-eece0795-rhbml0`, commit `010e2102f4dd52451f56a7535333745dc96e6a63`.

The runtime registry `game/cards/illustrations.js` connects 50 named scene illustrations to exact card IDs in the v179 catalogue. The per-file audit is `docs/named-card-art-mapping.json`.

Names are matched against the longest normalized catalogue-name prefix, ignoring apostrophes and filename punctuation. Explicit `vN` revisions take precedence over earlier versions; resolution breaks ties. Original files and filenames are preserved, including alternatives and byte-identical duplicates.

Four alternate files are kept but not selected. Five anonymously named `file_...png` images need card names before they can be assigned. Seven `keygreen` images have solid green backdrops; they are named correctly but are not activated as finished card illustrations. They need suitable backgrounds or background removal before use. No supplied image has been edited or regenerated.

The responsive export pipeline now crops illustrations to the shared 206 × 141 art window and fills it without letterboxing. Each image has a 512-square editable master, plus 128, 256 and 512-pixel-wide WebP crops. All sizes share the same focal point; the card detail links to the full square artwork. Other cards keep the existing procedural or painted-art fallback. Frames, icon hue rules, gameplay data and v179 typography remain intact.

Lighter agents produced 152 named illustrations across all eight colours: the initial 16, followed by two 32-image waves, another 32-image wave and a final 40-image wave. Together with the 50 supplied matches, these make 202 active card illustrations. Prompts and card IDs are recorded in `docs/art-production/*-generated.json`; production standards and crop-safe composition are in `docs/art-production/ART-DIRECTION.md`. These are an initial batch, not the entire catalogue.

The export report covers 218 sources: the 66 unchanged supplied originals plus 152 new illustrations. Thirty-one supplied sources were smaller than 512 pixels and are marked `legacyUpscaled`; their missing detail cannot be recovered by resizing. The five unresolved filenames, seven green-backdrop assets and four unused alternates remain inactive.

This import is separate from PR #3, which contains the three newly generated reference-card illustrations. It does not silently replace those generated assets or merge that PR.

The named transfer standard is documented in `docs/art-production/README_FOR_CLAUDE.md`. `tools/card-art-handoff.js` prepares a directory of 202 unique named masters and 606 crop variants, with exact card IDs, display names, repository destinations and checksums. Creating that directory does not create a ZIP or push to GitHub. The remaining catalogue queue contains 1,751 cards.
