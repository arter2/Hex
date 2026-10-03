from PIL import Image
import numpy as np, sys
U='/root/.claude/uploads/5ecd24fc-732e-523e-bb34-78aa2fbf8119/'
def fit(prof):
  best=None
  for p in np.arange(6.5,9.5,0.01):
    for o in np.arange(0,p,0.25):
      g=np.arange(o,len(prof)-1,p); s=prof[np.round(g).astype(int)].sum()/len(g)
      if best is None or s>best[0]: best=(s,p,o)
  return best
for f,name in [('459393dd-image.jpg','ranger'),('4a756861-image.png','link')]:
  im=Image.open(U+f).convert('RGBA'); a=np.asarray(im).astype(float)
  rgb=a[...,:3]
  dx=np.abs(np.diff(rgb,axis=1)).sum(2).sum(0); dy=np.abs(np.diff(rgb,axis=0)).sum(2).sum(1)
  bx=fit(dx); by=fit(dy); print(name,bx,by, 'alpha range',a[...,3].min())
  p=(bx[1]+by[1])/2; ox=bx[2]+1; oy=by[2]+1
  W=int((rgb.shape[1]-ox)//p); H=int((rgb.shape[0]-oy)//p)
  out=np.zeros((H,W,4),np.uint8)
  for j in range(H):
    for i in range(W):
      x0=int(ox+i*p+p*0.3); x1=int(ox+(i+1)*p-p*0.3); y0=int(oy+j*p+p*0.3); y1=int(oy+(j+1)*p-p*0.3)
      blk=a[y0:y1+1,x0:x1+1].reshape(-1,4); c=np.median(blk,0); out[j,i]=c
  # background -> transparent (near white & low variance)
  bg=(out[...,:3].astype(int).min(2)>235)|(out[...,3]<128)
  out[bg]=0; out[~bg,3]=255
  ys,xs=np.where(~bg); out=out[ys.min():ys.max()+1, xs.min():xs.max()+1]
  Image.fromarray(out).save('ref/%s_native.png'%name); print(name,out.shape)
  Image.fromarray(out).resize((out.shape[1]*6,out.shape[0]*6),Image.NEAREST).save('ref/%s_x6.png'%name)
