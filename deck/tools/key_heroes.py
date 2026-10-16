"""Keys the green-screen hero sheets in deck/art/heroes/src to transparent PNGs in deck/art/heroes.
Removes pure chroma green anywhere (ground shadows and gaps between staff and body too); green
skin, robes and crystals carry red or blue, so they stay.
Run: python3 deck/tools/key_heroes.py"""
import os, numpy as np
from PIL import Image
from scipy import ndimage

D = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'art', 'heroes'))

def key(im):
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.maximum(r, b)
    dom = g - mx
    bg = (g > 100) & (mx * 100 < g * 45) & (dom > 80)
    # fringe: the 1 px ring around the background fades by how green it is and loses its green cast
    ring = ndimage.binary_dilation(bg) & ~bg
    alpha = np.where(bg, 0, 255)
    alpha = np.where(ring, np.clip((150 - dom) * 255 // 110, 0, 255), alpha)
    g2 = np.where((ring | bg) & (dom > 0), mx, g)
    out = np.dstack([r, g2, b, alpha]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

if __name__ == '__main__':
    for f in sorted(os.listdir(os.path.join(D, 'src'))):
        if f.endswith('.png'):
            key(Image.open(os.path.join(D, 'src', f))).save(os.path.join(D, f), optimize=True)
            print('keyed', f)
