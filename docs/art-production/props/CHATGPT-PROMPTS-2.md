# Dungeon props, round 2: the ChatGPT prompts

Round 1 (`CHATGPT-PROMPTS.md`) delivered nine materials: planks, rough wood, iron, clay, sacking cloth, carved stone,
bone, brass and books. They are in the game. But nine is too few: things made of different kinds of the same stuff
were sharing one texture. A pillar, a boulder and a statue were all "stone"; a fallen log and a weapon rack were both
"rough wood"; a banner and a sack were both "cloth". This round gives each kind of surface its own material.

## What each object is made of (the full list)

Every lit prop in the dungeon and the battle arenas, by material. **Bold** = new this round; the rest exist already.

### Stone: five kinds
| Material | What it looks like | Used on |
|---|---|---|
| carved stone *(have)* | smooth, fine grain, no joints | statues, altars, sarcophagi, pedestals, rune stones, tablets, inscriptions, shrines |
| **dressed stone** | squared building stone, chisel-tooled faces, worn arrises | pillars and their bases and caps, pilasters, columns, arches, cornices, skirting, niche frames, door frames, stairs, benches, basin and pool rims, troughs, planters, ruin walls, landmark hall stonework, arena pillars, the battle's boss dais |
| **rough rock** | broken natural rock, fractures and facets | boulders, big rocks, rubble, rocks round pools, rocks in collapsed rooms, rock blocks on cave walls, the caves' rock pillars, arena rocks |
| **sandstone** | soft layered stone, bedding lines, eroded | the pushable puzzle block, the Ruins' crumbling pieces |
| **marble** | pale polished stone with soft veins | bathhouse basins and benches, temple columns, the mirror puzzle's frames' plinths |

### Wood: five kinds
| Material | What it looks like | Used on |
|---|---|---|
| planks *(have)* | rough weathered boards, nail holes | crates, crate stacks, chests, doors, boardwalks and bridges, barrel heads |
| **furniture wood** | planed, finer grain, darker, worn smooth | tables, desks, benches (wooden), bunks, shelves and bookcases, the merchant's stall |
| rough wood *(have)* | split timber, long grain, no boards | barrel staves, weapon racks, beams, posts, spear shafts, tool handles |
| **bark** | rough bark with deep furrows | fallen logs, saplings' trunks, roots, camp-fire logs, the totem pole |
| **end grain** | the cut end of a log: rings and cracks | the ends of logs and beams, the anvil's stump |

### Metal: three kinds
| Material | What it looks like | Used on |
|---|---|---|
| iron *(have)* | hammered, pitted, rusty | barrel hoops, crate bands, chest straps, anvils, braziers, chains, hinges, levers, grates, the forge door |
| brass *(have)* | tarnished golden | chest trim, fittings, statue ornaments, pressure plates, lamp fittings |
| **steel** | brighter cold metal, fine scratches | blades (the swinging trap, weapon heads), the mirror frames, cages |

### Cloth, fibre and hide: five kinds
| Material | What it looks like | Used on |
|---|---|---|
| sacking *(have, "cloth")* | coarse loose weave, undyed | sacks, mattresses' ticking |
| **woven fabric** | finer dense weave, takes dye | banners, blankets, bedding, rugs, the corpse's robe and hat, shields' covers |
| **straw** | loose dry straw | the barracks' straw, straw mattresses |
| **leather** | worn smooth hide, creases | straps, grips, bunk straps, saddle and book covers on desks |
| **parchment** | old paper, stains, no writing | scrolls, papers on desks and tables |

### Everything else
| Material | What it looks like | Used on |
|---|---|---|
| clay *(have)* | unglazed terracotta | urns, big urns, jars, pots |
| bone *(have)* | weathered porous bone | bones, skulls, skeletons, the totem's skull |
| books *(have)* | rows of spines | shelves, bookcases |
| **brick** | small fired bricks and mortar | the forge's furnace and chimney |
| **coal** | dull black lumps | the forge's coal heaps |
| **soil** | dark earth with grit and roots | planters, the saplings' ground |
| **fungus flesh** | soft pale flesh, fine fibres | the giant mushrooms' stems and the small caps' stems |

Left without a material on purpose: candles (wax), water, glowing things, leaves and moss (painted cards already),
gold heaps (shiny on purpose).

**This round: 17 materials, 51 images.**

## How to use (as round 1)

- **One image per request.** Paste the prompt and attach what it says.
- **Size:** every texture is **1024 × 1024**, PNG, saved under the exact file name shown.
- **Make each colour image first**, then make its height and roughness maps *from* it (attach it) so they line up.
- **Mid-toned and fairly neutral colour.** The game tints each prop by area and object; keep the detail in the value,
  not the hue.
- **Style:** hand-painted fantasy game art like round 1, soft brushwork, calm, detail that reads when a prop is a few
  dozen pixels across.
- **Scale:** one texture covers **one metre**.
- **Tiling:** seamless on all four edges, with nothing that repeats noticeably. No text, no objects, surfaces only.
- **If time is short,** do them in the order below: the first six fix what is wrong on screen now.
- **Delivery:** zip them, keep the file names.

Every colour prompt ends with the same tail; it is written out in full each time so each can be pasted alone.

---

## 1. Dressed stone (pillars, arches, cornices, door frames) — `props--dressed-stone`

**`props--dressed-stone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of a single face of squared, dressed building stone with no joints: parallel diagonal chisel tooling marks across the face, slightly worn smooth in patches, a few small chips and hairline cracks, grime settled in the tooling. Mid-toned neutral grey stone, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--dressed-stone-height.png`** (attach `props--dressed-stone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the tooling marks as fine shallow grooves, chips and cracks dark, the worn patches flat. No lighting, height only.

**`props--dressed-stone-roughness.png`** (attach `props--dressed-stone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; mostly rough, the worn patches a little smoother. No lighting.

## 2. Rough rock (boulders, rubble, cave rocks) — `props--rough-rock`

**`props--rough-rock-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of broken natural rock: angular fracture planes and facets, sharp cracks, small pits, gritty patches and a little dust in the hollows, no worked surfaces. Mid-toned neutral grey rock, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--rough-rock-height.png`** (attach `props--rough-rock-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; strong relief: the facets as planes at different heights, cracks and pits deep and dark. No lighting, height only.

**`props--rough-rock-roughness.png`** (attach `props--rough-rock-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

## 3. Bark (logs, saplings, roots, the totem) — `props--bark`

**`props--bark-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old tree bark: thick rough bark in long ridges running vertically, deep furrows between them, a few patches where the bark has flaked off showing smoother wood, a little lichen. Mid-toned weathered grey-brown, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--bark-height.png`** (attach `props--bark-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the ridges high, the furrows deep and dark, the flaked patches low and flat. No lighting, height only.

**`props--bark-roughness.png`** (attach `props--bark-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light); the flaked patches a little smoother. No lighting.

## 4. Woven fabric (banners, blankets, bedding, robes) — `props--fabric`

**`props--fabric-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of a dense, finely woven wool fabric: a tight visible twill weave running diagonally, a little fuzz and pilling, faint fading and a few small stains, no pattern and no folds. Mid-toned neutral light grey-beige, as undyed wool, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--fabric-height.png`** (attach `props--fabric-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the twill ridges faint and regular. No lighting, height only.

**`props--fabric-roughness.png`** (attach `props--fabric-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

## 5. Furniture wood (tables, desks, shelves, bunks) — `props--furniture-wood`

**`props--furniture-wood-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of planed hardwood boards joined edge to edge, running horizontally, each board about 1/5 of the image tall, with tight fine straight grain, very fine joints between the boards, worn smooth and slightly darkened by handling, a few scratches and rings, no nails. Mid-toned warm brown, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--furniture-wood-height.png`** (attach `props--furniture-wood-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; mostly flat, the joints thin and dark, scratches faint. No lighting, height only.

**`props--furniture-wood-roughness.png`** (attach `props--furniture-wood-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; mid-grey overall, the handled areas smoother (darker). No lighting.

## 6. Sandstone (the pushable block, crumbling Ruins pieces) — `props--sandstone`

**`props--sandstone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of soft sandstone: fine horizontal bedding layers of slightly different tones, eroded softly between the layers, sandy grain, a few small pits and worn edges, no blocks or joints. Mid-toned muted sandy beige, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--sandstone-height.png`** (attach `props--sandstone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the harder layers slightly raised, the softer eroded ones lower, pits dark. No lighting, height only.

**`props--sandstone-roughness.png`** (attach `props--sandstone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

## 7. End grain (log and beam ends, stumps) — `props--end-grain`

**`props--end-grain-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of sawn end grain of timber: close concentric growth rings in gentle arcs across the whole image, radial drying cracks, saw marks faint, darker weathered patches. Mid-toned weathered brown, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--end-grain-height.png`** (attach `props--end-grain-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the rings faint, the cracks dark and deep. No lighting, height only.

**`props--end-grain-roughness.png`** (attach `props--end-grain-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

## 8. Steel (blades, mirror frames, cages) — `props--steel`

**`props--steel-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old forged steel: a smooth surface with fine straight polishing scratches in one direction, a few nicks, faint darker tempering stains, no rust. Mid-toned cool neutral grey. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--steel-height.png`** (attach `props--steel-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; nearly flat, the scratches and nicks faint and dark. No lighting, height only.

**`props--steel-roughness.png`** (attach `props--steel-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; mostly smooth (dark grey), the stains and nicks rougher. No lighting.

## 9. Marble (bathhouse, temple) — `props--marble`

**`props--marble-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old pale marble with no blocks or joints: soft cloudy veins running diagonally, a fine crystalline sparkle in the grain, slight yellowing and grime in a few patches. Mid-to-light neutral warm white, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--marble-height.png`** (attach `props--marble-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; almost flat, a few hairline cracks faint and dark. No lighting, height only.

**`props--marble-roughness.png`** (attach `props--marble-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; mostly smooth (dark grey), the grimy patches rougher. No lighting.

## 10. Brick (the forge's furnace and chimney) — `props--brick`

**`props--brick-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of small fired bricks in running bond, about 10 courses to the image, with recessed mortar joints, some bricks darker and soot-stained, chipped corners. Mid-toned muted brick red-brown, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--brick-height.png`** (attach `props--brick-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; brick faces high, mortar joints low and dark, chips dark. No lighting, height only.

**`props--brick-roughness.png`** (attach `props--brick-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

## 11. Leather (straps, grips, covers) — `props--leather`

**`props--leather-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old worn leather hide: fine creases and a pebbled grain, darker where handled, a few scuffs and scratches, no stitching. Mid-toned muted brown, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--leather-height.png`** (attach `props--leather-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the pebbled grain faint, the creases dark. No lighting, height only.

**`props--leather-roughness.png`** (attach `props--leather-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; mid-grey, the handled patches smoother. No lighting.

## 12. Parchment (scrolls, papers) — `props--parchment`

**`props--parchment-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old parchment: soft fibrous paper, faint water stains and foxing spots, gentle uneven tone, no writing and no folds. Mid-to-light muted cream, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--parchment-height.png`** (attach `props--parchment-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; almost flat, the fibres very faint. No lighting, height only.

**`props--parchment-roughness.png`** (attach `props--parchment-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

## 13. Straw (barracks straw, straw mattresses) — `props--straw`

**`props--straw-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of a loose layer of dry straw: thin stalks lying mostly in one direction with some crossing, gaps showing darker straw beneath, a few broken bits. Mid-toned muted pale gold, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--straw-height.png`** (attach `props--straw-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the top stalks light, the gaps dark. No lighting, height only.

**`props--straw-roughness.png`** (attach `props--straw-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

## 14. Soil (planters, saplings' ground) — `props--soil`

**`props--soil-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of dark loose earth: crumbly soil, small pebbles and grit, a few fine roots and bits of dead leaf. Mid-dark muted brown, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--soil-height.png`** (attach `props--soil-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; clumps and pebbles raised, gaps low. No lighting, height only.

**`props--soil-roughness.png`** (attach `props--soil-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

## 15. Coal (the forge's coal heaps) — `props--coal`

**`props--coal-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of broken lumps of charcoal and coal: dull black faceted lumps with grey ash dust between them, a faint dull sheen on some faces, no glow. Dark charcoal grey, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--coal-height.png`** (attach `props--coal-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; lumps high, gaps deep and dark. No lighting, height only.

**`props--coal-roughness.png`** (attach `props--coal-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; mostly rough, the sheened faces a little smoother. No lighting.

## 16. Fungus flesh (giant mushroom stems) — `props--fungus`

**`props--fungus-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of the soft pale flesh of a giant mushroom stem: fine fibres running vertically, faint damp mottling, a few small bruise-dark spots, slightly translucent in feel. Mid-to-light muted ivory-grey, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--fungus-height.png`** (attach `props--fungus-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the fibres faint and vertical. No lighting, height only.

**`props--fungus-roughness.png`** (attach `props--fungus-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; mid-grey, slightly smoother (damp) overall. No lighting.

## 17. Basalt (the Ember Rifts' rocks, the forge's floor stones) — `props--basalt`

**`props--basalt-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of dark volcanic basalt: a rough surface full of small gas pits and vesicles, sharp fracture edges, fine grit, no glow. Dark neutral charcoal grey, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--basalt-height.png`** (attach `props--basalt-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the pits deep and dark, the surface between them raised. No lighting, height only.

**`props--basalt-roughness.png`** (attach `props--basalt-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

---

## The list

51 images, 17 materials × (albedo, height, roughness), in priority order:

`props--dressed-stone`, `props--rough-rock`, `props--bark`, `props--fabric`, `props--furniture-wood`,
`props--sandstone`, `props--end-grain`, `props--steel`, `props--marble`, `props--brick`, `props--leather`,
`props--parchment`, `props--straw`, `props--soil`, `props--coal`, `props--fungus`, `props--basalt`, each as
`-albedo.png`, `-height.png`, `-roughness.png`.

The first six fix what is wrong on screen now (pillars and rocks shown as statue stone, logs as boards, banners as
stone, furniture as crate boards, the sand block as brass). The rest add variety where a stand-in is used today.
