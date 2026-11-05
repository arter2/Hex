"""Add physical nine-slice tiles, offline catalog data and visual overview. Needs Pillow."""
from pathlib import Path
import json,copy,hashlib
import xml.etree.ElementTree as E
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
def finish():
    path=ROOT/'asset-manifest.json';m=json.loads(path.read_text())
    m['assets']=[a for a in m['assets'] if not a['id'].startswith('slices/')]
    names=['top-left','top','top-right','left','center','right','bottom-left','bottom','bottom-right']
    for name in ['button-default-idle','button-gold-idle','panel-log']:
        a=next(a for a in m['assets'] if a['id']=='component/'+name)
        source=E.parse(ROOT/a['svg']).getroot();w,h=a['logicalSize'];t,r,b,l=a['sliceInsets'];s=a['pngScale']
        image=Image.open(ROOT/a['png']).convert('RGBA');xs=[0,l,w-r,w];ys=[0,t,h-b,h]
        for row in range(3):
            for col in range(3):
                tile=names[row*3+col];n=name+'--'+tile;x,y=xs[col],ys[row];tw,th=xs[col+1]-x,ys[row+1]-y
                out=copy.deepcopy(source);out.set('width',str(tw));out.set('height',str(th));out.set('viewBox',f'{x} {y} {tw} {th}')
                sv=ROOT/'assets/svg/slices'/(n+'.svg');pn=ROOT/'assets/png/slices'/(n+'.png');sv.parent.mkdir(parents=True,exist_ok=True);pn.parent.mkdir(parents=True,exist_ok=True)
                E.ElementTree(out).write(sv,encoding='utf-8',xml_declaration=True)
                image.crop((round(x*s),round(y*s),round((x+tw)*s),round((y+th)*s))).save(pn)
                m['assets'].append({'id':'slices/'+n,'svg':str(sv.relative_to(ROOT)),'png':str(pn.relative_to(ROOT)),
                  'logicalSize':[tw,th],'pngSize':[round(tw*s),round(th*s)],'pngScale':s,'role':'physical nine-slice '+tile,'origin':'lossless slice of v2 authored SVG','sourceComponent':a['id'],'tile':tile,'sha256':hashlib.sha256(sv.read_bytes()).hexdigest()})
    # Collapse any identical PNG byte payloads, retaining semantic manifest aliases.
    seen={}
    for a in m['assets']:
        p=ROOT/a['png'];key=hashlib.sha256(p.read_bytes()).hexdigest()
        if key in seen and a['png']!=seen[key]:
            old=a['png'];a['png']=seen[key];m['pngAliases'][old]=seen[key]
        else:seen[key]=a['png']
    referenced={a['png'] for a in m['assets']}
    for p in (ROOT/'assets/png').rglob('*.png'):
        if any(part.startswith('.') for part in p.relative_to(ROOT).parts):continue
        if str(p.relative_to(ROOT)) not in referenced:p.unlink(missing_ok=True)
    path.write_text(json.dumps(m,indent=2)+'\n');(ROOT/'manifest-data.js').write_text('const HEX_MANIFEST='+json.dumps(m,separators=(',',':'))+';\n')
    fontpath=ROOT/'source/fonts/Jersey15-Regular.ttf'
    def font(s):return ImageFont.truetype(str(fontpath),s)
    canvas=Image.new('RGB',(1800,2210),'#0c151b');d=ImageDraw.Draw(canvas)
    d.text((52,30),'HEXMANCERS / SEPARATE UI ASSETS',font=font(48),fill='#f3f1e7')
    d.text((52,92),'Editable SVG masters + transparent PNGs. One shared set for every screen size.',font=font(26),fill='#a8b6b8')
    def picture(a,box):
        im=Image.open(ROOT/a['png']).convert('RGBA');im.thumbnail((box[2],box[3]),Image.Resampling.LANCZOS)
        canvas.paste(im,(box[0]+(box[2]-im.width)//2,box[1]+(box[3]-im.height)//2),im)
    lookup={a['id']:a for a in m['assets']}
    sections=[('BUTTONS / INDEPENDENT STATES', [f'component/button-{c}-{s}' for c in ['default','gold'] for s in ['idle','pressed','disabled','focus']],155,8,198,116),
      ('SEPARATE BORDERS / SURFACES / STROKES', ['layers/button-default-idle--face','borders/button-default-idle--border','strokes/button-default-idle--outer-shadow','strokes/button-default-idle--metal-gradient','strokes/button-default-idle--top-highlight','strokes/button-default-idle--inner-keyline','layers/button-default-idle--bronze-corner-inlays','borders/panel-log--border'],340,8,198,116),
      ('TRAYS / HEALTH / DETAILS', ['trays/action-tray--surface','trays/action-tray--border','component/health-shell','health/track','health/fill-green','health/fill-warning','health/fill-danger','details/divider-rune'],535,8,198,100),
      ('GRADIENTS / TILEABLE OVERLAYS', ['gradients/'+n for n in ['steel','gold','floor-shadow','log-hint-alpha','health-green','panel-smoke']]+['textures/'+n for n in ['fine-grain','brushed-metal','woven-ink','rune-grid','smoke-cloud']],715,11,143,92)]
    for title,ids,y,cols,cw,ch in sections:
        d.text((52,y),title,font=font(28),fill='#7dd8e6')
        for i,id in enumerate(ids):
            x=52+i%cols*(cw+10);yy=y+42+i//cols*(ch+30)
            d.rectangle((x,yy,x+cw,yy+ch),fill='#26323a',outline='#435359');picture(lookup[id],(x+8,yy+6,cw-16,ch-12))
            d.text((x,yy+ch+4),id.split('/')[-1].replace('button-default-idle--','')[:23],font=font(18),fill='#a8b6b8')
    y=910;d.text((52,y),'106 SEPARATE STATUS / WORLD / CARD / ELEMENT ICONS',font=font(32),fill='#7dd8e6')
    status=json.loads((ROOT/'status-registry.json').read_text())['icons']
    for i,a in enumerate(status):
        x=52+(i%12)*141;yy=y+54+(i//12)*128
        d.rectangle((x,yy,x+127,yy+116),fill='#19272f',outline='#31434b')
        picture(lookup['status/status-'+a['id']],(x+26,yy+6,75,75))
        label=a['name']; label=label if len(label)<21 else label[:19]+'…'
        d.text((x+5,yy+85),label,font=font(18),fill='#d6dfdc')
    d.text((52,2148),'Textures are newly authored construction overlays. Original concept boards remain the appearance reference.',font=font(23),fill='#a8b6b8')
    canvas.save(ROOT/'ASSET_OVERVIEW.png')
    print('Finished:',len(m['assets']),'asset records')
if __name__=='__main__':finish()
