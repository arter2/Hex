"""Six younger hexmancers in the hand-placed style: elf, dwarf and orc, a man and a woman each.
They share the wizard's outfit (hat, capelet, coat, staff, spellbook) from hand.py; each gets
its own face and hair (painted from a small pixel template), outfit colors and build."""
import os, copy
from PIL import Image
import hand

W, H = hand.W, hand.H
hx = hand.hx
def ramp4(c0, c1, c2, c3): return {'A': c0, 'B': c1, 'C': c2, 'D': c3}
def robe5(r, u, U, V, Wc): return {'r': r, 'u': u, 'U': U, 'V': V, 'W': Wc}
def cape4(q, Q, R, P): return {'q': q, 'Q': Q, 'R': R, 'P': P}

# outfit colors per race: elves in forest green, dwarves in rust red with a fur collar,
# orcs in charcoal and olive with a bone-grey fur collar
OUTFIT = {
    'elf':   dict(**ramp4('#22392e', '#335640', '#4c7a56', '#7aa67a'), **robe5('#18261f', '#243a2e', '#355a42', '#4f7d58', '#79a77a'), **cape4('#5a4a2e', '#7e6a42', '#a8915e', '#d2be8c')),
    'dwarf': dict(**ramp4('#3e1d1c', '#5c2a24', '#83402f', '#b06446'), **robe5('#2a1414', '#3e1d1c', '#5c2a24', '#7e3a2c', '#a85a40'), **cape4('#3a2a20', '#5a4232', '#80664e', '#a88c6e')),
    'orc':   dict(**ramp4('#22231f', '#33352d', '#4b4e40', '#6e735c'), **robe5('#171814', '#22231f', '#33352d', '#4a4d3e', '#6a6e58'), **cape4('#55524a', '#7a766a', '#a29d8c', '#cfcab6')),
}
# skin, hair and eye colors per character
LOOK = {
    'elf_m':   dict(skin=('#b98674', '#e5b9a0', '#f6dccb'), hair=('#7d7458', '#b8ad8a', '#ebe5cc'), eye='#39c06a'),
    'elf_f':   dict(skin=('#b98674', '#e5b9a0', '#f6dccb'), hair=('#8a5a2a', '#c9923e', '#f2d38a'), eye='#4fb8e8', lip='#d98a8a'),
    'dwarf_m': dict(skin=('#9a5446', '#d08468', '#f0b090'), hair=('#6e2a18', '#b04e24', '#e07a3a'), eye='#3a6aa8'),
    'dwarf_f': dict(skin=('#9a5446', '#d89276', '#f4bea0'), hair=('#5a2416', '#9c4428', '#cc6a3e'), eye='#4a8a5a', lip='#c46a6a'),
    'orc_m':   dict(skin=('#3e6a34', '#6fa852', '#9fd47a'), hair=('#161a14', '#262c22', '#3a4232'), eye='#f2c94c'),
    'orc_f':   dict(skin=('#3e6a34', '#78b058', '#a8da84'), hair=('#14161c', '#262a36', '#3c4256'), eye='#e8913a', lip='#4a7a3c'),
}
# faces: 21 columns (x 12..32), rows 17..30. Codes: h K k hair light/mid/dark, T S s skin
# light/base/shadow, i lash, e iris, c lip, v tusk, y gold, '.' leave as is ('_' clears)
FACE = {
'elf_m': [
"....._KhhhhhhhK_.....",
"....KhhhhhhhhhhhK....",
".T..KhTTTTTTTTShK..s.",
".TS.KhTiiTSSiiSShKSs.",
"..SSKhTeeTSSeeSSsSs..",
"....KhTTTTsSSSSSsK...",
"....KhKTSScccSSKhK...",
".....hK_SSSSSSS_Kh...",
".....h...........h...",
".....K...........K...",
"......................",
"......................",
"......................",
"......................"],
'elf_f': [
"....._hhhhhhhhh_.....",
"....hhhhhKhhhhhhh....",
".T.hhhhTTTTTTThhhh.s.",
".TShhKiiiTSSiiiShhSs.",
"..ShhKTeeTSSeeSSKhs..",
"...hhKTcTTsSSScSKhh..",
"...hhKKTSSccSSSKKhh..",
"..hhh.._SSSSS_..hhh..",
"..hhK...........Khh..",
"..hhK...........Khh..",
"..hhK...........Khh..",
"..hKK...........KKh..",
"..hK.............Kh..",
"..K...............K..",
"..K...............K.."],
'dwarf_m': [
"....._KKhhhhhKK_.....",
"....KKhhhhhhhhhKK....",
"...KhTTTTTTTTTTThK...",
"...KhkkkTSSSkkkShK...",
"..SKTTiiTTSTiiSSsKS..",
"..SKTTeeTSSSeeSSsKs..",
"...KTTTTSSsSSSSSsK...",
"...KhhhhSssssShhhK...",
"....hhhhhhhhhhhhh....",
".....hhhhhyhhhhh.....",
"......hhhhKhhhh......",
".......hhhyhhh.......",
"........hhKhh........",
"......................"],
'dwarf_f': [
"....._hhhhhhhhh_.....",
"....hhhhKhhhhhhhh....",
"...hhKTTTTTTTTTKhh...",
"..ShhTiiiTSSSiiiThS..",
"..ShKTTeeTSSSeeTSKs..",
"...hKTsTcTsSscTsSKh..",
"...hKKTTSSccSSSSKKh..",
"..hhh..._SSSSS_..hhh.",
"..hK.............hK..",
"..yy.............yy..",
"..hK.............hK..",
"..hK.............hK..",
"..yy.............yy..",
"..hK.............hK..",
"...K.............K..."],
'orc_m': [
"....._kkkkkkkkk_.....",
"....kkkkkkkkkkkkk....",
"...kkTTTTTTTTTTTsk...",
"..SksssssTSsssssssk..",
".SSkTiiSTSSSSiiSSsSs.",
"..SkTeeSTSSSSeeSSkSy.",
"...kTTTSSSssSSSSSk...",
"...kTvTSSSSSSSvSSk...",
"...kTvSScccccSvSSk...",
"....kSSSSSSSSSSSk....",
".....____SSS____.....",
"......................",
"......................",
"......................"],
'orc_f': [
"....._hKKKKKKKh_.....",
"....hKKKKKKKKKKKh....",
"...hKKKKTTTTTTKKKh...",
"..SKKTiiiSSSSiiiKKSs.",
".SSKTTeeTSSSSeeSSKSy.",
"..yKTcTTSSsSSSScSKs..",
"...KTvSSScccSSvSSKh..",
"....KSSSSSSSSSSSKhh..",
".................hK..",
".................hK..",
".................yy..",
".................hK..",
".................hK..",
"................hK...",
"................K...."],
}
# builds: dwarves are shorter and broader, orcs broader, elves taller
BUILD = {'elf': dict(dup_rows=[46, 53], dup_cols=[]), 'dwarf': dict(del_rows=[33, 41, 45, 49, 52], dup_cols=[22, 22]), 'orc': dict(dup_cols=[22])}

def build(cid, view='front'):
    race = cid.split('_')[0]; L = LOOK[cid]
    pal = dict(hand.PAL); pal.update(OUTFIT[race])
    s, S, T = L['skin']; k, K, h = L['hair']
    pal.update({'s': s, 'S': S, 'T': T, 'k': k, 'K': K, 'h': h, 'e': L['eye'], 'i': '#1b1726', 'c': L.get('lip', s), 'v': '#ece2c4'})
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); px = img.load()
    for y, segs in hand.RUNS.items():
        for (a, b, c) in segs:
            for x in range(a, b + 1):
                if 0 <= x < W and 0 <= y < H: px[x, y] = hx(pal[c])
    # clear the old face and scarf under the brim, then paint this character's face
    for y in range(17, 24):
        for x in range(12, 33):
            if y >= 19 or 14 <= x <= 30: px[x, y] = (0, 0, 0, 0)
    for r, row in enumerate(FACE[cid]):
        y = 17 + r
        for i, ch in enumerate(row[:21]):
            x = 12 + i
            if ch == '.': continue
            if ch == '_' and y >= 24: continue
            px[x, y] = (0, 0, 0, 0) if ch == '_' else hx(pal[ch])
    if view == 'back': img = backview(img, pal, cid); px = img.load()
    # outline and the book's glow
    src = img.copy().load(); O = hx(pal['o'])
    for y in range(H):
        for x in range(W):
            if src[x, y][3]: continue
            if any(0 <= x + dx < W and 0 <= y + dy < H and src[x + dx, y + dy][3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): px[x, y] = O
    bx = range(33, 44) if view == 'front' else range(0, 11)
    for y in range(29, 43):
        for x in bx:
            if px[x, y][3] == 0 and any(0 <= x + dx < W and 0 <= y + dy < H and px[x + dx, y + dy] == O for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = hx(pal['z'])
    return reshape(img, BUILD[race])

def backview(img, pal, cid):
    im = img.transpose(Image.FLIP_LEFT_RIGHT); px = im.load()
    long_hair = cid in ('elf_f', 'dwarf_f', 'orc_f')
    hairs = {hx(pal[c])[:3] for c in 'hKk'}; skin = {hx(pal[c])[:3] for c in 'sSTiecv'}
    for y in range(17, 28):
        for x in range(10, 35):
            c = px[x, y]
            if not c[3] or not (c[:3] in skin or c[:3] in hairs): continue
            if y >= 19 and (x < 13 or x > 31) and c[:3] in skin: continue      # ears
            if y >= 24 and c[:3] in hairs and long_hair: continue
            if y >= 25:   # below the head the collar shows, not hair
                px[x, y] = hx(pal['Q' if (x + y) % 2 else 'q']); continue
            px[x, y] = hx(pal['K' if (x * 7 + y * 3) % 9 == 0 else 'k' if y < 19 else 'K'])
    if long_hair:   # hair down the back over the capelet
        for y in range(24, 30 if cid != 'dwarf_f' else 25):
            for x in range(17, 28):
                px[x, y] = hx(pal['h' if x in (19, 23) else 'K'])
    if cid == 'dwarf_m':   # from behind, only the beard's edges show past the jaw
        for y in range(21, 25): px[13, y] = hx(pal['h']); px[31, y] = hx(pal['h'])
    for y in range(30, 52):
        for x in range(18, 27):
            c = px[x, y]
            if c[3] and c[:3] in (hx(pal['y'])[:3], hx(pal['u'])[:3]): px[x, y] = hx(pal['U' if x < 22 else 'u'])
    for y in range(31, 51, 2): px[W - 1 - 22, y] = hx(pal['u'])
    for y in range(33, 41):
        for x in range(0, 12):
            if px[x, y][:3] == hx(pal['g'])[:3]: px[x, y] = hx(pal['b'])
    return im

def reshape(img, b):
    rows = [[img.getpixel((x, y)) for x in range(img.width)] for y in range(img.height)]
    for y in sorted(b.get('del_rows', []), reverse=True): del rows[y]
    for y in sorted(b.get('dup_rows', []), reverse=True): rows.insert(y, list(rows[y]))
    for x in sorted(b.get('dup_cols', []), reverse=True):
        for r in rows: r.insert(x, r[x])
    out = Image.new('RGBA', (len(rows[0]), len(rows))); p = out.load()
    for y, r in enumerate(rows):
        for x, c in enumerate(r): p[x, y] = c
    return out

IDS = ['elf_m', 'elf_f', 'dwarf_m', 'dwarf_f', 'orc_m', 'orc_f']
if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), 'out')
    sheet = Image.new('RGBA', (len(IDS) * 48 * 6 + 20, 2 * 64 * 6 + 30), (150, 152, 156, 255))
    for i, cid in enumerate(IDS):
        for j, view in enumerate(('front', 'back')):
            im = build(cid, view); im.save(os.path.join(out, f'{cid}_{view}.png'))
            big = im.resize((im.width * 6, im.height * 6), Image.NEAREST)
            sheet.alpha_composite(big, (10 + i * 48 * 6, 10 + j * (64 * 6 + 10) + (64 - im.height) * 6))
    sheet.save(os.path.join(os.path.dirname(__file__), 'chars_sheet.png')); print('ok')
