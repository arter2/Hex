import numpy as np
from PIL import Image
from scipy import ndimage
import os
H=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','art','heroes')+'/'
_c={}
def sheet(n):
  if n not in _c: _c[n]=np.asarray(Image.open(H+n+'.png'))
  return _c[n]
def cut(name,pt,big=False):
  a=sheet(name); cx,cy=pt
  if big: x0,y0,x1,y1=max(0,cx-170),max(0,cy-200),cx+170,cy+180
  else: x0,y0,x1,y1=max(0,cx-62),max(0,cy-95),cx+62,cy+80
  w=a[y0:y1,x0:x1].copy(); m=w[...,3]>24
  lab,n=ndimage.label(ndimage.binary_dilation(m),structure=np.ones((3,3)))
  if n==0: return None
  # main = biggest component touching a small box round the point
  py,px=cy-y0,cx-x0; core=lab[max(0,py-30):py+30,max(0,px-25):px+25]
  ids,cnt=np.unique(core[core>0],return_counts=True)
  sizes=ndimage.sum(np.ones_like(lab),lab,ids)
  main=ids[np.argmax(sizes)]
  sl=ndimage.find_objects(lab)
  keep=lab==main; my,mx=sl[main-1]
  for i,s in enumerate(sl):
    if i+1==main or s is None: continue
    ys,xs=s
    if xs.start>=mx.start-4 and xs.stop<=mx.stop+4 and ys.start>=my.start-12 and ys.stop<=my.stop+4: keep|=lab==i+1
  w[~(keep&m)]=0
  im=Image.fromarray(w,'RGBA'); return im.crop(im.getbbox())
