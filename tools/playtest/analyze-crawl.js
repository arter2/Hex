// node tools/playtest/analyze-crawl.js <out.jsonl>...  → a Markdown report of the careers (crawl.js)
const fs=require('fs');
const runs=process.argv.slice(2).flatMap(f=>fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l))).filter(r=>!r.error);
const STY=['average','good','fast','combo','shopaholic'].filter(s=>runs.some(r=>r.label===s));
const by=s=>runs.filter(r=>r.label===s), hrs=a=>a.reduce((x,r)=>x+r.hours,0), sum=(a,f)=>a.reduce((x,r)=>x+(f(r)||0),0);
const f1=x=>(+x).toFixed(1), f0=x=>Math.round(x), pc=x=>Math.round(100*x)+'%';
const out=[]; const P=s=>out.push(s);
const tbl=(head,rows)=>{ P('| '+head.join(' | ')+' |'); P('|'+head.map((h,i)=>i?'---:':'---').join('|')+'|'); rows.forEach(r=>P('| '+r.join(' | ')+' |')); P(''); };
P(`${runs.length} careers, ${f1(hrs(runs))} hours of play in all, ${sum(runs,r=>r.fights.length)} fights, ${sum(runs,r=>r.puzzles.length)} puzzles met. Errors: ${sum(runs,r=>r.errors.length+(r.pageErrors||[]).length)}.`); P('');

P('## Each player'); P('');
tbl(['Player','Hours','Deepest (avg, range)','Deaths / h','Fights / h','Fun / h','Frustration / h','Fun : frustration','Would quit (per h)'],STY.map(s=>{ const a=by(s), h=hrs(a), d=a.map(r=>r.maxDepth);
  return [s,f1(h),f1(d.reduce((x,y)=>x+y,0)/d.length)+' ('+Math.min(...d)+'–'+Math.max(...d)+')',f1(sum(a,r=>r.deaths.length)/h),f0(sum(a,r=>r.fights.length)/h),f0(sum(a,r=>r.fun)/h),f0(sum(a,r=>r.frus)/h),f1(sum(a,r=>r.fun)/Math.max(1,sum(a,r=>r.frus))),f1(sum(a,r=>r.quits.length)/h)]; }));

P('## Where the time goes'); P('');
tbl(['Player','Walking & exploring','Fighting','Puzzles','Dialogs & screens','Camp'],STY.map(s=>{ const a=by(s), T=k=>sum(a,r=>r.time[k]), all=T('walk')+T('fight')+T('puzzle')+T('dialog')+T('camp')+T('other');
  return [s,pc(T('walk')/all),pc(T('fight')/all),pc(T('puzzle')/all),pc((T('dialog')+T('other'))/all),pc(T('camp')/all)]; }));

// every event, by kind
const kinds={}; for(const r of runs) for(const e of r.events){ const K=kinds[e.k]||(kinds[e.k]={n:0,fun:0,frus:0,notes:{},by:{}}); K.n++; K.fun+=e.fun||0; K.frus+=e.frus||0; if(e.note){ const n=e.note.replace(/\d+/g,'#'); K.notes[n]=(K.notes[n]||0)+1; } const b=K.by[r.label]||(K.by[r.label]={n:0,frus:0,fun:0}); b.n++; b.frus+=e.frus||0; b.fun+=e.fun||0; }
const H=hrs(runs), totF=Object.values(kinds).reduce((a,k)=>a+k.frus,0), totJ=Object.values(kinds).reduce((a,k)=>a+k.fun,0);
const top=(o,n)=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>k+(v>1?' ×'+v:'')).join('; ');
P('## Pain points (frustration, all players)'); P('');
tbl(['Kind','Share','Per hour','Times','Felt most by','Examples'],Object.entries(kinds).filter(([,k])=>k.frus>0).sort((a,b)=>b[1].frus-a[1].frus).slice(0,22).map(([name,k])=>{
  const most=Object.entries(k.by).map(([s,b])=>[s,b.frus/hrs(by(s))]).sort((a,b)=>b[1]-a[1])[0];
  return [name,pc(k.frus/totF),f1(k.frus/H),k.n,most?most[0]+' ('+f1(most[1])+'/h)':'',top(k.notes,3).slice(0,140)]; }));
P('## What they enjoyed'); P('');
tbl(['Kind','Share','Per hour','Times','Examples'],Object.entries(kinds).filter(([,k])=>k.fun>0).sort((a,b)=>b[1].fun-a[1].fun).slice(0,14).map(([name,k])=>[name,pc(k.fun/totJ),f1(k.fun/H),k.n,top(k.notes,2).slice(0,100)]));

// by depth
const band=d=>d<=3?'1–3':d<=7?'4–7':d<=12?'8–12':d<=20?'13–20':'21+'; const BANDS=['1–3','4–7','8–12','13–20','21+'];
const bt={}; for(const r of runs){ for(const [d,t] of Object.entries(r.depthT||{})){ const b=bt[band(+d)]||(bt[band(+d)]={t:0,fun:0,frus:0,k:{}}); b.t+=t; }
  for(const e of r.events){ const b=bt[band(e.d)]||(bt[band(e.d)]={t:0,fun:0,frus:0,k:{}}); b.fun+=e.fun||0; b.frus+=e.frus||0; if(e.frus) b.k[e.k]=(b.k[e.k]||0)+e.frus; } }
P('## By depth'); P('');
tbl(['Depth','Hours there','Fun / h','Frustration / h','Worst three'],BANDS.filter(b=>bt[b]&&bt[b].t>60).map(b=>{ const x=bt[b], h=x.t/3600; return [b,f1(h),f0(x.fun/h),f0(x.frus/h),Object.entries(x.k).sort((a,c)=>c[1]-a[1]).slice(0,3).map(([k,v])=>k+' '+f0(v/h)+'/h').join(', ')]; }));

// puzzles
const pz={}; for(const r of runs) for(const p of r.puzzles){ const K=pz[p.kind]||(pz[p.kind]={n:0,ok:0,gave:0,skip:0,t:0,tn:0,m:0,dmg:0,why:{}}); K.n++; if(p.ok) K.ok++; else if(p.skipped) K.skip++; else if(p.gaveUp) K.gave++; if(p.time!=null&&!p.skipped){ K.t+=p.time; K.tn++; } K.m+=p.mistakes||0; K.dmg+=p.dmg||0; if(p.why) K.why[p.why]=(K.why[p.why]||0)+1; }
P('## Puzzles'); P('');
tbl(['Puzzle','Met','Solved','Gave up','Skipped','Avg time','Mistakes each','HP lost each','Why they gave up'],Object.entries(pz).sort((a,b)=>b[1].n-a[1].n).map(([k,x])=>{ const tried=x.n-x.skip; return [k,x.n,pc(x.ok/x.n),pc(x.gave/x.n),pc(x.skip/x.n),x.tn?f0(x.t/x.tn)+'s':'–',tried?f1(x.m/tried):'–',tried?f1(x.dmg/tried):'–',top(x.why,2)]; }));

// fights
P('## Fights in the dungeon'); P('');
tbl(['Player','Fights','Won','Avg length','Over 100 s','No danger (≤3 HP lost)','Surprised','Ambush/strike'],STY.map(s=>{ const f=by(s).flatMap(r=>r.fights); const n=f.length||1;
  return [s,f.length,pc(f.filter(x=>x.res==='win').length/n),f0(f.reduce((a,x)=>a+x.secs,0)/n)+'s',pc(f.filter(x=>x.secs>100).length/n),pc(f.filter(x=>x.res==='win'&&x.hpLost<=3).length/n),pc(f.filter(x=>x.op==='surprised').length/n),pc(f.filter(x=>x.op==='ambush'||x.op==='strike').length/n)]; }));

// danger by depth: HP lost per dungeon fight against the targets in docs/fight-patterns.md
{ const T={'1–3':5,'4–7':10,'8–12':10,'13–20':17,'21+':25}; const fb={}; for(const r of runs) for(const f of r.fights){ if(!f.maxHp) continue; const b=fb[band(f.d)]||(fb[band(f.d)]={n:0,pct:0,big:0,win:0,secs:0,el:0,foes:0}); const pc=100*f.hpLost/f.maxHp; b.n++; b.pct+=pc; if(pc>2*T[band(f.d)]) b.big++; if(f.res==='win') b.win++; b.secs+=f.secs; b.el+=f.elites||0; b.foes+=f.n||0; }
  if(Object.keys(fb).length){ P('## Danger by depth (dungeon fights)'); P('');
    tbl(['Depth','Fights','HP lost a fight','Target','Fights over twice the target','Won','Avg length','Foes a fight','Elites a fight'],BANDS.filter(k=>fb[k]).map(k=>{ const b=fb[k]; return [k,b.n,f1(b.pct/b.n)+'%','~'+T[k]+'%',pc(b.big/b.n),pc(b.win/b.n),f0(b.secs/b.n)+'s',f1(b.foes/b.n),f1(b.el/b.n)]; })); } }
// deaths and quits
const dw={}; for(const r of runs) for(const d of r.deaths){ const k=d.where+': '+d.why; dw[k]=(dw[k]||0)+1; }
P('## Deaths'); P(''); P(Object.keys(dw).length?Object.entries(dw).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>'- '+k+' ×'+v).join('\n'):'None.'); P('');
const qw={}; let qn=0; for(const r of runs) for(const q of r.quits){ qn++; const k=q.why.split(',')[0].replace(/ \d+$/,''); qw[k]=(qw[k]||0)+1; }
P('## Moments a player would likely put the game down'); P('');
P(qn?`${qn} in all (${f1(qn/H)} an hour). What filled the 10 minutes before, by its biggest part:`:'None.'); P('');
if(qn) P(Object.entries(qw).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'- '+k+' ×'+v).join('\n')); P('');
const qd={}; for(const r of runs) for(const q of r.quits){ const b=band(q.d); qd[b]=(qd[b]||0)+1; } if(qn){ P('By depth: '+BANDS.filter(b=>qd[b]).map(b=>b+': '+qd[b]).join(', ')+'.'); P(''); }

// damage outside fights, dialogs, shopping
P('## Damage outside fights (HP per hour)'); P('');
const hk={}; for(const r of runs) for(const [k,v] of Object.entries(r.hurt||{})) hk[k]=(hk[k]||0)+v; P(Object.entries(hk).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>k+' '+f0(v/H)).join(', ')); P('');
const dl={}; for(const r of runs) for(const [k,v] of Object.entries(r.dlgs||{})) dl[k]=(dl[k]||0)+v;
P('## Dialogs'); P(''); P(`${f0(sum(runs,r=>r.dlgN)/H)} an hour. Most often: ${Object.entries(dl).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>k+' '+f0(v/H)+'/h').join(', ')}.`); P('');
P('## Money and packs'); P('');
tbl(['Player','Packs bought','Gold spent on packs','Gold at the end','Level','Deck value start → end','Cards burned up'],STY.map(s=>{ const a=by(s), n=a.length;
  return [s,f1(sum(a,r=>r.packs)/n),f0(sum(a,r=>r.spent)/n),f0(sum(a,r=>r.gold)/n),f1(sum(a,r=>r.level)/n),f0(sum(a,r=>r.startDeck.avgVal)/n)+' → '+f0(sum(a,r=>r.endDeck.avgVal)/n),f1(sum(a,r=>r.burned)/n)]; }));
P('## Traps'); P('');
{ const fl=sum(runs,r=>r.floorsCounted), tp=sum(runs,r=>r.trapsPlaced), hist={}; for(const r of runs) for(const [k,v] of Object.entries(r.trapHist||{})) hist[k]=(hist[k]||0)+v;
  P(`${f1(tp/Math.max(1,fl))} hidden traps a floor on average over ${fl} floors (how many floors held each number: ${Object.keys(hist).sort((a,b)=>a-b).map(k=>k+': '+hist[k]).join(', ')}). `+
    `Tells that came into view within 3 tiles: ${sum(runs,r=>r.tells)}, noticed: ${sum(runs,r=>r.tellsSeen)}; clicks heard: ${sum(runs,r=>r.clicks)}.`); P(''); }
P('## Where the gold goes (per career)'); P('');
{ const K=['packs','gear','card','recharges','upgrades','blessings','potions','materials','curses']; const have=K.filter(k=>runs.some(r=>r.spend&&r.spend[k]));
  tbl(['Player',...have,'Sold gear for','Gold at the end'],STY.map(st=>{ const a=by(st), n=a.length; return [st,...have.map(k=>f0(sum(a,r=>(r.spend||{})[k])/n)),f0(sum(a,r=>r.sold)/n),f0(sum(a,r=>r.gold)/n)]; })); }
P('## Secrets'); P(''); P(`Searches: ${sum(runs,r=>r.searches)}, found something: ${sum(runs,r=>r.searchHits)}; whispered hints heard: ${sum(runs,r=>r.cues)}.`); P('');
const errs={}; for(const r of runs) for(const e of [...r.errors,...(r.pageErrors||[])]){ const k=e.slice(0,90); errs[k]=(errs[k]||0)+1; }
if(Object.keys(errs).length){ P('## Errors'); P(''); P(Object.entries(errs).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>'- '+k+' ×'+v).join('\n')); P(''); }
console.log(out.join('\n'));
