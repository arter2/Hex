/* Area bosses (160 px cells) and minibosses (128 px cells). Same pixels-per-unit as everyone
   else, so they are bigger because the models are bigger, not because the pixels are. */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI, EL=LAB.EL, shade=LAB.shadeHex, T=THREE, DS=T.DoubleSide;
const FRONT=[{name:'front',yaw:-.42}], MOVES5=['idle','walk','cast','attack','hurt'];
const boss=(id,name,ref,build,extra)=>LAB.mon(id,'Bosses',name,ref,build,Object.assign({cell:160},extra||{}));
const bossH=(id,name,ref,spec,extra)=>LAB.hum(id,'Bosses',name,ref,spec,Object.assign({cell:160},extra||{}));
const mini=(id,name,ref,build,extra)=>LAB.mon(id,'Minibosses',name,ref,build,Object.assign({cell:128},extra||{}));
const miniH=(id,name,ref,spec,extra)=>LAB.hum(id,'Minibosses',name,ref,spec,Object.assign({cell:128},extra||{}));

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
  const Cu=M(c.body,{metal:.9}), Cu2=M(shade(c.body,.7),{metal:.85}), Fe=M(c.dark,{metal:.8}), Br=M(c.trim||0xe0b050,{metal:.95}), g=M(c.glow,{glow:true}), g2=M(0xfff2c0,{glow:true}), k=M(0x140c08);
  const rivets=(p,r,y,n,S,dz=1)=>{ for(let i=0;i<n;i++){ const a=i/n*PI*2; add(p,G.sph(.03*S,5,4),Br,Math.sin(a)*r,y,Math.cos(a)*r*dz); } };
  return biped({ size:S0, fx:c.glow, shoulder:.78,
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
  head:(h,S)=>{ add(h,G.sph(.3*S,14,10),Cu,0,.18*S,0).scale.set(1,1,.95); add(h,G.tor(.3*S,.04*S,5,18),Fe,0,.12*S,0,PI/2);
    add(h,G.box(.42*S,.08*S,.1*S),k,0,.2*S,.25*S); add(h,G.box(.34*S,.04*S,.06*S),g,0,.2*S,.29*S); add(h,G.cap(.32*S,.35,14,6),Br,0,.22*S,0);
    for(let i=0;i<5;i++) add(h,G.box(.04*S,.12*S,.04*S),Fe,(-.12+i*.06)*S,.02*S,.26*S);
    if(c.crest) add(h,G.box(.06*S,.25*S,.5*S),Br,0,.5*S,-.02*S); else { add(h,G.cyl(.02*S,.02*S,.4*S,5),Fe,0,.6*S,-.05*S); add(h,G.sph(.06*S,8,6),g,0,.82*S,-.05*S); } },
  thigh:(l,S)=>{ add(l,G.sph(.24*S,10,8),Cu2,0,0,0); add(l,G.cyl(.2*S,.17*S,.6*S,10),Fe,0,-.3*S,0); add(l,G.cyl(.05*S,.05*S,.5*S,6),Br,.15*S,-.3*S,.12*S); },
  shin:(k2,S)=>{ add(k2,G.sph(.2*S,10,8),Cu,0,0,.04*S); rivets(k2,.2*S,.0,6,S); add(k2,G.lathe([[.2*S,0],[.26*S,-.3*S],[.3*S,-.52*S]],14),Cu,0,0,0); add(k2,G.box(.46*S,.15*S,.6*S),Fe,0,-.6*S,.08*S); add(k2,G.cap(.23*S,.5,10,6),Fe,0,-.55*S,.3*S).scale.set(1,.6,1); },
  upper:(a,S)=>{ add(a,G.sph(.34*S,14,10),Cu,0,.05*S,0); add(a,G.tor(.3*S,.035*S,5,16),Br,0,-.05*S,0,PI/2); add(a,G.cyl(.15*S,.14*S,.65*S,10),Fe,0,-.32*S,0); add(a,G.cyl(.05*S,.05*S,.55*S,6),Br,0,-.3*S,.16*S); },
  fore:(e,S,s)=>{ add(e,G.sph(.17*S,10,8),Br,0,0,0); add(e,G.lathe([[.18*S,0],[.25*S,-.3*S],[.27*S,-.6*S]],14),Cu,0,0,0); rivets(e,.27*S,-.55*S,8,S); add(e,G.tor(.26*S,.03*S,4,14),Fe,0,-.2*S,0,PI/2);
    add(e,G.sph(.24*S,10,8),Fe,0,-.75*S,0).scale.set(1,.9,1); for(let i=0;i<3;i++) add(e,G.cyl(.05*S,.04*S,.2*S,6),Cu2,(-.12+i*.12)*S,-.92*S,.12*S,.3); },
  extra:(R,gg)=>{ } }); }
LAB.ROSTER.push({id:'golem',group:'Bosses',name:'Radiant Golem',ref:'unit:golem',cell:160,views:FRONT,moves:MOVES5,
  build:LAB.creature(()=>steam({body:0xc0743a,dark:0x3a3430,trim:0xe8b850,glow:0xffd070}))});

/* ---------- Glacier Queen: a muscled ice giant, narrow waist, crown of ice ---------- */
bossH('glacier','Glacier Queen','unit:glacier',{muscle:true, scale:1.62, bodyW:1.18, waistK:.78, armK:1.25, legW:1.1, headK:1.18, skin:0x3e78b8, skinMetal:.25, facet:true, eyes:0xeaffff, eyeGlow:true, angry:true, jaw:true, fangs:true, ears:'none', brows:true, browC:0x2a5a9a,
  top:'skin', legs:'skin', shins:'skin', boot:'skin', skirt:'none', sleeve:'bare', belt:0x2a5a9a, loin:0x2e5c9a, handClaws:0xd8f4ff, claws:0xd8f4ff,
  hat:{type:'icecrown'}, noSlash:false, fx:0xbfe8ff, seed:9,
  onPose:(R,P)=>{ if(!R.shards){ R.shards=1; const im=M(0xd8f4ff,{metal:.8}), im2=M(0x9ad0f4,{metal:.6}); for(let i=0;i<9;i++){ const sd=i<4?1:i<8?-1:0, s=add(R.torso,G.oct(1),i%2?im:im2,sd*(.3+(i%4)*.04),.5+(i%2)*.05,(i%4)*.05-.08,-.3,0,-sd*(.5+(i%4)*.25)); s.scale.set(.05,.2+(i%3)*.05,.05); } } }});

/* ---------- the Roc: an ice demon with frozen wings ---------- */
bossH('roc','Roc','unit:roc',{muscle:true, scale:1.5, bodyW:1.05, waistK:.8, armLen:1.15, headK:1.15, skin:0x5070b0, skinMetal:.2, facet:true, eyes:0xeaffff, eyeGlow:true, angry:true, fangs:true, jaw:true, ears:'none', browC:0x3a5a8a,
  top:'skin', legs:'skin', shins:'skin', boot:'skin', skirt:'none', sleeve:'bare', belt:0x2a3a6a, loin:0x3a4a7a, handClaws:0xeaf8ff, claws:0xeaf8ff,
  horns:{c:0xeaf8ff,type:'back',size:1.5,metal:.6}, wings:0xbfe0f8, wingK:1.5, tail:{c:0x7aa8d8,tip:0xeaf8ff}, pads:{c:0xd8f0ff,metal:.7,spike:2,spikeC:0xeaf8ff,layers:1,r:.16},
  castUp:true, bolts:0xbfe8ff, fx:EL.frost, seed:12},{note:'Rebuilt as an ice demon: horns, frozen wings, tail and claws.'});

/* ---------- the Wyrm: a giant scorpion whose stinger burns ---------- */
boss('wyrm','Ember Wyrm','unit:wyrm',()=>{ const root=grp(null); root.scale.setScalar(1.08); const body=grp(root,0,.55,0), sc=M(0xd8822a,{metal:.6}), sc2=M(0x9a4a14,{metal:.5}), dk=M(0x3a1606), belly=M(0xf0b860,{metal:.3}), eye=M(0xfff08a,{glow:true}), f1=M(0xff5a1a,{glow:true}), f2=M(0xffa040,{glow:true}), f3=M(0xfff0b0,{glow:true});
  // segmented body plates
  for(let i=0;i<6;i++){ const r=.42-Math.abs(i-1.5)*.04; add(body,G.cap(r,.5,14,6),i%2?sc:sc2,0,0,.55-i*.28).scale.set(1.15,.55,.75); add(body,G.cyl(r*.95,r*.95,.08,14),dk,0,-.02,.55-i*.28).scale.set(1.15,1,.75); }
  const head=grp(body,0,.04,.85); add(head,G.cap(.36,.5,14,6),sc,0,0,0).scale.set(1.1,.55,.8); for(const s of [1,-1]){ add(head,G.sph(.05,6,5),eye,.08*s,.14,.18); add(head,G.sph(.035,6,5),eye,.18*s,.1,.12); }
  for(const s of [1,-1]) add(head,G.cone(.04,.18,4),dk,.08*s,-.04,.35,PI/2+.4);
  // pincers on jointed arms
  const claws=[]; for(const s of [1,-1]){ const a=grp(body,.32*s,.0,.85); add(a,G.tube([[0,0,0],[.25*s,.08,.2],[.3*s,.05,.5]],.08,.07,8,6),sc2,0,0,0);
    const c=grp(a,.3*s,.05,.55); add(c,G.sph(.17,10,8),sc,0,0,0).scale.set(1,.8,1.4); const up=grp(c,0,.04,.15); add(up,G.cone(.07,.42,6),sc,.06*s,0,.2,PI/2,0,-.3*s).scale.set(1,1,.6);
    const lo=grp(c,0,-.04,.15); add(lo,G.cone(.06,.36,6),sc2,-.05*s,0,.18,PI/2,0,.25*s).scale.set(1,1,.6); for(let i=0;i<3;i++) add(up,G.cone(.015,.05,3),belly,.02*s,-.03,.1+i*.08,PI); claws.push([a,up,lo,s]); }
  const legs=[]; for(const s of [1,-1]) for(let i=0;i<4;i++){ const l=grp(body,.4*s,-.05,.45-i*.28); add(l,G.tube([[0,0,0],[.35*s,.32,.04],[.62*s,.18,.06],[.78*s,-.55,.08]],.045,.02,14,5),i%2?sc2:sc,0,0,0); add(l,G.sph(.05,6,5),dk,.35*s,.32,.04); legs.push([l,s,i]); }
  // the tail: seven segments that curl up and over, a stinger bulb wreathed in fire
  const segs=[]; let p=grp(body,0,.05,-1.0); for(let i=0;i<7;i++){ const r=.22-i*.017; add(p,G.sph(r,10,8),i%2?sc:sc2,0,0,-.0).scale.set(1,.85,1.2); add(p,G.tor(r*.95,.025,4,12),dk,0,0,0,0,0,0); segs.push(p); p=grp(p,0,0,-.33+i*.01); }
  const sting=p; add(sting,G.sph(.2,10,8),M(0xb0381a,{metal:.4}),0,0,0).scale.set(1,1.2,1); add(sting,G.cone(.07,.42,6),dk,0,.06,.3,PI/2+.6);
  const flame=grp(sting,0,.1,0); for(let i=0;i<4;i++){ const f=add(flame,G.cone(.34-i*.07,.9-i*.15,7),[f1,f2,f1,f3][i],0,.4+i*.05,.02*i); }
  for(let i=0;i<5;i++) add(flame,G.cone(.07,.3,5),i%2?f1:f2,Math.sin(i*1.3)*.2,.15,Math.cos(i*1.3)*.15,(LAB.rnd()-.5)*.6,0,Math.sin(i)*.6);
  const fx=LAB.motes(root,0xffa040,1.8,1.2);
  return {root, apply:(g)=>{ body.position.y=.55+.02*g.bob; body.rotation.x=.12*g.strike-.1*g.wind-.15*g.hurt; body.position.z=.2*g.strike;
    const curl=1+.25*g.wind-.5*g.strike+.15*g.raise+.05*Math.sin(g.t*PI*2); segs.forEach((s,i)=>{ s.rotation.x=(i===0?.6:.5)*curl+(i>4?.2*g.strike:0); s.rotation.z=.04*Math.sin(g.t*PI*2+i*.6); });
    sting.rotation.x=.4+.6*g.strike; root.updateMatrixWorld(true); const q=new THREE.Quaternion(); sting.getWorldQuaternion(q); flame.quaternion.copy(q.invert()); flame.scale.setScalar(.85+.15*Math.sin(g.t*PI*6)+.5*Math.max(g.strike,g.raise)); flame.children.forEach((f,i)=>f.rotation.z=.12*Math.sin(g.t*PI*4+i));
    claws.forEach(([a,up,lo,s])=>{ const open=.25+.5*g.wind+.6*g.raise+.15*Math.sin(g.t*PI*2); up.rotation.y=s*open*.6; lo.rotation.y=-s*open*.5; a.rotation.y=-s*(.2*g.strike); a.rotation.x=-.3*g.wind+.2*g.strike-.4*g.raise; });
    legs.forEach(([l,s,i])=>{ const w=g.step?Math.sin(g.t*PI*2+i*1.7+(s>0?0:PI)):0; l.rotation.x=.25*w; l.rotation.z=s*(.12*Math.max(0,w)-.08*g.hurt); }); fx.update(g.raise,g.t); }}; },{note:'Rebuilt as a giant scorpion with a burning stinger, like the current art.'});

/* ---------- the Treant: an ent of living wood ---------- */
bossH('treant','Treant','unit:treant',{muscle:true, scale:1.62, bodyW:1.15, armK:1.35, armLen:1.25, legW:1.25, headK:1.15, skin:0x4a3018, grain:0x24160a, barkLimbs:true, eyes:0xf0ff6a, eyeGlow:true, angry:true, jaw:true, ears:'none', browC:0x3a2614, brows:true,
  top:'skin', legs:'skin', shins:'skin', boot:'skin', skirt:'none', sleeve:'bare', belt:false, beard:{c:0x4a6a22,len:.5}, handClaws:0x4a3220, claws:0x4a3220,
  vines:{c:0x2e4a1a,n:3,leaf:0x4a8a2a}, armVines:0x2e4a1a, leaves:{c:[0x2e6a22,0x4a8a2a,0x6aa83a,0xc8a83a], chest:1, per:18, w:.09, h:.26}, thorns:{c:0x3a2614,n:10},
  hat:{type:'canopy'}, pads:{c:0x4a3220,layers:2,r:.17}, fx:0xe8ff6a, seed:21},{note:'An ent: muscled living wood, glowing eyes, a crown of branches and leaves.'});

/* ---------- the Hollow King: a horned purple devil in a hollow, torn cloak ---------- */
bossH('hollow','Hollow King','unit:hollow',{muscle:true, scale:1.72, bodyW:1.12, waistK:.82, armLen:1.15, headK:1.05, skin:0x4a2a6a, skinMetal:.2, eyes:0xff6aff, eyeGlow:true, angry:true, jaw:true, fangs:true, ears:'elf', browC:0x1a0a2a,
  top:'skin', legs:0x1a0e2a, robe:0x1e1030, robeDk:0x120a1e, skirt:'long', skirtC:0x1e1030, skirtGap:.8, rags:true, hem:0x5a2a8a, sleeve:'bare', belt:0x120a1e, handClaws:0xe8d8ff, claws:0xe8d8ff,
  horns:{c:0x1a1020,type:'bull',size:1.7,metal:.5}, pads:{c:0x2a1a3a,metal:.6,spike:3,spikeC:0xd8c8f0,layers:2,r:.18}, cape:0x140a22, capeLen:1.5, capeHem:0x5a2a8a, mantle:0x1e1030, tail:{c:0x3a2050,tip:0x1a1020},
  castUp:true, bolts:0xd08aff, fx:0xb08aff, seed:13},{note:'The last boss: a purple devil with great horns, burning eyes and a hollow torn cloak.'});

/* ---------- minibosses ---------- */
miniH('executioner','Executioner','mini:executioner',{muscle:true, scale:1.36, bodyW:1.18, waistK:1.05, skin:0xc8906a, top:'skin', legs:0x241812, boot:0x140c08, bootTall:true, skirt:'none', sleeve:'bare', belt:0x2a1a10, belt2:0x2a1a10, loin:0x3a2418,
  straps:0x2a1a10, strap1:true, bracers:0x1a100a, hat:{type:'sack',c:0x0c0a0e,eyes:0xff3a2a}, headK:1.1, weapon:{kind:'axe',double:false,len:1.55,metal:M(0x9aa0a8,{metal:1}),wood:M(0x2a1a10)}, weaponK:1.15, fx:0xff5a3a});
miniH('corruptknight','Corrupted Knight','mini:corruptknight',{muscle:true, scale:1.32, bodyW:1.1, headK:1.02, skin:0x5a4a6a, armor:{c:0x2e2240,c2:0x160e22,trim:0xd08aff,chest:true,arms:true,legs:true,metal:1}, faulds:true, pads:{c:0x3a2a52,metal:1,spike:3,spikeC:0x6a5a8a,layers:3,r:.2},
  hat:{type:'helm',type2:'knight',c:0x2e2240,c2:0x160e22,horns:0x0e0a14,slit:0xe08aff}, skirt:'none', cape:0x2a1040, capeHem:0x6a2a9a, rags:true, belt:0x160e22, cracks:0xd08aff,
  weapon:{kind:'sword',metal:M(0x3a2a52,{metal:1}),guard:M(0x0e0a14,{metal:.8}),c:0xe08aff,len:1.15}, offhand:{kind:'kite',m:M(0x2e2240,{metal:.9}),rim:M(0x6a5a8a,{metal:1}),c:0xd08aff}, fx:0xd08aff});
mini('giant_mimic','Giant Mimic','mini:giant_mimic',()=>LAB.mimicModel(1.75,true));
miniH('dungeonwarden','Dungeon Warden','mini:dungeonwarden',{muscle:true, scale:1.38, bodyW:1.12, headK:1.0, skin:0x0a0a10, armor:{c:0x5a626e,c2:0x30343c,trim:0x8a7a5a,chest:true,arms:true,legs:true,metal:.95}, faulds:true, pads:{c:0x5a626e,metal:.95,layers:3,r:.2},
  hat:{type:'helm',type2:'great',c:0x5a626e,c2:0x30343c,slit:0x8adcff,crest:0x6a1a1a}, skirt:'knee', robe:0x3a1414, tabard:0x6a1a1a, hem:0x8a7a5a, cape:0x2a1010, capeHem:0x8a7a5a, belt:0x2a1a10, belt2:0x8a7a5a,
  weapon:{kind:'chain'}, offhand:{kind:'chain'}, fx:0x8adcff},{note:'An empty suit of armour that walks: only the light of its eyes inside the visor.'});
miniH('alchemist','Plague Alchemist','mini:alchemist',{scale:1.22, skin:0xd8c8a8, robe:0x16141a, robeDk:0x0c0a10, top:0x16141a, trim:0x9be05a, hat:{type:'beak',c:0xe8dcc0,hat:0x0c0a10,lens:0x9be05a}, cape:0x0c0a10, capeHem:0x2a2a22, belt:0x3a2a1e, belt2:0x9be05a, sleeve:'flared', gloves:0x1a1410, mantle:0x0c0a10,
  weapon:{kind:'flask',c:0x9be05a}, offhand:{kind:'flask',c:0xd0ff6a}, fx:0x9be05a});
miniH('assassin','Shadow Assassin','mini:assassin',{slender:true, legK:1.12, armLen:1.1, scale:1.2, skin:0x2a1e32, face:'void', eyes:0xff3a5a, robe:0x1a1022, robeDk:0x0e0814, top:0x1a1022, skirt:'mini', skirtC:0x140c1c, rags:true, legs:0x140c1c, boot:0x0a060e, bootTall:true, sleeve:'tight', sleeveC:0x1a1022,
  hat:{type:'hood',c:0x120a18}, cape:0x0e0814, capeLen:1.2, capeHem:0x4a1a2a, straps:0x2a1a2a, gloves:0x0a060e, belt:0x2a1a2a, ears:'none',
  weapon:{kind:'dagger',c:0xff3a5a,metal:M(0x6a6a7a,{metal:1})}, offhand:{kind:'dagger',c:0xff3a5a,metal:M(0x6a6a7a,{metal:1})}, fx:0xff3a5a, onPose:(R,P)=>{ R.torso.rotation.x+=.18; R.head.rotation.x-=.1; }});
LAB.ROSTER.push({id:'construct',group:'Minibosses',name:'Arcane Construct',ref:'mini:construct',cell:128,views:FRONT,moves:MOVES5,
  build:LAB.creature(()=>steam({body:0x7a6a9a,dark:0x2a2838,trim:0xc8a050,glow:0x9fe8ff,size:.78,crest:true}))});
miniH('bonecollector','Bone Collector','mini:bonecollector',{scale:1.28, bodyW:1.05, skin:0x9aa08a, eyes:0xffe86a, eyeGlow:true, angry:true, jaw:true, ears:'human', nose:true, brows:false, stitches:0x2a1a14,
  top:0x4a3a2c, robe:0x2a221c, robeDk:0x1a1410, skirt:'knee', apron:0x6a4a2a, blood:0x6a0a0e, sleeve:'tight', sleeveC:0x2a221c, gloves:0x3a2418, boot:0x1a120c, bootTall:true, belt:0x2a1a10,
  hat:{type:'mask'}, bones:0xe8dcc0, weapon:{kind:'saw'}, offhand:{kind:'hook'}, fx:0x9bff6a, onPose:(R,P)=>{ R.torso.rotation.x+=.28; R.head.rotation.x-=.22; }},{note:'A medieval surgeon gone wrong: stitched grey skin, a bloodied leather apron, a bone saw and a hook.'});
})();
