/* Hexmancers deck prototype — screens, HUD and controls for the collecting loop:
   camp -> fight -> card drops -> deck builder / collection / shop -> camp. */

const $=s=>document.querySelector(s);
let save=loadSave();
const persist=()=>{ if(save&&save.temp) return; writeSave(save); };   // the Movement lab's borrowed hexmancer is never saved
const activeDeck=()=>save.decks[save.active];

function show(id){ $('#tip').classList.remove('on'); if(typeof dragAbort==='function') dragAbort(); document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id)); if(id==='scrBattle') resizeView(); window.scrollTo(0,0);
  if(id==='scrExplore'&&typeof EX!=='undefined'&&EX&&EX.active&&typeof xLoopStart==='function') xLoopStart(); }   // the dungeon's loop stops while another screen covers it
let tipT=0; function tip(msg,ms){ const t=$('#tip'); t.textContent=msg; t.classList.add('on'); clearTimeout(tipT); tipT=setTimeout(()=>t.classList.remove('on'),ms||1400); }
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
// the same HP bar and gold readout everywhere: battle, dungeon, camp, shop, character
function hpMeter(bar,txt,hp,max){ hp=Math.max(0,Math.ceil(hp)); bar.style.width=Math.min(100,hp/max*100)+'%'; txt.textContent='HP '+hp+'/'+max; bar.parentElement.classList.toggle('low',hp/max<=.3); }
function goldText(el,n){ el.innerHTML=uiIcon('coin',20)+'<span>'+(n==null?save.gold:n)+'</span>'; el.classList.add('goldtxt'); }

// Card faces: each family has its own textured face (drawn by uikit.js) in a deep, toned-down
// color with white text, except light's pale marble, which keeps dark ink. acc colors the type line, bd the rim band and rank, tb the text panel.
const CARD_PAL={
  fire:   {face:'#4a1f16', ink:'#fff4ec', acc:'#ffb08a', bd:'#b5452e', tb:'rgba(0,0,0,.34)'},
  frost:  {face:'#173452', ink:'#f0f7ff', acc:'#9fd0ff', bd:'#2f6ea6', tb:'rgba(0,0,0,.32)'},
  storm:  {face:'#4a3c12', ink:'#fff8e2', acc:'#ffd866', bd:'#b48a2a', tb:'rgba(0,0,0,.48)'},
  verdant:{face:'#1c3a24', ink:'#f0fbf2', acc:'#9fdca8', bd:'#2f7448', tb:'rgba(0,0,0,.32)'},
  light:  {face:'#d9d2bc', ink:'#2a2416', acc:'#7a5c1e', bd:'#b8a46a', tb:'rgba(255,255,255,.42)'},
  shadow: {face:'#1e1a1d', ink:'#f2eef0', acc:'#d6b6c6', bd:'#5a4a52', tb:'rgba(0,0,0,.30)'},
  gray:   {face:'#6f7378', ink:'#f4f5f7', acc:'#d6dade', bd:'#9aa0a6', tb:'rgba(0,0,0,.30)'},
  brown:  {face:'#3a2c22', ink:'#fbf2e8', acc:'#e0b080', bd:'#8a6644', tb:'rgba(0,0,0,.34)'},
};
/* Cards (v179): one card for every screen, the 240x434 canvas of cards/contract.json (see card.css). Where each slot
   sits and each colour's ramp come from cards/card-geo.css (tools/card-build.py); this builds the layers and the text.
   Layers, bottom up: the colour's base, its material texture (one of three, fixed per card), the art (and a holo
   foil), the frame with any state glow, then the glyphs and live text. Every functional icon is a shape from
   cards/icons drawn in the card's own colour (a mask), so a Pull is blue on a frost card and orange on a fire one.
   The 'compact' / 'expanded' mode no longer changes the card: a small card simply hides what it can't show (card.css). */
const KIT_COLOR={fire:'red',frost:'blue',storm:'yellow',verdant:'green',light:'white',shadow:'black',gray:'gray',brown:'brown'};
// each colour's three material textures (palettes.json variants)
const KIT_TEX={red:['embers','lava-crust','volcanic-ridges'], blue:['water-ripples','cracked-ice','frost-facets'], yellow:['dune-sand','static-arcs','sandstone'],
  green:['leaves','moss','bark'], brown:['parchment','technical-plans','clay'], gray:['machine-plates','brushed-metal','weld-seams'],
  white:['ashlar-blocks','column-flutes','veined-marble'], black:['grave-stone','bog','dead-roots']};
const KIT_RARITY={common:'rarity-common',uncommon:'rarity-uncommon',rare:'rarity-rare',legendary:'rarity',hero:'rarity-hero'};
const kitKind=c=>c.type==='piece'?c.base:c.type==='instant'?c.as:c.type;
// the stat's icon: what the number is (damage, a wall's or a creature's HP, healing, or a boost)
function kitStatIcon(c){ const r=cardRole(c), k=kitKind(c);
  if(c.upPow||c.tk||c.eqPow) return 'boost';
  if(['summon','machine','sentry','hero'].includes(k)) return 'summon'; if(k==='boon'&&['heal','regen'].includes(c.boon)) return 'heal';
  return r==='attack'?'attack':r==='defense'?'defense':r==='turret'?'turret':'power'; }
// the stat: damage, HP or healing; an enchantment's or a tinker's boost as a percentage
function kitStat(c){ if(c.upPow) return '+'+Math.round(c.upPow*100)+'%'; if(c.tk) return '+'+Math.round(c.tk*100)+'%'; if(c.eqPow) return '+'+Math.round(c.eqPow*100)+'%';
  return c.pow||(c.boon!=='gauge'&&c.amt)||c.hp||c.eqHp||''; }
/* The footer: two facts, by kind of card.
   - an Ace enchantment: the effect it adds (its own icon) and that it goes on the next Ace;
   - a card with uses: its uses, then its keyword (else whom it hits);
   - an attack: whom it hits and how far it reaches (the shape's own rule: a Snipe hits the lowest HP anywhere);
   - anything else: its keyword, how long it lasts, whom it's for, in that order. */
const KIT_KW=[['burn','burn','Burn',v=>v+'s'],['freeze','freeze','Freeze',v=>v+'s'],['stun','stun','Stun',v=>v+'s'],['slow','duration','Slow',v=>v+'s'],
  ['poison','drain','Poison',v=>v],['curse','debuffed','Curse',v=>v+'s'],['drain','drain','Drain',v=>Math.round(v*100)+'%'],['mend','heal','Mend',v=>v],
  ['confuse','status','Confuse',v=>v+'s'],['push','push','Knockback',()=>'Yes'],['pull','pull','Pull',()=>'Yes'],['valor','buffed','Valor',()=>'Yes']];
// whom an attack hits and how far it reaches, by shape (strikes.js STRIKE_SHAPES; the older shapes after)
const KIT_AIM={twin:['First foe','Row + next'], fan:['First foe','Row + diagonals'], spear:['First 2 foes','Your row'], boomerang:['Each foe once','Row + next'],
  gun:['Your row','Follows you'], wave:['Every row','Sweeps ahead'], burst:['First foe','And around it'], chain:['First foe','Jumps twice'],
  ricochet:['Bounces','Off the edges'], snipe:['Lowest HP','Any tile'], shockwave:['Every foe','4 tiles of you'], column:['Aimed line','Every row'],
  mark:['Aimed foe','Blows in 1.5s'], cluster:['Aimed tile','Bomblets'], mine:['Aimed tile','When stepped'],
  line:['First foe','Your row'], all:['Every foe','Anywhere'], row:['Whole row','Your row'], wedge:['Cone','Ahead of you'], zigzag:['First foe','Zigzag'],
  missiles:['Random foes','Anywhere'], diag:['Diagonals','Both ways'], dig:['First foe','Your row']};
// a lobbed attack's reach, by its pattern (cards.js lobPattern)
const KIT_PATTERN={single:'One tile', burst:'And around it', ring:'Ring round it', cross:'+ shape', column:'Its column', row:'Its row'};
const KIT_TARGET={strike:'First foe',lob:'Aimed tile',ward:'Your side',sentry:'Your side',boon:'You',charge:'Aimed tile',
  utility:'Your cards',trap:'Aimed tile',environment:'Enemy side',summon:'Your side',machine:'Your side',hero:'Your side',
  instant:'At once',equip:'A creature',tinker:'A card',ace:'Sidearm',aceup:'Sidearm',claim:'Enemy front'};
function kitFooter(c){ const kind=kitKind(c), kw=KIT_KW.filter(k=>c[k[0]]).map(([k,ic,lab,f])=>[ic,lab,f(c[k])]);
  const aim=KIT_AIM[c.shape]||(kind==='lob'||c.shot==='lob'?['Aimed tile',KIT_PATTERN[lobPattern(c)]]:null);
  const tgt=['target','Target',aim?aim[0]:KIT_TARGET[kind]||(TYPES[c.type]||{}).name||'—'], rng=['range','Range',aim&&aim[1]||'—'];
  if(kind==='aceup'){ const shape=c.upShape&&{row:'Whole row',all:'Every enemy',nova:'Around target',twin:'Twice'}[c.upShape];
    return [kw[0]&&!shape?[kw[0][0],'Effect',kw[0][1]]:['boost','Effect',shape||'+'+Math.round(c.upPow*100)+'%'],['applies','Applies','Next Ace']]; }
  if(c.uses) return [['uses','Uses',c.uses],kw[0]||tgt];
  if(cardRole(c)==='attack') return [tgt,aim?rng:kw[0]||rng];
  const out=[...kw];
  if(c.turns&&['summon','machine','sentry','hero','ward','trap','environment'].includes(kind)) out.push(['duration','Lasts',Math.round(c.turns*10)+'s']);
  if(c.dur) out.push(['duration','Lasts',c.dur+'s']);
  out.push(tgt,rng); return out.slice(0,2); }
// where a square picture's subject sits, when the wide art window crops it (x% y%); the middle otherwise
const ART_FOCUS={ember_dart:'50% 30%'};
// Each painterly card has a thumbnail, a medium crop and a full-detail crop. Batch measurements so
// collection rendering does not repeatedly force layout, and do not retain removed image elements.
const kitIcon=(cls,n,label)=>`<svg class="k-ic ${cls}" viewBox="0 0 32 32" shape-rendering="crispEdges"${label?` role="img" aria-label="${esc(label)}"`:' aria-hidden="true"'}>${KIT_ICONS[n]||''}</svg>`;
// a card-kit file under cards/ as a CSS url() (the packed release build points this at its packed copy)
const kitURL=p=>'url(cards/'+p+')';
// a card's frame colour (cards/palettes.json) and its one of three material textures, picked by its id
function cardKit(c){ const kc=KIT_COLOR[c.color]||'gray', t=KIT_TEX[kc][[...String(c.id)].reduce((h,ch)=>(h*31+ch.charCodeAt(0))>>>0,0)%3];
  return {kc, tex:kitURL('textures/card/'+kc+'-'+t+'.svg')}; }
function cardEl(c,extra,locked,mode,opts={}){
  const el=document.createElement('button'), col=COLORS[c.color], {kc,tex:texURL}=cardKit(c), big=mode==='expanded';
  el.className='card kit c-'+kc+(big?' expanded':' compact')+(c.rarity==='legendary'?' leg':'')+(c.rarity==='hero'?' hero':'')+(locked?' locked':'')+(c.mastery?' mcard':'');
  el.style.setProperty('--c',col.c);
  el.style.setProperty('--k-tex',texURL); el.style.setProperty('--k-frame',kitURL('frames/card/'+kc+'.svg'));
  if(ART_FOCUS[c.id]) el.style.setProperty('--k-focus',ART_FOCUS[c.id]);
  // holo: a legendary you own a holo copy of (or one passed in as holo); the moving foil only on the big card
  const holo=!locked&&c.rarity==='legendary'&&(opts.holo||typeof holoCount==='function'&&holoCount(save,c.id)>0);
  if(holo){ const mv=big&&!(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches)?'-animated':'';
    el.classList.add('holo'); el.style.setProperty('--k-foil',[kitURL('effects/expanded/foil-glints'+mv+'.svg'),kitURL('effects/expanded/foil-shimmer'+mv+'.svg'),kitURL('effects/expanded/foil-etch.svg'),kitURL('foils/expanded/'+kc+'/art'+mv+'.svg')].join(','));
    el.style.setProperty('--k-trim',kitURL('foils/card/'+kc+'/trim'+mv+'.svg')); }
  const T=TYPES[c.type]||{name:''}, R=ROLES[cardRole(c)], stat=locked?'':kitStat(c), name=locked?'???':c.name, hero=c.rarity==='hero';
  const rules=locked?'Not found yet.':cardText(c), foot=locked?[['target','Target','—'],['range','Range','—']]:kitFooter(c);
  el.dataset.kname=name; el.dataset.ktype=T.name+'|'+R.name; el.dataset.kstat=stat;
  let h='<i class="k-tex"></i>'+(holo?'<i class="k-foil"></i>':'')
    +`<img class="k-el" src="cards/icons/element-${kc}${kc==='white'?'-ink':''}.svg" alt="${esc(col.name||'')}" draggable="false">`
    +(hero?kitIcon('k-hero','hero-star','Hero'):c.code&&!locked?`<b class="k-rune${c.code===WILD?' wild':''}" title="Rune ${c.code}"><span>${c.code}</span></b>`:'')
    +`<b class="k-rank" title="Rank ${c.rank}"><span>${c.rank}</span></b>`
    +`<b class="k-name"><span>${esc(name)}</span></b>`
    +(locked?'<span class="k-art k-hidden"></span>':(spr=>spr?`<span class="k-art illustrated atlas" style="${spr}"></span>`:`<img class="k-art${typeof cardIllustration==='function'&&cardIllustration(c)?' illustrated':''}" src="${artURL(c)}" alt="" draggable="false">`)(typeof cardArtSprite==='function'&&cardArtSprite(c,big?'full':'thumb')))
    +`<span class="k-tline"><span><i class="k-type">${esc(T.name)}</i><i class="k-dot">·</i><i class="k-cat">${esc(R.name)}</i></span></span>`
    +(locked?'':kitIcon('k-sicon',kitStatIcon(c))+`<b class="k-stat"><span>${stat}</span></b>`)
    +kitIcon('k-rar r-'+c.rarity,KIT_RARITY[c.rarity]||'rarity',(RARITY[c.rarity]||{}).n)
    +`<div class="k-rules" title="${esc(rules)}">${esc(rules)}</div>`;
  foot.forEach(([ic,lab,val],k)=>{ h+=`<span class="k-foot k-f${k}" title="${esc(lab+': '+val)}">${kitIcon('',ic)}<small>${esc(lab)}:</small><span>${esc(String(val))}</span></span>`; });
  el.innerHTML=h;
  if(extra) el.insertAdjacentHTML('beforeend',extra);
  // a plain count badge (×2, 1/3, Lv 6) goes in the count plaque
  el.querySelectorAll(':scope>.badge:not(.new):not(.inst):not(.tink),:scope>.dkfrac,:scope>.dkown').forEach(b=>{ b.classList.add('k-count'); if(!b.firstElementChild) b.innerHTML='<span>'+b.innerHTML+'</span>'; });
  kitFit(el);
  return el;
}
/* Fitting, in canvas units, so it holds at any card size: each text's width is measured with the card's own font
   (a canvas, once the fonts are in) and its size steps down until it fits its slot less 2 units each side. Sizes start
   at the contract's (KIT_GEO, cards/card-geo.js):
   - name: one line, stepping 29 > 26 > 23 > 20 > 18; a name too long for that takes two centred lines at 15 on 14;
   - type line: type · role, whole, 16 down to 10;
   - rules: 18 on 16.5 (3 lines), 16 on 14.5 (4), 14 on 12 (5); longer still, the box scrolls on a big card (a fade
     at its foot), and the full text is in its title either way;
   - footer value: 14 down to 10; count: 22 down to 14.
   The faces' vertical ink centring (--ink-dy) is measured here too, once per face. */
const KIT_FIT={canvas:null, ready:false};
function kitMeasure(text,px,face){ const cv=KIT_FIT.canvas||(KIT_FIT.canvas=document.createElement('canvas')), x=cv.getContext('2d');
  x.font=px+'px "'+(face||'Hex Card')+'"'; return x.measureText(text).width; }
function kitLines(text,px,width){ let n=1, line=0; const sp=kitMeasure(' ',px);
  for(const w of String(text).split(/\s+/)){ const ww=kitMeasure(w,px); if(line&&line+sp+ww>width){ n++; line=ww; } else line+=(line?sp:0)+ww; } return n; }
function kitInk(face){ const cv=KIT_FIT.canvas||(KIT_FIT.canvas=document.createElement('canvas')), x=cv.getContext('2d'); x.font='100px "'+face+'"';
  const m=x.measureText('BFEIW127+%'), A=m.fontBoundingBoxAscent, D=m.fontBoundingBoxDescent;
  return A==null?0:((D-A)+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent))/2/100; }
function kitFit(el){ if(!el||!el.dataset||el.dataset.kname==null){ if(el&&el.querySelectorAll) el.querySelectorAll('.card.kit').forEach(kitFit); return; }
  if(!KIT_FIT.ready&&!(document.fonts&&document.fonts.check('12px "Hex Card"')&&document.fonts.check('12px "Hex Card Caps"'))) return;
  if(!KIT_FIT.ready){ KIT_FIT.ready=true; const r=document.documentElement.style; r.setProperty('--ink-dy',kitInk('Hex Card').toFixed(3)); r.setProperty('--ink-dy-caps',kitInk('Hex Card Caps').toFixed(3)); }
  const G=KIT_GEO, pad=2*G.w.pad, set=(e,k,v)=>e.style.setProperty(k,'calc('+v+' * var(--u))'), steps=(a,b,d)=>{ const o=[]; for(let s=a;s>=b;s-=d) o.push(s); return o; };
  const name=el.dataset.kname, nm=el.querySelector('.k-name'), ns=[29,26,23,20,18].find(s=>kitMeasure(name,s)<=G.w.name-pad);
  nm.classList.toggle('two',!ns); set(el,'--nfs',ns||15); if(!ns) set(el,'--nlh',14);
  const [ty,ro]=el.dataset.ktype.split('|'), tw=s=>kitMeasure((ty+ro).toUpperCase(),s,'Hex Card Caps')+14;   // + the drawn dot and its gaps
  set(el,'--tfs',steps(G.type.type[0],10,1).find(s=>tw(s)<=G.w.type-pad)||10);
  const rb=el.querySelector('.k-rules'), rt=rb.textContent, fit=[[18,16.5],[16,14.5],[14,12]].find(([s,l])=>kitLines(rt,s,G.w.rules)*l<=G.w.rulesH)||[14,12];
  set(el,'--rfs',fit[0]); set(el,'--rlh',fit[1]); rb.classList.toggle('scroll',kitLines(rt,fit[0],G.w.rules)*fit[1]>G.w.rulesH);
  el.querySelectorAll('.k-foot>span').forEach(v=>set(v,'--vfs',steps(G.type.footer[0],10,1).find(s=>kitMeasure(v.textContent,s)<=G.w.foot)||10));
  el.querySelectorAll('.k-count').forEach(b=>set(b,'--cfs',steps(G.type.count[0],14,1).find(s=>kitMeasure(b.textContent,s)<=G.w.count-pad)||14));
  // short glyph runs (rune, rank, count) centre on their own painted ink, measured for the string itself
  el.querySelectorAll(':scope>:is(.k-rune,.k-rank,.k-count)>span').forEach(sp=>{ const o=kitInkOf(sp.textContent); sp.style.transform='translate('+o[0].toFixed(3)+'em,'+o[1].toFixed(3)+'em)'; }); }
// how far (in em) to move a run so its ink's middle sits where its font box's middle is: [dx, dy]
function kitInkOf(text){ const x=(KIT_FIT.canvas||(KIT_FIT.canvas=document.createElement('canvas'))).getContext('2d'); x.font='100px "Hex Card"';
  const m=x.measureText(text); if(m.fontBoundingBoxAscent==null) return [0,0];
  return [(m.width/2-(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2)/100,
    ((m.fontBoundingBoxDescent-m.fontBoundingBoxAscent)+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent))/2/100]; }
// once the card fonts are in, fit every card already drawn
if(document.fonts) document.fonts.load('12px "Hex Card"').then(()=>document.fonts.load('12px "Hex Card Caps"')).then(()=>kitFit(document)).catch(()=>{});

function showDetail(c){
  const box=$('#dtCard'); box.innerHTML=''; box.appendChild(cardEl(c,'',!c.recipe&&!save.seen[c.id],'expanded'));
  if(c.recipe){ const r=RECIPES.find(x=>x.id===c.id); $('#dtInfo').textContent='Recipe: '+r.cards.map(id=>CARDS[id].name).join(' + ')+'. Queue these together and they fuse into this card.'; $('#detail').classList.add('on'); cardPopWire($('#detail'),$('#dtCard'),()=>$('#detail').classList.remove('on')); return; }
  const inDeck=activeDeck().list.filter(id=>id===c.id).length;
  $('#dtInfo').textContent=save.seen[c.id]?COLORS[c.color].name+' · '+TYPES[c.type].name+' · rank '+c.rank+' · '+RARITY[c.rarity].n+' · owned '+(save.owned[c.id]||0)+' · in deck '+inDeck
    :'Not found yet. '+RARITY[c.rarity].n+' '+COLORS[c.color].name+' '+TYPES[c.type].name+'.';
  { const found=RECIPES.filter(r=>recipeKnown(r)&&r.cards.includes(c.id)); if(found.length) $('#dtInfo').textContent+=' · ⚗ Part of: '+found.map(r=>r.name).join(', '); }
  if(c.uses&&save.owned[c.id]) $('#dtInfo').textContent+=' · uses left per copy: '+Array.from({length:save.owned[c.id]},(_,k)=>chargeLeft(save,c.id,k)+'/'+c.uses).join(', ');
  { const v=typeof cardArtVariants==='function'&&cardArtVariants(c); if(v&&save.seen[c.id]){   // the 512 master is in the repo copy only: the link shows once it loads
    const probe=new Image(); probe.onload=()=>{ if(!$('#detail').classList.contains('on')) return; const a=document.createElement('a');a.href=v.master;a.target='_blank';a.rel='noopener';a.textContent='View full artwork';a.style.cssText='display:block;margin-top:8px;color:inherit';$('#dtInfo').append(a); }; probe.src=v.master; } }
  dtShards(c);
  $('#detail').classList.add('on'); cardPopWire($('#detail'),$('#dtCard'),()=>$('#detail').classList.remove('on'));
}
// Break and Craft on the card detail: shards come from spare copies only, so a deck never loses a card
function dtShards(c){ const box=$('#dtShard'); box.innerHTML=''; const sh=shardOf(c); box.hidden=!sh||!save.seen[c.id]; if(box.hidden) return;
  const have=save.shards||0, spare=spareCopies(save,c.id), own=save.owned[c.id]||0;
  box.innerHTML=`<p class="shardline">${uiIcon('shard',18)}<b>${have}</b> shards · ${spare} spare</p>`;
  const row=document.createElement('div'); row.className='row'; box.appendChild(row);
  const b1=document.createElement('button'); b1.id='dtBreak'; b1.className='btn ghost'; b1.textContent='Break for '+sh[0];
  b1.disabled=!canBreak(save,c); b1.title=spare?'':own?'Every copy is in a deck':'You have none';
  b1.onclick=e=>armed(e.currentTarget,'Tap again to break',()=>{ const n=breakCard(save,c.id); if(!n) return; persist(); tip('+'+n+' shards'); showDetail(c); dtRefresh(); });
  const b2=document.createElement('button'); b2.id='dtCraft'; b2.className='btn'; b2.textContent='Craft for '+sh[1];
  b2.disabled=!canCraft(save,c); if(!craftRoom(save,c)) b2.title='You have the most a deck can use';
  b2.onclick=()=>{ const r=craftCard(save,c.id); if(!r) return; persist(); tip((r.isNew?'New: ':'Crafted ')+c.name); if(typeof cardPop==='function') cardPop(c); showDetail(c); dtRefresh(); };
  row.append(b1,b2); }
function dtRefresh(){ const on=id=>{ const el=document.getElementById(id); return el&&el.classList.contains('on'); };
  if(on('scrCollection')) renderCollection(); if(on('scrBuilder')&&typeof renderBuilder==='function') renderBuilder(); if(on('scrCamp')&&typeof openCamp==='function') openCamp(); }
$('#dtClose').onclick=()=>$('#detail').classList.remove('on');
// Hold a card to pop it up big. It stays up after you let go, its rules text scrolls with a finger or the
// wheel, and a double-tap on it, a tap outside it, the ✕ beside it or Escape puts it away. The same three
// ways close the card detail and the deck builder's card (cardPopWire). Right-click still opens the detail.
let pressT=0, pressed=false;
function cardPopWire(over,card,close){
  // ✕ floating at the card's top-right corner
  const face=card.querySelector('.card')||card;
  let x=face.querySelector(':scope>.popx'); if(!x){ x=document.createElement('button'); x.className='popx'; x.type='button'; x.setAttribute('aria-label','Close'); x.textContent='✕'; face.appendChild(x); }
  x.onclick=e=>{ e.stopPropagation(); close(); };
  // a double-tap on the card: two quick taps that both started on it (the release that ends the hold doesn't count)
  let down=null, last=0;
  card.onpointerdown=e=>{ down={x:e.clientX,y:e.clientY,t:performance.now()}; };
  card.onpointerup=e=>{ if(!down||e.target.closest('.popx')) return; const d=down; down=null;
    if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>10||performance.now()-d.t>350){ last=0; return; }
    const t=performance.now(); if(t-last<330){ last=0; close(); } else last=t; };
  card.ondblclick=e=>{ e.preventDefault(); close(); };   // a mouse's double-click
  // a tap outside: on the dim backdrop itself
  over.onclick=e=>{ if(e.target===over) close(); };
  kitRulesMore(card);
}
// a fade at the bottom of a rules box that has more to read, gone once you've scrolled to the end
function kitRulesMore(root){ root.querySelectorAll('.k-rules').forEach(r=>{
  const upd=()=>r.classList.toggle('more',r.scrollHeight-r.clientHeight-r.scrollTop>2);
  r.onscroll=upd; requestAnimationFrame(upd); }); }
function peek(c,on){ const box=$('#peek');
  if(!on){ box.classList.remove('on'); box.innerHTML=''; return; }
  box.innerHTML=''; const wrap=document.createElement('div'); wrap.className='popcard';
  const el=cardEl(c,'',!c.recipe&&!save.seen[c.id],'expanded'); el.classList.add('big'); wrap.appendChild(el); box.appendChild(wrap);
  if(save.seen[c.id]){ const n=document.createElement('p'); n.className='peekinfo'; n.textContent=COLORS[c.color].name+' · '+TYPES[c.type].name+' · rank '+c.rank+' · '+RARITY[c.rarity].n+' · owned '+(save.owned[c.id]||0); box.appendChild(n); }
  cardPopWire(box,wrap,()=>peek(null,false));
  box.classList.add('on'); }
function longPress(el,c){
  let x0=0, y0=0;
  el.addEventListener('pointerdown',e=>{ pressed=false; x0=e.clientX; y0=e.clientY; clearTimeout(pressT); pressT=setTimeout(()=>{ pressed=true; peek(c,true); if(navigator.vibrate) navigator.vibrate(12); },320); });
  el.addEventListener('pointermove',e=>{ if(!pressed&&Math.hypot(e.clientX-x0,e.clientY-y0)>10) clearTimeout(pressT); });
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>el.addEventListener(ev,()=>clearTimeout(pressT)));
  el.addEventListener('pointerleave',()=>{ if(!pressed) clearTimeout(pressT); });
  el.addEventListener('contextmenu',e=>{ e.preventDefault(); if(!pressed) showDetail(c); });
}
addEventListener('keydown',e=>{ if(e.key!=='Escape') return; const pk=$('#peek'); if(pk.classList.contains('on')){ peek(null,false); e.stopPropagation(); } },true);

function reveal(title,body,results,buttons,extras){
  $('#rvTitle').textContent=title; $('#rvBody').textContent=body;
  const g=$('#rvCards'); g.innerHTML='';
  (extras||[]).forEach((x,i)=>{ const el=document.createElement('div'); el.className='reward flip'; el.style.animationDelay=(i*.12)+'s'; el.innerHTML=`<b>${x.pic||x.icon}</b><span>${esc(x.name)}</span><small>${esc(x.text)}</small>`; g.appendChild(el); });
  results.forEach((r,i)=>{ const el=cardEl(r.card,r.isNew?'<span class="badge new">NEW</span>':'',false,'compact',{holo:r.holo}); el.style.animationDelay=(i*.12)+'s'; el.classList.add('flip'); el.onclick=()=>showDetail(r.card); g.appendChild(el); });
  const bb=$('#rvBtns'); bb.innerHTML=''; bb.classList.toggle('two',buttons.length>1);
  // a lone button is always the main one
  buttons.forEach(([label,fn,ghost])=>{ const b=document.createElement('button'); b.className='btn'+(ghost&&buttons.length>1?' ghost':''); b.textContent=label; b.onclick=()=>{ $('#reveal').classList.remove('on'); fn(); }; bb.appendChild(b); });
  $('#reveal').classList.add('on');
  const main=bb.querySelector('.btn:not(.ghost)')||bb.querySelector('.btn'); if(main) setTimeout(()=>main.focus(),50);
}

/* ---------------- new game: your hexmancer ----------------
   Every new game starts by making a character: a race (its baseline stats) and a body (man or
   woman, which picks the look), then 12 points spread over eight stats with horizontal dials.
   The deck pick comes next, and the character goes into the new save (chars.js). */
let ccChar=null;
// mode 'existing': a save from before characters makes one now, keeping its cards, gold, gear and level;
// then goes on to what the player chose (next)
let ccMode=null, ccNext=null;
const needsChar=()=>save&&(!save.char||save.char.auto||!RACES[save.char.race]);
function withChar(next){ if(needsChar()) openNewChar(false,'existing',next); else next(); }
function openNewChar(keep,mode,next){ ccMode=mode||null; ccNext=next||null;
  $('#ccStep').textContent=ccMode?'Make your character':'Step 1 of 2'; $('#ccGo').textContent=ccMode?'Save character ►':'Choose your deck ►';
  if(!keep||!ccChar) ccChar=newChar(pick(RACE_KEYS),Math.random()<.5?1:0); $('#ccWarn').textContent=''; delete $('#ccGo').dataset.sure; renderNewChar(); show('scrNewChar'); }
function ccLook(id){ return typeof lookSprite==='function'?lookSprite(id,'front',true):null; }
function renderNewChar(){ const ch=ccChar, R=RACES[ch.race];
  $('#ccRace').textContent=R.name+' · '+(ch.body?'woman':'man'); $('#ccText').textContent=R.text;
  document.querySelectorAll('#scrNewChar [data-body]').forEach(b=>{ b.classList.toggle('on',+b.dataset.body===ch.body); b.onclick=()=>{ const spent=ch.spent; ccChar=newChar(ch.race,+b.dataset.body); ccChar.spent=spent; renderNewChar(); }; });
  // the hexmancer, big
  const cv=$('#ccSprite'), x=cv.getContext('2d'); x.clearRect(0,0,192,192); x.imageSmoothingEnabled=false; const sp=ccLook(ch.look);
  if(sp) x.drawImage(sp.img,0,0,sp.img.width,sp.img.height,0,0,192,192);
  // the races, each shown by the look for the body you picked
  const box=$('#ccRaces'); box.innerHTML='';
  for(const k of RACE_KEYS){ const b=document.createElement('button'); b.className='ccrace'+(k===ch.race?' on':''); const c=document.createElement('canvas'); c.width=c.height=64;
    const s2=ccLook(RACES[k].looks[ch.body]); if(s2){ const y=c.getContext('2d'); y.imageSmoothingEnabled=false; y.drawImage(s2.img,0,0,s2.img.width,s2.img.height,0,0,64,64); }
    b.appendChild(c); b.insertAdjacentHTML('beforeend',`<span>${RACES[k].name}</span>`);
    b.onclick=()=>{ ccChar=newChar(k,ch.body); for(const s of STAT_KEYS) ccChar.spent[s]=Math.min(ch.spent[s]||0,STAT_MAX-RACES[k].base[s]); $('#ccWarn').textContent=''; delete $('#ccGo').dataset.sure; renderNewChar(); }; box.appendChild(b); }
  // the stats, one dial each
  statDials($('#ccStats'),ch,$('#ccPts'),()=>{ if(!pointsLeft(ccChar)) $('#ccWarn').textContent=''; }); }
// a horizontal dial for each stat, spending a character's points (character creation and level ups)
function statDials(root,ch,ptsEl,after){ root.innerHTML=''; root._ch=ch; root._pts=ptsEl; root._after=after;
  for(const k of STAT_KEYS){ const S=STATS[k], row=document.createElement('div'); row.className='ccrow'; row.dataset.k=k;
    row.innerHTML=`<div class="ccname"><b>${S.icon} ${S.ab}</b><span>${S.name}</span></div><div class="dial" role="slider" tabindex="0" aria-label="${S.name}" aria-valuemin="0" aria-valuemax="${STAT_CAP}"><div class="tape"></div><i class="notch"></i><span class="dl">◄</span><span class="dr">►</span></div><div class="ccval"><b></b><small></small></div><p class="cceff"></p>`;
    root.appendChild(row); buildDial(row,k,root); }
  dialsUpdate(root); }
// a horizontal dial: a strip of numbered ticks under a fixed notch; dragging the strip, or tapping
// an end, turns the stat up or down one point at a time
const DIAL_STEP=22;
function buildDial(row,k,root){ const d=row.querySelector('.dial'), tape=d.querySelector('.tape');
  tape.innerHTML=Array.from({length:STAT_CAP+1},(_,v)=>`<i data-v="${v}"><b>${v}</b></i>`).join('');
  let drag=null;
  const step=n=>{ let moved=false; for(let i=0;i<Math.abs(n);i++) if(spendPoint(root._ch,k,Math.sign(n))) moved=true; else break; if(moved){ buzz(6); dialsUpdate(root); } return moved; };
  d.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ d.setPointerCapture(e.pointerId); }catch(_){} drag={id:e.pointerId,x:e.clientX,acc:0,moved:false}; d.classList.add('turning'); });
  d.addEventListener('pointermove',e=>{ if(!drag||e.pointerId!==drag.id) return; const dx=e.clientX-drag.x; drag.x=e.clientX; drag.acc+=dx;
    // dragging the strip left brings bigger numbers under the notch
    while(Math.abs(drag.acc)>=DIAL_STEP){ const s=drag.acc<0?1:-1; drag.acc+=s*DIAL_STEP; drag.moved=true; if(!step(s)) drag.acc=0; }
    tape.style.setProperty('--nudge',Math.max(-DIAL_STEP/2,Math.min(DIAL_STEP/2,drag.acc))+'px'); });
  const end=e=>{ if(!drag||e.pointerId!==drag.id) return; const r=d.getBoundingClientRect();
    if(!drag.moved&&e.type==='pointerup') step(e.clientX<r.left+r.width/2?-1:1);
    drag=null; d.classList.remove('turning'); tape.style.setProperty('--nudge','0px'); };
  d.addEventListener('pointerup',end); d.addEventListener('pointercancel',end);
  d.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'||e.key==='ArrowUp'){ e.preventDefault(); step(1); } else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ e.preventDefault(); step(-1); } }); }
// ticks: blue up to the race's baseline, gold for points already confirmed, green for new ones
function dialsUpdate(root){ const ch=root._ch, left=pointsLeft(ch), cap=statCap(ch);
  if(root._pts){ root._pts.textContent=left; root._pts.classList.toggle('none',!left); }
  root.querySelectorAll('.ccrow').forEach(row=>{ const k=row.dataset.k, v=statOf(ch,k), base=RACES[ch.race].base[k], kept=base+((ch.lock&&ch.lock[k])||0), d=row.querySelector('.dial');
    row.querySelector('.tape').style.setProperty('--v',v);
    row.querySelectorAll('.tape i').forEach(t=>{ const n=+t.dataset.v; t.className=n>v||n>cap?(n>cap?'over':''):n>kept?(ch.lock?'new':'buy'):n>base?'buy':n>0?'base':''; t.classList.toggle('cur',n===v); });
    d.setAttribute('aria-valuenow',v); d.classList.toggle('atmin',v<=kept); d.classList.toggle('atmax',v>=cap||!left);
    const fresh=(ch.spent[k]||0)-((ch.lock&&ch.lock[k])||0);
    row.querySelector('.ccval b').textContent=v; row.querySelector('.ccval small').textContent=ch.lock?(fresh?'+'+fresh:''):(ch.spent[k]?'+'+ch.spent[k]:'');
    const eff=statEffect(ch,k); row.querySelector('.cceff').innerHTML=`${esc(STATS[k].text)} · <b class="${v>10?'up':v<10?'down':''}">${esc(eff)}</b>`; });
  if(root._after) root._after(); }

/* ---------------- experience and levels ----------------
   XP comes from won fights, secrets found, traps disarmed, chests and new depths (chars.js has the
   curve). A level up opens this panel to spend the new points; Later keeps them for the
   Character screen or the next level up. */
let lvBack=null;
function openLevelUp(back){ const ch=ensureChar(save); save.lvlNew=false; persist(); lvBack=back||null;
  if(typeof xPause==='function'&&EX&&EX.active) xPause(true);
  $('#lvTitle').textContent='Level '+save.level+'!'; $('#lvSub').textContent='Your '+RACES[ch.race].name.toLowerCase()+' grows stronger. Spend your points on any stat (up to '+STAT_CAP+').';
  lvBefore=Object.assign({},ch.spent); statDials($('#lvStats'),ch,$('#lvPts')); $('#lvlUp').classList.add('on'); }
let lvBefore=null;
function closeLevelUp(keep){ const ch=save.char; if(!keep&&lvBefore) ch.spent=lvBefore; else lockChar(ch); persist(); $('#lvlUp').classList.remove('on');
  // un-pause the map even if a fight started while this was open, or you stay frozen after it
  if(typeof xPause==='function'&&EX&&!$('#pause').classList.contains('on')&&!$('#xDialog').classList.contains('on')&&!$('#bagUI').classList.contains('on')) xPause(false);
  if($('#scrCamp').classList.contains('on')) xpBar($('#campLevel')); if($('#bagUI').classList.contains('on')) renderBag(); if(typeof xHud==='function'&&EX) xHud();
  if(lvBack) lvBack(); }
$('#lvDone').onclick=()=>closeLevelUp(true);
$('#campLevel').onclick=()=>{ if(pointsLeft(ensureChar(save))>0) openLevelUp(()=>openCamp()); else openCharacter(); };
$('#lvLater').onclick=()=>closeLevelUp(false);
// open the panel if a level up is waiting (after a fight, back at camp, on the map)
function maybeLevelUp(){ if(save&&save.lvlNew&&save.char&&pointsLeft(save.char)>0&&!$('#lvlUp').classList.contains('on')&&!$('#reveal').classList.contains('on')) openLevelUp(); }
// level and XP as a bar: "Lv 3 · 40/140 XP"
function xpLine(){ ensureChar(save); return 'Lv '+save.level+' · '+save.xp+'/'+xpNeed(save.level)+' XP'; }
function xpBar(el){ ensureChar(save); const k=save.xp/xpNeed(save.level), left=pointsLeft(save.char);
  el.innerHTML=`<span>${xpLine()}</span><i style="--k:${k}"></i>`+(left?`<b>+${left} points</b>`:''); el.classList.toggle('pts',!!left); }

/* ---------------- save slots ----------------
   Three saves side by side. The menu's save panel opens this list to switch slots or delete one;
   New game opens it to choose where the new game goes (a used slot asks twice before it is replaced). */
function slotLine(s){ if(!s) return '<b>Empty</b>';
  const ch=s.char&&RACES[s.char.race]&&!s.char.auto?RACES[s.char.race].name+' '+(s.char.body?'woman':'man'):'No character yet';
  return `<b>${esc(ch)} · Lv ${s.level||1}</b><small>Depth ${s.deepest} · ${s.gold} gold · ${ownedUnique(s)} cards</small>`; }
function useSlot(n){ if(typeof stopExplore==='function'){ stopExplore(); EX=null; XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; }
  B=null; setSlot(n); save=loadSave(); campLog.length=0; pickDepth=null; ccChar=null; }
function openSlots(mode){ const isNew=mode==='new', cont=mode==='continue', box=$('#slList'); box.innerHTML='';
  $('#slTitle').textContent=isNew?'New game':cont?'Continue which save?':'Save slots';
  $('#slHint').textContent=isNew?'Choose a slot for the new game. Starting in a used slot replaces that save.':'Pick a slot to play. Each keeps its own character, cards, gold and gear.';
  for(let n=1;n<=SAVE_SLOTS;n++){ const s=n===SAVE_SLOT?save:loadSave(n), row=document.createElement('div'); row.className='slrow'+(n===SAVE_SLOT?' cur':'');
    row.innerHTML=`<span class="sln">${n}</span><div class="slinfo">${slotLine(s)}</div><div class="slbtns"></div>`;
    const bb=row.querySelector('.slbtns'), btn=(label,cls,fn)=>{ const b=document.createElement('button'); b.className='btn small'+(cls?' '+cls:''); b.textContent=label; b.onclick=e=>fn(e); bb.appendChild(b); return b; };
    if(isNew){ const go=()=>{ useSlot(n); $('#slots').classList.remove('on'); openNewChar(); };
      if(s) btn('Replace','ghost',e=>{ armed(e.currentTarget,'Tap again to replace',go); $('#slHint').innerHTML='<b style="color:#ff8a8a">Tap again within 3 seconds to replace slot '+n+'. That save will be lost.</b>'; }); else btn('Start here','',go); }
    // Continue: every save can be picked up from here, straight to its camp; an empty slot can start a new game
    else if(cont){ if(s) btn('Continue','',()=>{ if(n!==SAVE_SLOT) useSlot(n); $('#slots').classList.remove('on'); withChar(()=>openCamp()); });
      else btn('New game here','ghost',()=>{ useSlot(n); $('#slots').classList.remove('on'); openNewChar(); }); }
    else { if(n!==SAVE_SLOT) btn(s?'Play':'Use','',()=>{ useSlot(n); $('#slots').classList.remove('on'); openMenu(); }); else bb.insertAdjacentHTML('beforeend','<span class="slnow">In use</span>');
      if(s) btn('Delete','ghost',e=>armed(e.currentTarget,'Tap again',()=>{ clearSave(n); clearPoint(n); if(n===SAVE_SLOT){ save=null; pickDepth=null; } openSlots(); openMenu(); tip('Slot '+n+' deleted'); })); }
    box.appendChild(row); }
  $('#slots').classList.add('on'); }

/* ---------------- start ---------------- */
/* New game: pick the color your 80 random cards lean to, or roll one. (The premade starter decks
   are kept for later: set USE_STARTERS to offer them again.) */
const USE_STARTERS=false;
function buildStart(){
  const box=$('#starters'); box.innerHTML='';
  const begin=lean=>{ if(typeof XPARK!=='undefined') XPARK=null; save=newSave({lean});
    clearPoint(); if(ccChar) Object.assign(save,{char:lockChar(ccChar), look:ccChar.look, hat:true, level:1, xp:0}); persist(); pickDepth=1; openCamp();
    tip('Your 80 cards lean '+COLORS[lean].name+'. Your first deck is ready at camp.'); };
  if(!USE_STARTERS){
    const d=document.createElement('div'); d.className='starter deal';
    d.innerHTML=`<h3>Your first cards</h3><p>You get 80 cards dealt at random: mostly commons, a few uncommons and rares, with Gray and Brown cards and some of 2 or 3 other colors. Pick the color they lean to, and every new character gets a different mix.</p>
      <div class="dealcols">${SIX.map(k=>`<button class="btn dealc" data-k="${k}" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${COLORS[k].name}</button>`).join('')}</div>
      <div class="row"><button class="btn dealr">🎲 Surprise me</button></div>`;
    d.querySelectorAll('.dealc').forEach(b=>b.onclick=()=>begin(b.dataset.k));
    d.querySelector('.dealr').onclick=()=>begin(SIX[Math.floor(Math.random()*SIX.length)]);
    box.appendChild(d);
    $('#startWarn').textContent=save?'Starting a new game replaces your current save: your cards, gold and gear.':'';
    show('scrStart'); return; }
  for(const s of STARTERS){
    const d=document.createElement('div'); d.className='starter';
    d.innerHTML=`<h3>${s.name}</h3><div class="cols">${s.colors.map(c=>`<span class="chip" style="--c:${COLORS[c].c}">${COLORS[c].icon} ${COLORS[c].name}</span>`).join('')}</div>
      <p>${s.text}</p><div class="row"><button class="btn">Start with this deck</button></div>`;
    d.querySelector('.btn').onclick=()=>{ if(typeof XPARK!=='undefined') XPARK=null; save=newSave(s);
      clearPoint(); if(ccChar) Object.assign(save,{char:lockChar(ccChar), look:ccChar.look, hat:true, level:1, xp:0}); persist(); pickDepth=1; openCamp(); };
    box.appendChild(d);
  }
  $('#startWarn').textContent=save?'Starting a new game replaces your current save: your cards, gold and gear.':'';
  show('scrStart');
}

/* ---------------- camp ---------------- */
let pickDepth=null;   // null until you first open camp or the menu, then your choice sticks (1 included)
// An area's element and how your deck fares there: foes lean to the area's colour (enemies.js),
// so they are weak to what beats it and resist it; and your deck's element (battle.js) can be weak to them.
function affinityHTML(A,list){ const k=A.color; if(!SIX.includes(k)) return '';
  const ic=c=>`<b style="color:${COLORS[c].c}">${COLORS[c].icon} ${COLORS[c].name}</b>`, el=deckElem(list.map(id=>CARDS[id]));
  let you=el?'Your deck is '+ic(el)+'. ':'Your deck is mixed (no element). ';
  if(el&&BEATS[k]===el) you+='<span class="bad">Foes here hit you 30% harder.</span>';
  else if(el&&BEATS[el]===k) you+='<span class="good">Foes here hit you 20% softer.</span>';
  else if(el===k) you+='<span class="bad">Your '+COLORS[k].name+' cards are resisted here.</span>';
  else if(el===WEAK_TO[k]) you+='<span class="good">Your cards hit most foes here for WEAK damage.</span>';
  return `Foes here are mostly ${ic(k)}: weak to ${ic(WEAK_TO[k])}, resist ${ic(k)}.<br>${you}`+(typeof areaRuleHTML==='function'?'<br>'+areaRuleHTML(A):''); }
function openCamp(){
  if(typeof stopExplore==='function'){ stopExplore(); EX=null; }
  if(pickDepth==null) pickDepth=save.deepest;
  pickDepth=Math.min(Math.max(1,pickDepth),save.deepest);
  const d=activeDeck(), v=validateDeck(d.list,CARDS,save.owned);
  $('#goDuel').classList.toggle('off',!v.ok);   // still tappable: it says why it can't duel
  $('#campGold').innerHTML=uiIcon('coin',32)+save.gold; xpBar($('#campLevel'));
  $('#campColl').innerHTML=uiIcon('cards',32)+ownedUnique(save)+'<span class="campshard">'+uiIcon('shard',28)+(save.shards||0)+'</span>'+(Object.keys(gearState(save).cursed).length?' <em class="curse">cursed</em>':'');
  $('#campDeck').textContent=d.name;
  { const n=typeof bountyReady==='function'?bountyReady():0, bb=$('#bountyBadge'); bb.hidden=!n; bb.textContent=n; }
  const cnt=$('#campDeckCount'); cnt.textContent=v.count+'/'+RULES.max; cnt.classList.toggle('bad',!v.ok);
  $('#campDeckErr').textContent=v.ok?'':v.errors[0]+(v.errors.length>1?' (+'+(v.errors.length-1)+' more)':'')+'. Fix it in the deck builder.';
  const A=areaOf(pickDepth); $('#campArea').textContent=areaLabel(pickDepth); $('#campArea').style.color=A.glow;
  $('#campAffinity').innerHTML=affinityHTML(A,d.list);
  $('#campBoss').innerHTML=isBossDepth(pickDepth)?'<b class="gold">'+ENEMY_DEFS[bossFor(pickDepth)].name+' here</b>':'Boss at <b class="gold">'+areaBossDepth(pickDepth)+'</b>';
  $('#btnDescend').textContent='Explore depth '+pickDepth;
  $('#btnDescend').disabled=!v.ok; $('#btnQuick').disabled=!v.ok;
  $('#depthDown').disabled=pickDepth<=1; $('#depthUp').disabled=pickDepth>=save.deepest;
  drawDepthMap($('#depthMap'),pickDepth,save.deepest);
  { const lc=lowChargeNote(), now=performance.now(); if(lc&&now>(openCamp.lcT||0)){ openCamp.lcT=now+120000; setTimeout(()=>tip(lc.trim(),4500),400); } }   // nearly spent Charge cards: the shop recharges them
  $('#campLog').innerHTML=(campLog.length?campLog:[{t:'Each win gives a reward: a card, gold or a piece of gear. Every area is '+DEPTHS_PER_AREA+' floors deep and its boss waits on the last one. Losing costs 20% of your gold.',c:'dim'}])
    .slice(-4).map(l=>`<div class="${l.c||''}">${esc(l.t)}</div>`).join('');
  show('scrCamp'); campScene(); setTimeout(()=>{ if($('#scrCamp').classList.contains('on')) campScene(); },120);   // again once the log and fonts have settled, so the fit is right
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ if($('#scrCamp').classList.contains('on')) campScene(); });
  setTimeout(maybeLevelUp,250);
}
// the camp scene: the area you are about to enter, your wizard in its gear, and a fire that
// flickers while the camp is open. Drawn at a whole-number zoom so pixels stay square.
let campTimer=0;
function campScene(){
  const cv=$('#campScene'), box=cv.parentElement, w=((box.parentElement.clientWidth||330)-(box.offsetWidth-box.clientWidth))||330;   // the frame may hug a shrunk picture, so measure the row it sits in
  // the scene fills the frame; pixels stay hard-edged, so this reads as pixel art at any size
  let k=w/SCENE_W;
  cv.style.width=SCENE_W*k+'px'; cv.style.height=SCENE_H*k+'px';
  // on a phone the camp fits one screen: the picture gives up height first (down to about half),
  // and only if that is not enough does the whole camp shrink a little
  const scr=$('#scrCamp'), camp=scr.querySelector('.camp'); camp.style.zoom='';
  if(document.body.classList.contains('ui-phone')&&!document.body.classList.contains('wide')){
    const over=scr.scrollHeight-scr.clientHeight;
    if(over>0){ const h=Math.max(SCENE_H*k*.5,SCENE_H*k-over); k=h/SCENE_H; cv.style.width=SCENE_W*k+'px'; cv.style.height=h+'px'; }
    const over2=scr.scrollHeight-scr.clientHeight; if(over2>0) camp.style.zoom=Math.max(.8,scr.clientHeight/(scr.clientHeight+over2)).toFixed(3); }
  const dm=$('#depthMap'); dm.style.width='100%'; dm.style.height='auto';
  clearInterval(campTimer); const t0=performance.now();
  const tick=()=>{ if(!$('#scrCamp').classList.contains('on')){ clearInterval(campTimer); return; } drawCampScene(cv,pickDepth,(performance.now()-t0)/1000,unitSprite({kind:'player',look:gearLook(save),view:'front'}).img); };
  tick(); campTimer=setInterval(tick,140);
}
// the last few things that happened, shown in the camp log
const campLog=[];
const lootPic=(k,n=64)=>k.startsWith('scroll:')?uiIcon('scroll',n,k==='scroll:purify'?'#f2c94c':'#8fe4ff'):gearIcon(k,n);
function logCamp(t,c){ campLog.push({t,c}); if(campLog.length>12) campLog.shift(); }
// Testing: start any boss straight away at its own depth
function renderTrials(){ const box=$('#bossTrials'); if(!box||typeof BOSS_ORDER==='undefined') return;
  box.innerHTML='<span class="lbl">Test a boss</span>'+BOSS_ORDER.map(id=>`<button class="chip" data-boss="${id}" style="--c:${COLORS[ENEMY_DEFS[id].color].c}">${ENEMY_DEFS[id].name} · ${bossDepth(id)}</button>`).join('');
  box.querySelectorAll('[data-boss]').forEach(b=>b.onclick=()=>fight(bossDepth(b.dataset.boss),[[b.dataset.boss]],{trial:true})); }
renderTrials();
document.querySelectorAll('.btn.mi').forEach(b=>b.insertAdjacentHTML('afterbegin',uiIcon(b.dataset.icon,48)));
addEventListener('resize',()=>{ if($('#scrCamp').classList.contains('on')) campScene(); });
$('#depthDown').onclick=()=>{ pickDepth--; openCamp(); };
$('#depthUp').onclick=()=>{ pickDepth++; openCamp(); };
$('#btnDescend').onclick=()=>enterExplore(pickDepth);
$('#btnQuick').onclick=()=>fight(pickDepth);   // the battle on its own, no dungeon
$('#goBuilder').onclick=()=>openBuilder();
$('#goDuel').onclick=()=>{ const why=duelDeckProblem(); if(why) return tip(why); openDuel('camp'); };
$('#goCollection').onclick=()=>openCollection();
$('#goShop').onclick=()=>openShop();
$('#goChar').onclick=()=>openCharacter();
// Two-tap confirmation in the page itself (browser confirm dialogs are blocked in some viewers):
// the first tap arms the button and changes its label, a second tap within 3 seconds acts.
function armed(btn,label,act){ if(btn.dataset.armed){ delete btn.dataset.armed; btn.textContent=btn.dataset.label; act(); return; }
  btn.dataset.label=btn.textContent; btn.dataset.armed='1'; btn.textContent=label;
  setTimeout(()=>{ if(btn.dataset.armed){ delete btn.dataset.armed; btn.textContent=btn.dataset.label; } },3000); }
// Settings › Save › Erase: wherever you are, everything stops and the game returns to the menu
$('#btnReset').onclick=e=>armed(e.currentTarget,'Tap again to erase',()=>{
  closeSettings(); ['#pause','#reveal','#custom','#detail','#pick','#xDialog'].forEach(k=>$(k).classList.remove('on')); paused=false; duelLeave(true); B=null;
  if(typeof stopExplore==='function'){ stopExplore(); EX=null; XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; }
  clearSave(); clearPoint(); save=null; campLog.length=0; pickDepth=null; openMenu(); tip('Save erased'); });
document.querySelectorAll('.back').forEach(b=>b.onclick=openCamp);

/* ---------------- filters (builder and collection) ---------------- */
function makeFilters(box,f,onChange,withOwned){
  const fams=Object.keys(COLORS);
  box.innerHTML=`<div class="chips">${fams.map(k=>`<button class="chip fc" data-k="${k}" style="--c:${COLORS[k].c}">${COLORS[k].icon}</button>`).join('')}</div>
    <div class="row"><select data-f="type"><option value="">All types</option>${Object.keys(TYPES).map(t=>`<option value="${t}">${TYPES[t].name}</option>`).join('')}</select>
    <select data-f="rarity"><option value="">All rarities</option>${Object.keys(RARITY).map(r=>`<option value="${r}">${RARITY[r].n}</option>`).join('')}</select>
    ${withOwned?'<select data-f="owned"><option value="">All cards</option><option value="owned">Found</option><option value="missing">Not found</option></select>':''}
    <input data-f="q" placeholder="Search"></div>`;
  box.querySelectorAll('.fc').forEach(b=>b.onclick=()=>{ const k=b.dataset.k; f.colors.has(k)?f.colors.delete(k):f.colors.add(k); b.classList.toggle('on',f.colors.has(k)); onChange(); });
  box.querySelectorAll('[data-f]').forEach(el=>el.oninput=()=>{ f[el.dataset.f]=el.value; onChange(); });
}
function passes(c,f){
  if(f.colors.size&&!f.colors.has(c.color)) return false;
  if(f.type&&c.type!==f.type) return false;
  if(f.rarity&&c.rarity!==f.rarity) return false;
  if(f.owned==='owned'&&!save.seen[c.id]) return false;
  if(f.owned==='missing'&&save.seen[c.id]) return false;
  if(f.q&&!(save.seen[c.id]&&(c.name+' '+cardText(c)).toLowerCase().includes(f.q.toLowerCase()))) return false;
  return true;
}
const FAM_ORDER=Object.keys(COLORS), RAR_ORDER=Object.keys(RARITY);
const byFamily=(a,b)=>FAM_ORDER.indexOf(a.color)-FAM_ORDER.indexOf(b.color)||a.rank-b.rank||a.name.localeCompare(b.name);
// Render a long card list a page at a time.
function paged(box,items,make,page){
  page=page||90; box.innerHTML=''; let shown=0;
  const more=document.createElement('button'); more.className='btn ghost more';
  const step=()=>{ const frag=document.createDocumentFragment(); items.slice(shown,shown+page).forEach(it=>frag.appendChild(make(it))); shown=Math.min(items.length,shown+page);
    more.remove(); box.appendChild(frag); if(shown<items.length){ more.textContent='Show more ('+(items.length-shown)+')'; box.appendChild(more); } };
  more.onclick=step; step();
  if(!items.length) box.innerHTML='<p class="hint">No cards match.</p>';
}

/* ---------------- deck builder ---------------- */
const bf={colors:new Set(), type:'', rarity:'', q:''};
let editSlot=0;
function openBuilder(){ if(typeof openDeckUI==='function') return openDeckUI('camp'); editSlot=save.active; makeFilters($('#bFilters'),bf,renderColl,false); renderBuilder(); show('scrBuilder'); }
function renderBuilder(){ renderSlots(); renderDeck(); renderColl(); }
function renderSlots(){
  const box=$('#bSlots'); box.innerHTML='';
  save.decks.forEach((d,i)=>{ const b=document.createElement('button'); b.className='chip slotbtn'+(i===editSlot?' on':'')+(i===save.active?' act':'');
    b.textContent=(i+1)+(i===save.active?' ★':''); b.title=d.name; b.onclick=()=>{ editSlot=i; renderBuilder(); }; box.appendChild(b); });
  const d=save.decks[editSlot]; $('#bName').value=d.name;
  $('#bUse').textContent=editSlot===save.active?'In use ★':'Use this deck';
  const cur=soulOf(d.list,d), sel=$('#bSoul');
  sel.innerHTML=soulsOwned().map(h=>`<option value="${h.id}"${h.id===cur?' selected':''}>${COLORS[h.color].icon} ${esc(h.name)}</option>`).join('');
  $('#bSoulTxt').textContent=CARDS[cur]?'Attacks: '+cardText(CARDS[cur]).replace(/\s+/g,' ').slice(0,140):'';
}
$('#bSoul').onchange=e=>{ save.decks[editSlot].soul=e.target.value; persist(); renderSlots(); };
$('#bName').oninput=e=>{ save.decks[editSlot].name=e.target.value||'Deck '+(editSlot+1); persist(); };
function renderDeck(){
  const d=save.decks[editSlot], v=validateDeck(d.list,CARDS,save.owned);
  const cnt=$('#bCount'); cnt.textContent=v.count+' / '+RULES.max; cnt.classList.toggle('bad',!v.ok);
  $('#bErr').textContent=v.ok?'':v.errors.slice(0,3).join(' · ');
  const byColor={}, byType={};
  d.list.forEach(id=>{ const c=CARDS[id]; byColor[c.color]=(byColor[c.color]||0)+1; byType[c.type]=(byType[c.type]||0)+1; });
  $('#bStats').innerHTML=FAM_ORDER.filter(k=>byColor[k]).map(k=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${byColor[k]}</span>`).join('')+
    Object.keys(TYPES).filter(k=>byType[k]).map(k=>`<span class="chip" style="--c:#9fdcff">${TYPES[k].icon} ${TYPES[k].name} ${byType[k]}</span>`).join('');
  const ids=Object.keys(v.counts).map(id=>CARDS[id]).sort(byFamily);
  paged($('#bDeck'),ids,c=>{ const el=cardEl(c,`<span class="badge">×${v.counts[c.id]}</span>`); longPress(el,c);
    el.onclick=()=>{ if(pressed) return; const i=d.list.lastIndexOf(c.id); d.list.splice(i,1); persist(); renderDeck(); renderColl(); }; return el; },300);
  if(!ids.length) $('#bDeck').innerHTML='<p class="hint">Empty deck. Tap cards below, or use Auto-fill.</p>';
}
function renderColl(){
  const d=save.decks[editSlot], inDeck={}; d.list.forEach(id=>inDeck[id]=(inDeck[id]||0)+1);
  const items=Object.keys(save.owned).map(id=>CARDS[id]).filter(c=>c&&save.owned[c.id]>0&&passes(c,bf)).sort(byFamily);
  paged($('#bColl'),items,c=>{
    const left=Math.min(copyLimit(c),save.owned[c.id])-(inDeck[c.id]||0);
    const el=cardEl(c,`<span class="badge${left>0?'':' dim'}">${left>0?left+' left':'max'}</span>`); if(left<=0) el.classList.add('picked'); longPress(el,c);
    el.onclick=()=>{ if(pressed) return;
      if(d.list.length>=RULES.max) return tip('Deck is full (60)');
      if(left<=0) return tip(c.rarity==='legendary'?'1 copy per legendary':(inDeck[c.id]||0)>=RULES.copies?'Max 4 copies':'You own '+save.owned[c.id]);
      d.list.push(c.id); persist(); renderDeck(); renderColl(); };
    return el; });
}
$('#bAuto').onclick=()=>{ const d=save.decks[editSlot]; d.list=autoFill(d.list,save.owned); persist(); renderBuilder(); };
$('#bClear').onclick=e=>{ const d=save.decks[editSlot]; if(!d.list.length) return; armed(e.currentTarget,'Tap to confirm',()=>{ d.list=[]; persist(); renderBuilder(); }); };
$('#bUse').onclick=()=>{ save.active=editSlot; persist(); renderSlots(); tip(save.decks[editSlot].name+' is now your deck'); };

/* ---------------- collection ---------------- */
/* My cards: everything you own (with copies and how many are in your deck), your items, and
   a tab for the whole set of 1,006 with the ones you haven't found yet greyed out. */
const cf={colors:new Set(), type:'', rarity:'', q:'', owned:'', mine:true, sort:'family'};
function openCollection(){ makeFilters($('#cFilters'),cf,renderCollection,!cf.mine); renderCollection(); show('scrCollection'); }
$('#cTabMine').onclick=()=>{ cf.mine=true; cf.book=false; cf.owned=''; openCollection(); };
$('#cTabAll').onclick=()=>{ cf.mine=false; cf.book=false; openCollection(); };
$('#cTabBook').onclick=()=>{ cf.book=true; renderCollection(); };
// The recipe book: found recipes show their cards and what they make; the rest show the
// colors and types they need, with the cards you have already seen named.
function renderBook(){
  const known=save.recipes||{}, g=$('#cGrid'); g.innerHTML='';
  $('#cTitle').textContent='Recipes'; $('#cCount').textContent=Object.keys(known).length+' / '+RECIPES.length+' found';
  $('#cProgress').innerHTML=''; $('#cItems').hidden=true; $('#cFilters').hidden=true;
  for(const r of RECIPES){ const found=known[r.id], box=document.createElement('div'); box.className='recipe'+(found?' found':'');
    const parts=r.cards.map(id=>{ const c=CARDS[id]; return found||save.seen[id]?`<span class="chip" style="--c:${COLORS[c.color].c}">${esc(c.name)}</span>`:`<span class="chip" style="--c:${COLORS[c.color].c}">??? ${TYPES[c.type].name}</span>`; }).join(' + ');
    box.innerHTML=`<div class="rh">${found?'⚗ '+esc(r.name):'⚗ ???'}${r.cards.length>3?' <small>4 cards · needs the 4th slot</small>':''}</div><div class="rp">${parts}</div>`;
    if(found){ const el=cardEl(r.card); el.onclick=()=>showDetail(r.card); box.appendChild(el); }
    g.appendChild(box); }
}
$('#cSort').onchange=e=>{ cf.sort=e.target.value; renderCollection(); };
const SORTS={family:byFamily, rank:(a,b)=>a.rank-b.rank||byFamily(a,b), rarity:(a,b)=>RAR_ORDER.indexOf(b.rarity)-RAR_ORDER.indexOf(a.rarity)||byFamily(a,b),
  copies:(a,b)=>(save.owned[b.id]||0)-(save.owned[a.id]||0)||byFamily(a,b), name:(a,b)=>a.name.localeCompare(b.name)};
function renderCollection(){
  $('#cTabBook').classList.toggle('on',!!cf.book); $('#cFilters').hidden=!!cf.book; $('#cSort').hidden=!!cf.book;
  if(cf.book){ $('#cTabMine').classList.remove('on'); $('#cTabAll').classList.remove('on'); return renderBook(); }
  $('#cTabMine').classList.toggle('on',cf.mine); $('#cTabAll').classList.toggle('on',!cf.mine); $('#cSort').value=cf.sort;
  const copies=Object.keys(save.owned).reduce((a,id)=>a+(CARDS[id]?save.owned[id]:0),0);
  $('#cTitle').textContent=cf.mine?'My cards':'All cards';
  $('#cCount').textContent=cf.mine?ownedUnique(save)+' cards · '+copies+' copies':ownedUnique(save)+' / '+CARD_LIST.length;
  $('#cCount').innerHTML+=' · '+uiIcon('shard',14)+(save.shards||0);
  $('#cItems').innerHTML=`<button class="item" onclick="openCharacter()">⚔ Gear, enchanting and curses are on the Character screen →</button>`; $('#cItems').hidden=!cf.mine;
  if(cf.mine){ const inDeck={}; activeDeck().list.forEach(id=>inDeck[id]=(inDeck[id]||0)+1);
    const fam={}; Object.keys(save.owned).forEach(id=>{ const c=CARDS[id]; if(c&&save.owned[id]>0) fam[c.color]=(fam[c.color]||0)+save.owned[id]; });
    $('#cProgress').innerHTML=FAM_ORDER.filter(k=>fam[k]).map(k=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${fam[k]}</span>`).join('');
    const items=Object.keys(save.owned).map(id=>CARDS[id]).filter(c=>c&&save.owned[c.id]>0&&passes(c,cf)).sort(SORTS[cf.sort]);
    paged($('#cGrid'),items,c=>{ const el=cardEl(c,chargeMark(c)+`<span class="badge" title="${inDeck[c.id]||0} in this deck, ${save.owned[c.id]} owned">${inDeck[c.id]?inDeck[c.id]+'/'+save.owned[c.id]:'×'+save.owned[c.id]}</span>`); longPress(el,c); el.onclick=()=>{ if(!pressed) showDetail(c); }; return el; });
    if(!items.length) $('#cGrid').innerHTML='<p class="hint">No cards match.</p>';
    return; }
  const fam={}; CARD_LIST.forEach(c=>{ fam[c.color]=fam[c.color]||[0,0]; fam[c.color][1]++; if(save.seen[c.id]) fam[c.color][0]++; });
  $('#cProgress').innerHTML=FAM_ORDER.map(k=>`<span class="chip" style="--c:${COLORS[k].c}">${COLORS[k].icon} ${fam[k][0]}/${fam[k][1]}</span>`).join('');
  const items=CARD_LIST.filter(c=>passes(c,cf)).sort(SORTS[cf.sort]);
  paged($('#cGrid'),items,c=>{ const own=save.owned[c.id]||0; const el=cardEl(c,own?chargeMark(c)+`<span class="badge">×${own}</span>`:'',!save.seen[c.id]); longPress(el,c); el.onclick=()=>{ if(!pressed) showDetail(c); }; return el; });
}

/* ---------------- character and gear ----------------
   The Character screen is the bag (bagui.js), opened at camp: the same paper doll, items grid, drag
   and drop and detail strip, with the camp's own actions on gear (merge, enchant, purify, sacrifice)
   and the Stats and Look tabs. */
function openCharacter(){ ensureStarterGear(save); persist(); openBagUI(); }
function charMsg(r){ if(r.msg) tip(r.msg); if(r.ok) persist(); if($('#bagUI').classList.contains('on')) renderBag(); }
// pick how your hexmancer looks: wizard, elf, dwarf or orc (man or woman), dark witch or necromancer; hat on or off
function renderLooks(box){ if(!box||typeof PLAYER_LOOKS==='undefined') return; const cur=(typeof LOOK_ALIAS!=='undefined'&&LOOK_ALIAS[save.look])||save.look||'wizard';
  box.innerHTML='<div class="invtabs looks">'+Object.keys(PLAYER_LOOKS).map(id=>{ const L=PLAYER_LOOKS[id]; return `<button class="chip${id===cur?' on':''}" data-look="${id}" style="--c:#8fe4ff">${L.name}${L.gender?' · '+L.gender:''}</button>`; }).join('')
    +`<button class="chip${save.hat===false?'':' on'}" data-hat="1" style="--c:#f2c94c">${save.hat===false?'Hat off':'Hat on'}</button></div>`;
  box.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>{ save.look=b.dataset.look; persist(); renderBag(); });
  box.querySelector('[data-hat]').onclick=()=>{ save.hat=save.hat===false; persist(); renderBag(); }; }
window.onLookLoaded=()=>{ if($('#bagUI').classList.contains('on')) renderBag(); if($('#scrNewChar').classList.contains('on')) renderNewChar(); };
// the Stats tab: your level and stats, then what your gear and blessings add up to
function charStatsHTML(){ const m=gearMods(save), K=WEAPON_KINDS[m.kind]||WEAPON_KINDS.wand, ch=save.char&&RACES[save.char.race]?save.char:null, left=ch?pointsLeft(ch):0;
  const w=(k,v)=>`<div><span>${k}</span><b>${v}</b></div>`, pct=x=>Math.round(x*100)+'%';
  return '<h3>Abilities</h3><div class="charstats">'+(ch?w('Level',xpLine())+(left?`<div class="wide"><button id="chSpend" class="btn small">Spend ${left} stat point${left>1?'s':''}</button></div>`:''):'')
    +(ch?w('Race',RACES[ch.race].name+' · '+(ch.body?'woman':'man'))+STAT_KEYS.map(k=>{ const g=(m.stats&&m.stats[k])||0; return w(STATS[k].icon+' '+STATS[k].ab+' '+statOf(ch,k,m.stats)+(g?` <small class="${g>0?'up':'down'}">(${g>0?'+':'−'}${Math.abs(g)} gear)</small>`:''),statEffect(ch,k,m.stats)); }).join(''):'<p class="hint">Characters made before stats existed have average stats (10 in each). Start a new game to make a character.</p>')+'</div>'
    +'<h3>Gear stats</h3><div class="charstats">'+w('Max HP',120+(m.hp||0))+w(K.name,Math.max(1,K.tap+m.tap)+' · charged '+Math.max(2,K.charged+m.charged))+w('Element',m.color?COLORS[m.color].icon+' '+COLORS[m.color].name:'none')
    +w('Fire rate',m.cd&&m.cd!==1?Math.round((1/m.cd-1)*100)+'% faster':'normal')+w('Guard',pct(m.guard||0))+w('Start shield',m.shield||0)
    +(m.dodge?w('Dodge',pct(m.dodge)):'')+(m.block?w('Shield block',m.block+' hit'+(m.block>1?'s':'')+' a turn'):'')+(m.regen?w('Regeneration',m.regen+' HP/s'):'')+(m.counter?w('Counter',m.counter):'')
    +(m.slow&&m.slow!==1?w('Move speed',m.slow<1?Math.round((1-m.slow)*100)+'% faster':Math.round((m.slow-1)*100)+'% slower'):'')+(m.castSlow&&m.castSlow>1?w('Casting',Math.round((m.castSlow-1)*100)+'% slower'):'')
    +(m.surge?w('4th slot chance',pct(m.surge)):'')+(m.gold?w('Gold','+'+pct(m.gold)):'')+(m.gauge||m.hurt||m.hpPerShot||m.misfire?w('Curses',modsText({gauge:m.gauge,hurt:m.hurt,hpPerShot:m.hpPerShot,misfire:m.misfire})):'')
    +activeSets(save).map(k=>w('Set ✦',SETS[k].name)).join('')
    +(typeof PERM!=='undefined'?Object.keys(PERM).filter(k=>save.perm&&save.perm[k]).map(k=>w('Blessing',PERM[k].name+' ×'+save.perm[k])).join(''):'')+'</div>'
    +'<div class="testbar devonly"><span class="dim">Testing</span><button id="chTestAll" class="btn ghost small">Get one of every piece</button><button id="chTestScrolls" class="btn ghost small">+2 of each scroll</button></div>'; }
// the Stats tab's buttons, once it is drawn
function charStatsBind(){ if($('#chSpend')) $('#chSpend').onclick=()=>openLevelUp(()=>renderBag());
  if($('#chTestAll')) $('#chTestAll').onclick=()=>{ Object.keys(GEAR).forEach(id=>{ gearState(save).items[id]=(gearState(save).items[id]||0)+1; }); persist(); charMsg({ok:true,msg:'One of every piece added (cursed ones are still in disguise).'}); };
  if($('#chTestScrolls')) $('#chTestScrolls').onclick=()=>{ addScroll(save,'enchant',2); addScroll(save,'purify',2); persist(); charMsg({ok:true,msg:'+2 of each scroll'}); }; }
// choose the cards to give up to break a curse
function pickSacrifice(id){ const G=Object.assign({},GEAR[id],{rune:curseRune(save,id)}), chosen=[];
  $('#pkTitle').textContent='Break the curse'; $('#pkBody').textContent='Give up '+SACRIFICE+' cards of rune '+G.rune+'. They leave your collection and your decks for good.';
  const box=$('#pkCards'); box.innerHTML='';
  const own=Object.keys(save.owned).map(k=>CARDS[k]).filter(c=>c&&c.code===G.rune&&save.owned[c.id]>0).sort(byFamily);
  if(!own.length) box.innerHTML='<p class="hint">You own no rune '+G.rune+' cards. Find some, or use a Scroll of Purifying.</p>';
  for(const c of own){ const el=cardEl(c,`<span class="badge">×${save.owned[c.id]}</span>`); const mark=()=>{ const n=chosen.filter(x=>x===c.id).length; el.classList.toggle('chosen',n>0); el.dataset.n=n?'×'+n:''; };
    el.onclick=()=>{ const n=chosen.filter(x=>x===c.id).length; if(n<save.owned[c.id]&&chosen.length<SACRIFICE) chosen.push(c.id); else chosen.splice(chosen.indexOf(c.id),1); mark(); $('#pkOk').disabled=chosen.length!==SACRIFICE; $('#pkOk').textContent='Sacrifice '+chosen.length+' / '+SACRIFICE; };
    box.appendChild(el); }
  $('#pkOk').disabled=true; $('#pkOk').textContent='Sacrifice 0 / '+SACRIFICE;
  $('#pkOk').onclick=()=>{ $('#pick').classList.remove('on'); charMsg(sacrificeFor(save,id,chosen)); };
  $('#pkCancel').onclick=()=>$('#pick').classList.remove('on');
  $('#pick').classList.add('on');
}

/* ---------------- shop ---------------- */
/* ---------------- battle flow ---------------- */
// xo (from the overworld): {hp, opening, explore} — wounds carry in and the fight returns to the map
function fight(depth,waves,xo){
  const lab=xo&&xo.lab, d=lab?{list:lab.list}:activeDeck();   // lab: a Card lab test (cardlab.js)
  if(!lab){ const v=validateDeck(d.list,CARDS,save.owned);
    // cards that burned up in the dungeon can leave the deck short: the dive goes on with what is left (a fight used to throw you back to camp without a word)
    const short=v.errors.length&&v.errors.every(e=>/^Too few cards/.test(e))&&d.list.length>=20;
    if(!v.ok&&!(xo&&xo.explore&&short)){ tip(v.errors[0]+'. Fix the deck at camp.',4000); return openCamp(); }
    if(!v.ok&&!fight.warned){ fight.warned=true; setTimeout(()=>tip('Your deck is down to '+d.list.length+' cards (some burned up). Top it up at camp.',4000),900); } }
  $('#reveal').classList.remove('on');
  prev=performance.now();   // a fresh clock: time spent on the dungeon/reward screen is not battle time
  show('scrBattle');
  const soul=null, list=d.list;   // heroes are cards in the deck now: drawn and played to summon them
  startBattle(list,depth,{
    onSoul:ready=>{ if(ready){ buzz(30); banner('♔ Soul ready: Summon or Unison','#ffe066'); } soulMenu(false); },
    onCustom:renderCustom,
    onFight:()=>{ dragAbort(); $('#custom').classList.remove('on'); hud(true); },
    onCast:(c,inst)=>{ showCast(c,inst); buzz(12); },
    onHurt:d=>{ buzz(d>=15?60:30); const h=$('#hurtFx'); h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); },
    onTurn:n=>banner('Turn '+n,'#4fb3ff'),
    onBoss:(t,c,info)=>{ banner(t,c); if(info) tip(info); },
    onWave:i=>banner('Wave '+(i+1),'#ff5d6c'),
    onCombo:label=>{ B.combos=(B.combos||0)+1; B.hitStop=Math.max(B.hitStop||0,.09); if(typeof arenaKick==='function') arenaKick(.4); banner('✦ '+label.split(':')[0],'#ffe066'); },
    onRecipe:r=>{ if(B&&B.lab) return; const first=!(save.recipes||{})[r.id]; save.recipes=save.recipes||{}; save.recipes[r.id]=1; persist(); banner((first?'⚗ New recipe! ':'⚗ ')+r.name,'#39ff8a'); },
    onHero:c=>banner('♔ '+c.name.split(',')[0]+' joins the fight!','#ffe066'),
    onEnd:win=>win?victory():defeat(),
    onLowCharge:inst=>{ const c=inst.card; if(inst.left===1){ banner('⚠ '+c.name+': last charge','#ffd23f'); tip('Last charge on '+c.name+'. Recharge it at the camp shop, or it burns up when it runs out.',3500); }
      else if(inst.left<=0){ banner('🔥 '+c.name+' is spent','#ff4d5e'); tip(c.name+' is spent: this copy burns up after the fight. Recharge before it runs out next time.',3500); } },
  },{prepare:p=>lab?null:assignChargeUses(save,p,d.list), gear:gearMods(save), look:gearLook(save), waves, hp:xo&&xo.hp, opening:xo&&xo.opening, rule:xo&&xo.rule, tier:xo&&xo.tier||0, soul});
  B.explore=!!(xo&&xo.explore); B.trial=!!(xo&&(xo.trial||lab)); B.lab=lab||null; if(typeof mlabSync==='function') mlabSync();
  if(B.explore&&typeof roomAllyStart==='function') roomAllyStart();   // a hired adventurer fights beside you (rooms.js)
  if(B.opening==='strike') setTimeout(()=>banner('First Strike! They reel back','#39ff8a'),300);
  else if(B.opening) setTimeout(()=>banner(B.opening==='ambush'?'Ambush! They\'re slow to react':'Surprised! They strike first',B.opening==='ambush'?'#39ff8a':'#ff5d6c'),300);
  hud(true);
}
// the deck's Charge cards down to their last use or two, for the victory screen and camp
function lowChargeNote(){ const d=activeDeck(), out=[]; for(const id of [...new Set(d?d.list:[])]){ const c=CARDS[id]; if(!c||!c.uses) continue; const lo=lowCharge(c); if(lo!=null&&(lo<=1||lo/c.uses<=.25)) out.push(c.name+' '+lo+'/'+c.uses); }
  return out.length?' Low on charges: '+out.join(', ')+'. Recharge at the camp shop or they burn up.':''; }
// charge uses spent this fight carry over; a copy that ran dry burns up
function settleCharges(){ const burned=settleChargeUses(save,B.piles); persist();
  return burned.length?' Burned up: '+burned.map(x=>x.card.name+(x.n>1?' ×'+x.n:'')).join(', ')+'.':''; }
function victory(){
  if(B.lab) return labEnd(true);
  const b=B, boss=b.enemies.some(e=>e.def.boss);
  const rw=battleRewards(b.enemies.filter(e=>!e.def.minion).map(e=>e.def.outlaw?e.weak:e.color),b.depth,boss,null,save.owned);
  if(b.bonusGold) rw.gold+=b.bonusGold;   // the Gilded Ruins' gold tiles
  const rareX=typeof rareLoot==='function'?rareLoot(b,rw):null;   // a rare foe's great loot (rares.js)
  const outlaws=b.enemies.filter(e=>e.def.outlaw).length; if(outlaws) rw.gold=Math.round(rw.gold*(1+.2*outlaws));   // outlaws carry coin
  if(rw.gold) rw.gold=Math.round(rw.gold*(1+(gearMods(save).gold||0)));   // Ring of Fortune
  if(b.tier) rw.gold=Math.round(rw.gold*(1+.2*b.tier));   // foes the stirring dark made stronger carry more
  const xp=Math.round(fightXp(b.enemies.map(e=>({minion:e.def.minion,boss:e.def.boss,mini:e.def.mini})),b.depth)*(1+.25*(b.tier||0))*xpScale(save.level,b.depth)), lvUp=gainXp(save,xp);
  save.gold+=rw.gold; save.wins++; if(!b.explore&&!b.trial&&b.depth>=save.deepest) save.deepest=b.depth+1;
  const hpLeft=b.player.hp;
  const loot=rw.items.map(k=>({k, res:addLoot(save,k)}));
  const res=addCards(save,rw.cards); const burnt=settleCharges()+lowChargeNote();
  const depth=b.depth;
  const hero=rw.cards.find(c=>c.rarity==='hero');
  // a sealed pack, now and then: 2 area bosses in 5, 1 miniboss in 5 (opened before the victory screen)
  const mini=!boss&&b.enemies.some(e=>e.def.mini), pack=typeof packReward==='function'&&!b.trial&&(!!rareX||Math.random()<(boss?.4:mini?.2:0)), packC=pack?packFor(depth):null;
  const got=[...rw.cards.map(c=>c.name),...(rw.gold?[rw.gold+' gold']:[]),...rw.items.map(k=>{ const l=lootLabel(save,k); return l.icon+' '+l.name; })];
  logCamp((boss?'Boss defeated':'Won')+' at depth '+depth+'.','win'); got.forEach(g=>logCamp('Found '+g.replace(/^[^A-Za-z0-9]+/u,'')+'.',/gold$/.test(g)?'gold':'loot'));
  loot.forEach(l=>{ if(l.res&&l.res.cursed) logCamp(l.res.msg,'curse'); });
  // contracts (bounty.js) and colour mastery (mastery.js) count the win
  const bDone=typeof bountyWin==='function'?bountyWin(b,boss):[]; bDone.forEach(k=>logCamp('Contract complete: claim it at the Bounty board.','win'));
  const mUp=typeof masteryWin==='function'?masteryWin(b,boss):[]; mUp.forEach(m=>logCamp(cName(m.color)+' mastery level '+m.level+'!','win'));
  const show=()=>{
  if(bDone.length) setTimeout(()=>banner('📜 Contract complete!','#f2c94c'),300);
  if(mUp.length) setTimeout(()=>banner('★ '+cName(mUp[0].color)+' mastery '+mUp[0].level,COLORS[mUp[0].color].c),bDone.length?1900:300);
  reveal(hero?'♔ A hero joins you!':boss?'Boss defeated!':rareX?'★ Rare foe defeated!':b.rareFled?'It got away…':'Victory!',(hero?hero.name+' answers your call. ':'')+(rareX?'It leaves a hoard behind: +'+rareX.shards+' shards. ':b.rareFled?'The rare foe escaped with its loot. ':'')+(boss&&!b.trial?'The way down to '+areaOf(depth+1).name+' is open. ':'')+(b.explore?'Won in '+Math.round(b.time)+'s. ':'Depth '+depth+' cleared in '+Math.round(b.time)+'s. ')+(boss?'Boss rewards: ':'Your reward: ')+got.join(', ')+'.'+loot.map(l=>l.res&&l.res.cursed?' '+l.res.msg:l.res&&l.res.ok?' You put it on.':'').join('')+burnt,res,
    b.explore?[['Keep exploring',()=>{ const ruleOK=!!(b.rule&&b.rule.ok); B=null; resumeExplore(hpLeft,true,{ruleOK}); }]]
    :[['Camp',()=>{ B=null; pickDepth=depth+1; openCamp(); },true],['Depth '+(depth+1)+' →',()=>fight(depth+1)]],
    [{pic:'<b class="xpic">XP</b>',name:'+'+xp+' XP',text:lvUp?'Level '+save.level+'! +'+(lvUp*LEVEL_POINTS)+' stat points':xpLine()},...(rw.gold?[{pic:uiIcon('coin',64),name:rw.gold+' gold',text:'Spend it on packs in the shop'}]:[]),...rw.items.map(k=>Object.assign(lootLabel(save,k),{pic:lootPic(k)}))]);
  };
  if(pack){ logCamp('Won a sealed '+packName(packC)+'.','loot'); packReward(packC,depth,show); } else show();
}
function defeat(){
  if(B.lab) return labEnd(false);
  const lost=Math.floor(save.gold*.2); save.gold-=lost; const burnt=settleCharges();
  const depth=B.depth, xp=B.explore;
  // a sanctuary's blessing (dungeon.js): you wake at the floor's stairs up instead, for half the gold
  if(xp&&typeof xTryRevive==='function'&&xTryRevive()){ save.gold+=lost-Math.floor(lost/2); persist(); logCamp('A shrine pulled you back from defeat at depth '+depth+'.','win');
    return reveal('Pulled back','You fell, but the shrine’s blessing carries you back to the stairs up at half health. You dropped '+Math.floor(lost/2)+' gold.'+burnt,[],[['Get up',()=>{ B=null; xRevived(); }]]); }
  let body=null; if(xp&&typeof xDropBody==='function'){ body=xDropBody(depth,lost); persist(); }
  logCamp('Fell at depth '+depth+', dropped '+lost+' gold.'+(body&&save.corpse?' Your body lies there.':''),'curse');
  if(xp&&typeof stopExplore==='function'){ stopExplore(); EX=null; XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; }
  reveal('Defeated…','You fell at depth '+depth+' and dropped '+lost+' gold.'+(body?xBodyNote(body):' Your cards are safe.')+burnt,[],
    xp?[['Camp',()=>{ B=null; openCamp(); },true],...(peekPoint()?[['Load save',()=>loadPoint()]]:[])]:[['Camp',()=>{ B=null; openCamp(); },true],['Retry',()=>fight(depth)]]);
}
// leaving a fight early: a battle-only fight costs nothing; fleeing a dungeon fight costs 10% of
// your gold and the floor; a fight you have already lost still counts as a defeat
function leaveFight(){ paused=false; $('#custom').classList.remove('on');
  if(B.lab){ if(B.lab.move) return mlabExit(); B=null; return openLab(); }
  if(B.phase==='lose'||B.player.hp<=0) return defeat();
  const burnt=settleCharges(); if(burnt) tip(burnt.trim());
  if(B.explore){ fleeCost('Fled a fight at depth '+B.depth); if(typeof stopExplore==='function'){ stopExplore(); EX=null; XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; } }
  B=null; openCamp(); }
/* Running from a fight. The Run button (on the Spell screen, beside its title) asks what you drop to get away:
   15% of your gold (at least 10), or a random card: one this run found if you are in the dungeon,
   otherwise a spare card no deck needs. In the dungeon you land back on the map with your run
   intact, and the foes you ran from stand dazed for 4 s; from a battle-only fight you go to camp.
   Run is on the Spell (card) screen and in the pause menu. Bosses and boss tests can't be run from. */
const runCost=()=>Math.max(10,Math.floor(save.gold*.15));
function runLootPool(){ const out=[];
  if(B&&B.explore&&typeof XRUN!=='undefined'&&XRUN&&XRUN.snap) for(const id in save.owned){ if(CARDS[id]&&save.owned[id]-(XRUN.snap.owned[id]||0)>0&&CARDS[id].rarity!=='hero') out.push(id); }
  if(!out.length) for(const id in save.owned) if(CARDS[id]&&CARDS[id].rarity!=='hero'&&!CARDS[id].mastery&&spareCopies(save,id)>0) out.push(id);
  return out; }
const runBlocked=()=>B&&B.pvp?'You can’t run from a duel':!B||(B.phase!=='fight'&&B.phase!=='custom')?'':B.trial?'This is a test: end it from the pause menu':B.enemies.some(e=>e.def.boss&&e.hp>0)?'You can’t run from a boss':'';
function openRun(){ if(!B||(B.phase!=='custom'&&B.phase!=='fight')) return; const why=runBlocked(); if(why) return tip(why);
  paused=true; B.player.charging=false; $('#btnWand').classList.remove('charging');
  const cost=runCost(), pool=runLootPool(), found=B.explore&&typeof XRUN!=='undefined'&&XRUN&&XRUN.snap&&pool.some(id=>save.owned[id]-(XRUN.snap.owned[id]||0)>0);
  $('#runText').textContent=(B.explore?'You get away and land back in the dungeon; the foes are dazed for a moment.':'You get away and go back to camp.')+' Drop something to cover your escape:';
  const g=$('#runGold'); g.innerHTML=uiIcon('coin',22)+' Drop '+cost+' gold'; g.disabled=save.gold<cost;
  const c=$('#runCard'); c.textContent='Drop a random card'+(pool.length?found?' this run found':' (a spare one)':''); c.disabled=!pool.length;
  if(g.disabled&&c.disabled){ g.disabled=false; g.innerHTML=uiIcon('coin',22)+' Drop all '+save.gold+' gold'; }
  $('#runSheet').classList.add('on'); }
function closeRun(){ $('#runSheet').classList.remove('on'); paused=false; }
function doRun(kind){ const b=B; $('#runSheet').classList.remove('on'); if(b&&b.pvp){ paused=false; return; }   // a duel has no Run: it costs gold and ends the battle without leaving the session
  if(!b||(b.phase!=='custom'&&b.phase!=='fight')){ paused=false; return; }
  $('#custom').classList.remove('on');
  let lost;
  if(kind==='gold'){ const c=Math.min(save.gold,runCost()); save.gold-=c; lost=c+' gold'; }
  else { const id=pick(runLootPool()); save.owned[id]--; if(save.owned[id]<=0) delete save.owned[id];
    for(const d of save.decks){ while(d.list.filter(x=>x===id).length>(save.owned[id]||0)) d.list.splice(d.list.lastIndexOf(id),1); }
    lost=CARDS[id].name; }
  persist(); logCamp('Ran from a fight at depth '+b.depth+' and dropped '+lost+'.','curse');
  // the getaway: a puff of smoke, then out
  paused=false; b.phase='fled'; const p=b.player; burst(p.tile,'#e6f4ff',26,1); ring(p.tile,'#e6f4ff',1.6,.45,6); floater('Got away!',p.tile,'#e6f4ff',true); p.invT=9;
  setTimeout(()=>{ if(B!==b) return; const burnt=settleCharges(), hp=p.hp; B=null;
    if(b.explore&&typeof resumeExplore==='function'&&typeof EX!=='undefined'&&EX){ resumeExplore(hp,false,{fled:true}); if(typeof xLog==='function') xLog('You got away, dropping '+lost+'.','bad'); }
    else openCamp();
    tip('You got away · dropped '+lost+(burnt?' ·'+burnt:''),2500); },750); }
$('#btnRun').onclick=openRun;
$('#runGold').onclick=()=>doRun('gold');
$('#runCard').onclick=()=>doRun('card');
$('#runStay').onclick=closeRun;
$('#runSheet').addEventListener('pointerdown',e=>{ if(e.target.id==='runSheet') closeRun(); });
function fleeCost(what){ const lost=Math.floor(save.gold*.1); save.gold-=lost; persist(); logCamp(what+' and dropped '+lost+' gold.','curse'); tip('You flee to camp and drop '+lost+' gold'); }
// the card you cast pops up large and flies onto the board, Hearthstone style
/* How a cast card shows (Settings › Cast card): big (the full card mid-screen), side (a small card
   at the left edge), ribbon (only its name, under the top bar) or ghost (the big card, faint and quick).
   Only big covers the enemies for long; the others keep the board clear. */
const CAST_FX=['big','side','ribbon','ghost'], CAST_FX_NAME={big:'Big',side:'Side',ribbon:'Ribbon',ghost:'Ghost'};
const castFxMode=()=>{ let m='big'; try{ m=localStorage.getItem('hexmancers-castfx')||'big'; }catch(e){} return CAST_FX.includes(m)?m:'big'; };
function showCast(c,inst){ const box=$('#castFx'), rib=$('#castRib'), mode=castFxMode(), combo=inst&&inst.combo?inst.combo.split(':')[0]:'';
  box.innerHTML=''; rib.innerHTML=''; box.className='cast-fx '+mode;
  if(mode==='ribbon'){ const d=document.createElement('div'); d.className='rib'; d.style.setProperty('--c',COLORS[c.color].c);
    d.innerHTML=`<b>✦ ${esc(c.name)}</b>${combo?`<span>${esc(combo)}</span>`:''}`; rib.appendChild(d); return; }
  box.appendChild(cardEl(c,combo?`<span class="tag">✦ ${esc(combo)}</span>`:'')); }
function applyCastFx(){ const b=$('#setCastFx'); if(b) b.textContent=CAST_FX_NAME[castFxMode()]; }
$('#setCastFx').onclick=()=>{ const m=CAST_FX[(CAST_FX.indexOf(castFxMode())+1)%CAST_FX.length]; try{ localStorage.setItem('hexmancers-castfx',m); }catch(e){} applyCastFx(); };
applyCastFx();
function banner(text,color){ const b=$('#banner'); b.textContent=text; b.style.setProperty('--bc',color); b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
// phone helpers: a short buzz on hits, a pause menu, full screen
const buzz=ms=>{ try{ navigator.vibrate&&navigator.vibrate(ms); }catch(e){} };
let paused=false;
/* ---------------- pause ----------------
   One pause menu for the dungeon and the battle. The ⋯ button, Esc, or switching away from the
   game opens it; what "leave" does depends on where you are. */
function pauseWhere(){ if(B&&$('#scrBattle').classList.contains('on')) return B.trial?'trial':B.explore?'xfight':'battle';
  if(typeof EX!=='undefined'&&EX&&EX.active&&$('#scrExplore').classList.contains('on')) return 'map'; return null; }
function openPause(){ const w=pauseWhere(); if(!w||$('#pause').classList.contains('on')) return;
  if(w==='map'){ if(EX.busy) return; xPause(true); } else { if(B.phase!=='fight') return; paused=true; B.player.charging=false; $('#btnWand').classList.remove('charging'); }
  const d=w==='map'?EX.depth:B.depth, onStairs=w==='map'&&EX.pc===EX.up;
  $('#pauseWhere').textContent='Depth '+d+' · '+areaLabel(d);
  $('#pauseHint').textContent=w==='map'?'Tap a spot to walk there, or hold to walk toward your finger. Search for secret doors and traps, and disarm a trap before you cross it.'
    :'Tap your side of the board to move and the enemy side to aim lobs. Hold Fire to charge a shot; open Spell when it glows.';
  const L=$('#mLeave'); delete L.dataset.armed;
  L.textContent=w==='trial'?'End the test':w==='battle'||w==='xfight'?'Give up the fight':onStairs?'Climb to camp':'Flee to camp · lose 10% gold';
  L.hidden=(w==='battle'||w==='xfight')&&!runBlocked();   // to get out of an ordinary fight, Run (here or on the Spell screen)
  $('#mRun').hidden=!((w==='battle'||w==='xfight')&&B&&!B.lab&&!runBlocked());
  pausePoint();
  if(B&&B.pvp&&w==='battle'){ L.textContent='Leave the duel'; L.hidden=false; $('#mRun').hidden=true; $('#mSave').disabled=$('#mLoad').disabled=true; }   // a duel: no Run (it costs gold), no save points, Leave gives up and tells the other player
  $('#pause').classList.add('on'); setTimeout(()=>$('#mResume').focus(),30); }
// the save point line and buttons on the pause screen (savepoint.js)
function pausePoint(){ const P=peekPoint(), why=canSavePoint(), S=$('#mSave'), L=$('#mLoad'); delete S.dataset.armed; delete L.dataset.armed; S.textContent='Save game'; L.textContent='Load save';
  S.disabled=!!why; L.disabled=!P;
  $('#mPoint').textContent=(P?'Save point: depth '+P.depth+' · Lv '+P.level+' · '+agoText(P.time)+'.':'No save point yet.')+(why?' '+why:''); }
$('#mSave').onclick=e=>{ const go=()=>{ const r=savePoint(); tip(r.msg); pausePoint(); }; if(peekPoint()) armed(e.currentTarget,'Tap to overwrite',go); else go(); };
$('#mLoad').onclick=e=>armed(e.currentTarget,'Tap to load',()=>{ if(!loadPoint()) tip('No save point'); });
function closePause(){ if(!$('#pause').classList.contains('on')) return; $('#pause').classList.remove('on'); paused=false; if(typeof xPause==='function') xPause(false); }
$('#btnMenu').onclick=openPause;
$('#xMenu').onclick=openPause;
$('#mResume').onclick=closePause;
$('#mRun').onclick=()=>{ $('#pause').classList.remove('on'); openRun(); };
$('#mSettings').onclick=()=>openSettings();
$('#mLeave').onclick=e=>{ const w=pauseWhere(); if(!w) return closePause();
  if(w==='map'&&EX.pc===EX.up){ closePause(); return xToCamp(); }   // free from the stairs up, and the floor waits for you
  armed(e.currentTarget,w==='battle'||w==='trial'?'Tap again to leave':'Tap again to flee',()=>{ $('#pause').classList.remove('on');
    if(w==='map'){ xPause(false); fleeCost('Fled depth '+EX.depth); stopExplore(); EX=null; XPARK=null; if(typeof XRUN!=='undefined') XRUN=null; openCamp(); }
    else if(B&&B.pvp) duelLeave();
    else leaveFight(); }); };
const isFull=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
let fullByUs=false;   // true while the player asked to leave full screen, so that exit does not pause
function toggleFull(){ const d=document, el=d.documentElement;
  try{ if(isFull()){ fullByUs=true; (d.exitFullscreen||d.webkitExitFullscreen).call(d); } else{ const r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el); if(r&&r.catch) r.catch(()=>tip('Full screen is not available here')); } }catch(e){ tip('Full screen is not available here'); } }
$('#mFull').onclick=toggleFull; $('#setFull').onclick=toggleFull;
function onFullChange(){ lockOrient(); setTimeout(applyViewport,120); document.querySelectorAll('.fullBtn').forEach(b=>b.textContent=isFull()?'Exit full screen':'Full screen'); setTimeout(resizeView,50);
  // thrown out of full screen by the system (an iPad pinch, a swipe): pause so the fight waits
  // and the pause menu's Full screen button is one tap away
  if(!isFull()&&!fullByUs&&pauseWhere()&&!$('#pause').classList.contains('on')) openPause();
  if(!isFull()) fullByUs=false; }
document.addEventListener('fullscreenchange',onFullChange); document.addEventListener('webkitfullscreenchange',onFullChange);
/* iPad Safari reads two thumbs on the screen (Fire plus Cast, or moving while firing) as a pinch,
   and a pinch zooms the page or closes full screen. Nothing in the game uses pinch, so swallow
   WebKit's gesture events and any multi-finger move before the browser acts on them. */
['gesturestart','gesturechange','gestureend'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
// (a touchmove the browser has already begun scrolling can't be cancelled; asking only logs a warning)
document.addEventListener('touchmove',e=>{ if(e.cancelable&&(e.touches.length>1||(e.scale!=null&&e.scale!==1))) e.preventDefault(); },{passive:false});
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ openPause(); return; } backFromBackground(); });
/* Back from the background: a phone browser often sends a stale size (or none) while the page is
   hidden, which left the layout sized for the wrong screen and the Fire and Cast bar off screen.
   Measure everything again now and once more after the browser settles, and drop any held input. */
function backFromBackground(){ const again=()=>{ applyViewport(); if(B&&$('#scrBattle').classList.contains('on')){ View.cave=null; resizeView(); } };
  if(B&&B.player){ B.player.charging=false; $('#btnWand').classList.remove('charging'); }
  again(); setTimeout(again,250); setTimeout(again,1000); }
addEventListener('pageshow',e=>{ if(e.persisted) backFromBackground(); });
addEventListener('focus',()=>{ if(!document.hidden) setTimeout(()=>{ applyViewport(); },100); });
// safety net: if the battle controls ever end up off screen or squashed to nothing, lay the screen out again
let ctrlCheckT=0;
function checkControls(dt){ if((ctrlCheckT-=dt)>0) return; ctrlCheckT=1;
  const b=$('#btnCast'), r=b&&b.getBoundingClientRect(); if(!r) return;
  if(r.width<8||r.height<8||r.bottom>innerHeight+2||r.top<-2||r.right>innerWidth+2||r.left<-2){ applyViewport(); View.cave=null; resizeView(); } }
// Esc opens and closes the pause menu (the settings screen takes Esc first while it is open)
window.addEventListener('keydown',e=>{ if(e.key!=='Escape') return; if($('#pause').classList.contains('on')){ e.preventDefault(); closePause(); } else if(pauseWhere()){ e.preventDefault(); openPause(); } });

// the combos a queue makes, as gold chips
// a recipe you have never cast keeps its name hidden until you do
const recipeKnown=r=>!!(save.recipes||{})[r.id];
function comboChips(combos){ return combos.length?combos.map(c=>c.kind==='recipe'&&!recipeKnown(c.recipe)?`<span class="rcp">⚗ Unknown recipe!</span>`:`<span>${c.kind==='recipe'?'⚗':'✦'} ${esc(c.label)}</span>`).join(''):''; }
/* Recipes you could make from your hand and queue right now: each with the uids of the cards it
   would use. The Spell screen names them in a line and makes those cards glow purple. */
function recipesInHand(p){ const pool=[...p.queue,...p.hand].filter(c=>!c.temp), out=[];
  for(const r of (typeof RECIPES!=='undefined'?RECIPES:[])){ const used=[], free=pool.slice();
    for(const id of r.cards){ const i=free.findIndex(c=>c.card.id===id); if(i<0){ used.length=0; break; } used.push(free.splice(i,1)[0].uid); }
    if(used.length===r.cards.length) out.push({r, uids:used}); }
  return out; }
/* The hand's drawer on the Spell screen: drag the grip up or down for more or less hand (a tap switches
   between a big hand and the usual split); hold it still for a moment, then slide sideways to make the
   cards bigger (right) or smaller (left). Both are remembered in this browser. */
(function(){ const grip=$('#custGrip'), dr=$('#custDrawer'), hand=$('#custHand'), pan=dr&&dr.parentElement; if(!grip) return;
  const HK='hexmancers-custh', WK='hexmancers-custcw', get=k=>{ try{ const v=localStorage.getItem(k); return v==null?null:+v; }catch(e){ return null; } }, put=(k,v)=>{ try{ localStorage.setItem(k,String(v)); }catch(e){} };
  const tall=()=>!document.body.classList.contains('lsS')&&!document.body.classList.contains('wide');
  const setH=h=>{ const max=Math.max(140,pan.clientHeight-90); h=Math.round(Math.max(110,Math.min(max,h))); pan.style.setProperty('--custH',h+'px'); return h; };
  const setW=w=>{ w=Math.round(Math.max(56,Math.min(240,w))); hand.style.setProperty('--cardw',w+'px'); return w; };   // the card grid's own width (style.css --cardw)
  const fit=()=>{ const h=get(HK), w=get(WK); if(h!=null&&tall()) setH(h); if(w!=null) setW(w); };
  new MutationObserver(()=>requestAnimationFrame(fit)).observe($('#custom'),{attributes:true,attributeFilter:['class']}); addEventListener('resize',fit);
  const P=e=>typeof appXY==='function'?appXY(e.clientX,e.clientY):[e.clientX,e.clientY];
  let d=null;
  grip.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); try{ grip.setPointerCapture(e.pointerId); }catch(_){} const [x,y]=P(e);
    const c=hand.querySelector('.card'); d={id:e.pointerId,x0:x,y0:y,h0:dr.offsetHeight,w0:c?c.offsetWidth:90,mode:null,t0:e.timeStamp};
    d.timer=setTimeout(()=>{ if(d&&!d.mode){ grip.classList.add('sizing'); if(navigator.vibrate) try{ navigator.vibrate(12); }catch(_){} } },320); grip.classList.add('on'); });
  grip.addEventListener('pointermove',e=>{ if(!d||e.pointerId!==d.id) return; const [x,y]=P(e), dx=x-d.x0, dy=y-d.y0;
    // the first real move decides, by the time since the finger went down: held still first -> card size, else the drawer's height
    if(!d.mode&&Math.hypot(dx,dy)>6){ d.mode=e.timeStamp-d.t0>=320?'size':tall()&&Math.abs(dy)>=Math.abs(dx)?'height':null; if(d.mode==='size') grip.classList.add('sizing'); clearTimeout(d.timer); }
    if(d.mode==='height') setH(d.h0-dy);
    else if(d.mode==='size') setW(d.w0+dx*.6); });
  const end=e=>{ if(!d||e.pointerId!==d.id) return; const D=d; d=null; clearTimeout(D.timer); grip.classList.remove('on','sizing');
    if(D.mode==='height') put(HK,dr.offsetHeight);
    else if(D.mode==='size'){ const v=parseFloat(hand.style.getPropertyValue('--cardw')); if(v) put(WK,v); }
    else if(!D.mode&&e.type==='pointerup'&&tall()&&e.timeStamp-D.t0<320){ const big=pan.clientHeight*.8; dr.style.transition='height .2s'; put(HK,setH(D.h0>big*.9?pan.clientHeight*.52:big)); setTimeout(()=>dr.style.transition='',250); } };
  grip.addEventListener('pointerup',end); grip.addEventListener('pointercancel',end); grip.addEventListener('contextmenu',e=>e.preventDefault()); })();
function renderCustom(){
  // a card under a finger is not rebuilt: the new element would never hear that finger lift (the tap was lost, then
  // the hold timer popped the card up). The press's own end draws the screen again.
  if(drag&&drag.el.isConnected&&$('#custom').classList.contains('on')){ drag.redraw=true; return; }
  const p=B.piles, dealt=B.justDrawn||new Set();
  if(!$('#custom').classList.contains('on')){ custShownT=performance.now(); custPressed=false; dragAbort(); }
  $('#custom').classList.add('on');
  renderChoose();
  $('#custPiles').textContent='Deck '+p.draw.length+' · Discard '+p.discard.length;
  const combos=detectCombos(p.queue), inCombo=new Set();
  for(const cb of combos){ if(cb.kind==='simple') p.queue.forEach(c=>{ if(c.card.id===cb.id) inCombo.add(c.uid); }); else p.queue.forEach(c=>{ if(!isDeckTool(c.card)) inCombo.add(c.uid); }); }
  $('#custCombo').innerHTML=comboChips(combos)||'<span class="none">No combo yet</span>';
  const q=$('#custQueue'); q.innerHTML='';
  const slots=slotsOf(p), runeNow=p.queue.map(c=>c.card.code).find(k=>k&&k!=='✱');
  const four=(p.slots||RULES.slots)>RULES.slots, fourth=p.surge==='luck'?'any card':p.surge==='recipe'?'the recipe\'s last card':p.surge==='✱'?'any card with a rune':'only '+p.surge+' or ✱';
  $('#custSurge').innerHTML=!four?'':p.surge==='luck'?`<b>ᚱ Rune Surge!</b> Your gear opened a 4th slot this hand: any card fits.`
    :p.surge==='recipe'?`<b>⚗ Rune Surge!</b> 3 cards of a 4-card recipe opened the 4th slot: only the recipe's last card fits.`
    :`<b>ᚱ Rune Surge (${p.surge})!</b> 3 queued ${p.surge} cards opened a 4th slot: ${p.surge==='✱'?'any card with a rune fits':'only an '+p.surge+' card (or ✱) fits'} it.`;
  q.classList.toggle('four',four);
  const ready=recipesInHand(p), inRecipe=new Set(ready.flatMap(x=>x.uids));
  const inQ=new Set(p.queue.map(c=>c.uid));
  $('#custRecipe').innerHTML=ready.map(({r,uids})=>`<b>⚗ ${recipeKnown(r)?'Recipe in hand: '+esc(r.name)+'.':'A hidden recipe is in your hand!'}</b> `
    +(uids.every(u=>inQ.has(u))&&p.queue.length===r.cards.length?'Ready: press Fight! to fuse them.':r.cards.length>slots?'Queue 3 of its cards to open the 4th slot.':'Queue the glowing cards together, on their own.')).join('<br>');
  for(let i=0;i<slots;i++){
    const inst=p.queue[i];
    if(inst){ const tool=isDeckTool(inst.card), n=tool&&toolLock(inst.card);
      const el=cardEl(inst.card,`<span class="ord">${i+1}</span>`+instBadge(inst,true)+(tool?`<span class="primer">Double-tap to use<small>shuts this slot ${n>1?'for '+n+' hands':'this hand'}</small></span>`:''));
      el.dataset.zone='queue'; el.dataset.i=i; enchMark(el,inst); if(inCombo.has(inst.uid)) el.classList.add('combo'); if(tool) el.classList.add('primed'); dragCard(el,inst); q.appendChild(el); }
    else { const s=document.createElement('div'); s.className='slot'; s.dataset.zone='queue'; s.dataset.i=i; s.innerHTML='Slot '+(i+1)+(i===RULES.slots?'<small>'+fourth+'</small>':''); q.appendChild(s); }
  }
  // slots shut by a deck tool: they open again at the next hand (or later, if the card says so)
  for(const l of p.locks||[]){ const s=document.createElement('div'); s.className='slot shut';
    s.innerHTML='🔒 Shut<small>'+esc(l.name)+(l.n>1?' · '+l.n+' hands':'')+'</small>'; q.appendChild(s); }
  const h=$('#custHand'); h.innerHTML='';
  const base=combos.length, lay=handLayout(p), byUid=new Map(p.hand.map((c,i)=>[c.uid,i]));
  // a queued card leaves an empty outline where it sat, so the rest of the hand stays put
  lay.forEach(u=>{ if(byUid.has(u)) return; const s=document.createElement('div'); s.className='slot hole'; s.dataset.zone='hand'; s.dataset.uid=u;
    const nxt=lay.slice(lay.indexOf(u)+1).find(v=>byUid.has(v)); s.dataset.i=nxt==null?p.hand.length:byUid.get(nxt); s.style.order=lay.indexOf(u); h.appendChild(s); });
  p.hand.forEach((inst,i)=>{ const el=cardEl(inst.card,instBadge(inst)); el.title='Key '+(i+1)+(isInstant(inst.card)?' · tap to use now':isDeckTool(inst.card)?' · put it in a slot, then double-tap it':'');
    if(isInstant(inst.card)) el.classList.add('instant');
    el.dataset.zone='hand'; el.dataset.i=i; enchMark(el,inst); if(choose&&choose.kind==='keep') el.classList.add(choose.sel.has(inst.uid)?'keepsel':'keepoff');
    // glow if adding this card to the queue would make a new combo
    if(inRecipe.has(inst.uid)) el.classList.add('recipe-ready');   // part of a recipe you can make right now: purple
    else if(isInstant(inst.card)) {}
    else if(p.queue.length===RULES.slots&&four&&!fitsFourth(p,inst.card)) el.classList.add('nofit');   // won't fit the 4th slot
    else if(p.queue.length<slots&&detectCombos([...p.queue,inst]).length>base) el.classList.add('hint');
    else if(p.queue.length&&p.queue.length<slots&&recipeStep([...p.queue.map(c=>c.card),inst.card])&&!oneRune([...p.queue.map(c=>c.card),inst.card])) el.classList.add('recipe-step');   // part of a recipe with what is queued
    else if(p.queue.length&&oneRune([...p.queue.map(c=>c.card),inst.card])) el.classList.add('rune-match');   // same rune as the queue
    // a kit card's frame is its ::after, so its combo or recipe tag is an element of its own
    if(el.classList.contains('kit')){ const tg=el.classList.contains('hint')?['combo','hint']:el.classList.contains('recipe-ready')?['⚗ recipe','recipe']:null;
      if(tg){ const i=document.createElement('i'); i.className='k-tag '+tg[1]; i.textContent=tg[0]; el.appendChild(i); } }
    if(dealt.has(inst.uid)){ el.classList.add('deal'); el.style.animationDelay=(i*.06)+'s'; }
    el.style.order=lay.indexOf(inst.uid); el.dataset.uid=inst.uid; dragCard(el,inst); h.appendChild(el); });
  B.justDrawn=null;
  $('#custAce').innerHTML=B.sidearm?`<b>♠ Sidearm:</b> ${esc(B.sidearm.name)} ×${B.sidearm.mult.toFixed(1)}`:(B.acePending||[]).length?`<b>♤</b> ${B.acePending.length} Ace Enchantment${B.acePending.length>1?'s':''} waiting for an Ace`:'';
  $('#custEmpty').textContent=wandOnly(p)?'Your deck is empty. Fight on with your wand!':!p.draw.length?'Deck empty: these are your last cards.':'';
  const empty=Math.max(0,RULES.slots-p.queue.length);
  $('#btnFight').textContent=duelFightText()||'Fight!';   // a duel's shared screen: its countdown, then Waiting for opponent (empty slots no longer draw extra: the hand holds 6 at most)
}
// a Charge card's uses, big on the card: white while it has plenty, yellow at half, red at a quarter or its last one
function chargeBadge(left,max){ const f=left/Math.max(1,max), cls=left<=1||f<=.25?' low':f<=.5?' mid':''; return `<span class="chg${cls}" title="${left} of ${max} uses left">${left}/${max}</span>`; }
// the copy you own with the fewest uses left (for the collection and the deck builder), or null
function lowCharge(c){ if(!c.uses||!save||!save.owned[c.id]) return null; let lo=c.uses; for(let k=0;k<save.owned[c.id];k++) lo=Math.min(lo,chargeLeft(save,c.id,k)); return lo; }
const chargeMark=c=>{ const lo=lowCharge(c); return lo==null?'':chargeBadge(lo,c.uses); };
// small marks on a card in hand or queue: Charge uses left, a Tinker upgrade, an instant
function instBadge(inst,inQueue){ let h='';
  if(inst.card.uses&&!inst.temp) h+=chargeBadge(inst.left==null?inst.card.uses:inst.left,inst.card.uses);
  if(enchant&&enchant.inst===inst) h+=`<span class="badge inst arm">Tap a card to enchant</span>`;
  if(inst.tinker) h+=`<span class="badge tink">✚ +${Math.round(inst.tinker*100)}%</span>`;
  else if(!inQueue&&isInstant(inst.card)) h+=`<span class="badge inst">✧ tap</span>`;
  else if(!inQueue&&isDeckTool(inst.card)) h+=`<span class="badge inst">✧ slot</span>`;
  return h; }
/* Deck tools on the hand screen: one tap on a tool in a slot takes it back out (after a short wait),
   two taps use it. */
let toolTapT=null;
function toolTap(inst){
  if(toolTapT&&toolTapT.uid===inst.uid){ clearTimeout(toolTapT.timer); toolTapT=null; fireTool(inst); return; }
  if(toolTapT) clearTimeout(toolTapT.timer);
  toolTapT={uid:inst.uid, timer:setTimeout(()=>{ toolTapT=null; if(B&&B.phase==='custom'){ toggleQueue(B.piles,inst.uid); renderCustom(); } },320)}; }
function fireTool(inst){ const c=inst.card, P=B.piles, before=new Set(P.hand.map(x=>x.uid)), n=toolLock(c);
  const done=()=>{ const got=P.hand.filter(x=>!before.has(x.uid)), shut=' · slot shut '+(n>1?'for '+n+' hands':'this hand');
    tip((c.util==='search'?(got.length?'Found: '+got[0].card.name:handRoom(P)?'Nothing found':'Hand full'):'Drew '+got.length+' new card'+(got.length===1?'':'s'))+shut);
    buzz(14); renderCustom(); hud(true); };
  if(c.util==='keep') return startChoose('keep',inst,ch=>{ useDeckTool(inst,ch); done(); });
  if(c.util==='search'){ if(!handRoom(P)){ tip('Hand full'); return; }
    // the 3 it turns up stay the same for this hand, so Cancel and use again can't reroll them
    const offer=(inst.offer||[]).filter(x=>P.draw.includes(x)); if(!offer.length) inst.offer=searchOffer(c,3); else inst.offer=offer;
    if(!inst.offer.length){ tip('Nothing in your deck for '+c.name); return; }
    return startChoose('search',inst,ch=>{ inst.offer=null; useDeckTool(inst,ch); done(); }); }
  useDeckTool(inst); done(); }
/* Keep and Search are chosen right on the hand screen, no other window: Keep marks the hand cards you tap (gold)
   until Done; Search turns up 3 random cards it can find, laid out above your hand, and you keep the one you tap. Cancel leaves the
   card unused. */
let choose=null;
function startChoose(kind,inst,fire){ choose={kind,inst,fire,sel:new Set()}; buzz(8); renderCustom(); }
function endChoose(ok){ const c=choose; choose=null; if(!c) return;
  if(ok) c.fire(c.kind==='keep'?{keep:new Set(c.sel)}:{uid:[...c.sel][0]}); else renderCustom(); }
function renderChoose(){ const bar=$('#custChoose'), deck=$('#custDeck'), p=B.piles;
  bar.hidden=!choose; deck.hidden=!(choose&&choose.kind==='search'); deck.innerHTML='';
  if(!choose) return;
  $('#chooseMsg').innerHTML=choose.kind==='keep'?'<b>✧ '+esc(choose.inst.card.name)+':</b> tap the cards to keep ('+choose.sel.size+'). The rest go back into your deck and you draw up to '+RULES.hand+'.'
    :'<b>✧ '+esc(choose.inst.card.name)+':</b> it turned up '+choose.inst.offer.length+' card'+(choose.inst.offer.length>1?'s':'')+' from your deck. Tap one to keep; the rest go back.';
  $('#chooseOk').hidden=choose.kind!=='keep';
  if(choose.kind==='search') choose.inst.offer.forEach(inst=>{ const el=cardEl(inst.card,'');
    el.onclick=()=>{ if(!choose) return; choose.sel=new Set([inst.uid]); endChoose(true); }; longPress&&longPress(el,inst.card); deck.appendChild(el); }); }
$('#chooseOk').onclick=()=>endChoose(true); $('#chooseNo').onclick=()=>endChoose(false);
/* Enchanting (Whetstone, Tempering Oil…): a tap on the instant arms it. "Tap a card to enchant" shows under it and
   the cards it can take glow; tap one (a queue tile, or a card on the hand screen) and it is enchanted for the battle:
   a blue glow and a ✚. Tap the instant again to put it away. */
let enchant=null;
function enchMark(el,inst){ if(inst.tinker) el.classList.add('ench'); if(enchantLive()&&enchantTargets(enchant.inst).includes(inst)) el.classList.add('enchable'); }
function enchantTargets(inst){ const P=B.piles; return [...P.queue,...P.hand].filter(x=>x!==inst&&!isInstant(x.card)&&!x.temp); }
function enchantLive(){ if(enchant&&(!B||!B.piles||!B.piles.hand.includes(enchant.inst))) enchant=null; return enchant; }
function tryEnchant(target){ if(!enchantLive()) return false; const inst=enchant.inst;
  if(!enchantTargets(inst).includes(target)){ tip('That card can\'t be enchanted'); return true; }
  enchant=null; useInstant(inst,{target}); buzz(14); hud(true); if(B.phase==='custom') renderCustom(); return true; }
/* Instants: a tap uses one at once. A Tinker arms (above); Keep is chosen on the hand screen. */
function tapInstant(inst){ const c=inst.card, P=B.piles;
  const done=()=>{ if(B.phase==='custom') renderCustom(); hud(true); };
  if(c.type==='tinker'){ if(enchant&&enchant.inst===inst){ if(performance.now()-enchant.t<400) return; enchant=null; done(); return; }   // tapped again: put it away (not the same tap's click)
    if(!enchantTargets(inst).length){ tip('Nothing to enchant'); return; }
    enchant={inst,t:performance.now()}; buzz(8); done(); return; }
  const pick=c.as==='utility'&&c.util==='keep';
  if(pick&&B.phase!=='custom'){ tip('Use '+c.name+' on the hand screen'); return; }
  if(pick) return startChoose(c.util,inst,ch=>{ useInstant(inst,ch); done(); });
  useInstant(inst); done(); }
/* Every card keeps its own spot in the hand for the whole fight: taking one into the queue leaves
   a gap, and it goes back to that gap when it returns, so cards never shuffle about. New cards
   take the spots at the end. The hand array is kept in this order (number keys follow it). */
function handLayout(p){ const inH=new Set(p.hand.map(c=>c.uid)), inQ=new Set(p.queue.map(c=>c.uid));
  const L=(B.handLay||[]).filter(u=>inH.has(u)||inQ.has(u)); for(const c of p.hand) if(!L.includes(c.uid)) L.push(c.uid);
  // trim gaps at the end, so an emptied hand does not keep a row of outlines
  while(L.length&&!inH.has(L[L.length-1])) L.pop();
  const pos=new Map(L.map((u,i)=>[u,i])); p.hand.sort((a,b)=>pos.get(a.uid)-pos.get(b.uid)); B.handLay=L; return L; }
// a card dropped on a spot in the hand takes that spot
function layDrop(uid,beforeUid){ const L=B.handLay||[]; const i=L.indexOf(uid); if(i>=0) L.splice(i,1);
  const j=beforeUid==null?-1:L.indexOf(beforeUid); if(j<0) L.push(uid); else L.splice(j,0,uid); }
/* Drag and drop on the Custom screen. A tap moves a card between hand and queue, a hold shows
   its detail, and a drag puts it exactly where it is dropped: a slot (swapping if full), a
   place in the hand, or back out of the queue. */
let drag=null;
/* Let go of a card drag without dropping it: its ghost (on <body>, so it outlives the hand screen) goes too.
   Also sweeps a ghost left by any drag that never heard its finger lift. */
function dragAbort(){ const d=drag; drag=null;
  if(d){ clearTimeout(d.timer); if(d.over) d.over.classList.remove('drop'); d.el.classList.remove('dragging'); }
  document.querySelectorAll('.drag-ghost').forEach(g=>g.remove()); }
function dragCard(el,inst){
  el.addEventListener('pointerdown',e=>{
    if(e.button>0) return;
    if(drag) dragAbort();   // a second finger on a card: the first one's drag ends (each finger is its own pointer)
    drag={el,inst,id:e.pointerId,t0:e.timeStamp,x0:e.clientX,y0:e.clientY,moved:false,long:false,ghost:null,over:null};
    drag.timer=setTimeout(()=>{ if(drag&&!drag.moved){ drag.long=true; peek(inst.card,true); } },450);
    try{ el.setPointerCapture(e.pointerId); }catch(_){}
  });
  el.addEventListener('pointermove',e=>{
    if(!drag||drag.el!==el||drag.id!==e.pointerId) return;
    if(!drag.moved&&Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>8){
      drag.moved=true; clearTimeout(drag.timer);
      const r=el.getBoundingClientRect(), g=el.cloneNode(true); g.classList.add('drag-ghost'); g.classList.remove('deal','hint');
      g.style.width=r.width+'px'; g.style.left=r.left+'px'; g.style.top=r.top+'px'; drag.dx=e.clientX-r.left; drag.dy=e.clientY-r.top;
      document.body.appendChild(g); drag.ghost=g; el.classList.add('dragging'); buzz(8); }
    if(drag.moved){ drag.ghost.style.left=(e.clientX-drag.dx)+'px'; drag.ghost.style.top=(e.clientY-drag.dy)+'px';
      const t=dropTarget(e.clientX,e.clientY); if(drag.over&&drag.over!==t) drag.over.classList.remove('drop'); if(t) t.classList.add('drop'); drag.over=t; }
  });
  const end=e=>{
    if(!drag||drag.el!==el||drag.id!==e.pointerId) return;
    clearTimeout(drag.timer); const d=drag; drag=null;
    if(d.redraw) setTimeout(()=>{ if(!drag&&B&&B.phase==='custom'&&$('#custom').classList.contains('on')) renderCustom(); },0);   // a redraw held back during the press
    if(d.ghost) d.ghost.remove(); if(d.over) d.over.classList.remove('drop'); el.classList.remove('dragging');
    // on a slow frame the hold timer can run after a quick tap has already lifted: the touch's own times decide
    if(d.long&&!d.moved&&e.type==='pointerup'&&e.timeStamp-d.t0<450){ d.long=false; peek(null,false); }
    const p=B.piles;
    if(d.moved){ const t=e.type==='pointercancel'?null:dropTarget(e.clientX,e.clientY);
      if(t){ const zone=t.dataset.zone, i=t.dataset.i!=null?+t.dataset.i:null, spot=t.dataset.uid;
        if(placeCard(p,d.inst.uid,zone,i)&&zone==='hand'&&spot&&spot!==String(d.inst.uid)) layDrop(d.inst.uid,isNaN(+spot)?spot:+spot); buzz(10); } }
    else if(!d.long){ if(choose){ if(choose.kind==='keep'&&p.hand.includes(d.inst)&&d.inst!==choose.inst){ choose.sel.has(d.inst.uid)?choose.sel.delete(d.inst.uid):choose.sel.add(d.inst.uid); buzz(6); }
        else if(choose.kind==='search') tip('Tap one of the cards it found, above your hand'); renderCustom(); return; }
      if(enchantLive()&&!isInstant(d.inst.card)){ tryEnchant(d.inst); return; }
      if(isInstant(d.inst.card)){ tapInstant(d.inst); return; }
      if(isDeckTool(d.inst.card)&&p.queue.includes(d.inst)){ toolTap(d.inst); return; }
      if(!toggleQueue(p,d.inst.uid)) tip(!slotsOf(p)?'Every slot is shut this hand':p.queue.length===RULES.slots&&slotsOf(p)>RULES.slots?'That card doesn\'t fit the 4th slot':p.queue.length>=slotsOf(p)?'The queue is full':'That card can\'t go in a slot'); }
    renderCustom();
  };
  el.addEventListener('pointerup',end); el.addEventListener('pointercancel',end);
  el.addEventListener('contextmenu',e=>e.preventDefault());
}
function dropTarget(x,y){ const el=document.elementFromPoint(x,y); return el&&el.closest('#custom [data-zone]'); }
$('#btnFight').onclick=()=>{ choose=null; if(B&&B.pvp) return duelFight(); closeCustomScreen(); };
/* The Custom button acts on the finger going down, so the screen opens while the finger is still
   on the glass, and the tap's click (sent when the finger lifts, however long it was held) lands on
   whatever is under it now. So a click on the Custom screen only counts when its press also began
   on the Custom screen after it opened. Keyboard presses (no pointer) always count. */
let custShownT=0, custPressed=false;
$('#custom').addEventListener('pointerdown',()=>{ custPressed=true; },true);
$('#custom').addEventListener('click',e=>{ if(e.detail!==0&&!custPressed){ e.stopPropagation(); e.preventDefault(); } },true);

/* ---------------- HUD ---------------- */
const last={};
function set(key,val,fn){ if(last[key]!==val){ last[key]=val; fn(val); } }
function hud(force){
  const b=B; if(!b) return; if(force) for(const k in last) delete last[k];
  const p=b.player, pl=b.piles;
  set('hp',p.hp+'/'+p.maxHp,()=>{ hpMeter($('#hpBar'),$('#hpTxt'),p.hp,p.maxHp); $('#hpBar').parentElement.style.setProperty('--k',Math.max(0,Math.min(1,p.hp/p.maxHp)).toFixed(3)); $('#hpNum').textContent=Math.max(0,Math.ceil(p.hp))+' / '+p.maxHp; });
  set('run',runBlocked()?0:1,()=>{ $('#btnRun').hidden=!!runBlocked(); });
  set('depth',b.depth+'|'+Math.ceil(b.wave),()=>{ const t=$('#depthTxt'); t.textContent='D'+b.depth+(b.waves.length>1?' · W'+(Math.ceil(b.wave)+1)+'/'+b.waves.length:''); t.title='Depth '+b.depth+' · '+areaOf(b.depth).name; t.style.color=areaOf(b.depth).glow; });
  set('piles',pl.draw.length+'|'+pl.hand.length+'|'+pl.discard.length+'|'+wandOnly(pl),()=>{ $('#pileDeck').textContent=wandOnly(pl)?'Deck empty · wand only':'Deck '+pl.draw.length; $('#pileHand').textContent='Hand '+pl.hand.length; });   // what you have used: on the Spell screen
  // Fire's charge: the glowing frame sweeps up the curve as you hold, and pulses when the charged shot is ready
  { const ch=p.charging?Math.min(1,p.chargeT/Math.max(.01,chargeNeed(p))):0;
    set('charge',Math.round(ch*40)+'|'+p.charging,()=>{ const w=$('#btnWand'); w.style.setProperty('--ch',ch.toFixed(3)); w.classList.toggle('chg',!!p.charging); w.classList.toggle('chfull',ch>=1); }); }
  set('gauge',Math.round(b.gauge*10),()=>{ const k=Math.max(0,Math.min(1,b.gauge/GAUGE_MAX)).toFixed(3); $('#btnCustom').style.setProperty('--k',k); $('#btnSpell').style.setProperty('--k',k); });
  const buffs=[]; if(p.barrier>0) buffs.push('🛡 '+Math.ceil(p.barrier)+' · '+Math.ceil(p.shieldT)+'s'); if(p.dodge) buffs.push('💨 Dodge'); if(p.invT>0) buffs.push('🌀 Phase');
  if(p.setT>0) buffs.push('ᚱ Wand ×2.5 '+Math.ceil(p.setT)+'s'); else if(p.powerT>0) buffs.push('⚡ Wand ×1.8 '+Math.ceil(p.powerT)+'s'); if(p.pactT>0) buffs.push('☾ Pact '+Math.ceil(p.pactT)+'s'); if(p.courageT>0) buffs.push('☀ Courage '+Math.ceil(p.courageT)+'s'); if(p.intervene) buffs.push('✟ Intervention');
  if(p.hero&&p.hero.hp>0) buffs.unshift('♔ '+p.hero.card.name.split(',')[0]+' · '+Math.ceil(p.hero.life)+'s');
  if(p.rootT>0) buffs.unshift('❦ Rooted '+p.rootT.toFixed(1)+'s');
  if(p.hexT>0) buffs.unshift('☾ Hexed '+Math.ceil(p.hexT)+'s (+30% damage taken)');
  if(p.hasteT>0) buffs.push('🌬 Haste '+Math.ceil(p.hasteT)+'s'); if(p.regenT>0) buffs.push('🌿 Regen '+Math.ceil(p.regenT)+'s');
  // status: an icon and its time in a row under the top bar (the full text on a long press, as a title)
  set('buffs',buffs.join('|'),()=>{ const chip=t=>{ const w=t.replace(/ \(.*\)$/,'').split(' '), ic=w[0], tm=(t.match(/([\d.]+)s\b/)||[])[1], n=(t.match(/^\S+ (\d+) ·/)||[])[1];
      return '<b title="'+esc(t)+'">'+(statusArt(t)?'<img class="sic" alt="" src="ui/'+statusArt(t)+'.svg">':'<em>'+esc(ic)+'</em>')+(n?esc(n)+' ':'')+(tm?esc(Math.ceil(+tm))+'s':esc(w.slice(1).join(' ').split(' ·')[0]))+'</b>'; };
    $('#buffs').innerHTML=buffs.map(chip).join(''); });
  // INCOMING: a boss, mini-boss or elite winding up, or a heavy blow (a fifth of your max HP) marked on the ground
  const big=e=>e&&(e.def.boss||e.def.bossId||e.def.mini||e.elite);
  const inc=b.phase==='fight'&&(alive().some(e=>big(e)&&e.freezeT<=0&&e.stunT<=0&&(e.windT>0||e.casting||e.nextMove&&e.atkT<1.2))||b.teles.some(t=>!t.friendly&&(big(t.owner)||(t.dmg||0)>=p.maxHp*.2)));
  set('incoming',inc,()=>{ $('#incoming').hidden=!inc; });
  const ench=enchantLive();
  set('queue',pl.queue.map(c=>c.uid+':'+(c.left==null?'':c.left)+(c.frozenT>0?'f':'')+(c.tinker?'+':'')).join(',')+'|'+(ench?ench.inst.uid:'')+'|'+alive().map(e=>e.markT>0?e.mark:'').join(','),()=>{
    const row=$('#queueRow'); row.innerHTML='';
    const locked=pl.queue.filter(c=>c.combo), cb=$('#pileCombo');
    cb.classList.toggle('on',!!locked.length); cb.textContent=locked.length?'✦ '+(pl.combos||[]).map(c=>c.label.split(':')[0]).join(' · '):'No combo';
    for(let i=0;i<Math.max(RULES.slots,pl.queue.length);i++){ const inst=pl.queue[i], d=document.createElement('div');
      d.className='qslot'+(inst?' full':'')+(i===0&&inst?' next':'')+(inst&&inst.combo?' combo':'')+(inst&&inst.frozenT>0?' frozen':'')+(inst&&inst.tinker?' ench':'')+(inst&&ench&&enchantTargets(ench.inst).includes(inst)?' enchable':'');
      const rx=inst&&inst.card.pow&&reactWith(inst.card.color); if(rx){ d.classList.add('react'); d.style.setProperty('--xc',rx.c); }
      if(inst){ const c=inst.card, uses=c.uses&&!inst.temp?' '+chargeBadge(inst.left==null?c.uses:inst.left,c.uses):'', R=ROLES[cardRole(c)]; d.style.setProperty('--c',COLORS[c.color].c); d.style.setProperty('--rc',R.c);
        d.innerHTML=`${i===0?'<span class="nxt">NEXT</span>':''}<span class="role" title="${R.name}"><img class="qic" alt="${R.name}" src="ui/${cardArt(c)}.svg">${rx?`<span class="rx">✦ ${rx.name}</span>`:''}</span><span class="nm">${inst.frozenT>0?'❄ ':''}${esc(c.name)}${uses}${inst.temp&&!inst.recipe?' (copy)':''}</span>`;
        d.addEventListener('pointerdown',e=>{ e.preventDefault(); if(tryEnchant(inst)) return; if(!i) return; const why=bringNext(pl,i); if(why) tip(why); else { buzz(8); hud(); } }); }   // the slot is redrawn at once, so no click follow-up
      else d.textContent='—';
      row.appendChild(d); }
    const nx=pl.queue[0], NR=nx&&ROLES[cardRole(nx.card)]; $('#castName').textContent=nx?nx.card.name:'Queue empty';
    $('#btnCast').style.setProperty('--rc',NR?NR.c:'transparent'); $('#btnCast').classList.toggle('role',!!NR);
    $('#btnCast').disabled=!pl.queue.length;
  });
  // instants: a column of buttons up the side of the board (Settings › Instant buttons: right or left)
  set('inst',pl.hand.filter(c=>isInstant(c.card)).map(c=>c.uid).join(',')+'|'+b.phase+'|'+(ench?ench.inst.uid:''),()=>{ const row=$('#instRow'), ins=pl.hand.filter(c=>isInstant(c.card));
    row.hidden=!ins.length||b.phase!=='fight'; row.innerHTML='';
    ins.forEach(inst=>{ const bt=document.createElement('button'), c=inst.card, R=ROLES[cardRole(c)]; bt.className='btn inst'; bt.style.setProperty('--c',COLORS[c.color].c); bt.title=c.name;
      bt.innerHTML=`<img class="iic" alt="" src="ui/${cardArt(c)}.svg"><span class="inm">${esc(c.name)}</span>`+(ench&&ench.inst===inst?'<span class="ench-hint">Tap a card to enchant</span>':''); if(ench&&ench.inst===inst) bt.classList.add('arming'); pressBtn(bt,()=>tapInstant(inst)); row.appendChild(bt); }); });
  set('ace',b.sidearm?b.sidearm.name+'|'+b.sidearm.mult.toFixed(1)+'|'+b.sidearm.shape:'',()=>{ const bt=$('#btnAce'), s=b.sidearm;
    bt.hidden=!s;
    if(s){ $('#aceName').textContent='×'+s.mult.toFixed(1); bt.title=s.name+' ×'+s.mult.toFixed(1); bt.style.setProperty('--k',((s.mult-1)/(ACE_MAX-1)*100).toFixed(0)+'%'); bt.classList.toggle('hot',s.mult>=2); } });
  set('soul',b.soul?[Math.round(b.soul.charge),Math.ceil(b.soul.unisonT),soulReady(),(pl.queue[0]||{}).uid].join('|'):'',soulHud);
  const canCustom=b.phase==='fight'&&gaugeFull()&&!wandOnly(pl);
  if(b.pvp) set('duel',duelFightText(),()=>{ if(b.phase==='custom') $('#btnFight').textContent=duelFightText()||'Fight!'; });   // the shared card screen's countdown
  set('custom',canCustom+'|'+wandOnly(pl),()=>{ for(const bt of [$('#btnCustom'),$('#btnSpell')]){ bt.disabled=!canCustom; bt.classList.toggle('ready',canCustom); } });
}

// the skin's status icon for a status chip (ui/status_*.svg), by the chip's symbol and words
const STATUS_ART={'🛡':'status_shield','💨':'status_perfect_dodge','🌀':'status_perfect_dodge','ᚱ':'status_wand_power','⚡':'status_wand_power','☾':'status_drain','☀':'status_courage','✟':'status_valor','♔':'status_valor','❦':'status_rooted','🌬':'status_haste','🌿':'status_mend'};
function statusArt(t){ if(/Hexed/.test(t)) return 'status_hexed'; return STATUS_ART[t.split(' ')[0]]||''; }
// the skin's icon for a card's role (queue tiles and instants)
const ROLE_ART={attack:'icon_judgment',defense:'icon_shield',turret:'icon_regrowth',status:'icon_courage'};
function cardArt(c){ if(c.type==='instant'){ const t=(typeof cardText==='function'?cardText(c):'')+' '+(c.util||''); if(/\bheal|restore/i.test(t)) return 'icon_heal'; if(/\bdraw/i.test(t)) return 'icon_draw'; } return ROLE_ART[cardRole(c)]||'icon_courage'; }

/* The Soul: the deck's hero if it holds one, otherwise the hero of the deck's main color.
   It stays beside the fight (left of the board) instead of being drawn as a card. */
// Souls you can pick: every hero you own, plus the first six (one per color) that every hexmancer starts with
const STARTER_SOULS=['hero_pyra','hero_ysolde','hero_volta','hero_thorn','hero_aurel','hero_widow'];
const soulsOwned=()=>HEROES.filter(h=>STARTER_SOULS.includes(h.id)||save.owned&&save.owned[h.id]);
function soulOf(list,deck){ const h=list.find(id=>CARDS[id]&&CARDS[id].rarity==='hero'); if(h) return h;
  if(deck&&deck.soul&&soulsOwned().some(x=>x.id===deck.soul)) return deck.soul;
  const n={}; for(const id of list){ const c=CARDS[id]; if(c&&SIX.includes(c.color)) n[c.color]=(n[c.color]||0)+1; }
  const col=Object.keys(n).sort((a,b)=>n[b]-n[a])[0], H=HEROES.find(h=>h.color===col); return H&&H.id; }
function soulMenu(on){ const m=$('#soulMenu'); if(m) m.classList.toggle('on',!!on&&soulReady()); }
function soulHud(){ const s=B&&B.soul, box=$('#soulBox'); if(!box) return; box.hidden=!s; if(!s) return;
  const col=COLORS[s.card.color].c, k=s.unisonT>0?s.unisonT/UNISON_T:s.charge/SOUL_MAX, ready=soulReady();
  box.style.setProperty('--sc',col); box.style.setProperty('--k',(k*100).toFixed(1)+'%');
  box.classList.toggle('ready',ready); box.classList.toggle('unison',s.unisonT>0);
  $('#soulIcon').textContent=COLORS[s.card.color].icon; $('#soulName').textContent=s.unisonT>0?'Unison '+Math.ceil(s.unisonT)+'s':ready?'Ready!':s.card.name.split(',')[0];
  const q=B.piles.queue.find(c=>!c.combo); $('#soulUnite').innerHTML='✦ Unison<small>'+(q?'gives up '+esc(q.card.name):'10 s of its power')+'</small>'; }
function trySoul(){ if(!soulReady()) return; const m=$('#soulMenu'); soulMenu(!m.classList.contains('on')); }
/* ---------------- battle input ---------------- */
function tryCustom(){ if(!(B&&B.phase==='fight'&&gaugeFull()&&!wandOnly(B.piles))) return;
  if(B.player.charging){ wandUp(); $('#btnWand').classList.remove('charging'); }   // a shot you were charging goes off first
  if(B.pvp) B.pvp.session.openSpell(); else openCustomScreen(); }   // a duel opens the shared screen on both (startDuel)
/* Mobile browsers never make a click from a touch while another finger is down, so with the
   thumb holding Fire a tap on Cast did nothing. Battle buttons act on their own pointerdown
   instead (each finger is its own pointer); click is kept only for keyboard/assistive presses. */
function pressBtn(el,fn){
  el.addEventListener('pointerdown',e=>{ if(e.button>0) return; e.preventDefault(); if(!el.disabled) fn(); });
  el.addEventListener('click',e=>{ if(e.detail===0) fn(); });
  el.addEventListener('contextmenu',e=>e.preventDefault());
}
pressBtn($('#btnCustom'),tryCustom);
// the HUD's big buttons: their drawn width as --bw, so the icon and word inside are sized to fit the frame on any screen
if(typeof ResizeObserver!=='undefined'){ const ro=new ResizeObserver(es=>{ for(const e of es) e.target.style.setProperty('--bw',e.contentRect.width.toFixed(1)+'px'); fitQueue(); });
  ['#btnWand','#btnCast','#btnSpell','#hudBottom .bctl'].forEach(q=>ro.observe($(q))); }
// portrait: the queue goes in the gap between Fire's and Cast's curves, above Spell. FIRE_EDGE: for each 3-pixel band of
// rows of the 118×126 Fire art (all its states), how far right the art reaches; CAST_EDGE: where Cast's art starts from
// the left. The tiles' band is tried at the frames' top and the row set to the narrowest gap across it.
const FIRE_EDGE=[20,29,42,50,56,62,66,70,74,78,82,85,87,90,93,95,97,99,101,103,105,106,107,108,110,110,112,112,113,114,115,115,115,115,117,117,117,117,117,117,115,111],
  CAST_EDGE=[98,91,78,71,64,58,53,49,45,40,37,34,31,27,25,22,20,18,16,14,12,11,9,8,7,6,5,5,4,3,3,2,2,2,0,0,0,0,0,0,4,7];
function fitQueue(){ const q=$('#queueRow'), bc=$('#hudBottom .bctl'), body=document.body.classList;
  if(body.contains('wide')){ ['--qx','--qy','--qw','--qh'].forEach(k=>q.style.removeProperty(k)); return; }
  const R=bc.getBoundingClientRect(); if(!R.width||!R.height) return;
  const fireR=body.contains('fireR'), Lb=$(fireR?'#btnCast':'#btnWand').getBoundingClientRect(), Rb=$(fireR?'#btnWand':'#btnCast').getBoundingClientRect(), S=$('#btnSpell').getBoundingClientRect();
  // how far the left frame reaches right, and where the right one starts, at screen height y (both art tables are 42 bands)
  const band=(b,y)=>Math.max(0,Math.min(41,Math.floor((y-b.top)/b.height*42)));
  const leftAt=y=>Lb.left+Lb.width*(fireR?118-CAST_EDGE[band(Lb,y)]:FIRE_EDGE[band(Lb,y)])/118;
  const rightAt=y=>Rb.left+Rb.width*(fireR?118-FIRE_EDGE[band(Rb,y)]:CAST_EDGE[band(Rb,y)])/118;
  const g=R.width*.01, top=Math.min(Lb.top,Rb.top)+g, floor=S.top-g;
  let h=floor-top, x0=0, x1=0;   // the tiles rest just above Spell; the lower they sit the narrower the gap, so settle it
  for(let it=0;it<4;it++){ x0=-1e9; x1=1e9; for(let y=floor-h;y<=floor;y+=Math.max(1,h/12)){ x0=Math.max(x0,leftAt(y)); x1=Math.min(x1,rightAt(y)); }
    x0+=g; x1-=g; h=Math.max(10,Math.min(floor-top,(x1-x0)/4*1.1)); }
  const pc=(v,d)=>(v/d*100).toFixed(2)+'%';
  q.style.setProperty('--qx',pc(x0-R.left,R.width)); q.style.setProperty('--qw',pc(Math.max(0,x1-x0),R.width));
  q.style.setProperty('--qy',pc(floor-h-R.top,R.height)); q.style.setProperty('--qh',pc(h,R.height)); }
pressBtn($('#btnSpell'),tryCustom);
pressBtn($('#btnSoul'),trySoul);
pressBtn($('#soulSummon'),()=>{ soulSummon(); soulMenu(false); });
pressBtn($('#soulUnite'),()=>{ soulUnite(); soulMenu(false); });
pressBtn($('#btnCast'),castCard);
pressBtn($('#btnAce'),fireAce);
const wandBtn=$('#btnWand');
// the Fire button keeps its finger even if the thumb slides off it, so you can fire with one
// thumb while tapping the board to move with the other
wandBtn.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ wandBtn.setPointerCapture(e.pointerId); }catch(_){} wandDown(); wandBtn.classList.add('charging'); });
['pointerup','pointercancel'].forEach(ev=>wandBtn.addEventListener(ev,()=>{ wandBtn.classList.remove('charging'); wandUp(); }));
wandBtn.addEventListener('contextmenu',e=>e.preventDefault());

/* Moving on the board: a tap walks to the tapped tile. A drag works like a trackpad: put your
   finger anywhere (below your mage, say, so it stays in view) and slide it; your mage moves the
   same way from where it stood, so your finger never has to cover it. */
let dragging=null;
View.canvas=$('#board'); View.ctx=View.canvas.getContext('2d');
/* Touch walking in battle, two styles (Debug › Battle movement, or the Movement lab):
   Joystick (mvStick, like the dungeon's Tap + hold): a quick tap walks to that tile; touch and slide, or
     hold, and wherever your thumb landed becomes a floating stick: the way you push is the way you walk,
     how far you push sets your speed (a dead zone in the middle, then mvStickMin rising to full speed at
     mvStickFull of the stick's reach, along mvCurve). Let go and you stop.
   Follow finger: your mage walks toward the point your finger marks on the board (mvDrag times as far). */
View.canvas.addEventListener('pointerdown',e=>{ const t=pickTile(e.clientX,e.clientY); if(t&&t.side==='e'){ setAim(t); return; }
  if(!B||!B.player) return; try{ View.canvas.setPointerCapture(e.pointerId); }catch(_){}
  const [ax,ay]=appXY(e.clientX,e.clientY), [wx,wz]=posOf(B.player), [px,py]=proj(wx,0,wz);
  dragging={id:e.pointerId,x0:ax,y0:ay,x:ax,y:ay,t0:e.timeStamp,px,py,wx,wz,tap:t,moved:false,stick:false,hist:[[performance.now(),ax,ay]]}; });
View.canvas.addEventListener('pointermove',e=>{ const d=dragging; if(!d||e.pointerId!==d.id) return; const [ax,ay]=appXY(e.clientX,e.clientY); d.x=ax; d.y=ay;
  const now=performance.now(); d.hist.push([now,ax,ay]); while(d.hist.length>2&&now-d.hist[0][0]>400) d.hist.shift();   // the thumb's last moments, for a flick
  if(!d.moved&&Math.hypot(ax-d.x0,ay-d.y0)>MV('mvTapPx')) d.moved=true;
  if(!d.moved||XLIT.mvStick) return;   // the joystick steers every frame (stickWalk)
  // follow finger: your mage glides after the finger as a float and is hit on the nearest tile (freeTarget, battle.js)
  const [wx,wz]=unprojGround(d.px+(ax-d.x0)*MV('mvDrag'),d.py+(ay-d.y0)*MV('mvDrag'),d.wx,d.wz); freeTarget(wx,wz); });
const dragEnd=e=>{ const d=dragging; if(!d||e.pointerId!==d.id) return; dragging=null; stickDraw();
  // timed from the touch's own down and up (e.timeStamp): a frame stall during a quick tap must not make it a hold
  const tap=!d.moved&&!d.stick&&e.type==='pointerup'&&(!XLIT.mvStick||e.timeStamp-d.t0<MV('mvTapMs'));
  if(d.moved||d.stick) freeEnd(); if(tap&&d.tap&&d.tap.side==='p') moveTo(d.tap);
  // a flick: let go with the thumb still moving fast and your mage is thrown that way (battle.js flickThrow)
  if((d.moved||d.stick)&&XLIT.mvStick&&MV('mvFlick')&&B&&B.player&&d.hist){ const now=performance.now(), H=d.hist.filter(h=>now-h[0]<=MV('mvFlickWin'));
    if(H.length>=2){ const [t0,x0,y0]=H[0], [,x1,y1]=H[H.length-1], vx=(x1-x0)/Math.max(16,now-t0)*1000, vy=(y1-y0)/Math.max(16,now-t0)*1000, v=Math.hypot(vx,vy);
      if(v>=MV('mvFlickV0')){ const p=B.player, fx=p.fx??p.tile.wx, fz=p.fz??p.tile.wz, [sx,sy]=proj(fx,0,fz), [wx,wz]=unprojGround(sx+vx/v*60,sy+vy/v*60,fx,fz);
        flickThrow(wx-fx,wz-fz,(v-MV('mvFlickV0'))/Math.max(1,MV('mvFlickV1')-MV('mvFlickV0'))); } } } };
/* How long a finger has been held, counted in frames and at most 50 ms a frame: the first frame after a stall
   comes before the stalled finger's release is handled, and must not turn a quick tap into a hold. (ui.js battle
   board; explore.js has the same for the dungeon.) */
function heldMs(h){ const now=performance.now(); h.heldMs=(h.heldMs||0)+Math.max(0,Math.min(50,now-(h.lastT??h.t0))); h.lastT=now; return h.heldMs; }
// the joystick, each frame: from where your thumb is against where it landed
function stickWalk(){ const d=dragging; if(!d||!XLIT.mvStick||!B||B.phase!=='fight') return;
  if(!d.stick&&(d.moved||heldMs(d)>=MV('mvTapMs'))) d.stick=true;
  if(!d.stick) return; stickDraw();
  const p=B.player, R=MV('mvStickR'), dx=d.x-d.x0, dy=d.y-d.y0, l=Math.hypot(dx,dy)/R, fx=p.fx??p.tile.wx, fz=p.fz??p.tile.wz;
  if(l<MV('mvDead')){ if(!d.still){ d.still=true; if(MV('mvMomentum')) freeEnd(); else freeTarget(fx,fz); } return; }   // in the dead zone: stand (the magnet pulls after the rest; with momentum, you coast to a stop as if you let go)
  d.still=false;
  const u=Math.min(1,(l-MV('mvDead'))/Math.max(.01,MV('mvStickFull')-MV('mvDead'))), k=MV('mvStickMin')+(1-MV('mvStickMin'))*Math.pow(u,MV('mvCurve'));
  // the push, on screen, turned into a way across the board
  const [sx,sy]=proj(fx,0,fz), [wx,wz]=unprojGround(sx+dx/(l*R)*60,sy+dy/(l*R)*60,fx,fz), wl=Math.hypot(wx-fx,wz-fz)||1;
  freeTarget(fx+(wx-fx)/wl*3,fz+(wz-fz)/wl*3,false,k,true); if(B.player.free) B.player.free.tps=MV('mvStickSpeed'); }
function stickDraw(){ const el=$('#bStick'); if(!el) return; const d=dragging, on=!!(d&&d.stick&&XLIT.mvStick&&XLIT.mvStickShow);
  el.hidden=!on; if(!on) return; const R=MV('mvStickR'); el.style.width=el.style.height=2*R+'px'; const sb=appBox($('#scrBattle')); el.style.left=(d.x0-sb.left-R)+'px'; el.style.top=(d.y0-sb.top-R)+'px';
  let dx=d.x-d.x0, dy=d.y-d.y0; const l=Math.hypot(dx,dy); if(l>R){ dx*=R/l; dy*=R/l; }
  const dz=el.firstElementChild; dz.style.width=dz.style.height=2*R*MV('mvDead')+'px'; el.lastElementChild.style.transform='translate('+dx+'px,'+dy+'px)'; }
['pointerup','pointercancel'].forEach(ev=>View.canvas.addEventListener(ev,dragEnd));
window.addEventListener('resize',()=>{ if($('#scrBattle').classList.contains('on')) resizeView(); if($('#scrCamp').classList.contains('on')) campScene(); });

const held=new Set();
/* Holding a move key keeps walking, one tile after another, until you let go (the browser's own key
   repeat stops the moment another key goes down, so holding a direction while pressing Fire or Cast
   used to stop you after one step). The last direction pressed wins. */
const MOVE_ACTS=['left','right','up','down'];
let moveHeld=[];
function stepAct(a){ if(a==='left') stepDir(DIRS.W); else if(a==='right') stepDir(DIRS.E); else if(a==='up') stepVertical(true); else if(a==='down') stepVertical(false); }
/* A quick press walks one tile (stepAct); held past a moment, the keys steer you as a float, straight
   along the board (Up and Down too, and two keys together go diagonally), and letting go stops you where
   you are. */
const MOVE_VEC={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
let moveHeldT=0;
function heldWalk(){ if(!B||B.phase!=='fight'||paused) return; const p=B.player;
  if(!moveHeld.length){ if(p.free&&p.free.key) p.free=null; return; }
  if(B.time-moveHeldT<.15&&p.path.length) return;   // the first tile walks as a tap would
  let vx=0, vz=0; for(const a of moveHeld){ vx+=MOVE_VEC[a][0]; vz+=MOVE_VEC[a][1]; }
  const L=Math.hypot(vx,vz); if(!L){ if(p.free&&p.free.key) p.free=null; return; }
  // straight along a row, the magnet also draws you onto the row's middle line, so you don't run along the
  // line between two rows (on squares, a column's too)
  const fx=p.fx??p.tile.wx, fz=p.fz??p.tile.wz, m=MV('mvSnap');
  freeTarget(fx+vx/L*4+(!vx&&SQUARE?(p.tile.wx-fx)*m:0),fz+vz/L*4+(!vz?(p.tile.wz-fz)*m:0),true); }
addEventListener('blur',()=>{ held.clear(); moveHeld=[]; });
window.addEventListener('keydown',e=>{
  if(!B||!$('#scrBattle').classList.contains('on')) return; const k=e.key.toLowerCase();
  if(B.phase==='custom'){
    const n=parseInt(k,10);
    if(choose) return;
    if(n>=1&&n<=9&&B.piles.hand[n-1]){ const h=B.piles.hand[n-1]; if(isInstant(h.card)) tapInstant(h); else { toggleQueue(B.piles,h.uid); renderCustom(); } }
    else if(k==='u'){ const t=B.piles.queue.find(c=>isDeckTool(c.card)); if(t) fireTool(t); }   // use the deck tool in your slots
    else if(k==='backspace'&&B.piles.queue.length){ toggleQueue(B.piles,B.piles.queue[B.piles.queue.length-1].uid); renderCustom(); }
    else if((k==='enter'||k===' ')&&!e.repeat&&!held.has(k)){ e.preventDefault(); if(B.pvp) duelFight(); else closeCustomScreen(); }
    return;
  }
  if(B.phase!=='fight'||paused||held.has(k)) return; held.add(k);
  const a=typeof keyAct==='function'?keyAct(k,'battle'):null;   // your bindings, from Settings (keys.js)
  if(a) e.preventDefault();
  if(MOVE_ACTS.includes(a)){ if(!moveHeld.length) moveHeldT=B.time; moveHeld=moveHeld.filter(x=>x!==a).concat(a); stepAct(a); }
  else if(a==='fire') wandDown();
  else if(a==='cast') castCard();
  else if(a==='custom') tryCustom();
  else if(a==='soul') trySoul();
  else if(a==='ace') fireAce();
  else if($('#soulMenu').classList.contains('on')&&(k==='1'||k==='2')){ (k==='1'?soulSummon:soulUnite)(); soulMenu(false); }
  else if(a==='aim') cycleAim();
});
window.addEventListener('keyup',e=>{ const k=e.key.toLowerCase(); held.delete(k); const a=typeof keyAct==='function'?keyAct(k,'battle'):null;
  if(a==='fire') wandUp(); if(MOVE_ACTS.includes(a)) moveHeld=moveHeld.filter(x=>x!==a); });

/* ---------------- loop ---------------- */
let prev=performance.now();
document.addEventListener('visibilitychange',()=>{ prev=performance.now(); });
// frames and simulation steps a second; slow frames can need more than one bounded step
const PERF={f:0,u:0,t0:0,fps:0,upf:0};
function perfTick(now,updates){ PERF.f++; PERF.u+=updates; if(now-PERF.t0>=1000){ if(PERF.t0){ PERF.fps=PERF.f*1000/(now-PERF.t0); PERF.upf=PERF.f?PERF.u/PERF.f:0; } PERF.t0=now; PERF.f=PERF.u=0; } }
function frame(now){
  // Keep elapsed time across slow frames, split into safe physics steps. Capping the entire frame at
  // 50 ms made a 10 fps phone walk at half speed, then twice as fast once rendering reached 20 fps.
  // A long stall catches up at most 250 ms; returning from a hidden tab resets prev above.
  const dt=Math.max(0,Math.min(.25,(now-prev)/1000)); prev=now;
  // the next frame is asked for first, so one bad frame can never stop the fight for good
  requestAnimationFrame(frame);
  if(B&&$('#scrBattle').classList.contains('on')){
    if(!(View.w>0&&View.h>0)) resizeView();
    if(!document.hidden) checkControls(dt);
    let updates=0;
    const hold=DBG.pause&&!B.pvp;   // the debug pause never holds a duel: it would stall the opponent
    if(!document.hidden&&!paused&&!hold){ const battle=B, steps=Math.max(1,Math.ceil(dt/.05)), step=dt/steps;
      for(let i=0;i<steps&&B===battle&&!paused&&!(DBG.pause&&!B.pvp)&&$('#scrBattle').classList.contains('on');i++){
        heldWalk(); stickWalk(); if(typeof elabBotTick==='function') elabBotTick(step); update(step); updates++;
      } }   // the debug menu's pause holds the fight but keeps drawing it
    perfTick(now,updates);
    // The Custom screen never opens by itself: when the gauge is full the Custom button glows and you open it.
    try{ render(); }catch(e){ if(!View.errShown){ View.errShown=1; console.error('battle draw:',e); } View.cave=null; resizeView(); }   // e.g. the board was resized to nothing in the background: rebuild it next frame
    hud();
  }
}
/* ---------------- phone or tablet layout ----------------
   Phone keeps everything in one narrow column with 4 cards to a row; tablet spreads the camp
   into two columns, shows 7 cards to a row in battle and uses bigger buttons and text. It
   starts from the screen's width and the player can switch it; the choice is remembered. */
const LAYOUT_KEY='hexmancers-layout';
function getLayout(){ try{ const v=localStorage.getItem(LAYOUT_KEY); if(v==='phone'||v==='tablet') return v; }catch(e){} let w=innerWidth; try{ const o=localStorage.getItem('hexmancers-orient'); if((o==='portrait'&&innerWidth>innerHeight)||(o==='landscape'&&innerHeight>innerWidth)) w=innerHeight; }catch(e){} return w>=700?'tablet':'phone'; }
function setLayout(m,keep){ document.body.classList.toggle('ui-tablet',m==='tablet'); document.body.classList.toggle('ui-phone',m!=='tablet');
  if(keep){ try{ localStorage.setItem(LAYOUT_KEY,m); }catch(e){} }
  document.querySelectorAll('.layoutBtn').forEach(b=>{ b.innerHTML=`<b class="${m==='phone'?'on':''}">Phone</b> ⇄ <b class="${m==='tablet'?'on':''}">Tablet</b>`; b.setAttribute('aria-label','Layout: '+m+'. Tap to switch.'); });
  if($('#scrCamp').classList.contains('on')) campScene();
  if($('#scrBattle').classList.contains('on')) resizeView(); }
document.querySelectorAll('.layoutBtn').forEach(b=>b.onclick=()=>setLayout(document.body.classList.contains('ui-tablet')?'phone':'tablet',true));
setLayout(getLayout());
/* Testing tools (boss tests at camp, free gear and scrolls on the Character screen) stay hidden
   unless switched on in Settings, or by opening the game with ?dev in the address. */
const DEV_KEY='hexmancers-dev';
try{ if(/[?&]dev\b/.test(location.search)) localStorage.setItem(DEV_KEY,'1'); }catch(e){}
function applyDev(){ let on=false; try{ on=localStorage.getItem(DEV_KEY)==='1'; }catch(e){} document.body.classList.toggle('dev',on); $('#setDev').textContent=on?'On':'Off'; }
$('#setDev').onclick=()=>{ const on=!document.body.classList.contains('dev'); try{ localStorage.setItem(DEV_KEY,on?'1':'0'); }catch(e){} applyDev(); };
applyDev();
// Settings › Dungeon tips and Stairs marker (explore.js reads the same keys)
function applyXTips(){ let tips=true, mark=true; try{ tips=localStorage.getItem('hexmancers-xtips')!=='0'; mark=localStorage.getItem('hexmancers-xstairs')!=='0'; }catch(e){}
  $('#setXTips').textContent=tips?'On':'Off'; $('#setXStairs').textContent=mark?'On':'Off'; }
$('#setXTips').onclick=()=>{ let on=true; try{ on=localStorage.getItem('hexmancers-xtips')!=='0'; localStorage.setItem('hexmancers-xtips',on?'0':'1'); }catch(e){}
  if(on){ if(typeof xTipHide==='function') xTipHide(); } else if(typeof xTipReset==='function') xTipReset(); applyXTips(); };
// the battle's top bar: clear over the scene, or a stone bar
const HUD_KEY='hexmancers-hudbar';
function applyHudStyle(){ let st='panel'; try{ st=localStorage.getItem(HUD_KEY)||'panel'; }catch(e){} document.body.classList.toggle('hudClear',st==='clear'); const b=$('#setHud'); if(b) b.textContent=st==='clear'?'Clear':'Panel'; }
$('#setHud').onclick=()=>{ const st=document.body.classList.contains('hudClear')?'panel':'clear'; try{ localStorage.setItem(HUD_KEY,st); }catch(e){} applyHudStyle(); };
applyHudStyle();
// which side Fire sits on (Cast takes the other), and which edge the instants stack up: for left and right hands
const SIDE_KEYS={fire:['hexmancers-fireside','left','fireR','#setFire'], inst:['hexmancers-instside','right','instL','#setInst']};
const sideOf=k=>{ try{ return localStorage.getItem(SIDE_KEYS[k][0])||SIDE_KEYS[k][1]; }catch(e){ return SIDE_KEYS[k][1]; } };
function applySides(){ for(const k in SIDE_KEYS){ const [,def,cls,btn]=SIDE_KEYS[k], v=sideOf(k); document.body.classList.toggle(cls,v!==def); const b=$(btn); if(b) b.textContent=v==='left'?'Left':'Right'; } if(typeof fitQueue==='function') fitQueue(); }
for(const k in SIDE_KEYS) $(SIDE_KEYS[k][3]).onclick=()=>{ try{ localStorage.setItem(SIDE_KEYS[k][0],sideOf(k)==='left'?'right':'left'); }catch(e){} applySides(); };
applySides();
$('#setXStairs').onclick=()=>{ let on=true; try{ on=localStorage.getItem('hexmancers-xstairs')!=='0'; localStorage.setItem('hexmancers-xstairs',on?'0':'1'); }catch(e){} applyXTips(); if(typeof EX!=='undefined'&&EX&&typeof xMini==='function') xMini(); };
applyXTips();
// sound effects in the dungeon (dungeon.js), on unless switched off
function applySfx(){ let on=true; try{ on=localStorage.getItem('hexmancers-sfx')!=='0'; }catch(e){} $('#setSfx').textContent=on?'On':'Off'; }
$('#setSfx').onclick=()=>{ let on=true; try{ on=localStorage.getItem('hexmancers-sfx')!=='0'; localStorage.setItem('hexmancers-sfx',on?'0':'1'); }catch(e){} applySfx(); };
applySfx();
/* the window's shape and size: .wide or .tall, and --ui, the scale for menus and the HUD.
   1 on phones; on bigger screens it grows so text and buttons stay a comfortable size. */
/* Screen orientation (Settings): auto follows the device; portrait or landscape keeps the game that way.
   Where the browser can lock the screen (full screen on most phones) it does; otherwise, when the
   device is held the other way, the whole game is turned a quarter so it stays as chosen. */
const ORIENT_KEY='hexmancers-orient';
const getOrient=()=>{ try{ const v=localStorage.getItem(ORIENT_KEY); if(v==='portrait'||v==='landscape') return v; }catch(e){} return 'auto'; };
function lockOrient(){ const o=getOrient(), so=screen.orientation;
  try{ if(!so) return; if(o==='auto'){ if(so.unlock) so.unlock(); return; } if(so.lock&&(document.fullscreenElement||document.webkitFullscreenElement)) so.lock(o).catch(()=>{}); }catch(e){} }
function applyOrient(){ const o=getOrient(), portraitNow=innerHeight>=innerWidth, app=$('#app');
  const turn=o!=='auto'&&(o==='portrait')!==portraitNow;
  app.classList.toggle('rot',turn); document.body.classList.toggle('rot',turn);
  if(turn){ app.style.width=innerHeight+'px'; app.style.height=innerWidth+'px'; } else { app.style.width=''; app.style.height=''; }
  const b=$('#setOrient'); if(b) b.textContent={auto:'Auto',portrait:'Portrait',landscape:'Landscape'}[o]; }
$('#setOrient').onclick=()=>{ const n={auto:'portrait',portrait:'landscape',landscape:'auto'}[getOrient()]; try{ localStorage.setItem(ORIENT_KEY,n); }catch(e){} lockOrient(); applyViewport(); };
/* Text size (Settings): a player multiplier on --ui. Normal (1) leaves the game as it was;
   on a narrow phone the bigger sizes stop where the layouts would stop fitting (applyViewport). */
const TEXT_KEY='hexmancers-text', TEXT_SIZES=[[1,'Normal'],[1.15,'Large'],[1.3,'Larger']];
const getTextScale=()=>{ let v=1; try{ v=+localStorage.getItem(TEXT_KEY)||1; }catch(e){} return TEXT_SIZES.some(t=>t[0]===v)?v:1; };
function applyText(){ const b=$('#setText'); if(b) b.textContent=TEXT_SIZES.find(t=>t[0]===getTextScale())[1]; }
$('#setText').onclick=()=>{ const i=TEXT_SIZES.findIndex(t=>t[0]===getTextScale()), n=TEXT_SIZES[(i+1)%TEXT_SIZES.length][0];
  try{ localStorage.setItem(TEXT_KEY,n); }catch(e){} applyViewport(); };
function applyViewport(){
  applyText();
  applyOrient();
  const rot=$('#app').classList.contains('rot'), w=rot?innerHeight:innerWidth, h=rot?innerWidth:innerHeight, wide=w>h*1.15;
  // size classes from the game's own frame (it may be turned), in place of media queries on the screen
  // a notch or Dynamic Island at the top: the battle bar keeps HP and the menu beside it and drops the Spell gauge below it
  { const pr=document.createElement('div'); pr.style.cssText='position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none';
    document.body.appendChild(pr); const nt=parseFloat(getComputedStyle(pr).paddingTop)||0; pr.remove();
    document.body.classList.toggle('notch',nt>20&&!rot); document.documentElement.style.setProperty('--notch',nt+'px'); }
  const B=document.body.classList; B.toggle('lsS',w>h&&h<=560); B.toggle('lsXS',w>h&&h<=500); B.toggle('hTall',h>=561); B.toggle('h460',h<=460); B.toggle('w420',w<=420); B.toggle('w520',w<=520);
  document.body.classList.toggle('wide',wide); document.body.classList.toggle('tall',!wide);
  const s=wide?Math.min(h/760,w/1250):Math.min(w/560,h/1000);
  // Text size grows the scale, but never so far that the game's own width drops below 340px (where its layouts still fit)
  const base=Math.max(1,Math.min(2.5,s)), ui=Math.min(base*getTextScale(),Math.max(base,w/340));
  document.documentElement.style.setProperty('--ui',ui.toFixed(3));
  /* One card size for every card grid (My cards, deck library, Custom hand, rewards). On a phone it is
     the size that fits 3 across the narrowest of them, the Custom hand (the frame less 84px); bigger
     screens get 120px. Text size does not change it: the grids undo that part of --ui (--tz). */
  const R=document.documentElement.style, cw=wide&&h<=560?96:w<600?Math.max(80,Math.min(120,Math.floor((w-84-12)/3))):120;
  R.setProperty('--uib',base.toFixed(3)); R.setProperty('--tz',(ui/base).toFixed(3)); R.setProperty('--cardw',(cw/base).toFixed(1)+'px');
  if($('#scrBattle').classList.contains('on')) requestAnimationFrame(resizeView);
  if($('#scrCamp').classList.contains('on')) campScene();
}
addEventListener('resize',applyViewport); addEventListener('orientationchange',()=>setTimeout(applyViewport,150));
applyViewport();
openMenu();
// the very first launch (no save in any slot): go straight to making your character in slot 1
{ let any=false; for(let n=1;n<=SAVE_SLOTS;n++) if(n===SAVE_SLOT?save:loadSave(n)) any=true;
  if(!any){ useSlot(1); openNewChar(); }
  if(SAVE_DAMAGED) setTimeout(()=>tip('The save in slot '+SAVE_DAMAGED.slot+' could not be read. A copy was kept in this browser ('+SAVE_DAMAGED.key+'), so nothing is overwritten.',9000),600); }
// the same save open in another tab: when that tab saves, this one stops saving (it would undo that tab's progress)
window.addEventListener('storage',e=>{ if(e.key!==slotKey(SAVE_SLOT)||SAVE_STALE) return; SAVE_STALE=true; saveStaleNote(); });
function saveStaleNote(){ tip('This save was changed in another tab or window. Progress here is not saved: reload the page to carry on from there.',8000); }
requestAnimationFrame(frame);

/* ---------------- main menu ----------------
   The game opens here: Continue goes to camp; Explore and Battle start at the depth shown
   (any depth from 1 to your deepest); New game picks a starter deck. */
function openMenu(){
  if(typeof stopExplore==='function'){ stopExplore(); EX=null; }
  const has=!!save;
  if(has){ if(pickDepth==null) pickDepth=save.deepest; pickDepth=Math.min(Math.max(1,pickDepth),save.deepest); }
  else pickDepth=1;
  $('#mmContinue').disabled=!savedSlots().length;
  const slotTag='<span class="mmslot">Slot '+SAVE_SLOT+' · change ▾</span>';
  $('#mmSave').innerHTML=slotTag+(has?'<span class="mmdeep">Deepest: depth <b>'+save.deepest+'</b></span><span class="mmname">'+esc(areaOf(save.deepest).name)+'</span><span class="mmgold">'+uiIcon('coin',20)+save.gold+'</span><span class="mmcards">'+ownedUnique(save)+' cards</span>'
    :'<span class="mmdeep">Slot '+SAVE_SLOT+' is empty.</span><span class="mmname">Start a new game.</span>');
  $('#mmDepth').textContent=pickDepth; $('#mmArea').textContent=areaLabel(pickDepth); $('#mmArea').style.color=areaOf(pickDepth).glow;
  $('#mmDown').disabled=!has||pickDepth<=1; $('#mmUp').disabled=!has||pickDepth>=save.deepest;
  const v=has?validateDeck(activeDeck().list,CARDS,save.owned):{ok:false};
  $('#mmExplore').disabled=$('#mmBattle').disabled=!has||!v.ok;
  $('#mmWarn').textContent=!has?'':v.ok?'':'Your deck is not ready ('+(v.errors[0]||'invalid')+'). Fix it in the deck builder at camp.';
  show('scrMenu');
}
$('#mmDown').onclick=()=>{ pickDepth--; openMenu(); };
$('#mmUp').onclick=()=>{ pickDepth++; openMenu(); };
// with more than one save, Continue asks which; with one, it goes straight back to camp
function savedSlots(){ const out=[]; for(let n=1;n<=SAVE_SLOTS;n++) if(n===SAVE_SLOT?save:loadSave(n)) out.push(n); return out; }
$('#mmContinue').onclick=()=>{ const sl=savedSlots(); if(sl.length>1){ openSlots('continue'); return; }
  if(sl.length&&sl[0]!==SAVE_SLOT) useSlot(sl[0]);   // the one save is in another slot: switch to it
  withChar(()=>openCamp()); };
$('#mmExplore').onclick=()=>withChar(()=>enterExplore(pickDepth));
$('#mmBattle').onclick=()=>withChar(()=>fight(pickDepth));
$('#mmNew').onclick=()=>openSlots('new');
$('#mmSlots').onclick=()=>openSlots();
$('#slClose').onclick=()=>$('#slots').classList.remove('on');
$('#mmSettings').onclick=()=>openSettings();
$('#startBack').onclick=()=>openNewChar(true);
$('#ccBack').onclick=()=>openMenu();
$('#ccGo').onclick=()=>{ if(pointsLeft(ccChar)>0&&!$('#ccGo').dataset.sure){ $('#ccWarn').textContent='You still have '+pointsLeft(ccChar)+' points to spend. Tap again to go on anyway.'; $('#ccGo').dataset.sure='1'; return; } if(ccMode==='existing') return keepChar(); buildStart(); };
// a save from before characters takes the new character: level points earned so far stay to spend
function keepChar(){ const old=save.char, ch=lockChar(ccChar); ch.earned=(old&&old.earned)||0; if(ch.earned) save.lvlNew=true;
  Object.assign(save,{char:ch, look:ch.look, hat:true}); ensureChar(save); persist(); const go=ccNext||openCamp; ccMode=ccNext=null; go(); }
$('#ccReset').onclick=()=>{ ccChar=newChar(ccChar.race,ccChar.body); renderNewChar(); };
$('#campMenu').onclick=()=>openMenu();

/* ---------------- closing windows: one way everywhere ----------------
   Every pop-up window has the same ✕ in its top-right corner, Esc closes the window on top, and a
   tap on the dark area around a window closes it too (except a result window, where a stray tap
   would choose for you; its ✕ takes the first choice). Full screens go back with their ← button,
   and Esc does the same. Buttons that only closed a window are gone: the ✕ does it. */
const CLOSERS={
  pause:()=>closePause(), settings:()=>closeSettings(), slots:()=>$('#slots').classList.remove('on'),
  detail:()=>$('#detail').classList.remove('on'), pick:()=>$('#pick').classList.remove('on'),
  dkPeek:()=>$('#dkpClose').onclick(), xDialog:()=>xDlgClose(), bagUI:()=>closeBag(),
  lvlUp:()=>closeLevelUp(false), shopSheet:()=>$('#shopSheet').classList.remove('on'), runSheet:()=>closeRun(),
  reveal:()=>{ const b=$('#rvBtns .btn'); if(b) b.click(); else $('#reveal').classList.remove('on'); },
};
const NO_BACKDROP=['reveal'], OWN_X=['bagUI','settings'];   // settings goes back with the ← every full screen has
$('#setBack').onclick=()=>CLOSERS.settings();
for(const id of ['dtClose','slClose','dkpClose','setClose','pkCancel','pickCancel','lvLater','shopSheetClose']){ const b=$('#'+id); if(b) b.hidden=true; }
for(const id in CLOSERS){ const ov=$('#'+id); if(!ov) continue;
  if(!OWN_X.includes(id)){ const panel=ov.querySelector('.panel')||ov.firstElementChild, x=document.createElement('button');
    x.className='winx'; x.type='button'; x.setAttribute('aria-label','Close'); x.onclick=e=>{ e.stopPropagation(); CLOSERS[id](); };
    panel.classList.add('haswinx'); panel.prepend(x); }
  if(!NO_BACKDROP.includes(id)&&!['bagUI','dkPeek'].includes(id)) ov.addEventListener('click',e=>{ if(e.target===ov&&ov.classList.contains('on')) CLOSERS[id](); }); }
window.addEventListener('keydown',e=>{ if(e.key!=='Escape'||keyCapture) return;
  const open=Object.keys(CLOSERS).map(id=>$('#'+id)).filter(el=>el&&el.classList.contains('on'));
  if(open.length){ const z=el=>+getComputedStyle(el).zIndex||0;
    const top=open.sort((a,b)=>z(a)-z(b)||(a.compareDocumentPosition(b)&4?-1:1)).pop();
    e.preventDefault(); e.stopImmediatePropagation(); CLOSERS[top.id](); return; }
  const back=document.querySelector('.screen.on .back:not([hidden]), .screen.on #dkBack');
  if(back){ e.preventDefault(); e.stopImmediatePropagation(); back.click(); } },true);

/* ---------------- local duel ----------------
   Camp's Duel a friend (or Debug › Multiplayer › Start a duel) opens #scrDuel: Host or Join, then a Wi-Fi code (WebRTC, nettransport.js: the
   host's code goes to the guest, the guest's code comes back) or a Room (the LAN relay, http pages only), then the
   lobby and the duel itself (battle.js startDuel, netduel.js DuelSession). A duel ends in one place, duelOver, with
   a result card; leaving (Back, the pause menu's Leave) is duelLeave. Both stop the session, the transport and the
   timers, so nothing of a duel outlives it. */
const DU={step:'role', from:'menu', host:false, gen:0, timeout:20000, tr:null, accept:null, session:null, list:null, timer:0, startT:0, waitT:0, closed:false, over:false};
const DU_NAME_KEY='hexmancers-mpname', DU_SLOW_MSG='Could not connect. Check you are on the same Wi-Fi and try again.', DU_PROBE='hexmancers-hi';
const DU_STEPS={role:'duRole', how:'duHow', hostcode:'duHostCode', joincode:'duJoinCode', answer:'duAnswerStep', room:'duRoomStep', wait:'duWait', lobby:'duLobby'};
// Room (the relay) needs a page served over http: by something that runs it; itch.io pages are https and cannot reach it
const duelRoomOk=(proto,host)=>proto==='http:'&&!/itch\.(io|zone)$/i.test(host||'');
const duMsg=t=>{ $('#duMsg').textContent=t||''; };
const DU_TRACK={role:0, lobby:2};   // every other step is Connect (1)
function duStep(name,msg){ DU.step=name; for(const k in DU_STEPS) $('#'+DU_STEPS[k]).hidden=k!==name; duMsg(msg);
  const at=name in DU_TRACK?DU_TRACK[name]:1; document.querySelectorAll('#duTrack li').forEach(li=>{ const i=+li.dataset.i; li.classList.toggle('on',i===at); li.classList.toggle('done',i<at); }); }
// a hexmancer look drawn into one of the screen's canvases, front view
function duSprite(cv,look){ const x=cv.getContext('2d'); x.clearRect(0,0,cv.width,cv.height); x.imageSmoothingEnabled=false;
  const sp=typeof lookSprite==='function'?lookSprite(look||'wizard','front',true):null; if(sp) x.drawImage(sp.img,0,0,sp.img.width,sp.img.height,0,0,cv.width,cv.height); }
// back where the duel was opened from: camp, or the main menu (the debug menu's Start a duel)
const duHome=()=>DU.from==='camp'&&save?openCamp():openMenu();
function duelName(){ const v=($('#duName').value||'').trim().slice(0,20); return v||'Hexmancer'; }
// '' when the saved deck can duel, else why not
function duelDeckProblem(){ if(!save) return 'Start or load a game first.'; const d=activeDeck(); if(!d) return 'You have no deck yet.';
  const v=validateDeck(d.list,CARDS,save.owned); return v.ok?'':'Your saved deck is not valid: '+v.errors[0]+'. Fix it at camp.'; }
// the debug menu's Start a duel button and the Pause switch follow what is going on
function duelDbgSync(){ const btn=$('#dbgDuel'), hint=$('#dbgDuelHint'); if(!btn) return;
  const why=DU.session||DU.tr?'A duel is already set up.':(B||(typeof EX!=='undefined'&&EX&&EX.active))?'Finish this fight or dungeon run first.':duelDeckProblem();
  btn.disabled=!!why; hint.textContent=why; }
function duelPauseSync(){ const pz=$('#dbgPause'), note=$('#dbgPauseNote'), on=!!DU.session;
  if(pz){ if(on&&typeof DBG!=='undefined'&&DBG.pause){ DBG.pause=false; pz.checked=false; document.body.classList.remove('dbgPaused'); } pz.disabled=on; }
  if(note) note.hidden=!on; duelDbgSync(); }
// everything of a connection and a duel: timers, the session (which says bye and closes the transport) or the bare transport
function duStop(){ clearInterval(DU.timer); clearTimeout(DU.startT); clearTimeout(DU.waitT); DU.timer=DU.startT=DU.waitT=0;
  const s=DU.session, tr=DU.tr; DU.session=DU.tr=DU.accept=null; DU.gen++;
  try{ if(s) s.leave(); else if(tr) tr.close(); }catch(e){}
  duelPauseSync(); }
// leave a duel (or its pairing) at any point: the local battle stops and the game is back at the menu (quiet: no menu)
function duelLeave(quiet){ duStop(); $('#custom').classList.remove('on'); $('#pause').classList.remove('on'); paused=false;
  if(B&&B.pvp) B=null; DU.over=false; if(!quiet) duHome(); }
function openDuel(from){ if(DU.session||DU.tr) duStop(); try{ xDbgClose(); }catch(e){}
  DU.from=from==='camp'?'camp':'menu';
  try{ $('#duName').value=localStorage.getItem(DU_NAME_KEY)||''; }catch(e){}
  duSprite($('#duMe'),playerLook());
  const d=save&&activeDeck(), why=duelDeckProblem(), dk=$('#duDeck'); dk.classList.toggle('bad',!!why);
  dk.innerHTML=why?esc(why):'Deck: <b>'+esc(d.name||'My deck')+'</b> · '+d.list.length+' cards';
  duStep('role'); show('scrDuel'); }
const duRace=(p,ms)=>new Promise((res,rej)=>{ const t=setTimeout(()=>rej(new Error(DU_SLOW_MSG)),ms); p.then(v=>{ clearTimeout(t); res(v); },e=>{ clearTimeout(t); rej(e); }); });
function duFail(g,msg){ if(g!==DU.gen) return; duStop(); duStep('how',msg instanceof Error?msg.message:msg||DU_SLOW_MSG); }

// the duel session over a transport that is open (both ends): lobby, start, result
function duBegin(tr,host){
  const d=activeDeck(), s=new DuelSession(tr,{name:duelName(),deck:d.list.slice(),host,look:playerLook()});
  try{ localStorage.setItem(DU_NAME_KEY,$('#duName').value.trim().slice(0,20)); }catch(e){}
  DU.session=s; DU.tr=tr; DU.list=d.list.slice(); DU.over=false; DU.closed=false;
  const g=DU.gen, oc=tr.onclose; tr.onclose=()=>{ DU.closed=true; if(oc) oc(); };   // a bye comes before a close; a close alone is a lost connection
  // the session needs a tick at least once a second (its heartbeat) even when the page is hidden, the pause menu is open
  // or the phone is locked, and the frame loop is not running then: a timer does it
  DU.timer=setInterval(()=>{ try{ s.tick(); }catch(e){ console.error('duel tick:',e); } },500);
  duelPauseSync();
  clearTimeout(DU.waitT); DU.waitT=setTimeout(()=>{ if(DU.session===s&&s.state==='connecting') duFail(g,DU_SLOW_MSG); },DU.timeout);
  s.on('lobby',m=>{ if(DU.session!==s) return; clearTimeout(DU.waitT); duStep('lobby');
    $('#duVsMeName').textContent=duelName(); $('#duLobbyTxt').textContent=m.name||'Hexmancer';
    duSprite($('#duVsMe'),playerLook()); duSprite($('#duVsOpp'),m.look||'wizard'); });
  s.on('refused',m=>{ if(DU.session!==s) return;
    const why=m.reason==='timeout'?DU_SLOW_MSG:m.reason==='peer left'?'The other player left.':'Duel refused: '+m.reason+(m.reason==='invalid deck size'?' (a duel deck has 45 to 60 cards)':'')+'.';
    duStop(); $('#duWaitTxt').textContent=''; duMsg(why); });
  s.on('start',()=>{ if(DU.session!==s) return; clearTimeout(DU.startT); DU.startT=setTimeout(()=>duRun(s),1200); });   // a beat on the lobby, so the names can be read
  s.on('end',m=>duelOver(s,m.result,m.reason));
}
function duRun(s){ if(DU.session!==s||DU.over) return;
  try{
    prev=performance.now(); show('scrBattle');
    startDuel(DU.list,s,{
      onCustom:renderCustom,
      onFight:()=>{ dragAbort(); $('#custom').classList.remove('on'); hud(true); },
      onCast:(c,inst)=>{ showCast(c,inst); buzz(12); },
      onHurt:d=>{ buzz(d>=15?60:30); const h=$('#hurtFx'); h.classList.remove('on'); void h.offsetWidth; h.classList.add('on'); },
      onCombo:label=>{ B.combos=(B.combos||0)+1; B.hitStop=Math.max(B.hitStop||0,.09); banner('✦ '+label.split(':')[0],'#ffe066'); },
    });
    hud(true);
  }catch(e){ console.error('duel start:',e); duelLeave(); tip('The duel could not start.'); }
}
// the one end of a duel: close the card screen, stop everything, show the result
function duelOver(s,result,reason){ if(DU.session!==s||DU.over) return; DU.over=true;
  const title=result==='draw'?'Draw':result==='lose'?'You lost':reason==='timeout'||(reason==='left'&&DU.closed)?'Connection lost':reason==='left'?'Opponent left':'You won';
  const text={'Draw':'You both fell at the same moment.','You lost':'Their spell found you first.','You won':'You outlasted them.','Opponent left':'The other player left the duel.','Connection lost':'The other phone stopped answering.'}[title];
  duStop(); $('#custom').classList.remove('on'); $('#pause').classList.remove('on'); paused=false; dragAbort();
  reveal(title,text+' A duel gives nothing and costs nothing.',[],[[DU.from==='camp'?'Back to camp':'Back to menu',()=>{ B=null; DU.over=false; duHome(); }]]); }

// ---- the pairing screen ----
function duCopy(btn,ta){ ta.focus(); ta.select(); let ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
  const label=btn.dataset.label||(btn.dataset.label=btn.textContent);
  const done=r=>{ btn.textContent=r?'Copied ✓':'Select & copy ↓'; setTimeout(()=>{ btn.textContent=label; },1800); };
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(()=>done(true),()=>done(ok)); else done(ok); }
$('#duCopy').onclick=()=>duCopy($('#duCopy'),$('#duOffer'));
// Paste: the clipboard straight into the box, or (no clipboard access) the box focused for a long-press paste
for(const id of ['duPaste1','duPaste2']) $('#'+id).onclick=async()=>{ const ta=$('#'+$('#'+id).dataset.to);
  try{ const t=await navigator.clipboard.readText(); if(t){ ta.value=t.trim(); duMsg(''); return; } }catch(e){}
  ta.focus(); duMsg('Long-press the box and choose Paste.'); };
$('#duCopy2').onclick=()=>duCopy($('#duCopy2'),$('#duAnswer'));
$('#duBack').onclick=()=>{ if(DU.step==='role') return duelLeave(); duStop(); if(DU.step==='how') return duStep('role'); duStep('how'); };
$('#duHost').onclick=()=>{ DU.host=true; duStep('how'); $('#duHowTxt').textContent='You host. How will your friend connect?'; duHow(); };
$('#duJoin').onclick=()=>{ DU.host=false; duStep('how'); $('#duHowTxt').textContent='You join. How will you connect?'; duHow(); };
function duHow(){ const ok=duelRoomOk(location.protocol,location.hostname); $('#duRoom').hidden=!ok; $('#duRoomHint').hidden=!ok; }
$('#duWifi').onclick=()=>{ if(DU.host) return duHostWifi(); $('#duOfferIn').value=''; $('#duAnswer').value=''; $('#duMakeAnswer').disabled=false; duStep('joincode'); };
async function duHostWifi(){
  duStop(); const g=DU.gen; duStep('hostcode','Making your code…'); $('#duOffer').value=''; $('#duAnswerIn').value=''; $('#duAccept').disabled=true;
  if(typeof RTCPeerConnection==='undefined') return duFail(g,'This browser cannot make Wi-Fi codes. Try another browser.');
  const hp=RtcTransport.host(); hp.then(h=>{ if(g!==DU.gen) h.transport.close(); },()=>{});   // one that arrives after Back or a timeout is closed
  let h; try{ h=await duRace(hp,DU.timeout); }catch(e){ return duFail(g,e); }
  if(g!==DU.gen) return;
  DU.tr=h.transport; DU.accept=h.accept; $('#duOffer').value=h.offerCode; $('#duAccept').disabled=false; duMsg('');
}
$('#duAccept').onclick=async()=>{ const g=DU.gen, acc=DU.accept; if(!acc) return; duMsg('');
  try{ await acc($('#duAnswerIn').value); }catch(e){ if(g===DU.gen) duMsg(e.message); return; }   // 'Bad code ...': stay here
  if(g!==DU.gen) return;
  duStep('wait'); $('#duWaitTxt').textContent='Connecting…';
  const tr=DU.tr; try{ await duRace(tr.opened(DU.timeout),DU.timeout); }catch(e){ return duFail(g,DU_SLOW_MSG); }
  if(g===DU.gen) duBegin(tr,true); };
$('#duMakeAnswer').onclick=async()=>{ const g=DU.gen, btn=$('#duMakeAnswer'); duMsg('');
  if(typeof RTCPeerConnection==='undefined') return duMsg('This browser cannot make Wi-Fi codes. Try another browser.');
  btn.disabled=true; $('#duAnswer').value='';
  const jp=RtcTransport.join($('#duOfferIn').value); jp.then(j=>{ if(g!==DU.gen) j.transport.close(); },()=>{});
  let j; try{ j=await duRace(jp,DU.timeout); }catch(e){ if(g===DU.gen){ btn.disabled=false; duMsg(e.message); } return; }   // 'Bad code ...': stay here
  if(g!==DU.gen) return;
  DU.tr=j.transport; $('#duAnswer').value=j.answerCode; duStep('answer');
  // the host has to carry the code across and paste it: that wait is people's, not the network's
  const tr=DU.tr; try{ await duRace(tr.opened(DU.timeout*3),DU.timeout*3); }catch(e){ return duFail(g,DU_SLOW_MSG); }
  if(g===DU.gen) duBegin(tr,false); };
$('#duRoom').onclick=()=>{ duStop(); duStep('room'); const host=DU.host, inp=$('#duRoomName'); inp.readOnly=host; $('#duRoomGo').disabled=false;
  if(host){ const L='ABCDEFGHJKLMNPQRSTUVWXYZ'; inp.value=Array.from({length:4},()=>L[Math.floor(Math.random()*L.length)]).join(''); }
  else inp.value='';
  $('#duRoomTxt').textContent=host?'Tell your friend this room name. Connect first, and have them join it.':'Type the room name your host gave you.'; };
$('#duRoomGo').onclick=async()=>{ const g=DU.gen, room=$('#duRoomName').value.toUpperCase().replace(/[^A-Z]/g,''), host=DU.host; duMsg('');
  if(room.length!==4) return duMsg('A room name is four letters.');
  $('#duRoomGo').disabled=true;
  const wp=WsTransport.connect(room); wp.then(t=>{ if(g!==DU.gen) t.close(); },()=>{});
  let tr; try{ tr=await duRace(wp,DU.timeout); }catch(e){ if(g===DU.gen){ $('#duRoomGo').disabled=false; duMsg(e.message); } return; }
  if(g!==DU.gen) return;
  DU.tr=tr; duStep('wait'); $('#duWaitTxt').textContent='In room '+room+'. Waiting for the other player…';
  // the relay forwards only to someone already there, so each side says hello and makes its session when it hears the other
  tr.onmessage=t=>{ if(DU.tr!==tr) return; duBegin(tr,host); tr.onmessage(t); };
  tr.send(DU_PROBE);
  DU.waitT=setTimeout(()=>{ if(DU.tr===tr&&!DU.session) duFail(g,DU_SLOW_MSG); },DU.timeout*3); };
$('#duName').oninput=()=>{ try{ localStorage.setItem(DU_NAME_KEY,$('#duName').value.trim().slice(0,20)); }catch(e){} };

// ---- debug menu ----
$('#dbgDuel').onclick=()=>{ if($('#dbgDuel').disabled) return; duelDbgSync(); if($('#dbgDuel').disabled) return; openDuel(); };
new MutationObserver(()=>{ if($('#debug').classList.contains('on')) duelDbgSync(); }).observe($('#debug'),{attributes:true,attributeFilter:['class']});
duelDbgSync();
