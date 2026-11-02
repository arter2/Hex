# Card assets

## v179: one card, built from cards/contract.json

Every full card is now the 240x434 canvas. Its geometry (frame bands, corners, dividers, panels, every slot, the type
sizes) lives in `contract.json`, measured off the approved three-card mockup; `tools/card-build.py` makes the frames
(`frames/card/`), textures (`textures/card/`), state glows (`glows/card/`), holo trims (`foils/card/*/trim*`), state
badges (`badges/card/`), `card-geo.css`, `card-geo.js` and `icons.js` from it and `palettes.json`. Don't edit those by
hand: change the contract or palettes and run `python3 tools/card-build.py`. `game/card.css` is how the card looks;
`cardEl` and `kitFit` in `ui.js` build and fit it. Still used from the kit: `icons/` (shapes; drawn inline in the card's
colour), `symbols/`, `effects/expanded/` and `foils/expanded/*/art*` (the holo art foils, placed on the art window),
`fonts/`. The kit's tiles and badges the generator starts from are in `tools/card-src/`. The compact/expanded frames,
backgrounds, glows, badges, textures, `layouts.json` and the molten/plaque-mask tools are gone (the generator does
their work). See docs/card-frame-report.md.

## Before v179

From *Hexmancers complete card kit v2* (`hexmancers-complete-card-svg-kit-v2.zip`): the subset the game draws, unchanged.
Frames, colour backings and readability shades, the 24 material textures (both modes), foils and foil effects (holo legendaries), enchanted/buffed glows and state
badges, the 44 colored icons, the hero and rarity stars, and the kit's fonts (rules font under the DejaVu licence in
`fonts/`). `layouts.json` and `palettes.json` are the kit's coordinates and colours; `cardEl` in `ui.js` and the
"cards (v158)" block in `style.css` place every slot from them.

One change from the kit: each texture SVG's `texture-ink` group opacity is 0.8 instead of the kit's 0.12 (the kit's
own control for texture strength). To change it again: `sed -i 's/id="texture-ink" opacity="0.8"/id="texture-ink" opacity="X"/' game/cards/textures/*/*.svg`.

Holo foils (`foils/*/COLOR/`): each colour's hue is pulled 40% of the way round the colour wheel toward that card
colour's accent (palettes.json), brightness and saturation kept, so the rainbow leans toward the card's colour.

## v2.1 update (v161)

Frames, the 48 card textures and layouts.json come from card kit v2.1: the count plaque has its own face, bezel and riveted
brackets, and the textures now run into the bottom strip around it. Texture ink is still 0.05 (lowered from the kit's
0.12, v159) and the foils keep the v160 hue shift (v2.1 didn't change them). The count text sits inside the plaque's
56×13 opening (style.css "cards (v158)" block). The kit's separate footer/rail/corner parts aren't copied: the frames
already include them.

## v2.2 update (v162)

Card kit v2.2 (the full frame redraw): bricked stone rails, orange copper corner plates, a stepped accent line that wraps
the count plaque, dark field separators with rivets, rounded panels, darker bases, new trim masks in the foils/glows.
Copied: frames, backgrounds, textures (compact/expanded), foils, effects, glows, layouts.json, palettes.json.

- The uploaded zip was cut off before its end; 546 of 612 files came through intact (checksums match). The 48 card
  textures were in the missing part. They were rebuilt from the v2.1 patterns plus the v2.2 clip shapes embedded in
  `components/*/COLOR/footer-assembly.svg`, and all 48 match the v2.2 SHA256SUMS exactly. Missing and unused by the game:
  templates, footer/material textures, runtime/cards.js (identical to v2.1), symbols (identical).
- Texture ink lowered to 0.05 again; foils re-tinted 40% toward their accent (v160).
- Fix to the kit: its holo trim covered the stone rail behind the count plaque, so the rainbow washed out the count.
  The plaque (x87-153) is cut out of trim-clip in all 32 trim foils.
- The stat row's separator (.k-sdiv, ours) is now a thin dark line in the card colour; red's UI accent is v2.2's #ff9255.

## v163 changes on top of the kit

- **Molten accent line and glowing dividers** (`tools/card-molten.py`, run on game/cards): in every frame the inner trim's
  dark band and its 1-px line are filled with pixel noise patterns built from the colour's dark/accent/light
  (palettes.json), so they read as molten metal with hot spots. Each field divider's accent row is a glowing segment pattern
  with grey metal breaks and a faint accent halo row above and below. Vertical separators are dark in the card colour.
  Re-running on new kit frames is safe (it skips frames that already have the patterns).
- **Count plaque stays black** (`tools/card-plaquemask.py`): every holo trim and every enchanted/buffed glow is masked
  over layouts.json `count_bounds`, so no rim effect crosses the count.
- **Texture behind text**: the texture layer now sits above the readability panels (style.css), so it shows faintly in
  the text areas; its strength is still the 0.05 texture-ink.
- Large cards now use the expanded buffed glow, and enchanted + buffed uses the kit's split rim (style.css "rim states").

## v186: the short card

Hands and grids use the short card: `contract.json` "short" (240x362) replaces the full card's canvas, bands, panels, dividers and slots; `tools/card-build.py` writes its layers under `frames/short`, `textures/short`, `glows/short`, `foils/short` and `badges/short`, and its slots into `card-geo.css` under `.card.kit.compact`. The texture strength is now set by the build (`TEXTURE_INK`, 0.8), so a rebuild keeps it.
