"""Everything that gets a 128 x 128 redraw, with the words shown beside it on the review page:
what it is, what it does and how it fights. Facts come from enemies.js, bosses.js and cards.js."""
import redraw as R, sheetcast as C

AI = {'align': 'lines up with your row to shoot', 'wander': 'drifts between tiles at random',
      'back': 'keeps to the back row', 'still': 'never moves'}

LOOK_LORE = {
    'human':  'A hedge-school wizard in road-worn blue. Learned the hex grid from a stolen primer.',
    'elf':    'A grove scholar from the high woods: tall, slight, patient, and very hard to surprise.',
    'dwarf':  'A forge-mage who reads runes in the coals. Short, broad, and fire-proof by trade.',
    'undead': 'Came back from the barrow with the spellbook still in hand. Bone under the cowl.',
    'witch':  'A dark witch of the violet coven. Every charm she wears is a debt someone owes her.',
    'necro':  'A necromancer in grave-green who keeps the dead on a short, glowing leash.',
    'shaman': 'An antlered shaman who speaks for the old forest spirits, painted for the hunt.',
    'ranger': 'A ranger-mage of the border woods: hood up, staff and bow both within reach.',
    'orc':    'An orc battle-mage from the red clans. Hits like a ram, casts like a storm.',
}

E = {  # id: (category, name, what it is, how it fights)
 'gloop': ('Monster', 'Gloop', 'A verdant ooze the size of a cart, packed with smaller oozes.',
           'Fires slime bolts down your row (12 dmg, 120 HP); it lines up with you. When it dies it splits into two Glooplings.'),
 'gloopling': ('Monster', 'Gloopling', 'A small ooze that broke off a Gloop.',
           'A weak minion (36 HP, 7 dmg) that lines up and shoots. Spawned when a Gloop dies.'),
 'wisp': ('Monster', 'Cinder Wisp', 'A walking bonfire with a temper; fire color.',
           'Shoots fire bolts and lobs firebombs onto your tiles (10 dmg, 85 HP). Lines up with your row.'),
 'mite': ('Monster', 'Frost Mite', 'A hulking crawler of packed ice, smaller than it looks from far off.',
           'Wanders the board and slams a tile area with ice (13 dmg, 95 HP).'),
 'beetle': ('Monster', 'Volt Beetle', 'A many-legged storm bug whose shell stores lightning.',
           'Lines up, fires shots and a cross-shaped blast (13 dmg, 110 HP).'),
 'ram': ('Monster', 'Thunder Ram', 'A horned storm bull that charges first and thinks never.',
           'Lines up with you and rushes down the row for 18 dmg (130 HP). Slow wind-up: dodge it.'),
 'shade': ('Monster', 'Shade', 'A cave-maw from the deep dark that moves by stepping through shadow.',
           'Wanders, then blinks next to you and strikes (15 dmg, 100 HP).'),
 'sprite': ('Monster', 'Halo Sprite', 'A winged guardian spirit of the light, feathered in gold.',
           'Keeps to the back row, heals other enemies and shoots (9 dmg, 80 HP). Kill it first.'),
 'golem': ('Boss', 'Radiant Golem', 'A forge-built colossus of white gold that drinks in light.',
           'Its weak color changes every few seconds; later it reflects the color it resists. Quakes the floor and throws boulders (1300 HP).'),
 'cultist': ('Humanoid', 'Ember Cultist', 'A fire cultist in ember-red robes, carrying the burning scrolls of his order.',
           'Lines up and shoots, and casts a deck of 8 fire cards back at you, announcing each one first (110 HP).'),
 'witch': ('Humanoid', 'Frost Witch', 'A witch of the cold coven, hooded in ice-blue, claws rimed with frost.',
           'Keeps to the back row and casts a deck of 8 frost cards: freezes, walls and shields (105 HP).'),
 'caller': ('Humanoid', 'Storm Caller', 'A blue-robed storm mage with a lightning staff.',
           'Lines up and casts a deck of 8 storm cards: stuns and chain lightning (100 HP).'),
 'warden': ('Humanoid', 'Grove Warden', 'A hooded ranger who guards the green paths.',
           'Keeps to the back row and casts 8 verdant cards: poison, walls and heals (125 HP).'),
 'paladin': ('Humanoid', 'Dawn Paladin', 'A knight of the dawn in white and gold plate.',
           'Lines up and casts a deck of 8 light cards: holy strikes, wards and heals (130 HP).'),
 'knight': ('Humanoid', 'Hex Knight', 'A cursed knight in black iron lit with violet hexfire.',
           'Lines up and casts a deck of 8 shadow cards: curses, drains and blinks (115 HP).'),
 'glacier': ('Boss', 'Glacier Queen', 'The frost boss: a winged ice queen crowned in rime.',
           'Raises ice walls on your side; later freezes the front card of your queue, then a blizzard (1750 HP).'),
 'hollow': ('Boss', 'Hollow King', 'The shadow boss: a crowned void that wears the dark like a robe.',
           'Hides its side in fog and teleports; later steals cards from your hand, then splits into shades (1200 HP).'),
 'treant': ('Boss', 'Elder Treant', 'The verdant boss: the oldest tree in the hollows, and awake.',
           'Two Root Nodes heal it while they stand: break them first. Later its vines root you in place (1350 HP).'),
 'wyrm': ('Boss', 'Magma Wyrm', 'The fire boss: a burrowing serpent of cooling lava.',
           'Cracks your tiles into lava pits you cannot cross; later burrows and erupts under a row (1250 HP).'),
 'roc': ('Boss', 'Thunder Roc', 'The storm boss: a great winged beast of the high storm, lightning in its wings.',
           'Lightning rods mark tiles, then strike; later it flies off the board and dives down a row (1200 HP).'),
 'rootnode': ('Boss helper', 'Root Node', 'A walking root-knot the Elder Treant grows.',
           'Never moves and does no damage: it heals the Treant while it stands (110 HP).'),
 'sapling': ('Boss helper', 'Sapling', 'A young tree-beast, bark still soft, that the Treant grows.',
           'A minion (55 HP, 8 dmg) that lines up and shoots.'),
 'clone': ('Boss helper', 'Hollow Shade', 'A sliver of the Hollow King given a body: a dimmer, smaller copy.',
           'Appears when the Hollow King splits; wanders and blinks in to strike (60 HP, 10 dmg).'),
 'hero_pyra': ('Hero', 'Pyra, the Ember Queen', 'A fire queen in ember-red who answers your summons for three turns.',
           'Hurls fireballs that splash and burn (40). Aura: your cards and wand deal +30%.'),
 'hero_ysolde': ('Hero', 'Ysolde of the Rime', 'An elf frost-mage of the high snows, robed in ice blue.',
           'Fires freezing bolts (26). Aura: a 30 shield now and at the start of each turn.'),
 'hero_volta': ('Hero', 'Captain Volta', 'A storm captain with a lightning staff.',
           'Chains lightning through 3 enemies (22). Aura: your Custom gauge fills 50% faster.'),
 'hero_thornfather': ('Hero', 'The Thornfather', 'An antlered forest elder.',
           'Bursts thorns around an enemy and poisons (20). Aura: +30 max HP and heal 3 a second.'),
 'hero_aurelion': ('Hero', 'Sir Aurelion', 'A holy knight in white and gold who marches to war under a banner.',
           'Calls down holy light (30) and heals you 6. Aura: +25% card damage; the next lethal hit leaves you standing.'),
 'hero_widow': ('Hero', 'The Nightwidow', 'A veiled reaper-queen of the shadow court, scythe in hand.',
           'Casts curses on the nearest enemy (28). Aura: you heal 20% of all damage you deal.'),
}

def entries():
    """[(id, category, name, does, works, {'main': img, 'frames': [...], 'alt': [...]})]"""
    out = []
    for race in C.RACES:
        for sex in 'mf':
            lid = C.LOOK_IDS[(race, sex)]
            fr = R.look_frames(race, sex, True); bare = R.look_frames(race, sex, False)
            out.append(('look_' + lid, 'Player', '%s %s' % (C.NAMES[race], {'m': 'man', 'f': 'woman'}[sex]), LOOK_LORE[race],
                        'Your character. Battle shows the back (cast pose); camp and the character screen show the front. Hat on and off.',
                        {'main': fr[2], 'frames': fr, 'alt': [bare[2], R.look_front(race, sex, True), R.look_front(race, sex, False)]}))
    for uid, (cat, name, does, works) in E.items():
        v = R.unit(uid)
        out.append((uid, cat, name, does, works, {'main': v[0], 'frames': R.idle(v[0]), 'alt': []}))
    return out
