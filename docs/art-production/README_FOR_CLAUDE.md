# Hexmancers card artwork: upload and integration handoff

This handoff is for `arter2/Hex`. It supplies at least 200 **unique card illustrations**, each tied to an exact catalogue ID and display name. Thumbnails, alternate generations and unresolved reference images do not count toward that threshold. Read the repository's own current instructions before editing.

## Contents and naming

- `card-images.json` is the authoritative transfer manifest, with one record per active card. Each record contains the exact card name, ID, colour, human-readable filename, source provenance, focal point, original resolution, repository destinations and SHA-256 checksums.
- `masters/<colour>/<card-name>--<card-id>.png` contains the **editable source artwork, exactly 512 × 512 PNG**. Use these square sources for editing and for creating every display size. The manifest's `source.file` points to this same image as `master.file`; there is no separate rectangular source. The ID suffix makes otherwise similar names unambiguous. Preserve the display name exactly as recorded in the manifest.
- `rendered/<colour>/<card-name>--<card-id>-128.webp`, `-256.webp`, and `-512.webp` are ready-to-use versions of the same horizontal crop. Expected dimensions are 128 × 88, 256 × 175 and 512 × 350.
- `integration/` contains updated registry, manifests, reports, review page and production utilities at their repository-relative paths. These are integration inputs, not instructions to overwrite unrelated work.

Canonical runtime filenames use stable card IDs or preserved supplied filenames. Human-readable delivery filenames are mapped to those destinations explicitly by `repositoryPath`. Do not infer IDs from a title, rename a card, or silently substitute a similar image. Never use the generator's `exec-...png` names as a card mapping.

The source size is **512 × 512**. The rectangular WebPs are derived display crops only. Historical generator outputs may have larger dimensions; `sourceNative` and `source.originalProductionPath` describe that production provenance, not an additional source that Claude needs to upload or edit. For future artwork, prepare the square 512 × 512 editable source before producing any crops.

## Starting point

The tested runtime is Hexmancers v179, including the shared 240 × 434 card frame and 206 × 141 art slot. The responsive artwork foundation is on branch **`art/named-painterly-import` (PR #4)**. Start there, or first bring its scoped art-runtime changes into the intended working branch. Keep newer user changes and resolve differences narrowly; do not replace a newer `ui.js`, `index.html` or card renderer wholesale.

The supplied original PNGs under `game/cards/art/` remain unchanged. Their source mapping is `docs/named-card-art-mapping.json`. Some legacy sources were only 256 pixels: the `legacyUpscaled` flag identifies them. A 512 export does not restore missing detail. Unnamed images, unprepared green-background assets and unused alternates remain inactive.

## Apply the artwork

1. Parse `card-images.json`. Verify `uniqueCards >= 200`, unique IDs and unique delivery filenames. Match every ID and exact name against the current game's catalogue. Report any mismatch instead of guessing.
2. Check every supplied file's SHA-256 and dimensions. Copy each master and rendered image to the exact repository-relative `repositoryPath` in its manifest record, preserving folders. Destinations must stay under `game/cards/art/`.
3. Apply `integration/` by relative path after reviewing its diff. In particular, update `game/cards/art-variants.js`, the production manifests/report and the review page together. Historical `generatedPath` and `originalProductionPath` values can refer to the original production workspace; they are provenance, not deployment dependencies. The exporter falls back to the checked-in canonical master when that original is absent.
4. Ensure `cards/art-variants.js` loads **before** `art.js`. The existing `cardArtVariants`/`cardIllustration` lookup must take precedence over procedural art for registered IDs. Other cards retain their fallback. Preserve locked/unseen-card rules: hidden art and full-art links must not expose unseen cards.
5. Run `node tools/card-art-build.js` after registering art: it also packs the per-colour atlas sheets the game draws from (`game/cards/art/atlas`, with each card's cell in `art-variants.js`). Display crops fill the art slot using normal image filtering (`image-rendering:auto`); preserve the procedural-art styling for fallback images. Card details link to the square master for full-art viewing. Never enlarge a thumbnail to replace a detail image.

The crop is derived from the shared contract, not a separately guessed aspect ratio. Keep the same focal point for all display sizes. Do not stretch the square, add letterboxing, change the frame geometry, tint frame icons differently, or move text/runes to accommodate art. Gameplay, controls, movement and battle dimensions are outside this handoff.

## Validate before committing

Install the exporter dependencies with `npm install --prefix tools/card-art --no-package-lock` when needed. Then run:

```sh
node tools/card-art-check.js
node tools/card-art-queue.js
node tools/playtest/selftest.js
git diff --check
```

The image check also regenerates `game/art-review.html`. Open it from a local server, select a colour and page through the comparisons at widths 96, 120, 240 and 396. It renders at most 20 cards per page to keep a large catalogue manageable. Confirm that the name, subject, critical hands/faces and named object read clearly; check full-art links, locked cards, unknown-art fallbacks and that every request succeeds. Test Safari/mobile/tablet layout separately: the production environment did not complete those browser/device checks.

Only rebuild all exports after the canonical 512-square sources, preserved supplied originals and updated generated manifests are present. Use `node tools/card-art-build.js --through-batch=7` for this handoff, then rerun the checks. New production records explicitly identify their square source with `editableSourcePath`; this takes precedence over historical raw generation paths and preserves later source edits. Rebuilds leave source PNG bytes untouched, using source checksums and crop coordinates to reuse unchanged display files. After editing a square source or focal point, rerun the exporter before the integrity check. Never regenerate illustrations just because raw generation paths are unavailable.

Review `git diff --stat` and the actual changes, commit the art integration on the intended branch, and push it using the user's repository access. The user is handling transfer/push; this handoff does not claim its local commit has already reached GitHub. Do not merge unrelated PRs or publish a release as part of an art import.

This is a repository-art handoff, not an itch.io production build. If packaging a playable build later, run the packager and inspect its file-count/size report against the hosting service's limits. Keep source/reference assets in the repository even if a deployment package omits unused files.
