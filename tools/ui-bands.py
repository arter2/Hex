#!/usr/bin/env python3
"""python3 tools/ui-bands.py <unzipped hexmancers-ui-keygreen folder> [out=game/ui]

Draws the charge bands for the Fire and Cast frames as pixel art, at the frames' own pixel size (the same cut and
shrink as tools/ui-svg.py: a third, Lanczos), so each band is an overlay with the frame's exact viewBox. A band runs
the whole curved lane just inside the frame's rim, from the bolt at the bottom to the bolt at the top, on a circle
fitted to points along that lane. Writes fire_band_dim, fire_band_lit, cast_band_lit and cast_band_dim (.svg), and
prints each band's circle and angles for the CSS sweep."""
import sys, math, importlib.util, numpy as np
spec=importlib.util.spec_from_file_location('u',__file__.replace('ui-bands.py','ui-svg.py')); u=importlib.util.module_from_spec(spec); spec.loader.exec_module(u)
# circle (centre x, y, radius) in frame pixels, and the lane's two ends as angles (degrees, counterclockwise from +x)
BANDS={'fire':('fire_normal',(-18.1,114.8,118.0),(.5,70.0)), 'cast':('cast_normal',(102.3,100.7,84.8),(92.0,177.0))}
PAL={'fire_lit':['#4a1300','#ff7a10','#ffb020','#ffe680','#fff6c0'], 'fire_dim':['#140f12','#2c2224','#3a2c2a','#463634','#4e3e3a'],
     'cast_lit':['#06203d','#2f86d8','#5fc0ff','#a8e6ff','#e8fbff'], 'cast_dim':['#0b1424','#1c2a40','#24364f','#2c405c','#324866']}
hexrgb=lambda h:[int(h[i:i+2],16) for i in (1,3,5)]
W=4.2   # half the band's width, in frame pixels: wide enough to cover the frame's own painted lane
def band(frame,circ,ends,pal,src):
    rgb,on=u.cut(src,frame); rgb,on=u.pixelate(rgb,on,3,128,'lanczos'); h,w=on.shape; cx,cy,R=circ; a0,a1=ends
    Y,X=np.mgrid[0:h,0:w]; px,py=X+.5,Y+.5; d=np.hypot(px-cx,py-cy)-R; ang=np.degrees(np.arctan2(cy-py,px-cx))%360
    lo,hi=min(a0,a1),max(a0,a1); keep=(np.abs(d)<=W)&(ang>=lo)&(ang<=hi)&on
    P=[hexrgb(c) for c in pal]; img=np.zeros((h,w,3),np.uint8)
    t=np.abs(d); img[:]=P[1]; img[t<2.6]=P[2]; img[t<1.5]=P[3]; img[t<.6]=P[4]; img[t>=3.3]=P[0]
    seg=((ang-lo)%9.0)<.9; img[seg&(t<3.3)]=P[1]   # a dark seam every 9 degrees, like the frame's stone blocks
    return img,keep
if __name__=='__main__':
    src=sys.argv[1]; out=sys.argv[2] if len(sys.argv)>2 else 'game/ui'
    for k,(frame,circ,ends) in BANDS.items():
        for st in ('lit','dim'):
            s,wh=u.svg(*band(frame,circ,ends,PAL[k+'_'+st],src)); open(f'{out}/{k}_band_{st}.svg','w').write(s)
        print(k,frame,'circle',circ,'ends',ends,'size',wh)
