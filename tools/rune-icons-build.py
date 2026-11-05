"""Build game/runeicons.js: the Living Rune UI icons and the stand-in status icon library.

python3 tools/rune-icons-build.py [handoff-svg-folder]

- UI icons (Strike, Search, Disarm, Bag, journal, close, menu, map legend, pause menu...): taken from the handoff's
  editable SVG masters (02-masters / 03-assets, the `icon-*.svg` files) when the folder is given, else from the copy
  kept in docs/ui-rune/svg.
- Status icons: STAND-INS drawn to follow the handoff's status catalog sheet (10-status-library: 106 icons, their ids,
  colours and shape ideas) until the real library files arrive. Each keeps the catalog's id, so the real SVGs replace
  them one for one (drop them in docs/ui-rune/status/<id>.svg and rerun: a file there wins over the stand-in).

All are 24 x 24 line icons drawn with currentColor; game code draws them with runeIcon(id, size[, colour]).
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'ui-rune', 'svg')
STATUS_DIR = os.path.join(ROOT, 'docs', 'ui-rune', 'status')

# the handoff's tokens
HEAL, DANGER, GOLD, CYAN, NEUTRAL, BRONZE = '#8de9b5', '#ec9384', '#f5cb60', '#7dd8e6', '#c9d4d7', '#d08a3c'

def inner_of(svg_text):
    """The drawing inside an SVG master: its paths/circles/etc., without the wrapper, title or layer group."""
    t = re.sub(r'<\?xml.*?\?>', '', svg_text, flags=re.S)
    t = re.sub(r'<title>.*?</title>', '', t, flags=re.S)
    m = re.search(r'<g[^>]*>(.*)</g>', t, flags=re.S)
    body = m.group(1) if m else re.search(r'<svg[^>]*>(.*)</svg>', t, flags=re.S).group(1)
    body = re.sub(r'\s+', ' ', body).strip()
    return body.replace(' />', '/>')

UI = {}
for n in sorted(os.listdir(SRC)) if os.path.isdir(SRC) else []:
    if n.startswith('icon-') and n.endswith('.svg'):
        UI['ui_' + n[5:-4]] = inner_of(open(os.path.join(SRC, n), encoding='utf-8').read())

# shorthand: 'M..' paths, 'c:x,y,r' circles; several joined by '|'
def draw(spec):
    out = []
    for part in spec.split('|'):
        part = part.strip()
        if part.startswith('c:'):
            x, y, r = part[2:].split(',')
            out.append(f'<circle cx="{x}" cy="{y}" r="{r}"/>')
        else:
            out.append(f'<path d="{part}"/>')
    return ''.join(out)

SHIELD = 'M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6z'
FLAME = 'M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 1 3 3 4 0-3-1-5 0-8z'
FLAME_S = 'M12 6c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-2 1.3-3.5 2-5 .7 1.5.7 2 2 3 0-2-.7-3.5 0-6z'
SNOW = 'M12 3v18|M4.2 7.5l15.6 9|M4.2 16.5l15.6-9|M9.5 4.5 12 6l2.5-1.5|M9.5 19.5 12 18l2.5 1.5'
SNOW_S = 'M12 7v10|M7.7 9.5l8.6 5|M7.7 14.5l8.6-5'
BOLT = 'M13 2 5 14h6l-1 8 9-13h-6z'
BOLT_S = 'M13 6 9 13h3l-1 5 5-7h-3z'
LEAF = 'M5 19C5 10 10 5 19 5c0 9-5 14-14 14z|M5 19 14 10'
SUN = 'c:12,12,3.5|M12 2.5v3|M12 18.5v3|M2.5 12h3|M18.5 12h3|M5.3 5.3l2.1 2.1|M16.6 16.6l2.1 2.1|M5.3 18.7l2.1-2.1|M16.6 7.4l2.1-2.1'
MOON = 'M15.5 3.5a8.5 8.5 0 1 0 5 13 6.5 6.5 0 1 1-5-13z'
KEY = 'c:7,9,3.5|M9.6 11.4 20 20|M15 15.6l2-2|M17.8 18.4l2-2'
STAR4 = 'M12 2.5l2.4 7.1 7.1 2.4-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4z'
STAR5 = 'M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.4l-5.4 3 1.2-6-4.5-4.1 6.1-.7z'
DIAMOND = 'M12 2.5 19 12l-7 9.5L5 12z|M5 12h14|M12 2.5v19'
BOWL = 'M4 8h16l-3 10H7z|M6 8c2-3.5 10-3.5 12 0'
THORN = 'M4 20 20 5|M8 16 5.5 13|M11.5 12.5l.5-3.5|M15 9l3.5 1|M9 15l3 1.5'
CARD = 'M6 3h9l3 3v15H6z'
BATTERY = 'M7 5h10v16H7z|M10 3h4v2'
CROSS = 'M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z'
TRI = 'M12 3 22 20H2z|M12 9.5v5.5|M12 17.2v.6'
HEX = 'M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z'

def ward(inner):
    return SHIELD + '|' + inner

S = {  # id: (colour, drawing) -- STAND-INS after the catalog sheet
    'shield': (HEAL, SHIELD + '|M12 9v6|M9 12h6'),
    'dodge': (HEAL, 'M3 8h10a3 3 0 1 0-3-3|M3 12h15a3 3 0 1 1-3 3|M3 16h7'),
    'phase': (HEAL, 'c:12,12,8.5|M7.5 12c2-4.5 7-4.5 9 0-2 4.5-7 4.5-9 0z|c:12,12,1.5'),
    'wand_power': (HEAL, 'M4 20 14.5 9.5|M15 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1z|M7 14l3 3'),
    'wand_set': (HEAL, 'M4 20 12.5 11.5|M13 3l.8 2.2L16 6l-2.2.8L13 9l-.8-2.2L10 6l2.2-.8z|M18.5 9l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z|M7 13.5l3 3'),
    'pact': (HEAL, MOON + '|M7.5 13.5l3 3|M9 12l3 3'),
    'courage': (HEAL, SUN),
    'intervention': (HEAL, CROSS + '|M4 4l2 2|M20 4l-2 2'),
    'hero': (HEAL, 'M3 18.5h18|M4 18.5 3 8l5 4 4-7 4 7 5-4-1 10.5'),
    'rooted': (DANGER, 'M12 3v9|M12 12l-6 7|M12 12l6 7|M12 14v7|M6.5 5.5l5.5 4 5.5-4'),
    'hexed': (DANGER, HEX + '|M8 9l8 6|M16 9l-8 6'),
    'haste': (HEAL, 'M3 8h9|M3 12h12|M3 16h9|M13.5 6l6 6-6 6'),
    'regen': (HEAL, LEAF),
    'burning': (DANGER, FLAME + '|' + FLAME_S),
    'frozen': (DANGER, SNOW),
    'stunned': (DANGER, STAR5 + '|M20 4l1.5-1.5|M3.5 4.5 2 3'),
    'slowed': (DANGER, 'M3 18.5h15|M5.5 18.5a6.5 6.5 0 1 1 11-4.5|M10 14a2 2 0 1 1 4 0|M18 18.5l2-6|M19.5 12.5h2'),
    'poisoned': (DANGER, 'M6 11a6 6 0 1 1 12 0v3l-2 1v3H8v-3l-2-1z|M9.5 11h.1|M14.5 11h.1|M4.5 21.5 19.5 18|M4.5 18l15 3.5'),
    'cursed': (DANGER, 'M16.5 3a9 9 0 1 0 0 18 7 7 0 0 1 0-18z'),
    'empowered': (HEAL, 'M12 21V6|M6.5 11.5 12 6l5.5 5.5|M9 21h6'),
    'confused': (GOLD, 'M9 8a3 3 0 1 1 4.2 2.8C12.4 11.3 12 12 12 13.5|M12 17v.8|M3.5 10l2.5 2-2.5 2|M20.5 6 18 8'),
    'infected': (DANGER, 'M5 5.5h14v10l-7 5.5-7-5.5z|M8.5 10.5l2.5 1|M15.5 10.5l-2.5 1|M8.5 15h7|M3 3l3 2.5|M21 3l-3 2.5'),
    'drain': (HEAL, 'M11 4s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z|M19 3v6|M17 7l2 2 2-2'),
    'mend': (HEAL, CROSS),
    'valor': (HEAL, SHIELD + '|M8.5 12l2.5 2.5 4.5-5'),
    'radiant': (HEAL, STAR4),
    'soul_unison': (HEAL, 'c:12,12,8.5|M5 9.5h14|M5 14.5h14|M9.5 5.5c2 4.5 2 8.5 0 13|M14.5 5.5c-2 4.5-2 8.5 0 13'),
    'crystal_charge': (HEAL, DIAMOND),
    'perfect_dodge': (HEAL, 'M2.5 13h4l2.5-7 3.5 12 2.5-7h6.5'),
    'incoming': (GOLD, TRI),
    'key_bronze': (BRONZE, KEY),
    'key_silver': (NEUTRAL, KEY + '|M5.5 7.5l3 3|M8.5 7.5l-3 3'),
    'key_gold': (GOLD, KEY + '|M7 7v4|M5 9h4'),
    'key_skeleton': (NEUTRAL, 'M3 4h7v6H3z|M9.5 9.5 20 20|M15 15.5l2-2|M17.8 18.3l2-2'),
    'key_boss': (DANGER, 'M3.5 5.5 9 4l1.5 5.5L5 11z|M9.5 9 20 20|M15 14.5l2-2|M17.8 17.3l2-2'),
    'blessed': (HEAL, STAR4 + '|M19.5 3.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z'),
    'threat': (GOLD, 'M12 3 6.5 10h3l-5 6.5h15l-5-6.5h3z|M12 16.5V21|M8.5 21h7'),
    'wayshard': (NEUTRAL, 'M12 2.5 18 12l-6 9.5L6 12z|M6 12h12|M9 7h6'),
    'sealed': (GOLD, 'M5 4h14v16H5z|M8.5 4l7 16|M15.5 4l-7 16|M5 12h14'),
    'lost_satchel': (NEUTRAL, 'M4 9h16v11H4z|M8.5 9V5.5h7V9|M4 13h16|M10 12v3|M14 12v3'),
    'quest': (NEUTRAL, 'M6 4h12v14H8.5a2.5 2.5 0 1 1 0-5H18|M9 8h6|M9 10.5h4'),
    'carrying_crate': (NEUTRAL, 'M4 5h16v14H4z|M4 5l16 14|M20 5 4 19'),
    'rescue_timer': (GOLD, 'M6 3h12|M6 21h12|M7.5 3c0 6 9 6 9 9s-9 3-9 9|M16.5 3c0 6-9 6-9 9s9 3 9 9|M10 18.5h4'),
    'escort': (NEUTRAL, 'c:8.5,7,3|M3 20.5v-2.5a5.5 5.5 0 0 1 8.5-4.6|M14 12.5l3.5-1.5 3.5 1.5v3.5c0 2.6-1.6 3.9-3.5 4.5-1.9-.6-3.5-1.9-3.5-4.5z'),
    'treasury_collapse': (GOLD, 'M3 20.5h18|M4.5 17 9 9.5l3 4 2-3 5 6.5|M7.5 6 9.5 3|M14 6l3-2.5|M11.5 4.5v1'),
    'companion': (HEAL, 'M4 4l16 16|M20 4 4 20|M4 8l4-4|M16 20l4-4|M16 4l4 4|M4 16l4 4'),
    'bones': (NEUTRAL, 'M8.5 6.5 17.5 15.5|c:6.5,5,2|c:5,7.5,1.8|c:19,17,2|c:16.5,19,1.8'),
    'torch': (HEAL, 'M10 21.5l2.5-10|M12.5 11.5c-3.5 0-4.5-4.5 0-8.5 4.5 4 3.5 8.5 0 8.5z'),
    'planks': (NEUTRAL, 'M3 10l16-4.5 2 4-16 4.5z|M3.5 15.5l16-4.5 1.5 3.5-16 4.5z'),
    'carried_flame': (HEAL, FLAME + '|' + FLAME_S),
    'hex_thorns': (DANGER, THORN),
    'hex_lead': (DANGER, 'M8 4h8l4 16H4z|M10 10h4v4h-4z'),
    'hex_hollow': (DANGER, 'c:12,12,8.5|c:12,12,4.5|M9 9l6 6|M15 9l-6 6'),
    'relics': (NEUTRAL, 'M9.5 21.5h5|M9 21.5l1.2-11h3.6l1.2 11|M12 10.5V7|M12 3.5c1.2 1 1.2 2.5 0 3.5-1.2-1-1.2-2.5 0-3.5z'),
    'circuit': (NEUTRAL, 'M4 4h6v6H4z|M14 14h6v6h-6z|M10 7h4v10h-4|M7 10v10h7|M17 4v10'),
    'vigor': (HEAL, 'M12 20S3 14 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 14 12 20 12 20z|M12 10v5|M9.5 12.5h5'),
    'might': (HEAL, 'M4.5 20V11h4v9|M10 20V4h4v16|M15.5 20v-7h4v7|M3 20h18'),
    'insight': (HEAL, 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z|c:12,12,3'),
    'fortune': (HEAL, STAR5),
    'lantern_sight': (HEAL, 'M9 4.5h6|M12 2.5v2|M7.5 7.5h9l1 12h-11z|M10 11.5h4v4h-4z'),
    'element_fire': ('#ff7a3a', FLAME + '|' + FLAME_S),
    'element_frost': ('#7fd4ff', SNOW),
    'element_storm': ('#f5e060', BOLT),
    'element_verdant': ('#8de9b5', LEAF),
    'element_light': ('#f5cb60', SUN),
    'element_shadow': ('#e070c8', MOON),
    'element_gray': (NEUTRAL, 'c:12,15,4|c:6.5,9.5,1.8|c:10,6,1.8|c:14,6,1.8|c:17.5,9.5,1.8'),
    'element_brown': ('#c08048', HEX + '|c:12,12,3.5'),
    'land_overgrowth': (NEUTRAL, 'M3 20.5h18|M5 20.5l2-10 2 10|M10 20.5l2-15 2 15|M15 20.5l2-9 2 9'),
    'land_swamp': (NEUTRAL, 'M3 18h18|M3 21h18|M7.5 17V7.5|M5 10h5|M15.5 17v-6|M13 12.5l2.5-1.5 2.5 1.5'),
    'land_marble': (NEUTRAL, 'M5 3.5h14l1.5 3h-17z|M6.5 9.5v8|M10 9.5v8|M14 9.5v8|M17.5 9.5v8|M4 20.5h16|M5 9.5h14'),
    'land_flood': (NEUTRAL, 'M3 8.5c3-2 6 2 9 0s6-2 9 0|M3 13.5c3-2 6 2 9 0s6-2 9 0|M3 18.5c3-2 6 2 9 0s6-2 9 0'),
    'area_hollows': (GOLD, DIAMOND),
    'area_deeps': (GOLD, SNOW),
    'area_vault': (GOLD, BOLT),
    'area_rifts': (GOLD, 'M12 3 4 19h16z|M8 13h8|M3 21.5h18|M10.5 8h3'),
    'area_ruins': (GOLD, 'c:12,12,8.5|' + 'M12 6.5 16.8 9.2v5.6L12 17.5l-4.8-2.7V9.2z'),
    'area_abyss': (GOLD, BOWL),
    'ground_burn': (GOLD, FLAME + '|' + FLAME_S),
    'ground_ice': (GOLD, SNOW),
    'ground_bramble': (GOLD, THORN),
    'ground_tremor': (GOLD, 'M4 5h14l-8 5h8L7 17|M3 13l3 2|M16 18l4 2'),
    'ground_void': (GOLD, BOWL),
    'ground_charged': (GOLD, BOLT),
    'card_frozen': (GOLD, SNOW),
    'card_enchanted': (NEUTRAL, CARD + '|M12 8l1.2 2.6 2.6 1.2-2.6 1.2L12 15.6l-1.2-2.6-2.6-1.2 2.6-1.2z'),
    'card_tinkered': (NEUTRAL, 'M12 3.5l2 1.2 2.3-.3 1 2.1 2.1 1-.3 2.3 1.2 2-1.2 2 .3 2.3-2.1 1-1 2.1-2.3-.3-2 1.2-2-1.2-2.3.3-1-2.1-2.1-1 .3-2.3-1.2-2 1.2-2-.3-2.3 2.1-1 1-2.1 2.3.3z|c:12,12,3'),
    'card_combo': (NEUTRAL, 'M3 5.5h7.5v13H3z|M13.5 5.5H21v13h-7.5z|M8 12h8|M14 10l2 2-2 2'),
    'card_copy': (NEUTRAL, 'M8.5 3h11v15h-11z|M5 6.5V21h11|M11.5 8h5|M11.5 11h5|M11.5 14h3'),
    'card_recipe': (NEUTRAL, 'M5 3h14v18H5z|M9 8.5h6|M12 5.5v6|M8.5 16l2.5 2.5 4.5-5'),
    'card_low_charge': (GOLD, BATTERY + '|M13 8.5l-3 5h4l-3 5'),
    'card_spent': (GOLD, BATTERY + '|M9.5 9l5 8|M14.5 9l-5 8'),
    'wand_only': (GOLD, 'M4 20 13.5 10.5|M16 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1z|M7 13.5l3 3'),
    'reaction_shatter': (NEUTRAL, 'M12 3v6|M12 15v6|M3 12h6|M15 12h6|M5.5 5.5l3.5 3.5|M18.5 18.5 15 15|M18.5 5.5 15 9|M5.5 18.5 9 15'),
    'reaction_conduct': (NEUTRAL, 'M4 4l6 8-6 8|M20 4l-6 8 6 8|M9.5 12h5|M12 9.5v5'),
    'reaction_wildfire': (NEUTRAL, 'M8.5 21c-3.5-3-2.5-7 .5-10 0 3 2 4 3 5 1-4 3-6 3-10 4 4 6 9 2.5 15|M14 21c1.5-1.5 1.5-3.5 0-5-1.5 1.5-1.5 3.5 0 5z'),
    'reaction_eclipse': (NEUTRAL, 'c:12,12,7|M15.5 6a7 7 0 0 1 0 12 9 9 0 0 0 0-12z|M12 2v2|M12 20v2|M2 12h2|M20 12h2'),
    'reaction_thornbind': (NEUTRAL, THORN + '|c:12,12,2'),
    'reaction_rimebind': (NEUTRAL, 'M12 3v18|M4 7.5l16 9|M4 16.5l16-9|M12 3l-2 2|M12 3l2 2|M12 21l-2-2|M12 21l2-2'),
    'ward_thorns': (HEAL, ward('M8.5 15.5l7-7|M10 13l-1.5-1|M13 10.5l.5-1.8')),
    'ward_burning': (HEAL, ward(FLAME_S)),
    'ward_freezing': (HEAL, ward(SNOW_S)),
    'ward_shocking': (HEAL, ward(BOLT_S)),
    'ward_healing': (HEAL, ward('M10.5 8.5h3v3h3v3h-3v3h-3v-3h-3v-3h3z')),
    'ward_draining': (HEAL, ward('M12 8s3 3.5 3 5.5a3 3 0 0 1-6 0c0-2 3-5.5 3-5.5z')),
    'ward_steady': (HEAL, ward('M12 9v6|M9 12h6|c:12,12,3.8')),
}
assert len(S) == 106, len(S)

# real library files, when they arrive, win over the stand-ins
real = {}   # id: (colour, drawing) from the library's own SVGs: their colour and their square-ended, mitred line style
if os.path.isdir(STATUS_DIR):
    for n in os.listdir(STATUS_DIR):
        if n.endswith('.svg'):
            t = open(os.path.join(STATUS_DIR, n), encoding='utf-8').read()
            g = re.search(r'<g[^>]*stroke="(#[0-9a-fA-F]{3,8})"[^>]*>', t)
            cap = (re.search(r'stroke-linecap="(\w+)"', g.group(0)) or [None, 'square'])[1] if g else 'square'
            join = (re.search(r'stroke-linejoin="(\w+)"', g.group(0)) or [None, 'miter'])[1] if g else 'miter'
            real[n[:-4]] = (g.group(1) if g else None, f'<g stroke-linecap="{cap}" stroke-linejoin="{join}">' + inner_of(t) + '</g>')

lib = {}
for k, (col, spec) in S.items():
    if k in real: lib[k] = [real[k][0] or col, real[k][1], 0]   # the real library icon
    else: lib[k] = [col, draw(spec), 1]                          # [colour, drawing, stand-in?]
for k, body in UI.items():
    lib[k] = ['#f3f1e7', body, 0]

js = ('/* Hexmancers - Living Rune icons. GENERATED by tools/rune-icons-build.py: do not edit by hand.\n'
      '   ui_*: the handoff\'s own UI icons (editable SVG masters). Status icons: the real library from\n'
      '   docs/ui-rune/status/<id>.svg, with a stand-in after the catalog sheet for any id without a file. Each entry:\n'
      '   [colour, drawing, 1 if a stand-in]. RUNE_SKINS: the handoff\'s frame skins for the stylesheet. */\n'
      'const RUNE_ICONS=' + json.dumps(lib, separators=(',', ':')) + ';\n'
      '// one icon as inline SVG: 24 x 24 line art in its own colour (or col), size px square\n'
      'function runeIcon(id,size,col){ const I=RUNE_ICONS[id]; if(!I) return \'\'; const s=size||18;\n'
      '  return \'<svg class="ri" viewBox="0 0 24 24" width="\'+s+\'" height="\'+s+\'" style="color:\'+(col||I[0])+\'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\'+I[1]+\'</svg>\'; }\n'
      '// the same icon as a CSS url (for masks and backgrounds), in col\n'
      'function runeIconUrl(id,col){ const I=RUNE_ICONS[id]; if(!I) return \'none\'; const svg=\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="\'+(col||I[0])+\'" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">\'+I[1]+\'</svg>\';\n'
      '  return \'url("data:image/svg+xml,\'+encodeURIComponent(svg)+\'")\'; }\n')
# The handoff's frame skins (button states, panels, health shell, depth badge, minimap frame), exactly as authored,
# for the stylesheet's nine-slice border-images (rune.js turns each into a --r-s-<name> CSS url).
SKINS = {}
for n in ['button-default-idle', 'button-default-pressed', 'button-default-disabled', 'button-default-focus',
          'button-gold-idle', 'button-gold-pressed', 'button-gold-disabled', 'button-gold-focus',
          'panel-log', 'health-shell', 'depth-badge', 'minimap-frame']:
    t = open(os.path.join(SRC, n + '.svg'), encoding='utf-8').read()
    t = re.sub(r'<\?xml[^>]*\?>\s*', '', t)
    t = re.sub(r'\s(?:inkscape:[a-z]+|data-layer)="[^"]*"', '', t)
    t = re.sub(r'\sxmlns:inkscape="[^"]*"', '', t)
    t = re.sub(r'<title>.*?</title>', '', t)
    SKINS[n] = t.strip()
js += ('// the frame skins: name -> SVG (the handoff\'s editable masters, unchanged but for editor metadata)\n'
       'const RUNE_SKINS=' + json.dumps(SKINS, separators=(',', ':')) + ';\n'
       'function runeSkinUrl(n){ const s=RUNE_SKINS[n]; return s?\'url("data:image/svg+xml,\'+encodeURIComponent(s)+\'")\':\'none\'; }\n')
open(os.path.join(ROOT, 'game', 'runeicons.js'), 'w', encoding='utf-8').write(js)
print(json.dumps({'ui': len(UI), 'status': len(S), 'real': len(real), 'standin': len(S) - len(real)}))
