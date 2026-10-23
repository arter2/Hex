// usage: node anr.js <dir with full_*.jsonl>
const fs=require('fs'), DIR=process.argv[2]||__dirname, R=[];
for(const f of fs.readdirSync(DIR).filter(f=>/^full_\d+\.jsonl$/.test(f))) for(const l of fs.readFileSync(DIR+'/'+f,'utf8').trim().split('\n')) if(l) R.push(JSON.parse(l));
const styles=['average','good','fast','combo'], leans=['fire','frost','storm','verdant','light','shadow'];
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0, med=a=>{ const s=a.slice().sort((x,y)=>x-y); return s.length?s[Math.floor(s.length/2)]:0; }, pct=x=>Math.round(100*x), f1=x=>(+x).toFixed(1);
const ok=R.filter(r=>!r.error); console.log('runs',R.length,'failed',R.length-ok.length,'fights',ok.reduce((a,r)=>a+r.fights.length,0),'fight errors',ok.reduce((a,r)=>a+r.fights.reduce((b,f)=>b+f.errors,0),0),'page errors',ok.reduce((a,r)=>a+(r.pageErrors||[]).length,0));
const band=d=>d<=4?'1-4':d<=8?'5-8':d<=16?'9-16':d<=24?'17-24':'25-40';
console.log('\n## How far each style gets (12 runs each: 6 colours x 2)');
console.log('| Style | Median depth | Mean | Reached d8 | d16 | d24 | d40 (cleared) | Fights | Losses | Level at end | Gold at end |'); console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for(const s of styles){ const rs=ok.filter(r=>r.style===s), D=rs.map(r=>r.reached), at=x=>pct(rs.filter(r=>r.reached>x).length/rs.length)+'%';
  console.log('| '+s+' | '+med(D)+' | '+f1(avg(D))+' | '+at(8)+' | '+at(16)+' | '+at(24)+' | '+at(40)+' | '+f1(avg(rs.map(r=>r.fights.length)))+' | '+f1(avg(rs.map(r=>r.losses)))+' | '+f1(avg(rs.map(r=>r.level)))+' | '+Math.round(avg(rs.map(r=>r.gold)))+' |'); }
console.log('\n## Depth reached by colour (mean of the 8 runs, all styles)');
console.log('| '+leans.join(' | ')+' |'); console.log('|'+leans.map(()=>'---').join('|')+'|'); console.log('| '+leans.map(l=>f1(avg(ok.filter(r=>r.lean===l).map(r=>r.reached)))).join(' | ')+' |');
console.log('| Style | '+leans.join(' | ')+' |'); console.log('|---|'+leans.map(()=>'---').join('|')+'|');
for(const s of styles) console.log('| '+s+' | '+leans.map(l=>ok.filter(r=>r.style===s&&r.lean===l).map(r=>r.reached).join(', ')).join(' | ')+' |');
const F=s=>ok.filter(r=>r.style===s).flatMap(r=>r.fights);
console.log('\n## Fights by depth band: win % / average length (s) / HP lost');
const bands=['1-4','5-8','9-16','17-24','25-40']; console.log('| Style | '+bands.join(' | ')+' |'); console.log('|---|'+bands.map(()=>'---').join('|')+'|');
for(const s of styles) console.log('| '+s+' | '+bands.map(bd=>{ const fs=F(s).filter(f=>band(f.depth)===bd); return fs.length?pct(fs.filter(f=>f.res==='win').length/fs.length)+'% / '+Math.round(avg(fs.map(f=>f.time)))+' / '+Math.round(avg(fs.map(f=>f.hpLost))):'-'; }).join(' | ')+' |');
console.log('\n## Damage shares, combos and movement (all fights)');
console.log('| Style | Wand | Cards | Creatures | Combos per fight | Rune Sets | Flushes | Straights | Rune Runs | Copies | Recipes | Flicks per fight | Stick held (s) |'); console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for(const s of styles){ const fs=F(s); let w=0,c=0,a=0; fs.forEach(f=>{ w+=Math.max(0,f.dmg.wand||0); c+=Math.max(0,f.dmg.card||0); a+=Math.max(0,f.dmg.ally||0); }); const t=w+c+a||1;
  const cb=k=>f1(avg(fs.map(f=>(f.combos||{})[k]||0))); const all=avg(fs.map(f=>Object.values(f.combos||{}).reduce((x,y)=>x+y,0)));
  console.log('| '+s+' | '+pct(w/t)+'% | '+pct(c/t)+'% | '+pct(a/t)+'% | '+f1(all)+' | '+cb('set')+' | '+cb('flush')+' | '+cb('straight')+' | '+cb('run')+' | '+cb('simple')+' | '+cb('recipe')+' | '+f1(avg(fs.map(f=>f.flicks||0)))+' | '+f1(avg(fs.map(f=>f.stick||0)))+' |'); }
console.log('\n## Decks');
console.log('| Style | First deck size | Final size | Biggest rune share, first -> final | Card value, first -> final | Final rarity |'); console.log('|---|---|---|---|---|---|');
for(const s of styles){ const rs=ok.filter(r=>r.style===s), rar={}; rs.forEach(r=>{ for(const [k,v] of Object.entries(r.finalDeck.rarity)) rar[k]=(rar[k]||0)+v/rs.length; });
  console.log('| '+s+' | '+f1(avg(rs.map(r=>r.firstDeck.n)))+' | '+f1(avg(rs.map(r=>r.finalDeck.n)))+' | '+pct(avg(rs.map(r=>r.firstDeck.topRune/r.firstDeck.n)))+'% -> '+pct(avg(rs.map(r=>r.finalDeck.topRune/r.finalDeck.n)))+'% | '+f1(avg(rs.map(r=>r.firstDeck.avgVal)))+' -> '+f1(avg(rs.map(r=>r.finalDeck.avgVal)))+' | '+Object.entries(rar).map(([k,v])=>k+' '+f1(v)).join(', ')+' |'); }
console.log('\n## Where runs ended and what hurt most in lost fights');
for(const s of styles){ const rs=ok.filter(r=>r.style===s), m={}; rs.forEach(r=>r.fights.filter(f=>f.res!=='win').forEach(f=>{ const top=Object.entries(f.hurtBy||{}).sort((a,b)=>b[1]-a[1])[0]; if(top){ const k=top[0]; m[k]=(m[k]||0)+1; } }));
  console.log(s+': ended at', rs.map(r=>r.reached+(r.log.length?'':'*')).join(' '), ' | killers:', Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>k+' '+v).join(', ')); }
console.log('(* = hit the 60-fight / depth-40 cap)');
console.log('\n## Timeouts (fight hit its time limit)'); for(const s of styles) console.log(s, F(s).filter(f=>f.res==='timeout').map(f=>'d'+f.depth).join(' '));
