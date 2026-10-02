"""128 x 128 redraws of every character, enemy, boss and hero, built on the generated sheets
(deck/art/sheets). Each figure is cut from its sheet, its glow haze cleared, resized to fill the
grid, rebuilt as hard-edged pixel art on a per-sprite palette, outlined and cleaned of crumbs.
Player looks also get their six action frames (idle, walk, cast, attack, hurt, die)."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
import slice as S, sheetcast as C

N = 128; FOOT = 124
CROSS = [[0, 1, 0], [1, 1, 1], [0, 1, 0]]

def clear_haze(im):
    """Drop the dark see-through glow halo the sheets paint behind staffs and auras."""
    a = np.asarray(im).copy(); rgb = a[..., :3].astype(int); al = a[..., 3]
    hi = rgb.max(2)
    haze = (al > 0) & (al < 255)
    a[..., 3][haze & (hi < 70)] = 0
    a[..., 3][haze & (hi >= 70)] = 255
    return Image.fromarray(a, 'RGBA')

def to_pixels(im, height, scale=1, colors=48, max_w=N - 4):
    """Rebuild a cut as pixel art `height` px tall on screen (native grid = height/scale)."""
    im = levels(clear_haze(im))
    w, h = im.size
    nh = max(8, round(height / scale)); nw = max(4, round(w * nh / h))
    if nw * scale > max_w: nw = max_w // scale; nh = max(8, round(h * nw / w))
    a = np.asarray(im).astype(float); al = a[..., 3:] / 255
    pm = Image.fromarray(np.dstack([a[..., :3] * al, a[..., 3]]).clip(0, 255).astype(np.uint8), 'RGBA')
    up = nh > h * 1.05
    sm = np.asarray(pm.resize((nw, nh), Image.LANCZOS if up else Image.BOX)).astype(float)
    sa = sm[..., 3]; rgb = sm[..., :3] / np.maximum(sa[..., None] / 255, 1e-3)
    small = Image.fromarray(rgb.clip(0, 255).astype(np.uint8), 'RGB')
    small = small.filter(ImageFilter.UnsharpMask(radius=1.2 if up else 1, percent=120 if up else 80, threshold=2))
    on = sa > 120
    px = np.asarray(small)[on]
    if not len(px): return None
    pal = Image.fromarray(px.reshape(1, -1, 3), 'RGB').quantize(min(colors, len(px)), method=Image.MEDIANCUT)
    q = np.asarray(small.quantize(palette=pal, dither=Image.Dither.NONE).convert('RGB')).copy()
    on = clean_mask(on)
    q = despeckle(q, on)
    q, on = outline(q, on)
    q = rim(q, on)
    out = Image.fromarray(np.dstack([q, np.where(on, 255, 0).astype(np.uint8)]), 'RGBA')
    return out.resize((out.width * scale, out.height * scale), Image.NEAREST) if scale > 1 else out

def levels(im):
    """Stretch a dark or flat figure's tones so its forms read (2nd-98th percentile to full range,
    gently: dark looks lift, bright ones barely move)."""
    a = np.asarray(im).astype(float); on = a[..., 3] > 0
    if not on.any(): return im
    lum = a[..., :3].mean(2)[on]
    lo, hi = np.percentile(lum, 2), np.percentile(lum, 98)
    if hi - lo < 1: return im
    k = min(1.6, 235 / max(hi - lo, 1))
    rgb = (a[..., :3] - lo * 0.6) * k
    a[..., :3] = a[..., :3] * 0.45 + rgb * 0.55
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')

def despeckle(q, on, passes=2):
    """Pixel-art clean-up: a pixel that matches none of its four neighbours, while most of its eight
    neighbours share one colour, takes that colour. Kills dither noise, keeps real details."""
    q = q.copy(); H, W = on.shape
    for _ in range(passes):
        code = (q[..., 0].astype(np.int64) << 16) | (q[..., 1].astype(np.int64) << 8) | q[..., 2]
        code = np.where(on, code, -1)
        pad = np.pad(code, 1, constant_values=-1)
        nb = [pad[1 + dy:1 + dy + H, 1 + dx:1 + dx + W] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx]
        four = [pad[0:H, 1:W + 1], pad[2:H + 2, 1:W + 1], pad[1:H + 1, 0:W], pad[1:H + 1, 2:W + 2]]
        lone = on & np.all([f != code for f in four], axis=0)
        st = np.stack(nb, -1)
        for y, x in zip(*np.where(lone)):
            v = st[y, x]; v = v[v >= 0]
            if not len(v): continue
            vals, cnt = np.unique(v, return_counts=True)
            if cnt.max() >= 4:
                c = int(vals[cnt.argmax()]); q[y, x] = [(c >> 16) & 255, (c >> 8) & 255, c & 255]
    return q

def rim(q, on):
    """Light catches the top-left edge just inside the outline, so dark figures stay readable on
    a dark board (the way arcade sprites rim their silhouettes)."""
    edge = on & nd.binary_dilation(~on, structure=CROSS, border_value=1)
    inner = on & ~edge
    pad = np.pad(edge, 1)
    ul = pad[0:-2, 1:-1] | pad[1:-1, 0:-2]           # edge pixel directly above or left
    sel = inner & ul
    lum = q.mean(2)
    sel &= lum < 120
    q = q.copy().astype(float)
    q[sel] = q[sel] * 0.55 + np.array([196, 190, 236]) * 0.45
    return q.clip(0, 255).astype(np.uint8)

def clean_mask(on):
    """No orphan pixels, no one-pixel notches, no crumbs apart from the body."""
    nb = nd.convolve(on.astype(int), np.ones((3, 3), int), mode='constant') - on
    on = on & ~(nb <= 1)
    on = on | (~on & (nd.convolve(on.astype(int), np.array(CROSS), mode='constant') >= 3))
    lab, n = nd.label(on, structure=np.ones((3, 3)))
    if n > 1:
        sz = nd.sum(on, lab, range(1, n + 1))
        on = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s >= max(5, sz.max() * 0.015)])
    return on

def outline(q, on):
    """A closed one-pixel outline: the silhouette's edge pixels become an ink shade of the colour
    inside them (darker for light colours, so the read stays clean at a distance)."""
    edge = on & nd.binary_dilation(~on, structure=CROSS, border_value=1)
    lum = q.mean(2)
    src = q.astype(float)
    ink = (src * 0.28 + np.array([12, 8, 20]) * 0.72)
    light = edge & (lum > 55)
    q = q.copy(); q[light] = ink[light].astype(np.uint8)
    return q, on

def stand(im, cx=None, foot=FOOT):
    c = Image.new('RGBA', (N, N))
    x = (N - im.width) // 2 if cx is None else int(cx - im.width / 2)
    c.alpha_composite(im, (max(0, min(N - im.width, x)), max(0, foot + 1 - im.height)))
    return c

# ---- player looks -------------------------------------------------------------------------
LOOK_H = 118   # the tallest look (elf) fills the grid; others keep their sheet proportions

def look_frames(race, sex, hat):
    """Six action frames from behind, all at one scale so the figure doesn't pulse."""
    g = C.GROUPS.index((sex, hat))
    cuts = [S.cut('actions', C.act_box(race, g, f)) for f in range(6)]
    k = LOOK_H / 84.0                       # sheet figures are ~84 px at their tallest
    frames = [stand(to_pixels(c, round(c.height * k), colors=48)) for c in cuts]
    return frames

def look_front(race, sex, hat, dye=None):
    g = C.GROUPS.index((sex, hat))
    f = S.cut('turns', C.turn_box(race, g))
    if dye: f = recolor(f, *dye)
    return stand(to_pixels(f, round(f.height * 2.2 / 2) * 2, scale=2, colors=32))

# ---- units --------------------------------------------------------------------------------
UNITS = {   # (kind, source, height, dye=(from hue, to hue, width, sat, val), tint)
    # regular enemies
    'gloop': ('boss', 'great_slime', 100), 'gloopling': ('boss', 'great_slime', 70), 'wisp': ('boss', 'flame_titan', 108),
    'mite': ('boss', 'frost_colossus', 92), 'beetle': ('boss', 'toxic_queen', 96, (80, 52, 50, 1.15, 1.1)),
    'ram': ('boss', 'storm_bull', 108), 'shade': ('boss', 'deep_worm', 100), 'sprite': ('boss', 'sky_phantom', 100, (205, 45, 70, 0.8, 1.1)),
    'golem': ('boss', 'iron_forge', 116, (32, 44, 30, 0.75, 1.15)),
    'cultist': ('boss', 'living_scroll', 112, (40, 12, 60, 1.6, 1.0)), 'witch': ('boss', 'celestial_guardian', 112, (45, 200, 60, 1.1, 1.0)),
    'caller': ('front', ('human', 'm', True)), 'warden': ('front', ('ranger', 'f', True)),
    'paladin': ('boss', 'steel_sentinel', 112, None, 'gild'), 'knight': ('boss', 'steel_sentinel', 112, None, 'shadow'),
    # bosses
    'glacier': ('boss', 'divine_judge', 122, (45, 195, 70, 1.0, 1.0)), 'hollow': ('boss', 'void_lord', 122),
    'treant': ('boss', 'ancient_treant', 122), 'wyrm': ('boss', 'sand_worm', 120, (30, 12, 25, 1.25, 1.0)),
    'roc': ('boss', 'venom_wyvern', 122, (150, 55, 70, 1.1, 1.1)), 'rootnode': ('boss', 'wood_colossus', 104),
    'sapling': ('mon', 'treant', 72), 'clone': ('boss', 'void_lord', 96, None, 'dim'),
    # heroes fight on your side, so like the player they are seen from behind
    'hero_pyra': ('back', ('human', 'f', False), (215, 8, 45, 1.2, 1.05)), 'hero_ysolde': ('back', ('elf', 'f', True), (150, 195, 45, 0.9, 1.1)),
    'hero_volta': ('back', ('human', 'm', True)), 'hero_thornfather': ('back', ('shaman', 'm', False)),
    'hero_aurelion': ('boss', 'valiant', 122), 'hero_widow': ('boss', 'soul_reaper', 118, (260, 285, 60, 1.3, 1.1)),
}

def recolor(im, src, dst, width=40, sat=1.0, val=1.0):
    """Re-dye one hue family (degrees) to another, keeping each pixel's shading: e.g. a green
    necromancer robe into a fire cultist's red-orange. Greys, skin and gold trim stay put."""
    import colorsys
    a = np.asarray(im).astype(float) / 255; out = a.copy()
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = a[..., :3].max(2); mn = a[..., :3].min(2); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rr = m & (mx == r); gg = m & (mx == g) & ~rr; bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6; h[gg] = (b - r)[gg] / d[gg] + 2; h[bb] = (r - g)[bb] / d[bb] + 4
    h = h * 60; s_ = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    dist = np.abs((h - src + 180) % 360 - 180)
    sel = (a[..., 3] > 0) & (s_ > 0.18) & (dist < width)
    nh = (h + (dst - src)) % 360
    ns = np.clip(s_ * sat, 0, 1); nv = np.clip(mx * val, 0, 1)
    c = nv * ns; x = c * (1 - np.abs((nh / 60) % 2 - 1)); m0 = nv - c
    k = (nh // 60).astype(int) % 6
    tbl = [(c, x, 0 * c), (x, c, 0 * c), (0 * c, c, x), (0 * c, x, c), (x, 0 * c, c), (c, 0 * c, x)]
    for i, (R_, G_, B_) in enumerate(tbl):
        w = sel & (k == i)
        out[..., 0][w] = (R_ + m0)[w]; out[..., 1][w] = (G_ + m0)[w]; out[..., 2][w] = (B_ + m0)[w]
    return Image.fromarray((out * 255).clip(0, 255).astype(np.uint8), 'RGBA')

def boss_views(bid, height, dye=None):
    """The boss's four sheet views (front, back, 3/4 left, 3/4 right) at one scale."""
    for (y0, y1, panels), names in zip(C.BOSS_ROWS, C.BOSS_NAMES):
        if bid in names:
            x0, x1 = panels[names.index(bid)]
            bs = [b for b in S.blobs('bosses', (x0 + 4, y0, x1 - 4, y1), gap=1)
                  if b[3] - b[1] >= 40 and b[2] - b[0] > 12]
            front = C.boss(bid); k = height / front.height
            dy = (lambda im: recolor(im, *dye)) if dye else (lambda im: im)
            front = dy(front)
            out = [stand(to_pixels(front, height))]
            # later views: cut each from the panel's remaining width, left to right
            rest = [b for b in bs if b[0] > bs[0][0] + front.width * 0.6][:3]
            for b in rest:
                c = S.cut('bosses', (b[0] - 1, b[1] - 1, b[2] + 1, b[3] + 1))
                if c is not None and c.width < front.width * 1.25:
                    c = dy(c)
                    out.append(stand(to_pixels(c, round(c.height * k))))
            return out

def tint(im, how):
    """Whole-figure treatments: 'gild' turns steel to white-and-gold, 'shadow' to black iron with
    violet light, 'dim' darkens a figure into a lesser copy of itself."""
    a = np.asarray(im).astype(float); rgb = a[..., :3]; lum = rgb.mean(2, keepdims=True) / 255
    if how == 'gild':
        lo, hi = np.array([92, 62, 30]), np.array([255, 244, 200]); rgb = lo + (hi - lo) * lum ** 0.85
    elif how == 'shadow':
        lo, hi = np.array([14, 8, 24]), np.array([196, 150, 255]); rgb = lo + (hi - lo) * lum ** 1.35
    elif how == 'dim':
        rgb = rgb * 0.82 + np.array([14, 4, 30])
    a[..., :3] = rgb
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')

def unit(uid):
    kind, src, *rest = UNITS[uid]
    if kind == 'front': return [look_front(*src, dye=rest[0] if rest else None)]
    if kind == 'back':
        race, sex, hat = src; g = C.GROUPS.index((sex, hat)); c = S.cut('actions', C.act_box(race, g, C.CAST[g]))
        if rest: c = recolor(c, *rest[0])
        return [stand(to_pixels(c, round(c.height * LOOK_H / 84.0)))]
    if kind == 'mon': return [stand(to_pixels(C.monster(src), rest[0], scale=2, colors=32))]
    h = rest[0]; dye = rest[1] if len(rest) > 1 else None; how = rest[2] if len(rest) > 2 else None
    vs = boss_views(src, h, dye)
    return [tint(v, how) for v in vs] if how else vs

def idle(img, n=4):
    """A breathing idle made from one drawing: the body above the hips rises a pixel and settles,
    the way arcade sprites idle. Shows the sprite holds together when it moves."""
    a = np.asarray(img); on = a[..., 3] > 0
    ys = np.where(on.any(1))[0]
    if not len(ys): return [img] * n
    top, bot = ys.min(), ys.max(); hip = top + int((bot - top) * 0.55)
    frames = []
    for dy in (0, 1, 1, 0)[:n]:
        b = a.copy()
        if dy:
            b[top - dy:hip - dy] = a[top:hip]
        frames.append(Image.fromarray(b, 'RGBA'))
    return frames
