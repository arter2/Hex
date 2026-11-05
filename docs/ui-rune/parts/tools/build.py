#!/usr/bin/env python3
"""Rebuild separated SVG parts, manifests and high-resolution RGBA PNG exports.
Python 3 and Pillow; export requires Inkscape. Run from any directory.
"""
import copy, hashlib, json, subprocess, concurrent.futures, re, tempfile
from pathlib import Path
import xml.etree.ElementTree as E

ROOT=Path(__file__).resolve().parents[1]
NS='http://www.w3.org/2000/svg'
INK='http://www.inkscape.org/namespaces/inkscape'
E.register_namespace('',NS); E.register_namespace('inkscape',INK)
records=[]; recipes={}; digest_paths={}

def svg(w,h,body,title):
    return f'<svg xmlns="{NS}" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{title}</title>{body}</svg>'

def emit(group,name,w,h,body,role,origin='new construction asset',slices=None):
    path=ROOT/'assets/svg'/group/(name+'.svg');path.parent.mkdir(parents=True,exist_ok=True)
    text=body if body.lstrip().startswith('<svg') else svg(w,h,body,name)
    path.write_text(text+'\n')
    entry={'id':f'{group}/{name}','svg':str(path.relative_to(ROOT)),'logicalSize':[w,h],
      'role':role,'origin':origin,'pngScale':max(4,512/min(w,h)) if max(w,h)<=32 else 4}
    # Limit long strips and tall panels to 2048px on their longest side.
    entry['pngScale']=min(entry['pngScale'],2048/max(w,h))
    if slices:entry['sliceInsets']=slices
    records.append(entry);return entry['id']

def serialized(node):return E.tostring(node,encoding='unicode')

def extract(root,node):
    out=E.Element(f'{{{NS}}}svg',root.attrib)
    for x in root.iter(f'{{{NS}}}defs'):out.append(copy.deepcopy(x))
    out.append(copy.deepcopy(node));return serialized(out)

for p in sorted((ROOT/'source/components').glob('*.svg')):
    r=E.parse(p).getroot(); w,h=map(float,r.attrib['viewBox'].split()[2:]);w=int(w);h=int(h)
    n=p.stem
    # These files are the editable assembled masters; never duplicate them into assets/svg.
    entry={'id':'component/'+n,'svg':str(p.relative_to(ROOT)),'logicalSize':[w,h],
      'role':'assembled editable component; no label or icon baked in','origin':'v2 authored SVG',
      'pngScale':4}
    if n.startswith(('button-','panel-')) or n in ['health-shell','depth-badge','minimap-frame']:
        entry['sliceInsets']=[10]*4 if n.startswith('panel-') else [8]*4
    records.append(entry)
    recipe=[]
    top=next((x for x in r if x.tag==f'{{{NS}}}g'),None)
    if top is not None:
        for g in top:
            layer=g.get('data-layer')
            if not layer:continue
            frag=extract(r,g)
            key=emit('layers',n+'--'+layer,w,h,frag,'individual '+layer,origin='exact v2 SVG layer')
            recipe.append(key)
            if layer in ['metal-rim','whisper-frame']:
                stroke_names=['outer-shadow','metal-gradient','top-highlight','bottom-shadow','inner-keyline'] if layer=='metal-rim' else ['outline','top-highlight','bottom-keyline','rune-hairline']
                for i,ch in enumerate(g):
                    gg=E.Element(g.tag,g.attrib);gg.append(copy.deepcopy(ch))
                    emit('strokes',n+'--'+stroke_names[i],w,h,extract(r,gg),'one independent border stroke',origin='exact v2 SVG stroke')
        # Border overlay excludes all face/smoke fills and preserves decorative corners.
        selected=[x for x in top if x.get('data-layer') in ['metal-rim','whisper-frame','bronze-corner-inlays','corner-pins','focus']]
        if selected:
            out=E.Element(r.tag,r.attrib)
            for de in r.iter(f'{{{NS}}}defs'):out.append(copy.deepcopy(de))
            group=E.SubElement(out,f'{{{NS}}}g',{'opacity':top.get('opacity','1')})
            for x in selected:group.append(copy.deepcopy(x))
            emit('borders',n+'--border',w,h,serialized(out),'transparent border only; resize with nine-slice',origin='exact v2 SVG layers',slices=entry.get('sliceInsets'))
    recipes[n]={'size':[w,h],'assembled':entry['id'],'bottomToTop':recipe,
      'groupOpacity':float(top.get('opacity','1')) if top is not None else 1,
      'opacityRule':'Composite the listed layers as one group, then apply groupOpacity once.'}

# Exact gradients from source masters, plus layout gradients from the v2 construction.
gradients={
 'steel':[(0,'#b5c1bb',1),(.16,'#626f70',1),(.52,'#242e33',1),(1,'#626f70',1)],
 'gold':[(0,'#ffe5a1',1),(.16,'#967b3e',1),(.52,'#473a22',1),(1,'#967b3e',1)],
 'floor-shadow':[(0,'#03090d',0),(1,'#03090d',.73)],
 'log-hint-alpha':[(0,'#ffffff',.28),(.85,'#ffffff',0),(1,'#ffffff',0)],
 'health-green':[(0,'#d7ffe7',1),(.25,'#72e5a4',1),(1,'#1d8f59',1)],
 'health-warning':[(0,'#fff1ad',1),(.25,'#e1b34b',1),(1,'#926d25',1)],
 'health-danger':[(0,'#ffd6c7',1),(.25,'#ec9384',1),(1,'#9b4149',1)],
 'panel-smoke':[(0,'#101a1e',.68),(1,'#101a1e',.88)],
 'cyan-glow':[(0,'#7dd8e6',.55),(1,'#7dd8e6',0)]}
for n,stops in gradients.items():
    stop=''.join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o,c,a in stops)
    emit('gradients',n,64,256,f'<defs><linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">{stop}</linearGradient></defs><rect width="64" height="256" fill="url(#gradient)"/>','standalone vertical gradient swatch',origin='exact v2 stops' if n in ['steel','gold','floor-shadow','log-hint-alpha'] else 'new supplemental gradient')
(ROOT/'gradients.json').write_text(json.dumps({n:[{'offset':o,'color':c,'alpha':a} for o,c,a in s] for n,s in gradients.items()},indent=2)+'\n')

# Authored tileable vector textures: sparse, intentionally subtle and independent.
import random
rng=random.Random(214)
grain=''.join(f'<rect x="{rng.randrange(64)}" y="{rng.randrange(64)}" width="1" height="1" fill="{rng.choice(["#d4e4dc","#02080b"])}" opacity="{rng.choice([.06,.08,.1,.12])}"/>' for _ in range(500))
textures={
 'fine-grain':grain,
 'brushed-metal':''.join(f'<path d="M0 {y+.5}H64" stroke="{rng.choice(["#b5c1bb","#060d11"])}" stroke-opacity="{rng.choice([.035,.06,.08])}" stroke-width=".5"/>' for y in range(0,64,2)),
 'woven-ink':'<defs><pattern id="weave" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 1H8M1 0V8" stroke="#b5c1bb" stroke-opacity=".065" stroke-width="1"/><path d="M0 5H8M5 0V8" stroke="#000" stroke-opacity=".1"/></pattern></defs><rect width="64" height="64" fill="url(#weave)"/>',
 'rune-grid':'<defs><pattern id="runes" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M12 8v16m0-12 8 4-8 4m4-12 4 4m-4 8 4 4" fill="none" stroke="#7dd8e6" stroke-opacity=".1" stroke-width=".6"/></pattern></defs><rect width="64" height="64" fill="url(#runes)"/>',
 'smoke-cloud':'<defs><pattern id="smoke" width="64" height="64" patternUnits="userSpaceOnUse"><radialGradient id="mist"><stop stop-color="#a0b7b6" stop-opacity=".09"/><stop offset="1" stop-color="#a0b7b6" stop-opacity="0"/></radialGradient><ellipse cx="32" cy="32" rx="30" ry="18" fill="url(#mist)"/><ellipse cx="0" cy="0" rx="22" ry="14" fill="url(#mist)"/><ellipse cx="64" cy="0" rx="22" ry="14" fill="url(#mist)"/><ellipse cx="0" cy="64" rx="22" ry="14" fill="url(#mist)"/><ellipse cx="64" cy="64" rx="22" ry="14" fill="url(#mist)"/></pattern></defs><rect width="64" height="64" fill="url(#smoke)"/>'}
for n,b in textures.items():emit('textures',n,64,64,b,'repeat at 64 logical px; optional overlay',origin='new authored seamless supplemental texture')

# Structural trays are blank and reusable for either hand.
def chamfer(w,h,c):return f'M{c} 0H{w-c}L{w} {c}V{h-c}L{w-c} {h}H{c}L0 {h-c}V{c}Z'
for n,w,h in [('action-tray',340,64),('log-strip',340,40),('status-tray',160,28),('tooltip-tray',240,84)]:
    surface=f'<path d="{chamfer(w,h,7)}" fill="#101a1e" fill-opacity=".5"/>'
    border=f'<path d="{chamfer(w-2,h-2,6)}" transform="translate(1 1)" fill="none" stroke="#626f70" stroke-opacity=".8" stroke-width="1.2"/>'
    emit('trays',n+'--surface',w,h,surface,'blank tray surface',slices=[9]*4)
    emit('trays',n+'--border',w,h,border,'independent tray frame',slices=[9]*4)
    recipes[n]={'size':[w,h],'bottomToTop':['trays/'+n+'--surface','trays/'+n+'--border'],'note':'new supplemental tray; approved action row itself may stay unbacked'}

# Small standalone ornament and control pieces.
details={
 'corner-bronze':(8,8,'<path d="M1 1h6v2H3v4H1z" fill="#897052"/><rect x="3" y="3" width="2" height="2" fill="#c0a074" opacity=".7"/>'),
 'rivet':(8,8,'<rect x="2" y="2" width="4" height="4" fill="#897052"/><path d="M2 2h4M2 2v4" stroke="#c0a074" stroke-width=".65"/>'),
 'divider-steel':(128,4,'<path d="M0 2H128" stroke="#626f70"/><path d="M8 1H120" stroke="#b5c1bb" stroke-opacity=".35" stroke-width=".5"/>'),
 'divider-rune':(128,12,'<path d="M0 6H55m18 0h55" stroke="#739095" stroke-width=".7"/><path d="m64 1 4 5-4 5-4-5z" fill="#7dd8e6"/>'),
 'scroll-thumb':(4,40,'<rect width="4" height="40" rx="2" fill="#a6dfeb"/>'),
 'scroll-rail':(4,160,'<rect width="4" height="160" rx="2" fill="#819b9d" opacity=".25"/>'),
 'status-badge':(24,24,'<path d="M5 1h14l4 4v14l-4 4H5l-4-4V5z" fill="#101a1e" fill-opacity=".55" stroke="#739095" stroke-width=".75"/>'),
 'status-timer':(24,24,'<path d="M12 1a11 11 0 1 1-11 11" fill="none" stroke="#7dd8e6" stroke-width="1.2"/>')}
for n,(w,h,b) in details.items():emit('details',n,w,h,b,'separate decoration or control layer')

# Health meter's logical window matches the compact v2 header: x92 y14, 48x4.
health={
 'track': '<rect width="48" height="4" fill="#06130e"/><path d="M0 .5H48" stroke="#000" stroke-opacity=".6"/>',
 'fill-green':'<rect width="48" height="4" fill="#72e5a4"/>',
 'fill-warning':'<rect width="48" height="4" fill="#e1b34b"/>',
 'fill-danger':'<rect width="48" height="4" fill="#ec9384"/>',
 'damage-lag':'<rect width="48" height="4" fill="#efc478" fill-opacity=".7"/>',
 'highlight':'<path d="M1 .5H47" stroke="#d7ffe7" stroke-width="1"/>',
 'inner-shadow':'<path d="M0 3.5H48" stroke="#073521" stroke-width="1"/>',
 'mask':'<rect width="48" height="4" fill="#fff"/>',
 'outline':'<rect x=".25" y=".25" width="47.5" height="3.5" fill="none" stroke="#b5c1bb" stroke-opacity=".55" stroke-width=".5"/>'}
for n,b in health.items():emit('health',n,48,4,b,'health meter '+n)
recipes['health-meter']={'size':[48,4],'shell':'component/health-shell','windowInShell':[92,14,48,4],
 'bottomToTop':['health/track','health/damage-lag','health/fill-green','health/highlight','health/inner-shadow','health/outline'],
 'fillRule':'clip fill + highlight to width 48 * clamp(current/max,0,1); keep track, outline, shell full width; max <= 0 gives zero',
 'text':'editable live current/max at x14, y21 in shell; crystal ornament at x-6,y-4 width24 height32'}

# Catalog the existing icons exactly once. Status meanings retain the v2 source mapping.
for folder in ['icons','status']:
    for p in sorted((ROOT/'assets/svg'/folder).glob('*.svg')):
        r=E.parse(p).getroot();w,h=map(float,r.attrib['viewBox'].split()[2:])
        records.append({'id':folder+'/'+p.stem,'svg':str(p.relative_to(ROOT)),
          'logicalSize':[w,h],'pngScale':512/max(w,h),'role':'individual '+folder+' glyph','origin':'v2 authored SVG'})

(ROOT/'assembly-recipes.json').write_text(json.dumps(recipes,indent=2)+'\n')

def export(a):
    source=ROOT/a['svg'];out=ROOT/'assets/png'/a['id'].split('/')[0]/(a['id'].split('/')[1]+'.png')
    out.parent.mkdir(parents=True,exist_ok=True)
    w,h=a['logicalSize'];pw=round(w*a['pngScale']);ph=round(h*a['pngScale'])
    # Render outside the synchronized tree, then install the complete bytes.
    with tempfile.TemporaryDirectory(prefix='hx-export-') as temp:
        staging=Path(temp)/'export.png'
        cmd=['inkscape',str(source),'--export-type=png','--export-area-page','--export-background-opacity=0',f'--export-width={pw}',f'--export-height={ph}',f'--export-filename={staging}']
        run=subprocess.run(cmd,capture_output=True)
        if run.returncode:raise RuntimeError(run.stderr.decode()[:600])
        out.write_bytes(staging.read_bytes())
    a['png']=str(out.relative_to(ROOT));a['pngSize']=[pw,ph]
    a['sha256']=hashlib.sha256(source.read_bytes()).hexdigest()
    return a

if __name__=='__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(export,records))
    # Repeated state borders can be byte-identical even when source IDs differ.
    # Content-normalized aliases preserve every semantic name without duplicate PNGs.
    aliases={};seen={}
    for a in records:
        png=ROOT/a['png'];key=hashlib.sha256(png.read_bytes()).hexdigest()
        if key in seen:
            old=a['png'];a['png']=seen[key];png.unlink();aliases[old]=a['png']
        else:seen[key]=a['png']
    (ROOT/'asset-manifest.json').write_text(json.dumps({'version':'3.0','sliceOrder':'top,right,bottom,left; logical units; multiply by pngScale for raster source insets','assets':records,'pngAliases':aliases},indent=2)+'\n')
    import finish
    finish.finish()
    print(json.dumps({'svgAssets':len(records),'uniquePNGs':len(seen),'statusIcons':len(list((ROOT/'assets/svg/status').glob('*.svg'))),'recipes':len(recipes)}))
