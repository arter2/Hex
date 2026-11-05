# Screen flow and interactions

| Screen / control | Result |
|---|---|
| Main Continue | Open the three-save-slot menu. |
| Main active-slot strip / slot chooser | Open the same save-slot menu. |
| Empty slot card | Select that empty slot; do not create a run merely on selection. |
| Occupied slot card | Select that run. Its inner Continue is a distinct target. |
| Occupied card Continue | Resume/load that exact slot through the game's API. |
| Save footer Back | Return to main; preserve selected run/depth when valid. |
| Save footer New Game | Start the existing new-run flow in an empty slot. |
| Main depth arrows | Clamp between1 and the selected run's deepest unlocked start depth. |
| Explore / Battle | Dispatch the selected mode and start depth to existing game logic. |
| Run Details | Expand/open the actual current biome, weakness/resistance and deck/crystal rules. |
| Cards | Deck builder, My cards. |
| Market | Shop, Trading post. |
| Journal | Bounty board, Bestiary, Mastery. |
| Character | Character, Movement lab; show live unspent-point count. |
| Settings | Existing settings screen. |

## Save-slot rules

There are exactly three slots. The supplied sample has slots1/3 empty and slot2 occupied. This is demonstration data only.

New Game is a **single footer action** adjacent to Back. If the selected slot is empty, target it. If an occupied slot is selected and another slot is empty, select the first empty slot and begin the existing creation flow for that slot. If all slots are occupied, disable New Game and expose an accessible 'All save slots are occupied' reason. Any existing game-specific slot management stays in its own flow; no new overwrite behavior is introduced here.

Back and New Game share the same steel variant, dimensions, state treatment, font and icon scale. Disabled New Game may use the shared disabled state; it does not become a different purple button.

Each occupied slot's thumbnail is a full-body sprite keyed by its saved character identity. Biome/location is communicated by adjacent text. Do not show a screenshot of the current dungeon in place of the character, and do not hardcode the supplied red wizard across all runs. Scale the whole sprite proportionally with padding; retain hat, staff and feet.

## Focus and state

Opening save selection should focus the selected card or its Continue. Back restores focus to the main Continue. Closing Run Details/category dialogs restores their trigger's focus. Enter/Space activate focused controls; Escape closes a dialog or returns from save selection. Save selection is transient UI state. Do not serialize navigation changes as a new run, perform autosave writes on hover, or use the sample data to overwrite project saves.

The demo shows both empties and all-full states and emits integration requests. It does not load a real game, create a real character or persist saves. The render/transition modules are usable independently of the demo shell.
