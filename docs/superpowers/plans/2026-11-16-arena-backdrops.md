# Arena backdrops implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** themed, sculpted battle surroundings, with these parts:
- three kinds per normal battle: Cave, Island and Ruins;
- set pieces per area;
- a themed battlefield per boss, where the last three react visually to their evolutions;
- matte-painting backdrops.

Everything works first on code-made stand-in materials, then on the ChatGPT art once it's delivered.

**Architecture:**
- **`game/arenabackdrop.js`** holds the sculpting (rock ribbon, island cliff, spires), the ruin kit, set pieces, boss battlefields, mattes and dressing.
- **`arena.js`** calls it: `arenaCave` picks the kind, and `arenaProps` keeps lights and particles.
- **Materials:** one function per material kind. Each returns the painted PBR set when the art is in, and a code-made stand-in (from the area's `xRockWall`/`xBlockWall` canvases, mapped in world space) until then.
- **The art build** (Task 7) is the only task that waits on the delivered art.

**Tech stack:** three.js r128, Python 3 with Pillow and numpy for the build, and Playwright checks in `tools/playtest/art-check.js`.

**Spec:** `docs/superpowers/specs/2026-11-16-arena-backdrops-design.md`. Art brief: `docs/art-production/arena-backdrops/BRIEF.md`.

## Global constraints

- **Testing (CLAUDE.md):**
  - Write each task's checks, but don't run them after each task. Run them when the user asks.
  - Take and send pictures after each visual change.
- **Kind weights per normal battle,** from the battle seed:
  - Cave 35%, Island 35%, Ruins 30%;
  - bosses always get their own battlefield;
  - the debug "Arena walls" switch off means never Cave.
- **Nothing may hide a hex, a unit or a highlight.** Every piece of geometry stays outside the board's bounds plus 0.6, and the front (the near side) stays low: nothing taller than 0.6 within 4 units of the near edge.
- **No texture stretching:**
  - rock and stone are mapped in world space at **4 units a repeat**;
  - a second sample at **2.7×** scale breaks up repetition, blended by a broad noise mask.
- **Draw calls:** the rock is one mesh per kind, the ruins one per material, the dressing one per sheet and each matte layer one quad.
- **Mattes:**
  - two layers (far, mid) on curved cards behind the far side;
  - the mid layer shifts **1.6×** as much as the far with the camera's moves;
  - only the chosen matte loads, at battle start;
  - the stand-in is the plain fog background.
- **Boss evolutions** (`e.phase` 2 and 3 on the boss in `B.enemies`) ease visual changes in over **2 s**. Only the Wyrm, the Treant and the Hollow King react. They're visual only, with no gameplay effect.
- **Boss battlefields stay ready for the next design (boss arena mechanics):** no scenery may bake in the board's outline. Board-edge trims follow `TILES` and are rebuilt by `arBdBoardEdge(A)`, so moving or missing tiles can be followed later.
- **The old block walls** (`arenaCave`'s instanced boxes) are deleted once the Cave ribbon lands. Its stand-in material replaces them.

## Review focus

1. **A battle that starts before an area's art has loaded,** or after it failed: the stand-in materials show with no errors, and the next battle uses the art. → `bdFallback`, Task 7.
2. **The Abyss's `voidWalls`:** it hides cave-floor pieces, so the Island and Ruins there must still show their cliff and ruins. → `bdAbyssIsland`, Task 2.
3. **Nothing inside the board's bounds or in front of it,** for every kind, area and boss. → `bdClearView`, Task 1, extended by each later task.
4. **A boss's phase jumping** (2 straight to 3, or the boss dying mid-transition): the effects settle at the final state and stop when the battle ends. → `bdBossPhases`, Task 5.
5. **Many battles in a row:** the geometry and textures are freed each time, and a matte isn't loaded twice. → `bdRepeat`, Task 6.

---

### Task 1: The chooser and the Cave rock ribbon

**Files:**
- Create: `game/arenabackdrop.js` (script tag after `arenahex.js` in `game/index.html`).
- Modify: `game/arena.js` (`arenaCave`, the `A.open` choice), `tools/playtest/art-check.js`.

**Interfaces:**
- Produces:
  - `arBdKind(A, R, boss) -> 'cave'|'island'|'ruins'|'boss'`, stored as `A.bd = {kind}`, with `A.open = kind!=='cave'`;
  - `arBdRockMat(Ar, kind='rock') -> Material`: the painted set when `envArtBackdrop(Ar.id)` has it (Task 7), else the stand-in, which is `xRockWall` (rock) or `xBlockWall` (stone) on a world-space triplanar-free map at 4 units a repeat plus the 2.7× detail blend, with `userData.xmold=2`;
  - `arBdRibbon(A, Ar, R, {back, near, side, boss}) -> Mesh`: the sculpted horseshoe.
- **The ribbon:** segments about 0.25 along, 0.2 up, along the old block path. Its height is the old wall's profile (tall at the back, lower toward you, at least 0.25 of full at the front) × noise (0.7–1.3), with two or three crags at the back (+40–70%).
  - **Displacement along its inward normal,** three octaves: buttresses at 0.6 units over 6-unit wavelengths; ledges at 0.2 over 1.5; chips at 0.05 over 0.3.
  - **The top** is broken by the same noise, as the dungeon wall skyline is.

- [ ] **Step 1: Write the checks** (don't run).
  - `bdKinds`: over 200 seeds, the kinds fall within ±8% of 35/35/30, and a boss depth gives `'boss'`.
  - `bdClearView`: for each kind at depths 1 and 18, no vertex of any backdrop mesh is inside the board's bounds plus 0.6, and none within 4 units of the near edge is above 0.6.
- [ ] **Step 2: Implement it.** Replace the block ring with `arBdRibbon`, and keep `A.wallCells` (the AO bake reads it) by sampling the ribbon's path.
- [ ] **Step 3: Take Cave battle pictures** at depths 1, 6 and 14 (deviceScaleFactor 2). Send them, with today's block walls beside them.
- [ ] **Step 4: Commit,** with the message "Arena backdrops: the chooser and the sculpted cave rock face".

### Task 2: The Island (sculpted cliff, underside, spires, hanging growth)

**Files:**
- Modify: `game/arenabackdrop.js`, `game/arena.js` (the island branch of `arenaCave`), `tools/playtest/art-check.js`.

**Interfaces:**
- Consumes: `arBdRockMat` (Task 1); the vine-card art through `envArtFx('vine-broad')`; `xLeafTex(img, true)`.
- Produces `arBdIsland(A, Ar, R) -> Mesh[]`:
  - **the top:** the old island top with its outline broken by noise (±0.4), never cutting inside the board's bounds plus 0.6;
  - **the cliff:** the sides sculpted as in Task 1, with strata ledges;
  - **the underside:** tapering 3–6 units down into hanging, stalactite-like lobes;
  - **hanging growth:** vine cards down the cliff edge (8–14);
  - **spires:** two to five sculpted rock spires or fragments in the chasm, 6–25 units off, 2–10 units below the board.

  None of it is tagged `caveFloor`, so the Abyss doesn't hide it.

- [ ] **Step 1: Write the check** (don't run). `bdAbyssIsland`: at depth 22 with the kind forced to `'island'`, the cliff and spire meshes are visible after `voidWalls`.
- [ ] **Step 2: Implement it.**
- [ ] **Step 3: Take Island pictures** at depths 1, 10 and 22. Send them.
- [ ] **Step 4: Commit,** with the message "Arena backdrops: the floating island's sculpted cliff, underside and spires".

### Task 3: The Ruins (ruin kit and dressing)

**Files:**
- Modify: `game/arenabackdrop.js`, `tools/playtest/art-check.js`.

**Interfaces:**
- Consumes: `arBdIsland` (Task 2), `arBdRockMat(Ar, 'stone')`, the hex growth sheets (`envArtHex(id).growth`), the mushroom cards (`xMushTile`, `xMushReady`, `envArtFx`).
- Produces:
  - **`arBdRuinKit(kind, R) -> BufferGeometry`.** The kinds are `'drum'` (a column drum), `'stub'` (a wall stub with a stepped, crumbled top), `'arch'` (whole or collapsed), `'steps'`, `'block'` (fallen) and `'plinth'`. Each is bevelled 0.04 and chipped by noise (0.03).
  - **`arBdRuins(A, Ar, R) -> Mesh[]`:** the island plus 10–18 kit pieces merged by material. They stand along the sides and back beyond the board's bounds plus 0.6, with 2–4 pieces breaking off the far edge and floating 1–4 units below and away.
  - **`arBdDressing(A, Ar, R, feet:Array<[x,z,nx,nz]>) -> Mesh[]`:** small sculpted rubble (instanced), and growth and mushroom cards at the given feet. It's used by the Cave, Island and Ruins.

- [ ] **Step 1: Extend `bdClearView`** to the Ruins and to dressing (don't run).
- [ ] **Step 2: Implement it.**
- [ ] **Step 3: Take Ruins pictures** at depths 2, 18 and 22. Send them.
- [ ] **Step 4: Commit,** with the message "Arena backdrops: ruins on the floating island, and dressing at the feet of rock and ruins".

### Task 4: Set pieces per area

**Files:**
- Modify: `game/arenabackdrop.js`, `tools/playtest/art-check.js`.

**Interfaces:**
- Consumes: Tasks 1–3; `arBdRockMat(Ar, 'special')`, whose stand-in per area is a code-made material (Hollows crystal: an emissive green `MeshStandardMaterial`; Deeps ice: transparent blue with roughness 0.1; Vault: `xBlockWall` with violet emissive runes from noise; Rifts: `arLavaTex`; Ruins: `xBlockWall` stone; Abyss: near-black with cyan edge emission).
- Produces `ARENA_SETPIECES[area]: Array<{name, kinds:['cave'|'island'|'ruins'], build(A, Ar, R, slot) -> Mesh[]}>`, with exactly the spec's pieces:

  | Area | Set pieces |
  |---|---|
  | Hollows | crystal seam, giant root wall, lantern-mushroom cluster |
  | Deeps | frozen waterfall, ice pillars, frosted ledge with icicles |
  | Vault | rune vault door or panel, arcane crystal pylon |
  | Rifts | lava fall, basalt columns |
  | Ruins | collapsed arch, statue niche, overgrown colonnade |
  | Abyss | broken stairs into the void, chained floating monolith |

  `arBdSetPieces(A, Ar, R, kind)` places one or two that fit the kind in the ribbon's or island's slots, at least one at the back.

- [ ] **Step 1: Write the check** (don't run). `bdSetPieces`: each area has its pieces by name, every battle of a kind gets one or two, and `bdClearView` holds.
- [ ] **Step 2: Implement it.**
- [ ] **Step 3: Take one picture per area** showing a set piece. Send them.
- [ ] **Step 4: Commit,** with the message "Arena backdrops: set pieces for every area".

### Task 5: Boss battlefields, and the last three's evolutions

**Files:**
- Modify: `game/arenabackdrop.js`, `game/arena.js` (`arenaProps` for bosses, the per-frame tick), `tools/playtest/art-check.js`.

**Interfaces:**
- Consumes: Tasks 1–4; the boss in `B.enemies` (`e.def.boss`, `e.def.bossId`, `e.phase` 1–3, the Golem's `e.weak` (a colour name) with `COLORS[name].c`).
- Produces `ARENA_BOSSFIELD[bossId] = {build(A, Ar, R) -> Mesh[], tick(A, T, dt, boss)}` for golem, glacier, roc, wyrm, treant and hollow, as the spec's table describes:
  - **golem:** the prism geode. Each frame, its crystal glow eases toward `COLORS[e.weak].c`.
  - **glacier:** the throne hall.
  - **roc:** the storm aerie, with lightning flashes on the matte or sky.
  - **wyrm:** the caldera. Phase 2: seam emission ×1.6, lava +0.4 up, light toward `#ff5a2a`. Phase 3: ×2.2, +0.8, and redder still.
  - **treant:** the temple heart. The veins pulse while any Root Node lives. Phase 2: roots close in by 1 unit. Phase 3: by 2, and the light toward autumn `#d9a050`.
  - **hollow:** the shattered throne. Phase 2: two shards break off and drift. Phase 3: four more, fog over its half at ×1.8, ambient ×0.7.

  Changes ease in over 2 s, and a skipped phase lands on its own final state. `arBdBoardEdge(A)` builds any trim along the board's edge from `TILES`.

- [ ] **Step 1: Write the check** (don't run). `bdBossPhases`: on each of the last three, set `e.phase` 1→3 directly. After 2.5 s the target state is reached (for example the Wyrm's lava height is +0.8). After the battle ends, its tick stops.
- [ ] **Step 2: Implement it.**
- [ ] **Step 3: Take a picture of each boss battlefield,** and of the last three at phases 1 and 3. Send them.
- [ ] **Step 4: Commit,** with the message "Arena backdrops: a battlefield per boss; the last three change as their boss evolves".

### Task 6: Matte paintings (cards, parallax, stand-in, loading)

**Files:**
- Modify: `game/arenabackdrop.js`, `game/envart.js` (`envArtMatte`), `game/arena.js` (the camera tick feeds the parallax), `tools/playtest/art-check.js`.

**Interfaces:**
- Produces:
  - **`envArtMatte(id, n) -> {far:Image, mid:Image} | null`.** `id` is an area or `'boss-<bossId>'`. It loads on the first call; both layers are needed, or it's null for good once one fails.
  - **`arBdMatte(A, Ar, R)`.** It picks a matte number by seed, avoiding the last battle's choice (`AR_LAST_MATTE`). It builds two curved cards: far at radius 70, 110° wide; mid at radius 45, 100° wide. Both sit centred behind the far side, with the lower edge 6 units below the board and the top above the view. Each card's lower 25% fades to the fog colour (in its shader). The cards appear once loaded and fade in over 0.6 s.
  - **`arBdMatteTick(A)`:** the mid card's offset follows the camera's offset from its base times 1.6, against the far card's.
- **Until the art exists,** the stand-in is no card (the plain fog background), so nothing changes.

- [ ] **Step 1: Write the checks** (don't run).
  - `bdRepeat`: across 5 battles, the renderer's texture count doesn't grow, and the same matte Image object is reused when it's chosen again.
  - `bdMatteOrder`: two battles in a row in the same area never pick the same matte when that area has two or more.
- [ ] **Step 2: Implement it.**
- [ ] **Step 3: Take pictures** using a placeholder matte painted in code (a gradient with silhouettes), to check placement and parallax. Send them.
- [ ] **Step 4: Commit,** with the message "Arena backdrops: matte painting cards with parallax".

### Task 7: The delivered art (build, loader, swap-in). Starts when the art arrives.

**Files:**
- Create: `tools/build-arena-backdrops.py`, `game/arenabackdropmap.js` (generated), and `game/art/environment/arena/backdrops/*` (generated).
- Modify: `game/envart.js` (`envArtBackdrop`), `game/index.html`, `tools/playtest/art-check.js`.

**Interfaces:**
- Consumes: the masters in `game/art/environment/painterly-512/arena-backdrops/`, per the brief's file names.
- Produces, per area and per `boss-<id>`:
  - `rock`, `stone` and `special` sets at 512: colour (lossy q90), normal from height (lossless) and `-m` data (R AO, G roughness, B metalness), with `special-e` glow where it isn't black;
  - mattes at 2048 × 1024: far as lossy q85, mid as lossy q85 with lossless alpha;
  - `ARENA_BACKDROP = {areas, bosses, mattes:{id:count}}`;
  - **`envArtBackdrop(id) -> {rock, stone, special}`** (each `{map, n, m, e?}`), or null until every one has loaded.
- **Build checks:**
  - sizes;
  - seamless tiling (the RMS difference across opposite edges under 6/255);
  - height-to-colour edge correlation of at least 0.15, else a brightness fallback with a `WARN`;
  - each mid layer's top 10% at least 90% clear.

- [ ] **Step 1: Write the build's `--check`** (it asserts the above) and the `bdFallback` check: with ROUTES 404ing `**/arena/backdrops/hollows-rock.webp`, a Cave battle shows the stand-in with no page errors.
- [ ] **Step 2: Run `python3 tools/build-arena-backdrops.py --check`** before the build. Expected: FAIL, the outputs are missing.
- [ ] **Step 3: Implement the build and the loader.** `arBdRockMat` and `envArtMatte` pick up the art.
- [ ] **Step 4: Run the build, then `--check`.** Expected: PASS.
- [ ] **Step 5: Take pictures:** each kind and each boss, with the art. Send them.
- [ ] **Step 6: Commit,** with the message "Arena backdrops: the painted materials and matte paintings".

### Task 8: Tuning and documents

- [ ] **Step 1: Take a picture set:** each area × each kind, plus each boss, at the normal battle camera with units and highlights. Tune only the noise amplitudes, the matte fade and the dressing counts until nothing reads as blocks or repeats and units and highlights read at least as clearly as today.
- [ ] **Step 2: Update the documents:** a `docs/status.md` line, and a "Delivered and integrated" note in the brief once the art is in.
- [ ] **Step 3: Commit, push and send the pictures.** List the checks ready to run: `bdKinds`, `bdClearView`, `bdAbyssIsland`, `bdSetPieces`, `bdBossPhases`, `bdRepeat`, `bdMatteOrder` and `bdFallback`.

---

## Deferred, as agreed

- **Boss arena mechanics:** fields that break apart and drift, shaped fields and rising walls for the last three bosses. These come in the next design, and Task 5 keeps the board-edge pieces rebuildable for it.
