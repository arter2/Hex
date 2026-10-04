// Race balance: bots play the same battles with each race's baseline stats (no points spent).
// Run: node deck/tools/playtest/races.js <battles per cell> <depths> [skills]
// e.g. node deck/tools/playtest/races.js 6 2,5,8 casual,expert
const {makeGame}=require('./harness.js');
const SKILLS={
  casual: {wandRate:3.5, dodge:.55, react:.35, align:true, pick:'best', smartCast:false, charge:false},
  expert: {wandRate:4.5, dodge:.85, react:.15, align:true, pick:'best', smartCast:true, charge:true, closeIn:true},
};
const N=+(process.argv[2]||6), depths=(process.argv[3]||'2,5,8').split(',').map(Number), skills=(process.argv[4]||'casual,expert').split(',');
const races=makeGame(1).RACE_KEYS, out={};
// BASES=<file.json> tries other baselines ({race:{str:..}}) without changing chars.js
const BASES=process.env.BASES?JSON.parse(require('fs').readFileSync(process.env.BASES,'utf8')):null;
for(const race of races){ const rows=[];
  for(const sk of skills) for(const d of depths) for(let si=0;si<3;si++) for(let i=0;i<N;i++){
    const g=makeGame(1000*d+100*si+i+7); if(BASES&&BASES[race]) g.RACES[race].base=BASES[race]; const st=g.STARTERS[si], save={items:{},gear:{},char:g.newChar(race,0)}; g.gearState(save);
    const r=g.playBattle(g.starterList(st.colors),d,SKILLS[sk],+(process.env.CAP||300),g.gearMods(save)); rows.push(r); }
  const avg=f=>rows.reduce((s,r)=>s+f(r),0)/rows.length, wins=rows.filter(r=>r.win);
  out[race]={win:avg(r=>r.win), time:avg(r=>r.time), hp:wins.reduce((s,r)=>s+r.hp/r.maxHp,0)/Math.max(1,wins.length)};
  console.log(race.padEnd(8),'win',(Math.round(out[race].win*100)+'%').padStart(4),' time',out[race].time.toFixed(0).padStart(4)+'s',' hpLeft',(Math.round(out[race].hp*100)+'%').padStart(4));
}
if(process.env.SAVE) require('fs').writeFileSync(process.env.SAVE,JSON.stringify(out));
