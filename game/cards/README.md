# Card assets

From *Hexmancers complete card kit v2* (`hexmancers-complete-card-svg-kit-v2.zip`): the subset the game draws, unchanged.
Frames, colour backings and readability shades, the 24 material textures (both modes), foils and foil effects (holo legendaries), enchanted/buffed glows and state
badges, the 44 colored icons, the hero and rarity stars, and the kit's fonts (rules font under the DejaVu licence in
`fonts/`). `layouts.json` and `palettes.json` are the kit's coordinates and colours; `cardEl` in `ui.js` and the
"cards (v158)" block in `style.css` place every slot from them.

One change from the kit: each texture SVG's `texture-ink` group opacity is 0.05 instead of the kit's 0.12 (the kit's
own control for texture strength). To change it again: `sed -i 's/id="texture-ink" opacity="0.05"/id="texture-ink" opacity="X"/' game/cards/textures/*/*.svg`.

Holo foils (`foils/*/COLOR/`): each colour's hue is pulled 40% of the way round the colour wheel toward that card
colour's accent (palettes.json), brightness and saturation kept, so the rainbow leans toward the card's colour.

## v2.1 update (v161)

Frames, the 48 card textures and layouts.json come from card kit v2.1: the count plaque has its own face, bezel and riveted
brackets, and the textures now run into the bottom strip around it. Texture ink is still 0.05 (lowered from the kit's
0.12, v159) and the foils keep the v160 hue shift (v2.1 didn't change them). The count text sits inside the plaque's
56×13 opening (style.css "cards (v158)" block). The kit's separate footer/rail/corner parts aren't copied: the frames
already include them.
