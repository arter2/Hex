# Implement these two menus in Hexmancers

Implement the main menu and three-save-slot Continue menu shown in `reference/main-approved.png` and `reference/continue-approved.png`. Read this package's `00_START_HERE.md`, `docs/SCREEN_FLOW.md`, `docs/RESPONSIVE.md`, `docs/DATA_BINDING.md` and `docs/ASSET_USAGE.md` before editing the game.

Target project: `arter2/Hex`. Inspect the current checkout, branch, project instructions and actual save/game APIs. Earlier work used `dungeon-redesign`; this package does not assume the branch is still current. Preserve all subsequent gameplay, dungeon and asset changes. Do not reset to an old snapshot. No game repository files have been changed by this handoff.

## Required result

Rebuild the selected interface with reusable interactive components, separate art and live text. Maintain the game's personality and its Living Rune UI materials: smoky dark faces, modest clipped corners, thin steel rim/highlight, tiny bronze inlays and selective small blue crystal accents. Do not introduce thick fantasy frames on every control, a generic flat application UI, giant Continue button, empty lower-screen void, or another navigation redesign.

Use the actual reusable pieces listed in `assets/asset-manifest.json`. Choose SVGs or the density-correct alpha PNG alternatives. Do not render both a complete skin and all its constituent layers together. The authoritative generators are `source/skins.js` and `source/icons.js`. Use the source code or equivalent engine primitives to resize frames without distorting corners. Keep labels and values out of baked textures.

The separated decorative art is a reconstruction that matches the direction; use existing project-owned sprites/illustrations when they offer closer fidelity. Keep the approved reference paintings as the visual standard. Do not replace actual save data or characters with the demo seed.

## Behavior

- Main Continue and the slot chooser open the three-slot menu.
- Exactly three slot cards. Empty cards select an empty slot; they do not contain their own New Game buttons.
- An occupied slot displays its saved character sprite and run metadata. Its Continue invokes the existing load/resume API for that specific slot.
- Footer Back and New Game are equal-width adjacent steel buttons with identical height, state treatment, typography and padding. New Game exists only here. It begins the existing new-run/character/deck flow for an empty slot. Respect the empty-slot targeting rule in SCREEN_FLOW.md; never silently overwrite a run.
- Main Explore and Battle use the selected unlocked start depth and existing game mode APIs. Preserve all game logic; the preview merely emits events.
- Cards contains Deck builder/My cards; Market contains Shop/Trading post; Journal contains Bounty board/Bestiary/Mastery; Character contains Character/Movement lab. The badge shows live available points. Preserve every child destination.
- Run Details opens the real game rules/mechanics panel. Do not hardcode the demo's Fire/Verdant rule text as universal behavior.

## Responsive implementation

Use the six supplied profiles as reference points, not six separate interfaces. `source/render.js` contains a working shared layout model and `layouts/layout-metrics.json` records the generated targets. Production DOM/CSS, canvas or engine UI may replace the SVG-based demonstration while following the same rules.

Phone portrait: header above the stacked menu, two-column camp categories, vertically stacked save cards. Phone landscape: illustration to the left; main menu reflows into a run column and navigation column; save cards reflow into three columns. Tablets: bounded content widths and sensible column arrangements. Short/small windows use vertical scrolling, never clipped or microscopic controls. Respect safe areas, keyboard focus, reduced motion and text contrast. Touch targets stay at least48 logical pixels, regardless of texture density. All visible actions remain reachable after rotation, at320px width and with long run names.

## Validation and delivery

1. Compare the integrated main and save menus to both approved images at phone size.
2. Exercise all three slots, empty/occupied/all-full/all-empty states, per-run sprite changes, Back/New Game parity, depth bounds, Details and every category route. Verify that no real save is overwritten by UI selection.
3. Test phone portrait390×844, tall phone412×915, phone landscape844×390, tablet portrait834×1194, tablet landscape1194×834 and browser1440×900. Also test small landscape568×320 and320px width with vertical scrolling. Use actual browser/device screenshots; the handoff's environment could verify static rendered geometry and state logic, but had no browser executable.
4. Check long translated labels, keyboard-only navigation, focus restoration, empty/max XP and invalid/missing data. Verify alpha assets over the game backdrop.
5. Run the project's relevant checks and report the changed files, tests and any remaining integration limitations. If asked to commit/push, use the current project workflow and report the exact commit. Do not imply this asset ZIP itself was pushed to the game repo.

The preview's callback surface is `hexmenus:action`; examples live in `docs/DATA_BINDING.md`. Adapt it to the actual application architecture rather than importing demo state or starting a parallel save system.
