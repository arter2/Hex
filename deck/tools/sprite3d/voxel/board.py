from PIL import Image
import numpy as np, sys
from scipy import ndimage as nd
S=4; yaws=[-60,-35,-15,0,15,35,60,90]
def outline(im):
  a=np.asarray(im).copy(); m=a[...,3]>0
  ring=nd.binary_dilation(m)&~m; a[ring]=[24,20,28,255]; return Image.fromarray(a)
rows=[]
for name in sys.argv[1:]:
  ref=Image.open(name+'_native.png'); fr=[outline(Image.open(f'out/{name}_y{y}.png')) for y in yaws]
  # front match vs reference
  f0=np.asarray(Image.open(f'out/{name}_y0.png')).astype(int); r=np.asarray(ref).astype(int)
  H,W=r.shape[:2]; CH,CW=f0.shape[:2]; ox=(CW-W)//2; oy=(CH-H)//2
  crop=f0[oy:oy+H,ox:ox+W]; mm=(r[...,3]>0)|(crop[...,3]>0)
  same=(np.abs(crop[...,:3]-r[...,:3]).max(2)<=12)&((crop[...,3]>0)==(r[...,3]>0))
  print(name,'front pixel match %.1f%%'%(100*same[mm].mean()))
  ims=[ref]+fr; w=sum(i.width for i in ims)+8*len(ims); h=max(i.height for i in ims)
  row=Image.new('RGBA',(w,h),(0,0,0,0)); x=0
  for i in ims: row.paste(i,(x,h-i.height)); x+=i.width+8
  rows.append(row)
W=max(r.width for r in rows); Ht=sum(r.height+6 for r in rows)
b=Image.new('RGBA',(W,Ht),(236,232,224,255)); y=0
for r in rows: b.alpha_composite(r,(0,y)); y+=r.height+6
b.resize((W*S,Ht*S),Image.NEAREST).save('board.png')
