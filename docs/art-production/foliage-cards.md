# Foliage cards: a guide for giving more plants the painted-leaf look

This guide is for Claude, or anyone else, extending the leaf-card look from the trees to the rest of the dungeon's plants.

## What exists now

The **saplings** use the look. They are the trees in Overgrown rooms (`dungeongen.js`, `xClutterThemed`, case `'sapling'`). Each of a sapling's seven leaf balls is drawn as a ball of foliage cards instead of a solid sphere.

- **The art.** `game/art/environment/painterly-512/shared-foliage/leaves.png` is a tiling sheet of painted leaves with cut-out gaps. `tools/build-env-atlas.py` (`leaf_clumps()`) cuts four round, ragged-edged clumps from it, two by two, into one 256 px tile, `leaf-clumps`, in `atlas/effects.webp`. The build also:
  - makes the alpha crisp for alpha testing;
  - carries the leaf colour out under the clear pixels, so filtering and mips don't pull in the painting's bright fringe colours.
- **The cards.** `xLeafCards(F, colour, cx, cy, cz, r, R)` adds `XLEAF.cards` (12) cards round a ball:
  - Each card is a quad holding one of the four clumps, chosen at random, sometimes mirrored, with a random roll.
  - The cards sit on a golden spiral at 25–85% of the radius, facing out.
  - Their normals point out from the ball's centre and lean toward the card's own facing, so the clump is lit as one round mass.
  - Cards deeper in, and on the underside, are darker.
  - The colour is the area's leaf colour, normalised to full brightness and mixed 45% toward white, then multiplied over the painted green.
- **One draw call.** `xLeafMerger()` (F) collects every card of a room's clutter. `build()` makes one mesh with one material: `xDitherMat(xPhong({map, vertexColors, alphaTest:.5, side:DoubleSide}))`. The material has `userData.noProj=1`, so `surface.js` doesn't lay its pixel-art material atlas over it. A whole room's trees are a single draw call.
- **Fallback.** `xLeafCards` returns `false` while the effects sheet is still loading, and the caller then draws the old plain ball. `envArtFx` marks the build as missing art, so the scene is built again once the sheet arrives (`envArtArrived`).

## Recipe: giving another plant the look

1. **Find where it's drawn.** Almost all plants are `M.add(XG.ball | XG.cone, LEAF or LEAF2, …)` calls in `dungeongen.js`. Search for `LEAF`, `LEAF2`, `XG.ball` and `XG.cone`. The candidates:

   | Piece | Where | Today | Suggested treatment |
   |---|---|---|---|
   | Planter shrubs | `xClutter`, `it.k==='planter'` | 10–16 balls and cones | Leaf balls: `xLeafCards` with `r ≈ s2*.6`. Keep the flowers as balls. |
   | Boulder moss | `xClutter`, boulder `R()<.5` | Flat ball at the foot | Ground cover (below). |
   | Reeds | `xClutterThemed`, `'reeds'` | Thin cones | Leave as cones, or make crossed upright cards with a separate reed tile. Don't use the leaf clumps. |
   | Roots | `xClutterThemed`, `'roots'` | Cylinders and a flat ball | Ground cover for the flat ball only. |
   | Wall vines | `explore.js` (search `vine`) | Hanging strands | Hanging cards (below). These need a vine strip tile, not round clumps. |

2. **Make sure the room's merger F reaches the code.** In `xClutter` it's a local. In `xClutterThemed` it's in `P` (`P.F`). Code elsewhere (furniture in `explore.js`, `nature.js`) needs its own `xLeafMerger()`, built and added to the same group that holds that code's `M` mesh, so it shows and hides with it.

3. **Replace the ball and keep the fallback:**
   ```js
   if(!xLeafCards(F,lc,bx,by,bz,radius,R)) M.add(XG.ball,lc,bx,by,bz,0,R()*3,0,sx,sy,sz);
   ```
   Pass the ball's radius, which is about half its scale. A squashed ball (sy < sx) looks fine as a round card ball with a slightly smaller radius. For a strongly flat shape, use ground cover.

4. **Keep the RNG order stable if you can.** `R()` is the room's seeded stream. `xLeafCards` draws from it, so the clutter after it on the same floor changes position. That's harmless, because the layout doesn't depend on clutter dressing, but don't be surprised when the before and after pictures differ elsewhere in the room.

## Variants to build when needed

- **Ground cover (moss, leaf litter).** Lay 5–8 cards nearly flat: facing up, tilted no more than about 20°, at a height of 0.02–0.08, spread over the patch. Use normals straight up. Add an `xLeafCards` option, for example `{flat:true}`, rather than a second function.
- **Hanging vines.** Use a tall, narrow tile of a vine strand, cut by a new function in `build-env-atlas.py` the way `leaf_clumps()` is. Place cards flat against the wall, facing out, top at the wall's crown, with normals out from the wall.
- **Other leaf colours.** Fungus and the darker areas tint with `LEAF` from the area's `S.moss`. Autumn, ash or crystal leaves only need another colour passed in. The texture stays the same.
- **Mushroom caps** (`bigcap`, the `caps` walk piece) are not foliage. Leave them out.

## Adding a new foliage texture

1. Put the master in `game/art/environment/painterly-512/shared-foliage/`. A tiling sheet with real alpha gaps works best.
2. Add a cutter next to `leaf_clumps()` in `tools/build-env-atlas.py` and append its tile to `fx` under a new name. Keep the three steps:
   - a ragged mask, so no card shows a straight edge;
   - an alpha threshold;
   - colour carried under the clear pixels.
3. Run `python3 tools/build-env-atlas.py`. It rewrites the sheets and `game/envartmap.js`.
4. Read it with `envArtFx('<name>')`. For a new card kind, give `xLeafMerger` a texture name parameter. One material per texture means one extra draw call per room for each texture used.

## Tuning knobs

- `XLEAF.cards`: cards per ball. The default is 12. Use 8 for small shrubs and 16 for big canopies.
- Card size, `s=r*(1.05+R()*.5)` in `xLeafCards`: bigger cards mean bigger leaves on screen and a looser silhouette.
- Depth range, `.25+R()*.6`: lower means a denser core, higher means a fluffier edge with more gaps.
- `alphaTest:.5`: lower makes leaves fatter, higher makes them thinner with more gaps.

## Checking your work

Take a close picture in the area with the most foliage. The Gilded Ruins at depth 18, world seed 4260, is the one used for the trees. Check:

- no straight card edges;
- no bright green or yellow halos at leaf edges;
- leaves don't swim with the wood-grain atlas: if they do, `noProj` is missing;
- the clump is darker underneath;
- the fallback ball shows if the effects sheet fails to load.
