import numpy as np, importlib.util, colorsys
from PIL import Image
spec=importlib.util.spec_from_file_location('u','/home/user/Hex/tools/ui-svg.py'); u=importlib.util.module_from_spec(spec); spec.loader.exec_module(u)
K='/tmp/claude-0/-home-user/0b079505-e395-5e75-8c83-a248ffd58455/scratchpad/uikit_in/hexmancers-ui-keygreen-fixed'
def catmull(P,n=3000):
    P=np.array(P,float); P=np.vstack([2*P[0]-P[1],P,2*P[-1]-P[-2]]); out=[]
    for i in range(1,len(P)-2):
        p0,p1,p2,p3=P[i-1],P[i],P[i+1],P[i+2]
        for t in np.linspace(0,1,n//(len(P)-3),endpoint=False):
            out.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3))
    out.append(P[-2]); return np.array(out)
def warp(src_name, frame_name, pts_art, corner, half_art=5.0):
    srgb,son=u.cut(K,src_name); sh,sw=son.shape; ys,xs=np.where(son)
    A=np.c_[2*xs,2*ys,np.ones(len(xs))]; cx,cy,c=np.linalg.lstsq(A,xs**2+ys**2,rcond=None)[0]; R=np.sqrt(c+cx**2+cy**2)
    ang=np.degrees(np.arctan2(cy-ys,xs-cx)); a_top,a_bot=ang.max(),ang.min()
    src=np.dstack([srgb,np.where(son,255,0)]).astype(float)
    frgb,fon=u.cut(K,frame_name); H,W=fon.shape
    S=catmull([(x*3,y*3) for x,y in pts_art]); seg=np.hypot(*np.diff(S,axis=0).T); L=np.r_[0,np.cumsum(seg)]; s01=L/L[-1]
    k=L[-1]/(R*np.radians(a_top-a_bot)); dd=np.hypot(xs-cx,ys-cy)-R
    # the bar's real centre line: its middle across, angle by angle (a smooth fit), and its own half-width away from the caps
    bins=np.arange(a_bot,a_top,4.0); mids=[];cent=[];wid=[]
    for b0 in bins:
        m=(ang>=b0)&(ang<b0+4)
        if m.sum()>20: lo,hi=np.percentile(dd[m],[1,99]); mids.append(b0+2); cent.append((lo+hi)/2); wid.append((hi-lo)/2)
    mids=np.array(mids); keep=(mids>a_bot+12)&(mids<a_top-12); rc=np.poly1d(np.polyfit(mids[keep],np.array(cent)[keep],3)); core=np.median(np.array(wid)[keep])
    kn=half_art*3/core; half=(np.max(np.array(wid))+abs(np.array(cent)-rc(mids)).max()+2)*kn   # across: the bar's width onto half_art either side; the caps keep their size against it
    T=np.gradient(S,axis=0); T/=np.linalg.norm(T,axis=1)[:,None]; N=np.c_[-T[:,1],T[:,0]]
    # outward normal: away from the frame's square corner
    if np.mean(np.sum(N*(S-np.array(corner)),1))<0: N=-N
    out=np.zeros((H,W,4))
    Y,X=np.mgrid[0:H,0:W]; P=np.c_[X.ravel()+.5,Y.ravel()+.5]; res=np.zeros((len(P),4))
    for i0 in range(0,len(P),4000):
        q=P[i0:i0+4000]; D=((q[:,None,:]-S[None,:,:])**2).sum(-1); j=D.argmin(1); v=q-S[j]; n=(v*N[j]).sum(1); t=(v*T[j]).sum(1)
        ok=(np.abs(n)<=half)&(((j>0)&(j<len(S)-1))|(np.abs(t)<1.5))
        a=np.radians(a_top+(a_bot-a_top)*s01[j]); r=R+rc(np.degrees(a))+n/kn; sx=cx+r*np.cos(a); sy=cy-r*np.sin(a)
        x0=np.clip(np.floor(sx).astype(int),0,sw-2); y0=np.clip(np.floor(sy).astype(int),0,sh-2); fx=np.clip(sx-x0,0,1)[:,None]; fy=np.clip(sy-y0,0,1)[:,None]
        smp=src[y0,x0]*(1-fx)*(1-fy)+src[y0,x0+1]*fx*(1-fy)+src[y0+1,x0]*(1-fx)*fy+src[y0+1,x0+1]*fx*fy
        smp[~ok]=0; res[i0:i0+4000]=smp
    out=res.reshape(H,W,4); a=out[...,3]; rgb=np.where(a[...,None]>0,out[...,:3]*255/np.maximum(a[...,None],1),0)
    return np.clip(rgb,0,255).astype(np.uint8), a>=128, (frgb,fon)
def blue(rgb):
    o=rgb.copy().astype(float)/255; 
    import numpy as np
    r,g,b=o[...,0],o[...,1],o[...,2]; mx=o.max(-1); mn=o.min(-1); sat=(mx-mn)/np.maximum(mx,1e-6)
    warm=(r>=g)&(g>=b)&(sat>.35)&(mx>.45)
    # map warm brightness onto a blue ramp
    lum=.3*r+.59*g+.11*b; ramp=np.stack([lum*.2,np.minimum(1,lum*.85),np.minimum(1,lum*1.25+.25)],-1)
    o[warm]=ramp[warm]; return (np.clip(o,0,1)*255).astype(np.uint8)
def arc(cx,cy,R,a0,a1,n=9): return [(cx+R*np.cos(np.radians(a)),cy-R*np.sin(np.radians(a))) for a in np.linspace(a0,a1,n)]
# the path: an arc concentric with the button's curved edge (centre near its square corner), top bolt to bottom bolt
FIRE=arc(5,125,103,76,4)
CAST=arc(120,126,103,104,176)
if __name__=='__main__':
    import sys; outdir=sys.argv[1]
    for name,src,frame,pts,corner,tint in [('fire_bar_lit','fire_arc_full','fire_normal',FIRE,(0,392),False),('fire_bar_empty','fire_arc_empty','fire_normal',FIRE,(0,392),False),
                                         ('cast_bar_lit','fire_arc_full','cast_normal',CAST,(375,395),True),('cast_bar_empty','fire_arc_empty','cast_normal',CAST,(375,395),False)]:
        rgb,on,_=warp(src,frame,pts,corner)
        if tint: rgb=blue(rgb)
        rgb,on=u.pixelate(rgb,on,3,128,'lanczos'); s,wh=u.svg(rgb,on); open(f'{outdir}/{name}.svg','w').write(s)
        Image.fromarray(np.dstack([rgb,np.where(on,255,0)]).astype(np.uint8),'RGBA').save(f'{name}.png'); print(name,wh)
