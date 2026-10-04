// Headless check of the dungeon's minibosses: each one alone, at a few depths, against the three starter decks.
// Run: node deck/tools/playtest/minis.js <battles per cell> <depths>   e.g. node deck/tools/playtest/minis.js 3 3,6,9
const {makeGame}=require('./harness.js');
const SKILLS={casual:{wandRate:3.5, dodge:.55, react:.35, align:true, pick:'best', smartCast:false, charge:false},
              expert:{wandRate:4.5, dodge:.85, react:.15, align:true, pick:'best', smartCast:true, charge:true, closeIn:true}};
const N=+(process.argv[2]||3), depths=(process.argv[3]||'3,6,9').split(',').map(Number);
const G0=makeGame(1), ids=G0.MINIBOSS_IDS, rows=[];
for(const id of ids) for(const sk in SKILLS) for(const d of depths) for(let si=0;si<3;si++) for(let i=0;i<N;i++){
  const g=makeGame(7000+100*d+10*si+i), st=g.STARTERS[si]; const r=g.playBattle(g.starterList(st.colors),d,SKILLS[sk],+(process.env.CAP||420),{},[g.miniWave(id,d)]);
  rows.push({id,sk,d,win:r.win,time:r.time,hp:r.hp/r.maxHp}); }
for(const id of ids){ const line=[id.padEnd(14)];
  for(const sk in SKILLS){ const rs=rows.filter(r=>r.id===id&&r.sk===sk); line.push(sk+' win '+String(Math.round(100*rs.filter(r=>r.win).length/rs.length)).padStart(3)+'% '+Math.round(rs.reduce((a,r)=>a+r.time,0)/rs.length)+'s hp '+Math.round(100*rs.reduce((a,r)=>a+r.hp,0)/rs.length)+'%'); }
  console.log(line.join('  ')); }
