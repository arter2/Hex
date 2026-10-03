/* Humanoid kit: one skeleton, dressed by parameters (race, robe, hat, hair, armour, weapon).
   Player races, humanoid enemies, heroes and several minibosses all come from this. */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI, T=THREE;
const shade=(hex,k)=>{ const c=new T.Color(hex); c.multiplyScalar(k); return c.getHex(); };
LAB.shadeHex=shade;

LAB.humanoid=function(o){
  const R={}, root=grp(null); R.root=root;
  const fig=grp(root); fig.scale.setScalar(o.scale||1); R.fig=fig;
  const W=o.bodyW||1, fem=!!o.fem;
  const skin=M(o.skin||0xf3d0aa), robe=M(o.robe||0x3a62b8,{soft:true}), robe2=M(o.robe||0x3a62b8,{soft:true,side:T.DoubleSide}),
    robeDk=M(o.robeDk||shade(o.robe||0x3a62b8,.7),{soft:true}), trim=M(o.trim||0xe0bd62,{metal:o.trimMetal==null?.5:o.trimMetal}),
    belt=M(o.belt||0x7c4b2b), boot=M(o.boot||0x5a3624), legs=M(o.legs||o.robeDk||shade(o.robe||0x3a62b8,.6),{soft:true}),
    cape=o.cape?M(o.cape,{soft:true}):null, hairM=o.hair?M(o.hair.c,{soft:true}):null, armor=o.armor?M(o.armor.c,{metal:o.armor.metal==null?.8:o.armor.metal}):null,
    armor2=o.armor?M(o.armor.c2||shade(o.armor.c,.7),{metal:.7}):null;
  // the body hangs from the hips
  R.hips=grp(fig,0,.95,0);
  const legR=fem?.11:.13;
  if(!o.float) for(const s of [1,-1]){ const n=s>0?'L':'R';
    const leg=grp(R.hips,legR*s*W,0,0); add(leg,G.cyl(.08*W,.068*W,.46,8),armor&&o.armor.legs?armor:legs,0,-.23,0);
    const knee=grp(leg,0,-.46,0); add(knee,G.cyl(.068*W,.062*W,.4,8),armor&&o.armor.legs?armor:boot,0,-.2,0);
    add(knee,G.box(.15*W,.09,.26),armor&&o.armor.legs?armor2:boot,0,-.43,.05);
    if(armor&&o.armor.legs) add(knee,G.sph(.075*W,8,6),armor2,0,0,.03);
    R['leg'+n]=leg; R['knee'+n]=knee; }
  // skirt: long robe, short tunic, or a ghost's trailing hem
  R.skirt=grp(R.hips);
  const len=o.float?-.95:o.skirt==='short'?-.36:o.skirt==='none'?0:-.7, wide=(o.skirtW||1)*W;
  if(o.skirt!=='none'){
    const pts=o.float?[[.08,-.98],[.3*wide,-.7],[.26*wide,-.35],[.21*W,-.1],[.19*W,.1]]:[[.36*wide*(o.skirt==='short'?.85:1),len],[.3*wide,len*.62],[.23*W,len*.2],[.19*W,.1]];
    add(R.skirt,G.robe(pts,o.folds||7,o.float?.02:.03),robe2,0,0,0);
    if(!o.float){ const hr=pts[0][0]*1.06; add(R.skirt,G.robe([[hr,len-.005],[hr*.985,len+.065]],o.folds||7,.03),M(o.hem||o.trim||0xc8a26a,{side:T.DoubleSide}),0,0,0); }
    if(o.stripe!==false&&!o.float) add(R.skirt,G.box(.05,Math.abs(len)*1.05,.03),trim,0,len*.45,.255*wide*(o.skirt==='short'?.85:1)+.02,-.25);
    if(o.tabard) add(R.skirt,G.trap(.26*W,Math.abs(len)*.95,.03,1.1),M(o.tabard),0,len*.46,.27*W,-.22);
    if(o.rags){ for(let i=0;i<7;i++){ const a=i/7*PI*2; add(R.skirt,G.cone(.07,.18,4),robeDk,Math.sin(a)*.34*wide,len-.05,Math.cos(a)*.34*wide,PI,0,0); } } }
  // chest
  R.torso=grp(R.hips,0,.05,0);
  add(R.torso,G.cyl((fem?.16:.18)*W,.2*W,.5),armor&&o.armor.chest?armor:robe,0,.25,0);
  add(R.torso,G.tor(.205*W,.036,6,14),belt,0,.02,0,PI/2); add(R.torso,G.box(.08,.07,.03),trim,0,.02,.215*W);
  if(o.belt2) add(R.torso,G.box(.1,.12,.06),M(o.belt2),.15*W,-.04,.13*W,0,-.6,0);   // pouch
  if(armor&&o.armor.chest){ add(R.torso,G.box(.3*W,.3,.08),armor2,0,.3,.14*W); add(R.torso,G.tor(.19*W,.025,4,12),armor2,0,.12,0,PI/2); }
  else add(R.torso,G.box(.05,.32,.03),trim,0,.24,.19*W,-.08);
  if(o.mantle!==false) add(R.torso,G.cone(.31*W,.24,12),M(o.mantle||o.cape||shade(o.robe||0x3a62b8,.75),{soft:true}),0,.49,0);
  if(o.straps) for(const s of [1,-1]){ add(R.torso,G.box(.05,.62,.03),M(o.straps),0,.26,.2*W,0,0,.62*s); add(R.torso,G.box(.05,.62,.03),M(o.straps),0,.26,-.2*W,0,0,.62*s); }
  if(o.pads) for(const s of [1,-1]){ add(R.torso,G.cap(.13*W,.5,10,6),M(o.pads.c,{metal:o.pads.metal||0}),.24*W*s,.46,0,0,0,-.35*s); if(o.pads.spike) add(R.torso,G.cone(.035,.14,5),M(0xd8d0c0),.3*W*s,.55,0,0,0,-.6*s); }
  if(o.fur) add(R.torso,G.tor(.2*W,.07,5,12),M(o.fur,{soft:true}),0,.48,0,PI/2);
  if(cape){ R.cape=grp(R.torso,0,.5,-.15*W); add(R.cape,G.cloth(.42*W,o.capeLen||1.08,1.55,2.5,.05),cape,0,-(o.capeLen||1.08)/2,0); add(R.cape,G.box(.66*W,.06,.035),M(o.hem||0xc8a26a),0,-(o.capeLen||1.08)+.02,-.005); if(o.rags) for(let i=0;i<5;i++) add(R.cape,G.cone(.06,.16,4),cape,(-.26+i*.13)*W,-(o.capeLen||1.08)-.04,0,PI,0,0); }
  if(o.wings){ R.wings=[]; for(const s of [1,-1]){ const w=grp(R.torso,.12*s,.42,-.16); R.wings.push(w);
      const wm=M(o.wings,{soft:true}), wm2=M(shade(o.wings,.86),{soft:true});
      add(w,G.box(.5,.12,.06),wm,s*.25,.12,0,0,0,-s*.5);
      for(let i=0;i<6;i++){ add(w,G.trap(.13,.9-i*.1,.04,.45),i%2?wm2:wm,s*(.12+i*.075),-.2-i*.03,-.02-i*.015,0,0,-s*(.12+i*.07)); } } }
  // head
  R.head=grp(R.torso,0,.5,0); R.head.scale.setScalar(o.headK||1.3);
  const face=o.face||'normal';
  add(R.head,G.sph(.16,12,10),skin,0,.16,0);
  const eyeC=o.eyes||0x1b2a36, eyeG=!!o.eyeGlow;
  for(const s of [1,-1]){
    if(face==='skull'){ add(R.head,G.box(.05,.05,.02),M(0x14101c),.06*s,.16,.148); add(R.head,G.box(.022,.022,.02),M(eyeC,{glow:true}),.06*s,.16,.155); }
    else add(R.head,G.box(.035,.055,.02),M(eyeC,{glow:eyeG}),.06*s,.15,.152);
    if(o.ears==='elf') add(R.head,G.cone(.055,.36,6),skin,.3*s,.19,-.03,0,-.3*s,-s*(PI/2-.38));
    else if(o.ears==='orc') add(R.head,G.cone(.05,.2,5),skin,.21*s,.17,-.02,0,-.3*s,-s*(PI/2-.6));
    else add(R.head,G.sph(.04,6,5),skin,.155*s,.15,0); }
  if(face==='skull'){ add(R.head,G.box(.12,.05,.06),skin,0,.04,.1); add(R.head,G.box(.1,.012,.02),M(0x14101c),0,.06,.135); add(R.head,G.cone(.02,.04,3),M(0x14101c),0,.11,.155,PI/2); }
  if(o.ears==='orc'){ add(R.head,G.box(.2,.08,.12),skin,0,.06,.08); for(const s of [1,-1]) add(R.head,G.cone(.02,.07,4),M(0xf0ead8),.06*s,.12,.15); }
  if(o.nose) add(R.head,G.sph(.04,6,5),M(shade(o.skin||0xf3d0aa,.9)),0,.12,.16);
  if(o.beard){ const bm=M(o.beard.c,{soft:true}), L=o.beard.len||.3; const b=add(R.head,G.cone(.115,L,8),bm,0,.06-L/2,.11,PI); b.scale.set(1,1,.6); add(R.head,G.box(.2,.05,.06),bm,0,.1,.15); }
  if(hairM){ const st=o.hair.style||'long';
    if(st!=='bald') add(R.head,st==='wild'?G.rock(.19,7,.18,1):G.cap(.176,.56),hairM,0,.17,-.01,-.45);
    if(st==='long'||st==='wild'){ const hl=o.hair.len||.44, n=st==='wild'?6:5, hairDk=M(shade(o.hair.c,.82),{soft:true});
      for(let i=0;i<n;i++){ const x=(i/(n-1)-.5)*.27, w=st==='wild'?1.3:1, curl=(i%2?.03:-.02);
        add(R.head,G.tube([[x,.22,-.12],[x*1.15,.08,-.2],[x*1.2*w+curl,-hl*.5+.1,-.22],[x*1.05*w-curl,-hl+.12,-.18]],.06,.022,10,6),i%2?hairDk:hairM,0,0,0); } for(const s of [1,-1]) add(R.head,G.box(.045,.3,.06),hairM,.155*s,.04,-.02); }
    if(st==='braids') for(const s of [1,-1]) for(let i=0;i<5;i++) add(R.head,G.sph(.05,6,5),hairM,.13*s,.04-i*.075,-.08-.02*i);
    if(st==='pony'){ add(R.head,G.tube([[0,.2,-.16],[0,.08,-.26],[0,-.12,-.26],[0,-.3,-.22]],.06,.03,10,6),hairM,0,0,0); }
    if(st==='short') add(R.head,G.box(.26,.14,.08),hairM,0,.08,-.13); }
  // headwear
  const H=o.hat||{type:'none'}, hm=M(H.c||0x34a06c,{soft:true}), band=M(H.band||0xc8a26a);
  R.hat=grp(R.head,0,.29,0);
  if(H.type==='wizard'||H.type==='witch'){ const wb=H.type==='witch'?.38:.33, tall=H.type==='witch'?.5:.4;
    add(R.hat,G.cyl(wb,wb,.03,18),hm,0,0,0); add(R.hat,G.cyl(.18,.195,.08,14),band,0,.055,0);
    if(H.buckle) add(R.hat,G.box(.07,.06,.02),M(0xe2b850,{metal:.9}),0,.055,.19);
    add(R.hat,G.cone(.18,tall,12),hm,0,.04+tall/2+.03,0); R.hatTip=grp(R.hat,0,.04+tall,0); add(R.hatTip,G.cone(.085,.26,8),hm,0,.1,0); }
  else if(H.type==='ranger'){ const b=add(R.hat,G.cone(.36,.1,16),hm,0,.0,0); b.scale.set(1,.6,1); add(R.hat,G.cap(.17,.5,12,6),hm,0,.02,0).scale.set(1,1.15,1); add(R.hat,G.tor(.17,.022,4,14),band,0,.03,0,PI/2);
    if(H.feather) add(R.hat,G.box(.04,.26,.015),M(H.feather),.16,.12,-.05,0,0,-.5); R.hatTip=grp(R.hat,0,.2,0); }
  else if(H.type==='hood'){ R.hat.position.y=0; const h=add(R.head,G.cap(.205,.62),hm,0,.17,-.02,-.55); add(R.head,G.cone(.12,.3,8),hm,0,.2,-.2,-1.2);
    add(R.head,G.tor(.16,.03,5,14,PI),hm,0,.17,.06,0,0,0); R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='helm'){ const hc=M(H.c,{metal:.9}); add(R.hat,G.cap(.205,.62,12,8),hc,0,-.16,0); add(R.hat,G.tor(.2,.025,4,14),hc,0,-.1,0,PI/2);
    add(R.hat,G.box(.24,.22,.07),hc,0,-.17,.15); add(R.hat,G.box(.18,.03,.02),M(H.slit||0x14101c,{glow:!!H.slit}),0,-.13,.19); add(R.hat,G.box(.03,.12,.02),M(H.slit||0x14101c,{glow:!!H.slit}),0,-.19,.19);
    if(H.crest) add(R.hat,G.box(.04,.2,.28),M(H.crest),0,.06,-.02); if(H.spike) add(R.hat,G.cone(.04,.22,6),hc,0,.12,0); if(H.horns) for(const s of [1,-1]) add(R.hat,G.tube([[.15*s,-.1,0],[.28*s,0,0],[.32*s,.2,-.05]],.045,.012,8,5),M(H.horns),0,0,0);
    R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='antlers'){ for(const s of [1,-1]) add(R.hat,G.tube([[.08*s,-.05,0],[.2*s,.1,-.02],[.24*s,.32,-.04],[.34*s,.46,-.04]],.04,.012,10,5),M(H.c||0xd8c8a0),0,0,0);
    for(const s of [1,-1]) add(R.hat,G.tube([[.2*s,.12,-.02],[.34*s,.2,-.02]],.025,.01,4,4),M(H.c||0xd8c8a0),0,0,0); R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='crown'){ add(R.hat,G.cyl(.17,.17,.08,10),M(H.c||0xe2b850,{metal:.9}),0,-.04,0); for(let i=0;i<6;i++){ const a=i/6*PI*2; add(R.hat,G.cone(.03,.1,4),M(H.c||0xe2b850,{metal:.9}),Math.sin(a)*.16,.04,Math.cos(a)*.16); } R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='halo'){ add(R.hat,G.tor(.2,.02,5,18),M(H.c||0xffe9a0,{glow:true}),0,.16,-.08,PI/2-.3); R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='beak'){ const bm=M(H.c||0xe8dcc0); const b=add(R.head,G.cone(.07,.32,8),bm,0,.12,.28,PI/2); add(R.head,G.box(.26,.07,.06),M(0x2a2a2a),0,.17,.13); for(const s of [1,-1]) add(R.head,G.cyl(.04,.04,.02,8),M(H.lens||0x9be05a,{glow:true}),.07*s,.17,.165,PI/2);
    add(R.hat,G.cyl(.3,.3,.03,16),M(H.hat||0x2a2a2a),0,0,0); add(R.hat,G.cyl(.17,.18,.2,12),M(H.hat||0x2a2a2a),0,.11,0); R.hatTip=grp(R.hat,0,0,0); }
  else R.hatTip=grp(R.hat,0,0,0);
  // a brim shades the face in real light but hides it at sprite size: hats cast no shadow
  R.hat.traverse(m=>{ if(m.isMesh) m.castShadow=false; });
  // arms
  const sleeve=o.sleeve||'flared';
  for(const s of [1,-1]){ const n=s>0?'L':'R';
    const arm=grp(R.torso,.24*s*W,.45,0); add(arm,G.cyl(.065*W,.07*W,.3,8),armor&&o.armor.arms?armor:sleeve==='bare'?skin:robe,0,-.15,0);
    const el=grp(arm,0,-.3,0);
    if(sleeve==='flared') add(el,G.cyl(.075,.13,.3,8),robe,0,-.15,0);
    else add(el,G.cyl(.065*W,.06*W,.3,8),armor&&o.armor.arms?armor2:sleeve==='bare'?skin:robeDk,0,-.15,0);
    if(o.bracers) add(el,G.cyl(.075*W,.07*W,.12,8),M(o.bracers),0,-.22,0);
    const hand=grp(el,0,-.34,0); add(hand,G.sph(.062*W,8,6),o.gloves?M(o.gloves):skin);
    R['arm'+n]=arm; R['elbow'+n]=el; R['hand'+n]=hand; }
  // the right hand's weapon; staffs, spears and banners stay upright in the fist
  R.weaponKind=o.weapon?o.weapon.kind:'none';
  R.upright=['staff','spear','scythe','banner'].includes(R.weaponKind);
  R.wpPivot=grp(R.handR); if(o.weapon){ R.weapon=LAB.weapon(o.weapon); R.wpPivot.add(R.weapon); }
  if(o.offhand){ R.offPivot=grp(R.handL); R.off=o.offhand.kind==='shield'?LAB.shield(o.offhand):LAB.weapon(o.offhand); R.offPivot.add(R.off);
    if(o.offhand.kind==='shield'){ R.off.position.set(.06,.02,.1); R.off.rotation.set(0,-.9,0); } }
  // magic: orb in the free hand, sparks, and a strike arc
  const fx=o.fx||0x8affd2;
  R.orb=add(R.handL,G.ico(.09),M(fx,{glow:true})); R.sparks=grp(root);
  for(let i=0;i<6;i++) add(R.sparks,G.oct(.05),M(i%2?fx:0xffffff,{glow:true}));
  R.slash=add(root,G.tor(.95,.035,4,24,1.9),M(fx,{glow:true}),0,1.3,.15,-.5,0,0);
  R.o=o; return R; };

/* ---------- poses ---------- */
const BASE={hipsY:.95, torsoX:0, torsoY:0, torsoZ:0, headX:0, headY:0, legL:0, legR:0, kneeL:.05, kneeR:.05,
  armLX:0, armLZ:.15, elbowL:-.15, armRX:-.25, armRZ:-.22, elbowR:-.7, wpTilt:0, wpY:0, wpX:-1.9,
  cape:.08, skirtZ:0, hatTip:-.4, orb:0, sparks:0, slash:0, slashZ:0, rise:0, wing:0};
LAB.HBASE=BASE;
LAB.poseHumanoid=function(R,P){
  R.hips.position.y=P.hipsY+P.rise; R.torso.rotation.set(P.torsoX,P.torsoY,P.torsoZ); R.head.rotation.set(P.headX,P.headY,0);
  if(R.legL){ R.legL.rotation.x=P.legL; R.legR.rotation.x=P.legR; R.kneeL.rotation.x=P.kneeL; R.kneeR.rotation.x=P.kneeR; }
  R.armL.rotation.set(P.armLX,0,P.armLZ); R.elbowL.rotation.x=P.elbowL; R.armR.rotation.set(P.armRX,0,P.armRZ); R.elbowR.rotation.x=P.elbowR;
  if(R.upright) R.wpPivot.rotation.set(P.wpTilt-(P.armRX+P.elbowR),0,-P.armRZ); else R.wpPivot.rotation.set(P.wpX+P.wpTilt,0,0);
  if(R.weapon) R.weapon.position.y=P.wpY;
  if(R.cape) R.cape.rotation.x=P.cape; R.skirt.rotation.z=P.skirtZ; if(R.hatTip) R.hatTip.rotation.x=P.hatTip;
  if(R.wings) R.wings.forEach((w,i)=>w.rotation.y=(i?-1:1)*(.3-P.wing*.5));
  R.orb.visible=P.orb>.05; R.orb.scale.setScalar(Math.max(.01,P.orb));
  R.sparks.visible=P.sparks>.05;
  R.sparks.children.forEach((s,i)=>{ const a=i/6*PI*2+P.sparks*2.2; s.position.set(Math.cos(a)*.6,1.3+.5*P.sparks+.18*Math.sin(a*2),Math.sin(a)*.6); });
  R.slash.visible=P.slash>.05; R.slash.scale.setScalar(.8+.2*P.slash); R.slash.rotation.z=-.5+P.slash*.4+P.slashZ;
};
const S=LAB.SIN, C=LAB.COS;
LAB.HMOVES={
  idle:{frames:6, fps:6, pose:(t,R)=>{ const s=S(t); return {...BASE, hipsY:.95+.016*s+(R.o.float?.08+.04*s:0), torsoX:.02*s, headX:-.03*s, armLX:.05*s, cape:.08+.04*Math.sin(t*PI*2+1), hatTip:-.4+.08*Math.sin(t*PI*2+.6)}; }},
  walk:{frames:8, fps:10, pose:(t,R)=>{ const ph=t*PI*2, sw=Math.sin(ph), c=Math.cos(ph);
    if(R.o.float) return {...BASE, hipsY:1.03+.04*Math.sin(ph*2), torsoX:.18, armLX:.25+.1*sw, armRX:-.4, skirtZ:.06*sw, cape:.45+.1*Math.abs(sw), hatTip:-.5};
    return {...BASE, hipsY:.95-.04*Math.abs(sw), legL:-.5*sw, legR:.5*sw, kneeL:.08+.7*Math.max(0,c), kneeR:.08+.7*Math.max(0,-c),
      armLX:.45*sw, elbowL:-.25, armRX:R.upright?-.3-.14*sw:-.2-.35*sw, torsoY:.1*sw, skirtZ:.05*sw, cape:.2+.1*Math.abs(sw), hatTip:-.45+.12*Math.cos(ph*2)}; }},
  cast:{frames:8, fps:11, pose:(t,R)=>{ const up=R.upright; return LAB.keyed(BASE,[[0,{}],
    [.22,{armRX:up?-1.3:-.9, elbowR:-1, torsoX:-.1, headX:-.12, armLX:-.35, elbowL:-.7, orb:.4, cape:.14}],
    [.45,{armRX:up?-2.7:-1.6, armRZ:-.22, elbowR:-.25, wpY:up?-.6:0, torsoX:-.16, headX:-.3, armLX:-1.25, elbowL:-.35, orb:1, sparks:.5, cape:.18}],
    [.68,{armRX:up?-2.7:-1.6, armRZ:-.22, elbowR:-.25, wpY:up?-.6:0, torsoX:.1, armLX:-1.5, elbowL:-.08, orb:1.35, sparks:1, cape:.24, hipsY:.93}],
    [.88,{armRX:-1, elbowR:-.8, torsoX:.04, armLX:-.6, elbowL:-.4, orb:.3, sparks:.35}],[1,{}]],t); }},
  attack:{frames:6, fps:11, pose:(t,R)=>{ const k=R.weaponKind;
    if(k==='sword'||k==='axe') return LAB.keyed(BASE,[[0,{}],
      [.22,{armRX:-2.7, armRZ:-.3, elbowR:-.5, wpX:-.4, torsoY:.35, torsoX:-.12, armLX:-.4, legL:-.2, legR:.15}],
      [.42,{armRX:-.7, armRZ:-.1, elbowR:-.1, wpX:-1.1, torsoY:-.35, torsoX:.22, armLX:.4, legL:-.36, legR:.26, kneeR:.3, hipsY:.91, slash:1, slashZ:.5, cape:.3}],
      [.62,{armRX:-.5, elbowR:-.15, wpX:-1.2, torsoY:-.3, torsoX:.18, armLX:.35, legL:-.3, legR:.22, kneeR:.25, hipsY:.92, slash:.55, slashZ:.5, cape:.26}],
      [.82,{armRX:-.4, elbowR:-.5, torsoY:-.1}],[1,{}]],t);
    if(k==='dagger') return LAB.keyed(BASE,[[0,{}],[.25,{armRX:.5, elbowR:-1.6, armLX:.5, elbowL:-1.5, torsoX:-.1, hipsY:.9, kneeL:.4, kneeR:.4}],
      [.45,{armRX:-1.6, elbowR:-.1, wpX:-1.5, armLX:-1.5, elbowL:-.1, torsoX:.3, legL:-.4, legR:.3, hipsY:.9, slash:1, slashZ:-.2}],[.7,{armRX:-1.3, elbowR:-.2, armLX:-1.2, torsoX:.2, slash:.4}],[1,{}]],t);
    return LAB.keyed(BASE,[[0,{}],
      [.2,{armRX:-.55, elbowR:-1.4, torsoY:.5, torsoX:-.08, wpTilt:.7, armLX:.3, legL:-.18, legR:.15}],
      [.42,{armRX:-1.55, elbowR:-.2, torsoY:-.45, torsoX:.2, wpTilt:-1.35, armLX:.55, legL:-.36, legR:.26, kneeR:.3, hipsY:.91, slash:1, cape:.3}],
      [.62,{armRX:-1.45, elbowR:-.25, torsoY:-.38, torsoX:.15, wpTilt:-1.2, armLX:.45, legL:-.3, legR:.22, kneeR:.25, hipsY:.92, slash:.55, cape:.26}],
      [.82,{armRX:-.6, elbowR:-.6, wpTilt:-.3, torsoY:-.1}],[1,{}]],t); }},
  hurt:{frames:4, fps:9, pose:t=>LAB.keyed(BASE,[[0,{torsoX:-.32, headX:-.45, armLX:.6, armLZ:.55, armRX:.15, elbowR:-.4, wpTilt:.5, hipsY:.92, cape:.35}],
    [.35,{torsoX:-.22, headX:-.25, armLX:.35, armLZ:.4, wpTilt:.3, hipsY:.93, cape:.25}],[1,{}]],t)},
};
})();
