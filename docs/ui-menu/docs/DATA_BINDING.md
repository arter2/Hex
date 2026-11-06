# Bind real data, not reference pixels

Example data is in `source/demo-data.json`. Replace it at the adapter boundary.

| Field | Binding |
|---|---|
| `screen` | `home` or `saves`, transient navigation state. |
| `selectedSlot` | Selected slot ID1–3. |
| `depth` | Chosen unlocked start depth. |
| `slots[].id`, `empty` | Actual slot identity and occupied/empty state. |
| `name` | Run/deck display label such as Burn Rush; map to the game's canonical name. |
| `hp`, `maxHp` | Current health and capacity; numeric label stays live. |
| `characterSprite` | **The saved run's actual character sprite URL/asset**, not a location thumbnail. |
| `location`, `depth`, `deepest`, `floors` | Current location and depth state, unlocked starting-depth limit, depth count. Reconcile these fields with the game's actual floor/depth terminology. |
| `gold`, `cards`, `crystals` | Real counters; do not bake273/59/0 into textures. |
| `level`, `xp`, `xpMax`, `points` | Profile progression and live available-point badge. Clamp display ratios safely if maximum is0. |

`source/controller.js` exports a pure `transition(state,action)` function. It returns the next transient UI state and optionally one integration event. The demo dispatches a DOM CustomEvent named `hexmenus:action` whose `detail` is that event.

```js
document.addEventListener('hexmenus:action', ({detail: event}) => {
  // Replace these examples with the repository's actual APIs.
  if (event.type === 'load-run') game.loadSaveSlot(event.slotId);
  if (event.type === 'new-game') game.beginCharacterCreation(event.slotId);
  if (event.type === 'start-mode') game.startMode({
    slotId: event.slotId, mode: event.mode, depth: event.depth
  });
  if (event.type === 'navigate') game.openMenu(event.destination);
  if (event.type === 'run-details') game.openRunDetails(event.slotId);
});
```

The `game.*` methods above are illustrative names, not claims about existing repository APIs. Inspect and use the real application. Do not introduce a second save store or copy sample slot contents over real saves.

For a DOM/CSS implementation, keep native buttons and accessible labels. The SVG preview uses focusable groups with Enter/Space support to share geometry with editable layout masters; that is a reference implementation, not a requirement to replace a working game UI framework.

## Edge states

- All slots empty: show real empty cards, no fake Burn Rush run; main Explore/Battle disabled until a run exists. Continue still opens the slot menu.
- All slots occupied: New Game disabled; existing Continue actions remain available.
- Missing/unknown character asset: use a neutral placeholder and retain run metadata; never silently substitute a dungeon screenshot. Production should preload sprite assets before showing the screen.
- Long names/location labels: wrap or truncate in a constrained region with accessible full text. The demo uses the reference strings; additional localization/long-name browser testing remains an integration check.
- Health and XP values: keep the numeric values and visual fill synchronized; validate invalid/missing maxima before drawing a ratio. This reference uses a live numeric health label and an empty sample XP track.
- Run rule descriptions: pull from the game's current biome/deck/crystal definitions, not the demonstration dialog's fixed Fire/Verdant wording.
