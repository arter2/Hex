# Player-bot improvements

Implemented on `review/bot-design-2026-10-25`, following [the design review](bot-design-review.md).

## Changes

- Human reaction, evaluation, firing, focus, cast and gauge delays use unscaled elapsed seconds. Fight timeouts use that clock too, so hit-stop cannot extend a job indefinitely.
- Perception refreshes every tick, including idle intervals. New wind-ups, casts and restarted countdowns get fresh notice decisions and reaction timers.
- Warning times use elapsed seconds from the first simulation observation, including subsequent hit-stop. Unobserved warnings remain unknown, and reports show measured-warning coverage. This is simulation evidence, not paint timing or human visibility.
- Battle and run entry points seed game randomness and restore ambient RNGs on exit. World and policy RNGs are separate; jobs deliberately pair world scenarios across styles while giving each style its own policy seed. Accidental cross-colour seed reuse and duplicate job IDs are rejected.
- Fight hooks are restored on exit. Crawl jobs default to `strict`: forced dialog closure, action-watchdog completion and forced defeat are recorded and stop the run. `mode: "exploratory"` permits these interventions but records each and labels the run recovery-assisted.
- Crawl and skill reports preserve failed/malformed jobs in batch health, exclude failed/recovered records from clean balance estimates, and return failure exit codes. Runners record skipped jobs and write an adjacent manifest. Invalid deck setup fails instead of continuing.
- Runners use fresh browser contexts, HTTP hosting, readiness checks, a configurable browser, external job deadlines and cleanup. Each result includes job/config/browser metadata. Set `SOURCE_SHA` to attach the tested game commit; absent provenance is null, not guessed.
- The frustration threshold includes positive and negative weighted events over the same rolling window. Reports label it as a model, and card lift as observational association rather than causation.
- Save-torture and puzzle-lab failures fail automation. Mid-dungeon reload checks include XP loss. Soak frame rates use elapsed milliseconds rather than assuming 60 FPS.
- A separate coordinate-tap UI tool navigates without injecting gameplay bots or clicking buttons programmatically.

## Regression checks

From the repository root, with Node 22 or newer:

```sh
node tools/playtest/selftest.js
```

No browser or npm install is required. Checks cover RNG replay/restoration, paired seeds, perception lifecycle, reaction delay, warning coverage, a simulated fight, strict recovery, report failures, frame-rate units, deadlines and synthetic overlay/clipping detection.

## Browser jobs

```sh
npm --prefix tools/playtest install
npm --prefix tools/playtest exec -- playwright install chromium webkit
node tools/playtest/mkcrawl.js /tmp/jobs.json 2 1 24
SOURCE_SHA=35009bc0d0c73c968ffc37e4f3edb75b019e34d5 node tools/playtest/crawl-runner.js /tmp/jobs.json /tmp/crawl.jsonl
node tools/playtest/analyze-crawl.js /tmp/crawl.jsonl
```

Set `mode` to `"exploratory"` in job JSON to allow recorded recovery. Recovery-assisted results remain separate from clean estimates and cause the batch command to return nonzero.

| Setting | Meaning |
|---|---|
| `BROWSER` | `chromium` (default), `webkit` or `firefox`. |
| `BROWSER_PATH` | Optional executable override. |
| `PLAYWRIGHT_MODULE` | Optional path to an existing Playwright module. |
| `SOURCE_SHA` | Tested game commit, included in result metadata. |
| `WALL_TIMEOUT_MS` | Per-job deadline; otherwise the real limit plus five seconds. |
| `LIMIT_S` | Batch limit; remaining jobs are recorded as skipped. |
| `APPEND_RESULTS=1` | Explicitly allow an existing output file; normally choose a new path. |

Raw injection requires `support.js` before `bot.js`; crawl also loads `crawl.js`. Supplied runners handle this.

## Phone/tablet hit-region checks

```sh
BROWSER=webkit node tools/playtest/ui-runner.js /tmp/hex-ui-webkit
BROWSER=chromium node tools/playtest/ui-runner.js /tmp/hex-ui-chromium
```

The matrix is 390×844, 844×390, 820×1180 and 1180×820 CSS pixels with touch enabled. A disposable save is prepared, then actual coordinate taps navigate and assert screen transitions. Five inset hit points per enabled control detect interception/clipping after native scrolling. Targets below 44 CSS pixels produce warnings. Screenshots and JSON are written for each viewport.

Scenarios: main menu, camp, deck builder, collection, shop, character/bag, settings, dungeon HUD, pause, settings from pause and dungeon bag. Disabled controls are counted separately; an empty audit fails.

This is initial menu coverage, not full gesture/gameplay coverage. All tabs, purchases, character creation, save slots, forced rotation, browser chrome/safe areas, walking targets, battle controls, dragging, multi-touch and search-reticle gestures need additional scenarios. Linux WebKit does not replace physical iPhone/iPad Safari testing.

## Validation and remaining work

- All 21 browser-free regression checks pass, along with JavaScript syntax and whitespace checks. Full browser jobs and physical Safari tests were not run here.
- Reaction timing, warnings, seeds and the frustration model changed. Do not pool historical and new reports. Rerun baseline and candidate builds with identical bot versions and jobs.
- Oracle puzzle knowledge, a shared simulation step, richer save assertions, causal balance experiments and human calibration remain follow-up work. This change does not complete the entire review backlog.
