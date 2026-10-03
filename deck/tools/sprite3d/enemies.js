/* Enemies, boss minions, summoned heroes and the minibosses' helpers. Humanoids use the kit;
   creatures are built here and driven by one shared set of motion curves (bob, step, wind-up,
   strike, raise, recoil) so every monster moves with the same timing. */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI, T=THREE, EL=LAB.EL, shade=LAB.shadeHex;
LAB.ROSTER=LAB.ROSTER||[];
const FRONT=[{name:'front',yaw:-.42}];
const MOVES5=['idle','walk','cast','attack','hurt'];
LAB.MOV={idle:{frames:6,fps:6}, walk:{frames:8,fps:10}, cast:{frames:8,fps:11}, attack:{frames:6,fps:11}, hurt:{frames:4,fps:9}};
// shared motion curves for creatures
LAB.curve=function(m,t){ const s=Math.sin(t*PI*2), g={bob:0,step:0,stepC:0,wind:0,strike:0,raise:0,hurt:0,t};
  if(m==='idle') g.bob=s;
  if(m==='walk'){ g.step=s; g.stepC=Math.cos(t*PI*2); g.bob=Math.abs(s); }
  if(m==='attack'){ const k=LAB.keyed({w:0,s:0},[[0,{}],[.25,{w:1}],[.45,{w:0,s:1}],[.65,{s:.7}],[1,{}]],t); g.wind=k.w; g.strike=k.s; }
  if(m==='cast'){ const k=LAB.keyed({r:0},[[0,{}],[.3,{r:.6}],[.5,{r:1}],[.75,{r:1}],[1,{}]],t); g.raise=k.r; }
  if(m==='hurt') g.hurt=LAB.keyed({h:0},[[0,{h:1}],[.4,{h:.6}],[1,{}]],t).h;
  return g; };
// a ring of glowing motes that rises with g.raise
LAB.motes=function(root,c,y,r=.6,n=6){ const g=grp(root); for(let i=0;i<n;i++) add(g,G.oct(.05),M(i%2?c:0xffffff,{glow:true}));
  g.update=(v,t)=>{ g.visible=v>.05; g.children.forEach((s,i)=>{ const a=i/n*PI*2+v*2.2+t*2; s.position.set(Math.cos(a)*r,y+.45*v+.15*Math.sin(a*2),Math.sin(a)*r); }); }; return g; };
const creature=(build)=>()=>{ const R=build(); return {root:R.root, moves:LAB.MOV, pose:(m,t)=>R.apply(LAB.curve(m,t),m)}; };
const hum=(id,group,name,ref,spec,extra={})=>LAB.ROSTER.push(Object.assign({id,group,name,ref,cell:96,views:FRONT,moves:MOVES5,kind:'humanoid',spec},extra));
const mon=(id,group,name,ref,build,extra={})=>LAB.ROSTER.push(Object.assign({id,group,name,ref,cell:96,views:FRONT,moves:MOVES5,build:creature(build)},extra));
LAB.hum=hum; LAB.mon=mon; LAB.creature=creature;

/* ---------- monsters ---------- */
mon('gloop','Enemies','Gloop','unit:gloop',()=>{ const root=grp(null), body=grp(root), c=M(0x3fbf6a), dk=M(0x2a8a4e), lt=M(0x8af0a8), eye=M(0x0e2a1a), core=M(0xb8ffcf,{glow:true});
  const b=add(body,G.robe([[.48,0],[.52,.3],[.42,.8],[.34,1.25],[.3,1.5],[.16,1.72],[.01,1.78]],5,.04,24),c,0,0,0);
  for(const [x,y,z,r] of [[.2,1.1,.3,.06],[-.25,.6,.38,.05],[.3,.35,.35,.07],[-.1,1.45,.25,.04]]) add(body,G.sph(r,8,6),lt,x,y,z);
  add(body,G.sph(.07,8,6),eye,.12,1.42,.26); add(body,G.sph(.07,8,6),eye,-.12,1.42,.26); add(body,G.sph(.03,6,5),core,.12,1.43,.32); add(body,G.sph(.03,6,5),core,-.12,1.43,.32);
  const mouth=add(body,G.box(.22,.06,.05),eye,0,1.22,.29);
  const arms=[]; for(const s of [1,-1]){ const a=grp(body,.4*s,1.1,0); a.add(LAB.mesh(G.tube([[0,0,0],[.15*s,-.25,.08],[.18*s,-.55,.12],[.12*s,-.75,.1]],.11,.05,10,6),c)); arms.push(a);
    for(let i=0;i<2;i++) add(a,G.cone(.03,.16,5),dk,(.1+i*.06)*s,-.8-i*.05,.1,PI); }
  for(let i=0;i<6;i++){ const a=i/6*PI*2; add(body,G.cone(.04,.2,5),dk,Math.sin(a)*.47,.0,Math.cos(a)*.47,PI); }
  const fx=LAB.motes(root,0x8affb0,1.2);
  return {root, apply:(g,m)=>{ const sq=1+.05*g.bob-.12*g.hurt+.1*g.raise; body.scale.set(1/Math.sqrt(sq)*(1+.08*g.wind),sq,1/Math.sqrt(sq)); body.rotation.x=.35*g.strike-.15*g.wind-.25*g.hurt; body.rotation.z=.08*g.step;
    body.position.z=.35*g.strike; arms.forEach((a,i)=>{ a.rotation.x=-1.4*g.strike+.6*g.wind-.8*g.raise+.25*g.step*(i?1:-1); a.rotation.z=(i?-1:1)*(.2+.4*g.raise+.3*g.hurt); }); mouth.scale.y=1+3*g.strike+2*g.hurt; fx.update(g.raise,g.t); }}; });

mon('gloopling','Enemies','Gloopling','unit:gloopling',()=>{ const root=grp(null), body=grp(root), c=M(0x8fd04a), lt=M(0xd0f08a), eye=M(0x0e2a1a), w=M(0xffffff);
  add(body,G.robe([[.36,0],[.4,.15],[.34,.45],[.18,.62],[.01,.66]],4,.02,20),c,0,0,0);
  add(body,G.sph(.14,10,8),w,.04,.38,.26); add(body,G.sph(.08,8,6),eye,.05,.38,.37); add(body,G.sph(.03,5,4),M(0xffffff,{glow:true}),.08,.42,.43);
  add(body,G.sph(.05,6,5),lt,-.2,.48,.2); add(body,G.cyl(.015,.02,.18,4),M(0x5a9a3a),-.05,.72,0,0,0,.3); add(body,G.sph(.04,6,5),lt,-.08,.82,0);
  const fx=LAB.motes(root,0xd0ff8a,.5,.4);
  return {root, apply:(g)=>{ const hop=Math.max(0,Math.sin(g.t*PI*2))*(g.step?1:0); const sq=1+.07*g.bob-.15*g.hurt-.15*g.wind+.12*g.strike;
    body.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq)); body.position.y=.25*hop+.3*g.strike+.1*g.raise; body.position.z=.4*g.strike; body.rotation.x=-.2*g.hurt+.2*g.strike; fx.update(g.raise,g.t); }}; });

mon('wisp','Enemies','Cinder Wisp','unit:wisp',()=>{ const root=grp(null), body=grp(root,0,.3,0), o=M(0xff6a1a,{glow:true}), y=M(0xffc040,{glow:true}), r=M(0xc8321a), k=M(0x2a0a04);
  add(body,G.robe([[.02,0],[.22,.15],[.3,.55],[.26,.9],[.18,1.2],[.01,1.55]],5,.05,20),r,0,0,0);
  for(const [x,yy,z,s,h] of [[0,1.35,.05,.16,.5],[.14,1.2,.02,.1,.32],[-.15,1.18,.03,.1,.3],[0,.9,.18,.12,.3]]) add(body,G.cone(s,h,7),o,x,yy,z);
  add(body,G.cone(.15,.6,7),y,0,.85,.12); add(body,G.cone(.1,.42,6),y,0,1.25,.1);
  add(body,G.box(.06,.08,.03),k,.08,1.05,.24); add(body,G.box(.06,.08,.03),k,-.08,1.05,.24);
  const arms=[]; for(const s of [1,-1]){ const a=grp(body,.26*s,.85,0); add(a,G.cone(.08,.5,6),o,.05*s,-.2,0,PI,0,.3*s); add(a,G.cone(.05,.3,5),y,.07*s,-.2,.04,PI,0,.3*s); arms.push(a); }
  const emb=grp(root); for(let i=0;i<5;i++) add(emb,G.oct(.04),i%2?o:y,0,0,0);
  const fx=LAB.motes(root,0xffa040,1.3);
  return {root, apply:(g)=>{ body.position.y=.3+.06*g.bob+.1*g.raise; body.rotation.x=.3*g.strike-.2*g.wind-.3*g.hurt+.15*Math.abs(g.step); body.position.z=.3*g.strike;
    body.scale.set(1,1+.04*Math.sin(g.t*PI*4)+.15*g.raise,1); arms.forEach((a,i)=>{ a.rotation.x=-1.6*g.strike+.5*g.wind-1.2*g.raise; a.rotation.z=(i?-1:1)*(.3+.5*g.hurt); });
    emb.children.forEach((e,i)=>{ const a=i*1.3+g.t*PI*2; e.position.set(Math.sin(a)*.35,.4+((g.t+i*.2)%1)*1.4,Math.cos(a)*.2); }); fx.update(g.raise,g.t); }}; });

mon('mite','Enemies','Frost Mite','unit:mite',()=>{ const root=grp(null), ice=M(0x7fbfe8), ice2=M(0xbfe8ff,{metal:.4}), dk=M(0x2e5c8a), eye=M(0xe8ffff,{glow:true});
  const hips=grp(root,0,.55,0), torso=grp(hips,0,.05,0); add(torso,G.rock(.3,3,.2,1),ice,0,.3,0).scale.set(1,1.15,.85);
  for(let i=0;i<4;i++) add(torso,G.cone(.07,.35,5),ice2,(-.15+i*.1),.55+(i%2)*.06,-.18,-.6,0,(-.3+i*.2));
  const head=grp(torso,0,.62,.05); add(head,G.rock(.2,5,.15,1),ice,0,.12,0); add(head,G.box(.06,.04,.03),eye,.08,.12,.17); add(head,G.box(.06,.04,.03),eye,-.08,.12,.17);
  add(head,G.cone(.05,.22,5),ice2,.12,.3,0,0,0,-.4); add(head,G.cone(.05,.22,5),ice2,-.12,.3,0,0,0,.4);
  const L={}; for(const s of [1,-1]){ const n=s>0?'L':'R'; const lg=grp(hips,.14*s,0,0); add(lg,G.cyl(.08,.06,.32,6),dk,0,-.16,0); const kn=grp(lg,0,-.32,0); add(kn,G.cyl(.06,.05,.22,6),ice,0,-.11,0); add(kn,G.box(.12,.06,.18),ice2,0,-.22,.04);
    const ar=grp(torso,.28*s,.45,0); add(ar,G.cyl(.07,.06,.3,6),ice,0,-.15,0); const el=grp(ar,0,-.3,0); add(el,G.cone(.07,.28,5),ice2,0,-.14,0,PI); L['leg'+n]=lg; L['knee'+n]=kn; L['arm'+n]=ar; L['el'+n]=el; }
  const fx=LAB.motes(root,0xbfe8ff,.9,.5);
  return {root, apply:(g)=>{ hips.position.y=.55-.03*g.bob-.05*g.wind; L.legL.rotation.x=-.6*g.step; L.legR.rotation.x=.6*g.step; L.kneeL.rotation.x=.6*Math.max(0,g.stepC); L.kneeR.rotation.x=.6*Math.max(0,-g.stepC);
    torso.rotation.x=.35*g.strike-.25*g.wind-.35*g.hurt+.1*Math.abs(g.step); hips.position.z=.25*g.strike;
    L.armL.rotation.x=.5*g.step-2*g.strike+.8*g.wind-2.4*g.raise; L.armR.rotation.x=-.5*g.step-1.6*g.strike+.6*g.wind-2.4*g.raise; L.armL.rotation.z=.3+.3*g.hurt; L.armR.rotation.z=-.3-.3*g.hurt; L.elL.rotation.x=L.elR.rotation.x=-.5;
    head.rotation.x=-.3*g.hurt; fx.update(g.raise,g.t); }}; });

mon('beetle','Enemies','Volt Beetle','unit:beetle',()=>{ const root=grp(null), body=grp(root,0,.42,0), sh=M(0xb0562a,{metal:.5}), sh2=M(0x7a3418,{metal:.4}), leg=M(0x3a2018), spark=M(EL.storm,{glow:true}), blue=M(0x8ad8ff,{glow:true});
  const shell=grp(body); for(const s of [1,-1]) add(shell,G.cap(.36,.5,14,8),sh,.03*s,0,-.05,0,0,-.05*s).scale.set(.55,.75,1.1);
  add(body,G.sph(.3,12,8),sh2,0,-.02,.05).scale.set(1,.6,1.2);
  const head=grp(body,0,.0,.4); add(head,G.sph(.17,10,8),sh2,0,0,0); add(head,G.cone(.06,.4,6),sh,0,.2,.12,-.5); add(head,G.box(.05,.04,.03),blue,.08,.04,.15); add(head,G.box(.05,.04,.03),blue,-.08,.04,.15);
  for(const s of [1,-1]) add(head,G.tube([[.08*s,0,.1],[.14*s,.1,.22],[.18*s,.24,.24]],.015,.008,6,4),leg,0,0,0);
  const legs=[]; for(const s of [1,-1]) for(let i=0;i<3;i++){ const l=grp(body,.2*s,-.08,.2-i*.2); add(l,G.tube([[0,0,0],[.2*s,.05,0],[.32*s,-.3,0]],.035,.02,6,4),leg,0,0,0); legs.push([l,s,i]); }
  const arcs=grp(body); for(let i=0;i<5;i++) add(arcs,G.oct(.035),i%2?spark:blue,0,0,0);
  const fx=LAB.motes(root,EL.storm,.7,.5);
  return {root, apply:(g)=>{ body.position.y=.42+.02*g.bob+.06*g.strike; body.rotation.x=-.25*g.wind+.2*g.strike-.25*g.hurt; body.position.z=.3*g.strike; shell.rotation.z=0;
    shell.children.forEach((c,i)=>c.rotation.z=(i?1:-1)*(.05+.9*g.raise)); head.rotation.x=.3*g.strike-.2*g.wind;
    legs.forEach(([l,s,i])=>{ l.rotation.x=.4*Math.sin(g.t*PI*2*(g.step?1:0)+i*2+(s>0?0:PI))*(g.step?1:0); l.rotation.z=.1*g.hurt*s; });
    arcs.children.forEach((e,i)=>{ const a=i*1.7+g.t*PI*4; e.position.set(Math.cos(a)*.38,.15+.12*Math.sin(a*1.3),Math.sin(a)*.42); }); arcs.visible=g.raise>.1||g.strike>.1||((g.t*6|0)%2===0); fx.update(g.raise,g.t); }}; });

mon('ram','Enemies','Thunder Ram','unit:ram',()=>{ const root=grp(null), fur=M(0x8a7a52,{soft:true}), fur2=M(0x5e6a2c,{soft:true}), hoof=M(0x2a2018), horn=M(0xd8c8a0), dk=M(0x3a2e1e), eye=M(0xffe45a,{glow:true});
  const body=grp(root,0,1.05,0); add(body,G.sph(.5,14,10),fur,0,0,0).scale.set(.85,.8,1.35); add(body,G.robe([[.36,-.45],[.42,-.2],[.4,.1],[.01,.35]],6,.05,20),fur2,0,0,-.05).scale.set(1.1,1,1.6);
  const neck=grp(body,0,.2,.55); add(neck,G.cyl(.18,.24,.5,10),fur,0,.18,.05,.5); const head=grp(neck,0,.45,.18);
  add(head,G.box(.3,.28,.42),fur,0,0,.08); add(head,G.box(.2,.18,.2),dk,0,-.06,.3); add(head,G.box(.05,.05,.03),eye,.13,.06,.22); add(head,G.box(.05,.05,.03),eye,-.13,.06,.22);
  add(head,G.cone(.1,.3,6),fur2,0,-.28,.15,PI);
  for(const s of [1,-1]){ add(head,G.tube([[.12*s,.12,0],[.32*s,.25,-.1],[.42*s,.1,-.25],[.36*s,-.12,-.12],[.26*s,-.05,.05]],.07,.03,14,6),horn,0,0,0);
    add(head,G.tube([[.08*s,.15,-.05],[.16*s,.45,-.1],[.3*s,.72,-.12],[.42*s,.9,-.1]],.035,.015,10,5),horn,0,0,0); add(head,G.tube([[.2*s,.55,-.1],[.06*s,.8,-.1]],.025,.012,6,4),horn,0,0,0); }
  const legs=[]; for(const [x,z] of [[.24,.42],[-.24,.42],[.24,-.42],[-.24,-.42]]){ const l=grp(body,x,-.25,z); add(l,G.cyl(.09,.07,.45,6),fur,0,-.22,0); const k=grp(l,0,-.45,0); add(k,G.cyl(.06,.05,.36,6),dk,0,-.18,0); add(k,G.cyl(.07,.07,.08,6),hoof,0,-.38,0); legs.push([l,k,x*z>0?0:PI]); }
  const spark=LAB.motes(root,EL.storm,1.6,.7);
  return {root, apply:(g)=>{ body.position.y=1.05+.02*g.bob; body.rotation.x=.25*g.strike-.15*g.wind-.15*g.hurt; body.position.z=.6*g.strike-.15*g.wind; neck.rotation.x=.7*g.strike+.5*g.wind-.3*g.raise-.3*g.hurt;
    legs.forEach(([l,k,ph])=>{ const s=Math.sin(g.t*PI*2+ph)*(g.step?1:0); l.rotation.x=.5*s-.3*g.strike; k.rotation.x=.5*Math.max(0,Math.cos(g.t*PI*2+ph))*(g.step?1:0); }); spark.update(g.raise+g.strike*.5,g.t); }}; },{note:'Kept the antlered ram look of the current sprite.'});

hum('shade','Enemies','Shade','unit:shade',{float:true, skin:0x2a3a5a, eyes:0xbff4ff, eyeGlow:true, robe:0x5aa8d8, robeDk:0x3a78a8, trim:0xbfe8ff, hat:{type:'hood',c:0x6ab8e8}, mantle:0x4a90c8, cape:0x3a78a8, rags:true, stripe:false, sleeve:'flared', fx:0xbff4ff});

mon('sprite','Enemies','Halo Sprite','unit:sprite',()=>{ const root=grp(null), body=grp(root,0,.25,0), w=M(0xbfe0ff,{soft:true}), w2=M(0x7ab0e8,{soft:true}), halo=M(0xffe9a0,{glow:true}), core=M(0xffffff,{glow:true}), eye=M(0x1a2a4a);
  const rings=[]; for(let i=0;i<5;i++){ const r=add(body,G.tor(.12+i*.07,.05,6,16),i%2?w:w2,0,.1+i*.18,0,PI/2); rings.push(r); }
  add(body,G.sph(.18,10,8),w,0,1.0,0); add(body,G.box(.04,.06,.03),eye,.06,1.02,.17); add(body,G.box(.04,.06,.03),eye,-.06,1.02,.17); add(body,G.sph(.08,8,6),core,0,.55,0);
  const h=add(body,G.tor(.2,.025,5,18),halo,0,1.3,0,PI/2-.2);
  const fx=LAB.motes(root,0xffe9a0,1.0,.5);
  return {root, apply:(g)=>{ body.position.y=.25+.08*g.bob+.15*g.raise; body.rotation.x=.4*g.strike-.3*g.wind-.4*g.hurt; body.position.z=.4*g.strike;
    rings.forEach((r,i)=>{ r.rotation.z=g.t*PI*2*(i%2?1:-1)+i; r.position.x=.04*Math.sin(g.t*PI*2+i); }); h.position.y=1.3+.05*Math.sin(g.t*PI*4); fx.update(g.raise,g.t); }}; });

/* ---------- humanoid foes ---------- */
hum('cultist','Enemies','Ember Cultist','unit:cultist',{skin:0xf1caa2, robe:0x3c6a4e, robeDk:0x2a4a36, hat:{type:'ranger',c:0x3a5e40,band:0x5a3a22}, hair:{c:0x2a1e18,style:'short'}, skirt:'short', legs:0x3a4a34, sleeve:'tight', straps:0x5a3a22, cape:0x2a4a36, weapon:{kind:'staff',head:'flame',c:0xff7a2a,wood:M(0x4a2a1a)}, fx:0xffa040});
hum('witch_e','Enemies','Frost Witch','unit:witch',{fem:true, skin:0xf3d8d8, robe:0x6a3a9a, robeDk:0x4a2878, hat:{type:'witch',c:0x7a4aa8,band:0x2a1a40}, hair:{c:0xd07ad0,style:'long',len:.56}, cape:0x4a2878, weapon:{kind:'staff',head:'crystal',c:EL.frost,wood:M(0x9ab8d8)}, fx:EL.frost});
hum('caller','Enemies','Storm Caller','unit:caller',{skin:0xf1caa2, robe:0x2e6ab8, robeDk:0x1e4a8a, hat:{type:'wizard',c:0x2e6ab8,band:0xb5452e}, beard:{c:0xf0f0f0,len:.36}, hair:{c:0xf0f0f0,style:'short'}, belt:0xb5452e, skirt:'short', legs:0x1e4a8a, sleeve:'tight', weapon:{kind:'staff',head:'orb',c:EL.storm,wood:M(0x6a4a32)}, fx:EL.storm});
hum('warden','Enemies','Grove Warden','unit:warden',{skin:0xe8b890, robe:0x3a7a4a, robeDk:0x2a5a36, hat:{type:'wizard',c:0x4a8a5a,band:0x8a5a34}, beard:{c:0xc8783a,len:.38}, hair:{c:0xc8783a,style:'long',len:.4}, cape:0x6a4a2a, weapon:{kind:'staff',head:'leaf',c:EL.verdant}, fx:EL.verdant});
hum('paladin','Enemies','Dawn Paladin','unit:paladin',{skin:0xe8dcc8, face:'normal', robe:0xe8e4dc, robeDk:0xb8b4ac, trim:0xe08a3a, skirt:'short', legs:0xc8ccd4, sleeve:'tight', armor:{c:0xd8dde4,c2:0xa8b0bc,chest:true,arms:true,legs:true}, pads:{c:0xd8dde4,metal:.8}, hat:{type:'helm',c:0xd8dde4,crest:0xe08a3a}, mantle:false, tabard:0xe8e4dc, weapon:{kind:'banner',cloth:M(0x3a62b8)}, fx:EL.light, gloves:0xa8b0bc});
hum('knight','Enemies','Hex Knight','unit:knight',{bodyW:1.15, skin:0x6a6a74, robe:0x3a3a44, robeDk:0x2a2a32, trim:0x9a6aff, skirt:'short', legs:0x4a4a54, sleeve:'tight', armor:{c:0x6a6e78,c2:0x45484f,chest:true,arms:true,legs:true}, pads:{c:0x6a6e78,metal:.9,spike:true}, hat:{type:'helm',c:0x6a6e78,spike:true,slit:0xa77aff}, mantle:false, gloves:0x45484f,
  weapon:{kind:'sword',metal:M(0x8a8e98,{metal:1}),guard:M(0x45484f,{metal:.8}),c:EL.shadow,len:.85}, offhand:{kind:'shield',m:M(0x45484f,{metal:.8}),rim:M(0x8a8e98,{metal:1}),c:EL.shadow}, fx:EL.shadow});

/* ---------- skeletons share the kit's joints so they use the same moves ---------- */
LAB.skeleton=function(o){ const R=LAB.humanoid(Object.assign({skirt:'none',mantle:false,stripe:false,sleeve:'tight',face:'skull',skin:o.bone||0xe8e0c8,robe:o.bone||0xe8e0c8,legs:o.bone||0xe8e0c8,boot:o.bone||0xe8e0c8,belt:0x5a4a3a},o));
  // swap the solid chest and limbs for ribs and thin bones
  const bone=M(o.bone||0xe8e0c8), dk=M(0x2a2420);
  R.torso.children.filter(c=>c.isMesh&&c.geometry.type==='CylinderGeometry'&&c.position.y>.2).forEach(c=>c.visible=false);
  add(R.torso,G.cyl(.03,.03,.5,5),bone,0,.25,-.05); for(let i=0;i<4;i++) add(R.torso,G.tor(.13-i*.012,.022,4,12,PI*1.4),bone,0,.42-i*.08,0,PI/2,0,-PI*.2);
  add(R.torso,G.box(.3,.06,.16),bone,0,.0,0);
  for(const p of [R.armL,R.armR,R.elbowL,R.elbowR]) p.children.forEach(c=>{ if(c.isMesh) c.scale.set(.45,1,.45); });
  for(const p of [R.legL,R.legR]) if(p) p.children.forEach(c=>{ if(c.isMesh) c.scale.set(.45,1,.45); });
  return R; };
const skel=(id,group,name,ref,spec,extra)=>LAB.ROSTER.push(Object.assign({id,group,name,ref,cell:96,views:FRONT,moves:MOVES5,
  build:()=>{ const R=LAB.skeleton(spec); return {root:R.root, moves:LAB.HMOVES, pose:(m,t)=>LAB.poseHumanoid(R,LAB.HMOVES[m].pose(t,R))}; }},extra||{}));
LAB.skel=skel;

/* ---------- boss minions ---------- */
mon('rootnode','Boss minions','Root Node','unit:rootnode',()=>{ const root=grp(null), bark=M(0x6a4a2a), bark2=M(0x4a3220), leaf=M(0x4fa83a,{soft:true}), leaf2=M(0x8ad04a,{soft:true}), eye=M(0xe8ff6a,{glow:true}), k=M(0x1a120a);
  const body=grp(root); add(body,G.robe([[.55,0],[.45,.2],[.38,.7],[.34,1.1],[.3,1.3]],9,.05,30),bark,0,0,0);
  for(let i=0;i<6;i++){ const a=i/6*PI*2; add(body,G.tube([[Math.sin(a)*.4,.2,Math.cos(a)*.4],[Math.sin(a)*.7,.05,Math.cos(a)*.7],[Math.sin(a)*.85,-.02,Math.cos(a)*.85]],.09,.03,6,5),bark2,0,0,0); }
  add(body,G.box(.08,.06,.04),eye,.12,.95,.33); add(body,G.box(.08,.06,.04),eye,-.12,.95,.33); add(body,G.box(.2,.06,.05),k,0,.72,.35); add(body,G.box(.14,.04,.06),bark2,0,1.05,.33);
  const crown=grp(body,0,1.3,0); for(const s of [1,-1]){ add(crown,G.tube([[.1*s,0,0],[.3*s,.3,0],[.36*s,.6,-.05],[.5*s,.75,0]],.06,.02,10,5),bark2,0,0,0); add(crown,G.tube([[.3*s,.3,0],[.55*s,.42,0]],.035,.015,5,4),bark2,0,0,0); }
  for(const [x,y,z,r] of [[.3,.4,0,.2],[-.32,.45,.05,.22],[0,.55,-.1,.25],[.5,.75,0,.13],[-.5,.75,0,.14]]) add(crown,G.rock(r,(x*10|0)+5,.25,1),(x>0?leaf2:leaf),x,y,z);
  for(const [x,y,z] of [[.3,.5,.3],[-.32,.3,.32],[0,.2,.38]]) add(body,G.rock(.1,3,.3,0),leaf,x,y,z);
  const fx=LAB.motes(root,0xe8ff6a,1.2,.8);
  return {root, apply:(g)=>{ body.rotation.x=-.08*g.hurt+.08*g.strike; body.scale.y=1+.02*g.bob+.04*g.raise; crown.rotation.z=.05*Math.sin(g.t*PI*2); fx.update(g.raise,g.t); }}; },{moves:['idle','cast','hurt'], note:'Stands still in the game, so it has only stand, cast and hurt.'});
hum('sapling','Boss minions','Sapling','unit:sapling',{scale:.7, headK:1.4, skin:0xa87a48, robe:0x8a6438, robeDk:0x6a4a2a, skirt:'none', mantle:false, stripe:false, sleeve:'bare', legs:0x8a6438, boot:0x6a4a2a, belt:0x6a4a2a, eyes:0xe8ff6a, eyeGlow:true, hat:{type:'antlers',c:0x7a5a34}, fx:EL.verdant});
hum('clone','Boss minions','Hollow Clone','unit:clone',{skin:0xd8d8e0, face:'skull', eyes:0xb08aff, robe:0x2a2c40, robeDk:0x1c1d2c, trim:0x6a6a8a, hat:{type:'hood',c:0x24263a}, cape:0x1c1d2c, rags:true, stripe:false, weapon:{kind:'scythe',wood:M(0x2a2a3a),metal:M(0x9a9ab0,{metal:1}),c:0xb08aff}, fx:0xb08aff});

/* ---------- heroes summoned by cards ---------- */
hum('hero_pyra','Heroes','Pyra','unit:hero_pyra',{fem:true, skin:0xf1caa2, robe:0x2e5aa8, robeDk:0x1e3e7a, trim:0xff9a3a, hair:{c:0xd0502a,style:'long',len:.7}, mantle:0x1e3e7a, weapon:{kind:'staff',head:'flame',c:0xff7a2a}, fx:0xffa040});
hum('hero_ysolde','Heroes','Ysolde','unit:hero_ysolde',{fem:true, skin:0xf3d0aa, ears:'elf', robe:0x2a8a6a, robeDk:0x1e6a50, trim:0xe0bd62, hat:{type:'witch',c:0x2a9a6a,band:0xc8a26a}, hair:{c:0xe8c070,style:'long',len:.62}, cape:0xb8862a, weapon:{kind:'staff',head:'leaf',c:EL.verdant}, fx:EL.verdant});
hum('hero_volta','Heroes','Volta','unit:hero_volta',{skin:0xf1caa2, robe:0x2e6ab8, robeDk:0x1e4a8a, hat:{type:'wizard',c:0x2e6ab8,band:0xb5452e}, beard:{c:0xf4f4f4,len:.4}, hair:{c:0xf4f4f4,style:'long',len:.36}, belt:0xb5452e, cape:0x1e4a8a, weapon:{kind:'staff',head:'orb',c:EL.storm}, fx:EL.storm});
hum('hero_thornfather','Heroes','Thornfather','unit:hero_thornfather',{skin:0xe8dcc0, face:'skull', eyes:0xb8ff6a, robe:0x6a4228, robeDk:0x4a2c18, trim:0x8a6a3a, hat:{type:'antlers',c:0xd8c8a0}, cape:0x4a2c18, rags:true, fur:0x8a6a4a, mantle:false, weapon:{kind:'staff',head:'antler',c:0xb8ff6a,wood:M(0x4a3220)}, fx:0xb8ff6a});
hum('hero_aurelion','Heroes','Aurelion','unit:hero_aurelion',{scale:1.12, skin:0xf6e4cc, robe:0xf4f0e6, robeDk:0xd8d0bc, trim:0xe2b850, hat:{type:'halo',c:0xffe9a0}, hair:{c:0xf2d27c,style:'long',len:.5}, wings:0xf8f4ec, mantle:0xe2b850, weapon:{kind:'spear',wood:M(0xe2b850,{metal:.9}),metal:M(0xfff3c0,{metal:1})}, fx:EL.light},{cell:112});
mon('hero_widow','Heroes','The Widow','unit:hero_widow',()=>{ const root=grp(null), body=grp(root,0,.75,0), c=M(0x9ac83a), c2=M(0x5a7a1a), k=M(0x1e2a0a), glow=M(0xe8ff6a,{glow:true}), eye=M(0xff4a3a,{glow:true});
  add(body,G.sph(.45,14,10),c,0,.25,-.35).scale.set(1,.9,1.15); add(body,G.sph(.12,8,6),k,-.1,.42,-.0); add(body,G.sph(.12,8,6),k,.1,.42,-.0);
  add(body,G.box(.12,.04,.02),k,0,.3,.06); add(body,G.cone(.06,.2,4),glow,0,.62,-.3);
  add(body,G.sph(.25,12,8),c2,0,.1,.25); for(let i=0;i<4;i++) add(body,G.box(.04,.04,.03),eye,(-.09+i*.06),.18+(i%2)*.04,.47);
  add(body,G.cone(.04,.14,4),k,.06,.0,.48,PI/2+.3); add(body,G.cone(.04,.14,4),k,-.06,.0,.48,PI/2+.3);
  const legs=[]; for(const s of [1,-1]) for(let i=0;i<4;i++){ const l=grp(body,.18*s,.1,.3-i*.16); add(l,G.tube([[0,0,0],[.35*s,.45,0],[.7*s,.3,0],[.85*s,-.75,0]],.045,.02,12,5),c2,0,0,0); legs.push([l,s,i]); }
  const fx=LAB.motes(root,0xe8ff6a,1.4,.8);
  return {root, apply:(g)=>{ body.position.y=.75+.03*g.bob+.1*g.raise; body.rotation.x=.2*g.strike-.25*g.wind-.2*g.hurt; body.position.z=.3*g.strike;
    legs.forEach(([l,s,i])=>{ l.rotation.y=.25*Math.sin(g.t*PI*2+i*1.6+(s>0?0:PI))*(g.step?1:0)*s; l.rotation.z=s*(.2*g.raise-.15*g.hurt)+(i<2?-.5*g.strike*s:0); }); fx.update(g.raise,g.t); }}; },{cell:112});

/* ---------- miniboss helpers ---------- */
mon('mimic','Miniboss helpers','Mimic','mini:mimic',()=>LAB.mimicModel(1),{note:'There is no sprite for this one in the game today (it uses a drawn chest), so this is new.'});
skel('bonewalker','Miniboss helpers','Bonewalker','mini:bonewalker',{eyes:0x8affff, weapon:{kind:'sword',metal:M(0x9a8e7a,{metal:.6}),len:.6}, fx:0x8affff});
hum('jailer','Miniboss helpers','Jailer','mini:jailer',{skin:0xc8a888, robe:0x4a505a, robeDk:0x34383f, skirt:'short', legs:0x34383f, sleeve:'tight', armor:{c:0x6a7078,c2:0x4a4f56,chest:true}, hat:{type:'helm',c:0x6a7078}, belt:0x3a2a1e, mantle:false, gloves:0x3a2a1e,
  weapon:{kind:'chain'}, offhand:{kind:'shield',m:M(0x5a4a3a),rim:M(0x6a7078,{metal:.8})}, fx:0x8adcff});

/* the mimic, shared by the small one and the giant miniboss */
LAB.mimicModel=function(k){ const root=grp(null), wood=M(0x8a5a32), wood2=M(0x5e3a20), gold=M(0xe2b850,{metal:.9}), teeth=M(0xf0ead8), mouth=M(0x3a0a12), tongue=M(0xd04a6a), eye=M(0xffe45a,{glow:true});
  const s=k; const base=grp(root,0,.18*s,0); add(base,G.box(1.1*s,.55*s,.75*s),wood,0,.28*s,0); for(const x of [-.5,.5]) add(base,G.box(.08*s,.57*s,.77*s),gold,x*s,.28*s,0); add(base,G.box(1.12*s,.08*s,.77*s),gold,0,.02*s,0);
  add(base,G.box(.95*s,.12*s,.6*s),mouth,0,.52*s,0); for(let i=0;i<7;i++) add(base,G.cone(.05*s,.14*s,4),teeth,(-.42+i*.14)*s,.6*s,.33*s);
  const tg=add(base,G.tube([[0,.55,0],[0,.6,.25],[0,.5,.5],[0,.3,.62]].map(p=>p.map(v=>v*s)),.1*s,.05*s,10,6),tongue,0,0,0);
  const lid=grp(base,0,.55*s,-.36*s); add(lid,G.cyl(.38*s,.38*s,1.1*s,12,1,false,0,PI),wood2,0,0,.36*s,0,0,PI/2).geometry;
  lid.children[0].geometry=new THREE.CylinderGeometry(.38*s,.38*s,1.1*s,12,1,false,0,PI); lid.children[0].rotation.set(0,0,PI/2);
  for(const x of [-.5,.5]) add(lid,G.box(.08*s,.08*s,.78*s),gold,x*s,.0,.36*s);
  add(lid,G.box(.12*s,.14*s,.06*s),gold,0,-.02*s,.75*s); for(let i=0;i<7;i++) add(lid,G.cone(.05*s,.14*s,4),teeth,(-.42+i*.14)*s,-.06*s,.68*s,PI);
  add(lid,G.box(.1*s,.06*s,.04*s),eye,.22*s,.22*s,.62*s,-.6); add(lid,G.box(.1*s,.06*s,.04*s),eye,-.22*s,.22*s,.62*s,-.6);
  const legs=[]; for(const [x,z] of [[.4,.25],[-.4,.25],[.4,-.25],[-.4,-.25]]){ const l=grp(root,x*s,.25*s,z*s); add(l,G.cyl(.05*s,.04*s,.3*s,5),wood2,0,-.15*s,0); legs.push(l); }
  const coins=grp(root); for(let i=0;i<6;i++) add(coins,G.cyl(.06*s,.06*s,.015*s,8),gold,0,0,0,PI/2);
  return {root, apply:(g)=>{ lid.rotation.x=-(.25+.15*Math.sin(g.t*PI*2)*(g.bob?1:0)+.9*g.strike+.5*g.wind+.6*g.raise+.4*g.hurt); base.position.y=.18*s+.12*s*Math.abs(g.step)+.1*s*g.strike;
    base.rotation.x=.15*g.strike-.1*g.hurt; base.position.z=.3*s*g.strike; tg.scale.set(1,1,1+.6*g.strike);
    legs.forEach((l,i)=>l.rotation.x=.5*Math.sin(g.t*PI*2+i*PI/2)*(g.step?1:0));
    coins.visible=g.raise>.1; coins.children.forEach((c,i)=>{ const a=i/6*PI*2+g.t*PI*2; c.position.set(Math.cos(a)*.5*s,(.9+.4*g.raise+((i*.37+g.t)%1)*.3)*s,Math.sin(a)*.3*s); }); }}; };
})();
