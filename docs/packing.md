# Packing Hexmancers for itch.io

There are two builds. Both start from `game/`, which never changes during packing.

| | Dev build | Release build ("zip and version up") |
|---|---|---|
| Command | `python3 tools/package-itch.py out/hexmancers-itch.zip` | `python3 tools/package-itch-packed.py out/hexmancers-vNNN-itch.zip` |
| What it is | `game/` as it is: every image its own file, three sizes of card art | One WebP per card, all small art packed into scripts and stylesheets |
| Files / zip size (v179) | 964 files, 38.6 MB | 56 files, 17.2 MB |
| When | Day to day, playtests, the art team's checks | A release for players: when you say **"zip and version up"** |

## "Zip and version up"

1. Bump the version as usual (the `vNNN:` commit).
2. Build: `python3 tools/package-itch-packed.py out/hexmancers-vNNN-itch.zip`. It takes about a minute and prints a JSON report.
   `problems` must be empty (if it isn't, the script exits with an error and you shouldn't upload the zip). `warnings` lists files the game names but that aren't in `game/` at all; those were already broken in the dev build.
3. Optional checks before uploading: unzip it into `<somewhere>/game/`, copy `tools/playtest/` to `<somewhere>/tools/playtest/`, and run `node tools/playtest/ui-runner.js` and `node tools/playtest/battle-ui-runner.js` from `<somewhere>`. The runners serve whatever sits beside them, so they test the packed build without any change.
4. Upload the zip to itch.io.

Options: `--art-width 384` makes card art a little softer when a card is shown large, and saves about 3 MB.
`--art-quality N` sets the WebP quality (default 80).

## What the release build changes (in its copy only)

1. **Card art, one size.** The 512 crop of each card, re-encoded at quality 80. Before, there were 128, 256 and 512 versions. The browser scales it down for small cards. This took the card art from 702 files (30.5 MB) to 10.3 MB.
2. **Card art packed (plan step 6).** All of it lives in `cards/art-variants.js` as base64. Each picture becomes a `blob:` URL the first time the game asks for it, so `HEX_CARD_ART_VARIANTS` reads exactly as before (`large`, `outputs`, `master`…).
   I used this instead of sprite sheets, so no CSS or layout code had to change.
3. **`sprites.js`.** Its PNG data URIs became lossless WebP: every pixel and alpha value is kept, and it was checked by decoding them back. This took the sprite images from 4.3 MB to 3.3 MB.
4. **`ui/*.svg`.** These are the pixel-run SVGs written by `tools/ui-svg.py`. Each one becomes a palette PNG of the same pixels, checked pixel by pixel, then inlined.
5. **Card kit parts, fonts, menu picture, inlined.**
   - `url()`s in the stylesheets become `data:` URIs held in `--pk-*` custom properties on `:root`. Fonts are inlined straight into `@font-face`.
   - The paths `ui.js` builds while the game runs (status and role icons, the card frame, texture, foil and effects, the element icon) come from `pack.js` through `hexAsset(path)`.
   - The four `ui.js` call sites are listed in `UI_PATCHES`. If `ui.js` changes so one no longer matches, the build stops and names it.
   - Files nothing names (the loose `cards/icons/*.svg` already compiled into `icons.js`, the two symbols, the animated glows, the `cards/*.json` notes) are left out.

## Trade-offs

- **Load:** all card art (about 14 MB of script) loads when the game starts. Before, only the pictures on screen were fetched. On itch the whole game downloads once and is cached, but a slow connection waits longer at the start.
- **Memory:** about 30 MB more JS memory (66 MB vs 36 MB in Chrome), because the base64 text stays in memory.
- **Art quality:** quality 80 against the dev build's crops. The screenshot diff at card size shows no visible change (no pixel off by more than 16 of 255).
- **Adding a new kind of asset path in JS** (a new `'ui/'+x` style string): the build fails with `builds a path with ... add it to UI_PATCHES`. Add the call site to `UI_PATCHES` in `tools/package-itch-packed.py`, or put the new family in `PACKED_FAMILIES`.
