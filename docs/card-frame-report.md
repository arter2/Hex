# Card frame parity: v179 report

What the card-frame spec asked for, what was built, how it was checked, and where it differs from the mockup on purpose.
The visual target is the approved three-card mockup (Ember Dart / Undertow Charm / Monkey's Fruit Stash). Images are in
[card-frame/](card-frame/).

## What changed

- **One card, one shape.** Every full card is the 240×434 canvas (width/height 0.553, the mockup's). The compact
  (240×392) and expanded (240×456) frames, their layouts and every CSS rule that assumed them are gone. A small card
  (under 180 px wide: the hand, grids) keeps the same frame and hides only what can't be read at that size: the rules
  and the footer's words. The footer icons stay.
- **One geometry source.** `game/cards/contract.json` holds the canvas, the frame's bands, the corner assembly, the
  divider rows, the panels, every slot, the type sizes and the structural colours. `tools/card-build.py` makes
  everything from it and from `palettes.json`:
  - the 8 frames;
  - the 24 textures, clipped to the art window;
  - the enchanted, buffed and both rims;
  - the holo trims;
  - the state badges;
  - `cards/card-geo.css` (slot positions, type sizes, each colour's ramp);
  - `cards/card-geo.js` (sizes and widths for the text fitter);
  - `cards/icons.js` (icon shapes).

  Nothing else places a slot.
- **The frame**, measured off the mockup resampled to 240×434:
  - a steel edge, then a bricked stone rail;
  - one copper corner plate with a rivet, reused at all four corners with the light from the upper left;
  - a 3-unit molten accent line in the card's colour;
  - dark panels;
  - 3-row dividers (metal and molten segments) with bright end points;
  - thin separators;
  - a count plaque with a silver top bevel, copper sides and wings, and corner brackets.
- **Icons follow the card's colour.** Every functional icon (stat, footer, rarity, hero star) is drawn inline in the
  card's UI accent, with its highlight in the light tone. Icons used to be an `<img>` with fixed fills, and a CSS mask
  of a file:// SVG fails.

  New shapes:
  - Pull (magnet), Knockback (push), Applies (double chevron), Boost (arrow);
  - Burn, Freeze, Stun;
  - Uses (charge bars; it was four squares, which looked like Range).

  An enchantment's Effect shows its own keyword's icon, not a lightning bolt. The type line's inline role colour is
  gone; type, dot and role use the card's ramp. On pale Light cards, glyphs use the darker UI accent, and the Light
  element icon has a dark-ink version.
- **Type.** Cards use their own faces, with no synthetic bold:
  - `Hex Card`: Jersey 15, without the HUD's 130% `size-adjust`. Its width-to-cap-height matches the mockup's letters
    (at 29 units, "Ember Dart" measures 120 units against the mockup's 122).
  - `Hex Card Caps`: the kit's HexmancersCardPixel, uppercase only, so it is used for the type line alone. Its widths
    match the mockup's type line.
  - HexmancersRulesMono is DejaVu Sans Mono, not a pixel face, so it is not used.
- **Text fitting**, in canvas units, measured with the real font after it loads (`kitFit`, ui.js):

  | Text | Starting size | Steps down to | If it still doesn't fit |
  |---|---|---|---|
  | Name | 29 | 18 | two centred lines at 15 |
  | Type line | 16 | 10 | always whole |
  | Rules | 18 on 16.5 (3 lines) | 16 on 14.5 (4 lines), 14 on 12 (5 lines) | scrolls on the big card (fade at its foot); the full text is always in its title |
  | Footer value | 14 | 10 | — |
  | Count | 22 | 14 | — |

  Gone: character-count fitting, `overflow-wrap:anywhere`, ellipses and clipping.
- **Centring.** Rune, rank and count centre their painted ink in the plate or plaque opening. The string is measured
  with the canvas's `actualBoundingBox*`; the font box is not used. Other one-line text uses one ink offset per face.
  Text shadows are at most one unit and are not measured.
- **Footer facts, by kind of card.**
  - An Ace enchantment: Effect (its keyword, with its icon) and Applies: Next Ace.
  - A card with uses: Uses, then its keyword, otherwise whom it hits.
  - An attack: Target and Range, from its shape (`KIT_AIM`) or its lob pattern. A Snipe says Lowest HP · Any tile; it
    said First foe before.
  - Anything else: its keyword, then how long it lasts, then whom it's for.
- **Art** fills the 206×141 window with `object-fit:cover` and a per-card focus point where the subject would be cut
  (`ART_FOCUS`; Ember Dart is set). Replacing the art itself is a separate task.

## Checks

| Check | Result |
|---|---|
| Ratio at 120, 240, 396 px wide | 0.00000, 0.00000, 0.00001 relative error |
| All 1953 cards at 240 px (1 unit = 1 px): name, type line, stat and count inside their slots with 2 units clear; footer values not cut; rules fit or scroll | 0 failures |
| Rune, rank and count ink centre against the plate or plaque centre, every card (counts 3/3 and ×12) | 0 off by more than 1 unit |
| Long names | 2 take two lines (Crown of the Sea Dragon King; Sleipnir, the Eight-Legged Steed); the rest fit on one line at 18 or more |
| Type lines | all whole: 1888 at 16, 55 at 14, 10 at 13 (ACE ENCHANTMENT · STATUS fits at 13) |
| Rules | 274 at 18, 403 at 16, 1276 at 14; 464 scroll on the big card |
| States (`tools/card-states.js`) | normal, chosen, locked, enchanted, buffed, both, hero, holo legendary, wild rune and two-line name drawn; frame and ratio identical in each |
| Colours | all eight families drawn |
| Screens (`tools/card-screens.js`, 390×844 at DPR 2) | hand screen, battle, collection, deck builder, shop, detail and pack reveal drawn with no page errors |
| Overlay | `card-frame/overlay-50.png`: rails, corners, dividers, panels, plates, plaque and text slots fall on the mockup's lines |
| selftest | 23/23 |
| UI tap runners (Chromium) | Battle and hand screens: 4 of 5 sizes pass; ui-runner: 3 of 4 pass. The failures are a flaky "element is not attached" step and a dungeon-HUD tip; the unchanged v178 code fails the same step on a different size. |

Not done here:
- WebKit and physical Safari or Android: no WebKit build in this environment.
- DPR 1 screen captures. The audit is resolution-independent (canvas units); the screen shots are DPR 2.

## Differences from the mockup, on purpose

- **Type and role colours.** Both are the card's own colour, light for the role. The mockup used red for ATTACK and
  yellow for STATUS, which the spec overrides.
- **Icons.** The mockup's icons are mixed colours; ours follow the card, as the spec asks. The shapes are the game's
  icons: a sword-like attack, the kit's element pictures.
- **Text and art.** Rules are the game's real text, so many are longer than the mockup's. They step down and then
  scroll rather than being cut. The art is the game's existing art, placed in the window but not redrawn.
- **Footer centre divider.** It sits at x = 120 as the spec says; the mockup has it at about 126.
- **Measured positions.** Some differ from the handoff's proposed contract by 0–3 units:
  - dividers at 56, 90, 234, 258, 299 and 367, against the proposal's 57, 89, 234, 259, 299 and 368;
  - art window 92–232;
  - bottom accent 405–407, with the bottom rail under it;
  - plaque 403–428.

  Type sizes are the mockup's measured ones (name 29, plate 29, stat 39, rules 18, footer 14, count 22). They replace
  the proposal's starting 22/24/28/12/10/15, which were set for the HUD's enlarged face.
- **Corner plates.** They are flat 12-unit squares with a socketed rivet, as in the mockup. They are not traced pixel
  for pixel, and nor are the bricks.

## Files

- `game/cards/contract.json`: the geometry source. Run `python3 tools/card-build.py` after changing it or
  `palettes.json`.
- `game/card.css`: how the card looks. `game/cards/card-geo.css`: where everything sits (generated).
- `game/ui.js`: `cardEl`, `kitFooter`, `kitFit` and `kitInkOf`.
- Tools:
  - `tools/card-compare.js`: the three mockup cards at the mockup's positions, to overlay;
  - `tools/card-audit.js`: the catalogue audit;
  - `tools/card-states.js`: states and colours;
  - `tools/card-screens.js`: the cards on phone screens.
- `tools/card-src/`: the v2.2 kit's material tiles and state badges (the generator's inputs).
- Removed:
  - `cards/layouts.json`;
  - the compact and expanded frames, backgrounds, glows, badges and textures;
  - the old trims;
  - `tools/card-molten.py` and `tools/card-plaquemask.py`. The generator replaces them; they would have brought back
    the old bounds.
