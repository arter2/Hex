#!/usr/bin/env python3
"""Hexmancers cards (v179): build every card layer from the one geometry source, game/cards/contract.json.

  python3 tools/card-build.py

Writes, under game/cards/:
  frames/card/<colour>.svg           the frame: steel edge, bricked stone rail, copper corner plates (one assembly, lit
                                     from the upper left at all four corners), the molten accent line, field panels,
                                     dividers with end nubs, separators and the count plaque with its wings
  textures/card/<colour>-<v>.svg     the colour's three material patterns (the v2.2 kit's tiles), over the whole card
                                     but the art window
  glows/card/*.svg                   enchanted / buffed / both rims (and -animated), the count plaque left dark
  foils/card/<colour>/trim*.svg      the holo rim: a rainbow leaning 40% toward the colour's accent, plaque left dark
  badges/card/*.svg                  the enchanted / buffed state badges in the header
  card-geo.css                       every slot's place, as percentages of the canvas
Colours come from palettes.json; structural colours (steel, stone, copper, plates) from the contract. Deterministic:
the same contract and palettes give the same files.
"""
import colorsys, json, os, random, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'game', 'cards')
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'card-src')   # the v2.2 kit's material tiles and state badges
C = json.load(open(os.path.join(ROOT, 'contract.json')))
PAL = json.load(open(os.path.join(ROOT, 'palettes.json')))
W, H = C['canvas']['width'], C['canvas']['height']
ST = C['structural']


def hx(c):
    c = c.lstrip('#'); return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    a, b = hx(a), hx(b); return '#%02x%02x%02x' % tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


class Svg:
    def __init__(self): self.out = []; self.cells = {}
    def r(self, x, y, w, h, fill, op=None):
        """a rect; consecutive rects of one fill share a single path (painter's order is kept)"""
        if w <= 0 or h <= 0: return
        key = (fill, op); d = 'M%g %gh%gv%gh-%gz' % (x, y, w, h, w)
        if self.out and isinstance(self.out[-1], list) and self.out[-1][0] == key: self.out[-1][1].append(d)
        else: self.out.append([key, [d]])
    def raw(self, s): self.out.append(s)
    def body(self):
        return ''.join(o if isinstance(o, str) else '<path d="%s" fill="%s"%s/>' % (''.join(o[1]), o[0][0], '' if o[0][1] is None else ' opacity="%g"' % o[0][1]) for o in self.out)
    def runs(self, x0, y, cols):
        """one row of opaque unit cells, same colours merged; held by colour until flush() (they must not overlap)"""
        i = 0
        while i < len(cols):
            j = i
            while j < len(cols) and cols[j] == cols[i]: j += 1
            if cols[i]: self.cells.setdefault(cols[i], []).append('M%d %dh%dv1h-%dz' % (x0 + i, y, j - i, j - i))
            i = j
    def flush(self):
        for c, ds in sorted(self.cells.items()): self.out.append([(c, None), ds])
        self.cells = {}
    def doc(self, title, defs=''):
        return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" shape-rendering="crispEdges">'
                '<title>%s</title>%s%s</svg>\n') % (W * 6, H * 6, W, H, title, defs, self.body())


def write(rel, text):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w').write(text)


B = C['bands']; BOT = B['bottom']
FACE = C['face']
AX0 = 14; AX1 = W - 14          # the accent ring's outer edge, x
AY0 = 14; AY1 = BOT['accent'][0] + BOT['accent'][1]   # and y (14..407)


def stone_rail(s, rnd, x, y, w, h, horiz):
    """a bricked stone rail: dark edge, a highlight line, the body in two tones, joints every 30-36 units"""
    dark, hi, body, body2, deep = ST['stone']
    s.r(x, y, w, h, body)
    n = w if horiz else h
    pos, k = 0, 0
    while pos < n:
        ln = rnd.randint(30, 36) if pos else rnd.randint(10, 22)
        ln = min(ln, n - pos)
        tone = body if k % 2 == 0 else body2
        if horiz:
            s.r(x + pos, y + 2, ln, h - 3, tone); s.r(x + pos, y + 1, ln, 1, hi)
            if pos: s.r(x + pos, y + 1, 1, h - 2, deep); s.r(x + pos + 1, y + 2, 1, h - 4, mix(hi, body, .5))
        else:
            s.r(x + 2, y + pos, w - 3, ln, tone); s.r(x + 1, y + pos, 1, ln, hi)
            if pos: s.r(x + 1, y + pos, w - 2, 1, deep); s.r(x + 2, y + pos + 1, w - 4, 1, mix(hi, body, .5))
        # a few chips in the stone
        for _ in range(ln // 9):
            cx = rnd.randrange(ln); cy = rnd.randrange(2, (h if horiz else w) - 1)
            if horiz: s.r(x + pos + cx, y + cy, 1, 1, mix(body, hi, .35))
            else: s.r(x + cy, y + pos + cx, 1, 1, mix(body, hi, .35))
        pos += ln; k += 1
    if horiz: s.r(x, y, w, 1, dark); s.r(x, y + h - 1, w, 1, deep)
    else: s.r(x, y, 1, h, dark); s.r(x + w - 1, y, 1, h, deep)


def molten(rnd, p, depth, n):
    """one row of the accent line: depth 0 outer (dim), 1 the hot middle, 2 inner"""
    acc, lt, dk = p['accent'], p['light'], p['dark']
    out = []
    for _ in range(n):
        v = rnd.random()
        if depth == 1: out.append(mix(acc, lt, .6) if v < .07 else mix(acc, dk, .2) if v < .15 else acc)
        elif depth == 0: out.append(mix(acc, dk, .5) if v < .9 else mix(acc, dk, .3))
        else: out.append(mix(acc, dk, .7) if v < .85 else mix(acc, dk, .45))
    return out


def corner(s, x, y):
    ol, hi, face, sh, ring, rivet = ST['copper']
    s.r(x, y, 12, 12, ol); s.r(x + 1, y + 1, 10, 10, face)
    s.r(x + 1, y + 1, 10, 1, hi); s.r(x + 1, y + 1, 1, 10, hi)
    s.r(x + 1, y + 10, 10, 1, sh); s.r(x + 10, y + 1, 1, 10, sh)
    s.r(x + 3, y + 4, 6, 4, ring); s.r(x + 4, y + 3, 4, 6, ring)          # the rivet: a dark round socket, a bright head
    s.r(x + 4, y + 4, 4, 4, '#2a160c'); s.r(x + 5, y + 5, 2, 2, rivet); s.r(x + 6, y + 6, 1, 1, '#b0b6b5')


def divider(s, rnd, p, m):
    x0, x1 = C['divider_x']; n = x1 - x0
    s.runs(x0, m - 2, ['#000000'] * n); s.runs(x0, m + 2, ['#000000'] * n)
    metal = ['#28282a', '#5e6264', '#28282a']
    pos, hot = 0, rnd.random() < .5
    while pos < n:
        ln = min(rnd.randint(8, 26), n - pos)
        for d in range(3):
            row = ([metal[d]] * ln) if not hot else molten(rnd, p, [0, 1, 0][d], ln)
            if hot and d != 1: row = [mix(c, '#000000', .35) for c in row]
            s.runs(x0 + pos, m - 1 + d, row)
        pos += ln; hot = not hot


def nubs(s, p, m):
    """a divider's ends: small bright points coming in off the side accent lines"""
    x0, x1 = C['divider_x']; lt = p['light']
    for (cx, dx) in ((x0, 1), (x1 - 1, -1)):
        s.r(cx, m - 2, 1, 5, lt); s.r(cx + dx, m - 1, 1, 3, lt); s.r(cx + 2 * dx, m, 1, 1, lt)


def panel(s, x, y, w, h, fill):
    s.r(x, y, w, h, fill, .55)
    s.r(x, y, w, 1, '#000000', .35); s.r(x, y + h - 1, w, 1, '#000000', .35)
    s.r(x, y, 1, h, '#000000', .45); s.r(x + w - 1, y, 1, h, '#000000', .45)
    for cx, cy in ((x, y), (x + w - 1, y), (x, y + h - 1), (x + w - 1, y + h - 1)): s.r(cx, cy, 1, 1, '#000000', .6)


def plaque(s):
    ol, hi, face, sh, ring, rivet = ST['copper']
    for wx, wy, ww, wh in C['plaque']['wings']:
        s.r(wx, wy, ww, wh, ol); s.r(wx + 1, wy + 1, ww - 2, wh - 2, face)
        s.r(wx + 1, wy + 1, ww - 2, 1, hi); s.r(wx + 1, wy + wh - 2, ww - 2, 1, sh)
        s.r(wx + ww // 2 - 1, wy + wh // 2 - 1, 2, 2, ring); s.r(wx + ww // 2 - 1, wy + wh // 2 - 1, 1, 1, rivet)
    x, y, w, h = C['plaque']['rim']
    # copper brackets on the plaque's lower corners, stepping out and down, and small caps on its top corners
    for bx, dx in ((x - 2, 1), (x + w - 3, -1)):
        s.r(bx, y + h - 11, 5, 11, ol); s.r(bx + 1, y + h - 10, 3, 9, face); s.r(bx + 1, y + h - 10, 3, 1, hi); s.r(bx + 1, y + h - 2, 3, 1, sh)
    for bx in (x - 1, x + w - 3):
        s.r(bx, y - 1, 4, 4, ol); s.r(bx + 1, y, 2, 2, face)
    s.r(x, y, w, h, ol); s.r(x + 1, y + 1, w - 2, h - 2, face)
    t0, t1 = ST['plaque_top']
    s.r(x + 2, y + 1, w - 4, 1, t0); s.r(x + 2, y + 2, w - 4, 1, t1)
    s.r(x + 1, y + h - 3, w - 2, 2, face); s.r(x + 1, y + h - 3, w - 2, 1, hi); s.r(x + 1, y + h - 2, w - 2, 1, sh)
    s.r(x + 1, y + 3, 1, h - 6, hi); s.r(x + w - 2, y + 3, 1, h - 6, sh)
    fx, fy, fw, fh = C['plaque']['face']
    s.r(fx, fy, fw, fh, '#0d0a0d'); s.r(fx, fy, fw, 1, '#000000'); s.r(fx, fy + fh - 1, fw, 1, '#1a1518')
    for cx, cy in ((x, y), (x + w - 1, y), (x, y + h - 1), (x + w - 1, y + h - 1)): s.r(cx, cy, 1, 1, '#000000')


def frame(colour):
    p = PAL[colour]; rnd = random.Random('frame-' + colour); s = Svg()
    lt, mid, dk = ST['steel']
    # steel edge, the black gap, the stone rails
    s.r(0, 0, W, 3, mid); s.r(0, 0, 3, H, mid); s.r(W - 3, 0, 3, H, mid); s.r(0, H - 4, W, 4, mid)
    s.r(0, 0, W, 1, lt); s.r(0, 0, 1, H, mix(lt, mid, .3)); s.r(W - 1, 0, 1, H, dk); s.r(0, H - 1, W, 1, dk)
    s.r(3, 3, W - 6, 2, '#030405'); s.r(3, 3, 2, H - 6, '#030405'); s.r(W - 5, 3, 2, H - 6, '#030405')
    gy = BOT['gap3'][0]; s.r(3, gy, W - 6, 1, '#030405')
    rs = 5; rw = B['stone']
    stone_rail(s, rnd, rs, rs, W - 2 * rs, rw, True)
    stone_rail(s, rnd, rs, rs + rw, rw, gy - rs - rw, False)
    stone_rail(s, rnd, W - rs - rw, rs + rw, rw, gy - rs - rw, False)
    by, bh = BOT['stone']; stone_rail(s, rnd, rs + rw, by, W - 2 * (rs + rw), bh, True)
    # black between rail and accent; under the bottom rail; the base strip stays open (the card's colour shows)
    g = rs + rw
    s.r(g, g, W - 2 * g, 2, '#000000'); s.r(g, g, 2, by - g, '#000000'); s.r(W - g - 2, g, 2, by - g, '#000000')
    s.r(g, BOT['gap'][0], W - 2 * g, BOT['gap'][1], '#000000'); s.r(g, BOT['gap2'][0], W - 2 * g, BOT['gap2'][1], '#000000')
    # the molten accent ring
    for d in range(3):
        s.runs(AX0 + d, AY0 + d, molten(rnd, p, d, AX1 - AX0 - 2 * d))
        s.runs(AX0 + d, AY1 - 1 - d, molten(rnd, p, d, AX1 - AX0 - 2 * d))
        for y in range(AY0 + d + 1, AY1 - 1 - d):
            a = molten(rnd, p, d, 2)
            s.runs(AX0 + d, y, a[:1]); s.runs(AX1 - 1 - d, y, a[1:])
    # field panels, dividers, separators
    for k, (x, y, w, h) in C['panels'].items(): panel(s, x, y, w, h, p['panel'])
    for m in C['dividers']: divider(s, rnd, p, m)
    s.flush()
    for m in C['dividers']: nubs(s, p, m)
    for x, y, h in C['separators']:
        s.r(x, y, 1, h, mix(p['accent'], '#000000', .72)); s.r(x + 1, y, 1, h, mix(p['accent'], '#000000', .78))
    # the plaque, then the four copper corners on top of everything
    plaque(s)
    for x, y in C['corner']['at']: corner(s, x, y)
    return s.doc('Hexmancers card frame, ' + colour)


def textures():
    src = os.path.join(SRC, 'textures'); n = 0
    ax, ay, aw, ah = C['bounds']['art']
    for f in sorted(os.listdir(src)):
        t = open(os.path.join(src, f)).read()
        pat = re.search(r'<pattern .*?</pattern>', t, re.S).group(0)
        defs = '<defs>%s<clipPath id="body-clip"><path d="M0 0h%dv%dH0zM%d %dh%dv%dh-%dz" clip-rule="evenodd"/></clipPath></defs>' % (pat, W, H, ax, ay, aw, ah, aw)
        s = Svg(); s.raw('<g clip-path="url(#body-clip)"><rect x="0" y="0" width="%d" height="%d" fill="url(#material-pattern)"/></g>' % (W, H))
        write('textures/card/' + f, s.doc('Hexmancers card texture', defs)); n += 1
    return n


PLAQUE_MASK = None


def plaque_mask():
    x, y, w, h = C['plaque']['rim']
    m = '<mask id="no-plaque" maskUnits="userSpaceOnUse" x="0" y="0" width="%d" height="%d"><rect width="%d" height="%d" fill="#fff"/><rect x="%d" y="%d" width="%d" height="%d" fill="#000"/>' % (W, H, W, H, x, y, w, h)
    for wx, wy, ww, wh in C['plaque']['wings']: m += '<rect x="%d" y="%d" width="%d" height="%d" fill="#000"/>' % (wx, wy, ww, wh)
    return m + '</mask>'


def ring(s, inset, t, fill, op):
    x0, y0, x1, y1 = AX0 - inset, AY0 - inset, AX1 + inset, AY1 + inset
    s.r(x0, y0, x1 - x0, t, fill, op); s.r(x0, y1 - t, x1 - x0, t, fill, op)
    s.r(x0, y0 + t, t, y1 - y0 - 2 * t, fill, op); s.r(x1 - t, y0 + t, t, y1 - y0 - 2 * t, fill, op)


def rim(s, col):
    ring(s, 0, 3, col, .95); ring(s, -3, 1, col, .35); ring(s, 1, 1, col, .55); ring(s, 2, 1, col, .3); ring(s, 3, 1, col, .15)


GLOW = {'enchanted': '#8fe4ff', 'buffed': '#ffd84a'}


def glows():
    for name, col in GLOW.items():
        for anim in ('', '-animated'):
            s = Svg(); s.raw('<g mask="url(#no-plaque)">')
            if anim: s.raw('<g><animate attributeName="opacity" values=".55;1;.55" dur="1.6s" repeatCount="indefinite"/>')
            rim(s, col)
            if anim: s.raw('</g>')
            s.raw('</g>'); write('glows/card/%s%s.svg' % (name, anim), s.doc('Hexmancers card glow, ' + name, '<defs>%s</defs>' % plaque_mask()))
    s = Svg(); s.raw('<g mask="url(#no-plaque)"><g clip-path="url(#left)">'); rim(s, GLOW['enchanted']); s.raw('</g><g clip-path="url(#right)">'); rim(s, GLOW['buffed']); s.raw('</g></g>')
    clips = '<clipPath id="left"><rect width="%d" height="%d"/></clipPath><clipPath id="right"><rect x="%d" width="%d" height="%d"/></clipPath>' % (W // 2, H, W // 2, W // 2, H)
    write('glows/card/enchanted-and-buffed.svg', s.doc('Hexmancers card glow, enchanted and buffed', '<defs>%s%s</defs>' % (plaque_mask(), clips)))


def rainbow(accent):
    h0 = colorsys.rgb_to_hsv(*[v / 255 for v in hx(accent)])[0]; stops = []
    for i in range(7):
        h = i / 6; d = ((h0 - h + .5) % 1) - .5; h = (h + .4 * d) % 1
        r, g, b = colorsys.hsv_to_rgb(h, .55, 1); stops.append('#%02x%02x%02x' % (round(r * 255), round(g * 255), round(b * 255)))
    return stops


def foils():
    for colour, p in PAL.items():
        st = rainbow(p['accent'])
        for anim in ('', '-animated'):
            g = '<linearGradient id="holo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="%d" y2="%d" spreadMethod="reflect">' % (W // 2, H // 2)
            g += ''.join('<stop offset="%g" stop-color="%s"/>' % (i / 6, c) for i, c in enumerate(st))
            if anim: g += '<animateTransform attributeName="gradientTransform" type="translate" values="0 0;%d %d;0 0" dur="4s" repeatCount="indefinite"/>' % (W // 2, H // 2)
            g += '</linearGradient>'
            s = Svg(); s.raw('<g mask="url(#no-plaque)" opacity=".7">'); ring(s, 0, 3, 'url(#holo)', None)
            x0, x1 = C['divider_x']
            for m in C['dividers']: s.r(x0, m - 1, x1 - x0, 3, 'url(#holo)', .6)
            s.raw('</g>'); write('foils/card/%s/trim%s.svg' % (colour, anim), s.doc('Hexmancers holo trim, ' + colour, '<defs>%s%s</defs>' % (plaque_mask(), g)))


def badges():
    for name, slot in (('enchanted', 'badge_a'), ('buffed', 'badge_b')):
        t = open(os.path.join(SRC, 'badges', name + '.svg')).read()
        inner = re.search(r'<g id="state-badge"[^>]*>(.*?)</g>', t, re.S).group(1)
        x, y, w, h = C['bounds'][slot]; s = Svg()
        s.r(x, y, w, h, '#000000'); s.r(x + 1, y + 1, w - 2, h - 2, '#101b24')
        s.raw('<g transform="translate(%g %g) scale(%g)">%s</g>' % (x + 2, y + 2, (w - 4) / 32, inner))
        write('badges/card/%s.svg' % name, s.doc('Hexmancers card badge, ' + name))


SLOTS = [('.k-el', 'element'), ('.k-hero', 'hero'), ('.k-rune', 'rune_plate'), ('.k-rank', 'rank_plate'), ('.k-name', 'name'),
         ('.k-art', 'art'), ('.k-tline', 'type_line'), ('.k-sicon', 'stat_icon'), ('.k-stat', 'stat_value'), ('.k-rar', 'rarity'),
         ('.k-rules', 'rules'), ('.k-f0', 'footer_left'), ('.k-f1', 'footer_right'), ('.k-count', 'count_text')]


def pct(b): x, y, w, h = b; return 'left:%.3f%%; top:%.3f%%; width:%.3f%%; height:%.3f%%;' % (x / W * 100, y / H * 100, w / W * 100, h / H * 100)


def geo_css():
    L = ['/* Generated by tools/card-build.py from cards/contract.json: do not edit by hand. Every card slot, as a percentage of the',
         '   %dx%d canvas; --u is one canvas unit, for sizes. */' % (W, H),
         '.card.kit{aspect-ratio:%d/%d; --u:calc(100cqw / %d);}' % (W, H, W)]
    for sel, k in SLOTS: L.append('.card.kit>%s{%s}' % (sel, pct(C['bounds'][k])))
    # the count plaque's text also beats the older per-screen count-badge rules (some name screens by id)
    L.append('.card.kit>.k-count{%s right:auto!important; bottom:auto!important; max-width:none!important;}' % pct(C['bounds']['count_text']).replace(';', '!important;'))
    ax, ay, aw, ah = C['bounds']['art']
    # the holo art foils are the kit's 240x456 effects, scaled by width (uniformly), their art rect (18,110) on this window
    L.append('.card.kit>.k-foil{%s background-size:%.4fcqw %.4fcqw; background-position:%.4fcqw %.4fcqw;}' % (pct(C['bounds']['art']), 100, 456 / 240 * 100, (ax - 18) / 240 * 100, (ay - 110) / 240 * 100))
    # each colour's ramp (palettes.json), for type, icons and labels: the card's class is c-<colour>
    for colour, p in PAL.items():
        L.append('.card.kit.c-%s{--k-acc:%s; --k-lt:%s; --k-dk:%s; --k-basec:%s; --k-text:%s; --k-ui:%s; --k-muted:%s;}' % (
            colour, p['accent'], p['light'], p['dark'], p['base'], p['text'], p['ui_accent'], p['muted']))
    for k, v in C['type_px'].items(): L.append('.card.kit{--fs-%s:calc(%d * var(--u)); --lh-%s:calc(%d * var(--u));}' % (k, v[0], k, v[1]))
    write('card-geo.css', '\n'.join(L) + '\n')


def icons_js():
    """cards/icons.js: every flat icon's shapes, for cardEl to draw inline in the card's colour (an <img> or a CSS mask
    of a file:// SVG can't take the page's colour). The first fill is the icon (currentColor); any later fill is its
    highlight (.hi). The element icons stay pictures (cards/icons/element-*.svg): each is already its colour's."""
    out = {}
    files = [('icons', f) for f in sorted(os.listdir(os.path.join(ROOT, 'icons'))) if f.endswith('.svg') and not f.startswith('element-')]
    files += [('symbols', 'hero-star.svg')]
    for d, f in files:
        t = open(os.path.join(ROOT, d, f)).read(); fills = []; shapes = []
        for m in re.finditer(r'<(path|polygon)\b([^>]*)/?>', t):
            a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(2))); fill = a.get('fill', '#000')
            if fill not in fills: fills.append(fill)
            cls = '' if fills.index(fill) == 0 else ' class="hi"'
            ev = ' fill-rule="evenodd"' if a.get('fill-rule') == 'evenodd' else ''
            shapes.append('<path d="%s"%s%s/>' % (a['d'], ev, cls) if m.group(1) == 'path' else '<polygon points="%s"%s/>' % (a['points'], cls))
        out[f[:-4]] = ''.join(shapes)
    write('icons.js', '/* Generated by tools/card-build.py from cards/icons and cards/symbols: each icon\'s shapes on a 32x32 grid. */\n'
          'const KIT_ICONS=' + json.dumps(out, separators=(',', ':')) + ';\n')
    # and what kitFit needs: the type sizes and the slots' widths, in canvas units
    b = C['bounds']
    geo = {'type': C['type_px'], 'w': {'name': b['name'][2], 'type': b['type_line'][2], 'rules': b['rules'][2], 'rulesH': b['rules'][3],
           'foot': b['footer_left'][2] - 26, 'count': b['count_text'][2], 'pad': C['tolerances']['minimum_text_edge_clearance_canonical_units']}}
    write('card-geo.js', '/* Generated by tools/card-build.py from cards/contract.json: type sizes [size, line height] and slot widths, in canvas units. */\n'
          'const KIT_GEO=' + json.dumps(geo, separators=(',', ':')) + ';\n')
    return len(out)


def light_element():
    """the Light element drawn in the Light colour's dark ink, for its pale card (the kit's own is pale on pale)"""
    t = open(os.path.join(ROOT, 'icons', 'element-white.svg')).read(); p = PAL['white']; ui = p['ui_accent']
    for a, b in ((p['accent'], ui), (p['dark'], mix(ui, '#000000', .45)), (p['light'], mix(ui, p['accent'], .45))): t = t.replace('"%s"' % a, '"%s"' % b)
    write('icons/element-white-ink.svg', t)


if __name__ == '__main__':
    for colour in PAL: write('frames/card/%s.svg' % colour, frame(colour))
    n = textures(); glows(); foils(); badges(); geo_css(); light_element(); k = icons_js()
    print('frames %d, textures %d, icons %d, glows, foils, badges, card-geo.css' % (len(PAL), n, k))
