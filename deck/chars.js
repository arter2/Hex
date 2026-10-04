/* Hexmancers deck prototype — character creation: races and stats.
   Every new game starts here: pick a race and a body (which sets your look), then spend 12
   points on top of the race's baseline stats. There are the six classic stats plus two of this
   game's own (Recharge and Casting). A stat of 10 is average; each point above or below it
   changes one thing in play by the amount in STATS[k].per. */
(function(root){

const STAT_POINTS=12, STAT_MAX=18;
const STAT_KEYS=['str','dex','con','int','wis','cha','rch','cst'];
// k: what the stat changes; per: the change for each point away from 10
const STATS={
  str:{name:'Strength',     ab:'STR', icon:'✊', per:.06, text:'Wand and staff shot damage'},
  dex:{name:'Dexterity',    ab:'DEX', icon:'🏹', per:.05, text:'Shot speed, and a chance to dodge hits'},
  con:{name:'Constitution', ab:'CON', icon:'❤', per:6,   text:'Max HP'},
  int:{name:'Intelligence', ab:'INT', icon:'📖', per:.04, text:'Card power: damage, healing and shields'},
  wis:{name:'Wisdom',       ab:'WIS', icon:'👁', per:.08, text:'Finding hidden doors, traps and secrets'},
  cha:{name:'Charisma',     ab:'CHA', icon:'💬', per:.04, text:'Gold found, and lower merchant prices'},
  rch:{name:'Recharge',     ab:'RCH', icon:'↻', per:.04, text:'Wand fire rate and charge-up time'},
  cst:{name:'Casting',      ab:'CST', icon:'✦', per:.05, text:'Cast speed, and how fast cards come ready'},
};
// each race's baseline adds up to 80 (ten in every stat, moved about)
const RACES={
  human: {name:'Human',       looks:['wizard','human_f'],   base:{str:10,dex:10,con:10,int:10,wis:10,cha:10,rch:10,cst:10}, text:'Even in every stat: ready for any deck.'},
  elf:   {name:'Elf',         looks:['elf_m','elf_f'],      base:{str:8, dex:12,con:8, int:12,wis:11,cha:10,rch:10,cst:9},  text:'Quick shots and strong cards, but frail.'},
  dwarf: {name:'Dwarf',       looks:['dwarf_m','dwarf_f'],  base:{str:12,dex:8, con:13,int:9, wis:10,cha:8, rch:11,cst:9},  text:'Tough and hard-hitting; slow to charm.'},
  warlock:{name:'Warlock',    looks:['witch_m','witch'],    base:{str:8, dex:10,con:9, int:12,wis:9, cha:12,rch:9, cst:11}, text:'Silver-tongued spellcasters with fast cards.'},
  necro: {name:'Necromancer', looks:['necro','necro_f'],    base:{str:9, dex:9, con:9, int:13,wis:11,cha:8, rch:9, cst:12}, text:'The strongest and fastest casters; weak wands.'},
  shaman:{name:'Shaman',      looks:['shaman_m','shaman_f'],base:{str:10,dex:9, con:11,int:9, wis:13,cha:10,rch:9, cst:9},  text:'Hardy and wise: nothing stays hidden from them.'},
  ranger:{name:'Ranger',      looks:['ranger_m','ranger_f'],base:{str:10,dex:13,con:9, int:8, wis:12,cha:9, rch:11,cst:8},  text:'Fast, sharp-eyed shooters; plain spells.'},
  orc:   {name:'Orc',         looks:['orc_m','orc_f'],      base:{str:14,dex:9, con:12,int:8, wis:8, cha:8, rch:11,cst:10}, text:'Huge wand hits and lots of HP; little else.'},
};
const RACE_KEYS=Object.keys(RACES);

// a fresh character: the race's baseline with nothing spent yet
function newChar(race,body){ race=RACES[race]?race:'human'; body=body?1:0;
  return {race, body, look:RACES[race].looks[body], spent:Object.fromEntries(STAT_KEYS.map(k=>[k,0]))}; }
const statOf=(ch,k)=>RACES[ch.race].base[k]+(ch.spent[k]||0);
const pointsLeft=ch=>STAT_POINTS-STAT_KEYS.reduce((a,k)=>a+(ch.spent[k]||0),0);
// put a point in (+1) or take one back (-1); you can never go below your race's baseline
function spendPoint(ch,k,d){ const s=ch.spent[k]||0;
  if(d>0&&(pointsLeft(ch)<=0||statOf(ch,k)>=STAT_MAX)) return false;
  if(d<0&&s<=0) return false;
  ch.spent[k]=s+d; return true; }

// what a character's stats do in play, as gear-style mods (gear.js adds them to your gear)
function statMods(ch){ const o={shotMult:1,shotSpeed:1,dodge:0,hp:0,spell:1,search:1,gold:0,price:1,cd:1,charge:1,gauge:1,castSlow:1};
  if(!ch||!RACES[ch.race]) return o;
  const m=k=>statOf(ch,k)-10, S=STATS;
  o.shotMult=1+S.str.per*m('str');
  o.shotSpeed=Math.max(.6,1-S.dex.per*m('dex')); o.dodge=Math.max(0,.01*m('dex'));
  o.hp=S.con.per*m('con');
  o.spell=1+S.int.per*m('int');
  o.search=Math.max(.5,1+S.wis.per*m('wis'));
  o.gold=S.cha.per*m('cha'); o.price=Math.max(.6,1-S.cha.per*m('cha'));
  o.cd=o.charge=Math.max(.6,1-S.rch.per*m('rch'));
  o.gauge=Math.max(.5,1+S.cst.per*m('cst')); o.castSlow=Math.max(.6,1-S.cst.per*m('cst'));
  return o; }
// the effect of one stat, in words, for the character screen
function statEffect(ch,k){ const v=statOf(ch,k)-10, S=STATS[k], pct=x=>(x>=0?'+':'')+Math.round(x*100)+'%';
  if(k==='con') return (v>=0?'+':'')+Math.round(S.per*v)+' max HP';
  if(k==='str') return pct(S.per*v)+' shot damage';
  if(k==='dex') return pct(S.per*v)+' shot speed'+(v>0?', '+v+'% dodge':'');
  if(k==='int') return pct(S.per*v)+' card power';
  if(k==='wis') return pct(S.per*v)+' search';
  if(k==='cha') return pct(S.per*v)+' gold, '+pct(-S.per*v)+' prices';
  if(k==='rch') return pct(S.per*v)+' recharge';
  if(k==='cst') return pct(S.per*v)+' cast speed';
  return ''; }

const API={STAT_POINTS,STAT_MAX,STAT_KEYS,STATS,RACES,RACE_KEYS,newChar,statOf,pointsLeft,spendPoint,statMods,statEffect};
Object.assign(root,API);
if(typeof module!=='undefined') module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
