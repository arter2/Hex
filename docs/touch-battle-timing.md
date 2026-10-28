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
