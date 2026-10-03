/* The 18 player looks, dressed to match the current sprites (colours, hats, hair, staff glow). */
(function(){
const EL=LAB.EL;
LAB.ROSTER=LAB.ROSTER||[];
const HUMAN=0xf1caa2, ELF=0xf6d6b2, DWARF=0xe9b48c, UNDEAD=0xb9c3cc, ORC=0x7fa34c;
const staff=(head,c,wood)=>({kind:'staff',head,c,wood:wood?LAB.M(wood):undefined});
const P={
  wizard:{name:'Human wizard', skin:HUMAN, robe:0x3a5fa8, hat:{type:'wizard',c:0x3d66b4,band:0x8a5a34}, beard:{c:0xeeeef0,len:.34}, hair:{c:0xe8e8ec,style:'short'}, cape:0x2e4c8a, weapon:staff('orb',0x8fd8ff), fx:0x8fd8ff},
  human_f:{name:'Human witch', fem:true, skin:HUMAN, robe:0x3a5fa8, hat:{type:'wizard',c:0x3d66b4,band:0x8a5a34}, hair:{c:0xb4502c,style:'long',len:.6}, cape:0x2e4c8a, weapon:staff('orb',0x8fd8ff), fx:0x8fd8ff},
  elf_m:{name:'Elf', skin:ELF, ears:'elf', robe:0x2f8f5f, hat:{type:'wizard',c:0x34a06c,band:0xc8a26a}, hair:{c:0xf0cf72,style:'long'}, cape:0x1f6b4e, weapon:staff('crystal',EL.verdant), fx:0x8affd2},
  elf_f:{name:'Elf', fem:true, skin:ELF, ears:'elf', robe:0x2f8f5f, hat:{type:'wizard',c:0x34a06c,band:0xc8a26a}, hair:{c:0xf2d27c,style:'long',len:.66}, cape:0x1f6b4e, weapon:staff('leaf',EL.verdant), fx:0x8affd2},
  dwarf_m:{name:'Dwarf', scale:.84, bodyW:1.25, headK:1.4, skin:DWARF, nose:true, robe:0x3b3b46, robeDk:0x2a2a32, hat:{type:'wizard',c:0x6a4a32,band:0x3b2a1e}, hair:{c:0xe0702a,style:'wild'}, beard:{c:0xe0702a,len:.42}, bracers:0xb85a26, cape:0x2c2c36, weapon:staff('flame',0xff7a2a), fx:0xffa040},
  dwarf_f:{name:'Dwarf', fem:true, scale:.84, bodyW:1.22, headK:1.4, skin:DWARF, nose:true, robe:0x3b3b46, robeDk:0x2a2a32, hat:{type:'wizard',c:0x6a4a32,band:0x3b2a1e}, hair:{c:0xe0702a,style:'braids'}, bracers:0xb85a26, cape:0x2c2c36, weapon:staff('flame',0xff7a2a), fx:0xffa040},
  undead_m:{name:'Undead', skin:UNDEAD, face:'skull', eyes:0x7fffe0, robe:0x3a3f4c, robeDk:0x2a2e38, hat:{type:'wizard',c:0x4a505c,band:0x2a2e38}, hair:{c:0xdde2e6,style:'long',len:.5}, cape:0x2a2e38, rags:true, weapon:staff('ghost',0x7fffe0,0x4a4a52), fx:0x7fffe0},
  undead_f:{name:'Undead', fem:true, skin:UNDEAD, face:'skull', eyes:0x7fffe0, robe:0x3a3f4c, robeDk:0x2a2e38, hat:{type:'wizard',c:0x4a505c,band:0x2a2e38}, hair:{c:0x3a3a4a,style:'long',len:.62}, cape:0x2a2e38, rags:true, weapon:staff('ghost',0x7fffe0,0x4a4a52), fx:0x7fffe0},
  witch_m:{name:'Warlock', skin:HUMAN, robe:0x5c3a8e, robeDk:0x40286a, hat:{type:'witch',c:0x4a2f78,band:0x8a5a34}, hair:{c:0x3a2a22,style:'short'}, beard:{c:0x3a2a22,len:.16}, cape:0x3c2560, weapon:staff('orb',0xff7ae0,0x3a2440), fx:0xff8ae8},
  witch:{name:'Witch', fem:true, skin:HUMAN, robe:0x5c3a8e, robeDk:0x40286a, hat:{type:'witch',c:0x4a2f78,band:0x8a5a34,buckle:true}, hair:{c:0xc0402a,style:'long',len:.56}, cape:0x3c2560, weapon:staff('orb',0xff7ae0,0x3a2440), fx:0xff8ae8},
  necro:{name:'Necromancer', skin:0xd9ddd0, robe:0x1f3c34, robeDk:0x142a24, trim:0x7ff0c0, hat:{type:'wizard',c:0x22413a,band:0x0f1f1a}, hair:{c:0x1a1a1e,style:'short'}, cape:0x132822, weapon:staff('skull',0x7ff0c0,0x2a2a2e), fx:0x7ff0c0},
  necro_f:{name:'Necromancer', fem:true, skin:0xd9ddd0, robe:0x1f3c34, robeDk:0x142a24, trim:0x7ff0c0, hat:{type:'wizard',c:0x22413a,band:0x0f1f1a}, hair:{c:0x1a1a1e,style:'long',len:.6}, cape:0x132822, weapon:staff('skull',0x7ff0c0,0x2a2a2e), fx:0x7ff0c0},
  shaman_m:{name:'Shaman', skin:0xd9a07a, robe:0x2f6a58, robeDk:0x234d40, hat:{type:'ranger',c:0x3a6a4a,band:0x8a5a34,feather:0xf0e6d0}, beard:{c:0xc8642a,len:.22}, hair:{c:0xc8642a,style:'short'}, straps:0x6b3f24, fur:0x8a6a4a, rags:true, mantle:false, weapon:staff('feather',0x7fffd0), fx:0x7fffd0},
  shaman_f:{name:'Shaman', fem:true, skin:0xd9a07a, robe:0x2f6a58, robeDk:0x234d40, hat:{type:'ranger',c:0x3a6a4a,band:0x8a5a34,feather:0xf0e6d0}, hair:{c:0xc8642a,style:'braids'}, straps:0x6b3f24, fur:0x8a6a4a, rags:true, mantle:false, weapon:staff('feather',0x7fffd0), fx:0x7fffd0},
  ranger_m:{name:'Ranger', skin:HUMAN, robe:0x5c6b2c, robeDk:0x43501f, hat:{type:'ranger',c:0x5d6b2e,band:0x6b3f24,feather:0xb5452e}, hair:{c:0x6a4228,style:'short'}, beard:{c:0x6a4228,len:.14}, straps:0x6b3f24, cape:0x3f4c1c, belt2:0x6b3f24, weapon:staff('crystal',0x8affe0), fx:0x8affe0},
  ranger_f:{name:'Ranger', fem:true, skin:HUMAN, robe:0x5c6b2c, robeDk:0x43501f, hat:{type:'ranger',c:0x5d6b2e,band:0x6b3f24,feather:0xb5452e}, hair:{c:0x6a4228,style:'long',len:.56}, straps:0x6b3f24, cape:0x3f4c1c, belt2:0x6b3f24, weapon:staff('crystal',0x8affe0), fx:0x8affe0},
  orc_m:{name:'Orc', scale:1.04, bodyW:1.32, skin:ORC, ears:'orc', robe:0x9a2a22, robeDk:0x6e1c18, legs:0x3a2e24, skirt:'short', sleeve:'bare', straps:0x5a3a22, pads:{c:0x6b4a2c}, hat:{type:'ranger',c:0x4a5a2e,band:0x5a3a22}, hair:{c:0x2a2a1e,style:'bald'}, mantle:false, weapon:staff('bone',0xe8f0a0,0x5a3a22), fx:0xd8f08a},
  orc_f:{name:'Orc', fem:true, scale:1.0, bodyW:1.22, skin:ORC, ears:'orc', robe:0x4a5a6c, robeDk:0x34404e, legs:0x3a2e24, skirt:'short', sleeve:'bare', straps:0x5a3a22, pads:{c:0x8a2a22}, hair:{c:0x8a3a22,style:'pony'}, mantle:false, weapon:staff('bone',0xe8f0a0,0x5a3a22), fx:0xd8f08a},
};
LAB.PLAYERS=P;
for(const id in P) LAB.ROSTER.push({id, group:'Player characters', name:P[id].name+(P[id].fem?' (woman)':' (man)'), ref:'look:'+id, cell:96,
  views:[{name:'back',yaw:Math.PI-.42},{name:'front',yaw:.38}], moves:['idle','walk','cast','attack','hurt'], kind:'humanoid', spec:P[id]});
})();
