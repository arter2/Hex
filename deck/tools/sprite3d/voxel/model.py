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
  'k':{'torso':.7,'head':.95,'quiver':.8},'cap':{'armL':4,'armR':4},'fill':{'torso':[[14,15,33,47]],'legL':[[16,42,24,50]],'legR':[[24,42,32,50]]}},
 'link':{'rules':[('armR',[24,0,40,50]),('armR',[19,38,24,46]),('head',[4,14,26,37]),('armL',[0,42,8,59]),
   ('torso',[0,58,40,63],'cloth'),('legL',[0,60,16,82]),('legR',[17,60,40,82])],
  'piv':{'head':[16,36],'armL':[6,42],'armR':[21,42],'legL':[11,60],'legR':[22,60]},
  'z':{'armR':2},'k':{'torso':.75,'head':.9},'cap':{'armR':2.5,'armL':4},
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
# 3D model informed by the reference: every part is rebuilt row by row as an elliptical
# cross-section sized from its pixel span. Front faces carry the exact reference pixels; side,
# top and back faces take that row's own material colour (median of the row's left / right third),
# so turned views show real material instead of pixels stretched backwards.
names=sorted(set(lab[m])); out={}
def med(cs): return [int(v) for v in np.median(np.array(cs),0)] if len(cs) else None
for p in names:
  own=(lab==p); full=own.copy()
  for (x0,y0,x1,y1) in sp['fill'].get(p,[]): full[y0:y1+1,x0:x1+1]=True
  if p in sp['fill']: full=nd.binary_closing(full,iterations=1)|own
  mat=own&~line; src=mat if mat.any() else own
  _,(iy,ix)=nd.distance_transform_edt(~src,return_indices=True)
  k=sp.get('k',{}).get(p,1.0); cap=sp.get('cap',{}).get(p,99); z=sp['z'].get(p,0)
  # row bands (fall back to nearest row that has material pixels)
  bands={}
  for y in range(H):
    xs=np.where(mat[y])[0]
    if len(xs): 
      t=max(1,len(xs)//3); bands[y]=(med([rgb[y,x] for x in xs[:t]]),med([rgb[y,x] for x in xs[-t:]]),med([rgb[y,x] for x in xs]))
  ys=sorted(bands)
  def band(y): return bands[min(ys,key=lambda r:abs(r-y))]
  # per-row spans, with half-widths smoothed over neighbouring rows so the volume is not jagged
  cols=[]
  for y in range(H):
    xs=np.where(full[y])[0]
    if not len(xs): continue
    runs=np.split(xs,np.where(np.diff(xs)>1)[0]+1)
    for r in runs:
      cx=(r[0]+r[-1]+1)/2; hw=(r[-1]-r[0]+1)/2
      d=min(hw*k,cap)
      L,Rr,M=band(y)
      for x in r:
        u=(x+.5-cx)/hw; zh=max(0.5,d*np.sqrt(max(0,1-u*u)))
        if own[y,x]: c=rgb[y,x]
        else: c=rgb[iy[y,x],ix[y,x]]
        zf=z+zh; zb=z-zh*0.9
        o=lab[y,x]
        if not own[y,x] and o and o!=p:      # hidden behind another part: sit behind it
          oz=sp['z'].get(o,0)
          zf=min(zf,oz-0.5)
          if zf<=zb: continue
        cols.append([int(x),H-1-y,round(zb,2),round(zf,2),[int(v) for v in c],L,Rr,M])
  out[p]=cols
json.dump({'W':W,'H':H,'piv':{k2:[v[0],H-1-v[1]] for k2,v in sp['piv'].items()},'parts':out},open(name+'_model.json','w'))
print(name,{p:len(v) for p,v in out.items()})
