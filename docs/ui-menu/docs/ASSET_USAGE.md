# Separate pieces and assembly

Every file's exact dimensions/path are recorded in `assets/asset-manifest.json`. SVG and PNG are alternative representations, not extra screen designs. Raster art is stored once and referenced by every layout.

Identical PNG surfaces/corner inlays share one file. The manifest retains all117 semantic asset entries and points them to109 unique PNGs; `pngAliases` records retired duplicate filenames. Resolve PNG paths through the manifest or asset catalog. The exporter automatically deduplicates again after rebuilding, so duplicates do not return.

## Main screen

| Part | Assembly |
|---|---|
| World / brick wall | `assets/art/brick-tile.png` repeat backdrop, dark overlay; `hero-scene.png` as upper or side art. |
| Title | `assets/art/logo.png`, genuine alpha, independent of hero scene. |
| Bottom props | `assets/art/footer-foreground.png`, alpha, behind controls and anchored at bottom. |
| Save strip | Steel surface/rim, small top-left blue diamond, live slot/name/HP/resources and separate icons. |
| Continue | Cyan skin + small `icon-play` + live label,48 logical height. Blue diamond at outer lower-left in portrait. |
| Run tray | Steel run-panel skin or layers; top-center diamond; cave identity glyph, live location/depth text. |
| Depth controls | Same shared button skins, separate back/next glyphs. Nodes are separate progress assets, not tiny tappable controls. |
| Run info | Separate leaf/fire glyphs, short live weakness text, Details action. |
| Explore / Battle | Two equal skins; map/battle glyphs and editable labels. |
| Camp tools | Same button skin; Cards/Market/Journal/Character glyphs. Badge remains separate live text and backing. |
| Settings | Same full-width shared skin, centered gear + label. No New Game here. |
| XP | Separate track/fill; label remains live. Clip fill by the validated ratio. |

## Save screen

Build three reusable `SaveSlotCard` instances using steel/selected-cyan frames. The empty placeholder uses `icon-empty`. Occupied cards use `avatar-frame` plus the **per-run full-body character sprite**, and separate live text/resources. The sample sprite is a transparent red fire wizard.

Only occupied cards include Continue. Empty cards select a slot. Back and New Game share the exact same steel button skin and48-unit height; each occupies half the footer row with an8-unit gap. New Game appears only once.

## Construction layers

`*-surface.svg`: smoky face. `*-rim.svg`: dark outer edge and steel gradient rim. `*-highlight.svg`: narrow upper edge lighting. `*-keyline.svg`: subtle inner line. `*-corners.svg`: tiny bronze inlays. `*--border.svg`: a complete transparent border overlay with no face. `blue-diamond.svg`: separate faceted crystal accent. No text, scenery or fixed resource values are baked into skins.

Choose either the complete skin or its separate layers. Do not stack both. The authoritative procedural construction is `source/skins.js`; change colors and geometry there, then rebuild. Icon masters are `source/icons.js`; generated individual SVGs provide editor-friendly alternatives.

## Resizing without distorted corners

Insets are `[top,right,bottom,left]` = `[8,8,8,8]` logical units for supplied frames. For a4× PNG, source insets are32px; destination corner widths stay8 logical units. Use nine-slice / border-image / engine slice regions, or redraw with `HexSkins.skin(width,height,tone,state)`. The latter preserves small5-unit chamfers at arbitrary sizes and is used by the layout reference.

```css
.menu-frame {
  border: 8px solid transparent;
  border-image-source: url('../assets/png/run-panel-steel--border.png');
  border-image-slice: 32;
  border-image-width: 8px;
  border-image-repeat: stretch;
}
```

Physical9-piece tiles are also supplied for a steel button and run panel: `--slice-tl/top/tr/left/center/right/bl/bottom/br`. They are optional alternatives. Never stretch corner tiles independently in both axes, scale an entire screenshot as a UI, or put a checkerboard behind alpha assets.

## Fonts, textures and density

Install `assets/fonts/Jersey15-Regular.ttf` to edit SVG text in desktop vector tools. Browser preview uses the local matching WOFF2. Gradient stops/colors are in `assets/design-tokens.json`; individual swatches and a subtle repeatable grain overlay are included. The generated brick texture is an art reconstruction; visually review its repetition in the actual game scene.

UI SVGs are resolution-independent. PNG glyphs are512px alternatives, with logical size24. Most skins/layers export at4×. Render PNGs at their logical dimensions rather than allowing a512px icon to become512 logical pixels. Transparent logo/avatar/footer retain genuine alpha. Keep color icons unfiltered unless intentional tinting is part of the state; avoid tinting full skins and text together.

## Rebuild

Requirements: Node18+, Python3, Pillow, Inkscape. No network/package installation is needed to use the supplied exports.

```sh
node tools/build.cjs
python3 tools/export.py
node tools/check.cjs
python3 tools/verify.py
```

`build.cjs` writes vectors, manifests and twelve SVG layout masters. `export.py` renders PNGs, physical slices, temporary QA renders and the two contact sheets. Ensure Jersey15 is discoverable by Inkscape/fontconfig for exact preview typography. The downloaded concept references and generated art are not overwritten by these commands.
