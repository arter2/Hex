# Dungeon controls QA — 2026-10-06

Source: `ccr-4c59caee-nfo4lq`, commit `d4f6db4da9b201f3845dd6aab9afce6b768e9a3b`.
Review branch: `review/dungeon-controls-2026-10-06`.

## Status

Partial. Browser execution was blocked by the execution sandbox (Chromium socket setup failed with EPERM). A permission-enabled retry was interrupted before execution completed. There are no browser screenshots or completed screen-space UI hit tests. The checks below execute the original game logic in Node with DOM and rendering stubs; they do not establish that visible buttons are tappable on devices.

## Confirmed failure: object dialogs reopen after closing (P1)

Locations: `deck/explore.js:450`, `deck/dungeon.js:866-875`, `deck/dungeon.js:577-582`.

A tap-to-walk path approaching a tablet survives `xPause(true)`. Closing the dialog unpauses without clearing that path. Movement resumes toward the same solid object and `xBumpExtra` calls `xInteract` again. The tablet appears impossible to dismiss. NPCs, merchants and sanctuary altars share these approach, pause and dialog functions and are exposed to the same loop.

Reproduction: tap a tablet to approach it, let its dialog open, press Close, and wait without supplying a new movement target. The original source functions reproduce path retention and immediate reopening with controlled mocks.

Suggested correction: cancel the approach path when opening an interaction dialog. Retain the ability to pause/resume ordinary walking through the general pause menu.

## Completed checks

- `node deck/engine.test.js`: 34 test groups pass. The card CSV fixtures were generated with the repository's `deck/tools/export-art.js` before running.
- One generated floor for each depth 1–24, covering all six areas and the six boss-floor layouts.
- 24/24 clear nearby targets: projected a world-space floor center through the actual Three.js camera, passed the coordinates to the original `xTap`, and stepped the original `xMove` until the target was reached.
- 24/24 keyboard movement checks: held a movement key toward an adjacent clear cell, then released it.
- Search cancels a pending walking path and begins its timed action.
- Bag opens and pauses, all four bag tab bodies execute, and closing removes the overlay and unpauses. These are state checks, not DOM hit tests.
- An isolated diagonal-corner test did not allow walking between two diagonally adjacent floor cells separated by rock.

## Still untested

Real button hit regions and occlusion; phone/tablet portrait and landscape layouts; forced rotation; full-screen behavior; main menu, starter selection, camp, builder, collection, character, shop, settings, pause, battle/custom, reward/detail and sacrifice menu navigation by actual touch events; item use/purchases; long-press/drag/multitouch; all door/key/lock types; wall-mounted switches/caches; puzzle interactions; trap disarming; stairs and branch transitions; enemy encounters; repeated randomized layouts and long routes.

No gameplay fixes were made. The passing logic checks are narrow and do not certify all menus or levels.
