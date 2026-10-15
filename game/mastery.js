/* Hexmancers — colour mastery and card sets (the long goals that reward building new decks).
   Mastery: every fight you win gives each colour mastery in proportion to its share of your deck.
   Each colour has 10 levels, quick at first and slower later, so spreading out across colours pays.
   Levels 3, 6 and 9 give a mastery card of that colour, found nowhere else; level 10 gives that
   colour's cards a gold frame.
   Sets: each colour's cards are split by type into sets of up to 8. Own every card of a set and its
   reward waits on the Mastery screen. Finished sets also unlock card backs.
   save.mastery = {fire:{xp, level, got:[levels claimed]} ...}, save.sets = {setId:1 (claimed)}, save.back */

const MASTERY_MAX=10;
const masteryNeed=L=>Math.round(25+20*Math.pow(L,1.4));      // xp from level L to L+1 (L from 0)
// what each level gives
const MASTERY_REWARD={1:{shards:20}, 2:{pack:1}, 3:{card:0}, 4:{shards:40}, 5:{pack:1, gold:100}, 6:{card:1}, 7:{shards:60}, 8:{pack:1}, 9:{card:2}, 10:{frame:1}};
const MASTER_TITLE={fire:'Pyre-Lord', frost:'Winterheart', storm:'Stormcrown', verdant:'Elder', light:'Dawnsworn', shadow:'Nightbound'};

/* The mastery cards: three per colour, each a stronger, renamed version of one of the colour's best
   cards (a rare, then two legendaries of different types). They are not in the drop pools. */
const MASTERY_CARDS={};
(function(){ for(const k of SIX){
  const pool=CARD_LIST.filter(c=>c.color===k&&!c.sig&&['strike','lob','summon','sentry','ward'].includes(c.type)).sort((a,b)=>b.rank-a.rank||(a.id<b.id?-1:1));
  const rare=pool.find(c=>c.rarity==='rare'), leg1=pool.find(c=>c.rarity==='legendary'), leg2=pool.find(c=>c.rarity==='legendary'&&leg1&&c.type!==leg1.type);
  MASTERY_CARDS[k]=[rare,leg1,leg2].map((b,i)=>{ if(!b) return null;
    const c=Object.assign({},b,{id:'mastery_'+k+'_'+(i+1), name:MASTER_TITLE[k]+'’s '+b.name, rarity:i?'legendary':'rare', mastery:true, sig:false});
    for(const f of ['pow','amt','hp']) if(typeof c[f]==='number') c[f]=Math.round(c[f]*1.2);
    CARDS[c.id]=c; return c.id; }); } })();

function mState(k){ save.mastery=save.mastery||{}; return save.mastery[k]=save.mastery[k]||{xp:0, level:0, got:[]}; }
const masteryFrame=k=>!!(save&&save.mastery&&save.mastery[k]&&save.mastery[k].level>=MASTERY_MAX);

// a fight was won: share out the xp, level up, hand out each level's reward. Returns the level-ups.
function masteryWin(b,boss){ if(b.trial) return [];
  const list=activeDeck().list, n=list.length||1, by={}; list.forEach(id=>{ const c=CARDS[id]; if(c) by[c.color]=(by[c.color]||0)+1; });
  const base=10+2*b.depth+(boss?20:0), ups=[];
  for(const k of SIX){ const share=(by[k]||0)/n; if(share<.1) continue; const m=mState(k); if(m.level>=MASTERY_MAX) continue;
    m.xp+=Math.max(1,Math.round(base*share));
    while(m.level<MASTERY_MAX&&m.xp>=masteryNeed(m.level)){ m.xp-=masteryNeed(m.level); m.level++; masteryGive(k,m.level); ups.push({color:k, level:m.level}); }
    if(m.level>=MASTERY_MAX) m.xp=0; }
  return ups; }
// rewards are handed out right away, except packs, which wait to be opened on the Mastery screen
function masteryGive(k,L){ const r=MASTERY_REWARD[L], m=mState(k); if(!r||m.got.includes(L)) return; m.got.push(L);
  if(r.shards) save.shards=(save.shards||0)+r.shards;
  if(r.gold) save.gold+=r.gold;
  if(r.pack){ save.packs=save.packs||[]; save.packs.push(k); }
  if(r.card!=null){ const id=MASTERY_CARDS[k][r.card]; if(id) addCards(save,[CARDS[id]]); } }
function rewardLine(k,L){ const r=MASTERY_REWARD[L]; if(!r) return '';
  return [r.shards&&r.shards+' shards', r.gold&&r.gold+' gold', r.pack&&COLORS[k].name+' pack', r.card!=null&&MASTERY_CARDS[k][r.card]&&CARDS[MASTERY_CARDS[k][r.card]].name, r.frame&&'gold card frames'].filter(Boolean).join(' + '); }

/* ---------------- card sets ---------------- */
const SET_SIZE=8, TYPE_PLURAL={strike:'Strikes', lob:'Lobs', ward:'Wards', sentry:'Sentries', boon:'Boons', charge:'Charges', utility:'Utilities', trap:'Traps', environment:'Grounds', summon:'Summons', machine:'Machines', instant:'Instants'};
const CARD_SETS_LIST=[];
(function(){ const R=['','I','II','III','IV','V','VI','VII','VIII','IX','X'];
  for(const k of FAM_ORDER_SETS()){ const by={};
    CARD_LIST.filter(c=>c.color===k&&c.rarity!=='hero'&&!c.recipe&&TYPE_PLURAL[c.type]).forEach(c=>(by[c.type]=by[c.type]||[]).push(c));
    for(const t of Object.keys(by)){ const L=by[t].sort((a,b)=>a.rank-b.rank||(a.id<b.id?-1:1)), parts=Math.ceil(L.length/SET_SIZE);
      for(let i=0;i<parts;i++){ const cards=L.slice(i*SET_SIZE,(i+1)*SET_SIZE).map(c=>c.id); if(cards.length<3) continue;
        CARD_SETS_LIST.push({id:k+'_'+t+'_'+(i+1), color:k, name:COLORS[k].name+' '+TYPE_PLURAL[t]+(parts>1?' '+R[i+1]:''), cards}); } } } })();
function FAM_ORDER_SETS(){ return typeof FAM_ORDER!=='undefined'?FAM_ORDER.filter(k=>COLORS[k]):Object.keys(COLORS); }
const setOwned=s=>s.cards.filter(id=>(save.owned[id]||0)>0).length;
const setReward=s=>({shards:30+5*s.cards.length, gold:60});
const setsDone=()=>Object.keys(save.sets||{}).length;
// card backs: the Hex sigil, then Arcane Weave after 5 finished sets and Starfield after 15
const BACK_UNLOCK={sigil:0, weave:5, stars:15}, BACK_NAME={sigil:'Hex sigil', weave:'Arcane weave', stars:'Starfield'};
const backOpen=st=>setsDone()>=BACK_UNLOCK[st];

/* ---------------- the Mastery screen ---------------- */
let mTab=null;
function openMastery(){ renderMastery(); show('scrMastery'); }
function renderMastery(){ $('#mShards').innerHTML=uiIcon('shard',20)+(save.shards||0);
  const box=$('#masteryList'); box.innerHTML='';
  // sealed packs from mastery levels
  if((save.packs||[]).length){ const p=document.createElement('button'); p.className='btn mpacks'; p.textContent='Open '+save.packs.length+' sealed pack'+(save.packs.length>1?'s':'');
    p.onclick=()=>{ const k=save.packs.shift(); persist(); packReward(k,save.deepest,()=>{ show('scrMastery'); renderMastery(); }); }; box.appendChild(p); }
  for(const k of SIX){ const m=mState(k), max=m.level>=MASTERY_MAX, need=max?1:masteryNeed(m.level), el=document.createElement('div'); el.className='mrow'; el.style.setProperty('--c',COLORS[k].c);
    const next=max?'Mastered: gold frames on '+COLORS[k].name+' cards':'Next: '+rewardLine(k,m.level+1);
    el.innerHTML=`<div class="mhead">${uiIcon('mastery',36,COLORS[k].c)}<b>${COLORS[k].icon} ${COLORS[k].name}</b><span class="mlv">Level ${m.level} / ${MASTERY_MAX}</span></div>
      <div class="bprog"><i style="width:${max?100:Math.round(100*m.xp/need)}%"></i><span>${max?'max':m.xp+' / '+need}</span></div><p class="mnext">${esc(next)}</p>`;
    const cards=document.createElement('div'); cards.className='mcards';
    MASTERY_CARDS[k].forEach((id,i)=>{ if(!id) return; const c=CARDS[id], own=(save.owned[id]||0)>0, e=cardEl(c,own?'':'<span class="badge">Lv '+(3+3*i)+'</span>',!own);
      e.onclick=()=>own?showDetail(c):tip('Reach '+COLORS[k].name+' mastery '+(3+3*i)+' to earn '+c.name); cards.appendChild(e); });
    el.appendChild(cards); box.appendChild(el); }
  renderSets(); }
function renderSets(){ const box=$('#setList'); box.innerHTML='';
  const cols=FAM_ORDER_SETS().filter(k=>CARD_SETS_LIST.some(s=>s.color===k)); if(!mTab||!cols.includes(mTab)) mTab=cols[0];
  // card backs
  const bk=document.createElement('div'); bk.className='mbacks';
  bk.innerHTML=`<p class="hint">${setsDone()} sets finished. Card back:</p>`;
  for(const st of Object.keys(BACK_UNLOCK)){ const b=document.createElement('button'), open=backOpen(st); b.className='mback'+((save.back||'sigil')===st?' on':'')+(open?'':' locked');
    const cv=cardBackArt(st), img=document.createElement('img'); img.src=cv.toDataURL?cv.toDataURL():cv; b.appendChild(img);
    b.insertAdjacentHTML('beforeend',`<span>${BACK_NAME[st]}${open?'':'<br><small>'+BACK_UNLOCK[st]+' sets</small>'}</span>`);
    b.onclick=()=>{ if(!open) return tip('Finish '+BACK_UNLOCK[st]+' card sets to unlock '+BACK_NAME[st]); save.back=st; persist(); renderSets(); }; bk.appendChild(b); }
  box.appendChild(bk);
  const tabs=document.createElement('div'); tabs.className='tabs settabs';
  for(const k of cols){ const t=document.createElement('button'), ready=CARD_SETS_LIST.filter(s=>s.color===k&&!(save.sets||{})[s.id]&&setOwned(s)===s.cards.length).length;
    t.className='chip'+(k===mTab?' on':''); t.style.setProperty('--c',COLORS[k].c); t.innerHTML=COLORS[k].icon+(ready?' <b class="mbadge">'+ready+'</b>':''); t.title=COLORS[k].name; t.onclick=()=>{ mTab=k; renderSets(); }; tabs.appendChild(t); }
  box.appendChild(tabs);
  for(const s of CARD_SETS_LIST.filter(s=>s.color===mTab)){ const have=setOwned(s), done=(save.sets||{})[s.id], full=have===s.cards.length, r=setReward(s), el=document.createElement('div');
    el.className='setrow'+(done?' done':full?' ready':''); el.style.setProperty('--c',COLORS[s.color].c);
    el.innerHTML=`<div class="sethead"><b>${esc(s.name)}</b><span>${have} / ${s.cards.length}</span></div><div class="bprog"><i style="width:${Math.round(100*have/s.cards.length)}%"></i></div>
      <div class="setcards">${s.cards.map(id=>{ const c=CARDS[id], own=(save.owned[id]||0)>0; return `<span class="sc${own?' own':''}" title="${esc(save.seen[id]?c.name:'???')}">${own||save.seen[id]?esc(c.name):'???'}</span>`; }).join('')}</div>`;
    const f=document.createElement('div'); f.className='setfoot';
    if(done) f.innerHTML='<span class="good">Claimed ✓</span>';
    else { f.innerHTML=`<span class="bchip">${uiIcon('shard',16)}${r.shards}</span><span class="bchip">${uiIcon('coin',16)}${r.gold}</span>`;
      if(full){ const c=document.createElement('button'); c.className='btn small'; c.textContent='Claim'; c.onclick=()=>{ save.sets=save.sets||{}; save.sets[s.id]=1; save.shards=(save.shards||0)+r.shards; save.gold+=r.gold; persist();
        tip(s.name+' finished: +'+r.shards+' shards, +'+r.gold+' gold'); renderSets(); $('#mShards').innerHTML=uiIcon('shard',20)+(save.shards||0); }; f.appendChild(c); } }
    el.appendChild(f); box.appendChild(el); } }

$('#goMastery').onclick=()=>openMastery();
