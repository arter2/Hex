/* ---------------- the Card lab (v78) ----------------
   A testing screen: build a card from its parts (creatures.js) and try it in a test battle.
   Its button on the front page shows only when Debug › Show Card lab is ticked; the tick is saved
   in this browser only. Lab cards are never saved and test battles give no rewards
   (ui.js: fight with xo.lab, victory and defeat hand over to labEnd). */
const LAB_KEY='hexCardLab';
const labOn=()=>{ try{ return localStorage.getItem(LAB_KEY)==='1'; }catch(e){ return false; } };
function labSync(){ const b=document.getElementById('mmLab'); if(b) b.hidden=!labOn(); }
const LAB={color:'fire', beh:'bolt', tier:'sturdy', speed:'steady', kw:null, trait:null, race:'dwarf', body:0, rank:6, rarity:'rare', foes:'mixed', depth:5, calm:false};
const LAB_FOES={
  pack:   {name:'Vermin pack', ids:['rat','bat','spider','worm']},
  mixed:  {name:'Mixed',       ids:['gloop','beetle','sellsword']},
  tough:  {name:'Tough pair',  ids:['sellsword','paladin']},
  casters:{name:'Wall casters',ids:['knight','witch','warden']},
};
const LAB_COLORS=['fire','frost','storm','verdant','light','shadow','gray','brown'];
// Brown creatures are machines; each body sets how it is drawn
const LAB_MACHINES=[...NOUNS.turret.map(n=>[n,'turret']),...NOUNS.repeater.map(n=>[n,'repeater']),...NOUNS.mortar.map(n=>[n,'mortar'])];
const labBodies=()=>LAB.color==='brown'?LAB_MACHINES.map(x=>x[0]):NOUNS.summon;

function labCard(){
  const S=LAB, F=(1+.06*(S.rank-1))*RARITY_MULT[S.rarity], body=labBodies()[S.body%labBodies().length];
  const word=WORDS[S.color][(Object.keys(CR_BEH).indexOf(S.beh)+S.rank)%WORDS[S.color].length];
  const c={id:'lab_'+S.color+'_'+body.toLowerCase(), name:word+' '+body, color:S.color, type:S.color==='brown'?'machine':'summon', rank:S.rank, rarity:S.rarity,
    beh:S.beh, tier:S.tier, speed:S.speed, lab:true};
  if(S.color==='brown') c.ai=LAB_MACHINES.find(x=>x[0]===body)[1];
  if(S.trait) c.trait=S.trait;
  if(S.trait==='racetech') c.race=S.race;
  c.id+='_'+[S.beh,S.tier,S.speed,S.kw||'-',S.trait||'-',S.rank,S.rarity].join('_');
  return crBuild(c,F,S.rank,S.kw);
}

// one row of chips: opts are [value, label, title]
function labRow(label,key,opts,col){ const row=document.createElement('div'); row.className='lrow';
  row.innerHTML='<label>'+label+'</label><div class="chips"></div>'; const box=row.lastChild;
  for(const [v,txt,title] of opts){ const b=document.createElement('button'); b.className='chip fc'+(LAB[key]===v?' on':''); b.style.setProperty('--c',col||'#7fd4ff');
    b.textContent=txt; if(title) b.title=title; b.onclick=()=>{ LAB[key]=v; labFix(key); renderLab(); }; box.appendChild(b); }
  return row; }
// keep the parts valid together after one changes
function labFix(key){ const S=LAB;
  if(key==='color'){ S.trait=crTraitsOf(S.color)[0]||null; if(!CR_KWS[S.color].includes(S.kw)) S.kw=null; S.body=0; }
  if(key==='tier'&&S.tier==='colossal'&&!['rare','legendary'].includes(S.rarity)) S.rarity='rare';
  if(key==='rarity'&&S.tier==='colossal'&&!['rare','legendary'].includes(S.rarity)) S.tier='huge'; }
function renderLab(){
  const S=LAB, col=COLORS[S.color].c, f=$('#labForm'); f.innerHTML='';
  f.appendChild(labRow('Colour','color',LAB_COLORS.map(k=>[k,COLORS[k].icon+' '+cName(k)]),col));
  { const row=document.createElement('div'); row.className='lrow'; row.innerHTML='<label>Behaviour</label>';
    for(const g in CR_GROUPS){ const sub=labRow(CR_GROUPS[g],'beh',Object.keys(CR_BEH).filter(k=>CR_BEH[k].group===g).map(k=>[k,CR_BEH[k].icon+' '+CR_BEH[k].name,CR_BEH[k].text]),col); sub.classList.add('lsub'); row.appendChild(sub); }
    f.appendChild(row); }
  f.appendChild(labRow('HP tier','tier',Object.keys(CR_TIER).map(k=>[k,CR_TIER[k].name+' ×'+CR_TIER[k].hp,CR_TIER[k].rare?'Rare cards and up only':'']),col));
  f.appendChild(labRow('Speed','speed',Object.keys(CR_SPEED).map(k=>[k,CR_SPEED[k].name+' '+CR_SPEED[k].rate+'s']),col));
  f.appendChild(labRow('Keyword','kw',[[null,'None'],...CR_KWS[S.color].map(k=>[k,k[0].toUpperCase()+k.slice(1)])],col));
  f.appendChild(labRow('Trait','trait',[[null,'None'],...crTraitsOf(S.color).map(k=>[k,CR_TRAITS[k].name,CR_TRAITS[k].text])],col));
  if(S.trait==='racetech') f.appendChild(labRow('Race','race',Object.keys(CR_RACE).map(k=>[k,RACES_TECH[k],CR_RACE[k]]),col));
  f.appendChild(labRow('Body','body',labBodies().map((n,i)=>[i,n]),col));
  f.appendChild(labRow('Rarity','rarity',['common','uncommon','rare','legendary'].map(k=>[k,RARITY[k].g+' '+RARITY[k].n]),col));
  { const row=document.createElement('div'); row.className='lrow'; row.innerHTML='<label>Rank <b id="labRankV">'+S.rank+'</b></label><input id="labRank" type="range" min="1" max="12" step="1" value="'+S.rank+'">';
    row.querySelector('input').oninput=e=>{ S.rank=+e.target.value; renderLab(); }; f.appendChild(row); }
  f.appendChild(labRow('Foes','foes',Object.keys(LAB_FOES).map(k=>[k,LAB_FOES[k].name,LAB_FOES[k].ids.map(id=>ENEMY_DEFS[id].name).join(', ')])));
  { const row=document.createElement('div'); row.className='lrow'; row.innerHTML='<label>Depth <b>'+S.depth+'</b></label><input type="range" min="1" max="30" step="1" value="'+S.depth+'">';
    row.querySelector('input').oninput=e=>{ S.depth=+e.target.value; renderLab(); }; f.appendChild(row); }
  f.appendChild(labRow('Foes act','calm',[[false,'Fight back'],[true,'Stand still']]));
  const c=labCard(), box=$('#labCard'); box.innerHTML=''; const el=cardEl(c); el.onclick=()=>typeof showDetail==='function'&&showDetail(c); box.appendChild(el);
  $('#labParts').textContent=[CR_BEH[c.beh].name,CR_TIER[c.tier].name,CR_SPEED[c.speed].name,S.kw||'no keyword',c.trait?CR_TRAITS[c.trait].name:'no trait'].join(' · ');
  $('#labWarn').textContent=save?'':'Load or start a game first: a test battle uses your character.';
  $('#labTry').disabled=!save;
}
function openLab(){ renderLab(); show('scrLab'); }
function labRandom(){ const S=LAB; S.color=pick(LAB_COLORS); labFix('color'); S.beh=pick(Object.keys(CR_BEH));
  S.rarity=pick(['common','uncommon','rare','legendary']); S.tier=pick(Object.keys(CR_TIER).filter(k=>!CR_TIER[k].rare||['rare','legendary'].includes(S.rarity)));
  S.speed=pick(Object.keys(CR_SPEED)); S.kw=pick([null,...CR_KWS[S.color]]); S.trait=pick(crTraitsOf(S.color)); S.race=pick(Object.keys(CR_RACE));
  S.body=Math.floor(Math.random()*labBodies().length); S.rank=1+Math.floor(Math.random()*12); renderLab(); }
// the test: a deck of 10 of the card against wave after wave of the chosen foes
function labTry(){ if(!save) return; const c=labCard(); CARDS[c.id]=c;
  const ids=LAB_FOES[LAB.foes].ids, waves=Array.from({length:30},()=>ids.slice());
  withChar(()=>fight(LAB.depth,waves,{lab:{list:Array(10).fill(c.id), calm:LAB.calm, card:c}})); }
function labEnd(win){ const b=B; B=null;
  reveal(win?'Test cleared':'Test lost',(win?'Every wave is down. ':'You fell. ')+'Lasted '+Math.round(b.time)+' s.',[],[['Back to the lab',()=>openLab(),true],['Again',()=>labTry()]]); }

$('#mmLab').onclick=()=>openLab();
$('#labBack').onclick=()=>openMenu();
$('#labRandom').onclick=labRandom;
$('#labTry').onclick=labTry;
{ const t=document.getElementById('dbgLab'); if(t){ t.checked=labOn(); t.onchange=()=>{ try{ localStorage.setItem(LAB_KEY,t.checked?'1':'0'); }catch(e){} labSync(); }; } }
labSync();
