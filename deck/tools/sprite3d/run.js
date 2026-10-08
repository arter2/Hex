// node run.js [ids...]  -> out/<id>.png + out/<id>.json
const {chromium}=require(process.env.PLAYWRIGHT); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto('file://'+path.join(__dirname,'lab.html')); await p.waitForTimeout(300);
  if(errs.length){ console.log(errs); }
  let ids=process.argv.slice(2); const all=await p.evaluate(()=>LAB.ids()); if(!ids.length) ids=all;
  else ids=ids.flatMap(i=>i.endsWith('*')?all.filter(a=>a.startsWith(i.slice(0,-1))):[i]);
  fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});
  for(const id of ids){ const t=Date.now(); const r=await p.evaluate(id=>LAB.renderSheet(id),id).catch(e=>({err:e.message}));
    if(r.err){ console.log(id,'ERR',r.err); continue; }
    fs.writeFileSync(path.join(__dirname,'out',id+'.png'),Buffer.from(r.url.split(',')[1],'base64')); fs.writeFileSync(path.join(__dirname,'out',id+'.json'),JSON.stringify(r.meta));
    console.log(id,(Date.now()-t)+'ms'); }
  if(errs.length) console.log(errs.slice(0,5)); await b.close(); })();
