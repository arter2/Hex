# Hexmancers — Living Rune / Whisper UI handoff

Build the approved compact dungeon HUD and expanded log. The log rises **above** the action row; all four equal buttons remain visible. This package also supplies matching expanded-map and pause proposals, complete responsive layouts, editable components, fonts, and a working visual reference.

## Corrected editable package — v2

Start with `../06-build-spec/EDITING_GUIDE.md`. Token JSON is now a real build input; vector layers are named; assembled modules are separate; the live-data controller and example are in `../09-runtime-kit`. The original reference boards are unchanged.

## Give Claude these files first

1. `CLAUDE_BUILD_PROMPT.md` in this folder.
2. `../06-build-spec/IMPLEMENTATION.md` and `INTERACTION_SPEC.md`.
3. Both original approved boards in `../01-approved-references/`.
4. The relevant individual screens in `../04-responsive-views/`.

Open `../05-prototype/index.html` to explore the states and handedness. The prototype works locally without an internet connection. A local web server is recommended; see `../07-scripts/REBUILD.md`.

## What is included

| Folder | Contents |
|---|---|
| `01-approved-references` | The two untouched concept boards, plus eight separately cropped native-resolution views. |
| `02-masters` | Editable icon/component SVGs, design tokens, and 48 individual full-screen SVG layout masters. |
| `03-assets` | Separate SVG assets, true-alpha PNGs at 1×/2×/3×, local fonts and license, 48 transparent HUD SVGs, and a demonstration backdrop. |
| `04-responsive-views` | 48 individual lossless @2× screen renders, covering six viewport profiles × two hands × four states. |
| `05-prototype` | HTML/CSS/JavaScript visual reference with working log open/close/scroll, map and pause states. Gameplay actions are explicitly demo stubs. |
| `06-build-spec` | Integration pointers, exact responsive rules, interactions, asset inventory, acceptance criteria and proposal decisions. |
| `07-scripts` | Rebuild/export/validation scripts. |
| `09-runtime-kit` | Dependency-free controller, styling, live-data example and integration instructions. |
| `08-new-concept-views` | Separate image-generated expanded-map and pause art-direction proposals. |

## Source versus reconstruction

The approved images were created as flattened raster concept boards. They do **not** contain recoverable PSD/Figma layers. Those originals are included unmodified. The SVG components, layout masters, prototype and exports in this handoff are newly authored, editable reconstructions of the approved direction. They resolve geometry, typography and states; they are not falsely labeled original layered artwork.

Preserve the original boards' visual character: smoky translucent surfaces, restrained steel edges, gold for Strike, cyan rune details and compact pixel typography. The original boards remain the appearance reference. Written behavior and responsive dimensions take precedence over accidental spacing or glyph errors in generated concept art. The reconstructed SVG masters are the implementation starting point, and can be polished against those appearance references.

The new map/pause paintings are supplementary proposals, not evidence of user approval. Their image-generated aspect ratios and copy spacing are not authoritative. Use the exact-size SVGs and @2× responsive renders when implementing.

## Target project

- Repository: `arter2/Hex`.
- Requested foundation: Claude's taller-wall work, branch `dungeon-redesign`.
- Reviewed snapshot: `98d4b844ad9884684bbb143b23ed760754132136`, build v214.
- Verify the current branch and working tree before changing anything. Preserve subsequent work; do not reset to this snapshot.
- This handoff does not change or include the game repository. It is the UI build package.

## Hard requirements

- Portrait first; no joystick added.
- Exactly one horizontal four-button row. Never a 2×2 grid.
- Left: Strike / Search / Disarm / Bag. Right: Bag / Disarm / Search / Strike.
- All four buttons share the same size and touch area. Strike differs by gold emphasis.
- Closed log: one complete line above the entire row, with only a faint clipped second-line hint beneath it.
- Open log: darker translucent, scrollable panel above the row, roughly the lower third. Keep buttons visible.
- Compact HP; `D1 · F1/4` immediately below, with status icons adjacent on the same baseline.
- Idle button fill approximately 50% opaque; pressed fill 100% opaque. Keep icon/text fully legible.
- More room on larger screens reveals more dungeon; it does not make the HUD huge.

See `../06-build-spec/DELIVERY_STATUS.md` for what was checked and what still needs in-game validation.

## Status coverage

The complete sourced status/state set is in `10-status-library`: 106 editable icons, neutral SVG variants, 24/48/72/512px alpha PNGs, the original ten game status SVGs, a visual catalog and source-to-icon mappings. Read its README and STATUS_MAP.md. Wire real statuses through `data.statuses`; preserve the compact depth-adjacent row and overflow instead of retaining the two sample status glyphs. Keep player, enemy, card and world-state meanings distinct.
