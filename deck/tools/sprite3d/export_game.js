// node export_game.js [ids...] -> game/<id>.json (frames as data URLs + weapon tips) for make_sprites.py
const {chromium}=require(process.env.PLAYWRIGHT); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const p=await b.newPage(); p.on('pageerror',e=>console.log(e.message)); await p.goto('file://'+path.join(__dirname,'lab.html')); await p.waitForTimeout(300);
  const roster=await p.evaluate(()=>LAB.ROSTER.map(e=>({id:e.id,group:e.group,views:e.views.map(v=>v.name)})));
  let ids=process.argv.slice(2); if(!ids.length) ids=roster.map(r=>r.id); fs.mkdirSync(path.join(__dirname,'game'),{recursive:true});
  for(const id of ids){ const r=roster.find(x=>x.id===id); let list;
    if(r.group==='Player characters'){ list=[];
      for(const bare of [false,true]){ const s=bare?'Bare':'';
        list.push({key:'front'+s,view:'front',move:'idle',t:0,bare},{key:'back'+s,view:'back',move:'idle',t:0,bare});
        [['idle',0],['walk',.25],['cast',.55],['attack',.42]].forEach(([m,t],i)=>list.push({key:'anim'+s+i,view:'back',move:m,t,bare})); } }
    else if(r.group==='Weapons') list=[{key:'icon',view:'icon',move:'icon',t:0}];
    else list=[{key:'unit',view:r.views[0],move:'idle',t:0}];
    const out=await p.evaluate(([id,list])=>LAB.exportGame(id,list),[id,list]);
    fs.writeFileSync(path.join(__dirname,'game',id+'.json'),JSON.stringify({id,group:r.group,frames:out})); console.log(id); }
  await b.close(); })();
