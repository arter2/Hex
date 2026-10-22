# Lift a native pixel sprite into a voxel model: each dark outline pixel splits the art into parts,
# and each part is inflated into a rounded pillow (depth from its distance to the part edge).
from PIL import Image
import numpy as np, json, sys
from scipy import ndimage as nd
name=sys.argv[1]
a=np.asarray(Image.open(name+'_native.png')).astype(int)
H,W=a.shape[:2]; m=a[...,3]>0; rgb=a[...,:3]
lum=rgb@[.3,.59,.11]
line=m&(lum<55)                       # baked outline / contour pixels
inner=m&~line
def pillow(mask,win):
  dt=nd.distance_transform_edt(mask); R=nd.maximum_filter(dt,size=win); t=np.minimum(dt,R)
  return np.sqrt(np.maximum(2*R*t-t*t,0))
# whole-body volume (round cross-section, ~as deep as wide) plus a smaller bump per outlined part
body=nd.binary_opening(m,iterations=1)|line&False
h=pillow(m,25)*1.0+pillow(inner,9)*0.45+0.6
# contour pixels take the depth of their deepest neighbour minus a bit (they wrap the part)
hn=nd.maximum_filter(np.where(inner,h,0),size=3)
h=np.where(line,np.maximum(hn-0.8,0.6),h)
h=np.where(m,np.clip(h,0.6,16),0)
vox=[]
for y in range(H):
  for x in range(W):
    if not m[y,x]: continue
    zf=int(round(h[y,x])); zb=int(round(h[y,x]*0.8))
    vox.append([x,H-1-y,-zb,zf,*map(int,rgb[y,x])])
json.dump({'W':W,'H':H,'vox':vox},open(name+'_vox.json','w'))
print(name,len(vox),'columns, max depth',h.max().round(1))
