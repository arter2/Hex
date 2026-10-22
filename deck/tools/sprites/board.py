"""Judge boards: each entry as a card (main sprite 2x on a grid backdrop, extra views and frames 1x)."""
import os, json
from PIL import Image, ImageDraw, ImageFont
OUT = '/tmp/claude-0/-home-user-Hex/5ecd24fc-732e-523e-bb34-78aa2fbf8119/scratchpad/judge/'
def card(e):
    eid, cat, name, does, works, im = e
    extra = im['frames'] + im['alt']
    W = 256 + 16 + max(1, (len(extra) + 1) // 2) * 132
    c = Image.new('RGBA', (max(W, 560), 300), (24, 26, 36, 255)); d = ImageDraw.Draw(c)
    bg = Image.new('RGBA', (256, 256), (38, 42, 58, 255)); bd = ImageDraw.Draw(bg)
    for i in range(0, 256, 32): bd.line([(i, 0), (i, 255)], fill=(46, 50, 68)); bd.line([(0, i), (255, i)], fill=(46, 50, 68))
    bg.alpha_composite(im['main'].resize((256, 256), Image.NEAREST)); c.alpha_composite(bg, (8, 36))
    for i, x in enumerate(extra):
        t = Image.new('RGBA', (128, 128), (38, 42, 58, 255)); t.alpha_composite(x)
        c.alpha_composite(t, (272 + (i // 2) * 132, 36 + (i % 2) * 132))
    d.text((8, 8), '%s  [%s]  %s' % (eid, cat, name), fill=(240, 230, 200))
    return c
def boards(es, tag, per=4):
    os.makedirs(OUT, exist_ok=True); files = []
    for b in range(0, len(es), per):
        cs = [card(e) for e in es[b:b + per]]
        H = sum(x.height for x in cs); W = max(x.width for x in cs)
        im = Image.new('RGBA', (W, H), (16, 18, 24, 255)); y = 0
        for x in cs: im.alpha_composite(x, (0, y)); y += x.height
        f = OUT + '%s_%02d.png' % (tag, b // per); im.save(f); files.append(f)
    return files
