/* Hexmancers - the main menu and the three save slots, from the menu handoff (docs/ui-menu: the two approved
   paintings, SCREEN_FLOW, RESPONSIVE, DATA_BINDING). Built from the handoff's own frame geometry (menuskins.js)
   and colour pixel icons (menuicons.js), its separated art (art/menu/*.webp) and live save data.
     main   save strip (the slot in use: its character, deck, HP, gold, cards, essence) - opens the slots;
            Continue - opens the slots; the run tray (area, deepest, the chosen start depth and its arrows, the
            area's four floors, its element and weakness, Run details, Explore and Battle); Cards / Market /
            Journal / Character, each a small menu of the camp's own destinations; Settings; level and XP
     slots  three cards: an empty one is selected by a tap; a used one shows that run's own character, its deck,
            HP, place and resources and a Continue that loads that slot and goes to its camp (this main menu). Back, and one New
            game (the selected empty slot, or the first empty one; never over a save)
   Everything here calls the game's existing functions (useSlot, openCamp, openNewChar, enterExplore, fight, the
   camp's own buttons); nothing here writes a save. ui.js's openMenu() renders the main menu (hmHome). */
(function(){
const SK=window.HexSkins, IC=window.HexIcons; if(!SK||!IC) return;
const q=s=>document.querySelector(s), esc_=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const url=svg=>'url("data:image/svg+xml,'+encodeURIComponent(svg)+'")';

/* ---------------- skins and icons, once ---------------- */
// every frame is the handoff's HexSkins.skin, drawn at a small size and nine-sliced 8 units in from each side,
// so its 5-unit chamfers and bronze corner pins never stretch
const skinUrl=(tone,state,w,h)=>url(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${SK.skin(w,h,tone,state)}</svg>`);
const R=document.documentElement.style;
for(const t of ['steel','cyan']) for(const st of ['idle','hover','pressed','disabled','focus']) R.setProperty(`--hm-${t}-${st}`,skinUrl(t,st,72,48));
R.setProperty('--hm-panel',skinUrl('steel','idle',96,96)); R.setProperty('--hm-panel-cyan',skinUrl('cyan','idle',96,96));
// the same frames without their ink surface, for menukit.css: its own smoke faces show through
const rimUrl=(tone,w,h)=>url(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${['rim','highlight','keyline','corners'].map(k=>SK.skin(w,h,tone,'idle',k)).join('')}</svg>`);
R.setProperty('--mk-rim',rimUrl('steel',72,48)); R.setProperty('--mk-rim-cyan',rimUrl('cyan',72,48)); R.setProperty('--mk-rim-panel',rimUrl('steel',96,96));
R.setProperty('--hm-gem',url(`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">${SK.diamond(6,6,11)}</svg>`));
// the four elements the handoff has no glyph for, drawn in the same 24-unit colour pixel style
const EXTRA={
  frost:'<path d="M11 1h2v22h-2zM1 11h22v2H1z" fill="#6fd6ff"/><path d="m4 4 16 16M20 4 4 20" stroke="#bfefff" stroke-width="2"/><path d="M9 3l3 3 3-3M9 21l3-3 3 3M3 9l3 3-3 3M21 9l-3 3 3 3" fill="none" stroke="#e6f6ff" stroke-width="1.4"/>',
  storm:'<path d="M14 1 4 14h7l-3 9 12-14h-7l3-8Z" fill="#ffe24d" stroke="#fff6b8" stroke-width=".8"/>',
  light:'<circle cx="12" cy="12" r="5" fill="#fff0b3" stroke="#f5cb60"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4M4 4l3 3m10 10 3 3M20 4l-3 3M7 17l-3 3" stroke="#f5cb60" stroke-width="2"/>',
  shadow:'<path d="M15 2a10 10 0 1 0 7 15A8 8 0 0 1 15 2Z" fill="#e0588f" stroke="#ffb3cf" stroke-width=".8"/>',
  lab:'<path d="M9 2h6v2h-1v5l6 11v2H4v-2l6-11V4H9z" fill="#2a3a44" stroke="#9fe8ff" stroke-width="1.2" stroke-linejoin="round"/><path d="M7 15h10l2.4 5H4.6z" fill="#5fd6a0"/><path d="M10 17h2v2h-2zM14 16h1.5v1.5H14z" fill="#d8ffee"/>',
  verdant:IC.paths.leaf, fire:IC.paths.fire };
const paths=n=>EXTRA[n]||IC.paths[n]||IC.paths.empty;
const iconUrl=n=>url(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${paths(n)}</svg>`);
const ico=(n,cls)=>`<i class="hm-i${cls?' '+cls:''}" style="background-image:${iconUrl(n).replace(/"/g,"'")}"></i>`;
function paintIcons(root){ (root||document).querySelectorAll('.hm-i[data-i]').forEach(i=>{ if(!i.dataset.p){ i.dataset.p=1; i.style.backgroundImage=iconUrl(i.dataset.i); } }); }
paintIcons();

/* ---------------- shared bits ---------------- */
const slotSave=n=>n===SAVE_SLOT?save:loadSave(n);
const deckName=s=>{ const d=s&&s.decks&&s.decks[s.active||0]; return d&&d.name||'Deck'; };
const maxHp=s=>{ let g=0; try{ g=(typeof gearMods==='function'&&gearMods(s).hp)||0; }catch(e){} return Math.round(120+g); };
const essence=s=>(s&&s.mats&&s.mats.essence)||0;
// a run's character, full body, scaled to fit with its hat, staff and feet (never cropped)
function drawChar(cv,s){ const x=cv.getContext('2d'); x.clearRect(0,0,cv.width,cv.height); x.imageSmoothingEnabled=false;
  const look=s&&(s.look||(s.char&&s.char.look)); const sp=look&&typeof lookSprite==='function'?lookSprite(look,'front',s.hat!==false):null;
  const put=()=>{ x.clearRect(0,0,cv.width,cv.height); const im=sp.img, k=Math.min(cv.width/im.width,cv.height/im.height); x.drawImage(im,0,0,im.width,im.height,(cv.width-im.width*k)/2,(cv.height-im.height*k)/2,im.width*k,im.height*k); };
  if(!sp||!sp.img){ cv.classList.add('none'); return; } cv.classList.remove('none');
  if(sp.img.complete===false) sp.img.addEventListener('load',put,{once:true}); else put(); }
const resLine=s=>`<span class="hm-r gold">${ico('coin')}${s.gold|0}</span><span class="hm-r">${ico('cards')}${ownedUnique(s)}</span><span class="hm-r">${ico('crystal')}${essence(s)}</span>`;

/* ---------------- dialogs: a category's destinations, the run's rules ---------------- */
let dlgBack=null;
function openDlg(title,html,from){ q('#hmDlgT').textContent=title; q('#hmDlgB').innerHTML=html; paintIcons(q('#hmDlg')); dlgBack=from||document.activeElement;
  q('#hmDlg').classList.add('on'); const f=q('#hmDlgB button')||q('#hmDlgX'); f.focus(); }
function closeDlg(){ q('#hmDlg').classList.remove('on'); if(dlgBack&&dlgBack.focus) dlgBack.focus(); dlgBack=null; }
q('#hmDlgX').onclick=closeDlg; q('#hmDlg').addEventListener('click',e=>{ if(e.target.id==='hmDlg') closeDlg(); });
// Cards, Market, Journal, Character: the camp's own buttons, so every destination keeps its real handler
const CATS={
  cards:['Cards',[['goBuilder','Deck builder','cards'],['goCollection','My cards','cards']]],
  market:['Market',[['goShop','Shop','market'],['goTrade','Trading post','coin']]],
  journal:['Journal',[['goBounty','Bounty board','journal'],['goBestiary','Bestiary','skull'],['goMastery','Mastery','rune']]],
  character:['Character',[['goChar','Character','character']]],
  lab:['Lab',[['lpMove','Movement lab','map'],['lpFoes','Enemy lab','skull'],['@battle','Battle','battle']]] };
document.querySelectorAll('#scrMenu .hm-cat').forEach(b=>b.onclick=()=>{ const [t,list]=CATS[b.dataset.cat];
  if(list.length===1){ const go=document.getElementById(list[0][0]); if(go) withChar(()=>go.click()); return; }   // one place: go straight there
  openDlg(t,'<div class="hm-list">'+list.map(([id,label,ic])=>`<button class="hm-btn" type="button" data-go="${id}">${ico(ic)}<span>${label}</span>${id==='goChar'&&save&&pointsLeft(ensureChar(save))>0?'<b class="hm-badge">+'+pointsLeft(save.char)+'</b>':''}</button>`).join('')+'</div>',b);
  q('#hmDlgB').querySelectorAll('[data-go]').forEach(x=>x.onclick=()=>{ q('#hmDlg').classList.remove('on'); dlgBack=null; if(x.dataset.go==='@battle') return goPlay('battle'); const go=document.getElementById(x.dataset.go); if(go) withChar(()=>go.click()); }); });
q('#mmDetails').onclick=e=>{ if(!save) return; const A=areaOf(pickDepth);
  let deck=[]; try{ deck=activeDeck().list; }catch(_){}
  openDlg('Run details',`<p class="hm-dl"><b style="color:${A.glow}">${esc_(A.name)}</b> · depth ${pickDepth}${isBossDepth(pickDepth)?' · boss floor':''}</p><p class="hm-dl">${affinityHTML(A,deck)||'No element rules here.'}</p>`,e.currentTarget); };

/* ---------------- the main menu ---------------- */
window.hmHome=function(){ const s=save, has=!!s, d=pickDepth||1, A=areaOf(d), page=q('#scrMenu');
  // the save strip
  drawChar(q('#mmThumb'),s); q('#mmSlotTag').textContent='Slot '+SAVE_SLOT+' ▾';
  q('#mmSave').innerHTML=has?`<span class="hm-name">${esc_(deckName(s))}</span><span class="hm-hp">${maxHp(s)}/${maxHp(s)}</span><span class="hm-sep"></span>${resLine(s)}`:'<span class="hm-name dim">Empty slot</span>';
  q('#mmSlots').setAttribute('aria-label','Slot '+SAVE_SLOT+(has?', '+deckName(s):', empty')+'. Choose save slot');
  // the run tray
  q('#mmArea').textContent=A.name; q('#mmArea').style.color=A.glow; q('#mmDeep').textContent=has?s.deepest:1;
  q('#mmDepthTxt').textContent='Floor '+areaFloor(d)+' / '+DEPTHS_PER_AREA+' · Boss at '+areaBossDepth(d);
  q('#mmDepth').textContent=d;
  q('#mmDown').disabled=!has||d<=1; q('#mmUp').disabled=!has||d>=s.deepest;
  const first=areaBossDepth(d)-DEPTHS_PER_AREA+1;
  q('#mmNodes').innerHTML=Array.from({length:DEPTHS_PER_AREA},(_,i)=>{ const dd=first+i, boss=i===DEPTHS_PER_AREA-1;
    return (i?'<i class="hm-link-l'+(has&&dd<=s.deepest?' on':'')+'"></i>':'')+(boss?ico('skull','hm-node boss'+(dd===d?' cur':'')):`<i class="hm-node${dd===d?' cur':''}${has&&dd<=s.deepest?' open':''}"></i>`); }).join('');
  const k=A.color, W=typeof WEAK_TO!=='undefined'&&WEAK_TO[k];
  q('#mmRules').innerHTML=COLORS[k]?`<span class="hm-r">${ico(k)}<span style="color:${COLORS[k].c}">${COLORS[k].name}</span></span><span class="hm-dot">·</span>`+(W&&COLORS[W]?`<span class="hm-r">${ico(W)}Weak: ${COLORS[W].name}</span>`:''):'';
  q('#mmDetails').disabled=!has;
  let v={ok:false}; try{ v=has?validateDeck(activeDeck().list,CARDS,s.owned):{ok:false}; }catch(e){}
  q('#mmExplore').disabled=!has||!v.ok;
  q('#mmContinue').querySelector('span').textContent=has?'Continue':'New game';
  // an empty slot shows only what works: New game, the slot strip (to pick another save) and Settings
  page.classList.toggle('hm-empty',!has);
  q('#mmWarn').textContent=!has||v.ok?'':'Your deck is not ready ('+(v.errors&&v.errors[0]||'invalid')+'). Fix it in the deck builder.';
  page.querySelectorAll('.hm-cat').forEach(b=>b.disabled=!has); q('#mmDuel').disabled=!has;
  // level, XP and the points waiting to be spent
  const pts=has?pointsLeft(ensureChar(s)):0; q('#mmPts').hidden=!pts; q('#mmPts').textContent='+'+pts;
  if(has){ const need=Math.max(1,xpNeed(s.level||1)), xp=Math.max(0,s.xp||0); q('#mmXpTxt').textContent='Lv '+(s.level||1)+' · '+xp+'/'+need+' XP'; q('#mmXpFill').style.width=Math.min(100,xp/need*100)+'%'; }
  else { q('#mmXpTxt').textContent='Lv 1 · 0 XP'; q('#mmXpFill').style.width='0%'; }
  q('#mmXp').hidden=!has; };
q('#mmDown').onclick=()=>{ pickDepth--; openMenu(); q('#mmDown').disabled?q('#mmUp').focus():q('#mmDown').focus(); };
q('#mmUp').onclick=()=>{ pickDepth++; openMenu(); q('#mmUp').disabled?q('#mmDown').focus():q('#mmUp').focus(); };
// Continue always goes exploring (the save list only when this slot is empty); Battle is the developers' test fight:
// it opens the save list so you pick the character, then fights. A deck that is not ready stays on the menu with its warning.
let SVMODE='explore';
function goPlay(mode){ if(!save) return openSaves();
  withChar(()=>{ if(pickDepth==null) pickDepth=save.deepest||1;
    let ok=false; try{ ok=validateDeck(activeDeck().list,CARDS,save.owned).ok; }catch(e){}
    if(!ok){ openCamp(); return; }
    if(mode==='battle') fight(pickDepth); else enterExplore(pickDepth); }); }
// with no save in this slot the button reads Start and goes straight to making a character for it
q('#mmContinue').onclick=()=>{ SVMODE='explore'; if(save) goPlay('explore'); else openNewChar(); };
q('#mmSlots').onclick=()=>{ SVMODE='explore'; openSaves(); };
q('#mmExplore').onclick=()=>withChar(()=>enterExplore(pickDepth));
q('#mmSettings').onclick=()=>openSettings();
// Duel a friend: the old camp's button, so it keeps its deck check and its way back
q('#mmDuel').onclick=()=>withChar(()=>q('#goDuel').click());

/* ---------------- the three save slots ---------------- */
let SEL=1;
function firstEmpty(){ for(let n=1;n<=SAVE_SLOTS;n++) if(!slotSave(n)) return n; return 0; }
function newTarget(){ return !slotSave(SEL)?SEL:firstEmpty(); }
function openSaves(){ SEL=SAVE_SLOT; renderSaves(); show('scrSaves'); q('#scrSaves .hm-scroll').scrollTop=0;
  const c=q('#svList .hm-card.sel'); const f=c&&(c.querySelector('.hm-go')||c); if(f) f.focus(); }
window.openSaves=openSaves; window.hmDrawChar=drawChar;
function renderSaves(){ const box=q('#svList'); box.innerHTML='';
  for(let n=1;n<=SAVE_SLOTS;n++){ const s=slotSave(n), c=document.createElement('div'); c.className='hm-card'+(n===SEL?' sel':'')+(s?'':' empty');
    c.setAttribute('role','option'); c.tabIndex=0; c.setAttribute('aria-selected',n===SEL?'true':'false');
    if(!s){ c.setAttribute('aria-label','Slot '+n+', empty slot');
      c.innerHTML=`<div class="hm-ava">${ico('empty','hm-emptyi')}</div><div class="hm-cinfo"><b class="hm-ct">Slot ${n}</b><span class="hm-muted">Empty slot</span></div>`; }
    else { const A=areaOf(s.deepest||1);
      c.setAttribute('aria-label','Slot '+n+', '+deckName(s)+', '+A.name+', depth '+s.deepest);
      c.innerHTML=(n===SEL?'<i class="hm-gem tc"></i>':'')+`<div class="hm-ava"><canvas width="96" height="96"></canvas></div>
        <div class="hm-cinfo"><b class="hm-ct">Slot ${n}</b><span class="hm-cn"><span class="hm-name" title="${esc_(deckName(s))}">${esc_(deckName(s))}</span><span class="hm-hp">${maxHp(s)}/${maxHp(s)}</span></span>
        <span class="hm-place" style="color:${A.glow}">${ico('cave')}<span>${esc_(A.name)}</span></span><span class="hm-muted">Depth ${s.deepest} · Lv ${s.level||1}</span><span class="hm-res">${resLine(s)}</span></div>
        <button class="hm-btn hm-cyan hm-go" type="button" aria-label="Continue slot ${n}">${ico('play')}<span>Continue</span></button>`;
      drawChar(c.querySelector('canvas'),s);
      c.querySelector('.hm-go').onclick=e=>{ e.stopPropagation(); if(n!==SAVE_SLOT) useSlot(n); goPlay(SVMODE); }; }
    // one tap does it: a saved slot continues, an empty slot starts a new game in it
    c.onclick=()=>{ if(n!==SAVE_SLOT) useSlot(n); if(s) goPlay(SVMODE); else openNewChar(); };
    c.onkeydown=e=>{ if(e.target!==c) return; if(e.key==='Enter'||e.key===' '){ e.preventDefault(); c.click(); }
      if(e.key==='ArrowDown'||e.key==='ArrowRight'){ e.preventDefault(); const nx=c.nextElementSibling; if(nx) nx.focus(); }
      if(e.key==='ArrowUp'||e.key==='ArrowLeft'){ e.preventDefault(); const pv=c.previousElementSibling; if(pv) pv.focus(); } };
    box.appendChild(c); }
  paintIcons(box);
  const t=newTarget(); q('#svNew').disabled=!t;
  q('#svNew').setAttribute('aria-label',t?'New game in slot '+t:'New game: all save slots are occupied');
  q('#svWhy').textContent=t?'':'All save slots are occupied. Delete one in Settings › Save slots to start a new game.'; }
q('#svBack').onclick=()=>{ SVMODE='explore'; openMenu(); q('#mmContinue').focus(); };
q('#svNew').onclick=()=>{ const t=newTarget(); if(!t||slotSave(t)) return;   // never over a save
  useSlot(t); openNewChar(); };
document.addEventListener('keydown',e=>{ if(e.key!=='Escape') return;
  if(q('#hmDlg').classList.contains('on')){ e.preventDefault(); closeDlg(); return; }
  if(q('#scrSaves').classList.contains('on')&&!document.querySelector('.overlay.on')){ e.preventDefault(); q('#svBack').click(); } });

/* ---------------- Settings › Save slots: the old slot list, for deleting a save ---------------- */
{ const anchor=q('#setXStairs'), row=anchor&&anchor.closest('.srow');
  if(row){ const r=document.createElement('div'); r.className='srow'; r.innerHTML='<span>Save slots<small>Switch to another slot or delete a save (tap twice to delete).</small></span><button id="setSlots" class="btn ghost small">Manage</button>';
    row.parentNode.insertBefore(r,row); q('#setSlots').onclick=()=>openSlots(); } }
})();
