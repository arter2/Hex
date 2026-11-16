#!/usr/bin/env python3
"""Build the battle board's painted hex floor from its 1024 masters
(docs/superpowers/plans/2026-11-15-arena-hex-floor.md, Task 1).

  in:  game/art/environment/painterly-512/arena-hex/   (areas/<a>/, variation/<a>/, shared/, docs/validation.json)
  out: game/art/environment/arena/hex/<a>-*.webp, broad-noise.webp, and game/arenahexmap.js (ARENA_HEX)

Per area:
  <a>-tiles.webp     colour, 1024 x 512: 4 x 2 cells of 256, tiles 1-4 (sheet A) on row 0, 5-8 (sheet B) on row 1, each
                     a pointy-top hex of circumradius 120 centred in its cell; colour carried past the hex edge; alpha the
                     coverage (chipped corners clear: the material alpha-tests it)
  <a>-tiles-n.webp   tangent-space normal from the height (lossless)
  <a>-tiles-m.webp   data, in three.js's order: R ambient occlusion (from the height), G roughness (white rough), B metalness,
                     A coverage
  <a>-tiles-v.webp   data: R edge wear, G cracks and chips, B colour patches, A moss and staining (A is data, not opacity)
  <a>-joint.webp, -joint-n.webp, -joint-m.webp (R AO, G roughness, B metalness, as three.js reads them): 256, seamless (a narrow dark gap: 512 was 4 MB of lossless maps for little)
  <a>-growth.webp    1024 x 512 RGBA: the flat sheet's 16 cells (left half) and the upright's (right), 128 a cell
  <a>-growth-e.webp  the glow mask, same layout (the flat half black)
  <a>-growth-m.webp  data: G roughness, B metalness (three.js's channels)

  python3 tools/build-arena-hex.py           build
  python3 tools/build-arena-hex.py --check   check what was built
"""
import json, math, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "game/art/environment/painterly-512/arena-hex"
OUT = ROOT / "game/art/environment/arena/hex"
MAP = ROOT / "game/arenahexmap.js"
AREAS = ["hollows", "deeps", "vault", "rifts", "ruins", "abyss"]
CELL, HEXR, SRC_R = 256, 120, 240
CENTRES = [(256, 256), (768, 256), (256, 768), (768, 768)]   # the template's hexes, row-major


def arr(p, mode):
    return np.asarray(Image.open(p).convert(mode)).astype(np.float32) / 255


def box_blur(x, r, n=3, wrap=True):
    for _ in range(n):
        for ax in (0, 1):
            if wrap:
                x = sum(np.roll(x, d, ax) for d in range(-r, r + 1)) / (2 * r + 1)
            else:
                pad = [(0, 0)] * x.ndim
                pad[ax] = (r, r)
                xp = np.pad(x, pad, mode="edge")
                c = np.cumsum(xp, axis=ax, dtype=np.float64)
                z = np.zeros_like(np.take(c, [0], axis=ax))
                c = np.concatenate([z, c], axis=ax)
                n_ = x.shape[ax]
                x = ((np.take(c, range(2 * r + 1, 2 * r + 1 + n_), axis=ax) - np.take(c, range(0, n_), axis=ax)) / (2 * r + 1)).astype(np.float32)
    return x


def hex_dist(n, cx, cy, R):
    """How far inside a pointy-top hex each pixel is, as a share of the inradius (1 at the centre, 0 at the edge)."""
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) + .5
    dx, dy = x - cx, y - cy
    ri = R * math.sqrt(3) / 2
    d = np.zeros_like(dx)
    for k in range(6):   # the flat sides' normals: pointy-top hex sides face 0, 60, ... 300 degrees
        a = math.radians(60 * k)
        d = np.maximum(d, dx * math.cos(a) + dy * math.sin(a))
    return 1 - d / ri


def carry(rgb, a, r=4, rounds=4):
    """Colour under the clear pixels, from the painted ones round about (no wrap: cells are separate)."""
    col = rgb * a[..., None]
    w = a.copy()
    out = rgb.copy()
    for _ in range(rounds):
        cb, wb = box_blur(col, r, 2, False), box_blur(w[..., None], r, 2, False)[..., 0]
        fill = cb / (wb[..., None] + 1e-5)
        out = np.where((a > .5)[..., None], out, np.where((wb > 1e-3)[..., None], fill, out))
        col = out * np.maximum(w, (wb > 1e-3).astype(np.float32))[..., None]
        w = np.maximum(w, (wb > 1e-3).astype(np.float32))
        r *= 2
    return out


def shrink(a, n):
    """Area-average a float image (H, W[, C]) down to n x n (premultiplication done by the caller)."""
    im = a if a.ndim == 3 else a[..., None]
    chans = [np.asarray(Image.fromarray(im[..., c]).resize((n, n), Image.LANCZOS)) for c in range(im.shape[-1])]
    o = np.stack(chans, -1)
    return o if a.ndim == 3 else o[..., 0]


def normal_from(h, k, wrap):
    if wrap:
        gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / 2
        gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) / 2
    else:
        gy, gx = np.gradient(h)
    nx, ny, nz = -gx * k, gy * k, np.ones_like(h)   # (green up: three.js's convention, v running up the image)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([nx / l, ny / l, nz / l], -1) * .5 + .5


def ao_from(h, r, wrap):
    """Cavities: darker where the height sits below its surroundings."""
    s = box_blur(h, r, 2, wrap)
    return np.clip(1 - np.maximum(0, s - h) * 4, 0, 1)


def sobel_corr(a, b, m):
    ga = np.hypot(*np.gradient(a)); gb = np.hypot(*np.gradient(b))
    ga, gb = ga[m], gb[m]
    ga, gb = ga - ga.mean(), gb - gb.mean()
    return float((ga * gb).sum() / (np.sqrt((ga * ga).sum() * (gb * gb).sum()) + 1e-9))


def save(a, path, mode, lossless):
    im = Image.fromarray((np.clip(a, 0, 1) * 255 + .5).astype(np.uint8), mode)
    im.save(path, "WEBP", lossless=lossless, quality=100 if lossless else 90, method=6, exact=lossless)


def tiles(area, warn):
    A = SRC / "areas" / area
    V = SRC / "variation" / area
    col = np.zeros((2 * CELL, 4 * CELL, 4), np.float32)
    nrm = np.zeros((2 * CELL, 4 * CELL, 3), np.float32)
    dat = np.zeros((2 * CELL, 4 * CELL, 4), np.float32)
    var = np.zeros((2 * CELL, 4 * CELL, 4), np.float32)
    for si, s in enumerate("ab"):
        alb = arr(A / f"{area}--hex-albedo-{s}.png", "RGB")
        hgt = arr(A / f"{area}--hex-height-{s}.png", "L")
        rgh = arr(A / f"{area}--hex-roughness-{s}.png", "L")
        met = arr(A / f"{area}--hex-metalness-{s}.png", "L")
        cov = arr(V / f"{area}--tile-coverage-{s}.png", "L")
        vm = arr(V / f"{area}--variation-mask-rgba-{s}.png", "RGBA")
        for k, (cx, cy) in enumerate(CENTRES):
            sl = (slice(cy - 256, cy + 256), slice(cx - 256, cx + 256))
            c = cov[sl]
            m = c > .5
            ys, xs = np.nonzero(m)
            if abs(xs.mean() + .5 - 256) > 6 or abs(ys.mean() + .5 - 256) > 6:
                warn.append(f"{area} {s}{k + 1}: hex off centre by ({xs.mean() + .5 - 256:.1f}, {ys.mean() + .5 - 256:.1f}) px")
            h = hgt[sl]
            if sobel_corr(h, alb[sl].mean(-1), m) < .15:
                warn.append(f"WARN {area} {s}{k + 1}: height does not follow the colour; built from brightness and edge distance")
                e = np.clip(hex_dist(512, 256, 256, SRC_R) / .12, 0, 1)
                h = (.47 + .31 * e) * m + alb[sl].mean(-1) * .15 * m
            rgb = carry(alb[sl], c)
            # into the 256 cell
            ti = si * 4 + k
            oy, ox = (ti // 4) * CELL, (ti % 4) * CELL
            cs = shrink(c, CELL)
            col[oy:oy + CELL, ox:ox + CELL, :3] = shrink(rgb, CELL)
            col[oy:oy + CELL, ox:ox + CELL, 3] = cs
            hs = shrink(h, CELL)
            nrm[oy:oy + CELL, ox:ox + CELL] = normal_from(hs, 6, False)
            dat[oy:oy + CELL, ox:ox + CELL, 0] = ao_from(hs, 6, False)
            dat[oy:oy + CELL, ox:ox + CELL, 1] = shrink(rgh[sl], CELL)
            dat[oy:oy + CELL, ox:ox + CELL, 2] = shrink(met[sl], CELL)
            dat[oy:oy + CELL, ox:ox + CELL, 3] = cs
            var[oy:oy + CELL, ox:ox + CELL] = shrink(vm[sl], CELL) * (cs[..., None] > .02)
    save(col, OUT / f"{area}-tiles.webp", "RGBA", False)
    save(nrm, OUT / f"{area}-tiles-n.webp", "RGB", True)
    save(dat, OUT / f"{area}-tiles-m.webp", "RGBA", True)
    save(var, OUT / f"{area}-tiles-v.webp", "RGBA", True)


def wrap_shrink(a, n):
    N = a.shape[0]
    big = np.concatenate([np.concatenate([a] * 3, 1)] * 3, 0)
    return shrink(big, n * 3)[n:2 * n, n:2 * n]


def joint(area):
    A = SRC / "areas" / area
    J = 256
    alb = wrap_shrink(arr(A / f"{area}--joint-albedo.png", "RGB"), J)
    h = wrap_shrink(arr(A / f"{area}--joint-height.png", "L"), J)
    r = wrap_shrink(arr(A / f"{area}--joint-roughness.png", "L"), J)
    m = wrap_shrink(arr(A / f"{area}--joint-metalness.png", "L"), J)
    save(alb, OUT / f"{area}-joint.webp", "RGB", False)
    save(normal_from(h, 4, True), OUT / f"{area}-joint-n.webp", "RGB", True)
    save(np.stack([ao_from(h, 8, True), r, m], -1), OUT / f"{area}-joint-m.webp", "RGB", True)


def growth(area):
    A = SRC / "areas" / area
    G = 128
    out = np.zeros((4 * G, 8 * G, 4), np.float32)
    glo = np.zeros((4 * G, 8 * G), np.float32)
    dat = np.zeros((4 * G, 8 * G, 3), np.float32)
    for half, kind in enumerate(["flat", "upright"]):
        im = arr(A / f"{area}--growth-{kind}.png", "RGBA")
        key = (np.abs(im[..., 0] - 1) < .02) & (im[..., 1] < .02) & (np.abs(im[..., 2] - 1) < .02)
        im[key, 3] = 0
        rg = arr(A / f"{area}--growth-{kind}-roughness.png", "L")
        mt = arr(A / f"{area}--growth-{kind}-metalness.png", "L")
        gl = arr(A / f"{area}--growth-glow.png", "L") if kind == "upright" else np.zeros(im.shape[:2], np.float32)
        a = im[..., 3]
        rgb = carry(im[..., :3], a)
        pre = np.concatenate([rgb * a[..., None], a[..., None]], -1)
        s = shrink(pre, 512)
        sa = s[..., 3:]
        s_rgb = np.where(sa > 1e-3, s[..., :3] / np.maximum(sa, 1e-3), shrink(rgb, 512))
        out[:, half * 512:(half + 1) * 512] = np.concatenate([s_rgb, sa], -1)
        glo[:, half * 512:(half + 1) * 512] = shrink(gl, 512)
        dat[:, half * 512:(half + 1) * 512, 0] = 1
        dat[:, half * 512:(half + 1) * 512, 1] = shrink(rg, 512)
        dat[:, half * 512:(half + 1) * 512, 2] = shrink(mt, 512)
    save(out, OUT / f"{area}-growth.webp", "RGBA", True)
    save(glo, OUT / f"{area}-growth-e.webp", "L", True)
    save(dat, OUT / f"{area}-growth-m.webp", "RGB", True)


ACCENT_OVERRIDE = {"vault": "#9b5cff"}   # chosen by hand where the picked hue is not the one wanted (the Vault: purple, not its tiles' pink)


def accent(area):
    """The area's accent: the most saturated colours of its painted tiles (moss, embers, flecks, veins), averaged, at full
    brightness, for things that glow in its colour (arenahex.js: your side's joint glow)."""
    a = np.asarray(Image.open(OUT / f"{area}-tiles.webp").convert("RGBA")).astype(np.float32) / 255
    rgb = a[..., :3][a[..., 3] > .5]
    mx, mn = rgb.max(1), rgb.min(1)
    sat = (mx - mn) / (mx + 1e-5)
    sel = sat >= np.quantile(sat, .97)
    top, w = rgb[sel], sat[sel]
    import colorsys
    hue = np.array([colorsys.rgb_to_hsv(*c)[0] for c in top])
    hist, edges = np.histogram(hue, bins=36, range=(0, 1), weights=w)
    hist = hist + np.roll(hist, 1) + np.roll(hist, -1)   # (a hue's neighbours count with it)
    h = (edges[hist.argmax()] + .5 / 36) % 1
    c = colorsys.hsv_to_rgb(h, .7, 1)   # (that hue, clearly coloured, at full brightness: it glows)
    return "#" + "".join(f"{int(round(v * 255)):02x}" for v in c)


def write_map():
    v = json.load(open(SRC / "docs/validation.json"))
    G = 128 / 256
    gro = {"cell": 128, "baseline": 112, "flat": {}, "upright": {}, "box": {}, "glow": {}}
    for a in AREAS:
        g = v["areas"][a]["growth"]
        gro["flat"][a] = [c["cell"] - 1 for c in g["flat"]["cells"] if c.get("source_alpha_pixels", 0) > 0]
        gro["upright"][a] = [c["cell"] - 1 for c in g["upright"]["cells"] if c.get("source_alpha_pixels", 0) > 0]
        gro["box"][a] = {("f" if k == "flat" else "u") + str(c["cell"] - 1): [round(x * G) for x in c["box"]] for k in ("flat", "upright") for c in g[k]["cells"]}
        gro["glow"][a] = [c - 1 for c in v["areas"][a]["glow_nonzero_cells"]]
    M = {"cell": CELL, "cols": 4, "rows": 2, "hexR": HEXR, "areas": AREAS, "accent": {a: ACCENT_OVERRIDE.get(a) or accent(a) for a in AREAS}, "joint": 256, "growth": gro}
    MAP.write_text("/* Hexmancers - the battle board's painted hex floor: what tools/build-arena-hex.py made (generated; do not edit).\n"
                   "   art/environment/arena/hex/<area>-*.webp; read by arenahex.js. */\nconst ARENA_HEX=" + json.dumps(M, separators=(",", ":")) + ";\n")


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    warn = []
    for a in AREAS:
        tiles(a, warn)
        joint(a)
        growth(a)
        print("built", a)
    n = np.asarray(Image.open(SRC / "shared/broad-noise-seamless.png").convert("L")).astype(np.float32) / 255
    save(wrap_shrink(n, 256), OUT / "broad-noise.webp", "L", True)
    write_map()
    for w in warn:
        print(w)
    tot = sum(p.stat().st_size for p in OUT.glob("*.webp"))
    print(f"{len(list(OUT.glob('*.webp')))} files, {tot / 1e6:.1f} MB -> {OUT.relative_to(ROOT)}")


def check():
    bad = []
    sizes = {"tiles": (1024, 512), "tiles-n": (1024, 512), "tiles-m": (1024, 512), "tiles-v": (1024, 512), "joint": (256, 256),
             "joint-n": (256, 256), "joint-m": (256, 256), "growth": (1024, 512), "growth-e": (1024, 512), "growth-m": (1024, 512)}
    for a in AREAS:
        for k, sz in sizes.items():
            p = OUT / f"{a}-{k}.webp"
            if not p.exists():
                bad.append(f"missing {p.name}")
                continue
            if Image.open(p).size != sz:
                bad.append(f"{p.name} is {Image.open(p).size}, want {sz}")
        if bad:
            continue
        m = np.asarray(Image.open(OUT / f"{a}-tiles-m.webp").convert("RGBA"))
        v = np.asarray(Image.open(OUT / f"{a}-tiles-v.webp").convert("RGBA"))
        for t in range(8):
            oy, ox = (t // 4) * CELL, (t % 4) * CELL
            if m[oy + 128, ox + 128, 3] != 255 or m[oy, ox, 3] != 0:
                bad.append(f"{a} tile {t + 1}: coverage not 255 at the centre and 0 at the cell corner")
        if (v[m[..., 3] == 0] > 0).any():
            bad.append(f"{a}: a variation mask value outside the coverage")
        g = np.asarray(Image.open(OUT / f"{a}-tiles-m.webp").convert("RGBA"))[..., 2]
        if (np.asarray(Image.open(OUT / f"{a}-tiles.webp").convert("RGBA"))[..., 3] != m[..., 3]).mean() > .01:
            bad.append(f"{a}: the colour's alpha is not the coverage")
        if a in ("deeps", "abyss") and not (g > 0).any():
            bad.append(f"{a}: no metal flecks")
        if a == "hollows" and (g > 0).any():
            bad.append("hollows: metal where there should be none")
        if a == "ruins" and np.asarray(Image.open(OUT / "ruins-growth-e.webp")).max() > 0:
            bad.append("ruins: glows")
    try:
        out = subprocess.run(["node", "-e", f"eval(require('fs').readFileSync('{MAP}','utf8')+';console.log(ARENA_HEX.areas.length)')"], capture_output=True, text=True).stdout.strip()
        if out != "6":
            bad.append("arenahexmap.js does not name 6 areas")
    except Exception as e:
        bad.append(f"arenahexmap.js: {e}")
    print("\n".join(bad) if bad else "PASS")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    check() if "--check" in sys.argv else build()
