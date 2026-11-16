# Arena hex floor implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** the battle board becomes carved, painted hex flagstones. It uses a tunable PBR material, dark joints that glow softly on your half, and flat growth and low sprigs in the joints, all from the delivered art. A shape-built stand-in covers anywhere the art hasn't loaded.

**Architecture:**
- A Python build cuts the 1024 masters into small per-area atlases plus a JS map.
- A new `game/arenahex.js` builds the tile mesh, joint plane, side glow and growth for `arena.js`.
- The tile material is a `MeshStandardMaterial`, patched in its shader for:
  - the per-tile variant, turn and mirror;
  - the variation masks;
  - the board-wide noise;
  - the chipped-corner coverage.
- The arena's existing lights, AO map, fog and mold apply to it as to the rest of the arena.

**Tech stack:** three.js r128 (`onBeforeCompile` patches, as in `look.js` and `mold.js`), Python 3 with Pillow and numpy (no SciPy), and Playwright checks in `tools/playtest/art-check.js`.

**Spec:** `docs/superpowers/specs/2026-11-15-arena-hex-floor-design.md`. The art's own conventions are in `game/art/environment/painterly-512/arena-hex/INTEGRATION-NOTES.md` and its `README.md`.

## Global constraints

- **Testing (CLAUDE.md):**
  - Write each task's checks, but **don't run test suites or art checks after each task**. Run them only when the user asks.
  - **Do take and send a picture after each visual change.**
  - Running the build tool to make the assets is building, not testing.
- **No change** to the board's layout (9 × 14), the grid, gameplay, collision, the highlight decal layer, the walls, the island, the chasm or the props.
- **Geometry:**
  - tile radius **0.92** on the existing grid (circumradius 1, centres √3 apart);
  - growth has no collision and never lies on a tile's top;
  - upright sprigs are **0.08 to 0.22** world units tall and only at three-way corners, about **1 in 3**.
- **Draw calls:** one for the tiles, one for the joint plane, one per growth sheet. The side glow and the outline lines are one each, as today.
- **Map conventions:**
  - colour is sRGB;
  - height, roughness (white is rough, never inverted), metalness, AO, masks, coverage, glow and noise are **linear data**;
  - packed mask alpha is data, not opacity, so it's uploaded unpremultiplied and never blended.
- **Metalness:** 0 everywhere except where the Deeps' and Abyss's hex metalness maps say otherwise. Crystals are never metallic.
- **Tile variation:**
  - tile brightness varies by at most **±7%**;
  - neighbours never share the same variant **and** turn;
  - variant, turn (multiples of 60°), mirror, tone and mask strengths are all from the tile's stable key.
- **Growth and glow:**
  - growth keeps its painted colours, with no area colour wash;
  - glow is the upright sheet only, and the Ruins has none;
  - drop an upright sprig whose projected height on screen is under **8 px**.
- **Your half:** the tiles take **no side wash**. Your half shows as a soft emissive glow in its joints.
- **Stand-in:** when an area's hex art isn't loaded or failed, the floor uses the stand-in (tile mesh, edge-distance height, the area's code-painted stone as faint grain, no growth). It never shows a missing texture.
- **Square boards:** the Movement lab's square board (`SQUARE`) keeps today's board exactly.

## Review focus

1. **An area's art fails to load** (404) or is still loading at battle start: the stand-in floor shows with no errors, and the next battle uses the art. → `hexFallback` check, Task 2.
2. **Claimed land, hazards, holes and flashes:** they must still read on painted tiles. A hole is black, claimed land shows its colour, and an unclaimed tile on your half shows plain stone. → `hexStateColours` check, Task 3.
3. **The square Movement-lab board:** must still build today's board unchanged. → `hexSquareBoard` check, Task 2.
4. **Repeated battles:** the art is decoded once and reused, and each battle's textures and materials are freed (`arenaClear`) without leaking or dropping the cached images. → `hexRepeat` check, Task 4.
5. **Mirrored and turned tiles:** a tile's masks and coverage must transform with its colour, or chipped corners and edge wear land in the wrong place. → `hexMaskAligned` check, Task 1 (build) and Task 2 (shader).

---

### Task 1: The build, `tools/build-arena-hex.py`

**Files:**
- Create: `tools/build-arena-hex.py`, `game/arenahexmap.js` (generated), and `game/art/environment/arena/hex/*` (generated).
- Modify: `game/index.html` (a script tag for `arenahexmap.js` before `envart.js`).

**Interfaces:**
- Consumes: the masters in `game/art/environment/painterly-512/arena-hex/` (`areas/<a>/`, `variation/<a>/`, `shared/broad-noise-seamless.png`, `docs/validation.json`).
- Produces, per area `<a>`, in `game/art/environment/arena/hex/`:
  - `<a>-tiles.webp`: colour, 1024 × 512, 4 × 2 cells of 256. Sheet A tiles 1–4 fill row 0 and sheet B tiles 5–8 fill row 1, each hex centred in its cell with circumradius **120**, pointy-top. Lossy q90, with colour carried 8 px past the hex.
  - `<a>-tiles-n.webp`: tangent-space normal from height, same layout, lossless. Default strength `k=6` at 256 px, before the runtime slider.
  - `<a>-tiles-m.webp`: data, same layout, lossless. R roughness, G metalness, B AO from height (a 6 px cavity), A coverage.
  - `<a>-tiles-v.webp`: data, same layout, lossless. R edge wear, G cracks, B colour patches, A moss, taken from `variation-mask-rgba-a/b`.
  - `<a>-joint.webp`: 512 seamless colour. `<a>-joint-n.webp` is its normal. `<a>-joint-m.webp` is data: R roughness, G metalness, B AO.
  - `<a>-growth.webp`: 1024 × 512 RGBA, flat sheet in the left 512 and upright in the right 512, 4 × 4 cells of 128 each. Lossless, with colour carried under clear pixels. `#FF00FF` is keyed out if present.
  - `<a>-growth-e.webp`: the glow at the same layout, greyscale, black on the flat half.
  - `<a>-growth-m.webp`: data, R roughness, G metalness.
- Also produces `broad-noise.webp` (256, greyscale, seamless) and `game/arenahexmap.js`:
  ```js
  const ARENA_HEX={ cell:256, cols:4, rows:2, hexR:120, areas:['hollows','deeps','vault','rifts','ruins','abyss'],
    growth:{ cell:128, flat:[/* cell indices 0-15 with content */], upright:[/* … */], baseline:112,
      box:{ /* 'f3': [x0,y0,x1,y1] in cell px, 'u5': … from validation.json */ }, glow:{ /* area: [upright cells that glow] */ } },
    joint:512 };
  ```

- [ ] **Step 1: Write the build's self-check** as `--check` in the same file. It asserts:
  - every output exists at the sizes above, for all 6 areas;
  - `tiles-m` alpha is 255 at each cell's centre and 0 at each cell's corner (0,0);
  - `tiles-v` is pixel-aligned with coverage (no mask value where coverage is 0);
  - Ruins' `growth-e` is all black;
  - Deeps' and Abyss's `tiles-m` G has nonzero pixels, and Hollows' has none;
  - `arenahexmap.js` parses (through `node -e`) and names 6 areas.
- [ ] **Step 2: Run it before the build exists.** Run `python3 tools/build-arena-hex.py --check`. Expected: FAIL, outputs missing.
- [ ] **Step 3: Implement the build.**
  - Cut each hex by exact geometry: centres (256,256), (768,256), (256,768) and (768,768) on the 1024 sheet, circumradius 240, then scaled by 1/2 into its 256 cell. Use premultiplied LANCZOS, and a 3 × 3 wrap for the joint and noise.
  - Coverage comes from `variation/<a>/<a>--tile-coverage-a|b.png`, and its outside is carried colour, never grey.
  - **Height check:** correlate the Sobel edges of height and colour inside the hex. Below **0.15**, print a `WARN` and use brightness plus edge distance instead.
  - Report any hex whose coverage centroid is more than 6 px off its template centre.
- [ ] **Step 4: Run the build, then its self-check.** Run `python3 tools/build-arena-hex.py && python3 tools/build-arena-hex.py --check`. Expected: `PASS`, and a size total under about 6 MB.
- [ ] **Step 5: Commit.** Add the tool, `game/arenahexmap.js`, `game/art/environment/arena/hex/` and `game/index.html`, with the message "Arena hex floor: build the per-area hex atlases".

### Task 2: The tile mesh and its PBR material (`game/arenahex.js`)

**Files:**
- Create: `game/arenahex.js` (script tag after `arena.js` in `game/index.html`).
- Modify:
  - `game/envart.js`: `envArtHex(id)` and its loads in `envArtWant`;
  - `game/arena.js`: `arenaBoard` calls the hex floor when it's a hex board;
  - `game/look.js`: debug rows, and an "Arena floor" heading in the Surfaces pane;
  - `game/index.html`;
  - `tools/playtest/art-check.js`.

**Interfaces:**
- Consumes: `ARENA_HEX` (Task 1); `xLit`, `xLitTag`, `XLITU`, `XLIT` and `xMoldShader` through the existing `xLit` hook (`userData.xmold=1`); `arMat`, `arTex`, `TILES`, `tileCornerOffs`, `SQUARE` and `SLAB`.
- Produces:
  - `envArtHex(id) -> {tiles,n,m,v,joint,jointN,jointM,growth,growthE,growthM,noise}`: all Images, or `null` until every one has loaded. A load failure leaves it `null` for good, and each file's state is kept as `envart.js` keeps its sheets' state.
  - `arHexFloor(A, Ar, R) -> {mesh, joint, glow, lines, art:boolean}`: the same contract as `arenaBoard`'s `A.board`, plus `joint` and `art`.
    - `mesh` keeps the per-tile `t._v0` and `t._v1` vertex ranges and its `color` attribute, for `arenaTiles`.
    - `glow` and `lines` are built exactly as today, at radius 0.92.
  - `XLIT` keys, with these defaults: `hexRough:1`, `hexRoughOff:0`, `hexMetal:1`, `hexNrm:1`, `hexAO:1`, `hexWear:1`, `hexGlow:1`, `hexLines:.5`, `hexGrowth:true`.
  - `XDBG` rows `dbgHex*` that update live: material uniforms, no rebuild, except `hexGrowth`, which rebuilds.
- **Mesh:**
  - Each tile is a hex top at radius 0.92 at y=0, plus a bevel skirt down to y=−0.06 at radius 0.95 and its sides down to `-SLAB`.
  - Each vertex carries `aCell` (vec2: the variant's cell origin in atlas UV), `aTurn` (0..5), `aMir` (0/1) and `aVar` (vec4: tone, wear, crack and moss strengths, each from the tile key within the ranges below).
  - The hex-local UV is made in the vertex shader: turn by `aTurn*60°`, mirror, then map into the cell at radius 120/256.
  - Tile key: `h = imul(q*73856093 ^ r*19349663, 2654435761)`. Pick the variant as `h%8` and the turn as `(h>>>3)%6`, re-rolled while equal to an already-built neighbour's pair. The mirror is `(h>>>6)&1` at 25% odds. The tone is ±0.07, the wear strength 0.6–1.2, the crack strength 0.8–1.2 and the moss strength 0–1.
- **Material:** `MeshStandardMaterial` with `map`, `normalMap` (`normalScale` = `hexNrm`), `roughnessMap` and `metalnessMap` from `tiles-m`, `aoMap` from `tiles-m` B (`aoMapIntensity` = `hexAO`), and `alphaTest` 0.5 on coverage (A of `tiles-m`). It also has `vertexColors` (for `arenaTiles`) and `userData.xmold=1`, and goes through `xLit` as the arena's other materials do.
- **Shader patch:**
  - every map sample uses the per-tile cell UV;
  - roughness = clamp(r × `hexRough` + `hexRoughOff`);
  - metalness × `hexMetal`;
  - the colour is multiplied by (1 + tone), (1 + 0.25 × wear × `hexWear` × R mask), (1 − 0.3 × crack × G) and mixed toward the joint moss colour by 0.4 × moss × A;
  - the broad noise is sampled at world xz / 9 and brightens or darkens by ±4%.
- **Stand-in (art not ready):** the same mesh. The colour is the area's `xSlabFloor` canvas at low contrast (mixed 70% toward its mean), with no masks. Height comes from edge distance (a bevel ramp 0.12 wide, plus a 3% middle dip) through `xLitTag`'s `cv.h` path, `roughness` is 0.85 and there's no growth.
- **Joint:** a plane at y=−0.05 covering the board's bounds plus 0.5, tiled in world space at 3 units a repeat. It has its colour, normal and `-m` maps. Stand-in: the area's `xRockFloor` darkened by 45%.

- [ ] **Step 1: Write the checks in `art-check.js`.** Add a `BATTLE` helper that starts a battle at a depth after waiting up to 15 s for `envArtHex`. Don't run them (CLAUDE.md).
  - `hexFloorMaterial`: at depth 1, `AR.board.art===true`, the board material `isMeshStandardMaterial`, its maps set, and `alphaTest===.5`.
  - `hexFallback` (ROUTES: 404 `**/arena/hex/hollows-tiles.webp`): `AR.board.art===false`, the mesh present, no page errors.
  - `hexSquareBoard`: with `BOARD_TEST={rows:5,cols:4,square:true}`, `AR.board.mesh.material` is not a `MeshStandardMaterial` and the vertex count equals today's for the same board. Record that number from the current code before changing `arenaBoard`, and pin it in the check.
  - `hexMaskAligned`: in the page, for one mirrored and turned tile, the shader's cell UV at a corner vertex maps inside its cell, and coverage at the hex centre reads 1. Done through a small render-target probe of the material, as `MOLD_PROGRAMS` does.
- [ ] **Step 2: Implement `envArtHex`, `arHexFloor`, the debug rows and the `arenaBoard` switch.** `arenaBoard` returns `arHexFloor(...)`'s meshes when `!SQUARE`, else today's code.
- [ ] **Step 3: Take battle pictures** at depths 1 and 18 (deviceScaleFactor 2), plus one with Normal maps off. Send them.
- [ ] **Step 4: Commit,** with the message "Arena hex floor: painted PBR tiles and the joint plane".

### Task 3: Tile state colours without the side wash, and the side glow in the joints

**Files:**
- Modify: `game/arena.js` (`arenaTiles`), `game/arenahex.js` (the side-glow mesh) and `tools/playtest/art-check.js`.

**Interfaces:**
- Consumes: `arenaTiles(list)` with `{t, base, fill}` from `battle.js` `floorLayer`; `A.board.art`; `hexGlow`; `hexLines`.
- Produces:
  - **`arenaTiles` on the hex floor:** the vertex colour is `1 + (fill − sideBase) × 2.6`, clamped to [0, 1.6] per channel. `sideBase` is the plain side colour (`{p:'#123756', e:'#23292f', n:'#0a1a14'}[t.side]`). An unclaimed, untouched tile is therefore exactly white (plain stone), while claimed land, hazards and flashes tint as they do today, and a hole is black. The square board keeps today's formula.
  - **`A.board.sideGlow`:** one additive mesh. For each tile on your side, a ring from radius 0.92 to 1.0 at y=−0.045, coloured `[.5,.83,1] × 0.35 × hexGlow` at the inner edge and fading to 0 at the outer.
  - The outline `lines` layer is multiplied by `hexLines`.

- [ ] **Step 1: Write `hexStateColours`** (don't run). In a battle:
  - an unclaimed tile on your side has vertex colour (1,1,1) after a frame;
  - a tile with `holeT=1` reads (0,0,0);
  - a claimed tile differs from white;
  - `AR.board.sideGlow` exists with ring geometry only on side `'p'` tiles.
- [ ] **Step 2: Implement it.**
- [ ] **Step 3: Take pictures** of a battle on your half with a move highlight and a claimed tile showing. Send them.
- [ ] **Step 4: Commit,** with the message "Arena hex floor: plain stone on your half, its joints glow".

### Task 4: Growth in the joints

**Files:**
- Modify: `game/arenahex.js` (`arHexGrowth`), `game/arena.js` (call it after the board), and `tools/playtest/art-check.js`.

**Interfaces:**
- Consumes: `ARENA_HEX.growth`, `envArtHex(id).growth/growthE/growthM`, `xLeafTex(img, true)` (no mips, as for thin cards), `xHueMat` (**not** used, as growth keeps its colours), and the camera `A.cam` with the renderer size, for the 8 px rule.
- Produces `arHexGrowth(A, Ar, R) -> {flat:Mesh|null, upright:Mesh|null}`, merged meshes on stream `caveRng((Ar.index||0)*977+5)`, so nothing else moves.
- **Flat pieces:** on about **35%** of tile edges (each edge counted once), 1 to 2 cards lying at y=−0.04. Each is 0.18–0.34 long, centred on the joint and turned along it, so it stays inside the joint's width plus 0.04 under the tile rims, never on a tile top. Cells come from `growth.flat`.
- **Upright sprigs:** at each three-way corner, chosen with probability **1/3**, 1 to 3 crossed cards (as `xMushGeo` upright), 0.08–0.22 tall, standing on the joint at the corner. Drop the sprig if its projected height through `A.cam` at the board's farthest row is under **8 px** at the current device pixel ratio. Cells come from `growth.upright`, with the pivot at the baseline.
- **Glow:** upright cards in `growth.glow[area]` take `emissiveMap` from `growthE` with emissive white × 0.6, as `xMushMat` does. Ruins: none.
- **Material:** `MeshStandardMaterial` with `alphaTest` 0.5, `side:DoubleSide`, `roughnessMap` from `growthM`, metalness 0 and `userData.noProj=1`.
- **Switch:** off when `XLIT.hexGrowth` is false, or on the stand-in.

- [ ] **Step 1: Write the checks** (don't run).
  - `hexGrowth`: there are uprights only at corner points (within 0.05), at most `ceil(corners/3)+3` of them, all 0.08–0.22 tall; no flat card's centre is within 0.85 of a tile centre; the Ruins material has no `emissiveMap`.
  - `hexRepeat`: after five battles in a row, `AR.texs` is freed each time (the arena's texture count doesn't grow), and the hex Images are the same objects every time.
- [ ] **Step 2: Implement it.**
- [ ] **Step 3: Take close pictures** of the Hollows and Rifts (with glow), plus the board at the normal camera. Send them.
- [ ] **Step 4: Commit,** with the message "Arena hex floor: moss, lichen and sprigs in the joints".

### Task 5: Tuning, documents and the check list

**Files:**
- Modify: `XLIT_DEF` defaults in `game/look.js` (tuning only), `docs/status.md`, and `docs/art-production/arena-hex-floor/BRIEF.md` (a "Delivered and integrated" note).

- [ ] **Step 1: Take a picture set:** a battle in each of the six areas, at the normal camera, with units and highlights. Tune only the `hex*` defaults until:
  - the highlights and units read at least as clearly as before (compare with today's `ab-*.png` pictures);
  - the Ruins marble isn't glaring: lower its tone through `hexRoughOff` or a per-area exposure entry `ARENA_HEX_TONE[area]` (default 1, Ruins about 0.85).
- [ ] **Step 2: Update the documents.** Add a status line, and in the brief record what was integrated and how the maps are packed.
- [ ] **Step 3: Commit, push and send the pictures.** Tell the user the checks `hexFloorMaterial`, `hexFallback`, `hexSquareBoard`, `hexMaskAligned`, `hexStateColours`, `hexGrowth` and `hexRepeat` are written and ready to run when they ask.

---

## Deferred, as agreed

- The walls, island, chasm, props and dressing round the board: a later design, after the floor.
- A per-area joint glow colour: the player's colour for now.
