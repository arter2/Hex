# Hexmancers arena backdrops

Production PNG assets for the six areas and six boss battlefields in BRIEF.md.

## Full release inventory

If this download is one part of the release, ARCHIVE_CONTENTS.md lists the groups and files included in that part.

| Group | PNG assets |
|---|---:|
| Hollows | 16 |
| Deeps | 16 |
| Vault | 16 |
| Rifts | 16 |
| Ruins | 16 |
| Abyss | 16 |
| Radiant Golem | 6 |
| Glacier Queen | 6 |
| Thunder Roc | 6 |
| Magma Wyrm | 6 |
| Elder Treant | 6 |
| Hollow King | 6 |
| Total | 132 |

All asset basenames follow CHATGPT-PROMPTS.md exactly. Assets are grouped in assets/<area-or-boss>/.
Review JPEGs are separate from the production asset inventory.

## Material import

- Albedo: 1024 x 1024 RGB PNG. Import as sRGB color.
- Height: 1024 x 1024 grayscale PNG. Import as linear data. White is high, black is low.
- Roughness: 1024 x 1024 grayscale PNG. Import as linear data. White is rough.
- Special glow: 1024 x 1024 grayscale PNG. Import as linear data. White contributes emission.
- Use repeat wrapping on both texture axes for material maps.
- Height, roughness, and glow refer to the matching albedo basename, without UV changes.
- Glow masks for Deeps ice, Ruins marble, and Thunder Roc stone are deliberately all black.
- Choose emission color and strength in the game material. The masks do not bake light onto neighboring surfaces.

The height maps describe painted surface relief; they are authored from the albedos rather than measured from 3D geometry.

## Matte import

- Far plates: 2048 x 1024 opaque RGB PNG.
- Middle layers: 2048 x 1024 RGBA PNG, with real transparent air and holes between silhouettes.
- Pair each -mid.png with its identically numbered -far.png; keep both on the same 2:1 canvas.
- Draw the far plate behind the middle layer. Middle layers support a separate parallax offset.
- Clamp the matte sampler instead of repeating panoramas as material tiles.
- Keep texture alpha and use alpha blending for the middle layer.
- The lower portion transitions into each area's dark fog color. A battle board is not painted into either layer.

## Production and checks

Artwork and reference-guided map conversions use the built-in image generator.
Final exports normalize the required dimensions and PNG channel formats.
Material borders receive a narrow 12-pixel wrap-conditioning pass. Small global data-map offsets, when detected, are registered to the albedo before the final border pass.

qa/validation.json records file dimensions, channel modes, edge differences, alpha statistics, data-map registration diagnostics, and SHA-256 hashes.
qa/SHA256SUMS.txt provides an independent inventory of the production PNG bytes.
The previews directory shows repeated materials and matte layers on a checkerboard and in composite.

BRIEF.md and CHATGPT-PROMPTS.md preserve the supplied art specification and source prompt set.
