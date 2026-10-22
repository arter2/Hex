from PIL import Image
import numpy as np, sys
from scipy import ndimage as nd
S=4
def ol(im):
  a=np.asarray(im.convert('RGBA')).copy(); m=a[...,3]>0; ring=nd.binary_dilation(m)&~m; a[ring]=[24,20,28,255]; return Image.fromarray(a)
def row(ims):
  w=sum(i.width for i in ims)+6*len(ims); h=max(i.height for i in ims); r=Image.new('RGBA',(w,h)); x=0
  for i in ims: r.alpha_composite(i,(x,h-i.height)); x+=i.width+6
  return r
rows=[]
for n in sys.argv[1:]:
  rows.append(row([Image.open(n+'_native.png').convert('RGBA')]+[ol(Image.open(f'out/{n}_idle_y{y}.png')) for y in [-35,-15,0,15,35]]))
  for y in [0,30]: rows.append(row([ol(Image.open(f'out/{n}_walk_y{y}_f{f}.png')) for f in range(6)]))
W=max(r.width for r in rows); Ht=sum(r.height+6 for r in rows); b=Image.new('RGBA',(W,Ht),(236,232,224,255)); y=0
for r in rows: b.alpha_composite(r,(0,y)); y+=r.height+6
b.resize((W*S,Ht*S),Image.NEAREST).save('board2.png')
