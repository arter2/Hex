"""Player looks, enemies, bosses and heroes cut from the generated sheets in deck/art/sheets.
actions.png: 9 races x (male/female, hatless/hat) x 6 actions, seen from behind (battle view).
turns.png: the same characters turning in 16 steps; step 0 faces the viewer (camp, character screen).
bosses.png: 24 bosses, 4 views each.  monsters.png: 50 monsters, 16 directions each."""
import numpy as np
import scipy.ndimage as nd
from PIL import Image
import slice as S

RACES = ['human', 'elf', 'dwarf', 'undead', 'witch', 'necro', 'shaman', 'ranger', 'orc']
GROUPS = [('m', False), ('m', True), ('f', False), ('f', True)]   # column groups, left to right
ACT_X = [168, 522, 883, 1211]            # first frame of each group on actions.png
ACT_PITCH = 54.5
TURN_X = [108, 497, 854, 1202]           # frame 0 of each group on turns.png
TURN_Y = [(78, 133), (194, 248), (306, 357), (415, 470), (527, 580), (637, 689), (746, 798), (843, 890), (936, 981)]

def act_box(race, group, frame=0):
    r = RACES.index(race); x = ACT_X[group] + frame * ACT_PITCH
    y = 55 + 99 * r
    return (int(x) - 6, y + 6, int(x) + 52, y + 96)

def turn_box(race, group):
    y0, y1 = TURN_Y[RACES.index(race)]
    return (TURN_X[group], y0, TURN_X[group] + 24, y1)

def glow_tip(im):
    """Where the staff's glowing focus is, as a fraction of the image: the top bright cluster."""
    a = np.asarray(im).astype(int); rgb = a[..., :3]; al = a[..., 3]
    hi = rgb.max(2); lo = rgb.min(2)
    m = (al > 0) & (hi > 200) & (hi - lo > 50)
    xa = np.where((al > 0).any(0))[0]; mid = (xa.min() + xa.max()) / 2
    m[:, :int(mid + 0.2 * (xa.max() - xa.min()))] = False      # the raised staff is on the viewer's right
    ys, xs = np.where(m)
    if len(ys) < 3: return None
    top = ys.min(); sel = ys < top + 9
    return (float(xs[sel].mean()) / im.width, float(ys[sel].mean()) / im.height)

ACTIONS = ['idle', 'walk', 'cast', 'attack']   # columns 0-3 of actions.png (its damaged and fallen poses do not match the rest)

def feet_x(im):
    """Where the figure stands: the middle of its lowest rows, so poses line up on the feet, not on the staff."""
    a = np.asarray(im)[..., 3] > 0; ys = np.where(a.any(1))[0]
    band = a[max(ys.min(), ys.max() - max(4, (ys.max() - ys.min()) // 8)):ys.max() + 1]
    xs = np.where(band)[1]; return float(xs.mean())

def anim(race, g):
    """The four battle poses of one look (from behind) as one 384 x 96 strip, sharing a palette and a
    scale, standing on the same feet; plus where the staff's glow is in each."""
    cuts = []
    for i, name in enumerate(ACTIONS):
        f = CAST[g] if name == 'cast' else i
        cuts.append(S.cut('actions', act_box(race, g, f)))
    px = []
    for c in cuts:
        a = np.asarray(c); px.append(a[a[..., 3] > 110][:, :3])
    px = np.concatenate(px)
    pal = Image.fromarray(px.reshape(1, -1, 3), 'RGB').quantize(48, method=Image.MEDIANCUT)
    strip = Image.new('RGBA', (96 * len(cuts), 96)); tips = []
    for i, c in enumerate(cuts):
        fr = S.pixelate(c, round(c.height * BACK_K), scale=1, colors=48, palette=pal, cx=feet_x(c))
        # drop specks the sheet left floating beside the figure (a few pixels apart from it)
        a = np.asarray(fr).copy(); lab, n = nd.label(a[..., 3] > 0, structure=np.ones((3, 3)))
        if n > 1:
            sz = nd.sum(a[..., 3] > 0, lab, range(1, n + 1))
            for k, v in enumerate(sz):
                if v < 12: a[..., 3][lab == k + 1] = 0
            fr = Image.fromarray(a, 'RGBA')
        strip.alpha_composite(fr, (96 * i, 0)); tips.append(glow_tip(fr))
    return strip, tips

LOOK_IDS = {('human', 'm'): 'wizard', ('human', 'f'): 'human_f', ('elf', 'm'): 'elf_m', ('elf', 'f'): 'elf_f',
            ('dwarf', 'm'): 'dwarf_m', ('dwarf', 'f'): 'dwarf_f', ('undead', 'm'): 'undead_m', ('undead', 'f'): 'undead_f',
            ('witch', 'm'): 'witch_m', ('witch', 'f'): 'witch', ('necro', 'm'): 'necro', ('necro', 'f'): 'necro_f',
            ('shaman', 'm'): 'shaman_m', ('shaman', 'f'): 'shaman_f', ('ranger', 'm'): 'ranger_m', ('ranger', 'f'): 'ranger_f',
            ('orc', 'm'): 'orc_m', ('orc', 'f'): 'orc_f'}
SEX_NAMES = {('witch', 'm'): 'Warlock'}
NAMES = {'human': 'Human', 'elf': 'Elf', 'dwarf': 'Dwarf', 'undead': 'Undead', 'witch': 'Witch', 'necro': 'Necromancer',
         'shaman': 'Shaman', 'ranger': 'Ranger', 'orc': 'Orc'}
BACK_K = 1.12
CAST = [2, 2, 2, 3]   # the sheet's female-hat cast frames mostly lost the hat; their attack frame keeps it   # actions.png figures -> 96 px canvas

def look(race, sex):
    """{'back','backBare','front','frontBare','tipBack','tip'} as 96 x 96 RGBA images."""
    out = {}
    for g, (gs, hat) in enumerate(GROUPS):
        if gs != sex: continue
        sfx = '' if hat else 'Bare'
        b = S.cut('actions', act_box(race, g))          # idle: sets the scale
        c = S.cut('actions', act_box(race, g, CAST[g]))    # battle shows the casting stance
        bi = S.pixelate(c, round(c.height * BACK_K), scale=1, colors=48)
        out['back' + sfx] = bi
        f = S.cut('turns', turn_box(race, g))
        fi = S.pixelate(f, round(b.height * BACK_K * 0.92), scale=2, colors=32)
        out['front' + sfx] = fi
        st, tips = anim(race, g)
        out['anim' + sfx] = st; out['tips' + sfx] = tips
        out['back' + sfx] = st.crop((0, 0, 96, 96))           # standing, from behind
        if hat:
            out['tipBack'] = tips[0]; out['tip'] = None
    return out

# Bosses: (panel left, top, right, bottom) of the front view on bosses.png, by unit id.
# Monsters: row/col on monsters.png (frame 0 faces the viewer).
BOSS_ROWS = [(92, 230, [(18, 240), (252, 474), (486, 708), (718, 922), (934, 1126), (1138, 1332), (1344, 1516)]),
             (315, 458, [(18, 256), (268, 492), (505, 744), (758, 1000), (1015, 1257), (1272, 1516)]),
             (538, 682, [(18, 272), (287, 548), (563, 885), (901, 1186), (1203, 1516)]),
             (762, 908, [(18, 288), (303, 567), (582, 838), (852, 1074), (1088, 1288), (1302, 1516)])]
BOSS_NAMES = [['flame_titan', 'lava_colossus', 'sand_worm', 'ancient_treant', 'storm_bull', 'venom_wyvern', 'great_slime'],
              ['tidal_lord', 'sky_phantom', 'frost_colossus', 'leather_beast', 'wood_colossus', 'iron_forge'],
              ['living_scroll', 'steel_sentinel', 'mountain_guardian', 'toxic_queen', 'lightning_behemoth'],
              ['celestial_guardian', 'divine_judge', 'valiant', 'soul_reaper', 'deep_worm', 'void_lord']]
MONSTERS = ['goblin', 'orc_warrior', 'orc_shaman', 'orc_archer', 'troll', 'ogre', 'hobgoblin', 'bugbear', 'kobold', 'lizardman',
            'skeleton', 'skeleton_archer', 'skeleton_warrior', 'skeleton_mage', 'zombie', 'wraith', 'ghoul', 'vampire', 'lich', 'ghost',
            'werewolf', 'dire_wolf', 'giant_spider', 'cave_spider', 'scorpion', 'giant_snake', 'wyvern', 'dragon_whelp', 'dragon', 'ice_elemental',
            'fire_elemental', 'earth_elemental', 'air_elemental', 'water_elemental', 'stone_golem', 'treant', 'ent', 'mimic', 'slime', 'ooze',
            'minotaur', 'centaur', 'harpy', 'siren', 'harrower', 'beholder', 'roper', 'banshee', 'elemental_lurker', 'void_hound']
MON_X = [15, 348, 632, 916, 1200]

def first_figure(name, box, min_h=30, view=0):
    """The view-th figure from the left inside box (skipping frame lines and labels)."""
    bs = [b for b in S.blobs(name, box, gap=1) if b[3] - b[1] >= min_h and b[2] - b[0] > 12]
    return bs[view][:4] if len(bs) > view else None

def boss(bid):
    for (y0, y1, panels), names in zip(BOSS_ROWS, BOSS_NAMES):
        if bid in names:
            x0, x1 = panels[names.index(bid)]
            b = first_figure('bosses', (x0 + 4, y0, x1 - 4, y1), min_h=50)
            pw = x1 - x0
            if b[2] - b[0] > 0.4 * pw:   # touching its neighbour view: split at the emptiest column
                m = S.mask_of(S.sheet('bosses')[b[1]:b[3], b[0]:b[2]]).sum(0)
                lo, hi = int(0.18 * pw), int(0.42 * pw)
                b = (b[0], b[1], b[0] + lo + int(m[lo:hi].argmin()), b[3])
            return S.cut('bosses', (b[0] - 1, b[1] - 1, b[2] + 1, b[3] + 1))

def monster(mid):
    i = MONSTERS.index(mid); r, c = divmod(i, 5)
    y0 = int(66 + r * 93.2); x0 = MON_X[c] + 5
    return S.cut('monsters', (x0, y0 + 3, x0 + 24, y0 + 46))

def front(race, sex, hat):
    g = GROUPS.index((sex, hat)); b = S.cut('actions', act_box(race, g))
    return S.pixelate(S.cut('turns', turn_box(race, g)), round(b.height * BACK_K * 0.92), scale=2, colors=32)

# unit id -> how to draw it (enemies face right in their source; battle flips them)
UNITS = {
    'gloop': ('boss', 'great_slime', 62), 'gloopling': ('mon', 'slime', 40), 'wisp': ('mon', 'fire_elemental', 54),
    'mite': ('mon', 'ice_elemental', 52), 'beetle': ('mon', 'scorpion', 46), 'ram': ('boss', 'storm_bull', 74),
    'shade': ('mon', 'wraith', 58), 'sprite': ('mon', 'air_elemental', 52), 'golem': ('boss', 'iron_forge', 84),
    'cultist': ('front', ('necro', 'm', True)), 'witch': ('front', ('witch', 'f', True)), 'caller': ('front', ('human', 'm', True)),
    'warden': ('front', ('ranger', 'f', True)), 'paladin': ('boss', 'valiant', 80), 'knight': ('boss', 'steel_sentinel', 80),
    'glacier': ('boss', 'frost_colossus', 90), 'hollow': ('boss', 'void_lord', 90), 'treant': ('boss', 'ancient_treant', 90),
    'wyrm': ('boss', 'sand_worm', 88), 'roc': ('boss', 'sky_phantom', 90), 'rootnode': ('boss', 'wood_colossus', 80),
    'sapling': ('mon', 'treant', 50), 'clone': ('boss', 'soul_reaper', 80),
    'hero_pyra': ('front', ('human', 'f', False)), 'hero_ysolde': ('front', ('elf', 'f', True)),
    'hero_volta': ('front', ('human', 'm', True)), 'hero_thornfather': ('front', ('shaman', 'm', False)),
    'hero_aurelion': ('boss', 'divine_judge', 86), 'hero_widow': ('boss', 'toxic_queen', 80),
}

def unit(uid):
    kind, src, *h = UNITS[uid]
    if kind == 'front': return front(*src)
    if kind == 'boss': return S.pixelate(boss(src), h[0], scale=1, colors=48)
    return S.pixelate(monster(src), h[0], scale=2, colors=32)   # monsters are tiny on their sheet
