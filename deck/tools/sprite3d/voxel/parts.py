# Split a native sprite into posable parts (hand-written rect rules), fill the hidden areas behind
# parts so limbs can swing without holes, and lift each part into voxel columns.
from PIL import Image
import numpy as np, json, sys, colorsys
from scipy import ndimage as nd
SPEC={
 'ranger':{'rules':[('quiver',[3,0,16,16]),('head',[18,0,36,14]),('armL',[8,19,16,45]),('armR',[31,19,35,44]),
   ('armL',[0,43,12,52]),('armL',[0,52,5,56]),('armR',[33,43,47,57]),('torso',[0,44,47,52],'green'),('legL',[0,44,23,67]),('legR',[24,44,47,67])],
  'piv':{'head':[26,15],'armL':[13,21],'armR':[32,21],'legL':[20,46],'legR':[28,46],'quiver':[13,14]},
  'z':{'quiver':-7,'armL':0,'armR':0},
  'fill':{'torso':[[14,15,33,47]],'legL':[[16,42,24,50]],'legR':[[24,42,32,50]]}},
 'link':{'rules':[('armR',[24,0,40,50]),('armR',[19,38,24,46]),('head',[4,14,26,37]),('armL',[0,42,8,59]),
   ('torso',[0,58,40,63],'cloth'),('legL',[0,60,16,82]),('legR',[17,60,40,82])],
  'piv':{'head':[16,36],'armL':[6,42],'armR':[21,42],'legL':[11,60],'legR':[22,60]},
  'z':{'armR':2},
  'fill':{'torso':[[6,36,25,60]],'legL':[[7,56,16,63]],'legR':[[18,56,25,63]]}}}
name=sys.argv[1]; sp=SPEC[name]
a=np.asarray(Image.open(name+'_native.png')).astype(int); H,W=a.shape[:2]; m=a[...,3]>0; rgb=a[...,:3]
def hsv(c): return colorsys.rgb_to_hsv(*(c/255))
def test(kind,c):
  h,s,v=hsv(c)
  if kind=='green': return 0.2<h<0.45 and s>0.15
  if kind=='cloth': return (0.2<h<0.45 and s>0.15) or s<0.3 and v>0.45   # green tunic or pale undercloth
lab=np.full((H,W),'',object)
for y in range(H):
  for x in range(W):
    if not m[y,x]: continue
    lab[y,x]='torso'
    for r in sp['rules']:
      p,(x0,y0,x1,y1)=r[0],r[1]
      if x0<=x<=x1 and y0<=y<=y1 and (len(r)<3 or test(r[2],rgb[y,x])): lab[y,x]=p; break
lum=rgb@[.3,.59,.11]; line=m&(lum<60)
def pillow(mask,win):
  dt=nd.distance_transform_edt(mask); R=nd.maximum_filter(dt,size=win); t=np.minimum(dt,R)
  return np.sqrt(np.maximum(2*R*t-t*t,0))
parts={}; front=np.zeros((H,W))
names=sorted(set(lab[m]))
for p in names:
  own=(lab==p); full=own.copy()
  for (x0,y0,x1,y1) in sp['fill'].get(p,[]): full[y0:y1+1,x0:x1+1]=True
  if p in sp['fill']: full=nd.binary_closing(full,iterations=1)|own
  # hidden pixels take the colour of the nearest visible (non-outline) pixel of this part
  src=own&~line if (own&~line).any() else own
  
  _,(iy,ix)=nd.distance_transform_edt(~src,return_indices=True)
  h=pillow(full,25)+pillow(own&~line,9)*0.45+0.6
  hn=nd.maximum_filter(np.where(own&~line,h,0),size=3); h=np.where(own&line,np.maximum(hn-0.8,0.6),h)
  parts[p]=(own,full,h,iy,ix)
cols={p:[] for p in names}
for p,(own,full,h,iy,ix) in parts.items():
  z=sp['z'].get(p,0)
  for y in range(H):
    for x in range(W):
      if not full[y,x]: continue
      zf=int(round(h[y,x])); zb=int(round(h[y,x]*0.8))
      if own[y,x]: c=rgb[y,x]
      else:
        o=lab[y,x]
        if o and o!=p:   # covered by another part here: keep this part behind it
          oh=parts[o][2][y,x]+sp['z'].get(o,0); zf=min(zf,int(round(oh))-1-z)
        c=rgb[iy[y,x],ix[y,x]]
      if zf<-zb: continue
      if own[y,x] and line[y,x] and zf+zb>=2:
        # outline pixel: a thin dark skin on the front; the body behind it uses the part's material colour
        cols[p].append([x,H-1-y,z+zf-1,z+zf,*map(int,c),1])
        c2=rgb[iy[y,x],ix[y,x]]
        cols[p].append([x,H-1-y,z-zb,z+zf-2,*map(int,c2),0]); continue
      cols[p].append([x,H-1-y,z-zb,z+zf,*map(int,c),int(own[y,x])])
json.dump({'W':W,'H':H,'piv':{k:[v[0],H-1-v[1]] for k,v in sp['piv'].items()},'parts':cols},open(name+'_parts.json','w'))
lab_im=np.zeros((H,W,3),np.uint8); pal={}
for i,p in enumerate(names): pal[p]=np.array(colorsys.hsv_to_rgb(i/len(names),.7,.9))*255
for y in range(H):
  for x in range(W):
    if m[y,x]: lab_im[y,x]=pal[lab[y,x]]
Image.fromarray(lab_im).resize((W*6,H*6),Image.NEAREST).save(name+'_labels.png')
print(name,{p:len(v) for p,v in cols.items()})
