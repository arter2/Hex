// Whole careers in the dungeon (dev tool): node tools/playtest/crawl-runner.js <jobs.json> <out.jsonl>   (jobs: mkcrawl.js; report: analyze-crawl.js)
const {chromium}=require('/opt/node22/lib/node_modules/playwright'); const fs=require('fs');
const [,,jobsFile,outFile]=process.argv, jobs=JSON.parse(fs.readFileSync(jobsFile,'utf8')), T0=Date.now();
(async()=>{ const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const j of jobs){ // a fresh page for every career: no state carries over
   const pg=await br.newPage({viewport:{width:400,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{ if(m.type()==='error'&&errs.length<40) errs.push('console: '+m.text().slice(0,200)); });
   await pg.goto('file://'+require('path').resolve(__dirname,'../../game/index.html')); await pg.waitForTimeout(800);
   await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
   await pg.addScriptTag({path:__dirname+'/bot.js'}); await pg.addScriptTag({path:__dirname+'/crawl.js'});
   const t1=Date.now(); let r; try{ r=await pg.evaluate(c=>PT.crawl.run(c),j); }catch(e){ r={label:j.label,lean:j.lean,error:e.message}; }
   r.pageErrors=errs.slice(0,10); r.realSecs=Math.round((Date.now()-t1)/1000); fs.appendFileSync(outFile,JSON.stringify(r)+'\n');
   console.log(j.label,j.lean,'depth',r.maxDepth,'h',r.hours,'fun',r.fun,'frus',r.frus,'deaths',r.deaths&&r.deaths.length,'err',(r.errors||[]).length+(r.error?1:0),r.realSecs+'s');
   await pg.close(); }
 await br.close(); })();
