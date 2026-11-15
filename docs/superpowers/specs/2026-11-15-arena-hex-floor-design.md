# Arena hex floor: design

**Status:** design, waiting for approval. **Art:** `docs/art-production/arena-hex-floor/BRIEF.md` (for ChatGPT) and its `templates/`; **delivered** 2026-11-15 (revision 2) and stored in `game/art/environment/painterly-512/arena-hex/` (its `README.md` and `INTEGRATION-NOTES.md` are the art's own conventions).

## Intent

The battle arena should match the new painted dungeon. The board is its heart. Today each hex shows a random window onto a brick-slab painting, so the bricks fight the hex shape, and the board reads as flat and undetailed.

The new floor is **carved hex flagstones**:
- Every hex is its own stone tile, painted to the hex, with a bevelled rim, worn edges and chipped corners, cracks that follow the shape, and a smoother middle.
- The tiles sit in narrow dark joints.
- Small things live in the joints: moss and lichen lying flat, and low crystals, mushrooms and sprigs at the corners where three hexes meet.
- A PBR material makes the floor's material nature tunable.

The user's words: the detail must be detailed enough, and "the textures on them compete with the shape, not aid in it". This design fixes that.

## Goals

- **Readable hexes:** each hex reads as a solid, carved tile, with the detail supporting the shape.
- **Painted per area:** six tile sets, one per area (Hollows, Deeps, Vault, Rifts, Ruins, Abyss), matching each area's dungeon.
- **PBR, tunable live:** colour, height (made into normal and ambient occlusion maps), roughness and metalness, with the tuning in the debug menu.
- **Natural joints:** flat growth along the joints, and low upright sprigs at the three-way corners. None of it has collision or affects play.
- **Your half:** marked by a soft glow in its joints, in your colour. The tiles keep their true painted stone, replacing today's blue-teal wash.

## Non-goals

- No change to the board's layout, its size (9 × 14) or the hex grid.
- No change to gameplay, collision or highlights. The move, target and hazard highlights stay on the decal layer above the board, as today.
- No change to the walls, island, chasm or props round the board. Those are the next step, after the floor.

## Anti-goals (a failure even if it works)

- Anything that hides a hex, a unit or a highlight from the battle camera. Upright sprigs stay below a unit's ankle and only at corners.
- A floor so busy or bright that highlights and units read worse than today. The Vault arena paintings were rejected for exactly this.
- Visible repetition: the same tile in the same turn side by side.
- Baked lighting in the art fighting the game's lights.

## Constraints

- Phones: the whole board stays one draw call for the tiles, one for the joints and one per growth sheet, as instanced or merged meshes like the dungeon's foliage cards.
- The code-painted floor stands in until an area's art has loaded, and wherever an area's art hasn't been delivered yet.
- The art comes from ChatGPT image generation. Its geometry and maps will be imprecise, so the build checks and corrects them (below).

## Approaches considered

1. **Painted hex tiles, with shape-based lighting under them (chosen).** Art painted to the hex, plus a PBR material. Hand-made detail, which is what the dungeon's look is. It waits on the art.
2. **Hexes built from their shape in a shader.** Distance-to-edge drives the bevel, wear, joint shadow and cracks, over faint stone grain. Every area works at once and it's very tunable, but it looks procedural. Rejected as the main look, but kept as the stand-in (below).
3. **Raised hex plinths, or one floor with a hex grid inlaid.** Both were shown as mockups and rejected: not detailed enough, with the texture fighting the shape.

## The design

### The tiles
- **Shape:** each hex is a flat-topped tile set flush in the floor, with a tile radius of **0.92** (today 0.96) on the existing grid of radius 1. That makes the joints about 0.14 wide, room for growth to show.
- **Mesh:** one merged mesh. A tile's top maps its hex to one of the 8 painted variants, turned by a multiple of 60° and sometimes mirrored, chosen from the tile's key. Neighbours never share the same variant and turn.
- **Rim:** there's a thin bevel (a narrow sloped ring of geometry) for a silhouette at the edge; the painted rim does the rest.
- **Material:** a `MeshStandardMaterial` (the debug menu's PBR path) using:
  - the colour atlas;
  - a normal map made from height at build time;
  - an ambient occlusion map from height;
  - a roughness map derived from colour and height (rim and cracks rougher, middle smoother);
  - metalness 0.
- **Debug sliders,** in a new "Arena floor" section of the Surfaces tab:
  - roughness (scale and offset);
  - metalness;
  - normal strength;
  - AO strength;
  - edge wear brightness;
  - joint glow strength.
- **Shading on top:** the existing lighting, AO map and mold layer still apply over it.

### The joints
- **The plane:** one plane under the tiles, at the joints' depth, carrying the area's joint fill texture (colour plus height-made normal map), tiling in world space.
- **Your side:** your half's joints glow faintly in your colour. That's an emissive term masked by side, strongest close to the tiles and fading into the gaps. It replaces the blue-teal wash.

### The growth
- **Flat pieces:** cards lying on the joint plane along joint lines, rotated to follow them, a few per tile edge at random by tile key. They sit under the tiles' edge height so they never cover the tile tops.
- **Upright sprigs:** small crossed cards at about 1 in 3 of the three-way corners, 0.08 to 0.22 tall (a unit stands about 2.2). The glowing ones get their glow mask as emission, as the dungeon mushrooms do.
- **Draw calls:** one merged mesh per sheet per battle, using the cut-out and no-mip treatment of the dungeon's thin cards.
- **Play:** no collision and no effect on play, and nothing is placed on a hex's top.

### The stand-in (until the art arrives)
Approach 2 in small form. The same tile mesh and material, with the area's current code-painted stone as faint grain and a height made from distance to the hex edge (bevel, rim wear, slight middle dip). No growth. That keeps the joints and side glow working everywhere from day one.

### Build step
A new `tools/build-arena-hex.py` reads the delivered PNGs (masters stored under `game/art/environment/painterly-512/arena-hex/`, which the zip build leaves out) and:
1. checks each sheet's size, and that each hex sits within a few pixels of the template's place, reporting any misfit;
2. cuts each hex by exact geometry into a per-area atlas of 8 variants at 256 px a hex, with colour carried a few pixels out past the edge for filtering;
3. checks that each height sheet lines up with its colour (correlation of edges). If it doesn't, it builds the height from the colour's brightness plus the hex edge distance instead, and says so;
4. makes the normal, AO and roughness maps from height and colour;
5. cuts the growth sheets into card tiles: transparent or #FF00FF cut out, colour carried under clear pixels, glow masks into a matching emission sheet;
6. writes WebPs to `game/art/environment/arena/hex/`, and their rectangles into the art map.

## What the art delivered (beyond the brief)

Per area, all 1024 px:
- **Maps for each hex sheet:** colour, height, **roughness** (white is rough; used directly, not inverted) and **metalness** (0, except the Deeps' silver and Abyss's gold flecks, which are real metal where painted).
- **Variation masks per sheet** (`variation/`), packed as RGBA data, not opacity:
  - R: edge wear;
  - G: cracks and chip faces;
  - B: broad colour patches;
  - A: moss and mineral staining.
- **A tile coverage map:** the true hex outline including chipped-off corners. Chipped corners are cut by it (alpha test), so they show the joint beneath, not grey.
- **Joint fill:** colour, height, roughness and metalness.
- **Growth sheets:** flat and upright, each with roughness and metalness, plus the upright glow mask (Ruins: none).
- **Shared:** a seamless broad noise (`shared/broad-noise-seamless.png`) for large-scale tone drift across the board.

**Changes to the design that follow from it:**
- Roughness and metalness come from the art, not derivation. The debug sliders scale and offset them.
- The masks drive per-tile variety from the tile key:
  - edge wear brightness and roughness (R);
  - crack and chip darkening and roughness (G);
  - mild tone shifts (B), held within ±7% brightness;
  - moss staining strength (A).
- The broad noise adds a slow tone drift across the whole board, so it never looks like a repeated tile.
- Growth colours are the art's own (complementary hue groups). There's no area colour wash over them.
- Upright sprigs are dropped (or swapped for flat pieces) where they would draw under about 8 px tall on screen.
- Height, roughness, metalness, masks, coverage and glow are loaded as linear data; colour is sRGB.

## Left to the builder

- The exact merged-mesh layout, UV packing, and how the tile key picks variant, turn and mirror.
- The bevel's geometry width and the roughness derivation's exact curve.
- Where the joint glow's colour comes from (the existing player-side colour), and its fade.
- The number of flat pieces per edge, tuned on pictures against "natural, never busy".

## My calls (correct any)

- Tile radius 0.92 for wider joints.
- Height comes from ChatGPT made from the colour sheet, with a fallback to brightness and edge distance. Roughness is derived, not painted, which halves the art.
- 256 px a hex at runtime: a hex is about 55–80 px on a phone screen.
- Walls, island, props and dressing round the board are a separate later step, after the floor lands.
