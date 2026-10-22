"""Adds the player looks' battle animations to deck/sprites.js without touching anything else in it:
for every look, `anim` / `animBare` (a 384 x 96 strip of four poses from behind: idle, walk, cast,
attack; one palette and one scale, standing on the same feet), their staff-glow positions
(`tips` / `tipsBare`), and `back` / `backBare` set to the standing pose.
Run: python3 deck/tools/sprites/export_anim.py (needs numpy, scipy and Pillow)."""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import sheetcast as C
from export import url, tip

def main():
    path = os.path.join(os.path.dirname(__file__), '..', '..', 'sprites.js')
    src = open(path).read()
    for race in C.RACES:
        for sex in 'mf':
            lid = C.LOOK_IDS[(race, sex)]; L = C.look(race, sex)
            m = re.search(r"\n  %s:\{name:[^\n]*" % lid, src); row = m.group(0)
            row = re.sub(r", (anim|animBare|tips|tipsBare):(\[[^\]]*\]|'[^']*')", '', row)
            for k in ('back', 'backBare'):
                row = re.sub(r"%s:'[^']*'" % k, "%s:'%s'" % (k, url(L[k])), row, count=1)
            row = row.rstrip('},') + ", anim:'%s', animBare:'%s', tips:[%s], tipsBare:[%s]}" % (
                url(L['anim']), url(L['animBare']), ','.join(tip(t) for t in L['tips']), ','.join(tip(t) for t in L['tipsBare']))
            if m.group(0).endswith(','): row += ','
            src = src.replace(m.group(0), row)
            src = re.sub(r"(\n  %s:\{[^\n]*?tipBack:)(\[[^\]]*\]|null)" % lid, lambda mm: mm.group(1) + tip(L['tipBack']), src)
    open(path, 'w').write(src); print('wrote', os.path.normpath(path), len(src), 'bytes')

if __name__ == '__main__':
    main()
