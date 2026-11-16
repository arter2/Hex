# Claude: Hexmancers arena masters and downsizing instructions

## Delivery

These two ZIPs contain the complete set of 37 current painterly arena masters:

| Archive | Arena themes | Masters |
| --- | --- | ---: |
| arena-masters-part-1.zip | Abyss, Hollows, Vault | 18 |
| arena-masters-part-2.zip | Deeps, Rifts, Ruins | 19 |

Extract BOTH archives into the same parent directory. Their `masters-1024/` folders merge into one folder with 37 unique PNGs. This `CLAUDE.md` is identical in both archives; either copy can be kept. Part-specific manifests and checksum files have unique filenames.

Only 1024 x 1024 master artwork is supplied. There are no pre-downsized game textures, duplicate resolution sets, previews, or separate alpha-mask images. Each master is an RGBA PNG. Alpha is already embedded in the six mold masters; derive separate grayscale masks from that channel when needed.

Use the art as supplied. Vault is the latest cosmic MIDNIGHT BLUE AND ANTIQUE GOLD revision, with deep blue-black painted planes, cobalt highlights, and gold accents. Its legacy `plum-mildew` filename remains for compatibility and does not describe its current colors. Other themes are Abyss (charcoal/navy), Deeps (slate blue), Hollows (gray-green), Rifts (volcanic umber), and Ruins (olive limestone).

## Material mapping

Preserve every filename, including capitalization and the xSlabFloor/xRockFloor/xRockWall/xBlockWall/arLavaTex suffixes. The theme prefix before `--` selects the arena palette.

| Filename section | Existing game material role |
| --- | --- |
| `board-tile-slab-xSlabFloor` | Slab paving / board floor |
| `cave-floor-island-top-xRockFloor` | Cave island top surface |
| `cave-walls-island-rim-xRockWall` | Natural cave wall / island rim |
| `rocks-dais-xRockWall` | Rocks and dais sides |
| `vault--pillars-dais-xBlockWall` | Vault pillar/dais blockwork |
| `chasm-below-xChasmTex` | Distant chasm depth material |
| `mold-light-layer-...` | Transparent fungal overlay |
| `rifts--lava-arLavaTex` | Separate Rifts lava color texture |

These are surface textures for existing geometry. Preserve the current floor, wall, island, dais, and chasm geometry and world-space UV scale. Update material bindings or atlas source paths to the appropriate downsized file by its matching name.

## Generate the runtime sizes

1. Use 512 x 512 as the default runtime texture size. Generate 256 x 256 only if the target atlas or memory budget calls for it. Keep the 1024 masters intact.
2. Resize each master uniformly with a high-quality filter, using premultiplied alpha during resampling. For repeating materials, sample across wrapped neighboring tiles so the filter does not treat the image boundary as empty space.
3. Export standard straight RGBA PNGs. The 31 solid materials must remain fully opaque. Preserve continuous alpha, transparent gaps, and painted colony edges on all six mold overlays. Do not add a matte, chroma key, JPEG compression, or a new alpha threshold.
4. Copy nearby painted RGB into fully transparent pixels after resampling, without changing alpha. This prevents dark/colored fringes when the renderer filters straight-alpha textures.
5. If the game uses separate mold masks, extract the final runtime image's A channel into an 8-bit grayscale PNG. White means covered; black means transparent. Extract AFTER resizing so masks match runtime texture dimensions and coverage.
6. Save runtime textures under a separate output folder, preserving the original basenames. Rebuild the consuming atlas afterward. Update any hardcoded 64/128/256 source-size assumptions to the actual runtime dimensions. Use repeat wrapping in both U and V; preserve established UV repetition and geometry scale.

### Example Python recipe

Requires Pillow, NumPy, and SciPy. Run from the parent containing `masters-1024/`. This writes a 512px runtime set and six 512px alpha masks; it does not modify the masters. Change `SIZE` to 256 only if needed.

```python
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.ndimage import distance_transform_edt

SIZE = 512
source = Path('masters-1024')
output = Path(f'arena-textures-{SIZE}')
masks = Path(f'alpha-masks-{SIZE}')
output.mkdir(exist_ok=True)
masks.mkdir(exist_ok=True)
paths = sorted(source.glob('*.png'))
assert len(paths) == 37, 'Extract both master ZIPs first'

for path in paths:
    original = Image.open(path).convert('RGBA')
    assert original.size == (1024, 1024)
    # Use a 3x3 repeat so filtering at the center tile sees wrapped neighbors.
    premultiplied = original.convert('RGBa')
    wrapped = Image.new('RGBa', (3072, 3072))
    for y in range(3):
        for x in range(3):
            wrapped.paste(premultiplied, (x * 1024, y * 1024))
    filtered = wrapped.resize((SIZE * 3, SIZE * 3), Image.Resampling.LANCZOS)
    result = filtered.crop((SIZE, SIZE, SIZE * 2, SIZE * 2)).convert('RGBA')
    pixels = np.array(result)
    is_mold = '--mold-light-layer-' in path.name
    if is_mold:
        visible = pixels[:, :, 3] > 0
        nearest = distance_transform_edt(
            ~visible, return_distances=False, return_indices=True)
        for channel in range(3):
            pixels[:, :, channel][~visible] = (
                pixels[:, :, channel][tuple(nearest[:, ~visible])])
        result = Image.fromarray(pixels, 'RGBA')
        result.getchannel('A').save(masks / f'{path.stem}-alpha.png')
    else:
        assert pixels[:, :, 3].min() == 255
    result.save(output / path.name, optimize=True)
```

## Rendering and acceptance checks

- Treat color textures as sRGB and standalone grayscale alpha masks as linear data. Use the game's established alpha-blend/alpha-test treatment for mold. Keep alpha coverage stable in mipmaps if the engine uses alpha testing.
- Use the existing lava emissive treatment if applicable. These files are painted color maps; normal, roughness, height and emission maps are not supplied.
- Check every downsized texture in a 2 x 2 repeat with no obvious edge line or cropped pattern discontinuity. Keep wrap-aware filtering; do not hide seams by clamping UVs.
- Check mold over both light and dark backgrounds, including mip levels: no bright fringe, dark matte, filled gaps, or lost colony edges.
- Confirm 37 runtime textures, six mold masks if used, exact filename coverage, square power-of-two dimensions, and no duplicate master files.
- Keep the 1024 masters archived as the source of truth. Use each part's manifest and SHA256SUMS file to verify the supplied master bytes.
