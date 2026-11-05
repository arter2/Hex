"""Verify linked assets, 106 status mappings, alpha exports and layer reconstruction."""
from pathlib import Path
import xml.etree.ElementTree as E
import json,hashlib,re,tempfile,subprocess,collections
from PIL import Image,ImageChops
ROOT=Path(__file__).resolve().parents[1]
NS='http://www.w3.org/2000/svg'
def verify():
    manifest=json.loads((ROOT/'asset-manifest.json').read_text());assets=manifest['assets'];lookup={a['id']:a for a in assets};errors=[]
    assert len(lookup)==len(assets)
    modes=collections.Counter();alpha_stats=collections.Counter()
    for a in assets:
        for k in ['svg','png']:
            if not (ROOT/a[k]).is_file():errors.append('missing '+a[k])
        r=E.parse(ROOT/a['svg']).getroot()
        ids={x.get('id') for x in r.iter() if x.get('id')}
        for x in r.iter():
            for value in x.attrib.values():
                for target in re.findall(r'url\(#([^\)]+)\)',value):
                    if target not in ids:errors.append(a['id']+' missing SVG reference '+target)
        im=Image.open(ROOT/a['png']);modes[im.mode]+=1
        if im.size!=tuple(a['pngSize']):errors.append('wrong PNG dimensions '+a['id'])
        if im.mode!='RGBA':errors.append('missing RGBA channel '+a['id'])
        else:
            extrema=im.getchannel('A').getextrema()
            if extrema[1]==0:errors.append('empty asset '+a['id'])
            alpha_stats['withTransparency' if extrema[0]<255 else 'solidRectangles']+=1
    registry=json.loads((ROOT/'status-registry.json').read_text())['icons'];assert len(registry)==106
    for a in registry:
        if not (ROOT/a['svg']).is_file():errors.append('missing status '+a['id'])
    # Compare recomposed source layers to each original source skin at 4x.
    recipes=json.loads((ROOT/'assembly-recipes.json').read_text());comparisons={}
    with tempfile.TemporaryDirectory(prefix='hx-ui-qa-') as temp:
        temp=Path(temp)
        for name,recipe in recipes.items():
            if 'assembled' not in recipe or not recipe['bottomToTop']:continue
            a=lookup[recipe['assembled']];source=E.parse(ROOT/a['svg']).getroot()
            out=E.Element(source.tag,source.attrib)
            group=E.SubElement(out,f'{{{NS}}}g',{'opacity':str(recipe['groupOpacity'])})
            for id in recipe['bottomToTop']:
                frag=E.parse(ROOT/lookup[id]['svg']).getroot()
                for ch in frag:
                    if ch.tag!=f'{{{NS}}}title':group.append(ch)
            sv=temp/(name+'.svg');pn=temp/(name+'.png');E.ElementTree(out).write(sv,encoding='utf-8')
            run=subprocess.run(['inkscape',str(sv),'--export-type=png','--export-background-opacity=0',f'--export-width={a["pngSize"][0]}',f'--export-height={a["pngSize"][1]}',f'--export-filename={pn}'],capture_output=True)
            assert run.returncode==0,run.stderr
            expected=Image.open(ROOT/a['png']).convert('RGBA');actual=Image.open(pn).convert('RGBA')
            # Compare premultiplied appearance over both black and white to ignore RGB under alpha=0.
            delta=0
            for color in ['black','white']:
                bg=Image.new('RGBA',actual.size,color)
                aa=Image.alpha_composite(bg,actual).convert('RGB');bb=Image.alpha_composite(bg,expected).convert('RGB')
                delta=max(delta,max(x[1] for x in ImageChops.difference(aa,bb).getextrema()))
            comparisons[name]=delta
            if delta>1:errors.append('layer reconstruction differs '+name+': '+str(delta))
    # Every quoted local HTML/CSS/JS asset URL should resolve.
    for file in ['example.html','ui.css']:
        txt=(ROOT/file).read_text()
        for target in re.findall(r'(?:src|href)=["\']([^"\']+)["\']|url\(([^\)]+)\)',txt):
            url=next(x for x in target if x).strip('"\'')
            if '$' not in url and not url.startswith(('http','#')) and not (ROOT/url).exists():errors.append('bad local link '+url)
    report={'assetEntries':len(assets),'statusIcons':len(registry),'actionIcons':sum(a['id'].startswith('icons/') for a in assets),
      'uniquePngFiles':len({a['png'] for a in assets}),'pngModes':dict(modes),'alpha':dict(alpha_stats),'layerReconstructionMaxChannelDifference':comparisons,
      'currentRepositoryAudit':False,'errors':errors}
    (ROOT/'QA_REPORT.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2));assert not errors
if __name__=='__main__':verify()
