# Arena backdrops: the ChatGPT prompts

These are all the images for the battle arena's backdrops: every prompt, ready to paste. Read `BRIEF.md` once for the why. This file is the what.

## How to use

- **One image per request.** Paste the prompt and attach what it says.
- **Size:** every texture is **1024 × 1024**, and every matte is **2048 × 1024**. Save each as PNG under the exact file name shown.
- **The order matters.** Make each set's colour image first. Each height, roughness and glow map is made *from* its finished colour image, by attaching that image to the request, so they line up pixel for pixel.
- **Each matte's middle layer** is made from its far plate, by attaching it.
- **The style for everything:** painterly, hand-painted fantasy game art, soft brushwork, mid-dark and calm. The battle's units, highlights and spells must read on top.
- **If time is short,** do the mattes first (2 per area), then the rock sets.
- **Delivery:** zip one or more areas, keep the file names, and send them over.

## Glowworm Hollows (`hollows`)

### Rock face

**`hollows--rock-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of grey-green cave limestone, damp, with mossy strata: natural cave rock with horizontal strata, cracks, small ledges and chips, mineral streaks. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`hollows--rock-height.png`** (attach `hollows--rock-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; ledges light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`hollows--rock-roughness.png`** (attach `hollows--rock-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the stone mostly rough, polished or wet patches darker. No lighting.

### Dressed stone (for ruins)

**`hollows--stone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of mossy grey-green ashlar: ancient dressed stone blocks in staggered courses, worn joints, chipped edges, weathering. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`hollows--stone-height.png`** (attach `hollows--stone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; block faces light, joints dark; cracks and joints dark; the fine grain faint. No lighting, height only.

**`hollows--stone-roughness.png`** (attach `hollows--stone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the block faces rough, worn tops a little smoother. No lighting.

### Special material (set pieces)

**`hollows--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of glowing pale-green crystal. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`hollows--special-height.png`** (attach `hollows--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`hollows--special-roughness.png`** (attach `hollows--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material (ice and crystal smooth and dark, rock rough and light). No lighting.

**`hollows--special-glow.png`** (attach `hollows--special-albedo.png`)

> Make a greyscale GLOW mask for the attached image: pixel-aligned, the same size. White where it glows (the crystal facets), black everywhere else.

### Matte paintings

**`hollows--matte-1-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a vast crystal-lit cavern hall, pale green crystals glowing in the dark, in Glowworm Hollows. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into deep green-black mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`hollows--matte-1-mid.png`** (attach `hollows--matte-1-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Glowworm Hollows) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into deep green-black mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`hollows--matte-2-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a root-choked chasm with giant roots hanging into darkness, in Glowworm Hollows. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into deep green-black mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`hollows--matte-2-mid.png`** (attach `hollows--matte-2-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Glowworm Hollows) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into deep green-black mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`hollows--matte-3-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: an underground lake ringed by softly glowing fungi, in Glowworm Hollows. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into deep green-black mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`hollows--matte-3-mid.png`** (attach `hollows--matte-3-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Glowworm Hollows) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into deep green-black mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

## Frozen Deeps (`deeps`)

### Rock face

**`deeps--rock-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of slate-blue rock with rime frost on the ledges: natural cave rock with horizontal strata, cracks, small ledges and chips, mineral streaks. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`deeps--rock-height.png`** (attach `deeps--rock-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; ledges light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`deeps--rock-roughness.png`** (attach `deeps--rock-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the stone mostly rough, polished or wet patches darker. No lighting.

### Dressed stone (for ruins)

**`deeps--stone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of frost-bitten blue stone: ancient dressed stone blocks in staggered courses, worn joints, chipped edges, weathering. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`deeps--stone-height.png`** (attach `deeps--stone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; block faces light, joints dark; cracks and joints dark; the fine grain faint. No lighting, height only.

**`deeps--stone-roughness.png`** (attach `deeps--stone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the block faces rough, worn tops a little smoother. No lighting.

### Special material (set pieces)

**`deeps--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of translucent blue glacial ice. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`deeps--special-height.png`** (attach `deeps--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`deeps--special-roughness.png`** (attach `deeps--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material (ice and crystal smooth and dark, rock rough and light). No lighting.

**`deeps--special-glow.png`** (attach `deeps--special-albedo.png`)

> Make a 1024 x 1024 image that is entirely black (this material does not glow).

### Matte paintings

**`deeps--matte-1-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a frozen cavern lake under icicle-hung vaults, in Frozen Deeps. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into deep navy mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`deeps--matte-1-mid.png`** (attach `deeps--matte-1-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Frozen Deeps) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into deep navy mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`deeps--matte-2-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a cathedral carved of ice, light filtering through, in Frozen Deeps. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into deep navy mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`deeps--matte-2-mid.png`** (attach `deeps--matte-2-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Frozen Deeps) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into deep navy mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`deeps--matte-3-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a blizzard sweeping over a deep icy chasm, in Frozen Deeps. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into deep navy mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`deeps--matte-3-mid.png`** (attach `deeps--matte-3-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Frozen Deeps) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into deep navy mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

## Storm Vault (`vault`)

### Rock face

**`vault--rock-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of muted violet rock (calm, never blue-and-gold): natural cave rock with horizontal strata, cracks, small ledges and chips, mineral streaks. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`vault--rock-height.png`** (attach `vault--rock-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; ledges light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`vault--rock-roughness.png`** (attach `vault--rock-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the stone mostly rough, polished or wet patches darker. No lighting.

### Dressed stone (for ruins)

**`vault--stone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of carved violet stone blocks: ancient dressed stone blocks in staggered courses, worn joints, chipped edges, weathering. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`vault--stone-height.png`** (attach `vault--stone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; block faces light, joints dark; cracks and joints dark; the fine grain faint. No lighting, height only.

**`vault--stone-roughness.png`** (attach `vault--stone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the block faces rough, worn tops a little smoother. No lighting.

### Special material (set pieces)

**`vault--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of carved violet rune panel with faintly glowing runes. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`vault--special-height.png`** (attach `vault--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`vault--special-roughness.png`** (attach `vault--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material (ice and crystal smooth and dark, rock rough and light). No lighting.

**`vault--special-glow.png`** (attach `vault--special-albedo.png`)

> Make a greyscale GLOW mask for the attached image: pixel-aligned, the same size. White where it glows (the runes), black everywhere else.

### Matte paintings

**`vault--matte-1-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: endless arcane vault halls with tall violet columns, in Storm Vault. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into dark violet-black mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`vault--matte-1-mid.png`** (attach `vault--matte-1-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Storm Vault) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into dark violet-black mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`vault--matte-2-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: floating rune-carved monoliths in a violet haze, in Storm Vault. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into dark violet-black mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`vault--matte-2-mid.png`** (attach `vault--matte-2-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Storm Vault) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into dark violet-black mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`vault--matte-3-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a star-lit violet void with broken vault walls, in Storm Vault. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into dark violet-black mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`vault--matte-3-mid.png`** (attach `vault--matte-3-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Storm Vault) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into dark violet-black mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

## Ember Rifts (`rifts`)

### Rock face

**`rifts--rock-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of volcanic umber basalt with ember-lit cracks: natural cave rock with horizontal strata, cracks, small ledges and chips, mineral streaks. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`rifts--rock-height.png`** (attach `rifts--rock-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; ledges light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`rifts--rock-roughness.png`** (attach `rifts--rock-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the stone mostly rough, polished or wet patches darker. No lighting.

### Dressed stone (for ruins)

**`rifts--stone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of soot-stained basalt blocks: ancient dressed stone blocks in staggered courses, worn joints, chipped edges, weathering. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`rifts--stone-height.png`** (attach `rifts--stone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; block faces light, joints dark; cracks and joints dark; the fine grain faint. No lighting, height only.

**`rifts--stone-roughness.png`** (attach `rifts--stone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the block faces rough, worn tops a little smoother. No lighting.

### Special material (set pieces)

**`rifts--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of molten lava rock with glowing cracks. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`rifts--special-height.png`** (attach `rifts--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`rifts--special-roughness.png`** (attach `rifts--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material (ice and crystal smooth and dark, rock rough and light). No lighting.

**`rifts--special-glow.png`** (attach `rifts--special-albedo.png`)

> Make a greyscale GLOW mask for the attached image: pixel-aligned, the same size. White where it glows (the molten cracks), black everywhere else.

### Matte paintings

**`rifts--matte-1-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a lava sea under a vast cavern roof, in Ember Rifts. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into dark red-brown smoke mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`rifts--matte-1-mid.png`** (attach `rifts--matte-1-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Ember Rifts) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into dark red-brown smoke mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`rifts--matte-2-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: an erupting rift splitting the ground, lava rivers, in Ember Rifts. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into dark red-brown smoke mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`rifts--matte-2-mid.png`** (attach `rifts--matte-2-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Ember Rifts) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into dark red-brown smoke mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`rifts--matte-3-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: towering basalt columns above glowing lava, in Ember Rifts. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into dark red-brown smoke mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`rifts--matte-3-mid.png`** (attach `rifts--matte-3-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Ember Rifts) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into dark red-brown smoke mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

## Gilded Ruins (`ruins`)

### Rock face

**`ruins--rock-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of olive and gold limestone: natural cave rock with horizontal strata, cracks, small ledges and chips, mineral streaks. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`ruins--rock-height.png`** (attach `ruins--rock-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; ledges light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`ruins--rock-roughness.png`** (attach `ruins--rock-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the stone mostly rough, polished or wet patches darker. No lighting.

### Dressed stone (for ruins)

**`ruins--stone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of aged ivory-grey marble ashlar: ancient dressed stone blocks in staggered courses, worn joints, chipped edges, weathering. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`ruins--stone-height.png`** (attach `ruins--stone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; block faces light, joints dark; cracks and joints dark; the fine grain faint. No lighting, height only.

**`ruins--stone-roughness.png`** (attach `ruins--stone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the block faces rough, worn tops a little smoother. No lighting.

### Special material (set pieces)

**`ruins--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of carved marble relief, weathered. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`ruins--special-height.png`** (attach `ruins--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`ruins--special-roughness.png`** (attach `ruins--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material (ice and crystal smooth and dark, rock rough and light). No lighting.

**`ruins--special-glow.png`** (attach `ruins--special-albedo.png`)

> Make a 1024 x 1024 image that is entirely black (this material does not glow).

### Matte paintings

**`ruins--matte-1-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a sunken ruined city of marble and gold, in Gilded Ruins. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into warm dark olive-gold haze mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`ruins--matte-1-mid.png`** (attach `ruins--matte-1-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Gilded Ruins) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into warm dark olive-gold haze mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`ruins--matte-2-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: an overgrown colonnade at dusk, in Gilded Ruins. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into warm dark olive-gold haze mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`ruins--matte-2-mid.png`** (attach `ruins--matte-2-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Gilded Ruins) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into warm dark olive-gold haze mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`ruins--matte-3-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a collapsed temple with a fallen dome, in Gilded Ruins. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into warm dark olive-gold haze mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`ruins--matte-3-mid.png`** (attach `ruins--matte-3-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits Gilded Ruins) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into warm dark olive-gold haze mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

## The Abyss (`abyss`)

### Rock face

**`abyss--rock-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of charcoal and navy rock with faint starry mineral flecks: natural cave rock with horizontal strata, cracks, small ledges and chips, mineral streaks. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`abyss--rock-height.png`** (attach `abyss--rock-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; ledges light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`abyss--rock-roughness.png`** (attach `abyss--rock-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the stone mostly rough, polished or wet patches darker. No lighting.

### Dressed stone (for ruins)

**`abyss--stone-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of black stone blocks with thin gold inlay: ancient dressed stone blocks in staggered courses, worn joints, chipped edges, weathering. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`abyss--stone-height.png`** (attach `abyss--stone-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; block faces light, joints dark; cracks and joints dark; the fine grain faint. No lighting, height only.

**`abyss--stone-roughness.png`** (attach `abyss--stone-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; the block faces rough, worn tops a little smoother. No lighting.

### Special material (set pieces)

**`abyss--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of void-touched obsidian with faint cyan edges. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`abyss--special-height.png`** (attach `abyss--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`abyss--special-roughness.png`** (attach `abyss--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material (ice and crystal smooth and dark, rock rough and light). No lighting.

**`abyss--special-glow.png`** (attach `abyss--special-albedo.png`)

> Make a greyscale GLOW mask for the attached image: pixel-aligned, the same size. White where it glows (the cyan edges), black everywhere else.

### Matte paintings

**`abyss--matte-1-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: broken stairs climbing into the void, in The Abyss. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into near-black navy mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`abyss--matte-1-mid.png`** (attach `abyss--matte-1-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits The Abyss) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into near-black navy mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`abyss--matte-2-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: floating rock islands among faint stars, in The Abyss. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into near-black navy mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`abyss--matte-2-mid.png`** (attach `abyss--matte-2-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits The Abyss) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into near-black navy mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

**`abyss--matte-3-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a shattered citadel drifting in darkness, in The Abyss. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into near-black navy mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`abyss--matte-3-mid.png`** (attach `abyss--matte-3-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits The Abyss) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into near-black navy mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

## Boss battlefields

### Radiant Golem (`boss-golem`)

**`boss-golem--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of clear prism crystal with rainbow refraction. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`boss-golem--special-height.png`** (attach `boss-golem--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`boss-golem--special-roughness.png`** (attach `boss-golem--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material. No lighting.

**`boss-golem--special-glow.png`** (attach `boss-golem--special-albedo.png`)

> Make a greyscale GLOW mask for the attached image: pixel-aligned, the same size. White where it glows (its glowing parts), black everywhere else.

**`boss-golem--matte-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: inside a vast crystal geode, beams of light crossing it — the lair of the Radiant Golem. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into deep green-black mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`boss-golem--matte-mid.png`** (attach `boss-golem--matte-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits the Radiant Golem's lair) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into deep green-black mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

### Glacier Queen (`boss-glacier`)

**`boss-glacier--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of carved throne ice, frost-white and deep blue. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`boss-glacier--special-height.png`** (attach `boss-glacier--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`boss-glacier--special-roughness.png`** (attach `boss-glacier--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material. No lighting.

**`boss-glacier--special-glow.png`** (attach `boss-glacier--special-albedo.png`)

> Make a greyscale GLOW mask for the attached image: pixel-aligned, the same size. White where it glows (its glowing parts), black everywhere else.

**`boss-glacier--matte-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a frozen throne hall with a frozen waterfall behind the throne — the lair of the Glacier Queen. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into deep navy mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`boss-glacier--matte-mid.png`** (attach `boss-glacier--matte-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits the Glacier Queen's lair) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into deep navy mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

### Thunder Roc (`boss-roc`)

**`boss-roc--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of storm-scoured stone with iron streaks. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`boss-roc--special-height.png`** (attach `boss-roc--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`boss-roc--special-roughness.png`** (attach `boss-roc--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material. No lighting.

**`boss-roc--special-glow.png`** (attach `boss-roc--special-albedo.png`)

> Make a 1024 x 1024 image that is entirely black (this material does not glow).

**`boss-roc--matte-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a mountain peak above the clouds in a lightning storm — the lair of the Thunder Roc. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into dark storm grey-violet mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`boss-roc--matte-mid.png`** (attach `boss-roc--matte-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits the Thunder Roc's lair) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into dark storm grey-violet mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

### Magma Wyrm (`boss-wyrm`)

**`boss-wyrm--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of cracked dark crust over molten rock with glowing seams. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`boss-wyrm--special-height.png`** (attach `boss-wyrm--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`boss-wyrm--special-roughness.png`** (attach `boss-wyrm--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material. No lighting.

**`boss-wyrm--special-glow.png`** (attach `boss-wyrm--special-albedo.png`)

> Make a greyscale GLOW mask for the attached image: pixel-aligned, the same size. White where it glows (its glowing parts), black everywhere else.

**`boss-wyrm--matte-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a volcanic caldera with a lava lake and lava falls — the lair of the Magma Wyrm. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into dark red-brown smoke mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`boss-wyrm--matte-mid.png`** (attach `boss-wyrm--matte-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits the Magma Wyrm's lair) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into dark red-brown smoke mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

### Elder Treant (`boss-treant`)

**`boss-treant--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of giant living roots and bark with glowing sap veins. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`boss-treant--special-height.png`** (attach `boss-treant--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`boss-treant--special-roughness.png`** (attach `boss-treant--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material. No lighting.

**`boss-treant--special-glow.png`** (attach `boss-treant--special-albedo.png`)

> Make a greyscale GLOW mask for the attached image: pixel-aligned, the same size. White where it glows (its glowing parts), black everywhere else.

**`boss-treant--matte-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a ruined temple swallowed by an enormous ancient tree — the lair of the Elder Treant. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into warm dark olive-gold haze mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`boss-treant--matte-mid.png`** (attach `boss-treant--matte-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits the Elder Treant's lair) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into warm dark olive-gold haze mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

### Hollow King (`boss-hollow`)

**`boss-hollow--special-albedo.png`**

> A seamless, tileable 1024 x 1024 hand-painted fantasy game texture of shattered obsidian, mirror-dark with faint cyan edges. Painterly, soft brushwork, mid-dark and calm. Flat, even, shadowless lighting: albedo colour only, no cast shadows, no highlights, no vignette. Tiles seamlessly on all four edges, with no feature that repeats noticeably. No text.

**`boss-hollow--special-height.png`** (attach `boss-hollow--special-albedo.png`)

> Convert the attached image into its matching greyscale HEIGHT map: pixel-aligned, the same size. White is high, black is low; raised features light; cracks and joints dark; the fine grain faint. No lighting, height only.

**`boss-hollow--special-roughness.png`** (attach `boss-hollow--special-albedo.png`)

> Convert the attached image into its matching greyscale ROUGHNESS map: pixel-aligned, the same size. White is rough, black is smooth; as fits the material. No lighting.

**`boss-hollow--special-glow.png`** (attach `boss-hollow--special-albedo.png`)

> Make a greyscale GLOW mask for the attached image: pixel-aligned, the same size. White where it glows (its glowing parts), black everywhere else.

**`boss-hollow--matte-far.png`**

> A wide 2048 x 1024 hand-painted fantasy matte painting, the far background for a game battle: a broken throne floating in a starless void — the lair of the Hollow King. Painterly and atmospheric, dark and soft so characters in front read clearly. Most detail in the middle band, the top dark, and the bottom third fading smoothly into near-black navy mist. Keep big features away from the outer eighth on the left and right. No characters, no text, no frame.

**`boss-hollow--matte-mid.png`** (attach `boss-hollow--matte-far.png`)

> Using the attached matte painting as reference, paint ONLY the near silhouettes in front of it (rock pillars, arches, ruins, roots or floating debris, as fits the Hollow King's lair) on a FULLY TRANSPARENT background, 2048 x 1024, matching its light but slightly darker and cooler. The bottom fades into near-black navy mist. No sky at all: everything not a silhouette is transparent. No characters, no text.

## Checklist

The total is 132 images: 16 per area (6 areas) and 6 per boss (6 bosses). For each area: `rock-` ×3, `stone-` ×3, `special-` ×4 and `matte-1/2/3-far` and `-mid` ×6. For each boss: `special-` ×4 and `matte-far` and `-mid`.
