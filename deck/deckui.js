/* Hexmancers — the deck builder: your deck on top (zoom 25/50/75%, Remove All, Auto-build), the
   card library in a drawer below (color tabs with what the deck holds of each, search, filters,
   sorting). Tap a library card to add it: it shows in-deck / max with a minus to take one out.
   Hold any card for a big readable preview, with add, remove and "add to another deck". Select
   mode picks many cards at once: add them all, or start a new deck from them. Opens from the
   camp (Deck) and from the dungeon bag (tap its title); OK goes back where you came from. */
const DK={slot:0, zoom:1, tab:'all', sort:'family', filt:{colors:new Set(), type:'', rarity:'', q:''}, multi:false, sel:new Set(), from:'camp', snap:null, peek:null};
const DK_ZOOM=[50,75,100], DK_SORTS=[['family','Color'],['rank','Rank'],['rarity','Rarity'],['name','Name'],['copies','Copies']];
const dkDeck=()=>save.decks[DK.slot];
const dkCount=(d,id)=>d.list.reduce((a,x)=>a+(x===id),0);
const dkMax=c=>Math.min(copyLimit(c),save.owned[c.id]||0);
function openDeckUI(from){ DK.from=from||'camp'; DK.slot=save.active; DK.multi=false; DK.sel.clear(); DK.snap=JSON.stringify(save.decks);
  if(from==='bag'){ if(typeof closeBag==='function') closeBag(); if(typeof xPause==='function') xPause(true); }
  makeFilters($('#dkFilters'),DK.filt,dkRender,false); $('#dkFilters').querySelector('.chips').hidden=true; $('#dkFilters').querySelector('[data-f="q"]').remove(); $('#dkFilters').hidden=true;
  show('scrDeck'); dkRender(); }
function dkAdd(c,d,quiet){ d=d||dkDeck(); const have=dkCount(d,c.id);
  if(d.list.length>=RULES.max){ if(!quiet) tip('Deck is full ('+RULES.max+')'); return false; }
  if(have>=dkMax(c)){ if(!quiet) tip(c.rarity==='legendary'||c.rarity==='hero'?'1 copy of a '+c.rarity:have>=RULES.copies?'Max '+RULES.copies+' copies':'You own '+(save.owned[c.id]||0)); return false; }
  d.list.push(c.id); return true; }
function dkRemove(c,d){ d=d||dkDeck(); const i=d.list.lastIndexOf(c.id); if(i<0) return false; d.list.splice(i,1); return true; }
function dkChange(){ persist(); dkRender(); }
function dkRender(){ const d=dkDeck(), v=validateDeck(d.list,CARDS,save.owned);
  // header: deck slots (★ is the deck you fight with), name
  const sl=$('#dkSlots'); sl.innerHTML='';
  save.decks.forEach((x,i)=>{ const b=document.createElement('button'); b.className='dkslot'+(i===DK.slot?' on':'')+(i===save.active?' act':''); b.textContent=(i+1)+(i===save.active?'★':''); b.title=x.name; b.onclick=()=>{ DK.slot=i; dkRender(); }; sl.appendChild(b); });
  $('#dkName').value=d.name; $('#dkUse').hidden=DK.slot===save.active;
  $('#dkZoom').textContent=DK_ZOOM[DK.zoom]+'%';
  const cnt=$('#dkCount'); cnt.innerHTML='▤ '+v.count+'/'+RULES.max; cnt.classList.toggle('bad',!v.ok); cnt.title=v.ok?'Ready':v.errors.join(' · ');
  $('#dkErr').textContent=v.ok?'':v.errors[0]||'';
  // soul
  if(typeof soulOf==='function'){ const cur=soulOf(d.list,d); $('#dkSoul').innerHTML=soulsOwned().map(h=>`<option value="${h.id}"${h.id===cur?' selected':''}>${COLORS[h.color].icon} ${esc(h.name.split(',')[0])}</option>`).join(''); }
  // the deck: one tile per card with its copies (×N) and its name, then dashed spots to finish the row
  const box=$('#dkDeck'); box.innerHTML=''; box.className='dkdeck z'+DK.zoom;
  const counts={}; d.list.forEach(id=>counts[id]=(counts[id]||0)+1);
  const ids=Object.keys(counts).filter(id=>CARDS[id]).sort((a,b)=>byFamily(CARDS[a],CARDS[b]));
  for(const id of ids){ const c=CARDS[id], el=document.createElement('button'); el.className='dktile'; el.style.setProperty('--c',COLORS[c.color].c);
    el.innerHTML=`<img src="${artURL(c)}" alt=""><span class="dkn">${esc(c.name)}</span><span class="dkx">×${counts[id]}</span><span class="dkt">${COLORS[c.color].icon}${TYPES[c.type]?TYPES[c.type].icon:''}</span>`;
    el.title=c.name+' ×'+counts[id]+' (tap to take one out)'; dkHold(el,c,()=>{ dkRemove(c); dkChange(); }); box.appendChild(el); }
  const cols=dkCols(), empty=ids.length%cols?cols-ids.length%cols:(ids.length?0:cols);
  for(let i=0;i<empty;i++){ const e=document.createElement('div'); e.className='dkempty'; box.appendChild(e); }
  dkRows();
  // tabs: all, then each color with how many the deck holds
  const tabs=$('#dkTabs'); tabs.innerHTML=''; const by={}; d.list.forEach(id=>{ const c=CARDS[id]; if(c) by[c.color]=(by[c.color]||0)+1; });
  for(const k of ['all',...FAM_ORDER.filter(k=>by[k]||Object.keys(save.owned).some(id=>CARDS[id]&&CARDS[id].color===k))]){
    const b=document.createElement('button'); b.className='dktab'+(DK.tab===k?' on':''); if(k!=='all') b.style.setProperty('--c',COLORS[k].c);
    b.innerHTML=k==='all'?'<span>ALL</span><b>'+d.list.length+'</b>':`<span>${COLORS[k].icon} ${COLORS[k].name.toUpperCase()}</span><b>${by[k]||0}</b>`;
    b.onclick=()=>{ DK.tab=k; dkRender(); }; tabs.appendChild(b); }
  $('#dkSort').textContent='⇅ '+DK_SORTS.find(s=>s[0]===DK.sort)[1];
  $('#dkMulti').classList.toggle('on',DK.multi); $('#dkMulti').textContent=DK.multi?'✓ Selecting':'☐ Select';
  dkLibrary(); dkMultiBar(); }
// card height follows the zoom's column width (aspect-ratio alone collapses inside a scrolling grid)
const dkCols=()=>[6,4,3][DK.zoom];
function dkRows(){ const box=$('#dkDeck'), cols=dkCols(), w=(box.clientWidth-20-(cols-1)*6)/cols; box.style.gridTemplateColumns='repeat('+cols+',1fr)'; if(w>0) box.style.gridAutoRows=Math.round(w*1.05)+'px'; }
addEventListener('resize',()=>{ if($('#scrDeck').classList.contains('on')) dkRows(); });
function dkLibrary(){ const d=dkDeck(), f=DK.filt;
  const items=Object.keys(save.owned).map(id=>CARDS[id]).filter(c=>c&&save.owned[c.id]>0&&(DK.tab==='all'||c.color===DK.tab)&&passes(c,f)).sort(SORTS[DK.sort]);
  paged($('#dkColl'),items,c=>{ const n=dkCount(d,c.id), mx=dkMax(c), el=cardEl(c,
      (n?`<span class="dkfrac"><b>${n}</b><i>/</i><b>${mx}</b></span><span class="dkminus" title="Remove one">−</span>`:'')+`<span class="dkown">${save.owned[c.id]}</span>`+(DK.multi?`<span class="dkcheck">${DK.sel.has(c.id)?'✓':''}</span>`:''));
    if(n) el.classList.add('indeck'); if(n>=mx) el.classList.add('full'); if(DK.multi&&DK.sel.has(c.id)) el.classList.add('dksel');
    const minus=el.querySelector('.dkminus'); if(minus) minus.addEventListener('click',e=>{ e.stopPropagation(); dkRemove(c); dkChange(); });
    dkHold(el,c,()=>{ if(DK.multi){ DK.sel.has(c.id)?DK.sel.delete(c.id):DK.sel.add(c.id); dkRender(); } else if(dkAdd(c)) dkChange(); });
    return el; },120);
}
function dkMultiBar(){ const bar=$('#dkMultiBar'); bar.hidden=!DK.multi; $('#dkOK').hidden=DK.multi; if(!DK.multi) return;
  $('#dkSelN').textContent=DK.sel.size+' selected'; $('#dkSelAdd').disabled=$('#dkSelNew').disabled=!DK.sel.size; }
// tap does the card's action; hold opens the big preview (the tap that ends a hold does nothing)
function dkHold(el,c,tap){ let t=0, held=false, x0=0, y0=0;
  el.addEventListener('pointerdown',e=>{ held=false; x0=e.clientX; y0=e.clientY; clearTimeout(t); t=setTimeout(()=>{ held=true; if(navigator.vibrate) navigator.vibrate(12); dkPeek(c); },380); });
  el.addEventListener('pointermove',e=>{ if(Math.hypot(e.clientX-x0,e.clientY-y0)>10) clearTimeout(t); });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>el.addEventListener(ev,()=>clearTimeout(t)));
  el.addEventListener('click',e=>{ if(held){ held=false; return; } tap(); });
  el.addEventListener('contextmenu',e=>{ e.preventDefault(); clearTimeout(t); dkPeek(c); }); }
// the big preview: read the card, add or remove copies, or add it to another deck
function dkPeek(c){ DK.peek=c; const box=$('#dkpCard'); box.innerHTML=''; box.appendChild(cardEl(c));
  const d=dkDeck(), n=dkCount(d,c.id);
  $('#dkpInfo').textContent=COLORS[c.color].name+' · '+TYPES[c.type].name+' · rank '+c.rank+' · '+RARITY[c.rarity].n+' · you own '+(save.owned[c.id]||0)+' · max '+dkMax(c)+' in a deck';
  $('#dkpN').textContent=n+' in '+d.name; $('#dkpMinus').disabled=!n; $('#dkpPlus').disabled=n>=dkMax(c)||d.list.length>=RULES.max;
  $('#dkpOther').innerHTML=save.decks.map((x,i)=>i===DK.slot?'':`<option value="${i}">${esc(x.name)} (${dkCount(x,c.id)} · ${x.list.length}/${RULES.max})</option>`).join('');
  $('#dkpOtherRow').hidden=save.decks.length<2; $('#dkPeek').classList.add('on'); }
$('#dkpClose').onclick=()=>{ $('#dkPeek').classList.remove('on'); DK.peek=null; };
$('#dkPeek').addEventListener('pointerdown',e=>{ if(e.target.id==='dkPeek') $('#dkpClose').onclick(); });
$('#dkpPlus').onclick=()=>{ if(DK.peek&&dkAdd(DK.peek)){ dkChange(); dkPeek(DK.peek); } };
$('#dkpMinus').onclick=()=>{ if(DK.peek&&dkRemove(DK.peek)){ dkChange(); dkPeek(DK.peek); } };
$('#dkpAddOther').onclick=()=>{ const i=+$('#dkpOther').value, d=save.decks[i]; if(!d||!DK.peek) return; if(dkAdd(DK.peek,d)){ persist(); tip('Added to '+d.name); dkPeek(DK.peek); } };
// toolbar
$('#dkClear').onclick=e=>{ if(!dkDeck().list.length) return; armed(e.currentTarget,'Tap again to empty it',()=>{ dkDeck().list=[]; dkChange(); }); };
$('#dkAuto').onclick=()=>{ const d=dkDeck(); d.list=autoFill(d.list,save.owned); dkChange(); };
$('#dkZo').onclick=()=>{ DK.zoom=Math.max(0,DK.zoom-1); dkRender(); };
$('#dkZi').onclick=()=>{ DK.zoom=Math.min(DK_ZOOM.length-1,DK.zoom+1); dkRender(); };
$('#dkName').oninput=e=>{ dkDeck().name=e.target.value||'Deck '+(DK.slot+1); persist(); };
$('#dkUse').onclick=()=>{ save.active=DK.slot; persist(); dkRender(); tip(dkDeck().name+' is now your deck'); };
$('#dkSoul').onchange=e=>{ dkDeck().soul=e.target.value; persist(); };
$('#dkQ').oninput=e=>{ DK.filt.q=e.target.value; dkLibrary(); };
$('#dkFilt').onclick=()=>{ const f=$('#dkFilters'); f.hidden=!f.hidden; $('#dkFilt').classList.toggle('on',!f.hidden); };
$('#dkSort').onclick=()=>{ const i=DK_SORTS.findIndex(s=>s[0]===DK.sort); DK.sort=DK_SORTS[(i+1)%DK_SORTS.length][0]; dkRender(); };
$('#dkMulti').onclick=()=>{ DK.multi=!DK.multi; DK.sel.clear(); dkRender(); };
$('#dkSelAdd').onclick=()=>{ let n=0; for(const id of DK.sel) if(dkAdd(CARDS[id],null,true)) n++; tip(n+' card'+(n===1?'':'s')+' added'+(n<DK.sel.size?' (the rest were at their limit)':'')); DK.multi=false; DK.sel.clear(); dkChange(); };
$('#dkSelNew').onclick=()=>{ const i=save.decks.findIndex(x=>!x.list.length); if(i<0) return tip('Every deck slot holds a deck. Empty one first (Remove All).');
  const d=save.decks[i]; d.name='New deck '+(i+1); for(const id of DK.sel) dkAdd(CARDS[id],d,true); DK.slot=i; DK.multi=false; DK.sel.clear(); tip('Started '+d.name+' with '+d.list.length+' cards'); dkChange(); };
// leaving: back to the camp, or to the dungeon bag (which needs a deck you can fight with)
function dkLeave(){ if(DK.from==='bag'){ const v=validateDeck(activeDeck().list,CARDS,save.owned); if(!v.ok) return tip('Your active deck is not ready: '+(v.errors[0]||'invalid')+'. Fix it first.');
    show('scrExplore'); if(typeof xBag==='function'&&EX){ EX.busy=false; xBag(); } return; }
  openCamp(); }
$('#dkOK').onclick=dkLeave;
$('#dkBack').onclick=e=>{ const v=validateDeck(activeDeck().list,CARDS,save.owned);
  if(DK.from==='bag'&&!v.ok) return armed(e.currentTarget,'Discard changes?',()=>{ save.decks=JSON.parse(DK.snap); persist(); dkLeave(); });
  dkLeave(); };
