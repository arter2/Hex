/* Hexmancers — dungeon floors that stay.
   Seeded: each save has its own world seed (save.worldSeed), and a floor is built with dice seeded by it and the
   depth, so a save always meets the same depth 1, the same depth 2 and so on, and another save meets its own.
   Kept: a floor you have been on is stored in the save slot (localStorage <slot>-floors) as you left it: what you
   have seen, opened, beaten, found and taken. Going back to it, after the stairs, camp or a reload, brings it back
   just so. The floor's 3D scene is not stored; it is rebuilt, as a save point's is (savepoint.js snapEncode).
   Kept floors stay through a fall and a new run: only a new save (a new world seed) or deleting the slot clears them.
   Hidden branches (a Sanctum) are built from the seed but not kept. */
(function(root){
const floorKey=n=>slotKey(n||SAVE_SLOT)+'-floors';
const FLOOR_MAX=16;   // the floors kept per save; the ones left longest ago go first

function worldSeed(){ if(!save) return 0;
  if(!save.worldSeed){ save.worldSeed=1+Math.floor(Math.random()*0x7ffffffe); if(typeof persist==='function') persist(); }
  return save.worldSeed; }
// a whole number from the world seed and a floor's name (FNV-1a)
function seedFor(...parts){ let h=0x811c9dc5; for(const ch of parts.join('|')){ h^=ch.charCodeAt(0); h=Math.imul(h,0x01000193); } return h>>>0||1; }

/* Run fn with this save's dice for a floor: Math.random and the dungeon's own XR (dungeon.js) both seeded, and the
   floor plan's base seed (explore.js genFloor) too; everything after goes back to true chance. */
function xSeeded(depth,opt,fn){ const ws=worldSeed(); if(!ws) return fn(); opt=opt||{};
  const s=seedFor(ws,depth,opt.branch?'branch':'main',opt.route||'',opt.plan&&opt.plan.kind||''), R=caveRng(s);
  const was=Math.random, wasXR=typeof XR!=='undefined'?XR:null;
  Math.random=R; if(wasXR) XR=R; root.XSEED=s;
  try{ return fn(); } finally{ Math.random=was; if(wasXR) XR=wasXR; root.XSEED=null; } }

// the store: {seed, floors:{depth:{t, snap}}}; one for another world seed (an old or replaced save) is dropped
function storeRead(){ let st=null; try{ st=JSON.parse(localStorage.getItem(floorKey())||'null'); }catch(e){}
  return st&&st.seed===worldSeed()&&st.floors?st:{seed:worldSeed(),floors:{}}; }
function storeWrite(st){ const keys=Object.keys(st.floors).sort((a,b)=>st.floors[a].t-st.floors[b].t);
  for(;;){ try{ localStorage.setItem(floorKey(),JSON.stringify(st)); return true; }
    catch(e){ if(keys.length<=1) return false; delete st.floors[keys.shift()]; } } }   // out of room: let the oldest floors go
// the parts of a floor that only matter while you stand on it
// in-flight effects (sparks and puffs, shards, floating numbers) are scene objects: kept, they come back as nulls and
// every frame on the floor would throw
const TRANSIENT=['action','aim','path','fighting','searchCell','wave','dlg','carrying','needInput','give','fx','shards','pops'],
  TRANSIENT_LISTS=['path','fx','shards','pops'];
// what the 3D scene works out again each time it is built (explore.js xBuildScene, look.js xBakeAO): left out
const SCENE=['aoData','aoTex','fog','fogCur','fogTgt','fogTex','wIdx','wms','shown','wCut','wList','gSlot','wGhost','dress','decor','onWall','glows',
  'motes','bats','drips','puddles','lanterns','trimMesh','skirtMesh','corMesh','upMesh','downMesh','runeRing','beam','me','myGlow','pillShaft','pillCap','pillBase','pillCave','veil'];
// a floor without what its scene works out again (a copy; the floor itself is untouched)
function xFloorPlain(ex){ const o=Object.assign({},ex); for(const k of SCENE) delete o[k]; return o; }
function xFloorStore(ex){ if(!save||save.temp||!ex||ex.branch||!worldSeed()) return;
  const o=xFloorPlain(ex); for(const k of TRANSIENT) o[k]=TRANSIENT_LISTS.includes(k)?[]:null;
  let snap; try{ snap=snapEncode(o); }catch(e){ snap=null; }
  if(!snap) return;
  const st=storeRead(); st.floors[ex.depth]={t:Date.now(),snap};
  const keys=Object.keys(st.floors).sort((a,b)=>st.floors[b].t-st.floors[a].t); for(const k of keys.slice(FLOOR_MAX)) delete st.floors[k];
  storeWrite(st); }
// a kept floor, ready to stand on (and in this run's kept floors), or null
function xFloorLoad(depth){ if(!save||save.temp) return null; const st=storeRead(), f=st.floors[depth]; if(!f) return null;
  let ex; try{ ex=snapDecode(f.snap); }catch(e){ return null; }
  if(!ex||!ex.t||ex.depth!==depth) return null;
  Object.assign(ex,{busy:false, active:false, action:null, aim:null, searchCell:null, path:[], fighting:null, stuckT:0, msgT:{}, wave:null,
    fx:[], shards:[], pops:[]});   // floors kept before these were transient hold nulls here
  const m=typeof xFloors==='function'&&xFloors(); if(m) m.set(depth,ex);
  return ex; }
const xFloorKnown=depth=>!!storeRead().floors[depth];
function clearFloors(n){ try{ localStorage.removeItem(floorKey(n)); }catch(e){} }

// the floor you are on is kept every half minute, and when the page is hidden or closed, so a reload loses little
function keepNow(){ if(typeof EX!=='undefined'&&EX&&!EX.branch&&!EX.fighting&&EX.active) xFloorStore(EX); }
setInterval(keepNow,30000);
if(typeof document!=='undefined'){ document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') keepNow(); }); addEventListener('pagehide',keepNow); }

// leaving the map any way (camp, a fall, running from a fight, another slot) keeps the floor as it is
if(typeof root.stopExplore==='function'){ const se=root.stopExplore; root.stopExplore=(...a)=>{ if(typeof EX!=='undefined'&&EX&&!EX.branch) xFloorStore(EX); return se(...a); }; }
// a deleted slot or a new game in it forgets its floors (both clear the save point too)
if(typeof root.clearPoint==='function'){ const cp=root.clearPoint; root.clearPoint=n=>{ cp(n); clearFloors(n); }; }
// a save point brings back its own floors: they replace the kept ones
if(typeof root.loadPoint==='function'){ const lp=root.loadPoint; root.loadPoint=()=>{ const ok=lp(); if(ok&&save){ const st={seed:worldSeed(),floors:{}};
  const m=typeof xFloors==='function'&&xFloors(); if(m) for(const [d,ex] of m){ if(ex&&ex!==EX&&!ex.branch){ try{ st.floors[d]={t:Date.now()-1,snap:snapEncode(ex)}; }catch(e){} } }
  storeWrite(st); keepNow(); } return ok; }; }

Object.assign(root,{xFloorPlain,xSeeded,xFloorStore,xFloorLoad,xFloorKnown,clearFloors,worldSeed});
root.XSEED=null;
})(typeof window!=='undefined'?window:globalThis);
