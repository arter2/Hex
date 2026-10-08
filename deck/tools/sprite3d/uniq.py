# python3 uniq.py id... : silhouette overlap (IoU of alpha masks, front+back idle, aligned at the feet)
# and palette distance (hue x value histogram) between every pair; prints each sprite's nearest neighbours.
import sys,json,colorsys
import numpy as np
from PIL import Image
ids=sys.argv[1:]
def frame(id,view):
  m=json.load(open(f'out/{id}.json')); im=Image.open(f'out/{id}.png').convert('RGBA'); c=m['cell']
  rows=[(i,r) for i,r in enumerate(m['rows']) if r['move'] in ('idle','icon')]
  ri=next((i for i,r in rows if r['view']==view), rows[0][0])
  return np.array(im.crop((0,ri*c,c,ri*c+c)))
def mask(a):
  m=a[...,3]>0; ys,xs=np.nonzero(m); y1=ys.max(); cx=int(round((xs.min()+xs.max())/2))
  out=np.zeros((256,256),bool); H,W=m.shape
  for y,x in zip(ys,xs): out[255-(y1-y), 128+(x-cx)]=True
  return out
def hist(a):
  px=a[a[...,3]>0][:,:3]/255.0; h=np.zeros((12,3))
  for r,g,b in px:
    hh,ss,vv=colorsys.rgb_to_hsv(r,g,b)
    if vv<.16: continue
    if ss<.18: h[int(hh*12)%12,0]+=0; h[0,0]+=0
    hb=int(hh*12)%12 if ss>=.18 else 11-0; vb=0 if vv<.4 else 1 if vv<.7 else 2
    if ss<.18: h[(hb+0)%12,vb]+=.0
    h[hb,vb]+=1
  return h/max(1,h.sum())
F={i:[frame(i,'front'),frame(i,'back')] for i in ids}
MK={i:[mask(f) for f in F[i]] for i in ids}
HI={i:hist(np.concatenate([f.reshape(-1,4) for f in F[i]]).reshape(-1,1,4)) for i in ids}
def iou(a,b): return (a&b).sum()/max(1,(a|b).sum())
res={}
for i in ids:
  best=(0,None); bestp=(9,None)
  for j in ids:
    if i==j: continue
    s=(iou(MK[i][0],MK[j][0])+iou(MK[i][1],MK[j][1]))/2
    if s>best[0]: best=(s,j)
    d=1-np.minimum(HI[i],HI[j]).sum()
    if d<bestp[0]: bestp=(d,j)
  res[i]=dict(sil=round(float(best[0]),3),silNear=best[1],pal=round(float(bestp[0]),3),palNear=bestp[1])
  print(f"{i:14s} silhouette overlap {best[0]:.2f} (nearest {best[1]:14s})  palette distance {bestp[0]:.2f} (nearest {bestp[1]})")
import os
json.dump(res,open(os.environ.get('OUT','uniq_last.json'),'w'))
