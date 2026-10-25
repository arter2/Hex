import os, sys, figure, cast, rig
OUT='/tmp/claude-0/-home-user-Hex/5ecd24fc-732e-523e-bb34-78aa2fbf8119/scratchpad'
n=sys.argv[1]; view=sys.argv[2] if len(sys.argv)>2 else 'back'
o=dict(cast.LOOKS[n]); items=[]
for hatv in (o.get('hat'),'none'):
    oo=dict(o); oo['hat']=hatv
    im=figure.build(oo,view).render()
    B=figure.Body(oo.get('race','human'),oo.get('sex','m'))
    ex,ey=B.head; items.append((str(hatv),im.crop((int(ex-18),int(ey-24),int(ex+18),int(ey+16)))))
rig.sheet(items,scale=10,cols=2).save(os.path.join(OUT,'zoom.png'))
