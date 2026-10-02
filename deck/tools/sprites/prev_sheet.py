import sys, sheetcast as C
from PIL import Image
OUT = '/tmp/claude-0/-home-user-Hex/5ecd24fc-732e-523e-bb34-78aa2fbf8119/scratchpad/'
def board(ims, name, W=12, z=2):
    c = Image.new('RGBA', (96 * W, 96 * ((len(ims) + W - 1) // W)), (30, 34, 48, 255))
    for i, im in enumerate(ims): c.alpha_composite(im, ((i % W) * 96, (i // W) * 96))
    c.resize((c.width * z, c.height * z), Image.NEAREST).save(OUT + name)
if __name__ == '__main__':
    ims = []
    for r in C.RACES:
        for s in 'mf':
            L = C.look(r, s); ims += [L['back'], L['backBare'], L['front'], L['frontBare']]
    board(ims, 'looks.png')
    board([C.unit(u) for u in C.UNITS], 'units.png', W=10)
    from PIL import ImageDraw
    ims = []
    for r in C.RACES:
        for s in 'mf':
            L = C.look(r, s)
            for k, t in (('back', 'tipBack'), ('backBare', 'tipBack')):
                im = L[k].copy()
                if L[t]: ImageDraw.Draw(im).ellipse([L[t][0]*96-2, L[t][1]*96-2, L[t][0]*96+2, L[t][1]*96+2], outline=(255, 0, 255, 255))
                ims.append(im)
    board(ims, 'tips.png')
