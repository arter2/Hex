// Playtest runner (dev tool). usage: node tools/playtest/runner.js <jobs.json> <out.jsonl>   (jobs from mkjobs.js; summary: analyze.js <dir>)
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const [,,jobsFile,outFile]=process.argv;
const jobs=JSON.parse(fs.readFileSync(jobsFile,'utf8'));
const T0=Date.now(), LIMIT=(+process.env.LIMIT_S||420)*1000;
(async()=>{
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await br.newPage({viewport:{width:400,height:800}});
 const errs=[]; pg.on('pageerror',e=>errs.push('pageerror: '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join(' | '))); pg.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
 await pg.goto('file://'+require('path').resolve(__dirname,'../../game/index.html')); await pg.waitForTimeout(1200);
 await pg.addScriptTag({path:__dirname+'/'+(process.env.BOTFILE||'bot.js')});
 let curDeck=null, done=0;
 for(const j of jobs){
   if(Date.now()-T0>LIMIT){ console.error('time limit, stopping at',done); break; }
   const key=JSON.stringify([j.starter,j.lab||null]);
   if(key!==curDeck){ const labIds=[]; for(const sp of j.lab||[]){ const r=await pg.evaluate(s=>PT.makeLab(s),sp); labIds.push(r.id); }
     const v=await pg.evaluate(([i,ids])=>PT.setupDeck(i,ids),[j.starter,labIds]); if(!v.ok) console.error('deck invalid',j.deck,v.errors); curDeck=key; }
   const n0=errs.length;
   let r; try{ r=await pg.evaluate(c=>PT.runFight(c),{depth:j.depth,deck:j.deck,botName:j.botName,bot:j.bot,maxT:j.maxT,debug:j.debug,trace:j.trace,seed:j.seed}); }catch(e){ r={deck:j.deck,depth:j.depth,bot:j.botName,res:'evalerror',errors:[e.message]}; }
   r.pageErrors=errs.slice(n0);
   fs.appendFileSync(outFile,JSON.stringify(r)+'\n'); done++;
 }
 await br.close();
 console.log('done',done,'in',((Date.now()-T0)/1000).toFixed(0)+'s');
})();
