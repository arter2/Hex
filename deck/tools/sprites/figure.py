"""Hexmancer bodies on the rig: a skeleton per race (elves tall and slim, dwarves short and
broad, orcs heavy), dressed in coat or robe, sleeves, trousers, boots and belt, with a
hand-placed face, hair, an optional hat, a staff in one hand and a spell in the other.
Arms are tubes from the shoulder through the elbow to the hand, so they always join the body.
Coordinates are pixels on a 96 x 96 canvas; the feet stand on row 93."""
import math
from rig import Sprite, mix

SIZE = 96
GROUND = 93

# race and sex proportions, in pixels: total height, head (w, h), half shoulder width,
# half hip width, hip height above the ground, limb radius
BUILD = {
    ('human', 'm'): dict(height=62, head=(14, 16), sw=8.5, hip=5.5, leg=29, arm=2.3, leg_r=2.6),
    ('human', 'f'): dict(height=60, head=(13, 15), sw=7.0, hip=6.0, leg=29, arm=2.0, leg_r=2.4),
    ('elf', 'm'):   dict(height=74, head=(13, 16), sw=6.0, hip=4.2, leg=38, arm=1.8, leg_r=2.0),
    ('elf', 'f'):   dict(height=72, head=(12, 15), sw=5.4, hip=4.6, leg=38, arm=1.6, leg_r=1.9),
    ('dwarf', 'm'): dict(height=46, head=(15, 15), sw=10.0, hip=7.0, leg=15, arm=3.0, leg_r=3.0),
    ('dwarf', 'f'): dict(height=44, head=(15, 14), sw=8.5, hip=7.0, leg=15, arm=2.6, leg_r=2.8),
    ('orc', 'm'):   dict(height=64, head=(16, 16), sw=13.0, hip=8.0, leg=27, arm=3.6, leg_r=3.4, neck=5),
    ('orc', 'f'):   dict(height=61, head=(14, 15), sw=10.0, hip=7.0, leg=28, arm=2.9, leg_r=2.8, neck=4),
}

def fold(s, part, x0, y0, x1, y1, w1=3.0, tone=2):
    """A cloth fold falling from (x0, y0) to (x1, y1): one solid shadow wedge that widens to w1 px
    at the hem, with a darker core only where it is deepest, near the bottom."""
    n = max(1, int(round(y1 - y0)))
    for k in range(n):
        t = k / n; y = int(round(y0 + k)); xs = int(round(x0 + (x1 - x0) * t)); w = max(1, int(round(1 + (w1 - 1) * t ** 0.8)))
        s.tone(part, [(xs + i, y) for i in range(w)], tone)
        if t > 0.72 and w > 2: s.tone(part, [(xs + w // 2, y)], tone - 1)
        if 0.12 < t < 0.85: s.tone(part, [(xs - 1, y)], 4)

def bottom_band(mask, rows=2):
    """The lowest pixels of a mask in each column, for hem bands and brim edges."""
    import numpy as np
    out = np.zeros_like(mask)
    for x in range(mask.shape[1]):
        ys = np.nonzero(mask[:, x])[0]
        if len(ys): out[max(ys.max() - rows + 1, 0):ys.max() + 1, x] = mask[max(ys.max() - rows + 1, 0):ys.max() + 1, x]
    return out

class Body:
    """Joint positions. x grows to the viewer's right; the figure turns a little to the right,
    holding a staff in the hand on that side and a spell in the other."""
    def __init__(self, race, sex, cx=44, pose='staff'):
        b = BUILD[(race, sex)]; self.b = b; self.race, self.sex = race, sex
        self.cx = cx; g = GROUND
        hw, hh = b['head']; self.hw, self.hh = hw, hh
        self.top = g - b['height']
        self.head = (cx + 0.5, self.top + hh / 2)
        self.chin = self.top + hh
        self.sy = self.chin + 2.5                                  # shoulder line
        self.hy = g - b['leg']                                    # hip line
        self.wy = self.sy + (self.hy - self.sy) * 0.6             # waist
        sw = b['sw']; self.sw = sw
        self.shL = (cx - sw + 1.5, self.sy + 1.5); self.shR = (cx + sw - 0.5, self.sy + 1.2)
        hp = b['hip']
        self.hipL = (cx - hp + 2.6, self.hy); self.hipR = (cx + hp - 1.6, self.hy)
        self.footL = (cx - hp + 1.5, g - 1); self.footR = (cx + hp + 1.0, g - 1)
        ky = self.hy + (g - self.hy) * 0.48
        self.kneeL = (self.hipL[0] - 0.6, ky); self.kneeR = (self.hipR[0] + 1.2, ky)
        ua = (self.hy - self.sy) * 0.62 + 1                         # upper arm length
        fa = ua * 0.9
        # staff arm (viewer's right): elbow out and down, forearm up to grip the staff at the chest
        self.elR = (self.shR[0] + 2.0, self.shR[1] + ua)
        self.haR = (self.shR[0] + 4.5, self.shR[1] + ua - fa * 0.25)
        # spell arm (viewer's left): elbow down at the side, forearm out, palm up
        self.elL = (self.shL[0] - 2.0, self.shL[1] + ua)
        self.haL = (self.shL[0] - 6.5, self.shL[1] + ua - 1.0)
        if pose == 'high':
            # the spell held up at shoulder height
            self.elL = (self.shL[0] - 4.0, self.shL[1] + ua * 0.75); self.haL = (self.shL[0] - 6.5, self.shL[1] - 1.0)
        if pose == 'low':
            self.elL = (self.shL[0] - 2.5, self.shL[1] + ua); self.haL = (self.shL[0] - 5.5, self.shL[1] + ua + 3.5)
        if pose == 'rest':
            self.elL = (self.shL[0] - 1.5, self.shL[1] + ua); self.haL = (self.shL[0] - 1.8, self.shL[1] + ua + fa)

def dress(s, B, o, view):
    cx, sy, wy, hy, g = B.cx, B.sy, B.wy, B.hy, GROUND
    b = B.b; back = view == 'back'; style = o.get('outfit', 'coat')
    lr = b['leg_r']
    # ---- legs, trousers and boots ----
    for side, (hp, kn, ft) in (('L', (B.hipL, B.kneeL, B.footL)), ('R', (B.hipR, B.kneeR, B.footR))):
        near = side == 'R'
        lg = s.part('leg' + side, 'pants', z=1.5 if near else 1, R=lr)
        lg.capsule(hp, kn, lr + 0.4, lr).capsule(kn, (ft[0], ft[1] - 3), lr, lr * 0.85)
        bt = s.part('boot' + side, 'boot', z=2.5 if near else 2, R=lr)
        top = ft[1] - o.get('boot_h', 8)
        bt.capsule((ft[0] - 0.2, top), (ft[0], ft[1] - 2.5), lr * 1.05, lr * 1.0)
        toe = 3.5 if near else 2.0
        bt.poly([(ft[0] - lr - 0.4, ft[1] - 3.5), (ft[0] + lr + toe - 1, ft[1] - 3), (ft[0] + lr + toe + 0.4, ft[1] - 0.5), (ft[0] + lr + toe, ft[1] + 0.6), (ft[0] - lr - 0.4, ft[1] + 0.6)])
        cf = s.part('bcuff' + side, 'boot2', z=bt.z + 0.1, R=1.2)
        cf.poly([(ft[0] - lr - 0.8, top - 1), (ft[0] + lr + 0.8, top - 1.5), (ft[0] + lr + 0.9, top + 1.2), (ft[0] - lr - 0.9, top + 1.6)])
        s.tone('boot' + side, [(int(ft[0] + lr + toe - 1), int(ft[1] - 2))], 4)
    # ---- cape behind the body (over it, seen from the back) ----
    if o.get('cape'):
        cp = s.part('cape', 'cape', z=-3 if not back else 9, line=1, R=8, form='cloth')
        cw = b['sw'] + 3.5; ch = o.get('cape_len', g - 4)
        cp.poly([(B.shL[0] - 2, sy - 1), (B.shR[0] + 2, sy - 1.5), (cx + cw + 3, ch - 4), (cx + cw + 1, ch), (cx + 5, ch - 2), (cx, ch + 0.5),
                 (cx - 5, ch - 1.5), (cx - cw - 1, ch + 0.5), (cx - cw - 3, ch - 3)])
        if back:
            for fx, f0 in ((cx - 4, sy + 9), (cx + 3, sy + 12), (cx - 9, sy + 18), (cx + 8, sy + 16)):
                s.tone('cape', [(int(fx + (y - f0) * 0.12), y) for y in range(int(f0), int(ch - 1))], 2)
                s.tone('cape', [(int(fx + 1 + (y - f0) * 0.12), y) for y in range(int(f0 + 2), int(ch - 2))], 4)
    # ---- torso ----
    t = s.part('torso', 'robe', z=4, R=6, form='cloth')
    ch = 1.2 if B.sex == 'f' else 0
    t.poly([(B.shL[0] - 1.5, sy + 1.5), (cx - 3, sy - 1), (cx + 3, sy - 1.2), (B.shR[0] + 1.5, sy + 1),
            (cx + b['hip'] + 0.6, wy), (cx + b['hip'] + 1.2, hy), (cx - b['hip'] - 0.4, hy), (cx - b['hip'] + 0.6, wy)])
    t.ellipse(B.shL[0], sy + 2.6, b['arm'] + 1.8, b['arm'] + 1.4).ellipse(B.shR[0], sy + 2.3, b['arm'] + 2.0, b['arm'] + 1.4)
    if ch and not back:
        t.ellipse(cx - 1, sy + 5, 4.5, 3.2).ellipse(cx + 3.5, sy + 5, 4, 3)
    # ---- the coat's skirt: a long coat opening in a V over the legs, a short coat, or a closed robe ----
    hem = o.get('hem', None)
    if style in ('coat', 'jacket'):
        hem = hem or (g - 6 if style == 'coat' else B.kneeL[1] - 2)
        fl = o.get('flare', 4 if style == 'coat' else 2.5)
        cs = s.part('coat', 'robe', z=4.2, R=7, line=0, form='cloth')
        cs.poly([(cx - b['hip'] - 0.5, wy - 1), (cx + b['hip'] + 1.5, wy - 1), (cx + b['hip'] + fl + 2, hem - 1.5), (cx + b['hip'] + fl + 0.5, hem + 0.8),
                 (cx - b['hip'] - fl + 0.5, hem + 0.8), (cx - b['hip'] - fl - 1, hem - 1.5)])
        if not back:
            op = [(cx + 1.0, wy + 1), (cx + 2.2, wy + 1), (cx + 2.2 + fl * 0.9 + 1.5, hem + 2), (cx + 1 - fl * 0.6 - 1.5, hem + 2)]
            cs.poly(op, erase=True)
            # trim down both edges of the opening and along the hem
            tl = s.part('trimL', 'trim', z=4.5, R=1, line=0)
            tl.curve([(cx + 0.6, wy + 1), (cx - 0.6, (wy + hem) / 2 + 2), (op[3][0] - 0.2, hem)], 0.75, 0.75).clip(cs)
            tr = s.part('trimR', 'trim', z=4.5, R=1, line=0)
            tr.curve([(cx + 2.6, wy + 1), (cx + 4.4, (wy + hem) / 2 - 1), (op[2][0] + 0.2, hem)], 0.75, 0.75).clip(cs)
        # the hem dips under each fold and rises between them
        folds = [(cx - 3, wy + 3, cx - 6, hem, 3.0), (cx + 6, wy + 4, cx + 8.5, hem, 2.5)] if not back else \
                [(cx - 4, wy + 2, cx - 6.5, hem, 3.5), (cx + 3, wy + 3, cx + 4.5, hem, 3.0)]
        for (x0, y0, x1, y1, w) in folds:
            if style == 'coat': cs.ellipse(x1 + 1, hem + 1.2, 2.2, 1.2)    # the hem bulges a little under each fold
        hb = s.part('hemband', 'trim', z=4.4, R=1, line=0)
        hb.mask |= bottom_band(cs.mask, 2)
        for (x0, y0, x1, y1, w) in folds: fold(s, 'coat', x0, y0, x1, y1 - 1, w)
    else:
        hem = hem or (g - 4)
        fl = o.get('flare', 6)
        sk = s.part('skirt', 'robe', z=4.2, R=8, line=0, form='cloth')
        sk.poly([(cx - b['hip'] - 0.6, wy), (cx + b['hip'] + 1.4, wy), (cx + b['hip'] + fl + 1.5, hem - 1), (cx + b['hip'] + fl, hem + 0.6),
                 (cx + 3, hem + 1.4), (cx - 2, hem + 0.6), (cx - b['hip'] - fl + 0.5, hem + 1.2), (cx - b['hip'] - fl - 0.5, hem - 1.2)])
        if o.get('slit') and not back:
            s.part('slit', 'under', z=4.4, R=3, line=1).poly([(cx + 3, wy + 6), (cx + 4, wy + 6), (cx + 7.5, hem + 0.8), (cx + 1.5, hem + 1.2)])
        for (x0, y0, x1, w) in ((cx - 3, wy + 3, cx - 6.5, 3.5), (cx + 3.5, wy + 5, cx + 6, 3.0)):
            fold(s, 'skirt', x0, y0, x1, hem, w)
        if o.get('hem_band', True):
            s.part('hemband', 'trim', z=4.4, R=1, line=0).mask |= bottom_band(sk.mask, 2)
    if not back and o.get('vest', True):
        v = s.part('vest', 'under', z=4.6, R=2.5, line=1)
        v.poly([(cx - 1.5, sy - 0.5), (cx + 3.5, sy - 0.5), (cx + 2.5, wy), (cx + 0.5, wy)])
    bl = s.part('belt', 'belt', z=7, R=1.5, cast=1)
    bw = b['hip'] + 1.6
    bl.poly([(cx - bw + 0.6, wy - 1.4), (cx + bw + 1.2, wy - 1.8), (cx + bw + 1.3, wy + 1.0), (cx - bw + 0.5, wy + 1.4)])
    if not back:
        s.part('buckle', 'gold', z=8, shine=1, R=1.2).rect(int(cx + 1), int(wy - 2), int(cx + 3), int(wy + 1))
        s.paint([(int(cx + 2), int(wy - 1))], s.mats['belt'][1])
        if o.get('pouch'):
            s.part('pouch', 'leather', z=8, R=2.2).poly([(cx - bw + 1, wy + 1), (cx - bw + 4.5, wy + 1), (cx - bw + 4.8, wy + 6), (cx - bw + 1.2, wy + 6.5)])
            s.part('flap', 'leather', z=8.1, R=1).poly([(cx - bw + 0.8, wy + 0.8), (cx - bw + 4.8, wy + 0.8), (cx - bw + 4.6, wy + 3), (cx - bw + 1, wy + 3.2)])
    nk = b.get('neck', 2)
    s.part('neck', 'skin', z=3, R=2).rect(int(cx - nk), int(B.chin - 3), int(cx + nk + 0.5), int(sy + 1))
    s.tone('neck', [(x, int(B.chin)) for x in range(int(cx - 2), int(cx + 3))], 1)
    s.tone('neck', [(x, int(B.chin) + 1) for x in range(int(cx - 2), int(cx + 1))], 2)
    if o.get('plate'):
        pt = s.part('plate', 'iron', z=4.8, shine=1, R=5)
        pt.poly([(B.shL[0], sy + 1), (B.shR[0], sy + 1), (cx + b['hip'] + 1, wy), (cx - b['hip'], wy)])
        s.tone('plate', [(int(cx + 1), y) for y in range(int(sy + 2), int(wy))], 4)
        for d, sh_ in ((-1, B.shL), (1, B.shR)):
            s.part('pauldron%d' % d, 'iron', z=12.7 if d > 0 else 11.7, shine=1, R=3).ellipse(sh_[0] + d * 0.5, sh_[1], b['arm'] + 3, b['arm'] + 2.2)
            s.part('ptrim%d' % d, 'gold', z=12.75 if d > 0 else 11.75, shine=1, R=1, line=0).rect(int(sh_[0] - b['arm'] - 2), int(sh_[1] + b['arm'] + 1), int(sh_[0] + b['arm'] + 3), int(sh_[1] + b['arm'] + 1))
    if o.get('cowl'):
        cw_ = s.part('cowl', 'cloth', z=12.9 if not back else 13.6, R=3.5, cast=1)
        cw_.poly([(cx - b['sw'] + 1, sy + 1), (cx - 3, B.chin - 3), (cx + 4, B.chin - 3), (cx + b['sw'], sy + 1), (cx + 6, sy + 5), (cx + 1, sy + 6.5), (cx - 4, sy + 5)])
        if not back: cw_.ellipse(cx + 1, B.chin, 3.2, 2.5, erase=True)
        s.tone('cowl', [(int(cx - 3 + k), int(sy + 3)) for k in range(0, 8, 3)], 2)
    if back:
        s.tone('torso', [(int(cx + 1), y) for y in range(int(sy + 2), int(wy))], 2)
        for d in (-1, 1): s.tone('torso', [(int(cx + d * 4 + k * d * 0.4), int(sy + 4 + k)) for k in range(4)], 2)
    if o.get('capelet') and (not back or o.get('mantle_back')):
        c = s.part('capelet', 'cloth', z=10, R=4.5, cast=1)
        c.poly([(B.shL[0] - b['arm'] - 2, sy + 6), (B.shL[0] - 1.5, sy - 0.5), (cx - 2.5, sy - 0.8), (cx - 0.5, sy + 1.5), (cx + 2.5, sy + 1.5), (cx + 4.5, sy - 0.8), (B.shR[0] + 1.5, sy - 0.2),
                (B.shR[0] + b['arm'] + 2.5, sy + 5.5), (cx + 6, sy + 7.5), (cx + 1.5, sy + 9.5), (cx - 4, sy + 8)])
        if o.get('fur'):
            for x in range(int(B.shL[0] - b['arm'] - 2), int(B.shR[0] + b['arm'] + 3), 2):
                ys = [y for y in range(s.h) if c.mask[y, x]]
                if ys: c.px([(x, max(ys) + 1), (x, max(ys) + 2)] if (x // 2) % 2 else [(x, max(ys))], erase=not (x // 2) % 2)
            for x in range(int(B.shL[0] - 1), int(B.shR[0] + 3), 3):
                s.tone('capelet', [(x, int(sy + 2)), (x + 1, int(sy + 3))], 4); s.tone('capelet', [(x + 1, int(sy + 5)), (x, int(sy + 6))], 2)
        # scalloped lower edge: notches between the drapes
        for x in (range(int(B.shL[0] - 2), int(B.shR[0] + 4), 4) if not o.get('fur') else []):
            ys = [y for y in range(s.h) if c.mask[y, x]]
            if ys: c.px([(x, max(ys))], erase=True); s.tone('capelet', [(x, max(ys) - 1), (x, max(ys) - 2)], 2); s.tone('capelet', [(x - 1, max(ys) - 2)], 4)
        if not back: s.part('clasp', 'gold', z=10.5, shine=1, R=1).ellipse(cx + 1.5, sy + 1.6, 1.3, 1.3)
        elif o.get('hat') != 'hood':
            # the hood, down, lying on the upper back
            hb = s.part('hoodback', 'cloth', z=10.2, R=3.5, line=3, cast=1)
            hb.poly([(cx - 5.5, sy - 1.5), (cx + 6.5, sy - 1.5), (cx + 5.5, sy + 7), (cx + 0.5, sy + 11), (cx - 4.5, sy + 7)])
            s.tone('hoodback', [(int(cx + 0.5 + k * 0.1), int(sy + k)) for k in range(1, 8)], 1)
    arm(s, B, 'L', o, back); arm(s, B, 'R', o, back)

def arm(s, B, side, o, back):
    b = B.b; r = b['arm']
    sh, el, ha = (B.shL, B.elL, B.haL) if side == 'L' else (B.shR, B.elR, B.haR)
    z = 12 if side == 'R' else 11
    up = s.part('upper' + side, 'robe', z=z, R=r + 0.6, line=3)
    up.capsule(sh, el, r + 0.9, r + 0.5)
    fo = s.part('fore' + side, 'robe', z=z + 0.2, R=r + 0.5, line=3)
    dx, dy = ha[0] - el[0], ha[1] - el[1]; L = math.hypot(dx, dy) or 1; ux, uy = dx / L, dy / L
    wr = (ha[0] - ux * 1.8, ha[1] - uy * 1.8)
    if o.get('sleeve', 'bell') == 'bell':
        fo.capsule(el, wr, r + 0.5, r + 1.2)
        cuff = s.part('cuff' + side, 'trim', z=z + 0.3, R=1.2, line=1)
        cuff.capsule((wr[0] - ux * 1.0, wr[1] - uy * 1.0), wr, r + 1.3, r + 1.3).clip(fo)
    else:
        fo.capsule(el, wr, r + 0.4, r + 0.1)
        cuff = s.part('cuff' + side, 'trim', z=z + 0.3, R=1, line=1)
        cuff.capsule((wr[0] - ux * 1.2, wr[1] - uy * 1.2), wr, r + 0.7, r + 0.7)
    hd = s.part('hand' + side, 'skin', z=z + 0.6, R=1.8)
    X, Y = int(round(ha[0])), int(round(ha[1]))
    if side == 'R' and o.get('staff', 'crescent'):
        # a fist around the staff: three finger bands across the front, the thumb on top
        hd.rect(X - 2, Y - 2, X + 1, Y + 2).px([(X + 2, Y - 1), (X + 2, Y), (X + 2, Y + 1), (X - 3, Y - 1), (X - 3, Y)])
        s.tone('hand' + side, [(X - 1, Y - 1), (X, Y - 1), (X + 1, Y - 1), (X - 1, Y + 1), (X, Y + 1), (X + 1, Y + 1)], 1)
        s.tone('hand' + side, [(X + 2, Y - 1), (X + 2, Y + 1)], 1)
        s.tone('hand' + side, [(X - 2, Y - 2), (X - 1, Y - 2)], 4); s.tone('hand' + side, [(X - 3, Y - 1)], 4)
        if back: s.tone('hand' + side, [(X - 2, Y), (X - 1, Y), (X, Y), (X + 1, Y)], 2)
    elif side == 'L' and o.get('off', 'orb') in ('orb', 'flame'):
        # an open palm, fingers curling up at the tips
        hd.rect(X - 2, Y - 1, X + 2, Y + 1).px([(X - 3, Y - 2), (X - 3, Y - 1), (X - 2, Y - 2), (X + 1, Y + 2), (X, Y + 2), (X - 1, Y + 2)])
        s.tone('hand' + side, [(X - 2, Y), (X - 1, Y), (X, Y)], 4)
        s.tone('hand' + side, [(X - 1, Y + 2), (X, Y + 2), (X + 1, Y + 2), (X + 2, Y + 1)], 2)
        s.tone('hand' + side, [(X - 2, Y - 1)], 1)
        if back: s.tone('hand' + side, [(X - 1, Y), (X, Y), (X + 1, Y), (X - 2, Y)], 2)
    else:
        hd.ellipse(ha[0], ha[1], r * 0.55 + 1.5, r * 0.55 + 1.6)
        s.tone('hand' + side, [(X - 1, Y + 1), (X, Y + 1)], 2)

# ---------------------------------------------------------------- heads
def head(s, B, o, view):
    ex, ey = B.head; hw, hh = B.hw, B.hh; back = view == 'back'; race, sex = B.race, B.sex
    h = s.part('head', 'skin', z=13, R=hw * 0.6, bulge=0.55, flat=0.06)
    h.ellipse(ex, ey - 0.6, hw / 2, hh / 2 - 0.6)
    jaw = 1.6 if race in ('orc', 'dwarf') and sex == 'm' else 0.5
    h.poly([(ex - hw / 2 + 0.8, ey), (ex + hw / 2, ey - 0.5), (ex + hw / 2 - 0.2 + jaw * 0.4, ey + hh / 2 - 2.5), (ex + 2.5, ey + hh / 2 + 0.3),
            (ex - 0.5, ey + hh / 2 + 0.3), (ex - hw / 2 + 2.0 - jaw * 0.6, ey + hh / 2 - 2.5)])
    ear = s.part('ear', 'skin', z=12.8 if not back else (14.6 if race in ('elf', 'orc') else 14.05), R=1.4)
    exl = ex - hw / 2 + 1.2
    if race == 'elf':
        ear.poly([(exl + 1.5, ey - 0.5), (exl - 7.5, ey - 6.5), (exl - 5.5, ey - 3.5), (exl - 1.5, ey + 2.5), (exl + 1.5, ey + 2.5)])
    elif race == 'orc':
        ear.poly([(exl + 1, ey - 1), (exl - 4.5, ey - 3.5), (exl - 2.5, ey + 1), (exl - 0.5, ey + 3), (exl + 1, ey + 3)])
    elif back:
        ear.ellipse(exl - 0.3, ey + 1.5, 1.3, 1.9)
    else:
        ear.ellipse(exl - 0.3, ey + 1, 1.9, 2.5)
    if back:
        ear2 = s.part('ear2', 'skin', z=14.6 if race in ('elf', 'orc') else 14.05, R=1.4)
        exr = ex + hw / 2 - 1.0
        if race == 'elf': ear2.poly([(exr - 1.5, ey - 0.5), (exr + 7.5, ey - 6.5), (exr + 5.5, ey - 3.5), (exr + 1.5, ey + 2.5), (exr - 1.5, ey + 2.5)])
        elif race == 'orc': ear2.poly([(exr - 1, ey - 1), (exr + 4.5, ey - 3.5), (exr + 2.5, ey + 1), (exr + 0.5, ey + 3), (exr - 1, ey + 3)])
        else: ear2.ellipse(exr + 0.3, ey + 1.5, 1.3, 1.9)
    hair(s, B, o, view)

def face(s, B, o):
    """Eyes, brows, nose and mouth, placed by hand around the head's center. Drawn last, so the
    hat brim's shadow never covers the brows."""
    ex, ey = B.head; hw, hh = B.hw, B.hh; race, sex = B.race, B.sex
    X = lambda dx: int(math.floor(ex + dx)); Y = lambda dy: int(math.floor(ey + dy))
    eye = o.get('eye', '#3a6aa8'); ink = o.get('ink', '#1c1018'); white = '#f4eee2'
    sk = s.mats['skin']; dk = mix(eye, ink, .55); lt = mix(eye, '#ffffff', .35)
    e0 = 0 if race == 'dwarf' else 1
    fx, nx = X(-3.5), X(1.5); y0 = Y(e0)
    if o.get('glow_eyes'):
        g = o['glow_eyes']
        for x0, w in ((fx, 2), (nx, 3)):
            s.paint([(x0 + i, y0 + 1) for i in range(w)], g); s.paint([(x0 + w - 1, y0 + 1)], '#ffffff')
        return
    if o.get('gaunt'):
        s.tone('head', [(fx - 1, y0), (fx + 2, y0), (fx - 1, y0 + 1), (fx + 2, y0 + 1), (nx - 1, y0 + 1), (nx + 3, y0 + 1), (fx, y0 + 3), (fx + 1, y0 + 3), (nx, y0 + 3), (nx + 1, y0 + 3), (nx + 2, y0 + 3)], 1)
        s.tone('head', [(X(-hw / 2 + 2), y0 + 4), (X(-hw / 2 + 2), y0 + 5), (X(hw / 2 - 2), y0 + 4), (X(hw / 2 - 2), y0 + 5)], 2)
    # far eye (narrow in three-quarter view), near eye
    s.paint([(fx, y0), (fx + 1, y0)], ink)
    s.paint([(fx, y0 + 1)], white); s.paint([(fx + 1, y0 + 1)], eye); s.paint([(fx + 1, y0 + 2)], dk)
    s.paint([(nx, y0), (nx + 1, y0), (nx + 2, y0)], ink)
    s.paint([(nx, y0 + 1)], white); s.paint([(nx + 1, y0 + 1)], lt); s.paint([(nx + 2, y0 + 1)], eye)
    s.paint([(nx + 1, y0 + 2)], dk); s.paint([(nx + 2, y0 + 2)], dk)
    if sex == 'f' or race == 'elf':
        s.paint([(nx + 3, y0 - 1 if sex == 'f' else y0)], ink)
        if sex == 'f': s.paint([(fx - 1, y0)], ink)
    # brows
    bc = o.get('brow') or mix(s.mats['hair'][0], ink, .25)
    if race == 'orc' or (race == 'dwarf' and sex == 'm'):
        s.paint([(fx - 1, y0 - 2), (fx, y0 - 2), (fx + 1, y0 - 1), (nx, y0 - 1), (nx + 1, y0 - 2), (nx + 2, y0 - 2), (nx + 3, y0 - 2)], bc)
        if race == 'dwarf': s.paint([(fx, y0 - 3), (nx + 1, y0 - 3), (nx + 2, y0 - 3)], bc)
    elif race == 'elf':
        s.paint([(fx, y0 - 2), (fx + 1, y0 - 2), (nx, y0 - 2), (nx + 1, y0 - 2), (nx + 2, y0 - 3), (nx + 3, y0 - 3)], bc)
    else:
        s.paint([(fx, y0 - 2), (fx + 1, y0 - 2), (nx, y0 - 2), (nx + 1, y0 - 2), (nx + 2, y0 - 2)], bc)
    # nose
    if race == 'dwarf':
        s.paint([(X(0), y0 + 2), (X(1), y0 + 2), (X(0), y0 + 3), (X(1), y0 + 3)], sk[3]); s.paint([(X(0), y0 + 2)], sk[4])
        s.paint([(X(0), y0 + 4), (X(1), y0 + 4), (X(2), y0 + 3)], sk[1])
    else:
        s.paint([(X(0), y0 + 1), (X(0), y0 + 2)], sk[4])
        s.paint([(X(-1), y0 + 3), (X(0), y0 + 3)], sk[2]); s.paint([(X(1), y0 + 3)], sk[1])
    # mouth
    my = y0 + (5 if race != 'dwarf' else 5)
    mc = mix(sk[0], '#7a2030', .35)
    if not (o.get('beard') and race == 'dwarf'):
        s.paint([(X(-1), my), (X(0), my), (X(1), my)], mc); s.paint([(X(0), my + 1)], sk[4])
        if sex == 'f':
            lip = o.get('lip', '#b04a50'); s.paint([(X(-1), my), (X(0), my), (X(1), my)], lip); s.paint([(X(-1), my), (X(1), my)], mix(lip, ink, .4))
            s.paint([(X(-hw / 2 + 2), my - 2), (X(hw / 2 - 2), my - 2)], mix(sk[3], '#e06a6a', .35))
    if race == 'orc':
        # tusks rising from the lower jaw over the lip
        for tx in (X(-2), X(2)):
            s.paint([(tx, my - 1), (tx, my), (tx, my + 1)], '#f2ead0', over=True); s.paint([(tx + 1, my + 1)], '#c8bc98')
        s.paint([(tx, my - 1)], '#ffffff')
    # cheek shadow on the far side
    s.tone('head', [(X(-hw / 2 + 1.5), y0 + 3), (X(-hw / 2 + 1.5), y0 + 4), (X(-hw / 2 + 2.5), y0 + 5)], 2)
    if o.get('scar'): s.paint([(nx + 3, y0 - 3), (nx + 3, y0 - 2), (nx + 3, y0 + 2), (nx + 3, y0 + 3)], sk[1])
    if o.get('paint'): s.paint([(fx, y0 + 3), (fx + 1, y0 + 4), (nx + 1, y0 + 3), (nx + 2, y0 + 4)], o['paint'])

# locks of hair as separate clumps, each shaded on its own, so the hair reads in chunky
# clusters: (root dx, root dy, tip dx, tip dy, width), relative to the head's center
LOCKS = {
    'short': [(-5.5, -5, -9, 1, 2.2), (-3.5, -6, -5.5, -1, 2.6), (-0.5, -6, -2, -1.5, 2.6), (2.5, -6, 2.0, -1.8, 2.4),
              (5.0, -5, 6.5, -1, 2.0), (6.0, -4, 8.0, 1.5, 1.5), (-6.5, -3, -7.2, 3.5, 1.6),
              (-3, -8, -8, -10.5, 2.0), (1, -8.5, -2, -11, 1.8)],
    'long':  [(-5.5, -5, -8.5, 2, 2.4), (-3.0, -6, -4.5, -1, 2.6), (0, -6, 0.5, -1.5, 2.4), (3.0, -5.5, 5, -0.5, 2.4),
              (5.5, -4, 7.5, 2.5, 1.8), (-6.5, -3, -7.5, 5, 2.0)],
    'braids': [(-4.5, -5, -6, -1, 2.6), (-1, -6, -0.5, -1.5, 2.6), (2.5, -5.5, 4.5, -1, 2.4), (5.5, -4, 7, 1.5, 1.6)],
    'ponytail': [(-4.5, -5, -6.5, 0, 2.4), (-1, -6, -1.5, -1.5, 2.6), (2.5, -5.5, 4.5, -1, 2.4), (5.5, -4, 7, 1.5, 1.6)],
    'wild':  [(-5.5, -5, -10, 0, 2.4), (-3.5, -6, -6, -1, 2.6), (-0.5, -6, -2, -1, 2.6), (2.5, -6, 3, -1, 2.4), (5, -5, 8, 0, 2.2),
              (-3, -8, -9, -11, 2.2), (1, -8.5, 0, -13, 2.0), (4, -7, 8, -9, 1.8), (6, -3, 9, 4, 1.6)],
    'mane':  [(-5.5, -5, -9, 1, 2.4), (-3.5, -6, -5.5, -1, 2.6), (-0.5, -6, -1, -1.5, 2.6), (2.5, -6, 3.5, -1.5, 2.4), (5, -5, 7.5, 0, 2.0),
              (-4, -8, -9, -9.5, 2.0)],
    'topknot': [(-4.5, -5, -6.5, -2, 2.0), (2.5, -5.5, 5, -2, 2.0)],
    'bun': [(-4.5, -5, -6, -1, 2.4), (-1, -6, -1, -1.5, 2.6), (2.5, -5.5, 4.5, -1, 2.4), (5.5, -4, 7, 1.5, 1.6)],
}
def locks(s, B, o):
    ex, ey = B.head; hw = B.hw; k = hw / 14.0
    for i, (rx, ry, tx, ty, w) in enumerate(LOCKS.get(o.get('hair', 'short'), LOCKS['short'])):
        p = s.part('lock%d' % i, 'hair', z=14.1 + i * 0.01, R=w, line=3, cast=1)
        mx, my = (rx + tx) / 2 * k, (ry + ty) / 2 * k
        p.curve([(ex + rx * k, ey + ry), (ex + mx + (0.6 if tx < rx else -0.6), ey + my - 0.4), (ex + tx * k, ey + ty)], w, 0.45, steps=16)

def hair(s, B, o, view):
    ex, ey = B.head; hw, hh = B.hw, B.hh; st = o.get('hair', 'short'); back = view == 'back'
    top = ey - hh / 2
    cap = s.part('hair', 'hair', z=14, R=3.5)
    if st not in ('bald', 'mohawk'):
        cap.ellipse(ex - 0.5, ey - hh * 0.2, hw / 2 + 1.2, hh / 2 - 0.2)
        cap.rect(0, int(ey - 2), s.w - 1, s.h - 1, erase=True)
        if not back:
            locks(s, B, o)
        else:
            cap.ellipse(ex, ey - 0.5, hw / 2 + 1.0, hh / 2 - 0.2)
            for i, (rx, ry, tx, ty, w) in enumerate(((-5, -5, -6.8, 3.5, 2.3), (-2, -6.5, -2.8, 5.5, 2.6), (1.5, -6.5, 1.8, 5.8, 2.6), (4.5, -5, 6.2, 3.5, 2.3), (-0.5, -8, 0, 1, 2.6))):
                p = s.part('lockb%d' % i, 'hair', z=14.1 + i * 0.01, R=w, line=0, cast=0)
                p.curve([(ex + rx, ey + ry), (ex + (rx + tx) / 2, ey + (ry + ty) / 2), (ex + tx, ey + ty)], w, 0.8, steps=16)
            nape = bottom_band(cap.mask | s.get('lockb1').mask | s.get('lockb2').mask, 1)
            s.ontone('hair', [(int(x), int(y)) for y, x in zip(*nape.nonzero())], 1)
    if st in ('long', 'braids', 'ponytail', 'wild', 'mane'):
        hb = s.part('hairback', 'hair', z=-2 if not back else 15, R=4, line=1)
        ln = {'long': 20, 'braids': 9, 'ponytail': 6, 'wild': 13, 'mane': 15}[st]
        hb.ellipse(ex - 0.5, ey - 1, hw / 2 + 1.5, hh / 2 + 0.5)
        if st in ('long', 'wild', 'mane'):
            hb.mask[int(ey + 2):, :] = False
            # the fall of hair as separate tapering locks with a ragged, uneven end
            n = 4 if back else 5; spread = hw / 2 + 1.0
            hb.flat = -0.45                                  # the base shows only as the dark gaps between locks
            for i in range(n):
                t = i / (n - 1); x0 = ex - spread + 2 * spread * t; ln_i = ln * (0.8 + 0.2 * ((i * 7) % 3) / 2)
                lp = s.part('fall%d' % i, 'hair', z=(-2 if not back else 15) + 0.01 * (i + 1), R=2.6, line=0, cast=0)
                lp.curve([(x0 * 0.7 + ex * 0.3, ey - 3), (x0 + (x0 - ex) * 0.12, ey + ln_i * 0.5), (x0 + (x0 - ex) * 0.2, ey + ln_i)], 2.5, 0.5, steps=18)
                hb.curve([(x0 * 0.7 + ex * 0.3, ey - 3), (x0 + (x0 - ex) * 0.12, ey + ln_i * 0.5), (x0 + (x0 - ex) * 0.2, ey + ln_i)], 3.2, 1.0, steps=18)
        else:
            hb.poly([(ex - hw / 2 - 1.5, ey), (ex + hw / 2 + 1.5, ey), (ex + hw / 2 + 2.5, ey + ln), (ex + 1, ey + ln + 2), (ex - hw / 2 - 2.5, ey + ln + 1)])
        if st == 'ponytail':
            hb.curve([(ex - hw / 2, ey - 2), (ex - hw / 2 - 5, ey + 4), (ex - hw / 2 - 3, ey + 14)], 2.4, 1.2)
        if st == 'long' and not back:
            lk = s.part('frontlock', 'hair', z=13.5, R=2)
            lk.poly([(ex - hw / 2 - 1, ey - 1), (ex - hw / 2 + 2.2, ey - 1), (ex - hw / 2 + 2.8, ey + hh / 2 + 7), (ex - hw / 2 + 1, ey + hh / 2 + 9), (ex - hw / 2 - 1.5, ey + hh / 2 + 5)])
            s.tone('frontlock', [(int(ex - hw / 2 + 0.5), y) for y in range(int(ey + 1), int(ey + hh / 2 + 6))], 2)
        if st == 'braids':
            for i, d in enumerate((-hw / 2 - 0.2, hw / 2 - 1.2)):
                br = s.part('braid%d' % i, 'hair', z=13.6 if not back else 15.5, R=1.6)
                for k in range(5): br.ellipse(ex + d + 0.5, ey + 3 + k * 2.6, 1.9, 1.5)
                s.part('tie%d' % i, 'gold', z=(13.7 if not back else 15.6), shine=1, R=1).rect(int(ex + d), int(ey + 15), int(ex + d + 1), int(ey + 16))
    if st == 'mohawk':
        m = s.part('mohawk', 'hair', z=14.2, R=2)
        if back: m.curve([(ex, ey + 4), (ex, top - 1), (ex - 1, top - 4)], 2.4, 1.4)
        else: m.curve([(ex + 2.5, top + 3), (ex + 1, top - 2.5), (ex - 4, top - 1.5), (ex - 6.5, top + 3)], 2.2, 1.4, steps=30)
        s.tone('head', [(int(ex - 3), int(top + 3)), (int(ex - 2), int(top + 2))], 2)
    if st == 'topknot':
        s.part('knot', 'hair', z=14.1, R=2.5).ellipse(ex - 1, top - 1, 3.2, 2.8)
        s.part('knotband', 'gold', z=14.2, shine=1, R=1).rect(int(ex - 3), int(top + 1), int(ex + 1), int(top + 1))
    if st == 'bun':
        s.part('knot', 'hair', z=13.9, R=2.5).ellipse(ex - hw / 2 + 1, top + 2.5, 3.4, 3.2)
    if o.get('beard'):
        bl = o.get('beard_len', 10)
        if not back:
            # a full beard in three shaded locks, a sweeping moustache over it
            bd = s.part('beard', 'beard', z=13.8, R=4)
            bd.poly([(ex - hw / 2 + 0.3, ey + 0.5), (ex + hw / 2 + 0.3, ey), (ex + hw / 2, ey + 5), (ex - hw / 2 + 0.5, ey + 5.5)])
            for i, (dx, tx, ln, w) in enumerate(((-4, -5, 0.75, 3.0), (0.5, 1.0, 1.0, 3.4), (4.5, 6, 0.8, 2.8))):
                lk = s.part('beardlock%d' % i, 'beard', z=13.81 + i * 0.01, R=w, line=3)
                lk.curve([(ex + dx, ey + 3), (ex + (dx + tx) / 2, ey + hh / 2 + bl * ln * 0.5), (ex + tx, ey + hh / 2 + bl * ln)], w, 0.8, steps=18)
            mo = s.part('mous', 'beard', z=13.95, R=1.5, line=3)
            mo.curve([(ex + 0.5, ey + 3.8), (ex - 2.5, ey + 4.2), (ex - 4.5, ey + 6.5)], 1.6, 0.6).curve([(ex + 0.8, ey + 3.8), (ex + 3.8, ey + 4.2), (ex + 5.8, ey + 6.2)], 1.6, 0.6)
            s.tone('mous', [(int(ex - 2), int(ey + 3)), (int(ex + 3), int(ey + 3))], 4)
            if o.get('beard_bead'):
                s.part('bead', 'gold', z=14, shine=1, R=1).rect(int(ex + 1), int(ey + hh / 2 + bl - 3), int(ex + 2), int(ey + hh / 2 + bl - 2))
        else:
            # from behind, the beard's edges show past the jaw
            for d in (-1, 1):
                s.part('beardside%d' % d, 'beard', z=13.5, R=2).ellipse(ex + d * (hw / 2 - 0.5), ey + 5, 2.2, 3.5)

# ---------------------------------------------------------------- hats
def hat(s, B, o, view):
    kind = o.get('hat')
    if not kind or kind == 'none': return
    ex, ey = B.head; hw, hh = B.hw, B.hh; top = ey - hh / 2; back = view == 'back'
    if kind in ('wizard', 'witch'):
        witch = kind == 'witch'
        by = top + hh * 0.22
        brim = s.part('brim', 'hat', z=16, R=2.0, cast=2, flat=0.08)
        rx = (hw / 2 + (6.5 if not witch else 9)) * o.get('brim', 1.0)
        brim.ellipse(ex + 0.5, by + 0.8, rx, 3.0)
        brim.poly([(ex + 0.5 - rx * 0.8, by - 0.4), (ex - rx + 1.5, by + 2.6), (ex - rx - 0.5, by + 3.6), (ex - rx + 0.5, by + 1.8)])
        brim.poly([(ex + 0.5 + rx * 0.8, by), (ex + rx + 0.5, by + 1.0), (ex + rx + 1.5, by + 3.4), (ex + rx + 0.5, by + 4.2), (ex + rx - 1.5, by + 2.8)])
        brim.ellipse(ex + 0.5, by + 2.2, rx * 0.7, 2.2)
        edge = bottom_band(brim.mask, 1)
        s.tone('brim', [(int(x), int(y)) for y, x in zip(*edge.nonzero())], 1)
        lip = bottom_band(brim.mask, 2) & ~edge
        s.tone('brim', [(int(x), int(y)) for y, x in zip(*lip.nonzero()) if x > ex - rx * 0.5], 4)
        H = hh * (1.35 if not witch else 1.6) * o.get('hat_h', 1.0)
        crown = s.part('crown', 'hat', z=16.5, R=4.0)
        crown.poly([(ex - hw / 2 - 0.5, by), (ex + hw / 2 + 1.5, by), (ex + 3.5, by - H * 0.5), (ex - 1.5, by - H * 0.55)])
        tipx = ex - (7 if not witch else 10); tipy = by - H
        if witch:
            crown.curve([(ex + 1, by - H * 0.45), (ex + 3.5, by - H * 0.78), (ex - 2, by - H * 0.9), (tipx, tipy + 1)], 3.4, 0.6, steps=40)
        else:
            crown.curve([(ex + 1, by - H * 0.45), (ex + 1.5, by - H * 0.85), (tipx, tipy)], 3.3, 0.6, steps=36)
        s.tone('crown', [(int(ex - 1 + k * 0.6), int(by - H * 0.62 + k)) for k in range(4)], 2)
        s.tone('crown', [(int(ex + 2), int(by - k)) for k in range(3, 8)], 2)
        band = s.part('band', 'hatband', z=16.6, R=1.2, line=1)
        band.poly([(ex - hw / 2 - 1.5, by + 0.2), (ex + hw / 2 + 2, by + 0.2), (ex + hw / 2 + 1.5, by - 1.9), (ex - hw / 2 - 1, by - 1.9)]).clip(crown)
        if not back:
            s.part('hatgem', 'gold', z=16.7, shine=1, R=1).rect(int(ex + 2), int(by - 2), int(ex + 3), int(by - 1))
            s.paint([(int(ex + 2), int(by - 2))], '#fff6c8')
        s.tone('head', [(x, int(by + 2.5)) for x in range(int(ex - hw / 2), int(ex + hw / 2 + 1))], 2)
        s.tone('hair', [(x, int(by + 2.5)) for x in range(int(ex - hw / 2 - 1), int(ex + hw / 2 + 2))], 1)
        for p in s.parts:
            if p.name in ('hair', 'knot', 'mohawk', 'knotband') or p.name.startswith('lock'): p.mask[:int(by + 1), :] = False
            if p.name == 'mohawk' and back: p.mask[:] = False
    elif kind == 'hood':
        hd = s.part('hood', 'cloth', z=15, R=5, cast=2)
        hd.ellipse(ex - 0.3, ey - 1.2, hw / 2 + 2.8, hh / 2 + 2.5)
        hd.poly([(ex - hw / 2 - 3.2, ey), (ex + hw / 2 + 3, ey), (ex + hw / 2 + 5.5, ey + hh / 2 + 5), (ex - hw / 2 - 5.5, ey + hh / 2 + 6)])
        if back:
            hd.poly([(ex - 4, ey + hh / 2 + 3), (ex + 5, ey + hh / 2 + 3), (ex + 0.5, ey + hh / 2 + 11)])
        hd.hull()
        hd.poly([(ex - 2, ey - hh / 2 - 1.5), (ex - hw / 2 - 6, ey - hh / 2 + 4), (ex - hw / 2 - 2, ey - 1)])
        if back:
            s.tone('hood', [(int(ex + 0.5), y) for y in range(int(ey - hh / 2 + 2), int(ey + hh / 2 + 8))], 2)
        if not back:
            hd.ellipse(ex + 1.3, ey + 1.5, hw / 2 - 0.8, hh / 2 - 1.6, erase=True)
            hd.rect(int(ex - hw / 2 + 2.5), int(ey + 2), int(ex + hw / 2 - 0.5), int(ey + hh / 2 - 0.5), erase=True)
            s.tone('hood', [(int(ex - hw / 2 + 1.5), y) for y in range(int(ey - 3), int(ey + hh / 2 + 1))], 2)
        for p in list(s.parts):
            if p.name == 'hair' or p.name.startswith('lock'): p.mask &= ~hd.mask
            elif p.name in ('hairback', 'ear', 'ear2', 'frontlock', 'knot', 'mohawk', 'knotband'): p.mask[:] = False
        if o.get('hood_shadow') and not back:
            v = s.part('void', 'void', z=14.9, line=0, cast=0, R=2)
            v.ellipse(ex + 1.3, ey + 0.5, hw / 2 - 0.8, hh / 2 - 1.2)
            v.mask &= ~s.get('hood').mask
    elif kind == 'helm':
        hm = s.part('helm', 'iron', z=16, shine=1, R=4)
        hm.ellipse(ex, ey - 1.5, hw / 2 + 1.5, hh / 2)
        hm.rect(0, int(ey + 1), s.w - 1, s.h - 1, erase=True)
        hm.poly([(ex - hw / 2 - 1.5, ey), (ex - hw / 2 + 1.5, ey), (ex - hw / 2 + 1, ey + 5), (ex - hw / 2 - 1.5, ey + 5)])
        s.part('helmrim', 'gold', z=16.2, shine=1, R=1).rect(int(ex - hw / 2 - 1), int(ey - 0.5), int(ex + hw / 2 + 1), int(ey + 0.5))
        p = s.get('hair')
        if p is not None: p.mask &= ~hm.mask
    elif kind in ('crown', 'circlet'):
        c = s.part('crownband', 'gold', z=16, shine=1, R=1.2)
        c.rect(int(ex - hw / 2), int(top + 3), int(ex + hw / 2), int(top + 4))
        if kind == 'crown':
            for dx in (-hw / 2 + 1, 0, hw / 2 - 1):
                c.poly([(ex + dx - 1.5, top + 3.5), (ex + dx, top - 1.5), (ex + dx + 1.5, top + 3.5)])
        s.part('cgem', 'gem', z=16.2, shine=1, R=1).rect(int(ex), int(top + 3), int(ex + 1), int(top + 4))
    elif kind == 'tiara' or kind == 'icecrown':
        tall = 1.0 if kind == 'tiara' else 1.8
        for i, (dx, h) in enumerate(((-hw / 2 + 1, 3), (-2.5, 5), (0.5, 8), (3.5, 5), (hw / 2, 3))):
            s.part('spike%d' % i, 'gem', z=16, shine=1, R=1).poly([(ex + dx - 1.5, top + 3.5), (ex + dx + 1.5, top + 3.5), (ex + dx, top + 3.5 - h * tall)])
        s.part('circ', 'gold' if kind == 'tiara' else 'gem', z=16.1, shine=1, R=1).rect(int(ex - hw / 2), int(top + 3), int(ex + hw / 2 + 1), int(top + 4))
    elif kind == 'tricorn':
        tc = s.part('tricorn', 'hat', z=16, R=3, cast=2)
        tc.poly([(ex - hw / 2 - 5, top + 5), (ex - 2, top - 1), (ex + 4, top - 2), (ex + hw / 2 + 6, top + 4), (ex + 3, top + 6.5), (ex - 4, top + 6.5)])
        s.part('tband', 'hatband', z=16.1, R=1, line=0).poly([(ex - hw / 2 - 4, top + 5), (ex + hw / 2 + 5, top + 4), (ex + hw / 2 + 5, top + 5), (ex - hw / 2 - 4, top + 6)]).clip(tc)
        s.part('plume', 'cloth', z=15.9, R=1.5).curve([(ex - 2, top), (ex - 7, top - 5), (ex - 12, top - 3)], 2.0, 0.6)
        for p in s.parts:
            if p.name in ('hair',) or p.name.startswith('lock'): p.mask[:int(top + 5), :] = False
    elif kind == 'antlers':
        for d in (-1, 1):
            a = s.part('antler%d' % d, 'bone', z=16, R=1.2)
            a.curve([(ex + d * 3, top + 2), (ex + d * 8, top - 3), (ex + d * 13, top - 8)], 1.6, 0.6)
            a.curve([(ex + d * 7, top - 2), (ex + d * 7, top - 8)], 1.1, 0.5).curve([(ex + d * 10, top - 5), (ex + d * 14, top - 3)], 1.0, 0.4)
        s.part('wreath', 'leaf', z=16.1, R=1).rect(int(ex - hw / 2), int(top + 2), int(ex + hw / 2 + 1), int(top + 3))
    elif kind in ('veil', 'spiked'):
        if kind == 'veil':
            v = s.part('veil', 'hat', z=16, R=4, cast=2)
            v.ellipse(ex - 0.3, ey - 1.5, hw / 2 + 2, hh / 2 + 1.5).poly([(ex - hw / 2 - 2, ey), (ex + hw / 2 + 2, ey), (ex + hw / 2 + 5, ey + hh / 2 + 8), (ex - hw / 2 - 5, ey + hh / 2 + 9)])
            if view != 'back':
                v.ellipse(ex + 1, ey + 1.5, hw / 2 - 1, hh / 2 - 2, erase=True)
            for i, x in enumerate((ex - 3, ex, ex + 3)):
                s.part('vcrown%d' % i, 'gold', z=16.1, shine=1, R=1).poly([(x - 1.2, top), (x, top - 4), (x + 1.2, top)])
            for p in s.parts:
                if p.name in ('hair', 'hairback', 'frontlock', 'ear', 'ear2') or p.name.startswith(('lock', 'fall')): p.mask &= ~v.mask
        else:
            hm = s.part('helm', 'iron', z=16, shine=1, R=4)
            hm.ellipse(ex, ey - 0.5, hw / 2 + 1.5, hh / 2 + 0.5)
            if view != 'back':
                hm.rect(int(ex - 1), int(ey + 1), int(ex + hw / 2 + 2), int(ey + 3), erase=True)
                s.paint([(x, int(ey + 2)) for x in range(int(ex - 1), int(ex + hw / 2 + 1))], '#ff3a4a')
            for i, dx in enumerate((-4, 0, 4)):
                s.part('hspike%d' % i, 'iron', z=16.1, shine=1, R=1).poly([(ex + dx - 1.5, top + 1), (ex + dx + 1.5, top + 1), (ex + dx, top - 5)])
            for p in s.parts:
                if p.name in ('hair', 'hairback', 'frontlock', 'ear', 'ear2') or p.name.startswith(('lock', 'fall')): p.mask &= ~hm.mask
    elif kind == 'horns':
        for d in (-1, 1):
            s.part('horn%d' % d, 'bone', z=16, R=1.5).curve([(ex + d * 3, top + 2), (ex + d * 8, top - 1), (ex + d * 7, top - 7)], 2.0, 0.5)

# ---------------------------------------------------------------- staffs and spells
def blade(s, B, o, view, kind):
    """A sword, saber, spear or scythe in the right fist, blade up."""
    hx_, hy_ = B.haR; x = hx_ + 0.3; g = s.mats.get('steel') and 'steel' or 'iron'
    if kind in ('sword', 'greatsword', 'darksword'):
        # the blade raised and angled out, away from the head
        L = 22 if kind == 'sword' else 28; w = 1.6 if kind == 'sword' else 2.3
        a = math.radians(28); ux, uy = math.sin(a), -math.cos(a); px_, py_ = -uy, ux
        b0 = (x + ux * 3, hy_ + uy * 3); b1 = (x + ux * (L - 3), hy_ + uy * (L - 3)); tp = (x + ux * L, hy_ + uy * L)
        bl = s.part('blade', 'blade', z=12.35, shine=1, R=w)
        bl.poly([(b0[0] - px_ * w, b0[1] - py_ * w), (b0[0] + px_ * w, b0[1] + py_ * w), (b1[0] + px_ * w, b1[1] + py_ * w), tp, (b1[0] - px_ * w, b1[1] - py_ * w)])
        s.tone('blade', [(int(round(x + ux * k)), int(round(hy_ + uy * k))) for k in range(4, L - 2)], 5 if kind != 'darksword' else 1)
        s.part('guard', 'gold', z=12.7, shine=1, R=1).capsule((b0[0] - px_ * 4, b0[1] - py_ * 4), (b0[0] + px_ * 4, b0[1] + py_ * 4), 1.0)
        s.part('pommel', 'gold', z=12.3, shine=1, R=1).ellipse(x - ux * 4, hy_ - uy * 4, 1.5, 1.4)
        s.staff_tip = (x + ux * (L - 4), hy_ + uy * (L - 4))
    elif kind == 'saber':
        bl = s.part('blade', g, z=12.35, shine=1, R=1.5)
        bl.curve([(x, hy_ - 3), (x + 3, hy_ - 12), (x + 1, hy_ - 22)], 1.7, 0.5, steps=24)
        s.part('guard', 'gold', z=12.5, shine=1, R=1).curve([(x - 3, hy_ - 2), (x, hy_ - 3), (x + 3, hy_ + 1)], 1.0, 0.8)
        s.staff_tip = (x + 1, hy_ - 20)
    elif kind in ('spear', 'scythe'):
        top = B.top - 2
        st = s.part('staff', 'wood', z=12.4, R=1.2, line=2).capsule((x, top + 4), (x, GROUND - 0.5), 1.2, 1.0)
        if kind == 'spear':
            s.part('head', g, z=12.45, shine=1, R=1.5).poly([(x - 2.5, top + 5), (x + 2.5, top + 5), (x, top - 5)])
            s.staff_tip = (x, top)
        else:
            sc = s.part('scythe', g, z=12.45, shine=1, R=2)
            sc.curve([(x, top + 3), (x - 9, top - 1), (x - 18, top + 6)], 2.4, 0.4, steps=30)
            s.staff_tip = (x - 9, top)

def bow(s, B, o, view):
    hx_, hy_ = B.haL; x = hx_ - 1
    b = s.part('bow', 'wood', z=13.1, R=1, line=2)
    b.curve([(x + 3, hy_ - 18), (x - 5, hy_), (x + 3, hy_ + 18)], 1.4, 1.0, steps=30)
    s.paint([(int(x + 3), y) for y in range(int(hy_ - 17), int(hy_ + 18))], '#e8e0c8')

def shield(s, B, o, view):
    kind = o.get('shield'); hx_, hy_ = B.haL
    if not kind: return
    sh = s.part('shield', 'shield', z=13.2 if view != 'back' else 10.5, shine=1, R=5)
    if kind == 'round':
        sh.ellipse(hx_ - 1, hy_ - 2, 7, 7.5)
        s.part('rim', 'gold', z=13.3, shine=1, R=1, line=0).ellipse(hx_ - 1, hy_ - 2, 7, 7.5).ellipse(hx_ - 1, hy_ - 2, 5.8, 6.3, erase=True)
        s.part('boss', 'gold', z=13.35, shine=1, R=1.5).ellipse(hx_ - 1, hy_ - 2, 1.8, 1.8)
    else:
        sh.poly([(hx_ - 8, hy_ - 10), (hx_ + 6, hy_ - 10), (hx_ + 6, hy_ + 1), (hx_ - 1, hy_ + 8), (hx_ - 8, hy_ + 1)])
        if view != 'back':
            s.part('crest', 'gold', z=13.3, shine=1, R=1, line=0).rect(int(hx_ - 2), int(hy_ - 9), int(hx_), int(hy_ + 5)).rect(int(hx_ - 6), int(hy_ - 5), int(hx_ + 4), int(hy_ - 3))

def wings(s, B, o, view):
    cx, sy = B.cx, B.sy; z = -4 if view != 'back' else 9.5
    for d in (-1, 1):
        w = s.part('wing%d' % d, 'wing', z=z, R=5, line=3)
        w.poly([(cx + d * 2, sy + 4), (cx + d * 22, sy - 16), (cx + d * 26, sy - 12), (cx + d * 20, sy + 2), (cx + d * 22, sy + 8), (cx + d * 12, sy + 14)])
        for k in range(3):
            s.tone('wing%d' % d, [(int(cx + d * (8 + k * 5 + j * 0.3)), int(sy - 2 - k * 4 + j)) for j in range(8)], 2)

def spider_legs(s, B, o, view):
    cx, sy = B.cx, B.sy
    for d in (-1, 1):
        for k in range(3):
            s.part('sleg%d%d' % (d, k), 'carapace', z=-4, R=1.2).curve([(cx + d * 3, sy + 6 + k * 3), (cx + d * (16 + k * 2), sy - 6 + k * 6), (cx + d * (22 + k), sy + 14 + k * 8)], 1.6, 0.6, steps=20)

def staff(s, B, o, view):
    kind = o.get('staff', 'crescent')
    if not kind: return
    if kind in ('sword', 'greatsword', 'darksword', 'saber', 'spear', 'scythe'): return blade(s, B, o, view, kind)
    hx_, hy_ = B.haR; x = hx_ + 0.3
    top = B.top - 3 + o.get('staff_dy', 0)
    st = s.part('staff', 'wood', z=12.4, R=1.2, line=2)
    st.capsule((x, top + 6), (x, GROUND - 0.5), 1.25, 1.05)
    s.tone('staff', [(int(x), y) for y in range(int(top + 9), GROUND, 6)], 2)
    gx, gy = x, top + 2
    if kind == 'crescent':
        h = s.part('staffhead', 'wood', z=12.45, R=1.5, line=2)
        h.curve([(x, top + 7), (x - 5, top + 3), (x - 2.5, top - 4), (x + 3, top - 3)], 1.5, 0.7, steps=36)
        gx, gy = x - 0.5, top + 0.5
        s.part('wrap', 'leather', z=12.5, R=1).rect(int(x - 1), int(top + 9), int(x + 1), int(top + 11))
    elif kind == 'skull':
        sk = s.part('skull', 'bone', z=12.5, R=2.5)
        sk.ellipse(x, top + 1, 3.8, 3.4).rect(int(x - 2), int(top + 3), int(x + 2), int(top + 5))
        if view != 'back':
            s.paint([(int(x - 2), int(top + 1)), (int(x - 1), int(top + 1)), (int(x + 1), int(top + 1)), (int(x + 2), int(top + 1))], '#1a0f14')
            s.paint([(int(x - 1), int(top + 1)), (int(x + 1), int(top + 1))], o.get('glow', '#7dff8a'))
            s.tone('skull', [(int(x - 1), int(top + 4)), (int(x + 1), int(top + 4)), (int(x), int(top + 2))], 1)
        for d in (-1, 1): s.part('horn%d' % d, 'bone', z=12.45, R=1).curve([(x + d * 2.5, top - 1), (x + d * 5.5, top - 3), (x + d * 5, top - 8)], 1.2, 0.4)
        gx, gy = x, top + 1
    elif kind == 'crystal':
        for i, (dx, dy, hgt) in enumerate(((-2, 1, 7), (0.5, 0, 11), (2.8, 1.5, 6))):
            s.part('crys%d' % i, 'gem', z=12.5 + i * 0.01, shine=1, R=1.2).poly([(x + dx - 1.6, top + 5 + dy), (x + dx + 1.6, top + 5 + dy), (x + dx + 0.4, top + 5 + dy - hgt)])
        s.part('prong', 'gold', z=12.55, shine=1, R=1).rect(int(x - 2), int(top + 5), int(x + 2), int(top + 6))
        gx, gy = x + 1, top - 2
    elif kind == 'branch':
        br = s.part('staffhead', 'wood', z=12.45, R=1.3, line=2)
        br.curve([(x, top + 7), (x - 3.5, top + 2), (x - 2, top - 4)], 1.4, 0.6).curve([(x, top + 6), (x + 4, top + 1), (x + 2.5, top - 3)], 1.2, 0.5)
        for i, (lx, ly) in enumerate(((x - 5, top + 2), (x + 5, top - 1), (x - 3, top - 4), (x + 3, top + 4))):
            s.part('leaf%d' % i, 'leaf', z=12.6, R=1.2).ellipse(lx, ly, 2.0, 1.2)
        gx, gy = x + 0.3, top + 1
    elif kind == 'hammer':
        hm = s.part('hammer', 'iron', z=12.5, shine=1, R=2.5)
        hm.rect(int(x - 5), int(top), int(x + 5), int(top + 5))
        s.part('hamband', 'gold', z=12.6, shine=1, R=1).rect(int(x - 1), int(top), int(x + 1), int(top + 5))
        gx, gy = x, top + 2.5
    elif kind == 'totem':
        tt = s.part('totem', 'bone', z=12.5, R=2)
        tt.poly([(x - 3, top + 7), (x + 3, top + 7), (x + 4, top - 1), (x, top - 4), (x - 4, top - 1)])
        for d in (-1, 1): s.part('tusk%d' % d, 'bone', z=12.45, R=1).curve([(x + d * 3, top + 3), (x + d * 7, top + 1), (x + d * 7, top - 4)], 1.3, 0.4)
        s.part('feather', 'cloth', z=12.55, R=1).capsule((x - 3, top + 7), (x - 4, top + 13), 1.0, 0.6)
        gx, gy = x, top + 2
    elif kind == 'flamestaff':
        fl = s.part('fire', 'spell', z=12.6, line=0, shine=1, R=2, cast=0)
        fl.poly([(x - 3.5, top + 5), (x + 3.5, top + 5), (x + 3, top), (x + 1, top - 7), (x, top - 2), (x - 2, top - 5), (x - 3, top)])
        s.mtone('spell', [(int(x), int(top + 2)), (int(x), int(top + 3)), (int(x - 1), int(top + 3))], 5)
        s.part('cup', 'gold', z=12.55, shine=1, R=1).rect(int(x - 3), int(top + 5), int(x + 3), int(top + 7))
        gx, gy = x, top + 1
    elif kind == 'bolt':
        s.part('rod', 'iron', z=12.5, shine=1, R=1).rect(int(x - 3), int(top + 6), int(x + 3), int(top + 7))
        bt = s.part('zap', 'spell', z=12.6, line=0, shine=1, R=1, cast=0)
        bt.poly([(x + 1, top - 6), (x - 3, top + 1), (x, top + 1), (x - 2, top + 6), (x + 3, top - 1), (x, top - 1)])
        gx, gy = x, top
    if kind in ('crescent', 'branch', 'totem', 'hammer'):
        s.part('orb', 'gem', z=12.7, shine=1, R=1.6, line=1).ellipse(gx, gy, 2.0, 2.0)
        s.paint([(int(gx) - 1, int(gy) - 1)], '#ffffff')
    s.staff_tip = (gx, gy)

def offhand(s, B, o, view):
    kind = o.get('off', 'orb')
    hx_, hy_ = B.haL
    if view == 'back' and kind not in ('orb', 'flame'): return
    if kind == 'orb':
        cx, cy = hx_ - 0.5, hy_ - 3.6
        s.part('spell', 'spell', z=13, line=0, shine=1, R=2, cast=0).ellipse(cx, cy, 2.5, 2.5)
        s.paint([(int(cx) - 1, int(cy) - 1)], '#ffffff', over=True)
        for (dx, dy) in ((-3, -4), (3, -3), (0, -6), (-4, 0), (2, -8)):
            s.mtone('spell', [(int(cx + dx), int(cy + dy))], 4, over=True)
    elif kind == 'flame':
        cx, cy = hx_ - 0.5, hy_ - 2.5
        f = s.part('spell', 'spell', z=13, line=0, shine=1, R=2, cast=0)
        f.poly([(cx - 2.5, cy + 1), (cx + 2.5, cy + 1), (cx + 2, cy - 3), (cx + 0.5, cy - 7), (cx - 0.5, cy - 4), (cx - 2, cy - 5)])
        s.mtone('spell', [(int(cx), int(cy - 1)), (int(cx), int(cy))], 5)
    elif kind == 'book':
        bk = s.part('book', 'leather', z=12.9, R=2)
        bk.poly([(hx_ - 4, hy_ - 3), (hx_ + 3, hy_ - 4), (hx_ + 4, hy_ + 2), (hx_ - 3, hy_ + 3)])
        s.part('pages', 'paper', z=12.95, R=1.5, line=0).poly([(hx_ - 3, hy_ - 3.5), (hx_ + 3, hy_ - 4.3), (hx_ + 3.2, hy_ - 2.8), (hx_ - 3, hy_ - 2)])

DEFAULT_MATS = {
    'skin': '#d99a78', 'hair': '#5a3a2a', 'beard': '#5a3a2a', 'pants': '#3b3046', 'boot': '#5a3a2a', 'boot2': '#7a5a3a',
    'robe': '#3f4b6c', 'under': '#2b2f45', 'trim': '#c9923e', 'cloth': '#3c6670', 'cape': '#2b3350', 'belt': '#4b3229',
    'gold': '#e2b34a', 'hat': '#3f4b6c', 'hatband': '#8a5a3a', 'wood': '#7a5230', 'leather': '#6b4426', 'gem': '#5fd2ff',
    'bone': '#d8cfb0', 'iron': '#8a8e9a', 'shield': '#8a5a3a', 'wing': '#f0f0f8', 'carapace': '#2a2230', 'blade': '#c8d0dc', 'leaf': '#5aa04a', 'paper': '#e8dcc0', 'spell': '#7fd4ff', 'void': '#120c18',
}

def build(o, view='front', size=SIZE):
    """One sprite from a look spec."""
    race, sex = o.get('race', 'human'), o.get('sex', 'm')
    s = Sprite(size, size)
    for k, v in DEFAULT_MATS.items(): s.mat(k, v)
    for k, v in o.get('pal', {}).items(): s.mat(k, v)
    B = Body(race, sex, cx=o.get('cx', 44), pose=o.get('pose', 'staff'))
    if o.get('back_extra') == 'wings': wings(s, B, o, view)
    if o.get('back_extra') == 'legs': spider_legs(s, B, o, view)
    dress(s, B, o, view); head(s, B, o, view); hat(s, B, o, view); staff(s, B, o, view); offhand(s, B, o, view)
    if o.get('shield'): shield(s, B, o, view)
    if o.get('off') == 'bow': bow(s, B, o, view)
    if view != 'back': face(s, B, o)
    if 'extra' in o: o['extra'](s, B, view)
    return s
