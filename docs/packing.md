# Packing Hexmancers for itch.io

There are two builds. Both start from `game/`, which never changes during packing.

| | Dev build | Release build ("zip and version up") |
|---|---|---|
| Command | `python3 tools/package-itch.py` | `python3 tools/package-itch-packed.py` |
| What it is | `game/` as it is, minus what a player never loads; card art from the per-colour atlas sheets | The same files, with the small art (UI pictures, card kit parts, fonts) packed into scripts and stylesheets |
| Files / zip size (v182) | 312 files, 150.6 MB | 171 files, 149.4 MB |
| When | Day to day, playtests, the art team's checks | A release for players: when you say **"zip and version up"** |

## "Zip and version up"

1. Bump the version as usual (the `vNNN:` commit).
2. Build: `python3 tools/package-itch-packed.py` (writes `hexmancers-itch-vNNN.zip`, NNN from `index.html`; give a folder or a .zip path to write elsewhere). It takes about a minute and prints a JSON report.
   `problems` must be empty (if it isn't, the script exits with an error and you shouldn't upload the zip). `warnings` lists files the game names but that aren't in `game/` at all; those were already broken in the dev build.
3. Optional checks before uploading: unzip it into `<somewhere>/game/`, copy `tools/playtest/` to `<somewhere>/tools/playtest/`, and run `node tools/playtest/ui-runner.js` and `node tools/playtest/battle-ui-runner.js` from `<somewhere>`. The runners serve whatever sits beside them, so they test the packed build without any change.
4. Upload the zip to itch.io.

Almost all of the size is the card art: 114 atlas sheets (WebP 85, a full-card and a thumbnail sheet per 30 cards of a colour). Packing saves file count, not much size.
`--art-quality N` sets the WebP quality (default 80).

## What the release build changes (in its copy only)

1. **Card art: the atlas sheets, as in the dev build.** Before the sheets, this step cut each card to one WebP (702 files to 234); the sheets now do that job for both builds.
2. **(Not done) Card art packed into one script.** We tried this and dropped it. On a 10 Mbit/s connection, it took the menu from about 10 s to 23 s and the JS memory from 30 to 60 MB, because every picture loaded at start and sat in memory as base64.
3. **`sprites.js`.** Its PNG data URIs became lossless WebP: every pixel and alpha value is kept, and it was checked by decoding them back. This took the sprite images from 4.3 MB to 3.3 MB.
4. **`ui/*.svg`.** These are the pixel-run SVGs written by `tools/ui-svg.py`. Each one becomes a palette PNG of the same pixels, checked pixel by pixel, then inlined.
5. **Card kit parts, fonts, menu picture, inlined.**
   - `url()`s in the stylesheets become `data:` URIs held in `--pk-*` custom properties on `:root`. Fonts are inlined straight into `@font-face`.
   - The paths `ui.js` builds while the game runs (status and role icons, the card frame, texture, foil and effects, the element icon) come from `pack.js` through `hexAsset(path)`.
   - The four `ui.js` call sites are listed in `UI_PATCHES`. If `ui.js` changes so one no longer matches, the build stops and names it.
   - Files nothing names (the loose `cards/icons/*.svg` already compiled into `icons.js`, the two symbols, the animated glows, the `cards/*.json` notes) are left out.

## Trade-offs

Measured in Chrome on a simulated 10 Mbit/s, 60 ms connection, until the menu is ready: (measured at v179, before the atlas sheets):

| | Menu ready | JS memory | Downloaded |
|---|---|---|---|
| Dev build | 9.9 s | 30 MB | 10.3 MB |
| Release build | 11.1 s | 32 MB | 10.8 MB |

- **Adding a new kind of asset path in JS** (a new `'ui/'+x` style string): the build fails with `builds a path with ... add it to UI_PATCHES`. Add the call site to `UI_PATCHES` in `tools/package-itch-packed.py`, or put the new family in `PACKED_FAMILIES`.
