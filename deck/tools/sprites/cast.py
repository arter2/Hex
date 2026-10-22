"""The cast: player looks (each drawn with and without its hat), and the people the player
fights. Each look is a spec for figure.build; 'pal' gives base colors that become ramps."""

LOOKS = {
    # the hexmancer: slate hat, blue coat over a teal mantle, a crescent staff and a frost orb
    'wizard': dict(name='Wizard', race='human', sex='m', hat='wizard', hair='short', staff='crescent', off='orb', capelet=1, pouch=1,
                   pal=dict(skin='#e0a882', hair='#6a4434', robe='#36507e', under='#c8b48a', trim='#b8862e', cloth='#3f7a78',
                            hat='#2e3a66', hatband='#8a5a3a', boot='#5a3424', boot2='#8a5a34', pants='#3a3046', gem='#6fe0ff', spell='#6fe0ff'),
                   eye='#4ab8e8'),
    # elves: tall and slender, long ears, forest green and gold, a living branch for a staff
    'elf_m': dict(name='Elf', race='elf', sex='m', hat='wizard', hat_h=1.15, brim=0.85, hair='long', staff='branch', off='orb', capelet=1, pouch=0,
                  pal=dict(skin='#f0c8a8', hair='#e8dca0', robe='#2f6a4a', under='#d8c890', trim='#d0a040', cloth='#8a6a3a',
                           hat='#2a5a40', hatband='#c09040', boot='#5a4028', boot2='#8a6a40', pants='#3a3a2a', gem='#9cff7a', spell='#9cff7a', leaf='#6ac04a'),
                  eye='#3aa860'),
    'elf_f': dict(name='Elf', race='elf', sex='f', hat='wizard', hat_h=1.15, brim=0.85, hair='long', staff='crystal', off='orb', outfit='robe', slit=1, capelet=1,
                  pal=dict(skin='#f4d0b4', hair='#c8642a', robe='#2a6a5a', under='#e8dcb0', trim='#d8b050', cloth='#e0d0a0',
                           hat='#24584c', hatband='#d8b050', boot='#6a4a2a', boot2='#9a7040', pants='#2a4a40', gem='#8af0ff', spell='#8af0ff'),
                  eye='#2a9ad0', lip='#c0606a'),
    # dwarves: short and broad, beards and braids, rust and leather, a rune hammer
    'dwarf_m': dict(name='Dwarf', race='dwarf', sex='m', hat='wizard', hat_h=0.8, brim=1.15, pose='low', hair='short', beard=1, beard_len=12, beard_bead=1, staff='hammer', off='flame',
                    outfit='jacket', boot_h=6, capelet=1, pouch=1,
                    pal=dict(skin='#e0a07a', hair='#c86a34', beard='#8a3418', robe='#7a2e24', under='#c8a070', trim='#d8a040', cloth='#8a7a6a',
                             hat='#6a2a24', hatband='#d8a040', boot='#4a3020', boot2='#7a5030', pants='#4a3a30', iron='#9aa0aa', gem='#ffb040', spell='#ffa030'),
                    eye='#3a6aa8'),
    'dwarf_f': dict(name='Dwarf', race='dwarf', sex='f', hat='wizard', hat_h=0.8, brim=1.15, pose='low', hair='braids', staff='hammer', off='flame', outfit='jacket', boot_h=6, capelet=1, pouch=1,
                    pal=dict(skin='#eaae88', hair='#9a3a20', robe='#3a5a7a', under='#d0b080', trim='#d8a040', cloth='#9a6a4a',
                             hat='#2e4a6a', hatband='#d8a040', boot='#4a3020', boot2='#7a5030', pants='#4a3a30', iron='#9aa0aa', gem='#ffb040', spell='#ffa030'),
                    eye='#3a8a5a', lip='#b85050'),
    # orcs: heavy, green, tusked, fur mantles and bone totems
    'orc_m': dict(name='Orc', race='orc', sex='m', hat='wizard', hat_h=0.9, brim=1.1, hair='mohawk', staff='totem', off='flame', outfit='jacket', capelet=1, fur=1, vest=0, pouch=1, scar=1,
                  pal=dict(skin='#7aa858', hair='#1e2218', robe='#4a4038', under='#a89878', trim='#b07a3a', cloth='#b09a78',
                           hat='#3a3a30', hatband='#a03a2a', boot='#3a2a20', boot2='#6a5a48', pants='#5a4030', gem='#ff6a3a', spell='#ff6a3a'),
                  eye='#f0c040'),
    'orc_f': dict(name='Orc', race='orc', sex='f', hat='wizard', hair='topknot', staff='totem', off='flame', outfit='jacket', capelet=1, fur=1, vest=0,
                  pal=dict(skin='#88b464', hair='#22202a', robe='#5a3040', under='#b8a080', trim='#c08a40', cloth='#c0ac88',
                           hat='#40283a', hatband='#c08a40', boot='#3a2a20', boot2='#6a5a48', pants='#6a4430', gem='#ff8a4a', spell='#ff8a4a'),
                  eye='#e89030', lip='#4a6a3a'),
    # a dark witch: pale, raven-haired, a crooked hat, a black and violet gown and a moon staff
    'witch': dict(name='Dark witch', race='human', sex='f', hat='witch', pose='high', hair='long', staff='crystal', off='flame', outfit='robe', slit=1, capelet=0,
                  pal=dict(skin='#ecd0c4', hair='#16121e', robe='#4a3470', under='#8a3a7a', trim='#a060d0', cloth='#4a3660',
                           hat='#33264a', hatband='#7a3aa0', boot='#1e1626', boot2='#3a2a46', pants='#1e1626', gem='#d07aff', spell='#c070ff'),
                  eye='#b050e0', lip='#7a2a5a'),
    # a necromancer: deep crimson hood and robe, a horned skull staff, green soulfire
    'necro': dict(name='Necromancer', race='human', sex='m', hat='hood', pose='high', hood_shadow=1, glow_eyes='#9cff6a', hair='short', staff='skull', off='flame',
                  outfit='robe', capelet=0, glow='#9cff6a',
                  pal=dict(skin='#c8c0b0', hair='#26222a', robe='#5a1a24', under='#2a1418', trim='#3a1a20', cloth='#6a1e2a',
                           boot='#1e1418', boot2='#3a2028', pants='#1e1418', gem='#7aff5a', spell='#7aff5a', bone='#e0d8c0', gold='#8a6a4a'),
                  eye='#7aff5a'),
}
# what each look wears when its hat is off
BARE = {'necro': dict(hat='none', glow_eyes=None, hood_shadow=0, hair='short', gaunt=1, cowl=1, eye='#7aff5a')}

# the people you fight, and the six heroes you can summon; all face right
PEOPLE = {
    'cultist': dict(race='human', sex='m', hat='hood', hood_shadow=1, glow_eyes='#ffb040', staff='flamestaff', off='flame', outfit='robe', pose='high',
                    pal=dict(skin='#c89070', robe='#8a2a1e', under='#3a1410', trim='#e09030', cloth='#a8341e', boot='#2a1410', pants='#2a1410', spell='#ffa030', gold='#e0a030')),
    'witch':   dict(race='human', sex='f', hat='witch', hair='long', staff='crystal', off='orb', outfit='robe', slit=1, pose='high',
                    pal=dict(skin='#e8d8e0', hair='#e8f4ff', robe='#3a6aa8', under='#c8e8ff', trim='#a8e0ff', cloth='#2a4a80', hat='#2a4a80', hatband='#a8e0ff',
                             boot='#1e2a4a', pants='#1e2a4a', gem='#bff0ff', spell='#9fe8ff'), eye='#4ac8ff', lip='#6a8ab8'),
    'caller':  dict(race='human', sex='m', hat='hood', hair='short', staff='bolt', off='orb', outfit='coat', capelet=1, beard=1, beard_len=6,
                    pal=dict(skin='#d8a888', hair='#5a5a6a', beard='#b8b8c8', robe='#3a3a7a', under='#d8c890', trim='#f0d040', cloth='#4a4a90',
                             boot='#2a2a3a', pants='#2a2a4a', spell='#fff070', iron='#9aa0b0'), eye='#f0d040'),
    'warden':  dict(race='elf', sex='f', hat='hood', hair='long', staff=None, off='bow', outfit='jacket', capelet=1, pose='low', pouch=1,
                    pal=dict(skin='#e8c0a0', hair='#a85a2a', robe='#3a6a30', under='#c8b080', trim='#a08040', cloth='#2e5a28', boot='#4a3420', pants='#5a4430', wood='#7a4a28'), eye='#4aa040'),
    'paladin': dict(race='human', sex='m', hat='helm', hair='short', staff='sword', off=None, shield='kite', outfit='jacket', plate=1, pose='low',
                    pal=dict(skin='#e0b090', hair='#c89a40', robe='#e8dcc0', under='#c8b890', trim='#e0b040', cloth='#e8dcc0', boot='#6a5a4a', pants='#5a5060',
                             iron='#c8ccd8', shield='#e8e4d8', gold='#f0c040', blade='#e8eef8'), eye='#4a8ad0'),
    'knight':  dict(race='human', sex='m', hat='spiked', hair='short', staff='darksword', off=None, outfit='jacket', plate=1, cape=1, pose='low',
                    pal=dict(skin='#c0a090', robe='#2a2236', under='#1e1828', trim='#7a3aa0', cloth='#3a2a4a', cape='#4a1a3a', boot='#1e1826', pants='#2a2234',
                             iron='#4a4658', gold='#8a5ab0', blade='#3a2a4a'), eye='#ff3a4a'),
    # bosses built on the same bodies
    'glacier': dict(race='elf', sex='f', hat='icecrown', hair='long', staff='crystal', off='orb', outfit='robe', slit=1, capelet=1, pose='high', cx=46,
                    pal=dict(skin='#dce8f4', hair='#f0f8ff', robe='#4a8ac8', under='#e8f8ff', trim='#c8f0ff', cloth='#e8f8ff', boot='#2a4a7a', pants='#2a4a7a',
                             gem='#c8f4ff', spell='#a8f0ff', gold='#c8f0ff'), eye='#4ad0ff', lip='#7aa0d0'),
    # heroes
    'hero_pyra':  dict(race='human', sex='f', hat='crown', hair='wild', staff='flamestaff', off='flame', outfit='robe', slit=1, cape=1, pose='high',
                       pal=dict(skin='#f0c8a0', hair='#ff6a2a', robe='#b02a1e', under='#f0b040', trim='#f0c040', cloth='#801a14', cape='#6a1410', boot='#3a1410', pants='#3a1410', spell='#ffb030', gem='#ff6a30'),
                       eye='#ff9a30', lip='#c04030'),
    'hero_ysolde': dict(race='elf', sex='f', hat='tiara', hair='long', staff='crystal', off='orb', outfit='robe', slit=1, cape=1, pose='high',
                       pal=dict(skin='#f0e0e8', hair='#e8f4ff', robe='#3a6ab0', under='#d8f0ff', trim='#c8e8ff', cloth='#2a4a8a', cape='#2a3a7a', boot='#1e2a4a', pants='#1e2a4a', gem='#bff0ff', spell='#9fe8ff'),
                       eye='#4ac8ff', lip='#8a8ac8'),
    'hero_volta': dict(race='human', sex='m', hat='tricorn', hair='ponytail', staff='saber', off='orb', outfit='coat', cape=1, pouch=1,
                       pal=dict(skin='#d8a080', hair='#3a2a20', robe='#2a3a8a', under='#f0e0b0', trim='#f0c040', cloth='#e8c030', cape='#1e2a5a', hat='#1e1e2e', hatband='#f0c040',
                                boot='#2a1e18', pants='#e8e0c8', spell='#fff070', iron='#d8dce8'), eye='#2a6ab0', scar=1),
    'hero_thornfather': dict(race='human', sex='m', hat='antlers', hair='long', beard=1, beard_len=16, staff='branch', off='orb', outfit='robe', capelet=1, fur=1,
                       pal=dict(skin='#c89070', hair='#d8d8c8', beard='#e0e0d0', robe='#4a6a2a', under='#8a7a4a', trim='#a08a3a', cloth='#6a5a3a', boot='#3a2a18', pants='#3a2a18',
                                spell='#a8ff70', gem='#a8ff70', bone='#d8c8a0'), eye='#6aa040'),
    'hero_aurelion': dict(race='human', sex='m', hat='helm', hair='short', staff='greatsword', off=None, shield='round', outfit='jacket', plate=1, back_extra='wings',
                       pal=dict(skin='#e8c098', hair='#f0d070', robe='#f0e8d0', under='#e0c890', trim='#f0c040', cloth='#f0e8d0', boot='#8a6a4a', pants='#c8b8a0',
                                iron='#e8d8a0', shield='#f0e4c0', gold='#f8d050', blade='#f8f4e0', wing='#fff8e8'), eye='#4a8ad0'),
    'hero_widow': dict(race='human', sex='f', hat='veil', hair='long', staff='scythe', off='flame', outfit='robe', slit=1, back_extra='legs', pose='high',
                       pal=dict(skin='#e8d0d8', hair='#1a1420', robe='#2a1e30', under='#6a1a3a', trim='#8a3a6a', hat='#1e1626', cloth='#2a1e30', boot='#1a1420', pants='#1a1420',
                                spell='#c060ff', iron='#a8a0b8', carapace='#2a2030'), eye='#c060ff', lip='#5a1a3a'),
}
