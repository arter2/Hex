# Provenance and practical limits

## Approved raster references

- `reference/main-approved.png`: exact selected image attached to the current packaging request. It includes Settings alone at the bottom and the blue HUD diamond accents.
- `reference/continue-approved.png`: latest saved three-slot menu, resolved by exact filename from the current file record. It contains the full-body character thumbnail and equal Back/New Game footer buttons, with no New Game buttons inside slots.

These are flattened images. There is no recovered layered PSD, Figma file or native game UI source hidden inside them.

## Separate artwork supplied here

`hero-scene.png`, `logo.png`, `footer-foreground.png`, `brick-tile.png` and `run-avatar-fire-wizard.png` were newly generated using the approved artwork as references. They are implementation-ready separated art reconstructions, not claimed to be pixel-identical extraction. The logo, footer and avatar are real RGBA assets; hero and brick are opaque backdrop art.

The scene contains the five-person party as part of its illustration. Those decorative figures are not five additional gameplay sprites. The individual red fire wizard asset is the sample save-card avatar; production must bind the actual character of each run. If the repository already contains closer native title/environment/sprite assets, use those while preserving this handoff's layout and border rules.

The generated art prompt set is retained in `source/artwork-prompts.json` for reproducibility. Raster assets remain raster; their pixels are not falsely labeled editable vectors. No art animation is implied.

## Editable reconstruction

UI shapes, layers, glyphs, colors and layout are authored code/SVG reconstruction. They are intentionally separated and editable. They match the approved material/geometry language but do not claim exact pixel-for-pixel equivalence to the painted glyphs. The two original references remain the appearance standard.

Menu labels, stats, slot cards and navigation in the prototype use explicit example data. The package does not modify the game repository, audit its current branch, connect real save files, or implement gameplay behind the callback events.

## Validation boundary

The source geometry and transitions are checked across32 screen/viewport cases; exported vectors/art and static layouts are validated and visually reviewed. The local environment had no available browser executable, so the interactive HTML has not been screenshot-tested or exercised in a real browser in this delivery. Browser/device verification and live game API integration are explicit Claude acceptance tasks. Do not call those complete merely because the preview loads or a static screenshot looks correct.
