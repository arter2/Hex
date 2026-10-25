// node tools/playtest/puzzle-lab.js [kinds] [n] [profile]   — each puzzle kind on its own, solved by the crawl bot (crawl.js)
const Runner=require('./runner-common.js'); let host,browser;
const kinds=(process.argv[2]||'statues,mirrors,runes,levers,plates,trial,path,memory,bells,ice,scales,shift,riddle,braziers').split(','), n=+(process.argv[3]||6), prof=process.argv[4]||'good';
const MAP=require('./mkcrawl-profiles.js');
(async()=>{ host=await Runner.serve(); const {browser:br}=await Runner.launch(); browser=br;
 for(const kind of kinds){ const pg=await br.newPage({viewport:{width:400,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
   await pg.goto(host.url); await pg.waitForFunction(()=>typeof enterExplore==='function'&&typeof openCamp==='function');
   await pg.addScriptTag({path:__dirname+'/support.js'}); await pg.addScriptTag({path:__dirname+'/bot.js'}); await pg.addScriptTag({path:__dirname+'/crawl.js'});
   const r=await pg.evaluate(c=>PT.crawl.puzzleLab(c),{kind,n,seed:7,p:MAP.MAP[prof],bot:MAP.FIGHT[prof],depth:6});
   const ok=Array.isArray(r)?r.filter(x=>x.ok).length:0; if(!Array.isArray(r)||ok!==n||errs.length)process.exitCode=1; console.log(kind.padEnd(9),Array.isArray(r)?ok+'/'+r.length+' solved  '+r.map(x=>x.err?'ERR '+x.err+(x.got?' got '+x.got:''):(x.ok?'✓':'✗')+x.t+'s m'+x.mistakes+(x.why?' ('+x.why+')':'')+(process.env.V?' '+JSON.stringify({f:x.fights,scr:x.scr,dlg:x.dlg}):'')).join(' | '):JSON.stringify(r), errs.slice(0,2).join(' ; '));
   await pg.close(); }
 })().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{try{if(browser)await browser.close();}finally{if(host)await host.close();}});

