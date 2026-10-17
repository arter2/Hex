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
function alOrder(all,named,family,rng,use,w){ const seen=new Set(), out=[];
  const wk=x=>x==null?'none':x;   // the page calls "no keyword", "no trait" and the like 'none'
  if(w) all=all.filter(x=>w[wk(x)]!==0); if(!all.length) return out;
  for(const g of [named||[],family||[],all]){ const grp=g.filter(x=>all.includes(x)&&!seen.has(x)).filter((x,i,a)=>a.indexOf(x)===i);
    grp.forEach(x=>seen.add(x)); const keyed=grp.map((x,i)=>({x,k:(g===all?rng()*3:i*.3)+(use&&use[x]||0)*.25})); out.push(...keyed); }
  // a colour's weight (AL_WEIGHTS) divides an option's place: weight 3 moves it well up, even past the name's hints
  const base=x=>(named||[]).includes(x)?0:(family||[]).includes(x)?1:2;
  return out.map(o=>({x:o.x,k:(base(o.x)+o.k)/((w&&w[wk(o.x)]!=null?w[wk(o.x)]:1)||.01)})).sort((a,b)=>a.k-b.k).map(o=>o.x); }

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
/* fixed(c): cards that keep the parts they have (others are still kept apart from them).
   Colour weights (AL_WEIGHTS, from the colour weights page): {fire:{shape:{cluster:3, mine:2}, beh:{...}}, ...};
   a weight of 2 makes a choice about twice as likely for that colour, 0 rules it out, 1 is the usual. */
function allocateCards(list,fixed){ fixed=fixed||(()=>false);
  const byCol={}; for(const c of list) if(AL_KINDS.includes(kdBase(c))&&!c.brood&&c.color&&COLORS[c.color]&&!(c.type==='instant'&&c.as==='utility')&&!/^potion_/.test(c.id)) (byCol[c.color]=byCol[c.color]||[]).push(c);
  const report={cards:0, clashes:0, byKind:{}};
  const R=['legendary','rare','uncommon','common'];
  for(const col in byCol){
    const cards=byCol[col].slice().sort((a,b)=>R.indexOf(a.rarity)-R.indexOf(b.rarity)||(a.id<b.id?-1:1));
    const taken={}, use={};
    const U=k=>use[k]=use[k]||{};
    for(const c of cards){
      const kind=cardPartKind(c), group=kind+(c.type==='instant'?'/instant':c.piece?'/piece':'');
      const T=taken[group]=taken[group]||[];
      if(fixed(c)){ T.push(alNow(c,kind)); continue; }
      const spec=alSpec(c,kind,col,U);
      const p=alPick(spec.opts,T,2,spec.cost,spec.ok);
      if(T.some(t=>p.length-alSame(p,t)<2)) report.clashes++;
      T.push(p); spec.used(p); spec.apply(p); c.alloc=1; c.alParts=p;
      report.cards++; report.byKind[group]=(report.byKind[group]||0)+1;
    }
  }
  return report;
}
// a card's parts as the allocator compares them (as alSpec lists them)
function alNow(c,kind){ const kw=alOld(c);
  if(kind==='creature') return [c.beh,c.tier,c.speed,kw,c.trait||null,c.stance||null];
  if(kind==='strike') return [c.shape,kw,c.rider||null,c.cast||'normal'];
  return kdParts(c); }
const alOld=c=>AL_KWS.find(k=>c[k]!=null&&!(c.type==='trap'&&c.trap==='snare'&&k==='stun')&&!(c.type==='environment'&&k==='stun'))||null;
const alKwOpts=(want,kws)=>[want||null,...[null,...kws].filter(k=>k!==(want||null))];
// the choices for each part of one card, most important part first
function alSpec(c,kind,col,U){ const rng=alRng(c.id), kh=alHints(c.name,AL_KD_HINTS);
  const W=g=>typeof AL_WEIGHTS!=='undefined'&&AL_WEIGHTS&&AL_WEIGHTS[col]&&AL_WEIGHTS[col][g]||null, first=(h,all,dflt,g)=>alOrder(all,h,dflt,rng,null,g&&W(g));
  const bump=(k,v)=>{ if(v!=null) U(k)[v]=(U(k)[v]||0)+1; };
  // a colour's usual list plus anything the colour has been weighted up for from another colour
  const plus=(list,g)=>{ const w=W(g); return w?list.concat(Object.keys(w).filter(k=>w[k]>0&&k!=='none'&&!list.includes(k))):list; };
  const kwOpts=(want,kws,g)=>alOrder([null,...plus(kws,g)],[want||null],null,rng,null,W(g));
  const Lk=g=>first(kh.len,['normal','short','long'],null,g);
  if(kind==='creature'){ const h=alHints(c.name,AL_CR_HINTS), old=c.type==='sentry'?'sentry':c.ai;
    let behs=Object.keys(CR_BEH); if(c.type==='sentry') behs=behs.filter(b=>!AL_TOWER_NO.has(b));
    const bOpts=alOrder(behs,h.beh,(AL_AI_FAMILY[old]||[]).filter(b=>behs.includes(b)),rng,U('beh'),W('beh'));
    const tierAll=Object.keys(CR_TIER).filter(t=>!CR_TIER[t].rare||['rare','legendary'].includes(c.rarity));
    const tOpts=alOrder(tierAll,h.tier,[old==='guardian'||old==='bulwark'?'tough':'sturdy'],rng,null,W('tier'));
    const sOpts=alOrder(Object.keys(CR_SPEED),h.speed,[c.rate&&c.rate<=.6?'quick':c.rate&&c.rate>=1.8?'slow':'steady'],rng,null,W('speed'));
    const kws=CR_KWS[col]||[], oldKw=AL_KWS.find(k=>c[k]!=null&&kws.includes(k));
    const wantKw=oldKw||(h.kw||[]).find(k=>kws.includes(k))||(kws.length&&rng()<.5?kws[Math.floor(rng()*kws.length)]:null);
    let traits=plus(crTraitsOf(col),'trait').filter(t=>!(c.type==='sentry'&&['swift','loyal'].includes(t)));
    if(col==='brown'&&!c.race) traits=traits.filter(t=>t!=='racetech');
    const uT=U('trait'), wantTr=col==='brown'&&c.race?'racetech':(h.trait||[]).find(t=>traits.includes(t))||(rng()<AL_TRAIT_RATE[c.rarity]&&traits.length?traits.slice().sort((a,b)=>(uT[a]||0)-(uT[b]||0)+rng()-.5)[0]:null);
    const trOpts=alOrder([null,...traits],[wantTr],null,rng,uT,W('trait'));
    // Gray creatures have no keyword, so they take a stance instead
    const extraSt=plus([],'stance');
    const stOpts=col==='gray'?alOrder(['front','rear','escort'],[AL_STANCE_OF[bOpts[0]]].filter(Boolean),null,rng,U('stance'),W('stance')):extraSt.length?alOrder([null,...extraSt],[null],null,rng,U('stance'),W('stance')):[null];
    const race=c.race;
    return {opts:[bOpts,tOpts,sOpts,kwOpts(wantKw,kws,'creature.kw'),trOpts,stOpts], cost:[16,4,3,2,1,1.5],
      used:p=>{ bump('beh',p[0]); bump('trait',p[4]); bump('stance',p[5]); },
      apply:p=>alApplyCr(c,[...p.slice(0,5),race,p[5]]) }; }
  if(kind==='strike'){ const h=alHints(c.name,AL_ST_HINTS), shapes=Object.keys(STRIKE_SHAPES).concat(Object.keys(STRIKE_OLD));
    const shOpts=alOrder(shapes,h.shape,AL_SHAPE_FAMILY[c.shape],rng,U('shape'),W('shape'));
    const kws=((TRAITS[col]&&TRAITS[col].kws)||[]).filter((k,i,a)=>k&&a.indexOf(k)===i);
    const wantR=(h.rider||[])[0]||(rng()<AL_RIDER_RATE[c.rarity]?Object.keys(STRIKE_RIDERS)[Math.floor(rng()*Object.keys(STRIKE_RIDERS).length)]:null);
    const rOpts=alOrder([null,...Object.keys(STRIKE_RIDERS)],[wantR],null,rng,null,W('rider'));
    const cOpts=alOrder(['normal','quick','charged'],kh.cast,rng()<.5?['normal']:null,rng,U('cast'),W('cast'));
    const cl=alOrder(Object.keys(CLUSTER_SHAPES),null,null,rng,null,W('cluster'))[0];
    return {opts:[shOpts,kwOpts(alOld(c),kws,'strike.kw'),rOpts,cOpts], cost:[6,2,1,1.5], ok:p=>!(p[2]==='pierce'&&!AL_SHOT_SHAPES.includes(p[0])),   // Pierce only rides on shots
      used:p=>{ bump('shape',p[0]); bump('cast',p[3]); },
      apply:p=>alApplySt(c,[p[0],p[1],p[2]&&!(STRIKE_RIDERS[p[2]].shots&&!AL_SHOT_SHAPES.includes(p[0]))?p[2]:null,p[0]==='cluster'?cl:null,p[3]]) }; }
  const kws=((TRAITS[col]&&TRAITS[col].kws)||[]).filter((k,i,a)=>k&&k!=='self'&&a.indexOf(k)===i);
  let opts, cost, ok;
  if(kind==='lob'){ opts=[alOrder(KD_PATTERNS,[c.pattern].filter(Boolean),null,rng,U('pattern'),W('pattern')),first(kh.fuse,['normal','quick','heavy'],null,'fuse'),kwOpts(alOld(c),kws,'lob.kw'),
      first(kh.after||(c.push?['knock']:null),['none','ground','knock'],null,'after')]; cost=[6,2,2,1]; }
  if(kind==='ward'){ const fxs=plus(KD_WALL_FX_OF[col]||[],'wfx');
    const form=c.ward==='barrier'?['shield']:c.form?[c.form]:null;
    opts=[alOrder(Object.keys(KD_FORMS),(kh.form||[]).concat(form||[]),null,rng,U('form'),W('form')),first(kh.build,['normal','light','heavy'],null,'build'),
      alOrder([null,...fxs],(c.ward==='thorns'?['thorns']:[]).concat((kh.wfx||[]).filter(f=>fxs.includes(f))),rng()<.5?[null]:null,rng,U('wfx'),W('wfx')),Lk('ward.len')]; cost=[6,2,3,1]; }
  if(kind==='boon'){ const sides=plus(kdSidesOf(col),'side');
    opts=[alOrder(KD_BOONS,[c.boon],null,rng,U('boon'),W('boon')),KD_TIMED.includes(c.boon)?Lk('boon.len'):['normal'],alOrder([null,...sides],null,null,rng,U('side'),W('side')),alOrder(['now','echo','delayed'],null,rng()<.5?['now']:null,rng,U('timing'),W('timing'))]; cost=[6,1,2,1.5]; }
  if(kind==='charge'){ const u=c.uses<=4?'few':c.uses>=10?'many':'normal';
    opts=[alOrder(['bolt','twin','lob','burst'],(kh.shot||[]).concat([c.fx]),null,rng,U('shot'),W('shot')),first(kh.uses,['normal','few','many'],[u],'uses'),kwOpts(alOld(c),kws,'charge.kw'),
      alOrder(['none','pierce','crit','splash'],kh.edge,rng()<.5?['none']:null,rng,U('edge'),W('edge'))]; cost=[6,2,2,1]; }
  if(kind==='trap'){ const wt=W('trap')||{}, traps=KD_TRAPS.filter(t=>!KD_TRAP_HOME[t]||KD_TRAP_HOME[t]===col||wt[t]>0);   // a colour's own traps, plus any weighted in
    opts=[alOrder(traps,[c.trap],null,rng,U('trap'),W('trap')),kwOpts(alOld(c),kws,'trap.kw'),Lk('trap.len'),first(kh.size,['one','three'],null,'size'),
      alOrder([null,...Object.keys(KD_SPREAD)],[c.spread||null],null,rng,null,W('spread'))]; cost=[6,2,1,2,1];
    ok=p=>{ const sp=KD_SPREAD_OF(p[0]); return sp.length?sp.includes(p[4]):p[4]==null; }; }
  if(kind==='environment'){ opts=[alOrder(KD_ENVS,[c.env],null,rng,U('env'),W('env')),alOrder(KD_ENV_PAT,[c.pattern],null,rng,U('envpat'),W('envpat')),Lk('environment.len'),kwOpts(null,kws.filter(k=>k!=='stun'),'environment.kw')]; cost=[6,2,1,1.5]; }
  const K0={lob:'pattern',ward:'form',boon:'boon',charge:'shot',trap:'trap',environment:'env'}[kind], K2={ward:[2,'wfx'],boon:[2,'side'],charge:[3,'edge']}[kind];
  return {opts, cost, ok, used:p=>{ bump(K0,p[0]); if(K2) bump(K2[1],p[K2[0]]); if(kind==='environment') bump('envpat',p[1]); }, apply:p=>alApplyKd(c,p)}; }

// put a card's parts on it and work out its numbers (kinds.js partsBuild)
const alBuild=(c,kind,vals)=>{ const P={}; PART_KEYS[kind].forEach((k,i)=>{ if(vals[i]!=null) P[k]=vals[i]; }); partsBuild(c,P); c.alloc=1; };
const alApplyCr=(c,p)=>alBuild(c,'creature',p);                                  // beh tier speed kw trait race stance
const alApplySt=(c,p)=>alBuild(c,'strike',[p[0],p[1],p[2],p[4],p[3]]);            // given as shape kw rider cluster cast
const alApplyKd=(c,p)=>alBuild(c,cardPartKind(c),p);
// a card's parts as text, in the order its kind lists them (cardparts.js, the review sheet)
function alPartsOf(c){ const kw=alOld(c)||'';
  if(c.beh) return [c.beh,c.tier,c.speed,kw,c.trait||'',c.trait==='racetech'?c.race:'',c.stance||''];
  if(kdBase(c)==='strike') return [c.shape,kw,c.rider||'',c.cast||'normal',c.cluster||''];
  return (kdParts(c)||[]).map(x=>x==null?'':x); }
function alTable(){ const o={}; for(const c of CARD_LIST) if(c.alloc) o[c.id]=alPartsOf(c).join('|').replace(/\|+$/,''); return o; }


/* ---------------- card mix and themes (the Colour Weights page) ----------------
   AL_WEIGHTS[colour].type   how many of each kind a colour has (creatures, machines, towers, strikes,
                             lobs, wards, boons, charges, traps, ground); cards change kind to match
   AL_WEIGHTS[colour].theme  a theme raises every part that belongs to it, across all kinds
   Names stay: a card that changes kind takes new parts that suit its name. */
const AL_MIX_TYPES={creature:'summon', machine:'machine', tower:'sentry', strike:'strike', lob:'lob', ward:'ward', boon:'boon', charge:'charge', trap:'trap', environment:'environment'};
// the words that name each kind of card (matched as whole words, plural allowed)
const AL_TYPE_WORDS={
  summon:'wolf hound dog bear cat dragon drake whelp wyvern wyrm imp sprite fairy pixie golem giant troll ogre knight guard guardian sentinel warden soldier warrior spirit ghost wraith shade serpent snake viper spider owl hawk falcon eagle crow raven boar bull ox elephant mammoth tortoise turtle beetle ant wasp hornet bee fox kitsune monkey ape tiger lion panther lynx stag deer elk horse mare stallion eel shark whale crab squid kraken yeti oni djinn ifrit angel saint monk priest cleric witch mage wizard sorcerer shaman druid archer hunter ranger captain king queen lord lady maiden mother hag crone familiar beast hydra griffin phoenix unicorn pegasus centaur minotaur satyr nymph dryad ent treant mole rat bat moth scorpion lizard salamander frog toad mantis cobra jackal coyote hyena vulture skeleton zombie ghoul lich vampire banshee reaper demon devil fiend gargoyle statue sphinx automaton construct homunculus gnome dwarf elf goblin gremlin kobold orc swarm horde pack herd flock legion mammoth rhino yak camel walrus seal penguin narwhal orca leviathan behemoth colossus titan cyclops ettin',
  machine:'cannon turret engine automaton catapult ballista trebuchet mortar gatling repeater machine drill mech contraption launcher nest bombard culverin crossbow',
  sentry:'tower totem spire obelisk beacon lantern brazier shrine idol pillar altar torch pylon lighthouse post monolith menhir',
  strike:'shot bolt dart arrow lance spear slash strike blade bite claw fist punch kick whip lash ray beam blast breath roar gust wave charge rush thrust volley smite wrath judgment judgement sting stab jab cut cleave swipe rake shout howl bash blow hit flurry',
  lob:'pot flask jar bomb grenade barrel keg boulder rock stone meteor comet egg seed nut lob toss throw hurl vial bottle cask urn coconut',
  ward:'wall shield ward barrier rampart palisade fence gate bulwark aegis veil cloak mantle armor armour skin shell dome bubble cage fort fortress bastion mantlet buckler screen hedge',
  boon:'blessing grace prayer potion elixir draught tonic brew feast song hymn chant dance courage fury rage haste focus vigor vigour strength luck favor favour gift boon rest mead wine girdle charm amulet talisman ring crown oath vow pact tea',
  charge:'quiver bandolier ammo arrows bolts darts shells rounds pouch bundle belt stock supply crate battery batteries cells cartridge cartridges magazine clip satchel',
  trap:'trap pit snare net mine landmine caltrop caltrops spike spikes tripwire pitfall noose jaws lure web',
  environment:'field ground land swamp bog marsh desert tundra forest grove garden storm quake earthquake eruption flood tide fog mist blizzard rain sky night eclipse sands plain valley canyon wastes waste barrens sea ocean winter summer dusk dawn',
};
const AL_TYPE_SET={}; for(const t in AL_TYPE_WORDS) AL_TYPE_SET[t]=new Set(AL_TYPE_WORDS[t].split(/\s+/));
const alWords=name=>name.toLowerCase().replace(/[’']s\b/g,'').split(/[^a-z]+/).filter(Boolean);
// a card's head noun: the last word before "of" ("Crown of the Volcano King" → crown), else the last word
const alHead=name=>{ const w=alWords(name), i=w.indexOf('of'); return i>0?w[i-1]:w[w.length-1]; };
const alIsWord=(t,w)=>AL_TYPE_SET[t].has(w)||AL_TYPE_SET[t].has(w.replace(/e?s$/,''));
// the parts each theme raises (part: values), and how strongly a theme weight carries over
const AL_THEMES={
  poison:  {kw:['poison'], trait:['plague'], beh:[], extra:{}},
  curse:   {kw:['curse'], trait:['dread','harvest'], trap:['zombie'], extra:{}},
  burn:    {kw:['burn'], trait:['scorched','explodes'], wfx:['burning'], side:['embers','scorch'], after:['ground']},
  freeze:  {kw:['freeze','slow'], trait:['chilling','shatter'], wfx:['freezing'], side:['chill','rime']},
  stun:    {kw:['stun','confuse'], trait:['static','overcharge','dread'], wfx:['shocking'], side:['jolt'], trap:['shock']},
  drain:   {kw:['drain'], trait:['lifesteal'], wfx:['draining'], side:['siphon','blood']},
  knockback:{kw:['push','pull'], trait:['tidal'], after:['knock']},
  healing: {kw:['mend'], beh:['mends','shields'], boon:['heal','regen','intervene'], wfx:['healing'], side:['glow','sprout','radiance']},
  chain:   {shape:['chain','zigzag'], beh:['chain','zigzag','beam']},
  bombs:   {shape:['cluster','mine','burst'], beh:['blast','cross','lob','barrage'], pattern:['burst','ring','cross'], type:['lob']},
  bounce:  {shape:['ricochet','boomerang','diag'], beh:['diag','zigzag']},
  turrets: {type:['machine','tower']},
  traps:   {type:['trap'], shape:['mine'], size:['three']},
  board:   {type:['environment'], after:['ground']},
  buffs:   {type:['boon'], beh:['empower'], trait:['rallying'], side:['rally','muster']},
  horde:   {type:['creature'], beh:['summoner'], trait:['seeds','rises','pack','drilled']},
  fortress:{type:['ward'], beh:['wardmaker','guards','taunt'], form:['rampart','arc','corridor'], build:['heavy']},
  combos:  {},   // rune focus: handled by alRunes
};
const AL_KW_PARTS=['strike.kw','creature.kw','lob.kw','charge.kw','trap.kw','environment.kw'];
/* every status effect a card can put on enemies (or on you), and everything that carries it */
const AL_EFFECTS={
  burn:    {kw:['burn'], trait:['scorched'], wfx:['burning'], side:['embers'], env:['burn']},
  poison:  {kw:['poison'], trait:['plague']},
  freeze:  {kw:['freeze'], trait:['shatter'], wfx:['freezing'], env:['freeze']},
  slow:    {kw:['slow'], trait:['chilling'], side:['chill'], trap:['snare']},
  stun:    {kw:['stun'], trait:['static','overcharge'], wfx:['shocking'], side:['jolt'], env:['tremor'], trap:['shock']},
  infect:  {trap:['zombie']},
  confuse: {kw:['confuse'], trait:['dread','sandstorm']},
  curse:   {kw:['curse']},
  drain:   {kw:['drain'], trait:['lifesteal'], wfx:['draining'], side:['siphon']},
  mend:    {kw:['mend'], beh:['mends'], wfx:['healing'], side:['glow','sprout','muster']},
  valor:   {kw:['valor'], trait:['rallying'], side:['rally']},
  push:    {kw:['push'], trait:['tidal'], after:['knock']},
  pull:    {kw:['pull']},
  self:    {kw:['self'], side:['scorch','blood'], rider:['recoil']},
  thorns:  {trait:['thorny'], wfx:['thorns'], env:['bramble']},
};
/* every way a card hits (or helps), across kinds: one weight moves the creature behaviour, the strike
   shape, the lob pattern, the charge shot and the trap that do the same thing */
const AL_ATTACKS={
  bolt:{shape:['line'], beh:['bolt'], shot:['bolt'], pattern:['single']}, pierce:{beh:['pierce'], rider:['pierce'], edge:['pierce']},
  twin:{shape:['twin'], beh:['twin'], shot:['twin']}, row:{shape:['row','wave'], pattern:['row']}, cone:{shape:['wedge','fan'], beh:['cone']},
  diag:{shape:['diag'], beh:['diag']}, zigzag:{shape:['zigzag'], beh:['zigzag']}, bounce:{shape:['ricochet','boomerang']},
  chain:{shape:['chain'], beh:['chain'], trap:['shock']}, snipe:{shape:['snipe'], beh:['snipe']}, beam:{shape:['spear','column'], beh:['beam'], pattern:['column']},
  burrow:{shape:['dig'], beh:['burrow']}, barrage:{shape:['missiles','gun'], beh:['barrage']}, all:{shape:['all','shockwave']},
  lob:{beh:['lob'], shot:['lob']}, blast:{shape:['burst'], beh:['blast'], pattern:['burst','ring'], shot:['burst'], edge:['splash'], trap:['blast']},
  cross:{beh:['cross'], pattern:['cross']}, cluster:{shape:['cluster']}, mine:{shape:['mine'], trap:['spike']}, mark:{shape:['mark']}, pendulum:{trap:['pendulum']},
  pounce:{beh:['pounce']}, trample:{beh:['trample']}, dash:{beh:['dash']},
  crit:{rider:['crit'], edge:['crit']}, reaper:{rider:['onkill']},
  heal:{beh:['mends'], boon:['heal','regen']}, shield:{beh:['shields'], boon:['dodge','phase']}, guard:{beh:['guards','taunt'], boon:['intervene']},
  summon:{beh:['summoner']}, wall:{beh:['wardmaker']}, empower:{beh:['empower'], boon:['power','courage']}, haste:{boon:['haste','gauge']},
};
const AL_FOLD={theme:AL_THEMES, effect:AL_EFFECTS, attack:AL_ATTACKS};
// fold each colour's themes, effects and attacks into its part weights (a theme weight multiplies what is already there)
function alExpandThemes(W){ const out=JSON.parse(JSON.stringify(W||{}));
  for(const col in out) for(const f in AL_FOLD){ const th=out[col][f]||{};
    for(const t in th){ const m=th[t], T=AL_FOLD[f][t]; if(!T||m===1) continue;
      const mul=(g,v)=>{ out[col][g]=out[col][g]||{}; const cur=out[col][g][v]==null?1:out[col][g][v]; out[col][g][v]=+(cur*m).toFixed(3); };
      for(const g in T){ if(g==='extra') continue; for(const v of T[g]){ if(g==='kw') AL_KW_PARTS.forEach(p=>mul(p,v)); else mul(g,v); } } } }
  return out; }
// how a card's name fits each kind (higher fits better); its own kind gets a head start so few cards move
function alTypeFit(c,type){ const head=alHead(c.name);
  let s=alIsWord(type,head)?3:alWords(c.name).some(w=>alIsWord(type,w))?1:0;
  if(type==='summon'&&(c.body||alHints(head,AL_CR_HINTS).beh)) s+=2; if(type==='summon'&&c.body) s+=2; /* drawn as a creature: it stays one unless pushed hard */ if(type==='machine'&&c.mach) s+=2; if(type==='strike'&&alHints(c.name,AL_ST_HINTS).shape) s+=1; return s; }
/* change kinds to reach each colour's card mix: target count = now × weight (shares renormalised).
   A kind under its target takes, one at a time, the card whose name suits it better than its own kind
   does, from a kind still over its target. A card whose name doesn't suit the new kind is never forced
   over: the kind falls short instead (reported in `short`). */
function alRetype(list,W){ const moved=[], short=[]; const T=Object.values(AL_MIX_TYPES);
  const byCol={}; for(const c of list) if(T.includes(c.type)&&!c.brood&&!c.piece&&!c.legend&&!c.sig&&COLORS[c.color]) (byCol[c.color]=byCol[c.color]||[]).push(c);
  for(const col in byCol){ const w=W[col]&&W[col].type; if(!w) continue; const cards=byCol[col], n=cards.length, kinds=Object.keys(AL_MIX_TYPES);
    const cnt=k=>cards.filter(c=>c.type===AL_MIX_TYPES[k]).length, now={}; kinds.forEach(k=>now[k]=cnt(k));
    const raw={}; let tot=0; for(const k of kinds){ const wk=w[k]==null?1:w[k]; raw[k]=(now[k]||(wk>1?1:0))*wk; tot+=raw[k]; }
    const target={}; for(const k of kinds) target[k]=Math.round(n*raw[k]/(tot||1));
    const kindOf=t=>kinds.find(k=>AL_MIX_TYPES[k]===t);
    for(let guard=0;guard<n;guard++){
      // the kind furthest under its target
      const under=kinds.filter(k=>cnt(k)<target[k]).sort((a,b)=>(target[b]-cnt(b))-(target[a]-cnt(a)));
      let done=false;
      for(const k of under){ const t=AL_MIX_TYPES[k];
        const cand=cards.filter(c=>c.type!==t&&cnt(kindOf(c.type))>target[kindOf(c.type)]).map(c=>({c,gain:alTypeFit(c,t)-alTypeFit(c,c.type)})).filter(x=>x.gain>0&&alTypeFit(x.c,t)>=2).sort((a,b)=>b.gain-a.gain||(a.c.id<b.c.id?-1:1));
        if(!cand.length) continue; const c=cand[0].c; moved.push({id:c.id,name:c.name,from:c.type,to:t}); c.type=t; delete c.np; done=true; break; }
      if(!done) break; }
    for(const k of kinds) if(cnt(k)<target[k]) short.push({color:col,kind:k,target:target[k],got:cnt(k)}); }
  alRetype.short=short; return moved; }
/* rune focus (the Combos theme): above ×1 a colour's cards gather on its two most common runes (more
   Flushes, Straights and Rune Sets), below ×1 they spread out. Signature cards keep their runes. */
function alRunes(list,W){ const changed=[];
  for(const col of Object.keys(COLORS)){ const f=W[col]&&W[col].theme&&W[col].theme.combos; if(!f||f===1) continue;
    const cards=list.filter(c=>c.color===col&&c.code&&c.code!==WILD&&c.rarity!=='hero'&&!c.brood&&!SIG_RUNES_ID[c.id]);
    const n={}; cards.forEach(c=>n[c.code]=(n[c.code]||0)+1); const home=Object.keys(n).sort((a,b)=>n[b]-n[a]).slice(0,2);
    for(const c of cards){ const r=alRng('rune2:'+c.id)();
      if(f>1&&!home.includes(c.code)&&r<1-1/f){ const to=home[Math.floor(alRng('rh:'+c.id)()*home.length)]; changed.push({id:c.id,from:c.code,to}); c.code=to; c.rune=to; }
      if(f<1&&home.includes(c.code)&&r<1-f){ const others=RUNES.filter(x=>!home.includes(x)), to=others[Math.floor(alRng('ro:'+c.id)()*others.length)]; changed.push({id:c.id,from:c.code,to}); c.code=to; c.rune=to; } } }
  return changed; }
const SIG_RUNES_ID=(()=>{ const o={}; if(typeof SIG_RUNES!=='undefined') for(const k in SIG_RUNES) SIG_RUNES[k].forEach(id=>o[id]=k); return o; })();
/* the whole deal with a weight set: themes fold in, kinds change to the mix, then every card that
   changed kind (or all, with fresh=true) takes new parts, and runes gather or spread */
function alDeal(W,fresh){ window.AL_WEIGHTS=alExpandThemes(W); const moved=alRetype(CARD_LIST,W), ids=new Set(moved.map(m=>m.id));
  const rep=allocateCards(CARD_LIST,c=>!fresh&&c.np&&!ids.has(c.id)); const runes=alRunes(CARD_LIST,W);
  return {moved,runes,rep}; }
