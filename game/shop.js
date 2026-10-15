/* Hexmancers — the camp's shop: Madame Oriel's stall.
   A lit stall at the top (the card merchant from the dungeon, behind her counter, with lanterns),
   and her wares on shelves below, each with its picture and a price tag. Tap a ware to look at it
   and buy it. Two tabs:
     Wares   Packs (a booster and one per family, 3 cards each)
             Today's cards (4 single cards, new each day) and Today's gear (3 pieces, new each day)
             Scrolls
     Sell    spare copies of your cards, for gold (never the copies a saved deck uses)
   Buying a pack opens it: the pack shakes, bursts, and its 3 cards turn over one by one in a
   random order, the rare ones glowing. */

const SHOP_CARD_PRICE={common:40, uncommon:80, rare:170, legendary:420};
const SHOP_SELL_PRICE={common:8, uncommon:20, rare:50, legendary:120};
const SHOP_GEAR_PRICE=g=>g.legendary?950:[120,120,260,480][g.tier||1];
const SHOP_GREET=['The cards remember who owned them. Choose kindly.','Three cards to a pack, and fate picks every one.','Back from the deep? Show me what you found.','A spare card is a sad card. I will give it a home.','New stock at every dawn, little hexmancer.'];
let shopTab='wares', shopTimer=0;

// today, by your own clock: the daily stock is the same all day and changes at midnight
const shopDay=()=>{ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
function shopSeed(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
// today's stock, made once a day from the date (and kept in the save, with what you bought of it)
function shopStock(){ const day=shopDay(); let st=save.shop;
  if(!st||st.day!==day){ const R=caveRng(shopSeed(day+':'+(save.deepest||1))), cards=[], seen=new Set();
    for(let k=0;k<12&&cards.length<4;k++){ const c=rollCard({depth:Math.max(1,save.deepest||1)},R); if(c&&c.rarity!=='hero'&&!seen.has(c.id)){ seen.add(c.id); cards.push(c.id); } }
    const gear=[]; for(let k=0;k<20&&gear.length<3;k++){ const id=rollLoot(Math.max(1,save.deepest||1),R,k===0); if(id&&!id.startsWith('scroll:')&&GEAR[id]&&!gear.includes(id)) gear.push(id); }
    st=save.shop={day,cards,gear,sold:[]}; persist(); }
  return st; }
// copies of a card the saved decks need: those can never be sold
function shopKept(id){ return Math.max(0,...(save.decks||[]).map(d=>(d.list||[]).filter(x=>x===id).length)); }
const shopSpare=id=>Math.max(0,(save.owned[id]||0)-shopKept(id));

/* ---------------- pictures ---------------- */
// a foil pack: crimped top and bottom, its family's colour (a rainbow for the booster), its icon
function packArt(color,W=64){ const H=Math.round(W*1.38), cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  const col=color?COLORS[color].c:null, band=(y,h,c)=>{ x.fillStyle=c; x.fillRect(4,y,W-8,h); };
  if(col){ band(6,H-12,col); x.fillStyle='rgba(0,0,0,.28)'; x.fillRect(4,H*.62,W-8,H*.38-6); }
  else ['#ff6a3d','#f2c94c','#39ff8a','#7fd4ff','#b48cff'].forEach((c,i)=>band(6+i*(H-12)/5,(H-12)/5+1,c));
  x.fillStyle='rgba(255,255,255,.22)'; x.fillRect(W*.18,8,W*.1,H-16);   // the shine
  for(let i=0;i<W-8;i+=4){ x.fillStyle=col||'#d8d4c8'; x.fillRect(4+i,2,3,4); x.fillRect(4+i,H-6,3,4); x.fillStyle='rgba(0,0,0,.35)'; x.fillRect(4+i+3,2,1,4); x.fillRect(4+i+3,H-6,1,4); }
  x.fillStyle='rgba(0,0,0,.55)'; x.fillRect(4,6,W-8,2); x.fillRect(4,H-8,W-8,2);
  x.fillStyle='rgba(8,10,14,.75)'; x.beginPath(); x.arc(W/2,H*.42,W*.24,0,Math.PI*2); x.fill();
  x.font=Math.round(W*.3)+'px system-ui,sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#fff';
  x.fillText(color?COLORS[color].icon:'✦',W/2,H*.43);
  x.font='700 '+Math.round(W*.13)+'px "Pixelify Sans",monospace'; x.fillText(PACK_SIZE+' CARDS',W/2,H*.78);
  return cv; }
// the stall: a striped awning, two lanterns, a counter, and Madame Oriel behind it (her dungeon look)
function shopScene(cv,T){ const W=cv.width, H=cv.height, x=cv.getContext('2d'); x.imageSmoothingEnabled=false;
  x.fillStyle='#0b0d12'; x.fillRect(0,0,W,H);
  for(let i=0;i<W;i+=12){ x.fillStyle=i%24?'#141820':'#11141b'; x.fillRect(i,0,12,H); }   // planks behind
  const sp=typeof lookSprite==='function'&&lookSprite('witch','front',null,'idle'), bob=Math.floor(T*1.6)%2;
  if(sp&&sp.img){ const h=H*1.05; x.drawImage(sp.img,Math.round(W/2-h/2),Math.round(H*.02-bob),h,h); }
  // lantern light pools and the lanterns themselves
  for(const [lx,ph] of [[W*.16,0],[W*.84,1.7]]){ const f=.85+.15*Math.sin(T*7+ph)+.05*Math.sin(T*19+ph*3), g=x.createRadialGradient(lx,H*.42,0,lx,H*.42,H*.62);
    g.addColorStop(0,'rgba(255,190,90,'+(.38*f).toFixed(3)+')'); g.addColorStop(1,'rgba(255,190,90,0)'); x.fillStyle=g; x.fillRect(0,0,W,H);
    x.fillStyle='#2a2620'; x.fillRect(lx-1,H*.16,2,H*.14); x.fillStyle='#3a3228'; x.fillRect(lx-5,H*.3,10,12); x.fillStyle='rgba(255,200,110,'+(.8*f).toFixed(2)+')'; x.fillRect(lx-3,H*.32,6,8); }
  // the awning
  const aw=Math.round(H*.16); for(let i=0;i<W;i+=16){ x.fillStyle=(i/16)%2?'#e8dcc0':'#8a2a3a'; x.fillRect(i,0,16,aw); x.beginPath(); x.moveTo(i,aw); x.lineTo(i+16,aw); x.lineTo(i+8,aw+6); x.closePath(); x.fill(); }
  x.fillStyle='rgba(0,0,0,.35)'; x.fillRect(0,aw,W,2);
  // the counter, with a few wares on it
  const cy=Math.round(H*.7); x.fillStyle='#5a3a22'; x.fillRect(0,cy,W,H-cy); x.fillStyle='#7a4e2c'; x.fillRect(0,cy,W,4); x.fillStyle='#3a2414'; for(let i=8;i<W;i+=22) x.fillRect(i,cy+8,2,H-cy-8);
  const pk=shopScene.packs||(shopScene.packs=['fire','frost','verdant'].map(c=>packArt(c,22)));
  pk.forEach((p,i)=>{ x.drawImage(p,i<2?8+i*24:W-30,cy-p.height+6); });   // a few packs at the counter's ends, clear of her
  if(typeof uiIcon==='function'){}   // (icons are HTML; the counter keeps to canvas art)
}

/* ---------------- the screen ---------------- */
function openShop(){ shopStock(); renderShop(); show('scrShop');
  const cv=$('#shopScene'); clearInterval(shopTimer); const t0=performance.now();
  const tick=()=>{ if(!$('#scrShop').classList.contains('on')){ clearInterval(shopTimer); return; } shopScene(cv,(performance.now()-t0)/1000); };
  tick(); shopTimer=setInterval(tick,120);
  $('#shopSay').textContent=SHOP_GREET[Math.floor(Math.random()*SHOP_GREET.length)]; }
function shopTile(o){ const b=document.createElement('button'); b.className='ware'+(o.sold?' sold':'')+(o.cant?' cant':''); if(o.color) b.style.setProperty('--wc',o.color);
  b.innerHTML=`<span class="wpic"></span><span class="wname">${esc(o.name)}</span><span class="wtag">${o.sold?'Sold':uiIcon('coin',14)+o.price}</span>`;
  const pic=b.querySelector('.wpic'); if(typeof o.pic==='string') pic.innerHTML=o.pic; else if(o.pic) pic.appendChild(o.pic);
  b.onclick=()=>shopSheet(o); return b; }
function shopShelf(title,hint,items){ const s=document.createElement('div'); s.className='shelf';
  s.innerHTML=`<h3>${title}${hint?` <small class="dim">${hint}</small>`:''}</h3><div class="wares"></div>`; const w=s.querySelector('.wares'); items.forEach(o=>w.appendChild(shopTile(o))); return s; }
function renderShop(){ goldText($('#sGold')); const box=$('#shopBody'); box.innerHTML='';
  document.querySelectorAll('#shopTabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===shopTab));
  if(shopTab==='sell') return renderSell(box);
  const st=shopStock(), g=save.gold;
  box.appendChild(shopShelf('Packs',PACK_SIZE+' cards each, any rarity',[
    {kind:'pack',color:null,name:'Booster',price:PACK_PRICE.booster,pic:packArt(null),text:PACK_SIZE+' cards from any family. Each card is rolled on its own: any of them could be rare.'},
    ...FAM_ORDER.map(k=>({kind:'pack',color:k,name:COLORS[k].name,price:PACK_PRICE.family,pic:packArt(k),text:PACK_SIZE+' cards of the '+COLORS[k].name+' family, each rolled on its own.'}))
  ].map(o=>Object.assign(o,{cant:g<o.price,color:o.color?COLORS[o.color].c:null,fam:o.color}))));
  box.appendChild(shopShelf("Today's cards",'new stock at midnight',st.cards.map(id=>{ const c=CARDS[id], sold=st.sold.includes('c:'+id), el=cardEl(c); el.tabIndex=-1;
    return {kind:'card',id,name:c.name,price:SHOP_CARD_PRICE[c.rarity]||80,pic:el,sold,cant:g<(SHOP_CARD_PRICE[c.rarity]||80),color:COLORS[c.color].c,card:c}; })));
  box.appendChild(shopShelf("Today's gear",'',st.gear.map(id=>{ const G=GEAR[id], sold=st.sold.includes('g:'+id), pr=SHOP_GEAR_PRICE(G);
    return {kind:'gear',id,name:G.name,price:pr,pic:lootPic(id,48),sold,cant:g<pr,text:(G.text||'')+(G.text?'. ':'')+(typeof modsText==='function'?modsText(G.mods||{}):'')}; })));
  box.appendChild(shopShelf('Scrolls','use them on the Character screen',Object.keys(SCROLLS).map(k=>{ const sc=SCROLLS[k];
    return {kind:'scroll',id:k,name:sc.name,price:sc.price,pic:lootPic('scroll:'+k,48),cant:g<sc.price,text:sc.text+'. You have '+(gearState(save).scrolls[k]||0)+'.'}; })));
}
// the Sell tab: every card with a spare copy, worth its rarity's price
function renderSell(box){ const ids=Object.keys(save.owned).filter(id=>CARDS[id]&&CARDS[id].rarity!=='hero'&&shopSpare(id)>0)
    .sort((a,b)=>(SHOP_SELL_PRICE[CARDS[b].rarity]||0)-(SHOP_SELL_PRICE[CARDS[a].rarity]||0)||CARDS[a].name.localeCompare(CARDS[b].name));
  const p=document.createElement('p'); p.className='hint'; p.textContent=ids.length?'Spare copies only: the copies your saved decks use stay yours. Tap a card to sell one.':'No spare cards yet: every copy you own is in a saved deck.'; box.appendChild(p);
  if(!ids.length) return;
  box.appendChild(shopShelf('Your spares','',ids.map(id=>{ const c=CARDS[id], el=cardEl(c); el.tabIndex=-1; const pr=SHOP_SELL_PRICE[c.rarity]||5;
    return {kind:'sell',id,name:c.name+' ×'+shopSpare(id),price:pr,pic:el,color:COLORS[c.color].c,card:c}; }))); }

// the sheet that slides up when you tap a ware: a bigger look, what it is, and Buy (or Sell)
function shopSheet(o){ const sh=$('#shopSheet'), body=$('#shopSheetBody'); body.innerHTML='';
  const big=document.createElement('div'); big.className='sbig';
  if(o.kind==='pack') big.appendChild(packArt(o.fam||null,120)); else if(o.card){ const el=cardEl(o.card); el.onclick=()=>showDetail(o.card); big.appendChild(el); } else big.innerHTML=typeof o.pic==='string'?o.pic.replace(/width="48"|height="48"/g,''):'';
  body.appendChild(big);
  const t=document.createElement('div'); t.className='stext';
  const own=o.card?(save.owned[o.card.id]||0):o.kind==='gear'?((gearState(save).items[o.id])||0):null;
  t.innerHTML=`<h2>${esc(o.name)}</h2><p class="hint">${esc(o.text||(o.card?cardText(o.card):''))}</p>`+(own!=null?`<p class="dim">You own ${own}.</p>`:'');
  body.appendChild(t);
  const btn=$('#shopBuy'), sell=o.kind==='sell';
  btn.innerHTML=(o.sold?'Sold out':(sell?'Sell for ':'Buy · ')+uiIcon('coin',18)+o.price); btn.disabled=!!o.sold||(!sell&&save.gold<o.price);
  btn.onclick=()=>{ sh.classList.remove('on'); sell?shopSell(o):shopBuy(o); };
  sh.classList.add('on'); }
function shopBuy(o){ if(save.gold<o.price) return; const st=shopStock(); save.gold-=o.price;
  if(o.kind==='pack'){ const res=addCards(save,openPack(save.deepest,o.fam||null)); persist(); renderShop(); packOpen(o.fam||null,res); return; }
  if(o.kind==='card'){ const res=addCards(save,[CARDS[o.id]]); st.sold.push('c:'+o.id); tip((res[0].isNew?'New: ':'Bought ')+CARDS[o.id].name); }
  if(o.kind==='gear'){ addGear(save,o.id); st.sold.push('g:'+o.id); tip('Bought '+GEAR[o.id].name); }
  if(o.kind==='scroll'){ addScroll(save,o.id); tip(SCROLLS[o.id].name+' bought'); }
  persist(); renderShop(); if(typeof buzz==='function') buzz(15); }
function shopSell(o){ if(shopSpare(o.id)<1) return; save.owned[o.id]--; if(save.owned[o.id]<=0) delete save.owned[o.id]; save.gold+=o.price; persist(); tip('Sold '+CARDS[o.id].name+' for '+o.price+' gold'); renderShop(); }

/* ---------------- the back of a card ----------------
   Pixel art at 50 x 70 art pixels (scaled up hard-edged). The Hex sigil is the back in use; two more looks are kept:
     sigil   deep navy, a gold frame with corner studs, the Hexmancers hex sigil (an eye in a hexagon)
             in the middle and a ring of small runes
     weave   violet, a lattice of fine diamonds, a four-point star in a gold ring
     stars   near-black, scattered stars and a hexagon traced in starlight, a thin silver frame */
const CARD_BACK_STYLES=['sigil','weave','stars'];
const CARD_BACK='sigil';   // the starting back; Arcane weave and Starfield unlock with finished card sets (mastery.js)
const CARD_BACK_ART={};
function cardBackArt(style){ style=style||(typeof save!=='undefined'&&save&&save.back)||CARD_BACK; if(CARD_BACK_ART[style]) return CARD_BACK_ART[style];
  const W=50, H=70, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d'), R=caveRng(style.length*97+13);
  const px=(a,b,c)=>{ x.fillStyle=c; x.fillRect(a,b,1,1); }, rect=(a,b,w,h,c)=>{ x.fillStyle=c; x.fillRect(a,b,w,h); };
  const hex=(cx,cy,r,c,fill)=>{ x.beginPath(); for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; x.lineTo(Math.round(cx+Math.cos(a)*r)+.5,Math.round(cy+Math.sin(a)*r)+.5); } x.closePath(); if(fill){ x.fillStyle=fill; x.fill(); } x.strokeStyle=c; x.lineWidth=1; x.stroke(); };
  if(style==='weave'){ rect(0,0,W,H,'#241238'); for(let j=0;j<H;j++) for(let i=0;i<W;i++) if((i+j)%6===0||(i-j+60)%6===0) px(i,j,'#3a1f5a');
    rect(0,0,W,2,'#0c0614'); rect(0,H-2,W,2,'#0c0614'); rect(0,0,2,H,'#0c0614'); rect(W-2,0,2,H,'#0c0614'); x.strokeStyle='#b48cff'; x.strokeRect(3.5,3.5,W-7,H-7);
    x.fillStyle='#120a1e'; x.beginPath(); x.arc(25,35,12,0,Math.PI*2); x.fill(); x.strokeStyle='#d9b45a'; x.lineWidth=1; x.beginPath(); x.arc(25,35,12.5,0,Math.PI*2); x.stroke();
    for(const [dx,dy,l] of [[0,-1,10],[0,1,10],[-1,0,10],[1,0,10]]) for(let k=0;k<l;k++){ const w=Math.max(0,3-Math.floor(k/3)); for(let q=-w;q<=w;q++) px(25+dx*k+(dy?q:0),35+dy*k+(dx?q:0),k<2?'#fff6d0':'#f2c94c'); } }
  else if(style==='stars'){ rect(0,0,W,H,'#06080e'); for(let n=0;n<70;n++){ const a=R()*W|0, b=R()*H|0, c=R(); px(a,b,c<.1?'#ffffff':c<.4?'#8fa8c8':'#3a4a60'); }
    x.strokeStyle='#c8d4e0'; x.strokeRect(2.5,2.5,W-5,H-5); rect(0,0,W,2,'#000'); rect(0,H-2,W,2,'#000');
    for(let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3, b=a+Math.PI/3; for(let t=0;t<=1;t+=.08) px(Math.round(25+Math.cos(a)*14*(1-t)+Math.cos(b)*14*t),Math.round(35+Math.sin(a)*14*(1-t)+Math.sin(b)*14*t),t<.05?'#ffffff':'#7fd4ff'); }
    px(25,35,'#ffffff'); px(24,35,'#7fd4ff'); px(26,35,'#7fd4ff'); px(25,34,'#7fd4ff'); px(25,36,'#7fd4ff'); }
  else { rect(0,0,W,H,'#0e1830'); for(let j=0;j<H;j+=2) for(let i=(j/2)%2?1:0;i<W;i+=4) px(i,j,'#14213e');
    rect(0,0,W,H,'rgba(0,0,0,0)'); x.strokeStyle='#d9b45a'; x.strokeRect(2.5,2.5,W-5,H-5); x.strokeStyle='#6a4e1a'; x.strokeRect(4.5,4.5,W-9,H-9);
    for(const [a,b] of [[2,2],[W-5,2],[2,H-5],[W-5,H-5]]){ rect(a,b,3,3,'#f2c94c'); px(a+1,b+1,'#fff6d0'); }
    for(let k=0;k<12;k++){ const a=k/12*Math.PI*2, cx=Math.round(25+Math.cos(a)*16), cy=Math.round(35+Math.sin(a)*16); rect(cx,cy,2,2,'#3a5a8a'); if(k%3===0) px(cx,cy,'#8fe4ff'); }
    hex(25,35,11,'#f2c94c','#081022'); hex(25,35,8,'#8a6a2a');
    rect(20,34,11,3,'#f2c94c'); rect(22,33,7,5,'#f2c94c'); rect(24,34,3,3,'#0e1830'); px(25,35,'#8fe4ff'); rect(19,35,1,1,'#f2c94c'); rect(31,35,1,1,'#f2c94c'); }
  return CARD_BACK_ART[style]=cv; }
// a face-down card, as a block element showing the chosen back
function cardBackEl(style){ const d=document.createElement('div'); d.className='cardback'; const im=cardBackArt(style); d.style.backgroundImage='url('+im.toDataURL()+')'; return d; }

/* ---------------- opening a pack ----------------
   The pack shakes, then bursts in a flash; its cards land face down in a fan and turn over one at a
   time in a random order (a rare or better one glows as it turns). Tap to turn the rest at once. */
function packOpen(color,res,onDone){ const ov=$('#packOpen'), stage=$('#poStage'), fan=$('#poFan'), done=$('#poDone'); fan.innerHTML=''; stage.innerHTML=''; done.hidden=true;
  const pk=packArt(color,150); pk.className='popack'; stage.appendChild(pk); ov.classList.add('on'); ov.classList.remove('burst');
  const order=res.map((_,i)=>i).sort(()=>Math.random()-.5), slots=[];
  res.forEach((r,i)=>{ const s=document.createElement('div'); s.className='poslot'; s.style.setProperty('--i',i-(res.length-1)/2);
    const back=cardBackEl(); back.classList.add('poback'); const face=cardEl(r.card,r.isNew?'<span class="badge new">NEW</span>':''); face.classList.add('poface'); face.onclick=e=>{ e.stopPropagation(); showDetail(r.card); };
    if(['rare','legendary','hero'].includes(r.card.rarity)) s.classList.add('shine');
    s.append(back,face); fan.appendChild(s); slots.push(s); });
  // they land face down, wait a beat, then turn over one by one in a random order; tap one to turn it yourself
  let k=0, t=null; const left=()=>order.filter(i=>!slots[i].classList.contains('up'));
  const flip=i=>{ if(slots[i].classList.contains('up')) return; slots[i].classList.add('up'); if(typeof buzz==='function') buzz(8); if(!left().length){ clearTimeout(t); setTimeout(()=>done.hidden=false,350); } };
  const turn=()=>{ const l=left(); if(!l.length) return; flip(l[0]); t=setTimeout(turn,650); };
  slots.forEach((s,i)=>s.addEventListener('click',e=>{ if(!s.classList.contains('up')){ e.stopPropagation(); flip(i); } }));
  setTimeout(()=>{ ov.classList.add('burst'); if(typeof buzz==='function') buzz(30); setTimeout(()=>{ stage.innerHTML=''; t=setTimeout(turn,900); },380); },700);
  ov.onclick=()=>{ if(ov.classList.contains('burst')&&left().length){ clearTimeout(t); left().forEach(flip); } };   // a tap beside the cards turns the rest
  done.onclick=e=>{ e.stopPropagation(); clearTimeout(t); ov.classList.remove('on','burst'); const n=res.filter(r=>r.isNew).length; if(n) tip(n+' new card'+(n>1?'s':'')+' for your collection'); if(onDone) onDone(); }; }
/* A pack found or won (a chest, a boss, a mission): the area's own family more often than not, else a
   booster; its cards go to your collection and it opens at once. Packs are uncommon finds: about 1 rich
   chest in 8, 1 plain chest in 30, 2 boss fights in 5, 1 miniboss in 5 and 1 mission reward in 12. */
function packFor(depth){ const A=areaOf(depth||1); return Math.random()<.6&&COLORS[A.color]?A.color:null; }
const packName=c=>c?COLORS[c].name+' pack':'Booster pack';
function packReward(color,depth,onDone){ const res=addCards(save,openPack(Math.max(depth||1,save.deepest||1),color)); persist(); packOpen(color,res,onDone); return res; }

// the tabs, and closing the sheet by tapping outside it
document.querySelectorAll('#shopTabs button').forEach(b=>b.onclick=()=>{ shopTab=b.dataset.tab; renderShop(); });
$('#shopSheet').addEventListener('pointerdown',e=>{ if(e.target.id==='shopSheet') $('#shopSheet').classList.remove('on'); });
$('#shopSheetClose').onclick=()=>$('#shopSheet').classList.remove('on');
// the Trading post: trading cards with other players is coming
$('#goTrade').onclick=()=>tip('Trading post: trading cards with other players is coming soon.');

