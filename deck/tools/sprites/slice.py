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
