# Battle movement timing investigation, 28 October 2026

Base: `1bfae4f8d13dcac9b3ccdc345da52c59c5df642e` (v177).

Reported: dungeon movement stays normal; every subsequent dungeon-to-battle encounter feels faster, across touch movement styles.

## Confirmed defect

The battle UI passed `min(0.05, elapsedSeconds)` to the simulation once per rendered frame. At 10 fps, one real second advanced only half a simulated second. At 20 fps or more, a real second advanced a full simulated second. This affects every battle movement style, regardless of whether touch handlers accumulate.

In a Chromium touch run through the real dungeon engagement and Keep exploring return path, the first four encounters retained a configured top speed of 9 tiles/s. Their simulation/real-time ratios rose from approximately 0.17, 0.14, 0.23 to 0.30 as the software renderer got faster. This confirms frame-rate-dependent pacing, rather than a growing movement setting in that run. Later fixture encounters did not produce useful movement samples and are excluded from that comparison.

This is a demonstrated way to produce a speed change between battles; it does not establish the exact cause on the reporting player's device. Earlier tests in this repository at higher frame rates also did not reproduce the report.

## Fix

Preserve up to 250 ms of elapsed time per visible battle frame and divide it into simulation steps no longer than 50 ms. Render once. Stop remaining steps if a hook changes the battle, the screen, or pause state. Reset the clock when entering a battle or changing tab visibility; hidden tabs do not advance the simulation.

The 250 ms catch-up limit intentionally drops excess time during longer stalls. Performance below 4 fps can still slow the simulation. Substeps do not improve rendering frame rate, and very low frame rates still delay delivery of touch events. The Show movement updates/frame number now counts substeps, so values above one on slow frames do not alone indicate duplicate animation loops.

## Validation

- `node tools/playtest/battle-clock-test.js`: exercises the actual UI frame callback across 12 simulated fights at 10, 20, 30 and 60 fps, plus stall limits, pause, hidden tabs and transitions during substeps. The original callback fails the first 10 fps assertion; the fix passes.
- `node tools/playtest/selftest.js`: 23 checks pass.
- `node --check game/ui.js` and `git diff --check`: pass.
- A rendered Chromium phone test completed four dungeon/battle/Keep exploring cycles with real CDP touch events. All four retained 9 tiles/s top speed and simulation/real-time ratios approximately 1.05–1.09. The ratio has sampling error because several simulation steps share one rendered frame.

A second rendered run covered different inputs on successive encounters:

| Battle | Input | Measured peak tiles/s | Simulation / real time |
|---|---|---:|---:|
| 1 | Joystick | 9.00 | 1.07 |
| 2 | Follow finger | 9.28 | 1.12 |
| 3 | Tap | 10.05 | 1.07 |
| 4 | Joystick | 9.00 | 1.05 |

All four passed, with no page errors and no held drag after release. Tap/follow speed uses a different configured movement path and screen-direction compensation; the joystick stayed at 9.00 in both encounters. These peak readings are simulation speed, while the ratio checks the elapsed clock separately.

The optional browser runner is `node tools/playtest/touch-transition-runner.js [output-directory]` with Playwright installed. It uses enemy/terrain fixtures, a 412×915 viewport and reduced rendering effects to measure movement independently of combat. It saves screenshots and raw samples. This is desktop Chromium emulation, not physical Android or iOS validation.

## Screen-dependent speed, 5 November 2026 (v228)

Reported: battle movement felt fast again, and differed between browser, phone and screen size.

The battle clock above still holds (`battle-clock-test.js` passes; a battle runs at the same speed as the
one before it). The difference came from the even-speed correction (`mvEven`, default 1): walking toward or
away from the enemies is sped up so it covers the same screen distance as walking across. It was measured
through the live camera, whose angle depends on the screen's shape, so the same push walked:

| Screen | Toward the enemies (x sideways speed) |
|---|---:|
| Phone, portrait (412 x 915) | 1.15 |
| Small phone (360 x 640) | 1.22 |
| Tablet, portrait | 1.32 |
| Phone landscape, tablet landscape, any computer | 2.00 (the cap) |

`evenK` now uses one fixed reference, the portrait phone camera the defaults were tuned on
(`EVEN_FORESHORTEN = .866`): 1.155 toward the enemies and 1.069 diagonally on every screen. Measured after:
joystick 6.0 tiles/s sideways and 6.4-6.9 up/down in both portrait and landscape (before: 9.4 and 11.4-12).

Movement values changed in the Movement lab are saved per browser and took precedence over the defaults, so
each browser could walk differently. v228 clears the saved `mv*` values once (`hexmancers-mv-defaults`); the
lab saves new ones afterwards.

The dungeon walk was measured at 3.5 cells/s at 20, 30, 60 and 120 fps on a phone and a 1920 x 1080 screen.
Reaching a waypoint no longer costs a standing frame.

`touch-transition-runner.js` compared tap and follow-finger speeds with the joystick's top speed; they use
`mvSpeed / .14` (8.57 tiles/s). It now checks each mode against its own speed and the fixed boost.
