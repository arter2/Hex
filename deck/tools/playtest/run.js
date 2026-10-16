// Headless playtest: bots of three skill levels play battles. Run: node deck/tools/playtest/run.js <label> <battles per cell> <depths>
// e.g. node deck/tools/playtest/run.js check 10 1,3,5,8  (3 skills x depths x 3 starter decks x N)
const {makeGame}=require('./harness.js');
const SKILLS={
  novice: {wandRate:2.5, dodge:.3, react:.6, align:false, pick:'first', smartCast:false, charge:false},
  casual: {wandRate:3.5, dodge:.55, react:.35, align:true, pick:'best', smartCast:false, charge:false},
  expert: {wandRate:4.5, dodge:.85, react:.15, align:true, pick:'best', smartCast:true, charge:true, closeIn:true},
};
const label=process.argv[2]||'run', N=+(process.argv[3]||10), depths=(process.argv[4]||'1,3,5,8').split(',').map(Number), weapon=process.argv[5]||null;
const rows=[];
for(const sk in SKILLS) for(const d of depths) for(let si=0;si<3;si++) for(let i=0;i<N;i++){
  const g=makeGame(1000*d+100*si+i+7), st=g.STARTERS[si];
  let gear={};
  if(weapon){ const save={items:{},gear:{}}; g.gearState(save); save.items[weapon]=1; save.gear.weapon=weapon; gear=g.gearMods(save); }
  const r=g.playBattle(g.starterList(st.colors),d,SKILLS[sk],+(process.env.CAP||300),gear);
  rows.push(Object.assign({skill:sk,depth:d,starter:st.name},r));
}
const fs=require('fs'); if(process.env.SAVE) fs.writeFileSync(process.env.SAVE,JSON.stringify(rows));
const agg=(f)=>{ const g={}; for(const r of rows){ const k=f(r); (g[k]=g[k]||[]).push(r); } return g; };
const pct=x=>Math.round(x*100)+'%', avg=(a,f)=>a.reduce((s,r)=>s+f(r),0)/a.length;
console.log(label,'battles',rows.length);
for(const [k,a] of Object.entries(agg(r=>r.skill+' d'+r.depth))) console.log(k.padEnd(12),'win',pct(avg(a,r=>r.win)).padStart(4),' time',avg(a,r=>r.time).toFixed(0).padStart(4)+'s',' timeout',pct(avg(a,r=>r.timeout)).padStart(4),
  ' hpLeft',pct(avg(a.filter(r=>r.win),r=>r.hp/r.maxHp)||0).padStart(4),' backTime',pct(avg(a,r=>r.stats.backTime/Math.max(1,r.stats.enemyT))).padStart(4),' queued/turn',avg(a,r=>r.stats.queued/r.stats.customs).toFixed(2),
  ' runeBlocks/turn',avg(a,r=>r.stats.runeBlocks/r.stats.customs).toFixed(2),' surge',pct(avg(a,r=>r.stats.surges/r.stats.customs)));
