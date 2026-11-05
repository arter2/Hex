# Build this Hexmancers dungeon UI

You have a complete UI handoff for `arter2/Hex`. Implement it on top of the current taller-wall branch, originally `dungeon-redesign`, preserving later changes and all existing gameplay rules. The reviewed reference commit was `98d4b844ad9884684bbb143b23ed760754132136`; do not reset to it.

Read `00-start-here/README.md`, `06-build-spec/EDITING_GUIDE.md` and `09-runtime-kit/README.md`, then the remaining build specifications. Inspect the two original boards in `01-approved-references` and the individual responsive renders. Use the SVGs/components and local fonts in `02-masters` and `03-assets`. The source code in `05-prototype` is a geometry/interaction reference, not a replacement game engine.

Implement these four states: compact HUD, expanded log, expanded minimap, and pause. Support left/right handedness, phone portrait/landscape, tablet portrait/landscape, and browser resizing. Keep the tall-wall dungeon, existing movement controls, camera and renderer. Do not replace the live world with the illustration backdrop.

The approved design is Living Rune with Whisper Frame lightness. Four equal small translucent buttons stay in ONE HORIZONTAL ROW. Left hand: Strike/Search/Disarm/Bag. Right hand: Bag/Disarm/Search/Strike. Keep minimum 48 CSS-pixel targets and consistent gaps. Strike is gold, not larger. Pressed faces become fully opaque.

Closed log: one readable horizontal line immediately above the row, only a fading hint of the preceding line below it. Journal icon on the active-hand edge. Hold 400 ms to open history; also offer tap and keyboard access. The expanded log rises above the buttons and never replaces them. It latches open after release and supports independent scrolling without moving the character. Keep the world visible through the darker panel and do not dim the upper dungeon globally. Use the interaction spec to implement history retention and scroll behavior.

Top HUD: compact HP/value meter, level, gold and menu. `D1 · F1/4` below HP, immediately followed by horizontal status icons. Put the full location name in map/pause and optional accessible details rather than a permanent long header. Keep the minimap small until opened.

Restyle the existing expanded map and shared pause menu. Preserve explored-only map navigation, fog rules, pause/resume semantics, save/load conditions, confirmation flows, fullscreen support checks and camp/flee costs. Map and pause are proposed extensions of the approved style; follow the supplied implementation defaults, keeping every existing action discoverable.

Inspect these integration points in the CURRENT tree before editing: `game/index.html` dungeon and pause markup; `game/style.css`; `game/explore.js` (`xLog`, `xSay`, `xMini`, `xMapOpen`, `xMapClose`, `xMapTap`, `xPause`, `xTopUI`); `game/ui.js` (`openPause`, `closePause`, `pausePoint`, existing button handlers); existing UI/font assets. Names may have changed since the reviewed snapshot.

Use one shared component/token system so pause, map and dungeon feel related to battle, Bag and the title screen. Reuse this geometry and motif system where appropriate; do not redesign unrelated game mechanics or card art.

Deliver an implementation, not another concept board. Keep the changes reviewable, provide a concise summary and screenshots for the device matrix, and run the acceptance checklist. Specifically verify real touch input, rotation, safe areas, press/disabled states, log scrolling, map routing, pause nesting, save/load availability, camp/flee confirmations, and no click-through movement or stuck pause state. State any untested device behavior honestly. Ask only for unresolved product decisions that block implementation; the proposed defaults are documented.

The v2 package includes a live-data renderer and callback controller. Use this as an integration starting point while preserving the existing game rules. All UI artwork is editable vector/source; appearance references remain flattened. Do not use full-screen raster renders as runtime UI.

## Status coverage

The complete sourced status/state set is in `10-status-library`: 106 editable icons, neutral SVG variants, 24/48/72/512px alpha PNGs, the original ten game status SVGs, a visual catalog and source-to-icon mappings. Read its README and STATUS_MAP.md. Wire real statuses through `data.statuses`; preserve the compact depth-adjacent row and overflow instead of retaining the two sample status glyphs. Keep player, enemy, card and world-state meanings distinct.
