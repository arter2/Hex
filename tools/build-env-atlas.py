#!/usr/bin/env python3
"""Build the dungeon's texture atlases from the painterly masters.

    python3 tools/build-env-atlas.py

Reads the 512 x 512 masters in game/art/environment/painterly-512/ (the art handoff: docs/art-production/), brings
each down to 256 x 256 and packs them into sheets the game samples straight from the GPU (game/envart.js,
look.js xAtlasShader):

  atlas/area-<id>.webp     colour, one per area: its passage and two room floors, its rock, block and rubble walls,
                           the floors of the room themes that area can roll (dungeongen.js XTHEME_AREA) and, for the
                           Ember Rifts, the medium-rock overlay
  atlas/area-<id>-n.webp   normal maps (linear data, lossless): the theme floors' painted ones, and for the area's
                           floors and walls (painted without one) one made from the painting's brightness
  atlas/effects.webp       the small effect textures (glows, rune ring, ripples, pool surfaces, trim, detail normal,
                           cell noise, the trees' leaf clumps); the game cuts these back out, as they scroll, tile or draw as sprites

Every tile sits in a cell with a 16-pixel gutter: repeating textures fill it with their own wrapped edge (so the
filtering and the first four mip levels at a tile's edge read the tile itself, not its neighbour), sprites with
transparency. The tile rectangles go to game/envartmap.js. The masters stay in the repository but not in the build.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "game/art/environment/painterly-512"
OUT = ROOT / "game/art/environment/atlas"
MAP_JS = ROOT / "game/envartmap.js"
TILE, GUT = 256, 16
CELL = TILE + 2 * GUT
AREAS = ["hollows", "deeps", "vault", "rifts", "ruins", "abyss"]
# the room themes each area can roll (keep in step with dungeongen.js XTHEME_AREA; temple has no floor of its own)
THEME_AREA = {
    "hollows": ["overgrown", "fungus", "collapsed", "flooded", "library"],
    "deeps": ["flooded", "crypt", "collapsed", "fungus", "bathhouse", "barracks"],
    "vault": ["armory", "library", "barracks", "bathhouse", "collapsed"],
    "rifts": ["forge", "collapsed", "armory", "barracks", "fungus"],
    "ruins": ["library", "bathhouse", "overgrown", "crypt"],
    "abyss": ["crypt", "collapsed", "library", "forge", "fungus"],
}
# the one painted variant of each theme's floor (it is used in every area that rolls the theme)
THEME_FILE = {"armory": "armory-vault", "flooded": "flooded-deeps", "overgrown": "overgrown-hollows",
              "collapsed": "collapsed-rifts", "library": "library-ruins", "crypt": "crypt-abyss",
              "forge": "forge-rifts", "bathhouse": "bathhouse-ruins", "barracks": "barracks-vault",
              "fungus": "fungus-grove-hollows"}
# effects: name -> (master, how it is used: 'wrap' repeats or scrolls, 'clamp' is a sprite)
EFFECTS = {
    "glow": ("shared-effects/glow-hole.png", "clamp"),
    "rune": ("shared-effects/rune-circle.png", "clamp"),
    "lantern": ("shared-effects/lantern-fx-glow.png", "clamp"),
    "ripples": ("shared-effects/water-ripples.png", "wrap"),
    "pool-water": ("shared-effects/pool-surface-water.png", "wrap"),
    "pool-ice": ("shared-effects/pool-surface-ice.png", "wrap"),
    "pool-lava": ("shared-effects/pool-surface-lava.png", "wrap"),
    "pool-black": ("shared-effects/pool-surface-black.png", "wrap"),
    "trim-ruins": ("shared-effects/trim-fx-ruins.png", "wrap"),
    "detail-normal": ("shared-effects/detail-normal.png", "wrap"),
    "cell-noise": ("shared-detail/deeps-rock-cell-noise.png", "wrap"),
}
# the leaves (shared-foliage/leaves.png, a tiling sheet of painted leaves with cut-out gaps): four round clumps cut from
# it, two by two in one tile, for the trees' foliage cards (dungeongen.js xLeafCards)
LEAVES = "shared-foliage/leaves.png"


def leaf_clumps():
    """Four 128 x 128 clumps in one 256 tile: each a 512 crop of the leaves, its edge eaten by a ragged round mask (so a
    card never shows a straight edge), its alpha made crisp for alpha testing, and its colour carried out under the
    clear pixels (the filtering and mip levels would otherwise pull the painting's stray fringe colours into the edges)."""
    src = np.asarray(Image.open(SRC / LEAVES).convert("RGBA")).astype(np.float32) / 255
    rng = np.random.default_rng(7)
    out = np.zeros((TILE, TILE, 4), np.float32)
    h = TILE // 2
    for q, (ox, oy) in enumerate([(40, 60), (470, 90), (90, 480), (500, 470)]):
        a = src[oy:oy + 512, ox:ox + 512].copy()
        yy, xx = np.mgrid[0:512, 0:512] / 511 * 2 - 1
        ang = np.arctan2(yy, xx)
        rag = .82 + sum(rng.uniform(.02, .06) * np.sin(k * ang + rng.uniform(0, 6.3)) for k in (3, 5, 7, 11))
        a[..., 3] *= np.clip((rag - np.hypot(xx, yy)) / .08, 0, 1)
        a[..., 3] = np.clip((a[..., 3] - .35) / .3, 0, 1)
        im = Image.fromarray((a * 255).astype(np.uint8), "RGBA")
        pm = np.asarray(im.resize((h, h), Image.LANCZOS, reducing_gap=None)).astype(np.float32) / 255
        out[(q // 2) * h:(q // 2 + 1) * h, (q % 2) * h:(q % 2 + 1) * h] = pm
    # colour under the clear pixels: the mean of the leaf colour round about
    col, al = out[..., :3] * out[..., 3:], out[..., 3:]
    def blur(x, r=6, n=3):   # a box blur three times over (near enough a gaussian), wrapping
        for _ in range(n):
            for ax in (0, 1):
                x = sum(np.roll(x, d, ax) for d in range(-r, r + 1)) / (2 * r + 1)
        return x
    fill = blur(col) / (blur(al) + 1e-4)
    out[..., :3] = np.where(al > .5, out[..., :3], fill)
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), "RGBA")


def tile(path, mode="RGBA"):
    im = Image.open(SRC / path).convert(mode)
    return im.resize((TILE, TILE), Image.LANCZOS)


def height_normal(im, k=7.0):
    """A normal map for a painting that came without one (the area floors and walls): its brightness taken as height
    (the dark joints and cracks low, the lit faces high), softened a little, wrapped at the edges like the tile. Same
    convention as the game's own (look.js xNormalMap): x from the slope across, y from the slope down the image."""
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255
    h = a @ np.array([.3, .59, .11], np.float32)
    for _ in range(2):
        h = (h + np.roll(h, 1, 0) + np.roll(h, -1, 0) + np.roll(h, 1, 1) + np.roll(h, -1, 1)) / 5
    nx = -(np.roll(h, -1, 1) - np.roll(h, 1, 1)) * k
    ny = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * k
    l = np.sqrt(nx * nx + ny * ny + 1)
    n = np.stack([nx / l, ny / l, 1 / l], -1) * .5 + .5
    return Image.fromarray((n * 255).round().astype(np.uint8), "RGB")


def place(sheet, im, slot, cols, wrap=True):
    """Paste im into cell `slot`, with its gutter; returns the tile's interior rectangle in pixels."""
    a = np.asarray(im)
    pad = ((GUT, GUT), (GUT, GUT)) + (((0, 0),) if a.ndim == 3 else ())
    a = np.pad(a, pad, mode="wrap") if wrap else np.pad(a, pad, mode="constant")
    x, y = (slot % cols) * CELL, (slot // cols) * CELL
    sheet.paste(Image.fromarray(a), (x, y))
    return [x + GUT, y + GUT, TILE, TILE]


def build(name, items, mode, lossless, cols=4):
    """items: [(key, image, wrap)]. Writes the sheet; returns {size, tiles: {key: [x, y, w, h]}}."""
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new(mode, (cols * CELL, rows * CELL), (0, 0, 0, 0) if mode == "RGBA" else (0, 0, 0))
    tiles = {k: place(sheet, im, i, cols, wrap) for i, (k, im, wrap) in enumerate(items)}
    sheet.save(OUT / name, "WEBP", lossless=lossless, quality=100 if lossless else 92, method=6)
    return {"file": name, "size": list(sheet.size), "tiles": tiles}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sheets = {}
    for a in AREAS:
        items = [("floor-0", tile(f"area-floors/{a}-passage.png", "RGB"), True),
                 ("floor-1", tile(f"area-floors/{a}-room-a.png", "RGB"), True),
                 ("floor-2", tile(f"area-floors/{a}-room-b.png", "RGB"), True),
                 ("wall-0", tile(f"area-walls/{a}-rock-wall.png", "RGB"), True),
                 ("wall-1", tile(f"area-walls/{a}-block-wall.png", "RGB"), True),
                 ("wall-2", tile(f"area-walls/{a}-rubble-wall.png", "RGB"), True)]
        items += [("theme-" + th, tile(f"theme-floors/{THEME_FILE[th]}.png", "RGB"), True) for th in THEME_AREA[a]]
        colour = [(k, im.convert("RGBA"), w) for k, im, w in items]
        if a == "rifts":
            colour.append(("rock-overlay", tile("shared-overlays/rifts-medium-rock-overlay.png"), True))
        sheets[f"area-{a}"] = build(f"area-{a}.webp", colour, "RGBA", False)
        normals = [(k, height_normal(im), True) for k, im, _ in items[:6]]   # the floors and walls: from their painting
        normals += [("theme-" + th, tile(f"theme-normals/{THEME_FILE[th]}-normal.png", "RGB"), True) for th in THEME_AREA[a]]
        sheets[f"area-{a}-n"] = build(f"area-{a}-n.webp", normals, "RGB", False, cols=3)
    fx = [(k, tile(p), m == "wrap") for k, (p, m) in EFFECTS.items()]
    fx.append(("leaf-clumps", leaf_clumps(), False))
    sheets["effects"] = build("effects.webp", fx, "RGBA", True)
    meta = {"tile": TILE, "gutter": GUT, "sheets": sheets, "themeArea": THEME_AREA}
    MAP_JS.write_text("// Generated by tools/build-env-atlas.py: where each dungeon texture sits in its atlas sheet "
                      "(game/art/environment/atlas/). Rectangles are [x, y, w, h] in pixels from the top left.\n"
                      "const ENVART_MAP=" + json.dumps(meta, separators=(",", ":")) + ";\n")
    total = sum((OUT / s["file"]).stat().st_size for s in sheets.values())
    for k, s in sheets.items():
        print(f"{s['file']:22} {s['size'][0]}x{s['size'][1]}  {len(s['tiles'])} tiles  {(OUT / s['file']).stat().st_size // 1024} KB")
    print(f"{len(sheets)} sheets, {total // 1024} KB")


if __name__ == "__main__":
    main()
