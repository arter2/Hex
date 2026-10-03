/* Weapons: one builder for every held item. The grip sits at the origin and the item points up +y,
   so characters hold the same models the weapon icons show. */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI;
const EL={fire:0xff7a2a, frost:0x8fdcff, storm:0xffe45a, shadow:0xa77aff, light:0xffe9a0, verdant:0x6ff0a4};
LAB.EL=EL;
const WOOD=M(0x8e5c33), DWOOD=M(0x5e3a22), PALE=M(0xd8c39a), GOLD=M(0xe2b850,{metal:.9}), SILVER=M(0xc9d2dc,{metal:1}),
  IRON=M(0x7d8792,{metal:.8}), DARK=M(0x2c2533), LEATHER=M(0x6b3f24), BONE=M(0xe8dcc0), STRING=M(0xeee6d0);
LAB.WM={WOOD,DWOOD,PALE,GOLD,SILVER,IRON,DARK,LEATHER,BONE};
const glow=c=>M(c,{glow:true});

// heads sit on top of a shaft at height h
function head(g,type,c,h){ const gm=glow(c), core=glow(0xffffff);
  const H=grp(g,0,h,0); H.userData.gem=true;
  switch(type){
    case 'crystal':{ add(H,G.tor(.075,.018,5,10),GOLD,0,-.02,0,PI/2); const o=add(H,G.oct(.1),gm,0,.12,0); o.scale.set(1,1.6,1); add(H,G.oct(.04),core,0,.12,.04);
      add(H,G.cone(.035,.16,5),GOLD,.07,.02,0,0,0,-.7); add(H,G.cone(.035,.16,5),GOLD,-.07,.02,0,0,0,.7); break; }
    case 'leaf':{ add(H,G.tor(.075,.018,5,10),GOLD,0,-.02,0,PI/2); const o=add(H,G.oct(.1),gm,0,.12,0); o.scale.set(1,1.6,1); add(H,G.oct(.04),core,0,.12,.04);
      add(H,G.cone(.045,.2,5),M(0x5fd08a),.09,0,0,0,0,-1); add(H,G.cone(.045,.2,5),M(0x5fd08a),-.09,0,0,0,0,1); break; }
    case 'orb':{ add(H,G.tor(.11,.018,5,12),GOLD,0,.1,0); add(H,G.tor(.11,.018,5,12),GOLD,0,.1,0,0,PI/2); add(H,G.sph(.085,10,8),gm,0,.1,0); add(H,G.sph(.035,6,5),core,-.02,.12,.06); break; }
    case 'flame':{ add(H,G.cyl(.06,.03,.08,6),IRON,0,0,0); for(let i=0;i<4;i++) add(H,G.cone(.025,.12,4),IRON,Math.sin(i*PI/2)*.06,.06,Math.cos(i*PI/2)*.06,Math.cos(i*PI/2)*.5,0,-Math.sin(i*PI/2)*.5);
      const f=[glow(0xc8280e),glow(c),glow(0xffa040),glow(0xffe08a),glow(0xfff8e0)]; add(H,G.cone(.13,.42,8),f[1],0,.22,0); add(H,G.cone(.1,.3,7),f[2],0,.18,.02); add(H,G.cone(.06,.2,6),f[3],0,.13,.04); add(H,G.sph(.035,6,5),f[4],0,.1,.05);
      for(let i=0;i<5;i++){ const a=i/5*PI*2; add(H,G.cone(.05,.2+(i%2)*.08,5),i%2?f[0]:f[1],Math.sin(a)*.08,.14,Math.cos(a)*.08,Math.cos(a)*.45,0,-Math.sin(a)*.45); } break; }
    case 'skull':{ add(H,G.sph(.085,10,8),BONE,0,.08,0); add(H,G.box(.09,.05,.08),BONE,0,.01,.02); add(H,G.box(.03,.03,.02),glow(c),.035,.08,.075); add(H,G.box(.03,.03,.02),glow(c),-.035,.08,.075);
      add(H,G.sph(.06,8,6),glow(c),0,.2,-.02); break; }
    case 'ghost':{ add(H,G.tor(.09,.016,5,10),IRON,0,.12,0); add(H,G.tor(.09,.016,5,10),IRON,0,.12,0,0,PI/2); const w=add(H,G.sph(.07,8,6),gm,0,.12,0); w.scale.set(1,1.3,1); add(H,G.cone(.05,.14,6),gm,0,.24,0); break; }
    case 'feather':{ add(H,G.oct(.08),gm,0,.08,0).scale.set(1,1.5,1); for(const s of [1,-1]){ const f=add(H,G.box(.05,.22,.015),M(0xf1ead8),.07*s,-.08,.02,0,0,.35*s); } add(H,G.sph(.03,5,4),M(0xc8463a),0,-.04,.05); break; }
    case 'antler':{ for(const s of [1,-1]) add(H,G.tube([[0,0,0],[.08*s,.12,0],[.12*s,.26,0],[.06*s,.34,0]],.025,.01,8,5),BONE,0,0,0); add(H,G.sph(.06,8,6),gm,0,.12,0); break; }
    case 'prism':{ add(H,G.cyl(.06,.05,.03,10),SILVER,0,0,0); add(H,G.cyl(.075,.075,.012,14),M(0xbff4ff,{metal:.9}),0,.025,0);
      const o=add(H,G.oct(1),gm,0,.2,0); o.scale.set(.05,.17,.05); o.rotation.y=PI/4; add(H,G.oct(1),core,0,.2,.012).scale.set(.02,.08,.02);
      for(let i=0;i<3;i++){ const a=i/3*PI*2; add(H,G.tube([[Math.sin(a)*.05,.02,Math.cos(a)*.05],[Math.sin(a)*.08,.12,Math.cos(a)*.08],[Math.sin(a)*.045,.24,Math.cos(a)*.045]],.014,.006,8,4),SILVER,0,0,0); } break; }
    case 'star':{ add(H,G.tor(.13,.02,5,14),GOLD,0,.13,0); const s=add(H,G.oct(.13),gm,0,.13,0); s.scale.set(1,1.4,.7); add(H,G.oct(.05),core,0,.14,.05);
      for(let i=0;i<4;i++) add(H,G.cone(.03,.12,4),GOLD,Math.cos(i*PI/2)*.17,.13+Math.sin(i*PI/2)*.17,0,0,0,i*PI/2-PI/2); break; }
    case 'rune':{ for(let i=0;i<3;i++) add(H,G.tor(.04,.014,4,10),glow(c),0,-.25-i*.12,0,PI/2); add(H,G.cyl(.06,.035,.16,6),M(0x6b6f7a),0,.08,0); add(H,G.oct(.065),gm,0,.22,0).scale.set(1,1.5,1); break; }
    case 'knot':{ add(H,G.rock(.08,3,.25,0),WOOD,0,.04,0); add(H,G.tor(.06,.018,4,8),WOOD,.03,.1,0,0,.4,0); break; }
    case 'icicle':{ const ic=M(0xd8f4ff,{metal:.8}); const o=add(H,G.oct(1),gm,0,.2,0); o.scale.set(.07,.24,.07); for(const s of [1,-1]){ const p=add(H,G.oct(1),ic,.07*s,.1,0,0,0,-.4*s); p.scale.set(.035,.13,.035); }
      for(let i=0;i<3;i++){ const d=add(H,G.oct(1),ic,(i-1)*.05,-.08,.02); d.scale.set(.025,.09,.025); } break; }
    case 'bone':{ add(H,G.sph(.07,8,6),BONE,0,.06,0); add(H,G.cone(.025,.14,5),BONE,.05,.14,0,0,0,-.4); add(H,G.cone(.025,.14,5),BONE,-.05,.14,0,0,0,.4); add(H,G.sph(.04,6,5),glow(c),0,.07,.05); break; }
  } return H; }

/* spec: {kind, wood, head, c, len} for staffs; other kinds take their own fields */
const SPIRAL=()=>LAB.MT(LAB.fabric(32,32,{c:0x4a2a18,soft:false,custom:P=>{ for(let y=0;y<32;y++) for(let x=0;x<32;x++){ const k=(x+y*2)%8; if(k<2) P.px(x,y,0x7a4a28); else if(k===2) P.px(x,y,0x2a160c); } }}));
LAB.weapon=function(spec){ const g=grp(null), k=spec.kind, w=spec.wood==='spiral'?SPIRAL():spec.wood||WOOD, c=spec.c||EL.verdant;
  if(k==='staff'){ const L=spec.len||1.7, lo=-.65; add(g,G.cyl(.024,.03,L,6),w,0,lo+L/2,0);
    if(spec.wrap) add(g,G.cyl(.034,.034,.16,6),spec.wrap,0,.05,0);
    if(spec.bands) for(let i=0;i<spec.bands.n;i++) add(g,G.cyl(.033,.033,.03,6),spec.bands.m,0,lo+L-.12-i*.18,0);
    g.userData.top=lo+L; g.userData.gemAt=lo+L+.12; head(g,spec.head||'crystal',c,lo+L); }
  else if(k==='wand'){ const L=spec.len||.5; add(g,G.cyl(.016,.026,L,6),w,0,L/2-.08,0);
    if(spec.grip) add(g,G.cyl(.03,.03,.14,6),spec.grip,0,0,0);
    if(spec.bands) for(let i=0;i<spec.bands.n;i++) add(g,G.cyl(.024,.024,.022,6),spec.bands.m,0,.12+i*.09,0);
    const top=L-.08; g.userData.top=top; g.userData.gemAt=top+.04;
    if(spec.pommel) add(g,G.sph(.032,8,6),M(0xf4ead0),0,-.15,0);
    if(spec.carved){ add(g,G.lathe([[.001,-.14],[.036,-.13],[.04,-.09],[.03,-.06],[.036,-.02],[.03,.04],[.034,.08],[.026,.11]],10),spec.grip||w,0,0,0); for(const y of [-.06,.02,.09]) add(g,G.tor(.033,.008,4,10),spec.ring||GOLD,0,y,0,PI/2); }
    if(spec.broken){ for(let i=0;i<5;i++) add(g,G.cone(.008,.05+(i%2)*.03,3),w,(i-2)*.007,top+.0,(i%2)*.006,0,0,(i-2)*.25);
      add(g,G.tube([[.01,top-.02,0],[.06,top-.1,.02],[.08,top-.2,.01]],.008,.004,6,3),w,0,0,0); add(g,G.box(.006,.18,.012),M(0x2a1a0e),.012,top-.2,.016);
      if(spec.c){ const H=grp(g,0,top+.04,0); H.userData.gem=true; for(let i=0;i<3;i++) add(H,G.oct(.014),glow(i?spec.c:0xffffff),(i-1)*.03,(i%2)*.03,0); } }
    else if(spec.tip==='ivory'){ add(g,G.cyl(.014,.016,.08,6),M(0xf4ead0),0,top-.02,0); add(g,G.sph(.02,6,5),glow(spec.c||0xfff2c8),0,top+.03,0); }
    else if(spec.tip==='icicle'){ const ic=M(0xe0f6ff,{metal:.8,facet:true}); const s=add(g,G.oct(1),ic,0,top+.05,0); s.scale.set(.03,.12,.03); for(const q of [1,-1]){ const t=add(g,G.oct(1),ic,.02*q,top-.06,0,0,0,-.6*q); t.scale.set(.016,.06,.016); } const H=grp(g,0,top+.06,0); H.userData.gem=true; add(H,G.oct(.022),glow(spec.c),0,0,0).scale.set(1,1.8,1); }
    else if(spec.tip==='sunburst'){ add(g,G.tor(.05,.012,4,10),GOLD,0,top+.06,0); const H=grp(g,0,top+.06,0); H.userData.gem=true; add(H,G.sph(.05,8,6),glow(spec.c),0,0,0); add(H,G.sph(.025,6,5),glow(0xffffff),0,0,.02);
      for(let i=0;i<8;i++) add(H,G.cone(.014,.08,3),glow(i%2?spec.c:0xffffff),Math.cos(i*PI/4)*.085,Math.sin(i*PI/4)*.085,0,0,0,i*PI/4-PI/2); for(let i=0;i<6;i++) add(g,G.cone(.012,.05,3),GOLD,Math.cos(i*PI/3)*.07,top+.06+Math.sin(i*PI/3)*.07,-.01,0,0,i*PI/3-PI/2); }
    else if(spec.tip==='sun'){ add(g,G.tor(.05,.012,4,10),GOLD,0,top+.06,0); add(g,G.sph(.035,8,6),glow(c),0,top+.06,0); for(let i=0;i<6;i++) add(g,G.cone(.012,.05,3),GOLD,Math.cos(i*PI/3)*.07,top+.06+Math.sin(i*PI/3)*.07,0,0,0,i*PI/3-PI/2); }
    else if(spec.tip==='moon'){ add(g,G.tor(.05,.016,5,10,PI*1.3),glow(c),0,top+.06,0,0,0,-.2); add(g,G.sph(.018,5,4),glow(0xffffff),.01,top+.06,.01); }
    else if(spec.tip==='spark'){ for(let i=0;i<3;i++) add(g,G.tor(.03,.008,4,8),M(0xc87a3a,{metal:.8}),0,top-.1+i*.04,0,PI/2); const s=add(g,G.oct(.045),glow(c),0,top+.05,0); s.scale.set(.8,1.5,.8); }
    else if(spec.tip==='ice'){ const s=add(g,G.oct(.04),glow(c),0,top+.07,0); s.scale.set(.7,2.4,.7); }
    else if(spec.tip==='scepter'){ add(g,G.cyl(.05,.02,.08,6),GOLD,0,top,0); const s=add(g,G.oct(.06),glow(c),0,top+.09,0); s.scale.set(1,1.5,1); add(g,G.tor(.06,.012,4,10),GOLD,0,top+.09,0,0,PI/2); }
    else if(spec.tip==='leaf'){ add(g,G.cone(.03,.12,5),M(0x5fd08a),.04,top-.02,0,0,0,-1); add(g,G.sph(.025,6,5),glow(c),0,top+.02,0); }
    else add(g,G.sph(.025,6,5),glow(c),0,top+.02,0); }
  else if(k==='bow'){ const lim=spec.wood||PALE, R=.55;
    add(g,G.tor(R,.022,5,18,PI*.62),lim,-R*.82,0,0,0,0,-PI*.31); add(g,G.cyl(.03,.03,.16,6),LEATHER,0,0,0);
    const a=PI*.31, tx=-R*.82+R*Math.cos(a), ty=R*Math.sin(a); add(g,G.cyl(.006,.006,ty*2,3),STRING,tx,0,0);
    if(spec.tips) for(const s of [1,-1]) add(g,G.cone(.03,.08,5),spec.tips,tx+.01,ty*s,0,0,0,s>0?0:PI);
    if(spec.leaves) for(const s of [1,-1]) add(g,G.cone(.035,.14,5),M(0x5fd08a),.05,.3*s,0,0,0,-.8*s);
    if(spec.c) add(g,G.sph(.03,6,5),glow(spec.c),.035,0,0);
    g.userData.top=ty; g.userData.gemAt=.1; }
  else if(k==='spear'){ const L=spec.len||1.8; add(g,G.cyl(.022,.026,L,6),w,0,L/2-.6,0); const top=L-.6;
    if(spec.wrap) add(g,G.cyl(.032,.032,.2,6),spec.wrap,0,.02,0);
    if(spec.trident){ add(g,G.box(.26,.04,.04),spec.metal||GOLD,0,top,0); for(const x of [-.12,0,.12]){ add(g,G.cyl(.016,.016,.24,5),spec.metal||GOLD,x,top+.12,0); add(g,G.cone(.028,.09,4),spec.metal||GOLD,x,top+.28,0); }
      if(spec.c) add(g,G.oct(.05),glow(spec.c),0,top+.05,.03); }
    else if(spec.fang){ add(g,G.tor(.05,.014,4,10),SILVER,0,top,0,PI/2); const f=add(g,G.cone(.07,.42,4),glow(spec.c),0,top+.24,0); f.scale.set(1,1,.45); add(g,G.cone(.04,.16,4),glow(0xeafcff),.07,top+.06,0,0,0,-.9); add(g,G.cone(.04,.16,4),glow(0xeafcff),-.07,top+.06,0,0,0,.9); }
    else { add(g,G.cyl(.03,.024,.06,6),spec.metal||IRON,0,top,0); const b=add(g,G.oct(.08),spec.metal||IRON,0,top+.16,0); b.scale.set(.75,2.3,.25); if(spec.tassel) add(g,G.cone(.04,.12,5),spec.tassel,.03,top-.08,0,0,0,PI); }
    g.userData.top=top+.3; g.userData.gemAt=top+.1; }
  else if(k==='sword'){ const met=spec.metal||SILVER; add(g,G.cyl(.022,.022,.2,6),LEATHER,0,0,0); add(g,G.sph(.035,6,5),spec.guard||GOLD,0,-.12,0);
    add(g,G.box(.26,.04,.06),spec.guard||GOLD,0,.11,0); const b=add(g,G.box(.08,spec.len||.9,.022),met,0,.13+(spec.len||.9)/2,0); add(g,G.cone(.057,.14,4),met,0,.2+(spec.len||.9)+.0,0,0,PI/4).scale.set(1,1,.35);
    if(spec.c) add(g,G.box(.02,(spec.len||.9)*.8,.026),glow(spec.c),0,.15+(spec.len||.9)*.45,0);
    g.userData.top=.2+(spec.len||.9); g.userData.gemAt=.6; }
  else if(k==='axe'){ const L=spec.len||1.3; add(g,G.cyl(.03,.035,L,6),w,0,L/2-.35,0); const top=L-.35;
    for(const s of spec.double?[1,-1]:[1]){ const b=add(g,new THREE.CylinderGeometry(.32,.32,.035,12,1,false,0,PI*.55),spec.metal||IRON,.06*s,top-.15,0,PI/2,0,s>0?PI*.72:-PI*.28); }
    add(g,G.cone(.04,.12,5),spec.metal||IRON,0,top+.06,0); g.userData.top=top; g.userData.gemAt=top-.1; }
  else if(k==='dagger'){ add(g,G.cyl(.018,.018,.12,5),LEATHER,0,0,0); add(g,G.box(.12,.025,.04),spec.guard||IRON,0,.07,0); const b=add(g,G.cone(.04,.36,4),spec.metal||SILVER,0,.26,0); b.scale.set(1,1,.3);
    if(spec.c) add(g,G.box(.012,.2,.03),glow(spec.c),0,.22,0); g.userData.top=.44; g.userData.gemAt=.2; }
  else if(k==='scythe'){ const L=spec.len||1.9; add(g,G.cyl(.022,.026,L,6),w,0,L/2-.6,0); const top=L-.6;
    add(g,G.tube([[0,top,0],[.25,top+.12,0],[.55,top+.02,0],[.7,top-.22,0]],.05,.008,12,4),spec.metal||IRON,0,0,0).scale.set(1,1,.35);
    if(spec.c) add(g,G.sph(.05,6,5),glow(spec.c),0,top,0); g.userData.top=top+.15; g.userData.gemAt=top; }
  else if(k==='banner'){ const L=1.9; add(g,G.cyl(.022,.026,L,6),spec.metal||GOLD,0,L/2-.6,0); const top=L-.6; add(g,G.oct(.05),spec.metal||GOLD,0,top+.06,0).scale.set(1,1.8,1);
    const sx=spec.side||-1; add(g,G.box(.48,.03,.03),spec.metal||GOLD,.22*sx,top-.06,0); add(g,G.cloth(.44,.95,.75,1.5,.03,.02),spec.cloth||M(0x3a62b8),.22*sx,top-.54,0);
    add(g,G.box(.1,.1,.03),GOLD,.22*sx,top-.4,.02,0,0,PI/4); g.userData.top=top; g.userData.gemAt=top; }
  else if(k==='bolt'){ const y=glow(c), wh=glow(0xffffff); const pts=[[0,-.25],[.08,.05],[-.04,.1],[.1,.45],[-.02,.48],[.06,.8]];
    for(let i=1;i<pts.length;i++){ const [x0,y0]=pts[i-1],[x1,y1]=pts[i], L=Math.hypot(x1-x0,y1-y0); LAB.aim(add(g,G.box(.07,L+.04,.05),i%2?y:wh,(x0+x1)/2,(y0+y1)/2,0),x1-x0,y1-y0,0); }
    add(g,G.cone(.06,.16,4),y,.06,.86,0,0,0,-.2); g.userData.top=.85; g.userData.gemAt=.4; }
  else if(k==='saw'){ add(g,G.cyl(.03,.03,.18,6),LEATHER,0,0,0); add(g,G.box(.05,.04,.06),IRON,0,.1,0); const bl=M(0xa8a8a0,{metal:.9}); add(g,G.box(.16,.55,.015),bl,.05,.4,0);
    for(let i=0;i<10;i++) add(g,G.cone(.014,.04,3),bl,-.035,.15+i*.055,0,0,0,PI/2); add(g,G.box(.05,.12,.017),M(0x6a0a0e),.08,.5,0); g.userData.top=.7; g.userData.gemAt=.4; }
  else if(k==='hook'){ add(g,G.cyl(.03,.03,.16,6),LEATHER,0,0,0); add(g,G.tube([[0,.08,0],[0,.35,0],[.12,.48,0],[.2,.38,0],[.16,.26,0]],.025,.012,14,5),M(0x8a8a8a,{metal:.9}),0,0,0); add(g,G.box(.03,.04,.03),M(0x6a0a0e),.16,.3,0); g.userData.top=.5; g.userData.gemAt=.3; }
  else if(k==='branch'){ // a gnarled, twisting branch; wand or staff length; twigs and leaves near the top
    const L=spec.len||1.7, lo=spec.lo==null?-.65:spec.lo, r0=spec.r||.032, pts=[]; LAB.seed(spec.seed||5);
    for(let i=0;i<=10;i++){ const u=i/10; pts.push([Math.sin(u*9+1)*(spec.kink||.035)*(1-u*.3),lo+L*u,Math.cos(u*7)*(spec.kink||.035)*.6]); }
    add(g,G.tube(pts,r0*1.15,r0*.7,40,7),w,0,0,0); for(let i=1;i<10;i+=2){ const p=pts[i]; add(g,G.sph(r0*1.3,6,5),w,p[0],p[1],p[2]).scale.set(1,1.4,1); }
    const top=pts[10]; const lm=[M(0x4fa83a,{soft:true}),M(0x7ad04a,{soft:true}),M(0x2e7a2a,{soft:true})];
    for(let i=0;i<(spec.twigs||4);i++){ const a=i*2.1, y=top[1]-.04-i*.07*L/1.7, len=(.18+.08*(i%2))*L/1.7; add(g,G.tube([[top[0],y,top[2]],[top[0]+Math.sin(a)*len*.6,y+len*.5,Math.cos(a)*len*.5],[top[0]+Math.sin(a)*len,y+len*.85,Math.cos(a)*len*.7]],r0*.55,r0*.2,8,5),w,0,0,0);
      const lf=add(g,G.leaf(.05*L/1.7+.015,.13*L/1.7+.03),lm[i%3],top[0]+Math.sin(a)*len,y+len*.85,Math.cos(a)*len*.7,0,a,Math.sin(a)*.8); lf.userData.gem=true; }
    if(spec.acorn){ const H=grp(g,top[0],top[1]+.03,top[2]); H.userData.gem=true; add(H,G.sph(.042,10,8),glow(spec.c),0,.0,0).scale.set(1,1.35,1); add(H,G.sph(.018,6,5),glow(0xffffff),-.012,.01,.03);
      add(H,G.cap(.05,.5,12,6),M(0x6a4a24),0,.035,0).scale.set(1,.8,1); add(H,G.cyl(.008,.01,.05,5),M(0x4a3018),0,.085,0); }
    else if(spec.c){ const H=grp(g,top[0],top[1]+.03,top[2]); H.userData.gem=true; add(H,G.sph(.06*L/1.7+.02,10,8),glow(spec.c),0,.02,0); add(H,G.sph(.025*L/1.7+.01,6,5),glow(0xffffff),-.01,.03,.03); }
    g.userData.top=top[1]; g.userData.gemAt=top[1]+.04; }
  else if(k==='crossbow'){ // stock along +y, prod across the front, string drawn back to the nut, stirrup, trigger, loaded bolt
    const st=spec.wood||WOOD, met=spec.metal||IRON, dk=spec.dark||DWOOD;
    add(g,G.box(.09,.78,.08),st,0,.18,0); add(g,G.box(.1,.22,.12),st,0,-.22,-.03,.25); add(g,G.box(.03,.1,.04),met,0,.0,-.06,-.4);
    add(g,G.box(.07,.04,.1),met,0,.5,0); const pr=G.tube([[-.42,.46,-.02],[-.24,.53,0],[0,.55,.02],[.24,.53,0],[.42,.46,-.02]],.028,.028,16,6); add(g,pr,met,0,0,0);
    for(const s of [1,-1]) add(g,G.sph(.03,6,5),met,.42*s,.46,-.02);
    add(g,G.tube([[-.42,.46,-.02],[0,.18,.05],[.42,.46,-.02]],.006,.006,8,3),STRING,0,0,0);
    add(g,G.cyl(.012,.012,.42,5),dk,0,.38,.06); add(g,G.cone(.022,.07,4),SILVER,0,.62,.06); for(const s of [1,-1]) add(g,G.leaf(.025,.06),M(0xb5452e),.018*s,.18,.06,0,0,s*.3);
    add(g,G.tor(.06,.012,4,10),met,0,.62,0,0,0,0); add(g,G.box(.1,.04,.1),met,0,.2,.0); add(g,G.box(.1,.035,.09),met,0,-.04,.0);
    if(spec.mag){ const mg=grp(g,0,.32,.12); add(mg,G.box(.11,.38,.12),met,0,0,0); for(let i=0;i<3;i++) add(mg,G.box(.115,.02,.125),M(0x2a2018),0,-.12+i*.12,0); add(mg,G.box(.06,.06,.04),glow(spec.c),0,.1,.065);
      add(g,G.tube([[0,.0,.16],[0,-.2,.3],[0,-.38,.32]],.018,.016,8,5),met,0,0,0); add(g,G.sph(.03,6,5),met,0,-.38,.32);
      for(let i=0;i<3;i++) add(g,G.tor(.03,.008,4,8),glow(spec.c),0,.5+i*.035,.06,PI/2); add(g,G.oct(.035),glow(spec.c),0,.63,.06); }
    g.userData.top=.6; g.userData.gemAt=.3; }
  else if(k==='trident2'){ // elegant gold trident: tall centre blade, outer prongs sweeping out and up, scale bands
    const L=spec.len||1.9, top=L-.6, gm=spec.metal||GOLD; add(g,G.cyl(.024,.028,L,8),w,0,L/2-.6,0);
    for(let i=0;i<4;i++) add(g,G.cyl(.034,.034,.035,8),gm,0,top-.1-i*.14,0); add(g,G.sph(.04,8,6),gm,0,-.62,0);
    add(g,G.lathe([[.03,0],[.07,.05],[.05,.1],[.03,.13]],10),gm,0,top-.02,0);
    const bl=add(g,G.oct(1),gm,0,top+.33,0); bl.scale.set(.05,.26,.018); add(g,G.cone(.025,.08,4),gm,0,top+.12,0,PI);
    for(const s of [1,-1]){ add(g,G.tube([[0,top+.07,0],[.14*s,top+.07,0],[.18*s,top+.2,0],[.16*s,top+.4,0]],.022,.012,12,5),gm,0,0,0); const p=add(g,G.oct(1),gm,.155*s,top+.45,0,0,0,.08*s); p.scale.set(.03,.1,.012);
      add(g,G.cone(.018,.06,4),gm,.19*s,top+.24,0,0,0,-s*1.2); }
    const H=grp(g,0,top+.07,.03); H.userData.gem=true; add(H,G.oct(.045),glow(spec.c||0x6ff0e0),0,0,0).scale.set(1,1.3,.6);
    g.userData.top=top+.6; g.userData.gemAt=top+.07; }
  else if(k==='fang2'){ // a scepter whose head is a jagged crystal of ice
    const L=spec.len||1.6, top=L-.6, ice=M(0xd8f4ff,{metal:.8,facet:true}), ice2=M(0x8fd0f4,{metal:.6,facet:true});
    add(g,G.cyl(.024,.028,L,6),w,0,L/2-.6,0); for(let i=0;i<5;i++){ const s=add(g,G.oct(1),i%2?ice:ice2,.03*(i%2?1:-1),top-.6+i*.12,0,0,0,(i%2?-.5:.5)); s.scale.set(.025,.07,.025); }
    add(g,G.tor(.05,.014,4,10),SILVER,0,top,0,PI/2); const H=grp(g,0,top,0); H.userData.gem=true;
    add(H,G.tube([[0,0,0],[.02,.14,0],[.07,.3,0],[.15,.42,0],[.24,.46,0]],.075,.006,16,7),ice,0,0,0); add(H,G.tube([[0,.02,.02],[.02,.14,.025],[.07,.28,.02],[.13,.38,.01]],.03,.004,12,5),glow(spec.c||0x8fdcff),0,0,0);
    for(let i=0;i<6;i++){ const a=i/6*PI*2; const t=add(H,G.cone(.016,.08,4),ice2,Math.sin(a)*.06,.02,Math.cos(a)*.06); LAB.aim(t,Math.sin(a)*.5,1,Math.cos(a)*.5); }
    add(H,G.tor(.065,.016,4,12),M(0xe8f8ff,{metal:.9}),0,-.01,0,PI/2);
    g.userData.top=top+.5; g.userData.gemAt=top+.2; }
  else if(k==='rune2'){ // a heavy celtic staff: thick shaft, knotwork bands, carved glowing runes, bound stone head
    const L=spec.len||1.75, lo=-.65, top=lo+L, wd=w, knot=M(0x3a2a18), gl=glow(spec.c||0x7fd4ff), stone=M(0x6a6e78,{facet:true});
    add(g,G.cyl(.042,.05,L,8),wd,0,lo+L/2,0); for(const y of [lo+.25,top-.55]){ add(g,G.tor(.05,.016,5,12),knot,0,y,0,PI/2); add(g,G.tor(.05,.016,5,12),knot,0,y+.05,0,PI/2); for(let i=0;i<6;i++) add(g,G.box(.016,.06,.016),knot,Math.sin(i)*.05,y+.025,Math.cos(i)*.05,0,0,(i%2?.6:-.6)); }
    for(let i=0;i<4;i++){ const y=top-.3-i*.18; add(g,G.box(.02,.07,.012),gl,0,y,.048); add(g,G.box(.04,.012,.012),gl,0,y+(i%2?.02:-.02),.048,0,0,(i%2?.5:-.5)); }
    const H=grp(g,0,top,0); H.userData.gem=true; add(H,G.rock(.13,4,.22,0),stone,0,.13,0).scale.set(1,1.25,1); for(let i=0;i<3;i++) add(H,G.tor(.11-i*.01,.012,4,12),LEATHER,0,.02+i*.06,0,PI/2+.2*(i-1));
    add(H,G.box(.03,.09,.012),gl,0,.15,.13); add(H,G.box(.06,.012,.012),gl,0,.17,.13); add(H,G.box(.02,.05,.012),gl,.06,.1,.115,0,.5,0); add(H,G.box(.02,.05,.012),gl,-.06,.1,.115,0,-.5,0);
    for(const s of [1,-1]) add(g,G.tube([[.05*s,top-.05,0],[.1*s,top+.05,0],[.07*s,top+.18,0]],.018,.008,8,4),wd,0,0,0);
    g.userData.top=top+.25; g.userData.gemAt=top+.15; }
  else if(k==='recurve'){ // an elegant recurve bow: limbs curve back then flick forward at the tips
    const lim=spec.wood||PALE, P=[]; for(let i=0;i<=16;i++){ const u=i/16*2-1, y=u*.62, x=-.2*(1-u*u)+.08*Math.pow(Math.abs(u),6); P.push([x,y,0]); }
    add(g,G.tube(P,.03,.03,40,6),lim,0,0,0); for(const s of [1,-1]) add(g,G.sph(.03,6,5),lim,P[s>0?16:0][0],P[s>0?16:0][1],0);
    add(g,G.cyl(.038,.038,.2,6),spec.wrap||LEATHER,-.2,0,0); add(g,G.cyl(.005,.005,1.2,3),STRING,-.02,0,0);
    if(spec.tips) for(const s of [1,-1]) add(g,G.cone(.03,.1,5),spec.tips,-.0,.62*s,0,0,0,s>0?-.4:PI+.4);
    if(spec.leaves){ const lm=[M(0x3fa84a,{soft:true}),M(0x6ad86a,{soft:true})]; for(const s of [1,-1]) for(let i=0;i<4;i++){ const u=(.25+i*.15)*s, y=u*.62, x=-.2*(1-u*u); const l=add(g,G.leaf(.03,.1),lm[i%2],x-.03,y,.01,0,0,s*(.6+i*.1)+PI*.5); l.userData.gem=true; } }
    if(spec.vine) add(g,G.tube(P.slice(3,14).map(([x,y],i)=>[x-.005+.02*Math.sin(i*1.7),y,.03*Math.cos(i*1.7)]),.01,.01,30,4),M(spec.vine),0,0,0);
    if(spec.c){ const H=grp(g,-.24,0,0); H.userData.gem=true; add(H,G.oct(.04),glow(spec.c),0,0,0).scale.set(1,1.4,.6); }
    g.userData.top=.62; g.userData.gemAt=.1; }
  else if(k==='flask'){ add(g,G.sph(.09,8,6),glow(spec.c||0x9be05a),0,.06,0); add(g,G.cyl(.03,.035,.1,6),M(0xcfe8e0),0,.17,0); add(g,G.cyl(.035,.035,.04,6),LEATHER,0,.23,0); g.userData.top=.25; g.userData.gemAt=.06; }
  else if(k==='chain'){ for(let i=0;i<6;i++) add(g,G.tor(.04,.012,4,8),IRON,0,-.05-i*.07,0,0,i%2?PI/2:0,0); add(g,G.sph(.07,8,6),IRON,0,-.47,0); g.userData.top=0; g.userData.gemAt=0; }
  return g; };

LAB.shield=function(spec){ const g=grp(null);
  if(spec.kind==='round'){ add(g,G.cyl(.3,.3,.05,14),spec.m||WOOD,0,0,0,PI/2); add(g,G.tor(.3,.025,4,16),spec.rim||IRON,0,0,.01); add(g,G.sph(.07,8,6),spec.rim||IRON,0,0,.04); }
  else { add(g,G.trap(.46,.6,.05,.55),spec.m||M(0xe8e4dc,{metal:.4}),0,0,0); add(g,G.box(.06,.5,.06),spec.rim||GOLD,0,0,.02); add(g,G.box(.36,.06,.06),spec.rim||GOLD,0,.12,.02);
    if(spec.c) add(g,G.oct(.05),M(spec.c,{glow:true}),0,.12,.05); }
  return g; };

/* the game's 21 weapons */
LAB.GAME_WEAPONS={
  broken_wand:{name:'Broken Wand', kind:'wand', wood:M(0x7a5232), carved:true, grip:M(0x5a3a22), ring:M(0x9a8a6a,{metal:.6}), broken:true, len:.36, c:0xfff2c8},
  basic_wand:{name:'Basic Wand', kind:'wand', wood:'spiral', carved:true, grip:M(0x3a2214), ring:M(0xf4ead0), tip:'ivory', pommel:true, c:0xfff2c8, len:.6},
  oak_wand:{name:'Oak Wand', kind:'branch', wood:M(0x6e4528), len:.62, lo:-.12, r:.02, kink:.04, twigs:2, c:0xd8ff6a, acorn:true, seed:3},
  quick_wand:{name:'Quick Wand', kind:'wand', wood:PALE, bands:{n:3,m:SILVER}, c:0x9ff4ff},
  ice_wand:{name:'Thin Wand of Ice', kind:'wand', wood:M(0xc8ecff,{metal:.7,facet:true}), carved:true, grip:M(0x9ad4f4,{metal:.6,facet:true}), ring:M(0xe8f8ff,{metal:.9}), tip:'icicle', c:EL.frost, len:.52},
  volt_wand:{name:'Wand of Electricity', kind:'wand', wood:IRON, tip:'spark', c:EL.storm},
  dark_wand:{name:'Wand of Darkness', kind:'wand', wood:DARK, grip:M(0x4a2a5a), tip:'moon', c:EL.shadow},
  light_wand:{name:'Wand of Light', kind:'wand', wood:M(0xf3ead6), grip:GOLD, tip:'sunburst', c:EL.light},
  focus_rod:{name:'Focus Rod', kind:'staff', wood:SILVER, wrap:M(0x2a3a4a), head:'prism', c:0x7fe8ff, len:1.45},
  storm_scepter:{name:'Storm Scepter', kind:'wand', wood:GOLD, tip:'scepter', c:EL.storm, len:.6},
  archmage_staff:{name:"Archmage's Staff", kind:'staff', wood:M(0x4a3a6a), head:'star', c:0x9fe8ff, bands:{n:3,m:GOLD}, len:1.85},
  rune_staff:{name:'Runecarved Staff', kind:'rune2', wood:M(0x6a4a2c), c:0x7fd4ff, len:1.75},
  oak_staff:{name:'Oak Staff', kind:'branch', wood:M(0x6a4428), len:1.8, r:.034, kink:.05, twigs:5, c:0x9affb0, seed:8},
  elven_bow:{name:'Elven Bow', kind:'recurve', wood:M(0xf0e2c0), wrap:M(0x2e8a4a), tips:GOLD, leaves:true, vine:0x2e8a4a, c:EL.verdant},
  ashwood_bow:{name:'Ashwood Bow', kind:'bow', wood:M(0x9ab07a), leaves:true, c:EL.verdant},
  iron_crossbow:{name:'Iron Crossbow', kind:'crossbow', wood:M(0x7a4e2c), metal:M(0x6a727c,{metal:.9})},
  thunder_repeater:{name:'Thunderbolt Repeater', kind:'crossbow', wood:M(0x3b3346), metal:M(0xb08a3a,{metal:.9}), mag:true, c:EL.storm},
  hunter_spear:{name:"Hunter's Spear", kind:'spear', wrap:LEATHER, tassel:M(0xb5452e)},
  storm_trident:{name:'Storm Trident', kind:'trident2', wood:M(0x2a5a6a), metal:M(0xe8c050,{metal:1}), c:0x6ff0e0, len:2.0},
  first_flame:{name:'Staff of the First Flame', kind:'staff', wood:M(0x3a1d14), head:'flame', c:0xff6a1a, bands:{n:2,m:GOLD}, len:1.85, legendary:true},
  frostfang:{name:'Frostfang Scepter', kind:'fang2', wood:M(0xbfe6f8,{metal:.6,facet:true}), c:EL.frost, len:1.6, legendary:true},
};
})();
