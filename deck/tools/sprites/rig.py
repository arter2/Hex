"""A small pixel-art rig. A sprite is a stack of parts (a mask, a color ramp and a depth);
the renderer shades each part as a soft solid lit from the upper left, darkens what sits just
under an overlapping part, draws a dark line where one part crosses another and a colored
outline around the whole figure, then lays hand-placed pixels (faces, folds, glints) on top.
Only numpy and Pillow are needed."""
import colorsys, math
import numpy as np
from PIL import Image, ImageDraw

def rgb(h):
    if isinstance(h, tuple): return h
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

def hexs(c): return '#%02x%02x%02x' % tuple(int(max(0, min(255, round(v)))) for v in c[:3])

def mix(a, b, t):
    a, b = rgb(a), rgb(b); return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))

def _shift_hue(h, target, amt):
    d = (target - h + 0.5) % 1.0 - 0.5
    return (h + max(-abs(amt), min(abs(amt), d))) % 1.0

def ramp(base, cool=0.66, warm=0.13, contrast=1.0):
    """Six tones from a base color: 0 line, 1 deep shadow, 2 shadow, 3 base, 4 light, 5 highlight.
    Shadows slide toward blue-violet and gain saturation; lights slide toward warm yellow."""
    r, g, b = [v / 255 for v in rgb(base)]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    steps = [(-0.70, 0.07, 0.18), (-0.50, 0.05, 0.12), (-0.29, 0.03, 0.07), (0, 0, 0), (0.20, -0.025, -0.10), (0.42, -0.05, -0.25)]
    out = []
    for dv, dh, ds in steps:
        dv *= contrast
        if dv < 0: hh = _shift_hue(h, cool, dh * (1 if s > 0.08 else 0)); vv = v * (1 + dv); ss = min(1, s + ds * (1 if s > 0.05 else 0.3))
        elif dv > 0: hh = _shift_hue(h, warm, -dh * (1 if s > 0.08 else 0)); vv = min(1, v + (1 - v) * dv * 0.9 + v * dv * 0.25); ss = max(0, s + ds * s)
        else: hh, vv, ss = h, v, s
        out.append(tuple(int(round(c * 255)) for c in colorsys.hsv_to_rgb(hh, ss, vv)))
    return out

def ramp_of(spec):
    """A ramp from a base hex, or six explicit hexes."""
    if isinstance(spec, (list, tuple)) and len(spec) == 6: return [rgb(c) for c in spec]
    if isinstance(spec, dict): return ramp(spec['base'], **{k: v for k, v in spec.items() if k != 'base'})
    return ramp(spec)

LIGHT = np.array([-0.52, -0.72, 0.56]); LIGHT = LIGHT / np.linalg.norm(LIGHT)

def _blur(a, s):
    if s <= 0: return a.astype(float)
    r = int(math.ceil(s * 2.5)); k = np.exp(-(np.arange(-r, r + 1) ** 2) / (2 * s * s)); k /= k.sum()
    p = np.pad(a.astype(float), r, mode='constant')
    p = np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 0, p)
    p = np.apply_along_axis(lambda m: np.convolve(m, k, mode='same'), 1, p)
    return p[r:-r, r:-r]

def _edt(mask):
    """Distance from each inside pixel to the nearest outside pixel (brute force; sprites are small)."""
    H, W = mask.shape
    pad = np.pad(mask, 1, constant_values=False)
    edge = (~pad) & (np.roll(pad, 1, 0) | np.roll(pad, -1, 0) | np.roll(pad, 1, 1) | np.roll(pad, -1, 1))
    ey, ex = np.nonzero(edge); ey = ey - 1; ex = ex - 1
    iy, ix = np.nonzero(mask); d = np.zeros(mask.shape)
    if len(iy) == 0 or len(ey) == 0: return d
    for s in range(0, len(iy), 4096):
        dy = iy[s:s + 4096, None] - ey[None, :]; dx = ix[s:s + 4096, None] - ex[None, :]
        d[iy[s:s + 4096], ix[s:s + 4096]] = np.sqrt((dx * dx + dy * dy).min(1))
    return d

class Part:
    def __init__(self, spr, name, mat, z, form, bulge, line, cast, shine, R, flat):
        self.spr, self.name, self.mat, self.z = spr, name, mat, z
        self.form, self.bulge, self.line, self.cast, self.shine, self.R, self.flat = form, bulge, line, cast, shine, R, flat
        self.mask = np.zeros((spr.h, spr.w), bool)

    def _img(self):
        return Image.new('1', (self.spr.w, self.spr.h), 0)

    def _apply(self, im, erase=False):
        m = np.array(im, bool)
        if erase: self.mask &= ~m
        else: self.mask |= m
        return self

    def poly(self, pts, erase=False):
        im = self._img(); ImageDraw.Draw(im).polygon([(x, y) for x, y in pts], fill=1); return self._apply(im, erase)

    def ellipse(self, cx, cy, rx, ry, erase=False):
        yy, xx = np.mgrid[0:self.spr.h, 0:self.spr.w]
        m = ((xx + 0.5 - cx) / max(rx, .01)) ** 2 + ((yy + 0.5 - cy) / max(ry, .01)) ** 2 <= 1.0
        if erase: self.mask &= ~m
        else: self.mask |= m
        return self

    def rect(self, x0, y0, x1, y1, erase=False):
        m = np.zeros_like(self.mask); m[max(0, y0):y1 + 1, max(0, x0):x1 + 1] = True
        if erase: self.mask &= ~m
        else: self.mask |= m
        return self

    def capsule(self, a, b, r0, r1=None, erase=False):
        """A tube from a to b, radius r0 at a tapering to r1 at b."""
        r1 = r0 if r1 is None else r1
        yy, xx = np.mgrid[0:self.spr.h, 0:self.spr.w]; px, py = xx + 0.5, yy + 0.5
        ax, ay = a; bx, by = b; vx, vy = bx - ax, by - ay; L2 = vx * vx + vy * vy or 1e-6
        t = np.clip(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1)
        d = np.hypot(px - (ax + t * vx), py - (ay + t * vy)); m = d <= r0 + (r1 - r0) * t
        if erase: self.mask &= ~m
        else: self.mask |= m
        return self

    def curve(self, pts, r0, r1=None, steps=24, erase=False):
        """A tube along a quadratic (3 points) or cubic (4 points) Bezier curve."""
        r1 = r0 if r1 is None else r1
        P = [np.array(p, float) for p in pts]
        def at(t):
            if len(P) == 3: return (1 - t) ** 2 * P[0] + 2 * (1 - t) * t * P[1] + t * t * P[2]
            if len(P) == 4: return (1 - t) ** 3 * P[0] + 3 * (1 - t) ** 2 * t * P[1] + 3 * (1 - t) * t * t * P[2] + t ** 3 * P[3]
            return P[0] * (1 - t) + P[-1] * t
        prev = at(0)
        for i in range(1, steps + 1):
            t = i / steps; cur = at(t)
            self.capsule(tuple(prev), tuple(cur), r0 + (r1 - r0) * (t - 1 / steps), r0 + (r1 - r0) * t, erase=erase); prev = cur
        return self

    def px(self, pts, erase=False):
        for x, y in pts:
            if 0 <= x < self.spr.w and 0 <= y < self.spr.h: self.mask[y, x] = not erase
        return self

    def hull(self):
        """Replace the mask with its convex hull, so a union of shapes shades as one smooth form."""
        ys, xs = np.nonzero(self.mask)
        if len(xs) < 3: return self
        pts = sorted(set(zip(xs.tolist(), ys.tolist())))
        cross = lambda o, a, b: (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
        lo, hi = [], []
        for p in pts:
            while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0: lo.pop()
            lo.append(p)
        for p in reversed(pts):
            while len(hi) >= 2 and cross(hi[-2], hi[-1], p) <= 0: hi.pop()
            hi.append(p)
        poly = [(x + 0.5, y + 0.5) for x, y in lo[:-1] + hi[:-1]]
        im = self._img(); ImageDraw.Draw(im).polygon(poly, fill=1, outline=1); self.mask |= np.array(im, bool); return self

    def clip(self, other):
        """Keep only the pixels inside another part (or mask)."""
        self.mask &= (other.mask if isinstance(other, Part) else other); return self

    def cut(self, other):
        self.mask &= ~(other.mask if isinstance(other, Part) else other); return self

class Sprite:
    def __init__(self, w=96, h=96, outline_mix=0.55, outline_dark='#0b0710'):
        self.w, self.h = w, h; self.parts = []; self.decals = []; self.mats = {}
        self.outline_mix, self.outline_dark = outline_mix, rgb(outline_dark)
        self.glow = []                           # (x, y, color) pixels that may sit outside the figure
        self.rim = True                          # dark materials catch a light along the top-left edge

    def mat(self, name, spec):
        self.mats[name] = ramp_of(spec); return name

    def part(self, name, mat, z=0, form='round', bulge=1.0, line=True, cast=True, shine=0.0, R=None, flat=0.0):
        p = Part(self, name, mat, z, form, bulge, line, cast, shine, R, flat); p.order = len(self.parts); self.parts.append(p); return p

    def get(self, name):
        for p in self.parts:
            if p.name == name: return p
        return None

    # hand-placed pixels laid over the shaded figure
    def tone(self, part, pts, t):
        """Paint pixels with tone t (0..5) of a part's ramp, only where that part shows."""
        self.decals.append(('tone', part, pts, t)); return self

    def paint(self, pts, color, over=False):
        """Paint pixels a fixed color; over=True also paints outside the figure."""
        self.decals.append(('rgb', None, pts, (rgb(color), over))); return self

    def ontone(self, mat, pts, t):
        """Tone t of a material, only on pixels that already show that material."""
        self.decals.append(('onmat', mat, pts, t)); return self

    def mtone(self, mat, pts, t, over=False):
        """Paint pixels with a tone from a named material, wherever they fall."""
        self.decals.append(('mat', mat, pts, (t, over))); return self

    def _clean(self, tone, own, passes=2):
        """Merge stray pixels into their clusters: a pixel whose tone matches none of its four
        neighbors in the same part takes the most common neighboring tone."""
        H, W = tone.shape
        for _ in range(passes):
            t2 = tone.copy()
            for y in range(H):
                for x in range(W):
                    a = own[y, x]
                    if a < 0: continue
                    nb = [tone[Y, X] for X, Y in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if 0 <= X < W and 0 <= Y < H and own[Y, X] == a]
                    if len(nb) >= 3 and tone[y, x] not in nb:
                        t2[y, x] = max(set(nb), key=nb.count)
            tone = t2
        return tone

    def render(self):
        H, W = self.h, self.w
        order = sorted(self.parts, key=lambda p: (p.z, p.order))
        rank = {id(p): i for i, p in enumerate(order)}
        own = -np.ones((H, W), int)
        for i, p in enumerate(order): own[p.mask] = i
        tone = np.zeros((H, W), int)
        yy, xx = np.mgrid[0:H, 0:W]
        top = np.nonzero(own >= 0)[0].min() if (own >= 0).any() else 0
        for i, p in enumerate(order):
            vis = own == i
            if not vis.any(): continue
            d = _edt(p.mask)
            R = p.R or max(1.5, float(d.max()))
            t = np.clip(d / R, 0, 1)
            nz = np.sqrt(np.clip(1 - (1 - t) ** 2, 0, 1)) * p.bulge + (1 - p.bulge)
            g = _blur(p.mask, max(0.8, R * 0.45))
            gy, gx = np.gradient(g); n = np.hypot(gx, gy) + 1e-9
            ox, oy = -gx / n, -gy / n                       # outward
            sxy = np.sqrt(np.clip(1 - nz ** 2, 0, 1))
            I = ox * sxy * LIGHT[0] + oy * sxy * LIGHT[1] + nz * LIGHT[2]
            I = I - 0.10 * (yy - top) / max(1, H - top) + p.flat
            if p.shine:
                th = [0.80, 0.56, 0.22, -0.08]
            else:
                th = [0.88, 0.68, 0.30, 0.02]
            tt = np.where(I > th[0], 5, np.where(I > th[1], 4, np.where(I > th[2], 3, np.where(I > th[3], 2, 1))))
            if p.form == 'flat': tt = np.where(I > th[1], 4, np.where(I > th[3] - 0.1, 3, 2))
            if p.form == 'cloth':
                # cloth hangs in wide bands across each row: a lit edge on the left, a broad
                # middle, a shadow side, and a deep crease against the right-hand edge
                tt = np.full((H, W), 3)
                for y in range(H):
                    xs = np.nonzero(p.mask[y])[0]
                    if len(xs) < 2: continue
                    x0, x1 = xs.min(), xs.max(); w = max(1, x1 - x0)
                    t = (np.arange(W) - x0) / w
                    lit = 0.16 if w > 8 else 0.25
                    tt[y] = np.where(t < lit, 4, np.where(t < 0.62, 3, np.where((t < 0.9) | (w < 6), 2, 1)))
                    if w <= 3: tt[y] = 3
            tone[vis] = tt[vis]
        # cast shadows: pixels just below and right of an overlapping part step one tone darker
        shade = np.zeros((H, W), bool)
        for (dx, dy) in ((0, -1), (-1, -1), (0, -2), (-1, -2)):
            for y in range(H):
                sy = y + dy
                if sy < 0: continue
                for x in range(W):
                    a = own[y, x]
                    if a < 0: continue
                    sx = x + dx
                    if sx < 0: continue
                    b = own[sy, sx]
                    if b > a and order[b].cast and order[b].mat != order[a].mat or (b > a and order[b].cast == 2):
                        shade[y, x] = True
        tone = np.where(shade & (tone > 1), tone - 1, tone)
        tone = self._clean(tone, own)
        if self.rim:
            solid = own >= 0
            for i, p in enumerate(order):
                base = self.mats[p.mat][3]
                if 0.3 * base[0] + 0.59 * base[1] + 0.11 * base[2] > 95: continue
                m = own == i
                edge = m & ~np.roll(solid, 1, 1) | m & ~np.roll(solid, 1, 0)
                tone = np.where(edge & (tone < 4), tone + 1, tone)
        img = np.zeros((H, W, 4), int)
        for i, p in enumerate(order):
            R_ = self.mats[p.mat]; vis = own == i
            for k in range(6):
                m = vis & (tone == k); img[m, :3] = R_[k]; img[m, 3] = 255
        # lines where a part crosses one beneath it
        line = np.zeros((H, W), bool); lcol = np.zeros((H, W, 3), int)
        for y in range(H):
            for x in range(W):
                a = own[y, x]
                if a < 0: continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H:
                        b = own[Y, X]
                        if b > a and order[b].line and (order[b].line == 2 or order[b].mat != order[a].mat or order[b].line == 3):
                            c1 = self.mats[order[a].mat][0]; c2 = self.mats[order[b].mat][0]
                            lcol[y, x] = c1 if sum(c1) < sum(c2) else c2; line[y, x] = True; break
        img[line, :3] = lcol[line]
        # hand-placed pixels
        for kind, ref, pts, val in self.decals:
            for (x, y) in pts:
                if not (0 <= x < W and 0 <= y < H): continue
                if kind == 'tone':
                    p = self.get(ref) if isinstance(ref, str) else ref
                    if p is None or own[y, x] < 0 or order[own[y, x]] is not p: continue
                    img[y, x, :3] = self.mats[p.mat][val]
                elif kind == 'onmat':
                    if own[y, x] < 0 or order[own[y, x]].mat != ref: continue
                    img[y, x, :3] = self.mats[ref][val]
                elif kind == 'mat':
                    t, over = val
                    if own[y, x] < 0 and not over: continue
                    img[y, x, :3] = self.mats[ref][t]; img[y, x, 3] = 255
                    if own[y, x] < 0: own[y, x] = -2
                else:
                    c, over = val
                    if own[y, x] < 0 and not over: continue
                    img[y, x, :3] = c; img[y, x, 3] = 255
                    if own[y, x] < 0: own[y, x] = -2
        # outline: a darkened version of the neighbor's line color, around the whole figure
        solid = img[:, :, 3] > 0; out = img.copy()
        for y in range(H):
            for x in range(W):
                if solid[y, x]: continue
                best = None
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H and solid[Y, X]:
                        o = own[Y, X]
                        c = self.mats[order[o].mat][0] if o >= 0 else tuple(img[Y, X, :3] // 3)
                        if best is None or sum(c) < sum(best): best = c
                if best is not None:
                    out[y, x, :3] = mix(best, self.outline_dark, self.outline_mix); out[y, x, 3] = 255
        return Image.fromarray(out.astype(np.uint8), 'RGBA')

def sheet(items, scale=4, cols=6, bg=(118, 112, 138), label=True, pad=8):
    """Lay out (name, image) pairs on a gray board, scaled up, for previews and judging."""
    from PIL import ImageFont
    cw = max(im.width for _, im in items) * scale + pad * 2; ch = max(im.height for _, im in items) * scale + pad * 2 + (14 if label else 0)
    rows = (len(items) + cols - 1) // cols
    S = Image.new('RGBA', (cw * min(cols, len(items)), ch * rows), bg + (255,)); d = ImageDraw.Draw(S)
    for i, (name, im) in enumerate(items):
        x, y = (i % cols) * cw, (i // cols) * ch
        S.alpha_composite(im.resize((im.width * scale, im.height * scale), Image.NEAREST), (x + pad, y + pad))
        if label: d.text((x + pad, y + ch - 14), name, fill=(240, 236, 220, 255))
    return S
