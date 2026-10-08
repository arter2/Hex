# python3 flowboard.py out.png SC MAXW id... : packed rows of trimmed front idle frames with names, bottom-aligned per row
import sys,json
from PIL import Image, ImageDraw, ImageFont
out=sys.argv[1]; sc=int(sys.argv[2]); MW=int(sys.argv[3]); ids=sys.argv[4:]
man={m['id']:m for m in json.load(open('../gallery/manifest.json'))}
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
tiles=[]
for id in ids:
  m=json.load(open(f'out/{id}.json')); im=Image.open(f'out/{id}.png').convert('RGBA'); c=m['cell']
  ri=next((i for i,r in enumerate(m['rows']) if r['move'] in ('idle','icon') and r['view']!='back'),0)
  t=im.crop((0,ri*c,c,ri*c+c)); bb=t.getbbox(); t=t.crop((bb[0],bb[1],bb[2],bb[3])); t=t.resize((t.width*sc,t.height*sc),0)
  name=man[id]['name'].replace(' (legendary)','').replace(' (man)',' ♂').replace(' (woman)',' ♀')
  tw=int(font.getlength(name)); tiles.append((t,name,max(t.width,tw)+18))
rows=[]; cur=[]; w=0
for t in tiles:
  if cur and w+t[2]>MW: rows.append(cur); cur=[]; w=0
  cur.append(t); w+=t[2]
rows.append(cur)
H=sum(max(t[0].height for t in r)+30 for r in rows)+10
img=Image.new('RGBA',(MW,H),(16,22,26,255)); d=ImageDraw.Draw(img); y=10
for r in rows:
  rh=max(t[0].height for t in r); x=(MW-sum(t[2] for t in r))//2
  for t,name,cw in r:
    img.alpha_composite(t,(x+(cw-t.width)//2,y+rh-t.height)); tw=font.getlength(name); d.text((x+(cw-tw)/2,y+rh+6),name,fill=(200,214,206,255),font=font); x+=cw
  y+=rh+30
img.save(out); print(img.size)
