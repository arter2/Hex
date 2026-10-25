#!/usr/bin/env python3
"""python3 tools/ui-pack-svg.py <unzipped hexmancers-ui-tapered-svg folder> [out=game/ui]

Turns the artist's pixel-art SVG pack (individual/*.svg, one SVG pixel = one art pixel, 128 colours, key green already
gone) into the SVGs the battle HUD loads: each piece is read back into pixels, trimmed, shrunk 3x with Lanczos, cut to
128 colours and written as a pixel-exact SVG (the shrink and the SVG writer are tools/ui-svg.py's).
Pieces that are drawn on top of one another share one crop, so they still line up when each is stretched over the
same box: the Fire frames and arc bars, the Cast frames, the portrait Spell button's states, the landscape one's,
the HP bars, the Spell timer bars. Every other piece is trimmed on its own."""
import sys, os, re, json, importlib.util, numpy as np
from PIL import Image
spec=importlib.util.spec_from_file_location('uisvg',os.path.join(os.path.dirname(os.path.abspath(__file__)),'ui-svg.py'))
U=importlib.util.module_from_spec(spec); spec.loader.exec_module(U)
DIV,COLORS=3,128
GROUPS=[
 'fire_normal fire_pressed fire_inactive fire_arc_empty fire_arc_full',
 'cast_normal cast_pressed cast_inactive',
 'portrait_spell_empty portrait_spell_blue_full portrait_spell_ready_dim portrait_spell_ready_bright',
 'landscape_spell_empty landscape_spell_blue_full landscape_spell_ready_dim landscape_spell_ready_bright',
 'hp_empty hp_full hp_red',
 'spell_track_empty spell_track_full',
 'spell_top_ready_dim spell_top_ready_bright',
 'pause_base pause_pressed',
 'queue_blank queue_selected',
]
SINGLE=('icon_pause icon_fire icon_cast icon_judgment icon_shield icon_regrowth icon_courage icon_heal icon_draw icon_instant '
        'instant_blank').split()
def pixels(path):
    s=open(path).read()
    W,H=[int(float(v)) for v in re.search(r'viewBox="[^"]*?(\d+) (\d+)"',s).groups()]
    a=np.zeros((H,W,4),np.uint8)
    for m in re.finditer(r'<path fill="#([0-9a-fA-F]{6})"[^>]*? d="([^"]+)"',s):
        c=[int(m.group(1)[i:i+2],16) for i in (0,2,4)]
        for x,y,w,h in re.findall(r'M(-?\d+) (-?\d+)h(-?\d+)v(-?\d+)h-?\d+z',m.group(2)):
            x,y,w,h=int(x),int(y),int(w),int(h); a[y:y+h,x:x+w,:3]=c; a[y:y+h,x:x+w,3]=255
    return a
def box(a):
    ys,xs=np.where(a[...,3]>0); return xs.min(),ys.min(),xs.max()+1,ys.max()+1
def crop(a,b):   # the box, grown on the right and bottom to a whole number of shrink blocks
    x0,y0,x1,y1=b; x1+=-(x1-x0)%DIV; y1+=-(y1-y0)%DIV
    c=np.zeros((y1-y0,x1-x0,4),np.uint8); s=a[y0:y1,x0:x1]; c[:s.shape[0],:s.shape[1]]=s; return c
def write(a,name,out,sizes):
    s,wh=U.svg(*U.pixelate(a[...,:3],a[...,3]>0,DIV,COLORS,'lanczos'))
    open(f'{out}/{name}.svg','w').write(s); sizes[name]=wh
if __name__=='__main__':
    src=sys.argv[1]; out=sys.argv[2] if len(sys.argv)>2 else 'game/ui'; os.makedirs(out,exist_ok=True); sizes={}
    P=lambda n: pixels(f'{src}/individual/{n}.svg')
    for g in GROUPS:
        names=g.split(); arts={n:P(n) for n in names}; bs=[box(a) for a in arts.values()]
        b=(min(x[0] for x in bs),min(x[1] for x in bs),max(x[2] for x in bs),max(x[3] for x in bs))
        for n,a in arts.items(): write(crop(a,b),n,out,sizes)
    for n in SINGLE: a=P(n); write(crop(a,box(a)),n,out,sizes)
    for n in sorted(os.listdir(f'{src}/individual')):
        n=n[:-4]
        if n.startswith(('status_','warning_')): a=P(n); write(crop(a,box(a)),n,out,sizes)
    json.dump(sizes,open(f'{out}/sizes.json','w'),indent=0); print(len(sizes),'pieces')
