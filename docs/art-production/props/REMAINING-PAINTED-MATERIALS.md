# Painted prop materials: what is left (a brief for Claude)

The nine painted prop materials (`docs/art-production/props/CHATGPT-PROMPTS.md`) are in the game. This file lists
**every lit surface that still does not use them, or uses the wrong one**, with what each needs and what to provide.
Work through it top to bottom. Line numbers drift; the function names are the anchors.

## 1. How the system works (read before touching anything)

- **Art:** masters in `game/art/environment/painterly-512/props/<name>-albedo|height|roughness.png`.
  `tools/build-env-atlas.py` packs them into `game/art/environment/atlas/props.webp` (colour) and `props-n.webp` (normal
  from the height map in RG, roughness in B), 256 px tiles with 16 px wrapped gutters; the tile means go to
  `game/envartmap.js` (`sheets.props.mean`). The masters are not shipped; the sheets are.
- **Loading:** `envArtProps()` in `game/envart.js` returns `{tex, ntex, rect(key), mean}` or `null` while loading. The
  sheets load with each area (`envArtWant`), and the scene is rebuilt once they arrive (`envArtArrived`).
- **Materials:** `XPROP_MATS` in `game/explore.js`, in this order (the order is the slot number):
  `planks, rough-wood, iron, clay, cloth, carved-stone, bone, brass, books`. `XPROP_GLOSS` sets how much each shines.
- **The shader:** `xPropTex(material, one)` in `game/explore.js` patches any Phong or Standard material and keeps its
  earlier patches (dither, sink and so on). It lays the material on from three sides in the piece's **own** space,
  one tile per world unit. It multiplies the piece's colour by `painting / painting mean`, so the piece keeps its
  colour and only takes the detail. It also bends the normal with the height map (not on Low graphics) and drives the
  shine from the roughness. It sets `userData.noProj`, so surface.js's old code-painted pixel pattern (`xProjShader`)
  is switched off on that material. With no sheets loaded it returns the material unchanged.
  - **Merged meshes** (`xMerger`): each vertex carries its slot in `aXL.w`, plus its pre-rotation local position and
    normal. Set `M.mat='<key>'` before the `add` calls (`null` means flat colour). The default `'auto'` guesses from
    the colour (`xPropKind`). `M.tex={s:[...],o:[...]}` overrides the scale and offset, as the book rows do. Build with
    `M.build(xPropTex(...))`.
  - **Single pieces and instanced meshes:** `xPropTex(m, '<key>')` reads `position` and `normal` (instancing aware),
    scaled by the object's scale.
  - `xMat(c, o)` already calls `xPropTex(m, xPropKind(colour))`; pass `{flat:true}` to opt out.
- **`xPropKind` (the colour guess) can only return** `iron`, `brass`, `planks`, `bone` or `carved-stone`. It never
  returns `rough-wood`, `cloth`, `clay` or `books`, and it calls any warm mid-brown "planks". **This is the root of
  most of the wrong-material bugs below.** Never rely on `'auto'` for anything made of cloth, clay, bark or rough
  timber: name the material.

### Rules that must hold

1. **Never change how many times the room-dressing dice are thrown.** Dressing is built before and after the art
   arrives; a different count re-dresses every later room and the floor visibly changes. Pick materials without
   calling `R()`, as the shelf books do (a position hash, with the old `R()` calls still made).
2. Don't wrap a material with a `map` of its own unless you first drop the map (the painting would multiply over it).
3. A wall-hugging piece's local axes decide which way the grain runs: on side faces, `u` runs along local x/z and `v`
   up local y. Planks run along `u`, rough wood along `v`. For a lying log or beam, the merger's local y is the long
   axis (the cylinder's), so rough wood's grain follows the log, which is what we want.
4. Pictures, not suites (CLAUDE.md): one picture per change, one area, a close crop, in the background.

## 2. Code work: every remaining site

Each entry gives where, what, the state today, and the material per part.

**Materials:** the keys below are the full set: round 1 (in the game now) plus round 2
(`CHATGPT-PROMPTS-2.md`, 17 more, ordered as art). A round-2 key is written `key (now: stand-in)`. Use the stand-in
until that material's art lands, then switch to it; keep the call sites naming the round-2 key in a comment, so the
switch is a search. Different kinds of the same stuff are different materials:
- **Stone:** `carved-stone` (sculpture), `dressed-stone` (building stone), `rough-rock` (broken natural rock),
  `sandstone`, `marble`, `basalt`.
- **Wood:** `planks` (crates, doors), `furniture-wood` (tables and shelves), `rough-wood` (timber), `bark` (logs),
  `end-grain` (cut ends).
- **Cloth and fibre:** `cloth` (sacking) and `fabric` (banners, bedding).
- **Metal:** `steel` as well as `iron`.

### 2.1 Themed-room kit: `xClutter` in `game/dungeongen.js`
Built with `M.build(xPropTex(xDitherMat(...)))`, but every piece is on `'auto'`. Set `M.mat` per part:

| Kind (`it.k`) | Today (auto) | Should be |
|---|---|---|
| `log` | bark `#4a3420` → planks (**flat boards: the bug the user saw**) | bark: `bark` (now: `rough-wood`); ends `#7a5a3a`: `end-grain` (now: `rough-wood`); moss balls: `null` |
| `sapling` | trunk and roots → planks | `bark` (now: `rough-wood`); soil: `soil` (now: `null`); leaf balls: `null` |
| `roots` (underfoot) | planks | `bark` (now: `rough-wood`) |
| `beam` | planks | `rough-wood` (both boxes); a separate end cap would take `end-grain` |
| `weaprack` | frame → planks | frame `WOOD2`: `rough-wood`; shafts `#5a4030`: `rough-wood`; shield `CLOTH[]` disc: `leather` (now: `cloth`) |
| `anvil` | block → planks, iron → iron | stump `WOOD2`: `end-grain` on top, `bark` on its sides (now: `rough-wood`); `IRON`/`IRON2`: `iron`; handle: `rough-wood` |
| `cratestack` | crates → planks, bands → planks | crates: `planks`; band: `planks`; barrel: `rough-wood`; hoop: `iron` |
| `urnbig` | `#9a5a34` → planks/brass, `#7a6a5a` → stone | `clay` (body, neck, rim); plinth `SH`: `dressed-stone` (now: `carved-stone`) |
| `bookcase` | carcass → planks; ~90 tiny book boxes on `CLOTH` colours → stone | carcass: `furniture-wood` (now: `planks`); **replace the book boxes with one painted row per shelf** as `xFurnish` 'shelf' does (`books`, `M.tex`, the same `R()` calls still made, colour `0x684329`) |
| `desk` | planks | top and legs: `furniture-wood` (now: `planks`); papers `#e4d8b8`: `parchment` (now: `null`); candle: `null`; book `CLOTH`: `leather` (now: `null`) |
| `table2` | planks | `furniture-wood` (now: `planks`); cups `IRON2`: `iron`; benches: `furniture-wood` (now: `planks`) |
| `bunk` | frame → planks, mattress → planks or bone | frame: `furniture-wood` (now: `planks`); mattress `#8a7a5a`: `straw` (now: `cloth`); pillow `#d8ccb0`: `cloth`; blanket `CLOTH[]`: `fabric` (now: `cloth`) |
| `bench` | stone (LT/SH) | `marble` in bathhouses (now: `carved-stone`) |
| `sarcophagus` | stone | `carved-stone`; `TRIM` band (glow, in `L`): untouched |
| `trough` | stone | `dressed-stone` (now: `carved-stone`); tap `IRON2`: `iron`; water: `null` |
| `furnace` | stone | body and chimney: `brick` (now: `dressed-stone`, or `carved-stone` until that lands); door `#1a1210`: `iron` |
| `pool`, `basin` | rims stone | pool rims: `dressed-stone`; basin (bathhouse): `marble` (both now: `carved-stone`); rocks: `rough-rock` (§2.9); water: `null` |
| `pillar`, `fire`, `ruin`, `column`, `planter` | stone | `dressed-stone` (now: `carved-stone`); temple columns: `marble`; soil: `soil` (now: `null`); `TRIM`: untouched |
| `boulder`, `bigrock`, `rubble` | carved-stone | `rough-rock` (§2.9) |
| `bigcap`, `caps` | stems → bone | stems: `fungus` (now: `null`); caps: `null` |
| `scrolls` | bone | `parchment` (now: `null`) |
| `bones` | bone | `bone` (correct) |
| `coal` | iron | `coal` (now: `null`) |
| `straw` | planks | `straw` (now: `null`) |
| `puddle`, `reeds` | stone or flat | `null` |

### 2.2 Landmark halls: `xLandmarks` in `game/dungeongen.js`
Built with `xPropTex`, all `'auto'`. Colours: `ST/DK/LT/MID` stone, `WOOD 0x5a3a20`, `WOOD2 0x3e2814`, `AREA` cloth,
`ACC` accent. Set per part: stonework → `dressed-stone`, the altar → `carved-stone`; boardwalk planks and rails (`WOOD`/`WOOD2`
boxes in the bridge and walk sections) → `planks`; posts → `rough-wood`; the altar's and the hall's cloth (`AREA`) →
`fabric` (now: `cloth`); the `BD` bands →
`iron`; the dark `ACC` strips → `null`. Read each section's comment for what it builds.

### 2.3 Arches: the arch sites in `game/dungeongen.js` (`EX.arches`)
`M.build(xPropTex(xDitherMat(...)))`, all stone, on `'auto'`. Set `M.mat='dressed-stone'` (now: `carved-stone`) explicitly (the warm tones of
some areas can fall into "planks").

### 2.4 Wall sections (pilasters and niches): `EX.sectM` in `game/dungeongen.js`
`const smat=xDitherMat(xPhong({vertexColors:true}))` is **not** patched, so it still has the old pixel pattern. These
are instanced copies of the `P` (pilaster) and `Q` (niche) mergers.
- Wrap: `smat=xPropTex(xDitherMat(...))`, and build `P` and `Q` **after** creating `smat`, so `build` adds `aXL`/`aXN`
  (it adds them only when the material is already patched).
- `P`: stone → `dressed-stone` (now: `carved-stone`). **Bevel its shaft:** the user asked for bevelled corners on the tall square pieces
  against the walls. The carved corner pillars are done (`xOctPrism`), but this pilaster (`P.add(XG.box, st, ...)`,
  0.8 wide) is a plain box and may be the piece in the user's picture. Use `xOctPrism()` for its shaft, base and cap.
- `Q`: the frame `fr` → `dressed-stone` (now: `carved-stone`); the dark recess `dk` → `null`.

### 2.5 Corner pillars, cornice and skirting: the dressing pass in `game/explore.js`
`EX.pillBase`, `EX.pillShaft`, `EX.pillCap`, `EX.corMesh` and `EX.skirtMesh` are instanced `xPhong` colours. They are
**not** patched and still have the old pixel pattern.
- Built pillars (not `cave`): `xPropTex(mat,'dressed-stone')` (now: `carved-stone`) on base, shaft and cap. The shaft has `xLitTag(...,2)`
  (AO at the foot); keep it.
- Cave pillars (`xRockShaft`, `cave`): leave them; they use the rock shader.
- Cornice `corMesh` and skirting `skirtMesh`: `dressed-stone` (now: `carved-stone`).

### 2.6 Doors: `xPortal` and the door leaves in `game/explore.js`
Patched, but on `'auto'`. The frame stone → `dressed-stone` (now: `carved-stone`). On the leaf, `planks` (`0x6a4426`, or the boss door's
`0x3a1418`) → `planks`; `band` (`0x2a2a30`) → `iron`; the boss band `0xff5d6c` is a glow colour → `null`.

### 2.7 Single props: `xMeshProp` in `game/dungeon.js` (via `xMat`)
All are patched by colour. These are wrong, so give `xMat` the material explicitly (add an `o.mat` option to `xMat`
that is passed to `xPropTex` instead of the guess):
- `block` (the pushable sand block, `0xc0904a`) → the guess gives **brass**. Use `sandstone` (now: `carved-stone`).
- `decor` camp logs (`wood`) → `bark` (now: `rough-wood`).
- `totem` pole (`wood`) → `bark` (now: `rough-wood`); skull `0xe8e0c8` → `bone`.
- `corpse` cloth `0x5a2a8a` and hat → `fabric` (now: `cloth`).
- Room banners (`xMat(cl)` in the room loop in explore.js) → `fabric` (now: `cloth`); the banner rod `0x2a2620` → `iron`.
- Hollows vines (`0x3f7a3a`, `0x5a9a4a`) → flat (`{flat:true}`).
- `merchant` stall → `furniture-wood` (now: `planks`); post → `iron`.
- `blade` (swinging trap), `mirror` frame → `steel` (now: `iron`).
- `garden` balls → flat.
- Everything else (altar, statue, tablet, inscription, pedestal, runestone, levers, plates, blades, jets, cache,
  chute bars, keystand, chains, brazier): the guess is right (stone, iron, brass). Leave it, but look at one picture of
  the puzzle floors to check.

### 2.8 Chests: `xChestBuild` in `game/surface.js`
The chests have their own code-made plank texture (`K.tex`, mapped with `xBakeUV` texture coordinates) and a
vertex-coloured iron merger (`ironM`).
- **Wood:** replace `map:K.tex` with no map, and patch with `xPropTex(m,'planks')` (chests are boards, as crates). Their texture coordinates are
  baked, but `xPropTex` uses the local position instead, so the boards will run along the chest's length. Check that
  the lid and body boards line up in a picture. Keep the lid tint (`0xa888d8` for rich chests) as the colour.
- **Iron straps, guards, lock** (`ironM`, `vertexColors`): `xPropTex(ironM)` with the merger's `M.mat='iron'`. For a
  rich chest's gold trim, use `brass`.
- **Hoard** (the gold heap in an open chest): leave it (shiny gold, `pbr`).

### 2.9 Rocks, boulders and rubble everywhere
Boulders, big rocks, rubble and the rocks round pools use `XG.rock` (dodecahedrons) in the area's stone colours; the
guess gives them `carved-stone`, a sculpture's finish, which is wrong for broken rock. They take `rough-rock` (round 2).
Until it lands, the stand-in is the **area's own rock wall tile** (`envArtAreaWalls(A)[0]`, already loaded, with a
normal map): add a `'rock'` key that `xPropTex` maps to that tile's rect in the area sheet (a second sampler pair), with
the mean taken from the tile. The Ember Rifts' rocks (and the rifts arena's basalt) take `basalt`.

### 2.10 Nature dressing: `xNatMat` in `game/nature.js`
`kind==='block'` (rock blocks on cave walls), `clump`, `clumpTop` and `vine` are plain white `xPhong` with instance
colours, still on the old pixel pattern. Blocks → `rough-rock` (§2.9). Clumps and vines → leave them
(organic, no material fits). Ice, painted cards and mushrooms → leave them.

### 2.11 Battle arenas: `game/arena.js`
Nothing in the battles is converted. The props sheets are loaded there (same area), so `xPropTex` works, but every
`arMat(...)` has to be checked to see that it keeps the patch.
- `arenaBlock`: rocks → `rough-rock` (`basalt` in the Rifts). Card walls and cages are coloured by card and glow: leave them.
- `vault`: `st 0x5a5878` (pillars and plinths) → `dressed-stone`.
- `rifts`: `bas 0x2a1a14` (basalt rocks) → `basalt`.
- `ruins`: `stone 0x8a8478` (broken columns) → `dressed-stone`, crumbling pieces `sandstone`; `vine 0x3f7a3a` → leave.
- `abyss`: `rock 0x2a3040` (floating islands) → `rough-rock`.
- `arGlow` (emissive glow pieces) → leave them.
- The arena floors, walls, dais and pillars already use painted area tiles → leave them.

### 2.12 Smaller things to check
- `explore.js` room `L` mergers (candle flames, mushroom glows): `MeshBasicMaterial`, unlit → leave them.
- `explore.js` cave kitbash rocks (the `groups` merger near `xRockShader`): already use the rock shader → leave them.
- The Low graphics path skips the relief (by design); check one Low picture so nothing looks broken.
- `xPropTex` declines `MeshStandardMaterial` only for the merger case. The PBR path is patched for roughness, but
  check that nothing standard-only (`XLIT.pbr`) looks wrong.

## 3. Art: round 2

The art brief is `CHATGPT-PROMPTS-2.md`: 17 new materials, each with an albedo, height and roughness map (51 images),
with the full object list by material. When a delivery lands:
1. Put the masters in `game/art/environment/painterly-512/props/` at 512 (as round 1).
2. Append the keys to `PROPS` in `tools/build-env-atlas.py` and to `XPROP_MATS`, in the same order. Append only, never
   reorder: the slot number is the index. The sheet grows from 3×3 to 6×5 cells (`cols` 6).
3. Add gloss for the shiny ones to `XPROP_GLOSS`: `steel` 1, `marble` .5, `leather` .3.
4. Run `python3 tools/build-env-atlas.py`, then check with `git status` that only the props sheets and `envartmap.js`
   changed.
5. Switch every `(now: stand-in)` in §2 to its own key.

## 4. Order of work

1. §2.1 the theme kit: logs first, then the rest of the table.
2. §2.7 the explicit `xMat` materials (sand block, cloth, banners).
3. §2.4 and §2.5: wall sections, pillars, cornice and skirting, and bevel the pilaster.
4. §2.2, §2.3 and §2.6: landmark halls, arches, doors.
5. §2.8 chests.
6. §2.9 and §2.10: rocks to the area rock tile.
7. §2.11 arenas.
8. §3: switch the stand-ins as round 2's art lands.

After each step: one picture of the thing changed, then commit and push. No suites unless the user asks.
