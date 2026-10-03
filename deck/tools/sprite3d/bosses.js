/* Area bosses (160 px cells) and minibosses (128 px cells). Same pixels-per-unit as everyone
   else, so they are bigger because the models are bigger, not because the pixels are. */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI, EL=LAB.EL, shade=LAB.shadeHex;
const FRONT=[{name:'front',yaw:-.42}], MOVES5=['idle','walk','cast','attack','hurt'];
const boss=(id,name,ref,build,extra)=>LAB.mon(id,'Bosses',name,ref,build,Object.assign({cell:160},extra||{}));
const mini=(id,name,ref,build,extra)=>LAB.mon(id,'Minibosses',name,ref,build,Object.assign({cell:128},extra||{}));
const miniH=(id,name,ref,spec,extra)=>LAB.hum(id,'Minibosses',name,ref,spec,Object.assign({cell:128},extra||{}));

/* a heavy biped: golems, the ice giant, the construct. parts are given as builders */
function biped(o){ const R={}, root=grp(null); R.root=root; const S=o.size||1;
  R.hips=grp(root,0,1.25*S,0); R.torso=grp(R.hips,0,.1*S,0);
  o.torso(R.torso,S); R.head=grp(R.torso,0,o.neck||1.25*S,o.headZ||.05*S); o.head(R.head,S);
  for(const s of [1,-1]){ const n=s>0?'L':'R';
    const lg=grp(R.hips,.32*s*S,0,0); o.thigh(lg,S,s); const kn=grp(lg,0,-.6*S,0); o.shin(kn,S,s);
    const ar=grp(R.torso,(o.shoulder||.72)*s*S,1.0*S,0); o.upper(ar,S,s); const el=grp(ar,0,-.65*S,0); o.fore(el,S,s);
    R['leg'+n]=lg; R['knee'+n]=kn; R['arm'+n]=ar; R['el'+n]=el; }
  R.fx=LAB.motes(root,o.fx||0xffffff,2.4*S,.9*S);
  R.apply=(g,m)=>{ const sw=g.step; R.hips.position.y=1.25*S-.06*S*Math.abs(sw)+.02*S*g.bob-.08*S*g.wind;
    R.legL.rotation.x=-.4*sw-.25*g.strike; R.legR.rotation.x=.4*sw+.2*g.strike; R.kneeL.rotation.x=.5*Math.max(0,g.stepC); R.kneeR.rotation.x=.5*Math.max(0,-g.stepC)+.3*g.strike;
    R.torso.rotation.x=.25*g.strike-.15*g.wind-.25*g.hurt-.1*g.raise; R.torso.rotation.y=.1*sw+.35*g.wind-.3*g.strike; R.hips.position.z=.3*S*g.strike;
    R.armL.rotation.x=.4*sw-.4*g.wind-1.4*g.raise+.5*g.strike; R.armR.rotation.x=-.4*sw+.9*g.wind-1.9*g.strike-1.4*g.raise; R.armL.rotation.z=.15+.35*g.hurt+.3*g.raise; R.armR.rotation.z=-.15-.35*g.hurt-.3*g.raise;
    R.elL.rotation.x=-.3-.4*g.raise; R.elR.rotation.x=-.3-.8*g.wind+.2*g.strike; R.head.rotation.x=-.25*g.hurt-.2*g.raise+.1*g.strike;
    if(o.extra) o.extra(R,g); R.fx.update(g.raise,g.t); };
  return R; }

/* ---------- Radiant Golem and the Arcane Construct ---------- */
function golem(c){ return biped({ size:c.size||1, fx:c.glow,
  torso:(t,S)=>{ const B=M(c.body,{metal:.8}), B2=M(c.dark,{metal:.7}), g=M(c.glow,{glow:true});
    add(t,G.box(1.1*S,.9*S,.75*S),B,0,.75*S,0); add(t,G.box(.85*S,.45*S,.6*S),B2,0,.15*S,0); add(t,G.cyl(.5*S,.42*S,.2*S,8),B2,0,.38*S,0);
    add(t,G.cyl(.2*S,.2*S,.08*S,10),B2,0,.8*S,.38*S,PI/2); add(t,G.sph(.15*S,10,8),g,0,.8*S,.38*S); for(let i=0;i<4;i++) add(t,G.box(.1*S,.04*S,.03*S),g,(-.35+i*.233)*S,1.1*S,.38*S);
    for(const s of [1,-1]){ add(t,G.cap(.36*S,.5,12,6),B,.66*s*S,1.12*S,0,0,0,-.4*s); add(t,G.box(.06*S,.25*S,.06*S),B2,.85*s*S,1.35*S,0,0,0,-.3*s); }
    if(c.float){ for(let i=0;i<3;i++) add(t,G.oct(.08*S),g,Math.cos(i*2.1)*.75*S,1.6*S,Math.sin(i*2.1)*.5*S); } },
  head:(h,S)=>{ const B=M(c.body,{metal:.8}), g=M(c.glow,{glow:true}); add(h,G.box(.42*S,.4*S,.4*S),B,0,.2*S,0); add(h,G.box(.32*S,.07*S,.05*S),g,0,.22*S,.2*S);
    for(const s of [1,-1]) add(h,G.cone(.08*S,.4*S,6),B,.22*s*S,.45*S,-.02*S,0,0,-.5*s); if(c.antenna){ add(h,G.cyl(.02*S,.02*S,.45*S,4),M(c.dark),0,.6*S,-.05*S); add(h,G.sph(.05*S,6,5),g,0,.85*S,-.05*S); } },
  thigh:(l,S)=>{ add(l,G.cyl(.18*S,.16*S,.6*S,8),M(c.dark,{metal:.7}),0,-.3*S,0); add(l,G.sph(.2*S,8,6),M(c.body,{metal:.8}),0,0,0); },
  shin:(k,S)=>{ const B=M(c.body,{metal:.8}); add(k,G.sph(.16*S,8,6),B,0,0,.03*S); add(k,G.cyl(.2*S,.24*S,.55*S,8),B,0,-.3*S,0); add(k,G.box(.4*S,.14*S,.55*S),M(c.dark,{metal:.7}),0,-.6*S,.08*S); },
  upper:(a,S)=>{ add(a,G.cyl(.15*S,.14*S,.65*S,8),M(c.dark,{metal:.7}),0,-.32*S,0); },
  fore:(e,S,s)=>{ const B=M(c.body,{metal:.8}); add(e,G.sph(.15*S,8,6),B,0,0,0); add(e,G.cyl(.2*S,.25*S,.6*S,8),B,0,-.32*S,0);
    const f=add(e,G.box(.36*S,.3*S,.34*S),M(c.dark,{metal:.7}),0,-.72*S,0); for(let i=0;i<3;i++) add(e,G.box(.07*S,.14*S,.08*S),B,(-.11+i*.11)*S,-.9*S,.12*S);
    if(c.float){ e.children.forEach(m=>{ if(m.position.y<-.6*S) m.position.y-=.12*S; }); } },
  extra:(R,g)=>{ if(c.float){ R.head.position.y=1.25*(c.size||1)+.12*Math.sin(g.t*PI*2)+.1; } } }); }
LAB.ROSTER.push({id:'golem',group:'Bosses',name:'Radiant Golem',ref:'unit:golem',cell:160,views:FRONT,moves:MOVES5,
  build:LAB.creature(()=>golem({body:0xc0843a,dark:0x7a4e22,glow:0xffe9a0,antenna:true}))});

/* ---------- Glacier Queen: an ice giant wearing a crown of ice ---------- */
boss('glacier','Glacier Queen','unit:glacier',()=>{ const ice=M(0x6aa8e0), ice2=M(0x9ad0f4,{metal:.35}), deep=M(0x2e5c9a), crys=M(0xd8f4ff,{metal:.6}), eye=M(0xeaffff,{glow:true});
  return biped({size:1.05, shoulder:.78, fx:0xbfe8ff,
    torso:(t,S)=>{ add(t,G.rock(.62*S,2,.18,1),ice,0,.75*S,0).scale.set(1.25,1.05,.85); add(t,G.rock(.42*S,4,.2,1),deep,0,.15*S,.02).scale.set(1.2,.8,.9);
      for(let i=0;i<5;i++) add(t,G.cone(.1*S,.55*S,5),crys,(-.4+i*.2)*S,(1.15+(i%2)*.15)*S,-.35*S,-.5,0,(-.4+i*.2));
      for(const s of [1,-1]) add(t,G.rock(.32*S,7+s,.25,1),ice2,.7*s*S,1.1*S,0); add(t,G.rock(.18*S,9,.3,0),ice2,.2*S,.9*S,.45*S); add(t,G.rock(.16*S,11,.3,0),ice2,-.22*S,.85*S,.44*S); },
    head:(h,S)=>{ add(h,G.rock(.28*S,5,.18,1),ice,0,.2*S,.05*S); add(h,G.box(.09*S,.05*S,.04*S),eye,.1*S,.24*S,.3*S); add(h,G.box(.09*S,.05*S,.04*S),eye,-.1*S,.24*S,.3*S); add(h,G.box(.2*S,.05*S,.04*S),deep,0,.08*S,.3*S);
      for(let i=0;i<5;i++){ const a=(i-2)*.35; add(h,G.cone(.06*S,(.35+(i===2?.25:0))*S,5),crys,Math.sin(a)*.22*S,.5*S+(i===2?.1:0),Math.cos(a)*.1*S-.02,0,0,-a*.8); } },
    thigh:(l,S)=>add(l,G.rock(.26*S,3,.2,1),ice,0,-.3*S,0).scale.set(1,1.5,1),
    shin:(k,S)=>{ add(k,G.rock(.24*S,4,.22,1),ice2,0,-.28*S,0).scale.set(1,1.4,1); add(k,G.rock(.26*S,5,.2,1),deep,0,-.6*S,.08*S).scale.set(1.1,.5,1.3); },
    upper:(a,S)=>add(a,G.rock(.24*S,6,.2,1),ice,0,-.32*S,0).scale.set(1,1.5,1),
    fore:(e,S)=>{ add(e,G.rock(.26*S,8,.2,1),ice2,0,-.32*S,0).scale.set(1,1.5,1); add(e,G.rock(.3*S,9,.25,1),ice,0,-.78*S,.04*S); for(let i=0;i<3;i++) add(e,G.cone(.06*S,.25*S,4),crys,(-.12+i*.12)*S,-1.02*S,.12*S,PI); } }); });

/* ---------- the Roc: a storm-feathered bird lord ---------- */
boss('roc','Roc','unit:roc',()=>{ const root=grp(null), body=grp(root,0,.6,0), f=M(0xbfd8f0,{soft:true}), f2=M(0x8ab0dc,{soft:true}), f3=M(0x5a7ab0,{soft:true}), beak=M(0xe8c86a,{metal:.4}), eye=M(0xffe45a,{glow:true}), claw=M(0x2a2a3a);
  add(body,G.robe([[.06,-.2],[.3,.2],[.42,.8],[.38,1.4],[.26,1.9],[.01,2.0]],6,.04,24),f,0,0,0); add(body,G.robe([[.3,.6],[.38,1.1],[.32,1.5]],9,.03,24),f2,0,0,.04);
  const head=grp(body,0,2.05,.1); add(head,G.sph(.26,12,10),f,0,0,0); const b=add(head,G.cone(.1,.42,6),beak,0,-.06,.3,PI/2+.5); add(head,G.box(.07,.05,.03),eye,.12,.06,.22); add(head,G.box(.07,.05,.03),eye,-.12,.06,.22);
  for(let i=0;i<5;i++) add(head,G.cone(.05,.5-i*.05,5),i%2?f2:f3,(-.16+i*.08),.25,-.15,-.9+i*.05,0,(-.3+i*.15));
  const wings=[]; for(const s of [1,-1]){ const w=grp(body,.32*s,1.6,-.15); wings.push(w);
    add(w,G.box(1.1,.16,.1),f,s*.55,.25,0,0,0,s*.35); for(let i=0;i<8;i++){ const L=1.1-i*.06; add(w,G.trap(.16,L,.05,.5),i%3===0?f3:i%2?f2:f,s*(.15+i*.14),.25-L/2+i*.05,-.02*i,0,0,s*(.15+i*.05)); } }
  const tail=grp(body,0,0,-.15); for(let i=0;i<5;i++) add(tail,G.trap(.12,.8,.04,.4),i%2?f2:f3,(-.2+i*.1),-.45,-.05*i,0,0,(-.25+i*.12));
  const legs=[]; for(const s of [1,-1]){ const l=grp(body,.15*s,0,.05); add(l,G.cyl(.04,.035,.45,5),beak,0,-.25,0); for(let i=0;i<3;i++) add(l,G.cone(.03,.16,4),claw,(-.06+i*.06),-.5,.08,PI/2+.6); legs.push(l); }
  const arms=[]; for(const s of [1,-1]){ const a=grp(body,.38*s,1.55,.1); add(a,G.cyl(.08,.06,.6,6),f2,0,-.3,0); add(a,G.cone(.06,.25,4),claw,0,-.68,.05,PI); arms.push(a); }
  const fx=LAB.motes(root,EL.storm,2.4,1.0);
  return {root, apply:(g)=>{ body.position.y=.6+.12*g.bob+.2*g.raise+.08*Math.abs(g.step); body.rotation.x=.3*g.strike-.2*g.wind-.3*g.hurt+.15*Math.abs(g.step); body.position.z=.5*g.strike;
    const flap=g.step?Math.sin(g.t*PI*4):Math.sin(g.t*PI*2)*.3; wings.forEach((w,i)=>{ w.rotation.z=(i?-1:1)*(.25*flap+.6*g.raise-.3*g.wind+.2*g.hurt); w.rotation.y=(i?1:-1)*(.3+.3*g.strike); });
    arms.forEach((a,i)=>{ a.rotation.x=-1.6*g.strike+.6*g.wind-.8*g.raise; a.rotation.z=(i?-1:1)*.25; }); head.rotation.x=.3*g.strike-.3*g.raise-.3*g.hurt; tail.rotation.x=.2*Math.sin(g.t*PI*2); fx.update(g.raise,g.t); }}; });

/* ---------- the Wyrm: a coiled fire serpent; its body is a chain of plates on a moving curve ---------- */
boss('wyrm','Ember Wyrm','unit:wyrm',()=>{ const root=grp(null), sc=M(0xe08a2a,{metal:.4}), sc2=M(0xb0561a,{metal:.4}), belly=M(0xf4c86a), horn=M(0xf0e0b0), eye=M(0xfff08a,{glow:true}), fire=M(0xff6a1a,{glow:true}), k=M(0x3a1008);
  const N=30, segs=[]; for(let i=0;i<N;i++){ const u=i/(N-1); const r=u<.2?.16+u*1.3:.42-Math.max(0,u-.6)*.35; const s=grp(root); add(s,G.sph(Math.max(.08,r),12,8),i%2?sc:sc2,0,0,0).scale.set(1,.9,1.15); add(s,G.sph(Math.max(.06,r*.8),8,6),belly,0,-r*.25,r*.45);
    if(i%2===0&&i>5&&i<N-1) add(s,G.cone(.08,.36,4),M(0x8a2a10),0,r*.95,-.04,-.3); segs.push(s); }
  const head=grp(root); head.scale.setScalar(1.45); add(head,G.sph(.32,12,10),sc,0,0,0).scale.set(1,.85,1.25); add(head,G.trap(.36,.42,.16,.7),sc2,0,-.06,.34,PI/2); add(head,G.box(.3,.06,.36),k,0,-.18,.3);
  const jaw=grp(head,0,-.18,.1); add(jaw,G.box(.32,.08,.45),sc2,0,0,.2); for(let i=0;i<4;i++) add(jaw,G.cone(.025,.08,3),horn,(-.12+i*.08),.06,.38);
  add(head,G.box(.08,.06,.04),eye,.15,.08,.32); add(head,G.box(.08,.06,.04),eye,-.15,.08,.32);
  for(const s of [1,-1]){ add(head,G.tube([[.15*s,.15,-.1],[.3*s,.35,-.3],[.35*s,.5,-.55]],.06,.015,8,5),horn,0,0,0); add(head,G.tube([[.25*s,-.05,0],[.45*s,-.1,-.1]],.03,.01,5,4),horn,0,0,0); }
  const flame=grp(head,0,-.1,.6); for(let i=0;i<4;i++) add(flame,G.cone(.3-i*.06,.7-i*.1,7),i%2?fire:M(0xffd06a,{glow:true}),0,-.05*i,.4+i*.12,-PI/2);
  const arms=[]; for(const s of [1,-1]){ const a=grp(root); add(a,G.tube([[0,0,0],[.25*s,-.15,.1],[.32*s,-.4,.15]],.07,.04,6,5),sc2,0,0,0); for(let i=0;i<3;i++) add(a,G.cone(.025,.12,3),horn,(.3+i*.03)*s,-.45,.15+i*.04,PI); arms.push([a,s]); }
  const fx=LAB.motes(root,0xffa040,2.6,1.0);
  // u: 0 = tail tip, 1 = neck. The tail curls once around on the ground, then the body rises in an S
  const path=(u,g)=>{ const w=Math.sin(g.t*PI*2)*.1+g.step*.12;
    if(u<.42){ const a=u/.42*PI*1.7+.6, rr=.35+u*1.5; return [Math.cos(a)*rr,.18+u*.5,Math.sin(a)*rr*.75-.1]; }
    const v=(u-.42)/.58, x0=Math.cos(PI*1.7+.6)*.98, z0=Math.sin(PI*1.7+.6)*.98*.75-.1;
    return [x0*(1-v)+Math.sin(v*PI*1.3+w*2)*.45*(1-v*.4), .39+v*2.5+.25*g.raise*v, z0*(1-v)+v*(.2+.4*g.strike-.3*g.wind-.25*g.hurt)+Math.cos(v*PI*1.3)*.15]; };
  return {root, apply:(g)=>{ for(let i=0;i<N;i++){ const u=i/(N-1), p=path(u,g), q=path(Math.min(1,u+.02),g); segs[N-1-i].position.set(...p); segs[N-1-i].lookAt(q[0],q[1],q[2]+.0001); }
    const top=path(1,g); head.position.set(top[0],top[1]+.3,top[2]+.22); head.rotation.set(.25*g.strike-.3*g.raise-.4*g.hurt+.2,-.2,0); jaw.rotation.x=.5*g.strike+.4*g.raise+.3*g.hurt+.05;
    flame.visible=g.strike>.4||g.raise>.6; flame.scale.setScalar(.5+.6*Math.max(g.strike,g.raise));
    const a=path(.82,g); arms.forEach(([m,s])=>{ m.position.set(a[0]+.2*s,a[1],a[2]+.1); m.rotation.x=-.8*g.strike+.4*g.wind; }); fx.update(g.raise,g.t); }}; });

/* ---------- the Treant ---------- */
boss('treant','Treant','unit:treant',()=>{ const bark=M(0x6a4a2a), bark2=M(0x4a3220), moss=M(0x5a8a2a,{soft:true}), leaf=M(0x4fa83a,{soft:true}), leaf2=M(0x9ad04a,{soft:true}), gold=M(0xf2d24a,{soft:true}), eye=M(0xe8ff6a,{glow:true}), k=M(0x1a120a);
  return biped({size:1.0, shoulder:.68, neck:1.2, fx:0xe8ff6a,
    torso:(t,S)=>{ add(t,G.robe([[.5,-.1],[.55,.3],[.6,.9],[.5,1.3]],9,.06,30),bark,0,0,0); add(t,G.robe([[.42,-.1],[.5,.4]],7,.05,24),bark2,0,0,0);
      for(const [x,y,z,r] of [[.4,.6,.35,.16],[-.35,.9,.4,.14],[.1,.3,.5,.12]]) add(t,G.rock(r,(y*10|0),.3,0),moss,x,y,z);
      const crown=grp(t,0,1.35,-.05); for(const s of [1,-1]) for(const [a,b,c] of [[.2,.5,.3],[.45,.4,.7],[.15,.8,.9]]) add(crown,G.tube([[0,0,0],[a*s,b,0],[(a+.15)*s,b+.25,-.1],[(a+.3)*s,b+.3,-.05]],.08,.025,10,5),bark2,0,0,0);
      for(const [x,y,z,r,m] of [[0,1.05,-.1,.45,leaf],[.6,.8,0,.32,leaf2],[-.6,.85,0,.34,leaf],[.35,1.3,-.1,.28,gold],[-.38,1.25,-.15,.3,leaf2],[0,.6,-.4,.4,leaf]]) add(crown,G.rock(r,(x*7+y*3|0)+3,.28,1),m,x,y,z); },
    head:(h,S)=>{ h.position.z=.38; add(h,G.box(.42,.12,.08),bark2,0,.3,0); add(h,G.box(.1,.07,.04),eye,.12,.2,.04); add(h,G.box(.1,.07,.04),eye,-.12,.2,.04); add(h,G.box(.26,.1,.05),k,0,-.02,.04); add(h,G.cone(.05,.22,4),bark2,0,.12,.08,PI/2+.4); },
    thigh:(l,S)=>add(l,G.cyl(.2,.17,.6,8),bark,0,-.3,0),
    shin:(k,S)=>{ add(k,G.cyl(.18,.25,.55,8),bark2,0,-.3,0); for(let i=0;i<4;i++){ const a=i/4*PI*2; add(k,G.tube([[0,-.5,0],[Math.sin(a)*.25,-.58,Math.cos(a)*.25+.05],[Math.sin(a)*.38,-.62,Math.cos(a)*.4+.05]],.07,.02,5,4),bark2,0,0,0); } },
    upper:(a,S)=>add(a,G.tube([[0,0,0],[.08,-.3,0],[.05,-.65,.02]],.15,.12,6,6),bark,0,0,0),
    fore:(e,S,s)=>{ add(e,G.tube([[0,0,0],[0,-.35,.05],[0,-.65,.1]],.12,.09,6,6),bark2,0,0,0); for(let i=0;i<4;i++) add(e,G.tube([[0,-.62,.08],[(-.15+i*.1),-.85,.15],[(-.2+i*.13),-1.0,.12]],.04,.012,5,4),bark,0,0,0);
      add(e,G.rock(.13,s>0?3:4,.3,0),leaf,.15*s,-.2,0); } }); });

/* ---------- the Hollow King ---------- */
boss('hollow','Hollow King','unit:hollow',()=>{ const root=grp(null), body=grp(root,0,.4,0), r1=M(0x3a2a6a,{soft:true}), r2=M(0x2a1a4a,{soft:true}), r3=M(0x5a3a9a,{soft:true}), bone=M(0xd8d0f0), eye=M(0xe8b0ff,{glow:true}), vio=M(0xb08aff,{glow:true}), k=M(0x0e0818);
  add(body,G.robe([[.55,0],[.5,.6],[.4,1.4],[.34,2.0],[.3,2.4]],9,.07,34),r1,0,0,0); add(body,G.robe([[.36,1.4],[.42,2.1],[.48,2.5]],7,.05,26),r2,0,0,0);
  for(let i=0;i<4;i++) add(body,G.tor(.2-i*.02,.025,4,12,PI*1.3),bone,0,2.0-i*.12,.2,PI/2,0,-PI*.15);
  add(body,G.oct(.1),vio,0,1.7,.36);
  const head=grp(body,0,2.6,.05); add(head,G.sph(.24,12,10),k,0,0,0).scale.set(1,1.25,1); add(head,G.box(.09,.04,.03),eye,.09,.04,.22); add(head,G.box(.09,.04,.03),eye,-.09,.04,.22);
  add(head,G.cap(.3,.55),r2,0,.05,-.04,-.3); for(let i=0;i<7;i++){ const a=(i-3)*.33; add(head,G.cone(.04,(.42+(i===3?.2:0)-Math.abs(i-3)*.04),5),bone,Math.sin(a)*.24,.32,Math.cos(a)*.12-.04,0,0,-a*.9); }
  for(const s of [1,-1]) add(head,G.tube([[.2*s,.15,-.05],[.42*s,.38,-.1],[.5*s,.7,-.05],[.42*s,.95,0]],.07,.02,10,5),bone,0,0,0);
  const tents=[]; for(let i=0;i<8;i++){ const a=i/8*PI*2+.2; const t=grp(body,Math.sin(a)*.42,.15,Math.cos(a)*.42); t.rotation.y=a; add(t,G.tube([[0,0,0],[0,-.15,.25],[0,-.35,.45],[0,-.4,.7]],.1,.025,10,5),i%2?r1:r3,0,0,0); tents.push(t); }
  const arms=[]; for(const s of [1,-1]){ const a=grp(body,.42*s,2.2,0); add(a,G.cyl(.1,.16,.8,8),r2,0,-.4,0); const e=grp(a,0,-.8,0); add(e,G.cyl(.12,.2,.6,8),r1,0,-.3,0); for(let i=0;i<4;i++) add(e,G.tube([[0,-.6,0],[(-.06+i*.04),-.78,.06],[(-.08+i*.05),-.95,.12]],.025,.008,5,4),bone,0,0,0); arms.push([a,e,s]); }
  const fx=LAB.motes(root,0xb08aff,2.8,1.1);
  return {root, apply:(g)=>{ body.position.y=.4+.1*g.bob+.06*Math.abs(g.step)+.2*g.raise; body.rotation.x=.25*g.strike-.2*g.wind-.3*g.hurt+.12*Math.abs(g.step); body.position.z=.5*g.strike;
    tents.forEach((t,i)=>{ t.rotation.x=.3*Math.sin(g.t*PI*2+i*1.3)+.4*g.raise-.3*g.hurt; });
    arms.forEach(([a,e,s])=>{ a.rotation.x=-1.6*g.strike*(s<0?1:.4)+.7*g.wind-1.9*g.raise; a.rotation.z=s*(.25+.4*g.raise+.3*g.hurt); e.rotation.x=-.4-.5*g.wind; }); head.rotation.x=-.3*g.raise-.3*g.hurt+.15*g.strike; fx.update(g.raise,g.t); }}; },{note:'The tallest of the bosses, as the last one should be.'});

/* ---------- minibosses ---------- */
miniH('executioner','Executioner','mini:executioner',{scale:1.32, bodyW:1.35, skin:0xd0a080, sleeve:'bare', robe:0x4a1810, robeDk:0x32100a, skirt:'short', legs:0x2a1c18, boot:0x1e1410, straps:0x3a2418, belt:0x2a1c14, hat:{type:'hood',c:0x6a0e14}, eyes:0xff5a3a, eyeGlow:true, mantle:false, stripe:false, tabard:0x3a2418, bracers:0x2a1c14,
  weapon:{kind:'axe',double:true,len:1.55,metal:M(0x9aa0a8,{metal:1}),wood:M(0x3a2418)}, fx:0xff5a3a});
miniH('corruptknight','Corrupted Knight','mini:corruptknight',{scale:1.28, bodyW:1.15, skin:0x5a4a6a, robe:0x3a1a5a, robeDk:0x2a1040, trim:0xb08aff, skirt:'short', legs:0x3a3446, sleeve:'tight', armor:{c:0x8a7ea8,c2:0x4a3a68,chest:true,arms:true,legs:true}, pads:{c:0x6a5a8a,metal:.9,spike:true},
  hat:{type:'helm',c:0x7a6e98,horns:0x2a1a3a,slit:0xd08aff}, cape:0x3a1a5a, rags:true, mantle:false, gloves:0x4a3a68, weapon:{kind:'sword',metal:M(0x6a5a8a,{metal:1}),guard:M(0x2a1a3a,{metal:.8}),c:0xd08aff,len:1.05}, offhand:{kind:'kite',m:M(0x4a3a68,{metal:.6}),rim:M(0x8a7ea8,{metal:1}),c:0xd08aff}, fx:0xd08aff});
mini('giant_mimic','Giant Mimic','mini:giant_mimic',()=>LAB.mimicModel(1.75));
miniH('dungeonwarden','Dungeon Warden','mini:dungeonwarden',{scale:1.36, bodyW:1.35, skin:0xb89878, robe:0x3a4048, robeDk:0x2a2e34, skirt:'short', legs:0x2a2e34, sleeve:'tight', armor:{c:0x6a7480,c2:0x48505a,chest:true,arms:true,legs:true}, pads:{c:0x6a7480,metal:.9},
  hat:{type:'helm',c:0x6a7480,slit:0x8adcff}, mantle:false, belt:0x3a2a1e, belt2:0xe2b850, gloves:0x3a2a1e, cape:0x2a2e34, weapon:{kind:'chain'}, offhand:{kind:'chain'}, fx:0x8adcff});
miniH('alchemist','Plague Alchemist','mini:alchemist',{scale:1.22, skin:0xd8c8a8, robe:0x2e4a28, robeDk:0x1e3218, trim:0x9be05a, hat:{type:'beak',c:0xe8dcc0,hat:0x2a2a22,lens:0x9be05a}, cape:0x1e3218, belt:0x5a3a22, belt2:0x9be05a, sleeve:'flared', gloves:0x3a2a1e,
  weapon:{kind:'flask',c:0x9be05a}, offhand:{kind:'flask',c:0xd0ff6a}, fx:0x9be05a});
miniH('assassin','Shadow Assassin','mini:assassin',{scale:1.18, skin:0x3a2a4a, robe:0x2a1a3a, robeDk:0x1a0a26, trim:0x9a6aff, skirt:'short', legs:0x1e1228, sleeve:'tight', hat:{type:'hood',c:0x24142e}, eyes:0xd08aff, eyeGlow:true, cape:0x1a0a26, rags:true, mantle:false, stripe:false, straps:0x3a2a4a, gloves:0x1a0a26,
  weapon:{kind:'dagger',c:0xd08aff}, offhand:{kind:'dagger',c:0xd08aff}, fx:0xd08aff});
LAB.ROSTER.push({id:'construct',group:'Minibosses',name:'Arcane Construct',ref:'mini:construct',cell:128,views:FRONT,moves:MOVES5,
  build:LAB.creature(()=>golem({body:0x4a5ab8,dark:0x2a2a6a,glow:0x9fe8ff,float:true,size:.82}))});
miniH('bonecollector','Bone Collector','mini:bonecollector',{scale:1.25, skin:0xe8e0c8, face:'skull', eyes:0x8affff, robe:0xb8ae94, robeDk:0x8a826c, trim:0x5a4a3a, hat:{type:'witch',c:0xd8d0b8,band:0x5a4a3a}, cape:0x6a6250, rags:true, fur:0x6a5a48, mantle:false,
  weapon:{kind:'staff',head:'skull',c:0x8affff,wood:M(0xe8dcc0)}, fx:0x8affff});
})();
