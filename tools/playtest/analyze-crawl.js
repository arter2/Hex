// node tools/playtest/analyze-crawl.js <out.jsonl>...  → a Markdown report of the careers (crawl.js)
const fs=require('fs');
const U=require('./support.js');
const records=U.readRecords(process.argv.slice(2),fs);
for(const r of records)if(!r.error&&!(Array.isArray(r.fights)&&Array.isArray(r.events)&&Array.isArray(r.puzzles)&&Number.isFinite(r.hours))){r.error='Result does not match the report schema';r.status='failed';}
const health=U.coverage(records),runs=records.filter(U.usable);
if(health.failed||health.skipped)process.exitCode=1;
const STY=['average','good','fast','combo','shopaholic'].filter(s=>runs.some(r=>r.label===s));
const by=s=>runs.filter(r=>r.label===s), hrs=a=>a.reduce((x,r)=>x+r.hours,0), sum=(a,f)=>a.reduce((x,r)=>x+(f(r)||0),0);
const f1=x=>(+x).toFixed(1), f0=x=>Math.round(x), pc=x=>Math.round(100*x)+'%';
const out=[]; const P=s=>out.push(s);
P('## Batch health');P('');P(`${health.requested} requested records: ${health.clean} clean, ${health.recovered} recovery-assisted, ${health.failed} failed, ${health.skipped} skipped. Errors: ${health.errors}.`);P('');P('Balance estimates below use clean runs only. Recovery-assisted and failed jobs are reported above, not counted as ordinary losses.');P('');for(const r of records.filter(r=>!U.usable(r)))P('- '+JSON.stringify({job:r.jobId||r.label||r.style||'unknown',seed:r.seed,issues:U.issues(r),recoveries:r.recoveries||[]}));P('');
const tbl=(head,rows)=>{ P('| '+head.join(' | ')+' |'); P('|'+head.map((h,i)=>i?'---:':'---').join('|')+'|'); rows.forEach(r=>P('| '+r.join(' | ')+' |')); P(''); };
P(`${runs.length} careers, ${f1(hrs(runs))} hours of play in all, ${sum(runs,r=>r.fights.length)} fights, ${sum(runs,r=>r.puzzles.length)} puzzles met. Errors: ${sum(runs,r=>r.errors.length+(r.pageErrors||[]).length)}.`); P('');

P('## Each player'); P('');
tbl(['Player','Hours','Deepest (avg, range)','Deaths / h','Fights / h','Fun / h','Frustration / h','Fun : frustration','Modelled threshold crossings / h'],STY.map(s=>{ const a=by(s), h=hrs(a), d=a.map(r=>r.maxDepth);
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
P('## Reward events (model weights)'); P('');
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
P('## Modelled frustration threshold crossings'); P('');
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
// ---- health: rules that must always hold, the save round trip, and what a refresh would lose
{ const iv={}; for(const r of runs) for(const [k,n] of Object.entries(r.invN||{})){ const K=iv[k]||(iv[k]={n:0,careers:0,ex:null}); K.n+=n; K.careers++; } for(const r of runs) for(const x of r.inv||[]) if(iv[x.kind]&&!iv[x.kind].ex) iv[x.kind].ex=`depth ${x.d}, ${x.task||'-'}: ${x.detail} (seed ${r.seed})`;
  const ck=sum(runs,r=>r.saveChecks), U=runs.map(r=>r.unsaved).filter(Boolean), un=sum(U,u=>u.n), ua=sum(U,u=>u.any);
  P('## Health checks'); P('');
  P(`Rules checked every 5 s on the map, the save after every fight, and the save's round trip (write, read back, compare) ${ck} times.`); P('');
  if(Object.keys(iv).length) tbl(['Rule broken','Times','Careers','First example'],Object.entries(iv).sort((a,b)=>b[1].n-a[1].n).map(([k,v])=>[k,v.n,v.careers+'/'+runs.length,v.ex]));
  else P('No rule was broken.');
  if(un){ P(''); P(`**A refresh at a random moment** would lose something ${pc(ua/un)} of the time: on average ${f1(sum(U,u=>u.gold)/un)} gold and ${f1(sum(U,u=>u.cards)/un)} cards; at worst ${Math.max(...U.map(u=>u.maxGold))} gold and ${Math.max(...U.map(u=>u.maxCards))} cards; a level ${sum(U,u=>u.levels)} times.`); }
  P(''); }
// ---- fair hits: how long each hit's threat was on screen before it landed
{ const W={hits:0,unknown:0,dmg:0,unfair:0,unfairDmg:0,tight:0,bins:[0,0,0,0,0,0],byKind:{},src:{}}, BB={};
  for(const r of runs) for(const f of r.fights){ const w=f.warn; if(!w) continue; const b=BB[band(f.d)]||(BB[band(f.d)]={hits:0,unknown:0,unfair:0,tight:0,dmg:0,unfairDmg:0});
    for(const k of ['hits','dmg','unfair','unfairDmg','tight','unknown']){ W[k]+=w[k]||0; b[k]+=w[k]||0; } w.bins.forEach((x,i)=>W.bins[i]+=x);
    for(const [k,v] of Object.entries(w.byKind)){ const K=W.byKind[k]||(W.byKind[k]={n:0,dmg:0,warnSum:0,warnN:0}); for(const q in v) K[q]+=v[q]; }
    for(const x of w.worst) { const k=(x.src||'?')+(x.move?' ('+x.move+')':''); W.src[k]=(W.src[k]||0)+1; } }
  if(W.hits){ P('## Fair hits (dungeon fights)'); P('');
    P(`Warnings are simulation observations, not first-paint or human-visibility measurements. ${W.unknown} hits have unknown warning and are excluded from unfair/tight denominators. For every hit that cost HP: how long its threat was on screen first (a ground telegraph's whole time; a shot's flight plus its owner's wind-up). **Unfair:** under 0.4 s (too quick to see and step away) while you stood on that tile all along. **Tight:** 0.4–0.7 s.`); P('');
    P(`${W.hits} hits: **${pc(W.unfair/Math.max(1,W.hits-W.unknown))} unfair** (${pc(W.unfairDmg/Math.max(1,W.dmg))} of the HP lost to hits), ${pc(W.tight/Math.max(1,W.hits-W.unknown))} tight. Warning time: ${['<0.2 s','0.2–0.4','0.4–0.7','0.7–1','1–2','2 s+'].map((l,i)=>l+' '+pc(W.bins[i]/Math.max(1,W.bins.reduce((a,b)=>a+b,0)))).join(' · ')}.`); P('');
    tbl(['Depths','Hits','Unfair','Tight','HP lost to unfair hits'],BANDS.filter(b=>BB[b]).map(b=>[b,BB[b].hits,pc(BB[b].unfair/Math.max(1,BB[b].hits-BB[b].unknown)),pc(BB[b].tight/Math.max(1,BB[b].hits-BB[b].unknown)),pc(BB[b].unfairDmg/Math.max(1,BB[b].dmg))])); P('');
    tbl(['Hit by','Hits','HP','Average warning'],Object.entries(W.byKind).map(([k,v])=>[{tele:'ground telegraph',shot:'shot',other:'no telegraph (burning ground, thorns, scripted)'}[k]||k,v.n,v.dmg,v.warnN?f1(v.warnSum/v.warnN)+' s':'–']));
    if(Object.keys(W.src).length){ P(''); P('Most unfair hits came from: '+top(W.src,8)+'.'); } P(''); } }
// ---- where sessions stop: the hook (the next big reward within 2 minutes) and the mood at the stop
{ const BIG=e=>['levelup','depth:new','quest:done','puzzle:solved','legendary','blessing','seal:open'].includes(e.k)||e.k==='fight:win'&&(e.fun||0)>=9||e.k==='card:new'&&/\((legendary|hero)\)/.test(e.note||'');
  let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const sess=()=>{ const u=Math.max(1e-6,rnd()), v=rnd(); return Math.max(180,Math.exp(Math.log(12*60)+.6*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v))); };   // phone sessions: median 12 min
  const S={}, G={};
  for(const r of runs){ const big=r.events.filter(BIG).map(e=>e.t).sort((a,b)=>a-b), T=r.hours*3600, X=S[r.label]||(S[r.label]={n:0,hook:0,nat:0,high:0,quit:0,quitHook:0,next:[]});
    const gg=G[r.label]||(G[r.label]=[]); for(let i=1;i<big.length;i++) gg.push(big[i]-big[i-1]);
    const stops=[]; let t=0; const qs=r.quits.map(q=>q.t); while(true){ const nq=qs.find(q=>q>t+60); const end=t+sess(); const at=nq!=null&&nq<end?nq:end; if(at>=T-60) break; stops.push({t:at,quit:at===nq}); t=at; }
    for(const st of stops){ const nx=big.find(b=>b>st.t), prev=[...big].reverse().find(b=>b<=st.t), next=nx==null?9999:nx-st.t;
      const mood=r.events.filter(e=>e.t>st.t-300&&e.t<=st.t).reduce((a,e)=>a+(e.fun||0)-(e.frus||0),0)-(r.fun-r.frus)/T*300;   // against this player's own usual 5 minutes
      X.n++; X.next.push(next); if(next<=120) X.hook++; if(prev!=null&&st.t-prev<=30) X.nat++; if(mood>0) X.high++; if(st.quit){ X.quit++; if(next<=120) X.quitHook++; } } }
  const q=(a,p)=>{ const b=a.slice().sort((x,y)=>x-y); return b.length?b[Math.min(b.length-1,Math.floor(b.length*p))]:0; }, mm=x=>x>=60?f1(x/60)+' min':f0(x)+' s';
  P('## Where sessions stop'); P('');
  P('Illustrative model only, not observed retention. Each career is cut into phone-sized sessions (median 12 minutes, at least 3), and a session also ends at every moment the player would likely put the game down. At each stop: how soon the next big reward came in that career (a level, a new depth, a boss, a quest, a puzzle, a legendary or hero card, a blessing, a broken seal), and whether the last 5 minutes went better than that player’s usual 5 minutes (ended on a high).'); P('');
  tbl(['Player','Stops','Next big reward within 2 min (a hook)','Typical wait to the next one','Stopped right after one (a natural break)','Ended on a high','Stops that were "would quit"','…of those, a reward was under 2 min away'],STY.filter(s=>S[s]).map(s=>{ const x=S[s]; return [s,x.n,pc(x.hook/x.n),mm(q(x.next,.5)),pc(x.nat/x.n),pc(x.high/x.n),x.quit,x.quit?pc(x.quitHook/x.quit):'–']; })); P('');
  { const rr=sum(runs,r=>r.events.filter(e=>e.k==='card:new'&&/\(rare\)/.test(e.note||'')).length); P(`New rare cards: ${f1(rr/H)} an hour (not counted as a big reward: at this rate they are not rare).`); P(''); }
  P('Time between big rewards:'); P('');
  tbl(['Player','Median','1 in 10 waits longer than','Longest'],STY.filter(s=>G[s]&&G[s].length).map(s=>[s,mm(q(G[s],.5)),mm(q(G[s],.9)),mm(Math.max(...G[s]))])); P(''); }
const errs={}; for(const r of runs) for(const e of [...r.errors,...(r.pageErrors||[])]){ const k=e.slice(0,90); errs[k]=(errs[k]||0)+1; }
if(Object.keys(errs).length){ P('## Errors'); P(''); P(Object.entries(errs).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>'- '+k+' ×'+v).join('\n')); P(''); }
console.log(out.join('\n'));

