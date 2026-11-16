# Arena backdrops: design

**Status:** design, waiting for approval. **Art:** `docs/art-production/arena-backdrops/BRIEF.md` (for ChatGPT). This follows the arena hex floor (`2026-11-15-arena-hex-floor-design.md`), which is done.

## Intent

The battle arena's surroundings look low-poly and unprofessional:
- the walls are one bevelled box copied about 30 times;
- their height is made by stretching, which streaks the painting;
- every block shows the same whole painting;
- there's no bespoke detail anywhere;
- most battles are a plain flat-topped island over a generic chasm.

The user wants **themed, higher-quality backgrounds and geometry**, varied from battle to battle: "some should keep open island, some should have walls, some could look like ruins on an open floating battle field", plus matte paintings to vary it further.

## Goals

- **Three kinds of backdrop,** one chosen per battle:
  1. **Cave:** a sculpted rock face round the board.
  2. **Island:** the board on a floating rock island over the chasm, with a sculpted cliff edge.
  3. **Ruins:** the island with ruins on and around it.
- **Themed per area** (Hollows, Deeps, Vault, Rifts, Ruins, Abyss): each area has its own painted materials, set pieces and matte paintings.
- **Sculpted geometry:**
  - no visible boxes;
  - no texture streaking: textures are laid out in world space at real scale;
  - large-scale variation over the rock, so no two stretches look alike.
- **Bespoke set pieces:** two or three per area, placed by hand-written rules, never stamped.
- **Matte paintings:** two or three painted panoramas per area, in two layers (a far plate and a cut-out middle layer). They sit behind and below the arena and shift a little with the camera for depth. Each battle picks one, so backgrounds vary.
- **Dressing at the foot of rock and ruins,** in the dungeon's language: rubble, moss, roots and mushrooms, reusing the existing growth and mushroom art.

## Non-goals

- No change to the board, the hex floor, gameplay, the camera framing or the highlights.
- No hand-made 3D models (glTF): rejected as an art pipeline the project doesn't have (Approaches).
- The dungeon's own walls are unchanged.

## Anti-goals (a failure even if it works)

- Anything that hides a hex, a unit or a highlight from the battle camera. The front of the arena stays low and open, as today.
- Backgrounds so bright or busy that units, highlights and spells read worse. Matte paintings stay dark and soft near the board's horizon.
- Visible repetition: the same rock stretch, ruin piece or matte twice in one view.
- A battle that waits on art. The current look stands in until an area's backdrop art has loaded, as the hex floor does.
- Phone performance falling noticeably below today's arena.

## Constraints

- three.js r128 and the existing arena pipeline (`arena.js`: `arenaCave`, `arenaProps`, `ARENA_LOOK`, `arChasm`, lights, AO and mold).
- Art comes from ChatGPT image generation, as before: paintings and tileable material maps, never 3D models. The build tool checks and packs it, as `tools/build-arena-hex.py` does.
- **Download size:** an area's backdrop art loads with its other art. Matte paintings are large, so only the matte a battle picks is loaded, when the battle starts, with the old sky until it arrives.
- **Draw calls:** the rock is one mesh per kind, ruins one per material, dressing one per sheet, and each matte layer one quad.

## Approaches considered

1. **Sculpted geometry in code with painted materials.** Light and fits the project, but its quality is capped by what code can sculpt.
2. **Hand-made 3D models.** The most detailed silhouettes, but ChatGPT can't make them, and it needs a model pipeline, a loader and bigger downloads. Rejected.
3. **Painted backdrops plus sculpted near geometry (chosen),** extended at the user's request with **several matte paintings per area** for variety. Most of what reads as professional is depth and atmosphere, which painted panoramas give cheaply. The sculpted near geometry keeps what's close solid and themed.

## The design

### Choosing a backdrop (per battle, from the battle's seed)

| Kind | Normal battles | Boss battles |
|---|---|---|
| Cave | 35% | always (as today) |
| Island | 35% | never |
| Ruins | 30% | never |

The matte painting is chosen from the area's set by seed as well, and never the same as the last battle's when another is available. The debug menu's existing "Arena walls" switch keeps its meaning (off: never Cave).

### Cave: the sculpted rock face
- **The ribbon:** one continuous horseshoe (back, then both sides) replacing the block ring, along the same path the blocks use now. It's tall at the back and steps down along the sides toward you, and is open at the front, as today.
- **Detail:** about 0.25-unit segments along and 0.2 up, displaced along its normal by layered noise (big buttresses and recesses, mid ledges, fine chips).
- **Skyline:** broken, as the dungeon walls' is. Heights vary by noise, with two or three tall crags at the back.
- **Material:** the area's painted rock PBR (colour, normal from height, roughness), mapped in world space, about 4 units per repeat, with no stretching. A second sample at about 2.7× scale, offset and blended by a broad noise mask, breaks up repetition. The mold layer applies (`userData.xmold=2`).
- **Set-piece slots:** two or three places along the ribbon (at least one at the back) where the area's set pieces sit (below).

### Island: the floating rock
- **The top:** the area's rock floor, as now, with its edge broken by noise instead of a straight box edge.
- **The cliff:** sides sculpted the same way as the cave face (strata ledges, chips), and an underside tapering into hanging, stalactite-like rock, so the island reads as floating.
- **Hanging growth:** roots and vines from the cliff edge, using the existing vine-card art.
- **The chasm:** two to five sculpted rock spires and floating fragments, at varied depths and distances, replacing today's plain dodecahedrons where they exist.

### Ruins: the island with ruins
- **Base:** the island, as above.
- **A ruin kit,** built in code:
  - broken column drums;
  - wall stubs with crumbled, stepped tops;
  - an arch (whole or collapsed);
  - steps;
  - fallen blocks;
  - a plinth.

  All are bevelled and chipped by noise, and textured with the area's painted **dressed-stone** PBR.
- **Placement:** along the sides and back, beyond the board's edge (never on a hex), plus a few pieces breaking off the island's far edge and floating in the chasm.
- **Dressing:** moss, roots and mushrooms at the ruins' feet.

### Set pieces per area (two or three, spread over the three kinds)

| Area | Set pieces |
|---|---|
| Hollows | crystal seam in the rock (glowing); giant root wall; lantern-mushroom cluster |
| Deeps | frozen waterfall; ice pillars; frosted ledge with icicles |
| Vault | carved vault door or rune panel set into the rock; arcane crystal pylon |
| Rifts | lava fall from a crack; cooling basalt columns |
| Ruins | collapsed arch; statue in a niche; overgrown colonnade |
| Abyss | broken stairs into the void; chained floating monolith |

Each is sculpted geometry, using the area's materials plus at most one special material from its set-piece sheet (ice, crystal, lava, carved panel), and its own glow where luminous.

### Matte paintings
- **The set:** two or three per area, each in two layers:
  - **Far plate:** opaque, 2048 × 1024, the distant world: caverns, skylines, lava seas, the void.
  - **Middle layer:** RGBA, 2048 × 1024, closer silhouettes (pillars, rock arches, ruin skylines, floating debris), with clear sky between.
- **Placement:** each layer is a large curved card behind the far side of the arena, below the camera's horizon line and reaching up past the top of the view. The middle layer is closer and shifts more with the camera's moves, giving parallax.
- **Blending into the scene:**
  - the layers take the area's fog colour toward their lower edge, so they meet the chasm without a seam;
  - the existing chasm fog and dust stay in front of them;
  - in the Cave, only the parts above the rock face show.
- **Loading:** only the chosen matte loads, at battle start. Until it arrives, the scene's plain fog-coloured background stands in.

### Dressing
Rubble, moss and mushrooms go along the feet of the rock face, ruins and cliff edge. They're placed off the board by seeded rules, reusing:
- the hex floor's growth sheets (`arenahex.js`);
- the mushroom cards (`mushrooms.js`);
- the vine cards (`nature.js`).

Rubble is sculpted small rocks in the area's rock material, as one instanced mesh.

### Build and art
- **A new `tools/build-arena-backdrops.py`** reads the delivered PNGs (masters under `game/art/environment/painterly-512/arena-backdrops/`, which the zip build leaves out). It writes 512–1024 WebPs to `game/art/environment/arena/backdrops/` and a map `game/arenabackdropmap.js`. It checks sizes, seamless tiling of the materials, and that each middle layer's alpha is a real cut-out.
- **The loader:** `envart.js` loads an area's material sets with its other art (`envArtBackdrop(id)`), and a chosen matte on request (`envArtMatte(id, n)`).
- **A new `game/arenabackdrop.js`** holds the sculpting, the ruin kit, the set pieces and the mattes. `arenaCave` calls it, and the old block walls remain only as the stand-in until the art has loaded.

## Left to the builder

- The noise layers' exact frequencies and amplitudes, and the segment counts, tuned on pictures against "no visible blocks" and phone performance.
- The ruin kit's exact shapes and their placement rules, within "never on a hex, never in front of the board".
- How each set piece is sculpted, within its description.
- The matte cards' exact radius, height and parallax factors.

## My calls (correct any)

- The weights are 35 / 35 / 30, and bosses are always Cave.
- Mattes: two layers each, two or three per area, 2048 × 1024, loaded only when chosen.
- The rock and dressed stone are tileable PBR sets per area (colour, height, roughness), as the hex floor's are, with metalness only where an area's art paints it.
- Set pieces are sculpted in code from those materials plus one special material each, not separate paintings on cards.
- The dressing reuses existing growth, mushroom and vine art, so it needs no new art.
