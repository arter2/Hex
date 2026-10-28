# Supplied painterly card artwork

Source: the 66 unchanged PNGs uploaded under `game/cards/art/` on branch `ccr-eece0795-rhbml0`, commit `010e2102f4dd52451f56a7535333745dc96e6a63`.

The runtime registry `game/cards/illustrations.js` connects 50 named scene illustrations to exact card IDs in the v179 catalogue. The per-file audit is `docs/named-card-art-mapping.json`.

Names are matched against the longest normalized catalogue-name prefix, ignoring apostrophes and filename punctuation. Explicit `vN` revisions take precedence over earlier versions; resolution breaks ties. Original files and filenames are preserved, including alternatives and byte-identical duplicates.

Four alternate files are kept but not selected. Five anonymously named `file_...png` images need card names before they can be assigned. Seven `keygreen` images have solid green backdrops; they are named correctly but are not activated as finished card illustrations. They need suitable backgrounds or background removal before use. No supplied image has been edited or regenerated.

Illustrations use contain fitting so that a wide card window preserves the whole square composition; some letterboxing is expected. Other cards keep the existing procedural or painted-art fallback. Frames, icon hue rules, gameplay data and v179 typography remain intact.

This import is separate from PR #3, which contains the three newly generated reference-card illustrations. It does not silently replace those generated assets or merge that PR.
