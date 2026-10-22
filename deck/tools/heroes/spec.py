# look id -> (sheet with hat, sheet without hat or None); frame points (x,y) on the sheet: front, idle, walk, cast, attack (back views)
def ub(xs,y): return [(x,y) for x in xs]
U4=[45,130,212,295]
LOOKS={
 'wizard':  dict(name='Human',gender='man',hat=('human_m',[(150,190),(1040,140),(1040,240),(1040,560),(1050,445)]),
                 bare=('human_m_bare',[(140,195),(1050,145),(1050,245),(1040,560),(1050,445)])),
 'human_f': dict(name='Human',gender='woman',hat=('human_f',[(140,210),(1055,130),(1040,235),(1055,130),(1060,440)])),
 'elf_m':   dict(name='Elf',gender='man',hat=('elf_m',[(140,175)]+ub([45,125,190,270],510))),
 'elf_f':   dict(name='Elf',gender='woman',hat=('elf_f',[(155,180)]+ub([40,125,210,290],560))),
 'dwarf_m': dict(name='Dwarf',gender='man',hat=('dwarf_m_bare',[(140,195),(1060,140),(1060,240),(1045,560),(1050,440)])),
 'dwarf_f': dict(name='Dwarf',gender='woman',hat=('dwarf_f_bare',[(145,200),(1060,145),(1060,240),(1040,560),(1050,445)])),
 'witch_m': dict(name='Warlock',gender='man',hat=('warlock',[(150,200)]+ub(U4,600))),
 'witch':   dict(name='Witch',gender='woman',hat=('witch_f',[(155,200),(1040,135),(1040,235),(1050,545),(1050,440)]),
                 bare=('witch_f_bare',[(150,200),(1055,145),(1055,240),(1045,560),(1050,445)])),
 'necro':   dict(name='Necromancer',gender='man',hat=('necro_m',[(150,190)]+ub([45,125,210,290],570))),
 'necro_f': dict(name='Necromancer',gender='woman',hat=('necro_f',[(140,190)]+ub([45,125,210,290],570))),
 'shaman_m':dict(name='Shaman',gender='man',hat=('shaman_m',[(150,200)]+ub(U4,590))),
 'shaman_f':dict(name='Shaman',gender='woman',hat=('shaman_f',[(150,200)]+ub([50,135,215,300],595))),
 'ranger_m':dict(name='Ranger',gender='man',hat=('ranger_m',[(150,190)]+ub([45,130,210,290],575))),
 'ranger_f':dict(name='Ranger',gender='woman',hat=('ranger_f',[(160,205),(55,585),(1075,325),(55,585),(1075,325)]),
                 bare=('ranger_f_bare',[(150,195),(1065,140),(1065,240),(1065,140),(1055,445)])),
 'orc_m':   dict(name='Orc',gender='man',hat=('orc_m',[(160,205)]+ub([50,140,230,320],640))),
 'orc_f':   dict(name='Orc',gender='woman',hat=('orc_f',[(150,205)]+ub([50,135,220,305],600))),
}
