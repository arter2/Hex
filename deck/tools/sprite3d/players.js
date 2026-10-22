/* The 18 player looks. Every look has its own body plan (height, build, head size, posture, gait),
   a painted face, and garments made for it alone: no two share a cut, a headpiece or a motif.
   Colour families follow the game's current sprites. */
(function(){
const EL=LAB.EL, F=LAB.fabric, GB=LAB.garb, sh=LAB.sh, mixc=LAB.mixc, PI=Math.PI, {M,G,add,grp}=LAB;
LAB.ROSTER=LAB.ROSTER||[];
LAB.DS=THREE.DoubleSide;
const HUMAN=0xf1caa2, ELF=0xf6dcc0, DWARF=0xe9a87c, ORC=0x6a8f3e;
const staff=(head,c,wood)=>({kind:'staff',head,c,wood:wood?LAB.M(wood):undefined});
// hair and fur: streaks along the fall of the hair
const hairT=(c,w=64,h=32)=>F(w,h,{c,custom:P=>{ for(let x=0;x<w;x++){ const k=(x*7+3)%5; for(let y=0;y<h;y++){ if(k===0&&(y+x)%9) P.px(x,y,sh(c,.8)); else if(k===3&&(y*3+x)%7) P.px(x,y,sh(c,1.14)); } } }});
const furT=(c,c2,w=64,h=32)=>F(w,h,{c,fur:{c,c2}});
const stripesT=(a,b,n=3)=>F(32,32,{c:a,custom:P=>{ for(let y=0;y<32;y++) if(Math.floor(y/n)%2) P.rect(0,y,32,1,b); }});
const wrapsT=(a,b)=>F(32,32,{c:a,custom:P=>{ for(let y=0;y<32;y++) for(let x=0;x<32;x++){ const k=(x+y*2)%8; if(k===0) P.px(x,y,b); else if(k===1) P.px(x,y,sh(a,1.1)); } }});
// skin with painted bands (tattoos, war paint) for arms
const armT=(skin,c,o={})=>F(32,32,{c:skin,soft:false,custom:P=>{ const g=o.glow?{glow:true}:null; for(const y of o.rows||[8,20]){ for(let x=0;x<32;x++){ P.px(x,y,c,g); if(o.zig&&(x%4<2)) P.px(x,y+1,c,g); } } if(o.dots) for(let i=0;i<10;i++) P.px((i*7)%32,4+(i*11)%24,c,g); }});

const P={
/* 1. the archmage: stooped, long beard to the belt, star-sown robe open over a pale under-robe, bell sleeves, capelet, book on the hip */
wizard:{name:'Human wizard', skin:HUMAN, bodyW:.95, headK:1.32, attitude:'noble', stance:{armRZ:-.26,armRX:-.12}, gait:{stride:.75,arm:.5,bounce:.6},
  robe:F(128,64,{c:0x2c4c9a,mottle:[0x26448c,.1],scatter:[{pat:'star',c:0xe8c860,n:26,y0:4,y1:44,fg:{metal:.6}},{pat:'moon',c:0xf0e0a0,n:5,y0:6,y1:40}],
    rows:[{y0:49,y1:50,c:0xe8c860,fg:{metal:.7}},{y0:50,y1:61,c:0x1a2c66,pat:'rune',pc:0xe8c860,every:7,pfg:{metal:.6}},{y0:61,y1:64,c:0xe8c860,fg:{metal:.7}}]}),
  top:F(64,32,{c:0x2c4c9a,mottle:[0x26448c,.1],scatter:[{pat:'star',c:0xe8c860,n:6,y0:10,y1:30}],custom:P=>{ for(let y=0;y<24;y++){ const w=Math.max(0,Math.round(7-y*.3)); for(let dx=-w;dx<=w;dx++) P.px(dx,y,0x9ab8e8); P.px(-w-1,y,0xe8c860); P.px(w+1,y,0xe8c860); } }}),
  sleeve:'tight', sleeveC:0x2c4c9a, skirt:'none', belt:false, legs:0x24305a, boot:0x4a2a6a, shoe:{type:'curl',c2:0xe8c860},
  hair:{c:0xe8e8ec,style:'long',len:.4,tex:hairT(0xe8e8ec)},
  fp:{eyes:{style:'old',c:0x5a9ae0}, brows:{style:'bushy',c:0xf8f8fc}, nose:'long', mouth:'none', wrinkles:true, blush:0xe07a6a},
  hat:{type:'wizard',c:0x3256a8,tex:F(64,64,{c:0x3256a8,mottle:[0x2c4c9a,.12],scatter:[{pat:'star',c:0xe8c860,n:12,fg:{metal:.6}},{pat:'moon',c:0xf0e0a0,n:2}]}),band:0x3a2458,buckle:true,tilt:-.42,brim:.26,tall:.58,phase:.4},
  cape:F(64,64,{c:0x101c44,mottle:[0x0c1638,.15],rows:[{y0:58,y1:64,c:0xe8c860,fg:{metal:.6}}]}), capeHem:0xe8c860, capeLen:1.0,
  weapon:staff('orb',0x8fd8ff), fx:0x8fd8ff,
  dress(R,C){
    GB.skirt(R,C,{pts:GB.prof(C,.84,.31),mat:F(64,64,{c:0x9ab8e8,mottle:[0x8eaee0,.15],seams:[{a:0,c:0xe8c860,w:2,fg:{metal:.6}}],rows:[{y0:58,y1:64,c:0xe8c860}]}),folds:6,amp:.018});
    GB.skirt(R,C,{pts:GB.prof(C,.86,.37,{k:1.04}),mat:C.o.robe,folds:7,amp:.035,gap:.95});
    GB.bell(R,C,{mat:C.o.robe,len:.34,r1:.19,trim:0xe8c860});
    GB.capelet(R,C,{mat:F(64,32,{c:0x1e2c64,scatter:[{pat:'star',c:0xe8c860,n:8,fg:{metal:.6}}],rows:[{y0:27,y1:32,c:0xe8c860,fg:{metal:.6}}]}),len:.24,flare:1.32,gap:.55,trim:0xe8c860});
    GB.belt(R,C,{mat:0x5a3a8a,w:.03,items:[{t:'book',a:1.05,c:0x6a2028},{t:'scroll',a:-1.15},{t:'pouch',a:2.1,c:0x5a3a28},{t:'tassel',a:.3,c:0xe8c860}]});
    GB.beard(R,C,{c:0xf0f0f4,tex:hairT(0xeeeef4),style:'long',len:.5,w:1.02,stache:'big'}); }},

/* 2. the sorceress: hourglass gown with a laced bodice, puffed shoulders, opera gloves, overskirt split over a lace petticoat,
      navy capelet with a standing collar, wide-brimmed plumed hat tipped back */
human_f:{name:'Human witch', fem:true, skin:HUMAN, waistK:.82, hipK:1.08, bust:1.14, headK:1.3, stance:{torsoZ:.045,headX:-.03}, gait:{sway:.035},
  top:F(64,32,{c:0x1c2c66,lace:{a:0,y0:9,y1:27,c:0xf0f0f4},rows:[{y0:0,y1:8,c:0xf4f0ec},{y0:8,y1:9,c:0xc8d0e0,fg:{metal:.5}},{y0:27,y1:28,c:0xc8d0e0,fg:{metal:.5}}]}),
  bustM:0x1c2c66, sleeve:'short', sleeveC:0xf4f0ec, forearm:0x2a4aa0, gloves:0x2a4aa0, skirt:'none', belt:false, legs:0xe8e0f0, boot:0x22223e, shoe:{type:'heel'},
  hair:{c:0xb4502c,style:'long',len:.72,tex:hairT(0xb4502c)},
  fp:{eyes:{style:'big',c:0x3aa860,lash:true}, brows:{style:'arched',c:0x8a3a20}, nose:'small', mouth:'lips', lips:0xc03848, freckles:true, blush:0xf08a8a},
  hat:{type:'wide',c:0x24408a,tex:F(64,64,{c:0x24408a,mottle:[0x203a80,.1],rows:[{y0:0,y1:3,c:0xc8d0e0}]}),band:0x101a3a,plume:0xf4f0ec,gem:0x8fd8ff,tilt:-.42,roll:.14,brim:.36},
  weapon:staff('orb',0x8fd8ff), fx:0x8fd8ff,
  dress(R,C){
    GB.skirt(R,C,{pts:GB.prof(C,.8,.31),mat:F(64,64,{c:0xdce4f4,rows:[{y0:54,y1:64,c:0xf4f4fa,pat:'dot',pc:0xb8c4dc,every:3}]}),folds:10,amp:.02,hem:GB.scallop(14,.03)});
    GB.skirt(R,C,{pts:GB.prof(C,.76,.37,{k:1.05}),mat:F(128,64,{c:0x2a4aa8,mottle:[0x2644a0,.1],rows:[{y0:50,y1:51,c:0xd8dce8,fg:{metal:.7}},{y0:51,y1:61,c:0x1a2c6a,pat:'diamond',pc:0xd8dce8,every:5},{y0:61,y1:64,c:0xd8dce8}],
      scatter:[{pat:'spark',c:0xb8c8f0,n:10,y0:6,y1:44}]}),folds:7,amp:.045,gap:1.35});
    GB.puff(R,C,{mat:0xf4f0ec,r:.088});
    GB.capelet(R,C,{mat:F(64,32,{c:0x101a3a,rows:[{y0:28,y1:32,c:0xc8d0e0}]}),len:.2,flare:1.18,gap:.8,trim:0xc8d0e0});
    GB.collar(R,C,{mat:0x101a3a,h:.15,r0:.085,r1:.17,gap:2.3,trim:0xc8d0e0});
    GB.necklace(R,C,{c:0xe8e8f0,n:9,drop:.05,pendant:{c:0x8fd8ff,glow:true,r:.03,frame:0xd8dce8}});
    GB.belt(R,C,{y:.1,mat:0xc8d0e0,w:.014,items:[{t:'vial',a:1.35,c:0x8fd8ff}]}); }},

/* 3. the elf spellblade: tall and narrow, platinum hair to the waist, leaf circlet, high-collared doublet, four-panel tabard
      that swings with the stride, layered leaf pauldrons, leggings and pointed boots */
elf_m:{name:'Elf', slender:true, scale:1.05, legK:1.14, shK:1.08, headK:1.2, headS:[.9,1.08,.95], neckLen:.025, skin:ELF, ears:'elf', earL:.21,
  stance:{torsoX:-.05,headX:.03}, gait:{stride:1.1,arm:.6,bounce:.7},
  top:F(64,32,{c:0x1f6b4e,mottle:[0x1a6046,.1],custom:P=>{ for(let y=2;y<26;y++){ P.px(Math.round(4-y*.3),y,0xe8c860,{metal:.6}); } for(let y=6;y<26;y+=4) P.px(Math.round(4-y*.3)+1,y,0xe8c860,{metal:.6}); },rows:[{y0:26,y1:28,c:0xe8c860,fg:{metal:.6}}]}),
  sleeve:'tight', sleeveC:F(32,32,{c:0x174f3a,rows:[{y0:26,y1:30,c:0xe8c860,fg:{metal:.6}}]}), skirt:'none', belt:false, legs:0x1c2e26, boot:0x3a3428, bootTall:true, shoe:{type:'point'},
  hair:{c:0xf2e8bc,style:'pony',tex:hairT(0xf2e8bc)},
  fp:{eyes:{style:'almond',c:0x30c070}, brows:{style:'thin',c:0xd8c890}, nose:'small', mouth:'line', cheekbones:true, paint:{type:'tear',c:0x8affd2,glow:true}},
  hat:{type:'circlet',c:0xd8dce8,gem:0x6ff0a4},
  weapon:staff('crystal',EL.verdant), fx:0x8affd2,
  dress(R,C){
    GB.panels(R,C,{n:4,len:.74,w:.24,side:.62,mat:F(32,64,{c:0x2f8f5f,mottle:[0x2a8256,.1],rows:[{y0:56,y1:58,c:0xe8c860,fg:{metal:.6}},{y0:58,y1:64,c:0x1f6b4e,pat:'leaf',pc:0xe8c860,every:5}],
      seams:[{a:.2,c:0xe8c860,y0:0,y1:56,fg:{metal:.6}},{a:-.2,c:0xe8c860,y0:0,y1:56,fg:{metal:.6}}]}),trim:0xe8c860,flare:1.08});
    GB.pauldron(R,C,{style:'leaf',mat:0x3a9a68,mat2:0xd8b048,size:1.15});
    GB.collar(R,C,{mat:0x174f3a,h:.13,r0:.075,r1:.11,gap:1.1,trim:0xe8c860});
    GB.belt(R,C,{mat:0xd8b048,w:.016,buckle:0x6ff0a4,bw:.05,bh:.05,items:[{t:'tassel',a:.45,c:0xe8c860}]});
    // a long pale stole round the neck, ends hanging down the back
    for(const s of [1,-1]) add(R.torso,G.cloth(.07,.62,1.15,1,.01,.015),LAB.MT(0xe8dca8,{soft:true}),.07*s,.18,-C.b.ch*C.dz-.05,.1,0,s*.04); }},

/* 4. the elf priestess: very tall, gold hair to the knees, flower crown, empire gown with a scalloped leaf hem,
      sleeves that trail from the elbow, gold chain under the bust */
elf_f:{name:'Elf', fem:true, bodyW:.9, waistK:.84, scale:1.04, legK:1.12, headK:1.18, headS:[.92,1.06,.96], neckLen:.035, skin:ELF, ears:'elf', earL:.21,
  stance:{torsoZ:-.035,headX:.02}, gait:{stride:.9,sway:.02},
  top:F(64,32,{c:0xeef6ee,custom:P=>{ for(let y=10;y<14;y++) P.rect(0,y,64,1,0xe8c860,{metal:.6}); for(let x=-3;x<=3;x++) for(let y=14;y<30;y+=3) P.px(x*2,y,0xbde0c8); }}),
  bustM:0xeef6ee, sleeve:'tight', sleeveC:0xdcefe4, skirt:'none', belt:false, legs:0xdcefe4, boot:0xd8c890,
  hair:{c:0xf2d27c,style:'long',len:.95,tex:hairT(0xf2d27c)},
  fp:{eyes:{style:'almond',c:0x9a6ad8,lash:true}, brows:{style:'arched',c:0xc8a050}, nose:'small', mouth:'lips', lips:0xd87a8a, blush:0xf0a0a0, paint:{type:'forehead',c:0x6ff0a4,glow:true}},
  hat:{type:'flowers'},
  weapon:staff('leaf',EL.verdant), fx:0x8affd2,
  dress(R,C){
    GB.skirt(R,C,{pts:GB.prof(C,.95,.4),mat:F(128,64,{c:0xe4f2e8,custom:P=>{ for(let y=20;y<64;y++){ const t=(y-20)/44; if((y*7)%3===0) P.rect(0,y,128,1,mixc(0xe4f2e8,0x6ac08a,t*.7)); } },
      rows:[{y0:56,y1:64,c:0x5aa86a,pat:'leaf',pc:0xe8c860,every:6,pfg:{metal:.5}}],scatter:[{pat:'leafS',c:0x9ad0a8,n:30,y0:10,y1:52}]}),folds:9,amp:.03,hem:GB.scallop(12,.06)});
    GB.trail(R,C,{mat:0xcfe8d8,len:.62,w:.17,flare:1.7});
    GB.belt(R,C,{y:.27,rk:1.3,mat:0xe8c860,w:.012});
    GB.necklace(R,C,{c:0xe8c860,metal:.8,n:11,drop:.04,r:.01,pendant:{c:0x6ff0a4,glow:true,r:.025}});
    for(const s of [1,-1]) add(R.torso,G.leaf(.05,.12),M(0xe8c860,{metal:.8}),C.b.sh*.8*s,.5,.05,-.5,0,-s*.5); }},

/* 5. the runesmith: short and immensely broad, forked braided beard, goggles on the brow, chainmail shirt, leather smith's apron,
      plaid kilt, rune bracers on bare forearms, steel-capped boots, hammer on the belt */
dwarf_m:{name:'Dwarf', muscle:true, scale:.8, bodyW:1.42, shK:1.04, legK:.68, legW:1.25, armK:1.25, armLen:.94, headK:1.46, headS:[1.02,1.06,1.0], headP:{jaw:1.15,brow:1.6,cheek:1.3}, skin:DWARF,
  stance:{armLZ:.2,armRZ:-.1,torsoX:.04}, gait:{sway:.07,stride:.8,bounce:1.3,lift:.7},
  top:F(64,32,{c:0x7a828c,rings:{c:0x9aa2ac,c2:0x4a525c,metal:.75},rows:[{y0:0,y1:3,c:0x3a2418}]}), sleeve:'short', sleeveC:F(32,32,{c:0x7a828c,rings:{c:0x9aa2ac,c2:0x4a525c}}),
  armSkin:armT(DWARF,0xff8a3a,{rows:[22,27],glow:true,zig:true}), skirt:'none', belt:false, legs:0x3a2e28, boot:0x3a2418, bootTall:true, shoe:{type:'heavy',c2:0x8a929c},
  bracers:0x5a3a22,
  hair:{c:0xe0702a,style:'wild',len:.3,tex:hairT(0xe0702a)},
  fp:{eyes:{style:'narrow',c:0x3a7ac0}, brows:{style:'bushy',c:0xd8641e}, nose:'big', mouth:'none', blush:0xe06050, wrinkles:true},
  hat:{type:'goggles',c:0xc8903a,lens:0x7ad8ff},
  weapon:staff('flame',0xff7a2a), fx:0xffa040,
  dress(R,C){ const b=C.b;
    GB.skirt(R,C,{pts:GB.prof(C,.38,b.hp*1.25),mat:F(64,32,{c:0x2a2a30,plaid:{c1:0xd8641e,c2:0x8a3a14,c3:0x4a4a54,step:8}}),folds:16,amp:.014});
    add(R.torso,G.sph(b.wa*1.08,14,10),LAB.MT(F(32,32,{c:0x7a828c,rings:{c:0x9aa2ac,c2:0x4a525c}}),{metal:.6}),0,.12,b.wa*.2).scale.set(1,.85,.95);
    add(R.torso,G.cloth(.3,.62,1.2,1,.01,.02),LAB.MT(F(32,64,{c:0x6a4228,mottle:[0x5a3820,.18],scatter:[{pat:'dot2',c:0x2a1a12,n:8,y0:10,y1:60}],rows:[{y0:0,y1:2,c:0x3a2418}],
      patches:[{a:.0,y:24,w:8,h:7,c:0x5a3820,st:0xd8b048}]}),{soft:true,side:LAB.DS}),0,.28,b.ch*C.dz+.07,-.12);
    GB.strap(R,C,[-.07,.44,b.ch*C.dz+.06],[-.1,.56,0.0],0x3a2418,.035); GB.strap(R,C,[.07,.44,b.ch*C.dz+.06],[.1,.56,0.0],0x3a2418,.035);
    GB.belt(R,C,{mat:0x3a2418,w:.045,buckle:0xd8b048,bw:.13,bh:.11,rk:1.32,items:[{t:'hammer',a:1.35},{t:'pouch',a:-1.25,c:0x5a3a22},{t:'pouch',a:-1.9,c:0x4a3020}]});
    add(R.torso,G.tor(b.sh*.75,.07,6,14),LAB.MT(furT(0x8a6a4a,0x6a4a30),{soft:true}),0,.52,0,PI/2).scale.set(1,.85,1);
    GB.beard(R,C,{c:0xe0702a,tex:hairT(0xe0702a),style:'fork',len:.72,w:1.28,z:.1,zs:.72,stache:'big',ring:0xd8b048}); }},

/* 6. the forgemaiden: short and strong, twin buns and braids, sleeveless laced leather jerkin with fur trim, work gloves,
      a steel gauntlet on the hammer arm, short pleated kilt over leggings, fur-cuffed boots, tongs and hammer on the belt */
dwarf_f:{name:'Dwarf', fem:true, muscle:true, scale:.82, bodyW:1.16, legK:.72, legW:1.12, armK:1.12, headK:1.48, skin:DWARF,
  stance:{torsoZ:.03,armLZ:.12,armRZ:-.06}, gait:{sway:.05,bounce:1.2,stride:.85},
  top:F(64,32,{c:0x6a2a24,mottle:[0x5a2420,.15],lace:{a:0,y0:4,y1:24,c:0xe8d8b0,gap:0x2a1a12},rows:[{y0:0,y1:4,c:0xd8c8a8}]}), bustM:0x6a2a24,
  sleeve:'bare', forearm:0x4a3020, gloves:0x4a3020, skirt:'none', belt:false, legs:0x3a2e28, boot:0x4a2e1e, shoe:{type:'fur',c2:0xd8c8a8},
  hair:{c:0xe0702a,style:'short',tex:hairT(0xe0702a),cover:.5,tilt:-.5},
  fp:{eyes:{style:'round',c:0xd09030,lash:true}, brows:{style:'heavy',c:0xd8641e}, nose:'button', mouth:'smirk', freckles:true, blush:0xe08070,
    custom:(P,A,at)=>{ at(A.cheekF,0,0,0x7a6a6a); at(A.cheekF,1,1,0x8a7a7a); }},
  hat:{type:'buns',c:0xe0702a,bead:0xd8b048},
  weapon:staff('flame',0xff7a2a), fx:0xffa040,
  dress(R,C){ const b=C.b;
    GB.skirt(R,C,{pts:GB.prof(C,.34,b.hp*1.3),mat:F(64,32,{c:0x3a3a44,plaid:{c1:0x4a8a8a,c2:0x2a5a5a,c3:0xd8641e,step:7}}),folds:18,amp:.012});
    add(R.torso,G.tor(b.sh*.7,.055,6,14),LAB.MT(furT(0xd8c8a8,0xb8a888),{soft:true}),0,.53,0,PI/2).scale.set(1,.85,1);
    const g=R.elbowR; add(g,G.cyl(b.ar*1.25,b.ar*1.05,.24,10),M(0x8a929c,{metal:.9}),0,-.16,0); add(g,G.cyl(b.ar*1.4,b.ar*1.4,.04,10),M(0xd8b048,{metal:.9}),0,-.04,0);
    add(R.armR,G.cap(.11,.5,12,6),M(0x8a929c,{metal:.9}),0,.0,0).scale.set(1,.8,1);
    GB.belt(R,C,{mat:0x3a2418,w:.04,buckle:0xc8c8d0,rk:1.3,items:[{t:'hammer',a:-1.3},{t:'knife',a:1.4},{t:'pouch',a:2.2,c:0x5a3a22}]}); }},

/* 7. the lich: hunched skeleton in a rotting royal robe hanging open over the ribs, towering ragged collar,
      rusted spiked crown, chains and a glowing phylactery */
undead_m:{name:'Undead', skel:true, scale:1.05, legK:1.05, armLen:1.12, headK:1.3, skin:0xb9c3cc, bone:0xd8dccc, face:'skull', eyes:0x7fffe0, headP:{len:1.16,jaw:.66,cheek:2,sockets:3,chin:.35,brow:1.6},
  stance:{torsoX:.22,headX:-.16,armLZ:.06,armLX:.15}, gait:{stride:.6,sway:.06,bounce:.4,arm:.3,lift:.5},
  robe:F(128,64,{c:0x2a1a38,mottle:[0x22142e,.15],tears:{c:0x0e0812,n:14},rows:[{y0:4,y1:5,c:0x8a7a40},{y0:5,y1:12,c:0x1a1024,pat:'rune',pc:0x8a7a40,every:7},{y0:12,y1:13,c:0x8a7a40}],
    scatter:[{pat:'skull',c:0x3a2a48,n:6,y0:18,y1:50}]}),
  sleeve:'flared', skirt:'none', belt:false, legs:'bone',
  fp:{eyes:{style:'socket',c:0x7fffe0}, nose:'skull', mouth:'skull', custom:(P,A,at)=>{ at(A.browN,-1,-2,0x8a8a80); at(A.browN,0,-3,0x8a8a80); at(A.browN,1,-4,0x8a8a80); at(A.cheekF,1,-1,0x8a8a80); }},
  hat:{type:'spikecrown',c:0x6a5a4a,gem:0x6affd0},
  cape:F(64,64,{c:0x1a1424,tears:{c:0x0a0610,n:10},rows:[{y0:0,y1:3,c:0x8a7a40}]}), capeHem:0x1a1424, rags:true, capeLen:1.0,
  weapon:staff('ghost',0x7fffe0,0x4a4a52), fx:0x7fffe0,
  dress(R,C){ const b=C.b;
    GB.skirt(R,C,{pts:GB.prof(C,.84,.36),mat:C.o.robe,folds:8,amp:.045,gap:1.5,hem:GB.tatter(.1,2)});
    GB.shell(R,C,{mat:C.o.robe,gap:1.9,k:1.25,from:2,to:8});
    GB.collar(R,C,{mat:F(64,32,{c:0x2a1838,tears:{c:0x0a0610,n:6}}),h:.34,r0:.1,r1:.27,gap:1.9,trim:0x8a7a40,y:.48});
    GB.necklace(R,C,{t:'beads',c:0x6a6a70,n:7,drop:.1,pendant:{c:0x6affd0,glow:true,r:.04,frame:0x8a7a40}}); }},

/* 8. the banshee: floats with no feet, hair streaming upward, screaming mouth, bone-stayed bodice over bare ribs,
      ragged trailing sleeves, a gown that frays into glowing wisps */
undead_f:{name:'Undead', fem:true, float:true, scale:1.0, headK:1.24, skin:0xa8b4c4, robe:0x4a5468, bone:0xd8dccc, ribs:0xd8dccc, boneArms:true,
  top:F(64,32,{c:0x3a4458,custom:P=>{ for(let x=0;x<64;x+=4) for(let y=10;y<28;y++) P.px(x,y,0xc8ccc0); },rows:[{y0:9,y1:10,c:0x8a96a8}]}), bustM:0x3a4458,
  stance:{armLZ:.38,armRZ:-.3,armLX:-.35,armRX:-.05,torsoX:.06,headX:.06}, sleeve:'open', skirt:'none', belt:false,
  fp:{eyes:{style:'glow',c:0xe8ffff}, sunken:0x14182a, brows:{style:'none'}, nose:'skull', mouth:'open', mouthGlow:0x9affff, custom:(P,A,at)=>{ at(A.cheekN,0,1,0x7a8496); at(A.cheekN,0,2,0x7a8496); at(A.cheekF,0,1,0x7a8496); }},
  hat:{type:'stream',c:0xe8f0f4,len:.66,tip:0x9affff},
  weapon:staff('ghost',0x7fffe0,0x4a4a52), fx:0x7fffe0,
  dress(R,C){ const b=C.b, gm=[0x9affff,0x6ad8e8].map(c=>M(c,{glow:true}));
    GB.skirt(R,C,{pts:[[.05,-1.0],[.26,-.75],[.3,-.4],[b.hp*1.1,-.05],[b.wa*1.1,.12]],mat:F(64,64,{c:0x4a5468,custom:P=>{ for(let y=30;y<64;y++){ const t=(y-30)/34; if((y+P.rnd()*4|0)%3===0) P.rect(0,y,64,1,mixc(0x4a5468,0x9ab8c8,t)); } },tears:{c:0x1a2030,n:12}}),folds:7,amp:.05,hem:GB.tatter(.16,4)});
    GB.seed(4); const W=[]; for(let i=0;i<7;i++){ const a=i/7*PI*2, r=.2; W.push([[Math.sin(a)*r,-.85,Math.cos(a)*r],[Math.sin(a)*r*1.2,-1.0,Math.cos(a)*r*1.2-.05],[Math.sin(a+.5)*r*.8,-1.15,Math.cos(a+.5)*r*.8-.15]]); }
    GB.strands(R.skirt,W,gm,.03,.008);
    GB.trail(R,C,{mat:0x5a6478,len:.5,w:.15,flare:1.9}); }},

/* 9. the warlock: V-shaped and proud, shaved head with glowing pact runes and small black horns, sleeveless long coat with a
      towering collar split front and back, bare chest with a glowing sigil, one spiked pauldron, chain belt with a skull */
witch_m:{name:'Warlock', muscle:true, scale:1.06, shK:1.14, waistK:.86, legK:1.04, headK:1.22, skin:0xe6c0a2,
  stance:{torsoX:-.06,headX:.04}, gait:{stride:1.1},
  top:F(64,32,{c:0xe6c0a2,soft:false,custom:P=>{ const g={glow:true}, c=0xd070ff; for(let i=0;i<7;i++){ P.px(0,10+i,c,g); } for(let i=-4;i<=4;i++) P.px(i,13,c,g); P.px(-3,11,c,g); P.px(3,11,c,g); P.px(-3,15,c,g); P.px(3,15,c,g); P.px(-2,17,c,g); P.px(2,17,c,g); }}),
  showMus:true, sleeve:'bare', armSkin:armT(0xe6c0a2,0xd070ff,{rows:[6,10,22],glow:true,zig:true}), skirt:'none', belt:false, legs:0x241a30, boot:0x1a1220, bootTall:true, shoe:{buckle:0xc8c8d0},
  bracers:0x2a1a40, gloves:0x2a1a40,
  fp:{eyes:{style:'glow',c:0xd070ff}, brows:{style:'angry',c:0x1a1018}, nose:'long', mouth:'smirk', cheekbones:true, paint:{type:'runes',c:0xd070ff,glow:true},
    custom:(P,A,at)=>{ for(let dy=1;dy<=3;dy++) at(A.mouth,0,dy,0x1a1018); at(A.mouth,1,2,0x1a1018); at(A.mouth,-1,-1,0x1a1018); at(A.mouth,1,-1,0x1a1018); }},
  hair:{c:0x18121e,style:'short',tex:hairT(0x221a2a)},
  weapon:staff('orb',0xff7ae0,0x3a2440), fx:0xff8ae8,
  dress(R,C){ const coat=F(64,64,{c:0x3a2260,mottle:[0x341e58,.1],seams:[{a:1.2,c:0xc8c8d0},{a:-1.2,c:0xc8c8d0}],rows:[{y0:60,y1:64,c:0xc8c8d0,fg:{metal:.6}}]});
    for(const s of [1,-1]) add(R.head,G.tube([[.1*s,.25,.07],[.16*s,.33,.02],[.19*s,.4,-.08],[.17*s,.44,-.2],[.13*s,.42,-.28]],.05,.008,14,6),M(0x1a1018,{metal:.3}),0,0,0);
    add(R.head,G.cone(.03,.06,4),M(0x18121e,{soft:true}),0,.27,.13,-.9);
    GB.shell(R,C,{mat:coat,gap:2.5,k:1.1,from:2,to:8});
    GB.skirt(R,C,{pts:GB.prof(C,.72,.36),mat:coat,a0:.55,len:PI-.55-.1,folds:4,amp:.03,s:20});
    GB.skirt(R,C,{pts:GB.prof(C,.72,.36),mat:coat,a0:PI+.1,len:PI-.55-.1,folds:4,amp:.03,s:20});
    GB.collar(R,C,{mat:0x2a1840,h:.34,r0:.11,r1:.25,gap:1.9,trim:0xc8c8d0,z:-.025});
    GB.pauldron(R,C,{sides:[1],style:'spike',mat:0x2a2430,metal:.7,spike:0xc8c8d0,size:1.1,n:2});
    GB.belt(R,C,{mat:0x5a5868,w:.025,items:[{t:'skull',a:0,c:0xe8e0c8},{t:'vial',a:1.4,c:0xff7ae0}]});
    }},

/* 10. the hedge witch: thin with a sly lean, crooked patched hat with a charm, black laced corset, short ragged patchwork skirt,
       striped stockings, pointed buckle shoes, fringed shawl, potions at the hip */
witch:{name:'Witch', fem:true, bodyW:.9, waistK:.8, legK:1.08, headK:1.28, skin:0xecd6d2,
  stance:{torsoX:.06,torsoZ:.05,headX:-.04}, gait:{sway:.04,stride:.9},
  top:F(64,32,{c:0x16121c,lace:{a:0,y0:8,y1:27,c:0xb06ad0},rows:[{y0:0,y1:7,c:0xe8e0ec},{y0:7,y1:8,c:0x6a3a8a}]}), bustM:0x16121c,
  sleeve:'tight', sleeveC:F(32,32,{c:0x4a2a6a,patches:[{a:.5,y:8,w:6,h:5,c:0x2a5a3a,st:0xd8c8a8},{a:3.5,y:18,w:5,h:6,c:0x6a2a4a,st:0xd8c8a8}],rows:[{y0:28,y1:32,c:0xe8e0ec}]}),
  skirt:'none', belt:false, legs:stripesT(0x1a1220,0x7a3aa0,3), boot:0x1a1018, shoe:{type:'point',buckle:0xc8c8d0},
  hair:{c:0x2a1a34,style:'long',len:.66,tex:hairT(0x2a1a34)},
  fp:{eyes:{style:'almond',c:0xc8e040,pupil:0x101008,lash:true,liner:0x2a0a2a}, shadow:0x7a3a8a, brows:{style:'arched',c:0x1a1018}, nose:'hook', mouth:'lips', lips:0x6a1a4a,
    custom:(P,A,at)=>{ at(A.mouth,2,-2,0x3a1a2a); }},
  hat:{type:'crooked',c:0x4a2f78,tex:F(64,64,{c:0x4a2f78,mottle:[0x42286c,.1],patches:[{a:.6,y:30,w:9,h:8,c:0x2a5a3a,st:0xd8c8a8},{a:3.4,y:14,w:7,h:6,c:0x6a2a4a,st:0xd8c8a8}]}),band:0x1a1020,buckle:0xc8c8d0,charm:0xb8ff6a,tilt:-.42,brim:.32},
  weapon:staff('orb',0xff7ae0,0x3a2440), fx:0xff8ae8,
  dress(R,C){
    GB.skirt(R,C,{pts:GB.prof(C,.4,.28),mat:F(64,32,{c:0x2a1a3a}),folds:10,amp:.03,hem:GB.zig(18,.04)});
    GB.skirt(R,C,{pts:GB.prof(C,.36,.31,{k:1.03}),mat:F(64,32,{c:0x5a2a7a,custom:P=>{ const cs=[0x5a2a7a,0x3a2a5a,0x6a2a4a,0x2a4a3a,0x4a2f78]; for(let y=0;y<32;y+=8) for(let x=0;x<64;x+=8){ P.rect(x+((y/8)%2)*4,y,8,8,cs[((x/8)+(y/8)*3)%5]); } for(let y=0;y<32;y+=8) for(let x=0;x<64;x+=2) P.px(x,y,0xd8c8a8); }}),folds:9,amp:.04,hem:GB.tatter(.08,3)});
    GB.capelet(R,C,{mat:F(64,32,{c:0x24402e,mottle:[0x1e3628,.15]}),len:.17,flare:1.2,gap:.9,folds:6});
    GB.fringe(R.torso,{n:22,r:C.b.sh*1.18,y:.31,dz:.88,len:.07,mat:0x24402e,a0:.45,span:PI*2-.9});
    GB.belt(R,C,{mat:0x2a1a24,w:.02,items:[{t:'vial',a:1.2,c:0xb8ff6a},{t:'vial',a:1.6,c:0xff7ae0},{t:'pouch',a:-1.3,c:0x3a2a1a}]}); }},

/* 11. the barrow druid: gaunt and stooped, deer-skull mask with branching antlers, moss beard, cloak of fallen leaves,
       a moss mantle, bone charms, bandaged shins and clawed bare feet */
necro:{name:'Necromancer', slender:true, scale:1.08, legK:1.08, armLen:1.12, headK:1.2, skin:0xc4a888, headP:{cheek:1.5,jaw:.9,sockets:1.6,len:1.12},
  fp:{eyes:{style:'narrow',c:0x9cff6a,glow:true}, brows:{style:'heavy',c:0x3a4a34}, nose:'long', sunken:0x2a3a2a, wrinkles:true},
  stance:{torsoX:.2,headX:-.12}, gait:{stride:.7,arm:.4,bounce:.6},
  top:F(64,32,{c:0x4a3a22,leaves:{c:[0x6a4a22,0x8a5a2a,0x4a5a2a,0x9a3a1a,0x5a4a1a]}}), sleeve:'open', robe:F(64,64,{c:0x4a3a22,leaves:{c:[0x6a4a22,0x8a5a2a,0x4a5a2a,0x9a3a1a,0x3a3a1a]}}),
  skirt:'none', belt:false, legs:wrapsT(0x8a8070,0x5a5244), shoe:{type:'claw',c2:0x1a1410},
  hat:{type:'deerskull',c:0xe6dcc4,antler:0x4a3a28,eyes:0x9cff6a},
  weapon:staff('skull',0x7ff0c0,0x4a3220), fx:0x7ff0c0,
  dress(R,C){ const lv=[0x6a4a22,0x8a5a2a,0x4a5a2a,0x9a3a1a,0x3a3a1a].map(c=>M(c,{soft:true}));
    GB.skirt(R,C,{pts:GB.prof(C,.9,.4),mat:C.o.robe,folds:11,amp:.05,gap:.7,hem:GB.tatter(.12,5)});
    for(let k=0;k<4;k++) LAB.leafRing(R.skirt,18,-.12-k*.17,.27+k*.035,.92,lv,.08,.22,.3,.5,k*.6);
    GB.capelet(R,C,{mat:furT(0x4a6a34,0x3a5228),len:.2,flare:1.38,hem:GB.tatter(.07,7),folds:9});
    GB.beard(R,C,{style:'moss',c:0x6a7a5a,len:.26,z:.12});
    GB.belt(R,C,{mat:0x3a2a1a,w:.025,items:[{t:'skull',a:.95},{t:'bone',a:-.9},{t:'feather',a:1.7,c:0x2a2a2a},{t:'skull',a:-1.75},{t:'lantern',a:2.4,c:0x9cff6a}]}); }},

/* 12. the mourning dryad: slender and curved, thorn crown with a veil of hanging moss, glowing eyes, a gown of dark leaves
       slit to the hip, vines coiled up the bare leg and arms, bone beads, drifting spores */
necro_f:{name:'Necromancer', fem:true, waistK:.82, hipK:1.12, bust:1.12, legK:1.04, headK:1.26, skin:0xd2dccc,
  stance:{torsoZ:.05,headX:-.02}, gait:{sway:.045},
  top:F(64,32,{c:0x2a3a2e,leaves:{c:[0x3a5a3a,0x5a3a5a,0x2a4a3a,0x6a4a6a,0x4a6a4a]},rows:[{y0:0,y1:6,c:0xd2dccc}]}), bustM:0x3a4a3a, sleeve:'bare', legs:'skin', skirt:'none', belt:false, shoe:{type:'bare'},
  armVines:0x2a4a22,
  hair:{c:0x2a3a34,style:'long',len:.78,tex:hairT(0x2a3a34),cover:.5,tilt:-.5},
  fp:{eyes:{style:'almond',c:0x7aff9a,glow:true,lash:true}, shadow:0x2a4a2a, brows:{style:'arched',c:0x14161a}, nose:'small', mouth:'lips', lips:0x2a4a30, paint:{type:'veins',c:0x3a6a3a}},
  hat:{type:'thornveil',c:0x1a1418,moss:0x5a7a52,leaves:0x3a5a3a,halo:true},
  weapon:staff('skull',0x7ff0c0,0x2a2a2e), fx:0x7ff0c0,
  dress(R,C){
    GB.skirt(R,C,{pts:GB.prof(C,.86,.33),mat:F(64,64,{c:0x2a3a2e,leaves:{c:[0x3a5a3a,0x5a3a5a,0x2a4a3a,0x6a4a6a,0x4a6a4a]},scatter:[{pat:'dot',c:0x9affb0,n:26,fg:{glow:true}},{pat:'dot2',c:0x7aff9a,n:6,fg:{glow:true}}]}),folds:10,amp:.045,a0:.55,len:PI*2-.95,hem:GB.zig(16,.07)});
    for(const n of ['L','R']){ LAB.vine(R['leg'+n],[[C.b.lr*1.0,-C.thighL],[C.b.lr*1.05,0]],1,1.3,M(0x2a4a22),M(0x3a6a2a,{soft:true}),.014,n==='L'?0:2); LAB.vine(R['knee'+n],[[C.b.lr*.75,-C.shinL],[C.b.lr*.8,0]],1,1.4,M(0x2a4a22),null,.012,1); }
    GB.necklace(R,C,{t:'bones',c:0xe8e0c8,n:11,drop:.07});
    GB.belt(R,C,{mat:0x2a3a22,w:.016,rk:1.15,items:[{t:'skull',a:-1.4,c:0xe8e0c8}]}); }},

/* 13. the wolf shaman: stocky, crouched and wide, wolf-head pelt hood with paws over the shoulders, bare painted chest,
       fang necklace, braided beard, fur kilt over leather trousers, moccasins */
shaman_m:{name:'Shaman', muscle:true, bodyW:1.12, scale:.98, legK:.95, headK:1.3, skin:0xc8906a, headP:{jaw:1.2,brow:1.5,cheek:1.4},
  attitude:'brute', stance:{legL:-.16,legR:.14,armRX:-.35,elbowR:-.3,armLZ:.1}, gait:{stride:1.1,bounce:1.3},
  top:F(64,32,{c:0xc8906a,soft:false,custom:P=>{ const c=0xf0f0e8; for(let y=8;y<26;y+=5) for(let i=-6;i<=6;i++) if(Math.abs(i)>1) P.px(i,y+Math.round(Math.abs(i)*.3),c); for(let y=0;y<6;y++){ P.px(-10,8+y*3,0x2aa8a0); P.px(10,8+y*3,0x2aa8a0); } }}),
  sleeve:'bare', armSkin:armT(0xc8906a,0x2aa8a0,{rows:[6,9,24],zig:true}), skirt:'none', belt:false, legs:0x5a4630, boot:0x7a5634, shoe:{type:'moccasin'}, bracers:0x5a3a22,
  fp:{eyes:{style:'round',c:0x6a4a20}, brows:{style:'heavy',c:0x5a2a14}, nose:'broad', mouth:'frown', paint:{type:'mask',c:0xf0f0e8}},
  hat:{type:'wolf',c:0x8a8a92,tex:furT(0x8a8a92,0x6a6a72)},
  weapon:staff('feather',0x7fffd0), fx:0x7fffd0,
  dress(R,C){
    GB.beard(R,C,{c:0x8a4a24,tex:hairT(0x8a4a24),style:'braid',len:.24,w:.92,ring:0xe8e0c8});
    GB.skirt(R,C,{pts:GB.prof(C,.42,.3),mat:furT(0x7a5a3a,0x5a4028),folds:12,amp:.03,hem:GB.tatter(.07,4)});
    GB.necklace(R,C,{t:'teeth',n:11,drop:.08});
    GB.belt(R,C,{mat:0x5a3a22,w:.03,items:[{t:'feather',a:1.15,c:0xf0e6d0},{t:'feather',a:-1.2,c:0x3a2418},{t:'pouch',a:2.0},{t:'bone',a:-2.1}]}); }},

/* 14. the sky shaman: lithe, fanned feather headdress, twin black braids, dot face paint, beaded bandeau, criss-cross straps,
       short fur shoulder cape, fringed suede skirt, thigh straps and moccasins */
shaman_f:{name:'Shaman', fem:true, muscle:true, waistK:.86, bust:1.1, legK:1.05, headK:1.28, skin:0xc8906a,
  stance:{torsoZ:-.04}, gait:{stride:1.05},
  top:'skin', bra:F(64,32,{c:0x2aa8a0,custom:P=>{ for(let y=0;y<32;y+=3) for(let x=0;x<64;x+=3) P.px(x+(y%2),y,(x+y)%9===0?0xc03020:0xe8e0c8); }}), braCup:0x2aa8a0,
  sleeve:'bare', armSkin:armT(0xc8906a,0xe8e0c8,{rows:[7,8]}), skirt:'none', belt:false, legs:'skin', boot:0x8a6a44, shoe:{type:'moccasin'}, straps:0x5a3a22,
  hair:{c:0x1a1214,style:'braids',tex:hairT(0x1a1214)},
  fp:{eyes:{style:'big',c:0xc08030,lash:true}, brows:{style:'thin',c:0x1a1214}, nose:'button', mouth:'smile', paint:[{type:'dots',c:0xf0f0e8},{type:'line',c:0xc03020}]},
  hat:{type:'feathers',band:0x8a2a1a,c:0xf4ecdc,c2:0xe8d8c0,tip:0x3a2418,n:9,len:.4},
  weapon:staff('feather',0x7fffd0), fx:0x7fffd0,
  dress(R,C){ const b=C.b;
    GB.skirt(R,C,{pts:GB.prof(C,.3,.29),mat:F(64,32,{c:0xb08a5a,rows:[{y0:2,y1:5,c:0x2aa8a0,pat:'diamondF',pc:0xc03020,every:5}]}),folds:6,amp:.02,hem:GB.zig(22,.04)});
    GB.fringe(R.hips,{n:26,r:b.hp*1.35,y:-.28,dz:.92,len:.12,mat:0xb08a5a});
    GB.capelet(R,C,{mat:furT(0xe8dcc8,0xc8b8a0),len:.16,flare:1.25,hem:GB.tatter(.04,8),folds:8,gap:.6});
    for(const n of ['L','R']){ add(R['leg'+n],G.tor(b.lr*1.02,.016,4,12),M(0x5a3a22),0,-.12,0,PI/2); add(R['leg'+n],G.tor(b.lr*.95,.016,4,12),M(0x5a3a22),0,-.2,0,PI/2); add(R['knee'+n],G.leaf(.03,.12),M(0xf0e6d0,{soft:true}),b.lr*.9,-.06,0,PI,0,-.3); }
    GB.necklace(R,C,{c:0x2aa8a0,c2:0xc03020,n:11,drop:.06});
    GB.belt(R,C,{mat:0x5a3a22,w:.022,items:[{t:'pouch',a:-1.2,c:0x8a6a44},{t:'feather',a:1.3,c:0xf0e6d0}]}); }},

/* 15. the outlaw (Robin Hood): heroic stance, feathered cap, dagged green tunic over a cream shirt, laced leather vest,
       open hanging sleeves, brown hose, tall cuffed boots, dark green cape and a quiver */
ranger_m:{name:'Ranger', mus:.5, legK:1.04, headK:1.3, skin:HUMAN,
  stance:{legL:-.1,legR:.12,torsoX:-.04}, gait:{stride:1.15},
  top:F(64,32,{c:0x4a7a2a,mottle:[0x426e26,.12],rows:[{y0:0,y1:3,c:0xe8dcc0}]}), robe:0x4a7a2a, sleeve:'open', sleeveC:0xe8dcc0, forearm:0xe8dcc0,
  vest:F(64,32,{c:0x6b4428,mottle:[0x5e3a22,.15],lace:{a:.0,y0:6,y1:24,c:0xe8d8b0}}), vestGap:.75, skirt:'none', belt:false,
  legs:0x6a5238, boot:0x3a2618, bootTall:true, bracers:0x5a3a22, gloves:0x5a3a22, quiver:0x6b3f24,
  hair:{c:0x6a4228,style:'short',tex:hairT(0x6a4228)},
  fp:{eyes:{style:'round',c:0x4a8a3a}, brows:{style:'angry',c:0x4a2a18}, nose:'small', mouth:'smirk', stubble:0x6a4228, scar:{at:'near'}},
  hat:{type:'robin',c:0x4a6a24,band:0x6b3f24,feather:0xb5452e,tilt:-.3},
  cape:F(64,64,{c:0x1e3418,mottle:[0x1a2e14,.12]}), capeHem:0x14240e, capeLen:.95,
  weapon:staff('crystal',0x8affe0), fx:0x8affe0,
  dress(R,C){ const b=C.b;
    GB.skirt(R,C,{pts:GB.prof(C,.36,.29),mat:F(64,32,{c:0x4a7a2a,mottle:[0x426e26,.12],rows:[{y0:28,y1:32,c:0x3a6020}]}),folds:7,amp:.025,hem:GB.zig(14,.07)});
    for(const n of ['L','R']) add(R['knee'+n],G.cyl(b.lr*.98+.03,b.lr*.85+.03,.07,10),M(0x4a3020),0,-C.shinL*.3,0);
    GB.beard(R,C,{c:0x6a4228,style:'short',zs:.55});
    GB.belt(R,C,{mat:0x5a3a22,w:.04,buckle:0xc8a26a,rk:1.2,items:[{t:'pouch',a:1.3,c:0x6b4428},{t:'knife',a:-1.3}]}); }},

/* 16. the wild ranger: long-legged and athletic, one thick braid over the shoulder, beaded headband with a feather,
       fringed suede shirt laced at the throat, leather shorts, fringed knee moccasins, quiver, red war paint and freckles */
ranger_f:{name:'Ranger', fem:true, muscle:true, legK:1.07, waistK:.86, bust:1.1, headK:1.28, skin:0xd9a882,
  stance:{torsoZ:.05,legL:-.06,legR:.06}, gait:{stride:1.1},
  top:F(64,32,{c:0x3f6a2e,mottle:[0x375e28,.14],lace:{a:0,y0:2,y1:12,c:0xe8d8b0,gap:0xd9a882},rows:[{y0:12,y1:15,c:0x5a3a22,pat:'diamondF',pc:0xe8d8b0,every:4},{y0:24,y1:26,c:0x2e5022}]}), bustM:0x3f6a2e,
  sleeve:'short', sleeveC:0x3f6a2e, skirt:'none', belt:false, legs:'skin', shorts:0x5a3a22, shortsLen:.42, boot:0x9a7a50, bootTall:true, shoe:{type:'moccasin'},
  quiver:0x5a3a22, bracers:0x5a3a22, hoodDown:0x2e5022,
  hair:{c:0x3a2418,style:'short',tex:hairT(0x3a2418)},
  fp:{eyes:{style:'big',c:0x8a6a2a,lash:true}, brows:{style:'thin',c:0x3a2418}, nose:'button', mouth:'smile', freckles:true, paint:{type:'stripes',c:0xc03020,n:2}},
  hat:{type:'band',c:0x8a2a1a},
  weapon:staff('crystal',0x8affe0), fx:0x8affe0,
  dress(R,C){ const b=C.b, hm=LAB.MT(hairT(0x3a2418),{soft:true}), hd=M(0x2a180e,{soft:true});
    GB.braid(R.head,[[.13,.14,-.02],[.17,.0,.06],[.17,-.16,.12],[.14,-.32,.15],[.11,-.5,.15]],.052,.032,[hm,hd],11);
    add(R.head,G.cyl(.03,.03,.04,8),M(0xc03020),.11,-.53,.15);
    add(R.head,G.sph(.14,12,8),hm,0,.2,-.09).scale.set(1.05,1,.9);
    GB.fringe(R.hips,{n:20,r:b.hp*1.15,y:.06,dz:.9,len:.09,mat:0x2e5022});
    for(const n of ['L','R']) GB.fringe(R['arm'+n],{n:9,r:b.ar*1.5,y:-.2,len:.08,mat:0x2e5022});
    GB.necklace(R,C,{c:0xe8e0c8,c2:0xc03020,n:9,drop:.05});
    GB.belt(R,C,{mat:0x4a3020,w:.025,buckle:0x2aa8a0,bw:.05,bh:.05,items:[{t:'knife',a:1.35},{t:'pouch',a:-1.4,c:0x8a6a44}]}); }},

/* 17. the warchief: huge, hunched and wide-legged, small head with a topknot, heavy brow and tusks, bone-and-skull pauldrons,
       scarred painted chest, harness, shaggy black fur kilt, skull buckle, fang necklace */
orc_m:{name:'Orc', muscle:true, scale:1.24, bodyW:1.36, shK:1.18, armK:1.35, legW:1.2, legK:.92, headK:1.12, headS:[1.14,.94,1.02], neckLen:-.03, skin:ORC,
  ears:'orc', tusks:.13, jaw:{w:1.2}, brow:true,
  stance:{torsoX:.2,headX:-.22,armLZ:.22,armRZ:-.14,kneeL:.12,kneeR:.12,hipsY:-.03}, gait:{stride:.85,bounce:1.6,sway:.05,lift:.8},
  top:F(64,32,{c:ORC,soft:false,custom:P=>{ const s=0x9ac070, r=0x8a1a10; P.line(-8,8,-2,16,s); P.line(6,6,10,14,s); P.line(-4,20,4,22,s); for(let i=-3;i<=3;i++){ P.px(i*2,4,r); P.px(i*2+1,5,r); } }}),
  sleeve:'bare', armSkin:armT(ORC,0x7a1a10,{rows:[20,21]}), skirt:'none', belt:false, legs:0x3a2e24, boot:0x3a2618, bootTall:true, bracers:0x4a2e1a, straps:0x4a2e1a,
  fp:{eyes:{style:'narrow',c:0xe02a10}, brows:{style:'heavy',c:0x1a1a10}, nose:'broad', mouth:'tusk', paint:{type:'band',c:0x6a1a10}, scar:{at:'far',c:0x9ac070}},
  hat:{type:'topknot',c:0x1e1e16,ring:0xe8e0c8},
  weapon:staff('bone',0xe8f0a0,0x5a3a22), fx:0xd8f08a,
  dress(R,C){ const b=C.b;
    GB.pauldron(R,C,{style:'bone',mat:0xcfc2a2,mat2:0xa8987a,size:.85,arm:true});
    GB.skirt(R,C,{pts:GB.prof(C,.44,.36),mat:furT(0x2a2620,0x1a1814),folds:12,amp:.035,hem:GB.tatter(.08,6)});
    GB.belt(R,C,{mat:0x3a2416,w:.055,rk:1.25,items:[{t:'skull',a:0,c:0xe8e0c8},{t:'bone',a:1.2},{t:'pouch',a:-1.3,c:0x4a3020}]});
    GB.necklace(R,C,{t:'teeth',n:9,drop:.09,c:0xf0e8d8});
    for(let i=0;i<5;i++) add(R.torso,G.cone(.03,.16,5),M(0xe8dcc0),0,.48-i*.09,-b.ch*C.dz-.03,-PI/2-.5); }},

/* 18. the huntress: tall and powerful, wild mane with bones and feathers, small tusks, white stripe paint, leather bandeau and
       harness, single fur pauldron, short loincloth with fur trim over leather shorts, black fur boots */
orc_f:{name:'Orc', fem:true, muscle:true, scale:1.12, bodyW:1.08, shK:1.1, armK:1.15, legK:1.08, headK:1.18, skin:ORC, ears:'orc', tusks:.07,
  stance:{torsoX:.04,torsoZ:.045}, gait:{stride:1.15},
  top:'skin', bra:F(64,32,{c:0x3a2416,mottle:[0x2e1c10,.2],rows:[{y0:4,y1:6,c:0xe8dcc0}]}), braCup:0x3a2416, sleeve:'bare', armSkin:armT(ORC,0xf0f0e8,{rows:[6,8,22]}),
  skirt:'none', belt:false, legs:'skin', shorts:0x2a1e14, shortsLen:.3, boot:0x1a1612, bootTall:true, shoe:{type:'fur',c2:0x1a1612}, bracers:0x3a2416, straps:0x3a2416, strap1:true,
  hair:{c:0x6a2a1a,style:'savage',len:.5,tex:hairT(0x6a2a1a)},
  fp:{eyes:{style:'narrow',c:0xe0a020}, brows:{style:'angry',c:0x4a1a10}, nose:'small', mouth:'tusk', paint:[{type:'stripes',c:0xf0f0e8,n:2},{type:'chin',c:0xf0f0e8}]},
  weapon:staff('bone',0xe8f0a0,0x5a3a22), fx:0xd8f08a,
  dress(R,C){ const b=C.b;
    GB.pauldron(R,C,{sides:[1],style:'fur',mat:0x2a2420,mat2:0x4a4038,size:.95,arm:true});
    for(const [z,rx] of [[1,-.1],[-1,.1]]) add(R.hips,G.cloth(.2,.34,1.1,1,.01,.02),LAB.MT(F(32,32,{c:0x4a3020,mottle:[0x3a2416,.2],rows:[{y0:28,y1:32,c:0x1a1612}]}),{soft:true,side:LAB.DS}),0,-.14,z*(b.hp*.8+.02),rx);
    GB.belt(R,C,{mat:0x2a1e14,w:.035,rk:1.18,items:[{t:'knife',a:1.3},{t:'bone',a:-1.2}]});
    GB.necklace(R,C,{t:'claws',n:7,drop:.07});
    for(const s of [1,-1]) add(R.head,G.leaf(.035,.16),M(s>0?0xf0e6d0:0x3a2418,{soft:true}),.16*s,.26,-.06,-.4,0,-s*.8); }},
};
/* signature pieces: one element per look that nobody else carries */
const SIG={
  // a spellbook that floats open at her side, pages glowing, bobbing with the idle
  human_f(R,C){ const g=grp(R.fig,.46,1.3,.14), bk=grp(g); bk.rotation.set(-.55,-.5,0); bk.scale.setScalar(1.6); add(g,G.ico(.07,1),M(0x8fd8ff,{glow:true}),0,-.12,0).scale.set(1,.3,1);
    for(const s of [1,-1]){ const pg=grp(bk); pg.rotation.z=s*.32; add(pg,G.box(.15,.012,.2),M(0x1a2c66),s*.075,-.012,0); add(pg,G.box(.14,.012,.19),M(0xf4ecd8),s*.072,0,0);
      for(let i=0;i<3;i++) add(pg,G.box(.08,.004,.012),M(0x8fd8ff,{glow:true}),s*.075,.008,-.05+i*.05); }
    add(bk,G.oct(.03),M(0x8fd8ff,{glow:true}),0,.08,0);
    (R.anim=R.anim||[]).push((R,P)=>{ g.position.y=1.3+.04*Math.sin(P.t*PI*2)+.12*(P.orb||0); bk.rotation.y=-.5+.2*Math.sin(P.t*PI*2); }); },
  // a sheathed elven blade at the left hip and broad leaf pauldrons
  elf_m(R,C){ const b=C.b, g=grp(R.hips,b.hp*1.15,.02,.06); g.rotation.set(-.55,0,.32);
    add(g,G.box(.045,.62,.03),M(0x174f3a),0,-.3,0); for(const y of [-.05,-.3,-.58]) add(g,G.box(.052,.03,.036),M(0xe8c860,{metal:.8}),0,y,0); add(g,G.cone(.026,.06,4),M(0xe8c860,{metal:.8}),0,-.63,0,PI);
    add(g,G.box(.16,.025,.04),M(0xe8c860,{metal:.85}),0,.02,0); add(g,G.cyl(.016,.016,.13,6),M(0x2a1a10),0,.1,0); add(g,G.oct(.025),M(0x6ff0a4,{glow:true}),0,.18,0);
    GB.pauldron(R,C,{style:'leaf',mat:0xd8dce8,mat2:0xe8c860,metal:.7,size:1.55}); },
  // fireflies drifting round her
  elf_f(R,C){ const ff=grp(R.fig); const pts=[[.45,1.6,.1],[-.42,1.3,.2],[.38,.85,.25],[-.32,1.95,-.1],[.18,2.2,.15],[-.45,.7,.1],[.5,1.25,-.15]];
    pts.forEach((p,i)=>{ add(ff,G.oct(.045),M(i%2?0xd8ff8a:0xfff4a0,{glow:true}),...p); });
    (R.anim=R.anim||[]).push((R,P)=>ff.children.forEach((f,i)=>{ const p=pts[i], a=P.t*PI*2+i*1.3; f.position.set(p[0]+.05*Math.cos(a),p[1]+.06*Math.sin(a*1.3),p[2]); })); },
  // a round rune shield slung on her back
  dwarf_f(R,C){ const b=C.b, g=grp(R.torso,0,.3,-b.ch*C.dz-.07); g.rotation.set(.12,0,.2);
    add(g,G.cyl(.27,.27,.04,20),LAB.MT(F(64,32,{c:0x7a3a24,custom:P=>{ for(let x=0;x<64;x++) for(const y of [8,16,24]) P.px(x,y,0x4a2014); }}),{}),0,0,0,PI/2);
    add(g,G.tor(.27,.025,5,22),M(0x8a929c,{metal:.9}),0,0,-.01); add(g,G.sph(.07,10,8),M(0xd8b048,{metal:.9}),0,0,-.03).scale.set(1,1,.6);
    for(const [x,y] of [[0,.15],[.06,.12],[0,.08],[-.06,.04]]) add(g,G.box(.03,.03,.01),M(0xff8a3a,{glow:true}),x,y-.02,-.03); },
  // a raven perched on her left shoulder, eye lit green
  necro_f(R,C){ const b=C.b, g=grp(R.armL,b.ar*.5,b.ar*1.4,.07); g.scale.setScalar(1.35); g.rotation.y=.5; const _=0, k=M(0x14121a), k2=M(0x24202e);
    add(g,G.sph(.075,10,8),k,0,.06,0).scale.set(.85,.8,1.35); add(g,G.sph(.05,8,6),k,0,.13,.08); add(g,G.cone(.022,.08,5),M(0x5a5860),0,.12,.15,PI/2);
    add(g,G.box(.07,.012,.14),k2,0,.04,-.13,.4); for(const s of [1,-1]) add(g,G.leaf(.05,.16),k2,.05*s,.06,-.02,-PI/2+.2,0,0).scale.set(1,1,.5);
    add(g,G.sph(.012,4,3),M(0x9affb0,{glow:true}),.03,.145,.11); add(g,G.sph(.012,4,3),M(0x9affb0,{glow:true}),-.03,.145,.11); },
  // feathers hang from her arms like folded wings and spread when she raises them
  shaman_f(R,C){ const b=C.b, fm=[0xf4ecdc,0xe8dcc8].map(c=>M(c,{soft:true})), tip=M(0x3a2418,{soft:true});
    for(const n of ['L','R']){ const s=n==='L'?1:-1; for(const [par,cnt,y0,L0] of [[R['arm'+n],4,-.04,.16],[R['elbow'+n],5,-.02,.22]]) for(let i=0;i<cnt;i++){
      const f=grp(par,s*b.ar*1.05,y0-i*.06,-.02); f.rotation.set(0,0,PI+s*.12); const L=L0+i*.03; add(f,G.leaf(.05,L),fm[i%2],0,0,0).scale.set(1,1,1.6); add(f,G.leaf(.052,L*.22),tip,0,L*.79,.001).scale.set(1,1,1.7); } } },
  // a longbow across her back; a bandana with trailing tails instead of a feather
  ranger_f(R,C){ const b=C.b, g=grp(R.torso,0,.28,-b.ch*C.dz-.1); g.rotation.set(0,0,-.55); const bow=LAB.weapon({kind:'recurve',wood:M(0x6a4428),wrap:M(0x2e5022),tips:M(0xd8c8a0)}); bow.scale.setScalar(.85); bow.position.y=-.55; g.add(bow);
    for(const s of [1,-1]) add(R.head,G.cloth(.045,.2,1.2,1,.01,.012),M(0x8a2a1a,{soft:true}),.05*s,.16,-.17,.5,0,s*.3); },
  // a sabre-tooth pelt over her shoulders, fangs hanging on the chest
  orc_f(R,C){ const b=C.b; GB.capelet(R,C,{mat:F(64,32,{c:0xc87a2a,custom:P=>{ for(let x=0;x<64;x+=6) for(let y=0;y<32;y++) if(((x+Math.round(y*.7))%12)<2) P.px(x+Math.round(Math.sin(y*.5)),y,0x1a120c); },rows:[{y0:0,y1:3,c:0xe8d8b8}]}),len:.2,flare:1.32,gap:.9,hem:GB.tatter(.05,9),folds:8});
    for(const s of [1,-1]) add(R.torso,G.cone(.03,.2,6),M(0xf4ecd8),b.sh*.42*s,.38,b.ch*C.dz+.07,PI+.15*s); },
};
// dress() reads its own textures through C.o
for(const id in P){ const s=P[id]; if(s.dress){ const d=s.dress; s.dress=(R,C)=>{ C=Object.assign(C,{o:s}); d(R,C); if(SIG[id]) SIG[id](R,C); }; } }
LAB.PLAYERS=P;
for(const id in P) LAB.ROSTER.push({id, group:'Player characters', name:P[id].name+(P[id].fem?' (woman)':' (man)'), ref:'look:'+id, cell:128,
  views:[{name:'back',yaw:Math.PI-.42},{name:'front',yaw:.38}], moves:['idle','walk','cast','attack','hurt'], kind:'humanoid', spec:P[id]});
})();
