# Dungeon Shadow Shape and Speed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Characters covered by scenery show as a dark shadow shape, and the dungeon costs less per frame, with a Low graphics preset that weak devices start on.

**Architecture:** The shadow is a child `THREE.Sprite` of each character sprite that shares its texture and draws only where the depth buffer is nearer (`GreaterDepth`), so it needs no per-frame syncing. Speed is two layers: allocation-free frame code that changes nothing on screen, then a `GFX` preset in `look.js` that the dungeon reads when it builds a scene and when it renders.

**Tech Stack:** Plain JavaScript, three.js r128 (`game/three.min.js`), no build step. Tests are Node scripts that drive the real game in headless Chromium through `tools/playtest/runner-common.js` (Playwright).

**Spec:** `docs/superpowers/specs/2026-11-09-dungeon-look-speed-variety-design.md`, Pieces 1 and 2. Pieces 3 (themes and room shapes) and 4 (puzzles) get their own plans after this one ships, because they are measured against the profile this plan produces.

## Global Constraints

- Base build is v301. Each shipped piece raises the build number by one in `game/index.html` (`<title>Hexmancers vNNN</title>` and `<meta name="application-version" content="NNN">`) and adds a row to the "Recent changes" table in `docs/status.md`, written like the existing rows.
- Branch: `dungeon-look-speed-variety`. Commit after every task. Do not push unless asked.
- No image files are added. No new libraries.
- High must draw the same picture as v301 apart from the shadow shape. Low removes every full-screen pass.
- The battle screen is out of scope: `xRender` is shared with it, so anything the preset changes is keyed on the dungeon's own renderer state (`X3`), never on a global the battle reads.
- New settings follow the existing pattern: a default in `XLIT_DEF` (`game/look.js:23`), a row in the `XDBG` table (`game/look.js:323` onward), a `dbg_<key>` control in `game/index.html` beside `dbg_dShOn`, saved under `hexmancers-xl-<key>`.
- Tests run with `PLAYWRIGHT_MODULE` and `BROWSER_PATH` set when Playwright is not installed in `tools/playtest` (see `docs/playtest-tools.md`). The test browser draws in software, so frame times are relative: compare builds, never assert an absolute millisecond figure.
- Two facts the spec got wrong, corrected here: (1) the wall hole (`dShOn`) is **off** by default in v301, so the shadow shape is the main way a covered character stays visible; (2) furniture is already merged to one mesh per room (`xMerger` in `xWallDress`), so the spec's "furniture merged per room" needs no task.

## Review Focus

1. **A character removed while covered** (an enemy dies or falls asleep out of sight behind a wall): its shadow must vanish with it. Pinned in Task 2.
2. **Switching preset mid-floor** (Settings opened in the dungeon): the floor must look complete afterwards, with the player where they stood and every seen wall still shown. Pinned in Task 6.
3. **`localStorage` unavailable or holding junk** for `hexmancers-gfx`: the game starts on Auto and does not throw. Pinned in Task 5.
4. **A slow first floor that is slow only because it is loading** (shader warm-up, texture upload): Auto must not time those frames. Pinned in Task 7.
5. **Old saved floors and the classic layout** (`save.layout!==2`): they get the shadow and the speed work and must still build and draw. Pinned in Tasks 2 and 6.

---

### Task 1: Dungeon profile tool and the v301 baseline

**Files:**
- Create: `tools/playtest/dungeon-profile.js`
- Create: `docs/test-results/dungeon-profile-v301.json`
- Modify: `docs/playtest-tools.md` (one row in the tools table)

**Interfaces:**
- Produces: `node tools/playtest/dungeon-profile.js <out.json> [--gfx auto|high|low]`. Output: `{build, gfx, floors:[{depth, area, layout, calls, tris, programs, textures, geometries, pointLights, postPasses, scriptMs, frameMs}]}`. `--gfx` sets `localStorage['hexmancers-gfx']` before the game loads (ignored by v301).
- Produces: in-page helper `window.DPROF.settle(frames)` that runs `xDraw` for `frames` frames at `dt=1/60` with a fixed clock, used by every later test.

- [ ] **Step 1: Write the tool.** For depths `[1,5,9,13,17,21]` plus depth 1 with `save.layout=1`: replace `Math.random` with `caveRng(1000+depth)` (from `game/battle.js`), make a fresh save as `tools/playtest/soak.js` does, `enterExplore(depth)`, move the player to the middle of the first lit non-closet room, call `xUpdateVis()`, run `DPROF.settle(120)`, then record from `X3.renderer.info` (`render.calls`, `render.triangles`, `programs.length`, `memory.textures`, `memory.geometries`). `pointLights` = visible `PointLight`s in `X3.scene`. `postPasses` = number of `renderer.render` calls in one `xRender` beyond the first (wrap `X3.renderer.render` to count). `scriptMs` = median of 60 `xDraw` calls with `xRender` stubbed out, at 4× CPU throttle (`Emulation.setCPUThrottlingRate`). `frameMs` = median of 60 full `xDraw` calls followed by `gl.finish()`.
- [ ] **Step 2: Run it on the unchanged game.**

Run: `node tools/playtest/dungeon-profile.js docs/test-results/dungeon-profile-v301.json`
Expected: 7 floor rows; `calls` between 90 and 200, `postPasses` 3, `pointLights` 5 on every layout-2 row.

- [ ] **Step 3: Add the tool's row to `docs/playtest-tools.md` and commit.**

```bash
git add tools/playtest/dungeon-profile.js docs/test-results/dungeon-profile-v301.json docs/playtest-tools.md
git commit -m "Dungeon profile tool and the v301 baseline"
```

### Task 2: The shadow shape

**Files:**
- Modify: `game/explore.js` (`xSprite` at :323, `xRefresh` at :332, `xDraw` at :1808)
- Modify: `game/look.js` (`XLIT_DEF`, `XDBG`), `game/index.html` (three debug rows after `dbg_dShOn`'s section)
- Test: `tools/dungeon-shade-test.js`

**Interfaces:**
- Produces: every sprite from `xSprite` has `userData.shade`, a child `THREE.Sprite`.
- Produces: settings `XLIT.dShade` (boolean, default `true`), `XLIT.dShadeA` (0–1, default `0.55`), `XLIT.dShadeTint` (0–1, default `0.35`).
- Produces: `xShadeLook()` in `explore.js`: sets every shade's colour and opacity from the three settings and the area glow; called from `xBuildScene` and by the debug rows (reason key `'xshade'` handled in `xDbgDungeon`).

- [ ] **Step 1: Write the failing test** `tools/dungeon-shade-test.js`, using `runner-common.js` as `dungeon-profile.js` does. It enters depth 9 seeded, moves the player to a room's middle, and asserts:

```js
// structure
assert(EX.me.userData.shade.isSprite && EX.me.userData.shade.parent===EX.me);
assert(EX.me.userData.shade.material.depthFunc===THREE.GreaterDepth && EX.me.userData.shade.material.depthWrite===false);
assert(EX.me.userData.shade.material.map===EX.me.material.map);            // after DPROF.settle(2)
assert(EX.me.userData.shade.renderOrder<EX.me.renderOrder);
// in the open, the shadow draws nothing: screens with dShade on and off are identical
assert(diffPixels(shot({dShade:true}), shot({dShade:false}))===0);
// behind a test occluder (a 2 x 6 x 2 box, opaque, placed 1.5 units from the player toward the camera)
// the sprite's covered area differs between on and off, and is dark
const d=diffPixels(shot({dShade:true}), shot({dShade:false})); assert(d>150);
assert(meanLuma(changedPixels)<90);
// an enemy: shown and covered -> shadow drawn; then g.sprite.visible=false -> on/off screens identical again
// xDropGroup(g) -> the shade is gone from the scene: X3.scene.getObjectById(shadeId)===undefined
// classic layout (save.layout=1): the same structure assertions hold and no page error is raised
```

`shot` sets the setting, calls `xShadeLook()`, `DPROF.settle(2)` and returns `page.screenshot` of `#xView` with the HUD hidden; freeze flicker and particles for the shots with `XLIT.flick=0` and `X3.dust.visible=false`, and hide `EX.motes` and the weather points.

- [ ] **Step 2: Run it to see it fail.**

Run: `node tools/dungeon-shade-test.js`
Expected: FAIL at the first assertion (`userData.shade` is undefined).

- [ ] **Step 3: Implement.**
  - `xSprite(getImg,h)`: also create the shade: `new THREE.Sprite(new THREE.SpriteMaterial({transparent:true, alphaTest:.35, depthFunc:THREE.GreaterDepth, depthWrite:false, fog:false}))`, `center` copied from the parent, `renderOrder=-1`, added as a child, stored in `userData.shade`. A child sprite at identity takes the parent's position, scale, visibility and `xStand` pull, so nothing else moves it.
  - `xRefresh`: when it sets `s.material.map`, set `s.userData.shade.material.map` to the same texture and `needsUpdate=true`.
  - `xShadeLook()`: colour = `#0b0d12` lerped toward `EX.area.glow` by `dShadeTint`, then multiplied by `.45`; `opacity=dShadeA`; `visible=dShade`. Applies to `EX.me` and every `g.sprite` in `EX.groups`.
  - `xGroupSprites`: call `xShadeLook()` after making the sprite (groups spawn mid-floor).
  - Settings and three debug rows: "Shadow shape" (checkbox), "Shadow strength" (0–1, step .05), "Shadow tint" (0–1, step .05), each with a one-line `<small>` note in the style of the rows beside them.

- [ ] **Step 4: Run the test.**

Run: `node tools/dungeon-shade-test.js`
Expected: PASS, no page errors.

- [ ] **Step 5: Run the existing dungeon checks.**

Run: `node tools/playtest/selftest.js && node tools/playtest/ui-runner.js out/ui`
Expected: both pass as on `main`.

- [ ] **Step 6: Build v302.** Raise the build number, add the status row ("Shadow shape: you and enemies in sight show as a dark shape where scenery covers them…"), commit.

```bash
git add game/explore.js game/look.js game/index.html tools/dungeon-shade-test.js docs/status.md
git commit -m "v302: shadow shape for covered characters"
```

### Task 3: A frame loop that allocates nothing

**Files:**
- Modify: `game/explore.js` (`xWallCut` :1266, `xWallFade` :1226, `xLightPool` :700, `xDraw` :1808)
- Test: `tools/dungeon-frame-test.js`

**Interfaces:**
- Consumes: `DPROF.settle`, the seeding recipe from Task 1.
- Produces: no new names used by later tasks. Module-level scratch objects are prefixed `XS_` (`XS_M`, `XS_ZERO`, `XS_COL`, `XS_TOUCH`, `XS_V`).

- [ ] **Step 1: Write the test.** It records a **state digest** over a scripted walk and compares it with a golden file made from the code before this task:
  - Script: seeded depth 9, then 240 frames in which the player is moved 0.15 world units per frame along a fixed path through two rooms and a doorway (set `EX.px/pz/pc`, call `xUpdateVis()` when the cell changes, `xDraw(T,1/60)`).
  - Digest every 20 frames: FNV-1a over `EX.wCut`, every wall `InstancedMesh.instanceMatrix.array` and `count`, each pool light's position, colour and intensity (rounded to 1e-4), `EX.fogCur`.
  - `--write-golden tools/golden/dungeon-frame.json` writes it; without the flag the test asserts equality.
  - Second assertion, allocation: with `--js-flags=--expose-gc`, `gc()`, then measure `performance.memory.usedJSHeapSize` growth across 600 `xDraw` calls with `xRender` stubbed; assert growth under 300 KB (`--enable-precise-memory-info`).
- [ ] **Step 2: Write the golden from the current code, then run the test.**

Run: `node tools/dungeon-frame-test.js --write-golden tools/golden/dungeon-frame.json && node tools/dungeon-frame-test.js`
Expected: digest PASS, allocation FAIL (growth well over 300 KB).

- [ ] **Step 3: Remove the per-frame allocations.**
  - `xWallCut`: reuse `XS_M` and a cleared `XS_TOUCH` set; replace `(EX.glows||[]).concat(EX.onWall||[])` with two loops; run that glow/on-wall walk only when `EX.cutD` or `EX.pc` changed since the last frame or any entry's `cut` is still easing (keep a counter of entries not yet at target).
  - `xWallFade`: reuse `XS_M`, `XS_ZERO`, `XS_COL`.
  - `xLightPool`: reuse `XS_V` in `place`; build `want` with a reused array and no intermediate `[L,dist]` pairs.
  - `xDraw`: the `FL`/glow loop and enemy loop already reuse; remove the `forEach` closure in the `veins==='stars'` branch.
- [ ] **Step 4: Run the test.**

Run: `node tools/dungeon-frame-test.js`
Expected: digest PASS (identical to golden), allocation PASS.

- [ ] **Step 5: Commit.**

```bash
git add game/explore.js tools/dungeon-frame-test.js tools/golden/dungeon-frame.json
git commit -m "Dungeon frame loop reuses its scratch objects"
```

### Task 4: The minimap redraws only when something changed

**Files:**
- Modify: `game/explore.js` (`xDraw` :1873, `xMini` :1884, and the places that change what the map shows)
- Test: extend `tools/dungeon-frame-test.js`

**Interfaces:**
- Produces: `xMiniDirty()` in `explore.js`: marks the minimap for redraw. `xDraw` calls `xMini()` when the mark is set (at most once every 6 frames, as now) or while the map is open big.

- [ ] **Step 1: Add the failing assertions.** Wrap `xMini` to count calls. Standing still for 120 frames: count ≤ 1. Walking across 3 cells: count ≥ 3. A door opened (`xDoorOpen`) while standing still: count rises by ≥ 1 within 6 frames. Map open big: count rises every 6 frames. And the map's pixels after a scripted walk equal the pixels from the code before this task (golden `tools/golden/dungeon-mini.png`, written with `--write-golden`).
- [ ] **Step 2: Run to see the standing-still assertion fail** (count is 20).

Run: `node tools/dungeon-frame-test.js`

- [ ] **Step 3: Implement.** Call `xMiniDirty()` from `xUpdateVis`, door state changes (`xDoorOpen`, `xUnlock`, `xFoundDoor`), enemy cell changes for enemies in sight, stairs or marker changes (`xStairsMark`), prop pickups and reveals (`xReveal`, `xPickup`), and `xMapOpen`/`xMapClose`. Search `game/dungeon.js`, `game/rooms.js` and `game/puzzles.js` for direct `xMini()` calls and leave them as they are.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git commit -am "Minimap redraws on change"
```

### Task 5: The graphics preset

**Files:**
- Modify: `game/look.js` (new `GFX` block above `LQ_STEPS` at :136; `lookPR` :148; `xRender` :149)
- Modify: `game/explore.js` (`xInit3D` :260, `xBuildScene` :438, `xLightPool`, `xDraw`)
- Modify: `game/style.css` (the CSS vignette)
- Test: `tools/dungeon-gfx-test.js`

**Interfaces:**
- Produces, in `look.js`:
  - `gfxMode(): 'auto'|'high'|'low'` reads `localStorage['hexmancers-gfx']`; anything else, or a throw, is `'auto'`.
  - `gfxSet(mode)`: stores it and calls `gfxApply()`.
  - `gfxLow(): boolean`: `mode==='low'`, or `mode==='auto'` and `GFX.auto==='low'`. `GFX.auto` is `'high'` until Task 7 sets it.
  - `gfxApply()`: if a dungeon floor is active, calls `xGfxRebuild()` (Task 6); always updates the CSS vignette class.
- Produces: `X3.low` (boolean), set at the top of `xBuildScene` and read by `xRender` and `lookPR`.

- [ ] **Step 1: Write the failing test.** For `high` and `low` (set through `localStorage` before load) on seeded depth 9:

```js
// high: unchanged from v302
assert(prof.postPasses===3 && prof.pointLights===5 && X3.renderer.getPixelRatio()===Math.min(devicePixelRatio,2));
// low
assert(prof.postPasses===0);
assert(prof.pointLights===3);                       // your lamp + 2 pooled torch lights
assert(X3.renderer.getPixelRatio()<=1);
assert(document.querySelector('#scrExplore').classList.contains('gfx-vig'));   // vignette drawn in CSS
// junk in storage -> auto, no page error
localStorage.setItem('hexmancers-gfx','{bad'); assert(gfxMode()==='auto');
// the battle is untouched by Low: AR renderer still runs its post passes after fight() from the dungeon
```

- [ ] **Step 2: Run to see it fail** (`gfxMode` is not defined).

Run: `node tools/dungeon-gfx-test.js`

- [ ] **Step 3: Implement.**
  - `xRender(G)`: when `G.low`, `r.render(G.scene,G.cam)` and return (no SSAO, depth of field or vignette pass).
  - `lookPR()`: the dungeon's `xResize` passes its cap: `Math.min(lookPR(), X3.low?1:2)`.
  - `xBuildScene`: `G.low=gfxLow()`; pooled lights beyond `G.low?2:4` are removed from the scene (`scene.remove`), the rest added back, so the shaders compile for the lower light count. `xLightPool` iterates only the lights in the scene.
  - CSS: `#scrExplore.gfx-vig::after` is a `radial-gradient` matching `XLIT.vig` 0.98 at the default radius and softness, `pointer-events:none`, under the HUD. The class is on only when `X3.low` and `XLIT.vig>0`.
- [ ] **Step 4: Run the test and the profile.**

Run: `node tools/dungeon-gfx-test.js && node tools/playtest/dungeon-profile.js out/low.json --gfx low`
Expected: test PASS; every row of `out/low.json` has `postPasses` 0 and `pointLights` 3.

- [ ] **Step 5: Commit.**

```bash
git add game/look.js game/explore.js game/style.css tools/dungeon-gfx-test.js
git commit -m "Graphics preset: Low drops the post passes, two torch lights, pixel ratio 1"
```

### Task 6: Low's lighter scene, and switching preset on a live floor

**Files:**
- Modify: `game/explore.js` (`xBuildScene` wall geometry at :506, `xInit3D` dust at :273, `xWeather` :755, `xMotes` :871; new `xGfxRebuild`)
- Test: extend `tools/dungeon-gfx-test.js`

**Interfaces:**
- Consumes: `X3.low`, `gfxApply()` from Task 5.
- Produces: `xGfxRebuild()`: rebuilds the current floor's scene for the current preset without changing the run.

- [ ] **Step 1: Add the failing assertions.**

```js
// Low draws at most half the triangles of High on the same seeded floor and view, on every area
for (const depth of [1,5,9,13,17,21]) assert(low[depth].tris <= 0.5*high[depth].tris);
// particles are halved on Low
assert(lowDust===35 && highDust===70);
// switching on a live floor keeps the run
const before={px:EX.px,pz:EX.pz,hp:EX.hp,seen:hash(EX.seen),doors:doorStates(),groups:EX.groups.length};
gfxSet('low'); DPROF.settle(3);
assert(deepEqual(before, now()) && X3.low===true);
assert(shownWallCount()===shownWallCountBefore);        // every wall seen before is still shown
gfxSet('high'); DPROF.settle(3); assert(X3.low===false && X3.renderer.info.render.triangles===high[9].tris);
// classic layout: both presets build and draw with no page error
```

- [ ] **Step 2: Run to see the triangle assertion fail.**
- [ ] **Step 3: Implement.**
  - Walls on Low: every entry of `wgeos` built with the lighter deep-mass variant already in the file (`xWallGeo(…,true)` as the seventh entry uses), and `bev` returns 0, so no bevel shader is compiled. Diagonal pieces keep `xWedgeGeo`.
  - Particles on Low: dust 35 (`DN`), weather `N` halved, motes 24. Dust is made in `xInit3D`, so move its creation into a function `xBuildScene` calls.
  - `xGfxRebuild()`: remember `EX.px/pz/pc`, call `xBuildScene()`, restore the position, then replay what the scene derives from the run: `EX.shown` walls (`xPaintCells`), door poses (`xDoorPose` for open doors), opened chests' lids, `xUpdateVis()`. Use the same sequence `xGoFloor` uses when it returns to a kept floor, and call that shared part from both.
- [ ] **Step 4: Run the tests.**

Run: `node tools/dungeon-gfx-test.js && node tools/dungeon-shade-test.js && node tools/dungeon-frame-test.js`
Expected: all PASS (the frame digest is taken on High, so it is unchanged).

- [ ] **Step 5: Commit.**

```bash
git commit -am "Low preset: plain wall blocks, half the particles; presets switch on a live floor"
```

### Task 7: Auto, and the Graphics setting

**Files:**
- Modify: `game/look.js` (`GFX` block), `game/explore.js` (`xDraw` calls the sampler), `game/index.html` (a Settings row), `game/ui.js` (the row's handler, beside `setXStairs` at :1499), `game/settingsui.js` (`HOME`, `SHORT`, `SEG` entries so the row sits on the Display tab as a three-way control)
- Test: extend `tools/dungeon-gfx-test.js`; add one check to `tools/playtest/ui-runner.js`

**Interfaces:**
- Produces: `gfxSample(ms)` in `look.js`, called once per drawn dungeon frame with the frame's milliseconds. Storage key `hexmancers-gfx-auto` holds `'high'` or `'low'`.

- [ ] **Step 1: Add the failing assertions** (drive `gfxSample` directly with synthetic frame times, so the test does not depend on the machine):

```js
// decided once per session, from frames 31..120 after the floor's first frame (the first 30 are warm-up and ignored)
feed(30, 200); feed(90, 30);  assert(GFX.auto==='low' && localStorage.getItem('hexmancers-gfx-auto')==='low');
reset(); feed(30, 200); feed(90, 16);  assert(GFX.auto==='high');
// the threshold is a median over 22 ms: 44 frames at 40 ms and 46 at 16 ms stays high
reset(); feed(30, 16); feed(44, 40); feed(46, 16); assert(GFX.auto==='high');
// frames while a dialog, the map, a fight hand-off or a hidden page is up are not counted
// a stored result is used from the first frame of the next session and is not re-measured
// mode 'high' or 'low' ignores GFX.auto entirely
// changing to low through Auto rebuilds the floor once (xGfxRebuild called exactly once)
```

- [ ] **Step 2: Run to see it fail.**
- [ ] **Step 3: Implement** `gfxSample` to those rules: skip while `EX.busy`, `xPaused`, the map is open or `document.hidden`; a frame over 250 ms is dropped as a hitch; decide at 90 counted frames; on a `'low'` result call `gfxApply()`.
- [ ] **Step 4: Add the setting.** Settings › Display › **Graphics**: Auto, High, Low. Note under it: "Auto picks Low on devices that can't keep up. Low turns off blur and soft shading and draws simpler walls." The handler calls `gfxSet`. In `ui-runner.js`, tap each of the three and assert the stored value and that the row's control shows it.
- [ ] **Step 5: Run everything.**

Run: `node tools/dungeon-gfx-test.js && node tools/playtest/ui-runner.js out/ui && node tools/playtest/selftest.js`
Expected: all PASS.

- [ ] **Step 6: Commit.**

```bash
git commit -am "Graphics setting with Auto: weak devices start on Low"
```

### Task 8: Measure, record, build v303

**Files:**
- Create: `docs/test-results/dungeon-profile-v303.json`, `docs/test-results/dungeon-profile-v303-low.json`
- Modify: `game/index.html` (build 303), `docs/status.md`, `docs/iphone-checklist.md` (three lines: Graphics setting on each value; shadow shape behind an arch; a floor after switching preset)

- [ ] **Step 1: Profile both presets.**

Run: `node tools/playtest/dungeon-profile.js docs/test-results/dungeon-profile-v303.json --gfx high && node tools/playtest/dungeon-profile.js docs/test-results/dungeon-profile-v303-low.json --gfx low`

- [ ] **Step 2: Check the targets against `dungeon-profile-v301.json`.** High: `tris`, `programs` and `postPasses` equal to v301 on every row, `calls` higher by at most the number of visible characters, `scriptMs` not above v301's. Low: `postPasses` 0, `tris` ≤ half of High's, `pointLights` 3. If a target is missed, stop and report the row; do not adjust the target.
- [ ] **Step 3: Run the touch dungeon bot on both presets.**

Run: `node tools/playtest/touch-dungeon-runner.js out/touch --depths 1,9,17 --floors 1 --minutes 4 --device phone`
Expected: no lost WebGL context, no black frames, no new stuck or off-floor reports compared with a run on `main`.

- [ ] **Step 4: Build v303.** Raise the build number; add the status row with the measured before and after figures from the three profile files; commit.

```bash
git add docs/test-results/dungeon-profile-v303*.json game/index.html docs/status.md docs/iphone-checklist.md
git commit -m "v303: dungeon speed pass and the Low graphics preset"
```
