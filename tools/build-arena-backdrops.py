#!/usr/bin/env python3
"""Build the battle arena's backdrops from their masters (docs/superpowers/plans/2026-11-16-arena-backdrops.md, Task 7).

  in:  game/art/environment/painterly-512/arena-backdrops/<id>/<id>--*.png   (id: an area, or boss-<boss>)
  out: game/art/environment/arena/backdrops/ and game/arenabackdropmap.js (ARENA_BACKDROP)

Per id, for each material set it has (areas: rock, stone, special; bosses: special):
  <id>-<set>.webp      colour, 512, seamless (lossy)
  <id>-<set>-n.webp    tangent-space normal from the painted height (lossless)
  <id>-<set>-m.webp    data in three.js's channels: R ambient occlusion (from the height), G roughness (white rough), B 0
  <id>-special-e.webp  the glow mask, where the set glows at all (lossless)
and its matte paintings (areas: 1-3; bosses: one):
  <id>-matte-<n>-far.webp  2048 x 1024, opaque (lossy)
  <id>-matte-<n>-mid.webp  2048 x 1024, its middle layer with a clear sky (lossy colour, lossless alpha)

  python3 tools/build-arena-backdrops.py           build
  python3 tools/build-arena-backdrops.py --check   check what was built
"""
import importlib.util, json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "game/art/environment/painterly-512/arena-backdrops"
OUT = ROOT / "game/art/environment/arena/backdrops"
MAP = ROOT / "game/arenabackdropmap.js"
AREAS = ["hollows", "deeps", "vault", "rifts", "ruins", "abyss"]
BOSSES = ["golem", "glacier", "roc", "wyrm", "treant", "hollow"]
N = 512
_h = importlib.util.spec_from_file_location("hexb", ROOT / "tools/build-arena-hex.py")
H = importlib.util.module_from_spec(_h); _h.loader.exec_module(H)   # (its shrink, normal and AO helpers)


def ids():
    return AREAS + ["boss-" + b for b in BOSSES]


def sets(i):
    return ["special"] if i.startswith("boss-") else ["rock", "stone", "special"]


def mattes(i):
    return [""] if i.startswith("boss-") else ["-1", "-2", "-3"]


def arr(p, mode):
    return np.asarray(Image.open(p).convert(mode)).astype(np.float32) / 255


def seam(a):
    """How visible the seam is when the image tiles: the RMS difference across opposite edges, against inside."""
    e = np.sqrt(((a[0] - a[-1]) ** 2).mean() + ((a[:, 0] - a[:, -1]) ** 2).mean())
    i = np.sqrt(((a[1] - a[0]) ** 2).mean() + ((a[:, 1] - a[:, 0]) ** 2).mean())
    return e, i


def build_set(i, s, warn):
    P = SRC / i
    alb = arr(P / f"{i}--{s}-albedo.png", "RGB")
    hgt = arr(P / f"{i}--{s}-height.png", "L")
    rgh = arr(P / f"{i}--{s}-roughness.png", "L")
    if H.sobel_corr(hgt, alb.mean(-1), np.ones(hgt.shape, bool)) < .15:
        warn.append(f"WARN {i} {s}: the height does not follow the colour; built from the colour's brightness")
        hgt = alb.mean(-1)
    e, inner = seam(alb)
    if e > max(6 / 255, inner * 3):
        warn.append(f"WARN {i} {s}: a visible seam when tiled ({e * 255:.1f}/255 against {inner * 255:.1f} inside)")
    c = H.wrap_shrink(alb, N)
    h = H.wrap_shrink(hgt, N)
    H.save(c, OUT / f"{i}-{s}.webp", "RGB", False)
    H.save(H.normal_from(h, 5, True), OUT / f"{i}-{s}-n.webp", "RGB", True)
    H.save(np.stack([H.ao_from(h, 6, True), H.wrap_shrink(rgh, N), np.zeros_like(h)], -1), OUT / f"{i}-{s}-m.webp", "RGB", True)
    glow = False
    if s == "special":
        g = arr(P / f"{i}--special-glow.png", "L")
        if g.max() > .05:
            H.save(H.wrap_shrink(g, N), OUT / f"{i}-special-e.webp", "L", True)
            glow = True
    return glow


def build_matte(i, m):
    P = SRC / i
    far = Image.open(P / f"{i}--matte{m}-far.png").convert("RGB")
    mid = Image.open(P / f"{i}--matte{m}-mid.png").convert("RGBA")
    a = np.asarray(mid).astype(np.float32) / 255
    rgb = H.carry(a[..., :3], a[..., 3], 4, 3)   # (colour carried under the clear sky: no fringe when filtered)
    mid = Image.fromarray((np.dstack([rgb, a[..., 3]]) * 255 + .5).astype(np.uint8), "RGBA")
    n = m[1:] if m else "1"
    far.save(OUT / f"{i}-matte-{n}-far.webp", "WEBP", quality=85, method=6)
    mid.save(OUT / f"{i}-matte-{n}-mid.webp", "WEBP", quality=85, alpha_quality=100, method=6)


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    warn, glow = [], {}
    for i in ids():
        for s in sets(i):
            if build_set(i, s, warn):
                glow[i] = True
        for m in mattes(i):
            build_matte(i, m)
        print("built", i)
    M = {"areas": AREAS, "bosses": BOSSES, "mattes": {i: len(mattes(i)) for i in ids()}, "glow": glow, "size": N}
    MAP.write_text("/* Hexmancers - the battle arena's backdrops: what tools/build-arena-backdrops.py made (generated; do not edit).\n"
                   "   art/environment/arena/backdrops/<id>-*.webp; read by envart.js and arenabackdrop.js. */\nconst ARENA_BACKDROP="
                   + json.dumps(M, separators=(",", ":")) + ";\n")
    for w in warn:
        print(w)
    tot = sum(p.stat().st_size for p in OUT.glob("*.webp"))
    print(f"{len(list(OUT.glob('*.webp')))} files, {tot / 1e6:.1f} MB -> {OUT.relative_to(ROOT)}")


def check():
    bad = []
    for i in ids():
        for s in sets(i):
            for k in ["", "-n", "-m"]:
                p = OUT / f"{i}-{s}{k}.webp"
                if not p.exists():
                    bad.append("missing " + p.name)
                elif Image.open(p).size != (N, N):
                    bad.append(f"{p.name} is {Image.open(p).size}")
        for n in range(1, len(mattes(i)) + 1):
            for L in ("far", "mid"):
                p = OUT / f"{i}-matte-{n}-{L}.webp"
                if not p.exists():
                    bad.append("missing " + p.name)
                    continue
                im = Image.open(p)
                if im.size != (2048, 1024):
                    bad.append(f"{p.name} is {im.size}")
                if L == "mid":
                    a = np.asarray(im.convert("RGBA"))[..., 3]
                    if (a < 16).mean() < .3:   # (a cut-out: caves frame from the top with hanging rock, so not 'the top is sky')
                        bad.append(f"{p.name}: less than 30% of it is clear")
    for i in ("deeps", "ruins", "boss-roc"):
        if (OUT / f"{i}-special-e.webp").exists():
            bad.append(f"{i} glows (its mask is black)")
    out = subprocess.run(["node", "-e", f"eval(require('fs').readFileSync('{MAP}','utf8')+';console.log(Object.keys(ARENA_BACKDROP.mattes).length)')"], capture_output=True, text=True).stdout.strip()
    if out != "12":
        bad.append("arenabackdropmap.js does not name 12 backdrops")
    print("\n".join(bad) if bad else "PASS")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    check() if "--check" in sys.argv else build()
