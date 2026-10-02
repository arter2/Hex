"""The cast: player looks (each drawn with and without its hat), and the people the player
fights. Each look is a spec for figure.build; 'pal' gives base colors that become ramps."""

LOOKS = {
    # the hexmancer: slate hat, blue coat over a teal mantle, a crescent staff and a frost orb
    'wizard': dict(name='Wizard', race='human', sex='m', hat='wizard', hair='short', staff='crescent', off='orb', capelet=1, pouch=1,
                   pal=dict(skin='#e0a882', hair='#6a4434', robe='#36507e', under='#c8b48a', trim='#b8862e', cloth='#3f7a78',
                            hat='#2e3a66', hatband='#8a5a3a', boot='#5a3424', boot2='#8a5a34', pants='#3a3046', gem='#6fe0ff', spell='#6fe0ff'),
                   eye='#4ab8e8'),
    # elves: tall and slender, long ears, forest green and gold, a living branch for a staff
    'elf_m': dict(name='Elf', race='elf', sex='m', hat='wizard', hat_h=1.15, brim=0.85, pose='high', hair='long', staff='branch', off='orb', capelet=1, pouch=0,
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
                  pal=dict(skin='#7aa858', hair='#1e2218', robe='#4a4038', under='#a89878', trim='#b07a3a', cloth='#7a6650',
                           hat='#3a3a30', hatband='#a03a2a', boot='#3a2a20', boot2='#6a5a48', pants='#5a4030', gem='#ff6a3a', spell='#ff6a3a'),
                  eye='#f0c040'),
    'orc_f': dict(name='Orc', race='orc', sex='f', hat='wizard', hair='topknot', staff='totem', off='flame', outfit='jacket', capelet=1, fur=1, vest=0, paint='#3a5a8a',
                  pal=dict(skin='#88b464', hair='#22202a', robe='#5a3040', under='#b8a080', trim='#c08a40', cloth='#6a5a4a',
                           hat='#40283a', hatband='#c08a40', boot='#3a2a20', boot2='#6a5a48', pants='#3a2a30', gem='#ff8a4a', spell='#ff8a4a'),
                  eye='#e89030', lip='#4a6a3a'),
    # a dark witch: pale, raven-haired, a crooked hat, a black and violet gown and a moon staff
    'witch': dict(name='Dark witch', race='human', sex='f', hat='witch', pose='high', hair='long', staff='crystal', off='flame', outfit='robe', slit=1, capelet=0,
                  pal=dict(skin='#ecd0c4', hair='#3a2450', robe='#3e2c5a', under='#8a3a7a', trim='#a060d0', cloth='#4a3660',
                           hat='#33264a', hatband='#7a3aa0', boot='#1e1626', boot2='#3a2a46', pants='#1e1626', gem='#d07aff', spell='#c070ff'),
                  eye='#b050e0', lip='#7a2a5a'),
    # a necromancer: deep crimson hood and robe, a horned skull staff, green soulfire
    'necro': dict(name='Necromancer', race='human', sex='m', hat='hood', pose='high', hood_shadow=1, glow_eyes='#9cff6a', hair='short', staff='skull', off='flame',
                  outfit='robe', capelet=0, glow='#9cff6a',
                  pal=dict(skin='#c8c0b0', hair='#26222a', robe='#5a1a24', under='#2a1418', trim='#3a1a20', cloth='#6a1e2a',
                           boot='#1e1418', boot2='#3a2028', pants='#1e1418', gem='#7aff5a', spell='#7aff5a', bone='#e0d8c0'),
                  eye='#7aff5a'),
}
# what each look wears when its hat is off
BARE = {'necro': dict(hat='none', glow_eyes=None, hood_shadow=0, hair='short', gaunt=1, cowl=1, eye='#7aff5a')}
