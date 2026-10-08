#!/usr/bin/env python3
"""Boss animation sheets -> fixed-palette sprite frames (deck/sprites_pal.js).

The sheets (AI-made, in deck/art/bosses/src/, ignored by git) are 1536 x 1024: a title band on
top, then 4 columns x 3 rows of numbered cells on a #00FF00 background with thin magenta lines.
Each cell holds one frame. This script:

  1. cuts every cell at the known grid (the lines are too faint on some sheets to detect),
  2. keys the background out by flood fill from the cell's edge over green (so the drawn
     ground shadow goes too, but green inside the figure, like the golem's fist gems, stays),
     blanks the cell number in the top-left corner and drops loose specks (pebbles, dust),
  3. scales every frame of a boss by one factor, so the body is FILL of the frame tall, with
     the feet on the frame's 31/32 line and the cell's centre on the frame's centre,
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

SIZE = 160          # frame size in pixels (square)
FILL = .88          # body height as a share of the frame
COLORS = 63         # palette size, not counting transparent
SPECK = 400         # loose bits smaller than this (in sheet pixels) are dropped
COLS = [0, 383, 767, 1151, 1535]
ROWS = [59, 388, 705, 1023]

# boss -> animation -> (sheet file, frames per second)
BOSSES = {
    'golem': {
        'idle':  ('golem_idle.webp', 8),
        'walkF': ('golem_walk_fwd.webp', 12),
        'walkB': ('golem_walk_back.webp', 12),
        'walkL': ('golem_walk_left.webp', 12),
        'walkR': ('golem_walk_right.webp', 12),
    },
}


def bg_like(p):
    r, g, b = p[:3]
    return (g > r + 40 and g > b + 40) or (r > 120 and b > 120 and g < 170)


def key_cell(cell):
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
    out = cell.convert('RGBA')
    op = out.load()
    for y in range(h):
        for x in range(w):
            if mp[x + 1, y + 1] == 128 or (x < 64 and y < 56):   # background, or the cell number
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
        if len(comp) < SPECK:
            for c in comp:
                op[c % w, c // w] = (0, 0, 0, 0)
    return out


def cells(sheet):
    im = Image.open(os.path.join(SRC, sheet)).convert('RGB')
    for j in range(3):
        for i in range(4):
            x0, x1, y0, y1 = COLS[i] + 3, COLS[i + 1] - 2, ROWS[j] + 3, ROWS[j + 1] - 2
            yield key_cell(im.crop((x0, y0, x1, y1)))


def build(name, anims):
    raw = {a: list(cells(sheet)) for a, (sheet, _) in anims.items()}
    boxes = [f.getbbox() for fs in raw.values() for f in fs]
    tall = max(b[3] - b[1] for b in boxes)
    k = FILL * SIZE / tall
    frames = {}
    for a, fs in raw.items():
        frames[a] = []
        for f in fs:
            bx = f.getbbox()
            w, h = f.size
            sw, sh = max(1, round(w * k)), max(1, round(h * k))
            sm = f.resize((sw, sh), Image.BOX)
            # binary alpha: pixel art has no half-clear pixels
            al = sm.getchannel('A').point(lambda v: 255 if v >= 110 else 0)
            sm.putalpha(al)
            fr = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
            ox = SIZE // 2 - sw // 2
            oy = round(SIZE * 31 / 32) - round(bx[3] * k)
            fr.alpha_composite(sm, (ox, oy))
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
    return {'size': SIZE, 'pal': hexes, 'fps': {a: fps for a, (_, fps) in anims.items()}, 'anims': enc}


def main():
    import json
    data = {}
    for name, anims in BOSSES.items():
        if all(os.path.exists(os.path.join(SRC, s)) for s, _ in anims.values()):
            data[name] = build(name, anims)
            print(name, {a: len(v) for a, v in data[name]['anims'].items()})
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
    print('wrote', OUT, os.path.getsize(OUT), 'bytes')


if __name__ == '__main__':
    main()
