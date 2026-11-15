# Arena hex floor: art brief

This brief is for the image author (ChatGPT). Give it this whole file, plus the template images in `templates/`. Each request below is self-contained: one image per request.

## What this is

Hexmancers is a dungeon card battler. Its battles are fought on a board of 126 hexes, 9 rows by 14 columns, seen from above at about 55°, like a tabletop.

Today the board is cut from a brick-slab painting, and the bricks fight the hex shape. The new floor is **carved hex flagstones**: every hex is its own stone tile, painted *to the hex*. Wear, bevels, chips and cracks all follow the hex's outline and corners. The joints between the tiles are narrow and dark, with moss, lichen, tiny mushrooms and crystals living in them.

The game lights the tiles itself with a PBR material: real light and shade, roughness and relief. So the paintings must be **flat-lit material maps**, not finished illustrations.

The style is painterly, hand-painted fantasy game texture, matching the dungeon's painted floors and walls: soft brushwork, readable shapes, and fine detail that never turns into noise.

## The one rule that matters most

**The detail must explain the hex, never fight it.**
- **The bevel:** a clear rim around all six sides.
- **The edges:** worn and chipped, most at the corners.
- **The middle:** smoother and slightly polished by feet.
- **Cracks:** they start at a corner or edge and run inward.
- **The grain:** the stone's own texture is fine and quiet, low contrast.
- **What to avoid:** no bricks, slabs, planks, tiles-within-tiles, runes, symbols or straight lines that cross the hex.

## Rules for every image

- **No baked lighting.** Paint the colour of the stone under even, shadowless light: no cast shadows, no directional highlights and no dark vignette. The game adds the light, and tiles are turned by 60° steps for variety, so baked light would show.
- **Exact geometry.** Use the template, and paint each hex exactly inside its outline, right up to the edge.
- **Hex sheets:** pointy-top hexes (a corner straight up and straight down), with a circumradius of 240 px, centred in each 512 px cell of a 1024 × 1024 image, in a 2 × 2 grid. Outside the hex, fill with flat mid-grey (#808080); the game cuts the hex out by geometry.
- **Square, 1024 × 1024 PNG,** for every image.
- **Up in the image** is away from the player. It hardly matters, since tiles are rotated.
- **Each area's palette** is listed below, and every image for an area stays within it.
- **No text, no frames, no logos.**

## The images, per area

There are six areas: Hollows, Deeps, Vault, Rifts, Ruins and Abyss. Each needs the set below, **9 images per area** (54 in all). The file names are exact: `<area>` is `hollows`, `deeps`, `vault`, `rifts`, `ruins` or `abyss`.

| # | File | What |
|---|---|---|
| 1 | `<area>--hex-albedo-a.png` | Hex sheet: tiles 1–4, colour |
| 2 | `<area>--hex-albedo-b.png` | Hex sheet: tiles 5–8, colour |
| 3 | `<area>--hex-height-a.png` | Height map of image 1 |
| 4 | `<area>--hex-height-b.png` | Height map of image 2 |
| 5 | `<area>--joint-albedo.png` | Joint fill, seamless, colour |
| 6 | `<area>--joint-height.png` | Height map of image 5 |
| 7 | `<area>--growth-flat.png` | 16 flat pieces that lie in the joints |
| 8 | `<area>--growth-upright.png` | 16 low upright sprigs for the corners |
| 9 | `<area>--growth-glow.png` | Glow mask for images 7 and 8 together (see below) |

### 1–2. Hex tiles, colour (`hex-albedo-a`, `hex-albedo-b`)

Upload `templates/hex-tile-sheet-template.png` with the request.

Paint eight distinct hex flagstones across the two sheets, all of the area's stone. Each one has:
- **A bevelled rim, about 26 px wide** (the red line in the template marks its inner edge). It's slightly lighter or more worn on the very edge where feet have rounded it, and chipped in places.
- **A worn middle,** smoother and a touch lighter or more polished, inside the blue line.
- **Its own character:**
  - one plain and nearly pristine;
  - two with a crack from one corner;
  - one with a chipped corner missing;
  - one with a shallow worn dip in the middle;
  - one with a little moss or lichen creeping in from one edge;
  - one with a fine natural vein;
  - one heavily weathered.
- **Small differences in tone between tiles** (±10% brightness) and none inside a tile's grain.

**Prompt (fill in the area):**

> Using the attached template exactly, paint four hand-painted fantasy flagstone floor tiles, one inside each pointy-top hexagon outline (circumradius 240 px, centred in each 512 px quadrant of a 1024 × 1024 image). Each hexagon is a single carved stone tile of [AREA STONE]. Every detail follows the hexagon's shape: a worn, bevelled rim about 26 px wide around all six sides, chips at the corners, cracks that start at a corner and run inward, a smoother foot-polished middle, and fine quiet stone grain. No bricks, slabs, lines across the tile, runes or symbols. Flat, even, shadowless lighting: albedo only, with no cast shadows, highlights or vignette. Fill outside the hexagons with flat #808080. Painterly game texture, soft brushwork, crisp hexagon edges. Variants: [LIST THE FOUR FOR THIS SHEET].

### 3–4. Hex tiles, height (`hex-height-a`, `hex-height-b`)

Give ChatGPT the finished colour sheet (image 1 or 2) and ask for its height map, so the two line up exactly:

> Convert the attached image into its matching greyscale height map, pixel-aligned, same size and layout. White is high, black is low. Each hexagon's flat top is light grey (about 200). The bevelled rim slopes down to mid grey at the very edge (about 120). Cracks, chips and the worn dip are darker (40–90). Moss is slightly raised. The stone grain is a faint, low-contrast texture. Outside the hexagons is black. No lighting or shading, height only.

### 5–6. Joint fill, colour and height (`joint-albedo`, `joint-height`)

This is what shows in the narrow gaps between hexes: packed dirt, grit and dark moss of the area. It must **tile seamlessly in both directions**, without a feature that repeats noticeably. It's darker than the tiles, so the hexes stand out.

> A seamless, tileable 1024 × 1024 hand-painted texture of [AREA JOINT]: dark packed earth and grit in the cracks between flagstones, with patches of dark moss. Flat shadowless lighting, albedo only, low contrast, no large features. Tiles seamlessly on all four edges.

The height is made from it the same way as for images 3–4: grit and moss slightly raised, the earth low.

### 7. Flat growth (`growth-flat`)

Upload `templates/growth-flat-sheet-template.png`. There are 16 pieces, one per 256 px cell, each **seen from straight above, lying flat**, inside the red circle, on a **transparent background**. If transparency isn't possible, use flat #FF00FF.

Give the area roughly this spread:
- 4 moss mats of different shapes, some long and thin to follow a joint line;
- 3 lichen rosettes;
- 3 clusters of tiny mushroom caps seen from above;
- 2 scatters of crystal shards set into cracks, seen from above;
- 2 fallen leaf or needle litters;
- 2 pebble-and-grit scatters.

Use soft edges where moss meets stone. No shadows.

### 8. Upright sprigs (`growth-upright`)

Upload `templates/growth-upright-sheet-template.png`. There are 16 pieces, one per 256 px cell, each in **side view, standing on the red baseline, growing up**, inside the blue box, on a **transparent background** (or #FF00FF). These stand at the corners where three hexes meet, so they must be **small and compact**: in the game they're shorter than a unit's ankle.

Give the area roughly this spread:
- 4 small crystal clusters (2–5 points);
- 4 mushroom clusters (2–4 caps);
- 3 fern or leaf sprigs;
- 3 grass or reed tufts;
- 2 tiny root or twig loops.

Use flat, shadowless colour.

### 9. Glow mask (`growth-glow`)

Make it from images 7 and 8: a 1024 × 1024 **greyscale** image with the same layout as image 8, glowing parts white and everything else black. Mark only what should shine in the dark: crystal tips, luminous mushroom caps and glowing spores. Most cells are fully black. (Flat pieces don't glow, so this covers the upright sheet only.)

## The six areas

| Area | Tile stone | Joints | Growth |
|---|---|---|---|
| **Hollows** | Grey-green cave limestone, cool and damp, faint mineral streaks | Dark green-black earth, thick moss | Pale green glowing crystals, lantern mushrooms (glow), ferns, moss |
| **Deeps** | Slate-blue stone, rime frost in the cracks and corners | Blue-black grit with frost crystals | Ice-white crystals (faint glow), ivory bonnet mushrooms, frosted lichen |
| **Vault** | Muted violet and plum dressed stone, like the dungeon's Vault (**not** blue-and-gold, and calm) | Dark violet grit | Pale violet crystals (glow), violet mushrooms, little growth |
| **Rifts** | Volcanic umber and basalt, cracks with a faint ember glow deep inside | Black ash and cinders | Ember crystals (glow), copper cup mushrooms, dry roots, few plants |
| **Ruins** | Olive and gold limestone, old and refined, fine fossil flecks | Ochre dust, golden moss | Amber button mushrooms, grass tufts, ivy sprigs, leaf litter |
| **Abyss** | Charcoal and navy stone, very dark, faint starry mineral flecks | Void-black grit | Pale cyan crystals (glow), black trumpet mushrooms, sparse |

Keep every area's tiles mid-dark and calm, so the bright battle highlights, units and spells read clearly on top.

## Delivering

Name every file as in the table. Zip one or more areas together and send them over. The game's build checks that the sizes are right, the hexes sit where the template says, and each height map lines up with its colour sheet.
