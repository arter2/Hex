/* Humanoid kit: one rig, built from anatomy (normal, muscular, woman, fit woman, slender, skeleton)
   and dressed in layers (shirt, robe, vest, pants, boots, armour plates, leaves, vines), with hats,
   hoods and helmets. Player races, humanoid enemies, heroes and several minibosses come from this. */
(function(){
const {M,G,add,grp}=LAB, PI=Math.PI, T=THREE, DS=T.DoubleSide;
LAB.HATS=LAB.HATS||{};
const shade=(hex,k)=>{ const c=new T.Color(colOf(hex)); c.multiplyScalar(k); return c.getHex(); };
LAB.shadeHex=shade;
// colours, materials and painted textures are interchangeable wherever the kit takes a colour
function colOf(v){ return v==null?v:typeof v==='object'?(v.c instanceof T.Color?v.c.getHex():v.c):v; }
function MT(v,o={}){ if(v==null) return null; if(typeof v==='object'&&v.map) return M(v.c==null?0xffffff:v.c,Object.assign({},o,{tex:v})); if(typeof v==='object'&&v.c instanceof T.Color) return v; return M(v,o); }
LAB.MT=MT; LAB.colOf=colOf;
let seed=1; const rnd=()=>((seed=(seed*9301+49297)%233280)/233280);
LAB.rnd=rnd; LAB.seed=s=>{ seed=s; };

// sh shoulder half-width, ch chest radius, wa waist, hp hips, ar arm radius, lr leg radius
const BUILDS={
  normal:{sh:.25,ch:.19,wa:.15,hp:.17,ar:.06,lr:.085,neck:.065,dz:.72},
  muscle:{sh:.33,ch:.25,wa:.165,hp:.18,ar:.085,lr:.105,neck:.09,dz:.74,mus:1},
  fem:{sh:.205,ch:.16,wa:.112,hp:.195,ar:.047,lr:.08,neck:.052,dz:.7,fem:1},
  femfit:{sh:.235,ch:.18,wa:.125,hp:.2,ar:.06,lr:.09,neck:.06,dz:.72,fem:1,mus:.6},
  slender:{sh:.2,ch:.15,wa:.11,hp:.13,ar:.042,lr:.06,neck:.05,dz:.7},
  skel:{sh:.24,ch:.17,wa:.06,hp:.15,ar:.026,lr:.032,neck:.035,dz:.72,skel:1},
};
LAB.BUILDS=BUILDS;

/* scatter leaves (or any blades) in a ring: flat side out, tip hanging down and out */
function ring(par,n,y,r,dz,mats,w,h,tilt,jit=.3,a0=0){ const out=[];
  for(let i=0;i<n;i++){ const a=a0+i/n*PI*2+(rnd()-.5)*jit, yy=y+(rnd()-.5)*h*.3;
    const l=add(par,G.leaf(w*(.85+rnd()*.3),h*(.85+rnd()*.3)),mats[i%mats.length],Math.sin(a)*r,yy,Math.cos(a)*r*dz);
    l.rotation.order='YXZ'; l.rotation.set(PI-tilt+(rnd()-.5)*.3,a,(rnd()-.5)*.5); out.push(l); } return out; }
LAB.leafRing=ring;
// a vine spiralling round a lathe profile
function vine(par,prof,dz,turns,m,leafM,r0=.016,a0=0){ const pts=[]; const N=22, y0=prof[0][1], y1=prof[prof.length-1][1];
  const rAt=y=>{ for(let i=1;i<prof.length;i++) if(y<=prof[i][1]){ const [ra,ya]=prof[i-1],[rb,yb]=prof[i]; return ra+(rb-ra)*(y-ya)/((yb-ya)||1); } return prof[prof.length-1][0]; };
  for(let i=0;i<=N;i++){ const u=i/N, y=y0+(y1-y0)*u, a=a0+u*turns*PI*2, r=rAt(y)+r0*.8; pts.push([Math.sin(a)*r,y,Math.cos(a)*r*dz]); }
  add(par,G.tube(pts,r0,r0*.7,N*2,5),m,0,0,0);
  if(leafM) for(let i=2;i<N;i+=3){ const [x,y,z]=pts[i], a=Math.atan2(x,z/dz); const l=add(par,G.leaf(.035,.08),leafM,x*1.05,y,z*1.05); l.rotation.order='YXZ'; l.rotation.set(-.6+rnd()*.5,a,(rnd()-.5)); } }
LAB.vine=vine;

/* ---------- hats ---------- */
// a floppy brimmed hat: drooping, crumpled brim and a crown that bends back and folds at the tip
function floppy(par,R,H,witch){ const hm=MT(H.tex||H.c,{soft:true,side:DS}), hm1=MT(H.tex||H.c,{soft:true}), band=MT(H.band||0x8a5a34);
  const BR=H.brim||(witch?.31:.29), droop=H.droop==null?.06:H.droop, ph=H.phase||0, tall=H.tall||(witch?.58:.46), bend=H.bend==null?(witch?.08:.12):H.bend, side=H.side==null?(witch?.1:.14):H.side;
  add(par,G.disc(.16,BR,32,(x,z,r,a)=>{ const t=(r-.16)/(BR-.16); return -droop*t*t*(1+.7*Math.sin(2*a+ph))+.025*t*Math.sin(5*a+ph*2)+(witch?0:.03*t*Math.cos(a)); }),hm,0,0,0);
  const crown=G.lathe([[.19,0],[.18,.07],[.15,tall*.4],[.11,tall*.66],[.07,tall*.86],[.045,tall]],18), p=crown.attributes.position;
  for(let i=0;i<p.count;i++){ const y=p.getY(i), u=y/tall, x=p.getX(i), z=p.getZ(i), a=Math.atan2(x,z), k=1+.07*Math.sin(3*a+u*5+ph)*u;
    p.setXYZ(i,x*k+side*u*u,y-(witch?0:.04*u*u),z*k-bend*u*u); }
  crown.computeVertexNormals(); add(par,crown,hm1,0,.01,0);
  add(par,G.tor(.19,.03,5,18),band,0,.045,0,PI/2).scale.set(1,1,1.2);
  if(H.buckle) add(par,G.box(.08,.065,.02),M(0xe2b850,{metal:.9}),0,.045,.2);
  if(H.leaves) ring(par,9,.07,.2,1,H.leaves.map(c=>M(c,{soft:true})),.05,.13,1.9,.5);
  R.hatTip=grp(par,side,tall-.01,-bend); R.hatTip.rotation.order='XYZ';
  const tip=grp(R.hatTip); tip.rotation.z=-1.1*Math.sign(side||1); add(tip,G.cone(.05,witch?.24:.22,8),hm1,0,.08,0); }
function robin(par,R,H){ const hm=M(H.c,{soft:true,side:DS}), hm1=M(H.c,{soft:true});
  const cap=G.lathe([[.19,0],[.185,.06],[.16,.13],[.11,.19],[.05,.22],[.001,.225]],18), p=cap.attributes.position;
  for(let i=0;i<p.count;i++){ const z=p.getZ(i), y=p.getY(i); p.setZ(i,z*1.25-y*.35); p.setY(i,y*(1+.25*Math.max(0,-z/.19))); } cap.computeVertexNormals();
  add(par,cap,hm1,0,-.01,0);
  // brim: turned up at the back and sides, drawn into a beak at the front
  add(par,G.disc(.17,.29,30,(x,z,r,a)=>{ const t=(r-.17)/.12, c=Math.cos(a); return t*(.1*(1-c)/2+.02)-.02*Math.max(0,c); }),hm,0,0,0).scale.set(1,1,1.15);
  add(par,G.cone(.07,.16,4),hm1,0,-.01,.3,PI/2+.25).scale.set(1.6,1,.35);
  add(par,G.tor(.19,.02,4,18),M(H.band||0x6b3f24),0,.03,0,PI/2).scale.set(1,1.25,1);
  if(H.feather){ const f=M(H.feather,{soft:true}); add(par,G.tube([[.17,.04,-.02],[.26,.16,-.12],[.3,.3,-.28],[.27,.42,-.42]],.035,.008,12,5),f,0,0,0);
    add(par,G.tube([[.17,.04,-.02],[.26,.16,-.12],[.3,.3,-.28],[.27,.42,-.42]],.012,.004,12,4),M(0xf0e6d0),.005,.01,.005); }
  R.hatTip=grp(par,0,.2,0); }
// hood: cowl with a face opening and a point at the back
function hood(R,H,shoulderR){ const hm=M(H.c,{soft:true,side:DS}), hm1=M(H.c,{soft:true}), h=R.head;
  add(h,new T.SphereGeometry(.215,16,10,0,PI*2,0,PI*.38),hm1,0,.17,-.01);
  add(h,new T.SphereGeometry(.215,16,10,PI/2+.55,PI*2-1.1,PI*.37,PI*.38),hm,0,.17,-.01);
  add(h,G.tor(.135,.03,5,14,PI*1.25),hm1,0,.15,.13,0,0,-PI*.125).scale.set(1,1.15,1);
  if(H.point!==false) add(h,G.tube([[0,.33,-.08],[0,.36,-.2],[0,.3,-.32],[0,.2,-.38]],.08,.015,10,6),hm1,0,0,0);
  if(H.drape!==false) add(R.torso,G.robe([[shoulderR*1.25,.32],[shoulderR*.9,.45],[.1,.56]],6,.02,24),hm1,0,0,0).scale.z=.85;
  R.hatTip=grp(R.hat,0,0,0); }
// executioner's sack hood: covers the whole head, two eye holes
function sack(R,H){ const hm=M(H.c,{soft:true}), h=R.head;
  add(h,G.robe([[.22,-.06],[.2,.05],[.185,.2],[.15,.3],[.09,.38],[.01,.42]],5,.015,24),hm,0,0,0);
  for(const s of [1,-1]){ add(h,G.box(.075,.045,.04),M(0x050308),.065*s,.17,.19); add(h,G.box(.03,.022,.02),M(H.eyes||0xff3a2a,{glow:true}),.06*s,.17,.205); }
  add(R.torso,G.robe([[.42,.3],[.36,.42],[.2,.54],[.08,.6]],7,.025,28),hm,0,0,0).scale.z=.8;
  R.hatTip=grp(R.hat,0,0,0); }
// helmets: great (closed), knight (snouted visor), open (face shows), barbute; horns, crest, plume, spikes
function helm(R,H){ const hc=MT(H.tex||H.c,{metal:H.metal==null?.95:H.metal}), h2=MT(H.c2||shade(H.c,.65),{metal:.85}), h=R.head, slitM=M(H.slit||0x07050c,{glow:!!H.slit}), dark=M(0x07050c);
  const ty=H.type2||'great';
  if(ty==='great'){ add(h,G.lathe([[.215,-.04],[.22,.12],[.215,.26],[.19,.33],[.12,.37],[.001,.385]],16),hc,0,0,0);
    add(h,G.box(.3,.035,.05),dark,0,.18,.19); add(h,G.box(.034,.12,.05),dark,0,.12,.2);
    add(h,G.box(.2,.024,.03),slitM,0,.18,.2); add(h,G.box(.04,.42,.04),h2,0,.17,.205).scale.set(1,1,.6);
    add(h,G.tor(.218,.018,4,18),h2,0,.26,0,PI/2); add(h,G.tor(.222,.02,4,18),h2,0,-.03,0,PI/2); }
  else if(ty==='knight'){ add(h,G.cap(.215,.55,16,8),hc,0,.16,0); add(h,G.lathe([[.21,-.06],[.22,.08],[.215,.16]],16),h2,0,0,0);
    const v=add(h,G.cone(.17,.24,8),hc,0,.12,.17,PI/2); v.scale.set(1.05,1,.8); add(h,G.box(.26,.022,.06),slitM,0,.19,.24); add(h,G.box(.26,.022,.06),dark,0,.165,.22);
    add(h,G.box(.03,.3,.36),h2,0,.37,-.02); }
  else if(ty==='open'){ add(h,G.cap(.22,.5,16,8),hc,0,.16,0); add(h,new T.SphereGeometry(.222,16,10,PI/2+.75,PI*2-1.5,PI*.48,PI*.42),M(H.c,{metal:.95,side:DS}),0,.16,0);
    add(h,G.box(.04,.17,.04),h2,0,.2,.215); add(h,G.tor(.222,.02,4,18),h2,0,.18,0,PI/2); }
  else if(ty==='barbute'){ add(h,G.lathe([[.2,-.05],[.215,.1],[.22,.22],[.17,.34],[.001,.38]],16),hc,0,0,0);
    add(h,G.box(.05,.22,.05),dark,0,.1,.205); add(h,G.box(.2,.05,.05),dark,0,.2,.2); add(h,G.box(.14,.025,.03),slitM,0,.2,.215); }
  if(H.crest) add(h,G.box(.045,.12,.34),M(H.crest),0,.42,-.02);
  if(H.plume){ const pm=M(H.plume,{soft:true}); add(h,G.tube([[0,.38,.05],[0,.5,-.08],[0,.48,-.3],[0,.28,-.48]],.06,.02,12,6),pm,0,0,0); }
  if(H.spike) add(h,G.cone(.05,.26,6),h2,0,.48,0);
  if(H.spikes) for(let i=0;i<5;i++) add(h,G.cone(.03,.16,5),h2,0,.36-i*.01,.1-i*.08,-.3-i*.25);
  if(H.horns){ const hm=M(H.horns,{metal:.3}); for(const s of [1,-1]) add(h,G.tube([[.18*s,.22,0],[.34*s,.3,-.02],[.42*s,.48,-.08],[.36*s,.68,-.16]],.06,.012,14,6),hm,0,0,0); }
  if(H.wings) for(const s of [1,-1]) for(let i=0;i<3;i++) add(h,G.leaf(.05,.26-i*.05),M(H.wings,{metal:.9}),.22*s,.25,-.02-i*.06,-.2-i*.2,0,-s*(.9+i*.2));
  R.hatTip=grp(R.hat,0,0,0); }

/* ---------- anatomy ----------
   Limbs are offset-ellipse tubes with muscle profiles (deltoid, biceps, forearm, quads, calf) instead
   of cylinders; the head is a sculpted skull (brow, sockets, cheekbones, jaw, chin) instead of a
   sphere; noses and lips are modelled so they catch light at sprite size. */
// rings [y, rx, rz, oz, ox]: a closed tube whose cross-section is an ellipse offset at each height
G.limb=(rings,seg=12)=>{ const R=[...rings].sort((a,b)=>a[0]-b[0]), lo=R[0], hi=R[R.length-1];
  const all=[[lo[0]-1e-4,.08,.08,lo[3]||0,lo[4]||0],...R,[hi[0]+1e-4,.08,.08,hi[3]||0,hi[4]||0]], n=all.length;
  const g=new T.LatheGeometry(all.map(r=>new T.Vector2(1,r[0])),seg), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const r=all[i%n]; p.setXYZ(i,p.getX(i)*r[1]+(r[4]||0),r[0],p.getZ(i)*r[2]+(r[3]||0)); }
  g.computeVertexNormals(); return g; };
const ARM={
  delt:(r,m)=>[[.035,.75*r,.75*r,0,0],[.01,1.18*r*(1+.15*m),1.12*r*(1+.15*m),0,0],[-.05,1.22*r*(1+.2*m),1.16*r*(1+.15*m),.02*r,.05*r],[-.11,1.02*r,1.02*r,.12*r,.04*r],[-.15,.8*r,.85*r,.15*r,0]],
  upper:(r,m)=>[[-.02,.95*r,.98*r,0],[-.09,.98*r,(1.08+.18*m)*r,.1*r],[-.16,(.96+.06*m)*r,(1.12+.28*m)*r,.16*r*(1+m)],[-.23,.86*r,(.98+.12*m)*r,.08*r],[-.29,.74*r,.78*r,0],[-.31,.72*r,.74*r,0]],
  fore:(r,m)=>[[.01,.8*r,.8*r,0],[-.04,(.98+.1*m)*r,(.9+.08*m)*r,-.04*r],[-.1,(1+.14*m)*r,(.88+.06*m)*r,0],[-.18,.8*r,.7*r,0],[-.27,.62*r,.5*r,0],[-.3,.6*r,.48*r,0]],
  thigh:(r,m,L)=>[[.03,1.08*r,1.02*r,0],[-.12*L,(1.12+.06*m)*r,(1.12+.06*m)*r,.06*r],[-.38*L,(1.02+.06*m)*r,(1.06+.1*m)*r,.12*r],[-.7*L,.86*r,.9*r,.08*r],[-.92*L,.72*r,.76*r,.02*r],[-1.0*L,.7*r,.74*r,0]],
  shin:(r,m,L)=>[[.0,.72*r,.76*r,0],[-.1*L,.78*r,(.86+.06*m)*r,-.08*r],[-.28*L,(.8+.06*m)*r,(.96+.12*m)*r,-.17*r],[-.58*L,.6*r,.66*r,-.05*r],[-.9*L,.48*r,.5*r,0],[-1.0*L,.47*r,.5*r,0]]};
LAB.ARM=ARM;
// head sculpt: x,y,z relative to the head centre (sphere radius .16)
LAB.sculpt=(x,y,z,HP={})=>{ const r=.16, u=x/r, v=y/r, w=z/r, sm=(a,b,t)=>{ t=Math.min(1,Math.max(0,(t-a)/(b-a))); return t*t*(3-2*t); },
    bump=(cx,cy,cz,s)=>Math.exp(-((u-cx)**2+(v-cy)**2+(w-cz)**2)/(s*s));
  const jaw=HP.jaw==null?1:HP.jaw, chin=HP.chin==null?1:HP.chin, brow=HP.brow==null?1:HP.brow, cheek=HP.cheek==null?1:HP.cheek, sock=HP.sockets==null?1:HP.sockets;
  let X=x, Y=y*(HP.len||1.08), Z=z; const low=Math.max(0,-v);
  X*=1-(.3-.24*(jaw-1))*Math.pow(low,1.25)*(w>-.3?1:.55);
  if(w>0){ Z*=1-.1*low*low;
    Z+=r*.08*chin*sm(.55,.95,low)*sm(.25,.9,w); Y-=r*.06*chin*sm(.6,1,low)*sm(.3,.9,w);
    Z+=r*.06*brow*bump(0,.33,.92,.3)+r*.04*brow*(bump(.36,.31,.86,.2)+bump(-.36,.31,.86,.2));
    Z-=r*.06*sock*(bump(.36,.12,.9,.17)+bump(-.36,.12,.9,.17));
    X+=Math.sign(u)*r*.06*cheek*(bump(.6,-.06,.7,.24)+bump(-.6,-.06,.7,.24));
    Z*=1-.07*sm(.55,1,w); }
  else Z*=1+.12*sm(-.2,.6,v)*sm(.15,1,-w);
  if(Math.abs(u)>.75) X*=1-.06*sm(.75,1,Math.abs(u))*sm(-.2,.6,v);
  return [X,Y,Z]; };
const sculptGeo=(g,HP)=>{ const p=g.attributes.position; for(let i=0;i<p.count;i++){ const q=LAB.sculpt(p.getX(i),p.getY(i),p.getZ(i),HP); p.setXYZ(i,q[0],q[1],q[2]); } g.computeVertexNormals(); return g; };
// a nose: bridge root at the origin, running down to the tip and out along +z
G.nose=(len,w,dy,droop=0)=>{ const P=[[0,0,0],[0,-dy+droop,len],[-w,-dy*.86,len*.28],[w,-dy*.86,len*.28],[0,-dy*1.02,len*.62]];
  const idx=[0,2,1, 0,1,3, 2,4,1, 4,3,1], g=new T.BufferGeometry(), pos=[];
  for(const i of idx) pos.push(...P[i]); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.computeVertexNormals(); return g; };
const NOSE={small:[.034,.021,.05], button:[.028,.024,.04], long:[.05,.02,.066], hook:[.056,.022,.066,-.012], big:[.054,.032,.062], broad:[.038,.04,.05], pointed:[.06,.017,.07,.004]};
// attitude: contrapposto and character, added to every pose
const ATT={hero:{hipZ:.07,torsoZ:-.08,torsoX:-.05,headX:-.05,headZ:.04,kneeR:.2,legR:-.06,armLZ:.05},
  siren:{hipZ:.12,torsoZ:-.12,torsoX:-.04,headZ:.09,headY:.1,kneeR:.32,legR:-.13,armLZ:.08},
  brute:{torsoX:.14,headX:.08,armLZ:.16,armRZ:-.1,kneeL:.14,kneeR:.14,hipsY:-.025,hipZ:.04,torsoZ:-.05},
  stalk:{torsoX:.2,headX:.04,hipZ:.06,torsoZ:-.07,kneeL:.18,kneeR:.3,legR:-.16,hipsY:-.03},
  noble:{torsoX:-.07,headX:-.07,hipZ:.04,torsoZ:-.04,kneeR:.12,legR:-.04}, none:{}};
LAB.ATT=ATT;

/* ---------- the figure ---------- */
LAB.humanoid=function(o){
  seed=o.seed||7;
  { const at=ATT[o.attitude||(o.skel||o.float?'none':o.fem?'siren':'hero')]||{}, st={...at}; for(const k in o.stance||{}) st[k]=(st[k]||0)+o.stance[k]; o={...o,stance:st}; }
  const R={}, root=grp(null); R.root=root; R.flick=[];
  const fig=grp(root); fig.scale.setScalar(o.scale||1); R.fig=fig;
  const W=o.bodyW||1, kind=o.build||(o.skel?'skel':o.fem?(o.muscle?'femfit':'fem'):o.muscle?'muscle':o.slender?'slender':'normal');
  const b={...BUILDS[kind]}; b.sh*=W*(o.shK||1); b.ch*=W; b.wa*=(o.waistK||1)*W; b.hp*=W*(o.hipK||1); b.ar*=Math.sqrt(W)*(o.armK||1); b.lr*=Math.sqrt(W)*(o.legW||1);
  if(o.mus!=null) b.mus=o.mus;
  const legK=o.legK||1; R.hipsOff=(legK-1)*.88; R.b=b;
  const SK=o.skin||0xf3d0aa, skin=o.skinGlass?M(SK,{glass:o.skinGlass,facet:!!o.facet}):o.skinTex?MT(o.skinTex,{metal:o.skinMetal||0,facet:!!o.facet}):M(SK,{metal:o.skinMetal||0,facet:!!o.facet}), bone=M(o.bone||SK);
  const RC=colOf(o.robe)||0x3a62b8, robe=o.robeGlass?M(RC,{glass:o.robeGlass}):MT(o.robe||RC,{soft:true}), robe2=o.robeGlass?M(RC,{glass:o.robeGlass,side:DS}):MT(o.robe||RC,{soft:true,side:DS}), robeDk=o.robeGlass?M(shade(RC,.7),{glass:o.robeGlass}):MT(o.robeDk||shade(RC,.7),{soft:true}),
    trim=M(o.trim||0xe0bd62,{metal:o.trimMetal==null?.5:o.trimMetal}), belt=MT(o.belt||0x6b3f24), bootM=o.boot==='skin'?skin:MT(o.boot||0x4a2e1e),
    legsM=o.legs==='skin'?skin:o.legs==='bone'?bone:MT(o.legs||o.robeDk||shade(RC,.6),{soft:true}),
    cape=o.cape?MT(o.cape,{soft:true,side:DS}):null, hairM=o.hair?MT(o.hair.tex||o.hair.c,{soft:true,glow:!!o.hair.glow}):null;
  const AR=o.armor, A=AR?{c:MT(AR.c,{metal:AR.metal==null?.9:AR.metal}), c2:MT(AR.c2||shade(AR.c,.6),{metal:.8}), tr:MT(AR.trim||AR.c2||shade(AR.c,.6),{metal:.95})}:null;
  const skel=!!b.skel;
  const top=A&&AR.chest?(AR.chestTex?MT(AR.chestTex,{metal:AR.metal==null?.9:AR.metal}):A.c): o.top==='skin'?skin: o.top==='bone'?bone: o.top!=null?MT(o.top,{soft:true}): robe;
  const dz=b.dz;
  R.hips=grp(fig,0,.95,0);
  // ----- legs
  const thighL=.46*legK, shinL=.42*legK, aLeg=A&&AR.legs;
  if(o.digi&&!o.float) for(const s of [1,-1]){ const n=s>0?'L':'R', lm=o.digi.m?MT(o.digi.m):skin, tm=M(o.digi.talon||0x1a1410), fm=o.digi.fur?MT(o.digi.fur,{soft:true}):null;
    const leg=grp(R.hips,b.hp*.6*s,0,0), knee=grp(leg,0,-thighL*.78,.16); R['leg'+n]=leg; R['knee'+n]=knee;
    add(leg,G.sph(b.lr*1.2,10,8),lm,0,-.02,0); add(leg,G.tube([[0,0,0],[0,-thighL*.4,.1],[0,-thighL*.78,.16]],b.lr*1.15,b.lr*.8,8,8),lm,0,0,0);
    if(fm) add(leg,G.sph(b.lr*1.35,10,8),fm,0,-thighL*.3,.05).scale.set(1,1.3,1);
    add(knee,G.sph(b.lr*.8,8,6),lm,0,0,0); add(knee,G.tube([[0,0,0],[0,-shinL*.35,-.12],[0,-shinL*.6,-.2]],b.lr*.75,b.lr*.5,8,7),lm,0,0,0);
    const an=grp(knee,0,-shinL*.6,-.2); add(an,G.tube([[0,0,0],[0,-shinL*.32,.08],[0,-shinL*.55,.2]],b.lr*.5,b.lr*.42,8,6),lm,0,0,0);
    const ft=grp(an,0,-shinL*.55,.2); for(let i=-1;i<=1;i++){ add(ft,G.tube([[0,0,0],[i*.05,-.02,.1],[i*.07,-.04,.15]],.03,.02,6,5),lm,0,0,0); add(ft,G.cone(.022,.09,4),tm,i*.075,-.05,.2,PI/2+.5); }
    add(ft,G.cone(.022,.08,4),tm,0,-.03,-.08,-PI/2-.5); }
  if(!o.float&&!o.digi) for(const s of [1,-1]){ const n=s>0?'L':'R';
    const leg=grp(R.hips,b.hp*.55*s,0,0), knee=grp(leg,0,-thighL,0); R['leg'+n]=leg; R['knee'+n]=knee;
    const thM=aLeg?A.c:legsM, shM=aLeg?A.c:(o.bootTall?bootM:o.shins==='skin'?skin:legsM);
    if(skel){ add(leg,G.sph(.045,8,6),bone,0,0,0); add(leg,G.cyl(b.lr,b.lr*.9,thighL,6),bone,0,-thighL/2,0); add(knee,G.sph(.045,8,6),bone,0,0,.01);
      add(knee,G.cyl(b.lr*.9,b.lr*.8,shinL,6),bone,0,-shinL/2,0); add(knee,G.cyl(b.lr*.6,b.lr*.6,shinL*.9,5),bone,.03,-shinL/2,-.01); }
    else { const mu=b.mus||0; add(leg,G.sph(b.lr*1.08,10,8),thM,0,-.02,0);
      const th=add(leg,G.limb(ARM.thigh(b.lr,mu,thighL),12),thM,0,0,0); th.position.x=s*b.lr*.06;
      add(knee,G.sph(b.lr*.72,8,6),shM,0,0,.0); add(knee,G.sph(b.lr*.36,6,5),shM,0,-.01,b.lr*.62).scale.set(1,.85,.6);
      add(knee,G.limb(ARM.shin(b.lr,mu,shinL),12),shM,0,0,0); }
    if(o.barkLimbs){ const gm=M(o.grain); for(let i=0;i<6;i++){ const a=i*1.1; add(leg,G.box(.028,.14,.02),gm,Math.sin(a)*b.lr*.95,-.1-(i%3)*.1,Math.cos(a)*b.lr*.95); add(knee,G.box(.028,.12,.02),gm,Math.sin(a+.5)*b.lr*.7,-.08-(i%3)*.1,Math.cos(a+.5)*b.lr*.7); } }
    if(o.bootTall&&!aLeg&&!skel){ add(knee,G.cyl(b.lr*.82+.014,b.lr*.62+.014,shinL*.72,10),bootM,0,-shinL*.64,0); add(knee,G.tor(b.lr*.84+.014,.022,4,12),M(shade(o.boot||0x4a2e1e,.75)),0,-shinL*.28,0,PI/2); }
    if(aLeg){ add(leg,G.cyl(b.lr*1.12+.012,b.lr*.86+.012,thighL*.8,10),A.c,0,-thighL*.45,0); add(knee,G.sph(b.lr*.95,10,8),A.c2,0,.0,.03).scale.set(1,1,1.1);
      add(knee,G.cone(b.lr*.5,.09,5),A.tr,0,0,b.lr*.95+.02,PI/2); add(knee,G.cyl(b.lr*.9+.012,b.lr*.66+.012,shinL*.85,10),A.c,0,-shinL*.5,0); }
    const fm=aLeg?A.c2:skel?bone:bootM, fw=skel?.07:Math.max(.13,b.lr*1.45), SH=o.shoe||{}, st=SH.type||'boot', fy=-shinL-.03;
    if(st==='bare'||st==='claw'){ add(knee,G.box(fw*.85,.07,.22),skin,0,fy+.005,.05); for(let i=0;i<3;i++) add(knee,G.sph(.026,5,4),skin,(i-1)*.032,fy-.01,.165);
      if(st==='claw') for(let i=0;i<3;i++) add(knee,G.cone(.014,.06,4),M(SH.c2||0x1a1410),(i-1)*.032,fy-.01,.2,PI/2); }
    else { add(knee,G.box(fw,.09,st==='heavy'?.27:.25),fm,0,fy,.05);
      if(st==='curl'||st==='point'){ const toe=add(knee,G.cone(fw*.42,st==='curl'?.2:.17,7),fm,0,fy-.012,.25,PI/2-(st==='curl'?.35:.12)); toe.scale.set(1,1,.6);
        if(st==='curl') add(knee,G.sph(.022,5,4),SH.c2?M(SH.c2):fm,0,fy+.05,.34); }
      else add(knee,G.sph(fw*.52,8,6),st==='heavy'?M(SH.c2||0x8a929c,{metal:.8}):fm,0,fy-.015,.15).scale.set(st==='heavy'?1.12:1,st==='heavy'?.8:.65,1.1);
      if(st==='fur'){ add(knee,G.tor(b.lr*.9+.03,.045,5,12),MT(SH.c2||0xd8c8a8,{soft:true}),0,-shinL*.55,0,PI/2); }
      if(st==='heel') add(knee,G.box(.05,.07,.05),fm,0,fy-.06,-.04);
      if(st==='moccasin'){ for(let i=0;i<5;i++){ const a=-1.2+i*.6; add(knee,G.box(.018,.09,.012),fm,Math.sin(a)*(b.lr*.9+.02),-shinL*.62,Math.cos(a)*(b.lr*.9+.02)); } }
      if(SH.buckle) add(knee,G.box(.06,.05,.02),M(SH.buckle,{metal:.9}),0,fy+.04,.18); }
    if(aLeg) add(knee,G.cone(fw*.45,.12,4),A.c2,0,-shinL-.04,.24,PI/2).scale.set(1,1,.5);
    if(o.claws) for(const x of [-1,0,1]) add(knee,G.cone(.02,.08,4),M(o.claws),x*.04,-shinL-.05,.24,PI/2); }
  if(!o.float&&!skel&&!o.digi) add(R.hips,G.sph(b.hp*1.02,12,8),aLeg?A.c2:o.shorts?MT(o.shorts,{soft:true}):legsM,0,-.03,0).scale.set(1,.62,.74);
  if(o.shorts&&!o.float) for(const n of ['L','R']) add(R['leg'+n],G.cyl(b.lr*1.1+.012,b.lr*.98+.012,thighL*(o.shortsLen||.42),10),MT(o.shorts,{soft:true}),0,-thighL*(o.shortsLen||.42)/2+.01,0);
  if(skel&&!o.float){ add(R.hips,G.tor(b.hp*.75,.03,5,12,PI*1.3),bone,0,-.02,0,PI/2,0,PI*.85).scale.set(1,.75,1); add(R.hips,G.box(.08,.1,.05),bone,0,-.02,-.08); }
  // ----- skirt: long robe, tunic, mini or a ghost's trailing hem; may open at the front
  R.skirt=grp(R.hips);
  const SL={long:-.8*legK, knee:-.5*legK, short:-.36*legK, mini:-.22*legK}, len=o.float?-1:SL[o.skirt||'long']||0, wide=(o.skirtW||1)*Math.max(1,b.hp/.17);
  if(o.skirt!=='none'&&o.skirt!=='pants'){
    const top0=b.wa*1.1, pts=o.float?[[.04,-1.05],[.3*wide,-.72],[.27*wide,-.36],[b.hp*1.08,-.05],[top0,.12]]
      :[[(o.skirt==='long'||!o.skirt?.36:o.skirt==='knee'?.32:.27)*wide,len],[Math.max(b.hp*1.18,.26*wide),len*.55],[b.hp*1.12,len*.15],[b.hp*1.06,0],[top0,.12]];
    const sm=o.skirtC?MT(o.skirtC,{soft:true,side:DS}):robe2;
    add(R.skirt,G.robe(pts,o.folds||7,o.float?.025:.032,42,o.skirtGap||0),sm,0,0,0).scale.z=.92;
    if(!o.float&&o.hem!==false){ const hr=pts[0][0]*1.04; add(R.skirt,G.robe([[hr,len-.005],[hr*.985,len+.06]],o.folds||7,.032,42,o.skirtGap||0),M(o.hem||o.trim||0xc8a26a,{side:DS}),0,0,0).scale.z=.92; }
    if(o.stripe&&!o.float) add(R.skirt,G.box(.05,Math.abs(len)*1.02,.03),trim,0,len*.46,pts[1][0]*.9+.02,-.25);
    if(o.tabard) add(R.skirt,G.trap(.24*W,Math.abs(len)*.96,.03,1.15),MT(o.tabard,{soft:true}),0,len*.46,(b.hp*1.06+.025)*.92,-.12);
    if(o.rags){ for(let i=0;i<9;i++){ const a=i/9*PI*2; add(R.skirt,G.cone(.06,.2,4),o.skirtC?sm:robeDk,Math.sin(a)*pts[0][0]*.95,len-.06,Math.cos(a)*pts[0][0]*.9,PI,0,0); } } }
  if(o.faulds&&A){ for(const s of [1,-1]) for(let i=0;i<3;i++) add(R.hips,G.trap(.17,.09,.025,1.15),i%2?A.c2:A.c,s*b.hp*.62,-.04-i*.075,b.hp*.62,-.25,0,s*.15);
    add(R.hips,G.trap(.16,.2,.025,1.1),A.c2,0,-.1,b.hp*.78,-.2); }
  if(o.loin) add(R.hips,G.cloth(.2,.42*legK,1.15,1,.02,.025),MT(o.loin,{soft:true,side:DS}),0,.0,b.hp*.78,-.12);
  if(o.leaves&&o.leaves.skirt){ const L=o.leaves, mats=L.c.map(c=>M(c,{soft:true})); const n=L.skirt;
    for(let k=0;k<n;k++){ const y=-.02-k*(L.step||.13), r=b.hp*1.12+k*.025; ring(R.hips,L.per||12,y,r,.9,mats,L.w||.07,L.h||.2,L.tilt||.25,.4,k*.4); } }
  // ----- torso
  R.torso=grp(R.hips,0,.05,0);
  const prof=[[b.hp*.95,-.1],[b.hp,-.03],[b.wa*1.05,.09],[b.wa,.16],[b.ch*.93,.28],[b.ch,.37],[b.sh*.8,.46],[b.sh*.56,.52],[b.neck*1.5,.56],[b.neck,.58]];
  R.prof=prof;
  if(skel){ add(R.torso,G.cyl(.028,.028,.6,6),bone,0,.27,-.06); for(let i=0;i<5;i++) add(R.torso,G.tor(b.ch*(.86-i*.06),.02,4,14,PI*1.5),bone,0,.44-i*.07,-.01,PI/2,0,-PI/4).scale.set(1,dz*1.05,1);
    add(R.torso,G.box(.035,.24,.03),bone,0,.34,b.ch*.66); add(R.torso,G.tor(b.sh*.55,.025,4,12,PI),bone,0,.5,0,PI/2,0,0).scale.set(1,.5,1);
    for(const s of [1,-1]) add(R.torso,G.sph(.04,6,5),bone,b.sh*.85*s,.46,0); }
  else { const t=add(R.torso,G.lathe(prof,22),top); t.scale.z=dz;
    const showMus=b.mus&&(top===skin||(A&&AR.chest)||o.showMus);
    const musM=o.musM?MT(o.musM):(top&&top.tex?M(top.c.getHex(),{soft:top.soft,metal:top.metal}):top), bustM=o.bustM?MT(o.bustM,{soft:true}):musM;
    if(showMus){ const k=b.mus; for(const s of [1,-1]) add(R.torso,G.sph(b.ch*.52,12,8),musM,s*b.ch*.4,.38,b.ch*dz*.58).scale.set(1.12,.62,.5);
      if(k>.7&&!o.noAbs) for(let i=0;i<3;i++) for(const s of [1,-1]) add(R.torso,G.sph(b.wa*.27,6,5),musM,s*b.wa*.3,.06+i*.075,b.wa*dz*.86).scale.set(1,.85,.5);
      add(R.torso,G.cone(b.sh*.62,.13,12),musM,0,.53,-.015).scale.z=.7; }
    if(b.fem&&!(A&&AR.chest&&!AR.bust)){ const r=b.ch*.46*(o.bust||1); for(const s of [1,-1]) add(R.torso,G.sph(r,12,8),bustM,s*b.ch*.42,.345,b.ch*.6).scale.set(1,.92,.85); } }
  if(o.ribs){ const rm=M(o.ribs===true?0xe8e0c8:o.ribs), dk=M(0x1a1420); add(R.torso,G.lathe(prof.slice(2,5).map(([r,y])=>[r*.985,y]),18),dk).scale.z=dz;
    for(let i=0;i<4;i++){ const y=.12+i*.06, r=b.wa*(1+i*.12)+.004; add(R.torso,G.tor(r,.014,4,16,PI*.8),rm,0,y,0,PI/2,0,PI*.1).scale.set(1,dz,1); } add(R.torso,G.box(.03,.22,.02),rm,0,.2,b.wa*dz+.01); }
  if(!o.noNeck) add(R.torso,G.limb([[.66,b.neck*.95,b.neck*.92,.005],[.6,b.neck,b.neck*.98,0],[.52,b.neck*1.35,b.neck*1.1,-.01]],10),skel?bone:o.neckM?M(o.neckM):skin,0,0,0);
  // trapezius: the slope from neck to shoulder, so shoulders read as a yoke, not two balls
  if(!skel&&!o.noTrap) for(const s of [1,-1]) add(R.torso,G.tube([[0,.59,-.02],[b.sh*.45*s,.535,-.015],[b.sh*.85*s,.475,0]],b.neck*(b.mus?1.05:.8),b.ar*1.05,8,7),top===robe&&o.trapM?MT(o.trapM):top,0,0,0).scale.z=.8;
  if(o.bra){ const bp=prof.slice(3,7).map(([r,y])=>[r*1.04+.006,y]); bp[0][1]=.26; add(R.torso,G.lathe(bp,22),MT(o.bra,{soft:true})).scale.z=dz*1.02;
    if(b.fem){ const r=b.ch*.46*(o.bust||1)*1.07, bm=MT(o.braCup||colOf(o.bra),{soft:true}); for(const s of [1,-1]) add(R.torso,G.sph(r,12,8),bm,s*b.ch*.42,.345,b.ch*.6).scale.set(1,.92,.85); } }
  if(o.vest){ const vp=prof.slice(0,8).map(([r,y])=>[r*1.07+.008,y]); add(R.torso,G.lathe(vp,22,o.vestGap==null?.9:o.vestGap),MT(o.vest,{soft:true,side:DS})).scale.z=dz*1.02; }
  if(o.belt!==false&&!skel){ add(R.torso,G.tor(b.wa*1.12,.034,5,20),belt,0,.08,0,PI/2).scale.set(1,dz*1.04,1); add(R.torso,G.box(.08,.07,.03),M(o.buckle||0xc8a26a,{metal:.7}),0,.08,b.wa*1.12*dz+.025); }
  if(o.belt2) add(R.torso,G.box(.1,.12,.07),M(o.belt2),b.wa*.9,.0,b.wa*.6,0,-.7,0);
  if(A&&AR.chest){ if(AR.ridge!==false) add(R.torso,G.box(.03,.36,.03),A.tr,0,.28,b.ch*dz*1.02);
    add(R.torso,G.tor(b.wa*1.13,.03,4,20),A.c2,0,.11,0,PI/2).scale.set(1,dz*1.04,1); if(AR.gorget!==false) add(R.torso,G.cyl(b.neck*1.6,b.sh*.7,.1,12),A.c2,0,.55,0).scale.z=.85; }
  if(o.straps){ const sm=M(o.straps), zf=b.ch*dz+.02; for(const s of o.strap1?[1]:[1,-1]){ add(R.torso,G.box(.05,.66,.03),sm,0,.27,zf,0,0,.62*s); add(R.torso,G.box(.05,.66,.03),sm,0,.27,-zf,0,0,.62*s); } }
  if(o.quiver){ const q=grp(R.torso,.06,.32,-b.ch*dz-.07); q.rotation.z=-.5; add(q,G.cyl(.065,.055,.5,8),M(o.quiver),0,0,0); add(q,G.tor(.066,.012,4,10),M(0xc8a26a),0,.2,0,PI/2);
    for(let i=0;i<4;i++){ add(q,G.cyl(.008,.008,.2,3),M(0xd8c8a0),(i-1.5)*.025,.32,(i%2)*.02); add(q,G.leaf(.03,.09),M(i%2?0xe8e0d0:0xb5452e),(i-1.5)*.025,.38,(i%2)*.02); } }
  if(o.mantle) add(R.torso,G.robe([[b.sh*1.3,.32],[b.sh*1.05,.44],[b.neck*1.6,.57]],8,.025,26),MT(o.mantle,{soft:true}),0,0,0).scale.z=.85;
  if(o.fur) add(R.torso,G.tor(b.sh*.72,.075,6,14),M(o.fur,{soft:true}),0,.52,0,PI/2).scale.set(1,.85,1);
  if(o.hoodDown) add(R.torso,G.tor(.13,.065,6,12,PI*1.4),M(o.hoodDown,{soft:true}),0,.55,-.1,PI/2-.3,0,-PI*.2);
  if(o.pads){ const pm=M(o.pads.c,{metal:o.pads.metal||0}), pm2=M(shade(o.pads.c,.7),{metal:o.pads.metal||0});
    for(const s of [1,-1]){ const p=grp(R.torso,b.sh*.98*s,.47,0); p.rotation.z=-.42*s; const L=o.pads.layers||1, r=o.pads.r||b.ar*2.1;
      // plate pauldron: a faceted crown plate over stepped lames that wrap the arm (no domes)
      const pf=M(o.pads.c,{metal:o.pads.metal||0,facet:true}), pf2=M(shade(o.pads.c,.72),{metal:o.pads.metal||0,facet:true,side:DS});
      add(p,G.cone(r*1.08,r*.5,8),pf,0,r*.08,0).scale.set(1,1,.92);
      add(p,G.tor(r*1.06,r*.07,4,16,PI*1.3),pf2,0,-r*.12,0,PI/2,0,-PI*.15).scale.set(1,.92,1);
      for(let i=0;i<Math.max(2,L);i++) add(p,new T.CylinderGeometry(r*(1.02-.07*i),r*(1.1-.07*i),r*.34,10,1,true,-PI*.8,PI*1.6),i%2?pf2:M(shade(o.pads.c,.9),{metal:o.pads.metal||0,facet:true,side:DS}),0,-r*(.3+.27*i),0).scale.z=.9;
      if(o.pads.spike) for(let i=0;i<(o.pads.spike===true?1:o.pads.spike);i++) add(p,G.cone(.04,.2,5),M(o.pads.spikeC||0xd8d0c0,{metal:.5}),(i-(o.pads.spike===true?0:1))*.07*s,r*.75,0); } }
  if(o.grain&&!skel){ const gm=M(o.grain); for(let i=0;i<30;i++){ const a=(i/14)*PI*2+.2, y=.05+((i*7)%5)*.07, r=b.ch*(y>.3?1:.85)+.004; const g=add(R.torso,G.box(.026,.12+((i*3)%4)*.03,.02),gm,Math.sin(a)*r,y+.06,Math.cos(a)*r*dz); g.rotation.z=.15*Math.sin(i); } }
  if(o.cracks){ const cm=M(o.cracks,{glow:true}); for(let i=0;i<6;i++){ const a=-.9+i*.36, y=.12+(i%3)*.12, r=b.ch*(y>.3?1:.85)*dz+.01; const c=add(R.torso,G.box(.016,.12,.012),cm,Math.sin(a)*b.ch*.9,y,Math.cos(a)*r); c.rotation.z=(i%2?.6:-.5); } }
  if(o.apron){ const am=MT(o.apron,{soft:true,side:DS}); const ap=add(R.torso,G.cloth(.34*W,.95,1.15,1.2,.02,.02),am,0,.42,b.ch*dz+.03,-.08);
    if(o.blood) for(const [x,y,s] of [[.06,.1,.06],[-.08,-.12,.05],[.02,-.32,.08],[-.04,.22,.04],[.1,-.45,.05]]) add(R.torso,G.box(s,s*1.4,.01),M(o.blood),x,.42-.48+y,b.ch*dz+.05+(.48-y)*.03); }
  if(o.bones){ const bm=M(o.bones); for(const s of [1,-1]){ const g=grp(R.torso,b.wa*1.15*s,.06,.03); add(g,G.cyl(.02,.02,.24,5),bm,0,-.12,0,0,0,.3*s); add(g,G.sph(.03,5,4),bm,.035*s,-.24,0); add(g,G.sph(.07,8,6),bm,-.02*s,-.1,.08).scale.set(1,1.1,1); } }
  if(o.stitches){ const sm=M(o.stitches); for(let i=0;i<6;i++){ add(R.torso,G.box(.012,.05,.01),sm,-.1+i*.04,.56,.06*dz+.0); } }
  if(o.thorns){ const tm=M(o.thorns.c||0x3a2a18); for(let i=0;i<(o.thorns.n||14);i++){ const a=rnd()*PI*2, y=.1+rnd()*.42, r=b.ch*.95;
      const th=add(R.torso,G.cone(.025,.12,4),tm,Math.sin(a)*r,y,Math.cos(a)*r*dz); LAB.aim(th,Math.sin(a),.5,Math.cos(a)); } }
  if(o.leaves&&o.leaves.chest){ const L=o.leaves, mats=L.c.map(c=>M(c,{soft:true})); for(let k=0;k<L.chest;k++){ const y=.48-k*.12, r=(k===0?b.sh*.95:b.ch*1.02); ring(R.torso,L.per||12,y,r,dz,mats,L.w||.07,L.h||.18,.35,.4,k*.5); } }
  if(o.vines){ const vm=M(o.vines.c||0x3a6a2a), lm=o.vines.leaf?M(o.vines.leaf,{soft:true}):null; for(let i=0;i<(o.vines.n||2);i++) vine(R.torso,prof.slice(1,7),dz,1.1,vm,lm,.016,i*PI); }
  if(o.webs){ const wm=M(o.webs,{soft:true}); for(let i=0;i<7;i++){ const a=i/7*PI*2; add(R.torso,G.tube([[0,.6,0],[Math.sin(a)*b.ch*.8,.42,Math.cos(a)*b.ch*dz*.9],[Math.sin(a)*b.wa*1.1,.1,Math.cos(a)*b.wa*dz*1.1]],.009,.009,8,3),wm,0,0,0); }
    for(const y of [.18,.3,.42]){ const r=(y>.35?b.ch:b.wa*1.1+(y-.1)*.3)*1.02; add(R.torso,G.tor(r,.008,3,24),wm,0,y,0,PI/2).scale.set(1,dz,1); } }
  if(cape){ const cw=b.sh*1.75, cl=o.capeLen||1.08; R.cape=grp(R.torso,0,.52,-b.ch*dz-.025); add(R.cape,G.cloth(cw,cl,1.5,2.5,.05),cape,0,-cl/2,0);
    if(o.capeHem!==false) add(R.cape,G.box(cw*1.5,.05,.035),M(o.capeHem||o.hem||0xc8a26a),0,-cl+.02,-.005);
    if(o.rags) for(let i=0;i<6;i++) add(R.cape,G.cone(.06,.18,4),cape,(-.5+i*.2)*cw*1.4,-cl-.05,0,PI,0,0); }
  if(o.wings){ R.wings=[]; const bat=o.wingType==='bat';
    for(const s of [1,-1]){ const w=grp(R.torso,.1*s,.42,-b.ch*dz); R.wings.push(w);
      const wm=M(o.wings,{soft:!bat,side:DS}), wm2=M(shade(o.wings,.82),{soft:!bat,side:DS});
      if(bat){ const fing=[[.55,.45],[.75,.05],[.62,-.35]]; add(w,G.tube([[0,0,0],[.25*s,.22,-.06],[.5*s,.5,-.1]],.035,.02,8,5),wm2,0,0,0);
        fing.forEach(([x,y],i)=>{ add(w,G.tube([[.5*s,.5,-.1],[(x*.8)*s,(.5+y)/2+.1,-.12],[x*s,y,-.12]],.016,.006,8,4),wm2,0,0,0);
          const prev=i?fing[i-1]:[.5,.5]; const g=new T.BufferGeometry();
          g.setAttribute('position',new T.Float32BufferAttribute([0,0,-.08, prev[0]*s,prev[1],-.11, x*s,y,-.12],3)); g.computeVertexNormals(); add(w,g,wm,0,0,0); }); }
      else { const WS=o.wingK||1; add(w,G.tube([[0,0,0],[.25*s*WS,.25*WS,-.05],[.6*s*WS,.55*WS,-.1],[.75*s*WS,.75*WS,-.12]],.07,.03,10,6),wm,0,0,0);
        for(let i=0;i<9;i++){ const u=i/8, x=s*(.06+u*.66)*WS, y=(.04+u*.68)*WS, L=(.45+u*.55)*WS; const f=add(w,G.leaf(.08+u*.03,L),i%2?wm2:wm,x,y,-.06-u*.06,0,0,PI+s*(.08+u*.32)); f.scale.set(1,1,1.6); }
        for(let i=0;i<6;i++){ const u=i/5; add(w,G.leaf(.07,.3+u*.2),wm,s*(.1+u*.55)*WS,(.12+u*.6)*WS,-.03,0,0,PI+s*(.2+u*.3)).scale.set(1,1,1.6); } } } }
  if(o.tail){ R.tail=grp(R.hips,0,.0,-b.hp*.7); const tm=M(o.tail.c); add(R.tail,G.tube([[0,0,0],[0,-.2,-.25],[.1,-.55,-.35],[.25,-.75,-.2],[.3,-.8,.0]],.05,.018,16,6),tm,0,0,0);
    if(o.tail.tip) add(R.tail,G.oct(.08),M(o.tail.tip),.32,-.8,.05).scale.set(1,1.4,.3); }
  // ----- head: the back half is plain; the front half carries the painted face (see faceProject)
  R.head=grp(R.torso,0,.52+(o.neckLen||0),0); R.head.scale.setScalar((o.headK||(b.fem?1.26:1.3))*(LAB.HEADX||1.18));
  const face=o.face||'normal';
  const headC=face==='void'?0x07050c:face==='skull'?(o.bone||SK):SK;
  const headM=face==='void'?M(0x07050c):face==='skull'?bone:skin, HS=o.headS||[1,1,1];
  const HP={...(face==='skull'?{cheek:1.6,sockets:2.2,jaw:.85,chin:.6,brow:1.4}:{}),...(o.headP||{})}; R.HP=HP;
  const hb=add(R.head,sculptGeo(new T.SphereGeometry(.16,28,20,PI,PI),HP),headM,0,.16,0); hb.scale.set(...HS);
  R.faceMesh=add(R.head,sculptGeo(new T.SphereGeometry(.16,28,20,0,PI),HP),headM,0,.16,0); R.faceMesh.scale.set(...HS); R.faceSkin=headC;
  // where a point on the unsculpted sphere ends up, in head space
  R.headPt=(x,y,z)=>{ const q=LAB.sculpt(x,y-.16,z,HP); return [q[0]*HS[0],.16+q[1]*HS[1],q[2]*HS[2]]; };
  const deep=(a,b)=>{ const r={...a}; for(const k in b) r[k]=(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&a[k]&&typeof a[k]==='object')?{...a[k],...b[k]}:b[k]; return r; };
  let FS={eyes:{c:o.eyes||0x2a4a6a, glow:!!o.eyeGlow, style:o.eyeGlow?'glow':'round', lash:!!o.lashes},
    brows:{style:o.angry?'angry':'thin', c:o.browC||(o.hair?shade(o.hair.c,.62):0x3a2a22)}, nose:o.nose?'big':'small', mouth:o.lips?'lips':'line', lips:o.lips};
  if(face==='skull') FS=deep(FS,{eyes:{style:'socket',c:o.eyes||0x8affff}, brows:{style:'none'}, nose:'skull', mouth:'skull'});
  if(face==='void') FS=deep(FS,{eyes:{style:'glow',c:o.eyes||0xff4a2a}, brows:{style:'none'}, nose:'none', mouth:'none'});
  R.faceSpec=deep(FS,o.fp||{});
  // modelled nose (and lips) on top of the painted face
  { const ns=R.faceSpec.nose, N=NOSE[ns===true?'big':ns]; if(face==='normal'&&N&&o.noNose!==true){ const k=o.noseK||1, sk=M(shade(SK,.98),{facet:true});
      const rt=R.headPt(0,.142,Math.sqrt(.16*.16-.018*.018)); const n=add(R.head,G.nose(N[0]*k,N[1]*k,N[2]*k,(N[3]||0)*k),sk,rt[0],rt[1],rt[2]-.006);
      if(ns==='big'||ns===true) add(R.head,G.sph(N[1]*.75*k,7,5),sk,0,rt[1]-N[2]*k*.9,rt[2]+N[0]*k*.72);
      if(ns==='broad') for(const s of [1,-1]) add(R.head,G.sph(N[1]*.42*k,6,5),sk,s*N[1]*.75*k,rt[1]-N[2]*k*.86,rt[2]+N[0]*k*.25); }
    if(face==='normal'&&o.lips){ const mp=R.headPt(0,.054,Math.sqrt(.16*.16-.106*.106)); add(R.head,G.sph(.03,10,6),M(o.lips),mp[0],mp[1],mp[2]-.006).scale.set(1,.32,.35); } }
  if(face==='skull'){ add(R.head,G.box(.15,.07,.11),bone,0,.045,.055); for(const s of [1,-1]) add(R.head,G.sph(.04,6,5),bone,.085*s,.1,.1).scale.set(1,.7,.8); }
  if(o.jaw) add(R.head,G.box(.2*(o.jaw.w||1),.1,.14),headM,0,.06,.05);
  if(o.brow) add(R.head,G.box(.2,.035,.05),headM,0,.19,.12,-.3);
  for(const s of [1,-1]){
    if(o.ears==='elf'){ const L=o.earL||.26, e=grp(R.head,.15*s*HS[0],.16,-.01); e.rotation.set(0,-.55*s,-s*(PI/2-.55)); add(e,G.cone(.045,L,6),skin,0,L/2,0).scale.set(1,1,.45); }
    else if(o.ears==='orc') add(R.head,G.cone(.05,.2,5),skin,.21*s*(HS[0]),.17,-.02,0,-.3*s,-s*(PI/2-.6));
    else if(o.ears!=='none'&&face==='normal') add(R.head,G.sph(.038,6,5),skin,.155*s*(HS[0]),.15,0); }
  if(face==='normal'){
    if(o.stitches){ const sm=M(o.stitches); add(R.head,G.box(.02,.2,.012),sm,.03,.24,.12,-.6,0,.3); for(let i=0;i<5;i++) add(R.head,G.box(.05,.012,.012),sm,.03+(i-2)*.012,.18+i*.03,.145-i*.012,-.6,0,.3); }

    if(o.tusks) for(const s of [1,-1]) add(R.head,G.cone(.028,o.tusks,5),M(0xf0ead8),.07*s,.06+o.tusks*.35,.13,-.25,0,-.15*s);
    if(o.fangs) for(const s of [1,-1]) add(R.head,G.cone(.014,.05,4),M(0xf8f4ec),.025*s,.06,.15,PI); }
  if(o.horns){ const H=o.horns, hm=M(H.c||0x2a1a14,{metal:H.metal||.2}), big=H.size||1;
    for(const s of [1,-1]){
      if(H.type==='ram') add(R.head,G.tube([[.12*s,.27,-.02],[.27*s,.33,-.1],[.33*s,.2,-.2],[.27*s,.06,-.12],[.22*s,.1,.02]],.06*big,.025,16,6),hm,0,0,0);
      else if(H.type==='back') add(R.head,G.tube([[.09*s,.3,.02],[.14*s,.42,-.1],[.17*s,.5,-.3],[.2*s,.52,-.5]].map(p=>[p[0]*big,p[1],p[2]*big]),.05*big,.008,14,6),hm,0,0,0);
      else add(R.head,G.tube([[.12*s,.26,0],[.28*s,.32,-.02],[.38*s,.5,-.06],[.36*s,.72,-.04]].map(p=>[p[0]*big,.26+(p[1]-.26)*big,p[2]]),.06*big,.01,14,6),hm,0,0,0); } }
  // ----- hair
  if(hairM){ const st=o.hair.style||'long', hc=o.hair.c, hairDk=M(shade(hc,.78),{soft:true,glow:!!o.hair.glow}), hl=o.hair.len||.44;
    // under a hat the hair cap shrinks inside the crown so it never pokes through
    const hatted=o.hat&&['wizard','witch','wide','crooked','robin','helm','hood','sack','beak','crown','floppy'].includes(o.hat.type);
    const cap=()=>add(R.head,G.cap(hatted?.164:.172,hatted?Math.min(.5,o.hair.cover||.58):(o.hair.cover||.58),14,8),hairM,0,.17,-.012,o.hair.tilt==null?-.42:o.hair.tilt);
    const strands=(n,len,spread,wild,mats,r0=.06)=>{ for(let i=0;i<n;i++){ const u=i/(n-1)-.5, x=u*.3*spread, c=(i%2?.03:-.025)*(wild?2:1), a=u*1.9;
        const sx=Math.sin(a)*.16, sz=Math.cos(a)*.16;
        add(R.head,G.tube([[sx*.9,.22,sz*.6-.1],[x*1.25+sx*.3,.1,-.19-.02*Math.abs(u)],[x*1.35*spread+c,-len*.45+.08,-.22],[x*1.2*spread-c,-len+.12,-.18-(wild?.06:0)]],r0,.022,12,6),mats[i%mats.length],0,0,0); } };
    if(st==='long'||st==='wild'||st==='savage'){ cap(); if(st!=='long') add(R.head,G.rock(.2,7,.22,1),hairM,0,.2,-.04);
      add(R.head,G.robe([[.15+(st==='long'?0:.05),-hl+.1],[.19,-hl*.45],[.2,.05],[.19,.18],[.17,.27]],st==='long'?6:9,st==='long'?.03:.06,26,o.hair.gap||2.7),M(hc,{soft:true,side:DS,glow:!!o.hair.glow}),0,0,-.03).scale.set(1,1,.9);
      strands(st==='long'?5:7,hl*.95,st==='long'?.9:1.05,st!=='long',[hairDk,hairM],.04);
      if(st==='savage') for(let i=0;i<7;i++){ const a=-1.4+i*.47; add(R.head,G.cone(.05,.2,5),i%2?hairDk:hairM,Math.sin(a)*.17,.3,Math.cos(a)*.1-.06,-.5,0,-a*.7); }
      if(st==='long'&&o.hair.locks!==false) for(const s of [1,-1]) add(R.head,G.tube([[.14*s,.22,-.02],[.18*s,.1,-.05],[.18*s,-.06,-.07],[.16*s,-hl*.55,-.08]],.04,.018,8,5),hairM,0,0,0); }
    if(st==='braids'){ cap(); for(const s of [1,-1]) for(let i=0;i<6;i++) add(R.head,G.sph(.05-i*.003,7,5),i%2?hairDk:hairM,.14*s,.06-i*.07,-.06-.015*i); }
    if(st==='braid1'){ cap(); for(let i=0;i<7;i++) add(R.head,G.sph(.055-i*.004,7,5),i%2?hairDk:hairM,0,.12-i*.075,-.2-.02*i); }
    if(st==='pony'){ cap(); const tl=grp(R.head,0,.3,-.12); R.flick.push({o:tl,ax:'z',a:.1,k:1,p:.3,z0:0}); add(tl,G.tor(.04,.016,4,10),M(o.hair.tie||0xe8c860,{metal:.8}),0,0,0,PI/2-.6);
      add(tl,G.tube([[0,0,0],[0,.06,-.1],[0,-.08,-.2],[0,-.35,-.22],[0,-.6,-.16]],.06,.02,14,6),hairM,0,0,0); }
    if(st==='short'){ cap(); add(R.head,G.box(.27,.14,.08),hairM,0,.09,-.13); }
    if(st==='mohawk'){ for(let i=0;i<6;i++) add(R.head,G.cone(.045,.16-Math.abs(i-2.5)*.02,5),i%2?hairDk:hairM,0,.3-Math.abs(i-1.5)*.02,.12-i*.07,-.4-i*.15); }
    if(st==='vines'){ cap(); const lm=M(o.hair.leaf||0x6ab04a,{soft:true});
      for(let i=0;i<8;i++){ const u=i/7-.5, a=u*2.2, sx=Math.sin(a)*.17, sz=Math.cos(a)*.15, L=hl*(.8+rnd()*.4), w=(i%2?.05:-.05);
        const pts=[[sx*.9,.24,sz*.5-.08],[sx*1.4+w,.08,-.18],[sx*1.6-w,-L*.4,-.22],[sx*1.4+w*1.5,-L,-.16]];
        add(R.head,G.tube(pts,.035,.014,12,5),i%2?hairDk:hairM,0,0,0);
        for(let k=1;k<4;k++){ const p=pts[k]; const l=add(R.head,G.leaf(.04,.1),lm,p[0]+.03*(k%2?1:-1),p[1],p[2]); l.rotation.set(PI+.4,rnd()*PI,(rnd()-.5)*1.5); } }
      for(const s of [1,-1]) add(R.head,G.leaf(.06,.16),lm,.12*s,.3,.05,-.3,0,-.6*s); }
    if(st==='flame'){ cap(); const f1=M(0xff5a1a,{glow:true}), f2=M(0xffa040,{glow:true}), f3=M(0xffe08a,{glow:true}); const hg=grp(R.head,0,.2,-.05); R.flick.push({o:hg,ax:'x',a:.12,k:2,p:0,z0:0});
      for(let i=0;i<9;i++){ const u=i/8-.5, a=u*2.4; const fl=grp(hg,Math.sin(a)*.15,.02,Math.cos(a)*.12-.05); fl.rotation.set(-1.2-.3*Math.abs(u),0,-a*.6);
        add(fl,G.cone(.07,.34+rnd()*.16,6),i%3===0?f3:i%2?f2:f1,0,.17,0); add(fl,G.cone(.035,.2,5),f3,0,.12,.02); R.flick.push({o:fl,ax:'z',a:.15,k:1+(i%3),p:i*1.3,z0:fl.rotation.z}); }
      for(const s of [1,-1]){ const fl=grp(R.head,.15*s,.15,-.02); fl.rotation.set(-.3,0,-.4*s); add(fl,G.cone(.05,.32,6),f2,0,-.08,0,PI); R.flick.push({o:fl,ax:'z',a:.12,k:2,p:s,z0:fl.rotation.z}); } } }
  if(o.beard){ const bm=M(o.beard.c,{soft:true}), L=o.beard.len||.3; const bd=add(R.head,G.cone(.12,L,8),bm,0,.06-L/2,.1,PI); bd.scale.set(1,1,.62); add(R.head,G.box(.21,.05,.07),bm,0,.1,.145); add(R.head,G.box(.12,.03,.03),M(shade(o.beard.c,.8),{soft:true}),0,.085,.17); }
  // ----- headwear
  const H=o.hat||{type:'none'};
  R.hat=grp(R.head,0,H.y==null?.3:H.y,0);
  if(H.type==='wizard') floppy(R.hat,R,H,false);
  else if(H.type==='witch') floppy(R.hat,R,H,true);
  else if(H.type==='robin') robin(R.hat,R,H);
  else if(H.type==='hood') hood(R,H,b.sh);
  else if(H.type==='sack') sack(R,H);
  else if(H.type==='helm') helm(R,H);
  else if(H.type==='antlers'){ for(const s of [1,-1]) add(R.hat,G.tube([[.08*s,-.05,0],[.2*s,.1,-.02],[.24*s,.32,-.04],[.34*s,.46,-.04]],.04,.012,10,5),M(H.c||0xd8c8a0),0,0,0);
    for(const s of [1,-1]) add(R.hat,G.tube([[.2*s,.12,-.02],[.34*s,.2,-.02]],.025,.01,4,4),M(H.c||0xd8c8a0),0,0,0); R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='crown'){ const cm=M(H.c||0xe2b850,{metal:.9}); add(R.hat,G.cyl(.17,.17,.08,10),cm,0,-.04,0); for(let i=0;i<6;i++){ const a=i/6*PI*2; add(R.hat,G.cone(.03,.12,4),cm,Math.sin(a)*.16,.05,Math.cos(a)*.16); } if(H.gem) add(R.hat,G.oct(.035),M(H.gem,{glow:true}),0,-.03,.18); R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='tiara'){ const cm=M(H.c||0xe2b850,{metal:.95}); add(R.hat,G.tor(.17,.016,4,18,PI),cm,0,-.07,0,PI/2-.2,0,0);
    add(R.hat,G.oct(.05),cm,0,0,.16).scale.set(1,1.6,.5); if(H.gem) add(R.hat,G.oct(.03),M(H.gem,{glow:true}),0,.0,.18).scale.set(1,1.4,.5);
    for(const s of [1,-1]) add(R.hat,G.leaf(.04,.16),cm,.12*s,-.02,.11,-.2,0,-s*.7); R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='laurel'){ const lm=M(H.c||0xe2b850,{metal:.9}); for(const s of [1,-1]) for(let i=0;i<6;i++){ const a=s*(.3+i*.38); add(R.hat,G.leaf(.035,.1),lm,Math.sin(a)*.175,-.08+i*.008,Math.cos(a)*.17,-.4,a,s*1.2); } R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='thorns'){ const tm=M(H.c||0x4a3220); add(R.hat,G.tor(.17,.03,5,16),tm,0,-.05,0,PI/2); for(let i=0;i<9;i++){ const a=i/9*PI*2; const c=add(R.hat,G.cone(.025,.12+(i%3===0?.12:0),4),tm,Math.sin(a)*.17,.02,Math.cos(a)*.17); LAB.aim(c,Math.sin(a)*.6,1,Math.cos(a)*.6); } R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='band'){ add(R.hat,G.tor(.168,.024,4,18),M(H.c||0x8a2a1a),0,-.1,0,PI/2-.08); for(let i=0;i<5;i++) add(R.hat,G.box(.03,.03,.02),M(i%2?0xe8d8b0:0x2a8a8a),Math.sin(-.6+i*.3)*.17,-.1,Math.cos(-.6+i*.3)*.17);
    if(H.feather) add(R.hat,G.leaf(.05,.3),M(H.feather,{soft:true}),.08,0,-.15,-.5,0,-.4); R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='icecrown'){ const im=M(H.c||0xd8f4ff,{metal:.8}), im2=M(0x8fd8ff,{metal:.6}); for(let i=0;i<9;i++){ const a=(i-4)*.32, h=.14+(4-Math.abs(i-4))*.06; const c=add(R.hat,G.oct(1),i%2?im2:im,Math.sin(a)*.16,-.02+h*.5,Math.cos(a)*.13-.02); c.scale.set(.03,h*.6,.03); c.rotation.z=-a*.5; }
    add(R.hat,G.tor(.165,.018,4,18),im2,0,-.06,0,PI/2); R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='canopy'){ const bm=M(0x3a2614), lv=[0x1e4a1a,0x2e6a22,0x4a7a2a].map(c=>M(c,{soft:true}));
    for(let i=0;i<7;i++){ const a=(i-3)*.42, L=.35+(3-Math.abs(i-3))*.1; add(R.hat,G.tube([[Math.sin(a)*.1,-.05,Math.cos(a)*.05-.05],[Math.sin(a)*.25,L*.6,-.06],[Math.sin(a)*.42,L,-.1]],.045,.012,8,5),bm,0,0,0);
      LAB.leafRing(R.hat,7,L,.08,1,lv,.06,.18,2.2,.6).forEach(l=>{ l.position.x+=Math.sin(a)*.42; l.position.z-=.1; }); } R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='mask'){ add(R.head,G.box(.26,.13,.08),M(0xc8bca0,{soft:true}),0,.08,.13); add(R.head,G.box(.08,.06,.02),M(0x6a0a0e),.05,.06,.175); for(const s of [1,-1]) add(R.head,G.box(.02,.02,.2),M(0x8a7a60),.15*s,.12,.04);
    R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='halo'){ add(R.hat,G.tor(.2,.02,5,18),M(H.c||0xffe9a0,{glow:true}),0,.16,-.08,PI/2-.3); R.hatTip=grp(R.hat,0,0,0); }
  else if(H.type==='beak'){ const bm=M(H.c||0xe8dcc0); add(R.head,G.cone(.075,.36,8),bm,0,.1,.3,PI/2+.15); add(R.head,G.box(.28,.07,.06),M(0x2a2a2a),0,.17,.13); for(const s of [1,-1]) add(R.head,G.cyl(.042,.042,.02,8),M(H.lens||0x9be05a,{glow:true}),.07*s,.17,.165,PI/2);
    add(R.hat,G.disc(.16,.34,24,(x,z,r,a)=>-.03*((r-.16)/.18)),M(H.hat||0x2a2a2a,{side:DS}),0,0,0); add(R.hat,G.cyl(.17,.18,.22,14),M(H.hat||0x2a2a2a),0,.11,0); add(R.hat,G.tor(.175,.02,4,14),M(0x5a3a22),0,.03,0,PI/2); R.hatTip=grp(R.hat,0,0,0); }
  else R.hatTip=grp(R.hat,0,0,0);
  if(LAB.HATS[H.type]) LAB.HATS[H.type](R,H,{b,skin,M,MT,G,add,grp,shade,PI,DS});
  if(H.tilt) R.hat.rotation.x=H.tilt; if(H.roll) R.hat.rotation.z=H.roll;
  // a brim shades the face in real light but hides it at sprite size: hats cast no shadow
  R.hat.traverse(m=>{ if(m.isMesh) m.castShadow=false; });
  // ----- arms
  const sleeve=o.sleeve||'flared', aArm=A&&AR.arms;
  const upM=aArm?A.c:skel?bone:(sleeve==='bare'||sleeve==='vest')?(o.armSkin?MT(o.armSkin):skin):o.sleeveC?MT(o.sleeveC,{soft:true}):top===skin?skin:robe;
  for(const s of [1,-1]){ const n=s>0?'L':'R';
    const arm=grp(R.torso,b.sh*s,.44,0), el=grp(arm,0,-.3,0), hand=grp(el,0,-.32,0); R['arm'+n]=arm; R['elbow'+n]=el; R['hand'+n]=hand;
    if(skel||o.boneArms){ add(arm,G.sph(.04,6,5),bone,0,0,0); add(arm,G.cyl(b.ar,b.ar*.9,.3,6),bone,0,-.15,0); add(el,G.sph(.034,6,5),bone,0,0,0);
      add(el,G.cyl(b.ar*.8,b.ar*.7,.3,5),bone,.015,-.15,0); add(el,G.cyl(b.ar*.6,b.ar*.6,.28,5),bone,-.015,-.15,0);
      for(let i=0;i<4;i++) add(hand,G.cyl(.01,.008,.09,4),bone,(i-1.5)*.018,-.04,.01,.2,0,0); add(hand,G.box(.06,.04,.03),bone,0,.0,0);
      if(o.sleeve&&o.sleeve!=='bare') add(el,G.lathe([[.07,.02],[.11,-.14],[.17,-.3]],12),robe2,0,0,0);
      if(o.sleeve==='flared'||o.sleeve==='tight') add(arm,G.cyl(.075,.065,.28,8,1,true),robe2,0,-.14,0);
      continue; }
    const shM=aArm?A.c:upM;
    const AL=o.armLen||1; if(AL!==1){ el.position.y=-.3*AL; hand.position.y=-.32*AL; }
    const mu=b.mus||0; { const d=add(arm,G.limb(ARM.delt(b.ar*(mu?1.25:1.08),mu),12),shM,0,0,0); d.scale.x=s; }
    add(arm,G.limb(ARM.upper(b.ar,mu),12),upM,0,0,0);
    let fM=aArm?A.c:(sleeve==='bare'||sleeve==='short'||sleeve==='open'||sleeve==='vest')?(o.armSkin?MT(o.armSkin):skin):sleeve==='tight'?(o.sleeveC?MT(o.sleeveC,{soft:true}):robeDk):robe; if(o.forearm&&!aArm) fM=MT(o.forearm,{soft:true});
    if(sleeve==='flared'&&!aArm){ add(el,G.lathe([[.06,.02],[.09,-.1],[.15,-.3],[.13,-.31]],12),robe2,0,0,0); add(el,G.limb(ARM.fore(b.ar*.8,0).filter(r=>r[0]<-.12),10),skin,0,0,0); }
    else { add(el,G.sph(b.ar*.82,8,6),fM,0,0,0); add(el,G.limb(ARM.fore(b.ar,mu),12),fM,0,0,0); }
    if(sleeve==='open'&&!aArm) add(arm,G.lathe([[b.ar*1.1,-.02],[b.ar*1.3,-.2],[.13,-.36],[.16,-.48]],12),robe2,0,0,0);
    if(aArm){ add(arm,G.cyl(b.ar*1.25,b.ar*1.08,.22,10),A.c,0,-.17,0); add(el,G.sph(b.ar*1.18,8,6),A.c2,0,0,.01); add(el,G.cone(b.ar*.6,.1,5),A.tr,0,0,-b.ar*1.1,-PI/2);
      add(el,G.cyl(b.ar*1.2,b.ar*.95,.25,10),A.c,0,-.16,0); add(el,G.cyl(b.ar*1.32,b.ar*1.32,.06,10),A.c2,0,-.27,0); }
    if(o.bracers&&!aArm) add(el,G.cyl(b.ar*.95+.014,b.ar*.8+.014,.14,8),M(o.bracers),0,-.2,0);
    if(o.armVines) vine(el,[[b.ar*.8,-.3],[b.ar*.95,0]],1,1.4,M(o.armVines),null,.012,s);
    if(o.armThorns) for(let i=0;i<3;i++) add(el,G.cone(.02,.1,4),M(o.armThorns),0,-.05-i*.08,-b.ar*.9,-PI/2-.5);
    if(o.barkLimbs){ const gm=M(o.grain); for(let i=0;i<5;i++){ const a=i*1.3; add(arm,G.box(.026,.14,.02),gm,Math.sin(a)*b.ar*1.02,-.08-(i%2)*.1,Math.cos(a)*b.ar*1.02); add(el,G.box(.026,.12,.02),gm,Math.sin(a+.6)*b.ar*.85,-.08-(i%2)*.1,Math.cos(a+.6)*b.ar*.85); } }
    const hm=aArm?A.c2:o.gloves?MT(o.gloves):skin, hr=Math.max(.052,b.ar*1.05);
    add(hand,G.sph(hr,8,6),hm,0,-.005,0).scale.set(.95,.95,.62); add(hand,G.box(hr*1.25,hr*.85,hr*.7),hm,0,-hr*.85,hr*.22,.55,0,0); add(hand,G.box(hr*1.2,hr*.4,hr*.6),hm,0,-hr*1.3,hr*.5,1.2,0,0);
    add(hand,G.cyl(hr*.3,hr*.24,hr*1.1,6),hm,-s*hr*.78,-hr*.35,hr*.38,.5,0,-s*.45);
    if(o.handClaws) for(let i=0;i<3;i++) add(hand,G.cone(.014,.09,4),M(o.handClaws),(i-1)*.03,-.08,.04,PI-.3,0,0); }
  if(o.armLen&&o.armLen!==1) for(const n of ['L','R']){ for(const p of [R['arm'+n],R['elbow'+n]]) p.children.forEach(c=>{ if(c.isMesh){ c.position.y*=o.armLen; if(c.geometry.type!=='SphereGeometry') c.scale.y*=o.armLen; } }); }
  // the right hand's weapon; staffs, spears and banners stay upright in the fist
  R.weaponKind=o.weapon?o.weapon.kind:'none';
  R.upright=['staff','spear','scythe','banner'].includes(R.weaponKind);
  R.wpPivot=grp(R.handR); if(o.weapon){ R.weapon=LAB.weapon(o.weapon); R.wpPivot.add(R.weapon); if(o.weaponK) R.weapon.scale.setScalar(o.weaponK); }
  if(o.offhand){ const sh=['shield','kite','round'].includes(o.offhand.kind); R.offPivot=grp(R.handL); R.off=sh?LAB.shield(o.offhand):LAB.weapon(o.offhand); R.offPivot.add(R.off);
    if(sh){ R.off.position.set(.08,.02,.12); R.off.rotation.set(0,-.9,0); if(o.offK) R.off.scale.setScalar(o.offK); } }
  // magic: orb in the free hand, sparks, and a strike arc
  const fx=o.fx||0x8affd2;
  R.orb=add(R.handL,G.ico(.09),M(fx,{glow:true})); R.sparks=grp(root);
  for(let i=0;i<6;i++) add(R.sparks,G.oct(.05),M(i%2?fx:0xffffff,{glow:true}));
  R.slash=add(root,G.tor(.95,.035,4,24,1.9),M(fx,{glow:true}),0,1.3,.15,-.5,0,0);
  if(o.bolts){ R.bolts=grp(root); const bm=M(o.bolts,{glow:true}), bw=M(0xffffff,{glow:true});
    for(const s of [1,-1]){ let p=[0,0,0]; for(let i=0;i<6;i++){ const q=[p[0]+(rnd()-.5)*.25,p[1]+.22,p[2]+(rnd()-.3)*.1]; const len=Math.hypot(q[0]-p[0],q[1]-p[1],q[2]-p[2]);
        const m=add(R.bolts,G.box(.045,len,.045),i%2?bm:bw,s*.4+(p[0]+q[0])/2,1.75+(p[1]+q[1])/2,.2+(p[2]+q[2])/2); LAB.aim(m,q[0]-p[0],q[1]-p[1],q[2]-p[2]); p=q; } } }
  R.o=o;
  if(o.dress) o.dress(R,{b,skin,robe,robe2,robeDk,trim,belt,bootM,legsM,top,M,MT,G,add,grp,shade,PI,DS,legK,thighL,shinL,prof,dz});
  LAB.faceProject(R);
  return R; };

/* ---------- painted face ----------
   The face hemisphere is projected through the sprite camera (front view, standing pose) so each
   texel of the face texture is one pixel of the finished sprite. Anchors give the painter where
   the eyes, nose and mouth land in that view; the near eye is the one closer to the camera. */
LAB.faceProject=function(R){ if(!R.faceMesh) return;
  const yaw=LAB.curYaw==null?.38:LAB.curYaw, PPU=LAB.PPU, ce=Math.cos(LAB.ELEV), se=Math.sin(LAB.ELEV), HS=R.o.headS||[1,1,1];
  const prevY=R.root.rotation.y;
  LAB.poseHumanoid(R,LAB.HMOVES.idle.pose(0,R)); R.root.rotation.y=yaw; R.root.updateMatrixWorld(true);
  const proj=v=>[v.x*PPU,(v.y*ce-v.z*se)*PPU,v.z*ce+v.y*se];
  const W=(x,y,z)=>{ const q=R.headPt(x,y,z); return R.head.localToWorld(new T.Vector3(q[0],q[1],q[2])); };
  const hc=proj(W(0,.16,0)), tp=proj(W(0,.32,0)), rpx=Math.hypot(tp[0]-hc[0],tp[1]-hc[1]);
  const TS=rpx*2+8<=32?32:rpx*2+8<=64?64:128, X0=Math.floor(hc[0])-TS/2, Y0=Math.floor(hc[1])-TS/2;
  const fm=R.faceMesh, g=fm.geometry, p=g.attributes.position, uv=g.attributes.uv, v=new T.Vector3();
  for(let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); fm.localToWorld(v); const s=proj(v); uv.setXY(i,(s[0]-X0)/TS,(s[1]-Y0)/TS); }
  uv.needsUpdate=true;
  const an=(x,y,z)=>{ const s=proj(W(x,y,z)); return [s[0]-X0,Y0+TS-s[1],s[2]]; };
  const A={eyeR:an(-.058,.14,.15), eyeL:an(.058,.14,.15), browR:an(-.062,.184,.146), browL:an(.062,.184,.146), nose:an(0,.1,.16), mouth:an(0,.052,.146),
    chin:an(0,.012,.115), cheekR:an(-.094,.092,.124), cheekL:an(.094,.092,.124), center:[hc[0]-X0,Y0+TS-hc[1]], r:rpx, TS};
  const rN=A.eyeR[2]>A.eyeL[2];
  A.eyeN=rN?A.eyeR:A.eyeL; A.eyeF=rN?A.eyeL:A.eyeR; A.browN=rN?A.browR:A.browL; A.browF=rN?A.browL:A.browR; A.cheekN=rN?A.cheekR:A.cheekL; A.cheekF=rN?A.cheekL:A.cheekR;
  A.d=A.eyeF[0]>A.eyeN[0]?1:-1;
  const skin=R.faceSkin, tex=LAB.paint(TS,TS,P=>LAB.paintFace(P,A,R.faceSpec,skin),{c:skin,metal:R.o.skinMetal||0});
  fm.userData.m=M(skin,{tex,metal:R.o.skinMetal||0});
  R.root.rotation.y=prevY; R.faceA=A; R.faceTex=tex; R.headPx=[hc[0],hc[1],rpx]; };

/* ---------- poses ---------- */
const BASE={hipsY:.95, hipZ:0, headZ:0, torsoX:0, torsoY:0, torsoZ:0, headX:0, headY:0, legL:0, legR:0, kneeL:.05, kneeR:.05,
  armLX:0, armLZ:.15, elbowL:-.15, armRX:-.2, armRZ:-.36, elbowR:-.5, wpTilt:0, wpY:0, wpX:-1.9,
  cape:.08, skirtZ:0, hatTip:-.4, orb:0, sparks:0, slash:0, slashZ:0, rise:0, wing:0, t:0};
LAB.HBASE=BASE;
LAB.poseHumanoid=function(R,P){
  const sp=R.o.spread||0, S0=R.o.stance;
  if(S0){ P={...P}; for(const k in S0) P[k]=(P[k]||0)+S0[k]; }
  R.hips.position.y=P.hipsY+P.rise+(R.hipsOff||0); R.hips.rotation.z=P.hipZ||0; R.torso.rotation.set(P.torsoX,P.torsoY,P.torsoZ); R.head.rotation.set(P.headX,P.headY,P.headZ||0);
  if(R.legL){ const hz=P.hipZ||0; R.legL.rotation.set(P.legL,0,.04+sp*.3-hz); R.legR.rotation.set(P.legR,0,-.04-sp*.3-hz); R.kneeL.rotation.x=P.kneeL; R.kneeR.rotation.x=P.kneeR; }
  R.armL.rotation.set(P.armLX,0,P.armLZ+sp); R.elbowL.rotation.x=P.elbowL; R.armR.rotation.set(P.armRX,0,P.armRZ-sp); R.elbowR.rotation.x=P.elbowR;
  if(R.upright) R.wpPivot.rotation.set(P.wpTilt-(P.armRX+P.elbowR),0,-(P.armRZ-sp)); else R.wpPivot.rotation.set(P.wpX+P.wpTilt,0,0);
  if(R.weapon) R.weapon.position.y=P.wpY;
  if(R.cape) R.cape.rotation.x=P.cape; R.skirt.rotation.z=P.skirtZ; if(R.hatTip) R.hatTip.rotation.x=P.hatTip;
  if(R.wings) R.wings.forEach((w,i)=>w.rotation.y=(i?-1:1)*(.3-P.wing*.5));
  if(R.tail) R.tail.rotation.set(.1*Math.sin(P.t*PI*2),.35*Math.sin(P.t*PI*2),0);
  for(const f of R.flick) f.o.rotation[f.ax]=(f.z0||0)+f.a*Math.sin(P.t*PI*2*f.k+f.p);
  R.orb.visible=P.orb>.05&&!R.o.noOrb; R.orb.scale.setScalar(Math.max(.01,P.orb));
  R.sparks.visible=P.sparks>.05;
  R.sparks.children.forEach((s,i)=>{ const a=i/6*PI*2+P.sparks*2.2; s.position.set(Math.cos(a)*.6,1.3+.5*P.sparks+.18*Math.sin(a*2),Math.sin(a)*.6); });
  R.slash.visible=P.slash>.05&&!R.o.noSlash; R.slash.scale.setScalar(.8+.2*P.slash); R.slash.rotation.z=-.5+P.slash*.4+P.slashZ;
  if(R.bolts) R.bolts.visible=P.sparks>.6||P.slash>.6;
  if(R.weapon) LAB.fireTick(R.weapon,P.t||0);
  if(R.o.onPose) R.o.onPose(R,P);
  if(R.anim) for(const f of R.anim) f(R,P);
};
const S=LAB.SIN;
LAB.HMOVES={
  idle:{frames:6, fps:6, pose:(t,R)=>{ const s=S(t); return {...BASE, hipsY:.95+.016*s+(R.o.float?.08+.04*s:0), torsoX:.02*s, headX:-.03*s, armLX:.05*s, cape:.08+.04*Math.sin(t*PI*2+1), hatTip:-.4+.08*Math.sin(t*PI*2+.6)}; }},
  walk:{frames:8, fps:10, pose:(t,R)=>{ const ph=t*PI*2, sw=Math.sin(ph), c=Math.cos(ph);
    if(R.o.float) return {...BASE, hipsY:1.03+.04*Math.sin(ph*2), torsoX:.18, armLX:.25+.1*sw, armRX:-.4, skirtZ:.06*sw, cape:.45+.1*Math.abs(sw), hatTip:-.5};
    const g=Object.assign({stride:1,bounce:1,sway:0,twist:1,arm:1,lift:1},R.o.gait||{});
    return {...BASE, hipsY:.95-.04*g.bounce*Math.abs(sw), legL:-.5*g.stride*sw, legR:.5*g.stride*sw, kneeL:.08+.7*g.lift*Math.max(0,c), kneeR:.08+.7*g.lift*Math.max(0,-c),
      armLX:.45*g.arm*sw, elbowL:-.25, armRX:R.upright?-.3-.14*sw:-.2-.35*g.arm*sw, torsoY:.1*g.twist*sw, torsoZ:g.sway*sw, skirtZ:.05*sw, cape:.2+.1*Math.abs(sw), hatTip:-.45+.12*Math.cos(ph*2)}; }},
  cast:{frames:8, fps:11, pose:(t,R)=>{ const up=R.upright; if(R.o.castUp) return LAB.keyed(BASE,[[0,{}],
      [.25,{armRX:-1.6, armLX:-1.6, elbowR:-.4, elbowL:-.4, armRZ:-.5, armLZ:.5, torsoX:-.1, headX:-.2, cape:.2}],
      [.5,{armRX:-2.9, armLX:-2.9, elbowR:-.1, elbowL:-.1, armRZ:-.35, armLZ:.35, torsoX:-.2, headX:-.35, sparks:1, rise:.08, cape:.35}],
      [.75,{armRX:-2.9, armLX:-2.9, elbowR:-.1, elbowL:-.1, armRZ:-.35, armLZ:.35, torsoX:-.15, headX:-.3, sparks:1, rise:.08, cape:.3}],[1,{}]],t);
    return LAB.keyed(BASE,[[0,{}],
    [.22,{armRX:up?-1.3:-.9, elbowR:-1, torsoX:-.1, headX:-.12, armLX:-.35, elbowL:-.7, orb:.4, cape:.14}],
    [.45,{armRX:up?-2.7:-1.6, armRZ:-.22, elbowR:-.25, wpY:up?-.6:0, torsoX:-.16, headX:-.3, armLX:-1.25, elbowL:-.35, orb:1, sparks:.5, cape:.18}],
    [.68,{armRX:up?-2.7:-1.6, armRZ:-.22, elbowR:-.25, wpY:up?-.6:0, torsoX:.1, armLX:-1.5, elbowL:-.08, orb:1.35, sparks:1, cape:.24, hipsY:.93}],
    [.88,{armRX:-1, elbowR:-.8, torsoX:.04, armLX:-.6, elbowL:-.4, orb:.3, sparks:.35}],[1,{}]],t); }},
  attack:{frames:6, fps:11, pose:(t,R)=>{ const k=R.weaponKind;
    if(R.o.castUp&&k==='none') return LAB.keyed(BASE,[[0,{}],[.25,{armRX:-2.2, armLX:-2.2, armRZ:-.6, armLZ:.6, elbowR:-.6, elbowL:-.6, torsoX:-.15, cape:.3}],
      [.5,{armRX:-1.4, armLX:-1.4, armRZ:-.2, armLZ:.2, elbowR:0, elbowL:0, torsoX:.2, slash:1, cape:.5, sparks:1}],[.75,{armRX:-1.3, armLX:-1.3, elbowR:0, elbowL:0, torsoX:.15, slash:.6, cape:.4, sparks:.8}],[1,{}]],t);
    if(k==='sword'||k==='axe') return LAB.keyed(BASE,[[0,{}],
      [.22,{armRX:-2.7, armRZ:-.3, elbowR:-.5, wpX:-.4, torsoY:.35, torsoX:-.12, armLX:-.4, legL:-.2, legR:.15}],
      [.42,{armRX:-.7, armRZ:-.1, elbowR:-.1, wpX:-1.1, torsoY:-.35, torsoX:.22, armLX:.4, legL:-.36, legR:.26, kneeR:.3, hipsY:.91, slash:1, slashZ:.5, cape:.3}],
      [.62,{armRX:-.5, elbowR:-.15, wpX:-1.2, torsoY:-.3, torsoX:.18, armLX:.35, legL:-.3, legR:.22, kneeR:.25, hipsY:.92, slash:.55, slashZ:.5, cape:.26}],
      [.82,{armRX:-.4, elbowR:-.5, torsoY:-.1}],[1,{}]],t);
    if(k==='dagger') return LAB.keyed(BASE,[[0,{}],[.25,{armRX:.5, elbowR:-1.6, armLX:.5, elbowL:-1.5, torsoX:-.1, hipsY:.9, kneeL:.4, kneeR:.4}],
      [.45,{armRX:-1.6, elbowR:-.1, wpX:-1.5, armLX:-1.5, elbowL:-.1, torsoX:.3, legL:-.4, legR:.3, hipsY:.9, slash:1, slashZ:-.2}],[.7,{armRX:-1.3, elbowR:-.2, armLX:-1.2, torsoX:.2, slash:.4}],[1,{}]],t);
    if(k==='none') return LAB.keyed(BASE,[[0,{}],[.25,{armRX:.4, elbowR:-1.4, torsoY:.4, torsoX:-.1, armLX:-.4, legL:-.2, legR:.15}],
      [.45,{armRX:-1.5, elbowR:-.1, torsoY:-.4, torsoX:.25, armLX:.4, legL:-.36, legR:.26, kneeR:.3, hipsY:.91, slash:1, slashZ:-.3, cape:.3}],[.7,{armRX:-1.3, elbowR:-.2, torsoY:-.3, torsoX:.18, slash:.5}],[1,{}]],t);
    return LAB.keyed(BASE,[[0,{}],
      [.2,{armRX:-.55, elbowR:-1.4, torsoY:.5, torsoX:-.08, wpTilt:.7, armLX:.3, legL:-.18, legR:.15}],
      [.42,{armRX:-1.55, elbowR:-.2, torsoY:-.45, torsoX:.2, wpTilt:-1.35, armLX:.55, legL:-.36, legR:.26, kneeR:.3, hipsY:.91, slash:1, cape:.3}],
      [.62,{armRX:-1.45, elbowR:-.25, torsoY:-.38, torsoX:.15, wpTilt:-1.2, armLX:.45, legL:-.3, legR:.22, kneeR:.25, hipsY:.92, slash:.55, cape:.26}],
      [.82,{armRX:-.6, elbowR:-.6, wpTilt:-.3, torsoY:-.1}],[1,{}]],t); }},
  hurt:{frames:4, fps:9, pose:t=>LAB.keyed(BASE,[[0,{torsoX:-.32, headX:-.45, armLX:.6, armLZ:.55, armRX:.15, elbowR:-.4, wpTilt:.5, hipsY:.92, cape:.35}],
    [.35,{torsoX:-.22, headX:-.25, armLX:.35, armLZ:.4, wpTilt:.3, hipsY:.93, cape:.25}],[1,{}]],t)},
};
// every move gets its time so flames, tails and hair can flicker
for(const m in LAB.HMOVES){ const f=LAB.HMOVES[m].pose; LAB.HMOVES[m].pose=(t,R)=>{ const P=f(t,R); P.t=t; return P; }; }
})();
