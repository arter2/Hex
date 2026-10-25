import sys, os
import figure, cast, rig
OUT = os.environ.get('OUT', '/tmp/claude-0/-home-user-Hex/5ecd24fc-732e-523e-bb34-78aa2fbf8119/scratchpad')
def variants(n):
    o = cast.LOOKS[n]; b = dict(o); b.update(dict(hat='none')); b.update(cast.BARE.get(n, {}))
    return [(n, o), (n + ' bare', b)]
args = [a for a in sys.argv[1:] if not a.startswith('-')]
views = ['front', 'back'] if '-b' in sys.argv else ['front']
names = args or list(cast.LOOKS)
items = []
for n in names:
    for lab, o in variants(n):
        for v in views:
            items.append((lab + ' ' + v, figure.build(o, v).render()))
out = os.environ.get('NAME', 'prev.png')
rig.sheet(items, scale=int(os.environ.get('SCALE', 4)), cols=int(os.environ.get('COLS', 6))).save(os.path.join(OUT, out))
print('ok', len(items))
