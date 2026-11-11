#!/usr/bin/env python3
"""Procedural draft generator: elf wizard (male, no hat, normal) walk, 8 directions.

The character is a small 3D puppet made of ellipsoids. Every direction is rendered
from the same model through an orthographic three-quarter camera, so left and right
views are separate renders (never mirrored) and the staff stays in the character's
left hand. Output is hard-edged: one material ramp colour per pixel, no resampling.

Usage: python3 elf_wizard_walk_gen.py <output-folder>
Writes the 2048x2048 sheet, its metadata JSON and a combined preview GIF.
"""
import hashlib, json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

CELL, FRAMES, SHEET = 128, 12, 2048
PIVOT = (64, 112)                      # ground contact, between the feet
PITCH = math.radians(25)               # camera elevation
SCALE = 1.13
KEY = (0, 255, 0)
DIRS = ["s", "sw", "w", "nw", "n", "ne", "e", "se"]            # rows 2..9
YAW = {"s": 0, "se": 45, "e": 90, "ne": 135, "n": 180, "nw": 225, "w": 270, "sw": 315}
BASE = "elf-wizard__male-no-hat-normal__walk__8dir__v001"
REFERENCE = "sprites/sources/elf-wizard/male-no-hat-normal/elf-wizard__male-no-hat-normal__idle-se__reference.gif"

RAMPS = {  # dark -> light, sampled from the reference palette
    "skin":   [(178, 119, 77), (237, 177, 136), (251, 212, 173)],
    "hair":   [(113, 40, 25), (171, 64, 31), (217, 84, 28), (242, 146, 50)],
    "cloak":  [(17, 32, 35), (29, 64, 52), (54, 87, 52), (78, 112, 66)],
    "gold":   [(140, 78, 24), (217, 132, 40), (250, 196, 90)],
    "cream":  [(170, 138, 110), (228, 204, 172), (251, 240, 212), (253, 251, 234)],
    "boot":   [(58, 23, 18), (102, 34, 22), (150, 70, 35), (188, 104, 56)],
    "belt":   [(58, 23, 18), (113, 40, 25), (156, 78, 40)],
    "staff":  [(37, 41, 78), (62, 71, 139), (98, 108, 184)],
    "gem":    [(14, 80, 200), (14, 130, 249), (44, 220, 254), (206, 250, 255)],
    "pants":  [(14, 22, 30), (30, 44, 60)],
    "eye":    [(16, 22, 60), (16, 22, 60)],
    "iris":   [(40, 90, 210), (40, 90, 210)],
    "white":  [(253, 251, 234), (253, 251, 234)],
}
MATS = list(RAMPS)
OUTLINE = (12, 14, 22)
LIGHT = np.array([-0.45, -0.62, -0.64]); LIGHT /= np.linalg.norm(LIGHT)

VIEW = np.array([[1, 0, 0],
                 [0, -math.sin(PITCH), -math.cos(PITCH)],
                 [0, math.cos(PITCH), -math.sin(PITCH)]])


def shifted(arr, dy, dx, fill):
    """Shift without wrap-around."""
    out = np.full_like(arr, fill)
    h, w = arr.shape
    out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = arr[max(-dy, 0):h + min(-dy, 0), max(-dx, 0):w + min(-dx, 0)]
    return out


class Prim:
    __slots__ = ("c", "r", "mat", "grp", "flat", "fn")
    def __init__(s, c, r, mat, grp, flat=False, fn=None):
        s.c = np.array(c, float); s.mat = mat; s.grp = grp; s.flat = flat; s.fn = fn
        s.r = np.array([r, r, r] if np.isscalar(r) else r, float)


def chain(out, a, b, ra, rb, mat, grp, n=None):
    a, b = np.array(a, float), np.array(b, float)
    n = n or max(2, int(np.linalg.norm(b - a) / 1.2) + 1)
    for i in range(n):
        t = i / (n - 1)
        out.append(Prim(a + (b - a) * t, ra + (rb - ra) * t, mat, grp))


def head_colour(p):
    """Material index per pixel from the unit local direction on the head sphere."""
    l, f, z = p[..., 0], p[..., 1], p[..., 2]
    m = np.full(l.shape, MATS.index("hair"))
    hairline = 0.34 + 0.13 * np.cos(l * 11.0)
    face = (f > 0.22) & (z < hairline) & (np.abs(l) < 0.86)
    m[face] = MATS.index("skin")
    al = np.abs(l)
    eye = face & (f > 0.45) & (al > 0.20) & (al < 0.56) & (z > -0.30) & (z < 0.12)
    m[eye] = MATS.index("eye")
    m[eye & (z < -0.10) & (al < 0.46)] = MATS.index("iris")
    m[eye & (z > 0.0) & (al > 0.42)] = MATS.index("white")
    return m


SPIKES = [  # (direction l,f,z ; length) hair tufts, fixed so every view agrees
    ((0.0, 0.1, 1.0), 9), ((0.55, 0.0, 0.85), 9), ((-0.55, 0.05, 0.85), 9),
    ((0.25, -0.5, 0.85), 9), ((-0.3, -0.5, 0.8), 10), ((0.85, -0.2, 0.5), 8),
    ((-0.85, -0.2, 0.5), 8), ((0.6, -0.75, 0.3), 9), ((-0.6, -0.75, 0.3), 9),
    ((0.0, -1.0, 0.35), 9), ((0.0, -0.95, -0.2), 7), ((0.75, -0.6, -0.15), 7),
    ((-0.75, -0.6, -0.15), 7), ((0.35, 0.75, 0.62), 6), ((-0.35, 0.75, 0.62), 6),
    ((0.0, 0.8, 0.7), 6), ((0.75, 0.4, 0.62), 6), ((-0.75, 0.4, 0.62), 6),
    ((0.95, -0.25, 0.05), 5), ((-0.95, -0.25, 0.05), 5),
]


def build(phase):
    """Primitives in character space: (left, forward, up), pixels before SCALE."""
    P = []
    s, c = math.sin(phase), math.cos(phase)
    bob = 1.6 * abs(c)                       # body is highest as the legs pass
    sway = 0.8 * s
    B = np.array([sway * 0.5, 0, bob])       # body offset

    # legs and boots: left foot forward at phase 90 deg, right foot opposite
    for side, ph in ((1, phase), (-1, phase + math.pi)):
        fs, fc = math.sin(ph), math.cos(ph)
        foot = np.array([side * 5.5, 7.5 * fs, 3.6 + 4.2 * max(0.0, fc)])
        knee = np.array([side * 5.0, 3.0 * fs + 1.5 * max(0.0, fc), 15 + bob])
        hip = np.array([side * 4.5, 0, 24 + bob])
        g = "legL" if side > 0 else "legR"
        chain(P, hip, knee, 4.2, 3.8, "pants", g)
        chain(P, knee, foot + [0, -1.5, 2.5], 3.9, 3.9, "boot", g)
        P.append(Prim(foot + [0, 1.5, 0], (4.2, 6.4, 3.6), "boot", g))
        P.append(Prim(foot + [0, -1.0, 8.5], (4.5, 4.5, 1.6), "belt", g))   # boot cuff

    # robe skirt: stacked rings, hem trimmed in orange, sways with the stride
    for i, z in enumerate(np.arange(17, 45, 1.5)):
        t = (z - 17) / 27.0
        lag = (1 - t)
        off = np.array([1.4 * lag * math.sin(phase - 0.6), 1.2 * lag * math.sin(2 * phase), 0])
        mat = "gold" if z < 19.5 else "cream"
        P.append(Prim(B + off + [0, 1.0, z], (14.0 - 5.0 * t, 10.5 - 3.5 * t, 2.2), mat, "robe", flat=True))
    # robe front panel seam (orange embroidery line down the front)
    for z in np.arange(21, 40, 3.0):
        t = (z - 17) / 27.0
        P.append(Prim(B + [0, 1.0 + 10.5 - 3.5 * t, z], 1.1, "gold", "robe"))

    # torso, belt, buckle
    P.append(Prim(B + [0, 0.3, 49], (9.2, 6.8, 9.5), "cream", "robe"))
    P.append(Prim(B + [0, 0.8, 43], (9.6, 7.6, 2.0), "belt", "belt", flat=True))
    P.append(Prim(B + [0, 8.2, 43], (2.0, 1.2, 2.0), "gold", "belt"))

    # cloak: open at the front, hangs behind, gold hem, trails a little on each step
    for z in np.arange(19, 58, 1.5):
        t = (z - 19) / 39.0
        lag = (1 - t) ** 1.5
        off = np.array([2.0 * lag * math.sin(phase - 0.9), -1.5 * lag * (0.5 + 0.5 * abs(s)), 0])
        mat = "gold" if (z < 21.5) else "cloak"
        P.append(Prim(B + off + [0, -5.5 + 2.5 * t, z], (21.0 - 8.5 * t, 12.0 - 3.5 * t, 2.2), mat, "cloak", flat=True))
    P.append(Prim(B + [0, -4.5, 58.5], (10.5, 6.5, 4.5), "cloak", "cloak"))          # hood roll
    for side in (1, -1):
        P.append(Prim(B + [side * 9.5, -0.5, 55], (6.4, 6.6, 5.4), "cloak", "cloak"))  # shoulders

    # right arm swings free, opposite the right leg
    sh = B + [-11.5, 0, 54]
    hand = B + [-15.5, 2.0 + 6.5 * s, 38.5 + 1.5 * abs(s)]
    elbow = (sh + hand) / 2 + [-1.0, -2.0, 0]
    chain(P, sh, elbow, 4.0, 3.9, "cloak", "armR")
    chain(P, elbow, hand, 3.9, 4.1, "cloak", "armR")
    P.append(Prim(hand + (hand - elbow) / 9 * 1.2, 4.2, "gold", "armR"))
    P.append(Prim(hand + (hand - elbow) / 9 * 3.6, 3.3, "skin", "armR"))

    # left arm holds the staff out front; the staff rides with the body
    sh = B + [11.5, 0, 54]
    grip = B + [15.5, 10.5 + 0.8 * s, 46.5]
    elbow = B + [15.0, 2.5, 46.0]
    chain(P, sh, elbow, 4.0, 3.9, "cloak", "armL")
    chain(P, elbow, grip - [0, 3.2, 0], 3.9, 4.0, "cloak", "armL")
    P.append(Prim(grip - [0, 2.6, 0], 4.2, "gold", "armL"))
    P.append(Prim(grip, 3.3, "skin", "armL"))
    tilt = np.array([0.03, 0.20 + 0.03 * s, 1.0]); tilt /= np.linalg.norm(tilt)
    foot_z = 1.5 + bob
    st = lambda z: grip + tilt * (z - grip[2])
    chain(P, st(foot_z), st(76 + bob), 1.5, 1.5, "staff", "staff", n=60)
    P.append(Prim(st(77 + bob), 2.8, "gold", "staff"))
    P.append(Prim(st(72 + bob), 2.2, "gold", "staff"))
    for side in (1, -1):                      # crescent prongs around the crystal
        a = st(78 + bob); m = st(83 + bob) + [side * 5.2, 0, 0]; b = st(89 + bob) + [side * 3.4, 0, 0]
        chain(P, a, m, 2.0, 1.7, "gold", "staff"); chain(P, m, b, 1.7, 0.9, "gold", "staff")
    P.append(Prim(st(85.5 + bob), (3.4, 3.4, 5.6), "gem", "gem"))
    chain(P, st(89 + bob), st(94 + bob), 2.2, 0.7, "gem", "gem")

    # head, ears, hair
    H = B + [0, 1.0, 69 + 0.4 * abs(s)]
    P.append(Prim(H - [0, 0, 9.5], 4.0, "skin", "head"))                              # neck
    P.append(Prim(H, 12.5, "skin", "head", fn=head_colour))
    for side in (1, -1):
        chain(P, H + [side * 11.0, -1.0, -1.0], H + [side * 21.5, -5.0, 3.5], 3.2, 0.8, "skin", "ear")
    lagz = 0.6 * math.sin(2 * phase - 1.0)
    for d, ln in SPIKES:
        d = np.array(d, float); d /= np.linalg.norm(d)
        chain(P, H + d * 9.0, H + d * (12.5 + ln * 0.85) + [0, 0, lagz], 5.0, 0.9, "hair", "hair")
    return P


def render(direction, phase):
    a = math.radians(YAW[direction])
    # columns: character left, forward, up expressed in world axes
    R = np.array([[math.cos(a), math.sin(a), 0], [math.sin(a), -math.cos(a), 0], [0, 0, 1]])
    Q = VIEW @ R
    ys, xs = np.mgrid[0:CELL, 0:CELL]
    depth = np.full((CELL, CELL), np.inf)
    mat = np.full((CELL, CELL), -1); grp = np.full((CELL, CELL), -1)
    shade = np.zeros((CELL, CELL))
    groups = {}
    for p in build(phase):
        gid = groups.setdefault(p.grp, len(groups))
        cv = Q @ (p.c * SCALE)
        r = p.r * SCALE
        A = Q @ np.diag(1.0 / r ** 2) @ Q.T
        cx, cy = PIVOT[0] + cv[0], PIVOT[1] + cv[1]
        rad = r.max() + 1
        x0, x1 = max(0, int(cx - rad)), min(CELL, int(cx + rad) + 2)
        y0, y1 = max(0, int(cy - rad)), min(CELL, int(cy + rad) + 2)
        if x0 >= x1 or y0 >= y1:
            continue
        u = xs[y0:y1, x0:x1] + 0.5 - cx; v = ys[y0:y1, x0:x1] + 0.5 - cy
        qa = A[2, 2]; qb = 2 * (A[0, 2] * u + A[1, 2] * v)
        qc = A[0, 0] * u * u + 2 * A[0, 1] * u * v + A[1, 1] * v * v - 1
        disc = qb * qb - 4 * qa * qc
        hit = disc > 0
        w = (-qb - np.sqrt(np.where(hit, disc, 0))) / (2 * qa)
        d = w + cv[2]
        sub = depth[y0:y1, x0:x1]
        win = hit & (d < sub)
        if not win.any():
            continue
        pv = np.stack([u, v, w], -1)
        pl = pv @ Q                                   # local coords (left, forward, up)
        nl = pl / r ** 2
        if p.flat:
            nl = nl * np.array([1, 1, 0.0])
        nv = nl @ Q.T
        nv /= np.linalg.norm(nv, axis=-1, keepdims=True) + 1e-9
        lum = nv @ LIGHT
        mi = np.full(u.shape, MATS.index(p.mat))
        if p.fn is not None:
            mi = p.fn(pl / np.linalg.norm(pl, axis=-1, keepdims=True))
        sub[win] = d[win]
        mat[y0:y1, x0:x1][win] = mi[win]
        grp[y0:y1, x0:x1][win] = gid
        shade[y0:y1, x0:x1][win] = lum[win]

    img = np.zeros((CELL, CELL, 3), np.uint8); img[:] = KEY
    solid = mat >= 0
    # interior contour: pixel sits well behind a neighbour from another body part
    crease = np.zeros_like(solid)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        nd = shifted(depth, dy, dx, np.inf); ng = shifted(grp, dy, dx, -1)
        crease |= solid & (ng >= 0) & (ng != grp) & (nd < depth - 3.0)
    for i, name in enumerate(MATS):
        ramp = RAMPS[name]; n = len(ramp)
        sel = mat == i
        if not sel.any():
            continue
        t = np.clip((shade + 0.25) / 1.15, 0, 0.999)
        idx = (t * n).astype(int)
        idx = np.where(crease, 0, idx)
        img[sel] = np.array(ramp, np.uint8)[idx[sel]]
    # 1 px dark outline just outside the silhouette
    edge = np.zeros_like(solid)
    for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        edge |= shifted(solid, dy, dx, False)
    img[edge & ~solid] = OUTLINE
    return img


def main(out_dir):
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    sheet = np.zeros((SHEET, SHEET, 3), np.uint8); sheet[:] = KEY
    cells = {}
    for row, d in enumerate(DIRS, start=1):
        for f in range(FRAMES):
            cell = render(d, 2 * math.pi * f / FRAMES)
            cells[d, f] = cell
            sheet[row * CELL:(row + 1) * CELL, f * CELL:(f + 1) * CELL] = cell
    # label, row 1 only, 1-bit text so it stays hard-edged
    mask = Image.new("1", (SHEET, CELL), 0)
    dr = ImageDraw.Draw(mask); font = ImageFont.load_default()
    for i, line in enumerate(["elf-wizard / male-no-hat-normal / walk / v001 / DRAFT (procedural)",
                              "rows 2-9: s sw w nw n ne e se   12 frames x 128 px   10 fps   key #00ff00"]):
        dr.text((12, 40 + 20 * i), line, fill=1, font=font)
    lab = np.array(mask.resize((SHEET, CELL), Image.NEAREST)).astype(bool)
    sheet[:CELL][lab] = (0, 0, 0)
    png = out / f"{BASE}.png"
    Image.fromarray(sheet, "RGB").save(png, optimize=True)
    sha = hashlib.sha256(png.read_bytes()).hexdigest()

    # combined preview: all eight directions, compass layout, 2x nearest neighbour
    grid = [["nw", "n", "ne"], ["w", None, "e"], ["sw", "s", "se"]]
    frames = []
    for f in range(FRAMES):
        im = np.zeros((3 * CELL, 3 * CELL, 3), np.uint8); im[:] = KEY
        for gy, r in enumerate(grid):
            for gx, d in enumerate(r):
                if d:
                    im[gy * CELL:(gy + 1) * CELL, gx * CELL:(gx + 1) * CELL] = cells[d, f]
        frames.append(Image.fromarray(im, "RGB").resize((6 * CELL, 6 * CELL), Image.NEAREST))
    pal = frames[0].quantize(colors=255, dither=Image.Dither.NONE)
    q = [fr.quantize(palette=pal, dither=Image.Dither.NONE) for fr in frames]
    q[0].save(out / f"{BASE}__preview.gif", save_all=True, append_images=q[1:], duration=100, loop=0)

    meta = {
        "schemaVersion": 1, "status": "draft", "class": "elf-wizard", "variant": "male-no-hat-normal",
        "animation": "walk", "revision": "v001", "sheet": png.name, "sha256": sha,
        "width": SHEET, "height": SHEET, "frameWidth": CELL, "frameHeight": CELL,
        "framesPerDirection": FRAMES, "startColumn": 1,
        "indexing": "workshop rows and columns are 1-based; pixels and frameIndex are 0-based",
        "labelRow": 1, "directionRows": {d: i + 2 for i, d in enumerate(DIRS)},
        "background": "#00ff00", "opaque": True, "fps": 10, "loop": True,
        "pivotPixels": {"x": PIVOT[0], "y": PIVOT[1],
                        "note": "ground contact between the feet, relative to each 128x128 frame origin"},
        "reference": REFERENCE, "review": None, "approval": None,
        "preview": f"{BASE}__preview.gif",
        "generator": "sprites/tools/elf_wizard_walk_gen.py",
        "notes": "DRAFT. Rendered procedurally from a simple 3D puppet (sprites/tools/elf_wizard_walk_gen.py), "
                 "not hand-drawn and not from an art tool. Every direction is its own render; nothing is mirrored; "
                 "staff stays in the character's left hand. Palette sampled from the reference, but the detail "
                 "level is well below the reference art. Not reviewed, not approved.",
    }
    (out / f"{BASE}.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(png, sha)


if __name__ == "__main__":
    main(sys.argv[1])
