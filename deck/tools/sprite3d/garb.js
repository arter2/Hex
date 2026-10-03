/* Bespoke garments and headwear. The kit builds the body; each character's dress() adds its own
   pieces from here: partial lathes (coats split front and back), tabard panels that swing with the
   legs, collars, capelets, sleeves, pauldrons, belts with hanging kit, necklaces, fringes, and
   headwear that keeps the face in view (brims tilt up at the front). */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI, T=THREE, DS=T.DoubleSide;
const MT=(v,o)=>LAB.MT(v,o), sh=(c,k)=>LAB.sh(LAB.colOf(c),k);
const GB=LAB.garb={};
let sd=3; const rnd=()=>((sd=(sd*9301+49297)%233280)/233280); GB.seed=s=>{ sd=s; };

// a partial lathe [a0, a0+len] (angle from the front, toward the figure's left), with folds and a shaped hem
G.arc=(pts,a0,len,folds=0,amp=0,s=24,hem)=>{ const g=new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(Math.max(1e-4,r),y)),s,a0,len), p=g.attributes.position;
  const ys=pts.map(q=>q[1]), top=Math.max(...ys), bot=Math.min(...ys);
  if(amp) for(let i=0;i<p.count;i++){ const x=p.getX(i), z=p.getZ(i), y=p.getY(i), a=Math.atan2(x,z), d=(top-y)/(top-bot||1); const k=1+amp*d*Math.sin(a*folds+Math.sin(a*3)*.8)/Math.max(.12,Math.hypot(x,z)); p.setX(i,x*k); p.setZ(i,z*k); }
  LAB.vfix(g); if(hem) for(let i=0;i<p.count;i++) if(Math.abs(p.getY(i)-bot)<1e-6) p.setY(i,bot+hem(Math.atan2(p.getX(i),p.getZ(i))));
  g.computeVertexNormals(); return g; };
// hem shapes (offsets below the hem line by angle)
GB.zig=(n,amp)=>a=>{ const u=((a/(2*PI)*n)%1+1)%1; return -amp*(1-Math.abs(u-.5)*2); };
GB.scallop=(n,amp)=>a=>{ const u=((a/(2*PI)*n)%1+1)%1; return -amp*Math.sin(u*PI); };
GB.tatter=(amp,seed=1)=>a=>{ const k=Math.sin(Math.round(a*40)*12.9898*seed+78.233)*43758.5453; return -amp*(k-Math.floor(k))*(.4+.6*Math.abs(Math.sin(a*3+seed))); };
GB.dip=(amp,back=0)=>a=>-amp*(Math.cos(a)*.5+.5)-back*(1-(Math.cos(a)*.5+.5));   // longer at the front (or back)

/* skirts, robes, coat skirts: pts bottom->top in hip space */
GB.skirt=(R,C,o)=>{ const g=o.a0!=null?G.arc(o.pts,o.a0,o.len,o.folds||0,o.amp||0,o.s||40,o.hem):G.robe(o.pts,o.folds||7,o.amp==null?.03:o.amp,o.s||44,o.gap||0,o.hem);
  const m=add(o.par||R.skirt,g,MT(o.mat,{soft:true,side:DS}),0,o.y||0,0); m.scale.z=o.z||.92; return m; };
// hip-to-hem profile helper: from the waist (y .12) flaring to radius r at length L
GB.prof=(C,L,r,o={})=>{ const b=C.b, top=b.wa*1.1*(o.top||1), hip=b.hp*(o.hip||1.12); return [[r,-L],[Math.max(hip*1.04,r*.86),-L*.55],[hip,-L*.15],[b.hp*1.06,0],[top,.12]].map(([a,c])=>[a*(o.k||1),c]); };

/* a coat / jacket over the torso: lathe shell with a front opening */
GB.shell=(R,C,o)=>{ const b=C.b, prof=C.prof.slice(o.from||0,o.to||8).map(([r,y])=>[r*(o.k||1.08)+.01,y]); const gap=o.gap==null?.8:o.gap;
  const m=add(R.torso,G.lathe(prof,26,gap),MT(o.mat,{soft:true,side:DS})); m.scale.z=C.dz*1.04; return m; };
// a standing collar round the neck, open at the front
GB.collar=(R,C,o)=>{ const b=C.b, r0=o.r0||b.neck*2.2, r1=o.r1||r0*1.6, h=o.h||.2, gap=o.gap==null?1.6:o.gap;
  const g=G.arc([[r0,0],[(r0+r1)/2*1.02,h*.55],[r1,h]],gap/2,2*PI-gap,0,0,24); const m=add(R.torso,g,MT(o.mat,{soft:true,side:DS}),0,o.y||.5,o.z||-.01); m.scale.z=o.zs||.9;
  if(o.trim) add(R.torso,G.arc([[r1*1.01,h-.012],[r1*1.03,h+.006]],gap/2,2*PI-gap,0,0,24),MT(o.trim,{metal:.6,side:DS}),0,o.y||.5,o.z||-.01).scale.z=o.zs||.9; return m; };
// short cape round the shoulders
GB.capelet=(R,C,o)=>{ const b=C.b, L=o.len||.24, f=o.flare||1.25, y0=.47;
  const pts=[[b.sh*f,y0-L],[b.sh*1.08,y0-L*.35],[b.sh*.9,y0+.03],[b.neck*1.9,.55],[b.neck*1.45,.6]];
  const m=add(R.torso,G.robe(pts,o.folds||8,o.amp==null?.02:o.amp,30,o.gap||0,o.hem),MT(o.mat,{soft:true,side:DS})); m.scale.z=o.zs||.88;
  if(o.trim) add(R.torso,G.robe([[b.sh*f*1.01,y0-L-.005],[b.sh*f*.99,y0-L+.035]],o.folds||8,o.amp==null?.02:o.amp,30,o.gap||0,o.hem),MT(o.trim,{metal:.4,side:DS})).scale.z=o.zs||.88;
  return m; };
// tabard panels from the waist; the front and back panels follow the legs when walking
GB.panels=(R,C,o)=>{ const b=C.b, L=o.len||.6, n=o.n||4, r=b.hp*1.1+.02, ps=[];
  for(let i=0;i<n;i++){ const a=(o.a0||0)+i/n*PI*2, p=grp(R.hips,Math.sin(a)*r,.1,Math.cos(a)*r*.92); p.rotation.y=a;
    const w=(o.w||.2)*(Math.abs(Math.cos(a))>.7?1:o.side||.8);
    add(p,G.cloth(w,L,o.flare||1.12,1,.012,.022),MT(o.mat,{soft:true,side:DS}),0,-L/2,0,o.tilt==null?-.08:o.tilt);
    if(o.trim) add(p,G.box(w*(o.flare||1.12),.035,.03),MT(o.trim,{metal:.5}),0,-L+.015,-.01-L*.08);
    ps.push({p,a}); }
  (R.anim=R.anim||[]).push((R,P)=>{ const f=Math.min(P.legL,P.legR), bk=Math.max(P.legL,P.legR); ps.forEach(({p,a})=>{ const c=Math.cos(a); p.rotation.x=c>.7?Math.min(0,f)*.85:c<-.7?Math.max(0,bk)*-.85*-1:0; }); });
  return ps; };
// sleeves: bell (wide), trailing (hangs from the elbow to the knee), puffed shoulders
GB.bell=(R,C,o)=>{ for(const n of ['L','R']){ const el=R['elbow'+n], L=o.len||.32, r1=o.r1||.17;
    add(el,G.lathe([[r1,-L],[r1*.86,-L*.7],[(o.r0||.075)*1.25,-.08],[o.r0||.075,.03]],16),MT(o.mat,{soft:true,side:DS}),0,0,0);
    if(o.trim) add(el,G.tor(r1*.99,.022,4,16),MT(o.trim,{metal:.6}),0,-L+.01,0,PI/2); } };
GB.trail=(R,C,o)=>{ const ps=[]; for(const n of ['L','R']){ const p=grp(R['elbow'+n],0,-.12,-.02); const L=o.len||.55;
    add(p,G.cloth(o.w||.15,L,o.flare||1.5,1.5,.02,.02),MT(o.mat,{soft:true,side:DS}),0,-L/2,-.03,.12); ps.push([p,n]); }
  (R.anim=R.anim||[]).push((R,P)=>ps.forEach(([p,n])=>{ const ax=n==='L'?P.armLX+P.elbowL:P.armRX+P.elbowR; p.rotation.x=-ax*.85+P.torsoX*-.5; })); };
GB.puff=(R,C,o)=>{ for(const n of ['L','R']) add(R['arm'+n],G.sph(o.r||.1,12,8),MT(o.mat,{soft:true}),0,-.07,0).scale.set(1,1.05,1); };
// pauldrons on the torso at the shoulder; s=+1 the figure's left
GB.pauldron=(R,C,o)=>{ const b=C.b; for(const s of o.sides||[1,-1]){ const p=o.arm?grp(R['arm'+(s>0?'L':'R')],s*b.ar*.55,b.ar*.9,0):grp(R.torso,b.sh*.98*s,.47,0); p.rotation.z=-.4*s; const k=(o.size||1)*(o.arm?b.ar*1.15/.1:1), m=MT(o.mat,{metal:o.metal||0}), m2=MT(o.mat2||sh(o.mat,.7),{metal:o.metal||0});
    if(o.style==='leaf'){ for(let i=0;i<3;i++){ const l=add(p,G.leaf(.12*k,.3*k),i%2?m2:m,0,.02-i*.06*k,-.04+i*.04); l.rotation.set(-PI/2+.25,0,0); l.rotation.order='YXZ'; l.rotation.y=s*(.3+i*.25); l.position.x=s*.04*i; } }
    else if(o.style==='bone'){ const sk=grp(p,0,.02*k,.02*k); sk.rotation.y=s*.5; add(sk,G.sph(.09*k,12,8),m,0,.03*k,0).scale.set(1,.85,1.1); add(sk,G.box(.1*k,.045*k,.08*k),m2,0,-.03*k,.05*k);
      for(const e of [1,-1]){ add(sk,G.sph(.026*k,6,5),M(0x140a08),e*.035*k,.04*k,.085*k).scale.set(1,1.1,.6); add(sk,G.cone(.014*k,.09*k,4),M(0xf4ecd8),e*.04*k,-.06*k,.07*k,PI); }
      for(let i=0;i<2;i++) add(p,G.cone(.028*k,.17*k,5),m2,s*(.05+i*.05)*k,.07*k,(-.04+i*.07)*k,0,0,-s*(.7+i*.3)); }
    else if(o.style==='spike'){ for(let i=0;i<2;i++) add(p,G.cap(.12*k*(1-i*.12),.5,12,6),i?m2:m,0,-i*.04,0).scale.set(1,.8,1); const n=o.n||3; for(let i=0;i<n;i++) add(p,G.cone(.035*k,.2*k,5),MT(o.spike||0x9aa0a8,{metal:.8}),s*(.02+i*.06)*k,.08*k,(i-(n-1)/2)*.05,0,0,-s*(.75+i*.25)); }
    else if(o.style==='fur'){ for(let i=0;i<6;i++){ const a=i/6*PI*2; add(p,G.sph(.07*k,7,5),i%2?m2:m,Math.sin(a)*.06*k,.02+(i%3)*.02,Math.cos(a)*.06*k); } }
    else { for(let i=0;i<(o.layers||2);i++) add(p,G.cap(.12*k*(1-i*.1),.5,12,6),i%2?m2:m,0,-i*.04*k,0).scale.set(1,.85,1); } } };
// a belt (or sash) with hanging kit; items {t, a (angle from front, + to the figure's left), c}
GB.belt=(R,C,o)=>{ const b=C.b, y=o.y==null?.08:o.y, r=b.wa*(o.rk||1.13), dz=C.dz*1.04;
  if(o.mat) add(R.torso,G.tor(r,o.w||.03,5,22),MT(o.mat),0,y,0,PI/2).scale.set(1,dz,1);
  if(o.buckle) add(R.torso,G.box(o.bw||.08,o.bh||.07,.03),M(o.buckle,{metal:.85}),0,y,r*dz+.02);
  for(const it of o.items||[]){ const a=it.a, x=Math.sin(a)*r*1.02, z=Math.cos(a)*r*dz*1.02, g=grp(R.torso,x,y-.02,z); g.rotation.y=a; const c=it.c;
    if(it.t==='pouch'){ add(g,G.box(.08,.1,.06),MT(c||0x6b4428,{soft:true}),0,-.05,.03); add(g,G.box(.085,.035,.065),MT(sh(c||0x6b4428,.75)),0,-.005,.03); }
    else if(it.t==='vial'){ add(g,G.sph(.035,8,6),M(c||0x7aff9a,{glow:true}),0,-.07,.035); add(g,G.cyl(.012,.014,.04,6),M(0xe8e0d0),0,-.03,.035); add(g,G.cyl(.016,.016,.015,6),M(0x6b4428),0,-.008,.035); }
    else if(it.t==='book'){ add(g,G.box(.12,.15,.05),MT(c||0x5a2030),0,-.09,.04,0,0,.1); add(g,G.box(.11,.14,.052),M(0xe8dcc0),.006,-.09,.04,0,0,.1); add(g,G.box(.02,.15,.056),M(0xd8b048,{metal:.8}),-.05,-.09,.04,0,0,.1); }
    else if(it.t==='scroll'){ add(g,G.cyl(.025,.025,.16,8),M(c||0xe8dcc0),0,-.08,.03,0,0,.25); add(g,G.cyl(.028,.028,.02,8),M(0xb03028),0,-.08,.03,0,0,.25); }
    else if(it.t==='skull'){ add(g,G.sph(.045,8,6),M(c||0xe8e0c8),0,-.07,.03); add(g,G.box(.05,.025,.04),M(c||0xe8e0c8),0,-.105,.04); for(const e of [1,-1]) add(g,G.sph(.012,4,3),M(0x140c10),e*.016,-.065,.07); }
    else if(it.t==='knife'){ add(g,G.box(.025,.16,.025),M(0x4a3020),0,-.08,.03,0,0,.3); add(g,G.box(.03,.04,.03),M(0x9aa0a8,{metal:.8}),.02,-.015,.03,0,0,.3); }
    else if(it.t==='hammer'){ add(g,G.cyl(.014,.014,.22,6),M(0x6b4428),0,-.1,.03,0,0,.15); add(g,G.box(.1,.05,.05),M(0x8a929c,{metal:.85}),-.016,-.21,.03,0,0,.15); }
    else if(it.t==='feather'){ add(g,G.leaf(.03,.18),MT(c||0xf0e6d0,{soft:true}),0,-.02,.03,PI); }
    else if(it.t==='bone'){ add(g,G.cyl(.012,.012,.12,5),M(c||0xe8e0c8),0,-.07,.03); for(const e of [-.13,-.01]) add(g,G.sph(.018,5,4),M(c||0xe8e0c8),0,e,.03); }
    else if(it.t==='tassel'){ add(g,G.cyl(.01,.025,.14,6),MT(c||0xd8b048,{soft:true}),0,-.08,.03); add(g,G.sph(.02,6,5),M(c||0xd8b048),0,-.01,.03); }
    else if(it.t==='lantern'){ add(g,G.box(.06,.08,.06),M(0x3a3028,{metal:.5}),0,-.1,.04); add(g,G.box(.04,.05,.065),M(c||0x8affc0,{glow:true}),0,-.1,.04); add(g,G.tor(.02,.006,3,8),M(0x3a3028),0,-.05,.04); } } };
// necklaces sit on the collarbones and hang to the chest
GB.necklace=(R,C,o)=>{ const b=C.b, n=o.n||9, y0=.5, dz=C.dz;
  for(let i=0;i<n;i++){ const u=i/(n-1), a=(u-.5)*(o.span||2.2), hang=Math.cos((u-.5)*PI)*(o.drop||.08), r=b.ch*(o.rk||.95);
    const x=Math.sin(a)*r, z=Math.cos(a)*r*dz+.012, y=y0-hang;
    if(o.t==='teeth'){ add(R.torso,G.cone(.014,.05,4),M(o.c||0xf0e8d8),x,y-.02,z,PI); }
    else if(o.t==='bones'){ add(R.torso,G.cyl(.01,.01,.05,4),M(o.c||0xe8e0c8),x,y-.015,z); }
    else if(o.t==='claws'){ add(R.torso,G.cone(.016,.07,4),M(o.c||0x2a2018),x,y-.03,z,PI+.2*(u-.5)); }
    else add(R.torso,G.sph(o.r||.016,5,4),M(i%2&&o.c2?o.c2:o.c||0xd8b048,{metal:o.metal||0,glow:!!o.glow}),x,y,z); }
  if(o.pendant){ const p=o.pendant; add(R.torso,G.oct(p.r||.035),M(p.c,{glow:!!p.glow,metal:p.metal||0}),0,y0-(o.drop||.08)-.05,b.ch*.95*dz+.03).scale.set(1,1.3,.6);
    if(p.frame) add(R.torso,G.tor(p.r*1.2||.04,.008,4,10),M(p.frame,{metal:.9}),0,y0-(o.drop||.08)-.05,b.ch*.95*dz+.03); } };
// fringe strips under a ring (sleeves, hems)
GB.fringe=(par,o)=>{ for(let i=0;i<o.n;i++){ const a=(o.a0||0)+i/o.n*(o.span||PI*2), x=Math.sin(a)*o.r, z=Math.cos(a)*o.r*(o.dz||1);
    add(par,G.box(o.w||.016,o.len||.08,.008),MT(o.mat,{soft:true}),x,o.y-(o.len||.08)/2,z,0,a,0); } };
// a braid or rope of beads along a curve
GB.braid=(par,pts,r0,r1,mats,n=8)=>{ const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))); for(let i=0;i<n;i++){ const u=i/(n-1), p=c.getPointAt(u); add(par,G.sph(r0+(r1-r0)*u,7,5),mats[i%mats.length],p.x,p.y,p.z).scale.set(1,1.15,1); } };
// chain links along a curve
GB.chain=(par,pts,m,n=8)=>{ const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))); for(let i=0;i<n;i++){ const p=c.getPointAt(i/(n-1)), t=c.getTangentAt(i/(n-1)); const l=add(par,G.tor(.022,.007,4,8),m,p.x,p.y,p.z); LAB.aim(l,t.x,t.y,t.z); l.rotateY(i%2?PI/2:0); } };
// strips of cloth or moss hanging from points (veils, rags, fringes)
GB.strands=(par,list,mats,r0=.016,r1=.008)=>list.forEach((pts,i)=>add(par,G.tube(pts,r0,r1,10,4),mats[i%mats.length],0,0,0));
// a strap across the torso surface from a to b (torso space), lifted off the skin
GB.strap=(R,C,a,b,m,w=.045)=>{ const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2], L=Math.hypot(dx,dy,dz); const s=add(R.torso,G.box(w,L,.02),MT(m),(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2); LAB.aim(s,dx,dy,dz); return s; };


/* beards hang from the jaw in head space, flattened, tilted forward over the chest */
GB.beard=(R,C,o)=>{ const h=R.head, m=MT(o.tex||o.c,{soft:true}), d=MT(sh(o.c,.78),{soft:true}), L=o.len||.3, st=o.style||'long', z=o.z==null?.07:o.z, zs=o.zs||.6;
  const g=grp(h,0,.075,z); g.rotation.x=o.tilt==null?.14:o.tilt;
  if(st==='long'||st==='fork'||st==='braid'){ const w=o.w||1;
    const pts=st==='long'?[[.012,-L],[.05*w,-L*.8],[.1*w,-L*.5],[.13*w,-.14],[.15*w,-.03],[.155*w,.02],[.14*w,.05]]:[[.09*w,-L*.42],[.13*w,-L*.3],[.15*w,-.1],[.16*w,-.02],[.16*w,.02],[.14*w,.05]];
    add(g,G.robe(pts,o.folds||9,.02,26),m,0,0,0).scale.z=zs;
    if(st==='fork') for(const s of [1,-1]){ GB.braid(g,[[.06*s,-L*.36,.03],[.07*s,-L*.62,.05],[.06*s,-L*.85,.06],[.05*s,-L,.06]],.05*w,.03,[m,d],7);
      for(const k of [.62,.86]) add(g,G.tor(.04*w,.012,4,10),M(o.ring||0xd8b048,{metal:.85}),.065*s,-L*k,.05,PI/2); }
    if(st==='braid'){ GB.braid(g,[[0,-L*.36,.05],[0,-L*.6,.06],[0,-L*.85,.06],[0,-L,.05]],.045,.03,[m,d],6); add(g,G.cyl(.03,.03,.04,8),M(o.ring||0xe8e0c8),0,-L*.98,.05); } }
  else if(st==='goatee'){ add(g,G.cone(.05,L,8),m,0,-L/2+.0,.07,PI).scale.set(1,1,.7); }
  else if(st==='short'){ add(g,G.robe([[.11,-.08],[.15,-.03],[.16,.02],[.14,.05]],9,.012,22),m,0,0,0).scale.z=zs; }
  else if(st==='moss'){ GB.seed(9); const L2=[]; for(let i=0;i<9;i++){ const u=i/8-.5, x=u*.22, l=L*(.7+rnd()*.5); L2.push([[x,.02,.1],[x*1.1,-.1,.13],[x*.9,-l*.6,.13],[x*.7+(rnd()-.5)*.04,-l,.11]]); } GB.strands(g,L2,[m,d],.025,.01); }
  if(o.stache){ const mm=o.stache==='thin'?.012:o.stache==='big'?.032:.022; for(const s of [1,-1]) add(h,G.tube([[.012*s,.105,.165],[.05*s,.098,.16],[.085*s,.07,.14],[.1*s,o.stache==='big'?.0:.03,.12]],mm,mm*.5,10,5),o.stache==='thin'?d:m,0,0,0); }
  return g; };

/* ---------- headwear (registered as hat types; the kit calls them with the rig) ---------- */
const H=LAB.HATS;
// sorceress hat: wide flat brim tipped back, low dented crown, ribbon bow and a plume
H.wide=(R,o,K)=>{ const par=R.hat, m=MT(o.tex||o.c,{soft:true,side:DS}), m1=MT(o.tex||o.c,{soft:true}), rib=MT(o.band||0x1a2448,{soft:true});
  const BR=o.brim||.38; add(par,G.disc(.15,BR,36,(x,z,r,a)=>{ const t=(r-.15)/(BR-.15); return .05*t*t*(1-Math.cos(a))*.5+.018*t*Math.sin(4*a)-.03*t*t*(Math.cos(a)>0?Math.cos(a):0); }),m,0,-.01,0);
  const cr=G.lathe([[.175,0],[.17,.06],[.15,.12],[.1,.165],[.03,.18],[.001,.18]],18), p=cr.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i), x=p.getX(i); if(y>.12) p.setY(i,y-.035*Math.max(0,1-Math.abs(x)/.06)); } cr.computeVertexNormals();
  add(par,cr,m1,0,0,0); add(par,G.tor(.172,.026,5,18),rib,0,.035,0,PI/2);
  const bow=grp(par,.15,.05,.08); bow.rotation.y=.9; add(bow,G.leaf(.07,.14),rib,0,0,0,0,0,PI/2+.3); add(bow,G.leaf(.07,.14),rib,0,0,0,0,0,-PI/2-.3); add(bow,G.sph(.03,6,5),rib,0,0,.01);
  add(bow,G.leaf(.04,.18),rib,.03,-.02,-.02,0,0,PI-.3); add(bow,G.leaf(.04,.16),rib,-.03,-.02,-.02,0,0,PI+.4);
  if(o.plume){ const pm=MT(o.plume,{soft:true}), pg=grp(par,.13,.07,.02); pg.rotation.set(-1.05,.35,-.5); const fl=add(pg,G.leaf(.11,.46),pm,0,0,0); fl.scale.set(1,1,2.2);
    add(pg,G.leaf(.07,.36),MT(sh(o.plume,.82),{soft:true}),.0,.03,-.012).scale.set(1,1,2); add(pg,G.cyl(.006,.004,.44,4),M(sh(o.plume,.6)),0,.22,.008); }
  if(o.gem) add(par,G.oct(.03),M(o.gem,{glow:true}),0,.035,.19).scale.set(1,1.4,.6);
  R.hatTip=grp(par,0,.18,0); };
// crooked witch hat: wide floppy brim, crown kinked at mid height, drooping tip with a charm
H.crooked=(R,o,K)=>{ const par=R.hat, m=MT(o.tex||o.c,{soft:true,side:DS}), m1=MT(o.tex||o.c,{soft:true}); const BR=o.brim||.32, tall=o.tall||.62;
  add(par,G.disc(.16,BR,32,(x,z,r,a)=>{ const t=(r-.16)/(BR-.16); return -.07*t*t*(1+.8*Math.sin(2*a+1.1))+.03*t*Math.sin(5*a)+.05*t*t*Math.max(0,Math.cos(a)); }),m,0,0,0);
  const cr=G.lathe([[.19,0],[.17,.08],[.13,tall*.35],[.1,tall*.5],[.075,tall*.66],[.05,tall*.82],[.02,tall]],18), p=cr.attributes.position;
  for(let i=0;i<p.count;i++){ const y=p.getY(i), u=y/tall, x=p.getX(i), z=p.getZ(i); const kink=u>.45?(u-.45):0; p.setXYZ(i,x+.05*u+.55*kink*kink*2.4,y-.18*kink*kink*3,z-.1*u*u); }
  cr.computeVertexNormals(); add(par,cr,m1,0,.01,0);
  add(par,G.tor(.185,.03,5,18),MT(o.band||0x1a1020),0,.05,0,PI/2).scale.set(1,1,1.15);
  if(o.buckle) add(par,G.box(.075,.065,.02),M(o.buckle,{metal:.9}),.02,.05,.21);
  R.hatTip=grp(par,.05+.55*(.55*.55)*2.4,tall*.82,-.1);
  if(o.charm){ add(R.hatTip,G.cyl(.004,.004,.1,3),M(0x8a8a90),0,-.05,0); add(R.hatTip,G.tor(.03,.01,4,10,PI*1.4),M(o.charm,{glow:true}),0,-.11,0,0,0,.6); } };
// a fine circlet with a leaf crest and a gem on the brow
H.circlet=(R,o,K)=>{ const h=R.head, m=M(o.c||0xd8dce8,{metal:.95}); add(h,G.tor(.168,.012,4,22),m,0,.215,-.015,PI/2-.32);
  const crest=grp(h,0,.24,.15); crest.rotation.x=-.35; for(const s of [1,-1]) add(crest,G.leaf(.04,.14),m,.035*s,-.01,0,0,0,-s*.7);
  add(crest,G.leaf(.045,.16),m,0,.0,0); if(o.gem) add(crest,G.oct(.028),M(o.gem,{glow:true}),0,-.005,.02).scale.set(1,1.3,.6); R.hatTip=grp(R.hat,0,0,0); };
// crown of leaves and small flowers
H.flowers=(R,o,K)=>{ const h=R.head, lm=[0x3f8a3a,0x5aa844].map(c=>M(c,{soft:true})), fl=(o.fl||[0xfff4f0,0xf6b8d0,0xffe6a0]);
  for(let i=0;i<16;i++){ const a=i/16*PI*2, x=Math.sin(a)*.17, z=Math.cos(a)*.165-.01; const l=add(h,G.leaf(.04,.1),lm[i%2],x,.235-.03*Math.cos(a),z); l.rotation.order='YXZ'; l.rotation.set(-1.2,a,.3); }
  for(let i=0;i<7;i++){ const a=-1.5+i*.5, x=Math.sin(a)*.175, z=Math.cos(a)*.17-.01, c=fl[i%fl.length]; const f=grp(h,x,.25-.03*Math.cos(a),z); f.rotation.order='YXZ'; f.rotation.set(-.9,a,0);
    for(let k=0;k<5;k++){ const b=k/5*PI*2; add(f,G.sph(.022,6,4),M(c,{soft:true}),Math.sin(b)*.024,Math.cos(b)*.024,0).scale.set(1,1,.5); } add(f,G.sph(.014,5,4),M(0xf0c040),0,0,.01); }
  R.hatTip=grp(R.hat,0,0,0); };
// brass goggles pushed up on the brow
H.goggles=(R,o,K)=>{ const h=R.head, br=M(o.c||0xc8903a,{metal:.85}), st=M(o.strap||0x3a2418);
  add(h,G.tor(.168,.016,4,22),st,0,.25,-.02,PI/2-.45);
  for(const s of [1,-1]){ const g=grp(h,.058*s,.27,.13); g.rotation.x=-.75; add(g,G.cyl(.045,.045,.045,12),br,0,0,0); add(g,G.cyl(.034,.034,.05,12),M(o.lens||0x7ad8ff,{glow:true}),0,.005,0); add(g,G.tor(.045,.01,4,12),br,0,.025,0,PI/2); }
  add(h,G.box(.03,.02,.03),br,0,.27,.16); R.hatTip=grp(R.hat,0,0,0); };
// twin buns with braids looping down
H.buns=(R,o,K)=>{ const h=R.head, m=MT(o.c,{soft:true}), d=MT(sh(o.c,.75),{soft:true}), bd=M(o.bead||0xd8b048,{metal:.8});
  for(const s of [1,-1]){ add(h,G.sph(.085,10,8),m,.13*s,.27,-.06); add(h,G.tor(.06,.018,4,12),d,.13*s,.27,-.06,0,.9*s,0);
    GB.braid(h,[[.15*s,.13,-.01],[.18*s,.0,.01],[.18*s,-.14,.03],[.16*s,-.27,.04]],.042,.03,[m,d],7); add(h,G.cyl(.032,.026,.04,8),bd,.16*s,-.3,.04); } R.hatTip=grp(R.hat,0,0,0); };
// rusted iron crown with uneven spikes and dull gems
H.spikecrown=(R,o,K)=>{ const h=R.head, m=M(o.c||0x6a5a4a,{metal:.55}), g=M(o.gem||0x6affd0,{glow:true});
  add(h,G.cyl(.172,.165,.07,12,1,true),M(o.c||0x6a5a4a,{metal:.55,side:DS}),0,.27,0); add(h,G.tor(.17,.014,4,16),m,0,.235,0,PI/2);
  for(let i=0;i<7;i++){ const a=i/7*PI*2, ht=.12+((i*5)%3)*.05+(i===0?.07:0); const c=add(h,G.cone(.03,ht,4),m,Math.sin(a)*.168,.3+ht/2-.02,Math.cos(a)*.165); LAB.aim(c,Math.sin(a)*.25,1,Math.cos(a)*.25); }
  for(const a of [0,2.2,-2.2]) add(h,G.oct(.022),g,Math.sin(a)*.18,.27,Math.cos(a)*.175); R.hatTip=grp(R.hat,0,0,0); };
// deer skull mask with branching antlers
H.deerskull=(R,o,K)=>{ const h=R.head, bm=M(o.c||0xe6dcc4), dk=M(0x0e0a0c), am=M(o.antler||0x5a4630), gl=M(o.eyes||0x9cff6a,{glow:true});
  const sk=grp(h,0,.2,.06); add(sk,G.sph(.15,14,10),bm,0,0,0).scale.set(1,.9,1.1);
  const sn=add(sk,G.cyl(.06,.1,.22,8),bm,0,-.06,.14,PI/2+.5); sn.scale.set(1,1,.75); add(sk,G.box(.07,.03,.06),bm,0,-.13,.22,.4);
  for(const s of [1,-1]){ add(sk,G.sph(.04,8,6),dk,.07*s,.0,.12).scale.set(1,1.1,.6); add(sk,G.sph(.014,5,4),gl,.07*s,.0,.135); add(sk,G.sph(.012,4,3),dk,.025*s,-.12,.24); }
  for(const s of [1,-1]){ const A=[[.08*s,.12,-.02],[.2*s,.26,-.06],[.27*s,.44,-.1],[.36*s,.6,-.08]]; add(sk,G.tube(A,.032,.014,12,5),am,0,0,0);
    for(const [i,dx,dy] of [[1,.12,.12],[2,.06,.16],[2,-.1,.12]]){ const p=A[i]; add(sk,G.tube([p,[p[0]+dx*s*.6,p[1]+dy*.6,p[2]-.02],[p[0]+dx*s,p[1]+dy,p[2]-.04]],.018,.008,6,4),am,0,0,0); } }
  R.hatTip=grp(R.hat,0,0,0); };
// crown of black thorns with a veil of hanging moss
H.thornveil=(R,o,K)=>{ const h=R.head, tm=M(o.c||0x241820), mm=[o.moss||0x3a5236,sh(o.moss||0x3a5236,.75),0x2a3a2a].map(c=>M(c,{soft:true}));
  add(h,G.tor(.175,.02,4,18),tm,0,.24,0,PI/2-.15); for(let i=0;i<11;i++){ const a=i/11*PI*2; const c=add(h,G.cone(.016,.1+(i%3)*.05,4),tm,Math.sin(a)*.175,.27,Math.cos(a)*.17); LAB.aim(c,Math.sin(a)*.5,1,Math.cos(a)*.5); }
  GB.seed(5); const L=[]; for(let i=0;i<13;i++){ const a=PI*.6+i/12*PI*.8, x=Math.sin(a)*.18, z=Math.cos(a)*.17, len=.3+rnd()*.25;
    L.push([[x,.23,z],[x*1.12,.1,z*1.1],[x*1.18,-.05-len*.3,z*1.12],[x*1.12,.05-len,z*1.05]]); }
  GB.strands(h,L,mm,.022,.01);
  if(o.halo){ const hg=grp(h,0,.2,-.13); for(let i=0;i<11;i++){ const a=-1.45+i*.29, len=.22+((i*5)%3)*.08; const c=add(hg,G.cone(.022,len,4),tm,Math.sin(a)*(.17+len/2),Math.cos(a)*(.17+len/2),0,0,0,-a); for(const k of [.35,.65]) add(hg,G.cone(.01,.06,3),tm,Math.sin(a)*(.17+len*k)+Math.cos(a)*.02,Math.cos(a)*(.17+len*k)-Math.sin(a)*.02,0,0,0,-a+1.1); } }
  if(o.leaves) for(let i=0;i<6;i++){ const a=-1.2+i*.5; add(h,G.leaf(.035,.09),M(o.leaves,{soft:true}),Math.sin(a)*.18,.26,Math.cos(a)*.17,-.6,a,0); }
  R.hatTip=grp(R.hat,0,0,0); };
// wolf pelt: the wolf's head rides above the brow (the face shows under its jaw), pelt down the back, paws on the chest
H.wolf=(R,o,K)=>{ const h=R.head, f=MT(o.tex||o.c,{soft:true}), f2=MT(sh(o.c,.7),{soft:true}), lt=MT(sh(o.c,1.25),{soft:true}), dk=M(0x140e0c), tooth=M(0xf0e8d8), b=R.b;
  const w=grp(h,0,.4,-.09); w.rotation.x=.2; add(w,G.sph(.17,14,10),f,0,0,0).scale.set(1.12,.78,1.2);
  const sn=add(w,G.cyl(.05,.085,.2,8),f,0,-.03,.24,PI/2+.12); sn.scale.set(1.05,1,.75); add(w,G.box(.1,.03,.16),lt,0,-.075,.23);
  add(w,G.sph(.032,6,5),dk,0,-.015,.345); for(const s of [1,-1]) for(let i=0;i<3;i++) add(w,G.cone(.012,.045,4),tooth,(.035+i*.004)*s,-.085,.31-i*.045,PI);
  for(const s of [1,-1]){ const e=grp(w,.1*s,.11,-.04); e.rotation.set(-.15,0,-.32*s); add(e,G.cone(.065,.19,5),f,0,.08,0).scale.set(1,1,.6); add(e,G.cone(.035,.12,4),lt,0,.06,.02).scale.set(1,1,.4);
    add(w,G.sph(.022,6,5),M(o.eyes||0xe8c060,{glow:true}),.075*s,.035,.165); add(w,G.box(.05,.012,.02),dk,.075*s,.06,.16,0,0,-.4*s); }
  // pelt: a partial lathe round the back of the torso, ragged hem, a tail at the bottom
  const pts=[[b.sh*1.0,-.12],[b.sh*1.08,.12],[b.sh*1.06,.32],[b.sh*.85,.48],[.14,.64]];
  const pl=add(R.torso,G.arc(pts,PI-1.25,2.5,6,.03,20,GB.tatter(.06,3)),MT(o.tex||o.c,{soft:true,side:DS}),0,0,0); pl.scale.z=C_dz(R)*1.15;
  add(R.torso,G.tube([[0,-.1,-b.ch*.9],[.03,-.28,-b.ch*1.05],[.06,-.45,-b.ch*.95]],.06,.02,10,6),f,0,0,0);
  for(const s of [1,-1]){ const g=grp(R.torso,b.sh*.7*s,.5,b.ch*.55); add(g,G.tube([[0,0,0],[0,-.08,.06],[0,-.2,.08]],.04,.035,8,6),f2,0,0,0); for(let i=0;i<3;i++) add(g,G.cone(.01,.04,4),tooth,(i-1)*.02,-.23,.09,PI); }
  R.hatTip=grp(R.hat,0,0,0); };
const C_dz=R=>R.b.dz||.72;
// feather headdress fanned up and back
H.feathers=(R,o,K)=>{ const h=R.head, band=MT(o.band||0x8a2a1a), fm=[o.c||0xf4ecdc,o.c2||0xe8dcc8].map(c=>MT(c,{soft:true})), tip=M(o.tip||0x3a2418,{soft:true});
  add(h,G.tor(.17,.022,4,20),band,0,.2,0,PI/2-.15); for(let i=0;i<5;i++){ const a=-.7+i*.35; add(h,G.box(.022,.022,.012),M(i%2?0x2a8a8a:0xe8d8b0),Math.sin(a)*.172,.2+.025*Math.cos(a)*.0,Math.cos(a)*.168); }
  const n=o.n||9; for(let i=0;i<n;i++){ const u=i/(n-1)-.5, a=u*2.4+PI; const f=grp(h,Math.sin(a)*.16,.25,Math.cos(a)*.15); f.rotation.order='YXZ'; f.rotation.set(-.35-Math.abs(u)*.5,a+PI,u*-.9);
    const L=(o.len||.36)*(1-Math.abs(u)*.45); add(f,G.leaf(.06,L),fm[i%2],0,0,0).scale.set(1,1,1.5); add(f,G.leaf(.062,L*.25),tip,0,L*.76,.002).scale.set(1,1,1.6); }
  R.hatTip=grp(R.hat,0,0,0); };
// topknot: shaved head, a bun at the crown and a tail swinging behind
H.topknot=(R,o,K)=>{ const h=R.head, m=MT(o.c,{soft:true}), d=MT(sh(o.c,.72),{soft:true});
  add(h,G.cap(.168,.32,14,6),d,0,.17,-.02,-.3); add(h,G.sph(.06,8,6),m,0,.33,-.05); add(h,G.tor(.04,.014,4,10),M(o.ring||0xd8b048,{metal:.8}),0,.29,-.05,PI/2);
  const tail=grp(h,0,.33,-.08); R.flick.push({o:tail,ax:'z',a:.12,k:1,p:.5,z0:0});
  add(tail,G.tube([[0,0,0],[0,.08,-.12],[0,-.05,-.25],[0,-.3,-.28],[0,-.45,-.22]],.045,.02,14,6),m,0,0,0); R.hatTip=grp(R.hat,0,0,0); };
// banshee hair: a fan of floating tendrils spreading to the sides and behind, curling at the tips
H.stream=(R,o,K)=>{ const h=R.head, ms=[o.c,sh(o.c,.82),sh(o.c,1.1)].map(c=>M(c,{soft:true})), tip=M(o.tip||0x9affff,{glow:true}); add(h,G.cap(.172,.5,14,8),ms[0],0,.17,-.02,-.55);
  for(let i=0;i<14;i++){ const u=i/13-.5, a=PI+u*2.3, x=Math.sin(a)*.15, z=Math.cos(a)*.13; const g=grp(h,x,.24+.04*Math.cos(u*3),z); R.flick.push({o:g,ax:'z',a:.14,k:1,p:i*.9,z0:0});
    const L=(o.len||.6)*(.7+((i*7)%5)*.09), dx=Math.sin(PI+u*3.6), dz=Math.cos(PI+u*3.6), cu=(i%2?1:-1)*.06;
    const pts=[[0,0,0],[dx*.1*L,.0,dz*.1*L-.04],[dx*.3*L+cu,.05,dz*.25*L-.12],[dx*.5*L,.0+cu,dz*.4*L-.2],[dx*.62*L-cu,-.12,dz*.5*L-.22],[dx*.6*L-cu*2,-.2,dz*.48*L-.2]];
    add(g,G.tube(pts,.04,.01,16,5),ms[i%3],0,0,0); add(g,G.sph(.016,4,3),tip,...pts[5]); }
  R.hatTip=grp(R.hat,0,0,0); };
})();
