# Arena backdrops: art brief

This brief is for the image author (ChatGPT). Give it this whole file. There's one image per request.

## What this is

Hexmancers battles are fought on a painted hex board seen from above at about 55°. Around and behind the board are three kinds of backdrop:
1. **Cave:** a sculpted rock face round the board.
2. **Island:** the board floats on a rock island over a chasm.
3. **Ruins:** the island, with broken columns, arches and walls round it.

The game builds the rock, cliffs and ruins as 3D shapes and paints them with **material textures** from this brief. Behind everything hang **matte paintings**: wide painted panoramas of the area's distant world.

The style is painterly, hand-painted fantasy game art matching the existing dungeon and hex floor: soft brushwork, readable shapes, and fine detail that never turns into noise. Keep everything **mid-dark and calm**: units, highlights and spells must read on top.

## Two kinds of image

**Material textures** (sections A–C) are flat-lit material maps:
- **No baked lighting:** no cast shadows, no directional highlights, no vignette. The game lights them.
- **Seamless:** each must tile in both directions with no visible seam and no single feature that repeats noticeably.
- **Format:** 1024 × 1024 PNG, square.

**Matte paintings** (section D) are finished paintings with their own atmospheric light, painted to sit far behind the battle.

## Per area: the images

`<area>` is `hollows`, `deeps`, `vault`, `rifts`, `ruins` or `abyss`.

| # | File | What |
|---|---|---|
| A1 | `<area>--rock-albedo.png` | Rock face colour, seamless |
| A2 | `<area>--rock-height.png` | Its height map |
| A3 | `<area>--rock-roughness.png` | Its roughness (white = rough) |
| B1 | `<area>--stone-albedo.png` | Dressed (cut) stone for ruins, seamless |
| B2 | `<area>--stone-height.png` | Its height map |
| B3 | `<area>--stone-roughness.png` | Its roughness |
| C1 | `<area>--special-albedo.png` | The area's special set-piece material, seamless (see the table) |
| C2 | `<area>--special-height.png` | Its height map |
| C3 | `<area>--special-roughness.png` | Its roughness |
| C4 | `<area>--special-glow.png` | Its glow mask (white glows; all black if it doesn't glow) |
| D1–D3 | `<area>--matte-1-far.png` … `-3-far.png` | Matte paintings, far plate, 2048 × 1024 |
| D1–D3 | `<area>--matte-1-mid.png` … `-3-mid.png` | Their middle layers, 2048 × 1024, transparent sky |

That's 16 images per area, 96 in all. The mattes are the most important for the look. If time is short, deliver two mattes per area first.

### A. Rock face (`rock-*`)

The natural rock of the area's caves: strata, cracks, ledges, chips and mineral streaks. It's seen as tall cliff faces, so its grain should run roughly horizontally (strata), with large and small features mixed.

> A seamless, tileable 1024 × 1024 hand-painted fantasy texture of [AREA ROCK]: natural cave rock with horizontal strata, cracks, small ledges and chips, mineral streaks. Painterly game texture, soft brushwork. Flat, even, shadowless lighting: albedo only, with no cast shadows, highlights or vignette. Tiles seamlessly on all four edges; no feature that repeats noticeably.

**Height:** give ChatGPT the finished colour image and ask for its matching greyscale height map, pixel-aligned (white high, black low). Ledges are light, cracks dark, and the grain is faint. Make roughness from it the same way (white rough). The stone is mostly rough, with polished or wet patches darker.

### B. Dressed stone (`stone-*`)

The cut stone the area's ancient builders used, for broken columns, arches, wall stubs and steps. Show it as large blocks with worn joints, chipped edges and weathering: moss, stains, frost or soot as fits the area.

> A seamless, tileable 1024 × 1024 hand-painted fantasy texture of [AREA STONE]: ancient dressed stone blocks in staggered courses, worn joints, chipped edges, weathering. Painterly game texture. Flat shadowless lighting, albedo only. Tiles seamlessly on all four edges.

Height and roughness are made as in section A.

### C. Special material (`special-*`)

One material for the area's set pieces (see the table): seamless, flat-lit, with height, roughness and a glow mask.

### D. Matte paintings (`matte-N-far`, `matte-N-mid`)

Wide, dramatic panoramas of the area's distant world, seen at eye level and slightly from above.

- **Far plate** (opaque, 2048 × 1024): the deep distance: cavern vaults, skylines, seas of lava or mist, the void. Its atmospheric light is the area's own. The **bottom third fades into the area's fog colour** (see the table), so it blends into the chasm. The **middle band is the most detailed**, the top dark. It must stay dark and soft overall: it's a background.
- **Middle layer** (2048 × 1024, transparent background): closer silhouettes in front of that plate: rock pillars, arches, ruined towers, hanging roots, floating debris. Its **sky is fully transparent** and its shapes are cut out cleanly. It's slightly darker and cooler than the far plate, and its bottom fades into the fog colour too.
- **Left and right edges** must continue sensibly when the game shows just past them. Keep big features away from the outer eighth on each side.
- **The three mattes per area must differ:** a different place, time of day or mood, or a different hero feature (a distant city, a frozen lake, a lava waterfall, a collapsed bridge).

> A wide 2048 × 1024 hand-painted fantasy matte painting, background for a game battle: [MATTE IDEA] in [AREA]. Painterly, atmospheric, dark and soft so foreground characters read clearly; most detail in the middle band; the bottom third fades into [FOG COLOUR] mist; no characters, no text.

For the middle layer, give ChatGPT the far plate and ask:

> Paint only the near silhouettes for this matte (rock pillars, arches, ruins or debris as fits), on a fully transparent background, in matching light and slightly darker; the bottom fades into [FOG COLOUR]; no sky.

## The six areas

| Area | Rock | Dressed stone | Special material (set pieces) | Fog colour | Matte ideas |
|---|---|---|---|---|---|
| **Hollows** | grey-green cave limestone, damp, mossy strata | mossy grey-green ashlar | glowing pale-green crystal (crystal seam) | deep green-black | crystal-lit cavern hall; root-choked chasm; underground lake with glowing fungi |
| **Deeps** | slate-blue rock, rime frost on ledges | frost-bitten blue stone | translucent blue ice (frozen waterfall, ice pillars) | deep navy | frozen cavern lake; ice cathedral; blizzard over a chasm |
| **Vault** | muted violet rock (like the dungeon's Vault, calm, never blue-and-gold) | carved violet stone blocks | carved rune panel, faint violet glow (vault door, pylon) | dark violet-black | arcane vault halls; floating rune monoliths; star-lit violet void |
| **Rifts** | volcanic umber basalt, ember cracks | soot-stained basalt blocks | molten lava rock, glowing cracks (lava fall) | dark red-brown smoke | lava sea under a cavern roof; erupting rift; basalt columns over lava |
| **Ruins** | olive and gold limestone | aged ivory-grey marble ashlar | carved marble relief (statue niche, colonnade) | warm dark olive-gold haze | sunken ruined city; overgrown colonnade at dusk; collapsed temple |
| **Abyss** | charcoal and navy rock, faint starry flecks | black stone with gold inlay | void-touched obsidian, faint cyan glow (monolith, chains) | near-black navy | broken stairs into the void; floating islands among stars; shattered citadel |

## Delivering

Name every file as in the table, zip one or more areas together, and send them over. The game's build checks:
- that every image is the right size;
- that the materials tile seamlessly;
- that each height map lines up with its colour image;
- that each middle layer has a real transparent sky.
