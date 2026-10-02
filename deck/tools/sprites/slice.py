"""Cuts sprites out of the generated reference sheets (deck/art/sheets/*.png): finds each figure
on the dark navy background, keys the background out and trims it. Used by export.py."""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

HERE = os.path.dirname(__file__)
SHEETS = os.path.join(HERE, '..', '..', 'art', 'sheets')
_cache = {}

def sheet(name):
    if name not in _cache:
        _cache[name] = np.asarray(Image.open(os.path.join(SHEETS, name + '.png')).convert('RGB')).astype(np.int16)
    return _cache[name]

def mask_of(a, thr=34):
    m = a.max(2) > thr
    m = nd.binary_closing(m, iterations=1)
    m = nd.binary_fill_holes(m)
    return m

def blobs(name, box, thr=34, min_px=60, gap=3):
    """Figures inside box=(x0,y0,x1,y1), left to right, as boxes in sheet coordinates.
    Pieces closer than `gap` px horizontally that overlap vertically are merged (staff glows, sparks)."""
    x0, y0, x1, y1 = box
    a = sheet(name)[y0:y1, x0:x1]
    m = mask_of(a, thr)
    lab, n = nd.label(nd.binary_dilation(m, iterations=gap))
    out = []
    for i, sl in enumerate(nd.find_objects(lab)):
        if sl is None: continue
        cnt = (m[sl] & (lab[sl] == i + 1)).sum()
        if cnt < min_px: continue
        out.append([sl[1].start + x0, sl[0].start + y0, sl[1].stop + x0, sl[0].stop + y0, cnt])
    out.sort(key=lambda b: b[0])
    return out

def cut(name, box, thr=34, keep_largest=True):
    """RGBA image of the figure in box, background keyed out."""
    x0, y0, x1, y1 = box
    a = sheet(name)[y0:y1, x0:x1]
    hi = a.max(2)
    m = mask_of(a, thr)
    if keep_largest:
        lab, n = nd.label(nd.binary_dilation(m, iterations=2))
        if n > 1:
            sizes = nd.sum(m, lab, range(1, n + 1))
            big = sizes.max()
            obj = nd.find_objects(lab)
            keep = [i + 1 for i, s in enumerate(sizes) if s >= max(12, big * 0.06)
                    and obj[i][0].stop - obj[i][0].start > 8 and obj[i][1].stop - obj[i][1].start > 8]
            m &= np.isin(lab, keep)
    # outline ring: the dark pixels hugging the figure belong to it
    ring = nd.binary_dilation(m, iterations=1) & ~m & (hi > 24)
    full = m | ring
    alpha = np.where(m, 255, np.where(ring, 200, 0)).astype(np.uint8)
    # faint glow haze fades instead of cutting hard
    core = m & (hi >= 60)
    haze = m & ~nd.binary_dilation(core, iterations=1) & (hi < 60)
    alpha[haze] = np.clip((hi[haze] - 30) * 5, 0, 180)
    rgba = np.dstack([np.clip(a, 0, 255).astype(np.uint8), alpha])
    ys, xs = np.where(full)
    if not len(ys): return None
    return Image.fromarray(rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 'RGBA')

def fit(im, size=96, height=None, foot=93, cx=None):
    """Place a cut figure on a size x size canvas with its feet on row `foot`, scaled so it is
    `height` px tall (or as large as fits)."""
    w, h = im.size
    if height is None: height = h
    k = min(height / h, (size - 2) / w, (foot + 1) / h)
    nw, nh = max(1, round(w * k)), max(1, round(h * k))
    r = im.resize((nw, nh), Image.LANCZOS) if k != 1 else im
    # re-harden alpha after resampling so edges stay crisp
    a = np.asarray(r).copy(); al = a[..., 3]
    a[..., 3] = np.where(al > 150, 255, np.where(al > 60, al, 0))
    # drop dark crumbs left by resampling: specks and thin dark slivers apart from the figure
    solid = (a[..., 3] > 0) & (a[..., :3].max(2) > 40)
    lab, n = nd.label(nd.binary_dilation(solid, iterations=1))
    if n:
        sz = nd.sum(solid, lab, range(1, n + 1)); keep = np.isin(lab, [i + 1 for i, v in enumerate(sz) if v >= max(6, sz.max() * 0.03)])
        a[..., 3][~keep] = 0
    r = Image.fromarray(a, 'RGBA')
    c = Image.new('RGBA', (size, size))
    x = (size - nw) // 2 if cx is None else int(cx - nw / 2)
    c.alpha_composite(r, (max(0, min(size - nw, x)), foot + 1 - nh))
    return c, k

def pixelate(im, height, scale=2, colors=40, size=96, foot=93):
    """Turn a soft, painted-looking cut into crisp pixel art: shrink it to its native pixel grid
    (height/scale px tall), sharpen, snap to a small palette, harden alpha, outline the light
    edges, then blow it up `scale`x with nearest neighbour and stand it on the canvas."""
    from PIL import ImageFilter
    w, h = im.size
    nh = max(8, round(height / scale)); nw = max(4, round(w * nh / h))
    if nw * scale > size - 2: nw = (size - 2) // scale; nh = max(8, round(h * nw / w))
    # premultiplied shrink so the dark background doesn't bleed into edge colours
    a = np.asarray(im).astype(float); al = a[..., 3:] / 255
    pm = Image.fromarray(np.dstack([a[..., :3] * al, a[..., 3]]).clip(0, 255).astype(np.uint8), 'RGBA')
    sm = np.asarray(pm.resize((nw, nh), Image.BOX)).astype(float)
    sa = sm[..., 3]; rgb = sm[..., :3] / np.maximum(sa[..., None] / 255, 1e-3)
    small = Image.fromarray(rgb.clip(0, 255).astype(np.uint8), 'RGB').filter(ImageFilter.UnsharpMask(radius=1, percent=90, threshold=2))
    on = sa > 110
    # palette from the figure's own pixels only
    px = np.asarray(small)[on]
    if len(px) == 0: return Image.new('RGBA', (size, size))
    pal_img = Image.fromarray(px.reshape(1, -1, 3), 'RGB').quantize(min(colors, len(px)), method=Image.MEDIANCUT)
    q = np.asarray(small.quantize(palette=pal_img, dither=Image.Dither.NONE).convert('RGB')).copy()
    alpha = np.where(on, 255, 0).astype(np.uint8)
    # drop lone pixels hanging off the silhouette
    nb = nd.convolve(on.astype(int), np.ones((3, 3), int), mode='constant') - on
    alpha[on & (nb <= 1)] = 0; on = alpha > 0
    # one-pixel outline where a light pixel meets the background
    lum = q.mean(2)
    ring = nd.binary_dilation(on, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]]) & ~on
    edge = on & nd.binary_dilation(~on, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]])
    lit_edge = edge & (lum > 70)
    need = ring & nd.binary_dilation(lit_edge, structure=[[0, 1, 0], [1, 1, 1], [0, 1, 0]])
    if need.any():
        # darkest-neighbour shade, pushed toward ink
        src = np.where(on[..., None], q, 255).astype(float)
        dk = np.stack([nd.grey_erosion(src[..., c], size=3) for c in range(3)], -1)
        ink = (dk * 0.3 + np.array([11, 7, 16]) * 0.7).astype(np.uint8)
        q[need] = ink[need]; alpha[need] = 255
    small = Image.fromarray(np.dstack([q, alpha]), 'RGBA')
    big = small.resize((small.width * scale, small.height * scale), Image.NEAREST)
    c = Image.new('RGBA', (size, size))
    x = (size - big.width) // 2 // scale * scale
    y = foot + 1 - big.height
    y = y // scale * scale + (foot + 1) % scale
    c.alpha_composite(big, (max(0, x), max(0, y)))
    return c
