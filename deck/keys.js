/* Hexmancers — keyboard controls. Every action can sit on up to two keys; the choice is saved in
   this browser. Battles and the dungeon map both ask keyAct() what a key does, so changing a
   binding here changes it everywhere. A few presets cover common layouts. Number keys (pick a
   card), Backspace (unqueue) and Enter/Space (start the fight) on the Custom screen stay fixed. */

const KEY_ACTIONS=[
  {id:'up',     name:'Move up',            where:'both'},
  {id:'down',   name:'Move down',          where:'both'},
  {id:'left',   name:'Move left',          where:'both'},
  {id:'right',  name:'Move right',         where:'both'},
  {id:'fire',   name:'Fire wand (hold to charge)', where:'battle'},
  {id:'cast',   name:'Cast next card',     where:'battle'},
  {id:'custom', name:'Open Custom',        where:'battle'},
  {id:'aim',    name:'Cycle lob aim',      where:'battle'},
  {id:'search', name:'Search',             where:'map'},
  {id:'disarm', name:'Disarm',             where:'map'},
  {id:'camp',   name:'Climb to camp',      where:'map'},
];
const KEY_PRESETS={
  standard:{name:'Standard (WASD + arrows)', map:{up:['w','arrowup'],down:['s','arrowdown'],left:['a','arrowleft'],right:['d','arrowright'],fire:[' '],cast:['enter','x'],custom:['c'],aim:['q','tab'],search:['f'],disarm:['e'],camp:['c','<']}},
  arrows:  {name:'Arrows + right hand', map:{up:['arrowup'],down:['arrowdown'],left:['arrowleft'],right:['arrowright'],fire:['z',' '],cast:['x','enter'],custom:['c'],aim:['v','tab'],search:['s'],disarm:['d'],camp:['a']}},
  esdf:    {name:'ESDF (left hand, more keys nearby)', map:{up:['e'],down:['d'],left:['s'],right:['f'],fire:[' '],cast:['r','enter'],custom:['w'],aim:['a','tab'],search:['g'],disarm:['t'],camp:['q']}},
  vim:     {name:'HJKL', map:{up:['k'],down:['j'],left:['h'],right:['l'],fire:[' '],cast:['enter','f'],custom:['c'],aim:['a','tab'],search:['s'],disarm:['d'],camp:['<']}},
};
const KEYS_SAVE='hexmancers-keys';
let KEYMAP=loadKeys();
function loadKeys(){ try{ const v=JSON.parse(localStorage.getItem(KEYS_SAVE)); if(v&&v.map) return v; }catch(e){} return {preset:'standard', map:JSON.parse(JSON.stringify(KEY_PRESETS.standard.map))}; }
function saveKeys(){ try{ localStorage.setItem(KEYS_SAVE,JSON.stringify(KEYMAP)); }catch(e){} keyHints(); }
// what this key does where you are ('battle' or 'map'), or null
function keyAct(k,where){ for(const a of KEY_ACTIONS){ if(a.where!=='both'&&a.where!==where) continue; if((KEYMAP.map[a.id]||[]).includes(k)) return a.id; } return null; }
const keysFor=id=>KEYMAP.map[id]||[];
function keyLabel(k){ if(!k) return '—'; return {' ':'Space','arrowup':'↑','arrowdown':'↓','arrowleft':'←','arrowright':'→','enter':'Enter','tab':'Tab','escape':'Esc','shift':'Shift','control':'Ctrl','alt':'Alt','backspace':'Backspace'}[k]||(k.length===1?k.toUpperCase():k[0].toUpperCase()+k.slice(1)); }
// two actions on one key only clash if both can happen in the same place
function keyClashes(){ const out=new Set();
  for(const a of KEY_ACTIONS) for(const b of KEY_ACTIONS){ if(a===b) continue; const same=a.where==='both'||b.where==='both'||a.where===b.where; if(!same) continue;
    for(const k of keysFor(a.id)) if(keysFor(b.id).includes(k)) out.add(a.id+'|'+k); }
  return out; }

/* ---------------- the settings screen ---------------- */
let keyCapture=null;   // {id, slot} while waiting for a key
function openSettings(){ renderSettings(); const kb=$('#setKbd'); if(kb&&!kb.dataset.init){ kb.dataset.init='1'; kb.open=!matchMedia('(pointer:coarse)').matches; } $('#settings').classList.add('on'); }
function closeSettings(){ keyCapture=null; $('#settings').classList.remove('on'); }
function renderSettings(){
  const clash=keyClashes();
  $('#setPreset').innerHTML=Object.entries(KEY_PRESETS).map(([k,p])=>`<option value="${k}"${KEYMAP.preset===k?' selected':''}>${p.name}</option>`).join('')+`<option value="custom"${KEYMAP.preset==='custom'?' selected':''}>Custom</option>`;
  const group=(title,where)=>`<h3>${title}</h3>`+KEY_ACTIONS.filter(a=>a.where===where).map(a=>`<div class="krow"><span>${a.name}</span>`+
    [0,1].map(s=>{ const k=keysFor(a.id)[s], cap=keyCapture&&keyCapture.id===a.id&&keyCapture.slot===s, bad=k&&clash.has(a.id+'|'+k);
      return `<button class="kbtn${cap?' cap':''}${bad?' bad':''}" data-a="${a.id}" data-s="${s}" title="${bad?'This key also does something else here':'Click, then press a key'}">${cap?'Press a key…':keyLabel(k)}</button>`; }).join('')+`</div>`).join('');
  $('#setKeys').innerHTML=group('Moving (battle and dungeon)','both')+group('Battle','battle')+group('Dungeon','map');
  $('#setClash').textContent=clash.size?'Some keys do two things in the same place (marked red). The first one in the list wins.':'';
  $('#setKeys').querySelectorAll('.kbtn').forEach(b=>b.onclick=()=>{ keyCapture={id:b.dataset.a, slot:+b.dataset.s}; renderSettings(); });
}
$('#setPreset').onchange=e=>{ const v=e.target.value; if(KEY_PRESETS[v]){ KEYMAP={preset:v, map:JSON.parse(JSON.stringify(KEY_PRESETS[v].map))}; saveKeys(); } renderSettings(); };
$('#setReset').onclick=()=>{ KEYMAP={preset:'standard', map:JSON.parse(JSON.stringify(KEY_PRESETS.standard.map))}; saveKeys(); renderSettings(); };
$('#setClose').onclick=closeSettings;
$('#goSettings').onclick=openSettings;

// while the settings screen is open, keys go to it and nowhere else
window.addEventListener('keydown',e=>{
  if(!$('#settings').classList.contains('on')) return;
  const k=e.key.toLowerCase(); e.preventDefault(); e.stopImmediatePropagation();
  if(keyCapture){
    if(k==='escape'){ keyCapture=null; }
    else { const list=keysFor(keyCapture.id).slice(); if(k==='backspace'||k==='delete') list.splice(keyCapture.slot,1); else { list[keyCapture.slot]=k; }
      KEYMAP.map[keyCapture.id]=list.filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i); KEYMAP.preset='custom'; saveKeys(); keyCapture=null; }
    renderSettings(); return;
  }
  if(k==='escape'){ closeSettings(); return; }
  // the tester: what would this key do?
  const b=keyAct(k,'battle'), m=keyAct(k,'map'), nm=id=>(KEY_ACTIONS.find(a=>a.id===id)||{}).name;
  $('#setTest').innerHTML=`<b>${keyLabel(k)}</b> → `+(b||m?[b&&('battle: '+nm(b)),m&&m!==b&&('dungeon: '+nm(m))].filter(Boolean).join(' · '):'nothing');
},true);

// the hints under the battle and dungeon controls follow your bindings
function keyHints(){
  const k=id=>keysFor(id).map(keyLabel).join('/')||'—', mv=k('up')+' '+k('left')+' '+k('down')+' '+k('right');
  const bk=$('#scrBattle .keys'); if(bk) bk.textContent='Tap your side to move, the enemy side to aim lobs · keys: '+mv+' move, '+k('fire')+' fire, '+k('cast')+' cast, '+k('aim')+' aim, '+k('custom')+' custom';
  const mk=$('#xBottom .keys .k'); if(mk) mk.textContent=' · keys: '+mv+' move, '+k('search')+' search, '+k('disarm')+' disarm';
  const lab=(sel,id)=>{ const el=$(sel); if(el) el.textContent=keyLabel(keysFor(id)[0]); };
  lab('#xSearch .k','search'); lab('#xDisarm .k','disarm'); lab('#xCamp .k','camp');
}
keyHints();
