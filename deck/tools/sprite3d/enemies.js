/* Enemies, boss minions, summoned heroes and the minibosses' helpers. Humanoids use the kit;
   creatures are built here and driven by one shared set of motion curves (bob, step, wind-up,
   strike, raise, recoil) so every monster moves with the same timing. */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI, T=THREE, EL=LAB.EL, shade=LAB.shadeHex, DS=T.DoubleSide;
LAB.ROSTER=LAB.ROSTER||[];
const FRONT=[{name:'front',yaw:-.42}];
const MOVES5=['idle','walk','cast','attack','hurt'];
LAB.MOV={idle:{frames:6,fps:6}, walk:{frames:8,fps:10}, cast:{frames:8,fps:11}, attack:{frames:6,fps:11}, hurt:{frames:4,fps:9}};
LAB.curve=function(m,t){ const s=Math.sin(t*PI*2), g={bob:0,step:0,stepC:0,wind:0,strike:0,raise:0,hurt:0,t,m};
  if(m==='idle') g.bob=s;
  if(m==='walk'){ g.step=s; g.stepC=Math.cos(t*PI*2); g.bob=Math.abs(s); }
  if(m==='attack'){ const k=LAB.keyed({w:0,s:0},[[0,{}],[.25,{w:1}],[.45,{w:0,s:1}],[.65,{s:.7}],[1,{}]],t); g.wind=k.w; g.strike=k.s; }
  if(m==='cast'){ const k=LAB.keyed({r:0},[[0,{}],[.3,{r:.6}],[.5,{r:1}],[.75,{r:1}],[1,{}]],t); g.raise=k.r; }
  if(m==='hurt') g.hurt=LAB.keyed({h:0},[[0,{h:1}],[.4,{h:.6}],[1,{}]],t).h;
  return g; };
LAB.motes=function(root,c,y,r=.6,n=6){ const g=grp(root); for(let i=0;i<n;i++) add(g,G.oct(.05),M(i%2?c:0xffffff,{glow:true}));
  g.update=(v,t)=>{ g.visible=v>.05; g.children.forEach((s,i)=>{ const a=i/n*PI*2+v*2.2+t*2; s.position.set(Math.cos(a)*r,y+.45*v+.15*Math.sin(a*2),Math.sin(a)*r); }); }; return g; };
// a jagged bolt of light between two points
LAB.bolt=function(par,a,b,m,m2,n=6,j=.12,w=.04){ const g=grp(par); let p=a; LAB.seed(Math.round((a[0]+b[0])*1000)+7);
  for(let i=1;i<=n;i++){ const u=i/n; const q=i===n?b:[a[0]+(b[0]-a[0])*u+(LAB.rnd()-.5)*j*2,a[1]+(b[1]-a[1])*u+(LAB.rnd()-.5)*j*2,a[2]+(b[2]-a[2])*u+(LAB.rnd()-.5)*j];
    const len=Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2]); const s=add(g,G.box(w,len+w,w),i%2?m:m2,(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2); LAB.aim(s,q[0]-p[0],q[1]-p[1],q[2]-p[2]); p=q; } return g; };
const creature=(build)=>()=>{ const R=build(); return {root:R.root, moves:R.moves||LAB.MOV, pose:(m,t)=>R.apply(LAB.curve(m,t),m)}; };
const hum=(id,group,name,ref,spec,extra={})=>LAB.ROSTER.push(Object.assign({id,group,name,ref,cell:96,views:FRONT,moves:MOVES5,kind:'humanoid',spec},extra));
const mon=(id,group,name,ref,build,extra={})=>LAB.ROSTER.push(Object.assign({id,group,name,ref,cell:96,views:FRONT,moves:MOVES5,build:creature(build)},extra));
LAB.hum=hum; LAB.mon=mon; LAB.creature=creature;
const wob=(g,k=1,p=0)=>Math.sin(g.t*PI*2*k+p);

/* ---------- monsters ---------- */
mon('gloop','Enemies','Gloop','unit:gloop',()=>{ const root=grp(null), body=grp(root), c=M(0x3fbf6a), dk=M(0x24804a), lt=M(0x9af4b4,{metal:.3}), eye=M(0x0a1e12), core=M(0xd8ffe4,{glow:true}), sl=M(0x2fa85a,{metal:.25});
  // the slug foot: a wide puddle with a wavy rim that oozes forward
  const pud=add(root,G.disc(0,.72,36,(x,z,r,a)=>.06*(1-r/.72)+.015*Math.sin(a*7)),sl,0,.01,.05); pud.scale.set(1,1,1.25);
  for(let i=0;i<7;i++){ const a=i/7*PI*2; add(root,G.sph(.08,8,6),sl,Math.sin(a)*.64,.02,Math.cos(a)*.75+.05).scale.set(1,.4,1); }
  add(body,G.robe([[.62,.0],[.55,.25],[.44,.75],[.36,1.2],[.31,1.5],[.17,1.72],[.01,1.78]],5,.05,26),c,0,0,0);
  for(const [x,y,z,r] of [[.2,1.1,.3,.06],[-.25,.6,.4,.05],[.3,.35,.42,.07],[-.1,1.45,.26,.04],[.38,.15,.4,.05]]) add(body,G.sph(r,8,6),lt,x,y,z);
  for(const s of [1,-1]){ add(body,G.sph(.085,10,8),M(0xf4fff0),.13*s,1.42,.25); add(body,G.sph(.05,8,6),eye,.13*s,1.42,.32); add(body,G.sph(.018,5,4),core,.15*s,1.45,.36); }
  const mouth=add(body,G.box(.24,.07,.05),eye,0,1.2,.3);
  const arms=[]; for(const s of [1,-1]){ const a=grp(body,.3*s,1.12,.02);
    a.add(LAB.mesh(G.sph(.15,10,8),c)); a.add(LAB.mesh(G.tube([[0,0,0],[.18*s,-.2,.08],[.24*s,-.5,.14],[.2*s,-.78,.12]],.13,.06,12,7),c));
    for(let i=0;i<3;i++) add(a,G.cone(.035,.18,5),dk,(.18+i*.03)*s,-.82-i*.05,.12-i*.03,PI); arms.push(a); }
  for(let i=0;i<5;i++){ const a=i/5*PI*2+.3; add(body,G.cone(.05,.25,5),c,Math.sin(a)*.4,1.0-i*.12,Math.cos(a)*.4,PI); }
  const fx=LAB.motes(root,0x8affb0,1.2);
  return {root, apply:(g)=>{ const sq=1+.05*g.bob-.12*g.hurt+.1*g.raise; body.scale.set(1/Math.sqrt(sq)*(1+.08*g.wind),sq,1/Math.sqrt(sq)); body.rotation.x=.3*g.strike-.15*g.wind-.25*g.hurt; body.rotation.z=.06*g.step;
    body.position.z=.3*g.strike+.06*g.step; pud.scale.set(1+.05*Math.abs(g.step),1,1.2+.1*g.step+.15*g.strike);
    arms.forEach((a,i)=>{ a.rotation.x=-1.4*g.strike+.6*g.wind-.8*g.raise+.25*g.step*(i?1:-1)+.08*wob(g,1,i); a.rotation.z=(i?-1:1)*(.15+.4*g.raise+.3*g.hurt); }); mouth.scale.y=1+3*g.strike+2*g.hurt; fx.update(g.raise,g.t); }}; });

mon('gloopling','Enemies','Gloopling','unit:gloopling',()=>{ const root=grp(null), body=grp(root), c=M(0x8fd04a), lt=M(0xd0f08a,{metal:.3}), k=M(0x060a04), w=M(0xffffff), st=M(0x5a9a2a);
  add(body,G.robe([[.38,0],[.42,.15],[.36,.45],[.2,.62],[.01,.67]],4,.02,22),c,0,0,0);
  // one big eye: dark rim, white, black pupil, two glints, lashes
  add(body,G.sph(.17,12,10),k,.03,.38,.22); add(body,G.sph(.15,12,10),w,.03,.38,.25); add(body,G.sph(.085,10,8),k,.05,.37,.36); add(body,G.sph(.03,6,5),M(0xffffff,{glow:true}),.09,.42,.43); add(body,G.sph(.014,5,4),M(0xffffff,{glow:true}),.03,.33,.44);
  for(let i=0;i<4;i++){ const a=-.7+i*.45; add(body,G.box(.02,.09,.02),k,.03+Math.sin(a)*.15,.38+Math.cos(a)*.15+.04,.3,0,0,-a*1.1); }
  add(body,G.sph(.05,6,5),lt,-.22,.46,.2);
  // a long floppy antenna: four links that trail the motion
  const ant=[]; let par=grp(body,-.04,.64,-.02); ant.push(par); for(let i=0;i<4;i++){ add(par,G.cyl(.022-i*.003,.026-i*.003,.15,5),st,0,.075,0); const n=grp(par,0,.15,0); ant.push(n); par=n; } add(par,G.sph(.055,8,6),M(0xe8ff8a,{glow:true}),0,.02,0);
  const fx=LAB.motes(root,0xd0ff8a,.5,.4);
  return {root, apply:(g)=>{ const hop=g.step?Math.max(0,Math.sin(g.t*PI*2)):0; const sq=1+.07*g.bob-.15*g.hurt-.15*g.wind+.12*g.strike;
    body.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq)); body.position.y=.25*hop+.3*g.strike+.1*g.raise; body.position.z=.4*g.strike; body.rotation.x=-.2*g.hurt+.2*g.strike;
    const vy=g.step?Math.cos(g.t*PI*2):0; ant.forEach((a,i)=>{ a.rotation.x=(i?.32:.15)*(Math.sin(g.t*PI*2-i*.9)+vy*.8)-(.4*g.strike+.3*g.hurt)*(i?1:0)+(i?.12:-.3); a.rotation.z=.18*Math.sin(g.t*PI*2-i*.7+1); }); fx.update(g.raise,g.t); }}; });

mon('wisp','Enemies','Cinder Wisp','unit:wisp',()=>{ const root=grp(null), body=grp(root,0,.35,0), f0=M(0xa8200e,{glow:true}), f1=M(0xff5418,{glow:true}), f2=M(0xff9a2a,{glow:true}), f3=M(0xffd860,{glow:true}), f4=M(0xfff6c8,{glow:true}), k=M(0x2a0804);
  // a teardrop of fire in four shells, hot core inside
  add(body,G.lathe([[.01,0],[.26,.18],[.36,.5],[.32,.85],[.18,1.15],[.01,1.35]],16),f1,0,0,0);
  add(body,G.lathe([[.01,.05],[.22,.2],[.3,.5],[.27,.8],[.12,1.05],[.01,1.18]],14),f2,0,0,.06);
  add(body,G.lathe([[.01,.1],[.15,.25],[.2,.5],[.15,.75],[.01,.92]],12),f3,0,0,.12);
  add(body,G.sph(.11,8,6),f4,0,.45,.2);
  const tongues=[]; for(let i=0;i<7;i++){ const a=i/7*PI*2, tg=grp(body,Math.sin(a)*.2,.85+(i%2)*.15,Math.cos(a)*.16); tg.rotation.set(-.3*Math.cos(a),0,.4*Math.sin(a)); add(tg,G.cone(.11,.55+(i%3)*.15,6),i%2?f1:f2,0,.25,0); add(tg,G.cone(.05,.3,5),f3,0,.16,.02); tongues.push([tg,i]); }
  const top=grp(body,0,1.25,0); add(top,G.cone(.12,.55,6),f1,0,.22,0); add(top,G.cone(.06,.32,5),f3,0,.14,.03);
  for(let i=0;i<5;i++) add(body,G.cone(.07,.3,5),f0,Math.sin(i*1.3)*.24,.08,Math.cos(i*1.3)*.2,PI);
  for(const s of [1,-1]){ add(body,G.box(.08,.12,.05),k,.1*s,.62,.37,0,0,.3*s); }
  const mouth=add(body,G.box(.16,.04,.05),k,0,.45,.37);
  const arms=[]; for(const s of [1,-1]){ const a=grp(body,.3*s,.6,.05); add(a,G.cone(.09,.45,6),f1,.06*s,-.18,0,PI,0,.35*s); add(a,G.cone(.05,.28,5),f3,.06*s,-.15,.04,PI,0,.35*s); arms.push(a); }
  const emb=grp(root); for(let i=0;i<7;i++) add(emb,G.oct(.04),i%3?f2:f4,0,0,0);
  const fx=LAB.motes(root,0xffa040,1.3);
  return {root, apply:(g)=>{ body.position.y=.35+.06*g.bob+.1*g.raise; body.rotation.x=.3*g.strike-.2*g.wind-.3*g.hurt+.2*Math.abs(g.step); body.position.z=.3*g.strike;
    body.scale.set(1-.04*wob(g,2),1+.06*wob(g,2)+.15*g.raise,1); top.rotation.z=.35*wob(g,1)-.3*g.step; top.rotation.x=-.3*Math.abs(g.step)-.3*g.strike;
    tongues.forEach(([tg,i])=>{ tg.scale.y=1+.25*wob(g,2,i*1.7); });
    arms.forEach((a,i)=>{ a.rotation.x=-1.6*g.strike+.5*g.wind-1.2*g.raise; a.rotation.z=(i?-1:1)*(.3+.5*g.hurt+.1*wob(g,2,i)); }); mouth.scale.y=1+3*g.strike+2*g.raise;
    emb.children.forEach((e,i)=>{ const a=i*1.3+g.t*PI*2; e.position.set(Math.sin(a)*.4,.5+((g.t+i*.15)%1)*1.6,Math.cos(a)*.25); }); fx.update(g.raise,g.t); }}; });

mon('mite','Enemies','Frost Mite','unit:mite',()=>{ const root=grp(null), ice=M(0x6aaee0,{metal:.45}), ice2=M(0xc8ecff,{metal:.7}), deep=M(0x2a5a9a,{metal:.3}), eye=M(0xe8ffff,{glow:true});
  const shard=(p,r,h,m,x,y,z,rx=0,ry=0,rz=0)=>{ const o=add(p,G.oct(1),m,x,y,z,rx,ry,rz); o.scale.set(r,h,r*.8); return o; };
  const hips=grp(root,0,.55,0), torso=grp(hips,0,.05,0);
  shard(torso,.17,.36,ice,0,.3,0); shard(torso,.12,.26,deep,0,.12,.02); shard(torso,.1,.22,ice2,.05,.38,.08,0,.5,0);
  // one shoulder bristles with ice spikes
  const sp=grp(torso,.2,.48,0); for(let i=0;i<6;i++) shard(sp,.05,.22-i*.015,i%2?ice2:ice,(i%3)*.04,.05,(i-2.5)*.04,0,0,-.5-i*.18);
  shard(torso,.07,.1,ice,-.2,.46,0);
  const head=grp(torso,0,.62,.04); shard(head,.15,.15,ice,0,.08,0); shard(head,.06,.2,ice2,0,.22,-.05,-.4,0,0); for(const s of [1,-1]) add(head,G.box(.05,.03,.03),eye,.065*s,.09,.12,0,0,.3*s);
  shard(head,.08,.04,deep,0,.0,.1);
  const L={}; for(const s of [1,-1]){ const n=s>0?'L':'R'; const lg=grp(hips,.1*s,0,0); shard(lg,.06,.18,deep,0,-.16,0); const kn=grp(lg,0,-.32,0); shard(kn,.05,.14,ice,0,-.1,0); shard(kn,.06,.05,ice2,0,-.22,.04);
    const ar=grp(torso,.2*s,.42,0); shard(ar,.05,.16,ice,0,-.14,0); const el=grp(ar,0,-.3,0); shard(el,.05,.2,ice2,0,-.16,.02); L['leg'+n]=lg; L['knee'+n]=kn; L['arm'+n]=ar; L['el'+n]=el; }
  const fx=LAB.motes(root,0xbfe8ff,.9,.5);
  return {root, apply:(g)=>{ hips.position.y=.55-.03*g.bob-.05*g.wind; L.legL.rotation.x=-.6*g.step; L.legR.rotation.x=.6*g.step; L.kneeL.rotation.x=.6*Math.max(0,g.stepC); L.kneeR.rotation.x=.6*Math.max(0,-g.stepC);
    torso.rotation.x=.35*g.strike-.25*g.wind-.35*g.hurt+.1*Math.abs(g.step); hips.position.z=.25*g.strike;
    L.armL.rotation.x=.5*g.step-2*g.strike+.8*g.wind-2.4*g.raise; L.armR.rotation.x=-.5*g.step-1.6*g.strike+.6*g.wind-2.4*g.raise; L.armL.rotation.z=.3+.3*g.hurt; L.armR.rotation.z=-.3-.3*g.hurt; L.elL.rotation.x=L.elR.rotation.x=-.5;
    head.rotation.x=-.3*g.hurt; fx.update(g.raise,g.t); }}; });

mon('beetle','Enemies','Volt Beetle','unit:beetle',()=>{ const root=grp(null), body=grp(root,0,.42,0), sh=M(0x1c2a4e,{metal:.85}), sh2=M(0x0c1020,{metal:.6}), leg=M(0x0a0c14,{metal:.4}), wing=M(0x6a7aa8,{soft:true,side:DS}), wingV=M(0x2a3460,{side:DS}), y=M(0xffe45a,{glow:true}), y2=M(0xfffbd0,{glow:true});
  add(body,G.sph(.3,12,8),sh2,0,-.02,.02).scale.set(1,.55,1.25);
  const els=[]; for(const s of [1,-1]){ const e=grp(body,.02*s,.04,.18); add(e,G.cap(.34,.5,14,8),sh,.15*s,0,-.22,0,0,0).scale.set(.5,.62,1.08); add(e,G.box(.012,.03,.6),y,.02*s,.2,-.22); els.push(e); }
  // scarab wings fold out from under the shell
  const wings=[]; for(const s of [1,-1]){ const w=grp(body,.06*s,.12,.05); const blade=add(w,G.leaf(.22,.85),wing,0,0,0,-PI/2+.1,0,0); blade.scale.set(1,1,.6);
    add(w,G.box(.01,.012,.75),wingV,.05*s,.01,-.38); add(w,G.box(.01,.012,.5),wingV,-.03*s,.01,-.3); wings.push(w); }
  const head=grp(body,0,.0,.4); add(head,G.sph(.15,10,8),sh2,0,0,0).scale.set(1.1,.8,1); add(head,G.box(.32,.04,.08),sh,0,.03,.12);
  add(head,G.tube([[0,.05,.1],[0,.22,.2],[0,.36,.18],[0,.42,.08]],.05,.015,10,5),sh,0,0,0); for(const s of [1,-1]) add(head,G.box(.05,.035,.03),y,.08*s,.04,.14);
  for(const s of [1,-1]) add(head,G.tube([[.1*s,-.04,.12],[.14*s,.02,.24],[.2*s,.08,.28]],.02,.008,6,4),leg,0,0,0);
  const legs=[]; for(const s of [1,-1]) for(let i=0;i<3;i++){ const l=grp(body,.18*s,-.1,.22-i*.2); add(l,G.tube([[0,0,0],[.22*s,.08,(1-i)*.05],[.34*s,-.32,(1-i)*.12]],.035,.018,8,4),leg,0,0,0);
    for(let k=0;k<3;k++) add(l,G.cone(.012,.05,3),leg,(.24+k*.03)*s,-.04-k*.08,(1-i)*.07,0,0,s*1.2); legs.push([l,s,i]); }
  const arcs=grp(body); const arc1=LAB.bolt(arcs,[.0,.42,.45],[.26,.25,.0],y,y2,5,.08,.03), arc2=LAB.bolt(arcs,[0,.42,.45],[-.26,.25,-.1],y,y2,5,.08,.03), arc3=LAB.bolt(arcs,[.2,.2,-.2],[-.2,.24,-.35],y2,y,4,.07,.03);
  const fx=LAB.motes(root,EL.storm,.7,.5);
  return {root, apply:(g,m)=>{ body.position.y=.42+.02*g.bob+.08*g.strike+.12*g.raise; body.rotation.x=-.25*g.wind+.2*g.strike-.25*g.hurt; body.position.z=.3*g.strike;
    const open=Math.max(.15+.08*wob(g),g.raise,g.wind*.6,g.strike); els.forEach((e,i)=>{ e.rotation.z=(i?1:-1)*.85*open; e.rotation.x=-.25*open; });
    const flap=m==='idle'?.1*wob(g,2):Math.sin(g.t*PI*8)*.35; wings.forEach((w,i)=>{ const s=i?-1:1; w.rotation.y=s*(.15+1.25*open); w.rotation.z=s*(.35*open+flap*open); w.visible=open>.2; });
    head.rotation.x=.3*g.strike-.2*g.wind;
    legs.forEach(([l,s,i])=>{ l.rotation.x=.45*Math.sin(g.t*PI*2+i*2+(s>0?0:PI))*(g.step?1:0); l.rotation.z=.1*g.hurt*s; });
    const fl=(g.t*6|0)%3; arc1.visible=fl!==1||g.raise>.3; arc2.visible=fl!==2||g.strike>.3; arc3.visible=fl!==0||g.raise>.3; fx.update(g.raise,g.t); }}; });

mon('ram','Enemies','Thunder Ram','unit:ram',()=>{ const root=grp(null), fur=M(0x3e3424,{soft:true}), fur2=M(0x26301a,{soft:true}), fur3=M(0x5a4a30,{soft:true}), hoof=M(0x0e0a08), horn=M(0xe8dcbc,{metal:.3}), dk=M(0x1a140e), eye=M(0xfff060,{glow:true}), eye2=M(0xffb030,{glow:true});
  const body=grp(root,0,1.05,0); add(body,G.sph(.4,14,10),fur,0,0,0).scale.set(.85,.85,1.45); add(body,G.robe([[.3,-.45],[.36,-.2],[.34,.1],[.01,.32]],6,.05,20),fur2,0,0,-.05).scale.set(1.05,1,1.6);
  add(body,G.sph(.32,10,8),fur3,0,.12,.38).scale.set(1,1,1.1);
  const neck=grp(body,0,.2,.55); add(neck,G.cyl(.15,.2,.5,10),fur,0,.18,.05,.5); const head=grp(neck,0,.45,.18);
  add(head,G.box(.26,.26,.4),fur,0,0,.08); add(head,G.box(.18,.16,.2),dk,0,-.06,.3); add(head,G.box(.28,.06,.08),fur2,0,.1,.18);
  for(const s of [1,-1]){ add(head,G.box(.06,.04,.03),eye,.12*s,.06,.24,0,0,-.3*s);
    // the eye trail: a streak that stretches out behind the glowing eye
    const tr=grp(head,.13*s,.06,.22); tr.userData.trail=1; add(tr,G.box(.035,.03,.25),eye2,0,0,-.13); add(tr,G.box(.02,.02,.2),eye,.01*s,.01,-.33); head.userData['tr'+s]=tr; }
  add(head,G.cone(.09,.28,6),fur2,0,-.26,.15,PI);
  for(const s of [1,-1]){ add(head,G.tube([[.11*s,.12,0],[.3*s,.25,-.1],[.4*s,.1,-.25],[.34*s,-.12,-.12],[.24*s,-.05,.05]],.07,.03,14,6),horn,0,0,0);
    add(head,G.tube([[.08*s,.15,-.05],[.16*s,.45,-.1],[.3*s,.72,-.12],[.42*s,.9,-.1]],.035,.015,10,5),horn,0,0,0); add(head,G.tube([[.2*s,.55,-.1],[.06*s,.8,-.1]],.025,.012,6,4),horn,0,0,0); }
  const legs=[]; for(const [x,z] of [[.2,.42],[-.2,.42],[.2,-.42],[-.2,-.42]]){ const l=grp(body,x,-.25,z); add(l,G.cyl(.08,.06,.45,6),fur,0,-.22,0); const k=grp(l,0,-.45,0); add(k,G.cyl(.055,.045,.36,6),dk,0,-.18,0); add(k,G.cyl(.065,.065,.08,6),hoof,0,-.38,0); legs.push([l,k,x*z>0?0:PI]); }
  const spark=LAB.motes(root,EL.storm,1.6,.7);
  return {root, apply:(g)=>{ body.position.y=1.05+.02*g.bob; body.rotation.x=.25*g.strike-.15*g.wind-.15*g.hurt; body.position.z=.6*g.strike-.15*g.wind; neck.rotation.x=.7*g.strike+.5*g.wind-.3*g.raise-.3*g.hurt;
    const sp=.6+.6*Math.abs(g.step)+1.2*g.strike+.3*wob(g,2); for(const s of [1,-1]) head.userData['tr'+s].scale.set(1,1,sp);
    legs.forEach(([l,k,ph])=>{ const s=Math.sin(g.t*PI*2+ph)*(g.step?1:0); l.rotation.x=.5*s-.3*g.strike; k.rotation.x=.5*Math.max(0,Math.cos(g.t*PI*2+ph))*(g.step?1:0); }); spark.update(g.raise+g.strike*.5,g.t); }}; });

hum('shade','Enemies','Shade','unit:shade',{slender:true, legK:1.35, armLen:1.35, scale:1.05, headK:1.15, skin:0x10141f, face:'void', eyes:0x9fe4ff, robe:0x161c2c, robeDk:0x0c101a, top:0x161c2c, legs:0x10141f, shins:'skin', boot:'skin', skirt:'none', sleeve:'tight', sleeveC:0x161c2c,
  belt:false, rags:true, cape:0x0c101a, capeLen:1.4, capeHem:0x2a3a5a, handClaws:0x9fb4d0, ears:'none', fx:0x9fe4ff, noOrb:true, seed:11,
  onPose:(R,P)=>{ R.torso.rotation.x+=.22; R.head.rotation.x-=.15; R.head.rotation.z=.12*Math.sin(P.t*PI*2); }});

mon('sprite','Enemies','Halo Sprite','unit:sprite',()=>{ const root=grp(null), body=grp(root,0,.35,0), por=M(0xe8e4f0,{metal:.2}), crack=M(0x2a2440), k=M(0x05030a), rib=M(0x3a4a8a,{soft:true,side:DS}), rib2=M(0xb8c8f0,{soft:true,side:DS}), halo=M(0xffe9a0,{glow:true}), eye=M(0xbfe8ff,{glow:true}), claw=M(0x1a1830);
  // a cracked porcelain mask over a body of torn ribbons, spiked halo, long thin claws
  const head=grp(body,0,1.15,0); add(head,G.sph(.2,12,10),por,0,0,0).scale.set(.85,1.15,.75);
  for(const s of [1,-1]){ add(head,G.sph(.055,8,6),k,.07*s,.04,.13).scale.set(1,1.5,.5); add(head,G.sph(.018,5,4),eye,.07*s,.03,.15); add(head,G.box(.012,.12,.01),k,.07*s,-.1,.145,0,0,.1*s); }
  add(head,G.box(.1,.012,.01),k,0,-.13,.14); add(head,G.box(.012,.14,.01),crack,-.04,.1,.15,0,0,.5);
  const ribs=[]; for(let i=0;i<9;i++){ const a=i/9*PI*2, r=grp(body,Math.sin(a)*.14,.95,Math.cos(a)*.1); r.rotation.y=a; add(r,G.cloth(.12,.9+(i%3)*.25,.6,1,.04,.01),i%2?rib:rib2,0,0,0); ribs.push([r,i]); }
  add(body,G.cone(.2,.5,8),rib,0,.85,0,PI); add(body,G.cap(.17,.5,10,6),M(0x2a3460,{soft:true}),0,.95,0);
  const h=grp(body,0,1.2,-.14); h.rotation.x=PI/2-.25; add(h,G.tor(.3,.022,5,24),halo,0,0,0); for(let i=0;i<10;i++){ const a=i/10*PI*2; add(h,G.cone(.025,.14,4),halo,Math.cos(a)*.38,Math.sin(a)*.38,0,0,0,a-PI/2); }
  const arms=[]; for(const s of [1,-1]){ const a=grp(body,.17*s,.92,0); add(a,G.cyl(.022,.018,.5,5),M(0xd8d4e4),0,-.25,0); const e=grp(a,0,-.5,0); add(e,G.cyl(.018,.014,.45,5),M(0xd8d4e4),0,-.22,0);
    for(let i=0;i<3;i++) add(e,G.cone(.012,.18,4),claw,(i-1)*.025,-.52,.02,PI-.2*(i-1),0,0); arms.push([a,e,s]); }
  const fx=LAB.motes(root,0xffe9a0,1.0,.5);
  return {root, apply:(g)=>{ body.position.y=.35+.08*g.bob+.15*g.raise; body.rotation.x=.4*g.strike-.3*g.wind-.4*g.hurt; body.position.z=.4*g.strike;
    head.rotation.z=.25*Math.sin(g.t*PI*2)*(g.m==='idle'?1:.3)+.4*g.hurt; head.rotation.x=.2*g.strike;
    ribs.forEach(([r,i])=>{ r.rotation.x=.2*wob(g,1,i)+.4*Math.abs(g.step)+.3*g.raise; }); h.rotation.z=g.t*PI*2/10;
    arms.forEach(([a,e,s])=>{ a.rotation.x=-1.8*g.strike+.6*g.wind-1.2*g.raise; a.rotation.z=s*(.35+.6*g.raise+.3*g.hurt); e.rotation.x=-.6-.6*g.wind+.4*g.strike; }); fx.update(g.raise,g.t); }}; });

/* ---------- humanoid foes ---------- */
hum('cultist','Enemies','Ember Cultist','unit:cultist',{skin:0x0a0806, face:'void', eyes:0xff8a2a, robe:0x1a221c, robeDk:0x0e1410, top:0x1a221c, hat:{type:'hood',c:0x141c16}, mantle:0x101612, cape:0x0e1410, capeHem:0x3a1a0a, capeLen:1.15, rags:true, sleeve:'flared', hem:0x3a1a0a, belt:0x2a1a10,
  weapon:{kind:'staff',head:'flame',c:0xff6a1a,wood:M(0x2a1a10)}, fx:0xffa040, seed:5});
hum('witch_e','Enemies','Frost Witch','unit:witch',{fem:true, legK:1.16, waistK:.82, hipK:1.05, bust:1.15, skin:0xbfe2f6, lashes:true, lips:0x5a8ad0, eyes:0x7ff0ff, eyeGlow:true, brows:false, top:0x3a7ac8, bra:0x2a5ab0, robe:0x6ab0ec, robeDk:0x3a7ac8, skirtC:0x6ab0ec, skirtGap:.9, skirtW:.85, sleeve:'bare', legs:'skin', shins:'skin', boot:0x2a5ab0, bootTall:true,
  hair:{c:0xe8f6ff,style:'long',len:.7}, hat:{type:'icecrown'}, cape:0x9ad4ff, capeHem:0xe8f8ff, belt:0xe8f8ff, buckle:0x9ff0ff, weapon:{kind:'staff',head:'icicle',c:EL.frost,wood:M(0xbfe8ff,{metal:.6})}, fx:EL.frost});
hum('caller','Enemies','Storm Caller','unit:caller',{float:true, skin:0x06070c, face:'void', eyes:0xbfe8ff, robe:0x1e2a44, robeDk:0x121a2e, top:0x1e2a44, hat:{type:'hood',c:0x1a2440}, mantle:0x16203a, cape:0x121a2e, capeLen:1.5, capeHem:0x3a5a8a, rags:true, sleeve:'flared', hem:0x3a5a8a, belt:false,
  castUp:true, bolts:0xffe45a, fx:EL.storm, noOrb:true, seed:3, gloves:0x0a0c14,
  onPose:(R,P)=>{ const w=Math.sin(P.t*PI*2); R.cape.rotation.x=P.cape+.35+.18*w; R.cape.rotation.z=.12*Math.sin(P.t*PI*2+1); R.skirt.rotation.x=-.12-.06*w; R.skirt.rotation.z+=.06*Math.sin(P.t*PI*2+2); }});
hum('warden','Enemies','Grove Warden','unit:warden',{headK:1.02, muscle:true, scale:1.12, skin:0x5a6a30, top:'skin', legs:'skin', shins:'skin', boot:0x3a2a18, eyes:0xd8ff6a, eyeGlow:true, angry:true, ears:'none', skirt:'none', sleeve:'bare', belt:0x3a2a18,
  leaves:{c:[0x3f8a3a,0x5aa844,0x2e6a34], chest:1, skirt:2, per:16, w:.08, h:.22}, vines:{c:0x2e4a1e, n:3, leaf:0x5aa844}, armVines:0x2e4a1e, pads:{c:0x4a3a22, layers:2}, bracers:0x4a3a22,
  hat:{type:'helm',type2:'barbute',c:0x5a4228,c2:0x3a2a18,metal:.1,slit:0xd8ff6a}, weapon:{kind:'spear',wood:M(0x4a3220),metal:M(0x6ab04a),len:1.9}, offhand:{kind:'round',m:M(0x5a4228),rim:M(0x3a6a2a)}, fx:EL.verdant});
hum('paladin','Enemies','Dawn Paladin','unit:paladin',{headK:1.02, muscle:true, scale:1.16, legK:1.06, skin:0xe8dcc8, armor:{c:0xe4e8ee,c2:0xa8b0c0,trim:0xe2b850,chest:true,arms:true,legs:true}, faulds:true, pads:{c:0xe4e8ee,metal:.95,layers:3,r:.18},
  hat:{type:'helm',type2:'great',c:0xe4e8ee,c2:0xe2b850,plume:0xe08a3a}, skirt:'knee', robe:0xf0ece2, tabard:0x3a62b8, cape:0x2a4a9a, capeHem:0xe2b850, hem:0xe2b850, belt:0x6b3f24, weapon:{kind:'banner',cloth:M(0x3a62b8)}, fx:EL.light});
hum('knight','Enemies','Hex Knight','unit:knight',{headK:1.02, muscle:true, scale:1.2, legK:1.06, bodyW:1.05, skin:0x2a2a30, armor:{c:0x22222a,c2:0x0e0e14,trim:0xa77aff,chest:true,arms:true,legs:true,metal:1}, faulds:true, pads:{c:0x22222a,metal:1,layers:3,r:.19,spike:3,spikeC:0x3a3a44},
  hat:{type:'helm',type2:'knight',c:0x22222a,c2:0x0e0e14,slit:0xb88aff,spikes:true}, skirt:'none', cape:0x1a1024, capeHem:0x4a2a6a, rags:true, belt:0x0e0e14,
  weapon:{kind:'sword',metal:M(0x30303a,{metal:1}),guard:M(0x0e0e14,{metal:.9}),c:EL.shadow,len:1.0}, offhand:{kind:'kite',m:M(0x22222a,{metal:1}),rim:M(0x4a4a58,{metal:1}),c:EL.shadow}, fx:EL.shadow});

/* ---------- skeletons ---------- */
const skel=(id,group,name,ref,spec,extra)=>hum(id,group,name,ref,Object.assign({skel:true, face:'skull', bone:0xe0d8c0, skirt:'none', belt:false},spec),extra);
LAB.skel=skel;

/* ---------- boss minions ---------- */
mon('rootnode','Boss minions','Root Node','unit:rootnode',()=>{ const root=grp(null), bark=M(0x5a3e22), bark2=M(0x3a2814), bark3=M(0x7a5a34), leaf=M(0x2e6a22,{soft:true}), leaf2=M(0x4a8a2a,{soft:true}), moss=M(0x4a6a22,{soft:true}), eye=M(0xf0ff6a,{glow:true}), k=M(0x0e0804), tooth=M(0xc8b088);
  const body=grp(root); add(body,G.robe([[.62,0],[.5,.25],[.46,.6],[.55,1.0],[.62,1.3],[.5,1.6],[.3,1.75]],11,.07,34),bark,0,0,0);
  for(let i=0;i<7;i++){ const a=i/7*PI*2+.2; add(body,G.tube([[Math.sin(a)*.45,.25,Math.cos(a)*.45],[Math.sin(a)*.75,.08,Math.cos(a)*.75],[Math.sin(a)*1.0,-.02,Math.cos(a)*1.0]],.12,.03,8,5),bark2,0,0,0); }
  // brow, glowing eyes and a beast's maw full of splinter teeth
  add(body,G.box(.62,.12,.14),bark3,0,1.36,.5,.2); for(const s of [1,-1]){ add(body,G.sph(.1,8,6),k,.16*s,1.24,.52).scale.set(1.4,.9,.5); add(body,G.box(.13,.07,.05),eye,.16*s,1.24,.57,0,0,.35*s); }
  const jaw=grp(body,0,.9,.5); add(jaw,G.box(.5,.28,.12),k,0,.05,-.02); for(let i=0;i<6;i++){ add(jaw,G.cone(.035,.16,4),tooth,(i-2.5)*.08,.2,.04,PI); add(jaw,G.cone(.03,.13,4),tooth,(i-2.5)*.08+.04,-.08,.04); }
  add(jaw,G.box(.56,.08,.14),bark3,0,-.13,0);
  for(const [x,y,z,r] of [[.4,.5,.3,.12],[-.35,.7,.35,.1],[.3,1.0,.42,.09]]) add(body,G.rock(r,(x*10|0)+4,.3,0),moss,x,y,z);
  // gnarled arms of root and branch with clawed twig fingers
  const arms=[]; for(const s of [1,-1]){ const a=grp(body,.5*s,1.35,0); add(a,G.sph(.2,8,6),bark,0,0,0); add(a,G.tube([[0,0,0],[.25*s,-.25,.1],[.35*s,-.6,.15]],.17,.12,8,7),bark,0,0,0);
    const e=grp(a,.35*s,-.6,.15); add(e,G.tube([[0,0,0],[.05*s,-.3,.12],[.02*s,-.55,.15]],.12,.08,8,6),bark2,0,0,0); for(let i=0;i<4;i++) add(e,G.tube([[0,-.52,.15],[(i-1.5)*.07,-.7,.25],[(i-1.5)*.1,-.82,.3]],.04,.012,6,4),bark3,0,0,0); arms.push([a,e,s]); }
  const crown=grp(body,0,1.65,-.05); for(const s of [1,-1]){ add(crown,G.tube([[.1*s,0,0],[.3*s,.3,0],[.36*s,.6,-.05],[.5*s,.75,0]],.08,.02,10,5),bark2,0,0,0); add(crown,G.tube([[.3*s,.3,0],[.55*s,.42,0]],.04,.015,5,4),bark2,0,0,0); }
  for(const [x,y,z,r] of [[.32,.4,0,.22],[-.34,.45,.05,.24],[0,.55,-.12,.28],[.52,.75,0,.15],[-.52,.75,0,.16]]) add(crown,G.rock(r,(x*10|0)+5,.25,1),(x>0?leaf2:leaf),x,y,z);
  const fx=LAB.motes(root,0xe8ff6a,1.4,.9);
  return {root, apply:(g)=>{ body.rotation.x=-.1*g.hurt+.06*g.strike; body.scale.y=1+.02*g.bob+.04*g.raise; crown.rotation.z=.05*Math.sin(g.t*PI*2); jaw.rotation.x=.08+.35*g.raise+.3*g.hurt+.04*g.bob;
    arms.forEach(([a,e,s])=>{ a.rotation.x=-1.4*g.raise+.05*g.bob; a.rotation.z=s*(.1+.5*g.raise+.3*g.hurt); e.rotation.x=-.4-.4*g.raise; }); fx.update(g.raise,g.t); }}; },{cell:112, moves:['idle','cast','hurt'], note:'Stands still in the game, so it has only stand, cast and hurt.'});
hum('sapling','Boss minions','Sapling','unit:sapling',{slender:true, scale:.72, headK:1.42, armK:.8, legW:.8, skin:0x9a7040, top:'skin', legs:'skin', shins:'skin', boot:'skin', skirt:'none', sleeve:'bare', belt:false, eyes:0xe8ff6a, eyeGlow:true, ears:'none', brows:false,
  hat:{type:'antlers',c:0x7a5a34}, leaves:{c:[0x6ab04a,0x9ad04a], chest:1, per:8, w:.05, h:.12}, handClaws:0x5a3a1e, fx:EL.verdant});
skel('clone','Boss minions','Hollow Clone','unit:clone',{eyes:0xb08aff, hat:{type:'helm',type2:'open',c:0x4a4a5a,c2:0x2a2a36}, robe:0x1c1d2c, robeDk:0x12131e, skirt:'long', skirtGap:1.4, skirtC:0x1c1d2c, sleeve:'flared', cape:0x12131e, capeLen:1.3, capeHem:0x2a2a3a, rags:true, mantle:0x1c1d2c,
  weapon:{kind:'scythe',wood:M(0x2a2a3a),metal:M(0xa8a8c0,{metal:1}),c:0xb08aff,len:2.1}, fx:0xb08aff});

/* ---------- heroes summoned by cards ---------- */
hum('hero_pyra','Heroes','Pyra','unit:hero_pyra',{fem:true, legK:1.14, waistK:.82, hipK:1.08, bust:1.25, scale:1.05, skin:0xc8382a, lashes:true, lips:0x4a0a0a, eyes:0xffe45a, eyeGlow:true, brows:false, ears:'elf',
  top:'skin', bra:0x1a0a0a, robe:0x1a0a0a, skirt:'mini', skirtC:0x2a0e0a, hem:0xffa040, skirtGap:1.2, legs:'skin', shins:'skin', boot:0x1a0a0a, bootTall:true, belt:0xffa040, bracers:0xffa040,
  hair:{c:0xff6a1a,style:'flame',glow:true}, horns:{c:0x1a0a0a,type:'back',size:1.3,metal:.6}, tail:{c:0xa82a1e,tip:0x1a0a0a}, wings:0x5a1010, wingType:'bat',
  weapon:{kind:'staff',head:'flame',c:0xff7a2a,wood:M(0x1a0a0a)}, fx:0xffa040});
hum('hero_ysolde','Heroes','Ysolde','unit:hero_ysolde',{fem:true, legK:1.12, waistK:.84, hipK:1.06, bust:1.2, skin:0x9ac08a, lashes:true, lips:0x7a1a2a, eyes:0xb8ff6a, eyeGlow:true, browC:0x3a5a2a,
  top:'skin', robe:0x2a5a2a, skirt:'none', legs:'skin', shins:'skin', boot:0x3a2a18, belt:false,
  leaves:{c:[0x2e6a34,0x4a8a3a,0x8a6a2a,0x6a2a2a], chest:1, skirt:3, per:13, w:.075, h:.2, step:.1}, bra:0x2e6a34, vines:{c:0x2a4a1a, n:3, leaf:0x4a8a3a}, armVines:0x2a4a1a,
  hair:{c:0x8a1e2a,style:'vines',len:.75,leaf:0x3a7a34}, hat:{type:'thorns',c:0x3a2a14}, weapon:{kind:'staff',head:'leaf',c:EL.verdant,wood:M(0x3a2a14)}, fx:EL.verdant},{note:'A withered goddess of the wild: leaves and vines, a few dead leaves among the green.'});
hum('hero_volta','Heroes','Volta','unit:hero_volta',{muscle:true, scale:1.24, bodyW:1.12, skin:0xe8b890, eyes:0xe8f8ff, eyeGlow:true, angry:true, top:'skin', robe:0xf4f0e6, robeDk:0xd8d0bc, skirt:'knee', hem:0xe2b850, straps:0xf4f0e6, strap1:true, belt:0xe2b850, bracers:0xe2b850, boot:0x8a5a2a,
  hair:{c:0xf4f4f4,style:'long',len:.4}, beard:{c:0xf4f4f4,len:.42}, hat:{type:'laurel',c:0xe2b850}, cape:0x2e4a9a, capeHem:0xe2b850, castUp:true, bolts:0xffe45a,
  weapon:{kind:'bolt',c:EL.storm}, fx:EL.storm},{cell:112});
hum('hero_thornfather','Heroes','Thornfather','unit:hero_thornfather',{muscle:true, scale:1.22, bodyW:1.1, skin:0x7a5030, eyes:0xc8ff6a, eyeGlow:true, angry:true, brows:false, ears:'none', top:'skin', legs:'skin', shins:'skin', boot:'skin', skirt:'none', sleeve:'bare', belt:0x3a2414,
  grain:0x5a3a20, thorns:{c:0x2a1a0e,n:16}, pads:{c:0x3a2414,spike:3,spikeC:0x2a1a0e,layers:2}, armThorns:0x2a1a0e, vines:{c:0x3a2414,n:2}, leaves:{c:[0x4a7a2a,0x6a5a2a], skirt:2, per:14, w:.08, h:.22},
  beard:{c:0x4a6a2a,len:.3}, hat:{type:'antlers',c:0xd8c8a0}, weapon:{kind:'staff',head:'antler',c:0xb8ff6a,wood:M(0x3a2414)}, fx:0xb8ff6a},{cell:112});
hum('hero_aurelion','Heroes','Aurelion','unit:hero_aurelion',{fem:true, scale:1.16, legK:1.14, waistK:.85, hipK:1.04, skin:0xf8e4d0, lashes:true, lips:0xd06a7a, eyes:0x2a6a5a, browC:0xb08a40,
  armor:{c:0xe8c25a,c2:0xb08a30,trim:0xfff0b0,chest:true,bust:true,metal:.95,ridge:false,gorget:false}, pads:{c:0xe8c25a,metal:.95,layers:2,r:.11}, robe:0xfaf6ee, robeDk:0xe0d8c4, skirt:'long', skirtGap:.7, skirtW:1.1, hem:0xe8c25a, legs:'skin', shins:'skin', boot:0xe8c25a, bootTall:true, sleeve:'bare', bracers:0xe8c25a, belt:0xe8c25a,
  hair:{c:0xf6d47a,style:'long',len:.95}, hat:{type:'tiara',c:0xe8c25a,gem:0x7ff0c0}, wings:0xfbf8f0, cape:0xfaf6ee, capeHem:0xe8c25a, capeLen:1.2,
  weapon:{kind:'spear',wood:M(0xe8c25a,{metal:.9}),metal:M(0xfff6d0,{metal:1}),len:2.1}, offhand:{kind:'round',m:M(0xe8c25a,{metal:.95}),rim:M(0xfff0b0,{metal:1})}, offK:.95, fx:EL.light},{cell:112});
mon('hero_widow','Heroes','The Widow','unit:hero_widow',()=>{ const root=grp(null), body=grp(root,0,.8,0), ch=M(0x0c0a10,{metal:.85}), ch2=M(0x1e1a24,{metal:.7}), red=M(0xd0141e,{glow:true}), web=M(0xe8e4f0,{soft:true}), fang=M(0xe8e0d0);
  // the spider: a glossy black abdomen with the red hourglass, webbing over it
  const ab=grp(body,0,.25,-.6); add(ab,G.sph(.55,16,12),ch,0,0,0).scale.set(1,.9,1.2);
  const hg=grp(ab,0,.42,-.15); hg.rotation.x=-.5; add(hg,G.cone(.11,.2,3),red,0,.1,0,PI); add(hg,G.cone(.11,.2,3),red,0,-.1,0);
  for(let i=0;i<5;i++) add(ab,G.tor(.5-Math.abs(i-2)*.1,.008,3,24),web,0,(i-2)*.18,0,PI/2).scale.set(1,1.2,1);
  for(let i=0;i<6;i++) add(ab,G.tor(.56,.008,3,24,PI),web,0,0,0,0,i*PI/6,PI/2).scale.set(1.2,.9,1);
  add(body,G.sph(.3,12,8),ch2,0,.1,.0).scale.set(1,.7,1.2);
  // a woman's torso rises from the spider's head, armoured in web
  const H=LAB.humanoid({fem:true, float:true, skirt:'none', skin:0x8a8098, top:'skin', bust:1.15, waistK:.8, face:'normal', eyes:0xff2a2a, eyeGlow:true, brows:false, sclera:false, lips:0x5a0a1a, fangs:true, lashes:true,
    hair:{c:0x14101a,style:'long',len:.6}, webs:0xe8e4f0, sleeve:'bare', handClaws:0xd0141e, belt:false, hat:{type:'crown',c:0x1a1620,gem:0xd0141e}, fx:0xd0141e, noOrb:true, armLen:1.15});
  H.root.position.set(0,-.25,.18); H.root.scale.setScalar(1.05); body.add(H.root);
  for(const s of [1,-1]) for(let i=0;i<2;i++) add(H.head,G.sph(.014,5,4),red,(.03+i*.03)*s,.2+i*.02,.15);
  const legs=[]; for(const s of [1,-1]) for(let i=0;i<4;i++){ const l=grp(body,.2*s,.1,.28-i*.18); l.rotation.y=s*(-.5+i*.38)*-1;
    add(l,G.tube([[0,0,0],[.4*s,.7,0],[.75*s,.95,0],[1.05*s,-.82,0]],.055,.016,18,6),i%2?ch:ch2,0,0,0); add(l,G.sph(.065,8,6),ch2,.4*s,.7,0); add(l,G.sph(.06,8,6),red,.75*s,.95,0); legs.push([l,s,i]); }
  const fx=LAB.motes(root,0xd0141e,1.6,.9);
  return {root, apply:(g,m)=>{ body.position.y=.8+.03*g.bob+.1*g.raise; body.rotation.x=.15*g.strike-.2*g.wind-.15*g.hurt; body.position.z=.3*g.strike;
    const P=LAB.HMOVES[m==='attack'?'attack':m==='cast'?'cast':m==='hurt'?'hurt':'idle'].pose(g.t,H); P.hipsY=.95; LAB.poseHumanoid(H,P);
    legs.forEach(([l,s,i])=>{ const w=g.step?Math.sin(g.t*PI*2+i*1.6+(s>0?0:PI)):0; l.rotation.x=.3*w; l.rotation.z=s*(.12*Math.max(0,w)+.25*g.raise-.15*g.hurt)+(i<2?-.6*g.strike*s+.3*g.wind*s:0); }); fx.update(g.raise,g.t); }}; },{cell:128});

/* ---------- miniboss helpers ---------- */
mon('mimic','Miniboss helpers','Mimic','mini:mimic',()=>LAB.mimicModel(1),{note:'There is no sprite for this one in the game today (it uses a drawn chest), so this is new.'});
skel('bonewalker','Miniboss helpers','Bonewalker','mini:bonewalker',{eyes:0x8affff, hat:{type:'hood',c:0x2a2a30,point:false}, cape:0x22222a, capeLen:1.15, capeHem:0x3a3a44, rags:true, mantle:0x2a2a30, seed:4,
  weapon:{kind:'sword',metal:M(0x8a7e6a,{metal:.6}),guard:M(0x5a4a3a),len:.7}, offhand:{kind:'round',m:M(0x4a3a2a),rim:M(0x6a6a6a,{metal:.7})}, offK:.8, fx:0x8affff});
hum('jailer','Miniboss helpers','Jailer','mini:jailer',{headK:1.02, muscle:true, scale:1.1, skin:0xc8a888, armor:{c:0x4a4e56,c2:0x26282e,trim:0x7a6a50,chest:true,arms:true,legs:true}, faulds:true, pads:{c:0x4a4e56,metal:.9,layers:3,r:.17,spike:2,spikeC:0x6a6e76},
  hat:{type:'helm',type2:'great',c:0x4a4e56,c2:0x26282e,slit:0xff5a3a,spike:true}, skirt:'none', belt:0x2a1a10, belt2:0x7a6a50, weapon:{kind:'chain'}, offhand:{kind:'shield',m:M(0x3a3e46,{metal:.8}),rim:M(0x6a6e76,{metal:.9})}, fx:0xff7a4a});

/* the mimic, shared by the small one and the giant miniboss */
LAB.mimicModel=function(k,giant){ const root=grp(null), wood=M(0x8a5a32), wood2=M(0x5e3a20), gold=M(0xe2b850,{metal:.9}), teeth=M(0xf4eedc), mouth=M(0x2a0610), gum=M(0x8a1a2a), tongue=M(0xd04a6a), tongue2=M(0xa02a4a), eye=M(0xffe45a,{glow:true});
  const s=k; const base=grp(root,0,.18*s,0); add(base,G.box(1.1*s,.55*s,.75*s),wood,0,.28*s,0); for(const x of [-.5,.5]) add(base,G.box(.08*s,.57*s,.77*s),gold,x*s,.28*s,0); add(base,G.box(1.12*s,.08*s,.77*s),gold,0,.02*s,0);
  add(base,G.box(.95*s,.14*s,.6*s),mouth,0,.5*s,0); add(base,G.box(1.0*s,.04*s,.66*s),gum,0,.56*s,0);
  // fangs: big ones at the corners, rows between
  const T1=[.16,.22,.13,.24,.13,.22,.16]; for(let i=0;i<7;i++){ add(base,G.cone(.06*s,T1[i]*s*1.3,4),teeth,(-.42+i*.14)*s,(.6+T1[i]*.6)*s,.33*s); }
  for(let i=0;i<4;i++) for(const x of [-.47,.47]) add(base,G.cone(.05*s,.18*s,4),teeth,x*s,.66*s,(.2-i*.15)*s);
  // the tongue: low and lolling on the small one; on the giant it rises up and wraps the lid like a scarf
  const tg=grp(base); const tpts=giant?[[0,.55,.1],[0,.95,.4],[.25,1.35,.25],[.5,1.45,-.2],[.35,1.25,-.6],[-.15,1.05,-.65],[-.5,.85,-.35],[-.62,.5,.05]]:[[0,.55,0],[0,.62,.25],[0,.52,.5],[0,.3,.62],[.05,.15,.7]];
  add(tg,G.tube(tpts.map(p=>p.map(v=>v*s)),.13*s,.07*s,giant?30:12,8),tongue,0,0,0); add(tg,G.tube(tpts.map(p=>[p[0]*s,p[1]*s+.05*s,p[2]*s]),.025*s,.02*s,giant?30:12,4),tongue2,0,0,0);
  const lid=grp(base,0,.55*s,-.36*s); const L=add(lid,new THREE.CylinderGeometry(.38*s,.38*s,1.1*s,14,1,false,0,PI),wood2,0,0,.36*s,0,0,PI/2);
  for(const x of [-.5,.5]) add(lid,G.box(.08*s,.08*s,.78*s),gold,x*s,.0,.36*s);
  add(lid,G.box(.12*s,.14*s,.06*s),gold,0,-.02*s,.75*s); add(lid,G.box(.95*s,.1*s,.55*s),mouth,0,-.04*s,.36*s);
  for(let i=0;i<7;i++) add(lid,G.cone(.06*s,T1[6-i]*s*1.3,4),teeth,(-.42+i*.14)*s,-(.06+T1[6-i]*.6)*s,.68*s,PI);
  for(let i=0;i<4;i++) for(const x of [-.47,.47]) add(lid,G.cone(.05*s,.18*s,4),teeth,x*s,-.1*s,(.6-i*.15)*s,PI);
  for(const x of [-.22,.22]){ add(lid,G.box(.14*s,.08*s,.04*s),M(0x1a0408),x*s,.22*s,.6*s,-.6); add(lid,G.box(.1*s,.06*s,.04*s),eye,x*s,.22*s,.62*s,-.6,0,x>0?-.3:.3); }
  const legs=[]; for(const [x,z] of [[.4,.25],[-.4,.25],[.4,-.25],[-.4,-.25]]){ const l=grp(root,x*s,.25*s,z*s); add(l,G.cyl(.05*s,.04*s,.3*s,5),wood2,0,-.15*s,0); legs.push(l); }
  const coins=grp(root); for(let i=0;i<6;i++) add(coins,G.cyl(.06*s,.06*s,.015*s,8),gold,0,0,0,PI/2);
  return {root, apply:(g)=>{ const open=.35+.15*Math.sin(g.t*PI*2)*(g.bob?1:0)+.9*g.strike+.5*g.wind+.6*g.raise+.4*g.hurt+(giant?.25:0); lid.rotation.x=-open; base.position.y=.18*s+.12*s*Math.abs(g.step)+.1*s*g.strike;
    base.rotation.x=.15*g.strike-.1*g.hurt; base.position.z=.3*s*g.strike; tg.rotation.x=giant?-.08*open+.06*Math.sin(g.t*PI*2):-.2*g.strike; tg.scale.set(1,1,giant?1:1+.6*g.strike);
    legs.forEach((l,i)=>l.rotation.x=.5*Math.sin(g.t*PI*2+i*PI/2)*(g.step?1:0));
    coins.visible=g.raise>.1; coins.children.forEach((c,i)=>{ const a=i/6*PI*2+g.t*PI*2; c.position.set(Math.cos(a)*.5*s,(.9+.4*g.raise+((i*.37+g.t)%1)*.3)*s,Math.sin(a)*.3*s); }); }}; };
})();
