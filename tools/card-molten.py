# Molten accent trim + glowing dividers for the kit frames. Pixel patterns built per colour from palettes.json.
import re,glob,sys,json,random,math
G=sys.argv[1]; P=json.load(open(G+'/palettes.json'))
def hx(h): return [int(h[i:i+2],16) for i in (1,3,5)]
def mix(a,b,t): a,b=hx(a),hx(b); return '#%02x%02x%02x'%tuple(round(a[i]+(b[i]-a[i])*t) for i in range(3))
def noise(N,seed):
    rnd=random.Random(seed)
    def lattice(k):
        g=[[rnd.random() for _ in range(k)] for _ in range(k)]
        def v(x,y):
            fx,fy=x*k/N,y*k/N; x0,y0=int(fx),int(fy); tx,ty=fx-x0,fy-y0
            tx,ty=tx*tx*(3-2*tx),ty*ty*(3-2*ty)
            a=g[y0%k][x0%k]; b=g[y0%k][(x0+1)%k]; c=g[(y0+1)%k][x0%k]; d=g[(y0+1)%k][(x0+1)%k]
            return (a*(1-tx)+b*tx)*(1-ty)+(c*(1-tx)+d*tx)*ty
        return v
    o1,o2=lattice(4),lattice(8)
    return [[.65*o1(x,y)+.35*o2(x,y) for x in range(N)] for y in range(N)]
def pattern(pid,N,ramp,cuts,seed):
    n=noise(N,seed); flat=sorted(v for r in n for v in r)
    th=[flat[int(c*(len(flat)-1))] for c in cuts]
    out=[f'<pattern id="{pid}" width="{N}" height="{N}" patternUnits="userSpaceOnUse">']
    for y in range(N):
        x=0
        while x<N:
            lv=sum(n[y][x]>t for t in th); x1=x
            while x1<N and sum(n[y][x1]>t for t in th)==lv: x1+=1
            out.append(f'<rect x="{x}" y="{y}" width="{x1-x}" height="1" fill="{ramp[lv]}"/>'); x=x1
    out.append('</pattern>'); return ''.join(out)
def divider_pattern(pid,acc,light,dark,metal):
    seq=[metal,metal,dark,acc,acc,mix(acc,light,.5),light,mix(acc,light,.5),acc,acc,acc,dark,metal,dark,acc,mix(acc,light,.5),acc,acc,dark,metal]
    return f'<pattern id="{pid}" width="{len(seq)}" height="1" patternUnits="userSpaceOnUse">'+''.join(f'<rect x="{i}" y="0" width="1" height="1" fill="{c}"/>' for i,c in enumerate(seq))+'</pattern>'
n=0
for f in glob.glob(G+'/frames/*/*.svg'):
    col=f.split('/')[-1][:-4]; p=P[col]; s=open(f).read()
    if 'id="molten"' in s: continue
    acc,light,dark=p['accent'],p['light'],p['dark']; ember=mix(dark,'#000000',.45)
    ramp=[ember,dark,mix(dark,acc,.55),acc,mix(acc,light,.55),light]
    hot=[dark,mix(dark,acc,.6),acc,mix(acc,light,.4),mix(acc,light,.75),light]
    defs=('<defs>'+pattern('molten',32,ramp,[.12,.3,.55,.8,.94],hash(col)%1000)+pattern('molten-hot',32,hot,[.08,.25,.5,.75,.9],hash(col)%1000+7)
          +divider_pattern('divider-glow',acc,light,dark,'#55616b')+'</defs>')
    m=re.search(r'<svg[^>]*>',s); s=s[:m.end()]+defs+s[m.end():]
    # inner trim: band and line become molten
    i=s.find('<g id="inner-trim"'); j=s.find('</g>',i); g=s[i:j]
    g=re.sub(r'(<path d="[^"]*" )fill="'+dark+'"', r'\1fill="url(#molten)"', g, count=1, flags=re.I)
    g=re.sub(r'stroke="'+acc+'"', 'stroke="url(#molten-hot)"', g, count=1, flags=re.I)
    s=s[:i]+g+s[j:]
    # field dividers: the inner accent row glows, with a soft halo row above and below
    i=s.find('<g id="field-dividers"'); j=s.find('<g id="metadata-dividers"'); g=s[i:j]
    def glow(mm):
        x,y,w=mm.group(1),int(mm.group(2)),mm.group(3)
        return (f'<rect x="{x}" y="{y-1}" width="{w}" height="1" fill="{acc}" opacity=".28"/>'
                f'<rect x="{x}" y="{y}" width="{w}" height="1" fill="url(#divider-glow)"/>'
                f'<rect x="{x}" y="{y+1}" width="{w}" height="1" fill="{acc}" opacity=".28"/>')
    g=re.sub(r'<rect x="(\d+)" y="(\d+)" width="(\d+)" height="1" fill="'+dark+r'" />',glow,g,flags=re.I)
    s=s[:i]+g+s[j:]
    # vertical separators: thin and dark in the card colour
    for gid in ['metadata-dividers','details-divider']:
        i=s.find(f'<g id="{gid}"'); j=s.find('</g>',i); g=s[i:j]
        g=re.sub(r'fill="#[0-9a-f]{6}"',f'fill="{mix(dark,"#000000",.2)}"',g,flags=re.I); s=s[:i]+g+s[j:]
    open(f,'w').write(s); n+=1
print('frames',n)
