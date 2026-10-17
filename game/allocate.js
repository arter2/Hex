/* ---------------- The card list on the new rules (card rules plan, step 2) ----------------
   Every creature (summon, machine, tower) and every strike in the collection is given its parts
   here, from its name, its old rule and its colour, and rebuilt with the new numbers
   (crBuild in creatures.js, strikeBuild in strikes.js).
     creatures: behaviour, HP tier, speed, keyword, trait
     strikes:   shape, keyword, rider (and the bomblet pattern of a cluster bomb)
   Two cards of one colour must differ in at least 2 parts: a card whose first-choice parts are too
   close to one already given changes its least important parts until they aren't. With these parts
   that can't hold for every card (a colour fits at most (keywords+1)×(riders+1) strikes, and Gray,
   with no keywords, at most 120 creatures), so past that the card takes the parts that clash with
   the fewest others.
   It is seeded by the card's id, so a card gets the same parts on every load.
   Not here yet: the cuts (each colour down to 200), and the other kinds of card (wards, boons...).
   NEW_CARDS=false turns it off and the old rules come back. */
const NEW_CARDS=true;

// a small seeded random number generator per card, so its parts never change between loads
function alRng(id){ let h=2166136261; for(let i=0;i<id.length;i++){ h^=id.charCodeAt(i); h=Math.imul(h,16777619); }
  return ()=>{ h+=0x6D2B79F5; let t=h; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }

/* Words in a name that suggest a part. Each entry: regexp, then the parts it hints at
   (beh, tier, speed, trait, kw for creatures; shape, rider for strikes). */
const AL_CR_HINTS=[
  [/archer|bow|longbow|hunter|ranger|crossbow|slinger|ballista/i, {beh:['snipe','bolt','pierce']}],
  [/sniper|marksm|eye|owl|hawk|falcon|eagle/i, {beh:['snipe','diag','dash']}],
  [/cannon|gun|musket|rifle|turret|gatling/i, {beh:['bolt','pierce','twin'], speed:['steady','slow']}],
  [/repeater|swarm|bees|hornet|wasp|gnat|locust|flock|murder of/i, {beh:['barrage','twin','zigzag'], speed:['frantic','quick'], tier:['frail']}],
  [/mortar|catapult|trebuchet|siege|bombard|lobber|hurler|thrower/i, {beh:['lob','blast','cross'], speed:['slow']}],
  [/bomb|powder|barrel|blast|grenad|keg/i, {beh:['blast','cross'], trait:['explodes']}],
  [/wolf|hound|dog|jackal|fox|cat|panther|tiger|lion|lynx|leopard|coyote|cadejo|shuck/i, {beh:['pounce','dash'], trait:['pack','bloodlust','ambush']}],
  [/boar|bull|rhino|elephant|ox\b|aurochs|mammoth|ram\b|bison|charger|cavalry|centaur/i, {beh:['trample'], tier:['tough','huge']}],
  [/giant|titan|colossus|ettin|cyclops|behemoth|leviathan|kraken|sasquatch|yeti|ogre/i, {beh:['trample','lob','pounce'], tier:['huge','colossal'], speed:['slow']}],
  [/golem|statue|construct|automaton|terracotta|moai|clockwork/i, {beh:['guards','trample','bolt'], tier:['tough','huge'], speed:['slow','steady']}],
  [/knight|guard|sentinel|warden|soldier|spearman|hoplite|centurion|armor|armour|helm|paladin|shield/i, {beh:['guards','taunt','trample'], tier:['tough']}],
  [/troll|brute|bear|ape|gorilla|oni|minotaur/i, {beh:['pounce','trample','taunt'], tier:['tough','huge']}],
  [/tortoise|turtle|tortuga|armadillo|beetle|crab|snail/i, {beh:['guards','taunt','wardmaker'], tier:['tough','huge'], speed:['slow']}],
  [/wall|rampart|palisade|barricade|bastion|gate|fort|keep\b|bulwark/i, {beh:['wardmaker','guards','taunt'], tier:['huge','tough'], speed:['slow']}],
  [/priest|cleric|healer|nurse|monk|saint|nun|shrine|lantern|candle|angel|seraph|unicorn|familiar/i, {beh:['mends','shields','empower'], trait:['blessed','martyr']}],
  [/sage|scholar|bard|muse|oracle|seer|banner|drummer|herald|totem|idol/i, {beh:['empower','shields','mends'], trait:['rallying']}],
  [/necromancer|summoner|queen|mother|broodmother|hive|nest|shepherd|piper|matriarch|conjurer/i, {beh:['summoner']}],
  [/mage|wizard|witch|sorcer|shaman|warlock|magus|druid|djinn|genie/i, {beh:['chain','blast','beam','cone']}],
  [/dragon|wyrm|drake|wyvern|salamander|phoenix|chimera|manticore/i, {beh:['cone','beam','blast']}],
  [/whelp|tiny|little|baby|pup|cub|kit\b|hatchling/i, {tier:['frail'], speed:['quick']}],
  [/sprite|fairy|pixie|imp|gremlin|bat|rat|mouse|moth|wisp|spark/i, {tier:['frail'], speed:['quick','frantic'], beh:['zigzag','dash','pounce','barrage']}],
  [/eel|storm|thunder|lightning|volt|raiju|tesla|coil|static/i, {beh:['chain','beam','zigzag']}],
  [/mole|worm|sandworm|digger|burrow|miner|drill/i, {beh:['burrow']}],
  [/serpent|snake|naga|viper|cobra|spider|scorpion|centipede|leech/i, {beh:['bolt','pounce','zigzag'], kw:['poison','slow','curse']}],
  [/ghost|wraith|spirit|specter|spectre|phantom|banshee|shade|yurei|onryo|poltergeist/i, {beh:['zigzag','snipe','chain'], trait:['phantom','rises','dread']}],
  [/skeleton|zombie|ghoul|mummy|lich|bone|undead|draugr|revenant|jiangshi/i, {trait:['rises','plague']}],
  [/vampire|strigoi|nosferatu|leech|blood/i, {trait:['lifesteal'], kw:['drain']}],
  [/plague|rot|pox|rat\b|blight/i, {trait:['plague'], kw:['poison']}],
  [/tree|ent\b|treant|oak|willow|grove|bramble|vine|root/i, {beh:['guards','lob','summoner'], trait:['regrows','seeds','thorny'], speed:['slow']}],
  [/thorn|cactus|briar|nettle|urchin|hedgehog|porcupine/i, {trait:['thorny']}],
  [/mushroom|fung|spore|thallid|mycon|mold/i, {beh:['blast','barrage','summoner'], trait:['seeds','regrows'], kw:['poison']}],
  [/chameleon|stalker|lurker|ambush|assassin|ninja|shadow|thief|rogue/i, {beh:['dash','snipe'], trait:['ambush','camouflage','phantom']}],
  [/frost|ice|snow|winter|glacier|rime|hail/i, {kw:['freeze','slow'], trait:['chilling','shatter']}],
  [/fire|flame|ember|cinder|lava|magma|ash|blaze|inferno|volcan/i, {kw:['burn'], trait:['scorched','explodes']}],
  [/sea|wave|tide|kelp|merfolk|selkie|kappa|shark|orca|whale|narwhal|walrus|seal|kraken|squid|octop/i, {trait:['tidal','submerge'], kw:['push','pull']}],
  [/sun|dawn|holy|radiant|light|halo|gold/i, {trait:['radiant','blessed']}],
  [/veteran|old|elder|grizzled|captain|sergeant|general|ronin/i, {trait:['veteran','laststand','steadfast']}],
  [/loyal|faithful|mastiff|companion|squire|page/i, {trait:['loyal']}],
  [/militia|regiment|legion|phalanx|patrol|squad|watch\b|drill/i, {trait:['drilled']}],
];
const AL_ST_HINTS=[
  [/arrow|bow|longbow|dart|shot|musket|bullet|pellet|bolt|quarrel/i, {shape:['line','spear','snipe','twin']}],
  [/snipe|aimed|eye|mark|hunt|bounty/i, {shape:['snipe','mark']}],
  [/lance|spear|pike|javelin|harpoon|thrust|impale|skewer/i, {shape:['spear','line'], rider:['pierce']}],
  [/rocket|missile|firework|skyrocket/i, {shape:['missiles','cluster']}],
  [/bomb|grenade|keg|powder|petard|cluster/i, {shape:['cluster','burst','mine']}],
  [/mine|trap|snare|caltrop|landmine/i, {shape:['mine']}],
  [/chain|arc|lightning|fork|jolt|spark|zap/i, {shape:['chain','zigzag']}],
  [/wave|tide|flood|surge|tsunami|torrent/i, {shape:['wave','row']}],
  [/quake|tremor|nova|shock|stomp|roar|howl|thunderclap|clap/i, {shape:['shockwave']}],
  [/meteor|rain|hail|storm|downpour|comet|starfall|fall/i, {shape:['column','all','cluster']}],
  [/boomerang|blade|disc|chakram|ring|sickle|scythe/i, {shape:['boomerang','ricochet']}],
  [/volley|barrage|gatling|salvo|flurry|hail of/i, {shape:['gun','missiles']}],
  [/ricochet|bounce|skip|carom/i, {shape:['ricochet']}],
  [/fan|spray|spread|breath|cone|gust|gale|sweep/i, {shape:['fan','wedge']}],
  [/twin|double|pair|two/i, {shape:['twin']}],
  [/curse|doom|hex|omen|death|reap|soul/i, {shape:['mark','snipe'], rider:['onkill']}],
  [/burst|blast|explosion|pop|splash/i, {shape:['burst']}],
  [/slash|cleave|axe|swipe|rake|claw|bite|fist|punch/i, {shape:['wedge','fan','burst'], rider:['crit','recoil']}],
  [/charge|rush|ram|ride|tackle|lunge/i, {shape:['line','spear'], rider:['recoil']}],
  [/lash|whip|vine|tendril|grasp|hook|lure/i, {shape:['zigzag','boomerang','line']}],
  [/dig|burrow|root|underground|tunnel/i, {shape:['dig']}],
  [/beam|ray|lance of light|sunbeam/i, {shape:['row','line'], rider:['pierce']}],
  [/crit|precise|true|keen|sharp/i, {rider:['crit']}],
];
// the old rule's family of new behaviours/shapes, used when the name says nothing
const AL_AI_FAMILY={
  shooter:['bolt','pierce','twin','snipe','zigzag','diag','cone','chain','beam','burrow','barrage'], bomber:['lob','blast','cross','barrage'],
  critter:['pounce','dash','trample'], healer:['mends','shields','empower','summoner'], guardian:['guards','taunt','trample','pounce','wardmaker'],
  turret:['bolt','pierce','snipe','beam','twin'], repeater:['twin','zigzag','barrage','bolt','chain'], mortar:['lob','blast','cross'], bulwark:['wardmaker','guards','taunt'],
  sentry:['bolt','snipe','pierce','chain','beam','lob','blast','cone','twin','diag','mends','shields','empower'] };
const AL_SHAPE_FAMILY={ line:['line','spear','snipe','twin','boomerang','burst','ricochet'], wedge:['wedge','fan','burst'], row:['row','column','wave'],
  all:['all','wave','shockwave','column'], missiles:['missiles','cluster','gun'], zigzag:['zigzag','chain','ricochet'], diag:['diag','fan','ricochet'], dig:['dig','spear','mine','mark'] };
const AL_KWS=['burn','freeze','stun','slow','poison','curse','drain','mend','valor','push','pull','confuse','self'];
const AL_TOWER_NO=new Set(['pounce','trample','dash']);   // towers never move
const AL_TRAIT_RATE={common:.45, uncommon:.7, rare:.9, legendary:1};
const AL_RIDER_RATE={common:.2, uncommon:.4, rare:.6, legendary:.8};
const AL_SHOT_SHAPES=['line','dig','zigzag','diag','twin','fan','spear','boomerang','gun','burst','ricochet'];

function alHints(name,table){ const o={}; for(const [re,h] of table) if(re.test(name)) for(const k in h) (o[k]=o[k]||[]).push(...h[k]); return o; }
// how many parts two part-lists share
const alSame=(a,b)=>a.reduce((n,x,i)=>n+(x===b[i]),0);

// order the options: what the name hints first, then what the old rule hints, then the rest shuffled;
// within each group the least used go first (`use` counts), so a colour gets a spread of them
function alOrder(all,named,family,rng,use){ const seen=new Set(), out=[];
  for(const g of [named||[],family||[],all]){ const grp=g.filter(x=>all.includes(x)&&!seen.has(x)).filter((x,i,a)=>a.indexOf(x)===i);
    grp.forEach(x=>seen.add(x)); const keyed=grp.map((x,i)=>({x,k:(g===all?rng()*3:i*.3)+(use&&use[x]||0)*.25})).sort((a,b)=>a.k-b.k); out.push(...keyed.map(o=>o.x)); }
  return out; }

/* Give each part in turn its first choice, then while the card is too close to one already given
   (fewer than 2 parts different), move to the next choice of the least important part. */
function alPick(opts,taken,min,cost){ // opts: lists of choices per part, most important first; cost: how much changing each part hurts
  const clashes=p=>{ let n=0; for(const t of taken) if(p.length-alSame(p,t)<min) n++; return n; };
  const first=opts.map(o=>o[0]); let best=first, bestN=clashes(first); if(!bestN) return first;
  // which parts to change, cheapest sets first: the trait alone, the keyword alone ... the behaviour last
  const sets=[]; for(let m=1;m<(1<<opts.length);m++){ const idx=opts.map((o,i)=>i).filter(i=>m&(1<<i)); sets.push({idx,c:idx.reduce((a,i)=>a+cost[i],0)}); }
  sets.sort((a,b)=>a.c-b.c);
  let checks=0;
  for(const {idx} of sets){
    const rec=(k,p)=>{ if(checks>3000) return null; if(k===idx.length){ checks++; const n=clashes(p); if(!n) return p; if(n<bestN){ best=p.slice(); bestN=n; } return null; }
      const i=idx[k]; for(let j=1;j<opts[i].length;j++){ p[i]=opts[i][j]; const r=rec(k+1,p); if(r) return r; } p[i]=first[i]; return null; };
    const r=rec(0,first.slice()); if(r) return r; if(checks>3000) break; }
  return best; }   // no choice is far enough from every card: the one closest to as few as possible

const AL_KEEP=['id','name','color','type','rank','rarity','code','body','mod','mach','race','legend','sig','art','look'];
function alClear(c){ for(const k of Object.keys(c)) if(!AL_KEEP.includes(k)) delete c[k]; }
const alF=c=>(1+.06*(c.rank-1))*RARITY_MULT[c.rarity];

/* CARD_PARTS (cardparts.js) holds every card's parts as worked out once, so a page load only reads
   them; a card missing there (a new one) is worked out here. Edit a card's parts there by hand to change
   it. To redo the whole table: allocateCards(CARD_LIST,{}) in a page loaded with NEW_CARDS on, then
   alTable() prints it. */
function allocateCards(list,table){ table=table||(typeof CARD_PARTS!=='undefined'?CARD_PARTS:{});
  const byCol={}; for(const c of list) (byCol[c.color]=byCol[c.color]||[]).push(c);
  const report={creatures:0, strikes:0, clashes:0};
  for(const col in byCol){
    // rarer cards pick first, so they get the parts they hint at
    const cards=byCol[col].slice().sort((a,b)=>['legendary','rare','uncommon','common'].indexOf(a.rarity)-['legendary','rare','uncommon','common'].indexOf(b.rarity)||(a.id<b.id?-1:1));
    const crTaken=[], stTaken=[], useB={}, useS={}, useT={};
    for(const c of cards){
      const kind=c.type;
      if(['summon','machine','sentry'].includes(kind)&&!c.brood){
        const T=table[c.id]; if(T){ alApplyCr(c,T.split('|')); crTaken.push(c.alParts); useB[c.beh]=(useB[c.beh]||0)+1; if(c.trait) useT[c.trait]=(useT[c.trait]||0)+1; report.creatures++; continue; }
        const rng=alRng(c.id), h=alHints(c.name,AL_CR_HINTS), old=kind==='sentry'?'sentry':c.ai;
        let behs=Object.keys(CR_BEH); if(kind==='sentry') behs=behs.filter(b=>!AL_TOWER_NO.has(b));
        const fam=(AL_AI_FAMILY[old]||[]).filter(b=>behs.includes(b));
        const bOpts=alOrder(behs,h.beh,fam,rng,useB);
        const tierAll=Object.keys(CR_TIER).filter(t=>!CR_TIER[t].rare||['rare','legendary'].includes(c.rarity));
        const tGuess=old==='guardian'||old==='bulwark'?'tough':c.hp&&c.pow===undefined?'tough':'sturdy';
        const tOpts=alOrder(tierAll,h.tier,[tGuess],rng);
        const sGuess=c.rate&&c.rate<=.6?'quick':c.rate&&c.rate>=1.8?'slow':'steady';
        const sOpts=alOrder(Object.keys(CR_SPEED),h.speed,[sGuess],rng);
        const kws=CR_KWS[col]||[], oldKw=AL_KWS.find(k=>c[k]!=null&&kws.includes(k));
        const wantKw=oldKw||(h.kw||[]).find(k=>kws.includes(k))||(kws.length&&rng()<.5?kws[Math.floor(rng()*kws.length)]:null);
        const kOpts=[wantKw,...[null,...kws].filter(k=>k!==wantKw)];
        let traits=crTraitsOf(col).filter(t=>!(kind==='sentry'&&['swift','loyal'].includes(t)));
        if(col==='brown'&&!c.race) traits=traits.filter(t=>t!=='racetech');
        const wantTr=col==='brown'&&c.race?'racetech':(h.trait||[]).find(t=>traits.includes(t))||(rng()<AL_TRAIT_RATE[c.rarity]&&traits.length?traits.slice().sort((a,b)=>(useT[a]||0)-(useT[b]||0)+rng()-.5)[0]:null);
        const trOpts=[wantTr,...alOrder([null,...traits].filter(t=>t!==wantTr),null,null,rng,useT)];
        const p=alPick([bOpts,tOpts,sOpts,kOpts,trOpts],crTaken,2,[16,4,3,2,1]);
        if(crTaken.some(t=>p.length-alSame(p,t)<2)) report.clashes++;
        crTaken.push(p); useB[p[0]]=(useB[p[0]]||0)+1; if(p[4]) useT[p[4]]=(useT[p[4]]||0)+1;
        alApplyCr(c,p); report.creatures++;
      } else if(kind==='strike'){
        const T=table[c.id]; if(T){ alApplySt(c,T.split('|')); stTaken.push(c.alParts.slice(0,3)); useS[c.shape]=(useS[c.shape]||0)+1; report.strikes++; continue; }
        const rng=alRng(c.id), h=alHints(c.name,AL_ST_HINTS), shapes=Object.keys(STRIKE_SHAPES).concat(Object.keys(STRIKE_OLD));
        const shOpts=alOrder(shapes,h.shape,AL_SHAPE_FAMILY[c.shape],rng,useS);
        const kws=((TRAITS[col]&&TRAITS[col].kws)||[]).filter((k,i,a)=>k&&a.indexOf(k)===i), oldKw=AL_KWS.find(k=>c[k]!=null);
        const kOpts=[oldKw||null,...[null,...kws].filter(k=>k!==(oldKw||null))];
        const wantR=(h.rider||[])[0]||(rng()<AL_RIDER_RATE[c.rarity]?Object.keys(STRIKE_RIDERS)[Math.floor(rng()*Object.keys(STRIKE_RIDERS).length)]:null);
        const rOpts=[wantR,...[null,...Object.keys(STRIKE_RIDERS)].filter(r=>r!==wantR)];
        const p=alPick([shOpts,kOpts,rOpts],stTaken,2,[6,2,1]);
        if(stTaken.some(t=>p.length-alSame(p,t)<2)) report.clashes++;
        stTaken.push(p); useS[p[0]]=(useS[p[0]]||0)+1;
        const cl=Object.keys(CLUSTER_SHAPES)[Math.floor(rng()*Object.keys(CLUSTER_SHAPES).length)];
        // Pierce rides only on shapes that fire shots
        alApplySt(c,[p[0],p[1],p[2]&&!(STRIKE_RIDERS[p[2]].shots&&!AL_SHOT_SHAPES.includes(p[0]))?p[2]:null,p[0]==='cluster'?cl:null]); report.strikes++;
      }
    }
  }
  return report;
}
// put a creature's or a strike's parts on the card and work out its numbers
function alApplyCr(c,p){ p=p.map(x=>x===''||x==null?null:x); const race=c.race; alClear(c);
  Object.assign(c,{beh:p[0], tier:p[1], speed:p[2]}); if(p[4]) c.trait=p[4];
  if(c.trait==='racetech') c.race=p[5]||race;
  crBuild(c,alF(c),c.rank,p[3]); c.alloc=1; c.alParts=p.slice(0,5); }
function alApplySt(c,p){ p=p.map(x=>x===''||x==null?null:x); alClear(c); c.shape=p[0];
  if(p[2]) c.rider=p[2]; if(c.shape==='cluster') c.cluster=p[3]||'ring';
  if(STRIKE_SHAPES[c.shape]) strikeBuild(c,alF(c),c.rank,p[1]);
  else { BUILD.strike(c,alF(c),c.rank,p[1],{},x=>x[0],(a,b)=>a); strikeRiders(c); }
  c.alloc=1; c.alParts=[p[0],p[1],p[2]||null]; }
// the table of every card's parts, as cardparts.js holds it
function alTable(){ const o={}; for(const c of CARD_LIST) if(c.alloc){ const kw=AL_KWS.find(k=>c[k]!=null)||'';
  o[c.id]=c.beh?[c.beh,c.tier,c.speed,kw,c.trait||'',c.trait==='racetech'?c.race:''].join('|').replace(/\|+$/,''):[c.shape,kw,c.rider||'',c.cluster||''].join('|').replace(/\|+$/,''); }
  return o; }
const ALLOC=NEW_CARDS?allocateCards(CARD_LIST):null;
