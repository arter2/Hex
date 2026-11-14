/* Hexmancers - the dungeon's painted textures (the art handoff: docs/art-production/painterly-textures.md).
   The painterly masters are packed by tools/build-env-atlas.py into atlas sheets (game/art/environment/atlas/, tile
   rectangles in envartmap.js): one colour sheet and one normal-map sheet per area, and one sheet of small effects.
   The floors, walls and theme floors sample their tile straight from the sheet on the GPU (look.js xAtlasShader: the
   lookup wraps inside the tile, and each tile has a gutter of its own wrapped edge for the filtering and mip levels);
   the effects are cut back out into canvases of their own, as they scroll, tile or draw as sprites.

   The sheets load in the background, an area's ahead of when it is needed: at camp for the depth you start at, near
   the stairs for the area below (nature.js xPrewarmTick), and for the floor being entered. The scene builder is
   synchronous: a tile not loaded yet returns null and the code-painted texture stands in, and once the sheets of the
   area you are in have come in, the scene is built again once with them (envArtArrived). A sheet that fails to load
   leaves the code-painted textures in place for good. */
(function(root){
const BASE='art/environment/atlas/';
const STATE=new Map(), IMG=new Map();   // sheet: 'loading' | 'ok' | 'fail'; the decoded image
let missing=false;
const known=()=>typeof ENVART_MAP!=='undefined'&&ENVART_MAP&&ENVART_MAP.sheets;
function load(sheet){ if(!known()||STATE.has(sheet)) return; const S=ENVART_MAP.sheets[sheet]; if(!S) return;
  STATE.set(sheet,'loading'); const im=new Image(); im.decoding='async';
  im.onload=()=>{ STATE.set(sheet,'ok'); IMG.set(sheet,im); envArtArrived(); };
  im.onerror=()=>{ STATE.set(sheet,'fail'); envArtArrived(); };
  im.src=BASE+S.file; }
// start loading what an area needs (its two sheets and the effects)
function envArtWant(id){ if(!id) return; load('area-'+id); load('area-'+id+'-n'); load('effects'); load('effects-e'); load('mold'); }
function envArtWantDepth(d){ if(typeof areaOf==='function') envArtWant(areaOf(Math.max(1,d|0)).id); }
const ready=s=>STATE.get(s)==='ok';
// a tile's rectangle in the sheet as the GPU sees it (three turns images over: v runs up from the bottom)
function glRect(sheet,key){ const S=ENVART_MAP.sheets[sheet], t=S&&S.tiles[key]; if(!t) return null; const [W,H]=S.size; return [t[0]/W,1-(t[1]+t[3])/H,t[2]/W,t[3]/H]; }
// a tile ready to sample: {atlas, img, rect, n:{img, rect}}, or null (and the build notes it is waiting)
function tile(sheet,key,nkey){ if(!known()) return null;
  if(!ready(sheet)){ if(STATE.get(sheet)!=='fail') missing=true; return null; } const rect=glRect(sheet,key); if(!rect) return null;
  const t={atlas:1, sheet, key, img:IMG.get(sheet), rect, width:ENVART_MAP.tile, height:ENVART_MAP.tile};
  if(nkey){ const ns=sheet+'-n'; if(!ready(ns)){ if(STATE.get(ns)!=='fail'){ missing=true; return null; } }
    else { const nr=glRect(ns,nkey); if(nr) t.n={img:IMG.get(ns), rect:nr}; } }
  return t; }
/* Texture bombing (look.js xBombShader) needs a pattern that repeats on the bombing grid, so a shifted cell still
   meets its neighbours at a joint; the step is in the tile's cells a side (a tile spans 8 floor cells). Measured on the
   painted art (the grout lines' places): the flooded tiles fall on every cell, the Abyss's plain room slabs on every
   other. The rest are painted freehand, laid on a grid that does not fall on the cells (sixths of a tile), or in
   frames and medallions, and are painted only. No quarter turns: the painted light would turn with them. */
const BOMB={'theme-flooded':8, 'theme-bathhouse':2, 'abyss/floor-1':4};
const NO_PAINT=new Set(['theme-library']);   // the library's parquet, exactly as painted
function dress(t,id){ if(!t) return t; const k=t.key.startsWith('theme-')?t.key:id+'/'+t.key; if(!NO_PAINT.has(k)) t.paint=1; if(BOMB[k]){ t.bomb=BOMB[k]; t.bombTurn=0; } return t; }
// the area's floors (passage, room A, room B) and walls (rock, block, rubble), each with its normal map (made from the
// painting by the build: the pack has none for them), or null
function envArtAreaFloors(A){ const id=A&&A.id, s='area-'+id, out=[0,1,2].map(k=>dress(tile(s,'floor-'+k,'floor-'+k),id)); return out.every(Boolean)?out:null; }
function envArtAreaWalls(A){ const id=A&&A.id, s='area-'+id, out=[0,1,2].map(k=>tile(s,'wall-'+k,'wall-'+k)); return out.every(Boolean)?out:null; }
// a room theme's floor and its normal map, in the area it is in (every area's sheet holds the themes it can roll)
function envArtTheme(th,A){ const id=A&&A.id; return dress(tile('area-'+id,'theme-'+th,'theme-'+th),id); }
// the Ember Rifts' medium-rock overlay, laid over their rock walls (explore.js xRockShader)
function envArtOverlay(A){ return A&&A.id==='rifts'?tile('area-rifts','rock-overlay'):null; }
// an effect, cut out of the effects sheet into a canvas of its own (256 x 256), or null
const CUT=new Map();
function envArtFx(name){ if(CUT.has(name)) return CUT.get(name); if(!known()||!ready('effects')){ if(known()&&STATE.get('effects')!=='fail'){ load('effects'); missing=true; } return null; }
  const S=ENVART_MAP.sheets.effects, t=S.tiles[name]; if(!t) return null; const c=document.createElement('canvas'); c.width=t[2]; c.height=t[3];
  c.getContext('2d').drawImage(IMG.get('effects'),t[0],t[1],t[2],t[3],0,0,t[2],t[3]); CUT.set(name,c); return c; }
// an effect's glow mask (the effects-e sheet, in the same place as the effect), cut out the same way, or null
const CUTE=new Map();
function envArtFxGlow(name){ if(CUTE.has(name)) return CUTE.get(name); if(!known()||!ENVART_MAP.sheets['effects-e']||!ready('effects-e')){ if(known()&&STATE.get('effects-e')!=='fail'){ load('effects-e'); missing=true; } return null; }
  const S=ENVART_MAP.sheets['effects-e'], t=S.tiles[name]; if(!t) return null; const c=document.createElement('canvas'); c.width=t[2]; c.height=t[3];
  c.getContext('2d').drawImage(IMG.get('effects-e'),t[0],t[1],t[2],t[3],0,0,t[2],t[3]); CUTE.set(name,c); return c; }
// one GPU texture per sheet, shared by every material that samples it: clamped (the shader wraps inside the tile),
// smooth, mipmapped. The scene's teardown disposes it with the materials; using it again uploads it again.
const TEX=new Map();
function envArtTex(img){ let t=TEX.get(img); if(!t){ t=new THREE.Texture(img); t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping; t.magFilter=THREE.LinearFilter;
    t.minFilter=THREE.LinearMipmapLinearFilter; t.anisotropy=4; t.needsUpdate=true; TEX.set(img,t); } return t; }
// the mold sheet (mold.js): its texture and a tile's rectangle as the GPU sees it, or null while it loads (the build
// notes it is waiting, and is made again once it is in)
function envArtMold(){ if(!known()||!ENVART_MAP.sheets.mold) return null; if(!ready('mold')){ if(STATE.get('mold')!=='fail'){ load('mold'); missing=true; } return null; }
  return {tex:envArtTex(IMG.get('mold')), rect:key=>glRect('mold',key)}; }
// the scene builder asks before and after: did it have to stand a code-painted texture in for one still loading?
function envArtBuildStart(){ missing=false; }
const envArtMissing=()=>missing;
// a sheet came in (or failed): if the scene in front of you stood code-painted textures in for it, build it again
function envArtArrived(){ if(typeof EX==='undefined'||!EX||!EX.artMissing||!EX.active||EX.busy||!EX.area) return; const id=EX.area.id;
  if(['area-'+id,'area-'+id+'-n','effects','effects-e','mold'].some(s=>STATE.get(s)==='loading')) return;
  EX.artMissing=false; if(typeof xBuildScene==='function'){ xBuildScene(); if(typeof xUpdateVis==='function') xUpdateVis(); } }
const api={envArtFxGlow,envArtMold,envArtWant,envArtWantDepth,envArtAreaFloors,envArtAreaWalls,envArtTheme,envArtOverlay,envArtFx,envArtTex,envArtBuildStart,envArtMissing,envArtArrived};
Object.assign(root,api);
envArtWant('hollows');   // where a new game starts
})(typeof globalThis!=='undefined'?globalThis:this);
