# Dungeon props: the ChatGPT prompts

The dungeon's props (crates, barrels, tables, beds, shelves, racks, chests, pots and urns, sacks, statues, altars,
sarcophagi, anvils, bones) are built from simple blocks with a flat colour each, so they look plastic next to the
painted stone. They have no texture coordinates of their own: the game will lay these materials on them the way the
rock walls are laid (from all three sides, in the world), and their own shapes, AO and grime stay as they are. So what
is needed is a **tileable material texture** for each kind of stuff they are made of, not a picture of each prop.

## How to use

- **One image per request.** Paste the prompt and attach what it says.
- **Size:** every texture is **1024 × 1024**, PNG, saved under the exact file name shown.
- **The order matters.** Make each material's colour image first. Its height and roughness maps are made *from* it,
  by attaching the finished colour image, so they line up pixel for pixel.
- **Keep the colour mid-toned and fairly neutral.** The game tints each prop (a crate in one area is warmer than in
  another, a chest's bands take a metal colour), so a texture that is strongly coloured or very dark leaves nothing
  to tint. Aim for the middle of the brightness range, with the detail in the value, not the hue.
- **The style for everything:** hand-painted fantasy game art like the walls and floors, soft brushwork, calm, small
  detail that still reads when a crate is a few dozen pixels across.
- **If time is short,** do the first four (wood planks, rough wood, iron, clay): they cover most of what is on screen.
- **Delivery:** zip them, keep the file names, and send them over.

The scale: one texture covers **one metre** of the prop (a crate is about 0.8 m across), so a plank is about a
hand wide, a brick of clay a few fingers. Say nothing in the prompts about objects: these are surfaces.

## 1. Wood planks (crates, tables, beds, benches, shelves, doors of chests) — `props--planks`

**`props--planks-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old wooden planks laid side by side, running horizontally, each plank about 1/8 of the image tall: worn grain, a few knots, nail holes, darker gaps between the planks, soft scuffs. Mid-toned weathered brown-grey wood, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--planks-height.png`** (attach `props--planks-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; plank faces light, the gaps between planks dark, the grain faint, knots slightly raised. No lighting, height only.

**`props--planks-roughness.png`** (attach `props--planks-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the wood mostly rough, worn edges and handled spots a little smoother. No lighting.

## 2. Rough wood and end grain (barrels' staves, racks, posts, broken furniture) — `props--rough-wood`

**`props--rough-wood-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of rough split timber: long vertical grain, splits, a few dark cracks, worn and dry, without separate planks. Mid-toned weathered brown wood, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--rough-wood-height.png`** (attach `props--rough-wood-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the grain ridges light, splits and cracks dark. No lighting, height only.

**`props--rough-wood-roughness.png`** (attach `props--rough-wood-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; almost all rough. No lighting.

## 3. Iron (bands, hinges, racks, anvils, cages, chains) — `props--iron`

**`props--iron-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old forged iron: hammered surface, pitting, patches of rust in the hollows, worn bright on the high spots, a few rivet heads. Mid-dark neutral grey with muted rust brown. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--iron-height.png`** (attach `props--iron-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; hammer dents shallow and dark, pits dark, rivets light. No lighting, height only.

**`props--iron-roughness.png`** (attach `props--iron-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; worn high spots smooth (dark), rust patches rough (light), the rest in between. No lighting.

## 4. Fired clay (pots, urns, jars) — `props--clay`

**`props--clay-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old unglazed fired clay: faint horizontal throwing rings, small chips, dust and grime settled in, a little uneven colour from the firing. Mid-toned muted terracotta, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--clay-height.png`** (attach `props--clay-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the throwing rings faint, chips dark. No lighting, height only.

**`props--clay-roughness.png`** (attach `props--clay-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; mostly rough, a few worn smooth patches. No lighting.

## 5. Sacking and cloth (sacks, bedding, rugs' edges, banners) — `props--cloth`

**`props--cloth-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of coarse woven sacking cloth: a visible loose weave, a few darker stains and frayed patches, soft folds suggested only by the weave. Mid-toned undyed oatmeal beige, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--cloth-height.png`** (attach `props--cloth-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; the weave's threads light, the gaps between them dark. No lighting, height only.

**`props--cloth-roughness.png`** (attach `props--cloth-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Almost all rough (light). No lighting.

## 6. Carved stone (statues, altars, sarcophagi, pedestals, shrines) — `props--carved-stone`

**`props--carved-stone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of smooth carved stone with no blocks or joints: a fine even grain, faint chisel marks, hairline cracks, grime settled in a few hollows, soft weathering. Mid-toned neutral warm grey, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--carved-stone-height.png`** (attach `props--carved-stone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; mostly flat, chisel marks and cracks dark and faint. No lighting, height only.

**`props--carved-stone-roughness.png`** (attach `props--carved-stone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; mostly rough, polished worn patches a little darker. No lighting.

## 7. Bone (bones, skulls, bone piles) — `props--bone`

**`props--bone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old weathered bone surface: fine porous grain, hairline cracks, darker stained patches and grime in the cracks. Mid-toned muted ivory, low saturation. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--bone-height.png`** (attach `props--bone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; pores and cracks dark, faint. No lighting, height only.

**`props--bone-roughness.png`** (attach `props--bone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Mostly rough; a few worn smooth patches darker. No lighting.

## 8. Brass and gold trim (chest trim, candlesticks, fittings, shrine fittings) — `props--brass`

**`props--brass-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of old cast brass: a soft hammered surface, dark tarnish in the hollows, faint scratches, worn brighter on the high spots. Mid-toned muted golden brown, not shiny yellow. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--brass-height.png`** (attach `props--brass-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; hammer marks shallow, scratches faint and dark. No lighting, height only.

**`props--brass-roughness.png`** (attach `props--brass-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; worn high spots smooth, tarnished hollows rougher. No lighting.

## 9. Books and parchment (shelf fronts, lecterns, scattered papers) — `props--books`

**`props--books-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of the spines of old books packed tightly side by side on a shelf, in rows each about 1/4 of the image tall, the spines of varied widths and heights in muted leather browns, dull reds, greens and parchment, with faint gilt bands and no readable letters, worn and dusty. Painterly, soft brushwork, calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`props--books-height.png`** (attach `props--books-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; spines light and rounded, the gaps between books and between rows dark. No lighting, height only.

**`props--books-roughness.png`** (attach `props--books-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. Mostly rough; the gilt bands smoother (darker). No lighting.

## The list

27 images, nine materials × (albedo, height, roughness):

`props--planks`, `props--rough-wood`, `props--iron`, `props--clay`, `props--cloth`, `props--carved-stone`,
`props--bone`, `props--brass`, `props--books`, each as `-albedo.png`, `-height.png`, `-roughness.png`.
