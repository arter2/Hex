"""Monsters and bosses on the rig, plus the humanoid enemies and heroes (built with
figure.build). Everything faces right on a 96 x 96 canvas with the feet on row 93; bosses fill
the canvas and are drawn larger by the game."""
import math
from rig import Sprite
import figure

G = 93

def spr(mats):
    s = Sprite(96, 96)
    for k, v in mats.items(): s.mat(k, v)
    return s

def eye(s, x, y, iris='#1a1020', glint='#ffffff', w=2, h=2, white='#f2ece0'):
    s.paint([(x + i, y + j) for i in range(w) for j in range(h)], white)
    s.paint([(x + w - 1, y + j) for j in range(h)], iris)
    s.paint([(x + w - 1, y)], glint)

def glints(s, mat, pts, t=5):
    s.mtone(mat, pts, t)

# ------------------------------------------------------------------ small monsters
def gloop(s=None):
    s = spr(dict(slime={'base': '#4caa3c'}, inner={'base': '#8ad86a'}, mouth='#2a1420', puddle={'base': '#3a8a30'}))
    s.part('puddle', 'puddle', z=0, R=2, bulge=0.3).ellipse(48, 91.5, 24, 2.6)
    b = s.part('body', 'slime', z=1, R=13)
    b.ellipse(48, 78, 21, 15).ellipse(47, 70, 14, 11).ellipse(46, 62, 6, 5)
    b.rect(28, 84, 68, 90).ellipse(32, 89, 5, 3).ellipse(64, 89.5, 6, 3)
    for x, y, r in ((40, 84, 2.2), (56, 80, 1.6), (50, 86, 1.3)):
        s.part('bub', 'inner', z=1.5, line=0, R=1.5).ellipse(x, y, r, r)
    # big glossy shine on the upper left
    s.mtone('slime', [(37, 66), (38, 65), (39, 64), (40, 64), (36, 67), (36, 68), (43, 58), (44, 58)], 5)
    eye(s, 39, 70, w=4, h=5); eye(s, 52, 70, w=4, h=5)
    s.paint([(38, 69), (39, 68), (40, 68)], '#1a3a14'); s.paint([(55, 68), (56, 69), (54, 68)], '#1a3a14')
    s.paint([(x, 79) for x in range(44, 53)] + [(x, 80) for x in range(45, 52)], '#2a1420')
    s.paint([(46, 80), (50, 80)], '#f2ece0'); s.paint([(47, 81), (48, 81), (49, 81)], '#c04a5a')
    return s

def wisp():
    s = spr(dict(fire={'base': '#e8602a'}, core={'base': '#ffd04a'}, hot='#fff4c0'))
    f = s.part('flame', 'fire', z=1, R=10, bulge=0.7)
    f.ellipse(48, 72, 13, 14)
    f.poly([(36, 66), (40, 50), (43, 60), (47, 40), (51, 58), (55, 46), (58, 62), (61, 68)])
    f.poly([(40, 82), (44, 92), (48, 86), (52, 93), (56, 82)])
    for d in (-1, 1):
        s.part('arm%d' % d, 'fire', z=0.5, R=2.5).curve([(48 + d * 11, 72), (48 + d * 17, 70), (48 + d * 20, 62)], 3, 0.8)
    c = s.part('core', 'core', z=2, line=0, R=7)
    c.ellipse(47, 75, 8, 9).poly([(41, 70), (44, 58), (47, 66), (50, 54), (53, 68)])
    s.paint([(46, 78), (47, 78), (48, 79), (46, 79)], '#fff4c0')
    for x in (43, 51):
        s.paint([(x, 71), (x + 1, 71), (x + 2, 72), (x, 72), (x + 1, 72), (x + 1, 73)], '#3a1010')
    s.paint([(46, 77), (47, 77), (48, 77), (49, 77)], '#3a1010')
    for p in ((34, 54), (62, 50), (57, 38), (38, 42)): s.mtone('core', [p], 5, over=True)
    return s

def mite():
    s = spr(dict(shell={'base': '#9ac8e8'}, ice={'base': '#d8f4ff'}, leg={'base': '#4a6a9a'}, belly={'base': '#5a7ab0'}))
    for i in range(3):
        for d in (-1, 1):
            x0 = 48 + d * 8 + i * 4 - 4
            s.part('leg%d%d' % (i, d), 'leg', z=0 if d < 0 else 3, R=1.5).curve([(x0, 80), (x0 + d * 8, 74 - i), (x0 + d * 12 + i * 2, 92)], 1.8, 1.0)
    b = s.part('body', 'shell', z=1, R=10)
    b.ellipse(46, 78, 17, 10).ellipse(62, 76, 7, 6)
    s.part('belly', 'belly', z=1.2, R=4).ellipse(47, 85, 13, 3).clip(b)
    for i, (x, h) in enumerate(((36, 9), (42, 14), (48, 11), (54, 8))):
        s.part('spike%d' % i, 'ice', z=2, shine=1, R=2).poly([(x - 3, 72), (x + 3, 72), (x + 1, 72 - h)])
    for d, y in ((0, 70), (1, 82)):
        cl = s.part('claw%d' % d, 'shell', z=2.5, R=2.5)
        cl.curve([(66, 77 + d * 3), (73, y), (78, y - 2)], 2.5, 2.0)
        cl.poly([(76, y - 6), (84, y - 4), (79, y), (84, y + 3), (76, y + 2)])
    eye(s, 62, 73, iris='#1a2a4a', w=2, h=3); eye(s, 66, 73, iris='#1a2a4a', w=2, h=3)
    s.paint([(66, 80), (67, 80), (68, 80)], '#1a2a4a')
    return s

def beetle():
    s = spr(dict(shell={'base': '#3a4ac0'}, gold={'base': '#f0c030'}, leg={'base': '#22264a'}, spark='#fff6a0', wing={'base': '#8ad8ff'}))
    for i in range(3):
        for d in (-1, 1):
            x0 = 40 + i * 8
            s.part('leg%d%d' % (i, d), 'leg', z=0 if d < 0 else 4, R=1.4).curve([(x0, 82), (x0 + 4 * d + 2, 78), (x0 + 6 * d + 3, 92)], 1.7, 1.0)
    w = s.part('wing', 'wing', z=0.5, R=4, line=1)
    w.poly([(34, 70), (16, 58), (22, 72), (30, 80)])
    b = s.part('shell', 'shell', z=2, R=12)
    b.ellipse(46, 76, 18, 12)
    s.mtone('shell', [(x, 64 + abs(x - 46) // 6) for x in range(44, 48)], 1)
    s.tone('shell', [(46, y) for y in range(66, 87)], 1)
    hd = s.part('head', 'leg', z=2.5, R=5).ellipse(64, 78, 8, 7)
    hn = s.part('horn', 'gold', z=3, shine=1, R=2.5)
    hn.curve([(66, 74), (74, 66), (72, 54)], 3.0, 0.8).curve([(70, 64), (78, 62), (80, 58)], 1.5, 0.5)
    for i, (x, y) in enumerate(((38, 70), (50, 68), (44, 80))):
        s.part('spot%d' % i, 'gold', z=2.2, shine=1, R=2).ellipse(x, y, 2.5, 2)
    eye(s, 66, 77, iris='#1a1020', w=2, h=2, white='#fff080')
    for (x, y) in ((76, 50), (82, 60), (30, 52), (26, 64), (84, 52)):
        s.paint([(x, y), (x + 1, y + 1), (x, y + 2), (x + 1, y + 3)], '#fff6a0', over=True)
    return s

def ram():
    s = spr(dict(wool={'base': '#d8dcf0'}, face={'base': '#4a4a6a'}, horn={'base': '#e0a840'}, hoof={'base': '#2a2a3a'}, bolt='#fff6a0', eye='#ffe066'))
    for i, (x, z) in enumerate(((36, 0), (44, 3), (58, 0), (65, 3))):
        s.part('leg%d' % i, 'hoof', z=z, R=1.8).capsule((x, 80), (x + (1 if i % 2 else -1), 91), 2.2, 2.0).rect(int(x - 2), 89, int(x + 2), 92)
    b = s.part('body', 'wool', z=1, R=12)
    b.ellipse(50, 74, 21, 12)
    for (x, y, r) in ((34, 68, 6), (42, 64, 7), (52, 63, 7), (61, 66, 6), (30, 76, 6), (68, 74, 6), (40, 82, 6), (56, 82, 6)):
        s.part('puff', 'wool', z=1.1, line=3, R=r).ellipse(x, y, r, r * 0.9)
    hd = s.part('head', 'face', z=4, R=6)
    hd.ellipse(76, 66, 7, 8).poly([(76, 60), (86, 68), (84, 74), (76, 74)])
    s.part('tuft', 'wool', z=4.5, R=3).ellipse(73, 59, 6, 4)
    h = s.part('horn', 'horn', z=5, shine=1, R=2.5)
    h.curve([(72, 60), (64, 54), (60, 62), (66, 68)], 3.0, 1.5, steps=30)
    for k in range(4): s.tone('horn', [(62 + k * 2, 56 + (k % 2) * 2)], 2)
    s.paint([(78, 64), (79, 64), (79, 65)], '#ffe066'); s.paint([(79, 65)], '#1a1020')
    s.paint([(85, 70), (84, 70)], '#1a1020')
    for (x, y) in ((40, 54), (48, 50), (58, 54)):
        s.paint([(x, y), (x + 1, y + 1), (x, y + 2), (x + 1, y + 3), (x + 2, y + 3)], '#fff6a0', over=True)
    return s

def shade(crown=False, cape=None, tone='#4a3a6a'):
    s = spr(dict(cloak={'base': tone}, void='#0e0814', eye='#c8a0ff', claw={'base': '#8a7aa8'}, gold={'base': '#f0c040'}, cape={'base': cape or '#6a1a2a'}))
    if cape:
        s.part('cape', 'cape', z=0, R=10).poly([(34, 44), (64, 44), (74, 90), (64, 86), (56, 92), (46, 87), (36, 93), (26, 86)])
    c = s.part('cloak', 'cloak', z=1, R=10)
    c.ellipse(48, 42, 11, 12)
    c.poly([(38, 42), (58, 42), (64, 70), (68, 92), (61, 85), (56, 92), (50, 85), (45, 93), (39, 85), (33, 92), (30, 80), (34, 62)])
    for d in (-1, 1):
        a = s.part('arm%d' % d, 'cloak', z=2, R=3, line=3)
        a.curve([(48 + d * 9, 52), (48 + d * 16, 62), (48 + d * 18, 70)], 3.5, 2.8)
        for k in range(3):
            s.part('cl%d%d' % (d, k), 'claw', z=2.5, R=1).curve([(48 + d * 18 - 1 + k, 72), (48 + d * 18 - 1 + k + d, 76), (48 + d * 18 - 2 + k + d * 2, 79)], 0.9, 0.5)
    v = s.part('face', 'void', z=1.5, line=0, R=4)
    v.ellipse(50, 45, 7, 7.5)
    for x in (46, 52): s.paint([(x, 44), (x + 1, 44), (x + 2, 44), (x + 1, 45)], '#e0c0ff')
    s.paint([(47, 44), (53, 44)], '#ffffff')
    for (x0, x1, y0) in ((42, 38, 58), (52, 54, 60), (58, 63, 64)):
        figure.fold(s, 'cloak', x0, y0, x1, 86, 2)
    if crown:
        cr = s.part('crown', 'gold', z=3, shine=1, R=1.5)
        cr.rect(39, 31, 59, 33)
        for x in (40, 45, 50, 55, 59):
            cr.poly([(x - 1.8, 32), (x, 24 + (2 if x in (40, 59) else 0)), (x + 1.8, 32)])
        s.paint([(49, 32), (50, 32)], '#ff3a4a'); s.paint([(44, 32), (55, 32)], '#7ad8ff')
    return s

def halo_sprite():
    s = spr(dict(wing={'base': '#e8f4ff'}, skin={'base': '#f4d0b0'}, dress={'base': '#f0e090'}, hair={'base': '#f8e070'}, halo={'base': '#ffe066'}))
    for d, (tx, ty) in ((-1, (24, 50)), (1, (72, 50))):
        w = s.part('wing%d' % d, 'wing', z=0, R=5, line=1)
        w.poly([(48, 64), (tx, ty), (tx + d * -2, ty + 10), (48 + d * 4, 72)])
        w.poly([(48, 70), (48 + d * 18, 78), (48 + d * 8, 82)])
        s.tone('wing%d' % d, [(int(48 + (tx - 48) * k / 8), int(64 + (ty - 64) * k / 8) + 3) for k in range(2, 7)], 2)
    d = s.part('dress', 'dress', z=2, R=5).poly([(44, 64), (52, 64), (56, 80), (50, 82), (40, 80)])
    for dd in (-1, 1):
        s.part('arm%d' % dd, 'skin', z=1.5 if dd < 0 else 3, R=1.2).curve([(48 + dd * 3, 66), (48 + dd * 7, 70), (48 + dd * 9, 66)], 1.4, 1.1)
        s.part('leg%d' % dd, 'skin', z=1.5, R=1.2).capsule((48 + dd * 2, 80), (48 + dd * 3, 88), 1.4, 1.0)
    h = s.part('head', 'skin', z=3, R=4).ellipse(48.5, 58, 5.5, 6)
    s.part('hair', 'hair', z=3.5, R=3).ellipse(48, 54.5, 6.5, 4.5).poly([(42, 56), (44, 62), (46, 56)])
    eye(s, 46, 58, iris='#3a6aa8', w=1, h=2); eye(s, 50, 58, iris='#3a6aa8', w=1, h=2)
    s.tone('head', [(48, 62), (49, 62)], 1)
    s.part('halo', 'halo', z=4, shine=1, line=0, R=1).ellipse(48, 47, 7, 2.2).ellipse(48, 47, 5, 1.0, erase=True)
    for (x, y) in ((30, 40), (68, 38), (26, 80), (72, 84), (60, 30)):
        s.paint([(x, y)], '#ffffff', over=True); s.paint([(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)], '#fff4a0', over=True)
    return s

def golem(scale=1.0):
    s = spr(dict(stone={'base': '#a8a090'}, dark={'base': '#6a6458'}, core={'base': '#ffe070'}, moss={'base': '#7a9a4a'}, rune='#fff4b0'))
    for d, x in ((-1, 38), (1, 58)):
        s.part('leg%d' % d, 'dark', z=0.5, R=5).rect(x - 6, 76, x + 6, 92).ellipse(x, 90, 8, 3)
    t = s.part('torso', 'stone', z=1, R=14)
    t.poly([(26, 40), (70, 38), (74, 56), (66, 78), (30, 78), (22, 56)])
    s.part('belly', 'dark', z=1.2, R=5).poly([(32, 70), (64, 70), (62, 80), (34, 80)])
    hd = s.part('head', 'stone', z=2, R=6).poly([(40, 26), (56, 26), (58, 38), (38, 38)])
    s.paint([(43, 31), (44, 31), (45, 31), (51, 31), (52, 31), (53, 31)], '#ffe070'); s.paint([(44, 31), (52, 31)], '#ffffff')
    for d, (sx, hx) in ((-1, (24, 16)), (1, (72, 82))):
        sh = s.part('shoulder%d' % d, 'stone', z=3, R=7).ellipse(sx, 44, 9, 8)
        ar = s.part('arm%d' % d, 'stone', z=2.5 if d < 0 else 3.5, R=5, line=3).capsule((sx, 48), (hx, 66), 6, 5)
        fi = s.part('fist%d' % d, 'dark', z=3.6, R=5).ellipse(hx, 72, 7.5, 7)
        s.tone('fist%d' % d, [(hx - 3, 73), (hx, 73), (hx + 3, 73)], 1)
    co = s.part('core', 'core', z=1.5, shine=1, R=4, line=1).ellipse(48, 56, 6, 6)
    s.paint([(46, 54), (47, 54)], '#ffffff')
    for (x0, y0, x1, y1) in ((30, 46, 36, 54), (60, 44, 64, 52), (52, 64, 58, 70), (26, 60, 30, 66)):
        n = 6
        s.tone('torso', [(int(x0 + (x1 - x0) * k / n), int(y0 + (y1 - y0) * k / n)) for k in range(n + 1)], 1)
    for (x, y) in ((28, 42), (30, 41), (64, 40), (66, 41), (20, 42), (76, 44)):
        s.mtone('moss', [(x, y), (x + 1, y)], 3)
    for (x, y) in ((40, 48), (56, 48), (48, 66)):
        s.paint([(x, y), (x + 1, y), (x, y + 1)], '#fff4b0')
    return s

# ------------------------------------------------------------------ bosses and helpers
def treant():
    s = spr(dict(bark={'base': '#7a5a3a'}, dark={'base': '#4a3424'}, leaf={'base': '#4a9a3a'}, leaf2={'base': '#78c050'}, glow='#d0ff70', moss={'base': '#6a8a3a'}))
    for i, (x0, x1) in enumerate(((40, 26), (46, 44), (54, 58), (58, 72))):
        s.part('root%d' % i, 'dark', z=0.5, R=3).curve([(x0, 78), ((x0 + x1) / 2, 86), (x1, 92)], 4, 1.5)
    t = s.part('trunk', 'bark', z=1, R=12).poly([(34, 40), (62, 40), (64, 60), (62, 84), (34, 84), (32, 60)])
    for x in (37, 43, 52, 58):
        s.tone('trunk', [(x + (y % 7 == 0), y) for y in range(46, 82)], 1)
        s.tone('trunk', [(x - 1, y) for y in range(48, 80, 3)], 4)
    for d, pts in ((-1, [(36, 48), (22, 46), (12, 34), (8, 26)]), (1, [(60, 48), (74, 50), (84, 38), (88, 30)])):
        a = s.part('arm%d' % d, 'bark', z=2, R=4, line=3).curve(pts, 5, 2)
        s.part('twig%d' % d, 'dark', z=2.1, R=1).curve([pts[2], (pts[2][0] + d * 6, pts[2][1] - 4), (pts[2][0] + d * 6, pts[2][1] - 10)], 1.4, 0.5)
    canopy = [(48, 26, 22, 14), (30, 30, 12, 9), (66, 28, 12, 9), (40, 16, 10, 8), (58, 16, 10, 8), (14, 22, 7, 6), (84, 24, 7, 6)]
    for i, (x, y, rx, ry) in enumerate(canopy):
        s.part('leaves%d' % i, 'leaf', z=3 + i * 0.01, line=3, R=min(rx, ry)).ellipse(x, y, rx, ry)
    for i, (x, y) in enumerate(((36, 18), (52, 12), (62, 22), (26, 26), (46, 28))):
        s.part('lit%d' % i, 'leaf2', z=3.2, line=0, R=2).ellipse(x, y, 4, 2.5)
    # the face in the bark: glowing eyes under a heavy brow, a knot of a mouth
    s.part('brow', 'dark', z=1.5, R=2).poly([(38, 52), (58, 52), (56, 55), (40, 55)])
    for x in (41, 52):
        s.paint([(x, 56), (x + 1, 56), (x + 2, 56), (x, 57), (x + 1, 57), (x + 2, 57)], '#203010'); s.paint([(x + 1, 56), (x + 1, 57)], '#d0ff70')
    s.part('mouth', 'dark', z=1.5, R=2, line=0).ellipse(48, 68, 5, 3)
    s.paint([(46, 68), (47, 68), (48, 68), (49, 68), (50, 68)], '#1a1008')
    for (x, y) in ((36, 44), (60, 46), (34, 70)):
        s.mtone('moss', [(x, y), (x + 1, y), (x, y + 1)], 3)
    for (x, y) in ((20, 50), (76, 56), (30, 8)):
        s.paint([(x, y)], '#d0ff70', over=True)
    return s

def wyrm():
    s = spr(dict(scale={'base': '#b0402a'}, belly={'base': '#f0a040'}, horn={'base': '#2a1a1a'}, lava={'base': '#ff8a20'}, rock={'base': '#3a2a2a'}, eye='#fff070'))
    s.part('pool', 'lava', z=0, R=3, bulge=0.4, line=0).ellipse(48, 90, 34, 4.5)
    s.part('rim', 'rock', z=0.2, R=2).ellipse(48, 92, 36, 2.5).ellipse(48, 90, 33, 4.2, erase=True)
    b = s.part('coil', 'scale', z=1, R=9)
    b.curve([(18, 88), (22, 74), (40, 74), (56, 82)], 8, 6)
    nk = s.part('neck', 'scale', z=2, R=7, line=3)
    nk.curve([(50, 84), (66, 76), (68, 54), (58, 40)], 7.5, 5.5, steps=30)
    s.part('belly', 'belly', z=2.2, R=3, line=0).curve([(54, 84), (70, 74), (72, 56), (62, 44)], 3, 2.2, steps=30).clip(nk)
    for k in range(6):
        y = 50 + k * 5; s.tone('belly', [(x, y) for x in range(60, 76)], 2)
    hd = s.part('head', 'scale', z=3, R=6)
    hd.ellipse(58, 36, 9, 7).poly([(60, 31), (80, 36), (80, 41), (60, 43)])
    s.part('jaw', 'belly', z=2.9, R=2).poly([(60, 40), (78, 41), (76, 45), (60, 45)])
    for k in range(3): s.paint([(66 + k * 4, 42), (67 + k * 4, 43)], '#f4ead0')
    for d, (tx, ty) in enumerate(((44, 20), (50, 18))):
        s.part('horn%d' % d, 'horn', z=3.5 - d, R=1.5).curve([(54 + d * 4, 31), (50 + d * 2, 25), (tx, ty)], 2.4, 0.6)
    for i in range(6):
        x, y = 48 + i * 3, 72 - i * 6
        s.part('spine%d' % i, 'horn', z=1.8, R=1).poly([(x - 2, y + 2), (x - 6, y - 3), (x + 1, y)])
    s.paint([(64, 34), (65, 34), (66, 34), (65, 35)], '#fff070'); s.paint([(66, 34)], '#1a0a0a')
    s.paint([(79, 37)], '#1a0a0a')
    for (x0, y0) in ((26, 78), (40, 76), (62, 66), (66, 56)):
        s.paint([(x0, y0), (x0 + 1, y0 + 1), (x0 + 1, y0 + 2), (x0 + 2, y0 + 3)], '#ffb030')
    for (x, y) in ((30, 82), (70, 84), (20, 80)):
        s.paint([(x, y), (x, y - 2)], '#ffd060', over=True)
    return s

def roc():
    s = spr(dict(feather={'base': '#4a5aa0'}, wing={'base': '#3a4a8a'}, chest={'base': '#d8d0b0'}, beak={'base': '#f0c040'}, talon={'base': '#2a2a3a'}, bolt='#fff6a0'))
    for d in (-1, 1):
        w = s.part('wing%d' % d, 'wing', z=0 if d < 0 else 4, R=7, line=3)
        tip = (48 + d * 44, 22)
        w.poly([(48 + d * 6, 46), tip, (48 + d * 40, 34), (48 + d * 44, 40), (48 + d * 34, 50), (48 + d * 38, 56), (48 + d * 22, 62), (48 + d * 8, 60)])
        for k in range(4):
            s.tone('wing%d' % d, [(int(48 + d * (14 + k * 7) + d * j * 0.4), 44 + k * 2 + j) for j in range(0, 10)], 2)
    b = s.part('body', 'feather', z=2, R=10).ellipse(48, 62, 12, 16)
    s.part('chest', 'chest', z=2.2, R=5).ellipse(52, 64, 7, 11).clip(b)
    for k in range(4): s.tone('chest', [(x, 58 + k * 4) for x in range(48, 58, 2)], 2)
    hd = s.part('head', 'feather', z=3, R=6).ellipse(54, 42, 8, 7)
    s.part('crest', 'feather', z=2.9, R=2).poly([(48, 40), (40, 30), (50, 36), (46, 26), (54, 36)])
    s.part('beak', 'beak', z=3.2, shine=1, R=2).poly([(60, 40), (70, 43), (66, 46), (60, 47)])
    s.paint([(56, 40), (57, 40), (57, 41)], '#fff6a0'); s.paint([(57, 41)], '#101020')
    for d, x in ((-1, 43), (1, 53)):
        s.part('leg%d' % d, 'beak', z=1.5, R=1.5).capsule((x, 74), (x, 86), 2, 1.6)
        s.part('talon%d' % d, 'talon', z=1.6, R=1).poly([(x - 4, 86), (x + 5, 86), (x + 6, 92), (x - 5, 92)])
    for (x0, y0) in ((20, 14), (78, 12), (60, 22)):
        s.paint([(x0, y0), (x0 + 1, y0 + 1), (x0, y0 + 2), (x0 + 1, y0 + 3), (x0 + 2, y0 + 4)], '#fff6a0', over=True)
    return s

def rootnode():
    s = spr(dict(bark={'base': '#6a4a2a'}, glow={'base': '#a0ff6a'}, leaf={'base': '#4a9a3a'}))
    for i, (x0, x1) in enumerate(((42, 30), (46, 44), (52, 54), (56, 66))):
        s.part('r%d' % i, 'bark', z=0, R=2).curve([(x0, 82), ((x0 + x1) / 2, 88), (x1, 92)], 3, 1.2)
    s.part('stump', 'bark', z=1, R=8).poly([(38, 70), (58, 70), (60, 88), (36, 88)]).ellipse(48, 70, 10, 3)
    s.part('seed', 'glow', z=2, shine=1, R=4).ellipse(48, 62, 5, 7)
    s.paint([(46, 59), (46, 60)], '#ffffff')
    for d in (-1, 1): s.part('lf%d' % d, 'leaf', z=1.5, R=2).ellipse(48 + d * 7, 56, 4, 2)
    return s

def sapling():
    s = spr(dict(bark={'base': '#7a5a3a'}, leaf={'base': '#5aaa40'}, eye='#e0ff80'))
    for d in (-1, 1):
        s.part('leg%d' % d, 'bark', z=0, R=1.5).curve([(48 + d * 2, 78), (48 + d * 5, 85), (48 + d * 7, 92)], 2, 1.4)
    s.part('trunk', 'bark', z=1, R=4).capsule((48, 80), (48, 62), 4, 3)
    for d in (-1, 1): s.part('arm%d' % d, 'bark', z=1.5, R=1).curve([(48 + d * 3, 70), (48 + d * 9, 66), (48 + d * 11, 60)], 1.5, 0.8)
    for i, (x, y, r) in enumerate(((48, 54, 9), (40, 58, 6), (56, 58, 6), (48, 46, 6))):
        s.part('lv%d' % i, 'leaf', z=2 + i * 0.01, line=3, R=r).ellipse(x, y, r, r * 0.8)
    for x in (45, 50): s.paint([(x, 70), (x + 1, 70)], '#e0ff80')
    return s

# ------------------------------------------------------------------ people (rig figures)
def person(o, view='front'):
    return figure.build(o, view)

UNITS = {}
def unit(uid, fn): UNITS[uid] = fn

for uid, fn in (('gloop', gloop), ('gloopling', gloop), ('wisp', wisp), ('mite', mite), ('beetle', beetle), ('ram', ram),
                ('shade', shade), ('sprite', halo_sprite), ('golem', golem), ('treant', treant), ('wyrm', wyrm), ('roc', roc),
                ('rootnode', rootnode), ('sapling', sapling)):
    unit(uid, fn)
unit('hollow', lambda: shade(crown=True, cape='#5a1a2a', tone='#3a2a56'))
unit('clone', lambda: shade(tone='#2e2244'))

import cast as _cast
for _pid, _o in _cast.PEOPLE.items():
    unit(_pid, (lambda o: lambda: figure.build(o, 'front'))(_o))

def build(uid):
    return UNITS[uid]()
