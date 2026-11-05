# Responsive rules

All dimensions below are logical CSS/game UI units, not exported PNG pixels. A4× skin still occupies48 logical pixels in height.

| Profile | Viewport | Main menu | Save menu |
|---|---:|---|---|
| Phone portrait |390×844| Hero above content; stacked run controls;2×2 category navigation. | Three cards stacked; equal adjacent footer buttons. |
| Tall phone |412×915| Same system with modest additional scene room. | Same stacked cards. |
| Phone landscape |844×390| Illustration left; run controls and four category rows right. | Illustration left; three compact save columns right; footer below. |
| Tablet portrait |834×1194| Hero above bounded workbench; run column beside category rows. | Three save columns under hero. |
| Tablet landscape |1194×834| Scene left; menu workbench right, centered vertically. | Scene left; three save columns right. |
| Browser |1440×900| Same bounded landscape composition. | Same shared save composition. |

`layouts/*.svg` gives full-size visual examples, and `layouts/layout-metrics.json` records each clickable rectangle. `source/render.js` is the single source used for both those masters and the preview. It chooses layout from available width/height, not a hardcoded device-name lookup.

## Breakpoints and measurements

- Minimum supported width320; minimum demonstrated height320. Smaller browser windows may scroll. Do not shrink the interface below its touch/readability bounds.
- At width740+, use the wider workbench / three save columns. At a landscape ratio with width740+ and height<550, use a side illustration. Larger landscape windows also use the side composition. Narrow short landscape windows keep a compact upper illustration and vertical scroll, avoiding impossibly thin columns.
- Main content max-width820 in upper-hero arrangements; screen insets12 on phones,24 on larger views. Gap8; major sections may use12–16.
- Buttons and interactive rows: minimum48×48 logical target. Glyphs typically16–24. Text is not upscaled with the entire background.
- Main run card:232 logical height in the example, allowing non-overlapping touch targets for depth, Details and Explore/Battle.
- Landscape camp navigation becomes four equal rows; portrait keeps the approved two-column arrangement. Do not enforce the dungeon combat HUD's single four-action row on this distinct home menu.
- Landscape save cards preserve each sprite's full body. They do not stretch a portrait card into a wide strip. Back/New Game remain equal-width siblings.
- Respect `env(safe-area-inset-*)`; the demo includes top/bottom safe-area padding. Integrating full-bleed containers should account for left/right insets and notches too.
- When computed content is taller than the viewport, keep all controls in the scrolling region. No `overflow:hidden` clipping of actions or rigid artwork heights. The background can crop; text and targets cannot.

## Art placement

The hero scene, logo and footer are separate images. The logo overlays the scene. The decorative footer sits behind the controls, never intercepts input, and may crop at the outer environment edges. Fit character sprites with `contain`/meet, never cover. In short landscape the complete scene becomes a compact side illustration; the source portrait screenshot is never stretched or used as the functional UI.

Larger views reveal more environment and gain columns; they do not turn Continue into a huge billboard. Keep its48-unit normal height. Moderate extra decorative space on a tablet is acceptable; a large unexplained empty region separating related controls on a phone is not.

## Rotation / resizing

Preserve selected slot, chosen depth, current screen and keyboard focus identity through reflow. Recompute geometry on resize. The preview demonstrates this with one shared render function. During production integration, bind resize/orientation events to the existing UI system, not to save-file mutations.
