# Keep the count plaque black: mask the plaque (layouts.json count_bounds) out of every rim overlay (holo trim, enchanted/buffed glows).
import re,glob,sys,json
G=sys.argv[1]; L=json.load(open(G+'/layouts.json')); n=0
files=glob.glob(G+'/foils/*/*/trim*.svg')+glob.glob(G+'/glows/*/*.svg')
for f in files:
    mode='compact' if '/compact/' in f else 'expanded'
    x,y,w,h=L[mode]['count_bounds']; s=open(f).read()
    if 'id="no-plaque"' in s: continue
    m=re.search(r'<svg[^>]*>',s); vb=re.search(r'viewBox="0 0 (\d+) (\d+)"',m.group(0)).groups()
    mask=(f'<defs><mask id="no-plaque" maskUnits="userSpaceOnUse" x="0" y="0" width="{vb[0]}" height="{vb[1]}">'
          f'<rect x="0" y="0" width="{vb[0]}" height="{vb[1]}" fill="#fff"/><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#000"/></mask></defs>'
          '<g mask="url(#no-plaque)">')
    k=s.rfind('</svg>'); s=s[:m.end()]+mask+s[m.end():k]+'</g>'+s[k:]
    open(f,'w').write(s); n+=1
print('masked',n)
