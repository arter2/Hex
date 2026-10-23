// node tools/playtest/puzzle-lab.js [kinds] [n] [profile]   — each puzzle kind on its own, solved by the crawl bot (crawl.js)
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const kinds=(process.argv[2]||'statues,mirrors,runes,levers,plates,trial,path,memory,bells,ice,scales,shift,riddle,braziers').split(','), n=+(process.argv[3]||6), prof=process.argv[4]||'good';
const MAP=require('./mkcrawl-profiles.js');
(async()=>{ const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const kind of kinds){ const pg=await br.newPage({viewport:{width:400,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
   await pg.goto('file://'+require('path').resolve(__dirname,'../../game/index.html')); await pg.waitForTimeout(600);
   await pg.addScriptTag({path:__dirname+'/bot.js'}); await pg.addScriptTag({path:__dirname+'/crawl.js'});
   const r=await pg.evaluate(c=>PT.crawl.puzzleLab(c),{kind,n,seed:7,p:MAP.MAP[prof],bot:MAP.FIGHT[prof],depth:6});
   const ok=Array.isArray(r)?r.filter(x=>x.ok).length:0; console.log(kind.padEnd(9),Array.isArray(r)?ok+'/'+r.length+' solved  '+r.map(x=>x.err?'ERR '+x.err+(x.got?' got '+x.got:''):(x.ok?'✓':'✗')+x.t+'s m'+x.mistakes+(x.why?' ('+x.why+')':'')+(process.env.V?' '+JSON.stringify({f:x.fights,scr:x.scr,dlg:x.dlg}):'')).join(' | '):JSON.stringify(r), errs.slice(0,2).join(' ; '));
   await pg.close(); }
 await br.close(); })();
