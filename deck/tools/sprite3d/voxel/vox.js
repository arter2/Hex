const {chromium}=require(process.env.PLAYWRIGHT||'playwright'); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const p=await b.newPage(); p.on('pageerror',e=>console.log(e.message)); await p.goto('file://'+path.join(__dirname,'vox.html'));
  const name=process.argv[2], data=JSON.parse(fs.readFileSync(path.join(__dirname,name+'_vox.json')));
  const yaws=[-60,-35,-15,0,15,35,60,90];
  for(const y of yaws){ const u=await p.evaluate(([d,y])=>render(d,y*Math.PI/180,0),[data,y]);
    fs.writeFileSync(path.join(__dirname,'out',`${name}_y${y}.png`),Buffer.from(u.split(',')[1],'base64')); }
  await b.close(); })();
