# python3 board.py out.png SC COLS id... : labelled lineup of front idle frames (icon for weapons), trimmed, bottom-aligned
import sys,json,os
from PIL import Image, ImageDraw, ImageFont
out=sys.argv[1]; sc=int(sys.argv[2]); cols=int(sys.argv[3]); ids=sys.argv[4:]
man={m['id']:m for m in json.load(open('../gallery/manifest.json'))}
tiles=[]
for id in ids:
  m=json.load(open(f'out/{id}.json')); im=Image.open(f'out/{id}.png').convert('RGBA'); c=m['cell']
  ri=next((i for i,r in enumerate(m['rows']) if r['move'] in ('idle','icon') and r['view']!='back'), 0)
  t=im.crop((0,ri*c,c,ri*c+c)); bb=t.getbbox() or (0,0,c,c); t=t.crop((max(0,bb[0]-2),max(0,bb[1]-2),min(c,bb[2]+2),c)); tiles.append((id,t))
W=max(t.width for _,t in tiles)*sc+16; H=max(t.height for _,t in tiles)*sc+40
rows=(len(tiles)+cols-1)//cols
img=Image.new('RGBA',(cols*W,rows*H),(16,22,26,255)); d=ImageDraw.Draw(img)
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',max(12,int(6*sc)))
except: font=ImageFont.load_default()
for i,(id,t) in enumerate(tiles):
  x=(i%cols)*W; y=(i//cols)*H; tt=t.resize((t.width*sc,t.height*sc),0)
  img.alpha_composite(tt,(x+(W-tt.width)//2,y+H-30-tt.height))
  name=man.get(id,{}).get('name',id).replace(' (legendary)','')
  tw=d.textlength(name,font=font); d.text((x+(W-tw)/2,y+H-26),name,fill=(200,214,206,255),font=font)
img.save(out)
print(img.size)
