import os, figure, cast, rig
from PIL import Image
OUT='/tmp/claude-0/-home-user-Hex/5ecd24fc-732e-523e-bb34-78aa2fbf8119/scratchpad'
import sys
n=sys.argv[1] if len(sys.argv)>1 else 'wizard'
o=dict(cast.LOOKS[n]); items=[]
for hatv in (o.get('hat'),'none'):
    oo=dict(o); oo['hat']=hatv
    im=figure.build(oo,'front').render()
    B=figure.Body(oo.get('race','human'),oo.get('sex','m'))
    ex,ey=B.head; box=(int(ex-16),int(ey-22),int(ex+16),int(ey+14))
    items.append((str(hatv),im.crop(box)))
rig.sheet(items,scale=12,cols=2).save(os.path.join(OUT,'head.png'))
