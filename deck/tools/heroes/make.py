"""Rebuilds PLAYER_LOOKS in deck/sprites.js from the painted hero sheets in deck/art/heroes.
spec.py says which figure on which sheet is each look's front (camp) and its four back-view
poses (idle, walk, cast, attack); cut.py lifts a figure off its sheet. Frames are square with
the feet at 31/32 of the height and the figure filling the frame as much as the old sprite did,
so sizes in the game stay as they were. Pixels are never resampled.
Run: python3 deck/tools/heroes/make.py"""
import os, re, io, json, base64, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from spec import LOOKS
from cut import cut

DECK = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
PATH = os.path.join(DECK, 'sprites.js')

def dec(u): return Image.open(io.BytesIO(base64.b64decode(u.split(',', 1)[1]))).convert('RGBA')
def enc(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
def fill(im):
    bb = im.getbbox(); return (bb[3] - bb[1]) / im.height if bb else .7
def anchor(im):
    # the middle of the legs: the median opaque column in the lowest fifth of the figure
    a = np.asarray(im)[..., 3] > 24; h = a.shape[0]; ys, xs = np.nonzero(a[int(h * .8):])
    return float(np.median(xs)) if len(xs) else im.width / 2
def place(im, C):
    out = Image.new('RGBA', (C, C)); x = round(C / 2 - anchor(im)); y = C - round(C / 32) - im.height
    out.alpha_composite(im, (x, y)) if x >= 0 else out.paste(im, (x, y), im)
    return out, x, y
def tip(im, x, y, C):
    # the staff's focus: the middle of the figure's top few rows
    a = np.asarray(im)[..., 3] > 24; ys, xs = np.nonzero(a[:8])
    return [round((x + xs.mean()) / C, 3), round((y + 6) / C, 3)]
def frames(sheet, pts, r_front, r_back):
    ims = [cut(sheet, p, i == 0) for i, p in enumerate(pts)]
    f = ims[0]; Cf = round(f.height / r_front); front, *_ = place(f, max(Cf, f.width + 2))
    poses = ims[1:]; C = max(round(max(p.height for p in poses) / r_back), max(p.width for p in poses) + 2)
    placed = [place(p, C) for p in poses]
    strip = Image.new('RGBA', (C * 4, C))
    for i, (im, *_) in enumerate(placed): strip.alpha_composite(im, (i * C, 0))
    tips = [tip(p, x, y, C) for p, (_, x, y) in zip(poses, placed)]
    return front, placed[0][0], strip, tips, C

src = open(PATH).read()
head, rest = src.split('const PLAYER_LOOKS={', 1)
body, tail = rest.split('\n};', 1)
old = dict(re.findall(r"\n  ([a-z_]+):\{(.*?)\},?(?=\n)", body, re.S))
lines = []
for id, L in LOOKS.items():
    ob = old.get(id) or old['wizard']
    rf = fill(dec(re.search(r"front:'(data:[^']+)'", ob).group(1)))
    rb = fill(dec(re.search(r"back:'(data:[^']+)'", ob).group(1)))
    front, back, anim, tips, C = frames(*L['hat'], rf, rb)
    e = dict(front=enc(front), back=enc(back), anim=enc(anim))
    if 'bare' in L:
        fb, bb, ab, tb, Cb = frames(*L['bare'], rf, rb)
        e.update(frontBare=enc(fb), backBare=enc(bb), animBare=enc(ab))
    q = lambda s: "'" + s + "'"
    parts = ["name:" + q(L['name']), "gender:" + q(L['gender']), "front:" + q(e['front']), "back:" + q(e['back'])]
    if 'bare' in L: parts += ["frontBare:" + q(e['frontBare']), "backBare:" + q(e['backBare'])]
    parts += ["tip:null", "tipBack:" + json.dumps(tips[0]), "anim:" + q(e['anim'])]
    if 'bare' in L: parts += ["animBare:" + q(e['animBare'])]
    parts += ["tips:" + json.dumps(tips)]
    if 'bare' in L: parts += ["tipsBare:" + json.dumps(tb)]
    lines.append("  %s:{%s}," % (id, ', '.join(parts))); print(id, C)
open(PATH, 'w').write(head + 'const PLAYER_LOOKS={\n' + '\n'.join(lines) + '\n};' + tail)
