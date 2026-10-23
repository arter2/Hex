// Whole runs (dev tool): node tools/playtest/run-runner.js <jobs.json> <out.jsonl>   (jobs: mkruns.js; summary: analyze-runs.js <dir>)
const {chromium}=require('/opt/node22/lib/node_modules/playwright'); const fs=require('fs');
const [,,jobsFile,outFile]=process.argv, jobs=JSON.parse(fs.readFileSync(jobsFile,'utf8')), T0=Date.now();
(async()=>{ const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 const pg=await br.newPage({viewport:{width:400,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+require('path').resolve(__dirname,'../../game/index.html')); await pg.waitForTimeout(1200);
 await pg.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
 await pg.addScriptTag({path:__dirname+'/'+(process.env.BOTFILE||'bot.js')});
 for(const j of jobs){ const n0=errs.length; let r; try{ r=await pg.evaluate(c=>PT.runRun(c),j); }catch(e){ r={style:j.style,lean:j.lean,error:e.message}; }
   r.pageErrors=errs.slice(n0,n0+5); fs.appendFileSync(outFile,JSON.stringify(r)+'\n'); console.log(j.style,j.lean,r.reached,r.wins+'W/'+r.losses+'L',((Date.now()-T0)/1000).toFixed(0)+'s'); }
 await br.close(); })();
