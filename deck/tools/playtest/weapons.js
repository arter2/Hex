const {makeGame}=require('./harness.js');
const EXPERT={wandRate:4.5, dodge:.85, react:.15, align:true, pick:'best', smartCast:true, charge:true, closeIn:true};
const NOV={wandRate:2.5, dodge:.3, react:.6, align:false, pick:'first', smartCast:false, charge:false};
const out=[];
function run(label,skill,depth,setup,N){ const rows=[];
  for(let si=0;si<3;si++) for(let i=0;i<N;i++){ const g=makeGame(5000+depth*100+si*10+i), save={items:{},gear:{}}; g.gearState(save);
    for(const [slot,id] of Object.entries(setup)){ save.items[id]=1; save.gear[slot]=id; }
    const r=g.playBattle(g.starterList(g.STARTERS[si].colors),depth,skill,300,g.gearMods(save)); rows.push(r); }
  const avg=f=>rows.reduce((a,r)=>a+f(r),0)/rows.length;
  console.log(label.padEnd(34),'win',(Math.round(avg(r=>r.win)*100)+'%').padStart(4),' time',avg(r=>r.time).toFixed(0).padStart(4)+'s',' timeout',(Math.round(avg(r=>r.timeout)*100)+'%').padStart(4),
    ' wand share',(Math.round(avg(r=>(r.stats.dmg.wand||0)/Math.max(1,Object.values(r.stats.dmg).reduce((a,b)=>a+b,0)))*100)+'%').padStart(4),' out of reach',avg(r=>r.stats.outOfReach).toFixed(1)+'s');
}
for(const w of ['basic_wand','oak_staff','elven_bow','iron_crossbow','hunter_spear','volt_wand','ice_wand']) run('expert d5 '+w,EXPERT,5,{weapon:w},5);
run('novice d5 basic',NOV,5,{weapon:'basic_wand'},5);
run('novice d5 dragonscale+archmage',NOV,5,{weapon:'archmage_staff',body:'dragonscale'},5);
run('expert d8 starter gear',EXPERT,8,{weapon:'basic_wand'},5);
run('expert d8 tier-3 gear',EXPERT,8,{weapon:'archmage_staff',body:'dragonscale',head:'kabuto',arms:'runed_bracers',ring1:'ring_vigor',ring2:'ring_regen'},5);
