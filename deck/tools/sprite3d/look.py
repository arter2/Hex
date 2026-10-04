# python3 look.py out.png id... [--view front|back] [--move m] [--frame f]: trimmed tiles at SC (default 4), one row
import sys,json,os
from PIL import Image
a=sys.argv[2:]; view='front'; move='idle'; fr=0; sc=int(os.environ.get('SC','4'))
for k in ['--view','--move','--frame']:
  if k in a: i=a.index(k); v=a[i+1]; del a[i:i+2]; exec({'--view':'view','--move':'move','--frame':'fr'}[k]+'=v if k!="--frame" else int(v)')
tiles=[]
for id in a:
  m=json.load(open(f'out/{id}.json')); im=Image.open(f'out/{id}.png'); c=m['cell']
  for ri,r in enumerate(m['rows']):
    if r['move']!=move or (r['view']!=view and len([x for x in m['rows'] if x['move']==move])>1): continue
    f=min(fr,r['frames']-1); t=im.crop((f*c,ri*c,f*c+c,ri*c+c)); bb=t.getbbox() or (0,0,c,c); tiles.append(t.crop((bb[0]-2,max(0,bb[1]-2),bb[2]+2,c)))
cols=int(os.environ.get('COLS','6')); W=max(t.width for t in tiles); H=max(t.height for t in tiles)
out=Image.new('RGBA',(min(cols,len(tiles))*W*sc,((len(tiles)+cols-1)//cols)*H*sc),(38,44,52,255))
for i,t in enumerate(tiles): out.alpha_composite(t.resize((t.width*sc,t.height*sc),0),((i%cols)*W*sc+(W-t.width)*sc//2,(i//cols)*H*sc+(H-t.height)*sc))
out.save(sys.argv[1])
