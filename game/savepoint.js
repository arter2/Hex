/* Hexmancers deck prototype — save points.
   From the pause screen you can save the game where you stand on the dungeon map, and load that
   save point later: from the pause screen (on the map or in a fight) or from the defeat screen,
   so a death costs you only what happened since your last save. One save point per save slot.

   A save point holds your save (cards, gold, gear, character, level) and the dungeon run: the
   floor you are on, the floors you have left (they stay as you left them) and the run's keys and
   quests. The 3D scene is not saved; it is rebuilt from the floor, as climbing back to a kept
   floor already does (explore.js). */
(function(root){

const pointKey=n=>slotKey(n||SAVE_SLOT)+'-point';

// Game state to JSON and back, keeping shared objects shared (a floor's props are both in a list
// and in a map by cell) and leaving out the 3D scene, the canvas and any function.
function snapEncode(top){ const ids=new Map(), out=[];
  const skip=v=>v.isObject3D||v.isMaterial||v.isTexture||v.isBufferGeometry||(typeof HTMLElement!=='undefined'&&v instanceof HTMLElement)||(typeof ImageBitmap!=='undefined'&&v instanceof ImageBitmap);
  const enc=v=>{ if(typeof v==='function') return undefined; if(v===null||typeof v!=='object') return typeof v==='number'&&!isFinite(v)?{$n:String(v)}:v;
    if(skip(v)) return undefined; if(ids.has(v)) return {$r:ids.get(v)};
    const id=out.length; ids.set(v,id); out.push(null); let rec;
    if(ArrayBuffer.isView(v)) rec={$t:v.constructor.name, d:Array.from(v)};
    else if(v instanceof Map) rec={$m:[...v].map(([k,x])=>[enc(k),enc(x)])};
    else if(v instanceof Set) rec={$s:[...v].map(enc)};
    else if(Array.isArray(v)) rec={$a:v.map(x=>{ const e=enc(x); return e===undefined?null:e; })};
    else { const o={}; for(const k of Object.keys(v)){ const e=enc(v[k]); if(e!==undefined) o[k]=e; } rec={$o:o}; }
    out[id]=rec; return {$r:id}; };
  return {top:enc(top), out}; }
function snapDecode(data){ const R=data.out;
  const objs=R.map(r=>r.$t?new root[r.$t](r.d):r.$m?new Map():r.$s?new Set():r.$a?[]:{});
  const dec=x=>x&&typeof x==='object'?(x.$r!=null?objs[x.$r]:x.$n!=null?Number(x.$n):x):x;
  R.forEach((r,i)=>{ const o=objs[i];
    if(r.$m) for(const [k,x] of r.$m) o.set(dec(k),dec(x));
    else if(r.$s) for(const x of r.$s) o.add(dec(x));
    else if(r.$a) for(const x of r.$a) o.push(dec(x));
    else if(r.$o) for(const k in r.$o) o[k]=dec(r.$o[k]); });
  return dec(data.top); }

// can you save right now? (only standing on the map, not mid-search, mid-fall or mid-fight)
function canSavePoint(){ if(!save) return 'No game to save.';
  if(!(typeof EX!=='undefined'&&EX)) return 'Save on the dungeon map.';
  if(EX.fighting||(typeof B!=='undefined'&&B)) return 'Save on the map, not in a fight.';
  if(EX.busy) return 'You can’t save right now.';
  if(EX.action||EX.aim) return 'Finish what you are doing first.';
  return ''; }
function savePoint(){ const why=canSavePoint(); if(why) return {ok:false,msg:why};
  const ex=EX, keep={action:ex.action, aim:ex.aim, path:ex.path}; ex.action=null; ex.aim=null; ex.path=[];
  let txt; try{ txt=JSON.stringify({v:1, time:Date.now(), depth:ex.depth, area:areaLabel(ex.depth), level:save.level||1,
    save:JSON.parse(JSON.stringify(save)), run:snapEncode({ex, run:typeof XRUN!=='undefined'?XRUN:null})}); }
  finally{ Object.assign(ex,keep); }
  try{ localStorage.setItem(pointKey(),txt); }catch(e){ return {ok:false,msg:'Not enough storage space to save.'}; }
  return {ok:true,msg:'Game saved at depth '+ex.depth+'.'}; }
function peekPoint(n){ try{ const p=JSON.parse(localStorage.getItem(pointKey(n))||'null'); return p&&p.v===1?p:null; }catch(e){ return null; } }
function clearPoint(n){ try{ localStorage.removeItem(pointKey(n)); }catch(e){} }
// back to the save point: everything since is undone
function loadPoint(){ const p=peekPoint(); if(!p) return false;
  // leave whatever is going on: a fight, the map, any open panel
  ['#pause','#reveal','#custom','#detail','#pick','#xDialog','#lvlUp','#slots'].forEach(k=>{ const el=document.querySelector(k); if(el) el.classList.remove('on'); });
  if(typeof paused!=='undefined') paused=false; B=null;
  if(typeof stopExplore==='function') stopExplore();
  save=migrate(p.save); persist();
  const st=snapDecode(p.run); XRUN=st.run; XPARK=null; EX=st.ex;
  Object.assign(EX,{busy:false, active:true, action:null, aim:null, searchCell:null, path:[], fighting:null, stuckT:0, msgT:{}});
  show('scrExplore'); xInit3D(); xBuildScene(); for(const tr of EX.traps) if(tr.known&&tr.armed) xTrapMesh(tr);
  for(const k in XKEY) XKEY[k]=false;
  xUpdateVis(); xHud(); xLoopStart(); xBanner(EX.depth); xLog('You return to your save point.','good');
  return true; }
const agoText=t=>{ const m=Math.round((Date.now()-t)/60000); return m<1?'just now':m<60?m+' min ago':Math.round(m/60)+' h ago'; };

Object.assign(root,{snapEncode,snapDecode,canSavePoint,savePoint,peekPoint,clearPoint,loadPoint,agoText});
if(typeof module!=='undefined') module.exports={snapEncode,snapDecode};
})(typeof window!=='undefined'?window:globalThis);
