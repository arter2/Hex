/* The 18 player looks, from the current sprites plus the review notes. */
(function(){
const EL=LAB.EL;
LAB.ROSTER=LAB.ROSTER||[];
const HUMAN=0xf1caa2, ELF=0xf6d6b2, DWARF=0xe9a87c, UNDEAD=0xb9c3cc, ORC=0x6f9a42;
const staff=(head,c,wood)=>({kind:'staff',head,c,wood:wood?LAB.M(wood):undefined});
const LEAF=[0x3f8a3a,0x5aa844,0x2e6a34,0x7ab84a], DLEAF=[0x2a5a34,0x3a7a40,0x1e4a2c,0x4a8a3a];
const P={
  wizard:{name:'Human wizard', skin:HUMAN, robe:0x3a5fa8, stripe:true, mantle:0x2a4a8a, hat:{type:'wizard',c:0x3d66b4,band:0x8a5a34}, beard:{c:0xeeeef0,len:.36}, hair:{c:0xe8e8ec,style:'short'}, cape:0x16285a, capeHem:0x2a3a6a, weapon:staff('orb',0x8fd8ff), fx:0x8fd8ff},
  human_f:{name:'Human witch', fem:true, skin:HUMAN, robe:0x3a5fa8, lashes:true, lips:0xc0605a, hat:{type:'wizard',c:0x3d66b4,band:0x8a5a34,phase:1.3}, hair:{c:0xb4502c,style:'long',len:.66}, cape:0x16285a, capeHem:0x2a3a6a, sleeve:'tight', weapon:staff('orb',0x8fd8ff), fx:0x8fd8ff},
  elf_m:{name:'Elf', slender:true, legK:1.06, skin:ELF, ears:'elf', robe:0x2f8f5f, stripe:true, mantle:0x1f6b4e, hat:{type:'wizard',c:0x34a06c,band:0xc8a26a,phase:2.1,bend:.26}, hair:{c:0xf0cf72,style:'long',len:.5}, cape:0x174f3a, weapon:staff('crystal',EL.verdant), fx:0x8affd2},
  elf_f:{name:'Elf', fem:true, legK:1.06, skin:ELF, ears:'elf', lashes:true, lips:0xd07a6a, robe:0x2f8f5f, sleeve:'tight', hat:{type:'witch',c:0x34a06c,band:0xc8a26a,phase:.7}, hair:{c:0xf2d27c,style:'long',len:.56}, cape:0x174f3a, weapon:staff('leaf',EL.verdant), fx:0x8affd2},
  dwarf_m:{name:'Dwarf', muscle:true, scale:.86, bodyW:1.12, legK:.82, headK:1.36, skin:DWARF, nose:true, robe:0x34343e, robeDk:0x26262e, top:0x34343e, showMus:true, sleeve:'bare', skirt:'knee', hoodDown:0x2c2c36,
    hair:{c:0xe0702a,style:'wild',len:.26}, beard:{c:0xe0702a,len:.46}, bracers:0x8a4a22, belt:0x5a3a22, straps:0x5a3a22, strap1:true, bootTall:true, boot:0x4a2e1e, weapon:staff('flame',0xff7a2a), fx:0xffa040},
  dwarf_f:{name:'Dwarf', fem:true, muscle:true, scale:.88, legK:.86, headK:1.38, skin:DWARF, nose:true, lashes:true, lips:0xb85a4a, robe:0x34343e, robeDk:0x26262e, sleeve:'bare', skirt:'knee',
    hair:{c:0xe0702a,style:'wild',len:.34}, bracers:0x8a4a22, belt:0x5a3a22, straps:0x5a3a22, strap1:true, bootTall:true, weapon:staff('flame',0xff7a2a), fx:0xffa040},
  undead_m:{name:'Undead', skel:true, skin:UNDEAD, bone:0xd8dccc, face:'skull', eyes:0x7fffe0, robe:0x3a3f4c, robeDk:0x2a2e38, skirtGap:1.3, sleeve:'flared', vest:0x3a3f4c, vestGap:1.6, belt:0x6a5a44,
    hat:{type:'wizard',c:0x4a505c,band:0x2a2e38,droop:.1,phase:.4}, hair:{c:0xdde2e6,style:'long',len:.5}, cape:0x22252e, rags:true, weapon:staff('ghost',0x7fffe0,0x4a4a52), fx:0x7fffe0},
  undead_f:{name:'Undead', fem:true, skin:0xaab4bc, bone:0xd8dccc, face:'skull', eyes:0x7fffe0, top:0x2a2e38, ribs:0xd8dccc, boneArms:true, sleeve:'flared', robe:0x3a3f4c, robeDk:0x2a2e38, skirtGap:.9, legs:'bone',
    hat:{type:'witch',c:0x4a505c,band:0x2a2e38,phase:2.4}, hair:{c:0x2a2a38,style:'long',len:.6}, cape:0x22252e, rags:true, weapon:staff('ghost',0x7fffe0,0x4a4a52), fx:0x7fffe0},
  witch_m:{name:'Warlock', muscle:true, skin:HUMAN, robe:0x5c3a8e, robeDk:0x40286a, top:0x4a2a72, showMus:true, sleeve:'bare', vest:0x5c3a8e, vestGap:.5, bracers:0x2a1a40, gloves:0x2a1a40,
    hat:{type:'witch',c:0x4a2f78,band:0x8a5a34,phase:1.8}, hair:{c:0x3a2a22,style:'short'}, beard:{c:0x3a2a22,len:.18}, cape:0x2a1846, capeHem:0x8a5a34, weapon:staff('orb',0xff7ae0,0x3a2440), fx:0xff8ae8},
  witch:{name:'Witch', fem:true, waistK:.9, legK:1.05, skin:HUMAN, lashes:true, lips:0xc0405a, robe:0x5c3a8e, robeDk:0x40286a, top:0x40286a, sleeve:'tight', skirtW:.85, belt:0x2a1a40,
    hat:{type:'witch',c:0x4a2f78,band:0x8a5a34,buckle:true,phase:.9}, hair:{c:0xc0402a,style:'long',len:.66}, cape:0x2a1846, capeHem:0x8a5a34, weapon:staff('orb',0xff7ae0,0x3a2440), fx:0xff8ae8},
  necro:{name:'Necromancer', skin:0xd9ddd0, robe:0x1f3c34, robeDk:0x142a24, top:0x1f3c34, sleeve:'open', hem:false, belt:0x4a3220,
    leaves:{c:DLEAF, skirt:5, chest:2, per:14, w:.075, h:.22}, vines:{c:0x4a3a22, n:2}, armVines:0x4a3a22,
    hat:{type:'wizard',c:0x22413a,band:0x4a3220,droop:.1,phase:2.7,leaves:DLEAF}, hair:{c:0xe8ece8,style:'long',len:.42}, beard:{c:0xe8ece8,len:.38}, weapon:staff('skull',0x7ff0c0,0x4a3220), fx:0x7ff0c0},
  necro_f:{name:'Necromancer', fem:true, waistK:.92, skin:0xd9ddd0, lashes:true, lips:0x5a8a6a, robe:0x1f3c34, robeDk:0x142a24, top:'skin', sleeve:'bare', skirt:'none', legs:'skin', shins:'skin', boot:0x3a2a1a,
    leaves:{c:DLEAF, skirt:6, chest:2, per:15, w:.07, h:.2, step:.11}, vines:{c:0x3a5a2a, n:3, leaf:0x4a8a3a}, armVines:0x3a5a2a,
    hat:{type:'witch',c:0x22413a,band:0x4a3220,phase:1.1,leaves:DLEAF}, hair:{c:0x1a1a1e,style:'long',len:.72}, weapon:staff('skull',0x7ff0c0,0x2a2a2e), fx:0x7ff0c0},
  shaman_m:{name:'Shaman', muscle:true, skin:0xd9a07a, robe:0x2f6a58, robeDk:0x234d40, top:'skin', sleeve:'bare', skirt:'knee', rags:true, bracers:0x6b3f24,
    hat:{type:'wizard',c:0x3a6a4a,band:0x8a5a34,droop:.09,phase:2.2}, beard:{c:0xc8642a,len:.24}, hair:{c:0xc8642a,style:'short'}, straps:0x6b3f24, fur:0x8a6a4a,
    leaves:{c:[0xf0e6d0,0x7a5a3a,0x3a6a4a], chest:1, per:16, w:.06, h:.24}, weapon:staff('feather',0x7fffd0), fx:0x7fffd0},
  shaman_f:{name:'Shaman', fem:true, muscle:true, skin:0xd9a07a, lashes:true, lips:0xa04a3a, robe:0x2f6a58, robeDk:0x234d40, top:'skin', bra:0x2f6a58, sleeve:'bare', skirt:'knee', rags:true, bracers:0x6b3f24, bootTall:true, waistK:.9,
    hat:{type:'witch',c:0x3a6a4a,band:0x8a5a34,phase:.5}, hair:{c:0xc8642a,style:'braids'}, straps:0x6b3f24, belt2:0x6b3f24, fur:0x8a6a4a, cape:0x234d40, capeLen:.6, weapon:staff('feather',0x7fffd0), fx:0x7fffd0},
  ranger_m:{name:'Ranger', skin:HUMAN, robe:0x5c7a2c, robeDk:0x43501f, top:0x6a8a34, skirt:'short', sleeve:'open', sleeveC:0xd8c8a0, vest:0x6b3f24, vestGap:.7, legs:0x5a4630, boot:0x3a2618, bootTall:true,
    hat:{type:'robin',c:0x4a6a24,band:0x6b3f24,feather:0xb5452e}, hair:{c:0x6a4228,style:'short'}, beard:{c:0x6a4228,len:.14}, belt2:0x6b3f24, quiver:0x6b3f24, cape:0x24381a, capeHem:0x1a2a12, capeLen:.95, weapon:staff('crystal',0x8affe0), fx:0x8affe0},
  ranger_f:{name:'Ranger', fem:true, skin:0xd9a882, lashes:true, lips:0xb05a4a, robe:0x8a6a44, robeDk:0x6a4a30, top:'skin', bra:0xc8a878, vest:0x8a6a44, vestGap:1.2, sleeve:'bare', skirt:'mini', skirtC:0x7a5634, hem:0xe8d8b0, legs:'skin', shins:'skin', boot:0x7a5634, bootTall:true,
    hair:{c:0x3a2418,style:'braids'}, straps:0x5a3a22, strap1:true, quiver:0x6b3f24, belt:0x5a3a22, belt2:0x6b3f24, bracers:0x7a5634, hat:{type:'band',c:0x8a2a1a,feather:0xf0e6d0},
    weapon:staff('crystal',0x8affe0), fx:0x8affe0},
  orc_m:{name:'Orc', muscle:true, scale:1.14, bodyW:1.12, skin:ORC, ears:'orc', tusks:.11, jaw:true, angry:true, horns:{c:0xe8dcc0,type:'bull',size:.7}, top:'skin', robe:0x8a2a22, robeDk:0x6e1c18, legs:0x3a2e24, skirt:'short', sleeve:'bare', straps:0x4a2e1a, pads:{c:0x5a3a24}, bracers:0x4a2e1a, boot:0x3a2618, bootTall:true,
    hair:{c:0x1e1e16,style:'mohawk'}, weapon:staff('bone',0xe8f0a0,0x5a3a22), fx:0xd8f08a},
  orc_f:{name:'Orc', fem:true, muscle:true, scale:1.08, legK:1.05, skin:ORC, ears:'orc', tusks:.07, top:'skin', bra:0x5a3a22, lashes:true, robe:0x5a3a22, robeDk:0x4a2e1a, legs:'skin', shins:'skin', skirt:'mini', skirtC:0x5a3a22, hem:0x3a2416, sleeve:'bare', straps:0x3a2416, strap1:true, pads:{c:0x6a4a2c}, bracers:0x4a2e1a, boot:0x3a2618, bootTall:true,
    hair:{c:0x6a2a1a,style:'savage',len:.4}, rags:true, weapon:staff('bone',0xe8f0a0,0x5a3a22), fx:0xd8f08a},
};
LAB.PLAYERS=P;
for(const id in P) LAB.ROSTER.push({id, group:'Player characters', name:P[id].name+(P[id].fem?' (woman)':' (man)'), ref:'look:'+id, cell:96,
  views:[{name:'back',yaw:Math.PI-.42},{name:'front',yaw:.38}], moves:['idle','walk','cast','attack','hurt'], kind:'humanoid', spec:P[id]});
})();
