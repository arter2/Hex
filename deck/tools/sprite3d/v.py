# python3 v.py out.png id... [--move m] [--frame f] [--views 0,1]: tiles trimmed, 5x, max 4 per row
import sys,json,os
from PIL import Image
a=sys.argv[2:]; move='idle'; fr=0; sc=int(os.environ.get('SC','5'))
if '--move' in a: i=a.index('--move'); move=a[i+1]; del a[i:i+2]
if '--frame' in a: i=a.index('--frame'); fr=int(a[i+1]); del a[i:i+2]
tiles=[]
for id in a:
  m=json.load(open(f'out/{id}.json')); im=Image.open(f'out/{id}.png'); c=m['cell']
  for ri,r in enumerate(m['rows']):
    if r['move']!=move: continue
    f=min(fr,r['frames']-1); t=im.crop((f*c,ri*c,f*c+c,ri*c+c)); bb=t.getbbox() or (0,0,c,c); tiles.append(t.crop((bb[0]-2,0,bb[2]+2,c)))
cols=int(os.environ.get('COLS','4')); W=max(t.width for t in tiles); H=max(t.height for t in tiles)
out=Image.new('RGBA',(cols*W*sc,((len(tiles)+cols-1)//cols)*H*sc),(30,38,44,255))
for i,t in enumerate(tiles): out.alpha_composite(t.resize((t.width*sc,t.height*sc),0),((i%cols)*W*sc,(i//cols)*H*sc+(H-t.height)*sc))
out.save(sys.argv[1])
