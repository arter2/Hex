# Hexmancers painterly card-art production standard

The 66 supplied images in `game/cards/art/` are the style reference set. Preserve those originals and their names. New images should look like painterly medieval/high-fantasy collectible-card illustrations, with the dramatic lighting, material detail, atmosphere and narrative staging associated with Magic: The Gathering artwork. This is a visual direction, not permission to copy existing game illustrations or characters.

## Style

- Painterly surfaces and believable cloth, leather, metal, wood, glass, feathers and stone.
- Medieval and fantasy environments. Use the card's established alchemical/clockwork fantasy motifs where its name requires them; avoid modern industrial/military hardware and contemporary clothing.
- Attractive directional light, readable value structure, atmospheric depth, and a prominent subject. Magic may illuminate the scene but must not replace the subject with glare.
- No anime faces, Disney-like cartoon proportions, photorealistic rendering, or coarse pixel-art treatment. Keep expressions, anatomy and materials grounded in fantasy illustration.
- Use the exact card name and actual mechanics to select the subject/action. Do not paint an unrelated generic object merely because the card belongs to the same colour or type.

## Editable master and action-safe composition

The **editable artwork source is exactly 512 × 512 PNG**, stored in `game/cards/art/masters/`. Prepare this square source before producing display crops. Preserve any larger raw generator output separately as production provenance; it is not the source file in the delivery. Do not deliver only a flattened framed card: illustration, frame and text remain separate.

For each new raw generation, run `node tools/card-art-source.js <raw-path> <card-id>`. It writes the 512-square source and reports `editableSourcePath` and original `sourceNative` dimensions; record both in the colour manifest. Review this source and its wide crop. The exporter prefers the existing square source, including for earlier cards; the contact-sheet tool uses `editableSourcePath` when present. Later edits to the square source are preserved. Raw originals only bootstrap a missing source. The preparation tool refuses to overwrite an existing source; preserve any earlier attempt before replacing your newly assigned card.

Rebuilding leaves existing source PNG bytes untouched. The export report records a source SHA-256; unchanged sources and crop coordinates reuse their existing display files. Editing a square source or focal point, or removing an output, rebuilds that card's crops. The integrity check detects sources edited since the last export. Never resize or re-encode a source just to refresh its thumbnails.

The current card contract's illustration slot is **206 × 141**. A full-width crop from a 512 square is 512 × 350.45, centred at approximately y=80.78…431.22. Keep critical faces, hands, weapons and action inside the stricter inner action-safe rectangle **x=24…488, y=105…407**. The upper/lower margins may contain expendable atmosphere, sky or ground. The subject should occupy roughly 65–80% of the visible crop and remain identifiable on a 96-pixel-wide card.

Compose for both views: the full square must be a finished painting, and the wide crop must be a finished card illustration. Crop-safe composition does not mean putting every figure's full body in view; it means preserving the information that identifies this particular card. Do not cut a face, relevant hand or named weapon in half. Record intentional crop changes in the colour manifest's `focalPoint` array and review note. Existing overrides in `game/cards/art-focus.json` take precedence; check for an override when reviewing a card.

Older supplied sources include 256-pixel images. The builder preserves the originals and records native dimensions and `legacyUpscaled`. Normalizing them to a 512 master does not restore missing detail. Use a higher-resolution original or repaint later if the zoom quality is inadequate. Do not claim those normalized sources have newly created detail.

## Render sizes and full-art view

Install the local renderer with `npm install --prefix tools/card-art --no-package-lock`, then run `node tools/card-art-build.js`. This deterministic export needs no browser or network after dependency installation. Run `node tools/card-art-check.js` for integrity and markup checks; it also writes the standalone `game/art-review.html` size-comparison page. Browser layout and physical-device checks are separate.

While a later agent wave is still generating, use `node tools/card-art-build.js --through-batch=2` to export only reviewed earlier batches. Refresh assignment/generated/exported counts with `node tools/card-art-queue.js`. Inspect each wave before registration with `node tools/card-art-contact-sheet.js 2 /tmp/batch-02.jpg` (substitute the batch number). Package the current game and size-review page with `python tools/package-art-test.py /tmp/hexmancers-art-test.zip`.

Explicitly request a **1:1 square canvas** and inspect the actual returned dimensions. A source may still come back landscape; the exporter first normalizes its central square, then applies the wide crop. Review that final composition, rather than assuming a raw preview proves the card is safe. Repaint/outpaint with image generation when normalization cuts identity-critical parts. Keep each generation's exact output-hint path; concurrent workers must never guess the newest shared-directory image.

`tools/card-art-build.js` reads the art slot from the shared card contract. It generates:

- A 512 × 512 PNG master for editing and the card detail page's **View full artwork** link.
- A high-quality large crop, 512 × 350 WebP.
- A medium crop, 256 × 175 WebP.
- A thumbnail crop, 128 × 88 WebP.

All render sizes derive from the same full-resolution master and identical crop coordinates. Do not enlarge a thumbnail to make a detail image. The game draws each card from the atlas sheets `tools/card-art-build.js` packs from the masters (`game/cards/art/atlas`): the full-card sheet (512-wide cells) for a card shown big, the thumbnail sheet (256-wide cells) for smaller cards and icons. Painting uses normal image filtering rather than nearest-neighbour pixel-art rendering. Display crops fill the frame without letterboxing.

A 512 master is the maximum original detail in this standard. Displays demanding more than 512 physical pixels cannot acquire more real detail through upscaling.

## Production by colour

The colour JSON files list the v179 catalogue by exact card ID. Lighter agents own individual colour batches, generating a small, reviewable initial batch before further production. Each `*-generated.json` records IDs, prompts, original paths, focal points and generation status. A card is not complete merely because a generator returned an image.

Before export, check identity, anatomy, action-safe placement, lighting and readability against the supplied reference set. Then inspect the wide crop at 128 and 512 pixels and in actual 96/120/240-pixel card renders. Use image generation for repainting/compositional changes; preserve original artwork. The deterministic build step handles technical normalization and size exports.

Acceptance: exact 512 square master; no invented frame/text; correct card identity; no clipping of critical action; a sharp large crop; readable thumbnail; all variants use the same composition; no unregistered/locked card leaks; no broken assets. Leave ambiguous names and unprepared key-green images inactive until resolved.

## Prompt skeleton for future cards

> Paint an illustration for **[exact card name]**, whose action/effect is **[actual mechanics]**. Painterly medieval fantasy collectible-card art, nuanced materials, directional light and atmospheric depth, consistent with the supplied Hexmancers reference set. A bold readable **[subject/action]** dominates a quiet supporting environment. Create a square composition for a 512 × 512 master. Keep the critical subject/action within x24…488 and y105…407 on that square, with expendable scenery beyond; it will also be viewed as a 206:141 horizontal crop. No card border, lettering, numbers or UI. No anime, Disney-like cartoon, photorealism or pixel-art rendering.

Do not mark the remaining catalogue complete: record generated, reviewed/exported and pending cards separately in the production queue.

## Named transfer for Claude

After at least 200 unique cards are reviewed and exported, prepare the transfer directory with `node tools/card-art-handoff.js /workspace/card-art-handoff 200`. This creates no ZIP. It includes named masters, three crop sizes per card, exact catalogue mappings, checksums and `README_FOR_CLAUDE.md`. Keep the repository's stable runtime destinations; the manifest maps human-readable delivery names to those paths. Count unique card illustrations, not thumbnails or unused alternatives. Wait for the user to request a ZIP before archiving the transfer.
