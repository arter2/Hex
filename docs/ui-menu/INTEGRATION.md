# Menu handoff: how it is built into the game (v230)

- `game/menu.js`: the main menu (`hmHome`, called by `openMenu()` in ui.js) and the three save slots
  (`openSaves`, screen `#scrSaves`). It only calls existing game functions: `useSlot`, `openCamp`,
  `openNewChar`, `enterExplore`, `fight`, `openSettings`, `affinityHTML`, and the camp's own buttons for the
  category destinations. It never writes a save.
- `game/menuskins.js`, `game/menuicons.js`: the handoff's `source/skins.js` and `source/icons.js`, unchanged.
  Frames are `HexSkins.skin()` drawn small and nine-sliced 8 units in (CSS `border-image`), so corners never
  stretch. Frost, Storm, Light and Shadow element glyphs are added in menu.js in the same style.
- `game/menu.css`: layout and states. Sizes are logical; the menu follows the Text size setting (`--tz`).
- `game/art/menu/*.webp`: the hero scene, logo, footer and brick tile, re-encoded from `assets/art` (6.3 MB to 330 KB).

Data bindings: the save strip shows the slot in use, its active deck's name, max HP (120 + gear; between runs
you are at full health), gold, unique cards owned and Arcane Essence (the purple crystal). The run tray shows
the area of the chosen start depth, the deepest depth reached, "Floor f / 4 · Boss at d" (the area's floor and
its boss depth), the area's element and weakness, and Run details with the game's own rules text. Each used
slot card draws that run's own character (`lookSprite(save.look,'front')`).

Flow: Continue and the save strip open the slots. A used slot's Continue loads that slot and goes to its camp
(as the old Continue did). New game takes the selected empty slot, else the first empty one; with all three
used it is disabled with the reason shown. Deleting a save moved to Settings › Save slots › Manage (the
earlier slot list). Duel a friend stays in camp (it is not one of the four menu categories).
