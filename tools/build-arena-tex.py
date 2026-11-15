#!/usr/bin/env python3
"""Build the battle arena's painted textures from their 1024 masters.

  in:  game/art/environment/painterly-512/arena-masters/<area>--<slot>.png   (37 masters; the pack's own notes:
       README-arena-masters.md there)
  out: game/art/environment/arena/<area>--<slot>.webp                        (512 x 512)

Each master is shrunk as the pack asks: premultiplied, filtered across a 3 x 3 repeat of itself so the edges wrap, and
cut back to one tile. The solid ones ship as lossy WebP (they are painted colour; the game makes their relief from their
brightness, game/arena.js); the six mold tiles ship lossless, their alpha untouched and their colour carried out under
the clear pixels so filtering pulls in no fringe. game/arena.js ARENA_ART names the slots it reads.

  python3 tools/build-arena-tex.py
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "game/art/environment/painterly-512/arena-masters"
OUT = ROOT / "game/art/environment/arena"
SIZE = 512
SKIP = ("vault--",)   # the Vault's arena wears its own dungeon tiles (game/envart.js ARENA_DUNGEON): its paintings were too loud


def shrink(path):
    im = Image.open(path).convert("RGBA")
    n = im.size[0]
    pm = im.convert("RGBa")
    big = Image.new("RGBa", (n * 3, n * 3))
    for y in range(3):
        for x in range(3):
            big.paste(pm, (x * n, y * n))
    return big.resize((SIZE * 3, SIZE * 3), Image.LANCZOS).crop((SIZE, SIZE, SIZE * 2, SIZE * 2)).convert("RGBA")


def carry_colour(im):
    """Colour under the fully clear pixels: the mean of the painted colour round about (a wrapping box blur)."""
    a = np.asarray(im).astype(np.float32) / 255
    col, al = a[..., :3] * a[..., 3:], a[..., 3:]

    def blur(x, r=6, n=3):
        for _ in range(n):
            for ax in (0, 1):
                x = sum(np.roll(x, d, ax) for d in range(-r, r + 1)) / (2 * r + 1)
        return x
    fill = blur(col) / (blur(al) + 1e-4)
    for _ in range(3):   # (far from any colony the first fill is thin: spread it again)
        fill = np.where(blur(al) > 1e-3, fill, blur(fill, 12, 2))
    a[..., :3] = np.where(al > 0, a[..., :3], fill)
    return Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8), "RGBA")


def main():
    paths = sorted(SRC.glob("*.png"))
    assert len(paths) == 37, f"expected 37 masters, found {len(paths)}"
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for p in paths:
        if p.name.startswith(SKIP):
            (OUT / (p.stem + ".webp")).unlink(missing_ok=True)
            continue
        im = shrink(p)
        mold = "--mold-light-layer-" in p.name
        out = OUT / (p.stem + ".webp")
        if mold:
            im = carry_colour(im)
            im.save(out, "WEBP", lossless=True, quality=100, method=6)
        else:
            assert np.asarray(im)[..., 3].min() == 255, p.name + " should be opaque"
            im.convert("RGB").save(out, "WEBP", quality=90, method=6)
        total += out.stat().st_size
    print(f"{sum(not p.name.startswith(SKIP) for p in paths)} textures, {total / 1e6:.1f} MB -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
