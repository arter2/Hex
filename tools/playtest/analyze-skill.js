// node tools/playtest/analyze-skill.js <runs.jsonl>... → Markdown: does skill matter, is there one best way to play, are hits fair
// Input: whole battle runs (run-runner.js, jobs from mkruns.js) with the random player among the styles.
//  · Mastery gap: win rate and HP lost per fight, the random player against the others, by depth.
//  · One best way? Win rate by colour; and each card's lift: in fights of the same colour and depth band, how
//    the win rate and the HP lost differ with the card in the deck and without it. A big, sure lift is a card
//    the game is built around whether you like it or not.
//  · Fair hits: how long each hit's threat was on screen first (bot.js warnHit), by player.
const fs=require('fs');
const runs=process.argv.slice(2).flatMap(f=>fs.readFileSync(f,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l))).filter(r=>!r.error&&r.fights);
const out=[], P=s=>out.push(s), pc=x=>Math.round(100*x)+'%', f1=x=>(+x).toFixed(1);
const tbl=(h,rows)=>{ P('| '+h.join(' | ')+' |'); P('|'+h.map((x,i)=>i?'---:':'---').join('|')+'|'); rows.forEach(r=>P('| '+r.join(' | ')+' |')); P(''); };
const band=d=>d<=3?'1–3':d<=7?'4–7':d<=12?'8–12':d<=20?'13–20':'21+', BANDS=['1–3','4–7','8–12','13–20','21+'];
const STY=['random','average','good','fast','combo','shopaholic'].filter(s=>runs.some(r=>r.label===s));
const fights=runs.flatMap(r=>r.fights.map(f=>Object.assign({style:r.label, lean:r.lean, b:band(f.depth)},f)));
P(`# Skill, strategy and fairness (battle runs)`); P(''); P(`${runs.length} runs, ${fights.length} fights. Players: ${STY.join(', ')}.`); P('');

// ---- mastery gap
P('## Does skill matter? (the mastery gap)'); P('');
P('The random player builds the same decks as the average player, but in a fight it wanders, never dodges, casts cards as they come and taps carelessly. If it wins nearly as often as a good player, skill in a fight hardly matters; if it never wins, the game punishes new players hard.'); P('');
const cell=(st,b)=>{ const a=fights.filter(f=>f.style===st&&(!b||f.b===b)); return a.length?{n:a.length, win:a.filter(f=>f.res==='win').length/a.length, hp:a.reduce((s,f)=>s+(f.hpLost||0),0)/a.length}:null; };
tbl(['Player',...BANDS.map(b=>'Won, depth '+b),'HP lost a fight'],STY.map(s=>[s,...BANDS.map(b=>{ const c=cell(s,b); return c?pc(c.win)+' ('+c.n+')':'–'; }),f1((cell(s)||{hp:0}).hp)]));
if(STY.includes('random')){ const rows=[]; for(const s of STY.filter(x=>x!=='random')) rows.push([s+' − random',...BANDS.map(b=>{ const a=cell(s,b), r=cell('random',b); return a&&r?(a.win-r.win>=0?'+':'')+Math.round(100*(a.win-r.win))+' pts':'–'; }),(()=>{ const a=cell(s), r=cell('random'); return a&&r?f1(r.hp-a.hp)+' HP less':'–'; })()]);
  P('The gap (win rate points, and HP lost per fight, compared with the random player):'); P(''); tbl(['Player',...BANDS,'HP'],rows);
  const reached=s=>{ const a=runs.filter(r=>r.label===s); return a.length?a.reduce((x,r)=>x+(r.reached||0),0)/a.length:0; };
  P('Depth reached (average of runs): '+STY.map(s=>s+' '+f1(reached(s))).join(', ')+'.'); P(''); }

// ---- one best way?
const skilled=fights.filter(f=>f.style!=='random');
P('## Is there one best way to play?'); P('');
{ const L={}; for(const r of runs.filter(r=>r.label!=='random')){ const x=L[r.lean]||(L[r.lean]={runs:0,reached:0,w:0,n:0,hp:0}); x.runs++; x.reached+=r.reached||0; for(const f of r.fights){ x.n++; x.w+=f.res==='win'?1:0; x.hp+=f.hpLost||0; } }
  const rows=Object.entries(L).sort((a,b)=>b[1].w/b[1].n-a[1].w/a[1].n).map(([k,x])=>[k,x.runs,pc(x.w/x.n),f1(x.hp/x.n),f1(x.reached/x.runs)]);
  P('By colour (all players but the random one):'); P(''); tbl(['Colour','Runs','Fights won','HP lost a fight','Depth reached'],rows);
  const wr=Object.values(L).map(x=>x.w/x.n); if(wr.length>1) P(`Spread between the best and worst colour: ${Math.round(100*(Math.max(...wr)-Math.min(...wr)))} win-rate points.`); P(''); }
{ // card lift, within colour × depth band strata
  const strata={}; for(const f of skilled){ if(!f.list) continue; (strata[f.lean+'|'+f.b]=strata[f.lean+'|'+f.b]||[]).push(f); }
  const lift={};
  for(const fs2 of Object.values(strata)){ if(fs2.length<20) continue; const ids=new Set(fs2.flatMap(f=>f.list));
    for(const id of ids){ const w=fs2.filter(f=>f.list.includes(id)), wo=fs2.filter(f=>!f.list.includes(id)); if(w.length<8||wo.length<8) continue;
      const pw=w.filter(f=>f.res==='win').length/w.length, po=wo.filter(f=>f.res==='win').length/wo.length, hw=w.reduce((s,f)=>s+(f.hpLost||0),0)/w.length, ho=wo.reduce((s,f)=>s+(f.hpLost||0),0)/wo.length;
      const L=lift[id]||(lift[id]={n:0,dw:0,dh:0,with:0,var:0}); const k=Math.min(w.length,wo.length); L.n+=k; L.dw+=k*(pw-po); L.dh+=k*(ho-hw); L.with+=w.length;
      const p=(pw*w.length+po*wo.length)/(w.length+wo.length); L.var+=k*k*p*(1-p)*(1/w.length+1/wo.length); } }
  const NAMES=Object.assign({},...runs.map(r=>r.names||{})), name=id=>NAMES[id]||id;
  const rows=Object.entries(lift).filter(([,L])=>L.n>=40).map(([id,L])=>({id, dw:L.dw/L.n, dh:L.dh/L.n, z:L.dw/Math.sqrt(Math.max(1e-9,L.var)), with:L.with}));
  P('Card lift: in fights of the same colour and depth band, the win rate and the HP lost with the card in the deck against without it (weighted across colours and depths; cards in enough decks both ways).'); P('');
  if(rows.length){ const fmt=r=>[name(r.id),r.with,(r.dw>=0?'+':'')+f1(100*r.dw)+' pts',f1(r.dh)+' HP',f1(r.z)];
    P('Biggest help:'); P(''); tbl(['Card','Fights with it','Win rate','HP saved a fight','Sureness (z)'],rows.slice().sort((a,b)=>b.dh-a.dh).slice(0,10).map(fmt));
    P('Biggest drag:'); P(''); tbl(['Card','Fights with it','Win rate','HP saved a fight','Sureness (z)'],rows.slice().sort((a,b)=>a.dh-b.dh).slice(0,6).map(fmt));
    // hundreds of cards are tested at once, so a z of 2.5 turns up by chance alone: a must-have needs z > 3.5
    const dom=rows.filter(r=>r.dw>.08&&r.z>3.5), maybe=rows.filter(r=>r.dw>.08&&r.z>2.5&&r.z<=3.5);
    P(dom.length?`**Possible must-haves** (win rate +8 points or more, z > 3.5, ${rows.length} cards tested): ${dom.map(r=>name(r.id)+' (+'+f1(100*r.dw)+' pts)').join(', ')}.`:`No card lifts the win rate by 8 points or more with confidence (z > 3.5, ${rows.length} cards tested): no must-have card.`);
    if(maybe.length) P(`Worth watching (z 2.5–3.5, could be chance): ${maybe.length} cards, led by ${maybe.sort((a,b)=>b.z-a.z).slice(0,5).map(r=>name(r.id)).join(', ')}.`); P(''); }
  else P('Not enough fights with deck lists to measure card lift.'); P(''); }

// ---- fair hits
P('## Fair hits (battle runs)'); P('');
P('How long each hit\'s threat was on screen before it landed. **Unfair:** under 0.4 s while you stood on that tile all along. **Tight:** 0.4–0.7 s.'); P('');
{ const rows=[]; for(const s of STY){ const W={hits:0,unfair:0,tight:0,dmg:0,ud:0,bins:[0,0,0,0,0,0]}; for(const f of fights.filter(f=>f.style===s&&f.warn)){ W.hits+=f.warn.hits; W.unfair+=f.warn.unfair; W.tight+=f.warn.tight; W.dmg+=f.warn.dmg; W.ud+=f.warn.unfairDmg; f.warn.bins.forEach((x,i)=>W.bins[i]+=x); }
    if(W.hits) rows.push([s,W.hits,pc(W.unfair/W.hits),pc(W.tight/W.hits),pc(W.ud/Math.max(1,W.dmg))]); }
  tbl(['Player','Hits','Unfair','Tight','HP lost to unfair hits'],rows);
  const src={}; for(const f of fights) for(const x of (f.warn&&f.warn.worst)||[]){ const k=(x.src||'?')+(x.move?' ('+x.move+')':''); src[k]=(src[k]||0)+1; }
  if(Object.keys(src).length){ P('Most unfair hits came from: '+Object.entries(src).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>k+' ×'+v).join('; ')+'.'); P(''); } }
console.log(out.join('\n'));
