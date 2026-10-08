# python3 peek.py out.png id1 id2 ... [--move m] [--frame f] : contact sheet (3x) of the chosen frame per view
import sys,json
from PIL import Image
args=sys.argv[2:]; move='idle'; frame=0; scale=int(__import__("os").environ.get("SC","3")); allf=False
if '--move' in args: i=args.index('--move'); move=args[i+1]; del args[i:i+2]
if '--frame' in args: i=args.index('--frame'); frame=int(args[i+1]); del args[i:i+2]
if '--all' in args: args.remove('--all'); allf=True
tiles=[]
for id in args:
  m=json.load(open(f'out/{id}.json')); im=Image.open(f'out/{id}.png'); c=m['cell']
  for ri,r in enumerate(m['rows']):
    if r['move']!=move: continue
    fr=range(r['frames']) if allf else [min(frame,r['frames']-1)]
    for f in fr: tiles.append(im.crop((f*c,ri*c,f*c+c,ri*c+c)))
W=max(t.width for t in tiles); n=len(tiles); cols=min(n,12 if not allf else 16)
out=Image.new('RGBA',(cols*W*scale,((n+cols-1)//cols)*W*scale),(30,38,44,255))
for i,t in enumerate(tiles): out.alpha_composite(t.resize((t.width*scale,t.height*scale),0),((i%cols)*W*scale+(W-t.width)*scale//2,(i//cols)*W*scale+(W-t.height)*scale))
out.save(sys.argv[1])
