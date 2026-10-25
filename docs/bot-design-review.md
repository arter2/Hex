# Hexmancers player-bot design review

Reviewed: 2026-10-25. Source: `main` at [`35009bc`](https://github.com/arter2/Hex/commit/35009bc0d0c73c968ffc37e4f3edb75b019e34d5).

## Assessment

**Keep and improve these bots. They are useful gameplay and regression tools, but they do not yet establish that the game is usable on mobile, fair to humans, or enjoyable.** Their strongest evidence concerns simulation state and progression. Their weakest evidence concerns actual touch input, perception, human behavior, and the statistical interpretation of results.

This is a source review of all 16 files in `tools/playtest/`, the tool documentation, recent playtest reports, and relevant game code. Eight focused checks ran against the source functions, job generators and report generator. These checks use controlled inputs; no new browser playtest, Safari session or long career was run. The existing reports' historical results were read, not independently reproduced. No bot or game implementation was changed.

Priorities below: **P1** = fix before relying on the affected measurement; **P2** = improve coverage, reliability or realism. A confirmed implementation issue is distinguished from a design recommendation.

## What I approve of

| Existing design | Why it is worth keeping |
|---|---|
| Running against real game functions in a browser | Exercises the actual combat, dungeon and save code rather than a separately reimplemented game. |
| Separate fight, career, puzzle, save and soak tools | Makes failures easier to localize and allows fast simulation and slower rendering tests to serve different purposes. |
| Seeded career randomness and fresh pages per crawl | A strong starting point for reproducing failures and avoiding cross-career state leakage. Battle-only seeding still needs work. |
| Several player profiles and a random battle baseline | Better than tuning around one perfect agent. Reaction delays, missed threats, firing cadence and movement errors acknowledge that people make mistakes. |
| Runtime health checks and NaN tracing | HP, inventory counts, deck ownership, positions and save consistency are valuable objective checks. |
| Save round trips and destructive storage scenarios | Corruption, old saves, concurrent tabs and quota failures are important failure modes often missed by gameplay tests. |
| Stuck detection, task traces and floor maps | Provides useful debugging evidence instead of only a final win/loss result. |
| Real-time soak tests | Correctly separates memory/rendering behavior from accelerated simulation. The documentation appropriately warns about the software GPU. |
| Per-depth, per-colour and per-style reporting | Helps expose local balance problems that one overall win rate would hide. |
| Explicit documentation that fun weights are guesses | Keep this caution and make it equally prominent in generated reports and conclusions. |

## Highest-priority improvements

### 1. Add an actual input and layout test suite — P1, coverage gap

**Evidence:** [crawl movement](../tools/playtest/crawl.js#L175) directly changes `XKEY`, `EX.path`, `EX.goal`, `EX.needInput` and `EX.fieldAvoid`. [Dialogs](../tools/playtest/crawl.js#L475) use DOM `.click()` or call `xDlgClose()` directly. [Battle control](../tools/playtest/bot.js#L192) calls functions such as `moveTo`, `castCard`, `freeTarget` and `flickThrow`. Runners use a single 400×800 Chromium viewport, without a touch-device context.

These paths can succeed when a real finger cannot reach a button, another overlay intercepts the tap, the screen is rotated incorrectly, pointer capture is lost, or the camera maps the tap to the wrong tile. A programmatic `.click()` does not prove physical tappability.

**Improve:** Keep fast logic bots, and add a slower suite using actual pointer/touch events at screen coordinates. Cover phone/tablet portrait and landscape, Chromium and WebKit, and physical iPhone/iPad Safari smoke tests. At button centres and inset edges, check `elementFromPoint` and then assert the expected state transition. Check clipping, scrolling, safe areas, browser chrome, forced rotation, `pointercancel`, drag thresholds and two simultaneous touches. Test minimap navigation, search-reticle aiming, all movement modes and dialog dismissal followed by standing still.

**Done when:** an invisible overlay placed above a button fails the suite; reversing screen-to-world coordinates fails walking tests; ordinary menu navigation works without any direct game-state writes. WebKit results remain labelled separately from device Safari.

### 2. Correct and test time units — P1, confirmed implementation issues

**Evidence:** [bot reaction](../tools/playtest/bot.js#L65) multiplies nominal reaction seconds by `PACE`. However, [game `update`](../game/battle.js#L967) advances `b.time` before multiplying simulation `dt` by `PACE`. The same conversion appears in decision/cast/gauge delays. [Fairness](../tools/playtest/bot.js#L13) compares raw telegraph `dur` with real-second thresholds.

**Checks:** A configured 0.5-second reaction becomes 0.35 battle-clock seconds at `PACE=.7`, in normal playback. A 0.35-unit telegraph lasts approximately 0.5 real seconds at that pace, yet `warnHit` labels it unfair under a 0.4-second threshold. Hit-stop and slow motion require additional explicit handling.

**Improve:** Define wall-clock seconds, battle-clock seconds and paced simulation seconds separately. Use one tested conversion layer, including hit-stop/slow-motion semantics. Do not multiply human delays by game speed unless the stated model explicitly requires it.

**Done when:** fixture threats with known visible durations and configured reaction delays classify correctly at several pace settings and during hit-stop.

### 3. Give every attack a new perception identity — P1, confirmed implementation issue

**Evidence:** [eKey](../tools/playtest/bot.js#L69) caches one key for an actor/state string. Callers request `w` during wind-ups or `c<card-id>` during casts; this helper is not told that an idle interval happened.

**Check:** Two separate calls for the same enemy's `w` state return the same key, even after advancing time. Consequently, successive same-type attacks can inherit the first attack's noticed/missed decision and elapsed reaction delay.

**Improve:** Identify threats by attack sequence, start timestamp or an explicit start event. Retire perception state on attack completion/cancellation. Keep separate identities for simultaneous threats.

**Done when:** consecutive identical attacks each receive their own notice roll and reaction timer; a first attack being missed does not make all later identical attacks invisible.

### 4. Make battle replays reproducible and job identities unambiguous — P1, confirmed gaps

**Evidence:** [runFight](../tools/playtest/bot.js#L196) seeds the human-policy RNG, while [runRun](../tools/playtest/bot.js#L336) seeds some run decisions. Neither establishes the game's global `Math.random` stream as the [crawl](../tools/playtest/crawl.js#L565) does. Combat uses global randomness. [mkcrawl](../tools/playtest/mkcrawl.js#L8) and [mkruns](../tools/playtest/mkruns.js#L13) also space colour seeds only ten runs apart.

**Checks:** With identical `runFight` seed 7, a stubbed fight still observes whichever global random value was supplied, 0.1 or 0.9. At 11 runs per colour, each job generator produces 66 jobs but only 61 distinct seeds within one style: five seed collisions across colours. Different colours are different scenarios, so this is accidental seed reuse, not necessarily identical output runs.

**Improve:** Separate deterministic streams for world generation, combat, loot and policy errors. Give each job a stable ID containing scenario, colour, style and replicate. Deliberately pair scenario seeds across policies where useful; avoid accidental collisions. Record the complete config, commit, bot version and RNG state or initial snapshot. Provide a one-command replay.

**Done when:** the same job on a fresh page reproduces its action/event hash, changing job order does not change results, and scenario IDs are unique at large batch sizes.

### 5. Stop hiding failures through recovery — P1, confirmed behavior and recommendation

**Evidence:** [stepMap](../tools/playtest/crawl.js#L674) forcibly completes actions older than five seconds and swallows exceptions from that completion. [dialogTick](../tools/playtest/crawl.js#L478) can close a dialog directly after repeated attempts. [Career execution](../tools/playtest/crawl.js#L595) converts non-loss fight failures into defeats and can return unexpected screens to camp. [runFight](../tools/playtest/bot.js#L201) removes screen classes and replaces many game hooks with no-ops.

These choices keep long simulations productive, but can bypass or alter the very softlocks and lifecycle behavior a regression test should report. Some guard behavior mirrors production code; that still needs an equivalence check rather than an assumption.

**Improve:** Add `strict` and `exploratory` modes. Strict mode records the first failure and preserves the scene. Exploratory mode may recover, but every intervention must emit a structured event with before/after snapshots. Keep recovery-assisted runs separate from clean runs. Restore replaced hooks with `try/finally` and document which lifecycle behavior is intentionally excluded.

**Done when:** a broken Close button, endless action and failed fight all produce failures and artifacts before any recovery, with zero unreported interventions.

### 6. Count every requested job and fail automation correctly — P1, confirmed reporting issue

**Evidence:** [analyze-crawl](../tools/playtest/analyze-crawl.js#L3) filters out top-level `error` records before calculating career and error totals. [analyze-skill](../tools/playtest/analyze-skill.js#L9) likewise excludes failed runs. The [runner](../tools/playtest/runner.js#L15) can stop at its time limit without a complete job manifest. [save-torture](../tools/playtest/save-torture.js#L48) prints failed scenarios but does not set a failure exit code for them.

**Check:** An input containing one valid career and one failed career produces “1 careers … Errors: 0.” in the crawl report. This can make a less reliable build look healthier.

**Improve:** Report requested, started, completed, failed, timed-out, skipped and recovery-assisted jobs. Preserve failed jobs in denominators and the failure section; exclude them from balance estimates only with an explicit reason. Validate result schemas and set nonzero exit status on failed assertions, incomplete mandatory coverage or runner failure. Abort invalid deck setup instead of merely logging it.

**Done when:** a deliberately crashed job remains visible, an interrupted batch is incomplete, and a failed save assertion fails CI.

### 7. Separate hidden answers from player knowledge — P1 for human claims, design issue

**Evidence:** [Puzzle solvers](../tools/playtest/crawl.js#L362) use `s.want`, `m.want`, `pz.seq`, memory tiles' `safe` flags and the guardian's `Q.a`. Some of these facts are inferable from visible clues, but reading the answer state does not test whether those clues are understandable or even rendered. Probability-based mistakes do not remove that dependence.

**Improve:** Keep an oracle solver to verify solvability, but give the simulated player an observation interface: discovered objects, visible orientations, text actually shown, audio cues actually emitted and remembered observations. Put privileged diagnostics in a separate channel that cannot affect decisions. Store memory-puzzle observations when the path is shown, not by querying safe flags later.

**Done when:** hiding a clue or changing an unobserved answer changes the player bot's knowledge appropriately; the oracle can still diagnose the underlying puzzle independently.

### 8. Treat fun and quitting as hypotheses, and fix the documented model mismatch — P1 for interpretation

**Evidence:** [moodTick](../tools/playtest/crawl.js#L42) sums recent frustration and compares it to patience. Positive fun changes mood but does not offset that quit threshold. [Documentation](playtest-tools.md#fun-annoyance-and-pacing-analyze-crawljs) describes frustration outweighing fun. [Session analysis](../tools/playtest/analyze-crawl.js#L109) invents session lengths and asks how soon a reward happened after the synthetic stop.

**Check:** 1,000 positive fun points plus 31 frustration points still triggers a quit marker for patience 30. This might be a deliberate frustration-budget model, but it is not the documented net-frustration model.

**Improve:** Decide which model is intended; test it and describe it accurately. Label outputs “modelled frustration threshold” and “reward spacing,” not measured player quitting or retention. Run sensitivity analyses on weights and patience, and calibrate against consented human playtest observations. A future reward close to a synthetic stop does not show that a player knew about it or would return.

**Done when:** generated reports separate observed game events, assumed weights and measured human outcomes; conclusions remain stable across plausible parameter ranges or explicitly say they are uncertain.

### 9. Avoid causal balance conclusions from pooled career fights — P1 for interpretation

**Evidence:** [analyze-skill](../tools/playtest/analyze-skill.js#L34) compares fights with and without a card within colour/depth bands. It pools styles and repeated fights from the same careers, while progression changes levels, gear, collection and encounter exposure. It then uses a normal-style z score and may conclude “no must-have card.”

**Improve:** Treat card lift as a candidate-finding correlation. Run controlled card-swap/ablation experiments from identical snapshots, matched encounters and seeded worlds. Cluster uncertainty by career/seed, report confidence intervals and sample counts, account for multiple comparisons, and keep holdout seeds. Compare fight skill with the same deck, stats and gear before comparing whole-career strategies. Missing significance is not evidence that no dominant card exists.

**Done when:** reports distinguish association from intervention, show uncertainty, and say “no effect detected with this sample” when power is insufficient.

## Further improvements worth scheduling

| Priority | Missing or weak area | Evidence and proposed improvement |
|---|---|---|
| P2 | Shared simulation and clock behavior | `crawl.js:671` duplicates `game/explore.js:1450` and omits `xTipScan`; drawing and frame callbacks are disabled. Extract a shared simulation step, inject the clock, and compare action traces with the rendered loop. Test scheduler ordering, pause behavior and timing during fights/camp. |
| P2 | Progression reachability | `crawl.js:157` opens every door and omits props when checking stair reachability. Keep this topology check, but add real reachability with inventory, consumable keys, seals, puzzle states, pads and branch returns. It should detect a missing key and an unreachable mandatory lever. |
| P2 | Fairness attribution and escape options | `bot.js:13` infers the attack from current arrays, leaves some hits with unknown warning, and retains only the first five “worst” samples. Record attack IDs and cue timestamps at source; report unknown coverage separately. Test whether a reachable safe route existed given stun/root, movement speed and simultaneous threats. Check visible/audible cues with rendered/device tests. |
| P2 | Save scenario assertions | `save-torture.js:10–46` mostly compares totals, often not IDs, and the mid-dungeon pass condition omits the XP loss it reports. Compare canonical state, card IDs, gear, charge uses, character, quest/branch/floor state and every save slot. Add schema-valid malformed saves, migration versions, slot switching, repeated reloads and recovery after quota/stale-tab warnings. Define the promised persistence contract first. |
| P2 | Coverage by feature and depth | Career success does not guarantee a merchant service, puzzle subtype, movement mode or late-game encounter was exercised. Emit a coverage matrix for kinds, transitions, areas, races, decks, movement settings and menu actions. Add prepared deep-floor snapshots and minimum per-feature counts; verify new UI such as Search's three-card choice. Keep isolated labs clearly separate from natural-play results: the puzzle lab reveals the floor, removes enemies and sets HP to 9,999. |
| P2 | Performance measurement | `soak.js:47` labels `over50 / (frames / 60)` as “per minute”; at 60 FPS the denominator is elapsed seconds, not minutes, and at other FPS it is not elapsed time. Measure actual sample duration and report `over50 / durationMinutes`. Track input-to-paint latency, resource slopes and repeat cycles on real devices. Forced wins and floor jumps are useful resource fixtures, not complete performance coverage of ordinary play. |
| P2 | Portable, repeatable runners | Browser/module paths are hard-coded, startup uses fixed sleeps and pages load from `file://`. Add a pinned dependency manifest, configurable browser/device settings, readiness assertions, a local HTTP server, cleanup in `finally`, per-job watchdogs and resumable job manifests. Keep HTTP/iframe hosting smoke tests alongside engine tests. |
| P2 | Human-profile calibration | Profiles use fixed parameters, mostly one human character build and perfect strategic information outside some notice checks. Calibrate with observed behavior; vary experience, fatigue, attention, reading, mistakes and control skill independently. Test whether the bot can learn from demonstrated outcomes rather than giving each skill level a different hand-tuned answer probability. Keep the random baseline, but do not equate it with new players. |
| P2 | Bot self-tests and reporting contracts | Add fixtures for clock conversions, perception lifecycles, seed isolation, recovery logging, result schemas and analyzer denominators. Use mutation tests: an overlay, disabled button, missing key, NaN hit, stale save and stuck timer must each be detected. Preserve a small known-good replay corpus when bot policy changes. |

## Recommended order

1. **Make measurements trustworthy:** fix clocks/perception, preserve failed jobs, log recovery, stamp every result with source/config/browser metadata, and add the focused self-tests.
2. **Cover what players touch:** add phone/tablet coordinate-based input tests and physical Safari smoke tests. Keep the fast simulation suite intact.
3. **Separate agents by purpose:** oracle solvability agent, constrained player agent and real-input UI agent, sharing observations/actions where possible.
4. **Improve balance evidence:** paired seeded snapshots, controlled skill comparisons, card ablations and uncertainty by career.
5. **Calibrate human claims:** compare a small set of real sessions with the model before tuning the game around fun or quit scores.

## Focused validation performed for this review

| Check | Result |
|---|---|
| Reaction configured to 0.5 seconds at pace 0.7 | Schedules 0.35 battle-clock seconds. |
| Two same-label wind-ups on the same enemy | Reuses the perception identity. |
| Telegraph duration 0.35 at pace 0.7 | Reports unfair although nominal real warning is 0.5 seconds. |
| 1,000 fun and 31 frustration, patience 30 | Produces a quit marker; fun is not part of the threshold. |
| `mkcrawl`, 11 runs per each of six colours, one style | 66 jobs, 61 unique seeds. |
| `mkruns`, same dimensions | 66 jobs, 61 unique seeds. |
| Crawl report with one good and one failed career | Reports one career and zero errors. |
| Identical `runFight` seed, changed global RNG | Game entry observes changed global randomness. |

These checks establish specific code behaviors. They do not estimate how often those behaviors affect an actual career, and they do not reproduce the historical playtest totals.
