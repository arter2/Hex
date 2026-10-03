# python3 zoom.py out.png id... : the front idle frame's head (from the head anchor in the json) at SC (default 8)
import sys,json,os
from PIL import Image
sc=int(os.environ.get('SC','8')); ids=sys.argv[2:]; tiles=[]; R=int(os.environ.get('R','16'))
for id in ids:
  m=json.load(open(f'out/{id}.json')); im=Image.open(f'out/{id}.png'); c=m['cell']
  ri=next(i for i,r in enumerate(m['rows']) if r['move']=='idle' and r['view']!='back')
  t=im.crop((0,ri*c,c,ri*c+c)); h=m.get('head')
  if not h: bb=t.getbbox(); h=[(bb[0]+bb[2])/2,bb[1]+12,10]
  x,y=int(h[0]),int(h[1]); tiles.append(t.crop((x-R,y-R,x+R,y+R+4)))
W=max(t.width for t in tiles); H=max(t.height for t in tiles); cols=int(os.environ.get('COLS','6'))
out=Image.new('RGBA',(cols*W*sc,((len(tiles)+cols-1)//cols)*H*sc),(38,44,52,255))
for i,t in enumerate(tiles): out.alpha_composite(t.resize((t.width*sc,t.height*sc),0),((i%cols)*W*sc,(i//cols)*H*sc))
out.save(sys.argv[1])
