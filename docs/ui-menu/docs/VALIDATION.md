# Validation record and acceptance checks

## Completed for this package

- Geometry and navigation model tested at16 viewport sizes × two screens =32 cases, including390×844,412×915,844×390,834×1194,1194×834,1440×900 and smaller edge cases.
- Interactive rectangles checked for48-unit minimum target dimensions, horizontal overflow, clipping and overlap. Nested occupied-card Continue is an intentional child of the card selection target.
- Main Continue opens saves; Back returns home; occupied slots resume; empty slots cannot resume; New Game chooses an empty slot and never emits an overwrite request; all-full/all-empty cases tested.
- Depth selection bounds, Explore/Battle event modes, escaped text and per-run avatar path binding tested.
- Every SVG parses, PNG dimensions/alpha are verified, and all shared relative art/script/font paths resolve. Character/avatar/logo/footer transparency is verified against their actual alpha channels.
- Twelve static layout masters were rendered; phone portrait, phone landscape and tablet arrangements visually reviewed. Contact sheets are included. The large intermediate PNG renders are not duplicated in the ZIP.
- Archive checksum/CRC and the included SHA256 inventory were checked before saving.

Reports: `qa/logic-and-layout.json` and `qa/file-validation.json`.

An optional `node tools/browser-check.cjs` harness is supplied for an environment with Playwright and its Chromium installed. It serves the folder locally and checks both screens across the six principal profiles, footer equality, navigation, New Game targeting and the all-full state. It was not run here because the browser executable was unavailable.

## Explicit remaining integration checks

No usable browser executable was installed in the handoff environment. Therefore the interactive HTML has not been exercised or screenshot-tested in a browser. Static vector renders and pure-state tests do not establish browser/font/focus parity. Claude must run the actual project in its browser/device environment and verify:

1. All supplied viewport sizes, real safe areas, rotation, scrolling, and preservation of screen/slot/depth state.
2. Keyboard focus and restoration, Enter/Space/Escape, screen-reader labels, disabled states and dialog behavior.
3. Long names, translated labels, extreme currency values, missing sprites and real game save-data shapes.
4. Actual run-loading, character/deck creation, depth/mode start and all child category routes; no save overwrite from UI selection.
5. Artwork and type fidelity against the two approved references at actual phone size. The reconstructed icons/background are editable implementation starting points, not proof of pixel-identical painting recovery.

The preview intentionally emits gameplay/navigation requests instead of pretending to run the full game. No game repository was changed, committed or pushed by this package.
