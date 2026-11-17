/* ---------------- the Materials lab ----------------
   A look-development studio, from the lab picker: a grey cyclorama, a wooden turntable that turns the prop on it, a
   matte grey ball and a chrome ball (it reflects the studio), lit by the game's own lighting set-ups:
   each area's lamp and ambient, a torch, a glow, a dark corridor, a battle arena, or a plain studio key light. Every
   prop in the dungeon and the battles can be put on the turntable, and every painted material on it tuned with
   sliders (explore.js XPROP_TUNE: hue, saturation, contrast, brightness, detail, roughness, metalness, normal, bump,
   height, ao and scale). What you tune is kept in this browser and shows in the game at once; Copy JSON gives the
   lot to paste into propmats.js as the game's defaults. Nothing here touches your game. */
const ML_KEY='hexmancers-matlab';
const ML={ on:false, area:0, light:0, asset:0, mat:null, spin:true, grade:true, low:false, refs:true, yaw:.3, pitch:.62, dist:12.5, T:0 };
try{ Object.assign(ML,JSON.parse(localStorage.getItem(ML_KEY)||'{}'),{on:false}); }catch(e){}
const mlKeep=()=>{ try{ const {area,light,asset,spin,grade,low,refs,side}=ML; localStorage.setItem(ML_KEY,JSON.stringify({area,light,asset,spin,grade,low,refs,side})); }catch(e){} };
const ML_AREAS=()=>(typeof AREAS!=='undefined'?AREAS:[]).filter(a=>a&&a.id&&a.stone);
const ML_LIGHTS=[
  {id:'room', name:'Dungeon: your lamp in a room'},
  {id:'torch', name:'Dungeon: by a torch'},
  {id:'glow', name:'Dungeon: by a glow (crystal, pool)'},
  {id:'dark', name:'Dungeon: dark corridor, lamp only'},
  {id:'battle', name:'Battle arena'},
  {id:'studio', name:'Studio: neutral key light'},
  {id:'tp', name:'Studio: 3-point (key, rim, HDRI fill)'} ];
// the 3-point set-up's settings (kept in this browser): key (directional), rim (a spot from behind), fill (an HDRI)
const ML_TP_DEF={ keyI:1, keyC:'#fff4e6', keyAz:-40, keyEl:40, rimI:2, rimC:'#cfe4ff', rimAz:160, rimEl:35, rimAng:30, fillI:.6, fillRot:0, hdri:0, ambI:0 };
const ML_TP=Object.assign({},ML_TP_DEF,(()=>{ try{ return JSON.parse(localStorage.getItem(ML_KEY+'-3pt'))||{}; }catch(e){ return {}; } })());
const mlTPKeep=()=>{ try{ localStorage.setItem(ML_KEY+'-3pt',JSON.stringify(ML_TP)); }catch(e){} };
const ML_TP_SLIDERS=[['#Key light (directional)'],['keyI','Intensity',0,3,.01],['keyC','Colour'],['keyAz','Around',-180,180,1],['keyEl','Height',5,90,1],
  ['#Rim light (spot, from behind)'],['rimI','Intensity',0,6,.01],['rimC','Colour'],['rimAz','Around',-180,180,1],['rimEl','Height',0,85,1],['rimAng','Cone width',5,80,1],
  ['#Fill (HDRI)'],['hdri','Environment'],['fillI','Intensity',0,3,.01],['fillRot','Rotation',-180,180,1],['ambI','Extra flat ambient',0,1,.01]];
const ML_HDRI_PAINT=['Studio softboxes','Overcast sky','Warm interior','The area\'s air'];
// and the battle backdrops' matte paintings (2:1 panoramas: arenabackdropmap.js), each its far layer with its mid layer over it
const ML_MATTES=()=>{ const M=typeof ARENA_BACKDROP!=='undefined'&&ARENA_BACKDROP.mattes||{}, out=[]; for(const id in M) for(let n=1;n<=M[id];n++) out.push([id,n]); return out; };
const ML_HDRI=()=>ML_HDRI_PAINT.concat(ML_MATTES().map(([id,n])=>'Matte: '+id.replace('boss-','boss ')+' '+n));
// an environment picture (equirectangular, 256 x 128) painted here: the HDRI fill's light and the chrome ball's reflection
function mlHdri(k,A){ const W=256, H=128, c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const grad=(stops)=>{ const g=x.createLinearGradient(0,0,0,H); for(const [t,col] of stops) g.addColorStop(t,col); x.fillStyle=g; x.fillRect(0,0,W,H); };
  const box=(az,el,w,h,col)=>{ x.fillStyle=col; const cx=(az/360+.5)*W, cy=(.5-el/180)*H; x.filter='blur(3px)'; x.fillRect(cx-w/2,cy-h/2,w,h); x.filter='none'; };
  if(k===0){ grad([[0,'#2a2a2c'],[.5,'#3a3a3c'],[.52,'#262628'],[1,'#141416']]); box(-60,25,34,40,'#ffffff'); box(75,30,30,36,'#f2f4ff'); box(0,70,120,10,'#d8d8d8'); }
  else if(k===1){ grad([[0,'#e8eef6'],[.45,'#c6ccd4'],[.5,'#a8a49a'],[.55,'#6a6256'],[1,'#3a342c']]); }
  else if(k===2){ grad([[0,'#1a120c'],[.4,'#4a2c18'],[.5,'#8a5a30'],[.6,'#3a2414'],[1,'#120c08']]); box(-90,15,20,20,'#ffcf8a'); box(120,10,14,16,'#ffb060'); }
  else { const g=new THREE.Color(A.glow||'#ffb060'), f=new THREE.Color(A.fog||'#202028'); const hx=c=>'#'+c.getHexString();
    grad([[0,hx(f.clone().multiplyScalar(.6))],[.45,hx(f.clone().lerp(g,.35))],[.5,hx(g.clone().multiplyScalar(.7))],[.58,hx(f)],[1,hx(f.clone().multiplyScalar(.4))]]); }
  const t=new THREE.CanvasTexture(c); t.mapping=THREE.EquirectangularReflectionMapping; t.wrapS=THREE.RepeatWrapping;
  // a blurred copy for the diffuse fill (a surface sees the half of the sky around its normal, not a sharp picture of it)
  const b=document.createElement('canvas'); b.width=32; b.height=16; const bx=b.getContext('2d'); bx.filter='blur(2px)'; bx.drawImage(c,0,0,32,16); const tb=new THREE.CanvasTexture(b); tb.wrapS=THREE.RepeatWrapping; tb.magFilter=tb.minFilter=THREE.LinearFilter; tb.generateMipmaps=false;
  return {sharp:t, soft:tb}; }
const ML_ENVU={ uLabEnv:{value:null}, uLabEnvK:{value:0}, uLabEnvRot:{value:0} };
// the HDRI fill on a lit material of the studio's: its light as indirect diffuse, from the blurred picture round the normal
function mlEnvPatch(root){ root.traverse(o=>{ const m=o.material; if(!m||Array.isArray(m)||m.userData.labEnv||!(m.isMeshPhongMaterial||m.isMeshStandardMaterial)) return; if(m.envMap) return;
    m.userData.labEnv=1; const prev=m.onBeforeCompile, pk=m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey?m.customProgramCacheKey.bind(m):null;
    m.onBeforeCompile=(sh,r)=>{ if(prev) prev.call(m,sh,r); Object.assign(sh.uniforms,ML_ENVU);
      sh.fragmentShader=sh.fragmentShader.replace('void main() {','uniform sampler2D uLabEnv; uniform float uLabEnvK, uLabEnvRot;\nvoid main() {')
        .replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n if(uLabEnvK>0.){ vec3 d=normalize(inverseTransformDirection(normal,viewMatrix)); vec2 eu=vec2(atan(d.z,d.x)/6.2832+.5+uLabEnvRot,asin(clamp(d.y,-1.,1.))/3.1416+.5);\n  reflectedLight.indirectDiffuse+=texture2D(uLabEnv,eu).rgb*uLabEnvK*diffuseColor.rgb; }'); };
    m.customProgramCacheKey=()=>(pk?pk():'p')+'|labenv'; m.needsUpdate=true; }); }
const ML_SLIDERS=[
  ['#Colour'], ['hue','Hue shift',-180,180,1], ['sat','Saturation',0,2,.01], ['con','Contrast',0,3,.01], ['bri','Brightness',0,2,.01], ['detail','Texture strength',0,2,.01],
  ['#Surface'], ['rough','Roughness',0,2,.01], ['metal','Metalness',0,1,.01], ['normal','Normal strength',0,4,.01],
  ['bump','Bump (painted detail)',0,4,.01], ['height','Height (cavities)',0,3,.01], ['ao','AO (broad occlusion)',0,3,.01],
  ['#Tiling'], ['scale','Scale (tiles a metre)',.25,4,.01], ['rot','Rotation',-180,180,1], ['offu','Offset U',0,1,.01], ['offv','Offset V',0,1,.01],
  ['#Detail (the game\'s noises)'], ['dnoise','Noise'], ['dscale','Detail scale (repeats a tile)',1,32,.1], ['dstr','Detail strength',0,1,.01], ['drelief','Detail relief',0,4,.01] ];

// ---- the props that can go on the turntable ----
const ML_FURN=['barrel','crate','sack','urn','bones','skulls','rubble','statue','candles','shelf','rack','table','skeleton','mushrooms'];
const ML_KIT=['pillar','ruin','column','planter','boulder','bigrock','rubble','weaprack','anvil','cratestack','sapling','log','urnbig','bigcap','pool','basin','furnace','beam',
  'bookcase','desk','sarcophagus','trough','bench','bunk','table2','reeds','roots','caps','scrolls','bones','coal','straw'];
const ML_KIT_CELLS={ bigrock:'sq', pool:'sq', basin:'sq', furnace:'sq', planter:'two', log:'two', bookcase:'two', desk:'two', sarcophagus:'two', trough:'two', bench:'two', bunk:'two', table2:'two', column:'three', ruin:'three', beam:'three' };
const ML_PROPS=[['altar',{theme:'arcane'}],['decor',{theme:'stone'}],['statue',{face:0}],['core',{}],['mirror',{o:'/'}],['emitter',{}],['runestone',{}],['tablet',{}],['inscription',{}],
  ['lever',{}],['plever',{}],['switch',{}],['plate',{}],['block',{}],['trialaltar',{}],['blade',{ew:true}],['jet',{}],['totem',{}],['cache',{}],['pedestal',{}],['hstair',{}],['chute',{}],
  ['bones',{}],['corpse',{}],['pot',{}],['pot',{crate:true},'pot (crate)']];
function mlAssets(){ const L=[];
  for(const k of XPROP_MATS) L.push({group:'Material swatches', name:k, make:A=>mlSwatch(k)});
  for(const k of ML_FURN) L.push({group:'Room furniture', name:k, make:A=>mlFurn(k,A)});
  for(const k of ML_KIT) L.push({group:'Themed rooms and ruins', name:k, make:A=>mlKit(k,A)});
  for(const [k,o,n] of ML_PROPS) L.push({group:'Puzzle and story props', name:n||k, make:A=>mlProp(k,o,A)});
  L.push({group:'Chests', name:'chest', make:A=>mlChest({})}, {group:'Chests', name:'chest (rich)', make:A=>mlChest({rich:true})}, {group:'Chests', name:'chest (legendary, open)', make:A=>mlChest({rich:true,legend:true,open:true})});
  L.push({group:'Architecture', name:'built pillar', make:A=>mlPillar(A,false)}, {group:'Architecture', name:'cave pillar', make:A=>mlPillar(A,true)}, {group:'Architecture', name:'stairs', make:A=>mlStairs(A)},
    {group:'Architecture', name:'brazier', make:A=>mlBrazier(A)});
  L.push({group:'Battle arena', name:'arena rock', make:A=>mlArena(A,'rock')}, {group:'Battle arena', name:'boss dais', make:A=>mlArena(A,'dais')}, {group:'Battle arena', name:'arena pillar', make:A=>mlArena(A,'pillar')});
  return L; }
const mlTone=(A,v)=>new THREE.Color('rgb('+xTone(A.stone,v).join(',')+')');
function mlMerged(M,L){ const g=new THREE.Group(); if(M.size()) g.add(M.build(xPropTex(xPhong({vertexColors:true})))); if(L&&L.size()) g.add(L.build(new THREE.MeshBasicMaterial({vertexColors:true}))); return g; }
function mlSwatch(k){ const A=envArtProps(), c=(A&&A.mean[k])||[.5,.5,.5], col=new THREE.Color(c[0],c[1],c[2]), M=xMerger(); M.mat=k;
  const ball=new THREE.SphereGeometry(.5,32,20), cyl=new THREE.CylinderGeometry(.5,.5,1,32);
  M.add(ball,col,-.75,.55,.2,0,0,0,1.1,1.1,1.1); M.add(XG.box,col,.75,.45,.2,0,.5,0,.9,.9,.9); M.add(cyl,col,0,.6,-.85,0,0,0,.8,1.2,.8); M.add(XG.box,col,0,.04,.9,0,0,0,1.6,.08,.7);
  return mlMerged(M); }
function mlFurn(k,A){ const M=xMerger(), L=xMerger(); xFurnish(M,L,k,0,0,0,caveRng(11),A,A.stone); const g=new THREE.Group(); if(M.size()) g.add(M.build(xPropMat())); if(L.size()) g.add(L.build(new THREE.MeshBasicMaterial({vertexColors:true}))); return g; }
// a themed piece, built by the dungeon's own builder (xClutter) on a floor of its own
function mlStub(A,fn){ const was=EX, wasX=X3; EX={area:A, depth:1, marks:[], decor:[], fireL:new Map(), glows:[], props:[], chests:[], taken:new Set(), room:new Int16Array(XN*XN).fill(-1), t:new Uint8Array(XN*XN)};
  if(!X3) X3={group:null, low:ML.low}; const wg=X3.group, tmp=new THREE.Group(); X3.group=tmp;
  try{ fn(tmp); } catch(e){ console.warn('matlab',e); } finally{ X3.group=wg; if(!wasX) X3=null; EX=was; } tmp.traverse(o=>o.visible=true); return tmp; }
function mlKit(k,A){ const c0=xi(20,20), sh=ML_KIT_CELLS[k], cells=sh==='sq'?[c0,c0+1,c0+XN,c0+XN+1]:sh==='two'?[c0,c0+1]:sh==='three'?[c0,c0+1,c0+2]:[c0];
  const g=mlStub(A,tmp=>{ EX.marks=[{kind:'clutter',dark:false,items:[{k,v:false,cells,sd:5}]}]; xClutter(tmp,A,A.stone,77); });
  const cx=cells.reduce((s,c)=>s+xw(c),0)/cells.length, cz=cells.reduce((s,c)=>s+xz(c),0)/cells.length; g.position.set(-cx,0,-cz); const o=new THREE.Group(); o.add(g); return o; }
function mlProp(k,o,A){ const g=mlStub(A,tmp=>{ const p=Object.assign({kind:k,cell:xi(20,20),solid:true},o); if(k==='runestone') p.color=Object.keys(COLORS)[0]; if(k==='keystand') p.key=Object.keys(KEYS)[0]; const m=xMeshProp(p); if(m&&m.parent!==tmp) tmp.add(m); });
  g.position.set(-xw(xi(20,20)),0,-xz(xi(20,20))); const o2=new THREE.Group(); o2.add(g); return o2; }
function mlChest(c){ const ch=xChestBuild(Object.assign({cell:xi(20,20)},c)); ch.position.set(0,0,0); ch.rotation.y=0; return ch; }
function mlPillar(A,cave){ const key=cave?(A.id==='rifts'?'basalt':'rough-rock'):'dressed-stone', g=new THREE.Group(), geo=cave?xRockShaft():xOctPrism();
  const mat=v=>xPropTex(xPhong({color:mlTone(A,v)}),key), add=(geo,m,y,sx,sy)=>{ const me=new THREE.Mesh(geo,m); me.position.y=y; me.scale.set(sx,sy,sx); g.add(me); };
  add(cave?XG.box:xOctPrism(),mat(cave?.26:.6),.17,1.4,.34); add(geo,mat(cave?.34:.48),1.6,1.1,2.9); add(cave?XG.box:xOctPrism(),mat(cave?.26:.6),3.1,1.45,.24); return g; }
function mlStairs(A){ const g=new THREE.Group(), c=new THREE.Color(A.lit||'#888').lerp(new THREE.Color(0x6a6458),.7).multiplyScalar(.62);
  for(let k=0;k<5;k++){ const h=(5-k)*.14; g.add(xBox(1.6,h,.42,xMat(c.clone().multiplyScalar(1-.1*k),{mat:'dressed-stone'}),0,h/2,-.8+k*.42)); } return g; }
function mlBrazier(A){ return mlStub(A,tmp=>xBrazier(tmp,0,0,xi(20,20),A)); }
function mlArena(A,kind){ const g=new THREE.Group(), Ar=A, wasAR=typeof AR!=='undefined'?AR:null; if(!wasAR) AR={mats:[]};
  try{
  if(kind==='rock'){ const m=arPropMat(Ar,arRocky(Ar),.45)||xPhong({color:0x777777}); const geo=new THREE.CylinderGeometry(.62,.66,.75,6,1,false,Math.PI/6); geo.translate(0,.375,0); g.add(new THREE.Mesh(geo,m)); }
  else if(kind==='dais'){ const m=arPropMat(Ar,'dressed-stone',.5)||xPhong({color:0x777777}); const me=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.8,.45,6,1,false,Math.PI/6),m); me.position.y=.23; g.add(me); }
  else { const m=arPropMat(Ar,'dressed-stone',.55)||xPhong({color:0x777777}); const me=new THREE.Mesh(new THREE.CylinderGeometry(.45,.5,2.6,8),m); me.position.y=1.3; g.add(me); }
  } finally{ if(!wasAR) AR=null; } return g; }
const ML_A=()=>ML_AREAS()[ML.area]||ML_AREAS()[0];
// the painted materials on what is on the turntable, by name
function mlMatsOf(root){ const S=new Set(); root.traverse(o=>{ const m=o.material; if(!m||!m.userData) return;
    if(m.userData.xprop===2&&m.userData.xpropSlot>=0) S.add(XPROP_MATS[m.userData.xpropSlot]);
    else if(m.userData.xprop===1&&o.geometry&&o.geometry.attributes.aXL){ const a=o.geometry.attributes.aXL.array; for(let i=3;i<a.length;i+=4) if(a[i]>=0) S.add(XPROP_MATS[a[i]|0]); } });
  return XPROP_MATS.filter(k=>S.has(k)); }

// ---- the studio ----
let MLS=null;
function mlStudio(){ if(MLS) return MLS;
  const cv=$('#mlCanvas'), r=new THREE.WebGLRenderer({canvas:cv, antialias:false}); r.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#2a2b2e'); const cam=new THREE.PerspectiveCamera(40,1,.5,50);   // (a tight depth range: a phone's depth buffer bands a long flat floor into stripes under the ambient occlusion)
  const grey=c=>{ const m=xPhong({color:c,shininess:3,specular:0x080808}); m.userData.noProj=1; return m; };
  // the cyclorama: a floor, a curve and a wall, in one grey
  const cyc=new THREE.Group(), cm=grey(0x6e6e6e); cyc.add(new THREE.Mesh(mlCycGeo(),cm));
  // a dark rubber mat under the turntable, as in a studio
  const mat=new THREE.Mesh(new THREE.PlaneGeometry(9,7),grey(0x3a3b3e)); mat.rotation.x=-Math.PI/2; mat.position.set(.6,.005,.4); cyc.add(mat); scene.add(cyc);
  // the turntable and what turns on it
  const tt=new THREE.Group(); scene.add(tt); const spin=new THREE.Group(); spin.position.y=.18; tt.add(spin);
  // the references, floating beside the turntable: a matte grey ball (18% grey) and a chrome ball that reflects the studio
  const refs=new THREE.Group(); refs.position.set(1.5,0,-2.6); refs.rotation.y=-.3; scene.add(refs);
  const gb=new THREE.Mesh(new THREE.SphereGeometry(.4,48,32),grey(0x777777)); gb.position.set(-.5,1.6,0); refs.add(gb);   // 18% grey
  const crt=new THREE.WebGLCubeRenderTarget(128,{generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter}), cc=new THREE.CubeCamera(.1,60,crt);
  const chrome=new THREE.Mesh(new THREE.SphereGeometry(.4,48,32),new THREE.MeshStandardMaterial({color:0xffffff,metalness:1,roughness:.04,envMap:crt.texture}));
  chrome.position.set(.5,1.6,0); refs.add(chrome); chrome.add(cc); cc.position.set(0,0,0);
  for(const o of [gb,chrome]) o.material.userData.xlit=1;
  // the lights (set by mlLight)
  const amb=new THREE.AmbientLight(0xffffff,.2), sun=new THREE.DirectionalLight(0xffffff,.22), lamp=new THREE.PointLight(0xffd9a0,1.6,16,1.4), torch=new THREE.PointLight(0xffa040,0,10,1.6),
    glow=new THREE.PointLight(0xffffff,0,10,1.6), key=new THREE.DirectionalLight(0xffffff,0), fill=new THREE.DirectionalLight(0xffffff,0), rim=new THREE.SpotLight(0xffffff,0,30,Math.PI/6,.45,1);
  scene.add(amb,sun,lamp,torch,glow,key,fill,rim,key.target,fill.target,rim.target); rim.target.position.set(0,1,0);
  MLS={r,scene,cam,cyc,tt,spin,refs,gb,chrome,cc,amb,sun,lamp,torch,glow,key,fill,rim,G:{renderer:r,scene,cam,grade:1,low:false}};
  mlEnvPatch(cyc); mlEnvPatch(refs);
  return MLS; }
// the cyclorama's sweep: a floor running back into a curve and up a wall, one sheet with no seam
function mlCycGeo(){ const W=40, N=60, pts=[]; const R=3, z0=-5;   // the floor to z0, a quarter circle of radius R, the wall at z0-R
  for(let i=0;i<=N;i++){ const t=i/N; let y,z; if(t<.4){ z=14-(14-z0)*(t/.4); y=0; } else if(t<.6){ const a=(t-.4)/.2*Math.PI/2; z=z0-Math.sin(a)*R; y=R-Math.cos(a)*R; } else { z=z0-R; y=R+(t-.6)/.4*14; } pts.push([y,z]); }
  const g=new THREE.PlaneGeometry(W,1,1,N), P=g.attributes.position; for(let i=0;i<P.count;i++){ const row=Math.round((.5-P.getY(i))*N), [y,z]=pts[N-row]; P.setXYZ(i,P.getX(i),y,z); }
  g.computeVertexNormals();
  return g; }
function mlLight(){ const S=MLS, A=ML_A(), L=ML_LIGHTS[ML.light].id, g=new THREE.Color(A.glow||'#ffb060');
  const lampC=new THREE.Color(0xffd9a0).lerp(g,.3*XLIT.gTint), ambC=new THREE.Color(0xffffff).lerp(g,.25*XLIT.gTint), lampY=Math.max(XLIT.lampY||3,XWALL+1.2);
  S.amb.color.copy(ambC); S.amb.intensity=.2*XLIT.amb; S.sun.intensity=.22*XLIT.sun; S.sun.position.set(-4,10,6);
  S.lamp.color.copy(lampC); S.lamp.intensity=1.6*XLIT.lamp; S.lamp.distance=16*XLIT.lampRad; S.lamp.position.set(-2.9,lampY,.2);
  S.torch.intensity=0; S.glow.intensity=0; S.key.intensity=0; S.fill.intensity=0;
  if(L==='torch'){ S.torch.position.set(-2.6,2.3,-1.4); S.torch.intensity=1.5*XLIT.torch; }
  if(L==='glow'){ S.glow.color.copy(g); S.glow.position.set(-2.2,.6,.9); S.glow.intensity=.9*XLIT.torch; }
  if(L==='dark'){ S.amb.intensity=.04; S.sun.intensity=0; }
  if(L==='battle'){ S.lamp.intensity=0; S.amb.color.set(0xffffff); S.glow.color.copy(g); S.glow.position.set(-2.5,3,2); S.glow.intensity=1.1; S.torch.color.set(0xffd9a0); S.torch.position.set(2.8,3,1.5); S.torch.intensity=.9; }
  else S.torch.color.set(0xffa040);
  if(L==='studio'){ S.lamp.intensity=0; S.amb.color.set(0xffffff); S.amb.intensity=.35; S.sun.intensity=0; S.key.position.set(-6,7,3); S.key.intensity=.8; S.fill.position.set(6,3,4); S.fill.intensity=.35; }
  S.rim.intensity=0; ML_ENVU.uLabEnvK.value=0; S.scene.background=new THREE.Color('#2a2b2e');
  if(L==='tp'){ const T=ML_TP, at=(az,el,d)=>new THREE.Vector3(Math.sin(az*Math.PI/180)*Math.cos(el*Math.PI/180)*d, Math.sin(el*Math.PI/180)*d+1, Math.cos(az*Math.PI/180)*Math.cos(el*Math.PI/180)*d);
    S.lamp.intensity=0; S.sun.intensity=0; S.amb.color.set(0xffffff); S.amb.intensity=T.ambI;
    S.key.color.set(T.keyC); S.key.intensity=T.keyI; S.key.position.copy(at(T.keyAz,T.keyEl,10)); S.key.target.position.set(0,1,0);
    S.rim.color.set(T.rimC); S.rim.intensity=T.rimI; S.rim.position.copy(at(T.rimAz,T.rimEl,7)); S.rim.angle=T.rimAng*Math.PI/180;
    const E=mlHdriGet(T.hdri,A); ML_ENVU.uLabEnv.value=E.soft; ML_ENVU.uLabEnvK.value=T.fillI; ML_ENVU.uLabEnvRot.value=T.fillRot/360; S.scene.background=E.sharp; }
  const tpb=document.getElementById('mlTP'); if(tpb) tpb.hidden=L!=='tp';
  S.G.grade=ML.grade?1:0; S.G.low=ML.low; }
const ML_HCACHE=new Map();
function mlHdriGet(k,A){ if(k>=ML_HDRI_PAINT.length){ const mt=ML_MATTES()[k-ML_HDRI_PAINT.length]; if(mt){ const key='m|'+mt.join('|'); if(ML_HCACHE.has(key)) return ML_HCACHE.get(key);
      const im=typeof envArtMatte==='function'&&envArtMatte(mt[0],mt[1]); if(im){ const E=mlHdriMatte(im); ML_HCACHE.set(key,E); return E; }
      if(!(typeof envArtMatteFailed==='function'&&envArtMatteFailed(mt[0],mt[1]))){ clearTimeout(mlHdriGet.t); mlHdriGet.t=setTimeout(()=>ML.on&&mlLight(),400); } } k=0; }   // (the studio's until the painting has loaded)
  const key=k+'|'+(k===3?A.id:''); if(!ML_HCACHE.has(key)) ML_HCACHE.set(key,mlHdri(k,A)); return ML_HCACHE.get(key); }
function mlHdriMatte(im){ const c=document.createElement('canvas'); c.width=1024; c.height=512; const x=c.getContext('2d'); x.drawImage(im.far,0,0,1024,512); x.drawImage(im.mid,0,0,1024,512);
  const t=new THREE.CanvasTexture(c); t.mapping=THREE.EquirectangularReflectionMapping; t.wrapS=THREE.RepeatWrapping;
  const b=document.createElement('canvas'); b.width=32; b.height=16; const bx=b.getContext('2d'); bx.filter='blur(2px)'; bx.drawImage(c,0,0,32,16); const tb=new THREE.CanvasTexture(b); tb.wrapS=THREE.RepeatWrapping; tb.magFilter=tb.minFilter=THREE.LinearFilter; tb.generateMipmaps=false;
  return {sharp:t, soft:tb}; }
function mlTPSliders(){ const box=document.getElementById('mlTPBody'); if(!box) return; box.innerHTML=''; const T=ML_TP;
  for(const [k,label,lo,hi,st] of ML_TP_SLIDERS){ if(k[0]==='#'){ const h=document.createElement('h4'); h.textContent=k.slice(1); box.appendChild(h); continue; }
    const row=document.createElement('div'); row.className='mlr';
    if(k==='hdri'){ row.innerHTML='<label>'+label+'</label><select style="grid-column:2/4">'+ML_HDRI().map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('')+'</select>'; const se=row.querySelector('select'); se.value=String(T.hdri<ML_HDRI().length?T.hdri:0); se.onchange=()=>{ T.hdri=+se.value; mlTPKeep(); mlLight(); }; }
    else if(/C$/.test(k)){ row.innerHTML='<label>'+label+'</label><input type="color" value="'+T[k]+'" style="grid-column:2/4;width:100%;height:28px">'; const ci=row.querySelector('input'); ci.oninput=()=>{ T[k]=ci.value; mlTPKeep(); mlLight(); }; }
    else { row.innerHTML='<label>'+label+'</label><input type="range" min="'+lo+'" max="'+hi+'" step="'+st+'" value="'+T[k]+'"><output>'+(+T[k]).toFixed(st<1?2:0)+'</output>';
      const inp=row.querySelector('input'), out=row.querySelector('output'); inp.oninput=()=>{ T[k]=+inp.value; out.textContent=(+inp.value).toFixed(st<1?2:0); mlLight(); }; inp.onchange=mlTPKeep;
      row.querySelector('label').ondblclick=()=>{ T[k]=ML_TP_DEF[k]; inp.value=T[k]; out.textContent=(+T[k]).toFixed(st<1?2:0); mlTPKeep(); mlLight(); }; }
    box.appendChild(row); } }
function mlTurntable(){ const S=MLS; while(S.tt.children.length>1) S.tt.remove(S.tt.children[1]);
  const A=envArtProps(), pc=A&&A.mean.planks?new THREE.Color(...A.mean.planks):new THREE.Color(0x8a6a48);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,.18,64),xPropTex(xPhong({color:pc}),'planks')); top.position.y=.09; S.tt.add(top); mlEnvPatch(top);
  const dk=new THREE.MeshBasicMaterial({color:0x222224}); for(const r of [0,Math.PI/2]){ const b=new THREE.Mesh(new THREE.BoxGeometry(1.2,.005,.08),dk); b.position.y=.181; b.rotation.y=r; S.tt.add(b); } }
// which props use each material (built once in the background, a few props a frame): material -> [asset index]
const ML_USE=new Map(); let ML_USE_AT=0, ML_USE_DONE=false;
function mlIndex(){ if(ML_USE_DONE||!ML.on) return; if(!envArtProps()){ setTimeout(mlIndex,500); return; } const list=mlAssets(), A=ML_A(), t0=performance.now();
  while(ML_USE_AT<list.length&&performance.now()-t0<25){ const i=ML_USE_AT++, it=list[i]; if(it.group==='Material swatches') continue;
    let g=null; try{ g=it.make(A); } catch(e){} if(!g) continue;
    for(const k of mlMatsOf(g)){ if(!ML_USE.has(k)) ML_USE.set(k,[]); ML_USE.get(k).push(i); }
    g.traverse(o=>{ if(o.geometry&&!Object.values(XG).includes(o.geometry)) o.geometry.dispose(); }); }
  if(ML_USE_AT>=list.length) ML_USE_DONE=true; mlUseName(); if(!ML_USE_DONE) setTimeout(mlIndex,0); }
function mlUseName(){ const el=$('#mlUseName'); if(!el) return; const L=ML_USE.get(ML.mat)||[], list=mlAssets(), at=L.indexOf(ML.asset);
  el.textContent=(L.length?(at>=0?(at+1)+' of '+L.length+': '+list[ML.asset].name:L.length+' props'):'no props')+(ML_USE_DONE?'':' (still counting…)'); }
function mlUseStep(n){ const L=ML_USE.get(ML.mat)||[]; if(!L.length) return; const keep=ML.mat; let at=L.indexOf(ML.asset); at=at<0?(n>0?0:L.length-1):(at+n+L.length)%L.length;
  ML.asset=L[at]; ML.mat=keep; mlShow(); }
// the selected material on its test shapes, small, on a second turntable beside the prop
function mlSide(){ const S=MLS; if(!S.side){ S.side=new THREE.Group(); S.side.position.set(-2.9,0,-1.3); S.scene.add(S.side);
    const A=envArtProps(), pc=A&&A.mean.planks?new THREE.Color(...A.mean.planks):new THREE.Color(0x8a6a48), top=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.12,48),xPropTex(xPhong({color:pc}),'planks'));
    top.position.y=.06; S.side.add(top); mlEnvPatch(top); S.sideSpin=new THREE.Group(); S.sideSpin.position.y=.12; S.sideSpin.scale.setScalar(.5); S.side.add(S.sideSpin); }
  S.side.visible=!!ML.side; for(const c of [...S.sideSpin.children]) S.sideSpin.remove(c);
  if(ML.side&&ML.mat){ const g=mlSwatch(ML.mat); if(typeof xLitAll==='function') xLitAll(g); mlEnvPatch(g); S.sideSpin.add(g); } }
function mlShow(){ const S=MLS, list=mlAssets(); ML.asset=(ML.asset+list.length)%list.length; const it=list[ML.asset], A=ML_A();
  for(const c of [...S.spin.children]){ S.spin.remove(c); c.traverse(o=>{ if(o.geometry&&!Object.values(XG).includes(o.geometry)) o.geometry.dispose(); }); }
  let g=null; try{ g=it.make(A); } catch(e){ console.warn('matlab',it.name,e); }
  if(g){ if(typeof xLitAll==='function') xLitAll(g); mlEnvPatch(g); S.spin.add(g);
    // frame it: the camera comes in to fit the prop (the turntable's own size for anything bigger)
    const sp=new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere()); if(isFinite(sp.radius)&&sp.radius>0){ ML.ty=Math.max(.4,sp.center.y); ML.dist=Math.max(3,Math.min(12.5,sp.radius*4.2+1.5)); } }
  const mats=g?mlMatsOf(g):[]; if(!mats.includes(ML.mat)) ML.mat=mats[0]||ML.mat||XPROP_MATS[0];
  $('#mlAsset').value=String(ML.asset); $('#mlAssetName').textContent=it.group+' · '+it.name+(g?'':' (could not be built)');
  mlMatList(mats); mlSliders(); mlUseName(); mlSide(); mlKeep(); }

// ---- the panel ----
function mlPanel(){ if($('#matLab')) return;
  const d=document.createElement('div'); d.id='matLab'; d.innerHTML=`<style>
#matLab{position:fixed;inset:0;z-index:60;background:#111;display:none;flex-direction:column;color:#e8eef8;font-size:12px}
#matLab.on{display:flex} #mlView{position:relative;flex:1 1 52%;min-height:0;touch-action:none} #mlCanvas{width:100%;height:100%;display:block}
#mlHud{position:absolute;left:8px;top:8px;right:8px;display:flex;flex-wrap:wrap;gap:6px;pointer-events:none} #mlHud>*{pointer-events:auto}
#mlBody{flex:1 1 48%;overflow-y:auto;background:#0d0f12;border-top:1px solid #8fe4ff66;padding:6px 10px 14px}
#matLab h4{margin:8px 0 3px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#8fe4ff}
.mlr{display:grid;grid-template-columns:38% 1fr 52px;gap:6px;align-items:center;min-height:28px} .mlr input[type=range]{width:100%}
.mlr output{text-align:right;font-variant-numeric:tabular-nums} .mlc{display:flex;gap:6px;align-items:center;margin:3px 0}
.mlc select{flex:1;min-width:0;background:#1a1d22;color:#e8eef8;border:1px solid #445;border-radius:6px;padding:5px}
.mlc .mln{flex:1;min-width:0;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#matLab button.mb{background:#1f2630;color:#e8eef8;border:1px solid #4a5a6a;border-radius:6px;padding:6px 10px;font-size:12px}
#matLab button.mb.on{background:#2b5b73;border-color:#8fe4ff} #mlJson{width:100%;height:120px;box-sizing:border-box;background:#0a0b0d;color:#cfe;border:1px solid #445;font:11px monospace}
</style>
<div id="mlView"><canvas id="mlCanvas"></canvas><div id="mlHud"><button class="mb" id="mlExit">✕ Exit</button><button class="mb" id="mlSpin">Spin</button><button class="mb" id="mlGrade">Grade</button><button class="mb" id="mlLow">Low gfx</button><button class="mb" id="mlRefs">Refs</button><button class="mb" id="mlAO">SSAO</button><button class="mb" id="mlSideB">Swatch</button><button class="mb" id="mlCamR">Game view</button></div></div>
<div id="mlBody">
 <h4>Lighting</h4>
 <div class="mlc"><button class="mb" id="mlAreaP">◀</button><span class="mln" id="mlAreaN"></span><button class="mb" id="mlAreaN2">▶</button></div>
 <div class="mlc"><button class="mb" id="mlLightP">◀</button><span class="mln" id="mlLightN"></span><button class="mb" id="mlLightN2">▶</button></div>
 <div id="mlTP" hidden><div id="mlTPBody"></div><div class="mlc"><button class="mb" id="mlTPReset">3-point defaults</button></div></div>
 <h4>Prop</h4>
 <div class="mlc"><button class="mb" id="mlAssetP">◀</button><select id="mlAsset"></select><button class="mb" id="mlAssetN">▶</button></div>
 <div class="mlc"><span class="mln" id="mlAssetName"></span></div>
 <h4>Material</h4>
 <div class="mlc"><select id="mlMat"></select><button class="mb" id="mlMatReset">Reset</button></div>
 <div class="mlc"><span>Used on</span><button class="mb" id="mlUseP">◀</button><span class="mln" id="mlUseName"></span><button class="mb" id="mlUseN">▶</button></div>
 <div id="mlSliders"></div>
 <h4>Defaults</h4>
 <div class="mlc"><button class="mb" id="mlCopy">Copy JSON</button><button class="mb" id="mlApply">Apply pasted JSON</button><button class="mb" id="mlResetAll">Reset all</button></div>
 <textarea id="mlJson" placeholder="Copy JSON puts every tuned material here (and on the clipboard). Paste a JSON here and Apply to load it."></textarea>
</div>`; document.body.appendChild(d);
  const step=(k,n,len)=>(ML[k]+n+len)%len;
  $('#mlExit').onclick=mlExit;
  $('#mlSpin').onclick=()=>{ ML.spin=!ML.spin; mlButtons(); mlKeep(); };
  $('#mlGrade').onclick=()=>{ ML.grade=!ML.grade; mlLight(); mlButtons(); mlKeep(); };
  $('#mlLow').onclick=()=>{ ML.low=!ML.low; mlLight(); mlButtons(); mlKeep(); };
  $('#mlRefs').onclick=()=>{ ML.refs=!ML.refs; MLS.refs.visible=ML.refs; mlButtons(); mlKeep(); };
  $('#mlAO').onclick=()=>{ XLIT.ssao=!XLIT.ssao; mlButtons(); };
  $('#mlCamR').onclick=()=>{ ML.yaw=.3; ML.pitch=.62; ML.dist=12.5; ML.ty=1; };
  const area=n=>{ ML.area=step('area',n,ML_AREAS().length); mlArea(); }; $('#mlAreaP').onclick=()=>area(-1); $('#mlAreaN2').onclick=()=>area(1);
  const light=n=>{ ML.light=step('light',n,ML_LIGHTS.length); mlLight(); mlNames(); mlKeep(); }; $('#mlLightP').onclick=()=>light(-1); $('#mlLightN2').onclick=()=>light(1);
  $('#mlAssetP').onclick=()=>{ ML.asset--; mlShow(); }; $('#mlAssetN').onclick=()=>{ ML.asset++; mlShow(); };
  $('#mlAsset').onchange=e=>{ ML.asset=+e.target.value; mlShow(); };
  $('#mlMat').onchange=e=>{ ML.mat=e.target.value; mlSliders(); mlUseName(); mlSide(); };
  $('#mlTPReset').onclick=()=>{ Object.assign(ML_TP,ML_TP_DEF); mlTPKeep(); mlTPSliders(); mlLight(); };
  $('#mlUseP').onclick=()=>mlUseStep(-1); $('#mlUseN').onclick=()=>mlUseStep(1);
  $('#mlSideB').onclick=()=>{ ML.side=!ML.side; mlSide(); mlButtons(); mlKeep(); };
  $('#mlMatReset').onclick=()=>{ const def=typeof XPROP_TUNE_DEF!=='undefined'&&XPROP_TUNE_DEF[ML.mat]||{}; XPROP_TUNE[ML.mat]=Object.assign({},XPROP_TUNE_ZERO,def); xPropTuneApply(); xPropTuneSave(); mlSliders(); };
  $('#mlResetAll').onclick=()=>{ if(!confirm('Put every material back to the game\'s defaults?')) return; try{ localStorage.removeItem(XPROP_TUNE_STORE); }catch(e){} xPropTuneLoad(); mlSliders(); };
  $('#mlCopy').onclick=()=>{ const j=xPropTuneJSON(); $('#mlJson').value=j; try{ navigator.clipboard.writeText(j); }catch(e){} $('#mlJson').select(); };
  $('#mlApply').onclick=()=>{ let o; try{ o=JSON.parse($('#mlJson').value); }catch(e){ return alert('That is not valid JSON.'); }
    for(const k of XPROP_MATS) XPROP_TUNE[k]=Object.assign({},XPROP_TUNE_ZERO,(o&&o[k])||{}); xPropTuneApply(); xPropTuneSave(); mlSliders(); };
  // orbit: drag to turn and tilt, wheel or pinch to come closer
  const v=$('#mlView'), P=new Map(); let pd=0;
  v.addEventListener('pointerdown',e=>{ if(e.target.closest('#mlHud')) return; P.set(e.pointerId,{x:e.clientX,y:e.clientY}); v.setPointerCapture(e.pointerId); });
  v.addEventListener('pointermove',e=>{ const p=P.get(e.pointerId); if(!p) return;
    if(P.size===1){ ML.yaw-=(e.clientX-p.x)*.008; ML.pitch=Math.max(.05,Math.min(1.45,ML.pitch+(e.clientY-p.y)*.006)); }
    else { const q=[...P.values()], d0=Math.hypot(q[0].x-q[1].x,q[0].y-q[1].y); p.x=e.clientX; p.y=e.clientY; const q2=[...P.values()], d1=Math.hypot(q2[0].x-q2[1].x,q2[0].y-q2[1].y); if(d0>0) ML.dist=Math.max(3,Math.min(22,ML.dist*d0/d1)); return; }
    p.x=e.clientX; p.y=e.clientY; });
  const up=e=>{ P.delete(e.pointerId); }; v.addEventListener('pointerup',up); v.addEventListener('pointercancel',up);
  v.addEventListener('wheel',e=>{ e.preventDefault(); ML.dist=Math.max(3,Math.min(22,ML.dist*(1+Math.sign(e.deltaY)*.1))); },{passive:false}); }
function mlButtons(){ for(const [id,on] of [['#mlSpin',ML.spin],['#mlGrade',ML.grade],['#mlLow',ML.low],['#mlRefs',ML.refs],['#mlAO',XLIT.ssao],['#mlSideB',ML.side]]) $(id).classList.toggle('on',!!on); }
function mlNames(){ const A=ML_A(); $('#mlAreaN').textContent='Area: '+(A.name||A.id); $('#mlLightN').textContent=ML_LIGHTS[ML.light].name; }
function mlAssetList(){ const s=$('#mlAsset'), list=mlAssets(); let html='', grp=null;
  list.forEach((it,i)=>{ if(it.group!==grp){ if(grp) html+='</optgroup>'; grp=it.group; html+='<optgroup label="'+grp+'">'; } html+='<option value="'+i+'">'+it.name+'</option>'; }); s.innerHTML=html+'</optgroup>'; }
function mlMatList(on){ const s=$('#mlMat'); s.innerHTML='<optgroup label="On this prop">'+on.map(k=>'<option>'+k+'</option>').join('')+'</optgroup><optgroup label="All materials">'+XPROP_MATS.filter(k=>!on.includes(k)).map(k=>'<option>'+k+'</option>').join('')+'</optgroup>'; s.value=ML.mat; }
function mlSliders(){ const box=$('#mlSliders'), t=XPROP_TUNE[ML.mat]; if(!t) return; box.innerHTML='';
  for(const [k,label,lo,hi,st] of ML_SLIDERS){
    if(k[0]==='#'){ const h=document.createElement('h4'); h.textContent=k.slice(1); box.appendChild(h); continue; }
    const row=document.createElement('div'); row.className='mlr';
    if(k==='dnoise'){ row.innerHTML='<label>'+label+'</label><select style="grid-column:2/4">'+XPROP_NOISES.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('')+'</select>';
      const sel=row.querySelector('select'); sel.value=String(t.dnoise|0); sel.onchange=()=>{ t.dnoise=+sel.value; xPropTuneApply(); xPropTuneSave(); }; box.appendChild(row); continue; }
    row.innerHTML='<label>'+label+'</label><input type="range" min="'+lo+'" max="'+hi+'" step="'+st+'" value="'+t[k]+'"><output>'+(+t[k]).toFixed(st<1?2:0)+'</output>';
    const inp=row.querySelector('input'), out=row.querySelector('output');
    inp.oninput=()=>{ t[k]=+inp.value; out.textContent=(+inp.value).toFixed(st<1?2:0); xPropTuneApply(); };
    inp.onchange=()=>xPropTuneSave(); row.querySelector('label').ondblclick=()=>{ t[k]=XPROP_TUNE_ZERO[k]; inp.value=t[k]; out.textContent=(+t[k]).toFixed(st<1?2:0); xPropTuneApply(); xPropTuneSave(); };
    box.appendChild(row); } }
// the area changes the props' stone and the lights: wait for its sheets, then build again
function mlArea(){ const A=ML_A(); if(typeof envArtWant==='function') envArtWant(A.id); mlNames(); mlKeep();
  if(!envArtProps()){ $('#mlAssetName').textContent='Loading the painted materials…'; clearTimeout(mlArea.t); mlArea.t=setTimeout(()=>ML.on&&mlArea(),300); return; }
  mlTurntable(); mlLight(); mlShow(); }

// ---- start, frames, exit ----
function matlabStart(){ mlPanel(); mlStudio(); ML.on=true; $('#matLab').classList.add('on'); mlAssetList(); mlTPSliders(); mlButtons(); MLS.refs.visible=ML.refs; mlArea(); ML.last=performance.now(); requestAnimationFrame(mlFrame); setTimeout(mlIndex,1500); }
function mlFrame(now){ if(!ML.on) return; requestAnimationFrame(mlFrame); const S=MLS, dt=Math.min(.05,(now-ML.last)/1000); ML.last=now; ML.T+=dt;
  const cv=S.r.domElement, w=cv.clientWidth|0, h=cv.clientHeight|0; if(w&&h&&(cv.width!==Math.round(w*S.r.getPixelRatio())||cv.height!==Math.round(h*S.r.getPixelRatio()))){ S.r.setSize(w,h,false); S.cam.aspect=w/h; S.cam.updateProjectionMatrix(); }
  if(ML.spin){ S.spin.rotation.y+=dt*.45; if(S.sideSpin) S.sideSpin.rotation.y+=dt*.45; }
  const tg=new THREE.Vector3(0,ML.ty==null?1:ML.ty,0); S.cam.position.set(tg.x+Math.sin(ML.yaw)*Math.cos(ML.pitch)*ML.dist, tg.y+Math.sin(ML.pitch)*ML.dist, tg.z+Math.cos(ML.yaw)*Math.cos(ML.pitch)*ML.dist); S.cam.lookAt(tg);
  if(S.torch.intensity>0&&ML_LIGHTS[ML.light].id==='torch'){ const FL=XLIT.flick; S.torch.intensity=1.5*XLIT.torch*(.85+FL*(.1*Math.sin(ML.T*11)+.07*Math.sin(ML.T*23.7))); }
  if(ML.refs&&((ML.T*10)|0)%6===0){ S.chrome.visible=false; S.cc.update(S.r,S.scene); S.chrome.visible=true; }   // the chrome ball's reflection, now and then
  xRender(S.G); }
function mlExit(){ ML.on=false; $('#matLab').classList.remove('on'); if(typeof openMenu==='function'&&(!save||save.temp)){ if(save&&save.temp) save=null; openMenu(); } }

$('#lpMats').onclick=()=>{ $('#labPick').classList.remove('on'); matlabStart(); };
