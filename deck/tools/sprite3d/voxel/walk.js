const {chromium}=require(process.env.PLAYWRIGHT); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const p=await b.newPage(); p.on('pageerror',e=>console.log(e.message)); await p.goto('file://'+path.join(__dirname,'vox.html'));
  const name=process.argv[2], data=JSON.parse(fs.readFileSync(path.join(__dirname,name+'_parts.json')));
  const shots=[];
  for(const y of [-35,-15,0,15,35]) shots.push([`idle_y${y}`,y,{},0]);
  for(const y of [0,30]) for(let f=0;f<6;f++){ const s=Math.sin(f/6*2*Math.PI), c=Math.cos(f/6*2*Math.PI);
    shots.push([`walk_y${y}_f${f}`,y,{legL:[0.5*s,0,0],legR:[-0.5*s,0,0],armL:[-0.4*s,0,0],armR:[0.4*s,0,0],head:[0,0.05*s,0]},Math.abs(c)>0.7?1:0]); }
  for(const [n,y,pose,bob] of shots){ const u=await p.evaluate(([d,y,pose,bob])=>renderParts(d,y*Math.PI/180,pose,bob),[data,y,pose,bob]);
    fs.writeFileSync(path.join(__dirname,'out',`${name}_${n}.png`),Buffer.from(u.split(',')[1],'base64')); }
  await b.close(); })();
