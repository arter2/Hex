# Menu kit v2: gap report

Date: 2026-11-06. Source: `hexmancers-unified-menu-kit-v2` (parts 1 and 2), compared with the game at v229.

This compares the kit's shared component rules and its 23 reference screens with the menus the game
has today, then lists what this change builds and what it leaves for later.

**Out of scope, by request:** the dungeon (`#scrExplore`, its HUD, `#xDialog`, the dungeon merchant and
anything opened while a run is active), the battle (`#scrBattle`, pause, run sheet), and the start
screen and camp (`#scrMenu`, `#scrCamp`). Dev tools (Card lab, Movement lab, Debug) and Duel are also left
alone: the kit removed them from its package.

## Summary

The game's menus already have the structure the kit asks for. They have a Back button at the upper left
with the title beside it, an X on overlays, Jersey 15, nine stat dials with a numbered tape, blue baseline
ticks and a pink notch, a deck above a library drawer with a grip, Buy and Sell tabs, and one save-slot list
used for Continue, New game and Manage.

What differs is the **construction**: the frames, buttons and icons, which is exactly what the kit says to
standardise.

| Area | Game today | Kit v2 | Gap |
| --- | --- | --- | --- |
| Frames | Generated pixel textures in `uikit.js`: carved stone, blue stone buttons, brown leather and brass on the Character screen. | One steel SVG frame: 1.25 border, 0.5 highlight, 5 chamfer, 8 slice, over a smoke gradient. Warm and purple are face variants only. | Replace on every in-scope menu. |
| Buttons | Blue stone bitmap, a separate pressed bitmap, text shadow. Primary and ghost differ by texture. | One 48-high button: idle, hover, pressed, focus (dashed inset), selected and primary (thin cyan edge), and disabled. No blur. | Replace. |
| Back / X | Pixel-art arrow and X drawn as masks on a blue stone tile. The Character X is a red tile. | Cream chevron-left and X from one 1.6-stroke 24-grid family, both on the same 48 square. | Replace and unify (the red X goes). |
| Type | Jersey 15, plus VT323 for hints and notes, at mixed sizes (12 to 24 px). | Jersey 15 only. Title 23, section 20, control 18, body 15, value 25, metadata 13. | Apply the size roles and drop VT323 on menus. |
| Icons | Emoji for stats (✊ 🏹 ❤ 📖 👁 💬 🌑 ↻ ✦) and pixel icons. | 50 line glyphs with aliases: Wisdom=eye, Charisma=speech, Stealth=hood, Recharge=reset-arrow, Casting=spark. | Use the kit glyphs for stat rows. Card, item and gear art stays as it is. |
| Stat dial | Plain dark strip with a glowing notch and ◄ ► arrows. | dial-track face, rounded edge shade, full-height gold selector, ticks: blue base, gold confirmed, mint new. | Restyle (the logic already matches). |
| Creation footer | Reset beside Points; one "Choose your deck ►" button. | Reset / Random / Next after the full form. | Add Random, move Reset to the footer. |
| Level-up footer | Later / Done. | Reset / Apply. Close with X. | X = Later (points kept), footer Reset / Apply. |
| Save slots | Plain rows, Back button, and a cyan glow on the current slot. | Shared slot card, purple New Game face, thin cyan selected edge, no glow. | Restyle. New-game actions get the purple face. |
| Deck builder | Zoom pill (50/75/100%), red Remove All pill, OK. | No zoom; Auto-build; library drawer; Done. | Remove zoom (fixed at the old 75% default) and restyle the pills. |
| Shop | "Wares" / "Sell" tabs; purchase sheet with Back and Buy. | "Buy" / "Sell"; sheet shows Balance, Cost and After purchase with Cancel / Buy. | Rename the tab and add the balance rows. |
| Bounty / Mastery | Rounded reward pills, rows with a coloured left bar. | ObjectiveRow frame, shared Progress, square ResourceInline badges. | Restyle. |
| Bestiary | Empty list with a line of text. | EmptyState with a "Return to camp" action. | Add the empty-state action. |
| Character / Bag | Leather and brass frame, red X. | Muted umber smoke (warm face), gray steel, standard X. | Restyle at camp. Inside a run the bag is left as is (dungeon). |
| Settings | One long list; text buttons cycle values. | Tabs (Display / Audio / Controls / Accessibility), chamfered toggles, selects. | Restyle rows and buttons. **Tabs not built** (see below). |
| Element colours | Light `#fff0b3`, Storm `#ffe24d` (`COLORS` in `cards.js`). | Light ivory `#f3f1e7`, Storm gold `#f5cb60`. | **Not changed.** `COLORS` is shared with the battle (see below). |

## Screen by screen

| Kit screen | Game element | Status after this change |
| --- | --- | --- |
| 01 Home | `#scrMenu` | Out of scope (start screen). |
| 07 Save selection, 08 Manage | `#slots` overlay | Kit frame and buttons, purple New-game actions, selected current slot. |
| 09 Create character | `#scrNewChar` | Kit header, race tiles, dials with kit glyphs, Reset / Random / Next footer. |
| 10 Choose first cards | `#scrStart` | Kit frames and buttons. See the question below. |
| 11 Settings | `#settings` | Kit frame, rows, buttons. No tabs. |
| 14 Deck builder | `#scrDeck` (and the legacy `#scrBuilder`) | Zoom removed, kit pills and header, Done. |
| 15–17 Card detail | `#detail`, `#dkPeek` | Kit dialog frame and buttons. The card frame stays as content. |
| 16 My cards | `#scrCollection` | Kit header, tabs, filters, search. |
| 18 Shop, 19 Purchase sheet | `#scrShop`, `#shopSheet` | Buy / Sell tabs, kit product tiles, balance rows, Cancel / Buy. |
| 20 Pack reveal | `#packOpen` | Kit dialog frame and buttons. |
| 21 Bounty board | `#scrBounty` | ObjectiveRow, Progress, badges. |
| 22 Bestiary | `#scrBestiary` | Kit rows and an empty state with Return to camp. |
| 23 Mastery | `#scrMastery` | Kit rows and Progress. |
| 24 Character and Bag | `#bagUI` (at camp) | Warm face, steel frame, kit X, kit slots and tabs. |
| 25 Level-up | `#lvlUp` | Kit dials, X = Later, Reset / Apply. |
| 26 Training picker | `#labPick` | Not changed: it opens the dev labs. |
| 39 Dungeon merchant, 40 Object dialog | dungeon `#bagUI`, `#xDialog` | Out of scope (dungeon). |

## How it is built

- `game/menukit/`: the kit's eight SVG primitives, four of its icons for CSS masks (Back, X, select arrow,
  bag) and `menu.js` (`HexMenuUI.icon()` and the glyph table), all copied unchanged. The kit's Jersey 15
  file is byte-identical to `game/fonts/jersey-15-latin-400-normal.woff2`, so the game's copy and its
  `OFL.txt` are used.
- `game/menukit.css`: the shared layer. Every rule is under `.mk`, so it only reaches screens and overlays
  marked `mk` and cannot change the dungeon, battle, start screen or camp.
- The `mk` class is set in `index.html` on the in-scope screens and overlays. The bag gets it only
  when it opens outside a run.
- Behaviour changes are small and keep the game's own data and rules: creation Random, the level-up
  Reset / Apply / X, the deck zoom removal, the shop tab label and balance rows, the Bestiary empty-state
  button, and the kit's glyphs on the stat rows.

## Not done, and why

1. **Ivory Light and gold Storm.** These colours sit in `COLORS` (`cards.js`), which the battle also
   reads for chips, buffs and cards. Changing them would change the battle, so they are left alone.
   If you want them, it is a two-value change in `cards.js`.
2. **Settings tabs** (Display / Audio / Controls / Accessibility) and on/off toggles. The settings are
   cycling buttons that `keys.js` reads and writes. Regrouping them under tabs is a separate
   restructure; this change restyles the existing rows.
3. **"Start screen".** This change reads it as the title screen (`#scrMenu`) and restyles
   `#scrStart` ("Your first cards", kit screen 10) as a menu page. If you meant `#scrStart`, remove
   `mk` from that section in `index.html` to undo it.
4. **Kit-only content.** The kit's mockups show content the game does not have, such as the
   Mastery lock tiles, the Card detail "Add to deck" footer and the creation tagline. Per the handoff, no
   mechanics or data are invented from the pictures.
5. **Tablet and landscape layouts.** These keep the game's existing breakpoints, now drawn with the
   kit's components. Each family is not yet reflowed as in the three responsive references.
