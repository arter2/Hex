#!/usr/bin/env python3
"""Boss animation sheets -> fixed-palette sprite frames (deck/sprites_pal.js).

The sheets (AI-made, in deck/art/bosses/src/, ignored by git) have a title band on top, then
numbered cells on a #00FF00 background with faint lines: a grid (4 x 3, 6 x 3, 6 x 2) or, for
effects, bands of frames of uneven widths. Each cell holds one frame. This script:

  1. cuts every cell, at the sheet's known grid (the lines are too faint to find), or for a band
     at the green gaps between its frames,
  2. keys the background out by flood fill from the cell's edge over green (so the drawn
     ground shadow goes too, but green inside the figure, like the golem's fist gems, stays),
     blanks the cell number in the top-left corner and drops loose specks (pebbles, dust),
  3. scales each animation so its body (median over the frames) is FILL of the frame tall, the
     feet on the frame's 31/32 line and its feet centred (sheets draw the
     boss at different sizes and places); effects are scaled to fit and centred,
  3b. leaves out any frame whose drawing runs off its cell (cut off on the sheet),
  4. reduces all frames of a boss to one shared palette of up to COLORS colors (index 0 is
     transparent), and
  5. writes each animation as one block: its frames' palette indices, one byte a pixel, row by
     row, frame after frame, packed with raw deflate and base64 (about 5x smaller than plain
     run-lengths for shaded art).

art.js (palFrame) decodes them. Run: python3 deck/tools/bosses/pal_sprites.py
"""
import base64, os, sys, zlib
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
DECK = os.path.normpath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(DECK, 'art', 'bosses', 'src')
OUT = os.path.join(DECK, 'sprites_pal.js')

SIZE = 200          # frame size in pixels (square), with room around the body for fists, dust and tall crystals
FILL = .70          # body height (the median over an animation) as a share of the frame
FXFILL = .92        # an effect's largest frame as a share of the frame
COLORS = 127        # palette size, not counting transparent (gold and blue bodies share it)
POCKET = 120        # enclosed green bigger than this (in sheet pixels) is background too
SPECK = 400         # loose bits smaller than this (in sheet pixels) are dropped from bodies

# How a sheet is laid out. grid: cell edges in x and y; strip: frames in one band (y0, y1) found
# by the green gaps between them. label: where the cell number sits ('tl' top left, 'bl' bottom left).
G4 = {'cols': [0, 383, 767, 1151, 1535], 'rows': [59, 388, 705, 1023], 'label': 'tl'}
G6x3 = {'cols': [k * 256 for k in range(7)], 'rows': [59, 359, 671, 1024], 'label': 'tl'}
G6x2 = {'cols': [round(k * 1774 / 6) for k in range(7)], 'rows': [77, 478, 887], 'label': 'tl'}
G4w = {'cols': [round(k * 1774 / 4) for k in range(5)], 'rows': [68, 340, 613, 887], 'label': 'tl'}
G4fx = {'cols': [round(k * 1774 / 4) for k in range(5)], 'rows': [0, 275, 552, 887], 'label': 'tl'}
def strip(y0, y1): return {'strip': (y0, y1), 'label': 'bl'}

# boss -> animation -> sheet, layout, frames per second, and options:
#   frames: which frames of the sheet (1-based, inclusive); fx: an effect (centred, not standing)
BOSSES = {
    'golem': {
        'idle':   dict(sheet='golem_idle.webp', lay=G4, fps=8),
        'walkF':  dict(sheet='golem_walk_fwd.webp', lay=G4, fps=12),
        'walkB':  dict(sheet='golem_walk_back.webp', lay=G4, fps=12),
        'walkL':  dict(sheet='golem_walk_left.webp', lay=G4, fps=12),
        'walkR':  dict(sheet='golem_walk_right.webp', lay=G4, fps=12),
        'hurt':   dict(sheet='golem_hurt.webp', lay=G4, fps=16),
        'throw':  dict(sheet='golem_throw.webp', lay=G4, fps=14),
        'phase':  dict(sheet='golem_phase.webp', lay=G6x3, fps=10),
        # the crystal body (phase 2 and on)
        'idle2':  dict(sheet='golem_crystal_idle.webp', lay=G4w, fps=8),
        # these two sheets draw a slimmer, taller golem: sized by width (wide) to match the others
        'walk2L': dict(sheet='golem_crystal_walk_left.webp', lay=G6x2, fps=12, wide=.65),
        'walk2B': dict(sheet='golem_crystal_walk_back.webp', lay=G6x2, fps=12, wide=.65),
        'angry2': dict(sheet='golem_crystal_angry.webp', lay=G4w, fps=10),
        'fire2':  dict(sheet='golem_crystal_fire.webp', lay=G4w, fps=14),
        # the crystal nova (frames 11-12 fill the whole cell: a flash, left out)
        'nova':   dict(sheet='golem_crystal_burst.webp', lay=G4fx, fps=12, frames=(1, 10), fx=True, like='idle2'),
        'rock':   dict(sheet='golem_rock.webp', lay=strip(60, 222), fps=14, fx=True, rot=True, like='idle'),
        'rockArc':dict(sheet='golem_rock.webp', lay=strip(318, 510), fps=14, fx=True, rot=True, like='idle'),
        'impact': dict(sheet='golem_rock.webp', lay=strip(605, 790), fps=14, fx=True, like='idle'),
        # the crystal shard, drawn flying right and turned to fly down (rot), at the player. It is every
        # light-colored shot (the golem's from phase 2, light enemies', your light cards')
        'shard':    dict(sheet='golem_crystal_shot.webp', lay=strip(320, 600), fps=14, fx=True, rot=True, like='idle2', frames=(1, 8)),
        'shardHit': dict(sheet='golem_crystal_shot.webp', lay=strip(320, 600), fps=14, fx=True, like='idle2', frames=(9, 12)),
    },
}


def bg_like(p):
    r, g, b = p[:3]
    return (g > r + 40 and g > b + 40) or (r > 120 and b > 120 and g < 170)


def key_cell(cell, label='tl', speck=SPECK):
    """RGBA cell with the background (and anything green touching the edge) made clear."""
    w, h = cell.size
    px = cell.load()
    mask = Image.new('L', (w + 2, h + 2), 255)      # 255: could be background
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if not bg_like(px[x, y]):
                mp[x + 1, y + 1] = 0
    ImageDraw.floodfill(mask, (0, 0), 128)            # 128: background reached from the edge
    # green pockets the edge fill cannot reach (between the legs, under an arm) go too, if they
    # are big enough to be background and not a green gem
    seen = bytearray((w + 2) * (h + 2))
    for y0 in range(1, h + 1):
        for x0 in range(1, w + 1):
            if mp[x0, y0] != 255 or seen[y0 * (w + 2) + x0]:
                continue
            comp, stack = [], [(x0, y0)]
            seen[y0 * (w + 2) + x0] = 1
            while stack:
                x, y = stack.pop(); comp.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 < nx <= w and 0 < ny <= h and mp[nx, ny] == 255 and not seen[ny * (w + 2) + nx]:
                        seen[ny * (w + 2) + nx] = 1; stack.append((nx, ny))
            if len(comp) >= POCKET:
                for x, y in comp:
                    mp[x, y] = 128
    out = cell.convert('RGBA')
    op = out.load()
    for y in range(h):
        for x in range(w):
            if mp[x + 1, y + 1] == 128 or (x < 64 and (y < 56 if label == 'tl' else y > h - 42)):   # background, or the cell number
                op[x, y] = (0, 0, 0, 0)
    # take the green fringe off edge pixels
    for y in range(h):
        for x in range(w):
            r, g, b, a = op[x, y]
            if a and g > max(r, b) + 12 and any(0 <= x + dx < w and 0 <= y + dy < h and op[x + dx, y + dy][3] == 0
                                                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                op[x, y] = (r, max(r, b), b, a)
    # drop loose specks (pebbles, dust): keep only pieces of at least SPECK pixels
    seen = bytearray(w * h)
    for s0 in range(w * h):
        if seen[s0] or op[s0 % w, s0 // w][3] == 0:
            continue
        comp, stack = [], [s0]
        seen[s0] = 1
        while stack:
            c = stack.pop(); comp.append(c); x, y = c % w, c // w
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and op[nx, ny][3]:
                    seen[ny * w + nx] = 1; stack.append(ny * w + nx)
        if len(comp) < speck:
            for c in comp:
                op[c % w, c // w] = (0, 0, 0, 0)
    return out


def boxes_of(spec):
    """The sheet's cells as (x0, y0, x1, y1)."""
    lay = spec['lay']
    if 'strip' in lay:
        y0, y1 = lay['strip']
        im = Image.open(os.path.join(SRC, spec['sheet'])).convert('RGB')
        w = im.width
        px = im.load()
        occ = []
        for x in range(w):
            n = 0
            for y in range(y0, y1 - 40, 2):          # above the numbers
                r, g, b = px[x, y]
                if not (g > r + 50 and g > b + 50):
                    n += 1
            occ.append(n > 1)
        runs, start, last = [], None, -99
        for x, v in enumerate(occ):
            if v:
                if start is None or x - last > 10:
                    if start is not None: runs.append((start, last))
                    start = x
                last = x
        if start is not None: runs.append((start, last))
        runs = [r for r in runs if r[1] - r[0] >= 20]
        edges = [0] + [(runs[k][1] + runs[k + 1][0]) // 2 for k in range(len(runs) - 1)] + [w]
        return [(edges[k] + 2, y0, edges[k + 1] - 2, y1) for k in range(len(runs))]
    C, R = lay['cols'], lay['rows']
    return [(C[i] + 3, R[j] + 3, C[i + 1] - 2, R[j + 1] - 2) for j in range(len(R) - 1) for i in range(len(C) - 1)]


def cells(spec):
    im = Image.open(os.path.join(SRC, spec['sheet'])).convert('RGB')
    bxs = boxes_of(spec)
    if 'frames' in spec:
        a, b = spec['frames']; bxs = bxs[a - 1:b]
    for n, bx in enumerate(bxs):
        c = key_cell(im.crop(bx), spec['lay']['label'], 25 if spec.get('fx') else SPECK)
        if spec.get('rot'):   # projectiles are drawn flying right: turn them a quarter clockwise, to fly down at you
            c = c.rotate(-90, expand=True)
        if touches_edge(c):
            CUT.append('%s frame %d' % (spec['sheet'], n + 1 + (spec['frames'][0] - 1 if 'frames' in spec else 0)))
            continue
        yield c


CUT = []   # frames left out because the drawing runs off its cell


def touches_edge(im, m=3, most=40):
    """True if the drawing runs off the cell: more than `most` opaque pixels along one border
    (a few sparkles or a dust speck touching it do not count)."""
    w, h = im.size
    a = im.getchannel('A')
    return any(sum(1 for v in a.crop(box).getdata() if v) > most
               for box in ((0, 0, w, m), (0, h - m, w, h), (0, 0, m, h), (w - m, 0, w, h)))


KS = {}   # each animation's scale, for effects drawn like a body


def build(name, anims):
    frames = {}
    for a, spec in anims.items():
        fs = list(cells(spec))
        bbs = [f.getbbox() or (0, 0, 1, 1) for f in fs]
        if spec.get('like'):       # drawn at the same scale as a body animation (sizes stay true to the art)
            k = KS[spec['like']]
        elif spec.get('fx'):
            big = max(max(b[2] - b[0], b[3] - b[1]) for b in bbs)
            k = FXFILL * SIZE / big
        else:
            hs = sorted(b[3] - b[1] for b in bbs)
            k = FILL * SIZE / hs[len(hs) // 2]
            if spec.get('wide'):   # sized by its median width instead
                ws = sorted(b[2] - b[0] for b in bbs)
                k = spec['wide'] * SIZE / ws[len(ws) // 2]
        KS[a] = k
        frames[a] = []
        for f, bx in zip(fs, bbs):
            w, h = f.size
            sw, sh = max(1, round(w * k)), max(1, round(h * k))
            sm = f.resize((sw, sh), Image.BOX)
            # binary alpha: pixel art has no half-clear pixels
            sm.putalpha(sm.getchannel('A').point(lambda v: 255 if v >= 110 else 0))
            fr = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
            if spec.get('fx'):
                ox = SIZE // 2 - sw // 2
            else:
                # a body is centred on its feet (the bottom sixth of it), not on the cell: sheets
                # sometimes shift the figure over to make room for a raised rock or a beam
                top = f.crop((bx[0], bx[3] - max(1, (bx[3] - bx[1]) // 6), bx[2], bx[3])).getbbox()
                hx = bx[0] + (top[0] + top[2]) / 2 if top else w / 2
                ox = SIZE // 2 - round(hx * k)
            # bodies stand on the 31/32 line; effects keep the cell's centre on the frame's centre
            oy = SIZE // 2 - sh // 2 if spec.get('fx') else round(SIZE * 31 / 32) - round(bx[3] * k)
            # a frame whose drawing would run past the square frame (a beam, a raised rock) is left out
            al = sm.getchannel('A')
            outside = sum(1 for (x, y), v in zip(((x, y) for y in range(sh) for x in range(sw)), al.getdata())
                          if v and not (0 <= ox + x < SIZE and 0 <= oy + y < SIZE))
            if outside > 60:
                CUT.append('%s (%s, past the frame)' % (spec['sheet'], a)); continue
            fr.alpha_composite(sm, (ox, oy)) if ox >= 0 and oy >= 0 else fr.paste(sm, (ox, oy), sm)
            frames[a].append(fr)
    # one palette for every frame of this boss
    opaque = [p for fs in frames.values() for fr in fs for p in fr.getdata() if p[3]]
    sample = Image.new('RGB', (len(opaque), 1))
    sample.putdata([p[:3] for p in opaque])
    q = sample.quantize(COLORS, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[:COLORS * 3]
    pal_img = Image.new('P', (1, 1))
    pal_img.putpalette(pal + pal[:3] * (256 - COLORS))   # pad with the first color, never an extra one
    hexes = ['#%02x%02x%02x' % tuple(pal[i * 3:i * 3 + 3]) for i in range(COLORS)]
    enc = {}
    for a, fs in frames.items():
        raw = bytearray()
        for fr in fs:
            ix = list(fr.convert('RGB').quantize(palette=pal_img, dither=Image.Dither.NONE).getdata())
            al = list(fr.getchannel('A').getdata())
            raw += bytes(min(v, COLORS - 1) + 1 if al[i] else 0 for i, v in enumerate(ix))
        z = zlib.compressobj(9, zlib.DEFLATED, -15)      # raw deflate: the browser's DecompressionStream('deflate-raw')
        enc[a] = base64.b64encode(z.compress(bytes(raw)) + z.flush()).decode()
    return {'size': SIZE, 'zoom': round(.88 / FILL, 3), 'pal': hexes, 'fps': {a: sp['fps'] for a, sp in anims.items()},
            'fx': [a for a, sp in anims.items() if sp.get('fx')], 'anims': enc}


def main():
    import json
    data = {}
    for name, anims in BOSSES.items():
        if all(os.path.exists(os.path.join(SRC, sp['sheet'])) for sp in anims.values()):
            data[name] = build(name, anims)
            print(name, {a: len(v) // 1000 for a, v in data[name]['anims'].items()}, 'kB')
        else:
            print('skip', name, '(sheets missing in', SRC + ')', file=sys.stderr)
    with open(OUT, 'w') as f:
        f.write('/* Hexmancers — boss animations as fixed-palette sprites. Generated by\n'
                '   deck/tools/bosses/pal_sprites.py from the sheets in deck/art/bosses/src/; do not edit.\n'
                '   Each boss: size (square frame, feet on the 31/32 line, facing the viewer), pal (index 1..n;\n'
                '   0 is clear), fps per animation, and anims: per animation, every frame\'s indices (one byte a\n'
                '   pixel, row by row, frame after frame), raw-deflated and base64. art.js (palFrame) decodes them. */\n')
        f.write('const PAL_SPRITES=' + json.dumps(data, separators=(',', ':')) + ';\n')
        f.write("if(typeof module!=='undefined') module.exports={PAL_SPRITES};\n")
    print('left out (cut off):', ', '.join(CUT) or 'none')
    print('wrote', OUT, os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    main()
