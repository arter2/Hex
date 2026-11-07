# Hexmancers — main menu + three-save-slot handoff

Give Claude this entire unzipped folder and start with `CLAUDE_IMPLEMENTATION_PROMPT.md`.

The two appearance references are `reference/main-approved.png` (the screen explicitly selected for this handoff) and `reference/continue-approved.png` (the latest three-slot screen with the character sprite and equal footer buttons). These are the final directions for this package. Do not substitute one of the earlier calm, tabbed or heavily framed proposals.

## Open these first

1. `prototype/index.html`: offline interactive reference; choose a viewport, switch screens, select slots, test depth controls, open category menus. A local server is recommended: `python3 -m http.server 8894` from this folder, then open `http://localhost:8894/prototype/index.html`.
2. `layouts/OVERVIEW-home.png` and `layouts/OVERVIEW-saves.png`: phone, landscape, tablet and browser contact sheets.
3. `layouts/*.svg`: separate full-size editable layout masters. Keep them in this folder structure so shared art/font paths resolve.
4. `assets/asset-manifest.json`: actual reusable files, dimensions, densities and nine-slice insets. `assets/assembly-recipes.json` explains stacking.
5. `assets/index.html`: visual catalog with direct links to every separate SVG/PNG/art piece.

## Contents

| Location | What it supplies |
|---|---|
| `reference` | The two untouched chosen raster references. |
| `assets/art` | Separate dungeon header illustration, transparent logo, transparent footer foreground, dark brick backdrop tile, transparent example run-character sprite. |
| `assets/svg` | Editable button states, frames, individual fills/rims/highlights/keylines/corner inlays, blue diamond, icons, masks, textures, gradient swatches, progress pieces, literal nine-slice tiles. |
| `assets/png` | Matching real-alpha PNG alternatives. Icons export to 512px; skin/layer exports generally 4× logical size. No text labels baked into button skins. |
| `assets/fonts` | Local Jersey 15 TTF/WOFF2 and the supplied license. |
| `source` | Editable authoritative skin, icon, layout and state-transition code, plus example data. |
| `prototype` | Interactive presentation of both menus. It emits integration events; it does not run gameplay or touch real saves. |
| `layouts` | Twelve lightweight SVG masters, placement metrics and two contact sheets. Raster art is shared, not embedded repeatedly into every layout. |
| `docs` | Flow, responsive rules, data binding, asset usage, provenance and QA notes. |
| `tools` | Rebuild, export, geometry/logic validation and file-integrity scripts. |
| `qa` | Validation reports. Large temporary render intermediates are omitted from the ZIP; rebuild them with the export script. |

## Decisions that must survive implementation

- Preserve the illustrated dungeon's personality: logo, arch, party, statues, torches, banners, and footer props. The controls use the restrained Living Rune metal borders and small blue diamond accents.
- Continue on the main menu opens **three save slots**. Only an occupied card offers Continue/resume.
- New Game appears **once**, beside Back on the save-slot screen. Both buttons use the same geometry, normal steel skin, size, type and icon scale. No purple exception for New Game.
- Every occupied slot shows **that run's actual full-body character sprite**, not a dungeon/location screenshot. The red wizard asset is example data, not a rule that all runs use a red wizard.
- No New Game control on the main menu or inside the empty slot cards.
- Cards / Market / Journal / Character are consolidated navigation categories; their child destinations remain available.
- Continue stays a normal 48-unit button. Do not make it a billboard, change the selected arrangement into earlier proposals, or create a large vacant block at the bottom.
- Reflow for landscape and tablets. Do not scale a portrait screenshot to fit them.

## What is editable

Button/frame/icon construction is editable SVG and code. Labels, resource values, health, depth, XP, selection, and sprite bindings are live data. The original concepts are flattened artwork: there are no recovered PSD/Figma source layers. The separated raster art in this package was newly generated from the references to make implementation practical, and can be replaced by existing game art while retaining the layout. It is not claimed to be pixel-identical extraction. Read `docs/PROVENANCE.md`.

All117 SVG pieces remain. Eight identical PNG copies were removed;117 asset IDs now use109 unique PNGs through the manifest. The catalog links to the shared files, and rebuilding applies the same deduplication automatically.

The contact sheets/layout SVGs are implementation references, not proof of pixel-for-pixel parity with the two paintings. The approved paintings govern appearance; the documented flow and responsive geometry govern behavior. Reconcile any differences during integration rather than using a screenshot as the interface.
