"""Hand-placed wizard sprite, painted as runs of pixels per row (x0, x1, color code).
Light comes from the upper left; shadows shift cool, highlights warm; the outline is a soft
dark violet-black, not pure black."""
import os
from PIL import Image

W, H = 44, 60
PAL = {
    'o': '#1b1726',                                        # outline
    'A': '#2b3350', 'B': '#3f4b6c', 'C': '#5b6a8c', 'D': '#8394b2',   # hat (slate blue)
    'n': '#4a2b26', 'N': '#7a4a35',                        # hat band (leather)
    'y': '#c9923e', 'Y': '#f2d38a',                        # gold
    'k': '#1f1c2b', 'K': '#3a3550',                        # hair
    's': '#7a4c47', 'S': '#c98a6e', 'T': '#efbf9c',        # skin
    'e': '#8fe4ff', 'E': '#ffffff',                        # eye glow
    'q': '#24414a', 'Q': '#3c6670', 'R': '#6b98a0', 'P': '#a3c7c9',   # scarf and capelet (teal)
    'r': '#1d2236', 'u': '#2c3550', 'U': '#43507a', 'V': '#61719c', 'W': '#8a9cc0',   # robe
    'l': '#2a1d1c', 'L': '#4b3229', 'M': '#73503b', 'm': '#9c7350',   # leather and boots
    'w': '#3a2418', 'x': '#6b4426', 'X': '#9a6a3c', 'Z': '#c4935a',   # staff wood
    'g': '#5fd2ff', 'G': '#e8fbff', 'j': '#1b5a85',        # staff gem
    'b': '#2c2a3a', 'p': '#d9d2c0', 'z': '#39ff8a', 'Z2': '#b6ffd3',  # book cover, pages, glow
}
RUNS = {}
def run(y, *segs):
    RUNS.setdefault(y, []).extend(segs)

# ---------- staff: a hooked crescent head with a gem, then a long shaft ----------
for y in range(9, 58): run(y, (8, 8, 'X'), (9, 9, 'w'))
run(2, (6, 8, 'x')); run(3, (4, 5, 'x'), (6, 8, 'X'), (9, 9, 'w'))
run(4, (3, 3, 'x'), (4, 4, 'X'), (5, 6, 'Z'), (9, 10, 'x'))
run(5, (3, 3, 'x'), (4, 4, 'X'), (6, 7, 'j'), (10, 10, 'x'))
run(6, (3, 3, 'w'), (4, 4, 'X'), (5, 5, 'j'), (6, 6, 'g'), (7, 7, 'G'), (10, 10, 'X'))
run(7, (4, 4, 'x'), (5, 5, 'j'), (6, 7, 'g'), (10, 10, 'x'))
run(8, (4, 5, 'w'), (6, 6, 'j'), (8, 9, 'x'), (10, 10, 'w'))
run(9, (5, 7, 'w'))
# a wrap of leather below the head
for y in (11, 12): run(y, (8, 9, 'M' if y == 11 else 'L'))

# ---------- hat: a tall floppy cone leaning left, the tip folding over ----------
crown = {0: (9, 12), 1: (8, 14), 2: (10, 17), 3: (12, 20), 4: (13, 22), 5: (14, 23), 6: (15, 24),
         7: (16, 25), 8: (16, 26), 9: (16, 27), 10: (16, 28)}
for y, (a, b) in crown.items():
    n = b - a
    run(y, (a, a + max(1, n // 4), 'D' if y > 2 else 'C'), (a + max(1, n // 4) + 1, a + n // 2, 'C'),
        (a + n // 2 + 1, b - 2, 'B'), (b - 1, b, 'A'))
run(1, (7, 7, 'A')); run(2, (8, 9, 'A'))                     # the tip folding down
for y in (5, 6, 7): run(y, (19 + y - 5, 19 + y - 5, 'A'))       # a crease across the crown
run(11, (15, 16, 'N'), (17, 18, 'n'), (19, 20, 'y'), (21, 21, 'Y'), (22, 28, 'n'))   # band with a buckle
run(12, (15, 16, 'N'), (17, 18, 'n'), (19, 20, 'y'), (21, 21, 'y'), (22, 29, 'n'))
# the brim, wide and drooping at both ends
run(13, (10, 16, 'D'), (17, 22, 'C'), (23, 31, 'B'), (32, 34, 'A'))
run(14, (7, 10, 'C'), (11, 24, 'C'), (25, 34, 'B'), (35, 37, 'A'))
run(15, (5, 7, 'B'), (8, 30, 'B'), (31, 38, 'A'))
run(16, (5, 8, 'A'), (9, 35, 'A'), (36, 39, 'u'))
run(17, (6, 10, 'u'), (34, 38, 'u'))
run(18, (7, 8, 'u'), (36, 37, 'u'))

# ---------- face, hidden under the brim: hair, two glowing eyes, the scarf over the mouth ----------
run(17, (14, 16, 'k'), (17, 27, 'k'), (28, 30, 'k'))
run(18, (14, 16, 'k'), (17, 17, 'K'), (18, 26, 's'), (27, 27, 'K'), (28, 30, 'k'))
run(19, (15, 16, 'k'), (17, 17, 's'), (18, 19, 'S'), (20, 20, 'e'), (21, 22, 'S'), (23, 23, 's'), (24, 24, 'e'), (25, 26, 's'), (27, 29, 'k'))
run(20, (15, 16, 'k'), (17, 18, 'S'), (19, 20, 'T'), (21, 23, 'S'), (24, 26, 's'), (27, 29, 'k'))
run(21, (15, 16, 'k'), (17, 17, 'R'), (18, 21, 'P'), (22, 24, 'R'), (25, 27, 'Q'), (28, 29, 'k'))
run(22, (15, 16, 'R'), (17, 21, 'P'), (22, 25, 'R'), (26, 28, 'Q'), (29, 29, 'q'))
run(23, (14, 15, 'R'), (16, 20, 'R'), (21, 25, 'Q'), (26, 29, 'q'), (30, 30, 'q'))
# capelet over the shoulders
run(24, (13, 14, 'R'), (15, 19, 'R'), (20, 26, 'Q'), (27, 31, 'q'))
run(25, (12, 13, 'R'), (14, 18, 'R'), (19, 27, 'Q'), (28, 32, 'q'))
run(26, (11, 12, 'P'), (13, 17, 'R'), (18, 28, 'Q'), (29, 33, 'q'))
run(27, (11, 12, 'R'), (13, 18, 'R'), (19, 28, 'Q'), (29, 33, 'q'))
run(28, (11, 14, 'Q'), (15, 27, 'Q'), (28, 33, 'q'))
run(29, (12, 13, 'q'), (14, 30, 'q'), (31, 32, 'q'))
for x in range(12, 33, 4): run(29, (x, x + 1, 'Q')); run(30, (x + 1, x + 2, 'q'))
run(27, (14, 16, 'P')); run(24, (15, 17, 'P'))
run(26, (20, 20, 'y'))                                         # a gold clasp
# the scarf tail falling behind the right shoulder
for y in range(27, 35): run(y, (33, 34, 'q' if y % 3 else 'Q'))

# ---------- robe: open coat over a darker tunic, narrow at the waist, flaring to a ragged hem ----------
def span(y):
    if y <= 36: return 14 + (y - 30) // 4, 30 - (y - 30) // 4
    return 15 - (y - 36) // 3, 29 + (y - 36) // 3
for y in range(30, 52):
    a, b = span(y); t0 = 21 - max(0, (y - 38) // 4); t1 = 23 + max(0, (y - 38) // 4)
    run(y, (a, a, 'W'), (a + 1, t0 - 2, 'V'), (t0 - 1, t0 - 1, 'y'), (t0, t1, 'u'), (t1 + 1, t1 + 1, 'y'), (t1 + 2, b - 2, 'U'), (b - 1, b, 'u'))
    if y > 40: run(y, (a + 3, a + 3, 'U'), (b - 4, b - 4, 'u'))        # folds
    if y > 44: run(y, (a + 6, a + 6, 'U'), (t1 + 4, t1 + 4, 'u'))
for y in (37, 38):
    a, b = span(y); run(y, (a, 20, 'L' if y == 37 else 'l'), (21, 22, 'y'), (23, 23, 'Y' if y == 37 else 'y'), (24, b, 'L' if y == 37 else 'l'))
for y in range(39, 44): run(y, (25, 29, 'M' if y < 41 else 'L'), (30, 30, 'l'))
run(39, (25, 29, 'm')); run(41, (27, 27, 'y'))
# ragged hem: the coat's edge drops lower at the front corners
a, b = span(51); run(52, (a, a + 3, 'U'), (b - 4, b - 1, 'u')); run(53, (a, a + 1, 'u'), (b - 2, b - 1, 'r'))
for y in (50, 51):
    a, b = span(y); run(y, (a + 2, b - 2, 'r' if y == 51 else 'u'))

# ---------- arms: bell sleeves; the right hand grips the staff, the left holds a glowing spellbook ----------
for y in range(29, 38):
    w = (y - 29) // 3
    run(y, (12 - w, 12 - w, 'W'), (13 - w, 14, 'V' if y < 34 else 'U'), (15, 15, 'u'))
run(37, (9, 15, 'u')); run(38, (9, 14, 'r'))
run(39, (7, 7, 'S'), (8, 9, 'T'), (10, 11, 'S'), (12, 12, 's'))
run(40, (7, 7, 's'), (8, 9, 'S'), (10, 12, 's'))
for y in range(29, 38):
    w = (y - 29) // 3
    run(y, (29, 29, 'u'), (30, 32 + w, 'U' if y < 33 else 'u'), (33 + w, 33 + w, 'r'))
run(37, (30, 35, 'r'))
run(38, (33, 35, 'S')); run(39, (33, 35, 's'))
# the book, held out to the side
for y in range(31, 41): run(y, (35, 41, 'b'))
run(31, (35, 41, 'p')); run(32, (36, 41, 'p'))
for y in range(33, 40): run(y, (36, 36, 'j'))
run(34, (38, 40, 'g')); run(35, (38, 38, 'g')); run(36, (38, 40, 'g')); run(37, (40, 40, 'g'))

# ---------- legs and boots ----------
for y in range(52, 54): run(y, (15, 19, 'r'), (24, 28, 'r'))
run(52, (15, 16, 'u')); run(52, (24, 25, 'u'))
run(54, (14, 19, 'M'), (23, 28, 'L'))
run(55, (14, 15, 'm'), (16, 19, 'M'), (23, 24, 'M'), (25, 28, 'L'))
run(56, (14, 19, 'L'), (23, 28, 'l'))
run(57, (13, 20, 'L'), (23, 29, 'l'))
run(58, (12, 20, 'l'), (23, 30, 'l'))
run(57, (13, 14, 'M'))

def render():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = img.load()
    for y, segs in RUNS.items():
        for (a, b, c) in segs:
            for x in range(a, b + 1):
                if 0 <= x < W and 0 <= y < H: px[x, y] = hx(PAL[c])
    # soft outline around the whole figure
    src = img.copy().load()
    for y in range(H):
        for x in range(W):
            if src[x, y][3]: continue
            if any(0 <= x + dx < W and 0 <= y + dy < H and src[x + dx, y + dy][3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = hx(PAL['o'])
    # the book's green glow: a ring one pixel outside its outline
    book = [(x, y) for y in range(29, 43) for x in range(33, 44)]
    O = hx(PAL['o'])
    for (x, y) in book:
        if x >= W: continue
        if px[x, y][3] == 0 and any(0 <= x + dx < W and px[x + dx, y + dy] == hx(PAL['o']) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= y + dy < H):
            px[x, y] = hx(PAL['z'])
    return img

def hx(h):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)

def back(front):
    im = front.transpose(Image.FLIP_LEFT_RIGHT); px = im.load()
    H_ = {hx(PAL[c])[:3]: c for c in PAL}
    def code(x, y): return H_.get(px[x, y][:3])
    for y in range(H):
        for x in range(W):
            c = code(x, y); mx = W - 1 - x
            if 17 <= y <= 20 and 14 <= mx <= 30 and c in ('s', 'S', 'T', 'e', 'E', 'K'):
                px[x, y] = hx(PAL['K' if (x * 7 + y * 3) % 11 == 0 else 'k'])
            if 21 <= y <= 23 and c in ('P', 'R'): px[x, y] = hx(PAL['Q'])
            if 11 <= y <= 12 and c in ('y', 'Y'): px[x, y] = hx(PAL['n'])
            if 30 <= y <= 53 and 18 <= mx <= 26 and c in ('y', 'u', 'r'):
                px[x, y] = hx(PAL['U' if mx < 22 else 'u']) if y < 52 else px[x, y]
            if y == 26 and c == 'y': px[x, y] = hx(PAL['Q'])
            if 35 <= y <= 40 and c == 'g': px[x, y] = hx(PAL['b'])     # back cover: no rune
    for y in range(31, 51, 2): px[W - 1 - 22, y] = hx(PAL['u'])          # centre seam
    return im

if __name__ == '__main__':
    im = render(); out = os.path.join(os.path.dirname(__file__), 'out'); os.makedirs(out, exist_ok=True)
    im.save(os.path.join(out, 'hand_front.png')); bk = back(im); bk.save(os.path.join(out, 'hand_back.png'))
    bg = Image.new('RGBA', (W * 20 + 30, H * 10 + 20), (150, 152, 156, 255)); bg.alpha_composite(im.resize((W * 10, H * 10), Image.NEAREST), (10, 10)); bg.alpha_composite(bk.resize((W * 10, H * 10), Image.NEAREST), (W * 10 + 20, 10))
    bg.save(os.path.join(os.path.dirname(__file__), 'hand_preview.png')); print('ok')
