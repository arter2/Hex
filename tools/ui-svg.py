#!/usr/bin/env python3
"""python3 tools/ui-svg.py <unzipped hexmancers-ui-keygreen folder> [out=game/ui] [names|all]

Cuts the HUD art out of the key-green export and writes each piece as a pixel-exact SVG:
  - the export is a whole-pixel 2x enlargement, so every other pixel is the art's own pixel;
  - the key green goes, and so does its darker fringe: green-leaning pixels joined to the outside
    (a green icon inside a frame is walled off by the dark outline, so it stays);
  - the padding is trimmed;
  - each colour becomes one <path> of 1-pixel-tall runs, drawn with crispEdges, so the SVG scales to
    any size and still shows the art's exact pixels.
With no names it writes the pieces the battle HUD uses (USED below)."""
import sys, os, json, numpy as np
from PIL import Image
USED=('fire_normal fire_pressed fire_inactive cast_normal cast_pressed cast_inactive '
 'portrait_spell_empty portrait_spell_blue_full portrait_spell_ready_dim portrait_spell_ready_bright '
 'landscape_spell_empty landscape_spell_blue_full landscape_spell_ready_dim landscape_spell_ready_bright '
 'hp_empty hp_full hp_red spell_track_empty spell_track_full spell_top_ready_dim spell_top_ready_bright '
 'pause_base pause_pressed icon_pause queue_blank queue_selected next_badge instant_blank '
 'icon_fire icon_cast icon_judgment icon_shield icon_regrowth icon_courage icon_heal icon_draw icon_instant '
 'label_spell_white label_spell_dark label_fire label_cast label_incoming').split()
def cut(src,name):
    a=np.array(Image.open(f'{src}/individual/{name}.png').convert('RGB'))[::2,::2].astype(int)
    r,g,b=a[...,0],a[...,1],a[...,2]
    greenish=(g>r+40)&(g>b+40)&(g>60)
    bg=np.zeros_like(greenish); bg[0]=greenish[0]; bg[-1]=greenish[-1]; bg[:,0]=greenish[:,0]; bg[:,-1]=greenish[:,-1]
    while True:
        n=bg.copy(); n[1:]|=bg[:-1]; n[:-1]|=bg[1:]; n[:,1:]|=bg[:,:-1]; n[:,:-1]|=bg[:,1:]; n&=greenish
        if (n==bg).all(): break
        bg=n
    bg|=(g>200)&(r<90)&(b<90)
    ys,xs=np.where(~bg); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    return a[y0:y1,x0:x1].astype(np.uint8), ~bg[y0:y1,x0:x1]
def svg(rgb,on):
    h,w=on.shape; runs={}
    for y in range(h):
        x=0
        while x<w:
            if not on[y,x]: x+=1; continue
            c=tuple(rgb[y,x]); x2=x+1
            while x2<w and on[y,x2] and tuple(rgb[y,x2])==c: x2+=1
            runs.setdefault(c,[]).append(f'M{x} {y}h{x2-x}v1h{x-x2}z'); x=x2
    body=''.join(f'<path fill="#{c[0]:02x}{c[1]:02x}{c[2]:02x}" d="{"".join(d)}"/>' for c,d in runs.items())
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" shape-rendering="crispEdges">{body}</svg>', (w,h)
if __name__=='__main__':
    src=sys.argv[1]; out=sys.argv[2] if len(sys.argv)>2 else 'game/ui'
    names=USED if len(sys.argv)<4 else [a['name'] for a in json.load(open(src+'/manifest.json'))['assets']] if sys.argv[3]=='all' else sys.argv[3].split(',')
    if len(sys.argv)<4: names=names+[a['name'] for a in json.load(open(src+'/manifest.json'))['assets'] if a['name'].startswith(('status_','warning_'))]
    os.makedirs(out,exist_ok=True); sizes={}
    for n in names:
        s,wh=svg(*cut(src,n)); open(f'{out}/{n}.svg','w').write(s); sizes[n]=wh
    json.dump(sizes,open(f'{out}/sizes.json','w'),indent=0)
    print(len(names),'pieces')
