/* Area bosses (160 px cells) and minibosses (128 px cells). Same pixels-per-unit as everyone
   else, so they are bigger because the models are bigger, not because the pixels are. */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI, EL=LAB.EL, shade=LAB.shadeHex, T=THREE, DS=T.DoubleSide;
const FRONT=[{name:'front',yaw:-.42}], MOVES5=['idle','walk','cast','attack','hurt'];
const boss=(id,name,ref,build,extra)=>LAB.mon(id,'Bosses',name,ref,build,Object.assign({cell:224},extra||{}));
const bossH=(id,name,ref,spec,extra)=>LAB.hum(id,'Bosses',name,ref,spec,Object.assign({cell:224},extra||{}));
const mini=(id,name,ref,build,extra)=>LAB.mon(id,'Minibosses',name,ref,build,Object.assign({cell:176},extra||{}));
const miniH=(id,name,ref,spec,extra)=>LAB.hum(id,'Minibosses',name,ref,spec,Object.assign({cell:176},extra||{}));

/* a heavy biped: golems and constructs. parts are given as builders */
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

/* ---------- steam golems: round riveted plates in copper and iron, a furnace heart, boiler and stacks ---------- */
function steam(c){ const S0=c.size||1;
  const Cu=M(c.body,{metal:.95,facet:true}), Cu2=M(shade(c.body,.7),{metal:.9,facet:true}), Fe=M(c.dark,{metal:.85,facet:true}), Br=M(c.trim||0xe0b050,{metal:.95}), g=M(c.glow,{glow:true}), g2=M(0xfff2c0,{glow:true}), k=M(0x140c08);
  const rivets=(p,r,y,n,S,dz=1)=>{ for(let i=0;i<n;i++){ const a=i/n*PI*2; add(p,G.sph(.03*S,5,4),Br,Math.sin(a)*r,y,Math.cos(a)*r*dz); } };
  return biped({ size:S0, fx:c.glow, shoulder:.78, neck:1.42*S0,
  torso:(t,S)=>{ add(t,G.lathe([[.42*S,-.05*S],[.5*S,.2*S],[.62*S,.6*S],[.66*S,.85*S],[.58*S,1.15*S],[.3*S,1.3*S]],22),Cu,0,0,0).scale.z=.85;
    for(const y of [.3,.7,1.05]) add(t,G.tor((y<.5?.55:y<.9?.66:.6)*S,.035*S,5,22),Fe,0,y*S,0,PI/2).scale.set(1,.85,1);
    rivets(t,.67*S,.78*S,16,S,.85);
    add(t,G.cyl(.26*S,.26*S,.1*S,16),Br,0,.72*S,.5*S,PI/2); add(t,G.cyl(.2*S,.2*S,.1*S,16),k,0,.72*S,.53*S,PI/2); add(t,G.sph(.17*S,12,8),g,0,.72*S,.5*S).scale.set(1,1,.5);
    for(let i=0;i<5;i++) add(t,G.box(.025*S,.3*S,.03*S),Fe,(-.12+i*.06)*S,.72*S,.6*S);
    for(const s of [1,-1]){ add(t,G.cyl(.08*S,.08*S,.03*S,10),Br,.32*s*S,1.0*S,.48*S,PI/2-.2); add(t,G.cyl(.06*S,.06*S,.032*S,10),M(0xf4ead0),.32*s*S,1.0*S,.49*S,PI/2-.2); }
    // boiler on the back with two smokestacks and pipes
    add(t,G.cyl(.32*S,.32*S,.8*S,14),Cu2,0,.75*S,-.55*S); rivets(t,.33*S,1.1*S,10,S); for(const s of [1,-1]){ add(t,G.cyl(.08*S,.1*S,.7*S,8),Fe,.2*s*S,1.35*S,-.6*S); add(t,G.cyl(.12*S,.1*S,.08*S,8),Fe,.2*s*S,1.72*S,-.6*S);
      add(t,G.tube([[.3*s*S,.5*S,-.45*S],[.55*s*S,.6*S,-.3*S],[.6*s*S,.95*S,-.1*S]],.045*S,.045*S,8,6),Br,0,0,0); }
    add(t,G.cap(.6*S,.5,16,6),Cu2,0,1.12*S,0).scale.set(1,.45,.85); },
  // head: an angular helm, a jutting jaw guard and a visor slit (no spheres)
  head:(h,S)=>{ add(h,G.limb([[-.05*S,.26*S,.24*S,.02*S],[.12*S,.3*S,.3*S,0],[.3*S,.26*S,.28*S,-.02*S],[.42*S,.12*S,.16*S,-.04*S]],8),Cu,0,0,0); add(h,G.box(.36*S,.14*S,.2*S),Fe,0,-.02*S,.18*S,.25,0,0); add(h,G.tor(.3*S,.04*S,4,8),Fe,0,.12*S,0,PI/2);
    add(h,G.box(.42*S,.08*S,.1*S),k,0,.2*S,.25*S); add(h,G.box(.34*S,.04*S,.06*S),g,0,.2*S,.29*S); add(h,G.cone(.3*S,.18*S,8),Br,0,.48*S,0);
    for(let i=0;i<5;i++) add(h,G.box(.04*S,.12*S,.04*S),Fe,(-.12+i*.06)*S,.02*S,.26*S);
    if(c.crest) add(h,G.box(.06*S,.25*S,.5*S),Br,0,.5*S,-.02*S); else { add(h,G.cyl(.02*S,.02*S,.4*S,5),Fe,0,.6*S,-.05*S); add(h,G.sph(.06*S,8,6),g,0,.82*S,-.05*S); } },
  thigh:(l,S)=>{ add(l,G.cyl(.22*S,.22*S,.2*S,8),Cu2,0,0,0,0,0,PI/2); add(l,G.limb([[0,.22*S,.22*S],[-.25*S,.24*S,.26*S,.03*S],[-.55*S,.17*S,.18*S]],8),Fe,0,0,0); add(l,G.cyl(.05*S,.05*S,.5*S,6),Br,.15*S,-.3*S,.12*S); },
  shin:(k2,S)=>{ add(k2,G.cone(.2*S,.26*S,6),Cu,0,0,.14*S,PI/2); add(k2,G.cyl(.16*S,.16*S,.3*S,8),Fe,0,0,0,0,0,PI/2); rivets(k2,.2*S,.0,6,S); add(k2,G.lathe([[.2*S,0],[.26*S,-.3*S],[.3*S,-.52*S]],14),Cu,0,0,0); add(k2,G.box(.46*S,.15*S,.6*S),Fe,0,-.6*S,.08*S); add(k2,G.cap(.23*S,.5,10,6),Fe,0,-.55*S,.3*S).scale.set(1,.6,1); },
  // shoulders: a faceted crown plate over stepped lames
  upper:(a,S)=>{ add(a,G.cone(.4*S,.22*S,8),Cu,0,.14*S,0); for(let i=0;i<3;i++) add(a,new THREE.CylinderGeometry((.38-.03*i)*S,(.42-.03*i)*S,.13*S,10,1,true,-PI*.85,PI*1.7),i%2?Br:Cu,0,(.0-.12*i)*S,0); add(a,G.cyl(.15*S,.14*S,.65*S,10),Fe,0,-.32*S,0); add(a,G.cyl(.05*S,.05*S,.55*S,6),Br,0,-.3*S,.16*S); },
  fore:(e,S,s)=>{ add(e,G.cyl(.15*S,.15*S,.32*S,8),Br,0,0,0,0,0,PI/2); add(e,G.cyl(.05*S,.05*S,.4*S,6),Fe,-.18*s*S,-.2*S,0); add(e,G.lathe([[.18*S,0],[.25*S,-.3*S],[.27*S,-.6*S]],14),Cu,0,0,0); rivets(e,.27*S,-.55*S,8,S); add(e,G.tor(.26*S,.03*S,4,14),Fe,0,-.2*S,0,PI/2);
    add(e,G.box(.42*S,.34*S,.38*S),Fe,0,-.78*S,0); for(let i=0;i<4;i++) add(e,G.box(.08*S,.18*S,.12*S),Cu2,(-.15+i*.1)*S,-.98*S,.12*S,.4,0,0); add(e,G.box(.1*S,.2*S,.12*S),Cu2,-.22*s*S,-.8*S,.14*S,0,0,.4*s); },
  extra:(R,gg)=>{ } }); }
LAB.ROSTER.push({id:'golem',group:'Bosses',name:'Radiant Golem',ref:'unit:golem',cell:224,views:FRONT,moves:MOVES5,
  build:LAB.creature(()=>steam({body:0xc0743a,dark:0x3a3430,trim:0xe8b850,glow:0xffd070}))});

/* ---------- Glacier Queen: a crystalline ice giantess, narrow waist, shoulders of jutting glacier, a jagged crown ---------- */
const F=LAB.fabric, GB=LAB.garb, sh=LAB.sh, MT=LAB.MT;
const iceT=F(64,64,{c:0x3a6aa8,soft:false,custom:P=>{ for(let k=0;k<9;k++){ let x=P.rnd()*64, y=P.rnd()*64; for(let i=0;i<14;i++){ P.px(x,y,0xe8f8ff); x+=P.rnd()<.5?-1:1; y+=P.rnd()<.6?1:0; } }
  for(let i=0;i<60;i++) P.px(P.rnd()*64,P.rnd()*64,0x3a6ab0); for(let i=0;i<30;i++) P.px(P.rnd()*64,P.rnd()*64,0xbfe6ff); }});
const shard=(p,m,x,y,z,len,w,dx,dy,dz)=>{ const s=add(p,G.oct(1),m,x,y,z); s.scale.set(w,len,w); LAB.aim(s,dx,dy,dz); return s; };
bossH('glacier','Glacier Queen','unit:glacier',{fem:true, muscle:true, attitude:'siren', scale:1.7, bodyW:1.22, shK:1.15, waistK:.7, armK:1.3, legW:1.12, headK:1.12, skin:0x5a8ac8, skinGlass:.55, facet:true,
  fp:{eyes:{style:'glow',c:0xeaffff}, brows:{style:'angry',c:0x2a5a9a}, nose:'small', mouth:'fangs', lips:0x2a4a8a, shadow:0x2a5aa0}, jaw:true, ears:'none',
  top:'skin', legs:'skin', shins:'skin', boot:'skin', shoe:{type:'claw',c2:0xd8f4ff}, skirt:'none', sleeve:'bare', belt:false, loin:F(32,32,{c:0x2e5c9a,custom:P=>{ for(let y=20;y<32;y++) for(let x=0;x<32;x++) if(P.rnd()<(y-20)/14) P.px(x,y,0xe8f8ff); }}), handClaws:0xd8f4ff,
  stance:{torsoX:.06,armLZ:.15,armRZ:-.1}, gait:{stride:.8,bounce:1.2},
  hair:{c:0xd8f0ff,style:'savage',len:.5,tex:LAB.hairT(0xd8f0ff)}, hat:{type:'icecrown'}, fx:0xbfe8ff, seed:9,
  dress(R,C){ const im=M(0xe8f8ff,{metal:.8}), im2=M(0x9ad0f4,{metal:.6}), im3=M(0x6ab0e8,{metal:.5}), b=C.b;
    for(const s of [1,-1]){ const p=grp(R['arm'+(s>0?'L':'R')],0,.08,0); for(let i=0;i<6;i++) shard(p,[im,im2,im3][i%3],s*(.03+i*.035),.08,(i-2.5)*.06,.32+((i*2)%3)*.12,.07,s*(.4+i*.12),1,(i-2.5)*.25); }
    for(let i=0;i<7;i++) shard(R.torso,[im,im2,im3][i%3],(i%2?.07:-.07),.56-i*.075,-b.ch*C.dz-.02,.24+(i%3)*.1,.06,(i%2?.35:-.35),.7,-1);
    for(const n of ['L','R']) for(let i=0;i<3;i++) shard(R['elbow'+n],[im,im2][i%2],0,-.06-i*.08,-b.ar*.9,.2,.045,0,.3,-1);
    for(let i=0;i<20;i++){ const a=i/20*PI*2, L=.5+((i*7)%5)*.12; const s2=add(R.hips,G.oct(1),[im,im2,im3][i%3],Math.sin(a)*b.hp*1.18,-L*.5,Math.cos(a)*b.hp*1.1); s2.scale.set(.06,L*.55,.06); s2.rotation.z=-Math.sin(a)*.12; s2.rotation.x=Math.cos(a)*.12; }
    R.hat.scale.setScalar(1.35); }},{note:'A queen of living ice: crystal skin, glacier shards bursting from shoulders, spine and forearms.'});

/* ---------- the Roc: an ice demon with a raptor's skull, frost-feather wings and ruff, and taloned bird legs ---------- */
const featherT=(c,c2)=>F(64,32,{c,custom:P=>{ for(let y=0;y<32;y+=4) for(let x=0;x<64;x+=4){ P.px(x+((y/4)%2)*2,y+3,c2); P.px(x+((y/4)%2)*2+1,y+2,c2); } }});
bossH('roc','Roc','unit:roc',{muscle:true, scale:1.52, bodyW:.98, shK:1.1, waistK:.7, armLen:1.25, headK:1.0, skin:0x2a3a6a, skinMetal:.15, face:'void', eyes:0xbff4ff, ears:'none',
  digi:{m:0x2a3a6a, talon:0xeaf8ff, fur:featherT(0xd8ecff,0x9ac0e8)}, top:'skin', skirt:'none', sleeve:'bare', belt:false, handClaws:0xeaf8ff, noOrb:true,
  stance:{headX:-.2,armLZ:.35,armRZ:-.35,armLX:-.3,armRX:-.3,elbowL:-.6,elbowR:-.6}, gait:{stride:.9,bounce:1.4,lift:1.2},
  wings:0xbfe0f8, wingK:1.5, attitude:'brute', tail:{c:0xd8ecff,tip:0xeaf8ff}, castUp:true, bolts:0xbfe8ff, fx:EL.frost, seed:12,
  dress(R,C){ const bm=M(0xeae4d4), dk=M(0x0a0c14), gl=M(0xbff4ff,{glow:true}), hn=M(0xeaf8ff,{metal:.5});
    const sk=grp(R.head,0,.18,.04); add(sk,G.sph(.16,12,10),bm,0,0,0).scale.set(.95,.85,1.15);
    const bk=add(sk,G.cone(.07,.3,8),bm,0,-.06,.26,PI/2+.35); bk.scale.set(1,1,.8); add(sk,G.cone(.04,.12,6),bm,0,-.16,.36,PI-.2);
    for(const s of [1,-1]){ add(sk,G.sph(.045,8,6),dk,.075*s,.02,.12).scale.set(1,1.2,.6); add(sk,G.sph(.018,5,4),gl,.075*s,.02,.14);
      add(sk,G.tube([[.09*s,.08,-.02],[.2*s,.2,-.12],[.26*s,.36,-.3],[.22*s,.5,-.46]],.045,.008,14,6),hn,0,0,0); }
    GB.capelet(R,C,{mat:featherT(0xd8ecff,0x9ac0e8),len:.24,flare:1.45,hem:GB.zig(16,.07),folds:10}); }},{note:'An ice demon with a raptor skull, frost-feathered wings and ruff, and taloned bird legs.'});


/* ---------- the Wyrm: a giant scorpion whose stinger burns ---------- */
boss('wyrm','Ember Wyrm','unit:wyrm',()=>{ const root=grp(null); root.scale.setScalar(1.08); const scT=(a,b)=>M(a,{metal:.6,facet:true}); const body=grp(root,0,.55,0), sc=scT(0x9a3c10,0x5a2a0a), sc2=scT(0x5a220a,0x2a1004), dk=M(0x3a1606), belly=M(0xf0b860,{metal:.3}), eye=M(0xfff08a,{glow:true}), f1=M(0xff5a1a,{glow:true}), f2=M(0xffa040,{glow:true}), f3=M(0xfff0b0,{glow:true});
  // segmented body plates
  // a broad armoured thorax, then narrower keeled abdomen plates that overlap like shingles
  add(body,G.cap(.5,.5,16,8),sc,0,0,.45).scale.set(1.25,.62,1.1); add(body,G.box(.06,.06,.7),dk,0,.3,.45);
  for(const s of [1,-1]) add(body,G.cone(.05,.22,4),dk,.3*s,.22,.6,-.3,0,-s*.5);
  for(let i=0;i<4;i++){ const r=.4-i*.035; add(body,G.cap(r,.5,8,5),i%2?sc:sc2,0,.02,-.05-i*.24).scale.set(1.15,.5,.72); add(body,G.cone(.04,.12,4),dk,0,r*.5,-.05-i*.24,-.4); add(body,G.cyl(r*.95,r*.95,.08,8),dk,0,-.02,-.05-i*.24).scale.set(1.15,1,.72); }
  const head=grp(body,0,.04,.85); add(head,G.cap(.36,.5,14,6),sc,0,0,0).scale.set(1.1,.55,.8); for(const s of [1,-1]){ add(head,G.sph(.05,6,5),eye,.08*s,.14,.18); add(head,G.sph(.035,6,5),eye,.18*s,.1,.12); }
  for(const s of [1,-1]) add(head,G.cone(.04,.18,4),dk,.08*s,-.04,.35,PI/2+.4);
  // pincers on jointed arms
  const claws=[]; for(const s of [1,-1]){ const a=grp(body,.32*s,.0,.85); add(a,G.tube([[0,0,0],[.25*s,.08,.2],[.3*s,.05,.5]],.08,.07,8,6),sc2,0,0,0);
    const c=grp(a,.3*s,.05,.55); add(c,G.sph(.17,10,8),sc,0,0,0).scale.set(1,.8,1.4); const up=grp(c,0,.04,.15); add(up,G.cone(.07,.42,6),sc,.06*s,0,.2,PI/2,0,-.3*s).scale.set(1,1,.6);
    const lo=grp(c,0,-.04,.15); add(lo,G.cone(.06,.36,6),sc2,-.05*s,0,.18,PI/2,0,.25*s).scale.set(1,1,.6); for(let i=0;i<3;i++) add(up,G.cone(.015,.05,3),belly,.02*s,-.03,.1+i*.08,PI); claws.push([a,up,lo,s]); }
  const legs=[]; for(const s of [1,-1]) for(let i=0;i<4;i++){ const l=grp(body,.4*s,-.05,.45-i*.28); add(l,G.tube([[0,0,0],[.35*s,.32,.04],[.62*s,.18,.06],[.78*s,-.55,.08]],.045,.02,14,5),i%2?sc2:sc,0,0,0); add(l,G.sph(.05,6,5),dk,.35*s,.32,.04); legs.push([l,s,i]); }
  // the tail: seven segments that curl up and over, a stinger bulb wreathed in fire
  const segs=[]; let p=grp(body,0,.05,-1.0); for(let i=0;i<7;i++){ const r=.22-i*.017; add(p,G.cyl(r,r*.8,.32,6),i%2?sc:sc2,0,0,-.0,PI/2,0,0); add(p,G.cone(.035,.12,4),dk,0,r*.9,0,-.3); add(p,G.tor(r*.95,.025,4,12),dk,0,0,0,0,0,0); segs.push(p); p=grp(p,0,0,-.33+i*.01); }
  const sting=p; add(sting,G.sph(.2,10,8),M(0xb0381a,{metal:.4}),0,0,0).scale.set(1,1.2,1); add(sting,G.cone(.07,.42,6),dk,0,.06,.3,PI/2+.6);
  // living fire on the stinger, reshaped every frame, and a light in it that warms the shell plates nearby
  const flame=grp(sting,0,.1,0); const fire=LAB.fire(flame,{h:1.0,r:.32,cols:[0xff5a1a,0xffa040,0xfff0b0],amp:.32,seed:5});
  const pl=new THREE.PointLight(0xffb060,1.6,3.2); pl.position.set(0,.45,0); flame.add(pl);
  const fx=LAB.motes(root,0xffa040,1.8,1.2);
  return {root, apply:(g)=>{ body.position.y=.55+.02*g.bob; body.rotation.x=.12*g.strike-.1*g.wind-.15*g.hurt; body.position.z=.2*g.strike;
    const curl=1+.25*g.wind-.5*g.strike+.15*g.raise+.05*Math.sin(g.t*PI*2); segs.forEach((s,i)=>{ s.rotation.x=(i===0?.6:.5)*curl+(i>4?.2*g.strike:0); s.rotation.z=.04*Math.sin(g.t*PI*2+i*.6); });
    sting.rotation.x=.4+.6*g.strike; root.updateMatrixWorld(true); const q=new THREE.Quaternion(); sting.getWorldQuaternion(q); flame.quaternion.copy(q.invert()); flame.scale.setScalar(.95+.5*Math.max(g.strike,g.raise)); fire.update(g.t); pl.intensity=1.4+.4*Math.sin(g.t*PI*2*3);
    claws.forEach(([a,up,lo,s])=>{ const open=.25+.5*g.wind+.6*g.raise+.15*Math.sin(g.t*PI*2); up.rotation.y=s*open*.6; lo.rotation.y=-s*open*.5; a.rotation.y=-s*(.2*g.strike); a.rotation.x=-.3*g.wind+.2*g.strike-.4*g.raise; });
    legs.forEach(([l,s,i])=>{ const w=g.step?Math.sin(g.t*PI*2+i*1.7+(s>0?0:PI)):0; l.rotation.x=.25*w; l.rotation.z=s*(.12*Math.max(0,w)-.08*g.hurt); }); fx.update(g.raise,g.t); }}; },{note:'Rebuilt as a giant scorpion with a burning stinger, like the current art.'});

/* ---------- the Treant: an ent built like a tree: root feet, a trunk that widens to the ground, branch arms, a carved bark face ---------- */
bossH('treant','Treant','unit:treant',{muscle:true, scale:1.6, bodyW:1.25, hipK:1.35, waistK:1.1, armK:1.35, armLen:1.3, legW:1.45, legK:.82, headK:1.3, headS:[1,1.08,1], headP:{brow:2.4,cheek:1.9,jaw:1.35,chin:1.6,sockets:1.8}, skin:0x5a3a1e, skinTex:LAB.barkT(0x5a3a1e,0x2a1a0c,0x7a5a34),
  fp:{eyes:{style:'glow',c:0xf0ff6a}, brows:{style:'heavy',c:0x1a0e06}, nose:'big', mouth:'open', mouthGlow:0xc8ff4a, grain:0x24160a, sunken:0x1a0e06}, noseK:1.5, ears:'none', attitude:'brute',
  top:'skin', legs:'skin', shins:'skin', boot:'skin', shoe:{type:'claw',c2:0x3a2414}, skirt:'none', sleeve:'bare', belt:false, handClaws:0x4a3220,
  stance:{headX:-.2,armLZ:.25,armRZ:-.25,armLX:-.2,elbowL:-.5}, gait:{stride:.6,bounce:1.5,sway:.06,lift:.6},
  vines:{c:0x2e4a1a,n:3,leaf:0x4a8a2a}, armVines:0x2e4a1a, thorns:{c:0x3a2614,n:8}, hat:{type:'canopy'}, fx:0xe8ff6a, seed:21,
  dress(R,C){ const bk=MT(LAB.barkT(0x4a3018,0x24160a,0x6a4a2a)), lv=[0x2e6a22,0x4a8a2a,0x6aa83a].map(c=>M(c,{soft:true})), b=C.b;
    GB.beard(R,C,{style:'moss',c:0x4a6a22,len:.5,z:.1});
    for(const n of ['L','R']){ const s=n==='L'?1:-1; const k=R['knee'+n];
      for(let i=0;i<4;i++){ const a=i/4*PI*2+.4; add(k,G.tube([[0,-C.shinL*.8,0],[Math.sin(a)*.12,-C.shinL-.02,Math.cos(a)*.12],[Math.sin(a)*.24,-C.shinL-.07,Math.cos(a)*.24]],.05,.015,6,5),bk,0,0,0); }
      const br=grp(R['arm'+n],s*.08,.0,0); add(br,G.tube([[0,0,0],[s*.15,.2,-.05],[s*.22,.42,-.1]],.05,.015,8,5),bk,0,0,0); LAB.leafRing(br,7,.42,.06,1,lv,.06,.16,2.2,.6).forEach(l=>{ l.position.x+=s*.22; l.position.z-=.1; });
      const br2=grp(R['elbow'+n],s*.06,-.1,0); add(br2,G.tube([[0,0,0],[s*.16,.06,.02],[s*.26,.2,.0]],.035,.01,6,4),bk,0,0,0); }
    for(const [x,y,z] of [[.22,.5,.05],[-.18,.52,-.05],[.05,.3,b.ch*C.dz+.03]]){ add(R.torso,G.cyl(.012,.016,.05,5),M(0xe8dcc0),x,y,z); add(R.torso,G.cap(.05,.5,8,4),M(0xc84a2a),x,y+.03,z).scale.set(1,.6,1); }
    add(R.torso,G.sph(.07,10,8),M(0x0e0804),0,.22,b.ch*C.dz*1.0).scale.set(1,1.3,.4); add(R.torso,G.sph(.03,6,5),M(0xc8ff4a,{glow:true}),0,.21,b.ch*C.dz*1.0+.02); }},{note:'An ent: a trunk that widens into root feet, branch arms in leaf, a carved face with glowing eyes and maw.'});

/* ---------- the Hollow King: a horned purple devil on cloven legs, a glowing hollow in its chest, a torn rune cloak ---------- */
bossH('hollow','Hollow King','unit:hollow',{muscle:true, scale:1.72, bodyW:1.12, waistK:.8, armLen:1.15, headK:1.22, headP:{jaw:1.45,brow:2.2,cheek:1.7,chin:1.6,len:1.18,sockets:1.6}, skin:0x4a2a6a, skinMetal:.2, ears:'elf', earL:.2,
  skinTex:F(32,32,{c:0x4a2a6a,soft:false,custom:P=>{ for(let k=0;k<3;k++){ let x=k*11+3, y=0; while(y<32){ P.px(x,y,0xd08aff,{glow:true}); y++; x+=P.rnd()<.5?-1:1; } } }}),
  fp:{eyes:{style:'glow',c:0xff6aff}, brows:{style:'heavy',c:0x0a0412}, nose:'long', mouth:'fangs', lips:0x1a0a2a, cheekbones:true, shadow:0x0a0412, sunken:0x12081c, scar:{c:0xd08aff,dir:1}}, jaw:true, fangs:true,
  digi:{m:0x3a2050, talon:0x0e0a14, fur:F(32,32,{c:0x1a1024,fur:{c:0x1a1024,c2:0x2a1a3a}})},
  top:'skin', robe:F(128,64,{c:0x1e1030,tears:{c:0x0a0612,n:14},rows:[{y0:52,y1:60,c:0x160a26,pat:'rune',pc:0xd08aff,every:8,pfg:{glow:true}}]}), robeDk:0x120a1e, skirt:'none', sleeve:'bare', belt:0x120a1e, handClaws:0xe8d8ff,
  horns:{c:0x1a1020,type:'bull',size:2.1,metal:.75}, pads:{c:0x2a1a3a,metal:.6,spike:3,spikeC:0xd8c8f0,layers:2,r:.18},
  cape:F(64,64,{c:0x140a22,tears:{c:0x08040e,n:12},rows:[{y0:54,y1:60,c:0x140a22,pat:'rune',pc:0xd08aff,every:8,pfg:{glow:true}}]}), capeLen:1.5, capeHem:0x5a2a8a, rags:true, tail:{c:0x3a2050,tip:0x1a1020},
  wings:0x1a0e26, wingType:'bat', wingK:1.4, attitude:'brute', headS:[1.05,.88,1.02], stance:{headX:-.5,torsoX:-.06,armLZ:.1,armRZ:-.1}, gait:{stride:.85,bounce:1.3}, castUp:true, bolts:0xd08aff, fx:0xb08aff, seed:13,
  // floating cards: a ring of glowing rune cards that orbit him, tilt toward his raised hands when he casts, and burning eye trails
  onPose(R,P){ const t=P.t||0, up=Math.max(P.sparks||0,P.slash||0); R.cards.forEach((c,i)=>{ const a=i/R.cards.length*Math.PI*2+t*Math.PI*2; const r=1.55+.2*up;
      c.position.set(Math.cos(a)*r,2.1+.15*Math.sin(a*2+t*Math.PI*4)+.5*up,Math.sin(a)*r*.65); c.scale.setScalar(1.8); c.rotation.set(-.2,-a+Math.PI/2,.25*Math.sin(a*3)); });
    R.eyeT.forEach(e=>e.update(t)); },
  dress(R,C){ const b=C.b;
    R.cards=[]; const cg=grp(R.root); const face=[0xd08aff,0xff6aff,0x8a6aff];
    for(let i=0;i<6;i++){ const c=grp(cg); add(c,G.box(.2,.3,.012),M(0x1a0a2a),0,0,0); add(c,G.box(.17,.27,.016),M(0xe8dcc8),0,0,0); add(c,G.box(.13,.22,.02),M(0x2a1040),0,0,0);
      add(c,G.oct(.045),M(face[i%3],{glow:true}),0,0,.014).scale.set(1,1.5,.3); for(const s of [1,-1]) add(c,G.box(.02,.02,.02),M(0xd08aff,{glow:true}),.05*s,.09*s,.012); R.cards.push(c); }
    // pointed goatee and a ridge of spines over the skull
    add(R.head,G.cone(.05,.2,6),M(0x12081c),0,-.03,.12,PI-.4); for(let i=0;i<5;i++) add(R.head,G.cone(.025,.09,4),M(0x1a1020,{metal:.6}),0,.3-.012*i,.1-i*.06,-.5-i*.25);
    R.eyeT=[1,-1].map(s=>LAB.trail(R.head,.058*s,.15,.16,0xff6aff,{n:6,len:.5,size:.022,dir:[.25*s,.25,-.9]}));
    add(R.torso,G.tor(.09,.03,6,14),M(0x1a0a2a),0,.3,b.ch*C.dz*.92).scale.set(1,1.2,.6); add(R.torso,G.sph(.07,10,8),M(0x05030a),0,.3,b.ch*C.dz*.86).scale.set(1,1.2,.4);
    add(R.torso,G.ico(.035,0),M(0xff6aff,{glow:true}),0,.3,b.ch*C.dz*.95); GB.skirt(R,C,{pts:GB.prof(C,.6,.42),mat:R.o.robe,a0:.5,len:PI*2-1,folds:8,amp:.05,hem:GB.tatter(.12,3)}); }},{note:'The last boss: a purple devil on cloven legs, great horns, burning eyes, a glowing hollow in its chest and a torn rune cloak.'});

/* ---------- minibosses ---------- */
miniH('executioner','Executioner','mini:executioner',{muscle:true, scale:1.36, bodyW:1.2, waistK:1.08, skin:0xc8906a, stance:{torsoX:.1,headX:-.06,armLZ:.12}, gait:{stride:.85,bounce:1.3},
  top:F(64,32,{c:0xc8906a,soft:false,custom:P=>{ for(let i=0;i<40;i++) P.px(P.rnd()*24-12,6+P.rnd()*10,0x8a5a3a); P.line(-9,14,-3,22,0xe8b090); P.line(4,8,10,16,0xe8b090); }}),
  legs:0x241812, boot:0x140c08, bootTall:true, skirt:'none', sleeve:'bare', belt:0x2a1a10, loin:F(32,64,{c:0x3a2418,mottle:[0x2e1c12,.2],scatter:[{pat:'drop',c:0x5a0a0e,n:8,y0:4,y1:60}]}),
  bracers:0x1a100a, hat:{type:'sack',c:0x0c0a0e,eyes:0xff3a2a}, headK:1.1, weapon:{kind:'axe',double:false,len:1.55,metal:M(0x9aa0a8,{metal:1}),wood:M(0x2a1a10)}, weaponK:1.15, fx:0xff5a3a,
  dress(R,C){ for(const n of ['L','R']) GB.chain(R['elbow'+n],[[0,-.05,.06],[.05,-.12,.07],[0,-.2,.07],[-.05,-.27,.06]],M(0x5a5a60,{metal:.7}),5); GB.necklace(R,C,{t:'teeth',n:7,drop:.07}); }});
miniH('corruptknight','Corrupted Knight','mini:corruptknight',{muscle:true, scale:1.32, bodyW:1.1, headK:1.02, skin:0x5a4a6a, stance:{armLZ:.1}, gait:{stride:.85},
  armor:{c:0x2e2240,c2:0x160e22,trim:0xd08aff,chest:true,arms:true,legs:true,metal:1}, faulds:true, pads:{c:0x3a2a52,metal:1,spike:3,spikeC:0x6a5a8a,layers:3,r:.2},
  hat:{type:'helm',type2:'dread',c:0x2e2240,c2:0x160e22,horns:0x0e0a14,slit:0xe08aff}, attitude:'brute', skirt:'none', cape:0x2a1040, capeHem:0x6a2a9a, rags:true, belt:0x160e22, cracks:0xd08aff,
  weapon:{kind:'sword',metal:M(0x3a2a52,{metal:1}),guard:M(0x0e0a14,{metal:.8}),c:0xe08aff,len:1.15}, offhand:{kind:'kite',m:M(0x2e2240,{metal:.9}),rim:M(0x6a5a8a,{metal:1}),c:0xd08aff}, fx:0xd08aff,
  dress(R,C){ const tm=M(0x1a0e24), tg=M(0xe08aff,{glow:true}); for(let i=0;i<5;i++){ const s=i%2?1:-1, a=(i-2)*.35, g=grp(R.torso,Math.sin(a)*.12,.4,-C.b.ch*C.dz); R.flick.push({o:g,ax:'z',a:.15,k:1,p:i,z0:0});
      const pts=[[0,0,0],[Math.sin(a)*.2,.15,-.15],[Math.sin(a)*.4+s*.05,.35,-.2],[Math.sin(a)*.5,.6,-.12+s*.05]]; add(g,G.tube(pts,.05,.012,14,6),tm,0,0,0); add(g,G.sph(.025,5,4),tg,...pts[3]); } }});
mini('giant_mimic','Giant Mimic','mini:giant_mimic',()=>LAB.mimicModel(1.75,true));
miniH('dungeonwarden','Dungeon Warden','mini:dungeonwarden',{muscle:true, scale:1.38, bodyW:1.12, headK:1.0, skin:0x0a0a10, gait:{stride:.8,bounce:1.2},
  armor:{c:F(64,32,{c:0x5a626e,mottle:[0x4a525e,.2],scatter:[{pat:'dot',c:0x8a929e,n:14}]}),c2:0x30343c,trim:0x8a7a5a,chest:true,arms:true,legs:true,metal:.9}, faulds:true, pads:{c:0x5a626e,metal:.95,layers:3,r:.2},
  hat:{type:'helm',type2:'dread',c:0x5a626e,c2:0x30343c,slit:0x8adcff,crest:0x6a1a1a,plume:0x8a1a1a}, attitude:'brute', stance:{armLZ:.15,armRZ:-.15,legL:-.12,legR:.1}, skirt:'knee', robe:0x3a1414,
  tabard:F(32,64,{c:0x6a1a1a,custom:P=>{ for(let y=14;y<34;y++) P.px(16,y,0xd8c8a0); for(let x=10;x<23;x++) P.px(x,20,0xd8c8a0); P.rect(13,12,7,3,0xd8c8a0); }}), hem:0x8a7a5a, cape:0x2a1010, capeHem:0x8a7a5a, belt:0x2a1a10, belt2:0x8a7a5a,
  weapon:{kind:'chain'}, offhand:{kind:'chain'}, fx:0x8adcff,
  dress(R,C){ const f1=M(0x8adcff,{glow:true}), f2=M(0xd8f4ff,{glow:true}), f3=M(0x3a7ac8,{glow:true});
    const fl=(par,x,y,z,k)=>{ const g=grp(par,x,y,z); R.flick.push({o:g,ax:'z',a:.2,k:2,p:x*9+y,z0:0}); add(g,G.cone(.07*k,.3*k,6),f3,0,.12*k,0); add(g,G.cone(.05*k,.24*k,6),f1,0,.1*k,.01); add(g,G.cone(.025*k,.14*k,5),f2,0,.06*k,.02); };
    fl(R.head,0,.4,0,1.3); fl(R.head,.1,.36,-.05,.9); fl(R.head,-.1,.36,-.05,.9); for(const n of ['L','R']) fl(R['hand'+n],0,.06,0,.7); fl(R.torso,0,.6,-.05,1); }},{note:'An empty suit of armour that walks: ghost-fire burns where its head should be and leaks from its gauntlets.'});
miniH('alchemist','Plague Alchemist','mini:alchemist',{scale:1.22, skin:0xd8c8a8, robe:F(128,64,{c:0x16141a,mottle:[0x101014,.2],rows:[{y0:56,y1:64,c:0x101014,pat:'drop',pc:0x9be05a,every:9,pfg:{glow:true}}]}), robeDk:0x0c0a10, top:0x16141a,
  trim:0x9be05a, hat:{type:'beak',c:0xe8dcc0,hat:0x0c0a10,lens:0x9be05a}, cape:0x0c0a10, capeHem:0x2a2a22, belt:0x3a2a1e, belt2:0x9be05a, sleeve:'flared', gloves:0x1a1410, mantle:0x0c0a10,
  // a wide bell of a coat split at the front, and a short shuffling step, so the legs stay inside it
  skirtW:1.32, skirtGap:.55, attitude:'stalk', stance:{torsoX:-.02,headX:-.02}, gait:{stride:.42,lift:.45},
  weapon:{kind:'flask',c:0x9be05a}, offhand:{kind:'flask',c:0xd0ff6a}, fx:0x9be05a,
  dress(R,C){ const b=C.b; GB.strap(R,C,[-b.sh*.7,.5,b.ch*C.dz*.6],[b.wa*.9,.08,b.wa*C.dz*.9],0x3a2a1e,.05);
    for(let i=0;i<5;i++){ const u=i/4, x=-b.sh*.55+u*(b.wa*.9+b.sh*.55), y=.46-u*.36, z=b.ch*C.dz*.75+.04; add(R.torso,G.cyl(.022,.022,.07,6),M([0x9be05a,0xd0ff6a,0x6aff9a][i%3],{glow:true}),x,y,z); add(R.torso,G.cyl(.012,.012,.02,5),M(0x6b4428),x,y+.045,z); }
    GB.belt(R,C,{mat:null,items:[{t:'lantern',a:1.4,c:0x9be05a},{t:'pouch',a:-1.3,c:0x3a2a1e}]}); }});
miniH('assassin','Shadow Assassin','mini:assassin',{slender:true, muscle:true, bodyW:.9, waistK:.82, legK:1.12, armLen:1.1, scale:1.22, skin:0x0a0610, face:'void', eyes:0xff2a4a, armSkin:0x3a2a30, attitude:'stalk',
  robe:0x120a18, robeDk:0x08040c, top:F(64,32,{c:0x120a18,custom:P=>{ for(let y=4;y<28;y++) P.px(Math.round(-6+y*.5),y,0x6a1a2a); }}), skirt:'mini', skirtC:0x140c1c, rags:true, legs:0x140c1c, boot:0x0a060e, bootTall:true, sleeve:'tight', sleeveC:0x1a1022,
  hat:{type:'hood',c:0x120a18}, cape:0x0e0814, capeLen:1.2, capeHem:0x4a1a2a, straps:0x2a1a2a, gloves:0x0a060e, belt:0x6a1a2a, ears:'none',
  stance:{torsoX:.06,headX:-.12,kneeL:.12,kneeR:.0,hipsY:-.03,legL:-.15,legR:.1,armRX:-.5,elbowR:-.9,armLX:.3,armLZ:.35}, gait:{stride:1.2,bounce:.6},
  weapon:{kind:'dagger',c:0xff3a5a,metal:M(0x6a6a7a,{metal:1})}, offhand:{kind:'dagger',c:0xff3a5a,metal:M(0x6a6a7a,{metal:1})}, fx:0xff3a5a,
  dress(R,C){ add(R.head,G.robe([[.17,-.02],[.175,.08],[.165,.12]],6,.01,20),M(0x6a1a2a,{soft:true}),0,0,0).scale.set(1,1,1.02); for(const s of [1,-1]) add(R.torso,G.cloth(.06,.4,1.3,1,.01,.012),M(0x6a1a2a,{soft:true}),.06*s,.06,-C.b.wa*C.dz-.04,.15,0,s*.12); }});
/* ---------- Arcane Construct: a hovering rune-stone shell round a blazing crystal, a one-eyed mask, fists that float free ---------- */
LAB.ROSTER.push({id:'construct',group:'Minibosses',name:'Arcane Construct',ref:'mini:construct',cell:176,views:FRONT,moves:MOVES5,
  note:'A divine war-mech: polished white-gold plate, a glowing heart, a halo of blades, pistoned legs on big armoured feet.',
  build:LAB.creature(()=>{ const root=grp(null); root.scale.setScalar(1.12);
    const pl=M(0xd4ccb4,{metal:.92,facet:true}), pl2=M(0xa49c8a,{metal:.9,facet:true}), au=M(0xe0b048,{metal:.95,facet:true}), dk=M(0x1a1620,{metal:.6}), gl=M(0x9fe8ff,{glow:true}), gw=M(0xffffff,{glow:true});
    const hips=grp(root,0,1.05,0), torso=grp(hips,0,.1,0);
    // chest: a curved barrel of plate, gold ribs, a glowing heart behind a cage
    add(torso,G.limb([[0,.34,.26,0],[.18,.4,.3,.02],[.42,.52,.36,.04],[.62,.56,.36,.02],[.74,.42,.3,0]],10),pl,0,0,0);
    for(const y of [.2,.36,.52]) add(torso,G.tor(.42+y*.12,.025,4,16,PI*.9),au,0,y,0,PI/2,0,PI*.05).scale.set(1,.72,1);
    add(torso,G.oct(.14),gl,0,.46,.41).scale.set(1,1.4,.5); add(torso,G.oct(.065),gw,0,.46,.46).scale.set(1,1.4,.5);
    for(const s of [1,-1]) add(torso,G.box(.03,.32,.03),au,.09*s,.46,.45,0,0,s*.15);
    add(torso,G.cyl(.16,.26,.12,8),pl2,0,.8,0);
    // head: a narrow crested helm with a visor slit and a halo of blades behind it
    const head=grp(torso,0,.92,.02); head.scale.setScalar(1.35); add(head,G.limb([[-.08,.12,.13,0],[.06,.15,.16,.01],[.2,.13,.15,0],[.3,.05,.08,-.02]],10),pl,0,0,0);
    add(head,G.box(.22,.03,.05),gl,0,.08,.15); add(head,G.box(.04,.26,.22),au,0,.2,-.02); add(head,G.cone(.05,.2,4),au,0,.34,.06,.5);
    const halo=grp(torso,0,1.0,-.28); add(halo,G.tor(.42,.025,4,28),au,0,0,0); for(let i=0;i<12;i++){ const a=i/12*PI*2; add(halo,G.cone(.035,.22,4),i%2?gl:au,Math.cos(a)*.52,Math.sin(a)*.52,0,0,0,a-PI/2); }
    // shoulders: stacked plate lames, not balls
    const arms=[]; for(const s of [1,-1]){ const sh=grp(torso,.62*s,.62,0); sh.rotation.z=-.15*s;
      add(sh,G.cone(.24,.12,8),pl,0,.06,0); for(let i=0;i<3;i++) add(sh,new THREE.CylinderGeometry(.22-i*.02,.25-i*.02,.09,10,1,true,-PI*.8,PI*1.6),i%2?au:pl,0,-.04-i*.08,0);
      const up=grp(sh,0,-.06,0); add(up,G.limb([[0,.11,.11],[-.1,.12,.13,.02],[-.3,.09,.1]],8),pl2,0,0,0); add(up,G.sph(.08,8,6),au,0,-.34,0);
      const fo=grp(up,0,-.34,0); add(fo,G.limb([[0,.1,.1],[-.12,.15,.15],[-.3,.13,.12]],8),pl,0,0,0); add(fo,G.tor(.14,.02,4,12),au,0,-.3,0,PI/2);
      const fist=grp(fo,0,-.4,0); add(fist,G.box(.22,.18,.2),pl,0,0,0); for(let i=0;i<4;i++) add(fist,G.box(.045,.08,.07),au,(i-1.5)*.05,-.1,.06); arms.push([sh,up,fo,s]); }
    // legs: thigh plate, gold knee, a shin with a piston, and big armoured feet
    const legs=[]; for(const s of [1,-1]){ const th=grp(hips,.2*s,0,0); add(th,G.limb([[0,.13,.13],[-.2,.15,.15,.02],[-.42,.11,.11]],8),pl2,0,0,0);
      const kn=grp(th,0,-.46,0); add(kn,G.sph(.1,8,6),au,0,0,.03); add(kn,G.cone(.07,.12,4),au,0,0,.13,PI/2);
      add(kn,G.limb([[0,.12,.12],[-.15,.15,.16,-.02],[-.42,.11,.11]],8),pl,0,0,0); add(kn,G.cyl(.025,.025,.3,6),dk,.1*s,-.2,-.08); add(kn,G.cyl(.04,.04,.12,6),au,.1*s,-.1,-.08);
      const ft=grp(kn,0,-.48,0); add(ft,G.box(.26,.12,.46),pl,0,-.03,.1); add(ft,G.box(.28,.06,.18),au,0,.05,.26); add(ft,G.cone(.13,.12,4),pl2,0,-.03,.38,PI/2,PI/4,0).scale.set(1,1,.5); legs.push([th,kn,s]); }
    // waist: gold belt and a tabard of plate
    add(hips,G.tor(.36,.04,5,18),au,0,.08,0,PI/2).scale.set(1,.75,1); add(hips,G.trap(.3,.36,.03,1.2),pl,0,-.12,.3,-.1);
    const fx=LAB.motes(root,0x9fe8ff,1.9,.9);
    return {root, apply:(g)=>{ const w=g.step?Math.sin(g.t*PI*2):0; hips.position.y=1.05-.05*Math.abs(w)+.02*g.bob; torso.rotation.x=-.05+.25*g.strike-.15*g.wind-.15*g.hurt; torso.rotation.y=.15*w-.3*g.strike;
      halo.rotation.z=g.t*PI*2/12*2; head.rotation.x=-.1+.1*g.strike;
      legs.forEach(([th,kn,s])=>{ const v=w*(s>0?1:-1); th.rotation.x=-.45*v; kn.rotation.x=.5*Math.max(0,-v)+.08; th.rotation.z=.05*s; });
      arms.forEach(([sh,up,fo,s],i)=>{ up.rotation.x=.35*w*(s>0?-1:1)-(i?1.5*g.strike-.8*g.wind:0)-1.2*g.raise; up.rotation.z=s*(.12+.3*g.raise+.2*g.hurt); fo.rotation.x=-.4-(i?.4*g.wind:0)-.3*g.raise; });
      fx.update(g.raise,g.t); }}; })});
miniH('bonecollector','Bone Collector','mini:bonecollector',{scale:1.28, bodyW:1.05, muscle:true, skin:0x9aa08a, headK:1.12, headP:{cheek:1.8,sockets:2,jaw:1.1,chin:1.3,len:1.12}, ears:'human', stitches:0x2a1a14, attitude:'stalk',
  fp:{eyes:{style:'narrow',c:0xffe86a,glow:true}, brows:{style:'heavy',c:0x2a2a1a}, nose:'hook', mouth:'stitched', sunken:0x2a2a1a, wrinkles:true, paint:{type:'veins',c:0x5a6a4a}},
  top:0x4a3a2c, robe:0x2a221c, robeDk:0x1a1410, skirt:'knee', apron:F(32,64,{c:0x6a4a2a,mottle:[0x5a3a20,.18],scatter:[{pat:'drop',c:0x6a0a0e,n:18,y0:6,y1:60},{pat:'dot2',c:0x4a0608,n:20}]}), sleeve:'tight', sleeveC:0x2a221c, gloves:0x3a2418, boot:0x1a120c, bootTall:true, belt:0x2a1a10,
  bones:0xe8dcc0, weapon:{kind:'saw'}, offhand:{kind:'hook'}, fx:0x9bff6a, stance:{headX:-.2,armLZ:.2,armRX:-.4,elbowR:-.5}, gait:{stride:.75,sway:.06,bounce:.9},
  dress(R,C){ const b=C.b, sk=grp(R.torso,0,.32,-b.ch*C.dz-.16); add(sk,G.sph(.24,12,10),M(0x6a5a3a,{soft:true}),0,0,0).scale.set(1,1.25,.85); add(sk,G.tor(.1,.03,5,10),M(0x3a2a1a),0,.28,0,PI/2);
    for(let i=0;i<6;i++){ const a=i/6*PI*2; const bn=add(sk,G.cyl(.018,.018,.32,5),M(0xe8dcc0),Math.sin(a)*.08,.38,Math.cos(a)*.06); LAB.aim(bn,Math.sin(a)*.4,1,Math.cos(a)*.3); add(sk,G.sph(.03,5,4),M(0xe8dcc0),Math.sin(a)*.14,.52,Math.cos(a)*.1); }
    add(sk,G.sph(.07,8,6),M(0xe8dcc0),.1,.42,.05); GB.strap(R,C,[-b.sh*.6,.52,b.ch*C.dz*.5],[b.wa*.8,.1,b.wa*C.dz*.9],0x3a2a1a,.04);
    // a surgeon's leather head strap with a brass loupe over one eye
    add(R.head,G.tor(.172,.014,4,20),M(0x3a2418),0,.22,0,PI/2-.25); const lp=grp(R.head,-.06,.15,.16); add(lp,G.cyl(.04,.035,.07,10),M(0xb88a3a,{metal:.9}),0,0,.02,PI/2); add(lp,G.cyl(.03,.03,.075,10),M(0xffe86a,{glass:.5}),0,0,.03,PI/2);
    GB.necklace(R,C,{t:'bones',c:0xe8dcc0,n:11,drop:.08}); }},{note:'A medieval surgeon gone wrong: stitched grey skin, a blood-spattered apron, a sack of bones on his back, a bone saw and a hook.'});
})();
