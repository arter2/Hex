/* ---------------- Choosing every card's parts (card rules plan, step 2): a TOOL ----------------
   Not loaded by the game. The cards are written with their parts (cardsets.js lines, SIGNATURE and
   FORM_WALLS in cards.js) and kinds.js builds them. This is what chose those parts, from each card's
   name, its old rule and its colour, so that two cards of one colour differ in at least 2 parts:
   load it in a page after the game's scripts and call allocateCards(CARD_LIST) to choose again
   (rarer cards choose first), then alTable() to print the result.
     creatures: behaviour, HP tier, speed, keyword, trait (+ race), and a stance for Gray
     strikes:   shape, keyword, rider, cast (+ bomblets)
     the others: see PART_KEYS in kinds.js
   With some kinds the rule can't hold for every card; past that a card takes the parts that clash
   with the fewest others. */

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
function alPick(opts,taken,min,cost,ok){ ok=ok||(()=>true); // opts: lists of choices per part, most important first; cost: how much changing each part hurts
  const clashes=p=>{ let n=0; for(const t of taken) if(p.length-alSame(p,t)<min) n++; return n; };
  const first=opts.map(o=>o[0]); let best=first, bestN=ok(first)?clashes(first):1e9; if(!bestN) return first;
  // which parts to change, cheapest sets first: the trait alone, the keyword alone ... the behaviour last
  const sets=[]; for(let m=1;m<(1<<opts.length);m++){ const idx=opts.map((o,i)=>i).filter(i=>m&(1<<i)); sets.push({idx,c:idx.reduce((a,i)=>a+cost[i],0)}); }
  sets.sort((a,b)=>a.c-b.c);
  let checks=0;
  for(const {idx} of sets){
    const rec=(k,p)=>{ if(checks>3000) return null; if(k===idx.length){ checks++; if(!ok(p)) return null; const n=clashes(p); if(!n) return p; if(n<bestN){ best=p.slice(); bestN=n; } return null; }
      const i=idx[k]; for(let j=1;j<opts[i].length;j++){ p[i]=opts[i][j]; const r=rec(k+1,p); if(r) return r; } p[i]=first[i]; return null; };
    const r=rec(0,first.slice()); if(r) return r; if(checks>3000) break; }
  return best; }   // no choice is far enough from every card: the one closest to as few as possible

const AL_KEEP=['id','name','color','type','rank','rarity','code','body','mod','mach','race','legend','sig','art','look'];
function alClear(c){ for(const k of Object.keys(c)) if(!AL_KEEP.includes(k)) delete c[k]; }
const alF=c=>(1+.06*(c.rank-1))*RARITY_MULT[c.rarity];

// hints for the other kinds' parts, from words in a name
const AL_KD_HINTS=[
  [/dart|jab|flick|snap|quick|swift|spark|zip|needle|pin/i, {cast:['quick']}],
  [/judg|doom|meteor|great|grand|wrath|fury|heavy|cataclysm|apocal|smite|crush/i, {cast:['charged'], fuse:['heavy']}],
  [/grenade|pot|flask|vial|bottle|jar|pellet/i, {fuse:['quick']}],
  [/boulder|meteor|comet|anvil|crash|quake|bomb|barrel/i, {fuse:['heavy'], after:['knock']}],
  [/fire|flame|ember|cinder|lava|magma|brimstone|ash|blaze|napalm|oil/i, {after:['ground'], wfx:['burning']}],
  [/ice|frost|snow|rime|glacier|hail|winter|cold/i, {after:['ground'], wfx:['freezing']}],
  [/storm|thunder|lightning|static|volt|shock|spark|tesla/i, {wfx:['shocking']}],
  [/thorn|bramble|briar|spike|bone|cactus|nettle/i, {wfx:['thorns']}],
  [/holy|sanct|bless|temple|shrine|grace|halo|mercy|hope/i, {wfx:['healing']}],
  [/blood|leech|vampir|soul|drain|hunger/i, {wfx:['draining']}],
  [/iron|stone|steel|granite|bastion|fortress|citadel|keep|great|wall of/i, {build:['heavy']}],
  [/reed|paper|wicker|hasty|flimsy|picket|fence/i, {build:['light']}],
  [/ring|circle|halo|nest|hug|embrace|ward\b/i, {form:['arc']}],
  [/rampart|palisade|line|barricade|front|bulwark|parapet/i, {form:['rampart']}],
  [/cage|prison|jail|bind|coffin|tomb|trap\b|net/i, {form:['cage']}],
  [/corridor|hall|avenue|path|road|aisle|canyon|pass/i, {form:['corridor']}],
  [/shield|aegis|veil|mantle|cloak|aura|barrier|skin|armou?r|bubble/i, {form:['shield']}],
  [/eternal|ancient|everlasting|long|endless|lasting|age/i, {len:['long']}],
  [/brief|flash|blink|moment|instant|burst/i, {len:['short']}],
  [/field|minefield|carpet|scatter|caltrops|many|swarm/i, {size:['three']}],
  [/twin|double|pair/i, {shot:['twin']}],
  [/splash|spray|scatter|burst|shrapnel/i, {shot:['burst'], edge:['splash']}],
  [/piercing|lance|needle|bolt|arrow|quarrel/i, {edge:['pierce']}],
  [/lucky|keen|true|precise|sharp/i, {edge:['crit']}],
  [/quiver|belt|bandolier|crate|cartridge|ammo|clip/i, {uses:['many']}],
  [/relic|heirloom|royal|ancient|great/i, {uses:['few']}],
];
const AL_STANCE_OF={guards:'front', taunt:'front', trample:'front', pounce:'front', dash:'front', snipe:'rear', lob:'rear', blast:'rear', cross:'rear', barrage:'rear', beam:'rear',
  mends:'escort', shields:'escort', empower:'escort', summoner:'rear', wardmaker:'front'};
const AL_KINDS=['summon','machine','sentry','strike','lob','ward','boon','charge','trap','environment'];

/* Work out every card's parts. Each kind in each colour is worked out on its own: rarer cards first,
   then each card takes its first-choice parts unless they are too close to a card already done. */
function allocateCards(list){
  const byCol={}; for(const c of list) if(AL_KINDS.includes(c.type)&&!c.brood&&!c.piece&&c.color&&COLORS[c.color]) (byCol[c.color]=byCol[c.color]||[]).push(c);
  const report={cards:0, clashes:0, byKind:{}};
  const R=['legendary','rare','uncommon','common'];
  for(const col in byCol){
    const cards=byCol[col].slice().sort((a,b)=>R.indexOf(a.rarity)-R.indexOf(b.rarity)||(a.id<b.id?-1:1));
    const taken={}, use={};
    const U=k=>use[k]=use[k]||{};
    for(const c of cards){
      const kind=['summon','machine','sentry'].includes(c.type)?'creature':c.type, spec=alSpec(c,kind,col,U);
      const T=taken[kind]=taken[kind]||[];
      const p=alPick(spec.opts,T,2,spec.cost,spec.ok);
      if(T.some(t=>p.length-alSame(p,t)<2)) report.clashes++;
      T.push(p); spec.used(p); spec.apply(p); c.alloc=1; c.alParts=p;
      report.cards++; report.byKind[kind]=(report.byKind[kind]||0)+1;
    }
  }
  return report;
}
const alOld=c=>AL_KWS.find(k=>c[k]!=null&&!(c.type==='trap'&&c.trap==='snare'&&k==='stun')&&!(c.type==='environment'&&k==='stun'))||null;
const alKwOpts=(want,kws)=>[want||null,...[null,...kws].filter(k=>k!==(want||null))];
// the choices for each part of one card, most important part first
function alSpec(c,kind,col,U){ const rng=alRng(c.id), kh=alHints(c.name,AL_KD_HINTS), first=(h,all,dflt)=>alOrder(all,h,dflt,rng,null);
  const bump=(k,v)=>{ if(v!=null) U(k)[v]=(U(k)[v]||0)+1; };
  if(kind==='creature'){ const h=alHints(c.name,AL_CR_HINTS), old=c.type==='sentry'?'sentry':c.ai;
    let behs=Object.keys(CR_BEH); if(c.type==='sentry') behs=behs.filter(b=>!AL_TOWER_NO.has(b));
    const bOpts=alOrder(behs,h.beh,(AL_AI_FAMILY[old]||[]).filter(b=>behs.includes(b)),rng,U('beh'));
    const tierAll=Object.keys(CR_TIER).filter(t=>!CR_TIER[t].rare||['rare','legendary'].includes(c.rarity));
    const tOpts=alOrder(tierAll,h.tier,[old==='guardian'||old==='bulwark'?'tough':'sturdy'],rng);
    const sOpts=alOrder(Object.keys(CR_SPEED),h.speed,[c.rate&&c.rate<=.6?'quick':c.rate&&c.rate>=1.8?'slow':'steady'],rng);
    const kws=CR_KWS[col]||[], oldKw=AL_KWS.find(k=>c[k]!=null&&kws.includes(k));
    const wantKw=oldKw||(h.kw||[]).find(k=>kws.includes(k))||(kws.length&&rng()<.5?kws[Math.floor(rng()*kws.length)]:null);
    let traits=crTraitsOf(col).filter(t=>!(c.type==='sentry'&&['swift','loyal'].includes(t)));
    if(col==='brown'&&!c.race) traits=traits.filter(t=>t!=='racetech');
    const uT=U('trait'), wantTr=col==='brown'&&c.race?'racetech':(h.trait||[]).find(t=>traits.includes(t))||(rng()<AL_TRAIT_RATE[c.rarity]&&traits.length?traits.slice().sort((a,b)=>(uT[a]||0)-(uT[b]||0)+rng()-.5)[0]:null);
    const trOpts=[wantTr,...alOrder([null,...traits].filter(t=>t!==wantTr),null,null,rng,uT)];
    // Gray creatures have no keyword, so they take a stance instead
    const stOpts=col==='gray'?alOrder(['front','rear','escort'],[AL_STANCE_OF[bOpts[0]]].filter(Boolean),null,rng,U('stance')):[null];
    const race=c.race;
    return {opts:[bOpts,tOpts,sOpts,alKwOpts(wantKw,kws),trOpts,stOpts], cost:[16,4,3,2,1,1.5],
      used:p=>{ bump('beh',p[0]); bump('trait',p[4]); bump('stance',p[5]); },
      apply:p=>alApplyCr(c,[...p.slice(0,5),race,p[5]]) }; }
  if(kind==='strike'){ const h=alHints(c.name,AL_ST_HINTS), shapes=Object.keys(STRIKE_SHAPES).concat(Object.keys(STRIKE_OLD));
    const shOpts=alOrder(shapes,h.shape,AL_SHAPE_FAMILY[c.shape],rng,U('shape'));
    const kws=((TRAITS[col]&&TRAITS[col].kws)||[]).filter((k,i,a)=>k&&a.indexOf(k)===i);
    const wantR=(h.rider||[])[0]||(rng()<AL_RIDER_RATE[c.rarity]?Object.keys(STRIKE_RIDERS)[Math.floor(rng()*Object.keys(STRIKE_RIDERS).length)]:null);
    const rOpts=[wantR,...[null,...Object.keys(STRIKE_RIDERS)].filter(r=>r!==wantR)];
    const cOpts=alOrder(['normal','quick','charged'],kh.cast,rng()<.5?['normal']:null,rng,U('cast'));
    const cl=Object.keys(CLUSTER_SHAPES)[Math.floor(rng()*Object.keys(CLUSTER_SHAPES).length)];
    return {opts:[shOpts,alKwOpts(alOld(c),kws),rOpts,cOpts], cost:[6,2,1,1.5], ok:p=>!(p[2]==='pierce'&&!AL_SHOT_SHAPES.includes(p[0])),   // Pierce only rides on shots
      used:p=>{ bump('shape',p[0]); bump('cast',p[3]); },
      apply:p=>alApplySt(c,[p[0],p[1],p[2]&&!(STRIKE_RIDERS[p[2]].shots&&!AL_SHOT_SHAPES.includes(p[0]))?p[2]:null,p[0]==='cluster'?cl:null,p[3]]) }; }
  const kws=((TRAITS[col]&&TRAITS[col].kws)||[]).filter((k,i,a)=>k&&k!=='self'&&a.indexOf(k)===i);
  const L=first(kh.len,['normal','short','long'],null);
  let opts, cost;
  if(kind==='lob'){ opts=[alOrder(KD_PATTERNS,[c.pattern].filter(Boolean),null,rng,U('pattern')),first(kh.fuse,['normal','quick','heavy']),alKwOpts(alOld(c),kws),
      first(kh.after||(c.push?['knock']:null),['none','ground','knock'])]; cost=[6,2,2,1]; }
  if(kind==='ward'){ const fxs=KD_WALL_FX_OF[col]||[];
    const form=c.ward==='barrier'?['shield']:c.form?[c.form]:null;
    opts=[alOrder(Object.keys(KD_FORMS),(kh.form||[]).concat(form||[]),null,rng,U('form')),first(kh.build,['normal','light','heavy']),
      alOrder([null,...fxs],(c.ward==='thorns'?['thorns']:[]).concat((kh.wfx||[]).filter(f=>fxs.includes(f))),rng()<.5?[null]:null,rng,U('wfx')),L]; cost=[6,2,3,1]; }
  if(kind==='boon'){ const sides=kdSidesOf(col);
    opts=[alOrder(KD_BOONS,[c.boon],null,rng,U('boon')),KD_TIMED.includes(c.boon)?L:['normal'],alOrder([null,...sides],null,null,rng,U('side')),alOrder(['now','echo','delayed'],null,rng()<.5?['now']:null,rng,U('timing'))]; cost=[6,1,2,1.5]; }
  if(kind==='charge'){ const u=c.uses<=4?'few':c.uses>=10?'many':'normal';
    opts=[alOrder(['bolt','twin','lob','burst'],(kh.shot||[]).concat([c.fx]),null,rng,U('shot')),first(kh.uses,['normal','few','many'],[u]),alKwOpts(alOld(c),kws),
      alOrder(['none','pierce','crit','splash'],kh.edge,rng()<.5?['none']:null,rng,U('edge'))]; cost=[6,2,2,1]; }
  if(kind==='trap'){ opts=[alOrder(KD_TRAPS,[c.trap],null,rng,U('trap')),alKwOpts(alOld(c),kws),L,first(kh.size,['one','three'])]; cost=[6,2,1,2]; }
  if(kind==='environment'){ opts=[alOrder(KD_ENVS,[c.env],null,rng,U('env')),alOrder(KD_ENV_PAT,[c.pattern],null,rng,U('envpat')),L,alKwOpts(null,kws.filter(k=>k!=='stun'))]; cost=[6,2,1,1.5]; }
  const K0={lob:'pattern',ward:'form',boon:'boon',charge:'shot',trap:'trap',environment:'env'}[kind], K2={ward:[2,'wfx'],boon:[2,'side'],charge:[3,'edge']}[kind];
  return {opts, cost, used:p=>{ bump(K0,p[0]); if(K2) bump(K2[1],p[K2[0]]); if(kind==='environment') bump('envpat',p[1]); }, apply:p=>alApplyKd(c,p)}; }

// put a card's parts on it and work out its numbers
function alApplyCr(c,p){ p=p.map(x=>x===''||x==null?null:x); const race=c.race; alClear(c);
  Object.assign(c,{beh:p[0], tier:p[1], speed:p[2]}); if(p[4]) c.trait=p[4];
  if(c.trait==='racetech') c.race=p[5]||race; if(p[6]) c.stance=p[6];
  crBuild(c,alF(c),c.rank,p[3]); c.alloc=1; }
function alApplySt(c,p){ p=p.map(x=>x===''||x==null?null:x); alClear(c); c.shape=p[0];
  if(p[2]) c.rider=p[2]; if(c.shape==='cluster') c.cluster=p[3]||'ring'; if(p[4]&&p[4]!=='normal') c.cast=p[4];
  if(STRIKE_SHAPES[c.shape]) strikeBuild(c,alF(c),c.rank,p[1]);
  else { BUILD.strike(c,alF(c),c.rank,p[1],{},x=>x[0],(a,b)=>a); strikeRiders(c); }
  if(c.cast){ const k=KD_CAST[c.cast].k; c.pow=Math.round(c.pow*k); if(c.bomblet) c.bomblet=Math.round(c.bomblet*k); }
  c.alloc=1; }
function alApplyKd(c,p){ p=p.map(x=>x===''||x==null?null:x); alClear(c); KD_BUILDERS[c.type](c,p); c.kd=1; c.alloc=1; }
// a card's parts as text, in the order its kind lists them (cardparts.js, the review sheet)
function alPartsOf(c){ const kw=alOld(c)||'';
  if(c.beh) return [c.beh,c.tier,c.speed,kw,c.trait||'',c.trait==='racetech'?c.race:'',c.stance||''];
  if(c.type==='strike') return [c.shape,kw,c.rider||'',c.cast||'normal',c.cluster||''];
  return (kdParts(c)||[]).map(x=>x==null?'':x); }
function alTable(){ const o={}; for(const c of CARD_LIST) if(c.alloc) o[c.id]=alPartsOf(c).join('|').replace(/\|+$/,''); return o; }

